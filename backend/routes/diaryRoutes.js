const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getDiary, getEntryById, createEntry, updateEntry, deleteEntry, getDiaryStats, getSegnalazioniByTrek, acceptSegnalazione, dismissSegnalazione, reopenSegnalazione, getSegnalazioniAccettate,} = require("../controllers/diaryController");

router.get("/", requireAuth, getDiary);      // utente legge il suo diario (tutte le entry)
router.get("/stats", requireAuth, getDiaryStats);

// ── SEGNALAZIONI (tutte queste DEVONO stare prima di /:id) ──────────────────

// Pubblico: usato dal TrekDetails per il banner (senza dati sensibili)
router.get("/segnalazioni-accettate", getSegnalazioniAccettate);

// Admin: lista completa con pending/accepted/dismissed
router.get("/segnalazioni",                           requireAuth, getSegnalazioniByTrek);
router.patch("/segnalazioni/:entryId/accept",         requireAuth, acceptSegnalazione);
router.patch("/segnalazioni/:entryId/dismiss",        requireAuth, dismissSegnalazione);
router.patch("/segnalazioni/:entryId/reopen",         requireAuth, reopenSegnalazione);

// -- voci diario
router.get("/:id", requireAuth, getEntryById);

router.post("/", requireAuth, createEntry);  // utente crea una nuova entry nel suo diario

router.put("/:id",     requireAuth, updateEntry); 
router.delete("/:id",  requireAuth, deleteEntry);

module.exports = router;