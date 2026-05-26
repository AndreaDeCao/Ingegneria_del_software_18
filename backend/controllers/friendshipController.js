const Friendship = require("../models/friendship");
const User = require("../models/users");


/**
 * Invia una richiesta di amicizia a un altro utente.
 * 
 * @route POST /api/friendships/request/:userId
 * @param {import("express").Request} req - Params: { userId }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la richiesta creata
 */
exports.sendRequest = async (req, res) => {
  try {
    const senderId = req.userId;
    const receiverId = req.params.userId;

    // Impedisce di inviare richiesta a se stessi
    if(senderId === receiverId) {
      return res.status(400).json({ error: "Non puoi inviare una richiesta di amicizia a te stesso" });
    }

    // Controlla che utente destinatario esista
    const receiver = await User.findById(receiverId);
    if(!receiver) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    // Controlla se esiste già la richiesta tra i due utenti
    const existing = await Friendship.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if(existing) {
      if(existing.status === "accepted") {
        return res.status(400).json({ error: "Siete già amici" });
      }

      if(existing.status === "pending") {
        return res.status(400).json({ error: "Esiste già una richiesta di amicizia in attesa" });
      }

      if(existing.status === "declined") {
        existing.status = "pending";
        existing.sender = senderId;
        existing.receiver = receiverId;
        await existing.save();
        return res.status(200).json({ message: "Richiesta di amicizia inviata nuovamente", friendship: existing });
      }
    }

    const newFriendship = new Friendship({
      sender: senderId,
      receiver: receiverId,
    });

    await newFriendship.save();
    res.status(201).json({ message: "Richiesta di amicizia inviata", friendship: newFriendship });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Accetta richiesta di amicizia ricevuta.
 * Solo il destinatario della richiesta può accettarla.
 * 
 * @route PUT /api/friendships/accept/:friendshipId
 * @param {import("express").Request} req - Params: { friendshipId }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la friendship aggiornata
 */
exports.acceptRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if(!friendship) {
      return res.status(404).json({ error: "Richiesta di amicizia non trovata" });
    }

    // Solo l'utente destinatario può accettare la richiesta
    if(friendship.receiver.toString() !== req.userId) {
      return res.status(403).json({ error: "Non autorizzato ad accettare questa richiesta" });
    }

    if(friendship.status !== "pending") {
      return res.status(400).json({ error: "La richiesta non è in stato pending" });
    }

    friendship.status ="accepted";
    await friendship.save();

    res.json({ message: "Richiesta di amicizia accettata.", friendship });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Rifiuta richiesta di amicizia ricevuta.
 * Solo il destinatario della richiesta può rifiutarla.
 *
 * @route PUT /api/friendships/decline/:friendshipId
 * @param {import("express").Request} req - Params: { friendshipId }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la friendship aggiornata
 */
exports.declineRequest = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if(!friendship) {
      return res.status(404).json({ error: "Richiesta di amicizia non trovata" });
    }

    if(friendship.receiver.toString() !== req.userId) {
      return res.status(403).json({ error: "Non autorizzato a rifiutare la richiesta" });
    }

    if(friendship.status !== "pending") {
      return res.status(400).json({ error: "La richiesta non è in stato pending" });
    }

    friendship.status = "declined";
    await friendship.save();

    res.json({ message: "Richiesta di amicizia rifiutata.", friendship });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce la lista degli amici dell'utente.
 * Mostra i dati base dell'amico e la data di inizio amicizia.
 * 
 * @route GET /api/friendships
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con array di oggetti { friendshipId, user, since }
 */
exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { sender: req.userId, status: "accepted" },
        { receiver: req.userId, status: "accepted" },
      ],
    })
    .populate("sender", "nome cognome nickname avatarUrl")
    .populate("receiver", "nome cognome nickname avatarUrl");

    // Per ogni amicizia mostra dati dell'utente amico
    const friends = friendships.map((f) => {
      const isSender = f.sender._id.toString() === req.userId;
      return {
        friendshipId: f._id,
        user: isSender ? f.receiver : f.sender,
        since: f.updatedAt,
      };
    });

    res.json(friends);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce le richieste in entrata in stato di pending.
 * 
 * @route GET /api/friendships/requests/incoming
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con richieste ricevute
 */
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      receiver: req.userId,
      status: "pending",
    }).populate("sender", "nome cognome nickname avatarUrl");

    res.json(requests);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Restituisce le richieste in uscita in stato di pending.
 * 
 * @route GET /api/friendships/requests/outgoing
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con le richieste inviate
 */
exports.getOutgoingRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      sender: req.userId,
      status: "pending",
    }).populate("receiver", "nome cognome nickname avatarUrl");

    res.json(requests);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Rimuove amicizia esistente tra due utenti.
 * Entrambi gli utenti coinvolti nell'amicizia possono rimuoverla.
 * 
 * @route DELETE /api/friendships/:friendshipId
 * @param {import("express").Request} req - Params: { friendshipId }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.removeFriend = async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if(!friendship) {
      return res.status(404).json({ error: "Amicizia non trovata." });
    }

    const isInvolved =
      friendship.sender.toString() === req.userId ||
      friendship.receiver.toString() === req.userId;

    if(!isInvolved) {
      return res.status(403).json({ error: "Non autorizzato a rimuovere questa amicizia" });
    }

    await Friendship.findByIdAndDelete(req.params.friendshipId);
    res.json({ message: "Amicizia rimossa" });
      
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Cerca utenti per nome o nickname (escludendo se stesso e gliamici attuali).
 * 
 * @route GET /api/friendships/search?q=query
 * @param {import("express").Request} req - Query: { q }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la lista degli utenti trovati
 */
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if(!query || query.length < 2) {
      return res.status(400).json({ error: "Inserisci almeno 2 caratteri" });
    }

    // Trova ID utenti che sono già amici con l'utente
    const existingFriendships = await Friendship.find({
      $or: [{ sender: req.userId }, { receiver: req.userId }],
    });

    const excludedIds = new Set([req.userId]);
    existingFriendships.forEach((f) => {
      excludedIds.add(f.sender.toString());
      excludedIds.add(f.receiver.toString());
    });

    const users = await User.find({
      _id: { $nin: Array.from(excludedIds) },
      $or: [
        { nickname: { $regex: query, $options: "i" }},
        { nome: { $regex: query, $options: "i" }},
        { cognome: { $regex: query, $options: "i" }},
      ],
    })
    .select("nome cognome nickname avatarUrl").limit(10);

    res.json(users);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};