const mongoose = require("mongoose");


const DiaryEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek', required: false },

  titolo: { type: String, required: true },
  data: { type: Date, required: true },
  note: String,
  foto: [{type: String}], // Array di URL o percorsi delle foto, più facile per ora che l'upload reale //FIXME
  valutazione: { type: Number, min: 1, max: 5 },
  completato: { type: Boolean, default: true },

  // percorso personalizzato
  percorsoPersonalizzato: { type: String },
  gpxData: { type: String }, // GeoJSON stringa

  // TODO amici (placeholder, logica amicizia da definire)
  amici: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // segnalazione
  segnalazione: {
    tipo: {
      type: String,
      enum: [
        "Sentiero danneggiato",
        "Neve/ghiaccio",
        "Sentiero chiuso",
        "Fauna pericolosa",
        "Altro"
      ]
    },
    descrizione: { type: String, maxlength: 1000 },

    stato: {
      type: String,
      enum: ["pending", "accepted", "dismissed"],
      default: "pending",
    },
    gestitaDaAdmin: { type: Boolean, default: false },
    gestitaAt:      { type: Date,    default: null },
    gestitaDa:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  }

}, { timestamps: true });

module.exports = mongoose.model("DiaryEntry", DiaryEntrySchema);