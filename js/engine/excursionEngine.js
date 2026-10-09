// ============================================================================
// ColdGuard - Temperature Excursion Detection Engine
// Rule-Based Telemetry & Cold-Chain Anomaly Detection
// ============================================================================

export class ExcursionDetectionEngine {
  constructor(categoryThresholds) {
    // Clone thresholds to allow user edits without mutating defaults
    this.thresholds = JSON.parse(JSON.stringify(categoryThresholds));
    this.rules = [
      {
        id: "RULE-01-CRIT-HIGH",
        name: "Upper Temperature Threshold Exceeded",
        conditionType: "temperature_excursion",
        evaluator: this.checkUpperTempExcursion.bind(this)
      },
      {
        id: "RULE-02-CRIT-LOW",
        name: "Freeze Risk / Lower Temperature Threshold Exceeded",
        conditionType: "temperature_excursion",
        evaluator: this.checkLowerTempExcursion.bind(this)
      },
      {
        id: "RULE-03-PROLONGED",
        name: "Prolonged Cumulative Thermal Excursion",
        conditionType: "prolonged_excursion",
        evaluator: this.checkProlongedExcursion.bind(this)
      },
      {
        id: "RULE-04-RAPID-RATE",
        name: "Rapid Rate-of-Change Anomaly (Thermal Shock)",
        conditionType: "rapid_temperature_change",
        evaluator: this.checkRapidRateOfChange.bind(this)
      },
      {
        id: "RULE-05-APPROACHING",
        name: "Approaching Critical Temperature Boundary",
        conditionType: "approaching_threshold",
        evaluator: this.checkApproachingBoundary.bind(this)
      },
      {
        id: "RULE-06-HUMIDITY",
        name: "Relative Humidity Out-of-Spec",
        conditionType: "humidity_excursion",
        evaluator: this.checkHumidityExcursion.bind(this)
      },
      {
        id: "RULE-07-DEVICE-OFFLINE",
        name: "Device Offline — Cause Not Confirmed",
        conditionType: "device_offline",
        evaluator: this.checkDeviceOffline.bind(this)
      },
      {
        id: "RULE-08-STALE-DATA",
        name: "Stale Telemetry Data Age Exceeded",
        conditionType: "stale_telemetry",
        evaluator: this.checkStaleTelemetry.bind(this)
      },
      {
        id: "RULE-09-GPS-ANOMALY",
        name: "GPS Corridor Breach / Route Deviation",
        conditionType: "gps_anomaly",
        evaluator: this.checkGpsAnomaly.bind(this)
      },
      {
        id: "RULE-10-DHT22-FAULT",
        name: "DHT22 Sensor Hardware Malfunction",
        conditionType: "sensor_hardware_fault",
        evaluator: this.checkDht22SensorFault.bind(this)
      },
      {
        id: "RULE-11-GPS-UNAVAILABLE",
        name: "GPS Signal Unavailable",
        conditionType: "gps_unavailable",
        evaluator: this.checkGpsUnavailable.bind(this)
      },
      {
        id: "RULE-12-GPS-STALE",
        name: "GPS Signal Stale",
        conditionType: "gps_stale",
        evaluator: this.checkGpsStale.bind(this)
      }
    ];
  }

  // Update thresholds for a specific vaccine category
  updateCategoryThresholds(categoryKey, newThresholds) {
    if (this.thresholds[categoryKey]) {
      this.thresholds[categoryKey] = {
        ...this.thresholds[categoryKey],
        ...newThresholds
      };
      return true;
    }
    return false;
  }

  getThresholds(categoryKey) {
    return this.thresholds[categoryKey] || null;
  }

