// ============================================================================
// ColdGuard - Firebase Configuration & Initialization (TypeScript / React)
// Project: coldguard-fdfc5
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  Auth, 
  browserLocalPersistence, 
  setPersistence 
} from "firebase/auth";
import { 
  getDatabase, 
  Database,
  ref,
  onValue,
  set,
  push,
  update
} from "firebase/database";

// Official Firebase Web Client Configuration for coldguard-fdfc5
export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyBfSlebvjBF2_00ufmGzitxd7_DOaiioH4",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "coldguard-fdfc5.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "coldguard-fdfc5",
  databaseURL: import.meta.env?.VITE_FIREBASE_DATABASE_URL || "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "coldguard-fdfc5.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "762365902613",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:762365902613:web:11214330a4e690af67731c",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-DPJKJJ3QKJ"
};

// Initialize Firebase App (reuse existing instance if already initialized)
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Firebase Realtime Database with explicit databaseURL
export const db: Database = getDatabase(app, firebaseConfig.databaseURL);

// Ensure persistent session across browser reloads
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Failed to set Firebase Auth persistence to local:", err);
  });
}

export { ref, onValue, set, push, update };
export default app;
