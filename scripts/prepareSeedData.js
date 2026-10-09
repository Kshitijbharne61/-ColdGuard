// scripts/prepareSeedData.js
// Exports mock coldguard data into seed_data.json for Firebase Realtime Database

const fs = require('fs');
const path = require('path');

async function main() {
  // Dynamically import the ES module mockData.js
  const mockDataModule = await import('../js/data/mockData.js');
  const { VACCINE_PROFILES, CHECKPOINTS, INITIAL_SHIPMENTS } = mockDataModule;

  const dbData = {
    thresholds: VACCINE_PROFILES,
    checkpoints: {},
    shipments: {},
    alerts: {},
    audit_logs: {}
  };

  CHECKPOINTS.forEach((cp) => {
    dbData.checkpoints[cp.id] = cp;
  });

  INITIAL_SHIPMENTS.forEach((s) => {
    dbData.shipments[s.id] = {
      ...s,
      telemetry: {
        live: {
          temperature: s.currentTemperature,
          humidity: s.currentHumidity,
          latitude: s.gpsLatitude,
          longitude: s.gpsLongitude,
          batteryLevel: s.batteryLevel,
          timestamp: Date.now(),
          severity: s.riskClassification === 'Critical' ? 'CRITICAL' : s.riskClassification === 'Warning' || s.riskClassification === 'High' ? 'WARNING' : 'SAFE',
          excursionStatus: s.excursionStatus
        },
        history: (s.history || []).slice(-25)
      }
    };

    // If shipment has excursion, add an alert
    if (s.excursionSeverity && s.excursionSeverity !== 'None') {
      const alertId = `ALT-${s.id}`;
      dbData.alerts[alertId] = {
        alertId,
        shipmentId: s.id,
        vaccineName: s.vaccineName,
        severity: s.excursionSeverity === 'Critical' ? 'CRITICAL' : 'WARNING',
        type: s.currentTemperature > s.maxAllowedTemperature ? 'HEAT_EXCURSION' : 'FREEZE_EXCURSION',
        temperature: s.currentTemperature,
        deviation: s.temperatureDeviation,
        message: `Excursion detected on ${s.vaccineName} (${s.id}). Current temp: ${s.currentTemperature}°C exceeds threshold.`,
        recommendedAction: s.recommendedNextAction,
        timestamp: Date.now() - 1000 * 60 * 30,
        status: 'ACTIVE'
      };
    }
  });

  // Generate initial audit trail
  INITIAL_SHIPMENTS.forEach((s, idx) => {
    const key = `LOG-${String(idx + 1).padStart(4, '0')}`;
    dbData.audit_logs[key] = {
      logId: key,
      shipmentId: s.id,
      timestamp: s.dispatchedAt,
      event: "DISPATCHED_IN_TRANSIT",
      details: `Consignment ${s.id} (${s.vaccineName}, Lot: ${s.lotNumber}) dispatched from ${s.originFacility}. Target: ${s.tempMin}°C to ${s.tempMax}°C.`,
      operator: "ColdGuard Automated Logging System",
      pqsComplianceStatus: s.excursionSeverity === 'None' ? 'COMPLIANT' : 'REVIEW_REQUIRED'
    };
  });

  const outPath = path.join(__dirname, '..', 'seed_data.json');
  fs.writeFileSync(outPath, JSON.stringify(dbData, null, 2));
  console.log('Successfully generated seed_data.json with:');
  console.log(`- ${Object.keys(dbData.shipments).length} shipments`);
  console.log(`- ${Object.keys(dbData.checkpoints).length} checkpoints`);
  console.log(`- ${Object.keys(dbData.alerts).length} active alerts`);
  console.log(`- ${Object.keys(dbData.thresholds).length} category thresholds`);
  console.log(`- ${Object.keys(dbData.audit_logs).length} audit logs`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
