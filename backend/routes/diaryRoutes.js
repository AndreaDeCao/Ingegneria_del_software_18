const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const { getDiary, getEntryById, createEntry, updateEntry, deleteEntry } = require("../controllers/diaryController");

router.get("/", requireAuth, getDiary);      // utente legge il suo diario (tutte le entry)
router.get("/:id", requireAuth, getEntryById);

router.post("/", requireAuth, createEntry);  // utente crea una nuova entry nel suo diario

router.put("/:id",     requireAuth, updateEntry); 
router.delete("/:id",  requireAuth, deleteEntry);

module.exports = router;