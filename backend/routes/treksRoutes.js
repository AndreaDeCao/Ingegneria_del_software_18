const express = require("express");
const router = express.Router();
const trekController = require("../controllers/treksController");
const authenticate = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// router.post("/", trekController.createTrek);
// router.get("/treks", authenticate, trekController.getTreks);


router.get("/", trekController.getTreks);

router.get("/:id", trekController.getTreksById);

router.post("/", authenticate, requireAdmin, trekController.createTrek); 


module.exports = router;
