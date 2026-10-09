// ============================================================================
// ColdGuard - Login & Registration Page (React & TypeScript)
// Matching ColdGuard's clean healthcare SaaS light-mode design
// ============================================================================

import React, { useState, FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";

type AuthMode = "login" | "register" | "forgot_password";

export const LoginPage: React.FC = () => {
  const { login, register, resetPassword, error, clearError, loading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<boolean>(false);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setValidationError(null);
    setResetSent(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setResetSent(false);

    // Validation
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setValidationError("Please enter a valid email address (e.g. name@hospital.org).");
      return;
    }

    if (mode === "forgot_password") {
      try {
        await resetPassword(cleanEmail);
        setResetSent(true);
      } catch (err) {
        // Error handled in AuthContext
      }
      return;
    }

    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setValidationError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setValidationError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setValidationError("Passwords do not match. Please re-enter.");
        return;
      }

      try {
        await register({ name, email: cleanEmail, password });
      } catch (err) {
        // Error handled in AuthContext
      }
    } else {
      // Login
      try {
        await login({ email: cleanEmail, password });
      } catch (err) {
        // Error handled in AuthContext
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <!-- Logo -->
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/20 mb-3">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v5"/>
            <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
            <path d="M9 10l6 0"/>
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ColdGuard</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
          Protect Every Dose. Predict Every Excursion.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Authorized Real-Time Vaccine Cold Chain Logistics Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200 sm:px-10">
          
          <!-- Mode Tabs -->
          <div className="flex border-b border-slate-100 mb-6 text-xs font-bold text-slate-500">
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className={`flex-1 pb-3 text-center border-b-2 transition ${
                mode === "login" ? "border-blue-600 text-blue-600" : "border-transparent hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className={`flex-1 pb-3 text-center border-b-2 transition ${
                mode === "register" ? "border-blue-600 text-blue-600" : "border-transparent hover:text-slate-700"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("forgot_password")}
              className={`flex-1 pb-3 text-center border-b-2 transition ${
                mode === "forgot_password" ? "border-blue-600 text-blue-600" : "border-transparent hover:text-slate-700"
              }`}
            >
              Reset
            </button>
          </div>

          <!-- Error Message Banner -->
          {(validationError || error) && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-3.5 rounded-xl flex items-start gap-3 text-xs text-red-900">
              <span className="text-base font-bold text-red-600">⚠️</span>
              <div className="flex-1 font-medium leading-relaxed">
                {validationError || error}
              </div>
            </div>
          )}

          <!-- Success Banner for Password Reset -->
          {resetSent && (
            <div className="mb-5 bg-emerald-50 border-l-4 border-emerald-500 p-3.5 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
              <span className="text-base font-bold text-emerald-600">✉️</span>
              <div className="flex-1 font-medium leading-relaxed">
                Password reset link dispatched! Please check your inbox at <b>{email}</b>.
              </div>
            </div>
          )}

          <!-- Auth Form -->
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {mode === "register" && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Full Name / Duty Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Marcus Vance, Lead Pharmacist"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@coldguard.org"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {mode !== "forgot_password" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => handleModeChange("forgot_password")}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono"
                />
              </div>
            )}

            {mode === "register" && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating via Firebase...</span>
                </>
              ) : mode === "login" ? (
                "Sign In to ColdGuard Dashboard"
              ) : mode === "register" ? (
                "Create Verified Operator Account"
              ) : (
                "Send Password Reset Link"
              )}
            </button>
          </form>

          <!-- Security Footnote -->
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Firebase Auth TLS Encrypted
            </span>
            <span>WHO PQS Standard</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
