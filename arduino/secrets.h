// ============================================================================
// ColdGuard ESP32 Hardware Secrets
// DEVICE ID: ESP32-CG-PROBE-01
// ASSIGNED SHIPMENT: CG-9021-PFZ
// DO NOT COMMIT THIS FILE TO VERSION CONTROL
// ============================================================================

#ifndef COLDGUARD_SECRETS_H
#define COLDGUARD_SECRETS_H

// --- 1. WiFi Network Credentials ---
#define SECRET_WIFI_SSID      "YOUR_WIFI_SSID"          // Replace with your 2.4GHz WiFi SSID
#define SECRET_WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"      // Replace with your WiFi Password

// --- 2. ColdGuard Device Authentication ---
#define DEVICE_ID             "ESP32-CG-PROBE-01"
#define DEVICE_SECRET_TOKEN   "cg_dev_9819774651d552e265afcfa2bd8a5fbf03ab53917c7e244d9762781c1d047814"
#define ASSIGNED_SHIPMENT_ID  "CG-9021-PFZ"

// --- 3. Endpoints ---
// Primary: ColdGuard Cloud Function Ingestion Endpoint
// (Format: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/ingestDualSensorTelemetry)
#define CLOUD_FUNCTION_URL    "https://asia-southeast1-coldguard-fdfc5.cloudfunctions.net/ingestDualSensorTelemetry"

// Secondary Fallback: Direct Firebase Realtime Database REST API
// (Works even on free Spark plan without deploying Cloud Functions)
#define FIREBASE_RTDB_URL     "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app"

#endif // COLDGUARD_SECRETS_H
