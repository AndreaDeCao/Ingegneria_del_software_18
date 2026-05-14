const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: false },
  email: { type: String, unique: true, required: true },
  nickname: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: false, select: false },
  googleId: { type: String, unique: true, sparse: true, required: false},
  githubId: { type: String, unique: true, sparse: true, required: false }, // per utenti registrati con GitHub OAuth2
  turnstileToken: { type: String, required: false }, // per memorizzare il token Turnstile, se necessario
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
