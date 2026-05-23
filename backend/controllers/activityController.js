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