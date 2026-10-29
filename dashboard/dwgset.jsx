/* ==================================================================
   flash+solar — ชุดแบบ SHOP DRAWING ส่วนเพิ่ม (ขั้นที่ 1 · ต.ค. 2026) · prefix ds/Ds
   ผู้ใช้ส่งชุดแบบที่ใช้หน้างานจริง (31 แผ่น) มา ขอให้กดออกแบบแล้วได้ชุดแบบแบบนั้นทีเดียวจบ
   แผ่นในไฟล์นี้วาดจากข้อมูลที่มีอยู่แล้วทั้งหมด (แบบ 3D + หน้าออกแบบระบบ) ไม่ต้องกรอกเพิ่ม:
     ปก · รายการประกอบแบบ+สารบัญ+สัญลักษณ์ · ผังวางแผง (กลุ่ม แถว x แผง) · ผังรางไฟ/ท่อน้ำ/ทางเดิน/บันได+ราวกันตก
     · รูปการเดินสายสตริง (แถวเดียว/สองแถว) · ระบบต่อลงดิน · PDF ทั้งเล่ม
   ทุกแผ่นวาดผ่าน doc API (pgDoc/pgSheet/pgPen) เท่านั้น → รวมไฟล์ CAD เดียว (pgCombine) และ PDF ได้
   โหลดหลัง plan3d.js (ใช้ p3PlanView · p3FootAll · p3RoofSurf · p3SldModel · p3SheetInfo ฯลฯ)
   ================================================================== */

/* ── layer ของแผ่นใหม่ — สีเดียวกันทุกแผ่น (สัญลักษณ์ในหน้ารายการประกอบแบบวาดด้วยชุดนี้ จึงตรงกับผังเสมอ) ── */
const DS_LAY = {
  roof: ["DS-ROOF", 8, 15], rtex: ["DS-ROOF-TEX", 9, 5], ridge: ["DS-ROOF-RIDGE", 8, 9], pan: ["DS-PANEL", 140, 13], panB: ["DS-PANEL-B", 5, 18],
  tray: ["DS-TRAY", 30, 50], pipe: ["DS-PIPE", 3, 40], tap: ["DS-TAP", 4, 30],
  walk: ["DS-WALKWAY", 2, 50], rail: ["DS-GUARDRAIL", 6, 40], lad: ["DS-LADDER", 1, 40],
  tag: ["DS-TAG", 7, 18], grp: ["DS-GROUP", 1, 18], dcp: ["DS-DC-POS", 1, 35], dcn: ["DS-DC-NEG", 7, 35],
  jmp: ["DS-JUMPER", 7, 25], mod: ["DS-MODULE", 7, 25], cell: ["DS-MODULE-CELL", 9, 9], earth: ["DS-EARTH", 3, 35],
  eq: ["DS-EQUIP", 7, 30], flow: ["DS-FLOW", 8, 13], cov: ["DS-COVER", 7, 50], cov2: ["DS-COVER-2", 7, 18],
  covT: ["DS-COVER-TEXT", 7, 25], covC: ["DS-COVER-CO", 7, 25],   // ปกสีดำทั้งหมด (ผู้ใช้ขอ)
};
const DL = (k) => DS_LAY[k][0];
function dsLayers(doc) {
  doc.ltype("PG-DASH", "Dashed __ __ __", [6, -3]);
  Object.keys(DS_LAY).forEach((k) => { const L = DS_LAY[k]; doc.layer(L[0], L[1], k === "flow" ? "PG-DASH" : "CONTINUOUS", L[2]); });
}

/* ── ชื่อแผ่น (ภาษาอังกฤษ) ไว้ใช้บนป้ายเหนือแผ่นในไฟล์รวม + สารบัญ ── */
const DS_SET_EN = {
  COVER: "COVER", NOTES: "GENERAL NOTES & LEGEND", PLAN: "OVERALL LAYOUT", PANEL: "PV MODULE LAYOUT",
  STRING: "STRING LAYOUT", STRDET: "PV STRING WIRING DETAIL", SLD: "SINGLE LINE DIAGRAM", DC: "DC WIRING",
  GROUND: "GROUNDING DIAGRAM", TRAY: "CABLE TRAY LAYOUT", WATER: "WATER PIPE LAYOUT", WALK: "WALKWAY LAYOUT",
  SAFETY: "LADDER & GUARD RAIL", PHOTO: "SITE PHOTO", MAT: "MATERIAL LIST",
};

/* หมวดของแต่ละแผ่นในไฟล์รวม (pgCombine groups) — แผ่นหมวดเดียวกันอยู่แถว/กรอบเดียวกัน */
const DS_SET_GROUP = {
  COVER: "COVER", NOTES: "COVER", PLAN: "LAYOUT", PANEL: "LAYOUT", STRING: "LAYOUT",
  STRDET: "ELECTRICAL", SLD: "ELECTRICAL", DC: "ELECTRICAL", GROUND: "ELECTRICAL",
  TRAY: "MECHANICAL", WALK: "MECHANICAL", SAFETY: "MECHANICAL", WATER: "WATER", PHOTO: "SITE", MAT: "SITE",
};

/* ── ช่วยเรื่องข้อความ/หมายเหตุ (มม.บนกระดาษ) ── */
function dsNoteLines(notes, w, th) {
  const per = Math.max(20, Math.floor((w - 5) / (th * 0.5)));
  return (notes || []).map((s) => pgWrap(s, per));
}
function dsNoteH(notes, w, th) {
  th = th || PG_TS.cell;
  return PG_TS.body + 2.4 + th + dsNoteLines(notes, w, th).reduce((t, ln) => t + ln.length * th * 1.65 + th * 0.35, 0);
}
/* หมายเหตุเป็นข้อ ๆ ตัดบรรทัดตามความกว้าง · yTop = ขอบบนของบล็อก */
function dsNoteBlock(pen, x, yTop, w, notes, o) {
  o = o || {};
  const th = o.th || PG_TS.cell, lh = th * 1.65;
  pen.text(PG_TBL.txt, x, yTop - PG_TS.body, PG_TS.body, o.head || "NOTE :");
  let y = yTop - PG_TS.body - 2.4 - th;
  dsNoteLines(notes, w, th).forEach((ln, i) => {
    ln.forEach((s, j) => {
      if (!j) pen.text(PG_TBL.txt, x, y, th, (i + 1) + ".");
      pen.text(PG_TBL.txt, x + 4.5, y, th, s);
      y -= lh;
    });
    y -= th * 0.35;
  });
  return yTop - y;
}

/* ── แผ่นขนาดกระดาษ (หน่วย มม.) ── */
function dsMm(st, job, media, key, title) {
  media = media || {};
  const doc = pgDoc({ units: "mm", ltscale: 1 }, media.svg);
  pgTableLayers(doc); dsLayers(doc);
  const sheet = pgSheet(doc, { k: 1, ox: 0, oy: 0,
    info: p3SheetInfo(st, job, { sheet: key, scale: "NONE", sheetNo: media.sheetNo || "1/1" }) });
  const A = sheet.area;
  if (title) pgSheetTitle(sheet.pen, A.x0 + 4, A.y1 - 10, title, PG_TS.title, 220, 0, null);
  return { doc, pen: sheet.pen, A, sheet };
}

/* ── แผ่นผัง (หน่วยเมตรตามมาตราส่วน) — กรอบมองเดียวกับผังติดตั้ง (p3PlanView) ภาพพื้นหลังที่ตัดไว้แล้วจึงวางพอดี
   o.img = ใส่ภาพดาวเทียม/โดรนจาง ๆ · o.panels = "full" (แผงเข้ม) | false (ไม่วาดแผง) | อื่น ๆ = แผงจาง ── */
