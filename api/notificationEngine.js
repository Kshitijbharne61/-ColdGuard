"use strict";

const crypto = require("crypto");
const admin = require("firebase-admin");

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
  });
}
function base64url(value) { return Buffer.from(value).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_"); }
function adminDatabase() {
  try {
    let credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!credential) return null;
    if (credential.trim().startsWith("base64:")) credential = Buffer.from(credential.trim().slice(7), "base64").toString("utf8");
    const serviceAccount = JSON.parse(credential);
    if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    if (!admin.apps.length) admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
    return admin.database();
  } catch (error) {
    console.error("ColdGuard notification admin database unavailable", error.message);
    return null;
  }
}
function databaseUrl() {
  return (process.env.FIREBASE_DATABASE_URL || "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app").replace(/\/+$/,"");
}
function encodePath(path) { return String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/"); }

async function dbRead(path, token) {
  const db = adminDatabase();
  if (db) return (await db.ref(path).once("value")).val();
  if (!token) return null;
  const response = await fetch(databaseUrl() + "/" + encodePath(path) + ".json?auth=" + encodeURIComponent(token));
  if (!response.ok) throw new Error("Firebase read failed (" + response.status + ").");
  return response.json();
}
async function dbWrite(path, value, token) {
  const db = adminDatabase();
  if (db) { await db.ref(path).set(value); return true; }
  if (!token) return false;
  const response = await fetch(databaseUrl() + "/" + encodePath(path) + ".json?auth=" + encodeURIComponent(token), {
    method:"PUT", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(value)
  });
  if (!response.ok) throw new Error("Firebase write failed (" + response.status + ").");
  return true;
}
async function dbPush(path, value, token) {
  const db = adminDatabase();
  if (db) { const ref = db.ref(path).push(); await ref.set(value); return ref.key; }
  if (!token) return null;
  const response = await fetch(databaseUrl() + "/" + encodePath(path) + ".json?auth=" + encodeURIComponent(token), {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(value)
  });
  if (!response.ok) throw new Error("Firebase write failed (" + response.status + ").");
  const data = await response.json();
  return data.name || null;
}
async function verifyFirebaseToken(token) {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) throw Object.assign(new Error("Missing FIREBASE_WEB_API_KEY."), { statusCode:503 });
  const response = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(key), {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ idToken:token })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.users || !data.users.length) throw Object.assign(new Error("Firebase session is invalid or expired."), { statusCode:401 });
  return { uid:data.users[0].localId, email:data.users[0].email || "", displayName:data.users[0].displayName || "" };
}
function providerConfig() {
  const email = !!(process.env.BREVO_API_KEY && process.env.ALERT_FROM_EMAIL);
  const sms = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
  const whatsapp = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
  const telegram = !!process.env.TELEGRAM_BOT_TOKEN;
  const push = !!(process.env.FCM_PROJECT_ID && process.env.FCM_CLIENT_EMAIL && process.env.FCM_PRIVATE_KEY);
  const providers = { email:email, sms:sms, whatsapp:whatsapp, telegram:telegram, push:push, in_app:true, daily_digest:email, weekly_digest:email };
  return { providers:providers, demoMode:!email && !sms && !whatsapp && !telegram && !push, durableQueueReady:!!adminDatabase() };
}
function baseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/,"");
  if (process.env.VERCEL_URL) return "https://" + process.env.VERCEL_URL.replace(/^https?:\/\//,"").replace(/\/+$/,"");
  return "https://12-r08ovvold-kshitijbharne.vercel.app";
}
function signActionToken(uid, alertId, expiresAt) {
  const secret = process.env.NOTIFICATION_ACTION_SECRET;
  if (!secret) return null;
  const payload = String(uid) + ":" + String(alertId) + ":" + String(expiresAt);
  return base64url(payload) + "." + crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}
