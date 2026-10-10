# สำรองข้อมูล Firebase (backup)

ตั้งเมื่อ 2026-10-10 · เหตุ: Firebase แผนฟรีไม่มี backup อัตโนมัติ · เคยมีข้อมูลหาย (% คืบหน้าใบงาน SF-2448)

## ข้อตกลง (ผู้ใช้ตกลงแล้ว)
- เก็บใน **GitHub repo private แยก** — **ห้ามเก็บใน repo นี้** (public และข้อมูลมีข้อมูลลูกค้า) · ห้ามวางไฟล์กู้คืนใน repo นี้
- สำรองทั้งข้อมูลงาน**และ**ไฟล์/รูป แต่ไฟล์/รูปอัปเฉพาะชิ้นใหม่
- ค่าลับอยู่ใน Vercel env เท่านั้น ผู้ใช้ตั้งเอง: `BACKUP_GH_TOKEN` (fine-grained เฉพาะ repo สำรอง · Contents: Read and write) · `BACKUP_GH_REPO` = `owner/name`
- ระบบสำรอง**ไม่เขียน Firebase เลย** · กู้คืน = สคริปต์สร้างไฟล์ JSON แล้ว**ผู้ใช้นำเข้าเองใน Console**
- ห้ามใช้ vercel CLI สั่งรัน — สั่งรันเองได้ด้วย curl (ข้างล่าง)

## ไฟล์
| ไฟล์ | หน้าที่ |
|---|---|
| `api/cron/backup.mjs` | cron วันละครั้ง 20:00 UTC = **ตี 3 ไทย** (Hobby ยิงภายในชั่วโมงนั้น) · `maxDuration: 60` ใน `vercel.json` |
| `api/_lib/backup.mjs` | โครงไฟล์ · รายชื่อกลุ่มไฟล์ `FILES1`/`FILES2` · `plan()` · ใช้ร่วม cron กับ seed — **ไบต์ต้องคงที่** ไม่งั้น cron อัปซ้ำทุกวัน |
| `api/_lib/line.mjs` `rtdbText` | อ่าน REST เป็นข้อความดิบ (แนบสิทธิ์ service account) |
| `tools/backup-seed.mjs` | สำรองเต็มก้อนลงโฟลเดอร์ clone ในเครื่อง (ใช้ครั้งแรก) |
| `tools/backup-restore.mjs` | ประกอบไฟล์สำรองกลับเป็น JSON สำหรับ Import |

## โครง repo สำรอง
- `data/<กลุ่ม>.json` — ข้อมูลงานทั้งกลุ่ม (ทุกกลุ่มที่ไม่อยู่ใน FILES1/FILES2 รวมกลุ่มใหม่ที่เพิ่มทีหลัง) ดึงเต็มทุกวัน ~12 MB
- `files/<กลุ่ม>/<คีย์>.json` (FILES1: `stockDoc` `stockImg` `quotePicData`) และ `files/<กลุ่ม>/<งาน>/<คีย์>.json` (FILES2: `jobFiles` `*Photos` `permitDocs`) — ข้อความดิบจาก REST
- `_backup.json` — สรุปรอบล่าสุด เขียนทุกวัน (ดูใน GitHub ว่า cron ยังทำงาน) · ข้อความ commit: `สำรอง <วันที่> · แก้ n · ลบ n · ค้าง n · พลาด n`
- ชื่อคีย์ encode ด้วย `enc()` (encodeURIComponent + `!'()*~`)

## ทำไมออกแบบแบบนี้
- ฐานข้อมูล ~355 MB (2026-10-08) เป็นไฟล์/รูป base64 ~340 MB (`stockDoc` 194 · `jobFiles` 75) · Firebase แผนฟรีดาวน์โหลดได้ **10 GB/เดือน** — ดึงทั้งก้อนทุกวัน = เกินโควตา เว็บจริงจะโหลดไม่ได้
  → ไฟล์/รูปดูแค่รายชื่อ (shallow) ทุกวัน ดาวน์โหลดเฉพาะชิ้นใหม่ + ตรวจซ้ำชิ้นเดิมวันละ 1/30 (ตาม hash ของ path) ครบทุกชิ้นใน 30 วัน
- กฎขั้น 0 (`docs/security.md`) ห้ามอ่านราก → อ่านทีละกลุ่ม · cron ใช้ service account จึงอ่านรายชื่อที่รากได้ · seed ในเครื่องไม่มี → ใช้ชื่อกลุ่มจาก `data/` ที่ cron สำรองไว้
- อ่านรายชื่อหรือข้อมูลงานพลาดแม้จุดเดียว = **ยกเลิกทั้งรอบไม่ commit** (กันพลาดแล้วถูกตีความว่าข้อมูลถูกลบ) · ชิ้นไฟล์ที่ดาวน์โหลดพลาด = นับ "พลาด" ข้ามไป
- ชิ้นที่หายจาก Firebase → ลบจาก commit ล่าสุด แต่**ยังอยู่ในประวัติ git**
- เพดาน: อัปไม่เกิน ~60 ไฟล์/รอบ (GitHub จำกัดการสร้างเนื้อหา ~80/นาที 500/ชม.) · ทำงาน ≤45 วินาที · ที่เหลือ = "ค้าง" รอบหน้าทำต่อ · ทดสอบจริง 1 รอบ ~4 วินาที (ไฟล์ทั้งหมด ~780 ชิ้น)

