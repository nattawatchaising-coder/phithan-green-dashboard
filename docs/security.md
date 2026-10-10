# ความปลอดภัยฐานข้อมูล (Firebase Realtime Database Rules)

ตรวจเมื่อ 2026-10-08 · กฎจริงไม่ได้อยู่ใน repo (ไม่มี `database.rules.json`) — ดูใน Console: Build → Realtime Database → แท็บ Rules

**กฎจริงที่ใช้อยู่ (ผู้ใช้ copy มาให้ 2026-10-10): `{"rules":{".read":true,".write":true}}`** — เปิดทั้งก้อน ไม่มีวันหมดอายุ (ไม่ใช่ test mode) ตรงกับที่โค้ดคาดไว้ ช่องโหว่ทุกข้อข้างล่างจึงเกิดได้จริง

กติกา: **Claude ห้ามแก้กฎเอง** ผู้ใช้เป็นคนวางใน Console · ห้ามทดลองยิงฐานข้อมูลจริงเพื่อพิสูจน์ช่องโหว่ · ห้ามใส่ค่าลับ (service account, token) ลงไฟล์ใด ๆ ใน repo (repo เป็น public)

## สภาพปัจจุบัน (จากโค้ด)

- เว็บโหลดแค่ `firebase-app-compat` + `firebase-database-compat` — **ไม่มี Firebase Auth เลย** ทุกคำขอที่ถึงฐานข้อมูลเป็น "ผู้ไม่ระบุตัวตน"
  ฐานข้อมูลจึงแยกไม่ออกว่าใครเป็นพนักงาน ใครเป็นคนนอก → กฎใดที่ปล่อยให้เว็บทำงานได้ ก็ปล่อยให้คนนอกทำได้เท่ากัน
- ล็อกอิน (`dashboard/auth.jsx` `useAuthStore`) = โหลด `users/` **ทั้งก้อนรวม PIN แบบตัวอักษรตรง ๆ** มาเทียบในเบราว์เซอร์ แล้วจด `userId` ไว้ใน localStorage (`solarflow_session_v1`)
- ฝั่งเซิร์ฟเวอร์ (`api/_lib/line.mjs`) ยิง REST **ไม่แนบสิทธิ์อะไรเลย** — ทำงานได้เพราะกฎเปิดทั้งก้อน
- `firebase-config.js` เปิดเผยได้ตามปกติของ Firebase (apiKey ไม่ใช่ความลับ) — **ปัญหาอยู่ที่กฎ ไม่ใช่ที่ config**

## ช่องโหว่ เรียงจากหนักสุด

1. **ใครก็อ่านทั้งฐานข้อมูลได้** ด้วย URL ฐานข้อมูลใน `firebase-config.js` (เปิด `<db-url>/.json` ในเบราว์เซอร์ก็ได้) — ชื่อ/เบอร์/ที่อยู่ลูกค้า ใบเสนอราคา ต้นทุน เวลาเข้างาน+พิกัด ใบลา ใบเบิกเงิน ลายเซ็น รูปหน้างาน
2. **ใครก็อ่าน PIN ของทุกบัญชีได้** (`users/*/pin`) รวมแอดมิน → เข้าเว็บเป็นแอดมินได้ · อีกทางคือตั้ง localStorage `solarflow_session_v1` เป็น id ของใครก็ได้ (`u-admin` เดาได้) ก็เข้าเป็นคนนั้นโดยไม่ต้องรู้ PIN
3. **ใครก็เขียน/ลบได้ทุกที่** — ลบทั้งฐานด้วยคำขอเดียว · แก้ราคา/คลัง/สถานะงาน · แก้ `rolePerms` ให้สิทธิ์ตัวเอง
   - ลบ `users/` ทิ้ง → คนถัดไปที่เปิดเว็บจะสร้างบัญชี `admin` PIN `1234` ขึ้นมาใหม่เอง (`ADMIN_SEED` ใน auth.jsx)
4. **สวมรอยใน LINE ได้** — เขียน `lineLinks/{LINE id ของตัวเอง}` = `{userId: "u-admin"}` เองได้ → `/api/line/session` จะเชื่อและให้แอป LIFF เข้าเป็นแอดมิน · ล้าง `lineBindFails/` เพื่อเดา PIN ต่อได้ไม่จำกัด
5. **ส่งข้อความ LINE ในนามบริษัทได้** — เขียน `notifications/N-xxx` ข้อความอะไรก็ได้ แล้วเรียก `/api/line/push` → OA ของบริษัทส่งถึงพนักงาน (หลอกลวง/ฟิชชิง) และกินโควตา push
6. `test-data.html` ถูกกันไม่ให้ขึ้นเว็บแล้ว (`.vercelignore`) แต่**ไม่ได้ช่วยอะไร** เพราะสิ่งที่ไฟล์นั้นทำ (เขียน/ลบงาน) คนนอกทำตรงกับฐานข้อมูลได้อยู่แล้ว

