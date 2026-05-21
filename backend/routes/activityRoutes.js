const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
//const authenticate = require("../middleware/requireAuth");
//const requireAdmin = require("../middleware/requireAdmin");

//const Activity = require("../models/Activity");


router.get("/", activityController.getActivities);

router.post("/", activityController.createActivity);

router.get("/:id", activityController.getActivityById);
//router.post("/", authenticate, requireAdmin, activityController.createActivity); 

module.exports = router;
