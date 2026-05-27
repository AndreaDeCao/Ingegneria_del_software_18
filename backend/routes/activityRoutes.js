const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

//const Activity = require("../models/Activity");


router.get("/", activityController.getActivities);

router.post("/", activityController.createActivity);

module.exports = router;
