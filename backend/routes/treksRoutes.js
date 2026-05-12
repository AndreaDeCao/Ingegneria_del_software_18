const express = require("express");
const router = express.Router();
const trekController = require("../controllers/treksController");
const authenticate = require("../middleware/requireAuth");

/**
 * @swagger
 * tags:
 *   - name: Treks
 *     description: Gestione percorsi/trek
 */

/**
 * @swagger
 * /treks/treks:
 *   get:
 *     summary: Ottieni tutti i treks (protetta)
 *     tags: [Treks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dei treks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trek'
 *       401:
 *         description: Non autenticato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/treks", authenticate, trekController.getTreks);

/**
 * @swagger
 * /treks:
 *   get:
 *     summary: Ottieni tutti i treks
 *     tags: [Treks]
 *     responses:
 *       200:
 *         description: Lista dei treks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trek'
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", trekController.getTreks);

/**
 * @swagger
 * /treks:
 *   post:
 *     summary: Crea un nuovo trek
 *     tags: [Treks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Trek'
 *     responses:
 *       201:
 *         description: Trek creato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trek'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", trekController.createTrek);

/**
 * @swagger
 * /treks/{id}:
 *   get:
 *     summary: Ottieni un trek per id numerico
 *     tags: [Treks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: Id numerico del trek (campo `id` nel DB)
 *     responses:
 *       200:
 *         description: Trek trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trek'
 *       404:
 *         description: Trek non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", trekController.getTreksById);

module.exports = router;
