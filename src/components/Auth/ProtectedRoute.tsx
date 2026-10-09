// ============================================================================
// ColdGuard - Protected Route Component (React & TypeScript)
// Redirects unauthenticated users to the Login Page
// ============================================================================

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LoginPage } from "./LoginPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-4 animate-pulse shadow-lg">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="text-sm font-bold text-slate-800">Verifying Operator Credentials...</div>
        <div className="text-xs text-slate-400 mt-1">Checking active Firebase Authentication session</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
