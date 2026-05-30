const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

/**
 * Chiama l'API Open Data del comune di Trento.
 *
 * @route GET /api/trento-events
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>} JSON con la lista degli eventi
 */

router.get("/", eventController.getEventiComune);

module.exports = router;