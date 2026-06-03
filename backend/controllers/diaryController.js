const mongoose = require("mongoose");
const DiaryEntry = require("../models/diary");
const Trek = require("../models/treks");
const User = require("../models/users");
const Friendship = require("../models/friendship");

// GET /api/diary --> restituisce le voci del diario dell'utente loggato
const getDiary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId); // conversione esplicita
    const entries = await DiaryEntry
      .find({ userId })
      // modifica il populate in getDiary
      .populate("trekId", "name difficulty duration lengthKm coordinates endCoordinates id")
      .populate("amici", "nome cognome nickname avatarUrl")
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
      .populate("trekId", "name difficulty duration lengthKm coordinates endCoordinates id")
      .populate("amici", "nome cognome nickname avatarUrl");

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

    if(amici && amici.length > 0) {
      const author = await User.findById(req.userId);
      for(const friendId of amici) {
        await addNotification(
          friendId,
          "diary_tag",
          `${author.nickname} ti ha aggiunto in una voce del diario: "${titolo}"`,
          saved._id
        );
      }
    }

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
      amici: req.body.amici ?? entry.amici,
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

// Distanza in km tra due coordinate (formula Haversine) — fallback per GPX senza metadata
// formula Haversine: calcola la distanza più breve tra due punti sulla superficie terrestre usando latitudine e longitudine, considerando la Terra come una sfera
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_HIKING_SPEED_KMH = 3.5;

// Estrae { km, minuti } da una stringa GPX.
// Prima legge <distance> e <duration> dalle extensions dei metadata
// (formato DoloMate: distance in metri, duration in secondi).
// Se assenti, calcola i km via Haversine dai trkpt e stima la durata.
function parseGpxStats(gpxString) {
  if (!gpxString) return null;
  try {
    const distMatch = gpxString.match(/<distance>([\d.]+)<\/distance>/);
    const durMatch  = gpxString.match(/<duration>([\d.]+)<\/duration>/);

    if (distMatch) {
      const km = parseFloat(distMatch[1]) / 1000;
      return {
        km,
        //problema di differenza tra diario e statistiche //FIXME controlla
        // minuti: durMatch ? parseFloat(durMatch[1]) / 60 : (km / DEFAULT_HIKING_SPEED_KMH) * 60,
        minuti: (km / DEFAULT_HIKING_SPEED_KMH) * 60,
      };
    }

    // Fallback Haversine (GPX vecchi senza extensions)
    const regex = /<trkpt[^>]+lat="([\d.\-]+)"[^>]*lon="([\d.\-]+)"/g;
    const points = [];
    let m;
    while ((m = regex.exec(gpxString)) !== null) {
      points.push({ lat: parseFloat(m[1]), lon: parseFloat(m[2]) });
    }
    if (points.length < 2) return null;
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += haversineKm(
        points[i - 1].lat, points[i - 1].lon,
        points[i].lat,     points[i].lon
      );
    }
    return { km: total, minuti: (total / DEFAULT_HIKING_SPEED_KMH) * 60 };
  } catch {
    return null;
  }
}

function calcDifficulty(distanceMeters, durationSeconds) { //uguale in dettagli voce diario
  const km = distanceMeters / 1000;
  const ore = durationSeconds / 3600;
  if (!km || !ore) return null;
  const speed = km / ore;
  if (!speed) return null;
  const score = km * 0.6 + (1 / speed) * 10;
  if (score < 6)
    return "Facile";
  if (score < 12) 
    return "Medio"; 
  return "Difficile"; 
}

//impostazione cifre decimali
function roundPercent(value) {
  return Math.round(value * 100) / 100;
}

function calcDifficultyPercentages(counts) {
  //per verificare
  // console.log(counts + " \nFacile: " + counts.Facile + "\t medio: "+ counts.Medio + "\t difficile: " + counts.Difficile);

  const total = counts.Facile + counts.Medio + counts.Difficile;
  if (!total) {
    return {
      percFacile: 0,
      percMedio: 0,
      percDifficile: 0,
    };
  }

  const percFacile = roundPercent((counts.Facile / total) * 100);
  const percMedio = roundPercent((counts.Medio / total) * 100);
  //per essere sicuri di non sforare il 100%
  const percDifficile = roundPercent(100 - percFacile - percMedio);

  return {
    percFacile,
    percMedio,
    percDifficile,
  };
}

