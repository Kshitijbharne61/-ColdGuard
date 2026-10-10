// ============================================================================
// ColdGuard - Authentication UI Components & Modals
// Login / Registration / Password Reset / Firebase Project Configurator
// ============================================================================

export class AuthUiManager {
  constructor(authService, onAuthSuccess) {
    this.authService = authService;
    this.onAuthSuccess = onAuthSuccess;
    this.currentMode = "login"; // "login" | "register" | "forgot_password"
  }

  renderAuthView(container) {
    container.innerHTML = `
      <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 animate-fade-in">
        
        <!-- Top Config Shortcut -->
        <div class="absolute top-5 right-5">
          <button id="btn-open-firebase-config" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-xs transition flex items-center gap-1.5">
            <svg class="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.89 15.672L6.255.476A.5.5 0 0 1 7.18.232l3.415 6.442L3.89 15.672zm15.864-3.832L17.7 2.054a.5.5 0 0 0-.907-.05l-2.73 5.215 5.69 4.621zm-8.878-7.85l-7.79 14.654 10.985 6.168a1.5 1.5 0 0 0 1.458 0l7.218-4.053-11.87-16.77z"/>
            </svg>
            <span>Firebase Config</span>
          </button>
        </div>

        <!-- Header / Logo -->
        <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/20 mb-3">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v5"/>
              <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
              <path d="M9 10l6 0"/>
            </svg>
          </div>

          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">ColdGuard</h1>
          <p class="mt-1 text-xs font-bold uppercase tracking-wider text-blue-600">
            Protect Every Dose. Predict Every Excursion.
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Authorized Vaccine Cold Chain Monitoring Portal
          </p>
        </div>

        <!-- Card Container -->
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div class="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200 sm:px-10">
            
            <!-- Mode Tabs -->
            <div class="flex border-b border-slate-100 mb-6 text-xs font-bold text-slate-500">
              <button id="tab-login" class="flex-1 pb-3 text-center border-b-2 ${this.currentMode === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'} transition">
                Sign In
              </button>
              <button id="tab-register" class="flex-1 pb-3 text-center border-b-2 ${this.currentMode === 'register' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'} transition">
                Create Account
              </button>
              <button id="tab-forgot" class="flex-1 pb-3 text-center border-b-2 ${this.currentMode === 'forgot_password' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:text-slate-700'} transition">
                Reset Password
              </button>
            </div>

            <!-- Error Banner -->
            <div id="auth-error-banner" class="hidden mb-5 bg-red-50 border-l-4 border-red-500 p-3.5 rounded-xl flex items-start gap-3 text-xs text-red-900">
              <span class="text-base font-bold text-red-600">⚠️</span>
              <div id="auth-error-text" class="flex-1 font-medium leading-relaxed"></div>
            </div>

            <!-- Success Banner -->
            <div id="auth-success-banner" class="hidden mb-5 bg-emerald-50 border-l-4 border-emerald-500 p-3.5 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
              <span class="text-base font-bold text-emerald-600">✉️</span>
              <div id="auth-success-text" class="flex-1 font-medium leading-relaxed"></div>
            </div>

            <!-- Form -->
            <form id="auth-main-form" class="space-y-4 text-xs">
              <!-- Name (Register mode only) -->
              <div id="field-name-group" class="${this.currentMode === 'register' ? 'block' : 'hidden'}">
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Full Name / Title
                </label>
                <input id="input-auth-name" type="text" placeholder="Dr. Elena Rostova, Duty Pharmacist" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>

              <!-- Email -->
              <div>
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Official Email Address
                </label>
                <input id="input-auth-email" type="email" required placeholder="operator@coldguard.org" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
              </div>

              <!-- Password (Login & Register modes) -->
              <div id="field-password-group" class="${this.currentMode === 'forgot_password' ? 'hidden' : 'block'}">
                <div class="flex items-center justify-between mb-1">
                  <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Password
                  </label>
                  <button type="button" id="link-forgot-pw" class="text-[11px] text-blue-600 hover:underline font-semibold ${this.currentMode === 'login' ? 'inline-block' : 'hidden'}">
                    Forgot password?
                  </button>
                </div>
                <div class="relative">
                  <input id="input-auth-password" type="password" autocomplete="${this.currentMode === 'login' ? 'current-password' : 'new-password'}" placeholder="${this.currentMode === 'login' ? 'Enter 6-character password' : 'Enter password'}" aria-describedby="auth-password-help" class="w-full px-3.5 py-2.5 pr-16 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono" />
                  <button type="button" id="toggle-auth-password" aria-label="Show password" aria-pressed="false" class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800">Show</button>
                </div>
                <p id="auth-password-help" class="mt-1 text-[10px] text-slate-500">${this.currentMode === 'login' ? 'Password must contain exactly 6 characters.' : 'Use exactly 6 characters for this demo account policy.'}</p>
              </div>

              <!-- Confirm Password (Register mode only) -->
              <div id="field-confirm-group" class="${this.currentMode === 'register' ? 'block' : 'hidden'}">
                <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Confirm Password
                </label>
                <input id="input-auth-confirm" type="password" placeholder="••••••••••••" class="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono" />
              </div>

              <!-- Submit Button -->
              <button id="btn-auth-submit" type="submit" class="w-full mt-2 py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2">
                <span id="btn-auth-submit-text">${this.currentMode === 'login' ? 'Sign In to ColdGuard Dashboard' : this.currentMode === 'register' ? 'Create Verified Operator Account' : 'Send Password Reset Link'}</span>
              </button>

            </form>

            <!-- Bottom Disclaimer -->
            <div class="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                Firebase Auth Active
              </span>
              <span>WHO PQS Annex 9</span>
            </div>

          </div>
        </div>
      </div>
    `;

    this.bindAuthEvents(container);
  }

