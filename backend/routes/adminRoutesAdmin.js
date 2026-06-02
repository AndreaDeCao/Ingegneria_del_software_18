const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const adminController = require("../controllers/adminControllerAdmin");

router.use(requireAuth, requireAdmin);

router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);

router.patch("/users/:id/suspend", adminController.suspendUser);
router.patch("/users/:id/unsuspend", adminController.unsuspendUser);
router.patch("/users/:id/ban", adminController.banUser);
router.patch("/users/:id/unban", adminController.unbanUser);

router.patch("/users/:id/reports/:reportId/:action", adminController.handleUserReport);

module.exports = router;