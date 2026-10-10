/* ColdGuard Innovation Suite — demo-safe thermal twin, rescue dispatch, VVM proxy, passport and judging presets. */
(function () {
  "use strict";
  var app = null, chart = null, rescueMap = null, rescueLine = null, rescueMarker = null;
  var state = { air: 4.2, vial: 4.2, scenario: "normal", points: [], lastTick: Date.now(), lastRescue: false, exposureDegreeHours: 0, mkt: 4.2, tripStart: Date.now(), frozen: false, scenarioLabel: "Normal Transit (4.2°C)", forceDemo: false };
  var $ = function (id) { return document.getElementById(id); };
  var DEMO_HUBS = [
    { id: "PHC-02", name: "Sub-District Hospital / Depot #2", lat: 18.7800, lng: 73.4740, type: "PHC / Cold-chain depot" },
    { id: "HUB-PUNE", name: "Pune Vaccine Cold-Chain Hub", lat: 18.5204, lng: 73.8567, type: "Regional cold-storage hub" },
    { id: "PHC-LON", name: "Lonavala Primary Health Centre", lat: 18.7300, lng: 73.4450, type: "Primary Health Centre" }
  ];
  var TRUCK = { lat: 18.7546, lng: 73.4062 };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]; }); }
  function n(v) { var x = Number(v); return Number.isFinite(x) ? x : null; }
  function shipment() {
    if (!app || !app.simulation || !Array.isArray(app.simulation.shipments)) return null;
    return app.simulation.shipments.find(function (s) { return String(s.id) === String(app.selectedShipmentId); }) || app.simulation.shipments[0] || null;
  }
  function fmt(v) { return v == null || !Number.isFinite(v) ? "—" : Number(v).toFixed(1) + "°C"; }
  function thermalSlope() {
    var p = state.points.slice(-20);
    if (p.length < 3) return 0;
    var x0 = p[0].t, sx = 0, sy = 0, sxx = 0, sxy = 0, count = p.length;
    p.forEach(function (q) { var x = (q.t - x0) / 60000; sx += x; sy += q.v; sxx += x*x; sxy += x*q.v; });
    var den = count*sxx - sx*sx;
    return Math.abs(den) < 0.000001 ? 0 : (count*sxy - sx*sy)/den;
  }
  function timeToBreach() {
    var slope = thermalSlope();
    if (state.vial < 0) return { text: "FREEZE BREACH", kind: "critical" };
    if (state.vial > 8) return { text: "HEAT BREACH", kind: "critical" };
    if (state.vial >= 7.8 && slope > 0) return { text: "Imminent", kind: "critical" };
    if (slope > 0.005) {
      var mins = (8-state.vial)/slope;
      if (mins > 0 && mins < 240) return { text: "~" + Math.max(1, Math.round(mins)) + " mins", kind: mins < 15 ? "critical" : "warning" };
    }
    if (slope < -0.005) {
      var coldMins = (0-state.vial)/slope;
      if (coldMins > 0 && coldMins < 240) return { text: "~" + Math.max(1, Math.round(coldMins)) + " mins to freeze", kind: coldMins < 15 ? "critical" : "warning" };
    }
    return { text: "Safe / Equilibrium", kind: "safe" };
  }
  function mktC(samples) {
    if (!samples.length) return state.vial;
    var eaOverR = 83144 / 8.314;
    var avg = samples.reduce(function (sum, x) { return sum + Math.exp(-eaOverR / (x + 273.15)); }, 0) / samples.length;
    var kelvin = -eaOverR / Math.log(avg);
    return Number.isFinite(kelvin) ? kelvin - 273.15 : state.vial;
  }
  function syncLiveTelemetry() {
    if(state.forceDemo || !app || !window.ColdGuardDualThermal || typeof window.ColdGuardDualThermal.collect!=="function") return false;
    var s=shipment(); if(!s) return false;
    var d; try { d=window.ColdGuardDualThermal.collect(s); } catch(e) { return false; }
    if(!d || !d.live || !d.airMapped || !d.vialMapped) return false;
    var a=d.air && d.air.length ? d.air[d.air.length-1] : null, v=d.vial && d.vial.length ? d.vial[d.vial.length-1] : null;
    if(!a || !v || !Number.isFinite(a.y) || !Number.isFinite(v.y)) return false;
    if(Date.now()-a.x>300000 || Date.now()-v.x>300000) return false;
    state.air=a.y; state.vial=v.y; state.scenario="live"; state.scenarioLabel="Mapped live air + vial sensors"; state.frozen=state.vial<0;
    return true;
  }
  function updateThermal() {
    var now = Date.now(), dt = Math.max(0.01, Math.min(1, (now-state.lastTick)/60000));
    state.lastTick = now;
    if (state.scenario !== "live") {
      if (state.scenario !== "freeze") state.vial += (state.air-state.vial) * (1-Math.exp(-dt/15));
    }
    if (state.scenario === "normal") {
      state.air = 4.2 + Math.sin(now/25000)*0.12;
    }
    if (state.scenario === "freeze") { state.air = -1.5; state.vial = -1.5; state.frozen = true; }
    state.points.push({ t: now, a: state.air, v: state.vial });
    if (state.points.length > 120) state.points.shift();
    var temps = state.points.map(function (p) { return p.v; });
    state.mkt = mktC(temps);
    var outside = state.vial > 8 || state.vial < 0;
    if (outside) {
      var excursion = Math.max(0, state.vial-8, 0-state.vial);
      state.exposureDegreeHours += excursion * (dt/60);
    }
    state.lastRescue = outside;
  }
  function vvmStage() {
    if (state.vial < 0 || state.exposureDegreeHours >= 5) return 4;
    if (state.exposureDegreeHours >= 2) return 3;
    if (state.exposureDegreeHours >= 0.5) return 2;
    return 1;
  }
  function stageMeta(stage) {
    return {
      1: { label: "Stage 1 · 100% Viable (demo)", desc: "Inner square is lighter than the circle.", inner: "#ffffff", outer: "#64748b", tag: "Grade A: Long-Term Storage" },
      2: { label: "Stage 2 · Viable — prioritize FEFO", desc: "Exposure proxy is accumulating; prioritize earliest expiry first.", inner: "#9ca3af", outer: "#64748b", tag: "Grade B: Use within 72 hrs" },
      3: { label: "Stage 3 · Critical threshold (demo)", desc: "Do not release until an authorized cold-chain officer reviews the batch.", inner: "#64748b", outer: "#64748b", tag: "Grade C: Immediate Camp Drive" },
      4: { label: "Stage 4 · Denatured / discard review", desc: "Quarantine and follow local vaccine-wastage procedures.", inner: "#334155", outer: "#64748b", tag: "Grade D: Biohazard Discard" }
    }[stage];
  }
  function haversine(a,b) {
    var r = Math.PI/180, dLat=(b.lat-a.lat)*r, dLng=(b.lng-a.lng)*r;
    var z=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLng/2)**2;
    return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z));
  }
  function nearestHub() {
    return DEMO_HUBS.map(function(h){return Object.assign({},h,{distance:haversine(TRUCK,h)});}).sort(function(a,b){return a.distance-b.distance;})[0];
  }
  function addScenarioButtons() {
    var bar = document.querySelector(".coldguard-toolbar-simulation");
    if (!bar || $("cg-preset-group")) return;
    var group = document.createElement("div");
    group.id = "cg-preset-group";
    group.className = "cg-preset-group";
    group.setAttribute("role","group");
    group.setAttribute("aria-label","Instant thermal demo presets");
    group.innerHTML =
      '<button type="button" data-cg-scenario="normal" class="cg-preset cg-preset-safe">Normal Transit <b>4.2°C</b></button>' +
      '<button type="button" data-cg-scenario="spike" class="cg-preset cg-preset-warn">Door-Ajar Spike <b>Air 12°C</b></button>' +
      '<button type="button" data-cg-scenario="failure" class="cg-preset cg-preset-danger">Refrigeration Failure <b>Predict + Rescue</b></button>' +
      '<button type="button" data-cg-scenario="freeze" class="cg-preset cg-preset-cold">Over-Icing Breach <b>−1.5°C</b></button>';
    bar.appendChild(group);
    group.addEventListener("click",function(e){var b=e.target.closest("[data-cg-scenario]");if(b) setScenario(b.getAttribute("data-cg-scenario"));});
  }
  function addPassportControls() {
    var utilities = document.querySelector(".coldguard-toolbar-utilities");
    if (utilities && !$("cg-passport-header")) {
      var b=document.createElement("button"); b.id="cg-passport-header"; b.type="button"; b.className="cg-passport-btn";
      b.textContent="▦ Generate Batch Passport"; b.addEventListener("click",openPassport); utilities.insertBefore(b,utilities.firstChild);
    }
    var nav=document.querySelector("aside nav");
    if(nav && !$("cg-passport-nav")) {
      var b2=document.createElement("button"); b2.id="cg-passport-nav"; b2.type="button"; b2.className="nav-link w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition";
      b2.innerHTML='<span aria-hidden="true">▦</span><span>Batch Passport</span>'; b2.addEventListener("click",openPassport); nav.appendChild(b2);
    }
  }
  function ensureStyle() {
    if($("cg-innovation-css")) return;
    var s=document.createElement("style"); s.id="cg-innovation-css";
    s.textContent = [
      ".coldguard-toolbar-simulation{flex-wrap:wrap}",
      ".cg-preset-group{display:flex;gap:6px;flex-wrap:wrap;align-items:center;flex:1 1 100%;padding-top:4px}",
      ".cg-preset{border:1px solid #dbe3ef;border-radius:9px;padding:7px 9px;background:#fff;color:#334155;font-size:10px;font-weight:800;line-height:1.25;text-align:left;box-shadow:0 1px 2px #0f172a08}",
      ".cg-preset b{display:block;font-size:9px;font-weight:600;color:#64748b;margin-top:3px}",
      ".cg-preset:hover{transform:translateY(-1px);box-shadow:0 4px 10px #0f172a12}",
      ".cg-preset-safe{border-color:#a7f3d0}.cg-preset-warn{border-color:#fcd34d}.cg-preset-danger{border-color:#fca5a5}.cg-preset-cold{border-color:#7dd3fc}",
      ".cg-passport-btn{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:10px;padding:9px 10px;font-size:10px;font-weight:800;white-space:nowrap}",
      ".cg-innovation{margin:0 0 24px;display:grid;gap:16px;color:#0f172a}",
      ".cg-innovation .cg-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px;box-shadow:0 4px 14px #0f172a06;min-width:0}",
      ".cg-innovation .cg-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}",
      ".cg-innovation .cg-kpi-label{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#64748b}",
      ".cg-innovation .cg-kpi-value{font-size:23px;font-weight:800;letter-spacing:-.04em;margin-top:8px;font-family:'JetBrains Mono',monospace}",
      ".cg-innovation .cg-muted{font-size:11px;color:#64748b;line-height:1.55}",
      ".cg-innovation .cg-two{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(270px,1fr);gap:16px}",
      ".cg-innovation .cg-section-title{font-size:14px;font-weight:800;color:#0f172a}",
      ".cg-innovation .cg-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:800}",
      ".cg-innovation .cg-chart-wrap{height:280px;margin-top:14px;position:relative}",
      ".cg-innovation .cg-rescue{border:1px solid #fecaca;background:#fff7ed;border-radius:14px;padding:12px;margin-bottom:12px;animation:cgPulse 1.6s infinite}",
      ".cg-innovation .cg-rescue h4{font-size:12px;font-weight:900;color:#b91c1c}",
      ".cg-innovation .cg-rescue-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}",
      ".cg-innovation #cg-rescue-map{height:190px;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden}",
      ".cg-innovation .cg-vvm-circle{width:92px;height:92px;border-radius:50%;background:#64748b;display:grid;place-items:center;flex-shrink:0;box-shadow:inset 0 2px 8px #0002}",
      ".cg-innovation .cg-vvm-square{width:42px;height:42px;border:2px solid #475569;box-shadow:0 1px 3px #0002}",
      ".cg-innovation .cg-vvm-row{display:flex;align-items:center;gap:16px;margin-top:12px}",
      ".cg-innovation .cg-action-tag{border-radius:10px;padding:10px 12px;font-size:11px;font-weight:900;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}",
      ".cg-modal-backdrop{position:fixed;inset:0;z-index:1000;background:#0f172a88;display:flex;align-items:center;justify-content:center;padding:18px}",
      ".cg-modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 24px 70px #0003}",
      ".cg-modal-grid{display:grid;grid-template-columns:190px minmax(0,1fr);gap:20px;align-items:start}",
      ".cg-qr-box{padding:12px;border:1px solid #e2e8f0;border-radius:14px;display:flex;justify-content:center;align-items:center;min-height:190px}",
      ".cg-modal-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}",
      ".cg-modal-actions button{padding:9px 13px;border-radius:10px;font-size:11px;font-weight:800;border:1px solid #cbd5e1}",
      ".cg-primary{background:#2563eb!important;color:#fff!important;border-color:#2563eb!important}",
      "@keyframes cgPulse{0%,100%{box-shadow:0 0 0 0 #ef444422}50%{box-shadow:0 0 0 5px #ef444411}}",
      "@media(max-width:1000px){.cg-innovation .cg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cg-innovation .cg-two{grid-template-columns:1fr}.cg-preset-group{flex-basis:100%}}",
      "@media(max-width:600px){.cg-innovation .cg-grid{grid-template-columns:1fr 1fr}.cg-innovation .cg-rescue-grid{grid-template-columns:1fr}.cg-modal-grid{grid-template-columns:1fr}.cg-innovation .cg-chart-wrap{height:230px}.cg-preset{flex:1 1 45%}.cg-passport-btn{font-size:9px;padding:8px}}",
      "@media print{body *{visibility:hidden!important}#cg-passport-modal,#cg-passport-modal *{visibility:visible!important}#cg-passport-modal{position:absolute;inset:0;background:#fff!important;padding:0!important}.cg-modal-actions,#cg-passport-close{display:none!important}}"
    ].join("\n");
    document.head.appendChild(s);
  }
  function setScenario(which) {
    state.scenario = which; state.forceDemo=true; state.points=[]; state.lastTick=Date.now(); state.tripStart=Date.now(); state.exposureDegreeHours=0; state.frozen=false;
    if(which==="normal"){state.air=4.2;state.vial=4.2;state.scenarioLabel="Normal Transit (4.2°C)";}
    if(which==="spike"){state.air=12;state.vial=4.2;state.scenarioLabel="Door-Ajar Spike — air only";}
    if(which==="failure"){state.air=12.5;state.vial=4.2;state.scenarioLabel="Refrigeration Failure";}
    if(which==="freeze"){state.air=-1.5;state.vial=-1.5;state.frozen=true;state.scenarioLabel="Over-Icing Breach";}
    for(var i=30;i>=1;i--){state.points.push({t:Date.now()-i*3000,a:which==="normal"?4.2:which==="spike"?12:which==="failure"?Math.max(4.2,4.2+(12.5-4.2)*(1-i/30)): -1.5,v:which==="freeze"?-1.5:which==="normal"?4.2:4.2+(Math.max(4.2,which==="spike"?12:12.5)-4.2)*(1-Math.exp(-(30-i)*0.05/15))});}
    state.lastRescue=state.vial<0||state.vial>8;
    if(app && app.modals && app.modals.showToast) app.modals.showToast("Simulation preset: "+state.scenarioLabel+" (demo data)", which==="freeze"||which==="failure"?"critical":"info");
    render();
  }
  function chartConfig() {
    var pts=state.points.slice(-30), labels=pts.map(function(p){return new Date(p.t).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});});
    var last=pts[pts.length-1], slope=thermalSlope(), forecastAir=[], forecastVial=[];
    for(var i=1;i<=5;i++){labels.push("+"+(i*4)+"m");forecastAir.push(last?last.a+slope*i*4:null);forecastVial.push(last?last.v+slope*i*4:null);}
    var air=pts.map(function(p){return p.a;}), vial=pts.map(function(p){return p.v;});
    var proj=new Array(pts.length).fill(null); if(last){proj[proj.length-1]=last.a;forecastAir.forEach(function(v){proj.push(v);});}else{proj=proj.concat(forecastAir);}
    var projV=new Array(pts.length).fill(null); if(last){projV[projV.length-1]=last.v;forecastVial.forEach(function(v){projV.push(v);});}else{projV=projV.concat(forecastVial);}
    return {type:"line",data:{labels:labels,datasets:[
      {label:"Ambient air · °C",data:air.concat([null,null,null,null,null]),borderColor:"#2563eb",backgroundColor:"#2563eb",borderWidth:2.5,pointRadius:0,tension:.22,spanGaps:false},
      {label:"Vial core · °C (τ=15 min)",data:vial.concat([null,null,null,null,null]),borderColor:"#7c3aed",backgroundColor:"#7c3aed",borderWidth:2.5,pointRadius:0,tension:.3,spanGaps:false},
      {label:"Air projection · 20 min",data:proj,borderColor:"#dc2626",borderDash:[7,5],borderWidth:2,pointRadius:0,tension:0,spanGaps:false},
      {label:"Vial projection · 20 min",data:projV,borderColor:"#7c3aed",borderDash:[4,5],borderWidth:1.5,pointRadius:0,tension:0,spanGaps:false}
    ]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"bottom",labels:{boxWidth:16,font:{size:10}}},tooltip:{callbacks:{label:function(ctx){return ctx.dataset.label+": "+(ctx.parsed.y==null?"—":ctx.parsed.y.toFixed(2)+"°C");}}}},scales:{y:{title:{display:true,text:"Temperature (°C)"},suggestedMin:-3,suggestedMax:14,grid:{color:"#f1f5f9"}},x:{ticks:{maxTicksLimit:8,maxRotation:0},grid:{display:false}}},plugins:[{id:"cgThermalLimits",afterDraw:function(c){var y=c.scales.y,x=c.chartArea;if(!y||!x)return;[{v:8,color:"#dc2626",label:"Heat limit 8°C"},{v:0,color:"#0891b2",label:"Freeze limit 0°C"}].forEach(function(m){var py=y.getPixelForValue(m.v);var ctx=c.ctx;ctx.save();ctx.strokeStyle=m.color;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(x.left,py);ctx.lineTo(x.right,py);ctx.stroke();ctx.fillStyle=m.color;ctx.font="10px sans-serif";ctx.fillText(m.label,x.left+6,py-4);ctx.restore();});}}]}};
  }
  function rescueHtml() {
    var breach=state.vial<0||state.vial>8;
    if(!breach) return '<div class="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">No vial-core breach detected. Rescue dispatch remains on standby; an air-only spike does not automatically condemn the vial.</div>';
    var hub=nearestHub(), eta=Math.max(3,Math.round(hub.distance/33*60)), freeze=state.vial<0;
    var protocol=freeze?"Quarantine batch; freeze-integrity review and do not use pending authorized assessment.":"Re-ice packaging, preserve telemetry, and divert to the nearest validated cold-chain facility.";
    return '<div class="cg-rescue"><div class="flex items-center justify-between gap-3"><h4>🚨 ACTIVE RESCUE DISPATCH · SIMULATED</h4><span class="cg-badge" style="background:#fee2e2;color:#991b1b">'+(freeze?"FREEZE BREACH":"HEAT BREACH")+'</span></div><div class="cg-muted" style="margin-top:5px;color:#9a3412">Core vial temperature '+fmt(state.vial)+' is outside the 0–8°C demo limits. Confirm with calibrated hardware before clinical action.</div><div class="cg-rescue-grid"><div><div class="cg-kpi-label">Target facility</div><b style="font-size:11px">'+esc(hub.name)+'</b></div><div><div class="cg-kpi-label">Distance · ETA</div><b style="font-size:11px">'+hub.distance.toFixed(1)+' km · '+eta+' min</b></div><div><div class="cg-kpi-label">Protocol</div><b style="font-size:11px">'+esc(protocol)+'</b></div></div></div>';
  }
  function drawRescueMap() {
    var el=$("cg-rescue-map"); if(!el||!window.L) return;
    if(rescueMap && rescueMap.getContainer && rescueMap.getContainer()!==el){rescueMap.remove();rescueMap=null;rescueLine=null;rescueMarker=null;}
    var breach=state.vial<0||state.vial>8, hub=nearestHub();
    if(!rescueMap){rescueMap=L.map(el,{zoomControl:false,scrollWheelZoom:false}).setView([TRUCK.lat,TRUCK.lng],10);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(rescueMap);L.marker([TRUCK.lat,TRUCK.lng]).addTo(rescueMap).bindPopup("Simulated shipment position");}
    if(rescueLine){rescueMap.removeLayer(rescueLine);rescueLine=null;} if(rescueMarker){rescueMap.removeLayer(rescueMarker);rescueMarker=null;}
    if(breach){rescueLine=L.polyline([[TRUCK.lat,TRUCK.lng],[hub.lat,hub.lng]],{color:state.vial<0?"#dc2626":"#f59e0b",weight:5,dashArray:"8 7"}).addTo(rescueMap);rescueMarker=L.marker([hub.lat,hub.lng]).addTo(rescueMap).bindPopup(esc(hub.name));rescueMap.fitBounds([[TRUCK.lat,TRUCK.lng],[hub.lat,hub.lng]],{padding:[18,18]});}
    else rescueMap.setView([TRUCK.lat,TRUCK.lng],10);
    window.setTimeout(function(){if(rescueMap)rescueMap.invalidateSize();},80);
  }
  function renderPanel() {
    var main=$("main-content-view");
    if(!main || !app || (app.currentView!=="dashboard" && app.currentView!=="details")) { if(chart){chart.destroy();chart=null;} return; }
    var host=$("cg-innovation-suite");
    if(!host){host=document.createElement("section");host.id="cg-innovation-suite";host.className="cg-innovation";main.insertBefore(host,main.firstChild);}
    var s=shipment(), slope=thermalSlope(), ttb=timeToBreach(), stage=vvmStage(), vm=stageMeta(stage), breach=state.vial<0||state.vial>8;
    var airStatus=state.air<0||state.air>8?"Excursion":"In range";
    var liveTag=state.scenario==="live"?"VERIFIED TYPED CHANNELS":"SIMULATED DEMO";
    var freezePass=state.vial>=0 && state.vial<=8 && !state.frozen;
    host.innerHTML=
      '<div class="flex flex-col md:flex-row md:items-center justify-between gap-3"><div><div class="text-[10px] font-extrabold tracking-[.16em] uppercase text-blue-600">ColdGuard innovation suite</div><h2 class="text-xl font-extrabold tracking-tight mt-1">Predict · Protect · Prove</h2><p class="cg-muted mt-1">Selected shipment: '+esc(s?s.id:"Demo batch")+' · '+esc(state.scenarioLabel)+' · '+liveTag+'</p></div><div class="flex items-center gap-2 flex-wrap"><span class="cg-badge" style="background:'+(breach?'#fee2e2':'#dcfce7')+';color:'+(breach?'#991b1b':'#166534')+'">'+(breach?'EXCURSION / RESCUE':'THERMAL GUARD ACTIVE')+'</span><button type="button" id="cg-open-passport-inline" class="cg-passport-btn">Generate Batch Passport</button></div></div>'+
      '<div class="cg-grid">'+
        '<div class="cg-card"><div class="cg-kpi-label">Ambient air</div><div class="cg-kpi-value" style="color:'+(state.air<0||state.air>8?'#dc2626':'#2563eb')+'">'+fmt(state.air)+'</div><div class="cg-muted">Air: '+airStatus+' · fast response</div></div>'+
        '<div class="cg-card"><div class="cg-kpi-label">Vial liquid core</div><div class="cg-kpi-value" style="color:'+(breach?'#dc2626':'#7c3aed')+'">'+fmt(state.vial)+'</div><div class="cg-muted">'+(state.scenario==="spike"&&state.vial<=8?"Safe — liquid buffer active":"Lumped lag model · τ = 15 min")+'</div></div>'+
        '<div class="cg-card"><div class="cg-kpi-label">Thermal slope · dT/dt</div><div class="cg-kpi-value">'+(slope>=0?"+":"")+slope.toFixed(3)+'</div><div class="cg-muted">°C/min · recent demo trend</div></div>'+
        '<div class="cg-card"><div class="cg-kpi-label">Time-to-breach</div><div class="cg-kpi-value" style="font-size:20px;color:'+(ttb.kind==="critical"?"#dc2626":ttb.kind==="warning"?"#b45309":"#059669")+'">'+esc(ttb.text)+'</div><div class="cg-muted">20-minute linear projection · not a clinical guarantee</div></div>'+
      '</div>'+
      '<div class="cg-two"><div class="cg-card"><div class="flex items-center justify-between gap-3"><div><div class="cg-section-title">Dynamic Dual Thermal Inertia Curve</div><p class="cg-muted mt-1">Air spikes react immediately; vial core follows τ = 15 min. Dashed curves forecast 20 minutes.</p></div><span class="cg-badge" style="background:#eff6ff;color:#1d4ed8">Chart.js · live demo</span></div><div class="flex flex-wrap gap-3 mt-3 text-xs"><span style="color:#2563eb;font-weight:800">━ Air: '+fmt(state.air)+' ('+airStatus+')</span><span style="color:#7c3aed;font-weight:800">━ Vial core: '+fmt(state.vial)+' ('+(breach?'Breach':'Safe')+')</span></div><div class="cg-chart-wrap"><canvas id="cg-dual-chart" aria-label="Ambient air and vial core temperature curves"></canvas></div><p class="cg-muted mt-2">Thresholds: upper heat limit 8°C · lower freeze limit 0°C. Simulated presets are not sensor measurements.</p></div>'+
      '<div class="cg-card"><div class="cg-section-title">Digital VVM Twin</div><p class="cg-muted mt-1">Visual exposure-stage proxy for demonstration; not an official or calibrated WHO VVM.</p><div class="cg-vvm-row"><div class="cg-vvm-circle" style="background:'+vm.outer+'"><div class="cg-vvm-square" style="background:'+vm.inner+'"></div></div><div><div class="cg-section-title">'+esc(vm.label)+'</div><div class="cg-muted mt-1">'+esc(vm.desc)+'</div><div class="cg-muted mt-2">MKT estimate: <b>'+fmt(state.mkt)+'</b></div><div class="cg-muted">Cumulative out-of-range exposure: <b>'+state.exposureDegreeHours.toFixed(3)+' °C·h</b></div></div></div><div class="mt-4"><div class="cg-kpi-label">Tiered clinical action tag</div><div class="cg-action-tag mt-2">'+esc(vm.tag)+'</div></div><p class="cg-muted mt-3">Final disposition must follow vaccine-specific guidance and an authorized cold-chain officer.</p></div></div>'+
      '<div class="cg-two"><div class="cg-card"><div class="cg-section-title">Automated Rescue Dispatch & Reroute</div><p class="cg-muted mt-1">Configured demo checkpoints · straight-line estimate only; road routing requires a routing service.</p><div id="cg-rescue-banner" class="mt-3">'+rescueHtml()+'</div><div id="cg-rescue-map"></div><p class="cg-muted mt-2">Map pins and reroute polyline are simulated. Verify facility capability and road ETA before dispatch.</p></div>'+
      '<div class="cg-card"><div class="cg-section-title">Zero-Unpack Batch Passport</div><p class="cg-muted mt-1">Create a QR-linked batch record for receiving-clinic chain-of-custody review without opening the container.</p><div class="grid grid-cols-2 gap-3 mt-4"><div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><div class="cg-kpi-label">Batch ID</div><div class="font-mono font-extrabold text-sm mt-2">'+esc(s?s.id:"CG-DEMO-BATCH-001")+'</div></div><div class="rounded-xl bg-slate-50 border border-slate-100 p-3"><div class="cg-kpi-label">Freeze integrity</div><div class="font-extrabold text-sm mt-2" style="color:'+(freezePass?'#059669':'#dc2626')+'">'+(freezePass?"PASS · demo only":"FAIL · demo alert")+'</div></div></div><button type="button" id="cg-open-passport-card" class="cg-passport-btn mt-4">▦ Generate QR Passport & Print</button><p class="cg-muted mt-3">Passport hash is a demo-generated digest, not a hardware signature or tamper-proof attestation.</p></div></div>';
    var btn1=$("cg-open-passport-inline"), btn2=$("cg-open-passport-card");
    if(btn1)btn1.onclick=openPassport;if(btn2)btn2.onclick=openPassport;
    var canvas=$("cg-dual-chart");
    if(window.Chart && canvas){if(chart){chart.destroy();chart=null;}try{chart=new Chart(canvas.getContext("2d"),chartConfig());}catch(e){console.warn("ColdGuard innovation chart failed",e);}}
    drawRescueMap();
  }
  function hashText(text) {
    if(window.crypto && window.crypto.subtle && window.TextEncoder) return window.crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)).then(function(buf){return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,"0");}).join("");});
    var out="", seed=2166136261; for(var i=0;i<text.length;i++){seed^=text.charCodeAt(i);seed=Math.imul(seed,16777619);} for(var j=0;j<8;j++){seed=(Math.imul(seed^j,2246822519)+3266489917)>>>0;out+=seed.toString(16).padStart(8,"0");} return Promise.resolve(out);
  }
  function passportData() {
    var s=shipment(), stage=vvmStage(), vm=stageMeta(stage), freezePass=state.vial>=0&&state.vial<=8&&!state.frozen;
    return {batchId:s?s.id:"CG-DEMO-BATCH-001",tripDurationMinutes:Math.max(0,Math.round((Date.now()-state.tripStart)/60000)),finalMKT_C:Number(state.mkt.toFixed(2)),freezeIntegrity:freezePass?"PASS (demo proxy)":"FAIL (demo alert)",airTemp_C:Number(state.air.toFixed(2)),vialCoreTemp_C:Number(state.vial.toFixed(2)),exposureDegreeHours:Number(state.exposureDegreeHours.toFixed(4)),clinicalActionTag:vm.tag,scenario:state.scenarioLabel,generatedAt:new Date().toISOString(),recordType:"SIMULATED DEMONSTRATION — NOT A SIGNED CLINICAL RECORD"};
  }
  function openPassport() {
    ensureStyle();
    var old=$("cg-passport-modal");if(old)old.remove();
    var data=passportData(), modal=document.createElement("div");modal.id="cg-passport-modal";modal.className="cg-modal-backdrop";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","Batch passport");
    modal.innerHTML='<div class="cg-modal"><div class="flex items-start justify-between gap-4"><div><div class="text-[10px] font-extrabold uppercase tracking-[.15em] text-blue-600">ColdGuard · Chain of custody</div><h2 class="text-xl font-extrabold mt-1">Zero-Unpack Batch Passport</h2><p class="cg-muted mt-1">QR payload, simulated digest, and receiving-clinic action summary.</p></div><button type="button" id="cg-passport-close" class="border rounded-lg px-3 py-2 text-xs font-bold">✕ Close</button></div><div class="cg-modal-grid mt-5"><div><div id="cg-passport-qr" class="cg-qr-box"></div><div class="cg-muted mt-2 text-center">Scan for batch record payload</div></div><div><div class="grid grid-cols-2 gap-3"><div><div class="cg-kpi-label">Batch ID</div><b id="cg-passport-batch" class="font-mono text-sm">'+esc(data.batchId)+'</b></div><div><div class="cg-kpi-label">Trip duration</div><b class="text-sm">'+data.tripDurationMinutes+' min</b></div><div><div class="cg-kpi-label">Final MKT estimate</div><b class="text-sm">'+data.finalMKT_C+'°C</b></div><div><div class="cg-kpi-label">Freeze integrity</div><b class="text-sm" style="color:'+(data.freezeIntegrity.indexOf("PASS")===0?"#059669":"#dc2626")+'">'+esc(data.freezeIntegrity)+'</b></div></div><div class="cg-action-tag mt-4">'+esc(data.clinicalActionTag)+'</div><div class="cg-kpi-label mt-4">SHA-256 digest · demo payload</div><code id="cg-passport-hash" class="block break-all text-[10px] bg-slate-50 rounded-lg p-3 mt-2">Generating…</code><p class="cg-muted mt-2">A QR code and digest do not independently prove sensor authenticity or prevent physical tampering. This demo record is not a clinical release decision.</p></div></div><div class="cg-modal-actions"><button type="button" id="cg-passport-download" class="cg-primary">Download / Print Passport</button><button type="button" id="cg-passport-json">Download JSON</button><button type="button" id="cg-passport-copy">Copy Record</button></div></div>';
    document.body.appendChild(modal);
    $("cg-passport-close").onclick=function(){modal.remove();};
    modal.addEventListener("click",function(e){if(e.target===modal)modal.remove();});
    var payload=JSON.stringify(data);
    if(window.QRCode){try{new QRCode($("cg-passport-qr"),{text:payload,width:165,height:165,colorDark:"#0f172a",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M});}catch(e){$("cg-passport-qr").textContent="QR generation unavailable";}}
    else $("cg-passport-qr").textContent="QR library unavailable — use Download JSON";
    hashText(payload).then(function(hash){var h=$("cg-passport-hash");if(h)h.textContent=hash;});
    $("cg-passport-download").onclick=function(){
      if(window.jspdf&&window.jspdf.jsPDF){var pdf=new window.jspdf.jsPDF();pdf.setFontSize(18);pdf.text("ColdGuard Batch Passport",14,18);pdf.setFontSize(10);var lines=["DEMO RECORD — NOT A SIGNED CLINICAL RECORD","Batch ID: "+data.batchId,"Trip duration: "+data.tripDurationMinutes+" min","Final MKT estimate: "+data.finalMKT_C+" C","Freeze integrity: "+data.freezeIntegrity,"Air temperature: "+data.airTemp_C+" C","Vial core temperature: "+data.vialCoreTemp_C+" C","Exposure proxy: "+data.exposureDegreeHours+" C-hours","Clinical action: "+data.clinicalActionTag,"Scenario: "+data.scenario,"Generated at: "+data.generatedAt,"Digest: "+($("cg-passport-hash")?$("cg-passport-hash").textContent:"pending")];pdf.text(lines,14,32,{maxWidth:180});var qr=$("cg-passport-qr");var img=qr&&qr.querySelector("canvas");if(img)pdf.addImage(img.toDataURL("image/png"),"PNG",145,18,45,45);pdf.save("ColdGuard-Batch-Passport.pdf");}
      else window.print();
    };
    $("cg-passport-json").onclick=function(){downloadBlob("ColdGuard-Batch-Passport.json",JSON.stringify(Object.assign({},data,{sha256Demo:$("cg-passport-hash")?$("cg-passport-hash").textContent:"pending"}),null,2),"application/json");};
    $("cg-passport-copy").onclick=function(){copyText(JSON.stringify(Object.assign({},data,{sha256Demo:$("cg-passport-hash")?$("cg-passport-hash").textContent:"pending"}),null,2));};
  }
  function downloadBlob(name,content,type){var blob=new Blob([content],{type:type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).catch(function(){fallbackCopy(text);});else fallbackCopy(text);}
  function fallbackCopy(text){var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(e){}ta.remove();}
  function boot() {
    app=window.coldGuardApp||window.app||null;
    if(!app){window.setTimeout(boot,100);return;}
    ensureStyle();addScenarioButtons();addPassportControls();
    if(typeof app.renderCurrentView==="function"){
      var original=app.renderCurrentView.bind(app);
      app.renderCurrentView=function(){original();addScenarioButtons();addPassportControls();renderPanel();};
    }
    if(typeof app.onSimulationTick==="function"){
      var tick=app.onSimulationTick.bind(app);
      app.onSimulationTick=function(){tick.apply(null,arguments);renderPanel();};
    }
    document.addEventListener("visibilitychange",function(){if(!document.hidden)renderPanel();});
    window.setInterval(function(){if(!document.hidden){syncLiveTelemetry();updateThermal();renderPanel();}},3000);
    window.ColdGuardInnovationSuite={setScenario:setScenario,passportData:passportData,timeToBreach:timeToBreach};
    renderPanel();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){window.setTimeout(boot,0);});else boot();
})();