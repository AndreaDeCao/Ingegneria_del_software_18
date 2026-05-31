const express = require("express");
const router = express.Router();
const trekController = require("../controllers/treksController");
const authenticate = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const requireAuth = require("../middleware/requireAuth");
const { rateTrek, getMyRating } = require('../controllers/treksController');

// router.post("/", trekController.createTrek);
// router.get("/treks", authenticate, trekController.getTreks);


router.get("/", trekController.getTreks);

router.get("/by-mongo-id/:mongoId", trekController.getNumericIdByMongoId);

router.get("/:id", trekController.getTreksById);

router.post("/", authenticate, requireAdmin, trekController.createTrek); 

//per ratings
router.put('/:id/rate', requireAuth, rateTrek);
router.get('/:id/rate', requireAuth, getMyRating);

module.exports = router;
