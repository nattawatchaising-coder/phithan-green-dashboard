/* ============================================================
   PHITHAN GREEN — วางแผง 3D (Plan 3D)
   - ปั้นหลังคาสี่เหลี่ยม หรือ "วาดทรงอิสระ" ในมุมบน (คลิกมุมทีละจุดตามรูปโดรน) → แปลงเป็น 3D
   - วางแผงเป็นกริดอัตโนมัติ (ทรงอิสระ = เฉพาะในขอบเขต) แตะแผงเว้นตำแหน่ง แตะซ้ำใส่คืน
   - ลากหลังคา/สิ่งบดบังย้ายได้ · หลังคาทรงอิสระลากจุดสีเขียวปรับรูปทรงได้
   - จำลองเงาแดดจริงตามเดือน/เวลา/พิกัด (มุมเงย+ทิศดวงอาทิตย์)
   - บันทึกลง RTDB: plan3d/{jobId} · ส่งออกภาพ PNG
   Three.js โหลดแบบ lazy ครั้งแรกที่เปิด (ไม่ถ่วงโหลดหน้าหลัก)
   ============================================================ */

const P3_DEG = Math.PI / 180;
const P3_PANEL_SHORT = 1.134;  // ด้านสั้นแผงมาตรฐาน (ม.)
const P3_PANEL_LONG = 2.278;   // ด้านยาว (ม.)
const P3_PANEL_T = 0.04;       // ความหนาที่วาด
const P3_ROOF_COLORS = ["#94A3B8", "#B45309", "#64748B", "#7C8B9D"];

/* ── โหลด Three.js + OrbitControls ครั้งเดียว ── */
let _p3ThreeP = null;
function p3LoadThree() {
  if (window.THREE && window.THREE.OrbitControls) return Promise.resolve(window.THREE);
  if (_p3ThreeP) return _p3ThreeP;
  const inject = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => rej(new Error("โหลดไม่สำเร็จ: " + src));
    document.head.appendChild(s);
  });
  _p3ThreeP = inject("https://unpkg.com/three@0.147.0/build/three.min.js")
    .then(() => inject("https://unpkg.com/three@0.147.0/examples/js/controls/OrbitControls.js"))
    .then(() => window.THREE);
  _p3ThreeP.catch(() => { _p3ThreeP = null; });
  return _p3ThreeP;
}

/* ── โหลด/บันทึกโมเดลของงาน (RTDB หรือ localStorage) ── */
function usePlan3d(jobId) {
  const KEY = "sf_plan3d_" + jobId;
  const [saved, setSaved] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId) { setSaved(null); setLoading(false); return; }
    if (window.FBDB) {
      const ref = window.FBDB.ref("plan3d/" + jobId);
      const h = ref.on("value", (s) => { setSaved(s.val() || null); setLoading(false); });
      return () => ref.off("value", h);
    }
    try { const v = localStorage.getItem(KEY); setSaved(v ? JSON.parse(v) : null); } catch (e) { setSaved(null); }
    setLoading(false);
  }, [jobId]);
  const save = React.useCallback((data) => {
    if (!jobId) return;
    if (window.FBDB) window.FBDB.ref("plan3d/" + jobId).set(data);
    else { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} setSaved(data); }
  }, [jobId]);
  return { saved, loading, save };
}

let _p3Seq = 0;
const p3Id = (p) => (p || "x") + Date.now().toString(36) + (_p3Seq++);

function p3NewRoof(n) {
  return { id: p3Id("r"), kind: "rect", name: "หลังคา " + n, x: 0, z: 0, w: 8, d: 5, pitch: 15, az: 180, h: 3.2,
    color: P3_ROOF_COLORS[(n - 1) % P3_ROOF_COLORS.length],
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {} };
}
/* หลังคาจั่ว: สันหลังคากลาง ลาด 2 ด้าน (A หันทิศ az, B หันตรงข้าม) */
function p3NewGable(n) {
  return { id: p3Id("r"), kind: "gable", name: "หลังคา " + n, x: 0, z: 0, ridge: 8, span: 8, pitch: 20, az: 180, h: 3.2,
    color: P3_ROOF_COLORS[(n - 1) % P3_ROOF_COLORS.length],
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {}, sideA: true, sideB: true };
}
/* หลังคาปั้นหยา: 4 ผืนลาดชนสันกลาง (คางหมู A/B + สามเหลี่ยม C/D) — ผืนต่อกันสนิทอัตโนมัติ */
function p3NewHip(n) {
  return { id: p3Id("r"), kind: "hip", name: "หลังคา " + n, x: 0, z: 0, w: 10, d: 7, pitch: 30, az: 180, h: 3.2,
    color: P3_ROOF_COLORS[(n - 1) % P3_ROOF_COLORS.length],
    orient: "portrait", rows: 0, cols: 0, gap: 0.02, margin: 0.3, skips: {},
    sideA: true, sideB: true, sideC: false, sideD: false };
}
/* ผืนทั้ง 4 ของปั้นหยา (พิกัดผิวลาดต่อผืน + การหมุน/ตำแหน่งของแต่ละผืน) */
function p3HipFaces(roof) {
  const pitchR = (+roof.pitch || 0) * P3_DEG;
  const cosP = Math.max(0.25, Math.cos(pitchR));
  const w = Math.max(1, +roof.w || 10), d = Math.max(1, +roof.d || 7);
  const half = d / 2, SL = half / cosP, r = Math.max(0.02, w - d);
  const rise = half * Math.tan(pitchR);
  const trap = [{ x: -w / 2, z: 0 }, { x: w / 2, z: 0 }, { x: r / 2, z: -SL }, { x: -r / 2, z: -SL }];
  const tri = [{ x: -half, z: 0 }, { x: half, z: 0 }, { x: 0, z: -SL }];
  return {
    cosP, w, d, half, SL, r, rise,
    faces: [
      { side: "A", wrapY: 0, tiltZ: half, poly: trap },
      { side: "B", wrapY: Math.PI, tiltZ: half, poly: trap },
      { side: "C", wrapY: -Math.PI / 2, tiltZ: w / 2, poly: tri },
      { side: "D", wrapY: Math.PI / 2, tiltZ: w / 2, poly: tri },
    ],
  };
}
function p3Blank(job) {
  return {
    groundW: 40, photo: null, photoW: 30, photoOpacity: 0.95, wp: 650,
    roofs: [p3NewRoof(1)], obstacles: [],
    sun: { month: 4, day: 15, hour: 12, lat: 13.75, lng: 100.5 },
  };
}

/* ── ตำแหน่งดวงอาทิตย์ (ประมาณการ ใช้เพื่อจำลองเงา) → { alt, az } องศา ── */
function p3SunPos(sun) {
  const N = Math.min(365, Math.max(1, Math.round((sun.month - 1) * 30.4 + sun.day)));
  const decl = 23.44 * Math.sin(2 * Math.PI * (284 + N) / 365);
  const solarHour = sun.hour + ((+sun.lng || 100.5) - 105) / 15; // เทียบเวลาไทย (UTC+7 → 105°E)
  const H = 15 * (solarHour - 12);
  const lat = (+sun.lat || 13.75) * P3_DEG, d = decl * P3_DEG, h = H * P3_DEG;
  const sinAlt = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(d) - sinAlt * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) || 1e-9))));
  if (H > 0) az = 2 * Math.PI - az;
  return { alt: alt / P3_DEG, az: az / P3_DEG };
}

/* ── geometry helpers (หลังคาทรงอิสระ) ── */
function p3InPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, zi = pts[i].z, xj = pts[j].x, zj = pts[j].z;
    if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / ((zj - zi) || 1e-9) + xi)) inside = !inside;
  }
  return inside;
}
function p3Area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x + pts[i].x) * (pts[j].z - pts[i].z);
  return Math.abs(a / 2);
}
/* พิกัดผิวหลังคาทรงอิสระ: หมุนตามทิศ → เลื่อนชายคาไป z=0 → ยืดตามลาด (1/cosP)
   ทำให้เงา/ภาพฉายมุมบนตรงกับขอบเขตที่วาดบนรูปโดรนพอดี */
function p3SurfInfo(roof) {
  const rot = (((+roof.az || 180) - 180) * P3_DEG);
  const cosP = Math.max(0.25, Math.cos((+roof.pitch || 0) * P3_DEG));
  const loc = (roof.pts || []).map((p) => ({
    x: (+p.x || 0) * Math.cos(rot) + (+p.z || 0) * Math.sin(rot),
    z: -(+p.x || 0) * Math.sin(rot) + (+p.z || 0) * Math.cos(rot),
  }));
  if (!loc.length) return { loc: [], surf: [], zoff: 0, cosP };
  const zoff = Math.max.apply(null, loc.map((p) => p.z));
  const surf = loc.map((p) => ({ x: p.x, z: (p.z - zoff) / cosP }));
  return { loc, surf, zoff, cosP };
}

