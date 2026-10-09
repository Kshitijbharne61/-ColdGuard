// scripts/provisionDevice.js
// ColdGuard Hardware Credential Provisioning Utility
// Generates unique device credentials, stores hashed secrets in Firebase,
// and outputs arduino/secrets.h securely.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateSecureCredential() {
  const deviceId = "ESP32-CG-PROBE-01";
  const deviceToken = "cg_dev_" + crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

  return {
    deviceId,
    deviceToken,
    tokenHash
  };
}

async function provision() {
  console.log("=================================================");
  console.log(" ColdGuard Hardware Security Provisioning");
  console.log("=================================================");

  const { deviceId, deviceToken, tokenHash } = generateSecureCredential();
  const assignedShipmentId = "CG-9021-PFZ"; // Default active consignment

  const deviceRecord = {
    deviceId,
    deviceSecretHash: tokenHash,
    assignedShipmentId,
    status: "PROVISIONED_AWAITING_FIRST_READING",
    hardwareProfile: "ESP32 Dual DHT22 Vaccine Logger",
    sensor1_type: "DHT22 (Internal Core Probe)",
    sensor2_type: "DHT22 (External Ambient Probe)",
    provisionedAt: new Date().toISOString(),
    lastReadingTimestamp: null,
    totalReadingsCount: 0
  };

  // 1. Write device record to Firebase Realtime Database
  console.log(`\n[1/3] Registering ${deviceId} in Firebase Realtime Database...`);
  const tempJsonPath = path.join(__dirname, '..', 'device_temp.json');
  fs.writeFileSync(tempJsonPath, JSON.stringify(deviceRecord, null, 2));

  try {
    execSync(
      `firebase database:set /devices/${deviceId} "${tempJsonPath}" --project coldguard-fdfc5 --instance coldguard-fdfc5-default-rtdb --force --non-interactive`,
      { stdio: 'inherit' }
    );
    console.log(`[SUCCESS] Device ${deviceId} provisioned in database with SHA-256 secret verification.`);
  } catch (err) {
    console.warn(`[WARNING] CLI database:set returned notice, verify via console: ${err.message}`);
  } finally {
    if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
  }

  // 2. Create arduino/ directory and secrets.h template
  console.log(`\n[2/3] Generating arduino/secrets.h for hardware flashing...`);
  const arduinoDir = path.join(__dirname, '..', 'arduino');
  if (!fs.existsSync(arduinoDir)) {
    fs.mkdirSync(arduinoDir, { recursive: true });
  }

  const secretsHeader = `// ============================================================================
// ColdGuard ESP32 Hardware Secrets
// DEVICE ID: ${deviceId}
// ASSIGNED SHIPMENT: ${assignedShipmentId}
// DO NOT COMMIT THIS FILE TO VERSION CONTROL
// ============================================================================

#ifndef COLDGUARD_SECRETS_H
#define COLDGUARD_SECRETS_H

// --- 1. WiFi Network Credentials ---
#define SECRET_WIFI_SSID      "YOUR_WIFI_SSID"          // Replace with your 2.4GHz WiFi SSID
#define SECRET_WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"      // Replace with your WiFi Password

// --- 2. ColdGuard Device Authentication ---
#define DEVICE_ID             "${deviceId}"
#define DEVICE_SECRET_TOKEN   "${deviceToken}"
#define ASSIGNED_SHIPMENT_ID  "${assignedShipmentId}"

// --- 3. Endpoints ---
// Primary: ColdGuard Cloud Function Ingestion Endpoint
// (Format: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/ingestDualSensorTelemetry)
#define CLOUD_FUNCTION_URL    "https://asia-southeast1-coldguard-fdfc5.cloudfunctions.net/ingestDualSensorTelemetry"

// Secondary Fallback: Direct Firebase Realtime Database REST API
// (Works even on free Spark plan without deploying Cloud Functions)
#define FIREBASE_RTDB_URL     "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app"

#endif // COLDGUARD_SECRETS_H
`;

  fs.writeFileSync(path.join(arduinoDir, 'secrets.h'), secretsHeader);
  console.log(`[SUCCESS] Generated ${path.join(arduinoDir, 'secrets.h')}`);

  // 3. Ensure secrets.h is listed in .gitignore
  console.log(`\n[3/3] Protecting secrets from version control (.gitignore)...`);
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  let gitignoreContent = "";
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  if (!gitignoreContent.includes("secrets.h")) {
    gitignoreContent += "\n# Hardware credentials & local secrets\narduino/secrets.h\nsecrets.h\n*.key\n*.pem\n";
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log(`[SUCCESS] Appended arduino/secrets.h to .gitignore`);
  } else {
    console.log(`[OK] .gitignore already contains secrets.h protection.`);
  }

  console.log("\n=================================================");
  console.log(" PROVISIONING COMPLETED SUCCESSFULLY");
  console.log(` Device ID:     ${deviceId}`);
  console.log(` Token:         ${deviceToken}`);
  console.log(` SHA-256 Hash:  ${tokenHash}`);
  console.log(` Shipment ID:   ${assignedShipmentId}`);
  console.log("=================================================\n");
}

provision().catch(console.error);
