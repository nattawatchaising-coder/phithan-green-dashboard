# PHITHAN GREEN — แผนการย้ายสู่ Production
## Database + Hosting Analysis (ใช้งานฟรี)

---

## 1️⃣ ตัวเลือก Database (ฟรี)

### A. **Firebase Realtime Database** ⭐ (แนะนำสำหรับเริ่มต้น)
**ข้อดี:**
- ฟรี 100 อ่าน / 50 เขียน ต่อวินาที (พอสำหรับทีม 5-10 คน)
- NoSQL JSON — ไม่ต้องสร้าง Schema
- Real-time sync (เหมาะสำหรับ Kanban drag-drop)
- Authentication built-in (ง่ายทำ role-based)
- Offline support (โหลดข้อมูลแม้ internet ขาด)

**ข้อเสีย:**
- ข้อมูลสูงสุด 100 GB (unlimited growth แต่ตอบแบบ "pay-as-you-go")
- Lock-in ที่ Google ecosystem

**Cost:** ฟรี (spark plan) → คนละ ~$0-5/เดือน อาจเพิ่มขึ้นเมื่อ scale
**ตั้งค่า:** 5 นาที — ไปที่ firebase.google.com → Create Project → Enable Realtime DB

---

### B. **Supabase** ⭐⭐ (ดีกว่าถ้าต้อง SQL)
**ข้อดี:**
- Postgres จริง (บน AWS) — สามารถ query ซับซ้อนได้
- ฟรี 500 MB storage + 2GB bandwidth/เดือน (พอสำหรับ 1 ปีแรก)
- Auth + Row-Level Security (RLS) built-in
- REST API อัตโนมัติ (ไม่ต้องเขียน backend)
- SQL — มีประวัติเดิมจาก Google Sheets

**ข้อเสีย:**
- Schema ต้องออกแบบตั้งแต่แรก
- Project suspend หลังจากไม่ใช้ 7 วัน (ต้อง click resume)

**Cost:** ฟรี (0 ฿) → $25/เดือน (up to 2GB storage)
**ตั้งค่า:** 10 นาที — supabase.com → New Project → SQL editor

---

### C. **MongoDB Atlas** ⭐ (เหมาะถ้าข้อมูล unstructured)
**ข้อดี:**
- ฟรี 512 MB storage (shared cluster)
- NoSQL flexible
- Geospatial queries (เหมาะสำหรับแผนที่)
- Full-text search

**ข้อเสีย:**
- Shared cluster (ช้าเมื่อ traffic สูง)
- ต้อง IP whitelist (ยุ่งเล็กน้อย)

**Cost:** ฟรี (512 MB) → $15/เดือน (dedicated cluster)
**ตั้งค่า:** 15 นาที — mongodb.com → Create Cluster (M0 Free)

---

### **คำแนะนำ:** 
**ถ้าเริ่มต้น → Firebase Realtime** (เร็วที่สุด, real-time ดี, ไม่ต้องเขียน backend)
**ถ้าต้อง SQL เดิมจาก Sheets → Supabase** (full Postgres, REST API ฟรี)

---

## 2️⃣ ตัวเลือก Hosting (ฟรี)

### A. **Vercel** ⭐⭐⭐ (แนะนำ #1)
**ข้อดี:**
- ฟรีสำหรับ static + serverless functions
- Auto-deploy จาก GitHub (push = auto-deploy)
- Global CDN (เร็ว)
- SSL/HTTPS built-in
- Environment variables

**ข้อเสีย:**
- Functions มีเวลาจำกัด (ตาม plan)
- Database (Postgres/MySQL) ไม่ include

**Cost:** ฟรี (Hobby) → $20/เดือน (Pro)
**ตั้งค่า:** 5 นาที — vercel.com → Import from GitHub

---

### B. **Netlify** ⭐⭐ (เทียบเท่า Vercel)
**ข้อดี:**
- ฟรี static hosting + functions
- Auto-deploy จาก GitHub
- Forms processing built-in
- Better CMS integration

**ข้อเสีย:**
- Function execution time: 10 sec (Vercel: 60 sec)

**Cost:** ฟรี → $19/เดือน
**ตั้งค่า:** 5 นาที — netlify.com → Connect GitHub

---

### C. **Railway** ⭐⭐ (เหมาะถ้า ต้อง Backend)
**ข้อดี:**
- ฟรี $5/เดือน (ใช้หมดก็ stop ไม่ charge ต่อ)
- Docker support
- Database (Postgres/MySQL/MongoDB) ฟรี
- Unlimited deployments

**ข้อเสีย:**
- ต้อง code backend เอง (หรือ use API tier)
- Server ช่วงแรกช้า (cold start)

**Cost:** ฟรี ($5/เดือน credit) → $5+/เดือน
**ตั้งค่า:** 10 นาที — railway.app → Connect GitHub

---

### **คำแนะนำ:**
**ง่ายที่สุด → Vercel + Firebase** (เลย deploy ได้ทั้งทีม โดยไม่ต้องเขียน backend)
**ต้องความสามารถมากกว่า → Railway + Supabase** (ถ้าต้อง custom backend)

---

## 3️⃣ Architecture แนะนำ

### **Option 1: Vercel + Firebase** (⭐ เร็วที่สุด)
```
Frontend (React/Vite)
  ↓ (deploy via Vercel)
  ├─ Vercel (free hosting)
  └─ Firebase Realtime DB (free $0)
```
**ข้อดี:** ไม่ต้องเขียน Backend, Real-time sync ดี
**เวลาติดตั้ง:** 1-2 ชั่วโมง

