const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require("express");

const cors = require("cors");
const cookieParser = require("cookie-parser");
const weatherRoutes = require("./routes/weatherRoutes");

const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
mongoose.set("sanitizeFilter", true);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
); // permette richieste dal frontend
// app.use(express.json());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());

// Sanitizzazione input (NoSQL injection): rimuove chiavi con '$' o '.' da body/query/params
function sanitizeKeys(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeKeys);

  for (const key of Object.keys(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete value[key];
      continue;
    }
    value[key] = sanitizeKeys(value[key]);
  }
  return value;
}
app.use((req, _res, next) => {
  sanitizeKeys(req.body);
  sanitizeKeys(req.query);
  sanitizeKeys(req.params);
  next();
});

app.get("/test-eventi", (req, res) => {
  res.json({ ok: true });
});

const userRoutes = require("./routes/usersRoutes");
const trekRoutes = require("./routes/treksRoutes");
const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes"); //!!!
const diaryRoutes = require("./routes/diaryRoutes");
const eventRoutes = require("./routes/eventRoutes");

const routeRoutes = require("./routes/routeRoutes");

app.use("/treks", trekRoutes);
app.use("/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/activities", activityRoutes); 
app.use("/api/weather", weatherRoutes); 
app.use("/api/diary", diaryRoutes);
app.use("/api/trento-events", eventRoutes);
app.use("/api/route", routeRoutes);

// Connessione a MongoDB
mongoose.connect(process.env.MONGODB_URI, { family: 4 })  // Imposta family: 4 per forzare l'uso di IPv4
  .then(() => console.log("MongoDB connesso!"))
  .catch(err => console.error("Errore connessione:", err));


// /**
//  * Restituisce un singolo percorso in base all'id.
//  * @route GET /treks/:id
//  * @param {number} req.params.id - L'id del percorso
//  * @returns {Object} Il percorso trovato
//  * @returns {Object} 404 - Percorso non trovato
//  */

// app.get("/treks/:id", (req, res) => {
//   const trek = treks.find(t => t.id === parseInt(req.params.id));
//   if (!trek) return res.status(404).json({ error: "Percorso non trovato" });
//   res.json(trek);
// });

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
