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
  eq: ["DS-EQUIP", 7, 30], flow: ["DS-FLOW", 8, 13], optIn: ["DS-OPT-LEAD", 7, 25], ret: ["DS-DC-RETURN", 7, 35],
  gw: ["DS-GROUND-6", 7, 60], gw16: ["DS-GROUND-16", 7, 70], railD: ["DS-RAIL-HIDDEN", 7, 18], cov: ["DS-COVER", 7, 50], cov2: ["DS-COVER-2", 7, 18],
  covT: ["DS-COVER-TEXT", 7, 25], covC: ["DS-COVER-CO", 7, 25],   // ปกสีดำทั้งหมด (ผู้ใช้ขอ)
};
const DL = (k) => DS_LAY[k][0];
function dsLayers(doc) {
  doc.ltype("PG-DASH", "Dashed __ __ __", [6, -3]);
  doc.ltype("PG-HIDDEN", "Hidden _ _ _", [3, -1.5]); doc.ltype("PG-DOTS", "Dots . . .", [0.8, -0.6]);
  const LT = { flow: "PG-DASH", railD: "PG-HIDDEN", gw16: "PG-DOTS" };
  Object.keys(DS_LAY).forEach((k) => { const L = DS_LAY[k]; doc.layer(L[0], L[1], LT[k] || "CONTINUOUS", L[2]); });
}

/* ── ชื่อแผ่น (ภาษาอังกฤษ) ไว้ใช้บนป้ายเหนือแผ่นในไฟล์รวม + สารบัญ ── */
const DS_SET_EN = {
  COVER: "COVER", NOTES: "GENERAL NOTES & LEGEND", PLAN: "OVERALL LAYOUT", PANEL: "PV MODULE LAYOUT",
  STRING: "STRING LAYOUT", STRDET: "PV STRING WIRING DETAIL", SLD: "SINGLE LINE DIAGRAM", CU: "CONSUMER UNIT CONNECTION", DC: "DC WIRING",
  GROUND: "GROUNDING DIAGRAM", GROUND2: "GROUNDING DETAIL", TRAY: "CABLE TRAY LAYOUT", WATER: "WATER PIPE LAYOUT", WALK: "WALKWAY LAYOUT",
  SAFETY: "LADDER & GUARD RAIL", PHOTO: "SITE PHOTO", MAT: "MATERIAL LIST", MOUNT: "TYPICAL MOUNTING STRUCTURE",
};

