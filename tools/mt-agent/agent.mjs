#!/usr/bin/env node
/* =====================================================================
   mt-agent — ตัวเฝ้าไซต์ MikroTik บน VPS เซิร์ฟเวอร์ WireGuard (เฟส 2 · docs/mikrotik.md)
   ติดตั้งด้วย tools/mt-agent/install.sh (systemd: mt-agent) · node 18+ ไม่มี dependency

   ทุก ~30 วิ คุยกับเว็บที่ /api/mikrotik/site?agent=1 ครั้งเดียว:
     ส่ง  สถานะไซต์ (ทุก 60 วิ) + ผลคำสั่งที่ทำเสร็จ
     รับ  รายชื่อไซต์ + fingerprint ที่แอดมินยืนยัน + รหัส user pg-web + คำสั่งที่รอ (reboot | log)

   ต่อ hEX ผ่าน WireGuard: https://10.10.N.1/rest/...  (user pg-web — กลุ่มอ่านอย่างเดียว + รีบูต)
   - ใบรับรองของ hEX เป็น self-signed → pin ด้วย fingerprint SHA-256 ต่อไซต์ (ไม่ตรง = ไม่ส่งรหัส ไม่คุยต่อ)
     ไซต์ที่แอดมินยังไม่ยืนยัน = แค่อ่าน fingerprint มารายงาน ไม่ล็อกอิน
   - คำสั่งต้องมีลายเซ็น HMAC (MT_CMD_SECRET) ถูก + อายุไม่เกิน 10 นาที + ไม่เคยทำ ไม่งั้นปฏิเสธ
   - agent ไม่มีโค้ดแก้ค่าเราเตอร์เลย — มีแค่ GET กับ POST /system/reboot

   env (/etc/mt-agent.env): MT_API_URL  MT_AGENT_KEY  MT_CMD_SECRET  [MT_WG_IF=wg0]
   ทดสอบรอบเดียว: sudo mt-agent-once   (= node agent.mjs --once พิมพ์ผลแทนการวนลูป)
   ===================================================================== */

import crypto from "node:crypto";
import tls from "node:tls";
import net from "node:net";
import fs from "node:fs";
import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";

export const VERSION = "4";
const STATUS_EVERY_MS = 60e3;
const CMD_TTL_MS = 10 * 60e3;
const USER = "pg-web";

/* ---------- ตัวช่วยที่เทสต์ได้ ---------- */
export const sitePlan = (n) => ({ hex: "10.10." + n + ".1", sl: "10.10." + n + ".10", meter: "10.10." + n + ".20", wg: "10.99.0." + (10 + n) });
export const normFp = (s) => {
  const h = String(s || "").replace(/[:\s]/g, "").toLowerCase();
  return /^[0-9a-f]{64}$/.test(h) ? h : "";
};
/* ต้องตรงกับ cmdPayload/cmdSig ใน api/_lib/mikrotik.mjs */
export const cmdSig = (c, secret) =>
  crypto.createHmac("sha256", secret).update([c.id, c.n, c.type, c.ts].join("|")).digest("base64url");
export function cmdOk(c, secret, done, now = Date.now()) {
  if (!c || !secret) return "ไม่มีลายเซ็น";
  if (!["reboot", "log"].includes(c.type)) return "คำสั่งไม่รู้จัก";
  const want = Buffer.from(cmdSig(c, secret));
  const got = Buffer.from(String(c.sig || ""));
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return "ลายเซ็นไม่ถูก";
  if (!(now - Number(c.ts) < CMD_TTL_MS) || Number(c.ts) > now + 60e3) return "คำสั่งหมดอายุ";
  if (done.has(c.id)) return "ทำไปแล้ว";
  return "";
}

/* `wg show wg0 dump` → { "10.99.0.11": { hs, rx, tx, endpoint } } */
export function parseWgDump(text) {
  const out = {};
  const lines = String(text || "").trim().split("\n").slice(1);
  for (const l of lines) {
    const f = l.split("\t");
    if (f.length < 8) continue;
    for (const ip of f[3].split(",")) {
      const m = /^(10\.99\.0\.\d+)\/32$/.exec(ip.trim());
      if (m) out[m[1]] = { hs: Number(f[4]) || 0, rx: Number(f[5]) || 0, tx: Number(f[6]) || 0, endpoint: f[2] === "(none)" ? "" : f[2] };
    }
  }
  return out;
}

