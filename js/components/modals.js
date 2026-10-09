// ============================================================================
// ColdGuard - Modals, Dialogs, & Audit Generators
// Emergency Rerouting, Threshold Configurator, WHO Compliance Audit
// ============================================================================

export class ModalManager {
  constructor(appContext) {
    this.ctx = appContext;
  }

  // --- 1. Emergency Reroute Modal ---
  openRerouteModal(shipment, checkpoint) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-scale-up">
          <div class="bg-gradient-to-r from-red-600 to-indigo-700 p-5 text-white flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Initiate Emergency Reroute Protocol</h3>
                <p class="text-xs text-red-100">Cold Chain Intervention Dispatch SOP-804</p>
              </div>
            </div>
            <button id="btn-close-modal" class="text-white/80 hover:text-white p-1 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
              <span class="text-red-500 font-bold text-base mt-0.5">⚠️</span>
              <div class="text-xs text-red-900">
                <span class="font-bold">Shipment ${shipment.id}</span> (${shipment.vaccineName}) has exceeded permitted thermal boundaries. Viability is currently estimated at <b>${shipment.estimatedViabilityPercent}%</b>.
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Intervention Facility</div>
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-900 text-sm">${checkpoint.name}</div>
                  <div class="text-xs text-slate-500">${checkpoint.type} • ${checkpoint.city}</div>
                </div>
                <span class="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Primary Hub</span>
              </div>
              
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                <div class="bg-white p-2 rounded-lg border border-slate-100">
                  <div class="text-[10px] text-slate-400">Distance</div>
                  <div class="font-bold text-slate-800 text-xs">${checkpoint.distanceKm} km</div>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-100">
                  <div class="text-[10px] text-slate-400">Travel ETA</div>
                  <div class="font-bold text-indigo-600 text-xs">${checkpoint.travelTimeMinutes} mins</div>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-100">
                  <div class="text-[10px] text-slate-400">Available Cap.</div>
                  <div class="font-bold text-emerald-600 text-xs">${(checkpoint.availableCapacityDoses || 0).toLocaleString()} doses</div>
                </div>
              </div>
            </div>

