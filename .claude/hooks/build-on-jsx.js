// แก้ไฟล์ .jsx ใน dashboard/ เสร็จเมื่อไหร่ ให้ build ใหม่ทันที
// เว็บโหลดจาก dashboard/build/ ไม่ได้โหลด .jsx ตรงๆ — ลืม build แล้วเว็บจะค้างโค้ดเก่าแบบเงียบๆ
const { execSync } = require('child_process');
const path = require('path');

const BACKSLASH = String.fromCharCode(92);
const TARGET = new RegExp('dashboard/.*[.]jsx$', 'i');

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let file = '';
  try {
    const payload = JSON.parse(raw);
    file = (payload.tool_input && payload.tool_input.file_path) || '';
  } catch (e) {
    return;
  }

  // path บน Windows มาเป็น backslash — ปรับให้เทียบง่ายก่อน
  if (!TARGET.test(file.split(BACKSLASH).join('/'))) return;

  const root = path.join(__dirname, '..', '..');
  try {
    // ผ่าน shell เพราะบน Windows node เรียก npm.cmd ตรงๆ ไม่ได้
    execSync('npm run build', { cwd: root, stdio: 'ignore' });
    console.log(JSON.stringify({ systemMessage: 'build ใหม่แล้ว — dashboard/build/ ตรงกับ .jsx' }));
  } catch (e) {
    console.log(JSON.stringify({ systemMessage: 'npm run build ล้มเหลว — ลองรันเองเพื่อดู error' }));
  }
});
