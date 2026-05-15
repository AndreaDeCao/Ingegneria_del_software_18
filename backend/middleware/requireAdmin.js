const User = require("../models/users");

// middleware/requireAdmin.js
module.exports = function requireAdmin(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Accesso riservato agli amministratori" });
  }
  next();
};