  bindAuthEvents(container) {
    const tabLogin = container.querySelector("#tab-login");
    const tabRegister = container.querySelector("#tab-register");
    const tabForgot = container.querySelector("#tab-forgot");
    const linkForgot = container.querySelector("#link-forgot-pw");
    const btnConfig = container.querySelector("#btn-open-firebase-config");
    const passwordInput = container.querySelector("#input-auth-password");
    const togglePassword = container.querySelector("#toggle-auth-password");
    if (togglePassword && passwordInput) {
      togglePassword.onclick = () => {
        const show = passwordInput.type === "password";
        passwordInput.type = show ? "text" : "password";
        togglePassword.textContent = show ? "Hide" : "Show";
        togglePassword.setAttribute("aria-label", show ? "Hide password" : "Show password");
        togglePassword.setAttribute("aria-pressed", show ? "true" : "false");
      };
    }

    if (tabLogin) tabLogin.onclick = () => this.setMode("login", container);
    if (tabRegister) tabRegister.onclick = () => this.setMode("register", container);
    if (tabForgot) tabForgot.onclick = () => this.setMode("forgot_password", container);
    if (linkForgot) linkForgot.onclick = () => this.setMode("forgot_password", container);
    if (btnConfig) btnConfig.onclick = () => this.openFirebaseConfigModal();
    const form = container.querySelector("#auth-main-form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        await this.handleFormSubmit(container);
      };
    }
  }

  setMode(newMode, container) {
    this.currentMode = newMode;
    this.renderAuthView(container);
  }

  showError(container, message) {
    const banner = container.querySelector("#auth-error-banner");
    const text = container.querySelector("#auth-error-text");
    if (banner && text) {
      text.textContent = message;
      banner.classList.remove("hidden");
    }
    const successBanner = container.querySelector("#auth-success-banner");
    if (successBanner) successBanner.classList.add("hidden");
  }

  showSuccess(container, message) {
    const banner = container.querySelector("#auth-success-banner");
    const text = container.querySelector("#auth-success-text");
    if (banner && text) {
      text.innerHTML = message;
      banner.classList.remove("hidden");
    }
    const errorBanner = container.querySelector("#auth-error-banner");
    if (errorBanner) errorBanner.classList.add("hidden");
  }

  async handleFormSubmit(container) {
    const emailInput = container.querySelector("#input-auth-email");
    const passwordInput = container.querySelector("#input-auth-password");
    const nameInput = container.querySelector("#input-auth-name");
    const confirmInput = container.querySelector("#input-auth-confirm");
    const submitBtn = container.querySelector("#btn-auth-submit");
    const submitText = container.querySelector("#btn-auth-submit-text");

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";
    const name = nameInput?.value?.trim() || "";
    const confirm = confirmInput?.value || "";

    // Clear previous alerts
    container.querySelector("#auth-error-banner")?.classList.add("hidden");
    container.querySelector("#auth-success-banner")?.classList.add("hidden");

    // Validation
    if (!email) {
      this.showError(container, "Please enter your official email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError(container, "Please enter a valid email address (e.g. name@hospital.org).");
      return;
    }

    // Validate length before contacting Firebase. Length alone never grants access.
    if ((this.currentMode === "login" || this.currentMode === "register") && password.length !== 6) {
      this.showError(container, "Password must be exactly 6 characters.");
      return;
    }

    // Set Loading state
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Authenticating via Firebase...</span>
    `;

    try {
      if (this.currentMode === "forgot_password") {
        await this.authService.resetPassword(email);
        this.showSuccess(container, `Password reset link dispatched! Please check your inbox at <b>${email}</b>.`);
      } else if (this.currentMode === "register") {
        if (!name) {
          throw new Error("Please enter your full name and duty title.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (password !== confirm) {
          throw new Error("Passwords do not match. Please re-enter.");
        }
        const user = await this.authService.register(name, email, password);
        if (this.onAuthSuccess) this.onAuthSuccess(user);
      } else {
        // Login
        if (!password) {
          throw new Error("Please enter your password.");
        }
        const user = await this.authService.login(email, password);
        if (this.onAuthSuccess) this.onAuthSuccess(user);
      }
    } catch (err) {
      this.showError(container, err.message || "Authentication failed. Please verify credentials.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) {
        submitText.textContent = this.currentMode === 'login'
          ? 'Sign In to ColdGuard Dashboard'
          : this.currentMode === 'register'
          ? 'Create Verified Operator Account'
          : 'Send Password Reset Link';
      }
    }
  }

  // --- Modal: Firebase Project Credentials Configuration ---
  openFirebaseConfigModal() {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;

    const currentConfig = this.authService.config;

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-up">
          <div class="bg-slate-900 p-5 text-white flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.89 15.672L6.255.476A.5.5 0 0 1 7.18.232l3.415 6.442L3.89 15.672zm15.864-3.832L17.7 2.054a.5.5 0 0 0-.907-.05l-2.73 5.215 5.69 4.621zm-8.878-7.85l-7.79 14.654 10.985 6.168a1.5 1.5 0 0 0 1.458 0l7.218-4.053-11.87-16.77z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Firebase Project Web Credentials</h3>
                <p class="text-xs text-slate-400">Connect to your Firebase Authentication backend</p>
              </div>
            </div>
            <button id="btn-close-firebase-config" class="text-slate-400 hover:text-white p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div class="p-6 space-y-4 text-xs">
            <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-900 leading-relaxed">
              <b>How to get your credentials:</b> In <a href="https://console.firebase.google.com" target="_blank" class="underline font-bold text-blue-700">Firebase Console</a> → Project Settings (⚙️) → General → Scroll to <b>Your apps</b> → Web app. Ensure <b>Email/Password</b> is enabled in <i>Authentication → Sign-in method</i>.
            </div>

            <div class="space-y-3">
              <div>
                <label class="block font-bold text-slate-700 text-[11px] mb-1">API Key (apiKey)</label>
                <input id="cfg-api-key" type="text" value="${currentConfig.apiKey || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Auth Domain</label>
                  <input id="cfg-auth-domain" type="text" value="${currentConfig.authDomain || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Project ID</label>
                  <input id="cfg-project-id" type="text" value="${currentConfig.projectId || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">Storage Bucket</label>
                  <input id="cfg-storage-bucket" type="text" value="${currentConfig.storageBucket || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 text-[11px] mb-1">App ID</label>
                  <input id="cfg-app-id" type="text" value="${currentConfig.appId || ''}" class="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button id="btn-reset-firebase-default" class="text-xs text-slate-500 hover:text-slate-800 font-medium">Reset to Default</button>
            <div class="flex items-center gap-2">
              <button id="btn-cancel-firebase-config" class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button id="btn-save-firebase-config" class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow">Save & Connect</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-close-firebase-config").onclick = () => modalContainer.innerHTML = "";
    document.getElementById("btn-cancel-firebase-config").onclick = () => modalContainer.innerHTML = "";

    document.getElementById("btn-reset-firebase-default").onclick = () => {
      localStorage.removeItem("coldguard_firebase_config");
      location.reload();
    };

    document.getElementById("btn-save-firebase-config").onclick = () => {
      const apiKey = document.getElementById("cfg-api-key").value.trim();
      const authDomain = document.getElementById("cfg-auth-domain").value.trim();
      const projectId = document.getElementById("cfg-project-id").value.trim();
      const storageBucket = document.getElementById("cfg-storage-bucket").value.trim();
      const appId = document.getElementById("cfg-app-id").value.trim();

      this.authService.saveConfig({ apiKey, authDomain, projectId, storageBucket, appId });
      modalContainer.innerHTML = "";
      alert("Firebase credentials updated and saved!");
    };
  }
}
