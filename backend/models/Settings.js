const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  mode: { type: String, default: "auto" }, // "auto" | "manual"
  threshold: { type: Number, default: 30 },
  duration: { type: Number, default: 5000 } // ms
});

module.exports = mongoose.model("Settings", settingsSchema);
