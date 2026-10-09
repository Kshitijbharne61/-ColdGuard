const {
  getDatabase, requireUser, getLastUpdate, getTemperature, getCoordinates,
  getThresholds, sendSms, outageMessage, maskPhone
} = require("../lib/networkMonitor");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const user = await requireUser(req, { adminOnly: req.method === "POST" });
    const db = user.db;
    if (req.method === "GET") {
      const [shipmentsSnap, vehiclesSnap, eventsSnap, contactsSnap] = await Promise.all([
        db.ref("shipments").once("value"),
        db.ref("network_monitoring/vehicles").once("value"),
        db.ref("network_monitoring/events").limitToLast(100).once("value"),
        db.ref("emergency_contacts").once("value")
      ]);
      const shipments = shipmentsSnap.val() || {};
      const states = vehiclesSnap.val() || {};
      const events = Object.values(eventsSnap.val() || {}).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
      const contacts = contactsSnap.val() || {};
      const thresholds = getThresholds();
      const now = Date.now();
      const vehicles = Object.entries(shipments).map(([shipmentId, shipment]) => {
        const state = states[shipmentId] || {};
        const lastUpdate = getLastUpdate(shipment);
        const ageMinutes = lastUpdate === null ? null : Math.max(0, (now-lastUpdate)/60000);
        const coords = getCoordinates(shipment) || state.lastKnownLocation || null;
        const temperature = getTemperature(shipment);
        const tempMin = Number(shipment.minAllowedTemperature ?? shipment.storageMinTemp ?? shipment.minTemp);
        const tempMax = Number(shipment.maxAllowedTemperature ?? shipment.storageMaxTemp ?? shipment.maxTemp);
        const hasRange = Number.isFinite(tempMin) && Number.isFinite(tempMax);
        const temperatureStatus = temperature === null ? "unavailable" : !hasRange ? "range_not_configured" : temperature < tempMin || temperature > tempMax ? "outside_range" : "within_range";
        let status = "unknown";
        if (ageMinutes !== null) status = temperatureStatus === "outside_range" ? "emergency" : ageMinutes >= thresholds.notifyMinutes ? "offline" : ageMinutes >= thresholds.warningMinutes ? "network_unstable" : "online";
        return {
          shipmentId, vaccineName: shipment.vaccineName || "Shipment", driverName: shipment.driverName || shipment.assignedDriver || shipment.operatorName || "Not assigned",
          status, ageMinutes: ageMinutes === null ? null : Math.round(ageMinutes*10)/10,
          lastSensorUpdate: lastUpdate, lastKnownLocation: coords,
          lastTemperature: temperature, temperatureStatus,
          localBufferStatus: shipment?.deviceBuffer?.status || shipment?.bufferStatus || shipment?.telemetry?.buffer?.status || "not_reported_by_device",
          bufferedReadings: Number.isFinite(Number(shipment?.deviceBuffer?.queuedCount ?? shipment?.telemetry?.buffer?.queuedCount)) ? Number(shipment?.deviceBuffer?.queuedCount ?? shipment?.telemetry?.buffer?.queuedCount) : null,
          lastBufferSyncAt: shipment?.deviceBuffer?.lastSyncAt || shipment?.telemetry?.buffer?.lastSyncAt || null,
          notificationStatus: state.notificationStatus || "not_sent",
          notificationResults: state.notificationResults || [],
          outageStartedAt: state.outageStartedAt || null, lastCheckedAt: state.lastCheckedAt || null,
          lastEventId: state.lastEventId || null,
          contacts: {
            driver: maskPhone((contacts[shipmentId] || contacts.default || {}).driverPhone),
            emergency: maskPhone((contacts[shipmentId] || contacts.default || {}).emergencyPhone),
            agency: maskPhone((contacts[shipmentId] || contacts.default || {}).agencyPhone || (contacts[shipmentId] || contacts.default || {}).controlRoomPhone)
          }
        };
      });
      const counts = { online: 0, network_unstable: 0, offline: 0, emergency: 0, unknown: 0 };
      vehicles.forEach(v => { counts[v.status] = (counts[v.status] || 0) + 1; });
      return res.status(200).json({ ok: true, isAdmin: user.isAdmin, thresholds, counts, vehicles, events: events.map(e => ({ ...e, delivery: (e.delivery || []).map(d => ({ ...d, phone: undefined })) })) });
    }

    const body = req.body || {};
    if (body.action === "acknowledge") {
      if (typeof body.eventId !== "string" || !/^[A-Za-z0-9_-]{5,120}$/.test(body.eventId)) return res.status(400).json({ error: "Valid eventId is required." });
      const ref = db.ref("network_monitoring/events/" + body.eventId);
      const snap = await ref.once("value");
      if (!snap.exists()) return res.status(404).json({ error: "Alert event not found." });
      await ref.update({ acknowledged: true, acknowledgedAt: Date.now(), acknowledgedBy: user.email || user.uid });
      await db.ref("audit_logs").push({ timestamp: new Date().toISOString(), operator: user.email || user.uid, event: "NETWORK_ALERT_ACKNOWLEDGED", details: "Acknowledged network event " + body.eventId });
      return res.status(200).json({ ok: true, eventId: body.eventId, acknowledged: true });
    }
    if (body.action === "test") {
      const shipmentId = typeof body.shipmentId === "string" ? body.shipmentId.slice(0,120) : "";
      const shipmentSnap = shipmentId ? await db.ref("shipments/" + shipmentId).once("value") : null;
      if (!shipmentSnap || !shipmentSnap.exists()) return res.status(400).json({ error: "Select a real shipment before sending a test alert." });
      const rateRef = db.ref("network_monitoring/test_alerts/" + user.uid);
      const rate = (await rateRef.once("value")).val() || {};
      if (Date.now() - Number(rate.lastSentAt || 0) < 60000) return res.status(429).json({ error: "Test alerts are limited to one per administrator per minute." });
      const shipment = shipmentSnap.val();
      const contacts = (await db.ref("emergency_contacts/" + shipmentId).once("value")).val() || (await db.ref("emergency_contacts/default").once("value")).val() || {};
      const recipients = [
        { role: "driver", phone: contacts.driverPhone },
        { role: "control_room", phone: contacts.controlRoomPhone || contacts.agencyPhone },
        { role: "emergency_contact", phone: contacts.emergencyPhone }
      ].filter((x,i,arr)=>x.phone && arr.findIndex(y=>y.phone===x.phone)===i);
      if (!recipients.length) return res.status(400).json({ error: "No emergency contacts are configured for this shipment. Configure emergency_contacts in RTDB first." });
      await rateRef.set({ lastSentAt: Date.now(), by: user.email || user.uid });
      const lastUpdate = getLastUpdate(shipment), temperature = getTemperature(shipment), coords = getCoordinates(shipment);
      const bodyText = "ColdGuard TEST ALERT for " + shipmentId + ". This is an administrator-requested delivery test; not a confirmed emergency. Last sensor update: " + (lastUpdate ? new Date(lastUpdate).toISOString() : "unavailable") + ". Last temperature: " + (temperature === null ? "unavailable" : temperature + "°C") + ". Last location: " + (coords ? coords.latitude + ", " + coords.longitude : "unavailable") + ". Map: " + (coords ? "https://maps.google.com/?q="+coords.latitude+","+coords.longitude : "unavailable");
      const results = [];
      for (const recipient of recipients) {
        const result = await sendSms(recipient.phone, bodyText);
        results.push({ role: recipient.role, status: result.status, providerMessageId: result.providerMessageId || null, error: result.error || null });
      }
      const eventRef = db.ref("network_monitoring/events").push();
      await eventRef.set({ eventId: eventRef.key, shipmentId, type: "TEST_ALERT", createdAt: Date.now(), createdBy: user.email || user.uid, delivery: results, status: results.some(r=>r.status==="sent") ? "sent_or_partially_sent" : "not_delivered", acknowledged: true, acknowledgedBy: user.email || user.uid, acknowledgedAt: Date.now() });
      await db.ref("audit_logs").push({ timestamp: new Date().toISOString(), operator: user.email || user.uid, event: "NETWORK_TEST_ALERT", details: "Test alert for " + shipmentId + "; provider result: " + results.map(r=>r.role+":"+r.status).join(", ") });
      return res.status(200).json({ ok: true, eventId: eventRef.key, delivery: results });
    }
    return res.status(400).json({ error: "Unsupported action." });
  } catch (error) {
    const status = error.status || (error.message === "FIREBASE_SERVICE_ACCOUNT_JSON is not configured." ? 503 : 500);
    if (status >= 500) console.error("ColdGuard network alert API failed:", error.message || error);
    return res.status(status).json({ error: error.message || "Network alert request failed." });
  }
};
