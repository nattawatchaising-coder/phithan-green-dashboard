/* ============================================================
   กู้คืนจาก repo สำรอง → ไฟล์ JSON สำหรับ Firebase Console "Import JSON"
   ⚠ ไม่เขียน Firebase เอง — คนนำเข้าคือผู้ใช้ในหน้า Console (เลือก path ให้ตรงก่อนนำเข้า เพราะทับทั้ง path นั้น)

     node tools/backup-restore.mjs <โฟลเดอร์สำรอง> jobs/SF-2448     → จุดเดียว
     node tools/backup-restore.mjs <โฟลเดอร์สำรอง> jobFiles          → ทั้งกลุ่ม (ประกอบจาก files/ ให้เอง)
     node tools/backup-restore.mjs <โฟลเดอร์สำรอง>                   → ทุกกลุ่ม แยกไฟล์ละกลุ่ม

   ของวันก่อนหน้า: ในโฟลเดอร์สำรอง git log → git checkout <commit> ก่อนรัน (เสร็จแล้ว git checkout main)
   ผลลัพธ์อยู่ <โฟลเดอร์สำรอง>/_restore/ (ไม่ถูก commit) — มีข้อมูลลูกค้า นำเข้าเสร็จแล้วลบทิ้ง
   ============================================================ */

import fs from "node:fs";
import path from "node:path";

const [dir, want] = process.argv.slice(2);
if (!dir || !fs.existsSync(path.join(dir, "data"))) {
  console.error("ใช้: node tools/backup-restore.mjs <โฟลเดอร์สำรอง> [กลุ่ม/คีย์/...]");
  process.exit(1);
}

const dec = decodeURIComponent;
const enc = (k) => encodeURIComponent(String(k)).replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

/* ประกอบโฟลเดอร์ files/<กลุ่ม> กลับเป็นก้อนเดียว: x.json = คีย์ x · โฟลเดอร์ x/ = คีย์ x ที่มีลูก */
function assemble(abs) {
  const o = {};
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.isDirectory()) o[dec(e.name)] = Object.assign(o[dec(e.name)] || {}, assemble(path.join(abs, e.name)));
    else if (e.name.endsWith(".json")) {
      const k = dec(e.name.slice(0, -5)), v = readJson(path.join(abs, e.name));
      o[k] = v && typeof v === "object" && o[k] ? Object.assign(v, o[k]) : v;
    }
  }
  return o;
}

function group(name) {
  const d = path.join(dir, "data", enc(name) + ".json");
  if (fs.existsSync(d)) return readJson(d);
  const f = path.join(dir, "files", enc(name));
  if (fs.existsSync(f)) return assemble(f);
  return undefined;
}

const outDir = path.join(dir, "_restore");
fs.mkdirSync(outDir, { recursive: true });
const save = (label, v) => {
  const f = path.join(outDir, label.replace(/[\/\\:*?"<>|]/g, "__") + ".json");
  fs.writeFileSync(f, JSON.stringify(v));
  console.log("  " + f + "  (" + (fs.statSync(f).size / 1048576).toFixed(2) + " MB) → นำเข้าที่ path /" + label);
};

if (want) {
  const segs = want.replace(/^\/+|\/+$/g, "").split("/");
  let v = group(segs[0]);
  for (const s of segs.slice(1)) v = v && typeof v === "object" ? v[s] : undefined;
  if (v === undefined) { console.error("ไม่พบ " + want + " ในข้อมูลสำรองชุดนี้"); process.exit(1); }
  save(segs.join("/"), v);
} else {
  const names = new Set();
  for (const f of fs.readdirSync(path.join(dir, "data"))) if (f.endsWith(".json")) names.add(dec(f.slice(0, -5)));
  if (fs.existsSync(path.join(dir, "files"))) for (const f of fs.readdirSync(path.join(dir, "files"))) names.add(dec(f));
  for (const n of [...names].sort()) save(n, group(n));
}
console.log("Firebase Console → Realtime Database → คลิก path นั้น → ⋮ → Import JSON");
