const mongoose = require("mongoose");

const wateringEventSchema = new mongoose.Schema({
  mode: String, // "auto" | "manual"
  soilBefore: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WateringEvent", wateringEventSchema);
