# ไซต์ MikroTik — VPN · สคริปต์ตั้งค่า · สถานะไซต์

เริ่ม 2026-11-11 · **เฟส 1 เสร็จ** (ลงทะเบียนไซต์ + สร้างสคริปต์) · เฟส 2 แดชบอร์ดสถานะ = ยังไม่ทำ · เฟส 3 อ่านมิเตอร์ PM2200 = เผื่อโครงไว้

แต่ละไซต์อยู่ในเน็ตโรงงาน (แก้เราเตอร์โรงงานไม่ได้ ไม่มี public IP) อุปกรณ์:
hEX refresh E50UG (RouterOS v7, ether1 = WAN DHCP, ether2-5 = LAN) · Huawei SmartLogger · Waveshare RS485→ETH (Modbus TCP 502) ต่อมิเตอร์ Schneider PM2200

## แผน IP (ผู้ใช้กำหนด — ห้ามเปลี่ยน)
| | ไซต์ N |
|---|---|
| LAN | `10.10.N.0/24` · hEX `.1` · SmartLogger `.10` · Waveshare `.20` · DHCP `.100–.200` |
| WireGuard | `10.99.0.0/24` · เซิร์ฟเวอร์ `10.99.0.1:51820` · ไซต์ N = `10.99.0.(10+N)` |
| ชื่อเราเตอร์ | `SITE{N:02}-{ชื่อ}` เช่น `SITE05-ThaiSteel` |

N = 1–244 (10+N ต้องไม่เกิน 254) · ชื่อไซต์ A-Z a-z 0-9 และ `-` ไม่เกิน 24 ตัว (ใช้ในสคริปต์ RouterOS — ไทยใส่ในหมายเหตุ)
hEX เป็นฝ่ายต่อเข้าเซิร์ฟเวอร์ (keepalive 25 วิ) · Back To Home (`/ip cloud`) เปิดคู่กันไว้ให้เจ้าของเข้าไซต์เอง

## โครงสร้าง
```
เว็บ (ล็อกอินเดิม) → /api/mikrotik/site (Vercel · ตรวจแอดมิน) → Firebase mtSites / mtSecrets
                                                    ↑ เฟส 2: mt-agent บนเซิร์ฟเวอร์ WireGuard อ่าน REST ของ hEX แล้วเขียนสถานะลง Firebase
```
**ฟังก์ชัน Vercel เข้าวง WireGuard ไม่ได้** — อะไรที่ต้องคุยกับ `10.10.N.x` (REST · ping · Modbus) ต้องรันบนเครื่องเซิร์ฟเวอร์ WireGuard (เฟส 2/3)

| ไฟล์ | หน้าที่ |
|---|---|
| `api/_lib/mikrotik.mjs` | แผน IP · คีย์ WireGuard (X25519 ด้วย `node:crypto`) · เข้ารหัส AES-256-GCM · `buildRsc` · `buildServerPeer` — ไม่มี dependency |
| `api/mikrotik/site.mjs` | `GET` = env ครบไหม (บอกแค่ชื่อที่ขาด) · `POST` create / edit / script / rotate / remove — เฉพาะแอดมิน (อ่าน `users/<uid>` ล่าสุด) |
| `dashboard/mikrotik.jsx` | หน้า "ไซต์ MikroTik" ในเมนูตั้งค่า (สิทธิ์ `manageUsers` · ปุ่มทั้งหมดเซิร์ฟเวอร์ตรวจแอดมินซ้ำ) |
| `tools/mt-server/setup.sh` | ติดตั้งเซิร์ฟเวอร์ WireGuard บน VPS + คำสั่ง `mt-peer` (LF เสมอ — `.gitattributes`) |
| `tests/mikrotik*.test.mjs` | `npm test` (node --test ไม่มี dependency · API เทสต์กับฐานปลอมในหน่วยความจำ ไม่ยิง Firebase จริง) · CI build-check รันด้วย |