function dsPlan(st, job, media, key, o) {
  media = media || {}; o = o || {};
  const V = p3PlanView(st), k = V.k, IN = PG_SHEET.IN;
  const docRaw = pgDoc({ units: "m", ltscale: k }, media.svg);
  const doc = p3RotDoc(docRaw, V.rot);     // ตัวผังหมุนตามแนวอาคาร (p3PlanRot) · กรอบ/หัวแบบใช้ docRaw
  doc.layer("PG-BG", 8, "CONTINUOUS", 5);
  pgTableLayers(doc); dsLayers(doc);
  doc.layer("PG-STRING", 6, "CONTINUOUS", 25);
  const ox = V.cx - V.px * k, oy = V.cy - V.py * k;
  const sheet = pgSheet(docRaw, { k, ox, oy,
    info: p3SheetInfo(st, job, { sheet: key, scale: "1:" + V.SC, sheetNo: media.sheetNo || "1/1" }) });
  if (o.img) (media.imgs || []).forEach((im) => {
    const p = Object.assign({}, im, im.place || p3ImgPlace(im.kind, st, (+im.pxH || 3) / (+im.pxW || 4)));
    const c = p3ImgCorner(p);
    doc.image("PG-BG", { file: p.file, href: p.href, pxW: p.pxW, pxH: p.pxH, x: c.x, y: c.y, w: p.w, h: p.h, rot: p.rot,
      fade: Math.max(72, +p.fade || 0) });
  });
  (st.roofs || []).forEach((roof) => {
    let faces = [];
    try { faces = p3RoofSurf(roof) || []; } catch (e) { faces = []; }
    if (!faces.length && roof.kind === "poly" && Array.isArray(roof.pts))
      doc.pline(DL("roof"), roof.pts.map((p) => [(+p.x || 0) + (+roof.x || 0), -((+p.z || 0) + (+roof.z || 0))]), true);
    /* โดม (ครึ่งวงกลม) ไม่มีผิวผืน — ใช้ขอบผังของตัวแก้ (p3sOutline · plan3d2) ถ้ามี */
    else if (!faces.length && typeof p3sOutline === "function") {
      let ol = [];
      try { ol = p3sOutline(roof) || []; } catch (e) { ol = []; }
      if (ol.length >= 3) doc.pline(DL("roof"), ol.map((p) => [p.x, -p.z]), true);
    }
  });
  /* หลังคา: ลายผิวตามวัสดุ + ครอบสัน + ขอบ — ส่วนที่หลังคาอื่นที่สูงกว่าบังไม่วาด (p3RoofPlan) */
  const RP = p3RoofPlan(st, k);
  if (doc.hatch) RP.hatch.forEach((h) => doc.hatch(DL("rtex"), h.loops, h));   // DXF = HATCH · บนจอ = เส้น
  [[DL("rtex"), doc.hatch ? [] : RP.tex], [DL("ridge"), RP.ridge], [DL("roof"), RP.edges]].forEach(([L, E]) =>
    E.forEach((e) => doc.line(L, e[0][0], e[0][1], e[1][0], e[1][1])));
  let foot = { panels: [] };
  try { foot = p3FootAll(st); } catch (e) { foot = { panels: [] }; }
  if (o.panels !== false) {
    const L = o.panels === "full" ? DL("panB") : DL("pan");
    foot.panels.forEach((p) => p3PanelIns(doc, L, p.pts.map((q) => [q[0], -q[1]])));   // BLOCK PV-PANEL
  }
  const AR = sheet.area, RX1 = AR.x1 - 2;
  return { doc, pen: sheet.pen, sheet, AR, V, k, SC: V.SC, foot, RX0: RX1 - P3_PLAN_COL, RX1, RW: P3_PLAN_COL };
}
/* หัวคอลัมน์ขวาของแผ่นผัง (ชื่อแผ่น + มาตราส่วน + เข็มทิศ) + มาตราส่วนเส้นมุมซ้ายล่าง — แบบเดียวกับผังติดตั้ง */
function dsPlanHead(P, title) {
  const pen = P.pen, AR = P.AR;
  /* โหมดกว้าง: ชื่อแผ่น + มาตราส่วนลงมุมซ้ายล่าง (เหนือมาตราส่วนเส้น) แถบบนเหลือแค่เข็มทิศ (ผู้ใช้ย้าย) */
  const tx = P.V.wide ? AR.x0 + 4 : P.RX0, ty = P.V.wide ? AR.y0 + 18 : AR.y1 - 12;
  pgSheetTitle(pen, tx, ty, title, PG_TS.title, P.V.wide ? 170 : P.RW - 30, 0, P.SC);   // แบบคอลัมน์: เว้นที่ให้เข็มทิศมุมขวาบน
  pgCompass(pen, P.RX1 - 12, AR.y1 - P3_COMPASS_DY, 6.5, null, P.V.rot);
  P.titleW = pgTextW(title, PG_TS.title) + 8;
  const barM = P.SC / 1000 * 40, bx = AR.x0 + 4, by = AR.y0 + 4;
  pen.rect("PG-NORTH", bx, by, 40, 2.2);
  pen.solid("PG-NORTH", [bx, by], [bx + 10, by], [bx + 10, by + 2.2], [bx, by + 2.2]);
  pen.solid("PG-NORTH", [bx + 20, by], [bx + 30, by], [bx + 30, by + 2.2], [bx + 20, by + 2.2]);
  [0, 0.5, 1].forEach((f) => pen.text("PG-NORTH", bx + 40 * f, by + 3, 2.2, (barM * f).toFixed(0), { align: 1, valign: 1 }));
  pen.text("PG-NORTH", bx + 44, by + 0.4, 2.2, "METRES");
}
/* ตาราง + หมายเหตุในคอลัมน์ขวา · ตารางยาวเกินที่ = ยุบแถวกลาง เหลือแถวท้าย (รวม) เสมอ */
function dsRight(P, rows, cols, notes, align) {
  const pen = P.pen, AR = P.AR, RH = P3_TBL_RH;   // แถว/ตัวหนังสือขนาดเดียวกับตาราง MPPT ผังสตริง
  const nh = notes && notes.length ? dsNoteH(notes, P.RW) : 0;
  /* โหมดกว้าง: ตารางย้ายลงแถบล่าง (เหนือหมายเหตุ) ไม่ทับผังกลางแผ่น */
  const yTop = P.V.wide ? PG_SHEET.IN.y0 + P3_WIDE_B - 8 : AR.y1 - 54, yMin = AR.y0 + 4 + nh + 6;
  const fit = Math.max(4, Math.floor((yTop - yMin) / RH));
  let R = rows;
  if (R.length > fit) R = R.slice(0, fit - 2).concat([cols.map((_, i) => (i ? "" : "…"))], [rows[rows.length - 1]]);
  /* กว้างตามข้อความจริง ไม่ยืดเต็มคอลัมน์ (ผู้ใช้: ตารางยาวไป) · ข้อความยาวเกินคอลัมน์ = ย่อตามสัดส่วน */
  const cw = cols.map((_, i) => Math.max(...R.map((r) => String(r[i] == null ? "" : r[i]).length)) * PG_TS.body * 0.52 + 6);
  const tw = Math.min(P.RW, cw.reduce((t, w) => t + w, 0));
  /* โหมดกว้าง: ตารางไปกลางแถบล่างระหว่างชื่อแผ่นกับหมายเหตุ ชิดล่าง (ผู้ใช้ย้าย) — ไม่พอที่ = ที่เดิมเหนือหมายเหตุ */
  let tx = P.RX0, ty = yTop;
  if (P.V.wide) {
    const xL = AR.x0 + 4 + Math.max(P.titleW || 110, 50) + 8, xR = P.RX0 - 8;
    const hNeed = R.length * RH;
    if (xR - xL >= tw && hNeed <= yTop - AR.y0 - 10) { tx = (xL + xR - tw) / 2; ty = AR.y0 + 4 + hNeed; }
  }
  P.tbX = tx; P.tbTop = ty;
  const used = pgGrid(pen, tx, ty, tw, cw, R, { rh: RH, th: PG_TS.body, headRow: 0, align });
  if (nh) dsNoteBlock(pen, P.RX0, AR.y0 + 4 + nh, P.RW, notes);
  return used;
}

/* ── เส้นของสิ่งบดบังแบบเส้น (ราง/ท่อ/ทางเดิน/ราว) เป็นพิกัดผัง [x, y] (y = −z แกนขึ้น) ── */
function dsPath(o) {
  const x = +o.x || 0, z = +o.z || 0;
  if (Array.isArray(o.pts) && o.pts.length >= 2) return o.pts.map((q) => [x + (+q.x || 0), -(z + (+q.z || 0))]);
  const L = Math.max(0.1, +o.w || 1) / 2, a = (+o.rot || 0) * P3_DEG, ux = Math.cos(a), uz = Math.sin(a);
  return [[x - ux * L, -(z - uz * L)], [x + ux * L, -(z + uz * L)]];
}
const dsLen = (P) => P.reduce((t, p, i) => (i ? t + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), 0);
/* จำนวนมุมเลี้ยว ≥ 15° (นับเป็นข้องอ) */
function dsBends(P) {
  let n = 0;
  for (let i = 1; i < P.length - 1; i++) {
    const ax = P[i][0] - P[i - 1][0], ay = P[i][1] - P[i - 1][1], bx = P[i + 1][0] - P[i][0], by = P[i + 1][1] - P[i][1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (la < 1e-3 || lb < 1e-3) continue;
    if (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb)))) / P3_DEG >= 15) n++;
  }
  return n;
}
/* ป้ายวงกลมรหัส (T1, P2 …) ห่างจากกลางช่วงที่ยาวที่สุด 5 มม. บนกระดาษ มีเส้นชี้ */
function dsTag(P, path, txt) {
  let bi = 1, bl = -1;
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (l > bl) { bl = l; bi = i; }
  }
  const a = path[bi - 1], b = path[bi] || a;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  let nx = -Math.sin(ang), ny = Math.cos(ang);
  if (ny < 0 || (Math.abs(ny) < 1e-6 && nx < 0)) { nx = -nx; ny = -ny; }   // ป้ายอยู่ด้านบน/ขวาของเส้นเสมอ
  dsTagAt(P, mx, my, nx, ny, txt);
}
function dsTagAt(P, x, y, nx, ny, txt) {
  const k = P.k, r = 2.4 * k, off = 6 * k;
  const cx = x + nx * off, cy = y + ny * off;
  P.doc.line(DL("tag"), x, y, cx - nx * r, cy - ny * r);
  P.doc.circle(DL("tag"), cx, cy, r);
  P.doc.text(DL("tag"), cx, cy, (txt.length <= 2 ? 2.0 : 1.6) * k, txt, { align: 1, valign: 2 });
}
/* ความสูงผิวหลังคาที่ขอบใกล้จุด (x, z) ที่สุด — ใช้บอกความสูงบันไดลิง */
function dsEaveAt(st, x, z) {
  let best = null;
  (st.roofs || []).forEach((roof) => {
    let faces = [];
    try { faces = p3RoofSurf(roof) || []; } catch (e) { faces = []; }
    faces.forEach((f) => {
      const Q = f.pts || [];
      Q.forEach((a, i) => {
        const b = Q[(i + 1) % Q.length], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
        if (L2 < 1e-6) return;
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2));
        const d = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
        if (!best || d < best.d) best = { d, y: a.y + (b.y - a.y) * t };
      });
    });
  });
  return best;
}
/* ชื่อรางตามรายการที่มีขายใน BOQ (ชื่อเดียวกับใบ BOQ) — ไม่มี BOQ = ชื่อกลาง */
function dsTrayName(wMm, kind) {
  const B = window.BOQ;
  try {
    if (B && B.trayKindOf && B.trayDim) {
      const sp = B.trayKindOf(kind), all = sp.sizes || [];
      const std = all.filter((nm) => /mm.$/.test(nm) || (sp.std && nm.endsWith(sp.std)));
      const pool = std.length ? std : all;
      const nm = pool.find((n) => B.trayDim(n).w >= wMm - 0.5) || pool[pool.length - 1];
      if (nm) return nm;
    }
  } catch (e) { /* ใช้ชื่อกลาง */ }
  return (kind === "perf" ? "Cable Tray Perforated " : "Wireway ") + wMm + "x50 mm.";
}
const DS_PPR = { 20: '1/2"', 25: '3/4"', 32: '1"', 40: '1-1/4"', 50: '1-1/2"', 63: '2"' };

/* ==================================================================
   ปก (COVER) — ตามปกชุดแบบของบริษัท: กรอบเส้นคู่มุมมน · ชื่อระบบไทย/อังกฤษพร้อมขนาด · เจ้าของ · พิกัด · SHOP-DRAWING · โลโก้
   ไม่มีหัวแบบ (Title Box) — แต่ยังบอกกรอบกระดาษ (doc.plot) ให้ไฟล์รวม/PDF วางแผ่นถูกที่
   ================================================================== */
