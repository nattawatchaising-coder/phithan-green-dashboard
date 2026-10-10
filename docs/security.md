# ความปลอดภัยฐานข้อมูล (Firebase Realtime Database Rules)

ตรวจเมื่อ 2026-10-08 · กฎจริงไม่ได้อยู่ใน repo (ไม่มี `database.rules.json`) — ดูใน Console: Build → Realtime Database → แท็บ Rules

**กฎจริงที่ใช้อยู่ (ผู้ใช้ copy มาให้ 2026-10-10): `{"rules":{".read":true,".write":true}}`** — เปิดทั้งก้อน ไม่มีวันหมดอายุ (ไม่ใช่ test mode) ตรงกับที่โค้ดคาดไว้ ช่องโหว่ทุกข้อข้างล่างจึงเกิดได้จริง

**2026-10-10 ผู้ใช้วางกฎขั้น 0 (`$top` read/write true) และ Publish แล้ว** — ตอนนี้ดูดหรือลบทั้งฐานในคำขอเดียวไม่ได้ แต่ช่องโหว่ข้อ 1–6 ยังอยู่จนกว่าจะทำขั้น 1 · ถ้าเว็บ/LINE/cron มี permission denied ให้ย้อนกลับเป็น true/true ที่ราก

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

**โค้ดทำแล้ว (2026-10-10)** — ทำงานได้ทั้งก่อนและหลังตั้ง service account:
- `api/_lib/gauth.mjs` — อ่าน env `FIREBASE_SERVICE_ACCOUNT` · `customToken()` เซ็น RS256 ด้วย `node:crypto` · `accessToken()` ให้ REST ข้ามกฎ (ไม่มี dependency)
- `api/_lib/line.mjs` — `rtdb*` แนบ access token เมื่อตั้งค่าแล้ว · `matchCred()` (กฎเดียวกับ `sfMatchCred`) · `tokenForUser()` (บัญชีถูกระงับ = ไม่ออกใบผ่าน)
- `api/auth/login.mjs` — POST `{username,pin}` → `{token,userId}` · พลาด 8 ครั้งล็อก 15 นาที (`authFails/`) · ยังไม่ตั้งค่า = 503 `{fallback:true}` · GET → `{configured}`
- `api/line/session.mjs` / `bind.mjs` — ตอบ `token` เพิ่ม
- `firebase-config.js` — `window.FBAUTH` + `window.FB_AUTH_READY` · `app.jsx` / `liff.html` รอ `FB_AUTH_READY` ก่อน mount (listener ที่ถูกปฏิเสธสิทธิ์ไม่ต่อใหม่เอง → เว็บ `location.reload()` หลังล็อกอิน)
- `auth.jsx` — `sfServerLogin` / `sfSignInToken` · เซสชันใช้ได้เมื่อ `FBAUTH uid === solarflow_session_v1` เท่านั้น (ตั้ง localStorage เองเข้าไม่ได้แล้ว) · เซิร์ฟเวอร์ตอบ fallback = เทียบ PIN ในเบราว์เซอร์แบบเดิมและจด `solarflow_auth_legacy=1` — พอเซิร์ฟเวอร์ตั้งค่าแล้ว เซสชันแบบเก่าถูกบังคับล็อกอินใหม่เอง
- `line.jsx` — LIFF signIn ด้วย token จาก session/bind · หน้าเปิดนอก LINE (`LnWebForm`) ล็อกอินผ่านเซิร์ฟเวอร์

- `tools/devserver.js` — ส่งต่อ `/api/auth/login` (เส้นเดียว) ไป `https://flashsolar.vercel.app` (เปลี่ยนด้วย env `DEV_API`) — localhost จึงได้ใบผ่านและอ่านข้อมูลได้หลังรัดกฎ

**ยังไม่ได้ทำ:** ย้าย PIN ไป `userSecrets/` แบบ hash (PIN ยังอ่านได้โดยพนักงานที่ล็อกอินแล้ว) · ยกเลิก `ADMIN_SEED`

**เปลี่ยนรหัส (PIN):** เซิร์ฟเวอร์อ่าน `users/` ใหม่ทุกครั้งที่ล็อกอิน → รหัสใหม่ใช้ได้ทันที รหัสเก่าใช้ไม่ได้ทันที · แต่**เครื่องที่ล็อกอินค้างอยู่แล้วไม่ถูกเตะออก** (เซสชัน Firebase ต่ออายุเอง) — ถ้าเปลี่ยนเพราะรหัสรั่ว ต้องระงับบัญชี (active=false: แอปซ่อน แต่ฐานข้อมูลยังให้อ่านจนกว่าจะทำขั้น 2) หรือเพิกถอนเซสชันด้วย Admin API (ยังไม่ได้ทำ) · LINE ไม่ใช้ PIN จึงไม่กระทบ · พลาด 8 ครั้งล็อก 15 นาที

**ตั้งค่า (ผู้ใช้ทำเอง ห้ามใส่ค่าลงไฟล์ใด ๆ ใน repo):**
1. Firebase Console → Build → **Authentication → Get started** (ไม่ต้องเปิด provider ใด custom token ใช้ได้เลย)
2. ⚙ Project settings → **Service accounts → Generate new private key** → ได้ไฟล์ JSON
3. Vercel → โปรเจกต์ → Settings → Environment Variables → `FIREBASE_SERVICE_ACCOUNT` = เนื้อไฟล์ JSON ทั้งก้อน (Production) → Save · ลบไฟล์ JSON ในเครื่องทิ้งหลังวาง
4. merge เข้า master (deploy ใหม่จึงอ่าน env) → เช็ก `https://<เว็บ>/api/auth/login` ต้องได้ `{"configured":true}`

**สถานะ 2026-10-10:** ตั้งค่า 1–3 แล้ว · merge เข้า master (`0f8167c`) · `/api/auth/login` ตอบ `configured:true` · ผู้ใช้ล็อกอินเว็บผ่าน ขึ้นใน Authentication → Users (ช่อง Identifier/Providers ว่าง = ผู้ใช้จาก custom token ปกติ) · **ยังไม่ได้รัดกฎ** — รอทุกคนล็อกอินใหม่ + เช็ก cron/LINE

ลำดับปล่อย: ตั้งค่า 1–3 → merge → ทุกคนล็อกอินเว็บใหม่หนึ่งครั้ง (LIFF ไม่ต้อง ได้ token เองตอนเปิด) → Console → Authentication → Users มีครบ → เช็ก cron (แจ้งเตือน 20:30 · 18:00) / ผูก LINE / push → **แล้วค่อย**วางกฎข้างล่าง

```json
{
  "rules": {
    "$top": { ".read": "auth != null", ".write": "auth != null" },
    "userSecrets": { ".read": false, ".write": false },
    "authFails":   { ".read": false, ".write": false }
  }
}
```
- หลังรัดกฎ: หน้า LIFF เปิดนอกแอป LINE จะขึ้น "ปิดอยู่" เสมอ เพราะอ่าน `config/lnWebLogin` ก่อนล็อกอินไม่ได้ · `test-data.html` ใช้ไม่ได้ (ไม่มี auth)
- คนที่ถูกระงับบัญชียังมีเซสชัน Firebase ค้างอยู่ (แอปซ่อนให้ แต่ฐานข้อมูลยังให้อ่าน) — ปิดได้ในขั้น 2 ด้วยกฎเช็ก `users/$uid/active`
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
