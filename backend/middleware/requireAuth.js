const jwt = require("jsonwebtoken");
const User = require("../models/users");

 
function getJwtSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET non configurata in backend/.env");
  return secret;
}
 
/**
 * Middleware che verifica il Bearer token nell'header Authorization.
 * Se valido, setta req.userId e chiama next().
 * Usalo su tutte le route protette: router.get("/treks", authenticate, getTreks)
 */
module.exports = async function authenticate(req, res, next) {
  const header = req.headers.authorization;
 
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token mancante" });
  }
 
  const token = header.slice(7); // rimuove "Bearer "
 
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.userId = payload.sub;
    req.userRole = payload.role ?? "user"; // se vuoi gestire i ruoli, puoi includere il ruolo nel payload del token e leggerlo qui

    const user = await User.findById(req.userId).select("isBanned isSuspended suspendedUntil role");
    if (!user) return res.status(401).json({ error: "Utente non trovato" });

    if (user.isBanned) {
      return res.status(403).json({ error: "banned", message: "Il tuo account è stato bannato." });
    }

    if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) {
      return res.status(403).json({ 
        error: "suspended", 
        message: "Il tuo account è sospeso.",
        suspendedUntil: user.suspendedUntil
      });
    }

    if (user.isSuspended && (!user.suspendedUntil || new Date(user.suspendedUntil) <= new Date())) {
      user.isSuspended = false;
      user.suspendedUntil = null;
      await user.save({ validateModifiedOnly: true });
    }

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token scaduto" });
    }
    return res.status(401).json({ error: "Token non valido" });
  }
};

// /**
//  * Middleware per richiedere l'autenticazione dell'utente
//  * @param {*} req si aspetta un token JWT
//  * @param {*} res status 401 se non autenticato, altrimenti aggiunge req.user con i dati dell'utente e chiama next()
//  * @param {*} next se l'autenticazione va a buon fine, altrimenti non viene chiamato
//  * @returns status 401 se non autenticato, altrimenti chiama next() e aggiunge req.user con i dati dell'utente
//  */
// module.exports = async function requireAuth(req, res, next) {
//   try { 
//     const token = req.cookies?.token;
//     if (!token) return res.status(401).json({ error: "Non autenticato" });

//     const secret = process.env.JWT_SECRET;
//     if (!secret) return res.status(500).json({ error: "JWT_SECRET non configurata" });

//     const payload = jwt.verify(token, secret);
//     const userId = payload?.sub;
//     if (!userId) return res.status(401).json({ error: "Token non valido" });

//     const user = await User.findById(userId);
//     if (!user) return res.status(401).json({ error: "Utente non trovato" });

//     req.user = user;
//     next();
//   } catch {
//     return res.status(401).json({ error: "Non autenticato" });
//   }
// };



