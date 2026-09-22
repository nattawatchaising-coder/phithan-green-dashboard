// เซิร์ฟเวอร์ทดสอบในเครื่อง — เปิดเว็บที่ http://localhost:8765/
// ใช้ node ล้วน ไม่ต้องลงอะไรเพิ่ม (เดิมใช้ python ซึ่งบางเครื่องไม่มี)
//   node tools/devserver.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// ลำดับการเลือกพอร์ต: PORT จากตัวจัดการ preview > อาร์กิวเมนต์ > 8765
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8765;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pdf': 'application/pdf',
};

http
  .createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      res.writeHead(400).end('bad request');
      return;
    }
    if (rel.endsWith('/')) rel += 'index.html';

    const target = path.join(ROOT, rel);
    // กันเรียกไฟล์นอกโฟลเดอร์โปรเจกต์
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }

    fs.readFile(target, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('ไม่พบไฟล์: ' + rel);
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log('เปิดเว็บที่ http://localhost:' + PORT + '/'));
