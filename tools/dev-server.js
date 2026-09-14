#!/usr/bin/env node
/* ================================================================
   dev-server — เสิร์ฟเว็บสำหรับพัฒนา พร้อม relay ออกเน็ตให้เบราว์เซอร์

   ใช้ตอนรันในเครื่อง/คอนเทนเนอร์ที่เบราว์เซอร์ออกอินเทอร์เน็ตตรงไม่ได้
   (ต้องผ่าน proxy ขององค์กร) แต่ Node ออกได้ — เบราว์เซอร์จะคุยกับ
   localhost อย่างเดียว แล้วให้ Node เป็นคนวิ่งออกไปข้างนอกแทน

     node tools/dev-server.js            # http://localhost:8765
     node tools/dev-server.js --port 3000

   ทำ 3 อย่าง
     1. เสิร์ฟไฟล์ในโปรเจกต์ตามปกติ
     2. /.ws, /.lp → ต่อไปยัง Firebase Realtime DB ตัวจริง (ทั้ง websocket
        และ long-polling) ทำให้โหมดออนไลน์ใช้งานได้ แก้ข้อมูลจริงได้
     3. /__ext/<url> → ดึงไฟล์จาก CDN/ฟอนต์/แผนที่มาให้ พร้อมแคชลงดิสก์
        และเขียน URL ในไฟล์ html/js/css ที่เสิร์ฟออกไปให้ชี้มาทางนี้

   เป็นเครื่องมือสำหรับตอนพัฒนาเท่านั้น ของที่ deploy จริงยังใช้ index.html
   เดิมที่ชี้ไป CDN และ Firebase ตรง ๆ ไม่เกี่ยวกับไฟล์นี้เลย
   ================================================================ */

const http = require("http");
const tls = require("tls");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".devcache");
const PORT = (() => {
  const i = process.argv.indexOf("--port");
  return i > -1 ? Number(process.argv[i + 1]) : Number(process.env.PORT) || 8765;
})();

/* CA ของ proxy — ถ้าไม่มีก็ใช้ชุดของระบบตามปกติ */
const CA = [process.env.NODE_EXTRA_CA_CERTS, "/root/.ccr/ca-bundle.crt"]
  .filter((p) => p && fs.existsSync(p))
  .map((p) => fs.readFileSync(p))[0];

/* โฮสต์ที่ยอมให้เขียน URL ใหม่ให้วิ่งผ่าน /__ext/ — ไลบรารี ฟอนต์ แผนที่
   ไม่รวมลิงก์ที่ผู้ใช้กดแล้วต้องเปิดออกไปข้างนอกจริง ๆ เช่น maps.app.goo.gl */
const EXT_HOSTS = [
  "unpkg.com", "cdn.jsdelivr.net", "cdnjs.cloudflare.com",
  "fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com",
  "server.arcgisonline.com", "nominatim.openstreetmap.org",
  "a.tile.openstreetmap.org", "b.tile.openstreetmap.org", "c.tile.openstreetmap.org",
  "tile.openstreetmap.org",
];

/* ---------- ต่อออกข้างนอก (ผ่าน HTTPS_PROXY ถ้ามี) ---------- */
function connectUpstream(host, cb) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const opts = { servername: host };
  if (CA) opts.ca = CA;
  if (!proxy) {
    const s = tls.connect({ host, port: 443, ...opts });
    s.once("secureConnect", () => cb(null, s));
    s.once("error", cb);
    return;
  }
  const u = new URL(proxy);
  const req = http.request({
    host: u.hostname, port: u.port || 80, method: "CONNECT",
    path: `${host}:443`, headers: { Host: `${host}:443` },
  });
  req.once("connect", (res, socket) => {
    if (res.statusCode !== 200) return cb(new Error(`proxy CONNECT → ${res.statusCode}`));
    const s = tls.connect({ socket, ...opts });
    s.once("secureConnect", () => cb(null, s));
    s.once("error", cb);
  });
  req.once("error", cb);
  req.end();
}

/* Agent ที่ต่อผ่าน tunnel ข้างบนแทนการต่อ TCP เอง — ต้องเป็น Agent จริง ๆ
   ถ้าส่ง createConnection ไปกับ http.request ตรง ๆ Node จะไม่เรียกให้ แล้ววิ่ง
   ออกพอร์ต 80 แบบไม่เข้ารหัสเงียบ ๆ */
class TunnelAgent extends http.Agent {
  constructor(host) { super({ keepAlive: false, maxSockets: 8 }); this.upstreamHost = host; }
  createConnection(opts, cb) { connectUpstream(this.upstreamHost, cb); }
}

/** ยิง HTTP request ออกไปข้างนอกผ่าน tunnel ที่หุ้ม TLS แล้ว */
function upstreamRequest(host, reqPath, method, headers, body, cb) {
  const r = http.request({
    agent: new TunnelAgent(host),
    host, path: reqPath, method,
    headers: Object.assign({}, headers, { host, "accept-encoding": "identity" }),
  });
  r.once("response", (res) => cb(null, res));
  r.once("error", cb);
  if (body && body.length) r.write(body);
  r.end();
}

/* ---------- ค่า Firebase — อ่านจาก firebase-config.js ไม่ฮาร์ดโค้ดซ้ำ ---------- */
const FB_SRC = fs.readFileSync(path.join(ROOT, "firebase-config.js"), "utf8");
const FB_URL = (FB_SRC.match(/databaseURL:\s*"([^"]+)"/) || [])[1];
if (!FB_URL) { console.error("อ่าน databaseURL จาก firebase-config.js ไม่ได้"); process.exit(1); }
const FB_HOST = new URL(FB_URL).hostname;
const FB_NS = FB_HOST.split(".")[0];

