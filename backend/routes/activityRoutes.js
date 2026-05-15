const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

//const Activity = require("../models/Activity");

/**
 * @swagger
 * tags:
 *   - name: Activities
 *     description: Gestione attività
 */

/**
 * @swagger
 * /activities:
 *   get:
 *     summary: Ottieni tutte le attività
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: Lista attività
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Activity'
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", activityController.getActivities);

/**
 * @swagger
 * /activities:
 *   post:
 *     summary: Crea una nuova attività
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       201:
 *         description: Attività creata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Activity'
 *       400:
 *         description: Dati non validi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", activityController.createActivity);

module.exports = router;
