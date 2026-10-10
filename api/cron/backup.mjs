/* ============================================================
   GET /api/cron/backup   →  สำรอง Firebase ลง GitHub repo private แยก วันละครั้ง ตี 3 ไทย (= 20:00 UTC)

   ── ทำไมต้องมี ──
   Firebase แผนฟรีไม่มี backup อัตโนมัติ · เคยมีข้อมูลหาย (% คืบหน้าใบงาน SF-2448)
   git เก็บประวัติให้ทุกวัน → กู้คืนของวันไหนก็ได้ ด้วย tools/backup-restore.mjs (ดู docs/backup.md)

   ── ทำไมไม่ดึงทั้งก้อนทุกวัน ──
   ฐานข้อมูล ~355 MB เป็นไฟล์/รูปเสีย ~340 MB · Firebase แผนฟรีดาวน์โหลดได้ 10 GB/เดือน
   ดึงทั้งก้อนทุกวัน = เกินโควตา แล้วเว็บจริงโหลดไม่ได้ทั้งบริษัท ฉะนั้น:
   - ข้อมูลงาน (data/) ดึงเต็มทุกวัน ~12 MB
   - ไฟล์/รูป (files/) ดูรายชื่อทุกวัน ดาวน์โหลดเฉพาะชิ้นใหม่ + ตรวจซ้ำชิ้นเดิมวันละ 1/ROTATE (ครบทุกชิ้นใน ROTATE วัน)
   - ชิ้นที่หายจาก Firebase ถูกลบจาก commit ล่าสุด แต่ยังอยู่ในประวัติ git

   ── เพดาน ──
   Vercel Hobby: function รันได้ 60 วินาที (vercel.json functions.maxDuration) → ทำได้ BUDGET_MS แล้ว commit เท่าที่เสร็จ
   GitHub: สร้างเนื้อหาได้ราว 80 ครั้ง/นาที 500 ครั้ง/ชม. → อัปไม่เกิน MAX_BLOBS ไฟล์ต่อรอบ
   ที่เหลือ = "ค้าง" รอบถัดไปทำต่อเอง · ครั้งแรก (~340 MB) ให้ใช้ tools/backup-seed.mjs จากเครื่องแทน

   ── ป้องกัน ──
   Authorization: Bearer $CRON_SECRET เหมือน cron ตัวอื่น · ไม่เขียนอะไรลง Firebase เลย
   อ่านรายชื่อพลาดแม้จุดเดียว = ยกเลิกทั้งรอบ ไม่ commit (กันพลาดแล้วถูกตีความว่า "ข้อมูลถูกลบ")
   ค่าลับ BACKUP_GH_TOKEN (fine-grained เฉพาะ repo สำรอง · Contents read/write) · BACKUP_GH_REPO = "owner/name"
   อยู่ใน Vercel Environment Variables เท่านั้น
   พังเมื่อไหร่ = ส่ง LINE ถึง Film (alertBackup ใน _lib/backup.mjs) · cron ไม่รันเลย = daily.mjs เฝ้าแทน (checkBackup)

   ⚠ ไม่มี dependency (installCommand: null) — ดูเหตุผลที่หัว _lib/line.mjs
   ============================================================ */

import crypto from "node:crypto";
import { ENV, json, rtdbText, todayTH } from "../_lib/line.mjs";
import { plan, dataText, gitSha, pool, managed, gh, ghReady, alertBackup } from "../_lib/backup.mjs";

const BUDGET_MS = 45000;   // เผื่อเวลาสร้าง tree/commit ก่อนชน 60 วินาที
const MAX_BLOBS = 60;
const ROTATE    = 30;

/* ชิ้นไหนถึงคิวตรวจซ้ำวันนี้ — แบ่งตาม hash ของ path คงที่ทุกวัน */
const dayNo = () => Math.floor(Date.now() / 86400000);
const dueToday = (path) => parseInt(crypto.createHash("sha1").update(path).digest("hex").slice(0, 8), 16) % ROTATE === dayNo() % ROTATE;

/* ตอบ error พร้อมแจ้ง LINE — รอบที่พังต้องมีคนรู้ ไม่งั้นข้อมูลไม่ได้สำรองแบบเงียบ ๆ */
async function fail(what, e, extra) {
  const detail = String((e && e.message) || e || "");
  await alertBackup("รอบ " + todayTH() + " ไม่สำเร็จ: " + what + " — " + detail);
  return json({ error: what, detail, ...(extra || {}) }, 502);
}