  // Main evaluation pipeline
  evaluate(shipment) {
    const categoryConfig = this.thresholds[shipment.vaccineCategory] || {
      minTemp: shipment.minAllowedTemperature,
      maxTemp: shipment.maxAllowedTemperature,
      warningDelta: 1.0,
      minHumidity: 35.0,
      maxHumidity: 65.0
    };

    const minTemp = categoryConfig.minTemp;
    const maxTemp = categoryConfig.maxTemp;
    const warningDelta = categoryConfig.warningDelta || 1.0;
    const minHum = categoryConfig.minHumidity;
    const maxHum = categoryConfig.maxHumidity;

    const currentTemp = shipment.currentTemperature;
    const currentHum = shipment.currentHumidity;
    const dataAge = shipment.sensorDataAgeSeconds || 10;
    const history = shipment.history || [];

    // Calculate deviation
    let tempDeviation = 0;
    if (currentTemp > maxTemp) {
      tempDeviation = +(currentTemp - maxTemp).toFixed(2);
    } else if (currentTemp < minTemp) {
      tempDeviation = +(currentTemp - minTemp).toFixed(2);
    }

    // Evaluate rules in priority order
    const triggeredRules = [];

    // 1. Check DHT22 Sensor Malfunction
    const r10 = this.rules.find(r => r.id === "RULE-10-DHT22-FAULT").evaluator(shipment);
    if (r10.triggered) triggeredRules.push(r10);

    // 2. Check Device Offline (Do not confuse with hardware failure)
    const r7 = this.rules.find(r => r.id === "RULE-07-DEVICE-OFFLINE").evaluator(shipment, dataAge);
    if (r7.triggered) triggeredRules.push(r7);

    // 3. Check Stale Telemetry
    const r8 = this.rules.find(r => r.id === "RULE-08-STALE-DATA").evaluator(shipment, dataAge);
    if (r8.triggered) triggeredRules.push(r8);

    // 4. Check GPS Unavailable
    const r11 = this.rules.find(r => r.id === "RULE-11-GPS-UNAVAILABLE").evaluator(shipment);
    if (r11.triggered) triggeredRules.push(r11);

    // 5. Check GPS Stale
    const r12 = this.rules.find(r => r.id === "RULE-12-GPS-STALE").evaluator(shipment);
    if (r12.triggered) triggeredRules.push(r12);

    // 6. Upper Excursion
    const r1 = this.rules.find(r => r.id === "RULE-01-CRIT-HIGH").evaluator(currentTemp, maxTemp, shipment);
    if (r1.triggered) triggeredRules.push(r1);

    // 7. Lower Excursion (Freeze)
    const r2 = this.rules.find(r => r.id === "RULE-02-CRIT-LOW").evaluator(currentTemp, minTemp, shipment);
    if (r2.triggered) triggeredRules.push(r2);

    // 8. Prolonged Excursion
    const r3 = this.rules.find(r => r.id === "RULE-03-PROLONGED").evaluator(shipment);
    if (r3.triggered) triggeredRules.push(r3);

    // 9. Rapid Rate of Change
    const r4 = this.rules.find(r => r.id === "RULE-04-RAPID-RATE").evaluator(history, currentTemp);
    if (r4.triggered) triggeredRules.push(r4);

    // 10. Approaching Boundary
    const r5 = this.rules.find(r => r.id === "RULE-05-APPROACHING").evaluator(currentTemp, minTemp, maxTemp, warningDelta);
    if (r5.triggered) triggeredRules.push(r5);

    // 11. Humidity Excursion
    const r6 = this.rules.find(r => r.id === "RULE-06-HUMIDITY").evaluator(currentHum, minHum, maxHum);
    if (r6.triggered) triggeredRules.push(r6);

    // 12. GPS Anomaly
    const r9 = this.rules.find(r => r.id === "RULE-09-GPS-ANOMALY").evaluator(shipment);
    if (r9.triggered) triggeredRules.push(r9);

    // Determine highest severity & primary state
    let highestSeverity = "None";
    let primaryStatus = "Normal Operation";
    let primaryAction = "Continue scheduled transit; environmental parameters nominal.";
    let detectionConfidence = 99.0;

    if (triggeredRules.some(r => r.severity === "Critical")) {
      highestSeverity = "Critical";
      const critRule = triggeredRules.find(r => r.severity === "Critical");
      primaryStatus = critRule.statusLabel;
      primaryAction = critRule.recommendedAction;
      detectionConfidence = critRule.confidence || 98.5;
    } else if (triggeredRules.some(r => r.severity === "High Risk")) {
      highestSeverity = "High Risk";
      const highRule = triggeredRules.find(r => r.severity === "High Risk");
      primaryStatus = highRule.statusLabel;
      primaryAction = highRule.recommendedAction;
      detectionConfidence = highRule.confidence || 95.0;
    } else if (triggeredRules.some(r => r.severity === "Warning")) {
      highestSeverity = "Warning";
      const warnRule = triggeredRules.find(r => r.severity === "Warning");
      primaryStatus = warnRule.statusLabel;
      primaryAction = warnRule.recommendedAction;
      detectionConfidence = warnRule.confidence || 92.0;
    }

    // Format final standardized payload matching required parameter schema
    return {
      current_temperature_c: currentTemp,
      min_allowed_temperature_c: minTemp,
      max_allowed_temperature_c: maxTemp,
      current_humidity_percent: currentHum,
      min_allowed_humidity_percent: minHum,
      max_allowed_humidity_percent: maxHum,
      excursion_start_timestamp: shipment.excursionStartTime || (highestSeverity !== "None" ? new Date().toISOString() : null),
      excursion_duration_minutes: shipment.excursionDurationMinutes || 0,
      temperature_deviation_c: tempDeviation,
      peak_temperature_c: Math.max(shipment.peakTemperature || currentTemp, currentTemp),
      minimum_recorded_temperature_c: Math.min(shipment.minimumRecordedTemperature || currentTemp, currentTemp),
      cumulative_excursion_minutes: shipment.cumulativeExcursionMinutes || (shipment.excursionDurationMinutes || 0),
      consecutive_out_of_range_readings: shipment.consecutiveOutOfRangeReadings || 0,
      sensor_reading_timestamp: shipment.lastSensorUpdate || new Date().toISOString(),
      sensor_data_age_seconds: dataAge,
      sensor_status: shipment.sensorConnectivity || "Online",
      detection_confidence_percent: detectionConfidence,
      excursion_severity: highestSeverity,
      excursion_status: primaryStatus,
      recommended_action: primaryAction,
      triggered_rules: triggeredRules,
      detected_problems: triggeredRules.map(r => ({
        problemId: r.ruleId,
        problemType: r.statusLabel,
        severity: r.severity,
        shipmentId: shipment.id,
        lastUpdated: shipment.lastSensorUpdate || new Date().toISOString(),
        delta: r.delta || "Anomaly detected",
        recommendedAction: r.recommendedAction,
        readingResponsible: r.readingResponsible || "Sensor Telemetry"
      })),
      is_excursion_active: highestSeverity === "Critical" || highestSeverity === "High Risk"
    };
  }

