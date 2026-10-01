const mongoose = require("mongoose");

const readingSchema = new mongoose.Schema({
  soil: Number,
  temp: Number,
  humidity: Number,
  pumpOn: Boolean,
  mode: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reading", readingSchema);
