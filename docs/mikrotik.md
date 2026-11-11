# ไซต์ MikroTik — VPN · สคริปต์ตั้งค่า · สถานะไซต์

เริ่ม 2026-11-11 · **เฟส 1 เสร็จ + ทดสอบกับ hEX จริงผ่าน (SITE01-Office บนโต๊ะ)** (ลงทะเบียนไซต์ + สร้างสคริปต์) · **เฟส 2 แดชบอร์ดสถานะ = เขียนเสร็จ 2026-11-11 รอติดตั้ง agent บน VPS + ทดสอบกับ hEX จริง** · เฟส 3 อ่านมิเตอร์ PM2200 = เผื่อโครงไว้

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
| `dashboard/mikrotik-guide.jsx` | **คู่มือสำหรับคนไม่เคยทำ** ในหน้าไซต์ MikroTik (ผู้ใช้ขอ 2026-11-11) — เลือกไซต์แล้วคำสั่ง/IP เติมเลขให้ · ssh root@<IP VPS> ขอจาก `{action:"info"}` (แอดมิน) · ขั้นตอนเปลี่ยน = แก้ที่ไฟล์นี้ · ส่วน SmartLogger/Waveshare ยังไม่ได้ลองเครื่องจริง (มีป้ายบอก) |
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
**ทางหลัก (2026-11-11 ผู้ใช้ตั้ง hEX เองที่ออฟฟิศแล้วส่งไปหน้างาน): ปุ่ม "คำสั่งตั้งค่า (บรรทัดเดียว)"** — เว็บออกโทเคนสุ่ม 256 บิต ใช้ครั้งเดียว 15 นาที (`api/_lib/mtstore.mjs` เก็บแค่ SHA-256 ใน `mtSecrets/fetch/<hash>`) → hEX วาง `/tool fetch url="…/api/mikrotik/rsc?t=…" check-certificate=yes-without-crl dst-path=pg-setup.rsc; /import …; /file remove pg-setup.rsc` · `api/mikrotik/rsc.mjs` ไม่มีล็อกอิน · โทเคนผิด/หมด/ใช้แล้ว = 404 ตอบเป็น `:error` · ตรวจ https ไม่ผ่าน (RouterOS ไม่มี CA) มีบรรทัดสำรอง `check-certificate=no` ใช้ที่ออฟฟิศเท่านั้น · **ลองจริงแล้วติด `failure: not allowed by device-mode`** — RouterOS 7.17+ ปิด `/tool fetch` เป็นค่าตั้งต้น ต้อง `/system device-mode update fetch=yes` แล้วยืนยันที่ตัวเครื่องภายใน 5 นาที (กด Reset สั้น ๆ หรือถอดปลั๊ก) ครั้งเดียวต่อเครื่อง — อยู่ในวิธีทำบนหน้าเว็บแล้ว · คำขอไม่ถึงเว็บ โทเคนจึงยังไม่ถูกใช้ · **✅ เปิด fetch แล้วรันคำสั่งบรรทัดเดียวผ่านบน hEX จริง (2026-11-11 21:33)** — รันซ้ำบนเครื่องที่ตั้งแล้ว fingerprint เดิม (ใบรับรองไม่ถูกสร้างใหม่ ตามที่ออกแบบ) · ใช้**บรรทัดหลัก `check-certificate=yes-without-crl` ผ่าน** = RouterOS 7.21.5 ตรวจ https ของ vercel.app ได้เอง ไม่ต้องใช้บรรทัดสำรอง · ดาวน์โหลด .rsc เป็นทางสำรองเมื่อ hEX ไม่มีเน็ต

**ในเว็บ (แอดมิน)** ตั้งค่า → ไซต์ MikroTik → เพิ่มไซต์ (N เสนอเลขว่างถัดไปให้) → "สร้างสคริปต์ .rsc" → ดาวน์โหลด `.rsc` + คัดลอก peer

