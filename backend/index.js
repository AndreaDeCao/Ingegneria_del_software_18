const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// dati finti
const treks = [
  {
    id: 1,
    name: "Monte Bondone",
    difficulty: "Media",
    duration: "3h",
  },
  {
    id: 2,
    name: "Lago di Molveno",
    difficulty: "Facile",
    duration: "2h",
  },
];

// endpoint
app.get("/treks", (req, res) => {
  res.json(treks);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});