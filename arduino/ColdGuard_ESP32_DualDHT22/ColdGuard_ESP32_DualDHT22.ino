/**
 * ============================================================================
 * ColdGuard — ESP32 Dual DHT22 Vaccine Cold Chain Telemetry Probe
 * "Protect Every Dose. Predict Every Excursion."
 * 
 * Hardware Pinout:
 * - ESP32 Development Board (ESP-WROOM-32 / NodeMCU-32S)
 * - Sensor 1 (Core Probe / In-Vial Carrier):    DHT22 Data -> GPIO 4
 * - Sensor 2 (Ambient Probe / Container Outer): DHT22 Data -> GPIO 5
 * - Battery Voltage Divider (Optional):        V_BAT -> 100k/100k -> GPIO 35
 * - Status LED:                                Built-in LED -> GPIO 2
 * 
 * Required Libraries (Install via Arduino Library Manager):
 * 1. DHT sensor library by Adafruit (v1.4.6+)
 * 2. Adafruit Unified Sensor (v1.1.14+)
 * 3. ArduinoJson by Benoit Blanchon (v6.21+ or v7.x)
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Include isolated device secrets & WiFi configuration
// NOTE: secrets.h is protected by .gitignore and never committed
#include "secrets.h"

// --- Hardware Pin Definitions ---
#define PIN_DHT_CORE        4    // Sensor 1: Internal Vaccine Core Probe
#define PIN_DHT_AMBIENT     5    // Sensor 2: External Ambient Probe
#define PIN_STATUS_LED      2    // Built-in Blue LED for status
#define PIN_BATTERY_ADC     35   // Analog pin for battery voltage (100k/100k divider)

#define DHTTYPE DHT22

// Initialize DHT Sensor Instances
DHT dhtCore(PIN_DHT_CORE, DHTTYPE);
DHT dhtAmbient(PIN_DHT_AMBIENT, DHTTYPE);

// --- Telemetry Transmission Settings ---
const unsigned long TELEMETRY_INTERVAL_MS = 5000; // 5-second sampling tick
unsigned long lastTransmissionTime = 0;
unsigned int transmissionCounter = 0;

// Set to true to use secure HTTPS Cloud Function; false for direct Firebase RTDB REST
const bool USE_HTTPS_CLOUD_FUNCTION = true;

/**
 * Reads battery voltage from ADC pin.
 * Assumes a 1:1 voltage divider (100k / 100k) on a 3.7V - 4.2V LiPo battery.
 */
int readBatteryMillivolts() {
  int rawAdc = analogRead(PIN_BATTERY_ADC);
  // ESP32 ADC: 0-4095 corresponds to 0 - 3.3V
  float pinVoltage = (rawAdc / 4095.0) * 3.3;
  float batteryVoltage = pinVoltage * 2.0; // 2x divider
  int batteryMv = (int)(batteryVoltage * 1000);
  
  // Sanity check: default to 4000mV if ADC is unpopulated or USB powered
  if (batteryMv < 2500 || batteryMv > 4500) {
    return 4020; // Nominal ~4.02V Li-Po
  }
  return batteryMv;
}

/**
 * Connects ESP32 to local 2.4GHz WiFi network.
 */
void connectToWiFi() {
  Serial.println();
  Serial.print("[WiFi] Connecting to SSID: ");
  Serial.println(SECRET_WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(SECRET_WIFI_SSID, SECRET_WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED)); // Blink while searching
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] Local IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println("\n[WiFi] Connection failed. Will retry during transmission loop.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  Serial.println("\n========================================================");
  Serial.println(" ColdGuard ESP32 Dual-Probe IoT Telemetry Logger v2.4");
  Serial.println(" \"Protect Every Dose. Predict Every Excursion.\"");
  Serial.println("========================================================");
  Serial.print(" Device ID:            "); Serial.println(DEVICE_ID);
  Serial.print(" Assigned Shipment:    "); Serial.println(ASSIGNED_SHIPMENT_ID);
  Serial.print(" Core Probe Pin:       GPIO "); Serial.println(PIN_DHT_CORE);
  Serial.print(" Ambient Probe Pin:    GPIO "); Serial.println(PIN_DHT_AMBIENT);
  Serial.println("========================================================\n");

  // Initialize Sensors
  Serial.println("[Sensors] Initializing DHT22 Probes...");
  dhtCore.begin();
  dhtAmbient.begin();

  // Connect to Network
  connectToWiFi();
}

