/* ============================================================
   POST /api/fusionsolar/sync   { job: "all"|"sites"|"kpi"|"hist", dryRun: true|false }
   POST /api/fusionsolar/sync   { job: "refresh" }  — ทุกบัญชีที่ล็อกอิน: หน้าไซต์ทั้งหมดเรียกตอนเปิดดู
     ข้อมูลผลิตเก่ากว่า REFRESH_MS → ซิงก์ kpi รอบจริง (ตัวนี้ตัดสินเอง ฝั่งเว็บสั่งถี่แค่ไหนก็ไม่ยิง Huawei เกิน)
     Authorization: Bearer <Firebase ID token>  (FBAUTH.currentUser.getIdToken())
   GET  /api/fusionsolar/sync   →  { configured }   (ตั้ง env ครบหรือยัง — ไม่บอกค่า)

   ปุ่ม "ทดลอง (dry run)" / "ซิงก์ตอนนี้" ในหน้า log การซิงก์ — เฉพาะบัญชีตำแหน่งแอดมิน
   ตำแหน่งอ่านจาก users/<uid> ล่าสุด ไม่เชื่อ claim ใน token (ปลดแอดมินแล้วมีผลทันที)
   dry run = ยิง FusionSolar จริงแต่ไม่เขียนฐานข้อมูลเลย คืนรายชื่อที่จะสร้าง/อัปเดต/ไม่พบ
   รอบจริงครั้งแรกจากปุ่มนี้ = อนุมัติให้ cron เริ่มทำงาน (fsState/approved_at)
   ============================================================ */

import { ENV, json, body, rtdbGet, rtdbUpdate, rolesOf } from "../_lib/line.mjs";
import { verifyFirebaseIdToken } from "../_lib/gauth.mjs";
import { fsReady, runSync } from "../_lib/fusionsolar.mjs";

const REFRESH_MS = 10 * 60e3;

export async function GET() {
  return json({ configured: fsReady() && !!ENV.rtdb() });
}

export async function POST(request) {
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  const tok = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const who = await verifyFirebaseIdToken(tok).catch(() => null);
  if (!who) return json({ error: "ต้องล็อกอินก่อน" }, 401);
  const u = await rtdbGet("users/" + who.uid.replace(/[.#$\[\]\/]/g, "")).catch(() => null);
  if (!u || u.active === false) return json({ error: "บัญชีถูกปิด" }, 403);
  if (!fsReady()) return json({ error: "ยังไม่ได้ตั้ง FUSIONSOLAR_USER / FUSIONSOLAR_PASS", need_env: true }, 503);
  const b = (await body(request)) || {};

  if (b.job === "refresh") {
    const st = (await rtdbGet("fsState").catch(() => null)) || {};
    if (!st.approved_at) return json({ ran: false, why: "not_approved" });
    const age = Date.now() - (Date.parse(st.last_kpi_at || "") || 0);
    if (age < REFRESH_MS) return json({ ran: false, why: "fresh", last_kpi_at: st.last_kpi_at });
    if (st.blocked_until && Date.parse(st.blocked_until) > Date.now()) return json({ ran: false, why: "blocked" });
    if (st.lock && Date.now() - Date.parse(st.lock.at) < 90e3) return json({ ran: false, why: "busy" });
    /* พักระหว่างความพยายาม (refresh_at) — รอบพัง (เช่นล็อกอินไม่ผ่าน) last_kpi_at ไม่ขยับ ถ้าไม่มีตัวนี้ทุกคนที่เปิดหน้าจะยิงซ้ำจนบัญชี Huawei โดนล็อก */
    if (Date.now() - (Date.parse(st.refresh_at || "") || 0) < REFRESH_MS) return json({ ran: false, why: "cooldown" });
    await rtdbUpdate("fsState", { refresh_at: new Date().toISOString() });
    const r = await runSync({ job: "kpi", dryRun: false, trigger: "view", by: u.name || u.id || who.uid });
    return json({ ran: !r.skipped, ok: r.log.ok });
  }

  if (!rolesOf(u).includes("admin")) return json({ error: "เฉพาะแอดมิน" }, 403);
  const dryRun = b.dryRun !== false;
  const r = await runSync({ job: b.job, dryRun, trigger: "manual", by: u.name || u.id || who.uid, approve: !dryRun });
  return json(r);
}
