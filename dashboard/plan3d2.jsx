/* ============================================================
   Plan3D Studio — ตัวออกแบบหลังคา & วางแผงแบบใหม่ (plan3d2.jsx)
   ------------------------------------------------------------
   ทำไมมีไฟล์นี้: ตัวแก้เดิม (Plan3DEditor ใน plan3d.jsx) แก้ทุกอย่างในฉาก 3 มิติ
   ลากพลาดวัตถุนิดเดียวกล้องก็หมุน · จุดจับมีขนาดเป็นเมตร ซูมออกแล้วจิ๋ว ·
   ลากหลังคาที่ยกสูงแล้ววัตถุไหลหนีเมาส์ (ยิงหาพื้น y=0) · เครื่องมือซ่อนอยู่ในหกแท็บ

   แนวคิดตัวใหม่
   · แก้ไขบน "ผัง 2D มุมบน" ที่วาดเป็น SVG ทับภาพดาวเทียม/โดรน — คลิกซ้ายลากไม่เคยหมุนกล้อง
     จุดจับมีขนาดเป็นพิกเซลเสมอ พิกัดเมาส์แปลงเป็นเมตรตรง ๆ ไม่มีอาการไหล
   · 3 มิติมีไว้ "ดูผล + ดูเงา" อย่างเดียว (หมุนกล้องได้อิสระเพราะไม่มีอะไรให้ลากพลาด)
   · ข้อมูลรูปแบบเดิมทุกตัวอักษร (plan3d/{jobId}) เปิดสลับกับแบบเก่าได้ตลอด
     ฟิลด์ที่ตัวนี้ไม่รู้จัก (โดม · กลุ่มหลังคา · sys ฯลฯ) ต้องถูกเก็บไว้ครบ — ห้าม "สร้างใหม่" ทั้งก้อน
   · ใช้เรขาคณิตของ plan3d.jsx ทั้งหมด (p3Panels / p3Xf / p3RoofSurf / p3FillBlk …)
     ไฟล์นี้จึงต้องโหลด "หลัง" plan3d.js เสมอ · ชื่อระดับโลกใช้คำนำหน้า p3s / P3S เท่านั้น

   เลือกแบบ: localStorage "p3_editor" = "v1" → แบบเก่า · อย่างอื่น → แบบใหม่ (Plan3DEntry)
   ============================================================ */

const P3S_PREF_KEY = "p3_editor";
function p3sPref() { try { return localStorage.getItem(P3S_PREF_KEY) === "v1" ? "v1" : "v2"; } catch (e) { return "v2"; } }
function p3sSetPref(v) { try { localStorage.setItem(P3S_PREF_KEY, v); } catch (e) {} }

const p3sR = (v, n) => Math.round((+v || 0) * (n || 100)) / (n || 100);
const p3sClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P3S_COMPASS = ["เหนือ", "ตะวันออกเฉียงเหนือ", "ตะวันออก", "ตะวันออกเฉียงใต้", "ใต้", "ตะวันตกเฉียงใต้", "ตะวันตก", "ตะวันตกเฉียงเหนือ"];
/* ทิศเข็มทิศจากองศา (0 = เหนือ ตามเข็ม) — เหนือคือ −Z บนผัง */
const p3sCompass = (deg) => P3S_COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/* หมุนเวกเตอร์ (x,z) รอบแกนตั้ง ด้วยสูตรเดียวกับ RY ของ p3Xf */
function p3sRY(x, z, a) { return { x: x * Math.cos(a) + z * Math.sin(a), z: -x * Math.sin(a) + z * Math.cos(a) }; }
/* หมุนบนผังตามเข็มนาฬิกาเมื่อมองจากบน (z ชี้ลงจอ) — ตรงกับ rotate() ของ SVG */
function p3sRot(x, z, rad) { const c = Math.cos(rad), s = Math.sin(rad); return { x: x * c - z * s, z: x * s + z * c }; }
function p3sCentroid(pts) {
  if (!pts.length) return { x: 0, z: 0 };
  let a = 0, cx = 0, cz = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const f = pts[j].x * pts[i].z - pts[i].x * pts[j].z;
    a += f; cx += (pts[j].x + pts[i].x) * f; cz += (pts[j].z + pts[i].z) * f;
  }
  if (Math.abs(a) < 1e-9) return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, z: pts.reduce((s, p) => s + p.z, 0) / pts.length };
  return { x: cx / (3 * a), z: cz / (3 * a) };
}
function p3sDistSeg(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
  const t = L2 ? p3sClamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / L2, 0, 1) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.z - (a.z + t * dz));
}

/* ── รูปทรงหลังคาบนผัง (พิกัดโลก) ── คืน [{ side, pts:[{x,z}] }]
   ใช้ขอบผืนชุดเดียวกับที่ระบบใช้วางแผง (p3RoofSurf) จึงตรงกับ 3D และ BOQ เสมอ
   เปิดทุกด้านก่อนถอดขอบ — ด้านที่ "ไม่วางแผง" ก็ยังเป็นหลังคาที่ต้องเห็นบนผัง */
const _p3sFaceCache = new WeakMap();
function p3sFaces2D(roof) {
  const hit = _p3sFaceCache.get(roof); if (hit) return hit;
  let out = [];
  try {
    if (roof.kind === "poly") {
      if (Array.isArray(roof.pts) && roof.pts.length >= 3) {
        const ph = p3PhOf(roof);
        const pts3 = roof.pts.map((p, i) => ({ x: (+roof.x || 0) + (+p.x || 0), y: ph[i], z: (+roof.z || 0) + (+p.z || 0) }));
        out = [{ side: null, pts: pts3.map((q) => ({ x: q.x, z: q.z })), asp: p3sFaceAsp(pts3) }];
      }
    } else if (roof.kind === "dome") {
      const D = p3DomeGeo(roof), a = -(((+roof.az || 180) - 180) * P3_DEG);
      out = [{ side: null, pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => {
        const q = p3sRY(sx * D.len / 2, sz * D.span / 2, a);
        return { x: q.x + (+roof.x || 0), z: q.z + (+roof.z || 0) };
      }) }];
    } else {
      const all = Object.assign({}, roof, { sideA: true, sideB: true, sideC: true, sideD: true });
      out = p3RoofSurf(all).map((s) => ({ side: s.side, pts: s.pts.map((q) => ({ x: q.x, z: q.z })), asp: p3sFaceAsp(s.pts) }));
    }
  } catch (e) { out = []; }
  _p3sFaceCache.set(roof, out);
  return out;
}
function p3sRoofPts(roof) { const o = []; p3sFaces2D(roof).forEach((f) => f.pts.forEach((p) => o.push(p))); return o; }
function p3sRoofHit(roof, w) { return p3sFaces2D(roof).some((f) => p3InPoly(w.x, w.z, f.pts)); }
function p3sRoofCenter(roof) {
  if (roof.kind === "poly") { const f = p3sFaces2D(roof)[0]; return f ? p3sCentroid(f.pts) : { x: +roof.x || 0, z: +roof.z || 0 }; }
  const pts = p3sRoofPts(roof);
  if (!pts.length) return { x: +roof.x || 0, z: +roof.z || 0 };
  return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, z: pts.reduce((s, p) => s + p.z, 0) / pts.length };
}
/* เส้นขอบรอบนอกของทั้งหลัง (สำหรับไฮไลต์/ผนัง 3D) — ทรงอิสระใช้มุมจริง ทรงอื่นใช้เปลือกนูนของทุกผืน */
function p3sHull(pts) {
  const P = pts.map((p) => [p.x, p.z]).sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  if (P.length < 3) return pts.slice();
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  P.forEach((p) => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop();
  return lo.concat(up).map((q) => ({ x: q[0], z: q[1] }));
}
function p3sOutline(roof) {
  if (roof.kind === "poly") { const f = p3sFaces2D(roof)[0]; return f ? f.pts : []; }
  return p3sHull(p3sRoofPts(roof));
}

/* ── รอยแผงบนผัง (รวมแผงที่ปิดไว้และช่องว่างให้แตะเพิ่ม) ──
   ลอกจาก p3Foot ทุกบรรทัด ต่างกันแค่ไม่ทิ้ง skip/slot เพราะผังต้องให้แตะเปิดคืนได้ */
const _p3sQuadCache = new WeakMap();
function p3sQuads(roof, want) {
  if (!want) { const hit = _p3sQuadCache.get(roof); if (hit) return hit; }
  let pan;
  try { pan = p3Panels(roof, want); } catch (e) { return []; }
  const blocks = pan.blocks || [];
  const X = p3Xf(roof, pan);
  const RX = X.RX, RY = X.RY, chain = X.chain, world = X.world;
  const out = [];
  (pan.list || []).forEach((p) => {
    const blk = blocks[p.blk] || { rot: 0, tilt: 0 };
    const ry = p3BlkRy(roof, blk), T = (+blk.tilt || 0) * P3_DEG;
    const c0 = roof.kind === "dome" || roof.kind === "poly" ? { x: p.x, y: p.y || 0, z: p.z } : { x: p.x, y: 0, z: p.z };
    const cw = world(chain(p.side, c0, false), false);
    let U, V;
    if (roof.kind === "poly" && pan.plane) {
      const P = pan.plane, cr = Math.cos(ry), sr = Math.sin(ry), cT = Math.cos(T), sT = Math.sin(T);
      const mix = (a, b, c) => ({ x: a * P.u.x + b * P.n.x - c * P.v.x, y: a * P.u.y + b * P.n.y - c * P.v.y, z: a * P.u.z + b * P.n.z - c * P.v.z });
      U = mix(cr * p.pw / 2, 0, -sr * p.pw / 2);
      V = mix(cT * sr * p.pd / 2, -sT * p.pd / 2, cT * cr * p.pd / 2);
    } else if (roof.kind === "dome") {
      U = world(chain(null, { x: p.pw / 2, y: 0, z: 0 }, true), true);
      V = world(chain(null, RX({ x: 0, y: 0, z: p.pd / 2 }, p.rx || 0), true), true);
    } else {
      U = world(chain(p.side, RY({ x: p.pw / 2, y: 0, z: 0 }, ry), true), true);
      V = world(chain(p.side, RY(RX({ x: 0, y: 0, z: p.pd / 2 }, T), ry), true), true);
    }
    out.push({ key: p.key, blk: p.blk || 0, side: p.side || null, skip: !!p.skip, slot: !!p.slot, cx: cw.x, cz: cw.z,
      pts: [{ x: cw.x - U.x - V.x, z: cw.z - U.z - V.z }, { x: cw.x + U.x - V.x, z: cw.z + U.z - V.z },
            { x: cw.x + U.x + V.x, z: cw.z + U.z + V.z }, { x: cw.x - U.x + V.x, z: cw.z - U.z + V.z }] });
  });
  if (!want) _p3sQuadCache.set(roof, out);
  return out;
}
/* แผงทั้งผืนรวมเป็น path ไม่กี่เส้น (แยกตามชุด + แผงที่ปิด) — งานโรงงานมีแผงเป็นพัน ๆ แผ่น
   ถ้าวาดทีละ polygon การเลื่อน/ซูมผังจะกระตุก */
const _p3sPathCache = new WeakMap();
function p3sQuadPaths(roof) {
  const hit = _p3sPathCache.get(roof); if (hit) return hit;
  const on = [], off = [];
  const f = (v) => Math.round(v * 1000) / 1000;
  p3sQuads(roof).forEach((q) => {
    const d = "M" + q.pts.map((p) => f(p.x) + " " + f(p.z)).join("L") + "Z";
    if (q.skip) off.push(d);
    else { (on[q.blk] = on[q.blk] || []).push(d); }
  });
  const out = { on: on.map((a) => (a ? a.join("") : "")), off: off.join("") };
  _p3sPathCache.set(roof, out);
  return out;
}
function p3sCount(roof) { try { return p3Panels(roof).count; } catch (e) { return 0; } }

/* ── แผนที่ผิวหลังคา (u,v) → ผัง (x,z) ของด้านหนึ่ง — ใช้แปลงการลากบนผังเป็นการเลื่อนชุดแผง ── */
function p3sSurfFn(roof, side) {
  let pan; try { pan = p3Panels(roof); } catch (e) { return null; }
  if (!pan.toMesh || roof.kind === "dome") return null;
  const X = p3Xf(roof, pan);
  return (u, v) => {
    const m = pan.toMesh({ u, v });
    const c = X.world(X.chain(side, { x: m.x, y: m.y || 0, z: m.z }, false), false);
    return { x: c.x, z: c.z };
  };
}
function p3sJac(fn, u, v) { const a = fn(u, v), b = fn(u + 1, v), c = fn(u, v + 1); return { a: b.x - a.x, b: c.x - a.x, c: b.z - a.z, d: c.z - a.z }; }
function p3sInvJ(J, dx, dz) {
  const det = J.a * J.d - J.b * J.c;
  if (Math.abs(det) < 1e-9) return { du: 0, dv: 0 };
  return { du: (J.d * dx - J.b * dz) / det, dv: (-J.c * dx + J.a * dz) / det };
}
/* มุมหมุนชุดแผง (องศา) ที่ทำให้แถวแผงขนานกับทิศ ang (เรเดียนบนผัง)
   ผิวของแต่ละทรงอาจกลับด้าน (ทรงอิสระราบ v = −z) — ดูเครื่องหมายจาก det ของจาโคเบียนแทนการเดา */
function p3sAlignRot(roof, side, ang) {
  const fn = p3sSurfFn(roof, side); if (!fn) return 0;
  const J = p3sJac(fn, 0, 0);
  const s = (J.a * J.d - J.b * J.c) < 0 ? -1 : 1;
  const phi0 = Math.atan2(J.c, J.a);
  let r = s * (ang - phi0) / P3_DEG;
  r = ((r % 180) + 180) % 180; if (r > 90) r -= 180;
  if (r > 45) r -= 90; else if (r < -45) r += 90;   // หมุนเกิน 45° = สลับแถว/คอลัมน์ ได้ผังเดียวกัน
  return p3sR(r, 10);
}
/* ทิศของขอบที่ยาวที่สุด (เรเดียนบนผัง) */
function p3sLongEdgeAng(pts) {
  let best = 0, ang = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b.x - a.x, b.z - a.z);
    if (L > best) { best = L; ang = Math.atan2(b.z - a.z, b.x - a.x); }
  }
  return ang;
}

/* ── หลังคาทรงอิสระ: ความสูงมุมจาก "ขอบชายคา + ความชัน" ──
   lowIdx = ขอบ pts[i]→pts[i+1] ที่เป็นชายคา (ต่ำสุด) · มุมอื่นสูงขึ้นตามระยะตั้งฉากจากขอบนั้น × tan(ชัน) */
function p3sPitchPh(pts, lowIdx, base, pitchDeg) {
  const n = pts.length; if (n < 3) return pts.map(() => base);
  const A = pts[((lowIdx % n) + n) % n], B = pts[(((lowIdx % n) + n) % n + 1) % n];
  const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
  let nx = -(B.z - A.z) / L, nz = (B.x - A.x) / L;
  const c = p3sCentroid(pts);
  if ((c.x - A.x) * nx + (c.z - A.z) * nz < 0) { nx = -nx; nz = -nz; }
  const t = Math.tan(p3sClamp(+pitchDeg || 0, 0, 60) * P3_DEG);
  return pts.map((p) => p3sR(base + Math.max(0, (p.x - A.x) * nx + (p.z - A.z) * nz) * t));
}
/* ทิศที่ขอบ i หันออก (องศาเข็มทิศ) */
function p3sEdgeBearing(pts, i) {
  const n = pts.length, A = pts[i], B = pts[(i + 1) % n];
  const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
  let nx = -(B.z - A.z) / L, nz = (B.x - A.x) / L;
  const c = p3sCentroid(pts);
  if ((c.x - A.x) * nx + (c.z - A.z) * nz > 0) { nx = -nx; nz = -nz; }   // ชี้ออกนอกผืน
  return ((Math.atan2(nx, -nz) / P3_DEG) + 360) % 360;
}
/* ขอบที่หันใต้ที่สุด — ชายคาตั้งต้นของหลังคาเพิง (แผงรับแดดดีที่สุดในไทย) */
function p3sSouthEdge(pts) {
  let best = 0, bd = 1e9;
  for (let i = 0; i < pts.length; i++) { const d = Math.abs(p3sEdgeBearing(pts, i) - 180); if (d < bd) { bd = d; best = i; } }
  return best;
}
/* ความชันปัจจุบันของผืนทรงอิสระ (องศา) จากระนาบ best-fit */
function p3sPolyPitch(roof) {
  try { const pl = p3PolyPlane(roof); return pl ? p3sR(Math.acos(p3sClamp(pl.tiltCos, -1, 1)) / P3_DEG, 10) : 0; } catch (e) { return 0; }
}

/* ── เชื่อมรอยต่อหลังคาที่วาดทีละผืน → หลังคาทั้งหลังเป็นทรงจริง ──
   ผืนลาดเดียวที่ใช้มุมร่วมกัน (สัน/ตะเข้/ราง) ต้องสูงเท่ากันตรงมุมนั้น ไม่งั้นใน 3D ผืนลอยแยกหรือทะลุกัน
   1) มุมของผืนหนึ่งที่ตกกลางขอบผืนอื่น → แทรกมุมลงขอบนั้น (รอยต่อรูปตัว T)
   2) มุมที่ห่างกันไม่ถึง tol (40 ซม.) = มุมเดียวกัน
   3) ชายคาเลือกใหม่ทั้งหลังทุกครั้ง: ขอบยาวสุดที่ไม่ติดผืนอื่น (ขอบนอกของหลังคา) — ตอนวาดผืนแรก ๆ ยังไม่รู้ว่าผืนข้าง ๆ
      จะมาต่อตรงไหน จึงเลือกผิดได้ · ผืนที่ผู้ใช้แตะเลือกชายคาเอง (p3sEaveFix) ใช้ตามนั้น
   4) ทั้งหลังชันเท่ากัน (หลังคาจริงเป็นแบบนี้ — สันและตะเข้จึงอยู่กึ่งกลางเอง) ชายคาสูงเท่ากัน
      ความสูง = ชายคา + tan(ชัน) × ระยะจากชายคา แล้วมุมร่วมรวมเป็นจุดเดียว (เฉลี่ย x z y) ทำซ้ำให้นิ่ง
   focusIds = ทำเฉพาะกลุ่มผืนที่ต่อกับผืนเหล่านี้ · opt.pitch = ตั้งความชันใหม่ทั้งหลัง · opt.mark = ติดป้าย p3sFacet
   คืน gap = มุมที่ต้องขยับขึ้นลงมากสุด (ม.) — ไม่ถึง 3 ซม. ถือว่าเข้าทรงแล้ว */
function p3sWeldFacets(roofs, focusIds, opt) {
  opt = opt || {};
  const tol = opt.tol || 0.4;
  const F = [];
  (roofs || []).forEach((r, ri) => {
    if (r.kind !== "poly" || !Array.isArray(r.pts) || r.pts.length < 3) return;
    const pitch = p3sPolyPitch(r); if (!(pitch > 0.4) && !r.p3sFacet) return;
    const ox = +r.x || 0, oz = +r.z || 0, ph = p3PhOf(r), n = r.pts.length;
    let lo = 0;
    if (r.p3sLow != null) lo = ((+r.p3sLow % n) + n) % n;
    else { let bv = 1e9; for (let i = 0; i < n; i++) { const v = ph[i] + ph[(i + 1) % n]; if (v < bv) { bv = v; lo = i; } } }
    const P = r.pts.map((p, i) => ({ x: ox + (+p.x || 0), z: oz + (+p.z || 0), y: ph[i], orig: i }));
    F.push({ r, ri, P, lo, pitch, A: { x: P[lo].x, z: P[lo].z }, B: { x: P[(lo + 1) % n].x, z: P[(lo + 1) % n].z }, e: Math.min(ph[lo], ph[(lo + 1) % n]) });
  });
  const none = { roofs, n: 0, gap: 0 };
  if (F.length < 2) return none;
  // 1) รอยต่อตัว T
  F.forEach((f, fi) => {
    const out = [];
    f.P.forEach((a, i) => {
      out.push(a);
      const b = f.P[(i + 1) % f.P.length], L2 = (b.x - a.x) * (b.x - a.x) + (b.z - a.z) * (b.z - a.z);
      if (L2 < 1e-6) return;
      const ins = [];
      F.forEach((g, gi) => {
        if (gi === fi) return;
        g.P.forEach((v) => {
          if (Math.hypot(v.x - a.x, v.z - a.z) < tol || Math.hypot(v.x - b.x, v.z - b.z) < tol) return;
          if (p3sDistSeg(v, a, b) >= tol) return;
          const t = ((v.x - a.x) * (b.x - a.x) + (v.z - a.z) * (b.z - a.z)) / L2;
          if (t <= 0 || t >= 1 || ins.some((q) => Math.abs(q.t - t) * Math.sqrt(L2) < tol)) return;
          ins.push({ t });
        });
      });
      ins.sort((p, q) => p.t - q.t).forEach((q) => out.push({ x: a.x + (b.x - a.x) * q.t, z: a.z + (b.z - a.z) * q.t, y: a.y + (b.y - a.y) * q.t, orig: -1 }));
    });
    f.P = out;
  });
  // 2) จับกลุ่มมุมร่วม
  const V = []; F.forEach((f, fi) => f.P.forEach((p) => V.push({ fi, p })));
  const par = V.map((_, i) => i), fnd = (i) => (par[i] === i ? i : (par[i] = fnd(par[i])));
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
    if (V[i].fi !== V[j].fi && Math.hypot(V[i].p.x - V[j].p.x, V[i].p.z - V[j].p.z) < tol) par[fnd(i)] = fnd(j);
  }
  const CM = {}; V.forEach((v, i) => { const k = fnd(i); (CM[k] = CM[k] || []).push(v); });
  const clusters = Object.keys(CM).map((k) => CM[k]).filter((c) => new Set(c.map((v) => v.fi)).size > 1);
  if (!clusters.length) return none;
  const fp = F.map((_, i) => i), ff = (i) => (fp[i] === i ? i : (fp[i] = ff(fp[i])));
  clusters.forEach((c) => c.forEach((v) => { fp[ff(v.fi)] = ff(c[0].fi); }));
  const focus = focusIds && focusIds.length ? new Set(focusIds) : null;
  const act = new Set(); F.forEach((f, i) => { if (!focus || focus.has(f.r.id)) act.add(ff(i)); });
  const linked = new Set(); clusters.forEach((c) => c.forEach((v) => linked.add(v.fi)));
  const use = F.map((f, i) => act.has(ff(i)) && linked.has(i));
  const U = []; use.forEach((u, i) => { if (u) U.push(i); });
  if (!U.length) return none;
  const uc = clusters.filter((c) => use[c[0].fi]);
  // รหัสมุมร่วม (มุมที่ไม่มีใครใช้ร่วม = รหัสของตัวเอง)
  V.forEach((v, i) => { v.p.cid = fnd(i); v.p.y0 = v.p.y; });
  // 3) ชายคาใหม่ทั้งหลัง: ขอบนอก (มีผืนเดียวที่ใช้ขอบนี้) ที่ยาวที่สุดของผืน
  const ek = (a, b) => (a < b ? a + "_" + b : b + "_" + a), ecount = {};
  U.forEach((fi) => { const P = F[fi].P; P.forEach((a, i) => { const k = ek(a.cid, P[(i + 1) % P.length].cid); ecount[k] = (ecount[k] || 0) + 1; }); });
  U.forEach((fi) => {
    const f = F[fi], P = f.P;
    f.loP = Math.max(0, P.findIndex((q) => q.orig === f.lo));
    if (f.r.p3sEaveFix) return;
    let best = -1, bl = 0;
    P.forEach((a, i) => {
      const b = P[(i + 1) % P.length]; if (ecount[ek(a.cid, b.cid)] > 1) return;
      const L = Math.hypot(b.x - a.x, b.z - a.z); if (L > bl + 1e-6) { bl = L; best = i; }
    });
    if (best >= 0) f.loP = best;
  });
  // 4) ความชันและความสูงชายคาเดียวกันทั้งหลัง
  const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length ? (b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2) : null; };
  const fp0 = focus ? U.find((fi) => focus.has(F[fi].r.id)) : null;
  let pc = opt.pitch != null ? +opt.pitch : null;
  if (pc == null && fp0 != null && +F[fp0].r.p3sPitch > 0) pc = +F[fp0].r.p3sPitch;
  if (pc == null) pc = med(U.map((fi) => +F[fi].r.p3sPitch).filter((v) => v > 0));
  if (pc == null) pc = med(U.map((fi) => F[fi].pitch).filter((v) => v >= 3));
  if (pc == null) pc = 20;
  pc = p3sClamp(pc, 1, 60);
  const k = Math.tan(pc * P3_DEG);
  const e = p3sR(med(U.map((fi) => { const P = F[fi].P, i = F[fi].loP; return Math.min(P[i].y, P[(i + 1) % P.length].y); })) || 3);
  for (let it = 0; it < 4; it++) {
    U.forEach((fi) => {
      const P = F[fi].P, A = P[F[fi].loP], B = P[(F[fi].loP + 1) % P.length];
      const L = Math.hypot(B.x - A.x, B.z - A.z) || 1;
      let nx = -(B.z - A.z) / L, nz = (B.x - A.x) / L;
      const c = p3sCentroid(P);
      if ((c.x - A.x) * nx + (c.z - A.z) * nz < 0) { nx = -nx; nz = -nz; }
      P.forEach((q) => { q.y = e + k * Math.max(0, (q.x - A.x) * nx + (q.z - A.z) * nz); });
    });
    uc.forEach((c) => {
      const sx = c.reduce((a, v) => a + v.p.x, 0) / c.length, sz = c.reduce((a, v) => a + v.p.z, 0) / c.length, sy = c.reduce((a, v) => a + v.p.y, 0) / c.length;
      c.forEach((v) => { v.p.x = sx; v.p.z = sz; v.p.y = sy; });
    });
  }
  let gap = 0;
  U.forEach((fi) => F[fi].P.forEach((q) => { gap = Math.max(gap, Math.abs(q.y - q.y0)); }));
  const out = roofs.slice();
  U.forEach((fi) => {
    const f = F[fi], r = f.r, ox = +r.x || 0, oz = +r.z || 0;
    const nr = Object.assign({}, r, {
      pts: f.P.map((p) => ({ x: p3sR(p.x - ox), z: p3sR(p.z - oz) })),
      ph: f.P.map((p) => p3sR(p.y)),
      p3sLow: f.loP, p3sPitch: p3sR(pc, 10),
    });
    if (opt.mark) nr.p3sFacet = true;
    out[f.ri] = nr;
  });
  return { roofs: out, n: U.length, gap };
}

/* ── ขอบเขตของทุกอย่างบนผัง (ใช้จัดกรอบภาพ) ── */
function p3sBounds(st, photoAR) {
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  const eat = (x, z) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (z < minZ) minZ = z; if (z > maxZ) maxZ = z; };
  (st.roofs || []).forEach((r) => p3sRoofPts(r).forEach((p) => eat(p.x, p.z)));
  (st.obstacles || []).forEach((o) => { const R = Math.max(+o.w || 1, +o.d || 1) / 2; eat((+o.x || 0) - R, (+o.z || 0) - R); eat((+o.x || 0) + R, (+o.z || 0) + R); });
  if (minX <= maxX) { const pad = Math.max(3, (maxX - minX) * 0.15); return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad }; }
  if (st.baseMap && st.baseMap.url) { const W = (+st.baseMap.widthM || 30) / 2; eat(-W, -W); eat(W, W); }
  if (st.photo) { const W = (+st.photoW || 30) / 2, H = W * (photoAR || 1); eat((+st.photoX || 0) - W, (+st.photoZ || 0) - H); eat((+st.photoX || 0) + W, (+st.photoZ || 0) + H); }
  if (minX > maxX) return { minX: -15, maxX: 15, minZ: -12, maxZ: 12 };
  return { minX, maxX, minZ, maxZ };
}

/* ต่อของที่บันทึกไว้ให้ครบรูปแบบปัจจุบัน — สูตรเดียวกับตอนแบบเก่าโหลด (เก็บทุกฟิลด์เดิมไว้) */
function p3sLoad(saved, job) {
  const base = p3Blank(job);
  if (!saved) return base;
  const m = Object.assign({}, base, saved, { sun: Object.assign({}, base.sun, saved.sun || {}) });
  m.roofs = (saved.roofs || []).map((r) => Object.assign({}, p3NewRoof(1), r, { skips: r.skips || {}, pts: r.pts || null }));
  m.obstacles = saved.obstacles || [];
  m.measures = saved.measures || [];
  return m;
}
/* บล็อกแผงของผืนในรูปที่เก็บลงฐานข้อมูล (ผืนเก่าที่ยังไม่มี blocks จะถูกแปลงตอนแก้ครั้งแรก) — เหมือน blkStore ของแบบเก่า */
function p3sBlkStore(roof) {
  return p3Blocks(roof).map((b) => ({
    id: b.id, orient: b.orient, rows: b.rows, cols: b.cols, gap: b.gap,
    du: b.du, dv: b.dv, rot: b.rot, tilt: b.tilt, skips: b.skips, adds: b.adds,
    gc: b.gc, gr: b.gr, gg: b.gg, keep: b.keep,
  }));
}
const p3sBlkOfKey = (key) => { const m = /^b(\d+)_/.exec(key || ""); return m ? +m[1] : 0; };

/* ── ตัวช่วยวาดจากภาพ: แตะกลางหลังคา → ขยายพื้นที่สีใกล้เคียง → ขอบ → รูปหลายเหลี่ยม ──
   ไม่ใช่ AI: ทำงานในเครื่องล้วน ใช้ได้ดีกับหลังคาสีเรียบ (เมทัลชีต/กระเบื้องสีเดียว)
   หลังคาที่มีเงาพาดหรือสีกลืนพื้น ให้ลดความไว หรือวาดเองแล้วลากมุมปรับ */
const _p3sImgs = {};
function p3sImg(url) {
  if (!_p3sImgs[url]) {
    _p3sImgs[url] = new Promise((res, rej) => {
      const im = new Image();
      if (!/^data:/.test(url)) im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = () => { delete _p3sImgs[url]; rej(new Error("โหลดภาพไม่สำเร็จ")); };
      im.src = url;
    });
  }
  return _p3sImgs[url];
}
function p3sSimplify(pts, eps) {
  if (pts.length < 4) return pts.slice();
  const dp = (a, b, arr) => {
    let mx = -1, mi = -1;
    for (let i = a + 1; i < b; i++) { const d = p3sDistSeg(arr[i], arr[a], arr[b]); if (d > mx) { mx = d; mi = i; } }
    if (mx > eps) return dp(a, mi, arr).concat(dp(mi, b, arr).slice(1));
    return [arr[a], arr[b]];
  };
  // ปิดวง: แยกที่สองจุดที่ห่างกันที่สุด แล้วทำทีละครึ่ง
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[0].x, pts[i].z - pts[0].z); if (d > fd) { fd = d; far = i; } }
  const A = dp(0, far, pts), B = dp(far, pts.length, pts.concat([pts[0]]));
  return A.concat(B.slice(1, -1));
}
/* เก็บกวาดรูปที่ได้จากขอบพิกเซล: ตัดขอบสั้นกว่า 0.8 ม. และมุมที่แทบเป็นเส้นตรง (< 15°) ซ้ำจนนิ่ง
   ขอบหลังคาจริงเป็นเส้นตรงยาว ๆ — ฟันเลื่อยเล็ก ๆ มาจากเงา/ลอนหลังคา/แผงเดิมบนภาพ */