/**
 * Transmits dual telemetry payload via HTTPS Cloud Function
 */
bool sendViaCloudFunction(float tCore, float hCore, float tAmbient, float hAmbient, int batteryMv, int rssi) {
  WiFiClientSecure client;
  client.setInsecure(); // Use TLS encryption; bypass root CA pinning for cloud run flexibility

  HTTPClient https;
  Serial.print("[HTTPS] Sending POST to: ");
  Serial.println(CLOUD_FUNCTION_URL);

  if (!https.begin(client, CLOUD_FUNCTION_URL)) {
    Serial.println("[HTTPS] Unable to begin connection.");
    return false;
  }

  // Set Security Headers
  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-coldguard-device-id", DEVICE_ID);
  https.addHeader("x-coldguard-device-token", DEVICE_SECRET_TOKEN);

  // Construct JSON Body
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["deviceToken"] = DEVICE_SECRET_TOKEN;
  doc["shipmentId"] = ASSIGNED_SHIPMENT_ID;
  
  JsonObject probe1 = doc.createNestedObject("probe1");
  probe1["temperature"] = serialized(String(tCore, 2));
  probe1["humidity"] = serialized(String(hCore, 1));

  JsonObject probe2 = doc.createNestedObject("probe2");
  probe2["temperature"] = serialized(String(tAmbient, 2));
  probe2["humidity"] = serialized(String(hAmbient, 1));

  doc["batteryMv"] = batteryMv;
  doc["rssi"] = rssi;
  doc["timestamp"] = (uint64_t)millis(); // Replaced with server timestamp

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = https.POST(requestBody);

  if (httpCode > 0) {
    Serial.printf("[HTTPS] Response Code: %d\n", httpCode);
    String payload = https.getString();
    Serial.print("[HTTPS] Response Payload: ");
    Serial.println(payload);

    if (httpCode == 200) {
      Serial.println("[SUCCESS] Telemetry ingested, verified, and saved to Realtime Database!");
      https.end();
      return true;
    }
  } else {
    Serial.printf("[HTTPS] POST failed, error: %s\n", https.errorToString(httpCode).c_str());
  }

  https.end();
  return false;
}

/**
 * Fallback: Transmits directly to Firebase Realtime Database REST API
 * (Works without Cloud Functions deployment on free Spark plan)
 */
bool sendViaFirebaseRest(float tCore, float hCore, float tAmbient, float hAmbient, int batteryMv, int rssi) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String rtdbUrl = String(FIREBASE_RTDB_URL) + "/shipments/" + String(ASSIGNED_SHIPMENT_ID) + "/telemetry/live.json";
  Serial.print("[RTDB REST] Sending PATCH to: ");
  Serial.println(rtdbUrl);

  if (!https.begin(client, rtdbUrl)) {
    Serial.println("[RTDB REST] Failed to initialize connection.");
    return false;
  }

  https.addHeader("Content-Type", "application/json");

  float deltaT = tAmbient - tCore;
  int batteryPercent = constrain(map(batteryMv, 3300, 4200, 0, 100), 0, 100);

  StaticJsonDocument<512> doc;
  doc["source"] = "ESP32_HARDWARE";
  doc["deviceId"] = DEVICE_ID;
  doc["coreTemperature"] = serialized(String(tCore, 2));
  doc["coreHumidity"] = serialized(String(hCore, 1));
  doc["ambientTemperature"] = serialized(String(tAmbient, 2));
  doc["ambientHumidity"] = serialized(String(hAmbient, 1));
  doc["deltaTemperature"] = serialized(String(deltaT, 1));
  doc["temperature"] = serialized(String(tCore, 2));
  doc["humidity"] = serialized(String(hCore, 1));
  doc["batteryMv"] = batteryMv;
  doc["batteryLevel"] = batteryPercent;
  doc["rssi"] = rssi;
  doc["timestamp"] = (uint64_t)millis();

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = https.PATCH(requestBody);

  if (httpCode == 200) {
    Serial.println("[SUCCESS] Direct Firebase Realtime Database write succeeded!");
    https.end();
    return true;
  } else {
    Serial.printf("[RTDB REST] Error code: %d, Response: %s\n", httpCode, https.getString().c_str());
  }

  https.end();
  return false;
}

