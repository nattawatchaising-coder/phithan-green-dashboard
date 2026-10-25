/* ============================================================
   POST /api/fusionsolar/sync   { job: "all"|"sites"|"kpi", dryRun: true|false }
     Authorization: Bearer <Firebase ID token>  (FBAUTH.currentUser.getIdToken())
   GET  /api/fusionsolar/sync   →  { configured }   (ตั้ง env ครบหรือยัง — ไม่บอกค่า)

   ปุ่ม "ทดลอง (dry run)" / "ซิงก์ตอนนี้" ในหน้า log การซิงก์ — เฉพาะบัญชีตำแหน่งแอดมิน
   ตำแหน่งอ่านจาก users/<uid> ล่าสุด ไม่เชื่อ claim ใน token (ปลดแอดมินแล้วมีผลทันที)
   dry run = ยิง FusionSolar จริงแต่ไม่เขียนฐานข้อมูลเลย คืนรายชื่อที่จะสร้าง/อัปเดต/ไม่พบ
   รอบจริงครั้งแรกจากปุ่มนี้ = อนุมัติให้ cron เริ่มทำงาน (fsState/approved_at)
   ============================================================ */

import { ENV, json, body, rtdbGet, rolesOf } from "../_lib/line.mjs";
import { verifyFirebaseIdToken } from "../_lib/gauth.mjs";
import { fsReady, runSync } from "../_lib/fusionsolar.mjs";

export async function GET() {
  return json({ configured: fsReady() && !!ENV.rtdb() });
}

export async function POST(request) {
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  const tok = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const who = await verifyFirebaseIdToken(tok).catch(() => null);
  if (!who) return json({ error: "ต้องล็อกอินก่อน" }, 401);
  const u = await rtdbGet("users/" + who.uid.replace(/[.#$\[\]\/]/g, "")).catch(() => null);
  if (!u || u.active === false || !rolesOf(u).includes("admin")) return json({ error: "เฉพาะแอดมิน" }, 403);
  if (!fsReady()) return json({ error: "ยังไม่ได้ตั้ง FUSIONSOLAR_USER / FUSIONSOLAR_PASS", need_env: true }, 503);

  const b = (await body(request)) || {};
  const dryRun = b.dryRun !== false;
  const r = await runSync({ job: b.job, dryRun, trigger: "manual", by: u.name || u.id || who.uid, approve: !dryRun });
  return json(r);
}
