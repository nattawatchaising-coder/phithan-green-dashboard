/* ============================================================
   POST /api/auth/login   { username, pin }  →  { token, userId }
   GET  /api/auth/login                      →  { configured }

   ล็อกอินเว็บ (และหน้า LIFF ที่เปิดนอกแอป LINE) ด้วยชื่อผู้ใช้ + PIN ชุดเดิม
   เซิร์ฟเวอร์เป็นคนเทียบ PIN แล้วออก Firebase custom token ให้เบราว์เซอร์ signIn
   ฐานข้อมูลจึงรู้ว่าใครเป็นใคร — เงื่อนไขก่อนรัดกฎเป็น auth != null (docs/security.md)

   ── ความปลอดภัย ──
   endpoint นี้เปิดบนอินเทอร์เน็ตและรหัสเป็น PIN สั้น จึงต้อง:
   - ข้อความผิดพลาดเหมือนกันทุกกรณี (ไม่บอกว่าชื่อผิดหรือรหัสผิด)
   - นับครั้งพลาดต่อชื่อผู้ใช้ เกิน MAX_FAIL ล็อก LOCK_MIN นาที (authFails/ เขียนได้เฉพาะเซิร์ฟเวอร์เมื่อรัดกฎแล้ว)

   ยังไม่ได้ตั้ง FIREBASE_SERVICE_ACCOUNT → ตอบ 503 { fallback: true }
   หน้าเว็บจะกลับไปเทียบ PIN ในเบราว์เซอร์แบบเดิม (ใช้ได้เฉพาะตอนกฎยังเปิด)
   ============================================================ */

import crypto from "node:crypto";
import { ENV, json, body, rtdbGet, rtdbSet, rtdbDelete, matchCred, rolesOf } from "../_lib/line.mjs";
import { configured, customToken } from "../_lib/gauth.mjs";

const MAX_FAIL = 8;
const LOCK_MIN = 15;
const BAD = { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

/* key ของตัวนับ — แฮชชื่อผู้ใช้ เพราะชื่ออาจมีตัวอักษรที่ใช้เป็น key ของ RTDB ไม่ได้ (. # $ [ ] /) */
const failKey = (uname) => "authFails/" + crypto.createHash("sha256").update(uname).digest("hex").slice(0, 32);

export async function GET() {
  return json({ configured: configured() && !!ENV.rtdb() });
}

/* ชื่อ export ต้องเป็น POST ห้ามใช้ `export default` (เหตุผลเดียวกับ api/line/*.mjs) */
export async function POST(request) {
  if (!configured() || !ENV.rtdb()) return json({ error: "auth not configured", fallback: true }, 503);

  const b = await body(request);
  const uname = b ? String(b.username || "").trim().toLowerCase() : "";
  if (!uname || b.pin == null) return json(BAD, 400);

  const fk = failKey(uname);
  let fails = null;
  try { fails = await rtdbGet(fk); } catch (e) { return json({ error: "db" }, 502); }
  const lockedUntil = fails && fails.until ? Date.parse(fails.until) : 0;
  if (lockedUntil && Date.now() < lockedUntil) {
    return json({ error: "ลองผิดหลายครั้งเกินไป รอ " + LOCK_MIN + " นาทีแล้วลองใหม่ หรือติดต่อแอดมิน" }, 429);
  }

  let users = null;
  try { users = await rtdbGet("users"); } catch (e) { return json({ error: "db" }, 502); }
  const u = matchCred(users, uname, b.pin);

  if (!u) {
    /* ล็อกครบเวลาแล้วนับใหม่จากศูนย์ ไม่ใช่ล็อกซ้ำทันทีที่พลาดครั้งถัดไป */
    const n = (lockedUntil ? 0 : (fails && Number(fails.n)) || 0) + 1;
    const rec = { n, at: new Date().toISOString() };
    if (n >= MAX_FAIL) rec.until = new Date(Date.now() + LOCK_MIN * 60000).toISOString();
    await rtdbSet(fk, rec).catch(() => {});
    return json(BAD, 401);
  }

  if (fails) await rtdbDelete(fk).catch(() => {});
  const token = customToken(u.id, { roles: rolesOf(u) });
  return json({ token, userId: u.id });
}
