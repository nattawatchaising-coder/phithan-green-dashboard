/* ==================================================================
   dxf.jsx — ตัวเขียนไฟล์ DXF รุ่น AC1015 (AutoCAD 2000)

   ทำไมต้องขยับจาก R12 มาเป็น R2000:
   R12 วาดได้แค่เส้น ไม่มี entity สำหรับ "รูปภาพ" เลย จะเอาภาพถ่ายโดรน
   มาปูเป็นพื้นหลังจาง ๆ ใต้ผังไม่ได้เด็ดขาด · R2000 มี IMAGE ให้ใช้
   แลกมากับที่ทุกอย่างต้องมี handle และต้องมีตาราง/ออบเจกต์ครบตามที่กำหนด
   ถ้าอ้างถึงอะไรที่ไม่ได้นิยามไว้ AutoCAD จะทิ้งทั้งไฟล์เงียบ ๆ เหมือนเดิม

   ข้อตกลงของไฟล์นี้
   · พิกัดที่ส่งเข้ามาคือพิกัดในแบบแล้ว (Y ชี้ขึ้น) ผู้เรียกพลิกแกนมาเองก่อน
   · ภาษาไทยเขียนเป็น \U+XXXX ตามที่ DXF กำหนด ไฟล์จึงเป็น ASCII ล้วน ไม่เพี้ยน
   · ตัวหนังสือใช้สไตล์ PG-TH ที่ผูกกับ tahoma.ttf — ฟอนต์ที่มีไทยครบและมีอยู่ทุกเครื่อง
     (romans.shx/txt.shx สวยกว่าในเชิงเขียนแบบ แต่ไม่มีสระวรรณยุกต์ไทย)
   ================================================================== */

/* ── ฟอนต์ของชุดแบบ (เลือกได้ในหน้าชุดแบบ DXF · จำที่ localStorage.pg_font) ──
   ทุกตัวมีไทยครบ · k = ตัวคูณความสูง: ฟอนต์ไทยตระกูล Angsana/Cordia/Sarabun ตัวเล็กกว่า Tahoma มากที่ความสูงเท่ากัน
   จึงขยายให้ตัวที่เห็นใหญ่ใกล้กัน (ตารางไม่ล้น) · wf = บีบความกว้างตั้งต้น (Tahoma กว้าง บีบ 0.85 · ฟอนต์ไทยแคบอยู่แล้ว)
   fam = ค่า 1071 ใน XDATA ของ STYLE (pitch/family + ชุดอักขระไทย 222<<8) ให้ AutoCAD หาฟอนต์ตามชื่อได้แม้ชื่อไฟล์ไม่ตรง */
const PG_FONTS = [
  /* ค่าตั้งต้น — ผู้ใช้เลือก Cordia New (ต.ค. 2026 · มีใน Windows ภาษาไทย cordia.ttc) */
  { key: "cordia", th: "Cordia New", file: "cordia.ttc", css: "'Cordia New', CordiaUPC, sans-serif", k: 1.45, wf: 1, fam: 34 },
  /* ฟอนต์ราชการ ต้องติดตั้งในเครื่องที่เปิด CAD: THSarabun.ttf */
  { key: "sarabunpsk", th: "TH SarabunPSK", file: "THSarabun.ttf", css: "'TH SarabunPSK', 'TH Sarabun New', Sarabun, sans-serif", k: 1.3, wf: 1, fam: 34 },
  { key: "tahoma", th: "Tahoma", file: "tahoma.ttf", css: "Tahoma, sans-serif", k: 1, wf: 0.85, fam: 34 },
  { key: "angsana", th: "Angsana New", file: "angsana.ttc", css: "'Angsana New', AngsanaUPC, serif", k: 1.45, wf: 1, fam: 18 },
  { key: "sarabun", th: "TH Sarabun New", file: "THSarabunNew.ttf", css: "'TH Sarabun New', 'TH SarabunPSK', Sarabun, sans-serif", k: 1.35, wf: 1, fam: 34 },
];
const PG_DXF_CAP = 0.7;   // ความสูงตัวพิมพ์ใหญ่ ÷ ขนาดตัวอักษรบนจอ
function pgFont(key) {
  if (key == null) { try { key = localStorage.getItem("pg_font"); } catch (e) {} }
  return PG_FONTS.find((f) => f.key === key) || PG_FONTS[0];
}
/* เครื่องที่ดูตัวอย่างมีฟอนต์นี้ไหม (เทียบความกว้างกับฟอนต์สำรอง) — ไม่มี = ตัวอย่างบนจอวาดด้วยขนาดแบบ Tahoma
   ไม่งั้นฟอนต์สำรองถูกขยาย k เท่าจนล้นช่อง · ไฟล์ DXF ยังใช้ฟอนต์ที่เลือกเสมอ */
const _pgFontOk = {};
function pgFontAvail(ft) {
  if (ft.key === "tahoma") return true;
  if (_pgFontOk[ft.key] != null) return _pgFontOk[ft.key];
  let ok = false;
  try {
    const c = document.createElement("canvas").getContext("2d"), t = "ทดสอบ Test 123";
    c.font = "40px monospace"; const a = c.measureText(t).width;
    c.font = "40px '" + ft.th + "', monospace"; ok = c.measureText(t).width !== a;
  } catch (e) {}
  return (_pgFontOk[ft.key] = ok);
}
function pgSetFont(key) { try { localStorage.setItem("pg_font", key); } catch (e) {} }

/* สีมาตรฐาน AutoCAD Color Index ที่ใช้ประจำในแบบชุดนี้ */
const PG_ACI = { red: 1, yellow: 2, green: 3, cyan: 4, blue: 5, magenta: 6, white: 7, grey: 8, ltgrey: 9, orange: 30 };

