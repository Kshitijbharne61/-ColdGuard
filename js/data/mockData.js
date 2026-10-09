// ============================================================================
// ColdGuard - Mock Data Store & Master Profiles
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================

export const VACCINE_PROFILES = {
  mrna_ultra_cold: {
    categoryName: "mRNA Ultra-Cold",
    shortCode: "mRNA-ULT",
    minTemp: -90.0,
    maxTemp: -60.0,
    warningDelta: 5.0, // alert when within 5°C of threshold
    minHumidity: 20.0,
    maxHumidity: 80.0,
    storageReq: "Ultra-Low Temperature (-80°C)",
    packaging: "Vacuum Insulated Panel (VIP) with Dry Ice",
    thermalDegradationFactor: 0.12, // Viability decay rate per minute per degree deviation
    disclaimer: "Demo storage profile based on CDC & WHO ultra-cold mRNA storage guidelines.",
    color: "#6366F1"
  },
  frozen: {
    categoryName: "Frozen (-20°C)",
    shortCode: "FRZ-20",
    minTemp: -25.0,
    maxTemp: -15.0,
    warningDelta: 2.0,
    minHumidity: 30.0,
    maxHumidity: 75.0,
    storageReq: "Standard Frozen (-20°C)",
    packaging: "Phase Change Material (PCM) Cryo-Shipper",
    thermalDegradationFactor: 0.08,
    disclaimer: "Demo storage profile for frozen biologics (-25°C to -15°C).",
    color: "#0EA5E9"
  },
  standard_cold_chain: {
    categoryName: "Standard Cold Chain (2°C - 8°C)",
    shortCode: "STD-2-8",
    minTemp: 2.0,
    maxTemp: 8.0,
    warningDelta: 0.8, // alert if > 7.2°C or < 2.8°C
    minHumidity: 35.0,
    maxHumidity: 65.0,
    storageReq: "Refrigerated (+2°C to +8°C)",
    packaging: "Qualified Passive Shipper with Frozen/Conditioned Gel Packs",
    thermalDegradationFactor: 0.05,
    disclaimer: "Demo storage profile for WHO PQS refrigerated vaccines.",
    color: "#10B981"
  },
  active_cryo: {
    categoryName: "Active Powered Cryo-Transport",
    shortCode: "ACT-CRYO",
    minTemp: -85.0,
    maxTemp: -65.0,
    warningDelta: 4.0,
    minHumidity: 15.0,
    maxHumidity: 70.0,
    storageReq: "Mobile Active Stirling Cryo-Engine",
    packaging: "Stirling Ultracold Active Compressor Shipper",
    thermalDegradationFactor: 0.14,
    disclaimer: "Demo profile for viral vector and Ebola Ervebo ultra-cold protocol.",
    color: "#8B5CF6"
  }
};