/* แยกคำตอบ HTTP/1.1 ดิบ (รองรับ chunked) → { status, body } */
export function parseHttp(buf) {
  const i = buf.indexOf("\r\n\r\n");
  if (i < 0) throw new Error("คำตอบ HTTP ไม่ครบ");
  const head = buf.subarray(0, i).toString("latin1");
  let rest = buf.subarray(i + 4);
  const status = Number((/^HTTP\/1\.[01] (\d{3})/.exec(head) || [])[1] || 0);
  if (/\r\ntransfer-encoding:\s*chunked/i.test(head)) {
    const parts = [];
    let p = 0;
    for (;;) {
      const e = rest.indexOf("\r\n", p);
      if (e < 0) break;
      const size = parseInt(rest.subarray(p, e).toString("latin1"), 16);
      if (!size) break;
      parts.push(rest.subarray(e + 2, e + 2 + size));
      p = e + 2 + size + 2;
    }
    rest = Buffer.concat(parts);
  }
  return { status, body: rest.toString("utf8") };
}

const peerFp = (sock) => normFp((sock.getPeerCertificate() || {}).fingerprint256);

/* HTTPS ไปที่ hEX แบบ pin ใบรับรอง: ต่อ TLS → เทียบ fingerprint ก่อน "ส่งอะไรก็ตาม" → ค่อยส่งคำขอพร้อมรหัส
   ไม่มี pin = คืนแค่ { fp } ไม่ส่งคำขอ · ไม่ตรง = error code FP_MISMATCH */
export function pinnedRequest({ host, port = 443, pin, user, pass, method = "GET", path = "/", body = null, timeout = 8000 }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let done = false;
    const fin = (err, val) => { if (done) return; done = true; sock.destroy(); err ? reject(err) : resolve(val); };
    const sock = tls.connect({ host, port, rejectUnauthorized: false, timeout });   // ตรวจเองด้วย fingerprint ด้านล่าง
    sock.on("timeout", () => fin(Object.assign(new Error("หมดเวลา"), { code: "TIMEOUT" })));
    sock.on("error", (e) => fin(e));
    sock.on("secureConnect", () => {
      const fp = peerFp(sock);
      if (!pin) return fin(null, { fp });
      if (fp !== normFp(pin)) return fin(Object.assign(new Error("ใบรับรองไม่ตรงกับที่ยืนยันไว้"), { code: "FP_MISMATCH", fp }));
      const data = body == null ? "" : JSON.stringify(body);
      sock.write(method + " " + path + " HTTP/1.1\r\nHost: " + host + "\r\nAuthorization: Basic " +
        Buffer.from(user + ":" + pass).toString("base64") + "\r\nAccept: application/json\r\nConnection: close\r\n" +
        (body == null ? "" : "Content-Type: application/json\r\nContent-Length: " + Buffer.byteLength(data) + "\r\n") + "\r\n" + data);
      sock.on("data", (d) => chunks.push(d));
      sock.on("end", () => {
        try {
          const r = parseHttp(Buffer.concat(chunks));
          let j = null;
          try { j = r.body ? JSON.parse(r.body) : null; } catch (e) { /* ไม่ใช่ JSON */ }
          fin(null, { fp, status: r.status, json: j, text: r.body });
        } catch (e) { fin(e); }
      });
    });
  });
}

export function tcpCheck(host, port, timeout = 3000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const s = net.connect({ host, port });
    const end = (ok) => { s.destroy(); resolve(ok ? { ok: true, ms: Date.now() - t0 } : { ok: false }); };
    s.setTimeout(timeout, () => end(false));
    s.on("connect", () => end(true));
    s.on("error", () => end(false));
  });
}
const run = (cmd, args, timeout = 5000) => new Promise((resolve) => {
  execFile(cmd, args, { timeout }, (err, stdout) => resolve({ ok: !err, out: String(stdout || "") }));
});
async function ping(host) {
  const r = await run("ping", ["-c", "1", "-W", "2", host]);
  const m = /time[=<]([\d.]+)/.exec(r.out);
  return r.ok ? { ok: true, ms: m ? Math.round(Number(m[1])) : null } : { ok: false };
}