export async function GET(request) {
  const want = ENV.cron();
  const got = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!want || got !== want) return json({ error: "unauthorized" }, 401);
  if (!ENV.rtdb() || !ghReady()) return fail("backup not configured", "ไม่พบ env BACKUP_GH_TOKEN / BACKUP_GH_REPO ใน Vercel");

  const t0 = Date.now();
  const left = () => BUDGET_MS - (Date.now() - t0);
  const date = todayTH();

  /* 1. สภาพ repo สำรองตอนนี้ */
  let branch, head, baseTree, have;
  try {
    branch = (await gh("GET", "")).default_branch;
    head = (await gh("GET", "/git/ref/heads/" + branch)).object.sha;
    baseTree = (await gh("GET", "/git/commits/" + head)).tree.sha;
    const tr = await gh("GET", "/git/trees/" + baseTree + "?recursive=1");
    if (tr.truncated) throw new Error("tree truncated");
    have = new Map(tr.tree.filter((e) => e.type === "blob").map((e) => [e.path, e.sha]));
  } catch (e) { return fail("github", e); }

  /* 2. รายการที่ควรมี — พลาด = ยกเลิกทั้งรอบ */
  let p;
  try { p = await plan(rtdbText); } catch (e) { return fail("db list", e); }

  const entries = [];
  let blobs = 0, changed = 0, pending = 0, failed = 0;
  const upload = async (path, text) => {
    const sha = gitSha(text);
    if (have.get(path) === sha) return;
    blobs++;
    await gh("POST", "/git/blobs", { content: Buffer.from(text, "utf8").toString("base64"), encoding: "base64" });
    entries.push({ path, mode: "100644", type: "blob", sha });
    changed++;
  };

  /* 3. ข้อมูลงาน — ทุกกลุ่มทุกวัน · พลาด = ยกเลิก (ข้อมูลงานต้องครบทุกรอบ) */
  try {
    await pool(p.data, 4, async (d) => upload(d.path, dataText(await rtdbText(d.db))));
  } catch (e) { return fail("data", e); }

  /* 4. ไฟล์/รูป — ชิ้นใหม่ก่อน แล้วชิ้นที่ถึงคิวตรวจซ้ำ · หมดเวลา/โควตา = ค้างไว้รอบหน้า */
  const fresh = p.leaves.filter((l) => !have.has(l.path));
  const recheck = p.leaves.filter((l) => have.has(l.path) && dueToday(l.path));
  await pool(fresh.concat(recheck), 3, async (l) => {
    if (left() < 8000 || blobs >= MAX_BLOBS) { if (!have.has(l.path)) pending++; return; }
    try { await upload(l.path, await rtdbText(l.db)); }
    catch (e) { failed++; if (!have.has(l.path)) pending++; }
  });

  /* 5. ลบสิ่งที่ไม่มีใน Firebase แล้ว (ยังอยู่ในประวัติ git) */
  const keep = new Set(p.data.concat(p.leaves).map((x) => x.path));
  let deleted = 0;
  for (const path of have.keys()) {
    if (managed(path) && !keep.has(path)) { entries.push({ path, mode: "100644", type: "blob", sha: null }); deleted++; }
  }

  /* 6. ใบสรุปรอบนี้ (เขียนทุกวัน = เห็นใน GitHub ว่า cron ยังทำงานอยู่) แล้ว commit */
  const at = new Date().toISOString();
  const summary = { at, date, dataGroups: p.data.length, fileItems: p.leaves.length, changed, deleted, pending, failed, rechecked: recheck.length };
  try {
    const st = JSON.stringify(summary, null, 1) + "\n";
    await gh("POST", "/git/blobs", { content: Buffer.from(st, "utf8").toString("base64"), encoding: "base64" });
    entries.push({ path: "_backup.json", mode: "100644", type: "blob", sha: gitSha(st) });

    const tree = (await gh("POST", "/git/trees", { base_tree: baseTree, tree: entries })).sha;
    const msg = "สำรอง " + date + " · แก้ " + changed + " · ลบ " + deleted
      + (pending ? " · ค้าง " + pending : "") + (failed ? " · พลาด " + failed : "");
    const commit = (await gh("POST", "/git/commits", { message: msg, tree, parents: [head] })).sha;
    await gh("PATCH", "/git/refs/heads/" + branch, { sha: commit });
    /* ชั่วคราว 2026-10-10: ผู้ใช้ขอลองรับข้อความแจ้งเตือน — เอาออกหลังได้รับแล้ว */
    await alertBackup("🧪 ทดสอบแจ้งเตือน (ไม่ใช่ปัญหา)\nสำรองรอบนี้สำเร็จ: ข้อมูลงาน " + p.data.length + " กลุ่ม · ไฟล์/รูป " + p.leaves.length + " ชิ้น · แก้ " + changed + " · ค้าง " + pending);
    if (failed) await alertBackup("รอบ " + date + " ดาวน์โหลดไฟล์/รูปพลาด " + failed + " ชิ้น (รอบหน้าลองใหม่เอง) — ถ้าเตือนซ้ำหลายวันให้ดู Logs");
    return json({ ok: true, commit, ms: Date.now() - t0, ...summary });
  } catch (e) { return fail("commit", e, summary); }
}
