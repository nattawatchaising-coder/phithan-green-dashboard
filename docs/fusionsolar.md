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
- อินเวอร์เตอร์ (1, 38): `total_cap` `day_cap` `active_power`
- มิเตอร์ (17, 47): `active_cap` `reverse_active_cap` `active_power` `meter_u` `meter_i`
- อื่น ๆ: ตาราง key/value ของ `last_kpi_json` ทั้งหมด

## Firebase Rules (ผู้ใช้วางเองใน Console — Claude ไม่แก้กฎ)
`fsSites` อยู่ใต้ `$top` เดิมแล้ว (เว็บเขียน `jobIds`/`note`/ไซต์เพิ่มเอง) · โหนดที่ซิงก์เขียนคนเดียวปิดการเขียนจากเว็บ (service account ข้ามกฎได้):
```json
"fsDevices":  { ".read": "auth != null", ".write": false },
"fsSyncLogs": { ".read": "auth != null", ".write": false },
"fsState":    { ".read": "auth != null", ".write": false }
```
เติมสามบรรทัดนี้ข้าง `userSecrets` / `authFails` ในกฎขั้น 1 ของ `docs/security.md`

## ทดสอบ
- **ห้ามซิงก์ลงฐานจริงโดยไม่ได้รับอนุญาต** · รอบแรกต้อง dry run
- ของปลอม: `node tools/fusionsolar-mock.mjs` (สถานีทดสอบ `NE=57489892` บ้านคุณ Phatcha · อินเวอร์เตอร์ 38 · มิเตอร์ 47 id `1000000057489896` · ฯลฯ) · env `MOCK_EXPIRE` (ให้ 305) `MOCK_MIN_GAP` (ms · ค่าเริ่ม 2000 ให้ 407) `MOCK_NO_STATIONLIST` `MOCK_DROP` (ซ่อนสถานีหนึ่ง)
- สคริปต์: `node tools/fusionsolar-run.mjs [all|sites|kpi] [--write] [--mock]` — ไม่มี `--write` = dry run · เขียนได้เฉพาะฐานทดสอบ (เช็ก config + กุญแจว่าเป็นโปรเจกต์ทดสอบ)
- รหัสจริงในเครื่อง: env หรือไฟล์ `fusionsolar.local.json` `{"user":"api_tarnthanawat","pass":"…"}` ที่โฟลเดอร์หลักของ repo (อยู่ใน `.gitignore`/`.vercelignore`)
- หน้าเว็บบน localhost: `FUSIONSOLAR_BASE=http://localhost:8790/thirdData node tools/devserver.js` → ปุ่มในหน้า log เรียก `api/fusionsolar/sync.mjs` ในเครื่อง (เฉพาะเมื่อมีฐานทดสอบ + `firebase-sa.local.json` ไม่งั้นตอบ 503)

**สถานะ 2026-10-25 (เครื่อง 2):** ทดสอบกับ mock + ฐานทดสอบผ่านครบ (dry run · เขียนจริง · 305 · 407 · fallback /stations · ไม่พบแล้วไม่ลบ · รหัสผิดหยุดที่ login ครั้งเดียว · หน้าเว็บ 4 หน้า · ผูกงาน · รวมไซต์) · **ยังไม่ได้ลอง API จริง** — เครื่องนี้ไม่มี `FUSIONSOLAR_PASS` · ยังไม่ merge ลง master
ผู้ใช้ทดสอบในฐานทดสอบ: `users/U__fstest` (แอดมิน · ปิดใช้งานแล้ว)
