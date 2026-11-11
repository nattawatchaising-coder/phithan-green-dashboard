/* ============================================================
   พาร์ทเนอร์/นักลงทุน — ผู้ใช้ภายนอกที่ขายไฟโซลาร์ให้โรงงานเอง (docs/mikrotik.md หัวข้อ "พาร์ทเนอร์")
   เห็นแค่หน้า MikroTik Monitoring ของไซต์ที่แอดมินมอบให้ · ตั้งราคา/บันทึกบิลเองได้ · ลงทะเบียนบริษัท+โลโก้ · ลงทะเบียนไซต์

   ข้อมูล
     mtPartners/{pid}        pid = "p-…" · id name username active sites{N:true} company{name addr tax branch phone email logo}
                             (พนักงานอ่านได้ · พาร์ทเนอร์อ่านได้แค่ของตัวเอง · เขียนผ่าน API เท่านั้น)
     mtSecrets/partners/{pid} { pin: แฮช scrypt }   (กฎ mtSecrets ปิดอ่าน/เขียนอยู่แล้ว)
     mtSites/{N}/owner       pid ของพาร์ทเนอร์เจ้าของไซต์ (ไซต์ละหนึ่งเจ้าของ) — กฎใช้ช่องนี้ตัดสินว่าพาร์ทเนอร์อ่านไซต์ไหนได้

   ล็อกอินใช้ /api/auth/login เดิม (ชื่อผู้ใช้ + รหัส) → custom token claim { ext: true, roles: ["partner"] }
   ⚠ ก่อนออกใบผ่านให้พาร์ทเนอร์ทุกครั้ง ทดลองอ่าน users/ ด้วยใบผ่านนั้นจริง — อ่านได้ = ยังไม่ได้วางกฎกันข้อมูลบริษัท → ไม่ให้เข้า
   ============================================================ */

import crypto from "node:crypto";
import { ENV, json, rtdbGet, rtdbUpdate, rtdbSet } from "./line.mjs";
import { customToken } from "./gauth.mjs";
import { validN } from "./mikrotik.mjs";

export const isPartnerUid = (uid) => /^p-[a-z0-9]{6,30}$/.test(String(uid || ""));
const UNAME_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;
export const PIN_MIN = 6;
const LOGO_MAX = 300000;   // ความยาว data URL (หน้าเว็บย่อรูปให้ก่อน ~ไม่เกิน 100 KB)
const LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/* ---------- รหัสผ่าน: scrypt + salt (ไม่เก็บรหัสตรง ๆ) ---------- */
export function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pin), salt, 32);
  return "s1." + salt.toString("base64url") + "." + h.toString("base64url");
}
export function checkPin(pin, stored) {
  const m = /^s1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(stored || ""));
  if (!m) return false;
  const want = Buffer.from(m[2], "base64url");
  const got = crypto.scryptSync(String(pin == null ? "" : pin), Buffer.from(m[1], "base64url"), want.length);
  return crypto.timingSafeEqual(want, got);
}
const DUMMY = hashPin("x-not-a-pin");

/* ล็อกอิน — คืนพาร์ทเนอร์เมื่อชื่อ+รหัสถูกและบัญชีเปิดอยู่ · คิดแฮชเสมอแม้ไม่พบชื่อ (เวลาตอบเท่ากัน ไล่หาชื่อไม่ได้) */
export async function partnerByLogin(uname, pin) {
  const all = (await rtdbGet("mtPartners")) || {};
  const p = Object.values(all).find((x) => x && typeof x === "object" && String(x.username || "").toLowerCase() === uname);
  const sec = p ? await rtdbGet("mtSecrets/partners/" + p.id).catch(() => null) : null;
  const ok = checkPin(pin, (sec && sec.pin) || DUMMY);
  return ok && p && p.active !== false && isPartnerUid(p.id) ? p : null;
}
export const partnerToken = (p) => customToken(p.id, { ext: true, roles: ["partner"] });

/* ---------- ตรวจว่ากฎฐานข้อมูลกันพาร์ทเนอร์ออกจากข้อมูลบริษัทแล้วจริง ----------
   ใช้ใบผ่านของพาร์ทเนอร์คนนั้นแลก ID token แล้วลองอ่าน users/ (shallow) — ต้องโดนปฏิเสธ
   web API key เป็นค่าสาธารณะ (อยู่ใน firebase-config.js ที่ทุกคนโหลดได้) ไม่ใช่ secret · ตั้ง env FIREBASE_WEB_API_KEY ทับได้ */