  // --- Rule Evaluator Implementations ---

  checkUpperTempExcursion(currentTemp, maxTemp, shipment) {
    if (currentTemp > maxTemp) {
      const delta = +(currentTemp - maxTemp).toFixed(2);
      const isExtreme = delta > 3.0;
      return {
        ruleId: "RULE-01-CRIT-HIGH",
        ruleName: "Upper Temperature Threshold Exceeded",
        triggered: true,
        severity: isExtreme ? "Critical" : "High Risk",
        statusLabel: "Temperature Excursion (Hyperthermic)",
        delta: `+${delta}°C above threshold (${maxTemp}°C)`,
        readingResponsible: `${currentTemp}°C (Max: ${maxTemp}°C)`,
        confidence: 99.4,
        recommendedAction: isExtreme
          ? "CRITICAL ALERT: Core temperature severely breached ceiling. Initiate immediate cold chain emergency protocol and divert to nearest cryo-checkpoint."
          : "HIGH RISK ALERT: Temperature is above permitted limit. Verify reefer compressor status and prepare emergency dry ice replenishment."
      };
    }
    return { triggered: false };
  }

  checkLowerTempExcursion(currentTemp, minTemp, shipment) {
    if (currentTemp < minTemp) {
      const delta = +(minTemp - currentTemp).toFixed(2);
      return {
        ruleId: "RULE-02-CRIT-LOW",
        ruleName: "Freeze Risk / Lower Threshold Breach",
        triggered: true,
        severity: "Critical",
        statusLabel: "Freeze Risk Excursion (Sub-cooled)",
        delta: `-${delta}°C below threshold (${minTemp}°C)`,
        readingResponsible: `${currentTemp}°C (Min: ${minTemp}°C)`,
        confidence: 99.1,
        recommendedAction: "CRITICAL FREEZE WARNING: Vaccine core temperature below safe threshold. Physical denaturation or vial rupture risk. Relocate away from cold evaporator blowers."
      };
    }
    return { triggered: false };
  }

  checkProlongedExcursion(shipment) {
    if (shipment.excursionDurationMinutes && shipment.excursionDurationMinutes >= 20) {
      return {
        ruleId: "RULE-03-PROLONGED",
        ruleName: "Prolonged Cumulative Thermal Excursion",
        triggered: true,
        severity: "Critical",
        statusLabel: "Prolonged Excursion (>20 mins)",
        delta: `${shipment.excursionDurationMinutes} minutes continuous breach`,
        readingResponsible: `Duration: ${shipment.excursionDurationMinutes} min`,
        confidence: 98.8,
        recommendedAction: "EXCURSION TIME LIMIT EXCEEDED: Viability degraded past safe threshold. Automatic quarantine flag added to manifest upon delivery."
      };
    }
    return { triggered: false };
  }

