const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// const { refresh } = require("../controllers/authController");
const authenticate = require("../middleware/requireAuth");
const verifyTurnstile = require("../middleware/verifyTurnstile");
const requireCsrf = require("../middleware/requireCsrf");

// router.post("/auth/refresh", authController.refresh); //errore 404 perché il cookie è impostato con path "/auth/refresh" e quindi viene inviato SOLO a quell'endpoint, ma qui stiamo definendo l'endpoint come "/refresh". Per risolvere, dobbiamo allineare il path del cookie con l'endpoint effettivo, ad esempio impostando entrambi su "/api/auth/refresh" o entrambi su "/auth/refresh". In questo modo, quando il browser invia la richiesta a "/api/auth/refresh", includerà automaticamente il cookie del refresh token, permettendo al controller di processare la richiesta correttamente.
router.get("/csrf", authController.csrf);
router.post("/refresh", requireCsrf, authController.refresh); // endpoint per rinnovare l'access token usando il refresh token (il cookie viene inviato automaticamente dal browser se è presente e valido)

router.post("/register", verifyTurnstile, authController.register);
router.post("/login", verifyTurnstile, authController.login);
router.post("/logout", requireCsrf, authController.logout);
router.get("/verify-email/:token", authController.verifyEmail);
router.get("/me", authenticate, authController.me);

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
