/* ColdGuard Dual Thermal Curve.
 * Uses only explicitly mapped sensor channels. Never treats an untyped generic temperature
 * field as air or vial temperature. No vial estimate is generated without a validated model.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var app = null, chart = null, remoteById = Object.create(null), selectedId = null;
  var windowMinutes = 60, lastThermalStatus = Object.create(null), lastAlertAt = Object.create(null);
  var chartSource = "unavailable";
  var WINDOWS = [30, 60, 120, 360, 1440];
  var COLORS = { air: "#2563eb", vial: "#7c3aed", max: "#dc2626", min: "#0ea5e9" };

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]; }); }
  function n(v) { if (v === null || v === undefined || v === "") return null; var x = Number(v); return Number.isFinite(x) ? x : null; }
  function ts(v) {
    if (typeof v === "number" && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
    if (typeof v === "string" && v.trim()) { var d = Date.parse(v); return Number.isFinite(d) ? d : null; }
    return null;
  }
  function first(obj, keys) { for (var i=0;i<keys.length;i++) if (obj && obj[keys[i]] !== undefined && obj[keys[i]] !== null) return obj[keys[i]]; return null; }
  function normalizePoint(p, kind, fallbackSource) {
    if (!p || typeof p !== "object") return null;
    var val = kind === "air" ? first(p, ["airTemperature","air_temperature_c","ambientTemperature","ambient_temperature_c"])
      : first(p, ["liquidTemperature","vialTemperature","coreTemperature","liquid_temperature_c","vial_temperature_c","core_temperature_c"]);
    if (val === null) return null;
    val = n(val); var time = ts(first(p, ["timestamp","ts","time","recordedAt","createdAt","at"]));
    if (val === null || time === null || Math.abs(val) > 150) return null;
    return { x: time, y: val, source: String(p.source || fallbackSource || "sensor"), mode: String(p.measurementType || p.mode || "measured") };
  }
  function normalizeHistory(raw, kind, fallbackSource) {
    if (!raw) return [];
    var arr = Array.isArray(raw) ? raw : Object.keys(raw).map(function (k) { var p = raw[k]; return p && typeof p === "object" ? Object.assign({ _key:k }, p) : p; });
    return arr.map(function (p) { return normalizePoint(p, kind, fallbackSource); }).filter(Boolean).sort(function(a,b){return a.x-b.x;});
  }
  function explicitConfig(rec, live, kind) {
    var config = rec && (rec.sensorConfiguration || rec.sensors || rec.sensorMap) || {};
    var sensor = config[kind] || config[kind === "air" ? "ambient" : "vial"] || {};
    var role = String(sensor.role || sensor.type || sensor.sensorType || "").toLowerCase();
    var id = sensor.sensorId || sensor.id || sensor.deviceId;
    var fieldRole = String(live && (live.sensorRole || live.sensorType || live.temperatureType) || "").toLowerCase();
    var roleMatch = kind === "air" ? /air|ambient|container/.test(role + " " + fieldRole) : /vial|liquid|core|product/.test(role + " " + fieldRole);
    var mappedId = kind === "air" ? first(live, ["airSensorId","ambientSensorId"]) : first(live, ["liquidSensorId","vialSensorId","coreSensorId"]);
    return !!(sensor.mapped === true || roleMatch || (id && mappedId && String(id) === String(mappedId)));
  }
  function collect(s) {
    var id = String(s.id || ""), remote = remoteById[id] || null, live = remote && remote.telemetry && remote.telemetry.live || {};
    var liveFlag = !!remote;
    var source = liveFlag ? "LIVE SENSOR" : "SIMULATED DEMO";
    var tel = remote && remote.telemetry || {};
    var rawHistory = tel.history || tel.readings || remote && (remote.sensorHistory || remote.sensorReadings || remote.readings) || null;
    var air = normalizeHistory(rawHistory, "air", source);
    var vial = normalizeHistory(rawHistory, "vial", source);

    // Accept explicit typed histories; generic {temperature:...} records are intentionally ignored.
    var explicitAirHistory = remote && (remote.airTemperatureHistory || remote.ambientTemperatureHistory || tel.airTemperatureHistory || tel.ambientTemperatureHistory);
    var explicitVialHistory = remote && (remote.liquidTemperatureHistory || remote.vialTemperatureHistory || remote.coreTemperatureHistory || tel.liquidTemperatureHistory || tel.vialTemperatureHistory);
    if (explicitAirHistory) air = normalizeHistory(explicitAirHistory, "air", source);
    if (explicitVialHistory) vial = normalizeHistory(explicitVialHistory, "vial", source);

    var airMapped = liveFlag && (explicitConfig(remote, live, "air") || air.length > 0 ||
      n(first(live, ["airTemperature","ambientTemperature","air_temperature_c","ambient_temperature_c"])) !== null);
    var vialMapped = liveFlag && (explicitConfig(remote, live, "vial") || vial.length > 0 ||
      n(first(live, ["liquidTemperature","vialTemperature","coreTemperature","liquid_temperature_c","vial_temperature_c","core_temperature_c"])) !== null);
    if (liveFlag) {
      var nowTs = ts(first(live, ["timestamp","ts","time"])) || ts(remote.lastSensorUpdate);
      var av = airMapped ? n(first(live, ["airTemperature","ambientTemperature","air_temperature_c","ambient_temperature_c"])) : null;
      var vv = vialMapped ? n(first(live, ["liquidTemperature","vialTemperature","coreTemperature","liquid_temperature_c","vial_temperature_c","core_temperature_c"])) : null;
      if (av !== null && nowTs !== null && !air.some(function(p){return p.x===nowTs;})) air.push({x:nowTs,y:av,source:"LIVE SENSOR",mode:"measured"});
      if (vv !== null && nowTs !== null && !vial.some(function(p){return p.x===nowTs;})) vial.push({x:nowTs,y:vv,source:"LIVE SENSOR",mode:"measured"});
      air = air.sort(function(a,b){return a.x-b.x;}).slice(-500);
      vial = vial.sort(function(a,b){return a.x-b.x;}).slice(-500);
    } else {
      // Demo history is kept as its own untyped series. It is not relabelled as air or vial.
      var demo = normalizeHistory(s.history, "air", "SIMULATED DEMO");
      // For historical demo values, use only explicit per-sample fields. Generic history stays unclassified.
      var genericDemo = (Array.isArray(s.history) ? s.history : []).map(function(p){
        var time = ts(first(p, ["timestamp","ts","time","recordedAt"]));
        var value = n(first(p, ["temperature","temp","currentTemperature"]));
        return time !== null && value !== null ? {x:time,y:value,source:"SIMULATED DEMO",mode:"simulated",untyped:true} : null;
      }).filter(Boolean);
      var explicitDemoAir = normalizeHistory(s.history, "air", "SIMULATED DEMO");
      var explicitDemoVial = normalizeHistory(s.history, "vial", "SIMULATED DEMO");
      air = explicitDemoAir;
      vial = explicitDemoVial;
      var demoStamp = ts(s.lastSensorUpdate) || Date.now();
      var demoAirCurrent = n(first(s, ["ambientTemperature","airTemperature"]));
      var demoVialCurrent = n(first(s, ["coreTemperature","vialTemperature","liquidTemperature"]));
      if (demoAirCurrent !== null && !air.length) air.push({x:demoStamp,y:demoAirCurrent,source:"SIMULATED DEMO",mode:"simulated"});
      if (demoVialCurrent !== null && !vial.length) vial.push({x:demoStamp,y:demoVialCurrent,source:"SIMULATED DEMO",mode:"simulated"});
      // The generic demo curve is rendered as unclassified sensor data, never as air or vial.
      airMapped = false; vialMapped = false;
      return { air:air, vial:vial, generic:genericDemo, source:source, live:false, airMapped:false, vialMapped:false, remote:null, genericDemo:true };
    }
    return { air:air, vial:vial, generic:[], source:source, live:liveFlag, airMapped:airMapped, vialMapped:vialMapped, remote:remote, genericDemo:false };
  }
  function limits(s) {
    var min=n(s.minAllowedTemperature); if(min===null) min=n(s.minTemp);
    var max=n(s.maxAllowedTemperature); if(max===null) max=n(s.maxTemp);
    return {min:min,max:max};
  }
  function newest(points) { return points && points.length ? points[points.length-1] : null; }
  function fresh(p) { return !!p && Date.now()-p.x <= 5*60*1000 && p.x <= Date.now()+60000; }
  function fit(points) {
    var pts=(points||[]).filter(function(p){return Number.isFinite(p.x)&&Number.isFinite(p.y);}).slice(-30);
    if(pts.length<4) return null;
    var t0=pts[0].x, xs=pts.map(function(p){return (p.x-t0)/60000;}), ys=pts.map(function(p){return p.y;});
    var mx=xs.reduce(function(a,b){return a+b;},0)/xs.length, my=ys.reduce(function(a,b){return a+b;},0)/ys.length;
    var den=xs.reduce(function(a,x){return a+(x-mx)*(x-mx);},0); if(den<=0) return null;
    var slope=xs.reduce(function(a,x,i){return a+(x-mx)*(ys[i]-my);},0)/den;
    var intercept=my-slope*mx, ssTot=ys.reduce(function(a,y){return a+(y-my)*(y-my);},0);
    var ssRes=ys.reduce(function(a,y,i){var e=y-(intercept+slope*xs[i]);return a+e*e;},0);
    var r2=ssTot===0 ? 1 : 1-ssRes/ssTot;
    var span=pts[pts.length-1].x-pts[0].x;
    if(span<60000 || r2<0.65 || !Number.isFinite(slope)) return null;
    return {slope:slope,intercept:intercept,t0:t0,r2:r2,count:pts.length,span:span,predict:function(at){return intercept+slope*((at-t0)/60000);}};
  }
  function ttb(points, current, lim, mode) {
    var p=newest(points);
    if(!p || !fresh(p) || current===null || lim.min===null || lim.max===null) return {text:"Unavailable",at:null,reason:"Fresh timestamped readings are unavailable"};
    if(current<lim.min || current>lim.max) return {text:"Already breached",at:p.x,reason:"Current value is outside the configured safe range"};
    var model=fit(points);
    if(!model) return {text:"Unavailable",at:null,reason:"Insufficient history or trend fit for a reliable countdown"};
    var slope=model.slope, target=slope>0?lim.max:slope<0?lim.min:null;
    if(target===null || Math.abs(slope)<0.005) return {text:"No crossing projected",at:null,reason:"No supported crossing trend"};
    var mins=(target-current)/slope;
    if(!Number.isFinite(mins)||mins<=0) return {text:"Unavailable",at:null,reason:"Trend does not support a valid crossing estimate"};
    return {text:mins<60?Math.round(mins)+" min":(mins<1440?(mins/60).toFixed(1)+" h":(mins/1440).toFixed(1)+" d"),at:Date.now()+mins*60000,reason:"Linear trend; R² "+model.r2.toFixed(2)+" (not a validated product model)"};
  }
  function thermalStatus(data, lim, airNow, vialNow) {
    if(vialNow && (vialNow.y<lim.min || vialNow.y>lim.max)) return "Vial Temperature Breach";
    if(vialNow && airNow && (airNow.y<lim.min || airNow.y>lim.max) && vialNow.y>=lim.min && vialNow.y<=lim.max) return "Air Spike — Liquid Temperature Within Range";
    if(vialNow && (vialNow.y<=lim.min+0.5 || vialNow.y>=lim.max-0.5)) return "Potential Product Temperature Risk";
    if(airNow && (airNow.y<lim.min || airNow.y>lim.max)) return "Potential Product Temperature Risk";
    if(!vialNow) return "Liquid Thermal Status Unknown";
    return "Within configured range";
  }
  function detectSpike(points, lim) {
    var now=Date.now(), pts=(points||[]).filter(function(p){return now-p.x<=windowMinutes*60000;});
    if(pts.length<2) return null;
    var peak=pts[0], start=null, end=null;
    for(var i=1;i<pts.length;i++){
      var dt=(pts[i].x-pts[i-1].x)/60000, delta=pts[i].y-pts[i-1].y;
      if(dt>0 && dt<=5 && delta>=1.0 && (pts[i].y>lim.max || pts[i-1].y>lim.max || pts[i].y-lim.max>=0.5)){start=pts[i-1].x;end=pts[i].x;}
      if(pts[i].y>peak.y) peak=pts[i];
    }
    if(start===null) return null;
    var related=pts.filter(function(p){return p.x>=start && p.x<=end;});
    return {start:start,end:end,peak:peak.y,duration:Math.max(1,Math.round((end-start)/60000)),count:related.length};
  }
  function tooltip(context) {
    var p=context.raw || {};
    return ["Timestamp: "+(p.x?new Date(p.x).toLocaleString():"Unavailable"),"Temperature: "+(p.y==null?"—":p.y.toFixed(2)+"°C"),"Source: "+(p.source||"unknown"),"Value: "+(p.mode==="simulated"?"simulated":p.mode==="estimated"?"estimated":"measured")];
  }
  function chartConfig(s, data, lim) {
    var cutoff=Date.now()-windowMinutes*60000, all=[];
    ["air","vial","generic"].forEach(function(k){(data[k]||[]).forEach(function(p){if(p.x>=cutoff)all.push(p.x);});});
    all=Array.from(new Set(all)).sort(function(a,b){return a-b;});
    if(!all.length) all=[Date.now()];
    function vals(key){var map=Object.create(null);(data[key]||[]).forEach(function(p){if(p.x>=cutoff)map[p.x]=p;});return all.map(function(x){return map[x]||{x:x,y:null};});}
    var datasets=[];
    if(data.airMapped || data.air.length) datasets.push({label:data.airMapped?"Air temperature":"Explicit air/ambient (demo)",data:vals("air"),borderColor:COLORS.air,backgroundColor:COLORS.air,tension:0.18,spanGaps:false,pointRadius:2,parsing:false});
    if(data.vialMapped || data.vial.length) datasets.push({label:data.vialMapped?"Measured vial/liquid temperature":"Explicit vial/core (demo)",data:vals("vial"),borderColor:COLORS.vial,backgroundColor:COLORS.vial,tension:0.18,spanGaps:false,pointRadius:3,parsing:false});
    if(data.genericDemo && data.generic.length) datasets.push({label:"Simulated sensor history (role unspecified)",data:vals("generic"),borderColor:"#64748b",backgroundColor:"#64748b",borderDash:[4,4],tension:0.18,spanGaps:false,pointRadius:2,parsing:false});
    if(lim.max!==null) datasets.push({label:"Upper safe limit",data:all.map(function(x){return{x:x,y:lim.max};}),borderColor:COLORS.max,borderDash:[6,4],pointRadius:0,borderWidth:1.5,spanGaps:false,parsing:false});
    if(lim.min!==null) datasets.push({label:"Lower safe limit",data:all.map(function(x){return{x:x,y:lim.min};}),borderColor:COLORS.min,borderDash:[6,4],pointRadius:0,borderWidth:1.5,spanGaps:false,parsing:false});
    // Prediction is added only from a supported, measured vial trend and is drawn through the limit crossing.
    var vn=newest(data.vial), pred=vn && data.vialMapped ? ttb(data.vial,vn.y,lim,"vial") : null;
    if(pred && pred.at && pred.at>Date.now() && pred.at<=Date.now()+7*24*60*60000) {
      var model=fit(data.vial);
      if(model) datasets.push({label:"Projected vial trend (not validated)",data:[{x:Date.now(),y:vn.y},{x:pred.at,y:model.predict(pred.at)}],borderColor:"#a78bfa",borderDash:[7,5],pointRadius:[0,4],spanGaps:false,parsing:false});
    }
    return {type:"line",data:{datasets:datasets},options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:"nearest",intersect:false},plugins:{legend:{labels:{usePointStyle:true,boxWidth:7,font:{size:10}}},tooltip:{callbacks:{title:function(items){return items.length&&items[0].raw&&items[0].raw.x?new Date(items[0].raw.x).toLocaleString():"Timestamp unavailable";},label:function(ctx){var p=ctx.raw||{};return ctx.dataset.label+": "+(p.y==null?"missing":Number(p.y).toFixed(2)+"°C")+(p.source?" · "+p.source:"")+(p.mode?" · "+p.mode:"");},afterBody:function(items){return items.length?tooltip(items[0]).slice(2):[];}}}},scales:{x:{type:"linear",ticks:{maxTicksLimit:6,callback:function(v){return new Date(Number(v)).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});}},title:{display:true,text:"Timestamp"}},y:{title:{display:true,text:"Temperature (°C)"}}}}};
  }
  function ensureCard() {
    var root=$("details-view-root"); if(!root) return null;
    var card=$("dual-thermal-card");
    if(!card) {
      card=document.createElement("section"); card.id="dual-thermal-card";
      card.className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4";
      var anchor=$("ttb-details") || $("hardware-probe-card") || $("telemetry-cards-container") || root.firstElementChild;
      if(anchor && anchor.id==="ttb-details") anchor.insertAdjacentElement("afterend",card);
      else if(anchor && anchor.id==="hardware-probe-card") anchor.insertAdjacentElement("afterend",card);
      else if(anchor) anchor.insertAdjacentElement("afterend",card);
      else root.appendChild(card);
    }
    return card;
  }
  function correctLegacyProbeCard(s, data, airCurrent, vialCurrent) {
    var hardware = $("hardware-probe-card");
    if (!hardware) return;
    var heading = hardware.querySelector(".text-xs.font-bold.text-slate-900");
    if (heading && /Hardware Telemetry Probe/.test(heading.textContent)) heading.textContent = "Sensor channel mapping";
    var description = hardware.querySelector("p.text-\\[11px\\].text-slate-500");
    if (description) description.textContent = "Temperature channels are shown as measured only when explicitly mapped in incoming telemetry; demo values are labelled simulated.";
    var cells = hardware.querySelectorAll(":scope > div.grid > div");
    if (!cells.length) return;
    var live = !!data.live;
    var airValue = live ? (data.airMapped && airCurrent ? airCurrent.y : null) : n(first(s, ["ambientTemperature","airTemperature"]));
    var vialValue = live ? (data.vialMapped && vialCurrent ? vialCurrent.y : null) : n(first(s, ["coreTemperature","vialTemperature","liquidTemperature"]));
    function setCell(cell, labelText, value) {
      if (!cell) return;
      var label = null;
      Array.prototype.forEach.call(cell.querySelectorAll("div"), function(el) {
        if (!label && el.className && String(el.className).indexOf("uppercase") >= 0 && String(el.className).indexOf("font-bold") >= 0) label = el;
      });
      if (label) label.textContent = labelText;
      var valueEl = cell.querySelector(".text-xl");
      if (valueEl) valueEl.textContent = value === null ? "Unavailable" : value.toFixed(2) + "°C";
    }
    setCell(cells[0], live ? "Mapped vial/liquid sensor" : "Simulated core temperature", vialValue);
    setCell(cells[1], live ? "Mapped air/ambient sensor" : "Simulated ambient temperature", airValue);
    setCell(cells[2], "Thermal difference (known values only)", airValue !== null && vialValue !== null ? (airValue-vialValue).toFixed(2)+"°C" : "Unavailable");
  }

  function render() {
    if(!app || !app.simulation) return;
    var root=$("details-view-root");
    if(!root) { if(chart){chart.destroy();chart=null;} selectedId=null; return; }
    var s=(app.simulation.shipments||[]).find(function(x){return String(x.id)===String(app.selectedShipmentId);}) || (app.simulation.shipments||[])[0];
    if(!s) return;
    if(selectedId!==String(s.id)){if(chart){chart.destroy();chart=null;}selectedId=String(s.id);}
    var data=collect(s), lim=limits(s), an=newest(data.air), vn=newest(data.vial), gn=newest(data.generic);
    var airCurrent=an && fresh(an) ? an : null, vialCurrent=vn && fresh(vn) ? vn : null;
    var genericCurrent=gn && fresh(gn) ? gn : null;
    var status=thermalStatus(data,lim,airCurrent||genericCurrent,vialCurrent);
    var airTtb=airCurrent && data.airMapped ? ttb(data.air,airCurrent.y,lim,"air") : {text:"Unavailable",reason:"No explicitly mapped, fresh air-temperature series"};
    var vialTtb=vialCurrent && data.vialMapped ? ttb(data.vial,vialCurrent.y,lim,"vial") : {text:"Vial TTB Unavailable",reason:"No measured vial series or validated thermal-response model"};
    correctLegacyProbeCard(s, data, airCurrent || genericCurrent, vialCurrent);
    var card=ensureCard(); if(!card) return;
    var sourceLabel=data.live?"LIVE SENSOR DATA":"SIMULATED DEMO DATA";
    var airLabel=data.airMapped?"Measured air temperature":(data.air.length?"Simulated ambient temperature":(data.genericDemo&&genericCurrent?"Simulated sensor temperature (role unspecified)":"Air temperature unavailable"));
    var vialLabel=data.vialMapped?"Measured vial/liquid temperature":(data.vial.length?"Simulated vial/core temperature":"Vial temperature unavailable");
    var spike=detectSpike(data.airMapped?data.air:data.generic,lim);
    var eventHtml=spike?'<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Air excursion candidate</strong> · '+new Date(spike.start).toLocaleString()+' · duration '+spike.duration+' min · peak '+spike.peak.toFixed(2)+'°C. Do not dismiss; follow the configured cold-chain protocol.</div>':'<div class="text-xs text-slate-500">No short-duration air spike detected in this window, or insufficient typed air samples.</div>';
    card.innerHTML='<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><div class="text-sm font-bold text-slate-900">Dual Thermal Curve · Air vs. Vial</div><p class="text-xs text-slate-500 mt-1">Only explicitly mapped sensor channels are labelled as measured. No unvalidated vial-temperature estimate is generated.</p></div><div class="flex flex-wrap items-center gap-2"><span class="text-[10px] font-bold rounded-full px-2 py-1 bg-slate-100 text-slate-700">'+sourceLabel+'</span><label class="text-xs text-slate-600">Window <select id="dual-thermal-window" class="ml-1 border border-slate-200 rounded-lg px-2 py-1 bg-white">'+WINDOWS.map(function(m){return '<option value="'+m+'" '+(m===windowMinutes?'selected':'')+'>'+({30:"30 min",60:"1 hour",120:"2 hours",360:"6 hours",1440:"24 hours"}[m])+'</option>';}).join("")+'</select></label></div></div>'+
      '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3"><div class="rounded-xl bg-blue-50 border border-blue-100 p-3"><div class="text-[10px] uppercase font-bold text-blue-700">'+esc(airLabel)+'</div><div class="text-xl font-extrabold font-mono text-blue-950 mt-1">'+(airCurrent?airCurrent.y.toFixed(2)+"°C":genericCurrent?genericCurrent.y.toFixed(2)+"°C":"Unavailable")+'</div><div class="text-[10px] text-slate-500 mt-1">'+(airCurrent?new Date(airCurrent.x).toLocaleString():genericCurrent?new Date(genericCurrent.x).toLocaleString():"No fresh timestamped reading")+'</div><div class="text-xs font-semibold mt-2">Air TTB: '+esc(airTtb.text)+'</div></div>'+
      '<div class="rounded-xl bg-violet-50 border border-violet-100 p-3"><div class="text-[10px] uppercase font-bold text-violet-700">'+esc(vialLabel)+'</div><div class="text-xl font-extrabold font-mono text-violet-950 mt-1">'+(vialCurrent?vialCurrent.y.toFixed(2)+"°C":"Unavailable")+'</div><div class="text-[10px] text-slate-500 mt-1">'+(vialCurrent?new Date(vialCurrent.x).toLocaleString():"No fresh measured vial reading")+'</div><div class="text-xs font-semibold mt-2">Vial TTB: '+esc(vialTtb.text)+'</div></div>'+
      '<div class="rounded-xl bg-slate-50 border border-slate-200 p-3"><div class="text-[10px] uppercase font-bold text-slate-600">Thermal status</div><div class="text-sm font-extrabold mt-2">'+esc(status)+'</div><div class="text-[10px] text-slate-500 mt-2">Safe range: '+(lim.min===null||lim.max===null?"Unavailable":lim.min+"°C to "+lim.max+"°C")+'</div><div class="text-[10px] text-slate-500 mt-1">Liquid thermal lag: Unavailable — no validated model configured</div></div></div>'+
      '<div class="relative h-64 sm:h-80"><canvas id="dual-thermal-chart" aria-label="Air and vial temperature history chart"></canvas></div>'+
      '<div class="text-xs text-slate-600"><strong>Event summary:</strong> '+eventHtml+'</div>'+
      '<div class="text-[10px] text-slate-400">Hover a point for timestamp, temperature, source, and measured/simulated/estimated status. Missing samples remain gaps. TTB trend fit is shown only for a fresh, sufficiently long, measured series; it is not a validated vaccine thermal model.</div>';
    var canvas=$("dual-thermal-chart");
    if(window.Chart && canvas) {
      if(chart){chart.destroy();chart=null;}
      try { chart=new Chart(canvas.getContext("2d"),chartConfig(s,data,lim)); } catch(e){console.warn("Dual thermal chart failed:",e); }
    } else {
      var msg=document.createElement("p");msg.className="text-xs text-amber-700";msg.textContent="Chart.js is unavailable; thermal data summary remains visible.";card.appendChild(msg);
    }
    var select=$("dual-thermal-window"); if(select) select.onchange=function(){var v=Number(select.value);if(WINDOWS.indexOf(v)>=0){windowMinutes=v;render();}};
    var prev=lastThermalStatus[String(s.id)]; lastThermalStatus[String(s.id)]=status;
    // Do not create a second notification stream. Existing alerts remain authoritative; this is display-only.
  }
  function boot() {
    app=window.coldGuardApp || window.app || null;
    if(!app){window.setTimeout(boot,100);return;}
    if(app.dbService && typeof app.dbService.on==="function") app.dbService.on("shipments",function(records){
      if(!Array.isArray(records))return;
      records.forEach(function(rec){var id=String(rec.id||rec.shipmentId||"");if(id)remoteById[id]=rec;});
      render();
    });
    if(typeof app.renderCurrentView==="function"){var original=app.renderCurrentView.bind(app);app.renderCurrentView=function(){original();render();};}
    if(typeof app.updateDetailsTelemetry==="function"){var update=app.updateDetailsTelemetry.bind(app);app.updateDetailsTelemetry=function(){update();render();};}
    document.addEventListener("change",function(e){if(e.target&&e.target.id==="dual-thermal-window"){var v=Number(e.target.value);if(WINDOWS.indexOf(v)>=0){windowMinutes=v;render();}}});
    render(); window.setInterval(render,15000);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){window.setTimeout(boot,0);}); else boot();
  window.ColdGuardDualThermal = { collect:collect, fit:fit, ttb:ttb, thermalStatus:thermalStatus };
})();