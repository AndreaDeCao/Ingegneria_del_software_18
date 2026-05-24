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
 * GET /api/route/:id/variants?startLat=&startLon=
 *
 * Restituisce 4 varianti di percorso per tipo di mezzo/profilo ORS,
 * SENZA modificare il punto di partenza:
 *   1. foot-hiking   — sentiero ufficiale
 *   2. foot-walking  — a piedi su strada/valle
 *   3. cycling-mountain — MTB
 *   4. cycling-road  — bici da strada
 *
 * Il punto di partenza può essere sovrascritto via query string (startLat/startLon),
 * per ricalcolare le varianti dopo che l'utente ha scelto una partenza personalizzata.
 */
exports.getRouteVariants = async (req, res) => {
  try {
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ error: "Percorso non trovato" });

    const { lat: endLat, lon: endLon } = trek.endCoordinates ?? trek.coordinates;

    // Usa la partenza passata via query string, altrimenti quella del DB
    const startLat = req.query.startLat ? parseFloat(req.query.startLat) : trek.coordinates.lat;
    const startLon = req.query.startLon ? parseFloat(req.query.startLon) : trek.coordinates.lon;

    if (isNaN(startLat) || isNaN(startLon)) {
      return res.status(400).json({ error: "Coordinate partenza non valide" });
    }

    // --- 4 varianti per tipo di percorso (stessa partenza, profilo diverso) ---
    const variants = [
      { key: "walk_official",  label: "🥾 Sentiero ufficiale",       profile: "foot-hiking" },
      { key: "walk_road",      label: "🚶 A piedi (strada/valle)",    profile: "foot-walking" },
      { key: "bike_mountain",  label: "🚵 MTB (mountain bike)",       profile: "cycling-mountain" },
      { key: "bike_road",      label: "🚴 Bici da strada",            profile: "cycling-road" },
    ];

    // --- Calcola tutti i percorsi in parallelo ---
    const results = await Promise.allSettled(
      variants.map(v => getRouteWithProfile(startLat, startLon, endLat, endLon, v.profile))
    );

    const variantsData = variants.map((v, i) => {
      const r = results[i];
      if (r.status === "rejected") {
        return {
          key: v.key, label: v.label, profile: v.profile,
          startLat, startLon, error: true,
          errorMessage: r.reason?.message ?? "Errore calcolo percorso",
        };
      }
      const summary = r.value?.features?.[0]?.properties?.summary ?? {};
      return {
        key: v.key, label: v.label, profile: v.profile,
        startLat, startLon,
        distanceMeters: summary.distance ?? null,
        durationSeconds: summary.duration ?? null,
        geojson: r.value,
      };
    });

    res.json({ variants: variantsData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/route/:id/parking
 *
 * Cerca il parcheggio più vicino al punto di partenza del trek (o a coordinate custom)
 * e restituisce il percorso foot-hiking dal parcheggio all'arrivo.
 * Usato solo quando l'utente vuole cambiare il punto di partenza al parcheggio.
 */
exports.getNearestParkingRoute = async (req, res) => {
  try {
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ error: "Percorso non trovato" });

    const { lat: endLat, lon: endLon } = trek.endCoordinates ?? trek.coordinates;
    const baseLat = trek.coordinates.lat;
    const baseLon = trek.coordinates.lon;

    let parkingLat = null, parkingLon = null, parkingLabel = null;

    try {
      const overpass = await getNearestParking(baseLat, baseLon);
      const elements = overpass?.elements ?? [];
      if (elements.length > 0) {
        const node = elements[0];
        parkingLat = node.lat;
        parkingLon = node.lon;
        const name = node.tags?.name;
        const capacity = node.tags?.capacity;
        const access = node.tags?.access;
        let label = name ?? "Parcheggio";
        if (capacity) label += ` (${capacity} posti)`;
        if (access && access !== "yes") label += ` [${access}]`;
        parkingLabel = label;
      }
    } catch (overpassErr) {
      console.warn("Overpass error:", overpassErr.message);
    }

    if (parkingLat === null) {
      return res.status(404).json({ error: "Nessun parcheggio trovato entro 3 km dalla partenza" });
    }

    const geojson = await getRouteWithProfile(parkingLat, parkingLon, endLat, endLon, "foot-hiking");
    const summary = geojson?.features?.[0]?.properties?.summary ?? {};

    res.json({
      label: `🅿 ${parkingLabel}`,
      startLat: parkingLat,
      startLon: parkingLon,
      distanceMeters: summary.distance ?? null,
      durationSeconds: summary.duration ?? null,
      geojson,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};