/* หมวดของแต่ละแผ่นในไฟล์รวม (pgCombine groups) — แผ่นหมวดเดียวกันอยู่แถว/กรอบเดียวกัน */
const DS_SET_GROUP = {
  COVER: "COVER", NOTES: "COVER", PLAN: "LAYOUT", PANEL: "LAYOUT", STRING: "LAYOUT",
  STRDET: "ELECTRICAL", SLD: "ELECTRICAL", DC: "ELECTRICAL", GROUND: "ELECTRICAL", GROUND2: "ELECTRICAL",
  TRAY: "MECHANICAL", WALK: "MECHANICAL", SAFETY: "MECHANICAL", MOUNT: "MECHANICAL", WATER: "WATER", PHOTO: "SITE", MAT: "SITE",
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
  /* เส้นแผงบางลงตามมาตราส่วน (p3PanelLw · ผู้ใช้ 2026-11-02 "แก้หน้าอื่นด้วย") — นิยามก่อน dsLayers = ใช้ค่านี้ */
  /* แผงทุกแผ่นผังหน้าตาเดียวกับผังติดตั้ง (PG-PANEL: น้ำเงิน ACI 5 เส้นตามมาตราส่วน) — เดิมแผ่นราง/ทางเดิน/บันได/ท่อน้ำเป็นแผงจางสีฟ้า (ผู้ใช้ 2026-11-02 "แผงแบบผังติดตั้ง") */
  doc.layer("DS-PANEL", 5, "CONTINUOUS", p3PanelLw(k));
  doc.layer("DS-PANEL-B", 5, "CONTINUOUS", p3PanelLw(k));
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
    foot.panels.forEach((p) => p3PanelIns(doc, L, p.pts.map((q) => [q[0], -q[1]]), null, k));   // BLOCK PV-PANEL
  }
  const AR = sheet.area, RX1 = AR.x1 - 2;
  return { doc, docRaw, pen: sheet.pen, sheet, AR, V, k, SC: V.SC, foot, RX0: RX1 - P3_PLAN_COL, RX1, RW: P3_PLAN_COL };
}
/* หัวคอลัมน์ขวาของแผ่นผัง (ชื่อแผ่น + มาตราส่วน + เข็มทิศ) + มาตราส่วนเส้นมุมซ้ายล่าง — แบบเดียวกับผังติดตั้ง */
/* o.top (โหมดกว้าง): ชื่อแผ่น + มาตราส่วนไปมุมซ้ายบน แถบล่างว่างให้ตาราง/หมายเหตุ/รูป (ผังวางแผง · ผู้ใช้วาดชี้ 2026-11-02) */
function dsPlanHead(P, title, o) {
  o = o || {};
  const pen = P.pen, AR = P.AR, top = !!(o.top && P.V.wide);
  P.titleTop = top;
  /* โหมดกว้าง: ชื่อแผ่น + มาตราส่วนลงมุมซ้ายล่าง (เหนือมาตราส่วนเส้น) แถบบนเหลือแค่เข็มทิศ (ผู้ใช้ย้าย) */
  const tx = P.V.wide ? AR.x0 + 4 : P.RX0, ty = top ? AR.y1 - 12 : P.V.wide ? AR.y0 + 18 : AR.y1 - 12;
  pgSheetTitle(pen, tx, ty, title, PG_TS.title, P.V.wide ? 170 : P.RW - 30, 0, P.SC);   // แบบคอลัมน์: เว้นที่ให้เข็มทิศมุมขวาบน
  pgCompass(pen, P.RX1 - 14, AR.y1 - P3_COMPASS_DY, 6.5, null, P.V.rot);
  P.titleW = pgTextW(title, PG_TS.title) + 8;
  const barM = P.SC / 1000 * 40, bx = AR.x0 + 4, by = top ? ty - 14 : AR.y0 + 4;
  pen.rect("PG-NORTH", bx, by, 40, 2.2);
  pen.solid("PG-NORTH", [bx, by], [bx + 10, by], [bx + 10, by + 2.2], [bx, by + 2.2]);
  pen.solid("PG-NORTH", [bx + 20, by], [bx + 30, by], [bx + 30, by + 2.2], [bx + 20, by + 2.2]);
  [0, 0.5, 1].forEach((f) => pen.text("PG-NORTH", bx + 40 * f, by + 3, 2.2, (barM * f).toFixed(0), { align: 1, valign: 1 }));
  pen.text("PG-NORTH", bx + 44, by + 0.4, 2.2, "METRES");
}
/* ตาราง + หมายเหตุในคอลัมน์ขวา · ตารางยาวเกินที่ = ยุบแถวกลาง เหลือแถวท้าย (รวม) เสมอ */
/* o.noteMid (โหมดกว้าง): หมายเหตุลงไปแทนที่ตารางกลางแถบล่าง ตารางขึ้นไปเหนือหมายเหตุ — คอลัมน์ขวาว่างไว้ใส่รูป (ผังวางแผง · ผู้ใช้วาดชี้ 2026-11-02) */
function dsRight(P, rows, cols, notes, align, o) {
  o = o || {};
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
  let mid = null;
  if (P.V.wide) {
    const xL = P.titleTop ? AR.x0 + 4 : AR.x0 + 4 + Math.max(P.titleW || 110, 50) + 8, xR = P.RX0 - 8;
    const hNeed = R.length * RH;
    if (o.noteMid && nh) {
      const nw = Math.min(xR - xL, P.titleTop ? 150 : 999), nh2 = dsNoteH(notes, nw);
      if (nw >= tw && hNeed + nh2 + 14 <= yTop - AR.y0) { mid = { x: xL, w: nw, h: nh2 }; tx = xL; ty = AR.y0 + 4 + nh2 + 8 + hNeed; }
    }
    if (!mid && xR - xL >= tw && hNeed <= yTop - AR.y0 - 10) { tx = (xL + xR - tw) / 2; ty = AR.y0 + 4 + hNeed; }
  }
  P.tbX = tx; P.tbTop = ty; P.notes = notes; P.noteMid = !!mid; P.tbW = tw; P.noteW = mid ? mid.w : 0;
  const used = pgGrid(pen, tx, ty, tw, cw, R, { rh: RH, th: PG_TS.body, headRow: 0, align });
  P.tbUsed = used;
  if (mid) dsNoteBlock(pen, mid.x, AR.y0 + 4 + mid.h, mid.w, notes);
  else if (nh) dsNoteBlock(pen, P.RX0, AR.y0 + 4 + nh, P.RW, notes);
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
  dsPlanHead(P, "PV MODULE LAYOUT", { top: true });
  const k = P.k, doc = P.doc, panels = P.foot.panels || [];
  const G = dsGroups(panels);
  G.forEach((g) => {
    const s = g.rect ? g.rows + "x" + g.cols + "=" + g.n : String(g.n);
    let ang = Math.atan2(-g.u.z, g.u.x) / P3_DEG;
    if (ang > 90) ang -= 180; if (ang <= -90) ang += 180;
    const wP = g.cols * 2 * Math.hypot(g.u.x, g.u.z) / k, hP = g.rows * 2 * Math.hypot(g.v.x, g.v.z) / k;   // มม.บนกระดาษ
    const h = Math.min(2.6, wP * 0.85 / (s.length * 0.6));
    if (h < 1.0) return;
    /* ตัวเลขอยู่ใต้กลุ่มแผง (นอกกลุ่ม · ผู้ใช้วาดลูกศรชี้ 2026-11-02) — เลื่อนจากกลางกลุ่มไปตามแกนแถว v ฝั่งที่ลงล่างบนกระดาษ
       v = ครึ่งความสูงแผงหนึ่งแถว → ครึ่งกลุ่ม = rows × |v| */
    const vl = Math.hypot(g.v.x, g.v.z) || 1, sg = -g.v.z > 0 ? -1 : 1;
    const hw = (s.length * 0.56 * h / 2 + 0.6) * k, hh = (h / 2 + 0.5) * k, ra = ang * P3_DEG, ca = Math.cos(ra), sa = Math.sin(ra);
    const off = g.rows * vl + hh + 0.8 * k;
    /* พื้นขาวรองตัวเลข ไม่ให้ลายหลังคาขีดทับ (ผู้ใช้ขอ) — สี่เหลี่ยมหมุนตามแนวกลุ่ม */
    const tx = g.cx + sg * g.v.x / vl * off, ty = -(g.cz + sg * g.v.z / vl * off);
    const c = (u, v) => [tx + u * ca - v * sa, ty + u * sa + v * ca];
    doc.solid("PG-GRP-BG", c(-hw, -hh), c(hw, -hh), c(hw, hh), c(-hw, hh));
    doc.text(DL("grp"), tx, ty, h * k, s, { align: 1, valign: 2, rot: ang });
  });
  /* ชื่อหลังคา: ป้ายใหญ่มีกรอบ + พื้นขาวกันตัวหนังสือจมลายหลังคา อยู่เหนือขอบบนสุดของอาคาร (ผู้ใช้วาดชี้ 2026-11-02)
     วาดบน docRaw ตั้งตรงกระดาษ · พิกัดหลังคาหมุนตามผังก่อน (p3RotPt) จะได้ "บนสุด" ตามที่เห็นบนแผ่น */
  const RR = p3RotPt(P.V.rot || 0), NH = 4;   // ความสูงตัวหนังสือ มม.บนกระดาษ
  /* จุดขอบผังของหลังคา (หมุนตามผังแล้ว) — ผืนเรียบจาก p3RoofSurf · โดมไม่มีผืน ใช้ p3DomePlan แบบ p3PlanBox */
  const roofPts = (r) => {
    const out = [];
    try { (p3RoofSurf(r) || []).forEach((fc) => (fc.pts || []).forEach((q) => out.push(RR(q.x, -q.z)))); } catch (e) { /* ข้าม */ }
    if (!out.length && r.kind === "dome") try { p3DomePlan(r).pts.forEach((p) => out.push(RR(p[0], p[1]))); } catch (e) { /* ข้าม */ }
    return out;
  };
  const roofTag = (roof, nm, mine) => {
    let pts = roofPts(roof);
    if (!pts.length) mine.forEach((p) => p.pts.forEach((q) => pts.push(RR(q[0], -q[1]))));
    const xs = pts.map((q) => q[0]), xa = Math.min.apply(null, xs), xb = Math.max.apply(null, xs), cx = (xa + xb) / 2;
    /* เหนือขอบบนสุดของอาคาร — หลังคาผืนอื่นที่ซ้อนแนวเดียวกัน (เช่นครึ่งบนของจั่ว) นับด้วย ป้ายจะไม่ตกกลางอาคาร (ผู้ใช้วาดลูกศรชี้) */
    let y1 = Math.max.apply(null, pts.map((q) => q[1]));
    (st.roofs || []).forEach((r2) => roofPts(r2).forEach((p) => { if (p[0] > xa && p[0] < xb) y1 = Math.max(y1, p[1]); }));
    const w = (pgTextW(nm, NH) + 4) * k, h = (NH + 2.4) * k, yb = y1 + 2.5 * k;
    const R = P.docRaw;
    R.solid("PG-GRP-BG", [cx - w / 2, yb], [cx + w / 2, yb], [cx + w / 2, yb + h], [cx - w / 2, yb + h]);
    R.rect(DL("tag"), cx - w / 2, yb, w, h);
    R.text(DL("tag"), cx, yb + h / 2, NH * k, nm, { align: 1, valign: 2 });
  };
  const wp = +st.wp || 650, rows = [["ROOF", "GROUP", "MODULE", "kWp"]];
  let tot = 0;
  (st.roofs || []).forEach((roof, i) => {
    const mine = panels.filter((p) => p.roofId === roof.id);
    if (!mine.length) return;
    const nm = ((roof.name || "").trim() || ("ROOFTOP " + (i + 1))).toUpperCase();
    roofTag(roof, nm, mine);
    tot += mine.length;
    rows.push([nm, G.filter((g) => g.roofId === roof.id).length, mine.length, (mine.length * wp / 1000).toFixed(2)]);
  });
  rows.push(["TOTAL", G.length, tot, (tot * wp / 1000).toFixed(2)]);
  const M0 = (() => { try { return p3SldModel(st, job, media.design); } catch (e) { return null; } })();
  dsRight(P, rows, [2.2, 1, 1.1, 1.1], [
    "ตัวเลขกลางกลุ่ม = จำนวนแถว x แผงต่อแถว = จำนวนแผง",   // วงเล็บท้ายเอาออก (ผู้ใช้ขีดฆ่า 2026-11-02)
    "แผง " + (M0 ? M0.panel.model + " " : "") + wp + " Wp · รวม " + tot + " แผง = " + (tot * wp / 1000).toFixed(2) + " kWp",
    /* ข้อ "ตำแหน่งแผงอ้างอิงแบบ 3D …" เอาออก (ผู้ใช้ขีดฆ่า 2026-11-02) */
  ], [0, 1, 1, 1], { noteMid: true });
  /* รูปแผงหน้า/หลัง + รุ่นแผงใต้รูป ในที่ว่างเหนือหมายเหตุ (ผู้ใช้ 2026-11-02 "เอารูปแผงมาใส่ เขียนรุ่นแผงด้านใต้") */
  {
    const ps = ((window.BOQ && window.BOQ.PANELS) || []).find((p) => p.model === (st.sys || {}).panelModel) || {};
    const nh = dsNoteH(P.notes || [], P.RW), AR = P.AR;
    const yT = P.V.wide ? PG_SHEET.IN.y0 + P3_WIDE_B - 2 : P.tbTop - P.tbUsed - 8, yB = AR.y0 + (P.noteMid ? 1 : 4 + nh + 4);
    /* ชื่อแผ่นขึ้นซ้ายบนแล้ว: รูปใช้ที่ขวาของตาราง/หมายเหตุถึงขอบคอลัมน์ขวา (ผู้ใช้ "ขอแผงใหญ่ขึ้น") */
    const fx0 = P.titleTop && P.noteMid ? P.tbX + Math.max(P.tbW || 0, P.noteW || 0) + 10 : P.RX0;
    if (yT - yB >= 30) {
      doc.layer("DS-MOD", 7, "CONTINUOUS", 18); doc.layer("DS-MOD-T", 8, "CONTINUOUS", 5); doc.layer("DS-MOD-DIM", 1, "CONTINUOUS", 9);
      pgModuleDatasheet(P.pen, [fx0, yB, P.RX0 + P.RW, yT], {
        noSec: true, model: (M0 ? M0.panel.model : ps.model || "") + " " + wp + " Wp",
        wMm: Math.round((+ps.width || 1.134) * 1000), hMm: Math.round((+ps.length || 2.382) * 1000), tMm: +ps.frame || 30,
        cells: +ps.cells || 144, lay: { line: "DS-MOD", thin: "DS-MOD-T", dim: "DS-MOD-DIM" },
      });
    }
  }
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
  /* แถบลายตาข่ายไขว้เหลืองแบบผังติดตั้ง (ผู้ใช้ 2026-11-02 "ทำไมไม่เป็นแบบนี้") — แทนเส้นทึบหนา */
  const lw = p3PanelLw(P.k);
  P.doc.layer("PG-OBS-WALKWAY", 40, "CONTINUOUS", lw);
  P.doc.layer("PG-OBS-WALKWAY-H", 40, "CONTINUOUS", lw > 13 ? 9 : 5);
  obs.forEach((o, i) => {
    const pts = dsPath(o), L = dsLen(pts), w = +o.d || 0.3, hw = Math.max(0.05, w / 2);
    for (let j = 1; j < pts.length; j++) p3WalkBand((Ly, a, b) => P.doc.line(Ly, a[0], a[1], b[0], b[1]), pts[j - 1], pts[j], hw, Math.max(hw * 0.6, 0.7 * P.k));
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
/* รูปการเดินสายแบบมีตัวคุมแผง (Optimizer / Rapid Shutdown) — ตามรูปที่ผู้ใช้ส่ง 2026-11-01 (TYPE-16PV / TYPE-18PV)
   สองแถว: แถวบน 1..m ซ้าย→ขวา · แถวล่าง m+1..n ขวา→ซ้าย · ตัวคุม 1 ตัวต่อ per แผง (1 หรือ 2) คร่อมขอบบน (แถวบน) / ขอบล่าง (แถวล่าง)
   สายแผงเข้าตัวคุม (ดำ − / แดง + · ผู้ใช้สั่งสายดำกับแดง) · ตัวคุมต่ออนุกรมด้วยสายแดง · สายลบกลับ (ดำ) เดินขนานแนวสตริงกลับมาออกข้างเดียวกับสายบวก
   m คี่ + 2 แผงต่อตัว = ตัวคุมคู่ข้ามแถว (แผง m กับ m+1) อยู่ขอบบนแผง m สายแผง m+1 อ้อมขวามาเข้าด้านบน
   o = { n, per, rsd, model, xs (ปลายสายออกซ้าย), yA (ขอบบนแถวบน), pw, ph, cab, thL } · คืน yBot ล่างสุดที่ใช้ */
function dsOptType(pen, o) {
  const n = o.n, per = o.per, pw = o.pw, ph = o.ph, T = PG_TBL.txt;
  const R = DL("dcp"), G = DL("optIn"), B = DL("ret"), E = DL("eq");
  const m = Math.ceil(n / 2), gR = 2, ow = pw * 0.5, oh = pw * 0.2;
  const xs = o.xs, xP = xs + 4, yA = o.yA, yBb = yA - 2 * ph - gR, xR0 = xP + m * pw;
  const L = (lay, pts) => { for (let i = 0; i < pts.length - 1; i++) pen.line(lay, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); };
  const pan = [];
  for (let k = 1; k <= n; k++) {
    const top = k <= m, i = top ? k - 1 : 2 * m - k;
    const x = xP + i * pw, y = top ? yA - ph : yBb;
    pen.rect(DL("mod"), x, y, pw, ph);
    pen.text(DL("cell"), x + pw / 2, y + ph / 2, Math.min(pw * 0.42, ph * 0.28), String(k), { align: 1, valign: 2 });
    const ym = y + ph / 2, tL = [x + pw * 0.15, ym], tR = [x + pw * 0.85, ym];
    [tL, tR].forEach((t) => pen.rect(DL("mod"), t[0] - 0.35, t[1] - 0.7, 0.7, 1.4));   // ขั้วต่อ MC4 ที่สายแผง
    pan[k] = { x, top, tL, tR, edge: top ? yA : yBb, s: top ? 1 : -1, top2: y + ph };
  }
  const lane = (p, fr) => p.edge - p.s * fr * ph;
  const lead = (lay, t, ly, px, py) => L(lay, [t, [t[0], ly], [px, ly], [px, py]]);
  const bx = [];
  const box = (xc, p) => {
    const yc = p.edge + p.s * 0.45 * oh, b = { xc, yc, s: p.s, near: yc - p.s * oh / 2, far: yc + p.s * oh / 2 };
    pen.rect(E, xc - ow / 2, yc - oh / 2, ow, oh);
    pen.text(T, xc, yc, oh * 0.55, (o.rsd ? "RSD-" : "OPT-") + (bx.length + 1), { align: 1, valign: 2 });
    const lft = [xc - ow / 2, yc], rgt = [xc + ow / 2, yc];
    b.in = p.s > 0 ? lft : rgt; b.out = p.s > 0 ? rgt : lft;
    bx.push(b);
    return b;
  };
  for (let k = 1; k <= n; k += per) {
    const a = pan[k], c = per > 1 && k + 1 <= n ? pan[k + 1] : null;
    if (!c) {
      const b = box(a.x + pw / 2, a);
      lead(G, a.tL, lane(a, 0.2), b.xc - ow * 0.25, b.near);
      lead(R, a.tR, lane(a, 0.2), b.xc + ow * 0.25, b.near);
    } else if (a.top === c.top) {
      const A = a.x < c.x ? a : c, Bp = a.x < c.x ? c : a, b = box(Bp.x, A);
      lead(G, A.tL, lane(A, 0.2), b.xc - ow * 0.375, b.near);
      lead(R, A.tR, lane(A, 0.3), b.xc - ow * 0.125, b.near);
      lead(G, Bp.tL, lane(Bp, 0.3), b.xc + ow * 0.125, b.near);
      lead(R, Bp.tR, lane(Bp, 0.2), b.xc + ow * 0.375, b.near);
    } else {
      /* ข้ามแถว: แผงบน (m) ต่อด้านใกล้ · แผงล่าง (m+1) ขึ้นตรงผ่านแผง m เข้าใต้ตัวคุม (ผู้ใช้วาดชี้ 2026-11-01 เดิมอ้อมขวา) */
      const Pt = a.top ? a : c, Pb = a.top ? c : a, b = box(Pt.x + pw / 2, Pt);
      lead(G, Pt.tL, lane(Pt, 0.15), b.xc - ow * 0.375, b.near);
      lead(R, Pt.tR, lane(Pt, 0.15), b.xc + ow * 0.375, b.near);
      const yJ = Pb.top2 - 0.15 * ph, yK = lane(Pt, 0.25);
      L(G, [Pb.tL, [Pb.tL[0], yJ], [Pt.x + pw * 0.24, yJ], [Pt.x + pw * 0.24, yK], [b.xc - ow * 0.125, yK], [b.xc - ow * 0.125, b.near]]);
      L(R, [Pb.tR, [Pb.tR[0], yJ], [Pt.x + pw * 0.76, yJ], [Pt.x + pw * 0.76, yK], [b.xc + ow * 0.125, yK], [b.xc + ow * 0.125, b.near]]);
    }
  }
  /* ตัวคุมต่ออนุกรม · แถวบนลงแถวล่างทางขวา */
  const xc = xR0 + 1.5, xB = xc + 1.5;
  for (let i = 0; i < bx.length - 1; i++) {
    const a = bx[i], b = bx[i + 1];
    if (a.s === b.s) L(R, [a.out, b.in]);
    else L(R, [a.out, [xc, a.out[1]], [xc, b.in[1]], b.in]);
  }
  /* ปลายสาย: บวกออกจากตัวคุมแรก · ลบกลับจากตัวคุมสุดท้าย เดินในแถวล่าง ขึ้นทางขวา แล้วในแถวบนกลับมาซ้าย */
  const f0 = bx[0], lz = bx[bx.length - 1], yBt = yA - 0.1 * ph;
  L(R, [[xs, f0.in[1]], f0.in]);
  if (lz.s < 0) { const yBl = yBb + 0.1 * ph; L(B, [lz.out, [lz.out[0] - 1.5, lz.out[1]], [lz.out[0] - 1.5, yBl], [xB, yBl], [xB, yBt], [xs, yBt]]); }
  else L(B, [lz.out, [xB, lz.out[1]], [xB, yBt], [xs, yBt]]);
  pen.text(T, xs - 1, f0.in[1] + 0.4, o.thL, "(+) " + o.cab, { align: 2, valign: 1 });
  pen.text(T, xs - 1, yBt - 0.4, o.thL, "(-) " + o.cab, { align: 2, valign: 3 });
  /* ชื่อรูป TYPE-nPV ขีดเส้นใต้ + รุ่นตัวคุม */
  const yc = yBb - oh - 4.5, cap = "TYPE-" + n + "PV";
  pen.text(T, xP, yc, PG_TS.head, cap, { valign: 1 });
  pen.line(T, xP, yc - 1.2, xP + pgTextW(cap, PG_TS.head) + 1, yc - 1.2);
  pen.text(T, xP, yc - 2.4, PG_TS.cell, (o.rsd ? "RAPID SHUTDOWN " : "OPTIMIZER ") + o.model + " = " + bx.length + " EA. (1 ตัว / " + per + " แผง)", { valign: 3 });
  return yc - 2.4 - PG_TS.cell;
}
function dsStrDetSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "STRDET", null);
  const pen = S.pen, A = S.A, T = PG_TBL.txt;
  /* ชื่อแผ่นอยู่มุมขวาล่าง (ผู้ใช้ย้าย) ด้านบนทั้งแผ่นให้รูปที่ 1/2 */
  /* ชื่อแผ่นมุมซ้ายบน (ผู้ใช้ย้าย 2026-11-02 ขวาบน → ซ้ายบน) — มุมขวาล่างให้ตาราง STRING DATA / LEGEND · รูปด้านบนเริ่มต่ำลงให้ที่ (yHi) */
  pgSheetTitle(pen, A.x0 + 4, A.y1 - 11, "DETAIL PV MODULE STRING", PG_TS.title, 170, 0, null);
  let M = null;
  try { M = p3SldModel(st, job, media.design); } catch (e) { M = null; }
  const SS = (media.design && media.design.strings) || [];
  const cnt = {};
  SS.forEach((s) => { cnt[s.n] = (cnt[s.n] || 0) + 1; });
  const n = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || b - a)[0] || 10;

  /* แถบล่าง: รูปแผง (ซ้าย) · ข้อมูลสตริง + คำอธิบายเส้น (ถัดไปทางขวา) — ผู้ใช้ย้ายลงมาจากมุมซ้ายบน
     ด้านบนทั้งแผ่นให้รูปที่ 1/2 อยู่กลาง */
  /* รูปแผง datasheet กว้างขึ้น (ผู้ใช้ "ขยายให้ใหญ่หน่อย") → ตาราง STRING DATA / LEGEND เลื่อนขวา ซ้อนกันบน-ล่าง */
  const lx = A.x0 + 14, sx = A.x0 + 152, lw = 110, bandTop = A.y0 + 92;
  const pairs = [["PV MODULE", M ? M.panel.model + " " + M.panel.wp + " Wp" : "-"],
    ["STRING", typeof p3StrSum === "function" ? p3StrSum(SS) : SS.length + " STRING"],
    ["DC CABLE", (M && M.pro && M.pro.dcCable) || "PV1-F 1x4 Sq.mm. 1.5kV DC"]];
  if (M && M.pro && M.pro.vocMax) pairs.push(["Voc @" + M.pro.tMin + "%%dC", M.pro.vocMax + " V (MAX " + M.pro.maxVdc + " V)"]);
  /* ข้อมูลสตริง + LEGEND ลงล่าง ชิดระดับฐานรูปแผงซ้าย (ผู้ใช้ย้ายลง) */
  /* STRING DATA กับ LEGEND วางคู่กันชิดล่าง (ผู้ใช้วาดชี้ 2026-11-02 — เดิมซ้อนบน-ล่าง ชื่อแผ่นอยู่มุมนี้) */
  const specTop = A.y0 + 8 + (pairs.length + 1) * 4.6;
  const used = pgSpecBlock(pen, sx, specTop, lw, "STRING DATA", pairs, { rh: 4.6, th: PG_TS.cell, kw: 0.3 });
  /* LEGEND เป็นตารางแบบเดียวกับ STRING DATA (ผู้ใช้ 2026-11-02 "ทำเป็นตาราง"): หัวพื้นเทา · ช่องซ้ายตัวอย่างเส้น · ช่องขวาคำอธิบาย */
  const lgx = sx + lw + 6, lrh = 4.6, lth = PG_TS.cell, sw = 20;
  const OP = M && M.opt;
  const lgRows = (OP ? [[DL("dcp"), "สาย DC (+) ไปตู้ DC / สายต่อระหว่างตัวคุมแผง"], [DL("ret"), "สาย DC (-) กลับไปตู้ DC (เดินขนานแนวสตริง)"],
    [DL("optIn"), "สายแผงเข้าตัวคุมแผง (สายของตัวคุม)"]]
    : [[DL("dcp"), "สาย DC ขั้วบวก (+) ไปตู้ DC"], [DL("dcn"), "สาย DC ขั้วลบ (-) ไปตู้ DC"], [DL("jmp"), "สายต่อระหว่างแผง (สายของแผงเอง)"],
    [DL("flow"), "แผงช่วงกลางที่ไม่ได้วาด (ต่อแบบเดียวกัน)"]]);
  const lgw = sw + 4 + Math.max.apply(null, lgRows.map((r) => pgTextW(r[1], lth)));
  let ly = A.y0 + 8 + (lgRows.length + 1) * lrh;
  pen.solid(PG_TBL.head, [lgx, ly - lrh], [lgx + lgw, ly - lrh], [lgx + lgw, ly], [lgx, ly]);
  pen.rect(PG_TBL.line, lgx, ly - lrh, lgw, lrh);
  pen.text(T, lgx + 2, ly - lrh + (lrh - lth * 1.15) / 2, lth * 1.15, "LEGEND");
  ly -= lrh;
  lgRows.forEach((r) => {
    pen.rect(PG_TBL.line, lgx, ly - lrh, lgw, lrh);
    pen.line(PG_TBL.line, lgx + sw, ly, lgx + sw, ly - lrh);
    pen.line(r[0], lgx + 3, ly - lrh / 2, lgx + sw - 3, ly - lrh / 2);
    pen.text(T, lgx + sw + 2, ly - lrh / 2, lth, r[1], { valign: 2 });
    ly -= lrh;
  });
  const ps = ((window.BOQ && window.BOQ.PANELS) || []).find((p) => p.model === (st.sys || {}).panelModel) || {};
  /* รูปแผงแบบ datasheet (ผู้ใช้ส่งรูปตัวอย่าง 2026-11-02) — ขนาดตามสเปคแผงในคลัง */
  S.doc.layer("DS-MOD", 7, "CONTINUOUS", 18);
  S.doc.layer("DS-MOD-T", 8, "CONTINUOUS", 5);
  S.doc.layer("DS-MOD-DIM", 1, "CONTINUOUS", 9);
  pgModuleDatasheet(pen, [lx, A.y0 + 6, sx - 6, bandTop - 2], { secRight: true,
    wMm: Math.round((+ps.width || 1.134) * 1000), hMm: Math.round((+ps.length || 2.382) * 1000), tMm: +ps.frame || 30,
    cells: +ps.cells || 144, lay: { line: "DS-MOD", thin: "DS-MOD-T", dim: "DS-MOD-DIM" },
  });

  /* มีตัวคุมแผง: รูป TYPE-nPV สองแถวต่อขนาดสตริง (ใช้มากสุด 2 ขนาด เล็กอยู่บน) แทนรูปที่ 1/2 (ผู้ใช้ส่งรูปแบบ 2026-11-01) */
  if (OP) {
    const per = OP.per >= 2 ? 2 : 1;
    const sizes = Object.keys(cnt).map(Number).sort((a, b) => cnt[b] - cnt[a] || b - a).slice(0, 2);
    if (!sizes.length) sizes.push(n);
    sizes.sort((a, b) => a - b);
    const cab = "PV CABLE " + ((M.pro && M.pro.dcCable) || "PV1-F 1x4 Sq.mm.").replace(/\s*\(H1Z2Z2-K\)/i, "").replace(/\s*1\.5kV DC/i, ""), thL = 2.5, lw = pgTextW("(+) " + cab, thL) + 3;
    const X0 = A.x0 + 6, X1 = A.x1 - 36, yHi = A.y1 - 19, yLo = bandTop + 6, Hf = (yHi - yLo) / sizes.length;
    const mMax = Math.ceil(Math.max.apply(null, sizes) / 2);
    /* รูปใหญ่เต็มที่ที่ว่าง (ผู้ใช้ 2026-11-02 "ใหญ่หน่อย" เดิมเพดาน 17) */
    const pw = Math.min(30, (X1 - X0 - lw - 14) / mMax, (Hf - 16) / 3.95), ph = pw * 1.8;
    sizes.forEach((sz, i) => {
      const m = Math.ceil(sz / 2), W = lw + 4 + m * pw + 7, hF = 2 * ph + 2 + 0.4 * pw + 3 + 12;
      const yA = yHi - i * Hf - Math.max(0, (Hf - hF) / 2) - 0.14 * pw - 3;
      dsOptType(pen, { n: sz, per, rsd: OP.rsd, model: OP.model, xs: (X0 + X1) / 2 - W / 2 + lw, yA, pw, ph, cab, thL });
    });
    if (Object.keys(cnt).length > sizes.length)
      pen.text(T, sx, A.y0 + 6, PG_TS.cell, "สตริงขนาดอื่นในงานนี้ต่อแบบเดียวกัน — จำนวนแผงต่อสตริงจริงดูแผ่น STRING LAYOUT", {});
    return S.doc.build();
  }
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
  const yHi = A.y1 - 19, yLo = bandTop + 6 + 11;          // ขอบบนแถวแรก · ขอบล่างคำบรรยายรูปที่ 2
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

/* ── ตัวช่วยวาดแผ่นต่อลงดินแบบลอกรูปต้นแบบ: พิกัดเป็นพิกเซลของรูปที่ผู้ใช้ส่ง (y ชี้ลง) แปลงเป็นมม.บนแผ่น ──
   w = ความกว้างรูปต้นแบบ (px) · yT = ขอบบนของรูปบนแผ่น (มม.) */
function dsPx(pen, A, w, yT) {
  const k = (A.x1 - A.x0 - 4) / w, X = (x) => A.x0 + 2 + x * k, Y = (y) => yT - y * k, T = PG_TBL.txt;
  const P = (p) => [X(p[0]), Y(p[1])];
  const o = {
    k, X, Y,
    ln: (L, x1, y1, x2, y2) => pen.line(L, X(x1), Y(y1), X(x2), Y(y2)),
    pl: (L, pts, closed) => { const q = pts.map(P); for (let i = 0; i < q.length - 1; i++) pen.line(L, q[i][0], q[i][1], q[i + 1][0], q[i + 1][1]); if (closed) pen.line(L, q[q.length - 1][0], q[q.length - 1][1], q[0][0], q[0][1]); },
    rc: (L, x, y, w2, h2) => pen.rect(L, X(x), Y(y + h2), w2 * k, h2 * k),
    ci: (L, x, y, r) => pen.circle(L, X(x), Y(y), r * k),
    el: (L, x, y, rx, ry, rot) => { const c = Math.cos(rot || 0), sn = Math.sin(rot || 0), q = [];
      for (let i = 0; i <= 32; i++) { const t = i / 32 * Math.PI * 2, u = rx * Math.cos(t), v = ry * Math.sin(t); q.push([x + u * c - v * sn, y + u * sn + v * c]); }
      o.pl(L, q); },
    dot: (L, x, y, r) => pen.dot(L, X(x), Y(y), r * k),
    /* ตัวหนังสือ: (x, y) = มุมซ้ายล่างของบรรทัดในรูป · h = สูง (มม.) */
    tx: (x, y, s, h, opt) => pen.text(T, X(x), Y(y), h || PG_TS.cell, s, Object.assign({ valign: 1 }, opt || {})),
    /* ป้ายมีเส้นใต้แล้วลากเส้นชี้ไปจุด (ex, ey) — แบบเส้นชี้ในรูปต้นแบบ */
    lead: (x, y, s, h, pts) => {
      h = h || PG_TS.cell;
      pen.text(T, X(x), Y(y) + 0.6, h, s, { valign: 1 });
      const w2 = pgTextW(s, h) / k;
      o.ln(T, x, y, x + w2, y);
      if (pts && pts.length) o.pl(T, [[pts[0][0] >= x + w2 / 2 ? x + w2 : x, y]].concat(pts));
    },
    /* กรอบย่อย: พิกัดของภาพขยายส่วนหนึ่งของรูปต้นแบบ (มุมซ้ายบน x0,y0 · ขยาย s เท่า) — ลอกรายละเอียดเล็กได้แม่น */
    z: (x0, y0, s) => {
      const f = (p) => [x0 + p[0] / s, y0 + p[1] / s];
      const q = {
        pl: (L, pts, c) => o.pl(L, pts.map(f), c),
        ln: (L, a, b, c2, d) => o.pl(L, [f([a, b]), f([c2, d])]),
        el: (L, x, y, rx, ry, rot) => o.el(L, x0 + x / s, y0 + y / s, rx / s, ry / s, rot),
        ci: (L, x, y, r) => o.ci(L, x0 + x / s, y0 + y / s, r / s),
        dot: (L, x, y, r) => o.dot(L, x0 + x / s, y0 + y / s, r / s),
        tx: (x, y, str, h, opt) => o.tx(x0 + x / s, y0 + y / s, str, h, opt),
        /* ส่วนโค้งวงรี (มุมเรเดียน y ชี้ลง) */
        arc: (L, cx, cy, rx, ry, a0, a1, rot) => { const c = Math.cos(rot || 0), sn = Math.sin(rot || 0), pts = [];
          for (let i = 0; i <= 16; i++) { const t = a0 + (a1 - a0) * i / 16, u = rx * Math.cos(t), v = ry * Math.sin(t); pts.push([cx + u * c - v * sn, cy + u * sn + v * c]); }
          q.pl(L, pts); },
        /* เส้นลายเกลียวสายทองแดง: แถบขอบบน a0→a1 ขอบล่าง b0→b1 · n เส้นเฉียง */
        hatch: (L, a0, a1, b0, b1, n, d) => { const lp = (p, r, t) => [p[0] + (r[0] - p[0]) * t, p[1] + (r[1] - p[1]) * t];
          for (let i = 0; i <= n; i++) { const t = i / n, t2 = t - (d || 0.08); if (t2 < 0) continue; q.pl(L, [lp(a0, a1, t), lp(b0, b1, t2)]); } },
      };
      return q;
    },
    /* รูปลายเส้นที่ลอกอัตโนมัติจากรูปต้นแบบ (dashboard/groundart.js · tools/trace-art.mjs) วางที่มุม x0,y0 ย่อ s เท่า · เส้นเทาลงชั้น Lg */
    art: (name, x0, y0, s, L, Lg, minH, fr) => {
      const a = (window.DS_ART || {})[name]; if (!a) return;
      /* fr = { f: กรอบในรูป [ซ้าย, บน, ขวา, ล่าง] พิกเซล, x, w, h } — ซ่อนกรอบลายเส้นเดิม วาดกรอบใหม่ w×h ที่ x (บนเท่าเดิม) ให้ทุกรูปเท่ากัน (ผู้ใช้ขอ)
         รูปเลื่อนลงครึ่งหนึ่งของความสูงที่เพิ่ม ป้าย DETAIL ลงไปชิดล่าง ชื่อรูปอยู่ที่เดิม */
      let dyA = 0, dyC = 0, onF = null;
      if (fr) { const F = fr.f, ex = fr.h - (F[3] - F[1]) / s; x0 = fr.x + fr.w / 2 - (F[0] + F[2]) / 2 / s; dyA = ex / 2; dyC = ex;
        const e = (v, w) => Math.abs(v - w) < 2;
        onF = (p) => p.every(([x, y]) => ((e(x, F[0]) || e(x, F[2])) && y > F[1] - 2 && y < F[3] + 2) || ((e(y, F[1]) || e(y, F[3])) && x > F[0] - 2 && x < F[2] + 2));
        o.rc(L, fr.x, y0 + F[1] / s, fr.w, fr.h); }
      /* ตัวหนังสือในรูปเป็นลายเส้น — ซ่อนเส้นที่อยู่ในกรอบข้อความทั้งเส้น แล้วเขียนเป็นข้อความจริงแทน (ผู้ใช้ขอ) */
      const tx = DS_ART_TX[name] || [], q = a.q || 1, inBox = (b) => tx.some((t) => b[0] >= t[0] - 1.5 && b[2] <= t[2] + 1.5 && b[1] >= t[1] - 1.5 && b[3] <= t[3] + 1.5 + (t[3] - t[1]) * 0.4); /* ล่างเผื่อหางตัว q */ /* ล่างเผื่อหางตัว q */
      a.d.split(";").forEach((c) => {
        const g = c[0] === "g", n = (g ? c.slice(1) : c).split(",").map(Number), pts = [], b = [1e9, 1e9, -1e9, -1e9], raw = [];
        for (let i = 0, x = 0, y = 0; i < n.length; i += 2) { x = i ? x + n[i] : n[i]; y = i ? y + n[i + 1] : n[i + 1];
          b[0] = Math.min(b[0], x / q); b[1] = Math.min(b[1], y / q); b[2] = Math.max(b[2], x / q); b[3] = Math.max(b[3], y / q); pts.push([x0 + x / q / s, y0 + dyA + y / q / s]); raw.push([x / q, y / q]); }
        if ((tx.length && inBox(b)) || (onF && onF(raw))) return;
        if (pts.length === 2 && !n[2] && !n[3]) o.dot(g ? Lg : L, pts[0][0], pts[0][1], 0.7 / q / s);
        else o.pl(g ? Lg : L, pts);
      });
      /* สูงตัวพิมพ์ใหญ่ ≈ 0.7 × h ของ pen.text · ไม่ให้กว้างเกินกรอบเดิม (ตัวหนังสือจริงกว้างกว่าลายเส้น จะทับเส้นชี้) */
      tx.forEach((t) => { const c = t[5] === 1, r = t[5] === 2;
        let h = Math.max(minH || 0, Math.min((t[3] - t[1]) / s * k / 0.7, (t[2] - t[0]) / s * k / pgTextW(t[4], 1)));
        /* ป้ายชิดขวาที่ขยายไปทางซ้าย ห้ามเลยขอบซ้ายกรอบ (GROUNDING SHEET เคยทับเส้นกรอบ) */
        if (r && fr) h = Math.min(h, ((t[2] - fr.f[0]) / s - 4) * k / pgTextW(t[4], 1));
        o.tx(x0 + (c ? (t[0] + t[2]) / 2 : r ? t[2] : t[0]) / s, y0 + t[3] / s + (c ? 0 : /^DETAIL/.test(t[4]) ? dyC : dyA), t[4], h, c ? { align: 1 } : r ? { align: 2 } : null); });
    },
    cap: (xc, y, s, h) => { h = h || PG_TS.body; pen.text(T, X(xc), Y(y), h, s, { align: 1, valign: 1 }); const w2 = pgTextW(s, h); pen.line(T, X(xc) - w2 / 2, Y(y) - 1, X(xc) + w2 / 2, Y(y) - 1); },
  };
  return o;
}
/* ข้อความของรูปลายเส้น DS_ART (พิกัดพิกเซลของรูป): [ซ้าย, บน, ขวา, ล่าง (เส้นฐาน), ข้อความ, 1 = กึ่งกลาง (ชื่อรูปใช้ซ้าย-ขวาของกรอบรูป ให้อยู่กลางกรอบ) · 2 = ชิดขวา (เส้นชี้อยู่ขวา ขยายแล้วไม่ทับ)]
   เส้นที่อยู่ในกรอบทั้งเส้นถูกซ่อน แล้ววาดข้อความจริงแทน — กรอบหาจากหน้าดูตัวอย่าง (docs/trace-art.md) · คำสะกดตามรูปต้นแบบ */
const DS_ART_TX = {
  G1A: [[19, 23.5, 961.5, 48.5, "GROUNDING FOR PV MODULE AND RIAL", 1], [776, 163, 915.5, 184, "PV MODULE"], [753.5, 201.5, 914, 222, "INTER CLAMP"],
    [596.5, 262, 644.5, 282.5, "RAIL"], [43, 302, 271.5, 322.5, "GROUNDING SHEET", 2], [387.5, 376, 505, 397, "DETAIL A"]],
  G1B: [[19.5, 23, 961.5, 48, "BONDING FOR RAIL TO GROUNDING SYSTEM", 1], [164.5, 175, 362, 196, "GROUNDING LUG", 2], [169, 320, 372, 341, "IEC01-6 sq mm.", 2],
    [595.5, 320, 644.5, 341, "RAIL"], [417.5, 431, 535, 451, "DETAIL B"]],
  G1C: [[18, 43, 888.5, 68, "GROUND STATION INSTALLATION DETAIL", 1], [42.5, 211.5, 316.5, 232, "GROUND STATION FOR", 2], [42.5, 247.5, 268.5, 268, "INVERTER STATION", 2],
    [43, 283, 226, 304, "300x25x5 mm", 2], [726.5, 309, 880.5, 330, "COPPER LUG"], [110, 351, 239, 371, "INSULATOR", 2], [110.5, 384, 310, 404.5, "GROUNDING BAR", 2],
    [435.5, 496, 582, 523, "DETAIL C"]],
  G1D: [[9.5, 37, 880, 62, "PERFORRATE TRAY BONDING", 1], [58, 157, 391, 186, "6 sq mm ,IEC-01 ,GREEN", 2], [543, 157, 711, 178, "SPLICE PLATE"], [369.5, 490, 518, 517, "DETAIL D"]],
  TRAY: [[738, 426.5, 915.5, 442.5, "PERFORATED TRAY"], [539, 494, 726, 511, "1C-6 sq mm IEC01"], [45, 660, 743, 694, "GROUNDING FOR PERFORATED TRAY"]],
  G2A: [[325, 61.5, 520, 81, "1C-16 sq mm IEC01"], [640, 166.5, 711, 182, "NUT M8"], [690.5, 232.5, 811.5, 248.5, "GROUND LUG"], [648.5, 471, 729, 487, "BOLT M8"],
    [370, 548, 545, 579, "DETAIL A"]],
  G2B: [[268.5, 59, 453.5, 79.5, "1C-6 sq mm IEC01", 2], [53.5, 172, 226.5, 187, "COPPER C-CLAMP", 2], [810, 388, 1004.5, 408.5, "1C-16 sq mm IEC01"], [385, 553.5, 556, 585, "DETAIL B"]],
  G2C: [[373, 62, 427, 73, "NUT M8"], [379.5, 122, 437, 134, "WASHER"], [422, 223, 524, 235, "MIDDLE CLAMP"], [437, 406, 541.5, 417, "RAIL EARTHING"],
    [352.5, 568.5, 413, 580.5, "BOLT M8"], [151, 795, 280, 819, "DETAIL C"]],
};
/* แผ่นรายละเอียดติดตั้งบนหลังคาเมทัลชีท (MOUNT · ผู้ใช้ส่งแบบ 2026-11-02) — เส้นเวกเตอร์จาก PDF ต้นแบบของผู้ใช้ (dashboard/mountvec.js · tools/pdf-art.mjs)
   ตรงต้นฉบับทุกเส้นรวมตัวหนังสือ (ลอกจากรูปแล้วผู้ใช้ "เส้นไม่ตรง ไม่เหมือน 100%") · ไม่เอากรอบ/ตารางชื่อแบบของต้นฉบับ ใช้หัวแบบของเรา */
function dsHasMetal(st) {
  return (st.roofs || []).some((r) => !r.p3sGround && p3Panels(r).count > 0 && ["metal", "sandwich"].indexOf(typeof p3sRoofMat === "function" ? p3sRoofMat(r) : "metal") >= 0);
}
/* วาด DS_VEC[name] มุมซ้ายบนที่ (x0, yTop) บนกระดาษ (y ขึ้น) ย่อ/ขยาย sc มม. ต่อ pt · ชนิดเส้น k/g/l/d/w → ชั้น LY · ตัวใหญ่ = ระบายทึบ */
function dsVec(pen, name, x0, yTop, sc, LY) {
  const a = (window.DS_VEC || {})[name]; if (!a) return false;
  const q = a.q || 1;
  a.d.split(";").forEach((c) => {
    const t = c[0], n = c.slice(1).split(",").map(Number), p = [];
    for (let i = 0, x = 0, y = 0; i < n.length; i += 2) { x = i ? x + n[i] : n[i]; y = i ? y + n[i + 1] : n[i + 1]; p.push([x0 + x / q * sc, yTop - y / q * sc]); }
    const L = LY[t.toLowerCase()] || LY.k;
    if (t !== t.toLowerCase()) { for (let i = 1; i < p.length - 1; i++) pen.solid(L, p[0], p[i], p[i + 1]); return; }
    for (let i = 1; i < p.length; i++) pen.line(L, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1]);
  });
  return true;
}
function dsMountSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "MOUNT", null);
  /* เส้นบางแบบต้นแบบ CAD */
  S.doc.layer("DS-MNT", 7, "CONTINUOUS", 13); S.doc.layer("DS-MNT-G", 8, "CONTINUOUS", 9); S.doc.layer("DS-MNT-L", 254, "CONTINUOUS", 5);
  S.doc.layer("DS-MNT-D", 8, "CONTINUOUS", 13); S.doc.layer("DS-MNT-W", 255, "CONTINUOUS", 9);
  const pen = S.pen, A = S.A, v = (window.DS_VEC || {}).MOUNT;
  if (!v) return S.doc.build();
  /* ทั้งแผ่นของต้นฉบับ (รวมชื่อแผ่นมุมขวาล่าง) ย่อให้พอดีพื้นที่วาดของเรา */
  const m = 3, sc = Math.min((A.x1 - A.x0 - 2 * m) / v.w, (A.y1 - A.y0 - 2 * m) / v.h);
  const x0 = (A.x0 + A.x1 - v.w * sc) / 2, yT = (A.y0 + A.y1 + v.h * sc) / 2;
  dsVec(pen, "MOUNT", x0, yT, sc, { k: "DS-MNT", g: "DS-MNT-G", l: "DS-MNT-L", d: "DS-MNT-D", w: "DS-MNT-W" });
  return S.doc.build();
}
/* บัสดิน (แท่งทองแดง + หัวน็อตเรียง) ในรูปต้นแบบ */
function dsBus(D, L, x, y, w, n) {
  D.rc(L, x, y, w, 7);
  for (let i = 0; i < n; i++) { const cx = x + 5 + i * (w - 10) / Math.max(1, n - 1); D.pl(L, [[cx - 2.6, y + 3.5], [cx, y + 1], [cx + 2.6, y + 3.5], [cx, y + 6]], true); }
}

