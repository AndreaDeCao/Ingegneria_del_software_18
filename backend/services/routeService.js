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
 * Prova overpass-api.de, poi mirror alternativi se riceve
 * ECONNRESET / timeout / 429 / 503.
 */
const OVERPASS_HOSTS = [
  "overpass-api.de",
  "overpass.kumi.systems",
];

function overpassRequest(hostname, query, timeoutMs = 18000) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ data: query });
    const path = `/api/interpreter?${params.toString()}`;

    const options = {
      hostname,
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
          return reject(new Error(`HTTP_RETRY:${res.statusCode}`));
        }
        if (res.statusCode >= 400) {
          return reject(new Error(`Overpass HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
        }
        if (!raw.trimStart().startsWith("{")) {
          return reject(new Error(`HTML_RETRY:sovraccarico`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`Overpass JSON malformato: ${e.message}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`CONN_RETRY:timeout ${timeoutMs}ms`));
    });

    req.on("error", (err) => {
      // ECONNRESET, ECONNREFUSED, ETIMEDOUT → ritenta sul mirror
      reject(new Error(`CONN_RETRY:${err.message}`));
    });

    req.end();
  });
}

async function getNearestParking(lat, lon, radiusMeters = 3000) {
  const query = `[out:json][timeout:15];node["amenity"="parking"](around:${radiusMeters},${lat},${lon});out body 3;`;

  let lastError;
  for (const host of OVERPASS_HOSTS) {
    try {
      const result = await overpassRequest(host, query);
      return result;
    } catch (err) {
      lastError = err;
      const msg = err.message ?? "";
      const retryable = msg.startsWith("CONN_RETRY:") || msg.startsWith("HTTP_RETRY:") || msg.startsWith("HTML_RETRY:");
      if (!retryable) throw err;  // errore definitivo, non ritentare
      console.warn(`[Overpass] ${host} fallito (${msg}), provo mirror successivo…`);
    }
  }
  throw new Error(`Overpass non raggiungibile: ${lastError?.message}`);
}

module.exports = { getRoute, getRouteWithProfile, getNearestParking };