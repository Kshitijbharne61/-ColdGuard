function parseTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(n)) return null;
  return n < 1e12 ? n * 1000 : n;
}
function lastUpdate(s) {
  return parseTimestamp(s?.telemetry?.live?.timestamp) || parseTimestamp(s?.lastSensorUpdate) ||
    parseTimestamp(s?.location?.lastUpdated) || parseTimestamp(s?.gpsLastUpdated);
}
function temperature(s) {
  const v = s?.telemetry?.live?.temperature ?? s?.currentTemperature ?? s?.temperature;
  return v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);
}
function coordinates(s) {
  const loc = s?.location || {}, live = s?.telemetry?.live || {};
  const lat = Number(loc.latitude ?? live.latitude ?? s?.gpsLatitude);
  const lon = Number(loc.longitude ?? live.longitude ?? s?.gpsLongitude);
  if (loc.hasFix === false || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}
function thresholds() {
  const warningMinutes = Math.max(1, Number(process.env.OFFLINE_WARNING_MINUTES || 2));
  const notifyMinutes = Math.max(warningMinutes, Number(process.env.OFFLINE_NOTIFY_MINUTES || 5));
  const escalateMinutes = Math.max(notifyMinutes, Number(process.env.OFFLINE_ESCALATE_MINUTES || 10));
  return { warningMinutes, notifyMinutes, escalateMinutes };
}
function recipients(c, level, previousLevel = 0) {
  const out = [];
  if (level >= 1 && previousLevel < 1) {
    if (c.driverPhone) out.push({ role: "driver", phone: c.driverPhone });
    if (c.controlRoomPhone || c.agencyPhone) out.push({ role: "control_room", phone: c.controlRoomPhone || c.agencyPhone });
  }
  if (level >= 2 && previousLevel < 2) {
    if (c.emergencyPhone) out.push({ role: "emergency_contact", phone: c.emergencyPhone });
    if (c.agencyPhone && c.controlRoomPhone && c.agencyPhone !== c.controlRoomPhone) out.push({ role: "agency", phone: c.agencyPhone });
    if (previousLevel === 0) {
      if (c.driverPhone) out.push({ role: "driver", phone: c.driverPhone });
      if (c.controlRoomPhone || c.agencyPhone) out.push({ role: "control_room", phone: c.controlRoomPhone || c.agencyPhone });
    }
  }
  return out.filter((v,i,a)=>a.findIndex(x=>x.phone===v.phone)===i);
}
async function sendSms(to, body, cfg) {
  if (!cfg.sid || !cfg.token || (!cfg.from && !cfg.serviceSid)) return { status: "not_configured", error: "SMS provider not configured." };
  if (typeof to !== "string" || !/^\+[1-9]\d{7,14}$/.test(to.trim())) return { status: "skipped", error: "Invalid or missing E.164 recipient." };
  const params = new URLSearchParams({ To: to, Body: body });
  if (cfg.serviceSid) params.set("MessagingServiceSid", cfg.serviceSid); else params.set("From", cfg.from);
  try {
    const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/"+encodeURIComponent(cfg.sid)+"/Messages.json", {
      method: "POST",
      headers: { Authorization: "Basic "+Buffer.from(cfg.sid+":"+cfg.token).toString("base64"), "Content-Type":"application/x-www-form-urlencoded" },
      body: params.toString()
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) return { status:"failed", error:data.message || "SMS provider rejected request.", providerStatus:response.status };
    return { status:"sent", providerMessageId:data.sid || null, providerStatus:data.status || "accepted" };
  } catch (e) { return { status:"failed", error:e.message || "SMS network request failed." }; }
}
function message(id, shipment, last, age, gps, temp, recovered = false) {
  const driver = shipment?.driverName || shipment?.assignedDriver || shipment?.operatorName || "Assigned driver";
  const min = Number(shipment?.minAllowedTemperature ?? shipment?.storageMinTemp ?? shipment?.minTemp);
  const max = Number(shipment?.maxAllowedTemperature ?? shipment?.storageMaxTemp ?? shipment?.maxTemp);
  const range = Number.isFinite(min) && Number.isFinite(max);
  const tempText = temp === null ? "Last temperature unavailable" : "Last temperature "+temp+"°C; "+(range ? (temp>=min&&temp<=max?"within configured range":"outside configured range") : "storage range not configured; status cannot be verified");
  const loc = gps ? gps.latitude.toFixed(5)+", "+gps.longitude.toFixed(5) : "unavailable";
  const map = gps ? "https://maps.google.com/?q="+gps.latitude+","+gps.longitude : "unavailable";
  if (recovered) return "ColdGuard recovery: "+id+" telemetry resumed after about "+Math.round(age)+" minutes. Last known location: "+loc+". Temperature could not be continuously verified during the outage. Check buffered readings and verify cold-chain status.";
  return "ColdGuard Alert: Vehicle "+id+" ("+driver+") has not transmitted sensor data for "+Math.round(age)+" minutes. Last update: "+(last?new Date(last).toISOString():"timestamp unavailable")+". Last location: "+loc+". "+tempText+". Contact the driver and verify vehicle connectivity; dispatch assistance if required. Location: "+map;
}
async function sendEvent(db, id, type, shipment, contact, level, prevLevel, last, age, gps, temp, cfg, range) {
  const body = type === "CRITICAL_TEMPERATURE"
    ? "ColdGuard CRITICAL TEMPERATURE ALERT: Shipment "+id+" last recorded "+temp+"°C, outside configured storage range "+range.min+"°C to "+range.max+"°C. Last update: "+(last?new Date(last).toISOString():"unavailable")+". Last known location: "+(gps?gps.latitude+", "+gps.longitude:"unavailable")+". Verify vehicle and vaccine condition. Map: "+(gps?"https://maps.google.com/?q="+gps.latitude+","+gps.longitude:"unavailable")
    : message(id, shipment, last, age, gps, temp, type==="TELEMETRY_RECOVERED");
  const results = [];
  for (const recipient of recipients(contact, level, prevLevel)) {
    const sent = await sendSms(recipient.phone, body, cfg);
    results.push({ role:recipient.role, status:sent.status, providerMessageId:sent.providerMessageId || null, providerStatus:sent.providerStatus || null, error:sent.error || null });
  }
  const ref = db.ref("network_monitoring/events").push();
  await ref.set({
    eventId:ref.key, shipmentId:id, type, level, createdAt:Date.now(), outageMinutes:Math.round(age || 0),
    lastSensorUpdate:last || null, lastKnownLocation:gps || null, lastTemperature:temp,
    temperatureVerifiedDuringOutage:false, delivery:results,
    status:results.some(x=>x.status==="sent")?"sent_or_partially_sent":"not_delivered",
    acknowledged:false, acknowledgedAt:null, acknowledgedBy:null
  });
  return { eventId:ref.key, results };
}