ข้อ 4–5 ไม่ได้เป็นบั๊กของ endpoint เอง (ตรวจ LINE idToken / ลายเซ็น webhook / CRON_SECRET ถูกต้อง) แต่ endpoint เชื่อข้อมูลในฐาน ซึ่งใครก็เขียนได้

## ทำไมแก้แค่กฎไม่ได้

ถ้าวาง `".read": "auth != null"` วันนี้ — **เว็บ แอป LINE และ cron พังทั้งหมดทันที** (ไม่มีใครล็อกอิน Firebase Auth สักคน รวมถึงเซิร์ฟเวอร์)
ต้องเพิ่มการล็อกอินจริงก่อน แล้วค่อยรัดกฎ ตามลำดับข้างล่าง **ห้ามสลับลำดับ**

## แผนแก้

### ขั้น 0 — ทำได้ทันที ไม่ต้องแก้โค้ด (ได้ผลน้อย แต่ไม่เสี่ยง)

```json
{
  "rules": {
    "$top": { ".read": true, ".write": true }
  }
}
```
- ต่างจาก true/true ที่ราก: กันการ**ดูดทั้งฐานในคำขอเดียว** (`/.json`) และ**ลบทั้งฐานในคำขอเดียว** — ยังอ่าน/ลบทีละกลุ่มได้อยู่ (ชื่อกลุ่มหาได้จากโค้ดที่เปิดสาธารณะ)
- ไม่พัง: ไม่มีโค้ดไหนอ่านราก · การ `update()` หลาย path ที่ราก (`api/line/bind.mjs`, `_tmRoot()`/`EC_ROOT` ในเว็บ) ฐานข้อมูลตรวจสิทธิ์ทีละ path จึงยังผ่าน
- ทำคู่กัน: เปลี่ยน PIN แอดมินถ้ายังเป็นค่าตั้งต้น และเก็บกฎเดิมไว้ก่อนแก้ทุกครั้ง (Console มีประวัติกฎให้ย้อนได้ด้วย)

### ขั้น 1 — เพิ่ม Firebase Auth แบบ custom token (ตัวแก้จริง)

โค้ดที่ต้องทำ (ยังไม่ได้ทำ):
1. Service account ของ Firebase → เก็บใน **Vercel Environment Variables เท่านั้น**
2. `api/auth/login` รับ `{username, pin}` → เซิร์ฟเวอร์เทียบ PIN (ใช้กฎเดียวกับ `sfMatchCred`) → ออก **Firebase custom token** (`uid` = id ผู้ใช้, claim `roles`) — เซ็น RS256 ด้วย `node:crypto` ได้ ไม่ต้องลงแพ็กเกจ (`api/_lib` ห้ามมี dependency)
3. `/api/line/session` ที่ผูกแล้ว → ตอบ custom token ด้วย (LIFF เข้าได้โดยไม่ต้องกรอก PIN เหมือนเดิม)
4. เว็บ/LIFF โหลด `firebase-auth-compat` แล้ว `signInWithCustomToken` · เลิกโหลด `users/` ก่อนล็อกอิน
5. ย้าย PIN ออกจาก `users/` ไป `userSecrets/{id}` (เก็บแบบ hash เช่น scrypt) — เซิร์ฟเวอร์อ่านได้คนเดียว
6. `api/_lib/line.mjs` ยิง REST ด้วย access token ของ service account (ข้ามกฎได้) — **ต้อง deploy ก่อนรัดกฎ** ไม่งั้น cron/push/ผูก LINE ตอบ 401
7. ยกเลิก `ADMIN_SEED` ที่สร้างแอดมิน 1234 เองเมื่อ `users/` ว่าง

ลำดับปล่อย: deploy โค้ดตอนกฎยังเปิด → ให้ทุกคนล็อกอินใหม่ → ดูใน Console → Authentication ว่ามีผู้ใช้ครบ → ทดสอบ cron/LINE → **แล้วค่อย**วางกฎข้างล่าง