/* วางกริดแผงภายในผืนโพลิกอน (พิกัดผิวลาด, ชายคาที่ z=0 ขึ้นไปทาง -z) */
function p3FillPoly(out, poly, o) {
  const xs = poly.map((p) => p.x), zs = poly.map((p) => p.z);
  const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minZ = Math.min.apply(null, zs);
  const { pw, pd, gap, m } = o;
  const maxCols = Math.max(0, Math.floor(((maxX - minX) - 2 * m + gap) / (pw + gap)));
  const maxRows = Math.max(0, Math.floor(((-minZ) - 2 * m + gap) / (pd + gap)));
  out.maxCols = Math.max(out.maxCols, maxCols);
  out.maxRows = Math.max(out.maxRows, maxRows);
  if (o.enabled === false) return 0;
  let count = 0;
  const mi = m - 0.02; // หดจุดทดสอบเล็กน้อย กันตกบนเส้นขอบพอดี (point-on-edge)
  for (let r = 0; r < maxRows; r++) for (let c = 0; c < maxCols; c++) {
    const x1 = minX + m + c * (pw + gap), x2 = x1 + pw;
    const z2 = -m - r * (pd + gap), z1 = z2 - pd;
    const test = [[x1 - mi, z1 - mi], [x2 + mi, z1 - mi], [x1 - mi, z2 + mi], [x2 + mi, z2 + mi],
      [(x1 + x2) / 2, z1 - mi], [(x1 + x2) / 2, z2 + mi], [x1 - mi, (z1 + z2) / 2], [x2 + mi, (z1 + z2) / 2]];
    if (!test.every((t) => p3InPoly(t[0], t[1], poly))) continue;
    const key = (o.prefix || "") + r + "_" + c, skip = !!o.skips[key];
    out.list.push({ key, side: o.side, x: (x1 + x2) / 2, z: (z1 + z2) / 2, skip });
    if (!skip) { count++; out.count++; }
  }
  return count;
}

/* ── คำนวณตำแหน่งแผงบนหลังคา (rect + gable + hip + poly) →
   { pw, pd, list:[{key,side,x,z,skip}], count, maxRows, maxCols, surfInfo } ── */
function p3Panels(roof) {
  const pw = roof.orient === "portrait" ? P3_PANEL_SHORT : P3_PANEL_LONG;
  const pd = roof.orient === "portrait" ? P3_PANEL_LONG : P3_PANEL_SHORT;
  const gap = +roof.gap || 0.02, m = +roof.margin || 0;
  const skips = roof.skips || {};
  const out = { pw, pd, gap, list: [], count: 0, maxRows: 0, maxCols: 0, surfInfo: null };

  if (roof.kind === "hip") {
    const H = p3HipFaces(roof);
    out.hip = H;
    H.faces.forEach((f) => {
      out["count" + f.side] = p3FillPoly(out, f.poly, {
        pw, pd, gap, m, skips, prefix: f.side + "_", side: f.side,
        enabled: roof["side" + f.side] !== false,
      });
    });
    return out;
  }

  if (roof.kind === "gable") {
    // ── จั่ว: ลาด 2 ด้านเท่ากัน แชร์สันหลังคา · กริดคิดต่อด้าน ──
    const cosP = Math.max(0.25, Math.cos((+roof.pitch || 0) * P3_DEG));
    const half = (+roof.span || 8) / 2, slopeLen = half / cosP;
    const availW = (+roof.ridge || 8) - 2 * m, availD = slopeLen - 2 * m;
    out.maxCols = Math.max(0, Math.floor((availW + gap) / (pw + gap)));
    out.maxRows = Math.max(0, Math.floor((availD + gap) / (pd + gap)));
    const cols = roof.cols > 0 ? Math.min(roof.cols, out.maxCols) : out.maxCols;
    const rows = roof.rows > 0 ? Math.min(roof.rows, out.maxRows) : out.maxRows;
    const gridW = cols * pw + (cols - 1) * gap, gridD = rows * pd + (rows - 1) * gap;
    const x0 = -gridW / 2, z0 = -m - gridD;
    out.slopeLen = slopeLen; out.countA = 0; out.countB = 0;
    ["A", "B"].forEach((side) => {
      if (side === "A" ? roof.sideA === false : roof.sideB === false) return;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const key = side + "_" + r + "_" + c, skip = !!skips[key];
        out.list.push({ key, side, x: x0 + c * (pw + gap) + pw / 2, z: z0 + r * (pd + gap) + pd / 2, skip });
        if (!skip) { out.count++; if (side === "A") out.countA++; else out.countB++; }
      }
    });
    return out;
  }

  if (roof.kind === "poly" && Array.isArray(roof.pts) && roof.pts.length >= 3) {
    const info = p3SurfInfo(roof);
    out.surfInfo = info;
    const xs = info.surf.map((p) => p.x), zs = info.surf.map((p) => p.z);
    const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minZ = Math.min.apply(null, zs);
    out.maxCols = Math.max(0, Math.floor(((maxX - minX) - 2 * m + gap) / (pw + gap)));
    out.maxRows = Math.max(0, Math.floor(((-minZ) - 2 * m + gap) / (pd + gap)));
    const mi = m - 0.02; // หดจุดทดสอบเล็กน้อย กันตกบนเส้นขอบพอดี
    for (let r = 0; r < out.maxRows; r++) for (let c = 0; c < out.maxCols; c++) {
      const x1 = minX + m + c * (pw + gap), x2 = x1 + pw;
      const z2 = -m - r * (pd + gap), z1 = z2 - pd;
      // ทดสอบ 8 จุดรอบแผง (ขยายด้วยระยะขอบ) ต้องอยู่ในขอบเขตที่วาดทั้งหมด
      const test = [[x1 - mi, z1 - mi], [x2 + mi, z1 - mi], [x1 - mi, z2 + mi], [x2 + mi, z2 + mi],
        [(x1 + x2) / 2, z1 - mi], [(x1 + x2) / 2, z2 + mi], [x1 - mi, (z1 + z2) / 2], [x2 + mi, (z1 + z2) / 2]];
      if (!test.every((t) => p3InPoly(t[0], t[1], info.surf))) continue;
      const key = r + "_" + c, skip = !!skips[key];
      out.list.push({ key, x: (x1 + x2) / 2, z: (z1 + z2) / 2, skip });
      if (!skip) out.count++;
    }
    return out;
  }

  // ── สี่เหลี่ยม (แบบเดิม) ──
  const availW = roof.w - 2 * m, availD = roof.d - 2 * m;
  const maxCols = Math.max(0, Math.floor((availW + gap) / (pw + gap)));
  const maxRows = Math.max(0, Math.floor((availD + gap) / (pd + gap)));
  const cols = roof.cols > 0 ? Math.min(roof.cols, maxCols) : maxCols;
  const rows = roof.rows > 0 ? Math.min(roof.rows, maxRows) : maxRows;
  const gridW = cols * pw + (cols - 1) * gap, gridD = rows * pd + (rows - 1) * gap;
  const x0 = -gridW / 2, z0 = -m - gridD;
  out.maxRows = maxRows; out.maxCols = maxCols;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const key = r + "_" + c, skip = !!skips[key];
    out.list.push({ key, x: x0 + c * (pw + gap) + pw / 2, z: z0 + r * (pd + gap) + pd / 2, skip });
    if (!skip) out.count++;
  }
  return out;
}
function p3CountAll(st) { return (st.roofs || []).reduce((s, r) => s + p3Panels(r).count, 0); }

/* ============================================================
   Plan3DEditor — โหมดเต็มจอ
   ============================================================ */
