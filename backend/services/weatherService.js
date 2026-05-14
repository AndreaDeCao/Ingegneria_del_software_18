/*
const stations = require("../data/meteoStations.json");

// distanza semplice (va benissimo per progetto universitario)
function distance(lat1, lon1, lat2, lon2) {
    return Math.sqrt(
        Math.pow(lat1 - lat2, 2) +
        Math.pow(lon1 - lon2, 2)
    );
}

function findClosestStation(lat, lon) {
    let best = null;
    let bestDist = Infinity;

    for (const s of stations) {
        const d = distance(lat, lon, s.lat, s.lon);

        if (d < bestDist) {
            bestDist = d;
            best = s;
        }
    }

    return best;
}

function parseForecast(data) {
    // prende la prima previsione disponibile in modo SAFE
    const firstKey = Object.keys(data).find(k => k !== "start" && k !== "end");
    const group = data[firstKey];

    const secondKey = Object.keys(group)[0];
    const forecast = group[secondKey];

    return {
        temperature: forecast.temperature,
        wind: forecast.wind_speed,
        rain: forecast.rain_probability,
        snowLevel: forecast.snow_level,
        sky: forecast.sky_condition
    };
}

async function getWeather(lat, lon) {
    const station = findClosestStation(lat, lon);

    if (!station) {
        throw new Error("No station found");
    }

    const res = await fetch(station.url);
    const data = await res.json();

    return {
        station: station.name_ita,
        ...parseForecast(data)
    };
}

module.exports = { getWeather }; */