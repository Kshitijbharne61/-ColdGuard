// ============================================================================
// ColdGuard - Real-Time Telemetry Simulation Engine
// Realistic Bounded Random Walk, Time-Lapse, & Scenario Injection
// ============================================================================

import { ExcursionDetectionEngine } from "./excursionEngine.js";
import { ViabilityModel } from "./viabilityModel.js";

export class SimulationEngine {
  constructor(initialShipments, vaccineProfiles, onUpdateCallback) {
    // Clone shipments so we maintain state
    this.shipments = JSON.parse(JSON.stringify(initialShipments));
    this.vaccineProfiles = vaccineProfiles;
    this.excursionEngine = new ExcursionDetectionEngine(vaccineProfiles);
    this.onUpdateCallback = onUpdateCallback;

    this.isRunning = true;
    this.speedMultiplier = 1; // 1x, 5x, 10x
    this.baseIntervalMs = 3000; // 3 seconds
    this.timerId = null;
    this.ticksCount = 0;

    // Run initial evaluation on all shipments
    this.reevaluateAll();
  }

  start() {
    if (this.timerId) clearInterval(this.timerId);
    this.isRunning = true;
    const interval = Math.max(400, Math.round(this.baseIntervalMs / this.speedMultiplier));
    this.timerId = setInterval(() => this.tick(), interval);
  }

