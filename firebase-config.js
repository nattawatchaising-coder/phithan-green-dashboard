/* ================================================================
   PHITHAN GREEN — Firebase Configuration

   ⚠️  แก้ค่าด้านล่างด้วยข้อมูลจาก Firebase Console
       ดูคำแนะนำขั้นตอนละเอียดได้ที่ DEPLOY_GUIDE.md
   ================================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

/* ----------------------------------------------------------------
   อย่าแก้โค้ดด้านล่างนี้
   ---------------------------------------------------------------- */
(function () {
  const configured = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";

  if (configured) {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      window.FBDB = firebase.database();
      console.info("[PHITHAN GREEN] ✅ Firebase เชื่อมต่อสำเร็จ:", FIREBASE_CONFIG.projectId);
    } catch (e) {
      console.error("[PHITHAN GREEN] ❌ Firebase เชื่อมต่อไม่ได้:", e.message);
      window.FBDB = null;
    }
  } else {
    window.FBDB = null;
    console.warn(
      "[PHITHAN GREEN] ⚠️  Firebase ยังไม่ได้ตั้งค่า — ใช้งานในโหมด localStorage " +
      "(ข้อมูลจะเห็นได้เฉพาะเครื่องนี้เท่านั้น) แก้ไข firebase-config.js เพื่อเปิดใช้ Cloud"
    );
  }
})();
