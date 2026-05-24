const express = require("express");
const router = express.Router();
const routeController = require("../controllers/routeController");

// GET /api/route/:id — nessuna autenticazione richiesta (percorso pubblico)
router.get("/:id", routeController.getRouteByTrekId);

// 
router.get("/:id/custom", routeController.getRouteCustomStart); 
router.get("/:id/suggestions", routeController.getRouteSuggestions);

module.exports = router;