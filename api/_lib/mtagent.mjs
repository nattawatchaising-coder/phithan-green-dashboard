/* ============================================================
   ไซต์ MikroTik เฟส 2 — ช่องทางของ mt-agent (tools/mt-agent/agent.mjs ที่รันบน VPS เซิร์ฟเวอร์ WireGuard)
   docs/mikrotik.md
   ⚠ อยู่ใน _lib และเรียกผ่าน site.mjs (?agent=1) — Vercel ฟรีจำกัด 12 ฟังก์ชัน ห้ามแยกเป็นไฟล์ใน api/ เอง

   POST /api/mikrotik/site?agent=1   Authorization: Bearer <MT_AGENT_KEY>   (ไม่ใช่ล็อกอินพนักงาน — เป็นกุญแจของ agent ตัวเดียว)
     { ver, status?: { sites: { N: {...} } }, results?: [{ id, ok, error, data }], peek? }
     peek = ทดสอบ (mt-agent --once): ขอแค่รายชื่อไซต์ ไม่บันทึกสถานะ ไม่ส่งคำสั่ง
   →  { ok, poll_s, sites: [{ n, name, fp, pass? }], cmds: [{ id, n, type, ts, sig }] }

   - status → mtStatus/{N} (หน้าเว็บอ่านจากตรงนี้) + mtStatus/_agent (agent ติดต่อมาล่าสุดเมื่อไร)
   - pass (รหัส user pg-web — กลุ่มอ่านอย่างเดียว+รีบูต) ส่งให้เฉพาะไซต์ที่แอดมินยืนยันใบรับรอง (fp) แล้ว
     agent ต่อ https เฉพาะเมื่อ fingerprint ตรงเท่านั้น — ไม่ปิดการตรวจ TLS ทิ้ง
   - คำสั่งในคิว mtCmd/ (reboot | log) ลงลายเซ็น HMAC ด้วย MT_CMD_SECRET ตอนแอดมินกด · agent ตรวจลายเซ็นซ้ำเอง
   - ไม่มีทางสั่งแก้ IP / firewall / WireGuard ผ่านช่องนี้ (MT_CMD_TYPES มีแค่ reboot, log)
   ============================================================ */

import crypto from "node:crypto";
import { ENV, json, body, rtdbGet, rtdbUpdate, rtdbDelete } from "./line.mjs";
import { MT_ENV, mtAgentMissingEnv, validN, unseal, MT_CMD_TYPES, MT_CMD_TTL_MS } from "./mikrotik.mjs";
import { aad } from "./mtstore.mjs";

export const POLL_S = 30;
const KEEP_DONE_MS = 24 * 3600e3;     // คำสั่งที่จบแล้วเก็บไว้ 1 วันแล้วเก็บกวาดทิ้ง
const MAX_SITE_JSON = 12000;

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
function authed(request) {
  const want = MT_ENV.agentKey();
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return !!want && !!got && crypto.timingSafeEqual(sha(want), sha(got));
}

/* สถานะจาก agent → เก็บลงฐาน: ชื่อคีย์ต้องปลอดภัยสำหรับ RTDB · ตัดความยาว · ลึกไม่เกิน 4 ชั้น */
export function cleanStatus(v, depth = 0) {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.slice(0, 300);
  if (depth >= 4 || typeof v !== "object") return null;
  if (Array.isArray(v)) return v.slice(0, 40).map((x) => cleanStatus(x, depth + 1));
  const o = {};
  for (const k of Object.keys(v).slice(0, 60)) {
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(k)) continue;
    const x = cleanStatus(v[k], depth + 1);
    if (x != null) o[k] = x;
  }
  return o;
}
/* ผลคำสั่ง log: บรรทัดละ {time, topics, message} ไม่เกิน 200 บรรทัด */
function cleanLog(d) {
  if (!Array.isArray(d)) return null;
  return d.slice(-200).map((x) => ({
    time: String((x && x.time) || "").slice(0, 40), topics: String((x && x.topics) || "").slice(0, 80),
    message: String((x && x.message) || "").slice(0, 400),
  }));
}