function dsRRect(pen, L, x, y, w, h, r) {
  pen.line(L, x + r, y, x + w - r, y); pen.line(L, x + w, y + r, x + w, y + h - r);
  pen.line(L, x + w - r, y + h, x + r, y + h); pen.line(L, x, y + h - r, x, y + r);
  pen.arc(L, x + w - r, y + r, r, 270, 360); pen.arc(L, x + w - r, y + h - r, r, 0, 90);
  pen.arc(L, x + r, y + h - r, r, 90, 180); pen.arc(L, x + r, y + r, r, 180, 270);
}
function dsKwp(st) { return Math.round(p3CountAll(st) * (+st.wp || 650) / 10) / 100; }
function dsCover(st, job, media) {
  media = media || {};
  const doc = pgDoc({ units: "mm", ltscale: 1 }, media.svg);
  pgSheetLayers(doc); pgLogoLayers(doc); dsLayers(doc);
  doc.plot({ x0: 0, y0: 0, w: PG_SHEET.W, h: PG_SHEET.H, k: 1 });
  const pen = pgPen(doc, 1, 0, 0);
  const I = p3SheetInfo(st, job, { sheet: "COVER", sheetNo: media.sheetNo });
  const B = window.BRANDING || {};
  const cx = PG_SHEET.W / 2, T = DL("covT");
  pen.rect(PG_LAY.thin, 5, 5, PG_SHEET.W - 10, PG_SHEET.H - 10);
  dsRRect(pen, DL("cov"), 14, 12, PG_SHEET.W - 28, PG_SHEET.H - 24, 7);
  dsRRect(pen, DL("cov2"), 17, 15, PG_SHEET.W - 34, PG_SHEET.H - 30, 5);

  const kwp = dsKwp(st).toFixed(2);
  const withPanel = (st.roofs || []).filter((r) => { try { return p3Panels(r).count > 0; } catch (e) { return false; } });
  const ground = withPanel.length > 0 && withPanel.every((r) => r.p3sGround);
  const th = "ระบบผลิตไฟฟ้าด้วยเซลล์แสงอาทิตย์ชนิดติดตั้ง" + (ground ? "บนพื้นดิน" : "บนหลังคา") + "ขนาด " + kwp + " กิโลวัตต์";
  const en = "(Solar PV " + (ground ? "Ground-Mounted" : "Rooftop") + " System - " + kwp + " kWp.)";
  pen.text(T, cx, 238, 10.5, th, { align: 1, valign: 2 });
  pen.text(T, cx, 221, 8.5, en, { align: 1, valign: 2 });
  const own = pgWrap((job && job.name) || "-", 50);
  own.slice(0, 2).forEach((s, i) => pen.text(T, cx, 190 - i * 11, 9.0, s, { align: 1, valign: 2 }));
  const bm = st.baseMap || {}, lat = +bm.lat, lng = +bm.lng;
  const yLoc = 190 - Math.min(2, own.length) * 11 - 1;
  if (isFinite(lat) && isFinite(lng) && (lat || lng))
    pen.text(T, cx, yLoc, 6.5, "Location : " + lat.toFixed(6) + ", " + lng.toFixed(6), { align: 1, valign: 2 });
  else if (I.address) pen.text(T, cx, yLoc, 6.0, pgWrap(I.address, 70)[0], { align: 1, valign: 2 });
  pen.text(T, cx, 132, 15.0, "SHOP-DRAWING", { align: 1, valign: 2, wf: 1 });

  /* โลโก้ + ชื่อบริษัท (อังกฤษ/ไทย) วางเป็นกลุ่มกึ่งกลางแผ่น มีเส้นตั้งคั่นแบบปกจริง */
  const nEN = B.legal || "FLASHPLUSSOLAR CO., LTD.", nTH = B.legalTH || "";
  const tW = Math.max(nEN.length * 9.5 * 0.6, nTH.length * 7.5 * 0.5);
  const LG = I.logo;
  let lw = 0, lh = 30;
  if (LG && LG.pxW && LG.pxH) { lw = Math.min(70, lh * LG.pxW / LG.pxH); lh = lw * LG.pxH / LG.pxW; } else lw = 22;
  const gx = cx - (lw + 7 + tW) / 2, gy = 74;
  if (LG && LG.pxW && LG.pxH) {
    doc.layer("PG-LOGO-IMG", PG_ACI.white, "CONTINUOUS", 0);
    doc.image("PG-LOGO-IMG", { file: LG.file, href: LG.href, pxW: LG.pxW, pxH: LG.pxH, transp: true, x: gx, y: gy - lh / 2, w: lw, h: lh });
  } else pgLogoMark(pen, gx, gy - 11, 22);
  pen.line(DL("covC"), gx + lw + 3.5, gy - 14, gx + lw + 3.5, gy + 14);
  pen.text(DL("covC"), gx + lw + 7, gy + 2.5, 9.5, nEN, { valign: 1, wf: 1 });
  if (nTH) pen.text(DL("covC"), gx + lw + 7, gy - 11, 7.5, nTH, { valign: 1 });

  pen.text(PG_LAY.txt, cx, 30, 4.2, "PROJECT NO. " + (I.projectNo || "-") + "      DATE " + (I.date || "") + "      REV. " + (I.rev || "0"),
    { align: 1, valign: 2 });
  return doc.build();
}

/* ==================================================================
   รายการประกอบแบบ + สารบัญแบบ + สัญลักษณ์ (GENERAL NOTES & LEGEND)
   media.index = [{ no, key, en, th, dwg }] ทุกแผ่นในชุด (ตามลำดับจริง)
   ================================================================== */
