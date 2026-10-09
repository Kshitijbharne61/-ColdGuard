// ============================================================================
// ColdGuard - React Authentication Context Provider & Hook
// ============================================================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  AuthError
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { AuthContextType, LoginCredentials, RegisterCredentials, UserProfile } from "../types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to translate Firebase technical error codes to clear user-facing messages
export function mapFirebaseAuthError(error: AuthError | any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "The email address entered is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact the ColdGuard administrator.";
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please verify your credentials.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please choose at least 6 characters with mixed characters.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication → Sign-in method.";
    case "auth/too-many-requests":
      return "Access temporarily blocked due to many failed attempts. Try again in a few minutes or reset your password.";
    case "auth/network-request-failed":
      return "Network connection issue. Check your internet connection and try again.";
    default:
      return error?.message || "An unexpected authentication error occurred. Please try again.";
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes with onAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Operator",
          photoURL: currentUser.photoURL,
          role: "logistics_operator",
          createdAt: currentUser.metadata.creationTime
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Firebase auth state change error:", err);
      setError(mapFirebaseAuthError(err));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  // 1. User Registration
  const register = async ({ name, email, password }: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      if (name.trim()) {
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });
      }
      setUser(userCredential.user);
      setProfile({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name.trim() || userCredential.user.email?.split("@")[0] || "Operator",
        role: "logistics_operator"
      });
    } catch (err: any) {
      const errorMsg = mapFirebaseAuthError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 2. User Login
  const login = async ({ email, password }: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (err: any) {
      const errorMsg = mapFirebaseAuthError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 3. User Logout
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      const errorMsg = mapFirebaseAuthError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Password Reset via Email
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const errorMsg = mapFirebaseAuthError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      error,
      login,
      register,
      logout,
      resetPassword,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
