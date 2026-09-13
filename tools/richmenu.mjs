/* ============================================================
   อัปเมนูล่าง (rich menu) ขึ้น LINE — สองหน้าสลับกันได้ · รันมือ ไม่ใช่ส่วนหนึ่งของเว็บ

   วิธีใช้ (PowerShell):
     $env:LINE_CHANNEL_ACCESS_TOKEN="<token ของช่อง Messaging API>"
     $env:LN_LIFF_ID="2011577974-yzS9mgQQ"
     node tools/richmenu.mjs

   คำสั่งอื่น:
     node tools/richmenu.mjs list     ดูเมนูกับ alias ที่มีอยู่บน LINE
     node tools/richmenu.mjs clear    ถอดเมนูดีฟอลต์ออก (แชทกลับเป็นแบบไม่มีเมนู)

   ⚠ ห้ามฝังค่า token ไว้ในไฟล์นี้ — repo นี้เป็นสาธารณะ
   ⚠ ไม่มี dependency เช่นเดียวกับโค้ดใน /api ใช้แค่ fetch กับ node:fs

   ── โครงเมนู ──
   หน้า 1  ลงเวลา · งานของฉัน · รายงานประจำวัน · [ไปหน้า 2]
   หน้า 2  ขอ OT · เบิกเงิน · แจ้งเตือน · [กลับหน้า 1]
   แถบล่างของทั้งสองหน้า = โลโก้ + เปิดเว็บเต็มจอ (เปิดแดชบอร์ดในเบราว์เซอร์)

   ปุ่มสลับหน้าใช้ action แบบ richmenuswitch ซึ่งอ้าง "alias" ไม่ใช่ id ของเมนู
   ข้อดีคืออัปเมนูใหม่แล้วชี้ alias เดิมไปที่ id ใหม่ ปุ่มสลับก็ยังทำงาน
   โดยไม่ต้องแก้ปุ่มในเมนูอีกหน้า

   ── ลำดับที่สคริปต์นี้ทำ (ลำดับสำคัญ) ──
   1. สร้างเมนูทั้งสองหน้า + อัปรูปของแต่ละหน้า
   2. ชี้ alias ไปที่เมนูใหม่ (มีอยู่แล้วก็เขียนทับ)
   3. ตั้งหน้า 1 เป็นเมนูดีฟอลต์ของทุกคน
   4. ลบเมนูเก่าที่สคริปต์นี้เคยสร้าง — ทำหลังสำเร็จเท่านั้น
      ถ้าลบก่อนแล้วขั้นบนพลาด ผู้ใช้จะเหลือแชทที่ไม่มีเมนูเลย
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN = (process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
const LIFF  = (process.env.LN_LIFF_ID || "2011577974-yzS9mgQQ").trim();
const WEB   = (process.env.LN_WEB_URL || "https://flashsolar.vercel.app").trim();
const TAG   = "flashsolar-v3";   /* ขึ้นต้นชื่อเมนู ไว้ให้จำของตัวเองได้ตอนลบของเก่า */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const img  = (n) => path.join(root, "tools", "richmenu-" + n + ".png");

/* ต้องตรงกับ tools/richmenu-image.py เป๊ะ — ถ้าสองไฟล์นี้หลุดจากกัน
   ปุ่มจะพาไปคนละที่กับที่รูปเขียนไว้ ซึ่งเป็นบั๊กที่มองไม่เห็นจากโค้ด */
const W = 2500, H = 1686, BAR = 300;
const CW = W / 2, CH = (H - BAR) / 2;

const liffUrl = (tab) => "https://liff.line.me/" + LIFF + "?tab=" + tab;
const ALIAS = { p1: "flashsolar-p1", p2: "flashsolar-p2" };

const cell = (i) => ({ x: (i % 2) * CW, y: Math.floor(i / 2) * CH, width: CW, height: CH });
const tab = (i, label, t) => ({ bounds: cell(i), action: { type: "uri", label: label, uri: liffUrl(t) } });
const swit = (i, label, to) => ({ bounds: cell(i),
  action: { type: "richmenuswitch", label: label, richMenuAliasId: ALIAS[to], data: "menu=" + to } });
/* แถบล่างเต็มความกว้าง — เปิดแดชบอร์ดในเบราว์เซอร์ ไม่ใช่หน้า LIFF
   งานที่ต้องดูจอใหญ่ (อนุมัติ · พิมพ์ใบ A4 · ตารางรายเดือน) ทำในไลน์ไม่ไหว */
const webBar = { bounds: { x: 0, y: H - BAR, width: W, height: BAR },
  action: { type: "uri", label: "เปิดเว็บ", uri: WEB } };

const PAGES = [
  { key: "p1", file: "p1", name: TAG + "-p1", chatBarText: "เมนูงาน",
    areas: [tab(0, "ลงเวลา", "time"), tab(1, "งานของฉัน", "jobs"),
            tab(2, "รายงานประจำวัน", "daily"), swit(3, "หน้าถัดไป", "p2"), webBar] },
  { key: "p2", file: "p2", name: TAG + "-p2", chatBarText: "เมนูงาน",
    areas: [tab(0, "ขอ OT", "ot"), tab(1, "เบิกเงิน", "ec"),
            tab(2, "แจ้งเตือน", "bell"), swit(3, "ย้อนกลับ", "p1"), webBar] },
];

const api = (p, opt) => fetch("https://api.line.me/v2/bot" + p,
  Object.assign({ headers: { authorization: "Bearer " + TOKEN } }, opt || {}));

const apiJson = (p, method, body) => api(p, {
  method: method,
  headers: { authorization: "Bearer " + TOKEN, "content-type": "application/json" },
  body: JSON.stringify(body),
});

