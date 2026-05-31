const mongoose = require("mongoose");

const Trek = require("../models/treks");
const Rating = require("../models/ratings");

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

    const rating = await Rating.findOne({ trek: trek._id, user: req.userId });
    res.json({ vote: rating?.vote ?? null, note: rating?.note ?? "" });
  } catch (err) {
    res.status(500).json({ message: 'Errore', error: err.message });
  }
};
