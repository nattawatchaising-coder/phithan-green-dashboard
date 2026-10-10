/* ============================================================
   สำรองเต็มก้อนลงโฟลเดอร์ repo สำรองในเครื่อง — ใช้ครั้งแรก (~340 MB) แทนให้ cron ค่อย ๆ อัปหลายสิบคืน
   อ่าน Firebase อย่างเดียว ไม่เขียน · ไฟล์ที่ได้ตรงไบต์กับที่ cron เขียน → cron รอบถัดไปเห็นว่าไม่มีอะไรเปลี่ยน

     git clone https://github.com/<owner>/<repo สำรอง>.git D:\flashsolar-backup   ← นอก repo นี้เสมอ
     node tools/backup-seed.mjs D:\flashsolar-backup
     cd D:\flashsolar-backup ; git add -A ; git commit -m "สำรองครั้งแรก" ; git push

   ใช้ได้เมื่อกฎฐานข้อมูลยังให้อ่านแบบไม่ล็อกอิน (ขั้น 0 ใน docs/security.md)
   ขั้น 0 อ่านรายชื่อที่รากไม่ได้ → ต้องมี data/ จาก cron รอบแรกก่อน (git pull) จึงรู้ชื่อกลุ่ม
   รัดกฎแล้ว = ตั้ง env FIREBASE_SERVICE_ACCOUNT ชั่วคราวใน terminal ก่อนรัน (ห้ามเขียนลงไฟล์)
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
if (!out || !fs.existsSync(path.join(out, ".git"))) {
  console.error("ใช้: node tools/backup-seed.mjs <โฟลเดอร์ที่ clone repo สำรองไว้>");
  process.exit(1);
}
if (path.resolve(out).startsWith(path.resolve(here, ".."))) {
  console.error("ห้ามวางไฟล์สำรองใน repo นี้ (public) — clone repo สำรองไว้ที่อื่น");
  process.exit(1);
}

const cfg = fs.readFileSync(path.join(here, "..", "firebase-config.js"), "utf8");
process.env.RTDB_URL = process.env.RTDB_URL || (cfg.match(/databaseURL:\s*"([^"]+)"/) || [])[1] || "";
const { rtdbText } = await import("../api/_lib/line.mjs");
const { plan, dataText, pool, managed, FILES1, FILES2 } = await import("../api/_lib/backup.mjs");

/* ไฟล์ตั้งต้นของ repo สำรอง: เก็บไบต์ตามจริง (ไม่แปลง CRLF) · ไม่ commit ไฟล์กู้คืน */
const put0 = (f, s) => { if (!fs.existsSync(path.join(out, f))) fs.writeFileSync(path.join(out, f), s); };
put0(".gitattributes", "* -text\n");
put0(".gitignore", "_restore/\n");

/* กฎขั้น 0 ไม่ให้อ่านรายชื่อที่ราก → ใช้ชื่อกลุ่มจาก data/ ที่ cron สำรองไว้ (git pull ก่อน) + กลุ่มไฟล์ */
const dataDir = path.join(out, "data");
const known = (fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [])
  .filter((f) => f.endsWith(".json")).map((f) => decodeURIComponent(f.slice(0, -5)));
console.log("อ่านรายชื่อ…");
let p;
try { p = await plan(rtdbText, known.length ? known.concat(FILES1, FILES2) : null); }
catch (e) {
  console.error("อ่านรายชื่อกลุ่มไม่ได้ (" + e.message + ") — ให้ cron สำรองรอบแรกก่อน แล้ว git pull ในโฟลเดอร์สำรอง แล้วรันใหม่");
  process.exit(1);
}
console.log("ข้อมูลงาน " + p.data.length + " กลุ่ม · ไฟล์/รูป " + p.leaves.length + " ชิ้น");

let n = 0, bytes = 0;
const write = (rel, text) => {
  const f = path.join(out, ...rel.split("/"));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  bytes += Buffer.byteLength(text);
  if (++n % 50 === 0) console.log("  " + n + " ไฟล์ · " + (bytes / 1048576).toFixed(0) + " MB");
};
await pool(p.data, 4, async (d) => write(d.path, dataText(await rtdbText(d.db))));
await pool(p.leaves, 6, async (l) => write(l.path, await rtdbText(l.db)));

/* ลบไฟล์ที่ไม่มีใน Firebase แล้ว (เฉพาะ data/ files/) */
const keep = new Set(p.data.concat(p.leaves).map((x) => x.path));
let del = 0;
const walk = (dir) => {
  const abs = path.join(out, dir);
  if (!fs.existsSync(abs)) return;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = dir + "/" + e.name;
    if (e.isDirectory()) walk(rel);
    else if (managed(rel) && !keep.has(rel)) { fs.unlinkSync(path.join(out, ...rel.split("/"))); del++; }
  }
};
walk("data"); walk("files");

console.log("เสร็จ " + n + " ไฟล์ · " + (bytes / 1048576).toFixed(0) + " MB · ลบ " + del);
console.log("ต่อไป: cd " + out + " ; git add -A ; git commit -m \"สำรองครั้งแรก\" ; git push");
