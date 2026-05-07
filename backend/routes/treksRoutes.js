const express = require("express");
const router = express.Router();
const trekController = require("../controllers/treksController");

router.get("/", trekController.getTreks);
router.post("/", trekController.createTrek);
router.get("/:id", trekController.getTreksById);

module.exports = router;