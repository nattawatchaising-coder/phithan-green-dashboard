/* ============================================================
   ไซต์ MikroTik — ตัวสร้างสคริปต์ RouterOS (.rsc) · คอนฟิก peer ฝั่งเซิร์ฟเวอร์ · คีย์ WireGuard · เข้ารหัส secret
   อ่าน docs/mikrotik.md ก่อนแก้

   ⚠ ไม่มี dependency (เหมือน line.mjs) — ใช้แค่ node:crypto
   ⚠ repo เป็น public: ห้ามมีค่าลับในไฟล์นี้ ทุกค่าอ่านจาก env (MT_*) หรือส่งเข้ามาเป็นอาร์กิวเมนต์

   แผน IP (ผู้ใช้กำหนด 2026-11-11)
     ไซต์ N: LAN 10.10.N.0/24 · hEX .1 · SmartLogger .10 · Waveshare .20 · DHCP .100–.200
     WireGuard 10.99.0.0/24 · เซิร์ฟเวอร์ 10.99.0.1:51820 · ไซต์ N = 10.99.0.(10+N)
   ============================================================ */

import crypto from "node:crypto";

/* ---------- ค่าคงที่ของแผน ---------- */
export const MT = {
  N_MIN: 1,
  N_MAX: 244,               // 10+N ต้องไม่เกิน 254
  WG_NET: "10.99.0",
  WG_SERVER: "10.99.0.1",
  WG_PORT: 51820,
  WG_IF: "wg-pg",           // ชื่อ interface WireGuard บน hEX
  BRIDGE: "bridge",         // ชื่อ bridge ของค่าตั้งต้น hEX (ไม่มีก็สร้าง)
  WAN: "ether1",
  LAN_PORTS: ["ether2", "ether3", "ether4", "ether5"],
  GROUP: "pg-ro",           // กลุ่มสิทธิ์อ่านอย่างเดียว + รีบูต
  USER: "pg-web",           // user ที่เว็บ/agent ใช้เรียก REST
  CERT: "pg-https",
  CA: "pg-ca",              // CA ของเครื่องที่ใช้เซ็น pg-https
  TAG: "pg-mt",             // ทุกอย่างที่สคริปต์สร้างมีคอมเมนต์ขึ้นต้นด้วยคำนี้ — ไว้หา/ลบตอนรันซ้ำ
  KEEPALIVE: 25,
  NAME_RE: /^[A-Za-z0-9][A-Za-z0-9-]{0,23}$/,
};

/* ---------- env (ฝั่งเซิร์ฟเวอร์เท่านั้น) ---------- */
export const MT_ENV = {
  endpoint: () => (process.env.MT_WG_ENDPOINT || "").trim(),       // host หรือ host:port ของเซิร์ฟเวอร์ WireGuard
  serverPub: () => (process.env.MT_WG_SERVER_PUBKEY || "").trim(), // public key ของเซิร์ฟเวอร์ (private key อยู่บนเซิร์ฟเวอร์อย่างเดียว)
  encKey: () => (process.env.MT_ENC_KEY || "").trim(),             // กุญแจเข้ารหัส 32 ไบต์ (base64)
  /* เฟส 2 — สร้างบน VPS โดย tools/mt-agent/install.sh แล้วก๊อปมาใส่ Vercel */
  agentKey: () => (process.env.MT_AGENT_KEY || "").trim(),         // agent ใช้เรียก /api/mikrotik/site?agent=1
  cmdSecret: () => (process.env.MT_CMD_SECRET || "").trim(),       // ลายเซ็นคำสั่งรีบูต/ดู log (agent ตรวจซ้ำ)
};
export function mtAgentMissingEnv() {
  const miss = [];
  if (MT_ENV.agentKey().length < 32) miss.push("MT_AGENT_KEY");
  if (MT_ENV.cmdSecret().length < 32) miss.push("MT_CMD_SECRET");
  if (!encKeyBuf(MT_ENV.encKey())) miss.push("MT_ENC_KEY");
  return miss;
}

