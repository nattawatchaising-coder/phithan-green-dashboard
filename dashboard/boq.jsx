/* ============================================================
   PHITHAN GREEN — BOQ Editor (ถอดวัสดุต่องาน)
   กรอกพารามิเตอร์ → คำนวณรายการวัสดุอัตโนมัติ → บันทึก / ดาวน์โหลด Excel
   ============================================================ */

// ช่องแสดงค่าแบบล็อก (อ่านอย่างเดียว) — ค่ามาจากข้อมูลงาน แก้ได้ที่หน้าแก้งานเท่านั้น
function BoqLocked({ value, unit, num }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }} title="ตั้งค่าจากหน้าแก้งาน">
      <Icon name="lock" size={13} color="var(--text-3)" />
      <span style={{ flex: 1, textAlign: "right", fontFamily: num ? "var(--mono)" : "inherit", fontSize: num ? 15 : 13.5, fontWeight: num ? 700 : 600, color: num ? "var(--primary-dark)" : "var(--text-1)" }}>{value}</span>
      {unit && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{unit}</span>}
    </div>
  );
}

function BOQEditor({ job, onClose, onSave, priceMap, stock }) {
  const bdClose = window.useBackdropClose(onClose);
  const baht = (n) => (Math.round((+n || 0) * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [b, setB] = React.useState(() => {
    const base = job && job.boq ? Object.assign(window.BOQ.blankBOQ(job), job.boq) : window.BOQ.blankBOQ(job);
    // สเปคหลักดึงจากข้อมูลงานเสมอ (ฐานข้อมูลเป็นตัวตั้ง) — แบต/Backup/ออฟติไมเซอร์/จำนวนแผง
    if (job) {
      if (job.panels != null && job.panels !== "") base.panels = job.panels;
      base.batteryKwh = job.battery ? (parseFloat(job.batSize) || 0) : 0;
      base.backup = !!job.backup;
      base.birdnet = !!job.birdnet;   // บ้านติดตาข่ายกันนก → ถอดวัสดุกันนกให้อัตโนมัติ
      base.hwOptimizer = !!(job.connect && job.connect !== "-" && job.connect !== "ไม่มี");
      // งานมี Backup → ตั้งระบบสำรองไฟของ Huawei ให้ (เริ่มที่ Backup Box เปลี่ยนเป็น SmartGuard ได้)
      if (job.backup && (!base.hwBackup || base.hwBackup === "none")) base.hwBackup = "backupbox";
      else if (!job.backup) base.hwBackup = "none";
      base.jobType = job.type || "";  // สะท้อน type ปัจจุบันของงานเสมอ
      base.comboType = job.comboType || "ready";   // ตู้ Combiner (สำเร็จ/ประกอบ) สะท้อนงานเสมอ
    }
    // ปรับค่าเริ่มต้นสายไฟตามงาน: เลือก GROUND/LAN ให้ (ถ้ายังว่าง) · ตัด COMBINER-BAT./BACKUP ออกถ้างานไม่มีแบต/Backup
    if (Array.isArray(base.cables)) {
      base.cables = base.cables
        .filter((c) => !((c.name === "COMBINER-BAT." && !(job && job.battery)) || (c.name === "COMBINER-BACKUP" && !(job && job.backup))))
        .map((c) => {
          if (!c.type && c.name === "GROUND") return Object.assign({}, c, { type: "IEC01(THW)1Cx6 SQ.MM. Y/G" });
          if (!c.type && c.name === "LAN") return Object.assign({}, c, { type: "LAN CAT6" });
          return c;
        });
    }
    return base;
  });
  const hasBattery = !!(job && job.battery);
  const hasBackup = !!(job && job.backup);
  const [adv, setAdv] = React.useState(false);
  const set = (k, v) => setB((p) => Object.assign({}, p, { [k]: v }));
  const setSpare = (k, v) => setB((p) => Object.assign({}, p, { sparePct: Object.assign({}, p.sparePct, { [k]: v }) }));

  const setRow = (i, k, v) => setB((p) => { const rows = p.rows.slice(); rows[i] = Object.assign({}, rows[i], { [k]: v }); return Object.assign({}, p, { rows }); });
  const addRow = () => setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: 0, count: 1 }]) }));
  const fillRemaining = (rem) => { if (rem > 0) setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: rem, count: 1 }]) })); };
  const delRow = (i) => setB((p) => Object.assign({}, p, { rows: p.rows.filter((_, j) => j !== i) }));

  const setCab = (i, k, v) => setB((p) => { const cs = p.cables.slice(); cs[i] = Object.assign({}, cs[i], { [k]: v }); return Object.assign({}, p, { cables: cs }); });
  const addCab = () => setB((p) => Object.assign({}, p, { cables: p.cables.concat([{ name: "", type: "", length: "" }]) }));
  const delCab = (i) => setB((p) => Object.assign({}, p, { cables: p.cables.filter((_, j) => j !== i) }));

  // ── ตารางคำนวณขนาดสายไฟ: ไหลตามวงจร MICRO-MICRO → MICRO-COMBINER → COMBINER(รวม BAT+MICRO) → BACKUP/เมน หรือ → MCB ตู้ลูกค้า ──
  // ins/method/group/ncond = สมมุติฐานของ "สายแนะนำ" ในตารางคำนวณ ตามพิกัด วสท.
  const WIRECALC_DEF = { volt: 0, battKw: 5, strings: 1, backupMainA: 0, ins: "pvc", method: "conduitAir", group: "g1", ncond: "" };
  const wcalc = Object.assign({}, WIRECALC_DEF, b.wireCalc || {});
  const WCALC_STR = { ins: 1, method: 1, group: 1, ncond: 1 };
  const setWcalc = (k, v) => setB((p) => Object.assign({}, p, { wireCalc: Object.assign({}, WIRECALC_DEF, p.wireCalc || {}, { [k]: WCALC_STR[k] ? v : (+v || 0) }) }));
  const wcPhase = +b.phase === 3 ? 3 : 1;
  const wcVolt = +wcalc.volt || (wcPhase === 3 ? 400 : 230);
  const wcStrings = Math.max(1, Math.round(+wcalc.strings || 1));   // แบ่งกี่ String (ขั้นต่ำ 1)
  const calcIns = wcalc.ins || "pvc";
  const calcMethod = wcalc.method || "conduitAir";
  const calcGroup = wcalc.group || "g1";
  const calcNCond = wcalc.ncond ? String(wcalc.ncond) : (wcPhase === 3 ? "3" : "2");   // ว่าง = ตามเฟส
  // เลือกขนาดสายให้รับ กระแส×1.25 (โหลดต่อเนื่อง) — ตามพิกัด วสท. (ฉนวน+วิธี+กลุ่ม+จำนวนตัวนำ · แกนเดียว)
  const pickWire = (amp) => window.BOQ.pickWireSize((+amp || 0) * 1.25, calcIns, { method: calcMethod, group: calcGroup, ncond: calcNCond, core: "single" });
  // กำลังไมโครต่อ 1 ตัว (จากรุ่นที่เลือก: 2:1 = 1250W, 1:1 = 500W) — ใช้คิดสาย MICRO-MICRO
  const microUnit = (window.BOQ.MICRO || []).find((m) => m.ratio === b.microRatio) || (window.BOQ.MICRO || [])[1] || {};
  const microW = parseFloat((String(microUnit.model || "").match(/(\d+(?:\.\d+)?)\s*watt/i) || [])[1]) || 1250;
  const wireCalcRows = React.useMemo(() => {
    const sysKw = +((job && job.kw) || 0);
    const battKw = hasBattery ? (+wcalc.battKw || 0) : 0;
    const combinedKw = sysKw + battKw;
    const div = wcPhase === 3 ? Math.sqrt(3) * wcVolt : wcVolt;   // 3 เฟส: √3 × แรงดันไลน์
    const phaseNote = wcPhase === 3 ? "3 เฟส · √3×" + wcVolt + "V" : "1 เฟส · " + wcVolt + "V";
    const backupA = +wcalc.backupMainA || 0;

    // 1) MICRO-MICRO: ไมโคร 1 ตัว (อุปกรณ์ 1 เฟส 230V) — ไม่หารสตริง
    const microAmp = microW / 230;
    const rows = [
      { kind: "micromicro", label: "MICRO-MICRO", w: microW, ampTotal: microAmp, ampString: microAmp,
        wire: pickWire(microAmp), note: "สายต่อไมโคร · ไมโคร 1 ตัว · 1 เฟส 230V · " + (Math.round(microW / 10) / 100) + " kW", splittable: false },
    ];
    // 2) MICRO-COMBINER: ต่อสตริง (กระแสไมโครรวม ÷ String) — กระแสรวม = ไมโครทุกสตริง
    const mw = sysKw * 1000; const microTotal = div ? mw / div : 0; const microString = microTotal / wcStrings;
    rows.push({ kind: "main", label: "MICRO-COMBINER", w: mw, ampTotal: microTotal, ampString: microString,
      wire: pickWire(microString), note: phaseNote + " · " + sysKw + " kW" + (wcStrings > 1 ? " · แบ่ง " + wcStrings + " สตริง" : ""), splittable: true });
    // 3) COMBINER รวม BAT + MICRO → MCB ตู้ลูกค้า (กรณีไม่มี Backup) / หรือเป็น feed เข้าระบบ Backup
    const cw = combinedKw * 1000; const combAmp = div ? cw / div : 0;
    rows.push({ kind: "mcb", label: hasBackup ? "COMBINER → BACKUP (รวม MICRO+BAT)" : "COMBINER → MCB ตู้ลูกค้า",
      w: cw, ampTotal: combAmp, ampString: combAmp, wire: pickWire(combAmp), battAmp: div ? (battKw * 1000) / div : 0,
      note: "รวม MICRO" + (battKw ? " + BAT " + battKw + " kW" : "") + " · " + phaseNote + " · " + (Math.round(combinedKw * 100) / 100) + " kW", splittable: false });
    // 4) BACKUP → เมนไฟ (MAIN): ใช้ขนาดเมนเบรกเกอร์ที่จะ Backup (กรอกเอง) — เว้นว่างไว้ก่อนได้
    if (hasBackup) {
      rows.push({ kind: "backup", label: "BACKUP → เมนไฟ (MAIN)", w: null, ampTotal: backupA, ampString: backupA,
        wire: backupA ? pickWire(backupA) : "—", needInput: !backupA,
        note: backupA ? "ตามเมนเบรกเกอร์ที่ Backup · " + backupA + " A" : "⚠ ระบุกระแสเมนที่จะ Backup (A) ด้านบน", splittable: false });
    }
    return rows;
  }, [job, microW, wcPhase, wcVolt, wcalc.battKw, wcalc.backupMainA, wcStrings, hasBattery, hasBackup, calcIns, calcMethod, calcGroup, calcNCond]);
  // ── พิกัดกระแสของสายแต่ละเส้น: อ่านชนิด/ขนาด/แกนจากชื่อ + วิธี/กลุ่ม/จำนวนตัวนำ → เทียบพิกัด วสท. ──
  const cableAmp = (name, opts) => window.BOQ.ampacityOf(name, opts);
  // กระแสที่สายต้องรับ (×1.25) ตามจุดเดินสาย — MICRO-MICRO=ไมโคร 1 ตัว · MICRO-COMBINER=ต่อสตริง · COMBINER-BAT=กระแสแบต · COMBINER-BACKUP=ตามเมน · COMBINER-MCB=รวม MICRO+BAT · สายดิน/แลน=ไม่คิดโหลด
  const reqAmpFor = (cabName) => {
    const n = (cabName || "").toUpperCase();
    if (/LAN|CAT|GROUND|กราว|ดิน/.test(n)) return null;
    // ── จุดเดินสายระบบ String/Hybrid ──
    if (/PV-INVERTER/.test(n)) return null;                                  // DC string — คิดในส่วนสาย DC แยก
    const invAcPer = selInv ? (+selInv.outA || 0) : 0;                       // กระแสออก AC ต่ออินเวอร์เตอร์ 1 ตัว
    const invCnt = (result && result.meta && result.meta.invCount) || 1;
    if (/MCB_SOLAR-MDB/.test(n)) return invAcPer ? invAcPer * invCnt * 1.25 : null;   // รวมทุกตัว → ตู้เมน
    if (/INVERTER-MCB_SOLAR/.test(n)) return invAcPer ? invAcPer * 1.25 : null;       // ต่ออินเวอร์เตอร์ 1 ตัว
    const microRow = wireCalcRows.find((r) => r.kind === "micromicro");
    const mainRow = wireCalcRows.find((r) => r.kind === "main") || wireCalcRows[0];
    const mcbRow = wireCalcRows.find((r) => r.kind === "mcb") || mainRow;
    const backupRow = wireCalcRows.find((r) => r.kind === "backup");
    if (/MICRO[\s-]*MICRO/.test(n)) return microRow ? microRow.ampTotal * 1.25 : 0;   // ไมโคร 1 ตัว
    if (/MICRO/.test(n)) return mainRow.ampString * 1.25;                              // MICRO-COMBINER = ต่อสตริง
    if (/BACKUP|สำรอง/.test(n)) return backupRow && backupRow.ampTotal ? backupRow.ampTotal * 1.25 : null;  // ตามเมนที่ Backup
    if (/BAT|แบต/.test(n)) return mcbRow.battAmp ? mcbRow.battAmp * 1.25 : null;        // กระแสแบต
    return mcbRow.ampTotal * 1.25;                                                      // COMBINER → MCB = รวม MICRO+BAT
  };

  // ชื่อจุดเดินสาย: ตัวเลือกตั้งต้น + ที่ผู้ใช้เพิ่มเอง (เก็บใน localStorage ใช้ซ้ำได้)
  const CABLE_PT_KEY = "boq_cable_points_v1";
  const [customPts, setCustomPts] = React.useState(() => { try { return JSON.parse(localStorage.getItem(CABLE_PT_KEY) || "[]"); } catch (e) { return []; } });
  const addCablePt = (name) => {
    const v = (name || "").trim(); if (!v) return;
    setCustomPts((p) => { if (p.indexOf(v) >= 0 || (window.BOQ.CABLE_POINTS || []).indexOf(v) >= 0) return p; const next = p.concat([v]); try { localStorage.setItem(CABLE_PT_KEY, JSON.stringify(next)); } catch (e) {} return next; });
  };
  const cablePtOptions = React.useMemo(() => {
    const used = (b.cables || []).map((c) => c.name).filter(Boolean);
    const all = [...new Set((window.BOQ.CABLE_POINTS || []).concat(customPts).concat(used))];
    return all.map((n) => ({ value: n, label: n }));
  }, [customPts, b.cables]);

  // ── ท่อร้อยสาย (RACE WAY) ──
  const cond = b.conduit || { imc: [], upvc: [], pullbox: [] };
  const setCond = (kind, i, k, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); const a = (c[kind] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); c[kind] = a; return Object.assign({}, p, { conduit: c }); });
  const addCond = (kind, item) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c[kind] = (c[kind] || []).concat([item]); return Object.assign({}, p, { conduit: c }); });
  const delCond = (kind, i) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c[kind] = (c[kind] || []).filter((_, j) => j !== i); return Object.assign({}, p, { conduit: c }); });
  const setFlexSize = (size, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c.flex = Object.assign({}, c.flex, { [size]: v }); return Object.assign({}, p, { conduit: c }); });
  const setUpFlexSize = (size, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c.upFlex = Object.assign({}, c.upFlex, { [size]: v }); return Object.assign({}, p, { conduit: c }); });
  const SPARE_DEF = { clamp: 10, bushing: 10, cchannel: 10, connector: 10, coupling: 10, upStraight: 10, upClamp: 10, upConnector: 10 };
  const setCSpare = (k, v) => setB((p) => Object.assign({}, p, { conduitSpare: Object.assign({}, SPARE_DEF, p.conduitSpare, { [k]: v }) }));
  // งานเพิ่มเติม (Input) — โครงสร้างบนหลังคา
  const STRUCT_DEF = { ladder: [], walkway: [], walkwayThk: 35, guardrail: [], ladderSpare: 5, walkwaySpare: 10, guardrailSpare: 5, ladderExtra: [], walkwayExtra: [], guardrailExtra: [] };
  const st = Object.assign({}, STRUCT_DEF, b.struct);
  const setStruct = (kind, i, k, v) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const a = (s[kind] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); s[kind] = a; return Object.assign({}, p, { struct: s }); });
  const addStruct = (kind, item) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); s[kind] = (s[kind] || []).concat([item]); return Object.assign({}, p, { struct: s }); });
  const delStruct = (kind, i) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); s[kind] = (s[kind] || []).filter((_, j) => j !== i); return Object.assign({}, p, { struct: s }); });
  const setStructVal = (k, v) => setB((p) => Object.assign({}, p, { struct: Object.assign({}, STRUCT_DEF, p.struct, { [k]: v }) }));
  const addStructExtra = (kind) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const key = kind + "Extra"; s[key] = (s[key] || []).concat([{ name: "", qty: "", unit: "" }]); return Object.assign({}, p, { struct: s }); });
  const setStructExtra = (kind, i, k, v) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const key = kind + "Extra"; const a = (s[key] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); s[key] = a; return Object.assign({}, p, { struct: s }); });
  const delStructExtra = (kind, i) => setB((p) => { const s = Object.assign({}, STRUCT_DEF, p.struct); const key = kind + "Extra"; s[key] = (s[key] || []).filter((_, j) => j !== i); return Object.assign({}, p, { struct: s }); });
  const [advS, setAdvS] = React.useState(false);
  const [advC, setAdvC] = React.useState(false);
  const isHome = !!(job && job.type === "home");  // งานบ้าน = ไม่มีงานโครงสร้างเพิ่มเติม
  const [advU, setAdvU] = React.useState(false);

  // ── เครื่องตรวจสอบ WIRE WAY / CONDUIT ──
  const CHECK_TYPES = ["CV FD 4C", "CV FD 3C", "CV FD 2C", "CV FD 1C", "IEC01 (THW)", "PV Cable"];
  const WC_DEF = { wayW: 100, wayH: 100, cables: [] };
  const CC_DEF = { cables: [] };
  const [advWW, setAdvWW] = React.useState(false);
  const [advCD, setAdvCD] = React.useState(false);
  const wc = Object.assign({}, WC_DEF, b.wirecheck || {});
  const cc = Object.assign({}, CC_DEF, b.conduitcheck || {});
  const setWC = (k, v) => setB((p) => Object.assign({}, p, { wirecheck: Object.assign({}, WC_DEF, p.wirecheck || {}, { [k]: v }) }));
  const setWCCable = (i, k, v) => setB((p) => {
    const w = Object.assign({}, WC_DEF, p.wirecheck || {});
    const cs = (w.cables || []).slice(); cs[i] = Object.assign({}, cs[i], { [k]: v });
    if (k === "type") cs[i].size = +(Object.keys((window.BOQ.CABLE_OD || {})[v] || {})[0] || 0);
    return Object.assign({}, p, { wirecheck: Object.assign({}, w, { cables: cs }) });
  });
  const addWCCable = () => setB((p) => { const w = Object.assign({}, WC_DEF, p.wirecheck || {}); const type = "CV FD 4C"; const size = +(Object.keys((window.BOQ.CABLE_OD || {})[type] || {})[0] || 2.5); return Object.assign({}, p, { wirecheck: Object.assign({}, w, { cables: (w.cables || []).concat([{ type, size, qty: 1 }]) }) }); });
  const delWCCable = (i) => setB((p) => { const w = Object.assign({}, WC_DEF, p.wirecheck || {}); return Object.assign({}, p, { wirecheck: Object.assign({}, w, { cables: (w.cables || []).filter((_, j) => j !== i) }) }); });
  const setCCCable = (i, k, v) => setB((p) => {
    const c2 = Object.assign({}, CC_DEF, p.conduitcheck || {});
    const cs = (c2.cables || []).slice(); cs[i] = Object.assign({}, cs[i], { [k]: v });
    if (k === "type") cs[i].size = +(Object.keys((window.BOQ.CABLE_OD || {})[v] || {})[0] || 0);
    return Object.assign({}, p, { conduitcheck: Object.assign({}, c2, { cables: cs }) });
  });
  const addCCCable = () => setB((p) => { const c2 = Object.assign({}, CC_DEF, p.conduitcheck || {}); const type = "CV FD 1C"; const size = +(Object.keys((window.BOQ.CABLE_OD || {})[type] || {})[0] || 2.5); return Object.assign({}, p, { conduitcheck: Object.assign({}, c2, { cables: (c2.cables || []).concat([{ type, size, qty: 1 }]) }) }); });
  const delCCCable = (i) => setB((p) => { const c2 = Object.assign({}, CC_DEF, p.conduitcheck || {}); return Object.assign({}, p, { conduitcheck: Object.assign({}, c2, { cables: (c2.cables || []).filter((_, j) => j !== i) }) }); });
  const wcResult = React.useMemo(() => (window.BOQ.calcWireWay || function () { return { totalArea: 0, wayArea: 0, fillPct: 0, ok: true }; })(wc.cables, wc.wayW, wc.wayH), [wc]);
  const ccResult = React.useMemo(() => (window.BOQ.calcConduitSize || function () { return { totalArea: 0, hdpe: null, imc: null }; })(cc.cables), [cc]);
  const csp = Object.assign({}, SPARE_DEF, b.conduitSpare);

  const result = window.BOQ.calcBOQ(b);
  const priced = window.BOQ.applyPrices(result, priceMap || {});
  const remaining = result.meta.panelCount - result.meta.rowsSum; // >0 ขาด, <0 เกิน, 0 ครบ
  // อินเวอร์เตอร์ String/Hybrid ที่เลือก (Huawei = มี combiner box)
  const selInv = (window.BOQ.INVERTERS || []).find((x) => x.model === b.inverterModel);
  const isHuawei = !!(selInv && selInv.inputs > 0);
  // ── กรองรุ่นอินเวอร์เตอร์ตามแบรนด์ + เฟส ของงาน ──
  const jobBrand = (job && job.brand) || "";
  const jobPhaseNum = String(job && job.phase) === "3" ? 3 : 1;
  const brandInvs = (window.BOQ.INVERTERS || []).filter((x) =>
    (!jobBrand || x.model.toLowerCase().indexOf(jobBrand.toLowerCase()) >= 0) &&
    (!x.phase || x.phase === jobPhaseNum)   // เฉพาะรุ่นที่เฟสตรงกับงาน (รุ่นที่ไม่ระบุเฟส = แสดงทุกเฟส)
  );
  const showMicro = !jobBrand || /atmoce/i.test(jobBrand);   // ไมโคร ATMOCE เป็นของแบรนด์ ATMOCE
  const invOptions = (showMicro ? [{ value: "", label: "ไมโคร ATMOCE (ตามอัตรา)" }] : [])
    .concat(brandInvs.map((x) => ({ value: x.model, label: x.model + (x.kw ? " · " + x.kw + "kW" : "") })));
  // แบรนด์ที่ไม่มีไมโคร (เช่น Huawei) / เปลี่ยนเฟส แล้วรุ่นที่เลือกไม่ตรง → เลือกรุ่นแรกที่ตรงให้
  React.useEffect(() => {
    const inList = brandInvs.some((x) => x.model === b.inverterModel);
    if (!showMicro && !inList && brandInvs.length) set("inverterModel", brandInvs[0].model);
    else if (showMicro && b.inverterModel && !inList) set("inverterModel", "");
  }, [jobBrand, jobPhaseNum]); // eslint-disable-line
  const maxPvTotal = selInv ? (selInv.maxPv || 0) * result.meta.invCount : 0;
  const pvOver = isHuawei && maxPvTotal > 0 && result.meta.kw > maxPvTotal;

  // ── การต่ออนุกรมแผง (String) + สาย DC PV1-F — เฉพาะอินเวอร์เตอร์ String/Hybrid ──
  const selPanel = window.BOQ.findPanel ? window.BOQ.findPanel(b.panelModel) : null;
  const isStringInv = !!(selInv && (selInv.type === "string" || selInv.type === "hybrid"));
  const scfg = isStringInv && window.BOQ.stringConfig
    ? window.BOQ.stringConfig(selPanel, selInv, { series: (b.dcSeries != null && b.dcSeries !== "") ? b.dcSeries : undefined })
    : null;

  // ── สลับชุดจุดเดินสายอัตโนมัติเมื่อเปลี่ยนระหว่างไมโคร ↔ String/Hybrid ──
  // String/Hybrid → PV-INVERTER / INVERTER-MCB_SOLAR / MCB_SOLAR-MDB · ไมโคร → MICRO-MICRO / MICRO-COMBINER ...
  // คงแถวสายดิน/แลน/จุดที่ผู้ใช้เพิ่มเองไว้ · ครั้งแรกที่เปิด (โหลดของเดิม) จะไม่แตะ
  const prevStringRef = React.useRef(null);
  React.useEffect(() => {
    if (prevStringRef.current === null) { prevStringRef.current = isStringInv; return; }
    if (prevStringRef.current === isStringInv) return;
    prevStringRef.current = isStringInv;
    const SYS = window.BOQ;
    const sysAll = (SYS.MICRO_CABLE_NAMES || []).concat(SYS.STRING_CABLE_POINTS || []);
    const defaults = isStringInv
      ? (SYS.DEFAULT_STRING_CABLES || [])
      : (SYS.DEFAULT_CABLES || []).filter((c) => (SYS.MICRO_CABLE_NAMES || []).indexOf(c.name) >= 0
          && !((c.name === "COMBINER-BAT." && !hasBattery) || (c.name === "COMBINER-BACKUP" && !hasBackup)));
    setB((p) => {
      const keep = (p.cables || []).filter((c) => sysAll.indexOf(c.name) < 0);   // สายดิน/แลน/custom
      return Object.assign({}, p, { cables: defaults.map((d) => Object.assign({}, d)).concat(keep) });
    });
  }, [isStringInv]); // eslint-disable-line

  // ── แถวตารางคำนวณสายสำหรับระบบ String/Hybrid (DC + AC ออกอินเวอร์เตอร์) ──
  const stringCalcRows = React.useMemo(() => {
    if (!isStringInv) return [];
    const invCount = (result && result.meta && result.meta.invCount) || 1;
    const outA = selInv ? (+selInv.outA || 0) : 0;
    const phN = wcPhase === 3 ? "3 เฟส" : "1 เฟส";
    const rows = [];
    // 1) PV-INVERTER (DC) — Isc × 1.25 → สาย PV1-F
    if (scfg && scfg.ready) {
      rows.push({ kind: "pv", label: "PV-INVERTER (DC)", w: Math.round((scfg.series || 1) * (scfg.vRef || 0) * (scfg.isc || 0)),
        ampTotal: scfg.isc, ampString: scfg.isc, wire: scfg.dcWire, splittable: false,
        note: "สาย DC · " + scfg.series + " แผงอนุกรม · " + scfg.stringVop + "V · Isc " + scfg.isc + " A" });
    } else {
      rows.push({ kind: "pv", label: "PV-INVERTER (DC)", w: null, ampTotal: 0, ampString: 0, wire: "—", needInput: true, splittable: false,
        note: "⚠ กรอก Voc/Isc แผง + ช่วง MPPT อินเวอร์เตอร์ (คลัง) เพื่อคำนวณสาย DC" });
    }
    // 2) INVERTER → MCB_SOLAR (AC ต่ออินเวอร์เตอร์ 1 ตัว)
    rows.push({ kind: "invmcb", label: "INVERTER → MCB_SOLAR", w: outA ? Math.round(outA * wcVolt) : null,
      ampTotal: outA, ampString: outA, wire: outA ? pickWire(outA) : "—", needInput: !outA, splittable: false,
      note: outA ? "กระแสออกอินเวอร์เตอร์/ตัว · " + phN + " · " + outA + " A" : "⚠ กรอกกระแสออก (A) ของอินเวอร์เตอร์ในคลัง" });
    // 3) MCB_SOLAR → MDB (AC รวมทุกตัว → ตู้เมน)
    const totalA = outA * invCount;
    rows.push({ kind: "mcbmdb", label: "MCB_SOLAR → MDB (ตู้เมน)", w: totalA ? Math.round(totalA * wcVolt) : null,
      ampTotal: totalA, ampString: totalA, wire: totalA ? pickWire(totalA) : "—", needInput: !totalA, splittable: false,
      note: totalA ? "รวม " + invCount + " ตัว · " + phN + " · " + (Math.round(totalA * 10) / 10).toFixed(1) + " A" : "⚠ กรอกกระแสออก (A) ของอินเวอร์เตอร์ในคลัง" });
    return rows;
  }, [isStringInv, selInv, scfg, result, wcVolt, wcPhase, calcIns, calcMethod, calcGroup, calcNCond]);

  const calcRows = isStringInv ? stringCalcRows : wireCalcRows;

  // กันพลาด: ถ้าจำนวนแผงในแถวไม่ตรงกับจำนวนแผงรวม ให้ยืนยันก่อน
  const guardRun = (fn) => {
    if (remaining !== 0) {
      const msg = remaining > 0
        ? ("⚠ ยังวางแผงไม่ครบ — ขาดอีก " + remaining + " แผง (วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + ")\nปริมาณ Mounting จะไม่ครบ ต้องการดำเนินการต่อหรือไม่?")
        : ("⚠ วางแผงเกินจำนวน " + (-remaining) + " แผง (วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + ")\nต้องการดำเนินการต่อหรือไม่?");
      if (!confirm(msg)) return;
    }
    fn();
  };

  const opt = (arr) => arr.map((x) => ({ value: x, label: typeof x === "string" ? x.trim() : x }));

  const GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", "COMBINER BOX": "#4F46E5", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207", "LADDER (บันไดลิง)": "#0D9488", "WALKWAY": "#D97706", "GUARD RAIL": "#DB2777", ACCESSORIES: "#EC4899" };

  // ── Accessories: เพิ่มของ / ดึงจากราคาวัสดุ + คลังสินค้า ──
  const stockItems = (stock && stock.items) || [];
  const matInfo = React.useMemo(() => {
    const m = {};
    (window.BOQ.catalog() || []).forEach((c) => { m[c.name] = { unit: c.unit }; });
    stockItems.forEach((s) => { m[s.name] = { unit: s.unit || (m[s.name] && m[s.name].unit) || "", code: s.sku }; });
    Object.keys(priceMap || {}).forEach((n) => { m[n] = { unit: (priceMap[n].unit || (m[n] && m[n].unit) || ""), code: priceMap[n].code }; });
    return m;
  }, [priceMap, stockItems.length]);
  // จัดวัสดุเป็นหมวดสำหรับเลือกใน Accessories
  const accCat = React.useMemo(() => {
    const SF = window.SF;
    const g2cat = SF.BOQ_GROUP_TO_CAT || {};
    // หมวด BOQ → key คลัง → ชื่อไทยของหมวดคลัง (ใช้ taxonomy เดียวกับคลังสินค้า ครบทุกหมวด)
    const catTh = (key) => (SF.STOCK_CAT_BY[key] ? SF.STOCK_CAT_BY[key].th : "อื่นๆ");
    const cat = window.BOQ.catalog() || [];
    const catKeys = new Set(cat.map((c) => c.name));
    const byCat = {};
    const add = (c, n) => { if (!n) return; (byCat[c] = byCat[c] || new Set()).add(n); };
    cat.forEach((c) => add(catTh(g2cat[c.group] || "accessory"), c.name));
    Object.keys(priceMap || {}).forEach((n) => { if (!catKeys.has(n)) add(catTh(g2cat[priceMap[n].group] || "accessory"), n); });
    stockItems.forEach((s) => add(catTh(s.cat), s.name));
    const order = (SF.STOCK_CATS || []).map((c) => c.th);
    const cats = Object.keys(byCat).sort((a, z) => { const ia = order.indexOf(a), iz = order.indexOf(z); return (ia < 0 ? 99 : ia) - (iz < 0 ? 99 : iz); });
    const map = {}; cats.forEach((c) => { map[c] = [...byCat[c]].sort(); });
    return { cats, map };
  }, [priceMap, stockItems.length]);

  // ชนิดสายไฟ: ดึงจากคลังสินค้าหมวด "สายไฟ / ไฟฟ้า" (wiring) — ไม่มีของในคลังจึง fallback รายการตั้งต้น
  // จัดหมวดสายไฟ: ใช้หมวดที่ตั้งในคลัง (cableGroup) ก่อน · ไม่มีก็เดาจากชื่อ
  const cableCat = window.BOQ.cableCategory || ((n) => "อื่นๆ");
  const CABLE_CAT_ORDER = window.BOQ.CABLE_GROUPS || ["อื่นๆ"];
  const cableTypeOptions = React.useMemo(() => {
    const wiringStock = stockItems.filter((s) => s.cat === "wiring");
    const groupByName = {};
    wiringStock.forEach((s) => { if (s.name && s.cableGroup) groupByName[s.name] = s.cableGroup; });
    const used = (b.cables || []).map((c) => c.type).filter(Boolean);
    const base = wiringStock.length ? wiringStock.map((s) => s.name) : (window.BOQ.CABLE_TYPES || []);
    return [...new Set(base.concat(used))]
      .map((n) => ({ value: n, label: n, group: groupByName[n] || cableCat(n) }))
      // เรียงตามหมวด แล้วตามชื่อ (ให้รายการหมวดเดียวกันอยู่ติดกัน → หัวข้อหมวดถูกต้อง)
      .sort((a, z) => (CABLE_CAT_ORDER.indexOf(a.group) - CABLE_CAT_ORDER.indexOf(z.group)) || String(a.value).localeCompare(String(z.value), "th", { numeric: true }));
  }, [stockItems, b.cables]);
  // ตัวเลือกพิกัดกระแส วสท.: วิธีเดินสาย / ฉนวน / กลุ่มการติดตั้ง / จำนวนตัวนำมีกระแส
  const methodOptions = (window.BOQ.WIRE_METHODS || []).map((m) => ({ value: m.key, label: m.th }));
  const insOptions = (window.BOQ.INS_CLASSES || []).map((c) => ({ value: c.key, label: c.th }));
  const groupOptions = (window.BOQ.AMP_GROUPS || []).map((g) => ({ value: g.key, label: g.th }));
  const ncondOptions = (window.BOQ.AMP_NCOND || []).map((n) => ({ value: n.key, label: n.th }));

  // ตัวเลือกวัสดุใน Accessories: แบ่งกลุ่มย่อย (ชิปฟิลเตอร์) เหมือน dropdown สายไฟ · เดาจากชื่อ
  const matSub = window.BOQ.materialSubGroup || (() => "อื่นๆ");
  const MAT_SUB_ORDER = window.BOQ.MATERIAL_SUBGROUPS || ["อื่นๆ"];
  const matItemOptions = (items, cat) => (items || [])
    .map((n) => ({ value: n, label: n, group: matSub(n, cat) }))
    // เรียงตามกลุ่มย่อย แล้วตามชื่อ (ให้รายการกลุ่มเดียวกันอยู่ติดกัน)
    .sort((a, z) => (MAT_SUB_ORDER.indexOf(a.group) - MAT_SUB_ORDER.indexOf(z.group)) || String(a.value).localeCompare(String(z.value), "th", { numeric: true }));

  const accList = b.accessories || [];
  const setAcc = (i, k, v) => setB((p) => { const a = (p.accessories || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); if (k === "name" && matInfo[v]) a[i].unit = matInfo[v].unit || a[i].unit; return Object.assign({}, p, { accessories: a }); });
  const setAccCat = (i, v) => setB((p) => { const a = (p.accessories || []).slice(); a[i] = Object.assign({}, a[i], { cat: v, name: "" }); return Object.assign({}, p, { accessories: a }); });
  const addAcc = () => setB((p) => Object.assign({}, p, { accessories: (p.accessories || []).concat([{ cat: "", name: "", qty: 1, unit: "" }]) }));
  const delAcc = (i) => setB((p) => Object.assign({}, p, { accessories: (p.accessories || []).filter((_, j) => j !== i) }));

  const ConduitList = ({ kind, label, sizes, valKey, unitText }) => (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(cond[kind] || []).map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 78px 36px", gap: 8, alignItems: "center" }}>
            <Dropdown value={x.size} onChange={(v) => setCond(kind, i, "size", v)} options={opt(sizes)} placeholder="เลือกขนาด" />
            <input type="number" style={numStyle} value={x[valKey]} placeholder={unitText} onChange={(e) => setCond(kind, i, valKey, e.target.value)} />
            <button onClick={() => delCond(kind, i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
          </div>
        ))}
        <button onClick={() => addCond(kind, { size: sizes[0], [valKey]: 0 })} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> เพิ่ม {label}</button>
      </div>
    </div>
  );

  // บล็อกกรอกงานโครงสร้าง (LADDER/WALKWAY/GUARD RAIL) — แต่ละ "จุด/แนว" = 1 แถว
  const StructBlock = ({ kind, label, color, addLabel, cols, blank, extra, spare, onSpare, extraItems, onExtraAdd, onExtraChange, onExtraDel }) => (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, background: "var(--surface2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{label}</span>
        {extra && <span style={{ marginLeft: "auto" }}>{extra}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {(st[kind] || []).map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: cols.map(() => "1fr").join(" ") + " 36px", gap: 8, alignItems: "center" }}>
            {cols.map((c) => (
              <input key={c.k} type="number" style={numStyle} value={x[c.k] != null ? x[c.k] : ""} placeholder={c.ph}
                onChange={(e) => setStruct(kind, i, c.k, e.target.value)} />
            ))}
            <button onClick={() => delStruct(kind, i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => addStruct(kind, Object.assign({}, blank))} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> {addLabel}</button>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)" }}>% เผื่อ</span>
            <input type="number" min={0} max={99} style={Object.assign({}, numStyle, { width: 58 })} value={spare != null ? spare : ""} placeholder="5" onChange={(e) => onSpare(e.target.value)} />
          </span>
        </div>
      </div>
      {(extraItems && extraItems.length > 0) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--text-3)" }}>วัสดุเพิ่ม (นอกระบบ)</span>
          {extraItems.map((x, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 64px 52px 36px", gap: 6, alignItems: "center" }}>
              <input value={x.name || ""} onChange={(e) => onExtraChange(i, "name", e.target.value)} placeholder="ชื่อวัสดุ" style={inputStyle} />
              <input type="number" value={x.qty || ""} onChange={(e) => onExtraChange(i, "qty", e.target.value)} placeholder="จำนวน" style={numStyle} />
              <input value={x.unit || ""} onChange={(e) => onExtraChange(i, "unit", e.target.value)} placeholder="หน่วย" style={inputStyle} />
              <button onClick={() => onExtraDel(i)} style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onExtraAdd} style={{ marginTop: extraItems && extraItems.length > 0 ? 6 : 10, display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--text-3)", fontWeight: 600, fontSize: 11, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
        <Icon name="plus" size={12} color="var(--text-3)" /> เพิ่มวัสดุนอกระบบ
      </button>
    </div>
  );

  const exportXlsx = () => {
    if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
    const X = window.XLSX;
    const hasPrice = priced.grandTotal > 0;

    // ── จานสี (ธีมเขียว PHITHAN GREEN) ──
    const C = {
      brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF",
      group: "D6EBDF", alt: "F4FAF6", white: "FFFFFF",
      border: "CBD8D0", text: "16241D", sub: "5A6B62",
    };
    const FONT = "Tahoma"; // รองรับภาษาไทยทุกเครื่อง Windows
    const thin = { style: "thin", color: { rgb: C.border } };
    const boxAll = { top: thin, bottom: thin, left: thin, right: thin };

    // ── หัวคอลัมน์ + ความกว้าง ตามว่ามีราคาหรือไม่ ──
    const cols = hasPrice
      ? ["ลำดับ", "รหัส", "รายการวัสดุ", "จำนวน", "หน่วย", "ราคา/หน่วย", "ราคารวม"]
      : ["ลำดับ", "รหัส", "รายการวัสดุ", "จำนวน", "หน่วย"];
    const lastC = cols.length - 1;
    const colW = hasPrice
      ? [{ wch: 7 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 8 }, { wch: 13 }, { wch: 15 }]
      : [{ wch: 7 }, { wch: 17 }, { wch: 54 }, { wch: 10 }, { wch: 10 }];

    const aoa = [];
    const merges = [];
    const meta = [];   // ประเภทของแต่ละแถว (ใช้กำหนดสไตล์)
    const rowsH = [];  // ความสูงแถว (hpt)
    let R = 0;
    const pushRow = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
    const fullMerge = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

    // หัวเอกสาร
    pushRow(["บัญชีแสดงปริมาณวัสดุ (Bill of Quantities)"], "title", 30); fullMerge(R - 1);
    pushRow(["PHITHAN GREEN · ระบบติดตามงานติดตั้งโซลาร์เซลล์"], "subtitle", 20); fullMerge(R - 1);
    pushRow([], "spacer", 6);

    // ข้อมูลงาน (ป้าย/ค่า — ค่าผสานช่องที่เหลือ)
    const info = [
      ["โครงการ", job ? (job.name || "") : ""],
      ["รหัสงาน", job ? (job.code || "") : ""],
      ["ขนาดระบบ", (result.meta.panelCount || 0) + " แผง   ·   " + (result.meta.kw || 0) + " kW"],
      ["วันที่ออกเอกสาร", window.SF.TODAY || ""],
    ];
    info.forEach((row) => {
      const cells = [row[0]]; for (let i = 1; i <= lastC; i++) cells.push(i === 1 ? row[1] : "");
      pushRow(cells, "info", 19); merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: lastC } });
    });
    pushRow([], "spacer", 8);

    // หัวตาราง
    pushRow(cols, "head", 22);

    // กลุ่ม + รายการ
    let n = 0;
    priced.groups.forEach((g) => {
      n += 1;
      const grow = ["ลำดับที่ " + n, ""]; for (let i = 2; i <= lastC; i++) grow.push(i === 2 ? g.group : "");
      pushRow(grow, "group", 20); merges.push({ s: { r: R - 1, c: 2 }, e: { r: R - 1, c: lastC } });
      g.items.forEach((it, k) => {
        const base = [n + "." + (k + 1), it.code || "", it.name || "", +it.qty || 0, it.unit || ""];
        if (hasPrice) base.push(it.price || 0, it.total || 0);
        pushRow(base, k % 2 === 0 ? "item" : "itemAlt");
      });
    });

    // รวม
    if (hasPrice) {
      pushRow([], "spacer", 6);
      const trow = []; for (let i = 0; i <= lastC; i++) trow.push("");
      trow[2] = "ต้นทุนรวมทั้งสิ้น"; trow[lastC] = priced.grandTotal;
      pushRow(trow, "total", 24);
      merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: lastC - 1 } });
    }

    // ── สร้างชีต + ลงสไตล์ ──
    const ws = X.utils.aoa_to_sheet(aoa);
    ws["!merges"] = merges;
    ws["!cols"] = colW;
    ws["!rows"] = rowsH;

    const moneyFmt = '#,##0.00';
    const qtyFmt = '#,##0.##';
    const styleCell = (r, c) => {
      const t = meta[r];
      if (t === "spacer") return null;
      const s = { font: { name: FONT, sz: 11, color: { rgb: C.text } }, alignment: { vertical: "center" } };
      if (t === "title") {
        s.font = { name: FONT, sz: 16, bold: true, color: { rgb: C.white } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brand } };
        s.alignment = { horizontal: "center", vertical: "center" };
      } else if (t === "subtitle") {
        s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } };
        s.alignment = { horizontal: "center", vertical: "center" };
      } else if (t === "info") {
        if (c === 0) { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.sub } }; s.alignment = { horizontal: "right", vertical: "center" }; }
        else { s.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; s.alignment = { horizontal: "left", vertical: "center" }; }
        s.border = { bottom: thin };
      } else if (t === "head") {
        s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brand } };
        s.alignment = { horizontal: c === 2 ? "left" : "center", vertical: "center" };
        s.border = boxAll;
      } else if (t === "group") {
        s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.brandDk } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.group } };
        s.alignment = { horizontal: c < 2 ? "center" : "left", vertical: "center" };
        s.border = boxAll;
      } else if (t === "item" || t === "itemAlt") {
        if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
        s.border = boxAll;
        if (c === 0) s.alignment = { horizontal: "center", vertical: "center" };
        else if (c === 1) { s.alignment = { horizontal: "center", vertical: "center" }; s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
        else if (c === 2) s.alignment = { horizontal: "left", vertical: "center", wrapText: true };
        else if (c === 3) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = qtyFmt; }
        else if (c === 4) s.alignment = { horizontal: "center", vertical: "center" };
        else if (c === 5 || c === 6) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = moneyFmt; }
      } else if (t === "total") {
        s.font = { name: FONT, sz: 12, bold: true, color: { rgb: C.white } };
        s.fill = { patternType: "solid", fgColor: { rgb: C.brandDk } };
        s.alignment = { horizontal: c === lastC ? "right" : "right", vertical: "center" };
        if (c === lastC) s.numFmt = moneyFmt;
        s.border = boxAll;
      }
      return s;
    };

    const range = X.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = X.utils.encode_cell({ r: r, c: c });
        const s = styleCell(r, c);
        if (!s) continue;
        if (!ws[ref]) ws[ref] = { t: "s", v: "" };  // สร้างช่องว่างให้พื้น/เส้นขอบขึ้น
        ws[ref].s = s;
      }
    }

    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, "BOQ");
    const fn = "BOQ_" + (job ? job.code : "job") + ".xlsx";
    X.writeFile(wb, fn);
  };

  const numStyle = Object.assign({}, inputStyle, { textAlign: "right" });

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(720px,100%)", maxHeight: isMobile ? "96dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>ถอดวัสดุ BOQ {job && <span style={{ fontFamily: "var(--mono)", color: "var(--primary-dark)" }}>· {job.code}</span>}</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job ? job.name : "งาน"}</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        {/* body */}
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* ── ข้อมูลระบบ ── */}
          <Section title="ข้อมูลระบบ" icon="sun">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))", gap: 12 }}>
              <Field label="จำนวนแผง"><BoqLocked value={b.panels} unit="แผง" num /></Field>
              <Field label="ขนาดติดตั้ง (kW)">
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.kw.toLocaleString()}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>kW</span>
                </div>
              </Field>
              <Field label="ระบบไฟฟ้า (ตามงาน)">
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                  <Icon name="lock" size={13} color="var(--text-3)" />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{String(b.phase) === "3" ? "3 เฟส" : "1 เฟส"}</span>
                </div>
              </Field>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label={"อินเวอร์เตอร์" + (jobBrand ? " · " + jobBrand : "")}><Dropdown value={b.inverterModel || ""} onChange={(v) => set("inverterModel", v)} options={invOptions} /></Field></div>
              {!b.inverterModel
                ? <Field label="อัตราไมโคร"><Dropdown value={b.microRatio} onChange={(v) => set("microRatio", v)} options={[{ value: "1:1", label: "1:1 (1 แผง/ตัว)" }, { value: "2:1", label: "2:1 (2 แผง/ตัว)" }]} /></Field>
                : <Field label="จำนวนอินเวอร์เตอร์"><div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}><span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.invCount}</span><span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ตัว</span></div></Field>}
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="รุ่นแผง"><Dropdown value={b.panelModel} onChange={(v) => set("panelModel", v)} options={opt(window.BOQ.PANELS.map((p) => p.model))} /></Field></div>
              {hasBattery && <Field label="แบตเตอรี่ (kWh)"><BoqLocked value={b.batteryKwh} unit="kWh" num /></Field>}
              {hasBackup && <Field label="ระบบ Backup"><BoqLocked value={b.backup ? "ติดตั้ง" : "ไม่ติดตั้ง"} /></Field>}
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="ประเภทหลังคา"><Dropdown value={b.roof} onChange={(v) => set("roof", v)} options={opt(window.BOQ.ROOF_OPTIONS)} /></Field></div>
            </div>
          </Section>

          {/* ── ระบบอินเวอร์เตอร์ Hybrid/On-grid (Huawei) ── */}
          {isHuawei && (
            <Section title={"ระบบ " + (selInv.type === "hybrid" ? "Hybrid" : "On-grid") + " (" + selInv.model + ")"} icon="bolt">
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(3, minmax(0,1fr))", gap: 12 }}>
                <Field label="จำนวนอินเวอร์เตอร์">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.invCount}</span><span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ตัว</span>
                  </div>
                </Field>
                <Field label={"String ต่อตัว (สูงสุด " + selInv.inputs + ")"}>
                  <input type="number" style={numStyle} value={b.strings || selInv.inputs} min={1} max={selInv.inputs}
                    onChange={(e) => set("strings", Math.min(Math.max(parseInt(e.target.value) || 1, 1), selInv.inputs))} />
                </Field>
                <Field label="ระบบสำรองไฟ">
                  <Dropdown value={b.hwBackup || "none"} onChange={(v) => set("hwBackup", v)} options={[
                    { value: "none", label: "ไม่ติดตั้ง" },
                    { value: "smartguard", label: "SmartGuard" },
                    { value: "backupbox", label: "Backup Box" },
                  ]} />
                </Field>
                <Field label="Optimizer (1:1 ต่อแผง)"><Dropdown value={!!b.hwOptimizer} onChange={(v) => set("hwOptimizer", v)} options={[{ value: false, label: "ไม่ใช้" }, { value: true, label: "ใช้" }]} /></Field>
                <Field label="ตู้ไฟเพิ่ม (case by case)"><Dropdown value={!!b.hwExtraPanel} onChange={(v) => set("hwExtraPanel", v)} options={[{ value: false, label: "ไม่มี" }, { value: true, label: "มี" }]} /></Field>
              </div>
              {pvOver && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B91C1C" }}>
                  <Icon name="alert" size={15} color="#EF4444" /> กำลังแผง {result.meta.kw} kW เกิน MAX PV รวม {maxPvTotal} kW ({selInv.invCount || result.meta.invCount} ตัว × {selInv.maxPv} kW) — เพิ่มจำนวนอินเวอร์เตอร์หรือลดแผง
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                * Combiner Box + DC (Fuse/Holder/MCB/MC4) คิดตามจำนวน String · RCBO/SPD/Smart Meter/Backup เลือกตามเฟส ({selInv.phase === 3 ? "3" : "1"} เฟส) · RCBO ขนาดจากกระแสออก × 1.25
              </div>
            </Section>
          )}

          {/* ── สาย DC / การต่ออนุกรม String (PV1-F) — เฉพาะอินเวอร์เตอร์ String/Hybrid ── */}
          {isStringInv && scfg && (
            <Section title="สาย DC / การต่ออนุกรม String (PV1-F)" icon="bolt">
              {!scfg.ready ? (
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 13px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: "#92400E" }}>
                  <Icon name="alert" size={15} color="#F59E0B" /> {scfg.warns.join(" · ")}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>แผง · {b.panelModel}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>Voc {scfg.voc} V · Isc {scfg.isc} A{scfg.vmp ? " · Vmp " + scfg.vmp + " V" : ""}</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 3 }}>ช่วงทำงาน MPPT · {selInv.model}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{scfg.vmin}–{scfg.vmax} Vdc{scfg.maxVdc ? " · สูงสุด " + scfg.maxVdc + " V" : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 12, alignItems: "center" }}>
                    <Field label={"แผงต่ออนุกรม/สตริง" + (scfg.maxSeries >= scfg.minSeries ? " (แนะนำ " + scfg.minSeries + "–" + scfg.maxSeries + ")" : "")}>
                      <input type="number" style={Object.assign({}, numStyle, { width: 130 })} min={1}
                        value={(b.dcSeries != null && b.dcSeries !== "") ? b.dcSeries : scfg.recSeries}
                        onChange={(e) => set("dcSeries", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))} />
                    </Field>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                      ช่วงแนะนำ = แรงดันทำงานรวมอยู่ในช่วง MPPT และ Voc รวมไม่เกินแรงดันระบบสูงสุด
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
                    {[
                      { l: "แรงดันทำงานรวม", v: scfg.stringVop + " V", ok: scfg.inRange },
                      { l: "Voc รวม (เปิดวงจร)", v: scfg.stringVoc + " V", ok: !scfg.overMaxVdc },
                      { l: "กระแส DC (Isc×1.25)", v: scfg.dcAmp + " A", ok: null },
                      { l: "ขนาดสาย DC PV1-F", v: scfg.dcWire, ok: null, hi: true },
                    ].map((c, i) => (
                      <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface3)", border: "1px solid " + (c.ok === false ? "#FBD3D3" : "var(--border)") }}>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)", marginBottom: 3 }}>{c.l}</div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: c.hi ? "var(--primary-dark)" : (c.ok === false ? "#DC2626" : "var(--text-1)") }}>{c.v}{c.ok === true ? " ✓" : c.ok === false ? " ✗" : ""}</div>
                      </div>
                    ))}
                  </div>
                  {scfg.warns.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {scfg.warns.map((w, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#B91C1C" }}>
                          <Icon name="alert" size={14} color="#EF4444" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                    * แรงดันทำงานคิดจาก {scfg.vmp ? "Vmp" : "Voc"} × จำนวนแผงต่ออนุกรม · สาย DC เลือกจาก Isc × 1.25 (PV1-F ทองแดง) · สายคู่ แดง(+)/ดำ(−) ต่อสตริง
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* ── การจัดวางแผง ── */}
          <Section title="การจัดวางแผง (แถว)" icon="grid"
            right={<span style={{ fontSize: 11.5, fontWeight: 700, color: remaining === 0 ? "var(--primary-dark)" : "#EF4444" }}>
              วางแล้ว {result.meta.rowsSum} / {result.meta.panelCount} แผง
            </span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.rows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "center" }}>
                  <Field label={i === 0 ? "แผง/แถว" : ""}><input type="number" style={numStyle} value={r.panels} onChange={(e) => setRow(i, "panels", e.target.value)} /></Field>
                  <Field label={i === 0 ? "จำนวนแถว" : ""}><input type="number" min="0" style={numStyle} value={r.count} onChange={(e) => setRow(i, "count", e.target.value)} /></Field>
                  <button onClick={() => delRow(i)} title="ลบแถว" style={{ height: 40, marginTop: i === 0 ? 18 : 0, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>
                </div>
              ))}
              <button onClick={addRow} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มแถว</button>
            </div>

            {/* สถานะวางแผงให้ครบ — กันพลาด */}
            {remaining === 0 ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "var(--primary-soft)", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "var(--primary-dark)" }}>
                <Icon name="check" size={15} color="var(--primary-dark)" sw={2.6} /> วางแผงครบตามจำนวนแล้ว ({result.meta.panelCount} แผง)
              </div>
            ) : remaining > 0 ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B91C1C" }}>
                <Icon name="alert" size={15} color="#EF4444" /> ยังขาดอีก {remaining} แผง
                <button onClick={() => fillRemaining(remaining)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, padding: "6px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="plus" size={13} color="#fff" /> เพิ่มแถว {remaining} แผง
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "#FEF9EC", border: "1px solid #FCE4B6", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                <Icon name="alert" size={15} color="#F59E0B" /> วางเกินจำนวนแผง {-remaining} แผง — ตรวจสอบจำนวนแผง/แถว
              </div>
            )}

            <button onClick={() => setAdv((v) => !v)} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าขั้นสูง (ราง / ระยะเผื่อ) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: adv ? "rotate(180deg)" : "none" }} />
            </button>
            {adv && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "minmax(0,1fr) minmax(0,1fr)" : "repeat(4, minmax(0,1fr))", gap: 10 }}>
                <Field label="ขนาดราง"><Dropdown value={b.railSize} onChange={(v) => set("railSize", v)} options={[{ value: 4.2, label: "4.2 ม." }, { value: 4.8, label: "4.8 ม." }]} /></Field>
                <Field label="เผื่อระหว่างแผง (ม.)"><input type="number" style={numStyle} value={b.gap} onChange={(e) => set("gap", e.target.value)} /></Field>
                <Field label="เผื่อหัวท้าย (ม.)"><input type="number" style={numStyle} value={b.endSpare} onChange={(e) => set("endSpare", e.target.value)} /></Field>
                <Field label="L-FEET/ราง"><input type="number" style={numStyle} value={b.lfeetPerRail} onChange={(e) => set("lfeetPerRail", e.target.value)} /></Field>
                <Field label="% เผื่อ RAIL"><input type="number" style={numStyle} value={b.sparePct.rail} onChange={(e) => setSpare("rail", e.target.value)} /></Field>
                <Field label="% เผื่อ JOINER"><input type="number" style={numStyle} value={b.sparePct.joiner} onChange={(e) => setSpare("joiner", e.target.value)} /></Field>
                <Field label="% เผื่อ MID"><input type="number" style={numStyle} value={b.sparePct.midClamp} onChange={(e) => setSpare("midClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ END"><input type="number" style={numStyle} value={b.sparePct.endClamp} onChange={(e) => setSpare("endClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ L-FEET"><input type="number" style={numStyle} value={b.sparePct.lfeet} onChange={(e) => setSpare("lfeet", e.target.value)} /></Field>
                <Field label="% เผื่อ GROUND LUG"><input type="number" style={numStyle} value={b.sparePct.ground} onChange={(e) => setSpare("ground", e.target.value)} /></Field>
              </div>
            )}
          </Section>

          {/* ── สายไฟ ── */}
          <Section title="สายไฟ" icon="power">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.cables.map((c, i) => {
                const isComm = /LAN|CAT/i.test(c.type || "");
                const isDC = /PV1-F|PV CABLE/i.test(c.type || "") || /PV-INVERTER/i.test(c.name || "");  // สาย DC คิดขนาดในส่วนสาย DC แยก
                const method = c.method || "conduitAir";
                const group = c.group || "g1";
                const ncond = c.ncond || (wcPhase === 3 ? "3" : "2");
                const coreType = window.BOQ.cableCoreType(c.type);   // single / multi (จากชื่อ 1C/nC)
                const coreTh = coreType === "multi" ? "หลายแกน" : "แกนเดียว";
                const hasSize = window.BOQ.cableSizeNum(c.type) != null;
                const amp = cableAmp(c.type, { method, group, ncond });
                const req = reqAmpFor(c.name);
                const bad = amp != null && req && amp < req;
                const showHint = !!c.type && !isComm && !isDC;
                return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {isMobile && <Dropdown value={c.name || ""} onChange={(v) => setCab(i, "name", v)} options={cablePtOptions} placeholder="— เลือกจุด —" addable onAdd={addCablePt} />}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 70px 36px" : "minmax(150px,1fr) minmax(0,1.3fr) 90px 36px", gap: 8, alignItems: "center" }}>
                    {!isMobile && <Dropdown value={c.name || ""} onChange={(v) => setCab(i, "name", v)} options={cablePtOptions} placeholder="— เลือกจุด —" addable onAdd={addCablePt} />}
                    <Dropdown value={c.type} onChange={(v) => setCab(i, "type", v)} options={cableTypeOptions} placeholder="— เลือกสายไฟ —" />
                    <input type="number" style={numStyle} value={c.length} placeholder="ม." onChange={(e) => setCab(i, "length", e.target.value)} />
                    <button onClick={() => delCab(i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                  </div>
                  {showHint && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: isMobile ? 2 : 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <div style={{ width: isMobile ? "100%" : 184, flexShrink: 0 }}>
                          <Dropdown value={method} onChange={(v) => setCab(i, "method", v)} options={methodOptions} placeholder="วิธีเดินสาย" />
                        </div>
                        <div style={{ width: isMobile ? "calc(50% - 4px)" : 104, flexShrink: 0 }}>
                          <Dropdown value={group} onChange={(v) => setCab(i, "group", v)} options={groupOptions} />
                        </div>
                        <div style={{ width: isMobile ? "calc(50% - 4px)" : 150, flexShrink: 0 }}>
                          <Dropdown value={ncond} onChange={(v) => setCab(i, "ncond", v)} options={ncondOptions} />
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", background: "var(--surface3)", padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>{coreTh}</span>
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                        color: bad ? "#B91C1C" : (amp == null ? "#B91C1C" : "var(--text-3)") }}>
                      {amp != null ? (
                        <React.Fragment>
                          <Icon name={bad ? "alert" : "bolt"} size={11} color={bad ? "#B91C1C" : "var(--text-3)"} />
                          พิกัดสาย ~{amp} A · {coreTh}{req ? " · ต้องการ ≥ " + (Math.round(req * 10) / 10).toFixed(1) + " A" : ""}{bad ? " · กระแสไม่พอ!" : ""}
                        </React.Fragment>
                      ) : !hasSize ? (
                        <React.Fragment>
                          <Icon name="alert" size={11} color="#B91C1C" /> ระบุพิกัดไม่ได้ — เลือกชนิดสายที่มีขนาด (SQ.MM.)
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          <Icon name="alert" size={11} color="#B91C1C" /> ยังไม่มีตารางพิกัดสำหรับเงื่อนไขนี้ — เพิ่มค่าได้ที่หน้าคลัง › พิกัดสาย วสท.
                        </React.Fragment>
                      )}
                      </span>
                    </div>
                  )}
                  {isDC && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, paddingLeft: isMobile ? 2 : 4, fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>
                      <Icon name="bolt" size={11} color="var(--text-3)" /> สาย DC{scfg && scfg.ready ? " · แนะนำ " + scfg.dcWire + " (Isc×1.25 = " + scfg.dcAmp + " A)" : ""} — ดูรายละเอียดในส่วน “สาย DC / การต่ออนุกรม String”
                    </span>
                  )}
                </div>
                );
              })}
              <button onClick={addCab} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มสาย</button>
            </div>

            {/* ── ตารางคำนวณขนาดสายไฟ (จากกระแส Micro-inverter) ── */}
            <div style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface2)" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="bolt" size={13} color="var(--primary)" /> ตารางคำนวณขนาดสายไฟ
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "3px 9px", borderRadius: 99 }}>{wcPhase} เฟส</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 10 }}>
                  {[
                    { label: "แรงดัน (V)", value: wcVolt, key: "volt", min: undefined },
                    isStringInv ? null : { label: "แบ่ง String", value: wcStrings, key: "strings", min: "1" },
                    hasBattery ? { label: "กำลังแบต (kW)", value: wcalc.battKw, key: "battKw", min: undefined } : null,
                    hasBackup ? { label: "เมน Backup (A)", value: wcalc.backupMainA || "", key: "backupMainA", min: undefined, ph: "—" } : null,
                  ].filter(Boolean).map((f) => (
                    <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{f.label}</span>
                      <input type="number" min={f.min} placeholder={f.ph} value={f.value} onChange={(e) => setWcalc(f.key, e.target.value)}
                        style={Object.assign({}, numStyle, { width: "100%", height: 36 })} />
                    </label>
                  ))}
                </div>
                {/* สมมุติฐานของ "สายแนะนำ": ฉนวน + วิธีเดินสาย + กลุ่ม + จำนวนตัวนำ (แกนเดียว) ตามพิกัด วสท. */}
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>ชนิดฉนวน</span>
                    <Dropdown value={calcIns} onChange={(v) => setWcalc("ins", v)} options={insOptions} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>วิธีเดินสาย</span>
                    <Dropdown value={calcMethod} onChange={(v) => setWcalc("method", v)} options={methodOptions} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>กลุ่มการติดตั้ง</span>
                    <Dropdown value={calcGroup} onChange={(v) => setWcalc("group", v)} options={groupOptions} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>จำนวนตัวนำมีกระแส</span>
                    <Dropdown value={calcNCond} onChange={(v) => setWcalc("ncond", v)} options={ncondOptions} />
                  </label>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>* "สายแนะนำ" คิดบนพื้นฐานสายแกนเดียว (1C) — สายในรายการด้านบนอ่านแกนจากชื่อจริง</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 540 }}>
                  <thead>
                    <tr style={{ color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      <th style={{ textAlign: "left", padding: "8px 14px", fontWeight: 700 }}>ชุดคำนวณ</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700 }}>กำลัง (W)</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700 }}>กระแสรวม (A)</th>
                      <th style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700 }}>{isStringInv ? "กระแส (A)" : "กระแส/สตริง (A)"}</th>
                      <th style={{ textAlign: "right", padding: "8px 14px", fontWeight: 700 }}>{isStringInv ? "สายแนะนำ" : "สายแนะนำ/สตริง"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcRows.map((r, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "9px 14px", color: "var(--text-1)" }}>
                          <span style={{ fontWeight: 600 }}>{r.label}</span>
                          <span style={{ display: "block", fontSize: 10.5, color: r.needInput ? "#B45309" : "var(--text-3)" }}>{r.note}</span>
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-2)" }}>{r.w == null ? "—" : Math.round(r.w).toLocaleString()}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{r.needInput ? "—" : (Math.round(r.ampTotal * 10) / 10).toFixed(1)}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "var(--mono)" }}>
                          {r.needInput ? <span style={{ color: "var(--text-3)" }}>—</span> : (
                            <React.Fragment>
                              <span style={{ fontWeight: 700, color: r.splittable && wcStrings > 1 ? "var(--primary-dark)" : "var(--text-1)" }}>{(Math.round(r.ampString * 10) / 10).toFixed(1)}</span>
                              <span style={{ display: "block", fontSize: 9.5, color: "var(--text-3)" }}>×1.25 = {(Math.round(r.ampString * 1.25 * 10) / 10).toFixed(1)}</span>
                            </React.Fragment>
                          )}
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right" }}>
                          <span style={{ display: "inline-block", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: r.needInput ? "var(--text-3)" : "var(--primary-dark)", background: r.needInput ? "var(--surface3)" : "var(--primary-soft)", padding: "3px 9px", borderRadius: 7 }}>{r.wire}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "9px 14px", fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5, borderTop: "1px solid var(--border)" }}>
                {isStringInv
                  ? "* PV-INVERTER = สาย DC จากแผง→อินเวอร์เตอร์ (Isc × 1.25, สาย PV1-F ขั้นต่ำ 6 mm²) · INVERTER→MCB_SOLAR = กระแสออกอินเวอร์เตอร์/ตัว · MCB_SOLAR→MDB = กระแสออกรวมทุกตัว → ตู้เมน · ขนาดสาย AC เลือกให้รับกระแส ×1.25 ตามพิกัด วสท. · กระแสออกตั้งค่าได้ที่หน้าคลัง › สเปคอินเวอร์เตอร์"
                  : "* MICRO-MICRO = ไมโคร 1 ตัว (" + microW + "W) ÷ 230V (อุปกรณ์ 1 เฟส) · MICRO-COMBINER (กระแส/สตริง) = กระแสรวม ÷ จำนวน String · COMBINER→MCB ใช้กระแสรวมทุกสตริง · กระแสรวม: 1 เฟส = W ÷ V · 3 เฟส = W ÷ (√3 × แรงดันไลน์ V) · ขนาดสายแนะนำเลือกให้รับกระแส ×1.25 (โหลดต่อเนื่อง) อ้างพิกัดสายทองแดง IEC01/THW โดยประมาณ — โปรดตรวจสอบกับวิธีเดินสายจริง"}
              </div>
            </div>

            {/* ── ตรวจสอบ WIRE WAY / CONDUIT (ย้ายมารวมกับการคำนวณสายไฟ) ── */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Icon name="grid" size={13} color="var(--primary)" /> ตรวจสอบ WIRE WAY / CONDUIT
              </div>
              {/* WIRE WAY */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                <button onClick={() => setAdvWW((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", background: "var(--surface2)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-1)" }}>WIRE WAY (รางเดินสาย)</span>
                  <Icon name={advWW ? "chevronDown" : "plus"} size={13} color="var(--text-2)" style={{ transform: advWW ? "rotate(180deg)" : "none" }} />
                </button>
                {advWW && (
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", whiteSpace: "nowrap" }}>ขนาดราง W × H (mm)</span>
                      <input type="number" value={wc.wayW} onChange={(e) => setWC("wayW", e.target.value)} style={Object.assign({}, numStyle, { width: 70 })} placeholder="W" />
                      <span style={{ color: "var(--text-3)" }}>×</span>
                      <input type="number" value={wc.wayH} onChange={(e) => setWC("wayH", e.target.value)} style={Object.assign({}, numStyle, { width: 70 })} placeholder="H" />
                      {wc.wayW > 0 && wc.wayH > 0 && <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>= {(+wc.wayW * +wc.wayH).toLocaleString()} mm²</span>}
                    </div>
                    {wc.cables.map((c, i) => {
                      const szOpts = Object.keys((window.BOQ.CABLE_OD || {})[c.type] || {}).map(Number).sort((a, b) => a - b).map((n) => ({ value: n, label: n + " sq.mm." }));
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 60px 30px", gap: 6, alignItems: "center" }}>
                          <Dropdown value={c.type || ""} onChange={(v) => setWCCable(i, "type", v)} options={CHECK_TYPES.map((t) => ({ value: t, label: t }))} />
                          <Dropdown value={+c.size || 0} onChange={(v) => setWCCable(i, "size", +v)} options={szOpts} />
                          <input type="number" value={c.qty} onChange={(e) => setWCCable(i, "qty", e.target.value)} style={Object.assign({}, numStyle, { width: "100%" })} placeholder="เส้น" />
                          <button onClick={() => delWCCable(i)} style={{ height: 36, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                        </div>
                      );
                    })}
                    <button onClick={addWCCable} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--primary-dark)" /> เพิ่มสาย</button>
                    {wc.cables.length > 0 && (
                      <div style={{ background: "var(--surface2)", borderRadius: 9, padding: "10px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "var(--text-2)" }}>พื้นที่สายรวม</span>
                          <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{wcResult.totalArea.toFixed(1)} mm²</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: "var(--text-2)" }}>พื้นที่ราง ({wc.wayW}×{wc.wayH} mm)</span>
                          <span style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{(+wcResult.wayArea).toLocaleString()} mm²</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, alignItems: "center", paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                          <span style={{ fontWeight: 700, color: "var(--text-2)" }}>อัตราเต็ม (≤ 20%)</span>
                          <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: wcResult.ok ? "#16A34A" : "#DC2626" }}>{wcResult.fillPct.toFixed(1)}% {wcResult.ok ? "✓ ผ่าน" : "✗ เกิน"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* CONDUIT */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setAdvCD((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", background: "var(--surface2)", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-1)" }}>CONDUIT (ท่อร้อยสาย)</span>
                  <Icon name={advCD ? "chevronDown" : "plus"} size={13} color="var(--text-2)" style={{ transform: advCD ? "rotate(180deg)" : "none" }} />
                </button>
                {advCD && (
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                    {cc.cables.map((c, i) => {
                      const szOpts = Object.keys((window.BOQ.CABLE_OD || {})[c.type] || {}).map(Number).sort((a, b) => a - b).map((n) => ({ value: n, label: n + " sq.mm." }));
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 60px 30px", gap: 6, alignItems: "center" }}>
                          <Dropdown value={c.type || ""} onChange={(v) => setCCCable(i, "type", v)} options={CHECK_TYPES.map((t) => ({ value: t, label: t }))} />
                          <Dropdown value={+c.size || 0} onChange={(v) => setCCCable(i, "size", +v)} options={szOpts} />
                          <input type="number" value={c.qty} onChange={(e) => setCCCable(i, "qty", e.target.value)} style={Object.assign({}, numStyle, { width: "100%" })} placeholder="เส้น" />
                          <button onClick={() => delCCCable(i)} style={{ height: 36, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                        </div>
                      );
                    })}
                    <button onClick={addCCCable} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--primary-dark)" /> เพิ่มสาย</button>
                    {cc.cables.length > 0 && (
                      <div style={{ background: "var(--surface2)", borderRadius: 9, padding: "10px 13px", display: "flex", flexDirection: "column", gap: 7 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 2 }}>ขนาดท่อขั้นต่ำที่แนะนำ (fill ≤ 40%)</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: "center" }}>
                          <span style={{ color: "var(--text-2)" }}>HDPE</span>
                          {ccResult.hdpe
                            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                                <span style={{ background: "#0EA5E918", color: "#0369A1", fontFamily: "var(--mono)", fontWeight: 800, fontSize: 13, borderRadius: 7, padding: "2px 9px" }}>{ccResult.hdpe.label}</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>{ccResult.hdpe.fillPct.toFixed(1)}%</span>
                              </span>
                            : <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#DC2626" }}>เกินขนาดในตาราง</span>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: "center" }}>
                          <span style={{ color: "var(--text-2)" }}>IMC</span>
                          {ccResult.imc
                            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                                <span style={{ background: "#7C3AED18", color: "#6D28D9", fontFamily: "var(--mono)", fontWeight: 800, fontSize: 13, borderRadius: 7, padding: "2px 9px" }}>{ccResult.imc.label}</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>{ccResult.imc.fillPct.toFixed(1)}%</span>
                              </span>
                            : <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#DC2626" }}>เกินขนาดในตาราง</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* WIRE WAY: fill ≤ 20% ของพื้นที่ราง — CONDUIT: fill ≤ 40% ของพื้นที่ท่อ</div>
            </div>
          </Section>

          {/* ── ท่อร้อยสาย (RACE WAY) ── */}
          <Section title="ท่อร้อยสาย (RACE WAY)" icon="grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ConduitList kind="imc" label="ท่อ IMC (3m/ท่อน)" sizes={window.BOQ.IMC_SIZES} valKey="length" unitText="ม." />
              <ConduitList kind="upvc" label="ท่อ uPVC" sizes={window.BOQ.UPVC_SIZES} valKey="length" unitText="ม." />
              <ConduitList kind="pullbox" label="PULL BOX" sizes={window.BOQ.PULLBOX_SIZES} valKey="qty" unitText="ชิ้น" />
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
              * อุปกรณ์ IMC (แคล้มประกับ / บุชชิ่ง,ล็อกนัท / รางซี / คอนเนคเตอร์ / คุปปิ้ง) คำนวณอัตโนมัติจากความยาวท่อ + จำนวน PULL BOX
            </div>
            {/* ตั้งค่า IMC */}
            <button onClick={() => setAdvC((v) => !v)} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าอุปกรณ์ IMC (% เผื่อ / ท่ออ่อน) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: advC ? "rotate(180deg)" : "none" }} />
            </button>
            {advC && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <Field label="% เผื่อ แคล้มประกับ"><input type="number" style={numStyle} value={csp.clamp} onChange={(e) => setCSpare("clamp", e.target.value)} /></Field>
                <Field label="% เผื่อ บุชชิ่ง/ล็อกนัท"><input type="number" style={numStyle} value={csp.bushing} onChange={(e) => setCSpare("bushing", e.target.value)} /></Field>
                <Field label="% เผื่อ รางซี"><input type="number" style={numStyle} value={csp.cchannel} onChange={(e) => setCSpare("cchannel", e.target.value)} /></Field>
                <Field label="% เผื่อ คอนเนคเตอร์"><input type="number" style={numStyle} value={csp.connector} onChange={(e) => setCSpare("connector", e.target.value)} /></Field>
                <Field label="% เผื่อ คุปปิ้ง"><input type="number" style={numStyle} value={csp.coupling} onChange={(e) => setCSpare("coupling", e.target.value)} /></Field>
                {[...new Set((cond.imc || []).map((x) => (x.size || "").trim()).filter(Boolean))].map((sz) => (
                  <Field key={sz} label={"ท่ออ่อน IMC " + sz.replace(/^IMC\s*/i, "") + " (กล่อง)"}><input type="number" style={numStyle} value={(cond.flex || {})[sz] != null ? cond.flex[sz] : 1} onChange={(e) => setFlexSize(sz, e.target.value)} /></Field>
                ))}
              </div>
            )}

            {/* ตั้งค่า uPVC */}
            <button onClick={() => setAdvU((v) => !v)} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าอุปกรณ์ uPVC (% เผื่อ / ท่ออ่อน) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: advU ? "rotate(180deg)" : "none" }} />
            </button>
            {advU && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <Field label="% เผื่อ ข้อต่อตรง"><input type="number" style={numStyle} value={csp.upStraight} onChange={(e) => setCSpare("upStraight", e.target.value)} /></Field>
                <Field label="% เผื่อ แคลมป์ก้ามปู"><input type="number" style={numStyle} value={csp.upClamp} onChange={(e) => setCSpare("upClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ คอนเน็ตเตอร์ uPVC"><input type="number" style={numStyle} value={csp.upConnector} onChange={(e) => setCSpare("upConnector", e.target.value)} /></Field>
                {[...new Set((cond.upvc || []).map((x) => (x.size || "").trim()).filter(Boolean))].map((sz) => (
                  <Field key={sz} label={"ท่ออ่อนขาว " + ((sz.match(/(\d+)\s*mm/) || [])[1] || "") + "mm (กล่อง)"}><input type="number" style={numStyle} value={(cond.upFlex || {})[sz] != null ? cond.upFlex[sz] : 1} onChange={(e) => setUpFlexSize(sz, e.target.value)} /></Field>
                ))}
              </div>
            )}
          </Section>

          {/* ── งานเพิ่มเติม (Input): โครงสร้างบนหลังคา — เฉพาะงานโครงการ ไม่แสดงงานบ้าน ── */}
          {!isHome && (
          <Section title="งานเพิ่มเติม (Input) — โครงสร้าง" icon="box"
            right={<button onClick={() => setAdvS((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "6px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name={advS ? "chevronDown" : "plus"} size={13} color="var(--text-2)" style={{ transform: advS ? "rotate(180deg)" : "none" }} /> {advS ? "ซ่อน" : "กรอกข้อมูล"}</button>}>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
              เลือกกรอกเฉพาะงานที่มีในโครงการ — ระบบจะถอดวัสดุเพิ่มลงรายการ BOQ ให้อัตโนมัติ (งานที่ไม่กรอก จะไม่ถูกถอด)
            </div>
            {advS && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                <StructBlock kind="ladder" label="LADDER (บันไดลิง)" color="#0D9488" addLabel="เพิ่มจุด"
                  cols={[{ k: "h", ph: "ความสูง (m)" }]} blank={{ h: "" }}
                  spare={st.ladderSpare != null ? st.ladderSpare : 5} onSpare={(v) => setStructVal("ladderSpare", +v)}
                  extraItems={st.ladderExtra || []}
                  onExtraAdd={() => addStructExtra("ladder")}
                  onExtraChange={(i, k, v) => setStructExtra("ladder", i, k, v)}
                  onExtraDel={(i) => delStructExtra("ladder", i)} />
                <StructBlock kind="walkway" label="WALKWAY" color="#D97706" addLabel="เพิ่มแนว"
                  cols={[{ k: "len", ph: "ความยาวแนว (m)" }]} blank={{ len: "" }}
                  extra={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>END CLAMP</span>
                    <span style={{ width: 96 }}><Dropdown value={st.walkwayThk || 35} onChange={(v) => setStructVal("walkwayThk", +v)} options={[{ value: 30, label: "30mm." }, { value: 35, label: "35mm." }]} /></span>
                  </span>}
                  spare={st.walkwaySpare != null ? st.walkwaySpare : 10} onSpare={(v) => setStructVal("walkwaySpare", +v)}
                  extraItems={st.walkwayExtra || []}
                  onExtraAdd={() => addStructExtra("walkway")}
                  onExtraChange={(i, k, v) => setStructExtra("walkway", i, k, v)}
                  onExtraDel={(i) => delStructExtra("walkway", i)} />
                <StructBlock kind="guardrail" label="GUARD RAIL" color="#DB2777" addLabel="เพิ่มจุด"
                  cols={[{ k: "len", ph: "ความยาว layout (m)" }, { k: "corners", ph: "จำนวนมุม" }]} blank={{ len: "", corners: "" }}
                  spare={st.guardrailSpare != null ? st.guardrailSpare : 5} onSpare={(v) => setStructVal("guardrailSpare", +v)}
                  extraItems={st.guardrailExtra || []}
                  onExtraAdd={() => addStructExtra("guardrail")}
                  onExtraChange={(i, k, v) => setStructExtra("guardrail", i, k, v)}
                  onExtraDel={(i) => delStructExtra("guardrail", i)} />
              </div>
            )}
          </Section>
          )}

          {/* ── Accessories ── */}
          <Section title="Accessories (เพิ่มของ)" icon="box">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accList.map((a, i) => {
                const items = a.cat === "พิมพ์เอง" ? [] : (accCat.map[a.cat] || []);
                return (
                  <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 11, padding: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 36px", gap: 8, alignItems: "center" }}>
                      <Dropdown value={a.cat || ""} onChange={(v) => setAccCat(i, v)}
                        options={[{ value: "", label: "— เลือกหมวด —" }].concat(accCat.cats.map((c) => ({ value: c, label: c }))).concat([{ value: "พิมพ์เอง", label: "✎ พิมพ์เอง" }])} />
                      <button onClick={() => delAcc(i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 8, alignItems: "center" }}>
                      {a.cat === "พิมพ์เอง"
                        ? <input value={a.name} onChange={(e) => setAcc(i, "name", e.target.value)} placeholder="ชื่อวัสดุ" style={inputStyle} />
                        : <Dropdown value={a.name || ""} onChange={(v) => setAcc(i, "name", v)} disabled={!a.cat} options={[{ value: "", label: a.cat ? "— เลือกวัสดุ —" : "เลือกหมวดก่อน" }].concat(matItemOptions(items, a.cat))} />}
                      <input type="number" style={numStyle} value={a.qty} placeholder="จำนวน" onChange={(e) => setAcc(i, "qty", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button onClick={addAcc} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มของ</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* เลือกหมวด → เลือกวัสดุ (จากราคาวัสดุ + คลังสินค้า) หรือ "พิมพ์เอง" — ถ้ามีราคาในระบบจะคิดต้นทุนให้</div>
          </Section>

          {/* ── ผลลัพธ์ BOQ ── */}
          <Section title="รายการวัสดุที่ถอดได้" icon="box"
            right={priced.grandTotal > 0 ? <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)" }}>รวม ฿{baht(priced.grandTotal)}</span> : null}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {priced.groups.map((g, gi) => (
                <div key={gi}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "var(--surface2)", borderTop: gi ? "1px solid var(--border)" : "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: GROUP_COLOR[g.group] || "var(--text-3)" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)", letterSpacing: ".03em" }}>{g.group}</span>
                  </div>
                  {g.items.length === 0 ? (
                    <div style={{ padding: "9px 14px", fontSize: 12, color: "var(--text-3)" }}>—</div>
                  ) : g.items.map((it, ii) => (
                    <div key={ii} style={{ display: "grid", gridTemplateColumns: "1fr 56px 84px", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-1)" }}>{(it.name || "").trim()}</span>
                        {it.code ? <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>{it.code}</span> : null}
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{(Math.round(it.qty * 100) / 100).toLocaleString()}</span>
                        <span style={{ display: "block", fontSize: 10, color: "var(--text-3)" }}>{it.unit}</span>
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: it.total > 0 ? "var(--text-1)" : "var(--text-3)" }}>{it.total > 0 ? baht(it.total) : "–"}</span>
                        {it.price > 0 ? <span style={{ display: "block", fontSize: 9.5, color: "var(--text-3)" }}>@{baht(it.price)}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              {priced.grandTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: "var(--surface2)", borderTop: "2px solid var(--border-strong)" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>ต้นทุนรวม</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: "var(--primary-dark)" }}>฿{baht(priced.grandTotal)}</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* ราคาดึงจากเมนู "ราคาวัสดุ" — รายการที่ยังไม่ใส่ราคาจะขึ้น "–"</div>
          </Section>
        </div>

        {/* footer */}
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          <button onClick={() => guardRun(exportXlsx)} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid #1d854b", background: "#22A35B14", color: "#1d854b", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="box" size={15} color="#1d854b" /> Excel</button>
          {onSave && <button onClick={() => guardRun(() => onSave(b))} style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก BOQ</button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, right, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "var(--text-3)", textTransform: "uppercase" }}>
          <Icon name={icon} size={14} color="var(--text-2)" /> {title}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { BOQEditor });
