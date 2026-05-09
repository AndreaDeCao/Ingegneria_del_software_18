const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  nickname: { type: String, unique: true, required: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, unique: true, sparse: true},
  test: { type: String, optional: true }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
