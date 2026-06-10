/* ============================================================
   PHITHAN GREEN — BOQ / ถอดวัสดุต่องาน
   เครื่องคำนวณปริมาณวัสดุหลัก (PV / INVERTER / MOUNTING / CABLE)
   สูตรอ้างอิงจากไฟล์ "BOM REV.02.xlsx" (ADD DATA + CAL-MOUNTING + ATMOCE)
   ============================================================ */
(function () {
  // ── ตารางรุ่นแผง: Wp, ความหนาเฟรม(mm), ความกว้างแผงด้านวางราง(m) ──
  // width = ค่าคอลัมน์ L ในชีต DATA (ด้านสั้นที่เรียงชิดกันบนราง)
  const PANELS = [
    { model: "LONGi Hi-MO X10 650W-LR7-72HVH-650M", wp: 650, frame: 30, width: 1.134 },
    { model: "LONGi Hi-MO X10 720W-LR7-72HVH-720M", wp: 720, frame: 35, width: 1.303 },
  ];

  // ── ไมโครอินเวอร์เตอร์: perInverter = จำนวนแผงต่อ 1 ตัว ──
  const MICRO = [
    { ratio: "1:1", model: "ATMOCE Micro-inverter 500Watt 1:1", perInverter: 1 },
    { ratio: "2:1", model: "ATMOCE Micro-inverter 1250Watt 2:1 ", perInverter: 2 },
  ];

  const COMBINER = { 1: "M-Combiner 1P (MC-100)", 3: "M-Combiner 3P (MC-100T)" };
  const CT       = { 1: "CT 250A x1", 3: "CT 250A x3" };
  const BACKUP   = { 1: "M-Backup 1P (MU100-S)", 3: "M-Backup 3P (MU100-T)" };
  const JUNCTION = { 1: "Single-phase junction adapter", 3: "Three-phase junction adapter" };
  const BATTERY_MODEL = "7kWh M-Battery (MS-7K-U)";
  const BATTERY_UNIT_KWH = 7;

  // ── หลังคา → รุ่นขายึด (roof hook / L-feet) ──
  const ROOF_HOOKS = [
    { roof: "เมทัลชีท", model: "L FEET D09 NORMAL STUD WITH 3M" },
    { roof: "กระเบื้องลอนคู่", model: "L FEET D08 LONG STUD WITH 3M" },
    { roof: "เมทัลชีท V-750 (S03P)", model: "SEAM HOOK S03 PURE Type. + L FEET NORMAL STUD WITH 3M" },
    { roof: "เมทัลชีท KL-700", model: "SEAM HOOK S09 PURE Type. + L FEET NORMAL STUD WITH 3M" },
    { roof: "เมทัลชีท 450", model: "SEAM HOOK S08 PURE Type. + L FEET NORMAL STUD WITH 3M" },
    { roof: "CPAC CAP", model: "CPAC ROOF HOOK KITS (BASOR) CAP" },
    { roof: "CPAC CAP แผ่นเรียบ", model: "CPAC ROOF HOOK KITS (BASOR) CAP แผนเรียบ" },
    { roof: "Shingle Roof", model: "L FEET WITH FLASHING FULL ANODIZED" },
  ];

  // ── คลิปแคลมป์ ตามความหนาเฟรมแผง (mm) ──
  const MID_CLAMP = { 30: "MID CLAME KIT 30mm.", 33: "MID CLAME KIT 30mm.", 35: "MID CLAME KIT 35mm." };
  const END_CLAMP = { 30: "END CLAMP KIT 30mm.", 33: "END CLAMP KIT 30mm.", 35: "END CLAMP KIT 35mm." };
  const RAIL = { 4.2: "RAIL 4.2 M ", 4.8: "RAIL 4.8 M " };

  // ── ชนิดสายไฟที่เลือกได้ ──
  const CABLE_TYPES = [
    "CV-FD 1Cx2.5 SQ.MM.", "CV-FD 1Cx4 SQ.MM.", "CV-FD 1Cx6 SQ.MM.", "CV-FD 1Cx10 SQ.MM.",
    "CV-FD 1Cx16 SQ.MM.", "CV-FD 1Cx25 SQ.MM.", "CV-FD 1Cx35 SQ.MM.",
    "CV-FD 4Cx2.5 SQ.MM.", "CV-FD 4Cx4 SQ.MM.", "CV-FD 4Cx6 SQ.MM.", "CV-FD 4Cx10 SQ.MM.",
    "VCT 2Cx2.5 SQ.MM.", "VCT 2Cx4 SQ.MM.", "VCT 2Cx6 SQ.MM.",
    "IEC01(THW)1Cx6 SQ.MM. Y/G", "IEC01(THW)1Cx10 SQ.MM. Y/G", "IEC01(THW)1Cx16 SQ.MM. Y/G",
    "LAN CAT6 ",
  ];

  // สายไฟชุดมาตรฐาน (ค่าเริ่มต้น) — แก้ระยะได้
  const DEFAULT_CABLES = [
    { name: "MICRO-MICRO",     type: "CV-FD 4Cx4 SQ.MM.",            length: 50 },
    { name: "MICRO-COMBINER",  type: "VCT 2Cx2.5 SQ.MM.",           length: 100 },
    { name: "COMBINER-MCB",    type: "CV-FD 4Cx2.5 SQ.MM.",         length: 50 },
    { name: "COMBINER-BAT.",   type: "CV-FD 1Cx6 SQ.MM.",           length: 50 },
    { name: "COMBINER-BACKUP", type: "CV-FD 4Cx2.5 SQ.MM.",         length: 70 },
    { name: "GROUND",          type: "IEC01(THW)1Cx10 SQ.MM. Y/G",  length: 70 },
    { name: "LAN",             type: "LAN CAT6 ",                   length: 50 },
  ];

  // ── ท่อร้อยสาย (RACE WAY) ──
  const IMC_SIZES = ['IMC 1"', 'IMC 1-1/4"', 'IMC 1-1/2"', 'IMC 2"', 'IMC 2-1/2"', 'IMC 3"', 'IMC 3-1/2"'];
  const UPVC_SIZES = [
    "ท่อขาว uPVC 16mm. (สีขาว)", "ท่อขาว uPVC 20mm. (สีขาว)", "ท่อขาว uPVC 25mm. (สีขาว)", "ท่อขาว uPVC 32mm. (สีขาว)",
  ];
  const PULLBOX_SIZES = [
    "PULL BOX (HDG.) 100x100x100mm.", "PULL BOX (HDG.) 150x150x100mm.", "PULL BOX (HDG.) 150x150x150mm.",
    "PULL BOX (HDG.) 200x200x100mm.", "PULL BOX (HDG.) 200x200x150mm.", "PULL BOX (HDG.) 200x200x200mm.",
    "กล่องพักสายไฟ uPVC สีขาว 100x100x50mm.", "กล่องพักสายไฟ uPVC สีขาว 150x150x50mm.",
  ];

  const ROOF_OPTIONS = ROOF_HOOKS.map((r) => r.roof);

  function blankBOQ(job) {
    job = job || {};
    return {
      panels: +job.panels || 0,
      panelModel: PANELS[0].model,
      phase: String(job.phase) === "3" ? 3 : 1,
      microRatio: "2:1",
      batteryKwh: 0,
      backup: !!job.backup,
      roof: "เมทัลชีท",
      railSize: 4.2,
      gap: 0.025,
      endSpare: 0.6,
      lfeetPerRail: 4,
      sparePct: { rail: 5, joiner: 5, endClamp: 10, midClamp: 10, lfeet: 5, ground: 10 },
      rows: [{ panels: +job.panels || 0, count: 1 }],
      cables: DEFAULT_CABLES.map((c) => Object.assign({}, c)),
      conduit: { imc: [], upvc: [], pullbox: [], flex: {}, upFlex: {} },
      conduitSpare: { clamp: 10, bushing: 10, cchannel: 10, connector: 10, coupling: 10, upStraight: 10, upClamp: 10, upConnector: 10 },
    };
  }

  // ── เครื่องคำนวณหลัก: คืน { groups:[{group, items:[{name,qty,unit}]}], meta } ──
  function calcBOQ(b) {
    b = b || {};
    const panel = PANELS.find((p) => p.model === b.panelModel) || PANELS[0];
    const phase = String(b.phase) === "3" ? 3 : 1;
    const sp = b.sparePct || {};
    const railSize = +b.railSize || 4.2;
    const gap = +b.gap || 0;
    const endSpare = +b.endSpare || 0;
    const lfeetPerRail = +b.lfeetPerRail || 0;

    // กรอกจำนวนแผงโดยตรง → คำนวณขนาดติดตั้ง (kW) ย้อนกลับ
    // (รองรับข้อมูลเก่าที่เก็บเป็น kw)
    const panelCount = (b.panels !== undefined && b.panels !== null && b.panels !== "")
      ? Math.round(+b.panels || 0)
      : Math.round(((+b.kw || 0) * 1000) / panel.wp);
    const kw = Math.round((panelCount * panel.wp / 1000) * 100) / 100;

    // ── MOUNTING ต่อแถว (อ้างอิง CAL-MOUNTING) ──
    let railSum = 0, joinerSum = 0, midSum = 0, endSum = 0, lbracketSum = 0, earthlugSum = 0, rowsSum = 0;
    (b.rows || []).forEach((r) => {
      const pr = +r.panels || 0, nr = +r.count || 0;
      if (!pr || !nr) return;
      rowsSum += pr * nr;
      const lenRow = (((panel.width + gap) * pr) - gap) + endSpare;     // ความยาว/แถว
      const tonRow = Math.ceil(lenRow / railSize);                       // ปัดเศษ ท่อน/แถว (ROUNDUP)
      const railx2 = tonRow * 2;                                         // ราง 2 ชั้น
      railSum     += nr * railx2;
      joinerSum   += nr * ((tonRow - 1) * 2);
      midSum      += nr * ((pr - 1) * 2);
      endSum      += nr * 4;
      lbracketSum += (nr * railx2) * lfeetPerRail;
      earthlugSum += nr * 2;
    });
    const pct = (v, p) => Math.round(v * (1 + (+p || 0) / 100));
    const rail      = pct(railSum, sp.rail);
    const joiner    = pct(joinerSum, sp.joiner);
    const mid       = pct(midSum, sp.midClamp);
    const end       = pct(endSum, sp.endClamp);
    const lfeet     = pct(lbracketSum, sp.lfeet);
    const groundlug = pct(earthlugSum, sp.ground);

    // ── INVERTER ──
    const micro = MICRO.find((m) => m.ratio === b.microRatio) || MICRO[1];
    const invCount = micro.perInverter ? panelCount / micro.perInverter : panelCount;
    const battCount = Math.round((+b.batteryKwh || 0) / BATTERY_UNIT_KWH);

    // ── CABLE: รวมตามชนิดสาย ──
    const cableAgg = {};
    (b.cables || []).forEach((c) => {
      const t = (c.type || "").trim();
      const len = +c.length || 0;
      if (!t || len <= 0) return;
      cableAgg[t] = (cableAgg[t] || 0) + len;
    });

    const groups = [];
    // PV
    groups.push({ group: "PV MODULE", items: [
      { name: panel.model, qty: panelCount, unit: "PANEL" },
    ] });
    // INVERTER
    const inv = [
      { name: micro.model, qty: invCount, unit: "LOT" },
      { name: COMBINER[phase], qty: 1, unit: "SET" },
      { name: CT[phase], qty: 1, unit: "SET" },
    ];
    if (b.backup) inv.push({ name: BACKUP[phase], qty: 1, unit: "SET" });
    if (battCount > 0) inv.push({ name: BATTERY_MODEL, qty: battCount, unit: "SET" });
    inv.push({ name: JUNCTION[phase], qty: 1, unit: "SET" });
    inv.push({ name: "1.3 m, Three-terminal AC Cable (MW-025013-A)", qty: invCount, unit: "SET" });
    inv.push({ name: "2 m, Two-terminal AC Cable (MW-025020-B0)", qty: Math.max(invCount - 3, 0), unit: "SET" });
    groups.push({ group: "INVERTER", items: inv });
    // MOUNTING
    const roofHook = (ROOF_HOOKS.find((r) => r.roof === b.roof) || ROOF_HOOKS[0]).model;
    groups.push({ group: "MOUNTING", items: [
      { name: RAIL[railSize] || ("RAIL " + railSize + " M"), qty: rail, unit: "SET" },
      { name: "RAIL SPLICE KIT", qty: joiner, unit: "SET" },
      { name: "BOLT&N2 NUT M8 20mm.", qty: Math.round(invCount * 2), unit: "SET" },
      { name: "EARTHING CLIP", qty: Math.round(lfeet / 2), unit: "SET" },
      { name: "GROUNDING LUG COPPER LINES", qty: groundlug, unit: "SET" },
      { name: MID_CLAMP[panel.frame] || "MID CLAME KIT", qty: mid, unit: "SET" },
      { name: END_CLAMP[panel.frame] || "END CLAMP KIT", qty: end, unit: "SET" },
      { name: roofHook, qty: lfeet, unit: "SET" },
    ] });
    // CABLE
    groups.push({ group: "CABLE", items: Object.keys(cableAgg).map((t) => ({ name: t, qty: cableAgg[t], unit: "M" })) });

    // RACE WAY (ท่อร้อยสาย: IMC + อุปกรณ์ / uPVC / PULL BOX)
    const cond = b.conduit || {};
    const cs = b.conduitSpare || {};
    const cpct = (v, p) => Math.round(v * (1 + (+p || 0) / 100));
    const aggBy = (arr, valKey) => {
      const m = {};
      (arr || []).forEach((x) => { const nm = (x.size || "").trim(), q = +x[valKey] || 0; if (nm && q > 0) m[nm] = (m[nm] || 0) + q; });
      return m;
    };
    const imcMap = aggBy(cond.imc, "length");        // ขนาด → ความยาวรวม (m)
    const upvcMap = aggBy(cond.upvc, "length");
    const pbMap = aggBy(cond.pullbox, "qty");
    const imcSizes = Object.keys(imcMap);
    const imcTotalLen = imcSizes.reduce((s, k) => s + imcMap[k], 0);
    // แยกประเภท PULL BOX: uPVC vs HDG/เหล็ก
    let pbHdg = 0, pbUpvc = 0;
    Object.keys(pbMap).forEach((k) => { if (/uPVC/i.test(k)) pbUpvc += pbMap[k]; else pbHdg += pbMap[k]; });
    const hasBat = (+b.batteryKwh || 0) > 0;
    const hasBk = !!b.backup;

    const race = [];
    const flexMap = cond.flex || {};
    // อุปกรณ์ IMC คำนวณ "แยกตามขนาดท่อ" — มีกี่ขนาดก็ได้อุปกรณ์ตามนั้น
    let totalClamp = 0;
    imcSizes.forEach((nm) => {
      const len = imcMap[nm];
      const sz = nm.replace(/^IMC\s*/i, "").trim();      // เช่น 1"
      const pipes = Math.ceil(len / 3);                   // 3m/ท่อน
      const clamp = cpct(len, cs.clamp);                  // 1 ตัว/เมตร
      const bushing = cpct(8 + pipes, cs.bushing);        // 8 + จำนวนท่อน
      const connector = cpct(10 + 2 * pbHdg, cs.connector); // 10 + 2/PULL BOX HDG
      const coupling = cpct(pipes / 2 + connector, cs.coupling);
      const flex = (flexMap[nm] != null && flexMap[nm] !== "") ? Math.round(+flexMap[nm] || 0) : 1; // ท่ออ่อน default 1 กล่อง/ขนาด
      totalClamp += clamp;
      race.push({ name: nm + " (3m/ท่อน)", qty: pipes, unit: "ท่อน" });
      race.push({ name: "แคล้มประกับ IMC " + sz, qty: clamp, unit: "ตัว" });
      race.push({ name: "บุชชิ่ง,ล็อกนัท IMC " + sz, qty: bushing, unit: "ตัว" });
      race.push({ name: "คอนเนคเตอร์ท่ออ่อนกันน้ำ IMC " + sz, qty: connector, unit: "ตัว" });
      race.push({ name: "คุปปิ้ง " + sz, qty: coupling, unit: "ตัว" });
      if (flex > 0) race.push({ name: "ท่ออ่อนเหล็กกันน้ำ 30m. " + sz, qty: flex, unit: "กล่อง" });
    });
    if (imcTotalLen > 0) {
      // รางซี เป็นของรวมทั้งงาน (ไม่แยกขนาด)
      const cchannel = cpct((totalClamp * 0.2) / 1.2, cs.cchannel); // 0.2m/แคล้ม, รางยาว 1.2m
      race.push({ name: "รางซี C-Channel 20x1200x40x1.0 mm.", qty: cchannel, unit: "เส้น" });
    }
    // uPVC แยกตามขนาด — ท่อ (2.9m/ท่อน) + อุปกรณ์
    const upFlexMap = cond.upFlex || {};
    Object.keys(upvcMap).forEach((nm) => {
      const len = upvcMap[nm];
      const mm = (nm.match(/(\d+)\s*mm/) || [])[1] || "";
      const suf = mm ? (mm + "mm. (สีขาว)") : "";
      const pipes = Math.ceil(len / 2.9);                 // 2.90m/ท่อน
      const straight = cpct(pipes + 4, cs.upStraight);    // ข้อต่อตรง = ท่อน + 4
      const clamp = cpct(len / 0.6, cs.upClamp);          // แคลมป์ก้ามปู ทุก 60cm
      const connector = cpct(8 + (hasBat ? 4 : 0) + (hasBk ? 4 : 0) + 3 * pbUpvc, cs.upConnector);
      const flex = (upFlexMap[nm] != null && upFlexMap[nm] !== "") ? Math.round(+upFlexMap[nm] || 0) : 1;
      race.push({ name: nm + " (2.9m/ท่อน)", qty: pipes, unit: "ท่อน" });
      race.push({ name: "ข้อต่อตรง uPVC " + suf, qty: straight, unit: "ตัว" });
      race.push({ name: "แคลมป์ก้ามปู uPVC " + suf, qty: clamp, unit: "ตัว" });
      race.push({ name: "คอนเน็ตเตอร์ uPVC " + suf, qty: connector, unit: "ตัว" });
      if (flex > 0) race.push({ name: "ท่ออ่อนขาว uPVC " + suf, qty: flex, unit: "กล่อง" });
    });
    // PULL BOX (ชิ้น)
    Object.keys(pbMap).forEach((nm) => race.push({ name: nm, qty: pbMap[nm], unit: "ชิ้น" }));

    if (race.length) groups.push({ group: "RACE WAY", items: race });

    return { groups, meta: { panelCount, kw, rowsSum, invCount, battCount, valid: rowsSum === panelCount } };
  }

  window.BOQ = { PANELS, MICRO, ROOF_HOOKS, ROOF_OPTIONS, CABLE_TYPES, DEFAULT_CABLES, IMC_SIZES, UPVC_SIZES, PULLBOX_SIZES, blankBOQ, calcBOQ };
})();
