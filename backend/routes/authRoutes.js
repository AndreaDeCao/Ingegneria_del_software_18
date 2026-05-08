const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// const { refresh } = require("../controllers/authController");
const authenticate = require("../middleware/requireAuth");

router.post("/auth/refresh", authController.refresh);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;