function p3sClean(pts) {
  let P = pts.slice();
  for (let it = 0; it < 2000 && P.length > 4; it++) {
    const n = P.length;
    let worst = -1, wv = 1e9;
    for (let i = 0; i < n; i++) {
      const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
      const l1 = Math.hypot(b.x - a.x, b.z - a.z), l2 = Math.hypot(c.x - b.x, c.z - b.z);
      const t = Math.abs(Math.atan2((b.x - a.x) * (c.z - b.z) - (b.z - a.z) * (c.x - b.x), (b.x - a.x) * (c.x - b.x) + (b.z - a.z) * (c.z - b.z)));
      const score = Math.min(l1, l2) < 0.8 ? Math.min(l1, l2) - 10 : t < 15 * P3_DEG ? t : 1e9;
      if (score < wv) { wv = score; worst = i; }
    }
    if (worst < 0 || wv >= 1e9) break;
    P.splice(worst, 1);
  }
  return P;
}
async function p3sTrace(st, seed, tol) {
  const layers = [];
  try {
    if (st.baseMap && st.baseMap.url) layers.push({ img: await p3sImg(st.baseMap.url), base: true });
    if (st.photo) layers.push({ img: await p3sImg(st.photo), base: false });
  } catch (e) { return { err: e.message }; }
  if (!layers.length) return { err: "ยังไม่มีภาพพื้นหลัง — เพิ่มภาพดาวเทียมหรือรูปโดรนก่อน" };
  const res = 0.1, Wm = 120, N = Math.round(Wm / res);   // พอสำหรับหลังคาโรงงานกว้างร้อยเมตร
  const cv = document.createElement("canvas"); cv.width = N; cv.height = N;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, N, N);
  const ox = seed.x - Wm / 2, oz = seed.z - Wm / 2;
  ctx.setTransform(1 / res, 0, 0, 1 / res, -ox / res, -oz / res);
  layers.forEach((L) => {
    if (L.base) { const W = +st.baseMap.widthM || 30; ctx.drawImage(L.img, -W / 2, -W / 2, W, W); }
    else {
      const pw = +st.photoW || 30, ph = pw * (L.img.naturalHeight / (L.img.naturalWidth || 1));
      ctx.save(); ctx.translate(+st.photoX || 0, +st.photoZ || 0); ctx.rotate((+st.photoRot || 0) * P3_DEG);
      ctx.drawImage(L.img, -pw / 2, -ph / 2, pw, ph); ctx.restore();
    }
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  let data;
  try { data = ctx.getImageData(0, 0, N, N).data; } catch (e) { return { err: "ภาพนี้ใช้ตัวช่วยวาดไม่ได้ (ภาพจากเซิร์ฟเวอร์อื่น) — วาดเองได้ตามปกติ" }; }
  // เบลอ 3×3 ลดลายเม็ดภาพ/ลอนหลังคา ไม่ให้แตกเป็นหย่อม
  const R = new Float32Array(N * N), G = new Float32Array(N * N), B = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
      const k = (yy * N + xx) * 4; r += data[k]; g += data[k + 1]; b += data[k + 2]; n++;
    }
    const i = y * N + x; R[i] = r / n; G[i] = g / n; B[i] = b / n;
  }
  const sx = Math.floor(N / 2), sy = Math.floor(N / 2);
  let mr = 0, mg = 0, mb = 0, mn = 0;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const i = (sy + dy) * N + sx + dx; mr += R[i]; mg += G[i]; mb += B[i]; mn++; }
  mr /= mn; mg /= mn; mb /= mn;
  const T2 = tol * tol;
  const mask = new Uint8Array(N * N), q = new Int32Array(N * N);
  let qh = 0, qt = 0, area = 0, edge = 0;
  mask[sy * N + sx] = 1; q[qt++] = sy * N + sx;
  while (qh < qt) {
    const i = q[qh++]; area++;
    const x = i % N, y = (i / N) | 0;
    if (x === 0 || y === 0 || x === N - 1 || y === N - 1) edge++;
    const nb = [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1];
    for (let k = 0; k < 4; k++) {
      const j = nb[k]; if (j < 0 || mask[j]) continue;
      const dr = R[j] - mr, dg = G[j] - mg, db = B[j] - mb;
      if (dr * dr + dg * dg + db * db <= T2) { mask[j] = 1; q[qt++] = j; }
    }
  }
  if (area < 120) return { err: "พื้นที่ที่จับได้เล็กเกินไป — ลองเพิ่มความไว หรือแตะกลางหลังคาให้ชัดขึ้น" };
  if (edge > N * 0.6 || area > N * N * 0.7) return { err: "สีหลังคากลืนกับรอบข้าง ขอบไม่ชัด — ลองลดความไว หรือวาดเอง" };
  // ปิดรู/รอยแยกเล็ก ๆ (ช่องแสง ลอนเงา) : ขยาย 2 → หด 2
  const morph = (src, grow) => {
    const out = new Uint8Array(N * N), rad = 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = grow ? 0 : 1;
      for (let dy = -rad; dy <= rad && (grow ? !v : v); dy++) for (let dx = -rad; dx <= rad; dx++) {
        const xx = x + dx, yy = y + dy;
        const s = xx < 0 || yy < 0 || xx >= N || yy >= N ? 0 : src[yy * N + xx];
        if (grow && s) { v = 1; break; }
        if (!grow && !s) { v = 0; break; }
      }
      out[y * N + x] = v;
    }
    return out;
  };
  let m2 = morph(morph(mask, true), false);
  // อุดรูข้างใน: ไล่จากขอบภาพด้านนอก ที่ไปไม่ถึง = ข้างในผืน
  const outside = new Uint8Array(N * N); qh = 0; qt = 0;
  for (let i = 0; i < N; i++) [i, (N - 1) * N + i, i * N, i * N + N - 1].forEach((j) => { if (!m2[j] && !outside[j]) { outside[j] = 1; q[qt++] = j; } });
  while (qh < qt) {
    const i = q[qh++], x = i % N, y = (i / N) | 0;
    [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, y > 0 ? i - N : -1, y < N - 1 ? i + N : -1].forEach((j) => {
      if (j >= 0 && !m2[j] && !outside[j]) { outside[j] = 1; q[qt++] = j; }
    });
  }
  for (let i = 0; i < N * N; i++) if (!outside[i]) m2[i] = 1;
  // เดินขอบ: สร้างเส้นขอบพิกเซลแบบมีทิศ (ข้างในอยู่ขวามือเสมอ) แล้วต่อเป็นวง เลือกวงที่ใหญ่สุด
  const ins = (x, y) => x >= 0 && y >= 0 && x < N && y < N && m2[y * N + x] === 1;
  const nxt = new Map();
  const add = (ax, ay, bx, by) => { const k = ax + "," + ay; const a = nxt.get(k); const v = [bx, by]; if (a) a.push(v); else nxt.set(k, [v]); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (!m2[y * N + x]) continue;
    if (!ins(x, y - 1)) add(x, y, x + 1, y);
    if (!ins(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!ins(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!ins(x - 1, y)) add(x, y + 1, x, y);
  }
  let best = null;
  nxt.forEach((_, k0) => {
    if (!nxt.get(k0) || !nxt.get(k0).length) return;
    const loop = [];
    let k = k0, guard = 0;
    while (guard++ < 400000) {
      const arr = nxt.get(k); if (!arr || !arr.length) break;
      const v = arr.pop(); if (!arr.length) nxt.delete(k);
      const [x, y] = k.split(",").map(Number); loop.push({ x, z: y });
      k = v[0] + "," + v[1];
      if (k === k0) break;
    }
    if (loop.length > 8 && (!best || loop.length > best.length)) best = loop;
  });
  if (!best) return { err: "หาขอบหลังคาไม่เจอ — ลองแตะใหม่หรือวาดเอง" };
  let poly = p3sClean(p3sSimplify(best, 0.45 / res).map((p) => ({ x: p3sR(ox + p.x * res), z: p3sR(oz + p.z * res) })));
  if (poly.length < 3) return { err: "หาขอบหลังคาไม่เจอ — ลองแตะใหม่หรือวาดเอง" };
  // ใกล้สี่เหลี่ยมมาก → ใช้สี่เหลี่ยมพอดีเป๊ะ (มุมฉากเนียน ไม่เป็นฟันเลื่อย)
  const mr0 = p3MinRect(poly), A = p3Area(poly);
  if (mr0 && A / mr0.area > 0.9) {
    const c = Math.cos(mr0.ang), s = Math.sin(mr0.ang);
    poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const u = a * mr0.w / 2, v = b * mr0.d / 2;
      return { x: p3sR(mr0.cx + u * c - v * s), z: p3sR(mr0.cz + u * s + v * c) };
    });
  }
  // ขอบหยัก ๆ เยอะ = สีรั่วออกไปนอกหลังคา (ลาน/หลังคาข้างเคียงสีใกล้กัน) — ยังให้ใช้ได้แต่เตือน
  return { pts: poly, area: p3sR(p3Area(poly), 10), warn: poly.length > 14 ? "ขอบหยักผิดปกติ อาจรวมพื้นที่รอบ ๆ เข้ามา — ลองลดความไว หรือใช้แล้วลากมุมปรับ" : null };
}

/* ============================================================
   อ่าน "ขอบ" ในภาพ แทนการอ่าน "สี" — หลังคาสีเข้ม/ด่าง/มีเงาก็ยังมีขอบให้เห็น
   ------------------------------------------------------------
   ตัวไล่สี (p3sTrace) พังกับหลังคาสีเข้ม เพราะหลังคากับเงา/พื้นรอบ ๆ สีใกล้กัน
   ตรงนี้ใช้ความชันของความสว่าง (Sobel) หลังยืดคอนทราสต์เฉพาะบริเวณ แล้วนำไปใช้ 3 อย่าง
     1) หาแนวหลังคาอัตโนมัติ — ฮิสโทแกรมทิศของขอบ (mod 90°) ยอดสูงสุด = แนวอาคาร
     2) แตะกลางหลังคา → ยิงหาขอบ 4 ทิศตามแนว ได้สี่เหลี่ยมพอดีหลังคา
     3) ดูดขอบภาพ — ระหว่างวาด เคอร์เซอร์เกาะเส้นขอบที่ใกล้ที่สุด
   ทั้งหมดทำงานในเครื่อง ไม่ส่งภาพออกไปไหน
   ============================================================ */
async function p3sEdgeField(st, center, Wm, res) {
  const layers = [];
  try {
    if (st.baseMap && st.baseMap.url) layers.push({ img: await p3sImg(st.baseMap.url), base: true });
    if (st.photo) layers.push({ img: await p3sImg(st.photo), base: false });
  } catch (e) { return { err: e.message }; }
  if (!layers.length) return { err: "ยังไม่มีภาพพื้นหลัง" };
  const N = Math.round(Wm / res);
  const cv = document.createElement("canvas"); cv.width = N; cv.height = N;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, N, N);
  const ox = center.x - Wm / 2, oz = center.z - Wm / 2;
  ctx.setTransform(1 / res, 0, 0, 1 / res, -ox / res, -oz / res);
  layers.forEach((L) => {
    if (L.base) { const W = +st.baseMap.widthM || 30; ctx.drawImage(L.img, -W / 2, -W / 2, W, W); }
    else {
      const pw = +st.photoW || 30, ph = pw * (L.img.naturalHeight / (L.img.naturalWidth || 1));
      ctx.save(); ctx.translate(+st.photoX || 0, +st.photoZ || 0); ctx.rotate((+st.photoRot || 0) * P3_DEG);
      ctx.globalAlpha = 1; ctx.drawImage(L.img, -pw / 2, -ph / 2, pw, ph); ctx.restore();
    }
  });
  let data;
  try { data = ctx.getImageData(0, 0, N, N).data; } catch (e) { return { err: "ภาพนี้อ่านขอบไม่ได้ (ภาพจากเซิร์ฟเวอร์อื่น)" }; }
  // ความสว่าง + ยืดคอนทราสต์ด้วยเปอร์เซ็นไทล์ 2–98 ของบริเวณ (หลังคาเข้มจะได้ขอบชัดขึ้นมาก)
  const Y = new Float32Array(N * N), hist = new Uint32Array(256);
  for (let i = 0, k = 0; i < N * N; i++, k += 4) {
    const v = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
    Y[i] = v; if (data[k + 3] > 0) hist[v | 0]++;
  }
  let tot = 0; for (let i = 0; i < 256; i++) tot += hist[i];
  let acc = 0, lo = 0, hi = 255;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc < tot * 0.02) lo = i; if (acc < tot * 0.98) hi = i + 1; }
  const sc = 255 / Math.max(12, hi - lo);
  // เบลอเล็กน้อย (box 3×3) ลดลายลอนหลังคา/เม็ดภาพ
  const B = new Float32Array(N * N);
  for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
    const i = y * N + x;
    B[i] = (Y[i - N - 1] + Y[i - N] + Y[i - N + 1] + Y[i - 1] + Y[i] + Y[i + 1] + Y[i + N - 1] + Y[i + N] + Y[i + N + 1]) / 9;
  }
  for (let i = 0; i < N * N; i++) B[i] = Math.max(0, Math.min(255, (B[i] - lo) * sc));
  const gx = new Float32Array(N * N), gz = new Float32Array(N * N), mag = new Float32Array(N * N);
  const samp = [];
  for (let y = 2; y < N - 2; y++) for (let x = 2; x < N - 2; x++) {
    const i = y * N + x;
    const a = B[i - N - 1], b = B[i - N], c = B[i - N + 1], d = B[i - 1], f = B[i + 1], g = B[i + N - 1], h = B[i + N], k = B[i + N + 1];
    const X = (c + 2 * f + k) - (a + 2 * d + g), Z = (g + 2 * h + k) - (a + 2 * b + c);
    gx[i] = X; gz[i] = Z; const m = Math.hypot(X, Z); mag[i] = m;
    if ((i & 63) === 0) samp.push(m);
  }
  samp.sort((p, q) => p - q);
  const p90 = samp[Math.floor(samp.length * 0.9)] || 1;
  return { ox, oz, res, N, gx, gz, mag, p90, Wm, cx: center.x, cz: center.z };
}
/* ค่าความชันที่จุดโลก (x,z) — nearest pixel */
function p3sEF(F, x, z) {
  const px = Math.round((x - F.ox) / F.res), pz = Math.round((z - F.oz) / F.res);
  if (px < 2 || pz < 2 || px >= F.N - 2 || pz >= F.N - 2) return -1;
  return pz * F.N + px;
}
/* 1) แนวหลักของอาคารรอบจุด c รัศมี R (ม.) → องศา (−45, 45] หรือ null */
function p3sDetectAxis(F, c, R) {
  const bins = 180, H = new Float64Array(bins);
  const r = Math.round(R / F.res), cx = Math.round((c.x - F.ox) / F.res), cz = Math.round((c.z - F.oz) / F.res);
  const thr = F.p90 * 0.6;
  for (let y = Math.max(2, cz - r); y < Math.min(F.N - 2, cz + r); y++) for (let x = Math.max(2, cx - r); x < Math.min(F.N - 2, cx + r); x++) {
    const i = y * F.N + x, m = F.mag[i]; if (m < thr) continue;
    let a = Math.atan2(F.gz[i], F.gx[i]) / P3_DEG; a = ((a % 90) + 90) % 90;
    H[Math.floor(a / 90 * bins) % bins] += m * m;
  }
  let best = -1, bv = 0;
  for (let i = 0; i < bins; i++) {
    let v = 0; for (let k = -3; k <= 3; k++) v += H[(i + k + bins) % bins] * (4 - Math.abs(k));
    if (v > bv) { bv = v; best = i; }
  }
  if (best < 0 || !(bv > 0)) return null;
  // ปรับละเอียดด้วยจุดกึ่งกลางพาราโบลา
  const v = (i) => { let s = 0; for (let k = -3; k <= 3; k++) s += H[(i + k + 2 * bins) % bins] * (4 - Math.abs(k)); return s; };
  const y0 = v(best - 1), y1 = v(best), y2 = v(best + 1), den = y0 - 2 * y1 + y2;
  const off = Math.abs(den) > 1e-9 ? p3sClamp(0.5 * (y0 - y2) / den, -0.5, 0.5) : 0;
  let deg = (best + 0.5 + off) * 90 / bins;
  if (deg > 45) deg -= 90;
  return p3sR(deg, 10);
}
/* 2) ยิงหาขอบจากจุด s ตามทิศ (ux,uz) → ระยะ (ม.) ถึงขอบแรกที่ "แรงพอ" */
function p3sRay(F, s, ux, uz, maxL) {
  const step = F.res, n = Math.floor(maxL / step), prof = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const i = p3sEF(F, s.x + ux * k * step, s.z + uz * k * step);
    if (i < 0) { prof[k] = 0; continue; }
    prof[k] = Math.abs(F.gx[i] * ux + F.gz[i] * uz);   // ความชันตามแนวยิงเท่านั้น (ขอบที่ตั้งฉากกับแนวยิง)
  }
  const sm = new Float32Array(n);
  for (let k = 0; k < n; k++) { let a = 0, c = 0; for (let j = -2; j <= 2; j++) { if (k + j >= 0 && k + j < n) { a += prof[k + j]; c++; } } sm[k] = a / c; }
  let mx = 0; for (let k = 0; k < n; k++) mx = Math.max(mx, sm[k]);
  if (!(mx > F.p90 * 0.35)) return null;
  const k0 = Math.round(0.8 / step);
  for (let k = k0 + 1; k < n - 1; k++) {
    if (sm[k] >= mx * 0.42 && sm[k] >= sm[k - 1] && sm[k] >= sm[k + 1]) return k * step;
  }
  return null;
}
function p3sRayRect(F, seed, axisDeg) {
  const a = (axisDeg || 0) * P3_DEG, u = { x: Math.cos(a), z: Math.sin(a) }, v = { x: -Math.sin(a), z: Math.cos(a) };
  const L = Math.min(60, F.Wm / 2 - 2);
  const r = p3sRay(F, seed, u.x, u.z, L), l = p3sRay(F, seed, -u.x, -u.z, L);
  const d = p3sRay(F, seed, v.x, v.z, L), t = p3sRay(F, seed, -v.x, -v.z, L);
  if (r == null || l == null || d == null || t == null) return { err: "หาขอบไม่ครบ 4 ด้าน — ลองแตะใกล้กลางหลังคาขึ้น หรือวาดเอง" };
  const P = (su, sv) => ({ x: p3sR(seed.x + u.x * su + v.x * sv), z: p3sR(seed.z + u.z * su + v.z * sv) });
  const pts = [P(-l, -t), P(r, -t), P(r, d), P(-l, d)];
  return { pts, area: p3sR((r + l) * (d + t), 10) };
}
/* 3) จุดขอบภาพที่ใกล้ w ที่สุดในรัศมี R — ถ้ามี dir ให้ค้นตามเส้นนั้นเท่านั้น (เกาะทั้งแนวและขอบพร้อมกัน) */
function p3sEdgeSnap(F, w, R, dir) {
  if (!F || F.err) return null;
  const thr = F.p90 * 0.9;
  let best = null, bv = 0;
  if (dir) {
    const n = Math.ceil(R / F.res);
    for (let k = -n; k <= n; k++) {
      const x = w.x + dir.x * k * F.res, z = w.z + dir.z * k * F.res, i = p3sEF(F, x, z); if (i < 0) continue;
      const m = Math.abs(F.gx[i] * dir.x + F.gz[i] * dir.z) * (1 - 0.4 * Math.abs(k) / n);
      if (m > bv) { bv = m; best = { x, z }; }
    }
  } else {
    const r = Math.ceil(R / F.res), cx = Math.round((w.x - F.ox) / F.res), cz = Math.round((w.z - F.oz) / F.res);
    for (let y = cz - r; y <= cz + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (x < 2 || y < 2 || x >= F.N - 2 || y >= F.N - 2) continue;
      const dd = Math.hypot(x - cx, y - cz); if (dd > r) continue;
      const m = F.mag[y * F.N + x] * (1 - 0.4 * dd / r);
      if (m > bv) { bv = m; best = { x: F.ox + x * F.res, z: F.oz + y * F.res }; }
    }
  }
  return best && bv > thr ? { x: p3sR(best.x), z: p3sR(best.z) } : null;
}
/* ทิศที่ผืนหันไป (เข็มทิศ°) + ความชัน (°) จากมุม 3 มิติของผืน */
function p3sFaceAsp(pts3) {
  if (!pts3 || pts3.length < 3) return null;
  let n = p3Newell(pts3); if (n.y < 0) n = { x: -n.x, y: -n.y, z: -n.z };
  const pitch = Math.acos(p3sClamp(n.y, -1, 1)) / P3_DEG;
  if (pitch < 1.5) return { pitch: 0, az: null };
  return { pitch: p3sR(pitch, 10), az: ((Math.atan2(n.x, -n.z) / P3_DEG) + 360) % 360, dx: n.x, dz: n.z };
}
const p3sNormAxis = (deg) => { let d = ((+deg % 90) + 90) % 90; if (d > 45) d -= 90; return p3sR(d, 10); };

/* ── ไอคอนเพิ่มเติม (ที่เหลือยืม P3Icon) ── */
function P3SIcon({ name, size }) {
  const s = size || 18;
  const F = React.Fragment;
  const ic = {
    cursor: <F><path d="M3.4 2.2 12.6 7l-4 1.2 2.3 4.4-1.7.9-2.3-4.4-3 2.9z" /></F>,
    hand: <F><path d="M5.3 8.2V3.7a1 1 0 0 1 2 0v3.9M7.3 7.3V2.8a1 1 0 0 1 2 0v4.5M9.3 7.4V3.7a1 1 0 0 1 2 0v4.6M11.3 7a1 1 0 0 1 2 0v2.8a4.7 4.7 0 0 1-4.7 4.7h-.4a4.4 4.4 0 0 1-3.7-2L2.6 9.4a1 1 0 0 1 1.6-1.2l1.1 1.1" /></F>,
    polygon: <F><path d="M3 6 8 2.4l5 3.7-1.9 7H4.9z" /><circle cx="3" cy="6" r="1.1" fill="currentColor" /><circle cx="13" cy="6.1" r="1.1" fill="currentColor" /><circle cx="4.9" cy="13.1" r="1.1" fill="currentColor" /></F>,
    rect: <F><rect x="2.4" y="3.6" width="11.2" height="8.8" rx=".8" /><circle cx="2.4" cy="3.6" r="1.1" fill="currentColor" /><circle cx="13.6" cy="12.4" r="1.1" fill="currentColor" /></F>,
    panel: <F><path d="M3.2 4.2h9.6l1.4 8H1.8z" /><path d="M6.4 4.2 6 12.2M9.6 4.2l.4 8M2.5 8.2h11" /></F>,
    undo: <F><path d="M5.4 3.6 2.4 6.6l3 3" /><path d="M2.8 6.6h6.6a3.9 3.9 0 0 1 0 7.8H7.2" /></F>,
    redo: <F><path d="m10.6 3.6 3 3-3 3" /><path d="M13.2 6.6H6.6a3.9 3.9 0 0 0 0 7.8h2.2" /></F>,
    magic: <F><path d="m2.6 13.4 7.6-7.6M9.2 2.4l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5zM12.8 6.8l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z" /></F>,
    fit: <F><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></F>,
    minus: <F><path d="M3.3 8h9.4" /></F>,
    x: <F><path d="m4 4 8 8M12 4l-8 8" /></F>,
    copy: <F><rect x="5.2" y="5.2" width="8.4" height="8.4" rx="1.4" /><path d="M10.8 5.2V3.6a1.2 1.2 0 0 0-1.2-1.2H3.6a1.2 1.2 0 0 0-1.2 1.2v6a1.2 1.2 0 0 0 1.2 1.2h1.6" /></F>,
    back: <F><path d="M9.8 3.4 5.2 8l4.6 4.6" /></F>,
    swap: <F><path d="M2.6 5.4h10l-2.6-2.6M13.4 10.6h-10l2.6 2.6" /></F>,
    rotate: <F><path d="M13.2 7.6A5.2 5.2 0 1 1 11.4 4" /><path d="M11.8 1.6v2.8H9" /></F>,
    align: <F><path d="M2.5 13.5h11" /><rect x="3.4" y="5.6" width="3.6" height="6" rx=".6" /><rect x="9" y="2.6" width="3.6" height="9" rx=".6" /></F>,
    target: <F><circle cx="8" cy="8" r="5.6" /><circle cx="8" cy="8" r="2" /><path d="M8 .9v2M8 13.1v2M.9 8h2M13.1 8h2" /></F>,
    info: <F><circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.9v.1" /></F>,
    axis: <F><path d="M2 12.5 13.5 3" /><path d="M2 12.5h4.2M2 12.5V8.3" opacity=".55" /><circle cx="2" cy="12.5" r="1.2" fill="currentColor" /><circle cx="13.5" cy="3" r="1.2" fill="currentColor" /></F>,
    walk: <F><path d="M2.5 2.5h3.6v11H2.5zM9.9 2.5h3.6v11H9.9z" /><path d="M8 3v1.6M8 7.2v1.6M8 11.4V13" /></F>,
    edge: <F><path d="M2 13 7 4l3 5 4-6" /><circle cx="7" cy="4" r="1.3" fill="currentColor" /></F>,
    sun: <F><circle cx="8" cy="8" r="2.8" /><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M3.5 12.5l1.1-1.1M11.4 4.6l1.1-1.1" /></F>,
  };
  if (!ic[name]) return <P3Icon name={name} size={s} />;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flex: "0 0 auto" }}>{ic[name]}</svg>
  );
}

/* ── ช่องกรอกตัวเลข (นิยามนอกคอมโพเนนต์หลัก ไม่งั้น remount ทุกครั้งที่พิมพ์ — เคอร์เซอร์หลุด) ──
   หลุมกรอก + หน่วยในช่อง + ปุ่ม −/+ ขนาดนิ้วแตะได้ (iPad) · ลูกศรขึ้น/ลงบนคีย์บอร์ดก็ได้ */
function P3SNum({ label, value, unit, step, min, max, onChange, digits, auto, hint }) {
  const [txt, setTxt] = React.useState(null);
  const lo = min == null ? -1e9 : min, hi = max == null ? 1e9 : max;
  const d = digits == null ? 2 : digits;
  const isAuto = auto && !(+value > 0);
  const shown = txt != null ? txt : (isAuto ? "" : (value == null || isNaN(+value) ? "" : String(p3sR(+value, Math.pow(10, d)))));
  const put = (v) => onChange(p3sClamp(p3sR(v, Math.pow(10, d)), lo, hi));
  const st = step || 1;
  return (
    <label className="p3s-fld">
      {label && <span className="lb">{label}{hint && <i>{hint}</i>}</span>}
      <span className="p3s-well">
        <button type="button" className="sb" tabIndex={-1} onClick={(e) => { e.preventDefault(); put((+value || 0) - st); setTxt(null); }}>−</button>
        <input type="text" inputMode="decimal" value={shown} placeholder={isAuto ? auto : ""}
          onFocus={(e) => { setTxt(shown); const el = e.target; setTimeout(() => { try { el.select(); } catch (er) {} }, 0); }}
          onChange={(e) => { const t = e.target.value; setTxt(t); const v = parseFloat(t); if (!isNaN(v)) put(v); else if (t === "" && auto) onChange(0); }}
          onBlur={() => setTxt(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur();
            if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); put((+value || 0) + (e.key === "ArrowUp" ? st : -st)); setTxt(null); }
          }} />
        {unit && <span className="u">{unit}</span>}
        <button type="button" className="sb" tabIndex={-1} onClick={(e) => { e.preventDefault(); put((+value || 0) + st); setTxt(null); }}>+</button>
      </span>
    </label>
  );
}
function P3SText({ label, value, onChange }) {
  return (
    <label className="p3s-fld">
      {label && <span className="lb">{label}</span>}
      <span className="p3s-well"><input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} /></span>
    </label>
  );
}
function P3SSeg({ value, options, onChange, full }) {
  return (
    <div className={"p3s-seg" + (full ? " full" : "")}>
      {options.map(([v, lb, dis]) => (
        <button key={String(v)} type="button" data-on={value === v ? "1" : "0"} disabled={!!dis} onClick={() => onChange(v)}>{lb}</button>
      ))}
    </div>
  );
}
function P3SRange({ label, value, min, max, step, onChange, right }) {
  const pct = max > min ? p3sClamp(((+value || 0) - min) / (max - min) * 100, 0, 100) : 0;
  return (
    <label className="p3s-fld">
      <span className="lb" style={{ display: "flex" }}><span>{label}</span>{right != null && <b style={{ marginLeft: "auto", color: "var(--text-1)" }}>{right}</b>}</span>
      <input className="p3s-range" type="range" min={min} max={max} step={step} value={value} style={{ "--p": pct }}
        onChange={(e) => onChange(+e.target.value)} />
    </label>
  );
}

const P3S_CSS = `
.p3s{color:var(--text-1);-webkit-tap-highlight-color:transparent}
.p3s button{font-family:inherit}
.p3s-head{display:flex;align-items:center;gap:10px;padding:9px 14px;background:var(--surface);box-shadow:var(--shadow-sm);position:relative;z-index:4;min-height:56px;box-sizing:border-box}
.p3s-ttl{flex:1;min-width:0}
.p3s-ttl .k{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--text-3)}
.p3s-ttl .n{font-size:14.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p3s-btn{height:38px;padding:0 13px;border-radius:11px;border:0;background:var(--surface2);color:var(--text-1);font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap;flex:0 0 auto;transition:background .15s}
.p3s-btn:hover{background:var(--surface3)}
.p3s-btn:disabled{opacity:.4;cursor:default}
.p3s-btn.pri{background:var(--primary);color:#fff}
.p3s-btn.pri:hover{filter:brightness(1.06)}
.p3s-btn.pri:disabled{background:var(--surface2);color:var(--text-3);opacity:1}
.p3s-btn.ghost{background:transparent}
.p3s-btn.ghost:hover{background:var(--surface2)}
.p3s-btn.dngr{color:var(--tint-red-tx,#b91c1c)}
.p3s-btn.ico{width:38px;padding:0}
.p3s-btn.wide{width:100%}
.p3s-btn.big{height:46px;font-size:14px;border-radius:13px}
.p3s-kpi{display:flex;align-items:baseline;gap:4px}
.p3s-kpi b{font-size:19px;font-weight:800;letter-spacing:-.3px;font-variant-numeric:tabular-nums}
.p3s-kpi span{font-size:11px;font-weight:700;color:var(--text-3)}
.p3s-seg{display:inline-flex;background:var(--surface2);border-radius:11px;padding:3px;gap:2px;box-shadow:var(--shadow-inset);flex:0 0 auto}
.p3s-seg.full{display:flex}
.p3s-seg.full button{flex:1}
.p3s-seg button{height:32px;padding:0 12px;border:0;border-radius:9px;background:transparent;font-size:12.5px;font-weight:700;color:var(--text-2);cursor:pointer;white-space:nowrap}
.p3s-seg button[data-on="1"]{background:var(--surface);color:var(--text-1);box-shadow:var(--shadow-sm)}
.p3s-seg button:disabled{opacity:.35;cursor:default}
.p3s-body{flex:1;min-height:0;display:flex}
.p3s-tools{width:78px;flex:0 0 78px;background:var(--surface);box-shadow:var(--shadow-sm);display:flex;flex-direction:column;gap:3px;padding:8px 6px;overflow-y:auto;position:relative;z-index:3;box-sizing:border-box}
.p3s-tool{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 2px 7px;border:0;border-radius:13px;background:transparent;color:var(--text-2);font-size:10.5px;font-weight:700;cursor:pointer;min-height:58px;line-height:1.15;text-align:center}
.p3s-tool:hover{background:var(--surface2);color:var(--text-1)}
.p3s-tool[data-on="1"]{background:var(--primary-soft);color:var(--primary-dark)}
.p3s-tool kbd{position:absolute;top:4px;right:6px;font:700 9px/1 inherit;color:var(--text-3);opacity:.8}
.p3s-tool[data-on="1"] kbd{color:var(--primary-dark)}
.p3s-tsep{height:1px;background:var(--surface3);margin:4px 8px}
.p3s-stage{flex:1;min-width:0;position:relative;overflow:hidden;background:#dfe5dc;touch-action:none;user-select:none;-webkit-user-select:none}
.p3s-stage>svg{position:absolute;inset:0;display:block}
.p3s-side{width:340px;flex:0 0 340px;background:var(--bg);overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;position:relative;z-index:3;box-sizing:border-box;box-shadow:var(--shadow-sm)}
.p3s-card{background:var(--surface);border-radius:15px;box-shadow:var(--shadow-card);padding:13px;display:flex;flex-direction:column;gap:10px}
.p3s-h{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.06em;color:var(--text-3)}
.p3s-h .t{flex:1}
.p3s-ttl2{font-size:15px;font-weight:800;color:var(--text-1);display:flex;align-items:center;gap:8px}
.p3s-g2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.p3s-fld{display:flex;flex-direction:column;gap:5px;min-width:0}
.p3s-fld .lb{font-size:11px;font-weight:700;color:var(--text-3);display:flex;gap:6px;align-items:baseline}
.p3s-fld .lb i{font-style:normal;font-weight:600;color:var(--text-3);opacity:.8;font-size:10.5px;margin-left:auto}
.p3s-well{display:flex;align-items:center;height:42px;border-radius:11px;background:var(--surface2);box-shadow:var(--shadow-inset);padding:0 4px;gap:2px;box-sizing:border-box}
.p3s-well:focus-within{box-shadow:var(--shadow-inset),0 0 0 2px var(--primary-soft)}
.p3s-well input,.p3s-well select{flex:1;min-width:0;width:100%;border:0!important;background:transparent!important;box-shadow:none!important;outline:none!important;font:inherit;font-size:14px;font-weight:700;color:var(--text-1);padding:0 6px!important;height:100%;text-align:center;border-radius:0!important}
.p3s-well input[type=text]:not([inputmode]){text-align:left}
.p3s-well select{text-align:left}
.p3s-well .u{font-size:11.5px;color:var(--text-3);font-weight:700;padding-right:2px}
.p3s-well .sb{width:30px;height:30px;flex:0 0 30px;border:0;border-radius:8px;background:transparent;color:var(--text-2);font-size:17px;font-weight:600;cursor:pointer;display:grid;place-items:center;line-height:1}
.p3s-well .sb:hover{background:var(--surface);color:var(--text-1)}
.p3s-note{font-size:11.5px;color:var(--text-3);line-height:1.5}
.p3s-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.p3s-stat>div{background:var(--surface2);border-radius:11px;padding:8px 10px}
.p3s-stat .l{font-size:10px;font-weight:700;color:var(--text-3)}
.p3s-stat .v{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}
.p3s-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.p3s-list{display:flex;flex-direction:column;gap:4px}
.p3s-li{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;background:transparent;border:0;cursor:pointer;text-align:left;font-size:13px;font-weight:700;color:var(--text-1);width:100%}
.p3s-li:hover{background:var(--surface2)}
.p3s-li[data-on="1"]{background:var(--primary-soft);color:var(--primary-dark)}
.p3s-li small{margin-left:auto;font-size:11.5px;color:var(--text-3);font-weight:700}
.p3s-step{display:flex;gap:11px;align-items:flex-start}
.p3s-step .no{width:26px;height:26px;border-radius:50%;flex:0 0 26px;display:grid;place-items:center;font-size:12px;font-weight:800;background:var(--surface2);color:var(--text-2)}
.p3s-step[data-done="1"] .no{background:var(--primary);color:#fff}
.p3s-step .bd{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.p3s-step .tt{font-size:13.5px;font-weight:800}
.p3s-step .ds{font-size:11.5px;color:var(--text-3);line-height:1.45}
.p3s-wiz .dots{display:flex;gap:4px}
.p3s-wiz .dot{flex:1;min-width:0;height:26px;border:0;border-radius:8px;background:var(--surface2);box-shadow:var(--shadow-inset);color:var(--text-3);font-size:11.5px;font-weight:800;cursor:pointer;display:grid;place-items:center;padding:0}
.p3s-wiz .dot[data-done="1"]{background:var(--primary-soft,rgba(16,185,129,.16));color:var(--primary);box-shadow:none}
.p3s-wiz .dot[data-on="1"]{background:var(--primary);color:#fff;box-shadow:none}
.p3s-wiz .wt{font-size:14.5px;font-weight:800;line-height:1.35}
.p3s-wiz .wd{font-size:12px;color:var(--text-2);line-height:1.5}
.p3s-wiz .wd b{color:var(--text)}
.p3s-wiz .chips{display:flex;flex-wrap:wrap;gap:5px}
.p3s-wiz .chips .p3s-btn{height:28px;font-size:11.5px;padding:0 9px}
.p3s-tool[data-dim="1"]{opacity:.28;cursor:not-allowed}
.p3s-wiznav{position:sticky;bottom:-14px;margin:auto -14px -14px;padding:10px 14px 14px;background:var(--bg);box-shadow:0 -6px 14px rgba(0,0,0,.06);display:flex;flex-direction:column;gap:6px;z-index:4}
.p3s-wiznav .p3s-row{gap:8px}
.p3s-tool[data-hint="1"]{box-shadow:0 0 0 2px var(--primary) inset}
.p3s-float{position:absolute;background:var(--surface);border-radius:14px;box-shadow:var(--shadow-card);display:flex;align-items:center;gap:6px;padding:5px;z-index:2}
.p3s-ctx{top:12px;left:50%;transform:translateX(-50%);max-width:calc(100% - 24px);flex-wrap:wrap;justify-content:center}
.p3s-ctx .lbl{font-size:11px;font-weight:800;color:var(--text-3);padding:0 4px 0 8px}
.p3s-zoom{right:12px;bottom:12px;flex-direction:column}
.p3s-hint{position:absolute;left:12px;bottom:12px;z-index:2;max-width:calc(100% - 90px);background:rgba(15,23,42,.82);color:#fff;font-size:12.5px;font-weight:600;border-radius:11px;padding:8px 12px;line-height:1.45;pointer-events:none;backdrop-filter:blur(6px)}
.p3s-hint b{color:#86efac;font-weight:800}
.p3s-hint kbd{font:700 11px inherit;background:rgba(255,255,255,.16);border-radius:5px;padding:1px 5px;margin:0 1px}
.p3s-scale{position:absolute;right:66px;bottom:16px;z-index:2;font-size:11px;font-weight:800;color:#0f172a;text-shadow:0 0 3px #fff,0 0 3px #fff;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.p3s-scale i{display:block;height:6px;border:2px solid #0f172a;border-top:0;box-shadow:0 1px 0 #fff}
.p3s-north{position:absolute;top:12px;right:12px;z-index:2;width:42px;height:42px;border-radius:50%;background:var(--surface);box-shadow:var(--shadow-card);display:grid;place-items:center;pointer-events:none}
.p3s-empty{position:absolute;inset:0;display:grid;place-items:center;z-index:2;padding:20px;pointer-events:none}
.p3s-empty .box{pointer-events:auto;background:var(--surface);border-radius:20px;box-shadow:var(--shadow-card);padding:22px;max-width:440px;width:100%;display:flex;flex-direction:column;gap:12px;box-sizing:border-box}
.p3s-empty h3{margin:0;font-size:17px;font-weight:800}
.p3s-empty p{margin:0;font-size:13px;color:var(--text-2);line-height:1.55}
.p3s-pop{position:absolute;z-index:3;left:50%;top:64px;transform:translateX(-50%);width:min(360px,calc(100% - 24px));background:var(--surface);border-radius:15px;box-shadow:var(--shadow-card);padding:13px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box}
.p3s-range{width:100%;accent-color:var(--primary);height:26px;margin:0;box-shadow:none!important;background:transparent!important}
.p3s-mbar{display:none}
.p3s-sheetbar{display:none}
.p3s-hh{cursor:inherit}
.p3s-hh:hover{stroke-width:3}
.p3s-badge{display:inline-flex;align-items:center;height:22px;padding:0 8px;border-radius:99px;font-size:11px;font-weight:800;background:var(--surface2);color:var(--text-2)}
.p3s-badge.ok{background:var(--primary-soft);color:var(--primary-dark)}
.p3s-badge.warn{background:var(--tint-amber-bg,#fef3c7);color:var(--tint-amber-tx,#92400e)}
@media (max-width:860px){
  .p3s-head{padding:7px 10px;gap:7px;min-height:52px}
  .p3s-ttl .k{display:none}
  .p3s-ttl .n{font-size:13.5px}
  .p3s-body{flex-direction:column}
  .p3s-tools{display:none}
  .p3s-side{width:auto;flex:0 0 auto;max-height:42vh;padding:10px 12px 12px;box-shadow:0 -6px 18px rgba(0,0,0,.08)}
  .p3s-side[data-min="1"]{max-height:none;padding-bottom:0}
  .p3s-wiznav{bottom:-12px;margin:auto -12px -12px;padding:8px 12px 12px}
  .p3s-side[data-min="1"]>*:not(.p3s-sheetbar){display:none}
  .p3s-sheetbar{display:flex;align-items:center;gap:8px;border:0;background:transparent;width:100%;padding:0 2px 4px;font-size:12.5px;font-weight:800;color:var(--text-2);cursor:pointer}
  .p3s-sheetbar .gr{width:36px;height:4px;border-radius:9px;background:var(--surface3);margin:0 auto}
  .p3s-mbar{display:flex;gap:2px;padding:5px 6px calc(5px + env(safe-area-inset-bottom));background:var(--surface);box-shadow:0 -1px 0 var(--surface3);overflow-x:auto;position:relative;z-index:4}
  .p3s-mbar .p3s-tool{flex:1 0 58px;min-height:52px;font-size:10px}
  .p3s-mbar .p3s-tool kbd{display:none}
  .p3s-hint{bottom:34px;left:8px;right:62px;max-width:none;font-size:12px}
  .p3s-scale{right:62px}
  .p3s-ctx{top:8px}
}
`;

