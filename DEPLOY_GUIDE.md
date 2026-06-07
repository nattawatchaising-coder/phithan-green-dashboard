# คู่มือ Deploy PHITHAN GREEN Dashboard
## Firebase (Database) + Vercel (Hosting) — ใช้งานฟรี

---

## ขั้นตอนที่ 1 — สร้าง Firebase Project (10 นาที)

### 1.1 เปิดใช้งาน Firebase
1. ไปที่ **https://console.firebase.google.com/**
2. คลิก **"เพิ่มโปรเจกต์"** (Add project)
3. ตั้งชื่อ เช่น `phithan-green`
4. ปิด Google Analytics (ไม่จำเป็น) → คลิก **"สร้างโปรเจกต์"**

### 1.2 เปิดใช้งาน Realtime Database
1. ที่เมนูซ้าย → **Build → Realtime Database**
2. คลิก **"สร้างฐานข้อมูล"**
3. เลือก location: **asia-southeast1** (Singapore)
4. เลือก **"เริ่มในโหมดทดสอบ"** (Test mode) → คลิก **"เปิดใช้งาน"**
   > ⚠️ โหมดทดสอบ: ทุกคนอ่าน/เขียนได้ 30 วัน
   > ดู "ขั้นตอนที่ 4 — ตั้งค่าความปลอดภัย" เพื่อล็อคสิทธิ์ทีหลัง

### 1.3 ดึง Config
1. ที่เมนูซ้าย → ไอคอนเฟือง → **"Project settings"**
2. เลื่อนลง → **"Your apps"** → คลิก **"</ >"** (Web app)
3. ตั้งชื่อ app เช่น `phithan-dashboard` → คลิก **"Register app"**
4. จะเห็น code แบบนี้:
```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "phithan-green.firebaseapp.com",
  databaseURL: "https://phithan-green-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "phithan-green",
  storageBucket: "phithan-green.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```
5. คัดลอกค่าเหล่านี้ทั้งหมด

---

## ขั้นตอนที่ 2 — แก้ไข firebase-config.js

เปิดไฟล์ `firebase-config.js` ในโปรเจกต์ แล้วแทนที่ค่า placeholder:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",          // ← วางค่าจาก Firebase
  authDomain:        "phithan-green.firebaseapp.com",
  databaseURL:       "https://phithan-green-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "phithan-green",
  storageBucket:     "phithan-green.firebasestorage.app",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};
```

บันทึกไฟล์ → เปิด http://localhost:8765/ → console ควรแสดง:
> `[PHITHAN GREEN] ✅ Firebase เชื่อมต่อสำเร็จ: phithan-green`

---

## ขั้นตอนที่ 3 — Deploy ขึ้น Vercel (5 นาที)

### 3.1 Push code ขึ้น GitHub
```powershell
# ที่ terminal ใน folder โปรเจกต์
git init
git add .
git commit -m "Initial: PHITHAN GREEN Dashboard with Firebase"
```

1. ไปที่ **https://github.com/new** → สร้าง repository ชื่อ `phithan-dashboard`
2. ทำตาม command ที่ GitHub แสดง:
```powershell
git remote add origin https://github.com/YOUR_USERNAME/phithan-dashboard.git
git branch -M main
git push -u origin main
```

### 3.2 Connect Vercel
1. ไปที่ **https://vercel.com/** → Login ด้วย GitHub
2. คลิก **"Add New → Project"**
3. เลือก repository `phithan-dashboard`
4. Framework preset: **Other**
5. Build & Output Settings:
   - Build Command: *(ว่างเปล่า)*
   - Output Directory: `.`
6. คลิก **"Deploy"**

### 3.3 ผลลัพธ์
Vercel จะให้ URL แบบ:
> `https://phithan-dashboard.vercel.app`

แชร์ URL นี้ให้ทีมได้เลย ทุกคนเห็นข้อมูลเดียวกัน real-time ✅

---

## ขั้นตอนที่ 4 — ตั้งค่าความปลอดภัย Firebase (สำคัญ!)

หลังทดสอบแล้ว ให้เปลี่ยน Firebase Rules จาก "โหมดทดสอบ" เป็น:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

> สำหรับ prototype ภายในออฟฟิศ (ไม่มี login) ใช้ rules เปิดได้:
> ```json
> { "rules": { ".read": true, ".write": true } }
> ```
> แต่ต้องระวัง — ใครก็ดูข้อมูลได้ถ้ารู้ URL

---

## ขั้นตอนที่ 5 — Environment Variables (optional แต่แนะนำ)

เพื่อไม่ให้ API key โชว์ใน GitHub (public repo):

1. Vercel Dashboard → Settings → Environment Variables
2. เพิ่มตัวแปรแต่ละตัว:
   - `FIREBASE_API_KEY` = `AIzaSy...`
   - `FIREBASE_DATABASE_URL` = `https://...`
   - ฯลฯ
3. ปรับ `firebase-config.js` ให้ใช้ `process.env.*`

> สำหรับ private repo ทำได้ข้ามขั้นตอนนี้

---

## สรุปค่าใช้จ่าย

| บริการ | Free Tier | เมื่อไหร่จะเสีย |
|--------|-----------|---------------|
| Firebase Realtime DB | 1 GB storage, 10 GB/month transfer | เมื่อเกิน 1 GB |
| Vercel Hosting | Unlimited static, 100 GB bandwidth | เมื่อต้องการ custom domain หลายตัว |
| **รวม** | **$0/เดือน** | ปกติไม่เกิน free tier สำหรับทีม 10 คน |

---

## ถ้าต้องการความช่วยเหลือเพิ่ม

- **ระบบ Login**: บอก Claude ว่า "เพิ่มระบบ login" → ผมจะเพิ่ม Firebase Auth
- **Migrate เป็น Vite**: เมื่อพร้อม install Node.js → ผมจะ migrate ทั้ง project
- **เชื่อม Google Sheets**: บอก Claude → ผมจะเขียน sync script

---

*สร้างโดย Claude สำหรับ PHITHAN GREEN — พิธาน กรีน*