function dsGeneralNotes(st, job, M) {
  const kwp = dsKwp(st).toFixed(2);
  const auth = (window.BOQ && window.BOQ.gridAuthOf && job) ? window.BOQ.gridAuthOf(job) : "";
  const authTH = auth === "MEA" ? "การไฟฟ้านครหลวง (กฟน.)" : auth === "PEA" ? "การไฟฟ้าส่วนภูมิภาค (กฟภ.)" : "การไฟฟ้า";
  return [
    "แบบชุดนี้ใช้สำหรับงานติดตั้งระบบผลิตไฟฟ้าด้วยเซลล์แสงอาทิตย์ขนาด " + kwp + " kWp ของ " + ((job && job.name) || "เจ้าของงาน"),
    "หน่วยในแบบเป็นมิลลิเมตร ยกเว้นระบุเป็นอย่างอื่น · ระยะบนผังเป็นเมตร อ้างอิงภาพถ่ายดาวเทียม/โดรน ผู้รับเหมาต้องวัดตรวจสอบหน้างานก่อนติดตั้งทุกครั้ง",
    "การติดตั้งทางไฟฟ้าเป็นไปตามมาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย (วสท.) และระเบียบการเชื่อมต่อระบบของ" + authTH,
    "แผงเซลล์แสงอาทิตย์ผ่านมาตรฐาน IEC 61215 / IEC 61730 · อินเวอร์เตอร์ผ่าน IEC 62109 และอยู่ในบัญชีอุปกรณ์ที่การไฟฟ้ารับรอง",
    "สายฝั่ง DC ใช้ " + ((M && M.pro && M.pro.dcCable) || "PV1-F (H1Z2Z2-K) 1.5kV DC") + " · หัวต่อ MC4 ตัวผู้และตัวเมียต้องเป็นยี่ห้อและรุ่นเดียวกัน",
    "สายที่เดินบนหลังคาต้องอยู่ในรางไฟหรือท่อร้อยสาย ไม่วางบนแผ่นหลังคาโดยตรง · รัดสายด้วยเคเบิลไทชนิดทนแสง UV",
    "โครงยึดแผงเป็นอะลูมิเนียม ยึดด้วย L-FEET ตามแนวแปของหลังคา · ทุกจุดที่เจาะยึดต้องทำกันซึม",
    "โครงแผง · PE BAR ตู้ DC · ตัวอินเวอร์เตอร์ · รางไฟ/บันได ต่อลงหลักดิน PV ที่ปักแยกจากระบบไฟฟ้าอาคาร ความต้านทานไม่เกิน 5 โอห์ม (ดูแบบระบบต่อลงดิน)",
    "ห้ามต่อหรือปลดหัว MC4 ขณะมีกระแสไหล · ปิดเบรกเกอร์/ฟิวส์ฝั่ง DC และ AC ก่อนทำงานทุกครั้ง",
    "ก่อนจ่ายไฟต้องทดสอบตาม IEC 62446-1 (ขั้วสาย · Voc · Isc · ความต้านทานฉนวน · ความต่อเนื่องสายดิน) และบันทึกผลส่งมอบ",
    "ตำแหน่งตู้และอุปกรณ์ในแบบเป็นตำแหน่งโดยประมาณ ปรับได้ตามสภาพหน้างานโดยแจ้งผู้ออกแบบก่อน",
  ];
}
function dsNotesSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "NOTES", "GENERAL NOTES & LEGEND");
  const pen = S.pen, A = S.A, T = PG_TBL.txt, LN = PG_TBL.line;
  pgSldLayers(S.doc);
  S.doc.layer("PG-STRING", 6, "CONTINUOUS", 25);
  let M = null;
  try { M = p3SldModel(st, job, media.design); } catch (e) { M = null; }

  /* สามคอลัมน์กว้างเท่ากันเต็มแผ่น · ตารางสัญลักษณ์สูงตามที่ว่าง (ผู้ใช้: จัดให้สวย — เดิมกองอยู่ครึ่งบน ล่างว่าง) */
  const gapC = 10, wc = (A.x1 - A.x0 - 8 - 2 * gapC) / 3, yTop = A.y1 - 20, yBot = A.y0 + 6;
  /* คอลัมน์ 1 · รายการประกอบแบบ + สารบัญแบบ */
  const c1 = A.x0 + 4, w1 = wc;
  const used = dsNoteBlock(pen, c1, yTop, w1, dsGeneralNotes(st, job, M), { head: "รายการประกอบแบบ (GENERAL NOTES)", th: PG_TS.body });
  const IX = media.index || [];
  if (IX.length) {
    const yI = yTop - used - 10;
    pen.text(T, c1, yI, PG_TS.head, "สารบัญแบบ (DRAWING INDEX)");
    const rows = [["NO.", "DRAWING NO.", "TITLE"]].concat(IX.map((r) => [r.no, r.dwg, r.en]));
    const rh = Math.max(3.6, Math.min(7, (yI - 4 - yBot) / rows.length));
    pgGrid(pen, c1, yI - 3, w1, [0.45, 1.5, 2.6], rows, { rh, th: Math.min(PG_TS.cell, rh * 0.5), headRow: 0, align: [1, 0, 0] });
  }

  /* ตารางสัญลักษณ์: ความสูงแถว 9–11 มม. (20 มม. ผู้ใช้ว่าใหญ่เกิน) ช่องรูป 32 มม. + คำอธิบายไทย/อังกฤษ */
  const legend = (x, y, w, head, items) => {
    pen.text(T, x, y, PG_TS.head, head);
    let cy = y - 3.5;
    const h = Math.min(11, Math.max(9, (cy - yBot) / items.length));
    items.forEach((it) => {
      pen.rect(LN, x, cy - h, w, h);
      pen.line(LN, x + 32, cy, x + 32, cy - h);
      it[0](x + 16, cy - h / 2);
      pen.text(T, x + 35, cy - h / 2 + 1.7, PG_TS.body, it[1], { valign: 2 });
      if (it[2]) pen.text(T, x + 35, cy - h / 2 - 2.0, PG_TS.cell * 0.9, it[2], { valign: 2 });
      cy -= h;
    });
    return y - cy;
  };
  const seg = (L, x, y) => pen.line(L, x - 11, y, x + 11, y);
  const c2 = c1 + wc + gapC, w2 = wc;
  legend(c2, yTop, w2, "สัญลักษณ์ผังติดตั้ง (LAYOUT LEGEND)", [
    [(x, y) => pen.rect(DL("roof"), x - 11, y - 3, 22, 6), "ขอบหลังคา", "ROOF OUTLINE"],
    [(x, y) => { [-7.5, -2.5, 2.5, 7.5].forEach((d) => pen.rect(DL("panB"), x + d - 2.3, y - 3.2, 4.6, 6.4)); }, "แผงเซลล์แสงอาทิตย์", "PV MODULE"],
    [(x, y) => { pen.line("PG-STRING", x - 11, y, x + 8, y); pen.circle("PG-STRING", x - 11, y, 1.8); pen.text("PG-STRING", x - 11, y, 1.8, "1", { align: 1, valign: 2 }); }, "แนวเดินสายสตริง (เลขสตริงที่แผงแรก)", "STRING ROUTE"],
    [(x, y) => { pen.solid(DL("tray"), [x - 11, y - 0.7], [x + 11, y - 0.7], [x + 11, y + 0.7], [x - 11, y + 0.7]); }, "รางไฟบนหลังคา", "CABLE TRAY / WIREWAY"],
    [(x, y) => { seg(DL("pipe"), x, y); pen.circle(DL("tap"), x + 4, y, 1.3); pen.line(DL("tap"), x + 3, y, x + 5, y); }, "ท่อน้ำ PPR + ก๊อกสนาม", "WATER PIPE + TAP"],
    [(x, y) => { pen.solid(DL("walk"), [x - 11, y - 1.2], [x + 11, y - 1.2], [x + 11, y + 1.2], [x - 11, y + 1.2]); }, "ทางเดินบนหลังคา (FRP)", "WALKWAY"],
    [(x, y) => { seg(DL("rail"), x, y); [-11, -3.7, 3.7, 11].forEach((d) => pen.circle(DL("rail"), x + d, y, 0.5)); }, "ราวกันตก", "GUARD RAIL"],
    [(x, y) => { pen.rect(DL("lad"), x - 3, y - 3.5, 6, 7); for (let i = 1; i < 4; i++) pen.line(DL("lad"), x - 3, y - 3.5 + i * 1.75, x + 3, y - 3.5 + i * 1.75); }, "บันไดลิง (มีกรงกันตก)", "SERVICE LADDER"],
    [(x, y) => { pen.circle(DL("tag"), x, y, 2.4); pen.text(DL("tag"), x, y, 1.7, "T1", { align: 1, valign: 2 }); }, "รหัสรายการ (ดูตารางในแผ่นนั้น)", "ITEM TAG"],
    [(x, y) => seg(DL("earth"), x, y), "สายต่อลงดิน", "EARTH CONDUCTOR"],
    [(x, y) => { pen.line(DL("dcp"), x - 11, y + 1.5, x + 11, y + 1.5); pen.line(DL("dcn"), x - 11, y - 1.5, x + 11, y - 1.5); }, "สาย DC ขั้วบวก (แดง) / ขั้วลบ (ดำ)", "DC CABLE (+) / (-)"],
  ]);
  const c3 = c2 + wc + gapC, w3 = wc;
  legend(c3, yTop, w3, "สัญลักษณ์แบบไฟฟ้า (ELECTRICAL SYMBOLS)", [
    [(x, y) => pgSym.pv(pen, x, y, 13, 5.4, null, true), "แผงเซลล์แสงอาทิตย์", "PV MODULE"],
    [(x, y) => pgSym.inverter(pen, x, y, 10, 7), "อินเวอร์เตอร์", "INVERTER (DC/AC)"],
    [(x, y) => { pen.line(PG_SLD.wire, x - 9, y, x - 4.15, y); pen.line(PG_SLD.wire, x + 4.15, y, x + 9, y);
      pen.circle(PG_SLD.sym, x - 3.4, y, 0.75); pen.circle(PG_SLD.sym, x + 3.4, y, 0.75); pen.arc(PG_SLD.sym, x, y, 4.3, 28, 152); }, "เบรกเกอร์", "MCB / MCCB / RCCB"],
    [(x, y) => { pen.rect(PG_SLD.sym, x - 3.2, y - 1.2, 6.4, 2.4); pen.line(PG_SLD.wire, x - 9, y, x + 9, y); }, "ฟิวส์", "FUSE (gPV / gG)"],
    [(x, y) => pgSym.spd(pen, x, y), "อุปกรณ์ป้องกันฟ้าผ่า/แรงดันเกิน", "SPD"],
    [(x, y) => { pen.line(PG_SLD.wire, x - 9, y, x + 9, y); pen.circle(PG_SLD.sym, x, y, 2.6); pen.line(PG_SLD.sym, x - 1, y - 2.5, x - 1, y - 4); pen.line(PG_SLD.sym, x + 1, y - 2.5, x + 1, y - 4); pen.dot(PG_SLD.sym, x - 1, y - 4, 0.35); pen.dot(PG_SLD.sym, x + 1, y - 4, 0.35); }, "หม้อแปลงกระแส (สายเมนผ่านวงแหวน)", "CT"],
    [(x, y) => { pen.circle(PG_SLD.sym, x, y, 3.3); pen.text(PG_SLD.txt, x, y, 1.9, "kWh", { align: 1, valign: 2 }); }, "มิเตอร์ไฟฟ้า", "kWh METER"],
    [(x, y) => { pen.line(PG_SLD.pe, x, y + 3.5, x, y + 0.6); pgSym.ground(pen, x, y + 0.6); }, "หลักดิน", "EARTH ROD"],
    [(x, y) => pgSym.utility(pen, x, y, 3.2), "ระบบไฟฟ้าของการไฟฟ้า", "UTILITY GRID"],
    [(x, y) => { pen.line(DL("dcp"), x - 9, y, x - 1.4, y); pen.circle(PG_TBL.line, x, y, 1.4); pen.line(DL("dcp"), x + 1.4, y, x + 9, y); }, "หัวต่อสาย PV", "MC4 CONNECTOR"],
  ]);
  return S.doc.build();
}

/* ==================================================================
   ผังวางแผง (PV MODULE LAYOUT) — พื้นขาว ไม่มีภาพดาวเทียม
   กลุ่มแผง = แผงที่ติดกัน (ห่างไม่เกิน ~20% ของแผง) ในชุดแผงเดียวกัน · ป้าย "แถว x แผงต่อแถว = จำนวน" กลางกลุ่ม
   ================================================================== */
