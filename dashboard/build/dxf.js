const PG_ACI = {
  red: 1,
  yellow: 2,
  green: 3,
  cyan: 4,
  blue: 5,
  magenta: 6,
  white: 7,
  grey: 8,
  ltgrey: 9,
  orange: 30
};
function pgDxf(opt) {
  opt = opt || {};
  const MM = opt.units !== "m";
  const INSUNITS = MM ? 4 : 6;
  const RASTUNIT = MM ? 1 : 3;
  let H = 0x100;
  const nh = () => (H++).toString(16).toUpperCase();
  let PLOT = null;
  const num = v => {
    const x = Math.round((+v || 0) * 1e6) / 1e6;
    return (Object.is(x, -0) ? 0 : x).toString();
  };
  const esc = s => String(s == null ? "" : s).replace(/[\r\n]+/g, " ").replace(/[^\x20-\x7E]/g, c => "\\U+" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"));
  const hTab = {
    vport: nh(),
    ltype: nh(),
    layer: nh(),
    style: nh(),
    view: nh(),
    ucs: nh(),
    appid: nh(),
    dimstyle: nh(),
    brec: nh()
  };
  const hBrecModel = nh(),
    hBrecPaper = nh();
  const hBlkModel = nh(),
    hBlkEndModel = nh(),
    hBlkPaper = nh(),
    hBlkEndPaper = nh();
  const hNOD = nh(),
    hDictGroup = nh(),
    hDictImg = nh(),
    hDictPS = nh(),
    hPlaceholder = nh(),
    hRastVars = nh();
  const hDictLayout = nh(),
    hLayoutModel = nh(),
    hLayoutPaper = nh();
  const layers = new Map();
  const ltypes = new Map();
  const ents = [];
  const imgDefs = [];
  const ext = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };
  const grow = (x, y) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < ext.minX) ext.minX = x;
    if (x > ext.maxX) ext.maxX = x;
    if (y < ext.minY) ext.minY = y;
    if (y > ext.maxY) ext.maxY = y;
  };
  const W = buf => (c, v) => {
    buf.push(String(c), String(v));
  };
  const head = (buf, type, sub, layer) => {
    const w = W(buf);
    buf.h = nh();
    w(0, type);
    w(5, buf.h);
    w(330, hBrecModel);
    w(100, "AcDbEntity");
    w(8, layer || "0");
    w(100, sub);
    return w;
  };
  const push = buf => {
    ents.push(buf);
    return buf;
  };
  const api = {
    layer(name, color, ltype, lw) {
      if (!layers.has(name)) layers.set(name, {
        name,
        color: color == null ? 7 : color,
        ltype: ltype || "CONTINUOUS",
        lw: lw == null ? -3 : lw
      });
      return name;
    },
    ltype(name, desc, pat) {
      if (!ltypes.has(name)) ltypes.set(name, {
        name,
        desc: desc || "",
        pat: pat || []
      });
      return name;
    },
    line(layer, x1, y1, x2, y2) {
      const b = [];
      const w = head(b, "LINE", "AcDbLine", layer);
      w(10, num(x1));
      w(20, num(y1));
      w(30, 0);
      w(11, num(x2));
      w(21, num(y2));
      w(31, 0);
      grow(x1, y1);
      grow(x2, y2);
      return push(b);
    },
    pline(layer, pts, closed, width) {
      if (!pts || pts.length < 2) return null;
      const b = [];
      const w = head(b, "LWPOLYLINE", "AcDbPolyline", layer);
      w(90, pts.length);
      w(70, closed ? 1 : 0);
      if (width) w(43, num(width));
      pts.forEach(p => {
        w(10, num(p[0]));
        w(20, num(p[1]));
        grow(p[0], p[1]);
      });
      return push(b);
    },
    rect(layer, x, y, w2, h2) {
      return api.pline(layer, [[x, y], [x + w2, y], [x + w2, y + h2], [x, y + h2]], true);
    },
    circle(layer, x, y, r) {
      const b = [];
      const w = head(b, "CIRCLE", "AcDbCircle", layer);
      w(10, num(x));
      w(20, num(y));
      w(30, 0);
      w(40, num(Math.abs(r) || 0.001));
      grow(x - r, y - r);
      grow(x + r, y + r);
      return push(b);
    },
    arc(layer, x, y, r, a1, a2) {
      const b = [];
      const w = head(b, "ARC", "AcDbCircle", layer);
      w(10, num(x));
      w(20, num(y));
      w(30, 0);
      w(40, num(Math.abs(r) || 0.001));
      w(100, "AcDbArc");
      w(50, num(a1));
      w(51, num(a2));
      grow(x - r, y - r);
      grow(x + r, y + r);
      return push(b);
    },
    solid(layer, p1, p2, p3, p4) {
      const q = p4 || p3;
      const b = [];
      const w = head(b, "SOLID", "AcDbTrace", layer);
      [[10, 20, 30, p1], [11, 21, 31, p2], [12, 22, 32, q], [13, 23, 33, p3]].forEach(([a, c, d, p]) => {
        w(a, num(p[0]));
        w(c, num(p[1]));
        w(d, 0);
        grow(p[0], p[1]);
      });
      return push(b);
    },
    text(layer, x, y, h2, s, o) {
      o = o || {};
      const b = [];
      const w = head(b, "TEXT", "AcDbText", layer);
      w(10, num(x));
      w(20, num(y));
      w(30, 0);
      w(40, num(h2));
      w(1, esc(s));
      if (o.rot) w(50, num(o.rot));
      w(41, num(o.wf == null ? 0.85 : o.wf));
      w(7, o.style || "PG-TH");
      const ha = +o.align || 0,
        va = +o.valign || 0;
      if (ha) w(72, ha);
      w(11, num(x));
      w(21, num(y));
      w(31, 0);
      w(100, "AcDbText");
      if (va) w(73, va);
      grow(x, y);
      grow(x + String(s || "").length * h2 * 0.6, y + h2);
      return push(b);
    },
    image(layer, o) {
      const pxW = Math.max(1, Math.round(+o.pxW || 1)),
        pxH = Math.max(1, Math.round(+o.pxH || 1));
      const wM = Math.abs(+o.w || 1),
        hM = Math.abs(+o.h || 1);
      const a = (+o.rot || 0) * Math.PI / 180,
        ca = Math.cos(a),
        sa = Math.sin(a);
      const ux = wM / pxW * ca,
        uy = wM / pxW * sa;
      const vx = hM / pxH * -sa,
        vy = hM / pxH * ca;
      const def = {
        h: nh(),
        hReactor: nh(),
        file: o.file,
        pxW,
        pxH,
        sx: wM / pxW,
        sy: hM / pxH,
        ent: ""
      };
      imgDefs.push(def);
      const b = [];
      const w = head(b, "IMAGE", "AcDbRasterImage", layer);
      def.ent = b.h;
      w(90, 0);
      w(10, num(o.x));
      w(20, num(o.y));
      w(30, 0);
      w(11, num(ux));
      w(21, num(uy));
      w(31, 0);
      w(12, num(vx));
      w(22, num(vy));
      w(32, 0);
      w(13, num(pxW));
      w(23, num(pxH));
      w(340, def.h);
      w(70, 7);
      w(280, 0);
      w(281, 50);
      w(282, 50);
      w(283, Math.max(0, Math.min(100, Math.round(+o.fade || 0))));
      w(360, def.hReactor);
      w(71, 1);
      w(91, 2);
      w(14, "0.0");
      w(24, "0.0");
      w(14, num(pxW));
      w(24, num(pxH));
      [[0, 0], [wM, 0], [wM, hM], [0, hM]].forEach(([px, py]) => grow(o.x + px * ca - py * sa, o.y + px * sa + py * ca));
      return push(b);
    },
    get extents() {
      return ext;
    },
    plot(o) {
      PLOT = {
        x0: +o.x0 || 0,
        y0: +o.y0 || 0,
        w: +o.w || 420,
        h: +o.h || 297,
        k: +o.k || 1
      };
    },
    build() {
      const out = [];
      const w = (c, v) => {
        out.push(String(c), String(v));
      };
      const E = isFinite(ext.minX) ? ext : {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100
      };
      const P = PLOT || {
        x0: E.minX,
        y0: E.minY,
        w: E.maxX - E.minX,
        h: E.maxY - E.minY,
        k: 1
      };
      const PX1 = P.x0 + P.w * P.k,
        PY1 = P.y0 + P.h * P.k;
      const LT = [{
        name: "ByBlock",
        desc: "",
        pat: []
      }, {
        name: "ByLayer",
        desc: "",
        pat: []
      }, {
        name: "CONTINUOUS",
        desc: "Solid line",
        pat: []
      }].concat(Array.from(ltypes.values()));
      const LY = [{
        name: "0",
        color: 7,
        ltype: "CONTINUOUS",
        lw: -3
      }].concat(Array.from(layers.values()));
      const hLT = LT.map(() => nh()),
        hLY = LY.map(() => nh());
      const hStyleStd = nh(),
        hStyleTh = nh(),
        hVport = nh(),
        hAppid = nh(),
        hDimstyle = nh();
      w(0, "SECTION");
      w(2, "HEADER");
      w(9, "$ACADVER");
      w(1, "AC1015");
      w(9, "$DWGCODEPAGE");
      w(3, "ANSI_1252");
      w(9, "$INSUNITS");
      w(70, INSUNITS);
      w(9, "$MEASUREMENT");
      w(70, 1);
      w(9, "$LTSCALE");
      w(40, num(opt.ltscale == null ? 1 : opt.ltscale));
      w(9, "$CLAYER");
      w(8, "0");
      w(9, "$TEXTSTYLE");
      w(7, "PG-TH");
      w(9, "$PDMODE");
      w(70, 34);
      w(9, "$PDSIZE");
      w(40, num(opt.ptsize == null ? 0 : opt.ptsize));
      w(9, "$EXTMIN");
      w(10, num(E.minX));
      w(20, num(E.minY));
      w(30, 0);
      w(9, "$EXTMAX");
      w(10, num(E.maxX));
      w(20, num(E.maxY));
      w(30, 0);
      w(9, "$LIMMIN");
      w(10, num(P.x0));
      w(20, num(P.y0));
      w(9, "$LIMMAX");
      w(10, num(PX1));
      w(20, num(PY1));
      w(9, "$LIMCHECK");
      w(70, 0);
      w(9, "$PSLTSCALE");
      w(70, 1);
      w(9, "$PLINEGEN");
      w(70, 1);
      w(9, "$HANDSEED");
      w(5, (H + 64).toString(16).toUpperCase());
      w(0, "ENDSEC");
      w(0, "SECTION");
      w(2, "CLASSES");
      [["IMAGE", "AcDbRasterImage", 2175, 1], ["IMAGEDEF", "AcDbRasterImageDef", 0, 0], ["IMAGEDEF_REACTOR", "AcDbRasterImageDefReactor", 1, 0], ["RASTERVARIABLES", "AcDbRasterVariables", 0, 0]].forEach(([rec, cpp, flag, isEnt]) => {
        w(0, "CLASS");
        w(1, rec);
        w(2, cpp);
        w(3, "ISM");
        w(90, flag);
        w(280, 0);
        w(281, isEnt);
      });
      w(0, "ENDSEC");
      w(0, "SECTION");
      w(2, "TABLES");
      const tabHead = (name, h, n2) => {
        w(0, "TABLE");
        w(2, name);
        w(5, h);
        w(330, 0);
        w(100, "AcDbSymbolTable");
        w(70, n2);
      };
      const recHead = (type, h, owner, sub, name, flags) => {
        w(0, type);
        w(5, h);
        w(330, owner);
        w(100, "AcDbSymbolTableRecord");
        w(100, sub);
        w(2, name);
        w(70, flags || 0);
      };
      const cx = (P.x0 + PX1) / 2,
        cy = (P.y0 + PY1) / 2;
      const vh = Math.max(1e-6, (PY1 - P.y0) * 1.04),
        vw = Math.max(1e-6, (PX1 - P.x0) * 1.04);
      tabHead("VPORT", hTab.vport, 1);
      recHead("VPORT", hVport, hTab.vport, "AcDbViewportTableRecord", "*ACTIVE", 0);
      w(10, 0);
      w(20, 0);
      w(11, "1.0");
      w(21, "1.0");
      w(12, num(cx));
      w(22, num(cy));
      w(13, 0);
      w(23, 0);
      w(14, "10.0");
      w(24, "10.0");
      w(15, "10.0");
      w(25, "10.0");
      w(16, 0);
      w(26, 0);
      w(36, "1.0");
      w(17, 0);
      w(27, 0);
      w(37, 0);
      w(40, num(vh));
      w(41, num(vw / vh));
      w(42, "50.0");
      w(43, "0.0");
      w(44, "0.0");
      w(50, "0.0");
      w(51, "0.0");
      w(71, 0);
      w(72, 100);
      w(73, 1);
      w(74, 3);
      w(75, 0);
      w(76, 0);
      w(77, 0);
      w(78, 0);
      w(281, 0);
      w(65, 1);
      w(110, "0.0");
      w(120, "0.0");
      w(130, "0.0");
      w(111, "1.0");
      w(121, "0.0");
      w(131, "0.0");
      w(112, "0.0");
      w(122, "1.0");
      w(132, "0.0");
      w(79, 0);
      w(146, "0.0");
      w(0, "ENDTAB");
      tabHead("LTYPE", hTab.ltype, LT.length);
      LT.forEach((t, i) => {
        recHead("LTYPE", hLT[i], hTab.ltype, "AcDbLinetypeTableRecord", t.name, 0);
        w(3, t.desc);
        w(72, 65);
        w(73, t.pat.length);
        w(40, num(t.pat.reduce((a, v) => a + Math.abs(v), 0)));
        t.pat.forEach(v => {
          w(49, num(v));
          w(74, 0);
        });
      });
      w(0, "ENDTAB");
      tabHead("LAYER", hTab.layer, LY.length);
      LY.forEach((l, i) => {
        recHead("LAYER", hLY[i], hTab.layer, "AcDbLayerTableRecord", l.name, 0);
        w(62, l.color);
        w(6, l.ltype);
        w(370, l.lw);
        w(390, hPlaceholder);
      });
      w(0, "ENDTAB");
      tabHead("STYLE", hTab.style, 2);
      recHead("STYLE", hStyleStd, hTab.style, "AcDbTextStyleTableRecord", "STANDARD", 0);
      w(40, "0.0");
      w(41, "1.0");
      w(50, "0.0");
      w(71, 0);
      w(42, "2.5");
      w(3, "txt");
      w(4, "");
      recHead("STYLE", hStyleTh, hTab.style, "AcDbTextStyleTableRecord", "PG-TH", 0);
      w(40, "0.0");
      w(41, "0.85");
      w(50, "0.0");
      w(71, 0);
      w(42, "2.5");
      w(3, "tahoma.ttf");
      w(4, "");
      w(0, "ENDTAB");
      tabHead("VIEW", hTab.view, 0);
      w(0, "ENDTAB");
      tabHead("UCS", hTab.ucs, 0);
      w(0, "ENDTAB");
      tabHead("APPID", hTab.appid, 1);
      recHead("APPID", hAppid, hTab.appid, "AcDbRegAppTableRecord", "ACAD", 0);
      w(0, "ENDTAB");
      tabHead("DIMSTYLE", hTab.dimstyle, 1);
      w(100, "AcDbDimStyleTable");
      w(71, 0);
      w(0, "DIMSTYLE");
      w(105, hDimstyle);
      w(330, hTab.dimstyle);
      w(100, "AcDbSymbolTableRecord");
      w(100, "AcDbDimStyleTableRecord");
      w(2, "STANDARD");
      w(70, 0);
      w(340, hStyleTh);
      w(0, "ENDTAB");
      tabHead("BLOCK_RECORD", hTab.brec, 2);
      recHead("BLOCK_RECORD", hBrecModel, hTab.brec, "AcDbBlockTableRecord", "*Model_Space", 0);
      w(340, hLayoutModel);
      recHead("BLOCK_RECORD", hBrecPaper, hTab.brec, "AcDbBlockTableRecord", "*Paper_Space", 0);
      w(340, hLayoutPaper);
      w(0, "ENDTAB");
      w(0, "ENDSEC");
      w(0, "SECTION");
      w(2, "BLOCKS");
      const blk = (hB, hE, brec, name) => {
        w(0, "BLOCK");
        w(5, hB);
        w(330, brec);
        w(100, "AcDbEntity");
        w(8, "0");
        w(100, "AcDbBlockBegin");
        w(2, name);
        w(70, 0);
        w(10, 0);
        w(20, 0);
        w(30, 0);
        w(3, name);
        w(1, "");
        w(0, "ENDBLK");
        w(5, hE);
        w(330, brec);
        w(100, "AcDbEntity");
        w(8, "0");
        w(100, "AcDbBlockEnd");
      };
      blk(hBlkModel, hBlkEndModel, hBrecModel, "*Model_Space");
      blk(hBlkPaper, hBlkEndPaper, hBrecPaper, "*Paper_Space");
      w(0, "ENDSEC");
      w(0, "SECTION");
      w(2, "ENTITIES");
      ents.forEach(b => {
        for (let i = 0; i < b.length; i++) out.push(b[i]);
      });
      w(0, "ENDSEC");
      w(0, "SECTION");
      w(2, "OBJECTS");
      w(0, "DICTIONARY");
      w(5, hNOD);
      w(330, 0);
      w(100, "AcDbDictionary");
      w(281, 1);
      w(3, "ACAD_GROUP");
      w(350, hDictGroup);
      w(3, "ACAD_IMAGE_DICT");
      w(350, hDictImg);
      w(3, "ACAD_IMAGE_VARS");
      w(350, hRastVars);
      w(3, "ACAD_LAYOUT");
      w(350, hDictLayout);
      w(3, "ACAD_PLOTSTYLENAME");
      w(350, hDictPS);
      w(0, "DICTIONARY");
      w(5, hDictGroup);
      w(330, hNOD);
      w(100, "AcDbDictionary");
      w(281, 1);
      w(0, "DICTIONARY");
      w(5, hDictImg);
      w(330, hNOD);
      w(100, "AcDbDictionary");
      w(281, 1);
      imgDefs.forEach((d, i) => {
        w(3, "PG-IMG-" + (i + 1));
        w(350, d.h);
      });
      w(0, "ACDBDICTIONARYWDFLT");
      w(5, hDictPS);
      w(330, hNOD);
      w(100, "AcDbDictionary");
      w(281, 1);
      w(3, "Normal");
      w(350, hPlaceholder);
      w(100, "AcDbDictionaryWithDefault");
      w(340, hPlaceholder);
      w(0, "ACDBPLACEHOLDER");
      w(5, hPlaceholder);
      w(330, hDictPS);
      w(0, "DICTIONARY");
      w(5, hDictLayout);
      w(330, hNOD);
      w(100, "AcDbDictionary");
      w(281, 1);
      w(3, "Model");
      w(350, hLayoutModel);
      w(3, "Layout1");
      w(350, hLayoutPaper);
      const std = P.k === 1;
      const layout = (h, owner, name, order, brec) => {
        const isModel = order === 0;
        w(0, "LAYOUT");
        w(5, h);
        w(330, owner);
        w(100, "AcDbPlotSettings");
        w(1, "PG-A3-LANDSCAPE");
        w(2, "DWG To PDF.pc3");
        w(4, "ISO_full_bleed_A3_(420.00_x_297.00_MM)");
        w(6, "");
        w(40, "0.0");
        w(41, "0.0");
        w(42, "0.0");
        w(43, "0.0");
        w(44, num(P.w));
        w(45, num(P.h));
        w(46, "0.0");
        w(47, "0.0");
        w(48, num(P.x0));
        w(49, num(P.y0));
        w(140, num(PX1));
        w(141, num(PY1));
        w(142, "1.0");
        w(143, num(P.k));
        w(70, 512 + 128 + 32 + 4 + (std ? 16 : 0));
        w(72, 1);
        w(73, 0);
        w(74, isModel ? 4 : 5);
        w(7, "");
        w(75, std ? 16 : 0);
        w(147, num(1 / P.k));
        w(148, "0.0");
        w(149, "0.0");
        w(100, "AcDbLayout");
        w(1, name);
        w(70, 1);
        w(71, order);
        const L = isModel ? {
          x0: P.x0,
          y0: P.y0,
          x1: PX1,
          y1: PY1
        } : {
          x0: 0,
          y0: 0,
          x1: P.w,
          y1: P.h
        };
        w(10, "0.0");
        w(20, "0.0");
        w(11, num(L.x1 - L.x0));
        w(21, num(L.y1 - L.y0));
        w(12, "0.0");
        w(22, "0.0");
        w(32, "0.0");
        w(14, num(L.x0));
        w(24, num(L.y0));
        w(34, "0.0");
        w(15, num(L.x1));
        w(25, num(L.y1));
        w(35, "0.0");
        w(146, "0.0");
        w(13, "0.0");
        w(23, "0.0");
        w(33, "0.0");
        w(16, "1.0");
        w(26, "0.0");
        w(36, "0.0");
        w(17, "0.0");
        w(27, "1.0");
        w(37, "0.0");
        w(76, 0);
        w(330, brec);
      };
      layout(hLayoutModel, hDictLayout, "Model", 0, hBrecModel);
      layout(hLayoutPaper, hDictLayout, "Layout1", 1, hBrecPaper);
      w(0, "RASTERVARIABLES");
      w(5, hRastVars);
      w(330, hNOD);
      w(100, "AcDbRasterVariables");
      w(90, 0);
      w(70, 0);
      w(71, 1);
      w(72, RASTUNIT);
      imgDefs.forEach(d => {
        w(0, "IMAGEDEF");
        w(5, d.h);
        w(330, hDictImg);
        w(102, "{ACAD_REACTORS");
        w(330, d.hReactor);
        w(102, "}");
        w(100, "AcDbRasterImageDef");
        w(90, 0);
        w(1, esc(d.file));
        w(10, num(d.pxW));
        w(20, num(d.pxH));
        w(11, num(d.sx));
        w(21, num(d.sy));
        w(280, 1);
        w(281, RASTUNIT);
        w(0, "IMAGEDEF_REACTOR");
        w(5, d.hReactor);
        w(330, d.ent);
        w(100, "AcDbRasterImageDefReactor");
        w(90, 2);
        w(330, d.ent);
      });
      w(0, "ENDSEC");
      w(0, "EOF");
      return out.join("\r\n") + "\r\n";
    }
  };
  return api;
}
const PG_SHEET = {
  W: 420,
  H: 297,
  TB: 62,
  IN: {
    x0: 26,
    y0: 16,
    x1: 404,
    y1: 281
  }
};
const PG_LAY = {
  frame: "PG-FRAME",
  tb: "PG-TITLEBLOCK",
  txt: "PG-TB-TEXT",
  thin: "PG-TB-THIN",
  logo: "PG-LOGO"
};
const PG_ACI_HEX = {
  1: "#e02020",
  2: "#c8a800",
  3: "#1f9d3a",
  4: "#0f9aa8",
  5: "#2255cc",
  6: "#a83fb0",
  7: "#111111",
  8: "#7a7a7a",
  9: "#a8a8a8",
  30: "#d97706",
  140: "#2b7bbd",
  200: "#8b5cf6"
};
function pgSvg(opt) {
  opt = opt || {};
  const layers = new Map(),
    ltypes = new Map(),
    body = [];
  let PLOT = null;
  const ext = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };
  const grow = (x, y) => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < ext.minX) ext.minX = x;
    if (x > ext.maxX) ext.maxX = x;
    if (y < ext.minY) ext.minY = y;
    if (y > ext.maxY) ext.maxY = y;
  };
  const n = v => (Math.round((+v || 0) * 1000) / 1000).toString();
  const enc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const plain = s => String(s == null ? "" : s).replace(/%%d/gi, "°").replace(/%%c/gi, "Ø").replace(/%%p/gi, "±").replace(/[\r\n]+/g, " ");
  let Y0 = 0;
  const X = v => +v || 0,
    Y = v => Y0 - (+v || 0);
  const style = name => {
    const L = layers.get(name) || {
      color: 7,
      lw: -3,
      ltype: "CONTINUOUS"
    };
    const k = PLOT && PLOT.k || 1;
    const lw = Math.max(0.06, (L.lw > 0 ? L.lw : 18) / 100) * k;
    const pat = ltypes.get(L.ltype);
    const dash = pat && pat.pat && pat.pat.length ? ' stroke-dasharray="' + pat.pat.map(d => n(Math.max(0.2, Math.abs(d) * k))).join(" ") + '"' : "";
    return {
      c: PG_ACI_HEX[L.color] || "#111111",
      w: lw,
      dash
    };
  };
  const stroke = (layer, extra) => {
    const s = style(layer);
    return ' fill="none" stroke="' + s.c + '" stroke-width="' + n(s.w) + '"' + s.dash + (extra || "");
  };
  const api = {
    layer(name, color, ltype, lw) {
      if (!layers.has(name)) layers.set(name, {
        name,
        color: color == null ? 7 : color,
        ltype: ltype || "CONTINUOUS",
        lw: lw == null ? -3 : lw
      });
      return name;
    },
    ltype(name, desc, pat) {
      if (!ltypes.has(name)) ltypes.set(name, {
        name,
        desc: desc || "",
        pat: pat || []
      });
      return name;
    },
    line(layer, x1, y1, x2, y2) {
      grow(x1, y1);
      grow(x2, y2);
      body.push(["line", layer, F => '<line x1="' + n(F.X(x1)) + '" y1="' + n(F.Y(y1)) + '" x2="' + n(F.X(x2)) + '" y2="' + n(F.Y(y2)) + '"' + stroke(layer) + "/>"]);
    },
    pline(layer, pts, closed) {
      if (!pts || pts.length < 2) return null;
      pts.forEach(p => grow(p[0], p[1]));
      body.push(["pline", layer, F => "<" + (closed ? "polygon" : "polyline") + ' points="' + pts.map(p => n(F.X(p[0])) + "," + n(F.Y(p[1]))).join(" ") + '"' + stroke(layer) + "/>"]);
    },
    rect(layer, x, y, w2, h2) {
      return api.pline(layer, [[x, y], [x + w2, y], [x + w2, y + h2], [x, y + h2]], true);
    },
    circle(layer, x, y, r) {
      grow(x - r, y - r);
      grow(x + r, y + r);
      body.push(["circle", layer, F => '<circle cx="' + n(F.X(x)) + '" cy="' + n(F.Y(y)) + '" r="' + n(Math.abs(r) || 0.001) + '"' + stroke(layer) + "/>"]);
    },
    arc(layer, x, y, r, a1, a2) {
      r = Math.abs(r) || 0.001;
      let sw = ((+a2 || 0) - (+a1 || 0)) % 360;
      if (sw <= 0) sw += 360;
      const p = a => [x + r * Math.cos(a * Math.PI / 180), y + r * Math.sin(a * Math.PI / 180)];
      const s = p(a1),
        e = p(a1 + sw);
      grow(x - r, y - r);
      grow(x + r, y + r);
      body.push(["arc", layer, F => '<path d="M ' + n(F.X(s[0])) + " " + n(F.Y(s[1])) + " A " + n(r) + " " + n(r) + " 0 " + (sw > 180 ? 1 : 0) + " 0 " + n(F.X(e[0])) + " " + n(F.Y(e[1])) + '"' + stroke(layer) + "/>"]);
    },
    solid(layer, p1, p2, p3, p4) {
      const ring = p4 ? [p1, p2, p3, p4] : [p1, p2, p3];
      ring.forEach(p => grow(p[0], p[1]));
      const s = style(layer);
      body.push(["solid", layer, F => '<polygon points="' + ring.map(p => n(F.X(p[0])) + "," + n(F.Y(p[1]))).join(" ") + '" fill="' + s.c + '" stroke="none"/>']);
    },
    text(layer, x, y, h2, s, o) {
      o = o || {};
      const ha = +o.align || 0,
        va = +o.valign || 0;
      const anchor = ha === 1 ? "middle" : ha === 2 ? "end" : "start";
      const dy = va === 2 ? h2 * 0.36 : va === 3 ? h2 * 0.88 : va === 1 ? 0 : 0;
      const wf = o.wf == null ? 0.85 : o.wf;
      const col = PG_ACI_HEX[(layers.get(layer) || {}).color] || "#111111";
      const txt = enc(plain(s));
      grow(x, y);
      grow(x + String(s || "").length * h2 * 0.6, y + h2);
      body.push(["text", layer, F => {
        const tx = F.X(x),
          ty = F.Y(y) - dy;
        const tr = [];
        if (o.rot) tr.push("rotate(" + n(-o.rot) + " " + n(tx) + " " + n(ty) + ")");
        tr.push("translate(" + n(tx) + " " + n(ty) + ")");
        if (wf !== 1) tr.push("scale(" + n(wf) + " 1)");
        return '<text transform="' + tr.join(" ") + '" font-size="' + n(h2) + '" fill="' + col + '" text-anchor="' + anchor + '" font-family="Tahoma, sans-serif" style="white-space:pre">' + txt + "</text>";
      }]);
    },
    image(layer, o) {
      const wM = Math.abs(+o.w || 1),
        hM = Math.abs(+o.h || 1);
      const a = (+o.rot || 0) * Math.PI / 180,
        ca = Math.cos(a),
        sa = Math.sin(a);
      [[0, 0], [wM, 0], [wM, hM], [0, hM]].forEach(([px, py]) => grow(o.x + px * ca - py * sa, o.y + px * sa + py * ca));
      if (!o.href) return null;
      const op = 1 - Math.max(0, Math.min(100, +o.fade || 0)) / 100;
      body.push(["image", layer, F => '<g transform="translate(' + n(F.X(o.x)) + " " + n(F.Y(o.y)) + ") rotate(" + n(-(+o.rot || 0)) + ')">' + '<image x="0" y="' + n(-hM) + '" width="' + n(wM) + '" height="' + n(hM) + '" opacity="' + n(op) + '" preserveAspectRatio="none" href="' + enc(o.href) + '"/></g>']);
    },
    get extents() {
      return ext;
    },
    plot(o) {
      PLOT = {
        x0: +o.x0 || 0,
        y0: +o.y0 || 0,
        w: +o.w || 420,
        h: +o.h || 297,
        k: +o.k || 1
      };
    },
    build() {
      const E = isFinite(ext.minX) ? ext : {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100
      };
      const P = PLOT || {
        x0: E.minX,
        y0: E.minY,
        w: E.maxX - E.minX,
        h: E.maxY - E.minY,
        k: 1
      };
      const w = Math.max(1e-6, P.w * P.k),
        h = Math.max(1e-6, P.h * P.k);
      Y0 = P.y0 + h;
      const F = {
        X: v => X(v) - P.x0,
        Y
      };
      const parts = body.map(b => b[2](F));
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n(w) + " " + n(h) + '" width="' + n(w) + '" height="' + n(h) + '" style="width:100%;height:auto;display:block"' + ' preserveAspectRatio="xMidYMid meet">' + '<rect x="0" y="0" width="' + n(w) + '" height="' + n(h) + '" fill="#ffffff"/>' + '<g stroke-linecap="round" stroke-linejoin="round">' + parts.join("") + "</g></svg>";
    }
  };
  return api;
}
function pgDoc(opt, svg) {
  return svg ? pgSvg(opt) : pgDxf(opt);
}
function pgPen(doc, k, ox, oy) {
  k = k || 1;
  ox = ox || 0;
  oy = oy || 0;
  const X = v => ox + v * k,
    Y = v => oy + v * k,
    S = v => v * k;
  const P = p => [X(p[0]), Y(p[1])];
  return {
    k,
    X,
    Y,
    S,
    line: (l, x1, y1, x2, y2) => doc.line(l, X(x1), Y(y1), X(x2), Y(y2)),
    rect: (l, x, y, w, h) => doc.rect(l, X(x), Y(y), S(w), S(h)),
    pline: (l, pts, c) => doc.pline(l, pts.map(P), c),
    circle: (l, x, y, r) => doc.circle(l, X(x), Y(y), S(r)),
    arc: (l, x, y, r, a1, a2) => doc.arc(l, X(x), Y(y), S(r), a1, a2),
    solid: (l, a, b, c, d) => doc.solid(l, P(a), P(b), P(c), d && P(d)),
    text: (l, x, y, h, s, o) => doc.text(l, X(x), Y(y), S(h), s, o),
    dot: (l, x, y, r) => {
      const q = r * 0.72;
      doc.solid(l, P([x - r, y]), P([x, y - q]), P([x + r, y]), P([x, y + q]));
      doc.solid(l, P([x - q, y - q]), P([x + q, y - q]), P([x + q, y + q]), P([x - q, y + q]));
    }
  };
}
function pgWrap(s, per) {
  s = String(s == null ? "" : s).trim();
  if (!s) return [];
  const words = s.split(/\s+/),
    out = [];
  let cur = "";
  words.forEach(raw => {
    let wd = raw;
    while (wd.length > per) {
      if (cur) {
        out.push(cur);
        cur = "";
      }
      out.push(wd.slice(0, per));
      wd = wd.slice(per);
    }
    if (!cur) cur = wd;else if ((cur + " " + wd).length <= per) cur += " " + wd;else {
      out.push(cur);
      cur = wd;
    }
  });
  if (cur) out.push(cur);
  return out;
}
function pgSheetLayers(doc) {
  doc.ltype("PG-DASH", "Dashed __ __ __", [6, -3]);
  doc.ltype("PG-DOT", "Dotted . . . .", [0.4, -2.4]);
  doc.layer(PG_LAY.frame, PG_ACI.white, "CONTINUOUS", 50);
  doc.layer(PG_LAY.tb, PG_ACI.white, "CONTINUOUS", 25);
  doc.layer(PG_LAY.txt, PG_ACI.white, "CONTINUOUS", 18);
  doc.layer(PG_LAY.thin, PG_ACI.ltgrey, "CONTINUOUS", 9);
  doc.layer(PG_LAY.logo, PG_ACI.green, "CONTINUOUS", 35);
}
function pgLogoMark(pen, x, y, s) {
  const L = PG_LAY.logo,
    r = s * 0.22;
  const x0 = x,
    y0 = y,
    x1 = x + s,
    y1 = y + s;
  pen.line(L, x0 + r, y0, x1 - r, y0);
  pen.arc(L, x1 - r, y0 + r, r, -90, 0);
  pen.line(L, x1, y0 + r, x1, y1 - r);
  pen.arc(L, x1 - r, y1 - r, r, 0, 90);
  pen.line(L, x1 - r, y1, x0 + r, y1);
  pen.arc(L, x0 + r, y1 - r, r, 90, 180);
  pen.line(L, x0, y1 - r, x0, y0 + r);
  pen.arc(L, x0 + r, y0 + r, r, 180, 270);
  const cx = x + s / 2,
    m = s * 0.17;
  pen.pline(L, [[cx - m, y + s * 0.20], [cx - m, y + s * 0.58], [cx - m * 0.1, y + s * 0.80], [cx - m * 0.1, y + s * 0.42]], true);
  pen.pline(L, [[cx + m, y + s * 0.80], [cx + m, y + s * 0.42], [cx + m * 0.1, y + s * 0.20], [cx + m * 0.1, y + s * 0.58]], true);
}
function pgSheet(doc, o) {
  o = o || {};
  const I = o.info || {};
  pgSheetLayers(doc);
  const K = o.k == null ? 1 : o.k;
  const pen = pgPen(doc, K, o.ox || 0, o.oy || 0);
  const S = PG_SHEET,
    IN = S.IN,
    F = PG_LAY;
  doc.plot({
    x0: o.ox || 0,
    y0: o.oy || 0,
    w: S.W,
    h: S.H,
    k: K
  });
  pen.rect(F.thin, 5, 5, S.W - 10, S.H - 10);
  pen.rect(F.frame, 20, 10, 390, 277);
  pen.rect(F.tb, IN.x0, IN.y0, IN.x1 - IN.x0, IN.y1 - IN.y0);
  const COLS = 19,
    ROWS = 14,
    LTRS = "ABCDEFGHIJKLMN";
  const cw = (IN.x1 - IN.x0) / COLS,
    ch = (IN.y1 - IN.y0) / ROWS;
  for (let i = 0; i <= COLS; i++) {
    const x = IN.x0 + i * cw;
    if (i > 0 && i < COLS) {
      pen.line(F.tb, x, 10, x, IN.y0);
      pen.line(F.tb, x, IN.y1, x, 287);
    }
    if (i < COLS) {
      pen.text(F.txt, x + cw / 2, 12.2, 2.4, String(i + 1), {
        align: 1,
        valign: 1
      });
      pen.text(F.txt, x + cw / 2, 282.6, 2.4, String(i + 1), {
        align: 1,
        valign: 1
      });
    }
  }
  for (let j = 0; j <= ROWS; j++) {
    const y = IN.y0 + j * ch;
    if (j > 0 && j < ROWS) {
      pen.line(F.tb, 20, y, IN.x0, y);
      pen.line(F.tb, IN.x1, y, 410, y);
    }
    if (j < ROWS) {
      const c = LTRS[j];
      pen.text(F.txt, 23, y + ch / 2, 2.6, c, {
        align: 1,
        valign: 2
      });
      pen.text(F.txt, 407, y + ch / 2, 2.6, c, {
        align: 1,
        valign: 2
      });
    }
  }
  const tx0 = IN.x1 - S.TB,
    tx1 = IN.x1,
    TW = S.TB;
  const ROW = [["site", 49], ["loc", 11], ["proj", 11], ["own", 16], ["logo", 34], ["stat", 26], ["se", 17], ["me", 17], ["ee", 17], ["rev", 27], ["sign", 18], ["pno", 11.5], ["scale", 10.5]];
  const Y = {};
  let cy = IN.y1;
  ROW.forEach(r => {
    Y[r[0]] = {
      top: cy,
      bot: cy - r[1],
      h: r[1]
    };
    cy -= r[1];
  });
  pen.line(F.tb, tx0, IN.y0, tx0, IN.y1);
  ROW.forEach(r => {
    if (Y[r[0]].bot > IN.y0 + 0.01) pen.line(F.tb, tx0, Y[r[0]].bot, tx1, Y[r[0]].bot);
  });
  const lab = (y, s) => pen.text(F.txt, tx0 + 1.6, y - 2.7, 1.7, s);
  const mid = (y, h, s, va) => pen.text(F.txt, (tx0 + tx1) / 2, y, h, s, {
    align: 1,
    valign: va == null ? 1 : va
  });
  lab(Y.site.top, "SITE LOCATION MAP :");
  pgWrap(I.address || "", 34).slice(0, 8).forEach((ln, i) => mid(Y.site.top - 12 - i * 4.4, 2.3, ln));
  lab(Y.loc.top, "LOCATION :");
  mid(Y.loc.bot + 2.6, 2.6, I.location || "-");
  lab(Y.proj.top, "PROJECT :");
  mid(Y.proj.bot + 2.6, 2.9, I.project || "-");
  lab(Y.own.top, "OWNER :");
  pgWrap(I.owner || "-", 30).slice(0, 2).forEach((ln, i) => mid(Y.own.bot + 6.2 - i * 4.6, 3.0, ln));
  pgLogoMark(pen, tx0 + 5, Y.logo.top - 15.5, 12);
  pen.text(F.logo, tx0 + 20, Y.logo.top - 7.5, 4.4, "PHITHAN", {
    valign: 2
  });
  pen.text(F.logo, tx0 + 20, Y.logo.top - 13.5, 4.4, "GREEN", {
    valign: 2
  });
  ["653/8 Wangthonglang, Wangthonglang,", "Bangkok 10310", "TEL : 065-628-5566", "http://www.phithangreen.com", "E-mail : sales@phithangreen.com"].forEach((ln, i) => mid(Y.logo.top - 21.5 - i * 2.5, 1.7, ln));
  [["FOR PERLIMINARY", "prelim"], ["FOR PERMISSTION", "permit"], ["FOR CONSTRUCTION", "construct"], ["FOR AS-BUILT", "asbuilt"]].forEach((s, i) => {
    const y = Y.stat.top - 5.5 - i * 5.6;
    pen.circle(F.tb, tx0 + 10, y, 1.7);
    if ((I.status || "construct") === s[1]) pen.dot(F.tb, tx0 + 10, y, 1.25);
    pen.text(F.txt, tx0 + 15, y, 2.5, s[0], {
      valign: 2
    });
  });
  [["se", "STRUCTURAL ENGINEERS :"], ["me", "MECHANICAL ENGINEERS :"], ["ee", "ELECTRICAL ENGINEERS :"]].forEach(r => {
    lab(Y[r[0]].top, r[1]);
    for (let i = 0; i < 4; i++) {
      const y = Y[r[0]].bot + 2.2 + i * 3.3;
      pen.line(F.thin, tx0 + 2, y, tx1 - 2, y);
    }
  });
  const RC = [9, 24, 15, 14],
    RH = ["REV.", "DESCRIPTION", "APPROVED", "DATE"];
  const rHead = Y.rev.top - 4.5;
  let rx = tx0;
  pen.line(F.tb, tx0, rHead, tx1, rHead);
  RC.forEach((w2, i) => {
    pen.text(F.txt, rx + w2 / 2, rHead + 1.3, 2.2, RH[i], {
      align: 1,
      valign: 1
    });
    rx += w2;
    if (i < RC.length - 1) pen.line(F.tb, rx, Y.rev.top, rx, Y.rev.bot);
  });
  for (let i = 1; i <= 5; i++) pen.line(F.tb, tx0, rHead - i * 4.5, tx1, rHead - i * 4.5);
  pen.line(F.tb, tx0 + 18, Y.sign.top, tx0 + 18, Y.sign.bot);
  [["DRAWN", I.drawn], ["DESIGN", I.design], ["CHECKED", I.checked], ["APPROVED", I.approved]].forEach((r, i) => {
    const yb = Y.sign.top - (i + 1) * 4.5;
    if (i < 3) pen.line(F.tb, tx0, yb, tx1, yb);
    pen.text(F.txt, tx0 + 1.6, yb + 1.5, 2.1, r[0]);
    if (r[1]) pen.text(F.txt, tx0 + 20, yb + 1.5, 2.3, r[1]);
  });
  const pHead = Y.pno.top - 4.5;
  pen.line(F.tb, tx0, pHead, tx1, pHead);
  pen.line(F.tb, tx0 + TW / 2, Y.pno.top, tx0 + TW / 2, Y.pno.bot);
  pen.text(F.txt, tx0 + TW / 4, pHead + 1.3, 2.2, "PROJECT NO", {
    align: 1,
    valign: 1
  });
  pen.text(F.txt, tx0 + TW * 3 / 4, pHead + 1.3, 2.2, "DRAWING NUMBER", {
    align: 1,
    valign: 1
  });
  pen.text(F.txt, tx0 + TW / 4, Y.pno.bot + 2.2, 2.8, I.projectNo || "", {
    align: 1,
    valign: 1
  });
  pen.text(F.txt, tx0 + TW * 3 / 4, Y.pno.bot + 2.2, 2.8, I.drawingNo || "", {
    align: 1,
    valign: 1
  });
  const sHead = Y.scale.top - 4.5,
    sw = TW / 4;
  pen.line(F.tb, tx0, sHead, tx1, sHead);
  [["SCALE", I.scale], ["DATE", I.date], ["SHEET NO", I.sheetNo], ["REV.", I.rev]].forEach((r, i) => {
    const x = tx0 + i * sw;
    if (i) pen.line(F.tb, x, Y.scale.top, x, IN.y0);
    pen.text(F.txt, x + sw / 2, sHead + 1.3, 2.2, r[0], {
      align: 1,
      valign: 1
    });
    pen.text(F.txt, x + sw / 2, IN.y0 + 1.8, 2.3, r[1] || "", {
      align: 1,
      valign: 1
    });
  });
  pen.text(F.txt, 20, 6.4, 2.2, "GENERAL NOTE:  THIS DRAWING IS THE PROPERTY OF PHITHAN GREEN CO., LTD. AND SHALL NOT BE USED OR REPRODUCED WITHOUT PERMISSION." + "  DO NOT SCALE THIS DRAWING. USE FIGURED DIMENSION ONLY.", {
    valign: 1
  });
  return {
    pen,
    area: {
      x0: IN.x0,
      y0: IN.y0,
      x1: tx0,
      y1: IN.y1
    },
    siteBox: {
      x0: tx0 + 1.5,
      y0: Y.site.bot + 1.5,
      x1: tx1 - 1.5,
      y1: Y.site.top - 4.5
    }
  };
}
function pgSheetTitle(pen, x, y, s, h, maxW, align) {
  h = h || 6.5;
  const n = String(s).length || 1;
  if (maxW) h = Math.min(h, maxW / (n * 0.62));
  const a = align == null ? 1 : align;
  pen.text(PG_LAY.txt, x, y, h, s, {
    align: a,
    valign: 1,
    wf: 1.0
  });
  const w = n * h * 0.62;
  const x0 = a === 0 ? x : a === 2 ? x - w : x - w / 2;
  pen.line(PG_LAY.txt, x0, y - h * 0.3, x0 + w, y - h * 0.3);
}
const PG_TBL = {
  line: "PG-TB-TABLE",
  txt: "PG-TB-TXT",
  head: "PG-TB-HEAD"
};
function pgTableLayers(doc) {
  doc.layer(PG_TBL.line, PG_ACI.white, "CONTINUOUS", 18);
  doc.layer(PG_TBL.txt, PG_ACI.white, "CONTINUOUS", 13);
  doc.layer(PG_TBL.head, PG_ACI.ltgrey, "CONTINUOUS", 25);
  doc.layer("PG-DETAIL", PG_ACI.red, "CONTINUOUS", 30);
  doc.layer("PG-NORTH", PG_ACI.grey, "CONTINUOUS", 25);
  doc.layer("PG-PHOTO", PG_ACI.grey, "CONTINUOUS", 9);
}
function pgGrid(pen, x, y, w, cols, rows, o) {
  o = o || {};
  const L = PG_TBL.line,
    T = PG_TBL.txt;
  const rh = o.rh || 5.0,
    th = o.th || 2.3;
  const sum = cols.reduce((s, c) => s + c, 0);
  const CW = cols.map(c => c / sum * w);
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
      CW.forEach((cw, i) => {
        if (i) pen.line(L, cx, cy, cx, cy - h);
        const v = r[i] == null ? "" : String(r[i]);
        const a = AL[i] == null ? 1 : AL[i];
        pen.text(T, a === 0 ? cx + 2 : a === 2 ? cx + cw - 2 : cx + cw / 2, cy - h + (h - th) / 2, th, v, {
          align: a,
          valign: 1
        });
        cx += cw;
      });
    }
    cy -= h;
  });
  return y - cy;
}
function pgSpecBlock(pen, x, y, w, title, pairs, o) {
  o = o || {};
  const L = PG_TBL.line,
    T = PG_TBL.txt;
  const rh = o.rh || 5.0,
    th = o.th || 2.4,
    half = w * (o.split == null ? 0.55 : o.split);
  let cy = y;
  pen.solid(PG_TBL.head, [x, cy - rh], [x + w, cy - rh], [x + w, cy], [x, cy]);
  pen.rect(L, x, cy - rh, w, rh);
  pen.text(T, x + 2, cy - rh + (rh - th) / 2, th, title);
  cy -= rh;
  pairs.forEach(p => {
    pen.rect(L, x, cy - rh, w, rh);
    const cell = (cx, cw, key, val) => {
      if (key == null) return;
      pen.text(T, cx + 2, cy - rh + (rh - th) / 2, th, String(key));
      pen.text(T, cx + cw * 0.34, cy - rh + (rh - th) / 2, th, ":  " + String(val == null ? "" : val));
    };
    const wide = p[2] == null;
    cell(x, wide ? w : half, p[0], p[1]);
    if (!wide) {
      pen.line(L, x + half, cy, x + half, cy - rh);
      cell(x + half, w - half, p[2], p[3]);
    }
    cy -= rh;
  });
  return y - cy;
}
function pgCompass(pen, x, y, r, layer) {
  const L = layer || "PG-NORTH";
  pen.circle(L, x, y, r);
  pen.line(L, x - r * 1.25, y, x + r * 1.25, y);
  pen.line(L, x, y - r * 1.25, x, y + r * 1.25);
  const q = r * 0.26;
  pen.solid(L, [x, y + r * 1.15], [x - q, y - r * 0.55], [x, y - r * 0.3], [x + q, y - r * 0.55]);
  pen.text(L, x, y + r * 1.9, 2.4, "NORTH", {
    align: 1,
    valign: 1
  });
  pen.text(L, x, y + r * 1.42, 2.0, "0" + "%%d", {
    align: 1,
    valign: 1
  });
  pen.text(L, x, y - r * 1.95, 2.0, "180" + "%%d", {
    align: 1,
    valign: 1
  });
  pen.text(L, x - r * 1.35, y, 2.0, "90" + "%%d", {
    align: 2,
    valign: 2
  });
  pen.text(L, x + r * 1.35, y, 2.0, "90" + "%%d", {
    align: 0,
    valign: 2
  });
}
function pgModuleDetail(pen, x, y, h, o) {
  o = o || {};
  const L = PG_TBL.line,
    T = PG_TBL.txt,
    R = "PG-DETAIL";
  const wMm = +o.wMm || 1134,
    hMm = +o.hMm || 2382,
    tMm = +o.tMm || 30;
  const w = h * (wMm / hMm);
  const tw = Math.max(1.2, h * (tMm / hMm) * 6);
  const gap = 5;
  pen.rect(R, x, y, w, h);
  const nc = 6;
  for (let i = 1; i < nc; i++) pen.line(L, x + w * i / nc, y + 1, x + w * i / nc, y + h - 1);
  for (let i = 1; i < 12; i++) pen.line(L, x + 1, y + h * i / 12, x + w - 1, y + h * i / 12);
  pen.text(T, x + w / 2, y - 4.4, 2.2, "FRONT", {
    align: 1,
    valign: 1
  });
  pen.line(L, x + w / 2 - 6, y - 5.2, x + w / 2 + 6, y - 5.2);
  const sx = x + w + gap;
  pen.rect(R, sx, y, tw, h);
  pen.text(T, sx + tw / 2, y - 4.4, 2.2, "SIDE", {
    align: 1,
    valign: 1
  });
  pen.line(L, sx + tw / 2 - 5, y - 5.2, sx + tw / 2 + 5, y - 5.2);
  const bx = sx + tw + gap;
  pen.rect(R, bx, y, w, h);
  const jy = y + h * 0.62,
    jx = bx + w / 2;
  pen.dot(L, jx, jy, 0.7);
  pen.text(T, jx, jy - 3.4, 1.9, "Junction Box", {
    align: 1,
    valign: 1
  });
  pen.line(L, jx, jy, jx - w * 0.3, jy + h * 0.055);
  pen.line(L, jx, jy, jx + w * 0.3, jy + h * 0.055);
  pen.text(T, bx + 2, jy + h * 0.075, 1.9, "+ Anode");
  pen.text(T, bx + w - 2, jy + h * 0.075, 1.9, "Cathode -", {
    align: 2
  });
  pen.text(T, bx + w / 2, y - 4.4, 2.2, "BACK SIDE", {
    align: 1,
    valign: 1
  });
  pen.line(L, bx + w / 2 - 8, y - 5.2, bx + w / 2 + 8, y - 5.2);
  const dim = (x0, y0, x1, y1, txt, vert) => {
    pen.line(L, x0, y0, x1, y1);
    pen.dot(L, x0, y0, 0.5);
    pen.dot(L, x1, y1, 0.5);
    pen.text(T, vert ? x0 - 1.6 : (x0 + x1) / 2, vert ? (y0 + y1) / 2 : y1 + 0.8, 2.2, txt, vert ? {
      align: 2,
      valign: 2
    } : {
      align: 1,
      valign: 1
    });
  };
  dim(x, y + h + 4, x + w, y + h + 4, String(wMm));
  dim(sx, y + h + 4, sx + tw, y + h + 4, String(tMm));
  dim(x - 3.5, y, x - 3.5, y + h, String(hMm), true);
  if (o.caption) {
    pen.text(T, x, y - 11, 2.6, o.caption);
    pen.line(L, x, y - 12.6, x + (bx + w - x), y - 12.6);
  }
  return bx + w - x;
}
function pgPhotoFrame(doc, pen, x, y, w, h, o) {
  o = o || {};
  const L = PG_TBL.line,
    T = PG_TBL.txt;
  const cap = String(o.caption == null ? "" : o.caption).trim();
  const capH = cap ? 6.4 : 0;
  const ih = Math.max(1, h - capH),
    iy = y + capH;
  if (o.file) {
    const ar = (+o.pxH || 3) / (+o.pxW || 4);
    let iw2 = w,
      ih2 = w * ar;
    if (ih2 > ih) {
      ih2 = ih;
      iw2 = ih / ar;
    }
    doc.image("PG-PHOTO", {
      file: o.file,
      href: o.href,
      pxW: o.pxW,
      pxH: o.pxH,
      x: pen.X(x + (w - iw2) / 2),
      y: pen.Y(iy + (ih - ih2) / 2),
      w: pen.S(iw2),
      h: pen.S(ih2),
      rot: 0,
      fade: o.fade == null ? 0 : o.fade
    });
  }
  pen.rect(L, x, iy, w, ih);
  if (cap) {
    pen.solid(PG_TBL.head, [x, y], [x + w, y], [x + w, y + capH], [x, y + capH]);
    pen.rect(L, x, y, w, capH);
    const lines = pgWrap(cap, Math.max(8, Math.floor(w / 1.6)));
    pen.text(T, x + w / 2, y + (capH - 2.4) / 2, 2.4, lines[0] + (lines.length > 1 ? "…" : ""), {
      align: 1,
      valign: 1
    });
  }
}
function pgDcSize(w, nPanel, maxH) {
  const nAll = Math.max(1, +nPanel || 1);
  const n = Math.min(4, nAll),
    gap = 4;
  const pw = (w - (n - 1) * gap) / n;
  const ph = Math.min(pw * 1.9, maxH || 1e9);
  return {
    nAll,
    n,
    skip: nAll > n,
    gap,
    pw,
    ph,
    h: 16 + ph + 6
  };
}
function pgDcString(pen, x, y, w, o) {
  o = o || {};
  const L = PG_TBL.line,
    T = PG_TBL.txt,
    R = "PG-DETAIL";
  const g = pgDcSize(w, o.n, o.maxH);
  const nAll = g.nAll,
    n = g.n,
    skip = g.skip,
    gap = g.gap,
    pw = g.pw,
    ph = g.ph;
  const yb = y + 16;
  for (let i = 0; i < n; i++) {
    const px = x + i * (pw + gap);
    pen.rect(R, px, yb, pw, ph);
    for (let c = 1; c < 3; c++) pen.line(L, px + pw * c / 3, yb + 1, px + pw * c / 3, yb + ph - 1);
    for (let c = 1; c < 6; c++) pen.line(L, px + 1, yb + ph * c / 6, px + pw - 1, yb + ph * c / 6);
    pen.text(T, px + pw / 2, yb + ph + 2.2, 2.2, "PV " + (i + 1 === n && skip ? nAll : i + 1), {
      align: 1,
      valign: 1
    });
    const nx = px + pw * 0.28,
      cx2 = px + pw * 0.72;
    pen.text(T, nx - 1.2, yb - 4.6, 2.0, "-", {
      align: 2,
      valign: 1
    });
    pen.text(T, cx2 + 1.2, yb - 4.6, 2.0, "+", {
      align: 0,
      valign: 1
    });
    pen.line(L, nx, yb, nx, yb - 6);
    pen.dot(L, nx, yb - 6, 0.6);
    pen.line(L, cx2, yb, cx2, yb - 6);
    pen.dot(L, cx2, yb - 6, 0.6);
    if (i < n - 1) {
      const nn = px + pw + gap + pw * 0.28;
      pen.line(R, cx2, yb - 6, cx2, yb - 9.5);
      pen.line(R, cx2, yb - 9.5, nn, yb - 9.5);
      pen.line(R, nn, yb - 9.5, nn, yb - 6);
    }
  }
  const lx = x + pw * 0.28,
    rx = x + (n - 1) * (pw + gap) + pw * 0.72;
  const mc = (mx, lab) => {
    pen.line(R, mx, yb - 6, mx, y + 1.5);
    pen.circle(L, mx, y + 1.5, 1.4);
    pen.text(T, mx, y - 3.4, 2.0, lab, {
      align: 1,
      valign: 1
    });
  };
  mc(lx, "MC4 -");
  mc(rx, "MC4 +");
  if (skip) pen.text(T, x + w / 2, yb + ph / 2, 2.6, "( x " + nAll + " PANEL )", {
    align: 1,
    valign: 1
  });
  return {
    h: yb + ph + 6 - y,
    top: yb + ph + 6,
    lx,
    rx,
    my: y + 1.5
  };
}
const PG_SLD = {
  wire: "SLD-WIRE",
  sol: "SLD-SOLAR",
  sym: "SLD-SYMBOL",
  box: "SLD-ENCLOSURE",
  txt: "SLD-TEXT",
  lbl: "SLD-LABEL",
  comm: "SLD-COMM",
  tab: "SLD-TABLE"
};
function pgSldLayers(doc) {
  doc.ltype("PG-DASH", "Dashed __ __ __", [6, -3]);
  doc.ltype("PG-DOT", "Dotted . . . .", [0.4, -2.4]);
  doc.layer(PG_SLD.wire, PG_ACI.white, "CONTINUOUS", 35);
  doc.layer(PG_SLD.sol, PG_ACI.red, "CONTINUOUS", 35);
  doc.layer(PG_SLD.sym, PG_ACI.white, "CONTINUOUS", 25);
  doc.layer(PG_SLD.box, PG_ACI.red, "PG-DASH", 20);
  doc.layer(PG_SLD.txt, PG_ACI.white, "CONTINUOUS", 18);
  doc.layer(PG_SLD.lbl, PG_ACI.cyan, "CONTINUOUS", 25);
  doc.layer(PG_SLD.comm, PG_ACI.white, "PG-DASH", 15);
  doc.layer(PG_SLD.tab, PG_ACI.white, "CONTINUOUS", 20);
}
function pgWireY(pen, layer, x, yA, yB, brk) {
  const y0 = Math.min(yA, yB),
    y1 = Math.max(yA, yB);
  const gaps = (brk || []).map(b => {
    const h = b.half == null ? 4.15 : b.half;
    return [b.y - h, b.y + h];
  }).filter(g => g[1] > y0 && g[0] < y1).sort((a, b) => a[0] - b[0]);
  let cur = y0;
  gaps.forEach(g => {
    if (g[0] > cur) pen.line(layer, x, cur, x, g[0]);
    cur = Math.max(cur, g[1]);
  });
  if (cur < y1) pen.line(layer, x, cur, x, y1);
}
const pgSym = {
  breaker(pen, x, y, label, sub) {
    const L = PG_SLD.sym,
      r = 0.75,
      g = 3.4;
    pen.circle(L, x, y - g, r);
    pen.circle(L, x, y + g, r);
    pen.arc(L, x, y, g * 1.26, 118, 242);
    if (label) pen.text(PG_SLD.txt, x + 3.0, y + 1.2, 2.1, label, {
      valign: 2
    });
    if (sub) pen.text(PG_SLD.txt, x + 3.0, y - 2.0, 2.1, sub, {
      valign: 2
    });
  },
  ct(pen, x, y, label, sub) {
    const L = PG_SLD.sym,
      R = 1.9,
      lead = 4.4;
    [1.7, -1.7].forEach(dy => {
      pen.arc(L, x - 0.9, y + dy, R, -78, 78);
      pen.line(L, x + 1.0, y + dy + R * 0.98, x + lead, y + dy + R * 0.98);
    });
    if (label) pen.text(PG_SLD.txt, x + lead + 0.8, y + 1.4, 2.1, label, {
      valign: 2
    });
    if (sub) pen.text(PG_SLD.txt, x + lead + 0.8, y - 1.6, 2.1, sub, {
      valign: 2
    });
  },
  ground(pen, x, y) {
    const L = PG_SLD.sym;
    pen.line(L, x - 3.0, y, x + 3.0, y);
    pen.line(L, x - 1.9, y - 1.3, x + 1.9, y - 1.3);
    pen.line(L, x - 0.8, y - 2.6, x + 0.8, y - 2.6);
  },
  spd(pen, x, y, lines) {
    const L = PG_SLD.sym,
      w = 3.8,
      h = 8,
      ov = 1.5,
      t = 1.4;
    pen.rect(L, x - w / 2, y - h / 2, w, h);
    const x0 = x - w / 2 - ov,
      y0 = y - h / 2 + t;
    const x1 = x + w / 2 + ov,
      y1 = y + h / 2 - t;
    pen.line(L, x0, y0, x1, y1);
    pen.line(L, x0, y0, x0, y0 - t);
    pen.line(L, x1, y1, x1, y1 + t);
    (lines || []).forEach((s, i) => pen.text(PG_SLD.txt, x + 3.6, y + 3.2 - i * 2.4, 2.0, s, {
      valign: 2
    }));
  },
  inverter(pen, x, y, w, h) {
    const L = PG_SLD.sym;
    pen.rect(L, x - w / 2, y - h / 2, w, h);
    pen.line(L, x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    const a = Math.min(w * 0.11, h * 0.13),
      sx = x - w * 0.28,
      sy = y + h * 0.2;
    pen.arc(L, sx - a, sy, a, 0, 180);
    pen.arc(L, sx + a, sy, a, 180, 360);
    const dx = x + w * 0.26,
      dy = y - h * 0.2,
      dw = Math.min(w * 0.16, h * 0.2);
    pen.line(L, dx - dw, dy + dw * 0.42, dx + dw, dy + dw * 0.42);
    pen.line(L, dx - dw, dy - dw * 0.42, dx - dw * 0.25, dy - dw * 0.42);
    pen.line(L, dx + dw * 0.25, dy - dw * 0.42, dx + dw, dy - dw * 0.42);
  },
  pv(pen, x, y, w, h, no) {
    const L = PG_SLD.sym;
    pen.rect(L, x - w / 2, y - h / 2, w, h);
    const vy = y + h / 2,
      tip = y + h * 0.5 - h * 0.62;
    pen.line(L, x - w / 2, vy, x, tip);
    pen.line(L, x + w / 2, vy, x, tip);
    if (no != null) {
      const r = Math.min(w * 0.42, h * 0.3);
      pen.circle(L, x, y - h / 2, r);
      pen.text(PG_SLD.txt, x, y - h / 2, r * 1.15, String(no), {
        align: 1,
        valign: 2
      });
    }
  },
  home(pen, x, y, s) {
    const L = PG_SLD.sym;
    const x0 = x - s,
      x1 = x + s,
      y0 = y - s * 0.6,
      y1 = y + s * 0.6;
    pen.solid(PG_SLD.sol, [x0, y0], [x1, y0], [x1, y1]);
    pen.rect(L, x0, y0, s * 2, s * 1.2);
    pen.line(L, x0, y0, x1, y1);
    pen.text(PG_SLD.txt, x, y0 - 2.6, 2.1, "LOAD", {
      align: 1,
      valign: 1
    });
  },
  utility(pen, x, y, s, label) {
    const L = PG_SLD.sym;
    pen.pline(L, [[x, y + s], [x - s * 0.82, y - s * 0.6], [x + s * 0.82, y - s * 0.6]], true);
    if (label) pen.text(PG_SLD.lbl, x, y + s + 2.4, 3.6, label, {
      align: 1,
      valign: 1
    });
  }
};
function pgSldTable(pen, x, y, w, rows, head, o) {
  o = o || {};
  const L = PG_SLD.tab,
    T = PG_SLD.txt;
  const rh = o.rh || 4.2,
    c1 = o.c1 == null ? w * 0.62 : o.c1;
  let cy = y;
  pen.rect(L, x, cy - rh, w, rh);
  pen.text(T, x + 1.4, cy - rh + 1.2, 2.2, head);
  cy -= rh;
  rows.forEach(r => {
    pen.rect(L, x, cy - rh, w, rh);
    if (r[0] === "#") {
      pen.text(T, x + 1.4, cy - rh + 1.2, 2.1, r[1]);
    } else {
      pen.line(L, x + c1, cy, x + c1, cy - rh);
      pen.text(T, x + 1.4, cy - rh + 1.2, 2.0, r[0]);
      pen.text(T, x + c1 + 1.4, cy - rh + 1.2, 2.0, String(r[1] == null ? "" : r[1]));
      if (r[2]) pen.text(T, x + w - 1.4, cy - rh + 1.2, 2.0, "[" + r[2] + "]", {
        align: 2
      });
    }
    cy -= rh;
  });
  return y - cy;
}
function pgSldEquip(pen, x, y, w, list) {
  const L = PG_SLD.tab,
    T = PG_SLD.txt,
    rh = 4.6;
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
      pen.text(T, cx + cwv / 2, cy - h + 1.3, bold ? 2.2 : 2.1, String(cells[i] == null ? "" : cells[i]), {
        align: 1,
        valign: 1
      });
      cx += cwv;
    });
    cy -= h;
  };
  row(HD, rh, true);
  list.forEach((r, i) => row([i + 1, r.brand, r.model, r.desc, r.no], rh, false));
  return y - cy;
}
function pgSldDraw(doc, sheet, M) {
  pgSldLayers(doc);
  const pen = sheet.pen,
    A = sheet.area;
  const W = PG_SLD.wire,
    R = PG_SLD.sol,
    S = PG_SLD.sym,
    BX = PG_SLD.box,
    T = PG_SLD.txt,
    LB = PG_SLD.lbl;
  const DX0 = A.x0 + 8,
    DX1 = A.x0 + 8 + 170;
  const TX0 = A.x1 - 132,
    TX1 = A.x1 - 4;
  const RISER = DX0 + 96;
  const nUnit = Math.max(1, M.units.length);
  const nPv = Math.max(1, M.panel.count);
  const pvSpan = M.batt ? 118 : 156,
    pvY = 46;
  const acX0 = DX0 + 4,
    acX1 = DX0 + 162;
  const MAXCOL = 8;
  const grp = Math.ceil(nUnit / MAXCOL);
  const cols = [];
  for (let i = 0; i < nUnit; i += grp) {
    const part = M.units.slice(i, i + grp);
    cols.push({
      n: part.length,
      phase: part[0].phase || 1,
      panels: part.reduce((s, u) => s + (u.panels || 0), 0)
    });
  }
  const nCol = cols.length;
  const drawEach = nPv <= 40 && grp === 1;
  const pvW = drawEach ? Math.min(9, (pvSpan - (nCol - 1) * 4) / nPv - 1.6) : 0;
  const uW = pvSpan / nCol;
  pen.text(LB, DX0 - 6, pvY + 3, 2.6, "PV " + M.panel.wp + " W", {
    rot: 90
  });
  const pvBox = {
    x0: DX0 - 1.5,
    y0: pvY - 7.5,
    x1: DX0 + pvSpan + 1.5,
    y1: pvY + 8.5
  };
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
        pen.line(R, x, pvY + 6.6, x, pvY + 11.5);
      }
      pen.line(R, cx - (k - 1) / 2 * step, pvY + 11.5, cx + (k - 1) / 2 * step, pvY + 11.5);
    } else {
      pgSym.pv(pen, cx, pvY + 2.6, Math.min(16, uW - 4), 8, null);
      pen.text(T, cx, pvY - 5.4, 2.2, k + " x " + M.panel.wp + "W", {
        align: 1,
        valign: 1
      });
      pen.line(R, cx, pvY + 6.6, cx, pvY + 11.5);
      pvNo += k;
    }
  });
  const invY = M.mode === "micro" ? pvY + 26 : pvY + 30;
  const ivW = Math.min(22, uW - 6),
    ivH = 10;
  const ivBox = {
    y0: invY - ivH / 2 - 4,
    y1: invY + ivH / 2 + 4
  };
  pen.rect(BX, DX0 - 1.5, ivBox.y0, pvSpan + 3, ivBox.y1 - ivBox.y0);
  pen.text(LB, DX0 - 6, ivBox.y0 + 2, 2.4, M.mode === "micro" ? "MICRO INVERTER " + (M.inv.model || "") : "INVERTER " + (M.inv.model || ""), {
    rot: 90
  });
  cols.forEach((u, ui) => {
    const cx = unitX[ui];
    const dcBrkY = (pvY + 11.5 + invY - ivH / 2) / 2;
    pgWireY(pen, R, cx, pvY + 11.5, invY - ivH / 2, M.mode === "string" ? [{
      y: dcBrkY
    }] : null);
    if (M.mode === "string") pgSym.breaker(pen, cx, dcBrkY, "", "");
    pgSym.inverter(pen, cx, invY, ivW, ivH);
    if (u.n > 1) pen.text(T, cx + ivW / 2 + 1.4, invY, 2.2, "x" + u.n, {
      valign: 2
    });
  });
  const busY0 = invY + ivH / 2 + 8;
  const nPh = M.phase === 3 ? 3 : 1;
  const phName = nPh === 3 ? ["L1", "L2", "L3"] : ["L,N"];
  const busY = [];
  for (let p = 0; p < nPh; p++) busY.push(busY0 + p * 3.4);
  cols.forEach((u, ui) => {
    const cx = unitX[ui];
    const all = u.n > 1 && nPh > 1;
    const p = all ? nPh - 1 : Math.min(nPh - 1, Math.max(0, (u.phase || 1) - 1));
    pen.line(R, cx, invY + ivH / 2, cx, busY[p]);
    if (all) busY.forEach(y => pen.dot(R, cx, y, 0.7));else pen.dot(R, cx, busY[p], 0.7);
  });
  busY.forEach((y, p) => {
    pen.line(R, DX0, y, DX0 + pvSpan, y);
    pen.text(T, DX0 + pvSpan + 2.5, y, 2.0, "PHASE " + phName[p], {
      valign: 2
    });
  });
  const busTop = busY[busY.length - 1];
  pen.text(T, DX0 + 2, busY0 - 4.2, 2.1, M.acCable);
  const acY0 = busTop + 16,
    acY1 = acY0 + 62;
  pen.rect(BX, acX0, acY0, acX1 - acX0, acY1 - acY0);
  pen.text(LB, acX0 + 2, acY1 + 2.5, 3.4, "AC COMBINER SOLAR BOX", {
    valign: 1
  });
  if (M.combinerModel) pen.text(LB, acX0 + 2, acY1 - 5.5, 3.0, M.combinerModel, {
    valign: 1
  });
  const brs = M.branches;
  const bX0 = acX0 + 14;
  const bW = (acX1 - acX0 - 30) / Math.max(1, brs.length);
  const midBus = acY0 + 30;
  brs.forEach((b, i) => {
    const x = bX0 + bW * (i + 0.5);
    const lay = R;
    if (b.solar !== false) pen.line(lay, x, busTop, x, acY0);
    pgWireY(pen, lay, x, acY0, midBus, [{
      y: acY0 + 10
    }]);
    pgSym.breaker(pen, x, acY0 + 10, b.mcb);
    pen.dot(lay, x, midBus, 0.7);
    pen.text(T, x, acY0 - 3.2, 2.2, b.name, {
      align: 1,
      valign: 1
    });
  });
  pen.line(R, bX0, midBus, bX0 + bW * brs.length, midBus);
  const spdX = acX0 + 8;
  pen.line(R, spdX, midBus, spdX, midBus + 11);
  pen.dot(R, spdX, midBus, 0.7);
  pgSym.spd(pen, spdX, midBus + 15, ["SPD", "TYPE II", "In    20kA", "Imax  40kA", "Uc    385V"]);
  pen.line(W, spdX, midBus + 19, spdX, midBus + 23);
  pgSym.ground(pen, spdX, midBus + 23);
  pgWireY(pen, R, RISER, midBus, acY1, [{
    y: acY0 + 52
  }]);
  pen.dot(R, RISER, midBus, 0.7);
  pgSym.ct(pen, RISER, midBus + 12, M.ctBranch, "");
  pgSym.breaker(pen, RISER, acY0 + 52, M.rccb, M.rccbType);
  if (M.gateway) {
    const gx = acX1 - 24,
      gy = midBus + 12,
      cxr = acX1 + 6;
    pen.rect(S, gx - 11, gy - 4, 22, 8);
    pen.text(T, gx, gy, 2.4, "GATEWAY", {
      align: 1,
      valign: 2
    });
    pen.line(PG_SLD.comm, gx, gy - 4, gx, busTop + 4);
    pen.line(PG_SLD.comm, gx, busTop + 4, cxr, busTop + 4);
    pen.line(PG_SLD.comm, gx + 11, gy, cxr, gy);
    pen.line(PG_SLD.comm, cxr, busTop + 4, cxr, acY1 + 34);
    pen.text(T, cxr + 1.5, gy + 14, 2.1, "COMUNICATION", {
      rot: 90
    });
  }
  pen.line(R, RISER, acY1, RISER, acY1 + 22);
  pen.text(T, RISER + 3, acY1 + 14, 2.1, M.mainCable[0]);
  pen.text(T, RISER + 3, acY1 + 11, 2.1, M.mainCable[1]);
  const mcY0 = acY1 + 22,
    mcY1 = mcY0 + 46;
  pen.rect(BX, RISER - 56, mcY0, 74, mcY1 - mcY0);
  pen.text(LB, RISER - 54, mcY1 + 6.5, 3.4, "MCCB BOX", {
    valign: 1
  });
  pen.text(LB, RISER - 54, mcY1 + 1.5, 3.4, M.mccbNew ? "ADD NEW" : "EXISTING", {
    valign: 1
  });
  const homeX = RISER - 40;
  pgWireY(pen, W, RISER, mcY0, mcY1, [{
    y: mcY0 + 32
  }]);
  pgSym.breaker(pen, RISER, mcY0 + 32, M.mccb[0], M.mccb[1]);
  pen.text(T, RISER - 5, mcY0 + 4, 2.1, "FROM SOLAR CELL TO CONSUMER UNIT", {
    rot: 90
  });
  const tapY = mcY0 + 14;
  pen.dot(W, RISER, tapY, 0.7);
  pen.line(W, homeX, tapY, RISER, tapY);
  pgWireY(pen, W, homeX, tapY, mcY0 + 2, [{
    y: tapY - 9
  }]);
  pgSym.breaker(pen, homeX, tapY - 9, M.rcbo[0], M.rcbo[1]);
  pgSym.home(pen, homeX, mcY0 - 3, 4.2);
  const meaY = mcY1 + 30;
  pen.line(W, RISER, mcY1, RISER, meaY - 4);
  pgSym.ct(pen, RISER, mcY1 + 12, M.ctMain, "");
  pen.text(T, RISER + 34, mcY1 + 18, 2.1, "CT MAIN GRID");
  pgSym.utility(pen, RISER, meaY, 4.6, "TO MEA");
  if (M.batt) {
    const bx = DX0 + 140,
      by = invY;
    pen.rect(S, bx - 14, by - 5, 28, 10);
    pen.text(T, bx, by, 2.4, "BAT. " + M.batt.kwh + " kWh.", {
      align: 1,
      valign: 2
    });
    pen.text(LB, bx, by - 8.5, 2.6, M.batt.brand + " " + M.batt.model, {
      align: 1,
      valign: 1
    });
    pen.text(LB, bx, by - 12.5, 2.6, "BATTERY " + M.batt.kwh + " kWh.", {
      align: 1,
      valign: 1
    });
    const bBr = brs.filter(b => b.solar === false)[0];
    const bxUp = bBr ? bX0 + bW * (brs.indexOf(bBr) + 0.5) : RISER;
    pen.line(R, bx, by + 5, bx, busTop + 6);
    pen.line(R, bx, busTop + 6, bxUp, busTop + 6);
    pen.line(R, bxUp, busTop + 6, bxUp, acY0);
  }
  pen.text(T, DX0 + pvSpan / 2, pvY - 15, 3.2, M.summary[0], {
    align: 1,
    valign: 1
  });
  pen.text(T, DX0 + pvSpan / 2, pvY - 20, 3.2, M.summary[1], {
    align: 1,
    valign: 1
  });
  let ty = A.y1 - 6;
  ty -= pgSldTable(pen, TX0, ty, TX1 - TX0, M.invData, "INVERTER DATA") + 8;
  if (M.battData && M.battData.length) ty -= pgSldTable(pen, TX0, ty, TX1 - TX0, M.battData, "BATTERY DATA") + 8;
  const eqH = 5.4 + 4.6 * (M.equip.length + 1);
  const eqY = Math.min(ty - 4, A.y0 + 8 + eqH);
  pgSldEquip(pen, TX0, eqY, TX1 - TX0, M.equip);
  pgSheetTitle(pen, (TX0 + TX1) / 2, eqY + 11, "SINGLE LINE DIAGRAM SOLAR CELL SYSTEM", 6.2, TX1 - TX0 - 16);
}
Object.assign(window, {
  pgDxf,
  pgSvg,
  pgDoc,
  pgPen,
  pgSheet,
  pgSheetTitle,
  pgSheetLayers,
  pgLogoMark,
  pgWrap,
  pgSldLayers,
  pgSldDraw,
  pgSldTable,
  pgSldEquip,
  pgSym,
  pgTableLayers,
  pgGrid,
  pgSpecBlock,
  pgCompass,
  pgModuleDetail,
  pgPhotoFrame,
  pgDcString,
  pgDcSize,
  PG_SHEET,
  PG_LAY,
  PG_ACI,
  PG_SLD,
  PG_TBL
});