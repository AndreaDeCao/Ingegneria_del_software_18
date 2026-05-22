const mongoose = require("mongoose");

const TrekSchema = new mongoose.Schema({ //fatti circa 70 sentieri
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Facile", "Medio", "Difficile"]
  },
  description: String,
  SatRouteNumber: String,   // Numero percorso SAT (es: E101)

  duration: String,       // Durata stimata in ore (es: "3 ore")
  lengthKm: Number,    // Lunghezza del trekking in km
  elevationGain: String,     // Dislivello in metri

  /*tracciaGPX: String,     // URL o percorso del file GPX
  mappaOffline: String,*/   // URL o percorso del file mappa offline
  comuni: [{ type: String }],
  startPoint: String,  // Indirizzo o coordinate GPS del punto di partenza
  endPoint: String,    // Indirizzo o coordinate GPS del punto di arrivo
  
  minAltitude: Number, // Quota minima in metri
  maxAltitude: Number, // Quota massima in metri
  coordinates: {                                     // Coordinate GPS
    lat: Number,
    lon: Number,
  },

  endCoordinates: {                                     // Coordinate GPS del punto di arrivo
    lat: Number,
    lon: Number,
  },

  /*meteoLocationId: String,  // ID per identificare la località meteo associata al trek*/

  condizioniAttuali: String,  // Condizioni meteo/percorribilità

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("Trek", TrekSchema);

// https://www.sat.tn.it/wp-content/uploads/2026/03/7.-Catasto-SAT-al-30.11.2025.pdf