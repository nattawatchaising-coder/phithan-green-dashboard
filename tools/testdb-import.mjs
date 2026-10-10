/* ============================================================
   คัดลอกไฟล์ export ของฐานจริง → ฐานข้อมูลทดสอบ (docs/test-db.md)
   ใช้แทนปุ่ม Import JSON ใน Console ที่รับไฟล์ใหญ่ไม่ได้ (ฐานจริง ~358 MB)

     node --max-old-space-size=4096 tools/testdb-import.mjs <ไฟล์ export.json>

   - อ่าน firebase-config.local.js + firebase-sa.local.json (โฟลเดอร์นี้ หรือโฟลเดอร์หลักของ repo)
   - ⚠ ล้างฐานทดสอบทั้งก้อนก่อน แล้วส่งทีละกลุ่ม/ทีละชุด (≤ 8 MB ต่อคำขอ)
   - ไม่ยอมทำงานถ้าเป้าหมายเป็นโปรเจกต์จริง หรือกุญแจกับ config เป็นคนละโปรเจกต์
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REAL_PROJECT = "phithan-green-5907";
const REAL_DB = "https://phithan-green-5907-default-rtdb.asia-southeast1.firebasedatabase.app";
const MAX = 8e6;

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dirs = [ROOT];
try {
  const common = execSync("git rev-parse --path-format=absolute --git-common-dir", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  if (path.resolve(path.dirname(common)) !== path.resolve(ROOT)) dirs.push(path.dirname(common));
} catch (e) {}
const readLocal = (name) => {
  for (const d of dirs) { try { return fs.readFileSync(path.join(d, name), "utf8"); } catch (e) {} }
  return null;
};
const die = (m) => { console.error("หยุด: " + m); process.exit(1); };

const file = process.argv[2];
if (!file || !fs.existsSync(file)) die("ใช้: node --max-old-space-size=4096 tools/testdb-import.mjs <ไฟล์ export.json>");

const cfgSrc = readLocal("firebase-config.local.js");
if (!cfgSrc) die("ไม่มี firebase-config.local.js");
const box = { window: {} };
vm.runInNewContext(cfgSrc, box, { timeout: 200 });
const cfg = box.window.FIREBASE_TEST_CONFIG || {};
const saRaw = readLocal("firebase-sa.local.json");
if (!saRaw) die("ไม่มี firebase-sa.local.json");
const sa = JSON.parse(saRaw);

const DB = String(cfg.databaseURL || "").replace(/\/+$/, "");
if (!DB || !cfg.projectId) die("firebase-config.local.js ไม่มี databaseURL/projectId");
if (DB === REAL_DB || cfg.projectId === REAL_PROJECT || sa.project_id === REAL_PROJECT || DB.includes(REAL_PROJECT)) die("ชี้ไปโปรเจกต์จริง");
if (sa.project_id !== cfg.projectId) die("กุญแจเป็นของ " + sa.project_id + " แต่ config เป็น " + cfg.projectId);

process.env.FIREBASE_SERVICE_ACCOUNT = saRaw;
const { accessToken } = await import(pathToFileURL(path.join(ROOT, "api/_lib/gauth.mjs")).href);

async function call(method, p, body) {
  const url = DB + "/" + p.split("/").map(encodeURIComponent).join("/") + ".json?print=silent";
  for (let i = 1; ; i++) {
    const r = await fetch(url, {
      method, body,
      headers: { authorization: "Bearer " + (await accessToken()), "content-type": "application/json" },
    }).catch((e) => ({ ok: false, status: e.message }));
    if (r.ok) return;
    if (i >= 3) die(method + " /" + p + " → " + r.status + (r.text ? " " + (await r.text()).slice(0, 200) : ""));
    await new Promise((res) => setTimeout(res, 2000 * i));
  }
}

console.log("อ่าน " + file + " …");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
console.log("ปลายทาง: " + DB + " (" + cfg.projectId + ")");

console.log("ล้างฐานทดสอบ…");
await call("DELETE", "");

let sent = 0;
const t0 = Date.now();
for (const [k, v] of Object.entries(data)) {
  const s = JSON.stringify(v);
  if (s.length <= MAX || !v || typeof v !== "object") {
    await call("PUT", k, s);
    sent += s.length;
  } else {
    // ก้อนใหญ่ (ไฟล์/รูป base64) — ส่งทีละชุดลูกด้วย PATCH
    let batch = {}, size = 0;
    const flush = async () => {
      if (!size) return;
      await call("PATCH", k, JSON.stringify(batch));
      sent += size; batch = {}; size = 0;
      process.stdout.write("\r  " + k + " … " + (sent / 1e6).toFixed(0) + " MB   ");
    };
    for (const [ck, cv] of Object.entries(v)) {
      const cs = JSON.stringify(cv).length;
      if (size && size + cs > MAX) await flush();
      batch[ck] = cv; size += cs;
    }
    await flush();
    process.stdout.write("\n");
  }
  console.log("  ✓ " + k + "  (รวม " + (sent / 1e6).toFixed(1) + " MB)");
}
console.log("เสร็จ " + Object.keys(data).length + " กลุ่ม · " + (sent / 1e6).toFixed(1) + " MB · " + ((Date.now() - t0) / 1000).toFixed(0) + " วินาที");
console.log("ลบไฟล์ export ทิ้งได้แล้ว (มีข้อมูลลูกค้า)");