/* ==================================================================
   ระบบต่อลงดิน แผ่นที่ 1 (GROUNDING DIAGRAM) — ลอกแบบมาตรฐานที่ผู้ใช้ส่ง 2026-11-02 ("ขอเหมือนๆ 100%")
   ซ้าย INVERTER STATION: MDB EXISTING ↔ SOLAR MDB ↔ GROUND BUS INVERTER STATION (อินเวอร์เตอร์ · ตู้ DC FUSE · INV RACK)
   ขวา ROOFTOP: สายเมนดินขึ้นหลังคา → RAIL ทุกเส้น (PV STRING) · ทางเดิน · รางไฟ (มีในแบบ 3D เท่านั้น)
   ล่าง DETAIL A–D · REMARK ปักหลักดินเพิ่มถ้าเกิน 5 โอห์ม
   ขนาดสาย: เมน = M.pro.earthCu · อินเวอร์เตอร์ ≈ ครึ่งหนึ่ง (ไม่ต่ำกว่า 10 / ไม่เกินเมน) · ขึ้นหลังคา 16 · อุปกรณ์ 6
   ================================================================== */
function dsGroundSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "GROUND", "GROUNDING DIAGRAM FOR SOLAR SYSTEM");
  const pen = S.pen, A = S.A, E = DL("eq"), T = PG_TBL.txt, W = DL("gw");
  let M = null;
  try { M = p3SldModel(st, job, media.design); } catch (e) { M = null; }
  const P = (M && M.pro) || {};
  const nInv = M ? Math.max(1, M.units.length) : 1, home = !!P.home, fuse = P.dcDev && P.dcDev.k === "fuse";
  const eCu = P.earthCu || 10, CU = [6, 10, 16, 25, 35, 50, 70, 95];
  const invCu = Math.max(Math.min(10, eCu), Math.min(eCu, CU.find((c) => c >= eCu / 2) || eCu)), roofCu = 16;
  const tray = dsObs(st, "tray").length > 0, walk = dsObs(st, "walkway").length > 0;
  const D = dsPx(pen, A, 1366, A.y1 - 16), H = PG_TS.cell, HB = PG_TS.body;
  const sl = (x, y) => D.ln(T, x - 4, y + 6, x + 4, y - 6);          // ขีดเฉียงบอกขนาดสายบนเส้น
  const slV = (x, y) => D.ln(T, x - 6, y + 4, x + 6, y - 4);

  /* กรอบตาราง: หัว INVERTER STATION | ROOFTOP · แถว DETAIL */
  D.ln(E, 0, 66, 1366, 66); D.ln(E, 0, 520, 1366, 520); D.ln(E, 718, 66, 718, 520);
  D.rc(E, 0, 42, 1366, 693);
  D.tx(359, 58, "INVERTER STATION", HB, { align: 1 }); D.tx(1042, 58, "ROOFTOP", HB, { align: 1 });

  /* ── INVERTER STATION ── */
  const mdbN = home ? "CONSUMER UNIT EXISTING" : "MDB EXISTING", solN = home ? "AC BOX (SOLAR)" : "SOLAR MDB";
  D.rc(E, 45, 220, 125, 220); D.tx(45, 213, mdbN, H);
  dsBus(D, E, 48, 313, 112, 14); D.tx(104, 333, "GROUND BUS", H, { align: 1, valign: 3 }); D.tx(104, 344, home ? "CONSUMER UNIT" : "MDB EXISTING", H, { align: 1, valign: 3 });
  D.rc(E, 190, 205, 125, 235); D.tx(190, 198, solN, H);
  dsBus(D, E, 192, 313, 113, 11); D.tx(248, 333, "GROUND BUS", H, { align: 1, valign: 3 }); D.tx(248, 344, home ? "AC BOX" : "SOLAR MDB", H, { align: 1, valign: 3 });
  D.ln(E, 160, 317, 192, 317); sl(178, 317);
  D.lead(80, 292, "IEC01 " + eCu + "sq.mm.", H, [[178, 292], [178, 311]]);
  D.ln(E, 305, 317, 600, 317); sl(448, 317);
  D.lead(338, 370, "IEC01 " + eCu + " sq.mm.", H, [[448, 370], [448, 323]]);

  /* อินเวอร์เตอร์ (วาดสูงสุด 2 เครื่อง · เกิน = INVERTER-2 ~ n) */
  const nDraw = Math.min(2, nInv), invNm = (i) => "INVERTER-" + (i + 1) + (i === 1 && nInv > 2 ? " ~ " + nInv : "");
  for (let i = 0; i < nDraw; i++) {
    const x = 395 + i * 75, y = 80;
    D.rc(E, x, y, 60, 56); D.tx(x + 2, 75, invNm(i), H);
    D.tx(x + 4, y + 13, "3~", HB); D.ln(E, x, y + 56, x + 60, y);
    D.tx(x + 46, y + 32, "DC", H); D.ln(E, x + 46, y + 22, x + 56, y + 22);
    D.rc(E, x + 15, y + 41, 32, 13);
    ["L1", "L2", "L3", "N", "G"].forEach((s, j) => { D.tx(x + 16.5 + j * 6.2, y + 51, s, 1.1); if (j) D.ln(E, x + 15 + j * 6.4, y + 41, x + 15 + j * 6.4, y + 54); });
    /* สายดินตัวเครื่อง (G) → GROUND BUS ตู้ SOLAR MDB */
    const gx = x + 44, ly = 145 + i * 10, bx = 282 - i * 12;
    D.pl(E, [[gx, y + 54], [gx, ly], [bx, ly], [bx, 313]]);
    sl(420 - i * 0, ly);
  }
  D.lead(312, 138, "IEC01 " + invCu + " sq.mm.", H, [[420, 143]]);

  /* ตู้ DC FUSE (ตามจำนวนเครื่อง) → GROUND BUS INVERTER STATION */
  const dcNm = (i) => (fuse ? "DC FUSE BOX-" : "DC BOX-") + (i + 1) + (i === 1 && nInv > 2 ? " ~ " + nInv : "");
  for (let i = 0; i < nDraw; i++) {
    const x = 370 + i * 93, y = 210;
    D.rc(E, x, y, 70, 30); D.tx(x + 2, 203, dcNm(i), H);
    [[x - 3, y + 15], [x + 73, y + 15]].forEach((p) => { D.rc(E, p[0] - 3, p[1] - 5, 6, 10); D.ln(E, p[0] - 3, p[1], p[0] + 3, p[1]); });
    const gx = x + 42, ly = 275 - i * 10, bx = 625 + i * 15;
    D.pl(E, [[gx, y + 30], [gx, ly], [bx, ly], [bx, 313]]);
    slV(bx, 300);
  }
  D.lead(500, 292, "IEC01 6 sq.mm.", H, [[620, 292]]);
  if (!home) {
    /* INV RACK: โครงตั้ง + ขา · ขาซ้ายต่อลงบัส */
    const x = 610, y = 80;
    D.tx(x + 12, 75, "INV RACK", H);
    D.pl(E, [[x + 5, y + 65], [x + 5, y + 5], [x + 75, y + 5], [x + 75, y + 65]]);
    D.pl(E, [[x + 9, y + 65], [x + 9, y + 9], [x + 71, y + 9], [x + 71, y + 65]]);
    [20, 32, 44].forEach((d) => { D.ln(E, x + 9, y + d, x + 71, y + d); D.ln(E, x + 9, y + d + 3, x + 71, y + d + 3); });
    D.ln(E, x, y + 66, x + 14, y + 66); D.ln(E, x + 66, y + 66, x + 80, y + 66);
    D.dot(E, x + 7, y + 64, 2.2);
    D.pl(E, [[x + 7, y + 66], [x + 7, y + 74], [655, y + 74], [655, 313]]);
    slV(655, 300);
  }
  dsBus(D, E, 600, 313, 70, 8);
  D.tx(635, 333, "GROUND BUS", H, { align: 1, valign: 3 }); D.tx(635, 344, "INVERTER STATION", H, { align: 1, valign: 3 });
  D.pl(T, [[670, 313], [674, 285], [686, 285]]); D.tx(690, 288, "DETAIL C", H);

  /* ── ROOFTOP: สายขึ้นหลังคา → แกนดิน x=920 ── */
  const tY1 = tray ? 458 : walk ? 410 : 330;
  D.pl(E, [[670, 317], [690, 317], [690, 340], [920, 340]]); sl(845, 340);
  D.lead(760, 292, "IEC01 " + roofCu + " sq.mm.", H, [[845, 292], [845, 334]]);
  D.ln(E, 920, 105, 920, tY1);
  D.tx(935, 92, "IEC01 6 sq.mm.", H); if (tray) D.tx(935, 104, "IN PERFORATED TRAY", H);
  D.pl(T, [[920, 118], [906, 118]]); D.tx(872, 121, "DETAIL B", H);
  /* แผง 2 กลุ่ม · RAIL 2 เส้นต่อกลุ่ม ต่อจากแกนดินทุกเส้น */
  D.tx(958, 136, "PV STRING", H);
  [[143, [160, 222]], [255, [272, 330]]].forEach((g) => {
    for (let i = 0; i < 4; i++) D.rc(E, 955 + i * 49.5, g[0], 49.5, 97);
    D.rc(E, 1208, g[0], 47, 97);
    D.tx(1182, g[0] + 52, "ooo", H, { align: 1 });
    g[1].forEach((ry) => {
      D.ln(DL("cell"), 940, ry, 1300, ry);
      D.ln(E, 920, ry, 952, ry); slV(935, ry);
      D.dot(E, 920, ry, 2.2);
      [1004, 1103, 1208].forEach((cx) => D.rc(E, cx - 3, ry - 4, 6, 8));
      D.tx(1215, ry - 3, "ALUMINUM RAIL", H);
    });
  });
  D.pl(T, [[1004, 156], [1004, 113], [1012, 113]]); D.tx(1015, 116, "DETAIL A", H);
  if (walk) {
    D.dot(E, 920, 410, 2.2); D.ln(E, 920, 410, 955, 410); slV(935, 410);
    D.tx(958, 405, "WALK WAY", H);
    D.rc(E, 955, 408, 80, 22);
    for (let i = 0; i < 16; i++) D.ln(DL("cell"), 958 + i * 5, 410, 958 + i * 5, 428);
    D.ln(E, 955, 414, 1035, 414); D.ln(E, 955, 424, 1035, 424);
    D.lead(935, 378, "IEC01 6 sq.mm.", H, [[935, 404]]);
  }
  if (tray) {
    D.dot(E, 920, 458, 2.2); D.ln(E, 920, 458, 955, 458); slV(935, 458);
    D.tx(958, 452, "PERFORRATE TRAY", H);
    D.rc(E, 955, 455, 350, 7);
    D.ci(E, 1118, 458, 7); D.ln(E, 1118, 451, 1118, 465);
    D.pl(T, [[1125, 451], [1130, 445], [1138, 445]]); D.tx(1140, 448, "DETAIL D", H);
    D.pl(T, [[1118, 465], [1118, 487], [1210, 487]]); D.tx(1122, 485, "IEC01 6 sq.mm.", H);
  }

  /* ── DETAIL A–D: รูปต้นแบบของผู้ใช้ลอกเป็นเส้นทั้งกล่อง (หัวเรื่อง · กรอบ · ป้าย) — ย่อให้กรอบตรงตำแหน่งเดิม · D เฉพาะงานที่มีรางไฟ ── */
  const CL = DL("cell");
  const FW = 274, FH = 131;
  D.art("G1A", 104.03, 553.83, 3.443, E, CL, H, { f: [19, 66.5, 961.5, 407.5], x: 109.5, w: FW, h: FH });
  D.art("G1B", 399.0, 553.9, 3.46, E, CL, H, { f: [19.5, 66.5, 961.5, 463], x: 398.5, w: FW, h: FH });
  D.art("G1C", 694.35, 548.16, 3.462, E, CL, H, { f: [18, 86.5, 888.5, 538.5], x: 687.5, w: FW, h: FH });
  if (tray) D.art("G1D", 971.15, 549.87, 3.459, E, CL, H, { f: [9.5, 80.5, 880, 532.5], x: 976.5, w: FW, h: FH });
  D.tx(15, 785, "*REMARK:  ADD GROUND ROD", HB);
  D.tx(84, 800, "IF EXISTING GROUND SYSTEM MORE THAN 5 OHM.", HB);
  return S.doc.build();
}