function dsGroups(panels) {
  const n = panels.length, par = panels.map((_, i) => i);
  const find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  const by = {};
  panels.forEach((p, i) => { const k = p.roofId + "|" + p.blk + "|" + (p.side || ""); (by[k] = by[k] || []).push(i); });
  const ab = new Array(n);
  Object.keys(by).forEach((key) => {
    const ids = by[key], p0 = panels[ids[0]];
    /* แกนแผงบนผัง (ครึ่งเวกเตอร์กว้าง/ลึก ×2) — หลังคาเอียง+ชุดหมุน แกนสองแกนบนผังอาจไม่ตั้งฉาก จึงแก้สมการ 2×2 */
    const ux = 2 * p0.u.x, uz = 2 * p0.u.z, vx = 2 * p0.v.x, vz = 2 * p0.v.z;
    const det = ux * vz - uz * vx;
    if (Math.abs(det) < 1e-9) return;
    ids.forEach((i) => {
      const p = panels[i];
      ab[i] = [(p.cx * vz - p.cz * vx) / det, (ux * p.cz - uz * p.cx) / det];
    });
    const grid = {};
    ids.forEach((i) => { const c = Math.round(ab[i][0]) + "," + Math.round(ab[i][1]); (grid[c] = grid[c] || []).push(i); });
    ids.forEach((i) => {
      const a = ab[i], ca = Math.round(a[0]), cb = Math.round(a[1]);
      for (let da = -2; da <= 2; da++) for (let db = -2; db <= 2; db++) {
        (grid[(ca + da) + "," + (cb + db)] || []).forEach((j) => {
          if (j <= i) return;
          const d0 = Math.abs(ab[j][0] - a[0]), d1 = Math.abs(ab[j][1] - a[1]);
          if ((d1 < 0.4 && d0 < 1.2) || (d0 < 0.4 && d1 < 1.2)) par[find(j)] = find(i);
        });
      }
    });
  });
  const G = {};
  panels.forEach((p, i) => { if (!ab[i]) return; const r = find(i); (G[r] = G[r] || []).push(i); });
  const cnt = (vals) => { const s = vals.slice().sort((x, y) => x - y); let c = s.length ? 1 : 0; for (let i = 1; i < s.length; i++) if (s[i] - s[i - 1] > 0.5) c++; return c; };
  return Object.keys(G).map((r) => {
    const ids = G[r], p0 = panels[ids[0]];
    const cols = cnt(ids.map((i) => ab[i][0])), rows = cnt(ids.map((i) => ab[i][1]));
    return { ids, roofId: p0.roofId, n: ids.length, rows, cols, rect: rows * cols === ids.length,
      cx: ids.reduce((t, i) => t + panels[i].cx, 0) / ids.length, cz: ids.reduce((t, i) => t + panels[i].cz, 0) / ids.length,
      u: p0.u, v: p0.v };
  });
}
function dsPanelSheet(st, job, media) {
  media = media || {};
  const P = dsPlan(st, job, media, "PANEL", { panels: "full", img: true });   // มีภาพพื้นหลังแบบผังติดตั้ง (ผู้ใช้ขอ)
  P.doc.layer("PG-GRP-BG", 255, "CONTINUOUS", 0);   // พื้นขาวรองตัวเลขกลุ่ม
  dsPlanHead(P, "PV MODULE LAYOUT");
  const k = P.k, doc = P.doc, panels = P.foot.panels || [];
  const G = dsGroups(panels);
  G.forEach((g) => {
    const s = g.rect ? g.rows + "x" + g.cols + "=" + g.n : String(g.n);
    let ang = Math.atan2(-g.u.z, g.u.x) / P3_DEG;
    if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    const wP = g.cols * 2 * Math.hypot(g.u.x, g.u.z) / k, hP = g.rows * 2 * Math.hypot(g.v.x, g.v.z) / k;   // มม.บนกระดาษ
    const h = Math.min(2.6, wP * 0.85 / (s.length * 0.6), hP * 0.5, 2 * Math.hypot(g.v.x, g.v.z) / k * 0.55);
    /* จำนวนแถวคู่ = จุดกลางกลุ่มตกบนรอยต่อแถวพอดี (เส้นขอบแผงขีดทับตัวหนังสือ) → เลื่อนไปกลางแถวแผง */
    const sh = g.rows % 2 === 0 ? 1 : 0;
    if (h < 1.0) return;
    /* พื้นขาวรองตัวเลข ไม่ให้เส้นแผงขีดทับ (ผู้ใช้ขอ) — สี่เหลี่ยมหมุนตามแนวกลุ่ม */
    const tx = g.cx + g.v.x * sh, ty = -(g.cz + g.v.z * sh);
    const hw = (s.length * 0.56 * h / 2 + 0.6) * k, hh = (h / 2 + 0.5) * k, ra = ang * P3_DEG, ca = Math.cos(ra), sa = Math.sin(ra);
    const c = (u, v) => [tx + u * ca - v * sa, ty + u * sa + v * ca];
    doc.solid("PG-GRP-BG", c(-hw, -hh), c(hw, -hh), c(hw, hh), c(-hw, hh));
    doc.text(DL("grp"), tx, ty, h * k, s, { align: 1, valign: 2, rot: ang });
  });
  /* ชื่อหลังคาเหนือขอบบนของหลังคานั้น */
  const wp = +st.wp || 650, rows = [["ROOF", "GROUP", "MODULE", "kWp"]];
  let tot = 0;
  (st.roofs || []).forEach((roof, i) => {
    const mine = panels.filter((p) => p.roofId === roof.id);
    if (!mine.length) return;
    const nm = ((roof.name || "").trim() || ("ROOFTOP " + (i + 1))).toUpperCase();
    let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    mine.forEach((p) => p.pts.forEach((q) => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, -q[1]); }));
    doc.text(DL("tag"), (x0 + x1) / 2, y1 + 2.2 * k, 2.4 * k, nm, { align: 1, valign: 1 });
    tot += mine.length;
    rows.push([nm, G.filter((g) => g.roofId === roof.id).length, mine.length, (mine.length * wp / 1000).toFixed(2)]);
  });
  rows.push(["TOTAL", G.length, tot, (tot * wp / 1000).toFixed(2)]);
  const M0 = (() => { try { return p3SldModel(st, job, media.design); } catch (e) { return null; } })();
  dsRight(P, rows, [2.2, 1, 1.1, 1.1], [
    "ตัวเลขกลางกลุ่ม = จำนวนแถว x แผงต่อแถว = จำนวนแผง (กลุ่มที่ไม่เป็นสี่เหลี่ยมบอกจำนวนแผงอย่างเดียว)",
    "แผง " + (M0 ? M0.panel.model + " " : "") + wp + " Wp · รวม " + tot + " แผง = " + (tot * wp / 1000).toFixed(2) + " kWp",
    "ตำแหน่งแผงอ้างอิงแบบ 3D — ตรวจระยะห่างขอบหลังคา/สิ่งกีดขวางที่หน้างานก่อนวางราง",
  ], [0, 1, 1, 1]);
  /* ตัวใหญ่ใต้ตาราง แบบแผ่นจริง (TOTAL ... MODULE) */
  P.pen.text(PG_TBL.txt, P.tbX, P.V.wide ? P.tbTop + 3 : P.AR.y1 - 48, PG_TS.head, "TOTAL PV MODULE  " + tot + " PCS.  (" + (tot * wp / 1000).toFixed(2) + " kWp)");
  return doc.build();
}

/* ==================================================================
   ผังติดตั้งรางไฟ / ท่อน้ำ / ทางเดิน / บันไดลิง+ราวกันตก — ภาพดาวเทียมจาง + หลังคา + แผงจาง + รายการไฮไลต์
   ทุกเส้นมีป้ายรหัส ตารางขวาบอกขนาด/ความยาว (วัดจากแบบ 3D ชุดเดียวกับ BOQ)
   ================================================================== */
function dsObs(st, t) { return (st.obstacles || []).filter((o) => o && o.p3sType === t); }
function dsTraySheet(st, job, media) {
  const P = dsPlan(st, job, media, "TRAY", { img: true });
  dsPlanHead(P, "INSTALLATION FOR CABLE TRAY");
  const obs = dsObs(st, "tray");
  const kind = obs.every((o) => (+o.d || 0.1) >= 0.15) ? "perf" : "way";
  const rows = [["NO.", "SIZE", "LENGTH", "BENDS"]];
  let tot = 0;
  obs.forEach((o, i) => {
    const pts = dsPath(o), L = dsLen(pts), w = +o.d || 0.1;
    P.doc.pline(DL("tray"), pts, false, Math.max(w, 0.45 * P.k));
    dsTag(P, pts, "T" + (i + 1));
    tot += L;
    rows.push(["T" + (i + 1), dsTrayName(Math.round(w * 1000), kind), L.toFixed(1) + " m.", dsBends(pts) || "-"]);
  });
  rows.push(["TOTAL", obs.length + " RUN", tot.toFixed(1) + " m.", ""]);
  dsRight(P, rows, [0.7, 3.2, 1.1, 0.8], [
    "รางวางบน RAIL ขวางยึดด้วย L-FEET ทุกประมาณ 1.2 ม. — ไม่ยึดรางกับแผ่นหลังคาโดยตรง",
    "รางเหล็กชุบกัลวาไนซ์มีฝาปิด ต่อประสานลงดินทั้งแนว (ดูแบบระบบต่อลงดิน)",
    "ความยาวในตารางวัดจากแบบ 3D — ตรวจระยะจริงที่หน้างานก่อนสั่งของ",
  ], [1, 0, 1, 1]);
  return P.doc.build();
}
function dsWaterSheet(st, job, media) {
  const P = dsPlan(st, job, media, "WATER", { img: true });
  dsPlanHead(P, "INSTALLATION FOR WATER PIPE");
  const obs = dsObs(st, "pipe"), k = P.k;
  const rows = [["NO.", "PIPE", "LENGTH", "TAPS"]];
  let tot = 0, taps = 0;
  obs.forEach((o, i) => {
    const pts = dsPath(o), L = dsLen(pts), mm = Math.round((+o.d || 0.025) * 1000);
    P.doc.pline(DL("pipe"), pts, false);
    (o.taps || []).forEach((t) => {
      const x = (+o.x || 0) + (+t.x || 0), y = -((+o.z || 0) + (+t.z || 0)), r = 1.3 * k;
      P.doc.circle(DL("tap"), x, y, r);
      P.doc.line(DL("tap"), x - r, y, x + r, y); P.doc.line(DL("tap"), x, y - r, x, y + r);
    });
    dsTag(P, pts, "P" + (i + 1));
    tot += L; taps += (o.taps || []).length;
    rows.push(["P" + (i + 1), "PPR " + mm + " mm. (" + (DS_PPR[mm] || mm + " mm.") + ")", L.toFixed(1) + " m.", (o.taps || []).length || "-"]);
  });
  rows.push(["TOTAL", obs.length + " LINE", tot.toFixed(1) + " m.", taps || "-"]);
  dsRight(P, rows, [0.7, 2.6, 1.2, 0.8], [
    "ท่อ PPR วางบน RAIL ใต้แผง ยึดด้วยแคลมป์ทุกประมาณ 1.2 ม.",
    "ก๊อกบอลสนามสำหรับล้างแผง (สัญลักษณ์วงกลมบนท่อ) · ตรงก๊อกเว้นไม่วางแผงทับ",
    "ต่อจากจุดจ่ายน้ำของอาคาร — ตรวจตำแหน่งต้นทางและแรงดันน้ำที่หน้างาน",
  ], [1, 0, 1, 1]);
  return P.doc.build();
}
function dsWalkSheet(st, job, media) {
  const P = dsPlan(st, job, media, "WALK", { img: true });
  dsPlanHead(P, "INSTALLATION FOR WALKWAY");
  const obs = dsObs(st, "walkway");
  const B = window.BOQ || {};
  let sl = 2.44;
  try { sl = B.walkLenOf ? +B.walkLenOf(job && job.boq) || 2.44 : 2.44; } catch (e) { sl = 2.44; }
  const rows = [["NO.", "WIDTH", "LENGTH", "SHEET"]];
  let tot = 0, sh = 0;
  obs.forEach((o, i) => {
    const pts = dsPath(o), L = dsLen(pts), w = +o.d || 0.3;
    P.doc.pline(DL("walk"), pts, false, Math.max(w, 0.6 * P.k));
    dsTag(P, pts, "W" + (i + 1));
    const n = Math.ceil(L / sl - 1e-9);
    tot += L; sh += n;
    rows.push(["W" + (i + 1), Math.round(w * 1000) + " mm.", L.toFixed(1) + " m.", n]);
  });
  rows.push(["TOTAL", obs.length + " RUN", tot.toFixed(1) + " m.", sh]);
  dsRight(P, rows, [0.7, 1.6, 1.4, 1], [
    "ทางเดินตะแกรง FRP วางบน RAIL ขวาง ยึดด้วย END CLAMP — แผ่นยาว " + sl + " ม. (จำนวนแผ่นปัดขึ้นต่อแนว)",
    "แนวทางเดินต้องเข้าถึงแผงทุกกลุ่ม อินเวอร์เตอร์ และจุดล้างแผงได้",
    "ความยาวในตารางวัดจากแบบ 3D — ตรวจระยะจริงที่หน้างานก่อนสั่งของ",
  ], [1, 1, 1, 1]);
  return P.doc.build();
}
function dsSafetySheet(st, job, media) {
  const lad = dsObs(st, "ladder"), rail = dsObs(st, "rail");
  const P = dsPlan(st, job, media, "SAFETY", { img: true });
  dsPlanHead(P, lad.length && rail.length ? "INSTALLATION FOR LADDER & GUARD RAIL" : lad.length ? "INSTALLATION FOR SERVICE LADDER" : "INSTALLATION FOR GUARD RAIL");
  const k = P.k, doc = P.doc;
  const rows = [["NO.", "ITEM", "SIZE"]];
  lad.forEach((o, i) => {
    const x = +o.x || 0, z = +o.z || 0, w = Math.max(0.45, +o.w || 0.6), d = 0.45;
    const a = (+o.rot || 0) * P3_DEG, ca = Math.cos(a), sa = Math.sin(a);
    const at = (u, v) => [x + u * ca - v * sa, -(z + u * sa + v * ca)];
    doc.pline(DL("lad"), [at(-w / 2, -d / 2), at(w / 2, -d / 2), at(w / 2, d / 2), at(-w / 2, d / 2)], true);
    for (let j = 1; j < 3; j++) doc.line(DL("lad"), at(-w / 2, -d / 2 + d * j / 3)[0], at(-w / 2, -d / 2 + d * j / 3)[1], at(w / 2, -d / 2 + d * j / 3)[0], at(w / 2, -d / 2 + d * j / 3)[1]);
    const e = dsEaveAt(st, x, z);
    const H = e && e.d < 5 ? e.y : (+o.h || 0);
    dsTagAt(P, x, -z, 0.7071, 0.7071, "L" + (i + 1));
    rows.push(["L" + (i + 1), "CAT LADDER + SAFETY CAGE", H ? "H " + H.toFixed(1) + " m." : "-"]);
  });
  let tot = 0;
  rail.forEach((o, i) => {
    const pts = dsPath(o), L = dsLen(pts);
    doc.pline(DL("rail"), pts, false);
    pts.forEach((p) => doc.circle(DL("rail"), p[0], p[1], 0.5 * k));
    dsTag(P, pts, "R" + (i + 1));
    tot += L;
    rows.push(["R" + (i + 1), "GUARD RAIL H 1.1 m.", "L " + L.toFixed(1) + " m."]);
  });
  rows.push(["TOTAL", (lad.length ? lad.length + " LADDER" : "") + (lad.length && rail.length ? " · " : "") + (rail.length ? rail.length + " RAIL" : ""),
    rail.length ? "L " + tot.toFixed(1) + " m." : ""]);
  dsRight(P, rows, [0.7, 2.6, 1.4], [
    "บันไดลิงเหล็กชุบกัลวาไนซ์ ตั้งจากพื้นถึงขอบหลังคา ราวจับยื่นเหนือขอบ 1.1 ม. มีกรงกันตกตั้งแต่ระดับ 2.4 ม.",
    "ราวกันตกสูง 1.1 ม. มีราวกลาง เสาทุกระยะไม่เกิน 2 ม. และทุกมุม",
    "ความสูงบันไดคิดจากความสูงหลังคาในแบบ 3D — วัดจริงที่หน้างานก่อนสั่งผลิต",
  ], [1, 0, 1]);
  return doc.build();
}

