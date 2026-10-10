/* ============================================================
   flash+solar — โครงไฟล์สำรองข้อมูล (ใช้ร่วมกัน: api/cron/backup.mjs · tools/backup-seed.mjs)
   ดูข้อตกลงทั้งหมดที่ docs/backup.md

   repo สำรอง (GitHub private แยก — ห้ามอยู่ใน repo นี้ เพราะ repo นี้ public):
     data/<กลุ่ม>.json                 ข้อมูลงาน ทั้งกลุ่มในไฟล์เดียว จัดย่อหน้า (diff อ่านง่าย)
     files/<กลุ่ม>/<คีย์>.json          ไฟล์/รูป ชั้นเดียว (FILES1) — ข้อความดิบจาก REST
     files/<กลุ่ม>/<งาน>/<คีย์>.json    ไฟล์/รูป สองชั้น (FILES2)
   ชื่อคีย์ encode ด้วย enc() — ถอดกลับด้วย decodeURIComponent

   ⚠ ไม่มี dependency (ดูหัว line.mjs) · ไบต์ที่เขียนต้องเหมือนกันทุกครั้งที่ข้อมูลเท่าเดิม
      ไม่งั้น cron จะเห็นว่า "เปลี่ยน" ทุกวันแล้วอัปซ้ำจนชนเพดาน GitHub
   ============================================================ */

import crypto from "node:crypto";

/* กลุ่มที่เป็นไฟล์/รูป base64 (~340 MB จาก ~355 MB) — แยกเก็บทีละชิ้น ดาวน์โหลดเฉพาะชิ้นใหม่
   กลุ่มที่ไม่อยู่ในสองรายการนี้ = ข้อมูลงาน ดึงเต็มทุกวัน (รวมกลุ่มใหม่ที่เพิ่มทีหลังด้วย)
   ย้ายกลุ่มเข้า/ออกรายการได้ — รอบถัดไปไฟล์ฝั่งเดิมถูกลบ ฝั่งใหม่ถูกเติมเอง */
export const FILES1 = ["stockDoc", "stockImg", "quotePicData"];                 // <กลุ่ม>/<ชิ้น>
export const FILES2 = ["jobFiles", "roofPhotos", "inspectionPhotos", "permitPhotos", "permitDocs",
  "omTicketPhotos", "surveyPhotos", "jobPhotos", "billPhotos", "dailyPhotos"];  // <กลุ่ม>/<งาน>/<ชิ้น>

/* encodeURIComponent + อักษรที่ Windows/URL ไม่ชอบ — ไฟล์ต้อง clone ลง Windows ได้ */
export const enc = (k) => encodeURIComponent(String(k))
  .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

/* ข้อมูลงาน: จัดย่อหน้า 1 ช่อง — Firebase เรียงคีย์มาให้แล้ว ผลจึงคงที่ */
export const dataText = (raw) => JSON.stringify(JSON.parse(raw), null, 1) + "\n";

/* sha ของ git blob — เทียบกับ tree ใน repo สำรองได้โดยไม่ต้องอัปขึ้นไปก่อน */
export function gitSha(text) {
  const b = Buffer.from(text, "utf8");
  return crypto.createHash("sha1").update("blob " + b.length + "\0").update(b).digest("hex");
}

/* ทำงานพร้อมกันทีละ n */
export async function pool(items, n, fn) {
  let i = 0;
  const run = async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

/* รายการทุกอย่างที่ควรมีใน repo สำรอง — อ่านแค่ shallow (เบา) ไม่ดาวน์โหลดเนื้อไฟล์
   getText(path, query) = rtdbText · path ใน db encode แล้ว
   คืน { data: [{path, db}], leaves: [{path, db}] } · พลาดตรงไหน = โยน error (ห้ามเดาว่าว่าง)
   topNames = รายชื่อกลุ่มสำรองไว้ใช้เมื่ออ่านรากไม่ได้ (กฎขั้น 0 ห้ามคนไม่ล็อกอินอ่านราก — seed ในเครื่อง)
   cron มี service account จึงอ่านรากได้เสมอ ไม่ต้องส่ง */
export async function plan(getText, topNames) {
  let top;
  try { top = JSON.parse(await getText("", "shallow=true")) || {}; }
  catch (e) {
    if (!topNames || !topNames.length) throw e;
    top = Object.fromEntries(topNames.map((k) => [k, true]));
  }
  const data = [], leaves = [], two = [];
  const shallow = async (db) => JSON.parse(await getText(db, "shallow=true")) || {};

  for (const k of Object.keys(top).sort()) {
    const isFile = top[k] === true && (FILES1.includes(k) || FILES2.includes(k));
    if (!isFile) { data.push({ path: "data/" + enc(k) + ".json", db: enc(k) }); continue; }
    const l1 = await shallow(enc(k));
    for (const k1 of Object.keys(l1).sort()) {
      const db = enc(k) + "/" + enc(k1);
      if (FILES2.includes(k) && l1[k1] === true) two.push({ k, k1, db });
      else leaves.push({ path: "files/" + enc(k) + "/" + enc(k1) + ".json", db });
    }
  }
  await pool(two, 6, async (t) => {
    const l2 = await shallow(t.db);
    for (const k2 of Object.keys(l2).sort())
      leaves.push({ path: "files/" + enc(t.k) + "/" + enc(t.k1) + "/" + enc(k2) + ".json", db: t.db + "/" + enc(k2) });
  });
  leaves.sort((a, b) => (a.path < b.path ? -1 : 1));
  return { data, leaves };
}

/* path ที่ cron/seed ดูแล — นอกนี้ (README, .gitattributes, _backup.json) ไม่แตะ */
export const managed = (p) => p.startsWith("data/") || p.startsWith("files/");