/* ---------- เฟส 2: คำสั่งที่เว็บสั่ง agent ได้ (อ่านอย่างเดียว + รีบูต — ห้ามมีคำสั่งแก้ IP/firewall/WireGuard) ---------- */
export const MT_CMD_TYPES = ["reboot", "log"];
export const MT_CMD_TTL_MS = 10 * 60e3;   // คำสั่งค้างเกิน 10 นาที = ทิ้ง (agent ก็ปฏิเสธเองด้วย)
/* ข้อความที่เซ็น — tools/mt-agent/agent.mjs มีสูตรเดียวกัน (เทสต์เทียบให้) */
export const cmdPayload = (c) => [c.id, c.n, c.type, c.ts].join("|");
export function cmdSig(c, secret) {
  return crypto.createHmac("sha256", secret || MT_ENV.cmdSecret()).update(cmdPayload(c)).digest("base64url");
}
/* ---------- เฟส 3: มิเตอร์ · บิลรายเดือน ---------- */
export const MT_METER_MODELS = ["leos-ipm310", "pm2200", "none"];   // ต้องตรงกับ METER_PROFILES ใน tools/mt-agent/agent.mjs
export const MT_BILL_REGS = ["kwh_imp", "kwh_exp", "kwh_net"];
const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
/* คิดบิลแบบใบแจ้งค่าไฟการไฟฟ้า: kWh = เลขครั้งนี้ − เลขครั้งก่อน · ค่าไฟ = kWh × ราคา · VAT 7% (ปิดได้ต่อไซต์) · รวม
   start_at/end_at = เวลาที่จดเลข (ข้อความจากเว็บ เช่น "2026-11-01 00:00") */
export function billCalc(b) {
  const month = String((b && b.month) || "");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return { error: "เดือนต้องเป็น YYYY-MM" };
  const start = Number(b.start), end = Number(b.end), rate = Number(b.rate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0) return { error: "เลขมิเตอร์ไม่ถูกต้อง" };
  if (end < start) return { error: "เลขสิ้นสุดน้อยกว่าเลขเริ่ม (มิเตอร์ถูกรีเซ็ต? ใส่เลขเอง)" };
  if (!(rate >= 0 && rate <= 100)) return { error: "ราคาต่อหน่วยต้องเป็น 0–100 บาท" };
  if (!MT_BILL_REGS.includes(b.reg)) return { error: "ช่องคิดเงินไม่ถูกต้อง" };
  const kwh = r3(end - start);
  const src = (x) => String(x || "").slice(0, 80);
  const amount = r2(kwh * rate), vat_rate = b.vat === false ? 0 : 7, vat = r2(amount * vat_rate / 100);
  const at = (x) => (/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(String(x || "")) ? String(x) : "");
  return { month, start: r3(start), end: r3(end), kwh, rate, amount, vat_rate, vat, total: r2(amount + vat), reg: b.reg,
    start_src: src(b.start_src), end_src: src(b.end_src), start_at: at(b.start_at), end_at: at(b.end_at) };
}
/* fingerprint SHA-256 ของใบรับรอง → hex ตัวเล็กไม่มี : (แบบที่ RouterOS พิมพ์) · ผิดรูป = "" */
export function normFp(s) {
  const h = String(s || "").replace(/[:\s]/g, "").toLowerCase();
  return /^[0-9a-f]{64}$/.test(h) ? h : "";
}
export function mtMissingEnv() {
  const miss = [];
  if (!MT_ENV.endpoint()) miss.push("MT_WG_ENDPOINT");
  else if (!parseEndpoint(MT_ENV.endpoint())) miss.push("MT_WG_ENDPOINT (รูปแบบผิด)");
  if (!MT_ENV.serverPub()) miss.push("MT_WG_SERVER_PUBKEY");
  else if (!isWgKey(MT_ENV.serverPub())) miss.push("MT_WG_SERVER_PUBKEY (ไม่ใช่คีย์ 32 ไบต์)");
  if (!MT_ENV.encKey()) miss.push("MT_ENC_KEY");
  else if (!encKeyBuf(MT_ENV.encKey())) miss.push("MT_ENC_KEY (ต้องเป็น base64 ของ 32 ไบต์)");
  return miss;
}

