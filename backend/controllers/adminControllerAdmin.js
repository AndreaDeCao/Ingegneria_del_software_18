const User = require("../models/users");

/**
 * Restituisce tutti gli utenti con campi rilevanti.
 *
 * @route GET /api/admin/users
 * @returns {Promise<void>} JSON array di utenti
 */
exports.getUsers = async (req, res) => {
  try {
    const { search, status } = req.query;

    const query = {};

    if(search?.trim()) {
      const re = new RegExp(search.trim(), "i");
      query.$or = [
        { nickname: re },
        { nome: re },
        { cognome: re },
        { email: re }
      ];
    }

    if(status === "banned") {
      query.isBanned = true;
    } else if(status === "suspended") {
      query.isSuspended = true;
    } else if(status === "active") {
      query.isBanned = false;
    }

    const user = await User.find(query)
      .where("role").equals("user")
      .select("_id nome cognome nickname email role avatarUrl isBanned isSuspended suspendedUntil createdAt reports");

    res.json(user);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce un singolo utente con i reports.
 *
 * @route GET /api/admin/users/:id
 * @returns {Promise<void>} JSON utente
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    .select("_id nome cognome nickname email avatarUrl isBanned isSuspended suspendedUntil createdAt reports")
    .populate("reports.reportedBy", "nickname email");

    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json(user);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Sospende un utente per un numero di giorni.
 *
 * @route PATCH /api/admin/users/:id/suspend
 * @param {import("express").Request} req - Body: { days }
 * @returns {Promise<void>} JSON con messaggio
 */
exports.suspendUser = async (req, res) => {
  try {
    const { days } = req.body;
    if(!days || isNaN(days) || days <= 0) {
      return res.status(400).json({ error: "Numero di giorni non valido" });
    }

    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    if(user.isBanned) {
      return res.status(400).json({ error: "Utente già bannato" });
    }

    user.isSuspended = true;
    user.suspendedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await user.save({ validateModifiedOnly: true });

    res.json({ message: `Utente sospeso per ${days} giorni` });

  } catch(err) {
     res.status(500).json({ error: err.message });
  }
};


/**
 * Rimuove la sospensione di un utente.
 *
 * @route PATCH /api/admin/users/:id/unsuspend
 * @returns {Promise<void>} JSON con messaggio
 */
exports.unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    user.isSuspended = false;
    user.suspendedUntil = null;
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Sospensione rimossa" });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Banna permanentemente un utente.
 *
 * @route PATCH /api/admin/users/:id/ban
 * @returns {Promise<void>} JSON con messaggio
 */
exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    user.isBanned = true;
    user.isSuspended = false;
    user.suspendedUntil = null;
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Utente bannato" })

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Rimuove il ban di un utente.
 * 
 * @route PATCH /api/admin/users/:id/unban
 * @returns {Promise<void>} JSON con messaggio
 */
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    user.isBanned = false;
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Ban rimosso" });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Accetta o rigetta una segnalazione su un utente.
 *
 * @route PATCH /api/admin/users/:id/reports/:reportId/:action
 * @param action "accept" | "dismiss"
 * @returns {Promise<void>} JSON utente aggiornato
 */
exports.handleUserReport = async (req, res) => {
  try {
    const { action } = req.params;
    if(!["accept", "dismiss"].includes(action)) {
      return res.status(400).json({ error: "Azione non valida" });
    }
  
  const user = await User.findById(req.params.id);
  if(!user) {
     return res.status(404).json({ error: "Utente non trovato" });
  }

  const report = user.reports.id(req.params.reportId);
  if(!report) {
    return res.status(404).json({ error: "Segnalazione non trovata" });
  }

  report.reportStatus = action === "accept" ? "accepted" : "dismissed";
  report.reviewedBy = req.userId;
  report.reviewedAt = new Date();

  await user.save({ validateModifiedOnly: true });

  res.json(user);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};