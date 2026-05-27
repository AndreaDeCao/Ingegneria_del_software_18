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


// Parsea stringhe tipo "6 ore 10 min", "3 ore", "45 min" → minuti totali
function parseDuration(str) {
  if (!str) return 0;
  const ore = str.match(/(\d+)\s*or[ae]/i);
  const min = str.match(/(\d+)\s*min/i);
  return (ore ? parseInt(ore[1]) * 60 : 0) + (min ? parseInt(min[1]) : 0);
}

// GET /api/diary/stats --> statistiche del diario dell'utente loggato
const getDiaryStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const entries = await DiaryEntry.aggregate([
      {
        $match: {
          userId,
          completato: true,
          trekId: { $ne: null, $exists: true },
        },
      },
      {
        $lookup: {
          from: "treks",
          localField: "trekId",
          foreignField: "_id",
          as: "trek",
        },
      },
      { $unwind: "$trek" },
      {
        $project: {
          valutazione: 1,
          difficulty: "$trek.difficulty",
          lengthKm: "$trek.lengthKm",
          duration: "$trek.duration",
        },
      },
    ]);

    if (!entries.length) {
      return res.json({
        totaleUscite: 0,
        totaleKm: 0,
        totaleOre: 0,
        totaleMinutiExtra: 0,
        mediaValutazione: null,
        percFacile: 0,
        percMedio: 0,
        percDifficile: 0,
      });
    }

    let totaleKm = 0;
    let totaleMinuti = 0;
    let sommaVal = 0;
    let countVal = 0;
    const counts = { Facile: 0, Medio: 0, Difficile: 0 };

    for (const e of entries) {
      totaleKm += e.lengthKm ?? 0;
      totaleMinuti += parseDuration(e.duration);
      if (e.valutazione) { sommaVal += e.valutazione; countVal++; }
      if (e.difficulty in counts) counts[e.difficulty]++;
    }

    const tot = entries.length;
    totaleKm = Math.round(totaleKm * 10) / 10;


    res.json({
      totaleUscite: tot,
      totaleKm,
      totaleOre: Math.floor(totaleMinuti / 60),
      totaleMinutiExtra: totaleMinuti % 60,         // es. 6h 40min → ore:6, extra:40
      mediaValutazione: countVal ? Math.round((sommaVal / countVal) * 10) / 10 : null,
      percFacile:    Math.round((counts.Facile    / tot) * 100),
      percMedio:     Math.round((counts.Medio     / tot) * 100),
      percDifficile: Math.round((counts.Difficile / tot) * 100),
    });
  } catch (err) {
    console.error("Errore getDiaryStats:", err);
    res.status(500).json({ error: "Errore nel calcolo delle statistiche" });
  }
};

module.exports = { getDiary, getEntryById, createEntry, updateEntry, deleteEntry, getDiaryStats};