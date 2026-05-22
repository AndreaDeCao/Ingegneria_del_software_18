const fetch = require("node-fetch"); // già presente nel progetto probabilmente, altrimenti: npm install node-fetch

const ORS_API_KEY = process.env.ORS_API_KEY;
const ORS_BASE = "https://api.openrouteservice.org/v2/directions";

/**
 * Calcola il percorso tra due coordinate usando OpenRouteService.
 * @param {number} startLat
 * @param {number} startLon
 * @param {number} endLat
 * @param {number} endLon
 * @param {string} profile - es. "foot-hiking"
 * @returns {object} GeoJSON FeatureCollection con il tracciato
 */
async function getRoute(startLat, startLon, endLat, endLon, profile = "foot-hiking") {
  const url = `${ORS_BASE}/${profile}/geojson`;

  const body = {
    coordinates: [
      [startLon, startLat], // ORS vuole [lon, lat]
      [endLon, endLat],
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ORS_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ORS error ${response.status}: ${err}`);
  }

  return await response.json(); // GeoJSON FeatureCollection
}

module.exports = { getRoute };