/* ==================================================================
   ระบบต่อลงดิน แผ่นที่ 2 (GROUNDING DETAIL) — ลอกแบบมาตรฐานที่ผู้ใช้ส่ง 2026-11-02
   TOP VIEW แผง/ราง/สาย 1C-6 ลงสายเมน 1C-16 ในรางไฟ · SECTION A · GROUNDING FOR PERFORATED TRAY · DETAIL A (หางปลา) · B (C-CLAMP) · C (แคลมป์กลาง + RAIL EARTHING)
   ================================================================== */
function dsGroundDetSheet(st, job, media) {
  media = media || {};
  const S = dsMm(st, job, media, "GROUND2", "GROUNDING DETAIL");
  const pen = S.pen, A = S.A, E = DL("eq"), T = PG_TBL.txt, W = DL("gw"), G16 = DL("gw16"), RL = DL("railD");
  const D = dsPx(pen, A, 1337, A.y1 - 16), H = PG_TS.cell;
  const lug = (x, y) => { D.ci(E, x, y, 7); D.dot(E, x, y, 4.5); };

  /* ── TOP VIEW ── */
  const cols = [[85, 135], [137, 260], [262, 385]], rows = [[95, 350], [355, 660]];
  rows.forEach((r) => cols.forEach((c, i) => { if (i) D.rc(E, c[0], r[0], c[1] - c[0], r[1] - r[0]); else D.pl(E, [[c[1], r[0]], [c[0], r[0]]]), D.pl(E, [[c[0], r[1]], [c[1], r[1]]]), D.ln(E, c[1], r[0], c[1], r[1]); }));
  /* ขอบตัดซ้าย (ซิกแซก) */
  [[95, 350, 270], [355, 660, 580]].forEach((z) => D.pl(E, [[85, z[0]], [85, z[2] - 12], [72, z[2]], [85, z[2] + 12], [85, z[1]]]));
  [163, 300, 465, 610].forEach((y) => {
    D.ln(RL, 85, y - 3, 405, y - 3); D.ln(RL, 85, y + 3, 405, y + 3);
    [135, 260].forEach((x) => D.rc(E, x - 3, y - 4, 6, 8));
    D.rc(E, 382, y - 4, 6, 8);
  });
  D.ci(T, 260, 163, 12); D.ci(T, 385, 163, 12); D.ci(T, 262, 300, 12);
  /* สาย 1C-6 เลียบปลายราง → เลี้ยวเข้าสาย 1C-16 ในรางไฟ */
  D.pl(W, [[398, 163], [398, 640], [403, 652], [415, 660], [437, 662]]);
  [163, 310, 465, 610].forEach((y) => lug(398, y));
  D.ln(G16, 437, 150, 437, 675);
  D.pl(E, [[431, 145], [434, 140], [440, 148], [443, 143]]);
  D.tx(440, 128, "to Ground Test Box", H, { align: 1 });
  /* เครื่องหมายรูปตัด A */
  D.ci(E, 480, 40, 13); D.ln(E, 467, 40, 493, 40); D.tx(480, 37, "A", H, { align: 1 });
  D.pl(E, [[467, 40], [480, 22], [493, 40]]);
  D.pl(E, [[490, 705], [490, 717], [465, 717]]); D.pl(E, [[470, 712], [462, 717], [470, 722]], true);
  D.lead(180, 62, "PV MODULE", H, [[165, 62], [150, 95]]);
  D.tx(100, 104, "MIDDLE CLAMP AND RAIL EARTHING", H); D.tx(160, 116, "SEE DETAIL C", H);
  D.pl(T, [[230, 104], [252, 152]]);
  D.lead(300, 103, "END CLAMP", H, [[352, 103], [378, 152]]);
  D.lead(20, 163, "RAIL MOUNTING", H, [[95, 163], [132, 163]]);
  D.lead(130, 248, "MIDDLE CLAMP", H, [[205, 248], [255, 292]]);
  D.tx(330, 265, "COPPER LUG", H); D.tx(330, 277, "SEE DETAIL A", H); D.pl(T, [[375, 270], [392, 304]]);
  D.lead(480, 225, "1C-6 sq.mm. IEC01", H, [[398, 225]]);
  D.lead(480, 255, "1C-16 sq.mm. IEC01", H, [[437, 255]]); D.tx(480, 267, "IN PERFORATED TRAY", H);
  D.lead(480, 560, "1C-16 sq.mm. IEC01", H, [[420, 655]]);
  D.cap(170, 690, "TOP VIEW");

  /* ── SECTION A ── */
  D.rc(E, 158, 815, 322, 7); D.rc(E, 637, 815, 322, 7);
  D.ln(W, 195, 828, 1080, 828);
  D.ln(G16, 180, 832, 1085, 832);
  D.ci(E, 195, 830, 8); D.dot(E, 195, 830, 5);
  [415, 705, 900].forEach((x) => lug(x, 828));
  [195, 415, 705, 900].forEach((x) => { D.ln(E, x, 822, x, 850); D.pl(E, [[x - 3, 845], [x, 851], [x + 3, 845]]); });
  D.tx(1092, 835, "to Ground bar MDB", H); D.pl(E, [[1086, 826], [1083, 830], [1088, 833], [1085, 838]]);
  D.lead(165, 748, "1C-6 sq.mm. IEC01", H, [[262, 748], [300, 826]]);
  D.tx(45, 788, "COPPER C-CLAMP", H); D.tx(55, 800, "SEE DETAIL B", H); D.pl(T, [[110, 794], [180, 794], [190, 822]]);
  D.tx(568, 778, "COPPER LUG", H); D.tx(568, 790, "SEE DETAIL A", H); D.pl(T, [[568, 784], [520, 784], [425, 820]]);
  D.lead(1100, 790, "1C-16 sq.mm. IEC01", H, [[1085, 790], [1040, 828]]); D.tx(1100, 802, "IN PERFORATED TRAY", H);
  D.cap(560, 885, "SECTION A");

  /* ── GROUNDING FOR PERFORATED TRAY · DETAIL A/B/C: รูปต้นแบบของผู้ใช้ลอกเป็นเส้น (รวมป้ายและชื่อรูป) ── */
  const CL = DL("cell");
  D.art("TRAY", 640, 75, 2.925, E, CL, H);
  D.art("G2A", 1005, 140, 3.13, E, CL, H);
  D.art("G2B", 980, 445, 3.216, E, CL, H);
  D.art("G2C", 630, 400, 2.29, E, CL, H);
  return S.doc.build();
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
  if (dsHasMetal(st)) add("MOUNT", "รายละเอียดติดตั้งเมทัลชีท", (o) => dsMountSheet(st, job, o));   // ผู้ใช้ 2026-11-02 "เพิ่มหน้านี้ไปหน้า 9 สำหรับงานติดตั้งหลังคาเมทัลชีท"
  add("GROUND", "ระบบต่อลงดิน", (o) => dsGroundSheet(st, job, o));
  add("GROUND2", "รายละเอียดต่อลงดิน", (o) => dsGroundDetSheet(st, job, o));
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
  dsWalkSheet, dsSafetySheet, dsStrDetSheet, dsGroundSheet, dsGroundDetSheet, dsGroups });
