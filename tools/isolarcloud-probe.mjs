// สำรวจ iSolarCloud ของจริง — อ่านอย่างเดียว ไม่เขียนฐานข้อมูลใด ๆ (docs/isolarcloud.md)
//   node tools/isolarcloud-probe.mjs [--mock] [--base https://gateway.isolarcloud.com.hk]
// รหัส: ไฟล์ isolarcloud.local.json ที่โฟลเดอร์หลักของ repo (ไม่ขึ้น git · ห้าม commit)
//   {"base":"https://gateway.isolarcloud.com.hk","appkey":"…","access_key":"…","rsa_key":"…","user":"…","pass":"…","encrypt":true}
// ผล: สรุปบนจอ + คำตอบดิบทั้งหมดใน isolarcloud-probe.local.json (มีชื่อลูกค้า — ห้าม commit)
//   --mock = ยิงตัวปลอม tools/isolarcloud-mock.mjs (port 8791)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const mock = args.includes('--mock');
const argBase = (() => { const i = args.indexOf('--base'); return i >= 0 ? args[i + 1] : null; })();
const die = (m) => { console.error('✗ ' + m); process.exit(1); };

if (mock) {
  const pub = await fetch('http://localhost:8791/__pub').then((r) => r.text()).catch(() => die('ตัวปลอมไม่ได้เปิด — node tools/isolarcloud-mock.mjs'));
  Object.assign(process.env, { ISOLARCLOUD_BASE: 'http://localhost:8791', ISOLARCLOUD_APPKEY: 'MOCKAPPKEY', ISOLARCLOUD_ACCESS_KEY: 'mockaccess',
    ISOLARCLOUD_RSA_KEY: pub, ISOLARCLOUD_USER: 'mock', ISOLARCLOUD_PASS: 'mock' });
} else {
  let loc;
  try { loc = JSON.parse(fs.readFileSync(path.join(ROOT, 'isolarcloud.local.json'), 'utf8')); }
  catch (e) { die('ไม่มี/อ่าน isolarcloud.local.json ไม่ได้ (' + e.message + ') — ดูรูปแบบที่หัวไฟล์นี้'); }
  const set = (k, v) => { if (v != null && v !== '' && !process.env[k]) process.env[k] = String(v); };
  set('ISOLARCLOUD_BASE', argBase || loc.base); set('ISOLARCLOUD_APPKEY', loc.appkey); set('ISOLARCLOUD_ACCESS_KEY', loc.access_key);
  set('ISOLARCLOUD_RSA_KEY', loc.rsa_key); set('ISOLARCLOUD_USER', loc.user); set('ISOLARCLOUD_PASS', loc.pass);
  if (loc.encrypt === false) process.env.ISOLARCLOUD_ENCRYPT = '0';
}

const I = await import(pathToFileURL(path.join(ROOT, 'api/_lib/isolarcloud.mjs')).href);
if (!I.iscReady()) die('รหัสไม่ครบ — ต้องมี appkey, access_key, user, pass (+ rsa_key ถ้าเปิดเข้ารหัส)');
const raw = [];
const c = I.iscClient({ onRaw: (api, body, resp) => raw.push({ api, body, resp }) });
const save = () => fs.writeFileSync(path.join(ROOT, 'isolarcloud-probe.local.json'), JSON.stringify(raw, null, 1));
const step = async (name, fn) => {
  try { const v = await fn(); return v; }
  catch (e) { console.log('  ! ' + name + ' พลาด: [' + e.code + '] ' + I.iscErrText(e)); save(); if (e.fatal) die('หยุด — แก้รหัส/เซิร์ฟเวอร์ก่อน'); return null; }
};

console.log('เซิร์ฟเวอร์', I.ISC.base(), '· เข้ารหัส', I.ISC.encrypt() ? 'เปิด' : 'ปิด');
const who = await step('login', () => c.login());
console.log('✓ ล็อกอินผ่าน', who ? '· user_id ' + who.user_id + (who.user_name ? ' (' + who.user_name + ')' : '') : '');

const plants = (await step('รายชื่อไซต์', () => I.iscPlants(c))) || [];
console.log('✓ ไซต์', plants.length, 'แห่ง · ฟิลด์:', Object.keys(plants[0] || {}).join(', '));
plants.slice(0, 5).forEach((p) => console.log('   ', p.ps_id, '|', p.ps_name, '|', JSON.stringify(p.total_capcity || p.design_capacity || p.ps_capacity || ''), '| สถานะ', p.ps_status, p.online_status, p.ps_fault_status));

if (plants.length) {
  const p0 = plants[0];
  const devs = (await step('อุปกรณ์ของไซต์แรก', () => I.iscDevices(c, p0.ps_id))) || [];
  const types = {}; devs.forEach((d) => { types[d.device_type] = (types[d.device_type] || 0) + 1; });
  console.log('✓ อุปกรณ์ไซต์', p0.ps_name, devs.length, 'ตัว · device_type:', JSON.stringify(types), '· ฟิลด์:', Object.keys(devs[0] || {}).join(', '));

  const keys = plants.slice(0, 3).map((p) => p.ps_id + '_11_0_0');
  const rt = (await step('ค่าตอนนี้ระดับไซต์', () => I.iscRealtime(c, 11, keys, Object.keys(I.PLANT_POINTS)))) || [];
  rt.forEach((x) => console.log('   ', x.ps_key, Object.keys(I.PLANT_POINTS).map((k) => I.PLANT_POINTS[k] + '=' + x['p' + k]).join(' · ')));

  const inv = devs.find((d) => +d.device_type === 1);
  if (inv) {
    const pts = (await step('ชื่อ point ของอินเวอร์เตอร์', () => I.iscPointInfo(c, 1))) || [];
    console.log('✓ point อินเวอร์เตอร์', Array.isArray(pts) ? pts.length : '?', 'ตัว (ดูใน isolarcloud-probe.local.json)');
    const ids = (Array.isArray(pts) ? pts : []).map((x) => x.point_id).filter(Boolean).slice(0, 60);
    if (ids.length) {
      const v = (await step('ค่าตอนนี้อินเวอร์เตอร์', () => I.iscRealtime(c, 1, [inv.ps_key], ids))) || [];
      console.log('   ', inv.device_name, JSON.stringify(v[0] || {}).slice(0, 400));
    }
  }
}
save();
console.log('คำขอ', c.calls, '· คำตอบดิบ → isolarcloud-probe.local.json');
