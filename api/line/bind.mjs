/* ============================================================
   POST /api/line/bind   { idToken, username, pin }  →  { userId, name }

   ผูกบัญชี LINE เข้ากับพนักงานหนึ่งคน ทำครั้งเดียวตอนเปิดแอปครั้งแรก

   ── เรื่องความปลอดภัยที่ต้องรู้ก่อนแก้ไฟล์นี้ ──
   นี่คือด่านตรวจรหัสผ่านด่านแรกของระบบที่หันออกอินเทอร์เน็ต และรหัสคือ PIN สั้น ๆ
   ตัวป้องกันจริงไม่ใช่ตัว PIN แต่เป็นลำดับ: **ตรวจ ID token ให้ผ่านก่อน ถึงจะดู PIN**
   คนที่ยิง endpoint นี้ได้จึงต้องเป็นผู้ใช้ LINE ที่ระบุตัวได้และบล็อกได้เสมอ
   เสริมด้วยตัวนับครั้งพลาดต่อบัญชี LINE และข้อความผิดพลาดที่เหมือนกันทุกกรณี
   (ถ้าบอกแยกว่า "ไม่พบบัญชีนี้" กับ "รหัสผ่านไม่ถูกต้อง" = แจกรายชื่อผู้ใช้ให้ฟรี)
   ============================================================ */

import { ENV, json, body, verifyIdToken, rtdbGet, rtdbUpdate, rtdbSet, matchCred, tokenForUser } from "../_lib/line.mjs";

const MAX_FAIL = 5;
const BAD = { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

/* ชื่อ export ต้องเป็น POST ห้ามใช้ `export default`
   Vercel ตีความ default export ว่าเป็นลายเซ็นเก่า (req, res) => void
   ซึ่ง req เป็น IncomingMessage ไม่มี .text() และค่าที่ return ถูกทิ้ง → 500 ทุกครั้ง
   ตั้งชื่อตามเมธอดแทน จึงได้ Request/Response แบบเว็บมาตรฐาน ที่อ่าน body ดิบได้ */
export async function POST(request) {
  if (!ENV.loginId() || !ENV.rtdb()) return json({ error: "server not configured" }, 500);

  const b = await body(request);
  if (!b || !b.idToken) return json({ error: "bad request" }, 400);

  const id = await verifyIdToken(b.idToken);
  if (!id) return json({ error: "invalid token" }, 401);

  /* ล็อกไว้ก่อนถ้าเดาพลาดมาแล้วหลายครั้ง — ปลดได้โดยแอดมินเท่านั้น (ลบโหนด lineBindFails) */
  let fails = null;
  try { fails = await rtdbGet("lineBindFails/" + id.sub); } catch (e) { return json({ error: "db" }, 502); }
  if (fails && Number(fails.n) >= MAX_FAIL) {
    return json({ error: "ลองผิดหลายครั้งเกินไป กรุณาติดต่อแอดมินเพื่อปลดล็อก" }, 429);
  }

  /* ผูกไปแล้วก็ไม่ต้องถาม PIN ซ้ำ — กันกรณีกดสองครั้ง */
  const already = await rtdbGet("lineLinks/" + id.sub);
  if (already && already.userId) return json({ userId: already.userId, name: already.name || "", token: await tokenForUser(already.userId) });

  let users = null;
  try { users = await rtdbGet("users"); } catch (e) { return json({ error: "db" }, 502); }

  /* เทียบด้วย matchCred ตัวเดียวกับ /api/auth/login — กฎเดียวกับ sfMatchCred ในเว็บเป๊ะ
     ถ้าตรงนี้เพี้ยนจากฝั่งเว็บ จะกลายเป็นว่าเข้าเว็บได้แต่ผูก LINE ไม่ได้ โดยไม่มีใครเดาถูกว่าทำไม */
  const u = matchCred(users, b.username, b.pin);
  if (!u) {
    const n = (fails && Number(fails.n) || 0) + 1;
    await rtdbSet("lineBindFails/" + id.sub, { n, at: new Date().toISOString() }).catch(() => {});
    return json(BAD, 401);
  }

  /* บัญชีหนึ่งคนผูกได้ทีละเครื่องเดียว — ถ้าเคยผูก LINE อื่นไว้ ให้ตัดอันเก่าทิ้ง
     ไม่งั้นโทรศัพท์เครื่องเก่าที่ขายต่อไปแล้วยังได้รับแจ้งเตือนงานอยู่ */
  const patch = {};
  if (u.lineUserId && u.lineUserId !== id.sub) patch["lineLinks/" + u.lineUserId] = null;
  patch["lineLinks/" + id.sub] = { userId: u.id, name: u.name || "", lineName: id.name || "", at: new Date().toISOString() };
  patch["users/" + u.id + "/lineUserId"] = id.sub;
  patch["users/" + u.id + "/lineAt"] = new Date().toISOString();
  patch["lineBindFails/" + id.sub] = null;

  try { await rtdbUpdate("/", patch); } catch (e) { return json({ error: "db" }, 502); }
  return json({ userId: u.id, name: u.name || "", token: await tokenForUser(u) });
}
