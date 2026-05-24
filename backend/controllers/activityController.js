const Activity = require("../models/activities");

// GET tutti le attivita
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
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
      .populate("partecipantList", "nickname email nome cognome");
 
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
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
      // L'organizzatore è automaticamente il primo partecipante
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
    // L'utente loggato arriva dalla sessione (req.user._id impostato dal middleware auth)
    // Se non hai ancora il middleware attivo, usiamo req.body.userID come fallback temporaneo
    const userID = req.user?._id || req.body.userID;
 
    if (!userID) {
      return res.status(401).json({ error: "Non autenticato" });
    }
 
    const activity = await Activity.findById(req.params.id);
 
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
 
    if (activity.status !== "Aperto") {
      return res.status(400).json({ error: "L'attività non è aperta alle iscrizioni" });
    }
 
    // Controlla se è l'organizzatore
    if (activity.organizerID?.toString() === userID.toString()) {
      return res.status(400).json({ error: "Sei l'organizzatore di questa attività" });
    }
 
    // Controlla se già iscritto
    const alreadyJoined = activity.partecipantList.some(
      (p) => p.toString() === userID.toString()
    );
    if (alreadyJoined) {
      return res.status(400).json({ error: "Sei già iscritto a questa attività" });
    }
 
    // Controlla se ha raggiunto il max partecipanti
    if (activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "L'attività ha raggiunto il numero massimo di partecipanti" });
    }
 
    activity.partecipantList.push(userID);

    // Se raggiunge il massimo partecipanti, chiudi automaticamente
    if (activity.partecipantList.length >= activity.maxParticipants) {
      activity.status = "Chiuso";
    }

    await activity.save();
 
    // Ritorna l'attività aggiornata con i partecipanti popolati
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
    if (activity.organizerID?.toString() === userID.toString()) return res.status(400).json({ error: "L'organizzatore non può abbandonare l'attività" });
 
    const before = activity.partecipantList.length;
    activity.partecipantList = activity.partecipantList.filter((p) => p.toString() !== userID.toString());
    if (activity.partecipantList.length === before) return res.status(400).json({ error: "Non sei iscritto a questa attività" });
 
    // Se non è più piena e non è annullata, riapri automaticamente
    if ( activity.status == "Chiuso" && activity.partecipantList.length < activity.maxParticipants
    ) { activity.status = "Aperto";}

    await activity.save();
 
    const updated = await Activity.findById(activity._id).populate("partecipantList", "nickname email nome cognome");
    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};
 
// PATCH /activities/:id/cancel — solo organizzatore
exports.cancelActivity = async (req, res) => { 
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });
 
    const activity = await Activity.findByIdAndUpdate(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.organizerID?.toString() !== userID) return res.status(403).json({ error: "Solo l'organizzatore può annullare l'attività" });
    if (activity.status === "Annullato") return res.status(400).json({ error: "Attività già annullata" });
 
    // findByIdAndUpdate garantisce scrittura su DB senza problemi di change tracking
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

// PATCH /activities/:id/uncancel — solo organizzatore
exports.uncancelActivity = async (req, res) => { 
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });
 
    const activity = await Activity.findByIdAndUpdate(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.organizerID?.toString() !== userID) return res.status(403).json({ error: "Solo l'organizzatore può riattivare l'attività" });
    if (activity.status == "Chiuso" || activity.status == "Aperto") return res.status(400).json({ error: "Attività già attiva" });

    let newStatus;
    if (activity.partecipantList.length >= activity.maxParticipants) {
      newStatus = "Chiuso";
    } else {
      newStatus = "Aperto";
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: newStatus } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }

    res.status(500).json({ error: err.message });
  }
};

exports.closeActivity = async (req, res) => { 
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });
 
    const activity = await Activity.findByIdAndUpdate(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.organizerID?.toString() !== userID) return res.status(403).json({ error: "Solo l'organizzatore può chiudere l'attività" });
    if (activity.status == "Chiuso") return res.status(400).json({ error: "Attività già chiusa " });

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Chiuso" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }

    res.status(500).json({ error: err.message });
  }
};

exports.openActivity = async (req, res) => { 
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });
 
    const activity = await Activity.findByIdAndUpdate(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.organizerID?.toString() !== userID) return res.status(403).json({ error: "Solo l'organizzatore può aprire l'attività" });
    if (activity.status == "Aperto") return res.status(400).json({ error: "Attività già aperta " });

    if (activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "Non puoi aprire l'attività perché ha già raggiunto il numero massimo di partecipanti" });
    } else {
      const updated = await Activity.findByIdAndUpdate(
        req.params.id,
        { $set: { status: "Aperto" } },
        { returnDocument: "after" }
      ).populate("partecipantList", "nickname email nome cognome");

      res.json(updated);
    }
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }

    res.status(500).json({ error: err.message });
  }
};

// DELETE /activities/:id — solo organizzatore, eliminazione definitiva
exports.deleteActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.organizerID?.toString() !== userID)
      return res.status(403).json({ error: "Solo l'organizzatore può eliminare l'attività" });

    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: "Attività eliminata definitivamente" });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};