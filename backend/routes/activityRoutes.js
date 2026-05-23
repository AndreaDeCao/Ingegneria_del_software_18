const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
//const authenticate = require("../middleware/requireAuth");
//const requireAdmin = require("../middleware/requireAdmin");

//const Activity = require("../models/Activity");


router.get("/", activityController.getActivities);
router.get("/:id", activityController.getActivityById);

router.post("/", activityController.createActivity);
router.post("/:id/join", activityController.joinActivity);
router.post("/:id/leave", activityController.leaveActivity);

router.patch("/:id/cancel", activityController.cancelActivity);
router.patch("/:id/uncancel", activityController.uncancelActivity);
router.patch("/:id/close", activityController.closeActivity);
router.patch("/:id/open", activityController.openActivity);
//router.post("/", authenticate, requireAdmin, activityController.createActivity); 

module.exports = router;