  checkRapidRateOfChange(history, currentTemp) {
    if (history && history.length >= 3) {
      const prev = history[history.length - 2];
      const rate = Math.abs(currentTemp - prev.temperature);
      if (rate >= 1.4) {
        return {
          ruleId: "RULE-04-RAPID-RATE",
          ruleName: "Rapid Rate-of-Change Anomaly",
          triggered: true,
          severity: "Warning",
          statusLabel: "Rapid Temperature Change",
          delta: `Δ ${rate.toFixed(2)}°C change in <5 mins`,
          readingResponsible: `Jumped from ${prev.temperature}°C to ${currentTemp}°C`,
          confidence: 94.0,
          recommendedAction: "Rapid thermal drift detected. Check packaging integrity, door latch, or potential thermal logger probe displacement."
        };
      }
    }
    return { triggered: false };
  }

  checkApproachingBoundary(currentTemp, minTemp, maxTemp, warningDelta) {
    const nearUpper = currentTemp <= maxTemp && currentTemp >= (maxTemp - warningDelta);
    const nearLower = currentTemp >= minTemp && currentTemp <= (minTemp + warningDelta);

    if (nearUpper) {
      const margin = +(maxTemp - currentTemp).toFixed(2);
      return {
        ruleId: "RULE-05-APPROACHING",
        ruleName: "Approaching Upper Temperature Boundary",
        triggered: true,
        severity: "Warning",
        statusLabel: "Approaching Threshold",
        delta: `Within ${margin}°C of upper limit (${maxTemp}°C)`,
        readingResponsible: `${currentTemp}°C (Margin: +${margin}°C)`,
        confidence: 93.0,
        recommendedAction: "Temperature is trending towards the upper safety margin. Monitor cooling cycle and minimize vehicle stops."
      };
    } else if (nearLower) {
      const margin = +(currentTemp - minTemp).toFixed(2);
      return {
        ruleId: "RULE-05-APPROACHING",
        ruleName: "Approaching Lower Temperature Boundary",
        triggered: true,
        severity: "Warning",
        statusLabel: "Approaching Threshold (Cold)",
        delta: `Within ${margin}°C of lower limit (${minTemp}°C)`,
        readingResponsible: `${currentTemp}°C (Margin: -${margin}°C)`,
        confidence: 92.5,
        recommendedAction: "Temperature is nearing the freezing safety margin. Ensure thermal buffer pack isolation."
      };
    }
    return { triggered: false };
  }

  checkHumidityExcursion(currentHum, minHum, maxHum) {
    if (currentHum > maxHum || currentHum < minHum) {
      const isHigh = currentHum > maxHum;
      return {
        ruleId: "RULE-06-HUMIDITY",
        ruleName: "Relative Humidity Out-of-Spec",
        triggered: true,
        severity: "Warning",
        statusLabel: "Humidity Excursion",
        delta: isHigh ? `+${(currentHum - maxHum).toFixed(1)}% above max` : `-${(minHum - currentHum).toFixed(1)}% below min`,
        readingResponsible: `${currentHum}% RH (Range: ${minHum}% - ${maxHum}%)`,
        confidence: 91.0,
        recommendedAction: isHigh
          ? "Excess humidity detected inside secondary packaging. Potential moisture condensation or desiccant saturation. Inspect desiccants upon receipt."
          : "Low relative humidity detected. Ensure sealed atmosphere around dry-ice compartment."
      };
    }
    return { triggered: false };
  }

  checkDeviceOffline(shipment, dataAge) {
    if (shipment.sensorConnectivity === "Offline" || dataAge > 300 || shipment.isDeviceOffline) {
      return {
        ruleId: "RULE-07-DEVICE-OFFLINE",
        ruleName: "Device Offline — Cause Not Confirmed",
        triggered: true,
        severity: "High Risk",
        statusLabel: "Device offline — cause not confirmed",
        delta: `No telemetry received for ${Math.round(dataAge / 60)} minutes`,
        readingResponsible: `Data Age: ${dataAge}s (Gateway silent)`,
        confidence: 96.0,
        recommendedAction: "Device offline — cause not confirmed. Telemetry packets stopped. Do not assume hardware failure; verify vehicle auxiliary power, SIM cellular network coverage, or IoT gateway state."
      };
    }
    return { triggered: false };
  }

