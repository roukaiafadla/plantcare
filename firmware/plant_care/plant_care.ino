#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>


const char* ssid = "Roukaia's phone";
const char* password = "20042004";

const char* mqttServer = "broker.hivemq.com"; 
const int mqttPort = 1883;
const char* topicData = "rekia/plantcare/data";     // ESP32 to backend
const char* topicCommand = "rekia/plantcare/command"; // backend to ESP32

// pins
const int soilPin = 34;   // ADC1 pin, safe with wifi  active
const int dhtPin = 4;
const int pumpPin = 26;   // to mosfet  module signal pin

#define DHTTYPE DHT11
DHT dht(dhtPin, DHTTYPE);

// state
WiFiClient espClient;
PubSubClient client(espClient);

bool autoMode = true;
int threshold = 30;          // % soil moisture, below this = needs water (auto mode)
int wateringDurationMs = 5000;

bool pumpOn = false;
unsigned long pumpStartTime = 0;

unsigned long lastReadTime = 0;
const unsigned long readInterval = 5000; // read + publish every 5s

// helpers
int readSoilPercent() {
  int raw = analogRead(soilPin); 
  
  int dryValue = 3000;
  int wetValue = 1200;
  int percent = map(raw, dryValue, wetValue, 0, 100);
  percent = constrain(percent, 0, 100);
  return percent;
}

void startPump() {
  pumpOn = true;
  pumpStartTime = millis();
  digitalWrite(pumpPin, HIGH);
  Serial.println("Pump ON");
}

void stopPump() {
  pumpOn = false;
  digitalWrite(pumpPin, LOW);
  Serial.println("Pump OFF");
}

// mqtt
void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, msg);
  if (err) return;

  if (doc["mode"].is<const char*>()) {
    String mode = doc["mode"].as<String>();
    autoMode = (mode == "auto");
    Serial.print("Mode set to: ");
    Serial.println(mode);
  }

  if (doc["threshold"].is<int>()) {
    threshold = doc["threshold"];
  }

  if (doc["duration"].is<int>()) {
    wateringDurationMs = doc["duration"];
  }

  if (doc["water"].is<bool>() && doc["water"] == true) {
    // manual water now command
    startPump();
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32PlantCare-Rekia")) {
      Serial.println("connected");
      client.subscribe(topicCommand);
    } else {
      delay(2000);
    }
  }
}

void publishReading(int soilPercent, float temp, float humidity) {
  JsonDocument doc;
  doc["soil"] = soilPercent;
  doc["temp"] = temp;
  doc["humidity"] = humidity;
  doc["pumpOn"] = pumpOn;
  doc["mode"] = autoMode ? "auto" : "manual";

  String output;
  serializeJson(doc, output);
  client.publish(topicData, output.c_str());
}


void setup() {
  Serial.begin(115200);
  pinMode(pumpPin, OUTPUT);
  digitalWrite(pumpPin, LOW);

  dht.begin();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  client.setServer(mqttServer, mqttPort);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  // stop pump after its duration
  if (pumpOn && millis() - pumpStartTime > (unsigned long)wateringDurationMs) {
    stopPump();
  }

  if (millis() - lastReadTime > readInterval) {
    lastReadTime = millis();

    int soilPercent = readSoilPercent();
    float temp = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temp) || isnan(humidity)) {
      Serial.println("DHT read failed, skipping this cycle");
    } else {
      publishReading(soilPercent, temp, humidity);

      // auto watering : only acts if in auto mode and pump isn't already running okay :)
      if (autoMode && !pumpOn && soilPercent < threshold) {
        startPump();
      }
    }
  }
}
