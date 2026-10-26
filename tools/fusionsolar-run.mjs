// รันงานซิงก์ FusionSolar จากเครื่อง (ตัวเดียวกับ cron) — dry run เป็นค่าเริ่ม
//   node tools/fusionsolar-run.mjs [all|sites|kpi|hist] [--write] [--mock]   (hist = ข้อมูลผลิตย้อนหลังไว้วาดกราฟ)
//   --write  บันทึกจริง (ยอมเฉพาะฐานทดสอบ: firebase-config.local.js + firebase-sa.local.json — docs/test-db.md)
//   --mock   ยิง FusionSolar ปลอม http://localhost:8790 (tools/fusionsolar-mock.mjs) แทน Huawei จริง
// รหัส Huawei: env FUSIONSOLAR_USER / FUSIONSOLAR_PASS หรือไฟล์ fusionsolar.local.json {"user","pass"} ที่โฟลเดอร์หลักของ repo
//   (ไม่ขึ้น git · ห้าม commit) · --mock ไม่ต้องมีรหัสจริง
// ฐานข้อมูลที่อ่าน = ฐานทดสอบเท่านั้น (ในเครื่องไม่มีกุญแจฐานจริง) — ฐานทดสอบคัดลอกจากของจริง ผล dry run จึงเท่ากัน
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REAL_PROJECT = 'phithan-green-5907';
const args = process.argv.slice(2);
const job = args.find((a) => !a.startsWith('--')) || 'all';
const write = args.includes('--write');
const mock = args.includes('--mock');

const dirs = [ROOT];
try {
  const common = execSync('git rev-parse --path-format=absolute --git-common-dir', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  if (path.resolve(path.dirname(common)) !== path.resolve(ROOT)) dirs.push(path.dirname(common));
} catch (e) {}
const readLocal = (n) => { for (const d of dirs) { try { return fs.readFileSync(path.join(d, n), 'utf8'); } catch (e) {} } return null; };

const die = (m) => { console.error('✗ ' + m); process.exit(1); };
const cfgSrc = readLocal('firebase-config.local.js');
if (!cfgSrc) die('ไม่มี firebase-config.local.js — ใช้ได้กับฐานทดสอบเท่านั้น (docs/test-db.md)');
const box = { window: {} }; vm.runInNewContext(cfgSrc, box, { timeout: 200 });
const cfg = box.window.FIREBASE_TEST_CONFIG || {};
if (!cfg.databaseURL || cfg.projectId === REAL_PROJECT || /phithan-green-5907/.test(cfg.databaseURL)) die('config ชี้ฐานจริง — ไม่ทำ');
const sa = readLocal('firebase-sa.local.json');
if (!sa) die('ไม่มี firebase-sa.local.json');
if (JSON.parse(sa).project_id !== cfg.projectId) die('กุญแจไม่ตรงโปรเจกต์ทดสอบ');
process.env.RTDB_URL = cfg.databaseURL;
process.env.FIREBASE_SERVICE_ACCOUNT = sa;

if (mock) {
  process.env.FUSIONSOLAR_BASE = 'http://localhost:8790/thirdData';
  process.env.FUSIONSOLAR_USER = 'api_tarnthanawat';
  process.env.FUSIONSOLAR_PASS = 'mock';
} else {
  let loc = {}; try { loc = JSON.parse(readLocal('fusionsolar.local.json') || '{}'); } catch (e) {}
  process.env.FUSIONSOLAR_USER = process.env.FUSIONSOLAR_USER || loc.user || 'api_tarnthanawat';
  if (!process.env.FUSIONSOLAR_PASS && loc.pass) process.env.FUSIONSOLAR_PASS = loc.pass;
  if (!process.env.FUSIONSOLAR_PASS) die('ไม่มี FUSIONSOLAR_PASS — ตั้ง env หรือสร้าง fusionsolar.local.json {"user":"api_tarnthanawat","pass":"..."} (ห้าม commit)');
}

const { runSync } = await import(pathToFileURL(path.join(ROOT, 'api/_lib/fusionsolar.mjs')).href);
console.log((write ? 'บันทึกจริง' : 'dry run') + ' · job=' + job + ' · ฐาน ' + cfg.projectId + ' · ' + (mock ? 'FusionSolar ปลอม' : 'FusionSolar จริง'));
const r = await runSync({ job, dryRun: !write, trigger: 'tool', by: 'tools/fusionsolar-run', approve: write });
const L = r.log;
console.log('สถานี', L.stations, '· ไซต์ สร้าง', L.created, 'อัปเดต', L.updated, 'ไม่พบ', L.not_found);
if (job === 'hist') console.log('ย้อนหลัง เดือน', L.hist_months, '· วัน', L.hist_days, '· ชั่วโมง', L.hist_hours);
console.log('อุปกรณ์ สร้าง', L.dev_created, 'อัปเดต', L.dev_updated, 'ไม่พบ', L.dev_not_found, '· KPI ไซต์', L.kpi_sites, 'อุปกรณ์', L.kpi_devices);
console.log('คำขอ', L.requests, '· ค้าง', L.pending, '·', L.ms, 'ms', L.note ? '· ' + L.note : '', r.skipped ? '· (ข้าม)' : '');
L.errors.forEach((e) => console.log('  ! ', e.api, 'failCode', e.failCode, e.message));
if (r.preview) {
  const show = (t, a) => a.length && console.log(t + ':', a.slice(0, 15).map((x) => x.code + ' ' + x.name).join(' | ') + (a.length > 15 ? ' …+' + (a.length - 15) : ''));
  show('  จะสร้าง', r.preview.create); show('  เปลี่ยนค่า', r.preview.changed); show('  ไม่พบ', r.preview.not_found);
  (r.preview.hist || []).slice(0, 8).forEach((k) => console.log('  hist', JSON.stringify(k)));
  r.preview.kpi.slice(0, 8).forEach((k) => console.log('  kpi', JSON.stringify(k).slice(0, 200)));
}
process.exit(L.ok ? 0 : 2);
