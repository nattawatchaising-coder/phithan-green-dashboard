/* ============================================================
   PHITHAN GREEN — BOQ / ถอดวัสดุต่องาน
   เครื่องคำนวณปริมาณวัสดุหลัก (PV / INVERTER / MOUNTING / CABLE)
   สูตรอ้างอิงจากไฟล์ "BOM REV.02.xlsx" (ADD DATA + CAL-MOUNTING + ATMOCE)
   ============================================================ */
(function () {
  // ── ตารางรุ่นแผง: Wp, ความหนาเฟรม(mm), ความกว้างแผงด้านวางราง(m) ──
  // width = ค่าคอลัมน์ L ในชีต DATA (ด้านสั้นที่เรียงชิดกันบนราง)
  // สเปคเริ่มต้น (fallback) สำหรับรุ่นที่ระบบรู้จัก — ถ้าคลังยังไม่กรอกสเปคจะใช้ค่านี้
  // voc/isc/vmp/imp = สเปคไฟฟ้าแผง (ใช้คำนวณการต่ออนุกรม String + สาย DC)
  const DEFAULT_PANELS = [
    { model: "LONGi Hi-MO X10 650W-LR7-72HVH-650M", wp: 650, frame: 30, width: 1.134, voc: 53.90, isc: 15.29, vmp: 44.80, imp: 14.52 },
    { model: "LONGi Hi-MO X10 720W-LR7-72HVH-720M", wp: 720, frame: 35, width: 1.303, voc: 0, isc: 0, vmp: 0, imp: 0 },
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
    cabinet: "AC/DC Combiner Box ตู้หน้ากระจก เบอร์3",
    dcFuseHolder: "DC FUSE HOLDER FEEO",
    dcFuse: "DC FUSE 16A 1000VDC FEEO",
    dcSpd: "DC SPD 2P 800VDC 20-40KA FEEO",
    dcMcb: "DC MCB 20A 2P 800VDC FEEO",
    acSpd1: "AC SPD 2P Uc275V In20Ka/Imax40Ka FEEO",
    acSpd3: "AC SPD 4P Uc385V In20Ka/Imax40Ka FEEO",
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
  function rcboName(outA, phase) { return "RCBO " + rcboAmp(outA) + "A " + (phase === 3 ? "3P+N" : "2P") + " 100mA FEEO"; }

  const COMBINER = { 1: "M-Combiner 1P (MC-100)", 3: "M-Combiner 3P (MC-100T)" };
  const CT       = { 1: "CT 250A x1", 3: "CT 250A x3" };
  const BACKUP   = { 1: "M-Backup 1P (MU100-S)", 3: "M-Backup 3P (MU100-T)" };
  const JUNCTION = { 1: "Single-phase junction adapter", 3: "Three-phase junction adapter" };
  const BATTERY_MODEL = "7kWh M-Battery (MS-7K-U)";
  const BATTERY_UNIT_KWH = 7;

  // ── ขนาดเบรกเกอร์มาตรฐาน (AT) — เลือกจากกระแส × 1.25 ปัดขึ้นขนาดถัดไป ──
  const BREAKER_AT = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 225, 250, 320, 400, 500, 630];
  function pickBreakerAT(amp) { const v = (+amp || 0) * 1.25; for (let i = 0; i < BREAKER_AT.length; i++) { if (BREAKER_AT[i] >= v) return BREAKER_AT[i]; } return BREAKER_AT[BREAKER_AT.length - 1]; }

  // ── ATMOCE "ตู้ประกอบ" (assembled): อุปกรณ์ในตู้รายชิ้น — รองรับ 1 เฟส (2P) และ 3 เฟส (4P/3P+N) ──
  // ตัวตู้ (enclosure) — ใช้ร่วมทั้ง 1 เฟส/3 เฟส
  const ATMOCE_ASM_ENCLOSURE = { name: "ตู้ AC/DC Combiner Box ตู้หน้ากระจก เบอร์3", qty: 1, unit: "ใบ" };
  // อุปกรณ์ที่ใช้ร่วมทุกเฟส (ขนาดคงที่ ไม่ขึ้นกับจำนวนขั้ว)
  const ATMOCE_ASM_SHARED = [
    { name: "บัสบาร์กราวด์ทองเหลือง 6x9 (6P)", qty: 1, unit: "ea" },
    { name: "รางวายดักส์ สูง60xกว้าง40", qty: 2, unit: "เส้น" },
    { name: "STOPPER TBR รุ่นพลาสติก สีดำ", qty: 10, unit: "ea" },
    { name: "รางรีเลย์ DIN-RAIL ยาว 1 เมตร", qty: 1, unit: "เส้น" },
    { name: "ชุดพุชอินเทอร์มินอล FJ7-2.5/4 24A ใส่สาย 0.14-2.5mm. สีเทา (1ชุด10แถว+ฝา1อัน P7-2.5/4) BLOX CONNECT", qty: 1, unit: "ชุด" },
  ];
  // อุปกรณ์คงที่ที่จำนวนขั้วเปลี่ยนตามเฟส (3 เฟส = 4P/3P+N · 1 เฟส = 2P)
  const ATMOCE_ASM_POLE = {
    3: { pole: "4P", mcb25: "MCB 4P 25AT", spd: "AC SPD TYPE II 3P+N Uc385V In20Ka/Imax40Ka", mcb10: "MCB 4P 10AT 400V" },
    1: { pole: "2P", mcb25: "MCB 2P 25AT", spd: "AC SPD TYPE II 2P Uc275V In20Ka/Imax40Ka",   mcb10: "MCB 2P 10AT 400V" },
  };
  // สร้างรายการอุปกรณ์ในตู้ประกอบ — iMicro/iBatt = กระแสรวม (A) · hasBatt = มีแบตเตอรี่ · phase = 1|3
  // RCCB เลือกจากกระแสรวม (ไมโคร+แบต) · MCB ไมโคร/แบต เลือกตามกระแสแต่ละชุด (×1.25)
  function atmoceAssembled(iMicro, iBatt, hasBatt, phase) {
    const cfg = ATMOCE_ASM_POLE[phase === 3 ? 3 : 1];
    const out = [];
    out.push(ATMOCE_ASM_ENCLOSURE);                                                                                         // ตัวตู้หน้ากระจก เบอร์3
    out.push({ name: "RCCB " + cfg.pole + " " + pickBreakerAT(iMicro + iBatt) + "AT Type A 100mA", qty: 1, unit: "ตัว" });  // ตามกระแสรวม BAT+Micro
    out.push({ name: cfg.mcb25, qty: 1, unit: "ตัว" });                                                                     // MCB 25AT เท่าเดิม
    out.push({ name: cfg.spd, qty: 1, unit: "ตัว" });                                                                       // AC SPD เท่าเดิม
    if (hasBatt) out.push({ name: "MCB " + cfg.pole + " " + pickBreakerAT(iBatt) + "AT 400V (แบตเตอรี่)", qty: 1, unit: "ตัว" });  // ตามกระแสรวม BATTERY
    out.push({ name: "MCB " + cfg.pole + " " + pickBreakerAT(iMicro) + "AT 400V (ไมโคร)", qty: 1, unit: "ตัว" });            // ตามกระแสรวม Micro
    out.push({ name: cfg.mcb10, qty: 1, unit: "ตัว" });                                                                     // MCB 10AT เท่าเดิม
    ATMOCE_ASM_SHARED.forEach((x) => out.push(x));                                                                          // อุปกรณ์ร่วม
    return out.map((x) => Object.assign({}, x));
  }

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
    "PV1-F 1Cx6 SQ.MM. (DC)", "PV1-F 1Cx10 SQ.MM. (DC)", "PV1-F 1Cx16 SQ.MM. (DC)",
    "LAN CAT6",
  ];

  // ── หมวดสายไฟ — ใช้จัดกลุ่ม/ฟิลเตอร์ใน dropdown ถอด BOQ ──
  // กำหนดหมวดเองได้ในคลัง (field cableGroup) · ว่าง = เดาจากชื่อด้วย cableCategory()
  const CABLE_GROUPS = ["CV-FD", "VCT", "THW (กราวด์)", "PV1-F (DC)", "LAN", "อื่นๆ"];
  function cableCategory(name) {
    const s = String(name || "");
    if (/PV1-F|PV CABLE/i.test(s)) return "PV1-F (DC)";
    if (/CV-FD/i.test(s)) return "CV-FD";
    if (/VCT/i.test(s)) return "VCT";
    if (/THW|IEC01/i.test(s)) return "THW (กราวด์)";
    if (/LAN|CAT/i.test(s)) return "LAN";
    return "อื่นๆ";
  }

  // จัดกลุ่มย่อยของวัสดุ (Accessories) — โชว์เป็นชิปฟิลเตอร์ใน dropdown เหมือนสายไฟ · เดาจากชื่อ + รู้หมวด
  // ลำดับนี้ใช้เรียงชิป/หัวข้อกลุ่ม · แต่ละหมวดจะโผล่เฉพาะกลุ่มที่มีของจริงเท่านั้น
  const MATERIAL_SUBGROUPS = [
    // อุปกรณ์ไฟฟ้า / Accessories
    "เบรกเกอร์", "SPD", "ฟิวส์", "ตู้ / กล่อง", "บัสบาร์ / กราวด์", "ราง / DIN / เทอร์มินอล", "เทป / กาว / รัดสาย",
    // ท่อร้อยสาย
    "ท่อ IMC (เหล็ก)", "ท่อ uPVC", "Pull Box / กล่องพัก", "รางเดินสาย",
    // Solar Mounting
    "ราง (Rail)", "แคลมป์ยึดแผง", "ขายึด / ฮุก", "น็อต / สกรู", "กราวด์ / EARTH",
    // งานโครงสร้าง
    "เหล็กรูปพรรณ", "สลิง / เกลียว / กิ๊บ",
    // สายไฟ (ใช้หมวดเดียวกับ dropdown สายไฟ)
    "CV-FD", "VCT", "THW (กราวด์)", "PV1-F (DC)", "LAN",
    // อินเวอร์เตอร์
    "ไมโคร / อินเวอร์เตอร์", "Combiner / Backup", "แบตเตอรี่", "CT", "อะแดปเตอร์ / สาย AC",
    // กราวด์ / กันดูด
    "แท่งกราวด์ / เชื่อม",
    "อื่นๆ",
  ];
  function materialSubGroup(name, cat) {
    const s = String(name || "");
    const c = String(cat || "");

    // สายไฟ → ใช้หมวดเดียวกับ dropdown สายไฟ
    if (/สายไฟ|ไฟฟ้า$/.test(c) && /CV-FD|VCT|THW|IEC01|PV1-F|PV CABLE|LAN|CAT/i.test(s)) return cableCategory(s);

    // ท่อร้อยสาย — เช็ค Pull Box/กล่องพัก ก่อน uPVC (กล่องพัก uPVC ต้องอยู่กลุ่ม Pull Box)
    if (/ท่อร้อยสาย/.test(c)) {
      if (/PULL BOX|กล่องพัก/i.test(s)) return "Pull Box / กล่องพัก";
      if (/uPVC/i.test(s)) return "ท่อ uPVC";
      if (/IMC|คุปปิ้ง|ท่ออ่อนเหล็ก/i.test(s)) return "ท่อ IMC (เหล็ก)";
      if (/รางซี|C-Channel|ราง/i.test(s)) return "รางเดินสาย";
      return "อื่นๆ";
    }

    // Solar Mounting
    if (/Mounting/i.test(c)) {
      if (/CLAM[EP]|CLAMP/i.test(s)) return "แคลมป์ยึดแผง";
      if (/L ?FEET|HOOK|FLASHING|STUD/i.test(s)) return "ขายึด / ฮุก";
      if (/RAIL|SPLICE/i.test(s)) return "ราง (Rail)";
      if (/EARTH|GROUND|LUG/i.test(s)) return "กราวด์ / EARTH";
      if (/BOLT|NUT|สกรู|พุ๊ก/i.test(s)) return "น็อต / สกรู";
      return "อื่นๆ";
    }

    // งานโครงสร้าง
    if (/โครงสร้าง/.test(c)) {
      if (/สลิง|เกลียว|กิ๊บ|ปลอก/.test(s)) return "สลิง / เกลียว / กิ๊บ";
      if (/เหล็ก|เพลท|WALKWAY|พุ๊ก|ฉาก/i.test(s)) return "เหล็กรูปพรรณ";
      return "อื่นๆ";
    }

    // กราวด์ / กันดูด
    if (/กราวด์|กันดูด/.test(c)) {
      if (/แท่งกราวด์|เทอร์โมเวล|GROUND|EARTH|TEST/i.test(s)) return "แท่งกราวด์ / เชื่อม";
      return "อื่นๆ";
    }

    // อินเวอร์เตอร์ / อุปกรณ์อินเวอร์เตอร์
    if (/อินเวอร์เตอร์/.test(c)) {
      if (/Battery|แบต|kWh/i.test(s)) return "แบตเตอรี่";
      if (/Backup|Combiner/i.test(s)) return "Combiner / Backup";
      if (/\bCT\b/i.test(s)) return "CT";
      if (/adapter|junction|AC Cable|สาย/i.test(s)) return "อะแดปเตอร์ / สาย AC";
      if (/inverter|ไมโคร/i.test(s)) return "ไมโคร / อินเวอร์เตอร์";
      return "อื่นๆ";
    }

    // อุปกรณ์ไฟฟ้า / Accessories (รวมของไฟฟ้า + วัสดุสิ้นเปลือง)
    if (/SPD/i.test(s)) return "SPD";
    if (/FUSE|ฟิวส์/i.test(s)) return "ฟิวส์";
    if (/MCB|MCCB|RCCB|RCBO|ELCB|เบรกเกอร์|breaker/i.test(s)) return "เบรกเกอร์";
    if (/บัสบาร์|BUS-?BAR/i.test(s)) return "บัสบาร์ / กราวด์";
    if (/COMBINER|ENCLOSURE|ตู้/i.test(s)) return "ตู้ / กล่อง";
    if (/DIN-?RAIL|รางรีเลย์|วายดักส์|WIRE ?DUCT|STOPPER|เทอร์มินอล|TERMINAL/i.test(s)) return "ราง / DIN / เทอร์มินอล";
    if (/เทป|ซิลิโคน|อะคริลิก|Cable Tie|ลวด|กาว|ยาแนว/i.test(s)) return "เทป / กาว / รัดสาย";
    return "อื่นๆ";
  }

  // สายไฟชุดมาตรฐาน (ค่าเริ่มต้น) — แก้ระยะได้
  const DEFAULT_CABLES = [
    { name: "MICRO-MICRO",     type: "", length: "" },
    { name: "MICRO-COMBINER",  type: "", length: "" },
    { name: "COMBINER-MCB",    type: "", length: "" },
    { name: "COMBINER-BAT.",   type: "", length: "" },
    { name: "COMBINER-BACKUP", type: "", length: "" },
    { name: "GROUND",          type: "IEC01(THW)1Cx6 SQ.MM. Y/G", length: "" },
    { name: "LAN",             type: "LAN CAT6", length: "" },
  ];
  // ── จุดเดินสายสำหรับระบบ String/Hybrid (แทนชุดไมโคร) ──
  // PV-INVERTER = สาย DC จากแผง→อินเวอร์เตอร์ · INVERTER-MCB_SOLAR = AC จากอินเวอร์เตอร์→เบรกเกอร์โซลาร์ · MCB_SOLAR-MDB = เบรกเกอร์โซลาร์→ตู้เมน
  const STRING_CABLE_POINTS = ["PV-INVERTER", "INVERTER-MCB_SOLAR", "MCB_SOLAR-MDB"];
  const MICRO_CABLE_NAMES = ["MICRO-MICRO", "MICRO-COMBINER", "COMBINER-MCB", "COMBINER-BAT.", "COMBINER-BACKUP"];
  const DEFAULT_STRING_CABLES = [
    { name: "PV-INVERTER",        type: "PV1-F 1Cx6 SQ.MM. (DC)", length: "" },
    { name: "INVERTER-MCB_SOLAR", type: "", length: "" },
    { name: "MCB_SOLAR-MDB",      type: "", length: "" },
  ];
  // ชื่อจุดเดินสาย (ตัวเลือกตั้งต้น) — ไมโคร + String/Hybrid · เพิ่มเองได้ในหน้า BOQ
  const CABLE_POINTS = DEFAULT_CABLES.map((c) => c.name).concat(STRING_CABLE_POINTS);
  // ── สาย DC PV1-F: ตอนถอดของ แยกเป็น 2 เส้น สีแดง(+) และ สีดำ(−) ความยาวเท่ากัน ──
  const PV_DC_COLORS = ["สีแดง (+)", "สีดำ (−)"];
  function isPvDcCable(type) { return /PV1-F/i.test(type || ""); }
  function pvCableColorName(type, colorTh) { return String(type || "").replace(/\s*\(DC\)\s*$/i, "").trim() + " " + colorTh; }

  // ── พิกัดกระแสสายไฟ (อ้างอิงมาตรฐาน วสท. — ตัวนำทองแดง แรงดัน 0.6/1 kV) ──
  // โครงสร้าง: [ฉนวน][วิธีเดินสาย][คอลัมน์ "กลุ่ม|จำนวนตัวนำมีกระแส|แกน"][ขนาด sq.mm] = กระแส (A)
  //   · ฉนวน: pvc (PVC 70°C: THW/VCT) · xlpe (XLPE 90°C: CV) — อ่านจากชื่อสาย
  //   · แกน: single (1C) / multi (2C ขึ้นไป) — อ่านจากชื่อสายอัตโนมัติ
  //   · กลุ่ม + จำนวนตัวนำมีกระแส (2/3) — ผู้ใช้เลือกเองต่อสายในหน้า BOQ
  // ปัจจุบันมีตารางจริง: PVC · เดินในท่อร้อยสายในอากาศ (วสท.) — ฉนวน/วิธีอื่นรอเติมตารางในหน้าคลัง
  const WIRE_SIZES = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500];
  const WIRE_METHODS = [
    { key: "conduitAir", th: "เดินในท่อร้อยสายในอากาศ" },
  ];
  const INS_CLASSES = [
    { key: "pvc",  th: "PVC 70°C (THW/VCT)" },
    { key: "xlpe", th: "XLPE 90°C (CV)" },
  ];
  const AMP_GROUPS = [
    { key: "g1", th: "กลุ่มที่ 1" },
    { key: "g2", th: "กลุ่มที่ 2" },
  ];
  const AMP_NCOND = [
    { key: "2", th: "2 ตัวนำมีกระแส" },
    { key: "3", th: "3 ตัวนำมีกระแส" },
  ];
  const AMP_CORES = [
    { key: "single", th: "แกนเดียว" },
    { key: "multi",  th: "หลายแกน" },
  ];
  // คอลัมน์ = "<กลุ่ม>|<จำนวนตัวนำ>|<แกน>"
  const ampColKey = (group, ncond, core) => group + "|" + ncond + "|" + core;
  // ตารางมาตรฐาน วสท. — PVC 70°C ทองแดง · เดินในท่อร้อยสายในอากาศ (ขนาดกระแสปรับ, แอมแปร์)
  const DEFAULT_AMPACITY = {
    pvc: {
      conduitAir: {
        "g1|2|single": { 1: 10, 1.5: 13, 2.5: 17, 4: 23, 6: 30, 10: 40, 16: 53, 25: 70, 35: 86, 50: 104, 70: 131, 95: 158, 120: 183, 150: 209, 185: 238, 240: 279, 300: 319 },
        "g1|2|multi":  { 1: 10, 1.5: 12, 2.5: 16, 4: 22, 6: 28, 10: 37, 16: 50, 25: 65, 35: 80, 50: 96,  70: 121, 95: 145, 120: 167, 150: 191, 185: 216, 240: 253, 300: 291 },
        "g1|3|single": { 1: 9,  1.5: 12, 2.5: 16, 4: 21, 6: 27, 10: 37, 16: 49, 25: 64, 35: 77, 50: 94,  70: 118, 95: 143, 120: 164, 150: 188, 185: 213, 240: 249, 300: 285 },
        "g1|3|multi":  { 1: 9,  1.5: 11, 2.5: 15, 4: 20, 6: 25, 10: 34, 16: 45, 25: 59, 35: 72, 50: 86,  70: 109, 95: 131, 120: 150, 150: 171, 185: 194, 240: 227, 300: 259 },
        "g2|2|single": { 1: 12, 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 66, 25: 88, 35: 109, 50: 131, 70: 167, 95: 202, 120: 234, 150: 261, 185: 297, 240: 348, 300: 398, 400: 475, 500: 545 },
        "g2|2|multi":  { 1: 11, 1.5: 14, 2.5: 20, 4: 26, 6: 33, 10: 45, 16: 60, 25: 78, 35: 97,  50: 116, 70: 146, 95: 175, 120: 202, 150: 224, 185: 256, 240: 299, 300: 343 },
        "g2|3|single": { 1: 10, 1.5: 13, 2.5: 18, 4: 24, 6: 31, 10: 44, 16: 59, 25: 77, 35: 96,  50: 117, 70: 149, 95: 180, 120: 208, 150: 228, 185: 258, 240: 301, 300: 343, 400: 406, 500: 464 },
        "g2|3|multi":  { 1: 10, 1.5: 13, 2.5: 17, 4: 23, 6: 30, 10: 40, 16: 54, 25: 70, 35: 86,  50: 103, 70: 130, 95: 156, 120: 179, 150: 196, 185: 222, 240: 258, 300: 295 },
      },
    },
    xlpe: {
      // ตารางมาตรฐาน วสท. 5-27 — XLPE 90°C ทองแดง · เดินในท่อร้อยสายในอากาศ
      conduitAir: {
        "g1|2|single": { 1: 13, 1.5: 17, 2.5: 24, 4: 32, 6: 41, 10: 56, 16: 74, 25: 96,  35: 119, 50: 144, 70: 182, 95: 219, 120: 253, 150: 289, 185: 329, 240: 386, 300: 442 },
        "g1|2|multi":  { 1: 13, 1.5: 17, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69, 25: 90,  35: 110, 50: 132, 70: 167, 95: 200, 120: 230, 150: 264, 185: 299, 240: 351, 300: 402 },
        "g1|3|single": { 1: 12, 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 49, 16: 66, 25: 86,  35: 106, 50: 128, 70: 163, 95: 197, 120: 227, 150: 259, 185: 295, 240: 346, 300: 396 },
        "g1|3|multi":  { 1: 12, 1.5: 15, 2.5: 20, 4: 27, 6: 35, 10: 46, 16: 62, 25: 81,  35: 99,  50: 118, 70: 149, 95: 179, 120: 207, 150: 236, 185: 268, 240: 315, 300: 360 },
        "g2|2|single": { 1: 15, 1.5: 21, 2.5: 28, 4: 38, 6: 49, 10: 68, 16: 91, 25: 121, 35: 149, 50: 180, 70: 230, 95: 278, 120: 322, 150: 358, 185: 409, 240: 480, 300: 549, 400: 622, 500: 713 },
        "g2|2|multi":  { 1: 15, 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 83, 25: 108, 35: 133, 50: 159, 70: 201, 95: 241, 120: 278, 150: 304, 185: 349, 240: 418, 300: 484 },
        "g2|3|single": { 1: 14, 1.5: 18, 2.5: 25, 4: 34, 6: 44, 10: 60, 16: 80, 25: 106, 35: 131, 50: 159, 70: 202, 95: 245, 120: 284, 150: 311, 185: 349, 240: 410, 300: 468, 400: 531, 500: 606 },
        "g2|3|multi":  { 1: 14, 1.5: 18, 2.5: 24, 4: 32, 6: 40, 10: 55, 16: 73, 25: 96,  35: 116, 50: 140, 70: 177, 95: 212, 120: 244, 150: 273, 185: 309, 240: 362, 300: 414 },
      },
    },
  };
  function _cloneAmp(src) {
    const out = {};
    Object.keys(src).forEach((cls) => { out[cls] = {}; Object.keys(src[cls]).forEach((m) => { out[cls][m] = {}; Object.keys(src[cls][m]).forEach((col) => { out[cls][m][col] = Object.assign({}, src[cls][m][col]); }); }); });
    return out;
  }
  // AMPACITY = ตารางที่ใช้งานจริง (สะท้อนค่าที่แก้จากคลัง) — setAmpacity() จะ rebuild
  const AMPACITY = _cloneAmp(DEFAULT_AMPACITY);
  // โหลดค่าที่แก้จากคลัง: overrides = { ins: { method: { colKey: { size: amp } } } } — รวมทับ/เพิ่มจากค่าเริ่มต้น (เฉพาะค่า > 0)
  function setAmpacity(overrides) {
    const base = _cloneAmp(DEFAULT_AMPACITY);
    if (overrides && typeof overrides === "object") {
      Object.keys(overrides).forEach((cls) => {
        if (!overrides[cls]) return; base[cls] = base[cls] || {};
        Object.keys(overrides[cls]).forEach((m) => {
          if (!overrides[cls][m]) return; base[cls][m] = base[cls][m] || {};
          Object.keys(overrides[cls][m]).forEach((col) => {
            if (!overrides[cls][m][col]) return; base[cls][m][col] = base[cls][m][col] || {};
            Object.keys(overrides[cls][m][col]).forEach((sz) => { const v = +overrides[cls][m][col][sz]; if (v > 0) base[cls][m][col][sz] = v; });
          });
        });
      });
    }
    Object.keys(AMPACITY).forEach((k) => delete AMPACITY[k]);
    Object.keys(base).forEach((k) => { AMPACITY[k] = base[k]; });
  }
  // ชนิดฉนวนจากชื่อสาย: CV / CV-FD = XLPE 90°C · THW / IEC01 / VCT / อื่นๆ = PVC 70°C
  function cableInsClass(type) { return /CV[\s-]*FD|\bCV\b/i.test(type || "") ? "xlpe" : "pvc"; }
  // จำนวนแกนจากชื่อสาย: "1Cx.." = แกนเดียว, "2C/3C/4C.." = หลายแกน (ไม่พบ → แกนเดียว)
  function cableCoreType(type) { const m = /(\d+)\s*C\s*x/i.exec(type || ""); return m && +m[1] >= 2 ? "multi" : "single"; }
  // ขนาดตัวนำ (sq.mm) จากชื่อสาย เช่น "CV-FD 1Cx2.5 SQ.MM." → 2.5
  function cableSizeNum(type) { const m = /(\d+(?:\.\d+)?)\s*sq/i.exec(type || ""); return m ? +m[1] : null; }
  // พิกัดกระแสของสาย (A) — opts = { method, group, ncond } · ฉนวน/แกน/ขนาด อ่านจากชื่อ · ไม่มีข้อมูล = null
  function ampacityOf(type, opts) {
    opts = opts || {};
    const sz = cableSizeNum(type); if (sz == null) return null;
    const col = ampColKey(opts.group || "g1", String(opts.ncond || 2), cableCoreType(type));
    const tbl = ((AMPACITY[cableInsClass(type)] || {})[opts.method || "conduitAir"] || {})[col] || {};
    return tbl[sz] != null ? tbl[sz] : null;
  }
  // เลือกขนาดสายเล็กสุดที่รับกระแส "ที่ต้องการ" ได้ (ผู้เรียกคูณ 1.25 มาก่อนแล้ว) — opts = { method, group, ncond, core }
  function pickWireSize(needAmp, insClass, opts) {
    opts = opts || {};
    const col = ampColKey(opts.group || "g1", String(opts.ncond || 2), opts.core || "single");
    const tbl = ((AMPACITY[insClass || "pvc"] || {})[opts.method || "conduitAir"] || {})[col] || {};
    for (let i = 0; i < WIRE_SIZES.length; i++) { const sz = WIRE_SIZES[i]; if ((tbl[sz] || 0) >= needAmp) return sz + " mm²"; }
    const sizesWithData = WIRE_SIZES.filter((s) => tbl[s] != null);
    if (!sizesWithData.length) return "—";   // ยังไม่มีตารางพิกัดสำหรับเงื่อนไขนี้
    return "มากกว่า " + sizesWithData[sizesWithData.length - 1] + " mm²";
  }

  // ── สาย DC โซลาร์ PV1-F (ตัวนำทองแดง XLPO 90°C, สายเดี่ยวในอากาศ) ──
  // พิกัดกระแสสายเดี่ยว 2 เส้นในอากาศ (A) อ้างอิงสเปคผู้ผลิตทั่วไป — เลือกขนาดจากกระแสสตริง × 1.25
  // ขนาดต่ำสุดของสาย DC = 6 mm² ตามมาตรฐาน วสท. (เลือกไม่ต่ำกว่านี้แม้กระแสน้อย)
  const PV_WIRE_MIN = 6;
  const PV_WIRE_SIZES = [2.5, 4, 6, 10, 16];
  const PV_WIRE_AMP = { 2.5: 41, 4: 55, 6: 70, 10: 98, 16: 132 };
  // เลือกขนาดสาย DC จากกระแสที่ต้องการ (ผู้เรียกคูณ factor มาก่อนแล้ว) — ไม่ต่ำกว่า PV_WIRE_MIN
  function pickPvWireSize(needAmp) {
    for (let i = 0; i < PV_WIRE_SIZES.length; i++) { const sz = PV_WIRE_SIZES[i]; if (sz >= PV_WIRE_MIN && PV_WIRE_AMP[sz] >= needAmp) return sz + " mm²"; }
    return "มากกว่า " + PV_WIRE_SIZES[PV_WIRE_SIZES.length - 1] + " mm²";
  }
  // หาแผง / อินเวอร์เตอร์จากชื่อรุ่น (สะท้อนคลัง)
  function findPanel(model) { return PANELS.find((p) => p.model === model) || null; }
  function findInverter(model) { return INVERTERS.find((x) => x.model === model) || null; }
  // ── คำนวณการต่ออนุกรมแผง (String) + สาย DC ──
  // panel = { voc, isc, vmp, imp } · inv = { mpptVmin, mpptVmax, maxVdc, maxInA }
  // คืนช่วงจำนวนแผง/สตริงที่ "แรงดัน" อยู่ในช่วงทำงาน MPPT (Vmin–Vmax) และ Voc รวมไม่เกินแรงดันระบบสูงสุด + ขนาดสาย DC
  function stringConfig(panel, inv, opts) {
    opts = opts || {}; panel = panel || {}; inv = inv || {};
    const voc = +panel.voc || 0, isc = +panel.isc || 0, vmp = +panel.vmp || 0, imp = +panel.imp || 0;
    const vmin = +inv.mpptVmin || 0, vmax = +inv.mpptVmax || 0, maxVdc = +inv.maxVdc || 0, maxInA = +inv.maxInA || 0;
    const vRef = vmp > 0 ? vmp : voc;   // จุดทำงาน: ใช้ Vmp ถ้ามี ไม่งั้นใช้ Voc
    const out = { voc, isc, vmp, imp, vmin, vmax, maxVdc, maxInA, vRef, warns: [], ready: false };
    if (!voc || !vmin || !vmax) {
      if (!voc) out.warns.push("ยังไม่ระบุ Voc ของแผง — เพิ่มได้ที่หน้าคลัง › สเปคแผง");
      if (!vmin || !vmax) out.warns.push("ยังไม่ระบุช่วงแรงดันทำงาน MPPT ของอินเวอร์เตอร์ — เพิ่มได้ที่หน้าคลัง");
      return out;
    }
    out.ready = true;
    out.minSeries = Math.max(1, Math.ceil(vmin / vRef));         // ขั้นต่ำ ให้แรงดันถึง Vmin
    const maxByOp = Math.floor(vmax / vRef);                      // สูงสุด ให้แรงดันทำงานไม่เกิน Vmax
    const maxByVoc = maxVdc > 0 ? Math.floor(maxVdc / voc) : maxByOp;  // Voc รวม ต้องไม่เกินแรงดันระบบสูงสุด
    out.maxByOp = maxByOp; out.maxByVoc = maxByVoc;
    out.maxSeries = Math.min(maxByOp, maxByVoc);
    out.recSeries = out.maxSeries >= out.minSeries ? out.maxSeries : out.minSeries;  // เลือกมากสุดที่อยู่ในช่วง (กระแสรวมต่ำสุด)
    if (out.maxSeries < out.minSeries) out.warns.push("ช่วงแรงดันทำงานแคบเกินไป — แผงรุ่นนี้ต่ออนุกรมให้อยู่ในช่วง MPPT ไม่ได้");
    // สถานะของจำนวนที่เลือกใช้ (ถ้าระบุ series มา)
    const series = Math.max(1, Math.round(+opts.series || out.recSeries));
    out.series = series;
    out.stringVoc = Math.round(series * voc * 100) / 100;        // แรงดันเปิดวงจรรวม (เย็น/ไม่มีโหลด)
    out.stringVop = Math.round(series * vRef * 100) / 100;       // แรงดันทำงานรวม (โดยประมาณ)
    out.inRange = out.stringVop >= vmin && out.stringVop <= vmax;
    out.overMaxVdc = maxVdc > 0 && out.stringVoc > maxVdc;
    if (!out.inRange) out.warns.push("แรงดันทำงานรวม " + out.stringVop + " V อยู่นอกช่วง MPPT " + vmin + "–" + vmax + " V");
    if (out.overMaxVdc) out.warns.push("Voc รวม " + out.stringVoc + " V เกินแรงดันระบบสูงสุด " + maxVdc + " V");
    // กระแส DC = Isc × 1.25 (ป้องกันกระแสเกินตามมาตรฐาน) → เลือกขนาดสาย PV1-F
    out.dcAmp = Math.round(isc * 1.25 * 100) / 100;
    out.dcWire = isc > 0 ? pickPvWireSize(out.dcAmp) : "—";
    if (maxInA > 0 && isc > maxInA) out.warns.push("Isc " + isc + " A เกินกระแส input สูงสุด/สตริง " + maxInA + " A");
    return out;
  }

  // ── ท่อร้อยสาย (RACE WAY) ──
  const IMC_SIZES = ['IMC 1"', 'IMC 1-1/4"', 'IMC 1-1/2"', 'IMC 2"', 'IMC 2-1/2"', 'IMC 3"', 'IMC 3-1/2"'];
  const UPVC_SIZES = [
    "ท่อขาว uPVC 16mm. (สีขาว)", "ท่อขาว uPVC 20mm. (สีขาว)", "ท่อขาว uPVC 25mm. (สีขาว)", "ท่อขาว uPVC 32mm. (สีขาว)",
  ];
  const PULLBOX_SIZES = [
    "PULL BOX (HDG.) 100x100x100mm.", "PULL BOX (HDG.) 150x150x100mm.", "PULL BOX (HDG.) 150x150x150mm.",
    "PULL BOX (HDG.) 200x200x100mm.", "PULL BOX (HDG.) 200x200x150mm.", "PULL BOX (HDG.) 200x200x200mm.",
    "กล่องพักสายไฟ uPVC สีขาว 4\"x4\"x2\"", "กล่องพักสายไฟ uPVC สีขาว 4\"x4\"x3\"",
  ];

  // ── ACCESSORIES มาตรฐาน — ถอดให้ทุกงานอัตโนมัติ + เทปพันสายไฟตามจำนวนเฟส ──
  const ACC_STD = [
    "ลวดอลูมิเนียมกลม ขนาด 4 มม. x 10 เมตร",
    'Cable Tie 8"',
    "อะคริลิกกันน้ำรั่วซึม 4 กก. SUPREMPRO รุ่น 2601062 สีเทาอ่อน",
    "ซิลิโคนยาแนวอเนกประสงค์ 280 มล. (สีขาว)",
  ];
  const ACC_TAPE_1P = ["สีน้ำตาล", "สีฟ้า"];
  const ACC_TAPE_3P = ["สีน้ำตาล", "สีดำ", "สีเทา", "สีฟ้า"];
  const accTape = (phase) => (phase === 3 ? ACC_TAPE_3P : ACC_TAPE_1P).map((c) => "เทปพันสายไฟ " + c);

  const ROOF_OPTIONS = ROOF_HOOKS.map((r) => r.roof);

  // ── ตาราง OD สายไฟ (mm) ตามชนิด + ขนาด sq.mm — อ้างอิง "คำนวณ BOQ.xlsx" ──
  const CABLE_OD = {
    "CV FD 4C":    {2.5:13.5,4:14.5,6:16,10:17.5,16:20,25:24,35:27,50:30,70:35,95:39,120:44,150:49,185:54,240:61,300:68,400:76},
    "CV FD 3C":    {2.5:12.5,4:13.5,6:15,10:16,16:18,25:22,35:24,50:27,70:31,95:36,120:39,150:44,185:49,240:55,300:61,400:68},
    "CV FD 2C":    {2.5:12,4:13,6:14,10:15,16:17,25:21,35:23,50:26,70:29,95:33,120:37,150:41,185:45,240:51,300:56,400:63},
    "CV FD 1C":    {1.5:6.3,2.5:6.8,4:7.3,6:7.9,10:8.4,16:9.4,25:11,35:12,50:13.5,70:15,95:17.5,120:19,150:21,185:23,240:26,300:29,400:32,500:36,630:40,800:45,1000:51},
    "IEC01 (THW)": {2.5:4,4:4.6,6:5.2,10:6.7,16:7,25:9.7,35:10.9,50:12.8,70:14.6,95:17.1,120:18.8,150:20.9,185:23.3,240:26.6,300:29.6,400:33.2},
    "PV Cable":    {4:5,6:6.5},
  };
  // ท่อ HDPE: ขนาดนอก (mm) → เส้นผ่าน ID (mm) — fill limit 40%
  const HDPE_TABLE = [
    {mm:20,id:16.04},{mm:25,id:21.4},{mm:32,id:28},{mm:40,id:35.4},{mm:50,id:44.2},
    {mm:63,id:55.8},{mm:75,id:66.4},{mm:90,id:79.8},{mm:110,id:97.4},{mm:125,id:110.8},
    {mm:140,id:120},{mm:160,id:141.8},{mm:180,id:159.6},{mm:200,id:177.2},
  ];
  // ท่อ IMC: ขนาดนิ้ว → เส้นผ่าน ID (mm) — fill limit 40%
  const IMC_CONDUIT = [
    {sz:'1/2"',id:18.91},{sz:'3/4"',id:24.24},{sz:'1"',id:30.61},{sz:'1-1/4"',id:39.43},
    {sz:'1-1/2"',id:45.52},{sz:'2"',id:57.52},{sz:'2-1/2"',id:69},{sz:'3"',id:84.73},{sz:'4"',id:109.84},
  ];
  // พื้นที่ตัดขวางสาย (mm²) จาก OD ในตาราง
  function wireArea(type, sqmm) { const od = (CABLE_OD[type] || {})[+sqmm]; return od ? Math.PI * (od / 2) * (od / 2) : 0; }
  // ตรวจสอบ WIRE WAY: fill ≤ 20% ของพื้นที่ราง W×H
  function calcWireWay(cables, wayW, wayH) {
    let total = 0;
    (cables || []).forEach(function (c) { total += wireArea(c.type, c.size) * (+c.qty || 0); });
    const area = (+wayW || 0) * (+wayH || 0);
    const pct = area > 0 ? (total / area) * 100 : 0;
    return { totalArea: total, wayArea: area, fillPct: pct, ok: pct <= 20 };
  }
  // หาขนาดท่อขั้นต่ำที่รับสายได้ fill ≤ 40%
  function calcConduitSize(cables) {
    let total = 0;
    (cables || []).forEach(function (c) { total += wireArea(c.type, c.size) * (+c.qty || 0); });
    function find(table, keyFn) {
      for (var i = 0; i < table.length; i++) {
        var r = table[i]; var a = Math.PI * (r.id / 2) * (r.id / 2);
        if (a * 0.40 >= total) return { label: keyFn(r), fillPct: total / a * 100 };
      }
      return null;
    }
    return { totalArea: total, hdpe: find(HDPE_TABLE, function (r) { return r.mm + "mm"; }), imc: find(IMC_CONDUIT, function (r) { return r.sz; }) };
  }

  function blankBOQ(job) {
    job = job || {};
    return {
      panels: +job.panels || 0,
      panelModel: PANELS[0].model,
      phase: String(job.phase) === "3" ? 3 : 1,
      comboType: job.comboType || "ready",   // ตู้ Combiner ATMOCE: ready=สำเร็จ · assembled=ตู้ประกอบ
      microRatio: "2:1",
      inverterModel: "",
      strings: 0,
      hwBackup: "none",
      hwOptimizer: !!(job.connect && job.connect !== "-" && job.connect !== "ไม่มี"),
      hwExtraPanel: false,
      batteryKwh: 0,
      backup: !!job.backup,
      birdnet: !!job.birdnet,
      roof: "เมทัลชีท",
      railSize: 4.2,
      gap: 0.025,
      endSpare: 0.6,
      lfeetPerRail: 4,
      sparePct: { rail: 5, joiner: 5, endClamp: 10, midClamp: 10, lfeet: 5, ground: 10 },
      rows: [{ panels: +job.panels || 0, count: 1 }],
      // ค่าเริ่มต้นสายไฟ — ตัด COMBINER-BAT. ออกถ้าไม่มีแบต, ตัด COMBINER-BACKUP ออกถ้าไม่มี Backup
      cables: DEFAULT_CABLES
        .filter((c) => !((c.name === "COMBINER-BAT." && !job.battery) || (c.name === "COMBINER-BACKUP" && !job.backup)))
        .map((c) => Object.assign({}, c)),
      conduit: { imc: [], upvc: [], pullbox: [], flex: {}, upFlex: {} },
      conduitSpare: { clamp: 10, bushing: 10, cchannel: 10, connector: 10, coupling: 10, upStraight: 10, upClamp: 10, upConnector: 10 },
      // งานเพิ่มเติม (Input) — โครงสร้างบนหลังคา ถอดวัสดุตามสูตร (ว่าง = ไม่ใช้/ไม่ถอด)
      // งานเพิ่มเติม (Input) — โครงสร้างบนหลังคา ถอดวัสดุตามสูตร (ว่าง = ไม่ใช้/ไม่ถอด)
      struct: {
        ladder: [], walkway: [], walkwayThk: 35, guardrail: [],
        ladderSpare: 5, walkwaySpare: 10, guardrailSpare: 5,
        ladderExtra: [], walkwayExtra: [], guardrailExtra: [],
      },
      jobType: (job && job.type) || "",
      accessories: [],
      wirecheck: { wayW: 100, wayH: 100, cables: [] },
      conduitcheck: { cables: [] },
    };
  }

  // ── ถอดวัสดุงานโครงสร้างเพิ่มเติม (LADDER / WALKWAY / GUARD RAIL) ──
  // คืน array ของ group ตามสูตรในไฟล์ "คำนวณ BOQ.xlsx"
  function calcStructures(b) {
    const st = (b && b.struct) || {};
    const out = [];
    const sp = (v, pct) => Math.ceil(v * (1 + (+pct || 0) / 100));
    // ชื่อขายึด L FEET ตามประเภทหลังคาที่เลือก — ใช้เป็นชื่อ "ชุดยึด WALKWAY" ด้วย
    const roofHookModel = (ROOF_HOOKS.find((r) => r.roof === (b && b.roof)) || ROOF_HOOKS[0]).model;
    // % เผื่อที่ผู้ใช้กำหนด (ค่า default ถ้าไม่ได้ตั้ง)
    const ladSp = +(st.ladderSpare != null ? st.ladderSpare : 5);
    const wlkSp = +(st.walkwaySpare != null ? st.walkwaySpare : 10);
    const grlSp = +(st.guardrailSpare != null ? st.guardrailSpare : 5);

    // LADDER (บันไดลิง) — ต่อจุด: ความสูง h (m)
    const lad = (st.ladder || []).filter((p) => (+p.h || 0) > 0);
    if (lad.length) {
      let boxF = 0, flatPcs = 0, roundLen = 0, plate = 0, anchor = 0;
      lad.forEach((p) => {
        const B = +p.h, C = B + 1;
        boxF += Math.ceil((C * 2) / 6);                         // เหล็กกล่อง 2"x2" (2 ราง ÷ 6m/ท่อน)
        const G = C >= 5 ? C - 2.5 : 0;                          // ครอบหลัง เมื่อสูง ≥5m
        const K = G * 3 + (G / 0.5) * 2;
        flatPcs += Math.ceil(K / 6);                            // เหล็กแบน 32mm (÷6m)
        const rungs = Math.ceil(B / 0.35);
        roundLen += 0.5 * rungs;                                // ความยาวรวมเหล็กกลม (ขั้นละ 0.5m)
        const Q = B >= 3 ? 2 : 1, R = roundLen > 0 ? Q * 2 : 0;
        plate += R; anchor += R * 4;
      });
      const roundPcs = Math.ceil(roundLen / 6);
      const it = [];
      if (boxF) it.push({ name: 'เหล็กกล่องดำ 2"x2"', qty: sp(boxF + 1, ladSp), unit: "เส้น" });
      if (roundPcs) it.push({ name: 'เหล็กกลมดำ 1"', qty: sp(roundPcs + 1, ladSp), unit: "เส้น" });
      if (flatPcs) it.push({ name: "เหล็กแบน 32 มม.", qty: sp(flatPcs + 1, ladSp), unit: "เส้น" });
      if (plate) it.push({ name: 'แผ่นเพลท 4"x4"', qty: sp(plate + 2, ladSp), unit: "แผ่น" });
      if (anchor) it.push({ name: 'พุ๊กเหล็ก 3/8"', qty: sp(anchor + 5, ladSp), unit: "ตัว" });
      (st.ladderExtra || []).filter((x) => (x.name || "").trim() && +x.qty > 0).forEach((x) => it.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
      if (it.length) out.push({ group: "LADDER (บันไดลิง)", items: it });
    }

    // WALKWAY — ต่อแนว: ความยาว len (m). แผ่นยาว 2.44m, RAIL 4.2m
    const wlk = (st.walkway || []).filter((r) => (+r.len || 0) > 0);
    if (wlk.length) {
      let dT = 0, fT = 0, hT = 0, mT = 0;
      wlk.forEach((r) => {
        const D = Math.ceil((+r.len) / 2.44);
        const E = D - 1, F = (E >= 1 ? E : 0) * 2;
        const H = D * 6;                                        // End Clamp 6/แผ่น
        const M = Math.ceil((D * (3 * 1.5)) / 4.2);             // RAIL (3 จุด × 1.5m ÷ 4.2m)
        dT += D; fT += F; hT += H; mT += M;
      });
      const thk = +(st.walkwayThk) || 35;                               // ความหนา walkway → ขนาด END CLAMP KIT
      const it = [];
      if (dT) it.push({ name: "WALKWAY", qty: dT, unit: "แผ่น" });
      if (fT) it.push({ name: "WALKWAY JOINER", qty: fT, unit: "ตัว" });
      if (hT) it.push({ name: END_CLAMP[thk] || ("END CLAMP KIT " + thk + "mm."), qty: sp(hT, wlkSp), unit: "ชุด" });
      if (mT) it.push({ name: "RAIL 4.2 M", qty: sp(mT, wlkSp), unit: "เส้น" });
      // ชื่อชุดยึด WALKWAY ตรงกับ L FEET ที่เลือกไว้ใน MOUNTING (เปลี่ยนตามประเภทหลังคา)
      if (hT) it.push({ name: roofHookModel, qty: sp(hT, wlkSp), unit: "SET" });
      (st.walkwayExtra || []).filter((x) => (x.name || "").trim() && +x.qty > 0).forEach((x) => it.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
      if (it.length) out.push({ group: "WALKWAY", items: it });
    }

    // GUARD RAIL — ต่อจุด: ความยาว layout len (m), จำนวนมุม corners
    const grl = (st.guardrail || []).filter((p) => (+p.len || 0) > 0 || (+p.corners || 0) > 0);
    if (grl.length) {
      let angle = 0, sling = 0, turnb = 0, clip = 0, sleeve = 0;
      grl.forEach((p) => {
        const B = +p.len || 0, D = +p.corners || 0;
        angle += Math.ceil((B / 3) / 2);                        // เหล็กฉาก (support ทุก 3m, 1 ท่อน=2 support)
        sling += B > 0 ? B * 2 + 20 : 0;                        // สลิง = layout ×2 + เผื่อ 20m/จุด
        const L = D * 4; turnb += L; clip += L * 2; sleeve += L;
      });
      const it = [];
      if (angle) it.push({ name: "เหล็กฉาก 40x40 มม. หนา 4 มม.", qty: sp(angle + 1, grlSp), unit: "เส้น" });
      if (sling) it.push({ name: "สลิงสแตนเลส 6 มม.", qty: sp(sling + 10, grlSp), unit: "ม." });
      if (turnb) it.push({ name: "เกลียวเร่งสแตนเลส 8 มม.", qty: sp(turnb + 4, grlSp), unit: "ตัว" });
      if (clip) it.push({ name: "กิ๊บสลิงสแตนเลส 6 มม.", qty: sp(clip + 4, grlSp), unit: "ตัว" });
      if (sleeve) it.push({ name: "ปลอกอลูมิเนียม 6 มม.", qty: sp(sleeve + 4, grlSp), unit: "ตัว" });
      (st.guardrailExtra || []).filter((x) => (x.name || "").trim() && +x.qty > 0).forEach((x) => it.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
      if (it.length) out.push({ group: "GUARD RAIL", items: it });
    }

    return out;
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
    let invCount, invItems, combItems = null;
    if (selInv) {
      // จำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) — ถ้าไม่ได้ตั้ง MAX PV ใช้ kW ต่อตัวแทน
      const invSizeBase = selInv.maxPv > 0 ? selInv.maxPv : selInv.kw;
      invCount = invSizeBase > 0 ? Math.ceil(kw / invSizeBase) : 0;
      if (selInv.inputs > 0) {
        // ── Huawei (string/hybrid) ── INVERTER = ตัวหลัก/แบต/สำรอง · COMBINER BOX = ตู้+อุปกรณ์ป้องกัน
        const ph = selInv.phase === 3 ? 3 : 1;
        const strPer = Math.min(Math.max(Math.round(+b.strings || selInv.inputs), 1), selInv.inputs);
        const totalStr = invCount * strPer;
        // กลุ่ม INVERTER
        invItems = [];
        invItems.push({ name: selInv.model, qty: invCount, unit: "ตัว" });
        // ── ระดับระบบ: 1 ชุด/งาน (Smart Meter วัดที่จุดต่อกริด, Dongle 1 ตัว master ที่เหลือพ่วง RS485) ──
        invItems.push({ name: ph === 3 ? HW.meter3 : HW.meter1, qty: 1, unit: "ชุด" });
        // 2 รุ่นนี้มี dongle ในตัว (SUN2000-10K-LC0, SUN2000-5K-LB0) — ไม่ต้องถอด Smart Dongle เพิ่ม
        if (!/SUN2000-10K-LC0|SUN2000-5K-LB0/i.test(selInv.model)) invItems.push({ name: HW.dongle, qty: 1, unit: "ชุด" });
        if ((+b.batteryKwh || 0) > 0) {
          const s1 = Math.ceil((+b.batteryKwh || 0) / 7);   // แบต S1 ก้อนละ 7 kWh
          const c1 = Math.ceil(s1 / 3);                      // Power Module 1 ตัว/แสตก (สูงสุด 3 ก้อน)
          invItems.push({ name: HW.lunaC1, qty: c1, unit: "ตัว" });
          invItems.push({ name: HW.lunaS1, qty: s1, unit: "ก้อน" });
        }
        // ระบบสำรองไฟ 1 ชุด/งาน
        if (b.hwBackup === "smartguard") invItems.push({ name: ph === 3 ? HW.smartguard3 : HW.smartguard1, qty: 1, unit: "ตัว" });
        else if (b.hwBackup === "backupbox") invItems.push({ name: ph === 3 ? HW.backupbox3 : HW.backupbox1, qty: 1, unit: "ตัว" });
        if (b.hwOptimizer) invItems.push({ name: HW.optimizer, qty: panelCount, unit: "ตัว" });
        // กลุ่ม COMBINER BOX
        combItems = [];
        combItems.push({ name: HW.cabinet, qty: 1, unit: "ตู้" });
        combItems.push({ name: HW.dcFuseHolder, qty: totalStr * 2, unit: "ตัว" });
        combItems.push({ name: HW.dcFuse, qty: totalStr * 2, unit: "ตัว" });
        combItems.push({ name: HW.dcSpd, qty: totalStr, unit: "ตัว" });
        combItems.push({ name: HW.dcMcb, qty: totalStr, unit: "ตัว" });
        combItems.push({ name: HW.mc4, qty: totalStr, unit: "ชุด" });
        combItems.push({ name: ph === 3 ? HW.acSpd3 : HW.acSpd1, qty: invCount, unit: "ตัว" });
        combItems.push({ name: rcboName(selInv.outA, ph), qty: invCount, unit: "ตัว" });
        combItems.push({ name: HW.wireDuct, qty: 1, unit: "เส้น" });   // ในตู้ใบเดียว
        combItems.push({ name: HW.dinRail, qty: 1, unit: "เส้น" });    // ในตู้ใบเดียว
        combItems.push({ name: HW.stopper, qty: 10, unit: "ตัว" });    // 10/งาน (flat)
        combItems.push({ name: HW.groundBar, qty: 1, unit: "อัน" });
        // ตู้ไฟเพิ่ม (case by case)
        if (b.hwExtraPanel) {
          combItems.push({ name: ph === 3 ? HW.panel3 : HW.panel1, qty: 1, unit: "ตู้" });
          combItems.push({ name: ph === 3 ? HW.mcb3 : HW.mcb2, qty: 2, unit: "ตัว" });
          if (ph === 3) combItems.push({ name: HW.busbar, qty: 1, unit: "ชุด" });
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
      invItems = [{ name: micro.model, qty: invCount, unit: "LOT" }];
      // ตู้ Combiner: "ตู้ประกอบ" 3 เฟส → ถอดอุปกรณ์ในตู้รายชิ้น (กลุ่ม COMBINER BOX) · อื่นๆ → ตู้สำเร็จ M-Combiner
      if (b.comboType === "assembled") {
        const battKw = battCount > 0 ? (+((b.wireCalc || {}).battKw) || 0) : 0;
        // กระแสรวม: 3 เฟส = P/(√3·400) · 1 เฟส = P/230
        const div = phase === 3 ? (1.7320508 * 400) : 230;
        const iMicro = (kw * 1000) / div;                     // กระแสรวมไมโคร (A)
        const iBatt  = (battKw * 1000) / div;                 // กระแสรวมแบตเตอรี่ (A)
        combItems = atmoceAssembled(iMicro, iBatt, battCount > 0, phase);
      } else {
        invItems.push({ name: COMBINER[phase], qty: 1, unit: "SET" });
      }
      invItems.push({ name: CT[phase], qty: 1, unit: "SET" });
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
      if (isPvDcCable(t)) {   // สาย DC → ถอด 2 สี (แดง+ / ดำ−) เส้นละ len
        PV_DC_COLORS.forEach((col) => { const nm = pvCableColorName(t, col); cableAgg[nm] = (cableAgg[nm] || 0) + len; });
      } else {
        cableAgg[t] = (cableAgg[t] || 0) + len;
      }
    });

    const groups = [];
    // PV
    groups.push({ group: "PV MODULE", items: [
      { name: panel.model, qty: panelCount, unit: "PANEL" },
    ] });
    // INVERTER
    groups.push({ group: "INVERTER", items: invItems });
    // COMBINER BOX (เฉพาะระบบที่มีตู้ combiner เช่น Huawei)
    if (combItems && combItems.length) groups.push({ group: "COMBINER BOX", items: combItems });
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

    // งานเพิ่มเติม (Input) — LADDER / WALKWAY / GUARD RAIL (งานโครงการเท่านั้น ไม่นับงานบ้าน)
    if ((b.jobType || "") !== "home") calcStructures(b).forEach((g) => groups.push(g));

    // ── ตาข่ายกันนก (BIRD NET) — ถอดวัสดุให้อัตโนมัติเมื่อบ้านติดตาข่ายกันนก ──
    if (b.birdnet) {
      const rolls = Math.max(1, Math.ceil(panelCount / 24));   // ม้วนตาข่าย 8" x 30 ม. (ราว 1 ม้วน/งานบ้าน)
      const clips = Math.max(1, panelCount * 5);               // คลิปล็อค C ~5 ตัว/แผง (เช่น 10 แผง = 50 ตัว)
      groups.push({ group: "BIRD NET (ตาข่ายกันนก)", items: [
        { name: 'ตะแกรงกันนกใต้แผงโซล่าเซล กว้าง 8" ยาว 30 ม.', qty: rolls, unit: "ม้วน" },
        { name: "คลิปล็อคตัว C (short frame) ตามขนาดแผงโซล่า", qty: clips, unit: "ตัว" },
      ] });
    }

    // ACCESSORIES — ชุดมาตรฐาน (ถอดทุกงาน) + เทปพันสายไฟตามเฟส + ที่ผู้ใช้เพิ่มเอง
    const autoAcc = ACC_STD.concat(accTape(phase)).map((name) => ({ name, qty: 1, unit: "ชิ้น" }));
    const acc = autoAcc.concat(
      (b.accessories || []).filter((a) => (a.name || "").trim() && (+a.qty || 0) > 0)
        .map((a) => ({ name: a.name.trim(), qty: +a.qty || 0, unit: a.unit || "" }))
    );
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
    // ตู้ประกอบ ATMOCE: ตัวตู้ + อุปกรณ์คงที่ทั้ง 1 เฟส (2P) และ 3 เฟส (4P) — เบรกเกอร์ตามกระแสเป็นชื่อ dynamic ตั้งราคาในสต็อกได้
    add("COMBINER BOX", ATMOCE_ASM_ENCLOSURE.name, ATMOCE_ASM_ENCLOSURE.unit);
    [ATMOCE_ASM_POLE[1], ATMOCE_ASM_POLE[3]].forEach((c) => { add("COMBINER BOX", c.mcb25, "ตัว"); add("COMBINER BOX", c.spd, "ตัว"); add("COMBINER BOX", c.mcb10, "ตัว"); });
    ATMOCE_ASM_SHARED.forEach((x) => add("COMBINER BOX", x.name, x.unit));
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
    CABLE_TYPES.forEach((t) => {
      if (isPvDcCable(t)) PV_DC_COLORS.forEach((col) => add("CABLE", pvCableColorName(t, col), "M"));  // PV1-F → ขึ้นทะเบียน 2 สี (ไม่ใช้ตัว (DC) รวม)
      else add("CABLE", t, "M");
    });
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
    // งานโครงสร้าง (LADDER / WALKWAY / GUARD RAIL) — วัสดุเฉพาะที่ยังไม่อยู่ในหมวดอื่น
    // (END CLAMP / RAIL / L FEET ใช้ร่วมกับ MOUNTING แล้ว จึงไม่ซ้ำที่นี่)
    add("LADDER (บันไดลิง)", 'เหล็กกล่องดำ 2"x2"', "เส้น");
    add("LADDER (บันไดลิง)", 'เหล็กกลมดำ 1"', "เส้น");
    add("LADDER (บันไดลิง)", "เหล็กแบน 32 มม.", "เส้น");
    add("LADDER (บันไดลิง)", 'แผ่นเพลท 4"x4"', "แผ่น");
    add("LADDER (บันไดลิง)", 'พุ๊กเหล็ก 3/8"', "ตัว");
    add("WALKWAY", "WALKWAY", "แผ่น");
    add("WALKWAY", "WALKWAY JOINER", "ตัว");
    add("GUARD RAIL", "เหล็กฉาก 40x40 มม. หนา 4 มม.", "เส้น");
    add("GUARD RAIL", "สลิงสแตนเลส 6 มม.", "ม.");
    add("GUARD RAIL", "เกลียวเร่งสแตนเลส 8 มม.", "ตัว");
    add("GUARD RAIL", "กิ๊บสลิงสแตนเลส 6 มม.", "ตัว");
    add("GUARD RAIL", "ปลอกอลูมิเนียม 6 มม.", "ตัว");
    // ACCESSORIES มาตรฐาน + เทปพันสายไฟทุกสี (1 เฟส + 3 เฟส)
    ACC_STD.forEach((n) => add("ACCESSORIES", n, "ชิ้น"));
    [...new Set([...ACC_TAPE_1P, ...ACC_TAPE_3P])].forEach((c) => add("ACCESSORIES", "เทปพันสายไฟ " + c, "ชิ้น"));
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
        voc: +p.voc > 0 ? +p.voc : (+def.voc || 0),
        isc: +p.isc > 0 ? +p.isc : (+def.isc || 0),
        vmp: +p.vmp > 0 ? +p.vmp : (+def.vmp || 0),
        imp: +p.imp > 0 ? +p.imp : (+def.imp || 0),
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
      out.push({ model: String(p.model).trim(), type: type, kw: +p.kw || 0, phase: +p.phase || 0, inputs: +p.inputs || 0, maxPv: +p.maxPv || 0, outA: +p.outA || 0, mpptVmin: +p.mpptVmin || 0, mpptVmax: +p.mpptVmax || 0, maxVdc: +p.maxVdc || 0, maxInA: +p.maxInA || 0 });
    });
    INVERTERS.length = 0;
    out.forEach((x) => INVERTERS.push(x));
  }

  window.BOQ = { PANELS, MICRO, INVERTERS, ROOF_HOOKS, ROOF_OPTIONS, CABLE_TYPES, CABLE_GROUPS, cableCategory, MATERIAL_SUBGROUPS, materialSubGroup, CABLE_POINTS, DEFAULT_CABLES, STRING_CABLE_POINTS, MICRO_CABLE_NAMES, DEFAULT_STRING_CABLES, IMC_SIZES, UPVC_SIZES, PULLBOX_SIZES, CABLE_OD, HDPE_TABLE, IMC_CONDUIT, WIRE_SIZES, WIRE_METHODS, INS_CLASSES, AMP_GROUPS, AMP_NCOND, AMP_CORES, ampColKey, DEFAULT_AMPACITY, AMPACITY, setAmpacity, cableInsClass, cableCoreType, cableSizeNum, ampacityOf, pickWireSize, PV_WIRE_SIZES, PV_WIRE_AMP, PV_WIRE_MIN, pickPvWireSize, findPanel, findInverter, stringConfig, wireArea, calcWireWay, calcConduitSize, blankBOQ, calcBOQ, calcStructures, matKey, catalog, applyPrices, setPanels, setInverters };
})();
