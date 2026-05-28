const mongoose = require("mongoose");
const Trek = require("../models/treks");

// GET tutti i percorsi
exports.getTreks = async (req, res) => {
  try {
    const treks = await Trek.find();
    res.json(treks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST crea percorso
exports.createTrek = async (req, res) => {
  try {
    const newTrek = new Trek(req.body);
    await newTrek.save();
    res.status(201).json(newTrek);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET per ID (mongo o numerico)
exports.getTreksById = async (req, res) => {
  try {
    const { id } = req.params;

    let trek;

    if (mongoose.Types.ObjectId.isValid(id)) {
      trek = await Trek.findById(id);
    } 
    else if (!isNaN(parseInt(id))) {
      trek = await Trek.findOne({ id: parseInt(id) });
    }

    if (!trek) {
      return res.status(404).json({ error: "Percorso non trovato" });
    }

    res.json(trek);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};