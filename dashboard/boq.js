/* ============================================================
   PHITHAN GREEN — BOQ / ถอดวัสดุต่องาน
   เครื่องคำนวณปริมาณวัสดุหลัก (PV / INVERTER / MOUNTING / CABLE)
   สูตรอ้างอิงจากไฟล์ "BOM REV.02.xlsx" (ADD DATA + CAL-MOUNTING + ATMOCE)
   ============================================================ */
(function () {
  // ── ตารางรุ่นแผง: Wp, ความหนาเฟรม(mm), ความกว้างแผงด้านวางราง(m) ──
  // width = ค่าคอลัมน์ L ในชีต DATA (ด้านสั้นที่เรียงชิดกันบนราง)
  // สเปคเริ่มต้น (fallback) สำหรับรุ่นที่ระบบรู้จัก — ถ้าคลังยังไม่กรอกสเปคจะใช้ค่านี้
  const DEFAULT_PANELS = [
    { model: "LONGi Hi-MO X10 650W-LR7-72HVH-650M", wp: 650, frame: 30, width: 1.134 },
    { model: "LONGi Hi-MO X10 720W-LR7-72HVH-720M", wp: 720, frame: 35, width: 1.303 },
  ];
  // PANELS = รายการแผงที่ใช้งานจริง (สะท้อนคลังสินค้า) — setPanels() จะ rebuild อาเรย์นี้
  const PANELS = DEFAULT_PANELS.map((p) => Object.assign({}, p));

  // ── ไมโครอินเวอร์เตอร์: perInverter = จำนวนแผงต่อ 1 ตัว ──
  const MICRO = [
    { ratio: "1:1", model: "ATMOCE Micro-inverter 500Watt 1:1", perInverter: 1 },
    { ratio: "2:1", model: "ATMOCE Micro-inverter 1250Watt 2:1 ", perInverter: 2 },
  ];
  // อินเวอร์เตอร์ String/Hybrid (ตั้งสเปคจากคลัง) — setInverters() จะ rebuild อาเรย์นี้
  const INVERTERS = [];

  // ── ชื่อรุ่นอุปกรณ์ Huawei (ต้องตรงกับชื่อในคลังสินค้า เพื่อจับคู่ราคา) ──
  const HW = {
    meter1: "Smart Meter DDSU666-H + CT 100A/40mA (1 เฟส)",
    meter3: "Smart Meter DTSU666-H + CT 100A/40mA (3 เฟส)",
    dongle: "Smart Dongle-WLAN-FE",
    cabinet: "AC/DC Combiner Box ตู้หน้ากระจก เบอร์5",
    dcFuseHolder: "DC FUSE HOLDER",
    dcFuse: "DC FUSE 16A 1000VDC",
    dcSpd: "DC SPD 2P 800VDC 20-40KA",
    dcMcb: "DC MCB 20A 2P 800VDC",
    acSpd1: "AC SPD 2P Uc275V In20Ka/Imax40Ka",
    acSpd3: "AC SPD 4P Uc385V In20Ka/Imax40Ka",
    wireDuct: "WIRE DUCT 40x40mm (ยาว 2 ม.)",
    dinRail: "DIN RAIL DNR274",
    stopper: "Stopper เหล็ก รางปีกนก 2 น็อตคู่",
    groundBar: "Grounding Bus-Bar 8 Slots hole 6mm",
    mc4: "MC4",
    lunaC1: "HUAWEI LUNA2000-10KW-C1 (Power Module)",
    lunaS1: "HUAWEI LUNA2000-S1 (7kWh)",
    smartguard1: "SmartGuard-63A-S0 (1 เฟส)",
    smartguard3: "SmartGuard-63A-T0 (3 เฟส)",
    backupbox1: "Backup Box-B0 (1 เฟส)",
    backupbox3: "Backup Box-B1 (3 เฟส)",
    optimizer: "Smart PV Optimizer SUN2000-600W-P",
    panel1: "ตู้ไฟเพิ่ม 4 pole (1 เฟส)",
    panel3: "ตู้ไฟเพิ่ม 3 pole (3 เฟส)",
    mcb2: "MCB 2P (DIN RAIL)",
    mcb3: "MCB 3P (DIN RAIL)",
    busbar: "บัสบาร์ทองแดงแท้ + ลูกถ้วย sm-25 125A ยาว 125cm",
  };
  const RCBO_SIZES = [16, 20, 25, 32, 40, 50, 63, 100];
  // เลือกขนาด RCBO จากกระแสออก × 1.25 ปัดขึ้นไปขนาดมาตรฐานถัดไป
  function rcboAmp(outA) { const v = (+outA || 0) * 1.25; for (let i = 0; i < RCBO_SIZES.length; i++) { if (RCBO_SIZES[i] >= v) return RCBO_SIZES[i]; } return RCBO_SIZES[RCBO_SIZES.length - 1]; }
  function rcboName(outA, phase) { return "RCBO " + rcboAmp(outA) + "A " + (phase === 3 ? "3P+N" : "2P") + " 100mA"; }

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
    { name: "MICRO-MICRO",     type: "", length: "" },
    { name: "MICRO-COMBINER",  type: "", length: "" },
    { name: "COMBINER-MCB",    type: "", length: "" },
    { name: "COMBINER-BAT.",   type: "", length: "" },
    { name: "COMBINER-BACKUP", type: "", length: "" },
    { name: "GROUND",          type: "", length: "" },
    { name: "LAN",             type: "", length: "" },
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
      inverterModel: "",
      strings: 0,
      hwBackup: "none",
      hwOptimizer: false,
      hwExtraPanel: false,
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
      accessories: [],
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
    const battCount = Math.round((+b.batteryKwh || 0) / BATTERY_UNIT_KWH);
    const selInv = b.inverterModel ? INVERTERS.find((x) => x.model === b.inverterModel) : null;
    let invCount, invItems;
    if (selInv) {
      // จำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) — ถ้าไม่ได้ตั้ง MAX PV ใช้ kW ต่อตัวแทน
      const invSizeBase = selInv.maxPv > 0 ? selInv.maxPv : selInv.kw;
      invCount = invSizeBase > 0 ? Math.ceil(kw / invSizeBase) : 0;
      if (selInv.inputs > 0) {
        // ── Huawei (string/hybrid + Combiner Box) ── คิด BOM เต็มชุดตามเฟส + String
        const ph = selInv.phase === 3 ? 3 : 1;
        const strPer = Math.min(Math.max(Math.round(+b.strings || selInv.inputs), 1), selInv.inputs);
        const totalStr = invCount * strPer;
        invItems = [];
        invItems.push({ name: selInv.model, qty: invCount, unit: "ตัว" });
        invItems.push({ name: ph === 3 ? HW.meter3 : HW.meter1, qty: invCount, unit: "ชุด" });
        invItems.push({ name: HW.dongle, qty: invCount, unit: "ชุด" });
        invItems.push({ name: HW.cabinet, qty: invCount, unit: "ตู้" });
        // อุปกรณ์ตาม String
        invItems.push({ name: HW.dcFuseHolder, qty: totalStr * 2, unit: "ตัว" });
        invItems.push({ name: HW.dcFuse, qty: totalStr * 2, unit: "ตัว" });
        invItems.push({ name: HW.dcSpd, qty: totalStr, unit: "ตัว" });
        invItems.push({ name: HW.dcMcb, qty: totalStr, unit: "ตัว" });
        invItems.push({ name: HW.mc4, qty: totalStr, unit: "ชุด" });
        // อุปกรณ์ป้องกัน/ตู้ ต่อ 1 ตู้ (ต่ออินเวอร์เตอร์)
        invItems.push({ name: ph === 3 ? HW.acSpd3 : HW.acSpd1, qty: invCount, unit: "ตัว" });
        invItems.push({ name: rcboName(selInv.outA, ph), qty: invCount, unit: "ตัว" });
        invItems.push({ name: HW.wireDuct, qty: invCount, unit: "เส้น" });
        invItems.push({ name: HW.dinRail, qty: invCount, unit: "เส้น" });
        invItems.push({ name: HW.stopper, qty: invCount * 10, unit: "ตัว" });
        invItems.push({ name: HW.groundBar, qty: invCount, unit: "อัน" });
        // แบต (ระบบ Hybrid) — LUNA C1 ต่อตัว + S1 ตาม kWh (≤ 3 ต่อ C1)
        if ((+b.batteryKwh || 0) > 0) {
          const s1 = Math.min(Math.ceil((+b.batteryKwh || 0) / 7), 3 * invCount);
          invItems.push({ name: HW.lunaC1, qty: invCount, unit: "ตัว" });
          invItems.push({ name: HW.lunaS1, qty: s1, unit: "ก้อน" });
        }
        // ระบบสำรองไฟ (เลือกอย่างใดอย่างหนึ่ง)
        if (b.hwBackup === "smartguard") invItems.push({ name: ph === 3 ? HW.smartguard3 : HW.smartguard1, qty: invCount, unit: "ตัว" });
        else if (b.hwBackup === "backupbox") invItems.push({ name: ph === 3 ? HW.backupbox3 : HW.backupbox1, qty: invCount, unit: "ตัว" });
        // Optimizer (1:1 ตามจำนวนแผง)
        if (b.hwOptimizer) invItems.push({ name: HW.optimizer, qty: panelCount, unit: "ตัว" });
        // ตู้ไฟเพิ่ม (case by case)
        if (b.hwExtraPanel) {
          invItems.push({ name: ph === 3 ? HW.panel3 : HW.panel1, qty: 1, unit: "ตู้" });
          invItems.push({ name: ph === 3 ? HW.mcb3 : HW.mcb2, qty: 2, unit: "ตัว" });
          if (ph === 3) invItems.push({ name: HW.busbar, qty: 1, unit: "ชุด" });
        }
      } else {
        // String / Hybrid ทั่วไป: จำนวนตัว = ปัดขึ้น(kW รวม ÷ kW ต่อตัว) + แบต
        invItems = [{ name: selInv.model, qty: invCount, unit: "ตัว" }];
        if (battCount > 0) invItems.push({ name: BATTERY_MODEL, qty: battCount, unit: "SET" });
      }
    } else {
      // ไมโคร ATMOCE (ตามอัตราไมโคร) — ชุดเดิม
      const micro = MICRO.find((m) => m.ratio === b.microRatio) || MICRO[1];
      invCount = micro.perInverter ? panelCount / micro.perInverter : panelCount;
      invItems = [
        { name: micro.model, qty: invCount, unit: "LOT" },
        { name: COMBINER[phase], qty: 1, unit: "SET" },
        { name: CT[phase], qty: 1, unit: "SET" },
      ];
      if (b.backup) invItems.push({ name: BACKUP[phase], qty: 1, unit: "SET" });
      if (battCount > 0) invItems.push({ name: BATTERY_MODEL, qty: battCount, unit: "SET" });
      invItems.push({ name: JUNCTION[phase], qty: 1, unit: "SET" });
      invItems.push({ name: "1.3 m, Three-terminal AC Cable (MW-025013-A)", qty: invCount, unit: "SET" });
      invItems.push({ name: "2 m, Two-terminal AC Cable (MW-025020-B0)", qty: Math.max(invCount - 3, 0), unit: "SET" });
    }

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
    groups.push({ group: "INVERTER", items: invItems });
    // MOUNTING
    const roofHook = (ROOF_HOOKS.find((r) => r.roof === b.roof) || ROOF_HOOKS[0]).model;
    groups.push({ group: "MOUNTING", items: [
      { name: RAIL[railSize] || ("RAIL " + railSize + " M"), qty: rail, unit: "SET" },
      { name: "RAIL SPLICE KIT", qty: joiner, unit: "SET" },
      { name: "BOLT&N2 NUT M8 20mm.", qty: Math.round(invCount * 2), unit: "SET" },
      { name: "EARTHING CLIP", qty: Math.round(lfeet / 2), unit: "SET" },
      { name: "GROUNDING LUG COPPER LINES", qty: groundlug, unit: "SET" },
      { name: MID_CLAMP[panel.frame] || ("MID CLAME KIT " + panel.frame + "mm."), qty: mid, unit: "SET" },
      { name: END_CLAMP[panel.frame] || ("END CLAMP KIT " + panel.frame + "mm."), qty: end, unit: "SET" },
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
      race.push({ name: nm + " (3m/ท่อน)", qty: pipes, unit: "pcs" });
      race.push({ name: "แคล้มประกับ IMC " + sz, qty: clamp, unit: "pcs" });
      race.push({ name: "บุชชิ่ง,ล็อกนัท IMC " + sz, qty: bushing, unit: "pcs" });
      race.push({ name: "คอนเนคเตอร์ท่ออ่อนกันน้ำ IMC " + sz, qty: connector, unit: "pcs" });
      race.push({ name: "คุปปิ้ง " + sz, qty: coupling, unit: "pcs" });
      if (flex > 0) race.push({ name: "ท่ออ่อนเหล็กกันน้ำ 30m. " + sz, qty: flex, unit: "box" });
    });
    if (imcTotalLen > 0) {
      // รางซี เป็นของรวมทั้งงาน (ไม่แยกขนาด)
      const cchannel = cpct((totalClamp * 0.2) / 1.2, cs.cchannel); // 0.2m/แคล้ม, รางยาว 1.2m
      race.push({ name: "รางซี C-Channel 20x1200x40x1.0 mm.", qty: cchannel, unit: "pcs" });
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
      race.push({ name: nm + " (2.9m/ท่อน)", qty: pipes, unit: "pcs" });
      race.push({ name: "ข้อต่อตรง uPVC " + suf, qty: straight, unit: "pcs" });
      race.push({ name: "แคลมป์ก้ามปู uPVC " + suf, qty: clamp, unit: "pcs" });
      race.push({ name: "คอนเน็ตเตอร์ uPVC " + suf, qty: connector, unit: "pcs" });
      if (flex > 0) race.push({ name: "ท่ออ่อนขาว uPVC " + suf, qty: flex, unit: "box" });
    });
    // PULL BOX (ชิ้น)
    Object.keys(pbMap).forEach((nm) => race.push({ name: nm, qty: pbMap[nm], unit: "pcs" }));

    if (race.length) groups.push({ group: "RACE WAY", items: race });

    // GROUNDING (ระบบกราวด์) — ตามขนาดติดตั้ง (kW); ไซต์ใหญ่ตั้งแต่ 30 kW เพิ่มอุปกรณ์
    if (panelCount > 0) {
      const big = kw >= 30;
      const gnd = [
        { name: 'แท่งกราวด์ชุบทองแดง 5/8" ยาว 2.4 m', qty: big ? 3 : 1, unit: "pcs" },
        { name: 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 2 ทาง 16 sq.mm Rod 5/8"', qty: big ? 2 : 1, unit: "pcs" },
      ];
      if (big) {
        gnd.push({ name: 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 3 ทาง 16 sq.mm Rod 5/8"', qty: 1, unit: "pcs" });
        gnd.push({ name: "GROUNDTESTBOX-PVC-SEC", qty: 1, unit: "pcs" });
      }
      groups.push({ group: "GROUNDING", items: gnd });
    }

    // ACCESSORIES (เพิ่มเอง / ดึงจากราคาวัสดุ-คลังสินค้า)
    const acc = (b.accessories || []).filter((a) => (a.name || "").trim() && (+a.qty || 0) > 0)
      .map((a) => ({ name: a.name.trim(), qty: +a.qty || 0, unit: a.unit || "" }));
    if (acc.length) groups.push({ group: "ACCESSORIES", items: acc });

    return { groups, meta: { panelCount, kw, rowsSum, invCount, battCount, valid: rowsSum === panelCount } };
  }

  // ── ราคา/ต้นทุน ──────────────────────────────────────────
  // key สำหรับจับคู่ราคา = ชื่อวัสดุ (ตัดส่วนต่อท้าย "(3m/ท่อน)"/"(2.9m/ท่อน)")
  function matKey(name) {
    return String(name || "").replace(/\s*\((?:3m|2\.9m)\/ท่อน\)\s*$/, "").trim();
  }

  // รายการวัสดุทั้งหมดที่ BOQ สร้างได้ — ใช้ในหน้า "ราคาวัสดุ" เพื่อกรอกรหัส+ราคา
  function catalog() {
    const list = [];
    const add = (group, name, unit) => list.push({ group, name: matKey(name), unit });
    PANELS.forEach((p) => add("PV MODULE", p.model, "PANEL"));
    MICRO.forEach((m) => add("INVERTER", m.model, "LOT"));
    add("INVERTER", COMBINER[1], "SET"); add("INVERTER", COMBINER[3], "SET");
    add("INVERTER", CT[1], "SET"); add("INVERTER", CT[3], "SET");
    add("INVERTER", BACKUP[1], "SET"); add("INVERTER", BACKUP[3], "SET");
    add("INVERTER", BATTERY_MODEL, "SET");
    add("INVERTER", JUNCTION[1], "SET"); add("INVERTER", JUNCTION[3], "SET");
    add("INVERTER", "1.3 m, Three-terminal AC Cable (MW-025013-A)", "SET");
    add("INVERTER", "2 m, Two-terminal AC Cable (MW-025020-B0)", "SET");
    Object.keys(RAIL).forEach((k) => add("MOUNTING", RAIL[k], "SET"));
    add("MOUNTING", "RAIL SPLICE KIT", "SET");
    add("MOUNTING", "BOLT&N2 NUT M8 20mm.", "SET");
    add("MOUNTING", "EARTHING CLIP", "SET");
    add("MOUNTING", "GROUNDING LUG COPPER LINES", "SET");
    const midNames = new Set(Object.keys(MID_CLAMP).map((k) => MID_CLAMP[k]));
    const endNames = new Set(Object.keys(END_CLAMP).map((k) => END_CLAMP[k]));
    [...new Set(PANELS.map((p) => p.frame))].forEach((fr) => {   // เผื่อแผงที่ตั้งค่าความหนาเอง
      midNames.add(MID_CLAMP[fr] || ("MID CLAME KIT " + fr + "mm."));
      endNames.add(END_CLAMP[fr] || ("END CLAMP KIT " + fr + "mm."));
    });
    [...midNames].forEach((v) => add("MOUNTING", v, "SET"));
    [...endNames].forEach((v) => add("MOUNTING", v, "SET"));
    ROOF_HOOKS.forEach((r) => add("MOUNTING", r.model, "SET"));
    CABLE_TYPES.forEach((t) => add("CABLE", t, "M"));
    IMC_SIZES.forEach((nm) => {
      const sz = nm.replace(/^IMC\s*/i, "").trim();
      add("RACE WAY", nm, "pcs");
      add("RACE WAY", "แคล้มประกับ IMC " + sz, "pcs");
      add("RACE WAY", "บุชชิ่ง,ล็อกนัท IMC " + sz, "pcs");
      add("RACE WAY", "คอนเนคเตอร์ท่ออ่อนกันน้ำ IMC " + sz, "pcs");
      add("RACE WAY", "คุปปิ้ง " + sz, "pcs");
      add("RACE WAY", "ท่ออ่อนเหล็กกันน้ำ 30m. " + sz, "box");
    });
    add("RACE WAY", "รางซี C-Channel 20x1200x40x1.0 mm.", "pcs");
    UPVC_SIZES.forEach((nm) => {
      const mm = (nm.match(/(\d+)\s*mm/) || [])[1] || "";
      const suf = mm + "mm. (สีขาว)";
      add("RACE WAY", nm, "pcs");
      add("RACE WAY", "ข้อต่อตรง uPVC " + suf, "pcs");
      add("RACE WAY", "แคลมป์ก้ามปู uPVC " + suf, "pcs");
      add("RACE WAY", "คอนเน็ตเตอร์ uPVC " + suf, "pcs");
      add("RACE WAY", "ท่ออ่อนขาว uPVC " + suf, "box");
    });
    PULLBOX_SIZES.forEach((s) => add("RACE WAY", s, "pcs"));
    add("GROUNDING", 'แท่งกราวด์ชุบทองแดง 5/8" ยาว 2.4 m', "pcs");
    add("GROUNDING", 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 2 ทาง 16 sq.mm Rod 5/8"', "pcs");
    add("GROUNDING", 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 3 ทาง 16 sq.mm Rod 5/8"', "pcs");
    add("GROUNDING", "GROUNDTESTBOX-PVC-SEC", "pcs");
    return list;
  }

  // ผูกราคาเข้ากับผลลัพธ์ BOQ → คืน groups (มี code/price/total ต่อรายการ) + grandTotal
  function applyPrices(result, priceMap) {
    priceMap = priceMap || {};
    let grand = 0;
    const groups = (result.groups || []).map((g) => ({
      group: g.group,
      items: g.items.map((it) => {
        const rec = priceMap[matKey(it.name)] || {};
        const price = +rec.price || 0;
        const total = price * (it.qty || 0);
        grand += total;
        return Object.assign({}, it, { code: rec.code || "", price: price, total: total });
      }),
    }));
    return { groups: groups, grandTotal: grand };
  }

  // ── ลงทะเบียนสเปคแผงจากคลังสินค้า: rebuild ทั้งรายการให้ "ตรงกับคลัง" ──
  // ลบจากคลัง → หายจากดรอปดาวน์; frame(ความหนา)→clamp, width(ความกว้าง)→ราง, wp→kW
  // รุ่นที่ยังไม่กรอกสเปคในคลัง จะใช้สเปคเริ่มต้น (DEFAULT_PANELS) แทน ถ้ามี
  function setPanels(list) {
    const out = [];
    (list || []).forEach((p) => {
      if (!p || !p.model) return;
      const model = String(p.model).trim();
      const def = DEFAULT_PANELS.find((d) => d.model === model) || {};
      out.push({
        model: model,
        wp: +p.wp > 0 ? +p.wp : (+def.wp || 0),
        frame: +p.frame > 0 ? +p.frame : (+def.frame || 30),
        width: +p.width > 0 ? +p.width : (+def.width || 0),
      });
    });
    // คลังยังไม่โหลด/ไม่มีแผง → คงค่าเริ่มต้นไว้ กันดรอปดาวน์ว่าง
    const next = out.length ? out : DEFAULT_PANELS.map((d) => Object.assign({}, d));
    PANELS.length = 0;
    next.forEach((p) => PANELS.push(p));
  }

  // ── ทะเบียนอินเวอร์เตอร์ String/Hybrid จากคลังสินค้า (ไมโคร ATMOCE เป็นค่าเริ่มต้นแยก) ──
  // เฉพาะรายการที่ตั้ง type = string/hybrid + kW ต่อตัว เท่านั้นที่นำมาเลือกใน BOQ
  function setInverters(list) {
    const out = [];
    (list || []).forEach((p) => {
      if (!p || !p.model) return;
      const type = p.type === "string" || p.type === "hybrid" ? p.type : "";
      if (!type) return;
      out.push({ model: String(p.model).trim(), type: type, kw: +p.kw || 0, phase: +p.phase || 0, inputs: +p.inputs || 0, maxPv: +p.maxPv || 0, outA: +p.outA || 0 });
    });
    INVERTERS.length = 0;
    out.forEach((x) => INVERTERS.push(x));
  }

  window.BOQ = { PANELS, MICRO, INVERTERS, ROOF_HOOKS, ROOF_OPTIONS, CABLE_TYPES, DEFAULT_CABLES, IMC_SIZES, UPVC_SIZES, PULLBOX_SIZES, blankBOQ, calcBOQ, matKey, catalog, applyPrices, setPanels, setInverters };
})();
