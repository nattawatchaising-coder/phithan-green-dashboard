/* ============================================================
   POST /api/line/webhook   — LINE ยิงเข้ามาเมื่อมีคนแอดเพื่อน บล็อก หรือทักข้อความ

   ต้องมีไฟล์นี้ตั้งแต่วันแรก ไม่งั้นปุ่ม Verify ในคอนโซล LINE Developers ไม่ผ่าน
   (ปุ่มนั้นยิง POST ที่มี events ว่าง พร้อมลายเซ็น — ต้องตอบ 200)

   ทุกอย่างในนี้ตอบด้วย **reply** ซึ่งไม่นับโควตา ต่างจาก push
   ============================================================ */

import { ENV, json, verifySignature, replyMessage, rtdbGet, rtdbUpdate } from "../_lib/line.mjs";

const liffUrl = () => (process.env.LIFF_ID ? "https://liff.line.me/" + process.env.LIFF_ID : "");

/* ชื่อ export ต้องเป็น POST ห้ามใช้ `export default`
   Vercel ตีความ default export ว่าเป็นลายเซ็นเก่า (req, res) => void
   ซึ่ง req เป็น IncomingMessage ไม่มี .text() และค่าที่ return ถูกทิ้ง → 500 ทุกครั้ง
   ตั้งชื่อตามเมธอดแทน จึงได้ Request/Response แบบเว็บมาตรฐาน ที่อ่าน body ดิบได้ */
export async function POST(request) {

  /* ต้องอ่าน body ดิบ ห้าม parse ก่อน — ลายเซ็นคิดจากไบต์ตรง ๆ */
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-line-signature"))) {
    return json({ error: "bad signature" }, 401);
  }

  let payload = null;
  try { payload = JSON.parse(raw || "{}"); } catch (e) { return json({ ok: true }); }
  const events = Array.isArray(payload && payload.events) ? payload.events : [];

  for (const ev of events) {
    const uid = ev && ev.source && ev.source.userId;
    if (!uid) continue;

    if (ev.type === "follow") {
      const link = await rtdbGet("lineLinks/" + uid).catch(() => null);
      const open = liffUrl() ? "\n\nเปิดแอป: " + liffUrl() : "\n\nกดเมนูด้านล่างเพื่อเริ่มใช้งาน";
      await replyMessage(ev.replyToken, [{
        type: "text",
        text: link && link.userId
          ? "ยินดีต้อนรับกลับ คุณ" + (link.name || "") + " บัญชีนี้เชื่อมกับระบบไว้แล้ว" + open
          : "flash+solar — ระบบงานช่าง\n\nครั้งแรกต้องเชื่อมบัญชีก่อน โดยใช้ชื่อผู้ใช้และรหัสผ่านเดียวกับที่เข้าเว็บ" + open,
      }]);
      /* ปลดธงที่ตั้งไว้ตอนบล็อก — คนเดิมกลับมาแล้ว ไม่ต้องให้ผูกใหม่ */
      if (link && link.userId) await rtdbUpdate("lineLinks/" + uid, { blocked: null }).catch(() => {});
      continue;
    }

    if (ev.type === "unfollow") {
      /* **ไม่ลบการผูกทิ้ง** — คนบล็อกแล้วแอดกลับมาใหม่เจอบ่อย ถ้าลบเขาต้องกรอก PIN ใหม่ทุกครั้ง
         แค่ตั้งธงไว้ ให้ /api/line/push ข้ามไปได้ในอนาคตถ้าเริ่มมีปัญหาโควตา */
      await rtdbUpdate("lineLinks/" + uid, { blocked: new Date().toISOString() }).catch(() => {});
      continue;
    }

    if (ev.type === "message" && ev.message && ev.message.type === "text") {
      const open = liffUrl() ? "\nเปิดแอป: " + liffUrl() : "";
      await replyMessage(ev.replyToken, [{
        type: "text",
        text: "บอทนี้ใช้แจ้งเตือนอย่างเดียว ไม่ได้อ่านข้อความนะครับ\nงานทุกอย่างทำที่เมนูด้านล่าง" + open,
      }]);
    }
  }

  return json({ ok: true });
}