/* ==================================================================
   รูปการเดินสายสตริง (PV STRING WIRING DETAIL) — แถวเดียว / สองแถว ตามจำนวนแผงต่อสตริงที่จัดจริง
   แผงที่ 1 อยู่ขวาสุด (ฝั่งตู้ DC) · ขั้ว − ของแผงหนึ่งต่อขั้ว + ของแผงถัดไป · ปลายสองข้างออกไปตู้ DC
   สายยาวกว่าแถวที่วาดได้ (> 14 แผง/แถว) ย่อช่วงกลางเป็น "…"
   ================================================================== */
function dsShow(a, b, max) {
  const n = b - a + 1, out = [];
  if (n <= max) { for (let i = a; i <= b; i++) out.push(i); return out; }
  const h = Math.floor((max - 1) / 2);
  for (let i = 0; i < h; i++) out.push(a + i);
  out.push(null);
  for (let i = b - (max - 2 - h); i <= b; i++) out.push(i);
  return out;
}
/* แผงหนึ่งใบแนวตั้ง (x, y = มุมล่างซ้าย) · up = ขั้วออกขอบบน · negR = ขั้วลบอยู่ขวา · คืนปลายขั้ว */
function dsModule(pen, x, y, w, h, label, up, negR) {
  /* หน้าแผงแบบเดียวกับรูปแผง (กรอบคู่ + เซลล์ 6 × 12) · ชื่อแผงอยู่นอกแผงฝั่งที่ไม่มีสาย ไม่ทับเซลล์ */
  pgModFace(pen, DL("mod"), DL("cell"), x, y, w, h, 6, 12, false);
  const th = Math.min(PG_TS.cell, w / (label.length * 0.62));
  pen.text(PG_TBL.txt, x + w / 2, up ? y - 1.2 : y + h + 1.2, th, label, { align: 1, valign: up ? 3 : 1 });
  const yl = up ? y + h : y, d = up ? 4 : -4;
  const xl = x + w * 0.3, xr = x + w * 0.7, xn = negR ? xr : xl, xp = negR ? xl : xr;
  pen.line(DL("dcn"), xn, yl, xn, yl + d); pen.line(DL("dcp"), xp, yl, xp, yl + d);
  const ty = yl + d / 2;
  pen.text(PG_TBL.txt, xn + (negR ? 0.8 : -0.8), ty, 1.7, "-", { align: negR ? 0 : 2, valign: 2 });
  pen.text(PG_TBL.txt, xp + (negR ? -0.8 : 0.8), ty, 1.7, "+", { align: negR ? 2 : 0, valign: 2 });
  return { n: [xn, yl + d], p: [xp, yl + d] };
}
function dsJump(pen, a, b, dashed) {
  pen.line(dashed ? DL("flow") : DL("jmp"), a[0], a[1], b[0], b[1]);
  pen.dot(DL("jmp"), a[0], a[1], 0.45); pen.dot(DL("jmp"), b[0], b[1], 0.45);
}
/* แถวแผงจาก list (ตัวเลข/null) เรียงจาก x เริ่ม ทิศ dir (+1 ขวา · −1 ซ้าย) */
function dsRow(pen, list, xStart, dir, y, pw, ph, gap, up, negR) {
  return list.map((num, i) => {
    const x = dir > 0 ? xStart + i * (pw + gap) : xStart - (i + 1) * pw - i * gap;
    if (num == null) {
      pen.text(PG_TBL.txt, x + pw / 2, y + ph / 2, PG_TS.head, "...", { align: 1, valign: 2 });
      return null;
    }
    return Object.assign({ x }, dsModule(pen, x, y, pw, ph, "PV " + num, up, negR));
  });
}
function dsChain(pen, T, from, to) {   // ต่อขั้ว from (−) ไป to (+) ของตัวถัดไป ข้าม "…" ด้วยเส้นประ
  for (let i = 0; i < T.length - 1; i++) {
    const a = T[i];
    if (!a) continue;
    const b = T[i + 1] || T[i + 2];
    if (b) dsJump(pen, a[from], b[to], !T[i + 1]);
  }
}
function dsStrDetSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "STRDET", null);
  const pen = S.pen, A = S.A, T = PG_TBL.txt;
  /* ชื่อแผ่นอยู่มุมขวาล่าง (ผู้ใช้ย้าย) ด้านบนทั้งแผ่นให้รูปที่ 1/2 */
  pgSheetTitle(pen, A.x1 - 6, A.y0 + 12, "DETAIL PV MODULE STRING", PG_TS.title, 170, 2, null);
  let M = null;
  try { M = p3SldModel(st, job, media.design); } catch (e) { M = null; }
  const SS = (media.design && media.design.strings) || [];
  const cnt = {};
  SS.forEach((s) => { cnt[s.n] = (cnt[s.n] || 0) + 1; });
  const n = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || b - a)[0] || 10;

  /* แถบล่าง: รูปแผง (ซ้าย) · ข้อมูลสตริง + คำอธิบายเส้น (ถัดไปทางขวา) — ผู้ใช้ย้ายลงมาจากมุมซ้ายบน
     ด้านบนทั้งแผ่นให้รูปที่ 1/2 อยู่กลาง */
  const lx = A.x0 + 4, sx = A.x0 + 104, lw = 110, bandTop = A.y0 + 92;
  const pairs = [["PV MODULE", M ? M.panel.model + " " + M.panel.wp + " Wp" : "-"],
    ["STRING", typeof p3StrSum === "function" ? p3StrSum(SS) : SS.length + " STRING"],
    ["DC CABLE", (M && M.pro && M.pro.dcCable) || "PV1-F 1x4 Sq.mm. 1.5kV DC"]];
  if (M && M.pro && M.pro.vocMax) pairs.push(["Voc @" + M.pro.tMin + "%%dC", M.pro.vocMax + " V (MAX " + M.pro.maxVdc + " V)"]);
  /* ข้อมูลสตริง + LEGEND ลงล่าง ชิดระดับฐานรูปแผงซ้าย (ผู้ใช้ย้ายลง) */
  const specTop = A.y0 + 22 + (pairs.length + 1) * 4.6;
  const used = pgSpecBlock(pen, sx, specTop, lw, "STRING DATA", pairs, { rh: 4.6, th: PG_TS.cell, kw: 0.3 });
  const lgx = sx + lw + 12;
  let ly = specTop - 2;
  pen.text(T, lgx, ly, PG_TS.body, "LEGEND");
  [[DL("dcp"), "สาย DC ขั้วบวก (+) ไปตู้ DC"], [DL("dcn"), "สาย DC ขั้วลบ (-) ไปตู้ DC"], [DL("jmp"), "สายต่อระหว่างแผง (สายของแผงเอง)"],
    [DL("flow"), "แผงช่วงกลางที่ไม่ได้วาด (ต่อแบบเดียวกัน)"]].forEach((r, i) => {
    const y = ly - 5 - i * 4.6;
    pen.line(r[0], lgx, y, lgx + 14, y);
    pen.text(T, lgx + 17, y, PG_TS.cell, r[1], { valign: 2 });
  });
  const ps = ((window.BOQ && window.BOQ.PANELS) || []).find((p) => p.model === (st.sys || {}).panelModel) || {};
  pgModuleDetail(pen, lx + 6, A.y0 + 20, 56, {
    wMm: Math.round((+ps.width || 1.134) * 1000), hMm: Math.round((+ps.length || 2.382) * 1000), tMm: +ps.frame || 30,
    caption: "แผง " + (M ? M.panel.wp : st.wp || "") + " วัตต์",
  });

  /* บน: รูปที่ 1 แถวเดียว · รูปที่ 2 สองแถว — เต็มกว้างแผ่น จัดกลางทั้งแนวนอน/แนวตั้งเหนือแถบล่าง (ผู้ใช้: ย้ายอยู่กลางๆ จัดสวยๆ) */
  const X0 = A.x0 + 6, X1 = A.x1 - 36, gap = 3;
  let XR = X1;                                   // ขอบขวาของแถวแผง (คำนวณใหม่หลังรู้ขนาดแผง ให้แถวอยู่กลาง)
  const cap = (y, s) => {
    const xc = (X0 + X1) / 2;
    pen.text(T, xc, y, PG_TS.head, s, { align: 1, valign: 1 });
    const w = pgTextW(s, PG_TS.head) + 3;
    pen.line(T, xc - w / 2, y - 1.2, xc + w / 2, y - 1.2);
  };
  const toBox = (p, s, L) => {
    pen.line(L, p[0], p[1], XR + 4, p[1]);
    pen.text(T, XR + 5, p[1], PG_TS.cell, s, { valign: 2 });
  };
  /* รูปที่ 1 */
  const l1 = dsShow(1, n, 14);
  /* แผงรูปที่ 1 กับรูปที่ 2 ขนาดเท่ากัน (เดิมคิดแยก รูปที่ 1 แผงเล็กกว่า — ผู้ใช้ว่าบนล่างไม่เท่ากัน) */
  const m = Math.ceil(n / 2);
  const lt = dsShow(1, m, 12), lb = dsShow(m + 1, n, 12), gapR = 12;
  const yHi = A.y1 - 14, yLo = bandTop + 6 + 11;          // ขอบบนแถวแรก · ขอบล่างคำบรรยายรูปที่ 2
  const phMax = (yHi - yLo - 32 - gapR) / 3;
  const pw1 = Math.min(20, (X1 - X0 - gap * (l1.length - 1)) / l1.length, (X1 - X0 - gap * (lt.length - 1)) / lt.length, phMax / 2.05);
  const ph1 = Math.min(40, pw1 * 2.05);
  const nMax = Math.max(l1.length, lt.length), rowW = nMax * pw1 + (nMax - 1) * gap;
  XR = (X0 + X1) / 2 + rowW / 2;
  const off = Math.max(0, (yHi - yLo - (ph1 * 3 + 32 + gapR)) / 2);
  const y1 = yHi - off - ph1;
  const R1 = dsRow(pen, l1, XR, -1, y1, pw1, ph1, gap, false, false);
  dsChain(pen, R1, "n", "p");
  toBox(R1[0].p, "To DC Box (+)", DL("dcp"));
  const last = R1[R1.length - 1];
  pen.line(DL("dcn"), last.n[0], last.n[1], last.n[0], last.n[1] - 5);
  toBox([last.n[0], last.n[1] - 5], "To DC Box (-)", DL("dcn"));
  cap(y1 - 18, "รูปที่ 1  การเดินสาย PV STRING แบบแถวเดียว  (" + n + " แผง / สตริง)");

  /* รูปที่ 2 — แถวบน 1..m (ขวา→ซ้าย) แถวล่าง m+1..n (ซ้าย→ขวา) · จัดกลางแผ่นของตัวเอง (ผู้ใช้: เดิมชิดขวาตามรูปที่ 1) */
  const pw2 = pw1, ph2 = ph1, top0 = y1 - 32;
  XR = (X0 + X1) / 2 + (lt.length * pw2 + (lt.length - 1) * gap) / 2;
  const yT = top0 - ph2, yB = yT - gapR - ph2;
  const RT = dsRow(pen, lt, XR, -1, yT, pw2, ph2, gap, false, false);
  const xL = XR - lt.length * pw2 - (lt.length - 1) * gap;
  const RB = dsRow(pen, lb, xL, 1, yB, pw2, ph2, gap, true, true);
  dsChain(pen, RT, "n", "p");
  dsChain(pen, RB, "n", "p");
  const tl = RT[RT.length - 1], bl = RB[0];
  if (tl && bl) dsJump(pen, tl.n, bl.p);
  toBox(RT[0].p, "To DC Box (+)", DL("dcp"));
  const br = RB[RB.length - 1];
  if (br) toBox(br.n, "To DC Box (-)", DL("dcn"));
  cap(yB - 10, "รูปที่ 2  การเดินสาย PV STRING แบบสองแถว  (" + m + " + " + (n - m) + " แผง)");
  if (Object.keys(cnt).length > 1)
    pen.text(T, sx, A.y0 + 6, PG_TS.cell, "สตริงขนาดอื่นในงานนี้ต่อแบบเดียวกัน — จำนวนแผงต่อสตริงจริงดูแผ่น STRING LAYOUT", {});
  return S.doc.build();
}