## ข้อมูลในฐาน
- **`mtSites/{N}`** (พนักงานที่ล็อกอินอ่านได้ · เว็บไม่เขียนเอง ทุกการเขียนผ่าน API): `n name note wg_pub wg_ip lan created_at/by updated_at/by keys_at/by script_at/by`
- **`mtSecrets/{N}`** (เซิร์ฟเวอร์เท่านั้น): `wg_priv` `web_pass` เข้ารหัส AES-256-GCM ด้วย `MT_ENC_KEY` · รูป `v1.<iv>.<tag>.<ข้อมูล>` · aad = `mt/N/<ช่อง>` (ย้ายไปไซต์อื่นแล้วถอดไม่ได้)
- จองเลข N ด้วย ETag (`rtdbSetIf`) — กดพร้อมกันได้ 409 คนหนึ่ง · เขียน secret หลังจองเลขได้เท่านั้น (กันทับของไซต์เดิม)

### ทำไมเก็บ private key แบบเข้ารหัส (ไม่ใช่แสดงครั้งเดียว)
รหัส user เว็บต้องเก็บไว้ให้ agent เฟส 2 ใช้อยู่แล้ว · ขอสคริปต์ซ้ำได้ตอนเปลี่ยนเราเตอร์/รันใหม่ · รั่วแล้วกด "สร้างคีย์ใหม่"
private key ของ**เซิร์ฟเวอร์**ไม่อยู่ในเว็บเลย (ใช้แค่ public key จาก env) · สคริปต์ไม่เก็บที่ไหน สร้างใหม่ทุกครั้งที่กด

