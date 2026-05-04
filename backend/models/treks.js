const mongoose = require("mongoose");

const TrekSchema = new mongoose.Schema({
  id: Number,
  name: String,
  difficulty: String,
  duration: String
});

module.exports = mongoose.model("Trek", TrekSchema);