/* ---------- แผน IP ของไซต์ N ---------- */
export function validN(n) {
  return Number.isInteger(n) && n >= MT.N_MIN && n <= MT.N_MAX;
}
export function sitePlan(n) {
  if (!validN(n)) throw new Error("เลขไซต์ต้องเป็นจำนวนเต็ม " + MT.N_MIN + "–" + MT.N_MAX);
  const lan = "10.10." + n;
  return {
    n,
    lanNet: lan + ".0/24",
    router: lan + ".1",
    smartlogger: lan + ".10",
    gateway: lan + ".20",        // ตัวแปลง Waveshare (Modbus TCP 502)
    poolFrom: lan + ".100",
    poolTo: lan + ".200",
    wgIp: MT.WG_NET + "." + (10 + n),
  };
}
export const pad2 = (n) => String(n).padStart(2, "0");
export const identityOf = (n, name) => "SITE" + pad2(n) + "-" + name;
export function validName(name) {
  return typeof name === "string" && MT.NAME_RE.test(name);
}

/* "vpn.example.com:51820" | "1.2.3.4" | "[::1]:51820" → {host, port} · ผิดรูป = null
   อนุญาตเฉพาะตัวอักษรที่ใส่ในสคริปต์ได้ปลอดภัย (กันการแทรกคำสั่ง RouterOS ผ่าน env) */
export function parseEndpoint(s) {
  const m = /^(?:\[([0-9a-fA-F:]+)\]|([A-Za-z0-9.-]+))(?::(\d{1,5}))?$/.exec(String(s || "").trim());
  if (!m) return null;
  const port = m[3] ? Number(m[3]) : MT.WG_PORT;
  if (!(port >= 1 && port <= 65535)) return null;
  return { host: m[1] || m[2], port };
}

/* ================================================================
   คีย์ WireGuard (Curve25519) — base64 มาตรฐาน 44 ตัวอักษร แบบเดียวกับ `wg genkey`
   ================================================================ */
const b64u2b64 = (s) => Buffer.from(s, "base64url").toString("base64");
export function isWgKey(s) {
  return typeof s === "string" && /^[A-Za-z0-9+/]{43}=$/.test(s) && Buffer.from(s, "base64").length === 32;
}
export function wgKeypair() {
  const { privateKey } = crypto.generateKeyPairSync("x25519");
  const jwk = privateKey.export({ format: "jwk" });
  return { privateKey: b64u2b64(jwk.d), publicKey: b64u2b64(jwk.x) };
}
/* public key จาก private key (ใช้ในเทสต์ + ตรวจคีย์ที่ถอดรหัสมาว่าเป็นคู่กันจริง) */
const PKCS8_X25519 = Buffer.from("302e020100300506032b656e04220420", "hex");
export function wgPublicOf(privB64) {
  const der = Buffer.concat([PKCS8_X25519, Buffer.from(privB64, "base64")]);
  const key = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  return b64u2b64(crypto.createPublicKey(key).export({ format: "jwk" }).x);
}

/* ================================================================
   เข้ารหัส secret (AES-256-GCM) — เก็บใน mtSecrets/{N} รูป "v1.<iv>.<tag>.<ข้อมูล>" (base64url)
   aad = ชื่อช่อง+เลขไซต์ → ย้าย ciphertext ไปใส่ไซต์อื่น/ช่องอื่นแล้วถอดไม่ได้
   ================================================================ */
