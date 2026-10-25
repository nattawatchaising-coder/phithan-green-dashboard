# Huawei FusionSolar — ไซต์ · อุปกรณ์ · ข้อมูลผลิต

ดึงรายชื่อไซต์ อุปกรณ์ และค่าการผลิตจาก FusionSolar Northbound API มาเก็บใน Firebase แล้วให้หน้าเว็บอ่านจากฐานข้อมูลอย่างเดียว
**FusionSolar เป็นต้นทางของรายชื่อไซต์ · ซิงก์ไม่แก้/ไม่ลบข้อมูลงานในเว็บ (`jobs/` ไม่ถูกแตะสักฟิลด์)**

## ไฟล์
| ไฟล์ | หน้าที่ |
|---|---|
| `api/_lib/fusionsolar.mjs` | ตัวยิง API (login · เว้นระยะ · 305/407) + `runSync` ทั้งหมด |
| `api/cron/fusionsolar.mjs` | cron (CRON_SECRET) · `?job=sites|kpi|all` · `?src=gh` |
| `api/fusionsolar/sync.mjs` | ปุ่ม "ซิงก์ตอนนี้" — ต้องมี Firebase ID token ของแอดมิน (เซิร์ฟเวอร์เช็ก `users/<uid>` เอง) |
| `api/_lib/gauth.mjs` `verifyFirebaseIdToken` | ตรวจ ID token (RS256 · aud/iss = โปรเจกต์ของ service account) |
| `dashboard/fusionsolar.jsx` | หน้า "ไซต์ทั้งหมด" · รายละเอียดไซต์ · เพิ่มไซต์เอง/ผูกรหัส/รวมไซต์ · หน้า log (ตั้งค่า → ซิงก์ FusionSolar) |
| `dashboard/fusionsolar-viz.jsx` | ตัวแปลค่าดิบ (ชื่อ key ไทย · สถานะอินเวอร์เตอร์/แบต) · ตัวตรวจ "ควรดู" · โมเดลการไหลของพลังงาน · กราฟแท่ง/แถบสัดส่วน · การ์ดอุปกรณ์ — โหลดก่อน `fusionsolar.js` |
| `.github/workflows/fusionsolar-kpi.yml` | เคาะ KPI ทุกชั่วโมง (นาทีที่ 7) |
| `tools/fusionsolar-mock.mjs` | Huawei ปลอม port 8790 (`/thirdData`) ไว้ทดสอบ |
| `tools/fusionsolar-run.mjs` | สั่งซิงก์จากเครื่องลง**ฐานทดสอบเท่านั้น** |

## การเชื่อมต่อ (ฝั่งเซิร์ฟเวอร์เท่านั้น — เบราว์เซอร์ไม่เรียก Huawei)
- Base `https://intl.fusionsolar.huawei.com/thirdData` (เปลี่ยนได้ด้วย env `FUSIONSOLAR_BASE` — ใช้ชี้ mock)
- env **`FUSIONSOLAR_USER`** = `api_tarnthanawat` · **`FUSIONSOLAR_PASS`** = รหัส — ตั้งใน Vercel → Settings → Environment Variables (Production) **ห้ามเขียนลงโค้ด/Git**
- ทุกคำขอ POST JSON · `/login {userName, systemCode}` → token จาก header `xsrf-token` + เก็บ cookie → คำขอถัดไปส่ง `XSRF-TOKEN` + cookie เดิม
- login ครั้งเดียวต่อรอบ · **failCode 305** → login ใหม่แล้วลองซ้ำครั้งเดียว
- **login ไม่ผ่าน = หยุดทั้งรอบทันที** (ไม่ลองรหัสผิดซ้ำทุกชุด — เสี่ยงบัญชีถูกล็อก) · log บอก "เช็ก FUSIONSOLAR_USER / FUSIONSOLAR_PASS"
- **failCode 407** (ถี่เกิน) → หยุดทั้งรอบ จด `fsState/blocked_until` = +15 นาที เก็บ cursor ไว้ทำต่อ · รอบที่เริ่มก่อนเวลานั้นข้าม (มี log `skipped`)
- เว้นทุกคำขอ ≥ 3 วินาที (`FUSIONSOLAR_GAP_MS`) นับข้ามรอบด้วย `fsState/last_call_at`
- ทุกคำขอที่พลาดจด `{at, api, failCode, message}` ลง `errors` ของ log
- id อุปกรณ์ 16 หลักเกิน 2^53 → แปลงเป็นสตริงก่อน `JSON.parse` (`parseBody`)