function verifyActionToken(uid, alertId, expiresAt, token) {
  const secret = process.env.NOTIFICATION_ACTION_SECRET;
  if (!secret || !token || !/^\d+$/.test(String(expiresAt))) return false;
  if (Number(expiresAt) < Date.now() || Number(expiresAt) > Date.now() + 31 * 60 * 1000) return false;
  const payload = String(uid) + ":" + String(alertId) + ":" + String(expiresAt);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const actual = String(token).split(".").pop();
  try {
    return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch (_) { return false; }
}
function linksFor(alert, uid, req) {
  const base = baseUrl(req);
  const view = base + "/index.html#details?id=" + encodeURIComponent(alert.shipmentId || "");
  const reroute = base + "/index.html#details?id=" + encodeURIComponent(alert.shipmentId || "") + "&modal=reroute";
  let acknowledge = base + "/index.html#alert_center";
  const expiresAt = Date.now() + 30 * 60 * 1000;
  const token = signActionToken(uid, alert.id, expiresAt);
  if (token && adminDatabase()) acknowledge = base + "/api/notifications?action=ack&uid=" + encodeURIComponent(uid) + "&alertId=" + encodeURIComponent(alert.id) + "&exp=" + expiresAt + "&token=" + encodeURIComponent(token);
  return { view:view, acknowledge:acknowledge, reroute:reroute, expiresAt:expiresAt };
}
function compactText(alert, viewLink) {
  const unit = alert.valueUnit === "% RH" ? "%RH" : alert.valueUnit === "% battery" ? "%" : "C";
  const value = alert.currentValue == null ? alert.typeLabel || alert.type : Number(alert.currentValue).toFixed(1) + unit;
  const limitValue = alert.maximum == null ? "" : " (limit " + alert.maximum + ")";
  const spoil = alert.timeToSpoilageMinutes == null ? "" : ". ~" + alert.timeToSpoilageMinutes + " min to spoilage";
  let text = alert.shortText || (alert.severity + " " + alert.shipmentId + " " + value + limitValue + spoil + ". Open: " + viewLink);
  if (text.length > 159) text = text.slice(0, 156) + "...";
  return text;
}
function metric(label, value) {
  return '<td style="width:50%;padding:10px 12px;border:1px solid #dbe4ef;background:#f8fafc;color:#334155;font:12px Arial,sans-serif"><div style="font-size:10px;font-weight:bold;letter-spacing:.07em;color:#64748b">' + esc(label.toUpperCase()) + '</div><div style="padding-top:5px;font-size:19px;font-weight:bold;color:#0f172a">' + esc(value || "Not available") + '</div></td>';
}
function emailContent(alert, links, channels) {
  const color = alert.severity === "CRITICAL" ? "#b4233c" : alert.severity === "WARNING" ? "#a16207" : "#1d4ed8";
  const soft = alert.severity === "CRITICAL" ? "#fef2f2" : alert.severity === "WARNING" ? "#fffbeb" : "#eff6ff";
  const point = alert.coordinates && Number.isFinite(Number(alert.coordinates.lat)) && Number.isFinite(Number(alert.coordinates.lon)) ? alert.coordinates : null;
  const mapThumb = point ? "https://staticmap.openstreetmap.de/staticmap.php?center=" + encodeURIComponent(point.lat + "," + point.lon) + "&zoom=10&size=640x180&markers=" + encodeURIComponent(point.lat + "," + point.lon + ",red-pushpin") : "";
  const spark = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="88" viewBox="0 0 640 88"><rect width="640" height="88" rx="8" fill="#f8fafc"/><path d="M12 60 L48 55 L84 64 L120 43 L156 47 L192 39 L228 53 L264 27 L300 34 L336 18 L372 32 L408 23 L444 48 L480 30 L516 34 L552 13 L588 22 L628 8" fill="none" stroke="' + color + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const sparkData = "data:image/svg+xml;base64," + Buffer.from(spark).toString("base64");
  const rows = metric("Current value", alert.currentValue == null ? "Not available" : Number(alert.currentValue).toFixed(1) + (alert.valueUnit || "°C")) +
    metric("Permitted range", alert.permittedRange || "Not configured");
  const rows2 = metric("Time out of range", (alert.durationMinutes || 0) + " min") +
    metric("Current viability", alert.viabilityPercent == null ? "Not available" : alert.viabilityPercent + "%");
  const subject = alert.title || (alert.severity + ": " + alert.shipmentId + " " + (alert.vaccine || "shipment"));
  const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><style>@media(max-width:600px){.cg-wrap{width:100%!important}.cg-pad{padding:16px!important}.cg-cta a{display:block!important;margin:8px 0!important}}</style></head><body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f4f7fb;padding:18px 0"><tr><td align="center"><table role="presentation" class="cg-wrap" cellpadding="0" cellspacing="0" width="640" style="width:100%;max-width:640px;background:#fff;border:1px solid #dbe4ef;border-radius:14px;overflow:hidden"><tr><td style="padding:22px 24px;background:#0f172a;color:#fff"><div style="font-size:19px;font-weight:bold;letter-spacing:-.03em">❄ ColdGuard</div><div style="margin-top:4px;color:#cbd5e1;font-size:10px;letter-spacing:.12em">PROTECT EVERY DOSE. PREDICT EVERY EXCURSION.</div></td></tr><tr><td style="padding:13px 24px;background:' + soft + ';border-left:5px solid ' + color + ';color:' + color + ';font-weight:bold;font-size:13px">' + esc(alert.severity) + ' · ' + esc(alert.typeLabel || alert.type) + '</td></tr><tr><td class="cg-pad" style="padding:24px"><h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;color:#0f172a">' + esc(subject) + '</h1><p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#334155">' + esc(alert.body || "") + '</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 18px"><tr>' + rows + '</tr><tr>' + rows2 + '</tr></table><h2 style="font-size:13px;color:#334155;margin:20px 0 10px">Temperature trend · last 30 minutes</h2><img alt="Illustrative temperature sparkline" src="' + sparkData + '" width="100%" style="display:block;width:100%;height:auto;border-radius:8px;border:1px solid #e2e8f0">' + (mapThumb ? '<a href="' + esc(alert.mapLink || links.view) + '" style="display:block;margin-top:18px"><img src="' + esc(mapThumb) + '" width="100%" alt="Map thumbnail for ' + esc(alert.location || "shipment location") + '" style="display:block;width:100%;max-height:180px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0"></a>' : "") + '<p style="font-size:13px;line-height:1.6;color:#334155"><strong>Location:</strong> ' + esc(alert.location || "Not recorded") + ' · <a href="' + esc(alert.mapLink || links.view) + '" style="color:#1d4ed8">Open map</a><br><strong>Detected:</strong> ' + esc(alert.detectedLocal || new Date(alert.detectedAt || Date.now()).toLocaleString()) + '<br><strong>One recommended action:</strong> ' + esc(alert.recommendation || "Review the shipment and verify source telemetry.") + '</p><table role="presentation" class="cg-cta" cellpadding="0" cellspacing="0" style="margin:24px 0 12px"><tr><td style="padding:0 8px 8px 0"><a href="' + esc(links.view) + '" style="display:inline-block;background:#2563eb;border-radius:8px;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;padding:12px 15px">View Shipment</a></td><td style="padding:0 8px 8px 0"><a href="' + esc(links.acknowledge) + '" style="display:inline-block;background:#fff;border:1px solid #cbd5e1;border-radius:8px;color:#0f172a;text-decoration:none;font-size:13px;font-weight:bold;padding:11px 14px">Acknowledge</a></td><td style="padding:0 0 8px"><a href="' + esc(links.reroute) + '" style="display:inline-block;background:#312e81;border-radius:8px;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;padding:12px 15px">Reroute / Stopover</a></td></tr></table><p style="font-size:11px;line-height:1.5;color:#64748b">SMS/push channels receive only the minimal shipment ID, current value and short action link. Predictions are operational estimates; verify telemetry before product-safety decisions.</p></td></tr><tr><td style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;line-height:1.7">Alert ID: ' + esc(alert.id) + '<br><a href="' + esc(baseUrl({headers:{host:""} } ) + "/index.html#notification_settings") + '" style="color:#1d4ed8">Manage preferences</a> · <a href="' + esc(links.view + "&mute=" + encodeURIComponent(alert.id)) + '" style="color:#1d4ed8">Mute this alert</a><br>ColdGuard · Cold-chain monitoring</td></tr></table><p style="font-size:10px;color:#64748b">This is an automated monitoring message.</p></td></tr></table></body></html>';
  const text = subject + "\n\n" + (alert.body || "") + "\n\nShipment: " + (alert.shipmentId || "") + "\nVaccine: " + (alert.vaccine || "") + "\nCurrent value: " + (alert.currentValue == null ? "Not available" : alert.currentValue + (alert.valueUnit || "°C")) + "\nPermitted range: " + (alert.permittedRange || "Not configured") + "\nDeviation: " + (alert.deviationText || "Not available") + "\nTime out of range: " + (alert.durationMinutes || 0) + " minutes\nPredicted time to spoilage: " + (alert.timeToSpoilageMinutes == null ? "Not available" : alert.timeToSpoilageMinutes + " minutes") + "\nViability: " + (alert.viabilityPercent == null ? "Not available" : alert.viabilityPercent + "%") + "\nLocation: " + (alert.location || "Not recorded") + "\nMap: " + (alert.mapLink || links.view) + "\nTimestamp: " + (alert.detectedLocal || alert.detectedAt || "") + "\nRecommended action: " + (alert.recommendation || "") + "\n\nView Shipment: " + links.view + "\nAcknowledge: " + links.acknowledge + "\nReroute / Stopover: " + links.reroute + "\nAlert ID: " + alert.id;
  return { subject:subject, html:html, text:text };
}
async function sendBrevo(email, content) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method:"POST", headers:{ "api-key":process.env.BREVO_API_KEY, "Content-Type":"application/json", "Accept":"application/json" },
    body:JSON.stringify({ sender:{ name:process.env.ALERT_FROM_NAME || "ColdGuard Alerts", email:process.env.ALERT_FROM_EMAIL }, to:[{ email:email }], subject:content.subject, htmlContent:content.html, textContent:content.text })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Email provider rejected the message (" + response.status + ").");
  return body.messageId || "accepted";
}
async function sendTwilio(to, body, from, isWhatsApp) {
  const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN;
  const response=await fetch("https://api.twilio.com/2010-04-01/Accounts/"+encodeURIComponent(sid)+"/Messages.json", {
    method:"POST", headers:{ "Authorization":"Basic "+Buffer.from(sid+":"+token).toString("base64"), "Content-Type":"application/x-www-form-urlencoded" },
    body:new URLSearchParams({ To:(isWhatsApp && !String(to).startsWith("whatsapp:") ? "whatsapp:"+to : to), From:(isWhatsApp && !String(from).startsWith("whatsapp:") ? "whatsapp:"+from : from), Body:body }).toString()
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.message || "Twilio rejected the message ("+response.status+").");
  return data.sid || "accepted";
}
async function sendTelegram(chatId, alert, links) {
  const text=compactText(alert, links.view) + "\n" + (alert.type==="ROUTE_RISK" ? "Region: "+alert.region+". Suggested route: "+alert.suggestedRoute : alert.type==="SENSOR_FAULT" ? "Suspect sensor: "+alert.suspectSensor+". Delta: "+alert.deviationText : "");
  const response=await fetch("https://api.telegram.org/bot"+process.env.TELEGRAM_BOT_TOKEN+"/sendMessage", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ chat_id:chatId, text:text.slice(0,4096), disable_web_page_preview:true }) });
  const data=await response.json().catch(()=>({}));
  if(!response.ok || !data.ok) throw new Error(data.description || "Telegram delivery failed.");
  return String(data.result && data.result.message_id || "accepted");
}
async function fcmAccessToken() {
  const email=process.env.FCM_CLIENT_EMAIL, privateKey=String(process.env.FCM_PRIVATE_KEY || "").replace(/\\n/g,"\n");
  const now=Math.floor(Date.now()/1000);
  const header=base64url(JSON.stringify({ alg:"RS256", typ:"JWT" }));
  const claim=base64url(JSON.stringify({ iss:email, scope:"https://www.googleapis.com/auth/firebase.messaging", aud:"https://oauth2.googleapis.com/token", iat:now, exp:now+3600 }));
  const unsigned=header+"."+claim;
  const signature=crypto.createSign("RSA-SHA256").update(unsigned).end().sign(privateKey).toString("base64url");
  const assertion=unsigned+"."+signature;
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:assertion}).toString()});
  const data=await response.json().catch(()=>({}));
  if(!response.ok || !data.access_token) throw new Error("FCM OAuth token request failed.");
  return data.access_token;
}
async function sendFcm(registrationToken, alert, links) {
  const access=await fcmAccessToken();
  const response=await fetch("https://fcm.googleapis.com/v1/projects/"+encodeURIComponent(process.env.FCM_PROJECT_ID)+"/messages:send",{
    method:"POST",headers:{"Authorization":"Bearer "+access,"Content-Type":"application/json"},
    body:JSON.stringify({message:{token:registrationToken,notification:{title:alert.title,body:compactText(alert,links.view).slice(0,160)},data:{alertId:String(alert.id),shipmentId:String(alert.shipmentId||""),acknowledgeUrl:links.acknowledge,viewUrl:links.view,rerouteUrl:links.reroute},android:{priority:alert.severity==="CRITICAL"?"HIGH":"NORMAL"}}})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error && data.error.message || "FCM rejected the push.");
  return data.name || "accepted";
}
async function sendChannel(channel, alert, recipients, links) {
  if (channel === "email") {
    if (!process.env.BREVO_API_KEY || !process.env.ALERT_FROM_EMAIL || !recipients.email) throw new Error("Email provider or recipient is not configured.");
    return sendBrevo(recipients.email, emailContent(alert, links));
  }
  if (channel === "sms") {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER || !recipients.phone) throw new Error("SMS provider or recipient is not configured.");
    return sendTwilio(recipients.phone, compactText(alert, links.view), process.env.TWILIO_FROM_NUMBER, false);
  }
  if (channel === "whatsapp") {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_FROM || !recipients.whatsappPhone) throw new Error("WhatsApp provider or recipient is not configured.");
    return sendTwilio(recipients.whatsappPhone, compactText(alert, links.view), process.env.TWILIO_WHATSAPP_FROM, true);
  }
  if (channel === "telegram") {
    if (!process.env.TELEGRAM_BOT_TOKEN || !recipients.telegramChatId) throw new Error("Telegram provider or chat ID is not configured.");
    return sendTelegram(recipients.telegramChatId, alert, links);
  }
  if (channel === "push") {
    if (!recipients.pushToken) throw new Error("No push registration token is configured for this user.");
    return sendFcm(recipients.pushToken, alert, links);
  }
  throw new Error("Unsupported notification channel: " + channel);
}
function channelAvailable(channel, recipients) {
  const c=providerConfig().providers;
  return !!c[channel] && (channel==="email"?!!recipients.email:channel==="sms"?!!recipients.phone:channel==="whatsapp"?!!recipients.whatsappPhone:channel==="telegram"?!!recipients.telegramChatId:channel==="push"?!!recipients.pushToken:false);
}
function fallbackFor(channel) {
  return ({ email:["sms","telegram"], push:["sms","telegram","email"], sms:["telegram","whatsapp","email"], telegram:["sms","email"], whatsapp:["sms","telegram","email"] })[channel] || [];
}
async function deliverWithRetry(channel, alert, recipients, links) {
  let last;
  for (let attempt=0;attempt<3;attempt++) {
    try {
      const providerId=await sendChannel(channel,alert,recipients,links);
      return {status:"sent",attempts:attempt+1,providerId:providerId,updatedAt:new Date().toISOString(),note:"Provider accepted the message; recipient delivery receipt may be asynchronous."};
    } catch(error) {
      last=error;
      if(attempt<2) await new Promise(resolve=>setTimeout(resolve,250*Math.pow(2,attempt)));
    }
  }
  return {status:"failed",attempts:3,updatedAt:new Date().toISOString(),note:String(last && last.message || "Provider failed.")};
}
module.exports = {
  esc, adminDatabase, dbRead, dbWrite, dbPush, verifyFirebaseToken, providerConfig, baseUrl,
  signActionToken, verifyActionToken, linksFor, compactText, emailContent, sendChannel, channelAvailable,
  fallbackFor, deliverWithRetry, encodePath
};
