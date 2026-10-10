// ============================================================================
// ColdGuard - Live Firebase Authentication Service
// "Protect Every Dose. Predict Every Excursion."
// ============================================================================

export class FirebaseAuthService {
  constructor() {
    this.auth = null;
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;

    // Default configuration (can be updated dynamically in UI or read from localStorage)
    this.config = this.loadConfig();
    this.init();
  }

  loadConfig() {
    const saved = localStorage.getItem("coldguard_firebase_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved Firebase config", e);
      }
    }

    // Official coldguard-fdfc5 Firebase project web app configuration
    return {
      apiKey: "AIzaSyBfSlebvjBF2_00ufmGzitxd7_DOaiioH4",
      authDomain: "coldguard-fdfc5.firebaseapp.com",
      projectId: "coldguard-fdfc5",
      databaseURL: "https://coldguard-fdfc5-default-rtdb.asia-southeast1.firebasedatabase.app",
      storageBucket: "coldguard-fdfc5.firebasestorage.app",
      messagingSenderId: "762365902613",
      appId: "1:762365902613:web:11214330a4e690af67731c",
      measurementId: "G-DPJKJJ3QKJ"
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("coldguard_firebase_config", JSON.stringify(this.config));
    // Re-initialize
    return this.init(true);
  }

  init(forceReinit = false) {
    if (typeof window.firebase === "undefined") {
      console.warn("Firebase SDK not yet loaded in window");
      return false;
    }

    try {
      if (forceReinit && window.firebase.apps.length > 0) {
        window.firebase.app().delete();
      }

      let app;
      if (window.firebase.apps.length === 0) {
        app = window.firebase.initializeApp(this.config);
      } else {
        app = window.firebase.app();
      }

      this.auth = window.firebase.auth();
      this.isInitialized = true;

      // Ensure persistent local storage session
      if (window.firebase.auth.Auth.Persistence.LOCAL) {
        this.auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
          console.warn("Could not set local persistence:", err);
        });
      }

      // State listener
      this.auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        this.notifyListeners(user);
      }, () => {
        // Fail closed if Firebase can no longer resolve the session.
        this.currentUser = null;
        this.notifyListeners(null);
      });

      return true;
    } catch (err) {
      console.error("Failed to initialize Firebase Auth:", err);
      return false;
    }
  }

  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    // Always notify the UI immediately, even when the Firebase CDN/SDK failed to load.
    // This keeps the login screen visible instead of leaving the page blank.
    try {
      callback(this.currentUser);
    } catch (e) {
      console.error("Initial auth-state callback error:", e);
    }
  }

  notifyListeners(user) {
    this.authStateListeners.forEach((fn) => {
      try {
        fn(user);
      } catch (e) {
        console.error("Auth listener callback error:", e);
      }
    });
  }

  // 1. User Registration with Name, Email & Password
  async register(name, email, password) {
    if (!this.auth) throw new Error("Firebase Authentication is not initialized.");
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      // Update display name
      if (name && name.trim()) {
        await userCredential.user.updateProfile({
          displayName: name.trim()
        });
      }
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // 2. User Login with Email & Password
  async login(email, password) {
    if (!this.auth) throw new Error("Firebase Authentication is not initialized.");
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      this.currentUser = userCredential.user;
      return userCredential.user;
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // 3. User Logout
  async logout() {
    if (!this.auth) return;
    try {
      await this.auth.signOut();
      this.currentUser = null;
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // 4. Password Reset via Email
  async resetPassword(email) {
    if (!this.auth) throw new Error("Firebase Authentication is not initialized.");
    try {
      await this.auth.sendPasswordResetEmail(email);
    } catch (error) {
      throw new Error(this.mapError(error));
    }
  }

  // Error Code Translator
  mapError(error) {
    const code = error?.code || "";
    switch (code) {
      case "auth/invalid-email":
        return "The email address is invalid. Please check the spelling.";
      case "auth/user-disabled":
        return "This operator account has been disabled. Contact system administrator.";
      case "auth/user-not-found":
        return "No account exists with this email address.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        return "Incorrect email or password. Please verify your credentials.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists. Please sign in instead.";
      case "auth/weak-password":
        return "Password is too weak. Please choose at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication → Sign-in method.";
      case "auth/too-many-requests":
        return "Too many unsuccessful attempts. Access temporarily blocked. Please wait or reset password.";
      case "auth/network-request-failed":
        return "Network connection issue. Please check your internet connection.";
      case "auth/user-token-expired":
      case "auth/id-token-expired":
      case "auth/requires-recent-login":
        return "Your authentication session has expired. Please sign in again.";
      case "auth/api-key-not-valid.":
      case "auth/invalid-api-key":
        return "Firebase API Key is invalid or not yet configured. Click 'Firebase Settings' to enter your Project Web API Key.";
      default:
        return "Unable to authenticate right now. Please check your details and connection, then try again.";
    }
  }
}