## API ที่ใช้
| API | หมายเหตุ |
|---|---|
| `getStationList` | `capacity` เป็น **MW** ×1000 = kW · ใช้ไม่ได้ → `/stations {pageNo}` (`data.list` plantCode/plantName/plantAddress/capacity เป็น kW · `pageCount`) แล้วจำไว้ใน `fsState/station_api` · ต้องได้ครบทุกหน้าไม่งั้นยกเลิกขั้นไซต์ (กันตัดสิน "ไม่พบ" ผิด) |
| `getStationRealKpi` | ≤100 รหัส/ครั้ง · `day_power` `month_power` `total_power` `real_health_state` (1 ออฟไลน์ · 2 มีปัญหา · 3 ปกติ) |
| `getDevList` | ≤100 สถานี/ครั้ง |
| `getDevRealKpi` | **devTypeId เดียวต่อคำขอ** · ≤100 devIds · เก็บ `dataItemMap` ดิบเป็น `last_kpi_json` |

## โหนดในฐานข้อมูล (สเปกเขียนเป็นตาราง SQL — แอปใช้ RTDB จึงทำเป็นโหนด เขียนทีละฟิลด์)
**`fsSites/{siteId}`** — id = `FS-<code>` (อักษรนอก A-Z0-9 → `_` เช่น `FS-NE_57489892`) · ไซต์ที่เพิ่มเอง `FSM-…`
- ซิงก์เขียน: `name` `fusionsolar_station_code` `capacity_kw` `address` `source` (`fusionsolar`|`manual`) `fs_status` (`found`|`not_found_in_fusionsolar`) `last_synced_at` · KPI: `day_kwh` `month_kwh` `total_kwh` `health_state` `kpi_updated_at`
- ผู้ใช้เขียน (ซิงก์ไม่แตะ): `jobIds {jobId:true}` `note` · ไซต์เพิ่มเอง: `created_at` `created_by` · รวมไซต์: `merged_into` `merged_at` `merged_by`
- ไซต์ที่มีอยู่แล้ว ซิงก์อัปเดตแค่ name / capacity_kw / address / last_synced_at (+ fs_status) · ไม่พบใน FusionSolar = ตั้ง `not_found_in_fusionsolar` **ไม่ลบ** · กลับมาเจอ = `found`
- ไซต์ `manual` ที่ผูกรหัสแล้ว ซิงก์รอบแรกเก็บค่าที่ผู้ใช้กรอกไว้ใน `manual_name` `manual_address` `manual_capacity_kw` (`manual_saved: true`) ก่อนเขียนทับ · `source` ยังเป็น `manual`

**`fsDevices/{devId}`** — `fusionsolar_dev_id` (สตริง) `site_id` `station_code` `dev_name` `dev_type_id` `esn_code` `model` `software_version` `last_kpi_json` (JSON สตริงของ dataItemMap) `last_kpi_at` `fs_status`

**`fsSyncLogs/L<เวลา>`** — `started_at` `finished_at` `job` `trigger` (cron/gh/manual/tool) `by` `ok` `skipped` · ไซต์ `created` `updated` `not_found` · อุปกรณ์ `dev_created` `dev_updated` `dev_not_found` · `stations` `kpi_sites` `kpi_devices` `requests` `pending` `errors[]` `note` `ms`

