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

// router.get("/auth/google",          authController.googleRedirect);
// router.get("/auth/google/callback", authController.googleCallback);

router.get("/github",          authController.githubRedirect);
router.get("/github/callback", authController.githubCallback);

/**
 * @route GET /api/auth/google
 * @description Reindirizza l'utente alla pagina di login di Google
 */
router.get("/google", authController.googleRedirect);

/**
 * @route GET /api/auth/google/callback
 * @description Callback OAuth — Google reindirizza qui dopo login dell'utente
 */
router.get("/google/callback", authController.googleCallback);

module.exports = router;