**เซิร์ฟเวอร์** ก๊อปกล่อง "คำสั่งเพิ่ม peer บนเซิร์ฟเวอร์" (heredoc `sudo mt-peer add <<'EOF' … EOF`) วางใน SSH ทีเดียวจบ — ไม่ต้องกด Ctrl+D เอง (ผู้ใช้เคยกดก่อนวางจนว่าง แล้วหลุด SSH)

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
- **✅ รันผ่านทั้งสคริปต์บน hEX จริง RouterOS 7.21.5 (2026-11-11 SITE01-Office รอบที่ 4)** — ปัญหาที่เจอระหว่างทางด้านล่าง แก้ในตัวสร้างแล้ว (มีเทสต์กันถอย) · ทดสอบปลายทางจาก VPS ผ่าน: handshake · `ping 10.10.1.1` ~7 ms · `curl -sk https://10.10.1.1/rest/system/resource -u pg-web` ได้ JSON (board-name hEX · 7.21.5) = เฟส 2 ใช้ REST ผ่าน VPN ได้จริง
- **รันจริงครั้งแรก 2026-11-11 (SITE01-Office บนโต๊ะ):** ล้มที่ข้อ 4 "already have such address" — hEX มี `10.10.1.1/24` ป้ายดีฟอลต์ค้างบน bridge อยู่แล้ว → สคริปต์ลบ IP เดียวกัน (`dynamic=no`) และ dhcp network วงเดียวกันก่อน add · เพิ่มตัวกัน ether1 ได้ IP ในวง LAN ไซต์ = `:error` หยุดก่อนแก้ต่อ · รอบสองล้มข้อ 8 "CA not found" (RouterOS 7.21.5 เซ็นใบ tls-server ด้วยตัวเองไม่ได้) → สร้าง CA `pg-ca` แล้ว `sign pg-https ca=pg-ca` · ใบที่ค้างแบบไม่มี private key ลบก่อนสร้าง · รอบสามล้มข้อ 12 "cannot move builtin" (7.21 มีกฎ dynamic ของระบบบนสุด) → `move … destination=[:pick [/ip firewall filter find dynamic=no] 0]` แทน `destination=0` · สร้างกุญแจบน hEX ใช้ ~30 วิ–2 นาที/ใบ (ขึ้น progress อย่ากด Q)

## เฟส 2 — สถานะไซต์ · ดู log · รีบูต (เขียนเสร็จ 2026-11-11 · ยังไม่ได้ลองกับ VPS/hEX จริง)
```
mt-agent (VPS · systemd) ──ทุก 30 วิ POST /api/mikrotik/site?agent=1 (Bearer MT_AGENT_KEY)──▶ Vercel ──▶ mtStatus/{N} · mtCmd/{id}
    │ ทุก 60 วิ: wg show dump · ping .1/.10 · TCP .10:443(80) · TCP .20:502 · REST /system/resource /interface /ip/address
    └──https://10.10.N.1 (pin fingerprint) ผ่าน WireGuard
เว็บ (แอดมิน) ──/api/mikrotik/site {pin-fp | cmd | cmd-get}──▶ mtSites/{N}.fp · mtCmd/{id} (ลายเซ็น HMAC MT_CMD_SECRET)
```
| ไฟล์ | หน้าที่ |
|---|---|
| `tools/mt-agent/agent.mjs` | ตัว agent (node 18+ ไม่มี dependency) · `--once` = เช็กครั้งเดียวพิมพ์ผล (peek ไม่บันทึก ไม่หยิบคำสั่ง) · REST มีแค่ GET resource/interface/ip address/log + POST /system/reboot (เทสต์บังคับ) |
| `tools/mt-agent/install.sh` | ติดตั้ง/อัปเดตบน VPS: nodejs · `/opt/mt-agent/agent.mjs` · `/etc/mt-agent.env` (สุ่ม `MT_AGENT_KEY` `MT_CMD_SECRET` ครั้งแรก) · service `mt-agent` (DynamicUser + CAP_NET_ADMIN/NET_RAW เท่านั้น) · คำสั่ง `mt-agent-once` |
| `api/_lib/mtagent.mjs` (เรียกผ่าน `site.mjs?agent=1` — **Vercel ฟรีจำกัด 12 ฟังก์ชัน** แยกไฟล์ใน api/ แล้ว deploy ล้ม 2026-11-11) | ช่องของ agent: รับสถานะ/ผลคำสั่ง · ส่งรายชื่อไซต์ + รหัส pg-web (**เฉพาะไซต์ที่ยืนยัน fp แล้ว**) + คำสั่งที่รอ (ส่งครั้งเดียว state pending→sent) · คำสั่งค้าง >10 นาที = expired · จบแล้ว >1 วัน = เก็บกวาด |
| `dashboard/mikrotik-status.jsx` | ตารางสถานะทุกไซต์บนสุดของหน้า + ส่วนสดในการ์ดไซต์ (ยืนยันใบรับรอง · ดู log · รีบูต ผ่าน `askConfirm`) |

