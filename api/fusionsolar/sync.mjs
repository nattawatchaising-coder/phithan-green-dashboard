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
import { iscReady, runIscSync } from "../_lib/isolarcloud.mjs";

const REFRESH_MS = 10 * 60e3;
const fresh = (st) => Date.now() - (Date.parse((st || {}).last_kpi_at || "") || 0) < REFRESH_MS;
const loginWait = (st) => !!(st && st.login_fail && Date.now() - (Date.parse(st.login_fail.at) || 0) < 60 * 60e3);

export async function GET() {
  return json({ configured: (fsReady() || iscReady()) && !!ENV.rtdb(), fusionsolar: fsReady(), isolarcloud: iscReady() });
}

export async function POST(request) {
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  const tok = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const who = await verifyFirebaseIdToken(tok).catch(() => null);
  if (!who) return json({ error: "ต้องล็อกอินก่อน" }, 401);
  const u = await rtdbGet("users/" + who.uid.replace(/[.#$\[\]\/]/g, "")).catch(() => null);
  if (!u || u.active === false) return json({ error: "บัญชีถูกปิด" }, 403);
  const b = (await body(request)) || {};
  const by = u.name || u.id || who.uid;

  if (b.job === "refresh") {
    const st = (await rtdbGet("fsState").catch(() => null)) || {};
    /* แต่ละยี่ห้อตัดสินเอง — ยี่ห้อหนึ่งพัง/ยังสด ไม่ขวางอีกยี่ห้อ · ทำคู่ขนาน */
    const fsWhy = !fsReady() ? "no_env" : !st.approved_at ? "not_approved" : fresh(st) ? "fresh"
      : st.blocked_until && Date.parse(st.blocked_until) > Date.now() ? "blocked"
      : st.lock && Date.now() - Date.parse(st.lock.at) < 90e3 ? "busy"
      /* ล็อกอิน Huawei พลาดภายในชั่วโมง (เช่นบัญชีหมดอายุ) — คนเปิดหน้าไม่ต้องยิงซ้ำ รอ cron/แอดมิน (runSync ก็กันซ้ำอีกชั้น) */
      : loginWait(st) ? "login_fail"
      /* พักระหว่างความพยายาม (refresh_at) — รอบพัง last_kpi_at ไม่ขยับ ถ้าไม่มีตัวนี้ทุกคนที่เปิดหน้าจะยิงซ้ำจนบัญชีโดนล็อก */
      : Date.now() - (Date.parse(st.refresh_at || "") || 0) < REFRESH_MS ? "cooldown" : "";
    const si = st.isc || {};
    const iscWhy = !iscReady() ? "no_env" : !si.approved_at ? "not_approved" : fresh(si) ? "fresh"
      : si.lock && Date.now() - Date.parse(si.lock.at) < 90e3 ? "busy" : loginWait(si) ? "login_fail"
      : Date.now() - (Date.parse(si.refresh_at || "") || 0) < REFRESH_MS ? "cooldown" : "";
    const now = new Date().toISOString();
    if (!fsWhy) await rtdbUpdate("fsState", { refresh_at: now });
    if (!iscWhy) await rtdbUpdate("fsState/isc", { refresh_at: now });
    const [r, ri] = await Promise.all([
      fsWhy ? null : runSync({ job: "kpi", dryRun: false, trigger: "view", by }),
      iscWhy ? null : runIscSync({ job: "kpi", dryRun: false, trigger: "view", by }).catch(() => null),
    ]);
    return json({ ran: !!(r && !r.skipped) || !!(ri && !ri.skipped), ok: (!r || r.log.ok) && (!ri || ri.log.ok), why: fsWhy || undefined, isc_why: iscWhy || undefined });
  }

  if (!rolesOf(u).includes("admin")) return json({ error: "เฉพาะแอดมิน" }, 403);
  const dryRun = b.dryRun !== false;
  /* ปุ่มแอดมิน Sungrow: job "isc_sites" | "isc_kpi" · รอบจริงครั้งแรก = อนุมัติให้ซิงก์อัตโนมัติ (fsState/isc/approved_at) */
  if (String(b.job || "").startsWith("isc_")) {
    if (!iscReady()) return json({ error: "ยังไม่ได้ตั้ง ISOLARCLOUD_APPKEY / ACCESS_KEY / RSA_KEY / USER / PASS ใน Vercel", need_env: true }, 503);
    return json(await runIscSync({ job: b.job.slice(4), dryRun, trigger: "manual", by, approve: !dryRun }));
  }
  if (!fsReady()) return json({ error: "ยังไม่ได้ตั้ง FUSIONSOLAR_USER / FUSIONSOLAR_PASS", need_env: true }, 503);
  const r = await runSync({ job: b.job, dryRun, trigger: "manual", by, approve: !dryRun });
  return json(r);
}
