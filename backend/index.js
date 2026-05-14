const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
); // permette richieste dal frontend
app.use(express.json());
app.use(cookieParser());

const userRoutes = require("./routes/usersRoutes");
const trekRoutes = require("./routes/treksRoutes");
const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes"); //!!!
const diaryRoutes = require("./routes/diaryRoutes");


app.use("/treks", trekRoutes);
app.use("/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/activities", activityRoutes); //!!!
app.use("/diary", diaryRoutes);

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

