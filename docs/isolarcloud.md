# Sungrow iSolarCloud — ไซต์ · อุปกรณ์ · ข้อมูลผลิต

ผู้ใช้สั่ง 2026-10-27: "จะเอา api ของ isolarcloud มาด้วย" — ไซต์ Sungrow ขึ้นหน้า "ไซต์ทั้งหมด" ร่วมกับ Huawei (ดู `docs/fusionsolar.md`)
หลักเดียวกับ FusionSolar: เซิร์ฟเวอร์ดึงลง Firebase หน้าเว็บอ่านจากฐานอย่างเดียว · ซิงก์ไม่แตะ `jobs/`

## สถานะ
- **ขั้น 1 (ทำแล้ว):** ตัวยิง API + เข้ารหัส · สคริปต์สำรวจอ่านอย่างเดียว · ตัวปลอม
- **ขั้น 2 (ทำแล้ว 2026-10-27):** `runIscSync` ซิงก์ลง `fsSites`/`fsDevices`/`fsKpiDay`/`fsKpiMonth` — ทดสอบกับ iSolarCloud จริง + RTDB ปลอมในหน่วยความจำ (dry run ไม่เขียน · ไซต์ Huawei ไม่ถูกแตะ) และหน้าเว็บด้วยข้อมูลปลอมครอบ `FBDB.ref` (เขียน 0 ครั้ง)
- **ยังต้องทำ (ผู้ใช้):** ตั้ง env 6 ตัวใน Vercel → หน้า log การซิงก์ แผง "ซิงก์ Sungrow iSolarCloud" กดทดลอง (dry run) แล้ว "บันทึกจริงครั้งแรก" = อนุมัติให้ซิงก์อัตโนมัติ (`fsState/isc/approved_at`)
- **ยังไม่มี:** ข้อมูลย้อนหลัง (กราฟเริ่มนับวันที่ซิงก์แรก) · แบตเตอรี่ (ยังไม่เจอไซต์ที่มี)

## การเก็บลงฐาน (ใช้โหนดเดียวกับ Huawei — หน้าไซต์ทั้งหมด/รายละเอียด/Excel/"ควรดู" ใช้ร่วม)
- ไซต์ `fsSites/SG-<ps_id>` · `source: "isolarcloud"` · ผูกด้วย **`isc_ps_id`** — **ห้ามมี `fusionsolar_station_code`** (ซิงก์ Huawei จะตั้ง "ไม่พบใน FusionSolar")
  - ค่าจากรายชื่อไซต์ (คำขอเดียวได้ทุกไซต์): `day_kwh` `total_kwh` `capacity_kw` (แปลงตาม unit) `health_state` (ps_status ≠ 1 → 1 ออฟไลน์ · ps_fault_status 1/2 → 2 · อื่น 3) `isc_power_kw` `isc_alarm_count` `isc_fault_count` `grid_date` (install_date)
  - `month_kwh` = รวม p87 "Yield this month" ของอินเวอร์เตอร์ (รายชื่อไซต์ไม่มีค่าเดือน · logger ไม่ส่ง p10593)
- อุปกรณ์ `fsDevices/SG-<ps_key>` · `isc_ps_key` `isc_device_type` `station_code = SG-<ps_id>` · `dev_type_id` แปลงเป็นเลข Huawei (`ISC_TYPE`: 1→1 · 7→47 · 9→63 · 22 WiNet-S→62 · 5→10)
- `last_kpi_json` = key แบบ Huawei (kW/kWh) แปลงใน `iscInvKpi` `iscMeterKpi` `iscLoggerKpi` · `isc_raw_json` = ค่าดิบ p<id>
  - อินเวอร์เตอร์: 24→active_power · 14→mppt_power · 1/2/87→day/total/month_cap · 4 อุณหภูมิ · 18–23 เฟส · MPPT (5/6, 7/8, 9/10, 45/46…) → `pvN_u/pvN_i` **เฉพาะ ≥ 100 V** (ไม่ได้ต่อก็มีแรงดันค้าง 40 V) · `efficiency` = AC/DC · ไม่มี `inverter_state` (p29 เก็บเป็น `isc_state` ยังไม่รู้ความหมาย)
  - **ตัวตรวจ "สตริงกระแสต่ำ" ไม่ใช้กับ Sungrow** — ค่าเป็นต่อ MPPT ที่ต่อสตริงไม่เท่ากัน (5.9/12.2/4.3 A) เทียบกันแล้วเตือนผิด
  - มิเตอร์: 8030 forward = **ซื้อ** → `reverse_active_cap` · 8031 reverse = **ขาย** → `active_cap` · `active_power` = −p8018 (W · บวก = ขาย) — ตรวจ: p8018 = ใช้ไฟ − โซลาร์ · มิเตอร์ 1 เฟส (B/C = 0) → `meter_u`/`meter_i`