function Plan3DEditor({ job, onClose, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const { saved, loading, save } = usePlan3d(job ? job.id : null);

  const [ready, setReady] = React.useState(false);   // Three.js โหลดแล้ว
  const [loadErr, setLoadErr] = React.useState(null);
  const [st, setSt] = React.useState(() => p3Blank(job));
  const [selRoof, setSelRoof] = React.useState(null);   // roof id
  const [selObs, setSelObs] = React.useState(null);     // obstacle id
  const [tab, setTab] = React.useState("roof");         // roof | photo | obstacle | sun
  const [dirty, setDirty] = React.useState(false);
  const [animating, setAnimating] = React.useState(false);
  const [drawing, setDrawing] = React.useState(false);  // โหมดวาดหลังคาทรงอิสระ
  const [drawPts, setDrawPts] = React.useState([]);     // จุดที่วาด (world x,z)
  const loadedRef = React.useRef(false);

  const set = (patch) => { setSt((p) => Object.assign({}, p, patch)); setDirty(true); };
  const setSun = (patch) => { setSt((p) => Object.assign({}, p, { sun: Object.assign({}, p.sun, patch) })); setDirty(true); };
  const patchRoof = (id, patch) => { setSt((p) => Object.assign({}, p, { roofs: p.roofs.map((r) => r.id === id ? Object.assign({}, r, patch) : r) })); setDirty(true); };
  /* แก้หลายผืนพร้อมกันใน state เดียว (ใช้ตอนลากทั้งกลุ่ม) — ups = { roofId: patch } */
  const patchRoofs = (ups) => { setSt((p) => Object.assign({}, p, { roofs: p.roofs.map((r) => ups[r.id] ? Object.assign({}, r, ups[r.id]) : r) })); setDirty(true); };
  const patchObs = (id, patch) => { setSt((p) => Object.assign({}, p, { obstacles: (p.obstacles || []).map((o) => o.id === id ? Object.assign({}, o, patch) : o) })); setDirty(true); };

  /* โหลด Three.js + โหลดข้อมูลที่บันทึกไว้ */
  React.useEffect(() => { p3LoadThree().then(() => setReady(true)).catch((e) => setLoadErr(e.message)); }, []);
  React.useEffect(() => {
    if (loading || loadedRef.current) return;
    loadedRef.current = true;
    if (saved) {
      const base = p3Blank(job);
      const merged = Object.assign({}, base, saved, { sun: Object.assign({}, base.sun, saved.sun || {}) });
      merged.roofs = (saved.roofs || base.roofs).map((r) => Object.assign({}, p3NewRoof(1), r, { skips: r.skips || {}, pts: r.pts || null }));
      merged.obstacles = saved.obstacles || [];
      setSt(merged);
      if (merged.roofs[0]) setSelRoof(merged.roofs[0].id);
    } else if (st.roofs[0]) setSelRoof(st.roofs[0].id);
  }, [loading, saved]); // eslint-disable-line

  /* ── refs ของ scene ── */
  const mountRef = React.useRef(null);
  const tRef = React.useRef({});          // { renderer, scene, camera, controls, sunLight, ... }
  const stRef = React.useRef(st); stRef.current = st;
  const drawingRef = React.useRef(false); drawingRef.current = drawing;

  /* ── สร้าง scene ครั้งแรก ── */
  React.useEffect(() => {
    if (!ready || !mountRef.current) return;
    const THREE = window.THREE;
    const el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdce8f2);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
    camera.position.set(18, 16, 18);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.target.set(0, 1, 0);
    controls.enableDamping = true; controls.dampingFactor = 0.12;

    const amb = new THREE.HemisphereLight(0xcfe4ff, 0x8a795d, 0.75);
    scene.add(amb);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    const S = 45;
    sunLight.shadow.camera.left = -S; sunLight.shadow.camera.right = S;
    sunLight.shadow.camera.top = S; sunLight.shadow.camera.bottom = -S;
    sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 220;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight); scene.add(sunLight.target);

    const dyn = new THREE.Group();  // ส่วนที่ rebuild ตาม state
    scene.add(dyn);

    Object.assign(tRef.current, { THREE, renderer, scene, camera, controls, sunLight, amb, dyn, el });

    const onResize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    onResize();
    const ro = new ResizeObserver(onResize); ro.observe(el);

    let run = true;
    const loop = () => { if (!run) return; controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);

    return () => { run = false; ro.disconnect(); controls.dispose(); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); };
  }, [ready]);

  /* ── rebuild วัตถุตาม state (พื้น/หลังคา/แผง/สิ่งบดบัง/เส้นวาด) ── */
  React.useEffect(() => {
    const t = tRef.current; if (!t.dyn) return;
    const THREE = t.THREE;
    // เคลียร์ของเดิม
    while (t.dyn.children.length) {
      const c = t.dyn.children[0];
      t.dyn.remove(c);
      c.traverse && c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } });
    }
    t.pickRoofs = []; t.pickPanels = []; t.pickObs = []; t.pickVerts = [];

    const G = +st.groundW || 40;
    // พื้น
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(G * 2.4, G * 2.4), new THREE.MeshLambertMaterial({ color: 0xb9c4a5 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
    t.dyn.add(ground);

    // รูปโดรนวางบนพื้น (สเกลจาก photoW)
    if (st.photo) {
      const tex = new THREE.TextureLoader().load(st.photo, () => {
        const img = tex.image; if (!img) return;
        const pw = +st.photoW || 30, ph = pw * (img.height / img.width);
        photoMesh.geometry.dispose();
        photoMesh.geometry = new THREE.PlaneGeometry(pw, ph);
      });
      tex.anisotropy = 4;
      const photoMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: Math.max(0.15, Math.min(1, +st.photoOpacity || 0.95)) });
      const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(+st.photoW || 30, +st.photoW || 30), photoMat);
      photoMesh.rotation.x = -Math.PI / 2; photoMesh.position.y = 0.0;
      photoMesh.receiveShadow = true;
      t.dyn.add(photoMesh);
    } else {
      const grid = new THREE.GridHelper(G, G, 0x8898a8, 0xaab8c6);
      grid.position.y = 0.01; t.dyn.add(grid);
    }

    // เข็มทิศ N (เหนือ = -Z)
    const mkText = (txt, color) => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 64;
      const x = cv.getContext("2d"); x.fillStyle = color; x.font = "bold 44px system-ui"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 32, 34);
      const tx = new THREE.CanvasTexture(cv);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false }));
      sp.scale.set(2.2, 2.2, 1); return sp;
    };
    const north = mkText("N", "#b91c1c"); north.position.set(0, 1.4, -G / 2 - 1.5); t.dyn.add(north);

    // ── หลังคาแต่ละผืน + แผง ──
    (st.roofs || []).forEach((roof) => {
      const isPoly = roof.kind === "poly" && Array.isArray(roof.pts) && roof.pts.length >= 3;
      const pan = p3Panels(roof);
      const selected = roof.id === selRoof;

      const g = new THREE.Group();
      g.position.set(+roof.x || 0, +roof.h || 3, +roof.z || 0);
      g.rotation.y = -(((+roof.az || 180) - 180) * P3_DEG);   // az=180 → ลาดหันทิศใต้ (+Z)
      const tilt = new THREE.Group();
      tilt.rotation.x = (+roof.pitch || 0) * P3_DEG;          // ยกปลาย -Z ขึ้น (ชายคาอยู่ z=0)
      const roofMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(roof.color || "#94A3B8"), transparent: true, opacity: 0.96, side: THREE.DoubleSide });
      let sideParent = null; // จั่ว/ปั้นหยา: แผงแยกด้าน

      if (roof.kind === "hip") {
        // ── ปั้นหยา: 4 ผืนชนสันกลาง (ต่อกันสนิท) + ผนังเดียวทั้งหลัง ──
        const H = pan.hip || p3HipFaces(roof);
        const pitchR = (+roof.pitch || 0) * P3_DEG;
        sideParent = {};
        H.faces.forEach((f) => {
          const wrap = new THREE.Group(); wrap.rotation.y = f.wrapY;
          const tiltF = new THREE.Group(); tiltF.position.set(0, 0, f.tiltZ); tiltF.rotation.x = pitchR;
          const shp = new THREE.Shape();
          f.poly.forEach((p, i) => { if (i === 0) shp.moveTo(p.x, -p.z); else shp.lineTo(p.x, -p.z); });
          const slab = new THREE.Mesh(new THREE.ShapeGeometry(shp), roofMat);
          slab.rotation.x = -Math.PI / 2; slab.position.y = -0.02;
          slab.castShadow = true; slab.receiveShadow = true;
          slab.userData = { kind: "roof", id: roof.id };
          tiltF.add(slab); t.pickRoofs.push(slab);
          const lp = f.poly.concat([f.poly[0]]).map((p) => new THREE.Vector3(p.x, 0.02, p.z));
          tiltF.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(lp),
            new THREE.LineBasicMaterial({ color: selected ? 0x16a34a : 0x475569 })));
          wrap.add(tiltF); g.add(wrap);
          sideParent[f.side] = tiltF;
        });
        // สันหลังคากลาง
        const beam = new THREE.Mesh(new THREE.BoxGeometry(H.r + 0.15, 0.12, 0.18),
          new THREE.MeshLambertMaterial({ color: 0x6b7280 }));
        beam.position.set(0, H.rise + 0.02, 0); beam.castShadow = true; g.add(beam);
        // ผนังเดียวใต้ทั้งหลัง — ให้ความรู้สึกเป็นบ้านหลังเดียว
        const wallH = new THREE.Mesh(new THREE.BoxGeometry(H.w * 0.97, +roof.h || 3, H.d * 0.97),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wallH.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallH.castShadow = true; wallH.receiveShadow = true;
        g.add(wallH);
      } else if (roof.kind === "gable") {
        // ── หลังคาจั่ว: ลาด 2 ด้านชนสันหลังคากลาง + หน้าจั่วสามเหลี่ยม ──
        const pitchR = (+roof.pitch || 0) * P3_DEG;
        const cosP = Math.max(0.25, Math.cos(pitchR));
        const half = (+roof.span || 8) / 2, slopeLen = half / cosP;
        const rise = half * Math.tan(pitchR);
        const ridgeLen = +roof.ridge || 8;
        // ด้าน A (หันทิศ az): ชายคาที่ local z=+half ลาดขึ้นไปหาสันที่ z=0
        tilt.position.set(0, 0, half);
        const slabA = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen, 0.09, slopeLen), roofMat);
        slabA.position.set(0, -0.045, -slopeLen / 2);
        slabA.castShadow = true; slabA.receiveShadow = true;
        slabA.userData = { kind: "roof", id: roof.id };
        tilt.add(slabA); t.pickRoofs.push(slabA);
        // ด้าน B (หันตรงข้าม): หมุน 180° รอบแกนตั้งแล้วใช้เรขาคณิตเดียวกัน
        const wrapB = new THREE.Group(); wrapB.rotation.y = Math.PI;
        const tiltB = new THREE.Group(); tiltB.position.set(0, 0, half); tiltB.rotation.x = pitchR;
        const slabB = slabA.clone(); slabB.userData = { kind: "roof", id: roof.id };
        tiltB.add(slabB); t.pickRoofs.push(slabB);
        wrapB.add(tiltB); g.add(wrapB);
        sideParent = { A: tilt, B: tiltB };
        // สันหลังคา (เส้นคานบนสุด)
        const ridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen + 0.15, 0.12, 0.18),
          new THREE.MeshLambertMaterial({ color: 0x6b7280 }));
        ridgeBeam.position.set(0, rise + 0.02, 0); ridgeBeam.castShadow = true; g.add(ridgeBeam);
        // หน้าจั่วสามเหลี่ยม 2 ข้าง (ระนาบตั้งฉากกับสัน)
        const triShape = new THREE.Shape();
        triShape.moveTo(-half, 0); triShape.lineTo(half, 0); triShape.lineTo(0, rise); triShape.closePath();
        const triMat = new THREE.MeshLambertMaterial({ color: 0xefe9dd, side: THREE.DoubleSide });
        [-1, 1].forEach((sgn) => {
          const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(triShape, { depth: 0.1, bevelEnabled: false }), triMat);
          tri.rotation.y = Math.PI / 2;                        // ระนาบสามเหลี่ยมขวางแกนสัน (shape x → แกน Z)
          tri.position.set(sgn * (ridgeLen / 2) - 0.05, 0, 0);
          tri.castShadow = true; tri.receiveShadow = true;
          g.add(tri);
        });
        // ผนังใต้ชายคา
        const wallG = new THREE.Mesh(new THREE.BoxGeometry(ridgeLen * 0.94, +roof.h || 3, (+roof.span || 8) * 0.94),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wallG.position.set(0, -((+roof.h || 3) / 2) - 0.02, 0);
        wallG.castShadow = true; wallG.receiveShadow = true;
        g.add(wallG);
        if (selected) [slabA, slabB].forEach((sl) => {
          const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ridgeLen + 0.1, 0.12, slopeLen + 0.1)),
            new THREE.LineBasicMaterial({ color: 0x16a34a }));
          eg.position.copy(sl.position); sl.parent.add(eg);
        });
      } else if (isPoly) {
        const info = pan.surfInfo || p3SurfInfo(roof);
        tilt.position.set(0, 0, info.zoff);
        // ผิวหลังคาตามขอบเขตที่วาด (shape y = -z เพื่อให้ rotateX(-90°) ได้ z ถูกด้าน)
        const shp = new THREE.Shape();
        info.surf.forEach((p, i) => { if (i === 0) shp.moveTo(p.x, -p.z); else shp.lineTo(p.x, -p.z); });
        const slab = new THREE.Mesh(new THREE.ShapeGeometry(shp), roofMat);
        slab.rotation.x = -Math.PI / 2;
        slab.position.y = -0.02;
        slab.castShadow = true; slab.receiveShadow = true;
        slab.userData = { kind: "roof", id: roof.id };
        tilt.add(slab); t.pickRoofs.push(slab);
        // ขอบเส้น
        const linePts = info.surf.concat([info.surf[0]]).map((p) => new THREE.Vector3(p.x, 0.02, p.z));
        tilt.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), new THREE.LineBasicMaterial({ color: selected ? 0x16a34a : 0x475569 })));
        // ผนังจาง ๆ ใต้หลังคา (ยึดตามขอบเขตแนวราบ)
        const wshp = new THREE.Shape();
        info.loc.forEach((p, i) => { if (i === 0) wshp.moveTo(p.x, -p.z); else wshp.lineTo(p.x, -p.z); });
        const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(wshp, { depth: Math.max(0.3, (+roof.h || 3) - 0.15), bevelEnabled: false }),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.45 }));
        wall.rotation.x = -Math.PI / 2;
        wall.position.y = -(+roof.h || 3);
        wall.castShadow = true; wall.receiveShadow = true;
        g.add(wall);
        // ── จุดแก้ทรง — เกาะบนมุมหลังคาจริง มองทะลุทุกชิ้น (depthTest:false) ──
        info.surf.forEach((sp, idx) => {
          if (selected) {
            // ผืนที่เลือก: จุดเขียวใหญ่ + วงขาวรอบ ให้เห็นชัด/แตะง่าย
            const halo = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 12),
              new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
            halo.position.set(sp.x, 0.12, sp.z);
            halo.renderOrder = 20;
            halo.userData = { kind: "vertex", roofId: roof.id, idx };
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 12),
              new THREE.MeshBasicMaterial({ color: 0x16a34a, depthTest: false }));
            dot.position.copy(halo.position); dot.renderOrder = 21;
            dot.userData = halo.userData;
            tilt.add(halo); tilt.add(dot);
            t.pickVerts.push(halo, dot);
          } else {
            // ผืนอื่น: จุดเทาเล็ก = เป้าให้ลากไปดูดติด (มองเห็นตลอด)
            const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8),
              new THREE.MeshBasicMaterial({ color: 0x94a3b8, depthTest: false, transparent: true, opacity: 0.85 }));
            ghost.position.set(sp.x, 0.1, sp.z);
            ghost.renderOrder = 18;
            tilt.add(ghost);
          }
        });
      } else {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(roof.w, 0.09, roof.d), roofMat);
        slab.position.set(0, -0.045, -roof.d / 2);
        slab.castShadow = true; slab.receiveShadow = true;
        slab.userData = { kind: "roof", id: roof.id };
        tilt.add(slab); t.pickRoofs.push(slab);
        // ผนังใต้หลังคาแบบจาง
        const wall = new THREE.Mesh(new THREE.BoxGeometry(roof.w * 0.92, +roof.h || 3, roof.d * 0.8),
          new THREE.MeshLambertMaterial({ color: 0xe7e2d8, transparent: true, opacity: 0.5 }));
        wall.position.set(+roof.x || 0, (+roof.h || 3) / 2 - 0.15, (+roof.z || 0));
        wall.rotation.y = g.rotation.y;
        const midLocal = new THREE.Vector3(0, 0, -roof.d / 2).applyEuler(new THREE.Euler(0, g.rotation.y, 0));
        wall.position.x += midLocal.x; wall.position.z += midLocal.z;
        wall.castShadow = true; wall.receiveShadow = true;
        t.dyn.add(wall);
        if (selected) {
          const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(roof.w + 0.1, 0.12, roof.d + 0.1)),
            new THREE.LineBasicMaterial({ color: 0x16a34a }));
          eg.position.copy(slab.position); tilt.add(eg);
        }
      }
      g.add(tilt);

      // แผง (แผงที่เว้นไว้ = โปร่งจาง แตะเพื่อใส่คืน)
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x10305e, roughness: 0.35, metalness: 0.55 });
      const ghostMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.16 });
      const frameMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
      pan.list.forEach((p) => {
        const parent = (sideParent && sideParent[p.side]) || tilt;
        const pm = new THREE.Mesh(new THREE.BoxGeometry(pan.pw - 0.02, P3_PANEL_T, pan.pd - 0.02), p.skip ? ghostMat : panelMat);
        pm.position.set(p.x, 0.06, p.z);
        if (!p.skip) { pm.castShadow = true; pm.receiveShadow = true; }
        pm.userData = { kind: "panel", roofId: roof.id, key: p.key };
        parent.add(pm); t.pickPanels.push(pm);
        if (!p.skip) {
          const fr = new THREE.Mesh(new THREE.BoxGeometry(pan.pw, 0.012, pan.pd), frameMat);
          fr.position.set(p.x, 0.028, p.z); parent.add(fr);
        }
      });
      t.dyn.add(g);
    });

    // ── สิ่งบดบัง ──
    (st.obstacles || []).forEach((o) => {
      const grp = new THREE.Group(); grp.position.set(+o.x || 0, 0, +o.z || 0);
      const selectedO = o.id === selObs;
      if (o.kind === "tree") {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, o.h * 0.45, 8), new THREE.MeshLambertMaterial({ color: 0x7c5a3a }));
        trunk.position.y = o.h * 0.225; trunk.castShadow = true; grp.add(trunk);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(Math.max(o.w, 1) / 2, 12, 10), new THREE.MeshLambertMaterial({ color: 0x3f7d44 }));
        crown.position.y = o.h * 0.45 + Math.max(o.w, 1) / 2 * 0.8; crown.castShadow = true; crown.receiveShadow = true;
        crown.userData = { kind: "obstacle", id: o.id }; grp.add(crown); t.pickObs.push(crown);
      } else {
        const bx = new THREE.Mesh(new THREE.BoxGeometry(o.w, o.h, o.d), new THREE.MeshLambertMaterial({ color: selectedO ? 0x8aa8c8 : 0x9aa8b5 }));
        bx.position.y = o.h / 2; bx.castShadow = true; bx.receiveShadow = true;
        bx.userData = { kind: "obstacle", id: o.id }; grp.add(bx); t.pickObs.push(bx);
      }
      if (selectedO) {
        const eg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(o.w + 0.1, o.h + 0.1, o.d + 0.1)), new THREE.LineBasicMaterial({ color: 0x16a34a }));
        eg.position.y = o.h / 2; grp.add(eg);
      }
      t.dyn.add(grp);
    });

    // ── เส้นตัวอย่างตอนวาดหลังคาทรงอิสระ ──
    if (drawing && drawPts.length) {
      const mat = new THREE.LineBasicMaterial({ color: 0x16a34a });
      const pts3 = drawPts.map((p) => new THREE.Vector3(p.x, 0.15, p.z));
      if (drawPts.length >= 3) pts3.push(pts3[0].clone());
      t.dyn.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3), mat));
      drawPts.forEach((p, i) => {
        const dot = new THREE.Mesh(new THREE.SphereGeometry(i === 0 ? 0.34 : 0.24, 10, 8),
          new THREE.MeshBasicMaterial({ color: i === 0 ? 0x15803d : 0x22c55e, depthTest: false }));
        dot.position.set(p.x, 0.2, p.z); dot.renderOrder = 6; t.dyn.add(dot);
      });
    }
  }, [st, selRoof, selObs, ready, drawing, drawPts]);

  /* ── อัปเดตดวงอาทิตย์/เงา ── */
  React.useEffect(() => {
    const t = tRef.current; if (!t.sunLight) return;
    const sp = p3SunPos(st.sun);
    const altR = sp.alt * P3_DEG, azR = sp.az * P3_DEG;
    const R = 80;
    // เหนือ = -Z, ตะวันออก = +X
    t.sunLight.position.set(Math.sin(azR) * Math.cos(altR) * R, Math.max(0.02, Math.sin(altR)) * R, -Math.cos(azR) * Math.cos(altR) * R);
    t.sunLight.target.position.set(0, 0, 0);
    const day = sp.alt > 0;
    t.sunLight.intensity = day ? (0.55 + 0.85 * Math.min(1, Math.sin(altR) * 1.6)) : 0;
    t.amb.intensity = day ? 0.75 : 0.28;
    if (t.scene) t.scene.background.set(day ? (sp.alt < 12 ? 0xf3d9b8 : 0xdce8f2) : 0x1d2733);
  }, [st.sun, ready]);

  /* ── animation กวาดทั้งวัน ── */
  React.useEffect(() => {
    if (!animating) return;
    let run = true;
    const step = () => {
      if (!run) return;
      setSt((p) => {
        let h = (+p.sun.hour || 12) + 0.06;
        if (h > 18.5) h = 6;
        return Object.assign({}, p, { sun: Object.assign({}, p.sun, { hour: Math.round(h * 100) / 100 }) });
      });
      raf = requestAnimationFrame(step);
    };
    let raf = requestAnimationFrame(step);
    return () => { run = false; cancelAnimationFrame(raf); };
  }, [animating]);

  /* ── โต้ตอบ: คลิกแผง = เว้น/ใส่คืน · ลากหลังคา/จุดทรง/สิ่งบดบัง = ย้าย · โหมดวาด = คลิกวางจุด ── */
  React.useEffect(() => {
    const t = tRef.current; if (!ready || !t.renderer) return;
    const THREE = t.THREE;
    const cv = t.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let down = null;

    const setRay = (ev) => {
      const rect = cv.getBoundingClientRect();
      ptr.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ptr, t.camera);
    };
    const pick = (ev) => {
      setRay(ev);
      const hitV = ray.intersectObjects(t.pickVerts || [], false)[0];
      if (hitV) return { kind: "vertex", obj: hitV.object };
      const hitP = ray.intersectObjects(t.pickPanels || [], false)[0];
      if (hitP) return { kind: "panel", obj: hitP.object };
      const hitR = ray.intersectObjects(t.pickRoofs || [], false)[0];
      if (hitR) return { kind: "roof", obj: hitR.object };
      const hitO = ray.intersectObjects(t.pickObs || [], false)[0];
      if (hitO) return { kind: "obstacle", obj: hitO.object };
      return null;
    };
    const groundPoint = () => { const v = new THREE.Vector3(); return ray.ray.intersectPlane(groundPlane, v) ? v : null; };
    // ดูดจุดเข้าหามุมหลังคาทรงอิสระผืนอื่น (รัศมี 0.45 ม.) — ให้ขอบผืนต่อกันสนิท
    const snapPt = (pt, skipRoofId, skipIdx) => {
      const stNow = stRef.current;
      let best = null, bd = 0.45;
      (stNow.roofs || []).forEach((r) => {
        if (r.kind !== "poly" || !Array.isArray(r.pts)) return;
        r.pts.forEach((p, i) => {
          if (r.id === skipRoofId && i === skipIdx) return;
          const wx = (+r.x || 0) + (+p.x || 0), wz = (+r.z || 0) + (+p.z || 0);
          const dd = Math.hypot(wx - pt.x, wz - pt.z);
          if (dd < bd) { bd = dd; best = { x: wx, z: wz }; }
        });
      });
      return best || { x: Math.round(pt.x * 20) / 20, z: Math.round(pt.z * 20) / 20 };
    };

    const onDown = (ev) => {
      if (ev.button !== undefined && ev.button !== 0) return;
      if (drawingRef.current) { down = { x: ev.clientX, y: ev.clientY, draw: true, moved: false }; return; }
      const hit = pick(ev);
      if (!hit) return;
      const stNow = stRef.current;
      const ud = hit.obj.userData;
      let rec = null, dragId = null;
      if (hit.kind === "vertex") {
        rec = (stNow.roofs || []).find((r) => r.id === ud.roofId);
        if (!rec) return;
        setRay(ev); const gp = groundPoint();
        down = { x: ev.clientX, y: ev.clientY, hit, kind: "vertex", roofId: ud.roofId, idx: ud.idx, moved: false,
          startPt: { x: +rec.pts[ud.idx].x || 0, z: +rec.pts[ud.idx].z || 0 }, grab: gp ? { x: gp.x, z: gp.z } : null };
        t.controls.enabled = false;
        return;
      }
      if (hit.kind === "panel" || hit.kind === "roof") dragId = ud.roofId || ud.id;
      else dragId = ud.id;
      rec = hit.kind === "obstacle" ? (stNow.obstacles || []).find((o) => o.id === dragId) : (stNow.roofs || []).find((r) => r.id === dragId);
      if (!rec) return;
      setRay(ev); const gp = groundPoint();
      // อยู่ในกลุ่ม → ลากทีเดียวไปทั้งก้อน (จำตำแหน่งเริ่มของสมาชิกทุกผืน)
      const members = (hit.kind !== "obstacle" && rec.grp)
        ? (stNow.roofs || []).filter((r) => r.grp === rec.grp).map((r) => ({ id: r.id, x: +r.x || 0, z: +r.z || 0 }))
        : [{ id: rec.id, x: +rec.x || 0, z: +rec.z || 0 }];
      down = { x: ev.clientX, y: ev.clientY, hit, kind: hit.kind, dragId, moved: false, members,
        startPos: { x: +rec.x || 0, z: +rec.z || 0 }, grab: gp ? { x: gp.x, z: gp.z } : null };
      t.controls.enabled = false;
    };
    const onMove = (ev) => {
      if (!down) return;
      if (Math.abs(ev.clientX - down.x) + Math.abs(ev.clientY - down.y) > 6) down.moved = true;
      if (down.draw || !down.moved || !down.grab) return;
      setRay(ev);
      const gp = groundPoint(); if (!gp) return;
      if (down.kind === "vertex") {
        const stNow = stRef.current;
        const roof = (stNow.roofs || []).find((r) => r.id === down.roofId);
        if (roof) {
          // ตำแหน่ง world ใหม่ + ดูดเข้าหามุมผืนอื่น แล้วแปลงกลับเป็นพิกัดภายในผืน
          const wx = (+roof.x || 0) + down.startPt.x + gp.x - down.grab.x;
          const wz = (+roof.z || 0) + down.startPt.z + gp.z - down.grab.z;
          const sp = snapPt({ x: wx, z: wz }, down.roofId, down.idx);
          const nx = Math.round((sp.x - (+roof.x || 0)) * 20) / 20;
          const nz = Math.round((sp.z - (+roof.z || 0)) * 20) / 20;
          const pts = roof.pts.map((p, i) => i === down.idx ? { x: nx, z: nz } : p);
          patchRoof(down.roofId, { pts });
        }
        return;
      }
      const dx = gp.x - down.grab.x, dz = gp.z - down.grab.z;
      if (down.kind === "obstacle") {
        patchObs(down.dragId, { x: Math.round((down.startPos.x + dx) * 10) / 10, z: Math.round((down.startPos.z + dz) * 10) / 10 });
      } else {
        // ทุกผืนในกลุ่มขยับด้วยระยะเดียวกัน → รูปทรงรวมไม่เพี้ยน
        const ups = {};
        down.members.forEach((mb) => {
          ups[mb.id] = { x: Math.round((mb.x + dx) * 10) / 10, z: Math.round((mb.z + dz) * 10) / 10 };
        });
        patchRoofs(ups);
      }
    };
    const onUp = (ev) => {
      const t2 = tRef.current; if (t2.controls && !drawingRef.current) t2.controls.enabled = true;
      if (down && down.draw) {
        // โหมดวาด: คลิก (ไม่ลาก) บนผืนภาพ = วางจุดมุมหลังคา
        if (!down.moved && ev.target === cv) {
          setRay(ev);
          const gp = groundPoint();
          if (gp) { const sp = snapPt(gp, null, null); setDrawPts((p) => p.concat([sp])); }
        }
        down = null; return;
      }
      if (down && !down.moved) {
        const ud = down.hit.obj.userData;
        if (down.kind === "panel") {
          const stNow = stRef.current;
          const roof = stNow.roofs.find((r) => r.id === ud.roofId);
          if (roof) {
            const skips = Object.assign({}, roof.skips || {});
            if (skips[ud.key]) delete skips[ud.key]; else skips[ud.key] = true;
            patchRoof(roof.id, { skips });
          }
          setSelRoof(ud.roofId); setSelObs(null); setTab("roof");
        } else if (down.kind === "roof") { setSelRoof(ud.id); setSelObs(null); setTab("roof"); }
        else if (down.kind === "obstacle") { setSelObs(ud.id); setSelRoof(null); setTab("obstacle"); }
      }
      down = null;
    };
    cv.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { cv.removeEventListener("pointerdown", onDown); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [ready]); // eslint-disable-line

  /* ── มุมมอง ── */
  const viewTop = () => { const t = tRef.current; if (!t.camera) return; t.camera.position.set(0, Math.max(30, st.groundW * 0.9), 0.01); t.controls.target.set(0, 0, 0); };
  const view3d = () => { const t = tRef.current; if (!t.camera) return; t.camera.position.set(18, 16, 18); t.controls.target.set(0, 1, 0); };

  /* ── วาดหลังคาทรงอิสระ ── */
  const startDraw = () => { setDrawing(true); setDrawPts([]); setSelObs(null); setTab("roof"); viewTop(); };
  const cancelDraw = () => { setDrawing(false); setDrawPts([]); };
  const finishDraw = () => {
    if (drawPts.length < 3) return;
    const cx = drawPts.reduce((s, p) => s + p.x, 0) / drawPts.length;
    const cz = drawPts.reduce((s, p) => s + p.z, 0) / drawPts.length;
    const nr = Object.assign(p3NewRoof((st.roofs || []).length + 1), {
      kind: "poly", x: Math.round(cx * 10) / 10, z: Math.round(cz * 10) / 10,
      pts: drawPts.map((p) => ({ x: Math.round((p.x - cx) * 20) / 20, z: Math.round((p.z - cz) * 20) / 20 })),
    });
    set({ roofs: (st.roofs || []).concat([nr]) });
    setSelRoof(nr.id); setDrawing(false); setDrawPts([]);
  };

  /* ── อัปโหลดรูปโดรน ── */
  const fileRef = React.useRef(null);
  const onPickPhoto = async (e) => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    try {
      const url = await window.resizeImageFile(f, 1600, 0.82);
      set({ photo: url });
    } catch (err) { alert("โหลดรูปไม่สำเร็จ: " + err.message); }
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── บันทึก / ส่งออก ── */
  const doSave = () => { save(JSON.parse(JSON.stringify(st))); setDirty(false); };
  const doPng = () => {
    const t = tRef.current; if (!t.renderer) return;
    try {
      const a = document.createElement("a");
      a.href = t.renderer.domElement.toDataURL("image/png");
      a.download = (job ? job.code : "plan3d") + "-3D.png";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { alert("ส่งออกภาพไม่สำเร็จ: " + e.message); }
  };
  const tryClose = () => { if (dirty && !confirm("มีการแก้ไขที่ยังไม่บันทึก — ปิดโดยไม่บันทึกใช่ไหม?")) return; onClose(); };

  /* ── UI helpers ── */
  const inp = { width: "100%", boxSizing: "border-box", background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13, padding: "7px 9px", borderRadius: 9, outline: "none" };
  const Num = ({ label, value, onChange, step, min, max, suffix }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <input type="number" step={step || 1} min={min} max={max} value={value} style={inp}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)} />
        {suffix && <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{suffix}</span>}
      </span>
    </label>
  );
  /* สไลเดอร์ปรับเร็ว + ช่องพิมพ์ตัวเลข (ใช้กับองศา/ทิศ) */
  const NumRange = ({ label, value, onChange, min, max, step, suffix, span }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, gridColumn: span ? "1 / -1" : "auto" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(+e.target.value)}
          style={{ flex: 1, minWidth: 0, accentColor: "var(--primary)" }} />
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(e.target.value === "" ? 0 : +e.target.value)}
          style={Object.assign({}, inp, { width: 58, flexShrink: 0, textAlign: "center", padding: "5px 4px" })} />
        {suffix && <span style={{ fontSize: 10.5, color: "var(--text-3)", flexShrink: 0 }}>{suffix}</span>}
      </span>
    </label>
  );
  const TabBtn = ({ k, label }) => (
    <button onClick={() => setTab(k)} style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
      fontSize: 12, fontWeight: 700, background: tab === k ? "var(--primary)" : "var(--surface2)", color: tab === k ? "#fff" : "var(--text-2)" }}>{label}</button>
  );
  const SmallBtn = ({ onClick, children, color, bg, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: bg || "var(--surface)", color: disabled ? "var(--text-3)" : (color || "var(--text-1)"), fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 }}>{children}</button>
  );

  const roof = (st.roofs || []).find((r) => r.id === selRoof) || null;
  const obs = (st.obstacles || []).find((o) => o.id === selObs) || null;
  const isPolyRoof = roof && roof.kind === "poly" && Array.isArray(roof.pts);
  const isGable = roof && roof.kind === "gable";
  const isHip = roof && roof.kind === "hip";
  const gableRise = isGable ? Math.round(((+roof.span || 8) / 2) * Math.tan((+roof.pitch || 0) * P3_DEG) * 100) / 100 : 0;
  const gridSel = roof ? p3Panels(roof) : null;
  const hipInfo = isHip && gridSel ? gridSel.hip : null;
  const total = p3CountAll(st);
  const kwp = Math.round(total * (+st.wp || 650) / 10) / 100;
  const sunNow = p3SunPos(st.sun);
  const fmtHour = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return hh + ":" + (mm < 10 ? "0" : "") + mm; };
  const polyAreaPlan = isPolyRoof ? Math.round(p3Area(roof.pts) * 10) / 10 : 0;
  const polyAreaSurf = isPolyRoof && gridSel && gridSel.surfInfo ? Math.round(polyAreaPlan / gridSel.surfInfo.cosP * 10) / 10 : 0;

  /* ── side panel content ── */
  const panelBody = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <TabBtn k="roof" label="หลังคา/แผง" />
        <TabBtn k="photo" label="รูปโดรน" />
        <TabBtn k="obstacle" label="สิ่งบดบัง" />
        <TabBtn k="sun" label="แสงแดด" />
      </div>

      {tab === "photo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => fileRef.current && fileRef.current.click()}
            style={{ padding: "12px 10px", borderRadius: 11, border: "1.5px dashed var(--border-strong)", background: "var(--surface2)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>
            {st.photo ? "เปลี่ยนรูปโดรน (มุมบน)" : "+ อัปโหลดรูปโดรน (มุมบน)"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
          {st.photo && (
            <React.Fragment>
              <img src={st.photo} alt="drone" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} />
              <Num label="ความกว้างรูปเทียบของจริง (สเกล)" value={st.photoW} step={1} min={2} suffix="ม." onChange={(v) => set({ photoW: v })} />
              <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>ความทึบรูป · {Math.round((st.photoOpacity || 0.95) * 100)}%</span>
                <input type="range" min="0.15" max="1" step="0.05" value={st.photoOpacity} onChange={(e) => set({ photoOpacity: +e.target.value })} />
              </label>
              <SmallBtn onClick={() => set({ photo: null })} color="#B91C1C">ลบรูป</SmallBtn>
            </React.Fragment>
          )}
          <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.55 }}>
            เคล็ดลับ: ใช้รูปโดรนถ่ายตรงจากด้านบน แล้วปรับ “สเกล” ให้ระยะบนรูปตรงกับของจริง จากนั้นไปแท็บ “หลังคา/แผง” → กด “วาดหลังคาทรงอิสระ” เพื่อคลิกลอกขอบหลังคาตามรูปได้เลย
          </div>
        </div>
      )}

      {tab === "roof" && drawing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-1)", fontWeight: 700 }}>✏️ กำลังวาดหลังคาทรงอิสระ</div>
          <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 9, padding: "9px 11px", lineHeight: 1.6 }}>
            คลิกบนภาพเพื่อวาง “มุมหลังคา” ทีละจุด ไล่ตามขอบหลังคาในรูปโดรน (วางแล้ว {drawPts.length} จุด)
            — ครบแล้วกด “จบรูป” ระบบจะแปลงเป็นหลังคา 3D แล้วค่อยตั้งองศาเอียง/ทิศ
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={finishDraw} disabled={drawPts.length < 3}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", background: drawPts.length >= 3 ? "var(--primary)" : "var(--surface3)", color: drawPts.length >= 3 ? "#fff" : "var(--text-3)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: drawPts.length >= 3 ? "pointer" : "default" }}>
              ✓ จบรูป ({drawPts.length} จุด)
            </button>
            <SmallBtn onClick={() => setDrawPts((p) => p.slice(0, -1))} disabled={!drawPts.length}>↩ ถอยจุด</SmallBtn>
            <SmallBtn onClick={cancelDraw} color="#B91C1C">ยกเลิก</SmallBtn>
          </div>
        </div>
      )}

      {tab === "roof" && !drawing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(st.roofs || []).map((r) => (
              <button key={r.id} onClick={() => { setSelRoof(r.id); setSelObs(null); }}
                style={{ padding: "6px 11px", borderRadius: 99, border: "1px solid " + (r.id === selRoof ? "var(--primary)" : "var(--border-strong)"),
                  background: r.id === selRoof ? "var(--primary-soft)" : "var(--surface)", color: r.id === selRoof ? "var(--primary-dark)" : "var(--text-2)",
                  fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>{r.kind === "poly" ? "⬠ " : r.kind === "gable" ? "⌂ " : r.kind === "hip" ? "⛺ " : ""}{r.name}{r.grp ? " 🔗" : ""}</button>
            ))}
            <SmallBtn onClick={() => { const nr = p3NewRoof((st.roofs || []).length + 1); set({ roofs: (st.roofs || []).concat([nr]) }); setSelRoof(nr.id); }}>+ สี่เหลี่ยม</SmallBtn>
            <SmallBtn onClick={() => { const nr = p3NewGable((st.roofs || []).length + 1); set({ roofs: (st.roofs || []).concat([nr]) }); setSelRoof(nr.id); }}>+ จั่ว ⌂</SmallBtn>
            <SmallBtn onClick={() => { const nr = p3NewHip((st.roofs || []).length + 1); set({ roofs: (st.roofs || []).concat([nr]) }); setSelRoof(nr.id); }}>+ ปั้นหยา ⛺</SmallBtn>
          </div>
          <button onClick={startDraw}
            style={{ padding: "10px 10px", borderRadius: 10, border: "1.5px dashed #4F46E5", background: "#6366F114", color: "#4F46E5", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>
            ✏️ วาดหลังคาทรงอิสระ (คลิกมุมตามรูปโดรน)
          </button>
          {roof && (
            <React.Fragment>
              <input value={roof.name} onChange={(e) => patchRoof(roof.id, { name: e.target.value })} style={inp} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {!isPolyRoof && !isGable && !isHip && <Num label="กว้าง (แนวชายคา)" value={roof.w} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { w: v })} />}
                {!isPolyRoof && !isGable && !isHip && <Num label="ยาวลาดหลังคา" value={roof.d} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { d: v })} />}
                {isGable && <Num label="ยาวสันหลังคา" value={roof.ridge} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { ridge: v })} />}
                {isGable && <Num label="กว้างรวม 2 ลาด" value={roof.span} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { span: v })} />}
                {isHip && <Num label="ยาวรวม (แนวสัน)" value={roof.w} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { w: v })} />}
                {isHip && <Num label="กว้างรวม" value={roof.d} step={0.1} min={1} suffix="ม." onChange={(v) => patchRoof(roof.id, { d: v })} />}
                <Num label="ความสูงชายคา" value={roof.h} step={0.1} min={0.5} suffix="ม." onChange={(v) => patchRoof(roof.id, { h: v })} />
                <Num label="ระยะขอบกันตก" value={roof.margin} step={0.05} min={0} suffix="ม." onChange={(v) => patchRoof(roof.id, { margin: v })} />
                <NumRange span label={isGable || isHip ? "องศาความชัน" : "องศาเอียง"} value={roof.pitch} step={1} min={0} max={60} suffix="°" onChange={(v) => patchRoof(roof.id, { pitch: v })} />
                <NumRange span label={isGable || isHip ? "ทิศด้าน A หันไป (180 = ใต้)" : "ทิศที่ลาดหันไป (180 = ใต้)"} value={roof.az} step={5} min={0} max={360} suffix="°" onChange={(v) => patchRoof(roof.id, { az: v })} />
              </div>
              {isHip && hipInfo && (
                <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "#B4530910", border: "1px solid #B4530933", borderRadius: 9, padding: "8px 10px", lineHeight: 1.6 }}>
                  ⛺ ปั้นหยา · สันยาว ≈ <b>{Math.round(hipInfo.r * 100) / 100 } ม.</b> · สันสูงจากชายคา ≈ <b>{Math.round(hipInfo.rise * 100) / 100} ม.</b> · ลาด ≈ <b>{Math.round(hipInfo.SL * 100) / 100} ม.</b>
                  {(+roof.w || 0) < (+roof.d || 0) && <div style={{ color: "#B45309", fontWeight: 700 }}>⚠ "ยาวรวม" ควรเป็นด้านที่ยาวกว่า "กว้างรวม"</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                    {[["sideA", "A คางหมู"], ["sideB", "B คางหมู"], ["sideC", "C สามเหลี่ยม"], ["sideD", "D สามเหลี่ยม"]].map(([k, lb]) => (
                      <button key={k} onClick={() => patchRoof(roof.id, { [k]: roof[k] === false })}
                        style={{ padding: "6px 4px", borderRadius: 8, border: "1px solid " + (roof[k] !== false ? "var(--primary)" : "var(--border-strong)"),
                          background: roof[k] !== false ? "var(--primary-soft)" : "var(--surface)", color: roof[k] !== false ? "var(--primary-dark)" : "var(--text-3)",
                          fontWeight: 700, fontFamily: "inherit", fontSize: 11.5, cursor: "pointer" }}>
                        {roof[k] !== false ? "✓ " : ""}{lb} · {gridSel ? (gridSel["count" + k.slice(4)] || 0) : 0} แผง
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isGable && (
                <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "#B4530910", border: "1px solid #B4530933", borderRadius: 9, padding: "8px 10px", lineHeight: 1.6 }}>
                  ⌂ หลังคาจั่ว · สันสูงจากชายคา ≈ <b>{gableRise} ม.</b> · ลาดด้านละ ≈ <b>{gridSel && gridSel.slopeLen ? Math.round(gridSel.slopeLen * 100) / 100 : 0} ม.</b><br />
                  ด้าน A (ทิศ {roof.az}°): <b>{gridSel ? gridSel.countA : 0} แผง</b> · ด้าน B (ทิศ {((+roof.az || 180) + 180) % 360}°): <b>{gridSel ? gridSel.countB : 0} แผง</b>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {[["sideA", "วางแผงด้าน A"], ["sideB", "วางแผงด้าน B"]].map(([k, lb]) => (
                      <button key={k} onClick={() => patchRoof(roof.id, { [k]: roof[k] === false })}
                        style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: "1px solid " + (roof[k] !== false ? "var(--primary)" : "var(--border-strong)"),
                          background: roof[k] !== false ? "var(--primary-soft)" : "var(--surface)", color: roof[k] !== false ? "var(--primary-dark)" : "var(--text-3)",
                          fontWeight: 700, fontFamily: "inherit", fontSize: 11.5, cursor: "pointer" }}>{roof[k] !== false ? "✓ " : ""}{lb}</button>
                    ))}
                  </div>
                </div>
              )}
              {isPolyRoof && (
                <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "#6366F110", border: "1px solid #6366F133", borderRadius: 9, padding: "8px 10px", lineHeight: 1.55 }}>
                  ⬠ หลังคาทรงอิสระ · {roof.pts.length} จุด · พื้นที่แนวราบ ≈ <b>{polyAreaPlan} ตร.ม.</b> · พื้นที่ผิวลาด ≈ <b>{polyAreaSurf} ตร.ม.</b><br />
                  ลาก<span style={{ color: "#16A34A", fontWeight: 700 }}>จุดสีเขียว</span>เพื่อปรับรูปทรง · ลากตัวหลังคาเพื่อย้ายทั้งผืน
                </div>
              )}
              <div style={{ borderTop: "1px dashed var(--border-strong)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["portrait", "landscape"].map((o) => (
                    <button key={o} onClick={() => patchRoof(roof.id, { orient: o, skips: {} })}
                      style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: "1px solid " + (roof.orient === o ? "var(--primary)" : "var(--border-strong)"),
                        background: roof.orient === o ? "var(--primary-soft)" : "var(--surface)", color: roof.orient === o ? "var(--primary-dark)" : "var(--text-2)",
                        fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>{o === "portrait" ? "แผงแนวตั้ง" : "แผงแนวนอน"}</button>
                  ))}
                </div>
                {!isPolyRoof && !isHip && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Num label={"แถว (สูงสุด " + (gridSel ? gridSel.maxRows : 0) + ") 0=เต็ม"} value={roof.rows} step={1} min={0} onChange={(v) => patchRoof(roof.id, { rows: v })} />
                    <Num label={"คอลัมน์ (สูงสุด " + (gridSel ? gridSel.maxCols : 0) + ") 0=เต็ม"} value={roof.cols} step={1} min={0} onChange={(v) => patchRoof(roof.id, { cols: v })} />
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 9, padding: "8px 10px" }}>
                  ผืนนี้วางได้ <b>{gridSel ? gridSel.count : 0} แผง</b> · แตะแผงในภาพเพื่อเว้นตำแหน่ง (แผงจางคือที่เว้นไว้ แตะซ้ำใส่คืน)
                  {Object.keys(roof.skips || {}).length > 0 && <button onClick={() => patchRoof(roof.id, { skips: {} })} style={{ marginLeft: 8, border: "none", background: "none", color: "var(--primary-dark)", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>ใส่คืนทั้งหมด</button>}
                </div>
              </div>
              {/* ── จัดกลุ่ม: แตะผืนอื่นเพื่อรวม/แยก · ลากทีเดียวไปทั้งก้อน ── */}
              {(st.roofs || []).length > 1 && (
                <div style={{ borderTop: "1px dashed var(--border-strong)", paddingTop: 10 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>
                    🔗 จัดกลุ่มกับผืนอื่น <span style={{ fontWeight: 500, textTransform: "none" }}>· แตะเพื่อรวม/แยก (ลากแล้วไปทั้งก้อน)</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(st.roofs || []).filter((r) => r.id !== roof.id).map((r) => {
                      const inGrp = !!roof.grp && r.grp === roof.grp;
                      return (
                        <button key={r.id} onClick={() => {
                          const gid = roof.grp || p3Id("g");
                          const ups = {};
                          if (inGrp) {
                            ups[r.id] = { grp: null };
                            // เหลือสมาชิกเดียว = ไม่เป็นกลุ่มแล้ว
                            const left = (st.roofs || []).filter((x) => x.grp === gid && x.id !== r.id);
                            if (left.length < 2) left.forEach((x) => { ups[x.id] = { grp: null }; });
                          } else {
                            ups[roof.id] = { grp: gid };
                            ups[r.id] = { grp: gid };
                          }
                          patchRoofs(ups);
                        }}
                          style={{ padding: "5px 10px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                            border: "1px solid " + (inGrp ? "#4F46E5" : "var(--border-strong)"),
                            background: inGrp ? "#6366F118" : "var(--surface)", color: inGrp ? "#4F46E5" : "var(--text-3)" }}>
                          {inGrp ? "🔗 " : "+ "}{r.name}
                        </button>
                      );
                    })}
                  </div>
                  {roof.grp && (
                    <div style={{ fontSize: 11, color: "#4F46E5", marginTop: 6, fontWeight: 600 }}>
                      อยู่ในกลุ่มเดียวกัน {(st.roofs || []).filter((r) => r.grp === roof.grp).length} ผืน — ลากผืนไหนก็ย้ายพร้อมกันทั้งกลุ่ม
                    </div>
                  )}
                </div>
              )}
              {(st.roofs || []).length > 1 && (
                <SmallBtn color="#B91C1C" onClick={() => { if (!confirm("ลบ " + roof.name + " ?")) return; const rs = st.roofs.filter((r) => r.id !== roof.id); set({ roofs: rs }); setSelRoof(rs[0] ? rs[0].id : null); }}>ลบหลังคาผืนนี้</SmallBtn>
              )}
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>ลากหลังคาในภาพเพื่อย้ายตำแหน่งให้ตรงกับรูปโดรน</div>
            </React.Fragment>
          )}
        </div>
      )}

      {tab === "obstacle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <SmallBtn onClick={() => { const o = { id: p3Id("o"), kind: "box", x: 6, z: 6, w: 2, d: 2, h: 3 }; set({ obstacles: (st.obstacles || []).concat([o]) }); setSelObs(o.id); setSelRoof(null); }}>+ กล่อง/ตึก</SmallBtn>
            <SmallBtn onClick={() => { const o = { id: p3Id("o"), kind: "tree", x: -6, z: 6, w: 3, d: 3, h: 5 }; set({ obstacles: (st.obstacles || []).concat([o]) }); setSelObs(o.id); setSelRoof(null); }}>+ ต้นไม้</SmallBtn>
          </div>
          {(st.obstacles || []).length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "10px 0" }}>เพิ่มตึกข้างเคียง / ถังน้ำ / ต้นไม้ เพื่อดูเงาบดบังแผง</div>}
          {obs && (
            <React.Fragment>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Num label="กว้าง" value={obs.w} step={0.5} min={0.5} suffix="ม." onChange={(v) => patchObs(obs.id, { w: v })} />
                <Num label="ลึก" value={obs.d} step={0.5} min={0.5} suffix="ม." onChange={(v) => patchObs(obs.id, { d: v })} />
                <Num label="สูง" value={obs.h} step={0.5} min={0.5} suffix="ม." onChange={(v) => patchObs(obs.id, { h: v })} />
              </div>
              <SmallBtn color="#B91C1C" onClick={() => { set({ obstacles: st.obstacles.filter((o) => o.id !== obs.id) }); setSelObs(null); }}>ลบชิ้นนี้</SmallBtn>
            </React.Fragment>
          )}
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>แตะเพื่อเลือก · ลากเพื่อย้ายตำแหน่ง</div>
        </div>
      )}

      {tab === "sun" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>เดือน · {["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][(st.sun.month || 1) - 1]}</span>
            <input type="range" min="1" max="12" step="1" value={st.sun.month} onChange={(e) => setSun({ month: +e.target.value })} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>เวลา · {fmtHour(+st.sun.hour || 12)} น.</span>
            <input type="range" min="6" max="18.5" step="0.25" value={st.sun.hour} onChange={(e) => { setAnimating(false); setSun({ hour: +e.target.value }); }} />
          </label>
          <button onClick={() => setAnimating((a) => !a)}
            style={{ padding: "9px 10px", borderRadius: 10, border: "none", background: animating ? "#B45309" : "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 12.5, cursor: "pointer" }}>
            {animating ? "⏸ หยุดกวาดเงา" : "▶ กวาดเงาทั้งวัน (06:00–18:30)"}
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Num label="ละติจูด" value={st.sun.lat} step={0.01} onChange={(v) => setSun({ lat: v })} />
            <Num label="ลองจิจูด" value={st.sun.lng} step={0.01} onChange={(v) => setSun({ lng: v })} />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 9, padding: "8px 10px", lineHeight: 1.5 }}>
            ดวงอาทิตย์ตอนนี้: มุมเงย <b>{Math.round(sunNow.alt)}°</b> · ทิศ <b>{Math.round(sunNow.az)}°</b>{sunNow.alt <= 0 ? " · (ยังไม่ขึ้น/ตกแล้ว)" : ""}
          </div>
          <Num label="กำลังแผง (Wp/แผง)" value={st.wp} step={5} min={100} suffix="W" onChange={(v) => set({ wp: v })} />
        </div>
      )}
    </div>
  );

  /* ── โครงหน้า ── */
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ padding: isMobile ? "10px 12px" : "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: "#6366F11c", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="panel" size={17} color="#4F46E5" /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>วางแผง 3D · {job ? job.code : ""}</div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job ? job.name : ""}</div>
        </div>
        <span style={{ fontSize: isMobile ? 11 : 12.5, fontWeight: 700, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "6px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>
          {total} แผง · {kwp} kWp{job && job.panels ? (total === job.panels ? " ✓" : " / เป้า " + job.panels) : ""}
        </span>
        <button onClick={tryClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={17} /></button>
      </div>

      {/* body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isMobile ? "column" : "row" }}>
        {/* 3D canvas */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", background: "#dce8f2" }}>
          <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
          {!ready && !loadErr && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--text-2)", fontSize: 13.5, fontWeight: 600 }}>กำลังโหลดโหมด 3D…</div>}
          {loadErr && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#B91C1C", fontSize: 13, padding: 30, textAlign: "center" }}>{loadErr}<br />ต้องต่ออินเทอร์เน็ตครั้งแรกเพื่อโหลดตัวเรนเดอร์ 3D</div>}
          {/* view buttons */}
          <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
            <SmallBtn onClick={view3d}>มุม 3D</SmallBtn>
            <SmallBtn onClick={viewTop}>มุมบน</SmallBtn>
          </div>
          {/* แถบโหมดวาด ลอยบน canvas */}
          {drawing && (
            <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, alignItems: "center",
              background: "rgba(255,255,255,.95)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", boxShadow: "0 8px 24px rgba(8,20,14,.15)" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap" }}>✏️ คลิกวางมุมหลังคา · {drawPts.length} จุด</span>
              <button onClick={finishDraw} disabled={drawPts.length < 3}
                style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: drawPts.length >= 3 ? "var(--primary)" : "#e2e8f0", color: drawPts.length >= 3 ? "#fff" : "#94a3b8", fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: drawPts.length >= 3 ? "pointer" : "default", whiteSpace: "nowrap" }}>✓ จบรูป</button>
              <button onClick={cancelDraw} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "#fff", color: "#B91C1C", fontWeight: 700, fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", gap: 6, justifyContent: "space-between", pointerEvents: "none" }}>
            <span style={{ fontSize: 10.5, color: "#3b4b5a", background: "rgba(255,255,255,.75)", padding: "4px 9px", borderRadius: 8 }}>
              {drawing ? "โหมดวาด: คลิก=วางจุด · ลาก=หมุน/เลื่อนมุมมอง (จุดไม่ถูกวางถ้าลาก)" : "ลาก=หมุน · ล้อ/บีบ=ซูม · คลิกขวา/2นิ้ว=เลื่อน · แตะแผง=เว้น · ลากหลังคา=ย้าย"}
            </span>
          </div>
        </div>

        {/* side panel */}
        <div style={{ width: isMobile ? "100%" : 320, flexShrink: 0, maxHeight: isMobile ? "44%" : "none", overflowY: "auto",
          borderLeft: isMobile ? "none" : "1px solid var(--border)", borderTop: isMobile ? "1px solid var(--border)" : "none",
          background: "var(--surface)", padding: 12, boxSizing: "border-box" }}>
          {panelBody}
        </div>
      </div>

      {/* footer */}
      <div style={{ padding: isMobile ? "10px 12px" : "10px 18px", paddingBottom: "calc(" + (isMobile ? 10 : 10) + "px + env(safe-area-inset-bottom,0px))", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 8, flexShrink: 0 }}>
        <SmallBtn onClick={doPng}>📷 ภาพ PNG</SmallBtn>
        <span style={{ flex: 1 }} />
        {dirty && <span style={{ alignSelf: "center", fontSize: 11.5, color: "#B45309", fontWeight: 700 }}>ยังไม่บันทึก</span>}
        <button onClick={doSave} style={{ padding: "10px 26px", borderRadius: 11, border: "none", background: dirty ? "var(--primary)" : "var(--surface3)", color: dirty ? "#fff" : "var(--text-3)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
      </div>
    </div>
  );
}

Object.assign(window, { Plan3DEditor, usePlan3d });