/* ---------- แคชไฟล์ภายนอกลงดิสก์ ---------- */
function cachePath(url) {
  return path.join(CACHE, url.replace(/^https?:\/\//, "").replace(/[^A-Za-z0-9._-]/g, "_"));
}

function serveExternal(url, res, depth = 0) {
  if (!EXT_HOSTS.includes(new URL(url).hostname)) { res.writeHead(403); return res.end("host not allowed"); }
  const cf = cachePath(url);
  const mf = cf + ".meta";
  if (fs.existsSync(cf) && fs.existsSync(mf)) {
    const meta = JSON.parse(fs.readFileSync(mf, "utf8"));
    res.writeHead(200, { "content-type": meta.type, "x-dev-cache": "hit" });
    return res.end(rewrite(fs.readFileSync(cf), meta.type));
  }
  const u = new URL(url);
  // ฟอนต์: ขอในนามเบราว์เซอร์ปกติ ไม่งั้น Google ส่ง .ttf ก้อนโตกลับมา
  const headers = { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" };
  upstreamRequest(u.hostname, u.pathname + u.search, "GET", headers, null, (err, up) => {
    if (err) { res.writeHead(502); return res.end("relay error: " + err.message); }
    if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location && depth < 4) {
      up.resume();
      return serveExternal(new URL(up.headers.location, url).toString(), res, depth + 1);
    }
    const chunks = [];
    up.on("data", (c) => chunks.push(c));
    up.on("end", () => {
      const buf = Buffer.concat(chunks);
      const type = up.headers["content-type"] || "application/octet-stream";
      if (up.statusCode === 200) {
        fs.mkdirSync(CACHE, { recursive: true });
        fs.writeFileSync(cf, buf);
        fs.writeFileSync(mf, JSON.stringify({ type }));
      }
      res.writeHead(up.statusCode, { "content-type": type, "x-dev-cache": "miss" });
      res.end(rewrite(buf, type));
    });
  });
}

/* ---------- เขียน URL ภายนอกในไฟล์ที่เสิร์ฟให้ชี้กลับมาที่ /__ext/ ---------- */
function rewrite(buf, type) {
  if (!/text\/html|javascript|text\/css/.test(type)) return buf;
  let s = buf.toString("utf8");
  for (const h of EXT_HOSTS) {
    s = s.split("https://" + h).join("/__ext/https://" + h);
  }
  return Buffer.from(s, "utf8");
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".jsx": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/* ---------- เซิร์ฟเวอร์ ---------- */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let p = decodeURIComponent(url.pathname);

  // Firebase REST / long-polling — ทุก path ที่ขึ้นต้นด้วยจุด ไฟล์ในโปรเจกต์ไม่มีแบบนั้น
  if (p.startsWith("/.")) {
    const body = [];
    req.on("data", (c) => body.push(c));
    req.on("end", () => {
      upstreamRequest(FB_HOST, p + url.search, req.method, { "user-agent": req.headers["user-agent"] || "" }, Buffer.concat(body), (err, up) => {
        if (err) { res.writeHead(502); return res.end("firebase relay error: " + err.message); }
        const h = Object.assign({}, up.headers);
        delete h["content-encoding"]; delete h["content-length"];
        h["access-control-allow-origin"] = "*";
        res.writeHead(up.statusCode, h);
        up.pipe(res);
      });
    });
    return;
  }

  // ไฟล์ภายนอก
  if (p.startsWith("/__ext/")) {
    const target = req.url.slice("/__ext/".length);
    if (!EXT_HOSTS.includes(new URL(target).hostname)) { res.writeHead(403); return res.end("host not allowed"); }
    return serveExternal(target, res);
  }

  // ไฟล์ในโปรเจกต์
  if (p === "/") p = "/index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("404 " + p);
  }
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  let buf = fs.readFileSync(file);

  // ชี้ Firebase มาที่ relay ตัวนี้ ns= คือชื่อฐานข้อมูลเดิม ข้อมูลยังเป็นตัวจริง
  if (p === "/firebase-config.js") {
    buf = Buffer.from(buf.toString("utf8").replace(FB_URL, `http://localhost:${PORT}?ns=${FB_NS}`), "utf8");
  }
  res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
  res.end(rewrite(buf, type));
});

/* websocket ของ Firebase — ส่งไบต์ต่อกันดิบ ๆ ไม่ต้องแกะเฟรม */
server.on("upgrade", (req, client, head) => {
  connectUpstream(FB_HOST, (err, up) => {
    if (err) { client.destroy(); return; }
    const lines = [`GET ${req.url} HTTP/1.1`, `Host: ${FB_HOST}`];
    for (const [k, v] of Object.entries(req.headers)) {
      if (k === "host") continue;
      lines.push(`${k}: ${v}`);
    }
    up.write(lines.join("\r\n") + "\r\n\r\n");
    if (head && head.length) up.write(head);
    up.pipe(client);
    client.pipe(up);
    const bye = () => { up.destroy(); client.destroy(); };
    up.on("error", bye); client.on("error", bye);
    up.on("close", bye); client.on("close", bye);
  });
});

server.listen(PORT, () => {
  console.log(`dev-server  → http://localhost:${PORT}/`);
  console.log(`firebase    → ${FB_HOST} (ns=${FB_NS}) ผ่าน relay ในเครื่อง`);
  console.log(`proxy ออกนอก → ${process.env.HTTPS_PROXY || "ต่อตรง"}${CA ? " + CA ของ proxy" : ""}`);
});