function pgDxf(opt) {
  opt = opt || {};
  const FT = pgFont(opt.font);
  const MM = opt.units !== "m";               // ค่าปริยาย = มิลลิเมตร (แบบขนาดกระดาษ)
  const INSUNITS = MM ? 4 : 6;                // 4 = มม. · 6 = ม.
  const RASTUNIT = MM ? 1 : 3;                // หน่วยของรูปแรสเตอร์ 1 = มม. · 3 = ม.

  /* ── ตัวจ่าย handle ──
     ทุก entity/ตาราง/ออบเจกต์ใน R2000 ต้องมีเลขประจำตัวไม่ซ้ำกัน (เลขฐาน 16)
     และ $HANDSEED ในหัวไฟล์ต้องมากกว่าเลขที่ใช้จริงทั้งหมด */
  let H = 0x100;
  const nh = () => (H++).toString(16).toUpperCase();
  let PLOT = null;                            // กรอบกระดาษสำหรับตั้งค่าสั่งพิมพ์ (ดู .plot())

  const num = (v) => {
    const x = Math.round((+v || 0) * 1e6) / 1e6;
    return (Object.is(x, -0) ? 0 : x).toString();
  };
  /* หนีตัวอักษรนอก ASCII เป็น \U+XXXX — วิธีที่ DXF กำหนดไว้สำหรับตัวอักษรนอกหน้ารหัส
     และตัดตัวที่มีความหมายพิเศษใน DXF ทิ้ง (^ กับขึ้นบรรทัดใหม่) */
  const esc = (s) => String(s == null ? "" : s)
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\x20-\x7E]/g, (c) => "\\U+" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"));

  /* ── handle ของตารางและออบเจกต์ที่ต้องอ้างถึงกันไปมา ── */
  const hTab = { vport: nh(), ltype: nh(), layer: nh(), style: nh(), view: nh(), ucs: nh(), appid: nh(), dimstyle: nh(), brec: nh() };
  const hBrecModel = nh(), hBrecPaper = nh();
  const hBlkModel = nh(), hBlkEndModel = nh(), hBlkPaper = nh(), hBlkEndPaper = nh();
  const hNOD = nh(), hDictGroup = nh(), hDictImg = nh(), hDictPS = nh(), hPlaceholder = nh(), hRastVars = nh();
  const hDictLayout = nh(), hLayoutModel = nh(), hLayoutPaper = nh();

  const layers = new Map();
  const ltypes = new Map();
  const ents = [];        // แต่ละช่องคือ entity หนึ่งตัว (อาร์เรย์ของบรรทัด)
  const imgDefs = [];     // { h, hReactor, file, pxW, pxH, sx, sy }
  const ext = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

  const grow = (x, y) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < ext.minX) ext.minX = x; if (x > ext.maxX) ext.maxX = x;
    if (y < ext.minY) ext.minY = y; if (y > ext.maxY) ext.maxY = y;
  };

  /* ตัวช่วยเขียนคู่ (รหัสกลุ่ม, ค่า) ลงบัฟเฟอร์ */
  const W = (buf) => (c, v) => { buf.push(String(c), String(v)); };

  /* หัวของทุก entity — เจ้าของคือ block record ของ model space เสมอ
     เก็บ handle ที่จ่ายไปไว้ที่ buf.h เผื่อออบเจกต์อื่นต้องอ้างกลับมาหา (เช่นรูปแรสเตอร์) */
  /* CUR = ที่เก็บ entity ปัจจุบัน — ปกติคือ model space · ระหว่างนิยาม BLOCK (api.block) ชี้ไปที่ตัวบล็อก */
  const blocks = new Map();   // ชื่อ → { name, hRec, hB, hE, ents }
  let CUR = null;
  const head = (buf, type, sub, layer, col) => {
    const w = W(buf);
    buf.h = nh();
    w(0, type); w(5, buf.h); w(330, CUR ? CUR.hRec : hBrecModel);
    w(100, "AcDbEntity"); w(8, layer || "0");
    if (col != null) w(62, col);          // สีเฉพาะตัว (ไม่ตาม layer)
    w(100, sub);
    return w;
  };
  const push = (buf) => { (CUR ? CUR.ents : ents).push(buf); return buf; };

  /* ── ตัวเขียนแต่ละรูปทรง ── */
  const api = {
    /* นิยาม layer · ต้องเรียกก่อนใช้ ไม่งั้น AutoCAD ทิ้งไฟล์
       lw = ความหนาเส้น หน่วย 1/100 มม. (25 = 0.25 มม.) · -3 = ตามค่าปริยาย */
    layer(name, color, ltype, lw) {
      if (!layers.has(name)) layers.set(name, { name, color: color == null ? 7 : color, ltype: ltype || "CONTINUOUS", lw: lw == null ? -3 : lw });
      return name;
    },
    /* นิยามเส้นประ · pat = อาร์เรย์ระยะ (บวก = ขีด, ลบ = เว้น) หน่วยเดียวกับแบบ */
    ltype(name, desc, pat) {
      if (!ltypes.has(name)) ltypes.set(name, { name, desc: desc || "", pat: pat || [] });
      return name;
    },

    line(layer, x1, y1, x2, y2) {
      const b = []; const w = head(b, "LINE", "AcDbLine", layer);
      w(10, num(x1)); w(20, num(y1)); w(30, 0);
      w(11, num(x2)); w(21, num(y2)); w(31, 0);
      grow(x1, y1); grow(x2, y2); return push(b);
    },
    /* เส้นต่อหลายจุด · pts = [[x,y], ...] */
    pline(layer, pts, closed, width) {
      if (!pts || pts.length < 2) return null;
      const b = []; const w = head(b, "LWPOLYLINE", "AcDbPolyline", layer);
      w(90, pts.length); w(70, closed ? 1 : 0);
      if (width) w(43, num(width));
      pts.forEach((p) => { w(10, num(p[0])); w(20, num(p[1])); grow(p[0], p[1]); });
      return push(b);
    },
    rect(layer, x, y, w2, h2) {
      return api.pline(layer, [[x, y], [x + w2, y], [x + w2, y + h2], [x, y + h2]], true);
    },
    circle(layer, x, y, r) {
      const b = []; const w = head(b, "CIRCLE", "AcDbCircle", layer);
      w(10, num(x)); w(20, num(y)); w(30, 0); w(40, num(Math.abs(r) || 0.001));
      grow(x - r, y - r); grow(x + r, y + r); return push(b);
    },
    /* มุมเป็นองศา ทวนเข็ม */
    arc(layer, x, y, r, a1, a2) {
      const b = []; const w = head(b, "ARC", "AcDbCircle", layer);
      w(10, num(x)); w(20, num(y)); w(30, 0); w(40, num(Math.abs(r) || 0.001));
      w(100, "AcDbArc"); w(50, num(a1)); w(51, num(a2));
      grow(x - r, y - r); grow(x + r, y + r); return push(b);
    },
    /* สามเหลี่ยม/สี่เหลี่ยมทึบ · ลำดับจุดของ SOLID สลับคู่ที่ 3-4 (เป็นข้อกำหนดของรูปแบบ) */
    solid(layer, p1, p2, p3, p4) {
      const q = p4 || p3;
      const b = []; const w = head(b, "SOLID", "AcDbTrace", layer);
      [[10, 20, 30, p1], [11, 21, 31, p2], [12, 22, 32, q], [13, 23, 33, p3]].forEach(([a, c, d, p]) => {
        w(a, num(p[0])); w(c, num(p[1])); w(d, 0); grow(p[0], p[1]);
      });
      return push(b);
    },
    /* ข้อความ · o = { align, valign, rot, style, wf }
       align : 0 ซ้าย · 1 กลาง · 2 ขวา     valign : 0 ฐาน · 1 ล่าง · 2 กลาง · 3 บน */
    text(layer, x, y, h2, s, o) {
      o = o || {};
      const b = []; const w = head(b, "TEXT", "AcDbText", layer);
      w(10, num(x)); w(20, num(y)); w(30, 0);
      /* CAD นับความสูงตัวหนังสือ TrueType เป็นความสูงตัวพิมพ์ใหญ่ (ไม่ใช่ em แบบเบราว์เซอร์) — ใช้ h × 0.7 ทุกฟอนต์
         เดิมคูณ FT.k (Cordia 1.45) ตัวหนังสือใน CAD เลยใหญ่ล้นช่องตาราง/หัวแบบ (ผู้ใช้เปิดใน CAD แล้วไม่ตรง) */
      w(40, num(h2 * PG_DXF_CAP)); w(1, esc(s));
      if (o.rot) w(50, num(o.rot));
      w(41, num(o.wf == null ? FT.wf : o.wf));
      w(7, o.style || "PG-TH");
      const ha = +o.align || 0, va = +o.valign || 0;
      if (ha) w(72, ha);
      w(11, num(x)); w(21, num(y)); w(31, 0);
      w(100, "AcDbText");                 // R2000 ต้องซ้ำ subclass ก่อนกลุ่ม 73
      /* valign 1 = เส้นฐาน เหมือนตัวอย่าง SVG — 73=1 ของ CAD คือ "ล่างสุดรวมหางตัวอักษร" ฟอนต์ไทยหางยาว ตัวหนังสือเลยลอยชิดเส้นบนของช่องตาราง
         (ผู้ใช้: ตารางใน CAD ไม่สมส่วน) */
      if (va > 1) w(73, va);
      grow(x, y); grow(x + String(s || "").length * h2 * 0.6, y + h2);
      return push(b);
    },

    /* ── รูปแรสเตอร์ ──
       ไฟล์รูปไม่ได้ฝังในตัว DXF (รูปแบบนี้ไม่รองรับ) แต่อ้างชื่อไฟล์แบบสัมพัทธ์
       → ต้องดาวน์โหลดรูปไปวางไว้โฟลเดอร์เดียวกับ .dxf ด้วย
       o = { file, pxW, pxH, x, y, w, h, rot(องศา), fade(0-100) } — x,y = มุมล่างซ้าย */
    image(layer, o) {
      const pxW = Math.max(1, Math.round(+o.pxW || 1)), pxH = Math.max(1, Math.round(+o.pxH || 1));
      const wM = Math.abs(+o.w || 1), hM = Math.abs(+o.h || 1);
      const a = (+o.rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const ux = (wM / pxW) * ca, uy = (wM / pxW) * sa;      // ขนาดของ 1 พิกเซลตามแนวนอนของรูป
      const vx = (hM / pxH) * -sa, vy = (hM / pxH) * ca;     // และตามแนวตั้ง
      const def = { h: nh(), hReactor: nh(), file: o.file, pxW, pxH, sx: wM / pxW, sy: hM / pxH, ent: "" };
      imgDefs.push(def);

      const b = []; const w = head(b, "IMAGE", "AcDbRasterImage", layer);
      def.ent = b.h;
      w(90, 0);
      w(10, num(o.x)); w(20, num(o.y)); w(30, 0);
      w(11, num(ux)); w(21, num(uy)); w(31, 0);
      w(12, num(vx)); w(22, num(vy)); w(32, 0);
      w(13, num(pxW)); w(23, num(pxH));
      w(340, def.h);
      w(70, o.transp ? 15 : 7);       // แสดงรูป + พิมพ์ออกด้วย (+8 = พื้นโปร่งตามไฟล์ PNG)
      w(280, 0);                      // ไม่ตัดขอบ
      w(281, 50); w(282, 50);         // ความสว่าง / ความต่างสี ค่ากลาง
      w(283, Math.max(0, Math.min(100, Math.round(+o.fade || 0))));
      w(360, def.hReactor);
      w(71, 1); w(91, 2);
      w(14, "0.0"); w(24, "0.0");
      w(14, num(pxW)); w(24, num(pxH));
      // มุมทั้งสี่หลังหมุน — ให้ขอบเขตของแบบครอบรูปด้วย
      [[0, 0], [wM, 0], [wM, hM], [0, hM]].forEach(([px, py]) =>
        grow(o.x + px * ca - py * sa, o.y + px * sa + py * ca));
      return push(b);
    },

    get extents() { return ext; },

    /* บอกว่ากรอบกระดาษวางอยู่ตรงไหนในแบบ และ 1 มม.บนกระดาษ = k หน่วยในแบบ
       เพื่อตั้งค่าสั่งพิมพ์ให้พร้อม กด Ctrl+P แล้วออกมาเป็น A3 แนวนอนพอดีเป๊ะ */
    plot(o) { PLOT = { x0: +o.x0 || 0, y0: +o.y0 || 0, w: +o.w || 420, h: +o.h || 297, k: +o.k || 1 }; },

    /* ── BLOCK (ผู้ใช้: แผงที่วาดให้เป็น block แก้ทีเดียวทั้งแบบ) ──
       block(name, draw) นิยามครั้งเดียว · draw(api) วาดในพิกัดของบล็อก (จุดฐาน 0,0) ใช้ layer "0" = ตามสีของตัว INSERT
       insert(layer, name, x, y, sx, sy, rot) วางบล็อก · rot องศาทวนเข็ม */
    block(name, draw) {
      if (blocks.has(name)) return name;
      const B = { name, hRec: nh(), hB: nh(), hE: nh(), ents: [] };
      blocks.set(name, B);
      const prev = CUR;
      const save = Object.assign({}, ext);
      CUR = B;
      try { draw(api); } finally { CUR = prev; Object.assign(ext, save); }
      return name;
    },
    /* HATCH ลายเส้นขนานแบบ user-defined · loops[0] = ขอบนอก · loops[1..] = เกาะ (ไม่ลาย)
       o = { ang (องศา), sp (ระยะห่างเส้น หน่วยแบบ), dbl (ไขว้ 90°) } — ผู้ใช้: texture หลังคาเป็น HATCH
       o.solid = ทึบเต็ม (SOLID) · o.color = สี ACI เฉพาะตัว */
    hatch(layer, loops, o) {
      o = o || {};
      loops = (loops || []).filter((L) => L && L.length >= 3);
      if (!loops.length) return null;
      const b = []; const w = head(b, "HATCH", "AcDbHatch", layer, o.color);
      w(10, 0); w(20, 0); w(30, 0); w(210, 0); w(220, 0); w(230, 1);
      w(2, o.solid ? "SOLID" : "_USER"); w(70, o.solid ? 1 : 0); w(71, 0); w(91, loops.length);
      loops.forEach((L, i) => {
        w(92, i ? 2 : 3); w(72, 0); w(73, 1); w(93, L.length);
        L.forEach((p) => { w(10, num(p[0])); w(20, num(p[1])); grow(p[0], p[1]); });
        w(97, 0);
      });
      if (o.solid) { w(75, 1); w(76, 1); w(98, 0); return push(b); }
      const sp = Math.max(1e-6, +o.sp || 1), a0 = +o.ang || 0;
      w(75, 1); w(76, 0); w(52, num(a0)); w(41, num(sp)); w(77, o.dbl ? 1 : 0);   // 75=1 outer: เกาะซ้อนกันก็ไม่ลายกลับ
      const lines = o.dbl ? [a0, a0 + 90] : [a0];
      w(78, lines.length);
      lines.forEach((a) => {
        const r = a * Math.PI / 180;
        w(53, num(a)); w(43, 0); w(44, 0); w(45, num(-sp * Math.sin(r))); w(46, num(sp * Math.cos(r))); w(79, 0);
      });
      w(98, 0);
      return push(b);
    },
    insert(layer, name, x, y, sx, sy, rot) {
      const b = []; const w = head(b, "INSERT", "AcDbBlockReference", layer);
      w(2, name); w(10, num(x)); w(20, num(y)); w(30, 0);
      w(41, num(sx == null ? 1 : sx)); w(42, num(sy == null ? 1 : sy)); w(43, 1);
      if (rot) w(50, num(rot));
      const r = Math.hypot(sx || 1, sy || 1);
      grow(x - r, y - r); grow(x + r, y + r);
      return push(b);
    },

    /* ประกอบเป็นข้อความไฟล์ทั้งก้อน */
    build() {
      const out = [];
      const w = (c, v) => { out.push(String(c), String(v)); };
      const E = isFinite(ext.minX) ? ext : { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      /* พื้นที่พิมพ์: ถ้ายังไม่ได้บอกกรอบกระดาษไว้ ใช้ขอบเขตของแบบแทน */
      const P = PLOT || { x0: E.minX, y0: E.minY, w: E.maxX - E.minX, h: E.maxY - E.minY, k: 1 };
      const PX1 = P.x0 + P.w * P.k, PY1 = P.y0 + P.h * P.k;

      /* linetype ที่ระบบต้องมีเสมอ + ที่ผู้เรียกนิยามเพิ่ม */
      const LT = [{ name: "ByBlock", desc: "", pat: [] }, { name: "ByLayer", desc: "", pat: [] },
        { name: "CONTINUOUS", desc: "Solid line", pat: [] }].concat(Array.from(ltypes.values()));
      const LY = [{ name: "0", color: 7, ltype: "CONTINUOUS", lw: -3 }].concat(Array.from(layers.values()));
      const hLT = LT.map(() => nh()), hLY = LY.map(() => nh());
      const hStyleStd = nh(), hStyleTh = nh(), hVport = nh(), hAppid = nh(), hDimstyle = nh();

      /* ── HEADER ── */
      w(0, "SECTION"); w(2, "HEADER");
      w(9, "$ACADVER"); w(1, "AC1015");
      w(9, "$DWGCODEPAGE"); w(3, "ANSI_1252");   // ทั้งไฟล์เป็น ASCII (ไทยหนีเป็น \U+XXXX แล้ว)
      w(9, "$INSUNITS"); w(70, INSUNITS);
      w(9, "$MEASUREMENT"); w(70, 1);            // 1 = ระบบเมตริก
      w(9, "$LTSCALE"); w(40, num(opt.ltscale == null ? 1 : opt.ltscale));
      w(9, "$CLAYER"); w(8, "0");
      w(9, "$TEXTSTYLE"); w(7, "PG-TH");
      w(9, "$PDMODE"); w(70, 34);
      w(9, "$PDSIZE"); w(40, num(opt.ptsize == null ? 0 : opt.ptsize));
      w(9, "$EXTMIN"); w(10, num(E.minX)); w(20, num(E.minY)); w(30, 0);
      w(9, "$EXTMAX"); w(10, num(E.maxX)); w(20, num(E.maxY)); w(30, 0);
      w(9, "$LIMMIN"); w(10, num(P.x0)); w(20, num(P.y0));
      w(9, "$LIMMAX"); w(10, num(PX1)); w(20, num(PY1));
      w(9, "$LIMCHECK"); w(70, 0);
      w(9, "$PSLTSCALE"); w(70, 1);
      w(9, "$PLINEGEN"); w(70, 1);
      w(9, "$HANDSEED"); w(5, (H + 64).toString(16).toUpperCase());
      w(0, "ENDSEC");

      /* ── CLASSES ── entity ที่ไม่ได้มีมาแต่เดิมใน DXF ต้องประกาศคลาสไว้ก่อนใช้ */
      w(0, "SECTION"); w(2, "CLASSES");
      [["IMAGE", "AcDbRasterImage", 2175, 1],
       ["IMAGEDEF", "AcDbRasterImageDef", 0, 0],
       ["IMAGEDEF_REACTOR", "AcDbRasterImageDefReactor", 1, 0],
       ["RASTERVARIABLES", "AcDbRasterVariables", 0, 0]].forEach(([rec, cpp, flag, isEnt]) => {
        w(0, "CLASS"); w(1, rec); w(2, cpp); w(3, "ISM"); w(90, flag); w(280, 0); w(281, isEnt);
      });
      w(0, "ENDSEC");

      /* ── TABLES ── ลำดับสำคัญ และทุกตัวที่ถูกอ้างถึงต้องมีอยู่จริง */
      w(0, "SECTION"); w(2, "TABLES");

      const tabHead = (name, h, n2) => { w(0, "TABLE"); w(2, name); w(5, h); w(330, 0); w(100, "AcDbSymbolTable"); w(70, n2); };
      const recHead = (type, h, owner, sub, name, flags) => {
        w(0, type); w(5, h); w(330, owner);
        w(100, "AcDbSymbolTableRecord"); w(100, sub); w(2, name); w(70, flags || 0);
      };

      // VPORT — มุมมองที่เปิดค้างไว้ ตั้งให้พอดีกับขอบเขตของแบบ จะได้เห็นทั้งแผ่นทันทีที่เปิด
      /* เปิดไฟล์มาให้เห็นเต็มกรอบกระดาษพอดี ไม่ต้องมานั่ง Zoom Extents เอง */
      const cx = (P.x0 + PX1) / 2, cy = (P.y0 + PY1) / 2;
      const vh = Math.max(1e-6, (PY1 - P.y0) * 1.04), vw = Math.max(1e-6, (PX1 - P.x0) * 1.04);
      tabHead("VPORT", hTab.vport, 1);
      recHead("VPORT", hVport, hTab.vport, "AcDbViewportTableRecord", "*ACTIVE", 0);
      w(10, 0); w(20, 0); w(11, "1.0"); w(21, "1.0");
      w(12, num(cx)); w(22, num(cy)); w(13, 0); w(23, 0);
      w(14, "10.0"); w(24, "10.0"); w(15, "10.0"); w(25, "10.0");
      w(16, 0); w(26, 0); w(36, "1.0"); w(17, 0); w(27, 0); w(37, 0);
      w(40, num(vh)); w(41, num(vw / vh)); w(42, "50.0"); w(43, "0.0"); w(44, "0.0");
      w(50, "0.0"); w(51, "0.0");
      w(71, 0); w(72, 100); w(73, 1); w(74, 3); w(75, 0); w(76, 0); w(77, 0); w(78, 0);
      w(281, 0); w(65, 1);
      w(110, "0.0"); w(120, "0.0"); w(130, "0.0");
      w(111, "1.0"); w(121, "0.0"); w(131, "0.0");
      w(112, "0.0"); w(122, "1.0"); w(132, "0.0");
      w(79, 0); w(146, "0.0");
      w(0, "ENDTAB");

      // LTYPE
      tabHead("LTYPE", hTab.ltype, LT.length);
      LT.forEach((t, i) => {
        recHead("LTYPE", hLT[i], hTab.ltype, "AcDbLinetypeTableRecord", t.name, 0);
        w(3, t.desc); w(72, 65); w(73, t.pat.length);
        w(40, num(t.pat.reduce((a, v) => a + Math.abs(v), 0)));
        t.pat.forEach((v) => { w(49, num(v)); w(74, 0); });
      });
      w(0, "ENDTAB");

      // LAYER — 390 ชี้ไปที่ plot style ที่นิยามไว้ในส่วน OBJECTS
      tabHead("LAYER", hTab.layer, LY.length);
      LY.forEach((l, i) => {
        recHead("LAYER", hLY[i], hTab.layer, "AcDbLayerTableRecord", l.name, 0);
        w(62, l.color); w(6, l.ltype); w(370, l.lw); w(390, hPlaceholder);
      });
      w(0, "ENDTAB");

      /* STYLE — PG-TH ผูกกับฟอนต์ที่เลือก (ค่าตั้งต้น tahoma.ttf มีอักขระไทยครบและติดมากับ Windows ทุกเครื่อง) + XDATA ชื่อฟอนต์
         ถ้าใช้ txt.shx/romans.shx ตามธรรมเนียมเขียนแบบ สระกับวรรณยุกต์ไทยจะหายทั้งแผ่น */
      tabHead("STYLE", hTab.style, 2);
      recHead("STYLE", hStyleStd, hTab.style, "AcDbTextStyleTableRecord", "STANDARD", 0);
      w(40, "0.0"); w(41, "1.0"); w(50, "0.0"); w(71, 0); w(42, "2.5"); w(3, "txt"); w(4, "");
      recHead("STYLE", hStyleTh, hTab.style, "AcDbTextStyleTableRecord", "PG-TH", 0);
      w(40, "0.0"); w(41, num(FT.wf)); w(50, "0.0"); w(71, 0); w(42, "2.5"); w(3, FT.file); w(4, "");
      w(1001, "ACAD"); w(1000, FT.th); w(1071, FT.fam + (222 << 8));
      w(0, "ENDTAB");

      tabHead("VIEW", hTab.view, 0); w(0, "ENDTAB");
      tabHead("UCS", hTab.ucs, 0); w(0, "ENDTAB");

      tabHead("APPID", hTab.appid, 1);
      recHead("APPID", hAppid, hTab.appid, "AcDbRegAppTableRecord", "ACAD", 0);
      w(0, "ENDTAB");

      tabHead("DIMSTYLE", hTab.dimstyle, 1);
      w(100, "AcDbDimStyleTable"); w(71, 0);
      w(0, "DIMSTYLE"); w(105, hDimstyle); w(330, hTab.dimstyle);
      w(100, "AcDbSymbolTableRecord"); w(100, "AcDbDimStyleTableRecord");
      w(2, "STANDARD"); w(70, 0); w(340, hStyleTh);
      w(0, "ENDTAB");

      tabHead("BLOCK_RECORD", hTab.brec, 2 + blocks.size);
      recHead("BLOCK_RECORD", hBrecModel, hTab.brec, "AcDbBlockTableRecord", "*Model_Space", 0);
      w(340, hLayoutModel);
      recHead("BLOCK_RECORD", hBrecPaper, hTab.brec, "AcDbBlockTableRecord", "*Paper_Space", 0);
      w(340, hLayoutPaper);
      blocks.forEach((B) => { recHead("BLOCK_RECORD", B.hRec, hTab.brec, "AcDbBlockTableRecord", B.name, 0); w(340, 0); });
      w(0, "ENDTAB");
      w(0, "ENDSEC");

      /* ── BLOCKS ── ต้องมีบล็อกว่างของ model/paper space เสมอ ถึงจะไม่ได้ใส่อะไรไว้ */
      w(0, "SECTION"); w(2, "BLOCKS");
      const blk = (hB, hE, brec, name, list) => {
        w(0, "BLOCK"); w(5, hB); w(330, brec); w(100, "AcDbEntity"); w(8, "0"); w(100, "AcDbBlockBegin");
        w(2, name); w(70, 0); w(10, 0); w(20, 0); w(30, 0); w(3, name); w(1, "");
        (list || []).forEach((b) => { for (let i = 0; i < b.length; i++) out.push(b[i]); });
        w(0, "ENDBLK"); w(5, hE); w(330, brec); w(100, "AcDbEntity"); w(8, "0"); w(100, "AcDbBlockEnd");
      };
      blk(hBlkModel, hBlkEndModel, hBrecModel, "*Model_Space");
      blk(hBlkPaper, hBlkEndPaper, hBrecPaper, "*Paper_Space");
      blocks.forEach((B) => blk(B.hB, B.hE, B.hRec, B.name, B.ents));
      w(0, "ENDSEC");

      /* ── ENTITIES ── */
      w(0, "SECTION"); w(2, "ENTITIES");
      ents.forEach((b) => { for (let i = 0; i < b.length; i++) out.push(b[i]); });
      w(0, "ENDSEC");

      /* ── OBJECTS ──
         พจนานุกรมกลางของไฟล์ · ที่ขาดไม่ได้คือ ACAD_IMAGE_DICT + IMAGEDEF ของรูปแต่ละใบ
         และ ACAD_PLOTSTYLENAME ที่ทุก layer ชี้มาหาผ่านรหัส 390 */
      w(0, "SECTION"); w(2, "OBJECTS");
      w(0, "DICTIONARY"); w(5, hNOD); w(330, 0); w(100, "AcDbDictionary"); w(281, 1);
      w(3, "ACAD_GROUP"); w(350, hDictGroup);
      w(3, "ACAD_IMAGE_DICT"); w(350, hDictImg);
      w(3, "ACAD_IMAGE_VARS"); w(350, hRastVars);
      w(3, "ACAD_LAYOUT"); w(350, hDictLayout);
      w(3, "ACAD_PLOTSTYLENAME"); w(350, hDictPS);

      w(0, "DICTIONARY"); w(5, hDictGroup); w(330, hNOD); w(100, "AcDbDictionary"); w(281, 1);

      w(0, "DICTIONARY"); w(5, hDictImg); w(330, hNOD); w(100, "AcDbDictionary"); w(281, 1);
      imgDefs.forEach((d, i) => { w(3, "PG-IMG-" + (i + 1)); w(350, d.h); });

      w(0, "ACDBDICTIONARYWDFLT"); w(5, hDictPS); w(330, hNOD); w(100, "AcDbDictionary"); w(281, 1);
      w(3, "Normal"); w(350, hPlaceholder);
      w(100, "AcDbDictionaryWithDefault"); w(340, hPlaceholder);
      w(0, "ACDBPLACEHOLDER"); w(5, hPlaceholder); w(330, hDictPS);

      w(0, "DICTIONARY"); w(5, hDictLayout); w(330, hNOD); w(100, "AcDbDictionary"); w(281, 1);
      w(3, "Model"); w(350, hLayoutModel);
      w(3, "Layout1"); w(350, hLayoutPaper);

      /* ── ค่าสั่งพิมพ์: A3 แนวนอน 420x297 มม. เต็มหน้า ไม่เว้นขอบ ──
         พิมพ์ตาม Limits (= กรอบกระดาษที่วางไว้) มาตราส่วน 1 มม.กระดาษ = k หน่วยในแบบ
         แบบผังหน่วยเป็นเมตร k จึงเป็นเศษส่วน · แบบ SLD หน่วยเป็นมิลลิเมตร k = 1 ได้ 1:1 */
      const std = P.k === 1;                       // 1:1 หรือเปล่า (ใช้เลือกโหมดมาตราส่วนมาตรฐาน)
      const layout = (h, owner, name, order, brec) => {
        const isModel = order === 0;
        w(0, "LAYOUT"); w(5, h); w(330, owner); w(100, "AcDbPlotSettings");
        w(1, "PG-A3-LANDSCAPE"); w(2, "DWG To PDF.pc3");
        w(4, "ISO_full_bleed_A3_(420.00_x_297.00_MM)"); w(6, "");
        w(40, "0.0"); w(41, "0.0"); w(42, "0.0"); w(43, "0.0");     // ไม่เว้นขอบกระดาษ
        w(44, num(P.w)); w(45, num(P.h));                            // ขนาดกระดาษ (มม.)
        w(46, "0.0"); w(47, "0.0");                                  // จุดเริ่มพิมพ์
        w(48, num(P.x0)); w(49, num(P.y0)); w(140, num(PX1)); w(141, num(PY1));   // กรอบที่พิมพ์
        w(142, "1.0"); w(143, num(P.k));                             // 1 มม.กระดาษ ต่อ k หน่วยในแบบ
        w(70, 512 + 128 + 32 + 4 + (std ? 16 : 0));   // เรียงวิวพอร์ตก่อน · พิมพ์ตามน้ำหนักเส้น · ใช้ plot style · จัดกึ่งกลางหน้า · (มาตราส่วนมาตรฐาน)
        w(72, 1);                            // หน่วยกระดาษ = มิลลิเมตร
        w(73, 0);                            // ไม่หมุน (420x297 เป็นแนวนอนอยู่แล้ว)
        w(74, isModel ? 4 : 5);              // 4 = พิมพ์เฉพาะกรอบที่กำหนด · 5 = ตามเลย์เอาต์
        w(7, ""); w(75, std ? 16 : 0); w(147, num(1 / P.k));
        w(148, "0.0"); w(149, "0.0");
        w(100, "AcDbLayout"); w(1, name); w(70, 1); w(71, order);
        /* ขอบเขตของเลย์เอาต์ — โมเดลใช้กรอบกระดาษที่วางไว้จริง ส่วนกระดาษเปล่าใช้ A3 ตรง ๆ */
        const L = isModel ? { x0: P.x0, y0: P.y0, x1: PX1, y1: PY1 }
          : { x0: 0, y0: 0, x1: P.w, y1: P.h };
        w(10, "0.0"); w(20, "0.0"); w(11, num(L.x1 - L.x0)); w(21, num(L.y1 - L.y0));
        w(12, "0.0"); w(22, "0.0"); w(32, "0.0");
        w(14, num(L.x0)); w(24, num(L.y0)); w(34, "0.0");
        w(15, num(L.x1)); w(25, num(L.y1)); w(35, "0.0");
        w(146, "0.0");
        w(13, "0.0"); w(23, "0.0"); w(33, "0.0");
        w(16, "1.0"); w(26, "0.0"); w(36, "0.0");
        w(17, "0.0"); w(27, "1.0"); w(37, "0.0");
        w(76, 0); w(330, brec);
      };
      layout(hLayoutModel, hDictLayout, "Model", 0, hBrecModel);
      layout(hLayoutPaper, hDictLayout, "Layout1", 1, hBrecPaper);

      w(0, "RASTERVARIABLES"); w(5, hRastVars); w(330, hNOD); w(100, "AcDbRasterVariables");
      w(90, 0); w(70, 0); w(71, 1); w(72, RASTUNIT);   // 70 = 0 คือไม่ต้องโชว์กรอบรูป

      imgDefs.forEach((d) => {
        w(0, "IMAGEDEF"); w(5, d.h); w(330, hDictImg);
        w(102, "{ACAD_REACTORS"); w(330, d.hReactor); w(102, "}");
        w(100, "AcDbRasterImageDef");
        w(90, 0); w(1, esc(d.file));
        w(10, num(d.pxW)); w(20, num(d.pxH));
        w(11, num(d.sx)); w(21, num(d.sy));
        w(280, 1); w(281, RASTUNIT);
        /* ตัวเชื่อมระหว่างรูปกับนิยามรูป — เจ้าของคือ entity รูป ไม่ใช่ตัวนิยาม */
        w(0, "IMAGEDEF_REACTOR"); w(5, d.hReactor); w(330, d.ent); w(100, "AcDbRasterImageDefReactor");
        w(90, 2); w(330, d.ent);
      });
      w(0, "ENDSEC");

      w(0, "EOF");
      return out.join("\r\n") + "\r\n";
    },
  };

  return api;
}

/* ==================================================================
   กระดาษเขียนแบบ A3 นอน + Title Box แนววิศวกรรม
   วางตามแบบชุดที่บริษัทใช้อยู่ (SHOP DRAWING – SINGLE LINE DIAGRAM)

   ทุกระยะในส่วนนี้คิดเป็น "มิลลิเมตรบนกระดาษ" เสมอ แล้วค่อยคูณ k ตอนวาดจริง
   · แบบ SLD เขียนที่ 1 หน่วย = 1 มม. → k = 1
   · แบบผังหลังคาเขียนที่ 1 หน่วย = 1 เมตร (จะได้วัดระยะจริงในโปรแกรม CAD ได้)
     กระดาษจึงต้องขยายตามมาตราส่วนที่จะพิมพ์ → k = มาตราส่วน / 1000
     (พิมพ์ 1:100 บน A3 = กระดาษกินพื้นที่จริง 42 × 29.7 เมตร)
   ================================================================== */
const PG_SHEET = { W: 420, H: 297, TB: 36, IN: { x0: 26, y0: 16, x1: 404, y1: 281 } };
/* ขนาดตัวหนังสือของแผ่นผัง/ผังสตริง/ต่อสาย DC/วัสดุหน้างาน (มม. บน A3) — ข้อมูลชนิดเดียวกันขนาดเท่ากันทุกแผ่น
   (SLD แน่นกว่า ใช้ชุดของตัวเอง TS ใน pgSldPro) */
const PG_TS = {
  title: 7.4,   // ชื่อแผ่น (OVERALL LAYOUT ฯลฯ)
  head: 3.0,    // หัวรูป/หัวข้อ (STRING x 9 สาย · NOTE)
  body: 2.5,    // หมายเหตุ · ชื่ออุปกรณ์ในรูป · ตารางหลักของแผ่นวัสดุ
  cell: 2.2,    // ตารางข้างแผ่น · มาตราส่วน · สเปค/ป้ายเล็ก (PV 1, MC4, ขั้ว +/−)
};
const PG_LAY = { frame: "PG-FRAME", tb: "PG-TITLEBLOCK", txt: "PG-TB-TEXT", thin: "PG-TB-THIN", logo: "PG-LOGO" };

/* ปากกาที่แปลง "มม.บนกระดาษ" → พิกัดจริงในไฟล์ (เลื่อน ox,oy แล้วคูณ k) */
/* ==================================================================
   pgSvg — ฝาแฝดของ pgDxf ที่คายออกมาเป็น SVG แทนไฟล์ DXF

   มี method ชื่อเดียวกัน รับค่าเหมือนกันทุกตัว โค้ดวาดแบบทุกแผ่นจึงใช้ร่วมกันได้
   ไม่ต้องเขียนซ้ำสองที่ → ตัวอย่างที่เห็นบนจอตรงกับไฟล์ที่โหลดไปเสมอ

   ต่างกันที่:
   · DXF แกน Y ชี้ขึ้น · SVG ชี้ลง → พลิกให้ตอนแปลงพิกัด (มุมหมุนจึงกลับทิศด้วย)
   · ความหนาเส้นในแบบเป็น "มิลลิเมตรบนกระดาษ" ต้องคูณ k (หน่วยแบบต่อ 1 มม.) ก่อนวาด
   · รูปแรสเตอร์ฝังลงใน SVG ได้เลย (ใช้ o.href ที่ DXF ไม่สนใจ)
   ================================================================== */
const PG_ACI_HEX = {
  1: "#e02020", 2: "#c8a800", 3: "#1f9d3a", 4: "#0f9aa8", 5: "#2255cc", 6: "#a83fb0",
  7: "#111111", 8: "#7a7a7a", 9: "#a8a8a8", 30: "#d97706", 140: "#2b7bbd", 200: "#8b5cf6",
  /* สีตราบริษัทบนหัวแบบ (PG_LOGO_ACI) — ตัวอย่างบนจอใช้สีแบรนด์จริง */
  154: "#0A4D68", 144: "#0E6478", 134: "#148080", 124: "#1B9B75", 112: "#22B36A", 142: "#147A8C", 255: "#ffffff",
  /* สีสตริงในผังสตริง (P3_STR_ACI) — ตัวอย่างบนจอใช้สีเดียวกับผังจัดสตริงในหน้าออกแบบระบบ (SU_SCOLOR) */
  160: "#2563EB", 190: "#7C3AED", 10: "#DC2626", 230: "#DB2777", 72: "#65A30D", 20: "#EA580C", 180: "#4F46E5", 250: "#0F172A",
};
function pgSvg(opt) {
  opt = opt || {};
  const FT0 = pgFont(opt.font);
  const FT = pgFontAvail(FT0) ? FT0 : Object.assign({}, PG_FONTS.find((f) => f.key === "tahoma"), { css: "'" + FT0.th + "', Tahoma, sans-serif" });
  const layers = new Map(), ltypes = new Map(), body = [];
  let PLOT = null;
  const ext = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const grow = (x, y) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < ext.minX) ext.minX = x; if (x > ext.maxX) ext.maxX = x;
    if (y < ext.minY) ext.minY = y; if (y > ext.maxY) ext.maxY = y;
  };
  const n = (v) => (Math.round((+v || 0) * 1000) / 1000).toString();
  const enc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /* %%d คือรหัส "องศา" ของ DXF · %%c เส้นผ่านศูนย์กลาง · %%p บวก/ลบ */
  const plain = (s) => String(s == null ? "" : s)
    .replace(/%%d/gi, "°").replace(/%%c/gi, "Ø").replace(/%%p/gi, "±")
    .replace(/[\r\n]+/g, " ");

  let Y0 = 0;                                  // ค่าที่ใช้พลิกแกน ตั้งตอน build()
  const X = (v) => +v || 0, Y = (v) => Y0 - (+v || 0);

  const style = (name) => {
    const L = layers.get(name) || { color: 7, lw: -3, ltype: "CONTINUOUS" };
    const k = (PLOT && PLOT.k) || 1;
    const lw = Math.max(0.06, (L.lw > 0 ? L.lw : 18) / 100) * k;
    const pat = ltypes.get(L.ltype);
    const dash = pat && pat.pat && pat.pat.length
      ? ' stroke-dasharray="' + pat.pat.map((d) => n(Math.max(0.2, Math.abs(d) * k))).join(" ") + '"' : "";
    return { c: PG_ACI_HEX[L.color] || "#111111", w: lw, dash };
  };
  const stroke = (layer, extra) => {
    const s = style(layer);
    return ' fill="none" stroke="' + s.c + '" stroke-width="' + n(s.w) + '"' + s.dash + (extra || "");
  };

  const svgBlocks = new Map();
  const api = {
    /* BLOCK ฝั่งตัวอย่างบนจอ: เก็บฟังก์ชันวาดไว้ แล้ววาดซ้ำผ่านตัวแปลงพิกัดทุกครั้งที่ insert */
    block(name, draw) { if (!svgBlocks.has(name)) svgBlocks.set(name, draw); return name; },
    insert(layer, name, x, y, sx, sy, rot) {
      const draw = svgBlocks.get(name);
      if (draw) draw(pgXfApi(api, layer, x, y, sx, sy, rot));
    },
    layer(name, color, ltype, lw) {
      if (!layers.has(name)) layers.set(name, { name, color: color == null ? 7 : color, ltype: ltype || "CONTINUOUS", lw: lw == null ? -3 : lw });
      return name;
    },
    ltype(name, desc, pat) {
      if (!ltypes.has(name)) ltypes.set(name, { name, desc: desc || "", pat: pat || [] });
      return name;
    },
    line(layer, x1, y1, x2, y2) {
      grow(x1, y1); grow(x2, y2);
      body.push(["line", layer, (F) => '<line x1="' + n(F.X(x1)) + '" y1="' + n(F.Y(y1)) +
        '" x2="' + n(F.X(x2)) + '" y2="' + n(F.Y(y2)) + '"' + stroke(layer) + "/>"]);
    },
    pline(layer, pts, closed) {
      if (!pts || pts.length < 2) return null;
      pts.forEach((p) => grow(p[0], p[1]));
      body.push(["pline", layer, (F) => "<" + (closed ? "polygon" : "polyline") + ' points="' +
        pts.map((p) => n(F.X(p[0])) + "," + n(F.Y(p[1]))).join(" ") + '"' + stroke(layer) + "/>"]);
    },
    rect(layer, x, y, w2, h2) {
      return api.pline(layer, [[x, y], [x + w2, y], [x + w2, y + h2], [x, y + h2]], true);
    },
    circle(layer, x, y, r) {
      grow(x - r, y - r); grow(x + r, y + r);
      body.push(["circle", layer, (F) => '<circle cx="' + n(F.X(x)) + '" cy="' + n(F.Y(y)) +
        '" r="' + n(Math.abs(r) || 0.001) + '"' + stroke(layer) + "/>"]);
    },
    arc(layer, x, y, r, a1, a2) {
      r = Math.abs(r) || 0.001;
      let sw = ((+a2 || 0) - (+a1 || 0)) % 360; if (sw <= 0) sw += 360;
      const p = (a) => [x + r * Math.cos(a * Math.PI / 180), y + r * Math.sin(a * Math.PI / 180)];
      const s = p(a1), e = p(a1 + sw);
      grow(x - r, y - r); grow(x + r, y + r);
      /* แกน Y พลิกแล้ว ทิศกวาดของ SVG จึงกลับด้าน (sweep-flag = 0) */
      body.push(["arc", layer, (F) => '<path d="M ' + n(F.X(s[0])) + " " + n(F.Y(s[1])) +
        " A " + n(r) + " " + n(r) + " 0 " + (sw > 180 ? 1 : 0) + " 0 " +
        n(F.X(e[0])) + " " + n(F.Y(e[1])) + '"' + stroke(layer) + "/>"]);
    },
    solid(layer, p1, p2, p3, p4) {
      const ring = p4 ? [p1, p2, p3, p4] : [p1, p2, p3];
      ring.forEach((p) => grow(p[0], p[1]));
      const s = style(layer);
      body.push(["solid", layer, (F) => '<polygon points="' +
        ring.map((p) => n(F.X(p[0])) + "," + n(F.Y(p[1]))).join(" ") +
        '" fill="' + s.c + '" stroke="none"/>']);
    },
    text(layer, x, y, h2, s, o) {
      o = o || {};
      const ha = +o.align || 0, va = +o.valign || 0;
      const anchor = ha === 1 ? "middle" : ha === 2 ? "end" : "start";
      /* DXF: valign 0 ฐาน · 1 ล่างสุด · 2 กลาง · 3 บนสุด — เลื่อนเองจะได้คุมตำแหน่งเป๊ะ */
      const dy = va === 2 ? h2 * 0.36 : va === 3 ? h2 * 0.88 : va === 1 ? 0 : 0;
      const wf = o.wf == null ? FT.wf : o.wf;
      const col = (PG_ACI_HEX[(layers.get(layer) || {}).color] || "#111111");
      const txt = enc(plain(s));
      grow(x, y); grow(x + String(s || "").length * h2 * 0.6, y + h2);
      body.push(["text", layer, (F) => {
        const tx = F.X(x), ty = F.Y(y) + dy;   // แกน SVG ชี้ลง: ชิดบน/กลาง = เลื่อนฐานลง (ให้ตรงกับ DXF)
        const tr = [];
        if (o.rot) tr.push("rotate(" + n(-o.rot) + " " + n(tx) + " " + n(ty) + ")");
        tr.push("translate(" + n(tx) + " " + n(ty) + ")");
        if (wf !== 1) tr.push("scale(" + n(wf) + " 1)");
        return '<text transform="' + tr.join(" ") + '" font-size="' + n(h2 * FT.k) +
          '" fill="' + col + '" text-anchor="' + anchor +
          '" font-family="' + FT.css.replace(/'/g, "&#39;") + '" style="white-space:pre">' + txt + "</text>";
      }]);
    },
    /* o.href = ตัวรูปจริง (data URL) — DXF ไม่สนใจช่องนี้ แต่ SVG ฝังลงไปได้เลย */
    image(layer, o) {
      const wM = Math.abs(+o.w || 1), hM = Math.abs(+o.h || 1);
      const a = (+o.rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      [[0, 0], [wM, 0], [wM, hM], [0, hM]].forEach(([px, py]) =>
        grow(o.x + px * ca - py * sa, o.y + px * sa + py * ca));
      if (!o.href) return null;
      const op = 1 - Math.max(0, Math.min(100, +o.fade || 0)) / 100;
      body.push(["image", layer, (F) =>
        '<g transform="translate(' + n(F.X(o.x)) + " " + n(F.Y(o.y)) + ") rotate(" + n(-(+o.rot || 0)) + ')">' +
        '<image x="0" y="' + n(-hM) + '" width="' + n(wM) + '" height="' + n(hM) +
        '" opacity="' + n(op) + '" preserveAspectRatio="none" href="' + enc(o.href) + '"/></g>']);
    },
    get extents() { return ext; },
    plot(o) { PLOT = { x0: +o.x0 || 0, y0: +o.y0 || 0, w: +o.w || 420, h: +o.h || 297, k: +o.k || 1 }; },

    build() {
      const E = isFinite(ext.minX) ? ext : { minX: 0, minY: 0, maxX: 100, maxY: 100 };
      const P = PLOT || { x0: E.minX, y0: E.minY, w: E.maxX - E.minX, h: E.maxY - E.minY, k: 1 };
      const w = Math.max(1e-6, P.w * P.k), h = Math.max(1e-6, P.h * P.k);
      Y0 = P.y0 + h;                             // มุมบนซ้ายของกระดาษ = จุด (0,0) ของ SVG
      const F = { X: (v) => X(v) - P.x0, Y };
      const parts = body.map((b) => b[2](F));
      /* height:auto ให้เบราว์เซอร์คิดความสูงจากสัดส่วน viewBox เอง กระดาษจะได้ไม่ยืด */
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n(w) + " " + n(h) +
        '" width="' + n(w) + '" height="' + n(h) + '" style="width:100%;height:auto;display:block"' +
        ' preserveAspectRatio="xMidYMid meet">' +
        '<rect x="0" y="0" width="' + n(w) + '" height="' + n(h) + '" fill="#ffffff"/>' +
        '<g stroke-linecap="round" stroke-linejoin="round">' + parts.join("") + "</g></svg>";
    },
  };
  return api;
}

/* ตัวแปลงพิกัดบล็อก → พิกัดแบบ (ย่อ/ขยาย sx, sy · หมุน rot องศา · เลื่อนไป x, y) · layer "0" ในบล็อก = layer ของตัว insert */
function pgXfApi(base, layer, x, y, sx, sy, rot) {
  const a = (+rot || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  sx = sx == null ? 1 : +sx; sy = sy == null ? 1 : +sy;
  const P = (p) => { const u = p[0] * sx, v = p[1] * sy; return [x + u * c - v * s, y + u * s + v * c]; };
  const L = (l) => (!l || l === "0" ? layer : l);
  const k = Math.sqrt(Math.abs(sx * sy)) || 1;
  return {
    layer: (...q) => base.layer(...q), ltype: (...q) => base.ltype(...q),
    line: (l, x1, y1, x2, y2) => { const p = P([x1, y1]), q = P([x2, y2]); base.line(L(l), p[0], p[1], q[0], q[1]); },
    pline: (l, pts, cl) => base.pline(L(l), (pts || []).map(P), cl),
    rect: (l, x0, y0, w, h) => base.pline(L(l), [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]].map(P), true),
    circle: (l, cx, cy, r) => { const p = P([cx, cy]); base.circle(L(l), p[0], p[1], r * k); },
    solid: (l, p1, p2, p3, p4) => base.solid(L(l), P(p1), P(p2), P(p3), p4 && P(p4)),
    text: (l, tx, ty, h, t, o) => { const p = P([tx, ty]); base.text(L(l), p[0], p[1], h * k, t, Object.assign({}, o, { rot: ((o && o.rot) || 0) + (+rot || 0) })); },
  };
}

/* เลือกตัวเขียนตามงาน — svg = true คือทำไว้ดูบนจอ ไม่ใช่ไฟล์ที่จะโหลด */
function pgDoc(opt, svg) { if (PG_CAPTURE) return PG_CAPTURE(opt); return svg ? pgSvg(opt) : pgDxf(opt); }

/* ── รวมทุกแผ่นไว้ในไฟล์เดียว (ผู้ใช้: ชุดแบบแยกไฟล์ละแผ่นต้องเปิดหลายไฟล์) ──
   แต่ละแผ่นเขียนด้วยหน่วยของตัวเอง (ผัง/ผังสตริง = เมตรตามมาตราส่วน · SLD/ต่อสาย/วัสดุ = มม.)
   ระหว่างรวม pgDoc คืน "ตัวแปลง" แทน: รู้ตำแหน่งกระดาษกับมาตราส่วนของแผ่นจาก doc.plot ที่ pgSheet เรียก (x0,y0,k)
   แล้วแปลงทุกพิกัด/ขนาดกลับเป็น "มม.บนกระดาษ" วางแผ่นที่ i ห่างกัน PG_SET_GAP มม. เรียงซ้าย→ขวา ในไฟล์หน่วย มม. ไฟล์เดียว
   makers = [() => แผ่น.make(svg)] · svg = true คืนภาพตัวอย่างทั้งชุด · DXF ตั้งค่าพิมพ์ไว้ที่แผ่นแรก
   o = { title, labels[], groups[] } — จัดแบบที่ผู้ใช้ทำใน CAD เอง: ชื่อแผ่นเหนือแต่ละแผ่น + กรอบแดงล้อมกลุ่ม ชื่อกลุ่มเหนือกรอบ
   groups[i] = ชื่อหมวดของแผ่นที่ i (COVER / LAYOUT / ELECTRICAL …) — แผ่นติดกันหมวดเดียวกันอยู่แถวเดียวกันในกรอบเดียว
   หมวดถัดไปขึ้นแถวใหม่ใต้แถวเดิม (ชุดแบบ 15 แผ่นเรียงแถวเดียวยาวเกินไป) · ไม่ส่ง groups = แถวเดียวทั้งชุดแบบเดิม */
const PG_SET_GAP = 40, PG_SET_PAD = 30, PG_SET_ROWGAP = 60;
let PG_CAPTURE = null;
function pgCombine(makers, svg, o) {
  o = o || {};
  const n = makers.length, W = PG_SHEET.W, H = PG_SHEET.H, PAD = PG_SET_PAD;
  const out = svg ? pgSvg({}) : pgDxf({ units: "mm", ltscale: 1 });
  /* แผ่นละตำแหน่ง (แถว/คอลัมน์) ตามหมวด */
  const G = o.groups && o.groups.length === n ? o.groups : null;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const g = G ? G[i] : "";
    if (!rows.length || rows[rows.length - 1].g !== g) rows.push({ g, from: i, n: 0 });
    rows[rows.length - 1].n++;
  }
  const FH = H + PAD * 2 + 16, PITCH = FH + PG_SET_ROWGAP;
  const pos = [];
  rows.forEach((r, ri) => { for (let j = 0; j < r.n; j++) pos[r.from + j] = { ox: j * (W + PG_SET_GAP), oy: -ri * PITCH }; });
  const maxN = Math.max.apply(null, rows.map((r) => r.n));
  const FWmax = maxN * W + (maxN - 1) * PG_SET_GAP + PAD * 2;
  if (svg) out.plot({ x0: -PAD, y0: -PAD - (rows.length - 1) * PITCH, w: FWmax, h: FH + 26 + (rows.length - 1) * PITCH, k: 1 });
  /* กรอบกลุ่ม + ชื่อกลุ่ม + ชื่อแผ่น (layer แยก ปิดดูเฉพาะแบบได้) */
  out.layer("PG-SET-FRAME", PG_ACI.red, "CONTINUOUS", 50);
  out.layer("PG-SET-LABEL", PG_ACI.grey, "CONTINUOUS", 35);
  rows.forEach((r, ri) => {
    const FW = r.n * W + (r.n - 1) * PG_SET_GAP + PAD * 2, oy = -ri * PITCH;
    out.rect("PG-SET-FRAME", -PAD, oy - PAD, FW, FH);
    const t = [o.title, r.g].filter(Boolean).join("  ·  ");
    if (t) out.text("PG-SET-LABEL", -PAD + FW, oy - PAD + FH + 6, 16, t, { align: 2 });
  });
  (o.labels || []).forEach((s, i) => { if (s) out.text("PG-SET-LABEL", pos[i].ox + W / 2, pos[i].oy + H + 6, 9, String(s), { align: 1 }); });
  let idx = -1;
  PG_CAPTURE = () => {
    idx++;
    const OX = pos[idx].ox, OY = pos[idx].oy, first = idx === 0;
    let T = { k: 1, x0: 0, y0: 0 };
    const X = (x) => (x - T.x0) / T.k + OX, Y = (y) => (y - T.y0) / T.k + OY, S = (v) => v / T.k;
    const P = (p) => [X(p[0]), Y(p[1])];
    return {
      layer: (a, b, c, d) => out.layer(a, b, c, d),
      ltype: (a, b, c) => out.ltype(a, b, c),
      line: (l, x1, y1, x2, y2) => out.line(l, X(x1), Y(y1), X(x2), Y(y2)),
      pline: (l, pts, c, w) => out.pline(l, (pts || []).map(P), c, w && S(w)),
      rect: (l, x, y, w, h) => out.rect(l, X(x), Y(y), S(w), S(h)),
      circle: (l, x, y, r) => out.circle(l, X(x), Y(y), S(r)),
      arc: (l, x, y, r, a1, a2) => out.arc(l, X(x), Y(y), S(r), a1, a2),
      solid: (l, a, b, c, d) => out.solid(l, P(a), P(b), P(c), d && P(d)),
      text: (l, x, y, h, s, o) => out.text(l, X(x), Y(y), S(h), s, o),
      image: (l, o) => out.image(l, Object.assign({}, o, { x: X(o.x), y: Y(o.y), w: S(o.w), h: S(o.h) })),
      block: (name, draw) => out.block(name, draw),
      hatch: out.hatch ? (l, loops, o) => out.hatch(l, loops.map((L) => L.map(P)), Object.assign({}, o, { sp: S(o.sp || 1) })) : undefined,
      insert: (l, name, x, y, sx, sy, rot) => out.insert(l, name, X(x), Y(y), S(sx == null ? 1 : sx), S(sy == null ? 1 : sy), rot),
      plot: (o) => {
        T = { k: +o.k || 1, x0: +o.x0 || 0, y0: +o.y0 || 0 };
        if (first && !svg) out.plot({ x0: OX, y0: OY, w: +o.w || W, h: +o.h || H, k: 1 });
      },
      get extents() { return out.extents; },
      build: () => "",
    };
  };
  try { makers.forEach((m) => m()); } finally { PG_CAPTURE = null; }
  return out.build();
}

function pgPen(doc, k, ox, oy) {
  k = k || 1; ox = ox || 0; oy = oy || 0;
  const X = (v) => ox + v * k, Y = (v) => oy + v * k, S = (v) => v * k;
  const P = (p) => [X(p[0]), Y(p[1])];
  return {
    k, X, Y, S,
    line: (l, x1, y1, x2, y2) => doc.line(l, X(x1), Y(y1), X(x2), Y(y2)),
    rect: (l, x, y, w, h) => doc.rect(l, X(x), Y(y), S(w), S(h)),
    pline: (l, pts, c) => doc.pline(l, pts.map(P), c),
    circle: (l, x, y, r) => doc.circle(l, X(x), Y(y), S(r)),
    arc: (l, x, y, r, a1, a2) => doc.arc(l, X(x), Y(y), S(r), a1, a2),
    solid: (l, a, b, c, d) => doc.solid(l, P(a), P(b), P(c), d && P(d)),
    text: (l, x, y, h, s, o) => doc.text(l, X(x), Y(y), S(h), s, o),
    /* จุดต่อสายแบบทึบ — DXF ไม่มี "วงกลมทึบ" ตรง ๆ และ HATCH ยุ่งเกินจำเป็น
       จึงประกอบจากสี่เหลี่ยมทึบสองรูปไขว้กัน พิมพ์ออกมาแล้วกลมพอ */
    dot: (l, x, y, r) => {
      const q = r * 0.72;
      doc.solid(l, P([x - r, y]), P([x, y - q]), P([x + r, y]), P([x, y + q]));
      doc.solid(l, P([x - q, y - q]), P([x + q, y - q]), P([x + q, y + q]), P([x - q, y + q]));
    },
  };
}

/* ตัดข้อความยาวเป็นหลายบรรทัด (ไทยไม่มีเว้นวรรคระหว่างคำ จึงตัดตามจำนวนตัวอักษร) */
function pgWrap(s, per) {
  s = String(s == null ? "" : s).trim();
  if (!s) return [];
  const words = s.split(/\s+/), out = []; let cur = "";
  words.forEach((raw) => {
    let wd = raw;
    while (wd.length > per) { if (cur) { out.push(cur); cur = ""; } out.push(wd.slice(0, per)); wd = wd.slice(per); }
    if (!cur) cur = wd;
    else if ((cur + " " + wd).length <= per) cur += " " + wd;
    else { out.push(cur); cur = wd; }
  });
  if (cur) out.push(cur);
  return out;
}

function pgSheetLayers(doc) {
  doc.ltype("PG-DASH", "Dashed __ __ __", [6, -3]);
  doc.ltype("PG-DOT", "Dotted . . . .", [0.4, -2.4]);
  doc.layer(PG_LAY.frame, PG_ACI.white, "CONTINUOUS", 35);   // เดิม 0.50 / 0.25 — ผู้ใช้ว่าเส้นกรอบหนาไป
  doc.layer(PG_LAY.tb, PG_ACI.white, "CONTINUOUS", 13);
  doc.layer(PG_LAY.txt, PG_ACI.white, "CONTINUOUS", 18);
  doc.layer(PG_LAY.thin, PG_ACI.ltgrey, "CONTINUOUS", 9);
  doc.layer(PG_LAY.logo, PG_ACI.green, "CONTINUOUS", 35);
}

/* ตราสัญลักษณ์ flash+solar บนหัวแบบ — หกเหลี่ยม 6 ด้านสีตามแบรนด์ ผ่ากลางด้วยสายฟ้าขาว (ทึบ ไม่ใช่เส้น)
   พิกัดยกมาจากไฟล์โลโก้ (กรอบ 200×200 · brand.jsx) แล้วกลับแกน y เพราะแบบ DXF นับ y ขึ้น ส่วน SVG นับลง
   สี DXF ใช้ ACI ที่ใกล้สีแบรนด์ (PG_LOGO_ACI) · ตัวอย่าง SVG ใช้สีแบรนด์จริงผ่าน PG_ACI_HEX */
