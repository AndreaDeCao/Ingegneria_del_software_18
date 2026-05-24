const User = require("../models/users");

const crypto = require("crypto");
const { sendEmailChangeVerification } = require("../services/emailService");

// GET tutti gli utenti
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
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
    user.nome = nome ?? user.nome;
    user.cognome = cognome ?? user.cognome;
    user.nickname = nickname ?? user.nickname;

    //Aggiorna email + verifica al nuovo nuovo indirizzo
    if(email && email !== user.email) {
      const token = crypto.randomBytes(32). toString("hex");
      user.emailVerificationToken = token;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.emailVerified = false;

      await sendEmailChangeVerification(email, token);

      user.email = email;
    }

    await user.save({ validateModifiedOnly: true});
    res.json({ message: "Profilo aggiornato" });

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
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if(!user) {
      return res.status(400).json({ error: "Token non valido o scaduto" });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    res.json({ message: "Email verificata con successo" });

  } catch(err) {
    res.status(500).json({ error: err.message});
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
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ message: "Avatar aggiornato" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};