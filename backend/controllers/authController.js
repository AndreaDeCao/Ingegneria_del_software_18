const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET non configurata in backend/.env");
  return secret;
}

function safeUser(userDoc) {
  return {
    _id: userDoc._id,
    nome: userDoc.nome,
    cognome: userDoc.cognome,
    email: userDoc.email,
    nickname: userDoc.nickname,
  };
}

//TODO: cambiare, togliere i token dai coockie e metterli nell'header Authorization
function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, //TODO: accorciare a 1 ORA in produzione
  });
}

//TODO: cambiare, togliere i token dai coockie e metterli nell'header Authorization
function clearAuthCookie(res) {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
}

exports.register = async (req, res) => {
  try {
    const { nome, cognome, email, nickname, password } = req.body ?? {};

    if (!nome || !cognome || !email || !nickname || !password) {
      return res.status(400).json({ error: "Campi mancanti" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password troppo corta (min 6)" });
    }

    const exists = await User.findOne({ $or: [{ email }, { nickname }] });
    if (exists) return res.status(409).json({ error: "Email o nickname già in uso" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ nome, cognome, email, nickname, passwordHash });

    const token = jwt.sign({ sub: user._id.toString() }, getJwtSecret(), { expiresIn: "7d" }); //TODO: accorciare a 1 ORA in produzione
    setAuthCookie(res, token);
    res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "Email/password mancanti" });

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !user.passwordHash) return res.status(401).json({ error: "Credenziali non valide" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenziali non valide" });

    const token = jwt.sign({ sub: user._id.toString() }, getJwtSecret(), { expiresIn: "7d" }); //TODO: accorciare a 1 ORA in produzione
    setAuthCookie(res, token);
    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};

/**
 * FUNZIONE PER OTTENERE I DATI DELL'UTENTE LOGGATO, USANDO IL TOKEN NEL COOKIE PER IDENTIFICARLO
 * @param {*} req  
 * @param {*} res 
 * @returns 
 */
exports.me = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.json({ user: null });

    const payload = jwt.verify(token, getJwtSecret());
    const userId = payload?.sub;
    if (!userId) return res.json({ user: null });

    const user = await User.findById(userId);
    if (!user) return res.json({ user: null });

    res.json({ user: safeUser(user) });
  } catch {
    res.json({ user: null });
  }
};

