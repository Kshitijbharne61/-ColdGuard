// ============================================================================
// ColdGuard — Live Firebase Realtime Database Service
// "Protect Every Dose. Predict Every Excursion."
// Realtime Telemetry, Live Excursions, Checkpoint Sync & Audit Logging
// ============================================================================

export class FirebaseDatabaseService {
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

      // Keep a bounded rolling history: one actual sensor sample per minute for the latest 120 minutes.
      // Refreshing the current minute slot avoids an unbounded stream of new history records.
      if (reading.temperature !== null && reading.temperature !== undefined && Number.isFinite(Number(reading.temperature))) {
        const minuteSlot = String(Math.floor(now / 60000) % 120);
        updates[`shipments/${shipmentId}/telemetry/history/${minuteSlot}`] = {
          temperature: Number(reading.temperature),
          timestamp: now,
          source: "sensor"
        };
      }

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