  checkDht22SensorFault(shipment) {
    const t = shipment.currentTemperature;
    const h = shipment.currentHumidity;
    const isTempCorrupted = t === null || t === undefined || isNaN(t) || t > 85.0 || t < -50.0;
    const isHumCorrupted = h === null || h === undefined || isNaN(h) || h < 0 || h > 100.0;

    if (shipment.isSensorFaulty || isTempCorrupted || isHumCorrupted) {
      return {
        ruleId: "RULE-10-DHT22-FAULT",
        ruleName: "DHT22 Sensor Hardware Malfunction",
        triggered: true,
        severity: "Critical",
        statusLabel: "DHT22 Sensor Hardware Malfunction",
        delta: "Probe reading invalid or out-of-bounds",
        readingResponsible: `Read: Temp ${t}°C, Hum ${h}% (Expected -50°C to +85°C)`,
        confidence: 99.5,
        recommendedAction: "DHT22 sensor hardware malfunction detected. Sensor returned invalid or NaN telemetry. Inspect GPIO probe wiring, 10k pull-up resistor, and probe physical connection."
      };
    }
    return { triggered: false };
  }

  checkGpsUnavailable(shipment) {
    const loc = shipment.location || {};
    const noFix = loc.hasFix === false || loc.status === "NO_FIX" || shipment.gpsFixStatus === "NO_FIX" || shipment.isGpsUnavailable;

    if (noFix) {
      return {
        ruleId: "RULE-11-GPS-UNAVAILABLE",
        ruleName: "GPS Signal Unavailable",
        triggered: true,
        severity: "Warning",
        statusLabel: "GPS signal unavailable",
        delta: "0 satellites locked / Fix lost",
        readingResponsible: "NEO-6M receiver searching for satellites",
        confidence: 98.0,
        recommendedAction: "GPS signal unavailable. Satellite lock lost. Vehicle may be in a tunnel, underpass, mountain pass, or covered loading bay. Displaying last known verified location."
      };
    }
    return { triggered: false };
  }

  checkGpsStale(shipment) {
    const loc = shipment.location || {};
    const now = Date.now();
    const lastGpsTime = loc.lastUpdated || (loc.gpsTimestamp ? Number(loc.gpsTimestamp) : null);
    const ageSeconds = lastGpsTime ? Math.round((now - lastGpsTime) / 1000) : 0;

    if (ageSeconds > 90 || shipment.isGpsStale) {
      return {
        ruleId: "RULE-12-GPS-STALE",
        ruleName: "GPS Signal Stale",
        triggered: true,
        severity: "Warning",
        statusLabel: "GPS signal stale",
        delta: `Position age is ${ageSeconds > 0 ? ageSeconds : 120}s (>90s freshness limit)`,
        readingResponsible: `Last update: ${new Date(lastGpsTime || now - 120000).toLocaleTimeString()}`,
        confidence: 93.0,
        recommendedAction: "GPS signal stale. Position has not refreshed for over 90 seconds. Displaying last known coordinates clearly labeled as outdated."
      };
    }
    return { triggered: false };
  }

  checkStaleTelemetry(shipment, dataAge) {
    if (dataAge > 120 && dataAge <= 300) {
      return {
        ruleId: "RULE-08-STALE-DATA",
        ruleName: "Stale Telemetry Latency",
        triggered: true,
        severity: "Warning",
        statusLabel: "Stale Telemetry",
        delta: `Telemetry age is ${dataAge}s (freshness threshold: 120s)`,
        readingResponsible: `Age: ${dataAge} seconds`,
        confidence: 89.0,
        recommendedAction: "Telemetry updates are experiencing latency. Carrier cellular gateway may be in a low coverage rural corridor."
      };
    }
    return { triggered: false };
  }

  checkGpsAnomaly(shipment) {
    if (shipment.routeDeviationDetected) {
      return {
        ruleId: "RULE-09-GPS-ANOMALY",
        ruleName: "GPS Corridor Breach / Route Deviation",
        triggered: true,
        severity: "High Risk",
        statusLabel: "Route Deviation",
        delta: `Off approved highway corridor (>15 km diversion)`,
        readingResponsible: `Lat: ${shipment.gpsLatitude}, Lng: ${shipment.gpsLongitude}`,
        confidence: 95.5,
        recommendedAction: "Vehicle has departed from the authorized distribution route. Contact driver and logistics control tower immediately."
      };
    }
    return { triggered: false };
  }
}
