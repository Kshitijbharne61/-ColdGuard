/* ColdGuard Shipment Quality Assessment & PDF Reports.
 * Uses timestamped Firebase records only. Missing evidence remains missing.
 */
(function () {
  "use strict";
  const REPORT_VERSION = "1.0";
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const num = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null;
  const timeMs = (v) => {
    if (v === null || v === undefined || v === "") return null;
    let n;
    if (typeof v === "number") n = v;
    else if (/^\d{10,13}$/.test(String(v).trim())) n = Number(v);
    else n = Date.parse(v);
    if (!Number.isFinite(n)) return null;
    return n < 1000000000000 ? n * 1000 : n;
  };
  const fmt = (t) => t == null ? "Not recorded" : new Date(t).toLocaleString();
  const fmtTemp = (v) => v == null ? "—" : Number(v).toFixed(2) + " °C";
  const isoNow = () => new Date().toISOString();
  let app = null, db = null, activeShipment = null, lastReport = null;
  let observer = null;

  function getDb() {
    try {
      if (window.coldGuardApp && window.coldGuardApp.dbService && window.coldGuardApp.dbService.db) return window.coldGuardApp.dbService.db;
      if (window.firebase && window.firebase.apps && window.firebase.apps.length) {
        const url = "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app";
        return window.firebase.app().database(url);
      }
    } catch (e) { console.warn("ColdGuard quality module: Firebase not ready", e); }
    return null;
  }
  function currentUser() {
    return window.coldGuardApp && window.coldGuardApp.currentUser || (window.firebase && window.firebase.auth ? window.firebase.auth().currentUser : null);
  }
  function uid() { const u = currentUser(); return u && u.uid || ""; }
  function safeRecordArray(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "object") return Object.keys(raw).map((k) => {
      const v = raw[k];
      return v && typeof v === "object" ? Object.assign({ _recordKey: k }, v) : null;
    }).filter(Boolean);
    return [];
  }
  function temperatureOf(r) {
    return num(r.temperature ?? r.tempC ?? r.temp_c ?? r.temperatureC ?? r.temperature_c ?? r.currentTemperature ?? r.value);
  }
  function timestampOf(r) {
    return timeMs(r.timestamp ?? r.timestampMs ?? r.timestamp_ms ?? r.recordedAt ?? r.recorded_at ?? r.createdAt ?? r.created_at ?? r.time ?? r.ts ?? r.dateTime ?? r.datetime ?? r._recordKey);
  }
  function normalizeReadings(records, source) {
    return safeRecordArray(records).map((r) => ({
      timestamp: timestampOf(r),
      temperature: temperatureOf(r),
      source: source,
      raw: r
    })).sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }
  async function readPath(path) {
    if (!db) return null;
    try { const s = await db.ref(path).once("value"); return s.exists() ? s.val() : null; }
    catch (e) { console.warn("Quality report could not read " + path, e.message || e); return null; }
  }
  async function fetchEvidence(shipment) {
    db = getDb();
    if (!db) throw new Error("Firebase Realtime Database is not initialized.");
    const id = String(shipment.id || shipment.shipmentId || "");
    const device = String(shipment.sensorDeviceId || shipment.deviceId || shipment.sensorId || shipment.assignedSensorId || "");
    const paths = [
      ["shipments/" + id + "/telemetry/history", "shipment telemetry/history"],
      ["shipments/" + id + "/telemetry/readings", "shipment telemetry/readings"],
      ["shipments/" + id + "/telemetry/sensorReadings", "shipment telemetry/sensorReadings"],
      ["shipments/" + id + "/temperature_history", "shipment temperature_history"],
      ["shipments/" + id + "/sensor_readings", "shipment sensor_readings"],
      ["sensor_readings/" + id, "sensor_readings/shipmentId"],
      ["telemetry/" + id + "/readings", "telemetry/shipmentId/readings"],
      ["gps_history/" + id, "gps_history/shipmentId"],
      ["shipments/" + id + "/gps_history", "shipment gps_history"],
      ["shipments/" + id + "/location_history", "shipment location_history"]
    ];
    if (device) {
      paths.push(["sensor_readings/" + device, "sensor_readings/deviceId"]);
      paths.push(["devices/" + device + "/readings", "devices/deviceId/readings"]);
      paths.push(["telemetry/" + device + "/readings", "telemetry/deviceId/readings"]);
      paths.push(["gps_history/" + device, "gps_history/deviceId"]);
    }
    const values = await Promise.all(paths.map(async (p) => ({ path: p[0], label: p[1], value: await readPath(p[0]) })));
    const readings = [];
    const gps = [];
    const sourcePaths = [];
    values.forEach((entry) => {
      if (!entry.value) return;
      const isGps = entry.label.indexOf("gps_history") >= 0 || entry.label.indexOf("location_history") >= 0;
      if (isGps) {
        const arr = safeRecordArray(entry.value);
        const valid = arr.map((r) => ({
          timestamp: timestampOf(r) || timeMs(r.lastUpdated || r.last_updated),
          lat: num(r.latitude ?? r.lat ?? r.gpsLatitude),
          lng: num(r.longitude ?? r.lng ?? r.lon ?? r.gpsLongitude),
          raw: r, source: entry.label
        })).filter((p) => p.timestamp !== null && p.lat !== null && p.lng !== null && p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180);
        if (valid.length) { gps.push.apply(gps, valid); sourcePaths.push(entry.label); }
      } else {
        const parsed = normalizeReadings(entry.value, entry.label);
        if (parsed.length) { readings.push.apply(readings, parsed); sourcePaths.push(entry.label); }
      }
    });
    // A timestamped live reading is valid evidence, but never use untimestamped summary values.
    const live = shipment.telemetry && shipment.telemetry.live;
    if (live && temperatureOf(live) !== null && timestampOf(live) !== null) {
      readings.push({ timestamp: timestampOf(live), temperature: temperatureOf(live), source: "shipments/" + id + "/telemetry/live", raw: live });
      sourcePaths.push("shipments/" + id + "/telemetry/live");
    }
    const uniqueReadings = new Map();
    readings.forEach((r) => uniqueReadings.set(String(r.timestamp) + "|" + String(r.temperature), r));
    const uniqueGps = new Map();
    gps.forEach((p) => uniqueGps.set(String(p.timestamp) + "|" + p.lat + "|" + p.lng, p));
    return {
      readings: Array.from(uniqueReadings.values()).sort((a,b) => a.timestamp-b.timestamp),
      gps: Array.from(uniqueGps.values()).sort((a,b) => a.timestamp-b.timestamp),
      sourcePaths: Array.from(new Set(sourcePaths)),
      checkedPaths: paths.map((p) => p[0]),
      fetchedAt: Date.now()
    };
  }

  function median(values) {
    const a = values.filter((v) => Number.isFinite(v) && v > 0).sort((x,y) => x-y);
    if (!a.length) return null;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m-1] + a[m]) / 2;
  }
  function analyze(shipment, evidence) {
    const min = num(shipment.minAllowedTemperature ?? shipment.minTemp ?? shipment.storageTemperatureMin);
    const max = num(shipment.maxAllowedTemperature ?? shipment.maxTemp ?? shipment.storageTemperatureMax);
    const invalidReadings = evidence.readings.filter((r) => r.timestamp === null || r.temperature === null).length;
    const readings = evidence.readings.filter((r) => r.timestamp !== null && r.temperature !== null).sort((a,b) => a.timestamp-b.timestamp);
    const intervals = [];
    for (let i=1;i<readings.length;i++) intervals.push((readings[i].timestamp-readings[i-1].timestamp)/1000);
    const medianIntervalSec = intervals.length >= 2 ? median(intervals) : null;
    const expectedIntervalMs = medianIntervalSec && medianIntervalSec <= 86400 ? medianIntervalSec*1000 : null;
    const gaps = [];
    if (expectedIntervalMs) {
      for (let i=1;i<readings.length;i++) {
        const delta = readings[i].timestamp-readings[i-1].timestamp;
        if (delta > Math.max(expectedIntervalMs*2.5, 60000)) gaps.push({ start: readings[i-1].timestamp, end: readings[i].timestamp, durationMs: delta, reason: "No timestamped reading observed between samples" });
      }
    } else if (readings.length < 2) {
      gaps.push({ start: readings[0] ? readings[0].timestamp : null, end: null, durationMs: null, reason: "Insufficient timestamped samples to estimate sampling cadence" });
    }
    const first = readings[0] ? readings[0].timestamp : null;
    const last = readings.length ? readings[readings.length-1].timestamp : null;
    const hours = [];
    if (first !== null && last !== null) {
      const start = Math.floor(first / 3600000) * 3600000;
      for (let h=start;h<=last;h+=3600000) {
        const end=h+3600000, arr=readings.filter((r)=>r.timestamp>=h && r.timestamp<end);
        const temps=arr.map((r)=>r.temperature);
        const spanStart=Math.max(h, first), spanEnd=Math.min(end, last);
        let coverage=null;
        if (expectedIntervalMs && arr.length) {
          const expected=Math.max(1, Math.ceil((spanEnd-spanStart)/expectedIntervalMs)+1);
          coverage=Math.min(100, arr.length/expected*100);
        }
        const out=arr.filter((r)=>min!==null&&r.temperature<min || max!==null&&r.temperature>max);
        hours.push({
          start:h,end,readings:arr, count:arr.length,
          avg:temps.length?temps.reduce((s,v)=>s+v,0)/temps.length:null,
          min:temps.length?Math.min.apply(null,temps):null,
          max:temps.length?Math.max.apply(null,temps):null,
          first:arr.length?arr[0].temperature:null,last:arr.length?arr[arr.length-1].temperature:null,
          outCount:out.length,coverage,complete:spanStart===h&&spanEnd===end
        });
      }
    }
    const outOfRange = readings.filter((r) => (min!==null && r.temperature<min)||(max!==null && r.temperature>max));
    const excursions=[];
    let current=null;
    readings.forEach((r,i)=>{
      const side=min!==null&&r.temperature<min?"below":max!==null&&r.temperature>max?"above":null;
      if (side) {
        if (!current || current.side!==side || (expectedIntervalMs && r.timestamp-current.lastTimestamp>Math.max(expectedIntervalMs*2.5,60000))) {
          if (current) excursions.push(current);
          current={side,start:r.timestamp,end:r.timestamp,lastTimestamp:r.timestamp,count:1,min:r.temperature,max:r.temperature,uncertain:false};
        } else {
          current.end=r.timestamp; current.lastTimestamp=r.timestamp; current.count++;
          current.min=Math.min(current.min,r.temperature); current.max=Math.max(current.max,r.temperature);
        }
      } else if (current) {
        excursions.push(current); current=null;
      }
    });
    if(current) excursions.push(current);
    excursions.forEach((e)=>{
      const hasGap=gaps.some((g)=>g.start!==null&&g.end!==null&&g.start<=e.end&&g.end>=e.start);
      e.uncertain=hasGap || !expectedIntervalMs;
      e.durationMs=expectedIntervalMs && e.count>1 ? e.end-e.start+expectedIntervalMs : null;
    });
    const validRange=min!==null&&max!==null&&min<max;
    let status="Incomplete Evidence", explanation="Timestamped sensor evidence is insufficient to establish shipment conditions.";
    if (validRange && readings.length && outOfRange.length) {
      status="Excursion Detected";
      explanation="One or more timestamped readings were outside the configured product limits. Qualified review is required.";
    } else if (validRange && readings.length >= 3 && expectedIntervalMs && outOfRange.length===0 && gaps.length===0) {
      status="Within Recorded Limits";
      explanation="All available valid timestamped readings were within the configured limits. This is not a product release decision.";
    } else if (outOfRange.length || gaps.length || !validRange || readings.length<2) {
      status="Review Required";
      explanation="Excursions, missing data, too few samples, or missing/invalid product limits prevent a complete assessment.";
    }
    const durationOutsideMs=excursions.every((e)=>e.durationMs!==null&&!e.uncertain)
      ? excursions.reduce((s,e)=>s+e.durationMs,0) : null;
    const temperatures=readings.map((r)=>r.temperature);
    return {
      min,max,validRange,readings,invalidReadings,hours,gaps,excursions,outOfRange,
      minRecorded:temperatures.length?Math.min.apply(null,temperatures):null,
      maxRecorded:temperatures.length?Math.max.apply(null,temperatures):null,
      medianIntervalSec,expectedIntervalMs,first,last,
      coverage: readings.length && expectedIntervalMs && first!==null && last!==null
        ? Math.min(100, readings.length / Math.max(1, Math.ceil((last-first)/expectedIntervalMs)+1)*100) : null,
      status,explanation,durationOutsideMs
    };
  }

  function gpsAnalysis(points) {
    const gaps=[], times=points.map((p)=>p.timestamp);
    const deltas=[]; for(let i=1;i<times.length;i++) deltas.push((times[i]-times[i-1])/1000);
    const cadence=deltas.length >= 2 ? median(deltas) : null;
    if(cadence) for(let i=1;i<points.length;i++) if(points[i].timestamp-points[i-1].timestamp>Math.max(cadence*2.5*1000,120000)) gaps.push({start:points[i-1].timestamp,end:points[i].timestamp,durationMs:points[i].timestamp-points[i-1].timestamp});
    let distanceKm=null;
    // Straight-line GPS displacement is deliberately not labelled road distance.
    if(points.length>1) {
      distanceKm=0;
      for(let i=1;i<points.length;i++) {
        const rad=x=>x*Math.PI/180, a=points[i-1], b=points[i];
        const dlat=rad(b.lat-a.lat),dlon=rad(b.lng-a.lng);
        const x=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;
        distanceKm+=6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
      }
    }
    const weatherRecords=points.map((p)=>p.raw&&(p.raw.weather||p.raw.weatherConditions||p.raw.weather_condition)).filter(Boolean);
    return {points,gaps,first:points[0]||null,last:points[points.length-1]||null,durationMs:points.length>1?points[points.length-1].timestamp-points[0].timestamp:null,straightLineKm:distanceKm,cadenceSec:cadence,weatherRecords};
  }
  function assessmentHtml(a) {
    const tone = a.status==="Within Recorded Limits"?"emerald":a.status==="Excursion Detected"?"red":a.status==="Review Required"?"amber":"slate";
    return '<span class="inline-flex rounded-full px-3 py-1 text-xs font-bold bg-'+tone+'-100 text-'+tone+'-800">'+esc(a.status)+'</span>';
  }
  function inputField(label,id,type,required,placeholder,value,extra) {
    return '<label class="block text-xs font-semibold text-slate-600">'+esc(label)+(required?' <span class="text-red-500">*</span>':'')+
      '<input id="'+id+'" name="'+id+'" type="'+(type||"text")+'" '+(required?'required':'')+' '+(extra||'')+' placeholder="'+esc(placeholder||"")+'" value="'+esc(value||"")+'" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"></label>';
  }
  function render(container) {
    app=window.coldGuardApp; db=getDb();
    if(!container) container=$("main-content-view");
    if(!container) return;
    const user=currentUser();
    container.innerHTML =
      '<div class="space-y-6 animate-fade-in">'+
        '<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">'+
          '<div><div class="text-xs font-bold uppercase tracking-widest text-blue-600">ColdGuard · Evidence-based reporting</div><h1 class="mt-1 text-2xl font-extrabold text-slate-900">Shipment Quality Assessment</h1><p class="mt-1 text-sm text-slate-500">Analyze timestamped sensor evidence and preserve versioned reports.</p></div>'+
          '<button id="cgq-refresh" class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700">Refresh shipment list</button>'+
        '</div>'+
        '<div id="cgq-notice" class="hidden rounded-xl border p-3 text-sm"></div>'+
        '<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">'+
          '<div class="mb-4"><h2 class="text-base font-bold text-slate-900">Register a shipment</h2><p class="text-xs text-slate-500 mt-1">Set product-specific limits from approved product/manufacturer guidance.</p></div>'+
          '<form id="cgq-registration" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">'+
            inputField("Shipment ID (auto-generated)","cgq-id","text",false,"Generated on save","", "readonly")+
            inputField("Product name","cgq-product","text",true,"Product / medicine name")+
            inputField("Vaccine name (if applicable)","cgq-vaccine","text",false,"Vaccine name, if applicable")+
            '<label class="block text-xs font-semibold text-slate-600">Product category <span class="text-red-500">*</span><select id="cgq-category" required class="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Select category</option><option>Vaccine</option><option>Biologic</option><option>Pharmaceutical</option><option>Food</option><option>Diagnostic reagent</option><option>Other temperature-sensitive product</option></select></label>'+
            inputField("Batch / lot number","cgq-batch","text",true,"Batch or lot identifier")+
            inputField("Manufacturer","cgq-manufacturer","text",false,"Manufacturer name")+
            inputField("Expiry date","cgq-expiry","date",false,"")+
            inputField("Quantity","cgq-quantity","number",true,"Number of units","","min=\"1\" step=\"1\"")+
            inputField("Packaging details","cgq-packaging","text",true,"Container, insulated box, etc.")+
            inputField("Minimum storage temperature (°C)","cgq-min","number",true,"Product-specific minimum","","step=\"any\"")+
            inputField("Maximum storage temperature (°C)","cgq-max","number",true,"Product-specific maximum","","step=\"any\"")+
            inputField("Shipment start","cgq-start","datetime-local",true,"")+
            inputField("Expected delivery","cgq-expected","datetime-local",false,"")+
            inputField("Origin","cgq-origin","text",true,"Starting location")+
            inputField("Destination","cgq-destination","text",true,"Delivery location")+
            inputField("Driver name","cgq-driver","text",true,"Driver full name",user&&user.displayName||"")+
            inputField("Driver contact","cgq-contact","tel",true,"Phone number")+
            inputField("Vehicle registration","cgq-vehicle","text",true,"e.g. MH 31 AB 1234")+
            inputField("Sensor / device ID","cgq-device","text",true,"Assigned physical sensor ID")+
            '<label class="block text-xs font-semibold text-slate-600 md:col-span-2">Notes (optional)<textarea id="cgq-notes" rows="2" class="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Handling notes or approved product guidance reference"></textarea></label>'+
            '<label class="block text-xs font-semibold text-slate-600">Supporting documents (optional)<input id="cgq-docs" type="file" multiple class="mt-1.5 block w-full text-xs text-slate-600" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"></label>'+
            '<div class="md:col-span-2 xl:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100"><p class="text-[11px] text-slate-500">No sensor values or GPS points are generated by this form.</p><button id="cgq-save" type="submit" class="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700">Save shipment to Firebase</button></div>'+
          '</form>'+
        '</section>'+
        '<section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center justify-between gap-3 mb-4"><div><h2 class="text-base font-bold text-slate-900">Shipment quality reports</h2><p class="text-xs text-slate-500 mt-1">Live Firebase records; unavailable evidence is labelled as missing.</p></div><span id="cgq-count" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Loading…</span></div><div id="cgq-list" class="space-y-3"><p class="text-sm text-slate-500">Loading shipments from Firebase…</p></div></section>'+
      '</div>';
    $("cgq-registration").addEventListener("submit", saveShipment);
    $("cgq-refresh").onclick=loadShipments;
    loadShipments();
  }
  function showNotice(message, tone) {
    const el=$("cgq-notice"); if(!el)return;
    const colors=tone==="error"?"border-red-200 bg-red-50 text-red-800":tone==="success"?"border-emerald-200 bg-emerald-50 text-emerald-800":"border-amber-200 bg-amber-50 text-amber-900";
    el.className="rounded-xl border p-3 text-sm "+colors; el.textContent=message;
  }
  async function saveShipment(event) {
    event.preventDefault();
    db=getDb(); const user=currentUser();
    if(!db || !user || !user.uid) { showNotice("Sign in with Firebase before saving a shipment.", "error"); return; }
    const val=(id)=>$(id).value.trim();
    const min=Number(val("cgq-min")), max=Number(val("cgq-max")), qty=Number(val("cgq-quantity"));
    if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max) { showNotice("Temperature limits must be valid numbers and the minimum must be below the maximum.", "error"); return; }
    if(!Number.isInteger(qty)||qty<1) { showNotice("Quantity must be a positive whole number.", "error"); return; }
    const start=Date.parse(val("cgq-start"));
    if(!Number.isFinite(start)) { showNotice("Provide a valid shipment start date and time.", "error"); return; }
    const expected=val("cgq-expected")?Date.parse(val("cgq-expected")):null;
    if(expected!==null && (!Number.isFinite(expected)||expected<start)) { showNotice("Expected delivery must be later than the shipment start.", "error"); return; }
    const id="CG-"+new Date().toISOString().slice(0,10).replace(/-/g,"")+"-"+Math.random().toString(36).slice(2,8).toUpperCase();
    const docs=[];
    const files=$("cgq-docs").files;
    try {
      $("cgq-save").disabled=true; $("cgq-save").textContent="Saving…";
      if(files.length) {
        if(!window.firebase.storage) throw new Error("Supporting document storage SDK is unavailable. Clear the files or enable Firebase Storage.");
        const storage=window.firebase.storage();
        for(let i=0;i<files.length;i++) {
          const f=files[i];
          if(f.size>10*1024*1024) throw new Error("Each supporting document must be 10 MB or smaller.");
          const ref=storage.ref("shipment-documents/"+id+"/"+Date.now()+"-"+f.name.replace(/[^a-zA-Z0-9._-]/g,"_"));
          const snap=await ref.put(f);
          docs.push({name:f.name,url:await snap.ref.getDownloadURL(),contentType:f.type||"application/octet-stream",size:f.size});
        }
      }
      const record={
        id, shipmentId:id, productName:val("cgq-product"), vaccineName:val("cgq-vaccine")||null,
        productCategory:val("cgq-category"), batchLotNumber:val("cgq-batch"), manufacturer:val("cgq-manufacturer")||null,
        expiryDate:val("cgq-expiry")||null, quantity:qty, packagingDetails:val("cgq-packaging"),
        minAllowedTemperature:min,maxAllowedTemperature:max,storageTemperatureMin:min,storageTemperatureMax:max,
        startTime:new Date(start).toISOString(),expectedDeliveryTime:expected?new Date(expected).toISOString():null,
        origin:val("cgq-origin"),destination:val("cgq-destination"),driverName:val("cgq-driver"),driverContact:val("cgq-contact"),
        vehicleRegistration:val("cgq-vehicle"),sensorDeviceId:val("cgq-device"),notes:val("cgq-notes")||null,
        supportingDocuments:docs, assignedDriverUid:user.uid, createdByUid:user.uid, createdByEmail:user.email||null,
        createdAt:isoNow(), status:"Registered", qualityReportVersion:REPORT_VERSION
      };
      await db.ref("shipments/"+id).set(record);
      $("cgq-registration").reset();
      $("cgq-id").value=id;
      showNotice("Shipment "+id+" saved to Firebase. Sensor and GPS history will appear when the assigned device records timestamped data.", "success");
      await loadShipments();
    } catch(e) { showNotice("Could not save shipment: "+(e.message||e), "error"); }
    finally { const b=$("cgq-save"); if(b){b.disabled=false;b.textContent="Save shipment to Firebase";} }
  }
  async function loadShipments() {
    const list=$("cgq-list"); if(!list)return;
    db=getDb(); const user=currentUser();
    if(!db || !user) { list.innerHTML='<p class="text-sm text-amber-700">Sign in and connect Firebase to view assigned shipments.</p>'; $("cgq-count").textContent="Unavailable"; return; }
    list.innerHTML='<p class="text-sm text-slate-500">Loading Firebase shipments…</p>';
    try {
      const snap=await db.ref("shipments").once("value");
      const raw=snap.exists()?snap.val():{};
      const rows=Object.entries(raw||{}).map(([id,s])=>Object.assign({id},s||{}))
        .filter((s)=>s.assignedDriverUid===user.uid || s.createdByUid===user.uid || (s.driverUid===user.uid));
      $("cgq-count").textContent=rows.length+" assigned";
      if(!rows.length) { list.innerHTML='<div class="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No shipments assigned to this account yet. Register a shipment above, or ask an administrator to assign an existing shipment.</div>'; return; }
      list.innerHTML=rows.sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||""))).map((s)=>{
        const name=s.productName||s.vaccineName||s.id;
        const range=(num(s.minAllowedTemperature??s.minTemp)!==null&&num(s.maxAllowedTemperature??s.maxTemp)!==null)?(num(s.minAllowedTemperature??s.minTemp)+" to "+num(s.maxAllowedTemperature??s.maxTemp)+" °C"):"Storage range not configured";
        return '<article class="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><strong class="text-sm text-slate-900">'+esc(s.id)+'</strong><span class="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">'+esc(s.status||"Registered")+'</span></div><p class="mt-1 text-sm font-semibold text-slate-700">'+esc(name)+'</p><p class="mt-1 text-xs text-slate-500">'+esc(s.origin||"Origin not recorded")+' → '+esc(s.destination||"Destination not recorded")+' · '+esc(range)+'</p><p class="mt-1 text-[11px] text-slate-400">Device: '+esc(s.sensorDeviceId||s.deviceId||"Not assigned")+'</p></div><div class="flex flex-wrap gap-2"><button data-cgq-assess="'+esc(s.id)+'" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Assess quality</button><button data-cgq-pdf="'+esc(s.id)+'" class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">Generate PDF</button></div></article>';
      }).join("");
      list.querySelectorAll("[data-cgq-assess]").forEach((b)=>b.onclick=()=>openAssessment(rows.find((s)=>s.id===b.dataset.cgqAssess)));
      list.querySelectorAll("[data-cgq-pdf]").forEach((b)=>b.onclick=()=>generateReport(rows.find((s)=>s.id===b.dataset.cgqPdf)));
    } catch(e) { list.innerHTML='<p class="text-sm text-red-700">Could not read shipments: '+esc(e.message||e)+'</p>'; }
  }
  function openAssessment(shipment) {
    if(!shipment)return;
    activeShipment=shipment;
    const container=$("main-content-view");
    container.innerHTML='<div class="space-y-4"><button id="cgq-back" class="text-sm font-semibold text-blue-600">← Back to quality reports</button><div id="cgq-assessment-body" class="rounded-2xl border border-slate-200 bg-white p-5"><p class="text-sm text-slate-500">Reading timestamped Firebase sensor and GPS records…</p></div></div>';
    $("cgq-back").onclick=()=>render(container);
    buildAssessment(shipment).then((data)=> {
      if(!$("cgq-assessment-body"))return;
      lastReport=data;
      $("cgq-assessment-body").innerHTML=assessmentViewHtml(data);
      $("cgq-generate-detail-pdf").onclick=()=>generateReport(shipment,data);
    }).catch((e)=> { if($("cgq-assessment-body"))$("cgq-assessment-body").innerHTML='<p class="text-sm text-red-700">'+esc(e.message||e)+'</p>'; });
  }
  async function buildAssessment(shipment) {
    const evidence=await fetchEvidence(shipment);
    const temp=analyze(shipment,evidence);
    const gps=gpsAnalysis(evidence.gps);
    return {shipment,evidence,temp,gps,generatedAt:isoNow(),reportId:"QAR-"+Date.now().toString(36).toUpperCase(),version:REPORT_VERSION};
  }
  function assessmentViewHtml(data) {
    const t=data.temp,g=data.gps,s=data.shipment;
    return '<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3"><div><div class="text-xs font-bold uppercase tracking-widest text-blue-600">Quality evidence report</div><h2 class="mt-1 text-xl font-extrabold text-slate-900">'+esc(s.id)+'</h2><p class="mt-1 text-sm text-slate-500">'+esc(s.productName||s.vaccineName||"Temperature-sensitive product")+' · '+esc(s.batchLotNumber||s.batchNumber||"Batch not recorded")+'</p></div>'+assessmentHtml(t)+'</div>'+
    '<p class="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">'+esc(t.explanation)+'</p>'+
    '<div class="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">'+metric("Valid readings",t.readings.length)+metric("Out-of-range",t.outOfRange.length)+metric("Data coverage",t.coverage===null?"Not estimable":t.coverage.toFixed(1)+"%")+metric("GPS points",g.points.length)+'</div>'+
    '<div class="mt-6"><h3 class="font-bold text-sm text-slate-900">Hour-wise temperature analysis</h3><div class="mt-3 overflow-x-auto"><table class="w-full min-w-[780px] text-xs"><thead class="bg-slate-50 text-left text-slate-500"><tr><th class="p-2">Hour (local)</th><th class="p-2">Valid</th><th class="p-2">Average</th><th class="p-2">Min / max</th><th class="p-2">Out of range</th><th class="p-2">Coverage</th></tr></thead><tbody>'+t.hours.map((h)=>'<tr class="border-t border-slate-100"><td class="p-2">'+esc(new Date(h.start).toLocaleString())+(h.complete?"":' <span class="text-amber-700">(partial)</span>')+'</td><td class="p-2">'+h.count+'</td><td class="p-2">'+esc(fmtTemp(h.avg))+'</td><td class="p-2">'+esc(fmtTemp(h.min))+' / '+esc(fmtTemp(h.max))+'</td><td class="p-2 '+(h.outCount?'text-red-700 font-bold':'')+'">'+h.outCount+'</td><td class="p-2">'+(h.coverage===null?"Not estimable":h.coverage.toFixed(1)+"%")+'</td></tr>').join("")+'</tbody></table></div></div>'+
    '<div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="rounded-xl border border-slate-200 p-4"><h3 class="text-sm font-bold">Excursion events</h3>'+(t.excursions.length?t.excursions.map((e)=>'<div class="mt-3 border-l-2 border-red-400 pl-3 text-xs"><strong class="text-red-700">'+esc(e.side==="below"?"Below minimum":"Above maximum")+'</strong><p class="mt-1">'+esc(fmt(e.start))+' → '+esc(fmt(e.end))+'</p><p>'+e.count+' readings · '+(e.durationMs!==null&&!e.uncertain?Math.round(e.durationMs/60000)+" min supported estimate":"Duration uncertain / not estimable")+'</p></div>').join(""):'<p class="mt-2 text-xs text-slate-500">No out-of-range readings in the available timestamped records.</p>')+'</div><div class="rounded-xl border border-slate-200 p-4"><h3 class="text-sm font-bold">GPS and data gaps</h3><p class="mt-2 text-xs text-slate-600">Recorded GPS points: '+g.points.length+' · GPS gaps inferred: '+g.gaps.length+'</p><p class="mt-1 text-xs text-slate-600">First fix: '+esc(g.first?fmt(g.first.timestamp):"Not recorded")+'</p><p class="mt-1 text-xs text-slate-600">Last fix: '+esc(g.last?fmt(g.last.timestamp):"Not recorded")+'</p><p class="mt-1 text-xs text-slate-600">GPS distance: '+(g.straightLineKm===null?"Not available":g.straightLineKm.toFixed(2)+" km straight-line only; not road distance")+'</p><p class="mt-3 text-xs text-amber-800">Missing data is not proof of a temperature excursion or of safe conditions.</p></div></div>'+
    '<div class="mt-6 flex flex-wrap gap-2"><button id="cgq-generate-detail-pdf" class="rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white">Generate Shipment Quality PDF</button></div>'+
    '<p class="mt-4 text-[11px] text-slate-400">Source paths: '+esc(data.evidence.sourcePaths.join(", ")||"No timestamped sensor history found")+'. Assessment is evidence summary only; release/rejection requires authorized quality personnel.</p>';
  }
  function metric(label,value) { return '<div class="rounded-xl border border-slate-200 bg-slate-50 p-3"><div class="text-[10px] font-bold uppercase tracking-wider text-slate-500">'+esc(label)+'</div><div class="mt-1 text-lg font-extrabold text-slate-900">'+esc(value)+'</div></div>'; }

  function drawTempChart(doc, data, x, y, w, h) {
    const vals=data.temp.hours.filter((r)=>r.avg!==null);
    doc.setDrawColor(220,228,238);doc.rect(x,y,w,h);
    if(!vals.length){doc.setFontSize(9);doc.text("No timestamped temperature history available.",x+5,y+12);return;}
    const all=[]; vals.forEach((r)=>{all.push(r.min,r.max);});
    let lo=Math.min.apply(null,all), hi=Math.max.apply(null,all);
    if(lo===hi){lo-=1;hi+=1;} const pad=18, pw=w-pad*2, ph=h-28;
    doc.setDrawColor(225,232,240);doc.line(x+pad,y+ph+4,x+w-pad,y+ph+4);
    doc.setFontSize(7);doc.text(hi.toFixed(1)+"°C",x+2,y+8);doc.text(lo.toFixed(1)+"°C",x+2,y+ph+4);
    const px=i=>x+pad+(vals.length===1?pw/2:i*pw/(vals.length-1));
    const py=v=>y+4+(hi-v)/(hi-lo)*ph;
    if(data.temp.min!==null&&data.temp.max!==null){
      const ymin=py(data.temp.max), ymax=py(data.temp.min);
      doc.setFillColor(219,234,254);doc.rect(x+pad,ymin,pw,Math.max(1,ymax-ymin),"F");
    }
    doc.setDrawColor(37,99,235);doc.setLineWidth(1.1);
    for(let i=1;i<vals.length;i++)doc.line(px(i-1),py(vals[i-1].avg),px(i),py(vals[i].avg));
    doc.setFillColor(37,99,235);
    vals.forEach((r,i)=>doc.circle(px(i),py(r.avg),1.3,"F"));
    doc.setFontSize(6);doc.setTextColor(71,85,105);
    doc.text(new Date(vals[0].start).toLocaleString(),x+pad,y+h-4);
    doc.text(new Date(vals[vals.length-1].start).toLocaleString(),x+w-pad,y+h-4,{align:"right"});
  }
  function drawRoute(doc, data, x, y, w, h) {
    const points=data.gps.points;doc.setDrawColor(220,228,238);doc.rect(x,y,w,h);
    if(!points.length){doc.setFontSize(9);doc.text("No timestamped GPS history found; route map omitted.",x+5,y+12);return;}
    const minLat=Math.min.apply(null,points.map(p=>p.lat)),maxLat=Math.max.apply(null,points.map(p=>p.lat));
    const minLng=Math.min.apply(null,points.map(p=>p.lng)),maxLng=Math.max.apply(null,points.map(p=>p.lng));
    const pad=12,dx=maxLng-minLng||0.01,dy=maxLat-minLat||0.01;
    const xy=p=>({x:x+pad+(p.lng-minLng)/dx*(w-2*pad),y:y+h-pad-(p.lat-minLat)/dy*(h-2*pad)});
    doc.setDrawColor(37,99,235);doc.setLineWidth(1.4);
    for(let i=1;i<points.length;i++){const a=xy(points[i-1]),b=xy(points[i]);doc.line(a.x,a.y,b.x,b.y);}
    const first=xy(points[0]),last=xy(points[points.length-1]);
    doc.setFillColor(16,185,129);doc.circle(first.x,first.y,2.5,"F");
    doc.setFillColor(239,68,68);doc.circle(last.x,last.y,2.5,"F");
    doc.setFontSize(7);doc.setTextColor(71,85,105);doc.text("Green = first recorded fix; red = last recorded fix",x+4,y+h-3);
  }
  function addPageHeading(doc,title,subtitle) {
    doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(15,23,42);doc.text(title,14,18);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(100,116,139);doc.text(subtitle||"ColdGuard Shipment Quality Report",14,24);
    doc.setDrawColor(37,99,235);doc.line(14,28,196,28);
  }
  function line(doc,label,value,y) {
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(71,85,105);doc.text(label,14,y);
    doc.setFont("helvetica","normal");doc.setTextColor(15,23,42);
    const v=String(value==null||value===""?"Not recorded":value);
    const wrapped=doc.splitTextToSize(v,125);doc.text(wrapped,67,y);return y+Math.max(6,wrapped.length*4.5);
  }
  function generatePdf(data) {
    if(!window.jspdf||!window.jspdf.jsPDF) throw new Error("PDF library did not load. Refresh and try again.");
    const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
    const s=data.shipment,t=data.temp,g=data.gps;
    let y=38;
    addPageHeading(doc,"ColdGuard | Shipment Summary","Report "+data.reportId+" · Version "+data.version);
    doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(37,99,235);doc.text("SHIPMENT QUALITY ASSESSMENT",14,34);
    y=line(doc,"Shipment ID",s.id,y);y=line(doc,"Product / vaccine",s.productName||s.vaccineName,y);y=line(doc,"Batch / lot",s.batchLotNumber||s.batchNumber,y);
    y=line(doc,"Manufacturer",s.manufacturer,y);y=line(doc,"Expiry date",s.expiryDate,y);y=line(doc,"Quantity / packaging",String(s.quantity||"Not recorded")+" / "+(s.packagingDetails||s.packaging||"Not recorded"),y);
    y=line(doc,"Driver / contact",(s.driverName||"Not recorded")+" / "+(s.driverContact||"Not recorded"),y);y=line(doc,"Vehicle",s.vehicleRegistration,y);
    y=line(doc,"Sensor / device",s.sensorDeviceId||s.deviceId||s.sensorId,y);y=line(doc,"Origin → destination",(s.origin||"Not recorded")+" → "+(s.destination||"Not recorded"),y);
    y=line(doc,"Shipment start",fmt(timeMs(s.startTime||s.startDateTime)),y);y=line(doc,"Expected delivery",fmt(timeMs(s.expectedDeliveryTime)),y);
    y=line(doc,"Storage limits",t.validRange?t.min+"°C to "+t.max+"°C":"Missing or invalid product-specific limits",y);
    y=line(doc,"Assessment status",t.status,y);y+=3;
    doc.setFillColor(248,250,252);doc.roundedRect(14,y,182,23,2,2,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(15,23,42);doc.text("Assessment summary",18,y+6);
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(51,65,85);
    doc.text(doc.splitTextToSize(t.explanation,172),18,y+12);
    doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text("Generated "+fmt(Date.parse(data.generatedAt))+" · Evidence-based summary only; not a product release decision.",14,285);
    doc.setFontSize(8);doc.text("Page 1",196,290,{align:"right"});

    doc.addPage();addPageHeading(doc,"Hour-Wise Temperature Report","All values are calculated from valid timestamped sensor readings.");
    drawTempChart(doc,data,14,34,182,65);
    y=108;doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(15,23,42);
    const cols=[14,48,70,91,112,139,163,196];
    const headers=["Hour (local)","Valid","Average","Minimum","Maximum","Out range","Coverage"];
    doc.setFont("helvetica","bold");headers.forEach((h,i)=>doc.text(h,cols[i]+1,y));y+=4;doc.line(14,y,196,y);y+=5;
    doc.setFont("helvetica","normal");
    const rows=t.hours;
    rows.forEach((h)=>{
      if(y>277){doc.addPage();addPageHeading(doc,"Hour-Wise Temperature Report (continued)","Hourly table continued; repeated column headings.");y=36;doc.setFont("helvetica","bold");headers.forEach((v,i)=>doc.text(v,cols[i]+1,y));y+=6;doc.setFont("helvetica","normal");}
      const cells=[new Date(h.start).toLocaleString(),String(h.count),h.avg===null?"—":h.avg.toFixed(2)+"°",h.min===null?"—":h.min.toFixed(2)+"°",h.max===null?"—":h.max.toFixed(2)+"°",String(h.outCount),h.coverage===null?"N/E":h.coverage.toFixed(0)+"%"];
      cells.forEach((v,i)=>doc.text(doc.splitTextToSize(v,cols[i+1]-cols[i]-2)[0]||"—",cols[i]+1,y));y+=6;doc.setDrawColor(235,239,244);doc.line(14,y-2,196,y-2);
    });
    if(!rows.length){doc.text("No timestamped temperature history was found for this shipment.",14,y+5);}
    doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text("Coverage is estimated only when a sampling interval can be inferred from observed timestamps.",14,285);doc.text("Page "+doc.getNumberOfPages(),196,290,{align:"right"});

    doc.addPage();addPageHeading(doc,"Excursion & Sensor Analysis","Averages do not override excursion severity, duration, or data-quality limitations.");
    y=37;y=line(doc,"Valid temperature readings",t.readings.length,y);y=line(doc,"Out-of-range readings",t.outOfRange.length,y);y=line(doc,"Invalid / unreadable timestamped records",t.invalidReadings,y);
    y=line(doc,"Lowest recorded temperature",fmtTemp(t.minRecorded),y);y=line(doc,"Highest recorded temperature",fmtTemp(t.maxRecorded),y);
    y=line(doc,"Longest observed span",t.excursions.length?(Math.max.apply(null,t.excursions.map(e=>e.end-e.start))/60000).toFixed(1)+" minutes between first and last out-of-range sample":"Not recorded",y);
    y=line(doc,"Sampling interval",t.medianIntervalSec===null?"Not estimable":Math.round(t.medianIntervalSec)+" seconds (median observed)",y);
    y+=3;doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(15,23,42);doc.text("Excursion events",14,y);y+=7;
    if(!t.excursions.length){doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("No out-of-range readings found in available timestamped records.",14,y);y+=7;}
    t.excursions.forEach((e)=>{
      if(y>270){doc.addPage();addPageHeading(doc,"Excursion & Sensor Analysis (continued)","Excursion list continued.");y=36;}
      doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(185,28,28);doc.text(e.side==="below"?"Below minimum":"Above maximum",14,y);
      doc.setFont("helvetica","normal");doc.setTextColor(51,65,85);doc.text(fmt(e.start)+" to "+fmt(e.end),50,y);
      y+=5;doc.text(e.count+" readings · "+(e.durationMs!==null&&!e.uncertain?Math.round(e.durationMs/60000)+" min estimated":"duration uncertain/not estimable"),18,y);y+=7;
    });
    y+=2;doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(15,23,42);doc.text("Missing-data periods / limitations",14,y);y+=6;
    const gaps=t.gaps.slice(0,12);
    if(!gaps.length){doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("No large gaps inferred using the observed sampling cadence. This does not prove uninterrupted sensor operation.",14,y);y+=6;}
    gaps.forEach((gap)=>{if(y>276){doc.addPage();addPageHeading(doc,"Sensor Data Gaps (continued)","Missing-data evidence continued.");y=36;}doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text((gap.start===null?"Unknown start":fmt(gap.start))+" → "+(gap.end===null?"Unknown end":fmt(gap.end))+" · "+(gap.durationMs===null?"duration unknown":Math.round(gap.durationMs/60000)+" min"),14,y);y+=5;});
    doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text("Excursion durations are not estimated across unsupported sampling gaps.",14,285);doc.text("Page "+doc.getNumberOfPages(),196,290,{align:"right"});

    doc.addPage();addPageHeading(doc,"GPS & Transportation Report","Only timestamped GPS fixes are shown; no road distance or weather history is fabricated.");
    drawRoute(doc,data,14,34,182,94);
    y=139;y=line(doc,"Recorded GPS fixes",g.points.length,y);y=line(doc,"First recorded fix",g.first?fmt(g.first.timestamp):"Not recorded",y);y=line(doc,"Last recorded fix",g.last?fmt(g.last.timestamp):"Not recorded",y);
    y=line(doc,"Observed GPS span",g.durationMs===null?"Not estimable":Math.round(g.durationMs/60000)+" minutes",y);
    y=line(doc,"GPS gap periods",g.gaps.length,y);y=line(doc,"GPS path length",g.straightLineKm===null?"Not available":g.straightLineKm.toFixed(2)+" km straight-line approximation; not road distance",y);
    y=line(doc,"Weather history","Not included: no verified historical weather records were found by this module.",y);
    y=line(doc,"Network outage evidence",g.gaps.length?"GPS timestamp gaps are observed; network outage cannot be confirmed from GPS gaps alone.":"No GPS gap inferred from available points; network status not independently verified.",y);
    doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text("Page "+doc.getNumberOfPages(),196,290,{align:"right"});

    doc.addPage();addPageHeading(doc,"Final Quality Assessment","Report is a transparent evidence summary, not a medical safety certificate.");
    y=37;y=line(doc,"Assessment status",t.status,y);y=line(doc,"Reason",t.explanation,y);
    y=line(doc,"Configured limits",t.validRange?t.min+"°C to "+t.max+"°C":"Missing or invalid",y);
    y=line(doc,"Data coverage",t.coverage===null?"Not estimable":t.coverage.toFixed(1)+"%",y);
    y=line(doc,"Source paths",data.evidence.sourcePaths.join(", ")||"No timestamped records found",y);
    y=line(doc,"Sensor/device ID",s.sensorDeviceId||s.deviceId||s.sensorId,y);
    y=line(doc,"Report ID / version",data.reportId+" / "+data.version,y);
    y=line(doc,"Generated at",data.generatedAt,y);
    y+=4;doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(15,23,42);doc.text("Recommended quality review",14,y);y+=6;
    const recommendations=[
      "Verify the configured limits against the applicable manufacturer instructions and product-specific handling guidance.",
      "Review all excursions, uncertainty intervals, calibration status, and sensor disconnections with authorized quality personnel.",
      "Do not release or reject the product solely from average temperature or this automated report.",
      "Document the reviewer decision, signature, and any required corrective action in the approved quality system."
    ];
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(51,65,85);
    recommendations.forEach((r)=>{const wrapped=doc.splitTextToSize("• "+r,175);doc.text(wrapped,17,y);y+=wrapped.length*4.5+2;});
    y+=3;doc.setDrawColor(148,163,184);doc.line(14,y,90,y);doc.line(110,y,196,y);
    doc.setFontSize(7);doc.setTextColor(100,116,139);doc.text("Authorized reviewer signature / date",14,y+5);doc.text("Review decision / reference",110,y+5);
    doc.setFontSize(7);doc.text("Page "+doc.getNumberOfPages(),196,290,{align:"right"});
    return doc;
  }
  async function generateReport(shipment, prebuilt) {
    try {
      if(!shipment) throw new Error("Select a shipment first.");
      const data=prebuilt||await buildAssessment(shipment);
      const doc=generatePdf(data);
      const blob=doc.output("blob");
      const filename="ColdGuard-Quality-"+String(shipment.id).replace(/[^a-zA-Z0-9_-]/g,"_")+"-"+data.reportId+".pdf";
      doc.save(filename);
      let pdfUrl=null;
      if(window.firebase && window.firebase.storage && currentUser()) {
        try {
          const pdfRef=window.firebase.storage().ref("shipment-reports/"+shipment.id+"/"+data.reportId+".pdf");
          const uploaded=await pdfRef.put(blob,{contentType:"application/pdf",customMetadata:{shipmentId:String(shipment.id),reportId:data.reportId,reportVersion:data.version}});
          pdfUrl=await uploaded.ref.getDownloadURL();
        } catch(uploadError) {
          console.warn("PDF file upload failed; retaining evidence snapshot only.",uploadError);
        }
      }
      const historical={
        reportId:data.reportId,version:data.version,generatedAt:data.generatedAt,pdfUrl:pdfUrl,
        shipmentId:String(shipment.id),status:data.temp.status,assessmentExplanation:data.temp.explanation,
        summary:{
          minAllowedTemperature:data.temp.min,maxAllowedTemperature:data.temp.max,
          validReadings:data.temp.readings.length,outOfRangeReadings:data.temp.outOfRange.length,
          dataCoveragePercent:data.temp.coverage,minRecorded:data.temp.minRecorded,maxRecorded:data.temp.maxRecorded,
          gpsPoints:data.gps.points.length,sourcePaths:data.evidence.sourcePaths
        },
        evidenceSnapshot:{
          readings:data.temp.readings.map(r=>({timestamp:r.timestamp,temperature:r.temperature,source:r.source})),
          hours:data.temp.hours.map(h=>({start:h.start,end:h.end,count:h.count,avg:h.avg,min:h.min,max:h.max,outCount:h.outCount,coverage:h.coverage,complete:h.complete})),
          gaps:data.temp.gaps,excursions:data.temp.excursions,
          gps:data.gps.points.map(p=>({timestamp:p.timestamp,lat:p.lat,lng:p.lng,source:p.source})),
          gpsGaps:data.gps.gaps
        },
        pdfStorage:pdfUrl?"PDF stored in Firebase Storage; evidence snapshot stored in Realtime Database.":"PDF download completed locally; evidence snapshot stored in Realtime Database. Storage upload may require Firebase Storage rules/configuration."
      };
      // Keep an immutable per-report evidence snapshot. PDF itself remains downloaded locally
      // to avoid oversized RTDB records and to avoid implying Cloud Storage was configured.
      if(db && currentUser()) {
        try { await db.ref("shipments/"+shipment.id+"/quality_reports/"+data.reportId).set(historical); }
        catch(e) { console.warn("Historical report snapshot could not be saved",e); showNotice("PDF downloaded, but Firebase could not save the report snapshot: "+(e.message||e),"error"); }
      }
      lastReport=data;
    } catch(e) { showNotice("Could not generate report: "+(e.message||e),"error"); }
  }

  function injectDetailsButton() {
    app=window.coldGuardApp;
    if(!app || app.currentView!=="details") return;
    const container=$("main-content-view");
    if(!container || $("cgq-details-pdf"))return;
    const back=$("btn-back-to-shipments");
    if(!back)return;
    const button=document.createElement("button");
    button.id="cgq-details-pdf";button.type="button";button.className="ml-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700";
    button.textContent="Generate Shipment Quality PDF";
    button.onclick=async()=>{
      const id=app.selectedShipmentId;
      db=getDb();
      try{
        const raw=await readPath("shipments/"+id);
        const shipment=raw?Object.assign({id},raw):((app.simulation&&app.simulation.shipments||[]).find(s=>String(s.id)===String(id)));
        if(!shipment) throw new Error("Shipment was not found in Firebase. Save/register it before generating an evidence-based report.");
        await generateReport(shipment);
      }catch(e){alert(e.message||e);}
    };
    back.parentElement.appendChild(button);
  }
  function init() {
    app=window.coldGuardApp;
    if(!app) return;
    db=getDb();
    const nav=document.querySelector("nav");
    if(nav && !$("nav-shipment-quality")) {
      const btn=document.createElement("button");
      btn.id="nav-shipment-quality";btn.type="button";btn.dataset.view="quality";btn.className="nav-link w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition";
      btn.innerHTML='<span class="text-base">📄</span><span>Shipment Quality & Reports</span>';
      btn.onclick=()=>{app.currentView="quality";window.location.hash="quality";app.updateNavActiveState("quality");render($("main-content-view"));};
      nav.appendChild(btn);
    }
    const originalRender=app.renderCurrentView.bind(app);
    app.renderCurrentView=function(){
      if(this.currentView==="quality"){render($("main-content-view"));return;}
      originalRender();
    };
    const originalParse=app.parseHashRoute.bind(app);
    app.parseHashRoute=function(){
      originalParse();
      if(window.location.hash.replace(/^#/,"").split("?")[0]==="quality") this.currentView="quality";
    };
    window.addEventListener("hashchange",()=>{
      if(window.location.hash.replace(/^#/,"").split("?")[0]==="quality") {
        app.currentView="quality";app.updateNavActiveState("quality");render($("main-content-view"));
      }
    });
    observer=new MutationObserver(()=>injectDetailsButton());
    const main=$("main-content-view");if(main)observer.observe(main,{childList:true,subtree:true});
    injectDetailsButton();
    if(window.location.hash.replace(/^#/,"").split("?")[0]==="quality"){app.currentView="quality";render($("main-content-view"));}
  }
  document.addEventListener("DOMContentLoaded",init);
})();
