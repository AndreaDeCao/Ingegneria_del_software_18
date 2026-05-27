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
    const activities = await Activity.find({
      visibility: "public",
      status: "Aperto"
    })
    .populate("organizerID", "nome cognome nickname avatarUrl")
    .populate("partecipantList", "nome cognome nickname avatarUrl")
    .populate("trekID", "title difficulty")
    .sort({ activityDate: 1});

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce attività per ID.
 * 
 * @route GET /activities/:id
 * @param {import("express").Request} req - Params: { id }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'attività trovata
 */
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity
      .findById(req.params.id)
      .populate("partecipantList", "nickname email nome cognome");

    if(!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }

    res.json(activity);

  } catch(err) {
    if(err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


/**
 * Crea una nuova attività.
 * L'organizzatore è aggiunto automaticamente alla lista dei partecipanti.
 * Gli utenti invitati devono essere amici dell'organizzatore.
 * 
 * @route POST /activities
 * @param {import("express").Request} req - Body: { title, description, activityDate, maxParticipants, visibility, trekID, invitedUsers }
 * @param {import("express").Response} res
 * @returns {Promise<void>} 201 con l'attività creata
 */
exports.createActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      activityDate,
      maxParticipants,
      visibility,
      trekID,
      invitedUsers = [],
    } = req.body;

    const max = Math.min(Number(maxParticipants) || 6, 6);

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

    const newActivity = new Activity({
      title,
      description,
      activityDate,
      maxParticipants: max,
      visibility: visibility ?? "public",
      organizerID: req.userId,
      trekID: trekID ?? null,
      partecipantList: [req.userId],
      invitedUsers,
      status: "Aperto",
    });

    if(newActivity.partecipantList.length >= max) {
      newActivity.status = "Chiuso";
    }

    await newActivity.save();
    res.status(201).json(newActivity);

  } catch(err) {
    res.status(400).json({ error: err.message });
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