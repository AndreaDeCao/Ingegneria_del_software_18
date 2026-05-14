const DiaryEntry = require("../models/diary");

// GET /diary --> restituisce le voci del diario dell'utente loggato
const getDiary = async (req, res) => {
  try {
    const entries = await DiaryEntry
      .find({ userId: req.userId })
      .populate("trekId", "name difficulty duration lengthKm")
      .sort({ data: -1 })
      .limit(100); // limita a 100 voci per evitare payload troppo grandi
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero del diario" });
  }
};

// POST /diary --> crea una nuova voce nel diario
const createEntry = async (req, res) => {
  try {
    const { trekId, titolo, data, note, foto, valutazione, completato } = req.body;

    const entry = new DiaryEntry({
      userId: req.userId,   // preso dal token, non dal body
      trekId,
      titolo,
      data,
      note,
      foto,
      valutazione,
      completato,
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