function encKeyBuf(k) {
  try { const b = Buffer.from(String(k || ""), "base64"); return b.length === 32 ? b : null; } catch (e) { return null; }
}
export function seal(plain, aad, keyB64) {
  const key = encKeyBuf(keyB64 === undefined ? MT_ENV.encKey() : keyB64);
  if (!key) throw new Error("MT_ENC_KEY ไม่ถูกต้อง");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  c.setAAD(Buffer.from(String(aad)));
  const ct = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}
export function unseal(box, aad, keyB64) {
  const key = encKeyBuf(keyB64 === undefined ? MT_ENV.encKey() : keyB64);
  if (!key) throw new Error("MT_ENC_KEY ไม่ถูกต้อง");
  const p = String(box || "").split(".");
  if (p.length !== 4 || p[0] !== "v1") throw new Error("ข้อมูลเข้ารหัสผิดรูปแบบ");
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(p[1], "base64url"));
  d.setAAD(Buffer.from(String(aad)));
  d.setAuthTag(Buffer.from(p[2], "base64url"));
  return Buffer.concat([d.update(Buffer.from(p[3], "base64url")), d.final()]).toString("utf8");
}

/* รหัสผ่าน user ของเว็บ — ตัวอักษร/ตัวเลขล้วน (ไม่มี " $ \ ? ที่ต้อง escape ในสคริปต์ RouterOS) */
export function randomPassword(len = 24) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const out = [];
  while (out.length < len) {
    for (const b of crypto.randomBytes(len * 2)) {
      if (b < 256 - (256 % abc.length) && out.length < len) out.push(abc[b % abc.length]);
    }
  }
  return out.join("");
}

/* ================================================================
   สคริปต์ RouterOS v7 (.rsc)
   หลักรันซ้ำได้: ของที่มีชื่อ = "มีแล้ว set / ไม่มี add" · ของที่ไม่มีชื่อ (IP, กฎ firewall, NAT, peer)
   = ลบของเดิมที่คอมเมนต์ขึ้นต้น pg-mt ก่อนแล้วเพิ่มใหม่ — ไม่แตะของที่สคริปต์ไม่ได้สร้าง
   คอมเมนต์ในตัวคอนฟิก (comment=) เป็นอังกฤษล้วน เพราะ WinBox แสดงไทยไม่ได้ · คำอธิบายไทยอยู่ในบรรทัด #
   ================================================================ */
function need(cond, msg) { if (!cond) throw new Error(msg); }
const q = (s) => '"' + String(s) + '"';   // ค่าที่ส่งเข้ามาผ่านการตรวจตัวอักษรแล้วทั้งหมด