async function readJson(r) { try { return JSON.parse(await r.text() || "{}"); } catch (e) { return {}; } }

async function list() {
  const r = await api("/richmenu/list");
  const v = await readJson(r);
  if (!r.ok) { console.error("อ่านรายการไม่สำเร็จ " + r.status + " · " + JSON.stringify(v)); process.exit(1); }
  return v.richmenus || [];
}

async function aliases() {
  const r = await api("/richmenu/alias/list");
  const v = await readJson(r);
  return r.ok ? (v.aliases || []) : [];
}

/* สร้างเมนูหนึ่งหน้า พร้อมรูป — คืน id
   เมนูที่อัปรูปไม่สำเร็จใช้ไม่ได้เลย จึงลบทิ้งทันที ดีกว่าปล่อยค้างเป็นขยะในบัญชี */
async function createPage(page) {
  const file = img(page.file);
  if (!fs.existsSync(file)) {
    console.error("ไม่พบไฟล์รูป " + file + " — สร้างด้วย  python tools/richmenu-image.py");
    process.exit(1);
  }
  const cr = await apiJson("/richmenu", "POST", {
    size: { width: W, height: H }, selected: false, name: page.name,
    chatBarText: page.chatBarText, areas: page.areas,
  });
  const cv = await readJson(cr);
  if (!cr.ok || !cv.richMenuId) {
    console.error("สร้างเมนู " + page.key + " ไม่สำเร็จ " + cr.status + " · " + JSON.stringify(cv));
    process.exit(1);
  }
  const id = cv.richMenuId;

  /* อัปรูปอยู่คนละโฮสต์กับ API ปกติ (api-data.line.me) ถ้ายิง api.line.me จะได้ 404 */
  const ur = await fetch("https://api-data.line.me/v2/bot/richmenu/" + id + "/content", {
    method: "POST",
    headers: { authorization: "Bearer " + TOKEN, "content-type": "image/png" },
    body: fs.readFileSync(file),
  });
  if (!ur.ok) {
    console.error("อัปรูป " + page.key + " ไม่สำเร็จ " + ur.status + " · " + (await ur.text().catch(() => "")).slice(0, 300));
    await api("/richmenu/" + id, { method: "DELETE" });
    process.exit(1);
  }
  console.log("สร้าง " + page.key + " แล้ว " + id);
  return id;
}

/* ชี้ alias ไปที่เมนูใหม่ — มีอยู่แล้วต้องใช้ endpoint update ไม่ใช่ create (create จะได้ 400 ซ้ำ) */
async function setAlias(aliasId, richMenuId, existing) {
  const has = existing.some((a) => a.richMenuAliasId === aliasId);
  const r = has
    ? await apiJson("/richmenu/alias/" + aliasId, "POST", { richMenuId: richMenuId })
    : await apiJson("/richmenu/alias", "POST", { richMenuAliasId: aliasId, richMenuId: richMenuId });
  if (!r.ok) {
    console.error("ตั้ง alias " + aliasId + " ไม่สำเร็จ " + r.status + " · " + JSON.stringify(await readJson(r)));
    process.exit(1);
  }
  console.log((has ? "ชี้ alias เดิม " : "สร้าง alias ") + aliasId + " → " + richMenuId);
}

async function main() {
  if (!TOKEN) {
    console.error("ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN — ค่านี้ต้องมาจาก environment เท่านั้น");
    process.exit(1);
  }
  const cmd = (process.argv[2] || "deploy").toLowerCase();

  if (cmd === "list") {
    (await list()).forEach((m) => console.log(m.richMenuId + "  " + (m.name || "-") + "  " + (m.size || {}).width + "x" + (m.size || {}).height));
    (await aliases()).forEach((a) => console.log("alias  " + a.richMenuAliasId + " → " + a.richMenuId));
    return;
  }

  if (cmd === "clear") {
    const r = await api("/user/all/richmenu", { method: "DELETE" });
    console.log(r.ok ? "ถอดเมนูดีฟอลต์ออกแล้ว" : "ถอดไม่สำเร็จ " + r.status);
    return;
  }

  const before = await list();
  const ids = {};
  for (const p of PAGES) ids[p.key] = await createPage(p);

  const al = await aliases();
  for (const k of Object.keys(ALIAS)) await setAlias(ALIAS[k], ids[k], al);

  const sr = await api("/user/all/richmenu/" + ids.p1, { method: "POST" });
  if (!sr.ok) {
    console.error("ตั้งเป็นเมนูดีฟอลต์ไม่สำเร็จ " + sr.status + " · " + (await sr.text().catch(() => "")).slice(0, 300));
    process.exit(1);
  }
  console.log("ตั้งหน้า 1 เป็นเมนูดีฟอลต์แล้ว");

  /* เก็บกวาดของเก่า — ดูจากรายการที่อ่านไว้ "ก่อน" สร้างของใหม่ จะได้ไม่เผลอลบของที่เพิ่งสร้าง
     ลบทั้งชื่อรุ่นเก่า (flashsolar-main-*) และรุ่นนี้ที่ค้างจากการรันครั้งก่อน */
  for (const m of before) {
    if (!/^flashsolar-/.test(m.name || "")) continue;
    if (m.richMenuId === ids.p1 || m.richMenuId === ids.p2) continue;
    const dr = await api("/richmenu/" + m.richMenuId, { method: "DELETE" });
    console.log((dr.ok ? "ลบเมนูเก่า " : "ลบเมนูเก่าไม่สำเร็จ ") + m.richMenuId + " " + (m.name || ""));
  }

  console.log("\nเสร็จแล้ว — ปิดแล้วเปิดห้องแชทของ OA ใหม่ ถ้าเมนูยังไม่เปลี่ยน");
}

main().catch((e) => { console.error(e && e.message || e); process.exit(1); });
