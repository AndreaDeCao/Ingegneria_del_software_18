const express = require("express");
const router = express.Router();
const friendshipController = require("../controllers/friendshipController");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);

// Ricerca utenti per nickname o nome
router.get("/search", friendshipController.searchUsers);

// Restituisce la lista degli amici dell'utente
router.get("/", friendshipController.getFriends);

// Restituisce le richieste in entrata
router.get("/requests/incoming", friendshipController.getIncomingRequests);

// Restituisce le richieste in uscita
router.get("/requests/outgoing", friendshipController.getOutgoingRequests);

// Invia richiesta di amicizia
router.post("/requests/:userId", friendshipController.sendRequest);

// Accetta richiesta di amicizia
router.put("/accept/:friendshipId", friendshipController.acceptRequest);

// Rifiuta richiesta di amicizia
router.put("/decline/:friendshipId", friendshipController.declineRequest);

// Rimuove amicizia esistente
router.delete("/:friendshipId", friendshipController.removeFriend);

module.exports = router;