- ประวัติ `fsKpiDay` h/p/m จดรอบแรกของชั่วโมง (`fsState/isc/kpi_snap`) ความหมายเดียวกับ Huawei · `fsKpiMonth` จาก month_kwh
- log ใน `fsSyncLogs/L<ms>i` (`vendor: "isolarcloud"`) · สถานะ `fsState/isc` {lock approved_at approved_by last_call_at last_sites_at last_kpi_at kpi_snap login_fail refresh_at}
- ล็อกอินพลาด → `fsState/isc/login_fail` ป้ายแดงหน้าไซต์ทั้งหมด · รอบอัตโนมัติเว้น 1 ชม. (เหมือน Huawei)

## รอบเวลา (ไม่เพิ่มไฟล์ใน api/ — Vercel Hobby จำกัด 12 ฟังก์ชัน ใช้อยู่ 10)
- `api/cron/fusionsolar.mjs` รัน Huawei + Sungrow **คู่ขนาน** (`Promise.all`) — `job=all/sites` → Sungrow `sites` · `job=kpi` → `kpi` · `hist` ไม่รัน Sungrow · Sungrow ต้องตั้ง env ครบ + อนุมัติแล้ว
- `api/fusionsolar/sync.mjs` refresh (มีคนเปิดหน้า) ตัดสินแยกยี่ห้อ (สด < 10 นาที · ล็อก · ล็อกอินพลาด · cooldown) · ปุ่มแอดมิน `job: "isc_sites" | "isc_kpi"`
- รอบ kpi ≈ 5 คำขอ 5 วิ (รายชื่อไซต์ 1 + ค่าอุปกรณ์ต่อประเภท) · sites ≈ 9 คำขอ 8 วิ (4 ไซต์)

## หน้าเว็บ
- `fsVendor(s)` / `fsCodeOf(s)` / `fsVendorTH(s)` (fusionsolar-viz.jsx) — ยี่ห้อ/รหัสของไซต์ · รหัส Sungrow แสดง "PS <ps_id>"
- ป้ายยี่ห้อ `FsSrcChip` (Huawei ฟ้า · Sungrow เหลือง · เพิ่มเอง เทา) · ตัวกรองยี่ห้อในหน้าไซต์ทั้งหมด (โผล่เมื่อมี > 1 ยี่ห้อ)
- หน้า log: แผง `FsIscPanel` (สถานะ + ปุ่มทดลอง/ซิงก์) · แถว log มีชื่อยี่ห้อ

## ผลสำรวจของจริง (2026-10-27 · `node tools/isolarcloud-probe.mjs`)
- **ล็อกอินผ่านที่ `gateway.isolarcloud.com.hk` แบบเข้ารหัส** · บัญชี Flashplussolar (user_id 498435) · 6 คำขอ ไม่มี error
- **4 ไซต์:** SAN HER PLASTIC 2 (236.25 kWp) · SAN HER PLASTIC 1 (350) · Tissin food (thailand) (717.6) · ANDYLISA (11.7)
- **`getPowerStationList` ให้ค่าผลิตมาด้วยเลย** (ไม่ต้องยิงค่าตอนนี้แยกต่อไซต์) — ค่าเป็น `{unit, value}` หน่วยเปลี่ยนตามขนาด (เจอ `total_energy` เป็น **MWh** · `today_energy` kWh · `curr_power` kW) **ต้องแปลงตาม unit ทุกครั้ง**
  - อื่น ๆ: `total_capcity` (สะกดผิดตามต้นทาง · kWp) · `co2_reduce(_total)` kg · `equivalent_hour` · `today_income`/`total_income` THB · `ps_status` 1 · `ps_fault_status` 3 (= ปกติ?) · `alarm_count` `fault_count` · `install_date` · `ps_current_time_zone` "GMT+7"
  - เวลา `*_update_time` ส่งเป็น **+08:00** (เวลาจีน เหมือน Huawei) — เป็นเวลาจริงที่ตีโซนผิดหรือไม่ ยังต้องเช็ก
  - `latitude`/`longitude` ไซต์ตัวอย่างเป็นค่าหลอก ~0.00 → ล้างทิ้งแบบ FusionSolar