/* ตัด JSON ของ RouterOS ให้เหลือแค่ที่แสดงบนเว็บ (ชื่อคีย์มี - → _) */
export function pickResource(r) {
  r = r || {};
  const num = (x) => (x == null || x === "" ? null : Number(x));
  return {
    uptime: String(r.uptime || ""), version: String(r.version || ""), board: String(r["board-name"] || ""),
    cpu: num(r["cpu-load"]), mem_free: num(r["free-memory"]), mem_total: num(r["total-memory"]),
    hdd_free: num(r["free-hdd-space"]), hdd_total: num(r["total-hdd-space"]),
  };
}
export function pickIfaces(list) {
  return (Array.isArray(list) ? list : []).filter((x) => x && x.name && x.type !== "loopback").slice(0, 16).map((x) => ({
    name: String(x.name), type: String(x.type || ""), running: x.running === "true" || x.running === true,
    disabled: x.disabled === "true" || x.disabled === true, rx: Number(x["rx-byte"]) || 0, tx: Number(x["tx-byte"]) || 0,
    downs: Number(x["link-downs"]) || 0,
  }));
}
export function pickAddrs(list) {
  return (Array.isArray(list) ? list : []).slice(0, 16).map((x) => ({
    address: String((x && x.address) || ""), iface: String((x && x.interface) || ""), dynamic: x && (x.dynamic === "true" || x.dynamic === true),
  }));
}

/* =====================================================================
   เฟส 3 — อ่านมิเตอร์ด้วย Modbus TCP (อ่านอย่างเดียว: FC03/FC04 — ไม่มีโค้ดเขียน register/coil)
   โปรไฟล์ต่อรุ่น: บล็อกที่อ่าน + ช่องค่า (addr = ที่อยู่ Modbus นับจาก 0)
   ===================================================================== */
export const METER_PROFILES = {
  /* LEOS IPM310 — ตารางจากคู่มือ (docs/mikrotik.md) · FC04 · float word ต่ำมาก่อน (ผู้ใช้ทดสอบจริง 2026-11-11) */
  "leos-ipm310": {
    fc: 4, lowWordFirst: true,
    blocks: [[200, 60], [269, 6]],
    f32: { v1: 200, v2: 202, v3: 204, i1: 212, i2: 214, i3: 216, kw1: 224, kw2: 226, kw3: 228, kw: 230, kvar: 238, kva: 246,
      kwh_net: 269, kwh_imp: 271, kwh_exp: 273 },
    /* PF ×0.001 (คู่มือเขียน ×0.01 แต่ค่าดิบ 1000 = หน้าจอมิเตอร์ 1 · ผู้ใช้เทียบจริง 2026-11-11) */
    i16: { pf: [251, 0.001], hz: [252, 0.1] },
  },
  /* Schneider PM2200 (ผ่าน Waveshare) — ตามตารางผู้ผลิต · FC03 · float word สูงมาก่อน · ⚠ ยังไม่ได้ลองกับเครื่องจริง */
  "pm2200": {
    fc: 3, lowWordFirst: false,
    blocks: [[2699, 4], [2999, 62], [3109, 2]],
    f32: { kwh_imp: 2699, kwh_exp: 2701, i1: 2999, i2: 3001, i3: 3003, v1: 3027, v2: 3029, v3: 3031,
      kw1: 3053, kw2: 3055, kw3: 3057, kw: 3059, hz: 3109 },
    i16: {},
  },
};
export const METER_MODELS = Object.keys(METER_PROFILES);

