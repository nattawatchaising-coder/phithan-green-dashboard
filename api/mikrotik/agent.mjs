/* ============================================================
   ไซต์ MikroTik เฟส 2 — ช่องทางของ mt-agent (tools/mt-agent/agent.mjs ที่รันบน VPS เซิร์ฟเวอร์ WireGuard)
   docs/mikrotik.md

   POST /api/mikrotik/agent   Authorization: Bearer <MT_AGENT_KEY>   (ไม่ใช่ล็อกอินพนักงาน — เป็นกุญแจของ agent ตัวเดียว)
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
import { ENV, json, body, rtdbGet, rtdbUpdate, rtdbDelete } from "../_lib/line.mjs";
import { MT_ENV, mtAgentMissingEnv, validN, unseal, MT_CMD_TYPES, MT_CMD_TTL_MS } from "../_lib/mikrotik.mjs";
import { aad } from "../_lib/mtstore.mjs";

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

export async function POST(request) {
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
    const item = { n, name: String(s.name || ""), fp: String(s.fp || "") };
    if (item.fp) {
      const sec = await rtdbGet("mtSecrets/" + n).catch(() => null);
      try { item.pass = unseal(sec.web_pass, aad(n, "web_pass")); } catch (e) { item.key_error = true; }
    }
    list.push(item);
  }
  return list;
}