## env (Vercel → Settings → Environment Variables · Production) — ห้ามใส่ในโค้ด/Git (repo public)
| ชื่อ | ค่า |
|---|---|
| `MT_WG_ENDPOINT` | host หรือ host:port ของเซิร์ฟเวอร์ WireGuard เช่น `vpn.example.com:51820` (ไม่ใส่ port = 51820) |
| `MT_WG_SERVER_PUBKEY` | public key ของเซิร์ฟเวอร์ (`/etc/wireguard/server.pub`) |
| `MT_ENC_KEY` | กุญแจเข้ารหัส 32 ไบต์ base64 สร้างด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` — **ทำหาย/เปลี่ยน = ถอดกุญแจเดิมไม่ได้** ต้องกด "สร้างคีย์ใหม่" ทุกไซต์แล้วรันสคริปต์ใหม่ เก็บสำรองไว้ในที่ปลอดภัย |
| (มีอยู่แล้ว) `RTDB_URL` `FIREBASE_SERVICE_ACCOUNT` | |

ตั้ง/เปลี่ยน env แล้วต้อง Redeploy ถึงมีผล · ยังไม่ครบ = หน้าเว็บขึ้นป้ายเหลืองบอกชื่อที่ขาด

### กฎฐานข้อมูลที่ผู้ใช้ต้องวางเอง (Claude ห้ามแก้กฎ — docs/security.md)
เพิ่มข้างกฎ `userSecrets` เดิม (ชื่อเฉพาะชนะ `$top`):
```json
"mtSecrets": { ".read": false, ".write": false },
"mtSites":   { ".read": "auth != null", ".write": false }
```
ยังไม่วาง = พนักงานที่ล็อกอินอ่าน `mtSecrets` ได้ แต่เป็นข้อมูลเข้ารหัส (ไม่มี `MT_ENC_KEY` ถอดไม่ได้)

## ตั้งเซิร์ฟเวอร์ WireGuard (ครั้งเดียว · VPS Ubuntu 22.04/24.04)
ผู้ใช้เลือกเช่า VPS (2026-11-11 ดู Hostinger KVM) แทนเปิดคอมค้าง — คอมในออฟฟิศใช้ได้แค่ทดสอบบนโต๊ะ (hEX อยู่วงแลนเดียวกัน endpoint = IP แลนของคอม)
- **ใช้จริง (2026-11-11):** VPS ไทยของ visperhost แพ็กเกจ Cloud VPS 00 (1 vCore/1 GB/15 GB · 150 บาท+VAT/เดือน ออกใบกำกับได้) Ubuntu 24.04 ชื่อเครื่อง `wg-server` · รัน setup.sh ผ่านแล้ว · IP อยู่ใน env `MT_WG_ENDPOINT` · เครื่องใหม่ต้องรอ ~5–10 นาทีหลังสร้างกว่า SSH จะเปิด
- ต้องเป็น **VPS (KVM) มี root** ไม่ใช่ web hosting · OS **Ubuntu เปล่า** (ไม่เอา template/panel) · สเปกเล็กสุดพอ · ที่ตั้งใกล้ไทย
SSH เข้า VPS แล้วรัน (สคริปต์ `tools/mt-server/setup.sh` — รันซ้ำได้ ไม่สร้างคีย์ใหม่ ไม่ลบ peer):
```bash
curl -fsSL https://raw.githubusercontent.com/nattawatchaising-coder/phithan-green-dashboard/master/tools/mt-server/setup.sh | sudo bash
```
ติดตั้ง wireguard-tools + ufw · สร้างคีย์ `/etc/wireguard/server.key` (ไม่ออกจากเครื่อง) · wg0 = `10.99.0.1/24` UDP 51820 · ufw เปิดแค่ SSH + 51820 · ท้ายสุดพิมพ์ `MT_WG_ENDPOINT` และ `MT_WG_SERVER_PUBKEY` ให้เอาไปใส่ Vercel
- **เปิด UDP 51820 ใน firewall ของผู้ให้บริการด้วย** (Hostinger: hPanel → VPS → Firewall) ไม่งั้นไซต์ต่อไม่ติดแม้ในเครื่องตั้งถูก
- **สำรอง `server.key`** — ย้ายเครื่องเซิร์ฟเวอร์ = เอาไฟล์นี้ไปด้วย public key เดิม ที่ hEX แก้แค่ endpoint · หาย = ทุกไซต์ต้องรันสคริปต์ใหม่
- peer แยกไฟล์ `/etc/wireguard/peers/site-NNN.conf` → `wg0.conf` ประกอบจาก `wg0.head` + peers ทุกไฟล์ (ห้ามแก้ wg0.conf ตรง ๆ)
- คำสั่ง **`mt-peer`**: `sudo mt-peer add` (วาง peer จากเว็บ แล้ว Ctrl+D · ตรวจ AllowedIPs ตรงแผน · ไซต์เดิม = แทนคีย์) · `sudo mt-peer del N` · `sudo mt-peer list` (handshake ล่าสุด) — ใช้ `wg syncconf` ไม่ตัดไซต์อื่น + เพิ่ม route LAN ไซต์เอง
- ทดสอบ mt-peer บน Windows (Git Bash) ได้ด้วย env `MT_WG_DIR=<โฟลเดอร์>` = เขียนไฟล์อย่างเดียว ไม่แตะ interface

## เพิ่มไซต์ใหม่
**ในเว็บ (แอดมิน)** ตั้งค่า → ไซต์ MikroTik → เพิ่มไซต์ (N เสนอเลขว่างถัดไปให้) → "สร้างสคริปต์ .rsc" → ดาวน์โหลด `.rsc` + คัดลอก peer

**เซิร์ฟเวอร์** `sudo mt-peer add` แล้ววาง peer + Ctrl+D

**หน้างาน**
1. hEX ต้องเป็น RouterOS **7.12 ขึ้นไป** (Back To Home) — อัปเดตก่อน
2. ether1 ต่อสาย LAN ของโรงงาน (ต้องได้ IP จาก DHCP และออกเน็ตได้ — UDP ขาออกไปพอร์ต 51820 ต้องไม่ถูกบล็อก)
3. โน้ตบุ๊กต่อ ether2–5 → เปิด **WinBox ต่อด้วย MAC address** (ไม่ใช่ IP — IP ฝั่ง LAN เปลี่ยนกลางสคริปต์ ต่อด้วย IP จะหลุด)
4. ลากไฟล์ `.rsc` ใส่ Files → Terminal: `/import file-name=SITE05-ThaiSteel.rsc verbose=yes`
5. ท้ายสคริปต์พิมพ์ `cert fingerprint` — จดไว้ (เฟส 2 ใช้ pin ใบรับรอง)
6. ตั้ง IP คงที่ที่ตัวอุปกรณ์: SmartLogger `10.10.N.10/24` · Waveshare `10.10.N.20/24` · gateway ทั้งคู่ `10.10.N.1` (ไม่ตั้ง gateway = VPN เข้าถึงไม่ได้)
7. **ลบไฟล์ `.rsc` ออกจาก Files ของ hEX และเครื่องตัวเอง** (มีกุญแจลับ)
8. เช็กบนเซิร์ฟเวอร์: `sudo wg show` (latest handshake ไม่เกิน ~2 นาที) · `ping 10.10.N.1` · `curl -k https://10.10.N.1/rest/system/resource -u pg-web:<รหัส>` (รหัสอยู่ในสคริปต์บรรทัด `/user`)

