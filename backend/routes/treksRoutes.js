const express = require("express");
const router = express.Router();
const trekController = require("../controllers/treksController");
const authenticate = require("../middleware/requireAuth");

router.get("/treks", authenticate, trekController.getTreks);

router.get("/", trekController.getTreks);
router.post("/", trekController.createTrek);
router.get("/:id", trekController.getTreksById);

module.exports = router;