require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const mqtt = require("mqtt");
const { WebSocketServer } = require("ws");
const http = require("http");

const Reading = require("./models/Reading");
const Settings = require("./models/Settings");
const WateringEvent = require("./models/WateringEvent");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const TOPIC_DATA = "rekia/plantcare/data";
const TOPIC_COMMAND = "rekia/plantcare/command";
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
// DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ensure a settings document exists
async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}

// mqtt
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

mqttClient.on("connect", () => {
  console.log("MQTT connected");
  mqttClient.subscribe(TOPIC_DATA);
});

// track previous pump state to detect "just started watering" transitions
let lastPumpOn = false;

mqttClient.on("message", async (topic, message) => {
  if (topic !== TOPIC_DATA) return;

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (e) {
    return;
  }

  // save reading
  const reading = await Reading.create({
    soil: data.soil,
    temp: data.temp,
    humidity: data.humidity,
    pumpOn: data.pumpOn,
    mode: data.mode
  });

  // log a watering event on the rising edge (pump just turned on)
  if (data.pumpOn && !lastPumpOn) {
    await WateringEvent.create({
      mode: data.mode,
      soilBefore: data.soil
    });
  }
  lastPumpOn = data.pumpOn;

  // broadcast to all connected dashboard clients
  const payload = JSON.stringify({ type: "reading", data: reading });
  wss.clients.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  });
});

// Rest API
app.get("/api/latest", async (req, res) => {
  const latest = await Reading.findOne().sort({ timestamp: -1 });
  res.json(latest);
});

app.get("/api/history", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const history = await Reading.find().sort({ timestamp: -1 }).limit(limit);
  res.json(history.reverse());
});

app.get("/api/watering-events", async (req, res) => {
  const events = await WateringEvent.find().sort({ timestamp: -1 }).limit(50);
  res.json(events);
});

app.get("/api/settings", async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

app.post("/api/settings", async (req, res) => {
  const { mode, threshold, duration } = req.body;
  let settings = await getOrCreateSettings();

  if (mode !== undefined) settings.mode = mode;
  if (threshold !== undefined) settings.threshold = threshold;
  if (duration !== undefined) settings.duration = duration;
  await settings.save();

  // push the update to esp32 via mqtt
  mqttClient.publish(TOPIC_COMMAND, JSON.stringify({
    mode: settings.mode,
    threshold: settings.threshold,
    duration: settings.duration
  }));

  res.json(settings);
});

app.post("/api/water-now", (req, res) => {
  mqttClient.publish(TOPIC_COMMAND, JSON.stringify({ water: true }));
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("PlantCare backend is running.");
});

// startttttttttttt
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
