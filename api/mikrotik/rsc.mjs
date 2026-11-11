/* ============================================================
   GET /api/mikrotik/rsc?t=<โทเคนใช้ครั้งเดียว>  →  สคริปต์ .rsc ของไซต์ (text/plain)
   ให้ hEX ดึงเองด้วย /tool fetch (คำสั่งบรรทัดเดียวจากหน้า "ไซต์ MikroTik") — docs/mikrotik.md
   ไม่มีล็อกอิน (เราเตอร์ไม่มีบัญชีเว็บ) — โทเคนออกโดยแอดมินผ่าน /api/mikrotik/site {action:"fetch-token"}
   สุ่ม 256 บิต · ใช้ได้ครั้งเดียว · 15 นาที · ผิด/หมดอายุ/ใช้แล้ว = 404 เหมือนกันหมด (ไม่บอกว่าเพราะอะไร)
   ============================================================ */

import { ENV, rtdbGet, rtdbUpdate } from "../_lib/line.mjs";
import { claimFetchToken, scriptFor } from "../_lib/mtstore.mjs";

const text = (s, status = 200) =>
  new Response(s, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });

export async function GET(request) {
  if (!ENV.rtdb()) return text("# not configured\r\n", 503);
  const t = new URL(request.url).searchParams.get("t") || "";
  const n = await claimFetchToken(t).catch(() => null);
  /* ตอบเป็นคำสั่ง :error — ถ้า hEX ดึงได้แต่โทเคนใช้ไม่ได้ /import จะหยุดพร้อมบอกเหตุ ไม่ใช่รันไฟล์ว่าง */
  const fail = (msg, status) => text(`:error "${msg}"\r\n`, status);
  if (!n) return fail("link expired or already used - create a new command on the web", 404);
  const site = await rtdbGet("mtSites/" + n).catch(() => null);
  if (!site) return fail("site not found", 404);
  const r = await scriptFor(n, site);
  if (r.error) return fail("server cannot build script - see web", r.status || 500);
  await rtdbUpdate("mtSites/" + n, { script_at: new Date().toISOString(), script_by: "hEX fetch" }).catch(() => null);
  return text(r.rsc);
}
