const User = require("../models/users");
const Trek = require("../models/treks");
const mongoose = require("mongoose");

const crypto = require("crypto");
const { sendEmailChangeVerification } = require("../services/emailService");

const bcrypt = require("bcryptjs");

async function findTrekByIdParam(trekId) {
  const conditions = [];
  const numericId = Number(trekId);

  if (Number.isInteger(numericId)) {
    conditions.push({ id: numericId });
  }

  if (mongoose.Types.ObjectId.isValid(trekId)) {
    conditions.push({ _id: trekId });
  }

  if (conditions.length === 0) return null;
  return Trek.findOne({ $or: conditions });
}

async function getPopulatedFavoriteTreks(userId) {
  const user = await User.findById(userId).populate("favoriteTreks");
  return user?.favoriteTreks ?? null;
}

// GET tutti gli utenti
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET utente per ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("nome cognome nickname email");
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    res.json(user);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ error: "ID non valido" });
    }
    res.status(500).json({ error: err.message });
  }
};


// POST crea utente
exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /users/favorites/:trekId
exports.addTrekToFavorites = async (req, res) => {
  try {
    // utente autenticato
    const userId = req.userId;

    // trek da aggiungere
    const { trekId } = req.params;

    // controlla esistenza trek
    const trek = await Trek.findOne({ id: Number(trekId) });

    if (!trek) {
      return res.status(404).json({
        error: "Trek non trovato",
      });
    }

    // trova utente
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    // controlla se già nei preferiti
    const alreadyFavorite = user.favoriteTreks.some(
      (id) => id.toString() === trek._id.toString() || id.toString() === trekId
    );

    if (alreadyFavorite) {
      return res.status(400).json({
        error: "Trek già nei preferiti",
      });
    }

    // aggiungi trek ai preferiti
    user.favoriteTreks.push(trek._id);

    await user.save();

    // ripopola i trek
    const updatedUser = await User.findById(userId)
      .populate("favoriteTreks");

    res.status(200).json(updatedUser);

  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        error: "ID non valido",
      });
    }

    res.status(500).json({
      error: err.message,
    });
  }
};



exports.getFavoriteTreks = async (req, res) => {
  try {
    // utente autenticato
    const userId = req.userId;

    // trova utente
    const user = await User.findById(userId)
      .populate("favoriteTreks");


    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    res.json(user.favoriteTreks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore server" });
  }
};

// REMOVE /users/favorites/:trekId
exports.removeTrekFromFavorites = async (req, res) => {
  try {
    // utente autenticato
    const userId = req.userId;

    // trek da rimuovere
    const { trekId } = req.params;

    // controlla esistenza trek
    const trek = await Trek.findOne({ id: Number(trekId) });

    if (!trek) {
      return res.status(404).json({
        error: "Trek non trovato",
      });
    }

    // trova utente
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "Utente non trovato",
      });
    }

    // controlla se è nei preferiti
    const isFavorite = user.favoriteTreks.some(
      (id) => id.toString() === trek._id.toString()
    );

    if (!isFavorite) {
      return res.status(400).json({
        error: "Trek non presente nei preferiti",
      });
    }

    // rimuovi trek dai preferiti
    user.favoriteTreks = user.favoriteTreks.filter(
      (id) => id.toString() !== trek._id.toString()
    );

    await user.save();

    // ripopola i trek
    const updatedUser = await User.findById(userId)
      .populate("favoriteTreks");

    res.status(200).json(updatedUser);

  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        error: "ID non valido",
      });
    }

    res.status(500).json({
      error: err.message,
    });
  }
};



/** GET profilo dell'utente autenticato
 * 
 * @route GET /api/users/me
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con i dati dell'utente
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }
    res.json(user);
  } catch(err) {
    res.status(500).json({ error: err.message});
  }
};


/**
 * Aggiorna profilo dell'utente.
 * Permette di modificare i campi nome, cognome, nickname ed email.
 * 
 * @route PUT /api/users/me
 * @param {import("express").Request} req - Body: { nome, cognome, nickname, email}
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con l'utente aggiornato
 */
