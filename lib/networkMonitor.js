const admin = require("firebase-admin");

function getDatabase() {
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
      if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    } catch (_) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid service-account JSON.");
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  }
  return admin.database();
}

async function requireUser(req, { adminOnly = false } = {}) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error("Sign-in required.");
    err.status = 401;
    throw err;
  }
  const db = getDatabase();
  const decoded = await admin.auth().verifyIdToken(match[1]);
  const profile = (await db.ref("users/" + decoded.uid).once("value")).val() || {};
  const isAdmin = profile.role === "admin" || profile.role === "system_admin";
  if (adminOnly && !isAdmin) {
    const err = new Error("Administrator access is required.");
    err.status = 403;
    throw err;
  }
  return { uid: decoded.uid, email: decoded.email || profile.email || "", isAdmin, db };
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(n)) return null;
  return n < 1e12 ? n * 1000 : n;
}

function getLastUpdate(shipment) {
  return parseTimestamp(shipment?.telemetry?.live?.timestamp) ||
    parseTimestamp(shipment?.lastSensorUpdate) ||
    parseTimestamp(shipment?.location?.lastUpdated) ||
    parseTimestamp(shipment?.gpsLastUpdated);
}

function getTemperature(shipment) {
  const value = shipment?.telemetry?.live?.temperature ?? shipment?.currentTemperature ?? shipment?.temperature;
  return value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}

function getCoordinates(shipment) {
  const location = shipment?.location || {};
  const live = shipment?.telemetry?.live || {};
  const lat = Number(location.latitude ?? live.latitude ?? shipment?.gpsLatitude);
  const lon = Number(location.longitude ?? live.longitude ?? shipment?.gpsLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (location.hasFix === false) return null;
  return { latitude: lat, longitude: lon };
}

function getThresholds() {
  const warning = Math.max(1, Number(process.env.OFFLINE_WARNING_MINUTES || 2));
  const notify = Math.max(warning, Number(process.env.OFFLINE_NOTIFY_MINUTES || 5));
  const escalate = Math.max(notify, Number(process.env.OFFLINE_ESCALATE_MINUTES || 10));
  return { warningMinutes: warning, notifyMinutes: notify, escalateMinutes: escalate };
}

function validPhone(value) {
  return typeof value === "string" && /^\+[1-9]\d{7,14}$/.test(value.trim());
}

async function sendSms(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const serviceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || (!from && !serviceSid)) {
    return { status: "not_configured", error: "Twilio credentials or sender are not configured." };
  }
  if (!validPhone(to)) return { status: "skipped", error: "Recipient phone is missing or not in E.164 format." };
  const params = new URLSearchParams({ To: to, Body: body });
  if (serviceSid) params.set("MessagingServiceSid", serviceSid);
  else params.set("From", from);
  try {
    const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + encodeURIComponent(sid) + "/Messages.json", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { status: "failed", providerStatus: response.status, error: data.message || "SMS provider rejected the request." };
    return { status: "sent", providerMessageId: data.sid || null, providerStatus: data.status || "accepted" };
  } catch (error) {
    return { status: "failed", error: error.message || "SMS network request failed." };
  }
}

function formatLocation(coords) {
  if (!coords) return "Unavailable (no valid GPS fix)";
  return coords.latitude.toFixed(5) + ", " + coords.longitude.toFixed(5);
}

function mapLink(coords) {
  return coords ? "https://maps.google.com/?q=" + coords.latitude + "," + coords.longitude : "Unavailable";
}

function outageMessage({ shipmentId, shipment, lastUpdate, outageMinutes, coords, temperature, recovery = false }) {
  const driver = shipment?.driverName || shipment?.assignedDriver || shipment?.operatorName || "Assigned driver";
  const tempMin = Number(shipment?.minAllowedTemperature ?? shipment?.storageMinTemp ?? shipment?.minTemp);
  const tempMax = Number(shipment?.maxAllowedTemperature ?? shipment?.storageMaxTemp ?? shipment?.maxTemp);
  const hasRange = Number.isFinite(tempMin) && Number.isFinite(tempMax);
  const tempText = temperature === null ? "Last temperature: unavailable" :
    "Last temperature: " + temperature + "°C; " + (hasRange ? (temperature >= tempMin && temperature <= tempMax ? "within configured range" : "outside configured range") : "storage range not configured; status cannot be verified");
  const when = lastUpdate ? new Date(lastUpdate).toISOString() : "timestamp unavailable";
  return recovery
    ? "ColdGuard recovery: " + shipmentId + " telemetry has resumed after about " + Math.round(outageMinutes) + " minutes. Last outage location: " + formatLocation(coords) + ". Temperature status during outage could not be continuously verified. Verify vehicle and buffered readings."
    : "ColdGuard Alert: Vehicle " + shipmentId + " (" + driver + ") has not transmitted sensor data for " + Math.round(outageMinutes) + " minutes. Last update: " + when + ". Last location: " + formatLocation(coords) + ". " + tempText + ". Contact the driver and verify vehicle connectivity; dispatch assistance if required. Location: " + mapLink(coords);
}

function maskPhone(value) {
  if (typeof value !== "string" || value.length < 6) return value ? "Configured" : "Not configured";
  return value.slice(0, 3) + "••••" + value.slice(-3);
}

module.exports = { getDatabase, requireUser, parseTimestamp, getLastUpdate, getTemperature, getCoordinates, getThresholds, validPhone, sendSms, outageMessage, maskPhone, formatLocation, mapLink };