## สคริปต์ทำอะไร (`buildRsc` — ทุกส่วนมีคอมเมนต์ไทย)
identity + timezone → bridge ether2-5 → DHCP client ether1 → IP LAN (ลบ 192.168.88.1 ค่าตั้งต้น) → pool/DHCP server (ลบ defconf) → NAT masquerade ออก ether1 → WireGuard `wg-pg` + peer เซิร์ฟเวอร์ (allowed `10.99.0.1/32`) + IP tunnel → ใบรับรอง self-signed `pg-https` → ปิด www/telnet/ftp/api/api-ssl เปิด www-ssl → กลุ่ม `pg-ro` (`read,api,rest-api,test,reboot` ไม่มี write) + user `pg-web` (เข้าได้จาก `10.99.0.1` เท่านั้น) → `/ip cloud` ddns + back-to-home → firewall
- **firewall** (ย้ายขึ้นบนสุด เหนือ defconf): input จาก WireGuard รับแค่ `10.99.0.1` → 443 + ping · ที่เหลือจาก `wg-pg` และ `ether1` drop · accept `back-to-home-vpn` (ไม่มี interface = ข้าม) · forward จาก `10.99.0.1` → `.20:502` · `.10/.20:80,443` · ping `.10/.20` · ที่เหลือจาก WireGuard drop · LAN เปิดการเชื่อมต่อใหม่เข้า WireGuard ไม่ได้
- winbox/ssh ยังเปิด (ช่างใช้หน้างานผ่าน LAN) — ฝั่ง WAN/WireGuard ถูก firewall กัน
- **รันซ้ำได้**: ของมีชื่อ = เช็ก `[:len [find name=…]]` ก่อน add ไม่งั้น set · ของไม่มีชื่อ = ลบที่คอมเมนต์ขึ้นต้น `pg-mt` ก่อน add · ใบรับรองสร้างครั้งเดียว (fingerprint ไม่เปลี่ยน)
- ค่าที่ใส่ในสคริปต์ผ่านการตรวจตัวอักษรทั้งหมด (ชื่อ · endpoint · คีย์ · รหัส) กันการแทรกคำสั่ง · บรรทัดคำสั่งเป็น ASCII ล้วน (เทสต์บังคับ) ไทยอยู่ในบรรทัด `#` เท่านั้น
- **ยังไม่เคยรันกับ hEX จริง** — เทสต์ตรวจข้อความสคริปต์เท่านั้น รันไซต์แรกให้ดู log `verbose=yes` แล้วแก้ถ้ามีคำสั่งที่ RouterOS เวอร์ชันนั้นไม่รับ

## เฟส 2 (ยังไม่ทำ — แผนที่อนุมัติแล้ว)
- `tools/mt-agent/` รันบนเซิร์ฟเวอร์ WireGuard (systemd · node ไม่มี dependency) อ่าน `/rest/system/resource` `/rest/interface` `/rest/ip/address` + TCP `.10:80` `.20:502` → เขียน `mtStatus/{N}`
- pin ใบรับรองต่อไซต์ (fingerprint SHA-256 ครั้งแรกรอแอดมินยืนยัน · ไม่ตรง = ปฏิเสธ) ไม่ปิด TLS verify ทั้งหมด
- รีบูต/ดู log: เว็บ → API (แอดมิน) เขียนคิว `mtCmd/` พร้อมลายเซ็น HMAC (`MT_CMD_SECRET`) → agent ทำเฉพาะคำสั่งที่ลายเซ็นถูก
- ห้ามมีฟังก์ชันแก้ IP/firewall/WireGuard ผ่านเว็บ
## เฟส 3 (เผื่อไว้)
agent ตัวเดียวกันอ่าน PM2200 ที่ `10.10.N.20:502` → `mtMeter/{N}/…` สำหรับ billing
