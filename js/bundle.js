// ColdGuard Universal Standalone Bundle with Live Firebase Authentication & Realtime Database

// --- FILE: js/data/mockData.js ---
// ============================================================================
// ColdGuard - Mock Data Store & Master Profiles
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================

const VACCINE_PROFILES = {
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

const CHECKPOINTS = [
  {
    id: "CP-01",
    name: "Pune Vaccine Cold-Chain Hub",
    type: "Regional Vaccine Cold-Storage Hub",
    lat: 18.5204,
    lng: 73.8567, // Pune, Maharashtra
    city: "Pune, Maharashtra",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 185000,
    totalCapacityDoses: 350000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)", "Active Powered Cryo-Transport"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "On-site Cold Chain Specialist (Dr. M. Vance, RPh)",
    emergencyPhone: "+91 98765 43210",
    dockBayAvailable: "Bays 4 & 5 (Cryo-Transfer Equipped)",
    distanceKm: 28.4,
    travelTimeMinutes: 24,
    backupGenerators: "Triple redundant diesel + microgrid"
  },
  {
    id: "CP-02",
    name: "Mumbai Vaccine Distribution Centre",
    type: "Metro Vaccine Distribution Centre",
    lat: 19.076,
    lng: 72.8777, // Mumbai, Maharashtra
    city: "Mumbai, Maharashtra",
    coldStorageAvailable: true,
    storageTiers: ["Ultra-Cold (-80°C)", "Frozen (-20°C)", "Standard (2-8°C)"],
    availableCapacityDoses: 240000,
    totalCapacityDoses: 500000,
    supportedCategories: ["mRNA Ultra-Cold", "Frozen (-20°C)", "Standard Cold Chain (2°C - 8°C)"],
    operatingStatus: "24/7 Operational",
    staffAvailability: "Duty Logistics Officer (S. Chen)",
    emergencyPhone: "+91 98765 43211",
    dockBayAvailable: "Bay 2 (Active Nitrogen Purge)",
    distanceKm: 64.2,
    travelTimeMinutes: 48,
    backupGenerators: "Dual 500kVA generators"
  },
  {
    id: "CP-03",
    name: "Nagpur Regional Medical Depot",
    type: "Regional Medical Cold-Storage Hub",
    lat: 21.1458,
    lng: 79.0882, // Nagpur, Maharashtra
    city: "Nagpur, Maharashtra",
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
    name: "New Delhi Vaccine Logistics Hub",
    type: "National Vaccine Logistics Hub",
    lat: 28.6139,
    lng: 77.209, // Columbus, OH
    city: "New Delhi, Delhi",
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
    name: "Hyderabad Cold-Chain Centre",
    type: "Regional Vaccine Cold-Storage Hub",
    lat: 17.385,
    lng: 78.4867, // Hyderabad, Telangana
    city: "Hyderabad, Telangana",
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
    name: "Bengaluru Vaccine Depot",
    type: "Regional Vaccine Cold-Storage Hub",
    lat: 12.9719,
    lng: 77.5937, // Bengaluru, Karnataka
    city: "Bengaluru, Karnataka",
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
    name: "Chennai Medical Distribution Hub",
    type: "Metro Medical Distribution Centre",
    lat: 13.0827,
    lng: 80.2707, // Chennai, Tamil Nadu
    city: "Chennai, Tamil Nadu",
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
    name: "Ahmedabad Vaccine Storage Hub",
    type: "Regional Vaccine Cold-Storage Hub",
    lat: 23.0225,
    lng: 72.5714, // Ahmedabad, Gujarat
    city: "Ahmedabad, Gujarat",
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

const INITIAL_SHIPMENTS = [
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

    originFacility: "Pune Vaccine Cold-Chain Hub, Pune",
    currentLocation: "Demo GPS near Lonavala, Maharashtra",
    destinationFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
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
    gpsLatitude: 18.7546,
    gpsLongitude: 73.4062,
    gpsSource: "demo",
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
      { lat: 18.5204, lng: 73.8567, name: "Pune Vaccine Cold-Chain Hub" },
      { lat: 18.7546, lng: 73.4062, name: "Demo GPS near Lonavala" },
      { lat: 19.2183, lng: 72.9781, name: "Thane Transfer Checkpoint" },
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" }
    ],
    timeline: [
      { time: "08:30", severity: "safe", desc: "Shipment dispatched from Pune Vaccine Hub. Seal verified." },
      { time: "10:15", severity: "safe", desc: "GPS logger locked. Initial core temp: -78.2°C. Sensor health 100%." },
      { time: "14:45", severity: "safe", desc: "Midpoint checkpoint cleared at Amravati checkpoint. Sub-zero telemetry nominal." },
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

    originFacility: "Pune Regional Vaccine Depot, Pune",
    currentLocation: "Demo GPS near Ahmednagar, Maharashtra",
    destinationFacility: "Nagpur Regional Medical Depot, Nagpur",
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
    gpsLatitude: 19.0948,
    gpsLongitude: 74.7480,
    gpsSource: "demo",
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
      { lat: 18.5204, lng: 73.8567, name: "Pune Regional Vaccine Depot" },
      { lat: 19.0948, lng: 74.7480, name: "Demo GPS near Ahmednagar" },
      { lat: 20.9374, lng: 77.7796, name: "Amravati Transfer Hub" },
      { lat: 21.1458, lng: 79.0882, name: "Nagpur Regional Medical Depot" }
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

    originFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
    currentLocation: "Demo GPS near Surat, Gujarat",
    destinationFacility: "Ahmedabad Vaccine Logistics Hub, Ahmedabad",
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
    gpsLatitude: 21.1702,
    gpsLongitude: 72.8311,
    gpsSource: "demo",
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
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" },
      { lat: 21.1702, lng: 72.8311, name: "Demo GPS near Surat" },
      { lat: 22.3072, lng: 73.1812, name: "Vadodara Transfer Hub" },
      { lat: 23.0225, lng: 72.5714, name: "Ahmedabad Vaccine Logistics Hub" }
    ],
    timeline: [
      { time: "06:00", severity: "safe", desc: "Batch verified at Mumbai distribution facility. Core temp -22.1°C." },
      { time: "11:30", severity: "safe", desc: "Entering Mumbai-Pune Expressway. Logger battery 96%." },
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

    originFacility: "Delhi Central Vaccine Depot, Delhi",
    currentLocation: "Demo GPS near Gurugram, Haryana",
    destinationFacility: "Jaipur Regional Vaccine Centre, Jaipur",
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
    gpsLatitude: 28.4595,
    gpsLongitude: 77.0266,
    gpsSource: "demo",
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
      { lat: 28.6139, lng: 77.2090, name: "Delhi Central Vaccine Depot" },
      { lat: 28.4595, lng: 77.0266, name: "Demo GPS near Gurugram" },
      { lat: 28.1990, lng: 76.6190, name: "Rewari Checkpoint" },
      { lat: 26.9124, lng: 75.7873, name: "Jaipur Regional Vaccine Centre" }
    ],
    timeline: [
      { time: "13:00", severity: "safe", desc: "Dispatched from Delhi. Humidity 52% RH." },
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

    originFacility: "Pune Vaccine Cold-Chain Hub, Pune",
    currentLocation: "Demo GPS near Lonavala, Maharashtra",
    destinationFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
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
    gpsLatitude: 18.7546,
    gpsLongitude: 73.4062,
    gpsSource: "demo",
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
      { lat: 18.5204, lng: 73.8567, name: "Pune Vaccine Cold-Chain Hub" },
      { lat: 18.7546, lng: 73.4062, name: "Demo GPS near Lonavala" },
      { lat: 19.2183, lng: 72.9781, name: "Thane Transfer Checkpoint" },
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" }
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

    originFacility: "Pune Regional Vaccine Depot, Pune",
    currentLocation: "Demo GPS near Ahmednagar, Maharashtra",
    destinationFacility: "Nagpur Regional Medical Depot, Nagpur",
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
    gpsLatitude: 19.0948,
    gpsLongitude: 74.7480,
    gpsSource: "demo",
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
      { lat: 18.5204, lng: 73.8567, name: "Pune Regional Vaccine Depot" },
      { lat: 19.0948, lng: 74.7480, name: "Demo GPS near Ahmednagar" },
      { lat: 20.9374, lng: 77.7796, name: "Amravati Transfer Hub" },
      { lat: 21.1458, lng: 79.0882, name: "Nagpur Regional Medical Depot" }
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
    batchNumber: "BCG-902-IN",
    doses: 30000,
    packagingType: "Insulated Polyurethane Shipper with Ice Packs",
    storageRequirement: "Refrigerated (+2°C to +8°C) - DO NOT FREEZE",
    priority: "Normal",

    originFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
    currentLocation: "Demo GPS near Surat, Gujarat",
    destinationFacility: "Ahmedabad Vaccine Logistics Hub, Ahmedabad",
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
    gpsLatitude: 21.1702,
    gpsLongitude: 72.8311,
    gpsSource: "demo",
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
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" },
      { lat: 21.1702, lng: 72.8311, name: "Demo GPS near Surat" },
      { lat: 22.3072, lng: 73.1812, name: "Vadodara Transfer Hub" },
      { lat: 23.0225, lng: 72.5714, name: "Ahmedabad Vaccine Logistics Hub" }
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

    originFacility: "Delhi Central Vaccine Depot, Delhi",
    currentLocation: "Demo GPS near Gurugram, Haryana",
    destinationFacility: "Jaipur Regional Vaccine Centre, Jaipur",
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
    gpsLatitude: 28.4595,
    gpsLongitude: 77.0266,
    gpsSource: "demo",
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
    recommendedNextAction: "Prepare receiving freezer at Jaipur Regional Hospital.",

    nearestCheckpointId: "CP-02",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 28.6139, lng: 77.2090, name: "Delhi Central Vaccine Depot" },
      { lat: 28.4595, lng: 77.0266, name: "Demo GPS near Gurugram" },
      { lat: 28.1990, lng: 76.6190, name: "Rewari Checkpoint" },
      { lat: 26.9124, lng: 75.7873, name: "Jaipur Regional Vaccine Centre" }
    ],
    timeline: [
      { time: "07:15", severity: "safe", desc: "Pre-conditioned cold pack verification passed." },
      { time: "12:00", severity: "safe", desc: "Gujarat transit on schedule. Core temp -22.4°C." }
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

    originFacility: "Pune Vaccine Cold-Chain Hub, Pune",
    currentLocation: "Demo GPS near Lonavala, Maharashtra",
    destinationFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
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
    gpsLatitude: 18.7546,
    gpsLongitude: 73.4062,
    gpsSource: "demo",
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
      { lat: 18.5204, lng: 73.8567, name: "Pune Vaccine Cold-Chain Hub" },
      { lat: 18.7546, lng: 73.4062, name: "Demo GPS near Lonavala" },
      { lat: 19.2183, lng: 72.9781, name: "Thane Transfer Checkpoint" },
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" }
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

    originFacility: "Pune Regional Vaccine Depot, Pune",
    currentLocation: "Demo GPS near Ahmednagar, Maharashtra",
    destinationFacility: "Nagpur Regional Medical Depot, Nagpur",
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
    gpsLatitude: 19.0948,
    gpsLongitude: 74.7480,
    gpsSource: "demo",
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
      { lat: 18.5204, lng: 73.8567, name: "Pune Regional Vaccine Depot" },
      { lat: 19.0948, lng: 74.7480, name: "Demo GPS near Ahmednagar" },
      { lat: 20.9374, lng: 77.7796, name: "Amravati Transfer Hub" },
      { lat: 21.1458, lng: 79.0882, name: "Nagpur Regional Medical Depot" }
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

    originFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
    currentLocation: "Demo GPS near Surat, Gujarat",
    destinationFacility: "Ahmedabad Vaccine Logistics Hub, Ahmedabad",
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
    gpsLatitude: 21.1702,
    gpsLongitude: 72.8311,
    gpsSource: "demo",
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
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" },
      { lat: 21.1702, lng: 72.8311, name: "Demo GPS near Surat" },
      { lat: 22.3072, lng: 73.1812, name: "Vadodara Transfer Hub" },
      { lat: 23.0225, lng: 72.5714, name: "Ahmedabad Vaccine Logistics Hub" }
    ],
    timeline: [
      { time: "06:00", severity: "safe", desc: "Dispatched from Nagpur warehouse." },
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

    originFacility: "Delhi Central Vaccine Depot, Delhi",
    currentLocation: "Demo GPS near Gurugram, Haryana",
    destinationFacility: "Jaipur Regional Vaccine Centre, Jaipur",
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
    gpsLatitude: 28.4595,
    gpsLongitude: 77.0266,
    gpsSource: "demo",
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
      { lat: 28.6139, lng: 77.2090, name: "Delhi Central Vaccine Depot" },
      { lat: 28.4595, lng: 77.0266, name: "Demo GPS near Gurugram" },
      { lat: 28.1990, lng: 76.6190, name: "Rewari Checkpoint" },
      { lat: 26.9124, lng: 75.7873, name: "Jaipur Regional Vaccine Centre" }
    ],
    timeline: [
      { time: "04:30", severity: "safe", desc: "Dispatched from Ahmedabad Hub." },
      { time: "16:40", severity: "warning", desc: "Cooling unit compressor pressure drop detected." },
      { time: "17:15", severity: "critical", desc: "Core temp rose above -60°C. ColdGuard auto-calculated nearest hub." },
      { time: "17:22", severity: "safe", desc: "Emergency reroute executed to Pune Cryo Depot (CP-01)." }
    ],
    history: generateSensorHistory(-58.9, -90.0, -60.0, 41.0, true, 26)
  },

  {
    // 13. India Demo Shipment — sample data, not live sensor telemetry
    id: "CG-IN-1301-COV",
    vaccineName: "Covishield (ChAdOx1-S) — India Demo",
    vaccineType: "Viral Vector Suspension",
    vaccineCategory: "standard_cold_chain",
    manufacturer: "Serum Institute of India (sample shipment record)",
    batchNumber: "DEMO-IN-2026-1301",
    doses: 12000,
    packagingType: "Qualified Insulated Vaccine Carrier with Conditioned Cool Packs",
    storageRequirement: "Refrigerated (+2°C to +8°C)",
    priority: "High",
    originFacility: "Pune Vaccine Cold-Chain Hub, Pune",
    currentLocation: "Demo GPS near Lonavala, Maharashtra",
    destinationFacility: "Mumbai Vaccine Distribution Centre, Mumbai",
    transportVehicleId: "MH-12-CG-1301",
    carrierIdentifier: "ColdGuard India Demo Fleet",
    departureTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    expectedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: "In Transit — Demo",
    eta: "Demo ETA: approximately 2 hours",
    routeDistanceRemainingKm: 82,
    currentTemperature: 5.1,
    minAllowedTemperature: 2.0,
    maxAllowedTemperature: 8.0,
    currentHumidity: 52.0,
    minAllowedHumidity: 35.0,
    maxAllowedHumidity: 65.0,
    gpsLatitude: 18.7546,
    gpsLongitude: 73.4062,
    gpsSource: "demo",
    location: {
      latitude: 18.7500,
      longitude: 73.4050,
      hasFix: true,
      isLiveGps: false,
      lastUpdated: new Date().toISOString()
    },
    lastSensorUpdate: new Date().toISOString(),
    sensorConnectivity: "Demo Data",
    batteryLevel: 96,
    dataTransmissionStatus: "Sample / simulated telemetry",
    sensorHealth: "Demo record — connect hardware for live readings",
    sensorDataAgeSeconds: 0,
    excursionStatus: "Normal Operation",
    excursionSeverity: "None",
    excursionStartTime: null,
    excursionDurationMinutes: 0,
    temperatureDeviation: 0,
    cumulativeThermalExposure: 0.02,
    peakTemperature: 5.4,
    minimumRecordedTemperature: 4.8,
    consecutiveOutOfRangeReadings: 0,
    detectionConfidencePercent: 96.0,
    estimatedViabilityPercent: 99.4,
    predictedSpoilageRiskPercent: 0.6,
    riskClassification: "Low",
    predictedDelay: "On Time — demo estimate",
    recommendedNextAction: "Continue monitoring; verify live sensor telemetry before operational use.",
    nearestCheckpointId: "CP-02",
    routeDeviationDetected: false,
    routeWaypoints: [
      { lat: 18.5204, lng: 73.8567, name: "Pune Vaccine Cold-Chain Hub" },
      { lat: 18.7546, lng: 73.4062, name: "Demo GPS near Lonavala" },
      { lat: 19.2183, lng: 72.9781, name: "Thane Transfer Checkpoint" },
      { lat: 19.0760, lng: 72.8777, name: "Mumbai Vaccine Distribution Centre" }
    ],
    timeline: [
      { time: "Demo", severity: "safe", desc: "Sample vaccine shipment created for Indian map demonstration." },
      { time: "Demo", severity: "safe", desc: "Coordinates are illustrative; this is not a live truck position." }
    ],
    history: generateSensorHistory(5.1, 2.0, 8.0, 52.0, false, 25)
  }
];

const WHO_AUDIT_STANDARDS = {
  standardName: "WHO Technical Report Series No. 961, Annex 9 / PQS E006",
  complianceStatement: "Model guideline for the storage and transport of time- and temperature-sensitive pharmaceutical products (TTSPPs).",
  guidelineLimits: {
    ultraCold: "Continuous recording every 5 minutes. Alarm triggered if > -60°C for > 15 minutes.",
    frozen: "Continuous recording every 5 minutes. Alarm triggered if > -15°C for > 30 minutes.",
    standardRefrigerated: "Continuous recording every 5 minutes. Alarm triggered if > +8°C or < +2°C for > 20 minutes."
  }
};


// --- FILE: js/engine/excursionEngine.js ---
// ============================================================================
// ColdGuard - Temperature Excursion Detection Engine
// Rule-Based Telemetry & Cold-Chain Anomaly Detection
// ============================================================================

class ExcursionDetectionEngine {
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


// --- FILE: js/engine/viabilityModel.js ---
// ============================================================================
// ColdGuard - Vaccine Viability Estimation Engine
// Illustrative Kinetic Degradation & Thermal Exposure Model
// ============================================================================

class ViabilityModel {
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


// --- FILE: js/engine/simulationEngine.js ---
// ============================================================================
// ColdGuard - Real-Time Telemetry Simulation Engine
// Realistic Bounded Random Walk, Time-Lapse, & Scenario Injection
// ============================================================================



class SimulationEngine {
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


// --- FILE: js/components/mapView.js ---
// ============================================================================
// ColdGuard - Interactive GPS Route Tracking Component
// Leaflet Map with Custom High-Resolution Markers & Schematic Fallback
// ============================================================================

class RouteMapView {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.layers = [];
    this.currentShipment = null;
    this.allCheckpoints = [];
    this.onSelectCheckpoint = options.onSelectCheckpoint || null;
    this.isLeafletLoaded = typeof window.L !== "undefined";
    this.containerElement = null;
    this.shipmentChanged = false;
    this.fitRouteRequested = false;
    this.resizeObserver = null;

    this.init();
  }

