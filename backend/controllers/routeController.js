const Trek = require("../models/treks");
const { getRoute, getRouteWithProfile, getNearestParking } = require("../services/routeService");

/**
 * GET /api/route/:id
 * Restituisce il tracciato GeoJSON per un trek dato il suo id.
 */
exports.getRouteByTrekId = async (req, res) => {
  try {
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ error: "Trek non trovato" });

    const start = trek.coordinates;
    const end = trek.endCoordinates;

    if (!start || !end) {
      return res.status(400).json({ error: "Coordinate mancanti" });
    }

    const geojson = await getRoute(start.lat, start.lon, end.lat, end.lon);
    const summary = geojson.features?.[0]?.properties?.summary ?? {};

    res.json({
      geojson,
      distanceMeters: summary.distance ?? null,
      durationSeconds: summary.duration ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/route/:id/custom?startLat=&startLon=
exports.getRouteCustomStart = async (req, res) => {
  try {
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ error: "Trek non trovato" });

    const end = trek.endCoordinates;
    if (!end) return res.status(400).json({ error: "Coordinate arrivo mancanti" });

    const startLat = parseFloat(req.query.startLat);
    const startLon = parseFloat(req.query.startLon);

    if (isNaN(startLat) || isNaN(startLon)) {
      return res.status(400).json({ error: "Coordinate partenza non valide" });
    }

    const geojson = await getRoute(startLat, startLon, end.lat, end.lon);
    const summary = geojson.features?.[0]?.properties?.summary ?? {};

    res.json({
      geojson,
      distanceMeters: summary.distance ?? null,
      durationSeconds: summary.duration ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/route/:id/suggestions
 *
 * Restituisce varianti di percorso REALI, distinte per profilo ORS:
 *   1. foot-hiking   — sentiero ufficiale (partenza dal DB)
 *   2. foot-walking  — a piedi su strada/valle (stessa partenza, profilo diverso)
 *   3. cycling-mountain — MTB (stessa partenza)
 *   4. cycling-road     — bici da strada (stessa partenza)
 *   5. parking          — parcheggio più vicino → foot-hiking
 *
 * Le varianti 1-4 hanno STESSO punto di partenza ma profilo diverso,
 * così ORS calcola percorsi diversi lungo strade/sentieri diversi.
 * La variante 5 parte dal parcheggio più vicino trovato via Overpass.
 */
exports.getRouteSuggestions = async (req, res) => {
  try {
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ error: "Percorso non trovato" });

    const { lat: endLat, lon: endLon } = trek.endCoordinates ?? trek.coordinates;
    const { lat: startLat, lon: startLon } = trek.coordinates;

    // --- Parcheggio più vicino via Overpass ---
    let parkingLat = null;
    let parkingLon = null;
    let parkingLabel = null;

    try {
      const overpass = await getNearestParking(startLat, startLon);
      const elements = overpass?.elements ?? [];

      if (elements.length > 0) {
        // Prende il primo risultato (Overpass li restituisce già in ordine di distanza)
        const node = elements[0];
        parkingLat = node.lat;
        parkingLon = node.lon;

        // Compone un nome leggibile anche se manca il tag name
        const name = node.tags?.name;
        const access = node.tags?.access; // private / customers / yes
        const capacity = node.tags?.capacity;

        let label = name ?? "Parcheggio";
        if (capacity) label += ` (${capacity} posti)`;
        if (access && access !== "yes") label += ` [${access}]`;
        parkingLabel = label;
      }
    } catch (overpassErr) {
      // fallback: la variante parcheggio viene marcata come non disponibile
      console.warn("Overpass error:", overpassErr.message);
    }

    // --- Definizione varianti ---
    const variants = [
      {
        key: "walk_official",
        label: "🥾 Sentiero ufficiale",
        profile: "foot-hiking",
        startLat,
        startLon,
      },
      {
        key: "walk_road",
        label: "🚶 A piedi (strada/valle)",
        profile: "foot-walking",
        startLat,
        startLon,
      },
      {
        key: "bike_mountain",
        label: "🚵 MTB (mountain bike)",
        profile: "cycling-mountain",
        startLat,
        startLon,
      },
      {
        key: "bike_road",
        label: "🚴 Bici da strada",
        profile: "cycling-road",
        startLat,
        startLon,
      },
      // Variante parcheggio: inclusa solo se Overpass ha trovato qualcosa
      ...(parkingLat !== null
        ? [{
            key: "parking",
            label: `🅿 ${parkingLabel}`,
            profile: "foot-hiking",
            startLat: parkingLat,
            startLon: parkingLon,
          }]
        : []),
    ];

    // --- Calcola tutti i percorsi in parallelo ---
    const results = await Promise.allSettled(
      variants.map(v =>
        getRouteWithProfile(v.startLat, v.startLon, endLat, endLon, v.profile)
      )
    );

    const suggestions = variants.map((v, i) => {
      const r = results[i];

      if (r.status === "rejected") {
        return {
          key: v.key,
          label: v.label,
          profile: v.profile,
          startLat: v.startLat,
          startLon: v.startLon,
          error: true,
          errorMessage: r.reason?.message ?? "Errore calcolo percorso",
        };
      }

      const summary = r.value?.features?.[0]?.properties?.summary ?? {};

      return {
        key: v.key,
        label: v.label,
        profile: v.profile,
        startLat: v.startLat,
        startLon: v.startLon,
        distanceMeters: summary.distance ?? null,
        durationSeconds: summary.duration ?? null,
        geojson: r.value,
      };
    });

    // Se Overpass non ha trovato parcheggio, aggiungi voce placeholder disabilitata
    if (parkingLat === null) {
      suggestions.push({
        key: "parking",
        label: "🅿 Parcheggio (non trovato)",
        profile: "foot-hiking",
        startLat,
        startLon,
        error: true,
        errorMessage: "Nessun parcheggio trovato entro 3 km dalla partenza",
      });
    }

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};