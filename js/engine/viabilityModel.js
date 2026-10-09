// ============================================================================
// ColdGuard - Vaccine Viability Estimation Engine
// Illustrative Kinetic Degradation & Thermal Exposure Model
// ============================================================================

export class ViabilityModel {
  /**
   * Estimates remaining vaccine viability based on environmental exposure history.
   * Uses an Arrhenius-inspired exponential decay approximation tuned for biologics.
   * NOTE: "Simulation Estimate — Not Clinically Validated"
   */
  static estimateViability(shipment, categoryProfile) {
    const profile = categoryProfile || {
      minTemp: shipment.minAllowedTemperature,
      maxTemp: shipment.maxAllowedTemperature,
      thermalDegradationFactor: 0.08
    };

    const initialViability = 99.8; // Baseline starting viability %
    const currentTemp = shipment.currentTemperature;
    const minTemp = profile.minTemp;
    const maxTemp = profile.maxTemp;
    const excursionDurationMins = shipment.excursionDurationMinutes || 0;
    const cumulativeHours = shipment.cumulativeThermalExposure || 0.1;
    const batteryLevel = shipment.batteryLevel || 80;
    const sensorAge = shipment.sensorDataAgeSeconds || 10;
    const kFactor = profile.thermalDegradationFactor || 0.08;

    // 1. Calculate Thermal Deviation Magnitude
    let thermalDelta = 0;
    let isFreeze = false;
    if (currentTemp > maxTemp) {
      thermalDelta = currentTemp - maxTemp;
    } else if (currentTemp < minTemp) {
      thermalDelta = minTemp - currentTemp;
      isFreeze = true;
    }

    // Freeze events for liquid biologics cause accelerated physical denaturation
    const freezePenalty = isFreeze ? 1.8 : 1.0;

    // 2. Viability Loss Calculation
    // Base loss from time in normal transit (~0.05% per hour)
    const baseTransitLoss = Math.min(1.5, (cumulativeHours * 0.06));

    // Excursion degradation: non-linear based on (delta * duration * kFactor)
    let excursionLoss = 0;
    if (excursionDurationMins > 0 && thermalDelta > 0) {
      // Exponential penalty for high thermal excursions
      const thermalIntensity = Math.pow(thermalDelta, 1.35) * freezePenalty;
      excursionLoss = (thermalIntensity * (excursionDurationMins / 60) * kFactor * 10);
    }

    // Humidity penalty if secondary packing fails (mild moisture impact)
    let humidityLoss = 0;
    if (shipment.currentHumidity > (profile.maxHumidity || 65)) {
      const humDelta = shipment.currentHumidity - (profile.maxHumidity || 65);
      humidityLoss = (humDelta * 0.03);
    }

    const totalLoss = parseFloat(Math.min(95, Math.max(0.1, (baseTransitLoss + excursionLoss + humidityLoss))).toFixed(1));
    const remainingViability = parseFloat(Math.max(5.0, (initialViability - totalLoss)).toFixed(1));

    // 3. Spoilage Probability
    // If viability drops below 80%, spoilage risk escalates rapidly
    let spoilageProbability = 0;
    if (remainingViability >= 95.0) {
      spoilageProbability = 0.5 + (99.8 - remainingViability) * 1.2;
    } else if (remainingViability >= 90.0) {
      spoilageProbability = 7.0 + (95.0 - remainingViability) * 3.5;
    } else if (remainingViability >= 80.0) {
      spoilageProbability = 24.5 + (90.0 - remainingViability) * 5.0;
    } else {
      spoilageProbability = Math.min(99.5, 74.5 + (80.0 - remainingViability) * 2.2);
    }
    spoilageProbability = parseFloat(spoilageProbability.toFixed(1));

    // 4. Model Confidence
    // Drops if sensor data is stale, battery is low, or readings fluctuate wildly
    let confidence = 98.5;
    if (sensorAge > 60) confidence -= 5.0;
    if (sensorAge > 180) confidence -= 10.0;
    if (batteryLevel < 15) confidence -= 8.0;
    if (shipment.sensorConnectivity !== "Online") confidence -= 12.0;
    confidence = parseFloat(Math.max(65.0, Math.min(99.8, confidence)).toFixed(1));

    // 5. Risk Classification
    let riskClassification = "Low";
    if (remainingViability < 85.0 || spoilageProbability > 40.0) {
      riskClassification = "Critical";
    } else if (remainingViability < 92.0 || spoilageProbability > 18.0) {
      riskClassification = "High Risk";
    } else if (remainingViability < 96.0 || spoilageProbability > 5.0) {
      riskClassification = "Moderate";
    }

    // 6. Safe Handling Window & Time to Critical
    // Critical threshold is predefined as 80.0% viability
    let safeHandlingWindow = "Normal (> 12 hours)";
    let timeToCritical = "Stable (> 24 hours)";

    if (thermalDelta > 0) {
      const degradationRatePerMin = Math.max(0.04, (Math.pow(thermalDelta, 1.2) * kFactor * 0.25));
      const marginToCritical = Math.max(0, remainingViability - 80.0);
      const minutesToCritical = Math.round(marginToCritical / degradationRatePerMin);

      if (remainingViability <= 80.0) {
        safeHandlingWindow = "EXPIRED (Critical Threshold Reached)";
        timeToCritical = "0 mins (Viability < 80%)";
      } else if (minutesToCritical < 60) {
        safeHandlingWindow = `${minutesToCritical} minutes remaining`;
        timeToCritical = `${minutesToCritical} minutes`;
      } else {
        const hrs = Math.floor(minutesToCritical / 60);
        const mins = minutesToCritical % 60;
        safeHandlingWindow = `${hrs}h ${mins}m at current rate`;
        timeToCritical = `${hrs} hours ${mins} mins`;
      }
    }

    // 7. Projected Viability at Arrival
    // Assume 2.5 hours remaining transit on average if in transit
    const estimatedHoursRemaining = 2.5;
    let projectedLossAtArrival = totalLoss;
    if (thermalDelta > 0) {
      // If uncorrected excursion continues
      projectedLossAtArrival += (Math.pow(thermalDelta, 1.2) * estimatedHoursRemaining * kFactor * 12);
    } else {
      projectedLossAtArrival += (estimatedHoursRemaining * 0.08);
    }
    const predictedViabilityAtArrival = parseFloat(Math.max(2.0, (initialViability - projectedLossAtArrival)).toFixed(1));

    // Viability at arrival IF intervention is applied immediately (stabilized)
    const predictedViabilityIfStabilized = parseFloat(Math.max(10.0, (remainingViability - (estimatedHoursRemaining * 0.08))).toFixed(1));

    // 8. Recommended Intervention
    let recommendedIntervention = "No intervention necessary. Maintain standard temperature chain.";
    if (riskClassification === "Critical") {
      recommendedIntervention = `CRITICAL INTERVENTION: Viability degrading at elevated rate. Divert shipment to nearest certified cold vault or perform dry ice top-up within ${safeHandlingWindow}.`;
    } else if (riskClassification === "High Risk") {
      recommendedIntervention = "HIGH RISK: Contact driver to adjust refrigeration thermostat and avoid opening loading doors.";
    } else if (riskClassification === "Moderate") {
      recommendedIntervention = "PREVENTIVE: Monitor telemetry closely; verify cooling unit continuous run mode.";
    }

    return {
      estimatedRemainingViabilityPercent: remainingViability,
      estimatedViabilityLossPercent: totalLoss,
      predictedSpoilageRiskPercent: spoilageProbability,
      confidenceLevelPercent: confidence,
      riskClassification: riskClassification,
      safeHandlingWindow: safeHandlingWindow,
      timeToCriticalRisk: timeToCritical,
      predictedViabilityAtArrival: predictedViabilityAtArrival,
      predictedViabilityIfStabilized: predictedViabilityIfStabilized,
      recommendedIntervention: recommendedIntervention,
      lastPredictionUpdate: new Date().toISOString(),
      disclaimer: "Simulation Estimate — Not Clinically Validated. For demonstration and predictive risk screening only."
    };
  }