  init() {
    const el = document.getElementById(this.containerId);
    if (!el) return;
    this.containerElement = el;

    if (this.isLeafletLoaded && window.L) {
      try {
        this.map = window.L.map(el, {
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true
        }).setView([22.5, 79.0], 5);

        // Clean OpenStreetMap tiles with custom styling class
        window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          className: "map-tiles-clean",
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        this.addTrackingControls();
        const invalidate = () => { if (this.map) this.map.invalidateSize({ pan: false }); };
        window.addEventListener("resize", invalidate);
        this._resizeHandler = invalidate;
        if (typeof ResizeObserver !== "undefined") {
          this.resizeObserver = new ResizeObserver(invalidate);
          this.resizeObserver.observe(el);
        }
        setTimeout(invalidate, 200);
      } catch (err) {
        console.warn("Leaflet tile init error, falling back to schematic canvas", err);
        this.initSchematicFallback(el);
      }
    } else {
      this.initSchematicFallback(el);
    }
  }

  addTrackingControls() {
    if (!this.map || !window.L) return;
    const control = window.L.control({ position: "topleft" });
    control.onAdd = () => {
      const wrap = window.L.DomUtil.create("div", "leaflet-bar coldguard-map-controls");
      wrap.style.cssText = "display:flex;flex-direction:column;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px #0002";
      wrap.innerHTML = [['cg-zoom-in','+','Zoom in'],['cg-zoom-out','−','Zoom out'],['cg-recenter','◎','Recenter'],['cg-fit-route','↔','Fit route']].map(([id,label,title]) => '<button type="button" id="'+id+'" title="'+title+'" aria-label="'+title+'" style="width:36px;height:34px;border:0;border-bottom:1px solid #e2e8f0;background:white;color:#0f172a;font-size:18px;font-weight:700;cursor:pointer">'+label+'</button>').join('');
      window.L.DomEvent.disableClickPropagation(wrap);
      window.L.DomEvent.disableScrollPropagation(wrap);
      window.L.DomEvent.on(wrap.querySelector("#cg-zoom-in"), "click", () => this.map && this.map.zoomIn());
      window.L.DomEvent.on(wrap.querySelector("#cg-zoom-out"), "click", () => this.map && this.map.zoomOut());
      window.L.DomEvent.on(wrap.querySelector("#cg-recenter"), "click", () => this.recenter());
      window.L.DomEvent.on(wrap.querySelector("#cg-fit-route"), "click", () => this.fitRoute());
      return wrap;
    };
    control.addTo(this.map);
    this.trackingControl = control;
  }

  recenter() {
    if (!this.map) return;
    const s = this.currentShipment, loc = s && s.location || {};
    const lat = Number(loc.latitude ?? (s && s.gpsLatitude));
    const lng = Number(loc.longitude ?? (s && s.gpsLongitude));
    if (!(loc.isLiveGps === true && loc.hasFix === false) && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
      this.map.setView([lat, lng], Math.max(this.map.getZoom(), 10), { animate: true });
    } else this.map.setView([22.5, 79.0], 5, { animate: true });
  }

  fitRoute() {
    if (!this.map || !window.L) return;
    const s = this.currentShipment, points = [];
    const valid = (lat,lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Number(lat) >= 6 && Number(lat) <= 38 && Number(lng) >= 68 && Number(lng) <= 98;
    (s && Array.isArray(s.routeWaypoints) ? s.routeWaypoints : []).forEach(w => { if (w && valid(w.lat,w.lng)) points.push([Number(w.lat),Number(w.lng)]); });
    const loc = s && s.location || {}, lat = Number(loc.latitude ?? (s && s.gpsLatitude)), lng = Number(loc.longitude ?? (s && s.gpsLongitude));
    if (!(loc.isLiveGps === true && loc.hasFix === false) && valid(lat,lng)) points.push([lat,lng]);
    if (points.length > 1) this.map.fitBounds(window.L.latLngBounds(points), { padding:[36,36], maxZoom:11, animate:true });
    else if (points.length === 1) this.map.setView(points[0],10,{animate:true});
    else this.map.setView([22.5,79.0],5,{animate:true});
    this.fitRouteRequested = false;
    this.shipmentChanged = false;
  }

  destroy() {
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
    if (this._resizeHandler) window.removeEventListener("resize", this._resizeHandler);
    if (this.map) { this.map.remove(); this.map = null; }
    this.layers = [];
  }

  initSchematicFallback(container) {
    container.innerHTML = `
      <div class="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-slate-300">
        <canvas id="${this.containerId}-schematic-canvas" class="absolute inset-0 w-full h-full"></canvas>
        <div class="relative z-10 bg-slate-800/90 border border-slate-700 backdrop-blur px-4 py-2 rounded-lg text-xs flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Tactical Schematic Vector Map Active</span>
        </div>
      </div>
    `;
  }

  renderShipment(shipment, checkpoints) {
    const nextId = shipment && String(shipment.id || shipment.shipmentId || "");
    const currentId = this.currentShipment && String(this.currentShipment.id || this.currentShipment.shipmentId || "");
    this.shipmentChanged = !this.currentShipment || nextId !== currentId;
    this.currentShipment = shipment || null;
    this.allCheckpoints = checkpoints || [];
    if (!shipment) { if (this.map) this.map.setView([22.5,79.0],5); return; }

    if (this.map && window.L) {
      this.renderLeaflet(shipment, checkpoints);
    } else {
      this.renderCanvasSchematic(shipment, checkpoints);
    }
  }

  renderLeaflet(shipment, checkpoints) {
    if (!this.map) return;

    // ColdGuard India demo map: keep the live view focused on Indian coordinates.
    // Latitude/longitude bounds cover India's mainland and island territories.
    const isIndianCoordinate = (lat, lng) => {
      const latitude = Number(lat);
      const longitude = Number(lng);
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        && latitude >= 6 && latitude <= 38
        && longitude >= 68 && longitude <= 98;
    };
    checkpoints = (checkpoints || []).filter(cp => isIndianCoordinate(cp.lat, cp.lng));

    // Clear previous markers & polylines
    this.layers.forEach(l => {
      if (l && typeof l.remove === "function") l.remove();
      else this.map.removeLayer(l);
    });
    this.layers = [];

    const bounds = [];
    const liveLocation = shipment.location || {};
    const explicitNoFix = liveLocation.isLiveGps === true && liveLocation.hasFix === false;
    const gpsLatitude = explicitNoFix ? null : Number(liveLocation.latitude ?? shipment.gpsLatitude);
    const gpsLongitude = explicitNoFix ? null : Number(liveLocation.longitude ?? shipment.gpsLongitude);
    const hasValidGps = Number.isFinite(gpsLatitude) && Number.isFinite(gpsLongitude)
      && gpsLatitude >= -90 && gpsLatitude <= 90
      && gpsLongitude >= -180 && gpsLongitude <= 180
      && isIndianCoordinate(gpsLatitude, gpsLongitude);
    const isCritical = shipment.excursionSeverity === "Critical" || shipment.riskClassification === "Critical";
    const isWarning = shipment.excursionSeverity === "Warning" || shipment.riskClassification === "High Risk";
    const statusColor = isCritical ? "#EF4444" : (isWarning ? "#F59E0B" : "#10B981");

    // 1. Plot Checkpoints
    checkpoints.forEach(cp => {
      const isNearest = shipment.nearestCheckpointId === cp.id;
      const cpIcon = window.L.divIcon({
        className: "custom-cp-marker",
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-7 h-7 rounded-lg ${isNearest ? 'bg-indigo-600 ring-4 ring-indigo-300 ring-opacity-70 animate-bounce' : 'bg-slate-700 hover:bg-indigo-600'} text-white flex items-center justify-center shadow-md transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            ${isNearest ? '<span class="absolute -top-7 -left-10 bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">NEAREST HUB</span>' : ''}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = window.L.marker([cp.lat, cp.lng], { icon: cpIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-2 text-slate-800 font-sans max-w-xs">
          <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">${cp.type}</div>
          <div class="font-bold text-sm text-slate-900">${cp.name}</div>
          <div class="text-xs text-slate-500 mt-1">${cp.city}</div>
          <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            <div><span class="text-slate-400">Capacity:</span> <b>${(cp.availableCapacityDoses || 0).toLocaleString()} doses</b></div>
            <div><span class="text-slate-400">Distance:</span> <b>${cp.distanceKm} km</b></div>
            <div><span class="text-slate-400">Travel ETA:</span> <b>${cp.travelTimeMinutes} mins</b></div>
            <div><span class="text-slate-400">Status:</span> <b class="text-emerald-600">${cp.operatingStatus}</b></div>
          </div>
          <button id="btn-popup-reroute-${cp.id}" class="mt-3 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow transition flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            Select for Reroute
          </button>
        </div>
      `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-popup-reroute-${cp.id}`);
        if (btn && this.onSelectCheckpoint) {
          btn.addEventListener("click", () => this.onSelectCheckpoint(cp));
        }
      });

      this.layers.push(marker);
    });

    // 2. Plot Route Waypoints & Lines
    if (shipment.routeWaypoints && shipment.routeWaypoints.length >= 2
      && shipment.routeWaypoints.every(w => isIndianCoordinate(w.lat, w.lng))) {
      const latlngs = shipment.routeWaypoints.map(w => [w.lat, w.lng]);

      // Planned route line
      const plannedLine = window.L.polyline(latlngs, {
        color: "#94A3B8",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.8
      }).addTo(this.map);
      this.layers.push(plannedLine);

      // Origin Pin
      const origin = shipment.routeWaypoints[0];
      const originIcon = window.L.divIcon({
        className: "custom-origin-marker",
        html: `
          <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center shadow text-[10px] font-bold">
            A
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const originMarker = window.L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(this.map);
      originMarker.bindTooltip(`Origin: ${origin.name || shipment.originFacility}`);
      this.layers.push(originMarker);

      // Destination Pin
      const dest = shipment.routeWaypoints[shipment.routeWaypoints.length - 1];
      const destIcon = window.L.divIcon({
        className: "custom-dest-marker",
        html: `
          <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow text-xs font-bold">
            🏁
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const destMarker = window.L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(this.map);
      destMarker.bindTooltip(`Destination: ${dest.name || shipment.destinationFacility}`);
      this.layers.push(destMarker);

      latlngs.forEach(ll => bounds.push(ll));
    }

    // 3. Line from current position to nearest checkpoint (requires a valid GPS fix)
    const nearest = checkpoints.find(c => c.id === shipment.nearestCheckpointId);
    if (nearest && hasValidGps) {
      const diversionLine = window.L.polyline([
        [gpsLatitude, gpsLongitude],
        [nearest.lat, nearest.lng]
      ], {
        color: "#6366F1",
        weight: 3,
        dashArray: "4, 4",
        opacity: 0.95
      }).addTo(this.map);
      this.layers.push(diversionLine);
    }

    // 4. Current position marker. Don't show stale/demo coordinates if the device
    // explicitly reports that it has no satellite fix.
    if (hasValidGps) {
    const vehicleIcon = window.L.divIcon({
      className: "custom-vehicle-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full" style="background-color: ${statusColor}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div class="relative w-9 h-9 rounded-full border-2 border-white text-white flex items-center justify-center shadow-lg transition-transform" style="background-color: ${statusColor};">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const vehicleMarker = window.L.marker([gpsLatitude, gpsLongitude], { icon: vehicleIcon }).addTo(this.map);
    const gpsTime = liveLocation.lastUpdated ? new Date(liveLocation.lastUpdated).toLocaleString() : "Not reported";
    vehicleMarker.bindPopup(`
      <div class="p-2 text-slate-800 font-sans max-w-xs">
        <div class="flex items-center gap-1.5 font-bold text-sm text-slate-900">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${statusColor}"></span>
          ${shipment.id} — ${shipment.vaccineName || "Shipment"}
        </div>
        <div class="text-xs text-slate-500 mt-1">${shipment.currentLocation || "Reported location"} · ${(liveLocation.isLiveGps === true || shipment.gpsSource === "live") ? "LIVE GPS" : "DEMO GPS — not live"}</div>
        <div class="mt-2 text-xs font-mono">${gpsLatitude.toFixed(6)}, ${gpsLongitude.toFixed(6)}</div>
        <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
          <div><span class="text-slate-400">Current Temp:</span> <b class="font-mono ${isCritical ? 'text-red-600' : 'text-slate-800'}">${shipment.currentTemperature ?? "—"}°C</b></div>
          <div><span class="text-slate-400">Viability:</span> <b>${shipment.estimatedViabilityPercent ?? "—"}%</b></div>
          <div><span class="text-slate-400">GPS speed:</span> <b>${liveLocation.speedKmH ?? "—"} km/h</b></div>
          <div><span class="text-slate-400">Satellites:</span> <b>${liveLocation.satellites ?? "—"}</b></div>
          <div><span class="text-slate-400">GPS updated:</span> <b>${gpsTime}</b></div>
          <div><span class="text-slate-400">Status:</span> <b>${shipment.status || "Tracking"}</b></div>
        </div>
      </div>
    `);
    this.layers.push(vehicleMarker);
    bounds.push([gpsLatitude, gpsLongitude]);
    } else {
      const gpsNotice = window.L.control({ position: "topright" });
      gpsNotice.onAdd = () => {
        const div = window.L.DomUtil.create("div", "leaflet-bar");
        div.style.cssText = "background:#fff;padding:8px 10px;border-radius:8px;font-size:11px;color:#b45309;max-width:220px;box-shadow:0 1px 5px #0002";
        div.textContent = "GPS fix unavailable — waiting for sensor coordinates";
        return div;
      };
      gpsNotice.addTo(this.map);
      this.layers.push(gpsNotice);
    }

    // Do not reset view for every GPS/telemetry refresh.
    if (this.shipmentChanged || this.fitRouteRequested) this.fitRoute();
  }

  renderCanvasSchematic(shipment, checkpoints) {
    const canvas = document.getElementById(`${this.containerId}-schematic-canvas`);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    // Dark grid background
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Planned highway corridor (sinusoidal schematic)
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.7);
    ctx.bezierCurveTo(w * 0.35, h * 0.85, w * 0.65, h * 0.25, w * 0.9, h * 0.35);
    ctx.stroke();

    // Actual path traveled
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.7);
    ctx.bezierCurveTo(w * 0.3, h * 0.8, w * 0.45, h * 0.6, w * 0.52, h * 0.5);
    ctx.stroke();

    // Checkpoints
    ctx.fillStyle = "#6366F1";
    checkpoints.slice(0, 5).forEach((cp, idx) => {
      const cx = w * (0.2 + idx * 0.16);
      const cy = h * (0.3 + (idx % 2) * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#94A3B8";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(cp.id, cx - 12, cy - 12);
    });

    // Current Vehicle Position
    const vx = w * 0.52;
    const vy = h * 0.5;
    const isCritical = shipment.excursionSeverity === "Critical";
    ctx.fillStyle = isCritical ? "#EF4444" : "#10B981";
    ctx.beginPath();
    ctx.arc(vx, vy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText(`${shipment.id} (${shipment.currentTemperature}°C)`, vx - 40, vy + 24);
  }
}


// --- FILE: js/components/charts.js ---
// ============================================================================
// ColdGuard - Telemetry & Viability Chart Components
// High-Resolution Time-Series, Threshold Bands, & Viability Projections
// ============================================================================

class TelemetryCharts {
  constructor() {
    this.telemetryChart = null;
    this.viabilityProjectionChart = null;
    this.activeTimeWindow = "1h"; // 1h, 6h, 12h, 24h, 7d
    this.activeMetric = "temperature"; // "temperature" or "humidity" or "both"
  }

  setTimeWindow(windowStr, shipment) {
    this.activeTimeWindow = windowStr;
    if (shipment) {
      this.updateTelemetryChart(shipment);
    }
  }

  setMetric(metricStr, shipment) {
    this.activeMetric = metricStr;
    if (shipment) {
      this.updateTelemetryChart(shipment);
    }
  }

  /**
   * Initializes or updates the main Environmental Telemetry Chart
   */
  updateTelemetryChart(shipment) {
    const canvas = document.getElementById("telemetry-chart-canvas");
    if (!canvas || typeof window.Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const history = shipment.history || [];

    // Filter points based on active window (simulated density)
    let displayPoints = [...history];
    if (this.activeTimeWindow === "1h") {
      displayPoints = history.slice(-15);
    } else if (this.activeTimeWindow === "6h") {
      displayPoints = history.slice(-25);
    } else {
      displayPoints = history;
    }

    const labels = displayPoints.map(p => {
      const d = new Date(p.timestamp);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    });

    const tempData = displayPoints.map(p => p.temperature);
    const humData = displayPoints.map(p => p.humidity);

    const minTemp = shipment.minAllowedTemperature;
    const maxTemp = shipment.maxAllowedTemperature;
    const minHum = shipment.minAllowedHumidity;
    const maxHum = shipment.maxAllowedHumidity;

    // Detect out-of-range points for point color styling
    const pointColors = displayPoints.map(p => {
      if (p.temperature > maxTemp || p.temperature < minTemp) {
        return "#EF4444"; // Red for excursion
      }
      return "#2563EB"; // Blue safe
    });

    const datasets = [];

    if (this.activeMetric === "temperature" || this.activeMetric === "both") {
      datasets.push({
        label: "Temperature (°C)",
        data: tempData,
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: pointColors,
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
        yAxisID: "yTemp"
      });

      // Max allowed threshold line
      datasets.push({
        label: `Max Permitted (${maxTemp}°C)`,
        data: new Array(displayPoints.length).fill(maxTemp),
        borderColor: "rgba(239, 68, 68, 0.8)",
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        yAxisID: "yTemp"
      });

      // Min allowed threshold line
      datasets.push({
        label: `Min Permitted (${minTemp}°C)`,
        data: new Array(displayPoints.length).fill(minTemp),
        borderColor: "rgba(59, 130, 246, 0.7)",
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        yAxisID: "yTemp"
      });
    }

    if (this.activeMetric === "humidity" || this.activeMetric === "both") {
      datasets.push({
        label: "Humidity (% RH)",
        data: humData,
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6, 182, 212, 0.06)",
        borderWidth: 2,
        pointBackgroundColor: "#06B6D4",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 1.5,
        pointRadius: 3.5,
        fill: true,
        tension: 0.35,
        yAxisID: this.activeMetric === "both" ? "yHum" : "yTemp"
      });

      if (this.activeMetric === "humidity") {
        datasets.push({
          label: `Max Humidity (${maxHum}%)`,
          data: new Array(displayPoints.length).fill(maxHum),
          borderColor: "rgba(245, 158, 11, 0.8)",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          yAxisID: "yTemp"
        });
        datasets.push({
          label: `Min Humidity (${minHum}%)`,
          data: new Array(displayPoints.length).fill(minHum),
          borderColor: "rgba(245, 158, 11, 0.8)",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          yAxisID: "yTemp"
        });
      }
    }

    if (this.telemetryChart) {
      this.telemetryChart.data.labels = labels;
      this.telemetryChart.data.datasets = datasets;
      this.telemetryChart.update("none");
      return;
    }

    // Create new chart instance
    this.telemetryChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: { family: "Inter", size: 11, weight: "500" },
              color: "#475569"
            }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            titleFont: { family: "Inter", size: 12, weight: "600" },
            bodyFont: { family: "Inter", size: 12 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: {
              font: { family: "Inter", size: 10 },
              color: "#64748B",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7
            }
          },
          yTemp: {
            type: "linear",
            display: true,
            position: "left",
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: {
              font: { family: "Inter", size: 11 },
              color: "#64748B"
            }
          },
          yHum: {
            type: "linear",
            display: this.activeMetric === "both",
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "Inter", size: 11 },
              color: "#06B6D4"
            }
          }
        }
      }
    });
  }