// GET /api/diary/stats --> statistiche del diario dell'utente loggato
const getDiaryStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    // Recupera tutte le voci completate
    const entries = await DiaryEntry.aggregate([
      {
        $match: {
          userId,
          completato: true,
        },
      },
      {
        // left join con treks
        $lookup: {
          from: "treks",
          localField: "trekId",
          foreignField: "_id",
          as: "trek",
        },
      },
      {
        // trek -> oggetto singolo oppure null
        $addFields: {
          trek: { $arrayElemAt: ["$trek", 0] },
        },
      },
      {
        $project: {
          valutazione: 1,
          gpxData: 1,

          // dati trek
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

    const counts = {
      Facile: 0,
      Medio: 0,
      Difficile: 0,
    };

    for (const e of entries) {
      let difficultyForStats = null;

      // KM + DURATA

      if (e.gpxData) {
        // priorità ai dati GPX
        const gpx = parseGpxStats(e.gpxData);

        if (gpx) {

          // km
          totaleKm += gpx.km;

          // minuti
          if (gpx.minuti != null) {
            totaleMinuti += gpx.minuti;
          }

          // Difficolta calcolata dal GPX, anche per trek con partenza custom.
          if (
            gpx.km &&
            gpx.minuti
          ) {
            difficultyForStats = calcDifficulty(
              gpx.km * 1000,      // metri
              gpx.minuti * 60     // secondi
            );
          }
        }

      } else if (e.lengthKm != null) {

        // fallback ai dati DB
        totaleKm += e.lengthKm;

        if (e.duration) {
          totaleMinuti += parseDuration(e.duration);
        }

        difficultyForStats = e.difficulty;
      }

      // Fallback alla difficolta del trek quando il GPX non basta.
      if (!difficultyForStats) {
        difficultyForStats = e.difficulty;
      }

      if (
        difficultyForStats &&
        difficultyForStats in counts
      ) {
        counts[difficultyForStats]++;
      }

      // VALUTAZIONE
      if (e.valutazione != null) {
        sommaVal += e.valutazione;
        countVal++;
      }
    }

    const totaleUscite = entries.length;

    totaleKm = Math.round(totaleKm * 10) / 10;
    const difficultyPercentages = calcDifficultyPercentages(counts);

    res.json({
      totaleUscite,

      totaleKm,

      totaleOre: Math.floor(totaleMinuti / 60),

      totaleMinutiExtra: Math.floor(
        totaleMinuti % 60
      ),

      mediaValutazione: countVal
        ? Math.round((sommaVal / countVal) * 10) / 10
        : null,

      ...difficultyPercentages,
    });

  } catch (err) {
    console.error("Errore getDiaryStats:", err);

    res.status(500).json({
      error: "Errore nel calcolo delle statistiche",
    });
  }
};


/**
 * Aggiunge una notifica all'utente.
 * 
 * @param {string} userId - ID utente destinatario
 * @param {string} type - Tipo di notifica
 * @param {string} message - Testo della notifica
 * @param {string|null} ref - ID risorsa correlata
 */
async function addNotification(userId, type, message, ref = null) {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        notifications: {
          type, message, ref, createdAt: new Date()
        }
      }
    });

  } catch(err) {
    console.error("addNotification error:", err.message);
  }
}

// ── ADMIN — SEGNALAZIONI SUI PERCORSI ────────────────────────────────────────

/**
 * GET /api/diary/segnalazioni?trekId=<numericId>
 * Restituisce tutte le voci con segnalazione per il percorso. Solo admin.
 * Ordine: pending prima, poi accepted, poi dismissed.
 */