/* ============================================================
   มุมมอง 3 มิติ (ดูผล + เงา) — ไม่มีอะไรให้ลากพลาด หมุนกล้องได้อิสระ
   ============================================================ */
function p3sBuild3D(THREE, grp, st, tex) {
  const add = (o) => { grp.add(o); return o; };
  const bH = +st.buildH || 0;
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, maxY = 0;
  const eat = (x, y, z) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); maxY = Math.max(maxY, y); };
  const G = Math.max(40, +st.groundW || 40);
  const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(G * 3, G * 3), new THREE.MeshLambertMaterial({ color: 0xb9c4a5 })));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true;
  if (st.baseMap && st.baseMap.url) {
    const W = Math.max(2, +st.baseMap.widthM || 30);
    const m = add(new THREE.Mesh(new THREE.PlaneGeometry(W, W), new THREE.MeshBasicMaterial({ map: tex(st.baseMap.url) })));
    m.rotation.x = -Math.PI / 2; m.position.y = -0.02;
  }
  if (st.photo) {
    const pw = +st.photoW || 30;
    const t = tex(st.photo, (tx) => {
      const im = tx.image; if (!im) return;
      pm.geometry.dispose(); pm.geometry = new THREE.PlaneGeometry(pw, pw * (im.height / im.width));
    });
    const b = p3sClamp(st.photoBright == null ? 0.7 : +st.photoBright, 0.25, 1);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw), new THREE.MeshBasicMaterial({ map: t, transparent: true,
      opacity: p3sClamp(+st.photoOpacity || 0.95, 0.15, 1), color: new THREE.Color(b + 0.2, b + 0.2, b + 0.2) }));
    if (t.image && t.image.width) pm.geometry = new THREE.PlaneGeometry(pw, pw * (t.image.height / t.image.width));
    pm.rotation.x = -Math.PI / 2;
    const pg = add(new THREE.Group());
    pg.position.set(+st.photoX || 0, -0.01, +st.photoZ || 0);
    pg.rotation.y = -((+st.photoRot || 0) * P3_DEG);
    pg.add(pm);
  }
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8, side: THREE.DoubleSide });
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.55 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x475569 });
  const polyMesh = (pts3) => {
    const contour = pts3.map((p) => new THREE.Vector2(p.x, p.z));
    let tris = [];
    try { tris = THREE.ShapeUtils.triangulateShape(contour, []); } catch (e) { tris = []; }
    if (!tris.length) for (let i = 1; i < pts3.length - 1; i++) tris.push([0, i, i + 1]);
    const pos = [];
    tris.forEach((t) => t.forEach((i) => pos.push(pts3[i].x, pts3[i].y, pts3[i].z)));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, roofMat); m.castShadow = true; m.receiveShadow = true;
    add(m);
    const lp = pts3.concat([pts3[0]]).map((p) => new THREE.Vector3(p.x, p.y + 0.02, p.z));
    add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp), edgeMat));
    return tris.map((t) => t.map((i) => pts3[i]));
  };
  /* ความสูงผิวหลังคาจริง (ตามสามเหลี่ยมที่วาด) ที่ตำแหน่ง x z — null = อยู่นอกผืน */
  const surfY = (tris, x, z) => {
    for (let i = 0; i < tris.length; i++) {
      const [A, B, C] = tris[i];
      const d = (B.z - C.z) * (A.x - C.x) + (C.x - B.x) * (A.z - C.z); if (Math.abs(d) < 1e-9) continue;
      const a = ((B.z - C.z) * (x - C.x) + (C.x - B.x) * (z - C.z)) / d, b = ((C.z - A.z) * (x - C.x) + (A.x - C.x) * (z - C.z)) / d, c = 1 - a - b;
      if (a > -1e-3 && b > -1e-3 && c > -1e-3) return a * A.y + b * B.y + c * C.y;
    }
    return null;
  };
  const wall = (foot, h) => {
    if (!(h > 0.2) || foot.length < 3) return;
    const sh = new THREE.Shape();
    foot.forEach((p, i) => (i ? sh.lineTo(p.x, -p.z) : sh.moveTo(p.x, -p.z)));
    const m = add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }), wallMat));
    m.rotation.x = -Math.PI / 2; m.castShadow = true; m.receiveShadow = true;
  };
  (st.roofs || []).forEach((roof) => {
    let faces = [];
    if (roof.kind === "poly") {
      if (!Array.isArray(roof.pts) || roof.pts.length < 3) return;
      const ph = p3PhOf(roof);
      faces = [roof.pts.map((p, i) => ({ x: (+roof.x || 0) + (+p.x || 0), y: bH + ph[i], z: (+roof.z || 0) + (+p.z || 0) }))];
    } else if (roof.kind === "dome") {
      const D = p3DomeGeo(roof), a = -(((+roof.az || 180) - 180) * P3_DEG), h0 = +roof.h || 3, segs = 24;
      const W = (x, y, z) => { const q = p3sRY(x, z, a); return new THREE.Vector3(q.x + (+roof.x || 0), y + h0, q.z + (+roof.z || 0)); };
      const pos = [];
      for (let i = 0; i < segs; i++) {
        const t1 = -D.th + 2 * D.th * i / segs, t2 = -D.th + 2 * D.th * (i + 1) / segs;
        const A = W(-D.len / 2, D.yAt(t1), D.zAt(t1)), B = W(D.len / 2, D.yAt(t1), D.zAt(t1));
        const C = W(D.len / 2, D.yAt(t2), D.zAt(t2)), E = W(-D.len / 2, D.yAt(t2), D.zAt(t2));
        [A, B, C, A, C, E].forEach((v) => pos.push(v.x, v.y, v.z));
        eat(A.x, A.y, A.z); eat(C.x, C.y, C.z);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      const m = add(new THREE.Mesh(g, roofMat)); m.castShadow = true; m.receiveShadow = true;
      wall(p3sFaces2D(roof)[0] ? p3sFaces2D(roof)[0].pts : [], h0);
    } else {
      const all = Object.assign({}, roof, { sideA: true, sideB: true, sideC: true, sideD: true });
      try { faces = p3RoofSurf(all).map((s) => s.pts); } catch (e) { faces = []; }
    }
    let tris = [];
    faces.forEach((f) => { tris = tris.concat(polyMesh(f) || []); f.forEach((p) => eat(p.x, p.y, p.z)); });
    if (faces.length) {
      const minY = Math.min.apply(null, faces.map((f) => Math.min.apply(null, f.map((p) => p.y))));
      wall(p3sOutline(roof), minY - 0.03);
    }
    // แผง — รวมเป็นก้อนเดียวต่อผืน (ร้อยแผ่นก็วาดเร็ว)
    let foot = [];
    try { foot = p3Foot(roof); } catch (e) { foot = []; }
    if (!foot.length) return;
    const pos = [], ln = [];
    const yFix = roof.kind === "poly" ? bH - (+roof.h || 0) : 0;
    foot.forEach((f) => {
      const c = { x: f.cx, y: f.cy + yFix, z: f.cz }, U = f.u, V = f.v, n = f.n;
      const o = 0.07;
      let lift = 0;
      const P = (su, sv) => new THREE.Vector3(c.x + su * U.x + sv * V.x + n.x * o, c.y + su * U.y + sv * V.y + n.y * o + lift, c.z + su * U.z + sv * V.z + n.z * o);
      // ผืนที่ต่อกับผืนอื่นอาจบิดเล็กน้อย (มุมร่วมถูกเฉลี่ย) — ยกแผงให้ทุกมุมพ้นผิวจริง ไม่จมหายในหลังคา
      if (roof.kind === "poly" && tris.length) {
        [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]].forEach(([su, sv]) => {
          const q = P(su, sv), y = surfY(tris, q.x, q.z);
          if (y != null && y + 0.05 > q.y) lift += y + 0.05 - q.y;
        });
      }
      const a = P(-1, -1), b = P(1, -1), d = P(1, 1), e = P(-1, 1);
      [a, b, d, a, d, e].forEach((v) => pos.push(v.x, v.y, v.z));
      [a, b, b, d, d, e, e, a].forEach((v) => ln.push(v.x, v.y + 0.004, v.z));
      eat(d.x, d.y, d.z);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    const pm = add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x15306a, roughness: 0.35, metalness: 0.5, side: THREE.DoubleSide })));
    pm.castShadow = true; pm.receiveShadow = true;
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(ln, 3));
    add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xc7d2fe, transparent: true, opacity: 0.55 })));
  });
  (st.obstacles || []).forEach((o) => {
    const g = add(new THREE.Group()); g.position.set(+o.x || 0, 0, +o.z || 0); g.rotation.y = -((+o.rot || 0) * P3_DEG);
    const h = Math.max(0.2, +o.h || 2);
    if (o.kind === "tree") {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, h * 0.45, 8), new THREE.MeshLambertMaterial({ color: 0x7c5a3a }));
      tr.position.y = h * 0.225; tr.castShadow = true; g.add(tr);
      const R = Math.max(+o.w || 1, 1) / 2;
      const cr = new THREE.Mesh(new THREE.SphereGeometry(R, 14, 10), new THREE.MeshLambertMaterial({ color: 0x3f7d44 }));
      cr.position.y = h * 0.45 + R * 0.8; cr.castShadow = true; cr.receiveShadow = true; g.add(cr);
    } else {
      const bx = new THREE.Mesh(new THREE.BoxGeometry(+o.w || 1, h, +o.d || 1), new THREE.MeshLambertMaterial({ color: 0x9aa8b5 }));
      bx.position.y = h / 2; bx.castShadow = true; bx.receiveShadow = true; g.add(bx);
    }
    eat(+o.x || 0, h, +o.z || 0);
  });
  if (minX > maxX) { minX = -10; maxX = 10; minZ = -10; maxZ = 10; }
  return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, R: Math.max(8, Math.hypot(maxX - minX, maxZ - minZ) / 2), maxY };
}

function P3SView3D({ st, sun }) {
  const mountRef = React.useRef(null);
  const T = React.useRef({});
  const [ready, setReady] = React.useState(false);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => { p3LoadThree().then(() => setReady(true)).catch((e) => setErr(e.message)); }, []);
  React.useEffect(() => {
    if (!ready || !mountRef.current) return;
    const THREE = window.THREE, el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block"; renderer.domElement.style.touchAction = "none";
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdce8f2);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.12; controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.screenSpacePanning = true;
    const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.75); scene.add(hemi);
    const sunL = new THREE.DirectionalLight(0xffffff, 1.3); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0004;
    scene.add(sunL); scene.add(sunL.target);
    const dyn = new THREE.Group(); scene.add(dyn);
    const texCache = {};
    Object.assign(T.current, { THREE, renderer, scene, camera, controls, sunL, hemi, dyn, texCache, fitted: false });
    const onResize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(el);
    let run = true;
    const loop = () => { if (!run) return; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    return () => {
      run = false; ro.disconnect(); controls.dispose();
      dyn.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      Object.keys(texCache).forEach((k) => texCache[k].dispose());
      renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [ready]);
  // สร้างฉากใหม่แบบหน่วงนิดหน่อย — ระหว่างพิมพ์ตัวเลขรัว ๆ จะได้ไม่สร้างซ้ำทุกตัวอักษร
  React.useEffect(() => {
    const t = T.current; if (!ready || !t.dyn) return;
    const id = setTimeout(() => {
      const THREE = t.THREE;
      while (t.dyn.children.length) {
        const c = t.dyn.children[0]; t.dyn.remove(c);
        c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); });
      }
      const tex = (url, onReady) => {
        if (t.texCache[url]) { const tx = t.texCache[url]; if (onReady && tx.image) Promise.resolve().then(() => onReady(tx)); return tx; }
        const tx = new THREE.TextureLoader().load(url, () => onReady && onReady(tx)); tx.anisotropy = 4; t.texCache[url] = tx; return tx;
      };
      const b = p3sBuild3D(THREE, t.dyn, st, tex);
      t.bounds = b;
      if (!t.fitted) {
        t.fitted = true;
        t.controls.target.set(b.cx, 1.5, b.cz);
        t.camera.position.set(b.cx + b.R * 1.15, Math.max(10, b.R * 1.05), b.cz + b.R * 1.45);
        t.controls.update();
      }
      t.applySun && t.applySun();
    }, 80);
    return () => clearTimeout(id);
  }, [ready, st]);
  React.useEffect(() => {
    const t = T.current; if (!ready || !t.sunL) return;
    t.applySun = () => {
      const sp = p3SunPos(sun), a = sp.alt * P3_DEG, z = sp.az * P3_DEG;
      const b = t.bounds || { cx: 0, cz: 0, R: 20 };
      const D = b.R * 3;
      t.sunL.position.set(b.cx + Math.sin(z) * Math.cos(a) * D, Math.max(0.05, Math.sin(a)) * D, b.cz - Math.cos(z) * Math.cos(a) * D);
      t.sunL.target.position.set(b.cx, 0, b.cz);
      const S = b.R * 1.6, sc = t.sunL.shadow.camera;
      sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 0.5; sc.far = D * 2.5; sc.updateProjectionMatrix();
      const day = sp.alt > 0;
      t.sunL.intensity = day ? 0.55 + 0.85 * Math.min(1, Math.sin(a) * 1.6) : 0;
      t.hemi.intensity = day ? 0.7 : 0.35;
    };
    t.applySun();
  }, [ready, sun && sun.month, sun && sun.day, sun && sun.hour, sun && sun.lat, sun && sun.lng]);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      {!ready && !err && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--text-2)", fontSize: 13.5, fontWeight: 600 }}>กำลังโหลดมุมมอง 3 มิติ…</div>}
      {err && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--tint-red-tx)", fontSize: 13, padding: 30, textAlign: "center" }}>{err}<br />ต้องต่ออินเทอร์เน็ตครั้งแรกเพื่อโหลดตัวเรนเดอร์ 3 มิติ</div>}
    </div>
  );
}

const p3sUseMedia = (q) => {
  const get = () => { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  const [m, setM] = React.useState(get);
  React.useEffect(() => {
    let mq; try { mq = window.matchMedia(q); } catch (e) { return; }
    const on = () => setM(mq.matches);
    if (mq.addEventListener) mq.addEventListener("change", on); else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else mq.removeListener(on); };
  }, [q]);
  return m;
};

const P3S_TOOLS = [
  { k: "select", ic: "cursor", lb: "เลือก ย้าย", key: "V" },
  { k: "pan", ic: "hand", lb: "เลื่อนภาพ", key: "H" },
  { k: "area", ic: "fit", lb: "พื้นที่ติดตั้ง", key: "G" },
  { k: "axis", ic: "axis", lb: "ตั้งแนว", key: "A" },
  { k: "roof", ic: "polygon", lb: "วาดหลังคา", key: "R" },
  { k: "panel", ic: "panel", lb: "วางแผง", key: "P" },
  { k: "walk", ic: "walk", lb: "ทางเดิน", key: "W" },
  { k: "obs", ic: "tree", lb: "สิ่งบดบัง", key: "O" },
  { k: "meas", ic: "ruler", lb: "วัดระยะ", key: "M" },
  { k: "bg", ic: "image", lb: "ภาพพื้น", key: "B" },
];

/* ============================================================
   Plan3DStudio — ตัวแก้หลัก
   ============================================================ */