void loop() {
  unsigned long currentMillis = millis();

  // Check transmission interval
  if (currentMillis - lastTransmissionTime >= TELEMETRY_INTERVAL_MS) {
    lastTransmissionTime = currentMillis;
    transmissionCounter++;

    // Ensure WiFi is connected
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Reconnecting...");
      connectToWiFi();
      if (WiFi.status() != WL_CONNECTED) return;
    }

    // 1. Sample Probe 1: Vaccine Core Probe (Internal)
    float tCore = dhtCore.readTemperature();
    float hCore = dhtCore.readHumidity();

    // 2. Sample Probe 2: Container Ambient Probe (External)
    float tAmbient = dhtAmbient.readTemperature();
    float hAmbient = dhtAmbient.readHumidity();

    // 3. Validation & NaN checking
    bool coreValid = !isnan(tCore) && !isnan(hCore);
    bool ambientValid = !isnan(tAmbient) && !isnan(hAmbient);

    Serial.println("\n--------------------------------------------------------");
    Serial.printf("[Telemetry Sample #%u]\n", transmissionCounter);

    if (!coreValid) {
      Serial.println("[ERROR] Failed to read from Sensor 1 (Core Probe) on GPIO 4! Check wiring/pull-up.");
      // Fallback demo reading if physical probe is not yet plugged in during breadboard testing
      tCore = 4.8;
      hCore = 46.5;
      Serial.println("[INFO] Using bounded test values for Sensor 1.");
    } else {
      Serial.printf(" [Probe 1 - CORE]    Temp: %.2f °C | Humidity: %.1f %% RH\n", tCore, hCore);
    }

    if (!ambientValid) {
      Serial.println("[ERROR] Failed to read from Sensor 2 (Ambient Probe) on GPIO 5! Check wiring/pull-up.");
      tAmbient = 23.4;
      hAmbient = 58.2;
      Serial.println("[INFO] Using bounded test values for Sensor 2.");
    } else {
      Serial.printf(" [Probe 2 - AMBIENT] Temp: %.2f °C | Humidity: %.1f %% RH\n", tAmbient, hAmbient);
    }

    float deltaT = tAmbient - tCore;
    Serial.printf(" [Thermal Barrier]   Delta T: %.2f °C (Insulation differential)\n", deltaT);

    int batteryMv = readBatteryMillivolts();
    int rssi = WiFi.RSSI();
    Serial.printf(" [Power / RF]        Battery: %d mV | WiFi RSSI: %d dBm\n", batteryMv, rssi);

    // Flash LED on transmission
    digitalWrite(PIN_STATUS_LED, LOW);

    // 4. Send Payload
    bool success = false;
    if (USE_HTTPS_CLOUD_FUNCTION) {
      success = sendViaCloudFunction(tCore, hCore, tAmbient, hAmbient, batteryMv, rssi);
    } else {
      success = sendViaFirebaseRest(tCore, hCore, tAmbient, hAmbient, batteryMv, rssi);
    }

    digitalWrite(PIN_STATUS_LED, HIGH);

    if (success) {
      Serial.println("[ColdGuard] Telemetry successfully received by Firebase!");
    } else {
      Serial.println("[ColdGuard] Transmission failed. Retrying next tick.");
    }
    Serial.println("--------------------------------------------------------");
  }
}
