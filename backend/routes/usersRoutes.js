const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestione utenti
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Ottieni tutti gli utenti
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", userController.getUsers);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crea un utente (diretto DB)
 *     description: Richiede `passwordHash` (non è la registrazione standard, usare `/api/auth/register`).
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Utente creato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", userController.createUser);


module.exports = router;