**`fsKpiDay/{siteId}/{YYYY-MM-DD}`** — `kwh` (ผลิตทั้งวันล่าสุด) · `h/{HH}` ผลิตสะสมของวันถึงรอบซิงก์ชั่วโมงนั้น · `p/{HH}/{devId}` kW ของอินเวอร์เตอร์ตอนซิงก์ — รอบ KPI เขียนเพิ่มเอง ไม่ยิง API เพิ่ม (Huawei ให้แค่ค่าปัจจุบัน) · วัน/ชั่วโมงตามเวลาไทย
**`fsKpiMonth/{siteId}/{YYYY-MM}`** — ผลิตทั้งเดือนล่าสุด (kWh)
ประวัติเริ่มนับวันที่ซิงก์ KPI รอบแรก · ชั่วโมงที่ซิงก์พลาด ผลต่างไปรวมกับแท่งถัดไป (กล่องค่าบอกช่วงเวลาจริง)

**`fsState`** — `lock` (กันสองรอบชนกัน · etag · หมดอายุ 90 วิ) `blocked_until` `last_call_at` `dev_cursor` `kpi_cursor` `station_api` `last_sites_at` `last_kpi_at` `approved_at` `approved_by`

## ผูกกับงานในเว็บ — ทำไมแยกโหนด
ไซต์ ≠ ใบงาน: ไซต์หนึ่งมีได้หลายงาน (ติดตั้ง · ขยายระบบ) และไซต์ใน FusionSolar อาจไม่มีงานของเราเลย → เก็บที่ `fsSites` ผูกด้วย `jobIds` · ไม่เขียนลง `omSites` (จะทำให้ O&M แจ้งเตือนรอบล้างแผง/ประกันของไซต์ที่ไม่ได้ขายบริการ)
หน้ารายละเอียดไซต์แสดงงานที่ผูก (เปิดใบงานได้) และปุ่ม "ทะเบียน O&M" ถ้า `omSites/<jobId>` มีอยู่

## รวมไซต์ (ไซต์เพิ่มเองที่รหัสซ้ำกับไซต์ที่ซิงก์มา)
กรอกรหัสในไซต์ `manual` แล้วซ้ำ → เตือน + ปุ่ม "รวมสองไซต์" (askConfirm) → เก็บไซต์ที่มีรหัสอยู่แล้ว · ย้าย `jobIds` และต่อ `note` · ไซต์ที่เพิ่มเองได้ `merged_into` แล้วซ่อน **ไม่ลบ** · `siteIndex` ข้ามไซต์ที่ถูกรวมแล้ว

## รอบเวลา
- **ไซต์+อุปกรณ์วันละครั้ง** — Vercel cron `0 21 * * *` (04:00 ไทย) `job=all`
- **KPI ทุก 60 นาที** — Vercel Hobby ให้ cron ได้วันละครั้ง จึงให้ GitHub Actions เคาะ `?job=kpi&src=gh` · ต้องตั้ง secret `CRON_SECRET` ใน GitHub ให้ตรงกับ Vercel (ไม่มี = workflow ข้ามเงียบ)
- maxDuration 60 วิ (`vercel.json`) · งบในรอบ 42 วิ · ไม่ทัน = จด cursor ไว้ รอบหน้าทำต่อ (`pending` ใน log)
- **ซิงก์อัตโนมัติไม่ทำอะไรจนกว่าแอดมินกด "บันทึกจริงครั้งแรก"** (`fsState/approved_at`) · ปุ่มนั้นกดได้หลังกดทดลอง (dry run) แล้วเท่านั้น
- ปุ่มในหน้า log: "ทดลอง (dry run)" ไม่เขียนอะไรเลย แสดงสิ่งที่จะสร้าง/เปลี่ยน/ไม่พบ + ตัวอย่าง KPI · "ซิงก์ตอนนี้" เขียนจริง

