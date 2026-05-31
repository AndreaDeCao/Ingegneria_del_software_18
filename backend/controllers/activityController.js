const Activity = require("../models/activities");
const Friendship = require("../models/friendship");
const User = require("../models/users");


/**Restituisce tutte le attività pubbliche.
 * 
 * @route GET /activities
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la lista delle attività
 */
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
      .populate("partecipantList", "nickname email nome cognome");

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
    exports.createActivity = async (req, res) => {
  try {
    const organizerID = req.body.organizerID;

    // const {
    //   title,
    //   description,
    //   activityDate,
    //   maxParticipants,
    //   visibility,
    //   trekID,
    //   invitedUsers = [],
    // } = req.body;

    if(invitedUsers.length > 0) {
      const friendships = await Friendship.find({
         $or: [
          { sender: req.userId, status: "accepted" },
          { receiver: req.userId, status: "accepted" },
        ],
      });

      const friendIds = new Set(
        friendships.map((f) => 
          f.sender.toString() === req.userId
            ? f.receiver.toString()
            : f.sender.toString()
        )
      );

      const allAreFriends = invitedUsers.every((id) => friendIds.has(id.toString()));
      if(!allAreFriends) {
        return res.status(400).json({ error: "Puoi invitare solo i tuoi amici" });
      }

      if(invitedUsers.length > max - 1) {
        return res.status(400).json({
          error: `Puoi invitare al massimo ${max - 1} amici per questa attività`,
        });
      }     
    }

    // const newActivity = new Activity({
    //   title,
    //   description,
    //   activityDate,
    //   maxParticipants: max,
    //   visibility: visibility ?? "public",
    //   organizerID: req.userId,
    //   trekID: trekID ?? null,
    //   partecipantList: [req.userId],
    //   invitedUsers,
    //   status: "Aperto",
    // });

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

// PATCH /activities/:id/cancel — solo organizzatore
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

// PATCH /activities/:id/uncancel — solo organizzatore
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

// DELETE /activities/:id — solo organizzatore, eliminazione definitiva
exports.deleteActivity = async (req, res) => { //FIX ME: solo admin
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può eliminare l'attività" });
    }

    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: "Attività eliminata definitivamente" });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce le attività create dall'utente.
 *
 * @route GET /activities/mine
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la lista delle attività
 */
exports.getMyActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      organizerID: req.userId
    })
    .populate("organizerID", "nome cognome nickname avatarUrl")
    .populate("partecipantList", "nome cognome nickname avatarUrl")
    .populate("invitedUsers", "nome cognome nickname avatarUrl")
    .populate("trekID", "title difficulty")
    .sort({ activityDate: 1});

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce le attività a cui l'utente partecipa (da non organizzatore).
 * 
 * @route GET /activities/joined
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la lista delle attività 
 */
exports.getJoinedActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      partecipantList: req.userId,
      organizerID: { $ne: req.userId },
    })
    .populate("organizerID", "nome cognome nickname avatarUrl")
    .populate("partecipantList", "nome cognome nickname avatarUrl")
    .populate("trekID", "title difficulty")
    .sort({ activityDate: 1 });

    res.json(activities);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce le attività a cui l'utente è stato invitato.
 * 
 * @route GET /activities/invited
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la lista delle attività 
 */
exports.getInvitedActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ invitedUsers: req.userId })
    .populate("organizerID", "nome cognome nickname avatarUrl")
    .populate("partecipantList", "nome cognome nickname avatarUrl")
    .populate("trekID", "title difficulty")
    .sort({ activityDate: 1 });
  
    res.json(activities);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Aggiunge l'utente alla lista di partecipanti di un'attività.
 * Per attività private, l'utente deve essere nella lista degli invitati.
 * 
 * @route PUT /activities/:id/join
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività aggiornata
 */
