/* ดึงเส้นเวกเตอร์จาก PDF ที่พิมพ์ออกจาก CAD (หน้าเดียว) เป็นลายเส้นสำหรับชุดแบบ — ตรงต้นฉบับทุกเส้น (ไม่ต้องลอกจากรูป)
   node tools/pdf-art.mjs out.js NAME=ไฟล์.pdf[@x0,y0,x1,y1] [...]
   @… = ตัดเอาเฉพาะกรอบ (หน่วย pt จากมุมซ้ายบนหน้า) — เส้นที่อยู่นอกกรอบทั้งเส้นทิ้ง · เส้นคร่อมขอบตัดให้อยู่ในกรอบ
   ผล: window.DS_VEC[NAME] = { w, h, q, d } · w,h = pt · d = "ชนิด x,y,dx,dy,…" (หน่วย 1/q pt · y ลงล่าง) คั่น ";"
     ชนิด: k ดำ · g เทา · l เทาอ่อน · d เทาเข้ม · w ขาว (ลบทับ) · ตัวพิมพ์ใหญ่ K/G/L/D/W = ระบายทึบ (B* ของ CAD)
   รองรับ: q Q cm m l c re h S s B* b* f F f* W n RG rg G g w — ข้อความ/รูปภาพข้าม (CAD ส่งตัวหนังสือมาเป็นเส้นอยู่แล้ว) */
import fs from "fs";
import zlib from "zlib";

