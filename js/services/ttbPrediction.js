/* ColdGuard Time-to-Breach (TTB) module.
   Forecasts are trend estimates, not guarantees. Demo readings are labelled. */
(function () {
  "use strict";
  var app = null, horizon = 120, warning = 60, critical = 15;
  var rawRemote = Object.create(null), liveHistory = Object.create(null), lastStamp = Object.create(null), lastRisk = Object.create(null), notified = Object.create(null);
  var $ = function (id) { return document.getElementById(id); };
  var num = function (v) { return v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null; };
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]; }); };
  function ms(v) { if (v == null || v === "") return null; var n = typeof v === "number" ? v : (/^\d{10,13}$/.test(String(v)) ? Number(v) : Date.parse(v)); return Number.isFinite(n) ? (n < 1e12 ? n * 1000 : n) : null; }
  function point(p) {
    if (!p || typeof p !== "object") return null;
    var t = num(p.temperature); if (t === null) t = num(p.temp); if (t === null) t = num(p.currentTemperature); if (t === null) t = num(p.value);
    var ts = ms(p.timestamp != null ? p.timestamp : p.ts != null ? p.ts : p.time != null ? p.time : p.recordedAt != null ? p.recordedAt : p.createdAt);
    return t === null || ts === null ? null : { t: t, ts: ts };
  }
  function points(raw) {
    var list = Array.isArray(raw) ? raw : (raw && typeof raw === "object" ? Object.keys(raw).map(function (k) { return raw[k]; }) : []);
    return list.map(point).filter(Boolean).sort(function (a, b) { return a.ts - b.ts; });
  }
  function ingest(id, record) {
    var live = record && record.telemetry && record.telemetry.live || {};
    var p = point({ temperature: live.temperature != null ? live.temperature : record && record.currentTemperature, timestamp: live.timestamp != null ? live.timestamp : record && record.lastSensorUpdate });
    if (!p || lastStamp[id] === p.ts) return;
    lastStamp[id] = p.ts;
    if (!liveHistory[id]) liveHistory[id] = [];
    if (!liveHistory[id].some(function (x) { return x.ts === p.ts; })) liveHistory[id].push(p);
    liveHistory[id] = liveHistory[id].sort(function (a, b) { return a.ts - b.ts; }).slice(-120);
  }
  function liveUser() { return !!(app && app.currentUser && !app.currentUser.isDemo && app.currentUser.uid); }
  function readings(s) {
    var id = String(s.id || s.shipmentId || ""), remote = rawRemote[id];
    if (liveUser()) {
      if (!remote) return { pts: [], source: "LIVE SENSOR", live: true };
      var tel = remote.telemetry || {};
      var raw = remote.temperatureHistory || remote.sensorHistory || remote.sensorReadings || remote.readings || tel.history || tel.readings || tel.temperatureHistory || (tel.live && tel.live.history);
      var pts = points(raw).concat(liveHistory[id] || []);
      var l = point({ temperature: (tel.live || {}).temperature != null ? tel.live.temperature : remote.currentTemperature, timestamp: (tel.live || {}).timestamp != null ? tel.live.timestamp : remote.lastSensorUpdate });
      if (l && !pts.some(function (p) { return p.ts === l.ts; })) pts.push(l);
      var byTime = Object.create(null); pts.sort(function (a, b) { return a.ts - b.ts; }).forEach(function (p) { byTime[p.ts] = p; });
      return { pts: Object.keys(byTime).map(function (k) { return byTime[k]; }).sort(function (a, b) { return a.ts - b.ts; }).slice(-120), source: "LIVE SENSOR", live: true };
    }
    return { pts: points(s.history), source: "SIMULATED DEMO", live: false };
  }
  function limits(s) {
    var p = app && app.vaccineProfiles && app.vaccineProfiles[s.vaccineCategory] || {};
    var min = num(s.minAllowedTemperature); if (min === null) min = num(s.minTemp); if (min === null) min = num(p.minTemp);
    var max = num(s.maxAllowedTemperature); if (max === null) max = num(s.maxTemp); if (max === null) max = num(p.maxTemp);
    return { min: min, max: max };
  }
  function fit(pts) {
    if (pts.length < 4 || (pts[pts.length - 1].ts - pts[0].ts) < 60000) return null;
    var origin = pts[0].ts, x = pts.map(function (p) { return (p.ts - origin) / 60000; }), y = pts.map(function (p) { return p.t; });
    var mx = x.reduce(function (a, b) { return a + b; }, 0) / x.length, my = y.reduce(function (a, b) { return a + b; }, 0) / y.length;
    var cov = 0, vx = 0, vy = 0;
    x.forEach(function (v, i) { cov += (v - mx) * (y[i] - my); vx += (v - mx) * (v - mx); vy += (y[i] - my) * (y[i] - my); });
    if (vx <= 0) return null;
    var slope = cov / vx, intercept = my - slope * mx, residual = 0;
    x.forEach(function (v, i) { var d = y[i] - (intercept + slope * v); residual += d * d; });
    return { slope: slope, intercept: intercept, origin: origin, r2: vy < 1e-10 ? (residual < 1e-10 ? 1 : 0) : Math.max(0, Math.min(1, 1 - residual / vy)), count: pts.length };
  }
  function duration(m) {
    if (!Number.isFinite(m) || m < 0) return "Unable to estimate";
    if (m < 1) return "Less than 1 min";
    var n = Math.round(m), h = Math.floor(n / 60), r = n % 60;
    return h && r ? h + (h === 1 ? " hour " : " hours ") + r + " min" : h ? h + (h === 1 ? " hour" : " hours") : n + " min";
  }
  function date(msValue) {
    if (!Number.isFinite(msValue)) return "Unable to estimate";
    try { return new Date(msValue).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZoneName: "short" }); }
    catch (e) { return new Date(msValue).toLocaleString() + " (local time)"; }
  }
  function evaluate(s) {
    var b = limits(s), d = readings(s), pts = d.pts, remote = rawRemote[String(s.id)], live = remote && remote.telemetry && remote.telemetry.live || {};
    var current = d.live && remote ? (num(live.temperature) !== null ? num(live.temperature) : num(remote.currentTemperature)) : num(s.currentTemperature);
    var last = pts.length ? pts[pts.length - 1] : null, stamp = last ? last.ts : ms(s.lastSensorUpdate), now = Date.now();
    var r = { id: String(s.id), current: current, min: b.min, max: b.max, pts: pts, source: d.source, stamp: stamp, status: "insufficient", risk: "Unable to estimate", ttb: "Unable to estimate", breachAt: null, reason: "Insufficient sensor data", model: null, horizon: horizon };
    if (b.min === null || b.max === null || b.min >= b.max || current === null) { r.reason = "Current temperature or safe limits are missing or invalid"; return r; }
    if (current < b.min || current > b.max) { r.status = "breached"; r.risk = "Breached"; r.ttb = "Already breached"; r.reason = current < b.min ? "Temperature is below the minimum safe limit" : "Temperature is above the maximum safe limit"; return r; }
    if (!stamp || now - stamp > 300000 || stamp > now + 60000) { r.reason = stamp ? "Sensor reading is stale (older than 5 minutes)" : "No timestamped sensor reading available"; return r; }
    var model = fit(pts.slice(-12));
    if (!model) { r.reason = "At least 4 timestamped readings spanning 1 minute are needed"; return r; }
    r.model = model;
    if (model.r2 < 0.35) { r.reason = "Recent readings are noisy or the temperature trend is reversing"; return r; }
    var slope = model.slope, delta = slope > 0.01 ? (b.max - current) / slope : slope < -0.01 ? (b.min - current) / slope : Infinity;
    if (!Number.isFinite(delta) || delta < 0) { r.status = "safe"; r.risk = "Safe"; r.ttb = "No breach predicted within the forecast window"; r.reason = Math.abs(slope) <= 0.01 ? "Temperature trend is stable" : "Observed trend is moving away from the relevant limit"; return r; }
    r.breachAt = now + delta * 60000;
    r.ttb = duration(delta);
    r.reason = slope > 0 ? "Temperature rising toward maximum limit" : "Temperature falling toward minimum limit";
    if (delta <= critical) { r.status = "critical"; r.risk = "Critical"; }
    else if (delta <= warning) { r.status = "warning"; r.risk = "Warning"; }
    else if (delta > horizon) { r.status = "safe"; r.risk = "Safe"; r.ttb = "No breach predicted within the forecast window"; r.breachAt = null; r.reason = "No limit crossing projected in the next " + horizon + " minutes"; }
    else { r.status = "safe"; r.risk = "Safe"; r.reason = "Breach projected within the horizon but beyond warning threshold"; }
    return r;
  }
  function badge(status) { return status === "breached" || status === "critical" ? "bg-red-100 text-red-800 border-red-200" : status === "warning" ? "bg-amber-100 text-amber-800 border-amber-200" : status === "safe" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"; }
  function horizons() { return [30, 60, 120, 360].map(function (m) { return '<option value="' + m + '"' + (horizon === m ? ' selected' : '') + '>' + (m < 60 ? m + ' minutes' : m / 60 + (m === 60 ? ' hour' : ' hours')) + '</option>'; }).join(""); }
  function chart(r) {
    var pts = r.pts.slice(-12), W = 700, H = 210, L = 46, R = 12, T = 14, B = 26, vals = pts.map(function (p) { return p.t; }).concat([r.min, r.max, r.current]);
    if (r.model) vals.push(r.current + r.model.slope * horizon);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max(0.5, (hi - lo) * 0.12); lo -= pad; hi += pad;
    var start = pts.length ? Math.min(pts[0].ts, Date.now() - 60000) : Date.now() - 60000, end = Date.now() + horizon * 60000;
    var x = function (t) { return L + Math.max(0, Math.min(1, (t - start) / (end - start))) * (W - L - R); }, y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="w-full h-auto" role="img" aria-label="Observed temperature, safe limits and projected temperature trend">';
    [0, 1, 2, 3].forEach(function (i) { var yy = T + i * (H - T - B) / 3; out += '<line x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '" stroke="#e2e8f0"/><text x="2" y="' + (yy + 3) + '" font-size="10" fill="#64748b">' + (hi - i * (hi - lo) / 3).toFixed(1) + '°</text>'; });
    out += '<line x1="' + L + '" y1="' + y(r.max) + '" x2="' + (W - R) + '" y2="' + y(r.max) + '" stroke="#dc2626" stroke-width="1.5"/><line x1="' + L + '" y1="' + y(r.min) + '" x2="' + (W - R) + '" y2="' + y(r.min) + '" stroke="#2563eb" stroke-width="1.5"/>';
    if (pts.length > 1) { out += '<polyline fill="none" stroke="#2563eb" stroke-width="2.5" points="' + pts.map(function (p) { return x(p.ts).toFixed(1) + ',' + y(p.t).toFixed(1); }).join(" ") + '"/>'; pts.forEach(function (p) { out += '<circle cx="' + x(p.ts) + '" cy="' + y(p.t) + '" r="3" fill="#2563eb"/>'; }); }
    if (r.model) { var endTemp = r.current + r.model.slope * horizon; out += '<line x1="' + x(Date.now()) + '" y1="' + y(r.current) + '" x2="' + x(end) + '" y2="' + y(endTemp) + '" stroke="#7c3aed" stroke-width="2.5" stroke-dasharray="7 5"/>'; if (r.breachAt && r.breachAt <= end) { var limit = r.model.slope > 0 ? r.max : r.min; out += '<line x1="' + x(r.breachAt) + '" y1="' + T + '" x2="' + x(r.breachAt) + '" y2="' + (H - B) + '" stroke="#dc2626" stroke-dasharray="4 4"/><circle cx="' + x(r.breachAt) + '" cy="' + y(limit) + '" r="5" fill="#dc2626" stroke="#fff" stroke-width="2"/>'; } }
    return out + '<text x="' + L + '" y="' + (H - 6) + '" font-size="10" fill="#64748b">History</text><text x="' + (W - 100) + '" y="' + (H - 6) + '" font-size="10" fill="#7c3aed">Forecast +' + horizon + 'm</text></svg>';
  }
  function card(s, r, where) {
    var current = r.current === null ? "—" : r.current.toFixed(2) + " °C", range = r.min === null || r.max === null ? "Limits unavailable" : r.min + "°C to " + r.max + "°C";
    var fitText = r.model && r.model.r2 >= 0.55 ? '<p class="text-[11px] text-slate-600 mt-2">Trend fit: ' + (r.model.r2 >= 0.8 ? "strong" : "moderate") + ' (R² ' + r.model.r2.toFixed(2) + ')</p>' : "";
    return '<section class="ttb-card bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4" data-ttb-id="' + esc(s.id) + '">' +
      '<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div><div class="flex flex-wrap items-center gap-2"><span class="text-[10px] uppercase tracking-widest font-bold text-slate-500">Time-to-Breach Prediction Horizon</span><span class="text-[10px] px-2 py-0.5 rounded-full border ' + badge(r.status) + '">' + esc(r.risk.toUpperCase()) + '</span></div><h3 class="text-lg font-extrabold text-slate-900 mt-1">' + esc(s.id) + ' · ' + esc(s.vaccineName || s.productName || "Shipment") + '</h3><p class="text-xs text-slate-500 mt-1">TTB is an estimate from available readings, not a guaranteed breach time.</p></div><label class="text-xs text-slate-500 flex items-center gap-2">Forecast horizon<select class="ttb-horizon border border-slate-300 rounded-lg bg-white px-2 py-1.5 text-xs" data-placement="' + where + '">' + horizons() + '</select></label></div>' +
      '<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">' +
      '<div class="rounded-xl bg-slate-50 border border-slate-200 p-3"><div class="text-[10px] uppercase font-bold text-slate-500">Estimated time to breach</div><div class="text-lg font-extrabold mt-1">' + esc(r.ttb) + '</div></div>' +
      '<div class="rounded-xl bg-slate-50 border border-slate-200 p-3"><div class="text-[10px] uppercase font-bold text-slate-500">Current temperature</div><div class="text-lg font-extrabold mt-1">' + esc(current) + '</div></div>' +
      '<div class="rounded-xl bg-slate-50 border border-slate-200 p-3"><div class="text-[10px] uppercase font-bold text-slate-500">Safe temperature range</div><div class="text-sm font-bold mt-2">' + esc(range) + '</div></div>' +
      '<div class="rounded-xl bg-slate-50 border border-slate-200 p-3"><div class="text-[10px] uppercase font-bold text-slate-500">Predicted breach time</div><div class="text-sm font-bold mt-2">' + esc(r.status === "breached" ? "Already breached" : r.breachAt ? date(r.breachAt) : "Unable to estimate") + '</div></div></div>' +
      '<div class="grid grid-cols-1 lg:grid-cols-12 gap-4"><div class="lg:col-span-8 min-w-0"><div class="flex flex-wrap gap-3 text-[10px] text-slate-500 mb-2"><span class="text-blue-700">━ Observed readings</span><span class="text-purple-700">╌ Projected trend</span><span class="text-red-600">━ Upper limit</span><span class="text-blue-500">━ Lower limit</span></div>' +
      (r.pts.length ? chart(r) : '<div class="h-40 flex items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Insufficient timestamped readings for chart</div>') +
      '<div class="text-[10px] text-slate-500 mt-1">Forecast: next ' + horizon + ' minutes · Time shown in your local time zone</div></div><div class="lg:col-span-4 space-y-2"><div class="rounded-xl border border-slate-200 p-3"><div class="text-xs font-bold text-slate-700">Prediction status</div><p class="text-sm font-semibold mt-1">' + esc(r.reason) + '</p><p class="text-[11px] text-slate-500 mt-2">Last reading: ' + esc(r.stamp ? date(r.stamp) : "Not recorded") + '</p><p class="text-[11px] text-slate-500 mt-1">Data source: <b>' + esc(r.source) + '</b></p>' + fitText + '</div><div class="rounded-xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-900">Linear regression is used only when timestamped readings are sufficient. R² describes trend fit, not validated prediction accuracy.</div></div></div></section>';
  }
  function list() { return app && app.simulation && Array.isArray(app.simulation.shipments) ? app.simulation.shipments : []; }
  function selected() { var a = list(); return a.find(function (s) { return String(s.id) === String(app.selectedShipmentId); }) || a[0] || null; }
  function notifyRisk(results) {
    results.forEach(function (r) { var prev = lastRisk[r.id]; lastRisk[r.id] = r.status; if (!prev || prev === r.status || (r.status !== "warning" && r.status !== "critical")) return; if (notified[r.id] && Date.now() - notified[r.id] < 600000) return; notified[r.id] = Date.now(); if (app.modals && app.modals.showToast) app.modals.showToast("TTB " + r.risk + " for " + r.id + ": " + r.ttb + ". " + r.reason, r.status === "critical" ? "critical" : "warning"); });
  }
  function fleet(results) {
    var wrap = $("shipments-table-wrapper"); if (!wrap) return;
    var body = wrap.querySelector("tbody"); if (!body) return;
    var head = wrap.querySelector("thead tr");
    if (head && !head.querySelector(".ttb-th")) { var th = document.createElement("th"); th.className = "p-3.5 text-center ttb-th"; th.textContent = "Time to Breach"; head.insertBefore(th, head.lastElementChild); }
    var byId = Object.create(null); results.forEach(function (r) { byId[r.id] = r; });
    Array.prototype.slice.call(body.querySelectorAll("tr.shipment-row")).forEach(function (row) {
      var r = byId[row.getAttribute("data-id")]; if (!r) return;
      var td = row.querySelector(".ttb-td"); if (!td) { td = document.createElement("td"); td.className = "p-3.5 text-center ttb-td"; row.insertBefore(td, row.lastElementChild); }
      td.innerHTML = '<div class="font-bold text-xs">' + esc(r.ttb) + '</div><div class="text-[10px] mt-1">' + esc(r.risk) + '</div>';
      row.setAttribute("data-ttb-status", r.status); row.setAttribute("data-ttb-minutes", r.breachAt ? Math.max(0, (r.breachAt - Date.now()) / 60000) : 999999);
    });
    var sort = $("ttb-sort"), filter = $("ttb-filter"), rows = Array.prototype.slice.call(body.querySelectorAll("tr.shipment-row"));
    if (filter) rows.forEach(function (row) { row.hidden = filter.value !== "all" && row.getAttribute("data-ttb-status") !== filter.value; });
    if (sort && sort.value === "shortest") { rows.sort(function (a, b) { return Number(a.getAttribute("data-ttb-minutes")) - Number(b.getAttribute("data-ttb-minutes")); }); rows.forEach(function (row) { body.appendChild(row); }); }
  }
  function render() {
    if (!app || !$("main-content-view")) return;
    var sList = list(), results = sList.map(evaluate), s = selected(); notifyRisk(results);
    if (app.currentView === "dashboard" && s) {
      var kpi = $("kpi-cards-grid");
      if (kpi) { var root = $("ttb-dashboard"); if (!root) { root = document.createElement("div"); root.id = "ttb-dashboard"; root.className = "mt-4"; kpi.insertAdjacentElement("afterend", root); }
        var r = results.find(function (x) { return x.id === String(s.id); }) || evaluate(s);
        root.innerHTML = card(s, r, "dashboard") + '<div class="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500"><span>Fleet risk: ' + results.filter(function (x) { return x.status === "warning" || x.status === "critical" || x.status === "breached"; }).length + ' shipment(s).</span><label class="flex items-center gap-2">Select shipment<select id="ttb-selected" class="border border-slate-300 rounded-lg px-2 py-1.5 bg-white">' + sList.map(function (x) { return '<option value="' + esc(x.id) + '"' + (String(x.id) === String(s.id) ? " selected" : "") + '>' + esc(x.id + " · " + (x.vaccineName || x.productName || "")) + '</option>'; }).join("") + '</select></label></div>';
      }
    } else { var old = $("ttb-dashboard"); if (old) old.remove(); }
    if (app.currentView === "details" && s) {
      var telemetry = $("telemetry-cards-container");
      if (telemetry) { var details = $("ttb-details"); if (!details) { details = document.createElement("div"); details.id = "ttb-details"; telemetry.insertAdjacentElement("afterend", details); } details.className = "mt-4"; details.innerHTML = card(s, results.find(function (x) { return x.id === String(s.id); }) || evaluate(s), "details"); }
    } else { var od = $("ttb-details"); if (od) od.remove(); }
    if (app.currentView === "shipments") {
      var search = $("filter-search-input"), parent = search && search.closest(".bg-white.rounded-2xl.border");
      if (parent && !$("ttb-controls")) { var c = document.createElement("div"); c.id = "ttb-controls"; c.className = "flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100"; c.innerHTML = '<span class="text-xs font-bold">TTB controls</span><label class="text-xs flex items-center gap-2">Sort <select id="ttb-sort" class="border rounded-lg px-2 py-1.5 bg-white"><option value="default">Default order</option><option value="shortest">Shortest TTB first</option></select></label><label class="text-xs flex items-center gap-2">Risk filter <select id="ttb-filter" class="border rounded-lg px-2 py-1.5 bg-white"><option value="all">All</option><option value="breached">Breached</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="safe">Safe</option><option value="insufficient">Insufficient data</option></select></label>'; parent.appendChild(c); }
      fleet(results);
    } else { var fc = $("ttb-controls"); if (fc) fc.remove(); }
  }
  function change(e) {
    var t = e.target;
    if (t && t.classList && t.classList.contains("ttb-horizon")) { var v = num(t.value); if ([30, 60, 120, 360].indexOf(v) >= 0) { horizon = v; render(); } }
    if (t && t.id === "ttb-selected") { app.selectedShipmentId = t.value; render(); }
    if (t && (t.id === "ttb-sort" || t.id === "ttb-filter")) fleet(list().map(evaluate));
  }
  function boot() {
    app = window.coldGuardApp; if (!app) { window.setTimeout(boot, 50); return; }
    if (app.dbService && app.dbService.on) app.dbService.on("shipments", function (records) { if (!Array.isArray(records)) return; records.forEach(function (rec) { var id = String(rec.id || rec.shipmentId || ""); if (id) { rawRemote[id] = rec; ingest(id, rec); } }); render(); });
    document.addEventListener("change", change);
    var original = app.renderCurrentView.bind(app); app.renderCurrentView = function () { original(); render(); };
    var tableRender = app.renderShipmentsTable.bind(app); app.renderShipmentsTable = function () { tableRender(); render(); };
    render(); window.setInterval(render, 15000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { window.setTimeout(boot, 0); }); else boot();
})();