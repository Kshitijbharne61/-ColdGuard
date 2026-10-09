/* ColdGuard live sensor + weather-aware route panel.
 * This module only uses sensor records received from the existing Firebase RTDB listener.
 * It never treats local simulation values as live telemetry.
 */
(() => {
  "use strict";
  const STALE_AFTER_MS = 120000;
  const WEATHER_REFRESH_MS = 15 * 60 * 1000;
  const ROUTE_REFRESH_MS = 10 * 60 * 1000;
  const state = { app: null, records: [], connected: false, map: null, layers: [], lastWeatherAt: 0, lastWeatherData: null, lastRouteAt: 0, lastOrigin: null, lastRouteKey: "", lastRoutes: [], selectedSensorId: "", selectedDestinationId: "", recommendedId: null, busy: false, observer: null };

  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const num = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const coordsOf = record => {
    const live = record?.telemetry?.live || {};
    const loc = record?.location || {};
    const lat = loc.hasFix === false ? null : num(loc.latitude ?? record.gpsLatitude ?? live.latitude ?? record.telemetryLatitude);
    const lon = loc.hasFix === false ? null : num(loc.longitude ?? record.gpsLongitude ?? live.longitude ?? record.telemetryLongitude);
    return lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 ? { lat, lon } : null;
  };
  const timestampOf = record => {
    const raw = record?.telemetry?.live?.timestamp ?? record?.lastSensorUpdate ?? record?.location?.lastUpdated ?? record?.gpsLastUpdated ?? null;
    if (raw === null || raw === undefined || raw === "") return null;
    const t = typeof raw === "number" ? raw : Date.parse(raw);
    return Number.isFinite(t) ? (t < 1e12 ? t * 1000 : t) : null;
  };
  const tempOf = r => num(r?.telemetry?.live?.temperature ?? r?.currentTemperature ?? r?.temperature);
  const humidityOf = r => num(r?.telemetry?.live?.humidity ?? r?.currentHumidity ?? r?.humidity);
  const batteryOf = r => num(r?.telemetry?.live?.batteryLevel ?? r?.batteryLevel ?? r?.battery);
  const selectedRecord = () => {
    const id = String(state.selectedSensorId || state.app?.selectedShipmentId || "");
    return state.records.find(r => String(r.id || r.shipmentId) === id) || state.records.find(r => coordsOf(r)) || state.records[0] || null;
  };
  const fmtTime = t => t ? new Date(t).toLocaleString() : "Timestamp not supplied";
  const statusPill = (label, tone) => {
    const css = tone === "critical" ? "bg-red-100 text-red-800" : tone === "warning" ? "bg-amber-100 text-amber-800" : tone === "safe" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700";
    return '<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold '+css+'">'+esc(label)+'</span>';
  };

  function panelHtml() {
    const record = selectedRecord();
    const gps = coordsOf(record);
    const stamp = timestampOf(record);
    const stale = !stamp || Date.now() - stamp > STALE_AFTER_MS;
    const live = record?.telemetry?.live || {};
    const temp = tempOf(record), humidity = humidityOf(record), battery = batteryOf(record);
    const explicitOffline = record && (record.sensorConnectivity === "Offline" || record.connectivity === false || record.deviceStatus === "disconnected" || live.connected === false);
    const sensorTone = !state.connected || !record ? "warning" : explicitOffline || stale ? "critical" : "safe";
    const sensorLabel = !state.connected ? "Firebase offline" : !record ? "Waiting for Firebase sensor record" : explicitOffline ? "Sensor disconnected" : stale ? "Sensor data stale" : "Sensor data recent";
    const tempMin = num(record?.minAllowedTemperature ?? record?.storageMinTemp ?? record?.minTemp);
    const tempMax = num(record?.maxAllowedTemperature ?? record?.storageMaxTemp ?? record?.maxTemp);
    const tempOutside = temp !== null && tempMin !== null && tempMax !== null && (temp < tempMin || temp > tempMax);
    const alerts = [];
    if (!state.connected) alerts.push({ tone:"critical", text:"Firebase Realtime Database is disconnected. Live sensor status cannot be confirmed." });
    else if (!record) alerts.push({ tone:"warning", text:"No shipment sensor record has arrived from Firebase yet. Waiting for real device data." });
    if (record && !gps) alerts.push({ tone:"warning", text:"GPS coordinates are missing or the device reports no fix. Route recommendation is paused." });
    if (record && stale) alerts.push({ tone:"warning", text:"Sensor update is older than 2 minutes or has no timestamp. Check device connectivity and clock synchronization." });
    if (tempOutside) alerts.push({ tone:"critical", text:"Temperature is outside this shipment's configured storage limits ("+tempMin+"°C to "+tempMax+"°C)." });
    const checkpoints = (state.app?.checkpoints || []).filter(c => num(c.lat) !== null && num(c.lng) !== null && num(c.lat) >= -90 && num(c.lat) <= 90 && num(c.lng) >= -180 && num(c.lng) <= 180);
    const options = checkpoints.map((c,i) => '<option value="'+esc(c.id || i)+'" '+(String(c.id || i)===String(state.selectedDestinationId || checkpoints[0]?.id || 0)?"selected":"")+'>'+esc(c.name || c.city || ("Destination "+(i+1)))+'</option>').join("");
    const shipmentOptions = state.records.map(r => '<option value="'+esc(r.id || r.shipmentId)+'" '+(String(r.id || r.shipmentId)===String(record?.id || record?.shipmentId)?"selected":"")+'>'+esc((r.id || r.shipmentId)+" — "+(r.vaccineName || "Vaccine shipment"))+'</option>').join("");
    return `
      <section id="coldguard-live-route-panel" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div><div class="text-[11px] font-bold uppercase tracking-widest text-blue-600">Live operations</div><h2 class="text-lg font-extrabold text-slate-900 mt-1">Sensor & Weather-Aware Routing</h2><p class="text-xs text-slate-500 mt-1">Firebase RTDB + Open-Meteo forecast + OSRM road-route alternatives</p></div>
          <div class="flex flex-wrap gap-2 items-center">${statusPill(sensorLabel,sensorTone)}${statusPill(state.connected?"Firebase connected":"Firebase unavailable",state.connected?"safe":"critical")}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">GPS position</div><div class="font-mono text-sm font-bold mt-1">${gps ? gps.lat.toFixed(5)+", "+gps.lon.toFixed(5) : "No live fix"}</div><div class="text-[11px] text-slate-500 mt-1">${gps ? "Coordinates from Firebase record" : "Waiting for actual device coordinates"}</div></div>
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">Temperature</div><div class="text-xl font-extrabold mt-1">${temp===null?"—":esc(temp.toFixed(1)+"°C")}</div><div class="text-[11px] text-slate-500 mt-1">${tempMin!==null&&tempMax!==null?"Configured range "+tempMin+"° to "+tempMax+"°C":"Storage limits not configured in this Firebase record"}</div></div>
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">Humidity / Battery</div><div class="text-xl font-extrabold mt-1">${humidity===null?"—":esc(humidity.toFixed(0)+"%")} <span class="text-slate-300">/</span> ${battery===null?"—":esc(battery.toFixed(0)+"%")}</div><div class="text-[11px] text-slate-500 mt-1">Values shown only when supplied by the device</div></div>
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">Last sensor sync</div><div class="text-sm font-bold mt-1">${esc(fmtTime(stamp))}</div><div class="text-[11px] text-slate-500 mt-1">Stale threshold: 2 minutes</div></div>
        </div>
        <div class="px-4 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div class="lg:col-span-2 min-w-0"><div id="coldguard-weather-route-map" class="w-full h-80 rounded-xl border border-slate-200 bg-slate-50"></div><div class="text-[11px] text-slate-500 mt-2">Route guidance is advisory. Weather sampling does not certify roads as safe or flood-free.</div></div>
          <div class="space-y-3">
            <div class="border border-slate-200 rounded-xl p-4">
              <label for="coldguard-live-shipment" class="block text-xs font-bold text-slate-700 mb-1">Firebase shipment / sensor</label><select id="coldguard-live-shipment" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">${shipmentOptions || '<option value="">No Firebase shipment records yet</option>'}</select>
              <label for="coldguard-destination" class="block text-xs font-bold text-slate-700 mt-3 mb-1">Delivery destination</label><select id="coldguard-destination" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">${options || '<option value="">No destinations configured</option>'}</select>
              <button id="coldguard-recalculate" class="mt-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 disabled:opacity-50" ${!gps || stale || !state.connected ? "disabled" : ""}>Recalculate routes</button>
            </div>
            <div class="border border-slate-200 rounded-xl p-4"><div class="font-bold text-sm text-slate-900">Current weather</div><div id="coldguard-current-weather" class="text-sm text-slate-600 mt-2">Fetching genuine forecast when GPS is available…</div><div id="coldguard-weather-updated" class="text-[11px] text-slate-400 mt-2">Not refreshed yet</div></div>
            <div class="border border-slate-200 rounded-xl p-4"><div class="font-bold text-sm text-slate-900">Route comparison</div><div id="coldguard-route-results" class="text-sm text-slate-600 mt-2">Waiting for a recent live GPS fix and destination.</div></div>
          </div>
        </div>
        <div class="px-4 pb-4"><div class="font-bold text-sm text-slate-900 mb-2">Cold-chain / route alerts</div><div id="coldguard-live-alerts" class="space-y-2">${alerts.length ? alerts.map(a=>'<div class="rounded-lg p-3 text-sm '+(a.tone==="critical"?"bg-red-50 text-red-800":"bg-amber-50 text-amber-800")+'">'+esc(a.text)+'</div>').join("") : '<div class="rounded-lg p-3 text-sm bg-emerald-50 text-emerald-800">No current sensor-based alert detected. This does not certify road safety.</div>'}</div></div>
      </section>`;
  }

  function ensureMap() {
    const el = document.getElementById("coldguard-weather-route-map");
    if (!el || !window.L) return;
    if (state.map && state.map.getContainer() === el) { setTimeout(()=>state.map.invalidateSize(),100); return; }
    if (state.map) { try { state.map.remove(); } catch (_) {} }
    state.map = window.L.map(el, { zoomControl:true, attributionControl:true }).setView([22.5,79],5);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"&copy; OpenStreetMap contributors"}).addTo(state.map);
    state.layers = [];
  }
  function clearMapLayers() { state.layers.forEach(l=>{try{l.remove()}catch(_){}}); state.layers=[]; }
  function renderMap(record, routes) {
    ensureMap();
    if (!state.map) return;
    clearMapLayers();
    const gps = coordsOf(record);
    const bounds=[];
    if (gps) {
      const marker=window.L.marker([gps.lat,gps.lon]).addTo(state.map).bindPopup("Current position from Firebase sensor data");
      state.layers.push(marker); bounds.push([gps.lat,gps.lon]);
    }
    (routes||[]).forEach((route,i)=>{
      if (!Array.isArray(route.geometry)||route.geometry.length<2) return;
      const coords=route.geometry.map(c=>[c[1],c[0]]);
      const recommended=route.id===state.recommendedId;
      const line=window.L.polyline(coords,{color:recommended?"#059669":i===1?"#D97706":"#64748B",weight:recommended?6:4,opacity:recommended?0.95:0.65,dashArray:recommended?null:"7, 7"}).addTo(state.map);
      line.bindPopup((recommended?"Recommended route":"Alternative route")+" • "+route.distanceKm+" km • "+route.durationMinutes+" min");
      state.layers.push(line); coords.forEach(p=>bounds.push(p));
    });
    if (bounds.length) state.map.fitBounds(bounds,{padding:[25,25],maxZoom:12});
    else state.map.setView(gps?[gps.lat,gps.lon]:[22.5,79],gps?11:5);
    setTimeout(()=>state.map?.invalidateSize(),150);
  }

  function updateAlerts(extra=[]) {
    const el=document.getElementById("coldguard-live-alerts");
    if(!el)return;
    const r=selectedRecord(), gps=coordsOf(r), stamp=timestampOf(r), temp=tempOf(r);
    const min=num(r?.minAllowedTemperature??r?.storageMinTemp??r?.minTemp), max=num(r?.maxAllowedTemperature??r?.storageMaxTemp??r?.maxTemp);
    const alerts=[];
    if(!state.connected)alerts.push(["critical","Firebase RTDB is unavailable; live sensor state cannot be confirmed."]);
    if(r && (!stamp || Date.now()-stamp>STALE_AFTER_MS))alerts.push(["warning","Sensor data is stale or has no timestamp."]);
    if(r && !gps)alerts.push(["warning","GPS fix missing; route calculation is disabled."]);
    if(temp!==null&&min!==null&&max!==null&&(temp<min||temp>max))alerts.push(["critical","Temperature is outside the configured shipment storage range ("+min+"°C to "+max+"°C)."]);
    extra.forEach(a=>alerts.push(a));
    el.innerHTML=alerts.length?alerts.map(a=>'<div class="rounded-lg p-3 text-sm '+(a[0]==="critical"?"bg-red-50 text-red-800":"bg-amber-50 text-amber-800")+'">'+esc(a[1])+'</div>').join(""):'<div class="rounded-lg p-3 text-sm bg-emerald-50 text-emerald-800">No current sensor-based alert detected. Road safety is not certified by this forecast.</div>';
  }

  function renderWeather(data) {
    const el=document.getElementById("coldguard-current-weather");
    if(!el||!data?.current)return;
    const c=data.current, hourly=data.hourly||{}, nowIdx=Math.max(0,(hourly.time||[]).findIndex(t=>new Date(t).getTime()>=Date.now()));
    const rainProb=hourly.precipitation_probability?.[nowIdx];
    el.innerHTML='<div class="grid grid-cols-2 gap-2"><div><div class="text-xs text-slate-500">Air temperature</div><b>'+esc(c.temperature_2m)+'°C</b></div><div><div class="text-xs text-slate-500">Rain probability</div><b>'+(rainProb===undefined?"—":esc(rainProb+"%"))+'</b></div><div><div class="text-xs text-slate-500">Precipitation</div><b>'+esc(c.precipitation??"—")+' mm</b></div><div><div class="text-xs text-slate-500">Wind</div><b>'+esc(c.wind_speed_10m??"—")+' km/h</b></div><div><div class="text-xs text-slate-500">Humidity</div><b>'+esc(c.relative_humidity_2m??"—")+'%</b></div><div><div class="text-xs text-slate-500">Forecast time</div><b class="text-xs">'+esc(c.time||"—")+'</b></div></div><div class="text-[10px] text-slate-500 mt-2">Provider: Open-Meteo. No authoritative severe-weather or flood alert feed configured.</div>';
    const upd=document.getElementById("coldguard-weather-updated");if(upd)upd.textContent="Weather fetched "+new Date(data.fetchedAt).toLocaleTimeString();
  }

  async function loadWeather(force=false) {
    const record=selectedRecord(), gps=coordsOf(record), el=document.getElementById("coldguard-current-weather");
    if(!el)return;
    if(!gps){el.textContent="Weather unavailable: waiting for live GPS coordinates from Firebase.";return;}
    if(!force&&Date.now()-state.lastWeatherAt<WEATHER_REFRESH_MS){if(state.lastWeatherData)renderWeather(state.lastWeatherData);return;}
    el.textContent="Loading genuine Open-Meteo forecast…";
    try {
      const response=await fetch("/api/weather?lat="+encodeURIComponent(gps.lat)+"&lon="+encodeURIComponent(gps.lon),{headers:{Accept:"application/json"}});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Weather provider error");
      state.lastWeatherData=data;state.lastWeatherAt=Date.now();renderWeather(data);
      const c=data.current, hourly=data.hourly||{}, nowIdx=Math.max(0,(hourly.time||[]).findIndex(t=>new Date(t).getTime()>=Date.now()));
      const rainProb=hourly.precipitation_probability?.[nowIdx];
      const p=num(rainProb), mm=num(c.precipitation);
      const warnings=[];
      if((p!==null&&p>=60)||(mm!==null&&mm>=5))warnings.push(["warning","Rainfall risk detected near the current GPS position. Forecast alone does not establish road flooding."]);
      updateAlerts(warnings);
    }catch(error){el.textContent="Weather unavailable: "+(error.message||"provider request failed")+". No forecast has been substituted.";const upd=document.getElementById("coldguard-weather-updated");if(upd)upd.textContent="Last successful refresh: "+(state.lastWeatherAt?new Date(state.lastWeatherAt).toLocaleTimeString():"none");}
  }

  async function loadRoutes(force=false) {
    const record=selectedRecord(), gps=coordsOf(record), select=document.getElementById("coldguard-destination"), out=document.getElementById("coldguard-route-results");
    if(!out)return;
    const stamp=timestampOf(record);
    if(!state.connected||!gps||!stamp||Date.now()-stamp>STALE_AFTER_MS){out.textContent="Route calculation paused: a recent Firebase GPS fix is required.";renderMap(record,[]);return;}
    const cp=(state.app?.checkpoints||[]).find(c=>String(c.id)===String(select?.value));
    if(!cp||!Number.isFinite(Number(cp.lat))||!Number.isFinite(Number(cp.lng))){out.textContent="Choose a destination with valid coordinates.";return;}
    const key=[gps.lat.toFixed(4),gps.lon.toFixed(4),cp.lat,cp.lng].join("|");
    if(!force&&key===state.lastRouteKey&&Date.now()-state.lastRouteAt<ROUTE_REFRESH_MS){renderMap(record,state.lastRoutes);return;}
    out.textContent="Comparing road alternatives and sampling live weather along each route…";
    try{
      const q=new URLSearchParams({originLat:String(gps.lat),originLon:String(gps.lon),destLat:String(cp.lat),destLon:String(cp.lng)});
      const response=await fetch("/api/routes?"+q.toString(),{headers:{Accept:"application/json"}});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Route provider error");
      state.recommendedId=data.recommendedId;state.lastRouteAt=Date.now();state.lastRouteKey=key;state.lastRoutes=data.routes||[];
      renderMap(record,state.lastRoutes);
      out.innerHTML=(data.routes||[]).map((route,i)=>'<div class="border '+(route.id===data.recommendedId?"border-emerald-300 bg-emerald-50":"border-slate-200 bg-white")+' rounded-lg p-3 mb-2"><div class="flex items-center justify-between gap-2"><b class="text-xs">'+(route.id===data.recommendedId?"Recommended":"Alternative "+(i+1))+'</b><span class="text-[10px] font-bold">'+(route.weatherRiskScore===null?"Weather unavailable":"Weather risk "+route.weatherRiskScore+"/100")+'</span></div><div class="text-xs text-slate-600 mt-1">'+esc(route.distanceKm)+' km · '+esc(route.durationMinutes)+' min estimated</div><div class="text-[10px] text-slate-500 mt-1">'+(route.weatherAvailable?"Forecast sampled at route points":"Route available, but weather scoring unavailable")+'</div></div>').join("")||"No route alternatives returned.";
      if(!data.recommendedId)out.innerHTML+='<div class="text-xs text-amber-700">No weather-based recommendation: forecast data was unavailable.</div>';
      out.innerHTML+='<p class="text-[10px] text-slate-500 mt-2">'+esc(data.disclaimer||"Weather-aware guidance only; not a road-safety guarantee.")+'</p>';
      const extra=[];
      const recommended=(data.routes||[]).find(r=>r.id===data.recommendedId);
      if(recommended?.weatherRiskScore>=50)extra.push(["warning","Elevated forecast-based weather risk on the lowest-scored available route. Consider delaying or manually reviewing alternatives."]);
      updateAlerts(extra);
    }catch(error){out.textContent="Route recommendation unavailable: "+(error.message||"provider request failed")+". Existing GPS and sensor data remain unchanged.";renderMap(record,[]);}
  }

  function bindPanel() {
    const panel=document.getElementById("coldguard-live-route-panel");if(!panel)return;
    ensureMap();
    const shipment=document.getElementById("coldguard-live-shipment");
    if(shipment)shipment.onchange=()=>{state.selectedSensorId=shipment.value;state.lastWeatherAt=0;state.lastRouteKey="";state.lastRoutes=[];renderPanel();};
    const destination=document.getElementById("coldguard-destination");
    if(destination)destination.onchange=()=>{state.selectedDestinationId=destination.value;state.lastRouteKey="";state.lastRoutes=[];loadRoutes(true);};
    const recalc=document.getElementById("coldguard-recalculate");
    if(recalc)recalc.onclick=()=>{state.lastWeatherAt=0;state.lastRouteAt=0;loadWeather(true);loadRoutes(true);};
    if(state.lastRoutes.length)renderMap(selectedRecord(),state.lastRoutes);
    if(state.lastWeatherData)renderWeather(state.lastWeatherData);
    loadWeather(false);loadRoutes(false);updateAlerts();
  }

  function renderPanel() {
    const main=document.getElementById("main-content-view");
    const kpis=main?.querySelector("#kpi-cards-grid");
    if(!main||!kpis)return;
    let panel=document.getElementById("coldguard-live-route-panel");
    if(!panel){panel=document.createElement("div");panel.innerHTML=panelHtml();const section=panel.firstElementChild;kpis.parentElement.insertAdjacentElement("afterend",section);panel=section;}
    else {const holder=document.createElement("div");holder.innerHTML=panelHtml();panel.replaceWith(holder.firstElementChild);panel=document.getElementById("coldguard-live-route-panel");}
    bindPanel();
  }

  function attach() {
    const app=window.coldGuardApp;
    if(!app||!app.dbService){return;}
    if(state.app!==app){
      state.app=app;
      app.dbService.on("shipments", records=>{state.records=Array.isArray(records)?records:[];if(document.getElementById("coldguard-live-route-panel"))renderPanel();});
      app.dbService.on("connection", connected=>{state.connected=connected===true;if(document.getElementById("coldguard-live-route-panel"))renderPanel();});
      state.connected=app.dbService.isConnected===true;
    }
    renderPanel();
  }

  function start(){
    const main=document.getElementById("main-content-view");
    if(main&&window.MutationObserver){
      state.observer=new MutationObserver(()=>{if(document.getElementById("kpi-cards-grid")&&!document.getElementById("coldguard-live-route-panel"))attach();});
      state.observer.observe(main,{childList:true,subtree:true});
    }
    attach();
    window.setInterval(()=>{if(document.getElementById("coldguard-live-route-panel")){loadWeather(false);loadRoutes(false);updateAlerts();}},60000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.coldGuardLiveRoutes={refresh:()=>{state.lastWeatherAt=0;state.lastRouteAt=0;loadWeather(true);loadRoutes(true);},getState:()=>({connected:state.connected,remoteRecordCount:state.records.length})};
})();