- **อุปกรณ์** (`getDeviceList`): `device_type` 1 Inverter (SG150CX · SG36CX-P2) · 7 Meter (UMG104-1) · 9 Data logger (Logger1000) · ฟิลด์ `ps_key` `device_sn` `device_name` `device_model_code` `type_name` `dev_status` `dev_fault_status` `uuid`
- **ค่าไซต์ (device_type 11) ผ่าน `getDeviceRealTimeData` ถูกหน่วยตามที่คาด** (Wh/W) — ตรวจกับไซต์จริง: ผลิตตอนนี้ 222.7 kW ≈ ใช้ไฟ 221.5 kW · ซื้อวันนี้ 1,222 kWh ขาย 1.6 kWh (โรงงาน)
- **point อินเวอร์เตอร์ 540 ตัว** (`getOpenPointInfo` ให้ `point_id` `point_name` `storage_unit`): 1 ผลิตวันนี้ Wh · 2 สะสม Wh · 3 ชั่วโมงทำงาน · 4 อุณหภูมิภายใน ℃ · 5/6, 7/8, 9/10, 45/46 … 51/52 MPPT1–7 V/A · 14 กำลัง DC W · 18–20 แรงดันเฟส · 21–23 กระแสเฟส · **24 กำลังไฟ AC W** · 25 var · 26 PF · 27 Hz · 29 สถานะทำงาน · 43 VA · 70+ กระแสสตริง 1… A
- ค่าใน `device_point` เป็นสตริง · `device_time` "YYYYMMDDHHmmss" · มี `dev_fault_status` ติดมา

## ไฟล์
| ไฟล์ | หน้าที่ |
|---|---|
| `api/_lib/isolarcloud.mjs` | ตัวยิง (เข้ารหัส · login · token หมด = login ใหม่ครั้งเดียว · เว้น 1 วิ/คำขอ) + `iscPlants` `iscDevices` `iscRealtime` `iscPointInfo` |
| `tools/isolarcloud-probe.mjs` | สำรวจของจริง **อ่านอย่างเดียว** → สรุปบนจอ + คำตอบดิบ `isolarcloud-probe.local.json` (มีชื่อลูกค้า ห้าม commit) |
| `tools/isolarcloud-mock.mjs` | iSolarCloud ปลอม port 8791 (ถอดรหัสจริง · `MOCK_PLAIN=1` = ไม่เข้ารหัส) · `node tools/isolarcloud-probe.mjs --mock` |

## รหัส (ห้ามเขียนลงโค้ด/Git/แชต)
- ในเครื่อง: `isolarcloud.local.json` ที่โฟลเดอร์หลักของ repo `{base, appkey, access_key, rsa_key, user, pass, encrypt}` (อยู่ใน `.gitignore`/`.vercelignore`)
- บน Vercel (Production): `ISOLARCLOUD_BASE` `ISOLARCLOUD_APPKEY` `ISOLARCLOUD_ACCESS_KEY` `ISOLARCLOUD_RSA_KEY` `ISOLARCLOUD_USER` `ISOLARCLOUD_PASS` (+ `ISOLARCLOUD_ENCRYPT=0` ถ้าแอปใน portal ไม่เปิดเข้ารหัส)
- ได้จาก iSolarCloud Developer Portal → Applications → แอปแบบ **V1 (ไม่ใช่ OAuth2)** · บัญชีผู้ใช้ควรเป็นบัญชีอ่านอย่างเดียว และต้องอยู่ใน whitelist ของแอป

## API (OpenAPI V1 — ข้อมูลจากโค้ดชุมชน ยังไม่ได้ยืนยันกับเอกสารทางการ)
- เซิร์ฟเวอร์แยกภูมิภาค: สากล `gateway.isolarcloud.com.hk` (ค่าเริ่ม) · ยุโรป `gateway.isolarcloud.eu` · ออสเตรเลีย `augateway.isolarcloud.com` — ผิดเซิร์ฟเวอร์มักได้ `er_invalid_appkey`
- header `x-access-key` `sys_code: 901` (+ `token` หลัง login) · body มี `appkey` `lang` `api_key_param {timestamp, nonce 32 ตัว}` · สำเร็จ = `result_code "1"`
- เข้ารหัส: กุญแจสุ่ม 16 ตัวต่อคำขอ → body AES-128-ECB PKCS7 hex ตัวใหญ่ · กุญแจเข้า RSA PKCS#1 v1.5 (ทีละชิ้น) base64 url-safe ใน `x-random-secret-key` · คำตอบ hex ถอดด้วยกุญแจเดิม
- `/openapi/login` `{user_account, user_password, login_type:"1"}` → `token` (`login_state "1"`) · `/openapi/getPowerStationList {curPage,size}` → `pageList` `rowCount` · `/openapi/getDeviceList {ps_id,...}` · `/openapi/getDeviceRealTimeData {device_type, ps_key_list, point_id_list}` → `device_point_list[].device_point.p<id>` · `/openapi/getOpenPointInfo {device_type}` = ชื่อ point
- ps_key ระดับไซต์ = `<ps_id>_11_0_0` (device_type 11) · point ไซต์: 83022 ผลิตวันนี้ Wh · 83024 สะสม Wh · 83033 กำลังตอนนี้ W · 83025 ชั่วโมงเทียบเท่า · 83001 W/Wp · 83102 ซื้อวันนี้ Wh · 83072 ขายวันนี้ Wh · 83106 ใช้ไฟตอนนี้ W
- รหัสข้อผิดพลาดที่รู้: E912 access key ผิด · E919 บัญชีไม่อยู่ใน whitelist · `er_invalid_appkey`