- **pin ใบรับรอง**: agent ต่อ TLS แล้วเทียบ fingerprint SHA-256 ของใบ leaf *ก่อนส่งอะไร* · ไซต์ยังไม่ยืนยัน = อ่านแค่ fp มารายงาน (`mtStatus/N/tls/fp`) ไม่ล็อกอิน · แอดมินเทียบกับบรรทัด `cert fingerprint` ท้ายสคริปต์ (หรือ `/certificate print detail where name=pg-https`) แล้วกดยืนยัน → `mtSites/N.fp` · ไม่ตรง = สถานะ "ใบรับรองไม่ตรง" ไม่คุยต่อ · SITE01-Office ที่ทดสอบ fp ขึ้นต้น `987d738d`
- **คำสั่ง**: มีแค่ `reboot` `log` (`MT_CMD_TYPES`) · ลายเซ็น HMAC-SHA256 ของ `id|n|type|ts` · agent ตรวจลายเซ็น + อายุ ≤10 นาที + ไม่เคยทำ (จำ id ใน `/var/lib/mt-agent/done.json`) · กดซ้ำระหว่างรอ = ได้คำสั่งเดิม · ต้องยืนยัน fp ก่อนถึงสั่งได้
- สถานะบนเว็บ: handshake ≤3 นาที = VPN ติด · agent เงียบ >5 นาที = ข้อมูลเก่า
- Vercel ถูกเรียก ~2 ครั้ง/นาที (~86k/เดือน) — ปรับรอบได้ที่ `POLL_S` ใน agent.mjs ฝั่งเว็บ
- **✅ ติดตั้งบน VPS จริงแล้ว (2026-11-11 22:44)**: node 18.19.1 จาก apt Ubuntu 24.04 · `wg show` ใต้ DynamicUser + CAP_NET_ADMIN ได้ handshake · ping .1 ~7 ms · Modbus .20 ตอบ · agent เห็น fp SITE01 `987d738d…6802a` ตรงกับตอนตั้งค่า · ติดตั้งครั้งแรกล้มเพราะ `node --check` ไฟล์ `.new` (node 18 ไม่ยอม) แก้เป็น `agent.new.mjs` แล้ว
- **✅ ยืนยัน fp SITE01 บนเว็บแล้ว → REST ผ่าน** (board hEX · 7.21.5 long-term · RAM 512 MB) · กฎ mtStatus/mtCmd วางแล้ว
- **ยังไม่ได้ลองจริง**: REST หลังยืนยัน fp (✅ แล้ว) · `POST /rest/system/reboot` · `/rest/log` ของ 7.21.5 — ลองแล้วบันทึกผลที่นี่
- ห้ามมีฟังก์ชันแก้ IP/firewall/WireGuard ผ่านเว็บ (ผู้ใช้กำหนด) — ทั้ง API และ agent ไม่มีทางทำได้

### env เพิ่ม (Vercel · Production) — ค่ามาจากท้าย install.sh บน VPS
| ชื่อ | ค่า |
|---|---|
| `MT_AGENT_KEY` | กุญแจของ agent (≥32 ตัว) · ต้องตรงกับ `/etc/mt-agent.env` |
| `MT_CMD_SECRET` | กุญแจลายเซ็นคำสั่ง (≥32 ตัว) · ต้องตรงกับ `/etc/mt-agent.env` |

