/* ColdGuard live sensor + weather-aware route panel.
 * This module only uses sensor records received from the existing Firebase RTDB listener.
 * It never treats local simulation values as live telemetry.
 */
(() => {
  "use strict";
  const STALE_AFTER_MS = 120000;
  const WEATHER_REFRESH_MS = 10 * 60 * 1000;
  const ROUTE_REFRESH_MS = 10 * 60 * 1000;
  const state = { app: null, records: [], connected: false, map: null, layers: [], lastWeatherAt: 0, lastWeatherData: null, lastRouteAt: 0, lastOrigin: null, lastRouteKey: "", lastRoutes: [], selectedSensorId: "", selectedDestinationId: "", recommendedId: null, selectedRouteId: null, scenario: "", simulatedWeather: false, weatherApiFailed: false, showWeatherOverlay: true, routeAudit: [], lastCoreTriggerAt: 0, busy: false, observer: null };

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
  const tempOf = r => num(r?.telemetry?.live?.coreTemperature ?? r?.telemetry?.live?.temperature ?? r?.coreTemperature ?? r?.currentTemperature ?? r?.temperature);
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
        <div id="coldguard-route-risk-banner" class="hidden mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950" role="alert" aria-live="polite">⚠ ROUTE_RISK: Heat risk ahead; reroute recommended.</div><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">GPS position</div><div class="font-mono text-sm font-bold mt-1">${gps ? gps.lat.toFixed(5)+", "+gps.lon.toFixed(5) : "No live fix"}</div><div class="text-[11px] text-slate-500 mt-1">${gps ? "Coordinates from Firebase record" : "Waiting for actual device coordinates"}</div></div>
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">Temperature</div><div class="text-xl font-extrabold mt-1">${temp===null?"—":esc(temp.toFixed(1)+"°C")}</div><div class="text-[11px] text-slate-500 mt-1">${tempMin!==null&&tempMax!==null?"Configured range "+tempMin+"° to "+tempMax+"°C":"Storage limits not configured in this Firebase record"}</div></div>
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">Humidity / Battery</div><div class="text-xl font-extrabold mt-1">${humidity===null?"—":esc(humidity.toFixed(0)+"%")} <span class="text-slate-300">/</span> ${battery===null?"—":esc(battery.toFixed(0)+"%")}</div><div class="text-[11px] text-slate-500 mt-1">Values shown only when supplied by the device</div></div>
          <div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">Last sensor sync</div><div class="text-sm font-bold mt-1">${esc(fmtTime(stamp))}</div><div class="text-[11px] text-slate-500 mt-1">Stale threshold: 2 minutes</div></div>
        </div>
        <div class="px-4 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div class="lg:col-span-2 min-w-0"><div id="coldguard-weather-route-map" class="w-full h-80 rounded-xl border border-slate-200 bg-slate-50"></div><div class="weather-map-legend" aria-label="Map legend"><span><i class="legend-green"></i> Low risk</span><span><i class="legend-amber"></i> Medium risk</span><span><i class="legend-red"></i> High risk</span><span>⛈ Storm / 🌡 Heat overlay</span><span>❄ Checkpoint hub</span></div><div class="text-[11px] text-slate-500 mt-2">Route guidance is advisory. Weather sampling does not certify roads as safe or flood-free.</div></div>
          <div class="space-y-3">
            <div class="border border-slate-200 rounded-xl p-4">
              <label for="coldguard-live-shipment" class="block text-xs font-bold text-slate-700 mb-1">Firebase shipment / sensor</label><select id="coldguard-live-shipment" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">${shipmentOptions || '<option value="">No Firebase shipment records yet</option>'}</select>
              <label for="coldguard-destination" class="block text-xs font-bold text-slate-700 mt-3 mb-1">Delivery destination</label><select id="coldguard-destination" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">${options || '<option value="">No destinations configured</option>'}</select>
              <button id="coldguard-recalculate" class="mt-3 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 disabled:opacity-50" ${!gps || stale || !state.connected ? "disabled" : ""}>Recalculate routes</button>
            </div>
            <div class="border border-slate-200 rounded-xl p-4"><div class="font-bold text-sm text-slate-900">Current weather</div><div id="coldguard-current-weather" class="text-sm text-slate-600 mt-2">Fetching genuine forecast when GPS is available…</div><div id="coldguard-weather-updated" class="text-[11px] text-slate-400 mt-2">Not refreshed yet</div></div>
            <div class="border border-slate-200 rounded-xl p-4"><div class="flex items-center justify-between gap-2"><div class="font-bold text-sm text-slate-900">Route comparison</div><label class="text-xs text-slate-600 inline-flex items-center gap-1"><input id="coldguard-weather-overlay" type="checkbox" ${state.showWeatherOverlay ? "checked" : ""}> Weather overlay</label></div><div id="coldguard-route-results" class="text-sm text-slate-600 mt-2"><div class="weather-loading-skeleton">Loading route and forecast comparisons…</div></div></div>
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
    const livePosition=coordsOf(record);
    const gps = livePosition || (state.scenario ? { lat: 18.5204, lon: 73.8567 } : null);
    const bounds=[];
    if (gps) {
      const marker=window.L.marker([gps.lat,gps.lon]).addTo(state.map).bindPopup(livePosition?"Current position from Firebase sensor data":"Simulated demo origin (Pune)");
      state.layers.push(marker); bounds.push([gps.lat,gps.lon]);
    }
    (routes||[]).forEach((route,i)=>{
      if(!Array.isArray(route.geometry)||route.geometry.length<2)return;
      const coords=route.geometry.map(c=>[c[1],c[0]]),recommended=route.id===state.recommendedId,selected=route.id===state.selectedRouteId;
      if(i===0&&Array.isArray(route.segments)&&route.segments.length){
        route.segments.forEach((seg,segIndex)=>{const color=seg.riskClass==="high"?"#DC2626":seg.riskClass==="medium"?"#D97706":"#059669";const line=window.L.polyline(seg.coordinates.map(c=>[c[1],c[0]]),{color,weight:selected?7:5,opacity:.92}).addTo(state.map);line.bindTooltip((segIndex===0?"Current Route · ":"")+"Thermal risk "+seg.risk+"/100 · "+seg.riskClass.toUpperCase(),{permanent:segIndex===0,direction:"center"});line.on("click",()=>{state.selectedRouteId=route.id;renderRouteResults(state.lastRoutes);});state.layers.push(line);});
      }else{
        const line=window.L.polyline(coords,{color:recommended?"#059669":i===1?"#D97706":"#64748B",weight:selected?6:4,opacity:selected ? 0.95 : 0.72,dashArray:"7, 7"}).addTo(state.map);
        line.bindPopup((recommended?"Recommended: ":"Alternative: ")+(i===1?"Route B":i===2?"Route C":"Route A")+" · "+route.distanceKm+" km · "+route.durationMinutes+" min");
        line.on("click",()=>{state.selectedRouteId=route.id;renderMap(selectedRecord(),state.lastRoutes);renderRouteResults(state.lastRoutes);});state.layers.push(line);
      }
      if(state.showWeatherOverlay)(route.weatherSamples||[]).forEach(w=>{if(!Number.isFinite(Number(w.lat))||!Number.isFinite(Number(w.lon)))return;const hot=Number(w.temperatureC)>=38,storm=w.storm||Number(w.weatherCode)>=95||Number(w.precipitationMm)>=7,color=storm?"#7C3AED":hot?"#DC2626":Number(w.risk)>=35?"#D97706":"#059669";const circle=window.L.circle([Number(w.lat),Number(w.lon)],{radius:9000,color,fillColor:color,fillOpacity:.16,weight:1}).addTo(state.map);circle.bindTooltip((storm?"⛈ Storm":hot?"🔥 Heat zone":"Weather waypoint")+" · "+w.temperatureC+"°C · risk "+(w.risk??"—")+"/100");state.layers.push(circle);if(storm||hot){const marker=window.L.marker([Number(w.lat),Number(w.lon)],{icon:window.L.divIcon({className:"weather-event-marker",html:storm?"⛈️":"🌡️",iconSize:[26,26],iconAnchor:[13,13]})}).addTo(state.map);marker.bindTooltip((storm?"Storm / heavy rain":"High ambient temperature")+" · "+w.temperatureC+"°C");state.layers.push(marker);}});
      coords.forEach(p=>bounds.push(p));
    });
    (state.app?.checkpoints||[]).forEach(h=>{if(num(h.lat)===null||num(h.lng)===null)return;let nearest={distance:Infinity,eta:null};(routes||[]).forEach(route=>{const g=route.geometry||[];g.forEach((p,index)=>{const d=haversineKm([Number(h.lng),Number(h.lat)],p);if(d<nearest.distance)nearest={distance:d,eta:Math.round((route.durationMinutes||0)*index/Math.max(1,g.length-1))};});});const marker=window.L.marker([Number(h.lat),Number(h.lng)],{icon:window.L.divIcon({className:"weather-hub-marker",html:"❄",iconSize:[28,28],iconAnchor:[14,14]})}).addTo(state.map);marker.bindTooltip("<strong>"+esc(h.name||h.city||"Checkpoint Hub")+"</strong><br>Cold storage hub<br>Distance to route: "+(Number.isFinite(nearest.distance)?nearest.distance.toFixed(1)+" km":"—")+"<br>Approx. ETA from origin: "+(nearest.eta===null?"—":nearest.eta+" min")+"<br>Capacity: "+esc(h.capacity||h.coldStorageCapacity||"Not supplied"));state.layers.push(marker);});
    if(gps){const moving=window.L.marker([gps.lat,gps.lon],{icon:window.L.divIcon({className:"weather-shipment-marker",html:"<span>🚚</span>",iconSize:[34,34],iconAnchor:[17,17]})}).addTo(state.map);moving.bindTooltip("Shipment position");state.layers.push(moving);}
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
    const routeRisk=state.lastRoutes.find(route=>route.id===state.recommendedId);
    const riskAhead=!!(state.scenario||(routeRisk&&(routeRisk.thermalRiskScore>=35||routeRisk.maxAmbientTemp>=38)));
    const routeBanner=document.getElementById("coldguard-route-risk-banner");
    if(routeBanner){routeBanner.className=riskAhead?"mx-4 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950":"hidden";routeBanner.textContent=state.scenario==="storm_on_route"?"⛈ ROUTE_RISK: Severe weather ahead; reroute review recommended.":state.scenario==="road_closure"?"🚧 ROUTE_RISK: Simulated road closure; review alternate routes.":"⚠ ROUTE_RISK: Heat risk ahead; reroute recommended.";}
    if(riskAhead)alerts.push(["warning",state.scenario==="storm_on_route"?"ROUTE_RISK: Severe weather ahead; reroute review recommended.":state.scenario==="road_closure"?"ROUTE_RISK: Simulated road closure; review alternate routes.":"ROUTE_RISK: Heat risk ahead; reroute recommended."]);
    if(routeRisk?.holdoverExceeded)alerts.push(["critical","Holdover exceeded. Consider a stopover at a checkpoint cold-storage hub."]);
    extra.forEach(a=>alerts.push(a));
    el.innerHTML=alerts.length?alerts.map(a=>'<div class="rounded-lg p-3 text-sm '+(a[0]==="critical"?"bg-red-50 text-red-800":"bg-amber-50 text-amber-800")+'">'+esc(a[1])+'</div>').join(""):'<div class="rounded-lg p-3 text-sm bg-emerald-50 text-emerald-800">No current sensor-based alert detected. Road safety is not certified by this forecast.</div>';
  }

  function renderWeather(data) {
    const el=document.getElementById("coldguard-current-weather");
    if(!el||!data?.current)return;
    const c=data.current, hourly=data.hourly||{}, nowIdx=Math.max(0,(hourly.time||[]).findIndex(t=>new Date(t).getTime()>=Date.now()));
    const rainProb=hourly.precipitation_probability?.[nowIdx];
    el.innerHTML='<div class="grid grid-cols-2 gap-2"><div><div class="text-xs text-slate-500">Air temperature</div><b>'+esc(c.temperature_2m)+'°C</b></div><div><div class="text-xs text-slate-500">Rain probability</div><b>'+(rainProb===undefined?"—":esc(rainProb+"%"))+'</b></div><div><div class="text-xs text-slate-500">Precipitation</div><b>'+esc(c.precipitation??"—")+' mm</b></div><div><div class="text-xs text-slate-500">Wind</div><b>'+esc(c.wind_speed_10m??"—")+' km/h</b></div><div><div class="text-xs text-slate-500">Humidity</div><b>'+esc(c.relative_humidity_2m??"—")+'%</b></div><div><div class="text-xs text-slate-500">Forecast time</div><b class="text-xs">'+esc(c.time||"—")+'</b></div></div><div class="text-[10px] text-slate-500 mt-2">Provider: '+esc(data.provider||"Open-Meteo")+'. No authoritative severe-weather or flood alert feed configured.</div>';
    const upd=document.getElementById("coldguard-weather-updated");if(upd)upd.textContent="Weather fetched "+new Date(data.fetchedAt).toLocaleTimeString();
  }

  async function loadWeather(force=false) {
    const record=selectedRecord(), gps=coordsOf(record), el=document.getElementById("coldguard-current-weather");
    if(!el)return;
    if(!gps){if(state.scenario){state.weatherApiFailed=true;state.simulatedWeather=true;const mock={provider:"Simulated weather",fetchedAt:Date.now(),current:{temperature_2m:35,relative_humidity_2m:48,precipitation:0.2,wind_speed_10m:14,weather_code:1,time:new Date().toISOString()},hourly:{time:[new Date().toISOString()],precipitation_probability:[10]}};state.lastWeatherData=mock;state.lastWeatherAt=Date.now();renderWeather(mock);}else el.textContent="Weather unavailable: waiting for live GPS coordinates from Firebase.";return;}
    if(!force&&Date.now()-state.lastWeatherAt<WEATHER_REFRESH_MS){if(state.lastWeatherData)renderWeather(state.lastWeatherData);return;}
    el.innerHTML='<div class="weather-loading-skeleton">Loading weather forecast…</div>';
    try {
      const response=await fetch("/api/weather?lat="+encodeURIComponent(gps.lat)+"&lon="+encodeURIComponent(gps.lon),{headers:{Accept:"application/json"}});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Weather provider error");
      state.lastWeatherData=data;state.lastWeatherAt=Date.now();state.weatherApiFailed=false;renderWeather(data);
      const c=data.current, hourly=data.hourly||{}, nowIdx=Math.max(0,(hourly.time||[]).findIndex(t=>new Date(t).getTime()>=Date.now()));
      const rainProb=hourly.precipitation_probability?.[nowIdx];
      const p=num(rainProb), mm=num(c.precipitation);
      const warnings=[];
      if((p!==null&&p>=60)||(mm!==null&&mm>=5))warnings.push(["warning","Rainfall risk detected near the current GPS position. Forecast alone does not establish road flooding."]);
      updateAlerts(warnings);
    }catch(error){state.weatherApiFailed=true;state.simulatedWeather=true;const mock={provider:"Simulated weather",fetchedAt:Date.now(),current:{temperature_2m:35,relative_humidity_2m:48,precipitation:0.2,wind_speed_10m:14,weather_code:1,time:new Date().toISOString()},hourly:{time:[new Date().toISOString()],precipitation_probability:[10]}};state.lastWeatherData=mock;state.lastWeatherAt=Date.now();renderWeather(mock);const upd=document.getElementById("coldguard-weather-updated");if(upd)upd.textContent="Live forecast unavailable · simulated fallback";if(state.lastRoutes.length)renderRouteResults(state.lastRoutes);}
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const haversineKm = (a, b) => {
    const rad = n => n * Math.PI / 180;
    const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  function mockWeather(route, index, count) {
    const point = route.geometry?.[Math.round(index * ((route.geometry?.length || 2) - 1) / Math.max(1, count - 1))] || [73.85, 18.52];
    const heatSpot = index === Math.max(1, Math.floor(count / 2));
    let temperature = 32 + ((index * 7 + (route.id || "").length) % 8);
    let apparent = temperature + 2.5, precipitation = 0.2, rainProbability = 8, wind = 12, weatherCode = 1;
    if (state.scenario === "heatwave_ahead" && heatSpot && route.id !== "route-2") { temperature = 44; apparent = 47; }
    if (state.scenario === "storm_on_route" && heatSpot && route.id !== "route-3") { temperature = 31; apparent = 35; precipitation = 11; rainProbability = 92; wind = 62; weatherCode = 95; }
    return { lat: point[1], lon: point[0], temperatureC: temperature, apparentTemperatureC: apparent, precipitationMm: precipitation, rainProbability, windKmh: wind, weatherCode, mock: true };
  }
  function sampleRoute(route) {
    const coords = route.geometry || [];
    if (coords.length < 2) return [];
    const points = [coords[0]];
    let accumulated = 0, last = coords[0];
    for (let i = 1; i < coords.length; i++) {
      accumulated += haversineKm(last, coords[i]);
      if (accumulated >= 25) { points.push(coords[i]); accumulated = 0; }
      last = coords[i];
    }
    if (points[points.length - 1] !== coords[coords.length - 1]) points.push(coords[coords.length - 1]);
    if (points.length > 24) return Array.from({length:24}, (_,i)=>points[Math.round(i*(points.length-1)/23)]);
    return points;
  }
  function scoreRoutes(routes, record) {
    const core = num(record?.telemetry?.live?.coreTemperature ?? record?.coreTemperature ?? record?.currentTemperature ?? record?.temperature) ?? 5;
    const barrier = Math.max(0, num(record?.thermalBarrier ?? record?.deltaTemperature ?? record?.insulationGradient) ?? 20);
    const maxCore = num(record?.maxAllowedTemperature ?? record?.storageMaxTemp ?? record?.maxTemp) ?? 8;
    const minCore = num(record?.minAllowedTemperature ?? record?.storageMinTemp ?? record?.minTemp) ?? 2;
    const simulationShipment=(state.app?.simulation?.shipments||[]).find(item=>String(item.id)===String(record?.id||record?.shipmentId||state.app?.selectedShipmentId));
    const holdoverValue=num(record?.remainingHoldoverMinutes??record?.holdoverMinutes??record?.holdoverRemainingMinutes??record?.carrierHoldoverMinutes??record?.holdoverTimeMinutes??simulationShipment?.remainingHoldoverMinutes??simulationShipment?.holdoverMinutes);
    const holdoverHours=num(record?.remainingHoldoverHours??record?.holdoverTimeHours??record?.carrierHoldoverHours??simulationShipment?.remainingHoldoverHours??simulationShipment?.holdoverTimeHours);
    const holdover=holdoverValue!==null?holdoverValue:holdoverHours!==null?holdoverHours*60:null;
    const scored = routes.map((route, routeIndex) => {
      const pts = sampleRoute(route);
      let samples = Array.isArray(route.weatherSamples) ? route.weatherSamples.filter(w => num(w.temperatureC ?? w.temperature_2m ?? w.temperature) !== null) : [];
      const allReal = route.weatherAvailable !== false && samples.length >= Math.min(2, pts.length) && samples.every(w => !w.mock);
      if (!allReal || state.scenario) samples = pts.map((_, i) => mockWeather(route, i, pts.length));
      const duration = Math.max(1, num(route.durationMinutes) ?? 60);
      const segmentMinutes = duration / Math.max(1, samples.length);
      const riskSamples = samples.map(w => {
        const temp = num(w.temperatureC ?? w.temperature_2m ?? w.temperature) ?? 34;
        const feels = num(w.apparentTemperatureC ?? w.apparent_temperature) ?? temp;
        const rain = num(w.precipitationMm ?? w.precipitation) ?? 0;
        const rainProb = num(w.rainProbability ?? w.precipitation_probability) ?? 0;
        const wind = num(w.windKmh ?? w.wind_speed_10m) ?? 0;
        const code = num(w.weatherCode ?? w.weather_code) ?? 0;
        const storm = code >= 95 || rain >= 7 || wind >= 55;
        const risk = clamp(Math.round(Math.max(0,temp-30)*4 + Math.max(0,feels-32)*2.5 + Math.min(24,rain*1.6+rainProb*0.12) + (storm?28:0) + Math.min(10,segmentMinutes*0.12)),0,100);
        return { ...w, temperatureC:temp, apparentTemperatureC:feels, precipitationMm:rain, rainProbability:rainProb, windKmh:wind, risk, riskClass:risk<35?"low":risk<=65?"medium":"high", storm };
      });
      const maxAmbient = Math.max(0,...riskSamples.map(w=>w.temperatureC));
      const avgRisk = riskSamples.length ? riskSamples.reduce((n,w)=>n+w.risk,0)/riskSamples.length : 45;
      const maxRisk = Math.max(0,...riskSamples.map(w=>w.risk));
      const durationHours = duration/60, k = 0.035/(1+barrier/10);
      const avgAmbient = riskSamples.length ? riskSamples.reduce((n,w)=>n+w.temperatureC,0)/riskSamples.length : 34;
      const predictedCore = core+(avgAmbient-core)*(1-Math.exp(-k*durationHours));
      let viabilityLoss, spoilageRiskScore=avgRisk;
      try {
        const appShipment=simulationShipment;
        const baseShipment={...(appShipment||{}),...(record||{}),currentTemperature:predictedCore,excursionDurationMinutes:(num(record?.excursionDurationMinutes??appShipment?.excursionDurationMinutes)||0)+duration,cumulativeThermalExposure:(num(record?.cumulativeThermalExposure??appShipment?.cumulativeThermalExposure)||0)+durationHours,currentHumidity:num(record?.currentHumidity??appShipment?.currentHumidity)||45};
        const profiles=state.app?.vaccineProfiles||{};
        const profile=profiles[baseShipment.vaccineCategory]||{minTemp:minCore,maxTemp:maxCore,thermalDegradationFactor:0.08};
        const estimate=typeof ViabilityModel!=="undefined"&&ViabilityModel.estimateViability?ViabilityModel.estimateViability(baseShipment,profile):null;
        const modelLoss=num(estimate?.estimatedViabilityLossPercent);
        const baselineLoss=num(record?.predictedSpoilageRiskPercent??appShipment?.predictedSpoilageRiskPercent);
        viabilityLoss=clamp((modelLoss??baselineLoss??0)+avgRisk*0.025,0,100);
        spoilageRiskScore=clamp((num(estimate?.predictedSpoilageRiskPercent)??avgRisk)+avgRisk*0.25,0,100);
      } catch (_) { viabilityLoss=clamp(Math.max(0,predictedCore-maxCore)*1.8+Math.max(0,minCore-predictedCore)*1.8+avgRisk*0.025,0,100);spoilageRiskScore=avgRisk; }
      const distance = num(route.distanceKm) ?? 100;
      const holdoverExceeded = holdover !== null && duration > holdover;
      const hubList = (state.app?.checkpoints || []).filter(h=>num(h.lat)!==null&&num(h.lng)!==null);
      const nearestHub = hubList.map(h=>({...h,_distance:riskSamples.length?Math.min(...riskSamples.map(w=>haversineKm([w.lon,w.lat],[Number(h.lng),Number(h.lat)]))):Infinity})).sort((a,b)=>a._distance-b._distance)[0];
      const segments=[], geometry=route.geometry||[];
      for(let i=1;i<pts.length;i++){const w=riskSamples[Math.min(riskSamples.length-1,i-1)]||{risk:avgRisk,riskClass:avgRisk<35?"low":avgRisk<=65?"medium":"high"};const from=Math.round((i-1)*(geometry.length-1)/Math.max(1,pts.length-1)),to=Math.max(from+1,Math.round(i*(geometry.length-1)/Math.max(1,pts.length-1)));segments.push({coordinates:geometry.slice(from,Math.min(geometry.length,to+1)),risk:w.risk,riskClass:w.riskClass});}
      return {...route,weatherSamples:riskSamples,weatherAvailable:allReal&&!state.scenario,maxAmbientTemp:maxAmbient,thermalRiskScore:Math.round(avgRisk),spoilageRiskScore:Math.round(spoilageRiskScore),maxThermalRisk:maxRisk,predictedCoreTemp:Number(predictedCore.toFixed(1)),viabilityLoss:Number(viabilityLoss.toFixed(1)),holdoverExceeded,nearestHub,segments,routeIndex};
    });
    const maxEta=Math.max(1,...scored.map(r=>r.durationMinutes||1)), maxDist=Math.max(1,...scored.map(r=>r.distanceKm||1));
    scored.forEach(r=>{r.routeScore=Math.round(r.spoilageRiskScore*0.5+(r.durationMinutes/maxEta*100)*0.3+(r.distanceKm/maxDist*100)*0.2+(r.closurePenalty||0));});
    const best=scored.filter(r=>!(state.scenario==="road_closure"&&r.id==="route-1")).sort((a,b)=>a.routeScore-b.routeScore)[0]||scored[0];
    state.recommendedId=best?.id||null;state.simulatedWeather=state.weatherApiFailed||scored.some(r=>!r.weatherAvailable);
    return scored;
  }
  function fallbackRoutes(gps, cp) {
    const start=[gps.lon,gps.lat],end=[Number(cp.lng),Number(cp.lat)],midLon=(start[0]+end[0])/2,midLat=(start[1]+end[1])/2;
    const dx=end[0]-start[0],dy=end[1]-start[1],len=Math.sqrt(dx*dx+dy*dy)||1;
    const offset=scale=>[midLon-dy/len*scale,midLat+dx/len*scale];
    const variants=[[start,end],[start,offset(0.55),end],[start,offset(-0.55),end]];
    return variants.map((geometry,i)=>({id:"route-"+(i+1),distanceKm:Math.round(haversineKm(start,end)*(i===0?1.08:i===1?1.2:1.27)*10)/10,durationMinutes:Math.round(haversineKm(start,end)*(i===0?1.8:i===1?2:2.2)),geometry,weatherSamples:[],weatherAvailable:false,provider:"Simulated fallback",simulatedRoute:true}));
  }
  function renderRouteResults(routes) {
    const out=document.getElementById("coldguard-route-results");if(!out)return;
    const recommended=routes.find(r=>r.id===state.recommendedId),current=routes.find(r=>r.id==="route-1")||routes[0];
    const selected=routes.find(r=>r.id===state.selectedRouteId)||recommended||current;
    const hot=selected?.weatherSamples?.find(w=>w.temperatureC>=38);
    const reason=state.scenario==="heatwave_ahead"?"Heatwave ahead ("+(hot?.temperatureC??44)+"°C). The recommendation avoids the highest heat exposure.":state.scenario==="storm_on_route"?"Storm risk is elevated along part of the current corridor. Compare the alternatives before approving.":state.scenario==="road_closure"?"A simulated road closure affects the current route. Review alternatives before approving.":hot?"High ambient heat ("+hot.temperatureC+"°C) increases thermal exposure. The recommended route has the lowest weighted score.":"The recommendation has the lowest combined thermal-risk, ETA, and distance score.";
    const reroute=!!(recommended&&current&&recommended.id!==current.id&&(recommended.routeScore<current.routeScore||recommended.thermalRiskScore+8<current.thermalRiskScore));
    const name=r=>r.id==="route-1"?"Current":r.id==="route-2"?"Route B":"Route C";
    const rows=routes.map(r=>'<tr tabindex="0" role="button" data-route-select="'+esc(r.id)+'" class="weather-route-row '+(r.id===state.recommendedId?"is-recommended ":"")+(r.id===state.selectedRouteId?"is-selected":"")+'"><td><strong>'+name(r)+'</strong>'+(r.id===state.recommendedId?'<div class="text-xs font-bold">Recommended</div>':'')+'</td><td>'+esc(r.durationMinutes)+' min</td><td>'+esc(r.distanceKm)+' km</td><td>'+esc(r.maxAmbientTemp)+'°C</td><td>'+esc(r.predictedCoreTemp)+'°C</td><td>'+esc(r.viabilityLoss)+'%</td><td><span class="weather-risk-pill risk-'+(r.thermalRiskScore<35?"low":r.thermalRiskScore<=65?"medium":"high")+'" title="Thermal risk score '+r.thermalRiskScore+' out of 100">'+(r.thermalRiskScore<35?"✓ Low":r.thermalRiskScore<=65?"⚠ Medium":"✖ High")+'</span></td></tr>').join("");
    const savings=current&&recommended?Math.max(0,current.viabilityLoss-recommended.viabilityLoss).toFixed(1):"0.0";
    out.innerHTML='<div class="weather-recommendation '+(reroute?"recommend-reroute":"recommend-current")+'"><div class="flex flex-wrap items-center justify-between gap-2"><strong>Route Recommendation</strong><span class="weather-recommendation-badge">'+(reroute?"Reroute Recommended":"Current Route OK")+'</span></div><p class="mt-2 text-sm">'+esc(reason)+'</p>'+(reroute?'<p class="mt-2 text-xs font-bold">Reroute reduces predicted viability loss from '+current.viabilityLoss+'% to '+recommended.viabilityLoss+'%.</p>':'')+'</div>'+
      (state.simulatedWeather?'<div class="weather-sim-badge" role="status">⚠ Using simulated weather / route data</div>':'')+
      '<div class="weather-comparison-wrap"><table class="weather-comparison"><thead><tr><th>Route</th><th>ETA</th><th>Distance</th><th>Max ambient</th><th>Core at arrival</th><th>Viability loss</th><th>Risk</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<div class="flex flex-wrap gap-2 mt-3"><button type="button" class="weather-btn weather-btn-primary" data-route-action="approve" '+(!reroute?"disabled":"")+'>Approve Reroute</button><button type="button" class="weather-btn weather-btn-secondary" data-route-action="keep">Keep Current Route</button>'+(selected?.holdoverExceeded?'<button type="button" class="weather-btn weather-btn-warning" data-route-action="hub">Stopover at Hub</button>':'')+'</div>'+
      (selected?.holdoverExceeded?'<div class="mt-2 text-xs font-bold text-red-800" role="alert">Holdover exceeded. Suggested hub: '+esc(selected.nearestHub?.name||selected.nearestHub?.city||"nearest checkpoint")+'.</div>':'')+
      '<details class="weather-why mt-3"><summary>Why this route?</summary><ul><li>Thermal risk 50%; ETA 30%; distance 20%.</li><li>Risk considers ambient/apparent temperature, rain, wind, storm code, and exposure time.</li><li>Core temperature uses a simplified insulation-aware thermal estimate, not a validated stability model.</li></ul></details>'+
      '<p class="text-[10px] text-slate-500 mt-3">Advisory only. The vehicle is never rerouted automatically. Forecasts do not certify road closures, flooding, or road safety.</p>';
  }
  function logRouteDecision(action, route) {
    const record=selectedRecord(),event={type:"ROUTE_RISK",action,routeId:route?.id||"route-1",routeName:route?.id==="route-2"?"Route B":route?.id==="route-3"?"Route C":"Current Route",who:window.coldGuardApp?.currentUser?.email||window.coldGuardApp?.currentUser?.displayName||"Operator",at:new Date().toISOString(),reason:state.scenario||"Weather-aware route review",predictedViabilityLoss:route?.viabilityLoss??null};
    state.routeAudit.push(event);
    if(record){record.routeDecisionHistory=Array.isArray(record.routeDecisionHistory)?record.routeDecisionHistory:[];record.routeDecisionHistory.push(event);record.timeline=Array.isArray(record.timeline)?record.timeline:[];record.timeline.push({timestamp:event.at,type:"ROUTE_RISK",message:"Route decision: "+action+" — "+event.routeName,details:event});}const linked=(state.app?.simulation?.shipments||[]).find(item=>String(item.id)===String(record?.id||record?.shipmentId||state.app?.selectedShipmentId));if(linked){linked.routeDecisionHistory=Array.isArray(linked.routeDecisionHistory)?linked.routeDecisionHistory:[];linked.routeDecisionHistory.push(event);linked.timeline=Array.isArray(linked.timeline)?linked.timeline:[];linked.timeline.push({timestamp:event.at,type:"ROUTE_RISK",message:"Route decision: "+action+" — "+event.routeName,details:event});}
    const app=window.coldGuardApp;if(app){app.routeDecisionAudit=Array.isArray(app.routeDecisionAudit)?app.routeDecisionAudit:[];app.routeDecisionAudit.push(event);}
    window.dispatchEvent(new CustomEvent("coldguard:route-decision",{detail:event}));
    updateAlerts([["warning","ROUTE_RISK: "+(action==="approve"?"Reroute approved by operator.":action==="hub"?"Checkpoint stopover requested.":"Current route retained.")]]);
  }
  function showDecisionModal(route) {
    let modal=document.getElementById("coldguard-route-confirm");if(modal)modal.remove();
    modal=document.createElement("div");modal.id="coldguard-route-confirm";modal.className="weather-confirm-backdrop";
    modal.innerHTML='<div class="weather-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="weather-confirm-title"><h3 id="weather-confirm-title">Confirm route change</h3><p>Approve the suggested '+esc(route?.id==="route-2"?"Route B":route?.id==="route-3"?"Route C":"alternative route")+'? This records your decision but does not update vehicle navigation automatically.</p><div class="flex justify-end gap-2 mt-4"><button type="button" class="weather-btn weather-btn-secondary" data-confirm-cancel>Cancel</button><button type="button" class="weather-btn weather-btn-primary" data-confirm-approve>Confirm approval</button></div></div>';
    document.body.appendChild(modal);modal.querySelector("[data-confirm-cancel]").onclick=()=>modal.remove();
    modal.querySelector("[data-confirm-approve]").onclick=()=>{logRouteDecision("approve",route);modal.remove();renderRouteResults(state.lastRoutes);};
  }
  function bindRouteActions() {
    const out=document.getElementById("coldguard-route-results");if(!out||out.dataset.weatherBound==="1")return;out.dataset.weatherBound="1";
    out.addEventListener("click",event=>{
      const row=event.target.closest("[data-route-select]");
      if(row){state.selectedRouteId=row.dataset.routeSelect;renderMap(selectedRecord(),state.lastRoutes);renderRouteResults(state.lastRoutes);return;}
      const action=event.target.closest("[data-route-action]")?.dataset.routeAction;if(!action)return;
      const route=state.lastRoutes.find(r=>r.id===state.selectedRouteId)||state.lastRoutes.find(r=>r.id===state.recommendedId);
      if(action==="approve")showDecisionModal(route);
      else if(action==="keep"){logRouteDecision("keep-current",state.lastRoutes.find(r=>r.id==="route-1"));renderRouteResults(state.lastRoutes);}
      else if(action==="hub"){logRouteDecision("stopover-at-hub",route);renderRouteResults(state.lastRoutes);}
    });
    out.addEventListener("keydown",event=>{if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-route-select]")){event.preventDefault();event.target.click();}});
  }

  async function loadRoutes(force=false) {
    const record=selectedRecord(), liveGps=coordsOf(record), gps=liveGps||(state.scenario?{lat:18.5204,lon:73.8567}:null), select=document.getElementById("coldguard-destination"), out=document.getElementById("coldguard-route-results");
    if(!out)return;
    const stamp=timestampOf(record);
    if((!state.connected||!gps||!stamp||Date.now()-stamp>STALE_AFTER_MS)&&!state.scenario){out.textContent="Route calculation paused: a recent Firebase GPS fix is required. Choose a Simulation Lab scenario to preview with simulated coordinates.";renderMap(record,[]);return;}
    const cp=(state.app?.checkpoints||[]).find((c,i)=>String(c.id||i)===String(select?.value));
    if(!cp||!Number.isFinite(Number(cp.lat))||!Number.isFinite(Number(cp.lng))){out.textContent="Choose a destination with valid coordinates.";return;}
    const key=[gps.lat.toFixed(4),gps.lon.toFixed(4),cp.lat,cp.lng,state.scenario].join("|");
    if(!force&&key===state.lastRouteKey&&Date.now()-state.lastRouteAt<ROUTE_REFRESH_MS){renderMap(record,state.lastRoutes);renderRouteResults(state.lastRoutes);bindRouteActions();return;}
    out.innerHTML='<div class="weather-loading-skeleton">Comparing road alternatives and sampling route weather…</div>';
    try{
      const q=new URLSearchParams({originLat:String(gps.lat),originLon:String(gps.lon),destLat:String(cp.lat),destLon:String(cp.lng)});
      let data=null;
      if(state.scenario){data={routes:fallbackRoutes(gps,cp),provider:"Simulated scenario"};state.simulatedWeather=true;}
      else {
        try { const response=await fetch("/api/routes?"+q.toString(),{headers:{Accept:"application/json"}});data=await response.json();if(!response.ok)throw new Error(data.error||"Route provider error"); }
        catch(apiError){data={routes:fallbackRoutes(gps,cp),provider:"Simulated fallback"};state.simulatedWeather=true;}
      }
      if(!Array.isArray(data.routes)||!data.routes.length){data.routes=fallbackRoutes(gps,cp);state.simulatedWeather=true;}
      if(data.routes.some(r=>!Array.isArray(r.weatherSamples)||!r.weatherSamples.some(w=>num(w.temperatureC??w.temperature_2m??w.temperature)!==null)))state.simulatedWeather=true;
      state.lastRouteAt=Date.now();state.lastRouteKey=key;state.lastRoutes=scoreRoutes(data.routes,record);
      const routeRisk=state.lastRoutes.find(r=>r.id===state.recommendedId);
      const simShipments=state.app?.simulation?.shipments||[];
      const linkedShipment=simShipments.find(item=>String(item.id)===String(record?.id||record?.shipmentId));
      if(linkedShipment){linkedShipment.routeRiskActive=!!(state.scenario||(routeRisk&&(routeRisk.thermalRiskScore>=35||routeRisk.maxAmbientTemp>=38)));linkedShipment.routeRiskMessage=linkedShipment.routeRiskActive?"Heat risk ahead: reroute recommended.":"";}
      if(record){record.routeRiskActive=!!(state.scenario||(routeRisk&&(routeRisk.thermalRiskScore>=35||routeRisk.maxAmbientTemp>=38)));record.routeRiskMessage=record.routeRiskActive?"Heat risk ahead: reroute recommended.":"";}
      if(!state.selectedRouteId||!state.lastRoutes.some(r=>r.id===state.selectedRouteId))state.selectedRouteId=state.recommendedId;
      renderMap(record,state.lastRoutes);renderRouteResults(state.lastRoutes);bindRouteActions();
      const recommended=state.lastRoutes.find(r=>r.id===state.recommendedId),extra=[];
      if(recommended&&(recommended.thermalRiskScore>=35||recommended.maxAmbientTemp>=38))extra.push(["warning","ROUTE_RISK: Heat or severe weather risk ahead; reroute review recommended."]);
      if(recommended?.holdoverExceeded)extra.push(["critical","Holdover exceeded: consider a checkpoint cold-storage stopover."]);
      updateAlerts(extra);
    }catch(error){
      const fallback=fallbackRoutes(gps,cp);state.simulatedWeather=true;state.lastRouteAt=Date.now();state.lastRouteKey=key;state.lastRoutes=scoreRoutes(fallback,record);state.selectedRouteId=state.recommendedId;
      renderMap(record,state.lastRoutes);renderRouteResults(state.lastRoutes);bindRouteActions();
      updateAlerts([["warning","ROUTE_RISK: Using simulated route and weather data because a provider failed."]]);
    }
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
    const overlay=document.getElementById("coldguard-weather-overlay");if(overlay)overlay.onchange=()=>{state.showWeatherOverlay=overlay.checked;renderMap(selectedRecord(),state.lastRoutes);};
    const scenarioSelect=document.getElementById("select-header-scenario");
    if(scenarioSelect&&!scenarioSelect.dataset.weatherScenarioBound){
      scenarioSelect.dataset.weatherScenarioBound="1";
      scenarioSelect.addEventListener("change",event=>{
        const selected=event.target.value;
        state.scenario=["heatwave_ahead","storm_on_route","road_closure"].includes(selected)?selected:"";
        state.lastRouteKey="";state.lastRouteAt=0;state.lastRoutes=[];
        const out=document.getElementById("coldguard-route-results");
        if(out)out.innerHTML="<div class=\"weather-loading-skeleton\">Recalculating routes for selected scenario…</div>";
        if(state.scenario){loadWeather(true);loadRoutes(true);}else if(coordsOf(selectedRecord())){loadWeather(true);loadRoutes(true);}else{if(out)out.textContent="Choose a weather scenario to preview routes, or wait for a recent live GPS fix.";renderMap(selectedRecord(),[]);}
      },true);
    }
    bindRouteActions();
    if(state.lastRoutes.length)renderMap(selectedRecord(),state.lastRoutes);
    if(state.lastWeatherData)renderWeather(state.lastWeatherData);
    loadWeather(false);loadRoutes(false);updateAlerts();
  }

  function renderDashboardRouteSummary(main,kpis) {
    document.getElementById("coldguard-live-route-panel")?.remove();
    const shipments=state.app?.simulation?.shipments||[];
    const risky=shipments.filter(s=>s.routeRiskActive||s.sensorHealth==="fault"||s.excursionSeverity==="Critical"||s.riskClassification==="High Risk");
    const selected=shipments.find(s=>String(s.id)===String(state.app?.selectedShipmentId))||risky[0]||shipments.find(s=>s.status!=="Delivered")||shipments[0];
    let card=document.getElementById("coldguard-route-overview-card");
    if(!card){card=document.createElement("section");card.id="coldguard-route-overview-card";card.className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";kpis.insertAdjacentElement("afterend",card);}
    card.innerHTML='<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="min-w-0"><div class="text-[11px] font-bold uppercase tracking-widest text-indigo-600">Route intelligence</div><h2 class="mt-1 text-lg font-extrabold text-slate-900">Route & Weather Watch</h2><p class="mt-1 max-w-2xl text-sm text-slate-600">A fleet-level summary belongs here. Open an individual shipment to inspect its route map, forecast, alternatives, and approval controls.</p><div class="mt-3 flex flex-wrap gap-2"><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Active shipments: '+shipments.filter(s=>s.status!=="Delivered").length+'</span><span class="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Needs review: '+risky.length+'</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">Detailed route analysis: per shipment</span></div></div><div class="flex shrink-0 flex-col gap-2 sm:items-end"><div class="text-right"><div class="text-xs text-slate-500">Suggested next inspection</div><div class="font-mono text-sm font-bold text-slate-900">'+esc(selected?.id||"No shipment selected")+'</div><div class="text-xs text-slate-500">'+esc(selected?.vaccineName||"Waiting for shipment data")+'</div></div><button id="coldguard-open-route-detail" type="button" class="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" '+(!selected?'disabled':'')+'>Open shipment analysis →</button></div></div>';
    const button=card.querySelector("#coldguard-open-route-detail");
    if(button)button.onclick=()=>{if(!selected)return;state.app.selectedShipmentId=selected.id;state.app.currentView="details";if(typeof state.app.renderCurrentView==="function")state.app.renderCurrentView();document.querySelectorAll(".nav-link").forEach(el=>{const active=el.getAttribute("data-view")==="details";el.classList.toggle("bg-blue-600",active);el.classList.toggle("text-white",active);});};
  }

  function renderPanel() {
    const main=document.getElementById("main-content-view");
    const kpis=main?.querySelector("#kpi-cards-grid");
    const detailMap=main?.querySelector("#route-map-container");
    if(!main)return;
    if(kpis&&!detailMap){renderDashboardRouteSummary(main,kpis);return;}
    document.getElementById("coldguard-route-overview-card")?.remove();
    if(!detailMap){document.getElementById("coldguard-live-route-panel")?.remove();return;}
    let panel=document.getElementById("coldguard-live-route-panel");
    if(!panel){
      panel=document.createElement("div");panel.innerHTML=panelHtml();const section=panel.firstElementChild;
      const anchor=detailMap.closest(".bg-white.rounded-2xl")||detailMap.parentElement;
      anchor.insertAdjacentElement("afterend",section);panel=section;
    }else{
      const holder=document.createElement("div");holder.innerHTML=panelHtml();panel.replaceWith(holder.firstElementChild);panel=document.getElementById("coldguard-live-route-panel");
    }
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
      state.observer=new MutationObserver(()=>{if(document.getElementById("kpi-cards-grid")&&!document.getElementById("coldguard-route-overview-card")||document.getElementById("route-map-container")&&!document.getElementById("coldguard-live-route-panel"))attach();});
      state.observer.observe(main,{childList:true,subtree:true});
    }
    attach();
    window.setInterval(()=>{if(document.getElementById("coldguard-live-route-panel")){loadWeather(false);const r=selectedRecord(),t=tempOf(r),hi=num(r?.maxAllowedTemperature??r?.storageMaxTemp??r?.maxTemp),lo=num(r?.minAllowedTemperature??r?.storageMinTemp??r?.minTemp),nearLimit=t!==null&&((hi!==null&&t>=hi-1)||(lo!==null&&t<=lo+1));const force=nearLimit&&Date.now()-state.lastCoreTriggerAt>ROUTE_REFRESH_MS;if(force)state.lastCoreTriggerAt=Date.now();loadRoutes(force);updateAlerts();}},60000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.coldGuardLiveRoutes={refresh:()=>{state.lastWeatherAt=0;state.lastRouteAt=0;loadWeather(true);loadRoutes(true);},getState:()=>({connected:state.connected,remoteRecordCount:state.records.length,simulatedWeather:state.simulatedWeather,routes:state.lastRoutes,routeAudit:state.routeAudit})};
})();
