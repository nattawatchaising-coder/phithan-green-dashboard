/* ================================================================
   PHITHAN GREEN — Firebase Configuration
   Project: phithan-green-5907
   ================================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDzCjxLfqcrTBiUbtu5fizfYJoLN984qVQ",
  authDomain:        "phithan-green-5907.firebaseapp.com",
  databaseURL:       "https://phithan-green-5907-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "phithan-green-5907",
  storageBucket:     "phithan-green-5907.firebasestorage.app",
  messagingSenderId: "825230149851",
  appId:             "1:825230149851:web:48b46f48a0f9019bb764fe",
};

(function () {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.FBDB = firebase.database();
    console.info("[PHITHAN GREEN] ✅ Firebase connected:", FIREBASE_CONFIG.projectId);
  } catch (e) {
    console.error("[PHITHAN GREEN] ❌ Firebase error:", e.message);
    window.FBDB = null;
  }
})();
