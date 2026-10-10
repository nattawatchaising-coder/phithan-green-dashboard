# ฐานข้อมูลทดสอบ (localhost)

## ทำงานอย่างไร
- `firebase-config.js` มี config ของจริง (`phithan-green-5907`) — เว็บจริง (Vercel) ใช้อันนี้เสมอ
- `tools/devserver.js` (localhost:8765) ตอนเสิร์ฟ `/firebase-config.js` จะแปะเนื้อหา `firebase-config.local.js` ไว้ข้างหน้า
  ซึ่งตั้ง `window.FIREBASE_TEST_CONFIG` → `firebase-config.js` ใช้ config นั้นแทน (ทั้งฐานข้อมูลและ Firebase Auth)
  - หาไฟล์ที่โฟลเดอร์ของเซิร์ฟเวอร์ก่อน แล้วค่อยโฟลเดอร์หลักของ repo (worktree ของ Claude ใช้ไฟล์เดียวกับโฟลเดอร์หลัก)
  - อ่านใหม่ทุกครั้งที่โหลดหน้า — สร้าง/แก้ไฟล์แล้วรีเฟรชได้เลย (ยกเว้นกุญแจล็อกอิน ดูข้างล่าง)
- กันพลาดหลายชั้น: ใช้ config ทดสอบเฉพาะ host `localhost`/`127.0.0.1` · `databaseURL` และ `projectId` ต้องไม่ตรงของจริง (devserver ก็เช็กซ้ำ ไม่แปะถ้าชี้ของจริง)
- ป้ายกลางล่างจอ (เฉพาะในเครื่อง): **ส้ม** "ฐานข้อมูลทดสอบ" = ปลอดภัย · **แดง** "⚠ ฐานข้อมูลจริง" = ยังไม่มีไฟล์ local บันทึกแล้วแก้ของจริง
  - title แท็บขึ้นต้น `[ทดสอบ]` · ใน console เช็กได้ที่ `window.FB_DB_MODE` (`"test"`/`"real"`) · ตอนเปิด devserver พิมพ์บอกโหมดใน log
- `/api/*` อื่น (LINE, cron) ไม่รันบน devserver และบน Vercel ใช้ `RTDB_URL` ของจริง — ไม่เกี่ยวกับฐานทดสอบ

## ล็อกอินบนฐานทดสอบ (ฐานจริงรัดกฎ `auth != null` แล้ว — docs/security.md)
ใบผ่าน (custom token) ต้องเซ็นด้วยกุญแจของโปรเจกต์เดียวกับฐาน — ใบผ่านจากเว็บจริงใช้กับฐานทดสอบไม่ได้ devserver จึงแยกตามโหมด:
- **ฐานจริง** (ไม่มีไฟล์ local): ส่งต่อ `/api/auth/login` ไปเว็บจริงแบบเดิม
- **ฐานทดสอบ + มี `firebase-sa.local.json`**: รัน `api/auth/login.mjs` ตัวเดียวกับเว็บจริงในเครื่อง ด้วยกุญแจนั้นและ `RTDB_URL` = ฐานทดสอบ → ล็อกอินด้วยชื่อ/PIN ที่อยู่ใน**ฐานทดสอบ** ได้ใบผ่านของโปรเจกต์ทดสอบ · ใช้กฎเดียวกับของจริงได้
  - กุญแจต้องมี `project_id` ตรงกับ `projectId` ทดสอบ · กุญแจโปรเจกต์จริงไม่รับ
  - กุญแจถูกจำตั้งแต่ล็อกอินครั้งแรก — เปลี่ยนกุญแจ/โปรเจกต์ทดสอบแล้ว**รีสตาร์ต devserver**
- **ฐานทดสอบ ไม่มีกุญแจ**: ตอบ `fallback` → เทียบ PIN ในเบราว์เซอร์แบบเก่า ใช้ได้เฉพาะกฎฐานทดสอบเปิด read/write — **ห้ามใส่ข้อมูลจริงในฐานที่เปิดกฎ**
- ไม่ส่งต่อไปเว็บจริงเลยตอนใช้ฐานทดสอบ

