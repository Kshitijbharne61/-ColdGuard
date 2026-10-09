// ============================================================================
// ColdGuard - Main Application Controller
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================

import { VACCINE_PROFILES, CHECKPOINTS, INITIAL_SHIPMENTS } from "./data/mockData.js";
import { SimulationEngine } from "./engine/simulationEngine.js";
import { RouteMapView } from "./components/mapView.js";
import { TelemetryCharts } from "./components/charts.js";
import { ModalManager } from "./components/modals.js";
import { ViabilityModel } from "./engine/viabilityModel.js";
import { FirebaseAuthService } from "./auth/firebaseAuth.js";
import { FirebaseDatabaseService } from "./database/firebaseDatabase.js";
import { AuthUiManager } from "./auth/authUi.js";

class ColdGuardApp {
  constructor() {
    this.vaccineProfiles = JSON.parse(JSON.stringify(VACCINE_PROFILES));
    this.checkpoints = CHECKPOINTS;
    this.currentView = "dashboard"; // "dashboard" | "shipments" | "details" | "excursion_engine" | "viability_lab" | "checkpoints"
    this.selectedShipmentId = "CG-9021-PFZ"; // default critical shipment
    this.soundAlertsEnabled = false;

    // Filters for Shipment table
    this.filters = {
      searchQuery: "",
      category: "all",
      status: "all",
      riskLevel: "all"
    };

    // Components
    this.modals = new ModalManager(this);
    this.charts = new TelemetryCharts();
    this.mapView = null;

    // Audio context for alert beeps
    this.audioCtx = null;

    // Initialize Simulation Engine
    this.simulation = new SimulationEngine(
      INITIAL_SHIPMENTS,
      this.vaccineProfiles,
      (updatedShipments) => this.onSimulationTick(updatedShipments)
    );

    // Authentication & Database Services
    this.authService = new FirebaseAuthService();
    this.dbService = new FirebaseDatabaseService(this.authService);
    this.lastRtdbSyncTime = 0;
    this.remoteAlerts = [];
    this.authUi = new AuthUiManager(this.authService, (user) => this.onAuthSuccess(user));
    this.currentUser = null;

    this.init();
  }

  init() {
    this.bindHeaderControls();
    this.bindNavigation();
    this.bindGlobalKeyboardShortcuts();
    this.parseHashRoute();
    window.addEventListener("hashchange", () => {
      this.parseHashRoute();
      if (this.currentUser) {
        this.renderCurrentView();
      }
    });

    // Listen for Firebase Auth State changes
    this.authService.onAuthStateChanged((user) => {
      this.handleAuthStateChanged(user);
    });

    // Listen for Realtime Database changes
    if (this.dbService) {
      this.dbService.on("shipments", (remoteShipments) => {
        this.handleRemoteShipments(remoteShipments);
      });
      this.dbService.on("alerts", (remoteAlerts) => {
        this.handleRemoteAlerts(remoteAlerts);
      });
      this.dbService.on("thresholds", (remoteThresholds) => {
        if (remoteThresholds) {
          this.vaccineProfiles = { ...this.vaccineProfiles, ...remoteThresholds };
          this.simulation.profiles = this.vaccineProfiles;
        }
      });
    }
  }

  handleAuthStateChanged(user) {
    if (!user && this.currentUser && this.currentUser.isDemo) {
      return; // Preserve active demo session
    }
    this.currentUser = user;
    const authContainer = document.getElementById("auth-view-container");
    const dashboardContainer = document.getElementById("dashboard-app-container");

    if (user) {
      if (authContainer) {
        authContainer.classList.add("hidden");
        authContainer.style.display = "none";
      }
      if (dashboardContainer) {
        dashboardContainer.classList.remove("hidden");
        dashboardContainer.style.display = "flex";
      }

      this.updateUserBadge(user);
      this.bindUserControls();
      this.simulation.start();
      this.renderCurrentView();
    } else {
      if (dashboardContainer) {
        dashboardContainer.classList.add("hidden");
        dashboardContainer.style.display = "none";
      }
      if (authContainer) {
        authContainer.classList.remove("hidden");
        authContainer.style.display = "flex";
        this.authUi.renderAuthView(authContainer);
      }
      this.simulation.pause();
    }
  }

  onAuthSuccess(user) {
    this.currentUser = user;
    this.handleAuthStateChanged(user);
    this.modals.showToast(`Welcome back, ${user.displayName || user.email}!`, "safe");
  }

  async handleLogout() {
    try {
      if (this.currentUser && !this.currentUser.isDemo) {
        await this.authService.logout();
      }
      this.currentUser = null;
      this.handleAuthStateChanged(null);
      this.modals.showToast("Operator session ended. Signed out securely.", "info");
    } catch (err) {
      this.modals.showToast("Failed to sign out: " + (err.message || err), "warning");
    }
  }

