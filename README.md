# 🌱 PlantCare — Automated Irrigation & IoT Telemetry System

> An end-to-end IoT platform for real-time soil and microclimate monitoring, intelligent automated watering, and live web telemetry visualization powered by ESP32, Node.js, and MongoDB.

---

## ⚡ Overview

**PlantCare** bridges embedded hardware and web technologies to deliver precise, automated plant hydration management. It continuously samples microclimate telemetry, handles automated irrigation thresholds locally on the microcontroller, and broadcasts live data streams over MQTT to a centralized web dashboard.

---

## ✨ Key Features

* **🌡️ Real-Time Telemetry:** Continuous sampling of soil moisture levels, ambient temperature, and relative humidity.
* **💧 Automated & Manual Irrigation:** Smart threshold-driven watering logic with manual instant-trigger capabilities via the dashboard.
* **📊 Live Dashboard:** Real-time data visualization over WebSockets with historical telemetry logging in MongoDB Atlas.
* **📡 Distributed Architecture:** Low-latency pub/sub MQTT messaging connecting hardware nodes directly to backend microservices.

---

## 🛠️ Tech Stack

* **Hardware / Embedded:** ESP32 Dev Module, DHT11 Sensor, Analog Soil Moisture Sensor, MOSFET Power Control Module.
* **Backend Engine:** Node.js, Express.js, Mongoose ODM, MQTT (`PubSubClient` / HiveMQ), WebSocket (`ws`).
* **Frontend Web Client:** Responsive HTML5 / CSS3 Dashboard, JavaScript (ES6+).
* **Database Platform:** MongoDB Atlas.

---

## 📁 System Architecture

```text
plantcare/
├── 📂 firmware/     # ESP32 C++ Sketch (Sensor sampling & MQTT pub/sub)
├── 📂 backend/      # Node.js API, MQTT Subscriber & WebSocket Service
└── 📂 frontend/     # Responsive Web Client & Live Visualization Dashboard