const PG_LOGO_HEX = [[100, 30], [160.6, 65], [160.6, 135], [100, 170], [39.4, 135], [39.4, 65]];
const PG_LOGO_BOLT = [[104, 55], [74, 101], [92, 101], [84, 145], [120, 91], [98, 91]];
const PG_LOGO_ACI = [154, 144, 134, 124, 112, 142];     // ด้านละสี เรียงตาม BRAND_FACET_PTS
function pgLogoLayers(doc) {
  PG_LOGO_ACI.forEach((c, i) => doc.layer("PG-LOGO-" + (i + 1), c, "CONTINUOUS", 0));
  doc.layer("PG-LOGO-BOLT", 255, "CONTINUOUS", 0);
}
function pgLogoMark(pen, x, y, s) {
  const at = (p) => [x + (p[0] / 200) * s, y + s - (p[1] / 200) * s];
  const C = at([100, 100]);
  /* ด้านที่ i ของหกเหลี่ยม = จุดกลาง + มุมสองมุมติดกัน (ลำดับเดียวกับ BRAND_FACET_PTS: ขวาบน → ซ้ายบน → ซ้าย → ซ้ายล่าง → ขวาล่าง → ขวา) */
  const H = [[160.6, 65], [100, 30], [39.4, 65], [39.4, 135], [100, 170], [160.6, 135]];
  H.forEach((p, i) => pen.solid("PG-LOGO-" + (i + 1), C, at(p), at(H[(i + 1) % 6])));
  /* สายฟ้าเว้า SOLID รับได้แค่ 4 จุด → ผ่าเป็นสี่เหลี่ยมนูนสองชิ้น */
  const B = PG_LOGO_BOLT.map(at);
  pen.solid("PG-LOGO-BOLT", B[0], B[1], B[2], B[5]);
  pen.solid("PG-LOGO-BOLT", B[5], B[4], B[3], B[2]);
}

/* ── กรอบกระดาษ + แถบพิกัด + Title Box ──
   o.k       : หน่วยของแบบต่อ 1 มม.บนกระดาษ (1 = เขียนเป็นมิลลิเมตร)
   o.ox/o.oy : มุมล่างซ้ายของกระดาษ ในพิกัดของแบบ
   o.info    : ข้อมูลที่จะกรอกลงช่องต่าง ๆ
   คืน { pen, area } · area = กรอบพื้นที่เขียนแบบที่เหลือ (หน่วย มม.) ให้ผู้เรียกจัดรูปเอง */
function pgSheet(doc, o) {
  o = o || {};
  const I = o.info || {};
  pgSheetLayers(doc);
  pgLogoLayers(doc);
  doc.layer("PG-TB-MARK", PG_ACI.red, "CONTINUOUS", 25);
  const K = o.k == null ? 1 : o.k;
  const pen = pgPen(doc, K, o.ox || 0, o.oy || 0);
  const S = PG_SHEET, IN = S.IN, F = PG_LAY;
  /* บอกไฟล์ว่ากระดาษ A3 แนวนอนวางคร่อมตรงไหน → สั่งพิมพ์ได้เลยโดยไม่ต้องตั้งค่าเอง */
  doc.plot({ x0: o.ox || 0, y0: o.oy || 0, w: S.W, h: S.H, k: K });

  pen.rect(F.thin, 5, 5, S.W - 10, S.H - 10);        // เส้นตัดกระดาษ
  pen.rect(F.frame, 20, 10, 390, 277);               // กรอบแบบ (เว้นซ้าย 20 มม. ไว้เข้าเล่ม)
  pen.rect(F.tb, IN.x0, IN.y0, IN.x1 - IN.x0, IN.y1 - IN.y0);

  /* แถบพิกัดอ้างอิง 1–19 (แนวนอน) และ A–N (แนวตั้ง) — ไว้ชี้ตำแหน่งกันตอนคุยงานทางโทรศัพท์ */
  const COLS = 19, ROWS = 14, LTRS = "ABCDEFGHIJKLMN";
  const cw = (IN.x1 - IN.x0) / COLS, ch = (IN.y1 - IN.y0) / ROWS;
  for (let i = 0; i <= COLS; i++) {
    const x = IN.x0 + i * cw;
    if (i > 0 && i < COLS) { pen.line(F.tb, x, 10, x, IN.y0); pen.line(F.tb, x, IN.y1, x, 287); }
    if (i < COLS) {
      pen.text(F.txt, x + cw / 2, 12.2, 2.4, String(i + 1), { align: 1, valign: 1 });
      pen.text(F.txt, x + cw / 2, 282.6, 2.4, String(i + 1), { align: 1, valign: 1 });
    }
  }
  for (let j = 0; j <= ROWS; j++) {
    const y = IN.y0 + j * ch;
    if (j > 0 && j < ROWS) { pen.line(F.tb, 20, y, IN.x0, y); pen.line(F.tb, IN.x1, y, 410, y); }
    if (j < ROWS) {
      const c = LTRS[j];   // A อยู่ล่าง ไล่ขึ้นไป N ตามธรรมเนียมแบบก่อสร้าง
      pen.text(F.txt, 23, y + ch / 2, 2.6, c, { align: 1, valign: 2 });
      pen.text(F.txt, 407, y + ch / 2, 2.6, c, { align: 1, valign: 2 });
    }
  }

  /* ── Title Box ทางขวา (แบบใหม่ ต.ค. 2026 ตามตัวอย่างที่ผู้ใช้ส่งมา · แถบแคบ 36 มม. — ตัวอย่างกว้าง 33) ──
     ข้อมูลหลักกึ่งกลางช่อง ย่อให้พอดีความกว้างเอง · บล็อกบริษัทโลโก้สีอยู่กลาง · ช่องลงนามวิศวกร/ผู้เขียนแบบเว้นว่างไว้ (ยังไม่ใส่ชื่อ) */
  const tx0 = IN.x1 - S.TB, tx1 = IN.x1, TW = S.TB, cx = (tx0 + tx1) / 2;
  const ROW = [["site", 63], ["loc", 10], ["proj", 10], ["own", 11], ["logo", 32], ["stat", 20],
    ["se", 12], ["me", 12], ["ee", 27], ["rev", 27], ["sign", 18], ["pno", 14], ["scale", 9]];
  const Y = {}; let cy = IN.y1;
  ROW.forEach((r) => { Y[r[0]] = { top: cy, bot: cy - r[1], h: r[1] }; cy -= r[1]; });
  pen.line(F.tb, tx0, IN.y0, tx0, IN.y1);
  ROW.forEach((r) => { if (Y[r[0]].bot > IN.y0 + 0.01) pen.line(F.tb, tx0, Y[r[0]].bot, tx1, Y[r[0]].bot); });

  /* ขนาดตัวหนังสือในหัวแบบ — ข้อมูลชนิดเดียวกันขนาดเท่ากันทุกช่อง (ผู้ใช้: เล็ก ๆ ใหญ่ ๆ ดูแปลก)
     ข้อความยาวให้ตัดบรรทัด ไม่ย่อตัว · fitH เป็นแค่กันล้นสุดทาง (ข้อความยาวผิดปกติ) */
  const TS = { lab: 1.3, val: 1.9, no: 2.2, name: 1.5, det: 1.15, stat: 1.6, head: 1.15, cell: 1.25 };
  const CHW = 0.55;                                    // ความกว้างตัวอักษรโดยประมาณ ต่อความสูง
  const fitH = (s, w, hMax) => Math.min(hMax, w / (Math.max(1, String(s).length) * CHW));
  const lab = (y, s) => pen.text(F.txt, tx0 + 1.2, y - 2.2, TS.lab, s);
  const mid = (y, h, s, va) => pen.text(F.txt, cx, y, h, s, { align: 1, valign: va == null ? 1 : va });
  /* ข้อความกึ่งกลางช่อง (ใต้ป้ายหัวช่อง) — ขนาด TS.val เสมอ ตัดบรรทัดตามความกว้าง · ลดขนาดเฉพาะเมื่อเกิน maxL บรรทัดจริง ๆ */
  const block = (R, s, maxL) => {
    let h = TS.val, L = [];
    for (; h >= 1.2; h -= 0.1) {
      L = pgWrap(s, Math.max(4, Math.floor((TW - 3) / (h * CHW))));
      if (L.length <= maxL && L.length * h * 1.6 <= R.h - 3.5) break;
    }
    L = L.slice(0, maxL);
    const gap = h * 1.6, yc = (R.top - 3 + R.bot) / 2;
    L.forEach((ln, i) => mid(yc + ((L.length - 1) / 2 - i) * gap, h, ln, 2));
  };

  /* 1 · ที่อยู่หน้างาน */
  lab(Y.site.top, "SITE LOCATION MAP :");
  block(Y.site, I.address || "-", 12);

  /* 2 · พิกัดจริงจากแผนที่ดาวเทียม */
  lab(Y.loc.top, "LOCATION :");
  block(Y.loc, I.location || "-", 1);

  /* 3 · ชื่อโครงการ (ระบุขนาดระบบ) */
  lab(Y.proj.top, "PROJECT :");
  block(Y.proj, I.project || "-", 2);

  /* 4 · เจ้าของงาน */
  lab(Y.own.top, "OWNER :");
  block(Y.own, I.owner || "-", 2);

  /* 5 · บล็อกบริษัท — ตราสี + ชื่อ flash+solar (บวกสีเขียว) + ชื่อจดทะเบียนไทย/อังกฤษ + ที่อยู่ ดึงจาก brand.jsx ที่เดียว */
  const B = window.BRANDING || {};
  /* โลโก้จริงของบริษัท (รูป PNG ตัดขอบแล้ว · I.logo จาก p3LogoPrep) — DXF อ้างไฟล์รูปวางโฟลเดอร์เดียวกัน
     ไม่มีรูป (เตรียมไม่ได้/เรียกจากที่อื่น) = ตราหกเหลี่ยมเวกเตอร์ + ชื่อ flash+solar แบบเดิม */
  const LG = I.logo;
  let ly = 0;                                           // ระยะที่ใช้ไปจากขอบบนของบล็อก
  if (LG && LG.pxW && LG.pxH) {
    let lh = 14, lw = lh * LG.pxW / LG.pxH;
    if (lw > TW - 6) { lw = TW - 6; lh = lw * LG.pxH / LG.pxW; }
    doc.layer("PG-LOGO-IMG", PG_ACI.white, "CONTINUOUS", 0);
    doc.image("PG-LOGO-IMG", { file: LG.file, href: LG.href, pxW: LG.pxW, pxH: LG.pxH, transp: true,
      x: pen.X(cx - lw / 2), y: pen.Y(Y.logo.top - 1.2 - lh), w: pen.S(lw), h: pen.S(lh) });
    ly = 1.2 + lh + 2.2 - 15.6;                          // กึ่งกลางชื่อบริษัทต่ำกว่าขอบล่างรูป 2.2 มม.
  } else {
    pgLogoMark(pen, cx - 4.5, Y.logo.top - 10.2, 9);
    const wh = 2.6, wy = Y.logo.top - 12.6;
    pen.text(F.txt, cx - wh * 0.4, wy, wh, "flash", { align: 2, valign: 2, wf: 1 });
    pen.text("PG-LOGO-5", cx, wy, wh, "+", { align: 1, valign: 2, wf: 1 });
    pen.text(F.txt, cx + wh * 0.4, wy, wh, "solar", { align: 0, valign: 2, wf: 1 });
  }
  mid(Y.logo.top - ly - 15.6, fitH(B.legalTH || "", TW - 3, TS.name), B.legalTH || "", 2);
  mid(Y.logo.top - ly - 18.1, fitH(B.legal || "", TW - 3, TS.name), B.legal || "", 2);
  pgWrap(B.addrTH || "", Math.floor((TW - 3) / (TS.det * CHW))).slice(0, 2).concat(["TEL : " + (B.tel || ""), "E-mail : " + (B.email || "")])
    .forEach((ln, i) => mid(Y.logo.top - ly - 20.6 - i * 1.85, fitH(ln, TW - 3, TS.det), ln, 2));

  /* 6 · สถานะของแบบ — วงกลมหนา จุดแดงทึบคืออันที่ใช้อยู่ */
  [["FOR PRELIMINARY", "prelim"], ["FOR PERMISSION", "permit"],
    ["FOR CONSTRUCTION", "construct"], ["FOR AS-BUILT", "asbuilt"]].forEach((s, i) => {
    const y = Y.stat.top - 3.4 - i * 4.4;
    pen.circle(F.frame, tx0 + 4, y, 1.3);
    if ((I.status || "construct") === s[1]) pen.dot("PG-TB-MARK", tx0 + 4, y, 0.95);
    pen.text(F.txt, tx0 + 7.5, y, TS.stat, s[0], { valign: 2 });
  });

  /* 7-8 · ช่องลงนามวิศวกรโครงสร้าง/เครื่องกล — เส้นว่าง 3 เส้น */
  [["se", "STRUCTURAL ENGINEERS :"], ["me", "MECHANICAL ENGINEERS :"]].forEach((r) => {
    lab(Y[r[0]].top, r[1]);
    for (let i = 0; i < 3; i++) {
      const y = Y[r[0]].bot + 1.6 + i * 2.4;
      pen.line(F.thin, tx0 + 1.5, y, tx1 - 1.5, y);
    }
  });

  /* 9 · วิศวกรไฟฟ้า — กรอบลายเซ็น + เส้นชื่อ + เลขใบอนุญาต (ภฟก.) เว้นว่างไว้กรอกเอง */
  lab(Y.ee.top, "ELECTRICAL ENGINEERS :");
  pen.rect(F.tb, tx0 + 4, Y.ee.bot + 8, TW - 8, Y.ee.h - 12);
  pen.line(F.thin, tx0 + 6, Y.ee.bot + 4.8, tx1 - 6, Y.ee.bot + 4.8);
  pen.text(F.txt, tx0 + 6, Y.ee.bot + 1.5, TS.lab, "ภฟก.", { valign: 1 });
  pen.line(F.thin, tx0 + 11, Y.ee.bot + 1.5, tx1 - 6, Y.ee.bot + 1.5);

  /* 10 · ตารางแก้แบบ — แถวแรกคือออกแบบครั้งแรก (REV 0) */
  const RC = [5, 14, 9, 8].map((v) => v / 36 * TW), RH = ["REV.", "DESCRIPTION", "APPROVED", "DATE"];
  const hH = 4, rH = (Y.rev.h - hH) / 5;
  const rHead = Y.rev.top - hH;
  let rx = tx0;
  pen.line(F.tb, tx0, rHead, tx1, rHead);
  RC.forEach((w2, i) => {
    pen.text(F.txt, rx + w2 / 2, rHead + hH / 2, fitH(RH[i], w2 - 1, TS.head), RH[i], { align: 1, valign: 2 });
    rx += w2; if (i < RC.length - 1) pen.line(F.tb, rx, Y.rev.top, rx, Y.rev.bot);
  });
  for (let i = 1; i < 5; i++) pen.line(F.thin, tx0, rHead - i * rH, tx1, rHead - i * rH);
  const r0 = [I.rev || "0", "FIRST ISSUE", "", I.date || ""];
  rx = tx0;
  RC.forEach((w2, i) => {
    if (r0[i]) pen.text(F.txt, i === 1 ? rx + 0.8 : rx + w2 / 2, rHead - rH / 2, fitH(r0[i], w2 - 1, TS.cell), r0[i],
      { align: i === 1 ? 0 : 1, valign: 2 });
    rx += w2;
  });

  /* 11 · ผู้เขียน / ออกแบบ / ตรวจ / อนุมัติ — ช่องชื่อเว้นว่าง (ใส่ได้ทาง info.drawn ฯลฯ) */
  const sx = tx0 + 12;
  pen.line(F.tb, sx, Y.sign.top, sx, Y.sign.bot);
  [["DRAWN", I.drawn], ["DESIGN", I.design], ["CHECKED", I.checked], ["APPROVED", I.approved]]
    .forEach((r, i) => {
      const yb = Y.sign.top - (i + 1) * 4.5;
      if (i < 3) pen.line(F.tb, tx0, yb, tx1, yb);
      pen.text(F.txt, tx0 + 1.2, yb + 2.25, TS.lab, r[0], { valign: 2 });
      if (r[1]) pen.text(F.txt, (sx + tx1) / 2, yb + 2.25, fitH(r[1], tx1 - sx - 1, TS.val), r[1], { align: 1, valign: 2 });
    });

  /* 12 · เลขที่โครงการ / เลขที่แบบ (เลขแบบตัวใหญ่ ย่อให้พอดีช่อง) */
  const pHead = Y.pno.top - 3.6, px = tx0 + TW * 0.4;
  pen.line(F.tb, tx0, pHead, tx1, pHead);
  pen.line(F.tb, px, Y.pno.top, px, Y.pno.bot);
  pen.text(F.txt, (tx0 + px) / 2, pHead + 1.8, fitH("PROJECT NO.", px - tx0 - 1, TS.head), "PROJECT NO.", { align: 1, valign: 2 });
  pen.text(F.txt, (px + tx1) / 2, pHead + 1.8, TS.head, "DRAWING NUMBER", { align: 1, valign: 2 });
  const pno = I.projectNo || "", dno = I.drawingNo || "";
  pen.text(F.txt, (tx0 + px) / 2, (pHead + Y.pno.bot) / 2, fitH(pno, px - tx0 - 1.5, TS.val), pno, { align: 1, valign: 2 });
  pen.text(F.txt, (px + tx1) / 2, (pHead + Y.pno.bot) / 2, fitH(dno, tx1 - px - 1.5, TS.no), dno, { align: 1, valign: 2 });

  /* 13 · มาตราส่วน / วันที่ / แผ่นที่ / ครั้งที่แก้ */
  const sHead = Y.scale.top - 3.6, sw = TW / 4;
  pen.line(F.tb, tx0, sHead, tx1, sHead);
  [["SCALE", I.scale], ["DATE", I.date], ["SHEET NO.", I.sheetNo], ["REV.", I.rev]].forEach((r, i) => {
    const x = tx0 + i * sw;
    if (i) pen.line(F.tb, x, Y.scale.top, x, IN.y0);
    pen.text(F.txt, x + sw / 2, sHead + 1.8, fitH(r[0], sw - 1, TS.head), r[0], { align: 1, valign: 2 });
    pen.text(F.txt, x + sw / 2, (sHead + IN.y0) / 2, fitH(r[1] || "", sw - 1, TS.cell), r[1] || "", { align: 1, valign: 2 });
  });

  /* หมายเหตุประจำแบบ — วางใต้กรอบแบบ ไม่ให้ไปทับแถบพิกัด */
  pen.text(F.txt, 20, 6.4, 2.2,
    "GENERAL NOTE:  THIS DRAWING IS THE PROPERTY OF FLASHPLUSSOLAR CO., LTD. AND SHALL NOT BE USED OR REPRODUCED WITHOUT PERMISSION."
    + "  DO NOT SCALE THIS DRAWING. USE FIGURED DIMENSION ONLY.", { valign: 1 });

  return {
    pen,
    area: { x0: IN.x0, y0: IN.y0, x1: tx0, y1: IN.y1 },
    /* ช่อง SITE LOCATION MAP — เว้นไว้ให้ผู้เรียกเอาภาพถ่ายทางอากาศมาแปะได้ */
    siteBox: { x0: tx0 + 1.5, y0: Y.site.bot + 1.5, x1: tx1 - 1.5, y1: Y.site.top - 4.5 },
  };
}

/* หัวเรื่องใหญ่ประจำแผ่น พร้อมเส้นใต้ ตามธรรมเนียมของแบบชุดนี้
   maxW = ความกว้างที่ยอมให้กินได้ (มม.) — ถ้าเกินจะย่อขนาดตัวอักษรลงให้พอดี ไม่ให้ล้ำไปทับรูป */
/* ความกว้างโดยประมาณของข้อความสูง h (มม.) — นับทีละตัว: สระบน/ล่าง+วรรณยุกต์ไทยไม่กินที่ · ตัวใหญ่กว้างกว่าตัวเล็ก
   ใช้ลากเส้นใต้ให้ยาวพอดีข้อความ (ผู้ใช้: เส้นใต้สั้นกว่าตัวหนังสือ) */
function pgTextW(s, h) {
  let w = 0;
  for (const ch of String(s == null ? "" : s)) {
    if (/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(ch)) continue;
    w += /[\u0E00-\u0E7F]/.test(ch) ? 0.56 : /[A-Z0-9]/.test(ch) ? 0.64 : ch === " " ? 0.32 : /[a-z]/.test(ch) ? 0.52 : 0.45;
  }
  return w * h;
}
/* sub = บรรทัดมาตราส่วนใต้เส้น (ตัวเลข = "SCALE A3 = 1:n A1 = 1:m" · null = N.T.S. · undefined = ไม่มี)
   ทุกแผ่นใช้รูปแบบเดียวกับหัวแผ่นผังวางแผง (ผู้ใช้: ทำแบบนี้ทุกหน้าที่เป็นหัวข้อ) */
function pgScaleTxt(sc) { return sc ? "SCALE   A3 = 1:" + sc + "   A1 = 1:" + Math.round(sc / 1.414) : "SCALE   N.T.S."; }
function pgSheetTitle(pen, x, y, s, h, maxW, align, sub) {
  if (sub !== undefined) pen.text("PG-NOTE", x, y - 7, 2.4, typeof sub === "string" ? sub : pgScaleTxt(sub), { align: align == null ? 1 : align });
  h = h || 6.5;
  const n = String(s).length || 1;
  if (maxW) h = Math.min(h, maxW / (n * 0.62));
  const a = align == null ? 1 : align;                 // 0 = ชิดซ้าย · 1 = กึ่งกลาง · 2 = ชิดขวา
  pen.text(PG_LAY.txt, x, y, h, s, { align: a, valign: 1, wf: 1.0 });
  const w = pgTextW(s, h) + h * 0.4;
  const x0 = a === 0 ? x : a === 2 ? x - w : x - w / 2;
  pen.line(PG_LAY.txt, x0, y - h * 0.3, x0 + w, y - h * 0.3);
}

/* ==================================================================
   ตาราง/สัญลักษณ์ที่ใช้ซ้ำได้ทุกแผ่นในชุดแบบ
   ทุกฟังก์ชันรับ pen ของ pgSheet มา พิกัดจึงเป็น "มิลลิเมตรบนกระดาษ"
   ไม่ว่าแผ่นนั้นจะย่อขยายเท่าไร ขนาดตัวหนังสือกับความหนาตารางจะเท่ากันเสมอ
   ================================================================== */
const PG_TBL = { line: "PG-TB-TABLE", txt: "PG-TB-TXT", head: "PG-TB-HEAD" };
function pgTableLayers(doc) {
  doc.layer(PG_TBL.line, PG_ACI.white, "CONTINUOUS", 18);
  doc.layer(PG_TBL.txt, PG_ACI.white, "CONTINUOUS", 13);
  doc.layer(PG_TBL.head, PG_ACI.ltgrey, "CONTINUOUS", 25);
  doc.layer("PG-DETAIL", PG_ACI.red, "CONTINUOUS", 30);
  doc.layer("PG-NORTH", PG_ACI.grey, "CONTINUOUS", 25);
  doc.layer("PG-PHOTO", PG_ACI.grey, "CONTINUOUS", 9);
}

/* ตารางหลายคอลัมน์ · cols = สัดส่วนความกว้าง · rows = [[cell,…],…]
   แถวที่ขึ้นต้นด้วย "#" คือแถวหัวเรื่องพาดยาวเต็มความกว้าง
   คืนความสูงที่ใช้ไป เพื่อให้ผู้เรียกวางของถัดไปต่อได้ */
/* ใส่ PG_SPAN ในช่อง = รวมกับช่องทางซ้าย (ช่องยาว เช่นแถว รวม ของตารางเมทริกซ์ MPPT — ผู้ใช้: ทำเป็นช่องยาวเลย) */
const PG_SPAN = "~~SPAN~~";
function pgGrid(pen, x, y, w, cols, rows, o) {
  o = o || {};
  const L = PG_TBL.line, T = PG_TBL.txt;
  const rh = o.rh || 5.0, th = o.th || 2.3;
  const sum = cols.reduce((s, c) => s + c, 0);
  const CW = cols.map((c) => c / sum * w);
  const AL = o.align || cols.map(() => 1);
  let cy = y;
  rows.forEach((r, ri) => {
    const h = r[0] === "#" ? rh * 1.08 : rh;
    if (r[0] === "#" || o.headRow === ri) pen.solid(PG_TBL.head, [x, cy - h], [x + w, cy - h], [x + w, cy], [x, cy]);
    pen.rect(L, x, cy - h, w, h);
    if (r[0] === "#") {
      pen.text(T, x + 2, cy - h + (h - th) / 2, th * 1.15, String(r[1] == null ? "" : r[1]));
    } else {
      let cx = x;
      CW.forEach((cw0, i) => {
        if (r[i] === PG_SPAN) { cx += cw0; return; }     // ช่องที่ถูกรวมกับช่องก่อนหน้า — ไม่มีเส้นแบ่ง ไม่มีข้อความ
        if (i) pen.line(L, cx, cy, cx, cy - h);
        let cw = cw0;
        for (let j = i + 1; j < CW.length && r[j] === PG_SPAN; j++) cw += CW[j];
        const v = r[i] == null ? "" : String(r[i]);
        const a = AL[i] == null ? 1 : AL[i];
        pen.text(T, a === 0 ? cx + 2 : a === 2 ? cx + cw - 2 : cx + cw / 2, cy - h + (h - th) / 2, th, v,
          { align: a, valign: 1 });
        cx += cw0;
      });
    }
    cy -= h;
  });
  return y - cy;
}

/* ตารางแบบ "หัวข้อ : ค่า" สองคอลัมน์ต่อแถว อย่างบล็อกสรุปโครงการในแบบจริง
   pairs = [[ซ้ายหัวข้อ, ซ้ายค่า, ขวาหัวข้อ, ขวาค่า], …] · ช่องไหนว่างก็เว้นได้ */
function pgSpecBlock(pen, x, y, w, title, pairs, o) {
  o = o || {};
  const L = PG_TBL.line, T = PG_TBL.txt;
  const rh = o.rh || 5.0, th = o.th || 2.4, half = w * (o.split == null ? 0.55 : o.split);
  let cy = y;
  pen.solid(PG_TBL.head, [x, cy - rh], [x + w, cy - rh], [x + w, cy], [x, cy]);
  pen.rect(L, x, cy - rh, w, rh);
  pen.text(T, x + 2, cy - rh + (rh - th * 1.15) / 2, th * 1.15, title);
  cy -= rh;
  pairs.forEach((p) => {
    pen.rect(L, x, cy - rh, w, rh);
    const cell = (cx, cw, key, val) => {
      if (key == null) return;
      pen.text(T, cx + 2, cy - rh + (rh - th) / 2, th, String(key));
      pen.text(T, cx + cw * 0.34, cy - rh + (rh - th) / 2, th, ":  " + String(val == null ? "" : val));
    };
    const wide = p[2] == null;
    if (wide && o.kw) { pen.text(T, x + 2, cy - rh + (rh - th) / 2, th, String(p[0])); pen.text(T, x + w * o.kw, cy - rh + (rh - th) / 2, th, ":  " + String(p[1] == null ? "" : p[1])); }
    else cell(x, wide ? w : half, p[0], p[1]);
    if (!wide) { pen.line(L, x + half, cy, x + half, cy - rh); cell(x + half, w - half, p[2], p[3]); }
    cy -= rh;
  });
  return y - cy;
}

