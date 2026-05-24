const mongoose = require("mongoose");
const DiaryEntry = require("../models/diary");
const Trek = require("../models/treks");

// GET /api/diary --> restituisce le voci del diario dell'utente loggato
const getDiary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId); // conversione esplicita
    const entries = await DiaryEntry
      .find({ userId })
      // modifica il populate in getDiary
      .populate("trekId", "name difficulty duration lengthKm coordinates endCoordinates id")
      .sort({ data: -1 })
      .limit(100);

    res.json(entries);
  } catch (err) {
    console.error("Errore getDiary:", err); 
    res.status(500).json({ error: "Errore nel recupero del diario" });
  }
};

const getEntryById = async (req, res) => {
  try {
    const entry = await DiaryEntry
      .findOne({ _id: req.params.id, userId: req.userId })
      .populate("trekId", "name difficulty duration lengthKm coordinates endCoordinates id");

    if (!entry) return res.status(404).json({ error: "Voce non trovata" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero della voce" });
  }
};


// POST /api/diary --> crea una nuova voce nel diario
const createEntry = async (req, res) => {
  try {
    const {
      titolo, data, note, foto, valutazione, completato, trekId,
      percorsoPersonalizzato, gpxData, amici, segnalazione
    } = req.body;

    let trekObjectId = null;
    if (trekId) {
      const trek = await Trek.findOne({ id: parseInt(trekId) });
      if (!trek) return res.status(404).json({ error: "Percorso non trovato" });
      trekObjectId = trek._id;
    }

    const entry = new DiaryEntry({
      userId: req.userId,
      titolo, data, note, foto, valutazione, completato,
      trekId: trekObjectId,
      percorsoPersonalizzato: percorsoPersonalizzato || null,
      gpxData: gpxData || null,
      amici: amici || [],
      segnalazione: segnalazione?.tipo ? segnalazione : undefined,
    });

    const saved = await entry.save();
    res.status(201).json(saved);

  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Errore nella creazione della voce" });
  }
};

const updateEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, userId: req.userId });
    if (!entry) return res.status(404).json({ error: "Voce non trovata" });

    const {
      titolo, data, note, foto, valutazione, completato,
      trekId, percorsoPersonalizzato, gpxData, segnalazione
    } = req.body;

    let trekObjectId = entry.trekId;
    if (trekId) {
      const trek = await Trek.findOne({ id: parseInt(trekId) });
      if (!trek) return res.status(404).json({ error: "Percorso non trovato" });
      trekObjectId = trek._id;
    }

    Object.assign(entry, {
      titolo: titolo ?? entry.titolo,
      data: data ?? entry.data,
      note: note ?? entry.note,
      foto: foto ?? entry.foto,
      valutazione: valutazione ?? entry.valutazione,
      completato: completato ?? entry.completato,
      trekId: trekObjectId,
      percorsoPersonalizzato: percorsoPersonalizzato ?? entry.percorsoPersonalizzato,
      gpxData: gpxData ?? entry.gpxData,
      segnalazione: segnalazione?.tipo ? segnalazione : entry.segnalazione,
    });

    const saved = await entry.save();
    res.json(saved);

  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Errore nell'aggiornamento" });
  }
};

const deleteEntry = async (req, res) => {
  try {
    const entry = await DiaryEntry.findOne({ _id: req.params.id, userId: req.userId });
    if (!entry) return res.status(404).json({ error: "Voce non trovata" });
    await entry.deleteOne();
    res.json({ message: "Voce eliminata" });
  } catch (err) {
    res.status(500).json({ error: "Errore nell'eliminazione" });
  }
};

module.exports = { getDiary, getEntryById, createEntry, updateEntry, deleteEntry };