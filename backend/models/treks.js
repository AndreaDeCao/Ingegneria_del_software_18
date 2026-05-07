const mongoose = require("mongoose");

const TrekSchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Facile", "Medio", "Difficile"]
  },
  description: String,
  nPercorsoSAT: String,   // Numero percorso SAT (es: E101)

  duration: String,       // Durata stimata in ore (es: "3 ore")
  lunghezzaKm: Number,    // Lunghezza del trekking in km
  dislivello: Number,     // Dislivello in metri

  tracciaGPX: String,     // URL o percorso del file GPX
  mappaOffline: String,   // URL o percorso del file mappa offline
  puntoPartenza: String,  // Indirizzo o coordinate GPS del punto di partenza
  puntoArrivo: String,    // Indirizzo o coordinate GPS del punto di arrivo

  condizioniAttuali: String,  // Condizioni meteo/percorribilità

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("Trek", TrekSchema);