function pageContent(file) {
  const b = fs.readFileSync(file), s = b.toString("latin1"), out = [];
  const re = /(\d+) 0 obj\s*<<([\s\S]*?)>>\s*stream\r?\n/g; let m;
  while ((m = re.exec(s))) {
    if (/\/Subtype\s*\/Image|\/FontFile|\/Length1/.test(m[2])) continue;
    const st = m.index + m[0].length, e = s.indexOf("endstream", st);
    let txt; try { txt = /FlateDecode/.test(m[2]) ? zlib.inflateSync(b.subarray(st, e)).toString("latin1") : b.subarray(st, e).toString("latin1"); } catch (er) { continue; }
    if (/\b(re|l|m)\b/.test(txt) && /\bS\b|\bf\b|B\*/.test(txt) || /\bcm\b/.test(txt)) out.push(txt);
  }
  return { text: out.join("\n"), H: +((s.match(/\/MediaBox\s*\[\s*[\d.]+\s+[\d.]+\s+[\d.]+\s+([\d.]+)/) || [])[1] || 842) };
}

const cls = (r, g, b) => {
  const v = (r + g + b) / 3;
  if (v > 0.95) return "w"; if (v > 0.75) return "l"; if (v > 0.42) return "g"; if (v > 0.2) return "d"; return "k";
};

function convert(file, crop) {
  const { text, H } = pageContent(file);
  const T = text.replace(/%[^\n]*/g, "").match(/\[[^\]]*\]|\/[^\s/\[\]()<>]+|\([^)]*\)|<[^>]*>|[^\s\[\]()<>/]+/g) || [];
  let ct = [1, 0, 0, 1, 0, 0], sc = "k", fc = "k";
  const stack = [];
  let path = [], cur = null, sub = null;
  const items = [];
  const mul = (a, m2) => [a[0] * m2[0] + a[1] * m2[2], a[0] * m2[1] + a[1] * m2[3], a[2] * m2[0] + a[3] * m2[2], a[2] * m2[1] + a[3] * m2[3], a[4] * m2[0] + a[5] * m2[2] + m2[4], a[4] * m2[1] + a[5] * m2[3] + m2[5]];
  const P = (x, y) => [ct[0] * x + ct[2] * y + ct[4], H - (ct[1] * x + ct[3] * y + ct[5])];   // y ลงล่าง
  const ops = [];
  for (const t of T) {
    if (/^[-+.\d]/.test(t)) { ops.push(+t); continue; }
    const a = ops.splice(0);
    switch (t) {
      case "q": stack.push({ ct: ct.slice(), sc, fc }); break;
      case "Q": { const o = stack.pop(); if (o) { ct = o.ct; sc = o.sc; fc = o.fc; } break; }
      case "cm": ct = mul(a.slice(-6), ct); break;
      case "RG": sc = cls(a[0], a[1], a[2]); break;
      case "rg": fc = cls(a[0], a[1], a[2]); break;
      case "G": sc = cls(a[0], a[0], a[0]); break;
      case "g": fc = cls(a[0], a[0], a[0]); break;
      case "m": sub = [P(a[0], a[1])]; path.push(sub); cur = [a[0], a[1]]; break;
      case "l": if (!sub) { sub = [P(...cur)]; path.push(sub); } sub.push(P(a[0], a[1])); cur = [a[0], a[1]]; break;
      case "c": case "v": case "y": {
        let c1, c2, e;
        if (t === "c") { c1 = [a[0], a[1]]; c2 = [a[2], a[3]]; e = [a[4], a[5]]; }
        else if (t === "v") { c1 = cur; c2 = [a[0], a[1]]; e = [a[2], a[3]]; } else { c1 = [a[0], a[1]]; c2 = [a[2], a[3]]; e = c2; }
        const p0 = cur;
        for (let i = 1; i <= 8; i++) { const u = i / 8, w0 = (1 - u) ** 3, w1 = 3 * u * (1 - u) ** 2, w2 = 3 * u * u * (1 - u), w3 = u ** 3;
          sub.push(P(w0 * p0[0] + w1 * c1[0] + w2 * c2[0] + w3 * e[0], w0 * p0[1] + w1 * c1[1] + w2 * c2[1] + w3 * e[1])); }
        cur = e; break;
      }
      case "re": { const [x, y, w, h] = a; sub = [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h), P(x, y)]; path.push(sub); cur = [x, y]; break; }
      case "h": if (sub && sub.length) sub.push(sub[0].slice()); break;
      case "S": case "s": path.forEach((p) => { if (t === "s" && p.length) p.push(p[0].slice()); items.push({ c: sc, p }); }); path = []; sub = null; break;
      case "f": case "F": case "f*": path.forEach((p) => items.push({ c: fc.toUpperCase(), p })); path = []; sub = null; break;
      case "B": case "B*": case "b": case "b*": path.forEach((p) => { items.push({ c: fc.toUpperCase(), p }); items.push({ c: sc, p: p.concat([p[0].slice()]) }); }); path = []; sub = null; break;
      case "n": path = []; sub = null; break;   // W n = ตัดกรอบมองของ CAD — เส้นในไฟล์อยู่ในกรอบอยู่แล้ว
      default: break;
    }
  }
  /* ตัดกรอบ */
  const [X0, Y0, X1, Y1] = crop || [0, 0, 1e9, 1e9];
  const inside = (p) => p[0] >= X0 && p[0] <= X1 && p[1] >= Y0 && p[1] <= Y1;
  const clipSeg = (a, b) => {   // Liang-Barsky
    let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [p, q] of [[-dx, a[0] - X0], [dx, X1 - a[0]], [-dy, a[1] - Y0], [dy, Y1 - a[1]]]) {
      if (p === 0) { if (q < 0) return null; continue; }
      const r = q / p; if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
  };
  const out = [];
  items.forEach(({ c, p }) => {
    if (p.length < 2) return;
    if (c === c.toUpperCase()) { if (p.every(inside)) out.push({ c, p }); return; }
    let run = null;
    for (let i = 1; i < p.length; i++) {
      const sg = clipSeg(p[i - 1], p[i]);
      if (!sg) { run = null; continue; }
      if (run && Math.hypot(run[run.length - 1][0] - sg[0][0], run[run.length - 1][1] - sg[0][1]) < 1e-6) run.push(sg[1]);
      else { run = [sg[0], sg[1]]; out.push({ c, p: run }); }
      if (!inside(p[i])) run = null;
    }
  });
  const q = 10;   // 0.1 pt
  const d = out.map(({ c, p }) => {
    const r = p.map((v) => [Math.round((v[0] - X0) * q), Math.round((v[1] - Y0) * q)]);
    const k = r.filter((v, i) => !i || v[0] !== r[i - 1][0] || v[1] !== r[i - 1][1]);
    if (k.length < 2 && c === c.toLowerCase()) k.push(k[0]);
    return c + k.map((v, i) => (i ? [v[0] - k[i - 1][0], v[1] - k[i - 1][1]] : v).join(",")).join(",");
  }).join(";");
  return { w: Math.round((Math.min(X1, 1e6) - X0) * 10) / 10, h: Math.round((Math.min(Y1, 1e6) - Y0) * 10) / 10, q, d, n: out.length };
}

const [outFile, ...args] = process.argv.slice(2);
const res = {};
args.forEach((a) => {
  const i = a.indexOf("="), k = a.slice(0, i), rest = a.slice(i + 1), at = rest.lastIndexOf("@");
  const file = at > 0 ? rest.slice(0, at) : rest, crop = at > 0 ? rest.slice(at + 1).split(",").map(Number) : null;
  const r = convert(file, crop);
  res[k] = { w: r.w, h: r.h, q: r.q, d: r.d };
  console.log(k, r.w + "x" + r.h, "เส้น", r.n, "ขนาด", r.d.length);
});
fs.writeFileSync(outFile, "/* สร้างด้วย tools/pdf-art.mjs — ลายเส้นเวกเตอร์จาก PDF แบบของผู้ใช้ (ห้ามแก้มือ) */\nwindow.DS_VEC = Object.assign(window.DS_VEC || {}, " + JSON.stringify(res) + ");\n");
