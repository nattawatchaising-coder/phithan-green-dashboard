/* ============================================================
   POST /api/line/session   { idToken }  →  { bound, userId?, name? }

   หน้า LIFF ถามว่า "บัญชี LINE นี้ผูกกับพนักงานคนไหนแล้วหรือยัง"

   ⚠ ตอบกลับแค่ผลของบัญชีที่ถามมาเท่านั้น — ห้ามส่งรายชื่อผู้ใช้กลับไปเด็ดขาด
      endpoint นี้เปิดอยู่บนอินเทอร์เน็ต ใครก็ยิงได้ ถ้าตอบเป็นรายชื่อ
      ก็เท่ากับแจกบัญชีทั้งบริษัทให้คนเดา PIN
   ============================================================ */

import { ENV, json, body, verifyIdToken, rtdbGet } from "../_lib/line.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return json({ error: "method" }, 405);
  if (!ENV.loginId() || !ENV.rtdb()) return json({ error: "server not configured" }, 500);

  const b = await body(request);
  if (!b || !b.idToken) return json({ error: "bad request" }, 400);

  const id = await verifyIdToken(b.idToken);
  if (!id) return json({ error: "invalid token" }, 401);

  let link = null;
  try { link = await rtdbGet("lineLinks/" + id.sub); } catch (e) { return json({ error: "db" }, 502); }

  if (!link || !link.userId) return json({ bound: false });
  return json({ bound: true, userId: link.userId, name: link.name || "" });
}