```json
{
  "rules": {
    "$top": { ".read": "auth != null", ".write": "auth != null" },
    "userSecrets": { ".read": false, ".write": false },
    "_sandbox":    { ".read": "auth != null", ".write": "auth != null" }
  }
}
```
- ใช้ `$top` แทนการไล่ชื่อทุกกลุ่ม เพราะมี ~70 กลุ่มชั้นบนสุด บางชื่อประกอบจากตัวแปร (`*_ROOT + p`) — ไล่ชื่อตกไปตัวเดียว = ฟีเจอร์นั้นพังเงียบ
- ชื่อที่ระบุตรง ๆ (`userSecrets`) ชนะ `$top` · **ห้ามให้สิทธิ์ที่ราก** เพราะสิทธิ์ที่ให้ชั้นบนแล้ว ชั้นล่างถอนคืนไม่ได้
- ผล: คนนอกเข้าไม่ได้เลย · แต่พนักงานที่ล็อกอินแล้วยังแก้ได้ทุกอย่าง (เท่ากับวันนี้ภายในบริษัท)

### ขั้น 2 — สิทธิ์ตามตำแหน่งในกฎ (ทำทีหลัง ต้องแก้โค้ดเพิ่ม)

ตัวอย่างจุดที่ควรรัดก่อน: `users/*/roles|role|active` · `rolePerms` · `config` เขียนได้เฉพาะ `auth.token.roles` มีแอดมิน · `lineLinks` `lineBindFails` `lnPushLog` `cronRun` ให้เซิร์ฟเวอร์เขียนคนเดียว (`.write: false`) · ใบลา/OT/เวลาเข้างานของคนอื่นอ่านได้เฉพาะ HR/ผู้อนุมัติ
ข้อจำกัด: โค้ดหลายจุด `set()` ทั้งก้อน (เช่น `users/{id}`) — กฎแยกสิทธิ์รายฟิลด์ต้องเปลี่ยนเป็น `update()` รายฟิลด์ก่อน · สิทธิ์ใน `rolePerms` แอดมินปรับได้เอง แต่ claim ใน token เป็นแค่ตำแหน่ง กฎจึงทำได้หยาบกว่าในแอป

### ของเสริม (ไม่ใช่ตัวแก้)
- **App Check** (reCAPTCHA) ลดสคริปต์ยิงอัตโนมัติ แต่คนที่เปิดเว็บด้วยเบราว์เซอร์ยังผ่าน — ใช้คู่กับขั้น 1 ไม่ใช่แทน

## path ที่ใช้จริง (ใช้เช็กตอนรัดกฎขั้น 2)

| ผู้ใช้ | path |
|---|---|
| เซิร์ฟเวอร์ LINE (`api/line/*`) | อ่าน `users` `rolePerms` `notifications` `config/linePush` `lineLinks` `lineBindFails` `jobs`(ชื่องาน) · เขียน `lineLinks` `lineBindFails` `lnPushLog` `users/*/lineUserId|lineAt` |
| cron (`api/cron/*`) | อ่าน `users` `tmOt` `tmLeave` `attendDay` `config/linePush` `cronRun` · เขียน `cronRun` `lnPushLog` |
| เว็บ + LIFF | ทุกกลุ่มที่เหลือ: งาน/สำรวจ/แบบ (`jobs` `surveyLeads` `surveyAppointments` `surveyPhotos` `surveyPlans` `plan3d` `plan3dVers` `boqVers` `eroom` `quotes` `quotePics` `quotePicData` `jobFiles` `jobFileFlags` `jobPhotos` `jobComments` `permitDocs` `permitPhotos` `inspections` `inspectionPhotos` `roofHandover` `roofPhotos` `handover*`) · คลัง (`stock` `stockCats` `stockDoc` `stockImg` `moves` `brands` `boqPrices` `boqRules` `cableAmpacity` `conduitDefaults`) · บุคคล (`users` `userAvatars` `userSigns` `rolePerms` `techs` `attend` `attendDay` `attendVoid` `tmOt` `tmLeave` `leaveQuota`) · เงิน/รายงาน (`ec*` `daily*` `billPhotos`) · O&M (`om*`) · อื่น ๆ (`notifications` `annStickers` `config/*` `meta` `lnPushFail` `_sandbox`) |

รายการนี้หาด้วย grep ณ วันที่ตรวจ — ก่อนรัดกฎขั้น 2 ให้ grep ซ้ำ (`ref(`, `_ROOT + "`, `rtdb*(`)
