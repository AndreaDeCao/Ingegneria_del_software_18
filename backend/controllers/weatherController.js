const axios = require("axios");

const Trek = require("../models/treks");

const meteoLocations = require("../data/meteoLocations.json");

function calculateDistance(lat1, lon1, lat2, lon2) {
  return Math.sqrt(
    Math.pow(lat1 - lat2, 2) +
    Math.pow(lon1 - lon2, 2)
  );
}

async function getWeatherByTrek(req, res) {
  try {
    const { trekId } = req.params;

    // 1. Recupera trek dal database
    const trek = await Trek.findById(trekId);

    if (!trek) {
      return res.status(404).json({
        error: "Percorso non trovato",
      });
    }

    // 2. Coordinate trek
    const trekLat = Number(trek.coordinates.lat);
    const trekLon = Number(trek.coordinates.lon);

    // 3. Trova località meteo più vicina
    //FIXME: non considera l'altitudine
    let closestLocation = null;
    let minDistance = Infinity;

    for (const location of meteoLocations) {
      const distance = calculateDistance(
        trekLat,
        trekLon,
        location.lat,
        location.lon
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestLocation = location;
      }
    }

    if (!closestLocation) { 
      return res.status(404).json({
        error: "Località meteo non trovata",
      });
    }

    // 4. Scarica meteo
    const weatherResponse = await axios.get(
      closestLocation.url
    );

    // 5. Risposta finale
    res.json({
      trek: trek.name,
      meteoLocation: closestLocation.name_ita,
      weather: weatherResponse.data,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Errore recupero meteo",
    });
  }
}

module.exports = {
  getWeatherByTrek,
};