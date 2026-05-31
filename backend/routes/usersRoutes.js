const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");


router.get("/", userController.getUsers);
router.get("/favorites", requireAuth, userController.getFavoriteTreks);
router.get("/:id", userController.getUserById);

router.post("/", userController.createUser);
router.post("/favorites/:trekId", requireAuth, userController.addTrekToFavorites);

router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);
router.delete("/me/avatar", requireAuth, userController.deleteAvatar);
router.delete("/me", requireAuth, userController.deleteMe);
router.get("/verify-email-change/:token", userController.verifyEmailChange);
router.put("/me/avatar", requireAuth, userController.updateAvatar);

router.put("/me/password", requireAuth, userController.updatePassword);



module.exports = router;
