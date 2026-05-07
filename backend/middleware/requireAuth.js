const jwt = require("jsonwebtoken");
const User = require("../models/users");

/**
 * Middleware per richiedere l'autenticazione dell'utente
 * @param {*} req si aspetta un token JWT
 * @param {*} res status 401 se non autenticato, altrimenti aggiunge req.user con i dati dell'utente e chiama next()
 * @param {*} next se l'autenticazione va a buon fine, altrimenti non viene chiamato
 * @returns status 401 se non autenticato, altrimenti chiama next() e aggiunge req.user con i dati dell'utente
 */
module.exports = async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Non autenticato" });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "JWT_SECRET non configurata" });

    const payload = jwt.verify(token, secret);
    const userId = payload?.sub;
    if (!userId) return res.status(401).json({ error: "Token non valido" });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "Utente non trovato" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Non autenticato" });
  }
};