export const CHECKPOINTS = [
  {
    id: "CP-01",
    name: "Apex Biologics Regional Cryo-Depot",
    type: "Tier-1 Ultra-Cold Logistics Center",
    lat: 40.4406,
    lng: -79.9959, // Pittsburgh, PA
    city: "Pittsburgh, PA",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 185000,
    totalCapacityDoses: 350000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)", "Active Powered Cryo-Transport"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "On-site Cold Chain Specialist (Dr. M. Vance, RPh)",
    emergencyPhone: "+1 (412) 555-0192",
    dockBayAvailable: "Bays 4 & 5 (Cryo-Transfer Equipped)",
    distanceKm: 28.4,
    travelTimeMinutes: 24,
    backupGenerators: "Triple redundant diesel + microgrid"
  },
  {
    id: "CP-02",
    name: "Keystone Pharmaceutical Distribution Vault",
    type: "Pharma-Grade 3PL Certified Cold Vault",
    lat: 40.2732,
    lng: -76.8867, // Harrisburg, PA
    city: "Harrisburg, PA",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 240000,
    totalCapacityDoses: 500000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "Duty Logistics Officer (S. Chen)",
    emergencyPhone: "+1 (717) 555-0348",
    dockBayAvailable: "Bay 2 (Active Nitrogen Purge)",
    distanceKm: 64.2,
    travelTimeMinutes: 48,
    backupGenerators: "Dual 500kVA generators"
  },
  {
    id: "CP-03",
    name: "Mercy Healthcare Emergency Medical Vault",
    type: "Regional Hospital Level-1 Vaccine Pharmacy",
    lat: 40.0379,
    lng: -76.3055, // Lancaster, PA
    city: "Lancaster, PA",
    coldStorageAvailable: true,
    storageTiers: ["Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 42000,
    totalCapacityDoses: 80000,
    supportedCategories: ["Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "Operational (Standby Ready)",
    staffAvailability: "Clinical Pharmacist on call (E. Rostova)",
    emergencyPhone: "+1 (717) 555-0891",
    dockBayAvailable: "Emergency Pharmacy Receiving Dock",
    distanceKm: 18.1,
    travelTimeMinutes: 19,
    backupGenerators: "Hospital primary backup"
  },
  {
    id: "CP-04",
    name: "Buckeye Central Life Sciences Depot",
    type: "State Strategic National Stockpile Hub",
    lat: 39.9612,
    lng: -82.9988, // Columbus, OH
    city: "Columbus, OH",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 420000,
    totalCapacityDoses: 750000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)", "Active Powered Cryo-Transport"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "24/7 Biomedical Logistics Team",
    emergencyPhone: "+1 (614) 555-0723",
    dockBayAvailable: "Dock 1, 2, 3",
    distanceKm: 142.5,
    travelTimeMinutes: 98,
    backupGenerators: "Full facility N+2 redundancy"
  },
  {
    id: "CP-05",
    name: "Great Lakes BioVault & Cryo-Logistics",
    type: "Certified Regional Cryogenic Repository",
    lat: 41.4993,
    lng: -81.6944, // Cleveland, OH
    city: "Cleveland, OH",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 165000,
    totalCapacityDoses: 300000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "Cold Chain Supervisor (T. Kowalski)",
    emergencyPhone: "+1 (216) 555-0419",
    dockBayAvailable: "Bay B (Climate Controlled)",
    distanceKm: 98.7,
    travelTimeMinutes: 72,
    backupGenerators: "Redundant power & LN2 bulk tanks"
  },
  {
    id: "CP-06",
    name: "Philadelphia Metropolitan Vaccine Bank",
    type: "Metro Central Biologics Distribution Center",
    lat: 39.9526,
    lng: -75.1652, // Philadelphia, PA
    city: "Philadelphia, PA",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 310000,
    totalCapacityDoses: 600000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "Lead Bio-Logistics Specialist (D. Morales)",
    emergencyPhone: "+1 (215) 555-0955",
    dockBayAvailable: "High-Capacity Cryo Bays 7-9",
    distanceKm: 112.0,
    travelTimeMinutes: 84,
    backupGenerators: "Industrial dual generator backup"
  },
  {
    id: "CP-07",
    name: "Crossroads Midwest Pharma Storage",
    type: "Interstate Strategic Cold Storage Facility",
    lat: 39.7684,
    lng: -86.1581, // Indianapolis, IN
    city: "Indianapolis, IN",
    coldStorageAvailable: true,
    storageTiers: ["Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 95000,
    totalCapacityDoses: 180000,
    supportedCategories: ["Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "Operational (Standby Ready)",
    staffAvailability: "On-call Cold Chain Tech",
    emergencyPhone: "+1 (317) 555-0631",
    dockBayAvailable: "Dock C",
    distanceKm: 188.3,
    travelTimeMinutes: 135,
    backupGenerators: "Generator backup installed"
  },
  {
    id: "CP-08",
    name: "Allegheny Valley Healthcare Vaccine Vault",
    type: "Consortium Health System Cold Center",
    lat: 40.5845,
    lng: -79.7428, // Natrona Heights / New Kensington, PA
    city: "Allegheny Valley, PA",
    coldStorageAvailable: true,
    storageTiers: ["Standard (2-8°C)"],
    availableCapacityDoses: 35000,
    totalCapacityDoses: 50000,
    supportedCategories: ["Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "Limited Capacity",
    staffAvailability: "Duty Pharmacist",
    emergencyPhone: "+1 (724) 555-0274",
    dockBayAvailable: "Receiving Bay A",
    distanceKm: 42.0,
    travelTimeMinutes: 38,
    backupGenerators: "Standard emergency power"
  }
];

// Helper to generate a realistic sequence of sensor history timestamps
function generateSensorHistory(baseTemp, minAllowed, maxAllowed, baseHumidity, isExcursion, count = 25) {
  const history = [];
  const now = Date.now();
  const stepMs = 4 * 60 * 1000; // 4 minutes between points
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs).toISOString();
    let temp = baseTemp;
    let humidity = baseHumidity;
    let viability = 99.2 - (count - 1 - i) * 0.08;

    if (isExcursion) {
      if (i < 8) {
        // Recent points in excursion
        const overshoot = (8 - i) * 0.45;
        temp = maxAllowed + overshoot;
        viability = Math.max(76.0, 98.0 - (8 - i) * 2.8);
      } else {
        // Normal before excursion
        temp = (minAllowed + maxAllowed) / 2 + (Math.sin(i) * 0.4);
      }
    } else {
      // Normal bounded random walk
      temp = baseTemp + (Math.sin(i * 0.8) * 0.35);
      humidity = baseHumidity + (Math.cos(i * 0.7) * 1.8);
    }

    history.push({
      timestamp,
      temperature: parseFloat(temp.toFixed(2)),
      humidity: parseFloat(Math.min(99, Math.max(10, humidity)).toFixed(1)),
      viability: parseFloat(Math.max(50, Math.min(100, viability)).toFixed(1))
    });
  }
  return history;
}

export const INITIAL_SHIPMENTS = [
  {
    // 1. Critical Excursion in Progress
    id: "CG-9021-PFZ",
    vaccineName: "Comirnaty (COVID-19 BNT162b2)",
    vaccineType: "mRNA Suspension for Injection",
    vaccineCategory: "mrna_ultra_cold",
    manufacturer: "Pfizer-BioNTech Manufacturing GmbH",
    batchNumber: "PFZ-2026-X889",
    doses: 24000,
    packagingType: "Vacuum Insulated Shipper with Solid CO2",
    storageRequirement: "Ultra-Low Freezer (-90°C to -60°C)",
    priority: "Urgent",

    originFacility: "Kalamazoo Bio-Production Plant (MI)",
    currentLocation: "I-76 Mile Marker 142 near Breezewood, PA",
    destinationFacility: "Children's Hospital of Philadelphia - Central Pharmacy",
    transportVehicleId: "REEFER-TRUCK-884",
    carrierIdentifier: "CryoTrans Express (Driver: J. Gallagher)",
    departureTime: "2026-10-09T08:30:00Z",
    expectedDeliveryTime: "2026-10-09T21:45:00Z",
    status: "In Transit",
    eta: "2026-10-09T22:30:00Z (45m delay)",
    routeDistanceRemainingKm: 182.4,

    // Sensor Telemetry
    currentTemperature: -52.4, // EXCURSION! (Allowed: -90 to -60)
    minAllowedTemperature: -90.0,
    maxAllowedTemperature: -60.0,
    currentHumidity: 48.2,
    minAllowedHumidity: 20.0,
    maxAllowedHumidity: 80.0,
    gpsLatitude: 40.0152,
    gpsLongitude: -78.2384,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 78,
    dataTransmissionStatus: "Cellular LTE-M Active (4G-CatM1)",
    sensorHealth: "Operational (Calibration Valid)",
    sensorDataAgeSeconds: 12,

    // Excursion Risk
    excursionStatus: "Active Excursion",
    excursionSeverity: "Critical",
    excursionStartTime: new Date(Date.now() - 34 * 60 * 1000).toISOString(), // 34 mins ago
    excursionDurationMinutes: 34,
    temperatureDeviation: 7.6, // 7.6°C above -60°C limit
    cumulativeThermalExposure: 4.3, // Degree-Hours
    peakTemperature: -51.8,
    minimumRecordedTemperature: -78.4,
    consecutiveOutOfRangeReadings: 8,
    detectionConfidencePercent: 99.4,
    estimatedViabilityPercent: 88.5,
    predictedSpoilageRiskPercent: 32.0,
    riskClassification: "Critical",
    predictedDeliveryDelay: "+45 mins (thermal remediation stop needed)",
    recommendedNextAction: "Reroute immediately to nearest cryo-checkpoint for dry-ice re-icing.",

    nearestCheckpointId: "CP-02",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 40.4406, lng: -79.9959, name: "Pittsburgh Hub" },
      { lat: 40.0152, lng: -78.2384, name: "Current GPS (I-76 Breezewood)" },
      { lat: 40.2732, lng: -76.8867, name: "Harrisburg Transfer Point" },
      { lat: 39.9526, lng: -75.1652, name: "CHOP Philadelphia" }
    ],
    timeline: [
      { time: "08:30", severity: "safe", desc: "Shipment dispatched from Kalamazoo Hub. Seal verified." },
      { time: "10:15", severity: "safe", desc: "GPS logger locked. Initial core temp: -78.2°C. Sensor health 100%." },
      { time: "14:45", severity: "safe", desc: "Midpoint checkpoint cleared at Ohio border. Sub-zero telemetry nominal." },
      { time: "17:35", severity: "warning", desc: "Approaching threshold alert: temp rose to -61.2°C." },
      { time: "17:42", severity: "critical", desc: "CRITICAL EXCURSION DETECTED: core temp breached -60.0°C ceiling." },
      { time: "17:55", severity: "critical", desc: "Automated alert pushed to Fleet Operations & Receiving Pharmacist." },
      { time: "18:02", severity: "critical", desc: "Viability degraded to 88.5%. Nearest checkpoint identified: Keystone Vault." }
    ],
    history: generateSensorHistory(-52.4, -90.0, -60.0, 48.2, true, 28)
  },

  {
    // 2. High Risk - Approaching Upper Boundary (Standard 2-8°C)
    id: "CG-8842-AZN",
    vaccineName: "Vaxzevria (ChAdOx1-S / Recombinant)",
    vaccineType: "Viral Vector Suspension",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "AstraZeneca Biologics Ltd.",
    batchNumber: "AZ-LOT-7721",
    doses: 18500,
    packagingType: "Qualified Passive Shipper with PCM Coolant",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "High",

    originFacility: "Gaithersburg Distribution Core (MD)",
    currentLocation: "US-15 Northbound near Gettysburg, PA",
    destinationFacility: "UPMC Presbyterian Hospital Vaccine Center",
    transportVehicleId: "VAN-COLD-309",
    carrierIdentifier: "MediRoute Logistics (Driver: K. Sharma)",
    departureTime: "2026-10-09T11:00:00Z",
    expectedDeliveryTime: "2026-10-09T19:30:00Z",
    status: "In Transit",
    eta: "2026-10-09T19:15:00Z",
    routeDistanceRemainingKm: 146.0,

    // Sensor Telemetry
    currentTemperature: 7.7, // WARNING: close to 8.0°C limit
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 59.8,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 39.8283,
    gpsLongitude: -77.2311,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 89,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Operational",
    sensorDataAgeSeconds: 8,

    // Excursion Risk
    excursionStatus: "Approaching Threshold",
    excursionSeverity: "High Risk",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: -0.3, // 0.3°C below ceiling
    cumulativeThermalExposure: 0.8,
    peakTemperature: 7.7,
    minimumRecordedTemperature: 3.4,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 96.2,
    estimatedViabilityPercent: 94.8,
    predictedSpoilageRiskPercent: 14.5,
    riskClassification: "High Risk",
    predictedDelay: "None currently",
    recommendedNextAction: "Check vehicle reefer temperature setpoint; alert driver to avoid door openings.",

    nearestCheckpointId: "CP-03",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 39.1434, lng: -77.2014, name: "Gaithersburg, MD" },
      { lat: 39.8283, lng: -77.2311, name: "Current GPS (US-15 Gettysburg)" },
      { lat: 40.4406, lng: -79.9959, name: "UPMC Presbyterian" }
    ],
    timeline: [
      { time: "11:00", severity: "safe", desc: "Dispatched with validated thermal shipper and calibrated sensor." },
      { time: "14:20", severity: "safe", desc: "Temperature steady at 4.2°C. Ambient temp 24.1°C." },
      { time: "17:10", severity: "warning", desc: "Thermal drift observed: 6.8°C -> 7.4°C in 30 minutes." },
      { time: "17:50", severity: "warning", desc: "Approaching threshold limit (+7.7°C). Warning notification dispatched." }
    ],
    history: generateSensorHistory(6.5, 2.0, 8.0, 59.8, false, 25)
  },

  {
    // 3. Frozen Biologics - Safe & Nominal
    id: "CG-5510-MDN",
    vaccineName: "Spikevax (COVID-19 mRNA-1273)",
    vaccineType: "Lipid Nanoparticle Frozen mRNA",
    vaccineCategory: "frozen",
    manufacturer: "ModernaTX, Inc.",
    batchNumber: "MDN-2026-B441",
    doses: 15000,
    packagingType: "Phase Change Material (-20°C Cryo-Tote)",
    storageRequirement: "Standard Frozen (-25°C to -15°C)",
    priority: "Normal",

    originFacility: "Norwood Technical Operations (MA)",
    currentLocation: "I-80 Westbound near Bellefonte, PA",
    destinationFacility: "Cleveland Clinic Main Campus Pharmacy",
    transportVehicleId: "REEFER-UNIT-104",
    carrierIdentifier: "ColdLine Logistics (Driver: M. Kowalski)",
    departureTime: "2026-10-09T06:00:00Z",
    expectedDeliveryTime: "2026-10-09T20:00:00Z",
    status: "In Transit",
    eta: "2026-10-09T19:40:00Z",
    routeDistanceRemainingKm: 215.3,

    // Sensor Telemetry
    currentTemperature: -21.2, // SAFE (Allowed: -25 to -15)
    minAllowedTemperature: -25.0,
    maxAllowedTemperature: -15.0,
    currentHumidity: 42.1,
    minAllowedHumidity: 30.0,
    maxAllowedHumidity: 75.0,
    gpsLatitude: 40.9134,
    gpsLongitude: -77.7783,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 94,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Optimal",
    sensorDataAgeSeconds: 5,

    // Excursion Risk
    excursionStatus: "Normal Operation",
    excursionSeverity: "None",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.1,
    peakTemperature: -19.8,
    minimumRecordedTemperature: -22.8,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 99.8,
    estimatedViabilityPercent: 98.9,
    predictedSpoilageRiskPercent: 0.8,
    riskClassification: "Low",
    predictedDelay: "On Time",
    recommendedNextAction: "Continue scheduled transit; telemetry fully compliant.",

    nearestCheckpointId: "CP-05",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 42.1887, lng: -71.1964, name: "Norwood, MA" },
      { lat: 40.9134, lng: -77.7783, name: "Current GPS (I-80 Bellefonte)" },
      { lat: 41.4993, lng: -81.6944, name: "Cleveland Clinic" }
    ],
    timeline: [
      { time: "06:00", severity: "safe", desc: "Batch verified at Norwood facility. Core temp -22.1°C." },
      { time: "11:30", severity: "safe", desc: "Entering Pennsylvania toll road. Logger battery 96%." },
      { time: "15:40", severity: "safe", desc: "Continuous sub-zero reading verified. Viability 99.1%." }
    ],
    history: generateSensorHistory(-21.2, -25.0, -15.0, 42.1, false, 25)
  },

  {
    // 4. Standard Cold Chain - Humidity Warning Anomaly
    id: "CG-3304-ROT",
    vaccineName: "Rotarix (Rotavirus Vaccine Live Oral)",
    vaccineType: "Live Attenuated Human Rotavirus",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "GlaxoSmithKline Biologicals",
    batchNumber: "GSK-ROTA-9903",
    doses: 12000,
    packagingType: "Validated Styrofoam Insulated Shipper",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "Normal",

    originFacility: "Wavre Vaccine Center (US Hub Philadelphia)",
    currentLocation: "PA Turnpike near Carlisle, PA",
    destinationFacility: "Penn State Health Milton S. Hershey Medical Center",
    transportVehicleId: "VAN-EXPRESS-19",
    carrierIdentifier: "MediVan Courier (Driver: R. Patel)",
    departureTime: "2026-10-09T13:00:00Z",
    expectedDeliveryTime: "2026-10-09T17:45:00Z",
    status: "In Transit",
    eta: "2026-10-09T17:35:00Z",
    routeDistanceRemainingKm: 58.0,

    // Sensor Telemetry
    currentTemperature: 4.8, // Normal temp
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 78.4, // HUMIDITY EXCURSION! (Limit: 35% - 65%)
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 40.2014,
    gpsLongitude: -77.1889,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 82,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Warning (High Humidity Sensor)",
    sensorDataAgeSeconds: 15,

    // Excursion Risk
    excursionStatus: "Humidity Anomaly",
    excursionSeverity: "Warning",
    excursionStartTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    excursionDurationMinutes: 18,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.2,
    peakTemperature: 5.1,
    minimumRecordedTemperature: 4.2,
    consecutiveOutOfRangeReadings: 4,
    detectionConfidencePercent: 91.5,
    estimatedViabilityPercent: 96.2,
    predictedSpoilageRiskPercent: 6.8,
    riskClassification: "Moderate",
    predictedDelay: "None",
    recommendedNextAction: "Inspect packaging seal at next stop for moisture condensation or water ingress.",

    nearestCheckpointId: "CP-02",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 39.9526, lng: -75.1652, name: "Philadelphia Depot" },
      { lat: 40.2014, lng: -77.1889, name: "Current GPS (Carlisle, PA)" },
      { lat: 40.2859, lng: -76.6506, name: "Hershey Med Center" }
    ],
    timeline: [
      { time: "13:00", severity: "safe", desc: "Dispatched from Philadelphia. Humidity 52% RH." },
      { time: "16:20", severity: "warning", desc: "Humidity climbed past 65% limit to 78.4% RH. Condensation suspected." },
      { time: "16:30", severity: "warning", desc: "Secondary alert: Desiccant packet check requested." }
    ],
    history: generateSensorHistory(4.8, 2.0, 8.0, 78.4, false, 25)
  },

  {
    // 5. GPS Route Deviation & Sensor Stale Warning
    id: "CG-7719-MMR",
    vaccineName: "M-M-R II (Measles, Mumps, Rubella Vaccine)",
    vaccineType: "Live Virus Vaccine Lyophilized",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "Merck & Co., Inc.",
    batchNumber: "MRK-MMR-552",
    doses: 22000,
    packagingType: "Pallet Shipper with Thermal Blanketing",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "High",

    originFacility: "West Point Manufacturing Facility (PA)",
    currentLocation: "Off Route: Secondary Route 22 near Lewistown, PA",
    destinationFacility: "Allegheny General Hospital - Central Distribution",
    transportVehicleId: "REEFER-TRUCK-512",
    carrierIdentifier: "FastCold Transport (Driver: D. Bradley)",
    departureTime: "2026-10-09T09:15:00Z",
    expectedDeliveryTime: "2026-10-09T18:00:00Z",
    status: "In Transit",
    eta: "2026-10-09T19:10:00Z (+70m detour)",
    routeDistanceRemainingKm: 132.8,

    // Sensor Telemetry
    currentTemperature: 6.9,
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 48.0,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 40.5992,
    gpsLongitude: -77.5714,
    lastSensorUpdate: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 mins ago (stale warning)
    sensorConnectivity: "Stale Telemetry",
    batteryLevel: 41,
    dataTransmissionStatus: "Cellular Weak Signal (-112 dBm)",
    sensorHealth: "Delayed Telemetry",
    sensorDataAgeSeconds: 240,

    // Excursion Risk
    excursionStatus: "Route Deviation",
    excursionSeverity: "High Risk",
    excursionStartTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    excursionDurationMinutes: 45,
    temperatureDeviation: -1.1,
    cumulativeThermalExposure: 0.9,
    peakTemperature: 7.1,
    minimumRecordedTemperature: 3.8,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 88.0,
    estimatedViabilityPercent: 93.4,
    predictedSpoilageRiskPercent: 12.0,
    riskClassification: "High Risk",
    predictedDelay: "+70 mins detour",
    recommendedNextAction: "Contact driver immediately regarding unexpected mountain detour; verify reefer auxiliary fuel.",

    nearestCheckpointId: "CP-01",
    routeDeviationDetected: true,
    routeWaypoints: [
      { lat: 40.2104, lng: -75.3121, name: "West Point, PA" },
      { lat: 40.5992, lng: -77.5714, name: "Current GPS (Off Route Rt 22)" },
      { lat: 40.4578, lng: -80.0028, name: "Allegheny General Hospital" }
    ],
    timeline: [
      { time: "09:15", severity: "safe", desc: "Departed West Point facility on I-76 West planned route." },
      { time: "14:10", severity: "warning", desc: "GPS geofence alert: Vehicle deviated onto Route 22 North bypass." },
      { time: "16:05", severity: "warning", desc: "Cellular signal dropped; telemetry latency increased to 240 seconds." }
    ],
    history: generateSensorHistory(6.2, 2.0, 8.0, 48.0, false, 25)
  },

  {
    // 6. Active Cryo Stirling - Nominal High Value
    id: "CG-1088-ERV",
    vaccineName: "Ervebo (Ebola Zaire Live Recombinant)",
    vaccineType: "Recombinant Vesicular Stomatitis Virus",
    vaccineCategory: "active_cryo",
    manufacturer: "Merck Sharp & Dohme LLC",
    batchNumber: "ERV-2026-004",
    doses: 6000,
    packagingType: "Stirling Ultracold Active Powered Mobile Freezer",
    storageRequirement: "Ultra-Cold (-80°C to -60°C)",
    priority: "Urgent",

    originFacility: "CDC Strategic Stockpile Depot Atlanta (GA)",
    currentLocation: "I-71 Northbound near Cincinnati, OH",
    destinationFacility: "Ohio State University Wexner Medical Center",
    transportVehicleId: "SECURE-HAUL-09",
    carrierIdentifier: "BioDefense Courier (Escort Team Alpha)",
    departureTime: "2026-10-09T05:00:00Z",
    expectedDeliveryTime: "2026-10-09T18:30:00Z",
    status: "In Transit",
    eta: "2026-10-09T18:15:00Z",
    routeDistanceRemainingKm: 110.2,

    // Sensor Telemetry
    currentTemperature: -74.8, // NOMINAL (-80 to -60)
    minAllowedTemperature: -85.0,
    maxAllowedTemperature: -65.0,
    currentHumidity: 24.3,
    minAllowedHumidity: 15.0,
    maxAllowedHumidity: 70.0,
    gpsLatitude: 39.1031,
    gpsLongitude: -84.5120,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 98,
    dataTransmissionStatus: "Dual Satellite & LTE Active",
    sensorHealth: "Optimal (NIST Calibrated)",
    sensorDataAgeSeconds: 4,

    // Excursion Risk
    excursionStatus: "Normal Operation",
    excursionSeverity: "None",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.05,
    peakTemperature: -73.2,
    minimumRecordedTemperature: -76.5,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 99.9,
    estimatedViabilityPercent: 99.7,
    predictedSpoilageRiskPercent: 0.2,
    riskClassification: "Low",
    predictedDelay: "On Time",
    recommendedNextAction: "Maintain secure transit protocol; telemetry pristine.",

    nearestCheckpointId: "CP-04",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 33.7490, lng: -84.3880, name: "Atlanta SNS Depot" },
      { lat: 39.1031, lng: -84.5120, name: "Current GPS (Cincinnati, OH)" },
      { lat: 39.9992, lng: -83.0152, name: "OSU Wexner Med Center" }
    ],
    timeline: [
      { time: "05:00", severity: "safe", desc: "Biosecurity seal initialized. Active cryo engine locked at -75.0°C." },
      { time: "12:00", severity: "safe", desc: "Midpoint checkpoint cleared. Backup Stirling power cells 100%." }
    ],
    history: generateSensorHistory(-74.8, -85.0, -65.0, 24.3, false, 25)
  },

  {
    // 7. Standard Cold Chain - BCG Live Attenuated (Approaching Lower Threshold / Freeze Risk!)
    id: "CG-4419-BCG",
    vaccineName: "BCG Vaccine (Bacillus Calmette-Guérin Live)",
    vaccineType: "Live Attenuated Mycobacterium bovis",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "Serum Institute of India / Sanofi Pasteur",
    batchNumber: "BCG-902-PA",
    doses: 30000,
    packagingType: "Insulated Polyurethane Shipper with Ice Packs",
    storageRequirement: "Refrigerated (+2°C to +8°C) - DO NOT FREEZE",
    priority: "Normal",

    originFacility: "Newark International Biologics Terminal (NJ)",
    currentLocation: "I-78 Westbound near Allentown, PA",
    destinationFacility: "Geisinger Medical Center Danville (PA)",
    transportVehicleId: "REEFER-TRUCK-220",
    carrierIdentifier: "TransCold Pharma (Driver: H. Weber)",
    departureTime: "2026-10-09T10:45:00Z",
    expectedDeliveryTime: "2026-10-09T17:15:00Z",
    status: "In Transit",
    eta: "2026-10-09T17:05:00Z",
    routeDistanceRemainingKm: 88.5,

    // Sensor Telemetry - FREEZING RISK!
    currentTemperature: 2.1, // WARNING: close to 2.0°C minimum!
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 55.0,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 40.6084,
    gpsLongitude: -75.4902,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 67,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Operational",
    sensorDataAgeSeconds: 11,

    // Excursion Risk
    excursionStatus: "Approaching Threshold",
    excursionSeverity: "Warning",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.1, // only 0.1°C away from freezing breach!
    cumulativeThermalExposure: 0.4,
    peakTemperature: 4.1,
    minimumRecordedTemperature: 2.1,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 95.1,
    estimatedViabilityPercent: 97.2,
    predictedSpoilageRiskPercent: 8.4,
    riskClassification: "Moderate",
    predictedDelay: "None",
    recommendedNextAction: "FREEZE RISK DETECTED: Direct contact with frozen icepacks suspected. Warm reefer blower by +1.5°C.",

    nearestCheckpointId: "CP-03",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 40.6895, lng: -74.1745, name: "Newark Air Terminal" },
      { lat: 40.6084, lng: -75.4902, name: "Current GPS (Allentown, PA)" },
      { lat: 40.9634, lng: -76.6191, name: "Geisinger Med Center" }
    ],
    timeline: [
      { time: "10:45", severity: "safe", desc: "Shipment accepted from air freight. Core temp +4.5°C." },
      { time: "15:20", severity: "warning", desc: "Temperature dropping rapidly towards lower boundary (2.1°C)." },
      { time: "15:28", severity: "warning", desc: "Freeze alert protocol triggered: live BCG vaccine highly sensitive to freezing." }
    ],
    history: generateSensorHistory(2.4, 2.0, 8.0, 55.0, false, 25)
  },

  {
    // 8. Varicella Vaccine (Frozen -50°C to -15°C)
    id: "CG-6631-VAR",
    vaccineName: "Varivax (Varicella Virus Live Vaccine)",
    vaccineType: "Lyophilized Oka/Merck Varicella Live",
    vaccineCategory: "frozen",
    manufacturer: "Merck & Co., Inc.",
    batchNumber: "VAR-2026-90",
    doses: 10000,
    packagingType: "Deep-Freeze Qualified Dry-Ice Container",
    storageRequirement: "Frozen (-25°C to -15°C)",
    priority: "High",

    originFacility: "Durham Vaccine Production Center (NC)",
    currentLocation: "I-81 Northbound near Winchester, VA",
    destinationFacility: "Johns Hopkins Hospital Outpatient Center",
    transportVehicleId: "VAN-COLD-411",
    carrierIdentifier: "Atlantic Pharma Express (Driver: L. Gomez)",
    departureTime: "2026-10-09T07:15:00Z",
    expectedDeliveryTime: "2026-10-09T16:00:00Z",
    status: "Approaching Destination",
    eta: "2026-10-09T15:45:00Z",
    routeDistanceRemainingKm: 65.1,

    currentTemperature: -22.4,
    minAllowedTemperature: -25.0,
    maxAllowedTemperature: -15.0,
    currentHumidity: 38.5,
    minAllowedHumidity: 30.0,
    maxAllowedHumidity: 75.0,
    gpsLatitude: 39.1857,
    gpsLongitude: -78.1633,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 92,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Optimal",
    sensorDataAgeSeconds: 6,

    excursionStatus: "Normal Operation",
    excursionSeverity: "None",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.05,
    peakTemperature: -20.5,
    minimumRecordedTemperature: -23.8,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 99.5,
    estimatedViabilityPercent: 99.4,
    predictedSpoilageRiskPercent: 0.4,
    riskClassification: "Low",
    predictedDelay: "On Time",
    recommendedNextAction: "Prepare receiving freezer at Johns Hopkins Hospital.",

    nearestCheckpointId: "CP-02",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 35.9940, lng: -78.8986, name: "Durham, NC" },
      { lat: 39.1857, lng: -78.1633, name: "Current GPS (Winchester, VA)" },
      { lat: 39.2965, lng: -76.5927, name: "Johns Hopkins Baltimore" }
    ],
    timeline: [
      { time: "07:15", severity: "safe", desc: "Pre-conditioned cold pack verification passed." },
      { time: "12:00", severity: "safe", desc: "Virginia transit on schedule. Core temp -22.4°C." }
    ],
    history: generateSensorHistory(-22.4, -25.0, -15.0, 38.5, false, 25)
  },

  {
    // 9. HPV Gardasil 9 (Standard 2-8°C, Nominal)
    id: "CG-1205-HPV",
    vaccineName: "Gardasil 9 (Recombinant Human Papillomavirus)",
    vaccineType: "9-valent Purified Virus-Like Particles",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "Merck Sharp & Dohme LLC",
    batchNumber: "G9-8812-US",
    doses: 25000,
    packagingType: "Pallet Shipper with Continuous Temperature Logger",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "Normal",

    originFacility: "Elkton Operations Center (VA)",
    currentLocation: "I-95 Northbound near Wilmington, DE",
    destinationFacility: "New York-Presbyterian Hospital Central Storage",
    transportVehicleId: "REEFER-TRUCK-601",
    carrierIdentifier: "Northeast MedTrans (Driver: B. Thornton)",
    departureTime: "2026-10-09T09:00:00Z",
    expectedDeliveryTime: "2026-10-09T18:00:00Z",
    status: "In Transit",
    eta: "2026-10-09T17:40:00Z",
    routeDistanceRemainingKm: 165.0,

    currentTemperature: 4.5,
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 46.2,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 39.7447,
    gpsLongitude: -75.5484,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 88,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Optimal",
    sensorDataAgeSeconds: 9,

    excursionStatus: "Normal Operation",
    excursionSeverity: "None",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.1,
    peakTemperature: 5.2,
    minimumRecordedTemperature: 3.9,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 99.2,
    estimatedViabilityPercent: 99.1,
    predictedSpoilageRiskPercent: 0.6,
    riskClassification: "Low",
    predictedDelay: "On Time",
    recommendedNextAction: "Nominal transit progress; no intervention required.",

    nearestCheckpointId: "CP-06",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 38.4079, lng: -78.6256, name: "Elkton, VA" },
      { lat: 39.7447, lng: -75.5484, name: "Current GPS (Wilmington, DE)" },
      { lat: 40.7128, lng: -74.0060, name: "NY-Presbyterian Hospital" }
    ],
    timeline: [
      { time: "09:00", severity: "safe", desc: "Batch loaded and sealed in temperature-controlled trailer." },
      { time: "14:15", severity: "safe", desc: "Toll plaza check: 4.5°C steady." }
    ],
    history: generateSensorHistory(4.5, 2.0, 8.0, 46.2, false, 25)
  },

  {
    // 10. Low Battery Sensor Warning (Sensor approaching offline)
    id: "CG-2290-RAB",
    vaccineName: "RabAvert (Rabies Vaccine Human Pre/Post-exposure)",
    vaccineType: "Inactivated Purified Chick Embryo Cell",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "Bavarian Nordic A/S",
    batchNumber: "BN-RAB-304",
    doses: 8000,
    packagingType: "Insulated Box with Dual Real-Time Telemetry",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "Urgent",

    originFacility: "Morrisville Packaging Logistics (NC)",
    currentLocation: "I-77 North near Charleston, WV",
    destinationFacility: "Cleveland MetroHealth Medical Center",
    transportVehicleId: "EXPEDITE-SPRINTER-12",
    carrierIdentifier: "Apex Critical Logistics (Driver: A. Brooks)",
    departureTime: "2026-10-09T08:00:00Z",
    expectedDeliveryTime: "2026-10-09T16:30:00Z",
    status: "In Transit",
    eta: "2026-10-09T16:15:00Z",
    routeDistanceRemainingKm: 195.4,

    currentTemperature: 5.2,
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 51.0,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 38.3498,
    gpsLongitude: -81.6326,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Low Battery",
    batteryLevel: 9, // SENSOR BATTERY WARNING!
    dataTransmissionStatus: "Cellular Power-Saving Mode",
    sensorHealth: "Battery Low (9% remaining)",
    sensorDataAgeSeconds: 19,

    excursionStatus: "Normal Operation",
    excursionSeverity: "Warning",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.15,
    peakTemperature: 5.6,
    minimumRecordedTemperature: 4.8,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 84.0,
    estimatedViabilityPercent: 98.7,
    predictedSpoilageRiskPercent: 1.2,
    riskClassification: "Moderate",
    predictedDelay: "On Time",
    recommendedNextAction: "Sensor logger battery critically low (<10%). Swap backup logger probe at next driver rest stop.",

    nearestCheckpointId: "CP-05",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 35.8235, lng: -78.8256, name: "Morrisville, NC" },
      { lat: 38.3498, lng: -81.6326, name: "Current GPS (Charleston, WV)" },
      { lat: 41.4687, lng: -81.6912, name: "Cleveland MetroHealth" }
    ],
    timeline: [
      { time: "08:00", severity: "safe", desc: "High priority rabies vaccine package handed over to dedicated courier." },
      { time: "13:40", severity: "warning", desc: "Telemetry logger reported rapid battery drain down to 9%." }
    ],
    history: generateSensorHistory(5.2, 2.0, 8.0, 51.0, false, 25)
  },

  {
    // 11. Delivered Shipment (Historical Reference)
    id: "CG-9801-HEP",
    vaccineName: "Engerix-B (Hepatitis B Vaccine Recombinant)",
    vaccineType: "Hepatitis B Surface Antigen (HBsAg)",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "GlaxoSmithKline Biologicals",
    batchNumber: "GSK-HEP-411",
    doses: 40000,
    packagingType: "Heavy Thermal Pallet Shipper",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "Normal",

    originFacility: "King of Prussia Cold Depot (PA)",
    currentLocation: "Delivered to Dock Bay 3",
    destinationFacility: "Temple University Hospital Pharmacy",
    transportVehicleId: "REEFER-TRUCK-109",
    carrierIdentifier: "MediRoute Express",
    departureTime: "2026-10-09T06:00:00Z",
    expectedDeliveryTime: "2026-10-09T10:30:00Z",
    status: "Delivered",
    eta: "Delivered at 10:14:00Z",
    routeDistanceRemainingKm: 0.0,

    currentTemperature: 4.1,
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 44.5,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 40.0041,
    gpsLongitude: -75.1556,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Dock Synced",
    batteryLevel: 91,
    dataTransmissionStatus: "Dock WiFi Synchronized",
    sensorHealth: "Batch Certified Delivered",
    sensorDataAgeSeconds: 2,

    excursionStatus: "Normal Operation",
    excursionSeverity: "None",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0.0,
    cumulativeThermalExposure: 0.02,
    peakTemperature: 4.8,
    minimumRecordedTemperature: 3.5,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 100.0,
    estimatedViabilityPercent: 99.8,
    predictedSpoilageRiskPercent: 0.0,
    riskClassification: "Low",
    predictedDelay: "Delivered Ahead of Time",
    recommendedNextAction: "Shipment accepted and verified by Lead Hospital Pharmacist. Cold chain integrity intact.",

    nearestCheckpointId: "CP-06",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 40.0901, lng: -75.3854, name: "King of Prussia Depot" },
      { lat: 40.0041, lng: -75.1556, name: "Temple University Hospital" }
    ],
    timeline: [
      { time: "06:00", severity: "safe", desc: "Dispatched from King of Prussia warehouse." },
      { time: "10:14", severity: "safe", desc: "Dock delivery completed; physical temp assay passed at 4.1°C." }
    ],
    history: generateSensorHistory(4.1, 2.0, 8.0, 44.5, false, 25)
  },

  {
    // 12. Rerouted Emergency Shipment
    id: "CG-7102-PFZ",
    vaccineName: "Comirnaty XBB.1.5 (mRNA Vaccine)",
    vaccineType: "mRNA Suspension Ultra-Cold",
    vaccineCategory: "mrna_ultra_cold",
    manufacturer: "Pfizer-BioNTech Manufacturing GmbH",
    batchNumber: "PFZ-XBB-2026",
    doses: 18000,
    packagingType: "Stirling Active Cryo-Tote",
    storageRequirement: "Ultra-Low Freezer (-90°C to -60°C)",
    priority: "Urgent",

    originFacility: "St. Louis Distribution Hub (MO)",
    currentLocation: "Rerouted to Apex Cryo-Depot (Arrival in 12m)",
    destinationFacility: "Apex Biologics Regional Cryo-Depot (Reroute Facility)",
    transportVehicleId: "CRYO-SPRINTER-04",
    carrierIdentifier: "CryoTrans Priority (Driver: T. Reynolds)",
    departureTime: "2026-10-09T04:30:00Z",
    expectedDeliveryTime: "2026-10-09T18:00:00Z",
    status: "Emergency Rerouting",
    eta: "2026-10-09T18:25:00Z",
    routeDistanceRemainingKm: 14.2,

    currentTemperature: -58.9, // Warning excursion
    minAllowedTemperature: -90.0,
    maxAllowedTemperature: -60.0,
    currentHumidity: 41.0,
    minAllowedHumidity: 20.0,
    maxAllowedHumidity: 80.0,
    gpsLatitude: 40.4121,
    gpsLongitude: -80.0412,
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Online",
    batteryLevel: 62,
    dataTransmissionStatus: "Cellular 4G LTE Active",
    sensorHealth: "Operational",
    sensorDataAgeSeconds: 14,

    excursionStatus: "Active Excursion",
    excursionSeverity: "High Risk",
    excursionStartTime: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    excursionDurationMinutes: 22,
    temperatureDeviation: 1.1,
    cumulativeThermalExposure: 1.4,
    peakTemperature: -57.8,
    minimumRecordedTemperature: -74.2,
    consecutiveOutOfRangeReadings: 5,
    detectionConfidencePercent: 98.2,
    estimatedViabilityPercent: 91.2,
    predictedSpoilageRiskPercent: 18.5,
    riskClassification: "High Risk",
    predictedDelay: "Emergency diversion in progress",
    recommendedNextAction: "Emergency protocol active: vehicle docking in 12 mins for liquid nitrogen replenish.",

    nearestCheckpointId: "CP-01",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 38.6270, lng: -90.1994, name: "St. Louis Hub" },
      { lat: 40.4121, lng: -80.0412, name: "Current GPS (Pittsburgh outskirts)" },
      { lat: 40.4406, lng: -79.9959, name: "Apex Cryo Depot (Reroute destination)" }
    ],
    timeline: [
      { time: "04:30", severity: "safe", desc: "Dispatched from St. Louis Hub." },
      { time: "16:40", severity: "warning", desc: "Cooling unit compressor pressure drop detected." },
      { time: "17:15", severity: "critical", desc: "Core temp rose above -60°C. ColdGuard auto-calculated nearest hub." },
      { time: "17:22", severity: "safe", desc: "Emergency reroute executed to Apex Cryo-Depot (CP-01)." }
    ],
    history: generateSensorHistory(-58.9, -90.0, -60.0, 41.0, true, 26)
  }
];

export const WHO_AUDIT_STANDARDS = {
  standardName: "WHO Technical Report Series No. 961, Annex 9 / PQS E006",
  complianceStatement: "Model guideline for the storage and transport of time- and temperature-sensitive pharmaceutical products (TTSPPs).",
  guidelineLimits: {
    ultraCold: "Continuous recording every 5 minutes. Alarm triggered if > -60°C for > 15 minutes.",
    frozen: "Continuous recording every 5 minutes. Alarm triggered if > -15°C for > 30 minutes.",
    standardRefrigerated: "Continuous recording every 5 minutes. Alarm triggered if > +8°C or < +2°C for > 20 minutes."
  }
};
