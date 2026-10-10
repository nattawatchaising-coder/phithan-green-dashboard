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
    // ล็อกอินส่งต่อให้เว็บจริง — เครื่องนี้ไม่มี /api แต่ต้องได้ใบผ่าน Firebase ไม่งั้นกฎ auth != null อ่านอะไรไม่ได้
    // ส่งต่อเฉพาะเส้นนี้เส้นเดียว ไม่เปิด /api อื่น (docs/security.md) · เปลี่ยนปลายทางด้วย DEV_API=https://...
    if (rel === '/api/auth/login') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const api = (process.env.DEV_API || 'https://flashsolar.vercel.app').replace(/\/+$/, '');
        fetch(api + rel, {
          method: req.method === 'POST' ? 'POST' : 'GET',
          headers: { 'content-type': 'application/json' },
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        })
          .then(async (r) => res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(await r.text()))
          .catch(() => res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' }).end('{"error":"proxy"}'));
      });
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