### กฎฐานข้อมูลเพิ่ม (ผู้ใช้วางเอง)
```json
"mtStatus": { ".read": "auth != null", ".write": false },
"mtCmd":    { ".read": false, ".write": false }
```
## มิเตอร์ LEOS IPM310 (IP Power Meter · ผู้ใช้ทดสอบ 2026-11-11 แทน Waveshare+PM2200)
มี Modbus TCP ในตัว (พอร์ต 502 · ต่อพร้อมกันได้ 6) + HTTP + FTP → ตั้งเป็น `10.10.N.20` ได้เลย (firewall เปิด 502/80/443 ให้ .20 อยู่แล้ว)
- ค่าตั้งต้นโรงงาน: IP `192.168.0.244` /24 · gateway 192.168.0.1 · DHCP = no · หน้าเว็บ user `admin`
- ตั้ง IP: หน้าเว็บ TAB Network Configuration → แก้ → TAB System configuration → SAVE & REBOOT · หรือหน้าเครื่องเข้า Code 7000 (Ethernet port)
- คู่มือ `IPM310_IPmeter_REV202403.pdf` เป็นฟอนต์ CID ไม่มี ToUnicode → ถอดด้วย glyph+29 = ASCII · ตัวเลข glyph 0x158–0x161 = 0–9 (สคริปต์ชั่วคราวไม่ได้เก็บ)
- **ตาราง register (FC04 Read Input Register · ที่อยู่แบบนับจาก 0 · PLC = 30001+ที่อยู่)**
  - Float 32 บิต 2 register: 200 V L1-N · 202 V L2-N · 204 V L3-N · 206/208/210 V L-L · 212/214/216 I L1-3 · 218 I sum · 220 I N · 222 I leak · 224/226/228 kW L1-3 · **230 kW รวม** · 232–238 kvar · 240–246 kVA (246 รวม)
  - Signed 16 บิต: 248–251 PF L1/L2/L3/รวม **×0.001** (คู่มือเขียน ×0.01 ผิด — ดิบ 1000 = หน้าจอ 1 ผู้ใช้เทียบ 2026-11-11) · 252–254 Hz ×0.1 · 255–257 มุม I-U ×0.1° · 258 %I load ×0.01 · 259 %P load ×0.01 · 330–335 มุมระหว่างเฟส ×0.1°
  - Float พลังงาน (คู่มือเขียน PLC address ผิดซ้ำตารางแรก ใช้ Modbus address): 261 kW demand block · 263 slide · 265/267 kvar demand · **269 kWh Net · 271 kWh Import · 273 kWh Export** · 275 kWh fundamental · 277–283 kvarh · 285 kVAh · 287 run hour · 289 run hour เดือนนี้ · 291 kWh เดือนนี้ · 293 On-peak · 295 Off-peak · 297 Holiday
  - Coil FC01/FC05: 0–1 relay 1–2 (เขียนได้ — **เว็บห้ามสั่ง**) · 16–25 สถานะ/แจ้งเตือน
- **ลำดับ word ของ float = แบบปกติของ mbpoll (word ต่ำมาก่อน · ไม่ใส่ `-B`)** — ผู้ใช้ทดสอบจริง 2026-11-11 ผ่าน VPN: `mbpoll -m tcp -a 1 -t 3:float -r 213 -c 3 -1 10.10.1.20` ได้กระแสตรงหน้าจอ · unit id 1 · ชุดทดสอบไม่ได้ต่อแรงดัน ค่า V จึงเป็น 0

