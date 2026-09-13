/* ============================================================
   GET /api/cron/daily   →  สรุปตอนเย็นวันละครั้ง (20:30 น. ไทย = 13:30 UTC)

   ── ทำไมต้องมี ──
   เรื่องอื่นทั้งหมดในระบบนี้เกิดจาก "มีคนกดอะไรสักอย่างในหน้าเว็บ" จึงยิง push ได้ทันที
   แต่เรื่องพวกนี้เกิดจาก **การไม่ทำ** — ลืมกดออกงาน · ใบ OT ที่ไม่มีใครไปกด
   ไม่มีเหตุการณ์ไหนให้เกาะ ตอน 20:30 ก็ไม่มีเบราว์เซอร์ของใครเปิดอยู่ ต้องมีตัวจับเวลา

   ── ทำไมรวมเป็นข้อความเดียวต่อคน ──
   โควตา OA แผนฟรีราว 300 ข้อความ/เดือน · คน 15 คน ถ้าส่งแยกเรื่องละข้อความ
   วันเดียวก็ 30 ข้อความ = หมดโควตาภายในสิบวัน แล้วข้อความสำคัญจะหายเงียบ
   ฉะนั้น: หนึ่งคน = อย่างมากหนึ่งข้อความต่อวัน ไม่มีเรื่องให้เตือน = ไม่ส่ง

   ── ป้องกัน ──
   Vercel Cron ยิงมาพร้อมหัว `Authorization: Bearer $CRON_SECRET`
   ถ้าไม่ตรง ตอบ 401 — URL นี้เปิดสู่อินเทอร์เน็ต ใครก็ยิงได้

   ⚠ ไม่มี dependency (installCommand: null) — ดูเหตุผลที่หัว _lib/line.mjs
   ============================================================ */

import { ENV, json, rtdbGet, rtdbSet, pushMessage, todayTH, shortTH } from "../_lib/line.mjs";

/* แปลงนาทีเป็น "3 ชม. 30 น." — สำเนาเล็ก ๆ ของ tmDur (dashboard/attend.jsx)
   ตั้งใจไม่ import ข้ามฝั่ง เพราะโค้ดฝั่งหน้าเว็บเป็น JSX ที่ยังไม่ผ่าน build */
function dur(mins) {
  const m = Math.max(0, Math.round(+mins || 0));
  if (!m) return "0 น.";
  const h = Math.floor(m / 60), r = m % 60;
  return (h ? h + " ชม." : "") + (h && r ? " " : "") + (r ? r + " น." : "");
}

/* ชื่อ export ต้องเป็น GET ห้ามใช้ `export default` — ดูเหตุผลที่หัว api/line/push.mjs
   Vercel Cron ยิงด้วยเมธอด GET เสมอ */
export async function GET(request) {
  if (!ENV.token() || !ENV.rtdb()) return json({ error: "server not configured" }, 500);

  /* ไม่ได้ตั้ง CRON_SECRET = ปฏิเสธทุกคำขอ ไม่ใช่ปล่อยผ่าน
     ค่าที่ลืมตั้งต้องทำให้ของไม่ทำงาน ไม่ใช่ทำให้ของเปิดโล่ง */
  const want = ENV.cron();
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!want || got !== want) return json({ error: "unauthorized" }, 401);

  const date = todayTH();

  /* กันยิงซ้ำในวันเดียวกัน — Vercel อาจยิงซ้ำได้ และโควตาแพงเกินกว่าจะปล่อย */
  const done = await rtdbGet("cronRun/" + date).catch(() => null);
  if (done) return json({ skipped: "already", date });

  let users = null, day = null, ot = null;
  try {
    users = await rtdbGet("users");
    day   = await rtdbGet("attendDay/" + date).catch(() => null);
    ot    = await rtdbGet("tmOt").catch(() => null);
  } catch (e) { return json({ error: "db" }, 502); }

  const list = (users && typeof users === "object" ? Object.values(users) : [])
    .filter((u) => u && u.active !== false && u.lineUserId);
  const dayRows = (day && typeof day === "object") ? day : {};
  const otRows = (ot && typeof ot === "object") ? Object.values(ot) : [];

  /* ── ชนิดนี้ถูกปิดไว้ไหม ── อ่านจาก config/linePush ตัวเดียวกับที่หน้าแอดมินเขียน
     (ปิดที่นี่ = ปิดทั้งเรื่องสรุปตอนเย็น ไม่ต้อง deploy ใหม่) */
  const allow = await rtdbGet("config/linePush").catch(() => null);
  if (allow && allow.kinds && !allow.kinds.attend) {
    await rtdbSet("cronRun/" + date, { at: new Date().toISOString(), skipped: "kind off" }).catch(() => {});
    return json({ skipped: "kind:attend", date });
  }

  const results = [];
  for (const u of list) {
    const lines = [];

    /* 1. เข้างานแล้วยังไม่ได้ออกงาน — เวลาที่หายไปแก้ย้อนหลังยากกว่ากดตอนนี้มาก */
    const d = dayRows[u.id];
    if (d && d.in && !d.out) lines.push("• ยังไม่ได้ลงเวลาออกงาน (เข้างาน " + d.in + ")");

    /* 2. ใบ OT ที่รอ "คนนี้" ตัดสิน — ใบค้างเงียบคือปัญหาของคนขอ ไม่ใช่ของคนอนุมัติ */
    const waiting = otRows.filter((r) => r && r.status === "sent" && r.approverId === u.id);
    if (waiting.length) {
      lines.push("• มีใบขอ OT รออนุมัติ " + waiting.length + " ใบ");
      waiting.slice(0, 3).forEach((r) => {
        lines.push("   – " + (r.userName || "") + " · " + shortTH(r.date) + " " + r.from + "-" + r.to + " · " + dur(r.mins));
      });
    }

    /* 3. ใบ OT ของตัวเองที่ยังเป็นร่าง — กรอกค้างไว้แล้วลืมกดส่ง เจอบ่อยกว่าที่คิด */
    const drafts = otRows.filter((r) => r && r.status === "draft" && r.userId === u.id);
    if (drafts.length) lines.push("• ใบขอ OT ค้างเป็นร่างอยู่ " + drafts.length + " ใบ ยังไม่ได้ส่ง");

    if (!lines.length) continue;

    const text = ["📍 สรุปตอนเย็น " + shortTH(date)].concat(lines).join("\n");
    const r = await pushMessage(u.lineUserId, [{ type: "text", text: text.slice(0, 4900) }]);
    results.push({ userId: u.id, ok: r.ok, status: r.status, err: r.err || "" });
  }

  const at = new Date().toISOString();
  /* บันทึกลงบัญชีเดียวกับ push ปกติ เพื่อให้ตัวนับโควตารายเดือนในหน้าแอดมินนับรวมด้วย
     คีย์ขึ้นต้น N- และมีเวลาแบบ base36 เหมือนกัน จะได้อยู่ในช่วง limitToLast เดียวกัน */
  if (results.length) {
    await rtdbSet("lnPushLog/N-" + Date.now().toString(36) + "-cron", {
      at, kind: "attend", n: results.length, ok: results.filter((x) => x.ok).length, results,
    }).catch(() => {});
  }
  await rtdbSet("cronRun/" + date, { at, n: results.length, ok: results.filter((x) => x.ok).length }).catch(() => {});

  return json({ date, sent: results.filter((x) => x.ok).length, of: results.length });
}
