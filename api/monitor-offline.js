const {
  getDatabase, getLastUpdate, getTemperature, getCoordinates, getThresholds,
  sendSms, outageMessage
} = require("./_lib/networkMonitor");

function contactsFor(contactRecord, level, previousLevel = 0) {
  const c = contactRecord || {};
  const values = [];
  // Level 1: driver and control room. Level 2: only newly escalated recipients.
  if (level >= 1 && previousLevel < 1) {
    if (c.driverPhone) values.push({ role: "driver", phone: c.driverPhone });
    if (c.controlRoomPhone || c.agencyPhone) values.push({ role: "control_room", phone: c.controlRoomPhone || c.agencyPhone });
  }
  if (level >= 2 && previousLevel < 2) {
    if (c.emergencyPhone) values.push({ role: "emergency_contact", phone: c.emergencyPhone });
    if (c.agencyPhone && c.controlRoomPhone && c.agencyPhone !== c.controlRoomPhone) values.push({ role: "agency", phone: c.agencyPhone });
    // If monitoring first runs after escalation threshold, notify the baseline contacts too.
    if (previousLevel === 0) {
      if (c.driverPhone) values.push({ role: "driver", phone: c.driverPhone });
      if (c.controlRoomPhone || c.agencyPhone) values.push({ role: "control_room", phone: c.controlRoomPhone || c.agencyPhone });
    }
  }
  return values.filter((v, i, arr) => arr.findIndex(x => x.phone === v.phone) === i);
}