const getSegnalazioniByTrek = async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId).select("role");
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Accesso riservato agli amministratori" });
    }

    const { trekId } = req.query;
    if (!trekId) return res.status(400).json({ error: "trekId obbligatorio" });

    const trek = await Trek.findOne({ id: parseInt(trekId) });
    if (!trek) return res.status(404).json({ error: "Percorso non trovato" });

    // aggregate evita il casting di Mongoose su operatori query annidati
    const entries = await DiaryEntry.aggregate([
      {
        $match: {
          trekId: trek._id,
          "segnalazione.tipo": { $exists: true, $ne: "Utente" },
        },
      },
      {
        // Esclude voci senza tipo valido (null, stringa vuota)
        $match: {
          $expr: {
            $and: [
              { $ne: ["$segnalazione.tipo", null] },
              { $ne: ["$segnalazione.tipo", ""] },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
          pipeline: [{ $project: { nickname: 1, email: 1, nome: 1, cognome: 1 } }],
        },
      },
      { $addFields: { userId: { $arrayElemAt: ["$userId", 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "segnalazione.utenteId",
          foreignField: "_id",
          as: "reportedUser",
          pipeline: [{ $project: { nickname: 1, nome: 1, cognome: 1 } }],
        },
      },
      { $addFields: { reportedUser: { $arrayElemAt: ["$reportedUser", 0] }}},
      { $project: { userId: 1, titolo: 1, data: 1, segnalazione: 1, createdAt: 1, reportedUser: 1 } },
      {
        // pending=0, accepted=1, dismissed=2 → ordine naturale per l'admin
        $addFields: {
          _statoOrdine: {
            $switch: {
              branches: [
                { case: { $eq: ["$segnalazione.stato", "pending"]   }, then: 0 },
                { case: { $eq: ["$segnalazione.stato", "accepted"]  }, then: 1 },
                { case: { $eq: ["$segnalazione.stato", "dismissed"] }, then: 2 },
              ],
              default: 0,
            },
          },
        },
      },
      { $sort: { _statoOrdine: 1, createdAt: -1 } },
      { $project: { _statoOrdine: 0 } },
    ]);

    res.json(entries);
  } catch (err) {
    console.error("getSegnalazioniByTrek:", err);
    res.status(500).json({ error: "Errore nel recupero delle segnalazioni" });
  }
};

/**
 * GET /api/diary/segnalazioni-accettate?trekId=<numericId>
 * Endpoint pubblico: restituisce solo il conteggio e i tipi delle segnalazioni
 * accepted per un percorso. Usato dal TrekDetails per mostrare il banner.
 */
const getSegnalazioniAccettate = async (req, res) => {
  try {
    const { trekId } = req.query;
    if (!trekId) return res.status(400).json({ error: "trekId obbligatorio" });

    const trek = await Trek.findOne({ id: parseInt(trekId) });
    if (!trek) return res.status(404).json({ error: "Percorso non trovato" });

    const entries = await DiaryEntry.aggregate([
      {
        $match: {
          trekId: trek._id,
          "segnalazione.tipo": { $exists: true },
        },
      },
      {
        $match: {
          $expr: {
            $and: [
              { $ne: ["$segnalazione.tipo", null] },
              { $ne: ["$segnalazione.tipo", ""] },
              { $eq: ["$segnalazione.stato", "accepted"] },
            ],
          },
        },
      },
      {
        $project: { "segnalazione.tipo": 1, "segnalazione.descrizione": 1 },
      },
    ]);

    res.json({
      count: entries.length,
      tipi: [...new Set(entries.map((e) => e.segnalazione.tipo))],
    });
  } catch (err) {
    console.error("getSegnalazioniAccettate:", err);
    res.status(500).json({ error: "Errore nel recupero delle segnalazioni" });
  }
};

/**
 * Helper: aggiorna lo stato di una segnalazione. Solo admin.
 */
const _aggiornaStatoSegnalazione = async (req, res, nuovoStato) => {
  try {
    const adminUser = await User.findById(req.userId).select("role");
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Accesso riservato agli amministratori" });
    }

    const entry = await DiaryEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ error: "Voce non trovata" });
    if (!entry.segnalazione?.tipo) {
      return res.status(400).json({ error: "Questa voce non ha una segnalazione" });
    }
    if (entry.segnalazione.stato === nuovoStato) {
      return res.status(400).json({ error: `Segnalazione già in stato "${nuovoStato}"` });
    }

    entry.segnalazione.stato     = nuovoStato;
    entry.segnalazione.gestitaAt = new Date();
    entry.segnalazione.gestitaDa = req.userId;
    await entry.save();

    res.json({ message: `Segnalazione aggiornata a "${nuovoStato}"`, entry });
  } catch (err) {
    console.error("_aggiornaStatoSegnalazione:", err);
    res.status(500).json({ error: "Errore nell'aggiornamento della segnalazione" });
  }
};

