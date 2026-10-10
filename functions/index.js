const crypto = require("crypto");
const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret, defineString } = require("firebase-functions/params");
const { monitorOffline } = require("./lib/monitor");

const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app";

if (!admin.apps.length) {
  admin.initializeApp({ databaseURL: DATABASE_URL });
}

const twilioSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioFrom = defineString("TWILIO_FROM", { default: "" });
const twilioMessagingServiceSid = defineString("TWILIO_MESSAGING_SERVICE_SID", { default: "" });

function sendJson(res, status, body) {
  return res.status(status).json(body);
}

function safeTokenMatches(token, expectedHash) {
  if (typeof token !== "string" || !token || typeof expectedHash !== "string") return false;
  const provided = Buffer.from(crypto.createHash("sha256").update(token).digest("hex"), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return expected.length === provided.length &&
    expected.length > 0 &&
    crypto.timingSafeEqual(expected, provided);
}

async function authenticateDevice(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const deviceId = req.get("x-coldguard-device-id") || body.deviceId;
  const deviceToken = req.get("x-coldguard-device-token") || body.deviceToken;

  if (typeof deviceId !== "string" || !deviceId ||
      typeof deviceToken !== "string" || !deviceToken) {
    sendJson(res, 401, { error: "Missing device ID or device token." });
    return null;
  }

  // Restrict path characters before using the ID in a database path.
  if (/[.#$\[\]\/]/.test(deviceId)) {
    sendJson(res, 400, { error: "Invalid device ID." });
    return null;
  }

  const snapshot = await admin.database().ref(`devices/${deviceId}`).once("value");
  const device = snapshot.val();
  if (!device || !device.deviceSecretHash ||
      !safeTokenMatches(deviceToken, device.deviceSecretHash)) {
    sendJson(res, 403, { error: "Invalid or unprovisioned device credentials." });
    return null;
  }

  return { deviceId, device, body };
}

function validShipmentId(value) {
  return typeof value === "string" && value.length > 0 &&
    value.length <= 128 && !/[.#$\[\]\/]/.test(value);
}

exports.ingestDualSensorTelemetry = onRequest({
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
}, async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Use POST." });

  try {
    const auth = await authenticateDevice(req, res);
    if (!auth) return;
    const { deviceId, device, body } = auth;
    const shipmentId = body.shipmentId || device.assignedShipmentId;

    if (!validShipmentId(shipmentId) || shipmentId !== device.assignedShipmentId) {
      return sendJson(res, 403, { error: "Device is not assigned to this shipment." });
    }

    const p1 = body.probe1 || {};
    const p2 = body.probe2 || {};
    const coreTemperature = Number(p1.temperature);
    const coreHumidity = Number(p1.humidity);
    const ambientTemperature = Number(p2.temperature);
    const ambientHumidity = Number(p2.humidity);
    const batteryMv = Number(body.batteryMv);
    const rssi = Number(body.rssi);

    if (![coreTemperature, coreHumidity, ambientTemperature, ambientHumidity, batteryMv, rssi].every(Number.isFinite) ||
        coreTemperature < -40 || coreTemperature > 80 ||
        ambientTemperature < -40 || ambientTemperature > 80 ||
        coreHumidity < 0 || coreHumidity > 100 ||
        ambientHumidity < 0 || ambientHumidity > 100 ||
        batteryMv < 0 || batteryMv > 10000 || rssi < -150 || rssi > 0) {
      return sendJson(res, 422, { error: "Invalid sensor or device telemetry values." });
    }

    const now = Date.now();
    const live = {
      source: "ESP32_HARDWARE",
      deviceId,
      coreTemperature,
      coreHumidity,
      ambientTemperature,
      ambientHumidity,
      deltaTemperature: ambientTemperature - coreTemperature,
      temperature: coreTemperature,
      humidity: coreHumidity,
      batteryMv,
      batteryLevel: Math.max(0, Math.min(100, Math.round((batteryMv - 3300) / 9))),
      rssi,
      timestamp: now,
      lastUpdated: now,
      sensorStatus: "OK"
    };

    await admin.database().ref(`shipments/${shipmentId}/telemetry/live`).set(live);
    await admin.database().ref(`shipments/${shipmentId}`).update({
      lastSensorUpdate: new Date(now).toISOString(),
      deviceId
    });

    return sendJson(res, 200, { success: true, shipmentId, timestamp: now });
  } catch (err) {
    console.error("Telemetry ingestion failed:", err);
    return sendJson(res, 500, { error: "Telemetry ingestion failed." });
  }
});

exports.ingestGpsTelemetry = onRequest({
  region: "asia-southeast1",
  timeoutSeconds: 30,
  memory: "256MiB"
}, async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Use POST." });

  try {
    const auth = await authenticateDevice(req, res);
    if (!auth) return;
    const { deviceId, device, body } = auth;
    const shipmentId = body.shipmentId || device.assignedShipmentId;

    if (!validShipmentId(shipmentId) || shipmentId !== device.assignedShipmentId) {
      return sendJson(res, 403, { error: "Device is not assigned to this shipment." });
    }

    const now = Date.now();
    const hasFix = body.hasFix === true || body.hasFix === "true";
    const locationRef = admin.database().ref(`shipments/${shipmentId}/location`);

    if (!hasFix) {
      await locationRef.update({
        isLiveGps: true, hasFix: false, status: "NO_FIX",
        message: "GPS signal unavailable (searching for satellites)", lastUpdated: now
      });
      return sendJson(res, 200, { success: true, shipmentId, hasFix: false });
    }

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const speedKmH = body.speedKmH == null ? 0 : Number(body.speedKmH);
    const satellites = body.satellites == null ? 0 : Number(body.satellites);
    const altitudeM = body.altitudeM == null ? 0 : Number(body.altitudeM);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
        !Number.isFinite(speedKmH) || speedKmH < 0 ||
        !Number.isFinite(satellites) || satellites < 0 ||
        !Number.isFinite(altitudeM)) {
      return sendJson(res, 422, { error: "Invalid GPS coordinates or telemetry values." });
    }

    const location = {
      latitude, longitude,
      speedKmH: Math.round(speedKmH * 10) / 10,
      satellites: Math.round(satellites),
      altitudeM: Math.round(altitudeM * 10) / 10,
      isLiveGps: true, hasFix: true, status: "LOCKED",
      gpsTimestamp: Number(body.gpsTimestamp) || now,
      lastUpdated: now
    };
    const updates = {};
    updates[`shipments/${shipmentId}/location`] = location;
    updates[`shipments/${shipmentId}/gpsLatitude`] = latitude;
    updates[`shipments/${shipmentId}/gpsLongitude`] = longitude;
    updates[`shipments/${shipmentId}/lastSensorUpdate`] = new Date(now).toISOString();
    updates[`shipments/${shipmentId}/currentLocation`] =
      `Live GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Speed: ${location.speedKmH.toFixed(1)} km/h)`;
    updates[`shipments/${shipmentId}/telemetry/live/latitude`] = latitude;
    updates[`shipments/${shipmentId}/telemetry/live/longitude`] = longitude;
    updates[`shipments/${shipmentId}/telemetry/live/gpsTimestamp`] = now;

    const historyRef = admin.database().ref(`gps_history/${shipmentId}`).push();
    updates[`gps_history/${shipmentId}/${historyRef.key}`] = {
      latitude, longitude, speedKmH: location.speedKmH,
      satellites: location.satellites, timestamp: now, deviceId
    };

    await admin.database().ref().update(updates);
    return sendJson(res, 200, { success: true, shipmentId, ...location });
  } catch (err) {
    console.error("GPS ingestion failed:", err);
    return sendJson(res, 500, { error: "GPS ingestion failed." });
  }
});

// Sender can be configured as non-secret environment values in the Functions runtime.
exports.monitorColdGuardOffline = onSchedule({
  schedule: "every 1 minutes",
  timeZone: "Asia/Kolkata",
  region: "asia-south1",
  secrets: [twilioSid, twilioToken],
  timeoutSeconds: 120,
  memory: "256MiB"
}, async () => {
  const result = await monitorOffline(admin.database(), {
    sid: twilioSid.value(),
    token: twilioToken.value(),
    from: twilioFrom.value(),
    serviceSid: twilioMessagingServiceSid.value()
  });
  console.log("ColdGuard offline monitor completed", JSON.stringify(result));
});
