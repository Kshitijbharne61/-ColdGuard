// ============================================================================
// ColdGuard - Interactive GPS Route Tracking Component
// Leaflet Map with Custom High-Resolution Markers & Schematic Fallback
// ============================================================================

export class RouteMapView {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.layers = [];
    this.currentShipment = null;
    this.allCheckpoints = [];
    this.onSelectCheckpoint = options.onSelectCheckpoint || null;
    this.isLeafletLoaded = typeof window.L !== "undefined";

    this.init();
  }

  init() {
    const el = document.getElementById(this.containerId);
    if (!el) return;

    if (this.isLeafletLoaded && window.L) {
      try {
        this.map = window.L.map(this.containerId, {
          zoomControl: true,
          attributionControl: false
        }).setView([40.2, -77.5], 7);

        // Clean OpenStreetMap tiles with custom styling class
        window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          className: "map-tiles-clean",
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Window resize handler
        setTimeout(() => {
          if (this.map) this.map.invalidateSize();
        }, 200);
      } catch (err) {
        console.warn("Leaflet tile init error, falling back to schematic canvas", err);
        this.initSchematicFallback(el);
      }
    } else {
      this.initSchematicFallback(el);
    }
  }

  initSchematicFallback(container) {
    container.innerHTML = `
      <div class="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-slate-300">
        <canvas id="${this.containerId}-schematic-canvas" class="absolute inset-0 w-full h-full"></canvas>
        <div class="relative z-10 bg-slate-800/90 border border-slate-700 backdrop-blur px-4 py-2 rounded-lg text-xs flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Tactical Schematic Vector Map Active</span>
        </div>
      </div>
    `;
  }

  renderShipment(shipment, checkpoints) {
    this.currentShipment = shipment;
    this.allCheckpoints = checkpoints || [];

    if (this.map && window.L) {
      this.renderLeaflet(shipment, checkpoints);
    } else {
      this.renderCanvasSchematic(shipment, checkpoints);
    }
  }

  renderLeaflet(shipment, checkpoints) {
    if (!this.map) return;

    // Clear previous markers & polylines
    this.layers.forEach(l => {
      if (l && typeof l.remove === "function") l.remove();
      else this.map.removeLayer(l);
    });
    this.layers = [];

    const bounds = [];
    const liveLocation = shipment.location || {};
    const explicitNoFix = liveLocation.isLiveGps === true && liveLocation.hasFix === false;
    const gpsLatitude = explicitNoFix ? null : Number(liveLocation.latitude ?? shipment.gpsLatitude);
    const gpsLongitude = explicitNoFix ? null : Number(liveLocation.longitude ?? shipment.gpsLongitude);
    const hasValidGps = Number.isFinite(gpsLatitude) && Number.isFinite(gpsLongitude)
      && gpsLatitude >= -90 && gpsLatitude <= 90
      && gpsLongitude >= -180 && gpsLongitude <= 180;
    const isCritical = shipment.excursionSeverity === "Critical" || shipment.riskClassification === "Critical";
    const isWarning = shipment.excursionSeverity === "Warning" || shipment.riskClassification === "High Risk";
    const statusColor = isCritical ? "#EF4444" : (isWarning ? "#F59E0B" : "#10B981");

    // 1. Plot Checkpoints
    checkpoints.forEach(cp => {
      const isNearest = shipment.nearestCheckpointId === cp.id;
      const cpIcon = window.L.divIcon({
        className: "custom-cp-marker",
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-7 h-7 rounded-lg ${isNearest ? 'bg-indigo-600 ring-4 ring-indigo-300 ring-opacity-70 animate-bounce' : 'bg-slate-700 hover:bg-indigo-600'} text-white flex items-center justify-center shadow-md transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            ${isNearest ? '<span class="absolute -top-7 -left-10 bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">NEAREST HUB</span>' : ''}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = window.L.marker([cp.lat, cp.lng], { icon: cpIcon }).addTo(this.map);
      marker.bindPopup(`
        <div class="p-2 text-slate-800 font-sans max-w-xs">
          <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5">${cp.type}</div>
          <div class="font-bold text-sm text-slate-900">${cp.name}</div>
          <div class="text-xs text-slate-500 mt-1">${cp.city}</div>
          <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
            <div><span class="text-slate-400">Capacity:</span> <b>${(cp.availableCapacityDoses || 0).toLocaleString()} doses</b></div>
            <div><span class="text-slate-400">Distance:</span> <b>${cp.distanceKm} km</b></div>
            <div><span class="text-slate-400">Travel ETA:</span> <b>${cp.travelTimeMinutes} mins</b></div>
            <div><span class="text-slate-400">Status:</span> <b class="text-emerald-600">${cp.operatingStatus}</b></div>
          </div>
          <button id="btn-popup-reroute-${cp.id}" class="mt-3 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow transition flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
            Select for Reroute
          </button>
        </div>
      `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-popup-reroute-${cp.id}`);
        if (btn && this.onSelectCheckpoint) {
          btn.addEventListener("click", () => this.onSelectCheckpoint(cp));
        }
      });

      this.layers.push(marker);
      bounds.push([cp.lat, cp.lng]);
    });

    // 2. Plot Route Waypoints & Lines
    if (shipment.routeWaypoints && shipment.routeWaypoints.length >= 2) {
      const latlngs = shipment.routeWaypoints.map(w => [w.lat, w.lng]);

      // Planned route line
      const plannedLine = window.L.polyline(latlngs, {
        color: "#94A3B8",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.8
      }).addTo(this.map);
      this.layers.push(plannedLine);

      // Origin Pin
      const origin = shipment.routeWaypoints[0];
      const originIcon = window.L.divIcon({
        className: "custom-origin-marker",
        html: `
          <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center shadow text-[10px] font-bold">
            A
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const originMarker = window.L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(this.map);
      originMarker.bindTooltip(`Origin: ${origin.name || shipment.originFacility}`);
      this.layers.push(originMarker);

      // Destination Pin
      const dest = shipment.routeWaypoints[shipment.routeWaypoints.length - 1];
      const destIcon = window.L.divIcon({
        className: "custom-dest-marker",
        html: `
          <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow text-xs font-bold">
            🏁
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const destMarker = window.L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(this.map);
      destMarker.bindTooltip(`Destination: ${dest.name || shipment.destinationFacility}`);
      this.layers.push(destMarker);

      latlngs.forEach(ll => bounds.push(ll));
    }

    // 3. Line from current position to nearest checkpoint (requires a valid GPS fix)
    const nearest = checkpoints.find(c => c.id === shipment.nearestCheckpointId);
    if (nearest && hasValidGps) {
      const diversionLine = window.L.polyline([
        [gpsLatitude, gpsLongitude],
        [nearest.lat, nearest.lng]
      ], {
        color: "#6366F1",
        weight: 3,
        dashArray: "4, 4",
        opacity: 0.95
      }).addTo(this.map);
      this.layers.push(diversionLine);
    }

    // 4. Current position marker. Don't show stale/demo coordinates if the device
    // explicitly reports that it has no satellite fix.
    if (hasValidGps) {
    const vehicleIcon = window.L.divIcon({
      className: "custom-vehicle-marker",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full" style="background-color: ${statusColor}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div class="relative w-9 h-9 rounded-full border-2 border-white text-white flex items-center justify-center shadow-lg transition-transform" style="background-color: ${statusColor};">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const vehicleMarker = window.L.marker([gpsLatitude, gpsLongitude], { icon: vehicleIcon }).addTo(this.map);
    const gpsTime = liveLocation.lastUpdated ? new Date(liveLocation.lastUpdated).toLocaleString() : "Not reported";
    vehicleMarker.bindPopup(`
      <div class="p-2 text-slate-800 font-sans max-w-xs">
        <div class="flex items-center gap-1.5 font-bold text-sm text-slate-900">
          <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${statusColor}"></span>
          ${shipment.id} — ${shipment.vaccineName || "Shipment"}
        </div>
        <div class="text-xs text-slate-500 mt-1">${shipment.currentLocation || "Live sensor location"}</div>
        <div class="mt-2 text-xs font-mono">${gpsLatitude.toFixed(6)}, ${gpsLongitude.toFixed(6)}</div>
        <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
          <div><span class="text-slate-400">Current Temp:</span> <b class="font-mono ${isCritical ? 'text-red-600' : 'text-slate-800'}">${shipment.currentTemperature ?? "—"}°C</b></div>
          <div><span class="text-slate-400">Viability:</span> <b>${shipment.estimatedViabilityPercent ?? "—"}%</b></div>
          <div><span class="text-slate-400">GPS speed:</span> <b>${liveLocation.speedKmH ?? "—"} km/h</b></div>
          <div><span class="text-slate-400">Satellites:</span> <b>${liveLocation.satellites ?? "—"}</b></div>
          <div><span class="text-slate-400">GPS updated:</span> <b>${gpsTime}</b></div>
          <div><span class="text-slate-400">Status:</span> <b>${shipment.status || "Tracking"}</b></div>
        </div>
      </div>
    `);
    this.layers.push(vehicleMarker);
    bounds.push([gpsLatitude, gpsLongitude]);
    } else {
      const gpsNotice = window.L.control({ position: "topright" });
      gpsNotice.onAdd = () => {
        const div = window.L.DomUtil.create("div", "leaflet-bar");
        div.style.cssText = "background:#fff;padding:8px 10px;border-radius:8px;font-size:11px;color:#b45309;max-width:220px;box-shadow:0 1px 5px #0002";
        div.textContent = "GPS fix unavailable — waiting for sensor coordinates";
        return div;
      };
      gpsNotice.addTo(this.map);
      this.layers.push(gpsNotice);
    }

    // Fit map bounds smoothly
    if (bounds.length > 0) {
      try {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      } catch (e) {
        // Safe catch
      }
    }
  }

  renderCanvasSchematic(shipment, checkpoints) {
    const canvas = document.getElementById(`${this.containerId}-schematic-canvas`);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    // Dark grid background
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = "#1E293B";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Planned highway corridor (sinusoidal schematic)
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.7);
    ctx.bezierCurveTo(w * 0.35, h * 0.85, w * 0.65, h * 0.25, w * 0.9, h * 0.35);
    ctx.stroke();

    // Actual path traveled
    ctx.strokeStyle = "#2563EB";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.7);
    ctx.bezierCurveTo(w * 0.3, h * 0.8, w * 0.45, h * 0.6, w * 0.52, h * 0.5);
    ctx.stroke();

    // Checkpoints
    ctx.fillStyle = "#6366F1";
    checkpoints.slice(0, 5).forEach((cp, idx) => {
      const cx = w * (0.2 + idx * 0.16);
      const cy = h * (0.3 + (idx % 2) * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#94A3B8";
      ctx.font = "10px Inter, sans-serif";
      ctx.fillText(cp.id, cx - 12, cy - 12);
    });

    // Current Vehicle Position
    const vx = w * 0.52;
    const vy = h * 0.5;
    const isCritical = shipment.excursionSeverity === "Critical";
    ctx.fillStyle = isCritical ? "#EF4444" : "#10B981";
    ctx.beginPath();
    ctx.arc(vx, vy, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.fillText(`${shipment.id} (${shipment.currentTemperature}°C)`, vx - 40, vy + 24);
  }
}