/* ==================================================================
   ระบบต่อลงดิน (GROUNDING DIAGRAM FOR SOLAR SYSTEM)
   ฝั่ง PV (โครงแผง · PE BAR ตู้ DC · ตัวอินเวอร์เตอร์ · รางไฟ/บันได/ราวกันตก) → หลักดิน PV ปักแยก ไม่ต่อเข้า MET
   ฝั่ง AC (PE ตู้ AC · AC SPD · N-PE ของ MDB) → MET → หลักดินระบบ — ตรงกับ SLD (pgSldPro)
   ================================================================== */
function dsGroundSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "GROUND", "GROUNDING DIAGRAM FOR SOLAR SYSTEM");
  const pen = S.pen, A = S.A, T = PG_TBL.txt, E = DL("earth"), Q = DL("eq"), F = DL("flow");
  pgSldLayers(S.doc);
  let M = null;
  try { M = p3SldModel(st, job, media.design); } catch (e) { M = null; }
  const nInv = M ? M.units.length : 1;
  const eCu = (M && M.pro && M.pro.earthCu) || +(/(\d+)\s*sq/i.exec((M && M.mainCable && M.mainCable[1]) || "") || [])[1] || 10;
  const bond = "THW(G) 1x6 Sq.mm.", main = "THW(G) 1x" + eCu + " Sq.mm.";
  const head = (x, y, s) => { pen.text(T, x, y, PG_TS.body, s, { align: 1, valign: 1 }); };
  const lug = (x, y) => pen.dot(E, x, y, 0.7);
  const busY = A.y0 + 112;

  /* ── แผงบนโครง (2 แถว × 4 แผง) · RAIL 2 เส้นต่อแถว · ทุกแถวต่อ lug ลงสายประสาน ── */
  const ax = A.x0 + 18, pw = 15, ph = 26, g = 2;
  const rowsY = [busY + 60, busY + 60 + ph + 12];
  const trunkX = ax - 8;
  rowsY.forEach((ry) => {
    for (let i = 0; i < 4; i++) {
      const x = ax + i * (pw + g);
      pgModFace(pen, DL("mod"), DL("cell"), x, ry, pw, ph, 6, 12, false);
    }
    [0.25, 0.75].forEach((f) => {
      const y = ry + ph * f, x1 = ax + 4 * pw + 3 * g + 3;
      pen.line(Q, ax - 3, y, x1, y);
      lug(ax - 3, y);
      pen.line(E, ax - 3, y, trunkX, y);
    });
  });
  pen.line(E, trunkX, rowsY[1] + ph * 0.75, trunkX, busY);
  head(ax + 2 * pw + 1.5 * g, rowsY[1] + ph + 5, "GROUNDING FOR MOUNTING STRUCTURE");
  /* ป้ายจุดต่อ lug ใต้แถวล่าง (ด้านขวาเป็นตู้ DC ไม่มีที่) */
  pen.line(T, ax - 3, rowsY[0] + ph * 0.25, ax - 3, rowsY[0] - 3.2);
  pen.text(T, ax - 3, rowsY[0] - 4, PG_TS.cell, "EARTHING CLIP / GROUNDING LUG", { valign: 3 });
  pen.text(T, trunkX - 1.5, (busY + rowsY[0]) / 2, PG_TS.cell, bond, { align: 1, valign: 0, rot: 90 });

  /* ── ตู้ DC + อินเวอร์เตอร์ (ฝั่ง PV) ── */
  const box = (x, y, w, h, title, sub) => {
    pen.rect(Q, x, y, w, h);
    head(x + w / 2, y + h + 4, title);
    if (sub) pen.text(T, x + w / 2, y + h + 0.8, PG_TS.cell, sub, { align: 1, valign: 1 });
  };
  const peBar = (x, y, w) => {
    pen.rect(E, x, y, w, 2.4);
    for (let i = 1; i < 5; i++) pen.circle(E, x + w * i / 5, y + 1.2, 0.45);
    pen.text(T, x + w / 2, y + 3.4, PG_TS.cell * 0.85, "PE BAR", { align: 1, valign: 1 });
  };
  const dX = A.x0 + 108, dY = busY + 72;
  box(dX, dY, 32, 42, "DC BOX", nInv > 1 ? "x " + nInv : "");
  pgSym.spd(pen, dX + 12, dY + 26);
  pen.line(E, dX + 12, dY + 22, dX + 12, dY + 6.4);
  peBar(dX + 3, dY + 4, 26);
  pen.line(E, dX + 16, dY + 4, dX + 16, busY);
  const iX = dX + 52, iY = dY;
  box(iX, iY, 38, 42, "INVERTER", nInv > 1 ? "x " + nInv : "");
  pgSym.inverter(pen, iX + 19, iY + 24, 26, 22);
  lug(iX + 19, iY);
  pen.line(E, iX + 19, iY, iX + 19, busY);
  pen.text(T, iX + 20.5, (busY + iY) / 2, PG_TS.cell, "BODY EARTH", { valign: 2 });
  /* ทางไฟ (ประ) แผง → ตู้ DC → อินเวอร์เตอร์ → ตู้ AC — ให้เห็นว่าแต่ละชิ้นอยู่ตรงไหนของระบบ */
  pen.line(F, ax + 4 * pw + 3 * g + 3, rowsY[1] + ph * 0.5, dX, dY + 32);
  pen.line(F, dX + 32, dY + 32, iX, iY + 32);

  /* ── บัสดิน PV → หลักดิน PV ── */
  const busX1 = iX + 38;
  pen.line(E, trunkX, busY, busX1, busY);
  pen.text(T, trunkX + 2, busY + 1.4, PG_TS.cell, "PV EARTH BUS  " + main, { valign: 1 });
  const rX = trunkX + 22, rY = busY - 32;
  pen.line(E, rX, busY, rX, rY);
  pgSym.ground(pen, rX, rY);
  ["PV EARTH ROD (SEPARATE)", "COPPER BONDED 5/8\" x 2.4 m.", "R <= 5 OHM"].forEach((s, i) =>
    pen.text(T, rX + 5, rY + 6 - i * 3.6, PG_TS.cell, s, { valign: 2 }));

  /* ── ฝั่ง AC: ตู้ AC (SOLAR) + MDB → MET → หลักดินระบบ ── */
  const cX = busX1 + 26, cY = dY - 4;
  box(cX, cY, 36, 50, "AC BOX (SOLAR)", "");
  pgSym.spd(pen, cX + 12, cY + 30);
  pen.text(T, cX + 16, cY + 37, PG_TS.cell * 0.85, "AC SPD", { valign: 2 });
  pen.line(E, cX + 12, cY + 26, cX + 12, cY + 6.4);
  peBar(cX + 4, cY + 4, 28);
  const mX = cX + 50, mW = Math.min(52, A.x1 - 6 - mX), mY = cY - 6;
  box(mX, mY, mW, 62, "MDB (EXISTING)", "");
  pen.line(Q, mX, mY + 48, mX + mW, mY + 48);
  pen.line(Q, mX + mW / 2, mY + 48, mX + mW / 2, mY + 62);
  peBar(mX + 6, mY + 4, mW - 12);
  pen.line(F, iX + 38, iY + 32, cX, cY + 40);
  pen.line(F, cX + 36, cY + 40, mX, mY + 40);
  const metY = busY, metX0 = cX + 6, metX1 = mX + mW - 6;
  pen.rect(E, metX0, metY - 1.4, metX1 - metX0, 2.8);
  pen.text(T, (metX0 + metX1) / 2, metY - 4.4, PG_TS.cell, "MET (MAIN EARTH TERMINAL)", { align: 1, valign: 2 });
  pen.line(E, cX + 18, cY + 4, cX + 18, metY + 1.4);
  pen.line(E, mX + mW / 2, mY + 4, mX + mW / 2, metY + 1.4);
  pen.text(T, cX + 19.5, (cY + metY) / 2, PG_TS.cell, main, { valign: 0, rot: 90 });
  const sX = (metX0 + metX1) / 2 + 10, sY = metY - 34;
  pen.line(E, sX, metY - 1.4, sX, sY);
  pgSym.ground(pen, sX, sY);
  ["EARTH ROD (SYSTEM)", "COPPER BONDED 5/8\" x 2.4 m.", "R <= 5 OHM"].forEach((s, i) =>
    pen.text(T, sX + 5, sY + 6 - i * 3.6, PG_TS.cell, s, { valign: 2 }));

  /* ── โลหะบนหลังคา (เฉพาะที่มีในแบบ) → บัสดิน PV ── */
  const metal = [];
  if (dsObs(st, "tray").length) metal.push(["tray", "GROUNDING FOR CABLE TRAY"]);
  if (dsObs(st, "ladder").length) metal.push(["ladder", "GROUNDING FOR LADDER"]);
  if (dsObs(st, "rail").length) metal.push(["rail", "GROUNDING FOR GUARD RAIL"]);
  let mx = rX + 36;
  const top = busY - 26;
  metal.forEach((it) => {
    if (it[0] === "tray") {
      const w = 46, y = top - 14;
      pen.rect(Q, mx, y, w, 7); pen.line(Q, mx, y + 2.2, mx + w, y + 2.2);
      for (let i = 1; i < 12; i++) pen.line(DL("cell"), mx + i * w / 12, y + 3.2, mx + i * w / 12, y + 6);
      lug(mx + 4, y + 7); pen.line(E, mx + 4, y + 7, mx + 4, busY);
      head(mx + w / 2, y - 6, it[1]);
      pen.text(T, mx + w / 2, y - 9.6, PG_TS.cell * 0.85, "BONDING JUMPER " + "ทุกรอยต่อ", { align: 1, valign: 1 });
      mx += w + 16;
    } else if (it[0] === "ladder") {
      const y = top - 36, h = 34;
      pen.line(Q, mx, y, mx, y + h); pen.line(Q, mx + 10, y, mx + 10, y + h);
      for (let i = 1; i < 8; i++) pen.line(Q, mx, y + i * h / 8, mx + 10, y + i * h / 8);
      lug(mx + 10, y + h); pen.line(E, mx + 10, y + h, mx + 10, busY);
      head(mx + 5, y - 6, it[1]);
      mx += 46;
    } else {
      const y = top - 20, w = 40;
      pen.line(Q, mx, y + 14, mx + w, y + 14); pen.line(Q, mx, y + 7, mx + w, y + 7);
      [0, w / 2, w].forEach((d) => pen.line(Q, mx + d, y, mx + d, y + 14));
      lug(mx, y + 14); pen.line(E, mx, y + 14, mx, busY);
      head(mx + w / 2, y - 6, it[1]);
      mx += w + 16;
    }
  });

  dsNoteBlock(pen, cX, A.y0 + 4 + dsNoteH(dsGroundNotes(eCu), A.x1 - 4 - cX), A.x1 - 4 - cX, dsGroundNotes(eCu));
  return S.doc.build();
}
function dsGroundNotes(eCu) {
  return [
    "RAIL ทุกแถวต่อประสานด้วย EARTHING CLIP / GROUNDING LUG แล้วรวมลงบัสดิน PV",
    "ตัวอินเวอร์เตอร์ · PE BAR ตู้ DC (DC SPD) · รางไฟ · บันได · ราวกันตก ลงหลักดิน PV ที่ปักแยกจากระบบไฟฟ้าอาคาร",
    "PE ตู้ AC (AC SPD) และ N-PE ของ MDB ต่อเข้า MET → หลักดินระบบ",
    "สายต่อประสานอุปกรณ์ไม่ต่ำกว่า 6 Sq.mm. · สายลงหลักดิน THW(G) " + eCu + " Sq.mm.",
    "ความต้านทานหลักดินแต่ละชุดไม่เกิน 5 โอห์ม — วัดและบันทึกผลก่อนจ่ายไฟ",
  ];
}