function Plan3DStudio({ job, onClose, currentUser, onSwitch }) {
  const isMobile = p3sUseMedia("(max-width: 860px)");
  const coarse = p3sUseMedia("(pointer: coarse)");
  const { saved, loading, save } = usePlan3d(job ? job.id : null);

  const [st, setStRaw] = React.useState(null);
  const stRef = React.useRef(null); stRef.current = st;
  const [dirty, setDirty] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const hist = React.useRef({ u: [], r: [], key: null, at: 0 });
  const [, setHistTick] = React.useState(0);

  const [tool, setToolRaw] = React.useState("select");
  const [view3d, setView3d] = React.useState(false);
  const [sel, setSel] = React.useState(null);           // { t: "roof"|"obs"|"meas", id }
  const [selVert, setSelVert] = React.useState(null);   // index มุมที่เลือกของหลังคาทรงอิสระ
  const [selBlk, setSelBlk] = React.useState(null);     // ชุดแผงที่เลือก (เครื่องมือแผง)
  const [hover, setHover] = React.useState(null);
  const [draw, setDraw] = React.useState(null);         // { pts:[{x,z}], typed:"" } — กำลังวาดหลังคา
  const [cur, setCur] = React.useState(null);           // ตำแหน่งเมาส์ (หลังดูดติด) { x, z, snap, guide }
  const [roofOpt, setRoofOptRaw] = React.useState(() => {
    let k = "gable"; try { k = localStorage.getItem("p3s_kind") || "gable"; } catch (e) {}
    return { shape: k === "flat" || k === "shed" ? "rect" : k === "facet" ? "poly" : "rect", kind: k };
  });
  const rectDraw = roofOpt.kind !== "facet" && (roofOpt.shape === "rect" || roofOpt.kind === "gable" || roofOpt.kind === "hip");
  const setRoofOpt = (o) => { setRoofOptRaw(o); try { localStorage.setItem("p3s_kind", o.kind); } catch (e) {} };
  const [alignView, setAlignView] = React.useState(true);   // หมุนผังให้แนวหลังคาตรงจอ
  const [axisPts, setAxisPts] = React.useState(null);      // กำลังลากเส้นแนว
  const [axisMsg, setAxisMsg] = React.useState(null);
  const [edgeOn, setEdgeOn] = React.useState(true);         // ดูดขอบภาพระหว่างวาด
  const edgeRef = React.useRef(null);                       // ฟิลด์ขอบภาพ (คำนวณตามบริเวณที่ทำงาน)
  const edgeBusy = React.useRef(false);
  const [, setEdgeTick] = React.useState(0);
  const [imgFx, setImgFx] = React.useState({ b: 1, c: 1 }); // ปรับแสงภาพ (ดูอย่างเดียว ไม่บันทึก)
  const [walkW, setWalkW] = React.useState(0.6);
  const [walkPts, setWalkPts] = React.useState(null);     // กำลังวาดทางเดิน (พิกัดโลก)
  const [selWalk, setSelWalk] = React.useState(null);     // { roofId, id }
  const [eavePick, setEavePick] = React.useState(false);  // แตะขอบเพื่อตั้งเป็นชายคา
  const [measPts, setMeasPts] = React.useState(null);   // กำลังวัดระยะ
  const [calib, setCalib] = React.useState(null);       // ตั้งมาตราส่วนรูปโดรน { pts:[], len:"" }
  const [trace, setTrace] = React.useState(null);       // ตัวช่วยวาดจากภาพ { on, busy, seed, pts, err }
  const [traceTol, setTraceTol] = React.useState(30);
  const [marq, setMarq] = React.useState(null);         // กรอบลากคลุม (จอ)
  const [mapOpen, setMapOpen] = React.useState(false);
  const [sheetMin, setSheetMin] = React.useState(false);
  /* โหมดพาทำทีละขั้น — เปิด/ปิดจำไว้ในเครื่อง · ขั้นที่ผ่านแล้ว (ขั้นที่ข้ามได้) จำแยกตามงาน */
  const [wiz, setWizRaw] = React.useState(() => { try { return localStorage.getItem("p3s_wiz") !== "0"; } catch (e) { return true; } });
  const setWiz = (v) => { setWizRaw(v); try { localStorage.setItem("p3s_wiz", v ? "1" : "0"); } catch (e) {} };
  const wizKey = "p3s_wiz2_" + (job ? job.id : "");
  const [wizSeen, setWizSeenRaw] = React.useState(() => { try { return JSON.parse(localStorage.getItem(wizKey) || "{}") || {}; } catch (e) { return {}; } });
  const markSeen = (i) => setWizSeenRaw((o) => { if (o[i]) return o; const n = Object.assign({}, o, { [i]: 1 }); try { localStorage.setItem(wizKey, JSON.stringify(n)); } catch (e) {} return n; });
  const [wizStep, setWizStep] = React.useState(null);  // null = ขั้นแรกที่ยังไม่เสร็จ
  const shapeRef = React.useRef({ roofs: null, gap: 0 });
  const wizAllowRef = React.useRef(null);   // เครื่องมือที่ขั้นปัจจุบันให้ใช้ (null = ไม่ล็อก)
  const toolOk = (k) => { const a = wizAllowRef.current; return !a || a.includes(k); };
  const [photoAR, setPhotoAR] = React.useState(1);
  const [sunHour, setSunHour] = React.useState(null);   // ชั่วโมงที่กำลังกวาดดูเงา (ไม่บันทึก)
  const [lockRoofs, setLockRoofs] = React.useState(false);

  const [view, setViewRaw] = React.useState({ cx: 0, cz: 0, s: 14 });
  const viewRef = React.useRef(view); viewRef.current = view;
  const [size, setSize] = React.useState({ w: 900, h: 600 });
  const sizeRef = React.useRef(size); sizeRef.current = size;
  const setView = (v) => { viewRef.current = v; setViewRaw(v); };

  /* โหลดครั้งเดียว — ระหว่างเปิดอยู่ไม่ดึงทับ (แบบเก่าก็ทำแบบนี้) */
  React.useEffect(() => {
    if (loading || stRef.current) return;
    const m = p3sLoad(saved, job);
    stRef.current = m; setStRaw(m);
  }, [loading, saved]); // eslint-disable-line

  /* ── ประวัติ (ย้อนกลับ/ทำซ้ำ) ── */
  const pushHist = (snap, key) => {
    const H = hist.current, now = Date.now();
    if (key && H.key === key && now - H.at < 1200) { H.at = now; return; }   // พิมพ์ช่องเดียวรัว ๆ = ขั้นเดียว
    H.u.push(snap); if (H.u.length > 120) H.u.shift(); H.r = []; H.key = key || null; H.at = now;
    setHistTick((n) => n + 1);
  };
  const commit = (fn, key) => {
    const cur0 = stRef.current; if (!cur0) return;
    const next = typeof fn === "function" ? fn(cur0) : Object.assign({}, cur0, fn);
    if (!next || next === cur0) return;
    pushHist(cur0, key);
    stRef.current = next; setStRaw(next); setDirty(true);
  };
  const live = (next) => { stRef.current = next; setStRaw(next); setDirty(true); };
  const fixSel = (s) => {
    setSel((x) => {
      if (!x) return x;
      const arr = x.t === "roof" ? s.roofs : x.t === "obs" ? s.obstacles : s.measures;
      return (arr || []).some((o) => o.id === x.id) ? x : null;
    });
    setSelVert(null);
  };
  const undo = () => {
    const H = hist.current; if (!H.u.length) return;
    H.r.push(stRef.current); const prev = H.u.pop(); H.key = null;
    stRef.current = prev; setStRaw(prev); setDirty(true); fixSel(prev); setHistTick((n) => n + 1);
  };
  const redo = () => {
    const H = hist.current; if (!H.r.length) return;
    H.u.push(stRef.current); const nx = H.r.pop(); H.key = null;
    stRef.current = nx; setStRaw(nx); setDirty(true); fixSel(nx); setHistTick((n) => n + 1);
  };

  const patchRoof = (id, patch, key) => commit((s) => Object.assign({}, s, {
    roofs: s.roofs.map((r) => (r.id === id ? Object.assign({}, r, typeof patch === "function" ? patch(r) : patch) : r)) }), key);
  const patchObs = (id, patch, key) => commit((s) => Object.assign({}, s, {
    obstacles: (s.obstacles || []).map((o) => (o.id === id ? Object.assign({}, o, patch) : o)) }), key);
  const patchMeas = (id, patch, key) => commit((s) => Object.assign({}, s, {
    measures: (s.measures || []).map((m) => (m.id === id ? Object.assign({}, m, patch) : m)) }), key);
  const patchBlk = (roof, i, patch, key) => patchRoof(roof.id, (r) => {
    const bs = p3sBlkStore(r); if (!bs[i]) return {};
    bs[i] = Object.assign({}, bs[i], patch); return { blocks: bs };
  }, key);
  const patchAllBlk = (roof, patch, key) => patchRoof(roof.id, (r) => ({ blocks: p3sBlkStore(r).map((b) => Object.assign({}, b, patch)) }), key);
  /* แตะแผง = ปิด/เปิด · แตะช่องว่าง = เติมแผงตรงนั้น (ตรรกะเดียวกับ toggleCell ของแบบเก่า) */
  const toggleCell = (roof, key, isSlot) => patchRoof(roof.id, (r) => {
    const bi = p3sBlkOfKey(key), bs = p3sBlkStore(r), b = bs[bi]; if (!b) return {};
    const adds = Object.assign({}, b.adds || {}), skips = Object.assign({}, b.skips || {});
    if (isSlot) { adds[key] = true; delete skips[key]; }
    else if (adds[key]) delete adds[key];
    else if (skips[key]) delete skips[key];
    else skips[key] = true;
    bs[bi] = Object.assign({}, b, { adds, skips });
    return { blocks: bs };
  });
  const setCells = (roof, keys, off) => patchRoof(roof.id, (r) => {
    const bs = p3sBlkStore(r);
    keys.forEach((k) => {
      const b = bs[p3sBlkOfKey(k)]; if (!b) return;
      b.skips = Object.assign({}, b.skips || {});
      if (off) b.skips[k] = true; else delete b.skips[k];
    });
    return { blocks: bs };
  });

  const setTool = (k) => {
    setToolRaw(k); setDraw(null); setMeasPts(null); setCalib(null); setMarq(null); setAxisPts(null); setWalkPts(null); setEavePick(false);
    if (k !== "walk") setSelWalk(null);
    setTrace((t) => (t && k === "roof" ? t : null));
    if (k !== "panel") setSelBlk(null);
    if (k === "panel" && sel && sel.t !== "roof") setSel(null);
    if (view3d && k !== "select" && k !== "pan") setView3d(false);
  };

  /* ── ขนาดผืนวาด ── */
  const stageRef = React.useRef(null);
  React.useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const on = () => { const r = el.getBoundingClientRect(); setSize({ w: Math.max(50, r.width), h: Math.max(50, r.height) }); };
    on(); const ro = new ResizeObserver(on); ro.observe(el);
    return () => ro.disconnect();
  }, [st == null]);
  /* จัดกรอบครั้งแรกเมื่อโหลดข้อมูล + รู้ขนาดจอแล้ว */
  const fittedRef = React.useRef(false);
  const fitView = (s0) => {
    const S = s0 || stRef.current; if (!S) return;
    const b = p3sBounds(S, photoAR), { w, h } = sizeRef.current;
    const pad = isMobile ? 30 : 70;
    const s = p3sClamp(Math.min((w - pad) / Math.max(4, b.maxX - b.minX), (h - pad) / Math.max(4, b.maxZ - b.minZ)), 0.4, 300);
    setView({ cx: (b.minX + b.maxX) / 2, cz: (b.minZ + b.maxZ) / 2, s });
  };
  React.useEffect(() => {
    if (!st || fittedRef.current || size.w < 60) return;
    fittedRef.current = true; fitView(st);
  }, [st, size.w]); // eslint-disable-line
  /* สัดส่วนรูปโดรน — ต้องรู้ถึงจะวาดกรอบ/ช่วยวาดได้ถูก */
  React.useEffect(() => {
    if (!st || !st.photo) return;
    let off = false;
    p3sImg(st.photo).then((im) => { if (!off) setPhotoAR((im.naturalHeight || 1) / (im.naturalWidth || 1)); }).catch(() => {});
    return () => { off = true; };
  }, [st && st.photo]);

  /* ── แปลงพิกัด ── */
  /* ผังหมุนได้: แนวอ้างอิงของหลังคา (st.p3sAxis) วางขนานขอบจอ — วาดสี่เหลี่ยม "ตรง" ได้ทันทีแม้อาคารเอียง */
  const axisDeg = st && st.p3sAxis != null ? +st.p3sAxis : null;
  const axisRad = (axisDeg || 0) * P3_DEG;
  const rotRef = React.useRef(0); rotRef.current = alignView && axisDeg ? axisRad : 0;
  const toW = (p, v) => {
    const V = v || viewRef.current, S = sizeRef.current, k = p3sRot((p.x - S.w / 2) / V.s, (p.y - S.h / 2) / V.s, rotRef.current);
    return { x: k.x + V.cx, z: k.z + V.cz };
  };
  const toS = (x, z, v) => {
    const V = v || viewRef.current, S = sizeRef.current, k = p3sRot(x - V.cx, z - V.cz, -rotRef.current);
    return { x: k.x * V.s + S.w / 2, y: k.z * V.s + S.h / 2 };
  };
  /* จุดศูนย์กลางที่ทำให้จุดโลก w อยู่ใต้จุดจอ p ที่ซูม s */
  const centerFor = (w, p, s) => { const S = sizeRef.current, k = p3sRot((p.x - S.w / 2) / s, (p.y - S.h / 2) / s, rotRef.current); return { cx: w.x - k.x, cz: w.z - k.z }; };
  const zoomAt = (p, f) => {
    const V = viewRef.current, s = p3sClamp(V.s * f, 0.4, 400), w = toW(p, V);
    setView(Object.assign({ s }, centerFor(w, p, s)));
  };
  /* แปลงเวกเตอร์ "บนจอ" → "บนผัง" (ใช้กับปุ่มลูกศร/ลากสี่เหลี่ยม) */
  const scrVec = (dx, dz) => p3sRot(dx, dz, rotRef.current);
  const frameOf = (w) => p3sRot(w.x, w.z, -rotRef.current);
  React.useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const onWheel = (e) => {
      if (view3d) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt({ x: e.clientX - r.left, y: e.clientY - r.top }, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const roofs = (st && st.roofs) || [];
  const selRoof = sel && sel.t === "roof" ? roofs.find((r) => r.id === sel.id) : null;
  const selObs = sel && sel.t === "obs" ? ((st && st.obstacles) || []).find((o) => o.id === sel.id) : null;
  const selMeas = sel && sel.t === "meas" ? ((st && st.measures) || []).find((m) => m.id === sel.id) : null;

  /* ── จุดดูดติด: มุมของทุกหลังคา (ยกเว้นผืนที่กำลังแก้) ── */
  const snapPts = (exceptId) => {
    const out = [];
    roofs.forEach((r) => { if (r.id !== exceptId) p3sFaces2D(r).forEach((f) => f.pts.forEach((p) => out.push(p))); });
    return out;
  };
  const snapSegs = (exceptId) => {
    const out = [];
    roofs.forEach((r) => { if (r.id !== exceptId) p3sFaces2D(r).forEach((f) => f.pts.forEach((p, i) => out.push([p, f.pts[(i + 1) % f.pts.length]]))); });
    return out;
  };
  /* ฟิลด์ขอบภาพรอบ ๆ จุดที่กำลังทำงาน (120×120 ม.) — คำนวณใหม่เมื่อเลื่อนออกนอกบริเวณหรือภาพเปลี่ยน */
  const imgKey = st ? [st.baseMap && st.baseMap.url ? String(st.baseMap.url).length + ":" + st.baseMap.widthM + ":" + String(st.baseMap.url).slice(-24) : "",
    st.photo ? String(st.photo).length + ":" + st.photoW + ":" + st.photoX + ":" + st.photoZ + ":" + st.photoRot : ""].join("|") : "";
  const imgKeyRef = React.useRef(""); imgKeyRef.current = imgKey;
  const needEdge = (w) => {
    const S = stRef.current; if (!S || !((S.baseMap && S.baseMap.url) || S.photo)) return Promise.resolve(null);
    const F = edgeRef.current, key = imgKeyRef.current;
    if (F && F.key === key && Math.abs(w.x - F.cx) < F.Wm * 0.3 && Math.abs(w.z - F.cz) < F.Wm * 0.3) return Promise.resolve(F);
    if (edgeBusy.current) return edgeBusy.current;
    edgeBusy.current = p3sEdgeField(S, { x: w.x, z: w.z }, 120, 0.1).then((F2) => {
      edgeBusy.current = null;
      if (F2 && !F2.err) { F2.key = key; edgeRef.current = F2; setEdgeTick((n) => n + 1); }
      return F2;
    }).catch((e) => { edgeBusy.current = null; return { err: e.message }; });
    return edgeBusy.current;
  };
  const SNAP_PX = coarse ? 16 : 11;
  /* ดูดติดมุม → ถ้าไม่ติดมุม ลองดูดแนวฉาก/ขนานกับขอบอ้างอิง (กด Shift = วางอิสระ) */
  const snapPoint = (w, o) => {
    const opt = o || {};
    if (opt.free) return { x: p3sR(w.x), z: p3sR(w.z) };
    const s = viewRef.current.s, lim = SNAP_PX / s;
    let best = null, bd = lim;
    (opt.pts || []).forEach((p) => { const d = Math.hypot(p.x - w.x, p.z - w.z); if (d < bd) { bd = d; best = p; } });
    if (best) return { x: best.x, z: best.z, snap: true };
    const EF = opt.img && edgeOn ? edgeRef.current : null;
    const Rimg = Math.max(SNAP_PX * 1.5 / s, 0.25);
    if (opt.from) {
      const F = opt.from, dx = w.x - F.x, dz = w.z - F.z, L = Math.hypot(dx, dz);
      if (L > 0.05) {
        const a = Math.atan2(dz, dx);
        const refs = [axisRad].concat(opt.refs || []);
        let ba = null, bdiff = 4.5 * P3_DEG;
        refs.forEach((r0) => {
          for (let k = 0; k < 4; k++) {
            const r = r0 + k * Math.PI / 2;
            let df = Math.abs(((a - r) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
            if (df < bdiff) { bdiff = df; ba = r; }
          }
        });
        if (ba != null) {
          const pr = dx * Math.cos(ba) + dz * Math.sin(ba);
          const gp = { x: F.x + pr * Math.cos(ba), z: F.z + pr * Math.sin(ba) }, guide = { from: F, ang: ba };
          // เกาะทั้งแนวและขอบภาพ: ค้นหาขอบที่ตัดเส้นแนวนี้ใกล้เคอร์เซอร์
          const e = EF ? p3sEdgeSnap(EF, gp, Rimg, { x: Math.cos(ba), z: Math.sin(ba) }) : null;
          if (e) return { x: e.x, z: e.z, guide, edge: true };
          return { x: p3sR(gp.x), z: p3sR(gp.z), guide };
        }
      }
    }
    // เกาะขอบหลังคาที่วาดไว้แล้ว (ผืนติดกันจะได้ขอบร่วมกันพอดี)
    if (opt.segs) {
      let bs = null, bsd = lim;
      opt.segs.forEach(([a, b]) => {
        const dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz; if (!L2) return;
        const t = p3sClamp(((w.x - a.x) * dx + (w.z - a.z) * dz) / L2, 0, 1), q = { x: a.x + t * dx, z: a.z + t * dz };
        const d = Math.hypot(q.x - w.x, q.z - w.z); if (d < bsd) { bsd = d; bs = q; }
      });
      if (bs) return { x: p3sR(bs.x), z: p3sR(bs.z), snap: true, onEdge: true };
    }
    if (EF) { const e = p3sEdgeSnap(EF, w, Rimg, null); if (e) return { x: e.x, z: e.z, edge: true }; }
    return { x: p3sR(w.x), z: p3sR(w.z) };
  };

  /* ── สร้างหลังคาจากจุดบนผัง ── */
  const EAVE = 3;
  const buildRoof = (wpts, kind, n) => {
    let nr;
    if (kind === "gable" || kind === "hip") {
      const R = p3MinRect(wpts); if (!R) return;
      const long = Math.max(R.w, R.d), short = Math.min(R.w, R.d);
      const ang = R.w >= R.d ? R.ang : R.ang + Math.PI / 2;
      const az = p3sR((((180 + ang / P3_DEG) % 360) + 360) % 360, 10);
      const base = kind === "gable"
        ? Object.assign(p3NewGable(n), { ridge: p3sR(long), span: p3sR(short), pitch: 20 })
        : Object.assign(p3NewHip(n), { w: p3sR(long), d: p3sR(short), pitch: 25 });
      nr = Object.assign(base, { x: p3sR(R.cx), z: p3sR(R.cz), az, h: EAVE });
    } else {
      const c = p3sCentroid(wpts);
      const rel = wpts.map((p) => ({ x: p3sR(p.x - c.x), z: p3sR(p.z - c.z) }));
      nr = Object.assign(p3NewRoof(n), { kind: "poly", x: p3sR(c.x), z: p3sR(c.z), h: 0.05, pts: rel, ph: rel.map(() => EAVE), margin: 0.3 });
      if (kind === "shed") { const lo = p3sSouthEdge(rel); nr.p3sLow = lo; nr.ph = p3sPitchPh(rel, lo, EAVE, 10); }
      else if (kind === "facet") {
        /* ผืนเดียวของหลังคาทรงซับซ้อน: ชายคา = ขอบยาวที่สุดที่ "ไม่ได้" ใช้ร่วมกับผืนข้าง ๆ
           (ขอบที่ใช้ร่วมคือสัน/ตะเข้) — เสมอกันเลือกขอบที่หันใต้มากกว่า */
        const segs = snapSegs(), tol = 0.15;
        const shared = (a, b) => segs.some(([c, d]) => p3sDistSeg(a, c, d) < tol && p3sDistSeg(b, c, d) < tol);
        let lo = 0, bv = -1;
        wpts.forEach((a, i) => {
          const b = wpts[(i + 1) % wpts.length], L = Math.hypot(b.x - a.x, b.z - a.z);
          const sc = (shared(a, b) ? 0 : 1000) + L - Math.abs(p3sEdgeBearing(rel, i) - 180) / 90;
          if (sc > bv) { bv = sc; lo = i; }
        });
        nr.p3sLow = lo; nr.ph = p3sPitchPh(rel, lo, EAVE, 20); nr.p3sFacet = true;
        // ความชันตั้งต้นตามผืนข้าง ๆ ที่วาดไว้แล้ว (หลังคาหลังเดียวกันมักชันเท่ากัน)
        const nb = (stRef.current.roofs || []).filter((r) => r.p3sFacet && r.kind === "poly");
        if (nb.length) {
          const lp = nb[nb.length - 1], pc = +lp.p3sPitch > 0 ? +lp.p3sPitch : (p3sPolyPitch(lp) || 20);
          nr.ph = p3sPitchPh(rel, lo, EAVE, pc); nr.p3sPitch = pc;
        }
      } else {
        // หลังคาราบ: แถวแผงขนานขอบที่ยาวที่สุด (ไม่งั้นแผงวางตามแกนผังแล้วโดนตัดขอบเป็นฟันเลื่อย)
        const rot = p3sAlignRot(nr, null, p3sLongEdgeAng(wpts));
        nr.blocks = [Object.assign(p3NewBlk(0), { rot })];
      }
    }
    // วาดหลังคาก่อน วางแผงทีหลัง — แผงขึ้นเมื่อกด "วางแผงเต็มหลังคา" (ทรงยังไม่นิ่ง วางไปก็ต้องจัดใหม่)
    nr.noPanel = true;
    return nr;
  };
  const makeRoof = (wpts, kind) => {
    const S = stRef.current; if (!S || wpts.length < 3) return;
    if (p3Area(wpts) < 1) return;
    const nr = buildRoof(wpts, kind, p3NextRoofNo(S.roofs)); if (!nr) return;
    if (+S.panelW > 0) { nr.panelW = S.panelW; nr.panelL = S.panelL; }
    commit((s) => {
      let roofs = (s.roofs || []).concat([nr]);
      if (nr.p3sFacet) roofs = p3sWeldFacets(roofs, [nr.id]).roofs;
      return Object.assign({}, s, { roofs });
    });
    setSel({ t: "roof", id: nr.id }); setSelVert(null); setSelBlk(null);
    return nr;
  };
  const rectFrom3 = (A, B, C) => {
    const ex = B.x - A.x, ez = B.z - A.z, L = Math.hypot(ex, ez) || 1;
    const nx = -ez / L, nz = ex / L, wd = (C.x - A.x) * nx + (C.z - A.z) * nz;
    return [A, B, { x: B.x + nx * wd, z: B.z + nz * wd }, { x: A.x + nx * wd, z: A.z + nz * wd }].map((p) => ({ x: p3sR(p.x), z: p3sR(p.z) }));
  };
  const finishPoly = () => {
    if (!draw || draw.pts.length < 3) return;
    makeRoof(draw.pts, roofOpt.kind); setDraw(null);
  };
  const finishMeas = () => {
    if (!measPts || measPts.length < 2) { setMeasPts(null); return; }
    const S = stRef.current, nm = { id: p3Id("m"), name: "ระยะ " + (((S.measures || []).length) + 1), kind: "cable", rise: 0, pts: measPts.map((p) => ({ x: p3sR(p.x), z: p3sR(p.z) })) };
    commit((s) => Object.assign({}, s, { measures: (s.measures || []).concat([nm]) }));
    setSel({ t: "meas", id: nm.id }); setMeasPts(null);
  };
  /* พิมพ์ความยาวระหว่างวาด: ต่อขอบใหม่ยาวตามที่พิมพ์ ในทิศที่เมาส์ชี้อยู่ */
  const applyTyped = () => {
    if (!draw || !draw.typed) return false;
    const L = parseFloat(draw.typed); if (!(L > 0)) { setDraw(Object.assign({}, draw, { typed: "" })); return true; }
    const pts = draw.pts, last = pts[pts.length - 1], c = cur || last;
    if (rectDraw && pts.length === 2) {
      const C = rectFrom3(pts[0], pts[1], c);
      const ex = pts[1].x - pts[0].x, ez = pts[1].z - pts[0].z, E = Math.hypot(ex, ez) || 1;
      let nx = -ez / E, nz = ex / E; const sd = (c.x - pts[0].x) * nx + (c.z - pts[0].z) * nz; if (sd < 0) { nx = -nx; nz = -nz; }
      makeRoof(rectFrom3(pts[0], pts[1], { x: pts[0].x + nx * L, z: pts[0].z + nz * L }), roofOpt.kind); setDraw(null);
      return !!C;
    }
    let dx = c.x - last.x, dz = c.z - last.z, D = Math.hypot(dx, dz);
    if (D < 1e-6) { dx = 1; dz = 0; D = 1; }
    const np = { x: p3sR(last.x + dx / D * L), z: p3sR(last.z + dz / D * L) };
    setDraw({ pts: pts.concat([np]), typed: "" });
    return true;
  };

  /* ── ตัวช่วยวาดจากภาพ ── */
  /* โหมด "edge" (ค่าเริ่ม) = ยิงหาขอบ 4 ทิศตามแนวหลังคา ใช้ได้ทุกสี · โหมด "color" = ไล่สี (หลังคาสีเรียบ) */
  const runTrace = (seed, tol, mode) => {
    const md = mode || (trace && trace.mode) || "edge";
    setTrace({ on: true, busy: true, seed, mode: md });
    const job = md === "color" ? p3sTrace(stRef.current, seed, tol) : needEdge(seed).then((F) => {
      if (!F || F.err) return { err: (F && F.err) || "อ่านขอบภาพไม่ได้" };
      const S = stRef.current, ax = S.p3sAxis != null ? +S.p3sAxis : p3sDetectAxis(F, seed, 20);
      const r = p3sRayRect(F, seed, ax || 0);
      if (r.pts && S.p3sAxis == null && ax != null) r.ax = ax;
      return r;
    });
    job.then((r) => setTrace((t) => (t && t.on ? Object.assign({}, t, { busy: false, seed, pts: r.pts || null, err: r.err || null, warn: r.warn || null, area: r.area, ax: r.ax }) : t)));
  };
  const acceptTrace = () => {
    if (!trace || !trace.pts) return;
    if (trace.ax != null && stRef.current.p3sAxis == null) commit({ p3sAxis: trace.ax });
    makeRoof(trace.pts, roofOpt.kind === "facet" ? "flat" : roofOpt.kind);
    setTrace({ on: true, mode: trace.mode });
  };
  /* ── แนวอ้างอิง ── */
  const setAxis = (deg, msg) => {
    if (deg == null) { commit({ p3sAxis: null }); setAxisMsg(msg || null); return; }
    commit({ p3sAxis: p3sNormAxis(deg) }); setAxisMsg(msg || null);
  };
  const finishAxis = (a, b) => {
    setAxisPts(null); setCur(null);
    if (Math.hypot(b.x - a.x, b.z - a.z) < 0.4) return;
    setAxis(Math.atan2(b.z - a.z, b.x - a.x) / P3_DEG, "ตั้งแนวจากเส้นที่ลาก");
    if (!wizAllowRef.current) setToolRaw("roof");
  };
  const zoomArea = (A) => {
    if (!A || !(A.pts || []).length) return;
    const f = A.pts.map(frameOf), xs = f.map((q) => q.x), zs = f.map((q) => q.z), c = p3sCentroid(A.pts), { w, h } = sizeRef.current, pad = isMobile ? 30 : 80;
    const s = p3sClamp(Math.min((w - pad) / Math.max(4, Math.max(...xs) - Math.min(...xs)), (h - pad) / Math.max(4, Math.max(...zs) - Math.min(...zs))), 0.4, 300);
    setView({ cx: c.x, cz: c.z, s });
  };
  const autoAxis = () => {
    const S = sizeRef.current, AR = stRef.current && stRef.current.p3sArea;
    if (AR && (AR.pts || []).length > 2) {
      const c = p3sCentroid(AR.pts), R = p3sClamp(Math.max(...AR.pts.map((q) => Math.max(Math.abs(q.x - c.x), Math.abs(q.z - c.z)))), 6, 55);
      setAxisMsg("กำลังอ่านขอบในภาพ…");
      needEdge(c).then((F) => {
        if (!F || F.err) { setAxisMsg((F && F.err) || "ต้องมีภาพดาวเทียมหรือรูปโดรนก่อน"); return; }
        const d = p3sDetectAxis(F, c, R);
        if (d == null) { setAxisMsg("ในกรอบพื้นที่ติดตั้งไม่มีขอบชัดพอ — ลากเส้นตามขอบหลังคาเองแทน"); return; }
        setAxis(d, "พบแนวอาคาร " + d + "° จากขอบในกรอบพื้นที่ติดตั้ง — ไม่ตรงปรับองศาด้านล่างได้");
        setTimeout(() => zoomArea(AR), 0);
      });
      return;
    }
    const c = toW({ x: S.w / 2, y: S.h / 2 });
    setAxisMsg("กำลังอ่านขอบในภาพ…");
    needEdge(c).then((F) => {
      if (!F || F.err) { setAxisMsg((F && F.err) || "ต้องมีภาพดาวเทียมหรือรูปโดรนก่อน"); return; }
      const d = p3sDetectAxis(F, c, Math.min(30, 220 / viewRef.current.s + 8));
      if (d == null) { setAxisMsg("ภาพบริเวณนี้ไม่มีขอบชัดพอ — ลากเส้นตามขอบหลังคาเองแทน"); return; }
      setAxis(d, "พบแนวอาคาร " + d + "° จากขอบในภาพ (บริเวณกลางจอ)");
    });
  };
  const axisFromRoof = (r) => {
    const fp = r.kind === "poly" ? p3sFaces2D(r)[0].pts : p3sOutline(r);
    if (fp && fp.length > 2) setAxis(p3sLongEdgeAng(fp) / P3_DEG, "ตั้งแนวตามขอบยาวของ " + (r.name || "หลังคา"));
  };
  /* ── ทางเดิน ── */
  const hitWalk = (w) => {
    const s = viewRef.current.s;
    for (let i = roofs.length - 1; i >= 0; i--) {
      const r = roofs[i], ox = +r.x || 0, oz = +r.z || 0;
      for (const wk of (r.walks || [])) {
        const P = (wk.pts || []).map((q) => ({ x: ox + (+q.x || 0), z: oz + (+q.z || 0) }));
        for (let j = 1; j < P.length; j++) if (p3sDistSeg(w, P[j - 1], P[j]) < Math.max((+wk.w || 0.6) / 2, 8 / s)) return { roofId: r.id, id: wk.id };
      }
    }
    return null;
  };
  const finishWalk = () => {
    const P = walkPts; setWalkPts(null); setCur(null);
    if (!P || P.length < 2) return;
    const mid = { x: (P[0].x + P[P.length - 1].x) / 2, z: (P[0].z + P[P.length - 1].z) / 2 };
    const S = stRef.current;
    let r = (S.roofs || []).slice().reverse().find((x) => p3sRoofHit(x, mid)) || (S.roofs || []).slice().reverse().find((x) => P.some((q) => p3sRoofHit(x, q)));
    if (!r && selRoof) r = selRoof;
    if (!r) return;
    const wk = { id: p3Id("wk"), w: walkW, pts: P.map((q) => ({ x: p3sR(q.x - (+r.x || 0)), z: p3sR(q.z - (+r.z || 0)) })) };
    patchRoof(r.id, (rr) => ({ walks: (rr.walks || []).concat([wk]) }));
    setSel({ t: "roof", id: r.id }); setSelWalk({ roofId: r.id, id: wk.id });
  };
  const patchWalk = (roofId, id, patch, key) => patchRoof(roofId, (r) => ({ walks: (r.walks || []).map((x) => (x.id === id ? Object.assign({}, x, patch) : x)) }), key);
  const delWalk = (roofId, id) => { patchRoof(roofId, (r) => ({ walks: (r.walks || []).filter((x) => x.id !== id) })); setSelWalk(null); };
  /* ── ชายคาของผืนทรงอิสระ: ขอบ i เป็นขอบต่ำสุด มุมอื่นสูงขึ้นตามความชัน ── */
  const setEave = (roof, i, pitch) => {
    patchRoof(roof.id, (r) => {
      const ph = p3PhOf(r), base = ph.length ? Math.min.apply(null, ph) : EAVE;
      const pc = pitch != null ? pitch : (p3sPolyPitch(r) > 0.4 ? p3sPolyPitch(r) : 20);
      return { ph: p3sPitchPh(r.pts, i, base, pc), p3sLow: i, p3sEaveFix: true };
    });
    if (roof.p3sFacet) weldLive([roof.id]);
  };
  /* เชื่อมรอยต่อทันที (ไม่เพิ่มขั้นย้อนกลับ — ใช้ต่อท้ายการแก้ที่เพิ่งบันทึกประวัติไปแล้ว) */
  const weldLive = (ids, opt) => {
    const S = stRef.current; if (!S) return;
    const res = p3sWeldFacets(S.roofs, ids, opt);
    if (res.n) live(Object.assign({}, S, { roofs: res.roofs }));
  };
  const weldNow = (roof) => commit((s) => {
    const res = p3sWeldFacets(s.roofs, [roof.id], { mark: true });
    return res.n ? Object.assign({}, s, { roofs: res.roofs }) : s;
  });
  /* ── เปลี่ยนทรงหลังคาโดยคงรอยเท้าเดิม ── */
  const convertRoof = (roof, kind) => {
    const fp = roof.kind === "poly" ? p3sFaces2D(roof)[0].pts : p3sOutline(roof);
    if (!fp || fp.length < 3) return;
    const nr = buildRoof(fp, kind, 1); if (!nr) return;
    const ph = roof.kind === "poly" ? p3PhOf(roof) : [];
    const eave = roof.kind === "poly" ? (ph.length ? Math.min.apply(null, ph) : EAVE) : (+roof.h || EAVE);
    const keep = { id: roof.id, name: roof.name };
    const ox = +roof.x || 0, oz = +roof.z || 0;
    const walks = (roof.walks || []).map((w) => Object.assign({}, w, { pts: (w.pts || []).map((q) => ({ x: p3sR(ox + (+q.x || 0) - nr.x), z: p3sR(oz + (+q.z || 0) - nr.z) })) }));
    patchRoof(roof.id, () => {
      const o = Object.assign({}, nr, keep, { walks, skips: {}, panelW: roof.panelW, panelL: roof.panelL, margin: roof.margin });
      if (nr.kind === "poly") { const d = eave - EAVE; o.ph = nr.ph.map((x) => p3sR(x + d)); }
      else { o.h = eave; o.pts = null; o.ph = null; }
      return o;
    });
  };

  /* ── ปุ่มคีย์บอร์ด ── */
  const spaceRef = React.useRef(false);
  const keyRef = React.useRef(null);
  keyRef.current = (e) => {
    const tg = e.target, typing = tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || tg.isContentEditable);
    if (typing) { if (e.key === "Escape") tg.blur(); return; }
    if (!stRef.current) return;
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (mod && (k === "z" || k === "Z")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && (k === "y" || k === "Y")) { e.preventDefault(); redo(); return; }
    if (mod && (k === "s" || k === "S")) { e.preventDefault(); doSave(); return; }
    if (mod && (k === "d" || k === "D")) { e.preventDefault(); duplicate(); return; }
    if (k === " ") { spaceRef.current = true; e.preventDefault(); return; }
    // ระหว่างวาด: ตัวเลข = พิมพ์ความยาว
    if (draw && /^[0-9.]$/.test(k)) { setDraw(Object.assign({}, draw, { typed: (draw.typed || "") + k })); e.preventDefault(); return; }
    if (k === "Enter") {
      if (draw) { if (!applyTyped()) finishPoly(); e.preventDefault(); return; }
      if (measPts) { finishMeas(); return; }
      if (walkPts) { finishWalk(); return; }
      if (trace && trace.pts) { acceptTrace(); return; }
      return;
    }
    if (k === "Backspace") {
      if (draw) { e.preventDefault(); if (draw.typed) setDraw(Object.assign({}, draw, { typed: draw.typed.slice(0, -1) })); else if (draw.pts.length > 1) setDraw(Object.assign({}, draw, { pts: draw.pts.slice(0, -1) })); else setDraw(null); return; }
      if (measPts) { e.preventDefault(); setMeasPts(measPts.length > 1 ? measPts.slice(0, -1) : null); return; }
      if (walkPts) { e.preventDefault(); setWalkPts(walkPts.length > 1 ? walkPts.slice(0, -1) : null); return; }
    }
    if (k === "Escape") {
      if (draw) { setDraw(null); return; }
      if (measPts) { setMeasPts(null); return; }
      if (walkPts) { setWalkPts(null); return; }
      if (axisPts) { setAxisPts(null); setCur(null); return; }
      if (eavePick) { setEavePick(false); return; }
      if (selWalk) { setSelWalk(null); return; }
      if (calib) { setCalib(null); return; }
      if (trace && trace.pts) { setTrace({ on: true }); return; }
      if (trace) { setTrace(null); return; }
      if (selVert != null) { setSelVert(null); return; }
      if (selBlk != null) { setSelBlk(null); return; }
      if (sel) { setSel(null); return; }
      if (toolOk("select")) setTool("select"); return;
    }
    if (k === "Delete" || k === "Backspace") { e.preventDefault(); delSelected(); return; }
    if (k.indexOf("Arrow") === 0 && sel && (sel.t === "roof" || sel.t === "obs")) {
      e.preventDefault();
      const st0 = e.shiftKey ? 1 : 0.1;
      const v0 = scrVec(k === "ArrowLeft" ? -st0 : k === "ArrowRight" ? st0 : 0, k === "ArrowUp" ? -st0 : k === "ArrowDown" ? st0 : 0);
      const dx = p3sR(v0.x, 1000), dz = p3sR(v0.z, 1000);
      if (sel.t === "roof") {
        const g = selRoof && selRoof.grp;
        commit((s) => Object.assign({}, s, { roofs: s.roofs.map((r) => (r.id === sel.id || (g && r.grp === g) ? Object.assign({}, r, { x: p3sR((+r.x || 0) + dx), z: p3sR((+r.z || 0) + dz) }) : r)) }), "nudge");
      }
      else patchObs(sel.id, { x: p3sR((+selObs.x || 0) + dx), z: p3sR((+selObs.z || 0) + dz) }, "nudge");
      return;
    }
    if (mod || e.altKey) return;
    const t = P3S_TOOLS.find((x) => x.key.toLowerCase() === k.toLowerCase());
    if (t) { if (toolOk(t.k)) setTool(t.k); return; }
    if (k === "f" || k === "F") { fitView(); return; }
    if (k === "+" || k === "=") zoomAt({ x: sizeRef.current.w / 2, y: sizeRef.current.h / 2 }, 1.25);
    if (k === "-" || k === "_") zoomAt({ x: sizeRef.current.w / 2, y: sizeRef.current.h / 2 }, 0.8);
  };
  React.useEffect(() => {
    const dn = (e) => keyRef.current && keyRef.current(e);
    const up = (e) => { if (e.key === " ") spaceRef.current = false; };
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  const delSelected = () => {
    if (selWalk) { delWalk(selWalk.roofId, selWalk.id); return; }
    if (!sel) return;
    if (sel.t === "roof" && selVert != null && selRoof && selRoof.kind === "poly" && (selRoof.pts || []).length > 3) {
      const i = selVert;
      patchRoof(selRoof.id, (r) => ({ pts: r.pts.filter((_, j) => j !== i), ph: p3PhOf(r).filter((_, j) => j !== i) }));
      setSelVert(null); return;
    }
    const key = sel.t === "roof" ? "roofs" : sel.t === "obs" ? "obstacles" : "measures";
    commit((s) => { const o = {}; o[key] = (s[key] || []).filter((x) => x.id !== sel.id); return Object.assign({}, s, o); });
    setSel(null); setSelVert(null); setSelBlk(null);
  };
  const duplicate = () => {
    if (!sel) return;
    if (sel.t === "roof" && selRoof) {
      const nr = Object.assign(JSON.parse(JSON.stringify(selRoof)), { id: p3Id("r"), name: "หลังคา " + p3NextRoofNo(roofs), x: p3sR((+selRoof.x || 0) + 1.5), z: p3sR((+selRoof.z || 0) + 1.5) });
      delete nr.grp;
      commit((s) => Object.assign({}, s, { roofs: s.roofs.concat([nr]) })); setSel({ t: "roof", id: nr.id });
    } else if (sel.t === "obs" && selObs) {
      const no = Object.assign({}, selObs, { id: p3Id("o"), x: p3sR((+selObs.x || 0) + 1.5), z: p3sR((+selObs.z || 0) + 1.5) });
      commit((s) => Object.assign({}, s, { obstacles: (s.obstacles || []).concat([no]) })); setSel({ t: "obs", id: no.id });
    }
  };

  /* ── บันทึก / ปิด / สลับแบบ ── */
  const doSave = () => {
    const S = stRef.current; if (!S) return;
    save(JSON.parse(JSON.stringify(S)));
    setDirty(false); setJustSaved(true); setTimeout(() => setJustSaved(false), 2200);
  };
  const tryClose = () => {
    if (!dirty) { onClose(); return; }
    window.askConfirm({ title: "ปิดโดยไม่บันทึก?", body: "มีการแก้ไขที่ยังไม่ได้บันทึก ถ้าปิดตอนนี้จะหายไป", ok: "ปิดโดยไม่บันทึก" })
      .then((ok) => { if (ok) onClose(); });
  };
  const trySwitch = () => {
    if (!onSwitch) return;
    if (!dirty) { onSwitch(); return; }
    window.askConfirm({ title: "บันทึกก่อนสลับไปแบบเก่า?", body: "มีการแก้ไขที่ยังไม่ได้บันทึก — กดบันทึกแล้วสลับ งานจะไปเปิดต่อในแบบเก่าได้ครบ", ok: "บันทึกแล้วสลับ" })
      .then((ok) => { if (ok) { doSave(); onSwitch(); } });
  };

  /* ── จุดจับของสิ่งที่เลือก (พิกัดจอ) ── */
  const HR = coarse ? 11 : 7;           // รัศมีที่วาด
  const HIT = coarse ? 22 : 12;         // รัศมีที่แตะโดน
  const handles = [];
  const roofHandlesOn = st && !view3d && selRoof && !lockRoofs && (tool === "select" || (tool === "roof" && !draw));
  if (roofHandlesOn) {
    if (selRoof.kind === "poly" && Array.isArray(selRoof.pts)) {
      const wp = p3sFaces2D(selRoof)[0] ? p3sFaces2D(selRoof)[0].pts : [];
      wp.forEach((p, i) => { const s = toS(p.x, p.z); handles.push({ t: "vert", i, x: s.x, y: s.y }); });
      wp.forEach((p, i) => {
        const q = wp[(i + 1) % wp.length], a = toS(p.x, p.z), b = toS(q.x, q.z);
        if (Math.hypot(b.x - a.x, b.y - a.y) > 46) handles.push({ t: "mid", i, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      });
    }
    if (selRoof.kind === "gable" || selRoof.kind === "hip") {
      const rY = -(((+selRoof.az || 180) - 180) * P3_DEG), ex = p3sRY(1, 0, rY), ez = p3sRY(0, 1, rY);
      const hx = (selRoof.kind === "gable" ? +selRoof.ridge || 8 : +selRoof.w || 10) / 2, hz = (selRoof.kind === "gable" ? +selRoof.span || 8 : +selRoof.d || 7) / 2;
      [["x", 1], ["x", -1], ["z", 1], ["z", -1]].forEach(([ax, sg]) => {
        const e = ax === "x" ? ex : ez, h = ax === "x" ? hx : hz;
        const q = toS((+selRoof.x || 0) + e.x * h * sg, (+selRoof.z || 0) + e.z * h * sg);
        handles.push({ t: "side", i: ax + sg, ax, sg, x: q.x, y: q.y });
      });
    }
    const ol = p3sOutline(selRoof).map((p) => toS(p.x, p.z));
    if (ol.length) {
      const c = p3sRoofCenter(selRoof), cs = toS(c.x, c.z);
      const top = Math.min.apply(null, ol.map((p) => p.y));
      handles.push({ t: "rot", x: cs.x, y: top - (coarse ? 40 : 30), ax: cs.x, ay: top });
    }
  }
  if (st && !view3d && tool === "select" && selObs) {
    const o = selObs, c = toS(+o.x || 0, +o.z || 0);
    if (o.kind === "tree") { const e = toS((+o.x || 0) + (+o.w || 3) / 2, +o.z || 0); handles.push({ t: "orad", x: e.x, y: e.y }); }
    else {
      const k = p3sRot((+o.w || 1) / 2, (+o.d || 1) / 2, (+o.rot || 0) * P3_DEG), e = toS((+o.x || 0) + k.x, (+o.z || 0) + k.z);
      handles.push({ t: "ocorner", x: e.x, y: e.y });
      const tp = p3sRot(0, -(+o.d || 1) / 2, (+o.rot || 0) * P3_DEG), ts = toS((+o.x || 0) + tp.x, (+o.z || 0) + tp.z);
      const dx = ts.x - c.x, dy = ts.y - c.y, L = Math.hypot(dx, dy) || 1;
      handles.push({ t: "orot", x: ts.x + dx / L * 26, y: ts.y + dy / L * 26, ax: ts.x, ay: ts.y });
    }
  }
  if (st && !view3d && tool === "select" && selMeas) {
    (selMeas.pts || []).forEach((p, i) => { const s = toS(+p.x || 0, +p.z || 0); handles.push({ t: "mpt", i, x: s.x, y: s.y }); });
  }
  const photoBox = () => {
    const S = stRef.current; if (!S || !S.photo) return null;
    const pw = +S.photoW || 30, ph = pw * photoAR, r = (+S.photoRot || 0) * P3_DEG;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const k = p3sRot(a * pw / 2, b * ph / 2, r); return { x: (+S.photoX || 0) + k.x, z: (+S.photoZ || 0) + k.z }; });
  };
  if (st && !view3d && tool === "bg" && st.photo && !calib) {
    const pb = photoBox();
    pb.forEach((p, i) => { const s = toS(p.x, p.z); handles.push({ t: "pscale", i, x: s.x, y: s.y }); });
    const a = toS((pb[0].x + pb[1].x) / 2, (pb[0].z + pb[1].z) / 2), c = toS(+st.photoX || 0, +st.photoZ || 0);
    const dx = a.x - c.x, dy = a.y - c.y, L = Math.hypot(dx, dy) || 1;
    handles.push({ t: "prot", x: a.x + dx / L * 30, y: a.y + dy / L * 30, ax: a.x, ay: a.y });
  }
  const handlesRef = React.useRef([]); handlesRef.current = handles;
  const hitHandle = (p) => {
    let best = null, bd = HIT;
    handlesRef.current.forEach((h) => { const d = Math.hypot(h.x - p.x, h.y - p.y) - (h.t === "mid" ? 3 : 0); if (d < bd) { bd = d; best = h; } });
    return best;
  };
  /* วัตถุใต้เมาส์ (บนสุดก่อน) */
  const hitBody = (w) => {
    const S = stRef.current; if (!S) return null;
    const s = viewRef.current.s;
    const obs = S.obstacles || [];
    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i], dx = w.x - (+o.x || 0), dz = w.z - (+o.z || 0);
      if (o.kind === "tree") { if (Math.hypot(dx, dz) <= Math.max(+o.w || 1, 0.6) / 2) return { t: "obs", id: o.id }; }
      else { const l = p3sRot(dx, dz, -(+o.rot || 0) * P3_DEG); if (Math.abs(l.x) <= (+o.w || 1) / 2 && Math.abs(l.z) <= (+o.d || 1) / 2) return { t: "obs", id: o.id }; }
    }
    const ms = S.measures || [];
    for (let i = ms.length - 1; i >= 0; i--) {
      const pts = ms[i].pts || [];
      for (let j = 1; j < pts.length; j++) if (p3sDistSeg(w, pts[j - 1], pts[j]) * s < (coarse ? 14 : 8)) return { t: "meas", id: ms[i].id };
    }
    const rs = S.roofs || [];
    for (let i = rs.length - 1; i >= 0; i--) if (p3sRoofHit(rs[i], w)) return { t: "roof", id: rs[i].id };
    return null;
  };
  const panelAt = (roof, w, want) => {
    const qs = p3sQuads(roof, want);
    for (let i = qs.length - 1; i >= 0; i--) if (p3InPoly(w.x, w.z, qs[i].pts)) return qs[i];
    return null;
  };

  /* ============== ตัวจับเมาส์/นิ้ว ============== */
  const ptrs = React.useRef(new Map());
  const gest = React.useRef(null);
  const lastTap = React.useRef({ t: 0, x: 0, y: 0 });
  const localXY = (e) => { const r = stageRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const THR = coarse ? 8 : 4;
  const ensurePushed = (G) => { if (!G.pushed) { pushHist(G.s0); G.pushed = true; } };
  const cancelGesture = () => {
    const G = gest.current; gest.current = null; setMarq(null);
    if (G && G.pushed) { const H = hist.current; const prev = H.u.pop(); if (prev) { stRef.current = prev; setStRaw(prev); } setHistTick((n) => n + 1); }
  };

  const onDown = (e) => {
    if (!st || view3d) return;
    const p = localXY(e);
    try { stageRef.current.setPointerCapture(e.pointerId); } catch (er) {}
    ptrs.current.set(e.pointerId, p);
    if (ptrs.current.size === 2) {
      cancelGesture();
      const [a, b] = Array.from(ptrs.current.values());
      gest.current = { type: "pinch", a0: a, b0: b, v0: viewRef.current };
      return;
    }
    if (ptrs.current.size > 2) return;
    const btn = e.button;
    if (btn === 1 || btn === 2 || spaceRef.current || tool === "pan") {
      e.preventDefault();
      gest.current = { type: "pan", p0: p, v0: viewRef.current };
      return;
    }
    if (btn !== 0) return;
    const w = toW(p), S = stRef.current;
    const base = { p0: p, w0: w, s0: S, moved: false, shift: e.shiftKey };
    const now = Date.now(), dbl = now - lastTap.current.t < 360 && Math.hypot(p.x - lastTap.current.x, p.y - lastTap.current.y) < 14;
    lastTap.current = { t: now, x: p.x, y: p.y };

    // แตะขอบเพื่อตั้งชายคา (ผืนทรงอิสระที่เลือกอยู่)
    if (eavePick && selRoof && selRoof.kind === "poly") {
      const fp = p3sFaces2D(selRoof)[0].pts; let bi = -1, bd = HIT / viewRef.current.s;
      fp.forEach((a, i) => { const d = p3sDistSeg(w, a, fp[(i + 1) % fp.length]); if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0) { setEave(selRoof, bi); setEavePick(false); }
      return;
    }
    // จุดจับก่อนเสมอ
    const h = hitHandle(p);
    if (h) {
      if (h.t === "vert") { setSelVert(h.i); gest.current = Object.assign(base, { type: "vert", i: h.i, roofId: selRoof.id }); return; }
      if (h.t === "mid") { gest.current = Object.assign(base, { type: "mid", i: h.i, roofId: selRoof.id }); return; }
      if (h.t === "side") { gest.current = Object.assign(base, { type: "side", ax: h.ax, sg: h.sg, roofId: selRoof.id, r0: selRoof }); return; }
      if (h.t === "rot") { const c = p3sRoofCenter(selRoof); gest.current = Object.assign(base, { type: "rotRoof", roofId: selRoof.id, c, r0: selRoof }); return; }
      if (h.t === "ocorner" || h.t === "orad" || h.t === "orot") { gest.current = Object.assign(base, { type: h.t, id: selObs.id, o0: selObs }); return; }
      if (h.t === "mpt") { gest.current = Object.assign(base, { type: "mpt", i: h.i, id: selMeas.id }); return; }
      if (h.t === "pscale" || h.t === "prot") { gest.current = Object.assign(base, { type: h.t }); return; }
    }

    if (tool === "axis") {
      const sp = snapPoint(w, { pts: snapPts(), free: e.shiftKey, img: true });
      if (axisPts && axisPts.length) { finishAxis(axisPts[0], sp); return; }
      setAxisPts([sp]); setCur(sp);
      gest.current = Object.assign(base, { type: "axisDrag", a: sp });
      return;
    }
    if (tool === "walk") {
      if (!walkPts) { const hw = hitWalk(w); if (hw) { setSelWalk(hw); setSel({ t: "roof", id: hw.roofId }); return; } }
      if (walkPts && dbl) { finishWalk(); return; }
      const sp = snapPoint(w, { pts: [], free: e.shiftKey, from: walkPts && walkPts.length ? walkPts[walkPts.length - 1] : null });
      setWalkPts((walkPts || []).concat([sp])); setSelWalk(null);
      return;
    }
    if (tool === "roof") {
      if (trace && trace.on) { runTrace(w, traceTol); return; }
      const sp = snapPoint(w, { pts: snapPts().concat(draw && draw.pts.length > 2 ? [draw.pts[0]] : []), free: e.shiftKey, img: true, segs: snapSegs(),
        from: draw && draw.pts.length ? draw.pts[draw.pts.length - 1] : null, refs: draw && draw.pts.length > 1 ? [Math.atan2(draw.pts[1].z - draw.pts[0].z, draw.pts[1].x - draw.pts[0].x)] : [] });
      if (rectDraw) {
        if (!draw) { gest.current = Object.assign(base, { type: "drawRect", a: sp }); return; }
        if (draw.pts.length === 1) { setDraw({ pts: [draw.pts[0], sp], typed: "" }); return; }
        makeRoof(rectFrom3(draw.pts[0], draw.pts[1], cur || sp), roofOpt.kind); setDraw(null); return;
      }
      if (!draw) { setDraw({ pts: [sp], typed: "" }); return; }
      const f = draw.pts[0];
      if (draw.pts.length >= 3 && (Math.hypot(toS(f.x, f.z).x - p.x, toS(f.x, f.z).y - p.y) < HIT || dbl)) { finishPoly(); return; }
      setDraw({ pts: draw.pts.concat([sp]), typed: "" });
      return;
    }
    if (tool === "meas") {
      const sp = snapPoint(w, { pts: snapPts(), free: e.shiftKey, from: measPts && measPts.length ? measPts[measPts.length - 1] : null });
      if (measPts && dbl) { finishMeas(); return; }
      setMeasPts((measPts || []).concat([sp]));
      return;
    }
    if (tool === "obs") { gest.current = Object.assign(base, { type: "obsRect" }); return; }
    if (tool === "area") { gest.current = Object.assign(base, { type: "areaRect" }); return; }
    if (tool === "bg") {
      if (calib) { const pts = calib.pts.length >= 2 ? [w] : calib.pts.concat([w]); setCalib({ pts, len: calib.len }); return; }
      const pb = photoBox();
      if (pb && p3InPoly(w.x, w.z, pb)) { gest.current = Object.assign(base, { type: "movePhoto", x0: +S.photoX || 0, z0: +S.photoZ || 0 }); return; }
      gest.current = Object.assign(base, { type: "pan", v0: viewRef.current });
      return;
    }
    if (tool === "panel") {
      const hb = hitBody(w), roof = hb && hb.t === "roof" ? (S.roofs || []).find((r) => r.id === hb.id) : null;
      const showSlots = roof && selRoof && roof.id === selRoof.id && selBlk != null;
      const q = roof ? (panelAt(roof, w, null) || (showSlots ? panelAt(roof, w, { slots: true, blk: selBlk }) : null)) : null;
      if (roof && (!sel || sel.id !== roof.id)) { setSel({ t: "roof", id: roof.id }); setSelVert(null); }
      if (q && !q.skip && !q.slot) {
        setSelBlk(q.blk);
        gest.current = Object.assign(base, { type: "blkPress", roofId: roof.id, q });
        return;
      }
      if (q) { gest.current = Object.assign(base, { type: "cellTap", roofId: roof.id, q }); return; }
      if (roof) { gest.current = Object.assign(base, { type: "marquee", roofId: roof.id }); return; }
      gest.current = Object.assign(base, { type: "pan", v0: viewRef.current, clear: true });
      return;
    }
    // เลือก/ย้าย
    const hb = hitBody(w);
    if (hb) {
      if (!sel || sel.id !== hb.id) { setSel(hb); setSelVert(null); setSelBlk(null); }
      else setSelVert(null);
      if (hb.t === "roof" && lockRoofs) { gest.current = Object.assign(base, { type: "pan", v0: viewRef.current }); return; }
      if (hb.t === "roof") {
        // หลังคาที่แบบเก่าจัดกลุ่มไว้ (grp) ลากผืนไหนก็ย้ายไปพร้อมกันทั้งกลุ่ม — เหมือนแบบเก่า
        const r0 = (S.roofs || []).find((r) => r.id === hb.id);
        const mem = (S.roofs || []).filter((r) => r.id === hb.id || (r0.grp && r.grp === r0.grp));
        const ids = {}; mem.forEach((r) => { ids[r.id] = { x: +r.x || 0, z: +r.z || 0 }; });
        const others = []; (S.roofs || []).forEach((r) => { if (!ids[r.id]) p3sFaces2D(r).forEach((fc) => fc.pts.forEach((q) => others.push(q))); });
        const mine = []; mem.forEach((r) => p3sRoofPts(r).forEach((q) => mine.push(q)));
        gest.current = Object.assign(base, { type: "moveRoof", roofId: hb.id, ids, others, mine });
        return;
      }
      if (hb.t === "obs") { const o0 = (S.obstacles || []).find((o) => o.id === hb.id); gest.current = Object.assign(base, { type: "moveObs", id: hb.id, o0 }); return; }
      if (hb.t === "meas") { const m0 = (S.measures || []).find((m) => m.id === hb.id); gest.current = Object.assign(base, { type: "moveMeas", id: hb.id, m0 }); return; }
    }
    gest.current = Object.assign(base, { type: "pan", v0: viewRef.current, clear: true });
  };

  const onMove = (e) => {
    if (!st || view3d) return;
    const p = localXY(e);
    if (ptrs.current.has(e.pointerId)) ptrs.current.set(e.pointerId, p);
    const G = gest.current;
    if (!G) {
      // เมาส์ลอย: ไฮไลต์ + ตัวชี้ตำแหน่งวาด
      if (e.pointerType === "mouse" || draw || measPts || axisPts || walkPts) {
        const w = toW(p);
        if (tool === "roof" && !(trace && trace.on)) {
          const fromP = draw && draw.pts.length ? draw.pts[draw.pts.length - 1] : null;
          if (edgeOn) needEdge(w);
          setCur(snapPoint(w, { pts: snapPts().concat(draw && draw.pts.length > 2 ? [draw.pts[0]] : []), free: e.shiftKey, from: fromP, img: true, segs: snapSegs(),
            refs: draw && draw.pts.length > 1 ? [Math.atan2(draw.pts[1].z - draw.pts[0].z, draw.pts[1].x - draw.pts[0].x)] : [] }));
        } else if (tool === "axis" && axisPts && axisPts.length === 1) {
          if (edgeOn) needEdge(w);
          setCur(snapPoint(w, { pts: snapPts(), free: e.shiftKey, img: true }));
        } else if (tool === "walk") {
          setCur(snapPoint(w, { pts: [], free: e.shiftKey, from: walkPts && walkPts.length ? walkPts[walkPts.length - 1] : null }));
        } else if (tool === "meas") {
          setCur(snapPoint(w, { pts: snapPts(), free: e.shiftKey, from: measPts && measPts.length ? measPts[measPts.length - 1] : null }));
        } else if (tool === "bg" && calib) setCur({ x: w.x, z: w.z });
        if (e.pointerType === "mouse") {
          const h = hitHandle(p);
          let hv = h ? "h:" + h.t + (h.i != null ? h.i : "") : null;
          if (!hv && (tool === "select" || tool === "panel")) { const b = hitBody(w); hv = b ? b.t + ":" + b.id : null; }
          if (hv !== hover) setHover(hv);
        }
      }
      return;
    }
    if (G.type === "pinch") {
      const vals = Array.from(ptrs.current.values()); if (vals.length < 2) return;
      const [a, b] = vals, d0 = Math.hypot(G.b0.x - G.a0.x, G.b0.y - G.a0.y) || 1, d1 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const m0 = { x: (G.a0.x + G.b0.x) / 2, y: (G.a0.y + G.b0.y) / 2 }, m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const w0 = toW(m0, G.v0), s = p3sClamp(G.v0.s * d1 / d0, 0.4, 400);
      setView(Object.assign({ s }, centerFor(w0, m1, s)));
      return;
    }
    const dpx = Math.hypot(p.x - G.p0.x, p.y - G.p0.y);
    if (!G.moved && dpx < THR) return;
    G.moved = true;
    if (G.type === "pan") {   // คลิกขวา/ปุ่มกลาง/Space/เครื่องมือเลื่อน ไม่มี w0 — จัดการก่อนคิดระยะในโลก
      const v0 = G.v0, k = scrVec((p.x - G.p0.x) / v0.s, (p.y - G.p0.y) / v0.s); setView({ s: v0.s, cx: v0.cx - k.x, cz: v0.cz - k.z });
      return;
    }
    const w = toW(p), dx = w.x - G.w0.x, dz = w.z - G.w0.z, S0 = G.s0;
    const free = e.shiftKey;
    const setRoof = (id, fn) => live(Object.assign({}, stRef.current, { roofs: stRef.current.roofs.map((r) => (r.id === id ? Object.assign({}, r, fn(r)) : r)) }));
    switch (G.type) {
      case "moveRoof": {
        ensurePushed(G);
        let ddx = dx, ddz = dz;
        if (!free) {   // ดูดมุมผืนที่ลากเข้ากับมุมผืนข้าง ๆ
          const lim = SNAP_PX / viewRef.current.s; let bd = lim, fix = null;
          G.mine.forEach((m) => G.others.forEach((o) => {
            const d = Math.hypot(m.x + dx - o.x, m.z + dz - o.z); if (d < bd) { bd = d; fix = { x: o.x - m.x, z: o.z - m.z }; }
          }));
          if (fix) { ddx = fix.x; ddz = fix.z; }
        }
        live(Object.assign({}, stRef.current, { roofs: stRef.current.roofs.map((r) => {
          const o = G.ids[r.id]; return o ? Object.assign({}, r, { x: p3sR(o.x + ddx), z: p3sR(o.z + ddz) }) : r;
        }) }));
        return;
      }
      case "mid":
      case "vert": {
        ensurePushed(G);
        if (G.type === "mid" && !G.inserted) {
          const i = G.i;
          setRoof(G.roofId, (r) => {
            const pts = r.pts.slice(), ph = p3PhOf(r).slice(), a = pts[i], b = pts[(i + 1) % pts.length];
            pts.splice(i + 1, 0, { x: p3sR((a.x + b.x) / 2), z: p3sR((a.z + b.z) / 2) });
            ph.splice(i + 1, 0, p3sR((ph[i] + ph[(i + 1) % ph.length]) / 2));
            return { pts, ph };
          });
          G.inserted = true; G.i = i + 1; G.type = "vert"; setSelVert(G.i);
        }
        const r = stRef.current.roofs.find((x) => x.id === G.roofId); if (!r) return;
        const n = r.pts.length, prev = r.pts[(G.i - 1 + n) % n], next = r.pts[(G.i + 1) % n];
        const ox = +r.x || 0, oz = +r.z || 0;
        const refs = [Math.atan2(next.z - prev.z, next.x - prev.x)];
        let sp = snapPoint(w, { pts: snapPts(r.id), free, from: { x: ox + prev.x, z: oz + prev.z }, refs });
        if (!sp.snap && !sp.guide && !free) sp = snapPoint(w, { pts: [], from: { x: ox + next.x, z: oz + next.z }, refs });
        setCur(sp.guide || sp.snap ? sp : null);
        setRoof(G.roofId, (rr) => { const pts = rr.pts.slice(); pts[G.i] = { x: p3sR(sp.x - ox), z: p3sR(sp.z - oz) }; return { pts }; });
        return;
      }
      case "rotRoof": {
        ensurePushed(G);
        const c = G.c, a0 = Math.atan2(G.w0.z - c.z, G.w0.x - c.x), a1 = Math.atan2(w.z - c.z, w.x - c.x);
        let dA = a1 - a0;
        const r0 = G.r0;
        // ดูดให้ขอบยาวขนานแกนผัง/มุม 1° (Shift = อิสระ)
        if (!free) {
          const baseAng = r0.kind === "poly" ? p3sLongEdgeAng(p3sFaces2D(r0)[0].pts) : ((+r0.az || 180) - 180) * P3_DEG;
          const tA = baseAng + dA, q = axisRad + Math.round((tA - axisRad) / (Math.PI / 2)) * (Math.PI / 2);
          if (Math.abs(tA - q) < 2.5 * P3_DEG) dA = q - baseAng;
          else dA = Math.round(dA / P3_DEG) * P3_DEG;
        }
        const pos = p3sRot((+r0.x || 0) - c.x, (+r0.z || 0) - c.z, dA);
        const patch = { x: p3sR(c.x + pos.x), z: p3sR(c.z + pos.z) };
        if (r0.kind === "poly") {
          patch.pts = r0.pts.map((q2) => { const k = p3sRot(+q2.x || 0, +q2.z || 0, dA); return { x: p3sR(k.x), z: p3sR(k.z) }; });
          // หลังคาราบ: แกนผิวไม่หมุนตามผืน → หมุนชุดแผงตามไปด้วย แผงจะได้ขนานขอบเหมือนเดิม
          const pl = p3PolyPlane(r0);
          if (pl && pl.tiltCos > 0.999) {
            const fn = p3sSurfFn(r0, null), J = fn ? p3sJac(fn, 0, 0) : null, sg = J && (J.a * J.d - J.b * J.c) < 0 ? -1 : 1;
            patch.blocks = p3sBlkStore(r0).map((b) => Object.assign({}, b, { rot: p3sR((+b.rot || 0) + sg * dA / P3_DEG, 10) }));
          }
        } else patch.az = p3sR((((+r0.az || 180) + dA / P3_DEG) % 360 + 360) % 360, 10);
        if (Array.isArray(r0.walks) && r0.walks.length) patch.walks = r0.walks.map((wk) => Object.assign({}, wk, { pts: (wk.pts || []).map((q2) => { const k = p3sRot(+q2.x || 0, +q2.z || 0, dA); return { x: p3sR(k.x), z: p3sR(k.z) }; }) }));
        setRoof(G.roofId, () => patch);
        return;
      }
      case "side": {
        ensurePushed(G);
        const r0 = G.r0, rY = -(((+r0.az || 180) - 180) * P3_DEG), e0 = G.ax === "x" ? p3sRY(1, 0, rY) : p3sRY(0, 1, rY);
        const isG = r0.kind === "gable", key = G.ax === "x" ? (isG ? "ridge" : "w") : (isG ? "span" : "d");
        const h = (+r0[key] || 8) / 2, ex = e0.x * G.sg, ez = e0.z * G.sg;
        const O = { x: (+r0.x || 0) - ex * h, z: (+r0.z || 0) - ez * h };   // ขอบฝั่งตรงข้ามอยู่กับที่
        let L = (w.x - O.x) * ex + (w.z - O.z) * ez;
        if (!free) {   // ดูดขอบภาพตามแนวที่ลาก
          const EF = edgeOn ? edgeRef.current : null, q = { x: O.x + ex * L, z: O.z + ez * L };
          const sn = EF ? p3sEdgeSnap(EF, q, Math.max(SNAP_PX * 1.5 / viewRef.current.s, 0.25), { x: ex, z: ez }) : null;
          if (sn) L = (sn.x - O.x) * ex + (sn.z - O.z) * ez;
          if (edgeOn) needEdge(q);
        }
        L = Math.max(1, L);
        const patch = { x: p3sR(O.x + ex * L / 2), z: p3sR(O.z + ez * L / 2) }; patch[key] = p3sR(L);
        setRoof(G.roofId, () => patch);
        return;
      }
      case "axisDrag": {
        setCur(snapPoint(w, { pts: snapPts(), free, img: true }));
        return;
      }
      case "moveObs": {
        ensurePushed(G);
        live(Object.assign({}, stRef.current, { obstacles: stRef.current.obstacles.map((o) => (o.id === G.id ? Object.assign({}, o, { x: p3sR((+G.o0.x || 0) + dx), z: p3sR((+G.o0.z || 0) + dz) }) : o)) }));
        return;
      }
      case "ocorner": case "orad": case "orot": {
        ensurePushed(G);
        const o0 = G.o0, lx = w.x - (+o0.x || 0), lz = w.z - (+o0.z || 0);
        let patch;
        if (G.type === "orad") { const R = Math.max(0.3, Math.hypot(lx, lz)); patch = { w: p3sR(R * 2, 10), d: p3sR(R * 2, 10) }; }
        else if (G.type === "ocorner") { const l = p3sRot(lx, lz, -(+o0.rot || 0) * P3_DEG); patch = { w: p3sR(Math.max(0.3, Math.abs(l.x) * 2), 10), d: p3sR(Math.max(0.3, Math.abs(l.z) * 2), 10) }; }
        else { let a = Math.atan2(lz, lx) / P3_DEG + 90; if (!free) a = Math.round(a / 5) * 5; patch = { rot: p3sR(((a % 360) + 360) % 360, 10) }; }
        live(Object.assign({}, stRef.current, { obstacles: stRef.current.obstacles.map((o) => (o.id === G.id ? Object.assign({}, o, patch) : o)) }));
        return;
      }
      case "moveMeas": {
        ensurePushed(G);
        live(Object.assign({}, stRef.current, { measures: stRef.current.measures.map((m) => (m.id === G.id ? Object.assign({}, m, { pts: G.m0.pts.map((q) => ({ x: p3sR((+q.x || 0) + dx), z: p3sR((+q.z || 0) + dz) })) }) : m)) }));
        return;
      }
      case "mpt": {
        ensurePushed(G);
        const sp = snapPoint(w, { pts: snapPts(), free });
        live(Object.assign({}, stRef.current, { measures: stRef.current.measures.map((m) => {
          if (m.id !== G.id) return m; const pts = m.pts.slice(); pts[G.i] = { x: sp.x, z: sp.z }; return Object.assign({}, m, { pts });
        }) }));
        return;
      }
      case "movePhoto": {
        ensurePushed(G);
        live(Object.assign({}, stRef.current, { photoX: p3sR(G.x0 + dx), photoZ: p3sR(G.z0 + dz) }));
        return;
      }
      case "pscale": {
        ensurePushed(G);
        const c = { x: +S0.photoX || 0, z: +S0.photoZ || 0 };
        const f = Math.hypot(w.x - c.x, w.z - c.z) / (Math.hypot(G.w0.x - c.x, G.w0.z - c.z) || 1);
        live(Object.assign({}, stRef.current, { photoW: p3sR(p3sClamp((+S0.photoW || 30) * f, 2, 2000), 10) }));
        return;
      }
      case "prot": {
        ensurePushed(G);
        const c = { x: +S0.photoX || 0, z: +S0.photoZ || 0 };
        const dA = (Math.atan2(w.z - c.z, w.x - c.x) - Math.atan2(G.w0.z - c.z, G.w0.x - c.x)) / P3_DEG;
        let r = (+S0.photoRot || 0) + dA; r = free ? p3sR(r, 10) : p3sR(r, 2);
        live(Object.assign({}, stRef.current, { photoRot: ((r % 360) + 360) % 360 }));
        return;
      }
      case "blkPress":
      case "moveBlk": {
        if (G.type === "blkPress") {
          const r0 = (S0.roofs || []).find((r) => r.id === G.roofId); if (!r0) return;
          let pan; try { pan = p3Panels(r0); } catch (er) { return; }
          const rect = (pan.rects || []).find((x) => x.blk === G.q.blk && (x.side || null) === (G.q.side || null)) || (pan.rects || []).find((x) => x.blk === G.q.blk);
          const fn = p3sSurfFn(r0, G.q.side);
          if (!rect || !fn) { G.type = "noop"; return; }
          const b0 = p3sBlkStore(r0)[G.q.blk] || {};
          Object.assign(G, { type: "moveBlk", J: p3sJac(fn, rect.cu, rect.cv), du0: +b0.du || 0, dv0: +b0.dv || 0 });
        }
        ensurePushed(G);
        const d = p3sInvJ(G.J, dx, dz);
        setRoof(G.roofId, (r) => {
          const bs = p3sBlkStore(r); if (!bs[G.q.blk]) return {};
          bs[G.q.blk] = Object.assign({}, bs[G.q.blk], { du: p3sR(G.du0 + d.du), dv: p3sR(G.dv0 + d.dv) });
          return { blocks: bs };
        });
        return;
      }
      case "marquee": case "cellTap": {
        if (G.type === "cellTap") G.type = "marquee";
        setMarq({ x0: G.p0.x, y0: G.p0.y, x1: p.x, y1: p.y });
        return;
      }
      case "drawRect": case "obsRect": case "areaRect": {
        setMarq({ x0: G.p0.x, y0: G.p0.y, x1: p.x, y1: p.y, world: true });
        return;
      }
      default:
    }
  };

  const onUp = (e) => {
    ptrs.current.delete(e.pointerId);
    try { stageRef.current.releasePointerCapture(e.pointerId); } catch (er) {}
    const G = gest.current;
    if (!G) return;
    if (G.type === "pinch") { if (ptrs.current.size < 2) gest.current = null; return; }
    gest.current = null;
    const p = localXY(e), w = toW(p), S = stRef.current;
    setCur((c) => (tool === "roof" || tool === "meas" || tool === "walk" || tool === "axis" ? c : null));
    if (G.type === "pan") { if (!G.moved && G.clear) { setSel(null); setSelVert(null); setSelBlk(null); } return; }
    if (G.type === "blkPress" && !G.moved) { const r = S.roofs.find((x) => x.id === G.roofId); if (r) toggleCell(r, G.q.key, false); return; }
    if (G.type === "cellTap" && !G.moved) { const r = S.roofs.find((x) => x.id === G.roofId); if (r) toggleCell(r, G.q.key, !!G.q.slot); return; }
    if (G.type === "marquee") {
      setMarq(null);
      if (!G.moved) { setSelBlk(null); return; }
      const r = S.roofs.find((x) => x.id === G.roofId); if (!r) return;
      const x0 = Math.min(G.p0.x, p.x), x1 = Math.max(G.p0.x, p.x), y0 = Math.min(G.p0.y, p.y), y1 = Math.max(G.p0.y, p.y);
      const inside = p3sQuads(r).filter((q) => { const c = toS(q.cx, q.cz); return c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1; });
      if (!inside.length) return;
      const anyOn = inside.some((q) => !q.skip);
      setCells(r, inside.map((q) => q.key), anyOn);
      return;
    }
    if (G.type === "axisDrag") {
      if (G.moved) finishAxis(G.a, snapPoint(w, { pts: snapPts(), free: e.shiftKey, img: true }));
      return;
    }
    if (G.type === "areaRect") {
      setMarq(null);
      if (!G.moved) return;
      const A4 = [toW({ x: G.p0.x, y: G.p0.y }), toW({ x: p.x, y: G.p0.y }), toW(p), toW({ x: G.p0.x, y: p.y })].map((q) => ({ x: p3sR(q.x), z: p3sR(q.z) }));
      if (p3Area(A4) < 4) return;
      commit({ p3sArea: { pts: A4 } });
      zoomArea({ pts: A4 });
      if (wiz) { markSeen(1); setWizStep(2); setTool("axis"); }
      return;
    }
    if (G.type === "drawRect") {
      setMarq(null);
      if (!G.moved) { setDraw({ pts: [G.a], typed: "" }); return; }
      const b = snapPoint(w, { pts: snapPts(), free: e.shiftKey, img: true, segs: snapSegs() });
      const A = G.a, fa = frameOf(A), fb = frameOf(b);
      const back = (x, z) => { const k = scrVec(x, z); return { x: p3sR(k.x), z: p3sR(k.z) }; };
      makeRoof([{ x: A.x, z: A.z }, back(fb.x, fa.z), { x: b.x, z: b.z }, back(fa.x, fb.z)], roofOpt.kind);
      return;
    }
    if (G.type === "obsRect") {
      setMarq(null);
      let o;
      if (!G.moved) o = { id: p3Id("o"), kind: "tree", x: p3sR(w.x), z: p3sR(w.z), w: 3, d: 3, h: 5 };
      else {
        const a = G.w0, fa = frameOf(a), fb = frameOf(w);
        o = { id: p3Id("o"), kind: "box", x: p3sR((a.x + w.x) / 2), z: p3sR((a.z + w.z) / 2), w: p3sR(Math.max(0.3, Math.abs(fb.x - fa.x)), 10), d: p3sR(Math.max(0.3, Math.abs(fb.z - fa.z)), 10), h: 1.5,
          rot: p3sR(((rotRef.current / P3_DEG) % 360 + 360) % 360, 10) };
      }
      commit((s) => Object.assign({}, s, { obstacles: (s.obstacles || []).concat([o]) }));
      setSel({ t: "obs", id: o.id }); setToolRaw("select");
      return;
    }
    if (G.type === "vert" || G.type === "mid" || G.type === "side") {
      setCur(null);
      const r = (G.type === "vert" || G.type === "mid") && S.roofs.find((x) => x.id === G.roofId);
      if (r && r.p3sFacet) weldLive([r.id]);
      return;
    }
  };
  const onCancel = (e) => { ptrs.current.delete(e.pointerId); if (gest.current && gest.current.type !== "pinch") cancelGesture(); else gest.current = null; setMarq(null); };

  /* ── สรุปตัวเลข ── */
  const total = st ? p3CountAll(st) : 0;
  const kwp = Math.round(total * ((st && +st.wp) || 650) / 10) / 100;
  const goal = job && +job.panels ? +job.panels : 0;

  /* hook ทุกตัวต้องอยู่ก่อน return ตอนกำลังโหลด */
  const fileRef = React.useRef(null);
  /* กวาดดูเงาทั้งวัน: เดิน 6:00→18:30 ใน ~15 วินาที แล้ววนใหม่ */
  React.useEffect(() => {
    if (sunHour == null) return;
    let raf, last = performance.now();
    const step = (t) => {
      const dt = (t - last) / 1000; last = t;
      setSunHour((h) => { if (h == null) return null; const n = h + dt * (12.5 / 15); return n > 18.5 ? 6 : n; });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [sunHour != null]); // eslint-disable-line
  if (!st) {
    return (
      <div className="p3s" style={{ position: "fixed", inset: 0, zIndex: 120, background: "var(--bg)", display: "grid", placeItems: "center" }}>
        <style>{P3S_CSS}</style>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>กำลังโหลดแบบ…</div>
      </div>
    );
  }

  /* ============== วาดผัง (SVG) ============== */
  const V = view, Sz = size;
  const rotDeg = rotRef.current / P3_DEG;
  const tf = "translate(" + (Sz.w / 2) + " " + (Sz.h / 2) + ") rotate(" + (-rotDeg) + ") scale(" + V.s + ") translate(" + (-V.cx) + " " + (-V.cz) + ")";
  /* สีผืนตามทิศที่หัน — ใต้ = เหลืองแดด · ตะวันออก/ตก = ส้มอ่อน · เหนือ = ฟ้า · ราบ = เทา */
  const faceTone = (asp, on) => {
    if (!asp || asp.az == null) return on ? "rgba(22,163,74,.16)" : "rgba(226,232,240,.42)";
    const d = Math.abs(((asp.az - 180 + 540) % 360) - 180);
    const c = d < 50 ? "250,204,21" : d < 125 ? "251,146,60" : "96,165,250";
    return "rgba(" + c + "," + (on ? 0.42 : 0.3) + ")";
  };
  const ptsStr = (pts) => pts.map((p) => p.x + "," + p.z).join(" ");
  const sPts = (pts) => pts.map((p) => { const s = toS(p.x, p.z); return s.x + "," + s.y; }).join(" ");
  const NS = { vectorEffect: "non-scaling-stroke" };
  const showGhost = tool === "panel";
  const imgFilter = imgFx.b !== 1 || imgFx.c !== 1 ? { filter: "brightness(" + imgFx.b + ") contrast(" + imgFx.c + ")" } : undefined;
  const fmtM = (v) => (v >= 100 ? Math.round(v) : p3sR(v, 100)) + " ม.";

  const roofEls = roofs.map((r) => {
    const faces = p3sFaces2D(r), isSel = selRoof && selRoof.id === r.id, isHov = hover === "roof:" + r.id;
    return (
      <g key={r.id}>
        {faces.map((f, i) => (
          <polygon key={i} points={ptsStr(f.pts)} fill={faceTone(f.asp, isSel)}
            stroke={isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#334155"} strokeWidth={isSel ? 2.4 : isHov ? 2 : 1.3} style={NS} strokeLinejoin="round" />
        ))}
        {r.kind === "poly" && faces[0] && faces[0].asp && faces[0].asp.az != null && (() => {
          // ขอบชายคา (ต่ำสุด) ของผืนเอียง — เส้นส้มหนา
          const fp = faces[0].pts, ph = p3PhOf(r); let lo = r.p3sLow != null ? +r.p3sLow : 0;
          if (r.p3sLow == null) { let bv = 1e9; fp.forEach((_, i) => { const v = ph[i] + ph[(i + 1) % fp.length]; if (v < bv) { bv = v; lo = i; } }); }
          const a = fp[lo % fp.length], b = fp[(lo + 1) % fp.length];
          return a && b ? <line x1={a.x} y1={a.z} x2={b.x} y2={b.z} stroke="#ea580c" strokeWidth={isSel ? 4.5 : 3} strokeLinecap="round" style={NS} /> : null;
        })()}
        {(r.walks || []).map((wk) => {
          const P = (wk.pts || []).map((q) => ({ x: (+r.x || 0) + (+q.x || 0), z: (+r.z || 0) + (+q.z || 0) }));
          const on = selWalk && selWalk.id === wk.id;
          return (
            <g key={wk.id}>
              <polyline points={ptsStr(P)} fill="none" stroke={on ? "rgba(234,88,12,.55)" : "rgba(250,204,21,.55)"} strokeWidth={+wk.w || 0.6} strokeLinecap="butt" strokeLinejoin="round" />
              <polyline points={ptsStr(P)} fill="none" stroke={on ? "#c2410c" : "#a16207"} strokeWidth={1.4} strokeDasharray="6 5" style={NS} />
            </g>);
        })}
      </g>
    );
  });
  const panelEls = roofs.map((r) => {
    const isSel = selRoof && selRoof.id === r.id;
    const P = p3sQuadPaths(r);
    const slots = isSel && tool === "panel" && selBlk != null ? p3sQuads(r, { slots: true, blk: selBlk }).filter((q) => q.slot) : [];
    return (
      <g key={r.id}>
        {showGhost && isSel && P.off && <path d={P.off} fill="rgba(255,255,255,.18)" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" style={NS} />}
        {P.on.map((d, bi) => d && (
          <path key={bi} d={d} fill={isSel && tool === "panel" && selBlk === bi ? "#1e4fb8" : "#17357a"} stroke="rgba(219,234,254,.75)" strokeWidth={0.7} style={NS} />
        ))}
        {slots.map((q) => <polygon key={"s" + q.key} points={ptsStr(q.pts)} fill="rgba(22,163,74,.10)" stroke="#16a34a" strokeWidth={1} strokeDasharray="2 3" style={NS} />)}
      </g>
    );
  });
  /* กลุ่มแผง (แบ่งด้วยทางเดิน gc/gr/gg) — เส้นประรอบกลุ่ม + ป้ายจำนวน */
  const groupInfo = (r) => {
    let pan; try { pan = p3Panels(r); } catch (e) { return []; }
    const bl = pan.blocks || [];
    if (!bl.some((b) => (b.gc > 0 || b.gr > 0) && b.gg > 0)) return [];
    const G = {};
    p3sQuads(r).forEach((q) => {
      if (q.skip || q.slot) return;
      const b = bl[q.blk] || {}, m = /(-?\d+)_(-?\d+)$/.exec(q.key); if (!m) return;
      const gk = q.blk + "|" + (q.side || "") + "|" + (b.gr > 0 && b.gg > 0 ? Math.floor(+m[1] / b.gr) : 0) + "|" + (b.gc > 0 && b.gg > 0 ? Math.floor(+m[2] / b.gc) : 0);
      (G[gk] = G[gk] || []).push(q);
    });
    return Object.keys(G).map((k) => { const pts = []; G[k].forEach((q) => q.pts.forEach((pp) => pts.push(pp))); return { k, n: G[k].length, hull: p3sHull(pts) }; });
  };
  const groupEls = [], groupLbls = [];
  roofs.forEach((r) => {
    if (!(tool === "panel" || tool === "walk" || (selRoof && selRoof.id === r.id))) return;
    groupInfo(r).forEach((g, i) => {
      groupEls.push(<polygon key={r.id + g.k} points={ptsStr(g.hull)} fill="none" stroke="#f59e0b" strokeWidth={1.4} strokeDasharray="4 3" style={NS} />);
      if (V.s >= 9) {
        const c = p3sCentroid(g.hull), sc = toS(c.x, c.z);
        groupLbls.push(<g key={"gl" + r.id + g.k} transform={"translate(" + sc.x + " " + sc.y + ")"} style={{ pointerEvents: "none" }}>
          <text textAnchor="middle" y={4} fontSize={10.5} fontWeight={800} fill="#78350f" stroke="#fff" strokeWidth={3} paintOrder="stroke">กลุ่ม {i + 1} · {g.n}</text></g>);
      }
    });
  });
  /* กรอบชุดแผงที่เลือก */
  let blkFrame = null;
  if (tool === "panel" && selRoof && selBlk != null) {
    try {
      const pan = p3Panels(selRoof);
      blkFrame = (pan.rects || []).filter((x) => x.blk === selBlk).map((rc, i) => {
        const fn = p3sSurfFn(selRoof, rc.side); if (!fn) return null;
        const cs = Math.cos(rc.rot * P3_DEG), sn = Math.sin(rc.rot * P3_DEG);
        const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => { const u = a * rc.w / 2 + 0.06 * a, v = b * rc.h / 2 + 0.06 * b; return fn(rc.cu + u * cs - v * sn, rc.cv + u * sn + v * cs); });
        return <polygon key={i} points={ptsStr(pts)} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" style={NS} />;
      });
    } catch (er) { blkFrame = null; }
  }
  const obsEls = (st.obstacles || []).map((o) => {
    const isSel = selObs && selObs.id === o.id, isHov = hover === "obs:" + o.id;
    if (o.kind === "tree") return <circle key={o.id} cx={+o.x || 0} cy={+o.z || 0} r={Math.max(+o.w || 1, 0.6) / 2} fill="rgba(34,120,60,.42)" stroke={isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#166534"} strokeWidth={isSel ? 2.4 : 1.4} style={NS} />;
    return <rect key={o.id} x={(+o.x || 0) - (+o.w || 1) / 2} y={(+o.z || 0) - (+o.d || 1) / 2} width={+o.w || 1} height={+o.d || 1}
      transform={"rotate(" + (+o.rot || 0) + " " + (+o.x || 0) + " " + (+o.z || 0) + ")"}
      fill="rgba(100,116,139,.5)" stroke={isSel ? "#16a34a" : isHov ? "#0ea5e9" : "#334155"} strokeWidth={isSel ? 2.4 : 1.4} style={NS} />;
  });
  const measEls = (st.measures || []).map((m) => {
    const K = p3MeasKind(m.kind), col = "#" + K.c.toString(16).padStart(6, "0"), isSel = selMeas && selMeas.id === m.id;
    return <polyline key={m.id} points={ptsStr(m.pts || [])} fill="none" stroke={col} strokeWidth={isSel ? 4 : 2.6} strokeLinecap="round" strokeLinejoin="round" style={NS} />;
  });

  /* ป้ายบนจอ (ไม่ย่อขยายตามซูม) */
  const labels = groupLbls.slice();
  const lbl = (key, x, y, txt, tone) => labels.push(
    <g key={key} transform={"translate(" + x + " " + y + ")"} style={{ pointerEvents: "none" }}>
      <rect x={-(String(txt).length * 3.4 + 7)} y={-10} width={String(txt).length * 6.8 + 14} height={20} rx={10}
        fill={tone === "pri" ? "#16a34a" : tone === "warn" ? "#f59e0b" : "rgba(15,23,42,.82)"} />
      <text textAnchor="middle" y={4.5} fontSize={11.5} fontWeight={700} fill="#fff">{txt}</text>
    </g>);
  const edgeLabels = (pts, kp, closed) => {
    for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b.x - a.x, b.z - a.z);
      const sa = toS(a.x, a.z), sb = toS(b.x, b.z);
      if (Math.hypot(sb.x - sa.x, sb.y - sa.y) < 54) continue;
      lbl(kp + i, (sa.x + sb.x) / 2, (sa.y + sb.y) / 2, fmtM(L));
    }
  };
  if (selRoof && !view3d && tool !== "panel") {
    const f = p3sFaces2D(selRoof);
    if (selRoof.kind === "poly" && f[0]) edgeLabels(f[0].pts, "re", true);
    else edgeLabels(p3sOutline(selRoof), "re", true);
  }
  /* ลูกศรทางลาด (ชี้ลงหาชายคา) ทุกผืนเอียง + ป้ายทิศ/ความชันของผืนที่เลือก */
  if (!view3d && V.s >= 4) roofs.forEach((r) => {
    const isSel = selRoof && selRoof.id === r.id;
    p3sFaces2D(r).forEach((f, i) => {
      if (!f.asp || f.asp.az == null) return;
      const c = p3sCentroid(f.pts), sc = toS(c.x, c.z);
      const L0 = Math.hypot(f.asp.dx, f.asp.dz) || 1, d = p3sRot(f.asp.dx / L0, f.asp.dz / L0, -rotRef.current);
      const A = 13, x2 = sc.x + d.x * A, y2 = sc.y + d.z * A, x1 = sc.x - d.x * A, y1 = sc.y - d.z * A;
      const nx = -d.z, ny = d.x;
      labels.push(<g key={"ar" + r.id + i} style={{ pointerEvents: "none" }} opacity={isSel ? 1 : 0.75}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        <path d={"M" + (x2 + nx * 5 - d.x * 6) + " " + (y2 + ny * 5 - d.z * 6) + "L" + x2 + " " + y2 + "L" + (x2 - nx * 5 - d.x * 6) + " " + (y2 - ny * 5 - d.z * 6)} fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9a3412" strokeWidth={1.8} strokeLinecap="round" />
        <path d={"M" + (x2 + nx * 5 - d.x * 6) + " " + (y2 + ny * 5 - d.z * 6) + "L" + x2 + " " + y2 + "L" + (x2 - nx * 5 - d.x * 6) + " " + (y2 - ny * 5 - d.z * 6)} fill="none" stroke="#9a3412" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </g>);
      if (isSel && tool !== "panel") lbl("fa" + i, sc.x, sc.y + 24, (f.side ? f.side + " · " : "") + "หัน" + p3sCompass(f.asp.az) + " " + Math.round(f.asp.pitch) + "°");
    });
  });
  roofs.forEach((r) => {
    if (V.s < 6) return;
    const c = p3sRoofCenter(r), s = toS(c.x, c.z), n = p3sCount(r);
    labels.push(
      <g key={"rn" + r.id} transform={"translate(" + s.x + " " + s.y + ")"} style={{ pointerEvents: "none" }}>
        <text textAnchor="middle" y={-2} fontSize={12} fontWeight={800} fill="#0f172a" stroke="#fff" strokeWidth={3.5} paintOrder="stroke">{r.name || "หลังคา"}</text>
        {n > 0 && <text textAnchor="middle" y={13} fontSize={11} fontWeight={700} fill="#1e3a8a" stroke="#fff" strokeWidth={3} paintOrder="stroke">{n} แผง</text>}
      </g>);
  });
  (st.measures || []).forEach((m) => {
    const pts = m.pts || []; if (pts.length < 2) return;
    const mid = pts[Math.floor((pts.length - 1) / 2)], nx = pts[Math.floor((pts.length - 1) / 2) + 1];
    const s = toS((mid.x + nx.x) / 2, (mid.z + nx.z) / 2);
    lbl("ml" + m.id, s.x, s.y - 14, (m.name ? m.name + " · " : "") + fmtM(p3MeasLen(m)), selMeas && selMeas.id === m.id ? "pri" : null);
  });

  /* ภาพตัวอย่างตอนวาด */
  const preview = [];
  if (tool === "roof" && draw && !view3d) {
    const pts = draw.pts, c = cur;
    if (rectDraw) {
      if (pts.length === 1 && c) { preview.push(<polyline key="r1" points={sPts([pts[0], c])} fill="none" stroke="#16a34a" strokeWidth={2.4} />); edgeLabels([pts[0], c], "pe", false); }
      if (pts.length === 2 && c) { const R4 = rectFrom3(pts[0], pts[1], c); preview.push(<polygon key="r2" points={sPts(R4)} fill="rgba(22,163,74,.14)" stroke="#16a34a" strokeWidth={2.4} />); edgeLabels(R4, "pe", true); }
    } else {
      const all = c ? pts.concat([c]) : pts;
      preview.push(<polyline key="pl" points={sPts(all)} fill={all.length > 2 ? "rgba(22,163,74,.12)" : "none"} stroke="#16a34a" strokeWidth={2.4} strokeLinejoin="round" />);
      edgeLabels(all, "pe", false);
    }
    pts.forEach((p, i) => { const s = toS(p.x, p.z); preview.push(<circle key={"pp" + i} cx={s.x} cy={s.y} r={i === 0 && pts.length > 2 ? HR + 3 : HR - 1} fill="#fff" stroke="#16a34a" strokeWidth={2.4} />); });
    if (draw.typed && c) { const s = toS(c.x, c.z); lbl("typed", s.x + 34, s.y - 22, draw.typed + " ม. ↵", "warn"); }
  }
  if (tool === "axis" && axisPts && !view3d) {
    const a = axisPts[0], b = cur || a, sa = toS(a.x, a.z), sb = toS(b.x, b.z);
    const dx = sb.x - sa.x, dy = sb.y - sa.y, L = Math.hypot(dx, dy) || 1, E = 5000;
    preview.push(<line key="axx" x1={sa.x - dx / L * E} y1={sa.y - dy / L * E} x2={sa.x + dx / L * E} y2={sa.y + dy / L * E} stroke="#d946ef" strokeWidth={1.2} strokeDasharray="8 6" />);
    preview.push(<line key="axl" x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y} stroke="#d946ef" strokeWidth={3} strokeLinecap="round" />);
    [sa, sb].forEach((q, i) => preview.push(<circle key={"axp" + i} cx={q.x} cy={q.y} r={HR - 1} fill="#fff" stroke="#d946ef" strokeWidth={2.4} />));
    if (L > 30) lbl("axd", (sa.x + sb.x) / 2, (sa.y + sb.y) / 2 - 18, p3sNormAxis(Math.atan2(b.z - a.z, b.x - a.x) / P3_DEG) + "°", "warn");
  }
  if (tool === "walk" && walkPts && !view3d) {
    const all = cur ? walkPts.concat([cur]) : walkPts;
    preview.push(<polyline key="wkw" points={sPts(all)} fill="none" stroke="rgba(250,204,21,.6)" strokeWidth={Math.max(3, walkW * V.s)} strokeLinejoin="round" />);
    preview.push(<polyline key="wkl" points={sPts(all)} fill="none" stroke="#a16207" strokeWidth={1.6} strokeDasharray="6 5" />);
    walkPts.forEach((q, i) => { const sq = toS(q.x, q.z); preview.push(<circle key={"wkp" + i} cx={sq.x} cy={sq.y} r={HR - 2} fill="#fff" stroke="#a16207" strokeWidth={2.2} />); });
  }
  if (eavePick && selRoof && selRoof.kind === "poly" && !view3d) {
    const fp = p3sFaces2D(selRoof)[0].pts;
    fp.forEach((a, i) => { const b = fp[(i + 1) % fp.length], sa = toS(a.x, a.z), sb = toS(b.x, b.z);
      preview.push(<line key={"ep" + i} x1={sa.x} y1={sa.y} x2={sb.x} y2={sb.y} stroke="#ea580c" strokeWidth={7} strokeOpacity={0.35} strokeLinecap="round" />); });
  }
  if (tool === "meas" && measPts && !view3d) {
    const all = cur ? measPts.concat([cur]) : measPts;
    preview.push(<polyline key="mp" points={sPts(all)} fill="none" stroke="#f97316" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />);
    measPts.forEach((p, i) => { const s = toS(p.x, p.z); preview.push(<circle key={"mpp" + i} cx={s.x} cy={s.y} r={HR - 2} fill="#fff" stroke="#f97316" strokeWidth={2.4} />); });
    const tot = p3MeasLen({ pts: all });
    if (cur) { const s = toS(cur.x, cur.z); lbl("mt", s.x + 40, s.y - 20, "รวม " + fmtM(tot), "warn"); }
  }
  if ((tool === "roof" || tool === "meas" || tool === "walk" || tool === "axis" || (gest.current && (gest.current.type === "vert" || gest.current.type === "side"))) && cur && !view3d) {
    const s = toS(cur.x, cur.z);
    if (cur.guide) {
      const F = toS(cur.guide.from.x, cur.guide.from.z), a = cur.guide.ang, Lp = 4000;
      preview.push(<line key="gd" x1={F.x - Math.cos(a) * Lp} y1={F.y - Math.sin(a) * Lp} x2={F.x + Math.cos(a) * Lp} y2={F.y + Math.sin(a) * Lp} stroke="#d946ef" strokeWidth={1.2} strokeDasharray="5 5" />);
    }
    if (cur.snap) preview.push(<circle key="sn" cx={s.x} cy={s.y} r={HR + 5} fill="none" stroke="#d946ef" strokeWidth={2.4} />);
    if (cur.edge) preview.push(<rect key="se" x={s.x - HR - 3} y={s.y - HR - 3} width={2 * HR + 6} height={2 * HR + 6} rx={3} fill="none" stroke="#06b6d4" strokeWidth={2.4} transform={"rotate(45 " + s.x + " " + s.y + ")"} />);
    if (tool !== "select") preview.push(<g key="cx" style={{ pointerEvents: "none" }}><path d={"M" + (s.x - 9) + " " + s.y + "h18M" + s.x + " " + (s.y - 9) + "v18"} stroke="#0f172a" strokeWidth={1.4} /></g>);
  }
  if (trace && trace.pts && !view3d) {
    preview.push(<polygon key="tr" points={sPts(trace.pts)} fill="rgba(245,158,11,.18)" stroke="#f59e0b" strokeWidth={2.6} strokeDasharray="7 4" />);
    edgeLabels(trace.pts, "te", true);
  }
  if (trace && trace.busy && trace.seed) { const s = toS(trace.seed.x, trace.seed.z); preview.push(<circle key="tb" cx={s.x} cy={s.y} r={14} fill="none" stroke="#f59e0b" strokeWidth={3} strokeDasharray="10 6"><animateTransform attributeName="transform" type="rotate" from={"0 " + s.x + " " + s.y} to={"360 " + s.x + " " + s.y} dur="1s" repeatCount="indefinite" /></circle>); }
  if (tool === "bg" && calib && !view3d) {
    const all = calib.pts.length === 1 && cur ? calib.pts.concat([cur]) : calib.pts;
    if (all.length) preview.push(<polyline key="cb" points={sPts(all)} fill="none" stroke="#e11d48" strokeWidth={2.6} />);
    all.forEach((p, i) => { const s = toS(p.x, p.z); preview.push(<circle key={"cbp" + i} cx={s.x} cy={s.y} r={HR - 1} fill="#fff" stroke="#e11d48" strokeWidth={2.4} />); });
  }
  if (st.p3sArea && (st.p3sArea.pts || []).length > 2) preview.unshift(
    <polygon key="area" points={sPts(st.p3sArea.pts)} fill={tool === "area" ? "rgba(245,158,11,.08)" : "none"} stroke="#f59e0b" strokeWidth={tool === "area" ? 2.4 : 1.6} strokeDasharray="8 5" style={{ pointerEvents: "none" }} />);
  if (marq) {
    if (marq.world && tool === "roof") {
      const R4 = [toW({ x: marq.x0, y: marq.y0 }), toW({ x: marq.x1, y: marq.y0 }), toW({ x: marq.x1, y: marq.y1 }), toW({ x: marq.x0, y: marq.y1 })];
      preview.push(<polygon key="mq" points={sPts(R4)} fill="rgba(22,163,74,.14)" stroke="#16a34a" strokeWidth={2.4} />);
      edgeLabels(R4, "mqe", true);
    } else preview.push(<rect key="mq" x={Math.min(marq.x0, marq.x1)} y={Math.min(marq.y0, marq.y1)} width={Math.abs(marq.x1 - marq.x0)} height={Math.abs(marq.y1 - marq.y0)}
      fill={tool === "area" ? "rgba(245,158,11,.12)" : tool === "obs" ? "rgba(100,116,139,.25)" : "rgba(14,165,233,.12)"} stroke={tool === "obs" ? "#334155" : "#0ea5e9"} strokeWidth={1.5} strokeDasharray="5 4" />);
  }
  const handleEls = handles.map((h, i) => {
    const on = hover === "h:" + h.t + (h.i != null ? h.i : "");
    if (h.t === "rot" || h.t === "orot" || h.t === "prot") {
      return (
        <g key={"h" + i}>
          <line x1={h.ax} y1={h.ay} x2={h.x} y2={h.y} stroke="#f59e0b" strokeWidth={1.6} />
          <circle cx={h.x} cy={h.y} r={HR + (on ? 3 : 1)} fill="#f59e0b" stroke="#fff" strokeWidth={2.2} />
          <path d={"M" + (h.x - 3.5) + " " + (h.y + 1) + "a3.6 3.6 0 1 1 1.4 2.6"} fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
        </g>);
    }
    if (h.t === "side") return <rect key={"h" + i} x={h.x - HR + 1} y={h.y - HR + 1} width={2 * HR - 2} height={2 * HR - 2} rx={3} fill={on ? "#16a34a" : "#fff"} stroke="#16a34a" strokeWidth={2.4} />;
    if (h.t === "mid") return <circle key={"h" + i} cx={h.x} cy={h.y} r={on ? HR : HR - 2.5} fill="rgba(255,255,255,.85)" stroke="#16a34a" strokeWidth={1.6} strokeDasharray="2 2" />;
    const isSelV = h.t === "vert" && selVert === h.i;
    return <circle key={"h" + i} cx={h.x} cy={h.y} r={HR + (on || isSelV ? 2 : 0)} fill={isSelV ? "#16a34a" : "#fff"} stroke={h.t === "pscale" ? "#2563eb" : "#16a34a"} strokeWidth={2.4} />;
  });

  /* ตัวชี้เมาส์ตามสิ่งที่อยู่ใต้ */
  let cursor = "default";
  if (tool === "pan") cursor = gest.current && gest.current.type === "pan" ? "grabbing" : "grab";
  else if (tool === "roof" || tool === "meas" || tool === "obs" || tool === "area" || (tool === "bg" && calib)) cursor = "crosshair";
  if (hover && hover.indexOf("h:") === 0) cursor = /rot/.test(hover) ? "alias" : "move";
  else if (hover && tool === "select") cursor = "move";
  else if (hover && tool === "panel") cursor = "pointer";
  if (gest.current && gest.current.type === "pan" && gest.current.moved) cursor = "grabbing";

  /* มาตราส่วน */
  const scaleBar = (() => {
    const nice = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
    const L = nice.find((n) => n * V.s >= 70) || 500;
    return { L, px: L * V.s };
  })();

  /* ── คำแนะนำของเครื่องมือ ── */
  const hint = (() => {
    if (view3d) return <span>ลากเพื่อหมุนดูรอบ · คลิกขวาลาก = เลื่อน · ล้อเมาส์ = ซูม · มุมมองนี้ไว้ดูผลและเงา — กลับไปแก้ที่ <b>ผัง 2D</b></span>;
    if (eavePick) return <span><b>แตะขอบที่เป็นชายคา</b> (ขอบต่ำสุดของผืน — น้ำไหลลงทางนี้) · <kbd>Esc</kbd> ยกเลิก</span>;
    if (tool === "axis") {
      if (axisPts) return <span>ลากไปตาม<b>ขอบหลังคาที่ยาวและตรงที่สุด</b>ในภาพ แล้วคลิกปลาย · <kbd>Shift</kbd> = ไม่ดูดขอบ</span>;
      return <span><b>ลากเส้นทับขอบชายคา</b>ในภาพ → ผังหมุนให้หลังคาตรงจอ แนวดูดฉากเปลี่ยนตาม · หรือกด <b>หาแนวอัตโนมัติ</b></span>;
    }
    if (tool === "walk") {
      if (walkPts) return <span>คลิกจุดถัดไป · <kbd>Enter</kbd>/ดับเบิลคลิก = จบ · แผงที่ทับทางเดินจะหายไปเอง</span>;
      return <span><b>คลิกไล่จุด</b>เป็นแนวทางเดินบนหลังคา (กว้าง {walkW} ม.) · แตะทางเดินเดิมเพื่อแก้/ลบ</span>;
    }
    if (tool === "roof") {
      if (trace && trace.on) return trace.busy ? <span>กำลังหาขอบหลังคา…</span>
        : trace.pts ? <span>ได้รูปหลังคา {trace.area} ตร.ม. — <b>Enter</b> ใช้รูปนี้ · ปรับความไวแล้วแตะใหม่ได้ · <kbd>Esc</kbd> ยกเลิก</span>
        : trace.err ? <span style={{ color: "#fde68a" }}>{trace.err}</span>
        : trace.mode === "color" ? <span><b>แตะกลางหลังคาในภาพ</b> ระบบไล่สีหาขอบ (เหมาะกับหลังคาสีเรียบ)</span>
        : <span><b>แตะกลางหลังคา</b> ระบบยิงหาขอบ 4 ทิศตามแนวหลังคา — ใช้ได้กับหลังคาทุกสี</span>;
      if (roofOpt.kind === "facet") return !draw ? <span><b>วาดทีละผืน</b>: คลิกทีละมุมของผืนหลังคาหนึ่งผืน (สามเหลี่ยม/คางหมู) · ดูดติดมุมและขอบผืนข้าง ๆ ให้ขอบร่วมกันพอดี</span>
        : <span>คลิกมุมถัดไป · คลิกจุดแรก/<kbd>Enter</kbd> = ปิดผืน · ระบบเลือกขอบชายคาให้ (เปลี่ยนได้)</span>;
      if (rectDraw) {
        if (!draw) return <span><b>ลากทแยง</b> = สี่เหลี่ยมตรง · หรือ <b>คลิกมุมแรก</b> แล้วคลิกตามแนวขอบหลังคาในภาพ (วาดเอียงได้)</span>;
        if (draw.pts.length === 1) return <span>คลิกปลายขอบแรก · พิมพ์ตัวเลข = ความยาว (ม.) แล้ว <kbd>Enter</kbd></span>;
        return <span>ลากออกไปตามความกว้าง แล้วคลิก · พิมพ์ตัวเลข + <kbd>Enter</kbd> = กว้างกี่เมตร</span>;
      }
      if (!draw) return <span><b>คลิกทีละมุม</b> ตามขอบหลังคาในภาพ · ดูดติดมุม/แนวฉากให้เอง (<kbd>Shift</kbd> = วางอิสระ)</span>;
      return <span>คลิกมุมถัดไป · พิมพ์ตัวเลข = ความยาวขอบ · <kbd>Enter</kbd>/คลิกจุดแรก = ปิดรูป · <kbd>⌫</kbd> ลบมุมล่าสุด</span>;
    }
    if (tool === "panel") {
      if (!selRoof) return <span><b>แตะหลังคา</b> เพื่อจัดแผง · แผงเติมเต็มให้อัตโนมัติ</span>;
      return <span><b>แตะแผง</b> = ปิด/เปิดทีละแผ่น · <b>ลากแผง</b> = ย้ายทั้งชุด · <b>ลากคลุม</b> = ปิดหลายแผ่น{coarse ? " · สองนิ้ว = เลื่อน/ซูม" : " · คลิกขวาลาก = เลื่อนภาพ"}</span>;
    }
    if (tool === "area") return <span><b>ลากกรอบ</b> คลุมอาคาร/หลังคาที่จะติดตั้ง — ใช้ซูมและหาแนวหลังคาอัตโนมัติในกรอบนี้</span>;
    if (tool === "obs") return <span><b>แตะ</b> = วางต้นไม้ · <b>ลาก</b> = วาดกล่อง (ถังน้ำ แท็งก์ ป้าย ตึกข้างเคียง)</span>;
    if (tool === "meas") return measPts ? <span>คลิกจุดถัดไป · <kbd>Enter</kbd>/ดับเบิลคลิก = จบเส้น · <kbd>⌫</kbd> ถอยจุด</span>
      : <span><b>คลิกไล่จุด</b> ตามแนวเดินสาย/ราง ได้ระยะจริงไปกรอก BOQ</span>;
    if (tool === "bg") {
      if (calib) return calib.pts.length < 2 ? <span>คลิก <b>2 จุด</b> บนสิ่งที่รู้ความยาวจริง (เช่น ขอบหลังคาที่วัดมา)</span> : <span>กรอกความยาวจริงในแผงด้านขวา</span>;
      return st.photo ? <span><b>ลากรูป</b> = ย้าย · จุดฟ้า = ย่อขยาย · จุดส้ม = หมุน ให้ทับแผนที่พอดี</span> : <span>เพิ่มภาพดาวเทียมหรือรูปโดรนจากแผงด้านขวา</span>;
    }
    if (tool === "pan") return <span>ลากเพื่อเลื่อนภาพ · ล้อเมาส์ = ซูม · <kbd>F</kbd> = พอดีจอ</span>;
    if (selRoof) return <span>ลากหลังคา = ย้าย · จุดเขียว = ลากมุม · จุดกลางขอบ = เพิ่มมุม · จุดส้ม = หมุน · <kbd>Del</kbd> ลบ · <kbd>Ctrl+Z</kbd> ย้อน</span>;
    return <span>แตะหลังคาเพื่อเลือก · ลากที่ว่าง = เลื่อนภาพ · ล้อเมาส์ = ซูม{coarse ? " · สองนิ้ว = ซูม" : ""}</span>;
  })();

  /* ============== แผงข้าง ============== */
  const sun = Object.assign({}, st.sun, sunHour != null ? { hour: sunHour } : {});
  const roofCountOf = (r) => p3sCount(r);
  const setPanelModel = (m) => {
    const sys = Object.assign({}, st.sys || (typeof suBlankSys === "function" ? suBlankSys() : {}), { panelModel: m });
    const hit = ((window.BOQ && window.BOQ.PANELS) || []).find((x) => x.model === m);
    const pW = hit && +hit.width > 0 ? +hit.width : 0, pL = hit && +hit.length > 0 ? +hit.length : 0;
    const patch = { sys, roofs: (st.roofs || []).map((r) => Object.assign({}, r, { panelW: pW, panelL: pL })), panelW: pW, panelL: pL };
    if (hit && +hit.wp > 0) patch.wp = +hit.wp;
    commit(patch);
  };
  const onPickPhoto = async (e) => {
    const f = (e.target.files || [])[0]; if (!f) return;
    try {
      const url = await window.resizeImageFile(f, 1600, 0.82);
      const S = stRef.current, c = S.roofs && S.roofs.length ? p3sCentroid(roofs.map((r) => p3sRoofCenter(r))) : { x: 0, z: 0 };
      commit({ photo: url, photoX: p3sR(c.x), photoZ: p3sR(c.z), photoRot: 0 });
      setToolRaw("bg");
    } catch (err) { window.askConfirm({ title: "โหลดรูปไม่สำเร็จ", body: err.message, ok: "ตกลง" }); }
    if (fileRef.current) fileRef.current.value = "";
  };
  const jobLatLng = p3ParseLatLng(job && job.map);
  const jobAddr = job ? [job.address, job.province].filter(Boolean).join(" ") : "";
  const onPickMap = (res) => {
    commit((s) => Object.assign({}, s, { baseMap: { url: res.url, widthM: res.widthM, lat: res.lat, lng: res.lng, zoom: res.zoom },
      groundW: Math.max(20, Math.ceil(res.widthM)), sun: Object.assign({}, s.sun, { lat: res.lat, lng: res.lng }) }));
    setMapOpen(false);
    setTimeout(() => { if (!(stRef.current.roofs || []).length) fitView(); }, 0);
    if (wiz) { markSeen(0); setWizStep(1); setTool("area"); }
  };

  const card = (title, body, right) => (
    <div className="p3s-card">
      {title && <div className="p3s-h"><span className="t">{title}</span>{right}</div>}
      {body}
    </div>
  );

  const roofPanelBody = (roof) => {
    const n = roofCountOf(roof), isPoly = roof.kind === "poly", isDome = roof.kind === "dome";
    const kindTh = { poly: "ทรงอิสระ", rect: "เพิงแหงน", gable: "จั่ว", hip: "ปั้นหยา", dome: "โดม" }[roof.kind] || roof.kind;
    const pts = isPoly ? (roof.pts || []) : [];
    const ph = isPoly ? p3PhOf(roof) : [];
    const eave = isPoly && ph.length ? Math.min.apply(null, ph) : +roof.h || 0;
    const pitchNow = isPoly ? p3sPolyPitch(roof) : +roof.pitch || 0;
    const lowIdx = isPoly ? (roof.p3sLow != null ? +roof.p3sLow : (() => { let b = 0, bv = 1e9; pts.forEach((_, i) => { const v = ph[i] + ph[(i + 1) % pts.length]; if (v < bv) { bv = v; b = i; } }); return b; })()) : 0;
    const area = isPoly && pts.length > 2 ? p3sR(p3Area(pts), 10) : null;
    const pan = (() => { try { return p3Panels(roof); } catch (e) { return null; } })();
    const blocks = pan ? pan.blocks || [] : [];
    const orient = blocks[0] ? blocks[0].orient : "portrait";
    const azTxt = (az) => p3sCompass(+az || 180);
    const setPolyPitch = (pitch, low, base) => {
      patchRoof(roof.id, (r) => {
        const lo = low == null ? lowIdx : low;
        const o = { ph: p3sPitchPh(r.pts, lo, base == null ? eave : base, pitch), p3sLow: lo, p3sPitch: pitch };
        if (low != null) o.p3sEaveFix = true;
        return o;
      }, "pitch");
      // ผืนที่ต่อกับผืนอื่น: ความชันใหม่ใช้ทั้งหลัง แล้วเชื่อมรอยต่อใหม่
      if (roof.p3sFacet) weldLive([roof.id], { pitch });
    };
    // สถานะรอยต่อกับผืนข้าง ๆ
    const weld = isPoly && (roof.p3sFacet || pitchNow > 0.4) ? (() => { try { return p3sWeldFacets(roofs, [roof.id]); } catch (e) { return null; } })() : null;
    /* แถวแผงขนานชายคา: หลังคาทรงอิสระที่ลาด = ขอบชายคา (ระนาบที่ไม่เป๊ะทำให้แถวตามระนาบเอียงจากชายคาได้) · ที่เหลือ = ขอบยาวสุด */
    const alignRotFor = (r, side) => {
      if (r.kind === "poly") {
        const P = r.pts || [], n = P.length;
        if (n > 2 && p3sPolyPitch(r) > 0.4) {
          const lo = r.p3sLow != null ? ((+r.p3sLow % n) + n) % n : lowIdx, a = P[lo], b = P[(lo + 1) % n];
          return p3sAlignRot(r, null, Math.atan2(b.z - a.z, b.x - a.x));
        }
        return p3sAlignRot(r, null, p3sLongEdgeAng(p3sFaces2D(r)[0].pts));
      }
      return p3sAlignRot(r, side, p3sLongEdgeAng(p3sOutline(r)));
    };
    const fillRoof = () => patchRoof(roof.id, (r) => {
      let rot = 0;
      if (r.kind === "poly") { const pl = p3PolyPlane(r); if (pl && (pl.tiltCos > 0.999 || p3sPolyPitch(r) > 0.4)) rot = alignRotFor(r); }
      return { blocks: [Object.assign(p3NewBlk(0), { orient, rot })], skips: {}, noPanel: null };
    });
    const blkSide = (i) => { const rc = pan && (pan.rects || []).find((x) => x.blk === i); return rc ? rc.side : null; };
    const rot0 = blocks[0] ? +blocks[0].rot || 0 : 0;
    const rotFit = blocks.length ? alignRotFor(roof, blkSide(0)) : 0;
    const rotOff = blocks.length ? p3sR(rot0 - rotFit, 10) : 0;
    const rotAll = (v, key) => patchAllBlk(roof, { rot: p3sR(v, 10) }, key);
    const alignAll = () => patchRoof(roof.id, (r) => ({ blocks: p3sBlkStore(r).map((b, i) => Object.assign({}, b, { rot: alignRotFor(r, blkSide(i)) })) }));
    const allKeys = () => p3sQuads(roof).filter((q) => !q.slot).map((q) => q.key);
    const blkSel = tool === "panel" && selBlk != null && blocks[selBlk] ? blocks[selBlk] : null;
    const rect = blkSel && pan ? (pan.rects || []).find((x) => x.blk === selBlk) : null;
    return (
      <React.Fragment>
        <div className="p3s-card">
          <div className="p3s-row" style={{ justifyContent: "space-between" }}>
            <span className="p3s-ttl2"><P3Icon name="roof" size={17} />{roof.name || "หลังคา"}</span>
            <span className="p3s-badge">{kindTh}</span>
          </div>
          {roof.grp && <span className="p3s-note">อยู่ในกลุ่มหลังคา {roofs.filter((x) => x.grp === roof.grp).length} ผืน — ลากผืนไหนก็ย้ายไปพร้อมกัน (แก้กลุ่มในแบบเก่า)</span>}
          <P3SText label="ชื่อหลังคา" value={roof.name} onChange={(v) => patchRoof(roof.id, { name: v }, "name")} />
          {!isDome && (
            <div className="p3s-fld"><span className="lb">ทรงหลังคา<i>เปลี่ยนได้ คงรอยเท้าเดิม</i></span>
              <P3SSeg full value={isPoly ? (pitchNow > 0.4 ? "shed" : "flat") : roof.kind === "rect" ? "shed" : roof.kind}
                onChange={(v) => convertRoof(roof, v)}
                options={[["flat", "ราบ"], ["shed", "เพิง"], ["gable", "จั่ว"], ["hip", "ปั้นหยา"]]} />
            </div>
          )}
          {(roof.kind === "gable" || roof.kind === "hip" || roof.kind === "rect" || (isPoly && pitchNow > 0.4)) && (
            <div className="p3s-fld"><span className="lb">ความชันด่วน</span>
              <div className="p3s-row" style={{ gap: 5 }}>
                {[5, 10, 15, 20, 25, 30].map((d) => (
                  <button key={d} className={"p3s-btn" + (Math.round(pitchNow) === d ? " pri" : "")} style={{ flex: 1, padding: 0, height: 32, fontSize: 12 }}
                    onClick={() => (isPoly ? setPolyPitch(d) : patchRoof(roof.id, { pitch: d }))}>{d}°</button>
                ))}
              </div>
            </div>
          )}
          {(roof.kind === "gable" || roof.kind === "hip") && (
            <button className="p3s-btn wide" onClick={() => patchRoof(roof.id, (r) => (r.kind === "gable"
              ? { ridge: r.span, span: r.ridge, az: p3sR(((+r.az || 180) + 90) % 360, 10) }
              : { w: r.d, d: r.w, az: p3sR(((+r.az || 180) + 90) % 360, 10) }))}><P3SIcon name="rotate" size={15} />สลับแนวสันหลังคา</button>
          )}
          {isPoly && (
            <React.Fragment>
              <div className="p3s-g2">
                <P3SNum label="ความสูงชายคา" unit="ม." step={0.1} min={0} max={60} digits={2} value={eave}
                  onChange={(v) => patchRoof(roof.id, (r) => { const d = v - eave; return { ph: p3PhOf(r).map((x) => p3sR(x + d)) }; }, "eave")} />
                <P3SNum label="ความชัน" unit="°" step={1} min={0} max={45} digits={1} value={pitchNow}
                  onChange={(v) => setPolyPitch(v)} />
              </div>
              {pitchNow > 0.4 && (
                <label className="p3s-fld">
                  <span className="lb">ลาดลงทาง (ขอบชายคา)</span>
                  <span className="p3s-well">
                    <select value={lowIdx} onChange={(e) => setPolyPitch(pitchNow || 10, +e.target.value)}>
                      {pts.map((p, i) => {
                        const q = pts[(i + 1) % pts.length];
                        return <option key={i} value={i}>ขอบ {i + 1} · หันทิศ{p3sCompass(p3sEdgeBearing(pts, i))} · {p3sR(Math.hypot(q.x - p.x, q.z - p.z), 10)} ม.</option>;
                      })}
                    </select>
                  </span>
                </label>
              )}
              {pitchNow <= 0.4 && <button className="p3s-btn wide" onClick={() => setPolyPitch(10, p3sSouthEdge(pts))}>ทำเป็นหลังคาเพิง ลาดลงทิศใต้ 10°</button>}
              {weld && weld.n > 1 && (weld.gap > 0.03
                ? <button className="p3s-btn wide pri" onClick={() => weldNow(roof)}><P3SIcon name="magic" size={15} />จัดทรงหลังคาทั้งหลัง {weld.n} ผืน (ยังเพี้ยนสูงสุด {Math.round(weld.gap * 100)} ซม.)</button>
                : <span className="p3s-badge ok" style={{ height: "auto", padding: "5px 10px", whiteSpace: "normal" }}>ต่อสนิทกับผืนข้าง ๆ แล้ว · ทั้งหลัง {weld.n} ผืน{roof.p3sFacet ? " · ลากมุม/เปลี่ยนความชัน เชื่อมให้เอง" : ""}</span>)}
              {pitchNow > 0.4 && <button className={"p3s-btn wide" + (eavePick ? " pri" : "")} onClick={() => setEavePick((v) => !v)}><P3SIcon name="target" size={15} />{eavePick ? "แตะขอบชายคาบนผัง… (Esc ยกเลิก)" : "แตะเลือกขอบชายคาบนผัง"}</button>}
              <div className="p3s-stat">
                <div><div className="l">พื้นที่ผัง</div><div className="v">{area}<small style={{ fontSize: 10 }}> ตร.ม.</small></div></div>
                <div><div className="l">มุม</div><div className="v">{pts.length}</div></div>
                <div><div className="l">แผง</div><div className="v">{n}</div></div>
              </div>
              {selVert != null && pts.length > 3 && <button className="p3s-btn wide dngr" onClick={delSelected}><P3Icon name="trash" />ลบมุมที่ {selVert + 1}</button>}
              <span className="p3s-note">ลากจุดเขียวเพื่อแก้มุม · ลากจุดกลางขอบเพื่อเพิ่มมุม · ดูดติดมุมหลังคาข้าง ๆ ให้เอง</span>
            </React.Fragment>
          )}
          {roof.kind === "rect" && (
            <div className="p3s-g2">
              <P3SNum label="กว้าง" unit="ม." step={0.1} min={0.5} value={roof.w} onChange={(v) => patchRoof(roof.id, { w: v }, "w")} />
              <P3SNum label="ยาวตามลาด" unit="ม." step={0.1} min={0.5} value={roof.d} onChange={(v) => patchRoof(roof.id, { d: v }, "d")} />
              <P3SNum label="ความชัน" unit="°" step={1} min={0} max={60} digits={1} value={roof.pitch} onChange={(v) => patchRoof(roof.id, { pitch: v }, "pitch")} />
              <P3SNum label="ความสูงชายคา" unit="ม." step={0.1} min={0} value={roof.h} onChange={(v) => patchRoof(roof.id, { h: v }, "h")} />
            </div>
          )}
          {roof.kind === "gable" && (
            <React.Fragment>
              <div className="p3s-g2">
                <P3SNum label="ยาวตามสัน" unit="ม." step={0.1} min={1} value={roof.ridge} onChange={(v) => patchRoof(roof.id, { ridge: v }, "ridge")} />
                <P3SNum label="กว้างจั่ว" unit="ม." step={0.1} min={1} value={roof.span} onChange={(v) => patchRoof(roof.id, { span: v }, "span")} />
                <P3SNum label="ความชัน" unit="°" step={1} min={0} max={60} digits={1} value={roof.pitch} onChange={(v) => patchRoof(roof.id, { pitch: v }, "pitch")} />
                <P3SNum label="ความสูงชายคา" unit="ม." step={0.1} min={0} value={roof.h} onChange={(v) => patchRoof(roof.id, { h: v }, "h")} />
              </div>
              <div className="p3s-fld"><span className="lb">วางแผงด้าน</span>
                <P3SSeg full value={(roof.sideA !== false ? "A" : "") + (roof.sideB !== false ? "B" : "")} onChange={(v) => patchRoof(roof.id, { sideA: v.indexOf("A") >= 0, sideB: v.indexOf("B") >= 0 })}
                  options={[["AB", "ทั้งสองด้าน"], ["A", "ด้าน A (" + azTxt(roof.az) + ")"], ["B", "ด้าน B (" + p3sCompass((+roof.az || 180) + 180) + ")"]]} />
              </div>
            </React.Fragment>
          )}
          {roof.kind === "hip" && (
            <React.Fragment>
              <div className="p3s-g2">
                <P3SNum label="ยาว" unit="ม." step={0.1} min={1} value={roof.w} onChange={(v) => patchRoof(roof.id, { w: v }, "w")} />
                <P3SNum label="กว้าง" unit="ม." step={0.1} min={1} value={roof.d} onChange={(v) => patchRoof(roof.id, { d: v }, "d")} />
                <P3SNum label="ความชัน" unit="°" step={1} min={0} max={60} digits={1} value={roof.pitch} onChange={(v) => patchRoof(roof.id, { pitch: v }, "pitch")} />
                <P3SNum label="ความสูงชายคา" unit="ม." step={0.1} min={0} value={roof.h} onChange={(v) => patchRoof(roof.id, { h: v }, "h")} />
              </div>
              <div className="p3s-fld"><span className="lb">วางแผงด้าน (แตะเพื่อเปิด/ปิด)</span>
                <div className="p3s-row">
                  {[["A", 0], ["B", 180], ["C", 90], ["D", -90]].map(([sd, off]) => {
                    const on = sd === "A" || sd === "B" ? roof["side" + sd] !== false : roof["side" + sd] === true;
                    return <button key={sd} className={"p3s-btn" + (on ? " pri" : "")} style={{ flex: 1 }} onClick={() => { const o = {}; o["side" + sd] = !on; patchRoof(roof.id, o); }}>{sd} · {p3sCompass((+roof.az || 180) + off)}</button>;
                  })}
                </div>
              </div>
            </React.Fragment>
          )}
          {isDome && (
            <React.Fragment>
              <div className="p3s-g2">
                <P3SNum label="ยาว" unit="ม." step={0.1} min={1} value={roof.ridge} onChange={(v) => patchRoof(roof.id, { ridge: v }, "ridge")} />
                <P3SNum label="กว้าง" unit="ม." step={0.1} min={1} value={roof.span} onChange={(v) => patchRoof(roof.id, { span: v }, "span")} />
                <P3SNum label="ความสูงโค้ง" unit="ม." step={0.1} min={0.2} value={roof.rise} onChange={(v) => patchRoof(roof.id, { rise: v }, "rise")} />
                <P3SNum label="ความสูงชายคา" unit="ม." step={0.1} min={0} value={roof.h} onChange={(v) => patchRoof(roof.id, { h: v }, "h")} />
              </div>
              <span className="p3s-note">ตั้งค่าโดมแบบละเอียด (มุมเอียงสูงสุดของแผง) ใช้แบบเก่า</span>
            </React.Fragment>
          )}
          {!isPoly && (
            <span className="p3s-note">หันทิศ{azTxt(roof.az)} ({p3sR(+roof.az || 180, 1)}°) · ลากจุดส้มบนผังเพื่อหมุน</span>
          )}
          <button className="p3s-btn wide" onClick={() => axisFromRoof(roof)}><P3SIcon name="axis" size={15} />ใช้หลังคานี้เป็นแนวอ้างอิง</button>
          <div className="p3s-row">
            <button className="p3s-btn" style={{ flex: 1 }} onClick={duplicate}><P3SIcon name="copy" size={15} />ทำซ้ำ</button>
            <button className="p3s-btn dngr" style={{ flex: 1 }} onClick={() => { setSelVert(null); const id = roof.id; commit((s) => Object.assign({}, s, { roofs: s.roofs.filter((x) => x.id !== id) })); setSel(null); }}><P3Icon name="trash" />ลบหลังคา</button>
          </div>
        </div>

        <div className="p3s-card">
          <div className="p3s-h"><span className="t">แผงบนหลังคานี้</span>{roof.noPanel ? <span className="p3s-badge warn">ยังไม่วางแผง</span> : <span className="p3s-badge ok">{n} แผง · {p3sR(n * (+st.wp || 650) / 1000, 100)} kWp</span>}</div>
          <button className="p3s-btn pri big wide" onClick={fillRoof}><P3SIcon name="magic" size={17} />{roof.noPanel ? "วางแผงเต็มหลังคา" : "เติมแผงเต็มหลังคา"}</button>
          {!roof.noPanel && <button className="p3s-btn dngr wide" onClick={() => patchRoof(roof.id, { noPanel: true })}><P3Icon name="trash" />เอาแผงออกจากหลังคานี้</button>}
          <div className="p3s-g2">
            <div className="p3s-fld"><span className="lb">แนวแผง</span>
              <P3SSeg full value={orient} onChange={(v) => patchAllBlk(roof, { orient: v })} options={[["portrait", "ตั้ง"], ["landscape", "นอน"]]} />
            </div>
            <P3SNum label="เว้นรอบขอบ" unit="ม." step={0.05} min={0} max={5} value={+roof.margin || 0} onChange={(v) => patchRoof(roof.id, { margin: v }, "margin")} />
          </div>
          {blocks.length > 0 && (
            <div className="p3s-fld" style={{ gap: 8 }}>
              <P3SRange label={"หมุนแผง" + (blocks.length > 1 ? " (ทุกชุด)" : "")} right={p3sR(rot0, 10) + "°"} min={-90} max={90} step={0.5} value={rot0} onChange={(v) => rotAll(v, "rotall")} />
              <div className="p3s-row" style={{ gap: 5 }}>
                <button className="p3s-btn" style={{ padding: "0 10px" }} onClick={() => rotAll(rot0 - 1, "rotall")}>−1°</button>
                <button className={"p3s-btn" + (Math.abs(rotOff) > 0.3 ? " pri" : "")} style={{ flex: 1 }} onClick={alignAll}>
                  <P3SIcon name="align" size={15} />{isPoly && pitchNow > 0.4 ? "ขนานชายคา" : "ขนานขอบยาว"}{Math.abs(rotOff) > 0.3 ? " (ตอนนี้เอียง " + Math.abs(rotOff) + "°)" : ""}</button>
                <button className="p3s-btn" style={{ padding: "0 10px" }} onClick={() => rotAll(rot0 + 1, "rotall")}>+1°</button>
              </div>
            </div>
          )}
          {(() => {
            const B0 = (roof.blocks && roof.blocks[0]) || blocks[0] || {}, on = (B0.gc > 0 || B0.gr > 0) && B0.gg > 0;
            const nG = on ? groupInfo(roof).length : 0;
            const preset = (gc, gr, gg) => patchAllBlk(roof, { gc, gr, gg, adds: {} });
            return (
              <div className="p3s-fld" style={{ gap: 8 }}>
                <span className="lb">จัดเป็นกลุ่ม + เว้นทางเดิน{on && <i>{nG} กลุ่ม</i>}</span>
                <div className="p3s-row" style={{ gap: 5 }}>
                  <button className={"p3s-btn" + (!on ? " pri" : "")} style={{ flex: 1, padding: "0 4px", fontSize: 12 }} onClick={() => preset(0, 0, 0)}>ไม่แบ่ง</button>
                  <button className="p3s-btn" style={{ flex: 1, padding: "0 4px", fontSize: 12 }} onClick={() => preset(0, 2, 0.6)}>ทุก 2 แถว</button>
                  <button className="p3s-btn" style={{ flex: 1, padding: "0 4px", fontSize: 12 }} onClick={() => preset(10, 0, 0.6)}>ทุก 10 แผง</button>
                  <button className="p3s-btn" style={{ flex: 1, padding: "0 4px", fontSize: 12 }} onClick={() => preset(8, 3, 0.6)}>8×3</button>
                </div>
                {on && (
                  <div className="p3s-g2">
                    <P3SNum label="แผง/กลุ่ม" step={1} min={0} max={200} digits={0} value={B0.gc || 0} onChange={(v) => patchAllBlk(roof, { gc: Math.round(v), adds: {} }, "gc")} />
                    <P3SNum label="แถว/กลุ่ม" step={1} min={0} max={200} digits={0} value={B0.gr || 0} onChange={(v) => patchAllBlk(roof, { gr: Math.round(v), adds: {} }, "gr")} />
                    <P3SNum label="ทางเดิน" unit="ม." step={0.1} min={0} max={5} value={B0.gg || 0} onChange={(v) => patchAllBlk(roof, { gg: v, adds: {} }, "gg")} />
                  </div>
                )}
                <button className="p3s-btn wide" onClick={() => { setTool("walk"); setSel({ t: "roof", id: roof.id }); }}><P3SIcon name="walk" size={15} />วาดทางเดินเอง (W){(roof.walks || []).length ? " · มี " + roof.walks.length + " เส้น" : ""}</button>
              </div>
            );
          })()}
          <div className="p3s-row">
            <button className="p3s-btn" style={{ flex: 1 }} onClick={() => setCells(roof, allKeys(), false)}>เปิดแผงทุกแผ่น</button>
            <button className="p3s-btn" style={{ flex: 1 }} onClick={() => setCells(roof, allKeys(), true)}>ไม่วางแผงผืนนี้</button>
          </div>
          {tool !== "panel" && <button className="p3s-btn wide" onClick={() => setTool("panel")}><P3SIcon name="panel" size={16} />จัดแผงทีละแผ่น / ย้ายชุดแผง (P)</button>}
        </div>

        {tool === "panel" && (
          <div className="p3s-card">
            <div className="p3s-h"><span className="t">ชุดแผง {blocks.length > 1 ? "(" + blocks.length + " ชุด)" : ""}</span>
              {blkSel && <span className="p3s-badge warn">ชุดที่ {selBlk + 1}</span>}</div>
            {!blkSel && <span className="p3s-note">แตะแผงบนผังเพื่อเลือกชุด แล้วตั้งค่าได้ที่นี่ — ลากแผงเพื่อย้ายทั้งชุด</span>}
            {blkSel && (
              <React.Fragment>
                <div className="p3s-g2">
                  <P3SNum label="จำนวนแถว" auto="อัตโนมัติ" step={1} min={0} max={200} digits={0} value={blkSel.rows || (rect ? rect.rows : 0)}
                    onChange={(v) => patchBlk(roof, selBlk, { rows: Math.round(v) }, "rows")} />
                  <P3SNum label="แผงต่อแถว" auto="อัตโนมัติ" step={1} min={0} max={400} digits={0} value={blkSel.cols || (rect ? rect.cols : 0)}
                    onChange={(v) => patchBlk(roof, selBlk, { cols: Math.round(v) }, "cols")} />
                </div>
                {(blkSel.rows > 0 || blkSel.cols > 0) && <button className="p3s-btn wide" onClick={() => patchBlk(roof, selBlk, { rows: 0, cols: 0 })}>ให้เต็มพื้นที่อัตโนมัติ</button>}
                <P3SRange label="หมุนชุดแผง" right={p3sR(blkSel.rot, 10) + "°"} min={-90} max={90} step={0.5} value={blkSel.rot}
                  onChange={(v) => patchBlk(roof, selBlk, { rot: v }, "rot")} />
                <div className="p3s-row">
                  <button className="p3s-btn" style={{ flex: 1 }} onClick={() => {
                    const fp = roof.kind === "poly" ? p3sFaces2D(roof)[0].pts : p3sOutline(roof);
                    patchBlk(roof, selBlk, { rot: p3sAlignRot(roof, rect ? rect.side : null, p3sLongEdgeAng(fp)) });
                  }}><P3SIcon name="align" size={15} />ขนานขอบยาว</button>
                  <button className="p3s-btn" style={{ flex: 1 }} onClick={() => patchBlk(roof, selBlk, { du: 0, dv: 0, rot: 0 })}><P3Icon name="reset" />คืนตำแหน่ง</button>
                </div>
                <div className="p3s-g2">
                  <P3SNum label="ขาตั้งเอียง" unit="°" step={1} min={0} max={60} digits={0} value={blkSel.tilt} onChange={(v) => patchBlk(roof, selBlk, { tilt: v }, "tilt")} />
                  <P3SNum label="ช่องห่างแผง" unit="ซม." step={1} min={0} max={200} digits={0} value={p3sR(blkSel.gap * 100, 1)} onChange={(v) => patchBlk(roof, selBlk, { gap: v / 100 }, "gap")} />
                </div>
                <label className="p3s-row" style={{ fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <input type="checkbox" checked={!!blkSel.keep} onChange={(e) => patchBlk(roof, selBlk, { keep: e.target.checked })} />
                  จัดเป็นสี่เหลี่ยมเต็มแถว (ไม่ตัดตามขอบ)
                </label>
                {blocks.length > 1 && <button className="p3s-btn wide dngr" onClick={() => { patchRoof(roof.id, (r) => ({ blocks: p3sBlkStore(r).filter((_, i) => i !== selBlk) })); setSelBlk(null); }}><P3Icon name="trash" />ลบชุดนี้</button>}
              </React.Fragment>
            )}
            <button className="p3s-btn wide" onClick={() => { patchRoof(roof.id, (r) => ({ blocks: p3sBlkStore(r).concat([Object.assign(p3NewBlk(0), { orient, rows: 2, cols: 4 })]) })); setSelBlk(blocks.length); }}>
              <P3Icon name="plus" />เพิ่มชุดแผงอีกชุด</button>
            <span className="p3s-note">ชุดใหม่วางที่มุมหลังคา ลากไปวางตรงไหนก็ได้ · แตะช่องเส้นประสีเขียวเพื่อเติมแผงทีละแผ่น</span>
          </div>
        )}
      </React.Fragment>
    );
  };

  const obsPanelBody = (o) => (
    <div className="p3s-card">
      <div className="p3s-row" style={{ justifyContent: "space-between" }}>
        <span className="p3s-ttl2"><P3Icon name={o.kind === "tree" ? "tree" : "box"} size={17} />{o.kind === "tree" ? "ต้นไม้" : "สิ่งบดบัง"}</span>
      </div>
      <P3SSeg full value={o.kind === "tree" ? "tree" : "box"} onChange={(v) => patchObs(o.id, { kind: v })} options={[["box", "กล่อง/อาคาร"], ["tree", "ต้นไม้"]]} />
      <div className="p3s-g2">
        <P3SNum label={o.kind === "tree" ? "ทรงพุ่มกว้าง" : "กว้าง"} unit="ม." step={0.1} min={0.3} value={o.w} onChange={(v) => patchObs(o.id, o.kind === "tree" ? { w: v, d: v } : { w: v }, "ow")} />
        {o.kind !== "tree" && <P3SNum label="ลึก" unit="ม." step={0.1} min={0.3} value={o.d} onChange={(v) => patchObs(o.id, { d: v }, "od")} />}
        <P3SNum label="สูง" unit="ม." step={0.1} min={0.2} value={o.h} onChange={(v) => patchObs(o.id, { h: v }, "oh")} />
        {o.kind !== "tree" && <P3SNum label="หมุน" unit="°" step={5} min={0} max={360} digits={0} value={+o.rot || 0} onChange={(v) => patchObs(o.id, { rot: v }, "orot")} />}
      </div>
      <span className="p3s-note">ความสูงใช้คำนวณเงาที่ตกบนแผง — ดูผลได้ในมุมมอง 3D</span>
      <div className="p3s-row">
        <button className="p3s-btn" style={{ flex: 1 }} onClick={duplicate}><P3SIcon name="copy" size={15} />ทำซ้ำ</button>
        <button className="p3s-btn dngr" style={{ flex: 1 }} onClick={delSelected}><P3Icon name="trash" />ลบ</button>
      </div>
    </div>
  );
  const measPanelBody = (m) => (
    <div className="p3s-card">
      <span className="p3s-ttl2"><P3Icon name="ruler" size={17} />เส้นวัดระยะ</span>
      <P3SText label="ชื่อ" value={m.name} onChange={(v) => patchMeas(m.id, { name: v }, "mn")} />
      <label className="p3s-fld"><span className="lb">ใช้กับ (ดึงเข้า BOQ ตามหมวดนี้)</span>
        <span className="p3s-well"><select value={m.kind || "other"} onChange={(e) => patchMeas(m.id, { kind: e.target.value })}>
          {P3_MEAS_KINDS.map((k) => <option key={k.k} value={k.k}>{k.th}</option>)}
        </select></span>
      </label>
      <P3SNum label="ระยะขึ้น–ลงเพิ่ม (ผนัง/หลังคา)" unit="ม." step={0.5} min={0} value={+m.rise || 0} onChange={(v) => patchMeas(m.id, { rise: v }, "mr")} />
      <div className="p3s-stat"><div style={{ gridColumn: "1 / -1" }}><div className="l">ระยะรวม</div><div className="v">{fmtM(p3MeasLen(m))}</div></div></div>
      <button className="p3s-btn dngr wide" onClick={delSelected}><P3Icon name="trash" />ลบเส้นนี้</button>
    </div>
  );

  const bgPanel = (
    <React.Fragment>
      <div className="p3s-card">
        <span className="p3s-ttl2"><P3Icon name="map" size={17} />ภาพดาวเทียม</span>
        <span className="p3s-note">ได้มาตราส่วนจริงจากแผนที่ทันที — วาดหลังคาทับแล้ววัดระยะได้เลย</span>
        <div className="p3s-row">
          <button className="p3s-btn pri" style={{ flex: 1 }} onClick={() => setMapOpen(true)}><P3Icon name="map" />{st.baseMap ? "เลือกพื้นที่ใหม่" : "เลือกจากแผนที่"}</button>
          {st.baseMap && <button className="p3s-btn dngr" onClick={() => commit({ baseMap: null })}><P3Icon name="trash" /></button>}
        </div>
      </div>
      <div className="p3s-card">
        <span className="p3s-ttl2"><P3Icon name="camera" size={17} />รูปโดรน / ภาพมุมสูง</span>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickPhoto} />
        <div className="p3s-row">
          <button className={"p3s-btn" + (st.photo ? "" : " pri")} style={{ flex: 1 }} onClick={() => fileRef.current && fileRef.current.click()}><P3Icon name="image" />{st.photo ? "เปลี่ยนรูป" : "อัปโหลดรูป"}</button>
          {st.photo && <button className="p3s-btn dngr" onClick={() => commit({ photo: null, photoRot: 0, photoX: 0, photoZ: 0 })}><P3Icon name="trash" /></button>}
        </div>
        {st.photo && (
          <React.Fragment>
            <button className={"p3s-btn wide" + (calib ? " pri" : "")} onClick={() => { setToolRaw("bg"); setCalib(calib ? null : { pts: [], len: "" }); }}>
              <P3SIcon name="ruler" size={15} />{calib ? "กำลังตั้งมาตราส่วน… (กดอีกครั้งเพื่อยกเลิก)" : "ตั้งมาตราส่วนจากระยะที่รู้จริง"}</button>
            {calib && calib.pts.length === 2 && (() => {
              const Lm = Math.hypot(calib.pts[1].x - calib.pts[0].x, calib.pts[1].z - calib.pts[0].z);
              const real = parseFloat(calib.len);
              return (
                <div className="p3s-fld">
                  <span className="lb">ระยะจริงของเส้นนี้ (ตอนนี้วัดได้ {p3sR(Lm)} ม.)</span>
                  <span className="p3s-well"><input type="text" inputMode="decimal" autoFocus value={calib.len} onChange={(e) => setCalib(Object.assign({}, calib, { len: e.target.value }))} placeholder="เช่น 12.5" /><span className="u">ม.</span></span>
                  <button className="p3s-btn pri wide" disabled={!(real > 0) || !(Lm > 0.05)} onClick={() => {
                    const f = real / Lm, S = stRef.current, a = calib.pts[0];
                    // ย่อขยายรอบจุดแรก — จุดที่คลิกยังอยู่ที่เดิมบนผัง
                    commit({ photoW: p3sR((+S.photoW || 30) * f, 100), photoX: p3sR(a.x + ((+S.photoX || 0) - a.x) * f), photoZ: p3sR(a.z + ((+S.photoZ || 0) - a.z) * f) });
                    setCalib(null);
                  }}>ใช้มาตราส่วนนี้</button>
                </div>
              );
            })()}
            <div className="p3s-g2">
              <P3SNum label="ความกว้างรูปจริง" unit="ม." step={0.5} min={2} value={+st.photoW || 30} onChange={(v) => commit({ photoW: v }, "pw")} />
              <P3SNum label="หมุนรูป" unit="°" step={0.5} min={-360} max={360} digits={1} value={+st.photoRot || 0} onChange={(v) => commit({ photoRot: v }, "prot")} />
            </div>
            <P3SRange label="ความทึบรูป" right={Math.round((+st.photoOpacity || 0.95) * 100) + "%"} min={0.15} max={1} step={0.05} value={+st.photoOpacity || 0.95} onChange={(v) => commit({ photoOpacity: v }, "pop")} />
            <span className="p3s-note">มีทั้งภาพดาวเทียมและรูปโดรน: ลดความทึบรูปโดรนแล้วลากให้ทับแผนที่พอดี จะได้ทั้งความคมของโดรนและมาตราส่วนของแผนที่</span>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );

  /* ============== พาทำทีละขั้น ============== */
  const hasImgW = !!(st.baseMap || st.photo);
  const facetRoofs = roofs.filter((r) => r.p3sFacet);
  if (shapeRef.current.roofs !== roofs) {
    let g = 0;
    if (facetRoofs.length > 1) { try { g = p3sWeldFacets(facetRoofs).gap || 0; } catch (e) { g = 0; } }
    shapeRef.current = { roofs, gap: g };
  }
  const shapeGap = shapeRef.current.gap;
  const emptyRoofs = roofs.filter((r) => !roofCountOf(r));
  const anyWalk = roofs.some((r) => (r.walks || []).length);
  const pickRoof = (r) => { setSel({ t: "roof", id: r.id }); const c = p3sRoofCenter(r); setView(Object.assign({}, viewRef.current, { cx: c.x, cz: c.z })); };
  const WIZ = [
    { t: "ภาพมุมสูง", tools: ["bg"], done: hasImgW, skip: true,
      d: <span>กด <b>ดาวเทียม</b> หรือ <b>รูปโดรน</b> แล้วเลื่อนให้อาคารอยู่กลางจอ · รูปโดรนต้องตั้งมาตราส่วนจากระยะที่รู้จริงก่อน — ทุกอย่างหลังจากนี้วัดตามภาพนี้</span>,
      act: <div className="p3s-row"><button className="p3s-btn" style={{ flex: 1 }} onClick={() => setMapOpen(true)}><P3Icon name="map" />ดาวเทียม</button><button className="p3s-btn" style={{ flex: 1 }} onClick={() => fileRef.current && fileRef.current.click()}><P3Icon name="camera" />รูปโดรน</button></div>,
      go: () => setTool("bg") },
    { t: "กำหนดพื้นที่ติดตั้ง", tools: ["area"], done: !!(st.p3sArea && (st.p3sArea.pts || []).length > 2), skip: true,
      d: <span><b>ลากกรอบ</b> คลุมอาคารหรือหลังคาที่จะติดตั้ง ระบบซูมเข้าให้ และใช้กรอบนี้หาแนวหลังคาอัตโนมัติ · ลากใหม่ได้เสมอ</span>,
      act: st.p3sArea ? <div className="p3s-row"><button className="p3s-btn" style={{ flex: 1 }} onClick={() => zoomArea(st.p3sArea)}><P3SIcon name="fit" size={15} />ซูมไปที่กรอบ</button>
        <button className="p3s-btn dngr" onClick={() => commit({ p3sArea: null })}><P3Icon name="trash" /></button></div> : null,
      go: () => { setTool("area"); if (st.p3sArea) zoomArea(st.p3sArea); } },
    { t: "ตั้งแนวหลังคา", tools: ["axis"], done: axisDeg != null, skip: true,
      d: <span>กด <b>หาแนวอัตโนมัติ</b> (อ่านขอบในกรอบพื้นที่ติดตั้ง) แล้วดูว่าเส้นกริดสีม่วงขนานกับขอบอาคารไหม · ไม่ตรงปรับทีละองศา หรือลากเส้นทับขอบชายคาเอง</span>,
      act: (
        <React.Fragment>
          <button className={"p3s-btn wide" + (axisDeg == null ? " pri" : "")} disabled={!hasImgW} onClick={autoAxis}><P3SIcon name="magic" size={15} />หาแนวอัตโนมัติ</button>
          {axisMsg && <span className="p3s-note">{axisMsg}</span>}
          {axisDeg != null && (
            <div className="p3s-fld" style={{ gap: 6 }}>
              <span className="lb">แนว {p3sR(axisDeg, 10)}° — ตรงกับขอบอาคารไหม?</span>
              <div className="p3s-row" style={{ gap: 5 }}>
                <button className="p3s-btn" style={{ padding: "0 10px" }} onClick={() => setAxis(axisDeg - 1)}>−1°</button>
                <button className="p3s-btn" style={{ padding: "0 10px" }} onClick={() => setAxis(axisDeg + 1)}>+1°</button>
                <button className="p3s-btn pri" style={{ flex: 1 }} onClick={() => nextStep()}><P3Icon name="check" />ตรงแล้ว ไปต่อ</button>
              </div>
            </div>
          )}
        </React.Fragment>
      ),
      go: () => setTool("axis") },
    { t: "วาดหลังคาให้ครบทุกผืน", tools: ["roof"], done: roofs.length > 0,
      d: <span>เลือกทรงที่แถบบนผัง · ทรงง่าย (ราบ เพิง จั่ว ปั้นหยา) ลากทับครั้งเดียว · หลังคาซับซ้อนเลือก <b>ทีละผืน</b> คลิกไล่มุมแต่ละผืน มุมที่ห่างกันไม่ถึง 40 ซม. ต่อกันเอง · <b>ยังไม่ต้องสนใจความชันและแผง</b></span>,
      go: () => setTool("roof") },
    { t: "ตั้งความชันและเช็กชายคา", tools: ["select"], done: roofs.length > 0 && shapeGap < 0.03 && !!wizSeen[4],
      d: <span>แตะหลังคาผืนไหนก็ได้ แล้วตั้ง <b>ความชัน</b> ครั้งเดียว ผืนที่ต่อกันจะชันเท่ากันทั้งหลัง · ผืนไหนชายคาผิดด้าน ใช้ <b>แตะเลือกขอบชายคาบนผัง</b> · แล้วกด <b>3D</b> ดูทรงแวบเดียว</span>,
      extra: shapeGap >= 0.03 && facetRoofs.length > 1 && (
        <div className="p3s-row"><span className="p3s-badge warn" style={{ flex: 1 }}>ทรงยังเพี้ยน {Math.round(shapeGap * 100)} ซม.</span>
          <button className="p3s-btn pri" onClick={() => weldNow(facetRoofs[0])}><P3SIcon name="magic" size={15} />จัดทรงทั้งหลัง</button></div>),
      act: <button className="p3s-btn wide" onClick={() => { setView3d(true); setToolRaw("select"); }}><P3Icon name="cube" />ดูทรงใน 3D</button>,
      go: () => { setTool("select"); const r = facetRoofs[0] || roofs[0]; if (r && !(sel && sel.t === "roof")) pickRoof(r); } },
    { t: "สิ่งบดบัง", tools: ["obs"], done: (st.obstacles || []).length > 0 || !!wizSeen[5], skip: true,
      d: <span>วาดแท็งก์น้ำ ช่องแสง เสา ต้นไม้ <b>ก่อนวางแผง</b> — แผงที่ทับจะถูกตัดออกเอง · ไม่มีก็กดถัดไปได้เลย</span>,
      go: () => setTool("obs") },
    { t: "วางแผง ทีละหลังคา", tools: ["panel"], done: total > 0,
      d: <span>หลังคาที่วาดไว้ยังไม่มีแผง · รุ่นแผง <b>{((st.sys || {}).panelModel) || (st.wp || 650) + " W"}</b> · แตะหลังคาแล้วกด <b>วางแผงเต็มหลังคา</b> · ตั้งเว้นรอบขอบ แนวตั้ง/นอน · แถวเอียงกด <b>ขนานชายคา</b> · แตะแผงที่ไม่ต้องการเพื่อปิด</span>,
      extra: emptyRoofs.length > 0 && roofs.length > 0 && (
        <div className="p3s-fld" style={{ gap: 5 }}><span className="lb">ยังไม่มีแผง {emptyRoofs.length} หลังคา — แตะเพื่อไปที่หลังคานั้น</span>
          <div className="chips">{emptyRoofs.slice(0, 12).map((r) => <button key={r.id} className="p3s-btn" onClick={() => { setTool("panel"); pickRoof(r); }}>{r.name || "หลังคา"}</button>)}</div></div>),
      go: () => { setTool("panel"); const r = emptyRoofs[0] || roofs[0]; if (r) pickRoof(r); } },
    { t: "ทางเดิน", tools: ["walk"], done: anyWalk || !!wizSeen[7], skip: true,
      d: <span>คลิกไล่จุดเป็นแนวทางเดิน ดับเบิลคลิกจบเส้น · แผงที่ทับแนวหายเอง จำนวนแผงและ BOQ ตรงเอง · ไม่ต้องมีก็กดถัดไป</span>,
      go: () => setTool("walk") },
    { t: "ตรวจ 3D และเงา แล้วบันทึก", tools: [], done: total > 0 && !!wizSeen[8] && !dirty,
      d: <span>หมุนดูรอบ ๆ แล้วกด <b>กวาดดูเงาทั้งวัน</b> (ตรวจเดือนธันวาคมเสมอ) · เสร็จแล้วกด <b>บันทึก</b></span>,
      act: <div className="p3s-row"><button className="p3s-btn" style={{ flex: 1 }} onClick={() => { setView3d(true); setToolRaw("select"); markSeen(8); }}><P3Icon name="cube" />ดู 3D</button>
        <button className="p3s-btn pri" style={{ flex: 1 }} disabled={!dirty} onClick={() => { markSeen(8); doSave(); }}><P3Icon name="save" />{dirty ? "บันทึก" : "บันทึกแล้ว"}</button></div>,
      go: () => { setView3d(true); setToolRaw("select"); setDraw(null); setMeasPts(null); setTrace(null); setCalib(null); markSeen(8); } },
  ];
  const wizAuto = (() => { const i = WIZ.findIndex((w) => !w.done); return i < 0 ? WIZ.length - 1 : i; })();
  const wi = wizStep != null ? wizStep : wizAuto, W0 = WIZ[wi];
  const goStep = (i) => { if (i < 0 || i >= WIZ.length) return; setWizStep(i); WIZ[i].go(); };
  const nextStep = () => { markSeen(wi); goStep(wi + 1); };
  const wizCard = wiz && (
    <div className="p3s-card p3s-wiz">
      <div className="p3s-h"><span className="t">พาทำทีละขั้น · ขั้น {wi + 1}/{WIZ.length}</span>
        <button className="p3s-btn ghost" style={{ marginLeft: "auto", height: 24, padding: "0 8px", fontSize: 11 }} onClick={() => setWiz(false)} title="ปิดโหมดพาทำ">ปิด</button></div>
      <div className="dots">{WIZ.map((w, i) => <button key={i} className="dot" data-on={i === wi ? "1" : "0"} data-done={w.done ? "1" : "0"} title={w.t} onClick={() => goStep(i)}>{w.done && i !== wi ? "✓" : i + 1}</button>)}</div>
      <span className="wt">{wi + 1}. {W0.t}{W0.done ? " ✓" : ""}</span>
      <span className="wd">{W0.d}</span>
      {W0.extra || null}
      {W0.act || null}
    </div>
  );
  const wizNav = wiz && (
    <div className="p3s-wiznav">
      <div className="p3s-row">
        <button className="p3s-btn" disabled={wi === 0} onClick={() => goStep(wi - 1)}>← ย้อน</button>
        {wi < WIZ.length - 1
          ? <button className={"p3s-btn" + (W0.done || W0.skip ? " pri" : "")} style={{ flex: 1 }} onClick={nextStep}>{!W0.done && W0.skip ? "ข้าม · " : "ถัดไป · "}{WIZ[wi + 1].t} →</button>
          : <span className="p3s-note" style={{ flex: 1, textAlign: "right" }}>{WIZ.every((w) => w.done || w.skip) ? "เสร็จครบทุกขั้น" : "ยังมีขั้นที่ไม่เสร็จ — ดูเลขที่ไม่มี ✓"}</span>}
      </div>
      {!W0.done && !W0.skip && wi < WIZ.length - 1 && <span className="p3s-note">ขั้นนี้ยังไม่เสร็จ — ไปต่อได้ แต่ถ้ากลับมาแก้ทีหลังอาจต้องจัดแผงใหม่</span>}
    </div>
  );
  const wizTools = wiz && !view3d ? W0.tools : null;
  wizAllowRef.current = wiz ? (W0.tools.length ? ["pan"].concat(W0.tools, wi >= 3 ? ["select", "meas"] : []) : ["select", "pan", "meas"]) : null;

  const guidePanel = (
    <React.Fragment>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickPhoto} />
      {wiz ? null : <div className="p3s-card">
        <div className="p3s-h"><span className="t">ขั้นตอน</span>
          <button className="p3s-btn pri" style={{ marginLeft: "auto", height: 26, padding: "0 10px", fontSize: 11.5 }} onClick={() => { setWiz(true); setWizStep(null); }}>พาทำทีละขั้น</button></div>
        {[
          { done: !!(st.baseMap || st.photo), t: "ภาพมุมสูง", d: "ภาพดาวเทียมจากแผนที่ หรือรูปโดรน (ข้ามได้ถ้าวาดจากขนาดที่วัดมา)",
            act: <div className="p3s-row"><button className="p3s-btn" onClick={() => setMapOpen(true)}><P3Icon name="map" />ดาวเทียม</button><button className="p3s-btn" onClick={() => fileRef.current && fileRef.current.click()}><P3Icon name="camera" />รูปโดรน</button></div> },
          { done: axisDeg != null, t: "ตั้งแนวหลังคา", d: "ให้ผังหมุนตามอาคารจริง — กดหาแนวอัตโนมัติ หรือลากเส้นทับขอบชายคา",
            act: <button className="p3s-btn" onClick={() => setTool("axis")}><P3SIcon name="axis" size={16} />ตั้งแนว (A)</button> },
          { done: roofs.length > 0, t: "วาดหลังคา", d: "เลือกทรง ราบ/เพิง/จั่ว/ปั้นหยา หรือวาดทีละผืน แล้วลากทับ — หรือแตะกลางหลังคาให้ระบบหาขอบ",
            act: <button className="p3s-btn" onClick={() => setTool("roof")}><P3SIcon name="polygon" size={16} />วาดหลังคา (R)</button> },
          { done: total > 0, t: "วางแผง + ทางเดิน", d: "แผงเติมเต็มให้เอง จัดเป็นกลุ่มเว้นทางเดิน หรือวาดทางเดินเอง (W) แล้วแตะปิดแผงที่ไม่ต้องการ",
            act: <button className="p3s-btn" onClick={() => setTool("panel")}><P3SIcon name="panel" size={16} />จัดแผง (P)</button> },
          { done: false, t: "ตรวจ 3D และเงา", d: "หมุนดูรอบ ๆ และกวาดดูเงาทั้งวัน แล้วกดบันทึก",
            act: <button className="p3s-btn" onClick={() => { setView3d(true); setToolRaw("select"); }}><P3Icon name="cube" />ดู 3D</button> },
        ].map((s, i) => (
          <div key={i} className="p3s-step" data-done={s.done ? "1" : "0"}>
            <span className="no">{s.done ? "✓" : i + 1}</span>
            <div className="bd"><span className="tt">{s.t}</span><span className="ds">{s.d}</span>{s.act}</div>
          </div>
        ))}
      </div>}
      <div className="p3s-card">
        <div className="p3s-h"><span className="t">รุ่นแผง</span><span className="p3s-badge">{st.wp || 650} W</span></div>
        <P3PanelPick model={(st.sys || {}).panelModel} onPick={setPanelModel} />
        <P3SNum label="กำลังแผง" unit="W/แผง" step={5} min={100} max={1000} digits={0} value={+st.wp || 650} onChange={(v) => commit({ wp: v }, "wp")} />
      </div>
      {roofs.length > 0 && (
        <div className="p3s-card">
          <div className="p3s-h"><span className="t">หลังคาทั้งหมด ({roofs.length})</span></div>
          <div className="p3s-list">
            {roofs.map((r) => (
              <button key={r.id} className="p3s-li" onClick={() => { setSel({ t: "roof", id: r.id }); const c = p3sRoofCenter(r); setView(Object.assign({}, viewRef.current, { cx: c.x, cz: c.z })); }}>
                <P3Icon name="roof" />{r.name || "หลังคา"}<small>{roofCountOf(r)} แผง</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </React.Fragment>
  );

  const sunPanel = (
    <div className="p3s-card">
      <span className="p3s-ttl2"><P3Icon name="sunShadow" size={17} />แดดและเงา</span>
      <P3SRange label="เดือน" right={["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][(st.sun.month || 4) - 1]}
        min={1} max={12} step={1} value={st.sun.month || 4} onChange={(v) => commit((s) => Object.assign({}, s, { sun: Object.assign({}, s.sun, { month: v }) }), "smon")} />
      <P3SRange label="เวลา" right={(() => { const h = sun.hour, hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + ":" + (mm < 10 ? "0" : "") + mm + " น."; })()}
        min={6} max={18.5} step={0.25} value={sun.hour} onChange={(v) => { setSunHour(null); commit((s) => Object.assign({}, s, { sun: Object.assign({}, s.sun, { hour: v }) }), "shour"); }} />
      <button className={"p3s-btn wide" + (sunHour != null ? " pri" : "")} onClick={() => setSunHour(sunHour != null ? null : 6)}>
        <P3Icon name={sunHour != null ? "pause" : "play"} />{sunHour != null ? "หยุด" : "กวาดดูเงาทั้งวัน (6:00–18:30)"}</button>
      <span className="p3s-note">เดือนธันวาคมแดดอ้อมใต้มากที่สุด เงาต้นไม้/อาคารจะยาวสุด — ตรวจเดือนนี้ไว้เสมอ</span>
    </div>
  );

  const oldNote = onSwitch && (
    <div className="p3s-card" style={{ background: "transparent", boxShadow: "none", padding: "4px 2px" }}>
      <span className="p3s-note">ส่งออก DXF/ชุดแบบ · ออกแบบระบบไฟ · โดม/กลุ่มหลังคา/เชื่อมความสูงมุม ยังอยู่ใน<b> แบบเก่า</b> — ข้อมูลชุดเดียวกัน สลับไปมาได้</span>
      <button className="p3s-btn wide" onClick={trySwitch}><P3SIcon name="swap" size={15} />เปิดแบบเก่า</button>
    </div>
  );

  const axisPanel = (
    <div className="p3s-card">
      <span className="p3s-ttl2"><P3SIcon name="axis" size={17} />แนวหลังคา (เส้นนำสายตา)</span>
      <span className="p3s-note">อาคารจริงแทบไม่เคยวางตรงทิศเหนือ–ใต้ ตั้งแนวก่อนวาด แล้ว<b>ผังจะหมุนให้หลังคาตรงจอ</b> — ลากสี่เหลี่ยม เส้นฉาก กริด และการดูดแนว จะตามแนวนี้ทั้งหมด ทิศจริงของแผงยังคิดถูกเสมอ</span>
      <div className="p3s-stat"><div style={{ gridColumn: "1 / -1" }}><div className="l">แนวปัจจุบัน</div><div className="v">{axisDeg != null ? p3sR(axisDeg, 10) + "°" : "ยังไม่ตั้ง"}</div></div></div>
      {axisMsg && <span className="p3s-note"><b>{axisMsg}</b></span>}
      <button className="p3s-btn pri big wide" disabled={!((st.baseMap && st.baseMap.url) || st.photo)} onClick={autoAxis}><P3SIcon name="magic" size={17} />หาแนวจากภาพอัตโนมัติ</button>
      <span className="p3s-note">• <b>อัตโนมัติ</b>: เลื่อนให้หลังคาอยู่กลางจอแล้วกด — ระบบอ่านทิศของเส้นขอบทั้งหมดในภาพ (ไม่ขึ้นกับสีหลังคา)<br />• <b>ลากเอง</b>: ลากเส้นทับขอบชายคาที่ยาวที่สุดในภาพ<br />• <b>จากหลังคา</b>: เลือกหลังคาที่วาดแล้ว กด "ใช้หลังคานี้เป็นแนวอ้างอิง"</span>
      {axisDeg != null && (
        <React.Fragment>
          <P3SNum label="ปรับแนวละเอียด" unit="°" step={0.5} min={-45} max={45} digits={1} value={axisDeg} onChange={(v) => setAxis(v)} />
          <div className="p3s-row">
            <button className={"p3s-btn" + (alignView ? " pri" : "")} style={{ flex: 1 }} onClick={() => setAlignView((v) => !v)}>{alignView ? "ผังหมุนตามแนว" : "ทิศเหนือขึ้นบน"}</button>
            <button className="p3s-btn dngr" onClick={() => setAxis(null)}>ล้างแนว</button>
          </div>
          <button className="p3s-btn wide" onClick={() => setTool("roof")}><P3SIcon name="polygon" size={16} />ไปวาดหลังคา (R)</button>
        </React.Fragment>
      )}
    </div>
  );
  const walkSel = selWalk ? (() => { const r = roofs.find((x) => x.id === selWalk.roofId); const wk = r && (r.walks || []).find((x) => x.id === selWalk.id); return wk ? { r, wk } : null; })() : null;
  const walkPanel = (
    <div className="p3s-card">
      <span className="p3s-ttl2"><P3SIcon name="walk" size={17} />ทางเดินบนหลังคา</span>
      <span className="p3s-note">คลิกไล่จุดเป็นแนวทางเดิน/ทางซ่อมบำรุง ดับเบิลคลิกหรือ Enter จบเส้น · แผงที่ทับแนวจะถูกเอาออกให้เอง (นับแผงตามจริง) · ย้ายหรือหมุนหลังคา ทางเดินตามไปด้วย</span>
      {!walkSel && <P3SNum label="ความกว้างทางเดินใหม่" unit="ม." step={0.1} min={0.2} max={5} value={walkW} onChange={setWalkW} />}
      {walkSel && (
        <React.Fragment>
          <span className="p3s-badge warn">ทางเดินบน {walkSel.r.name || "หลังคา"} · ยาว {fmtM(p3MeasLen({ pts: walkSel.wk.pts || [] }))}</span>
          <P3SNum label="กว้าง" unit="ม." step={0.1} min={0.2} max={5} value={+walkSel.wk.w || 0.6} onChange={(v) => patchWalk(walkSel.r.id, walkSel.wk.id, { w: v }, "ww")} />
          <button className="p3s-btn dngr wide" onClick={() => delWalk(walkSel.r.id, walkSel.wk.id)}><P3Icon name="trash" />ลบทางเดินนี้</button>
        </React.Fragment>
      )}
      <span className="p3s-note">อยากเว้นทางเดินเป็นช่วงเท่า ๆ กันทั้งผืน ใช้ <b>จัดเป็นกลุ่ม + เว้นทางเดิน</b> ในการ์ดแผงของหลังคาแทน</span>
    </div>
  );

  let sideBody;
  if (view3d) sideBody = <React.Fragment>{sunPanel}{selRoof ? roofPanelBody(selRoof) : null}</React.Fragment>;
  else if (tool === "bg") sideBody = bgPanel;
  else if (tool === "axis") sideBody = axisPanel;
  else if (tool === "walk") sideBody = <React.Fragment>{walkPanel}{selRoof ? roofPanelBody(selRoof) : null}</React.Fragment>;
  else if (selRoof) sideBody = roofPanelBody(selRoof);
  else if (selObs) sideBody = obsPanelBody(selObs);
  else if (selMeas) sideBody = measPanelBody(selMeas);
  else if (tool === "roof") sideBody = (
    <div className="p3s-card">
      <span className="p3s-ttl2"><P3SIcon name="polygon" size={17} />วาดหลังคา</span>
      <span className="p3s-note">เลือกรูปร่างและทรงที่แถบบนผัง แล้ววาดทับภาพ — ความสูง ความชัน ทิศ แก้ทีหลังได้ที่นี่หลังวาดเสร็จ</span>
      <span className="p3s-note">• <b>จั่ว / ปั้นหยา</b> = ลากทแยงทับตัวหลังคา (สันอยู่ด้านยาว สลับได้ทีหลัง)<br />• <b>ทีละผืน</b> = หลังคาซับซ้อน (ตัว L ตัว T จั่วซ้อน) คลิกมุมทีละผืนลาด ผืนติดกันดูดขอบร่วมพอดี ระบบเลือกขอบชายคาให้<br />• <b>คลิก 3 ครั้ง</b> = สี่เหลี่ยมเอียงตามขอบในภาพ<br />• <b>✨ หาขอบอัตโนมัติ</b> = แตะกลางหลังคา ระบบยิงหาขอบ 4 ทิศ ไม่ขึ้นกับสีหลังคา</span>
      {axisDeg == null && !!(st.baseMap || st.photo) && <button className="p3s-btn wide" onClick={() => setTool("axis")}><P3SIcon name="axis" size={15} />ยังไม่ได้ตั้งแนวหลังคา — ตั้งก่อน (A)</button>}
      <span className="p3s-note">สัญลักษณ์: <b style={{ color: "#06b6d4" }}>◇</b> เกาะขอบในภาพ · <b style={{ color: "#d946ef" }}>○</b> เกาะมุม/ขอบหลังคา · เส้นประ = แนวฉาก · กด <b>Shift</b> = วางอิสระ</span>
      {!!(st.baseMap || st.photo) && <P3SRange label="ความสว่างภาพ" right={Math.round(imgFx.b * 100) + "%"} min={0.6} max={2.4} step={0.05} value={imgFx.b} onChange={(v) => setImgFx({ b: v, c: v > 1.2 ? 1.3 : 1 })} />}
    </div>
  );
  else sideBody = guidePanel;
  if (wizCard) sideBody = <React.Fragment>{wizCard}{sideBody}</React.Fragment>;

  /* ============== แถบบริบทบนผัง ============== */
  let ctxBar = null;
  if (!view3d && tool === "roof") {
    const rectOnly = roofOpt.kind === "gable" || roofOpt.kind === "hip", polyOnly = roofOpt.kind === "facet";
    const hasImg = !!((st.baseMap && st.baseMap.url) || st.photo);
    ctxBar = (
      <div className="p3s-float p3s-ctx" onPointerDown={(e) => e.stopPropagation()}>
        <P3SSeg value={roofOpt.kind} onChange={(v) => { setRoofOpt(Object.assign({}, roofOpt, { kind: v, shape: v === "facet" ? "poly" : v === "gable" || v === "hip" ? "rect" : roofOpt.shape })); setDraw(null); }}
          options={[["flat", "ราบ"], ["shed", "เพิง"], ["gable", "จั่ว"], ["hip", "ปั้นหยา"], ["facet", "ทีละผืน"]]} />
        {!rectOnly && !polyOnly && <P3SSeg value={roofOpt.shape} onChange={(v) => { setRoofOpt(Object.assign({}, roofOpt, { shape: v })); setDraw(null); setTrace(null); }}
          options={[["rect", "สี่เหลี่ยม"], ["poly", "หลายเหลี่ยม"]]} />}
        <button className={"p3s-btn" + (trace && trace.on ? " pri" : "")} disabled={!hasImg || polyOnly}
          title={hasImg ? "แตะกลางหลังคา ระบบยิงหาขอบให้" : "ต้องมีภาพดาวเทียมหรือรูปโดรนก่อน"}
          onClick={() => { setDraw(null); setTrace(trace && trace.on ? null : { on: true, mode: "edge" }); }}><P3SIcon name="magic" size={16} />หาขอบอัตโนมัติ</button>
        {hasImg && <button className={"p3s-btn ico" + (edgeOn ? " pri" : "")} title={edgeOn ? "ดูดขอบภาพ: เปิด" : "ดูดขอบภาพ: ปิด"} onClick={() => setEdgeOn((v) => !v)}><P3SIcon name="edge" size={16} /></button>}
        {hasImg && <button className={"p3s-btn ico" + (imgFx.b !== 1 ? " pri" : "")} title="เร่งแสงภาพ (หลังคาสีเข้มเห็นขอบชัดขึ้น)" onClick={() => setImgFx(imgFx.b !== 1 ? { b: 1, c: 1 } : { b: 1.7, c: 1.35 })}><P3SIcon name="sun" size={16} /></button>}
      </div>
    );
  } else if (!view3d && tool === "axis") {
    ctxBar = (
      <div className="p3s-float p3s-ctx" onPointerDown={(e) => e.stopPropagation()}>
        <span className="lbl">แนวหลังคา {axisDeg != null ? axisDeg + "°" : "ยังไม่ตั้ง"}</span>
        <button className="p3s-btn pri" disabled={!((st.baseMap && st.baseMap.url) || st.photo)} onClick={autoAxis}><P3SIcon name="magic" size={16} />หาแนวอัตโนมัติ</button>
        {axisDeg != null && <button className="p3s-btn" onClick={() => setAxis(null, "ล้างแนวแล้ว — กลับเป็นทิศเหนือขึ้นบน")}>ล้างแนว</button>}
      </div>
    );
  }
  const tracePop = !view3d && tool === "roof" && trace && trace.on && (trace.pts || trace.err) && (
    <div className="p3s-pop" onPointerDown={(e) => e.stopPropagation()} style={{ top: isMobile ? 104 : 64 }}>
      {trace.pts ? <span style={{ fontSize: 13.5, fontWeight: 800 }}>เจอหลังคา {trace.area} ตร.ม.{trace.warn && <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--tint-amber-tx,#92400e)", marginTop: 4 }}>{trace.warn}</span>}</span> : <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tint-amber-tx,#92400e)" }}>{trace.err}</span>}
      {trace.ax != null && <span className="p3s-note">ตั้งแนวหลังคา {trace.ax}° ให้ด้วยเมื่อกดใช้</span>}
      <P3SSeg full value={trace.mode || "edge"} onChange={(v) => { if (trace.seed) runTrace(trace.seed, traceTol, v); else setTrace({ on: true, mode: v }); }}
        options={[["edge", "ยิงหาขอบ (ทุกสี)"], ["color", "ไล่สี (สีเรียบ)"]]} />
      {trace.mode === "color" && <P3SRange label="ความไวสี" right={traceTol < 22 ? "แม่น" : traceTol > 42 ? "กว้าง" : "กลาง"} min={10} max={70} step={1} value={traceTol}
        onChange={(v) => { setTraceTol(v); if (trace.seed) runTrace(trace.seed, v); }} />}
      <div className="p3s-row">
        {trace.pts && <button className="p3s-btn pri" style={{ flex: 1 }} onClick={acceptTrace}><P3Icon name="check" />ใช้รูปนี้ (Enter)</button>}
        <button className="p3s-btn" style={{ flex: trace.pts ? "0 0 auto" : 1 }} onClick={() => setTrace({ on: true, mode: trace.mode })}>แตะใหม่</button>
      </div>
      <span className="p3s-note">ได้รูปแล้วลากจุดสี่เหลี่ยมที่ขอบ/มุมปรับให้ตรงได้เสมอ — ระหว่างลากจะดูดเข้าขอบในภาพ</span>
    </div>
  );

  const toolBtns = (
    <React.Fragment>
      {P3S_TOOLS.map((t) => (
        <button key={t.k} className="p3s-tool" data-on={tool === t.k && !view3d ? "1" : "0"}
          data-dim={toolOk(t.k) ? "0" : "1"} disabled={!toolOk(t.k)}
          data-hint={wizTools && wizTools.includes(t.k) && tool !== t.k ? "1" : "0"} onClick={() => { if (view3d) setView3d(false); setTool(t.k); }}
          title={toolOk(t.k) ? t.lb + " (" + t.key + ")" : t.lb + " — ล็อกตามขั้น กดถัดไปเมื่อขั้นนี้เสร็จ"}>
          <kbd>{t.key}</kbd><P3SIcon name={t.ic} size={21} />{t.lb}
        </button>
      ))}
    </React.Fragment>
  );

  const emptyState = !view3d && !roofs.length && !st.baseMap && !st.photo && tool === "select" && (
    <div className="p3s-empty">
      <div className="box" onPointerDown={(e) => e.stopPropagation()}>
        <h3>เริ่มจากภาพมุมสูงของหลังคา</h3>
        <p>เลือกพื้นที่จากแผนที่ดาวเทียม (ได้มาตราส่วนจริงทันที) หรืออัปโหลดรูปโดรน แล้ววาดหลังคาทับภาพ ระบบจะเติมแผงให้เอง</p>
        <button className="p3s-btn pri big" onClick={() => setMapOpen(true)}><P3Icon name="map" />เลือกจากแผนที่ดาวเทียม</button>
        <button className="p3s-btn big" onClick={() => fileRef.current && fileRef.current.click()}><P3Icon name="camera" />อัปโหลดรูปโดรน</button>
        <button className="p3s-btn ghost" onClick={() => setTool("roof")}>วาดบนพื้นเปล่า (ใช้ขนาดที่วัดมา)</button>
      </div>
    </div>
  );

  const H = hist.current;
  return (
    <div className="p3s" style={{ position: "fixed", inset: 0, zIndex: 120, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <style>{P3_CSS + P3S_CSS}</style>
      {mapOpen && <P3MapPicker initial={st.baseMap ? { lat: st.baseMap.lat, lng: st.baseMap.lng } : jobLatLng} initialQuery={jobAddr} onPick={onPickMap} onClose={() => setMapOpen(false)} />}

      <div className="p3s-head">
        <button className="p3s-btn ico ghost" onClick={tryClose} title="ปิด"><P3SIcon name="back" size={18} /></button>
        <div className="p3s-ttl">
          <div className="k">ออกแบบหลังคา & วางแผง{job && job.code ? " · " + job.code : ""}</div>
          <div className="n">{job ? job.name : ""}</div>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginRight: 6 }}>
            <span className="p3s-kpi"><b>{total}</b><span>แผง</span></span>
            <span className="p3s-kpi"><b>{kwp}</b><span>kWp</span></span>
            {goal > 0 && <span className={"p3s-badge " + (total >= goal ? "ok" : "warn")}>{total >= goal ? (total > goal ? "เกินเป้า " + (total - goal) : "ครบเป้า") : "ขาด " + (goal - total) + " แผง"}</span>}
          </div>
        )}
        <button className="p3s-btn ico" onClick={undo} disabled={!H.u.length} title="ย้อนกลับ (Ctrl+Z)"><P3SIcon name="undo" /></button>
        <button className="p3s-btn ico" onClick={redo} disabled={!H.r.length} title="ทำซ้ำ (Ctrl+Shift+Z)"><P3SIcon name="redo" /></button>
        <P3SSeg value={view3d ? "3d" : "2d"} onChange={(v) => { setView3d(v === "3d"); if (v === "3d") { setToolRaw("select"); setDraw(null); setMeasPts(null); setTrace(null); setCalib(null); } }}
          options={[["2d", isMobile ? "2D" : "ผัง 2D"], ["3d", "3D"]]} />
        <button className="p3s-btn pri" onClick={doSave} disabled={!dirty} title="บันทึก (Ctrl+S)">
          <P3Icon name={justSaved && !dirty ? "check" : "save"} />{isMobile ? "" : dirty ? "บันทึก" : justSaved ? "บันทึกแล้ว" : "บันทึกแล้ว"}
        </button>
        {!isMobile && onSwitch && <button className="p3s-btn ghost" onClick={trySwitch} title="เปิดตัวแก้แบบเก่า (ข้อมูลชุดเดียวกัน)">แบบเก่า</button>}
      </div>

      <div className="p3s-body">
        <div className="p3s-tools">
          {toolBtns}
          <div className="p3s-tsep" />
          <button className="p3s-tool" onClick={fitView} title="พอดีจอ (F)"><P3SIcon name="fit" size={20} />พอดีจอ</button>
        </div>

        <div ref={stageRef} className="p3s-stage" style={{ cursor }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}
          onPointerLeave={() => { if (!gest.current) { setHover(null); if (tool !== "roof" && tool !== "meas") setCur(null); } }}
          onContextMenu={(e) => e.preventDefault()}>
          {view3d ? <P3SView3D st={st} sun={sun} /> : (
            <svg width={Sz.w} height={Sz.h}>
              {(() => {
                /* กริดเป็นเมตรจริง วางตามแนวหลังคา (จอหมุนตามแนวแล้ว กริดจึงตรงจอ) — ถ้าไม่หมุนจอ กริดเอียงตามแนวแทน */
                const step = [0.5, 1, 2, 5, 10, 20, 50, 100].find((m) => m * V.s >= 14) || 100, P = step * V.s;
                const o = toS(0, 0), gRot = axisDeg != null && !rotRef.current ? axisDeg : 0;
                return (
                  <React.Fragment>
                    <defs>
                      <pattern id="p3sGrid" width={P} height={P} patternUnits="userSpaceOnUse" x={o.x % P} y={o.y % P}
                        patternTransform={gRot ? "rotate(" + gRot + " " + o.x + " " + o.y + ")" : undefined}>
                        <path d={"M " + P + " 0 L 0 0 0 " + P} fill="none" stroke={axisDeg != null ? "rgba(217,70,239,.16)" : "rgba(51,65,85,.12)"} strokeWidth={1} />
                      </pattern>
                    </defs>
                    <rect width={Sz.w} height={Sz.h} fill="url(#p3sGrid)" />
                  </React.Fragment>);
              })()}
              <g transform={tf}>
                {st.baseMap && st.baseMap.url && (() => { const W = +st.baseMap.widthM || 30; return <image href={st.baseMap.url} x={-W / 2} y={-W / 2} width={W} height={W} preserveAspectRatio="none" style={imgFilter} />; })()}
                {st.photo && (() => {
                  const pw = +st.photoW || 30, ph = pw * photoAR;
                  return (
                    <g transform={"translate(" + (+st.photoX || 0) + " " + (+st.photoZ || 0) + ") rotate(" + (+st.photoRot || 0) + ")"}>
                      <image href={st.photo} x={-pw / 2} y={-ph / 2} width={pw} height={ph} preserveAspectRatio="none" opacity={p3sClamp(+st.photoOpacity || 0.95, 0.15, 1)} style={imgFilter} />
                      {tool === "bg" && <rect x={-pw / 2} y={-ph / 2} width={pw} height={ph} fill="none" stroke="#2563eb" strokeWidth={1.6} strokeDasharray="6 4" style={NS} />}
                    </g>);
                })()}
                <g opacity={tool === "bg" ? 0.45 : 1}>
                  {roofEls}
                  {panelEls}
                  {groupEls}
                  {blkFrame}
                  {obsEls}
                  {measEls}
                </g>
              </g>
              {labels}
              {preview}
              {handleEls}
            </svg>
          )}
          {ctxBar}
          {tracePop}
          {emptyState}
          {!view3d && (
            <button className="p3s-north" onPointerDown={(e) => e.stopPropagation()} onClick={() => axisDeg != null && setAlignView((v) => !v)}
              title={axisDeg != null ? (rotRef.current ? "ผังหมุนตามแนวหลังคา " + axisDeg + "° — แตะเพื่อให้ทิศเหนือขึ้นบน" : "แตะเพื่อหมุนผังตามแนวหลังคา") : "ทิศเหนือ"}
              style={{ border: 0, cursor: axisDeg != null ? "pointer" : "default", pointerEvents: "auto" }}>
              <svg width="22" height="26" viewBox="0 0 22 26" style={{ transform: "rotate(" + (-rotDeg) + "deg)", transition: "transform .25s" }}><path d="M11 1 17 15H5z" fill="#e11d48" /><path d="M11 25 17 15H5z" fill="#94a3b8" /><text x="11" y="13" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff">N</text></svg>
              {axisDeg != null && <span style={{ position: "absolute", bottom: -17, fontSize: 10, fontWeight: 800, color: "#86198f", textShadow: "0 0 3px #fff,0 0 3px #fff", whiteSpace: "nowrap" }}>แนว {axisDeg}°</span>}
            </button>
          )}
          <div className="p3s-hint">{hint}</div>
          {!view3d && <div className="p3s-scale"><span>{scaleBar.L} ม.</span><i style={{ width: scaleBar.px }} /></div>}
          {!view3d && (
            <div className="p3s-float p3s-zoom" onPointerDown={(e) => e.stopPropagation()}>
              <button className="p3s-btn ico ghost" onClick={() => zoomAt({ x: Sz.w / 2, y: Sz.h / 2 }, 1.3)} title="ซูมเข้า (+)"><P3Icon name="plus" /></button>
              <button className="p3s-btn ico ghost" onClick={() => zoomAt({ x: Sz.w / 2, y: Sz.h / 2 }, 1 / 1.3)} title="ซูมออก (−)"><P3SIcon name="minus" /></button>
              <button className="p3s-btn ico ghost" onClick={() => fitView()} title="พอดีจอ (F)"><P3SIcon name="fit" /></button>
              <button className={"p3s-btn ico " + (lockRoofs ? "pri" : "ghost")} onClick={() => setLockRoofs((v) => !v)}
                title={lockRoofs ? "ล็อกหลังคาอยู่ — ลากหลังคาจะเลื่อนภาพแทน" : "ล็อกหลังคา กันเผลอลากย้าย"}><P3Icon name={lockRoofs ? "lock" : "unlock"} /></button>
            </div>
          )}
        </div>

        <div className="p3s-side" data-min={isMobile && sheetMin ? "1" : "0"}>
          <button className="p3s-sheetbar" onClick={() => setSheetMin((v) => !v)}>
            <span style={{ flex: 1, textAlign: "left" }}>{total} แผง · {kwp} kWp</span>
            <span className="gr" />
            <span style={{ flex: 1, textAlign: "right" }}>{sheetMin ? "ขยาย ▲" : "ย่อ ▼"}</span>
          </button>
          {sideBody}
          {isMobile && oldNote}
          {!isMobile && !sel && tool !== "bg" && !wiz && oldNote}
          {wizNav}
        </div>
      </div>

      <div className="p3s-mbar">{toolBtns}</div>
    </div>
  );
}

/* ── ตัวเลือกแบบ: แบบใหม่เป็นค่าเริ่ม สลับไปแบบเก่าได้ตลอด (จำไว้ในเครื่อง) ── */
function Plan3DEntry(props) {
  const [ver, setVer] = React.useState(p3sPref);
  const sw = (v) => { p3sSetPref(v); setVer(v); };
  if (ver === "v1" || typeof Plan3DStudio !== "function") return <Plan3DEditor {...props} onSwitch={() => sw("v2")} />;
  return <Plan3DStudio {...props} onSwitch={() => sw("v1")} />;
}

Object.assign(window, { Plan3DEntry, Plan3DStudio, p3sTrace, p3sQuads, p3sFaces2D });
