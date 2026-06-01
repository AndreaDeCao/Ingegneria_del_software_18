const Activity = require("../models/activities");

// GET tutti le attivita
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    const now = new Date();
    activities.forEach(async (activity) => {
      if (activity.status === "Aperto" && activity.activityDate < now) {
        activity.status = "Chiuso";
        await activity.save();
      }
    });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET attività per ID — popola partecipantList con nickname ed email
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity
      .findById(req.params.id)
      .populate("partecipantList", "nickname email nome cognome")
      .populate("suspendedBy", "nickname email");

    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    const now = new Date();

    if (activity.status === "Aperto" && activity.activityDate < now) {
      activity.status = "Chiuso";
      await activity.save();
    }

    res.json(activity);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

// POST crea attività — aggiunge l'organizzatore come primo partecipante
exports.createActivity = async (req, res) => {
  try {
    const organizerID = req.body.organizerID;

    const newActivity = new Activity({
      ...req.body,
      partecipantList: organizerID ? [organizerID] : [],
    });

    if (newActivity.partecipantList.length == 1 && newActivity.maxParticipants == 1) {
      newActivity.status = "Chiuso";
    }

    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /activities/:id/join — aggiunge l'utente loggato alla partecipantList
exports.joinActivity = async (req, res) => {
  try {
    const userID = req.user?._id || req.body.userID;
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.status !== "Aperto") {
      return res.status(400).json({ error: "L'attività non è aperta alle iscrizioni" });
    }

    if (activity.organizerID?.toString() === userID.toString()) {
      return res.status(400).json({ error: "Sei l'organizzatore di questa attività" });
    }

    const alreadyJoined = activity.partecipantList.some(
      (p) => p.toString() === userID.toString()
    );
    if (alreadyJoined) {
      return res.status(400).json({ error: "Sei già iscritto a questa attività" });
    }

    if (activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "L'attività ha raggiunto il numero massimo di partecipanti" });
    }

    activity.partecipantList.push(userID);

    if (activity.partecipantList.length >= activity.maxParticipants) {
      activity.status = "Chiuso";
    }

    await activity.save();

    const updated = await Activity
      .findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

// POST /activities/:id/leave
exports.leaveActivity = async (req, res) => {
  try {
    const userID = req.user?._id || req.body.userID;
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.organizerID?.toString() === userID.toString()) {
      return res.status(400).json({ error: "L'organizzatore non può abbandonare l'attività" });
    }

    const before = activity.partecipantList.length;
    activity.partecipantList = activity.partecipantList.filter(
      (p) => p.toString() !== userID.toString()
    );
    if (activity.partecipantList.length === before) {
      return res.status(400).json({ error: "Non sei iscritto a questa attività" });
    }

    if (activity.status === "Chiuso" && activity.partecipantList.length < activity.maxParticipants) {
      activity.status = "Aperto";
    }

    await activity.save();

    const updated = await Activity
      .findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/cancel — solo organizzatore (bloccato se sospesa)
exports.cancelActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può annullare l'attività" });
    }
    if (activity.suspended) {
      return res.status(403).json({ error: "Attività sospesa dall'amministrazione — non puoi modificarne lo stato" });
    }
    if (activity.status === "Annullato") {
      return res.status(400).json({ error: "Attività già annullata" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Annullato" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/uncancel — solo organizzatore (bloccato se sospesa)
exports.uncancelActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può riattivare l'attività" });
    }
    if (activity.suspended) {
      return res.status(403).json({ error: "Attività sospesa dall'amministrazione — non puoi modificarne lo stato" });
    }
    if (activity.status === "Chiuso" || activity.status === "Aperto") {
      return res.status(400).json({ error: "Attività già attiva" });
    }

    const newStatus = activity.partecipantList.length >= activity.maxParticipants
      ? "Chiuso"
      : "Aperto";

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: newStatus } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

exports.closeActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può chiudere l'attività" });
    }
    if (activity.suspended) {
      return res.status(403).json({ error: "Attività sospesa dall'amministrazione — non puoi modificarne lo stato" });
    }
    if (activity.status === "Chiuso") {
      return res.status(400).json({ error: "Attività già chiusa" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Chiuso" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

exports.openActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può aprire l'attività" });
    }
    if (activity.suspended) {
      return res.status(403).json({ error: "Attività sospesa dall'amministrazione — non puoi modificarne lo stato" });
    }
    if (activity.status === "Aperto") {
      return res.status(400).json({ error: "Attività già aperta" });
    }
    if (activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "Non puoi aprire l'attività perché ha già raggiunto il numero massimo di partecipanti" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Aperto" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// DELETE /activities/:id — organizzatore o admin
exports.deleteActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    const userRole = req.user?.role || req.body.userRole;
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const isAdmin = userRole === "admin";
    const isOrganizer = activity.organizerID?.toString() === userID;

    if (!isAdmin && !isOrganizer) {
      return res.status(403).json({ error: "Solo l'organizzatore o un amministratore può eliminare l'attività" });
    }

    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: "Attività eliminata definitivamente" });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// ── ADMIN ────────────────────────────────────────────────────────────────────

// PATCH /activities/:id/suspend — solo admin
// Sospende l'attività: blocca tutte le azioni dell'organizzatore sullo status.
// Il campo `reason` è opzionale ma consigliato: viene mostrato all'organizzatore nel banner.
exports.suspendActivity = async (req, res) => {
  try {
    const adminID = req.user?._id?.toString() || req.body.userID?.toString();
    const userRole = req.user?.role || req.body.userRole;
    if (!adminID) return res.status(401).json({ error: "Non autenticato" });
    if (userRole !== "admin") return res.status(403).json({ error: "Accesso riservato agli amministratori" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.suspended) return res.status(400).json({ error: "Attività già sospesa" });

    const reason = req.body.reason?.trim() || "";

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          suspended: true,
          statusBeforeSuspend: activity.status, // salva lo status attuale per ripristinarlo all'unsuspend
          status: "Annullato",
          suspendedReason: reason,
          suspendedBy: adminID,
          suspendedAt: new Date(),
        },
        $push: {
          adminLog: { adminID, action: "suspend", reason, date: new Date() },
        },
      },
      { returnDocument: "after" }
    )
      .populate("partecipantList", "nickname email nome cognome")
      .populate("suspendedBy", "nickname email");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/unsuspend — solo admin
// Rimuove la sospensione e ripristina il normale funzionamento per l'organizzatore.
exports.unsuspendActivity = async (req, res) => {
  try {
    const adminID = req.user?._id?.toString() || req.body.userID?.toString();
    const userRole = req.user?.role || req.body.userRole;
    if (!adminID) return res.status(401).json({ error: "Non autenticato" });
    if (userRole !== "admin") return res.status(403).json({ error: "Accesso riservato agli amministratori" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (!activity.suspended) return res.status(400).json({ error: "Attività non è sospesa" });

    const reason = req.body.reason?.trim() || "";

    // Ripristina lo status salvato prima della sospensione; fallback a "Aperto" se mancante
    const restoredStatus = activity.statusBeforeSuspend || "Aperto";

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          suspended: false,
          status: restoredStatus,
          statusBeforeSuspend: null,
          suspendedReason: "",
          suspendedBy: null,
          suspendedAt: null,
        },
        $push: {
          adminLog: { adminID, action: "unsuspend", reason, date: new Date() },
        },
      },
      { returnDocument: "after" }
    )
      .populate("partecipantList", "nickname email nome cognome")
      .populate("suspendedBy", "nickname email");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};