  /**
   * Generates projected time-series trajectory points for charts
   * from start of journey -> current time -> destination arrival
   */
  static generateProjectionTrajectory(shipment, viabilityEst) {
    const points = [];
    const now = Date.now();
    const currentViab = viabilityEst.estimatedRemainingViabilityPercent;
    const arrivalViab = viabilityEst.predictedViabilityAtArrival;
    const stabilizedViab = viabilityEst.predictedViabilityIfStabilized;

    // Past 6 hours (4 points)
    for (let i = 4; i >= 1; i--) {
      points.push({
        timeLabel: `-${i * 1.5}h`,
        historical: parseFloat((99.5 - (4 - i) * 0.3).toFixed(1)),
        projectedUncorrected: null,
        projectedStabilized: null,
        criticalThreshold: 80.0
      });
    }

    // Current point
    points.push({
      timeLabel: "Now",
      historical: currentViab,
      projectedUncorrected: currentViab,
      projectedStabilized: currentViab,
      criticalThreshold: 80.0
    });

    // Projected future 3 hours
    const steps = 3;
    for (let j = 1; j <= steps; j++) {
      const frac = j / steps;
      const uncorrected = currentViab - frac * (currentViab - arrivalViab);
      const stabilized = currentViab - frac * (currentViab - stabilizedViab);
      points.push({
        timeLabel: `+${j}h (Arrival)`,
        historical: null,
        projectedUncorrected: parseFloat(uncorrected.toFixed(1)),
        projectedStabilized: parseFloat(stabilized.toFixed(1)),
        criticalThreshold: 80.0
      });
    }

    return points;
  }
}