async function monitorOffline(db, cfg) {
  const [shipmentsSnap, statesSnap, contactsSnap] = await Promise.all([
    db.ref("shipments").once("value"), db.ref("network_monitoring/vehicles").once("value"), db.ref("emergency_contacts").once("value")
  ]);
  const shipments=shipmentsSnap.val()||{}, states=statesSnap.val()||{}, contacts=contactsSnap.val()||{};
  const limit=thresholds(), now=Date.now(), updates={};
  const counts={online:0,unstable:0,offline:0,emergency:0,unknown:0,notifications:0};
  for (const [id,shipment] of Object.entries(shipments)) {
    if(!shipment||typeof shipment!=="object")continue;
    const prev=states[id]||{}, last=lastUpdate(shipment), temp=temperature(shipment), gps=coordinates(shipment);
    const min=Number(shipment.minAllowedTemperature??shipment.storageMinTemp??shipment.minTemp);
    const max=Number(shipment.maxAllowedTemperature??shipment.storageMaxTemp??shipment.maxTemp);
    const hasRange=Number.isFinite(min)&&Number.isFinite(max);
    const tempEmergency=temp!==null&&hasRange&&(temp<min||temp>max);
    const age=last===null?null:Math.max(0,(now-last)/60000);
    let level=0,status="unknown";
    if(age!==null){
      if(age>=limit.escalateMinutes)level=2;else if(age>=limit.notifyMinutes)level=1;
      status=tempEmergency?"emergency":level>0?"offline":age>=limit.warningMinutes?"network_unstable":"online";
    }
    const contact=contacts[id]||contacts.default||{};
    let event=null;
    if(level>Number(prev.alertLevel||0)&&level>0){
      event=await sendEvent(db,id,level===2?"OFFLINE_ESCALATION":"OFFLINE_NOTIFICATION",shipment,contact,level,Number(prev.alertLevel||0),last,age,gps,temp,cfg);
    }else if(age!==null&&age<limit.warningMinutes&&(Number(prev.alertLevel||0)>0||["offline","network_unstable"].includes(prev.status))){
      const outageAge=prev.outageStartedAt?Math.max(0,(now-prev.outageStartedAt)/60000):age;
      event=await sendEvent(db,id,"TELEMETRY_RECOVERED",shipment,contact,1,0,last,outageAge,prev.lastKnownLocation||gps,temp,cfg);
    }
    if(tempEmergency&&!prev.temperatureEmergency&&!event){
      event=await sendEvent(db,id,"CRITICAL_TEMPERATURE",shipment,contact,2,0,last,age,gps,temp,cfg,{min,max});
    }
    const key=status==="network_unstable"?"unstable":status;
    counts[key]=(counts[key]||0)+1;
    if(event)counts.notifications+=event.results.filter(x=>x.status==="sent").length;
    updates["network_monitoring/vehicles/"+id]={
      shipmentId:id,status,alertLevel:level,lastSensorUpdate:last,
      lastKnownLocation:gps||prev.lastKnownLocation||null,lastTemperature:temp===null?(prev.lastTemperature??null):temp,
      outageMinutes:age!==null&&(level>0||status==="network_unstable")?Math.round(age):0,
      outageStartedAt:level>0?(Number(prev.alertLevel||0)>0?(prev.outageStartedAt||last):last):null,
      lastCheckedAt:now,thresholds:limit,temperatureEmergency:tempEmergency,
      temperatureVerifiedDuringOutage:false,lastNotificationAt:event?now:(prev.lastNotificationAt||null),
      lastEventId:event?.eventId||prev.lastEventId||null,
      notificationStatus:event?(event.results.some(x=>x.status==="sent")?"sent_or_partially_sent":"not_delivered"):(prev.notificationStatus||"not_sent"),
      notificationResults:event?.results||prev.notificationResults||[]
    };
  }
  if(Object.keys(updates).length)await db.ref().update(updates);
  return {ok:true,checkedAt:new Date(now).toISOString(),thresholds:limit,counts};
}
module.exports = { monitorOffline };
