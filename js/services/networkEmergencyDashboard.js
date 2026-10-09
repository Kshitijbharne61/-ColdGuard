/* ColdGuard network outage dashboard. Backend monitoring continues when the browser is closed. */
(() => {
  "use strict";
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const mins = v => v === null || v === undefined ? "No timestamp" : v < 1 ? "less than 1 min" : Math.round(v) + " min";
  let loading = false;
  let lastData = null;
  let timer = null;

  async function api(action, payload) {
    const user = window.firebase?.auth?.().currentUser;
    if (!user) throw new Error("Sign in to view network monitoring.");
    const token = await user.getIdToken();
    const response = await fetch("/api/network-alerts", {
      method: action ? "POST" : "GET",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json", Accept: "application/json" },
      body: action ? JSON.stringify({ action, ...payload }) : undefined
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Network monitoring request failed.");
    return data;
  }

  function statusLabel(status) {
    return ({ online:"Online", network_unstable:"Network unstable", offline:"Offline", emergency:"Emergency", unknown:"Unknown" })[status] || status;
  }
  function statusClass(status) {
    return status === "online" ? "bg-emerald-100 text-emerald-800" :
      status === "network_unstable" ? "bg-amber-100 text-amber-800" :
      status === "offline" ? "bg-orange-100 text-orange-800" :
      status === "emergency" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700";
  }
  function render(data, error) {
    const main = document.getElementById("main-content-view");
    const kpis = main?.querySelector("#kpi-cards-grid");
    if (!main || !kpis) return;
    let root = document.getElementById("coldguard-network-emergency");
    if (!root) {
      root = document.createElement("section");
      root.id = "coldguard-network-emergency";
      kpis.parentElement.insertAdjacentElement("afterend", root);
    }
    if (error) {
      root.innerHTML = '<section class="mt-5 rounded-2xl border border-amber-200 bg-white p-5"><h2 class="text-base font-extrabold text-slate-900">Network & Emergency Monitoring</h2><p class="mt-2 text-sm text-amber-800">'+esc(error)+'</p><button id="cg-network-refresh" class="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">Retry</button></section>';
      root.querySelector("#cg-network-refresh")?.addEventListener("click", refresh);
      return;
    }
    if (!data) return;
    lastData = data;
    const counts = data.counts || {};
    const vehicles = data.vehicles || [];
    const active = vehicles.filter(v => ["network_unstable","offline","emergency","unknown"].includes(v.status));
    const events = data.events || [];
    const cards = [
      ["Online", counts.online || 0, "text-emerald-700"],
      ["Unstable", counts.network_unstable || 0, "text-amber-700"],
      ["Offline", counts.offline || 0, "text-orange-700"],
      ["Emergency", counts.emergency || 0, "text-red-700"]
    ];
    root.innerHTML = `
      <section class="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><div class="text-[11px] font-bold uppercase tracking-widest text-blue-600">Fleet reliability</div><h2 class="mt-1 text-lg font-extrabold text-slate-900">Network & Emergency Monitoring</h2><p class="mt-1 text-xs text-slate-500">Server-side monitoring continues when this dashboard is closed.</p></div>
          <div class="flex gap-2"><button id="cg-network-refresh" class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Refresh</button>${data.isAdmin ? '<button id="cg-network-test" class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Send Test Alert</button>' : ''}</div>
        </div>
        <div class="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">${cards.map(c=>'<div class="rounded-xl border border-slate-200 p-3"><div class="text-xs text-slate-500">'+c[0]+'</div><div class="mt-1 text-2xl font-extrabold '+c[2]+'">'+c[1]+'</div></div>').join("")}</div>
        <div class="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
          <div><h3 class="mb-2 text-sm font-bold text-slate-900">Vehicle status & last known telemetry</h3><div class="space-y-2">${active.length ? active.map(v=>{
            const loc=v.lastKnownLocation;
            const map=loc ? 'https://maps.google.com/?q='+encodeURIComponent(loc.latitude+','+loc.longitude) : '';
            return '<article class="rounded-xl border border-slate-200 p-3"><div class="flex flex-wrap items-center justify-between gap-2"><div class="font-bold text-sm">'+esc(v.shipmentId)+' · '+esc(v.vaccineName)+'</div><span class="rounded-full px-2 py-1 text-[10px] font-bold '+statusClass(v.status)+'">'+esc(statusLabel(v.status))+'</span></div><div class="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2"><div>Driver: '+esc(v.driverName)+'</div><div>Outage: '+esc(mins(v.ageMinutes))+'</div><div>Last temperature: '+(v.lastTemperature===null?'Unavailable':esc(v.lastTemperature+'°C'))+' ('+esc(v.temperatureStatus)+')</div><div>Last update: '+esc(v.lastSensorUpdate?new Date(v.lastSensorUpdate).toLocaleString():'Not supplied')+'</div></div><div class="mt-2 flex items-center justify-between gap-2 text-xs">'+(loc&&map?'<a class="text-blue-700 underline" target="_blank" rel="noopener noreferrer" href="'+map+'">Last known location ↗</a>':'<span class="text-slate-500">GPS location unavailable</span>')+'<span class="text-slate-500">SMS: '+esc(v.notificationStatus)+'</span></div></article>';
          }).join("") : '<div class="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">No active network warnings based on available timestamps.</div>'}</div></div>
          <div><h3 class="mb-2 text-sm font-bold text-slate-900">Notification & escalation history</h3><div class="max-h-96 space-y-2 overflow-y-auto">${events.length ? events.map(e=>'<article class="rounded-xl border border-slate-200 p-3"><div class="flex flex-wrap items-center justify-between gap-2"><div class="text-xs font-bold">'+esc(e.shipmentId)+' · '+esc(e.type)+'</div><span class="text-[10px] font-semibold '+(e.status==='sent_or_partially_sent'?'text-emerald-700':'text-amber-700')+'">'+esc(e.status||'unknown')+'</span></div><div class="mt-1 text-[11px] text-slate-500">'+esc(e.createdAt?new Date(e.createdAt).toLocaleString():'Timestamp unavailable')+' · '+esc(e.outageMinutes===undefined?'':e.outageMinutes+' min')+'</div><div class="mt-1 text-xs text-slate-600">'+esc((e.delivery||[]).map(d=>d.role+': '+d.status+(d.error?' ('+d.error+')':'')).join(' · ')||'No delivery details')+'</div>'+(data.isAdmin && !e.acknowledged && e.type!=='TEST_ALERT' ? '<button data-ack="'+esc(e.eventId)+'" class="mt-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Acknowledge</button>' : '<div class="mt-2 text-[10px] text-slate-500">'+(e.acknowledged?'Acknowledged':'')+'</div>')+'</article>').join("") : '<div class="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No notification events recorded yet.</div>'}</div></div>
        </div>
        <div class="border-t border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">Default thresholds: ${data.thresholds.warningMinutes} min warning · ${data.thresholds.notifyMinutes} min notify · ${data.thresholds.escalateMinutes} min escalation. Missing timestamps are Unknown, not automatically an emergency. Delivery status reflects provider acceptance, not proof the recipient read the SMS.</div>
        <div id="cg-network-message" class="px-4 pb-4 text-sm" role="status"></div>
      </section>`;
    root.querySelector("#cg-network-refresh")?.addEventListener("click", refresh);
    root.querySelector("#cg-network-test")?.addEventListener("click", async () => {
      if (!data.isAdmin) return;
      const shipmentId = window.prompt("Enter an existing shipment ID for the SMS delivery test:");
      if (!shipmentId) return;
      if (!window.confirm("Send a REAL test SMS to the configured contacts for "+shipmentId+"? This is not an emergency alert.")) return;
      const msg = root.querySelector("#cg-network-message");
      if(msg)msg.textContent="Sending test alert…";
      try { const result=await api("test",{shipmentId}); if(msg)msg.textContent="Test alert recorded. Results: "+result.delivery.map(d=>d.role+": "+d.status).join(", "); await refresh(); }
      catch(e){ if(msg)msg.textContent=e.message; }
    });
    root.querySelectorAll("[data-ack]").forEach(button=>button.addEventListener("click",async()=>{
      button.disabled=true;
      const msg=root.querySelector("#cg-network-message");
      try { await api("acknowledge",{eventId:button.getAttribute("data-ack")}); if(msg)msg.textContent="Alert acknowledged."; await refresh(); }
      catch(e){button.disabled=false;if(msg)msg.textContent=e.message;}
    }));
  }
  async function refresh() {
    if (loading) return;
    loading=true;
    try { const data=await api(); render(data); }
    catch(error) { render(null,error.message||"Network monitoring is unavailable."); }
    finally { loading=false; }
  }
  function start() {
    const main=document.getElementById("main-content-view");
    if(main&&window.MutationObserver) new MutationObserver(()=>{if(main.querySelector("#kpi-cards-grid")&&!document.getElementById("coldguard-network-emergency"))refresh();}).observe(main,{childList:true,subtree:true});
    if(window.firebase?.auth) window.firebase.auth().onAuthStateChanged(user=>{if(user)refresh();else{const node=document.getElementById("coldguard-network-emergency");if(node)node.remove();}});
    if(!timer)timer=window.setInterval(()=>{if(document.getElementById("coldguard-network-emergency"))refresh();},60000);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
  window.coldGuardNetworkMonitor={refresh};
})();
