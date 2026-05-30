const { default: mongoose } = require("mongoose");
const moongose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: {type: String, required: true},
  abstract: {type: String, default: "" },
  topics: [String],
  typology: [String],
  startDate: {type: Date, default: null},
  endDate: {type: Date, default: null},
  address: {type: String, default: "" },
  coordinates: {
    lat: {type: Number, default: null},
    lon: {type: Number, default: null},
  },
  isFree: {type: Boolean, default: true},
  imageUrl: {type: String, default: null},
  sourceUrl: { type: String, default: null },
  source:    { type: String, enum: ["comune_trento", "sat", "manual"], default: "manual" },
});

module.exports = mongoose.model("Event", EventSchema);