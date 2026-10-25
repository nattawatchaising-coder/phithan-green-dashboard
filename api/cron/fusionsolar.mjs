/* ============================================================
   GET /api/cron/fusionsolar?job=all|sites|kpi   →  ซิงก์ FusionSolar อัตโนมัติ (docs/fusionsolar.md)

   ผู้เรียก:
   - Vercel cron วันละครั้ง (vercel.json · ไม่ใส่ job = "all": ไซต์+อุปกรณ์ แล้วข้อมูลผลิต)
     Vercel Hobby ตั้ง cron ได้วันละครั้งต่อรายการเท่านั้น — ตั้งรายชั่วโมงแล้ว deploy ไม่ผ่าน
   - GitHub Actions ทุกชั่วโมง (.github/workflows/fusionsolar-kpi.yml) → ?job=kpi&src=gh

   Authorization: Bearer $CRON_SECRET เหมือน cron ตัวอื่น
   ยังไม่มีแอดมินกด "ซิงก์จริง" ครั้งแรก (fsState/approved_at) = ไม่ทำอะไร — รอบแรกต้อง dry run ก่อน (สเปกข้อ 7)
   ============================================================ */

import { ENV, json, rtdbGet } from "../_lib/line.mjs";
import { fsReady, runSync } from "../_lib/fusionsolar.mjs";

export async function GET(request) {
  const want = ENV.cron();
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!want || got !== want) return json({ error: "unauthorized" }, 401);
  if (!ENV.rtdb()) return json({ error: "RTDB_URL not set" }, 503);
  if (!fsReady()) return json({ error: "FUSIONSOLAR_USER / FUSIONSOLAR_PASS not set" }, 503);

  const u = new URL(request.url);
  const job = u.searchParams.get("job") || "all";
  const src = (u.searchParams.get("src") || "cron").replace(/[^a-z]/g, "").slice(0, 10) || "cron";

  let state = null;
  try { state = await rtdbGet("fsState"); } catch (e) { return json({ error: "db", detail: String(e.message || e) }, 502); }
  if (!state || !state.approved_at) return json({ skipped: true, why: "รอแอดมินกดซิงก์จริงครั้งแรกในหน้า log การซิงก์ (หลัง dry run)" });

  const r = await runSync({ job, dryRun: false, trigger: src });
  /* ตอบ 502 เมื่อรอบพัง — GitHub Actions จะขึ้นแดงให้เห็น */
  return json({ ok: r.log.ok, skipped: !!r.skipped, log: r.log }, r.log.ok ? 200 : 502);
}