const WEB_API_KEY = () => (process.env.FIREBASE_WEB_API_KEY || "AIzaSyDzCjxLfqcrTBiUbtu5fizfYJoLN984qVQ").trim();
let _probeOkUntil = 0;
export async function rulesBlockPartner(token) {
  if (Date.now() < _probeOkUntil) return true;
  const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=" + encodeURIComponent(WEB_API_KEY()), {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, returnSecureToken: true }) });
  const j = await r.json().catch(() => ({}));
  if (!j.idToken) throw new Error("probe signin " + r.status);
  const t = await fetch(ENV.rtdb() + "/users.json?shallow=true&auth=" + encodeURIComponent(j.idToken));
  if (t.status === 401 || t.status === 403) { _probeOkUntil = Date.now() + 10 * 60e3; return true; }
  return false;
}

/* ---------- ข้อมูลบริษัทของพาร์ทเนอร์ (ผู้ออกบิล) ---------- */
const str = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
export function cleanCompany(c) {
  c = c && typeof c === "object" ? c : {};
  const logo = String(c.logo || "");
  if (logo && (logo.length > LOGO_MAX || !LOGO_RE.test(logo))) return { error: "โลโก้ต้องเป็นรูป PNG/JPG/WEBP ไม่เกิน ~200 KB" };
  const tax = str(c.tax, 20).replace(/[^\d-]/g, "");
  return { name: str(c.name, 150), addr: str(c.addr, 400), tax, branch: str(c.branch, 60), phone: str(c.phone, 40), email: str(c.email, 120), logo };
}
/* ทะเบียนไซต์ (ข้อมูลลูกค้า/สถานที่ที่ขึ้นบนบิล) */
export function cleanSiteInfo(b) {
  b = b && typeof b === "object" ? b : {};
  const kwp = b.kwp === "" || b.kwp == null ? null : Number(b.kwp);
  if (kwp != null && !(kwp >= 0 && kwp <= 100000)) return { error: "ขนาดระบบ (kWp) ไม่ถูกต้อง" };
  const cod = str(b.cod, 10);
  if (cod && !/^\d{4}-\d{2}-\d{2}$/.test(cod)) return { error: "วันเริ่มจ่ายไฟต้องเป็น YYYY-MM-DD" };
  return { cust: str(b.cust, 200), addr: str(b.addr, 400), tax: str(b.tax, 20).replace(/[^\d-]/g, ""), branch: str(b.branch, 60),
    contact: str(b.contact, 100), phone: str(b.phone, 40), place: str(b.place, 300), ca: str(b.ca, 40), meter_no: str(b.meter_no, 40),
    kwp, cod, note: str(b.note, 300) };
}

/* ---------- action ของแอดมิน/พาร์ทเนอร์ที่ไม่ผูกไซต์เดียว (เรียกจาก api/mikrotik/site.mjs) ----------
   w = { admin, partner, id, by } จาก who() · คืน Response หรือ null (ไม่ใช่ action ของไฟล์นี้) */
