/* ============================================================
   GET /api/cron/clockout   →  เตือนลืมลงเวลาออกงาน 18:00 น. ไทย (= 11:00 UTC)

   คนที่ลงเวลาเข้างานวันนี้แล้วแต่ยังไม่ได้ลงเวลาออก ได้การ์ดหนึ่งใบ กดแล้วเข้าหน้าลงเวลาในแอปไลน์
   คนที่ออกงานแล้ว / ไม่ได้เข้างาน / ลาอยู่ ไม่ได้อะไร — ไม่มีเรื่อง = ไม่ส่ง (โควตา OA แผนฟรีราว 300/เดือน)

   ⚠ Vercel แผน Hobby ยิง cron แม่นแค่ระดับชั่วโมง — อาจมาถึงช่วง 18:00–18:59
   ปิดได้ที่สวิตช์ "เตือนเรื่องลงเวลา" (kinds.attend) ในหน้าตั้งค่าแจ้งเตือนไลน์ ตัวเดียวกับสรุปตอนเย็น
   ป้องกันแบบเดียวกับ daily.mjs: Authorization: Bearer $CRON_SECRET · กันยิงซ้ำด้วย cronRun/clockout-{วันที่}
   ============================================================ */

import { ENV, json, rtdbGet, rtdbSet, pushMessage, todayTH, shortTH } from "../_lib/line.mjs";
import { flexDigest, pushCard } from "../_lib/flex.mjs";

export async function GET(request) {
  if (!ENV.token() || !ENV.rtdb()) return json({ error: "server not configured" }, 500);

  const want = ENV.cron();
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!want || got !== want) return json({ error: "unauthorized" }, 401);

  const date = todayTH();
  const runKey = "cronRun/clockout-" + date;
  const done = await rtdbGet(runKey).catch(() => null);
  if (done) return json({ skipped: "already", date });

  const allow = await rtdbGet("config/linePush").catch(() => null);
  if (allow && allow.kinds && !allow.kinds.attend) {
    await rtdbSet(runKey, { at: new Date().toISOString(), skipped: "kind off" }).catch(() => {});
    return json({ skipped: "kind:attend", date });
  }

  let users = null, day = null;
  try {
    users = await rtdbGet("users");
    day   = await rtdbGet("attendDay/" + date).catch(() => null);
  } catch (e) { return json({ error: "db" }, 502); }

  const list = (users && typeof users === "object" ? Object.values(users) : [])
    .filter((u) => u && u.active !== false && u.lineUserId);
  const dayRows = (day && typeof day === "object") ? day : {};

  const results = [];
  for (const u of list) {
    const d = dayRows[u.id];
    if (!d || !d.in || d.out) continue;
    /* ผู้ใช้สั่ง 2026-10-10: ในการ์ดเหลือบรรทัดเดียวพอ (ตัดคำแนะนำกดปุ่ม/OT ออก) */
    const lines = ["วันนี้ยังไม่ได้ลงเวลาออกงาน (เข้างาน " + d.in + ")"];
    const text = ["⏰ ลืมลงเวลาออกงานหรือเปล่า? " + shortTH(date)].concat(lines).join("\n");
    const r = await pushCard(pushMessage, u.lineUserId, flexDigest(shortTH(date), lines, "⏰  ลืมลงเวลาออกงานหรือเปล่า?"), text);
    results.push({ userId: u.id, ok: r.ok, status: r.status, err: r.err || "", fellback: !!r.fellback });
  }

  const at = new Date().toISOString();
  if (results.length) {
    await rtdbSet("lnPushLog/N-" + Date.now().toString(36) + "-clockout", {
      at, kind: "attend", n: results.length, ok: results.filter((x) => x.ok).length, results,
    }).catch(() => {});
  }
  await rtdbSet(runKey, { at, n: results.length, ok: results.filter((x) => x.ok).length }).catch(() => {});

  return json({ date, sent: results.filter((x) => x.ok).length, of: results.length });
}
