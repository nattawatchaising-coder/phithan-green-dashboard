// dashboard/build/ ตามหลัง .jsx ไม่ทันเมื่อไหร่ ให้ build ใหม่ทันที
// เว็บโหลดจาก dashboard/build/ ไม่ได้โหลด .jsx ตรงๆ — ลืม build แล้วเว็บจะค้างโค้ดเก่าแบบเงียบๆ
//
// เดิมดูว่า "เครื่องมือไหนแก้ไฟล์" (Write/Edit แล้วอ่าน file_path)
// แต่ไฟล์ในโปรเจกต์นี้เป็น CRLF การแก้หลายครั้งจึงต้องทำผ่านสคริปต์ใน Bash
// ซึ่งไม่มี file_path ให้อ่าน hook เลยเงียบทั้งที่ไฟล์เปลี่ยนไปแล้ว
//
// ตอนนี้ดูที่ "ไฟล์ตรงกันหรือยัง" แทน — เทียบเวลาแก้ไขของ .jsx กับ .js ที่ build ไว้
// เรียกบ่อยแค่ไหนก็ได้ ไม่ตรงเมื่อไหร่ค่อย build (ครั้งที่ตรงอยู่แล้วจบที่การ stat ไฟล์)
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'dashboard');
const OUT = path.join(SRC, 'build');

// .jsx ไฟล์ไหนใหม่กว่า .js ของตัวเอง (หรือยังไม่เคย build) = ยังไม่ตรง
function staleFiles() {
  let names;
  try {
    names = fs.readdirSync(SRC).filter((f) => f.toLowerCase().endsWith('.jsx'));
  } catch (e) {
    return [];
  }
  return names.filter((f) => {
    try {
      const src = fs.statSync(path.join(SRC, f));
      const out = fs.statSync(path.join(OUT, f.replace(/\.jsx$/i, '.js')));
      return src.mtimeMs > out.mtimeMs;
    } catch (e) {
      return true;   // ยังไม่มีไฟล์ที่ build ไว้
    }
  });
}

function main() {
  const stale = staleFiles();
  if (!stale.length) return;

  try {
    // ผ่าน shell เพราะบน Windows node เรียก npm.cmd ตรงๆ ไม่ได้
    execSync('npm run build', { cwd: ROOT, stdio: 'ignore' });
    const left = staleFiles();
    if (left.length) {
      console.log(JSON.stringify({ systemMessage: 'build แล้วแต่ยังไม่ตรง: ' + left.join(', ') + ' — ลองรัน npm run build เองเพื่อดู error' }));
      return;
    }
    console.log(JSON.stringify({ systemMessage: 'build ใหม่แล้ว (' + stale.length + ' ไฟล์เปลี่ยน) — dashboard/build/ ตรงกับ .jsx' }));
  } catch (e) {
    console.log(JSON.stringify({ systemMessage: 'npm run build ล้มเหลว — ลองรันเองเพื่อดู error' }));
  }
}

// payload ที่ส่งเข้ามาไม่ได้ใช้แล้ว แต่ยังต้องอ่านให้หมดก่อน ไม่งั้นฝั่งที่เขียนอาจค้าง
let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', main);
process.stdin.on('error', main);