exports.updateMe = async (req, res) => {
  try {
    const {
      nome,
      cognome,
      nickname,
      email
    } = req.body;

    const user = await User.findById(req.userId);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    //Aggiorna i campi nome, cognome, nickname
    user.nome = nome ?.trim() || user.nome;
    user.cognome = cognome ?.trim() || user.cognome;

    if(nickname?.trim() && nickname.trim() !== user.nickname) {
      const nicknameExists = await User.findOne({ nickname: nickname.trim() });

    if(nicknameExists && nicknameExists._id.toString() !== req.userId) {
      return res.status(400).json({ error: "Questo nickname è già in uso" });
    }
    user.nickname = nickname.trim();
  }

    let message = "Profilo aggiornato con successo";
    let pendingEmail = null;

    // Aggiorna email + verifica al nuovo nuovo indirizzo
    if(email && email.toLowerCase() !== user.email.toLowerCase()) {
      const targetEmail = email.toLowerCase();

      //Controllo se email è già stata usata da un altro utente
      const emailExists = await User.findOne({ email: targetEmail });
      if(emailExists) {
        return res.status(400).json({ error: "Questa email è già associata ad un altro account. "});
      }

      // Generazione token 
      const token = crypto.randomBytes(32).toString("hex");
      user.emailVerificationToken = `${token}|${targetEmail}`;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      pendingEmail = { targetEmail, token };
      message = "Profilo aggiornato. Controlla la nuova email per confermare il cambio."
    }

    await user.save({ validateModifiedOnly: true});

    if (pendingEmail) {
      await sendEmailChangeVerification(pendingEmail.targetEmail, pendingEmail.token);
    }

    res.json({ message });

  } catch(err) {
    res.status(400).json({ error: err.message});
  }
};


/**
 * Conferma cambio di email tramite token ricevuto per email.
 * 
 * @route GET /api/users/verify-email-change/:token
 * @param {import("express").Request} req - Params: { token }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.verifyEmailChange = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173"; 
  try {
    const inputToken = req.params.token;

    const rawUser = await User.collection.findOne({
      emailVerificationToken: { $regex: `^${inputToken}\\|` },
      emailVerificationExpires: { $gt: new Date()},
    });

    if(!rawUser) {
      return res.redirect(`${frontendUrl}/account/profile?email-verified=invalid`);
    }

    const user = User.hydrate(rawUser);
    const parts = user.emailVerificationToken.split("|");
    const newEmail = parts[1];

    if(!newEmail) {
      return res.redirect(`${frontendUrl}/account/profile?email-verified=invalid`);
    }

    // Verifica finale su disponibilità email
    const emailExists = await User.findOne({ email: newEmail });
    if(emailExists) {
      return res.redirect(`${frontendUrl}/account/profile?email-verified=taken`);
    }

    user.email = newEmail;
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save({ validateModifiedOnly: true });
    res.redirect(`${frontendUrl}/account/profile?email-verified=success`);

  } catch(err) {
    res.redirect(`${frontendUrl}/account/profile?email-verified?status=error`);
  }
};


/**
 * Elimina account utente.
 * 
 * @route DELETE /api/users/me
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ message: "Account eliminato" });

  } catch(err) {
    res.status(500).json({ error: err.message});
  }
};


/**
 * Aggiorna avatar dell'utente.
 *
 * @route PUT /users/me/avatar
 * @param {import("express").Request} req - Body: { avatarBase64 }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.updateAvatar = async (req, res) => {
  try {
    const { avatarBase64 } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatarUrl: avatarBase64 },
      { returnDocument: "after" }
    );

    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ message: "Avatar aggiornato" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Aggiorna password dell'utente autenticato.
 *
 * @route PUT /api/users/me/password
 * @param {import("express").Request} req - Body: { currentPassword, newPassword }
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if(!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Campi obbligatori mancanti" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,32}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: "La password deve essere tra 6 e 32 caratteri e contenere almeno un numero, una lettera maiuscola e una minuscola" });
    }

    const user = await User.findById(req.userId).select("+passwordHash +tempPasswordExpires");
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    if(!user.passwordHash) {
      return res.status(400).json({ error: "Questo account non ha ancora una password impostata, bisogna richiederne una temporanea" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if(!isMatch) {
      return res.status(401).json({ error: "Password attuale non corretta" });
    }

    const saltedRound = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 15;
    user.passwordHash = await bcrypt.hash(newPassword, saltedRound);
    user.tempPasswordExpires = undefined;

    await user.save({ validateModifiedOnly: true});

    res.json({ message: "Password aggiornata con successo" });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Elimina avatar dell'utente
 * 
 * @route DELETE /api/users/me/avatar
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.deleteAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatarUrl: null },
      { returnDocument: "after" }
    );

    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ message: "Avatar eliminato" });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/* NOTIFHCE */

/**
 * Restituisce le notifiche dell'utente, dalla più recente.
 *
 * @route GET /users/me/notifications
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con array di notifiche
 */
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    const sorted = [...user.notifications]. sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * Marca tutte le notifiche come lette.
 *
 * @route PUT /users/me/notifications/read-all
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con messaggio di conferma
 */
exports.markAllNotificationRead = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if(!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    user.notifications.forEach(n => { n.read = true; });
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Tutte le notifiche sono segnate come lette" });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
