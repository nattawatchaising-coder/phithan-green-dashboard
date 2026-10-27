# Sungrow iSolarCloud — ไซต์ · อุปกรณ์ · ข้อมูลผลิต

ผู้ใช้สั่ง 2026-10-27: "จะเอา api ของ isolarcloud มาด้วย" — ไซต์ Sungrow ขึ้นหน้า "ไซต์ทั้งหมด" ร่วมกับ Huawei (ดู `docs/fusionsolar.md`)
หลักเดียวกับ FusionSolar: เซิร์ฟเวอร์ดึงลง Firebase หน้าเว็บอ่านจากฐานอย่างเดียว · ซิงก์ไม่แตะ `jobs/`

## สถานะ
- **ขั้น 1 (ทำแล้ว):** ตัวยิง API + เข้ารหัส (`api/_lib/isolarcloud.mjs`) · สคริปต์สำรวจอ่านอย่างเดียว · ตัวปลอม — ผ่านกับตัวปลอมทั้งโหมดเข้ารหัส/ไม่เข้ารหัส
- **ขั้น 2 (รอ):** รันสำรวจกับของจริง ดูชื่อฟิลด์/หน่วยจริงก่อน แล้วค่อยออกแบบการเก็บลง `fsSites`/`fsDevices` (id `SG-<ps_id>` · `source: "isolarcloud"`) + ซิงก์ผ่าน endpoint เดิม (Vercel Hobby จำกัด 12 ฟังก์ชัน ใช้อยู่ 10)

## ไฟล์
| ไฟล์ | หน้าที่ |
|---|---|
| `api/_lib/isolarcloud.mjs` | ตัวยิง (เข้ารหัส · login · token หมด = login ใหม่ครั้งเดียว · เว้น 1 วิ/คำขอ) + `iscPlants` `iscDevices` `iscRealtime` `iscPointInfo` |
| `tools/isolarcloud-probe.mjs` | สำรวจของจริง **อ่านอย่างเดียว** → สรุปบนจอ + คำตอบดิบ `isolarcloud-probe.local.json` (มีชื่อลูกค้า ห้าม commit) |
| `tools/isolarcloud-mock.mjs` | iSolarCloud ปลอม port 8791 (ถอดรหัสจริง · `MOCK_PLAIN=1` = ไม่เข้ารหัส) · `node tools/isolarcloud-probe.mjs --mock` |

## รหัส (ห้ามเขียนลงโค้ด/Git/แชต)
- ในเครื่อง: `isolarcloud.local.json` ที่โฟลเดอร์หลักของ repo `{base, appkey, access_key, rsa_key, user, pass, encrypt}` (อยู่ใน `.gitignore`/`.vercelignore`)
- บน Vercel (ขั้น 2): `ISOLARCLOUD_BASE` `ISOLARCLOUD_APPKEY` `ISOLARCLOUD_ACCESS_KEY` `ISOLARCLOUD_RSA_KEY` `ISOLARCLOUD_USER` `ISOLARCLOUD_PASS` (+ `ISOLARCLOUD_ENCRYPT=0` ถ้าแอปใน portal ไม่เปิดเข้ารหัส)
- ได้จาก iSolarCloud Developer Portal → Applications → แอปแบบ **V1 (ไม่ใช่ OAuth2)** · บัญชีผู้ใช้ควรเป็นบัญชีอ่านอย่างเดียว และต้องอยู่ใน whitelist ของแอป

## API (OpenAPI V1 — ข้อมูลจากโค้ดชุมชน ยังไม่ได้ยืนยันกับเอกสารทางการ)
- เซิร์ฟเวอร์แยกภูมิภาค: สากล `gateway.isolarcloud.com.hk` (ค่าเริ่ม) · ยุโรป `gateway.isolarcloud.eu` · ออสเตรเลีย `augateway.isolarcloud.com` — ผิดเซิร์ฟเวอร์มักได้ `er_invalid_appkey`
- header `x-access-key` `sys_code: 901` (+ `token` หลัง login) · body มี `appkey` `lang` `api_key_param {timestamp, nonce 32 ตัว}` · สำเร็จ = `result_code "1"`
- เข้ารหัส: กุญแจสุ่ม 16 ตัวต่อคำขอ → body AES-128-ECB PKCS7 hex ตัวใหญ่ · กุญแจเข้า RSA PKCS#1 v1.5 (ทีละชิ้น) base64 url-safe ใน `x-random-secret-key` · คำตอบ hex ถอดด้วยกุญแจเดิม
- `/openapi/login` `{user_account, user_password, login_type:"1"}` → `token` (`login_state "1"`) · `/openapi/getPowerStationList {curPage,size}` → `pageList` `rowCount` · `/openapi/getDeviceList {ps_id,...}` · `/openapi/getDeviceRealTimeData {device_type, ps_key_list, point_id_list}` → `device_point_list[].device_point.p<id>` · `/openapi/getOpenPointInfo {device_type}` = ชื่อ point
- ps_key ระดับไซต์ = `<ps_id>_11_0_0` (device_type 11) · point ไซต์: 83022 ผลิตวันนี้ Wh · 83024 สะสม Wh · 83033 กำลังตอนนี้ W · 83025 ชั่วโมงเทียบเท่า · 83001 W/Wp · 83102 ซื้อวันนี้ Wh · 83072 ขายวันนี้ Wh · 83106 ใช้ไฟตอนนี้ W
- รหัสข้อผิดพลาดที่รู้: E912 access key ผิด · E919 บัญชีไม่อยู่ใน whitelist · `er_invalid_appkey`