/* เข็มทิศแบบที่ใช้ในแบบจริง — เข็มทึบชี้เหนือ มีองศา 0/90/180 กำกับ */
/* เข็มทิศ · rot = องศาที่ผังถูกหมุน (ทวนเข็ม) — ลูกศรชี้ทิศเหนือจริงของผัง ตัวหนังสือตั้งตรง */
function pgCompass(pen, x, y, r, layer, rot) {
  const L = layer || "PG-NORTH";
  const a = (+rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const R = (dx, dy) => [x + dx * ca - dy * sa, y + dx * sa + dy * ca];
  const ln = (p, q) => pen.line(L, p[0], p[1], q[0], q[1]);
  const tx = (dx, dy, h, s) => { const p = R(dx, dy); pen.text(L, p[0], p[1], h, s, { align: 1, valign: 2 }); };
  pen.circle(L, x, y, r);
  ln(R(-r * 1.25, 0), R(r * 1.25, 0));
  ln(R(0, -r * 1.25), R(0, r * 1.25));
  const q = r * 0.26;
  pen.solid(L, R(0, r * 1.15), R(-q, -r * 0.55), R(0, -r * 0.3), R(q, -r * 0.55));
  tx(0, r * 2.15, 2.4, "NORTH");
  tx(0, r * 1.55, 2.0, "0" + "%%d");
  tx(0, -r * 1.65, 2.0, "180" + "%%d");
  tx(-r * 1.75, 0, 2.0, "270" + "%%d");
  tx(r * 1.75, 0, 2.0, "90" + "%%d");
}

/* หน้าแผงแบบแบบจริง: กรอบอะลูมิเนียมเส้นคู่ + ตารางเซลล์ nc × nr อยู่ในกรอบใน + รูยึดเล็กบนขอบยาว (ผู้ใช้: รูปแผงเดิมดูไม่สวย)
   L = เส้นกรอบ · Lc = เส้นเซลล์ (บางกว่า) · คืนกรอบใน */
function pgModFace(pen, L, Lc, x, y, w, h, nc, nr, holes) {
  const f = Math.max(0.35, Math.min(w, h) * 0.035);
  pen.rect(L, x, y, w, h);
  pen.rect(L, x + f, y + f, w - 2 * f, h - 2 * f);
  const ix = x + f, iy = y + f, iw = w - 2 * f, ih = h - 2 * f;
  if (nc) for (let i = 1; i < nc; i++) pen.line(Lc, ix + iw * i / nc, iy, ix + iw * i / nc, iy + ih);
  if (nr) for (let j = 1; j < nr; j++) pen.line(Lc, ix, iy + ih * j / nr, ix + iw, iy + ih * j / nr);
  if (holes) [0.22, 0.78].forEach((t) => {
    const hy = y + h * t, hh = Math.max(0.6, f * 1.6), hw = f * 0.55;
    pen.rect(L, x + f * 0.2, hy - hh / 2, hw, hh);
    pen.rect(L, x + w - f * 0.2 - hw, hy - hh / 2, hw, hh);
  });
  return { x: ix, y: iy, w: iw, h: ih, f };
}

/* รูปแผงโซล่า — ด้านหน้า / ด้านข้าง / ด้านหลัง พร้อมขนาดจริงเป็นมิลลิเมตร
   o = { wMm, hMm, tMm, caption } (ขนาดจริงของแผง หน่วยมิลลิเมตร) · เส้นดำทั้งหมด (เดิมกรอบแดง เซลล์ล้นกรอบ) */
function pgModuleDetail(pen, x, y, h, o) {
  o = o || {};
  const L = PG_TBL.line, T = PG_TBL.txt, C = PG_TBL.txt;
  const wMm = +o.wMm || 1134, hMm = +o.hMm || 2382, tMm = +o.tMm || 30;
  const w = h * (wMm / hMm);                 // ความกว้างบนกระดาษ ตามสัดส่วนแผงจริง
  const tw = Math.max(1.6, h * (tMm / hMm) * 4);   // ด้านข้างบางมาก ขยายให้พอมองเห็น
  const gap = 6;
  const cap = (cx, s) => {
    pen.text(T, cx, y - 4.4, 2.2, s, { align: 1, valign: 1 });
    const hw = Math.max(pgTextW(s, 2.2) / 2 + 2.5, 6);
    pen.line(L, cx - hw, y - 5.2, cx + hw, y - 5.2);
  };
  /* ด้านหน้า — กรอบคู่ + เซลล์ 6 × 12 */
  pgModFace(pen, L, C, x, y, w, h, 6, 12, false);
  cap(x + w / 2, "FRONT");
  /* ด้านข้าง — โปรไฟล์กรอบ (ปีกบน/ล่าง + กระจกบาง) */
  const sx = x + w + gap;
  pen.rect(L, sx, y, tw, h);
  pen.line(C, sx + tw * 0.3, y + 0.6, sx + tw * 0.3, y + h - 0.6);
  pen.line(L, sx, y + 1.2, sx + tw, y + 1.2); pen.line(L, sx, y + h - 1.2, sx + tw, y + h - 1.2);
  cap(sx + tw / 2, "SIDE");
  /* ด้านหลัง — กรอบคู่ · กล่องต่อสายกลางแผง สาย +/− ออกซ้ายขวาแล้วลงหัว MC4
     (ผู้ใช้: เอารูยึด/เส้นคานกลางออก กล่องต่อสายอยู่กลางแผง ให้หน้าตาสวย) */
  const bx = sx + tw + gap;
  pgModFace(pen, L, null, bx, y, w, h, 0, 0, false);
  const cx = bx + w / 2, jw = w * 0.34, jh = Math.max(2.4, h * 0.055), jx = cx - jw / 2, jy = y + h / 2 - jh / 2;
  pen.rect(L, jx, jy, jw, jh);
  pen.rect(C, jx + jw * 0.08, jy + jh * 0.2, jw * 0.84, jh * 0.6);          // ฝากล่อง
  pen.line(C, jx + jw / 3, jy + jh * 0.2, jx + jw / 3, jy + jh * 0.8);
  pen.line(C, jx + jw * 2 / 3, jy + jh * 0.2, jx + jw * 2 / 3, jy + jh * 0.8);
  pen.text(T, cx, jy + jh + 1.4, 1.8, "JUNCTION BOX", { align: 1, valign: 1 });
  const mc = (sgn, lab) => {
    const x0 = cx + sgn * jw / 2, x1 = cx + sgn * w * 0.3, yc = jy + jh / 2, y1 = y + h * 0.26;
    pen.line(L, x0, yc, x1, yc);
    pen.line(L, x1, yc, x1, y1);
    /* หัว MC4: ตัวบอดี้ + ปลอกล็อก + ขาเสียบ */
    const cw = Math.max(1.4, w * 0.07), ch = cw * 2.4;
    pen.rect(L, x1 - cw / 2, y1 - ch, cw, ch);
    pen.line(C, x1 - cw / 2, y1 - ch * 0.35, x1 + cw / 2, y1 - ch * 0.35);
    pen.rect(L, x1 - cw * 0.3, y1 - ch - cw * 0.7, cw * 0.6, cw * 0.7);
    pen.text(T, x1 + sgn * (cw / 2 + 1.0), y1 - ch / 2, 2.2, lab, { align: sgn < 0 ? 2 : 0, valign: 2 });
  };
  mc(-1, "+"); mc(1, "−");
  cap(bx + w / 2, "BACK SIDE");
  /* เส้นบอกขนาด */
  const dim = (x0, y0, x1, y1, txt, vert) => {
    pen.line(L, x0, y0, x1, y1);
    pen.dot(L, x0, y0, 0.5); pen.dot(L, x1, y1, 0.5);
    pen.text(T, vert ? x0 - 1.6 : (x0 + x1) / 2, vert ? (y0 + y1) / 2 : y1 + 0.8, 2.2, txt,
      vert ? { align: 2, valign: 2 } : { align: 1, valign: 1 });
  };
  dim(x, y + h + 4, x + w, y + h + 4, String(wMm));
  dim(sx, y + h + 4, sx + tw, y + h + 4, String(tMm));
  dim(x - 3.5, y, x - 3.5, y + h, String(hMm), true);
  if (o.caption) {
    pen.text(T, x, y - 11, 2.6, o.caption);
    pen.line(L, x, y - 12.6, x + Math.max(bx + w - x, pgTextW(o.caption, 2.6) + 2), y - 12.6);
  }
  return bx + w - x;
}

/* ── กรอบรูปถ่ายหน้างาน + ป้ายชื่อจุด ──
   o = { file, pxW, pxH, caption, note, fade }
   รูปไม่ได้ฝังในไฟล์ (DXF ทำไม่ได้) — ต้องวางไฟล์รูปไว้โฟลเดอร์เดียวกับ .dxf
   ย่อรูปให้พอดีกรอบโดยไม่บิดสัดส่วน แล้วจัดกึ่งกลาง เหลือขอบก็ปล่อยว่างไว้
   พิกัดที่รับมาเป็นมิลลิเมตรบนกระดาษ จึงต้องแปลงกลับเป็นพิกัดแบบก่อนวางรูป */
function pgPhotoFrame(doc, pen, x, y, w, h, o) {
  o = o || {};
  const L = PG_TBL.line, T = PG_TBL.txt;
  const cap = String(o.caption == null ? "" : o.caption).trim();
  const capH = cap ? 6.4 : 0;
  const ih = Math.max(1, h - capH), iy = y + capH;
  if (o.file) {
    const ar = (+o.pxH || 3) / (+o.pxW || 4);
    let iw2 = w, ih2 = w * ar;
    if (ih2 > ih) { ih2 = ih; iw2 = ih / ar; }
    doc.image("PG-PHOTO", {
      file: o.file, href: o.href, pxW: o.pxW, pxH: o.pxH,
      x: pen.X(x + (w - iw2) / 2), y: pen.Y(iy + (ih - ih2) / 2),
      w: pen.S(iw2), h: pen.S(ih2), rot: 0, fade: o.fade == null ? 0 : o.fade,
    });
  }
  pen.rect(L, x, iy, w, ih);
  if (cap) {
    pen.solid(PG_TBL.head, [x, y], [x + w, y], [x + w, y + capH], [x, y + capH]);
    pen.rect(L, x, y, w, capH);
    const lines = pgWrap(cap, Math.max(8, Math.floor(w / 1.6)));
    pen.text(T, x + w / 2, y + (capH - 2.4) / 2, 2.4, lines[0] + (lines.length > 1 ? "…" : ""),
      { align: 1, valign: 1 });
  }
}

/* ── รูปประกอบการต่อสาย DC ของแผงหนึ่งสตริง ──
   แผง n ใบต่ออนุกรม ขั้ว + ของใบหน้าไปเข้าขั้ว − ของใบถัดไป ปลายทั้งสองออก MC4
   n = จำนวนแผงที่จะวาด (ถ้ามากจะย่อเหลือ 4 ใบแล้วเขียน "x N" กำกับ)
   คืน { h, top, lx, rx } — h/top ไว้วางของถัดไป · lx/rx คือตำแหน่งหัว MC4 สองข้าง
   ให้ผู้เรียกลากสายต่อไปหาอินเวอร์เตอร์ได้ตรงหัวจริง */
/* ขนาดที่ pgDcString จะใช้จริง — แยกออกมาให้ผู้เรียกคำนวณตำแหน่งก่อนวาดได้
   h = ความสูงทั้งก้อนวัดจาก y ที่ส่งให้ pgDcString */
function pgDcSize(w, nPanel, maxH) {
  const nAll = Math.max(1, +nPanel || 1);
  const n = Math.min(4, nAll), gap = 4;
  const pw = (w - (n - 1) * gap) / n;
  const ph = Math.min(pw * 1.9, maxH || 1e9);
  return { nAll, n, skip: nAll > n, gap, pw, ph, h: 16 + ph + 6 };
}
function pgDcString(pen, x, y, w, o) {
  o = o || {};
  const L = PG_TBL.line, T = PG_TBL.txt, R = "PG-DETAIL";
  const g = pgDcSize(w, o.n, o.maxH);
  const nAll = g.nAll, n = g.n, skip = g.skip, gap = g.gap, pw = g.pw, ph = g.ph;
  const yb = y + 16;                       // เว้นที่ด้านล่างไว้เดินสายกลับ
  for (let i = 0; i < n; i++) {
    const px = x + i * (pw + gap);
    pgModFace(pen, L, L, px, yb, pw, ph, 6, 12, false);   // หน้าแผงแบบเดียวกับรูปแผงทุกแผ่น (เดิมกรอบแดง ตาราง 3x6)
    pen.text(T, px + pw / 2, yb + ph + 2.2, PG_TS.cell, "PV " + (i + 1 === n && skip ? nAll : i + 1), { align: 1, valign: 1 });
    /* ขั้วบวก/ลบ ออกจากกล่องต่อสายด้านหลังแผง ลงมาที่แนวเดินสาย */
    const nx = px + pw * 0.28, cx2 = px + pw * 0.72;
    pen.text(T, nx - 1.2, yb - 4.6, PG_TS.cell, "-", { align: 2, valign: 1 });
    pen.text(T, cx2 + 1.2, yb - 4.6, PG_TS.cell, "+", { align: 0, valign: 1 });
    pen.line(L, nx, yb, nx, yb - 6); pen.dot(L, nx, yb - 6, 0.6);
    pen.line(L, cx2, yb, cx2, yb - 6); pen.dot(L, cx2, yb - 6, 0.6);
    if (i < n - 1) {                       // + ใบนี้ ไป − ใบถัดไป
      const nn = px + pw + gap + pw * 0.28;
      pen.line(R, cx2, yb - 6, cx2, yb - 9.5); pen.line(R, cx2, yb - 9.5, nn, yb - 9.5);
      pen.line(R, nn, yb - 9.5, nn, yb - 6);
    }
  }
  /* ปลายสตริงทั้งสองข้าง → MC4 → ตู้รวม */
  const lx = x + pw * 0.28, rx = x + (n - 1) * (pw + gap) + pw * 0.72;
  const mc = (mx, lab) => {
    pen.line(R, mx, yb - 6, mx, y + 1.5);
    pen.circle(L, mx, y + 1.5, 1.4);
    const pos = lab.slice(-1) === "+";
    pen.text(T, mx + (pos ? 2.2 : -2.2), y + 1.5, PG_TS.cell, lab, { align: pos ? 0 : 2, valign: 2 });
  };
  mc(lx, "MC4 -"); mc(rx, "MC4 +");
  if (skip) pen.text(T, x + w / 2, yb + ph + 2.2, PG_TS.cell, "( x " + nAll + " PANEL )", { align: 1, valign: 1 });   // แถวป้าย PV ระหว่างแผง 2 กับ 3 — เดิมกลางแผงทับเส้นเซลล์
  return { h: yb + ph + 6 - y, top: yb + ph + 6, lx, rx, my: y + 1.5 };
}

/* ==================================================================
   SINGLE LINE DIAGRAM SOLAR CELL SYSTEM
   วาดจากข้อมูลระบบที่ออกแบบไว้ในโหมด 3D โดยตรง ไม่ต้องเขียนมือซ้ำ

   ผังเดินตามแบบที่บริษัทใช้อยู่ (ไล่จากล่างขึ้นบน = จากแผงไปหาการไฟฟ้า)
     แผง PV → ไมโครอินเวอร์เตอร์ / สตริงอินเวอร์เตอร์ → บัสไฟ AC
     → AC COMBINER SOLAR BOX (เมนเบรกเกอร์ · SPD · CT · เบรกเกอร์ย่อยรายวงจร)
     → MCCB BOX → มิเตอร์ → การไฟฟ้า
   สายฝั่งแดด (DC/AC จากแผง) เขียนสีแดง สายฝั่งการไฟฟ้าเขียนสีปกติ
   ================================================================== */
const PG_SLD = {
  wire: "SLD-WIRE", sol: "SLD-SOLAR", sym: "SLD-SYMBOL", box: "SLD-ENCLOSURE",
  txt: "SLD-TEXT", lbl: "SLD-LABEL", comm: "SLD-COMM", tab: "SLD-TABLE", pe: "SLD-EARTH", ctsig: "SLD-CT-SIGNAL",
  swlink: "SLD-DCSW-LINK",   // เส้นประเชื่อมใบมีด DC SWITCH สีเทา ประถี่ (ผู้ใช้ 2026-10-30)
};
function pgSldLayers(doc) {
  doc.ltype("PG-DASH", "Dashed __ __ __", [6, -3]);
  doc.ltype("PG-DOT", "Dotted . . . .", [0.4, -2.4]);
  doc.ltype("PG-DASHF", "Dashed fine _ _ _ _", [1.5, -0.9]);   // ประถี่ สายสัญญาณ CT (ผู้ใช้ขอ 2026-10-29)
  doc.layer(PG_SLD.wire, PG_ACI.white, "CONTINUOUS", 35);
  doc.layer(PG_SLD.sol, PG_ACI.red, "CONTINUOUS", 35);
  doc.layer(PG_SLD.sym, PG_ACI.white, "CONTINUOUS", 25);
  doc.ltype("PG-DASHB", "Dashed box _ _ _", [3, -1.5]);   // กรอบตู้ประถี่ขึ้น สีเดิม (ผู้ใช้ 2026-10-30)
  doc.layer(PG_SLD.box, PG_ACI.red, "PG-DASHB", 20);
  doc.layer(PG_SLD.txt, PG_ACI.white, "CONTINUOUS", 18);
  doc.layer(PG_SLD.lbl, PG_ACI.cyan, "CONTINUOUS", 25);
  doc.layer(PG_SLD.comm, PG_ACI.white, "PG-DASH", 15);
  doc.layer(PG_SLD.ctsig, PG_ACI.white, "PG-DASHF", 15);
  doc.layer(PG_SLD.swlink, PG_ACI.grey, "PG-DASHF", 13);
  doc.layer(PG_SLD.tab, PG_ACI.white, "CONTINUOUS", 20);
  doc.layer(PG_SLD.pe, PG_ACI.green, "CONTINUOUS", 25);
}

/* ── ลากสายแนวตั้ง เว้นช่องให้สัญลักษณ์ที่คร่อมอยู่บนสาย ──
   สายต้องจบที่ขั้วของสัญลักษณ์ ไม่ใช่ลากทะลุผ่านไปเลย ไม่งั้นดูเหมือนต่อลัดข้ามเบรกเกอร์
   brk = [{ y, half }] · half = ครึ่งความสูงของสัญลักษณ์ (ไม่ใส่ = 4.15 คือถึงขอบวงกลมขั้วของเบรกเกอร์) */
function pgWireY(pen, layer, x, yA, yB, brk) {
  const y0 = Math.min(yA, yB), y1 = Math.max(yA, yB);
  const gaps = (brk || [])
    .map((b) => { const h = b.half == null ? 4.15 : b.half; return [b.y - h, b.y + h]; })
    .filter((g) => g[1] > y0 && g[0] < y1)
    .sort((a, b) => a[0] - b[0]);
  let cur = y0;
  gaps.forEach((g) => { if (g[0] > cur) pen.line(layer, x, cur, x, g[0]); cur = Math.max(cur, g[1]); });
  if (cur < y1) pen.line(layer, x, cur, x, y1);
}

/* ── สัญลักษณ์มาตรฐาน ── ทุกตัวรับ (pen, x, y) ที่จุดกึ่งกลางของสัญลักษณ์ */
const pgSym = {
  /* เบรกเกอร์ (MCB/MCCB/RCCB) — ขั้วบน-ล่างเป็นวงกลมเปิดคาอยู่บนเส้นสาย
     คั่นด้วยส่วนโค้งโป่งไปทางซ้าย (ไม่ใช่เส้นเฉียง — เส้นเฉียงคือสวิตช์ใบมีด คนละตัวกัน)
     ระยะ g ต้องคงที่ เพราะผู้เรียกลากสายมาจบที่ y±g พอดี */
  /* g = ระยะขั้วจากกลาง (ค่าเดิม 3.4) — SLD มาตรฐานส่ง 2.4 ให้เท่าเบรกเกอร์แนวนอน (ผู้ใช้ 2026-10-29: เบรกเกอร์ใน MDB ใหญ่ไป) */
  breaker(pen, x, y, label, sub, gap) {
    const L = PG_SLD.sym, r = 0.75, g = gap || 3.4;
    pen.circle(L, x, y - g, r); pen.circle(L, x, y + g, r);
    pen.arc(L, x, y, g * 1.26, 118, 242);
    if (label) pen.text(PG_SLD.txt, x + 3.0, y + 1.2, 2.1, label, { valign: 2 });
    if (sub) pen.text(PG_SLD.txt, x + 3.0, y - 2.0, 2.1, sub, { valign: 2 });
  },
  /* หม้อแปลงกระแส (CT) — ขดลวดคล้องรอบสายเมน มีสายสัญญาณออกไปทางขวา
     วาดสองรอบ ให้เห็นว่าเป็นขดคล้อง ไม่ใช่แค่เส้นโค้งลอย ๆ ข้างสาย */
  ct(pen, x, y, label, sub) {
    const L = PG_SLD.sym, R = 1.9, lead = 4.4;
    [1.7, -1.7].forEach((dy) => {
      pen.arc(L, x - 0.9, y + dy, R, -78, 78);       // ขดคล้องคร่อมเส้นสาย
      pen.line(L, x + 1.0, y + dy + R * 0.98, x + lead, y + dy + R * 0.98);
    });
    if (label) pen.text(PG_SLD.txt, x + lead + 0.8, y + 1.4, 2.1, label, { valign: 2 });
    if (sub) pen.text(PG_SLD.txt, x + lead + 0.8, y - 1.6, 2.1, sub, { valign: 2 });
  },
  /* หลักดิน */
  ground(pen, x, y) {
    const L = PG_SLD.sym;
    pen.line(L, x - 3.0, y, x + 3.0, y);
    pen.line(L, x - 1.9, y - 1.3, x + 1.9, y - 1.3);
    pen.line(L, x - 0.8, y - 2.6, x + 0.8, y - 2.6);
  },
  /* กันเสิร์จ (SPD) — สัญลักษณ์วาริสเตอร์: กล่องผอมมีเส้นเฉียงทะลุออกนอกกล่อง
     ปลายเส้นเฉียงมีขีดสั้น ๆ หักมุม (ขีดนี้แหละที่ทำให้เป็นวาริสเตอร์ ไม่ใช่ตัวต้านทานเฉย ๆ)
     หลักดินผู้เรียกวาดเองด้านล่าง */
  /* sz = { w, h } ย่อกล่องได้ — SLD มาตรฐานใช้ขนาดเท่าฟิวส์แนวตั้ง 1.7 × 4.8 (ผู้ใช้ 2026-10-29: กล่อง SPD โตไป) */
  spd(pen, x, y, lines, sz) {
    const L = PG_SLD.sym, w = (sz && sz.w) || 3.8, h = (sz && sz.h) || 8, k = h / 8, ov = 1.5 * k, t = 1.4 * k;
    pen.rect(L, x - w / 2, y - h / 2, w, h);
    const x0 = x - w / 2 - ov, y0 = y - h / 2 + t;
    const x1 = x + w / 2 + ov, y1 = y + h / 2 - t;
    pen.line(L, x0, y0, x1, y1);
    pen.line(L, x0, y0, x0, y0 - t);          // ขีดหักลงที่ปลายล่างซ้าย
    pen.line(L, x1, y1, x1, y1 + t);          // ขีดหักขึ้นที่ปลายบนขวา
    (lines || []).forEach((s, i) => pen.text(PG_SLD.txt, x + 3.6, y + 3.2 - i * 2.4, 2.0, s, { valign: 2 }));
  },
  /* อินเวอร์เตอร์ — กล่องแบ่งทแยงจากมุมล่างซ้ายขึ้นมุมบนขวา
     ครึ่งบนซ้าย = ไฟสลับ (คลื่นไซน์) · ครึ่งล่างขวา = ไฟตรง (ขีดทึบคู่ขีดประ)
     ตรงกับทิศไฟจริงในผัง: แผงเข้าทางล่าง ไฟสลับออกทางบน */
  inverter(pen, x, y, w, h) {
    const L = PG_SLD.sym;
    pen.rect(L, x - w / 2, y - h / 2, w, h);
    pen.line(L, x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    /* คลื่นไซน์ — วาดจริงเป็นสองส่วนโค้ง ไม่ใช้ตัวอักษร "~" ที่ฟอนต์ทำออกมาเล็กและลอยสูง */
    const a = Math.min(w * 0.11, h * 0.13), sx = x - w * 0.28, sy = y + h * 0.2;
    pen.arc(L, sx - a, sy, a, 0, 180);
    pen.arc(L, sx + a, sy, a, 180, 360);
    /* ไฟตรง — ขีดบนทึบ ขีดล่างเป็นสองท่อน */
    const dx = x + w * 0.26, dy = y - h * 0.2, dw = Math.min(w * 0.16, h * 0.2);
    pen.line(L, dx - dw, dy + dw * 0.42, dx + dw, dy + dw * 0.42);
    pen.line(L, dx - dw, dy - dw * 0.42, dx - dw * 0.25, dy - dw * 0.42);
    pen.line(L, dx + dw * 0.25, dy - dw * 0.42, dx + dw, dy - dw * 0.42);
  },
  /* แผงเซลล์แสงอาทิตย์ — กล่องมีหัวลูกศรรูปตัว V ชี้ลง (สื่อว่าแสงตกกระทบเซลล์)
     หมายเลขแผงอยู่ในวงกลมคร่อมขอบล่างของกล่อง ตามแบบที่บริษัทใช้ */
  pv(pen, x, y, w, h, no, right) {
    const L = PG_SLD.sym;
    pen.rect(L, x - w / 2, y - h / 2, w, h);
    if (right) {
      /* แผงแนวนอน: สามเหลี่ยมฐานอยู่ขอบขวา ปลายชี้เข้าใน */
      const tx = x + w / 2 - Math.min(w * 0.45, h * 1.1);
      pen.line(L, x + w / 2, y + h / 2, tx, y);
      pen.line(L, x + w / 2, y - h / 2, tx, y);
    } else {
      const vy = y + h / 2, tip = y + h * 0.5 - h * 0.62;
      pen.line(L, x - w / 2, vy, x, tip);
      pen.line(L, x + w / 2, vy, x, tip);
    }
    if (no != null) {
      const r = Math.min(w * 0.42, h * 0.3);
      pen.circle(L, x, y - h / 2, r);
      pen.text(PG_SLD.txt, x, y - h / 2, r * 1.15, String(no), { align: 1, valign: 2 });
    }
  },
  /* โหลดในบ้าน — กล่องแบ่งทแยง ครึ่งล่างขวาทึบ ตามสัญลักษณ์ LOAD ในแบบของบริษัท */
  home(pen, x, y, s, th) {
    const L = PG_SLD.sym;
    const x0 = x - s, x1 = x + s, y0 = y - s * 0.6, y1 = y + s * 0.6;
    pen.solid(PG_SLD.sol, [x0, y0], [x1, y0], [x1, y1]);
    pen.rect(L, x0, y0, s * 2, s * 1.2);
    pen.line(L, x0, y0, x1, y1);
    pen.text(PG_SLD.txt, x, y0 - 1.2 - (th || 2.1), th || 2.1, "LOAD", { align: 1, valign: 1 });
  },
  /* จุดจ่ายไฟของการไฟฟ้า — สามเหลี่ยมโปร่ง */
  utility(pen, x, y, s, label) {
    const L = PG_SLD.sym;
    pen.pline(L, [[x, y + s], [x - s * 0.82, y - s * 0.6], [x + s * 0.82, y - s * 0.6]], true);
    if (label) pen.text(PG_SLD.lbl, x, y + s + 2.4, 3.6, label, { align: 1, valign: 1 });
  },
};

/* ตารางข้อมูลแบบสองคอลัมน์ (INVERTER DATA / BATTERY DATA)
   rows = [ [ชื่อ, ค่า, หน่วย] | ["#", หัวข้อกลุ่ม] ] · คืนความสูงที่ใช้ไป */
function pgSldTable(pen, x, y, w, rows, head, o) {
  o = o || {};
  const L = PG_SLD.tab, T = PG_SLD.txt;
  const rh = o.rh || 4.2, c1 = o.c1 == null ? w * 0.62 : o.c1;
  let cy = y;
  pen.rect(L, x, cy - rh, w, rh);
  pen.text(T, x + 1.4, cy - rh + 1.2, 2.2, head);
  cy -= rh;
  rows.forEach((r) => {
    pen.rect(L, x, cy - rh, w, rh);
    if (r[0] === "#") { pen.text(T, x + 1.4, cy - rh + 1.2, 2.1, r[1]); }
    else {
      pen.line(L, x + c1, cy, x + c1, cy - rh);
      pen.text(T, x + 1.4, cy - rh + 1.2, 2.0, r[0]);
      pen.text(T, x + c1 + 1.4, cy - rh + 1.2, 2.0, String(r[1] == null ? "" : r[1]));
      if (r[2]) pen.text(T, x + w - 1.4, cy - rh + 1.2, 2.0, "[" + r[2] + "]", { align: 2 });
    }
    cy -= rh;
  });
  return y - cy;
}

/* ตารางรายการอุปกรณ์ท้ายแบบ */
function pgSldEquip(pen, x, y, w, list) {
  const L = PG_SLD.tab, T = PG_SLD.txt, rh = 4.6;
  const CW = [w * 0.09, w * 0.18, w * 0.24, w * 0.37, w * 0.12];
  const HD = ["ITEM.", "BRAND.", "MODEL.", "DESCRIPTION", "NO."];
  pen.rect(L, x, y - 5.4, w, 5.4);
  pen.text(T, x + 2, y - 3.9, 2.8, "Equipment specification list");
  let cy = y - 5.4;
  const row = (cells, h, bold) => {
    pen.rect(L, x, cy - h, w, h);
    let cx = x;
    CW.forEach((cwv, i) => {
      if (i) pen.line(L, cx, cy, cx, cy - h);
      pen.text(T, cx + cwv / 2, cy - h + 1.3, bold ? 2.2 : 2.1, String(cells[i] == null ? "" : cells[i]),
        { align: 1, valign: 1 });
      cx += cwv;
    });
    cy -= h;
  };
  row(HD, rh, true);
  list.forEach((r, i) => row([i + 1, r.brand, r.model, r.desc, r.no], rh, false));
  return y - cy;
}

/* ปากกาที่ขยาย/เลื่อนทุกพิกัดก่อนส่งต่อ (x' = ox + x·s) — ใช้ขยายไดอะแกรม SLD ให้พอดีกระดาษ */
function pgScalePen(pen, s, ox, oy) {
  const X = (v) => ox + v * s, Y = (v) => oy + v * s, P = (p) => [X(p[0]), Y(p[1])];
  return {
    line: (l, x1, y1, x2, y2) => pen.line(l, X(x1), Y(y1), X(x2), Y(y2)),
    rect: (l, x, y, w, h) => pen.rect(l, X(x), Y(y), w * s, h * s),
    pline: (l, pts, c) => pen.pline(l, pts.map(P), c),
    circle: (l, x, y, r) => pen.circle(l, X(x), Y(y), r * s),
    arc: (l, x, y, r, a1, a2) => pen.arc(l, X(x), Y(y), r * s, a1, a2),
    solid: (l, a, b, c, d) => pen.solid(l, P(a), P(b), P(c), d && P(d)),
    text: (l, x, y, h, t, o) => pen.text(l, X(x), Y(y), h * s, t, o),
    dot: (l, x, y, r) => pen.dot(l, X(x), Y(y), r * s),
  };
}
/* ปากกาที่ไม่วาด แค่จดขอบเขต (ตัวอักษรประมาณจาก pgTextW) — รอบวัดขนาดไดอะแกรมก่อนวาดจริง */
function pgBBoxPen() {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }, items = [];
  let it = null;
  const add = (x, y) => {
    if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
    if (it) { if (x < it[0]) it[0] = x; if (y < it[1]) it[1] = y; if (x > it[2]) it[2] = x; if (y > it[3]) it[3] = y; }
  };
  /* แต่ละคำสั่งวาดจดกรอบของตัวเองไว้ใน items — ใช้เช็กว่าไดอะแกรมที่ขยายแล้วทับตารางไหม */
  const rec = (fn) => (...a) => { it = [Infinity, Infinity, -Infinity, -Infinity]; fn(...a); items.push(it); it = null; };
  const pen = {
    box: b, items,
    line: (l, x1, y1, x2, y2) => { add(x1, y1); add(x2, y2); },
    rect: (l, x, y, w, h) => { add(x, y); add(x + w, y + h); },
    pline: (l, pts) => pts.forEach((p) => add(p[0], p[1])),
    circle: (l, x, y, r) => { add(x - r, y - r); add(x + r, y + r); },
    arc: (l, x, y, r) => { add(x - r, y - r); add(x + r, y + r); },
    solid: (l, a, b2, c, d) => [a, b2, c, d].forEach((p) => p && add(p[0], p[1])),
    dot: (l, x, y, r) => { add(x - r, y - r); add(x + r, y + r); },
    text: (l, x, y, h, t, o) => {
      o = o || {};
      const w = pgTextW(String(t), h);
      if (o.rot) { add(x - h, y - w); add(x + h, y + w); return; }
      const xa = o.align === 1 ? x - w / 2 : o.align === 2 ? x - w : x;
      const ya = o.valign === 3 ? y : o.valign === 2 ? y - h / 2 : o.valign === 1 ? y - h : y;
      add(xa, ya); add(xa + w, ya + h);
    },
  };
  ["line", "rect", "pline", "circle", "arc", "solid", "dot", "text"].forEach((k) => { pen[k] = rec(pen[k]); });
  return pen;
}

/* ── ตัววาดไดอะแกรมทั้งแผ่น ──
   sheet = ผลลัพธ์จาก pgSheet() · M = โมเดลระบบ (ดู pgSldModel ใน plan3d.jsx) */
/* ══ SLD แบบมาตรฐาน (IEC 62548 · IEC 60364-7-712 · วสท. 022001) ══
   ไหลซ้าย → ขวา: สตริง (แผงแรก…แผงสุดท้าย + Voc/Isc) → ตู้ DC → อินเวอร์เตอร์ (ช่อง MPPT/IN จริง)
   → ตู้ AC (เบรกเกอร์ต่อเครื่อง · AC SPD · เมน) → MDB → CT/มิเตอร์การไฟฟ้า → กริด
   คอลัมน์ขวา = ข้อมูลอินเวอร์เตอร์ · ข้อมูลแผง/อาเรย์ · หมายเหตุ · สัญลักษณ์ · ชื่อแผ่น
   สตริงเยอะ: ยุบเป็นแถวละ MPPT · อินเวอร์เตอร์เยอะ: เครื่องที่เหลือรวมเป็นบล็อก TYPICAL */
function pgSldPro(doc, sheet, M) {
  /* รอบวัดขนาด (sheet.measure) วาดแค่ไดอะแกรมลงปากกาจดขอบเขต — รอบจริงขยายไดอะแกรมให้พอดีกระดาษ (ผู้ใช้ 2026-10-30) */
  if (!sheet.measure) pgSldLayers(doc);
  const pen0 = sheet.pen, A = sheet.area, P = M.pro;
  let pen = sheet.measure || pen0;
  const W = PG_SLD.wire, R = PG_SLD.sol, S = PG_SLD.sym, BX = PG_SLD.box, T = PG_SLD.txt, LB = PG_SLD.lbl, CM = PG_SLD.comm, PE = PG_SLD.pe;
  const RX0 = A.x1 - 78, RX1 = A.x1 - 3, RW = RX1 - RX0;
  const DX0 = A.x0 + 4;
  /* แผงในสตริงเรียงจากฝั่งสาย [1] [2] [3] • • • [n] (ผู้ใช้วาดชี้ 2026-10-30) — m1 = ช่องซ้ายสุด (แผง n) · mn = แผง 1 ติดสาย */
  const X = { pe0: DX0 - 21, m1: DX0 - 10.8, mn: DX0 + 18,   // แผง n ห่างจุด • • • เท่าฝั่งแผง 3 (ผู้ใช้: ขยับให้พอดี)
    tx: DX0 + 22, sl: DX0 + 51,
    dc0: DX0 + 54, dcB: DX0 + 61, dcS: DX0 + 76, dcPE: DX0 + 85, dc1: DX0 + 88,
    iv0: DX0 + 94, iv1: DX0 + 126, ac0: DX0 + 133, acB: DX0 + 142, acBus: DX0 + 153, acM: DX0 + 170, ac1: DX0 + 188,
    md0: DX0 + 196, mdB: DX0 + 204, mdBus: DX0 + 214, md1: DX0 + 226 };
  const g = 2.4;   // ครึ่งระยะขั้วเบรกเกอร์แนวนอน (เดิม 3.4 — ผู้ใช้ 2026-10-29: สัญลักษณ์เบรกเกอร์ดูใหญ่ไป · ขั้วห่าง 4.8 = ยาวเท่าฟิวส์)
  const fuseDev = P.dcDev.k === "fuse";
  /* ความกว้างตัวอักษรโดยประมาณ — ใช้ย่อข้อความให้พอดีช่อง ไม่ให้ล้นไปทับเส้น */
  /* ขนาดตัวหนังสือตามชนิดข้อมูล (มม. บนกระดาษ A3 · แนว ISO 3098 ย่อตามความแน่นของ SLD)
     ข้อมูลชนิดเดียวกันขนาดเท่ากันทั้งแผ่น — ห้ามใส่ตัวเลขขนาดตรง ๆ ในคำสั่งวาด ให้ใช้ TS.<ชนิด>
     ข้อความยาวไม่พอที่: fitH ลดลงทีละขั้นในชุด TSL (ไม่ย่อแบบต่อเนื่อง) หรือ wrapT ตัดบรรทัด */
  const TS = {
    zone: 2.5,    // หัวโซนบนสุด PV ARRAY / DC BOX / INVERTER / AC BOX / MDB
    sub: 1.5,     // หัวกลุ่มในตาราง (PV MODULE / INVERTER / PV ARRAY)
    head: 1.8,    // หัวตาราง · ชื่ออุปกรณ์หลัก (INV1 50kW · MDB · TO GRID · ป้ายสตริง S1 : 17 x 650Wp)
    spec: 1.4,    // สเปคอุปกรณ์บนแบบ (เบรกเกอร์ ฟิวส์ SPD CT สาย) · Voc/Isc สตริง
    note: 1.4,    // หมายเหตุ
    cell: 1.3,    // ข้อความในตาราง SYSTEM DATA / EQUIPMENT SCHEDULE
    legend: 1.3,  // คำอธิบายสัญลักษณ์
    tag: 1.2,     // ป้ายเล็กติดสัญลักษณ์ (IN1 · PE · ZCT · SHUNT TRIP · เลขแผง · RS485)
  };
  const TSL = [2.5, 1.8, 1.5, 1.4, 1.3, 1.2];
  const fitH = (s, h, w) => {
    const need = (x) => String(s).length * 0.82 * x <= w;
    for (const t of TSL) if (t <= h + 1e-6 && need(t)) return t;
    return Math.max(0.9, Math.min(TS.tag, w / Math.max(1, String(s).length * 0.82)));
  };
  /* ตัดคำตามช่องว่างให้แต่ละบรรทัดกว้างไม่เกิน w ที่ขนาด h */
  const wrapT = (s, h, w) => {
    const max = Math.max(4, Math.floor(w / (0.82 * h))), out = [];
    let cur = "";
    String(s).split(" ").forEach((wd) => {
      if (cur && (cur + " " + wd).length > max) { out.push(cur); cur = wd; } else cur = cur ? cur + " " + wd : wd;
    });
    if (cur) out.push(cur);
    return out;
  };

  /* ── สัญลักษณ์แนวนอน ── */
  /* cb = MCCB / ACB (ผู้ใช้ 2026-10-29 วาดให้ดู): สาย ─X  ใบมีดเอียงขึ้นซ้าย ─ สาย · MCB / DC ยังเป็นวงกลมสองขั้ว + โค้ง
     ช่วงกว้างเท่ากัน (x ± (g + 0.75)) สายที่ต่อเข้าออกจึงไม่ต้องแก้ */
  const isCb = (s) => /^(MCCB|ACB)/i.test(String(s || "").trim());
  const hBrk = (x, y, cb) => {
    if (cb) {
      const xl = x - g - 0.75, xr = x + g + 0.75, c = 0.8;
      pen.line(S, xl, y, x - g, y);
      pen.line(S, x - g - c, y - c, x - g + c, y + c); pen.line(S, x - g - c, y + c, x - g + c, y - c);
      pen.line(S, x + g, y, x - g + 1.0, y + 2.6);
      pen.line(S, x + g, y, xr, y);
      return;
    }
    pen.circle(S, x - g, y, 0.75); pen.circle(S, x + g, y, 0.75);
    pen.arc(S, x, y, g * 1.26, 28, 152);
  };
  const hFuse = (x, y) => { pen.rect(S, x - 2.4, y - 0.85, 4.8, 1.7); pen.line(S, x - 2.4, y, x + 2.4, y); };
  const vFuse = (x, y) => { pen.rect(S, x - 0.85, y - 2.4, 1.7, 4.8); pen.line(S, x, y - 2.4, x, y + 2.4); };
  /* SPD เล็ก (วาริสเตอร์) แขวนใต้สาย — ขั้วบน y0 ขั้วล่าง y0 - 4 */
  /* กล่องขนาดเท่าฟิวส์แนวตั้ง (vFuse 1.7 × 4.8) — ผู้ใช้ 2026-10-29: "ขนาดสี่เหลี่ยมเท่าฟิวส์ มันโตไป" */
  const SPD_H = 4.8;
  /* หน้าตาเดียวกับ SPD ฝั่ง AC (ขีดทแยงหักปลาย ล่างซ้ายหักลง · บนขวาหักขึ้น) — ผู้ใช้วาดชี้ 2026-10-29 */
  const spdS = (x, y0) => pgSym.spd(pen, x, y0 - SPD_H / 2, null, { w: 1.7, h: SPD_H });
  const meter = (x, y, r) => {
    pen.circle(S, x, y, r);
    pen.text(T, x, y + r * 0.12, r * 0.5, "kWh", { align: 1, valign: 2 });
    pen.line(S, x - r * 0.45, y - r * 0.45, x + r * 0.45, y - r * 0.45);
    pen.line(S, x - r * 0.45, y - r * 0.45, x - r * 0.25, y - r * 0.33);
    pen.line(S, x + r * 0.45, y - r * 0.45, x + r * 0.25, y - r * 0.33);
  };
  /* CT บนสายแนวตั้ง: ขดสองโค้งนูนออกขวาเกาะสาย (สายวิ่งผ่านตรง) — ผู้ใช้วาดแบบ ∩∩ ให้ 2026-10-29 */
  const CT_R = 1.4;
  /* ขาขดบน/ล่างยื่นซ้ายสั้น ๆ (ผู้ใช้ขีดชี้) */
  const ctV = (x, y) => {
    [CT_R, -CT_R].forEach((dy) => pen.arc(S, x, y + dy, CT_R, -90, 90));
    [2 * CT_R, -2 * CT_R].forEach((dy) => pen.line(S, x - 1.6, y + dy, x, y + dy));
  };
  /* CT บนสายแนวนอน แบบเดียวกับ ctV หมุน: ขดนูนขึ้น ขาซ้าย/ขวาลงสั้น ๆ (ผู้ใช้ "ขอแบบเดียวกัน" 2026-10-29) */
  const ctH = (x, y) => {
    [CT_R, -CT_R].forEach((dx) => pen.arc(S, x + dx, y, CT_R, 0, 180));
    [2 * CT_R, -2 * CT_R].forEach((dx) => pen.line(S, x + dx, y - 1.6, x + dx, y));
  };
  const peDot = (x, y) => pen.dot(PE, x, y, 0.5);

  /* ── แตกข้อมูล MPPT เป็นบล็อกอินเวอร์เตอร์ ── */
  const byInv = {};
  M.mppt.rows.forEach((r) => { if (r.ins.length) (byInv[r.inv] = byInv[r.inv] || []).push(r); });
  const invNos = Object.keys(byInv).map(Number).sort((a, b) => a - b);
  const wp = P.wp;
  const strRow = (x) => ({ lab: "S" + x.id + " : " + x.n + " x " + wp + "Wp", sub: "Voc " + P.vocAt(x.n) + "V  Isc " + P.isc + "A",
    tag: "IN" + x.inNo, last: x.n, k: 1 });
  const grpRow = (r) => {
    const ids = r.ins.map((x) => "S" + x.id).join("+");
    const ns = r.ins.map((x) => x.n), nMax = Math.max.apply(null, ns), same = ns.every((n) => n === nMax);
    return { lab: ids + " : " + (same ? nMax : ns.join("/")) + " x " + wp + "Wp",
      sub: r.ins.length + " STR  Voc " + P.vocAt(nMax) + "V  Isc " + P.isc + "A",
      tag: r.ins.length > 1 ? "IN1-" + r.ins.length : "IN" + r.ins[0].inNo, last: nMax, k: r.ins.length };
  };
  let RH = 10;
  const GAP = 2;
  /* ทุกช่องต่อของ MPPT ขึ้นในแบบ (ผู้ใช้ 2026-10-29: "MPPT มีกี่ INPUT ก็ใส่ไว้ จะอยู่ที่เราต่อไว้แบบไหน") — ช่องที่ไม่ได้ต่อ = ขั้วเปล่า + ป้าย IN
     ไม่รู้จำนวนช่อง (phys = 0 · สองรุ่นปนกัน) = ขึ้นเฉพาะช่องที่ต่อเหมือนเดิม */
  const phys = +M.mppt.phys || 0;
  const rowsOf = (r) => {
    if (!phys) return r.ins.map((x) => strRow(x));
    const n = Math.max(phys, Math.max.apply(null, r.ins.map((x) => x.inNo)));
    const out = [];
    for (let k = 1; k <= n; k++) { const x = r.ins.find((q) => q.inNo === k); out.push(x ? strRow(x) : { empty: true, tag: "IN" + k, k: 0 }); }
    return out;
  };
  /* แยกหลายแผ่น (ผู้ใช้ 2026-10-29): แผ่นเดียววาดไม่พอเมื่อไร → แผ่นภาพรวม (M.part main: อินเวอร์เตอร์ย่อเหลือกล่อง + ตู้ AC + MDB)
     + แผ่นย่อยละกลุ่ม (M.part detail: เครื่องที่รุ่นและสตริงเหมือนกันวาดรวมแผ่นเดียว วาดเครื่องแรกเป็นตัวแทน) */
  const PT = M.part || null, isMain = !!(PT && PT.kind === "main"), isDet = !!(PT && PT.kind === "detail");
  /* แผ่นภาพรวมไม่มีสตริง/ตู้ DC ซ้ายมือว่าง — ขยับอินเวอร์เตอร์ไปซ้าย ขยายตู้ AC ให้เบรกเกอร์ไม่ชิดอินเวอร์เตอร์และบัส (ผู้ใช้ 2026-10-29) */
  if (isMain) { X.iv0 -= 40; X.iv1 -= 40; X.ac0 -= 21; X.acB -= 18; X.acBus -= 12; X.ac1 += 5; }   // ขอบขวาตู้ขยายตามชุด CT/ACB ที่ขยับไปขวา   // ผู้ใช้: ขยับน้อยไป — บัสไปซ้ายด้วย ให้ช่วง CT/ACB เมนกว้างขึ้น
  /* งานโครงการ (ฟิวส์ gPV): DC SWITCH + DC SPD อยู่ในตัวอินเวอร์เตอร์ทุกเครื่อง ตู้ DC เหลือแค่ฟิวส์ (ผู้ใช้ 2026-10-30)
     ตู้ DC ไม่มี SPD/PE bar → แคบลง ที่ว่างยกให้กล่องอินเวอร์เตอร์ขยายซ้าย วาง DC SWITCH/SPD ระหว่างแกนรวม MPPT กับสัญลักษณ์ (ผู้ใช้ 2026-10-30) */
  const ivSpd = fuseDev && !isMain;
  if (ivSpd) { X.dc1 = DX0 + 72; X.dcPE = X.dc1; X.iv0 = DX0 + 78; X.dcB = (X.dc0 + X.dc1) / 2; }   // ฟิวส์กลางกรอบตู้ (ผู้ใช้ 2026-10-30)
  /* ทุกงาน (บ้านด้วย · ผู้ใช้ 2026-10-30): ในอินเวอร์เตอร์มี DC SWITCH ทุกขั้ว IN + DC SPD ที่แกนรวม + AC SPD ขาออก (ivIn)
     งานบ้านตู้ DC ยังมี DC MCB + SPD ทุกสตริง (ผู้ใช้เลือก) → กล่องอินเวอร์เตอร์ขยายขวา 16 ทุกอย่างทางขวาเลื่อนตาม */
  const ivIn = !isMain;
  if (ivIn && !ivSpd) ["iv1", "ac0", "acB", "acBus", "acM", "ac1", "md0", "mdB", "mdBus", "md1"].forEach((k) => { X[k] += 16; });
  /* เมนงานบ้าน "MCB … + RCCB …" วาดแยกสองตัว (ผู้ใช้ 2026-10-31) — ขอบขวาตู้ AC + MDB เลื่อนขวาตั้งแต่ต้น หัวโซนจะได้อยู่กลางตู้ */
  const mSplit = isDet ? null : /^(.+?) \+ (RCCB .+)$/.exec(P.mainTxt), RD = 14, MSPL = RD + 4;
  if (mSplit) ["ac1", "md0", "mdB", "mdBus", "md1"].forEach((k) => { X[k] += MSPL; });
  const modelOf = (no) => (M.units && M.units[no - 1] && M.units[no - 1].model) || M.inv.model;
  const mkBlock = (no, detail) => {
    const groups = byInv[no].map((r) => ({ mppt: r.mppt, rows: detail ? rowsOf(r) : [grpRow(r)] }));
    return { no, groups, kw: P.ivKw[no - 1], brk: P.ivBrk[no - 1], model: modelOf(no), bat: !!M.batt && no === invNos[0] };   // ไฮบริด: แบตห้อยใต้เครื่องแรก
  };
  /* เรขาคณิตของบล็อก — คิดก่อนวาด ใช้ทั้งตอนเลือกโหมดย่อและตอนวาดจริง */
  const BAT_H = 14.5;   // ที่ใต้ป้ายอินเวอร์เตอร์สำหรับกล่องแบต + ป้ายรุ่น
  const EH = 4.5;   // ระยะแถวของช่อง IN ที่ไม่ได้ต่อ (ขั้วเปล่า ไม่มีสตริง) — เตี้ยกว่าแถวสตริง
  const rowH = (row) => (row && row.empty ? EH : RH);
  let MH = 13;   // ความสูงบล็อกย่อในแผ่นภาพรวม (กล่องอินเวอร์เตอร์ + ป้าย PV)
  const geo = (b, top) => {
    if (b.mini) { const boxBot = top - MH + 3, yG = boxBot - 1.4; return { firstY: top, lastY: top, dBot: boxBot, boxBot, yG, bottom: yG - 0.4 }; }
    const all = b.groups.reduce((t, gq) => t.concat(gq.rows), []);
    const firstY = top - 10.5;
    /* ระยะจากแถวแรกถึงแถวสุดท้าย = ผลรวมระยะของทุกแถวยกเว้นแถวสุดท้าย (แถวว่างใช้ EH) */
    const span = all.slice(0, -1).reduce((t, row) => t + rowH(row), 0);
    const lastY = firstY - span - (b.groups.length - 1) * GAP;
    const dBot = lastY - 16;
    /* มี AC SPD ในเครื่อง (ivIn): สัญลักษณ์ดินลึก 13.6 ใต้ขั้ว AC — กล่องสูงอย่างน้อย 30 ไม่ให้ดินทับขอบล่าง (ผู้ใช้ 2026-10-31: โดนทับ) */
    const boxBot = Math.min(lastY - (ivIn ? 11 : 5), top - (ivIn ? 31 : 27));   // งานโครงการเผื่อที่ DC SPD ใต้แกนรวม MPPT
    const yG = Math.min(dBot, boxBot - 10.8 - (b.bat ? BAT_H : 0)) - 3;
    return { firstY, lastY, dBot, boxBot, yG, bottom: yG - 1.5 };
  };
  const blockH = (b) => b.typical ? 0 : 1000 - geo(b, 1000).bottom;

  /* แผ่นภาพรวมบล็อกกระจายเต็มแผ่น — เว้นล่างเพิ่มให้หลักดิน/MET ไม่ทับชื่อแผ่นบรรทัดใหญ่ (ผู้ใช้ชี้) */
  const yTop = A.y1 - 16, yE0 = A.y0 + (isMain ? 26 : 10);
  const avail = yTop - (yE0 + 6);
  const sumH = (bs) => bs.reduce((t, b) => t + (1000 - geo(b, 1000).bottom) + 2, 0);
  const strOf = (no) => byInv[no].reduce((t, r) => t + r.ins.length, 0), pvOf = (no) => byInv[no].reduce((t, r) => t + r.ins.reduce((u, x) => u + x.n, 0), 0);
  let blocks = isMain
    ? invNos.map((no) => ({ no, mini: true, groups: [], kw: P.ivKw[no - 1], brk: P.ivBrk[no - 1], model: modelOf(no),
      nMp: byInv[no].length, nStr: strOf(no), nPv: pvOf(no), ref: (PT.ref && PT.ref[no]) || "" }))
    : (isDet ? [PT.nos[0]] : invNos).map((n) => mkBlock(n, true));
  /* แผ่นภาพรวม: บัส AC ยาวขึ้นถึงเครื่องแรก — เริ่มบล็อกต่ำลงให้หลอดไฟแสดงเฟส/กล่อง logger เหนือตู้ไม่ทับหัวคอลัมน์ */
  const yB0 = isMain ? yTop - (P.pm ? 24 : 10) : yTop;
  if (isMain) MH = Math.max(7, Math.min(16, (avail - (yTop - yB0)) / blocks.length - 0.8));   // แผ่นภาพรวมกระจายเต็มแผ่น · เครื่องเยอะย่อลงได้ถึง 7 มม.
  else if (sumH(blocks) > avail) blocks = blocks.map((b) => mkBlock(b.no, false));
  if (isDet && PT.nos.length > 1) blocks[0].names = pgInvNames(PT.nos) + " (x" + PT.nos.length + ")";
  if (!isMain && sumH(blocks) > avail) {
    M.needSplit = true;   // แผ่นเดียวไม่พอ — p3PrepSet แยกเป็นภาพรวม + แผ่นย่อย (แผ่นเดียวยังวาดแบบ TYPICAL ได้ถ้าเรียกตรง)
    const keep = [];
    let h = 0;
    const tH = 1000 - geo({ groups: [{ rows: [0] }] }, 1000).bottom + 2;
    for (const b of blocks) { if (h + blockH(b) + 2 + tH > avail && keep.length) break; keep.push(b); h += blockH(b) + 2; }
    const rest = blocks.slice(keep.length);
    if (rest.length) {
      const ids = [], nn = [];
      rest.forEach((b) => byInv[b.no].forEach((r) => r.ins.forEach((x) => { ids.push(x.id); nn.push(x.n); })));
      const nMax = Math.max.apply(null, nn);
      keep.push({ no: rest[0].no, to: rest[rest.length - 1].no, cnt: rest.length, typical: true, kw: rest[0].kw, brk: rest[0].brk,
        groups: [{ mppt: 0, rows: [{ lab: "S" + Math.min.apply(null, ids) + "-S" + Math.max.apply(null, ids) + " : " + ids.length + " STRINGS",
          sub: nn.reduce((a, b) => a + b, 0) + " PV (TYPICAL AS INV" + keep[0].no + ")", tag: "", last: nMax, k: ids.length }] }] });
    }
    blocks = keep;
  }
  /* งานเล็กเหลือที่ว่าง: ขยายระยะแถวให้เต็มแผ่น (ไม่เกิน 15 มม.) */
  if (!blocks.some((b) => b.typical)) {
    const nR = blocks.reduce((t, b) => t + b.groups.reduce((u, gq) => u + gq.rows.filter((r) => !r.empty).length, 0) - 1, 0);
    const spare = avail - sumH(blocks) - 30;
    if (nR > 0 && spare > 0) RH = Math.min(15, RH + spare / nR);
  }

  /* ── ตาราง SYSTEM DATA (คอลัมน์ขวา) — แถว PV ARRAY ไม่เอา (ผู้ใช้ 2026-10-30: สรุปแผง/สตริงเขียนหน้าแผงแต่ละเครื่องแทน) ── */
  const L = PG_SLD.tab;
  const grid = (rows, head, cw, rh, th, dry) => {
    let cy = ty;
    const rect = (x, y, w, h) => { if (!dry) pen.rect(L, x, y, w, h); };
    const txt = (l, x, y, h, t, o) => { if (!dry) pen.text(l, x, y, h, t, o); };
    rect(RX0, cy - rh - 0.6, RW, rh + 0.6);
    txt(LB, RX0 + 1.2, cy - (rh + 0.6) / 2, TS.head, head, { valign: 2 });
    cy -= rh + 0.6;
    /* ข้อความในตารางขนาดเดียวกันทุกช่อง — ยาวเกินช่องตัดบรรทัดแล้วแถวสูงขึ้น (ไม่ย่อตัว) */
    const lp = th + 0.7;
    rows.forEach((r) => {
      if (r[0] === "#") {
        rect(RX0, cy - rh, RW, rh);
        txt(LB, RX0 + 1.2, cy - rh / 2, TS.sub, r[1], { valign: 2 });
        cy -= rh; return;
      }
      const cells = cw.map((w, i) => wrapT(String(r[i] == null ? "" : r[i]), th, w - 2));
      const nL = Math.max.apply(null, cells.map((c) => c.length));
      const h = rh + (nL - 1) * lp;
      rect(RX0, cy - h, RW, h);
      let cx = RX0;
      cw.forEach((w, i) => {
        if (i && !dry && (cw.noLine || []).indexOf(i) < 0) pen.line(L, cx, cy, cx, cy - h);   // ตาราง DATA SHEET: หัวข้อกับสัญลักษณ์อยู่ช่องเดียวกัน ไม่มีเส้นคั่น
        const c = i === cw.length - 1 && cw.length > 2;
        const ls = cells[i], y0 = cy - h / 2 + (ls.length - 1) * lp / 2;
        ls.forEach((t, j) => txt(T, c ? cx + w / 2 : cx + 1, y0 - j * lp, th, t, { align: c ? 1 : 0, valign: 2 }));
        cx += w;
      });
      cy -= h;
    });
    return ty - cy;
  };
  let ty = 0;
  const tabRows = () => {
    if (isDet) {
      const no = PT.nos[0], b = blocks[0], nPv = pvOf(no), ns = [];
      byInv[no].forEach((r) => r.ins.forEach((x) => ns.push(x.n)));
      const nU = ns.filter((n, i) => ns.indexOf(n) === i).sort((p, q) => q - p);
      return [[[["INVERTER", pgInvNames(PT.nos)], ["QUANTITY", PT.nos.length + " SET"], ["MODEL", b.model],
        ["AC OUTPUT", b.kw + " kW " + P.phTxt + " / SET"], ["MPPT / STRING", byInv[no].length + " MPPT / " + ns.length + " STRINGS / SET"],
        ["STRING SIZE", nU.map((n) => n + " PV x " + ns.filter((q) => q === n).length).join(" , ")],
        ["PV / SET", nPv + " x " + wp + "Wp = " + Math.round(nPv * wp / 10) / 100 + " kWp"],
        ["PV (GROUP)", nPv * PT.nos.length + " PCS = " + Math.round(nPv * PT.nos.length * wp / 10) / 100 + " kWp"],
        ["AC BREAKER", b.brk + " x" + PT.nos.length]], "INVERTER GROUP DATA"]];
    }
    /* ตาราง DATA SHEET 4 ช่อง (ผู้ใช้ส่งแนวทาง 2026-10-31) แทน SYSTEM DATA */
    if (M.dataSheet) { const cw = [RW * 0.43, RW * 0.11, RW * 0.33, RW * 0.13]; cw.noLine = [1]; return M.dataSheet.map((q) => [q[0], q[1], cw]); }
    if (!M.pvData) return [];
    let skip = false;
    return [[M.pvData.filter((r) => { if (r[0] === "#") skip = r[1] === "PV ARRAY"; return !skip; }), "SYSTEM DATA"]];
  };
  const sldTabH = () => { ty = 0; return tabRows().reduce((t, q) => t + grid(q[0], q[1], q[2] || [RW * 0.4, RW * 0.6], 3.1, TS.cell, true) + 3, 0); };

  /* ── ขยายไดอะแกรมให้พอดีกระดาษ (ผู้ใช้ 2026-10-30: ไดอะแกรมกองครึ่งบน ที่ว่างเหลือเยอะ) ──
     คอลัมน์ขวาเหลือแค่ตาราง SYSTEM DATA ที่มุมขวาล่าง · ลองสองกรอบ: เต็มกว้างเหนือตาราง / ซ้ายของตารางเต็มสูง เอาที่ขยายได้มากกว่า */
  let tabTop = A.y0 + 4;
  if (!sheet.measure) {
    const bb = pgBBoxPen();
    pgSldPro(doc, { area: A, measure: bb }, M);
    const d = bb.box, bw = d.x1 - d.x0, bh = d.y1 - d.y0;
    tabTop = A.y0 + 4 + sldTabH();
    /* ขอบบน yTp เว้นจากกรอบแผ่น 9 — หัวโซน PV ARRAY / INVERTER ไม่ชิดขอบบน (ผู้ใช้ชี้ 2026-10-30) */
    const yTp = A.y1 - 9;
    const yT = A.y0 + 22, cand = [[A.x0 + 3, Math.max(yT, tabTop + 4), A.x1 - 3, yTp], [A.x0 + 3, yT, RX0 - 4, yTp]]
      .map((c) => ({ c, s: Math.min((c[2] - c[0]) / bw, (c[3] - c[1]) / bh) })).sort((p, q) => q.s - p.s);
    /* ตำแหน่ง: กลางกรอบ · ox/oy ของปากกาขยาย */
    const at = (c, sc, top) => [(c[0] + c[2]) / 2 - (d.x0 + bw / 2) * sc, top ? c[3] - d.y1 * sc : (c[1] + c[3]) / 2 - (d.y0 + bh / 2) * sc];
    let sc = Math.min(1.8, cand[0].s), o = at(cand[0].c, sc);
    /* ลองใช้ทั้งแผ่น (กลางแผ่น/ชิดบน) ถ้าของในไดอะแกรมไม่ทับตารางมุมขวาล่าง — มุมนั้นของไดอะแกรมมักว่าง จะได้ขยายได้มากกว่า */
    const full = [A.x0 + 3, yT, A.x1 - 3, yTp];
    const hit = (s2, q) => bb.items.some((r) => q[0] + r[2] * s2 > RX0 - 2 && q[1] + r[1] * s2 < tabTop + 2);
    for (let s2 = Math.min(1.8, (full[2] - full[0]) / bw, (full[3] - full[1]) / bh); s2 > sc + 0.01; s2 -= 0.02) {
      const q = [at(full, s2), at(full, s2, true)].find((p) => !hit(s2, p));   // กลางแผ่นก่อน ไม่ได้ค่อยชิดบน
      if (q) { sc = s2; o = q; break; }
    }
    if (bw > 0 && bh > 0 && isFinite(sc)) pen = pgScalePen(pen0, sc, o[0], o[1]);
  }

  /* ── หัวคอลัมน์ ── */
  /* งานบ้านเครื่องเดียวไม่มีเบรกเกอร์ต่อเครื่อง — ซีกซ้ายตู้ AC ว่าง: ของในตู้/ขอบขวา/MDB เลื่อนซ้าย ตู้หดชิด MCB เมน (ผู้ใช้ 2026-10-31: กรอบยาวไป) */
  if (!isMain && !isDet && !P.pm && blocks.length === 1 && !blocks[0].typical) ["acB", "acBus", "acM", "ac1", "md0", "mdB", "mdBus", "md1"].forEach((k) => { X[k] -= 17; });
  const hy = A.y1 - 7;
  /* แผ่นภาพรวมไม่มีหัว PV ARRAY + DC BOX — ทับหัว INVERTER (ผู้ใช้ขีดฆ่า 2026-10-29) */
  if (!isMain) {
    pen.text(LB, (X.m1 + X.sl) / 2, hy, TS.zone, "PV ARRAY", { align: 1, valign: 1 });
    pen.text(LB, (X.dc0 + X.dc1) / 2, hy, TS.zone, fuseDev ? "DC COMBINER BOX" : "DC BOX", { align: 1, valign: 1 });
  }
  /* แผ่นภาพรวม: หัว INVERTER / AC COMBINER BOX ลงมาชิดขอบบนตู้ AC (ผู้ใช้ชี้ 2026-10-29) — วาดหลังรู้ acTop */
  const zoneHdr = (y) => {
    pen.text(LB, (X.iv0 + X.iv1) / 2, y, TS.zone, "INVERTER", { align: 1, valign: 1 });
    if (!isDet) pen.text(LB, (X.ac0 + X.ac1) / 2, y, TS.zone, "AC COMBINER BOX", { align: 1, valign: 1 });
  };
  if (!isMain) zoneHdr(hy);

  /* ── วาดบล็อกอินเวอร์เตอร์ทีละเครื่อง ──
     ทุกสตริง: แผงแรก ─ ─ แผงสุดท้าย → ป้องกันกระแสเกิน (DC MCB / ฟิวส์ gPV ทั้งสองขั้ว) → DC SPD → ขั้วอินเวอร์เตอร์
     สายดิน (เขียว): โครงแผง → PE trunk ซ้าย · SPD ทุกตัว → PE bar ในตู้ DC · ตัวเครื่องอินเวอร์เตอร์
     ทั้งหมดรวมที่เส้น PE ใต้บล็อก → PE trunk → หลักดินฝั่ง PV ที่ปักแยกจากระบบ (ไม่ต่อเข้า MET)
     ฝั่ง AC (SPD AC · PE/N-PE ของ MDB) → บัสดินหลัก (MET) → หลักดินระบบ */
  /* อินเวอร์เตอร์เครื่องเดียว: เลื่อนทั้งบล็อกลงให้ขั้ว AC อยู่ระดับสายเมน สายวิ่งตรงเข้าตู้ AC ไม่ต้องหักลง (ผู้ใช้วาดชี้ 2026-10-30)
     สายเมนสูงได้ถึง A.y1 − 34 (เหลือที่หลอดไฟแสดงเฟส + ขอบบนตู้ใต้หัวคอลัมน์) · เลื่อนไม่เกินที่ว่างใต้บล็อก */
  let cur = yB0;
  if (!isMain && !isDet && blocks.length === 1 && !blocks[0].typical) {
    for (let k = 0; k < 40; k++) {
      const G0 = geo(blocks[0], yTop), tap0 = (yTop - 1 + G0.boxBot) / 2;
      const need = tap0 - Math.max(Math.min(tap0, A.y1 - 34), yE0 + 44), room = G0.bottom - (yE0 + 20);
      cur = yTop - Math.max(0, Math.min(need, room));
      if (need <= room || RH <= 10) break;
      RH = Math.max(10, RH - 0.5);   // แถวที่ขยายเต็มแผ่นไว้ หดลงจนเลื่อนบล็อกได้ (สตริงน้อยแต่บล็อกสูง)
    }
  }
  const miniLines = (b) => [[LB, "INV" + b.no + "  " + b.kw + "kW " + P.phTxt + "  " + b.model],
    [T, b.nMp + " MPPT / " + b.nStr + " STRINGS / " + b.nPv + " x " + wp + "Wp = " + Math.round(b.nPv * wp / 10) / 100 + " kWp"],
    [T, b.ref]].filter((l, k) => l[1] && (k < 2 || MH >= 11));
  /* แผ่นภาพรวม: เส้นดินรวม (PE trunk) ขยับเข้ามาชิดข้อความสรุปที่ยาวสุด ไม่ลากยาวจากขอบแผ่น (ผู้ใช้ 2026-10-29) */
  if (isMain) {
    const hT = Math.min(TS.spec, 2.6 * 0.8);
    const wMax = Math.max.apply(null, blocks.map((b) => Math.max.apply(null, miniLines(b).map((l) => pgTextW(l[1], hT))))) * 1.2;
    X.pe0 = Math.max(X.pe0, X.iv1 - 8 - 5.6 - 2.5 - wMax - 5);
  }
  const taps = [];
  let peTop = null;
  blocks.forEach((b) => {
    const top = cur, G = geo(b, top);
    if (b.mini) {
      /* บล็อกย่อ (ผู้ใช้ 2026-10-29: เครื่องเยอะไม่เอากรอบ ไม่เอาสาย DC สีแดงทางซ้าย)
         สัญลักษณ์อินเวอร์เตอร์ + ป้าย INVn เหนือสัญลักษณ์ · สรุป PV ชิดขวาติดสัญลักษณ์ · ชี้ไปแผ่นย่อย */
      const bt = top - 1, sh = Math.min(8.5, (bt - G.boxBot) * 0.62), tapY = G.boxBot + sh / 2 + 0.6;
      const sx = X.iv1 - 8, sl = sx - sh * 0.65;
      pgSym.inverter(pen, sx, tapY, sh * 1.3, sh);
      pen.line(R, sx + sh * 0.65, tapY, X.iv1 - 0.6, tapY);
      pen.circle(S, X.iv1, tapY, 0.6);
      pen.text(LB, sx, tapY + sh / 2 + 0.7, Math.min(TS.head, bt - (tapY + sh / 2) - 0.9), "INV" + b.no, { align: 1, valign: 1 });
      const tx = sl - 2.5, tw = tx - X.m1;
      const ls = miniLines(b);
      const lp = Math.min(2.6, (bt - G.boxBot) / ls.length), lh = Math.min.apply(null, ls.map((l) => fitH(l[1], TS.spec, tw)));
      ls.forEach((l, k) => pen.text(l[0], tx, tapY + (ls.length - 1) * lp / 2 - k * lp, Math.min(lh, lp * 0.8), l[1], { align: 2, valign: 2 }));
      const peX = sx;
      pen.line(PE, peX, tapY - sh / 2, peX, G.yG);
      pen.line(PE, X.pe0, G.yG, peX, G.yG);
      if (peTop == null) peTop = G.yG; else peDot(X.pe0, G.yG);
      taps.push({ y: tapY, b, bot: tapY - sh / 2, vx: sx });
      cur = G.bottom - 2;
      return;
    }
    let y = G.firstY;
    const rowsY = [], mids = [];
    const trunkX = X.iv1 - (ivIn ? 22 : 16.5);   // แกนรวม MPPT → สัญลักษณ์อินเวอร์เตอร์ (ขอบซ้ายสัญลักษณ์ = iv1 − 13.5)
    let nStrB = 0, first = true;
    b.groups.forEach((gq, gi) => {
      if (gi) y -= GAP;
      const ys = [];
      gq.rows.forEach((row) => {
        ys.push(y);
        nStrB += row.k;
        if (row.empty) {   // ช่องว่างของ MPPT: ขั้วเปล่า + ป้าย ไม่มีสตริง/ฟิวส์/SPD
          pen.circle(S, X.iv0, y, 0.6);
          pen.text(T, X.iv0 + 1.2, y + 0.4, TS.tag, row.tag, { valign: 1 });
          y -= EH;
          return;
        }
        /* สตริง: แผงแรก ─ ─ แผงสุดท้าย */
        /* ช่องแผงจากขวา: 1 · 2 · 3 · (• • •) · n — เลขอยู่ในตัวแผงฝั่งซ้ายของสามเหลี่ยม */
        const nP = row.last || 1, slots = nP <= 4 ? Array.from({ length: nP }, (_, i) => i + 1) : [1, 2, 3, nP];
        const sxOf = (i) => (i < 3 ? X.mn - i * 8 : X.m1);
        slots.forEach((no, i) => {
          const px = sxOf(i);
          pgSym.pv(pen, px, y, 6.4, 3.6, null, true);
          /* เลขแผงในวงกลม ตัวใหญ่ขึ้น (ผู้ใช้ 2026-10-30) — เลขหลายหลักย่อให้พอดีวง */
          pen.circle(S, px - 1.5, y, 1.3);
          pen.text(T, px - 1.5, y, Math.min(1.6, 2.1 / Math.max(0.1, pgTextW(String(no), 1))), String(no), { align: 1, valign: 2 });
          if (i && !(i === 3 && nP > 4)) pen.line(CM, sxOf(i) + 3.2, y, sxOf(i - 1) - 3.2, y);   // แผง n กับ • • • ไม่มีเส้นต่อ (ผู้ใช้ขีดฆ่า)
        });
        if (nP > 4) [0, 1, 2].forEach((k) => pen.dot(CM, sxOf(2) - 3.2 - 1.6 - k * 1.6, y, 0.3));   // • • •
        const mLeft = sxOf(slots.length - 1) - 3.2;
        const lw = X.sl - X.tx - 1.5;
        pen.text(T, X.tx, y + 0.9, fitH(row.lab, TS.head, lw), row.lab, { valign: 1 });
        /* ขนาดสาย DC บนเส้นสตริง ช่องว่างระหว่างป้ายสตริงกับขีดคู่ (ผู้ใช้ 2026-10-30: ขาดการบอกขนาดสาย DC) — สเปคเต็มอยู่ในตาราง/แผ่นต่อสาย DC */
        {
          const dc = P.dcCable.replace(/ \(H1Z2Z2-K\)/, "").replace(/ 1\.5kV DC$/, "");
          const xl = X.tx + pgTextW(row.lab, fitH(row.lab, TS.head, lw)) * 1.05 + 1.5, xr = X.sl - 1.6;
          const dh = Math.min(TS.spec, (xr - xl) / Math.max(0.1, pgTextW(dc, 1)));
          if (dh >= 0.8) pen.text(T, xr, y + 0.5, dh, dc, { align: 2, valign: 1 });
          else pen.text(T, X.sl + 2.2, y - 1.0, TS.tag, dc, { valign: 3 });   // ไม่พอที่ = ใต้เส้นหลังขีดคู่
        }
        pen.text(T, X.tx, y - 1.0, fitH(row.sub, TS.spec, lw), row.sub, { valign: 3 });
        /* ต่อฝากโครงแผงเข้า PE trunk */
        pen.line(PE, X.pe0, y - 1.2, mLeft, y - 1.2);
        if (peTop == null) peTop = y - 1.2; else peDot(X.pe0, y - 1.2);
        /* สายสตริง → อุปกรณ์ป้องกัน → ขั้วอินเวอร์เตอร์ (ขีดสองขีด = วงจร DC +/−) */
        pen.line(R, X.mn + 3.2, y, fuseDev ? X.dcB - 2.4 : X.dcB - g - 0.75, y);
        if (fuseDev) hFuse(X.dcB, y); else hBrk(X.dcB, y);
        /* ป้ายเหนือฟิวส์ทุกตัว (ผู้ใช้ 2026-10-30): DC FUSE 20A 1500VDC — แทนสเปคหัวตู้ */
        if (ivSpd) {
          const ft0 = P.dcDev.tag.replace(/ gPV/, "").replace(/\s*\(\+\/-\)\s*$/, "");
          pen.text(T, X.dcB, y + 1.4, Math.min(TS.spec, fitH(ft0, TS.spec, X.dc1 - X.dc0 - 1.5)), ft0, { align: 1, valign: 1 });
        }
        pen.line(R, fuseDev ? X.dcB + 2.4 : X.dcB + g + 0.75, y, X.iv0, y);
        pen.line(R, X.sl - 0.7, y - 1.0, X.sl + 0.3, y + 1.0); pen.line(R, X.sl + 0.5, y - 1.0, X.sl + 1.5, y + 1.0);
        if (first && !ivSpd) {
          /* สเปคฟิวส์/MCB + DC SPD ขนาดตัวหนังสือเท่าสเปคอื่น (TS.spec) — ยาวเกินช่องตัดขึ้นบรรทัดใหม่ ไม่ย่อตัว */
          const tw = X.dc1 - X.dc0 - 2;
          /* ตัดบรรทัดตามความหมาย: ชนิด+แรงดัน | กระแส */
          const brk = (t, re) => t.split(re).filter(Boolean).reduce((o, p) => o.concat(wrapT(p.trim(), TS.spec, tw)), []);
          /* สเปค MCB/ฟิวส์พอดีบรรทัดเดียว = ไม่ตัด (เหลือ 3 บรรทัด) · เริ่มเหนือโค้งเบรกเกอร์ (g × 1.26 ≈ 3.0) — ผู้ใช้ 2026-10-31: ตัวหนังสือโดนทับ */
          const devL = pgTextW(P.dcDev.tag, TS.spec) <= tw ? [P.dcDev.tag] : brk(P.dcDev.tag, / (?=[0-9]+VDC)/);
          const lines = (ivSpd ? [] : brk(P.dcSpdFull, / (?=In |Iimp )/)).concat(devL);
          const yT0 = y + g * 1.26 + 0.5, pitch = Math.min(1.7, Math.max(TS.spec + 0.2, (y + 8.4 - TS.spec - yT0) / Math.max(1, lines.length - 1)));
          lines.slice().reverse().forEach((t, i) => pen.text(T, X.dc0 + 1, yT0 + i * pitch, TS.spec, t, { valign: 1 }));
        }
        /* DC SPD ต่อทุกสตริง: L+/L− ลง SPD → PE bar (งานโครงการ SPD อยู่ในอินเวอร์เตอร์ ไม่มีในตู้ DC) */
        if (!ivSpd) {
        pen.dot(R, X.dcS, y, 0.5);
        pen.line(R, X.dcS, y, X.dcS, y - 2.2);
        spdS(X.dcS, y - 2.2);
        /* สายดิน SPD: ลงต่อจากใต้กล่องก่อนแล้วค่อยเลี้ยวเข้า PE bar (ผู้ใช้วาดชี้) — ไม่ชิดชายกล่อง · เว้นห่างแถวถัดไปอย่างน้อย 1.5 มม. */
        const peY = y - 2.2 - SPD_H - Math.max(0.6, Math.min(2.5, RH - 2.2 - SPD_H - 1.5));
        pen.line(PE, X.dcS, y - 2.2 - SPD_H, X.dcS, peY);
        pen.line(PE, X.dcS, peY, X.dcPE, peY);
        if (first) pen.text(T, X.dcS + 1.8, y - 4.6, TS.tag, "SPD", { valign: 2 });
        }
        pen.circle(S, X.iv0, y, 0.6);
        if (row.tag) pen.text(T, X.iv0 + 1.2, y + 0.4, TS.tag, row.tag, { valign: 1 });
        first = false;
        y -= RH;
      });
      /* ช่อง MPPT ในตัวเครื่อง (ผู้ใช้วาดแบบมาให้ 2026-10-29): ทุกขั้ว IN ของ MPPT เดียวกันรวมเป็นวงเล็บ
         → เส้นออกกลางวงเล็บ (ป้าย MPPTn บนเส้น) → แกนตั้งเส้นเดียว ลงไปเข้าสัญลักษณ์อินเวอร์เตอร์ (DC/AC) — วาดเป็นสาย DC สีแดง */
      const bx = X.iv0 + (ivIn ? 16 : 5.5), y0 = ys[0], y1 = ys[ys.length - 1], ym = (y0 + y1) / 2;
      if (ivIn) {
        /* DC SWITCH ในตัวเครื่องที่ขั้ว IN ของแต่ละ MPPT (ผู้ใช้ชี้ 2026-10-30) — ทุกขั้วของ MPPT เดียวกันตัดพร้อมกัน (เส้นประเชื่อมใบมีด) */
        const sw = X.iv0 + 8.5;   // มีสายนำจากขั้ว IN ป้าย IN ไม่ชนขาสวิตช์ (ผู้ใช้ 2026-10-30: เพิ่มความยาวเส้นให้พอดี)
        ys.forEach((yy) => {
          pen.line(R, X.iv0 + 0.6, yy, sw - g - 0.45, yy);
          pen.circle(S, sw - g, yy, 0.45); pen.circle(S, sw + g, yy, 0.45);
          pen.line(S, sw - g + 0.4, yy + 0.2, sw + g - 0.2, yy + 2.0);
          pen.line(R, sw + g + 0.45, yy, bx, yy);
        });
        if (gi === 0) pen.text(T, sw, y0 + 2.8, TS.tag, "DC SWITCH", { align: 1, valign: 1 });
      } else ys.forEach((yy) => pen.line(R, X.iv0 + 0.6, yy, bx, yy));
      if (ys.length > 1) pen.line(R, bx, y0, bx, y1);
      pen.line(R, bx, ym, trunkX, ym);
      pen.text(T, bx + 1.0, ym + 0.5, TS.spec, b.typical ? "MPPT" : "MPPT" + gq.mppt, { valign: 1 });
      mids.push(ym);
      rowsY.push.apply(rowsY, ys);
    });
    const lastY = rowsY[rowsY.length - 1];
    /* ใบมีด DC SWITCH ทุกขั้วของเครื่องเชื่อมเส้นประเทาเส้นเดียวตลอด (ผู้ใช้วาดชี้ 2026-10-30) */
    if (ivIn && rowsY.length > 1) pen.line(PG_SLD.swlink, X.iv0 + 8.5, rowsY[0] + 1.1, X.iv0 + 8.5, lastY + 1.1);
    /* สรุปแผงของเครื่องนี้หน้าแผงเป็นตาราง (ผู้ใช้ 2026-10-30 ส่งตัวอย่าง): หัว = ชื่อเครื่อง ·
       PER STRING = 18 PV X 670 = 12,060 W · TOTAL POWER = 12,060 W X 10 STRING = 120,600 W · TOTAL PV = 18 PV X 10 STRING = 180 PV
       สตริงหลายขนาด = PER STRING แถวละขนาด แล้วรวมด้วย + · คอลัมน์ "=" ตรงกันทุกแถว */
    if (!b.typical) {
      const ns = [];
      byInv[b.no].forEach((r) => r.ins.forEach((x) => ns.push(x.n)));
      const nU = ns.filter((n, i) => ns.indexOf(n) === i).sort((p, q) => q - p), nPv = ns.reduce((t, n) => t + n, 0);
      const cnt = (n) => ns.filter((q) => q === n).length, fmt = (v) => Math.round(v).toLocaleString("en-US");
      const rows = nU.map((n) => ["PER STRING", n + " PV X " + wp, fmt(n * wp) + " W"]).concat([
        ["TOTAL POWER", nU.map((n) => fmt(n * wp) + " W X " + cnt(n) + " STRING").join(" + "), fmt(nPv * wp) + " W"],
        ["TOTAL PV", nU.map((n) => n + " PV X " + cnt(n) + " STRING").join(" + "), nPv + " PV"]]);
      const th = TS.spec, rh = th + 1.6, pd = 1.0, eq = pgTextW("=", th) + 2 * pd;
      const cw = [0, 1, 2].map((i) => Math.max.apply(null, rows.map((r) => pgTextW(r[i], th))) + 2 * pd);
      const tw = cw[0] + eq + cw[1] + eq + cw[2];
      /* ตารางอยู่ใต้สตริงสุดท้ายของเครื่อง ชิดเส้นดินโครงแผง (ผู้ใช้วาดชี้ 2026-10-30) */
      const nR = rows.length + 1, x0 = X.dc0 - 2.5 - tw, yTop = lastY - 4.5;   // ชิดขวาก่อนตู้ DC (ผู้ใช้ย้าย)
      const head = (b.names || "INV" + b.no).replace(/INV(\d)/g, "INVERTER $1") + (b.names ? "  (PER SET)" : "");   // เขียนเต็ม (ผู้ใช้ 2026-10-30)
      pen.rect(L, x0, yTop - nR * rh, tw, nR * rh);
      pen.text(LB, x0 + pd, yTop - rh / 2, th, head, { valign: 2 });
      rows.forEach((r, k) => {
        const y = yTop - (k + 1) * rh;
        pen.line(L, x0, y, x0 + tw, y);
        const xs = [x0, x0 + cw[0], x0 + cw[0] + eq, x0 + cw[0] + eq + cw[1], x0 + cw[0] + 2 * eq + cw[1]];
        pen.line(L, xs[1], y, xs[1], y - rh);
        const cy = y - rh / 2;
        pen.text(T, xs[0] + pd, cy, th, r[0], { valign: 2 });
        pen.text(T, xs[1] + eq / 2, cy, th, "=", { align: 1, valign: 2 });
        pen.text(T, xs[2] + pd, cy, th, r[1], { valign: 2 });
        pen.text(T, xs[3] + eq / 2, cy, th, "=", { align: 1, valign: 2 });
        pen.text(k === rows.length - 1 || k === rows.length - 2 ? LB : T, x0 + tw - pd, cy, th, r[2], { align: 2, valign: 2 });
      });
    }
    /* ตู้ DC + PE bar */
    const dTop = top - 1.5;
    pen.rect(BX, X.dc0, G.dBot, X.dc1 - X.dc0, dTop - G.dBot);
    const barT = rowsY[0] - 5.6, barB = lastY - 10;   // ต่ำกว่าสายดิน SPD แถวสุดท้าย (ลงใต้กล่องก่อนเลี้ยว)
    if (!ivSpd) {   // งานโครงการไม่มี SPD ในตู้ DC = ไม่มี PE bar (ผู้ใช้ขีดฆ่า 2026-10-30)
      pen.solid(PE, [X.dcPE - 0.5, barB], [X.dcPE + 0.5, barB], [X.dcPE + 0.5, barT], [X.dcPE - 0.5, barT]);
      pen.text(T, X.dcPE - 1.2, barB - 0.4, TS.tag, "PE", { align: 2, valign: 3 });
    }
    const per = b.typical ? " /INV" : "";
    const nS = b.typical ? Math.round(nStrB / b.cnt) : nStrB;
    const ft = [
      /* งานโครงการท้ายตู้ไม่เขียน gPV/พิกัดกระแส — มีเหนือฟิวส์ทุกตัวแล้ว (ผู้ใช้ขีดฆ่า 2026-10-30) */
      (fuseDev ? (ivSpd ? P.dcDev.tag.replace(/ gPV \d+A/, "") : P.dcDev.tag) + " x" + nS * 2 : P.dcDev.tag + " x" + nS) + per,
      "DC SPD " + P.dcSpdTag.replace(/^SPD /, "") + " x" + nS + per,
    ].slice(0, ivSpd ? 1 : 2);
    /* งานโครงการ: แตกเป็นสองบรรทัด "DC FUSE 1500VDC" / "(+/-) x20" ตัวหนังสือจะได้ไม่ต้องย่อ (ผู้ใช้ขอใหญ่ขึ้น 2026-10-30) */
    if (ivSpd) { const k = ft[0].indexOf(" (+/-)"); if (k > 0) ft.splice(0, 1, ft[0].slice(0, k), ft[0].slice(k + 1)); }
    /* งานโครงการไม่มี PE bar — ใช้กว้างเต็มตู้ ตัวหนังสือไม่ต้องย่อ (ผู้ใช้ขอใหญ่ขึ้น 2026-10-30) */
    const fw = (ivSpd ? X.dc1 - 1 : X.dcPE - 2.5) - (X.dc0 + 1);
    const fth = Math.min.apply(null, ft.map((s) => fitH(s, TS.spec, fw)));   // ทุกบรรทัดขนาดเท่ากัน (ผู้ใช้ 2026-10-29) ไม่ใช่ย่อเฉพาะบรรทัดที่ยาว
    ft.forEach((s, i) => pen.text(T, X.dc0 + 1, G.dBot + 1.0 + (ft.length - 1 - i) * 2.1, fth, s, { valign: 1 }));
    /* อินเวอร์เตอร์ */
    const boxTop = top - 1;
    pen.rect(S, X.iv0, G.boxBot, X.iv1 - X.iv0, boxTop - G.boxBot);
    const tapY = (boxTop + G.boxBot) / 2;
    /* งานโครงการ: สัญลักษณ์เลื่อนซ้าย 6 ให้ที่ AC SPD ฝั่งขาออก (ผู้ใช้ 2026-10-30) */
    const ivSh = ivIn ? 6 : 0;
    pgSym.inverter(pen, X.iv1 - 8 - ivSh, tapY, 11, 8.5);
    const tLo = Math.min(tapY, Math.min.apply(null, mids)), tHi = Math.max(tapY, Math.max.apply(null, mids));
    if (tHi > tLo) pen.line(R, trunkX, tLo, trunkX, tHi);
    if (ivIn) {
      /* DC SPD (Type II) ต่อตรงใต้แกนรวม MPPT (บัส DC) → สัญลักษณ์ดิน (ผู้ใช้วาดชี้ 2026-10-30) · DC SWITCH อยู่ที่ขั้ว IN */
      const yS = Math.min(tapY, Math.min.apply(null, mids)), spT = yS - 2;
      pen.line(R, trunkX, tapY, X.iv1 - 13.5 - ivSh, tapY);
      pen.line(R, trunkX, yS, trunkX, spT);
      spdS(trunkX, spT);
      pen.text(T, trunkX - 1.6, spT - SPD_H / 2, TS.tag, "DC SPD", { align: 2, valign: 2 });   // ป้ายซ้าย ไม่ชนสัญลักษณ์ (MPPT เดียว)
      pen.line(S, trunkX, spT - SPD_H, trunkX, spT - SPD_H - 1.2);   // เส้นดำเหมือนสัญลักษณ์ (ผู้ใช้ 2026-10-30)
      pgSym.ground(pen, trunkX, spT - SPD_H - 1.2);
    } else pen.line(R, trunkX, tapY, X.iv1 - 13.5, tapY);
    /* ขั้ว AC ออกที่ขอบกล่อง — วงกลมแบบเดียวกับขั้ว IN ฝั่งซ้าย (ผู้ใช้วงชี้ 2026-10-29) */
    pen.line(R, X.iv1 - 2.5 - ivSh, tapY, X.iv1 - 0.6, tapY);
    if (ivIn) {
      /* AC SPD ในตัวเครื่องฝั่งขาออก AC → สัญลักษณ์ดิน (ผู้ใช้วาดชี้ 2026-10-30) */
      const ax = X.iv1 - 4, aT = tapY - 5;   // ป้ายอยู่ต่ำกว่าสัญลักษณ์ ไม่ทับมุมกล่อง
      pen.dot(R, ax, tapY, 0.5);
      pen.line(R, ax, tapY, ax, aT);
      spdS(ax, aT);
      pen.text(T, ax - 1.4, aT - SPD_H / 2, TS.tag, "AC SPD", { align: 2, valign: 2 });
      pen.line(S, ax, aT - SPD_H, ax, aT - SPD_H - 1.2);
      pgSym.ground(pen, ax, aT - SPD_H - 1.2);
    }
    pen.circle(S, X.iv1, tapY, 0.6);
    const nm = b.names || (b.typical ? "INV" + b.no + "-INV" + b.to + " (x" + b.cnt + ")" : "INV" + b.no);
    const ix = X.iv0 + 4, iw = (b.bat ? X.iv1 - 15.5 : X.ac0 - 1) - ix;   // มีแบต: ป้ายจบก่อนสาย BAT ที่ลงตรงจากใต้สัญลักษณ์
    /* ใต้กล่องอินเวอร์เตอร์: ทุกบรรทัดขนาดเท่ากัน ระยะบรรทัดเท่ากัน (ผู้ใช้ 2026-10-29) — เดิมหัวใหญ่กว่า แต่ละบรรทัดย่อเองคนละขนาด ช่องห่างไม่เท่า
       ขนาด = เล็กสุดที่ทุกบรรทัดพอดีความกว้าง · ชื่อเครื่องยังเป็นสีป้าย (LB) */
    /* รุ่นของเครื่องนั้นเอง (งานปนหลายรุ่น · ผู้ใช้ 2026-10-29: สูงสุด 4 รุ่น) · กลุ่มหลายเครื่อง = ชื่อกลุ่มบรรทัดเดียว กำลังไปอยู่บรรทัดรุ่น */
    const ivL = b.names ? [[LB, nm], [T, b.kw + "kW " + P.phTxt + "  " + b.model], [T, "DC SWITCH : BUILT-IN"], [T, "AC : " + M.acCable]]
      : [[LB, nm + "  " + b.kw + "kW " + P.phTxt], [T, b.model || M.inv.model], [T, "DC SWITCH : BUILT-IN"], [T, "AC : " + M.acCable]];
    if (ivIn) ivL.forEach((l) => { if (l[1] === "DC SWITCH : BUILT-IN") l[1] = "DC SWITCH + DC/AC SPD TYPE II : BUILT-IN"; });
    /* มีแบต: สาย BAT ลงจากขอบล่างกล่อง — บรรทัดยาวตัดเป็นสองบรรทัดให้ป้ายจบก่อนถึงสาย ไม่ต้องย่อตัว */
    if (b.bat) { const k = ivL.findIndex((l) => /^DC SWITCH \+ /.test(l[1])); if (k >= 0) ivL.splice(k, 1, [T, "DC SWITCH + DC/AC SPD"], [T, "TYPE II : BUILT-IN"]); }
    const ivH = Math.min.apply(null, ivL.map((l) => fitH(l[1], TS.spec, iw)));
    ivL.forEach((l, k) => pen.text(l[0], ix, G.boxBot - 1.2 - k * 2.4, ivH, l[1], { valign: 3 }));
    /* แบตเตอรี่ของไฮบริด (ผู้ใช้ 2026-10-31 วาดชี้): ขั้ว BAT ที่ขอบล่างกล่องอินเวอร์เตอร์ (ในกล่องต่อจากสัญลักษณ์)
       → สาย DC ลงตรงเข้าด้านบนกล่องแบตใต้ป้ายอินเวอร์เตอร์ · ป้ายรุ่นใต้กล่อง */
    if (b.bat) {
      const tx = X.iv1 - 8 - ivSh, bw = 20, bh = 6, bTop = G.boxBot - 1.2 - ivL.length * 2.4 - 1.6, bMid = bTop - bh / 2, bx0 = tx - bw / 2;
      const sb = tapY - 8.5 / 2;   // ขั้ว BAT ตรงใต้สัญลักษณ์ สายลงเส้นเดียว (ผู้ใช้วาดชี้ 2026-10-31)
      pen.line(R, tx, sb, tx, G.boxBot + 0.6);   // ในกล่อง: สัญลักษณ์ → ขั้ว BAT
      pen.circle(S, tx, G.boxBot, 0.6);
      pen.text(T, tx + 1.0, G.boxBot - 0.9, TS.tag, "BAT", { valign: 3 });
      pen.line(R, tx, G.boxBot - 0.6, tx, bTop);
      pen.rect(S, bx0, bTop - bh, bw, bh);
      const bt = "BATTERY " + M.batt.kwh + " kWh";
      pen.text(LB, tx, bMid, fitH(bt, TS.spec, bw - 2), bt, { align: 1, valign: 2 });   // ไม่มีแผ่นแบตในกล่อง (ผู้ใช้ขีดฆ่า 2026-10-31)
      const bm = ((M.batt.brand && M.batt.model.indexOf(M.batt.brand) < 0 ? M.batt.brand + " " : "") + M.batt.model).trim();
      pen.text(T, tx, bTop - bh - 0.8, fitH(bm, TS.spec, bw + 8), bm, { align: 1, valign: 3 });
    }
    /* สายดินของบล็อก: PE bar ตู้ DC + ตัวเครื่องอินเวอร์เตอร์ → PE trunk */
    const peX = X.iv0 + 2;
    if (!ivSpd) pen.line(PE, X.dcPE, barB, X.dcPE, G.yG);
    pen.line(PE, peX, G.boxBot, peX, G.yG);
    pen.line(PE, X.pe0, G.yG, peX, G.yG);
    if (!ivSpd) peDot(X.dcPE, G.yG);
    peDot(X.pe0, G.yG);
    taps.push({ y: tapY, b, bot: G.boxBot, vx: X.iv1 - 5 });
    cur = G.bottom - 2;
  });
  const blkLow = cur;
  pen.text(T, X.pe0 + 1.2, cur - 0.5, TS.spec, "PV FRAME & RAIL BONDING  THW(G) " + Math.max(6, Math.min(16, P.earthCu)) + " Sq.mm.", { valign: 3 });

  if (isDet) {
    /* แผ่นย่อย: ขั้ว AC ของทุกเครื่องในกลุ่มไปตู้ AC รวมในแผ่นภาพรวม */
    const t = taps[0], ex = X.ac0 + 28;
    pen.line(R, X.iv1 + 0.6, t.y, ex, t.y);
    pen.solid(R, [ex, t.y + 1.1], [ex + 2.6, t.y], [ex, t.y - 1.1]);
    pen.text(LB, ex + 4, t.y + 0.9, TS.head, "TO AC COMBINER BOX", { valign: 1 });
    if (PT.ref) pen.text(T, ex + 4, t.y - 1.0, TS.spec, PT.ref, { valign: 3 });
    const cb = "CB : " + t.b.brk;
    pen.text(T, X.iv1 + 3, t.y + 1.0, fitH(cb, TS.spec, ex - X.iv1 - 4), cb, { valign: 1 });
    const yE = Math.max(yE0, blkLow - 4);
    pen.line(PE, X.pe0, peTop, X.pe0, yE);
    pen.line(PE, X.pe0, yE, X.pe0, yE - 2.3);
    pgSym.ground(pen, X.pe0, yE - 2.3);
    pen.text(T, X.pe0 + 3.2, yE - 3.4, TS.spec, "PV EARTH ROD (SEPARATE)  5/8\" x 2.4m  R <= 5 OHM", { valign: 2 });
  } else {
    /* ── ตู้ AC รวม ── */
    const tY = taps.map((t) => t.y);
    const tMax = Math.max.apply(null, tY), tMin = Math.min.apply(null, tY);
    let yMain = Math.min((tMax + tMin) / 2, A.y1 - (taps.length === 1 && !taps[0].b.typical ? 34 : 66));
    yMain = Math.max(yMain, yE0 + 44);
    const oneInv = taps.length === 1 && !taps[0].b.typical;
    /* ป้ายเบรกเกอร์อินเวอร์เตอร์แบบเศษส่วน (ผู้ใช้ 2026-10-29 วาดให้ดู): MCCB 3P 36kA / 400AF ── 400AT
       ความสูงตัวอักษรย่อตามระยะห่างแถว ไม่ให้ชนแถวบน · รูปแบบอื่น (MCB 2P 32A) เขียนบรรทัดเดียวเหมือนเดิม */
    const tGap = taps.length > 1 ? Math.min.apply(null, taps.slice(1).map((t, i) => Math.abs(taps[i].y - t.y))) : 20;
    const brkLabel = (bl, cnt, x, y) => {
      const m = /^(\S+)\s+(\d+P)\s+(\d+AF)\s+(\d+AT)(?:\s+(.+))?$/.exec(bl);   // ท้ายได้หลายคำ เช่น "65kA LSIG"
      if (!m) { const s = bl + cnt; pen.text(T, x, y + 5.0, fitH(s, TS.spec, 2 * (x - X.ac0) - 1), s, { align: 1, valign: 1 }); return; }
      const h = Math.max(0.9, Math.min(1.5, (tGap - 4.6) / 3.6)), hs = h * 0.8;
      const y1 = y + g * 1.26 + 0.9, yBar = y1 + h + 0.45, y2 = yBar + 0.5, y3 = y2 + h + 0.55;
      const sub = " " + m[2] + (m[5] ? " " + m[5] : "") + cnt;
      /* ผู้ใช้ชี้: MCCB อยู่บนเศษส่วน · "3P 36kA" ย้ายไปขวาของเศษส่วน */
      pen.text(T, x, y3, h * 1.12, m[1], { align: 1, valign: 1 });
      pen.text(T, x, y2, h, m[3], { align: 1, valign: 1 });
      const wb = Math.max(pgTextW(m[3], h), pgTextW(m[4], h)) * 0.98 / 2 + 0.15;   // เส้นยาวเท่าตัวอักษร (ผู้ใช้: เส้นใต้ยาวไป)
      pen.line(S, x - wb, yBar, x + wb, yBar);
      pen.text(T, x, y1, h, m[4], { align: 1, valign: 1 });
      pen.text(T, x + wb + 1.6, y2 + 0.15, hs, sub.trim(), { valign: 1 });   // ระดับเดียวกับ AF (ผู้ใช้วาดให้ดู)
    };
    const invCab = String(M.acCable || "").replace(/\s+(L1,L2,L3,N|L,N)\s*$/, "").replace(/(\dC)-/, "$1x").replace(/\s+/g, " ");
    /* ขนาด/จำนวนเส้น/วิธีเดินสายจาก BOQ ต่อเครื่อง (M.acCableOf · p3SldFromBoq) — ไม่มีแถวใน BOQ ใช้สาย AC ที่คำนวณเอง · kV ต่อท้ายเมื่อชื่อยังไม่บอก */
    const withKv = (s) => /kV|\/750V/.test(s) ? s : s + " 0.6/1kV";
    /* สายดินต่อเครื่อง: ขนาดตาม AT ของเบรกเกอร์เครื่องนั้น — ตารางเดียวกับสายดินเมน (p3SldModel earthCu) */
    const invG = (brk) => {
      const at = +((/(\d+)AT/.exec(String(brk || "")) || /(\d+)A\b/.exec(String(brk || "")) || [])[1]) || 0;
      const cu = at <= 100 ? 10 : at <= 200 ? 16 : at <= 400 ? 25 : at <= 500 ? 35 : at <= 800 ? 50 : at <= 1000 ? 70 : 95;
      return "G-" + cu + " Sq.mm. IEC01(THW)";
    };
    /* เครื่องเดียว: สายเมนอยู่ต่ำกว่าขั้วอินเวอร์เตอร์ได้ (ตู้ต้องเหลือที่ไฟแสดงเฟสด้านบน) → สายลงที่ oneX ก่อน CT
       เดิมลงที่บัสซึ่งอยู่ขวาของ CT ทำให้ CT ลอยไม่คล้องสาย (ผู้ใช้ชี้ 2026-10-30) */
    const oneX = X.ac0 - 3;   // ลงนอกตู้ ไม่ทับเส้นประขอบตู้ แล้วเข้าตู้แนวนอน
    taps.forEach((t, i) => {
      if (oneInv) { pen.line(R, X.iv1 + 0.6, t.y, oneX, t.y); pen.line(R, oneX, t.y, oneX, yMain); return; }
      pen.line(R, X.iv1 + 0.6, t.y, X.acB - g - 0.75, t.y);
      /* แผ่นภาพรวม: ป้ายสาย AC อินเวอร์เตอร์เหนือเส้นทุกเส้น + จำนวนเส้นรวม (ผู้ใช้ 2026-10-29) */
      if (isMain) {
        /* ตัวหนังสือขนาดเท่าบรรทัดสรุป PV ข้างอินเวอร์เตอร์ (ผู้ใช้ชี้ 2026-10-29) — แยก 3 บรรทัดไม่ให้ต้องย่อ:
           เหนือเส้น = สายกำลัง · ใต้เส้น = สายดิน แล้ววิธีเดินสาย */
        /* ไม่บอกพิกัดแรงดันสาย 450/750V · 0.6/1kV (ผู้ใช้ขีดฆ่า 2026-10-29) */
        const lc = String((M.acCableOf && M.acCableOf[t.b.no]) || invCab).replace(/\s*(0\.6\/1kV|450\/750V)\s*$/, ""), gl = (M.acGndOf && M.acGndOf[t.b.no]) || invG(t.b.brk);
        /* ทุกบรรทัดขนาดเดียวกัน บรรทัดเดียวไม่ตัดคำ · ไม่เลยเส้นประขอบตู้ AC (ขอบตู้ขยับขวาให้ที่ 2026-10-29) */
        const tx = X.iv1 + 1.4, cw = X.ac0 - tx - 1.2, dn = [gl].concat(M.acRoute ? [M.acRoute] : []);
        /* วัดจากความกว้างตัวอักษรจริง (pgTextW) — fitH นับทุกตัวเท่ากันเลยย่อเกินจนเหลือครึ่งช่อง */
        const ch = Math.max(0.9, Math.min.apply(null, [TS.spec * 1.3, (tGap - 2.4) / 3.4].concat([lc].concat(dn).map((l) => cw / (pgTextW(l, 1) * 1.12)))));
        pen.text(T, tx, t.y + 0.7, ch, lc, { valign: 1 });
        dn.forEach((l, k) => pen.text(T, tx, t.y - 0.7 - k * (ch + 0.6), ch, l, { valign: 3 }));   // สายดิน + วิธีเดินใต้เส้น
      }
      hBrk(X.acB, t.y, isCb(t.b.brk));
      brkLabel(String(t.b.brk || ""), t.b.typical ? " x" + t.b.cnt : "", X.acB, t.y);
      pen.line(R, X.acB + g + 0.75, t.y, X.acBus, t.y);
      if (t.y !== tMax || yMain > tMax) pen.dot(R, X.acBus, t.y, 0.5);
    });
    /* เครื่องเดียว: สายเข้าตู้ที่ระดับสายเมน ตู้ไม่ต้องสูงถึงขั้วอินเวอร์เตอร์ (ผู้ใช้ชี้หลอดไฟลอยสูง 2026-10-30) */
    const busHi = oneInv ? yMain : Math.max(tMax, yMain), busLo = Math.min(tMin, yMain);
    if (!oneInv) pen.line(R, X.acBus, busHi, X.acBus, busLo);
    /* ตู้ AC เรียงตามสายเมน (ผู้ใช้ 2026-10-29: ชุดกันเสิร์จย้ายไปฝั่งกริด):
       บัส → CT ของ PM (cx) → MCCB เมน (mx) → ZCT → จุดแยกไฟเลี้ยง PM (px) → จุดแยกไฟแสดงเฟส (lx) → จุดแยก ฟิวส์+SPD (sx) → ออกตู้
       (ผู้ใช้ 2026-10-29: CT อยู่ฝั่งอินเวอร์เตอร์ก่อน MCCB · ไฟเลี้ยง PM แยกหลัง MCCB) */
    /* อินเวอร์เตอร์เครื่องเดียว = บัสเป็นแค่จุดต่อ → CT ขยับซ้ายเลยบัสได้ (ผู้ใช้วาดชี้ 2026-10-29) */
    /* หลายเครื่องในแผ่นเดียว: ระยะ CT–MCCB เมนตามความกว้างป้ายจริง ไม่ให้ป้าย CT ทับป้าย MCCB (เช่น MCCB 3P 1000AT LSIG) · กล่อง DM ไม่ชน MCB 2P 6A (2026-10-30) */
    const mainL0 = P.mainTxt + (P.lsig ? " LSIG" : "");
    const ctGap = Math.max(10, (pgTextW("CT " + P.pmCt, TS.spec) + (/AF/.test(mainL0) ? pgTextW("MCCB", TS.spec * 1.12) : pgTextW(mainL0, TS.spec))) / 2 + 1.5);
    const cx = X.acBus + (oneInv ? -12.5 : isMain ? 13 : 4.5), mx = P.pm ? (oneInv ? X.acBus + 4 : cx + (isMain ? 13 : ctGap)) : X.acBus + (isMain ? 14 : 8);   // เครื่องเดียว: CT ห่าง MCCB ออกมา (ผู้ใช้ขอ)
    if (P.pm && !oneInv && !isMain) X.ac1 += ctGap - 7;   // ตู้ขยายขวาตามระยะที่เพิ่ม
    const hasGf = P.gf && !P.lsig;
    /* มี power meter = มีไฟแสดงเฟสเหนือสายเมน → ขยายขอบบนตู้ให้หลอดอยู่ในตู้ (ผู้ใช้ตีกรอบชี้ 2026-10-29) */
    /* แผ่นภาพรวม: หลอดไฟอยู่ต่ำชิดสายเมน ไม่ต้องเผื่อขอบบนตู้ 15 หน่วยให้แถว PM (ผู้ใช้ชี้ 2026-10-29 ขอบบนลอยสูงเกิน) · +12 พ้นป้าย MCCB เศษส่วนของเครื่องบนสุด */
    /* หลอดไฟแสดงเฟสอยู่เหนือสายเมน 12 หน่วยทุกจำนวนเครื่อง — ขอบบนตู้คลุมหลอด ไม่ลอยไปชนหัว AC COMBINER BOX (ผู้ใช้ชี้ 2026-10-30) */
    const acTop0 = busHi + 12, acTop = P.pm ? Math.max(acTop0, yMain + 21) : acTop0;
    /* เมนของตู้ */
    if (!oneInv) pen.dot(R, X.acBus, yMain, 0.5);   // เครื่องเดียว = สายเส้นเดียวไม่มีจุดแยก ไม่ต้องมีจุด (ผู้ใช้ชี้จุดค้าง)
    pen.line(R, oneInv ? oneX : X.acBus, yMain, mx - g - 0.75, yMain);
    hBrk(mx, yMain, isCb(P.mainTxt));
    /* งานบ้าน "MCB … + RCCB …" วาดแยกสองตัว (ผู้ใช้ 2026-10-31: ต้องแยกเป็นสองอัน) — MCB แล้วตามด้วย RCCB
       ของทางขวา (ไฟเลี้ยง PM · SPD · ขอบตู้ · MDB) เลื่อนตามระยะที่เพิ่ม */
    const mainL = mSplit ? mSplit[1] : P.mainTxt + (P.lsig ? " LSIG" : "");
    brkLabel(mainL, "", mx, yMain);   // เมนแบบเศษส่วนเหมือนเบรกเกอร์อินเวอร์เตอร์ (ผู้ใช้: ACB ไม่มี AF/IC)
    let wx = mx + g + 0.75, mx2 = mx;
    if (mSplit) {
      const rx = mx + RD;
      pen.line(R, wx, yMain, rx - g - 0.75, yMain);
      hBrk(rx, yMain);
      const rl = /^(.*?A) (\d+mA)$/.exec(mSplit[2]);
      if (rl) { pen.text(T, rx, yMain + g * 1.26 + 2.6, TS.spec, rl[1], { align: 1, valign: 1 }); pen.text(T, rx, yMain + g * 1.26 + 0.6, TS.spec, rl[2], { align: 1, valign: 1 }); }
      else brkLabel(mSplit[2], "", rx, yMain);
      wx = rx + g + 0.75; mx2 = mx + MSPL;   // ไม่มีวงทอรอยด์ (ผู้ใช้ขีดฆ่า 2026-10-31)
    }
    if (hasGf) {
      /* Ground fault: ZCT คล้องสายเมน → รีเลย์ GFR → สั่ง Shunt trip ของ MCCB */
      const zx = mx + 6.5, gy0 = yMain - 10.6, gy1 = yMain - 7;
      pen.line(R, wx, yMain, zx - 1.7, yMain);
      pen.circle(S, zx, yMain, 1.7);
      pen.line(R, zx - 1.7, yMain, zx + 1.7, yMain);
      wx = zx + 1.7;
      pen.text(T, zx, yMain + 2.3, TS.tag, "ZCT", { align: 1, valign: 1 });
      pen.rect(S, zx - 3.4, gy0, 6.8, gy1 - gy0);
      pen.text(T, zx, (gy0 + gy1) / 2, TS.spec, "GFR", { align: 1, valign: 2 });
      pen.line(CM, zx, yMain - 1.7, zx, gy1);
      /* สาย shunt trip GFR → MCCB เป็นเส้นประถี่แบบสายสัญญาณ (ผู้ใช้วาดชี้ 2026-10-30) */
      pen.line(PG_SLD.ctsig, zx - 3.4, (gy0 + gy1) / 2, mx, (gy0 + gy1) / 2);
      pen.line(PG_SLD.ctsig, mx, (gy0 + gy1) / 2, mx, yMain + 2.6 * g / (2 * g - 1));   // ขึ้นไปแตะใบมีด MCCB (ผู้ใช้ชี้)
      pen.text(T, mx - 0.8, yMain - 4.4, TS.tag, "SHUNT", { align: 2, valign: 2 });
      pen.text(T, mx - 0.8, yMain - 6.1, TS.tag, "TRIP", { align: 2, valign: 2 });
    }
    pen.line(R, wx, yMain, X.mdB - g - 0.75, yMain);
    const px = mx2 + 11, lx = px + 3.6, sx = lx + 4.5;
    let pmLow = yMain;
    if (P.pm) {
      /* Power meter: CT บนสายเมน → PM2230 */
      const pb = yMain - 19, pt = yMain - 14;
      ctH(cx, yMain);   // แบบเดียวกับสัญลักษณ์ CT ใน LEGEND (ผู้ใช้ชี้ 2026-10-29)
      /* ไฟแสดงเฟส (pilot lamp) แยกจากสายเมนหลัง CT → ฟิวส์ → ขึ้นเหนือตู้ → หลอด R S T (ผู้ใช้วาดชี้ 2026-10-29) */
      /* แผ่นภาพรวมตู้สูงทั้งแผ่น — หลอดไฟแสดงเฟสลงมาอยู่เหนือสายเมน ไม่ลอยไปขอบบนตู้ (ผู้ใช้ชี้ 2026-10-29) */
      const fy = yMain + 12, ly = fy + 5, lr = 1.3;
      const ph = M.phase === 3 ? ["R", "S", "T"] : ["L"];
      pen.dot(R, lx, yMain, 0.5);
      pen.line(R, lx, yMain, lx, fy - 2.4); vFuse(lx, fy); pen.line(R, lx, fy + 2.4, lx, ly);
      pen.text(T, lx - 1.6, fy, TS.tag, "FUSE 2A", { align: 2, valign: 2 });
      const lxs = ph.map((_, i) => lx - 5 - i * 5);
      pen.line(R, lx, ly, lxs[0] + lr, ly);
      lxs.forEach((x, i) => {
        pen.circle(S, x, ly, lr);
        const d = lr * 0.707;
        pen.line(S, x - d, ly - d, x + d, ly + d); pen.line(S, x - d, ly + d, x + d, ly - d);
        if (i) pen.line(R, x + lr, ly, lxs[i - 1] - lr, ly);
        pen.text(T, x, ly + lr + 0.8, TS.tag, ph[ph.length - 1 - i], { align: 1, valign: 1 });   // ซ้าย→ขวา R S T
      });
      pen.text(T, lxs[lxs.length - 1] - lr - 1, ly, TS.tag, "PILOT LAMP", { align: 2, valign: 2 });
      pen.text(T, cx, yMain + 2 * CT_R + 2.9, TS.spec, "CT " + P.pmCt, { align: 1, valign: 1 });   // เหนือยอดขด ไม่ทับ (ผู้ใช้ชี้)
      pen.text(T, cx, yMain + 2 * CT_R + 0.8, TS.spec, "CL.0.5, 5VA", { align: 1, valign: 1 });   // class CT วัดพลังงาน (ผู้ใช้ 2026-10-29)
      /* กล่อง PM2230 ใต้ CT — สาย CT ลงตรงเข้าด้านบน (ผู้ใช้วาดชี้ 2026-10-29) */
      /* สัญลักษณ์มิเตอร์ดิจิทัล (ผู้ใช้ส่งรูป 2026-10-29): กล่องมีแถบบน · "DM" ข้างใน · ชื่อรุ่นใต้กล่อง */
      const pw = 6.4, pbB = pt - 6, pmx = cx + pw / 2 + 3, pmy = (pbB + pt) / 2;   // กล่องเยื้องขวา ไม่ทับบัส AC (ผู้ใช้ชี้) · สาย CT ยังลงตรงเข้าด้านบนกล่อง
      /* สาย CT: จากขาซ้ายของ CT ลง แล้วเลี้ยวเข้าข้างซ้ายกล่อง DM (ผู้ใช้วาดชี้ 2026-10-29) — เดิมลงตรงเข้าด้านบน */
      /* สาย CT ออกจากกึ่งกลางระหว่างสองขด ลงตรง แล้วเลี้ยวเข้าข้างซ้ายกล่อง DM (ผู้ใช้วาดชี้ 2026-10-29) */
      /* เส้นประถี่ · เลี้ยวเป็นมุมโค้ง (ผู้ใช้ขอ 2026-10-29) */
      const CS = PG_SLD.ctsig, cr2 = 1.6;
      pen.line(CS, cx, yMain, cx, pmy + cr2);
      pen.arc(CS, cx + cr2, pmy + cr2, cr2, 180, 270);
      pen.line(CS, cx + cr2, pmy, pmx - pw / 2, pmy);
      pen.rect(S, pmx - pw / 2, pbB, pw, pt - pbB);
      pen.line(S, pmx - pw / 2, pt - 1.3, pmx + pw / 2, pt - 1.3);
      pen.text(T, pmx, (pbB + pt - 1.3) / 2, TS.head, "DM", { align: 1, valign: 2 });
      pen.text(T, pmx, pbB - 0.8, TS.spec, "PM2230", { align: 1, valign: 3 });
      /* ไฟเลี้ยง PM2230: แยกจากสายเมนหลัง MCCB/ZCT → ลง → MCB 2P 6A แนวนอน → เข้าข้างขวากล่อง */
      const hx = mx + 5;
      pen.dot(R, px, yMain, 0.5);
      pen.line(R, px, yMain, px, pmy);
      pen.line(R, px, pmy, hx + g + 0.75, pmy);
      hBrk(hx, pmy);
      pen.line(R, hx - g - 0.75, pmy, pmx + pw / 2, pmy);
      pen.text(T, hx, pmy - 1.4, TS.tag, "MCB 2P 6A", { align: 1, valign: 3 });
      pmLow = pbB - 3.6;
    }
    /* กันเสิร์จฝั่ง AC อยู่ฝั่งกริด (หลัง MCCB เมน): สายเมน → อุปกรณ์ป้องกันสำรอง (ถ้ามี) → SPD → บัสดิน
       ป้ายอยู่ซ้ายแกน · เริ่มต่ำกว่า GFR / สายไฟเลี้ยง PM ไม่ให้ทับกัน */
    pen.dot(R, sx, yMain, 0.5);
    const sw = sx - 3.6 - X.ac0 - 1;   // ป้ายอยู่ต่ำกว่า PM/MCB แล้ว ใช้ความกว้างตู้ได้เต็ม
    let sy = yMain;
    const top0 = Math.min(P.pm ? pmLow : yMain, hasGf ? yMain - 12.6 : yMain - 3);
    if (P.spdBk) {
      /* ฟิวส์อยู่ชิดสายเมน (ผู้ใช้ชี้ 2026-10-29: ฟิวส์ลอยต่ำ ป้ายไม่ตรงตัว) — ป้ายข้างฟิวส์อยู่สูงกว่ากล่อง PM/MCB 2P จึงไม่ชน
         SPD ยังอยู่ต่ำกว่าแถว PM เหมือนเดิม (ป้าย SPD ยาว ชน MCB 2P ถ้ายกขึ้น) */
      const fuse = /FUSE/.test(P.spdBk), by = (fuse ? (hasGf ? yMain - 12.6 : yMain - 3) : top0) - 2.4;
      pen.line(R, sx, sy, sx, by + 2.4);
      if (fuse) { vFuse(sx, by); sy = Math.min(by - 2.4, top0 - 4.8); pen.line(R, sx, by - 2.4, sx, sy); }
      else { pen.line(R, sx, by + 2.4, sx, by + g + 0.75); pgSym.breaker(pen, sx, by, "", "", g); sy = by - g - 0.75; }
      /* ป้ายฟิวส์เขียนตั้งขวาตัวฟิวส์ ปลายอยู่ระดับหัวฟิวส์ (ผู้ใช้ชี้ 2026-10-29) — เบรกเกอร์ยังเขียนนอนทางซ้าย */
      if (fuse) pen.text(T, sx + 2.4, by + 2.4, TS.spec, P.spdBk, { rot: 90, align: 2, valign: 2 });
      else pen.text(T, sx - g * 1.26 - 1.0, by, fitH(P.spdBk, TS.spec, sw), P.spdBk, { align: 2, valign: 2 });   // พ้นโค้งเบรกเกอร์ที่โป่งซ้าย (ผู้ใช้ 2026-10-31: โดนทับ)
    } else sy = top0 + 2;
    const spY = sy - 5.5;
    pen.line(R, sx, sy, sx, spY + 2.4);
    pgSym.spd(pen, sx, spY, null, { w: 1.7, h: 4.8 });   // ขนาดเท่าฟิวส์ (ผู้ใช้ 2026-10-29)
    const spH = Math.min.apply(null, P.acSpd.map((t) => fitH(t, TS.spec, sw)));
    P.acSpd.forEach((t, i) => pen.text(T, sx - 3.6, spY + 2.4 - i * 2.2, spH, t, { align: 2, valign: 2 }));
    /* บาร์ N และบาร์ G ที่ก้นตู้ AC (ผู้ใช้วาดชี้ 2026-10-29) — สายดิน SPD ลงผ่านบาร์ G แล้วไปบัสดินหลัก (MET) */
    const acBot = Math.min(spY - 10, pmLow - 2, busLo - 4);
    const barY = acBot + 3, barW = 9, barH = 1.6;   // บาร์อยู่ก้นตู้ (ผู้ใช้ชี้ให้ลงล่างสุด)
    const bar = (L, cx, lab, right) => {
      pen.rect(L, cx - barW / 2, barY - barH / 2, barW, barH);
      for (let k = 0; k < 4; k++) pen.circle(L, cx - barW / 2 + 1.5 + k * 2, barY, 0.45);
      pen.text(T, right ? cx + barW / 2 + 1.0 : cx - barW / 2 - 1.0, barY, TS.spec, lab, { align: right ? 0 : 2, valign: 2 });
    };
    bar(S, sx - 16, "N", false);
    bar(PE, sx - 1, "G", true);   // รูที่ 3 ตรงสาย SPD · รูที่ 4 (sx + 2) ออกไป MET
    pen.rect(BX, X.ac0, acBot, X.ac1 - X.ac0, acTop - acBot);
    if (isMain) zoneHdr(Math.min(hy, acTop + 2.5));

    /* ── ปลายสายเมน: เบรกเกอร์โซลาร์ในตู้ MDB เดิม → ลูกศร TO MDB (EXISTING) ──
       ผู้ใช้ขีดฆ่ากรอบ MDB · มิเตอร์ · สายกริด · MET · หลักดินระบบ (2026-10-29) — ของเดิมไม่วาด ชี้ไปเฉย ๆ */
    const mdBot = yMain - 24;
    /* ไม่วาด MCCB ในตู้ MDB (ผู้ใช้ 2026-10-29) — สายเมนวิ่งตรงถึงลูกศร */
    /* ป้ายสายเมน (ไม่มีขีดตัดสาย — ผู้ใช้ 2026-10-29): สายกำลังเหนือเส้น · สายดินใต้เส้น (ผู้ใช้ส่งตัวอย่าง 2026-10-29) */
    const cl = [String(M.mainCable[0] || "").replace(/\s*\(SOLAR-CELL\)/, "").replace(/\s+/g, " "), M.mainGnd || "G-" + P.earthCu + " Sq.mm. IEC01(THW)"];
    cl[0] = (/kV|\/750V/.test(cl[0]) ? cl[0] : cl[0] + " 0.6/1kV") + (M.mainRoute ? " " + M.mainRoute : "");   // ขนาด/วิธีเดินจาก BOQ เมื่อมี (p3SldFromBoq)
    const ctx = X.ac1 + 4;
    pen.text(T, ctx + 1, yMain + 0.8, TS.spec, cl[0], { valign: 1 });
    pen.text(T, ctx + 1, yMain - 0.8, TS.spec, cl[1], { valign: 3 });
    const clW = Math.max.apply(null, cl.map((t) => pgTextW(t, TS.spec))) * 1.2;
    /* ปลายสายเมน: งานบ้าน → ตู้ไฟบ้านลูกค้า วาดแผ่นแยก (pgCuSheet · ผู้ใช้ 2026-10-31: มุม SLD เล็ก แยกแผ่นสวยกว่า) ชี้ไปแผ่นนั้น */
    const ax = Math.max(X.mdB + g + 3.5, ctx + 1 + clW + 3);
    pen.line(R, X.mdB - g - 0.75, yMain, ax, yMain);
    pen.solid(R, [ax, yMain + 1.1], [ax + 2.6, yMain], [ax, yMain - 1.1]);
    pen.text(LB, ax + 4, yMain + 0.9, TS.head, P.home ? "TO CONSUMER UNIT" : "TO MDB", { valign: 1 });
    pen.text(T, ax + 4, yMain - 1.0, TS.spec, P.home && M.cuRef ? M.cuRef : "(EXISTING)", { valign: 3 });
    const yE = Math.max(yE0, Math.min(blkLow - 4, acBot - 5, mdBot - 14));
    /* สายดิน SPD จบที่รูบาร์ G · สายไป MET ออกจากอีกรูด้านล่าง ไม่ลากทะลุบาร์ (ผู้ใช้ชี้ 2026-10-29) */
    pen.line(PE, sx, spY - 2.4, sx, barY + 0.45);
    /* บาร์ G ไม่ต่อเข้าสายดินหลัก — ลงกระโดดข้ามสาย (ครึ่งวงกลม) ไปต่อบาร์ดินตู้ MDB เดิม (ผู้ใช้ชี้ 2026-10-29) */
    /* ดินฝั่ง AC อยู่ใต้ตู้ AC ใกล้ ๆ ไม่ลงไปถึงระดับหลักดิน PV ล่างสุด (ผู้ใช้ชี้ 2026-10-30: กราวด์ไกลไป) */
    { const gx = sx + 2, yA = acBot - 7, gy = yA - 4.5;
      pen.line(PE, gx, barY - 0.45, gx, gy);
      pgSym.ground(pen, gx, gy);
      pen.text(T, gx - 1.5, yA + 3.4, TS.tag, "CONNECT TO GROUND BAR", { align: 2, valign: 2 });
      pen.text(T, gx - 1.5, yA + 1.9, TS.tag, "OF EXISTING MDB", { align: 2, valign: 2 });
      pen.text(LB, gx - 1.5, yA - 0.1, TS.spec, "THW(G) " + P.earthCu + " Sq.mm.", { align: 2, valign: 2 }); }   // ขนาดสาย หน่วย Sq.mm. (ผู้ใช้ 2026-10-29)
    /* กราวด์ตัวตู้ (ผู้ใช้ชี้ 2026-10-29) — จากรูที่ 1 ของบาร์ G ลงไปต่อกรอบตู้ (เส้นประก้นตู้) */
    pen.line(PE, sx - 4, barY - 0.45, sx - 4, acBot + 1.0);   // หยุดที่ขอบบนวงจุดยึด ไม่ลากทะลุวง (ผู้ใช้ 2026-10-29)
    pen.circle(PE, sx - 4, acBot + 0.5, 0.5);   // จุดยึดโครงตู้ ไม่ต้องเขียนป้าย (ผู้ใช้ 2026-10-29)
    /* PE trunk ซ้าย: โครงแผงทุกแถว + บล็อกทุกเครื่อง → บัสดินหลัก */
    pen.line(PE, X.pe0, peTop, X.pe0, yE);

    /* ── สายสื่อสาร: CT กริด → Smart meter/Logger → อินเวอร์เตอร์ (จำกัดไฟย้อน/มอนิเตอร์) ── */
    /* ไม่วาดกล่อง Smart meter / Data logger และสายสื่อสาร (ผู้ใช้ขีดฆ่า 2026-10-29) */
    /* กลับมาวาดตาม BOQ (ผู้ใช้ 2026-10-30): SmartLogger / Dongle WiFi (M.mon จาก p3SldMon) อ่านค่า CT ที่คล้องเมน MDB เดิม
       ใต้ลูกศร TO MDB: CT บนสายเมน MDB → (Smart Meter) → Logger/Dongle → RS485 ไปอินเวอร์เตอร์ · ออกอินเทอร์เน็ต */
    if (M.mon) {
      /* ผู้ใช้วาดชี้ 2026-10-30: กลุ่มนี้อยู่ใต้ขวาอินเวอร์เตอร์เครื่องล่างสุด (ที่ว่างเหนือตาราง SYSTEM DATA)
         [Smart Meter] ← CT MAIN (คล้องเมน MDB เดิม) · กล่อง Logger/Dongle อยู่ใต้ ลูกศรขึ้นไปมิเตอร์
         ซ้าย: RS485 เลี้ยวขึ้นเข้าก้นอินเวอร์เตอร์ · ขวา: INTERNET */
      const mon = M.mon, ib = taps[taps.length - 1].bot, vx = taps[taps.length - 1].vx, COM = PG_SLD.comm;
      const arrow = (x, y, dx, dy) => pen.solid(S, [x - dy * 0.7, y + dx * 0.7], [x + dx * 1.6, y + dy * 1.6], [x + dy * 0.7, y - dx * 0.7]);
      const ctSpec = (String(mon.meter).match(/CT\s*[\d/]+\s*m?A(\/[\d.]+m?A)?/i) || [""])[0];
      const meterNm = mon.meter ? mon.meter.replace(/\s*\+\s*CT.*$/i, "") : "";
      const dw = Math.max(30, pgTextW(mon.dev, TS.spec) + 4), dh = 6;
      const dx0 = X.iv1 + 8, dTop = Math.min(ib - 2, acBot - 17), dBot = dTop - dh;
      pen.rect(S, dx0, dBot, dw, dh);
      pen.text(T, dx0 + dw / 2, dBot + dh / 2, TS.spec, mon.dev, { align: 1, valign: 2 });
      /* เป้าของสาย CT = มิเตอร์ (ถ้ามี) ไม่งั้นกล่อง logger/dongle เอง */
      let tx = dx0 + dw, ty = dBot + dh / 2;
      if (meterNm) {
        const mw = pgTextW(meterNm, TS.spec) + 4, mh = 5, mx0 = dx0 + 3, mBot = dTop + 5;
        pen.rect(S, mx0, mBot, mw, mh);
        pen.text(T, mx0 + mw / 2, mBot + mh / 2, TS.spec, meterNm, { align: 1, valign: 2 });
        const ax0 = mx0 + mw / 2;
        pen.line(COM, ax0, dTop, ax0, mBot - 1.6);
        arrow(ax0, mBot - 1.6, 0, 1);
        pen.text(T, ax0 + 0.8, (dTop + mBot) / 2, TS.tag, "RS485", { valign: 2 });
        tx = mx0 + mw; ty = mBot + mh / 2;
      }
      /* CT MAIN: สายเมน MDB เดิมสั้น ๆ + CT · สายสัญญาณประถี่เข้าหาเป้า (ลูกศรชี้เข้า) */
      /* ไม่มีมิเตอร์: CT อยู่เหนือกล่อง ลงเข้าด้านบน (ขวากล่องเป็นสาย INTERNET) */
      const cxC = meterNm ? tx + 16 : dx0 + dw * 0.7 + 2 * CT_R, yC = meterNm ? ty + 3.2 : dTop + 6;
      pen.line(R, cxC - 6, yC, cxC + 6, yC);
      ctH(cxC, yC);
      pen.text(T, cxC, yC + 1.8, TS.tag, P.home ? "MAIN CONSUMER UNIT (EXISTING)" : "MAIN MDB (EXISTING)", { align: 1, valign: 1 });
      pen.text(LB, cxC + 7, yC, TS.spec, "CT MAIN" + (ctSpec ? " " + ctSpec.replace(/^CT\s*/i, "") : ""), { valign: 2 });
      const lx = cxC - 2 * CT_R;
      if (meterNm) {
        pen.line(PG_SLD.ctsig, lx, yC - 1.6, lx, ty);
        pen.line(PG_SLD.ctsig, lx, ty, tx + 1.6, ty);
        arrow(tx + 1.6, ty, -1, 0);
      } else {
        pen.line(PG_SLD.ctsig, lx, yC - 1.6, lx, dTop + 1.6);
        arrow(lx, dTop + 1.6, 0, -1);
      }
      /* RS485 → อินเวอร์เตอร์: ออกซ้ายกล่อง แล้วเลี้ยวขึ้นเข้าก้นกล่องอินเวอร์เตอร์ */
      const yc = dBot + dh / 2;
      pen.line(COM, dx0, yc, vx, yc);
      pen.line(COM, vx, yc, vx, ib - 1.6);
      arrow(vx, ib - 1.6, 0, 1);
      pen.text(T, (dx0 + vx) / 2, yc + 0.6, TS.tag, "RS485", { align: 1, valign: 1 });
      /* INTERNET ทางขวา */
      const xr = dx0 + dw;
      pen.line(COM, xr, yc, xr + 8, yc);
      arrow(xr + 8, yc, 1, 0);
      pen.text(LB, xr + 10.4, yc + 0.4, TS.spec, "INTERNET", { valign: 1 });
      pen.text(T, xr + 10.4, yc - 0.6, TS.tag, mon.logger ? "(LAN / 4G)" : "(WiFi)", { valign: 3 });
    }

    /* ── หลักดินฝั่ง PV (ปักแยกจากระบบ) ปลาย PE trunk ซ้าย ── */
    pen.line(PE, X.pe0, yE, X.pe0, yE - 2.3);
    pgSym.ground(pen, X.pe0, yE - 2.3);
    pen.text(T, X.pe0 + 3.2, yE - 3.4, TS.spec, "PV EARTH ROD (SEPARATE)  5/8\" x 2.4m  R <= 5 OHM", { valign: 2 });

  }

  if (sheet.measure) return;
  pen = pen0;
  /* ── ตาราง SYSTEM DATA มุมขวาล่าง (ผู้ใช้ 2026-10-30: เอา EQUIPMENT SCHEDULE · NOTES · LEGEND ออก · สรุปแผงไปอยู่หน้าแผงแต่ละเครื่อง) ── */
  ty = tabTop;
  tabRows().forEach((t) => { ty -= grid(t[0], t[1], t[2] || [RW * 0.4, RW * 0.6], 3.1, TS.cell) + 3; });
  /* ชื่อแผ่นขนาดเดียวกับแผ่นอื่น · มุมซ้ายล่าง บรรทัดเดียวยาว (ผู้ใช้ย้าย) */
  pgSheetTitle(pen, A.x0 + 4, A.y0 + 11, "SINGLE LINE DIAGRAM SOLAR PV SYSTEM" + (isMain ? " (OVERALL)" : isDet ? " (" + pgInvNames(PT.nos) + ")" : ""), PG_TS.title, RX0 - A.x0 - 10, 0, null);
}
/* ชื่อเครื่องแบบย่อช่วง: [1,2,3,5] → "INV1-INV3, INV5" */
function pgInvNames(nos) {
  const out = [];
  nos.forEach((n, i) => {
    if (i && n === nos[i - 1] + 1) { out[out.length - 1][1] = n; return; }
    out.push([n, n]);
  });
  return out.map((r) => (r[0] === r[1] ? "INV" + r[0] : "INV" + r[0] + (r[1] === r[0] + 1 ? ", INV" : "-INV") + r[1])).join(", ");
}
/* กลุ่มเครื่องที่วาดรวมแผ่นย่อยเดียวกันได้: รุ่นเดียวกัน กำลังเท่ากัน และทุก MPPT มีสตริงจำนวนแผงเท่ากันเรียงเหมือนกัน
   (ผู้ใช้ 2026-10-29: "วาดรวมเป็นแผ่นเดียว เมื่อเงื่อนไขสตริงเหมือนกัน") */
function pgSldGroups(M) {
  const by = {}, out = [], idx = {};
  M.mppt.rows.forEach((r) => { if (r.ins.length) (by[r.inv] = by[r.inv] || []).push(r); });
  Object.keys(by).map(Number).sort((a, b) => a - b).forEach((no) => {
    const u = M.units && M.units[no - 1];
    const key = ((u && u.model) || M.inv.model) + "|" + ((M.pro && M.pro.ivKw[no - 1]) || "") + "|"
      + by[no].map((r) => r.mppt + ":" + r.ins.map((x) => x.n).join(",")).join(";");
    if (idx[key] == null) { idx[key] = out.length; out.push({ key, nos: [] }); }
    out[idx[key]].nos.push(no);
  });
  return out;
}
/* ── แผ่นต่อเข้าตู้ไฟบ้านลูกค้า (งานบ้าน · ผู้ใช้ 2026-10-31: รูปตู้บ้านมุม SLD เล็ก แยกเป็นอีกแผ่นสวยกว่า) ──
   ตู้ 3 แบบตาม M.pro.cu (BOQ.homeCuOf — BOQ คิดของตามแบบเดียวกัน · ผู้ใช้ส่งแบบตัวอย่าง 2026-10-31)
   slot = MCB โซลาร์ใส่ช่องว่างในตู้บ้าน (TIE IN POSITION ขวาสุดของบัส)
   far  = ตู้ AC โซลาร์อยู่ไกล/ตู้บ้านเต็ม → ตู้ MDB SOLAR ใหม่ข้างตู้บ้าน ต่อเข้าปลายบัส
   rccb = เมนตู้บ้านเป็น RCCB → ตู้ MDB BOX ใหม่เหนือตู้บ้าน: เมนใหม่ + MCB โซลาร์ แล้วค่อยลง RCCB เดิม
   CT MAIN GRID คล้องสายเข้าจากการไฟฟ้า เหนือจุดที่โซลาร์ต่อเข้าเสมอ (วัดไฟซื้อ/ขายสุทธิ) · ฝั่งโซลาร์สีแดง ฝั่งบ้าน/กริดสีขาว
   pgCuDraw วาดที่ขนาดตัวหนังสือเท่า SLD แล้ว pgCuSheet ขยายให้เต็มแผ่น */
function pgCuDraw(pen, M) {
  const P = M.pro, W = PG_SLD.wire, R = PG_SLD.sol, S = PG_SLD.sym, BX = PG_SLD.box, T = PG_SLD.txt, LB = PG_SLD.lbl;
  const TS = { head: 1.8, spec: 1.4, tag: 1.2 }, g = 2.4, CT_R = 1.4, yMain = 0;
  const hBrk = (x, y) => { pen.circle(S, x - g, y, 0.75); pen.circle(S, x + g, y, 0.75); pen.arc(S, x, y, g * 1.26, 28, 152); };
  const ctV = (x, y) => {
    [CT_R, -CT_R].forEach((dy) => pen.arc(S, x, y + dy, CT_R, -90, 90));
    [2 * CT_R, -2 * CT_R].forEach((dy) => pen.line(S, x - 1.6, y + dy, x, y + dy));
  };
  /* สายเมนจากตู้ AC โซลาร์ — ป้ายสายเดียวกับ SLD */
  const cl = [String(M.mainCable[0] || "").replace(/\s*\(SOLAR-CELL\)/, "").replace(/\s+/g, " "), M.mainGnd || "G-" + P.earthCu + " Sq.mm. IEC01(THW)"];
  cl[0] = (/kV|\/750V/.test(cl[0]) ? cl[0] : cl[0] + " 0.6/1kV") + (M.mainRoute ? " " + M.mainRoute : "");
  const ctx = 0, clW = Math.max.apply(null, cl.map((t) => pgTextW(t, TS.spec))) * 1.2;
  pen.text(T, ctx + 1, yMain + 0.8, TS.spec, cl[0], { valign: 1 });
  pen.text(T, ctx + 1, yMain - 0.8, TS.spec, cl[1], { valign: 3 });
  pen.text(LB, ctx - 1.5, yMain + 0.9, TS.head, "FROM AC COMBINER BOX", { align: 2, valign: 1 });
  pen.text(T, ctx - 1.5, yMain - 1.0, TS.spec, M.sldRef || "(SOLAR CELL)", { align: 2, valign: 3 });
  pen.solid(R, [ctx - 1.2, yMain + 1.1], [ctx + 1.4, yMain], [ctx - 1.2, yMain - 1.1]);
  const cu = P.cu || "slot";
  const sBrk = String(P.mainTxt || "").split(" + ")[0].trim();   // MCB โซลาร์ในตู้บ้าน = ขนาดเดียวกับเมนตู้ AC
  const BS = g + 0.75;
  const vBrk = (x, y) => { pen.circle(S, x, y - g, 0.75); pen.circle(S, x, y + g, 0.75); pen.arc(S, x, y, g * 1.26, 118, 242); };
  const tW = (t, h) => pgTextW(t, h) * 1.2;
  const lab2 = (x, y, a, b, L1) => {   // ป้ายสองบรรทัดขวาเบรกเกอร์แนวตั้ง
    pen.text(L1 || T, x + 1.2, y + 0.3, TS.tag, a, { valign: 1 });
    if (b) pen.text(T, x + 1.2, y - 0.3, TS.tag, b, { valign: 3 });
  };
  const load = (x, yT) => {
    const w = 4.4, h = 2.6;
    pen.rect(S, x - w / 2, yT - h, w, h);
    pen.line(S, x - w / 2, yT - h, x + w / 2, yT);
    pen.solid(R, [x - w / 2, yT - h], [x + w / 2, yT - h], [x + w / 2, yT]);
    pen.text(T, x, yT - h - 0.8, TS.tag, "LOAD", { align: 1, valign: 3 });
  };
  const c0 = ctx + 1 + clW + 2, bp = 7.5;
  const xL = [0, 1, 2].map((k) => c0 + 5 + k * bp), xMn = xL[1];
  const yB = yMain + 21, yBr = yB - 5.5, cuB = yB - 17, cuT = yB + 11;
  const solW = Math.max(tW(sBrk, TS.tag), tW("TIE IN POSITION", TS.tag), tW("SOLAR CELL", TS.tag));
  const xT = cu === "slot" ? xL[2] + bp * 2 : 0;
  const c1 = cu === "slot" ? xT + 1.2 + solW + 2 : xL[2] + bp * 1.3 + 3;
  const xBe = cu === "slot" ? xT : cu === "far" ? c1 + 8 : xL[2] + bp * 1.3;
  /* ตู้บ้าน: บัส + โหลดเดิม */
  pen.rect(BX, c0, cuB, c1 - c0, cuT - cuB);
  pen.text(LB, c0 + 1, cuB - 1.0, TS.head, "CONSUMER UNIT (EXISTING)", { valign: 3 });
  pen.line(W, xL[0], yB, xBe, yB);
  xL.forEach((x) => {
    pen.dot(S, x, yB, 0.4);
    pen.line(W, x, yB, x, yBr + BS); vBrk(x, yBr); pen.line(W, x, yBr - BS, x, yB - 10.5);
    load(x, yB - 10.5);
  });
  xL.forEach((x, i) => lab2(x, yBr, "CB", "F" + (i + 1)));
  [0, 1, 2].forEach((k) => pen.dot(S, xL[2] + bp * 0.8 + k * 1.2, yB - 11.8, 0.3));   // • • • (วงจรเดิมที่เหลือ)
  /* เมนเดิมของตู้บ้าน (แบบ rccb = RCCB เดิม) */
  const yMB = yB + 6;
  pen.dot(S, xMn, yB, 0.4);
  pen.line(W, xMn, yB, xMn, yMB - BS); vBrk(xMn, yMB);
  if (cu === "rccb") lab2(xMn, yMB, "RCCB", "(EXISTING)");
  else lab2(xMn, yMB, "MAIN", P.exMain ? P.exMain + " (EXISTING)" : "(EXISTING)");
  let yTop = cuT, xSol, xR;
  if (cu === "slot") {
    /* ช่องว่างในตู้บ้าน: MCB โซลาร์ขวาสุดของบัส สายโซลาร์ขึ้นจากใต้ตู้ */
    pen.dot(S, xT, yB, 0.4);
    pen.line(W, xT, yB, xT, yBr + BS); vBrk(xT, yBr);
    pen.text(LB, xT + 1.2, yBr + 2.0, TS.tag, "TIE IN POSITION", { valign: 2 });
    pen.text(T, xT + 1.2, yBr + 0.2, TS.tag, sBrk, { valign: 2 });
    pen.text(T, xT + 1.2, yBr - 1.6, TS.tag, "SOLAR CELL", { valign: 2 });
    pen.line(R, xT, yBr - BS, xT, yMain);
    xSol = xT; xR = c1;
  } else if (cu === "far") {
    /* ตู้ MDB SOLAR ใหม่ข้างตู้บ้าน: ต่อเข้าปลายบัส (TIE IN POSITION) ลง MCB โซลาร์ */
    const xs = xBe, yS = yB - 8, b0 = xs - 4.5, b1 = xs + 1.2 + solW + 2;
    pen.dot(S, xs, yB, 0.4);
    pen.text(LB, c1 + 0.5, yB + 0.6, TS.tag, "TIE IN POSITION", { valign: 1 });
    pen.line(R, xs, yB, xs, yS + BS); vBrk(xs, yS);
    lab2(xs, yS, sBrk, "SOLAR CELL");
    pen.rect(BX, b0, yS - 5.5, b1 - b0, 10);
    pen.text(LB, b0 + 0.5, yS - 6.5, TS.spec, "MDB SOLAR (NEW)", { valign: 3 });
    pen.line(R, xs, yS - BS, xs, yMain);
    xSol = xs; xR = b1;
  } else {
    /* เมนตู้บ้านเป็น RCCB: ตู้ MDB BOX ใหม่เหนือตู้บ้าน — เมนใหม่ → จุดต่อ → (RCCB เดิม) · MCB โซลาร์แยกขวาจากจุดต่อ */
    const mdB = cuT + 4.5, yN = mdB + 5, yMN = yN + 6, mdT = yMN + 4.5;
    const xS = Math.max(xMn + 9 + BS + 3, c1 + 5), xh = xS - BS - 2.5;
    pen.line(W, xMn, yMB + BS, xMn, yN);
    pen.dot(S, xMn, yN, 0.4);
    pen.line(R, xMn, yN, xh - BS, yN); hBrk(xh, yN); pen.line(R, xh + BS, yN, xS, yN);
    pen.text(T, xh, yN - 1.2, TS.tag, sBrk, { align: 1, valign: 3 });
    pen.text(T, xh, yN - 2.8, TS.tag, "SOLAR CELL", { align: 1, valign: 3 });
    pen.line(W, xMn, yN, xMn, yMN - BS); vBrk(xMn, yMN);
    lab2(xMn, yMN, "MAIN (NEW)", P.exMain || "");
    const b0 = xMn - 5, b1 = xS + 2;
    pen.rect(BX, b0, mdB, b1 - b0, mdT - mdB);
    pen.text(LB, b0 - 1.0, (mdB + mdT) / 2 + 0.9, TS.spec, "MDB BOX", { align: 2, valign: 2 });
    pen.text(T, b0 - 1.0, (mdB + mdT) / 2 - 0.9, TS.tag, "(NEW)", { align: 2, valign: 2 });
    pen.line(R, xS, yN, xS, yMain);
    yTop = mdT; pen.line(W, xMn, yMN + BS, xMn, mdT);
    xSol = xS; xR = b1;
  }
  if (cu !== "rccb") pen.line(W, xMn, yMB + BS, xMn, yTop);
  /* CT MAIN GRID บนสายเข้าจากการไฟฟ้า (เหนือจุดต่อโซลาร์) → TO การไฟฟ้า */
  /* มิเตอร์การไฟฟ้าเดิมเหนือ CT (แผ่นนี้ที่พอ — ใน SLD เดิมไม่วาด) */
  const yC = yTop + 3.5, rK = 2.6, yK = yC + 5 + rK, yA = yK + rK + 3;
  pen.line(W, xMn, yTop, xMn, yK - rK); pen.line(W, xMn, yK + rK, xMn, yA);
  ctV(xMn, yC);
  pen.circle(S, xMn, yK, rK);
  pen.text(T, xMn, yK, rK * 0.5, "kWh", { align: 1, valign: 2 });
  pen.text(LB, xMn + rK + 1.2, yK + 0.6, TS.tag, "kWh METER", { valign: 1 });
  pen.text(T, xMn + rK + 1.2, yK - 0.6, TS.tag, "(EXISTING)", { valign: 3 });
  const ctSpec = M.mon ? (String(M.mon.meter).match(/CT\s*[\d/]+\s*m?A(\/[\d.]+m?A)?/i) || [""])[0] : "";
  pen.text(LB, xMn + 3.2, yC + 0.6, TS.tag, "CT MAIN GRID", { valign: 1 });
  if (ctSpec) pen.text(T, xMn + 3.2, yC - 0.6, TS.tag, ctSpec, { valign: 3 });
  pen.line(W, xMn - 1.3, yA, xMn + 1.3, yA); pen.line(W, xMn - 1.3, yA, xMn, yA + 2.6); pen.line(W, xMn + 1.3, yA, xMn, yA + 2.6);
  pen.text(LB, xMn, yA + 3.4, TS.head, "TO " + (P.auth || "GRID"), { align: 1, valign: 1 });
  if (M.mon) {
    /* สายสัญญาณ CT ออกขวา ลงไปหาเครื่องวัด/ตัวเก็บข้อมูล (ใน SLD) */
    const CS = PG_SLD.ctsig, xr = xR + 5, yD = yMain - 8, mon = M.mon;
    const dst = mon.meter ? mon.meter.replace(/\s*\+\s*CT.*$/i, "") : mon.dev;
    pen.line(CS, xMn + CT_R + 0.2, yC, xr, yC); pen.line(CS, xr, yC, xr, yD + 1.6);
    pen.solid(S, [xr - 0.7, yD + 1.6], [xr, yD], [xr + 0.7, yD + 1.6]);
    pen.text(T, xr, yD - 0.8, TS.tag, "CT SIGNAL TO " + dst, { align: 1, valign: 3 });
  }
  pen.line(R, ctx + 1.4, yMain, xSol, yMain);
}
function pgCuSheet(doc, sheet, M) {
  pgSldLayers(doc);
  const pen = sheet.pen, A = sheet.area, cu = M.pro.cu || "slot";
  pgSheetTitle(pen, A.x0 + 6, A.y1 - 10, "CONSUMER UNIT CONNECTION DIAGRAM", PG_TS.title, 220, 0, null);
  const notes = [
    cu === "rccb" ? "EXISTING MAIN BREAKER IS RCCB : INSTALL NEW MDB BOX (NEW MAIN + SOLAR MCB) UPSTREAM OF EXISTING RCCB."
      : cu === "far" ? "AC COMBINER BOX FAR FROM / NO SPARE WAY IN CONSUMER UNIT : INSTALL NEW MDB SOLAR BESIDE CONSUMER UNIT, TIE IN AT END OF BUSBAR."
      : "CONSUMER UNIT HAS SPARE WAY : INSTALL SOLAR MCB IN EXISTING CONSUMER UNIT (TIE IN POSITION).",
    "CT MAIN GRID CLAMPS INCOMING LINE FROM " + (M.pro.auth || "GRID") + ", UPSTREAM OF SOLAR TIE IN POINT (NET IMPORT / EXPORT).",
    "VERIFY EXISTING CONSUMER UNIT ON SITE BEFORE INSTALLATION.",
  ];
  const th = PG_TS.cell, nh = th * 1.8, ny0 = A.y0 + 6;
  notes.forEach((t, i) => pen.text(PG_SLD.txt, A.x0 + 8, ny0 + (notes.length - 1 - i) * nh, th, (i + 1) + ". " + t, {}));
  pen.text(PG_SLD.lbl, A.x0 + 6, ny0 + notes.length * nh + 0.6, PG_TS.head, "NOTE", {});
  const bb = pgBBoxPen(); pgCuDraw(bb, M);
  const d = bb.box, bw = d.x1 - d.x0, bh = d.y1 - d.y0, c = [A.x0 + 10, ny0 + notes.length * nh + 12, A.x1 - 10, A.y1 - 22];
  const sc = Math.min(3.2, (c[2] - c[0]) / bw, (c[3] - c[1]) / bh);
  pgCuDraw(pgScalePen(pen, sc, (c[0] + c[2]) / 2 - (d.x0 + bw / 2) * sc, (c[1] + c[3]) / 2 - (d.y0 + bh / 2) * sc), M);
}

function pgSldDraw(doc, sheet, M) {
  if (M.pro && M.mppt && M.mppt.rows.some((r) => r.ins.length) && M.mode === "string") return pgSldPro(doc, sheet, M);
  pgSldLayers(doc);
  const pen = sheet.pen, A = sheet.area;
  const W = PG_SLD.wire, R = PG_SLD.sol, S = PG_SLD.sym, BX = PG_SLD.box, T = PG_SLD.txt, LB = PG_SLD.lbl;

  /* โซนซ้าย = ไดอะแกรม · โซนขวา = ตารางข้อมูล */
  const DX0 = A.x0 + 8, DX1 = A.x0 + 8 + 170;
  const TX0 = A.x1 - 132, TX1 = A.x1 - 4;
  const RISER = DX0 + 96;                 // เส้นเมนที่ไต่จากตู้รวมขึ้นไปหาการไฟฟ้า

  const nUnit = Math.max(1, M.units.length);
  const nPv = Math.max(1, M.panel.count);

  /* ── ชั้นล่างสุด: แผงเซลล์แสงอาทิตย์ ──
     ถ้าแผงเยอะจนวาดทีละแผงแล้วเบียดกัน จะยุบเป็นกลุ่มต่อชุดอินเวอร์เตอร์แทน */
  /* แถวแผง/อินเวอร์เตอร์อยู่ซ้าย · ถ้ามีแบตเตอรี่ต้องหดให้สั้นลงเพื่อเว้นที่วางตู้แบตทางขวา
     ส่วนตู้รวมไฟกว้างคงที่เสมอ ไม่ผูกกับความยาวแถวแผง จะได้มีที่พอวางเบรกเกอร์กับกล่องสื่อสาร */
  const pvSpan = M.batt ? 118 : 156, pvY = 46;
  const acX0 = DX0 + 4, acX1 = DX0 + 162;
  /* ระบบใหญ่ ๆ วาดทีละตัวจะเบียดจนอ่านไม่ออก — ยุบเป็นคอลัมน์ตัวแทน แล้วกำกับ "x จำนวน" ไว้แทน
     ยอดรวมยังตรงเดิมทุกตัว เพราะยุบแค่รูป ไม่ได้ยุบตัวเลข */
  const MAXCOL = 8;
  const grp = Math.ceil(nUnit / MAXCOL);
  const cols = [];
  for (let i = 0; i < nUnit; i += grp) {
    const part = M.units.slice(i, i + grp);
    cols.push({ n: part.length, phase: part[0].phase || 1,
      panels: part.reduce((s, u) => s + (u.panels || 0), 0),
      strings: part.reduce((s, u) => s + (u.strings ? u.strings.length : 0), 0) });
  }
  const nCol = cols.length;
  const drawEach = nPv <= 40 && grp === 1;
  const pvW = drawEach ? Math.min(9, (pvSpan - (nCol - 1) * 4) / nPv - 1.6) : 0;
  const uW = pvSpan / nCol;

  pen.text(LB, DX0 - 6, pvY + 3, 2.6, "PV " + M.panel.wp + " W", { rot: 90 });
  const pvBox = { x0: DX0 - 1.5, y0: pvY - 7.5, x1: DX0 + pvSpan + 1.5, y1: pvY + 8.5 };
  pen.rect(BX, pvBox.x0, pvBox.y0, pvBox.x1 - pvBox.x0, pvBox.y1 - pvBox.y0);

  let pvNo = 0;
  const unitX = [];
  cols.forEach((u, ui) => {
    const cx = DX0 + uW * (ui + 0.5);
    unitX.push(cx);
    const k = Math.max(1, u.panels);
    if (drawEach) {
      const step = Math.min(uW / k, pvW + 2.4);
      for (let i = 0; i < k; i++) {
        const x = cx + (i - (k - 1) / 2) * step;
        pvNo++;
        pgSym.pv(pen, x, pvY + 2.6, pvW, 8, pvNo);
        pen.line(R, x, pvY + 6.6, x, pvY + 11.5);      // ขึ้นไปหาบัสของชุดนี้
      }
      pen.line(R, cx - (k - 1) / 2 * step, pvY + 11.5, cx + (k - 1) / 2 * step, pvY + 11.5);
    } else {
      pgSym.pv(pen, cx, pvY + 2.6, Math.min(16, uW - 4), 8, null);
      pen.text(T, cx, pvY - 5.4, 2.2, k + " x " + M.panel.wp + "W", { align: 1, valign: 1 });
      if (u.strings) pen.text(T, cx, pvY - 9.4, 2.0, u.strings + " STRINGS", { align: 1, valign: 1 });
      pen.line(R, cx, pvY + 6.6, cx, pvY + 11.5);
      pvNo += k;
    }
  });

  /* ── ชั้นถัดมา: อินเวอร์เตอร์ ── */
  const invY = M.mode === "micro" ? pvY + 26 : pvY + 30;
  const ivW = Math.min(22, uW - 6), ivH = 10;
  const ivBox = { y0: invY - ivH / 2 - 4, y1: invY + ivH / 2 + 4 };
  pen.rect(BX, DX0 - 1.5, ivBox.y0, pvSpan + 3, ivBox.y1 - ivBox.y0);
  pen.text(LB, DX0 - 6, ivBox.y0 + 2, 2.4,
    M.mode === "micro" ? "MICRO INVERTER " + (M.inv.model || "") : "INVERTER " + (M.inv.model || ""), { rot: 90 });

  cols.forEach((u, ui) => {
    const cx = unitX[ui];
    const dcBrkY = (pvY + 11.5 + invY - ivH / 2) / 2;     // แผง → อินเวอร์เตอร์
    pgWireY(pen, R, cx, pvY + 11.5, invY - ivH / 2, M.mode === "string" ? [{ y: dcBrkY }] : null);
    if (M.mode === "string") pgSym.breaker(pen, cx, dcBrkY, "", "");
    pgSym.inverter(pen, cx, invY, ivW, ivH);
    if (u.n > 1) pen.text(T, cx + ivW / 2 + 1.4, invY, 2.2, "x" + u.n, { valign: 2 });
  });

  /* ── บัสไฟ AC ที่ออกจากอินเวอร์เตอร์ (แยกตามเฟส) ── */
  const busY0 = invY + ivH / 2 + 8;
  const nPh = M.phase === 3 ? 3 : 1;
  const phName = nPh === 3 ? ["L1", "L2", "L3"] : ["L,N"];
  const busY = [];
  for (let p = 0; p < nPh; p++) busY.push(busY0 + p * 3.4);
  cols.forEach((u, ui) => {
    const cx = unitX[ui];
    /* คอลัมน์ตัวแทนที่ยุบมาหลายตัว กระจายอยู่ครบทุกเฟส จึงแตะบัสทุกเส้น */
    const all = u.n > 1 && nPh > 1;
    const p = all ? nPh - 1 : Math.min(nPh - 1, Math.max(0, (u.phase || 1) - 1));
    pen.line(R, cx, invY + ivH / 2, cx, busY[p]);
    if (all) busY.forEach((y) => pen.dot(R, cx, y, 0.7));
    else pen.dot(R, cx, busY[p], 0.7);
  });
  busY.forEach((y, p) => {
    pen.line(R, DX0, y, DX0 + pvSpan, y);
    pen.text(T, DX0 + pvSpan + 2.5, y, 2.0, "PHASE " + phName[p], { valign: 2 });
  });
  const busTop = busY[busY.length - 1];
  pen.text(T, DX0 + 2, busY0 - 4.2, 2.1, M.acCable);

  /* ── ตู้รวมไฟฝั่งโซลาร์ ── */
  const acY0 = busTop + 16, acY1 = acY0 + 62;
  pen.rect(BX, acX0, acY0, acX1 - acX0, acY1 - acY0);
  pen.text(LB, acX0 + 2, acY1 + 2.5, 3.4, "AC COMBINER SOLAR BOX", { valign: 1 });
  if (M.combinerModel) pen.text(LB, acX0 + 2, acY1 - 5.5, 3.0, M.combinerModel, { valign: 1 });

  /* วงจรย่อยที่เข้าตู้: ชุดแผงแยกตามกลุ่ม + วงจรแบตเตอรี่ (ถ้ามี) */
  const brs = M.branches;
  const bX0 = acX0 + 14;
  const bW = (acX1 - acX0 - 30) / Math.max(1, brs.length);
  const midBus = acY0 + 30;
  brs.forEach((b, i) => {
    const x = bX0 + bW * (i + 0.5);
    const lay = R;
    // วงจรแบตเตอรี่เดินสายมาจากตู้แบตทางขวา ไม่ได้ต่อกับบัสของแผง จึงไม่ลากเส้นตรงนี้
    if (b.solar !== false) pen.line(lay, x, busTop, x, acY0);
    pgWireY(pen, lay, x, acY0, midBus, [{ y: acY0 + 10 }]);
    pgSym.breaker(pen, x, acY0 + 10, b.mcb);
    pen.dot(lay, x, midBus, 0.7);
    pen.text(T, x, acY0 - 3.2, 2.2, b.name, { align: 1, valign: 1 });
  });
  pen.line(R, bX0, midBus, bX0 + bW * brs.length, midBus);

  /* กันเสิร์จลงหลักดิน ทางซ้ายของตู้ */
  const spdX = acX0 + 8;
  pen.line(R, spdX, midBus, spdX, midBus + 11);
  pen.dot(R, spdX, midBus, 0.7);
  pgSym.spd(pen, spdX, midBus + 15, ["SPD", "TYPE II", "In    20kA", "Imax  40kA", "Uc    385V"]);
  pen.line(W, spdX, midBus + 19, spdX, midBus + 23);
  pgSym.ground(pen, spdX, midBus + 23);

  /* เมนของตู้: CT วัดกระแส แล้วขึ้นเบรกเกอร์กันดูดตัวใหญ่ */
  pgWireY(pen, R, RISER, midBus, acY1, [{ y: acY0 + 52 }]);
  pen.dot(R, RISER, midBus, 0.7);
  pgSym.ct(pen, RISER, midBus + 12, M.ctBranch, "");
  pgSym.breaker(pen, RISER, acY0 + 52, M.rccb, M.rccbType);

  /* กล่องสื่อสาร (Gateway) — เส้นประคือสายสัญญาณ ไม่ใช่สายไฟ */
  if (M.gateway) {
    const gx = acX1 - 24, gy = midBus + 12, cxr = acX1 + 6;
    pen.rect(S, gx - 11, gy - 4, 22, 8);
    pen.text(T, gx, gy, 2.4, "GATEWAY", { align: 1, valign: 2 });
    pen.line(PG_SLD.comm, gx, gy - 4, gx, busTop + 4);
    pen.line(PG_SLD.comm, gx, busTop + 4, cxr, busTop + 4);
    pen.line(PG_SLD.comm, gx + 11, gy, cxr, gy);
    pen.line(PG_SLD.comm, cxr, busTop + 4, cxr, acY1 + 34);
    pen.text(T, cxr + 1.5, gy + 14, 2.1, "COMMUNICATION", { rot: 90 });
  }

  /* ── สายจากตู้โซลาร์ขึ้นไปตู้เมนของบ้าน ── */
  pen.line(R, RISER, acY1, RISER, acY1 + 22);
  pen.text(T, RISER + 3, acY1 + 14, 2.1, M.mainCable[0]);
  pen.text(T, RISER + 3, acY1 + 11, 2.1, M.mainCable[1]);

  /* ── ตู้เมน MCCB ── */
  const mcY0 = acY1 + 22, mcY1 = mcY0 + 46;
  pen.rect(BX, RISER - 56, mcY0, 74, mcY1 - mcY0);
  pen.text(LB, RISER - 54, mcY1 + 6.5, 3.4, "MCCB BOX", { valign: 1 });
  pen.text(LB, RISER - 54, mcY1 + 1.5, 3.4, M.mccbNew ? "ADD NEW" : "EXISTING", { valign: 1 });

  const homeX = RISER - 40;
  pgWireY(pen, W, RISER, mcY0, mcY1, [{ y: mcY0 + 32 }]);
  pgSym.breaker(pen, RISER, mcY0 + 32, M.mccb[0], M.mccb[1]);
  pen.text(T, RISER - 5, mcY0 + 4, 2.1, "FROM SOLAR CELL TO CONSUMER UNIT", { rot: 90 });
  const tapY = mcY0 + 14;
  pen.dot(W, RISER, tapY, 0.7);
  pen.line(W, homeX, tapY, RISER, tapY);
  pgWireY(pen, W, homeX, tapY, mcY0 + 2, [{ y: tapY - 9 }]);
  pgSym.breaker(pen, homeX, tapY - 9, M.rcbo[0], M.rcbo[1]);
  pgSym.home(pen, homeX, mcY0 - 3, 4.2);

  /* ── มิเตอร์ของการไฟฟ้า ── */
  const meaY = mcY1 + 30;
  pen.line(W, RISER, mcY1, RISER, meaY - 4);
  pgSym.ct(pen, RISER, mcY1 + 12, M.ctMain, "");
  pen.text(T, RISER + 34, mcY1 + 18, 2.1, "CT MAIN GRID");
  pgSym.utility(pen, RISER, meaY, 4.6, "TO MEA");

  /* ── แบตเตอรี่ (ถ้ามี) ── วางทางขวาของแถวอินเวอร์เตอร์ แล้วโยงเข้าวงจรย่อย BAT. ของตู้รวม */
  if (M.batt) {
    const bx = DX0 + 140, by = invY;
    pen.rect(S, bx - 14, by - 5, 28, 10);
    pen.text(T, bx, by, 2.4, "BAT. " + M.batt.kwh + " kWh.", { align: 1, valign: 2 });
    pen.text(LB, bx, by - 8.5, 2.6, M.batt.brand + " " + M.batt.model, { align: 1, valign: 1 });
    pen.text(LB, bx, by - 12.5, 2.6, "BATTERY " + M.batt.kwh + " kWh.", { align: 1, valign: 1 });
    const bBr = brs.filter((b) => b.solar === false)[0];
    const bxUp = bBr ? bX0 + bW * (brs.indexOf(bBr) + 0.5) : RISER;
    pen.line(R, bx, by + 5, bx, busTop + 6);
    pen.line(R, bx, busTop + 6, bxUp, busTop + 6);
    pen.line(R, bxUp, busTop + 6, bxUp, acY0);
  }

  /* ── หมายเหตุสรุปกำลังติดตั้ง ใต้แถวแผง ── */
  pen.text(T, DX0 + pvSpan / 2, pvY - 15, 3.2, M.summary[0], { align: 1, valign: 1 });
  pen.text(T, DX0 + pvSpan / 2, pvY - 20, 3.2, M.summary[1], { align: 1, valign: 1 });

  /* ── โซนขวา: ตารางข้อมูล ── */
  let ty = A.y1 - 6;
  ty -= pgSldTable(pen, TX0, ty, TX1 - TX0, M.invData, "INVERTER DATA") + 8;
  if (M.battData && M.battData.length) ty -= pgSldTable(pen, TX0, ty, TX1 - TX0, M.battData, "BATTERY DATA") + 8;
  /* สตริงไหนเข้า INV/MPPT ไหน กี่แผง — ลงเท่าที่เหลือเหนือตารางอุปกรณ์ ไม่พอยุบแถวละอินเวอร์เตอร์ */
  if (M.mppt && M.mppt.rows.length && typeof p3MpptTable === "function") {
    const eqH0 = 5.4 + 4.6 * (M.equip.length + 1);
    const fit = Math.floor((ty - (A.y0 + 8 + eqH0 + 18)) / 4.2) - 1;
    if (fit >= 2) {
      const head = "MPPT CONNECTION" + (M.mppt.phys ? "  (" + M.mppt.phys + " INPUT / MPPT)" : "");
      const rows = p3MpptTable(M.mppt, fit).map((r) => [r[0], r[1], r[2] && r[2] !== "-" ? r[2] + " PV" : ""]);
      ty -= pgSldTable(pen, TX0, ty, TX1 - TX0, rows, head, { c1: (TX1 - TX0) * 0.3 }) + 8;
    }
  }

  /* หัวเรื่องแผ่น + ตารางอุปกรณ์ ให้อยู่ครึ่งล่างของโซนขวาเสมอ */
  const eqH = 5.4 + 4.6 * (M.equip.length + 1);
  const eqY = Math.min(ty - 4, A.y0 + 8 + eqH);
  pgSldEquip(pen, TX0, eqY, TX1 - TX0, M.equip);
  pgSheetTitle(pen, (TX0 + TX1) / 2, eqY + 11, "SINGLE LINE DIAGRAM SOLAR CELL SYSTEM", 6.2, TX1 - TX0 - 16, 1, null);
}

Object.assign(window, {
  PG_FONTS, pgFont, pgSetFont, pgDxf, pgSvg, pgDoc, pgCombine, pgPen, pgSheet, pgSheetTitle, pgScaleTxt, PG_SPAN, pgSheetLayers, pgLogoMark, pgWrap,
  pgSldLayers, pgSldDraw, pgSldPro, pgCuSheet, pgSldGroups, pgInvNames, pgSldTable, pgSldEquip, pgSym,
  pgTableLayers, pgGrid, pgSpecBlock, pgCompass, pgModuleDetail, pgModFace, pgTextW, pgPhotoFrame, pgDcString, pgDcSize,
  PG_SHEET, PG_LAY, PG_ACI, PG_SLD, PG_TBL,
});
