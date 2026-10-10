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

/* ── Firebase Auth (ล็อกอินด้วย custom token จาก /api/auth/login · /api/line/*) ──
   FB_AUTH_READY = รอจนรู้ว่ามีเซสชัน Firebase ค้างอยู่ไหม แล้วค่อย render แอป
   เพราะ listener ของฐานข้อมูลที่ถูกปฏิเสธสิทธิ์ (ตอนกฎเป็น auth != null) จะถูกยกเลิกถาวร
   ไม่ต่อใหม่เองหลังล็อกอิน — จึงต้องมี auth ก่อน mount และ reload หลังล็อกอินสำเร็จ
   หน้าไหนไม่ได้โหลด firebase-auth-compat (เช่น test-data.html) = ข้ามไป ทำงานแบบเดิม */
window.FBAUTH = null;
window.FB_AUTH_READY = new Promise(function (resolve) {
  try {
    if (!window.FBDB || !firebase.auth) return resolve(null);
    window.FBAUTH = firebase.auth();
    var done = false;
    var fin = function (u) { if (!done) { done = true; resolve(u || null); } };
    window.FBAUTH.onAuthStateChanged(fin);
    setTimeout(function () { fin(window.FBAUTH.currentUser); }, 5000);   // เน็ตช้า/IndexedDB ถูกบล็อก — ไม่ค้างหน้าขาว
  } catch (e) { resolve(null); }
});
