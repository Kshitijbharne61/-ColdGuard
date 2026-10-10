"use strict";
const crypto = require("crypto");
const engine = require("./notificationEngine");

const rate = new Map();
function response(res, status, body) { return res.status(status).json(body); }
function tokenFrom(req) {
  const h=req.headers.authorization || "";
  return h.indexOf("Bearer ")===0 ? h.slice(7) : "";
}
function rateLimit(key, limit, windowMs) {
  const now=Date.now(), entry=rate.get(key) || { start:now, count:0 };
  if(now-entry.start>windowMs) { entry.start=now; entry.count=0; }
  entry.count++; rate.set(key,entry);
  return entry.count<=limit;
}
async function rateLimitAcknowledgement(req, uid) {
  const ip=String(req.headers["x-forwarded-for"]||req.socket && req.socket.remoteAddress||"unknown").split(",")[0].trim();
  // Fast per-instance limit protects invalid-token bursts even without Admin credentials.
  if(!rateLimit("ack-ip:"+ip,60,15*60*1000)) return false;
  const db=engine.adminDatabase();
  if(!db) return rateLimit("ack-user:"+ip+":"+uid,20,15*60*1000);
  const now=Date.now(), windowMs=15*60*1000, bucket=Math.floor(now/windowMs);
  const key=crypto.createHash("sha256").update(ip+":"+uid+":"+bucket).digest("hex");
  const result=await db.ref("notification_rate_limits/ack_"+key).transaction(function(current) {
    if(current && current.bucket===bucket) {
      if(Number(current.count||0)>=20) return;
      return {bucket:bucket,count:Number(current.count||0)+1,expiresAt:(bucket+1)*windowMs};
    }
    return {bucket:bucket,count:1,expiresAt:(bucket+1)*windowMs};
  });
  return result.committed;
}
function safeSeverity(value) {
  return ["INFO","WARNING","CRITICAL"].includes(value) ? value : "WARNING";
}
function severityRank(value) { return value==="CRITICAL"?2:value==="WARNING"?1:0; }
function defaultRoute(severity) {
  return severity==="CRITICAL" ? ["in_app","push","sms","telegram","whatsapp","email"] :
    severity==="WARNING" ? ["in_app","push","email"] : ["in_app","daily_digest"];
}
function quietNow(settings) {
  const q=settings && settings.quietHours;
  if(!q || !q.enabled) return false;
  try {
    const value=new Intl.DateTimeFormat("en-GB",{timeZone:q.timezone||"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date());
    const n=Number(value.slice(0,2))*60+Number(value.slice(3,5));
    const v=x=>{const z=String(x||"00:00").split(":");return Number(z[0])*60+Number(z[1]);};
    const start=v(q.start),end=v(q.end);
    return start<=end?n>=start&&n<end:n>=start||n<end;
  } catch (_) { return false; }
}
async function audit(uid, event, alert, token, details) {
  const entry={ timestamp:new Date().toISOString(), actorUid:uid, event:event, shipmentId:alert && alert.shipmentId || null,
    alertId:alert && alert.id || null, severity:alert && alert.severity || null, details:details || "" };
  try { await engine.dbPush("audit_logs",entry,token); } catch(e) { console.warn("Notification audit append failed",e.message); }
}
async function saveAlert(uid, alert, token) {
  await engine.dbWrite("users/"+uid+"/notificationCenter/"+alert.id,alert,token);
}
async function updateAlert(uid, alertId, token, mutate) {
  const path="users/"+uid+"/notificationCenter/"+alertId;
  const alert=await engine.dbRead(path,token);
  if(!alert) throw Object.assign(new Error("Alert was not found for this operator."),{statusCode:404});
  mutate(alert);
  await engine.dbWrite(path,alert,token);
  return alert;
}
function recipientsFor(settings, contact) {
  const c=Object.assign({},contact||{});
  const preferred=settings && settings.contacts || {};
  ["email","phone","telegramChatId","whatsappPhone","pushToken"].forEach(key => {
    if (String(preferred[key] || "").trim()) c[key]=String(preferred[key]).trim();
  });
  return {
    email:String(c.email || process.env.ALERT_EMAIL_TO || "").trim(),
    phone:String(c.phone || process.env.ALERT_PHONE_TO || "").trim(),
    telegramChatId:String(c.telegramChatId || "").trim(),
    whatsappPhone:String(c.whatsappPhone || "").trim(),
    pushToken:String(c.pushToken || "").trim()
  };
}
function safeAlert(input) {
  const a=input && typeof input==="object" ? input : {};
  const allowed={};
  ["id","ownerUid","conditionKey","shipmentId","vaccine","batchNumber","type","typeLabel","severity","title","body","currentValue","permittedRange","minimum","maximum","deviation","deviationText","durationMinutes","timeToSpoilageMinutes","viabilityPercent","location","mapLink","coordinates","suggestedRoute","suspectSensor","detectedAt","detectedLocal","status","unread","recommendation","shortText","deepLink","acknowledgeLink","rerouteLink","channelStatus","deliveryMode","escalation","acknowledgedBy","acknowledgedAt","resolvedAt","timeline","source","region","payloadType","resolution"].forEach(k=>{ if(a[k]!==undefined) allowed[k]=a[k]; });
  allowed.id=String(allowed.id || "CGAL-"+crypto.randomBytes(6).toString("hex")).slice(0,80);
  allowed.shipmentId=String(allowed.shipmentId || "UNKNOWN").slice(0,100);
  allowed.severity=safeSeverity(allowed.severity);
  allowed.type=String(allowed.type || "TEST_ALERT").slice(0,40);
  allowed.title=String(allowed.title || (allowed.severity+": "+allowed.shipmentId+" alert")).slice(0,240);
  allowed.body=String(allowed.body || "").slice(0,5000);
  allowed.detectedAt=String(allowed.detectedAt || new Date().toISOString());
  allowed.status=["open","acknowledged","resolved"].includes(allowed.status) ? allowed.status : "open";
  allowed.timeline=Array.isArray(allowed.timeline)?allowed.timeline.slice(-80):[];
  allowed.channelStatus=allowed.channelStatus && typeof allowed.channelStatus==="object" ? allowed.channelStatus : {};
  return allowed;
}
async function getSettings(uid, token, bodySettings) {
  let remote=null;
  try { remote=await engine.dbRead("users/"+uid+"/notificationPreferences",token); } catch (_) {}
  return Object.assign({},bodySettings||{},remote||{});
}
function routeChannels(alert, settings, recipients) {
  let channels=Array.isArray(settings.severityChannels && settings.severityChannels[alert.severity]) ?
    settings.severityChannels[alert.severity].slice() : defaultRoute(alert.severity);
  if(!channels.includes("in_app")) channels.unshift("in_app");
  const role=settings.roles && settings.roles[settings.role];
  if(role && Array.isArray(role.channels)) channels=channels.filter(c=>c==="in_app" || role.channels.includes(c));
  if(severityRank(alert.severity)<severityRank(settings.minimumSeverity||"INFO")) channels=channels.filter(c=>c==="in_app");
  if(alert.severity!=="CRITICAL" && quietNow(settings)) channels=channels.filter(c=>["in_app","daily_digest","weekly_digest"].includes(c));
  return Array.from(new Set(channels)).filter(c=>c==="in_app" || (settings.channels && settings.channels[c]!==false) || c==="daily_digest" || c==="weekly_digest");
}
function actionLinks(alert, uid, req) {
  const original=engine.linksFor(alert,uid,req);
  alert.acknowledgeLink=original.acknowledge;
  alert.deepLink=original.view;
  alert.rerouteLink=original.reroute;
  return original;
}
function appendTimeline(alert, name, details) {
  alert.timeline=Array.isArray(alert.timeline)?alert.timeline:[];
  alert.timeline.push({event:name,at:new Date().toISOString(),details:details||""});
  if(alert.timeline.length>100) alert.timeline=alert.timeline.slice(-100);
}
function deliveryQueuedStatus(channel, note) {
  return {status:"queued",updatedAt:new Date().toISOString(),note:note||"Queued for provider delivery",attempts:0};
}
async function queueTask(uid, alert, channel, recipients, links, reminder) {
  const taskId=crypto.randomBytes(12).toString("hex");
  const task={ id:taskId, uid:uid, alertId:alert.id, channel:channel, alert:alert, recipients:recipients, links:links,
    attempts:0, status:"queued", nextAttemptAt:Date.now(), createdAt:new Date().toISOString(), reminder:!!reminder };
  await engine.dbWrite("notification_queue/"+uid+"/"+taskId,task,null);
}
async function persistTaskWithFallback(uid, alert, channel, recipients, links, reminder, token) {
  const db=engine.adminDatabase();
  if(db) return queueTask(uid,alert,channel,recipients,links,reminder);
  return null;
}
async function queueOrDeliver(uid, token, alert, channels, recipients, links, reminder) {
  const config=engine.providerConfig();
  const external=channels.filter(c=>c!=="in_app" && c!=="daily_digest" && c!=="weekly_digest");
  if(config.demoMode) {
    alert.deliveryMode="demo";
    external.forEach(c=>{alert.channelStatus[c]={status:"queued",updatedAt:new Date().toISOString(),note:"Demo preview only — no provider credentials configured"};});
    appendTimeline(alert,"previewed","No provider keys are configured. External messages were not sent.");
    await saveAlert(uid,alert,token);
    return {mode:"demo",channels:alert.channelStatus,message:"Demo mode: alert stored and previewed; no external messages were sent."};
  }
  const statuses={};
  // A durable queue makes delivery independent of the telemetry caller. If no Admin SDK
  // credentials are configured, keep a bounded inline fallback so the app still works.
  if(config.durableQueueReady) {
    for(const channel of channels) {
      if(channel==="in_app") { statuses[channel]={status:"delivered",updatedAt:new Date().toISOString(),note:"Available in Alert Center"}; continue; }
      if(channel==="daily_digest" || channel==="weekly_digest") {
        if(config.providers.email) await queueTask(uid,alert,channel,recipients,links,reminder);
        statuses[channel]=deliveryQueuedStatus(channel,"Queued for digest summarization");
        continue;
      }
      if(!config.providers[channel]) { statuses[channel]={status:"failed",updatedAt:new Date().toISOString(),note:"Provider not configured"}; continue; }
      if(!engine.channelAvailable(channel,recipients)) { statuses[channel]={status:"failed",updatedAt:new Date().toISOString(),note:"Provider configured, but this channel has no valid recipient"}; continue; }
      await queueTask(uid,alert,channel,recipients,links,reminder);
      statuses[channel]=deliveryQueuedStatus(channel);
    }
    alert.channelStatus=Object.assign({},alert.channelStatus,statuses); alert.deliveryMode="queued";
    appendTimeline(alert,"queued","Delivery tasks persisted to the notification queue.");
    await saveAlert(uid,alert,token);
    return {mode:"queued",channels:alert.channelStatus,message:"Notification tasks are queued. Provider delivery runs outside the telemetry pipeline.",acknowledgeLink:links.acknowledge};
  }

  alert.deliveryMode="live";
  const allStatuses=Object.assign({},alert.channelStatus);
  for(const channel of channels) {
    if(channel==="in_app") { allStatuses[channel]={status:"delivered",updatedAt:new Date().toISOString(),note:"Available in Alert Center"}; continue; }
    if(channel==="daily_digest" || channel==="weekly_digest") { allStatuses[channel]=deliveryQueuedStatus(channel,"Waiting for digest request"); continue; }
    if(!config.providers[channel] || !engine.channelAvailable(channel,recipients)) {
      allStatuses[channel]={status:"failed",updatedAt:new Date().toISOString(),note:"Provider or recipient is not configured"};
      continue;
    }
    const result=await engine.deliverWithRetry(channel,alert,recipients,links);
    allStatuses[channel]=result;
    if(result.status==="failed") {
      await engine.dbWrite("notification_queue/"+uid+"/"+crypto.randomBytes(8).toString("hex"),{
        uid:uid,alertId:alert.id,channel:channel,alert:alert,recipients:recipients,links:links,attempts:3,status:"queued",
        nextAttemptAt:Date.now()+30000,createdAt:new Date().toISOString(),lastError:result.note
      },null).catch(()=>{});
      const fallback=engine.fallbackFor(channel).find(next=>config.providers[next]&&engine.channelAvailable(next,recipients));
      if(fallback) {
        const fallbackResult=await engine.deliverWithRetry(fallback,alert,recipients,links);
        allStatuses[fallback]=Object.assign({},fallbackResult,{note:"Fallback after "+channel+" failed: "+(fallbackResult.note||"")});
      }
    }
  }
  alert.channelStatus=allStatuses;
  appendTimeline(alert,"notified","Channel delivery attempted. Per-channel status is recorded.");
  await saveAlert(uid,alert,token);
  return {mode:"live",channels:allStatuses,message:"Notification delivery attempted; check each channel status.",acknowledgeLink:links.acknowledge};
}
async function runAckLink(req,res) {
  const q=req.query||{};
  const uid=String(q.uid||""),alertId=String(q.alertId||""),exp=String(q.exp||""),token=String(q.token||"");
  if(!uid || !alertId || !engine.verifyActionToken(uid,alertId,exp,token)) return res.status(400).send("<h1>Invalid or expired acknowledgement link</h1><p>Sign in to ColdGuard and acknowledge this alert from Alert Center.</p>");
  const allowed=await rateLimitAcknowledgement(req,uid).catch(()=>false);
  if(!allowed) return res.status(429).send("Too many acknowledgement attempts. Try again later.");
  const db=engine.adminDatabase();
  if(!db) return res.status(503).send("<h1>Acknowledgement service unavailable</h1><p>Secure email acknowledgement requires FIREBASE_SERVICE_ACCOUNT_JSON and NOTIFICATION_ACTION_SECRET. You can acknowledge from the dashboard.</p>");
  const tokenKey=crypto.createHash("sha256").update(token).digest("hex");
  const tokenRef=db.ref("notification_action_tokens/"+tokenKey);
  const reserve=await tokenRef.transaction(current=>current ? undefined : {uid:uid,alertId:alertId,usedAt:new Date().toISOString(),expiresAt:Number(exp)});
  if(!reserve.committed) return res.status(409).send("<h1>This acknowledgement link has already been used</h1><p>The alert timeline is available in ColdGuard Alert Center.</p>");
  try {
    const ref=db.ref("users/"+uid+"/notificationCenter/"+alertId);
    const snap=await ref.once("value");
    const alert=snap.val();
    if(!alert) return res.status(404).send("<h1>Alert not found</h1><p>Open ColdGuard Alert Center to review recent alerts.</p>");
    if(alert.status==="open") {
      alert.status="acknowledged"; alert.unread=false; alert.acknowledgedBy="Signed email action"; alert.acknowledgedAt=new Date().toISOString();
      if(alert.escalation) alert.escalation.nextAt=null;
      appendTimeline(alert,"acknowledged","Acknowledged from a signed link.");
      await ref.set(alert);
      // Escalated copies carry ownerUid; stop the original alert's escalation too.
      if(alert.ownerUid && alert.ownerUid!==uid) {
        const ownerRef=db.ref("users/"+alert.ownerUid+"/notificationCenter/"+alertId);
        const ownerSnap=await ownerRef.once("value");
        const ownerAlert=ownerSnap.val();
        if(ownerAlert && ownerAlert.status==="open") {
          ownerAlert.status="acknowledged"; ownerAlert.unread=false;
          ownerAlert.acknowledgedBy="Signed email action"; ownerAlert.acknowledgedAt=alert.acknowledgedAt;
          if(ownerAlert.escalation) ownerAlert.escalation.nextAt=null;
          appendTimeline(ownerAlert,"acknowledged","Acknowledged by escalation recipient from a signed link.");
          await ownerRef.set(ownerAlert);
        }
      }
      await db.ref("audit_logs").push({timestamp:new Date().toISOString(),actorUid:uid,event:"NOTIFICATION_ACKNOWLEDGED_SIGNED_LINK",shipmentId:alert.shipmentId,alertId:alertId,details:"Signed email acknowledgement"});
    }
    const url=engine.baseUrl(req)+"/index.html#alert_center";
    return res.status(200).send('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>ColdGuard alert acknowledged</title></head><body style="margin:0;background:#f4f7fb;font:15px Arial,sans-serif;color:#0f172a"><main style="max-width:520px;margin:10vh auto;padding:28px;background:#fff;border:1px solid #dbe4ef;border-radius:16px"><div style="color:#047857;font-size:12px;font-weight:bold;letter-spacing:.1em">COLDGUARD · ALERT ACTION</div><h1 style="font-size:24px">Alert acknowledged</h1><p>' + esc(alert.title) + '</p><p>Escalation has been stopped for this alert.</p><a href="' + esc(url) + '" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;padding:12px 15px;font-weight:bold">Open Alert Center</a></main></body></html>');
  } catch(error) { console.error("Signed acknowledgement failed",error.message); return res.status(500).send("Could not acknowledge this alert. Please use the dashboard."); }
}

module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  const action=String((req.query||{}).action || (req.body||{}).action || "");
  if(req.method==="GET" && action==="health") {
    const config=engine.providerConfig();
    return res.status(200).json({ ok:true, providers:config.providers, demoMode:config.demoMode, durableQueueReady:config.durableQueueReady,
      message:config.demoMode ? "No external provider credentials configured. Events are preview-only." : config.durableQueueReady ? "Provider credentials available; durable delivery queue enabled." : "Provider credentials available; direct delivery fallback enabled. Configure Firebase Admin service account for durable retries/escalation." });
  }
  if(req.method==="GET" && action==="ack") return runAckLink(req,res);
  if(req.method!=="POST") return response(res,405,{error:"Method not allowed"});
  const token=tokenFrom(req);
  if(!token) return response(res,401,{error:"Sign in is required for this notification action."});
  let user;
  try { user=await engine.verifyFirebaseToken(token); }
  catch(error) { return response(res,error.statusCode||502,{error:error.message||"Could not verify Firebase session."}); }
  if(!rateLimit("user:"+user.uid+":"+action,action==="send"?40:80,60*1000)) return response(res,429,{error:"Notification rate limit reached. Please retry shortly."});
  const body=req.body||{};
  try {
    if(action==="settings") {
      const preferences=body.preferences;
      if(!preferences || typeof preferences!=="object") return response(res,400,{error:"Notification preferences are required."});
      await engine.dbWrite("users/"+user.uid+"/notificationPreferences",preferences,token);
      await audit(user.uid,"NOTIFICATION_PREFERENCES_UPDATED",null,token,"Operator notification settings updated.");
      return response(res,200,{ok:true,message:"Notification settings saved."});
    }
    if(action==="acknowledge" || action==="resolve") {
      const alertId=String(body.alertId||"").slice(0,80);
      if(!alertId) return response(res,400,{error:"Alert ID is required."});
      const alert=await updateAlert(user.uid,alertId,token,function(a) {
        if(action==="acknowledge" && a.status==="open") {
          a.status="acknowledged";a.unread=false;a.acknowledgedAt=new Date().toISOString();a.acknowledgedBy=user.email||user.uid;
          if(a.escalation)a.escalation.nextAt=null;
          appendTimeline(a,"acknowledged","Acknowledged in dashboard by "+(user.email||user.uid));
        } else if(action==="resolve" && a.status!=="resolved") {
          a.status="resolved";a.unread=false;a.resolvedAt=new Date().toISOString();a.resolution=body.resolution||{reason:"Condition cleared"};
          if(a.escalation)a.escalation.nextAt=null;
          appendTimeline(a,"resolved",a.resolution.reason||"Condition cleared");
        }
      });
      // If this is an escalation copy, also stop the owner's escalation chain.
      if(alert.ownerUid && alert.ownerUid!==user.uid && engine.adminDatabase()) {
        const ownerAlert=await engine.dbRead("users/"+alert.ownerUid+"/notificationCenter/"+alertId,null).catch(()=>null);
        if(ownerAlert) {
          if(action==="acknowledge" && ownerAlert.status==="open") {
            ownerAlert.status="acknowledged";ownerAlert.unread=false;ownerAlert.acknowledgedAt=alert.acknowledgedAt||new Date().toISOString();ownerAlert.acknowledgedBy=user.email||user.uid;
            if(ownerAlert.escalation)ownerAlert.escalation.nextAt=null;
            appendTimeline(ownerAlert,"acknowledged","Acknowledged by escalation recipient "+(user.email||user.uid));
          } else if(action==="resolve" && ownerAlert.status!=="resolved") {
            ownerAlert.status="resolved";ownerAlert.unread=false;ownerAlert.resolvedAt=alert.resolvedAt||new Date().toISOString();ownerAlert.resolution=body.resolution||{reason:"Condition cleared"};
            if(ownerAlert.escalation)ownerAlert.escalation.nextAt=null;
            appendTimeline(ownerAlert,"resolved","Resolved by escalation recipient");
          }
          await engine.dbWrite("users/"+alert.ownerUid+"/notificationCenter/"+alertId,ownerAlert,null);
        }
      }
      await audit(user.uid,action==="acknowledge"?"NOTIFICATION_ACKNOWLEDGED":"NOTIFICATION_RESOLVED",alert,token,action==="acknowledge"?"Dashboard acknowledgement":"Condition resolved");
      return response(res,200,{ok:true,alert:alert});
    }
    if(action==="digest") {
      const settings=await getSettings(user.uid,token,body.preferences);
      const contact=await engine.dbRead("users/"+user.uid+"/emergencyContact",token).catch(()=>({}));
      const recipients=recipientsFor(settings,contact);
      const config=engine.providerConfig();
      if(config.demoMode || !recipients.email) return response(res,200,{ok:true,mode:"demo",message:"Digest preview stored locally; email provider or recipient is not configured."});
      const rows=Array.isArray(body.alerts)?body.alerts.slice(0,100):[];
      const critical=rows.filter(a=>a.severity==="CRITICAL").length, warnings=rows.filter(a=>a.severity==="WARNING").length;
      const subject="ColdGuard "+String(body.period||"daily").toUpperCase()+" cold-chain digest · "+rows.length+" alerts";
      const html='<div style="font:14px Arial,sans-serif;color:#0f172a;max-width:680px;margin:auto"><div style="background:#0f172a;color:#fff;padding:20px;border-radius:12px 12px 0 0"><strong style="font-size:20px">❄ ColdGuard · Alert digest</strong><div style="color:#cbd5e1;font-size:11px;margin-top:5px">EXCURSIONS · SENSOR FAULTS · COMPLIANCE</div></div><div style="padding:22px;border:1px solid #dbe4ef"><p>Summary for the last '+esc(body.period||"day")+'.</p><table cellpadding="8" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td style="background:#fef2f2;border:1px solid #e2e8f0"><strong>Critical</strong><div>'+critical+'</div></td><td style="background:#fffbeb;border:1px solid #e2e8f0"><strong>Warnings</strong><div>'+warnings+'</div></td><td style="background:#eff6ff;border:1px solid #e2e8f0"><strong>Total alerts</strong><div>'+rows.length+'</div></td></tr></table><h3>Recent events</h3><table cellpadding="8" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:12px"><tr><th align="left">Alert</th><th align="left">Shipment</th><th align="left">Severity</th><th align="left">Status</th></tr>'+rows.map(a=>'<tr><td style="border-top:1px solid #e2e8f0">'+esc(a.title||a.type)+'</td><td style="border-top:1px solid #e2e8f0">'+esc(a.shipmentId)+'</td><td style="border-top:1px solid #e2e8f0">'+esc(a.severity)+'</td><td style="border-top:1px solid #e2e8f0">'+esc(a.status)+'</td></tr>').join("")+'</table><p style="font-size:12px;color:#64748b">Operational overview only; evaluate original telemetry before product disposition.</p></div></div>';
      const htmlContent=html;
      const result=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"api-key":process.env.BREVO_API_KEY,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({sender:{name:process.env.ALERT_FROM_NAME||"ColdGuard Alerts",email:process.env.ALERT_FROM_EMAIL},to:[{email:recipients.email}],subject:subject,htmlContent:htmlContent,textContent:subject+"\nCritical: "+critical+"\nWarnings: "+warnings+"\nTotal alerts: "+rows.length+"\n"+rows.map(a=>a.title||a.type).join("\n")})});
      if(!result.ok) return response(res,502,{error:"Digest email provider rejected the request."});
      await audit(user.uid,"NOTIFICATION_DIGEST_SENT",null,token,subject);
      return response(res,200,{ok:true,mode:"live",message:"Digest email accepted by provider."});
    }
    if(action!=="send") return response(res,400,{error:"Unsupported notification action."});
    const alert=safeAlert(body.alert);
    const severity=safeSeverity(alert.severity); alert.severity=severity; alert.ownerUid=user.uid;
    const previous=await engine.dbRead("users/"+user.uid+"/notificationCenter/"+alert.id,token).catch(()=>null);
    if(previous && previous.status==="acknowledged") return response(res,200,{ok:true,mode:"live",channels:previous.channelStatus||{},message:"This alert is already acknowledged."});
    const settings=await getSettings(user.uid,token,body.preferences);
    const emergency=await engine.dbRead("users/"+user.uid+"/emergencyContact",token).catch(()=>({}));
    const recipients=recipientsFor(settings,emergency);
    const channels=routeChannels(alert,settings,recipients);
    const links=actionLinks(alert,user.uid,req);
    alert.deliveryMode="queued"; alert.channelStatus=alert.channelStatus||{};
    const config=engine.providerConfig();
    if(config.demoMode) {
      alert.deliveryMode="demo";
      channels.filter(c=>c!=="in_app").forEach(c=>{alert.channelStatus[c]={status:"queued",updatedAt:new Date().toISOString(),note:"Demo preview only — provider keys are not configured"};});
      appendTimeline(alert,"previewed","No external providers configured; this message was logged for preview only.");
      await saveAlert(user.uid,alert,token);
      await audit(user.uid,"NOTIFICATION_PREVIEWED",alert,token,"Demo-mode notification preview.");
      return response(res,200,{ok:true,mode:"demo",channels:alert.channelStatus,message:"Demo mode: notification logged and previewed, not sent.",acknowledgeLink:links.acknowledge});
    }
    const delivered=await queueOrDeliver(user.uid,token,alert,channels,recipients,links,body.reminder===true);
    await audit(user.uid,delivered.mode==="queued"?"NOTIFICATION_QUEUED":"NOTIFICATION_DELIVERY_ATTEMPTED",alert,token,delivered.message);
    return response(res,200,{ok:true,...delivered});
  } catch(error) {
    console.error("ColdGuard notification endpoint failed",error && error.message);
    return response(res,error.statusCode||502,{error:error.message||"Notification action failed."});
  }
};
