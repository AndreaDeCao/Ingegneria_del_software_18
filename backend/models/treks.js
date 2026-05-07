const mongoose = require("mongoose");

const TrekSchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["Facile", "Medio", "Difficile"]
  },
  duration: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("Trek", TrekSchema);