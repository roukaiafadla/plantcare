# PlantCare — Smart Plant Watering System

ESP32-based soil moisture + climate monitoring with auto/manual watering control, live dashboard, and history logging.

## Structure

```
firmware/   -> plant_care.ino (upload to ESP32)
backend/    -> Express + MongoDB + MQTT subscriber + WebSocket (deploy to Render)
frontend/   -> index.html dashboard (deploy to Vercel, or open locally)
```

## 1. Firmware setup

1. Open `firmware/plant_care.ino` in Arduino IDE
2. Set your WiFi `ssid` / `password`
3. Wiring:
   - Soil moisture sensor AOUT -> GPIO34
   - DHT11 data -> GPIO4
   - MOSFET pump module signal -> GPIO26
4. **Calibrate** `dryValue`/`wetValue` in `readSoilPercent()` using your own sensor in air vs water (see Stage 1 notes)
5. Upload. Open Serial Monitor (115200) to confirm WiFi + MQTT connect.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGODB_URI from MongoDB Atlas
npm start
```

Test locally at `http://localhost:3000`.

### Deploy to Render
1. Push this repo to GitHub
2. On Render: New -> Web Service -> connect the repo, root directory `backend`
3. Build command: `npm install` — Start command: `npm start`
4. Add environment variables (`MONGODB_URI`, `MQTT_BROKER`, `PORT`) in Render's dashboard
5. Deploy — copy the resulting `https://xxxx.onrender.com` URL

## 3. Frontend setup

Edit `frontend/index.html`, set:
```js
const API_BASE = "https://YOUR-RENDER-BACKEND-URL.onrender.com";
```

### Deploy to Vercel
1. Push to GitHub (same repo or separate)
2. Vercel -> New Project -> import -> root directory `frontend`
3. Deploy — open the resulting URL on your phone

## 4. MongoDB Atlas

1. Create a free M0 cluster
2. Create a database user + allow access from anywhere (0.0.0.0/0) for simplicity
3. Copy the connection string into `.env` / Render env vars

## 5. MQTT broker

Default: public `broker.hivemq.com` (no setup, fine for a demo — note it's public, anyone could technically see your topic if they guess it). For anything beyond a demo, set up a free private broker instead.

## Before recording the demo

Render free tier sleeps after 15 min idle — open the dashboard once or ping the backend a minute or two before recording so there's no cold-start delay on camera.
