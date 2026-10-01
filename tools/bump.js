// บัมป์เลข ?v= ของสคริปต์ใน index.html / liff.html ให้เบราว์เซอร์โหลดไฟล์ใหม่ (กันแคชค้างโค้ดเก่า)
// ใช้: node tools/bump.js boq drawer app   (ชื่อไฟล์ไม่ต้องมี .js)
// บัมป์ทั้ง dashboard/build/<ชื่อ>.js และ dashboard/<ชื่อ>.js (ไฟล์ .js ที่ไม่ผ่าน babel เช่น boq.js) ถ้ามี
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const names = process.argv.slice(2);
if (!names.length) { console.log('ใช้: node tools/bump.js <ชื่อไฟล์> ...'); process.exit(1); }
['index.html', 'liff.html'].forEach((f) => {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) return;
  let s = fs.readFileSync(p, 'latin1');
  let hit = 0;
  names.forEach((n) => {
    const re = new RegExp('((?:build|dashboard)/' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.js\\?v=)(\\d+)', 'g');
    s = s.replace(re, (a, pre, v) => { hit++; console.log(f, pre + v, '->', +v + 1); return pre + (+v + 1); });
  });
  if (hit) fs.writeFileSync(p, s, 'latin1');
});