export function buildRsc(o) {
  const n = o.n;
  const P = sitePlan(n);
  need(validName(o.name), "ชื่อไซต์ใช้ได้แค่ A-Z a-z 0-9 และ - (ไม่เกิน 24 ตัว)");
  need(isWgKey(o.wgPrivateKey), "private key ของไซต์ผิดรูปแบบ");
  need(isWgKey(o.serverPublicKey), "public key ของเซิร์ฟเวอร์ผิดรูปแบบ");
  const ep = parseEndpoint(o.endpoint);
  need(ep, "endpoint ผิดรูปแบบ");
  need(/^[A-Za-z0-9]{16,64}$/.test(o.webPassword || ""), "รหัสผ่าน user เว็บผิดรูปแบบ");
  const T = MT.TAG, WG = MT.WG_IF, BR = MT.BRIDGE, WAN = MT.WAN;
  const ident = identityOf(n, o.name);
  const S = MT.WG_SERVER;
  const TOP = "[:pick [/ip firewall filter find dynamic=no] 0]";   // กฎแรกที่ย้ายได้

  /* กฎ firewall เรียงตามลำดับที่ต้องการ — เพิ่มไว้ท้ายก่อน แล้วย้ายขึ้นบนสุดทีละข้อจากข้อท้าย (ได้ลำดับเดิม)
     ต้องอยู่เหนือกฎ defconf เพราะ defconf มี "drop all not coming from LAN" ซึ่งจะตัด WireGuard ทิ้ง */
  const input = [
    ["accept", 'connection-state=established,related,untracked', "established"],
    ["drop", "connection-state=invalid", "invalid"],
    ["accept", `in-interface=${WG} src-address=${S} protocol=tcp dst-port=443`, "wg server https"],
    ["accept", `in-interface=${WG} src-address=${S} protocol=icmp`, "wg server ping"],
    ["drop", `in-interface=${WG}`, "wg drop rest"],
    ["drop", `in-interface=${WAN}`, "wan drop all"],
  ];
  const forward = [
    ["accept", "connection-state=established,related,untracked", "established"],
    ["drop", "connection-state=invalid", "invalid"],
    ["accept", `in-interface=${WG} src-address=${S} dst-address=${P.gateway} protocol=tcp dst-port=502`, "modbus to gateway"],
    ["accept", `in-interface=${WG} src-address=${S} dst-address=${P.smartlogger} protocol=tcp dst-port=80,443`, "web to smartlogger"],
    ["accept", `in-interface=${WG} src-address=${S} dst-address=${P.gateway} protocol=tcp dst-port=80,443`, "web to gateway"],
    /* dst-address รับได้ทีละ IP (ใส่ลิสต์คั่นจุลภาคไม่ได้) จึงแยกสองข้อ */
    ["accept", `in-interface=${WG} src-address=${S} dst-address=${P.smartlogger} protocol=icmp`, "ping smartlogger"],
    ["accept", `in-interface=${WG} src-address=${S} dst-address=${P.gateway} protocol=icmp`, "ping gateway"],
    ["drop", `in-interface=${WG}`, "wg drop rest"],
    ["drop", `out-interface=${WG}`, "lan to wg drop"],
  ];
  const rules = (chain, list, tag) => {
    const out = [];
    list.forEach((r, i) => out.push(`add chain=${chain} action=${r[0]} ${r[1]} comment=${q(T + " " + tag + pad2(i + 1) + " " + r[2])}`));
    /* destination=0 ใช้ไม่ได้: 7.21 มีกฎ dynamic ของระบบอยู่บนสุด ("cannot move builtin" เจอจริง 2026-11-11)
       → ย้ายไปเหนือกฎแรกที่ไม่ใช่ dynamic ซึ่งหลังย้ายข้อแรกไปแล้วก็คือข้อที่เพิ่งย้าย ลำดับจึงเรียงถูก */
    for (let i = list.length; i >= 1; i--) out.push(`move [find comment~${q("^" + T + " " + tag + pad2(i) + " ")}] destination=${TOP}`);
    return out;
  };

  const L = [
    `# ===================================================================`,
    `# ไซต์ ${pad2(n)} · ${ident}  (สร้างจากเว็บ flash+solar — ห้ามแก้มือ ให้สร้างใหม่จากเว็บ)`,
    `# LAN ${P.lanNet} · hEX ${P.router} · SmartLogger ${P.smartlogger} · Waveshare ${P.gateway}`,
    `# WireGuard ${P.wgIp} → เซิร์ฟเวอร์ ${S} (${ep.host}:${ep.port})`,
    `# ต้องการ RouterOS v7.12 ขึ้นไป (Back To Home) · รันซ้ำได้ ไม่สร้างของซ้ำ`,
    `# วิธีรัน: ต่อ WinBox ด้วย MAC address (ไม่ใช่ IP — IP ฝั่ง LAN จะเปลี่ยนกลางทาง)`,
    `#   ลากไฟล์ใส่ Files แล้วพิมพ์  /import file-name=${ident}.rsc verbose=yes`,
    `# ⚠ ไฟล์นี้มีกุญแจลับของไซต์ — ใช้เสร็จลบออกจาก Files ของเราเตอร์และเครื่องตัวเอง`,
    `# ===================================================================`,
    ``,
    `# ---------- 1) ชื่อเราเตอร์ + เวลา ----------`,
    `/system identity set name=${q(ident)}`,
    `/system clock set time-zone-name=Asia/Bangkok`,
    ``,
    `# ---------- 2) bridge ฝั่ง LAN (ether2-5) ----------`,
    `# ใช้ bridge ของค่าตั้งต้นถ้ามี ไม่มีก็สร้าง · ย้ายพอร์ต LAN มาอยู่ใน bridge นี้`,
    `/interface bridge`,
    `:if ([:len [find name=${q(BR)}]] = 0) do={ add name=${q(BR)} comment=${q(T + " lan bridge")} }`,
    `/interface bridge port`,
    `:foreach p in={${MT.LAN_PORTS.map(q).join(";")}} do={`,
    `  :if ([:len [find interface=$p]] = 0) do={ add bridge=${q(BR)} interface=$p comment=${q(T)} } else={ set [find interface=$p] bridge=${q(BR)} }`,
    `}`,
    ``,
    `# ---------- 3) ฝั่ง WAN: ether1 รับ IP จาก DHCP ของโรงงาน ----------`,
    `/ip dhcp-client`,
    `:if ([:len [find interface=${WAN}]] = 0) do={ add interface=${WAN} disabled=no comment=${q(T + " wan")} } else={ set [find interface=${WAN}] disabled=no }`,
    `# ถ้าเน็ตโรงงาน (ether1) ใช้วงเดียวกับ LAN ไซต์ ${P.lanNet} = เส้นทางชนกัน ใช้ไม่ได้ — หยุดก่อนแก้อะไรต่อ (ใช้เลขไซต์อื่น)`,
    `:foreach a in=[/ip address find interface=${WAN}] do={ :local p [/ip address get $a address]; :local ip [:toip [:pick $p 0 [:find $p "/"]]]; :if ($ip in ${P.lanNet}) do={ :error ("STOP: ether1 " . $p . " overlaps site LAN ${P.lanNet} - pick another site number") } }`,
    ``,
    `# ---------- 4) IP ฝั่ง LAN ----------`,
    `# ลบ IP เดิมที่สคริปต์เคยใส่ + IP ค่าตั้งต้น 192.168.88.1 แล้วใส่ ${P.router}/24`,
    `/ip address`,
    `remove [find comment~${q("^" + T + " lan")}]`,
    `remove [find address="192.168.88.1/24"]`,
    `# IP เดียวกันที่ค้างอยู่ใน interface อื่น (รันครั้งก่อนไม่จบ / ตั้งมือ) — ไม่ลบตัวนี้ add จะล้ม "already have such address" (เจอจริง 2026-11-11)`,
    `remove [find address="${P.router}/24" dynamic=no]`,
    `add address=${P.router}/24 interface=${q(BR)} comment=${q(T + " lan")}`,
    ``,
    `# ---------- 5) DHCP แจก IP ในวง LAN (${P.poolFrom}-${P.poolTo}) ----------`,
    `# SmartLogger (.10) และ Waveshare (.20) ตั้ง IP คงที่ที่ตัวอุปกรณ์ · gateway = ${P.router}`,
    `/ip pool`,
    `:if ([:len [find name="pg-pool"]] = 0) do={ add name="pg-pool" ranges=${P.poolFrom}-${P.poolTo} comment=${q(T)} } else={ set [find name="pg-pool"] ranges=${P.poolFrom}-${P.poolTo} }`,
    `/ip dhcp-server`,
    `# DHCP ค่าตั้งต้น (defconf) ชนกับตัวใหม่บน bridge เดียวกัน — ลบทิ้ง`,
    `remove [find interface=${q(BR)} name!="pg-dhcp"]`,
    `:if ([:len [find name="pg-dhcp"]] = 0) do={ add name="pg-dhcp" interface=${q(BR)} address-pool="pg-pool" lease-time=1d disabled=no comment=${q(T)} } else={ set [find name="pg-dhcp"] interface=${q(BR)} address-pool="pg-pool" disabled=no }`,
    `/ip dhcp-server network`,
    `remove [find comment~${q("^" + T)}]`,
    `remove [find address="192.168.88.0/24"]`,
    `remove [find address="${P.lanNet}"]`,
    `add address=${P.lanNet} gateway=${P.router} dns-server=${P.router} comment=${q(T)}`,
    `/ip dns set allow-remote-requests=yes`,
    ``,
    `# ---------- 6) NAT: เครื่องใน LAN ออกเน็ตผ่าน ether1 ----------`,
    `/ip firewall nat`,
    `remove [find comment~${q("^" + T)}]`,
    `add chain=srcnat action=masquerade out-interface=${WAN} comment=${q(T + " masquerade")}`,
    ``,
    `# ---------- 7) WireGuard: hEX เป็นฝ่ายต่อเข้าเซิร์ฟเวอร์ (โรงงานไม่มี public IP) ----------`,
    `/interface wireguard`,
    `:if ([:len [find name=${q(WG)}]] = 0) do={ add name=${q(WG)} listen-port=13231 private-key=${q(o.wgPrivateKey)} comment=${q(T)} } else={ set [find name=${q(WG)}] private-key=${q(o.wgPrivateKey)} }`,
    `/interface wireguard peers`,
    `remove [find interface=${q(WG)}]`,
    `add interface=${q(WG)} public-key=${q(o.serverPublicKey)} endpoint-address=${q(ep.host)} endpoint-port=${ep.port} allowed-address=${S}/32 persistent-keepalive=${MT.KEEPALIVE}s comment=${q(T + " server")}`,
    `/ip address`,
    `remove [find comment~${q("^" + T + " wg")}]`,
    `add address=${P.wgIp}/24 interface=${q(WG)} comment=${q(T + " wg")}`,
    ``,
    `# ---------- 8) ใบรับรอง self-signed สำหรับ HTTPS (สร้างครั้งเดียว รันซ้ำไม่สร้างใหม่ fingerprint จึงไม่เปลี่ยน) ----------`,
    `# RouterOS 7.21 เซ็นใบ tls-server ด้วยตัวเองไม่ได้ ("CA not found" เจอจริง 2026-11-11) → สร้าง CA ของเครื่อง (pg-ca) แล้วใช้เซ็น`,
    `# ใบที่ค้างแบบยังไม่เซ็น (ไม่มี private key — รันรอบก่อนล้มกลางทาง) ลบทิ้งก่อน ไม่งั้นรอบนี้จะข้ามการสร้าง`,
    `/certificate`,
    `:foreach c in=[find where (name=${q(MT.CA)} or name=${q(MT.CERT)})] do={ :do { :if ([get $c private-key] != true) do={ remove $c } } on-error={} }`,  /* อ่าน private-key ไม่ได้ = ไม่ลบ (ลบใบดีทุกรอบ fingerprint จะเปลี่ยนตลอด) */
    `:if ([:len [find name=${q(MT.CA)}]] = 0) do={`,
    `  add name=${q(MT.CA)} common-name=${q("pg-ca-" + ident)} days-valid=3650 key-size=2048 key-usage=key-cert-sign,crl-sign`,
    `  sign ${q(MT.CA)}`,
    `  :delay 3s`,
    `}`,
    `:if ([:len [find name=${q(MT.CERT)}]] = 0) do={`,
    `  add name=${q(MT.CERT)} common-name=${q(P.router)} subject-alt-name=${q("IP:" + P.router)} days-valid=3650 key-size=2048 key-usage=digital-signature,key-encipherment,tls-server`,
    `  sign ${q(MT.CERT)} ca=${q(MT.CA)}`,
    `  :delay 3s`,
    `}`,
    ``,
    `# ---------- 9) บริการจัดการ: เปิด www-ssl อย่างเดียว ปิดตัวที่ไม่เข้ารหัส ----------`,
    `# winbox/ssh ยังเปิด (ช่างใช้หน้างานผ่าน LAN) — ฝั่ง WAN/WireGuard ถูก firewall ข้อ 11 กันไว้`,
    `/ip service`,
    `set www disabled=yes`,
    `set telnet disabled=yes`,
    `set ftp disabled=yes`,
    `set api disabled=yes`,
    `set api-ssl disabled=yes`,
    `set www-ssl disabled=no certificate=${q(MT.CERT)}`,
    ``,
    `# ---------- 10) user สำหรับเว็บ: อ่านอย่างเดียว + รีบูต (ไม่มี write) · เข้าได้จากเซิร์ฟเวอร์ WireGuard เท่านั้น ----------`,
    `/user group`,
    `:if ([:len [find name=${q(MT.GROUP)}]] = 0) do={ add name=${q(MT.GROUP)} policy=read,api,rest-api,test,reboot comment=${q(T)} } else={ set [find name=${q(MT.GROUP)}] policy=read,api,rest-api,test,reboot }`,
    `/user`,
    `:if ([:len [find name=${q(MT.USER)}]] = 0) do={ add name=${q(MT.USER)} group=${q(MT.GROUP)} password=${q(o.webPassword)} address=${S}/32 comment=${q(T)} } else={ set [find name=${q(MT.USER)}] group=${q(MT.GROUP)} password=${q(o.webPassword)} address=${S}/32 }`,
    ``,
    `# ---------- 11) Back To Home + DDNS (ให้เจ้าของเข้าไซต์เองผ่านแอป WireGuard) ----------`,
    `/ip cloud set ddns-enabled=yes back-to-home-vpn=enabled`,
    ``,
    `# ---------- 12) firewall: ย้ายกฎชุดนี้ขึ้นบนสุดของแต่ละ chain ----------`,
    `# input: จากเซิร์ฟเวอร์ ${S} เปิดแค่ 443 + ping · ที่เหลือจาก WireGuard/WAN ตัดทิ้งหมด`,
    `/ip firewall filter`,
    `remove [find comment~${q("^" + T)}]`,
    ...rules("input", input, "in"),
    `# ผู้ใช้ Back To Home เข้ามาทาง interface back-to-home-vpn — ต้องอยู่เหนือ defconf "drop all not coming from LAN"`,
    `# (ยังไม่มี interface นี้ = ข้าม ไม่ทำให้สคริปต์ล้ม)`,
    `:do { /ip firewall filter add chain=input action=accept in-interface=back-to-home-vpn comment=${q(T + " bth")} ;  /ip firewall filter move [find comment=${q(T + " bth")}] destination=${TOP} } on-error={ :put "skip: back-to-home-vpn interface not found" }`,
    `# forward: เซิร์ฟเวอร์เข้า Modbus 502 ที่ .20 · หน้าเว็บที่ .10/.20 · ping · LAN ห้ามเปิดการเชื่อมต่อใหม่ไปฝั่ง WireGuard`,
    ...rules("forward", forward, "fw"),
    ``,
    `# ---------- เสร็จ: จด fingerprint ใบรับรองนี้ไว้ (เว็บใช้ตรวจว่าคุยกับเราเตอร์ตัวจริง) ----------`,
    `:put ("${ident} OK - cert fingerprint: " . [/certificate get [find name=${q(MT.CERT)}] fingerprint])`,
    ``,
  ];
  return L.join("\r\n");
}

/* peer ฝั่งเซิร์ฟเวอร์ (wg-quick) — ต่อท้าย /etc/wireguard/wg0.conf */
export function buildServerPeer(o) {
  const P = sitePlan(o.n);
  need(validName(o.name), "ชื่อไซต์ผิดรูปแบบ");
  need(isWgKey(o.publicKey), "public key ของไซต์ผิดรูปแบบ");
  return [
    `# ไซต์ ${pad2(o.n)} · ${identityOf(o.n, o.name)}`,
    `[Peer]`,
    `PublicKey = ${o.publicKey}`,
    `AllowedIPs = ${P.wgIp}/32, ${P.lanNet}`,
    ``,
  ].join("\n");
}