  updateUserBadge(user) {
    const name = user.displayName || user.email?.split("@")[0] || "Operator";
    const email = user.email || "operator@coldguard.org";
    const initials = name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() || "OP";

    const headerName = document.getElementById("header-user-name");
    const headerAvatar = document.getElementById("header-user-avatar");
    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarEmail = document.getElementById("sidebar-user-email");
    const sidebarAvatar = document.getElementById("sidebar-avatar");

    if (headerName) headerName.textContent = name;
    if (headerAvatar) headerAvatar.textContent = initials;
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarEmail) sidebarEmail.textContent = email;
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
  }

  bindUserControls() {
    const btnLogoutHeader = document.getElementById("btn-logout-header");
    const btnLogoutSidebar = document.getElementById("btn-logout-sidebar");
    if (btnLogoutHeader) btnLogoutHeader.onclick = () => this.handleLogout();
    if (btnLogoutSidebar) btnLogoutSidebar.onclick = () => this.handleLogout();
  }

  parseHashRoute() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const parts = hash.split("?");
    const view = parts[0];
    const params = new URLSearchParams(parts[1] || "");
    const id = params.get("id");
    const modal = params.get("modal");

    if (["dashboard", "shipments", "details", "excursion_engine", "viability_lab", "checkpoints"].includes(view)) {
      this.currentView = view;
      if (id) this.selectedShipmentId = id;
      this.updateNavActiveState(view);
    } else if (view === "auth") {
      const mode = params.get("mode") || "login";
      if (this.authUi) {
        this.authUi.currentMode = mode === "config" ? "login" : mode;
        const authContainer = document.getElementById("auth-view-container");
        if (authContainer) this.authUi.renderAuthView(authContainer);
        if (mode === "config") {
          setTimeout(() => this.authUi.openFirebaseConfigModal(), 100);
        }
      }
    }

    if (params.get("demo") === "true" && !this.currentUser) {
      setTimeout(() => {
        this.onAuthSuccess({
          uid: "demo-operator-mv",
          displayName: "Dr. Marcus Vance",
          email: "marcus.vance@coldguard.org",
          isDemo: true
        });
      }, 50);
    }

    if (modal) {
      setTimeout(() => {
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        const cp = this.checkpoints.find(c => c.id === s.nearestCheckpointId) || this.checkpoints[0];
        if (modal === "reroute") {
          this.modals.openRerouteModal(s, cp);
        } else if (modal === "audit") {
          this.modals.openAuditReportModal(s);
        } else if (modal === "thresholds") {
          this.modals.openThresholdModal(s.vaccineCategory, this.vaccineProfiles);
        }
      }, 100);
    }
  }

  updateNavActiveState(viewName) {
    document.querySelectorAll(".nav-link").forEach(btn => {
      const target = btn.getAttribute("data-view");
      if (target === viewName) {
        btn.classList.add("bg-blue-600", "text-white", "font-semibold");
        btn.classList.remove("text-slate-300", "hover:bg-slate-800");
      } else {
        btn.classList.remove("bg-blue-600", "text-white", "font-semibold");
        btn.classList.add("text-slate-300", "hover:bg-slate-800");
      }
    });
  }

  // Audio synthesize alert sound
  playAlertTone(type = "warning") {
    if (!this.soundAlertsEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      const freq = type === "critical" ? 880 : 587;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  // Simulation tick handler
  onSimulationTick(shipments) {
    this.updateHeaderBadges();

    // Periodic synchronization to Firebase Realtime Database
    const now = Date.now();
    if (this.dbService && this.dbService.isConnected && (now - this.lastRtdbSyncTime > 4000)) {
      this.lastRtdbSyncTime = now;
      const active = shipments.find(s => s.id === this.selectedShipmentId) || shipments[0];
      if (active) {
        this.dbService.updateShipmentTelemetry(active.id, {
          temperature: active.currentTemperature,
          humidity: active.currentHumidity,
          batteryLevel: active.batteryLevel,
          viability: active.estimatedViabilityPercent,
          riskClassification: active.riskClassification,
          excursionStatus: active.excursionStatus
        });
      }
    }

    if (this.currentView === "dashboard") {
      this.updateDashboardKpis();
    } else if (this.currentView === "shipments") {
      this.renderShipmentsTable();
    } else if (this.currentView === "details") {
      this.updateDetailsTelemetry();
    } else if (this.currentView === "excursion_engine") {
      this.renderExcursionEngineView();
    } else if (this.currentView === "viability_lab") {
      this.renderViabilityLabView();
    }
  }

  handleRemoteShipments(remoteShipments) {
    if (!Array.isArray(remoteShipments) || remoteShipments.length === 0) return;
    // Merge sparse Firebase telemetry into the full local shipment model.
    const localShipments = this.simulation.shipments || [];
    const localById = new Map(localShipments.map(s => [String(s.id), s]));
    const seen = new Set();
    const mergedRemote = remoteShipments.map(remote => {
      const location = remote.location || {};
      const live = remote.telemetry?.live || {};
      const id = String(remote.id || remote.shipmentId || "");
      if (!id) return null;
      seen.add(id);
      const local = localById.get(id) || {};
      const valid = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
      const latitude = location.hasFix === false ? local.gpsLatitude :
        (valid(location.latitude) ? Number(location.latitude) :
        (valid(remote.gpsLatitude) ? Number(remote.gpsLatitude) :
        (valid(live.latitude) ? Number(live.latitude) : local.gpsLatitude)));
      const longitude = location.hasFix === false ? local.gpsLongitude :
        (valid(location.longitude) ? Number(location.longitude) :
        (valid(remote.gpsLongitude) ? Number(remote.gpsLongitude) :
        (valid(live.longitude) ? Number(live.longitude) : local.gpsLongitude)));
      return {
        ...local, ...remote, id,
        gpsLatitude: latitude, gpsLongitude: longitude,
        currentTemperature: remote.currentTemperature ?? live.temperature ?? local.currentTemperature,
        currentHumidity: remote.currentHumidity ?? live.humidity ?? local.currentHumidity,
        batteryLevel: remote.batteryLevel ?? live.batteryLevel ?? local.batteryLevel,
        isLiveGps: location.isLiveGps === true || remote.isLiveGps === true,
        gpsHasFix: location.hasFix !== false,
        gpsStatus: location.status || (remote.isLiveGps ? "LOCKED" : local.gpsStatus),
        gpsSpeedKmH: location.speedKmH ?? local.gpsSpeedKmH,
        gpsSatellites: location.satellites ?? local.gpsSatellites,
        gpsLastUpdated: location.lastUpdated ?? remote.lastSensorUpdate ?? local.gpsLastUpdated
      };
    }).filter(Boolean);
    const untouchedLocal = localShipments.filter(s => !seen.has(String(s.id)));
    this.simulation.shipments = [...mergedRemote, ...untouchedLocal];
    this.updateHeaderBadges();
    if (this.currentView === "dashboard") this.updateDashboardKpis();
    else if (this.currentView === "shipments") this.renderShipmentsTable();
    else if (this.currentView === "details") this.updateDetailsTelemetry();
  }

  handleRemoteAlerts(remoteAlerts) {
    this.remoteAlerts = remoteAlerts || [];
    this.updateHeaderBadges();
  }

  // --- View Switcher ---
  switchView(viewName, shipmentId = null) {
    this.currentView = viewName;
    if (shipmentId) {
      this.selectedShipmentId = shipmentId;
      window.location.hash = `${viewName}?id=${shipmentId}`;
    } else {
      window.location.hash = viewName;
    }

    // Update nav active states
    this.updateNavActiveState(viewName);

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  renderCurrentView() {
    const mainContent = document.getElementById("main-content-view");
    if (!mainContent) return;

    if (this.charts) {
      this.charts.destroy();
    }

    switch (this.currentView) {
      case "dashboard":
        this.renderDashboardView(mainContent);
        break;
      case "shipments":
        this.renderShipmentsTableView(mainContent);
        break;
      case "details":
        this.renderDetailsView(mainContent);
        break;
      case "excursion_engine":
        this.renderExcursionEngineView(mainContent);
        break;
      case "viability_lab":
        this.renderViabilityLabView(mainContent);
        break;
      case "checkpoints":
        this.renderCheckpointsView(mainContent);
        break;
      default:
        this.renderDashboardView(mainContent);
    }
  }

  // ==========================================================================
  // VIEW 1: MAIN DASHBOARD OVERVIEW
  // ==========================================================================
  renderDashboardView(container) {
    const kpis = this.calculateKPIs();
    const criticalShipments = this.simulation.shipments.filter(
      s => s.excursionSeverity === "Critical" || s.riskClassification === "Critical"
    );
    const atRiskShipments = this.simulation.shipments.filter(
      s => s.riskClassification === "High Risk" || s.excursionSeverity === "Warning"
    );

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Top Banner / Title -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Cold Chain Control Tower</span>
            </div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">Fleet Environmental Health & KPIs</h1>
            <p class="text-xs text-slate-500">Live multi-sensor telemetry processing across all active biologics carriers.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-quick-export" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              WHO Audit Manifest
            </button>
            <button id="btn-view-all-shipments" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <span>View All Shipments</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>

        <!-- Section 2: 8 KPI CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
          ${this.renderKpiCardsHtml(kpis)}
        </div>

        <!-- Critical Attention Alert Banner if Criticals Exist -->
        ${criticalShipments.length > 0 ? `
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                🚨
              </div>
              <div>
                <h4 class="text-sm font-bold text-red-950">CRITICAL EXCURSION DETECTED IN TRANSIT (${criticalShipments.length} SHIPMENT)</h4>
                <p class="text-xs text-red-800">Shipment <b>${criticalShipments[0].id}</b> (${criticalShipments[0].vaccineName}) breached thermal envelope. Viability degrading.</p>
              </div>
            </div>
            <button class="btn-inspect-shipment px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition whitespace-nowrap self-start sm:self-auto" data-id="${criticalShipments[0].id}">
              Inspect Telemetry & Reroute →
            </button>
          </div>
        ` : ''}

        <!-- High Priority Active Shipments Grid / Quick Actions -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left 2 Cols: Action Required Shipments -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">High-Priority Shipments Requiring Attention</h3>
                <p class="text-xs text-slate-500">Live sorting by highest thermal deviation and spoilage risk.</p>
              </div>
              <span class="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                ${criticalShipments.length + atRiskShipments.length} Flagged
              </span>
            </div>

            <div class="divide-y divide-slate-100 overflow-x-auto">
              ${this.simulation.shipments.slice(0, 5).map(s => `
                <div class="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer row-inspect-shipment" data-id="${s.id}">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      s.excursionSeverity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-300' :
                      s.excursionSeverity === 'Warning' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                      'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    }">
                      ${s.excursionSeverity === 'Critical' ? 'CRIT' : s.excursionSeverity === 'Warning' ? 'WARN' : 'SAFE'}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-xs text-slate-900">${s.id}</span>
                        <span class="text-xs text-slate-500 font-medium">${s.vaccineName}</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5">${s.currentLocation}</div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 text-right">
                    <div>
                      <div class="font-mono font-bold text-xs ${s.currentTemperature > s.maxAllowedTemperature || s.currentTemperature < s.minAllowedTemperature ? 'text-red-600' : 'text-slate-800'}">
                        ${s.currentTemperature}°C
                      </div>
                      <div class="text-[10px] text-slate-400">Permitted: ${s.minAllowedTemperature}° to ${s.maxAllowedTemperature}°</div>
                    </div>
                    <div>
                      <div class="text-xs font-bold text-indigo-600">${s.estimatedViabilityPercent}%</div>
                      <div class="text-[10px] text-slate-400">Viability</div>
                    </div>
                    <button class="btn-inspect-shipment p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition" data-id="${s.id}" title="Inspect">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Right 1 Col: Quick Simulation Sandbox & Category Breakdown -->
          <div class="space-y-6">
            <!-- Vaccine Categories Overview -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 class="font-bold text-slate-900 text-sm">Storage Protocol Breakdown</h3>
              <div class="space-y-2.5 text-xs">
                ${Object.keys(this.vaccineProfiles).map(catKey => {
                  const prof = this.vaccineProfiles[catKey];
                  const count = this.simulation.shipments.filter(s => s.vaccineCategory === catKey).length;
                  return `
                    <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${prof.color}"></span>
                        <span class="font-medium text-slate-700">${prof.categoryName}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[11px] text-slate-500">${prof.minTemp}° to ${prof.maxTemp}°C</span>
                        <span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">${count}</span>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- Quick Incident Scenario Injections -->
            <div class="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-xs uppercase tracking-wider text-indigo-300">Test Stress Scenarios</h4>
                <span class="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 text-[10px] rounded">Live Injector</span>
              </div>
              <p class="text-xs text-slate-300">Simulate hardware anomalies to test rule triggers & nearest checkpoint rerouting in real-time.</p>
              
              <div class="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold">
                <button id="btn-quick-inject-reefer" class="p-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-left transition flex items-center gap-2">
                  <span>🔥</span>
                  <span>Reefer Failure</span>
                </button>
                <button id="btn-quick-inject-dryice" class="p-2 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-700/60 text-left transition flex items-center gap-2">
                  <span>❄️</span>
                  <span>Dry-Ice Loss</span>
                </button>
                <button id="btn-quick-inject-route" class="p-2 rounded-lg bg-amber-900/60 hover:bg-amber-800 border border-amber-700/60 text-left transition flex items-center gap-2">
                  <span>📍</span>
                  <span>Route Detour</span>
                </button>
                <button id="btn-quick-inject-recover" class="p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 text-left transition flex items-center gap-2">
                  <span>✅</span>
                  <span>Restore Cold</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindDashboardEvents(container);
  }

  calculateKPIs() {
    const list = this.simulation.shipments;
    const active = list.filter(s => s.status !== "Delivered");
    const atRisk = active.filter(s => s.riskClassification !== "Low" || s.excursionSeverity !== "None");
    const excursions = list.filter(s => s.excursionSeverity === "Critical" || s.excursionSeverity === "High Risk");
    const criticalAlerts = list.filter(s => s.excursionSeverity === "Critical");

    const avgViability = active.length > 0
      ? (active.reduce((acc, s) => acc + s.estimatedViabilityPercent, 0) / active.length).toFixed(1)
      : 98.0;

    const onTimeCount = active.filter(s => !s.predictedDelay || s.predictedDelay.includes("On Time") || s.predictedDelay === "None").length;
    const onTimeRate = active.length > 0 ? ((onTimeCount / active.length) * 100).toFixed(1) : 95.0;

    const compliantHumidity = active.filter(s => s.currentHumidity >= s.minAllowedHumidity && s.currentHumidity <= s.maxAllowedHumidity).length;
    const humidityRate = active.length > 0 ? ((compliantHumidity / active.length) * 100).toFixed(1) : 96.0;

    const gpsOnline = active.filter(s => s.sensorConnectivity === "Online" || s.sensorConnectivity === "Low Battery").length;
    const gpsRate = active.length > 0 ? Math.round((gpsOnline / active.length) * 100) : 100;

    return {
      activeShipments: active.length,
      shipmentsAtRisk: atRisk.length,
      temperatureExcursions: excursions.length,
      avgViability,
      criticalAlerts: criticalAlerts.length,
      onTimeRate,
      humidityRate,
      gpsRate
    };
  }

  renderKpiCardsHtml(kpis) {
    return `
      <!-- KPI 1: Active Shipments -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Active Shipments</span>
          <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.activeShipments}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↑ +2 dispatched today</span>
            <span class="text-slate-400">• In transit</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Shipments at Risk -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Shipments at Risk</span>
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-amber-600">${kpis.shipmentsAtRisk}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium mt-1">
            <span>Approaching / out-of-spec</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Temperature Excursions -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Temperature Excursions</span>
          <div class="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-red-600">${kpis.temperatureExcursions}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-red-700 font-medium mt-1">
            <span>Active rule trigger</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Average Vaccine Viability -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Avg Vaccine Viability</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.avgViability}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
            <span>Healthy baseline (>90%)</span>
          </div>
        </div>
      </div>

      <!-- KPI 5: Critical Alerts -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Critical Incidents</span>
          <div class="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-red-600">${kpis.criticalAlerts}</div>
          <div class="flex items-center gap-1.5 text-[11px] text-red-700 font-medium mt-1">
            <span>Action Required</span>
          </div>
        </div>
      </div>

      <!-- KPI 6: On-Time Delivery Rate -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">On-Time Delivery Rate</span>
          <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.onTimeRate}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium mt-1">
            <span>ETAs compliant</span>
          </div>
        </div>
      </div>

      <!-- KPI 7: Humidity Compliance -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">Humidity Compliance</span>
          <div class="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.humidityRate}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-cyan-700 font-medium mt-1">
            <span>Inside RH bounds</span>
          </div>
        </div>
      </div>

      <!-- KPI 8: GPS Connectivity -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-500">GPS Connectivity</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-2xl font-extrabold text-slate-900">${kpis.gpsRate}%</div>
          <div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
            <span>Cellular LTE-M locked</span>
          </div>
        </div>
      </div>
    `;
  }

  updateDashboardKpis() {
    const grid = document.getElementById("kpi-cards-grid");
    if (!grid) return;
    const kpis = this.calculateKPIs();
    grid.innerHTML = this.renderKpiCardsHtml(kpis);
  }

  bindDashboardEvents(container) {
    const btnAll = container.querySelector("#btn-view-all-shipments");
    if (btnAll) btnAll.onclick = () => this.switchView("shipments");

    const btnExport = container.querySelector("#btn-quick-export");
    if (btnExport) {
      btnExport.onclick = () => {
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        this.modals.openAuditReportModal(s);
      };
    }

    container.querySelectorAll(".btn-inspect-shipment, .row-inspect-shipment").forEach(el => {
      el.onclick = (e) => {
        const id = el.getAttribute("data-id");
        this.switchView("details", id);
      };
    });

    // Quick injections
    const reefer = container.querySelector("#btn-quick-inject-reefer");
    if (reefer) reefer.onclick = () => {
      this.simulation.injectRefrigerationFailure(this.selectedShipmentId);
      this.playAlertTone("critical");
      this.modals.showToast("Injected Reefer Compressor Failure on " + this.selectedShipmentId, "critical");
    };

    const dryice = container.querySelector("#btn-quick-inject-dryice");
    if (dryice) dryice.onclick = () => {
      this.simulation.injectDryIceDepletion(this.selectedShipmentId);
      this.playAlertTone("critical");
      this.modals.showToast("Injected Dry-Ice Depletion scenario", "critical");
    };

    const route = container.querySelector("#btn-quick-inject-route");
    if (route) route.onclick = () => {
      this.simulation.injectRouteDeviation(this.selectedShipmentId);
      this.playAlertTone("warning");
      this.modals.showToast("Injected Route Deviation scenario", "warning");
    };

    const recover = container.querySelector("#btn-quick-inject-recover");
    if (recover) recover.onclick = () => {
      this.simulation.injectColdRecovery(this.selectedShipmentId);
      this.modals.showToast("Restored Cold Chain parameters to nominal", "safe");
    };
  }

  // ==========================================================================
  // VIEW 2: REAL-TIME SHIPMENT MONITORING (Searchable & Filterable Table)
  // ==========================================================================
  renderShipmentsTableView(container) {
    container.innerHTML = `
      <div class="space-y-5 animate-fade-in">
        <!-- Title & Stats -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Real-Time Vaccine Shipments</h1>
            <p class="text-xs text-slate-500">Continuous environmental telemetry, batch tracking, and risk classification.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-export-all-csv" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export Fleet Manifest (CSV)
            </button>
            <button id="btn-open-threshold-config" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Category Thresholds
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- Search Input -->
            <div class="relative">
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input id="filter-search-input" type="text" placeholder="Search ID, vaccine, batch..." value="${this.filters.searchQuery}" class="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>

            <!-- Vaccine Category Filter -->
            <div>
              <select id="filter-category-select" class="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="all">All Vaccine Categories</option>
                ${Object.keys(this.vaccineProfiles).map(k => `
                  <option value="${k}" ${this.filters.category === k ? 'selected' : ''}>${this.vaccineProfiles[k].categoryName}</option>
                `).join("")}
              </select>
            </div>

            <!-- Shipment Status Filter -->
            <div>
              <select id="filter-status-select" class="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Shipment Statuses</option>
                <option value="In Transit" ${this.filters.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
                <option value="Approaching Destination" ${this.filters.status === 'Approaching Destination' ? 'selected' : ''}>Approaching Destination</option>
                <option value="Emergency Rerouting" ${this.filters.status === 'Emergency Rerouting' ? 'selected' : ''}>Emergency Rerouting</option>
                <option value="Delivered" ${this.filters.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              </select>
            </div>

            <!-- Risk Level Filter -->
            <div>
              <select id="filter-risk-select" class="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500">
                <option value="all" ${this.filters.riskLevel === 'all' ? 'selected' : ''}>All Risk Levels</option>
                <option value="Low" ${this.filters.riskLevel === 'Low' ? 'selected' : ''}>Low Risk (Safe)</option>
                <option value="Moderate" ${this.filters.riskLevel === 'Moderate' ? 'selected' : ''}>Moderate (Warning)</option>
                <option value="High Risk" ${this.filters.riskLevel === 'High Risk' ? 'selected' : ''}>High Risk</option>
                <option value="Critical" ${this.filters.riskLevel === 'Critical' ? 'selected' : ''}>Critical Excursion</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Shipments Data Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="shipments-table-wrapper">
          ${this.generateShipmentsTableHtml()}
        </div>
      </div>
    `;

    this.bindShipmentTableEvents(container);
  }

  generateShipmentsTableHtml() {
    const filtered = this.getFilteredShipments();

    if (filtered.length === 0) {
      return `
        <div class="p-12 text-center text-slate-500">
          <div class="text-3xl mb-2">🔍</div>
          <div class="font-bold text-sm text-slate-800">No shipments found matching filters</div>
          <div class="text-xs text-slate-400 mt-1">Try resetting search query or selecting "All Categories".</div>
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-700">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
            <tr>
              <th class="p-3.5">Shipment & Vaccine</th>
              <th class="p-3.5">Category & Lot</th>
              <th class="p-3.5">Origin / Destination</th>
              <th class="p-3.5 text-center">Temp (°C)</th>
              <th class="p-3.5 text-center">Humidity</th>
              <th class="p-3.5 text-center">Remaining Viability</th>
              <th class="p-3.5 text-center">Risk Level</th>
              <th class="p-3.5 text-center">Status</th>
              <th class="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${filtered.map(s => {
              const isCrit = s.excursionSeverity === "Critical" || s.riskClassification === "Critical";
              const isHigh = s.riskClassification === "High Risk";
              const isMod = s.riskClassification === "Moderate" || s.excursionSeverity === "Warning";
              const prof = this.vaccineProfiles[s.vaccineCategory] || {};

              return `
                <tr class="hover:bg-slate-50/80 transition cursor-pointer shipment-row ${s.id === this.selectedShipmentId ? 'bg-blue-50/50' : ''}" data-id="${s.id}">
                  <td class="p-3.5">
                    <div class="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      ${s.id}
                      ${s.priority === 'Urgent' ? '<span class="px-1.5 py-0.2 bg-red-100 text-red-700 font-sans text-[10px] font-bold rounded">URGENT</span>' : ''}
                    </div>
                    <div class="text-slate-600 font-medium mt-0.5">${s.vaccineName}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${s.doses.toLocaleString()} doses • ${s.packagingType.substring(0, 24)}...</div>
                  </td>

                  <td class="p-3.5">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white mb-1" style="background-color: ${prof.color || '#2563EB'}">
                      ${prof.categoryName || s.vaccineCategory}
                    </span>
                    <div class="font-mono text-[11px] text-slate-500">Lot: ${s.batchNumber}</div>
                    <div class="text-[10px] text-slate-400">${s.manufacturer}</div>
                  </td>

                  <td class="p-3.5">
                    <div class="font-medium text-slate-800 text-[11px] truncate max-w-[170px]" title="${s.currentLocation}">
                      📍 ${s.currentLocation}
                    </div>
                    <div class="text-[10px] text-slate-500 mt-0.5 truncate max-w-[170px]" title="${s.destinationFacility}">
                      🏁 ${s.destinationFacility}
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">ETA: ${s.eta}</div>
                  </td>

                  <td class="p-3.5 text-center">
                    <div class="font-mono font-extrabold text-sm ${s.currentTemperature > s.maxAllowedTemperature || s.currentTemperature < s.minAllowedTemperature ? 'text-red-600 animate-pulse' : 'text-slate-900'}">
                      ${s.currentTemperature}°C
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono">
                      [${s.minAllowedTemperature}° to ${s.maxAllowedTemperature}°]
                    </div>
                    ${s.temperatureDeviation !== 0 ? `<div class="text-[10px] font-bold text-red-500 mt-0.5">Δ ${s.temperatureDeviation > 0 ? '+' : ''}${s.temperatureDeviation}°C</div>` : ''}
                  </td>

                  <td class="p-3.5 text-center">
                    <div class="font-mono font-semibold text-slate-800">${s.currentHumidity}% RH</div>
                    <div class="text-[10px] text-slate-400">[${s.minAllowedHumidity}% - ${s.maxAllowedHumidity}%]</div>
                  </td>

                  <td class="p-3.5 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <div class="w-10 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div class="h-full rounded-full ${s.estimatedViabilityPercent >= 90 ? 'bg-emerald-500' : s.estimatedViabilityPercent >= 80 ? 'bg-amber-500' : 'bg-red-500'}" style="width: ${s.estimatedViabilityPercent}%"></div>
                      </div>
                      <span class="font-mono font-bold text-xs ${s.estimatedViabilityPercent >= 90 ? 'text-emerald-700' : s.estimatedViabilityPercent >= 80 ? 'text-amber-700' : 'text-red-700'}">
                        ${s.estimatedViabilityPercent}%
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400">Risk: ${s.predictedSpoilageRiskPercent}%</div>
                  </td>

                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isCrit ? 'bg-red-100 text-red-800 border border-red-300' :
                      isHigh ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                      isMod ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }">
                      ${s.riskClassification}
                    </span>
                  </td>

                  <td class="p-3.5 text-center">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      s.status === 'Delivered' ? 'bg-slate-100 text-slate-700' :
                      s.status === 'Emergency Rerouting' ? 'bg-purple-100 text-purple-800 font-bold' :
                      'bg-blue-50 text-blue-700'
                    }">
                      ${s.status}
                    </span>
                  </td>

                  <td class="p-3.5 text-right">
                    <button class="btn-inspect px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition" data-id="${s.id}">
                      Inspect
                    </button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  getFilteredShipments() {
    return this.simulation.shipments.filter(s => {
      // Query filter
      if (this.filters.searchQuery) {
        const q = this.filters.searchQuery.toLowerCase();
        const match = s.id.toLowerCase().includes(q) ||
          s.vaccineName.toLowerCase().includes(q) ||
          s.batchNumber.toLowerCase().includes(q) ||
          s.currentLocation.toLowerCase().includes(q) ||
          s.destinationFacility.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Category filter
      if (this.filters.category !== "all" && s.vaccineCategory !== this.filters.category) {
        return false;
      }
      // Status filter
      if (this.filters.status !== "all" && s.status !== this.filters.status) {
        return false;
      }
      // Risk filter
      if (this.filters.riskLevel !== "all" && s.riskClassification !== this.filters.riskLevel) {
        return false;
      }
      return true;
    });
  }

  renderShipmentsTable() {
    const wrapper = document.getElementById("shipments-table-wrapper");
    if (wrapper) {
      wrapper.innerHTML = this.generateShipmentsTableHtml();
      this.bindShipmentRowClicks(wrapper);
    }
  }

  bindShipmentTableEvents(container) {
    const search = container.querySelector("#filter-search-input");
    if (search) {
      search.oninput = (e) => {
        this.filters.searchQuery = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const catSelect = container.querySelector("#filter-category-select");
    if (catSelect) {
      catSelect.onchange = (e) => {
        this.filters.category = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const statSelect = container.querySelector("#filter-status-select");
    if (statSelect) {
      statSelect.onchange = (e) => {
        this.filters.status = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const riskSelect = container.querySelector("#filter-risk-select");
    if (riskSelect) {
      riskSelect.onchange = (e) => {
        this.filters.riskLevel = e.target.value;
        this.renderShipmentsTable();
      };
    }

    const btnThresh = container.querySelector("#btn-open-threshold-config");
    if (btnThresh) {
      btnThresh.onclick = () => {
        this.modals.openThresholdModal("standard_cold_chain", this.vaccineProfiles);
      };
    }

    const btnCsv = container.querySelector("#btn-export-all-csv");
    if (btnCsv) {
      btnCsv.onclick = () => {
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        this.modals.exportCsvManifest(s);
      };
    }

    this.bindShipmentRowClicks(container);
  }

  bindShipmentRowClicks(container) {
    container.querySelectorAll(".shipment-row, .btn-inspect").forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.getAttribute("data-id") || el.closest(".shipment-row")?.getAttribute("data-id");
        if (id) {
          this.switchView("details", id);
        }
      };
    });
  }

  // ==========================================================================
  // VIEW 3: INDIVIDUAL SHIPMENT DETAILS PAGE (Sections 4, 5, 6, 7)
  // ==========================================================================
  renderDetailsView(container) {
    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
    const prof = this.vaccineProfiles[s.vaccineCategory] || {};
    const nearestCp = this.checkpoints.find(cp => cp.id === s.nearestCheckpointId) || this.checkpoints[0];
    const isCritical = s.excursionSeverity === "Critical" || s.riskClassification === "Critical";
    const isWarning = s.excursionSeverity === "Warning" || s.riskClassification === "High Risk";

    // Run Viability Model
    const viabilityEst = ViabilityModel.estimateViability(s, prof);
    const trajectoryData = ViabilityModel.generateProjectionTrajectory(s, viabilityEst);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in" id="details-view-root">
        <!-- Top Details Header -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <button id="btn-back-to-shipments" class="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                  ← Back to Fleet Table
                </button>
                <span class="text-slate-300">•</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold text-white" style="background-color: ${prof.color}">
                  ${prof.categoryName}
                </span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                  isCritical ? 'bg-red-100 text-red-800' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }">
                  ${s.riskClassification}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-3 mt-1.5">
                <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">${s.vaccineName}</h1>
                <span class="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">${s.id}</span>
                <span class="text-xs text-slate-500 font-mono">Lot: ${s.batchNumber}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">${s.manufacturer} • ${s.doses.toLocaleString()} doses • ${s.packagingType}</p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center gap-2">
              <button id="btn-trigger-reroute-modal" class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                Emergency Reroute
              </button>
              <button id="btn-view-who-audit" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition flex items-center gap-1.5">
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Audit Report
              </button>
              <button id="btn-toggle-sim-detail" class="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5">
                <span>${this.simulation.isRunning ? '⏸ Pause Telemetry' : '▶ Resume Telemetry'}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ESP32 DUAL DHT22 HARDWARE PROBE TELEMETRY STATUS -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm" id="hardware-probe-card">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl ${s.isHardwareConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500'} flex items-center justify-center font-bold text-sm">
                📡
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-slate-900">Hardware Telemetry Probe: ESP32-CG-PROBE-01</span>
                  ${s.isHardwareConnected ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Hardware Streaming
                    </span>
                  ` : `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      Provisioned (Awaiting Live Ingestion)
                    </span>
                  `}
                </div>
                <p class="text-[11px] text-slate-500">Dual DHT22 Probes: Internal Core Payload (In-Vial) + External Container Ambient.</p>
              </div>
            </div>

            <div class="flex items-center gap-2 text-xs">
              <span class="text-[11px] text-slate-400">Security Verification:</span>
              <span class="font-mono text-[10px] bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200 font-semibold">SHA-256 Authenticated</span>
            </div>
          </div>

          <!-- Dual Probe Live Metrics Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <!-- Probe 1: Core -->
            <div class="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div>
                <div class="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Probe 1 (Internal Core)</div>
                <div class="text-xl font-mono font-extrabold text-blue-950 mt-0.5">
                  ${(s.coreTemperature !== undefined ? s.coreTemperature : s.currentTemperature)}°C
                </div>
                <div class="text-[11px] text-blue-600 font-mono">Humidity: ${(s.coreHumidity !== undefined ? s.coreHumidity : s.currentHumidity)}% RH</div>
              </div>
              <span class="text-2xl">🧪</span>
            </div>

            <!-- Probe 2: Ambient -->
            <div class="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
              <div>
                <div class="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Probe 2 (External Ambient)</div>
                <div class="text-xl font-mono font-extrabold text-amber-950 mt-0.5">
                  ${(s.ambientTemperature !== undefined ? s.ambientTemperature : (s.currentTemperature + 21.2).toFixed(1))}°C
                </div>
                <div class="text-[11px] text-amber-600 font-mono">Humidity: ${(s.ambientHumidity !== undefined ? s.ambientHumidity : (s.currentHumidity + 12.0).toFixed(1))}% RH</div>
              </div>
              <span class="text-2xl">📦</span>
            </div>

            <!-- Differential Delta T -->
            <div class="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
              <div>
                <div class="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Thermal Barrier (ΔT)</div>
                <div class="text-xl font-mono font-extrabold text-purple-950 mt-0.5">
                  ${(s.deltaTemperature !== undefined ? s.deltaTemperature : ((s.ambientTemperature || (s.currentTemperature + 21.2)) - (s.coreTemperature || s.currentTemperature)).toFixed(1))}°C
                </div>
                <div class="text-[11px] text-purple-600">Insulation Gradient (Ext - Int)</div>
              </div>
              <span class="text-2xl">🛡️</span>
            </div>
          </div>
        </div>

        <!-- Section 4A: LIVE ENVIRONMENTAL TELEMETRY CARDS -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="telemetry-cards-container">
          ${this.renderTelemetryCardsHtml(s)}
        </div>

        <!-- Main Body Grid: Left (Charts & Map) | Right (Viability & Timeline & Checkpoint) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- LEFT 7 COLS: Charts + GPS Map -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Section 4B: TEMPERATURE & HUMIDITY CHARTS -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Environmental Telemetry Time-Series</h3>
                  <p class="text-[11px] text-slate-500">Live multi-probe sensors with dynamic threshold zones.</p>
                </div>
                
                <!-- Chart Controls -->
                <div class="flex items-center gap-2">
                  <!-- Metric Toggle -->
                  <div class="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                    <button class="px-2 py-1 rounded-md chart-metric-btn active bg-white text-blue-600 shadow-xs" data-metric="temperature">Temp (°C)</button>
                    <button class="px-2 py-1 rounded-md chart-metric-btn text-slate-500 hover:text-slate-800" data-metric="humidity">Humidity (%RH)</button>
                    <button class="px-2 py-1 rounded-md chart-metric-btn text-slate-500 hover:text-slate-800" data-metric="both">Dual</button>
                  </div>

                  <!-- Time Window -->
                  <div class="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
                    <button class="px-2 py-1 rounded-md chart-window-btn active bg-white text-blue-600 shadow-xs" data-window="1h">1h</button>
                    <button class="px-2 py-1 rounded-md chart-window-btn text-slate-500 hover:text-slate-800" data-window="6h">6h</button>
                    <button class="px-2 py-1 rounded-md chart-window-btn text-slate-500 hover:text-slate-800" data-window="12h">12h</button>
                    <button class="px-2 py-1 rounded-md chart-window-btn text-slate-500 hover:text-slate-800" data-window="24h">24h</button>
                  </div>
                </div>
              </div>

              <!-- Canvas Container -->
              <div class="relative w-full h-64 sm:h-72">
                <canvas id="telemetry-chart-canvas"></canvas>
              </div>

              <!-- Excursion Threshold Footnote -->
              <div class="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-0.5 bg-blue-600"></span> Sensor Telemetry
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-0.5 bg-red-500"></span> Upper Limit (${s.maxAllowedTemperature}°C)
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-0.5 bg-blue-400"></span> Lower Limit (${s.minAllowedTemperature}°C)
                  </span>
                </div>
                <span class="font-mono text-slate-400">Sample Frequency: Every 3-5s</span>
              </div>
            </div>

            <!-- Section 4C: GPS ROUTE TRACKING MAP -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">GPS Route & Cold Chain Corridor Tracking</h3>
                  <p class="text-[11px] text-slate-500">Real-time GPS positioning, cold storage checkpoints, and emergency diversion vectors.</p>
                </div>
                <div class="text-right">
                  <div class="font-mono font-bold text-xs text-indigo-600">${s.routeDistanceRemainingKm} km remaining</div>
                  <div class="text-[10px] text-slate-400">ETA: ${s.eta}</div>
                </div>
              </div>

              <!-- Map Container -->
              <div class="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200" id="route-map-container">
                <!-- Leaflet or schematic map inserted here -->
              </div>

              <!-- Nearest Checkpoint Status Pill -->
              <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-lg">🏥</span>
                  <div>
                    <div class="text-xs font-bold text-indigo-950">Nearest Cold Vault: ${nearestCp.name}</div>
                    <div class="text-[11px] text-indigo-700">${nearestCp.distanceKm} km away • Travel ETA: <b>${nearestCp.travelTimeMinutes} mins</b> • Capacity: ${(nearestCp.availableCapacityDoses || 0).toLocaleString()} doses</div>
                  </div>
                </div>
                <button id="btn-map-quick-reroute" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                  Reroute Here
                </button>
              </div>
            </div>

            <!-- Section 5: RULE-BASED EXCURSION DETECTION ENGINE LOG -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Rule-Based Excursion Engine Diagnostics</h3>
                  <p class="text-[11px] text-slate-500">Continuous 19-parameter evaluation and SOP mitigation directive.</p>
                </div>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isCritical ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}">
                  Confidence: ${s.detectionConfidencePercent || 99}%
                </span>
              </div>

              <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-semibold text-slate-700">Primary Rule Triggered:</span>
                  <span class="font-bold ${isCritical ? 'text-red-600' : 'text-emerald-700'}">${s.excursionStatus}</span>
                </div>
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-semibold text-slate-700">Excursion Duration:</span>
                  <span class="font-mono font-medium">${s.excursionDurationMinutes || 0} minutes cumulative</span>
                </div>
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-semibold text-slate-700">Peak Thermal Deviation:</span>
                  <span class="font-mono font-medium text-red-600">Δ ${s.temperatureDeviation || 0}°C above threshold</span>
                </div>
                <div class="pt-1">
                  <div class="font-semibold text-slate-700 mb-1">Recommended SOP Directive:</div>
                  <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed">
                    ${s.recommendedNextAction}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT 5 COLS: Viability Model, Nearest Checkpoint, & Event Timeline -->
          <div class="lg:col-span-5 space-y-6">
            <!-- Section 6: VACCINE VIABILITY ESTIMATION -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-bold text-slate-900 text-sm">Vaccine Viability Estimation</h3>
                  <p class="text-[11px] text-slate-500">Heuristic Arrhenius thermal degradation kinetic model.</p>
                </div>
                <span class="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full">
                  Kinetic Model
                </span>
              </div>

              <!-- Viability Gauge & Score -->
              <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div class="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  <!-- Circular SVG Gauge -->
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-200" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="${viabilityEst.estimatedRemainingViabilityPercent >= 90 ? 'text-emerald-500' : viabilityEst.estimatedRemainingViabilityPercent >= 80 ? 'text-amber-500' : 'text-red-500'}" stroke-dasharray="${viabilityEst.estimatedRemainingViabilityPercent}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="font-mono font-extrabold text-sm text-slate-900">${viabilityEst.estimatedRemainingViabilityPercent}%</span>
                  </div>
                </div>

                <div class="space-y-1 text-xs">
                  <div class="font-bold text-slate-900 text-sm">Viability Potency Index</div>
                  <div class="text-slate-600">Loss: <span class="font-bold text-red-600">-${viabilityEst.estimatedViabilityLossPercent}%</span> • Spoilage Risk: <span class="font-bold text-slate-800">${viabilityEst.predictedSpoilageRiskPercent}%</span></div>
                  <div class="text-[11px] text-slate-500">Confidence: <span class="font-semibold text-emerald-600">${viabilityEst.confidenceLevelPercent}%</span></div>
                </div>
              </div>

              <!-- Time to Critical & Window Metrics -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">Safe Handling Window</div>
                  <div class="font-bold text-slate-800 mt-0.5">${viabilityEst.safeHandlingWindow}</div>
                </div>
                <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div class="text-[10px] text-slate-400 font-semibold uppercase">Time to Critical (<80%)</div>
                  <div class="font-bold ${viabilityEst.timeToCriticalRisk.includes('0 mins') ? 'text-red-600' : 'text-slate-800'} mt-0.5">
                    ${viabilityEst.timeToCriticalRisk}
                  </div>
                </div>
              </div>

              <!-- Viability Projection Trajectory Chart -->
              <div>
                <div class="text-xs font-bold text-slate-700 mb-1">Projected Potency at Arrival</div>
                <div class="relative w-full h-44">
                  <canvas id="viability-projection-canvas"></canvas>
                </div>
              </div>

              <!-- Important Disclaimer Tag -->
              <div class="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2.5 rounded-xl flex items-start gap-2">
                <span class="font-bold text-amber-600 mt-0.5">⚠️</span>
                <div>
                  <b>Simulation Estimate — Not Clinically Validated:</b> Demonstrative Arrhenius approximation for logistics routing decisions. Does not replace validated lab potency assays.
                </div>
              </div>
            </div>

            <!-- Section 7: NEAREST CHECKPOINT RECOMMENDATION -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900 text-sm">Recommended Intervention Facility</h3>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  ${nearestCp.operatingStatus}
                </span>
              </div>

              <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2 text-xs">
                <div>
                  <div class="font-bold text-sm text-slate-900">${nearestCp.name}</div>
                  <div class="text-slate-500 text-[11px]">${nearestCp.type} • ${nearestCp.city}</div>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span class="text-slate-400 text-[10px]">Distance:</span>
                    <div class="font-bold text-slate-800">${nearestCp.distanceKm} km</div>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px]">Travel ETA:</span>
                    <div class="font-bold text-indigo-600">${nearestCp.travelTimeMinutes} mins</div>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px]">Cryo Capacity:</span>
                    <div class="font-bold text-emerald-600">${(nearestCp.availableCapacityDoses || 0).toLocaleString()} doses</div>
                  </div>
                  <div>
                    <span class="text-slate-400 text-[10px]">Duty Staff:</span>
                    <div class="font-medium text-slate-700 truncate">${nearestCp.staffAvailability}</div>
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span class="text-slate-500">Emergency Phone: <b class="font-mono text-slate-700">${nearestCp.emergencyPhone}</b></span>
                  <button id="btn-notify-checkpoint" class="text-blue-600 hover:underline font-bold">
                    Send Pager Alert
                  </button>
                </div>
              </div>

              <button id="btn-details-reroute-trigger" class="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                Initiate Immediate Reroute to ${nearestCp.id}
              </button>
            </div>

            <!-- Section 4D: SHIPMENT EVENT TIMELINE -->
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900 text-sm">Shipment Custody & Incident Timeline</h3>
                <span class="text-[10px] text-slate-400 font-mono">${(s.timeline || []).length} Logged Events</span>
              </div>

              <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                ${(s.timeline || []).map((t, idx) => `
                  <div class="flex items-start gap-3 text-xs">
                    <div class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      t.severity === 'critical' ? 'bg-red-500 ring-4 ring-red-100' :
                      t.severity === 'warning' ? 'bg-amber-500 ring-4 ring-amber-100' :
                      'bg-emerald-500'
                    }"></div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-slate-800 ${t.severity === 'critical' ? 'text-red-700' : ''}">${t.desc}</span>
                        <span class="font-mono text-[10px] text-slate-400 flex-shrink-0 ml-2">${t.time}</span>
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindDetailsEvents(container, s, nearestCp, viabilityEst, trajectoryData);
  }

  renderTelemetryCardsHtml(s) {
    const isTempCrit = s.currentTemperature > s.maxAllowedTemperature || s.currentTemperature < s.minAllowedTemperature;
    const isHumCrit = s.currentHumidity > s.maxAllowedHumidity || s.currentHumidity < s.minAllowedHumidity;

    return `
      <!-- 1. Current Temp -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Core Temperature</span>
        <div class="mt-1">
          <div class="font-mono text-xl font-extrabold ${isTempCrit ? 'text-red-600 animate-pulse' : 'text-slate-900'}">
            ${s.currentTemperature}°C
          </div>
          <div class="text-[10px] text-slate-400 font-mono">Limit: ${s.minAllowedTemperature}° to ${s.maxAllowedTemperature}°</div>
        </div>
      </div>

      <!-- 2. Current Humidity -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Relative Humidity</span>
        <div class="mt-1">
          <div class="font-mono text-xl font-extrabold ${isHumCrit ? 'text-amber-600' : 'text-slate-900'}">
            ${s.currentHumidity}%
          </div>
          <div class="text-[10px] text-slate-400 font-mono">Limit: ${s.minAllowedHumidity}% - ${s.maxAllowedHumidity}%</div>
        </div>
      </div>

      <!-- 3. GPS Coordinates -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">GPS Position</span>
        <div class="mt-1">
          <div class="font-mono text-xs font-bold text-slate-800">
            ${s.gpsLatitude.toFixed(3)}°N, ${Math.abs(s.gpsLongitude).toFixed(3)}°W
          </div>
          <div class="text-[10px] text-slate-400">${s.routeDeviationDetected ? '⚠️ Route Deviation' : 'On Approved Corridor'}</div>
        </div>
      </div>

      <!-- 4. Sensor Freshness -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Data Freshness</span>
        <div class="mt-1">
          <div class="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full ${s.sensorDataAgeSeconds < 30 ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            ${s.sensorDataAgeSeconds}s ago
          </div>
          <div class="text-[10px] text-slate-400 font-mono">${s.sensorConnectivity}</div>
        </div>
      </div>

      <!-- 5. Sensor Battery -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Battery Level</span>
        <div class="mt-1">
          <div class="font-mono text-sm font-bold ${s.batteryLevel < 15 ? 'text-red-600 font-extrabold' : 'text-slate-800'}">
            🔋 ${s.batteryLevel}%
          </div>
          <div class="text-[10px] text-slate-400">${s.batteryLevel < 15 ? 'Critical Low' : 'Nominal Power'}</div>
        </div>
      </div>

      <!-- 6. Shipment Status -->
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-[11px] font-semibold text-slate-500">Shipment Status</span>
        <div class="mt-1">
          <div class="text-xs font-bold ${s.status === 'Emergency Rerouting' ? 'text-purple-700' : 'text-blue-700'}">
            ${s.status}
          </div>
          <div class="text-[10px] text-slate-400">Carrier: ${s.transportVehicleId}</div>
        </div>
      </div>
    `;
  }

  updateDetailsTelemetry() {
    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId);
    if (!s) return;

    const cards = document.getElementById("telemetry-cards-container");
    if (cards) {
      cards.innerHTML = this.renderTelemetryCardsHtml(s);
    }

    const probeCard = document.getElementById("hardware-probe-card");
    if (probeCard) {
      const coreT = s.coreTemperature !== undefined ? s.coreTemperature : s.currentTemperature;
      const coreH = s.coreHumidity !== undefined ? s.coreHumidity : s.currentHumidity;
      const ambT = s.ambientTemperature !== undefined ? s.ambientTemperature : Number((s.currentTemperature + 21.2).toFixed(1));
      const ambH = s.ambientHumidity !== undefined ? s.ambientHumidity : Number((s.currentHumidity + 12.0).toFixed(1));
      const deltaT = s.deltaTemperature !== undefined ? s.deltaTemperature : Number((ambT - coreT).toFixed(1));
      
      const badgeContainer = probeCard.querySelector(".flex.items-center.gap-2");
      if (badgeContainer) {
        badgeContainer.innerHTML = `
          <span class="text-xs font-bold text-slate-900">Hardware Telemetry Probe: ESP32-CG-PROBE-01</span>
          ${s.isHardwareConnected ? `
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Hardware Streaming
            </span>
          ` : `
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Provisioned (Awaiting Live Ingestion)
            </span>
          `}
        `;
      }
    }

    if (this.charts) {
      this.charts.updateTelemetryChart(s);
      const prof = this.vaccineProfiles[s.vaccineCategory] || {};
      const viabilityEst = ViabilityModel.estimateViability(s, prof);
      const trajectoryData = ViabilityModel.generateProjectionTrajectory(s, viabilityEst);
      this.charts.updateViabilityProjectionChart(trajectoryData);
    }

    if (this.mapView) {
      this.mapView.renderShipment(s, this.checkpoints);
    }
  }

  bindDetailsEvents(container, shipment, nearestCheckpoint, viabilityEst, trajectoryData) {
    const btnBack = container.querySelector("#btn-back-to-shipments");
    if (btnBack) btnBack.onclick = () => this.switchView("shipments");

    const btnReroute = container.querySelector("#btn-trigger-reroute-modal");
    if (btnReroute) {
      btnReroute.onclick = () => this.modals.openRerouteModal(shipment, nearestCheckpoint);
    }

    const btnDetailsReroute = container.querySelector("#btn-details-reroute-trigger");
    if (btnDetailsReroute) {
      btnDetailsReroute.onclick = () => this.modals.openRerouteModal(shipment, nearestCheckpoint);
    }

    const btnMapReroute = container.querySelector("#btn-map-quick-reroute");
    if (btnMapReroute) {
      btnMapReroute.onclick = () => this.modals.openRerouteModal(shipment, nearestCheckpoint);
    }

    const btnAudit = container.querySelector("#btn-view-who-audit");
    if (btnAudit) {
      btnAudit.onclick = () => this.modals.openAuditReportModal(shipment);
    }

    const btnNotify = container.querySelector("#btn-notify-checkpoint");
    if (btnNotify) {
      btnNotify.onclick = () => {
        this.modals.showToast(`Automated priority SMS/Pager dispatched to ${nearestCheckpoint.staffAvailability} at ${nearestCheckpoint.name}!`, "safe");
      };
    }

    const btnToggleSim = container.querySelector("#btn-toggle-sim-detail");
    if (btnToggleSim) {
      btnToggleSim.onclick = () => {
        const isPlaying = this.simulation.togglePlayPause();
        btnToggleSim.innerHTML = `<span>${isPlaying ? '⏸ Pause Telemetry' : '▶ Resume Telemetry'}</span>`;
        this.modals.showToast(isPlaying ? "Telemetry simulation resumed" : "Telemetry simulation paused", "info");
      };
    }

    // Chart metric toggles
    container.querySelectorAll(".chart-metric-btn").forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll(".chart-metric-btn").forEach(b => {
          b.classList.remove("active", "bg-white", "text-blue-600", "shadow-xs");
          b.classList.add("text-slate-500");
        });
        btn.classList.add("active", "bg-white", "text-blue-600", "shadow-xs");
        btn.classList.remove("text-slate-500");
        const metric = btn.getAttribute("data-metric");
        this.charts.setMetric(metric, shipment);
      };
    });

    // Chart window toggles
    container.querySelectorAll(".chart-window-btn").forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll(".chart-window-btn").forEach(b => {
          b.classList.remove("active", "bg-white", "text-blue-600", "shadow-xs");
          b.classList.add("text-slate-500");
        });
        btn.classList.add("active", "bg-white", "text-blue-600", "shadow-xs");
        btn.classList.remove("text-slate-500");
        const win = btn.getAttribute("data-window");
        this.charts.setTimeWindow(win, shipment);
      };
    });

    // Initialize Chart & Map
    setTimeout(() => {
      this.charts.updateTelemetryChart(shipment);
      this.charts.updateViabilityProjectionChart(trajectoryData);

      this.mapView = new RouteMapView("route-map-container", {
        onSelectCheckpoint: (cp) => {
          this.modals.openRerouteModal(shipment, cp);
        }
      });
      this.mapView.renderShipment(shipment, this.checkpoints);
    }, 50);
  }

  // ==========================================================================
  // VIEW 4: DEDICATED EXCURSION DETECTION RULE ENGINE INSPECTOR
  // ==========================================================================
  renderExcursionEngineView(container) {
    if (!container) container = document.getElementById("main-content-view");
    if (!container) return;

    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
    const engine = this.simulation.excursionEngine;
    const detection = engine.evaluate(s);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <!-- Title & Config Button -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Temperature Excursion Detection Engine</h1>
            <p class="text-xs text-slate-500">Live 19-parameter rule evaluation matrix & configurable threshold settings.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-open-threshold-config-engine" class="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-1.5">
              <span>Edit Category Thresholds</span>
            </button>
          </div>
        </div>

        <!-- Target Shipment Selector Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-600">Inspecting Shipment:</span>
            <select id="engine-select-shipment" class="text-xs font-bold border border-slate-300 rounded-lg p-2 bg-slate-50">
              ${this.simulation.shipments.map(item => `
                <option value="${item.id}" ${item.id === this.selectedShipmentId ? 'selected' : ''}>
                  ${item.id} — ${item.vaccineName} (${item.currentTemperature}°C)
                </option>
              `).join("")}
            </select>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${
            detection.excursion_severity === 'Critical' ? 'bg-red-100 text-red-800' :
            detection.excursion_severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
            'bg-emerald-100 text-emerald-800'
          }">
            Status: ${detection.excursion_status}
          </span>
        </div>

        <!-- Active Triggered Rules Panel -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-900 text-sm">Rule Execution & Anomaly Classification</h3>
          
          <div class="space-y-3">
            ${detection.triggered_rules.length > 0 ? detection.triggered_rules.map(r => `
              <div class="p-4 rounded-xl border ${
                r.severity === 'Critical' ? 'bg-red-50 border-red-200' :
                r.severity === 'High Risk' ? 'bg-orange-50 border-orange-200' :
                'bg-amber-50 border-amber-200'
              } space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      r.severity === 'Critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }">${r.ruleId}</span>
                    <span class="font-bold text-sm text-slate-900">${r.ruleName}</span>
                  </div>
                  <span class="text-xs font-bold uppercase tracking-wider ${
                    r.severity === 'Critical' ? 'text-red-700' : 'text-amber-800'
                  }">${r.severity}</span>
                </div>
                <div class="text-xs text-slate-700">
                  <b>Reading Responsible:</b> <span class="font-mono font-medium">${r.readingResponsible}</span> • <b>Delta:</b> <span class="font-bold">${r.delta}</span>
                </div>
                <div class="text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200/60 text-slate-800 font-medium leading-relaxed">
                  <b>Recommended Action:</b> ${r.recommendedAction}
                </div>
              </div>
            `).join("") : `
              <div class="p-6 text-center text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div class="text-2xl mb-1">🛡️</div>
                <div class="font-bold text-sm">All 9 Rule Conditions Nominal</div>
                <div class="text-xs text-emerald-600 mt-0.5">Continuous telemetry remains completely within configured envelope limits.</div>
              </div>
            `}
          </div>
        </div>

        <!-- 19-Parameter Telemetry Grid Schema -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900 text-sm">Rule Engine Input Parameters (19 Tracked Fields)</h3>
            <span class="text-xs font-mono text-slate-400">Schema: WHO-TTSPP-2026</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">current_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.current_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">min_allowed_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.min_allowed_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">max_allowed_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.max_allowed_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">current_humidity_percent</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.current_humidity_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">min_allowed_humidity_percent</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.min_allowed_humidity_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">max_allowed_humidity_percent</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.max_allowed_humidity_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">excursion_start_timestamp</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5 truncate">${detection.excursion_start_timestamp || 'None'}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">excursion_duration_minutes</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.excursion_duration_minutes} mins</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">temperature_deviation_c</span>
              <div class="font-bold text-red-600 font-mono mt-0.5">Δ ${detection.temperature_deviation_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">peak_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.peak_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">minimum_recorded_temperature_c</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.minimum_recorded_temperature_c}°C</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">cumulative_excursion_minutes</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.cumulative_excursion_minutes} mins</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">consecutive_out_of_range_readings</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.consecutive_out_of_range_readings}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">sensor_reading_timestamp</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5 truncate">${detection.sensor_reading_timestamp}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">sensor_data_age_seconds</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.sensor_data_age_seconds}s</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">sensor_status</span>
              <div class="font-bold text-slate-900 font-mono mt-0.5">${detection.sensor_status}</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">detection_confidence_percent</span>
              <div class="font-bold text-emerald-600 font-mono mt-0.5">${detection.detection_confidence_percent}%</div>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span class="text-slate-400 text-[10px] font-mono">excursion_severity</span>
              <div class="font-bold font-mono mt-0.5 ${detection.excursion_severity === 'Critical' ? 'text-red-600' : 'text-slate-900'}">${detection.excursion_severity}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const select = container.querySelector("#engine-select-shipment");
    if (select) {
      select.onchange = (e) => {
        this.selectedShipmentId = e.target.value;
        this.renderExcursionEngineView(container);
      };
    }

    const btnConfig = container.querySelector("#btn-open-threshold-config-engine");
    if (btnConfig) {
      btnConfig.onclick = () => {
        this.modals.openThresholdModal(s.vaccineCategory, this.vaccineProfiles);
      };
    }
  }

  // ==========================================================================
  // VIEW 5: VACCINE VIABILITY LAB (Section 6)
  // ==========================================================================
  renderViabilityLabView(container) {
    if (!container) container = document.getElementById("main-content-view");
    if (!container) return;

    const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
    const prof = this.vaccineProfiles[s.vaccineCategory] || {};
    const viability = ViabilityModel.estimateViability(s, prof);

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Vaccine Viability & Degradation Lab</h1>
            <p class="text-xs text-slate-500">Kinetic Arrhenius simulation modeling biological potency over thermal transit exposure.</p>
          </div>
          <span class="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
            Simulation Estimate — Not Clinically Validated
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Gauge & Predictions -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-900 text-sm">Target Biologic Potency</h3>
            
            <div class="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <div class="text-4xl font-extrabold font-mono ${viability.estimatedRemainingViabilityPercent >= 90 ? 'text-emerald-600' : 'text-red-600'}">
                ${viability.estimatedRemainingViabilityPercent}%
              </div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Remaining Viability</div>
              <div class="text-xs text-slate-400">Baseline Starting Potency: 99.8%</div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Estimated Viability Loss:</span>
                <span class="font-bold text-red-600">-${viability.estimatedViabilityLossPercent}%</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Predicted Spoilage Probability:</span>
                <span class="font-bold text-slate-800">${viability.predictedSpoilageRiskPercent}%</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Model Confidence Level:</span>
                <span class="font-bold text-emerald-600">${viability.confidenceLevelPercent}%</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span class="text-slate-500">Predicted Potency at Final Arrival:</span>
                <span class="font-bold font-mono text-indigo-600">${viability.predictedViabilityAtArrival}%</span>
              </div>
            </div>
          </div>

          <!-- Middle & Right: Model Formula & Sensitivity -->
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-900 text-sm">Heuristic Kinetic Exposure Parameters</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Biologic macromolecular degradation accelerates exponentially as core temperature deviates beyond safe glass-transition or cold chain thresholds. The ColdGuard engine computes exposure degree-hours and cumulative thermal stress.
            </p>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Vaccine Category</div>
                <div class="font-bold text-slate-900 mt-0.5">${prof.categoryName}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Storage Profile</div>
                <div class="font-bold text-slate-900 mt-0.5">${prof.storageReq}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Safe Handling Window</div>
                <div class="font-bold text-slate-900 mt-0.5">${viability.safeHandlingWindow}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-slate-400 text-[10px] uppercase font-bold">Time to Critical Risk</div>
                <div class="font-bold text-slate-900 mt-0.5">${viability.timeToCriticalRisk}</div>
              </div>
            </div>

            <div class="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 text-xs">
              <div class="font-bold text-indigo-950">Recommended Intervention Strategy:</div>
              <div class="text-indigo-900 leading-relaxed">${viability.recommendedIntervention}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VIEW 6: CHECKPOINT NETWORK DIRECTORY (Section 7)
  // ==========================================================================
  renderCheckpointsView(container) {
    if (!container) container = document.getElementById("main-content-view");
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Cold Chain Checkpoint Network</h1>
            <p class="text-xs text-slate-500">Certified cryogenic storage facilities, regional hospital vaccine depots, and emergency hubs.</p>
          </div>
          <span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
            ${this.checkpoints.length} Certified Facilities
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this.checkpoints.map(cp => `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 hover:shadow-md transition">
              <div class="flex items-start justify-between">
                <div>
                  <span class="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider">${cp.id} • ${cp.type}</span>
                  <h3 class="font-bold text-sm text-slate-900 mt-0.5">${cp.name}</h3>
                  <div class="text-xs text-slate-500">📍 ${cp.city}</div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                  cp.operatingStatus.includes('24/7') ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }">
                  ${cp.operatingStatus}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span class="text-slate-400 text-[10px]">Available Doses:</span>
                  <div class="font-bold text-slate-800">${(cp.availableCapacityDoses || 0).toLocaleString()}</div>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px]">Emergency Phone:</span>
                  <div class="font-mono text-slate-700">${cp.emergencyPhone}</div>
                </div>
              </div>

              <div class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span class="font-semibold text-slate-700">Supported Tiers:</span>
                <div class="flex flex-wrap gap-1 mt-1">
                  ${(cp.storageTiers || []).map(tier => `
                    <span class="px-1.5 py-0.5 bg-white border border-slate-200 text-[10px] font-medium rounded text-slate-600">${tier}</span>
                  `).join("")}
                </div>
              </div>

              <button class="btn-checkpoint-reroute w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition" data-id="${cp.id}">
                Select for Emergency Reroute
              </button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-checkpoint-reroute").forEach(btn => {
      btn.onclick = () => {
        const cpId = btn.getAttribute("data-id");
        const cp = this.checkpoints.find(c => c.id === cpId);
        const s = this.simulation.shipments.find(item => item.id === this.selectedShipmentId) || this.simulation.shipments[0];
        if (cp && s) {
          this.modals.openRerouteModal(s, cp);
        }
      };
    });
  }

  // --- Header & Global Controls ---
  bindHeaderControls() {
    // Play/Pause button
    const btnPlayPause = document.getElementById("btn-sim-play-pause");
    if (btnPlayPause) {
      btnPlayPause.onclick = () => {
        const isRunning = this.simulation.togglePlayPause();
        btnPlayPause.innerHTML = isRunning
          ? `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="hidden sm:inline">Pause</span>`
          : `<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="hidden sm:inline">Resume</span>`;
        this.modals.showToast(isRunning ? "Simulation active" : "Simulation paused", "info");
      };
    }

    // Speed multiplier buttons
    document.querySelectorAll(".sim-speed-btn").forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll(".sim-speed-btn").forEach(b => b.classList.remove("bg-blue-600", "text-white"));
        btn.classList.add("bg-blue-600", "text-white");
        const speed = parseInt(btn.getAttribute("data-speed"), 10) || 1;
        this.simulation.setSpeed(speed);
        this.modals.showToast(`Simulation speed set to ${speed}x`, "info");
      };
    });

    // Sound toggle
    const btnSound = document.getElementById("btn-toggle-sound");
    if (btnSound) {
      btnSound.onclick = () => {
        this.soundAlertsEnabled = !this.soundAlertsEnabled;
        btnSound.innerHTML = this.soundAlertsEnabled
          ? `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg><span class="hidden md:inline">Alert Audio: On</span>`
          : `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg><span class="hidden md:inline">Alert Audio: Off</span>`;
        if (this.soundAlertsEnabled) {
          this.playAlertTone("warning");
        }
        this.modals.showToast(`Audio alerts ${this.soundAlertsEnabled ? 'enabled' : 'disabled'}`, "info");
      };
    }

    // Quick Scenario Dropdown in Header
    const selectScenario = document.getElementById("select-header-scenario");
    if (selectScenario) {
      selectScenario.onchange = (e) => {
        const val = e.target.value;
        if (!val) return;
        switch (val) {
          case "reefer_failure":
            this.simulation.injectRefrigerationFailure(this.selectedShipmentId);
            this.playAlertTone("critical");
            this.modals.showToast("Injected Reefer Compressor Failure", "critical");
            break;
          case "dryice_depletion":
            this.simulation.injectDryIceDepletion(this.selectedShipmentId);
            this.playAlertTone("critical");
            this.modals.showToast("Injected Dry Ice Depletion", "critical");
            break;
          case "route_deviation":
            this.simulation.injectRouteDeviation(this.selectedShipmentId);
            this.playAlertTone("warning");
            this.modals.showToast("Injected Route Deviation", "warning");
            break;
          case "battery_low":
            this.simulation.injectSensorBatteryLow(this.selectedShipmentId);
            this.playAlertTone("warning");
            this.modals.showToast("Injected Low Battery Sensor Alert", "warning");
            break;
          case "humidity_spike":
            this.simulation.injectHumiditySpike(this.selectedShipmentId);
            this.playAlertTone("warning");
            this.modals.showToast("Injected Door Ajar Humidity Spike", "warning");
            break;
          case "cold_recovery":
            this.simulation.injectColdRecovery(this.selectedShipmentId);
            this.modals.showToast("Restored Cold Chain parameters", "safe");
            break;
          case "reset_all":
            this.simulation.resetAllToSafe(INITIAL_SHIPMENTS);
            this.modals.showToast("Reset all shipments to baseline", "safe");
            break;
        }
        selectScenario.value = "";
      };
    }

    // Top Search input in header
    const topSearch = document.getElementById("header-quick-search");
    if (topSearch) {
      topSearch.oninput = (e) => {
        this.filters.searchQuery = e.target.value;
        if (this.currentView !== "shipments") {
          this.switchView("shipments");
        } else {
          this.renderShipmentsTable();
        }
      };
    }
  }

  bindNavigation() {
    document.querySelectorAll(".nav-link").forEach(btn => {
      btn.onclick = () => {
        const view = btn.getAttribute("data-view");
        if (view) this.switchView(view);
      };
    });
  }

  bindGlobalKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        const topSearch = document.getElementById("header-quick-search");
        if (topSearch) topSearch.focus();
      } else if (e.key === "Escape") {
        this.modals.closeModal();
      }
    });
  }

  updateHeaderBadges() {
    const criticals = this.simulation.shipments.filter(s => s.excursionSeverity === "Critical");
    const badge = document.getElementById("header-critical-count");
    if (badge) {
      badge.textContent = criticals.length;
      badge.className = criticals.length > 0
        ? "px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse"
        : "px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white";
    }
  }

  // Execute Reroute action from modal
  executeReroute(shipmentId, checkpoint) {
    this.simulation.rerouteShipmentToCheckpoint(shipmentId, checkpoint);

    // Sync to Firebase RTDB and log WHO audit entry
    if (this.dbService) {
      this.dbService.logAuditEntry({
        shipmentId,
        event: "EMERGENCY_REROUTE_EXECUTED",
        details: `Rerouted shipment ${shipmentId} to certified cold-storage hub: ${checkpoint.name} (${checkpoint.city}). Distance: ${checkpoint.distanceKm}km.`,
        targetCheckpoint: checkpoint.name
      });
      const s = this.simulation.shipments.find(item => item.id === shipmentId);
      if (s) {
        this.dbService.updateShipmentTelemetry(shipmentId, {
          temperature: s.currentTemperature,
          humidity: s.currentHumidity,
          latitude: s.gpsLatitude,
          longitude: s.gpsLongitude,
          batteryLevel: s.batteryLevel,
          viability: s.estimatedViabilityPercent,
          riskClassification: s.riskClassification,
          excursionStatus: "Rerouted"
        });
      }
    }

    if (this.currentView === "details") {
      this.renderDetailsView(document.getElementById("main-content-view"));
    }
  }

  // Update Category Thresholds from modal
  updateCategoryThresholds(catKey, newLimits) {
    this.simulation.excursionEngine.updateCategoryThresholds(catKey, newLimits);
    if (this.vaccineProfiles[catKey]) {
      this.vaccineProfiles[catKey] = {
        ...this.vaccineProfiles[catKey],
        ...newLimits
      };
    }
    if (this.dbService) {
      this.dbService.updateCategoryThresholds(catKey, newLimits);
      this.dbService.logAuditEntry({
        categoryKey: catKey,
        event: "THRESHOLDS_UPDATED",
        details: `Updated temperature thresholds for ${catKey}: Min ${newLimits.minTemp}°C, Max ${newLimits.maxTemp}°C.`
      });
    }
    this.simulation.reevaluateAll();
    this.renderCurrentView();
  }
}

// Bootstrap on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  window.coldGuardApp = new ColdGuardApp();
});
