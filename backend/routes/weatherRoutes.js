const express = require("express");

const router = express.Router();

const {getWeatherByTrek, } = require("../controllers/weatherController");

router.get("/:trekId", getWeatherByTrek);

module.exports = router;