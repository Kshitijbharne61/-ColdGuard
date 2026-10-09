// api/ingest-gps.js
// Vercel Serverless Function — Secure GPS Telemetry Ingestion for ColdGuard
// Runs on Vercel's 100% Free Tier (No Google Cloud Blaze plan required)

const crypto = require('crypto');

const RTDB_BASE_URL = "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app";

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-coldguard-device-id, x-coldguard-device-token');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const deviceId = req.headers['x-coldguard-device-id'] || req.body?.deviceId;
  const deviceToken = req.headers['x-coldguard-device-token'] || req.body?.deviceToken;

  if (!deviceId || !deviceToken) {
    return res.status(401).json({ error: 'Unauthorized: Missing device ID or token credentials.' });
  }

  try {
    // 1. Verify Device Identity against Firebase RTDB
    const deviceRes = await fetch(`${RTDB_BASE_URL}/devices/${deviceId}.json`);
    const deviceData = await deviceRes.json();

    if (!deviceData || !deviceData.deviceSecretHash) {
      return res.status(403).json({ error: 'Forbidden: Device is not provisioned in ColdGuard.' });
    }

    const providedHash = crypto.createHash('sha256').update(deviceToken).digest('hex');
    const expectedBuf = Buffer.from(deviceData.deviceSecretHash, 'hex');
    const providedBuf = Buffer.from(providedHash, 'hex');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return res.status(403).json({ error: 'Forbidden: Invalid device authentication token.' });
    }

    // 2. Validate GPS Payload
    const shipmentId = req.body?.shipmentId || deviceData.assignedShipmentId || "CG-9021-PFZ";
    const hasFix = req.body?.hasFix === true || req.body?.hasFix === "true";
    const now = Date.now();

    // Handle "No Satellite Fix" (e.g. indoors or signal lost)
    if (!hasFix) {
      const noFixPayload = {
        isLiveGps: true,
        hasFix: false,
        status: "NO_FIX",
        message: "GPS signal unavailable (Searching for satellites)",
        lastUpdated: now
      };

      await fetch(`${RTDB_BASE_URL}/shipments/${shipmentId}/location.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noFixPayload)
      });

      return res.status(200).json({
        success: true,
        shipmentId,
        hasFix: false,
        message: "GPS searching for satellite fix. Signal currently unavailable."
      });
    }

    // Validate Numerical Coordinates
    const lat = Number(req.body?.latitude);
    const lng = Number(req.body?.longitude);
    const speedKmH = Number(req.body?.speedKmH) || 0;
    const satellites = Number(req.body?.satellites) || 0;
    const altitudeM = Number(req.body?.altitudeM) || 0;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(422).json({ error: 'Unprocessable: Invalid latitude or longitude coordinates.' });
    }

    // 3. Save Latest Location to /shipments/{shipmentId}/location
    const locationPayload = {
      latitude: lat,
      longitude: lng,
      speedKmH: Math.round(speedKmH * 10) / 10,
      satellites,
      altitudeM: Math.round(altitudeM * 10) / 10,
      isLiveGps: true,
      hasFix: true,
      status: "LOCKED",
      gpsTimestamp: req.body?.gpsTimestamp || now,
      lastUpdated: now
    };

    const updateLocationPromise = fetch(`${RTDB_BASE_URL}/shipments/${shipmentId}/location.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(locationPayload)
    });

    // 4. Record to GPS Route History Breadcrumbs /gps_history/{shipmentId}
    const historyPayload = {
      latitude: lat,
      longitude: lng,
      speedKmH: Math.round(speedKmH * 10) / 10,
      satellites,
      timestamp: now
    };

    const appendHistoryPromise = fetch(`${RTDB_BASE_URL}/gps_history/${shipmentId}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyPayload)
    });

    // 5. Update Shipment Root Coordinates for Fast Querying
    const updateShipmentRootPromise = fetch(`${RTDB_BASE_URL}/shipments/${shipmentId}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gpsLatitude: lat,
        gpsLongitude: lng,
        lastSensorUpdate: new Date(now).toISOString(),
        currentLocation: `Live GPS: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Speed: ${speedKmH.toFixed(1)} km/h)`
      })
    });

    await Promise.all([updateLocationPromise, appendHistoryPromise, updateShipmentRootPromise]);

    return res.status(200).json({
      success: true,
      shipmentId,
      latitude: lat,
      longitude: lng,
      speedKmH,
      satellites,
      status: "LOCKED",
      timestamp: now
    });

  } catch (err) {
    console.error('Error processing GPS ingestion:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
};
