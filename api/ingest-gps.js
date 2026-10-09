// api/ingest-gps.js
// Secure Vercel serverless endpoint for ColdGuard GPS telemetry.
// Configure FIREBASE_SERVICE_ACCOUNT_JSON and (optionally) FIREBASE_DATABASE_URL
// in the Vercel project environment. Never commit a service-account key.

const crypto = require("crypto");
const admin = require("firebase-admin");

const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app";

function getDatabase() {
  if (!admin.apps.length) {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!rawServiceAccount) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
    }
    const serviceAccount = JSON.parse(rawServiceAccount);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: DATABASE_URL
    });
  }
  return admin.database();
}

function safeTokenMatches(token, expectedHash) {
  if (!token || !expectedHash || typeof expectedHash !== "string") return false;
  const providedHash = crypto.createHash("sha256").update(token).digest("hex");
  const expected = Buffer.from(expectedHash, "hex");
  const provided = Buffer.from(providedHash, "hex");
  return expected.length === provided.length &&
    expected.length > 0 &&
    crypto.timingSafeEqual(expected, provided);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-coldguard-device-id, x-coldguard-device-token"
  );

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const deviceId = req.headers["x-coldguard-device-id"] || body.deviceId;
  const deviceToken = req.headers["x-coldguard-device-token"] || body.deviceToken;
  if (!deviceId || !deviceToken) {
    return res.status(401).json({ error: "Missing device ID or device token." });
  }

  try {
    const db = getDatabase();
    const deviceSnapshot = await db.ref(`devices/${deviceId}`).once("value");
    const deviceData = deviceSnapshot.val();

    if (!deviceData || !deviceData.deviceSecretHash) {
      return res.status(403).json({ error: "Device is not provisioned in ColdGuard." });
    }
    if (!safeTokenMatches(deviceToken, deviceData.deviceSecretHash)) {
      return res.status(403).json({ error: "Invalid device authentication token." });
    }

    const shipmentId = body.shipmentId || deviceData.assignedShipmentId;
    if (!shipmentId || /[.#$\[\]\/]/.test(shipmentId)) {
      return res.status(422).json({ error: "A valid shipmentId is required." });
    }

    const now = Date.now();
    const hasFix = body.hasFix === true || body.hasFix === "true";
    const locationRef = db.ref(`shipments/${shipmentId}/location`);

    if (!hasFix) {
      await locationRef.update({
        isLiveGps: true,
        hasFix: false,
        status: "NO_FIX",
        message: "GPS signal unavailable (searching for satellites)",
        lastUpdated: now
      });
      return res.status(200).json({
        success: true,
        shipmentId,
        hasFix: false,
        message: "GPS searching for satellite fix."
      });
    }

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const speedKmH = body.speedKmH == null ? 0 : Number(body.speedKmH);
    const satellites = body.satellites == null ? 0 : Number(body.satellites);
    const altitudeM = body.altitudeM == null ? 0 : Number(body.altitudeM);

    if (
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !Number.isFinite(speedKmH) || speedKmH < 0 ||
      !Number.isFinite(satellites) || satellites < 0 ||
      !Number.isFinite(altitudeM)
    ) {
      return res.status(422).json({ error: "Invalid GPS coordinates or telemetry values." });
    }

    const location = {
      latitude,
      longitude,
      speedKmH: Math.round(speedKmH * 10) / 10,
      satellites: Math.round(satellites),
      altitudeM: Math.round(altitudeM * 10) / 10,
      isLiveGps: true,
      hasFix: true,
      status: "LOCKED",
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

    const historyRef = db.ref(`gps_history/${shipmentId}`).push();
    updates[`gps_history/${shipmentId}/${historyRef.key}`] = {
      latitude,
      longitude,
      speedKmH: location.speedKmH,
      satellites: location.satellites,
      timestamp: now
    };

    await db.ref().update(updates);

    return res.status(200).json({
      success: true,
      shipmentId,
      latitude,
      longitude,
      speedKmH: location.speedKmH,
      satellites: location.satellites,
      status: "LOCKED",
      timestamp: now
    });
  } catch (err) {
    console.error("Error processing GPS ingestion:", err);
    return res.status(500).json({
      error: "GPS ingestion failed.",
      message: err.message
    });
  }
};
