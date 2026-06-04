const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const requireAuth = require("../middleware/requireAuth");
//const authenticate = require("../middleware/requireAuth");
//const requireAdmin = require("../middleware/requireAdmin");

//const Activity = require("../models/Activity");


router.get("/", activityController.getActivities);
router.get("/mine", requireAuth, activityController.getMyActivities);
router.get("/joined", requireAuth, activityController.getJoinedActivities);
router.get("/invited", requireAuth, activityController.getInvitedActivities);
router.get("/:id/invites", requireAuth, activityController.getActivityInvites);
router.get("/:id/invites/me", requireAuth, activityController.getMyActivityInvite);
router.post("/:id/invite/:userId", requireAuth, activityController.sendActivityInvite);
router.put("/:id/invites/:inviteId/accept", requireAuth, activityController.acceptActivityInvite);
router.put("/:id/invites/:inviteId/decline", requireAuth, activityController.declineActivityInvite);
router.put("/:id/invites/:inviteId/cancel", requireAuth, activityController.cancelActivityInvite);

router.post("/", requireAuth, activityController.createActivity);
router.post("/:id/join", requireAuth, activityController.joinActivity);
router.post("/:id/leave", requireAuth, activityController.leaveActivity);

/*
router.post("/:id/invite", requireAuth, activityController.inviteUser);
router.post("/:id/accept-invite", requireAuth, activityController.acceptInvite);
router.post("/:id/decline-invite", requireAuth, activityController.declineInvite);
*/
router.patch("/:id/cancel", requireAuth, activityController.cancelActivity);
router.patch("/:id/uncancel", requireAuth, activityController.uncancelActivity);
router.patch("/:id/close", requireAuth, activityController.closeActivity);
router.patch("/:id/open", requireAuth, activityController.openActivity);

// Segnalazioni
router.post("/:id/report", requireAuth, activityController.reportActivity);
router.patch("/:id/reports/:reportId/accept", requireAuth, activityController.acceptReport);
router.patch("/:id/reports/:reportId/dismiss", requireAuth, activityController.dismissReport);

// Moderazione admin
router.patch("/:id/suspend", requireAuth, activityController.suspendActivity);
router.patch("/:id/unsuspend", requireAuth, activityController.unsuspendActivity);

router.delete("/:id", requireAuth, activityController.deleteActivity);
router.get("/:id", activityController.getActivityById);

// router.get("/:id", activityController.getActivityById);

// router.post("/",requireAuth, activityController.createActivity);

// router.put("/:id/join", requireAuth, activityController.joinActivity);
// router.put("/:id/leave", requireAuth, activityController.leaveActivity);

// router.patch("/:id/cancel", requireAuth, activityController.cancelActivity);
// router.patch("/:id/uncancel", requireAuth, activityController.uncancelActivity);
// router.patch("/:id/close", requireAuth, activityController.closeActivity);
// router.patch("/:id/open", requireAuth, activityController.openActivity);

// router.delete("/:id", requireAuth, activityController.deleteActivity);

//OLD
//const authenticate = require("../middleware/requireAuth");
//const requireAdmin = require("../middleware/requireAdmin");
//const Activity = require("../models/Activity");
// router.get("/", activityController.getActivities);
// router.get("/:id", activityController.getActivityById);
/*
router.post("/", activityController.createActivity);
router.post("/:id/join", activityController.joinActivity);
router.post("/:id/leave", activityController.leaveActivity);

router.patch("/:id/cancel", activityController.cancelActivity);
router.patch("/:id/uncancel", activityController.uncancelActivity);
router.patch("/:id/close", activityController.closeActivity);
router.patch("/:id/open", activityController.openActivity);
router.delete("/:id", activityController.deleteActivity);
//router.post("/", authenticate, requireAdmin, activityController.createActivity); 
*/

module.exports = router;