/* ==================================================================
   รายการแผ่นให้ p3PrepSet — คืน { KEY: { key, label, fn } } เฉพาะแผ่นที่มีข้อมูลรองรับ
   ================================================================== */
function dsSheetDefs(st, job, design, imgs) {
  const D = {};
  const add = (key, label, fn) => { D[key] = { key, label, fn }; };
  add("COVER", "ปก", (o) => dsCover(st, job, o));
  add("NOTES", "รายการประกอบแบบ", (o) => dsNotesSheet(st, job, o));
  let n = 0;
  try { n = p3CountAll(st); } catch (e) { n = 0; }
  const withImg = (fn) => (o) => fn(st, job, Object.assign({ imgs }, o));
  if (n) add("PANEL", "ผังวางแผง", withImg(dsPanelSheet));   // ภาพพื้นหลังแบบผังติดตั้ง (ผู้ใช้ขอ)
  if (design && (design.strings || []).length && (st.sys || {}).mode !== "micro")
    add("STRDET", "รูปการเดินสายสตริง", (o) => dsStrDetSheet(st, job, o));
  add("GROUND", "ระบบต่อลงดิน", (o) => dsGroundSheet(st, job, o));
  if (dsObs(st, "tray").length) add("TRAY", "ผังรางไฟ", withImg(dsTraySheet));
  if (dsObs(st, "pipe").length) add("WATER", "ผังท่อน้ำ", withImg(dsWaterSheet));
  if (dsObs(st, "walkway").length) add("WALK", "ผังทางเดิน", withImg(dsWalkSheet));
  if (dsObs(st, "ladder").length || dsObs(st, "rail").length) add("SAFETY", "ผังบันได/ราวกันตก", withImg(dsSafetySheet));
  return D;
}

/* ==================================================================
   PDF ทั้งเล่ม — วาดทุกแผ่นเป็น SVG (ชุดเดียวกับตัวอย่างบนจอ) → ภาพ 170 dpi → หน้า A3 แนวนอน หน้าละแผ่น
   jsPDF โหลดจาก cdnjs ตอนกดครั้งแรก (ตัวเดียวกับ PDF ผังหน้างาน siteplan.jsx)
   ================================================================== */
function dsJsPdf() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => (window.jspdf && window.jspdf.jsPDF ? res(window.jspdf.jsPDF) : rej(new Error("โหลดไลบรารี PDF ไม่ได้")));
    s.onerror = () => rej(new Error("โหลดไลบรารี PDF ไม่ได้ (ต้องต่อเน็ต)"));
    document.head.appendChild(s);
  });
}
async function dsSvgCanvas(svg, W, H) {
  const s = svg.replace(/^<svg([^>]*?) width="[^"]*" height="[^"]*" style="[^"]*"/, '<svg$1 width="' + W + '" height="' + H + '"');
  const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("แปลงแผ่นเป็นภาพไม่ได้")); i.src = url; });
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    g.drawImage(im, 0, 0, W, H);
    return c;
  } finally { URL.revokeObjectURL(url); }
}
async function dsExportPdf(prep, onStep) {
  const JsPDF = await dsJsPdf();
  const pdf = new JsPDF({ orientation: "landscape", unit: "mm", format: "a3", compress: true });
  const DPI = 170, W = Math.round(PG_SHEET.W / 25.4 * DPI), H = Math.round(PG_SHEET.H / 25.4 * DPI);
  const L = prep.sheets;
  for (let i = 0; i < L.length; i++) {
    if (onStep) onStep(i + 1, L.length);
    const c = await dsSvgCanvas(L[i].make(true), W, H);
    if (i) pdf.addPage("a3", "landscape");
    pdf.addImage(c.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, PG_SHEET.W, PG_SHEET.H, undefined, "FAST");
    await new Promise((r) => setTimeout(r, 0));
  }
  p3SaveBlob(pdf.output("blob"), prep.base + "-SHOP-DRAWING.pdf");
  return L.length;
}

Object.assign(window, { DS_SET_EN, DS_SET_GROUP, dsSheetDefs, dsExportPdf, dsCover, dsNotesSheet, dsPanelSheet, dsTraySheet, dsWaterSheet,
  dsWalkSheet, dsSafetySheet, dsStrDetSheet, dsGroundSheet, dsGroups });
