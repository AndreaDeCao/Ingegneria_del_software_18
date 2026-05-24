const https = require("https");

const ORS_API_KEY = process.env.ORS_API_KEY;

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`ORS ${res.statusCode}: ${raw}`));
        } else {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error("Risposta ORS non è JSON valido")); }
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function getRoute(startLat, startLon, endLat, endLon, profile = "foot-hiking") {
  return httpsPost(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    {
      coordinates: [
        [startLon, startLat],
        [endLon, endLat],
      ],
    },
    { Authorization: ORS_API_KEY }
  );
}

async function getRouteWithProfile(startLat, startLon, endLat, endLon, profile) {
  return httpsPost(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    { coordinates: [[startLon, startLat], [endLon, endLat]] },
    { Authorization: ORS_API_KEY }
  );
}

/**
 * Cerca il parcheggio più vicino via Overpass API.
 * Usa GET con query string invece di POST form-encoded,
 * che è il formato più compatibile con tutti i server Overpass.
 */
async function getNearestParking(lat, lon, radiusMeters = 3000) {
  const query = `[out:json][timeout:15];node["amenity"="parking"](around:${radiusMeters},${lat},${lon});out body 3;`;

  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ data: query });
    const path = `/api/interpreter?${params.toString()}`;

    const options = {
      hostname: "overpass-api.de",
      path,
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "DoloMate/1.0 (trekking app)",
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        if (res.statusCode === 429 || res.statusCode === 503) {
          return reject(new Error(`Overpass non disponibile (HTTP ${res.statusCode}) - riprova tra qualche secondo`));
        }
        if (res.statusCode >= 400) {
          return reject(new Error(`Overpass HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
        }
        if (!raw.trimStart().startsWith("{")) {
          const preview = raw.slice(0, 120).replace(/\n/g, " ");
          return reject(new Error(`Overpass risposta HTML (probabilmente sovraccarico): ${preview}`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`Overpass JSON malformato: ${e.message}`));
        }
      });
    });

    req.setTimeout(18000, () => {
      req.destroy(new Error("Overpass timeout (18s)"));
    });

    req.on("error", (err) => {
      reject(new Error(`Overpass errore di rete: ${err.message}`));
    });

    req.end();
  });
}

module.exports = { getRoute, getRouteWithProfile, getNearestParking };