## ตั้งค่า (ผู้ใช้ทำเอง)
1. GitHub → New repository → **Private** → ติ๊ก **Add a README** (repo ว่าง Git Data API ใช้ไม่ได้)
2. GitHub → Settings → Developer settings → Fine-grained tokens → Only select repositories: repo สำรอง → Repository permissions → Contents: Read and write
3. Vercel → Settings → Environment Variables (Production): `BACKUP_GH_TOKEN` · `BACKUP_GH_REPO` → deploy ใหม่ (push master อะไรก็ได้ หรือ Redeploy ในหน้า Vercel)
4. สั่งรันรอบแรกทันที (PowerShell — ค่า CRON_SECRET ดูใน Vercel env):
   `curl.exe -H "Authorization: Bearer <CRON_SECRET>" https://flashsolar.vercel.app/api/cron/backup`
   ได้ `{"ok":true,...}` → ใน repo สำรองมี `data/` ครบ
5. รอบแรกของไฟล์/รูป (~780 ชิ้น) ถ้ารอ cron จะใช้ ~13 คืน → ใช้ seed ในเครื่องแทน:
   ```
   git clone https://github.com/<owner>/<repo สำรอง>.git D:\flashsolar-backup
   node tools/backup-seed.mjs D:\flashsolar-backup
   cd D:\flashsolar-backup ; git add -A ; git commit -m "สำรองครั้งแรก" ; git push
   ```
   (seed เขียน `.gitattributes` = `* -text` ให้ git เก็บไบต์ตามจริง และ `.gitignore` = `_restore/`)

## กู้คืน
1. `git pull` ในโฟลเดอร์สำรอง · ต้องการของวันก่อน: `git log --oneline` → `git checkout <commit>` (เสร็จแล้ว `git checkout main`)
   หาว่าค่าเปลี่ยนวันไหน: `git log -p data/jobs.json`
2. `node tools/backup-restore.mjs D:\flashsolar-backup jobs/SF-2448` (จุดเดียว) · `... jobFiles` (ทั้งกลุ่ม) · ไม่ใส่ path = ทุกกลุ่มแยกไฟล์
   → ได้ไฟล์ใน `D:\flashsolar-backup\_restore\` พร้อมบอก path ที่ต้องนำเข้า
3. Firebase Console → Realtime Database → คลิกไปที่ path นั้น → ⋮ → **Import JSON** — **ทับทั้ง path นั้น** เลือกให้ลึกที่สุดเท่าที่จำเป็น
4. ลบ `_restore/` หลังนำเข้า (มีข้อมูลลูกค้า)

ทดสอบแล้ว 2026-10-10 (GitHub จำลอง + อ่าน Firebase จริง): กู้ `jobs/SF-2448` และ `billPhotos/SF-2450` ตรงกับข้อมูลจริงทุกไบต์ · รอบซ้ำไม่อัปข้อมูลงานซ้ำ · อ่านรายชื่อไม่ได้ = ไม่ commit

## สถานะ (2026-10-10)
- repo สำรอง: **`nattawatchaising-coder/flashsolar-backup`** (private) · token ตั้ง No expiration (สิทธิ์ Contents เฉพาะ repo นี้) — หลุด = Revoke แล้วสร้างใหม่
- env ตั้งใน Vercel แล้ว · cron รันจริงผ่าน 2 รอบ · seed รอบแรกเสร็จ: data 47 กลุ่ม + files 779 ชิ้น (341 MB) · ไฟล์ที่ cron เขียนตรงไบต์กับ seed (เปลี่ยน 0 ไฟล์)
- กู้ `jobFiles/SF-2419` (8 MB) จาก repo จริง ตรงกับข้อมูลจริง
- clone ไว้ที่เครื่อง 2: `D:\flashsolar-backup` (ตั้ง `core.autocrlf false` และ user.name/email ใน repo นั้นแล้ว — เครื่องอื่นที่ clone ต้องตั้งเอง)

## สั่งรันเอง
Vercel → Settings → **Cron Jobs** → แถว `/api/cron/backup` → **Run** (Vercel แนบ CRON_SECRET ให้เอง) · ⚠ ห้ามกด Run ของ `daily`/`clockout` — ส่ง LINE ถึงพนักงานจริง
ผลดูที่ Logs (`requestPath:/api/cron/backup`) หรือ commit ล่าสุดใน repo สำรอง · env ใหม่มีผลหลัง deploy **Production** (push master) — Redeploy ตัว Preview ไม่ช่วย

## สำรองมือ (ไม่ต้องพึ่งระบบนี้)
Firebase Console → Realtime Database → ⋮ → Export JSON (~355 MB) — เก็บที่ส่วนตัว ห้ามใส่ repo นี้

## ยังไม่ได้ทำ / ต่อยอด
- ไม่มีแจ้งเตือนเมื่อสำรองพลาด — ดูได้จาก Vercel → Logs หรือวันที่ใน `_backup.json` · อาจเพิ่มเช็กใน `daily.mjs` ว่ารอบล่าสุดเก่าเกิน 2 วันให้แจ้งแอดมิน
- repo สำรองโตตามรูปใหม่ + รูปที่ถูกแทนที่ · GitHub แนะนำ < 1–5 GB · ถ้าใหญ่เกินค่อยตัดประวัติไฟล์เก่า