## เฟส 3 — มิเตอร์ · หน้า MikroTik Monitoring · บิลค่าไฟโซลาร์รายเดือน (เขียนเสร็จ 2026-11-11 · ผู้ใช้สั่ง "เก็บค่าที่จำเป็น ทำหน้า Monitoring ทำระบบบิลรายเดือน")
- **agent v2** อ่านมิเตอร์ที่ `10.10.N.20:502` ทุก 1 นาที (Modbus TCP อ่านอย่างเดียว FC03/FC04 — ไม่มีโค้ดเขียน · เทสต์บังคับ) โปรไฟล์ต่อรุ่นใน `METER_PROFILES` (`tools/mt-agent/agent.mjs`): `leos-ipm310` (FC04 · word ต่ำมาก่อน · ✅ ตรงกับที่ทดสอบ mbpoll) · `pm2200` (FC03 · word สูงมาก่อน · ⚠ ตามตารางผู้ผลิต ยังไม่ได้ลอง) · `none` — รุ่น/unit id ตั้งต่อไซต์ `mtSites/N.meter_model` `meter_unit` (ไม่ตั้ง = leos-ipm310 unit 1) · เพิ่มรุ่น = เพิ่มโปรไฟล์ + `MT_METER_MODELS` ใน api/_lib/mikrotik.mjs (เทสต์เทียบให้)
- ค่าที่เก็บ (`METER_KEEP`): kW รวม · kWh Import/Export/Net · V/I 3 เฟส · PF · Hz (สด: `mtStatus/N/meter/v` + kW ต่อเฟส)
- **`mtMeter/{N}/h/{YYYYMMDD}/{HHMM}`** ราย 5 นาที เวลาไทย (agent ติด `status.snap` เมื่อขึ้นช่อง 5 นาทีใหม่ · ผู้ใช้ขอเปลี่ยนจาก 15 เป็น 5 นาที 2026-11-11 ข้อมูลช่วงแรกจึงเป็น 15 นาที · แก้ต้องเปลี่ยนคู่ `MT_SNAP_MIN` ใน mtagent.mjs กับ `300e3` ใน agent.mjs · เว็บคิดช่องจากนาฬิกาเซิร์ฟเวอร์ `thSlot`) · **`mtMeter/{N}/d/{YYYYMMDD}`** `first` (ค่าแรกของวัน ไม่ถูกทับ) `last` `kw_max`
- **หน้า MikroTik Monitoring** (เมนู งานติดตั้ง → แท็บ MikroTik · `dashboard/mikrotik-mon.jsx` `MtMonView` · แอดมิน): การ์ดทุกไซต์ (kW ตอนนี้ · kWh วันนี้ = last−first ของวัน · V/A) → รายละเอียด: กราฟ kW ราย 5 นาทีเลือกวันได้ · kWh รายวันทั้งเดือน · ตารางค่าสด 3 เฟส · ตั้งรุ่นมิเตอร์/unit id (แอดมิน · `meter-cfg`) · กราฟใช้ `window.FsTrendChart` ของ FusionSolar
- **บิลค่าไฟโซลาร์** (แท็บ "บิลรายเดือน" ในหน้า MikroTik เดียวกัน — ผู้ใช้ 2026-11-11 "ให้อยู่หน้านี้หน้าเดียวเลย" · `MtBillView`): เลือกเดือน (ค่าเริ่ม = เดือนก่อน) · เลขเริ่ม = `first` ของวันแรกที่มีข้อมูลในเดือน · เลขสิ้นสุด = `first` ของวันที่ 1 เดือนถัดไป (ยังไม่มี = `last` ล่าสุด + ป้ายเตือน) · พิมพ์ทับได้ (เก็บที่มา "พิมพ์เอง") · ตั้งค่าบิลต่อไซต์ (`bill-cfg`: ชื่อลูกค้า · บาท/kWh · ช่อง kwh_imp/exp/net) · **บันทึกบิล** → `mtBills/N/YYYYMM` (เซิร์ฟเวอร์คิด kWh/เงินใหม่เอง `billCalc`) · **สร้างร่างใบแจ้งหนี้** → เขียน `invoices/<id>` ด้วย `ivBlank` ของระบบใบแจ้งหนี้เดิม (ผู้ออกรายแรก · 1 รายการ qty = kWh หน่วย kWh ราคา = บาท/kWh) แล้วผูก `invoice_id` ในบิล → ไปออกเลข/พิมพ์ที่หน้าใบแจ้งหนี้ (VAT/หัก ณ ที่จ่ายคิดที่นั่น)
- ยังไม่มี: อัตรา TOU (On/Off-peak) · ส่วนลดจากค่าไฟการไฟฟ้า — ทำเพิ่มได้จากข้อมูลราย 5 นาที
- **ต้องอัปเดต agent บน VPS** (รันคำสั่งติดตั้งข้อ 10 ซ้ำ) ถึงจะเริ่มเก็บค่า
- **✅ agent v2 บน VPS จริง (2026-11-11 23:06)**: อ่าน LEOS SITE01 ได้ 46 ms · กระแส 2.8/3.9/5.7 A · kWh Import 20456.5 · เก็บ h/d ช่องแรก 23:00 แล้ว · กฎ mtMeter/mtBills วางแล้ว · ชุดทดสอบไม่ต่อแรงดัน V/Hz/kW = 0 · PF เดิมอ่านได้ 10 → ผู้ใช้เทียบหน้าจอมิเตอร์ = 1 แก้สเกลเป็น ×0.001 แล้ว (agent v4 · ค่า pf ใน mtMeter/1/h ช่วงแรกยังเป็น 10) · kWh Export −969.7 ผู้ใช้ว่าเป็นค่าเก่าค้างในมิเตอร์ (ปกติ)

### กฎฐานข้อมูลเพิ่ม (ผู้ใช้วางเอง)
```json
"mtMeter": { ".read": "auth != null", ".write": false },
"mtBills": { ".read": "auth != null", ".write": false }
```
