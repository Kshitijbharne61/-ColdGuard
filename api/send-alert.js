const admin = require("firebase-admin");
function appAdmin() {
 if(admin.apps.length)return admin.app();
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
 if(!raw)throw Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
 let sa;try{sa=JSON.parse(raw);}catch(e){throw Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON");}
 admin.initializeApp({credential:admin.credential.cert(sa),databaseURL:process.env.FIREBASE_DATABASE_URL||"https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app"});
 return admin.app();
}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]);});}
module.exports=async function(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const key=process.env.RESEND_API_KEY,to=process.env.ALERT_EMAIL_TO,from=process.env.ALERT_FROM_EMAIL;
 if(!key||!to||!from)return res.status(503).json({error:"Email is not configured. Add RESEND_API_KEY, ALERT_EMAIL_TO, ALERT_FROM_EMAIL and FIREBASE_SERVICE_ACCOUNT_JSON in Vercel."});
 const h=req.headers.authorization||"",token=h.indexOf("Bearer ")===0?h.slice(7):"";
 if(!token)return res.status(401).json({error:"Sign in is required to send email alerts."});
 let user;try{user=await appAdmin().auth().verifyIdToken(token);}catch(e){console.error("ColdGuard auth verification failed",e.message);return res.status(503).json({error:"Firebase Admin authentication is not configured correctly in Vercel."});}
 const b=req.body||{},test=b.type==="test",id=String(b.shipmentId||"").slice(0,100);
 if(!test&&b.type!=="temperature_excursion")return res.status(400).json({error:"Unsupported alert type."});
 if(!test&&(!id||!Number.isFinite(Number(b.temperature))))return res.status(400).json({error:"Shipment ID and valid temperature are required."});
 const rows=test?[["Status","ColdGuard email delivery test passed"],["Requested by",user.email||user.uid],["Time",new Date().toISOString()]]:[["Shipment ID",id],["Product",b.vaccineName||"Unknown"],["Batch",b.batchNumber||"Not recorded"],["Temperature",Number(b.temperature)+" °C"],["Allowed range",b.minTemp+" °C to "+b.maxTemp+" °C"],["Location",b.location||"Not recorded"],["Destination",b.destination||"Not recorded"],["Detected at",b.detectedAt||new Date().toISOString()],["Operator",user.email||user.uid]];
 const html="<div style=\"font-family:Arial,sans-serif;color:#0f172a\"><h2 style=\"color:"+(test?"#047857":"#b91c1c")+"\">"+(test?"ColdGuard email test":"Temperature excursion detected")+"</h2><p>"+(test?"Email delivery is configured.":"A recorded shipment temperature is outside its configured operating range. Follow your cold-chain escalation procedure.")+"</p><table style=\"border-collapse:collapse;width:100%\">"+rows.map(function(r){return "<tr><th style=\"text-align:left;padding:9px;border:1px solid #e2e8f0;background:#f8fafc\">"+esc(r[0])+"</th><td style=\"padding:9px;border:1px solid #e2e8f0\">"+esc(r[1])+"</td></tr>";}).join("")+"</table><p style=\"font-size:12px;color:#64748b\">Verify source telemetry before making product-safety decisions.</p></div>";
 try{const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:from,to:[to],subject:test?"ColdGuard email alert test":"ColdGuard temperature excursion: "+id,html:html})});const out=await r.json().catch(function(){return {};});if(!r.ok){console.error("Resend failure",r.status,out);return res.status(502).json({error:out.message||"Email provider rejected the message; check the sender and API key."});}return res.status(200).json({ok:true,id:out.id,message:"Email sent"});}catch(e){console.error("Email request failed",e);return res.status(502).json({error:"Email provider could not be reached."});}
};