**สถานะ 2026-10-10 (เครื่อง 2):** สร้าง `phithan-green-test` (asia-southeast1 · Auth เปิด · กฎเดียวกับของจริง) · วาง config + กุญแจที่โฟลเดอร์หลักของ repo · นำเข้าข้อมูลจริงครบ 61 กลุ่ม · `/api/auth/login` บน localhost ตอบ `configured:true` · ผู้ใช้ล็อกอิน localhost บนฐานทดสอบผ่านแล้ว · เครื่อง 1 ยังไม่ได้วางไฟล์

## ห้ามขึ้น git / เว็บ
`firebase-config.local.js` · `firebase-sa.local.json` · `*-firebase-adminsdk-*.json` · ไฟล์ export (`*-export.json`) อยู่ใน `.gitignore` (และ `.vercelignore`) — **แต่ละเครื่องต้องสร้างเอง** · repo เป็น public: กุญแจ service account และข้อมูลลูกค้าห้าม commit เด็ดขาด

## ตั้งค่าครั้งแรก (ผู้ใช้ทำเอง)
1. https://console.firebase.google.com → **Add project** (หรือ Create a project) → ตั้งชื่อเช่น `phithan-green-test` → ปิด Google Analytics ได้ → Create
2. เมนูซ้าย **Build → Realtime Database → Create Database** → location **Singapore (asia-southeast1)** ให้ตรงของจริง → เริ่มแบบ **locked mode**
3. **Build → Authentication → Get started** (ไม่ต้องเปิด provider ใด)
4. แท็บ **Rules** ของ Realtime Database ทดสอบ: คัดลอกกฎจากโปรเจกต์จริง (`phithan-green-5907` → Realtime Database → Rules) มาวาง → Publish
5. ⚙ **Project settings → General → Your apps → ไอคอน `</>` (Web)** → ตั้งชื่อแอป → Register (ไม่ต้องติ๊ก Hosting)
   → ได้ `const firebaseConfig = { ... }` — ค่านี้เป็น public ไม่ใช่ความลับ
6. คัดลอก `firebase-config.local.example.js` เป็น `firebase-config.local.js` ที่โฟลเดอร์หลักของ repo แล้วแทนค่าใน `{ ... }` ด้วยค่าจากข้อ 5 (ต้องมี `databaseURL`)
7. ⚙ **Project settings → Service accounts → Generate new private key** (**ของโปรเจกต์ทดสอบ** — ดูชื่อโปรเจกต์บนหัวจอ) → ได้ไฟล์ JSON
   → ย้ายไปไว้ที่โฟลเดอร์หลักของ repo แล้วเปลี่ยนชื่อเป็น `firebase-sa.local.json` · **เป็นความลับ** ห้ามส่งในแชต/อัปที่ไหน
8. คัดลอกข้อมูลตั้งต้น:
   - โปรเจกต์จริง → Realtime Database → แท็บ Data → เมนู **⋮** มุมขวา → **Export JSON** (ได้ `phithan-green-5907-default-rtdb-export.json` ~358 MB)
   - ปุ่ม Import JSON ใน Console รับไฟล์ขนาดนี้ไม่ได้ (ขึ้น "Invalid JSON files") → ใช้สคริปต์ส่งเข้าฐานทดสอบด้วยกุญแจทดสอบ (ข้อ 7 ต้องเสร็จก่อน):
     `node --max-old-space-size=4096 tools/testdb-import.mjs <ไฟล์ export.json>`
     - **ล้างฐานทดสอบทั้งก้อน**แล้วส่งทีละกลุ่ม (≤ 8 MB ต่อคำขอ) · ~35 วินาที · ไม่ยอมทำงานถ้า config/กุญแจชี้โปรเจกต์จริงหรือไม่ตรงกัน
     - รีเซ็ตฐานทดสอบ = export ใหม่แล้วรันซ้ำ
   - ลบไฟล์ export ทิ้งหลังนำเข้า (มีข้อมูลลูกค้า)
9. ข้อ 6–7 ทำซ้ำบนเครื่องที่สอง (ไฟล์ไม่ข้ามเครื่องผ่าน git — ย้ายเองด้วย USB/ไดรฟ์ส่วนตัว หรือออกกุญแจใหม่)
10. `node tools/devserver.js` → log ต้องขึ้น "ฐานข้อมูล: ทดสอบ (…) · ล็อกอิน: ออกใบผ่านในเครื่อง" และหน้าเว็บมีป้ายส้ม → ล็อกอินด้วยบัญชีเดียวกับเว็บจริง (ข้อมูลผู้ใช้ถูกคัดมาด้วย)
