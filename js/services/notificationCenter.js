/* ColdGuard notification center — UI and delivery orchestration.
 * Existing excursion checks stay in shipmentManagementAlerts.js / the simulation engine.
 */
(function () {
  "use strict";

  var KEY = "coldguard-notification-center-v1";
  var SETTINGS_KEY = "coldguard-notification-settings-v1";
  var app = null;
  var providerHealth = { demoMode: true, providers: {} };
  var events = [];
  var candidates = Object.create(null);
  var latestByCondition = Object.create(null);
  var prefs = defaultSettings();
  var digestTimer = null;
  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  };
  var uid = function () {
    return app && app.currentUser && !app.currentUser.isDemo ? app.currentUser.uid : "demo";
  };
  var liveUser = function () {
    return app && app.currentUser && !app.currentUser.isDemo && app.currentUser.uid ? app.currentUser : null;
  };
  var database = function () {
    try { return app && app.dbService && app.dbService.db || (window.firebase && window.firebase.app().database()); }
    catch (_) { return null; }
  };
  var nowIso = function () { return new Date().toISOString(); };
  var id = function () {
    return "CGAL-" + (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).replace(/-/g, "").slice(0, 18).toUpperCase();
  };
  var defaultsBySeverity = {
    INFO: ["in_app", "daily_digest"],
    WARNING: ["in_app", "push", "email"],
    CRITICAL: ["in_app", "push", "sms", "telegram", "whatsapp", "email"]
  };

  function defaultSettings() {
    return {
      role: "logistics_admin",
      roles: {
        driver: { enabled: true, channels: ["in_app", "push", "sms"] },
        hub_manager: { enabled: true, channels: ["in_app", "push", "email"] },
        logistics_admin: { enabled: true, channels: ["in_app", "push", "sms", "telegram", "whatsapp", "email"] }
      },
      channels: { in_app: true, push: true, email: true, sms: true, telegram: false, whatsapp: false, daily_digest: true, weekly_digest: false },
      severityChannels: {
        INFO: ["in_app", "daily_digest"],
        WARNING: ["in_app", "push", "email"],
        CRITICAL: ["in_app", "push", "sms", "telegram", "whatsapp", "email"]
      },
      minimumSeverity: "INFO",
      quietHours: { enabled: false, start: "22:00", end: "07:00", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" },
      contacts: { email: "", phone: "", telegramChatId: "", whatsappPhone: "", pushToken: "" },
      debounceReads: 2,
      reminderCooldownMinutes: 15,
      criticalEscalationMinutes: 5,
      warningEscalationMinutes: 15,
      repeatEveryMinutes: 10,
      escalationChain: ["driver", "hub_manager", "logistics_admin"],
      digest: { daily: true, weekly: false, hour: "08:00" },
      updatedAt: null
    };
  }

  function loadLocal(key, fallback) {
    try {
      var value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch (_) { return fallback; }
  }
  function saveLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Storage disabled: keep in memory. */ }
  }
  function storeEvents() { saveLocal(KEY + ":" + uid(), events.slice(-300)); }
  function getAllEvents() {
    return events.slice().sort(function (a, b) { return Date.parse(b.detectedAt || 0) - Date.parse(a.detectedAt || 0); });
  }
  function addTimeline(alert, event, details) {
    alert.timeline = alert.timeline || [];
    alert.timeline.push({ event: event, at: nowIso(), details: details || "" });
  }
  function readTemperature(shipment) {
    var value = shipment && shipment.currentTemperature;
    if (value == null && shipment && shipment.telemetry && shipment.telemetry.live) value = shipment.telemetry.live.temperature;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  }
  function getShipment(shipmentId) {
    return app && app.simulation && app.simulation.shipments ? app.simulation.shipments.find(function (s) { return String(s.id) === String(shipmentId); }) : null;
  }
  function coords(shipment) {
    var l = shipment && shipment.location || {};
    var lat = Number(shipment && (shipment.gpsLatitude != null ? shipment.gpsLatitude : l.latitude));
    var lon = Number(shipment && (shipment.gpsLongitude != null ? shipment.gpsLongitude : l.longitude));
    return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat: lat, lon: lon } : null;
  }
  function localTime(value) {
    try { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" }).format(new Date(value || Date.now())); }
    catch (_) { return new Date(value || Date.now()).toLocaleString(); }
  }
  function valueText(n, suffix) { return n == null || !Number.isFinite(Number(n)) ? "Not available" : Number(n).toFixed(1) + (suffix || ""); }
  function getSpoilage(shipment) {
    var candidates = [shipment && shipment.estimatedTimeToSpoilageMinutes, shipment && shipment.predictedTimeToSpoilageMinutes, shipment && shipment.timeToSpoilageMinutes, shipment && shipment.viabilityMinutesRemaining];
    for (var i = 0; i < candidates.length; i++) if (Number.isFinite(Number(candidates[i])) && candidates[i] !== "" && Number(candidates[i]) >= 0) return Math.round(Number(candidates[i]));
    if (shipment && Number.isFinite(Number(shipment.estimatedViabilityPercent))) return Math.max(1, Math.round((Number(shipment.estimatedViabilityPercent) - 70) * 2));
    return null;
  }
  function identify(payload) {
    var raw = String(payload.type || payload.alertType || "test").toLowerCase();
    if (raw.indexOf("humidity") >= 0) return { type:"HUMIDITY", severity:"WARNING", label:"Humidity outside range" };
    if (raw.indexOf("temperature") >= 0 || raw.indexOf("excursion") >= 0) return { type:"TEMP_EXCURSION", severity:"CRITICAL", label:"Temperature excursion" };
    if (raw.indexOf("hardware") >= 0 || raw.indexOf("sensor_fault") >= 0 || raw.indexOf("sensor") >= 0 && raw.indexOf("offline") < 0) return { type:"SENSOR_FAULT", severity:"CRITICAL", label:"Sensor fault" };
    if (raw.indexOf("route") >= 0 || payload.routeRiskActive) return { type:"ROUTE_RISK", severity:"WARNING", label:"Route risk" };
    if (raw.indexOf("battery") >= 0) return { type:"BATTERY_LOW", severity:"WARNING", label:"Sensor battery low" };
    if (raw.indexOf("gps") >= 0 || payload.gpsLoss) return { type:"GPS_LOSS", severity:"WARNING", label:"GPS signal lost" };
    if (raw.indexOf("offline") >= 0 || raw.indexOf("disconnect") >= 0) return { type:"DEVICE_OFFLINE", severity:"WARNING", label:"Device offline" };
    return { type:"TEST_ALERT", severity:"INFO", label:"Test notification" };
  }
  function actionFor(type) {
    var actions = {
      TEMP_EXCURSION: "Move the shipment to certified cold storage and verify the probe.",
      HUMIDITY: "Inspect the seal and desiccant, then restore the specified humidity range.",
      SENSOR_FAULT: "Verify the suspect probe wiring and cross-check with the independent sensor.",
      ROUTE_RISK: "Review the suggested alternate route before approving any reroute.",
      BATTERY_LOW: "Replace or recharge the telemetry probe battery at the next safe stop.",
      GPS_LOSS: "Contact the driver and confirm the vehicle’s last verified location.",
      DEVICE_OFFLINE: "Check vehicle auxiliary power, network coverage and gateway connectivity.",
      TEST_ALERT: "Review this sample notification and acknowledge it to test the workflow."
    };
    return actions[type] || "Review the shipment and confirm the recommended next step.";
  }
  function buildAlert(payload, conditionKey) {
    var found = identify(payload);
    var shipment = getShipment(payload.shipmentId) || {};
    var temperature = payload.temperature != null ? Number(payload.temperature) : readTemperature(shipment);
    var min = payload.minTemp != null ? Number(payload.minTemp) : Number(shipment.minAllowedTemperature != null ? shipment.minAllowedTemperature : shipment.minTemp);
    var max = payload.maxTemp != null ? Number(payload.maxTemp) : Number(shipment.maxAllowedTemperature != null ? shipment.maxAllowedTemperature : shipment.maxTemp);
    if (!Number.isFinite(min)) min = null;
    if (!Number.isFinite(max)) max = null;
    var metricValue = temperature;
    var valueUnit = "°C";
    if (found.type === "HUMIDITY") {
      metricValue = payload.humidity != null ? Number(payload.humidity) : Number(shipment.currentHumidity);
      valueUnit = "% RH";
      if (payload.minTemp == null && shipment.minAllowedHumidity != null) min = Number(shipment.minAllowedHumidity);
      if (payload.maxTemp == null && shipment.maxAllowedHumidity != null) max = Number(shipment.maxAllowedHumidity);
    } else if (found.type === "BATTERY_LOW") {
      metricValue = payload.batteryLevel != null ? Number(payload.batteryLevel) : Number(shipment.batteryLevel);
      valueUnit = "% battery";
      min = 0; max = 20;
    }
    if (!Number.isFinite(metricValue)) metricValue = null;
    var outHigh = metricValue != null && max != null && metricValue > max;
    var belowLow = metricValue != null && min != null && metricValue < min;
    var deviation = metricValue == null ? null : outHigh ? metricValue - max : (belowLow ? min - metricValue : 0);
    var where = payload.region || payload.location || shipment.currentLocation || shipment.location && shipment.location.name || "Location not recorded";
    var point = coords(shipment);
    var mapLink = point ? "https://www.openstreetmap.org/?mlat=" + point.lat + "&mlon=" + point.lon + "#map=13/" + point.lat + "/" + point.lon : "https://www.openstreetmap.org/search?query=" + encodeURIComponent(where);
    var product = payload.vaccineName || payload.productName || shipment.vaccineName || shipment.productName || "Vaccine";
    var shipmentId = String(payload.shipmentId || payload.id || "ALERT-TEST");
    var unitSuffix = valueUnit;
    var deviationText = found.type === "SENSOR_FAULT" ? String(payload.delta || "Cross-probe delta not available") :
      deviation == null ? "Not available" : (outHigh ? "+" : (belowLow ? "-" : "")) + Math.abs(deviation).toFixed(1) + unitSuffix;
    var limitText = min != null && max != null ? min + unitSuffix + " to " + max + unitSuffix : (max != null ? "≤ " + max + unitSuffix : (min != null ? "≥ " + min + unitSuffix : "Not configured"));
    var minutes = getSpoilage(shipment);
    var duration = shipment.excursionDurationMinutes || payload.durationMinutes || 0;
    var viability = shipment.estimatedViabilityPercent != null ? shipment.estimatedViabilityPercent : shipment.estimatedRemainingViabilityPercent;
    var idValue = id();
    var titleMetric = metricValue == null ? found.label.toLowerCase() : (outHigh ? "above limit" : (belowLow ? "below limit" : found.label.toLowerCase())) + " (" + metricValue.toFixed(1) + valueUnit + ")";
    var title = found.severity + ": " + shipmentId + " " + product + " " + titleMetric;
    if (found.type === "ROUTE_RISK") title = found.severity + ": " + shipmentId + " " + product + " route risk in " + where;
    if (found.type === "SENSOR_FAULT") title = found.severity + ": " + shipmentId + " " + product + " sensor fault";
    if (found.type === "DEVICE_OFFLINE") title = found.severity + ": " + shipmentId + " " + product + " device offline";
    if (found.type === "GPS_LOSS") title = found.severity + ": " + shipmentId + " " + product + " GPS signal lost";
    var suspect = payload.suspectSensor || shipment.suspectSensor || (shipment.probe1ATemperature != null && shipment.probe1BTemperature != null ? (Math.abs(Number(shipment.probe1ATemperature) - Number(shipment.probe1BTemperature)) > 1.5 ? "Probe 1B (cross-check delta " + Math.abs(Number(shipment.probe1ATemperature) - Number(shipment.probe1BTemperature)).toFixed(1) + "°C)" : "Probe 1A/1B") : (shipment.sensorDeviceId || shipment.deviceId || "primary temperature probe"));
    var suggestedRoute = payload.suggestedRoute || shipment.recommendedRoute || shipment.suggestedRoute || (shipment.destinationFacility || shipment.destination ? where + " → " + (shipment.destinationFacility || shipment.destination) : "Review approved corridor");
    var when = payload.detectedAt || nowIso();
    var currentLabel = metricValue == null ? "Not available" : valueText(metricValue, valueUnit);
    var common = "Shipment: " + shipmentId + "; vaccine: " + product + "; current value: " + currentLabel +
      " vs permitted range: " + limitText + "; deviation: " + deviationText +
      "; time out of range: " + (duration ? duration + " min" : "not calculated") +
      "; predicted time to spoilage: " + (minutes == null ? "not available" : "~" + minutes + " min") +
      "; current viability: " + valueText(viability, "%") + "; location: " + where +
      "; timestamp: " + localTime(when) + ". ";
    var specific = found.type === "SENSOR_FAULT" ? "Suspect sensor: " + suspect + "; sensor delta: " + deviationText + ". " :
      found.type === "ROUTE_RISK" ? "Region: " + where + "; suggested route: " + suggestedRoute + ". " :
      found.type === "BATTERY_LOW" ? "Battery level: " + currentLabel + ". " :
      found.type === "GPS_LOSS" ? "GPS status: signal unavailable; last verified place: " + where + ". " :
      found.type === "DEVICE_OFFLINE" ? "Device status: offline; verify last reported telemetry before concluding hardware failure. " :
      found.type === "HUMIDITY" ? "Humidity reading: " + currentLabel + ". " :
      (payload.details ? String(payload.details) + " " : "");
    var msg = common + specific + "Recommended action: " + actionFor(found.type);
    var shortBase = String(window.location.origin || "").replace(/^https?:\/\//, "");
    var shortLink = shortBase + "/#details?id=" + encodeURIComponent(shipmentId);
    var sms = (found.severity + " " + shipmentId + " " + (metricValue == null ? found.label : metricValue.toFixed(1) + valueUnit.replace(" ", "")) + (max != null ? " (limit " + max + ")" : "") + ". " + (minutes == null ? "" : "~" + minutes + " min to spoilage. ") + "Open: " + shortLink);
    if (sms.length > 159) sms = sms.slice(0, 156) + "...";
    var alert = {
      id: idValue, conditionKey: conditionKey || shipmentId + ":" + found.type,
      shipmentId: shipmentId, vaccine: product, batchNumber: payload.batchNumber || shipment.batchNumber || "",
      type: found.type, typeLabel: found.label, severity: found.severity, title: title,
      body: msg, currentValue: metricValue, valueUnit:valueUnit, permittedRange: limitText, minimum: min, maximum: max,
      deviation: deviation, deviationText: deviationText, durationMinutes: duration,
      timeToSpoilageMinutes: minutes, viabilityPercent: viability, location: where, mapLink: mapLink,
      suggestedRoute: suggestedRoute, suspectSensor: suspect, coordinates: point, detectedAt: when, detectedLocal: localTime(when),
      status: "open", unread: true, recommendation: actionFor(found.type), shortText: sms,
      deepLink: window.location.origin + "/#" + "details?id=" + encodeURIComponent(shipmentId),
      acknowledgeLink: null, rerouteLink: window.location.origin + "/#" + "details?id=" + encodeURIComponent(shipmentId) + "&modal=reroute",
      channelStatus: { in_app: { status:"delivered", updatedAt:nowIso(), note:"Shown in Alert Center" } },
      deliveryMode: "demo", escalation: { level:0, nextAt:null, lastSentAt:null }, acknowledgedBy:null, acknowledgedAt:null, resolvedAt:null,
      timeline: [], source: payload.source || "existing-alert-hook", region: payload.region || where, payloadType: payload.type
    };
    addTimeline(alert, "detected", found.label + " · " + found.severity + " · " + (payload.details || msg));
    return alert;
  }
  function renderSeverityClass(severity) { return severity === "CRITICAL" ? "danger" : severity === "WARNING" ? "warning" : "info"; }
  function channelLabel(channel) {
    return ({ in_app:"In-app", push:"Push", sms:"SMS", telegram:"Telegram", whatsapp:"WhatsApp", email:"Email", daily_digest:"Daily digest", weekly_digest:"Weekly digest" })[channel] || channel;
  }
  function isQuietHours() {
    if (!prefs.quietHours || !prefs.quietHours.enabled) return false;
    var now = new Date();
    var bits = String(prefs.quietHours.timezone || "").split("/");
    try {
      var time = new Intl.DateTimeFormat("en-GB", { timeZone:prefs.quietHours.timezone, hour:"2-digit", minute:"2-digit", hourCycle:"h23" }).format(now);
      var cur = Number(time.slice(0,2))*60 + Number(time.slice(3,5));
      var p = function (v) { var z=String(v||"00:00").split(":"); return Number(z[0])*60+Number(z[1]); };
      var start=p(prefs.quietHours.start), end=p(prefs.quietHours.end);
      return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
    } catch (_) { return false; }
  }
  function routeChannels(severity) {
    var list = (prefs.severityChannels && prefs.severityChannels[severity]) || defaultsBySeverity[severity] || ["in_app"];
    var role = prefs.roles && prefs.roles[prefs.role];
    if (role && Array.isArray(role.channels)) list = list.filter(function (x) { return role.channels.indexOf(x) >= 0 || x === "in_app"; });
    return list.filter(function (channel) {
      if (channel === "in_app") return true;
      if (prefs.channels && prefs.channels[channel] === false) return false;
      if (severity !== "CRITICAL" && isQuietHours() && ["email","push","sms","telegram","whatsapp"].indexOf(channel) >= 0) return false;
      return true;
    });
  }
  function pushToast(alert) {
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(alert.title, { body: alert.body.slice(0, 220), tag: alert.id }); } catch (_) { /* Browser notification permission is optional. */ }
    }
    var root = document.getElementById("cg-alert-toast-stack");
    if (!root) {
      root = document.createElement("div"); root.id = "cg-alert-toast-stack";
      root.setAttribute("aria-live", "polite"); root.setAttribute("aria-relevant", "additions");
      root.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:10050;display:flex;flex-direction:column;gap:10px;width:min(420px,calc(100vw - 24px));pointer-events:none;";
      document.body.appendChild(root);
    }
    var toast = document.createElement("section");
    toast.className = "cg-alert-toast cg-alert-toast--" + renderSeverityClass(alert.severity);
    toast.setAttribute("role", "status");
    toast.innerHTML = '<div class="cg-alert-toast__mark" aria-hidden="true">' + (alert.severity === "CRITICAL" ? "!" : alert.severity === "WARNING" ? "⚠" : "i") + '</div><div class="cg-alert-toast__main"><strong>' + esc(alert.title) + '</strong><p>' + esc(alert.body) + '</p><div class="cg-alert-toast__actions"><button type="button" class="cg-btn cg-btn--secondary cg-btn--sm" data-cg-alert-action="ack" data-alert-id="' + esc(alert.id) + '">Acknowledge</button><button type="button" class="cg-btn cg-btn--primary cg-btn--sm" data-cg-alert-action="view" data-alert-id="' + esc(alert.id) + '">View</button></div></div><button type="button" class="cg-alert-toast__close" data-cg-alert-action="dismiss" data-alert-id="' + esc(alert.id) + '" aria-label="Dismiss notification">×</button>';
    root.appendChild(toast);
    window.setTimeout(function () { toast.classList.add("is-visible"); }, 10);
    window.setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, alert.severity === "CRITICAL" ? 14000 : 9000);
  }
  function persistAlert(alert) {
    storeEvents();
    var u = liveUser(), db = database();
    if (u && db) {
      db.ref("users/" + u.uid + "/notificationCenter/" + alert.id).set(alert).catch(function (e) { console.warn("Notification event sync failed", e && e.message); });
      if (app && app.dbService && app.dbService.logAuditEntry) {
        app.dbService.logAuditEntry({ event:"NOTIFICATION_" + (alert.status || "OPEN").toUpperCase(), shipmentId:alert.shipmentId, details:alert.id + " · " + alert.type + " · " + alert.severity });
      }
    }
  }
  function updateHeader() {
    var count = events.filter(function (a) { return a.unread && a.status !== "resolved"; }).length;
    var badge = document.getElementById("cg-alert-unread-count");
    if (badge) { badge.textContent = count > 99 ? "99+" : String(count); badge.hidden = count === 0; }
    var sideBadge = document.getElementById("cg-sidebar-alert-count");
    if (sideBadge) { sideBadge.textContent = count > 99 ? "99+" : String(count); sideBadge.hidden = count === 0; }
    var critical = document.getElementById("header-critical-count");
    var liveCriticals = events.filter(function (a) { return a.severity === "CRITICAL" && a.status === "open"; }).length;
    if (critical && app && app.simulation) {
      var simulated = app.simulation.shipments.filter(function (s) { return s.excursionSeverity === "Critical"; }).length;
      critical.textContent = Math.max(liveCriticals, simulated);
    }
  }
  function makeExistingOpen(alert) {
    return events.find(function (old) { return old.status !== "resolved" && old.shipmentId === alert.shipmentId && old.type === alert.type; });
  }
  function previewStatusFor(alert, channels, note) {
    channels.forEach(function (ch) {
      if (ch === "in_app") return;
      alert.channelStatus[ch] = { status:"queued", updatedAt:nowIso(), note:note || "Demo preview only — no provider credentials configured" };
    });
    alert.deliveryMode = "demo";
    addTimeline(alert, "previewed", "No delivery provider is configured. Notifications are logged and previewed, not sent.");
  }
  function persistAndShow(alert) {
    var currentUser = liveUser(); if (currentUser) alert.ownerUid = currentUser.uid;
    events.unshift(alert);
    events = events.slice(0, 300);
    persistAlert(alert);
    pushToast(alert);
    updateHeader();
    renderIfOpen();
    deliver(alert);
  }
  function observe(conditionKey, payload, active) {
    var key = String(conditionKey || payload.shipmentId + ":" + payload.type);
    if (!active) {
      delete candidates[key];
      var oldId = latestByCondition[key];
      var old = oldId && events.find(function (a) { return a.id === oldId && a.status !== "resolved"; });
      if (old) resolve(old.id, "Condition cleared", payload);
      return;
    }
    candidates[key] = candidates[key] || { count:0, payload:payload };
    candidates[key].count += 1;
    candidates[key].payload = payload;
    if (candidates[key].count < Math.max(1, Number(prefs.debounceReads || 2))) return;
    var alert = buildAlert(candidates[key].payload, key);
    var existing = makeExistingOpen(alert);
    if (existing) {
      if (existing.status === "acknowledged") return;
      var since = Date.now() - Date.parse(existing.lastNotifiedAt || existing.detectedAt);
      if (since > Math.max(1, Number(prefs.reminderCooldownMinutes || 15)) * 60000) {
        existing.lastNotifiedAt = nowIso();
        addTimeline(existing, "reminded", "Persistent condition; reminder cooldown elapsed.");
        persistAlert(existing);
        deliver(existing, true);
      }
      return;
    }
    latestByCondition[key] = alert.id;
    alert.escalation.nextAt = new Date(Date.now() + (alert.severity === "CRITICAL" ? prefs.criticalEscalationMinutes : prefs.warningEscalationMinutes) * 60000).toISOString();
    persistAndShow(alert);
  }
  async function apiRequest(action, payload) {
    var u = liveUser();
    if (!u) return { mode:"demo", demoMode:true, message:"Demo mode: no signed-in Firebase operator." };
    var token = await u.getIdToken();
    var response = await fetch("/api/notifications", {
      method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + token },
      body:JSON.stringify(Object.assign({ action:action }, payload || {}))
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || "Notification service request failed.");
    return data;
  }
  async function deliver(alert, reminder) {
    if (alert.status !== "open" || alert.acknowledgedAt || alert.status === "resolved") return;
    var channels = routeChannels(alert.severity);
    var severityOrder = ["INFO","WARNING","CRITICAL"];
    if (severityOrder.indexOf(alert.severity) < severityOrder.indexOf(prefs.minimumSeverity || "INFO")) channels = channels.filter(function (c) { return c === "in_app"; });
    if (!channels.length) return;
    var healthDemo = providerHealth.demoMode || !liveUser();
    if (healthDemo) {
      previewStatusFor(alert, channels, providerHealth.message || "Demo preview only — channel provider is not configured");
      persistAlert(alert); storeEvents(); renderIfOpen(); return;
    }
    try {
      var result = await apiRequest("send", { alert:alert, preferences:prefs, reminder:!!reminder });
      alert.deliveryMode = result.mode || "live";
      if (result.channels) {
        Object.keys(result.channels).forEach(function (channel) { alert.channelStatus[channel] = result.channels[channel]; });
      } else {
        channels.forEach(function (ch) { if (ch !== "in_app" && !alert.channelStatus[ch]) alert.channelStatus[ch] = { status:"queued", updatedAt:nowIso(), note:"Queued for delivery" }; });
      }
      if (result.acknowledgeLink) alert.acknowledgeLink = result.acknowledgeLink;
      addTimeline(alert, "notified", result.message || (result.mode === "queued" ? "External notifications queued." : "Delivery attempted."));
    } catch (e) {
      channels.filter(function (ch) { return ch !== "in_app"; }).forEach(function (ch) {
        alert.channelStatus[ch] = { status:"failed", updatedAt:nowIso(), note:e.message || "Provider request failed" };
      });
      addTimeline(alert, "delivery_failed", e.message || "Notification provider failed; alert remains visible in-app.");
    }
    persistAlert(alert); storeEvents(); renderIfOpen(); updateHeader();
  }
  async function acknowledge(alertId, actor) {
    var alert = events.find(function (a) { return a.id === alertId; });
    if (!alert || alert.status !== "open") return;
    alert.status = "acknowledged"; alert.unread = false; alert.acknowledgedBy = actor || (liveUser() && (liveUser().email || liveUser().uid)) || "Demo operator";
    alert.acknowledgedAt = nowIso(); alert.escalation.nextAt = null;
    addTimeline(alert, "acknowledged", "Acknowledged by " + alert.acknowledgedBy);
    persistAlert(alert); storeEvents(); updateHeader(); renderIfOpen();
    if (liveUser()) apiRequest("acknowledge", { alertId:alert.id }).catch(function (e) { console.warn("Server acknowledgement sync failed", e.message); });
    notifyToastMessage("Alert acknowledged. Escalation stopped.", "success");
  }
  async function resolve(alertId, details, shipment) {
    var alert = events.find(function (a) { return a.id === alertId; });
    if (!alert || alert.status === "resolved") return;
    alert.status = "resolved"; alert.resolvedAt = nowIso(); alert.unread = false; alert.escalation.nextAt = null;
    alert.resolution = {
      reason:details || "Condition cleared",
      durationMinutes:Math.max(0, Math.round((Date.parse(alert.resolvedAt) - Date.parse(alert.detectedAt)) / 60000)),
      peakDeviation:alert.deviationText || "Not available",
      viabilityImpact:shipment && shipment.estimatedViabilityPercent != null ? shipment.estimatedViabilityPercent + "%" : "No final viability estimate available"
    };
    addTimeline(alert, "resolved", alert.resolution.reason + " · duration " + alert.resolution.durationMinutes + " min · peak deviation " + alert.resolution.peakDeviation + " · viability " + alert.resolution.viabilityImpact);
    persistAlert(alert); storeEvents(); updateHeader(); renderIfOpen();
    if (liveUser()) apiRequest("resolve", { alertId:alert.id, resolution:alert.resolution }).catch(function (e) { console.warn("Server resolve sync failed", e.message); });
    notifyToastMessage("Alert resolved. Resolution summary added to the timeline.", "success");
  }
  function notifyToastMessage(message, severity) {
    if (app && app.modals && app.modals.showToast) app.modals.showToast(message, severity === "success" ? "safe" : severity);
  }
  function statusLabel(status) {
    return ({ queued:"Queued", sent:"Sent", delivered:"Delivered", failed:"Failed", acknowledged:"Acknowledged" })[status] || (status === "preview" ? "Preview only" : "Preview only");
  }
  function badgeClass(status) {
    return status === "delivered" || status === "acknowledged" ? "cg-badge--success" : status === "failed" ? "cg-badge--danger" : status === "sent" ? "cg-badge--info" : status === "queued" ? "cg-badge--warning" : "cg-badge--neutral";
  }
  function iconSvg(kind) {
    var paths = {
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
      truck:'<path d="M3 7h11v11H3z"/><path d="M14 11h4l3 3v4h-7"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>',
      arrow:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.9-1.8 3.1-2.2-.6a8 8 0 0 1-1.8 1l-.4 2.2h-3.6l-.4-2.2a8 8 0 0 1-1.8-1l-2.2.6-1.8-3.1L5.7 15a8 8 0 0 1 0-2l-.1-.1-1.1-1.9 1.8-3.1 2.2.6a8 8 0 0 1 1.8-1l.4-2.2h3.6l.4 2.2a8 8 0 0 1 1.8 1l2.2-.6 1.8 3.1-1.1 1.9a8 8 0 0 1 0 2z"/>'
    };
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[kind] || paths.bell) + "</svg>";
  }
  function alertRow(alert) {
    var status = alert.status === "open" ? '<span class="cg-badge cg-badge--' + renderSeverityClass(alert.severity) + '">' + esc(alert.severity) + ' · ' + esc(alert.status) + '</span>' : '<span class="cg-badge cg-badge--neutral">' + esc(alert.status) + '</span>';
    var channels = Object.keys(alert.channelStatus || {}).map(function (ch) {
      var st = alert.channelStatus[ch];
      return '<span class="cg-delivery-pill ' + badgeClass(st.status) + '" title="' + esc(st.note || statusLabel(st.status)) + '">' + esc(channelLabel(ch)) + ': ' + esc(alert.deliveryMode === "demo" && st.status === "queued" ? "Preview" : statusLabel(st.status)) + '</span>';
    }).join("");
    return '<article class="cg-alert-row cg-card" data-alert-row="' + esc(alert.id) + '"><div class="cg-alert-row__top"><div class="cg-alert-row__main"><div class="cg-demo-eyebrow"><span class="cg-alert-dot cg-alert-dot--' + renderSeverityClass(alert.severity) + '" aria-hidden="true"></span>' + esc(alert.typeLabel || alert.type) + ' · ' + esc(alert.shipmentId) + '</div><h3 class="cg-card__title">' + esc(alert.title) + '</h3><p class="cg-card__copy">' + esc(alert.body) + '</p><div class="cg-alert-row__meta"><span>' + esc(localTime(alert.detectedAt)) + '</span><span>' + esc(alert.location) + '</span></div><div class="cg-delivery-statuses">' + channels + (alert.deliveryMode === "demo" ? '<span class="cg-badge cg-badge--neutral">Demo preview · not sent</span>' : '') + '</div></div><div class="cg-alert-row__actions">' + status + '<button class="cg-btn cg-btn--secondary cg-btn--sm" type="button" data-cg-alert-action="view" data-alert-id="' + esc(alert.id) + '">View Shipment</button>' + (alert.status === "open" ? '<button class="cg-btn cg-btn--secondary cg-btn--sm" type="button" data-cg-alert-action="ack" data-alert-id="' + esc(alert.id) + '">Acknowledge</button><button class="cg-btn cg-btn--primary cg-btn--sm" type="button" data-cg-alert-action="reroute" data-alert-id="' + esc(alert.id) + '">Reroute / Stopover</button>' : '') + '<button class="cg-btn cg-btn--ghost cg-btn--sm" type="button" data-cg-alert-action="details" data-alert-id="' + esc(alert.id) + '">Timeline</button></div></div><div class="cg-alert-row__more" id="cg-timeline-' + esc(alert.id) + '" hidden></div></article>';
  }
  function renderTimeline(alert) {
    return '<div class="cg-timeline"><h4>Alert timeline</h4>' + (alert.timeline || []).map(function (entry) {
      return '<div class="cg-timeline__item"><span class="cg-timeline__dot" aria-hidden="true"></span><div><strong>' + esc(entry.event.replace(/_/g," ")) + '</strong><time>' + esc(localTime(entry.at)) + '</time><p>' + esc(entry.details) + '</p></div></div>';
    }).join("") + (alert.acknowledgedAt ? '<p class="cg-field__hint">Acknowledged by ' + esc(alert.acknowledgedBy) + ' at ' + esc(localTime(alert.acknowledgedAt)) + '</p>' : '') + '</div>';
  }
  function getFiltered() {
    var severity = document.getElementById("cg-filter-severity")?.value || "all";
    var type = document.getElementById("cg-filter-type")?.value || "all";
    var status = document.getElementById("cg-filter-status")?.value || "all";
    var shipment = String(document.getElementById("cg-filter-shipment")?.value || "").toLowerCase();
    return getAllEvents().filter(function (a) {
      return (severity === "all" || a.severity === severity) && (type === "all" || a.type === type) &&
        (status === "all" || a.status === status) && (!shipment || a.shipmentId.toLowerCase().indexOf(shipment) >= 0 || a.title.toLowerCase().indexOf(shipment) >= 0);
    });
  }
  function renderCenter(container) {
    var all = getFiltered();
    var open = events.filter(function (a) { return a.status === "open"; }).length;
    var crit = events.filter(function (a) { return a.status === "open" && a.severity === "CRITICAL"; }).length;
    container.innerHTML = '<div class="cg-notification-page animate-fade-in"><header class="cg-notification-page__head"><div><div class="cg-demo-eyebrow">' + iconSvg("bell") + ' NOTIFICATION OPERATIONS</div><h1>Alert Center</h1><p>Review alert events, channel delivery status and the complete acknowledgement timeline.</p></div><div class="cg-notification-page__head-actions"><button class="cg-btn cg-btn--secondary" type="button" data-cg-notification-action="test">' + iconSvg("bell") + ' Send test alert</button><button class="cg-btn cg-btn--primary" type="button" data-cg-notification-action="settings">' + iconSvg("settings") + ' Notification settings</button></div></header>' +
      '<div class="cg-notification-kpis"><article class="cg-card"><span class="cg-card__eyebrow">Open alerts</span><strong>' + open + '</strong><span class="cg-field__hint">Awaiting resolution</span></article><article class="cg-card cg-card--alert"><span class="cg-card__eyebrow">Critical open</span><strong>' + crit + '</strong><span class="cg-field__hint">Priority attention</span></article><article class="cg-card"><span class="cg-card__eyebrow">Notification mode</span><strong class="cg-notification-kpi-mode">' + (providerHealth.demoMode ? "Demo" : "Live") + '</strong><span class="cg-field__hint">' + (providerHealth.demoMode ? "No configured external provider" : "Provider adapters available") + '</span></article><article class="cg-card"><span class="cg-card__eyebrow">Total logged</span><strong>' + events.length + '</strong><span class="cg-field__hint">Recent alert records</span></article></div>' +
      '<section class="cg-card cg-alert-filters"><div class="cg-field"><label class="cg-label" for="cg-filter-severity">Severity</label><select class="cg-select" id="cg-filter-severity"><option value="all">All severities</option><option>CRITICAL</option><option>WARNING</option><option>INFO</option></select></div><div class="cg-field"><label class="cg-label" for="cg-filter-type">Alert type</label><select class="cg-select" id="cg-filter-type"><option value="all">All types</option>' + ["TEMP_EXCURSION","HUMIDITY","SENSOR_FAULT","ROUTE_RISK","BATTERY_LOW","GPS_LOSS","DEVICE_OFFLINE","TEST_ALERT"].map(function (t) { return '<option>' + t + '</option>'; }).join("") + '</select></div><div class="cg-field"><label class="cg-label" for="cg-filter-status">Status</label><select class="cg-select" id="cg-filter-status"><option value="all">All statuses</option><option value="open">Open</option><option value="acknowledged">Acknowledged</option><option value="resolved">Resolved</option></select></div><div class="cg-field"><label class="cg-label" for="cg-filter-shipment">Shipment</label><input class="cg-input" id="cg-filter-shipment" placeholder="Search shipment ID…"></div></section>' +
      '<div class="cg-alert-list-head"><h2>Recent alerts <span>' + all.length + '</span></h2><span class="cg-field__hint">Select Timeline for escalation and channel events.</span></div>' +
      '<div id="cg-alert-list">' + (all.length ? all.map(alertRow).join("") : '<div class="cg-empty-state cg-card"><div class="cg-demo-icon">' + iconSvg("shield") + '</div><h3>No alerts match these filters</h3><p>Clear filters or send a test alert to preview the notification flow.</p><button type="button" class="cg-btn cg-btn--secondary" data-cg-notification-action="test">Send test alert</button></div>') + '</div>' +
      '<section class="cg-card cg-preview-panel"><div class="cg-card__eyebrow">Notification preview</div><h2 class="cg-card__title">Email, push and SMS content</h2><p class="cg-card__copy">Choose any alert above to inspect the same content fields used across channels.</p><div class="cg-preview-grid"><div class="cg-preview-channel"><h3>' + iconSvg("bell") + ' Email</h3><div class="cg-email-preview"><div class="cg-email-preview__brand">❄ ColdGuard <span>PROTECT EVERY DOSE</span></div><div class="cg-email-preview__severity">CRITICAL ALERT</div><div class="cg-email-preview__content"><strong>' + esc(all[0] ? all[0].title : "CRITICAL: CG-9021-PFZ Comirnaty above limit (-52.4°C)") + '</strong><p>' + esc(all[0] ? all[0].body : "Shipment, permitted range, deviation, exposure time, viability, location and recommended action appear here.") + '</p><div class="cg-email-preview__metrics"><span><small>CURRENT VALUE</small><b>' + esc(all[0] ? valueText(all[0].currentValue, all[0].valueUnit || "°C") : "-52.4°C") + '</b></span><span><small>PERMITTED RANGE</small><b>' + esc(all[0] ? all[0].permittedRange : "-60°C to -50°C") + '</b></span><span><small>TIME OUT</small><b>' + esc(all[0] ? (all[0].durationMinutes || "—") + " min" : "4 min") + '</b></span><span><small>VIABILITY</small><b>' + esc(all[0] ? valueText(all[0].viabilityPercent, "%") : "87.2%") + '</b></span></div><div class="cg-email-sparkline"><svg viewBox="0 0 300 42" role="img" aria-label="Illustrative temperature sparkline for the last 30 minutes"><path d="M0 32 L18 28 L36 31 L54 18 L72 20 L90 16 L108 24 L126 11 L144 15 L162 6 L180 12 L198 8 L216 20 L234 10 L252 12 L270 4 L288 8 L300 3" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Temperature trend · last 30 minutes</span></div><a href="' + esc(all[0] ? all[0].mapLink : "https://www.openstreetmap.org") + '">View location map ↗</a><p class="cg-field__hint">Recommended action: ' + esc(all[0] ? all[0].recommendation : actionFor("TEMP_EXCURSION")) + '</p></div><div class="cg-email-preview__cta"><span>View Shipment</span><span>Acknowledge</span><span>Reroute / Stopover</span></div></div></div><div class="cg-preview-channel"><h3>' + iconSvg("bell") + ' Push notification</h3><div class="cg-push-preview"><div class="cg-push-preview__app">' + iconSvg("shield") + '<span>ColdGuard Alerts</span><time>now</time></div><strong>' + esc(all[0] ? all[0].title : "CRITICAL · CG-9021-PFZ") + '</strong><p>' + esc(all[0] ? all[0].shortText : "CG-9021-PFZ -52.4C (limit -60). ~25 min to spoilage.") + '</p></div><h3 style="margin-top:18px">' + iconSvg("phone") + ' SMS (compact)</h3><div class="cg-sms-preview"><p>' + esc(all[0] ? all[0].shortText : "CRITICAL CG-9021-PFZ -52.4C (limit -60). ~25 min to spoilage. Open: coldguard.app/cg9021") + '</p><span>' + (all[0] ? all[0].shortText.length : 112) + ' / 160 characters</span></div></div></div></section></div>';
    container.querySelectorAll("#cg-alert-list [data-alert-row]").forEach(function (row) {
      row.addEventListener("click", function (e) {
        if (e.target.closest("button")) return;
        var alert = events.find(function (a) { return a.id === row.getAttribute("data-alert-row"); });
        var more = row.querySelector(".cg-alert-row__more"); if (!alert || !more) return;
        more.hidden = !more.hidden;
        more.innerHTML = renderTimeline(alert);
      });
    });
    ["cg-filter-severity","cg-filter-type","cg-filter-status","cg-filter-shipment"].forEach(function (filterId) {
      var el = document.getElementById(filterId);
      if (el) { var current = el.value; el.addEventListener(el.tagName === "INPUT" ? "input" : "change", function () { var values = { severity:document.getElementById("cg-filter-severity").value, type:document.getElementById("cg-filter-type").value, status:document.getElementById("cg-filter-status").value, shipment:document.getElementById("cg-filter-shipment").value }; renderCenter(container); Object.keys(values).forEach(function (k) { var target = document.getElementById("cg-filter-" + k); if (target) target.value = values[k]; }); }); }
    });
  }
  function channelToggle(key, label, hint) {
    return '<label class="cg-setting-channel"><input type="checkbox" data-cg-channel="' + esc(key) + '" ' + (prefs.channels[key] ? "checked" : "") + '><span class="cg-setting-channel__copy"><strong>' + esc(label) + '</strong><small>' + esc(hint || channelLabel(key)) + '</small></span></label>';
  }
  function settingInput(name, label, type, val, placeholder) {
    return '<label class="cg-field"><span class="cg-label">' + esc(label) + '</span><input class="cg-input" name="' + esc(name) + '" type="' + esc(type || "text") + '" value="' + esc(val == null ? "" : val) + '" placeholder="' + esc(placeholder || "") + '"></label>';
  }
  function renderSettings(container) {
    container.innerHTML = '<div class="cg-notification-page animate-fade-in"><header class="cg-notification-page__head"><div><div class="cg-demo-eyebrow">' + iconSvg("settings") + ' DELIVERY PREFERENCES</div><h1>Notification settings</h1><p>Control role routing, contact channels, quiet hours, escalation timing and notification previews.</p></div><div class="cg-notification-page__head-actions"><button class="cg-btn cg-btn--secondary" type="button" data-cg-notification-action="center">← Back to Alert Center</button><button class="cg-btn cg-btn--primary" type="button" data-cg-notification-action="test">Send test alert</button></div></header>' +
      '<form id="cg-notification-settings-form"><section class="cg-card cg-settings-section"><div class="cg-card__eyebrow">01 · Routing</div><h2 class="cg-card__title">Default role and per-channel preferences</h2><p class="cg-card__copy">Defaults follow the severity matrix; disable channels here to mute them for this operator.</p><div class="cg-settings-grid">' +
      '<div class="cg-field"><label class="cg-label" for="cg-setting-role">Recipient role</label><select class="cg-select" id="cg-setting-role" name="role"><option value="driver">Driver</option><option value="hub_manager">Hub manager</option><option value="logistics_admin">Logistics admin</option></select></div><div class="cg-field"><label class="cg-label" for="cg-setting-minimum">Minimum severity</label><select class="cg-select" id="cg-setting-minimum" name="minimumSeverity"><option>INFO</option><option>WARNING</option><option>CRITICAL</option></select></div>' +
      channelToggle("in_app","In-app","Alert Center and dashboard toast") + channelToggle("push","Push","Browser / FCM push token") + channelToggle("email","Email","Responsive HTML email") + channelToggle("sms","SMS","Compact text, 160-character target") + channelToggle("telegram","Telegram","Bot API delivery") + channelToggle("whatsapp","WhatsApp","Twilio WhatsApp sender") +
      '</div><div class="cg-settings-matrix"><h3>Severity routing matrix</h3>' + ["INFO","WARNING","CRITICAL"].map(function (sev) {
        return '<div class="cg-setting-matrix-row"><strong>' + sev + '</strong><div>' + ["in_app","push","email","sms","telegram","whatsapp","daily_digest"].map(function (ch) {
          var yes = (prefs.severityChannels[sev] || []).indexOf(ch) >= 0;
          return '<label><input type="checkbox" data-cg-route-severity="' + sev + '" data-cg-route-channel="' + ch + '" ' + (yes ? "checked" : "") + '><span>' + esc(channelLabel(ch)) + '</span></label>';
        }).join("") + '</div></div>';
      }).join("") + '</div></section>' +
      '<section class="cg-card cg-settings-section"><div class="cg-card__eyebrow">02 · Contacts</div><h2 class="cg-card__title">Where should alerts go?</h2><div class="cg-settings-grid">' +
      settingInput("email","Email address","email",prefs.contacts.email,"safety@example.com") + settingInput("phone","SMS phone (E.164)","tel",prefs.contacts.phone,"+919876543210") + settingInput("telegramChatId","Telegram chat ID","text",prefs.contacts.telegramChatId,"Chat / group ID") + settingInput("whatsappPhone","WhatsApp phone (E.164)","tel",prefs.contacts.whatsappPhone,"+919876543210") + settingInput("pushToken","FCM registration token","text",prefs.contacts.pushToken,"FCM device token") +
      '</div><p class="cg-field__hint">Provider credentials are never entered here. They must be configured as server environment variables.</p></section>' +
      '<section class="cg-card cg-settings-section"><div class="cg-card__eyebrow">03 · Noise control</div><h2 class="cg-card__title">Quiet hours and reminders</h2><div class="cg-settings-grid">' +
      '<label class="cg-setting-channel"><input name="quietEnabled" type="checkbox" ' + (prefs.quietHours.enabled ? "checked" : "") + '><span class="cg-setting-channel__copy"><strong>Enable quiet hours</strong><small>INFO / WARNING only; CRITICAL still routes immediately.</small></span></label>' +
      settingInput("quietStart","Quiet hours start","time",prefs.quietHours.start) + settingInput("quietEnd","Quiet hours end","time",prefs.quietHours.end) + settingInput("debounceReads","Consecutive readings","number",prefs.debounceReads) + settingInput("reminderCooldownMinutes","Reminder cooldown (minutes)","number",prefs.reminderCooldownMinutes) +
      settingInput("criticalEscalationMinutes","Critical escalation (minutes)","number",prefs.criticalEscalationMinutes) + settingInput("warningEscalationMinutes","Warning escalation (minutes)","number",prefs.warningEscalationMinutes) + settingInput("repeatEveryMinutes","Repeat after final level (minutes)","number",prefs.repeatEveryMinutes) + settingInput("escalationChain","Escalation order (comma-separated roles)","text",prefs.escalationChain.join(", ")) +
      '</div><div class="cg-settings-footer"><span class="cg-field__hint">Current timezone: ' + esc(prefs.quietHours.timezone) + '</span><div class="cg-demo-row"><button class="cg-btn cg-btn--secondary" type="button" data-cg-notification-action="test">Send test alert</button><button class="cg-btn cg-btn--primary" type="submit">Save preferences</button></div></div></section></form>' +
      '<section class="cg-card cg-preview-panel"><div class="cg-card__eyebrow">04 · Delivery preview</div><h2 class="cg-card__title">Preview before sending</h2><p class="cg-card__copy">A sample alert can be inspected in email, push and SMS formats without sending messages in demo mode.</p><button class="cg-btn cg-btn--secondary" type="button" data-cg-notification-action="preview">Preview sample critical alert</button><div id="cg-settings-preview" style="margin-top:16px"></div></section></div>';
    var form = document.getElementById("cg-notification-settings-form");
    if (form) {
      form.elements.role.value = prefs.role;
      form.elements.minimumSeverity.value = prefs.minimumSeverity;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form);
        prefs.role = String(data.get("role") || "logistics_admin");
        prefs.minimumSeverity = String(data.get("minimumSeverity") || "INFO");
        prefs.channels = prefs.channels || {};
        form.querySelectorAll("[data-cg-channel]").forEach(function (ch) { prefs.channels[ch.getAttribute("data-cg-channel")] = ch.checked; });
        ["INFO","WARNING","CRITICAL"].forEach(function (sev) {
          prefs.severityChannels[sev] = Array.from(form.querySelectorAll('[data-cg-route-severity="' + sev + '"]:checked')).map(function (input) { return input.getAttribute("data-cg-route-channel"); });
        });
        prefs.contacts = { email:String(data.get("email")||"").trim(), phone:String(data.get("phone")||"").trim(), telegramChatId:String(data.get("telegramChatId")||"").trim(), whatsappPhone:String(data.get("whatsappPhone")||"").trim(), pushToken:String(data.get("pushToken")||"").trim() };
        prefs.quietHours = { enabled:form.elements.quietEnabled.checked, start:String(data.get("quietStart")||"22:00"), end:String(data.get("quietEnd")||"07:00"), timezone:prefs.quietHours.timezone };
        prefs.debounceReads = Math.max(1, Math.min(10, Number(data.get("debounceReads")||2)));
        prefs.reminderCooldownMinutes = Math.max(1, Math.min(1440, Number(data.get("reminderCooldownMinutes")||15)));
        prefs.criticalEscalationMinutes = Math.max(1, Math.min(120, Number(data.get("criticalEscalationMinutes")||5)));
        prefs.warningEscalationMinutes = Math.max(1, Math.min(360, Number(data.get("warningEscalationMinutes")||15)));
        prefs.repeatEveryMinutes = Math.max(1, Math.min(360, Number(data.get("repeatEveryMinutes")||10)));
        prefs.escalationChain = String(data.get("escalationChain")||"driver, hub_manager, logistics_admin").split(",").map(function (v) { return v.trim(); }).filter(function (v) { return ["driver","hub_manager","logistics_admin"].indexOf(v) >= 0; });
        prefs.updatedAt = nowIso();
        saveLocal(SETTINGS_KEY + ":" + uid(), prefs);
        var u = liveUser(), db = database();
        if (u && db) {
          db.ref("users/" + u.uid + "/notificationPreferences").set(prefs).catch(function (err) { notifyToastMessage("Preferences are saved locally, but server sync failed: " + err.message, "warning"); });
          if (app.dbService && app.dbService.logAuditEntry) app.dbService.logAuditEntry({ event:"NOTIFICATION_PREFERENCES_UPDATED", details:"Notification routing preferences updated by " + (u.email || u.uid) });
        }
        notifyToastMessage("Notification preferences saved.", "success");
        renderSettings(container);
      });
    }
  }
  function loadSettings() {
    prefs = Object.assign(defaultSettings(), loadLocal(SETTINGS_KEY + ":" + uid(), {}));
    var base = defaultSettings();
    prefs.roles = Object.assign(base.roles, prefs.roles || {});
    prefs.channels = Object.assign(base.channels, prefs.channels || {});
    prefs.severityChannels = Object.assign(base.severityChannels, prefs.severityChannels || {});
    prefs.contacts = Object.assign(base.contacts, prefs.contacts || {});
    prefs.quietHours = Object.assign(base.quietHours, prefs.quietHours || {});
    prefs.digest = Object.assign(base.digest, prefs.digest || {});
  }
  function loadEvents() {
    // Keep one operator's history private; never fall back to a cross-user local key.
    events = loadLocal(KEY + ":" + uid(), []);
    if (!Array.isArray(events)) events = [];
  }
  function loadProviderHealth() {
    fetch("/api/notifications?action=health", { headers:{ "Accept":"application/json" } }).then(function (r) { return r.json(); }).then(function (d) {
      providerHealth = Object.assign(providerHealth, d || {});
      if (providerHealth.demoMode) providerHealth.message = d.message || "No external provider credentials are configured. Events are preview-only.";
    }).catch(function () { providerHealth.demoMode = true; providerHealth.message = "Notification API unavailable — using local demo preview."; });
  }
  function buttonNavigate(view, shipmentId) {
    if (!app) return;
    if (shipmentId) app.selectedShipmentId = shipmentId;
    app.switchView(view, shipmentId || null);
  }
  function renderIfOpen() {
    if (!app) return;
    if (app.currentView === "alert_center") renderCenter(document.getElementById("main-content-view"));
    else if (app.currentView === "notification_settings") renderSettings(document.getElementById("main-content-view"));
  }
  function testAlert() {
    var payload = {
      type:"temperature_excursion", source:"manual_test", shipmentId:"CG-9021-PFZ",
      vaccineName:"Comirnaty", temperature:-52.4, minTemp:-90, maxTemp:-60, durationMinutes:4,
      detectedAt:nowIso(), location:"Pune Cold-Chain Corridor", details:"Example critical test for channel preview."
    };
    var test = buildAlert(payload, "test:" + uid() + ":" + Date.now());
    var currentUser = liveUser(); if (currentUser) test.ownerUid = currentUser.uid;
    test.title = "CRITICAL: CG-9021-PFZ Comirnaty above limit (-52.4°C)";
    test.severity = "CRITICAL"; test.type = "TEMP_EXCURSION"; test.typeLabel = "Test temperature excursion";
    test.shortText = "CRITICAL CG-9021-PFZ -52.4C (limit -60). ~25 min to spoilage. Open: " + String(window.location.origin || "").replace(/^https?:\/\//, "") + "/#details";
    if (test.shortText.length > 159) test.shortText = test.shortText.slice(0,156) + "...";
    test.recommendation = actionFor("TEMP_EXCURSION");
    var duplicate = makeExistingOpen(test);
    if (duplicate) { notifyToastMessage("An open test or excursion alert already exists. Open Alert Center to review it.", "warning"); return; }
    latestByCondition[test.conditionKey] = test.id;
    test.escalation.nextAt = new Date(Date.now() + Number(prefs.criticalEscalationMinutes || 5) * 60000).toISOString();
    persistAndShow(test);
  }
  function renderBellDropdown() {
    var bell = document.getElementById("btn-open-alert-center");
    if (!bell || !bell.parentElement) return;
    var dropdown = document.getElementById("cg-alert-dropdown");
    if (!dropdown) {
      dropdown = document.createElement("div");
      dropdown.id = "cg-alert-dropdown";
      dropdown.className = "cg-alert-dropdown";
      dropdown.setAttribute("role", "dialog");
      dropdown.setAttribute("aria-label", "Recent notifications");
      bell.parentElement.appendChild(dropdown);
    }
    var recent = getAllEvents().filter(function (a) { return a.status !== "resolved"; }).slice(0, 5);
    dropdown.innerHTML = '<div class="cg-alert-dropdown__head"><div><strong>Recent alerts</strong><small>' + events.filter(function (a) { return a.unread && a.status !== "resolved"; }).length + ' unread</small></div><button type="button" class="cg-btn cg-btn--ghost cg-btn--sm" data-cg-bell-close aria-label="Close recent alerts">×</button></div>' +
      (recent.length ? '<div class="cg-alert-dropdown__list">' + recent.map(function (a) {
        return '<button class="cg-alert-dropdown__item" type="button" data-cg-alert-action="view" data-alert-id="' + esc(a.id) + '"><span class="cg-alert-dot cg-alert-dot--' + renderSeverityClass(a.severity) + '" aria-hidden="true"></span><span class="cg-alert-dropdown__copy"><strong>' + esc(a.title) + '</strong><small>' + esc(a.shipmentId + " · " + localTime(a.detectedAt)) + '</small></span><span class="cg-alert-dropdown__status">' + (a.unread ? "New" : esc(a.status)) + '</span></button>';
      }).join("") + '</div>' : '<div class="cg-alert-dropdown__empty"><strong>No recent alerts</strong><span>New conditions will appear here.</span></div>') +
      '<div class="cg-alert-dropdown__footer"><button type="button" class="cg-btn cg-btn--primary cg-btn--sm" data-cg-notification-action="center">Open Alert Center</button><button type="button" class="cg-btn cg-btn--secondary cg-btn--sm" data-cg-notification-action="test">Send test</button></div>';
  }
  function toggleBellDropdown() {
    var dropdown = document.getElementById("cg-alert-dropdown");
    var bell = document.getElementById("btn-open-alert-center");
    if (!bell) { buttonNavigate("alert_center"); return; }
    renderBellDropdown();
    dropdown = document.getElementById("cg-alert-dropdown");
    var show = !dropdown || dropdown.hidden || !dropdown.classList.contains("is-open");
    if (dropdown) {
      dropdown.hidden = !show;
      dropdown.classList.toggle("is-open", show);
      bell.setAttribute("aria-expanded", String(show));
    }
  }
  function closeBellDropdown() {
    var dropdown = document.getElementById("cg-alert-dropdown");
    var bell = document.getElementById("btn-open-alert-center");
    if (dropdown) { dropdown.hidden = true; dropdown.classList.remove("is-open"); }
    if (bell) bell.setAttribute("aria-expanded", "false");
  }

  function handleAction(action, alertId, button) {
    var alert = events.find(function (a) { return a.id === alertId; });
    if (action === "ack") return acknowledge(alertId);
    if (action === "dismiss") { if (button && button.closest(".cg-alert-toast")) button.closest(".cg-alert-toast").remove(); return; }
    if (action === "view" || action === "shipment") {
      closeBellDropdown();
      if (alert) { alert.unread = false; persistAlert(alert); storeEvents(); updateHeader(); buttonNavigate("details", alert.shipmentId); }
      return;
    }
    if (action === "reroute") {
      if (!alert || !app) return;
      closeBellDropdown();
      buttonNavigate("details", alert.shipmentId);
      window.setTimeout(function () {
        var shipment = getShipment(alert.shipmentId);
        if (!shipment || !app.modals || !app.checkpoints) return;
        var checkpoint = app.checkpoints.find(function (item) { return item.id === shipment.nearestCheckpointId; }) || app.checkpoints[0];
        if (checkpoint) app.modals.openRerouteModal(shipment, checkpoint);
      }, 120);
      return;
    }
    if (action === "details") {
      var row = button && button.closest("[data-alert-row]"), more = row && row.querySelector(".cg-alert-row__more");
      if (alert && more) { more.hidden = !more.hidden; more.innerHTML = more.hidden ? "" : renderTimeline(alert); }
      return;
    }
  }
  var syncedNotificationUid = null;
  var syncedNotificationRef = null;
  function attachUserNotificationSync() {
    var u = liveUser(), db = database();
    if (!db || !u) {
      if (syncedNotificationRef) { syncedNotificationRef.off(); syncedNotificationRef = null; }
      syncedNotificationUid = null;
      return;
    }
    if (syncedNotificationUid === u.uid && syncedNotificationRef) return;
    if (syncedNotificationRef) syncedNotificationRef.off();
    syncedNotificationUid = u.uid;
    loadEvents();
    loadSettings();
    var ref = db.ref("users/" + u.uid + "/notificationCenter");
    syncedNotificationRef = ref;
    function mergeRemote(item) {
      if (!item || !item.id) return;
      var at = events.findIndex(function (e) { return e.id === item.id; });
      if (at >= 0) events[at] = item; else events.unshift(item);
      events.sort(function (a,b) { return Date.parse(b.detectedAt || 0) - Date.parse(a.detectedAt || 0); });
      storeEvents(); updateHeader(); renderIfOpen();
    }
    ref.once("value").then(function (snap) {
      var remote = snap.val() || {};
      Object.keys(remote).forEach(function (key) { mergeRemote(remote[key]); });
      storeEvents(); updateHeader(); renderIfOpen();
    }).catch(function () {});
    ref.on("child_added", function (snap) { mergeRemote(snap.val()); });
    ref.on("child_changed", function (snap) { mergeRemote(snap.val()); });
    ref.on("child_removed", function (snap) {
      var item = snap.val();
      if (!item || !item.id) return;
      events = events.filter(function (e) { return e.id !== item.id; });
      storeEvents(); updateHeader(); renderIfOpen();
    });
  }
  function initUi() {
    app = window.coldGuardApp;
    if (!app) { window.setTimeout(initUi, 50); return; }
    loadEvents(); loadSettings(); loadProviderHealth();
    var originalSwitch = app.switchView.bind(app);
    app.switchView = function (view, shipmentId) {
      if (view === "alert_center" || view === "notification_settings") {
        this.currentView = view;
        if (shipmentId) this.selectedShipmentId = shipmentId;
        window.location.hash = view;
        this.updateNavActiveState(view);
        this.renderCurrentView();
        window.scrollTo({ top:0, behavior:"smooth" });
        return;
      }
      return originalSwitch(view, shipmentId);
    };
    var originalRender = app.renderCurrentView.bind(app);
    app.renderCurrentView = function () {
      if (this.currentView === "alert_center") { renderCenter(document.getElementById("main-content-view")); return; }
      if (this.currentView === "notification_settings") { renderSettings(document.getElementById("main-content-view")); return; }
      return originalRender();
    };
    var originalParse = app.parseHashRoute.bind(app);
    app.parseHashRoute = function () {
      var view = String(window.location.hash || "").replace(/^#/, "").split("?")[0];
      if (view === "alert_center" || view === "notification_settings") {
        this.currentView = view; this.updateNavActiveState(view); return;
      }
      return originalParse();
    };
    document.addEventListener("click", function (e) {
      var openCenter = e.target.closest("[data-cg-open-alert-center]");
      if (openCenter) { e.preventDefault(); toggleBellDropdown(); return; }
      if (e.target.closest("[data-cg-bell-close]")) { closeBellDropdown(); return; }
      var actionButton = e.target.closest("[data-cg-alert-action]");
      if (actionButton) { e.preventDefault(); handleAction(actionButton.getAttribute("data-cg-alert-action"), actionButton.getAttribute("data-alert-id"), actionButton); return; }
      var navAction = e.target.closest("[data-cg-notification-action]");
      if (navAction) {
        e.preventDefault();
        var action = navAction.getAttribute("data-cg-notification-action");
        if (action === "settings") { closeBellDropdown(); buttonNavigate("notification_settings"); }
        else if (action === "center") { closeBellDropdown(); buttonNavigate("alert_center"); }
        else if (action === "test") testAlert();
        else if (action === "preview") {
          var p = buildAlert({ type:"temperature_excursion", shipmentId:"CG-9021-PFZ", vaccineName:"Comirnaty", temperature:-52.4, minTemp:-90, maxTemp:-60, location:"Pune Cold-Chain Corridor" }, "preview-only");
          var box = document.getElementById("cg-settings-preview");
          if (box) box.innerHTML = '<div class="cg-email-preview"><div class="cg-email-preview__brand">❄ ColdGuard <span>PREVIEW ONLY</span></div><div class="cg-email-preview__severity">CRITICAL ALERT</div><div class="cg-email-preview__content"><strong>' + esc(p.title) + '</strong><p>' + esc(p.body) + '</p><p>Recommended action: ' + esc(p.recommendation) + '</p><p class="cg-field__hint">' + esc(p.shortText) + '</p></div></div>';
        }
        return;
      }
      var clear = e.target.closest("[data-cg-clear-filters]");
      if (clear) renderCenter(document.getElementById("main-content-view"));
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#cg-alert-dropdown") && !e.target.closest("[data-cg-open-alert-center]")) closeBellDropdown();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeBellDropdown(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") updateHeader(); });
    attachUserNotificationSync();
    var originalAuthStateChanged = app.handleAuthStateChanged.bind(app);
    app.handleAuthStateChanged = function (user) {
      originalAuthStateChanged(user);
      loadEvents();
      loadSettings();
      attachUserNotificationSync();
      updateHeader();
      renderIfOpen();
    };
        var originalTick = app.onSimulationTick.bind(app);
    app.onSimulationTick = function (shipments) {
      originalTick(shipments);
      if (window.ColdGuardNotifications && Array.isArray(shipments)) window.ColdGuardNotifications.observeShipments(shipments);
      if (app.currentView === "alert_center") renderCenter(document.getElementById("main-content-view"));
    };
    var originalAlerts = app.handleRemoteAlerts.bind(app);
    app.handleRemoteAlerts = function (remote) { originalAlerts(remote); if (app.currentView === "alert_center") renderCenter(document.getElementById("main-content-view")); };
    var originalRemoteShipments = app.handleRemoteShipments.bind(app);
    app.handleRemoteShipments = function (remote) {
      originalRemoteShipments(remote);
      if (Array.isArray(app.simulation && app.simulation.shipments)) observeShipments(app.simulation.shipments);
    };
    // Store a digest snapshot locally; providers can send configured digests through the same API.
    digestTimer = window.setInterval(function () {
      var live = liveUser(); if (!live) return;
      var last = Number(loadLocal("coldguard-last-digest:" + live.uid, 0));
      if (prefs.digest.daily && new Date().getHours() === Number(String(prefs.digest.hour || "08:00").split(":")[0]) && Date.now() - last > 20 * 60 * 60 * 1000) {
        apiRequest("digest", { period:"daily", alerts:getAllEvents().filter(function(a){return Date.parse(a.detectedAt||0)>Date.now()-86400000;}) }).then(function(){saveLocal("coldguard-last-digest:"+live.uid,Date.now());}).catch(function(){});
      }
    }, 60000);
    updateHeader();
  }
  function observeShipments(shipments) {
    if (!Array.isArray(shipments)) return;
    var seen = Object.create(null);
    shipments.forEach(function (s) {
      var sid = String(s.id || s.shipmentId || ""); if (!sid) return;
      var p = (app && app.vaccineProfiles && app.vaccineProfiles[s.vaccineCategory]) || {};
      var temp = readTemperature(s);
      var min = Number(s.minAllowedTemperature != null ? s.minAllowedTemperature : s.minTemp != null ? s.minTemp : p.minTemp);
      var max = Number(s.maxAllowedTemperature != null ? s.maxAllowedTemperature : s.maxTemp != null ? s.maxTemp : p.maxTemp);
      var tKey = sid + ":TEMP_EXCURSION", tBad = temp != null && Number.isFinite(min) && Number.isFinite(max) && min < max && (temp < min || temp > max);
      seen[tKey] = true;
      observe(tKey, { type:"temperature_excursion", shipmentId:sid, vaccineName:s.vaccineName || s.productName, temperature:temp, minTemp:min, maxTemp:max, location:s.currentLocation, detectedAt:nowIso(), durationMinutes:s.excursionDurationMinutes }, tBad);
      var h = Number(s.currentHumidity), hMin=Number(s.minAllowedHumidity != null ? s.minAllowedHumidity : p.minHumidity), hMax=Number(s.maxAllowedHumidity != null ? s.maxAllowedHumidity : p.maxHumidity);
      var hKey = sid + ":HUMIDITY", hBad = Number.isFinite(h) && Number.isFinite(hMin) && Number.isFinite(hMax) && (h < hMin || h > hMax);
      seen[hKey] = true;
      observe(hKey, { type:"humidity_excursion", shipmentId:sid, vaccineName:s.vaccineName || s.productName, humidity:h, minTemp:hMin, maxTemp:hMax, location:s.currentLocation, detectedAt:nowIso() }, hBad);
      var status = String(s.hardwareStatus || s.deviceStatus || s.sensorStatus || "").toLowerCase();
      var badSensor = s.isSensorFaulty === true || s.sensorHealth === "fault" || ["fault","error","failed","malfunction"].indexOf(status) >= 0;
      var delta = s.probe1ATemperature != null && s.probe1BTemperature != null ? Math.abs(Number(s.probe1ATemperature)-Number(s.probe1BTemperature)) : null;
      var sensorKey = sid + ":SENSOR_FAULT"; seen[sensorKey] = true;
      observe(sensorKey, { type:"hardware_problem", shipmentId:sid, vaccineName:s.vaccineName || s.productName, location:s.currentLocation, hardwareStatus:status || "fault", suspectSensor:s.suspectSensor || s.sensorDeviceId || "primary sensor", delta:delta == null ? "probe data unavailable" : delta.toFixed(1)+"°C cross-probe difference", detectedAt:nowIso() }, badSensor || Number.isFinite(delta) && delta > 1.5);
      var battery = Number(s.batteryLevel), batteryLow = Number.isFinite(battery) && battery <= 20 || String(s.sensorConnectivity || "").toLowerCase() === "low battery" || s.batteryLow === true;
      var batteryKey = sid + ":BATTERY_LOW"; seen[batteryKey] = true;
      observe(batteryKey, { type:"battery_low", shipmentId:sid, vaccineName:s.vaccineName || s.productName, location:s.currentLocation, batteryLevel:battery, detectedAt:nowIso() }, batteryLow);
      var gps = s.gpsFixStatus === "NO_FIX" || s.gpsStatus === "NO_FIX" || s.isGpsUnavailable === true || s.location && s.location.hasFix === false;
      var gpsKey = sid + ":GPS_LOSS"; seen[gpsKey] = true;
      observe(gpsKey, { type:"gps_loss", shipmentId:sid, vaccineName:s.vaccineName || s.productName, location:s.currentLocation || s.location && s.location.name, detectedAt:nowIso() }, gps);
      var live = s.telemetry && s.telemetry.live || {};
      var stamp = live.lastSensorUpdate || live.timestamp || live.updatedAt || s.lastSensorUpdate;
      var stampMs = stamp ? Date.parse(stamp) : NaN;
      if (!Number.isFinite(stampMs) && typeof stamp === "number") stampMs = stamp < 1000000000000 ? stamp * 1000 : stamp;
      var stale = Number.isFinite(stampMs) && Date.now() - stampMs > 5 * 60 * 1000;
      var offline = String(s.sensorConnectivity || "").toLowerCase() === "offline" || s.isDeviceOffline === true || ["offline","disconnected"].indexOf(status) >= 0 || stale;
      var offKey = sid + ":DEVICE_OFFLINE"; seen[offKey] = true;
      observe(offKey, { type:"sensor_offline", shipmentId:sid, vaccineName:s.vaccineName || s.productName, location:s.currentLocation, detectedAt:nowIso(), lastSensorUpdate:stamp || null, details:stale ? "No update for more than five minutes" : "" }, offline);
      var route = s.routeRiskActive === true || s.routeDeviationDetected === true;
      var routeKey = sid + ":ROUTE_RISK"; seen[routeKey] = true;
      observe(routeKey, { type:"route_risk", shipmentId:sid, vaccineName:s.vaccineName || s.productName, region:s.currentLocation || s.region || "Transit corridor", suggestedRoute:s.recommendedRoute || s.suggestedRoute, location:s.currentLocation, detectedAt:nowIso() }, route);
    });
    Object.keys(candidates).forEach(function (key) {
      if (seen[key]) return;
      candidates[key].count = 0;
      var alertId = latestByCondition[key];
      if (alertId) resolve(alertId, "Shipment condition no longer observed");
    });
  }

  window.ColdGuardNotifications = {
    observe:observe, observeShipments:observeShipments, test:testAlert, acknowledge:acknowledge, resolve:resolve,
    renderCenter:renderCenter, renderSettings:renderSettings,
    getAlerts:getAllEvents, getSettings:function(){return prefs;}, getProviderHealth:function(){return providerHealth;},
    openCenter:function(){buttonNavigate("alert_center");}
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { window.setTimeout(initUi, 0); }, { once:true });
  else initUi();
})();