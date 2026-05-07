const express = require("express");
const router = express.Router();

const Activity = require("../models/Activity");

router.get("/", ActivityController.getActivities);
router.post("/", ActivityController.createActivity);

module.exports = router;