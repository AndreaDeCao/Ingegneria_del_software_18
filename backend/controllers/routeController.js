const Trek = require("../models/treks");
const { getRoute } = require("../services/routeService");

/**
 * GET /api/route/:id
 * Restituisce il tracciato GeoJSON per un trek dato il suo id.
 * Usa le coordinate di partenza e arrivo dal documento Trek.
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