## ประเภทอุปกรณ์ (devTypeId)
1 String inverter · 38 Residential inverter · 2/63 SmartLogger · 62 Smart Dongle · 17 Grid meter · 47 Power meter · 39 Battery · 41 ESS · 46 Optimizer · อื่น ๆ = "ไม่ทราบประเภท (devTypeId X)" แต่เก็บข้อมูลตามปกติ
## การแสดงผล (ผู้ใช้สั่ง: "นำเสนอรายละเอียดข้อมูลให้ดีกว่านี้ สุดความสามารถ")
**รายละเอียดไซต์** เรียง: กล่อง "ควรดู" → ตัวเลขหลัก 4 ช่อง (กำลังตอนนี้เทียบ kWp · วันนี้ kWh/kWp และ % ของเฉลี่ย 30 วัน · เดือนนี้เฉลี่ย/วัน · สะสม + CO₂) + บอกความสดของข้อมูล → กราฟประวัติ (วันนี้รายชั่วโมง / 30 วัน / 12 เดือน · เส้นเฉลี่ยประ · ชี้ดูค่า · ปุ่มตาราง) → การไหลของพลังงาน (มีมิเตอร์/แบตเท่านั้น) → อุปกรณ์ → ข้อมูลไซต์ → งาน → หมายเหตุ
- อินเวอร์เตอร์: ป้ายสถานะ `inverter_state` เป็นไทย · กำลังเทียบพิกัด (พิกัดอ่านจากชื่อรุ่น `SUN2000-10KTL` = 10 kW) · ผลิต/ประสิทธิภาพ/อุณหภูมิ/แรงดัน-กระแสกริด (3 เฟสถ้ามี) · **ตารางสตริง PV** (ตัดช่องที่ไม่ได้ต่อ · แถบเทียบกัน · กระแส < 60% ของค่ากลาง = "ต่ำ")
- มิเตอร์: ซื้อ/ขายสะสม · กำลังซื้อ/ขายตอนนี้ · แรงดัน/กระแส/ความถี่/PF · แบต: SOC แถบ · SOH · ชาร์จ/คาย · โหมด
- ทุกอุปกรณ์มี "ดูค่าทั้งหมดจากอุปกรณ์" = ทุก key ของ `last_kpi_json` พร้อมชื่อไทย + หน่วย (key ที่ไม่รู้จักแสดงชื่อเดิม)

**หน้าไซต์ทั้งหมด**: ตัวเลขรวม (วันนี้ + เฉลี่ย kWh/kWp · เดือน · สะสมทุกไซต์ + CO₂) · แถบสัดส่วนสถานะ (กดกรองได้) · กล่อง "ต้องดูแล" (เรื่องหนักก่อน) · คอลัมน์ **kWh/kWp วันนี้** พร้อมแถบ (ตัวเทียบไซต์ต่างขนาด) · ไอคอนเตือนหน้าชื่อไซต์

**กติกาที่ตัดสินเอง** (Huawei ไม่บอกตรง ๆ — แก้ที่ `fusionsolar-viz.jsx`):
- ทิศมิเตอร์: ปกติ `reverse_active_cap` = ขายเข้ากริด · ถ้า reverse เกินผลิตสะสมของอินเวอร์เตอร์ (×1.02) แต่ `active_cap` ไม่เกิน → สลับ (มิเตอร์ต่อกลับทิศ) · กำลังตอนนี้ใช้ทิศเดียวกัน (ปกติติดลบ = ขาย)
- หน่วยกำลัง: แบต `ch_discharge_power` เป็น **W** (บวก = ชาร์จ) · มิเตอร์ถ้าค่าเกิน 3 เท่าของ kWp → ถือว่าเป็น W
- บ้านใช้ = โซลาร์ − ขาย − ชาร์จแบต · ใช้เอง = ผลิตสะสม − ขายสะสม · พึ่งตัวเอง = ใช้เอง ÷ (ใช้เอง + ซื้อ) — คิดจากตัวเลขสะสม ถูกเมื่อมิเตอร์ติดพร้อมระบบ (หน้าเว็บมีหมายเหตุบอก)
- CO₂ = kWh × 0.4999 kg (ค่า Grid Emission Factor ของไทย อบก.)
- "ควรดู": ออฟไลน์/มีปัญหา/ไม่พบ · ข้อมูลผลิตค้าง > 3 ชม. · อินเวอร์เตอร์สถานะหยุด (768–774, 45056) · อุณหภูมิ ≥ 75 °C · สตริงกระแสต่ำ (เช็กเฉพาะ 09–15 น.) · แบตผิดพลาด · ด็องเกิล/ล็อกเกอร์ขาดการเชื่อมต่อ · ผลิตต่อ kWp < 60% ของค่ากลางไซต์อื่น (หลัง 11 น. · ต้องมีไซต์ปกติ ≥ 3)
- สีสัดส่วนพลังงาน `--fs-self` `--fs-exp` `--fs-imp` (ผ่านตัวตรวจสี dataviz ทั้งสว่าง/มืด) · กราฟชุดเดียวใช้ `--primary`
- มือถือ: index.html บังคับ grid ใน `.app-content` เป็นคอลัมน์เดียว → ช่องตัวเลข 2 คอลัมน์ใส่ `className="kpi-grid"` · แถวสตริงใช้ flex

