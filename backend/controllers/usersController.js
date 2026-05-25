const User = require("../models/users");
const Trek = require("../models/treks");

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


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
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
      (id) => id.toString() === trekId
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
        console.log("hello");

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

