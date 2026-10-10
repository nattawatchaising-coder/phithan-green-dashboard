/* ตัวอย่าง config ฐานข้อมูลทดสอบ — ดูขั้นตอนใน docs/test-db.md
   คัดลอกไฟล์นี้เป็น firebase-config.local.js (ไม่ขึ้น git) แล้วใส่ค่าจากโปรเจกต์ Firebase ทดสอบ
   ใช้เฉพาะ localhost ผ่าน tools/devserver.js — เว็บจริงไม่อ่านไฟล์นี้ */
window.FIREBASE_TEST_CONFIG = {
  apiKey:            "ใส่ค่า",
  authDomain:        "ชื่อโปรเจกต์ทดสอบ.firebaseapp.com",
  databaseURL:       "https://ชื่อโปรเจกต์ทดสอบ-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "ชื่อโปรเจกต์ทดสอบ",
  storageBucket:     "ชื่อโปรเจกต์ทดสอบ.firebasestorage.app",
  messagingSenderId: "ใส่ค่า",
  appId:             "ใส่ค่า",
};
