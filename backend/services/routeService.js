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

module.exports = { getRoute };