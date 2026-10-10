"use strict";
const engine = require("./notificationEngine");

function appendTimeline(alert, event, details) {
  alert.timeline=Array.isArray(alert.timeline)?alert.timeline:[];
  alert.timeline.push({event:event,at:new Date().toISOString(),details:details||""});
  if(alert.timeline.length>100) alert.timeline=alert.timeline.slice(-100);
}
async function auditEvent(db, uid, event, alert, details) {
  const record={
    timestamp:new Date().toISOString(), actorUid:uid||"notification-worker", event:event,
    alertId:alert && alert.id || null, shipmentId:alert && alert.shipmentId || null,
    severity:alert && alert.severity || null, details:details||""
  };
  try { await db.ref("audit_logs").push(record); }
  catch(error) { console.warn("Notification audit event could not be written",error.message); }
}
function roleOf(record) {
  const pref=record && record.notificationPreferences || {};
  return String(record && (record.role || record.userRole) || pref.role || "").toLowerCase();
}
function recipientRecordRoleMatch(users, role, skipUid) {
  return Object.keys(users||{}).filter(uid=>uid!==skipUid && roleOf(users[uid])===role && users[uid] && users[uid].email);
}
function channelList(alert,prefs) {
  const defaults=alert.severity==="CRITICAL"?["in_app","push","sms","telegram","whatsapp","email"]:alert.severity==="WARNING"?["in_app","push","email"]:["in_app","daily_digest"];
  let channels=Array.isArray(prefs.severityChannels && prefs.severityChannels[alert.severity])?prefs.severityChannels[alert.severity].slice():defaults;
  const role=prefs.roles && prefs.roles[prefs.role];
  if(role && Array.isArray(role.channels)) channels=channels.filter(c=>c==="in_app" || role.channels.includes(c));
  if(alert.severity!=="CRITICAL" && prefs.quietHours && prefs.quietHours.enabled) {
    try {
      const now=new Date();
      const local=new Intl.DateTimeFormat("en-GB",{timeZone:prefs.quietHours.timezone||"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(now);
      const current=Number(local.slice(0,2))*60+Number(local.slice(3,5));
      const toMin=x=>{const z=String(x||"00:00").split(":");return Number(z[0])*60+Number(z[1]);};
      const start=toMin(prefs.quietHours.start),end=toMin(prefs.quietHours.end);
      const quiet=start<=end?current>=start&&current<end:current>=start||current<end;
      if(quiet)channels=channels.filter(c=>["in_app","daily_digest","weekly_digest"].includes(c));
    } catch(_){}
  }
  return Array.from(new Set(channels)).filter(c=>c==="in_app" || !prefs.channels || prefs.channels[c]!==false || c==="daily_digest" || c==="weekly_digest");
}
function recipients(settings, contact) {
  const c=Object.assign({},contact||{});
  const preferred=settings && settings.contacts || {};
  ["email","phone","telegramChatId","whatsappPhone","pushToken"].forEach(key => {
    if (String(preferred[key] || "").trim()) c[key]=String(preferred[key]).trim();
  });
  return {
    email:String(c.email || "").trim(),
    phone:String(c.phone || "").trim(),
    telegramChatId:String(c.telegramChatId || "").trim(),
    whatsappPhone:String(c.whatsappPhone || "").trim(),
    pushToken:String(c.pushToken || "").trim()
  };
}
async function enqueue(db,uid,alert,channel,recipientsObj,links,opts) {
  const key=db.ref("notification_queue/"+uid).push().key;
  const task=Object.assign({
    id:key,uid:uid,alertId:alert.id,channel:channel,alert:alert,recipients:recipientsObj,links:links,
    attempts:0,status:"queued",nextAttemptAt:Date.now(),createdAt:new Date().toISOString(),reminder:false
  },opts||{});
  await db.ref("notification_queue/"+uid+"/"+key).set(task);
}
async function sendDigest(db,task) {
  const prefs=(await db.ref("users/"+task.uid+"/notificationPreferences").once("value")).val()||{};
  const contact=(await db.ref("users/"+task.uid+"/emergencyContact").once("value")).val()||{};
  const to=String((prefs.contacts&&prefs.contacts.email)||contact.email||process.env.ALERT_EMAIL_TO||"").trim();
  if(!to || !process.env.BREVO_API_KEY || !process.env.ALERT_FROM_EMAIL) throw new Error("Digest email recipient or provider is not configured.");
  const period=task.channel==="weekly_digest"?"weekly":"daily";
  const since=Date.now()-(period==="weekly"?7:1)*86400000;
  const snapshot=await db.ref("users/"+task.uid+"/notificationCenter").once("value");
  const all=Object.values(snapshot.val()||{}).filter(a=>a && Date.parse(a.detectedAt||0)>=since);
  const critical=all.filter(a=>a.severity==="CRITICAL").length;
  const warnings=all.filter(a=>a.severity==="WARNING").length;
  const faults=all.filter(a=>a.type==="SENSOR_FAULT").length;
  const resolved=all.filter(a=>a.status==="resolved").length;
  const rows=all.slice(0,80).map(a=>'<tr><td style="padding:8px;border-top:1px solid #e2e8f0">'+engine.esc(a.title||a.type)+'</td><td style="padding:8px;border-top:1px solid #e2e8f0">'+engine.esc(a.shipmentId)+'</td><td style="padding:8px;border-top:1px solid #e2e8f0">'+engine.esc(a.severity)+'</td><td style="padding:8px;border-top:1px solid #e2e8f0">'+engine.esc(a.status)+'</td></tr>').join("");
  const html='<!doctype html><html><body style="margin:0;background:#f4f7fb;font:14px Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:18px"><table role="presentation" width="640" style="max-width:640px;width:100%;background:#fff;border:1px solid #dbe4ef;border-radius:14px;overflow:hidden" cellpadding="0" cellspacing="0"><tr><td style="padding:22px;background:#0f172a;color:#fff"><strong style="font-size:20px">❄ ColdGuard · '+period.toUpperCase()+' digest</strong><div style="margin-top:6px;color:#cbd5e1;font-size:11px">EXCURSIONS · SENSOR FAULTS · COMPLIANCE</div></td></tr><tr><td style="padding:22px"><p>Summary of the last '+(period==="weekly"?"7 days":"24 hours")+'.</p><table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse"><tr><td style="background:#fef2f2;border:1px solid #e2e8f0"><b>Critical</b><br>'+critical+'</td><td style="background:#fffbeb;border:1px solid #e2e8f0"><b>Warnings</b><br>'+warnings+'</td><td style="background:#eff6ff;border:1px solid #e2e8f0"><b>Sensor faults</b><br>'+faults+'</td><td style="background:#ecfdf5;border:1px solid #e2e8f0"><b>Resolved</b><br>'+resolved+'</td></tr></table><h3>Recent alerts</h3><table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:12px"><tr><th align="left">Alert</th><th align="left">Shipment</th><th align="left">Severity</th><th align="left">Status</th></tr>'+rows+'</table><p style="color:#64748b;font-size:11px">Generated by ColdGuard notification worker. Predictions are operational estimates; use source telemetry for final disposition.</p></td></tr></table></td></tr></table></body></html>';
  const result=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"api-key":process.env.BREVO_API_KEY,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({sender:{name:process.env.ALERT_FROM_NAME||"ColdGuard Alerts",email:process.env.ALERT_FROM_EMAIL},to:[{email:to}],subject:"ColdGuard "+period.toUpperCase()+" digest · "+all.length+" alerts",htmlContent:html,textContent:"ColdGuard "+period+" digest\nCritical: "+critical+"\nWarnings: "+warnings+"\nSensor faults: "+faults+"\nResolved: "+resolved+"\n\n"+all.slice(0,80).map(a=>a.title||a.type).join("\n")})});
  const body=await result.json().catch(()=>({}));
  if(!result.ok)throw new Error(body.message||"Digest delivery failed.");
  return {status:"sent",providerId:body.messageId||"accepted",updatedAt:new Date().toISOString(),note:"Digest accepted by email provider."};
}
async function enqueueEscalation(db, ownerUid, alert, users) {
  const sourcePrefs=(await db.ref("users/"+ownerUid+"/notificationPreferences").once("value")).val()||{};
  const chain=Array.isArray(sourcePrefs.escalationChain)&&sourcePrefs.escalationChain.length?sourcePrefs.escalationChain:["driver","hub_manager","logistics_admin"];
  const currentLevel=Number(alert.escalation && alert.escalation.level || 0);
  const repeated=currentLevel>=chain.length-1;
  const nextRole=repeated?"all_escalation_roles":chain[Math.min(currentLevel+1,chain.length-1)];
  let targets=[];
  if(repeated) {
    targets=Object.keys(users||{}).filter(uid=>{
      const record=users[uid]||{},role=roleOf(record);
      return chain.includes(role) && record.email;
    });
  } else {
    targets=recipientRecordRoleMatch(users,nextRole,ownerUid);
  }
  const details=[];
  for(const targetUid of targets) {
    const record=users[targetUid]||{};
    const prefs=record.notificationPreferences||{};
    if(prefs.enabled===false)continue;
    const channels=channelList(alert,prefs);
    const contact=record.emergencyContact||{};
    const to=recipients(prefs,contact);
    const config=engine.providerConfig();
    const links=engine.linksFor(alert,targetUid,{headers:{host:""}});
    // The same alert ID is copied to the recipient's private Alert Center.
    const recipientCopy=Object.assign({},alert,{ownerUid:ownerUid,escalationRecipientRole:repeated?roleOf(record):nextRole,unread:true,status:"open"});
    recipientCopy.channelStatus=Object.assign({},recipientCopy.channelStatus||{});
    appendTimeline(recipientCopy,"escalated","Escalated to "+roleOf(record)+" by policy.");
    await db.ref("users/"+targetUid+"/notificationCenter/"+alert.id).set(recipientCopy);
    await db.ref("notification_escalation_map/"+targetUid+"/"+alert.id).set({ownerUid:ownerUid,alertId:alert.id,recipientUid:targetUid,createdAt:new Date().toISOString()});
    for(const channel of channels) {
      if(channel==="in_app")continue;
      if(channel==="daily_digest"||channel==="weekly_digest") {
        if(config.providers.email)await enqueue(db,targetUid,recipientCopy,channel,to,links,{ownerUid:ownerUid,sourceAlertId:alert.id});
      } else if(config.providers[channel] && engine.channelAvailable(channel,to)) {
        await enqueue(db,targetUid,recipientCopy,channel,to,links,{ownerUid:ownerUid,sourceAlertId:alert.id});
      }
    }
    details.push({uid:targetUid,role:roleOf(record)});
  }
  alert.escalation=alert.escalation||{};
  alert.escalation.level=repeated?currentLevel:Math.min(chain.length-1,currentLevel+1);
  alert.escalation.lastSentAt=new Date().toISOString();
  const delay=repeated?Number(sourcePrefs.repeatEveryMinutes||10):alert.severity==="CRITICAL"?Number(sourcePrefs.criticalEscalationMinutes||5):Number(sourcePrefs.warningEscalationMinutes||15);
  alert.escalation.nextAt=new Date(Date.now()+Math.max(1,delay)*60000).toISOString();
  appendTimeline(alert,"escalated",details.length?"Notified "+details.length+" recipient(s) at "+nextRole+" level.":"No recipient matched escalation level "+nextRole+"; escalation timer advanced.");
  await db.ref("users/"+ownerUid+"/notificationCenter/"+alert.id).set(alert);
  await auditEvent(db,ownerUid,"NOTIFICATION_ESCALATED",alert,details.length?"Escalation targeted "+details.length+" user(s).":"No user matched the next escalation role.");
}
module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  const secret=process.env.CRON_SECRET;
  const authorization=String(req.headers.authorization||"");
  if(!secret || authorization!=="Bearer "+secret) return res.status(401).json({error:"Unauthorized worker request."});
  if(req.method!=="GET" && req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const db=engine.adminDatabase();
  if(!db)return res.status(503).json({error:"FIREBASE_SERVICE_ACCOUNT_JSON must be configured to run durable notifications."});
  try {
    const lockRef=db.ref("notification_worker_lock");
    const lockOwner=cryptoRandomId();
    const lockClaim=await lockRef.transaction(function(current) {
      if(current && Number(current.leaseUntil||0)>Date.now()) return;
      return {owner:lockOwner,leaseUntil:Date.now()+4*60*1000,createdAt:new Date().toISOString()};
    });
    if(!lockClaim.committed) return res.status(200).json({ok:true,skipped:true,reason:"Another worker holds the lease."});
    const queueSnap=await db.ref("notification_queue").once("value");
    const queue=queueSnap.val()||{};
    const due=[];
    Object.keys(queue).forEach(uid=>Object.keys(queue[uid]||{}).forEach(key=>{
      const task=queue[uid][key];
      const queuedDue=task && task.status==="queued" && Number(task.nextAttemptAt||0)<=Date.now();
      const leaseExpired=task && task.status==="processing" && Number(task.leaseUntil||0)<=Date.now();
      if((queuedDue||leaseExpired) && due.length<60) due.push({uid:uid,key:key,task:task});
    }));
    let sent=0, retried=0, failed=0, skipped=0;
    for(const item of due) {
      const uid=item.uid, queueRef=db.ref("notification_queue/"+uid+"/"+item.key);
      const claim=await queueRef.transaction(function(current) {
        if(!current) return;
        const dueQueued=current.status==="queued" && Number(current.nextAttemptAt||0)<=Date.now();
        const staleLease=current.status==="processing" && Number(current.leaseUntil||0)<=Date.now();
        if(!dueQueued && !staleLease) return;
        return Object.assign({},current,{status:"processing",claimedAt:new Date().toISOString(),leaseUntil:Date.now()+2*60*1000});
      });
      if(!claim.committed) { skipped++; continue; }
      const task=claim.snapshot.val(), channel=task.channel, alert=task.alert||{};
      try {
        const originUid=task.ownerUid||alert.ownerUid||uid;
        const originRef=db.ref("users/"+originUid+"/notificationCenter/"+task.alertId);
        const originSnap=await originRef.once("value");
        const origin=originSnap.val();
        if(origin && (origin.status==="acknowledged" || origin.status==="resolved")) {
          task.status="cancelled";task.cancelledAt=new Date().toISOString();task.cancelReason="Alert already acknowledged or resolved.";task.leaseUntil=null;
          await db.ref("notification_queue/"+uid+"/"+item.key).set(task);
          await auditEvent(db,uid,"NOTIFICATION_DELIVERY_CANCELLED",alert,"Queued "+channel+" delivery cancelled because the alert was acknowledged or resolved.");
          skipped++; continue;
        }
        if(origin && origin.severity!=="CRITICAL" && Number(origin.mutedUntil||0)>Date.now()) {
          task.status="queued";task.nextAttemptAt=Number(origin.mutedUntil);task.leaseUntil=null;
          task.lastError="Reminder paused by signed mute action until "+new Date(Number(origin.mutedUntil)).toISOString();
          await db.ref("notification_queue/"+uid+"/"+item.key).set(task);
          await auditEvent(db,uid,"NOTIFICATION_REMINDER_MUTED",alert,task.lastError);
          skipped++; continue;
        }
        let result;
        if(channel==="daily_digest"||channel==="weekly_digest") result=await sendDigest(db,task);
        else {
          const prefs=(await db.ref("users/"+uid+"/notificationPreferences").once("value")).val()||{};
          const contact=(await db.ref("users/"+uid+"/emergencyContact").once("value")).val()||{};
          const rcpt=recipients(prefs,contact);
          const links=engine.linksFor(alert,uid,{headers:{host:""}});
          result=await engine.deliverWithRetry(channel,alert,rcpt,links);
        }
        if(result.status==="sent") {
          task.status="sent";task.sentAt=new Date().toISOString();task.providerId=result.providerId;task.result=result;task.nextAttemptAt=null;
          await db.ref("notification_queue/"+uid+"/"+item.key).set(task);
          const targetRef=db.ref("users/"+uid+"/notificationCenter/"+task.alertId);
          const targetSnap=await targetRef.once("value");const copy=targetSnap.val();
          if(copy) {copy.channelStatus=copy.channelStatus||{};copy.channelStatus[channel]=result;appendTimeline(copy,"notified",channel+" accepted by provider.");await targetRef.set(copy);}
          if(origin) {
            origin.channelStatus=origin.channelStatus||{};
            if(uid===originUid) origin.channelStatus[channel]=result;
            appendTimeline(origin,"notified",(uid===originUid?"":("Escalation recipient "+uid+": "))+channel+" accepted by provider.");
            await originRef.set(origin);
          }
          await auditEvent(db,uid,channel==="daily_digest"||channel==="weekly_digest"?"NOTIFICATION_DIGEST_SENT":"NOTIFICATION_CHANNEL_SENT",alert,channel+" accepted by the provider.");
          sent++;
        } else {
          task.attempts=Number(task.attempts||0)+1;task.lastError=result.note||"Provider failed.";task.lastAttemptAt=new Date().toISOString();
          if(task.attempts>=6) {
            task.status="failed";task.nextAttemptAt=null;task.failedAt=new Date().toISOString();failed++;
          } else {
            const delay=Math.min(3600000,30000*Math.pow(2,task.attempts-1));
            task.status="queued";task.nextAttemptAt=Date.now()+delay;retried++;
          }
          task.result=result;
          await db.ref("notification_queue/"+uid+"/"+item.key).set(task);
          await auditEvent(db,uid,task.status==="failed"?"NOTIFICATION_CHANNEL_FAILED":"NOTIFICATION_RETRY_SCHEDULED",alert,channel+": "+String(task.lastError||"Provider failure"));
          const targetRef=db.ref("users/"+uid+"/notificationCenter/"+task.alertId);
          const targetSnap=await targetRef.once("value");const copy=targetSnap.val();
          if(copy) {copy.channelStatus=copy.channelStatus||{};copy.channelStatus[channel]={status:task.status==="failed"?"failed":"queued",updatedAt:new Date().toISOString(),attempts:task.attempts,note:task.lastError};appendTimeline(copy,task.status==="failed"?"delivery_failed":"retry_scheduled",channel+": "+task.lastError);await targetRef.set(copy);}
          if(task.status==="failed" && origin) {
            const fallback=engine.fallbackFor(channel).find(ch=>engine.providerConfig().providers[ch]);
            if(fallback) {
              const nextId=db.ref("notification_queue/"+uid).push().key;
              const next=Object.assign({},task,{id:nextId,channel:fallback,status:"queued",attempts:0,nextAttemptAt:Date.now(),createdAt:new Date().toISOString(),fallbackOf:channel,lastError:null});
              await db.ref("notification_queue/"+uid+"/"+nextId).set(next);
              origin.timeline=origin.timeline||[];appendTimeline(origin,"fallback_queued","Fallback "+fallback+" queued after "+channel+" delivery failed.");
              await originRef.set(origin);
            }
          }
        }
      } catch(error) {
        task.attempts=Number(task.attempts||0)+1;task.lastError=String(error.message||error);task.lastAttemptAt=new Date().toISOString();
        if(task.attempts>=6){task.status="failed";task.nextAttemptAt=null;failed++;}
        else{task.status="queued";task.nextAttemptAt=Date.now()+Math.min(3600000,30000*Math.pow(2,task.attempts-1));retried++;}
        await db.ref("notification_queue/"+item.uid+"/"+item.key).set(task);
        await auditEvent(db,item.uid,task.status==="failed"?"NOTIFICATION_CHANNEL_FAILED":"NOTIFICATION_RETRY_SCHEDULED",task.alert||null,task.channel+": "+task.lastError);
      }
    }
    const usersSnap=await db.ref("users").once("value");
    const users=usersSnap.val()||{};
    for(const uid of Object.keys(users)) {
      const profile=users[uid]||{};
      const alerts=profile.notificationCenter||{};
      for(const alertId of Object.keys(alerts)) {
        const alert=alerts[alertId];
        if(!alert || alert.status!=="open" || alert.ownerUid && alert.ownerUid!==uid || !alert.escalation || !alert.escalation.nextAt)continue;
        if(Date.parse(alert.escalation.nextAt)>Date.now())continue;
        await enqueueEscalation(db,uid,alert,users);
      }
    }
    return res.status(200).json({ok:true,processed:due.length,sent:sent,retried:retried,failed:failed,skipped:skipped});
  } catch(error) {
    console.error("ColdGuard notification worker failed",error.message);
    return res.status(500).json({error:"Notification worker failed."});
  } finally {
    await db.ref("notification_worker_lock").transaction(function(current) {
      return current && current.owner===lockOwner ? null : current;
    }).catch(function(){});
  }
};

function cryptoRandomId() {
  return require("crypto").randomBytes(16).toString("hex");
}