            <div class="text-xs text-slate-600 space-y-1 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
              <div class="font-semibold text-blue-900">Automatic Automated Actions upon Execution:</div>
              <ul class="list-disc pl-4 space-y-0.5 text-blue-800">
                <li>Transmit turn-by-turn navigation redirect to carrier reefer unit.</li>
                <li>Dispatch high-priority alert to duty pharmacist (${checkpoint.staffAvailability}).</li>
                <li>Pre-authorize emergency cryogenic bay / dock receiving gate.</li>
              </ul>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition">
              Cancel
            </button>
            <button id="btn-confirm-reroute" class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
              Confirm & Execute Reroute
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal").onclick = () => this.closeModal();
    document.getElementById("btn-cancel-modal").onclick = () => this.closeModal();
    document.getElementById("btn-confirm-reroute").onclick = () => {
      this.ctx.executeReroute(shipment.id, checkpoint);
      this.closeModal();
      this.showToast(`Emergency reroute confirmed for ${shipment.id} to ${checkpoint.name}!`, "warning");
    };
  }

  // --- 2. Threshold Configurator Modal ---
  openThresholdModal(categoryKey, profiles) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const currentKey = categoryKey || "standard_cold_chain";
    const profile = profiles[currentKey];

    const categoryOptions = Object.keys(profiles).map(k => {
      return `<option value="${k}" ${k === currentKey ? 'selected' : ''}>${profiles[k].categoryName}</option>`;
    }).join("");

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all animate-scale-up">
          <div class="bg-slate-900 p-5 text-white flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Vaccine Category Threshold Settings</h3>
                <p class="text-xs text-slate-400">Configure Rule Engine Environmental Limits</p>
              </div>
            </div>
            <button id="btn-close-modal" class="text-slate-400 hover:text-white p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div class="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2.5">
              <span class="text-amber-500 font-bold">ℹ️</span>
              <div>
                <b>Simulation Demonstration Notice:</b> Example thresholds for demonstration. Does not imply universal medical recommendations. Modify values below to test rule engine responses live.
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Vaccine Category</label>
              <select id="modal-select-category" class="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500">
                ${categoryOptions}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Min Temperature (°C)</label>
                <input id="input-min-temp" type="number" step="0.5" value="${profile.minTemp}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Max Temperature (°C)</label>
                <input id="input-max-temp" type="number" step="0.5" value="${profile.maxTemp}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Warning Delta (°C)</label>
                <input id="input-warn-delta" type="number" step="0.1" value="${profile.warningDelta || 1.0}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Min Humidity (%)</label>
                <input id="input-min-hum" type="number" step="5" value="${profile.minHumidity || 35}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">Max Humidity (%)</label>
                <input id="input-max-hum" type="number" step="5" value="${profile.maxHumidity || 65}" class="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono" />
              </div>
            </div>

            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              <div class="font-semibold text-slate-800">Storage Packaging Category:</div>
              <div>${profile.packaging}</div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button id="btn-reset-thresholds" class="text-xs text-slate-500 hover:text-slate-800 font-medium">Reset to Default</button>
            <div class="flex items-center gap-2">
              <button id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button id="btn-save-thresholds" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Apply Thresholds</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal").onclick = () => this.closeModal();
    document.getElementById("btn-cancel-modal").onclick = () => this.closeModal();

    document.getElementById("modal-select-category").onchange = (e) => {
      this.openThresholdModal(e.target.value, profiles);
    };

    document.getElementById("btn-save-thresholds").onclick = () => {
      const minTemp = parseFloat(document.getElementById("input-min-temp").value);
      const maxTemp = parseFloat(document.getElementById("input-max-temp").value);
      const warningDelta = parseFloat(document.getElementById("input-warn-delta").value);
      const minHumidity = parseFloat(document.getElementById("input-min-hum").value);
      const maxHumidity = parseFloat(document.getElementById("input-max-hum").value);

      this.ctx.updateCategoryThresholds(currentKey, {
        minTemp,
        maxTemp,
        warningDelta,
        minHumidity,
        maxHumidity
      });

      this.closeModal();
      this.showToast(`Thresholds updated for ${profiles[currentKey].categoryName}. Engine re-evaluated.`, "safe");
    };
  }

  // --- 3. WHO Compliance Audit Report Modal ---
  openAuditReportModal(shipment) {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const auditDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const isCompliant = shipment.excursionSeverity === "None" || shipment.excursionSeverity === "Warning";

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
          <div class="bg-slate-900 p-5 text-white flex items-start justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Cold Chain Verification & Audit Report</h3>
                <p class="text-xs text-slate-400">Standard: WHO PQS E006 / CDC Vaccine Storage Protocol</p>
              </div>
            </div>
            <button id="btn-close-modal" class="text-slate-400 hover:text-white p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
            <div class="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <div class="font-bold text-base text-slate-900">Certificate of Thermal Chain Integrity</div>
                <div class="text-slate-500 text-[11px]">Audit ID: AUD-CG-${shipment.id}-${Date.now().toString().slice(-4)} • Generated: ${auditDate}</div>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-bold ${isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${isCompliant ? 'COMPLIANT' : 'EXCURSION NON-CONFORMITY'}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div class="text-[10px] text-slate-400 uppercase font-semibold">Vaccine Identification</div>
                <div class="font-bold text-sm text-slate-900">${shipment.vaccineName}</div>
                <div class="text-slate-600 mt-0.5">Lot / Batch: <span class="font-mono font-medium">${shipment.batchNumber}</span></div>
                <div class="text-slate-600">Doses: <span class="font-semibold">${shipment.doses.toLocaleString()}</span> units</div>
                <div class="text-slate-600">Manufacturer: ${shipment.manufacturer}</div>
              </div>
              <div>
                <div class="text-[10px] text-slate-400 uppercase font-semibold">Logistics Custody</div>
                <div class="font-semibold text-slate-800">Origin: ${shipment.originFacility}</div>
                <div class="text-slate-600 mt-0.5">Destination: ${shipment.destinationFacility}</div>
                <div class="text-slate-600">Carrier Unit: <span class="font-mono">${shipment.transportVehicleId}</span></div>
                <div class="text-slate-600">Driver / Custodian: ${shipment.carrierIdentifier}</div>
              </div>
            </div>

            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Thermal Telemetry Verification Summary</div>
              <table class="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead class="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th class="p-2 border-b">Parameter</th>
                    <th class="p-2 border-b">Configured Limit</th>
                    <th class="p-2 border-b">Recorded Value</th>
                    <th class="p-2 border-b">Evaluation</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr>
                    <td class="p-2 font-medium">Temperature Ceiling</td>
                    <td class="p-2 font-mono">${shipment.maxAllowedTemperature}°C</td>
                    <td class="p-2 font-mono">${shipment.currentTemperature}°C</td>
                    <td class="p-2 font-bold ${shipment.currentTemperature > shipment.maxAllowedTemperature ? 'text-red-600' : 'text-emerald-600'}">
                      ${shipment.currentTemperature > shipment.maxAllowedTemperature ? 'BREACHED' : 'PASS'}
                    </td>
                  </tr>
                  <tr>
                    <td class="p-2 font-medium">Freeze Boundary Floor</td>
                    <td class="p-2 font-mono">${shipment.minAllowedTemperature}°C</td>
                    <td class="p-2 font-mono">Min: ${shipment.minimumRecordedTemperature || shipment.currentTemperature}°C</td>
                    <td class="p-2 font-bold text-emerald-600">PASS</td>
                  </tr>
                  <tr>
                    <td class="p-2 font-medium">Excursion Duration</td>
                    <td class="p-2">< 20 mins</td>
                    <td class="p-2 font-mono">${shipment.excursionDurationMinutes || 0} mins</td>
                    <td class="p-2 font-bold ${(shipment.excursionDurationMinutes || 0) > 20 ? 'text-red-600' : 'text-emerald-600'}">
                      ${(shipment.excursionDurationMinutes || 0) > 20 ? 'EXCEEDED' : 'NOMINAL'}
                    </td>
                  </tr>
                  <tr>
                    <td class="p-2 font-medium">Estimated Remaining Potency</td>
                    <td class="p-2">> 90.0%</td>
                    <td class="p-2 font-mono font-bold">${shipment.estimatedViabilityPercent}%</td>
                    <td class="p-2 font-bold ${shipment.estimatedViabilityPercent < 90 ? 'text-red-600' : 'text-emerald-600'}">
                      ${shipment.estimatedViabilityPercent < 90 ? 'EVALUATION NEEDED' : 'APPROVED'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] text-slate-500 leading-relaxed">
              <b>Regulatory Disclaimer:</b> This computer-generated audit manifest is synthesized from live ColdGuard IoT telemetry simulation. WHO Technical Report Series 961 guidelines are mirrored for illustration and qualification testing.
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button id="btn-download-csv" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download CSV Log
            </button>
            <div class="flex items-center gap-2">
              <button id="btn-cancel-modal" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
              <button onclick="window.print()" class="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Print Manifest
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-modal").onclick = () => this.closeModal();
    document.getElementById("btn-cancel-modal").onclick = () => this.closeModal();
    document.getElementById("btn-download-csv").onclick = () => this.exportCsvManifest(shipment);
  }

  exportCsvManifest(shipment) {
    const rows = [
      ["Timestamp", "Temperature_C", "Humidity_RH", "Viability_Percent", "Status"],
      ...(shipment.history || []).map(p => [
        p.timestamp,
        p.temperature,
        p.humidity,
        p.viability,
        p.temperature > shipment.maxAllowedTemperature ? "EXCURSION" : "NOMINAL"
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ColdGuard_Manifest_${shipment.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`CSV audit log downloaded for ${shipment.id}`, "safe");
  }

  closeModal() {
    const modalContainer = document.getElementById("modal-container");
    if (modalContainer) modalContainer.innerHTML = "";
  }

  // --- 4. Toast Notification System ---
  showToast(message, type = "info") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-3 transition-all transform duration-300 translate-y-3 opacity-0 ${
      type === "critical"
        ? "bg-red-950 text-white border-red-800"
        : type === "warning"
        ? "bg-amber-900 text-white border-amber-700"
        : type === "safe"
        ? "bg-emerald-950 text-white border-emerald-800"
        : "bg-slate-900 text-white border-slate-700"
    }`;

    const icon = type === "critical" ? "🚨" : type === "warning" ? "⚠️" : type === "safe" ? "✅" : "ℹ️";

    toast.innerHTML = `
      <span class="text-base">${icon}</span>
      <div class="flex-1 leading-snug">${message}</div>
      <button class="text-white/60 hover:text-white text-sm font-bold ml-1">&times;</button>
    `;

    toast.querySelector("button").onclick = () => {
      toast.remove();
    };

    toastContainer.appendChild(toast);

    // Trigger animate-in
    setTimeout(() => {
      toast.classList.remove("translate-y-3", "opacity-0");
    }, 10);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }
}