exports.joinActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }

    if(activity.status !== "Aperto") {
      return res.status(400).json({ error: "L'attività non è aperta alle iscrizioni" });
    }

    if(activity.organizerID?.toString() === userID) {
      return res.status(400).json({ error: "Sei l'organizzatore di questa attività" });
    }

    if(activity.visibility === "private") {
      const isInvited = activity.invitedUsers.some((id) => id.toString() === userID);
      if(!isInvited) {
        return res.status(403).json({ error: "Questa attività è privata. Devi essere invitato per partecipare" });
      }
    }

    const alreadyJoined = activity.partecipantList.some((p) => p.toString() === userID);
    if(alreadyJoined) {
      return res.status(400).json({ error: "Sei già iscritto a questa attività" });
    }

    if(activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "L'attività ha raggiunto il numero massimo di partecipanti" });
    }

    activity.partecipantList.push(userID);

    if(activity.partecipantList.length >= activity.maxParticipants) {
      activity.status = "Chiuso";
    }

    await activity.save();

    const updated = await Activity
      .findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Rimuove l'utente dalla lista dei partecipanti di un'attività.
 * L'organizzatore non può abbandonare la propria attività.
 * 
 * @route PUT /activities/:id/leave
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività aggiornata
 */
exports.leaveActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    if(activity.organizerID?.toString() === userID) {
      return res.status(400).json({ error: "L'organizzatore non può abbandonare l'attività" });
    }

    const before = activity.partecipantList.length;
    activity.partecipantList = activity.partecipantList.filter((p) => 
      p.toString() !== userID);

    if(activity.partecipantList.length === before) {
      return res.status(400).json({ error: "Non sei iscritto a questa attività" });
    }

    if(activity.status === "Chiuso" && activity.partecipantList.length < activity.maxParticipants) {
      activity.status = "Aperto";
    }

    await activity.save();

    const updated = await Activity
      .findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Annulla un'attività.
 * Solo l'organizzatore può eseguire tale operazione.
 * 
 * @route PATCH /activities/:id/cancel
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività aggiornata
 */
exports.cancelActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    if(activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può annullare l'attività" });
    }
    if(activity.status === "Annullato") {
      return res.status(400).json({ error: "Attività già annullata" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Annullato" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Riattiva un'attività annullata.
 * Solo l'organizzatore può eseguire tale operazione.
 * 
 * @route PATCH /activities/:id/uncancel
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività aggiornata
 */
exports.uncancelActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    if(activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può riattivare l'attività" });
    }
    if(activity.status === "Chiuso" || activity.status === "Aperto") {
      return res.status(400).json({ error: "Attività già attiva" });
    }

    const newStatus = activity.partecipantList.length >= activity.maxParticipants ? "Chiuso" : "Aperto";

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: newStatus } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Chiude manualmente un'attività.
 * Solo l'organizzatore può eseguire tale operazione.
 * 
 * @route PATCH /activities/:id/close
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività aggiornata
 */
exports.closeActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    if(activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può chiudere l'attività" });
    }
    if(activity.status === "Chiuso") {
      return res.status(400).json({ error: "Attività già chiusa" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Chiuso" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Riapre manualmente un'attività chiusa.
 * Solo l'organizzatore può eseguire tale operazione.
 * 
 * @route PATCH /activities/:id/open
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività aggiornata
 */
exports.openActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    if(activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può riaprire l'attività" });
    }
    if(activity.status === "Aperto") {
      return res.status(400).json({ error: "Attività già aperta" });
    }
    if(activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "Non puoi aprire l'attività perché ha già raggiunto il numero massimo di partecipanti" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Aperto" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome");

    res.json(updated);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Elimina definitivamente un'attività.
 * Solo l'organizzatore può eseguire tale operazione.
 * 
 * @route DELETE /activities/:id
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.deleteActivity = async (req, res) => {
  try {
    const userID = req.userId;

    const activity = await Activity.findById(req.params.id);
    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }
    if(activity.organizerID?.toString() !== userID) {
      return res.status(403).json({ error: "Solo l'organizzatore può eliminare l'attività" });
    }
    
    await Activity.findByIdAndDelete(req.params.id);
    res.json({ message: "Attività eliminata definitivamente" });

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};