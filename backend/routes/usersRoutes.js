const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");


router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);
router.delete("/me", requireAuth, userController.deleteMe);

router.put("/me/avatar", requireAuth, userController.updateAvatar);
router.delete("/me/avatar", requireAuth, userController.deleteAvatar);

router.put("/me/password", requireAuth, userController.updatePassword);

router.get("/me/notifications", requireAuth, userController.getNotifications);
router.put("/me/notifications/read-all", requireAuth, userController.markAllNotificationRead);
router.put("/me/notifications/:notifId/read", requireAuth, userController.markNotificationRead);
router.put("/me/notifications/:notifId/status", requireAuth, userController.updateNotificationStatus);
router.delete("/me/notifications", requireAuth, userController.clearNotifications);

router.get("/favorites", requireAuth, userController.getFavoriteTreks);
router.post("/favorites/:trekId", requireAuth, userController.addTrekToFavorites);
router.delete("/favorites/:trekId", requireAuth, userController.removeTrekFromFavorites);

router.get("/verify-email-change/:token", userController.verifyEmailChange);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);

router.get("/search", requireAuth, userController.searchUsers);

router.get("/:id", userController.getUserById);


module.exports = router;
