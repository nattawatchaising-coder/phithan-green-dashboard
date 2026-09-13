/* ============================================================
   ตรวจว่าเลข ?v= ของ index.html กับ liff.html ตรงกัน

   ทำไมต้องมี: สองหน้านี้โหลด dashboard/build/*.js ไฟล์เดียวกัน
   ถ้าบัมพ์เลขในหน้าเดียวแล้วลืมอีกหน้า → เดสก์ท็อปได้โค้ดใหม่ มือถือได้โค้ดเก่า
   และ WebView ของแอป LINE แคชหนักมาก อาการจะค้างอยู่เป็นวัน โดยหาสาเหตุไม่เจอ

   วิธีใช้ (ก่อน deploy ทุกครั้ง):  node tools/check-versions.mjs
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* เก็บเฉพาะสคริปต์ในเครื่อง (dashboard/…) — ไลบรารีจาก CDN ไม่ได้ใช้ ?v= */
function versions(file) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const out = new Map();
  for (const m of html.matchAll(/<script\s+src="((?:dashboard|firebase)[^"?]+)(?:\?v=(\d+))?"/g)) {
    out.set(m[1], m[2] || "-");
  }
  return out;
}

const a = versions("index.html");
const b = versions("liff.html");

const bad = [];
for (const [src, v] of b) {
  if (!a.has(src)) continue;                 // ไฟล์ที่มีเฉพาะหน้า LIFF (line.js / liff-app.js) ไม่ต้องเทียบ
  if (a.get(src) !== v) bad.push(`${src}  index.html=${a.get(src)}  liff.html=${v}`);
}

if (bad.length) {
  console.error("เลข ?v= ไม่ตรงกันระหว่าง index.html กับ liff.html:\n  " + bad.join("\n  "));
  process.exit(1);
}
console.log(`?v= ตรงกันทั้งหมด (เทียบ ${b.size} ไฟล์ของหน้า LIFF)`);