/* คำขอ/คำตอบ Modbus TCP (MBAP) */
export function mbRequest(tid, unit, fc, addr, qty) {
  const b = Buffer.alloc(12);
  b.writeUInt16BE(tid, 0); b.writeUInt16BE(0, 2); b.writeUInt16BE(6, 4); b.writeUInt8(unit, 6);
  b.writeUInt8(fc, 7); b.writeUInt16BE(addr, 8); b.writeUInt16BE(qty, 10);
  return b;
}
/* คืน { tid, regs: [uint16…] } หรือ throw (exception code) · ไม่ครบ = null (รออ่านต่อ) */
export function mbParse(buf) {
  if (buf.length < 9) return null;
  const len = buf.readUInt16BE(4);
  if (buf.length < 6 + len) return null;
  const tid = buf.readUInt16BE(0), fc = buf.readUInt8(7);
  if (fc & 0x80) throw Object.assign(new Error("มิเตอร์ตอบ exception " + buf.readUInt8(8)), { code: "MB_EXC" });
  const n = buf.readUInt8(8);
  const regs = [];
  for (let i = 0; i < n / 2; i++) regs.push(buf.readUInt16BE(9 + i * 2));
  return { tid, regs, size: 6 + len };
}
export function f32From(hi, lo) {
  const b = Buffer.alloc(4);
  b.writeUInt16BE(hi, 0); b.writeUInt16BE(lo, 2);
  return b.readFloatBE(0);
}
/* แปลง register ที่อ่านได้ (map addr → uint16) เป็นค่าตามโปรไฟล์ · ค่าผิดปกติ (NaN/อนันต์) = ไม่ใส่ */
export function decodeMeter(profile, reg) {
  const out = {};
  for (const [k, a] of Object.entries(profile.f32)) {
    if (reg[a] == null || reg[a + 1] == null) continue;
    const v = profile.lowWordFirst ? f32From(reg[a + 1], reg[a]) : f32From(reg[a], reg[a + 1]);
    if (Number.isFinite(v) && Math.abs(v) < 1e12) out[k] = Math.round(v * 1000) / 1000;
  }
  for (const [k, [a, scale]] of Object.entries(profile.i16)) {
    if (reg[a] == null) continue;
    const s = reg[a] > 0x7fff ? reg[a] - 0x10000 : reg[a];
    out[k] = Math.round(s * scale * 1000) / 1000;
  }
  return out;
}

/* อ่านทุกบล็อกในการเชื่อมต่อเดียว */
export function readMeter(host, model, unit = 1, { port = 502, timeout = 4000 } = {}) {
  const P = METER_PROFILES[model];
  if (!P) return Promise.reject(new Error("ไม่รู้จักรุ่นมิเตอร์ " + model));
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const reg = {};
    let buf = Buffer.alloc(0), i = 0, done = false;
    const s = net.connect({ host, port });
    const fin = (err, v) => { if (done) return; done = true; s.destroy(); err ? reject(err) : resolve(v); };
    const next = () => {
      if (i >= P.blocks.length) return fin(null, { ms: Date.now() - t0, v: decodeMeter(P, reg) });
      const [a, q] = P.blocks[i];
      s.write(mbRequest(i + 1, unit, P.fc, a, q));
    };
    s.setTimeout(timeout, () => fin(Object.assign(new Error("มิเตอร์ไม่ตอบ"), { code: "TIMEOUT" })));
    s.on("error", (e) => fin(e));
    s.on("connect", next);
    s.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      try {
        const r = mbParse(buf);
        if (!r) return;
        buf = buf.subarray(r.size);
        if (r.tid !== i + 1) return fin(new Error("คำตอบสลับลำดับ"));
        const a = P.blocks[i][0];
        r.regs.forEach((x, k) => { reg[a + k] = x; });
        i++;
        next();
      } catch (e) { fin(e); }
    });
  });
}

