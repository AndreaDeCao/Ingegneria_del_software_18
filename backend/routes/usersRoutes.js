const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");


router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);
router.delete("/me/avatar", requireAuth, userController.deleteAvatar);
router.delete("/me", requireAuth, userController.deleteMe);

router.put("/me/avatar", requireAuth, userController.updateAvatar);

router.put("/me/password", requireAuth, userController.updatePassword);

router.get("/", userController.getUsers);
router.get("/favorites", requireAuth, userController.getFavoriteTreks);
router.get("/verify-email-change/:token", userController.verifyEmailChange);

router.post("/", userController.createUser);
router.post("/favorites/:trekId", requireAuth, userController.addTrekToFavorites);
router.delete("/favorites/:trekId", requireAuth, userController.removeTrekFromFavorites);

router.get("/:id", userController.getUserById);

router.get("/me/notifications", requireAuth, userController.getNotifications);
router.put("/me/notifications/read-all", requireAuth, userController.markAllNotificationRead);


module.exports = router;
