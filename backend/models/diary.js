const mongoose = require("mongoose");


const DiaryEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },//FIXME: controllare che la prima lettera sia minuscola, altrimenti da errore di riferimento circolare
  trekId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek', required: false },//FIXME: controllare che la prima lettera sia minuscola, altrimenti da errore di riferimento circolare
  titolo: { type: String, required: true },
  data: { type: Date, required: true },
  note: String,
  foto: [{type: String}], // Array di URL o percorsi delle foto
  valutazione: { type: Number, min: 1, max: 5 },
  completato: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("DiaryEntry", DiaryEntrySchema);