const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  trek: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vote: { type: Number, min: 1, max: 5, required: true },
  note: { type: String, maxlength: 500, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


RatingSchema.index({ trek: 1, user: 1 }, { unique: true }); //serve per rendere unica l'associazione user trek rating

module.exports = mongoose.model("Rating", RatingSchema);