// เซิร์ฟเวอร์ทดสอบในเครื่อง — เปิดเว็บที่ http://localhost:8765/
// ใช้ node ล้วน ไม่ต้องลงอะไรเพิ่ม (เดิมใช้ python ซึ่งบางเครื่องไม่มี)
//   node tools/devserver.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const vm = require('vm');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
// ลำดับการเลือกพอร์ต: PORT จากตัวจัดการ preview > อาร์กิวเมนต์ > 8765
const PORT = Number(process.env.PORT) || Number(process.argv[2]) || 8765;

// ฐานข้อมูลทดสอบ: firebase-config.local.js (ไม่ขึ้น git — ดู docs/test-db.md)
// หาในโฟลเดอร์นี้ก่อน แล้วค่อยหาในโฟลเดอร์หลักของ repo (worktree จะได้ใช้ไฟล์เดียวกัน)
const LOCAL_CFG_DIRS = [ROOT];
try {
  const common = execSync('git rev-parse --path-format=absolute --git-common-dir', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim();
  const main = path.dirname(common);
  if (path.resolve(main) !== path.resolve(ROOT)) LOCAL_CFG_DIRS.push(main);
} catch (e) {}
function readLocalFile(name) {
  for (const d of LOCAL_CFG_DIRS) {
    try {
      return fs.readFileSync(path.join(d, name), 'utf8');
    } catch (e) {}
  }
  return null;
}
const readLocalFirebaseConfig = () => readLocalFile('firebase-config.local.js');

// ฐานจริง — ต้องตรงกับ firebase-config.js · ใช้กันไม่ให้ฝั่งทดสอบชี้ไปของจริง
const REAL_PROJECT = 'phithan-green-5907';
const REAL_DB = 'https://phithan-green-5907-default-rtdb.asia-southeast1.firebasedatabase.app';

// ค่าใน firebase-config.local.js (รันในกล่องแยก) — ไม่มี/พัง/ชี้ของจริง = null
function testConfig() {
  const src = readLocalFirebaseConfig();
  if (!src) return null;
  try {
    const box = { window: {} };
    vm.runInNewContext(src, box, { timeout: 200 });
    const c = box.window.FIREBASE_TEST_CONFIG;
    if (!c || !c.databaseURL || !c.projectId || c.databaseURL === REAL_DB || c.projectId === REAL_PROJECT) return null;
    return c;
  } catch (e) {
    return null;
  }
}

// กุญแจ service account ของโปรเจกต์ทดสอบ (firebase-sa.local.json · ไม่ขึ้น git)
// ใช้ออกใบผ่านล็อกอินให้ฐานทดสอบ — ต้องเป็นของโปรเจกต์ทดสอบเท่านั้น ของจริงไม่รับ
function testServiceAccount(cfg) {
  const raw = readLocalFile('firebase-sa.local.json');
  if (!raw) return { sa: null, why: 'ไม่มี firebase-sa.local.json' };
  try {
    const j = JSON.parse(raw);
    if (j.project_id === REAL_PROJECT) return { sa: null, why: 'firebase-sa.local.json เป็นของโปรเจกต์จริง — ไม่ใช้' };
    if (j.project_id !== cfg.projectId) return { sa: null, why: 'firebase-sa.local.json เป็นของ ' + j.project_id + ' ไม่ตรง ' + cfg.projectId };
    return { sa: raw, why: '' };
  } catch (e) {
    return { sa: null, why: 'firebase-sa.local.json อ่านไม่ได้' };
  }
}

// รัน api/auth/login.mjs ตัวเดียวกับเว็บจริงในเครื่อง แต่ชี้ฐานทดสอบ
// gauth.mjs จำกุญแจไว้ตั้งแต่ครั้งแรก — เปลี่ยนกุญแจ/โปรเจกต์ทดสอบแล้วต้องรีสตาร์ตเซิร์ฟเวอร์
let loginMod = null, loginKey = '';
async function localLogin(req, bodyBuf, cfg, sa) {
  const key = cfg.databaseURL + '|' + sa;
  if (!loginMod) {
    process.env.FIREBASE_SERVICE_ACCOUNT = sa;
    process.env.RTDB_URL = cfg.databaseURL;
    loginKey = key;
    loginMod = await import(pathToFileURL(path.join(ROOT, 'api/auth/login.mjs')).href);
  } else if (key !== loginKey) {
    return new Response(JSON.stringify({ error: 'เปลี่ยน config/กุญแจฐานทดสอบแล้ว — รีสตาร์ต devserver' }), { status: 503 });
  }
  if (req.method === 'POST') {
    return loginMod.POST(new Request('http://localhost/api/auth/login', { method: 'POST', body: bodyBuf }));
  }
  return loginMod.GET();
}

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
    // ล็อกอิน — เครื่องนี้ไม่มี /api แต่ต้องได้ใบผ่าน Firebase ไม่งั้นกฎ auth != null อ่านอะไรไม่ได้
    // ฐานทดสอบ: รัน login.mjs ในเครื่องด้วยกุญแจโปรเจกต์ทดสอบ · ไม่มีกุญแจ = ตอบ fallback (เทียบ PIN ในเบราว์เซอร์)
    //   ห้ามส่งต่อไปเว็บจริงตอนใช้ฐานทดสอบ — ใบผ่านของโปรเจกต์จริงใช้กับฐานทดสอบไม่ได้
    // ฐานจริง: ส่งต่อเส้นนี้เส้นเดียวไปเว็บจริง ไม่เปิด /api อื่น (docs/security.md) · เปลี่ยนปลายทางด้วย DEV_API=https://...
    if (rel === '/api/auth/login') {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const send = async (r) => res.writeHead(r.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(await r.text());
        const cfg = testConfig();
        if (cfg) {
          const { sa, why } = testServiceAccount(cfg);
          if (!sa) {
            console.log('[ล็อกอินฐานทดสอบ] ' + why + ' → เทียบ PIN ในเบราว์เซอร์ (ต้องเปิดกฎฐานทดสอบ)');
            const j = req.method === 'POST' ? { error: 'auth not configured', fallback: true } : { configured: false };
            res.writeHead(req.method === 'POST' ? 503 : 200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(j));
            return;
          }
          localLogin(req, Buffer.concat(chunks), cfg, sa)
            .then(send)
            .catch((e) => {
              console.error('[ล็อกอินฐานทดสอบ]', e && e.message);
              res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' }).end('{"error":"local login"}');
            });
          return;
        }
        const api = (process.env.DEV_API || 'https://flashsolar.vercel.app').replace(/\/+$/, '');
        fetch(api + rel, {
          method: req.method === 'POST' ? 'POST' : 'GET',
          headers: { 'content-type': 'application/json' },
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        })
          .then(send)
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
      // แปะ config ฐานทดสอบไว้หน้า firebase-config.js — ไม่มีไฟล์ = ใช้ของจริงเหมือนเดิม
      if (!err && rel === '/firebase-config.js') {
        const local = testConfig() && readLocalFirebaseConfig();
        if (local) data = Buffer.concat([Buffer.from(local + '\n;\n'), data]);
      }
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
  .listen(PORT, () => {
    console.log('เปิดเว็บที่ http://localhost:' + PORT + '/');
    const cfg = testConfig();
    if (!cfg) {
      console.log(readLocalFirebaseConfig()
        ? 'ฐานข้อมูล: ของจริง — firebase-config.local.js ไม่ครบหรือชี้ของจริง (ดู docs/test-db.md)'
        : 'ฐานข้อมูล: ของจริง — ยังไม่มี firebase-config.local.js (ดู docs/test-db.md)');
    } else {
      const { sa, why } = testServiceAccount(cfg);
      console.log('ฐานข้อมูล: ทดสอบ (' + cfg.projectId + ') · ล็อกอิน: ' + (sa ? 'ออกใบผ่านในเครื่อง' : why + ' → เทียบ PIN ในเบราว์เซอร์'));
    }
  });
