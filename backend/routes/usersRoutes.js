const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");


router.get("/", userController.getUsers);


router.post("/", userController.createUser);
router.get("/:id", userController.getUserById);

router.post("/favorites/:trekId", requireAuth, userController.addTrekToFavorites);

module.exports = router;
