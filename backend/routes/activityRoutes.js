const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
//const authenticate = require("../middleware/requireAuth");
//const requireAdmin = require("../middleware/requireAdmin");

router.get("/", activityController.getActivities);
router.get("/:id", activityController.getActivityById);

router.post("/", activityController.createActivity);
router.post("/:id/join", activityController.joinActivity);
router.post("/:id/leave", activityController.leaveActivity);

router.patch("/:id/cancel", activityController.cancelActivity);
router.patch("/:id/uncancel", activityController.uncancelActivity);
router.patch("/:id/close", activityController.closeActivity);
router.patch("/:id/open", activityController.openActivity);

// ── Admin ──────────────────────────────────────────────────────────────────
router.patch("/:id/suspend", /* requireAdmin, */ activityController.suspendActivity);
router.patch("/:id/unsuspend", /* requireAdmin, */ activityController.unsuspendActivity);

router.delete("/:id", activityController.deleteActivity);

module.exports = router;