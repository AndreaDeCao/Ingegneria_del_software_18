//FILE PER LA GENERAZIONE AUTOMATICA DELLA DOCUMENTAZIONE API CON SWAGGER

// const swaggerJsdoc = require('swagger-jsdoc');
// // const fs = require('fs');
// const path = require("path");

// // fs.writeFileSync('./openapi.json', JSON.stringify(swaggerSpec, null, 2));

// const options = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'DoloMate API',
//       version: '1.0.0',
//       description: 'API documentation per il progetto DoloMate (gestione treks, attività, utenti, autenticazione JWT + OAuth)',
//     },
//     servers: [
//       {
//         url: 'http://localhost:3000',
//         description: 'Development server',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         },
//       },
//       schemas: {
//         Error: {
//           type: "object",
//           properties: { error: { type: "string" } },
//         },
//         SafeUser: {
//           type: "object",
//           properties: {
//             _id: { type: "string" },
//             nome: { type: "string" },
//             cognome: { type: "string", nullable: true },
//             email: { type: "string" },
//             nickname: { type: "string" },
//           },
//         },
//         AuthResponse: {
//           type: "object",
//           properties: {
//             user: { $ref: "#/components/schemas/SafeUser" },
//             accessToken: { type: "string" },
//           },
//         },
//         Trek: {
//           type: "object",
//           properties: {
//             _id: { type: "string" },
//             id: { type: "number" },
//             name: { type: "string" },
//             difficulty: { type: "string", enum: ["Facile", "Medio", "Difficile"] },
//             description: { type: "string", nullable: true },
//             SatRouteNumber: { type: "string", nullable: true },
//             duration: { type: "string", nullable: true },
//             lengthKm: { type: "number", nullable: true },
//             elevationGain: { type: "number", nullable: true },
//             startPoint: { type: "string", nullable: true },
//             endPoint: { type: "string", nullable: true },
//             condizioniAttuali: { type: "string", nullable: true },
//             createdBy: { type: "string", nullable: true },
//           },
//         },
//         Activity: {
//           type: "object",
//           properties: {
//             _id: { type: "string" },
//             id: { type: "number" },
//             title: { type: "string" },
//             description: { type: "string", nullable: true },
//             activityDate: { type: "string", format: "date-time" },
//             maxParticipants: { type: "number", nullable: true },
//             status: { type: "string", enum: ["Aperto", "Chiuso", "Annullato"] },
//             organizerID: { type: "string", nullable: true },
//             trekID: { type: "string", nullable: true },
//           },
//         },
//         User: {
//           type: "object",
//           properties: {
//             _id: { type: "string" },
//             nome: { type: "string" },
//             cognome: { type: "string", nullable: true },
//             email: { type: "string" },
//             nickname: { type: "string" },
//             passwordHash: { type: "string" },
//             googleId: { type: "string", nullable: true },
//             githubId: { type: "string", nullable: true },
//           },
//         },
//       },
//     },
//   },
//   // Percorsi dove cercare le annotazioni
//   apis: [
//     path.join(__dirname, "routes", "*.js"),
//     path.join(__dirname, "controllers", "*.js"),
//   ],
// };

// module.exports = swaggerJsdoc(options);
