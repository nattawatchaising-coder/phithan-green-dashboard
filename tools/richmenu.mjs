/* ============================================================
   อัปเมนูล่าง (rich menu) ขึ้น LINE — รันมือ ไม่ใช่ส่วนหนึ่งของเว็บ

   วิธีใช้ (PowerShell):
     $env:LINE_CHANNEL_ACCESS_TOKEN="<token ของช่อง Messaging API>"
     $env:LN_LIFF_ID="2011577974-yzS9mgQQ"
     node tools/richmenu.mjs

   คำสั่งอื่น:
     node tools/richmenu.mjs list     ดูเมนูที่มีอยู่บน LINE
     node tools/richmenu.mjs clear    ถอดเมนูดีฟอลต์ออก (แชทกลับเป็นแบบไม่มีเมนู)

   ⚠ ห้ามฝังค่า token ไว้ในไฟล์นี้ — repo นี้เป็นสาธารณะ
   ⚠ ไม่มี dependency เช่นเดียวกับโค้ดใน /api ใช้แค่ fetch กับ node:fs

   ── สิ่งที่สคริปต์นี้ทำ ──
   1. สร้างโครงเมนู 4 ช่อง (2x2) ทุกช่องเป็น action แบบ uri ชี้ไปหน้า LIFF พร้อม ?tab=
   2. อัปโหลดรูป tools/richmenu.png (2500x1686 — สร้างด้วย tools/richmenu-image.py)
   3. ตั้งเป็นเมนูดีฟอลต์ของทุกคน
   4. ลบเมนูเก่าที่สคริปต์นี้เคยสร้างไว้ (ดูจากชื่อ) — ไม่งั้นจะค้างสะสมทีละอัน
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
const LIFF  = (process.env.LN_LIFF_ID || "2011577974-yzS9mgQQ").trim();
const NAME  = "flashsolar-main-v2";   /* ชื่อไว้ให้จำตัวเองได้ตอนลบของเก่า */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG  = path.join(root, "tools", "richmenu.png");

const W = 2500, H = 1686, CW = W / 2, CH = H / 2;
const liffUrl = (tab) => "https://liff.line.me/" + LIFF + "?tab=" + tab;

/* ช่องเรียงซ้ายบน → ขวาบน → ซ้ายล่าง → ขวาล่าง ต้องตรงกับ CELLS ใน richmenu-image.py
   ถ้าสองไฟล์นี้หลุดจากกัน ปุ่มจะพาไปคนละที่กับที่รูปเขียนไว้ — เป็นบั๊กที่มองไม่เห็นจากโค้ด */
const AREAS = [
  { tab: "time", label: "ลงเวลา",    x: 0,  y: 0 },
  { tab: "jobs", label: "งานของฉัน", x: CW, y: 0 },
  { tab: "ot",   label: "ขอ OT",     x: 0,  y: CH },
  { tab: "bell", label: "แจ้งเตือน", x: CW, y: CH },
];

const MENU = {
  size: { width: W, height: H },
  selected: true,
  name: NAME,
  chatBarText: "เมนูงาน",     /* ตัวหนังสือบนแถบที่ผู้ใช้กดเพื่อเปิดเมนู — ยาวได้ 14 ตัว */
  areas: AREAS.map((a) => ({
    bounds: { x: a.x, y: a.y, width: CW, height: CH },
    action: { type: "uri", label: a.label, uri: liffUrl(a.tab) },
  })),
};

const api = (p, opt) => fetch("https://api.line.me/v2/bot" + p,
  Object.assign({ headers: { authorization: "Bearer " + TOKEN } }, opt || {}));

async function readJson(r) { try { return JSON.parse(await r.text() || "{}"); } catch (e) { return {}; } }

async function list() {
  const r = await api("/richmenu/list");
  const v = await readJson(r);
  if (!r.ok) { console.error("อ่านรายการไม่สำเร็จ " + r.status + " · " + JSON.stringify(v)); process.exit(1); }
  return v.richmenus || [];
}

async function main() {
  if (!TOKEN) {
    console.error("ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN — ค่านี้ต้องมาจาก environment เท่านั้น");
    process.exit(1);
  }
  const cmd = (process.argv[2] || "deploy").toLowerCase();

  if (cmd === "list") {
    (await list()).forEach((m) => console.log(m.richMenuId + "  " + (m.name || "-") + "  " + (m.size || {}).width + "x" + (m.size || {}).height));
    return;
  }

  if (cmd === "clear") {
    const r = await api("/user/all/richmenu", { method: "DELETE" });
    console.log(r.ok ? "ถอดเมนูดีฟอลต์ออกแล้ว" : "ถอดไม่สำเร็จ " + r.status);
    return;
  }

  if (!fs.existsSync(IMG)) {
    console.error("ไม่พบไฟล์รูป " + IMG + " — สร้างด้วย  python tools/richmenu-image.py");
    process.exit(1);
  }

  /* 1. สร้างโครง */
  const cr = await api("/richmenu", {
    method: "POST",
    headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json" },
    body: JSON.stringify(MENU),
  });
  const cv = await readJson(cr);
  if (!cr.ok || !cv.richMenuId) {
    console.error("สร้างเมนูไม่สำเร็จ " + cr.status + " · " + JSON.stringify(cv));
    process.exit(1);
  }
  const id = cv.richMenuId;
  console.log("สร้างเมนูแล้ว " + id);

  /* 2. อัปรูป — โฮสต์คนละตัวกับ API ปกติ (api-data.line.me) ถ้าใช้ api.line.me จะได้ 404 */
  const ur = await fetch("https://api-data.line.me/v2/bot/richmenu/" + id + "/content", {
    method: "POST",
    headers: { authorization: "Bearer " + TOKEN, "content-type": "image/png" },
    body: fs.readFileSync(IMG),
  });
  if (!ur.ok) {
    console.error("อัปรูปไม่สำเร็จ " + ur.status + " · " + (await ur.text().catch(() => "")).slice(0, 300));
    await api("/richmenu/" + id, { method: "DELETE" });   /* เมนูที่ไม่มีรูปใช้ไม่ได้ ลบทิ้งดีกว่าปล่อยค้าง */
    process.exit(1);
  }
  console.log("อัปรูปแล้ว");

  /* 3. ตั้งเป็นดีฟอลต์ของทุกคน */
  const sr = await api("/user/all/richmenu/" + id, { method: "POST" });
  if (!sr.ok) {
    console.error("ตั้งเป็นเมนูดีฟอลต์ไม่สำเร็จ " + sr.status + " · " + (await sr.text().catch(() => "")).slice(0, 300));
    process.exit(1);
  }
  console.log("ตั้งเป็นเมนูดีฟอลต์แล้ว");

  /* 4. เก็บกวาดของเก่า — ทำหลังตั้งดีฟอลต์สำเร็จเท่านั้น
        ถ้าลบก่อนแล้วขั้นบนพลาด ผู้ใช้จะเหลือแชทที่ไม่มีเมนูเลย */
  for (const m of await list()) {
    if (m.richMenuId === id) continue;
    if (m.name !== NAME) continue;
    const dr = await api("/richmenu/" + m.richMenuId, { method: "DELETE" });
    console.log((dr.ok ? "ลบเมนูเก่า " : "ลบเมนูเก่าไม่สำเร็จ ") + m.richMenuId);
  }

  console.log("\nเสร็จแล้ว — ปิดแล้วเปิดห้องแชทของ OA ใหม่ ถ้าเมนูยังไม่ขึ้น");
}

main().catch((e) => { console.error(e && e.message || e); process.exit(1); });