/**
 * PATCH /api/diary/segnalazioni/:entryId/accept
 * Admin accetta la segnalazione → diventa visibile a tutti nel TrekDetails.
 */
const acceptSegnalazione = (req, res) => _aggiornaStatoSegnalazione(req, res, "accepted");

/**
 * PATCH /api/diary/segnalazioni/:entryId/dismiss
 * Admin rigetta la segnalazione → nascosta a tutti.
 */
const dismissSegnalazione = (req, res) => _aggiornaStatoSegnalazione(req, res, "dismissed");

/**
 * PATCH /api/diary/segnalazioni/:entryId/reopen
 * Admin riporta la segnalazione in pending per rivalutarla.
 */
const reopenSegnalazione = (req, res) => _aggiornaStatoSegnalazione(req, res, "pending");


// ── NOTIFICHE ────────────────────────────────────────────────────────────────

/**
 * Aggiunge una notifica all'utente.
 */
async function addNotification(userId, type, message, ref = null) {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: { type, message, ref, createdAt: new Date() } }
    });
  } catch(err) {
    console.error("addNotification error:", err.message);
  }
}


/**
 * GET /api/diary/segnalazioni-utenti
 * Restituisce tutte le voci con segnalazione di tipo "Utente".
 */
const getSegnalazioniUtenti = async (req, res) => {
  try {
    const adminUser = await User.findById(req.userId).select("role");
    if(!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Accesso riservato agli amministratori" });
    }

    const entries = await DiaryEntry.aggregate([
      {
        $match: {
          "segnalazione.tipo": "Utente",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
          pipeline: [{ $project: { nickname: 1, email: 1, nome: 1, cognome: 1 } }],
        },
      },
      { $addFields: { userId: { $arrayElemAt: ["$userId", 0] } } },
      {
        $lookup: {
          from: "users",
          localField: "segnalazione.utenteId",
          foreignField: "_id",
          as: "reportedUser",
          pipeline: [{ $project: { nickname: 1, nome: 1, cognome: 1 } }],
        },
      },
      { $addFields: { reportedUser: { $arrayElemAt: ["$reportedUser", 0] } } },
      { $project: { userId: 1, titolo: 1, data: 1, segnalazione: 1, createdAt: 1, reportedUser: 1 } },
      {
        $addFields: {
          _statoOrdine: {
            $switch: {
              branches: [
                { case: { $eq: ["$segnalazione.stato", "pending"] }, then: 0 },
                { case: { $eq: ["$segnalazione.stato", "accepted"] }, then: 1 },
                { case: { $eq: ["$segnalazione.stato", "dismissed"] }, then: 2 },
              ],
              default: 0,
            },
          },
        },
      },
      { $sort: { _statoOrdine: 1, createdAt: -1 } },
      { $project: { _statoOrdine: 0 } },
    ]);

    res.json(entries);

  } catch(err) {
    console.error("getSegnalazioniUtenti:", err);
    res.status(500).json({ error: "Errore nel recupero delle segnalazioni utenti" });
  }
};

// ── SOSTITUISCI il module.exports esistente con questo ────────────────────────
module.exports = { getDiary, getEntryById, createEntry, updateEntry, deleteEntry, getDiaryStats, getSegnalazioniByTrek, acceptSegnalazione, dismissSegnalazione, reopenSegnalazione, getSegnalazioniAccettate, getSegnalazioniUtenti };