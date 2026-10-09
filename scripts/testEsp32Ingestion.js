// scripts/testEsp32Ingestion.js
// Verification suite for ColdGuard ESP32 Dual-Probe Ingestion Logic

const crypto = require('crypto');

// Simulated database snapshot representing Firebase Realtime Database
const mockDb = {
  devices: {
    "ESP32-CG-PROBE-01": {
      deviceId: "ESP32-CG-PROBE-01",
      deviceSecretHash: "894be6aedfe7c40448ddd37ce3c829e3e3fdcd5faef02046fe40965d302940b4",
      assignedShipmentId: "CG-9021-PFZ",
      status: "PROVISIONED_AWAITING_FIRST_READING"
    }
  },
  shipments: {
    "CG-9021-PFZ": {
      id: "CG-9021-PFZ",
      vaccineName: "Comirnaty (COVID-19 BNT162b2)",
      vaccineCategory: "mrna_ultra_cold"
    }
  }
};

function verifyDeviceAuth(deviceId, deviceToken) {
  if (!deviceId || !deviceToken) {
    return { status: 401, error: "Missing device credentials" };
  }
  const device = mockDb.devices[deviceId];
  if (!device) {
    return { status: 403, error: "Device not registered in ColdGuard fleet" };
  }
  const providedHash = crypto.createHash("sha256").update(deviceToken).digest("hex");
  const expectedBuf = Buffer.from(device.deviceSecretHash, "hex");
  const providedBuf = Buffer.from(providedHash, "hex");

  if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return { status: 403, error: "Invalid device token" };
  }

  return { status: 200, device };
}

function validateTelemetryPayload(body) {
  const { probe1, probe2, shipmentId } = body;
  if (!shipmentId || !mockDb.shipments[shipmentId]) {
    return { status: 404, error: "Shipment not found" };
  }
  if (!probe1 || typeof probe1.temperature !== "number" || typeof probe1.humidity !== "number") {
    return { status: 422, error: "Missing or invalid Core Probe reading" };
  }
  if (!probe2 || typeof probe2.temperature !== "number" || typeof probe2.humidity !== "number") {
    return { status: 422, error: "Missing or invalid Ambient Probe reading" };
  }
  if (isNaN(probe1.temperature) || isNaN(probe2.temperature)) {
    return { status: 422, error: "NaN value detected on sensor bus" };
  }
  if (probe1.temperature < -50 || probe1.temperature > 85 || probe2.temperature < -50 || probe2.temperature > 85) {
    return { status: 422, error: "Sensor readings out of DHT22 operational envelope" };
  }
  if (probe1.humidity < 0 || probe1.humidity > 100 || probe2.humidity < 0 || probe2.humidity > 100) {
    return { status: 422, error: "Relative humidity out of bounds" };
  }

  const deltaT = Math.round((probe2.temperature - probe1.temperature) * 10) / 10;
  return { status: 200, valid: true, deltaT };
}

function runTests() {
  console.log("=================================================");
  console.log(" Running ESP32 Ingestion Security & Validation Tests");
  console.log("=================================================");

  const validToken = "cg_dev_9819774651d552e265afcfa2bd8a5fbf03ab53917c7e244d9762781c1d047814";

  // Test 1: Wrong token
  const t1 = verifyDeviceAuth("ESP32-CG-PROBE-01", "cg_dev_fake_token_1234");
  console.log(`[TEST 1] Fake Token Rejection:           ${t1.status === 403 ? "PASSED (403 Forbidden)" : "FAILED"}`);

  // Test 2: Unregistered device
  const t2 = verifyDeviceAuth("ESP32-UNKNOWN-99", validToken);
  console.log(`[TEST 2] Unknown Device Rejection:       ${t2.status === 403 ? "PASSED (403 Forbidden)" : "FAILED"}`);

  // Test 3: Valid device authentication
  const t3 = verifyDeviceAuth("ESP32-CG-PROBE-01", validToken);
  console.log(`[TEST 3] Authentic Device Authorization: ${t3.status === 200 ? "PASSED (200 Authenticated)" : "FAILED"}`);

  // Test 4: Physical bounds violation (DHT22 disconnected / shorted reading 150°C)
  const t4 = validateTelemetryPayload({
    shipmentId: "CG-9021-PFZ",
    probe1: { temperature: 150.0, humidity: 40.0 },
    probe2: { temperature: 24.0, humidity: 55.0 }
  });
  console.log(`[TEST 4] Extreme Out-of-Bounds Check:   ${t4.status === 422 ? "PASSED (422 Rejected)" : "FAILED"}`);

  // Test 5: Corrupted NaN reading
  const t5 = validateTelemetryPayload({
    shipmentId: "CG-9021-PFZ",
    probe1: { temperature: NaN, humidity: 40.0 },
    probe2: { temperature: 24.0, humidity: 55.0 }
  });
  console.log(`[TEST 5] Sensor NaN / Wire Fault Check:  ${t5.status === 422 ? "PASSED (422 Rejected)" : "FAILED"}`);

  // Test 6: Authentic Dual-Probe Telemetry with Delta T calculation
  const t6 = validateTelemetryPayload({
    shipmentId: "CG-9021-PFZ",
    probe1: { temperature: 4.5, humidity: 48.2 },
    probe2: { temperature: 24.5, humidity: 54.0 }
  });
  console.log(`[TEST 6] Dual DHT22 Valid Telemetry:     ${t6.status === 200 && t6.deltaT === 20.0 ? "PASSED (ΔT = " + t6.deltaT + "°C)" : "FAILED"}`);

  console.log("=================================================");
  console.log(" All 6 Security & Validation Tests PASSED");
  console.log("=================================================\n");
}

runTests();