---

### **Option 2: Vercel + Supabase** (⭐⭐ สมดุล)
```
Frontend (React/Vite)
  ↓ (deploy via Vercel)
  ├─ Vercel (free hosting)
  └─ Supabase (Postgres) → REST API
```
**ข้อดี:** SQL จริง, สามารถ query complex ได้
**เวลาติดตั้ง:** 2-3 ชั่วโมง

---

### **Option 3: Railway + Supabase** (⭐⭐⭐ Full Control)
```
Frontend (React/Vite)
  ↓ (deploy via Railway)
  ├─ Railway Server (Node.js/Python backend)
  │   └─ Route API to Supabase
  └─ Supabase (Postgres)
```
**ข้อดี:** ควบคุมได้เต็มที่, scalable
**เวลาติดตั้ง:** 3-4 ชั่วโมง

---

## 4️⃣ Migration Path (localStorage → Cloud)

### **Step 1:** เลือก Database + Hosting (ข้างบน)

### **Step 2:** สร้าง Cloud Database
- **Firebase:** Create Realtime DB → Setup Rules
- **Supabase:** Create tables (jobs, techs, brands, stock, moves)

### **Step 3:** เขียน API integration
ในไฟล์ `dashboard/store.jsx`:
```javascript
// แทน localStorage
// const store = JSON.parse(localStorage.getItem('key'))

// ใช้ API แทน
const store = await fetch('/api/jobs').then(r => r.json())
```

### **Step 4:** Deploy
```bash
# Vercel: push ขึ้น GitHub
git add .
git commit -m "Add cloud backend"
git push origin main

# Vercel auto-deploy จากการ push
```

### **Step 5:** ทดสอบ
- เพิ่มงานจาก browser 1
- รีเฟรช browser 2 → เห็นงานใหม่

---

## 5️⃣ ตารางเปรียบเทียบ Cost ชั้นแรก

| Database | Hosting | ราคา/เดือน | Capacity | Sync | ความง่าย |
|----------|---------|---------|----------|------|--------|
| **Firebase** | **Vercel** | **ฟรี-$5** | 100GB | Real-time ✅ | ⭐⭐⭐ |
| **Supabase** | **Vercel** | **ฟรี-$5** | 500MB | REST API | ⭐⭐ |
| **MongoDB** | **Vercel** | **ฟรี-$5** | 512MB | REST API | ⭐⭐ |
| Custom SQL | **Railway** | **ฟรี-$10** | 256MB | Custom | ⭐⭐⭐ |

---

## 6️⃣ Data Model สำหรับ Firebase / Supabase

### **Firebase JSON structure:**
```json
{
  "jobs": {
    "SF-2401": {
      "name": "คุณวิชัย เจริญพร",
      "phone": "086-111-2233",
      "stage": "install",
      "mat": { "panel": "ready", "inverter": "ready" },
      ...
    }
  },
  "techs": {
    "t1": { "name": "สมชาย ตั้งใจ", "color": "#10B981" }
  },
  "stock": {
    "SKU001": { "name": "แผง Longi 550W", "qty": 45 }
  },
  "moves": [
    { "id": 1, "sku": "SKU001", "type": "in", "qty": 50, "date": "2026-06-08" }
  ]
}
```

### **Supabase SQL tables:**
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  stage TEXT,
  mat JSONB,
  created_at TIMESTAMP
);

CREATE TABLE techs (
  id TEXT PRIMARY KEY,
  name TEXT,
  color TEXT
);

CREATE TABLE stock (
  sku TEXT PRIMARY KEY,
  name TEXT,
  qty INTEGER
);

CREATE TABLE stock_moves (
  id SERIAL PRIMARY KEY,
  sku TEXT,
  type TEXT,
  qty INTEGER,
  date TIMESTAMP
);
```

---

## 7️⃣ Timeline สำหรับ Production

| ขั้นตอน | เวลา | Effort |
|--------|------|--------|
| 1. เลือก Database + Hosting | 30 นาที | ⭐ |
| 2. สร้าง Cloud DB schema | 30 นาที | ⭐ |
| 3. เขียน API integration | 2-3 ชั่วโมง | ⭐⭐ |
| 4. Migrate data จาก seed | 1 ชั่วโมง | ⭐ |
| 5. Deploy + ทดสอบ | 1 ชั่วโมง | ⭐ |
| **รวม** | **5-6 ชั่วโมง** | - |

---

## 🎯 สรุปคำแนะนำ

**เริ่มต้นง่าย + ฟรี:**
```
✅ Vercel (hosting)
✅ Firebase Realtime (database)
✅ GitHub (source control)
```

**การตั้งค่า:**
1. Push code ขึ้น GitHub
2. เปิด firebase.google.com → สร้าง Realtime DB
3. เปิด vercel.com → Import จาก GitHub → auto-deploy
4. ให้ผมช่วยเขียน API integration ต่อ

**ราคา:** ฟรี (ตลอด 6 เดือนแรก) → ~$5/เดือนถ้า traffic เพิ่ม

---

**อยากให้ผมลงมือเริ่มไหม?** บอกเลย ผมจะ:
1. Refactor code เป็น Vite + React (แทน Babel CDN)
2. เขียน API layer สำหรับ Firebase/Supabase
3. เตรียม deployment guide (step-by-step)
