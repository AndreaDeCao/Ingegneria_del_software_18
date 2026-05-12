const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// const { refresh } = require("../controllers/authController");
const authenticate = require("../middleware/requireAuth");

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticazione (JWT + OAuth)
 */

/**
 * @swagger
 * /api/auth/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Legge il cookie httpOnly `refresh_token` e restituisce un nuovo `accessToken`.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nuovo access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token mancante/non valido/scaduto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/auth/refresh", authController.refresh);


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               cognome:
 *                 type: string
 *                 nullable: true
 *               email:
 *                 type: string
 *                 format: email
 *               nickname:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               confermaPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email o nickname già in uso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login effettuato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email/password mancanti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Credenziali non valide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout utente
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout effettuato
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 */
router.post("/logout", authController.logout);


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Dati dell'utente loggato
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utente (safe)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/SafeUser'
 *       401:
 *         description: Token mancante/non valido/scaduto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", authenticate, authController.me);



/**
 * @swagger
 * /api/auth/github:
 *   get:
 *     summary: Redirect OAuth GitHub
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect verso GitHub
 */
router.get("/github", authController.githubRedirect);

/**
 * @swagger
 * /api/auth/github/callback:
 *   get:
 *     summary: Callback OAuth GitHub
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect verso frontend con `accessToken`
 *       400:
 *         description: Errore scambio token o dati invalidi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: State non valido (anti-CSRF)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/github/callback", authController.githubCallback);

/**
 * @route GET /api/auth/google
 * @description Reindirizza l'utente alla pagina di login di Google
 */
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Redirect OAuth Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect verso Google
 */
router.get("/google", authController.googleRedirect);

/**
 * @route GET /api/auth/google/callback
 * @description Callback OAuth — Google reindirizza qui dopo login dell'utente
 */
/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback OAuth Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect verso frontend con `accessToken`
 *       400:
 *         description: Errore scambio token o dati invalidi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: State non valido (anti-CSRF)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/google/callback", authController.googleCallback);

module.exports = router;