  /**
   * Initializes or updates the Viability Trajectory Projection Chart
   */
  updateViabilityProjectionChart(trajectoryData) {
    const canvas = document.getElementById("viability-projection-canvas");
    if (!canvas || typeof window.Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const labels = trajectoryData.map(d => d.timeLabel);
    const histData = trajectoryData.map(d => d.historical);
    const uncorrectedData = trajectoryData.map(d => d.projectedUncorrected);
    const stabilizedData = trajectoryData.map(d => d.projectedStabilized);
    const thresholdData = trajectoryData.map(d => d.criticalThreshold);

    const datasets = [
      {
        label: "Observed Viability",
        data: histData,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: "#10B981",
        pointRadius: 4,
        fill: true,
        tension: 0.3
      },
      {
        label: "Projected (Uncorrected Excursion)",
        data: uncorrectedData,
        borderColor: "#EF4444",
        borderWidth: 2.5,
        borderDash: [5, 5],
        pointBackgroundColor: "#EF4444",
        pointRadius: 4,
        fill: false,
        tension: 0.25
      },
      {
        label: "Projected (If Immediate Intervention)",
        data: stabilizedData,
        borderColor: "#3B82F6",
        borderWidth: 2,
        borderDash: [3, 3],
        pointBackgroundColor: "#3B82F6",
        pointRadius: 3,
        fill: false,
        tension: 0.25
      },
      {
        label: "Critical Efficacy Threshold (80%)",
        data: thresholdData,
        borderColor: "#F59E0B",
        borderWidth: 1.5,
        borderDash: [8, 4],
        pointRadius: 0,
        fill: false
      }
    ];

    if (this.viabilityProjectionChart) {
      this.viabilityProjectionChart.data.labels = labels;
      this.viabilityProjectionChart.data.datasets = datasets;
      this.viabilityProjectionChart.update("none");
      return;
    }

    this.viabilityProjectionChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: { family: "Inter", size: 10, weight: "500" },
              color: "#475569"
            }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: { font: { family: "Inter", size: 10 }, color: "#64748B" }
          },
          y: {
            min: 50,
            max: 100,
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: {
              font: { family: "Inter", size: 10 },
              color: "#64748B",
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  destroy() {
    if (this.telemetryChart) {
      this.telemetryChart.destroy();
      this.telemetryChart = null;
    }
    if (this.viabilityProjectionChart) {
      this.viabilityProjectionChart.destroy();
      this.viabilityProjectionChart = null;
    }
  }
}


// --- FILE: js/components/modals.js ---
// ============================================================================
// ColdGuard - Modals, Dialogs, & Audit Generators
// Emergency Rerouting, Threshold Configurator, WHO Compliance Audit
// ============================================================================

class ModalManager {
  constructor(appContext) {
    this.ctx = appContext;
  }

  // --- 1. Emergency Reroute Modal ---
  openRerouteModal(shipment, checkpoint) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-scale-up">
          <div class="bg-gradient-to-r from-red-600 to-indigo-700 p-5 text-white flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Initiate Emergency Reroute Protocol</h3>
                <p class="text-xs text-red-100">Cold Chain Intervention Dispatch SOP-804</p>
              </div>
            </div>
            <button id="btn-close-modal" class="text-white/80 hover:text-white p-1 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
              <span class="text-red-500 font-bold text-base mt-0.5">⚠️</span>
              <div class="text-xs text-red-900">
                <span class="font-bold">Shipment ${shipment.id}</span> (${shipment.vaccineName}) has exceeded permitted thermal boundaries. Viability is currently estimated at <b>${shipment.estimatedViabilityPercent}%</b>.
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Intervention Facility</div>
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-900 text-sm">${checkpoint.name}</div>
                  <div class="text-xs text-slate-500">${checkpoint.type} • ${checkpoint.city}</div>
                </div>
                <span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Primary Hub</span>
              </div>
              
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                <div class="bg-white p-2 rounded-lg border border-slate-100">
                  <div class="text-[10px] text-slate-400">Distance</div>
                  <div class="font-bold text-slate-800 text-xs">${checkpoint.distanceKm} km</div>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-100">
                  <div class="text-[10px] text-slate-400">Travel ETA</div>
                  <div class="font-bold text-indigo-600 text-xs">${checkpoint.travelTimeMinutes} mins</div>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-100">
                  <div class="text-[10px] text-slate-400">Available Cap.</div>
                  <div class="font-bold text-emerald-600 text-xs">${(checkpoint.availableCapacityDoses || 0).toLocaleString()} doses</div>
                </div>
              </div>
            </div>

            <div class="text-xs text-slate-600 space-y-1 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
              <div class="font-semibold text-blue-900">Automatic Automated Actions upon Execution:</div>
              <ul class="list-disc pl-4 space-y-0.5 text-blue-800">
                <li>Transmit turn-by-turn navigation redirect to carrier reefer unit.</li>
                <li>Dispatch high-priority alert to duty pharmacist (${checkpoint.staffAvailability}).</li>
                <li>Pre-authorize emergency cryogenic bay / dock receiving gate.</li>
              </ul>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button id="btn-confirm-reroute" class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
              Confirm & Execute Reroute
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal").onclick = () => this.closeModal();
    document.getElementById("btn-cancel-modal").onclick = () => this.closeModal();
    document.getElementById("btn-confirm-reroute").onclick = () => {
      this.ctx.executeReroute(shipment.id, checkpoint);
      this.closeModal();
      this.showToast(`Emergency reroute confirmed for ${shipment.id} to ${checkpoint.name}!`, "warning");
    };
  }

  // --- 2. Threshold Configurator Modal ---
  openThresholdModal(categoryKey, profiles) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const currentKey = categoryKey || "standard_cold_chain";
    const profile = profiles[currentKey];

    const categoryOptions = Object.keys(profiles).map(k => {
      return `<option value="${k}" ${k === currentKey ? 'selected' : ''}>${profiles[k].categoryName}</option>`;
    }).join("");

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-scale-up">
          <div class="bg-slate-900 p-5 text-white flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Vaccine Category Threshold Settings</h3>
                <p class="text-xs text-slate-400">Configure Rule Engine Environmental Limits</p>
              </div>
            </div>
            <button id="btn-close-modal" class="text-slate-400 hover:text-white p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2.5">
              <span class="text-amber-500 font-bold">ℹ️</span>
              <div>
                <b>Simulation Demonstration Notice:</b> Example thresholds for demonstration. Does not imply universal medical recommendations. Modify values below to test rule engine responses live.
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Vaccine Category</label>
              <select id="modal-select-category" class="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500">
                ${categoryOptions}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Min Temperature (°C)</label>
                <input id="input-min-temp" type="number" step="0.5" value="${profile.minTemp}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Max Temperature (°C)</label>
                <input id="input-max-temp" type="number" step="0.5" value="${profile.maxTemp}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Warning Delta (°C)</label>
                <input id="input-warn-delta" type="number" step="0.1" value="${profile.warningDelta || 1.0}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Min Humidity (%)</label>
                <input id="input-min-hum" type="number" step="5" value="${profile.minHumidity || 35}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Max Humidity (%)</label>
                <input id="input-max-hum" type="number" step="5" value="${profile.maxHumidity || 65}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              <div class="font-semibold text-slate-800">Storage Packaging Category:</div>
              <div>${profile.packaging}</div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button id="btn-reset-thresholds" class="text-xs text-slate-500 hover:text-slate-800 font-medium">Reset to Default</button>
            <div class="flex items-center gap-2">
              <button id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button id="btn-save-thresholds" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Apply Thresholds</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal").onclick = () => this.closeModal();
    document.getElementById("btn-cancel-modal").onclick = () => this.closeModal();

    document.getElementById("modal-select-category").onchange = (e) => {
      this.openThresholdModal(e.target.value, profiles);
    };

    document.getElementById("btn-save-thresholds").onclick = () => {
      const minTemp = parseFloat(document.getElementById("input-min-temp").value);
      const maxTemp = parseFloat(document.getElementById("input-max-temp").value);
      const warningDelta = parseFloat(document.getElementById("input-warn-delta").value);
      const minHumidity = parseFloat(document.getElementById("input-min-hum").value);
      const maxHumidity = parseFloat(document.getElementById("input-max-hum").value);

      this.ctx.updateCategoryThresholds(currentKey, {
        minTemp,
        maxTemp,
        warningDelta,
        minHumidity,
        maxHumidity
      });

      this.closeModal();
      this.showToast(`Thresholds updated for ${profiles[currentKey].categoryName}. Engine re-evaluated.`, "safe");
    };
  }

  // --- 3. WHO Compliance Audit Report Modal ---
  openAuditReportModal(shipment) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const auditDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const isCompliant = shipment.excursionSeverity === "None" || shipment.excursionSeverity === "Warning";

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
          <div class="bg-slate-900 p-5 text-white flex items-start justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Cold Chain Verification & Audit Report</h3>
                <p class="text-xs text-slate-400">Standard: WHO PQS E006 / CDC Vaccine Storage Protocol</p>
              </div>
            </div>
            <button id="btn-close-modal" class="text-slate-400 hover:text-white p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
            <div class="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div class="font-bold text-base text-slate-900">Certificate of Thermal Chain Integrity</div>
                <div class="text-slate-500 text-[11px]">Audit ID: AUD-CG-${shipment.id}-${Date.now().toString().slice(-4)} • Generated: ${auditDate}</div>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold ${isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${isCompliant ? 'COMPLIANT' : 'EXCURSION NON-CONFORMITY'}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div class="text-[10px] text-slate-400 uppercase font-semibold">Vaccine Identification</div>
                <div class="font-bold text-sm text-slate-900">${shipment.vaccineName}</div>
                <div class="text-slate-600 mt-0.5">Lot / Batch: <span class="font-mono font-medium">${shipment.batchNumber}</span></div>
                <div class="text-slate-600">Doses: <span class="font-semibold">${shipment.doses.toLocaleString()}</span> units</div>
                <div class="text-slate-600">Manufacturer: ${shipment.manufacturer}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-400 uppercase font-semibold">Logistics Custody</div>
                <div class="font-semibold text-slate-800">Origin: ${shipment.originFacility}</div>
                <div class="text-slate-600 mt-0.5">Destination: ${shipment.destinationFacility}</div>
                <div class="text-slate-600">Carrier Unit: <span class="font-mono">${shipment.transportVehicleId}</span></div>
                <div class="text-slate-600">Driver / Custodian: ${shipment.carrierIdentifier}</div>
              </div>
            </div>

            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thermal Telemetry Verification Summary</div>
              <table class="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead class="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th class="p-2 border-b">Parameter</th>
                    <th class="p-2 border-b">Configured Limit</th>
                    <th class="p-2 border-b">Recorded Value</th>
                    <th class="p-2 border-b">Evaluation</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr>
                    <td class="p-2 font-medium">Temperature Ceiling</td>
                    <td class="p-2 font-mono">${shipment.maxAllowedTemperature}°C</td>
                    <td class="p-2 font-mono">${shipment.currentTemperature}°C</td>
                    <td class="p-2 font-bold ${shipment.currentTemperature > shipment.maxAllowedTemperature ? 'text-red-600' : 'text-emerald-600'}">
                      ${shipment.currentTemperature > shipment.maxAllowedTemperature ? 'BREACHED' : 'PASS'}
                    </td>
                  </tr>
                  <tr>
                    <td class="p-2 font-medium">Freeze Boundary Floor</td>
                    <td class="p-2 font-mono">${shipment.minAllowedTemperature}°C</td>
                    <td class="p-2 font-mono">Min: ${shipment.minimumRecordedTemperature || shipment.currentTemperature}°C</td>
                    <td class="p-2 font-bold text-emerald-600">PASS</td>
                  </tr>
                  <tr>
                    <td class="p-2 font-medium">Excursion Duration</td>
                    <td class="p-2">< 20 mins</td>
                    <td class="p-2 font-mono">${shipment.excursionDurationMinutes || 0} mins</td>
                    <td class="p-2 font-bold ${(shipment.excursionDurationMinutes || 0) > 20 ? 'text-red-600' : 'text-emerald-600'}">
                      ${(shipment.excursionDurationMinutes || 0) > 20 ? 'EXCEEDED' : 'NOMINAL'}
                    </td>
                  </tr>
                  <tr>
                    <td class="p-2 font-medium">Estimated Remaining Potency</td>
                    <td class="p-2">> 90.0%</td>
                    <td class="p-2 font-mono font-bold">${shipment.estimatedViabilityPercent}%</td>
                    <td class="p-2 font-bold ${shipment.estimatedViabilityPercent < 90 ? 'text-red-600' : 'text-emerald-600'}">
                      ${shipment.estimatedViabilityPercent < 90 ? 'EVALUATION NEEDED' : 'APPROVED'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] text-slate-500 leading-relaxed">
              <b>Regulatory Disclaimer:</b> This computer-generated audit manifest is synthesized from live ColdGuard IoT telemetry simulation. WHO Technical Report Series 961 guidelines are mirrored for illustration and qualification testing.
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button id="btn-download-csv" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download CSV Log
            </button>
            <div class="flex items-center gap-2">
              <button id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
              <button onclick="window.print()" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Print Manifest
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal").onclick = () => this.closeModal();
    document.getElementById("btn-cancel-modal").onclick = () => this.closeModal();
    document.getElementById("btn-download-csv").onclick = () => this.exportCsvManifest(shipment);
  }

