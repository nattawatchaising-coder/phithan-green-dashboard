/* ================================================================
   PHITHAN GREEN — Firebase Configuration
   Project: phithan-green-5907 (ฐานข้อมูลจริง)

   ฐานข้อมูลทดสอบ: บน localhost/127.0.0.1 ถ้ามี firebase-config.local.js
   (ไม่ขึ้น git — ดู docs/test-db.md) เซิร์ฟเวอร์ทดสอบ tools/devserver.js
   จะแปะ window.FIREBASE_TEST_CONFIG ไว้หน้าไฟล์นี้ → ใช้ฐานทดสอบแทนของจริง
   เว็บจริง (Vercel) ไม่มีไฟล์นั้น และเช็ก host ซ้ำ → ใช้ของจริงเสมอ
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
  const host = location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  const t = window.FIREBASE_TEST_CONFIG;
  // ใช้ฐานทดสอบเฉพาะเมื่ออยู่ในเครื่อง + config ครบ + ไม่ใช่ฐานเดียวกับของจริง
  const useTest = isLocal && !!t && !!t.databaseURL &&
    t.databaseURL !== FIREBASE_CONFIG.databaseURL && t.projectId !== FIREBASE_CONFIG.projectId;
  const cfg = useTest ? t : FIREBASE_CONFIG;
  window.FB_DB_MODE = useTest ? "test" : "real";

  try {
    firebase.initializeApp(cfg);
    window.FBDB = firebase.database();
    console.info("[PHITHAN GREEN] ✅ Firebase connected:", cfg.projectId, useTest ? "(ฐานข้อมูลทดสอบ)" : "");
  } catch (e) {
    console.error("[PHITHAN GREEN] ❌ Firebase error:", e.message);
    window.FBDB = null;
  }

  // ป้ายบอกฐานข้อมูลบนหน้าเว็บ — แสดงเฉพาะในเครื่อง (เว็บจริงไม่มีป้าย)
  if (!isLocal) return;
  const label = useTest
    ? "ฐานข้อมูลทดสอบ"
    : "⚠ ฐานข้อมูลจริง — บันทึกแล้วแก้ข้อมูลจริง";
  if (useTest) document.title = "[ทดสอบ] " + document.title;
  const show = () => {
    const el = document.createElement("div");
    el.id = "fb-db-badge";
    el.textContent = label;
    el.title = useTest
      ? "localhost ต่อฐานข้อมูลทดสอบ (firebase-config.local.js) — เว็บจริงไม่กระทบ"
      : "ยังไม่มี firebase-config.local.js — ดู docs/test-db.md";
    el.style.cssText = [
      "position:fixed", "left:50%", "bottom:10px", "transform:translateX(-50%)",
      "z-index:2147483647", "pointer-events:none", "padding:5px 14px", "border-radius:999px",
      "font:600 12px/1.4 system-ui,sans-serif", "color:#fff", "white-space:nowrap",
      "box-shadow:0 2px 8px rgba(0,0,0,.25)", "opacity:.92",
      "background:" + (useTest ? "#C77700" : "#C62828"),
    ].join(";");
    document.body.appendChild(el);
  };
  if (document.body) show();
  else document.addEventListener("DOMContentLoaded", show);
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
