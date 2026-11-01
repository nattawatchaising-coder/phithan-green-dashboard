/* ลอกรูปลายเส้น (PNG ขาวดำจากแบบ CAD) เป็นเส้น polyline สำหรับวาดในชุดแบบ — ใช้กับรูปที่ผู้ใช้ส่งมาให้ "เหมือน 100%"
   node tools/trace-art.mjs out.js NAME=รูป.png [NAME=รูป.png ...]
   ขั้นตอน: ถอด PNG → จุดมืด → บางลงเหลือเส้น 1 px (Zhang-Suen) → ไล่เส้นเป็นสาย → ลดจุด (Douglas-Peucker)
   ผล: window.DS_ART[NAME] = { w, h, d } · d = "x,y,dx,dy,…" คั่นเส้นด้วย ";" · เส้นสีจาง (เทา) ขึ้นต้น "g"
   ไม่มี dependency (ถอด PNG เองด้วย zlib) — รองรับ PNG 8 bit gray/RGB/RGBA ไม่ interlace */
import fs from "fs";
import zlib from "zlib";

function readPng(file) {
  const b = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, ct = 0, bd = 0; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString("ascii", p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; if (d[12]) throw new Error("interlaced"); }
    else if (type === "IDAT") idat.push(d);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if (bd !== 8) throw new Error("bit depth " + bd);
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[ct]; if (!bpp) throw new Error("color type " + ct);
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0, up = y ? out[row - stride + x] : 0, c = y && x >= bpp ? out[row - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      out[row + x] = v & 255;
    }
  }
  const lum = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * bpp; let l = bpp >= 3 ? (out[o] * 0.3 + out[o + 1] * 0.59 + out[o + 2] * 0.11) : out[o];
    const al = bpp === 4 ? out[o + 3] : bpp === 2 ? out[o + 1] : 255;
    lum[i] = Math.round(255 - (255 - l) * al / 255);
  }
  return { w, h, lum };
}

function thin(img, w, h) {
  const N = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      const del = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!img[y * w + x]) continue;
        const p = [N(x, y - 1), N(x + 1, y - 1), N(x + 1, y), N(x + 1, y + 1), N(x, y + 1), N(x - 1, y + 1), N(x - 1, y), N(x - 1, y - 1)];
        const B = p.reduce((s, v) => s + v, 0); if (B < 2 || B > 6) continue;
        let A = 0; for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) A++;
        if (A !== 1) continue;
        if (step === 0 ? (p[0] * p[2] * p[4] || p[2] * p[4] * p[6]) : (p[0] * p[2] * p[6] || p[0] * p[4] * p[6])) continue;
        del.push(y * w + x);
      }
      if (del.length) { changed = true; del.forEach((i) => (img[i] = 0)); }
    }
  }
}

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  /* เส้นปิด (ต้น=ปลาย) แบ่งครึ่งก่อน ไม่งั้นหัวท้ายจุดเดียวกันทำให้ทั้งห่วงยุบเหลือจุด (ตัว O D P หาย) */
  const n = pts.length - 1;
  if (pts[0][0] === pts[n][0] && pts[0][1] === pts[n][1]) { const m = n >> 1; return dp(pts.slice(0, m + 1), tol).concat(dp(pts.slice(m), tol).slice(1)); }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], L = Math.hypot(bx - ax, by - ay) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function trace(file, opt) {
  const { w, h, lum } = readPng(file), TH = opt.th || +process.env.TH || 190;
  const img = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) img[i] = lum[i] < TH ? 1 : 0;
  /* สีเฉลี่ยรอบจุด (ก่อนบาง) ไว้แยกเส้นเทา (เส้นเทาในรูปต้นแบบเฉลี่ย ~140–160 · เส้นดำบางที่ขอบเบลอ ≤120) */
  const dark = (x, y) => { let m = 255; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < w && yy < h) m = Math.min(m, lum[yy * w + xx]); } return m; };
  thin(img, w, h);
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && img[y * w + x];
  const D8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  /* m-adjacency: เพื่อนบ้านทแยงนับเมื่อช่องบน/ข้างที่คั่นอยู่ว่างทั้งคู่ — เส้นทแยงขั้นบันไดไม่กลายเป็นทางแยก และห่วงเล็กไม่หาย */
  const nb = (x, y) => D8.filter(([dx, dy]) => on(x + dx, y + dy) && (!dx || !dy || (!on(x + dx, y) && !on(x, y + dy)))).map(([dx, dy]) => [x + dx, y + dy]);
  const deg = (x, y) => nb(x, y).length;
  const seen = new Set(), ek = (a, b, c, d) => (a * h + b) < (c * h + d) ? (a * h + b) + "_" + (c * h + d) : (c * h + d) + "_" + (a * h + b);
  const chains = [];
  const walk = (x0, y0, x1, y1) => {
    const pts = [[x0, y0]]; let px = x0, py = y0, cx = x1, cy = y1; seen.add(ek(px, py, cx, cy));
    for (;;) {
      pts.push([cx, cy]);
      if (deg(cx, cy) !== 2) break;
      const nx = nb(cx, cy).find(([a, b]) => !(a === px && b === py) && !seen.has(ek(cx, cy, a, b)));
      if (!nx) break;
      seen.add(ek(cx, cy, nx[0], nx[1])); px = cx; py = cy; cx = nx[0]; cy = nx[1];
    }
    chains.push(pts);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y) && deg(x, y) !== 2) {
    if (deg(x, y) === 0) { chains.push([[x, y], [x, y]]); continue; }
    nb(x, y).forEach(([a, b]) => { if (!seen.has(ek(x, y, a, b))) walk(x, y, a, b); });
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) nb(x, y).forEach(([a, b]) => { if (!seen.has(ek(x, y, a, b))) walk(x, y, a, b); });
  const out = [];
  chains.forEach((c) => {
    let len = 0; for (let i = 1; i < c.length; i++) len += Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
    if (len < (opt.minLen || 1.5) && c.length > 2) return;
    const gv = c.reduce((s, p) => s + dark(p[0], p[1]), 0) / c.length, g = gv > (opt.gray || 130);
    out.push({ g, p: dp(c, opt.tol || 0.75) });
  });
  /* ต่อสายที่ปลายชนกันและไม่ใช่ทางแยก ลดจำนวนเส้น */
  const d = out.map((o) => (o.g ? "g" : "") + o.p.map((q, i) => (i ? [q[0] - o.p[i - 1][0], q[1] - o.p[i - 1][1]] : q).join(",")).join(",")).join(";");
  return { w, h, d, n: out.length, pts: out.reduce((s, o) => s + o.p.length, 0) };
}

const [outFile, ...args] = process.argv.slice(2);
const res = {};
args.forEach((a) => { const [k, f] = a.split("="); const r = trace(f, {}); res[k] = { w: r.w, h: r.h, d: r.d }; console.log(k, r.w + "x" + r.h, "เส้น", r.n, "จุด", r.pts, "ขนาด", r.d.length); });
fs.writeFileSync(outFile, "/* สร้างด้วย tools/trace-art.mjs — รูปลายเส้นรายละเอียดต่อลงดินตามแบบผู้ใช้ (ห้ามแก้มือ) */\nwindow.DS_ART = Object.assign(window.DS_ART || {}, " + JSON.stringify(res) + ");\n");
