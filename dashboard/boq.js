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

  /* ── ไมโครอินเวอร์เตอร์ ──
     perInverter = จำนวนแผงต่อ 1 ตัว · mppt = จำนวนช่อง MPPT อิสระต่อ 1 ตัว
     รุ่นในตลาด (Hoymiles HMS-2T, APsystems DS3) ให้ MPPT แยกอิสระ "ช่องละ 1 แผง"
     แม้จะเป็นรุ่น 2 แผงต่อตัว — แผงคู่กันจึงไม่ฉุดกันเอง (ต่างจากสตริงอินเวอร์เตอร์)
     สเปคไฟฟ้าใช้ชื่อฟิลด์ชุดเดียวกับสตริงอินเวอร์เตอร์ เพื่อให้ตรวจแรงดัน/กระแสด้วยโค้ดเดียวกันได้
       maxVdc = แรงดัน DC สูงสุดที่ทนได้ · mpptVmin/mpptVmax = ช่วงแรงดันที่ MPPT ทำงาน
       maxInA/maxIscA = กระแสทำงาน/ลัดวงจรสูงสุดต่อ 1 ช่อง · wpMin/wpMax = ช่วงกำลังแผงที่รองรับ
       acW = กำลัง AC ต่อเนื่องต่อตัว · acWPeak = กำลังสูงสุดชั่วขณะ · outA = กระแสออกสูงสุดต่อตัว
       perBranch = ต่อพ่วงได้กี่ตัวต่อ 1 วงจรย่อย AC · eff = ประสิทธิภาพแปลงไฟ (CEC) */
  /* ค่าที่ใส่ไว้ = เฉพาะที่เหมือนกันแทบทุกยี่ห้อของไมโครระดับแผง (maxVdc 60V · MPPT 16–60V)
     ส่วนพิกัดกระแส/ช่วงกำลังแผง/จำนวนตัวต่อวงจร ต้องกรอกจากดาต้าชีตของรุ่นที่ใช้จริง
     ปล่อยเป็น 0 ไว้ ระบบจะขึ้นว่า "ยังไม่ระบุ" แทนที่จะเตือนผิด ๆ จากค่าที่เดาเอา */
  const MICRO = [
    { ratio: "1:1", model: "ATMOCE Micro-inverter 500Watt 1:1", perInverter: 1, mppt: 1,
      maxVdc: 60, mpptVmin: 16, mpptVmax: 60, maxInA: 0, maxIscA: 0, wpMin: 0, wpMax: 0,
      acW: 500, acWPeak: 500, acV: 230, outA: 0, perBranch: 0, eff: 96.5 },
    { ratio: "2:1", model: "ATMOCE Micro-inverter 1250Watt 2:1", perInverter: 2, mppt: 2,
      maxVdc: 60, mpptVmin: 16, mpptVmax: 60, maxInA: 0, maxIscA: 0, wpMin: 0, wpMax: 0,
      acW: 1250, acWPeak: 1250, acV: 230, outA: 0, perBranch: 0, eff: 96.5 },
  ];
  // อินเวอร์เตอร์ String/Hybrid (ตั้งสเปคจากคลัง) — setInverters() จะ rebuild อาเรย์นี้
  const INVERTERS = [];

  // ── ชื่อรุ่นอุปกรณ์ Huawei (ต้องตรงกับชื่อในคลังสินค้า เพื่อจับคู่ราคา) ──
  const HW = {
    meter1: "Smart Meter DDSU666-H + CT 100A/40mA (1 เฟส)",
    meter3: "Smart Meter DTSU666-H + CT 100A/40mA (3 เฟส)",
    dongle: "Smart Dongle-WLAN-FE",
    logger: "HUAWEI SMART LOGGER 3000A-GL",
    cabinet: "AC/DC Combiner Box ตู้หน้ากระจก เบอร์4",
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
  const ATMOCE_ASM_ENCLOSURE = { name: "ตู้ AC/DC Combiner Box ตู้หน้ากระจก เบอร์4", qty: 1, unit: "ใบ" };
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
    out.push(ATMOCE_ASM_ENCLOSURE);                                                                                         // ตัวตู้หน้ากระจก เบอร์4
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

  /* ── ปริมาณสาย DC ──
     ช่อง "ความยาว" ของสาย DC กรอกเป็น "ระยะเส้นที่ไกลที่สุด" (สตริงที่อยู่ไกลอินเวอร์เตอร์สุด)
     ไม่ใช่ระยะรวมทั้งงาน เพราะระยะไกลสุดคือตัวที่ใช้เช็กแรงดันตกอยู่แล้ว กรอกที่เดียวได้ทั้งสองอย่าง
     ปริมาณของ = ระยะไกลสุด × จำนวนสตริง × เผื่อ 1.2 → ได้ระยะต่อ 1 ขั้ว
     แล้วถอดเป็น 2 สี แดง(+) กับ ดำ(−) เท่ากันทั้งคู่ (ไป-กลับของแต่ละสตริง) */
  const PV_DC_SPARE = 1.2;
  function pvDcLength(farthest, strings) {
    const L = Math.max(0, +farthest || 0);
    const n = Math.max(1, Math.round(+strings || 1));
    const perPole = Math.round(L * n * PV_DC_SPARE * 100) / 100;
    return { farthest: L, strings: n, spare: PV_DC_SPARE, perPole: perPole, total: Math.round(perPole * 2 * 100) / 100 };
  }

  // ── พิกัดกระแสสายไฟ (อ้างอิงมาตรฐาน วสท. — ตัวนำทองแดง แรงดัน 0.6/1 kV) ──
  // โครงสร้าง: [ฉนวน][วิธีเดินสาย][คอลัมน์ "กลุ่ม|จำนวนตัวนำมีกระแส|แกน"][ขนาด sq.mm] = กระแส (A)
  //   · ฉนวน: pvc (PVC 70°C: THW/VCT) · xlpe (XLPE 90°C: CV) — อ่านจากชื่อสาย
  //   · แกน: single (1C) / multi (2C ขึ้นไป) — อ่านจากชื่อสายอัตโนมัติ
  //   · กลุ่ม + จำนวนตัวนำมีกระแส (2/3) — ผู้ใช้เลือกเองต่อสายในหน้า BOQ
  // ปัจจุบันมีตารางจริง: PVC · เดินในท่อร้อยสายในอากาศ (วสท.) — ฉนวน/วิธีอื่นรอเติมตารางในหน้าคลัง
  const WIRE_SIZES = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500];
  /* วิธีเดินสาย — วิธีที่ยังไม่มีตารางพิกัดของตัวเอง จะยืมตารางของวิธีที่ "สภาพระบายความร้อนเท่ากัน" (base)
     · รางเคเบิลเปิดฝา (ด้านล่างทึบ/ระบายอากาศ/บันได) = ระบายความร้อนคนละแบบ → ตารางแยกกันทุกแบบ ต้องกรอกเองที่หน้าคลัง
     ทุกวิธีให้ใส่ "ตัวคูณลดกระแส" เพิ่มได้เมื่อมีหลายวงจรอยู่ในช่องเดียวกัน */
  /* รายการวิธีเดินสายไล่ตามที่ วสท. แยกตารางไว้จริง
     · groups = กลุ่มการติดตั้งที่ใช้กับวิธีนี้ได้ (ตัวแรก = ค่าตั้งต้นเวลาสลับวิธี)
       ท่อร้อยสายวิธีเดียวใช้ได้ 3 กลุ่ม เพราะ วสท. แยกที่ "ท่อไปวางตรงไหน" ไม่ใช่ที่ตัวท่อ
     · base = วิธีที่ วสท. ให้ใช้ตารางร่วมกัน (ไม่ใช่การเดามั่ว — baseWhy บอกเหตุผลให้ผู้ใช้อ่าน) */
  const WIRE_METHODS = [
    // ── ในช่องเดินสาย (กลุ่มที่ 1, 2, 5 — ต่างกันที่ "ท่อไปวางตรงไหน" ไม่ใช่ตัวท่อ) ──
    { key: "conduitAir", th: "เดินในท่อโลหะหรืออโลหะ", short: "ในท่อ", art: "g2", group: "g2", groups: ["g2", "g1", "g5"],
      sub: "ในฝ้าเพดานที่เป็นฉนวนความร้อน/ผนังกันไฟ · เกาะผนังหรือฝังในผนังคอนกรีต · ฝังดิน (กลุ่มที่ 1, 2, 5)" },
    // ── เดินลอย / เกาะโครงสร้าง ──
    { key: "surface", th: "เดินเกาะผนังหรือเพดานโดยตรง", short: "เกาะผนัง", art: "g3", group: "g3", groups: ["g3"],
      sub: "ไม่มีสิ่งปิดหุ้ม (กลุ่มที่ 3)" },
    { key: "insulator", th: "เดินบนฉนวนลูกถ้วยในอากาศ", short: "บนลูกถ้วย", art: "g4", group: "g4", groups: ["g4"],
      sub: "ใช้สายแกนเดียว แยกตารางตามการวางแนวตั้ง/แนวราบ (กลุ่มที่ 4)" },
    { key: "buried", th: "เดินฝังดินโดยตรง", short: "ฝังดิน", art: "g6", group: "g6", groups: ["g6"],
      sub: "ต้องเป็นสายที่ฝังดินได้ เช่น NYY · ไม่เกิน 3 ตัวนำ (กลุ่มที่ 6)" },
    /* ── รางเคเบิล (กลุ่มที่ 7) ──
       เปิดฝา: ด้านล่างทึบ / ระบายอากาศ / บันได แยกตารางกันคนละชุด (ระบายความร้อนไม่เท่ากัน)
       ปิดฝา: ทั้งสามแบบคิดเหมือนกันหมด รวมถึงรางเดินสายปิดมีฝา (Wireway) จึงเหลือตัวเลือกเดียว */
    { key: "traySolid", th: "เดินรางเคเบิลแบบด้านล่างทึบ — เปิดฝา", short: "รางพื้นทึบ", art: "traySolid", group: "g7", groups: ["g7"],
      sub: "กลุ่มที่ 7 · พื้นรางเป็นแผ่นทึบ ลมออกได้ทางด้านบนอย่างเดียว" },
    { key: "trayPerf", th: "เดินรางเคเบิลแบบระบายอากาศ — เปิดฝา", short: "รางระบายอากาศ", art: "trayVent", group: "g7", groups: ["g7"],
      sub: "กลุ่มที่ 7 · พื้นรางเจาะรู ลมผ่านได้ทั้งด้านบนและใต้ราง" },
    { key: "ladder", th: "เดินรางเคเบิลแบบบันได — เปิดฝา", short: "รางบันได", art: "ladder", group: "g7", groups: ["g7"],
      sub: "กลุ่มที่ 7 · พื้นเป็นขั้นบันได โปร่งที่สุดในบรรดาราง" },
    { key: "trayCover", th: "เดินรางเคเบิลแบบปิดฝา", short: "รางปิดฝา", art: "trayCover", group: "g7", groups: ["g7"],
      sub: "กลุ่มที่ 7 · ด้านล่างทึบ / ระบายอากาศ / บันได รวมถึงรางเดินสายปิดมีฝา (Wireway) ปิดฝาแล้วใช้ตารางเดียวกันหมด" },
  ];
  /* วิธีที่เลิกใช้แล้ว — งานเก่าที่บันทึกค่าไว้ต้องเด้งไปวิธีที่ใช้แทน ไม่ใช่ปล่อยให้ช่องว่าง
     wireway = รางเดินสายปิดมีฝา ซึ่งก็คือ "รางเคเบิลแบบปิดฝา" นั่นเอง */
  const WIRE_METHOD_LEGACY = { wireway: { method: "trayCover", group: "g7" } };
  function normWireMethod(method, group) {
    const L = WIRE_METHOD_LEGACY[method];
    return L ? { method: L.method, group: L.group || group } : { method: method, group: group };
  }
  const WIRE_METHOD_BASE = {};
  WIRE_METHODS.forEach((m) => { if (m.base) WIRE_METHOD_BASE[m.key] = m.base; });
  // ตารางพิกัดที่ใช้จริงของวิธีนั้น — ไม่มีของตัวเองก็ยืมของ base · ไม่มีทั้งคู่ = {}
  function ampTableFor(insClass, method, col) {
    const ins = AMPACITY[insClass || "pvc"] || {};
    const own = (ins[method || "conduitAir"] || {})[col];
    if (own && Object.keys(own).length) return { tbl: own, borrowed: false };
    const base = WIRE_METHOD_BASE[method];
    const bt = base ? (ins[base] || {})[col] : null;
    if (bt && Object.keys(bt).length) return { tbl: bt, borrowed: true, from: base };
    return { tbl: {}, borrowed: false };
  }
  const INS_CLASSES = [
    { key: "pvc",  th: "PVC 70°C (THW/VCT)" },
    { key: "xlpe", th: "XLPE 90°C (CV)" },
  ];
  /* กลุ่มการติดตั้ง (วสท. 022001-22 แบ่งไว้ 7 กลุ่ม ตามลักษณะการเดินสาย)
     ยิ่งระบายความร้อนได้ดี พิกัดกระแสยิ่งสูง — ฝังในฉนวนความร้อน (กลุ่ม 1) แย่สุด · รางบันไดในอากาศ (กลุ่ม 7) ดีสุด
     ตอนนี้มีตารางจริงเฉพาะกลุ่ม 1–2 (ตารางที่ 5-20) · กลุ่มอื่นกรอกเพิ่มได้ที่หน้าคลัง › พิกัดกระแสสายไฟ
     `art` = รหัสรูปประกอบใน WireArt (boq.jsx) — ให้เห็นภาพว่าแต่ละกลุ่มหน้าตาเป็นยังไง */
  /* cores = แกนย่อยที่ "กลุ่มนั้น" แยกตารางไว้จริง — ไม่ใช่ทุกกลุ่มจะแยกเหมือนกัน
       single/multi = แยกสายแกนเดียวกับสายหลายแกน (กลุ่ม 1,2,3,7)
       vert/horiz   = กลุ่ม 4 ใช้สายแกนเดียวอย่างเดียว แต่แยกที่ "วางแนวตั้ง / แนวราบ" แทน
       any          = กลุ่ม 5,6 เอาแกนเดียวกับหลายแกนมารวมเป็นคอลัมน์เดียว แยกแค่จำนวนตัวนำ */
  const AMP_GROUPS = [
    { key: "g1", th: "กลุ่มที่ 1", art: "g1", sub: "ในช่องเดินสาย · ฝังในฉนวนความร้อน", cores: ["single", "multi"],
      desc: "สายเดินในท่อโลหะหรืออโลหะ ที่อยู่ในฝ้าเพดานซึ่งเป็นฉนวนความร้อน หรือผนังกันไฟ — ระบายความร้อนแย่ที่สุด" },
    { key: "g2", th: "กลุ่มที่ 2", art: "g2", sub: "ในช่องเดินสาย · เกาะผนัง/ในอากาศ", cores: ["single", "multi"],
      desc: "สายเดินในท่อโลหะหรืออโลหะ ที่เกาะผนัง เดินลอยในอากาศ หรือฝังในผนังคอนกรีต" },
    { key: "g3", th: "กลุ่มที่ 3", art: "g3", sub: "เกาะผนัง/เพดานโดยตรง", cores: ["single", "multi"],
      desc: "สายเดินเกาะผนังหรือเพดานโดยตรง ไม่มีสิ่งปิดหุ้ม" },
    { key: "g4", th: "กลุ่มที่ 4", art: "g4", sub: "บนลูกถ้วยในอากาศ", cores: ["vert", "horiz"],
      desc: "สายเดินบนฉนวนลูกถ้วยในอากาศ — ใช้สายแกนเดียวเท่านั้น แยกตารางตามการวางแนวตั้งกับแนวราบ" },
    { key: "g5", th: "กลุ่มที่ 5", art: "g5", sub: "ในท่อฝังดิน", cores: ["any"],
      desc: "สายเดินในท่อโลหะหรืออโลหะที่ฝังดิน — แกนเดียวกับหลายแกนใช้ตารางร่วมกัน แยกแค่จำนวนตัวนำ" },
    { key: "g6", th: "กลุ่มที่ 6", art: "g6", sub: "ฝังดินโดยตรง", cores: ["any"],
      desc: "สายฝังดินโดยตรง — แกนเดียวกับหลายแกนใช้ตารางร่วมกัน และไม่เกิน 3 ตัวนำ (ต้องเป็นสายชนิดที่ฝังดินได้ เช่น NYY)" },
    { key: "g7", th: "กลุ่มที่ 7", art: "g7", sub: "บนรางเคเบิล", cores: ["single", "multi"],
      desc: "สายวางบนรางเคเบิล — เปิดฝา: พื้นทึบ · ระบายอากาศ · บันได แยกตารางกันคนละชุด · ปิดฝา: ทั้งสามแบบใช้ตารางเดียวกัน" },
  ];
  const AMP_NCOND = [
    { key: "2", th: "2 ตัวนำ" },
    { key: "3", th: "3 ตัวนำ" },
  ];
  const AMP_CORE_LABEL = {
    single: "แกนเดียว", multi: "หลายแกน", any: "แกนเดียว/หลายแกน",
    vert: "แกนเดียว · แนวตั้ง", horiz: "แกนเดียว · แนวราบ",
  };
  const AMP_CORES = [
    { key: "single", th: AMP_CORE_LABEL.single },
    { key: "multi",  th: AMP_CORE_LABEL.multi },
  ];
  const ampGroupMeta = (group) => AMP_GROUPS.find((g) => g.key === group) || {};
  // แกนย่อยที่กลุ่มนี้มีจริง — ใช้ทั้งตอนสร้างคอลัมน์ตารางในคลัง และตอนให้เลือกในหน้า BOQ
  function ampCoresFor(group) {
    const ks = ampGroupMeta(group).cores || ["single", "multi"];
    return ks.map((k) => ({ key: k, th: AMP_CORE_LABEL[k] || k }));
  }
  /* แปลงแกนที่ "อ่านได้จากชื่อสาย" (single/multi) ให้ตรงกับแกนที่กลุ่มนั้นมีจริง
     · กลุ่มที่รวมแกนเดียว/หลายแกน → any
     · กลุ่มที่แยกแนวตั้ง/แนวราบ → ใช้ค่าที่ผู้ใช้เลือก (pick) ถ้าไม่ได้เลือกก็ตัวแรก */
  function ampCoreKey(group, core, pick) {
    const ks = ampGroupMeta(group).cores || ["single", "multi"];
    if (ks.indexOf(core) >= 0) return core;
    if (ks.indexOf("any") >= 0) return "any";
    if (pick && ks.indexOf(pick) >= 0) return pick;
    return ks[0];
  }
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
    const grp = opts.group || "g1";
    // แกน: ใช้ค่าที่ผู้เรียกระบุมาก่อน (ผู้ใช้เลือกเองในหน้า BOQ) ไม่ได้ระบุจึงอ่านจากชื่อสาย
    const want = opts.core || opts.orient || cableCoreType(type);
    const col = ampColKey(grp, String(opts.ncond || 2), ampCoreKey(grp, want, want));
    const tbl = ampTableFor(cableInsClass(type), opts.method, col).tbl;
    const base = tbl[sz];
    if (base == null) return null;
    // ตัวคูณลดกระแส (หลายวงจรในช่องเดียวกัน) — 1 = ไม่ลด
    const d = +opts.derate > 0 ? +opts.derate : 1;
    return Math.round(base * d * 10) / 10;
  }
  // เลือกขนาดสายเล็กสุดที่รับกระแส "ที่ต้องการ" ได้ (ผู้เรียกคูณ 1.25 มาก่อนแล้ว) — opts = { method, group, ncond, core }
  function pickWireSize(needAmp, insClass, opts) {
    opts = opts || {};
    const grp = opts.group || "g1";
    const col = ampColKey(grp, String(opts.ncond || 2), ampCoreKey(grp, opts.core || "single", opts.orient));
    const tbl = ampTableFor(insClass, opts.method, col).tbl;
    /* ตัวคูณลดกระแส = สายในช่องเดียวกันหลายวงจรจะระบายความร้อนได้แย่ลง
       พิกัดที่ใช้ได้จริง = พิกัดตาราง × ตัวคูณ · จึงเทียบกับกระแสที่ต้องการโดยตรง */
    const d = +opts.derate > 0 ? +opts.derate : 1;
    for (let i = 0; i < WIRE_SIZES.length; i++) { const sz = WIRE_SIZES[i]; if ((tbl[sz] || 0) * d >= needAmp) return sz + " mm²"; }
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
  // ── แรงดันตกในสาย (voltage drop) ──
  // ΔV = k × L × I × ρ ÷ A   ·  k = 2 สำหรับ DC/1 เฟส (ไป-กลับ 2 เส้น) · k = √3 สำหรับ 3 เฟส
  // ρ = ความต้านทานจำเพาะทองแดง "ที่อุณหภูมิใช้งาน" ไม่ใช่ที่ 20°C (0.0172) เพราะสายร้อนแล้วต้านทานสูงขึ้น
  //     PVC 70°C ≈ 0.0206 · XLPE/PV1-F 90°C ≈ 0.0219 Ω·mm²/m (α ทองแดง 0.00393/°C)
  // เกณฑ์ออกแบบ: ฝั่ง DC ≤ 2% · ฝั่ง AC ≤ 3% · รวมทั้งเส้นทางไม่เกิน 5%
  const VD_RHO = { pvc: 0.0206, xlpe: 0.0219 };
  const VD_LIMIT = { dc: 2, ac: 3, total: 5 };
  function calcVdrop(o) {
    o = o || {};
    const L = +o.length || 0, I = +o.amp || 0, A = +o.size || 0, V = +o.volts || 0;
    if (!(L > 0 && I > 0 && A > 0 && V > 0)) return null;
    const rho = VD_RHO[o.ins === "xlpe" ? "xlpe" : "pvc"];
    const k = +o.phase === 3 ? Math.sqrt(3) : 2;
    const dv = k * L * I * rho / A;
    const pct = dv / V * 100;
    const lim = +o.limit || (o.dc ? VD_LIMIT.dc : VD_LIMIT.ac);
    // ขนาดเล็กสุดที่แรงดันตกยังอยู่ในเกณฑ์ (ไว้บอกว่าต้องขยับไปเบอร์ไหน)
    const need = k * L * I * rho / (lim / 100 * V);
    const pool = o.dc ? PV_WIRE_SIZES : WIRE_SIZES;
    let minSize = null;
    for (let i = 0; i < pool.length; i++) { if (pool[i] >= need && (!o.dc || pool[i] >= PV_WIRE_MIN)) { minSize = pool[i]; break; } }
    return { dv: Math.round(dv * 100) / 100, pct: Math.round(pct * 100) / 100, lim,
      ok: pct <= lim, size: A, need: Math.round(need * 100) / 100, minSize, volts: V, amp: I, length: L,
      phase: +o.phase === 3 ? 3 : 1 };
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

  /* ── แผนสตริง ── ตอบคำถาม "ลงสตริงละ N แผง แล้วจะได้กี่สตริง"
     แผงทั้งงาน ÷ แผงต่ออนุกรม = จำนวนสตริง (ปัดขึ้น) · เศษที่เหลือกลายเป็นสตริงสุดท้ายที่แผงไม่เต็ม
     ช่องรับสตริงของอินเวอร์เตอร์ = จำนวน MPPT × สตริงต่อ MPPT (ค่าปริยาย 1 ถ้ายังไม่กรอกในคลัง)
     สตริงที่แผงไม่เต็มแรงดันจะต่ำกว่าเพื่อน — เตือนไว้เพราะกำลังจะหายไปบางส่วน */
  function stringPlan(panelCount, series, inv, invCount) {
    inv = inv || {};
    const n = Math.max(0, Math.round(+panelCount || 0));
    const s = Math.max(1, Math.round(+series || 0));
    const nInv = Math.max(1, Math.round(+invCount || 1));
    const full = Math.floor(n / s);
    const rest = n - full * s;
    const strings = full + (rest > 0 ? 1 : 0);
    const perMppt = Math.max(1, Math.round(+inv.strPerMppt || 1));
    const mppt = Math.max(0, Math.round(+inv.inputs || 0));
    const capPerInv = mppt * perMppt;
    const cap = capPerInv * nInv;
    return {
      series: s, panels: n, strings, full, rest, invCount: nInv,
      perInv: Math.ceil(strings / nInv), perMppt, mppt, capPerInv, cap,
      over: cap > 0 && strings > cap,          // สตริงมากกว่าช่องรับ → ต้องเพิ่มอินเวอร์เตอร์หรือเพิ่มแผงต่อสตริง
      spare: cap > 0 ? cap - strings : 0,      // ช่องที่ยังว่าง
      uneven: rest > 0,                        // มีสตริงที่แผงไม่เต็ม
    };
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

  /* ── รางไฟ (WIREWAY / CABLE TRAY) ──
     Wireway = รางเหล็กพับมีฝาปิด ยาว 2.40 ม./ท่อน — ใช้เดินสายในอาคาร/ข้างตู้
     Cable Tray บันได = ยาว 3.00 ม./ท่อน — ใช้เดินสายจำนวนมากระยะไกล
     ถอดของ: ตัวราง + ชุดข้อต่อทุกรอยต่อ + ขาแขวนทุก 1.5 ม. + พุกยึด 4 ตัว/ขา */
  const WAY_PIPE_LEN = 2.4, TRAY_PIPE_LEN = 3.0, WAY_HANGER_STEP = 1.5;
  const WAY_SIZES = [
    "Wireway 50x50 mm.", "Wireway 100x50 mm.", "Wireway 100x100 mm.",
    "Wireway 150x100 mm.", "Wireway 200x100 mm.", "Wireway 200x200 mm.", "Wireway 300x100 mm.",
  ];
  const TRAY_SIZES = [
    "Cable Tray บันได 150x50 mm.", "Cable Tray บันได 200x50 mm.", "Cable Tray บันได 300x100 mm.",
    "Cable Tray บันได 450x100 mm.", "Cable Tray บันได 600x100 mm.",
  ];
  const traySuffix = (nm) => String(nm).replace(/^(Wireway|Cable Tray บันได)\s*/i, "").trim();
  /* ถอดวัสดุรางไฟ 1 ขนาด — คืน array ของ item · pct = % เผื่อของอุปกรณ์ประกอบ */
  function wayItems(name, lenM, pct, isTray) {
    const len = +lenM || 0;
    if (len <= 0) return [];
    const sz = traySuffix(name);
    const kind = isTray ? "Cable Tray" : "Wireway";
    const up = (v) => Math.ceil(v * (1 + (+pct || 0) / 100));
    const pipeLen = isTray ? TRAY_PIPE_LEN : WAY_PIPE_LEN;
    const pcs = Math.ceil(len / pipeLen);
    const joint = Math.max(0, pcs - 1) + 2;                       // ทุกรอยต่อ + เผื่อหัวท้าย
    const hanger = Math.ceil(len / WAY_HANGER_STEP);              // ขาแขวนทุก 1.5 ม.
    const out = [
      { name: name + " (" + pipeLen.toFixed(1) + "m/ท่อน)", qty: pcs, unit: "ท่อน" },
      { name: "ชุดข้อต่อราง " + kind + " " + sz, qty: up(joint), unit: "ชุด" },
      { name: 'พุ๊กเหล็ก 3/8"', qty: up(hanger * 4), unit: "ตัว" },
    ];
    // รางบันไดแขวนด้วยขาแขวนสำเร็จ · Wireway ยึดพุ๊กเข้าโครงตรง ๆ ไม่ต้องมีขาแขวน
    if (isTray) out.splice(2, 0, { name: "ขาแขวนราง " + kind + " " + sz, qty: up(hanger), unit: "ชุด" });
    if (!isTray) out.push({ name: "สกรู+น็อต M6 ประกอบราง", qty: up(pcs * 8), unit: "ชุด" });
    return out;
  }

  /* ── ตรวจสายในราง ──
     Wireway (รางปิดมีฝา): พื้นที่หน้าตัดสายรวม ≤ 20% ของพื้นที่ราง — สายเบียดกันแล้วระบายความร้อนไม่ออก
     Cable Tray (รางบันได): ≤ 50% ของพื้นที่ราง และควรวางชั้นเดียว คือผลรวมเส้นผ่านศูนย์กลาง ≤ ความกว้างราง
     ตัวคูณลดกระแส: ยิ่งมีตัวนำนำกระแสในรางเดียวกันมาก แต่ละเส้นยิ่งรับกระแสได้น้อยลง
     (ตารางตัวคูณตามจำนวนตัวนำ — แก้ตัวเลขได้ที่นี่ถ้าใช้เกณฑ์ของโครงการอื่น) */
  const TRAY_FILL_LIMIT = { way: 20, tray: 50 };
  const TRAY_DERATE = [
    { max: 3, f: 1.00 }, { max: 6, f: 0.80 }, { max: 9, f: 0.70 }, { max: 20, f: 0.50 },
    { max: 30, f: 0.45 }, { max: 40, f: 0.40 }, { max: Infinity, f: 0.35 },
  ];
  function trayDerate(n) {
    const k = Math.max(0, Math.round(+n || 0));
    for (let i = 0; i < TRAY_DERATE.length; i++) if (k <= TRAY_DERATE[i].max) return TRAY_DERATE[i].f;
    return TRAY_DERATE[TRAY_DERATE.length - 1].f;
  }
  // ขนาดรางจากชื่อ เช่น "Wireway 150x100 mm." → กว้าง 150 สูง 100 (mm)
  function trayDim(name) {
    const m = /(\d+)\s*[xX×]\s*(\d+)/.exec(String(name || ""));
    if (!m) return { w: 0, h: 0, area: 0 };
    const w = +m[1], h = +m[2];
    return { w: w, h: h, area: w * h };
  }
  // จำนวนตัวนำนำกระแสของสาย 1 เส้น จากชื่อ เช่น "CV FD 4C" → 4 · "CV FD 1C" → 1
  function cableCores(type) { const m = /(\d+)\s*C\b/i.exec(String(type || "")); return m ? +m[1] : 1; }
  /* ตรวจ 1 ราง — cables = [{type, size, qty}] (รูปแบบเดียวกับตารางตรวจ WIRE WAY เดิม) */
  function trayCheck(name, cables, isTray, sizePool) {
    const dim = trayDim(name);
    let area = 0, odSum = 0, cores = 0;
    const unknown = [];
    (cables || []).forEach((c) => {
      const q = Math.max(0, Math.round(+c.qty || 0));
      if (!q) return;
      const od = (CABLE_OD[c.type] || {})[+c.size];
      if (!od) { if (c.type) unknown.push(c.type + " " + c.size + " sq.mm."); return; }
      area += Math.PI * (od / 2) * (od / 2) * q;
      odSum += od * q;
      cores += cableCores(c.type) * q;
    });
    const limit = isTray ? TRAY_FILL_LIMIT.tray : TRAY_FILL_LIMIT.way;
    const pct = dim.area > 0 ? (area / dim.area) * 100 : 0;
    const need = limit > 0 ? area / (limit / 100) : 0;      // พื้นที่รางขั้นต่ำที่ต้องมี (mm²)
    // ขนาดเล็กสุดในรายการที่ยังผ่านเกณฑ์ — ไว้บอกว่าต้องขยับไปเบอร์ไหน
    let suggest = null;
    (sizePool || []).forEach((nm) => {
      if (suggest) return;
      const d = trayDim(nm);
      // รางบันไดต้องกว้างพอวางชั้นเดียวด้วย ไม่ใช่ดูแค่พื้นที่
      if (d.area > 0 && d.area >= need && (!isTray || d.w >= odSum)) suggest = nm;
    });
    return {
      dim: dim, area: Math.round(area * 10) / 10, fillPct: Math.round(pct * 10) / 10, limit: limit,
      ok: dim.area > 0 && pct <= limit,
      odSum: Math.round(odSum * 10) / 10,
      widthOk: !isTray || dim.w === 0 || odSum <= dim.w,   // รางบันไดควรวางชั้นเดียว
      cores: cores, derate: trayDerate(cores),
      needArea: Math.round(need), suggest: suggest, unknown: unknown,
    };
  }

  /* รวมบรรทัดชื่อซ้ำเป็นบรรทัดเดียว — เช่น พุ๊กเหล็ก ที่ถอดมาจากรางหลายขนาด/หลายจุด */
  function mergeItems(rows) {
    const order = [], map = {};
    (rows || []).forEach((r) => {
      const k = r.name + "|" + (r.unit || "");
      if (map[k]) map[k].qty += +r.qty || 0;
      else { map[k] = { name: r.name, qty: +r.qty || 0, unit: r.unit || "" }; order.push(k); }
    });
    return order.map((k) => map[k]).filter((x) => x.qty > 0);
  }

  /* ── โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB) ──
     อินเวอร์เตอร์ตัวใหญ่และตู้ MDB ต้องมีโครงเหล็กหรือฉากยึด ไม่ได้แขวนกับผนังเปล่า ๆ
     "ตั้งพื้น" = ทำโครงเหล็กกล่องยืนพื้น · "ยึดผนัง" = ฉากรองรับยิงพุกเข้าผนัง */
  const SUPPORT_KINDS = {
    floor: {
      label: "โครงเหล็กตั้งพื้น",
      per: [
        { name: 'เหล็กกล่องดำ 2"x2"', qty: 2, unit: "เส้น" },
        { name: 'แผ่นเพลท 4"x4"', qty: 4, unit: "แผ่น" },
        { name: 'พุ๊กเหล็ก 3/8"', qty: 16, unit: "ตัว" },
      ],
    },
    wall: {
      label: "ฉากยึดผนัง",
      per: [
        { name: "เหล็กฉาก 40x40 มม. หนา 4 มม.", qty: 1, unit: "เส้น" },
        { name: 'แผ่นเพลท 4"x4"', qty: 2, unit: "แผ่น" },
        { name: 'พุ๊กเหล็ก 3/8"', qty: 8, unit: "ตัว" },
      ],
    },
  };
  // ของใช้ร่วมทั้งงาน — ถอดครั้งเดียวเมื่อมีงานโครงสร้างรองรับอย่างน้อย 1 จุด
  const SUPPORT_SHARED = [
    { name: "สีกันสนิม (แดง) 1/4 แกลลอน", qty: 1, unit: "กระป๋อง" },
    { name: "ลวดเชื่อมไฟฟ้า 2.6 มม.", qty: 1, unit: "กล่อง" },
    { name: 'ใบตัดเหล็ก 4"', qty: 3, unit: "ใบ" },
  ];

  /* ── ค่าแรงติดตั้ง ── แยกเป็นรายการงาน · ปริมาณดึงจากผลถอดวัสดุให้อัตโนมัติ (auto)
     ราคาเป็น 0 ทั้งหมดตอนเริ่ม — ต้องกรอกเรตของบริษัทเอง ระบบไม่เดาให้ */
  const LABOR_PRESET = [
    { name: "ค่าแรงติดตั้งแผงโซลาร์ + โครงราง", unit: "แผง", auto: "panels" },
    { name: "ค่าแรงติดตั้งอินเวอร์เตอร์", unit: "ตัว", auto: "inv" },
    { name: "ค่าแรงติดตั้งตู้ Combiner / MDB", unit: "ตู้", auto: "board" },
    { name: "ค่าแรงเดินสาย DC (PV1-F)", unit: "ม.", auto: "dcLen" },
    { name: "ค่าแรงเดินสาย AC", unit: "ม.", auto: "acLen" },
    { name: "ค่าแรงเดินท่อร้อยสาย / รางไฟ", unit: "ม.", auto: "wayLen" },
    { name: "ค่าแรงงานโครงสร้างบนหลังคา (บันได/ทางเดิน/ราวกันตก)", unit: "จุด", auto: "struct" },
    { name: "ค่าแรงงานระบบกราวด์", unit: "งาน", auto: "one" },
    { name: "ทดสอบระบบ & Commissioning", unit: "งาน", auto: "one" },
    { name: "ขนส่ง · เครน · นั่งร้าน", unit: "งาน", auto: "one" },
  ];
  /* ── ค่าขออนุญาต & เอกสาร ── ค่าธรรมเนียมจริงเปลี่ยนตามพื้นที่/ขนาดระบบ จึงเว้นราคาไว้ให้กรอก */
  const PERMIT_PRESET = [
    { name: "ค่าตรวจสอบระบบ — การไฟฟ้า (PEA/MEA)", unit: "งาน" },
    { name: "ค่าเปลี่ยนมิเตอร์ / มิเตอร์ TOU", unit: "ชุด" },
    { name: "ค่าเชื่อมต่อระบบขนานไฟฟ้า", unit: "งาน" },
    { name: "ค่าจดแจ้งยกเว้นใบอนุญาต (กกพ.)", unit: "งาน" },
    { name: "ใบอนุญาตผลิตไฟฟ้า (กกพ.)", unit: "ฉบับ" },
    { name: "ค่าวิศวกรไฟฟ้าเซ็นรับรองแบบ", unit: "งาน" },
    { name: "ค่าคำนวณโครงสร้างรองรับแผง", unit: "งาน" },
    { name: "ค่าวิศวกรโยธาเซ็นรับรองโครงสร้าง", unit: "งาน" },
    { name: "ค่าเขียนแบบ As-built", unit: "ชุด" },
    { name: "ค่าขออนุญาตดัดแปลงอาคาร (อ.1)", unit: "งาน" },
  ];
  /* ── ค่าขนส่ง & เครื่องจักร · ค่าบริหารจัดการหน้างาน ──
     งานโครงการต้องขนของขึ้นหลังคาด้วยเฮี้ยบ/เครน และทีมค้างที่หน้างานหลายวัน
     สองหมวดนี้ราคาอยู่ในบรรทัดเองเหมือนค่าแรง ไม่ใช่ของในคลัง */
  const TRANSPORT_PRESET = [
    { name: "รถบรรทุก / รถเฮี้ยบ", unit: "เที่ยว" },
    { name: "รถเครน", unit: "วัน" },
  ];
  const MANAGE_PRESET = [
    { name: "ค่าที่พักทีมติดตั้ง", unit: "คืน" },
    { name: "ค่าเดินทาง", unit: "เที่ยว" },
    { name: "ค่าดูแลระบบ O&M", unit: "ปี" },
  ];
  const G_TRAY = "รางไฟ (WIREWAY / TRAY)";
  const G_SUPPORT = "โครงสร้างรองรับอุปกรณ์";
  const G_LABOR = "ค่าแรงติดตั้ง";
  const G_PERMIT = "ค่าขออนุญาต & เอกสาร";
  const G_TRANSPORT = "ขนส่ง & เครื่องจักร";
  const G_MANAGE = "บริหารจัดการหน้างาน";
  const SERVICE_GROUPS = [G_LABOR, G_PERMIT, G_TRANSPORT, G_MANAGE];   // หมวดที่ราคาอยู่ในบรรทัดเอง ไม่ดึงจากคลัง

  /* ── หมวดของงานโครงการ ──
     งานโครงการมีของที่งานบ้านไม่มี: ตู้ไฟแยกฝั่ง (พร้อมอุปกรณ์ในตู้), ระบบสูบน้ำล้างแผง, ถังเก็บน้ำ, ท่อน้ำ
     ราคาดึงจากคลังเหมือนวัสดุอื่น · ทุกหมวดพิมพ์อุปกรณ์ประกอบเพิ่มเองได้ เพราะแล้วแต่หน้างาน */
  const G_BOARD = "ตู้ไฟ";
  const G_WATER = "ระบบสูบน้ำ (WATER SYSTEM)";
  const G_TANK = "ถังเก็บน้ำ (TANK)";
  const G_PIPE = "ท่อน้ำ (PIPE)";
  const PROJECT_KITS = [
    /* ตู้ไฟ — แยกเป็นตู้ ๆ อุปกรณ์ที่อยู่ในตู้ไหนก็กรอกใต้ตู้นั้น
       boards ใช้จัดหน้าจอ ส่วน items (แบนราบ) คือสิ่งที่ถอดของ/คลังสินค้าใช้ — สร้างให้อัตโนมัติด้านล่าง */
    { key: "board", group: G_BOARD, th: "ตู้ไฟ", icon: "box",
      hint: "แยกเป็นตู้ — กรอกจำนวนตู้ แล้วกรอกอุปกรณ์ที่อยู่ในตู้นั้น",
      boards: [
        { key: "ac", name: "ตู้ไฟ AC", unit: "ตู้", items: [] },
        { key: "dc", name: "ตู้ไฟ DC", unit: "ตู้", items: [] },
        { key: "logger", name: "ตู้ไฟ DATA LOGGER", unit: "ตู้", items: [
          { key: "janitza", name: "Janitza Power Meter", unit: "ตัว" },
          { key: "ct", name: "CT (หม้อแปลงกระแส)", unit: "ตัว" },
        ] },
      ] },
    { key: "water", group: G_WATER, th: "ระบบสูบน้ำ", icon: "power",
      hint: "ปั๊มน้ำสำหรับระบบล้างแผง — เลือกกำลังตามหน้างาน",
      items: [
        { key: "p300", name: "Pump 300W", unit: "ตัว" },
        { key: "p350", name: "Pump 350W", unit: "ตัว" },
        { key: "p400", name: "Pump 400W", unit: "ตัว" },
        { key: "p900", name: "Pump 900W", unit: "ตัว" },
        { key: "booster", name: "Booster Pump set (2 motor)", unit: "ชุด" },
      ] },
    { key: "tank", group: G_TANK, th: "ถังเก็บน้ำ", icon: "box",
      items: [
        { key: "t1000", name: "ถังเก็บน้ำ 1,000 ลิตร", unit: "ใบ" },
        { key: "t2000", name: "ถังเก็บน้ำ 2,000 ลิตร", unit: "ใบ" },
        { key: "t3000", name: "ถังเก็บน้ำ 3,000 ลิตร", unit: "ใบ" },
      ] },
    { key: "pipe", group: G_PIPE, th: "ท่อน้ำ", icon: "grid",
      hint: "ท่อ PPR — กรอกจำนวนเส้น (ข้อต่อ/วาล์ว ใส่ในอุปกรณ์ประกอบ)",
      items: [{ key: "ppr34", name: "ท่อ PPR 3/4\"", unit: "เส้น" }] },
  ];
  /* แปลง boards → items แบนราบ ให้ calcBOQ/catalog ใช้เหมือนหมวดอื่น
     ตัวตู้เองก็เป็นรายการหนึ่ง (key เดียวกับตู้) แล้วตามด้วยอุปกรณ์ในตู้นั้น */
  PROJECT_KITS.forEach((k) => {
    if (!k.boards) return;
    // อุปกรณ์ประกอบแยกของใครของมัน ตู้ AC ก็ของในตู้ AC ไม่ปนกับตู้อื่น
    k.boards.forEach((bd) => { bd.extraKey = "extra_" + bd.key; });
    k.items = k.boards.reduce((a, bd) => a
      .concat([{ key: bd.key, name: bd.name, unit: bd.unit, board: bd.key }])
      .concat((bd.items || []).map((it) => Object.assign({ board: bd.key }, it))), []);
  });
  // คีย์ที่เก็บ "อุปกรณ์ประกอบ" ของหมวดนั้น — หมวดที่แยกเป็นตู้จะมีคีย์ละตู้
  function kitExtraKeys(k) { return k.boards ? k.boards.map((bd) => bd.extraKey) : ["extra"]; }

  /* ย้ายข้อมูลของงานเก่ามาโครงสร้างใหม่ให้เอง ไม่ต้องกรอกซ้ำ
     · Janitza/CT เคยอยู่หมวด "อุปกรณ์มอนิเตอร์" (project.monitor) → เข้าตู้ DATA LOGGER
     · อุปกรณ์ประกอบเคยเป็นกองเดียวของทั้งหมวดตู้ไฟ (board.extra) → เข้าตู้แรก (ตู้ AC)
       ยอดในใบถอดของเท่าเดิม เพราะทุกตู้อยู่หมวด "ตู้ไฟ" เหมือนกัน ต่างแค่อยู่ใต้ตู้ไหน */
  function normProject(project) {
    const p = Object.assign({}, project || {});
    const board = PROJECT_KITS.find((k) => k.key === "board");
    const first = board.boards[0].extraKey;
    const loggerKey = (board.boards.find((x) => x.key === "logger") || board.boards[0]).extraKey;
    const m = p.monitor;
    if (!m && !(p.board && p.board.extra)) return p;
    const bd = Object.assign({}, p.board);
    if (m) {
      ["janitza", "ct"].forEach((key) => { if (bd[key] == null && m[key] != null) bd[key] = m[key]; });
      if ((m.extra || []).length) bd[loggerKey] = (bd[loggerKey] || []).concat(m.extra);
      delete p.monitor;
    }
    if ((bd.extra || []).length) bd[first] = (bd[first] || []).concat(bd.extra);
    delete bd.extra;
    p.board = bd;
    return p;
  }

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
    {sz:'1-1/2"',id:45.52},{sz:'2"',id:57.52},{sz:'2-1/2"',id:69},{sz:'3"',id:84.73},{sz:'3-1/2"',id:97.38},{sz:'4"',id:109.84},
  ];
  /* ท่อขาว uPVC (มอก. 216) — ขนาดที่เรียกคือ "ขนาดนอก" ต้องหักผนังท่อสองด้านถึงจะเป็นรูใน
     ค่าผนังเป็นค่าปกติของท่อร้อยสายสีขาว แก้ตัวเลขได้ที่นี่ถ้าใช้ท่อยี่ห้อที่ผนังหนาไม่เท่านี้ */
  const UPVC_CONDUIT = [
    {mm:16,id:12.4},{mm:20,id:16.4},{mm:25,id:21.4},{mm:32,id:28.0},{mm:40,id:35.4},{mm:55,id:49.0},
  ];
  /* ── ตรวจสายในท่อร้อยสาย ──
     เกณฑ์ % เติมเต็มของท่อ ไม่ใช่ค่าเดียว วสท./NEC ให้ตามจำนวนเส้นที่ร้อยในท่อเดียวกัน
     1 เส้น ≤ 53% · 2 เส้น ≤ 31% · ตั้งแต่ 3 เส้นขึ้นไป ≤ 40% */
  function conduitFillLimit(n) { const k = Math.max(0, Math.round(+n || 0)); return k === 1 ? 53 : k === 2 ? 31 : 40; }
  // รูในของท่อจากชื่อ เช่น 'IMC 2"' → 57.52 · "ท่อขาว uPVC 25mm. (สีขาว)" → 21.4
  function conduitDim(name) {
    const s = String(name || "");
    if (/IMC/i.test(s)) {
      const m = /IMC\s*([\d\-\/]+)"/.exec(s);
      const r = m ? IMC_CONDUIT.find(function (x) { return x.sz === m[1] + '"'; }) : null;
      return r ? { id: r.id, area: Math.PI * (r.id / 2) * (r.id / 2) } : { id: 0, area: 0 };
    }
    const m2 = /(\d+(?:\.\d+)?)\s*mm/i.exec(s);
    const r2 = m2 ? UPVC_CONDUIT.find(function (x) { return x.mm === +m2[1]; }) : null;
    return r2 ? { id: r2.id, area: Math.PI * (r2.id / 2) * (r2.id / 2) } : { id: 0, area: 0 };
  }
  /* ตรวจ 1 ท่อ — รูปแบบผลลัพธ์เดียวกับ trayCheck เพื่อให้หน้าจอใช้โค้ดชุดเดียวกันได้ */
  function conduitCheck(name, cables, sizePool) {
    const dim = conduitDim(name);
    let area = 0, cores = 0, runs = 0;
    const unknown = [];
    (cables || []).forEach(function (c) {
      const q = Math.max(0, Math.round(+c.qty || 0));
      if (!q) return;
      const od = (CABLE_OD[c.type] || {})[+c.size];
      if (!od) { if (c.type) unknown.push(c.type + " " + c.size + " sq.mm."); return; }
      area += Math.PI * (od / 2) * (od / 2) * q;
      cores += cableCores(c.type) * q;
      runs += q;
    });
    const limit = conduitFillLimit(runs);
    const pct = dim.area > 0 ? (area / dim.area) * 100 : 0;
    const need = area / (limit / 100);
    let suggest = null;
    (sizePool || []).forEach(function (nm) {
      if (suggest) return;
      const d = conduitDim(nm);
      if (d.area > 0 && d.area >= need) suggest = nm;
    });
    return {
      dim: { w: Math.round(dim.id * 10) / 10, h: 0, area: Math.round(dim.area) },
      area: Math.round(area * 10) / 10, fillPct: Math.round(pct * 10) / 10, limit: limit,
      ok: dim.area > 0 && pct <= limit,
      runs: runs, cores: cores, derate: trayDerate(cores),
      odSum: 0, widthOk: true,
      needArea: Math.round(need), suggest: suggest, unknown: unknown,
    };
  }
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
      invCount: 0,    // 0 = คิดให้อัตโนมัติจากกำลังแผง ÷ MAX PV ต่อตัว
      strings: 0,     // 0 = คิดให้อัตโนมัติจากแผนสตริง (แผงทั้งงาน ÷ แผงต่ออนุกรม)
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
      // รางไฟ — way = Wireway เหล็กมีฝา · tray = Cable Tray บันได · extra = ข้องอ/ข้อต่อพิเศษที่กรอกเอง
      tray: { way: [], tray: [], spare: 10, extra: [] },
      // โครงสร้างรองรับอุปกรณ์ — 0 = ไม่ถอด · kind: floor(โครงตั้งพื้น) / wall(ฉากยึดผนัง)
      support: { inv: 0, invKind: "floor", mdb: 0, mdbKind: "floor", spare: 10, extra: [] },
      // ค่าแรง / ค่าขออนุญาต — null = ยังไม่เคยตั้งค่า ใช้รายการตั้งต้น (ราคา 0 รอกรอก)
      labor: null,
      laborMode: "split",                         // split = แยกรายการงาน · lump = เหมารวม
      laborLump: { basis: "w", rate: 0, note: "" },   // basis: w(บาท/วัตต์ · ที่ใช้กันจริง) / job / kw / panel
      permit: null,
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
      // JOINER มาพร้อมแผ่น WALKWAY อยู่แล้ว จึงเป็นรายการเดียวกัน ไม่แยกบรรทัด
      if (dT) it.push({ name: "WALKWAY+JOINER", qty: dT, unit: "แผ่น" });
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
    let invAuto = 0, plan = null;
    // งานโครงการ vs งานบ้าน — ต่างกันที่อุปกรณ์มอนิเตอร์และตู้รวม (โครงการใช้ตู้ไฟ DC/AC ของตัวเอง)
    const isProject = (b.jobType || "") !== "home";
    if (selInv) {
      // จำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) — ถ้าไม่ได้ตั้ง MAX PV ใช้ kW ต่อตัวแทน
      // ระบุเองได้ที่ b.invCount (0/ว่าง = ใช้ค่าอัตโนมัติ) เช่นงานที่แบ่งอินเวอร์เตอร์ตามหลังคาคนละทิศ
      const invSizeBase = selInv.maxPv > 0 ? selInv.maxPv : selInv.kw;
      invAuto = invSizeBase > 0 ? Math.max(1, Math.ceil(kw / invSizeBase)) : 0;
      invCount = +b.invCount > 0 ? Math.max(1, Math.round(+b.invCount)) : invAuto;
      if (selInv.inputs > 0) {
        // ── Huawei (string/hybrid) ── INVERTER = ตัวหลัก/แบต/สำรอง · COMBINER BOX = ตู้+อุปกรณ์ป้องกัน
        const ph = selInv.phase === 3 ? 3 : 1;
        /* จำนวนสตริงรวม — เอาจากแผนสตริงจริง (แผงทั้งงาน ÷ แผงต่ออนุกรม) ไม่ใช่เดาจากจำนวนช่อง MPPT
           ของเดิมใช้ "ช่องต่อตัว × จำนวนตัว" ซึ่งได้ 4 สตริงสำหรับงาน 155 แผง — น้อยกว่าจริงมาก
           ระบุเองได้ที่ b.strings (สตริงต่อตัว · 0 = อัตโนมัติ) */
        const scIn = stringConfig(panel, selInv, { series: (b.dcSeries != null && b.dcSeries !== "") ? b.dcSeries : undefined });
        if (scIn.ready) plan = stringPlan(panelCount, scIn.series, selInv, invCount);
        const capPerInv = Math.max(1, (+selInv.inputs || 1) * Math.max(1, Math.round(+selInv.strPerMppt || 1)));
        const strPer = +b.strings > 0
          ? Math.min(Math.max(Math.round(+b.strings), 1), capPerInv)
          : (plan ? plan.perInv : selInv.inputs);
        const totalStr = +b.strings > 0 || !plan ? invCount * strPer : plan.strings;
        // กลุ่ม INVERTER
        invItems = [];
        invItems.push({ name: selInv.model, qty: invCount, unit: "ตัว" });
        /* ── อุปกรณ์มอนิเตอร์ระดับระบบ: 1 ชุด/งาน ──
           งานโครงการใช้ SmartLogger รวมศูนย์ตัวเดียว (อ่านหลายอินเวอร์เตอร์ผ่าน RS485) ไม่ใช้ Smart Meter + Dongle
           งานบ้านใช้ Smart Meter วัดที่จุดต่อกริด + Dongle 1 ตัว */
        if (isProject) {
          invItems.push({ name: HW.logger, qty: 1, unit: "ตัว" });
        } else {
          invItems.push({ name: ph === 3 ? HW.meter3 : HW.meter1, qty: 1, unit: "ชุด" });
          // 2 รุ่นนี้มี dongle ในตัว (SUN2000-10K-LC0, SUN2000-5K-LB0) — ไม่ต้องถอด Smart Dongle เพิ่ม
          if (!/SUN2000-10K-LC0|SUN2000-5K-LB0/i.test(selInv.model)) invItems.push({ name: HW.dongle, qty: 1, unit: "ชุด" });
        }
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
        /* กลุ่ม COMBINER BOX — เฉพาะงานบ้าน
           งานโครงการไม่ใช้ตู้ Combiner สำเร็จ แต่ประกอบเป็นตู้ไฟ DC/AC ของโครงการเอง (หมวด "ตู้ไฟ") */
        combItems = [];
        if (!isProject) {
          combItems.push({ name: HW.cabinet, qty: 1, unit: "ตู้" });
          combItems.push({ name: HW.dcFuseHolder, qty: totalStr * 2, unit: "ตัว" });
          combItems.push({ name: HW.dcFuse, qty: totalStr * 2, unit: "ตัว" });
          combItems.push({ name: HW.dcSpd, qty: totalStr, unit: "ตัว" });
          combItems.push({ name: HW.dcMcb, qty: totalStr, unit: "ตัว" });
          combItems.push({ name: HW.mc4, qty: totalStr, unit: "ชุด" });
          combItems.push({ name: ph === 3 ? HW.acSpd3 : HW.acSpd1, qty: invCount, unit: "ตัว" });
          combItems.push({ name: rcboName(selInv.outA, ph), qty: invCount, unit: "ตัว" });
          combItems.push({ name: HW.wireDuct, qty: 2, unit: "เส้น" });   // 2 เส้น/ตู้
          combItems.push({ name: HW.dinRail, qty: 1, unit: "เส้น" });    // ในตู้ใบเดียว
          combItems.push({ name: HW.stopper, qty: 10, unit: "ตัว" });    // 10/งาน (flat)
          combItems.push({ name: HW.groundBar, qty: 1, unit: "อัน" });
          // ตู้ไฟเพิ่ม (case by case)
          if (b.hwExtraPanel) {
            combItems.push({ name: ph === 3 ? HW.panel3 : HW.panel1, qty: 1, unit: "ตู้" });
            combItems.push({ name: ph === 3 ? HW.mcb3 : HW.mcb2, qty: 2, unit: "ตัว" });
            if (ph === 3) combItems.push({ name: HW.busbar, qty: 1, unit: "ชุด" });
          }
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
      if (isPvDcCable(t)) {   // สาย DC → ระยะไกลสุด × สตริง × เผื่อ แล้วถอด 2 สี (แดง+ / ดำ−) เท่ากัน
        const dc = pvDcLength(len, plan ? plan.strings : 1);
        PV_DC_COLORS.forEach((col) => { const nm = pvCableColorName(t, col); cableAgg[nm] = (cableAgg[nm] || 0) + dc.perPole; });
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

    // ── รางไฟ (WIREWAY / CABLE TRAY) ──
    const tw = b.tray || {};
    const waySpare = tw.spare != null ? +tw.spare : 10;
    const wayMap = aggBy(tw.way, "length");
    const trayMap = aggBy(tw.tray, "length");
    let wayTotalLen = 0;
    const wayRows = [];
    Object.keys(wayMap).forEach((nm) => { wayTotalLen += wayMap[nm]; wayItems(nm, wayMap[nm], waySpare, false).forEach((x) => wayRows.push(x)); });
    Object.keys(trayMap).forEach((nm) => { wayTotalLen += trayMap[nm]; wayItems(nm, trayMap[nm], waySpare, true).forEach((x) => wayRows.push(x)); });
    (tw.extra || []).filter((x) => (x.name || "").trim() && +x.qty > 0)
      .forEach((x) => wayRows.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
    // ชื่อซ้ำ (เช่น พุ๊กเหล็ก ที่มาจากหลายขนาด) รวมเป็นบรรทัดเดียว
    if (wayRows.length) groups.push({ group: G_TRAY, items: mergeItems(wayRows) });

    // ── โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB) ──
    const sup = b.support || {};
    const supSpare = sup.spare != null ? +sup.spare : 10;
    const nInvSup = Math.max(0, Math.round(+sup.inv || 0));
    const nMdbSup = Math.max(0, Math.round(+sup.mdb || 0));
    if (nInvSup > 0 || nMdbSup > 0) {
      const supRows = [];
      const addKind = (n, kindKey) => {
        const K = SUPPORT_KINDS[kindKey] || SUPPORT_KINDS.floor;
        K.per.forEach((x) => supRows.push({ name: x.name, qty: Math.ceil(x.qty * n * (1 + supSpare / 100)), unit: x.unit }));
      };
      if (nInvSup > 0) addKind(nInvSup, sup.invKind);
      if (nMdbSup > 0) addKind(nMdbSup, sup.mdbKind);
      SUPPORT_SHARED.forEach((x) => supRows.push(Object.assign({}, x)));
      (sup.extra || []).filter((x) => (x.name || "").trim() && +x.qty > 0)
        .forEach((x) => supRows.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
      groups.push({ group: G_SUPPORT, items: mergeItems(supRows) });
    }

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

    /* หมวดของงานโครงการ (ตู้ไฟ / ปั๊ม / ถัง / ท่อ)
       กรอกจำนวนเท่าไรก็ออกเท่านั้น ไม่กรอก = ไม่มีหมวดนี้ในใบถอดของ
       อุปกรณ์ประกอบของหมวดที่แยกเป็นตู้ อยู่แยกคีย์ละตู้ แต่รวมลงหมวดเดียวกันในใบถอดของ */
    const proj = normProject(b.project);
    PROJECT_KITS.forEach((k) => {
      const st = proj[k.key] || {};
      const rows = [];
      k.items.forEach((it) => { const q = Math.max(0, +st[it.key] || 0); if (q > 0) rows.push({ name: it.name, qty: q, unit: it.unit }); });
      kitExtraKeys(k).forEach((ek) => (st[ek] || []).forEach((x) => {
        const nm = String(x.name || "").trim(), q = Math.max(0, +x.qty || 0);
        if (nm && q > 0) rows.push({ name: nm, qty: q, unit: x.unit || "ชิ้น" });
      }));
      if (rows.length) groups.push({ group: k.group, items: mergeItems(rows) });
    });

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

    /* ── ค่าแรง & ค่าขออนุญาต ──
       ปริมาณของค่าแรงดึงจากผลถอดวัสดุด้านบน (auto) — ราคาอยู่ในบรรทัดเอง ไม่ดึงจากคลังวัสดุ
       บรรทัดที่ราคา 0 ยังแสดงในตารางให้เห็นว่ายังไม่ได้ตั้งราคา แต่ไม่บวกเข้ายอดรวม */
    let dcLen = 0, acLen = 0;
    Object.keys(cableAgg).forEach((t) => { if (/PV1-F|PV CABLE/i.test(t)) dcLen += cableAgg[t]; else acLen += cableAgg[t]; });
    const upvcTotalLen = Object.keys(upvcMap).reduce((s, k) => s + upvcMap[k], 0);
    const st0 = b.struct || {};
    const structPts = (st0.ladder || []).length + (st0.walkway || []).length + (st0.guardrail || []).length;
    const AUTO = {
      panels: panelCount,
      inv: invCount,
      board: (combItems && combItems.length ? 1 : 0) + (b.hwExtraPanel ? 1 : 0),
      dcLen: Math.round(dcLen),
      acLen: Math.round(acLen),
      wayLen: Math.round(imcTotalLen + upvcTotalLen + wayTotalLen),
      struct: structPts,
      one: 1,
    };
    const svcRows = (rows, preset) => (rows == null ? preset.map((p) => Object.assign({}, p, { price: 0 })) : rows)
      .filter((r) => r && (r.name || "").trim())
      .map((r) => ({
        name: String(r.name).trim(),
        qty: r.auto && AUTO[r.auto] != null ? AUTO[r.auto] : Math.max(0, +r.qty || 0),
        unit: r.unit || "",
        price: Math.max(0, +r.price || 0),
        auto: r.auto || "",
      }));
    /* ค่าแรงมี 2 แบบ — เหมารวมทั้งงาน (บรรทัดเดียว) หรือแยกรายการงาน
       เหมารวมยังเลือกฐานคิดได้ 3 แบบ: เหมาทั้งงาน · ต่อ kW · ต่อแผง (ทั้งหมดออกมาเป็น 1 บรรทัด) */
    const LB = Object.assign({ basis: "w", rate: 0, note: "" }, b.laborLump || {});
    const lumpBase = LB.basis === "w" ? { qty: Math.round(kw * 1000), unit: "W", label: "เหมาต่อวัตต์" }
      : LB.basis === "kw" ? { qty: kw, unit: "kW", label: "เหมาต่อ kW" }
      : LB.basis === "panel" ? { qty: panelCount, unit: "แผง", label: "เหมาต่อแผง" }
      : { qty: 1, unit: "งาน", label: "เหมาทั้งงาน" };
    const labor = b.laborMode === "lump"
      ? [{ name: (LB.note || "").trim() || ("ค่าแรงติดตั้งทั้งระบบ (" + lumpBase.label + ")"),
           qty: lumpBase.qty, unit: lumpBase.unit, price: Math.max(0, +LB.rate || 0), auto: "lump" }]
      : svcRows(b.labor, LABOR_PRESET);
    const permit = svcRows(b.permit, PERMIT_PRESET);
    if (labor.length) groups.push({ group: G_LABOR, items: labor });
    if (permit.length) groups.push({ group: G_PERMIT, items: permit });
    /* ขนส่ง & บริหารจัดการ — เป็นของงานโครงการ งานบ้านส่วนใหญ่ไม่มี
       จึงขึ้นเฉพาะงานที่เข้าไปกรอกไว้จริง (ยังไม่แตะ = null = ไม่ต้องโผล่ในใบถอดของ) */
    if (b.transport != null) { const r = svcRows(b.transport, TRANSPORT_PRESET); if (r.length) groups.push({ group: G_TRANSPORT, items: r }); }
    if (b.manage != null) { const r = svcRows(b.manage, MANAGE_PRESET); if (r.length) groups.push({ group: G_MANAGE, items: r }); }

    /* จำนวนที่แก้มือจากในใบถอดของ — ทับค่าที่ระบบถอดให้
       หมวดค่าแรง/ขออนุญาต/ขนส่ง/บริหาร ไม่รับ เพราะมีช่องกรอกจำนวนของตัวเองอยู่แล้ว */
    const adj = b.qtyAdj || {};
    if (Object.keys(adj).length) {
      groups.forEach((g) => {
        if (SERVICE_GROUPS.indexOf(g.group) >= 0) return;
        g.items = g.items.map((it) => {
          const v = adj[qtyKey(g.group, it.name)];
          if (v == null || v === "") return it;
          return Object.assign({}, it, { qty: Math.max(0, +v || 0), qtyAuto: it.qty, qtyAdj: true });
        });
      });
    }

    return { groups, meta: { panelCount, kw, rowsSum, invCount, invAuto, plan, battCount, auto: AUTO, valid: rowsSum === panelCount } };
  }

  /* คีย์จำนวนที่แก้มือ — ผูกกับหมวดด้วย กันชื่อซ้ำข้ามหมวดทับกัน */
  function qtyKey(group, name) { return String(group || "") + "|" + matKey(name); }

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
    add("INVERTER", HW.logger, "ตัว");   // SmartLogger ของงานโครงการ
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
    // รางไฟ — ตัวราง/ข้อต่อ/ขาแขวน แยกตามขนาด (พุ๊กเหล็กใช้ร่วมกับงานโครงสร้าง)
    WAY_SIZES.forEach((nm) => {
      const sz = traySuffix(nm);
      add(G_TRAY, nm + " (" + WAY_PIPE_LEN.toFixed(1) + "m/ท่อน)", "ท่อน");
      add(G_TRAY, "ชุดข้อต่อราง Wireway " + sz, "ชุด");
    });
    TRAY_SIZES.forEach((nm) => {
      const sz = traySuffix(nm);
      add(G_TRAY, nm + " (" + TRAY_PIPE_LEN.toFixed(1) + "m/ท่อน)", "ท่อน");
      add(G_TRAY, "ชุดข้อต่อราง Cable Tray " + sz, "ชุด");
      add(G_TRAY, "ขาแขวนราง Cable Tray " + sz, "ชุด");
    });
    add(G_TRAY, "สกรู+น็อต M6 ประกอบราง", "ชุด");
    // โครงสร้างรองรับอุปกรณ์ (เหล็กกล่อง/เหล็กฉาก/เพลท/พุ๊ก ใช้ชื่อร่วมกับงานโครงสร้างบนหลังคา)
    SUPPORT_SHARED.forEach((x) => add(G_SUPPORT, x.name, x.unit));
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
    add("WALKWAY", "WALKWAY+JOINER", "แผ่น");
    add("GUARD RAIL", "เหล็กฉาก 40x40 มม. หนา 4 มม.", "เส้น");
    add("GUARD RAIL", "สลิงสแตนเลส 6 มม.", "ม.");
    add("GUARD RAIL", "เกลียวเร่งสแตนเลส 8 มม.", "ตัว");
    add("GUARD RAIL", "กิ๊บสลิงสแตนเลส 6 มม.", "ตัว");
    add("GUARD RAIL", "ปลอกอลูมิเนียม 6 มม.", "ตัว");
    // หมวดงานโครงการ — ตู้ไฟ / ปั๊ม / ถัง / ท่อ / อุปกรณ์มอนิเตอร์
    PROJECT_KITS.forEach((k) => k.items.forEach((it) => add(k.group, it.name, it.unit)));
    // ACCESSORIES มาตรฐาน + เทปพันสายไฟทุกสี (1 เฟส + 3 เฟส)
    ACC_STD.forEach((n) => add("ACCESSORIES", n, "ชิ้น"));
    [...new Set([...ACC_TAPE_1P, ...ACC_TAPE_3P])].forEach((c) => add("ACCESSORIES", "เทปพันสายไฟ " + c, "ชิ้น"));
    return list;
  }

  // ผูกราคาเข้ากับผลลัพธ์ BOQ → คืน groups (มี code/price/total ต่อรายการ) + grandTotal
  function applyPrices(result, priceMap) {
    priceMap = priceMap || {};
    let grand = 0;
    /* ต้นทุนต่อกำลังติดตั้ง (DC) — เทียบข้ามงานได้ตรง ๆ ว่าหมวดไหนแพงผิดปกติ
       วงการเสนอราคาไทยพูดกันเป็น "บาทต่อวัตต์" จึงคิดทั้ง ฿/W และ ฿/kW ให้ */
    const kw = +((result.meta || {}).kw) || 0;
    const perKw = (v) => (kw > 0 ? Math.round((v / kw) * 100) / 100 : 0);
    const perW = (v) => (kw > 0 ? Math.round((v / (kw * 1000)) * 1000) / 1000 : 0);
    const groups = (result.groups || []).map((g) => {
      const service = SERVICE_GROUPS.indexOf(g.group) >= 0;
      let sub = 0;
      const items = g.items.map((it) => {
        // หมวดค่าแรง/ค่าขออนุญาต ราคาอยู่ในบรรทัดเอง · หมวดวัสดุดึงราคาจากคลัง
        const rec = service ? {} : (priceMap[matKey(it.name)] || {});
        const price = service ? (+it.price || 0) : (+rec.price || 0);
        const total = price * (it.qty || 0);
        sub += total;
        return Object.assign({}, it, { code: rec.code || "", price: price, total: total, perKw: perKw(total), perW: perW(total) });
      });
      grand += sub;
      return { group: g.group, service: service, items: items, subtotal: sub, perKw: perKw(sub), perW: perW(sub) };
    });
    const sumOf = (keys) => groups.filter((g) => keys.indexOf(g.group) >= 0).reduce((s, g) => s + g.subtotal, 0);
    const laborTotal = sumOf([G_LABOR]), permitTotal = sumOf([G_PERMIT]);
    const matTotal = grand - laborTotal - permitTotal;
    return {
      groups: groups, grandTotal: grand, kw: kw, perKw: perKw(grand), perW: perW(grand),
      matTotal: matTotal, matPerKw: perKw(matTotal), matPerW: perW(matTotal),
      laborTotal: laborTotal, laborPerKw: perKw(laborTotal), laborPerW: perW(laborTotal),
      permitTotal: permitTotal, permitPerKw: perKw(permitTotal), permitPerW: perW(permitTotal),
    };
  }

  /* ── แบ่งราคา: ต้นทุน → ค่าแรงผู้รับเหมา → ราคาขาย → ส่วนลด ──
     ต้นทุนมาจากใบถอดของ (ไม่ต้องกรอก) ที่เหลือกรอกเอง แล้วคิด VAT / กำไร / ฿ต่อวัตต์ ให้
     ส่วนลดกรอกเป็น "จำนวนเงินที่ลด" ราคาหลังลดคำนวณให้ ไม่ใช่กรอกราคาสุทธิเอง
     จะได้เห็นทันทีว่าลดไปเท่าไรแล้วกำไรเหลือเท่าไร */
  const VAT_RATE = 7;
  function priceBreakdown(cost, p, watt) {
    p = p || {};
    const vat = +p.vat >= 0 && p.vat !== "" && p.vat != null ? +p.vat : VAT_RATE;
    const r2 = (v) => Math.round(v * 100) / 100;
    const addVat = (v) => r2(v * (1 + vat / 100));
    const base = Math.max(0, +cost || 0);
    const contractor = Math.max(0, +p.contractor || 0);
    const totalCost = base + contractor;
    const sell = Math.max(0, +p.sell || 0);
    const discount = Math.max(0, +p.discount || 0);
    const net = Math.max(0, sell - discount);
    const w = Math.max(0, +watt || 0);
    const perW = (v) => (w > 0 ? Math.round((v / w) * 1000) / 1000 : 0);
    const pct = (profit, price) => (price > 0 ? Math.round((profit / price) * 10000) / 100 : 0);
    return {
      vat: vat, cost: base, contractor: contractor,
      totalCost: totalCost, totalCostVat: addVat(totalCost),
      sell: sell, sellVat: addVat(sell),
      discount: discount, net: net, netVat: addVat(net),
      profit: sell - totalCost, margin: pct(sell - totalCost, sell),
      netProfit: net - totalCost, netMargin: pct(net - totalCost, net),
      costPerW: perW(totalCost), sellPerW: perW(sell), netPerW: perW(net),
    };
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
        length: +p.length > 0 ? +p.length : (+def.length || 0),
      });
      /* ค่าที่ใช้เฉพาะตอนคำนวณผลผลิต/เส้น I-V — ใส่เฉพาะที่กรอกมาจริง จะได้ไม่ทับค่ากลางของเครื่องคำนวณ */
      const row = out[out.length - 1];
      ["tcVoc", "tcIsc", "tcPmax", "noct", "deg1", "degY", "cells", "fuseA"].forEach((k) => {
        if (p[k] !== "" && p[k] != null && !isNaN(+p[k]) && +p[k] !== 0) row[k] = +p[k];
      });
      if (p.halfCut === true || p.halfCut === false) row.halfCut = p.halfCut;
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
    /* กันกรอกผิดหน่วย — ช่อง kW และ MAX PV เป็น "กิโลวัตต์" แต่บางทีกรอกเป็นวัตต์มา (เช่น 55000)
       อินเวอร์เตอร์สตริงที่ใหญ่ที่สุดยังไม่ถึง 1,000 kW ค่าตั้งแต่ 1,000 ขึ้นไปจึงเป็นวัตต์แน่นอน หารกลับให้เลย
       ไม่งั้นจำนวนตัวจะเพี้ยน (100 kW ÷ 55,000 = ปัดขึ้นได้ 1 ตัว) */
    const kwUnit = (v) => { const n = +v || 0; return n >= 1000 ? Math.round(n / 1000 * 100) / 100 : n; };
    (list || []).forEach((p) => {
      if (!p || !p.model) return;
      const type = p.type === "string" || p.type === "hybrid" ? p.type : "";
      if (!type) return;
      out.push({ model: String(p.model).trim(), type: type, kw: kwUnit(p.kw), phase: +p.phase || 0, inputs: +p.inputs || 0, maxPv: kwUnit(p.maxPv), outA: +p.outA || 0, mpptVmin: +p.mpptVmin || 0, mpptVmax: +p.mpptVmax || 0, maxVdc: +p.maxVdc || 0, maxInA: +p.maxInA || 0, maxIscA: +p.maxIscA || 0,
        maxMpptA: +p.maxMpptA || 0, vStart: +p.vStart || 0, vRated: +p.vRated || 0, maxAcKw: +p.maxAcKw || 0 });
      // ค่าที่ยังไม่กรอกต้องไม่ทับค่ากลางในเครื่องคำนวณ จึงใส่เฉพาะตอนมีค่าจริง
      const row = out[out.length - 1];
      if ((+p.maxPv || 0) >= 1000 || (+p.kw || 0) >= 1000) row.unitFixed = true;   // เตือนให้ไปแก้ที่คลัง
      if (+p.strPerMppt > 0) row.strPerMppt = Math.round(+p.strPerMppt);
      if (+p.eff > 0) row.eff = +p.eff;
      if (+p.effEuro > 0) row.effEuro = +p.effEuro;
    });
    INVERTERS.length = 0;
    out.forEach((x) => INVERTERS.push(x));
  }

  window.BOQ = { PANELS, MICRO, INVERTERS, ROOF_HOOKS, ROOF_OPTIONS, CABLE_TYPES, CABLE_GROUPS, cableCategory, MATERIAL_SUBGROUPS, materialSubGroup, CABLE_POINTS, DEFAULT_CABLES, STRING_CABLE_POINTS, MICRO_CABLE_NAMES, DEFAULT_STRING_CABLES, IMC_SIZES, UPVC_SIZES, PULLBOX_SIZES, CABLE_OD, HDPE_TABLE, IMC_CONDUIT, WIRE_SIZES, WIRE_METHODS, INS_CLASSES, AMP_GROUPS, AMP_NCOND, AMP_CORES, ampColKey, DEFAULT_AMPACITY, AMPACITY, setAmpacity, WIRE_METHOD_BASE, ampTableFor, cableInsClass, cableCoreType, cableSizeNum, ampacityOf, pickWireSize, PV_WIRE_SIZES, PV_WIRE_AMP, PV_WIRE_MIN, pickPvWireSize, calcVdrop, VD_LIMIT, findPanel, findInverter, stringConfig, stringPlan, wireArea, calcWireWay, calcConduitSize, blankBOQ, calcBOQ, calcStructures, matKey, qtyKey, catalog, isPvDcCable, PV_DC_COLORS, PV_DC_SPARE, pvDcLength, applyPrices, setPanels, setInverters,
    WAY_SIZES, TRAY_SIZES, WAY_PIPE_LEN, TRAY_PIPE_LEN, SUPPORT_KINDS, LABOR_PRESET, PERMIT_PRESET,
    TRANSPORT_PRESET, MANAGE_PRESET, G_TRANSPORT, G_MANAGE, PROJECT_KITS, normProject, kitExtraKeys, VAT_RATE, priceBreakdown,
    TRAY_FILL_LIMIT, TRAY_DERATE, trayDerate, trayDim, trayCheck, cableCores,
    UPVC_CONDUIT, conduitFillLimit, conduitDim, conduitCheck,
    AMP_CORE_LABEL, ampGroupMeta, ampCoresFor, ampCoreKey, WIRE_METHOD_LEGACY, normWireMethod,
    G_TRAY, G_SUPPORT, G_LABOR, G_PERMIT, SERVICE_GROUPS, mergeItems };
})();