  pause() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  togglePlayPause() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
    return this.isRunning;
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
    if (this.isRunning) {
      this.start();
    }
  }

  reevaluateAll() {
    this.shipments.forEach(s => {
      this.evaluateShipment(s);
    });
  }

  evaluateShipment(s) {
    const profile = this.vaccineProfiles[s.vaccineCategory];
    const detection = this.excursionEngine.evaluate(s);
    const viability = ViabilityModel.estimateViability(s, profile);

    // Update risk & prediction fields
    s.excursionStatus = detection.excursion_status;
    s.excursionSeverity = detection.excursion_severity;
    s.riskClassification = viability.riskClassification;
    s.estimatedViabilityPercent = viability.estimatedRemainingViabilityPercent;
    s.predictedSpoilageRiskPercent = viability.predictedSpoilageRiskPercent;
    s.temperatureDeviation = detection.temperature_deviation_c;
    s.consecutiveOutOfRangeReadings = detection.consecutive_out_of_range_readings;
    s.detectionConfidencePercent = detection.detection_confidence_percent;
    s.recommendedNextAction = detection.recommended_action;
    s.detectionResult = detection;
    s.viabilityResult = viability;
  }

  tick() {
    this.ticksCount++;
    const nowIso = new Date().toISOString();

    this.shipments.forEach(s => {
      // Don't modify delivered shipments
      if (s.status === "Delivered") return;

      // Realistic bounded jitter
      const tempJitter = (Math.random() - 0.49) * 0.12 * this.speedMultiplier;
      const humJitter = (Math.random() - 0.49) * 0.35 * this.speedMultiplier;

      // If in excursion, slight upward drift or maintain breach
      if (s.excursionSeverity === "Critical" || s.excursionSeverity === "High Risk") {
        s.excursionDurationMinutes = (s.excursionDurationMinutes || 0) + Math.round(1 * this.speedMultiplier);
        s.cumulativeThermalExposure = +( (s.cumulativeThermalExposure || 0) + 0.03 * this.speedMultiplier ).toFixed(2);
      }

      s.currentTemperature = parseFloat((s.currentTemperature + tempJitter).toFixed(2));
      s.currentHumidity = parseFloat(Math.min(99, Math.max(10, s.currentHumidity + humJitter)).toFixed(1));
      s.lastSensorUpdate = nowIso;
      s.sensorDataAgeSeconds = Math.max(2, Math.round(Math.random() * 8));

      // Gentle movement along coordinates towards destination
      if (s.routeDistanceRemainingKm > 0) {
        s.routeDistanceRemainingKm = Math.max(0, +(s.routeDistanceRemainingKm - 0.2 * this.speedMultiplier).toFixed(1));
        // Small incremental jitter to GPS to show live tracking
        s.gpsLatitude += (Math.random() - 0.48) * 0.0003;
        s.gpsLongitude += (Math.random() - 0.48) * 0.0003;
      }

      // Record history
      if (!s.history) s.history = [];
      s.history.push({
        timestamp: nowIso,
        temperature: s.currentTemperature,
        humidity: s.currentHumidity,
        viability: s.estimatedViabilityPercent
      });
      if (s.history.length > 35) {
        s.history.shift();
      }

      // Re-evaluate through rule & viability engine
      this.evaluateShipment(s);
    });

    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.shipments);
    }
  }

  // --- Manual Scenario Injections ---

  injectRefrigerationFailure(shipmentId) {
    const s = this.shipments.find(item => item.id === shipmentId) || this.shipments[0];
    if (!s) return;

    // Spike temperature upwards by 6.5°C
    s.currentTemperature += 6.5;
    s.currentTemperature = +s.currentTemperature.toFixed(2);
    s.excursionStartTime = new Date().toISOString();
    s.excursionDurationMinutes = 15;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "critical",
      desc: "SIMULATION INJECTION: Reefer compressor failure. Core temperature rapidly climbing."
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }

  injectDryIceDepletion(shipmentId) {
    const s = this.shipments.find(item => item.id === shipmentId) || this.shipments.find(item => item.vaccineCategory === "mrna_ultra_cold");
    if (!s) return;

    s.currentTemperature = -48.5; // Significant breach of -60°C ceiling
    s.excursionStartTime = new Date().toISOString();
    s.excursionDurationMinutes = 42;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "critical",
      desc: "SIMULATION INJECTION: Dry-ice sublimation exhausted. Core temperature rose to -48.5°C."
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }

  injectRouteDeviation(shipmentId) {
    const s = this.shipments.find(item => item.id === shipmentId) || this.shipments[1];
    if (!s) return;

    s.routeDeviationDetected = true;
    s.gpsLatitude += 0.12;
    s.gpsLongitude -= 0.18;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "warning",
      desc: "SIMULATION INJECTION: Vehicle deviated from authorized highway corridor (+24km detour)."
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }

  injectSensorBatteryLow(shipmentId) {
    const s = this.shipments.find(item => item.id === shipmentId) || this.shipments[2];
    if (!s) return;

    s.batteryLevel = 4;
    s.sensorConnectivity = "Low Battery";
    s.sensorDataAgeSeconds = 185;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "warning",
      desc: "SIMULATION INJECTION: Telemetry probe battery dropped to 4%. Stale packet interval active."
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }

  injectHumiditySpike(shipmentId) {
    const s = this.shipments.find(item => item.id === shipmentId) || this.shipments[0];
    if (!s) return;

    s.currentHumidity = 88.5;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "warning",
      desc: "SIMULATION INJECTION: Door ajar or seal breach; internal humidity spiked to 88.5% RH."
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }

  injectColdRecovery(shipmentId) {
    const s = this.shipments.find(item => item.id === shipmentId) || this.shipments[0];
    if (!s) return;

    const prof = this.vaccineProfiles[s.vaccineCategory];
    const target = (prof.minTemp + prof.maxTemp) / 2;
    s.currentTemperature = +(target.toFixed(1));
    s.currentHumidity = 45.0;
    s.excursionStartTime = null;
    s.excursionDurationMinutes = 0;
    s.routeDeviationDetected = false;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "safe",
      desc: "RECOVERY: Cold chain restored. Temperature stabilized within safe boundaries."
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }

  resetAllToSafe(initialShipments) {
    this.shipments = JSON.parse(JSON.stringify(initialShipments));
    this.reevaluateAll();
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
  }

  rerouteShipmentToCheckpoint(shipmentId, checkpoint) {
    const s = this.shipments.find(item => item.id === shipmentId);
    if (!s) return null;

    s.status = "Emergency Rerouting";
    s.destinationFacility = `${checkpoint.name} (${checkpoint.type})`;
    s.routeDistanceRemainingKm = checkpoint.distanceKm;
    s.eta = `${checkpoint.travelTimeMinutes} mins (Emergency Diversion)`;
    s.nearestCheckpointId = checkpoint.id;
    s.timeline.unshift({
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: "safe",
      desc: `OPERATOR ACTION: Emergency Reroute dispatched to ${checkpoint.name}. Checkpoint pharmacist notified.`
    });
    this.evaluateShipment(s);
    if (this.onUpdateCallback) this.onUpdateCallback(this.shipments);
    return s;
  }
}