export async function partnerAction(w, b, now) {
  /* ข้อมูลบริษัท — พาร์ทเนอร์แก้ของตัวเอง · แอดมินแก้ของใครก็ได้ */
  if (b.action === "company") {
    const pid = w.partner ? w.id : String(b.pid || "");
    if (!isPartnerUid(pid)) return json({ error: "ไม่พบพาร์ทเนอร์" }, 404);
    const cur = w.partner ? w.partner : await rtdbGet("mtPartners/" + pid);
    if (!cur) return json({ error: "ไม่พบพาร์ทเนอร์" }, 404);
    const c = cleanCompany(b.company);
    if (c.error) return json({ error: c.error }, 400);
    await rtdbUpdate("mtPartners/" + pid, { company: c, updated_at: now, updated_by: w.by });
    return json({ ok: true, company: c });
  }
  /* เปลี่ยนรหัสตัวเอง (พาร์ทเนอร์ ต้องใส่รหัสเดิม) · แอดมินตั้งรหัสใหม่ให้ */
  if (b.action === "partner-pin") {
    const pid = w.partner ? w.id : String(b.pid || "");
    if (!isPartnerUid(pid)) return json({ error: "ไม่พบพาร์ทเนอร์" }, 404);
    const pin = String(b.pin || "");
    if (pin.length < PIN_MIN || pin.length > 64) return json({ error: "รหัสผ่านต้องยาว " + PIN_MIN + "–64 ตัว" }, 400);
    if (w.partner) {
      const sec = await rtdbGet("mtSecrets/partners/" + pid).catch(() => null);
      if (!sec || !checkPin(b.old, sec.pin)) return json({ error: "รหัสเดิมไม่ถูกต้อง" }, 403);
    } else if (!(await rtdbGet("mtPartners/" + pid))) return json({ error: "ไม่พบพาร์ทเนอร์" }, 404);
    await rtdbSet("mtSecrets/partners/" + pid, { pin: hashPin(pin), at: now, by: w.by });
    return json({ ok: true });
  }
  if (b.action !== "partner-save") return null;
  if (!w.admin) return json({ error: "เฉพาะแอดมิน" }, 403);

  /* สร้าง/แก้บัญชีพาร์ทเนอร์ + มอบไซต์ (ไม่มีลบ — ปิดบัญชีด้วย active:false) */
  const isNew = !b.id;
  const pid = isNew ? "p-" + crypto.randomBytes(8).toString("hex") : String(b.id);
  if (!isPartnerUid(pid)) return json({ error: "id ผิด" }, 400);
  const all = (await rtdbGet("mtPartners")) || {};
  const cur = all[pid] || null;
  if (!isNew && !cur) return json({ error: "ไม่พบพาร์ทเนอร์" }, 404);
  const name = str(b.name, 100);
  if (!name) return json({ error: "ใส่ชื่อผู้ใช้งาน" }, 400);
  const uname = str(b.username, 32).toLowerCase();
  if (!UNAME_RE.test(uname)) return json({ error: "ชื่อผู้ใช้ (ล็อกอิน) ใช้ a-z 0-9 . _ - ยาว 3–32 ตัว" }, 400);
  /* ชื่อล็อกอินห้ามซ้ำทั้งพนักงานและพาร์ทเนอร์ */
  if (Object.values(all).some((x) => x && x.id !== pid && String(x.username || "").toLowerCase() === uname)) return json({ error: "ชื่อผู้ใช้นี้มีพาร์ทเนอร์ใช้แล้ว" }, 409);
  const users = (await rtdbGet("users")) || {};
  if (Object.values(users).some((u) => u && (String(u.username || "").toLowerCase() === uname || (!u.username && String(u.name || "").trim().toLowerCase() === uname)) || uname === "admin"))
    return json({ error: "ชื่อผู้ใช้นี้ซ้ำกับพนักงาน" }, 409);
  const pin = String(b.pin || "");
  if (isNew && pin.length < PIN_MIN) return json({ error: "ตั้งรหัสผ่านอย่างน้อย " + PIN_MIN + " ตัว" }, 400);
  if (pin && (pin.length < PIN_MIN || pin.length > 64)) return json({ error: "รหัสผ่านต้องยาว " + PIN_MIN + "–64 ตัว" }, 400);

  const want = [...new Set((Array.isArray(b.sites) ? b.sites : []).map(Number))];
  if (want.some((n) => !validN(n))) return json({ error: "เลขไซต์ไม่ถูกต้อง" }, 400);
  const sites = (await rtdbGet("mtSites")) || {};
  for (const n of want) if (!sites[n]) return json({ error: "ไม่พบไซต์ " + n }, 404);

  /* อัปเดตหลายที่พร้อมกัน: owner ของไซต์ + รายการไซต์ของพาร์ทเนอร์ทุกคนที่เกี่ยว */
  const patch = {};
  const mine = {};
  want.forEach((n) => { mine[n] = true; });
  for (const k of Object.keys(sites)) {
    const n = Number(k), s = sites[k] || {};
    if (mine[n] && s.owner !== pid) {
      patch["mtSites/" + n + "/owner"] = pid;
      if (s.owner && all[s.owner]) patch["mtPartners/" + s.owner + "/sites/" + n] = null;   // ย้ายเจ้าของ
    } else if (!mine[n] && s.owner === pid) patch["mtSites/" + n + "/owner"] = null;
  }
  const rec = { id: pid, name, username: uname, active: b.active !== false, sites: Object.keys(mine).length ? mine : null, updated_at: now, updated_by: w.by };
  if (isNew) Object.assign(rec, { created_at: now, created_by: w.by });
  for (const [k, v] of Object.entries(rec)) patch["mtPartners/" + pid + "/" + k] = v;
  if (pin) patch["mtSecrets/partners/" + pid] = { pin: hashPin(pin), at: now, by: w.by };
  await rtdbUpdate("", patch);
  return json({ ok: true, id: pid });
}
