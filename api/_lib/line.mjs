/* ============================================================
   flash+solar — ตัวช่วยฝั่งเซิร์ฟเวอร์สำหรับ LINE

   ⚠ ไฟล์นี้ต้อง "ไม่มี dependency" เด็ดขาด
      vercel.json ตั้ง "installCommand": null → Vercel ไม่รัน npm install ให้
      ฉะนั้น require/import แพ็กเกจอะไรก็ตาม = ทุก route ตอบ 500 MODULE_NOT_FOUND ตอน deploy
      ใช้ได้แค่ของที่ Node 20 มีมาให้: fetch (global) และ node:crypto

   โฟลเดอร์ชื่อขึ้นต้นด้วย _ → Vercel ไม่ทำเป็น endpoint ให้ ใช้เป็นไลบรารีอย่างเดียว
   ============================================================ */

import crypto from "node:crypto";

/* ---------- ค่าลับ — อยู่ใน Vercel Environment Variables เท่านั้น ---------- */
export const ENV = {
  token:    () => process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  secret:   () => process.env.LINE_CHANNEL_SECRET || "",
  loginId:  () => process.env.LINE_LOGIN_CHANNEL_ID || "",
  rtdb:     () => (process.env.RTDB_URL || "").replace(/\/+$/, ""),
  cron:     () => process.env.CRON_SECRET || "",
};

/* ---------- ตอบกลับแบบสั้น ---------- */
export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

/* อ่าน body เป็น JSON — คืน null ถ้าพัง ไม่โยน error ให้ route ต้องดักเอง */
export async function body(request) {
  try { return JSON.parse(await request.text() || "{}"); } catch (e) { return null; }
}

/* ================================================================
   Firebase Realtime Database ผ่าน REST
   กฎของฐานข้อมูลตอนนี้เปิดกว้าง (เหมือนที่เบราว์เซอร์เขียนตรงอยู่แล้ว)
   จึงไม่ต้องมี service account — วันที่รัดกฎเมื่อไหร่ ค่อยเซ็น JWT เพิ่มตรงนี้จุดเดียว
   ================================================================ */
const dbUrl = (path) => ENV.rtdb() + "/" + String(path).replace(/^\/+/, "") + ".json";

export async function rtdbGet(path) {
  if (!ENV.rtdb()) throw new Error("RTDB_URL not set");
  const r = await fetch(dbUrl(path));
  if (!r.ok) throw new Error("rtdb get " + r.status);
  return await r.json();
}

/* PATCH = รวมฟิลด์เข้าของเดิม ไม่ทับทั้งก้อน (เท่ากับ .update() ของ SDK) */
export async function rtdbUpdate(path, data) {
  if (!ENV.rtdb()) throw new Error("RTDB_URL not set");
  const r = await fetch(dbUrl(path), {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("rtdb patch " + r.status);
  return true;
}

export async function rtdbSet(path, data) {
  if (!ENV.rtdb()) throw new Error("RTDB_URL not set");
  const r = await fetch(dbUrl(path), {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("rtdb put " + r.status);
  return true;
}

export async function rtdbDelete(path) {
  if (!ENV.rtdb()) throw new Error("RTDB_URL not set");
  await fetch(dbUrl(path), { method: "DELETE" });
  return true;
}

/* ================================================================
   LINE
   ================================================================ */

/* ตรวจ ID token ของ LIFF กับเซิร์ฟเวอร์ LINE
   นี่คือเหตุผลเดียวที่ endpoint พวกนี้ต้องอยู่ฝั่งเซิร์ฟเวอร์ —
   ถ้าปล่อยให้ client บอกเองว่าเป็นใคร ใครก็สวมรอยเป็นคนอื่นได้
   คืน { sub, name, picture } เมื่อผ่าน · คืน null เมื่อไม่ผ่าน */
export async function verifyIdToken(idToken) {
  if (!idToken || !ENV.loginId()) return null;
  try {
    const r = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: String(idToken), client_id: ENV.loginId() }).toString(),
    });
    if (!r.ok) return null;
    const v = await r.json();
    if (!v || !v.sub) return null;
    return { sub: String(v.sub), name: v.name || "", picture: v.picture || "" };
  } catch (e) { return null; }
}

/* ส่งข้อความเข้า LINE — คืน { ok, status } เสมอ ไม่โยน error
   สถานะ 429 = โควตาเดือนนี้หมด แล้วข้อความจะหายไปเงียบ ๆ ฉะนั้นต้องบันทึกผลไว้ทุกครั้ง */
export async function pushMessage(to, messages) {
  if (!to || !ENV.token()) return { ok: false, status: 0, err: "no token/recipient" };
  try {
    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + ENV.token() },
      body: JSON.stringify({ to: String(to), messages }),
    });
    if (r.ok) return { ok: true, status: r.status };
    let err = "";
    try { err = (await r.text() || "").slice(0, 300); } catch (e) {}
    return { ok: false, status: r.status, err };
  } catch (e) { return { ok: false, status: 0, err: String(e && e.message || e).slice(0, 200) }; }
}

/* ตรวจลายเซ็น webhook — ต้องใช้ body ดิบเท่านั้น
   JSON.parse แล้ว stringify ใหม่ให้ไบต์ไม่ตรงเดิม ลายเซ็นจะไม่ผ่าน */
export function verifySignature(rawBody, signature) {
  const secret = ENV.secret();
  if (!secret || !signature) return false;
  const mine = crypto.createHmac("sha256", secret).update(rawBody || "", "utf8").digest("base64");
  const a = Buffer.from(mine), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ================================================================
   วันที่แบบไทย (พ.ศ.)
   ห้ามใช้ toLocaleDateString("th-TH") บนเซิร์ฟเวอร์ — Node ไม่รับประกันว่ามีข้อมูลภาษาไทย
   และบางรันไทม์คืน ค.ศ. บางอันคืน พ.ศ. · บวก 543 เองชัดเจนกว่า
   ================================================================ */
const TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/* วันนี้ตามเวลาไทย (UTC+7) ในรูป YYYY-MM-DD — เซิร์ฟเวอร์ Vercel รันที่ UTC */
export function todayTH() {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

/* "2026-09-13" → "13 ก.ย. 69" */
export function shortTH(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return String(iso || "");
  return Number(m[3]) + " " + TH_MON[Number(m[2]) - 1] + " " + String(Number(m[1]) + 543).slice(2);
}

/* ตอบกลับข้อความที่ผู้ใช้ทักเข้ามา — **ไม่นับโควตา** ต่างจาก push
   อะไรที่ตอบกลับได้ ให้ตอบกลับ อย่าไปใช้ push */
export async function replyMessage(replyToken, messages) {
  if (!replyToken || !ENV.token()) return { ok: false, status: 0 };
  try {
    const r = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + ENV.token() },
      body: JSON.stringify({ replyToken, messages }),
    });
    return { ok: r.ok, status: r.status };
  } catch (e) { return { ok: false, status: 0 }; }
}