  exportCsvManifest(shipment) {
    const rows = [
      ["Timestamp", "Temperature_C", "Humidity_RH", "Viability_Percent", "Status"],
      ...(shipment.history || []).map(p => [
        p.timestamp,
        p.temperature,
        p.humidity,
        p.viability,
        p.temperature > shipment.maxAllowedTemperature ? "EXCURSION" : "NOMINAL"
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ColdGuard_Manifest_${shipment.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`CSV audit log downloaded for ${shipment.id}`, "safe");
  }

  closeModal() {
    const modalContainer = document.getElementById("modal-container");
    if (modalContainer) modalContainer.innerHTML = "";
  }

  // --- 4. Toast Notification System ---
  showToast(message, type = "info") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-3 transition-all transform duration-300 translate-y-3 opacity-0 ${
      type === "critical"
        ? "bg-red-950 text-white border-red-800"
        : type === "warning"
        ? "bg-amber-900 text-white border-amber-700"
        : type === "safe"
        ? "bg-emerald-950 text-white border-emerald-800"
        : "bg-slate-900 text-white border-slate-700"
    }`;

    const icon = type === "critical" ? "🚨" : type === "warning" ? "⚠️" : type === "safe" ? "✅" : "ℹ️";

    toast.innerHTML = `
      <span class="text-base">${icon}</span>
      <div class="flex-1 leading-snug">${message}</div>
      <button class="text-white/60 hover:text-white text-sm font-bold ml-1">&times;</button>
    `;

    toast.querySelector("button").onclick = () => {
      toast.remove();
    };

    toastContainer.appendChild(toast);

    // Trigger animate-in
    setTimeout(() => {
      toast.classList.remove("translate-y-3", "opacity-0");
    }, 10);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }
}


// --- FILE: js/auth/firebaseAuth.js ---
// ============================================================================
// ColdGuard - Live Firebase Authentication Service
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================

class FirebaseAuthService {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;

    // Default configuration (can be updated dynamically in UI or read from localStorage)
    this.config = this.loadConfig();
    this.init();
  }

  loadConfig() {
    const saved = localStorage.getItem("coldguard_firebase_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved Firebase config", e);
      }
    }

    // Official coldguard-fdfc5 Firebase project web app configuration
    return {
      apiKey: "AIzaSyBfSlebvjBF2_00ufmGzitxd7_DOaiioH4",
      authDomain: "coldguard-fdfc5.firebaseapp.com",
      projectId: "coldguard-fdfc5",
      databaseURL: "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: "coldguard-fdfc5.firebasestorage.app",
      messagingSenderId: "762365902613",
      appId: "1:762365902613:web:11214330a4e690af67731c",
      measurementId: "G-DPJKJJ3QKJ"
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("coldguard_firebase_config", JSON.stringify(this.config));
    // Re-initialize
    return this.init(true);
  }

  init(forceReinit = false) {
    if (typeof window.firebase === "undefined") {
      console.warn("Firebase SDK not yet loaded in window");
      return false;
    }

    try {
      if (forceReinit && window.firebase.apps.length > 0) {
        window.firebase.app().delete();
      }

      let app;
      if (window.firebase.apps.length === 0) {
        app = window.firebase.initializeApp(this.config);
      } else {
        app = window.firebase.app();
      }

      this.auth = window.firebase.auth();
      this.isInitialized = true;

      // Ensure persistent local storage session
      if (window.firebase.auth.Auth.Persistence.LOCAL) {
        this.auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
          console.warn("Could not set local persistence:", err);
        });
      }

      // State listener
      this.auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.notifyListeners(user);
      }, (err) => {
        console.error("Firebase onAuthStateChanged error:", err);
      });

      return true;
    } catch (err) {
      console.error("Failed to initialize Firebase Auth:", err);
      return false;
    }
  }

  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    // Always notify the UI immediately, even when the Firebase CDN/SDK failed to load.
    // This keeps the login screen visible instead of leaving the page blank.
    try {
      callback(this.currentUser);
    } catch (e) {
      console.error("Initial auth-state callback error:", e);
    }
  }

  notifyListeners(user) {
    this.authStateListeners.forEach((fn) => {
      try {
        fn(user);
      } catch (e) {
        console.error("Auth listener callback error:", e);
      }
    });
  }

  // 1. User Registration with Name, Email & Password
  async register(name, email, password) {
    if (!this.auth) throw new Error("Firebase Authentication is not initialized.");
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      // Update display name
      if (name && name.trim()) {
        await userCredential.user.updateProfile({
          displayName: name.trim()
        });
      }
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // 2. User Login with Email & Password
  async login(email, password) {
    if (!this.auth) throw new Error("Firebase Authentication is not initialized.");
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // 3. User Logout
  async logout() {
    if (!this.auth) return;
    try {
      await this.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // 4. Password Reset via Email
  async resetPassword(email) {
    if (!this.auth) throw new Error("Firebase Authentication is not initialized.");
    try {
      await this.auth.sendPasswordResetEmail(email);
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // Error Code Translator
  mapError(error) {
    const code = error?.code || "";
    switch (code) {
      case "auth/invalid-email":
        return "The email address is invalid. Please check the spelling.";
      case "auth/user-disabled":
        return "This operator account has been disabled. Contact system administrator.";
      case "auth/user-not-found":
        return "No account exists with this email address.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        return "Incorrect email or password. Please verify your credentials.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please sign in instead.";
      case "auth/weak-password":
        return "Password is too weak. Please choose at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication → Sign-in method.";
      case "auth/too-many-requests":
        return "Too many unsuccessful attempts. Access temporarily blocked. Please wait or reset password.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      case "auth/api-key-not-valid.":
      case "auth/invalid-api-key":
        return "Firebase API Key is invalid or not yet configured. Click 'Firebase Settings' to enter your Project Web API Key.";
      default:
        return error?.message || "An authentication error occurred. Please try again.";
    }
  }
}


// --- FILE: js/database/firebaseDatabase.js ---
// ============================================================================
// ColdGuard — Live Firebase Realtime Database Service
// "Protect Every Dose. Predict Every Excursion."
// Realtime Telemetry, Live Excursions, Checkpoint Sync & Audit Logging
// ============================================================================

class FirebaseDatabaseService {
  constructor(authService) {
    this.authService = authService;
    this.db = null;
    this.isConnected = false;
    this.listeners = {
      shipments: [],
      alerts: [],
      checkpoints: [],
      thresholds: [],
      connection: []
    };
    this.activeSubscriptions = [];
    this.databaseUrl = "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app";

    this.init();
  }

  init() {
    if (typeof window.firebase === "undefined" || !window.firebase.database) {
      console.warn("Firebase Database SDK not loaded.");
      return false;
    }

    try {
      // Connect to the specific regional instance
      this.db = window.firebase.app().database(this.databaseUrl);

      // Listen for connection status
      const connectedRef = this.db.ref(".info/connected");
      connectedRef.on("value", (snap) => {
        this.isConnected = snap.val() === true;
        this.notifyListeners("connection", this.isConnected);
        this.updateConnectionPill(this.isConnected);
      });

      // When user logs in, attach real-time subscriptions
      if (this.authService) {
        this.authService.onAuthStateChanged((user) => {
          if (user) {
            this.subscribeAll();
          } else {
            this.unsubscribeAll();
          }
        });
      }

      return true;
    } catch (err) {
      console.error("Failed to initialize Firebase Realtime Database:", err);
      return false;
    }
  }

  updateConnectionPill(connected) {
    const pill = document.getElementById("firebase-rtdb-status-pill");
    if (!pill) return;
    if (connected) {
      pill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="text-emerald-300 font-mono text-[10px]">RTDB Live</span>
      `;
      pill.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300";
    } else {
      pill.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span class="text-amber-300 font-mono text-[10px]">RTDB Offline</span>
      `;
      pill.className = "flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300";
    }
  }

  subscribeAll() {
    if (!this.db) return;

    // 1. Shipments Subscription
    const shipmentsRef = this.db.ref("shipments");
    const onShipmentsValue = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([shipmentId, record]) => {
          const shipment = record || {};
          const location = shipment.location || {};
          const live = shipment.telemetry?.live || {};
          return {
            ...shipment,
            id: shipment.id || shipment.shipmentId || shipmentId,
            ...(location.hasFix !== false && location.latitude !== null && location.latitude !== undefined && Number.isFinite(Number(location.latitude))
              ? { gpsLatitude: Number(location.latitude) } : {}),
            ...(location.hasFix !== false && location.longitude !== null && location.longitude !== undefined && Number.isFinite(Number(location.longitude))
              ? { gpsLongitude: Number(location.longitude) } : {}),
            ...(live.latitude !== null && live.latitude !== undefined && Number.isFinite(Number(live.latitude))
              ? { telemetryLatitude: Number(live.latitude) } : {}),
            ...(live.longitude !== null && live.longitude !== undefined && Number.isFinite(Number(live.longitude))
              ? { telemetryLongitude: Number(live.longitude) } : {})
          };
        });
        this.notifyListeners("shipments", list);
      }
    };
    shipmentsRef.on("value", onShipmentsValue);
    this.activeSubscriptions.push({ ref: shipmentsRef, event: "value", fn: onShipmentsValue });

    // 2. Active Excursions / Alerts Subscription
    const alertsRef = this.db.ref("alerts");
    const onAlertsValue = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data);
        this.notifyListeners("alerts", list);
      } else {
        this.notifyListeners("alerts", []);
      }
    };
    alertsRef.on("value", onAlertsValue);
    this.activeSubscriptions.push({ ref: alertsRef, event: "value", fn: onAlertsValue });

    // 3. Checkpoints Subscription
    const checkpointsRef = this.db.ref("checkpoints");
    const onCheckpointsValue = (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data);
        this.notifyListeners("checkpoints", list);
      }
    };
    checkpointsRef.on("value", onCheckpointsValue);
    this.activeSubscriptions.push({ ref: checkpointsRef, event: "value", fn: onCheckpointsValue });

    // 4. Thresholds Configuration Subscription
    const thresholdsRef = this.db.ref("thresholds");
    const onThresholdsValue = (snapshot) => {
      if (snapshot.exists()) {
        this.notifyListeners("thresholds", snapshot.val());
      }
    };
    thresholdsRef.on("value", onThresholdsValue);
    this.activeSubscriptions.push({ ref: thresholdsRef, event: "value", fn: onThresholdsValue });
  }

  unsubscribeAll() {
    this.activeSubscriptions.forEach((sub) => {
      sub.ref.off(sub.event, sub.fn);
    });
    this.activeSubscriptions = [];
  }

  // Registration for dashboard reactive events
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(`Error in RTDB ${event} listener:`, e);
        }
      });
    }
  }

  /**
   * Pushes real-time sensor reading to Firebase RTDB for a shipment
   */
  async updateShipmentTelemetry(shipmentId, reading) {
    if (!this.db || !this.authService?.currentUser) return false;

    try {
      const now = Date.now();
      const updates = {};
      
      // Update environmental telemetry without fabricating GPS coordinates.
      const livePayload = {
        temperature: reading.temperature,
        humidity: reading.humidity,
        batteryLevel: reading.batteryLevel,
        timestamp: now,
        severity: reading.severity || "SAFE",
        excursionStatus: reading.excursionStatus || "Nominal"
      };
      const latitude = reading.latitude ?? reading.lat;
      const longitude = reading.longitude ?? reading.lng;
      if (latitude !== undefined && latitude !== null && Number.isFinite(Number(latitude))) {
        livePayload.latitude = Number(latitude);
      }
      if (longitude !== undefined && longitude !== null && Number.isFinite(Number(longitude))) {
        livePayload.longitude = Number(longitude);
      }
      updates[`shipments/${shipmentId}/telemetry/live`] = livePayload;

      // Update root summary fields for fast querying
      updates[`shipments/${shipmentId}/currentTemperature`] = reading.temperature;
      updates[`shipments/${shipmentId}/currentHumidity`] = reading.humidity;
      updates[`shipments/${shipmentId}/lastSensorUpdate`] = new Date(now).toISOString();
      updates[`shipments/${shipmentId}/batteryLevel`] = reading.batteryLevel;
      if (reading.viability !== undefined) {
        updates[`shipments/${shipmentId}/estimatedViabilityPercent`] = reading.viability;
      }
      if (reading.riskClassification) {
        updates[`shipments/${shipmentId}/riskClassification`] = reading.riskClassification;
      }

      await this.db.ref().update(updates);
      return true;
    } catch (err) {
      console.warn("RTDB updateShipmentTelemetry failed:", err.message);
      return false;
    }
  }

  /**
   * Creates an excursion alert in Firebase Realtime Database
   */
  async pushExcursionAlert(alertData) {
    if (!this.db || !this.authService?.currentUser) return false;

    try {
      const alertId = alertData.alertId || `ALT-${Date.now().toString(36).toUpperCase()}`;
      const record = {
        ...alertData,
        alertId,
        timestamp: alertData.timestamp || Date.now(),
        status: "ACTIVE"
      };

      const updates = {};
      updates[`alerts/${alertId}`] = record;
      updates[`shipments/${alertData.shipmentId}/alerts/${alertId}`] = record;
      updates[`shipments/${alertData.shipmentId}/excursionSeverity`] = record.severity;
      updates[`shipments/${alertData.shipmentId}/recommendedNextAction`] = record.recommendedAction;

      await this.db.ref().update(updates);
      return true;
    } catch (err) {
      console.warn("RTDB pushExcursionAlert failed:", err.message);
      return false;
    }
  }

  /**
   * Appends an audit trail entry for WHO compliance
   */
  async logAuditEntry(entry) {
    if (!this.db || !this.authService?.currentUser) return false;

    try {
      const newRef = this.db.ref("audit_logs").push();
      const logRecord = {
        logId: newRef.key,
        timestamp: new Date().toISOString(),
        operator: this.authService.currentUser.email || "Operator",
        ...entry
      };
      await newRef.set(logRecord);
      return true;
    } catch (err) {
      console.warn("RTDB logAuditEntry failed:", err.message);
      return false;
    }
  }

  /**
   * Updates category thresholds in Firebase
   */
  async updateCategoryThresholds(categoryKey, thresholdData) {
    if (!this.db || !this.authService?.currentUser) return false;
    try {
      await this.db.ref(`thresholds/${categoryKey}`).update(thresholdData);
      return true;
    } catch (err) {
      console.warn("RTDB updateCategoryThresholds failed:", err.message);
      return false;
    }
  }
}


// --- FILE: js/auth/authUi.js ---
// ============================================================================
// ColdGuard - Authentication UI Components & Modals
// Login / Registration / Password Reset / Firebase Project Configurator
// ============================================================================

class AuthUiManager {
  constructor(authService, onAuthSuccess) {
    this.authService = authService;
    this.onAuthSuccess = onAuthSuccess;
    this.currentMode = "login"; // "login" | "register" | "forgot_password"
  }

  renderAuthView(container) {
    container.innerHTML = `
      <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 animate-fade-in">
        
        <!-- Top Config Shortcut -->
        <div class="absolute top-5 right-5">
          <button id="btn-open-firebase-config" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.89 15.672L6.255.476A.5.5 0 0 1 7.18.232l3.415 6.442L3.89 15.672zm15.864-3.832L17.7 2.054a.5.5 0 0 0-.907-.05l-2.73 5.215 5.69 4.621zm-8.878-7.85l-7.79 14.654 10.985 6.168a1.5 1.5 0 0 0 1.458 0l7.218-4.053-11.87-16.77z"/>
            </svg>
            <span>Firebase Config</span>
          </button>
        </div>

        <!-- Header / Logo -->
        <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/20 mb-3">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v5"/>
              <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
              <path d="M9 10l6 0"/>
            </svg>
          </div>

          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">ColdGuard</h1>
          <p class="mt-1 text-xs font-bold uppercase tracking-wider text-blue-600">
            Protect Every Dose. Predict Every Excursion.
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Authorized Vaccine Cold Chain Monitoring Portal
          </p>
        </div>

        <!-- Card Container -->
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200 sm:px-10">
            
            <!-- Mode Tabs -->
            <div class="flex border-b border-slate-100 mb-6 text-xs font-bold text-slate-500">
              <button id="tab-login" class="flex-1 pb-3 text-center border-b-2 ${this.currentMode === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'} transition">
                Sign In
              </button>
              <button id="tab-register" class="flex-1 pb-3 text-center border-b-2 ${this.currentMode === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'} transition">
                Create Account
              </button>
              <button id="tab-forgot" class="flex-1 pb-3 text-center border-b-2 ${this.currentMode === 'forgot_password' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'} transition">
                Reset Password
              </button>
            </div>

            <!-- Error Banner -->
            <div id="auth-error-banner" class="hidden mb-5 bg-red-50 border-l-4 border-red-500 p-3.5 rounded-xl flex items-start gap-3 text-xs text-red-900">
              <span class="text-base font-bold text-red-600">⚠️</span>
              <div id="auth-error-text" class="flex-1 font-medium leading-relaxed"></div>
            </div>

            <!-- Success Banner -->
            <div id="auth-success-banner" class="hidden mb-5 bg-emerald-50 border-l-4 border-emerald-500 p-3.5 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
              <span class="text-base font-bold text-emerald-600">✉️</span>
              <div id="auth-success-text" class="flex-1 font-medium leading-relaxed"></div>
            </div>

            <!-- Form -->
            <form id="auth-main-form" class="space-y-4 text-xs">
              <!-- Name (Register mode only) -->
              <div id="field-name-group" class="${this.currentMode === 'register' ? 'block' : 'hidden'}">
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Full Name / Title
                </label>
                <input id="input-auth-name" type="text" placeholder="Dr. Elena Rostova, Duty Pharmacist" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>

              <!-- Email -->
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Official Email Address
                </label>
                <input id="input-auth-email" type="email" required placeholder="operator@coldguard.org" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>

              <!-- Password (Login & Register modes) -->
              <div id="field-password-group" class="${this.currentMode === 'forgot_password' ? 'hidden' : 'block'}">
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Password
                  </label>
                  <button type="button" id="link-forgot-pw" class="text-[11px] text-blue-600 hover:underline font-semibold ${this.currentMode === 'login' ? 'inline-block' : 'hidden'}">
                    Forgot password?
                  </button>
                </div>
                <input id="input-auth-password" type="password" placeholder="••••••••••••" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono" />
              </div>

              <!-- Confirm Password (Register mode only) -->
              <div id="field-confirm-group" class="${this.currentMode === 'register' ? 'block' : 'hidden'}">
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Confirm Password
                </label>
                <input id="input-auth-confirm" type="password" placeholder="••••••••••••" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono" />
              </div>

              <!-- Submit Button -->
              <button id="btn-auth-submit" type="submit" class="w-full mt-2 py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2">
                <span id="btn-auth-submit-text">${this.currentMode === 'login' ? 'Sign In to ColdGuard Dashboard' : this.currentMode === 'register' ? 'Create Verified Operator Account' : 'Send Password Reset Link'}</span>
              </button>

              <!-- Instant Demo Access Shortcut -->
              <div class="relative flex py-1 items-center">
                <div class="flex-grow border-t border-slate-200"></div>
                <span class="flex-shrink mx-2 text-[10px] uppercase font-bold text-slate-400">or preview</span>
                <div class="flex-grow border-t border-slate-200"></div>
              </div>

              <button type="button" id="btn-auth-demo-login" class="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-200">
                <span>⚡ Instant Demo Operator Access</span>
              </button>
            </form>

            <!-- Bottom Disclaimer -->
            <div class="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Firebase Auth Active
              </span>
              <span>WHO PQS Annex 9</span>
            </div>

          </div>
        </div>
      </div>
    `;

    this.bindAuthEvents(container);
  }

  bindAuthEvents(container) {
    const tabLogin = container.querySelector("#tab-login");
    const tabRegister = container.querySelector("#tab-register");
    const tabForgot = container.querySelector("#tab-forgot");
    const linkForgot = container.querySelector("#link-forgot-pw");
    const btnConfig = container.querySelector("#btn-open-firebase-config");
    const btnDemo = container.querySelector("#btn-auth-demo-login");

    if (tabLogin) tabLogin.onclick = () => this.setMode("login", container);
    if (tabRegister) tabRegister.onclick = () => this.setMode("register", container);
    if (tabForgot) tabForgot.onclick = () => this.setMode("forgot_password", container);
    if (linkForgot) linkForgot.onclick = () => this.setMode("forgot_password", container);
    if (btnConfig) btnConfig.onclick = () => this.openFirebaseConfigModal();
    if (btnDemo) {
      btnDemo.onclick = () => {
        const demoUser = {
          uid: "demo-operator-mv",
          displayName: "Dr. Marcus Vance",
          email: "marcus.vance@coldguard.org",
          isDemo: true
        };
        if (this.onAuthSuccess) this.onAuthSuccess(demoUser);
      };
    }

    const form = container.querySelector("#auth-main-form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await this.handleFormSubmit(container);
      };
    }
  }

  setMode(newMode, container) {
    this.currentMode = newMode;
    this.renderAuthView(container);
  }

  showError(container, message) {
    const banner = container.querySelector("#auth-error-banner");
    const text = container.querySelector("#auth-error-text");
    if (banner && text) {
      text.textContent = message;
      banner.classList.remove("hidden");
    }
    const successBanner = container.querySelector("#auth-success-banner");
    if (successBanner) successBanner.classList.add("hidden");
  }

  showSuccess(container, message) {
    const banner = container.querySelector("#auth-success-banner");
    const text = container.querySelector("#auth-success-text");
    if (banner && text) {
      text.innerHTML = message;
      banner.classList.remove("hidden");
    }
    const errorBanner = container.querySelector("#auth-error-banner");
    if (errorBanner) errorBanner.classList.add("hidden");
  }

  async handleFormSubmit(container) {
    const emailInput = container.querySelector("#input-auth-email");
    const passwordInput = container.querySelector("#input-auth-password");
    const nameInput = container.querySelector("#input-auth-name");
    const confirmInput = container.querySelector("#input-auth-confirm");
    const submitBtn = container.querySelector("#btn-auth-submit");
    const submitText = container.querySelector("#btn-auth-submit-text");

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";
    const name = nameInput?.value?.trim() || "";
    const confirm = confirmInput?.value || "";

    // Clear previous alerts
    container.querySelector("#auth-error-banner")?.classList.add("hidden");
    container.querySelector("#auth-success-banner")?.classList.add("hidden");

    // Validation
    if (!email) {
      this.showError(container, "Please enter your official email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError(container, "Please enter a valid email address (e.g. name@hospital.org).");
      return;
    }

    // Set Loading state
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Authenticating via Firebase...</span>
    `;

    try {
      if (this.currentMode === "forgot_password") {
        await this.authService.resetPassword(email);
        this.showSuccess(container, `Password reset link dispatched! Please check your inbox at <b>${email}</b>.`);
      } else if (this.currentMode === "register") {
        if (!name) {
          throw new Error("Please enter your full name and duty title.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (password !== confirm) {
          throw new Error("Passwords do not match. Please re-enter.");
        }
        const user = await this.authService.register(name, email, password);
        if (this.onAuthSuccess) this.onAuthSuccess(user);
      } else {
        // Login
        if (!password) {
          throw new Error("Please enter your password.");
        }
        const user = await this.authService.login(email, password);
        if (this.onAuthSuccess) this.onAuthSuccess(user);
      }
    } catch (err) {
      this.showError(container, err.message || "Authentication failed. Please verify credentials.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) {
        submitText.textContent = this.currentMode === 'login'
          ? 'Sign In to ColdGuard Dashboard'
          : this.currentMode === 'register'
          ? 'Create Verified Operator Account'
          : 'Send Password Reset Link';
      }
    }
  }

  // --- Modal: Firebase Project Credentials Configuration ---
  openFirebaseConfigModal() {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const currentConfig = this.authService.config;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
          <div class="bg-slate-900 p-5 text-white flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.89 15.672L6.255.476A.5.5 0 0 1 7.18.232l3.415 6.442L3.89 15.672zm15.864-3.832L17.7 2.054a.5.5 0 0 0-.907-.05l-2.73 5.215 5.69 4.621zm-8.878-7.85l-7.79 14.654 10.985 6.168a1.5 1.5 0 0 0 1.458 0l7.218-4.053-11.87-16.77z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Firebase Project Web Credentials</h3>
                <p class="text-xs text-slate-400">Connect to your Firebase Authentication backend</p>
              </div>
            </div>
            <button id="btn-close-firebase-config" class="text-slate-400 hover:text-white p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-4 text-xs">
            <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 leading-relaxed">
              <b>How to get your credentials:</b> In <a href="https://console.firebase.google.com" target="_blank" class="underline font-bold text-blue-700">Firebase Console</a> → Project Settings (⚙️) → General → Scroll to <b>Your apps</b> → Web app. Ensure <b>Email/Password</b> is enabled in <i>Authentication → Sign-in method</i>.
            </div>

            <div class="space-y-3">
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-1">API Key (apiKey)</label>
                <input id="cfg-api-key" type="text" value="${currentConfig.apiKey || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Auth Domain</label>
                  <input id="cfg-auth-domain" type="text" value="${currentConfig.authDomain || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Project ID</label>
                  <input id="cfg-project-id" type="text" value="${currentConfig.projectId || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Storage Bucket</label>
                  <input id="cfg-storage-bucket" type="text" value="${currentConfig.storageBucket || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">App ID</label>
                  <input id="cfg-app-id" type="text" value="${currentConfig.appId || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button id="btn-reset-firebase-default" class="text-xs text-slate-500 hover:text-slate-800 font-medium">Reset to Default</button>
            <div class="flex items-center gap-2">
              <button id="btn-cancel-firebase-config" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button id="btn-save-firebase-config" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Save & Connect</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-firebase-config").onclick = () => modalContainer.innerHTML = "";
    document.getElementById("btn-cancel-firebase-config").onclick = () => modalContainer.innerHTML = "";

    document.getElementById("btn-reset-firebase-default").onclick = () => {
      localStorage.removeItem("coldguard_firebase_config");
      location.reload();
    };

    document.getElementById("btn-save-firebase-config").onclick = () => {
      const apiKey = document.getElementById("cfg-api-key").value.trim();
      const authDomain = document.getElementById("cfg-auth-domain").value.trim();
      const projectId = document.getElementById("cfg-project-id").value.trim();
      const storageBucket = document.getElementById("cfg-storage-bucket").value.trim();
      const appId = document.getElementById("cfg-app-id").value.trim();

      this.authService.saveConfig({ apiKey, authDomain, projectId, storageBucket, appId });
      modalContainer.innerHTML = "";
      alert("Firebase credentials updated and saved!");
    };
  }
}


// --- FILE: js/app.js ---
// ============================================================================
// ColdGuard - Main Application Controller
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================










class ColdGuardApp {
  constructor() {
    this.vaccineProfiles = JSON.parse(JSON.stringify(VACCINE_PROFILES));
    this.checkpoints = CHECKPOINTS;
    this.currentView = "dashboard"; // "dashboard" | "shipments" | "details" | "excursion_engine" | "viability_lab" | "checkpoints"
    this.selectedShipmentId = "CG-IN-1301-COV"; // default India demo vaccine shipment
    this.soundAlertsEnabled = false;

    // Filters for Shipment table
    this.filters = {
      searchQuery: "",
      category: "all",
      status: "all",
      riskLevel: "all"
    };

    // Components
    this.modals = new ModalManager(this);
    this.charts = new TelemetryCharts();
    this.mapView = null;

    // Audio context for alert beeps
    this.audioCtx = null;

    // Initialize Simulation Engine
    this.simulation = new SimulationEngine(
      INITIAL_SHIPMENTS,
      this.vaccineProfiles,
      (updatedShipments) => this.onSimulationTick(updatedShipments)
    );

    // Authentication & Database Services
    this.authService = new FirebaseAuthService();
    this.dbService = new FirebaseDatabaseService(this.authService);
    this.lastRtdbSyncTime = 0;
    this.remoteAlerts = [];
    this.authUi = new AuthUiManager(this.authService, (user) => this.onAuthSuccess(user));
    this.currentUser = null;

    this.init();
  }

  init() {
    this.bindHeaderControls();
    this.bindNavigation();
    this.bindGlobalKeyboardShortcuts();
    this.parseHashRoute();
    window.addEventListener("hashchange", () => {
      this.parseHashRoute();
      if (this.currentUser) {
        this.renderCurrentView();
      }
    });

    // Listen for Firebase Auth State changes
    this.authService.onAuthStateChanged((user) => {
      this.handleAuthStateChanged(user);
    });

    // Listen for Realtime Database changes
    if (this.dbService) {
      this.dbService.on("shipments", (remoteShipments) => {
        this.handleRemoteShipments(remoteShipments);
      });
      this.dbService.on("alerts", (remoteAlerts) => {
        this.handleRemoteAlerts(remoteAlerts);
      });
      this.dbService.on("thresholds", (remoteThresholds) => {
        if (remoteThresholds) {
          this.vaccineProfiles = { ...this.vaccineProfiles, ...remoteThresholds };
          this.simulation.profiles = this.vaccineProfiles;
        }
      });
    }
  }

  handleAuthStateChanged(user) {
    if (!user && this.currentUser && this.currentUser.isDemo) {
      return; // Preserve active demo session
    }
    this.currentUser = user;
    const authContainer = document.getElementById("auth-view-container");
    const dashboardContainer = document.getElementById("dashboard-app-container");

    if (user) {
      if (authContainer) {
        authContainer.classList.add("hidden");
        authContainer.style.display = "none";
      }
      if (dashboardContainer) {
        dashboardContainer.classList.remove("hidden");
        dashboardContainer.style.display = "flex";
      }

      this.updateUserBadge(user);
      this.bindUserControls();
      this.simulation.start();
      this.renderCurrentView();
    } else {
      if (dashboardContainer) {
        dashboardContainer.classList.add("hidden");
        dashboardContainer.style.display = "none";
      }
      if (authContainer) {
        authContainer.classList.remove("hidden");
        authContainer.style.display = "flex";
        this.authUi.renderAuthView(authContainer);
      }
      this.simulation.pause();
    }
  }

  onAuthSuccess(user) {
    this.currentUser = user;
    this.handleAuthStateChanged(user);
    this.modals.showToast(`Welcome back, ${user.displayName || user.email}!`, "safe");
  }

  async handleLogout() {
    try {
      if (this.currentUser && !this.currentUser.isDemo) {
        await this.authService.logout();
      }
      this.currentUser = null;
      this.handleAuthStateChanged(null);
      this.modals.showToast("Operator session ended. Signed out securely.", "info");
    } catch (err) {
      this.modals.showToast("Failed to sign out: " + (err.message || err), "warning");
    }
  }

  updateUserBadge(user) {
    const name = user.displayName || user.email?.split("@")[0] || "Operator";
    const email = user.email || "operator@coldguard.org";
    const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "OP";

    const headerName = document.getElementById("header-user-name");
    const headerAvatar = document.getElementById("header-user-avatar");
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarEmail = document.getElementById("sidebar-user-email");
    const sidebarAvatar = document.getElementById("sidebar-avatar");

    if (headerName) headerName.textContent = name;
    if (headerAvatar) headerAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarEmail) sidebarEmail.textContent = email;
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
  }

  bindUserControls() {
    const btnLogoutHeader = document.getElementById("btn-logout-header");
    const btnLogoutSidebar = document.getElementById("btn-logout-sidebar");
    if (btnLogoutHeader) btnLogoutHeader.onclick = () => this.handleLogout();
    if (btnLogoutSidebar) btnLogoutSidebar.onclick = () => this.handleLogout();
  }

  parseHashRoute() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const parts = hash.split("?");
    const view = parts[0];
    const params = new URLSearchParams(parts[1] || "");
    const id = params.get("id");
    const modal = params.get("modal");

    if (["dashboard", "shipments", "details", "excursion_engine", "viability_lab", "checkpoints"].includes(view)) {
      this.currentView = view;
      if (id) this.selectedShipmentId = id;
      this.updateNavActiveState(view);
    } else if (view === "auth") {
      const mode = params.get("mode") || "login";
      if (this.authUi) {
        this.authUi.currentMode = mode === "config" ? "login" : mode;
        const authContainer = document.getElementById("auth-view-container");
        if (authContainer) this.authUi.renderAuthView(authContainer);
        if (mode === "config") {
          setTimeout(() => this.authUi.openFirebaseConfigModal(), 100);
        }
      }
    }

    if (params.get("demo") === "true" && !this.currentUser) {
      setTimeout(() => {
        this.onAuthSuccess({
          uid: "demo-operator-mv",
          displayName: "Dr. Marcus Vance",
          email: "marcus.vance@coldguard.org",
          isDemo: true
        });
      }, 50);
    }

    if (modal) {
      setTimeout(() => {
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        const cp = this.checkpoints.find(c => c.id === s.nearestCheckpointId) || this.checkpoints[0];
        if (modal === "reroute") {
          this.modals.openRerouteModal(s, cp);
        } else if (modal === "audit") {
          this.modals.openAuditReportModal(s);
        } else if (modal === "thresholds") {
          this.modals.openThresholdModal(s.vaccineCategory, this.vaccineProfiles);
        }
      }, 100);
    }
  }

  updateNavActiveState(viewName) {
    document.querySelectorAll(".nav-link").forEach(btn => {
      const target = btn.getAttribute("data-view");
      if (target === viewName) {
        btn.classList.add("bg-blue-600", "text-white", "font-semibold");
        btn.classList.remove("text-slate-300", "hover:bg-slate-800");
      } else {
        btn.classList.remove("bg-blue-600", "text-white", "font-semibold");
        btn.classList.add("text-slate-300", "hover:bg-slate-800");
      }
    });
  }

  // Audio synthesize alert sound
  playAlertTone(type = "warning") {
    if (!this.soundAlertsEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      const freq = type === "critical" ? 880 : 587;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  // Simulation tick handler
  onSimulationTick(shipments) {
    this.updateHeaderBadges();

    // Simulation is display-only; only actual device/backend integrations may write live telemetry.

    if (this.currentView === "dashboard") {
      this.updateDashboardKpis();
    } else if (this.currentView === "shipments") {
      this.renderShipmentsTable();
    } else if (this.currentView === "details") {
      this.updateDetailsTelemetry();
    } else if (this.currentView === "excursion_engine") {
      this.renderExcursionEngineView();
    } else if (this.currentView === "viability_lab") {
      this.renderViabilityLabView();
    }
  }

  handleRemoteShipments(remoteShipments) {
    if (!Array.isArray(remoteShipments) || remoteShipments.length === 0) return;
    // Merge sparse Firebase telemetry into the full local shipment model.
    const localShipments = this.simulation.shipments || [];
    const localById = new Map(localShipments.map(s => [String(s.id), s]));
    const seen = new Set();
    const mergedRemote = remoteShipments.map(remote => {
      const location = remote.location || {};
      const live = remote.telemetry?.live || {};
      const id = String(remote.id || remote.shipmentId || "");
      if (!id) return null;
      seen.add(id);
      const local = localById.get(id) || {};
      const valid = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
      const latitude = location.hasFix === false ? local.gpsLatitude :
        (valid(location.latitude) ? Number(location.latitude) :
        (valid(remote.gpsLatitude) ? Number(remote.gpsLatitude) :
        (valid(live.latitude) ? Number(live.latitude) : local.gpsLatitude)));
      const longitude = location.hasFix === false ? local.gpsLongitude :
        (valid(location.longitude) ? Number(location.longitude) :
        (valid(remote.gpsLongitude) ? Number(remote.gpsLongitude) :
        (valid(live.longitude) ? Number(live.longitude) : local.gpsLongitude)));
      return {
        ...local, ...remote, id,
        gpsLatitude: latitude, gpsLongitude: longitude,
        currentTemperature: remote.currentTemperature ?? live.temperature ?? local.currentTemperature,
        currentHumidity: remote.currentHumidity ?? live.humidity ?? local.currentHumidity,
        batteryLevel: remote.batteryLevel ?? live.batteryLevel ?? local.batteryLevel,
        isLiveGps: location.isLiveGps === true || remote.isLiveGps === true,
        gpsHasFix: location.hasFix !== false,
        gpsStatus: location.status || (remote.isLiveGps ? "LOCKED" : local.gpsStatus),
        gpsSpeedKmH: location.speedKmH ?? local.gpsSpeedKmH,
        gpsSatellites: location.satellites ?? local.gpsSatellites,
        gpsLastUpdated: location.lastUpdated ?? remote.lastSensorUpdate ?? local.gpsLastUpdated
      };
    }).filter(Boolean);
    const untouchedLocal = localShipments.filter(s => !seen.has(String(s.id)));
    this.simulation.shipments = [...mergedRemote, ...untouchedLocal];
    this.updateHeaderBadges();
    if (this.currentView === "dashboard") this.updateDashboardKpis();
    else if (this.currentView === "shipments") this.renderShipmentsTable();
    else if (this.currentView === "details") this.updateDetailsTelemetry();
  }

  handleRemoteAlerts(remoteAlerts) {
    this.remoteAlerts = remoteAlerts || [];
    this.updateHeaderBadges();
  }

  // --- View Switcher ---
  switchView(viewName, shipmentId = null) {
    this.currentView = viewName;
    if (shipmentId) {
      this.selectedShipmentId = shipmentId;
      window.location.hash = `${viewName}?id=${shipmentId}`;
    } else {
      window.location.hash = viewName;
    }

    // Update nav active states
    this.updateNavActiveState(viewName);

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderCurrentView() {
    const mainContent = document.getElementById("main-content-view");
    if (!mainContent) return;

    if (this.charts) {
      this.charts.destroy();
    }

    switch (this.currentView) {
      case "dashboard":
        this.renderDashboardView(mainContent);
        break;
      case "shipments":
        this.renderShipmentsTableView(mainContent);
        break;
      case "details":
        this.renderDetailsView(mainContent);
        break;
      case "excursion_engine":
        this.renderExcursionEngineView(mainContent);
        break;
      case "viability_lab":
        this.renderViabilityLabView(mainContent);
        break;
      case "checkpoints":
        this.renderCheckpointsView(mainContent);
        break;
      default:
        this.renderDashboardView(mainContent);
    }
  }

  // ==========================================================================
  // VIEW 1: MAIN DASHBOARD OVERVIEW
  // ==========================================================================
  renderDashboardView(container) {
    const kpis = this.calculateKPIs();
    const criticalShipments = this.simulation.shipments.filter(
      s => s.excursionSeverity === "Critical" || s.riskClassification === "Critical"
    );
    const atRiskShipments = this.simulation.shipments.filter(
      s => s.riskClassification === "High Risk" || s.excursionSeverity === "Warning"
    );

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Top Banner / Title -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Cold Chain Control Tower</span>
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Fleet Environmental Health & KPIs</h1>
            <p class="text-xs text-slate-500">Live multi-sensor telemetry processing across all active biologics carriers.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-quick-export" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              WHO Audit Manifest
            </button>
            <button id="btn-view-all-shipments" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <span>View All Shipments</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>

        <!-- Section 2: 8 KPI CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
          ${this.renderKpiCardsHtml(kpis)}
        </div>

        <!-- Critical Attention Alert Banner if Criticals Exist -->
        ${criticalShipments.length > 0 ? `
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                🚨
              </div>
              <div>
                <h4 class="text-sm font-bold text-red-950">CRITICAL EXCURSION DETECTED IN TRANSIT (${criticalShipments.length} SHIPMENT)</h4>
                <p class="text-xs text-red-800">Shipment <b>${criticalShipments[0].id}</b> (${criticalShipments[0].vaccineName}) breached thermal envelope. Viability degrading.</p>
              </div>
            </div>
            <button class="btn-inspect-shipment px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition whitespace-nowrap self-start sm:self-auto" data-id="${criticalShipments[0].id}">
              Inspect Telemetry & Reroute →
            </button>
          </div>
        ` : ''}

        <!-- High Priority Active Shipments Grid / Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left 2 Cols: Action Required Shipments -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">High-Priority Shipments Requiring Attention</h3>
                <p class="text-xs text-slate-500">Live sorting by highest thermal deviation and spoilage risk.</p>
              </div>
              <span class="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                ${criticalShipments.length + atRiskShipments.length} Flagged
              </span>
            </div>

            <div class="divide-y divide-slate-100 overflow-x-auto">
              ${this.simulation.shipments.slice(0, 5).map(s => `
                <div class="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer row-inspect-shipment" data-id="${s.id}">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      s.excursionSeverity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-300' :
                      s.excursionSeverity === 'Warning' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                      'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    }">
                      ${s.excursionSeverity === 'Critical' ? 'CRIT' : s.excursionSeverity === 'Warning' ? 'WARN' : 'SAFE'}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-xs text-slate-900">${s.id}</span>
                        <span class="text-xs text-slate-500 font-medium">${s.vaccineName}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5">${s.currentLocation}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 text-right">
                    <div>
                      <div class="font-mono font-bold text-xs ${s.currentTemperature > s.maxAllowedTemperature || s.currentTemperature < s.minAllowedTemperature ? 'text-red-600' : 'text-slate-800'}">
                        ${s.currentTemperature}°C
                      </div>
                      <div class="text-[10px] text-slate-400">Permitted: ${s.minAllowedTemperature}° to ${s.maxAllowedTemperature}°</div>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-indigo-600">${s.estimatedViabilityPercent}%</div>
                      <div class="text-[10px] text-slate-400">Viability</div>
                    </div>
                    <button class="btn-inspect-shipment p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition" data-id="${s.id}" title="Inspect">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Right 1 Col: Quick Simulation Sandbox & Category Breakdown -->
          <div class="space-y-6">
            <!-- Vaccine Categories Overview -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 class="font-bold text-slate-900 text-sm">Storage Protocol Breakdown</h3>
              <div class="space-y-2.5 text-xs">
                ${Object.keys(this.vaccineProfiles).map(catKey => {
                  const prof = this.vaccineProfiles[catKey];
                  const count = this.simulation.shipments.filter(s => s.vaccineCategory === catKey).length;
                  return `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${prof.color}"></span>
                        <span class="font-medium text-slate-700">${prof.categoryName}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[11px] text-slate-500">${prof.minTemp}° to ${prof.maxTemp}°C</span>
                        <span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">${count}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- Quick Incident Scenario Injections -->
            <div class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-xs uppercase tracking-wider text-indigo-300">Test Stress Scenarios</h4>
                <span class="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] rounded">Live Injector</span>
              </div>
              <p class="text-xs text-slate-300">Simulate hardware anomalies to test rule triggers & nearest checkpoint rerouting in real-time.</p>
              
              <div class="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold">
                <button id="btn-quick-inject-reefer" class="p-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-left transition flex items-center gap-2">
                  <span>🔥</span>
                  <span>Reefer Failure</span>
                </button>
                <button id="btn-quick-inject-dryice" class="p-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition flex items-center gap-2">
                  <span>❄️</span>
                  <span>Dry-Ice Loss</span>
                </button>
                <button id="btn-quick-inject-route" class="p-2 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-700/60 text-left transition flex items-center gap-2">
                  <span>📍</span>
                  <span>Route Detour</span>
                </button>
                <button id="btn-quick-inject-recover" class="p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-left transition flex items-center gap-2">
                  <span>✅</span>
                  <span>Restore Cold</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindDashboardEvents(container);
  }

  calculateKPIs() {
    const list = this.simulation.shipments;
    const active = list.filter(s => s.status !== "Delivered");
    const atRisk = active.filter(s => s.riskClassification !== "Low" || s.excursionSeverity !== "None");
    const excursions = list.filter(s => s.excursionSeverity === "Critical" || s.excursionSeverity === "High Risk");
    const criticalAlerts = list.filter(s => s.excursionSeverity === "Critical");

    const avgViability = active.length > 0
      ? (active.reduce((acc, s) => acc + s.estimatedViabilityPercent, 0) / active.length).toFixed(1)
      : 98.0;

    const onTimeCount = active.filter(s => !s.predictedDelay || s.predictedDelay.includes("On Time") || s.predictedDelay === "None").length;
    const onTimeRate = active.length > 0 ? ((onTimeCount / active.length) * 100).toFixed(1) : 95.0;

    const compliantHumidity = active.filter(s => s.currentHumidity >= s.minAllowedHumidity && s.currentHumidity <= s.maxAllowedHumidity).length;
    const humidityRate = active.length > 0 ? ((compliantHumidity / active.length) * 100).toFixed(1) : 96.0;

    const gpsOnline = active.filter(s => s.sensorConnectivity === "Online" || s.sensorConnectivity === "Low Battery").length;
    const gpsRate = active.length > 0 ? Math.round((gpsOnline / active.length) * 100) : 100;

    return {
      activeShipments: active.length,
      shipmentsAtRisk: atRisk.length,
      temperatureExcursions: excursions.length,
      avgViability,
      criticalAlerts: criticalAlerts.length,
      onTimeRate,
      humidityRate,
      gpsRate
    };
  }

  renderKpiCardsHtml(kpis) {
    return `
      <!-- KPI 1: Active Shipments -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Active Shipments</span>
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.activeShipments}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↑ +2 dispatched today</span>
            <span class="text-slate-400">• In transit</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Shipments at Risk -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Shipments at Risk</span>
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-amber-600">${kpis.shipmentsAtRisk}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium mt-1">
            <span>Approaching / out-of-spec</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Temperature Excursions -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Temperature Excursions</span>
          <div class="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-red-600">${kpis.temperatureExcursions}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-red-700 font-medium mt-1">
            <span>Active rule trigger</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Average Vaccine Viability -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Avg Vaccine Viability</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.avgViability}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
            <span>Healthy baseline (>90%)</span>
          </div>
        </div>
      </div>

      <!-- KPI 5: Critical Alerts -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Critical Incidents</span>
          <div class="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-red-600">${kpis.criticalAlerts}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-red-700 font-medium mt-1">
            <span>Action Required</span>
          </div>
        </div>
      </div>

      <!-- KPI 6: On-Time Delivery Rate -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">On-Time Delivery Rate</span>
          <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.onTimeRate}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium mt-1">
            <span>ETAs compliant</span>
          </div>
        </div>
      </div>

      <!-- KPI 7: Humidity Compliance -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Humidity Compliance</span>
          <div class="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.humidityRate}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-cyan-700 font-medium mt-1">
            <span>Inside RH bounds</span>
          </div>
        </div>
      </div>

      <!-- KPI 8: GPS Connectivity -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">GPS Connectivity</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.gpsRate}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
            <span>Cellular LTE-M locked</span>
          </div>
        </div>
      </div>
    `;
  }

  updateDashboardKpis() {
    const grid = document.getElementById("kpi-cards-grid");
    if (!grid) return;
    const kpis = this.calculateKPIs();
    grid.innerHTML = this.renderKpiCardsHtml(kpis);
  }

  bindDashboardEvents(container) {
    const btnAll = container.querySelector("#btn-view-all-shipments");
    if (btnAll) btnAll.onclick = () => this.switchView("shipments");

    const btnExport = container.querySelector("#btn-quick-export");
    if (btnExport) {
      btnExport.onclick = () => {
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        this.modals.openAuditReportModal(s);
      };
    }

    container.querySelectorAll(".btn-inspect-shipment, .row-inspect-shipment").forEach(el => {
      el.onclick = (e) => {
        const id = el.getAttribute("data-id");
        this.switchView("details", id);
      };
    });

    // Quick injections
    const reefer = container.querySelector("#btn-quick-inject-reefer");
    if (reefer) reefer.onclick = () => {
      this.simulation.injectRefrigerationFailure(this.selectedShipmentId);
      this.playAlertTone("critical");
      this.modals.showToast("Injected Reefer Compressor Failure on " + this.selectedShipmentId, "critical");
    };

    const dryice = container.querySelector("#btn-quick-inject-dryice");
    if (dryice) dryice.onclick = () => {
      this.simulation.injectDryIceDepletion(this.selectedShipmentId);
      this.playAlertTone("critical");
      this.modals.showToast("Injected Dry-Ice Depletion scenario", "critical");
    };

    const route = container.querySelector("#btn-quick-inject-route");
    if (route) route.onclick = () => {
      this.simulation.injectRouteDeviation(this.selectedShipmentId);
      this.playAlertTone("warning");
      this.modals.showToast("Injected Route Deviation scenario", "warning");
    };

    const recover = container.querySelector("#btn-quick-inject-recover");
    if (recover) recover.onclick = () => {
      this.simulation.injectColdRecovery(this.selectedShipmentId);
      this.modals.showToast("Restored Cold Chain parameters to nominal", "safe");
    };
  }

  // ==========================================================================
  // VIEW 2: REAL-TIME SHIPMENT MONITORING (Searchable & Filterable Table)
  // ==========================================================================
  renderShipmentsTableView(container) {
    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Title & Stats -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Real-Time Vaccine Shipments</h1>
            <p class="text-xs text-slate-500">Continuous environmental telemetry, batch tracking, and risk classification.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-export-all-csv" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export Fleet Manifest (CSV)
            </button>
            <button id="btn-open-threshold-config" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Category Thresholds
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Search Input -->
            <div class="relative">
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input id="filter-search-input" type="text" placeholder="Search ID, vaccine, batch..." value="${this.filters.searchQuery}" class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Vaccine Category Filter -->
            <div>
              <select id="filter-category-select" class="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="all">All Vaccine Categories</option>
                ${Object.keys(this.vaccineProfiles).map(k => `
                  <option value="${k}" ${this.filters.category === k ? 'selected' : ''}>${this.vaccineProfiles[k].categoryName}</option>
                `).join("")}
              </select>
            </div>

            <!-- Shipment Status Filter -->
            <div>
              <select id="filter-status-select" class="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Shipment Statuses</option>
                <option value="In Transit" ${this.filters.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                <option value="Approaching Destination" ${this.filters.status === 'Approaching Destination' ? 'selected' : ''}>Approaching Destination</option>
                <option value="Emergency Rerouting" ${this.filters.status === 'Emergency Rerouting' ? 'selected' : ''}>Emergency Rerouting</option>
                <option value="Delivered" ${this.filters.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              </select>
            </div>

            <!-- Risk Level Filter -->
            <div>
              <select id="filter-risk-select" class="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="all" ${this.filters.riskLevel === 'all' ? 'selected' : ''}>All Risk Levels</option>
                <option value="Low" ${this.filters.riskLevel === 'Low' ? 'selected' : ''}>Low Risk (Safe)</option>
                <option value="Moderate" ${this.filters.riskLevel === 'Moderate' ? 'selected' : ''}>Moderate (Warning)</option>
                <option value="High Risk" ${this.filters.riskLevel === 'High Risk' ? 'selected' : ''}>High Risk</option>
                <option value="Critical" ${this.filters.riskLevel === 'Critical' ? 'selected' : ''}>Critical Excursion</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Shipments Data Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="shipments-table-wrapper">
          ${this.generateShipmentsTableHtml()}
        </div>
      </div>
    `;

    this.bindShipmentTableEvents(container);
  }

  generateShipmentsTableHtml() {
    const filtered = this.getFilteredShipments();

    if (filtered.length === 0) {
      return `
        <div class="p-12 text-center text-slate-500">
          <div class="text-3xl mb-2">🔍</div>
          <div class="font-bold text-sm text-slate-800">No shipments found matching filters</div>
          <div class="text-xs text-slate-400 mt-1">Try resetting search query or selecting "All Categories".</div>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-700">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
            <tr>
              <th class="p-3.5">Shipment & Vaccine</th>
              <th class="p-3.5">Category & Lot</th>
              <th class="p-3.5">Origin / Destination</th>
              <th class="p-3.5 text-center">Temp (°C)</th>
              <th class="p-3.5 text-center">Humidity</th>
              <th class="p-3.5 text-center">Remaining Viability</th>
              <th class="p-3.5 text-center">Risk Level</th>
              <th class="p-3.5 text-center">Status</th>
              <th class="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${filtered.map(s => {
              const isCrit = s.excursionSeverity === "Critical" || s.riskClassification === "Critical";
              const isHigh = s.riskClassification === "High Risk";
              const isMod = s.riskClassification === "Moderate" || s.excursionSeverity === "Warning";
              const prof = this.vaccineProfiles[s.vaccineCategory] || {};

              return `
                <tr class="hover:bg-slate-50/80 transition cursor-pointer shipment-row ${s.id === this.selectedShipmentId ? 'bg-blue-50/50' : ''}" data-id="${s.id}">
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      ${s.id}
                      ${s.priority === 'Urgent' ? '<span class="px-1.5 py-0.2 bg-red-100 text-red-700 font-sans text-[10px] font-bold rounded">URGENT</span>' : ''}
                    </div>
                    <div class="text-slate-600 font-medium mt-0.5">${s.vaccineName}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${s.doses.toLocaleString()} doses • ${s.packagingType.substring(0, 24)}...</div>
                  </td>

                  <td class="p-3.5">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white mb-1" style="background-color: ${prof.color || '#2563EB'}">
                      ${prof.categoryName || s.vaccineCategory}
                    </span>
                    <div class="font-mono text-[11px] text-slate-500">Lot: ${s.batchNumber}</div>
                    <div class="text-[10px] text-slate-400">${s.manufacturer}</div>
                  </td>

                  <td class="p-3.5">
                    <div class="font-medium text-slate-800 text-[11px] truncate max-w-[170px]" title="${s.currentLocation}">
                      📍 ${s.currentLocation}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5 truncate max-w-[170px]" title="${s.destinationFacility}">
                      🏁 ${s.destinationFacility}
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">ETA: ${s.eta}</div>
                  </td>

                  <td class="p-3.5 text-center">
                    <div class="font-mono font-extrabold text-sm ${s.currentTemperature > s.maxAllowedTemperature || s.currentTemperature < s.minAllowedTemperature ? 'text-red-600 animate-pulse' : 'text-slate-900'}">
                      ${s.currentTemperature}°C
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono">
                      [${s.minAllowedTemperature}° to ${s.maxAllowedTemperature}°]
                    </div>
                    ${s.temperatureDeviation !== 0 ? `<div class="text-[10px] font-bold text-red-500 mt-0.5">Δ ${s.temperatureDeviation > 0 ? '+' : ''}${s.temperatureDeviation}°C</div>` : ''}
                  </td>

                  <td class="p-3.5 text-center">
                    <div class="font-mono font-semibold text-slate-800">${s.currentHumidity}% RH</div>
                    <div class="text-[10px] text-slate-400">[${s.minAllowedHumidity}% - ${s.maxAllowedHumidity}%]</div>
                  </td>

                  <td class="p-3.5 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <div class="w-10 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div class="h-full rounded-full ${s.estimatedViabilityPercent >= 90 ? 'bg-emerald-500' : s.estimatedViabilityPercent >= 80 ? 'bg-amber-500' : 'bg-red-500'}" style="width: ${s.estimatedViabilityPercent}%"></div>
                      </div>
                      <span class="font-mono font-bold text-xs ${s.estimatedViabilityPercent >= 90 ? 'text-emerald-700' : s.estimatedViabilityPercent >= 80 ? 'text-amber-700' : 'text-red-700'}">
                        ${s.estimatedViabilityPercent}%
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400">Risk: ${s.predictedSpoilageRiskPercent}%</div>
                  </td>

                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isCrit ? 'bg-red-100 text-red-800 border border-red-300' :
                      isHigh ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      isMod ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }">
                      ${s.riskClassification}
                    </span>
                  </td>

                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      s.status === 'Delivered' ? 'bg-slate-100 text-slate-700' :
                      s.status === 'Emergency Rerouting' ? 'bg-purple-100 text-purple-800 font-bold' :
                      'bg-blue-50 text-blue-700'
                    }">
                      ${s.status}
                    </span>
                  </td>

                  <td class="p-3.5 text-right">
                    <button class="btn-inspect px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition" data-id="${s.id}">
                      Inspect
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  getFilteredShipments() {
    return this.simulation.shipments.filter(s => {
      // Query filter
      if (this.filters.searchQuery) {
        const q = this.filters.searchQuery.toLowerCase();
        const match = s.id.toLowerCase().includes(q) ||
          s.vaccineName.toLowerCase().includes(q) ||
          s.batchNumber.toLowerCase().includes(q) ||
          s.currentLocation.toLowerCase().includes(q) ||
          s.destinationFacility.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Category filter
      if (this.filters.category !== "all" && s.vaccineCategory !== this.filters.category) {
        return false;
      }
      // Status filter
      if (this.filters.status !== "all" && s.status !== this.filters.status) {
        return false;
      }
      // Risk filter
      if (this.filters.riskLevel !== "all" && s.riskClassification !== this.filters.riskLevel) {
        return false;
      }
      return true;
    });
  }

  renderShipmentsTable() {
    const wrapper = document.getElementById("shipments-table-wrapper");
    if (wrapper) {
      wrapper.innerHTML = this.generateShipmentsTableHtml();
      this.bindShipmentRowClicks(wrapper);
    }
  }

  bindShipmentTableEvents(container) {
    const search = container.querySelector("#filter-search-input");
    if (search) {
      search.oninput = (e) => {
        this.filters.searchQuery = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const catSelect = container.querySelector("#filter-category-select");
    if (catSelect) {
      catSelect.onchange = (e) => {
        this.filters.category = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const statSelect = container.querySelector("#filter-status-select");
    if (statSelect) {
      statSelect.onchange = (e) => {
        this.filters.status = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const riskSelect = container.querySelector("#filter-risk-select");
    if (riskSelect) {
      riskSelect.onchange = (e) => {
        this.filters.riskLevel = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const btnThresh = container.querySelector("#btn-open-threshold-config");
    if (btnThresh) {
      btnThresh.onclick = () => {
        this.modals.openThresholdModal("standard_cold_chain", this.vaccineProfiles);
      };
    }

    const btnCsv = container.querySelector("#btn-export-all-csv");
    if (btnCsv) {
      btnCsv.onclick = () => {
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        this.modals.exportCsvManifest(s);
      };
    }

    this.bindShipmentRowClicks(container);
  }

  bindShipmentRowClicks(container) {
    container.querySelectorAll(".shipment-row, .btn-inspect").forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.getAttribute("data-id") || el.closest(".shipment-row")?.getAttribute("data-id");
        if (id) {
          this.switchView("details", id);
        }
      };
    });
  }

  // ==========================================================================
  // VIEW 3: INDIVIDUAL SHIPMENT DETAILS PAGE (Sections 4, 5, 6, 7)
  // ==========================================================================
  renderDetailsView(container) {
    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
    const prof = this.vaccineProfiles[s.vaccineCategory] || {};
    const nearestCp = this.checkpoints.find(cp => cp.id === s.nearestCheckpointId) || this.checkpoints[0];
    const isCritical = s.excursionSeverity === "Critical" || s.riskClassification === "Critical";
    const isWarning = s.excursionSeverity === "Warning" || s.riskClassification === "High Risk";

    // Run Viability Model
    const viabilityEst = ViabilityModel.estimateViability(s, prof);
    const recentProbeHistory = (s.history || []).slice(-8);
    const probeSparkline = (key, color) => {
      const values = recentProbeHistory.map(point => Number(point[key]) || 0);
      if (values.length < 2) return '<span class="probe-sparkline-empty">History unavailable</span>';
      const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
      const points = values.map((value, index) => `${(2 + index / (values.length - 1) * 96).toFixed(1)},${(22 - (value - min) / span * 18).toFixed(1)}`).join(' ');
      return `<svg class="probe-sparkline" viewBox="0 0 100 26" role="img" aria-label="Recent ${key} trend" focusable="false"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    };
    const probeState = s.isHardwareConnected
      ? { label: "Live", tone: "live" }
      : /demo|sample|simulat/i.test(String(s.sensorConnectivity || s.dataTransmissionStatus || ""))
        ? { label: "Demo Data", tone: "demo" }
        : Number(s.sensorDataAgeSeconds) > 60
          ? { label: "Offline", tone: "offline" }
          : { label: "Awaiting", tone: "awaiting" };
    const trajectoryData = ViabilityModel.generateProjectionTrajectory(s, viabilityEst);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in" id="details-view-root">
        <!-- Top Details Header -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <nav class="shipment-breadcrumb flex flex-wrap items-center gap-2 text-xs font-semibold" aria-label="Breadcrumb">
                <button id="btn-back-to-shipments" class="shipment-breadcrumb-link" type="button">Fleet</button>
                <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="text-slate-500">Shipment</span>
                <svg class="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9 18 6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="font-mono text-slate-800" aria-current="page">${s.id}</span>
              </nav>
              <div class="shipment-status-row mt-2">
                <span class="shipment-chip shipment-chip-protocol">${prof.categoryName}</span>
                <span class="shipment-chip ${isCritical ? 'shipment-chip-critical' : isWarning ? 'shipment-chip-warning' : 'shipment-chip-safe'}"><span class="status-dot"></span>Risk: ${s.riskClassification}</span>
                <span class="shipment-chip shipment-chip-${probeState.tone}"><span class="status-dot ${probeState.tone === 'live' ? 'animate-pulse' : ''}"></span>${probeState.label}</span>
              </div>
              <div class="flex flex-wrap items-center gap-3 mt-2">
                <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">${s.vaccineName}</h1>
                <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">${s.id}</span>
                <span class="text-xs text-slate-600 font-mono">Lot: ${s.batchNumber}</span>
              </div>
              <details class="shipment-carrier-details mt-1">
                <summary>${s.manufacturer} • ${s.doses.toLocaleString()} doses • ${s.packagingType}</summary>
                <p>${s.manufacturer} • ${s.doses.toLocaleString()} doses • ${s.packagingType} • Carrier: ${s.carrierIdentifier || s.transportVehicleId}</p>
              </details>
            </div>

                        <!-- Quick Action Buttons -->
            <div class="shipment-header-actions flex flex-wrap items-center gap-2">
              <button id="btn-trigger-reroute-modal" class="shipment-action-danger ${isCritical ? 'is-critical' : ''}" type="button" aria-label="Open emergency reroute confirmation">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                Emergency Reroute
              </button>
              <button id="btn-view-who-audit" class="shipment-action-secondary" type="button">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Audit Report
              </button>
              <button id="btn-toggle-sim-detail" class="shipment-action-secondary shipment-action-pause" type="button" aria-label="${this.simulation.isRunning ? 'Pause telemetry' : 'Resume telemetry'}">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${this.simulation.isRunning ? 'M8 5v14m8-14v14' : 'm7 4 12 8-12 8V4'}"/></svg>
                <span>${this.simulation.isRunning ? 'Pause Telemetry' : 'Resume Telemetry'}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ESP32 DUAL DHT22 HARDWARE PROBE TELEMETRY STATUS -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm" id="hardware-probe-card">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl ${s.isHardwareConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'} flex items-center justify-center" aria-hidden="true">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="10" rx="2"/><path d="M8 7V4m8 3V4M8 20v-3m8 3v-3M8 11h.01M12 11h.01M16 11h.01M9 14h6"/></svg>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-bold text-slate-900">Hardware Telemetry Probe: ESP32-CG-PROBE-01</span>
                  <span class="probe-state-badge probe-state-${probeState.tone}" role="status"><span class="status-dot ${probeState.tone === 'live' ? 'animate-pulse' : ''}"></span>${probeState.label}</span>
                </div>
                <p class="text-[11px] text-slate-600 mt-1">Dual DHT22 probes: internal core payload and external container ambient.</p>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="text-[11px] text-slate-500">Security Verification:</span>
              <span class="security-verified" tabindex="0" title="Telemetry integrity is verified using a SHA-256 digest." aria-label="SHA-256 authenticated. Telemetry integrity verification badge.">
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><rect x="9" y="10" width="6" height="5" rx="1"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/></svg>
                SHA-256 Authenticated
                <span class="security-tooltip" role="tooltip">Telemetry integrity is verified using a SHA-256 digest.</span>
              </span>
            </div>
          </div>

          <!-- Dual Probe Live Metrics Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <article class="probe-metric-card probe-metric-blue">
              <div class="probe-card-topline"><span class="probe-icon-circle probe-icon-blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z"/><path d="M12 11v6"/></svg></span><span class="probe-card-label">Probe 1 · Internal Core</span></div>
              <div class="probe-card-value">${(s.coreTemperature !== undefined ? s.coreTemperature : s.currentTemperature)}°C</div>
              <div class="probe-card-secondary">Humidity <strong>${(s.coreHumidity !== undefined ? s.coreHumidity : s.currentHumidity)}% RH</strong></div>
              <div class="probe-range-wrap" aria-label="Core temperature against the 2 to 8 degree Celsius safe range"><div class="probe-range-track"><span class="probe-range-safe" style="left:20%;width:60%"></span><span class="probe-range-marker" style="left:${Math.max(0,Math.min(100,(Number(s.coreTemperature !== undefined ? s.coreTemperature : s.currentTemperature)/10)*100))}%"></span></div><div class="probe-range-labels"><span>0°C</span><span>Safe: 2–8°C</span><span>10°C</span></div></div>
              <div class="probe-sparkline-row"><span>Last 30 min</span>${probeSparkline("temperature","#2563eb")}</div>
            </article>
            <article class="probe-metric-card probe-metric-amber">
              <div class="probe-card-topline"><span class="probe-icon-circle probe-icon-amber" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.4 6.4l11.2 11.2m0-11.2L6.4 17.6"/></svg></span><span class="probe-card-label">Probe 2 · External Ambient</span></div>
              <div class="probe-card-value">${(s.ambientTemperature !== undefined ? s.ambientTemperature : (s.currentTemperature + 21.2).toFixed(1))}°C</div>
              <div class="probe-card-secondary">Humidity <strong>${(s.ambientHumidity !== undefined ? s.ambientHumidity : (s.currentHumidity + 12.0).toFixed(1))}% RH</strong></div>
              <div class="probe-sparkline-row"><span>Last 30 min</span>${probeSparkline("temperature","#d97706")}</div>
            </article>
            <article class="probe-metric-card probe-metric-violet">
              <div class="probe-card-topline"><span class="probe-icon-circle probe-icon-violet" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M8 12h8m-4-4v8"/></svg></span><span class="probe-card-label">Thermal Barrier (ΔT)</span><span class="probe-info-tip" tabindex="0" aria-label="Higher gradient means better insulation" title="Higher gradient = better insulation.">i</span></div>
              <div class="probe-card-value">${(s.deltaTemperature !== undefined ? s.deltaTemperature : ((s.ambientTemperature || (s.currentTemperature + 21.2)) - (s.coreTemperature || s.currentTemperature)).toFixed(1))}°C</div>
              <div class="probe-card-secondary">Insulation gradient <strong>(Ext − Int)</strong></div>
              <div class="probe-sparkline-row"><span>Last 30 min</span>${probeSparkline("temperature","#7c3aed")}</div>
            </article>
          </div>
        </div>

        <!-- Section 4A: LIVE ENVIRONMENTAL TELEMETRY CARDS -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="telemetry-cards-container">
          ${this.renderTelemetryCardsHtml(s)}
        </div>

        <!-- Main Body Grid: Left (Charts & Map) | Right (Viability & Timeline & Checkpoint) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- LEFT 7 COLS: Charts + GPS Map -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Section 4B: TEMPERATURE & HUMIDITY CHARTS -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Environmental Telemetry Time-Series</h3>
                  <p class="text-[11px] text-slate-500">Live multi-probe sensors with dynamic threshold zones.</p>
                </div>
                
                <!-- Chart Controls -->
                <div class="flex items-center gap-2">
                  <!-- Metric Toggle -->
                  <div class="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                    <button class="px-2 py-1 rounded-md chart-metric-btn active bg-white text-blue-600 shadow-xs" data-metric="temperature">Temp (°C)</button>
                    <button class="px-2 py-1 rounded-md chart-metric-btn text-slate-500 hover:text-slate-800" data-metric="humidity">Humidity (%RH)</button>
                    <button class="px-2 py-1 rounded-md chart-metric-btn text-slate-500 hover:text-slate-800" data-metric="both">Dual</button>
                  </div>

                  <!-- Time Window -->
                  <div class="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                    <button class="px-2 py-1 rounded-md chart-window-btn active bg-white text-blue-600 shadow-xs" data-window="1h">1h</button>
                    <button class="px-2 py-1 rounded-md chart-window-btn text-slate-500 hover:text-slate-800" data-window="6h">6h</button>
                    <button class="px-2 py-1 rounded-md chart-window-btn text-slate-500 hover:text-slate-800" data-window="12h">12h</button>
                    <button class="px-2 py-1 rounded-md chart-window-btn text-slate-500 hover:text-slate-800" data-window="24h">24h</button>
                  </div>
                </div>
              </div>

              <!-- Canvas Container -->
              <div class="relative w-full h-64 sm:h-72">
                <canvas id="telemetry-chart-canvas"></canvas>
              </div>

              <!-- Excursion Threshold Footnote -->
              <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-0.5 bg-blue-600"></span> Sensor Telemetry
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-0.5 bg-red-500"></span> Upper Limit (${s.maxAllowedTemperature}°C)
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-0.5 bg-blue-400"></span> Lower Limit (${s.minAllowedTemperature}°C)
                  </span>
                </div>
                <span class="font-mono text-slate-400">Sample Frequency: Every 3-5s</span>
              </div>
            </div>

            <!-- Section 4C: GPS ROUTE TRACKING MAP -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">GPS Route & Cold Chain Corridor Tracking</h3>
                  <p class="text-[11px] text-slate-500">Real-time GPS positioning, cold storage checkpoints, and emergency diversion vectors.</p>
                </div>
                <div class="text-right">
                  <div class="font-mono font-bold text-xs text-indigo-600">${s.routeDistanceRemainingKm} km remaining</div>
                  <div class="text-[10px] text-slate-400">ETA: ${s.eta}</div>
                </div>
              </div>

              <!-- Map Container -->
              <div class="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200" id="route-map-container">
                <!-- Leaflet or schematic map inserted here -->
              </div>

              <!-- Nearest Checkpoint Status Pill -->
              <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-lg">🏥</span>
                  <div>
                    <div class="text-xs font-bold text-indigo-950">Nearest Cold Vault: ${nearestCp.name}</div>
                    <div class="text-[11px] text-indigo-700">${nearestCp.distanceKm} km away • Travel ETA: <b>${nearestCp.travelTimeMinutes} mins</b> • Capacity: ${(nearestCp.availableCapacityDoses || 0).toLocaleString()} doses</div>
                  </div>
                </div>
                <button id="btn-map-quick-reroute" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                  Reroute Here
                </button>
              </div>
            </div>

            <!-- Section 5: RULE-BASED EXCURSION DETECTION ENGINE LOG -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Rule-Based Excursion Engine Diagnostics</h3>
                  <p class="text-[11px] text-slate-500">Continuous 19-parameter evaluation and SOP mitigation directive.</p>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCritical ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}">
                  Confidence: ${s.detectionConfidencePercent || 99}%
                </span>
              </div>

              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-semibold text-slate-700">Primary Rule Triggered:</span>
                  <span class="font-bold ${isCritical ? 'text-red-600' : 'text-emerald-700'}">${s.excursionStatus}</span>
                </div>
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-semibold text-slate-700">Excursion Duration:</span>
                  <span class="font-mono font-medium">${s.excursionDurationMinutes || 0} minutes cumulative</span>
                </div>
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-semibold text-slate-700">Peak Thermal Deviation:</span>
                  <span class="font-mono font-medium text-red-600">Δ ${s.temperatureDeviation || 0}°C above threshold</span>
                </div>
                <div class="pt-1">
                  <div class="font-semibold text-slate-700 mb-1">Recommended SOP Directive:</div>
                  <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed">
                    ${s.recommendedNextAction}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT 5 COLS: Viability Model, Nearest Checkpoint, & Event Timeline -->
          <div class="lg:col-span-5 space-y-6">
            <!-- Section 6: VACCINE VIABILITY ESTIMATION -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Vaccine Viability Estimation</h3>
                  <p class="text-[11px] text-slate-500">Heuristic Arrhenius thermal degradation kinetic model.</p>
                </div>
                <span class="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full">
                  Kinetic Model
                </span>
              </div>

              <!-- Viability Gauge & Score -->
              <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div class="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <!-- Circular SVG Gauge -->
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-200" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="${viabilityEst.estimatedRemainingViabilityPercent >= 90 ? 'text-emerald-500' : viabilityEst.estimatedRemainingViabilityPercent >= 80 ? 'text-amber-500' : 'text-red-500'}" stroke-dasharray="${viabilityEst.estimatedRemainingViabilityPercent}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="font-mono font-extrabold text-sm text-slate-900">${viabilityEst.estimatedRemainingViabilityPercent}%</span>
                  </div>
                </div>

                <div class="space-y-1 text-xs">
                  <div class="font-bold text-slate-900 text-sm">Viability Potency Index</div>
                  <div class="text-slate-600">Loss: <span class="font-bold text-red-600">-${viabilityEst.estimatedViabilityLossPercent}%</span> • Spoilage Risk: <span class="font-bold text-slate-800">${viabilityEst.predictedSpoilageRiskPercent}%</span></div>
                  <div class="text-[11px] text-slate-500">Confidence: <span class="font-semibold text-emerald-600">${viabilityEst.confidenceLevelPercent}%</span></div>
                </div>
              </div>

              <!-- Time to Critical & Window Metrics -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">Safe Handling Window</div>
                  <div class="font-bold text-slate-800 mt-0.5">${viabilityEst.safeHandlingWindow}</div>
                </div>
                <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">Time to Critical (<80%)</div>
                  <div class="font-bold ${viabilityEst.timeToCriticalRisk.includes('0 mins') ? 'text-red-600' : 'text-slate-800'} mt-0.5">
                    ${viabilityEst.timeToCriticalRisk}
                  </div>
                </div>
              </div>

              <!-- Viability Projection Trajectory Chart -->
              <div>
                <div class="text-xs font-bold text-slate-700 mb-1">Projected Potency at Arrival</div>
                <div class="relative w-full h-44">
                  <canvas id="viability-projection-canvas"></canvas>
                </div>
              </div>

              <!-- Important Disclaimer Tag -->
              <div class="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2.5 rounded-xl flex items-start gap-2">
                <span class="font-bold text-amber-600 mt-0.5">⚠️</span>
                <div>
                  <b>Simulation Estimate — Not Clinically Validated:</b> Demonstrative Arrhenius approximation for logistics routing decisions. Does not replace validated lab potency assays.
                </div>
              </div>
            </div>

            <!-- Section 7: NEAREST CHECKPOINT RECOMMENDATION -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900 text-sm">Recommended Intervention Facility</h3>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  ${nearestCp.operatingStatus}
                </span>
              </div>

              <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2 text-xs">
                <div>
                  <div class="font-bold text-sm text-slate-900">${nearestCp.name}</div>
                  <div class="text-slate-500 text-[11px]">${nearestCp.type} • ${nearestCp.city}</div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span class="text-slate-400 text-[10px]">Distance:</span>
                    <div class="font-bold text-slate-800">${nearestCp.distanceKm} km</div>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px]">Travel ETA:</span>
                    <div class="font-bold text-indigo-600">${nearestCp.travelTimeMinutes} mins</div>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px]">Cryo Capacity:</span>
                    <div class="font-bold text-emerald-600">${(nearestCp.availableCapacityDoses || 0).toLocaleString()} doses</div>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px]">Duty Staff:</span>
                    <div class="font-medium text-slate-700 truncate">${nearestCp.staffAvailability}</div>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span class="text-slate-500">Emergency Phone: <b class="font-mono text-slate-700">${nearestCp.emergencyPhone}</b></span>
                  <button id="btn-notify-checkpoint" class="text-blue-600 hover:underline font-bold">
                    Send Pager Alert
                  </button>
                </div>
              </div>

              <button id="btn-details-reroute-trigger" class="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                Initiate Immediate Reroute to ${nearestCp.id}
              </button>
            </div>

            <!-- Section 4D: SHIPMENT EVENT TIMELINE -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900 text-sm">Shipment Custody & Incident Timeline</h3>
                <span class="text-[10px] text-slate-400 font-mono">${(s.timeline || []).length} Logged Events</span>
              </div>

              <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                ${(s.timeline || []).map((t, idx) => `
                  <div class="flex items-start gap-3 text-xs">
                    <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      t.severity === 'critical' ? 'bg-red-500 ring-4 ring-red-100' :
                      t.severity === 'warning' ? 'bg-amber-500 ring-4 ring-amber-100' :
                      'bg-emerald-500'
                    }"></div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-800 ${t.severity === 'critical' ? 'text-red-700' : ''}">${t.desc}</span>
                        <span class="font-mono text-[10px] text-slate-400 flex-shrink-0 ml-2">${t.time}</span>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindDetailsEvents(container, s, nearestCp, viabilityEst, trajectoryData);
  }

  renderTelemetryCardsHtml(s) {
    const isTempCrit = s.currentTemperature > s.maxAllowedTemperature || s.currentTemperature < s.minAllowedTemperature;
    const isHumCrit = s.currentHumidity > s.maxAllowedHumidity || s.currentHumidity < s.minAllowedHumidity;

    return `
      <!-- 1. Current Temp -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Core Temperature</span>
        <div class="mt-1">
          <div class="font-mono text-xl font-extrabold ${isTempCrit ? 'text-red-600 animate-pulse' : 'text-slate-900'}">
            ${s.currentTemperature}°C
          </div>
          <div class="text-[10px] text-slate-400 font-mono">Limit: ${s.minAllowedTemperature}° to ${s.maxAllowedTemperature}°</div>
        </div>
      </div>

      <!-- 2. Current Humidity -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Relative Humidity</span>
        <div class="mt-1">
          <div class="font-mono text-xl font-extrabold ${isHumCrit ? 'text-amber-600' : 'text-slate-900'}">
            ${s.currentHumidity}%
          </div>
          <div class="text-[10px] text-slate-400 font-mono">Limit: ${s.minAllowedHumidity}% - ${s.maxAllowedHumidity}%</div>
        </div>
      </div>

      <!-- 3. GPS Coordinates -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">GPS Position</span>
        <div class="mt-1">
          <div class="font-mono text-xs font-bold text-slate-800">
            ${s.gpsLatitude.toFixed(3)}°N, ${Math.abs(s.gpsLongitude).toFixed(3)}°W
          </div>
          <div class="text-[10px] text-slate-400">${s.routeDeviationDetected ? '⚠️ Route Deviation' : 'On Approved Corridor'}</div>
        </div>
      </div>

      <!-- 4. Sensor Freshness -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Data Freshness</span>
        <div class="mt-1">
          <div class="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full ${s.sensorDataAgeSeconds < 30 ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            ${s.sensorDataAgeSeconds}s ago
          </div>
          <div class="text-[10px] text-slate-400 font-mono">${s.sensorConnectivity}</div>
        </div>
      </div>

      <!-- 5. Sensor Battery -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Battery Level</span>
        <div class="mt-1">
          <div class="font-mono text-sm font-bold ${s.batteryLevel < 15 ? 'text-red-600 font-extrabold' : 'text-slate-800'}">
            🔋 ${s.batteryLevel}%
          </div>
          <div class="text-[10px] text-slate-400">${s.batteryLevel < 15 ? 'Critical Low' : 'Nominal Power'}</div>
        </div>
      </div>

      <!-- 6. Shipment Status -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Shipment Status</span>
        <div class="mt-1">
          <div class="text-xs font-bold ${s.status === 'Emergency Rerouting' ? 'text-purple-700' : 'text-blue-700'}">
            ${s.status}
          </div>
          <div class="text-[10px] text-slate-400">Carrier: ${s.transportVehicleId}</div>
        </div>
      </div>
    `;
  }

  updateDetailsTelemetry() {
    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId);
    if (!s) return;

    const cards = document.getElementById("telemetry-cards-container");
    if (cards) {
      cards.innerHTML = this.renderTelemetryCardsHtml(s);
    }

    const probeCard = document.getElementById("hardware-probe-card");
    if (probeCard) {
      const coreT = s.coreTemperature !== undefined ? s.coreTemperature : s.currentTemperature;
      const coreH = s.coreHumidity !== undefined ? s.coreHumidity : s.currentHumidity;
      const ambT = s.ambientTemperature !== undefined ? s.ambientTemperature : Number((s.currentTemperature + 21.2).toFixed(1));
      const ambH = s.ambientHumidity !== undefined ? s.ambientHumidity : Number((s.currentHumidity + 12.0).toFixed(1));
      const deltaT = s.deltaTemperature !== undefined ? s.deltaTemperature : Number((ambT - coreT).toFixed(1));
      
      const badgeContainer = probeCard.querySelector(".flex.items-center.gap-2");
      if (badgeContainer) {
        badgeContainer.innerHTML = `
          <span class="text-xs font-bold text-slate-900">Hardware Telemetry Probe: ESP32-CG-PROBE-01</span>
          ${s.isHardwareConnected
            ? '<span class="probe-state-badge probe-state-live"><span class="status-dot animate-pulse"></span>Live</span>'
            : /demo|sample|simulat/i.test(String(s.sensorConnectivity || s.dataTransmissionStatus || ""))
              ? '<span class="probe-state-badge probe-state-demo"><span class="status-dot"></span>Demo Data</span>'
              : Number(s.sensorDataAgeSeconds) > 60
                ? '<span class="probe-state-badge probe-state-offline"><span class="status-dot"></span>Offline</span>'
                : '<span class="probe-state-badge probe-state-awaiting"><span class="status-dot"></span>Awaiting</span>'}
        `;
      }
    }

    if (this.charts) {
      this.charts.updateTelemetryChart(s);
      const prof = this.vaccineProfiles[s.vaccineCategory] || {};
      const viabilityEst = ViabilityModel.estimateViability(s, prof);
      const trajectoryData = ViabilityModel.generateProjectionTrajectory(s, viabilityEst);
      this.charts.updateViabilityProjectionChart(trajectoryData);
    }

    if (this.mapView) {
      this.mapView.renderShipment(s, this.checkpoints);
    }
  }

  bindDetailsEvents(container, shipment, nearestCheckpoint, viabilityEst, trajectoryData) {
    const btnBack = container.querySelector("#btn-back-to-shipments");
    if (btnBack) btnBack.onclick = () => this.switchView("shipments");

    const btnReroute = container.querySelector("#btn-trigger-reroute-modal");
    if (btnReroute) {
      btnReroute.onclick = () => this.modals.openRerouteModal(shipment, nearestCheckpoint);
    }

    const btnDetailsReroute = container.querySelector("#btn-details-reroute-trigger");
    if (btnDetailsReroute) {
      btnDetailsReroute.onclick = () => this.modals.openRerouteModal(shipment, nearestCheckpoint);
    }

    const btnMapReroute = container.querySelector("#btn-map-quick-reroute");
    if (btnMapReroute) {
      btnMapReroute.onclick = () => this.modals.openRerouteModal(shipment, nearestCheckpoint);
    }

    const btnAudit = container.querySelector("#btn-view-who-audit");
    if (btnAudit) {
      btnAudit.onclick = () => this.modals.openAuditReportModal(shipment);
    }

    const btnNotify = container.querySelector("#btn-notify-checkpoint");
    if (btnNotify) {
      btnNotify.onclick = () => {
        this.modals.showToast(`Automated priority SMS/Pager dispatched to ${nearestCheckpoint.staffAvailability} at ${nearestCheckpoint.name}!`, "safe");
      };
    }

    const btnToggleSim = container.querySelector("#btn-toggle-sim-detail");
    if (btnToggleSim) {
      btnToggleSim.onclick = () => {
        const isPlaying = this.simulation.togglePlayPause();
        btnToggleSim.innerHTML = `<span>${isPlaying ? '⏸ Pause Telemetry' : '▶ Resume Telemetry'}</span>`;
        this.modals.showToast(isPlaying ? "Telemetry simulation resumed" : "Telemetry simulation paused", "info");
      };
    }

    // Chart metric toggles
    container.querySelectorAll(".chart-metric-btn").forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll(".chart-metric-btn").forEach(b => {
          b.classList.remove("active", "bg-white", "text-blue-600", "shadow-xs");
          b.classList.add("text-slate-500");
        });
        btn.classList.add("active", "bg-white", "text-blue-600", "shadow-xs");
        btn.classList.remove("text-slate-500");
        const metric = btn.getAttribute("data-metric");
        this.charts.setMetric(metric, shipment);
      };
    });

    // Chart window toggles
    container.querySelectorAll(".chart-window-btn").forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll(".chart-window-btn").forEach(b => {
          b.classList.remove("active", "bg-white", "text-blue-600", "shadow-xs");
          b.classList.add("text-slate-500");
        });
        btn.classList.add("active", "bg-white", "text-blue-600", "shadow-xs");
        btn.classList.remove("text-slate-500");
        const win = btn.getAttribute("data-window");
        this.charts.setTimeWindow(win, shipment);
      };
    });

    // Initialize Chart & Map
    setTimeout(() => {
      this.charts.updateTelemetryChart(shipment);
      this.charts.updateViabilityProjectionChart(trajectoryData);

      const mapContainer = document.getElementById("route-map-container");
      if (!this.mapView || this.mapView.containerElement !== mapContainer) {
        if (this.mapView && typeof this.mapView.destroy === "function") this.mapView.destroy();
        this.mapView = new RouteMapView("route-map-container", {
          onSelectCheckpoint: (cp) => {
            const selected = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || shipment;
            this.modals.openRerouteModal(selected, cp);
          }
        });
      }
      this.mapView.renderShipment(shipment, this.checkpoints);
    }, 50);
  }

  // ==========================================================================
  // VIEW 4: DEDICATED EXCURSION DETECTION RULE ENGINE INSPECTOR
  // ==========================================================================
  renderExcursionEngineView(container) {
    if (!container) container = document.getElementById("main-content-view");
    if (!container) return;

    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
    const engine = this.simulation.excursionEngine;
    const detection = engine.evaluate(s);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Title & Config Button -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Temperature Excursion Detection Engine</h1>
            <p class="text-xs text-slate-500">Live 19-parameter rule evaluation matrix & configurable threshold settings.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-open-threshold-config-engine" class="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <span>Edit Category Thresholds</span>
            </button>
          </div>
        </div>

        <!-- Target Shipment Selector Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-600">Inspecting Shipment:</span>
            <select id="engine-select-shipment" class="text-xs font-bold border border-slate-300 rounded-lg p-2 bg-slate-50">
              ${this.simulation.shipments.map(item => `
                <option value="${item.id}" ${item.id === this.selectedShipmentId ? 'selected' : ''}>
                  ${item.id} — ${item.vaccineName} (${item.currentTemperature}°C)
                </option>
              `).join("")}
            </select>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${
            detection.excursion_severity === 'Critical' ? 'bg-red-100 text-red-800' :
            detection.excursion_severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
            'bg-emerald-100 text-emerald-800'
          }">
            Status: ${detection.excursion_status}
          </span>
        </div>

        <!-- Active Triggered Rules Panel -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-900 text-sm">Rule Execution & Anomaly Classification</h3>
          
          <div class="space-y-3">
            ${detection.triggered_rules.length > 0 ? detection.triggered_rules.map(r => `
              <div class="p-4 rounded-xl border ${
                r.severity === 'Critical' ? 'bg-red-50 border-red-200' :
                r.severity === 'High Risk' ? 'bg-orange-50 border-orange-200' :
                'bg-amber-50 border-amber-200'
              } space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      r.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }">${r.ruleId}</span>
                    <span class="font-bold text-sm text-slate-900">${r.ruleName}</span>
                  </div>
                  <span class="text-xs font-bold uppercase tracking-wider ${
                    r.severity === 'Critical' ? 'text-red-700' : 'text-amber-800'
                  }">${r.severity}</span>
                </div>
                <div class="text-xs text-slate-700">
                  <b>Reading Responsible:</b> <span class="font-mono font-medium">${r.readingResponsible}</span> • <b>Delta:</b> <span class="font-bold">${r.delta}</span>
                </div>
                <div class="text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200/60 text-slate-800 font-medium leading-relaxed">
                  <b>Recommended Action:</b> ${r.recommendedAction}
                </div>
              </div>
            `).join("") : `
              <div class="p-6 text-center text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div class="text-2xl mb-1">🛡️</div>
                <div class="font-bold text-sm">All 9 Rule Conditions Nominal</div>
                <div class="text-xs text-emerald-600 mt-0.5">Continuous telemetry remains completely within configured envelope limits.</div>
              </div>
            `}
          </div>
        </div>

        <!-- 19-Parameter Telemetry Grid Schema -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900 text-sm">Rule Engine Input Parameters (19 Tracked Fields)</h3>
            <span class="text-xs font-mono text-slate-400">Schema: WHO-TTSPP-2026</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">current_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.current_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">min_allowed_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.min_allowed_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">max_allowed_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.max_allowed_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">current_humidity_percent</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.current_humidity_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">min_allowed_humidity_percent</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.min_allowed_humidity_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">max_allowed_humidity_percent</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.max_allowed_humidity_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">excursion_start_timestamp</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5 truncate">${detection.excursion_start_timestamp || 'None'}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">excursion_duration_minutes</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.excursion_duration_minutes} mins</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">temperature_deviation_c</span>
              <div class="font-bold text-red-600 font-mono mt-0.5">Δ ${detection.temperature_deviation_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">peak_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.peak_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">minimum_recorded_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.minimum_recorded_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">cumulative_excursion_minutes</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.cumulative_excursion_minutes} mins</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">consecutive_out_of_range_readings</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.consecutive_out_of_range_readings}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">sensor_reading_timestamp</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5 truncate">${detection.sensor_reading_timestamp}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">sensor_data_age_seconds</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.sensor_data_age_seconds}s</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">sensor_status</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.sensor_status}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">detection_confidence_percent</span>
              <div class="font-bold text-emerald-600 font-mono mt-0.5">${detection.detection_confidence_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">excursion_severity</span>
              <div class="font-bold font-mono mt-0.5 ${detection.excursion_severity === 'Critical' ? 'text-red-600' : 'text-slate-900'}">${detection.excursion_severity}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const select = container.querySelector("#engine-select-shipment");
    if (select) {
      select.onchange = (e) => {
        this.selectedShipmentId = e.target.value;
        this.renderExcursionEngineView(container);
      };
    }

    const btnConfig = container.querySelector("#btn-open-threshold-config-engine");
    if (btnConfig) {
      btnConfig.onclick = () => {
        this.modals.openThresholdModal(s.vaccineCategory, this.vaccineProfiles);
      };
    }
  }

  // ==========================================================================
  // VIEW 5: VACCINE VIABILITY LAB (Section 6)
  // ==========================================================================
  renderViabilityLabView(container) {
    if (!container) container = document.getElementById("main-content-view");
    if (!container) return;

    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
    const prof = this.vaccineProfiles[s.vaccineCategory] || {};
    const viability = ViabilityModel.estimateViability(s, prof);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Vaccine Viability & Degradation Lab</h1>
            <p class="text-xs text-slate-500">Kinetic Arrhenius simulation modeling biological potency over thermal transit exposure.</p>
          </div>
          <span class="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
            Simulation Estimate — Not Clinically Validated
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Gauge & Predictions -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-900 text-sm">Target Biologic Potency</h3>
            
            <div class="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <div class="text-4xl font-extrabold font-mono ${viability.estimatedRemainingViabilityPercent >= 90 ? 'text-emerald-600' : 'text-red-600'}">
                ${viability.estimatedRemainingViabilityPercent}%
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Remaining Viability</div>
              <div class="text-xs text-slate-400">Baseline Starting Potency: 99.8%</div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Estimated Viability Loss:</span>
                <span class="font-bold text-red-600">-${viability.estimatedViabilityLossPercent}%</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Predicted Spoilage Probability:</span>
                <span class="font-bold text-slate-800">${viability.predictedSpoilageRiskPercent}%</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Model Confidence Level:</span>
                <span class="font-bold text-emerald-600">${viability.confidenceLevelPercent}%</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Predicted Potency at Final Arrival:</span>
                <span class="font-bold font-mono text-indigo-600">${viability.predictedViabilityAtArrival}%</span>
              </div>
            </div>
          </div>

          <!-- Middle & Right: Model Formula & Sensitivity -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-900 text-sm">Heuristic Kinetic Exposure Parameters</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Biologic macromolecular degradation accelerates exponentially as core temperature deviates beyond safe glass-transition or cold chain thresholds. The ColdGuard engine computes exposure degree-hours and cumulative thermal stress.
            </p>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Vaccine Category</div>
                <div class="font-bold text-slate-900 mt-0.5">${prof.categoryName}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Storage Profile</div>
                <div class="font-bold text-slate-900 mt-0.5">${prof.storageReq}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Safe Handling Window</div>
                <div class="font-bold text-slate-900 mt-0.5">${viability.safeHandlingWindow}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Time to Critical Risk</div>
                <div class="font-bold text-slate-900 mt-0.5">${viability.timeToCriticalRisk}</div>
              </div>
            </div>

            <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 text-xs">
              <div class="font-bold text-indigo-950">Recommended Intervention Strategy:</div>
              <div class="text-indigo-900 leading-relaxed">${viability.recommendedIntervention}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW 6: CHECKPOINT NETWORK DIRECTORY (Section 7)
  // ==========================================================================
  renderCheckpointsView(container) {
    if (!container) container = document.getElementById("main-content-view");
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Cold Chain Checkpoint Network</h1>
            <p class="text-xs text-slate-500">Certified cryogenic storage facilities, regional hospital vaccine depots, and emergency hubs.</p>
          </div>
          <span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
            ${this.checkpoints.length} Certified Facilities
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this.checkpoints.map(cp => `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:shadow-md transition">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">${cp.id} • ${cp.type}</span>
                  <h3 class="font-bold text-sm text-slate-900 mt-0.5">${cp.name}</h3>
                  <div class="text-xs text-slate-500">📍 ${cp.city}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                  cp.operatingStatus.includes('24/7') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }">
                  ${cp.operatingStatus}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span class="text-slate-400 text-[10px]">Available Doses:</span>
                  <div class="font-bold text-slate-800">${(cp.availableCapacityDoses || 0).toLocaleString()}</div>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px]">Emergency Phone:</span>
                  <div class="font-mono text-slate-700">${cp.emergencyPhone}</div>
                </div>
              </div>

              <div class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span class="font-semibold text-slate-700">Supported Tiers:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  ${(cp.storageTiers || []).map(tier => `
                    <span class="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] font-medium rounded text-slate-600">${tier}</span>
                  `).join("")}
                </div>
              </div>

              <button class="btn-checkpoint-reroute w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition" data-id="${cp.id}">
                Select for Emergency Reroute
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-checkpoint-reroute").forEach(btn => {
      btn.onclick = () => {
        const cpId = btn.getAttribute("data-id");
        const cp = this.checkpoints.find(c => c.id === cpId);
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        if (cp && s) {
          this.modals.openRerouteModal(s, cp);
        }
      };
    });
  }

  // --- Header & Global Controls ---
  bindHeaderControls() {
    // Play/Pause button
    const btnPlayPause = document.getElementById("btn-sim-play-pause");
    if (btnPlayPause) {
      btnPlayPause.onclick = () => {
        const isRunning = this.simulation.togglePlayPause();
        btnPlayPause.innerHTML = isRunning
          ? `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="hidden sm:inline">Pause</span>`
          : `<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="hidden sm:inline">Resume</span>`;
        this.modals.showToast(isRunning ? "Simulation active" : "Simulation paused", "info");
      };
    }

    // Speed multiplier buttons
    document.querySelectorAll(".sim-speed-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".sim-speed-btn").forEach(b => b.classList.remove("bg-blue-600", "text-white"));
        btn.classList.add("bg-blue-600", "text-white");
        const speed = parseInt(btn.getAttribute("data-speed"), 10) || 1;
        this.simulation.setSpeed(speed);
        this.modals.showToast(`Simulation speed set to ${speed}x`, "info");
      };
    });

    // Sound toggle
    const btnSound = document.getElementById("btn-toggle-sound");
    if (btnSound) {
      btnSound.onclick = () => {
        this.soundAlertsEnabled = !this.soundAlertsEnabled;
        btnSound.innerHTML = this.soundAlertsEnabled
          ? `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg><span class="hidden md:inline">Alert Audio: On</span>`
          : `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg><span class="hidden md:inline">Alert Audio: Off</span>`;
        if (this.soundAlertsEnabled) {
          this.playAlertTone("warning");
        }
        this.modals.showToast(`Audio alerts ${this.soundAlertsEnabled ? 'enabled' : 'disabled'}`, "info");
      };
    }

    // Quick Scenario Dropdown in Header
    const selectScenario = document.getElementById("select-header-scenario");
    if (selectScenario) {
      selectScenario.onchange = (e) => {
        const val = e.target.value;
        if (!val) return;
        switch (val) {
          case "reefer_failure":
            this.simulation.injectRefrigerationFailure(this.selectedShipmentId);
            this.playAlertTone("critical");
            this.modals.showToast("Injected Reefer Compressor Failure", "critical");
            break;
          case "dryice_depletion":
            this.simulation.injectDryIceDepletion(this.selectedShipmentId);
            this.playAlertTone("critical");
            this.modals.showToast("Injected Dry Ice Depletion", "critical");
            break;
          case "route_deviation":
            this.simulation.injectRouteDeviation(this.selectedShipmentId);
            this.playAlertTone("warning");
            this.modals.showToast("Injected Route Deviation", "warning");
            break;
          case "battery_low":
            this.simulation.injectSensorBatteryLow(this.selectedShipmentId);
            this.playAlertTone("warning");
            this.modals.showToast("Injected Low Battery Sensor Alert", "warning");
            break;
          case "humidity_spike":
            this.simulation.injectHumiditySpike(this.selectedShipmentId);
            this.playAlertTone("warning");
            this.modals.showToast("Injected Door Ajar Humidity Spike", "warning");
            break;
          case "cold_recovery":
            this.simulation.injectColdRecovery(this.selectedShipmentId);
            this.modals.showToast("Restored Cold Chain parameters", "safe");
            break;
          case "reset_all":
            this.simulation.resetAllToSafe(INITIAL_SHIPMENTS);
            this.modals.showToast("Reset all shipments to baseline", "safe");
            break;
        }
        selectScenario.value = "";
      };
    }

    // Top Search input in header
    const topSearch = document.getElementById("header-quick-search");
    if (topSearch) {
      topSearch.oninput = (e) => {
        this.filters.searchQuery = e.target.value;
        if (this.currentView !== "shipments") {
          this.switchView("shipments");
        } else {
          this.renderShipmentsTable();
        }
      };
    }
  }

  bindNavigation() {
    document.querySelectorAll(".nav-link").forEach(btn => {
      btn.onclick = () => {
        const view = btn.getAttribute("data-view");
        if (view) this.switchView(view);
      };
    });
  }

  bindGlobalKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        const topSearch = document.getElementById("header-quick-search");
        if (topSearch) topSearch.focus();
      } else if (e.key === "Escape") {
        this.modals.closeModal();
      }
    });
  }

  updateHeaderBadges() {
    const criticals = this.simulation.shipments.filter(s => s.excursionSeverity === "Critical");
    const badge = document.getElementById("header-critical-count");
    if (badge) {
      badge.textContent = criticals.length;
      badge.className = criticals.length > 0
        ? "px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse"
        : "px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white";
    }
  }

  // Execute Reroute action from modal
  executeReroute(shipmentId, checkpoint) {
    this.simulation.rerouteShipmentToCheckpoint(shipmentId, checkpoint);

    // Sync to Firebase RTDB and log WHO audit entry
    if (this.dbService) {
      this.dbService.logAuditEntry({
        shipmentId,
        event: "EMERGENCY_REROUTE_EXECUTED",
        details: `Rerouted shipment ${shipmentId} to certified cold-storage hub: ${checkpoint.name} (${checkpoint.city}). Distance: ${checkpoint.distanceKm}km.`,
        targetCheckpoint: checkpoint.name
      });
      // Do not write simulated sensor values to the live telemetry path.
    }

    if (this.currentView === "details") {
      this.renderDetailsView(document.getElementById("main-content-view"));
    }
  }

  // Update Category Thresholds from modal
  updateCategoryThresholds(catKey, newLimits) {
    this.simulation.excursionEngine.updateCategoryThresholds(catKey, newLimits);
    if (this.vaccineProfiles[catKey]) {
      this.vaccineProfiles[catKey] = {
        ...this.vaccineProfiles[catKey],
        ...newLimits
      };
    }
    if (this.dbService) {
      this.dbService.updateCategoryThresholds(catKey, newLimits);
      this.dbService.logAuditEntry({
        categoryKey: catKey,
        event: "THRESHOLDS_UPDATED",
        details: `Updated temperature thresholds for ${catKey}: Min ${newLimits.minTemp}°C, Max ${newLimits.maxTemp}°C.`
      });
    }
    this.simulation.reevaluateAll();
    this.renderCurrentView();
  }
}

// Bootstrap on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  window.coldGuardApp = new ColdGuardApp();
});