async function deliverLevel(db, shipmentId, shipment, contactRecord, level, previousLevel, lastUpdate, outageMinutes, coords, temperature) {
  const recipients = contactsFor(contactRecord, level, previousLevel);
  const body = outageMessage({ shipmentId, shipment, lastUpdate, outageMinutes, coords, temperature });
  const results = [];
  for (const recipient of recipients) {
    const result = await sendSms(recipient.phone, body);
    results.push({ role: recipient.role, status: result.status, providerMessageId: result.providerMessageId || null, error: result.error || null, providerStatus: result.providerStatus || null });
  }
  const eventRef = db.ref("network_monitoring/events").push();
  await eventRef.set({
    eventId: eventRef.key, shipmentId, type: level >= 2 ? "OFFLINE_ESCALATION" : "OFFLINE_NOTIFICATION",
    level, createdAt: Date.now(), outageMinutes: Math.round(outageMinutes),
    lastSensorUpdate: lastUpdate || null, lastKnownLocation: coords || null,
    lastTemperature: temperature, temperatureVerifiedDuringOutage: false,
    delivery: results, status: results.some(r => r.status === "sent") ? "sent_or_partially_sent" : "not_delivered",
    acknowledged: false, acknowledgedAt: null, acknowledgedBy: null
  });
  return { eventId: eventRef.key, results };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.CRON_SECRET || (req.headers.authorization || "") !== "Bearer " + process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized scheduled monitor request." });
  }
  try {
    const db = getDatabase();
    const [shipmentsSnap, statesSnap, contactsSnap] = await Promise.all([
      db.ref("shipments").once("value"),
      db.ref("network_monitoring/vehicles").once("value"),
      db.ref("emergency_contacts").once("value")
    ]);
    const shipments = shipmentsSnap.val() || {};
    const states = statesSnap.val() || {};
    const contacts = contactsSnap.val() || {};
    const thresholds = getThresholds();
    const now = Date.now();
    const counts = { online: 0, unstable: 0, offline: 0, emergency: 0, unknown: 0, notifications: 0 };
    const updates = {};
    for (const [shipmentId, shipment] of Object.entries(shipments)) {
      if (!shipment || typeof shipment !== "object") continue;
      const lastUpdate = getLastUpdate(shipment);
      const previous = states[shipmentId] || {};
      const temperature = getTemperature(shipment);
      const coords = getCoordinates(shipment);
      const tempMin = Number(shipment.minAllowedTemperature ?? shipment.storageMinTemp ?? shipment.minTemp);
      const tempMax = Number(shipment.maxAllowedTemperature ?? shipment.storageMaxTemp ?? shipment.maxTemp);
      const hasRange = Number.isFinite(tempMin) && Number.isFinite(tempMax);
      const tempEmergency = temperature !== null && hasRange && (temperature < tempMin || temperature > tempMax);
      let status = "unknown";
      let outageMinutes = null;
      let level = 0;
      if (lastUpdate !== null) {
        outageMinutes = Math.max(0, (now - lastUpdate) / 60000);
        if (tempEmergency) status = "emergency";
        else if (outageMinutes >= thresholds.escalateMinutes) { status = "offline"; level = 2; }
        else if (outageMinutes >= thresholds.notifyMinutes) { status = "offline"; level = 1; }
        else if (outageMinutes >= thresholds.warningMinutes) status = "network_unstable";
        else status = "online";
      }
      counts[status === "network_unstable" ? "unstable" : status] = (counts[status === "network_unstable" ? "unstable" : status] || 0) + 1;
      const previousLevel = Number(previous.alertLevel || 0);
      const wasOutage = previousLevel > 0 || previous.status === "offline" || previous.status === "network_unstable";
      let notification = null;
      const contactRecord = contacts[shipmentId] || contacts.default || {};
      if (level > previousLevel && level > 0) {
        notification = await deliverLevel(db, shipmentId, shipment, contactRecord, level, previousLevel, lastUpdate, outageMinutes, coords, temperature);
        counts.notifications += notification.results.filter(r => r.status === "sent").length;
      } else if (lastUpdate !== null && outageMinutes < thresholds.warningMinutes && wasOutage) {
        const recoveryRecipients = contactsFor(contactRecord, 1);
        const body = outageMessage({ shipmentId, shipment, lastUpdate, outageMinutes: previous.outageStartedAt ? (now - previous.outageStartedAt) / 60000 : outageMinutes, coords: previous.lastKnownLocation || coords, temperature, recovery: true });
        const recoveryResults = [];
        for (const recipient of recoveryRecipients) {
          const result = await sendSms(recipient.phone, body);
          recoveryResults.push({ role: recipient.role, status: result.status, providerMessageId: result.providerMessageId || null, error: result.error || null });
        }
        const eventRef = db.ref("network_monitoring/events").push();
        await eventRef.set({ eventId: eventRef.key, shipmentId, type: "TELEMETRY_RECOVERED", createdAt: now, outageMinutes: Math.round(previous.outageStartedAt ? (now - previous.outageStartedAt) / 60000 : outageMinutes), delivery: recoveryResults, status: recoveryResults.some(r=>r.status==="sent") ? "sent_or_partially_sent" : "not_delivered", acknowledged: false });
        notification = { eventId: eventRef.key, results: recoveryResults };
      }
      const outageStartedAt = level > 0 ? (previousLevel > 0 ? (previous.outageStartedAt || lastUpdate) : lastUpdate) : null;
      updates["network_monitoring/vehicles/" + shipmentId] = {
        shipmentId, status, alertLevel: level, lastSensorUpdate: lastUpdate,
        lastKnownLocation: coords || previous.lastKnownLocation || null,
        lastTemperature: temperature !== null ? temperature : (previous.lastTemperature ?? null),
        outageMinutes: level > 0 || status === "network_unstable" ? Math.round(outageMinutes || 0) : 0,
        outageStartedAt, lastCheckedAt: now,
        thresholds, temperatureVerifiedDuringOutage: false,
        lastNotificationAt: notification ? now : (previous.lastNotificationAt || null),
        lastEventId: notification?.eventId || previous.lastEventId || null,
        notificationStatus: notification ? (notification.results.some(r=>r.status==="sent") ? "sent_or_partially_sent" : "not_delivered") : (previous.notificationStatus || "not_sent"),
        notificationResults: notification?.results || previous.notificationResults || []
      };
    }
    if (Object.keys(updates).length) await db.ref().update(updates);
    return res.status(200).json({ ok: true, checkedAt: new Date(now).toISOString(), thresholds, counts });
  } catch (error) {
    console.error("ColdGuard offline monitor failed:", error.message || error);
    return res.status(500).json({ error: error.message || "Offline monitor failed." });
  }
};
