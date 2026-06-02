const Activity = require("../models/activities");
const Friendship = require("../models/friendship");
const ActivityInvitation = require("../models/activityInvitation");
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
    const activities = await Activity.find()
      .populate("organizerID", "nickname")
      .populate("reports.reportedBy", "nickname");
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
      //POPULATE
      .populate("partecipantList", "nickname email nome cognome avatarUrl");

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
    const {
      organizerID,
      maxParticipants = 10,
      invitedUsers = [],
    } = req.body;
    const max = Number(maxParticipants);

    if (!organizerID) {
      return res.status(400).json({ error: "Organizzatore mancante" });
    }

    if (!Array.isArray(invitedUsers)) {
      return res.status(400).json({ error: "Lista invitati non valida" });
    }

    // Controlla se l'organizzatore è un admin
    const organizerUser = await User.findById(organizerID).select("role");
    const organizerIsAdmin = organizerUser?.role === "admin";

    if(invitedUsers.length > 0) {
      if (!organizerIsAdmin) {
        // Gli utenti normali possono invitare solo i propri amici
        const friendships = await Friendship.find({
          $or: [
            { sender: organizerID, status: "accepted" },
            { receiver: organizerID, status: "accepted" },
          ],
        });

        const friendIds = new Set(
          friendships.map((f) =>
            f.sender.toString() === organizerID
              ? f.receiver.toString()
              : f.sender.toString()
          )
        );

        const allAreFriends = invitedUsers.every((id) => friendIds.has(id.toString()));
        if (!allAreFriends) {
          return res.status(400).json({ error: "Puoi invitare solo i tuoi amici" });
        }
      }

      if(invitedUsers.length > max) {
        return res.status(400).json({
          error: `Il numero di invitati supera il massimo di partecipanti consentito`,
        });
      }
    }

    // L'admin non partecipa all'attività che crea; lo user normale è il primo partecipante
    const initialParticipants = organizerIsAdmin ? [] : (organizerID ? [organizerID] : []);

    const newActivity = new Activity({
      ...req.body,
      maxParticipants: max,
      invitedUsers,
      partecipantList: initialParticipants,
      visibility: organizerIsAdmin ? "public" : req.body.visibility,
    });

    if (!organizerIsAdmin && newActivity.partecipantList.length == 1 && newActivity.maxParticipants == 1) {
      newActivity.status = "Chiuso";
    }

    await newActivity.save();
    ///dai due branch
    // const invitedUsers = req.body.invitedUsers || [];
    // if(invitedUsers.length > 0) {
    //   const organizer = await User.findById(organizerID);
    //   for(const invitedId of invitedUsers) {
    //     await addNotification(
    //       invitedId,
    //       "activity_invite",
    //       `${organizer.nickname} ti ha invitato all'attività "${newActivity.title}"`,
    //       newActivity._id
    //     );
    //   }
    // }


    // if (invitedUsers.length > 0) {
    //   await ActivityInvitation.insertMany(
    //     invitedUsers.map((receiverId) => ({
    //       activity: newActivity._id,
    //       sender: organizerID,
    //       receiver: receiverId,
    //       status: "pending",
    //     }))
    //   );
    // }
    
    //combinazione

    // const invitedUsers = req.body.invitedUsers || []; //già dichiarata in const newActivity
    if (invitedUsers.length > 0) {
      // Crea i record di invito
      await ActivityInvitation.insertMany(
        invitedUsers.map((receiverId) => ({
          activity: newActivity._id,
          sender: organizerID,
          receiver: receiverId,
          status: "pending",
        }))
      );

      // Invia notifica a ciascun invitato
      const organizer = await User.findById(organizerID);
      for (const invitedId of invitedUsers) {
        await addNotification(
          invitedId,
          "activity_invite",
          `${organizer.nickname} ti ha invitato all'attività "${newActivity.title}"`,
          newActivity._id
        );
      }
    }

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
    if (activity.suspended) return res.status(403).json({ error: "Attività sospesa dall'amministrazione" });

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

    if (activity.visibility === "private") {
      return res.status(403).json({
        error: "Questa attività è privata. Devi accettare l'invito per partecipare",
      });
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

    await ActivityInvitation.updateOne(
      { activity: activity._id, receiver: userID, status: "pending" },
      { $set: { status: "accepted", acceptedAt: new Date() } }
    );

    await User.updateOne(
      {
        _id: userID,
        "notifications.ref": activity._id,
        "notifications.type": "activity_invite"
      },
      {
        $set: {
          "notifications.$.status": "accepted",
          "notifications.$.read": true
        }
      }
    );

    const joiner = await User.findById(userID);
    await addNotification(
      activity.organizerID.toString(),
       "activity_join",
        `${joiner.nickname} si è iscritto alla tua attività "${activity.title}"`,
        activity._id
    );

    const updated = await Activity
      .findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome avatarUrl");

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
    if (activity.suspended) return res.status(403).json({ error: "Attività sospesa dall'amministrazione" });

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

    const invitation = await ActivityInvitation.findOne({
      activity: activity._id,
      receiver: userID.toString(),
    });
    if (invitation) {
      invitation.status = "declined";
      invitation.declinedAt = new Date();
      invitation.acceptedAt = undefined;
      await invitation.save();
    }

    if (activity.status === "Chiuso" && activity.partecipantList.length < activity.maxParticipants) {
      activity.status = "Aperto";
    }

    await activity.save();

    const updated = await Activity
      .findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome avatarUrl");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/cancel — organizzatore o admin
exports.cancelActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.suspended) return res.status(403).json({ error: "Attività sospesa dall'amministrazione" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    const requestingUser = await User.findById(userID).select("role");
    const isAdmin = requestingUser?.role === "admin";

    if (activity.organizerID?.toString() !== userID && !isAdmin) {
      return res.status(403).json({ error: "Solo l'organizzatore può annullare l'attività" });
    }
    if (activity.status === "Annullato") {
      return res.status(400).json({ error: "Attività già annullata" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Annullato" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome avatarUrl");

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ error: "ID non valido" });
    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/uncancel — organizzatore o admin
exports.uncancelActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });
    if (activity.suspended) return res.status(403).json({ error: "Attività sospesa dall'amministrazione" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    const requestingUser = await User.findById(userID).select("role");
    const isAdmin = requestingUser?.role === "admin";

    if (activity.organizerID?.toString() !== userID && !isAdmin) {
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
    ).populate("partecipantList", "nickname email nome cognome avatarUrl");

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
    if (activity.suspended) return res.status(403).json({ error: "Attività sospesa dall'amministrazione" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    const requestingUser = await User.findById(userID).select("role");
    const isAdmin = requestingUser?.role === "admin";

    if (activity.organizerID?.toString() !== userID && !isAdmin) {
      return res.status(403).json({ error: "Solo l'organizzatore può chiudere l'attività" });
    }
    if (activity.status === "Chiuso") {
      return res.status(400).json({ error: "Attività già chiusa" });
    }

    const updated = await Activity.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Chiuso" } },
      { returnDocument: "after" }
    ).populate("partecipantList", "nickname email nome cognome avatarUrl");

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
    if (activity.suspended) return res.status(403).json({ error: "Attività sospesa dall'amministrazione" });

    const now = new Date();
    if (activity.activityDate <= now) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    const requestingUser = await User.findById(userID).select("role");
    const isAdmin = requestingUser?.role === "admin";

    if (activity.organizerID?.toString() !== userID && !isAdmin) {
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
    ).populate("partecipantList", "nickname email nome cognome avatarUrl");

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
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    const requestingUser = await User.findById(userID).select("role");
    const isAdmin = requestingUser?.role === "admin";

    if (activity.organizerID?.toString() !== userID && !isAdmin) {
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
 * Invia un invito a partecipare all'attività.
 * Solo l'organizzatore può invitare i propri amici.
 *
 * @route POST /activities/:id/invite/:userId
 */
exports.sendActivityInvite = async (req, res) => {
  try {
    const organizerId = req.userId?.toString();
    const receiverId = req.params.userId?.toString();

    if (!organizerId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }

    if (activity.organizerID?.toString() !== organizerId) {
      return res.status(403).json({ error: "Solo l'organizzatore può invitare amici" });
    }

    if (activity.status !== "Aperto") {
      return res.status(400).json({ error: "L'attività non è aperta agli inviti" });
    }

    if (activity.activityDate <= new Date()) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (receiverId === organizerId) {
      return res.status(400).json({ error: "Non puoi invitare te stesso" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const alreadyParticipant = activity.partecipantList.some((id) => id.toString() === receiverId);
    if (alreadyParticipant) {
      return res.status(400).json({ error: "L'utente partecipa già a questa attività" });
    }

    const friendship = await Friendship.findOne({
      $or: [
        { sender: organizerId, receiver: receiverId, status: "accepted" },
        { sender: receiverId, receiver: organizerId, status: "accepted" },
      ],
    });

    if (!friendship) {
      return res.status(400).json({ error: "Puoi invitare solo i tuoi amici" });
    }

    const existing = await ActivityInvitation.findOne({
      activity: activity._id,
      sender: organizerId,
      receiver: receiverId,
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ error: "Invito già in attesa" });
      }

      existing.status = "pending";
      existing.acceptedAt = undefined;
      existing.declinedAt = undefined;
      await existing.save();

      const populated = await ActivityInvitation.findById(existing._id)
        .populate("sender", "nome cognome nickname avatarUrl")
        .populate("receiver", "nome cognome nickname avatarUrl");

      return res.status(200).json({
        message: "Invito inviato nuovamente",
        invitation: populated,
      });
    }

    const invitation = new ActivityInvitation({
      activity: activity._id,
      sender: organizerId,
      receiver: receiverId,
      status: "pending",
    });

    await invitation.save();

    const populated = await ActivityInvitation.findById(invitation._id)
      .populate("sender", "nome cognome nickname avatarUrl")
      .populate("receiver", "nome cognome nickname avatarUrl");

    res.status(201).json({
      message: "Invito inviato",
      invitation: populated,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Restituisce gli inviti pendenti di una specifica attività.
 * Solo l'organizzatore può visualizzarli.
 *
 * @route GET /activities/:id/invites
 */
exports.getActivityInvites = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }

    if (activity.organizerID?.toString() !== req.userId) {
      return res.status(403).json({ error: "Solo l'organizzatore può vedere gli inviti" });
    }

    const invitations = await ActivityInvitation.find({
      activity: activity._id,
      status: "pending",
    })
      .populate("sender", "nome cognome nickname avatarUrl")
      .populate("receiver", "nome cognome nickname avatarUrl")
      .sort({ createdAt: 1 });

    res.json(invitations);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Restituisce l'eventuale invito ricevuto dall'utente per una specifica attività.
 *
 * @route GET /activities/:id/invites/me
 */
exports.getMyActivityInvite = async (req, res) => {
  try {
    const invitation = await ActivityInvitation.findOne({
      activity: req.params.id,
      receiver: req.userId,
      status: "pending",
    })
      .populate("sender", "nome cognome nickname avatarUrl")
      .populate("receiver", "nome cognome nickname avatarUrl");

    res.json(invitation ? [invitation] : []);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Accetta un invito all'attività.
 *
 * @route PUT /activities/:id/invites/:inviteId/accept
 */
exports.acceptActivityInvite = async (req, res) => {
  try {
    const invitation = await ActivityInvitation.findById(req.params.inviteId);
    if (!invitation) {
      return res.status(404).json({ error: "Invito non trovato" });
    }

    if (invitation.activity.toString() !== req.params.id) {
      return res.status(400).json({ error: "Invito non valido per questa attività" });
    }

    if (invitation.receiver.toString() !== req.userId) {
      return res.status(403).json({ error: "Non autorizzato ad accettare questo invito" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "L'invito non è in stato pending" });
    }

    const activity = await Activity.findById(invitation.activity);
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }

    if (activity.activityDate <= new Date()) {
      return res.status(400).json({ error: "Attività già passata" });
    }

    if (activity.status !== "Aperto") {
      return res.status(400).json({ error: "L'attività non è aperta alle iscrizioni" });
    }

    const alreadyParticipant = activity.partecipantList.some(
      (id) => id.toString() === req.userId.toString()
    );
    if (alreadyParticipant) {
      return res.status(400).json({ error: "Sei già iscritto a questa attività" });
    }

    if (activity.partecipantList.length >= activity.maxParticipants) {
      return res.status(400).json({ error: "L'attività ha raggiunto il numero massimo di partecipanti" });
    }

    activity.partecipantList.push(req.userId);
    if (activity.partecipantList.length >= activity.maxParticipants) {
      activity.status = "Chiuso";
    }
    await activity.save();

    await User.updateOne(
        {
          _id: req.userId,
          "notifications.ref": invitation.activity,
          "notifications.type": "activity_invite"
        },
        {
          $set: {
            "notifications.$.status": "accepted",
            "notifications.$.read": true
          }
        }
      );

    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    invitation.declinedAt = undefined;
    await invitation.save();

    const updatedActivity = await Activity.findById(activity._id)
      .populate("partecipantList", "nickname email nome cognome avatarUrl")
      .populate("organizerID", "nome cognome nickname avatarUrl");

    const populatedInvitation = await ActivityInvitation.findById(invitation._id)
      .populate("sender", "nome cognome nickname avatarUrl")
      .populate("receiver", "nome cognome nickname avatarUrl");

    res.json({
      message: "Invito accettato",
      activity: updatedActivity,
      invitation: populatedInvitation,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Rifiuta un invito all'attività.
 *
 * @route PUT /activities/:id/invites/:inviteId/decline
 */
exports.declineActivityInvite = async (req, res) => {
  try {
    const invitation = await ActivityInvitation.findById(req.params.inviteId);
    if (!invitation) {
      return res.status(404).json({ error: "Invito non trovato" });
    }

    if (invitation.activity.toString() !== req.params.id) {
      return res.status(400).json({ error: "Invito non valido per questa attività" });
    }

    if (invitation.receiver.toString() !== req.userId) {
      return res.status(403).json({ error: "Non autorizzato a rifiutare questo invito" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "L'invito non è in stato pending" });
    }

    invitation.status = "declined";
    invitation.declinedAt = new Date();
    invitation.acceptedAt = undefined;
    await invitation.save();

    await User.updateOne(
      {
        _id: req.userId,
        "notifications.ref": invitation.activity,
        "notifications.type": "activity_invite"
      },
      {
        $set: {
          "notifications.$.status": "rejected",
          "notifications.$.read": true
        }
      }
    );

    const populatedInvitation = await ActivityInvitation.findById(invitation._id)
      .populate("sender", "nome cognome nickname avatarUrl")
      .populate("receiver", "nome cognome nickname avatarUrl");

    res.json({
      message: "Invito rifiutato",
      invitation: populatedInvitation,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};

/**
 * Revoca un invito all'attività.
 * Solo l'organizzatore può revocare un invito ancora pending.
 *
 * @route PUT /activities/:id/invites/:inviteId/cancel
 */
exports.cancelActivityInvite = async (req, res) => {
  try {
    const organizerId = req.userId?.toString();
    if (!organizerId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: "Attività non trovata" });
    }

    if (activity.organizerID?.toString() !== organizerId) {
      return res.status(403).json({ error: "Solo l'organizzatore può revocare gli inviti" });
    }

    const invitation = await ActivityInvitation.findById(req.params.inviteId);
    if (!invitation) {
      return res.status(404).json({ error: "Invito non trovato" });
    }

    if (invitation.activity.toString() !== req.params.id) {
      return res.status(400).json({ error: "Invito non valido per questa attività" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "Puoi revocare solo un invito in attesa" });
    }

    invitation.status = "declined";
    invitation.declinedAt = new Date();
    invitation.acceptedAt = undefined;
    await invitation.save();

    const populatedInvitation = await ActivityInvitation.findById(invitation._id)
      .populate("sender", "nome cognome nickname avatarUrl")
      .populate("receiver", "nome cognome nickname avatarUrl");

    res.json({
      message: "Invito revocato",
      invitation: populatedInvitation,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
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


// ── ADMIN ────────────────────────────────────────────────────────────────────

const requireAdmin = (req, res) => {
  const userID = req.user?._id?.toString() || req.body.userID?.toString();
  const role = req.user?.role || req.body.userRole;

  if (!userID) {
    res.status(401).json({ error: "Non autenticato" });
    return null;
  }

  if (role !== "admin") {
    res.status(403).json({ error: "Accesso riservato agli amministratori" });
    return null;
  }

  return userID;
};

const getActivity = async (id) => { return Activity.findById(id); };

const populateActivity = (query) => query
    .populate("partecipantList", "nickname email nome cognome")
    .populate("reports.reportedBy", "nickname email")
    .populate("reports.reviewedBy", "nickname email")
    .populate("suspendedBy", "nickname email");

// PATCH /activities/:id/suspend — solo admin, sospende l'attività e ne annulla tutte le iscrizioni
exports.suspendActivity = async (req, res) => {
  try {
    const adminID = requireAdmin(req, res);
    if (!adminID) return;

    const activity = await getActivity(req.params.id);

    if (!activity)
      return res.status(404).json({ error: "Attività non trovata" });

    if (activity.suspended)
      return res.status(400).json({ error: "Attività già sospesa" });

    const reason = req.body.reason?.trim() || "";

    const updated = await populateActivity(
      Activity.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            suspended: true,
            statusBeforeSuspend: activity.status,
            status: "Annullato",
            suspendedReason: reason,
            suspendedBy: adminID,
            suspendedAt: new Date(),
          },
          $push: {
            adminLog: {
              adminID,
              action: "suspend",
              reason,
              date: new Date(),
            },
          },
        },
        { returnDocument: "after" }
      )
    );

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ error: "ID non valido" });

    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/unsuspend — solo admin, riattiva l'attività mantenendo le iscrizioni
exports.unsuspendActivity = async (req, res) => {
  try {
    const adminID = requireAdmin(req, res);
    if (!adminID) return;

    const activity = await getActivity(req.params.id);

    if (!activity)
      return res.status(404).json({ error: "Attività non trovata" });

    if (!activity.suspended)
      return res.status(400).json({ error: "Attività non è sospesa" });

    const reason = req.body.reason?.trim() || "";

    const updated = await populateActivity(
      Activity.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            suspended: false,
            status: activity.statusBeforeSuspend || "Aperto",
            statusBeforeSuspend: null,
            suspendedReason: "",
            suspendedBy: null,
            suspendedAt: null,
          },
          $push: {
            adminLog: {
              adminID,
              action: "unsuspend",
              reason,
              date: new Date(),
            },
          },
        },
        { returnDocument: "after" }
      )
    );

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ error: "ID non valido" });

    res.status(500).json({ error: err.message });
  }
};


/* SEGNALAZIONI */
// POST /activities/:id/report — segnala un'attività, solo partecipanti non organizzatori, un report per utente
exports.reportActivity = async (req, res) => {
  try {
    const userID = req.user?._id?.toString() || req.body.userID?.toString();
    if (!userID) return res.status(401).json({ error: "Non autenticato" });

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: "Attività non trovata" });

    if (activity.organizerID?.toString() === userID)
      return res.status(400).json({ error: "Non puoi segnalare la tua attività" });

    if (!activity.partecipantList.some(p => p.toString() === userID))
      return res.status(400).json({ error: "Solo i partecipanti possono segnalare l'attività" });

    if (activity.reports.some(r => r.reportedBy?.toString() === userID))
      return res.status(400).json({ error: "Hai già segnalato questa attività" });

    const reason = req.body.reason?.trim();
    if (!reason)
      return res.status(400).json({ error: "Il motivo della segnalazione è obbligatorio" });

    activity.reports.push({
      reportedBy: userID,
      reason,
      reportedAt: new Date(),
      reportStatus: "pending"
    });

    await activity.save();

    res.status(201).json({
      message: "Segnalazione inviata. Verrà esaminata dall'amministrazione."
    });
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ error: "ID non valido" });

    res.status(500).json({ error: err.message });
  }
};

// PATCH /activities/:id/reports/:reportId/accept — solo admin, accetta la segnalazione e sospende l'attività
// PATCH /activities/:id/reports/:reportId/dismiss — solo admin, rifiuta la segnalazione
const reviewReport = async (req, res, status, action) => {
  try {
    const adminID = requireAdmin(req, res);
    if (!adminID) return;

    const activity = await getActivity(req.params.id);

    if (!activity)
      return res.status(404).json({ error: "Attività non trovata" });

    const report = activity.reports.id(req.params.reportId);

    if (!report)
      return res.status(404).json({ error: "Segnalazione non trovata" });

    report.reportStatus = status;
    report.reviewedBy = adminID;
    report.reviewedAt = new Date();
    report.reviewNote = req.body.reviewNote?.trim() || "";

    activity.adminLog.push({
      adminID,
      action,
      reason: report.reason,
      date: new Date(),
    });

    await activity.save();

    const updated = await populateActivity(
      Activity.findById(req.params.id)
    );

    res.json(updated);
  } catch (err) {
    if (err.name === "CastError")
      return res.status(400).json({ error: "ID non valido" });

    res.status(500).json({ error: err.message });
  }
};

exports.acceptReport = (req, res) => reviewReport(req, res, "accepted", "report_accept");

exports.dismissReport = (req, res) => reviewReport(req, res, "dismissed", "report_dismiss");


/**
 * Aggiunge una notifica all'utente.
 * 
 * @param {string} userId - ID utente destinatario
 * @param {string} type - Tipo di notifica
 * @param {string} message - Testo della notifica
 * @param {string|null} ref - ID risorsa correlata
 */
async function addNotification(userId, type, message, ref = null) {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          type, message, ref, createdAt: new Date()
        }
      }
    });

  } catch(err) {
    console.error("addNotification error:", err.message);
  }
}