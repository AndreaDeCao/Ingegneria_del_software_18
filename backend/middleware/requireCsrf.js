/**
 * Protezione CSRF minimale (double submit cookie):
 * - GET /api/auth/csrf setta cookie `csrf_token` (NON httpOnly) e ritorna { csrfToken }
 * - Il frontend invia lo stesso valore in header `X-CSRF-Token`
 * - Qui verifichiamo che cookie e header coincidano
 */
module.exports = function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF token mancante o non valido" });
  }

  next();
};

