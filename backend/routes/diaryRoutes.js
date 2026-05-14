const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { getDiary, createEntry } = require("../controllers/diaryController");

router.get("/", requireAuth, getDiary);      // utente legge il suo diario (tutte le entry)
router.post("/", requireAuth, createEntry);  // utente crea una nuova entry nel suo diario

module.exports = router;