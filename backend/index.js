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
    difficulty: "Medio",
    duration: "3h",
  },
  {
    id: 2,
    name: "Lago di Molveno",
    difficulty: "Facile",
    duration: "2h",
  },
  {
    id: 3,
    name: "TEMP",
    difficulty: "Difficile",
    duration: "4h",
  },
  {
    id: 4,
    name: "TEMP2",
    difficulty: "Difficile",
    duration: "5h",
  },
  {
    id: 5,
    name: "TEMP3",
    difficulty: "Facile",
    duration: "0.5h",
  },
  {
    id: 6,
    name: "TEMP4",
    difficulty: "Medio",
    duration: "3h",
  },
  {
    id: 7,
    name: "TEMP5",
    difficulty: "Facile",
    duration: "2h",
  },
  {
    id: 8,
    name: "TEMP6",
    difficulty: "Difficile",
    duration: "4h",
  },
  {
    id: 9,
    name: "TEMP7",
    difficulty: "Facile",
    duration: "1h",
  }
];

// endpoint
app.get("/treks", (req, res) => {
  res.json(treks);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});