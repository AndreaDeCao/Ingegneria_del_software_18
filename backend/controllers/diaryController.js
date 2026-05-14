const mongoose = require("mongoose");
const DiaryEntry = require("../models/diary");

// GET /api/diary --> restituisce le voci del diario dell'utente loggato
const getDiary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId); // conversione esplicita
    const entries = await DiaryEntry
      .find({ userId })
      .populate("trekId", "name difficulty duration lengthKm")
      .sort({ data: -1 })
      .limit(100);

    res.json(entries);
  } catch (err) {
    console.error("Errore getDiary:", err); // ← aggiungi log per vedere l'errore reale
    res.status(500).json({ error: "Errore nel recupero del diario" });
  }
};


// POST /api/diary --> crea una nuova voce nel diario
const createEntry = async (req, res) => {
  try {
    const { titolo, data, note, foto, valutazione, completato, trekId } = req.body;

    const entry = new DiaryEntry({
      userId: req.userId,   // preso dal token, non dal body
      titolo,
      data,
      note,
      foto,
      valutazione,
      completato,
      trekId: trekId || null, // opzionale, se non fornito sarà null
    });

    const saved = await entry.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Errore nella creazione della voce" });
  }
};

module.exports = { getDiary, createEntry };