/* ---------- เช็กสถานะหนึ่งไซต์ ---------- */
async function checkSite(s, wg) {
  const P = sitePlan(s.n);
  const st = { wg: wg[P.wg] || { hs: 0 } };
  const [hexPing, slPing, slWeb, meter] = await Promise.all([
    ping(P.hex), ping(P.sl),
    tcpCheck(P.sl, 443).then((r) => (r.ok ? r : tcpCheck(P.sl, 80))),
    s.meter_model === "none" ? Promise.resolve(null)
      : readMeter(P.meter, METER_PROFILES[s.meter_model] ? s.meter_model : "leos-ipm310", Number(s.meter_unit) || 1)
        .then((r) => ({ ok: true, ms: r.ms, v: r.v }), (e) => ({ ok: false, error: String(e.message || e).slice(0, 80) })),
  ]);
  st.hex = { ping: hexPing };
  st.sl = { ping: slPing, web: slWeb };
  /* มิเตอร์: ค่าที่อ่านได้อยู่ใน st.meter.v (เว็บเก็บราย 5 นาทีเมื่อ status.snap = ช่อง 5 นาทีใหม่) */
  if (meter) st.meter = { modbus: { ok: meter.ok, ms: meter.ms }, model: s.meter_model || "leos-ipm310", v: meter.v || null, error: meter.error || "" };
  const req = (path, extra) => pinnedRequest(Object.assign({ host: P.hex, pin: s.fp, user: USER, pass: s.pass, path }, extra));
  try {
    if (!s.fp || !s.pass) {
      const r = await req("/");
      st.tls = { fp: r.fp, pinned: false };
      if (s.fp && !s.pass) st.tls.error = s.key_error ? "ถอดรหัสไม่ได้ (MT_ENC_KEY)" : "ไม่มีรหัส";
      return st;
    }
    const [res, ifs, addrs] = await Promise.all([req("/rest/system/resource"), req("/rest/interface"), req("/rest/ip/address")]);
    st.tls = { fp: res.fp, pinned: true };
    if (res.status === 401) { st.rest = { ok: false, error: "รหัส pg-web ไม่ตรง (สร้างคีย์ใหม่แล้วยังไม่รันสคริปต์?)" }; return st; }
    if (res.status !== 200) { st.rest = { ok: false, error: "REST ตอบ " + res.status }; return st; }
    st.rest = { ok: true };
    st.res = pickResource(res.json);
    st.ifaces = pickIfaces(ifs.json);
    st.addrs = pickAddrs(addrs.json);
  } catch (e) {
    if (e.code === "FP_MISMATCH") st.tls = { fp: e.fp, pinned: true, mismatch: true };
    else st.rest = { ok: false, error: String(e.message || e).slice(0, 120) };
  }
  return st;
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

/* ---------- ทำคำสั่ง (อ่าน log / รีบูต เท่านั้น) ---------- */
async function doCmd(c, site) {
  const P = sitePlan(c.n);
  const base = { host: P.hex, pin: site.fp, user: USER, pass: site.pass };
  if (!site.fp || !site.pass) return { id: c.id, ok: false, error: "ไซต์ยังไม่ยืนยันใบรับรอง" };
  try {
    if (c.type === "log") {
      const r = await pinnedRequest(Object.assign({}, base, { path: "/rest/log", timeout: 15000 }));
      if (r.status !== 200 || !Array.isArray(r.json)) return { id: c.id, ok: false, error: "อ่าน log ไม่ได้ (" + r.status + ")" };
      return { id: c.id, ok: true, data: r.json.slice(-200).map((x) => ({ time: x.time, topics: x.topics, message: x.message })) };
    }
    if (c.type === "reboot") {
      const r = await pinnedRequest(Object.assign({}, base, { method: "POST", path: "/rest/system/reboot", body: {}, timeout: 8000 }))
        .catch((e) => (e.code === "FP_MISMATCH" ? Promise.reject(e) : { status: 0, dropped: true }));
      if (r.status === 401 || r.status === 403) return { id: c.id, ok: false, error: "ไม่มีสิทธิ์รีบูต (" + r.status + ")" };
      return { id: c.id, ok: true, note: r.dropped ? "สั่งแล้ว เราเตอร์ตัดการเชื่อมต่อ (ปกติของการรีบูต)" : "สั่งแล้ว (" + r.status + ")" };
    }
  } catch (e) {
    return { id: c.id, ok: false, error: String(e.message || e).slice(0, 200) };
  }
  return { id: c.id, ok: false, error: "คำสั่งไม่รู้จัก" };
}

/* ---------- ลูปหลัก ---------- */
function loadDone(file) { try { return new Set(JSON.parse(fs.readFileSync(file, "utf8"))); } catch (e) { return new Set(); } }
function saveDone(file, set) { try { fs.writeFileSync(file, JSON.stringify([...set].slice(-500))); } catch (e) { /* ไม่มีที่เขียน = จำในหน่วยความจำอย่างเดียว */ } }

export async function main(argv = process.argv.slice(2)) {
  const once = argv.includes("--once");
  const E = (k, d = "") => (process.env[k] || d).trim();
  const api = E("MT_API_URL"), key = E("MT_AGENT_KEY"), secret = E("MT_CMD_SECRET"), wgIf = E("MT_WG_IF", "wg0");
  if (!/^https:\/\//.test(api) || key.length < 32 || secret.length < 32) {
    console.error("env ไม่ครบ: ต้องมี MT_API_URL (https://…/api/mikrotik/site?agent=1) MT_AGENT_KEY MT_CMD_SECRET — ดู /etc/mt-agent.env");
    process.exit(2);
  }
  const doneFile = (process.env.STATE_DIRECTORY || "/var/lib/mt-agent") + "/done.json";
  const done = loadDone(doneFile);
  let sites = [], results = [], lastStatus = 0, wait = 30e3, fails = 0, lastSlot = 0;
  const call = async (payload) => {
    const r = await fetch(api, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + key },
      body: JSON.stringify(Object.assign({ ver: VERSION }, payload)), signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("เว็บตอบ " + r.status + " " + (j.error || ""));
    return j;
  };

  const checkAll = async () => {
    const wg = parseWgDump((await run("wg", ["show", wgIf, "dump"])).out);
    const list = await pool(sites, 8, (s) => checkSite(s, wg).then((st) => [s.n, st]));
    return { sites: Object.fromEntries(list) };
  };
  /* --once: ดูอย่างเดียว (peek = เว็บไม่ส่งคำสั่ง ไม่บันทึกสถานะ) พิมพ์ผลแล้วจบ */
  if (once) {
    sites = (await call({ peek: true })).sites || [];
    console.log("ไซต์", sites.map((s) => s.n + (s.fp ? "" : " (ยังไม่ยืนยันใบรับรอง)")).join(", ") || "ไม่มี");
    console.log(JSON.stringify(await checkAll(), null, 1));
    return;
  }
  for (;;) {
    try {
      let status;
      /* รอบแรกยังไม่รู้รายชื่อไซต์ → คุยกับเว็บก่อน รอบถัดไปค่อยส่งสถานะ */
      let slot = 0;
      if (sites.length && Date.now() - lastStatus >= STATUS_EVERY_MS) {
        status = await checkAll(); lastStatus = Date.now();
        /* ขึ้นช่อง 5 นาทีใหม่ = ให้เว็บเก็บค่ามิเตอร์ลงประวัติ (เก็บช่องละครั้ง · ผู้ใช้ขอ 2026-11-11 จากเดิม 15 นาที) */
        slot = Math.floor(Date.now() / 300e3);
        if (slot !== lastSlot) status.snap = true;
      }
      const j = await call({ status, results });
      if (status && status.snap) lastSlot = slot;
      results = [];
      sites = j.sites || [];
      wait = (Number(j.poll_s) || 30) * 1000;
      for (const c of j.cmds || []) {
        const site = sites.find((s) => s.n === c.n) || {};
        const why = cmdOk(c, secret, done);
        const r = why ? { id: c.id, ok: false, error: "agent ปฏิเสธ: " + why } : await doCmd(c, site);
        console.log("คำสั่ง", c.type, "ไซต์", c.n, r.ok ? "สำเร็จ" : "ไม่สำเร็จ: " + r.error);
        done.add(c.id);
        results.push(r);
      }
      if (results.length) { saveDone(doneFile, done); wait = 1000; }   // ส่งผลกลับเร็ว ๆ
      if (!lastStatus && sites.length) wait = 0;                        // เพิ่งรู้รายชื่อไซต์ → เช็กเลย
      if (fails) console.log("ติดต่อเว็บได้อีกครั้ง");
      fails = 0;
    } catch (e) {
      fails++;
      console.error("รอบนี้ผิดพลาด:", String(e.message || e));
      wait = Math.min(300e3, 15e3 * fails);
    }
    await new Promise((r) => setTimeout(r, wait));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
