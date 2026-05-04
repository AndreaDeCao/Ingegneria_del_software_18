const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: String,
  cognome: String,
  email: { type: String, unique: true },
  nickname: String,
  test: { type: String, optional: true }
});

module.exports = mongoose.model("User", UserSchema);