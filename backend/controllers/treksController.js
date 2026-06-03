const mongoose = require("mongoose");

const Trek = require("../models/treks");
const Rating = require("../models/ratings");


/**
 * Genera il prossimo id numerico disponibile in modo sicuro contro le race condition.
 * Usa findOneAndUpdate con $inc su un documento "counter" oppure, più semplicemente,
 * legge il valore MAX corrente con una query aggregata e lo incrementa di 1.
 *
 * In caso di inserimento concorrente il vincolo `unique: true` su `id` farà fallire
 * il secondo salvataggio con un errore di duplicate key (E11000); il chiamante dovrà
 * effettuare un retry — vedi createTrek.
 *
 * @returns {Promise<number>}
 */
async function nextTrekId() {
  const last = await Trek.findOne().sort({ id: -1 }).select("id").lean();
  return last ? last.id + 1 : 1;
}

// GET tutti i percorsi
exports.getTreks = async (req, res) => {
  try {
    const treks = await Trek.find();
    res.json(treks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/treks — crea un nuovo percorso (solo admin).
 *
 * Genera automaticamente l'id numerico progressivo.
 * In caso di conflitto su id (race condition) ritenta fino a 5 volte.
 */
exports.createTrek = async (req, res) => {
  // Sicurezza: solo admin (il middleware requireAdmin blocca già prima,
  // ma un controllo esplicito qui rende il controller autonomamente sicuro).
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Accesso negato: solo gli admin possono creare percorsi." });
  }

  // Campi che il client NON deve poter forzare
  const { id: _ignored, averageRating: _r, ratingCount: _rc, ...safeBody } = req.body;

  const MAX_RETRIES = 5;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const newId = await nextTrekId();

      const newTrek = new Trek({
        ...safeBody,
        id: newId,
        createdBy: req.userId,
      });

      await newTrek.save();

      // Risposta esplicita con entrambi gli id per il frontend
      return res.status(201).json({
        ...newTrek.toObject(),
        numericId: newTrek.id,   // campo numerico custom
        mongoId: newTrek._id,    // ObjectId MongoDB
      });
    } catch (err) {
      // Duplicate key su campo `id` → qualcun altro ha preso lo stesso numero
      const isDuplicateId =
        err.code === 11000 &&
        err.keyPattern &&
        err.keyPattern.id;

      if (isDuplicateId && attempt < MAX_RETRIES) {
        // Ritenta con il prossimo id disponibile
        continue;
      }

      // Errore di validazione o altri errori
      const status = err.name === "ValidationError" ? 400 : 500;
      return res.status(status).json({ error: err.message });
    }
  }

  // Tutti i tentativi esauriti (estremamente raro in produzione normale)
  return res.status(500).json({ error: "Impossibile assegnare un id univoco al percorso. Riprova." });
};

// GET /api/treks/mongo/:mongoId/number-id
exports.getNumericIdByMongoId = async (req, res) => {
  try {
    const { mongoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mongoId)) {
      return res.status(400).json({ error: "Mongo ID non valido" });
    }

    const trek = await Trek.findById(mongoId).select("id");

    if (!trek) {
      return res.status(404).json({ error: "Percorso non trovato" });
    }

    res.json({ id: trek.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Restituisce un percorso in base all'id
 * @param {string} id - id percorso
 * @returns {object} percorso restituito
 */

exports.getTreksById = async (req, res) => {
  try {
    const trek = await Trek.findOne({id: parseInt(req.params.id)});
    if(!trek){
      return res.status(404).json({error: "Percorso non trovato"});
    }
    res.json(trek);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
}



// Funzione interna per ricalcolare la media
async function recalcRating(trekId) {
  const result = await Rating.aggregate([
    { $match: { trek: new mongoose.Types.ObjectId(trekId) } },
    { $group: { _id: '$trek', avg: { $avg: '$vote' }, count: { $sum: 1 } } }
  ]);

  await Trek.findByIdAndUpdate(trekId, {
    averageRating: result[0] ? parseFloat(result[0].avg.toFixed(1)) : 0,
    ratingCount:   result[0]?.count ?? 0
  });
}

// PUT /api/treks/:id/rate
exports.rateTrek = async (req, res) => {
  console.log("body:", req.body);
  console.log("user:", req.userId);
  console.log("params:", req.params);

  const { vote, note } = req.body;

  if (!vote || vote < 1 || vote > 5) {
    return res.status(400).json({ message: 'Voto non valido (1-5)' });
  }

  try {
    // Trova il trek tramite id numerico per ottenere il _id MongoDB
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ message: 'Percorso non trovato' });
    if (req.user.role === "admin") {
      return res.status(403).json({ message: 'Gli admin non possono votare' });
    }

    await Rating.findOneAndUpdate(
      { trek: trek._id, user: req.userId },
      { vote, note: note ?? "", updatedAt: new Date() },
      { upsert: true, returnDocument: 'after', runValidators: true } 
    );

    await recalcRating(trek._id);

    const updated = await Trek.findById(trek._id).select('averageRating ratingCount');
    res.json({ message: 'Voto salvato', averageRating: updated.averageRating, ratingCount: updated.ratingCount });
  } catch (err) {
    res.status(500).json({ message: 'Errore nel salvataggio del voto', error: err.message });
  }
};

// GET /api/treks/:id/rate  → restituisce il voto dell'utente corrente
exports.getMyRating = async (req, res) => {
  try {
    const trek = await Trek.findOne({ id: parseInt(req.params.id) });
    if (!trek) return res.status(404).json({ message: 'Percorso non trovato' });
    if (req.user.role === "admin") {
      return res.status(403).json({ message: 'Gli admin non possono votare' });
    }

    const rating = await Rating.findOne({ trek: trek._id, user: req.userId });
    res.json({ vote: rating?.vote ?? null, note: rating?.note ?? "" });
  } catch (err) {
    res.status(500).json({ message: 'Errore', error: err.message });
  }
};

// PATCH /treks/:id/description  — solo admin
exports.updateTrekDescription = async (req, res) => {
  try {
    const { description } = req.body;

    // req.user dev'essere popolato dal tuo middleware auth (es. verifyToken)
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Accesso negato: solo gli admin possono modificare la descrizione." });
    }

    if (typeof description !== "string") {
      return res.status(400).json({ error: "Campo 'description' mancante o non valido." });
    }

    const trek = await Trek.findOneAndUpdate(
      { id: req.params.id },          // usa _id se preferisci
      { description: description.trim() },
      { new: true }
    );

    if (!trek) return res.status(404).json({ error: "Trek non trovato." });

    res.json(trek);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};