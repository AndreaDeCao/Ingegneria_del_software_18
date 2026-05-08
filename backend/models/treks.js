const mongoose = require("mongoose");

const TrekSchema = new mongoose.Schema({ //fatta le prime due pagine (185 sentieri) della lista dei trek SAT, piu avanti si devono aggiungere le altre pagine 
  id: Number,
  name: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Facile", "Medio", "Difficile"]
  },
  description: String,
  SatRouteNumber: String,   // Numero percorso SAT (es: E101)

  duration: String,       // Durata stimata in ore (es: "3 ore")
  lengthKm: Number,    // Lunghezza del trekking in km
  elevationGain: Number,     // Dislivello in metri

  /*tracciaGPX: String,     // URL o percorso del file GPX
  mappaOffline: String,*/   // URL o percorso del file mappa offline
  startPoint: String,  // Indirizzo o coordinate GPS del punto di partenza
  endPoint: String,    // Indirizzo o coordinate GPS del punto di arrivo

  condizioniAttuali: String,  // Condizioni meteo/percorribilità

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("Trek", TrekSchema);

// https://www.sat.tn.it/wp-content/uploads/2026/03/7.-Catasto-SAT-al-30.11.2025.pdf