export async function agentPOST(request) {
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  const miss = mtAgentMissingEnv();
  if (miss.length) return json({ error: "ยังไม่ได้ตั้ง env: " + miss.join(", ") }, 503);
  if (!authed(request)) return json({ error: "unauthorized" }, 401);
  const b = (await body(request)) || {};
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const sites = (await rtdbGet("mtSites")) || {};
  if (b.peek) return json({ ok: true, poll_s: POLL_S, sites: await siteList(sites), cmds: [] });
  let cmds = (await rtdbGet("mtCmd")) || {};

  /* 1) ผลของคำสั่งที่ส่งไปรอบก่อน */
  for (const r of (Array.isArray(b.results) ? b.results : []).slice(0, 20)) {
    const id = String((r && r.id) || "");
    const c = cmds[id];
    if (!/^[A-Za-z0-9_-]{6,40}$/.test(id) || !c || c.state !== "sent") continue;
    const patch = { state: r.ok ? "done" : "error", done_at: iso, error: r.ok ? "" : String(r.error || "ไม่ทราบสาเหตุ").slice(0, 300) };
    if (r.ok && c.type === "log") patch.data = cleanLog(r.data) || [];
    if (r.ok && c.type === "reboot") patch.note = String(r.note || "").slice(0, 200);
    await rtdbUpdate("mtCmd/" + id, patch);
    cmds[id] = Object.assign({}, c, patch);
  }

  /* 2) สถานะไซต์ */
  if (b.status && typeof b.status === "object") {
    const patch = {};
    const src = b.status.sites && typeof b.status.sites === "object" ? b.status.sites : {};
    let count = 0;
    for (const k of Object.keys(src).slice(0, 300)) {
      const n = Number(k);
      if (!validN(n) || !sites[n]) continue;
      const st = cleanStatus(src[k]) || {};
      if (JSON.stringify(st).length > MAX_SITE_JSON) continue;
      st.at = iso;
      patch[n] = st;
      count++;
      /* เฟส 3: ค่ามิเตอร์ราย 5 นาที (agent ติด snap = ขึ้นช่อง 5 นาทีใหม่) */
      if (b.status.snap && st.meter && st.meter.v) await saveMeterSnap(n, st.meter.v, now).catch(() => null);
    }
    patch._agent = { at: iso, ver: String(b.ver || "").slice(0, 20), sites: count };
    await rtdbUpdate("mtStatus", patch);
  } else {
    await rtdbUpdate("mtStatus/_agent", { seen: iso });
  }

  /* 3) คิวคำสั่ง: หมดอายุ → expired · จบนานแล้ว → เก็บกวาด · pending → ส่งให้ agent (ครั้งเดียว) */
  const out = [];
  for (const id of Object.keys(cmds)) {
    const c = cmds[id];
    if (!c || typeof c !== "object") continue;
    const age = now - Number(c.ts || 0);
    if (c.state === "pending" || c.state === "sent") {
      if (age > MT_CMD_TTL_MS) { await rtdbUpdate("mtCmd/" + id, { state: "expired", done_at: iso }); continue; }
      if (c.state === "pending" && MT_CMD_TYPES.includes(c.type) && sites[c.n]) {
        await rtdbUpdate("mtCmd/" + id, { state: "sent", sent_at: iso });
        out.push({ id, n: Number(c.n), type: c.type, ts: Number(c.ts), sig: String(c.sig || "") });
      }
    } else if (age > KEEP_DONE_MS) {
      await rtdbDelete("mtCmd/" + id).catch(() => null);
    }
  }

  return json({ ok: true, poll_s: POLL_S, sites: await siteList(sites), cmds: out });
}

/* รายชื่อไซต์ + รหัส (เฉพาะไซต์ที่ยืนยันใบรับรองแล้ว) */
async function siteList(sites) {
  const list = [];
  for (const k of Object.keys(sites)) {
    const s = sites[k];
    const n = Number(k);
    if (!validN(n) || !s) continue;
    const item = { n, name: String(s.name || ""), fp: String(s.fp || ""),
      meter_model: String(s.meter_model || "leos-ipm310"), meter_unit: Number(s.meter_unit) || 1 };
    if (item.fp) {
      const sec = await rtdbGet("mtSecrets/" + n).catch(() => null);
      try { item.pass = unseal(sec.web_pass, aad(n, "web_pass")); } catch (e) { item.key_error = true; }
    }
    list.push(item);
  }
  return list;
}

/* ================================================================
   เฟส 3 — ค่ามิเตอร์สำหรับ Monitoring/บิล (docs/mikrotik.md)
   mtMeter/{N}/h/{YYYYMMDD}/{HHMM}  ราย 5 นาที (เวลาไทย · ก่อน 2026-11-11 23:xx เป็น 15 นาที) — กราฟ
   mtMeter/{N}/d/{YYYYMMDD}         first/last ของวัน + kW สูงสุด — บิลรายเดือนใช้ first ของวันที่ 1
   ================================================================ */
export const METER_KEEP = ["kw", "kwh_imp", "kwh_exp", "kwh_net", "v1", "v2", "v3", "i1", "i2", "i3", "pf", "hz"];
export const MT_SNAP_MIN = 5;   // ต้องตรงกับรอบ snap ของ agent (300 วิ)
export function thSlot(ms) {
  const d = new Date(ms + 7 * 3600e3);   // เวลาไทย UTC+7 (ไม่มี DST)
  const p = (x) => String(x).padStart(2, "0");
  const m = Math.floor(d.getUTCMinutes() / MT_SNAP_MIN) * MT_SNAP_MIN;
  return { day: d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()), hm: p(d.getUTCHours()) + p(m) };
}
export async function saveMeterSnap(n, v, now) {
  const rec = {};
  for (const k of METER_KEEP) if (typeof v[k] === "number" && Number.isFinite(v[k])) rec[k] = v[k];
  if (!Object.keys(rec).length) return;
  const { day, hm } = thSlot(now);
  const read = { t: hm };
  for (const k of ["kwh_imp", "kwh_exp", "kwh_net"]) if (rec[k] != null) read[k] = rec[k];
  const cur = (await rtdbGet("mtMeter/" + n + "/d/" + day).catch(() => null)) || {};
  const dayRec = { last: read, kw_max: Math.max(Number(cur.kw_max) || 0, rec.kw || 0) };
  if (!cur.first) dayRec.first = read;
  await rtdbUpdate("mtMeter/" + n, { ["h/" + day + "/" + hm]: rec, ["d/" + day + "/last"]: dayRec.last, ["d/" + day + "/kw_max"]: dayRec.kw_max,
    ...(dayRec.first ? { ["d/" + day + "/first"]: dayRec.first } : {}) });
}