## Firebase Rules (ผู้ใช้วางเองใน Console — Claude ไม่แก้กฎ)
`fsSites` อยู่ใต้ `$top` เดิมแล้ว (เว็บเขียน `jobIds`/`note`/ไซต์เพิ่มเอง) · โหนดที่ซิงก์เขียนคนเดียวปิดการเขียนจากเว็บ (service account ข้ามกฎได้):
```json
"fsDevices":  { ".read": "auth != null", ".write": false },
"fsSyncLogs": { ".read": "auth != null", ".write": false },
"fsState":    { ".read": "auth != null", ".write": false },
"fsKpiDay":   { ".read": "auth != null", ".write": false },
"fsKpiMonth": { ".read": "auth != null", ".write": false }
```
เติมห้าบรรทัดนี้ข้าง `userSecrets` / `authFails` ในกฎขั้น 1 ของ `docs/security.md`

## ทดสอบ
- **ห้ามซิงก์ลงฐานจริงโดยไม่ได้รับอนุญาต** · รอบแรกต้อง dry run
- ของปลอม: `node tools/fusionsolar-mock.mjs` (สถานีทดสอบ `NE=57489892` บ้านคุณ Phatcha · อินเวอร์เตอร์ 38 · มิเตอร์ 47 id `1000000057489896` · ฯลฯ) · env `MOCK_EXPIRE` (ให้ 305) `MOCK_MIN_GAP` (ms · ค่าเริ่ม 2000 ให้ 407) `MOCK_NO_STATIONLIST` `MOCK_DROP` (ซ่อนสถานีหนึ่ง)
- สคริปต์: `node tools/fusionsolar-run.mjs [all|sites|kpi] [--write] [--mock]` — ไม่มี `--write` = dry run · เขียนได้เฉพาะฐานทดสอบ (เช็ก config + กุญแจว่าเป็นโปรเจกต์ทดสอบ)
- รหัสจริงในเครื่อง: env หรือไฟล์ `fusionsolar.local.json` `{"user":"api_tarnthanawat","pass":"…"}` ที่โฟลเดอร์หลักของ repo (อยู่ใน `.gitignore`/`.vercelignore`)
- หน้าเว็บบน localhost: `FUSIONSOLAR_BASE=http://localhost:8790/thirdData node tools/devserver.js` → ปุ่มในหน้า log เรียก `api/fusionsolar/sync.mjs` ในเครื่อง (เฉพาะเมื่อมีฐานทดสอบ + `firebase-sa.local.json` ไม่งั้นตอบ 503)

**2026-10-25 รอบสอง:** หน้าแสดงผลใหม่ทั้งหมด (ด้านบน) + ประวัติ fsKpiDay/fsKpiMonth · ทดสอบกับ mock + ฐานทดสอบ (สว่าง/มืด/มือถือ) · แก้บั๊ก `bkk` ถูกเรียกก่อนประกาศ (ทำให้รอบ KPI พังทุกชุด)
**สถานะ 2026-10-25 (เครื่อง 2):** ทดสอบกับ mock + ฐานทดสอบผ่านครบ (dry run · เขียนจริง · 305 · 407 · fallback /stations · ไม่พบแล้วไม่ลบ · รหัสผิดหยุดที่ login ครั้งเดียว · หน้าเว็บ 4 หน้า · ผูกงาน · รวมไซต์) · **ยังไม่ได้ลอง API จริง** — เครื่องนี้ไม่มี `FUSIONSOLAR_PASS` · ยังไม่ merge ลง master
ผู้ใช้ทดสอบในฐานทดสอบ: `users/U__fstest` (แอดมิน · ปิดใช้งานแล้ว)
