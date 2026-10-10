/* ============================================================
   PHITHAN GREEN — BOQ / ถอดวัสดุต่องาน
   เครื่องคำนวณปริมาณวัสดุหลัก (PV / INVERTER / MOUNTING / CABLE)
   สูตรอ้างอิงจากไฟล์ "BOM REV.02.xlsx" (ADD DATA + CAL-MOUNTING + ATMOCE)
   ============================================================ */
(function () {
  /* ── เงื่อนไขการคำนวณที่ตั้งค่าได้ (หน้าคลัง → "ตั้งค่าคำนวณ BOQ") ──
     เดิมตัวเลขพวกนี้ฝังอยู่ในสูตร แก้ได้แค่คนเขียนโค้ด · เก็บที่ RTDB boqRules/<key> = ข้อความ (ไม่มีคีย์ = ค่าตั้งต้นด้านล่าง)
     RULES เป็นอ็อบเจกต์ตัวเดิมตลอด setRules แทนค่าข้างใน — สูตรอ่าน RULES.x ตอนคำนวณ จึงเห็นค่าใหม่เสมอ
     type: num (ตัวเลข) · nums (รายการตัวเลขคั่นจุลภาค เรียงน้อยไปมาก) · words (รายการคำคั่นจุลภาค)
       · pairs (ของที่ขายเป็นชุด แรงดัน (+ จำนวนขั้ว) ↔ ขนาด: ข้อความ "1000: 10, 16; 1500: 10" หรือ "1000 2P: 40; 1500 3P: 40" → [{v, p?, a:[…]}]
         poles = รายการขั้วให้เลือก (มี = แถวละแรงดัน+ขั้ว) · legacy = คีย์ [A, V] แบบแยกเดิม · legacyV = คีย์รายการแรงดันเดิม (ขนาด/ขั้วตามค่าตั้งต้น)) */
  /* grp = หัวกลุ่มในแถบซ้าย · แถว RULE_DEFS ที่มี g = หัวย่อยในหน้าหัวข้อ */
  const RULE_SECS = [
    { k: "dcBoard", grp: "ฝั่ง DC", th: "ตู้ไฟ DC", sub: "ฟิวส์ gPV · DC SPD · แรงดันพิกัด · DC MCB (งานบ้าน)" },
    { k: "dcWire", grp: "ฝั่ง DC", th: "สาย DC (PV)", sub: "ตัวคูณเลือกขนาดสาย PV · เผื่อความยาว · แรงดันตก DC" },
    { k: "acBoard", grp: "ฝั่ง AC", th: "ตู้ไฟ AC", sub: "MCCB/ACB · Ground Fault · ZCT · ฟิวส์กันหลัง SPD · CT · MCB + RCCB (งานบ้าน)" },
    { k: "acWire", grp: "ฝั่ง AC", th: "สาย AC", sub: "ตัวคูณเลือกขนาดสาย · แรงดันตก AC / รวม" },
    { k: "tray", grp: "งานติดตั้ง", th: "รางไฟ · ท่อร้อยสาย", sub: "ขาล็อก · ตัวยึด · Rail รอง · ข้อต่อ · % บรรจุสาย · รางจากแบบ 3D · อุปกรณ์ uPVC" },
    { k: "mount", grp: "งานติดตั้ง", th: "โครงยึดแผง (MOUNTING)", sub: "RAIL · ข้อต่อ · MID/END CLAMP · L-FEET · กราวด์โครงแผง" },
    { k: "gnd", grp: "งานติดตั้ง", th: "กราวด์", sub: "แท่งกราวด์ · เทอร์โมเวล ตามขนาดระบบ" },
    { k: "walk", grp: "งานติดตั้ง", th: "ทางเดิน · บันได · ราวกันตก", sub: "แผ่น WALKWAY · END CLAMP · RAIL · สูตรบันไดลิง/ราวสลิง · % เผื่อเริ่มต้น" },
    { k: "plan", grp: "งานติดตั้ง", th: "ท่อน้ำ PPR", sub: "ความยาวเส้น · เผื่อ · ก๊อก · แคลมป์ · มุมเลี้ยว" },
    { k: "permit", grp: "ค่าบริการ & ราคา", th: "ค่าขออนุญาต & วิศวกร", sub: "ค่าขนานไฟ MEA/PEA · เงื่อนไข กกพ./พค.2/อ.1 · ค่าวิศวกรตามขนาด" },
    { k: "price", grp: "ค่าบริการ & ราคา", th: "เผื่อ · กำไร · O&M", sub: "Accessories % · กำไรเริ่มต้น · VAT · ปีที่แถม O&M" },
  ];
  const RULE_DEFS = [
    /* ── ตู้ไฟ DC ── */
    { sec: "dcBoard", g: "ทุกงาน", key: "dcFuseK", th: "ฟิวส์ DC gPV = Isc ×", unit: "เท่า", def: 1.5, min: 1 },
    { sec: "dcBoard", g: "ทุกงาน", key: "dcFuseMaxK", th: "ฟิวส์ DC ไม่เกิน Isc × (เกินขึ้นเตือน)", unit: "เท่า", def: 2.4, min: 1 },
    /* holder = แต่ละแรงดันใช้ฐานฟิวส์คนละรุ่น (ขนาดลูกฟิวส์ต่างกัน 10x38 / 10x85) — Suntree: 1000V SRD-30 · 1500V SRD-50H
       ข้อความ "1000 [SRD-30]: 10, 12" · ไม่กรอกรุ่น = รุ่นตั้งต้นของแรงดันนั้น (ถ้ามี) */
    { sec: "dcBoard", g: "ทุกงาน", key: "dcFuse", th: "ฟิวส์ DC gPV ที่มีขาย", unit: "VDC", unitA: "A", type: "pairs", holder: "ฐานฟิวส์", legacy: ["dcFuseA", "dcFuseV"],
      def: [{ v: 1000, h: "SRD-30", a: [10, 12, 15, 16, 20, 25, 30, 32] }, { v: 1500, h: "SRD-50H", a: [15, 20, 25, 30, 32] }] },
    { sec: "dcBoard", g: "ทุกงาน", key: "tMin", th: "อุณหภูมิต่ำสุดหน้างาน (คิด Voc สตริงตอนเช้าที่หนาวสุด · ใช้ทั้ง BOQ/ออกแบบระบบ/SLD)", unit: "°C", def: 15, min: -20, max: 40 },
    { sec: "dcBoard", g: "ทุกงาน", key: "tCellHot", th: "อุณหภูมิเซลล์ตอนร้อนสุด (Vmp ตก · เช็กว่าแรงดันสตริงไม่หลุดใต้ MPPT · ใช้ทั้ง BOQ/ออกแบบระบบ)", unit: "°C", def: 65, min: 30, max: 100 },
    { sec: "dcBoard", g: "ทุกงาน", key: "bifacialK", th: "แผงสองหน้า (Bifacial) · Isc ใช้เลือกฟิวส์/DC MCB/สาย = Isc × (แสงสะท้อนด้านหลัง)", unit: "เท่า", def: 1.1, min: 1, max: 1.5 },
    { sec: "dcBoard", g: "ทุกงาน", key: "vocK", th: "แรงดันพิกัดฟิวส์/SPD/DC MCB ≥ Voc สตริง (ที่อุณหภูมิต่ำสุด) × เผื่อ", unit: "เท่า", def: 1.1, min: 1 },
    { sec: "dcBoard", g: "ทุกงาน", key: "dcSpd2", th: "DC SPD Type II ที่มีขาย", unit: "VDC", unitA: "kA Imax", type: "pairs", poles: ["1P", "2P", "3P", "4P"], poleDef: "2P", legacyV: "dcSpdV",
      def: [{ v: 800, p: "2P", a: [40] }, { v: 1000, p: "2P", a: [40] }, { v: 1500, p: "2P", a: [40] }] },
    { sec: "dcBoard", g: "ทุกงาน", key: "dcSpd12", th: "DC SPD Type I+II ที่มีขาย (ระบบล่อฟ้า · แผงใกล้)", unit: "VDC", unitA: "kA Iimp", type: "pairs", poles: ["1P", "2P", "3P", "4P"], poleDef: "2P",
      def: [{ v: 1000, p: "2P", a: [6.25] }, { v: 1500, p: "2P", a: [6.25] }] },
    { sec: "dcBoard", g: "ทุกงาน", key: "spdImax", th: "SPD Type II · Imax ไม่ต่ำกว่า (ทั้ง AC/DC)", unit: "kA", def: 40, min: 1 },
    { sec: "dcBoard", g: "ทุกงาน", key: "dcIimp", th: "DC SPD Type I+II · Iimp ไม่ต่ำกว่า", unit: "kA", def: 6.25, min: 0.1 },
    { sec: "dcBoard", g: "งานบ้าน", key: "dcMcbK", th: "DC MCB ต่อสตริง = Isc × (IEC 62548 ≥ 1.5)", unit: "เท่า", def: 1.5, min: 1 },
    { sec: "dcBoard", g: "งานบ้าน", key: "dcMcb", th: "DC MCB ที่มีขาย", unit: "VDC", unitA: "A", type: "pairs", poles: ["1P", "2P", "3P", "4P"], poleDef: "2P", legacy: ["dcMcbA", "dcMcbV"],
      def: [{ v: 550, p: "2P", a: [16, 20, 25, 32, 63] }, { v: 800, p: "2P", a: [16, 20, 25, 32, 63] }, { v: 1000, p: "4P", a: [16, 20, 25, 32, 63] }] },   // SUNTREE SL7N-63 (ต.ค. 2026)
    { sec: "dcBoard", g: "อินเวอร์เตอร์", key: "battS1Kwh", th: "แบต Huawei LUNA2000-S1 · ความจุต่อก้อน", unit: "kWh", def: 7, min: 1 },
    { sec: "dcBoard", g: "อินเวอร์เตอร์", key: "battS1Per", th: "แบต LUNA2000-S1 · ก้อนสูงสุดต่อ Power Module 1 ตัว", unit: "ก้อน", def: 3, min: 1 },
    { sec: "dcBoard", g: "อินเวอร์เตอร์", key: "dcacMax", th: "เพดานอัตรา DC/AC (กำลังแผง ÷ กำลัง AC อินเวอร์เตอร์)", unit: "เท่า", def: 1.2, min: 0.5, max: 3 },
    /* ── สาย DC ── */
    { sec: "dcWire", key: "pvWireK", th: "สาย PV DC เลือกขนาดจาก Isc ×", unit: "เท่า", def: 1.25, min: 1 },
    { sec: "dcWire", key: "pvWireMin", th: "สาย PV ขนาดเล็กสุดที่ใช้ (วสท.)", unit: "mm²", def: 6, min: 2.5, max: 16 },
    { sec: "dcWire", key: "pvWireTempK", th: "ตัวคูณลดพิกัดสาย PV ตามอุณหภูมิ (ตารางอ้างอิงอากาศ 60°C · ร้อนกว่านี้ใส่ต่ำกว่า 1)", unit: "เท่า", def: 1, min: 0.3, max: 1.2 },
    { sec: "dcWire", key: "pvSpare", th: "สาย PV เผื่อความยาว (ระยะไกลสุด × สตริง × ค่านี้)", unit: "เท่า", def: 1.2, min: 1 },
    { sec: "dcWire", key: "vdDc", th: "แรงดันตกฝั่ง DC ไม่เกิน", unit: "%", def: 2, min: 0.1, max: 20 },
    /* ── ตู้ไฟ AC ── */
    { sec: "acBoard", g: "งานโครงการ", key: "mccbIrK", th: "MCCB ตั้งกระแส Ir = กระแสออก ×", unit: "เท่า", def: 1.05, min: 1 },
    { sec: "acBoard", g: "งานโครงการ", key: "mccbStep", th: "ปัด Ir ขึ้นทีละ", unit: "A", def: 5, min: 1 },
    /* MCCB 3P ขายเป็นเฟรม AF → ขนาด AT ในเฟรมนั้น + kA (Icu) ต่อเฟรม (เก็บใน h) · เลือก AT แรกที่ ≥ Ir แล้วใช้ AF เล็กสุดที่มี AT นั้น
       แยกสองตาราง (ผู้ใช้): เมนตู้ AC = รุ่นปรับตั้งได้ TM-D ("MCCB 3P 250AF 160AT 36kA TM-D" · Shunt trip เป็นอุปกรณ์เสริมแยก "MCCB CVS Shunt Trip (MX) 220VAC")
       อินเวอร์เตอร์ = MCCB ธรรมดา · RULES.mccbAtMain/mccbAtInv = ทุก AT ของตาราง (คำนวณใน setRules) */
    { sec: "acBoard", g: "งานโครงการ", key: "mccbMain", th: "MCCB สำหรับเมนตู้ AC ที่มีขาย (รุ่นปรับตั้งได้ TM-D)", unit: "AF", unitA: "AT", vName: "เฟรม", type: "pairs", holder: "kA (Icu)", holderPh: "เช่น 36",
      def: [{ v: 100, h: "25", a: [16, 20, 25, 32, 40, 50, 63, 80, 100] }, { v: 250, h: "36", a: [100, 125, 150, 160, 175, 200, 225, 250] },
        { v: 400, h: "50", a: [250, 300, 320, 350, 400] }, { v: 630, h: "50", a: [400, 500, 630] }, { v: 800, h: "50", a: [700, 800] }, { v: 1250, h: "50", a: [1000, 1250] }] },
    { sec: "acBoard", g: "งานโครงการ", key: "mccbInv", th: "MCCB สำหรับอินเวอร์เตอร์ที่มีขาย", unit: "AF", unitA: "AT", vName: "เฟรม", type: "pairs", holder: "kA (Icu)", holderPh: "เช่น 25",
      def: [{ v: 100, h: "25", a: [16, 20, 25, 32, 40, 50, 63, 80, 100] }, { v: 250, h: "36", a: [100, 125, 150, 160, 175, 200, 225, 250] },
        { v: 400, h: "50", a: [250, 300, 320, 350, 400] }, { v: 630, h: "50", a: [400, 500, 630] }, { v: 800, h: "50", a: [700, 800] }, { v: 1250, h: "50", a: [1000, 1250] }] },
    { sec: "acBoard", g: "งานโครงการ", key: "acbAt", th: "ขนาด ACB 3P (ใช้เมื่อเกิน MCCB ตัวใหญ่สุด)", unit: "AT", type: "nums", def: [1600, 2000, 2500, 3200, 4000] },
    { sec: "acBoard", g: "งานโครงการ", key: "gfLsigAt", th: "เมนตั้งแต่กี่ AT ใช้ trip unit LSIG แทน GFR + ZCT + Shunt trip", unit: "AT", def: 1000, min: 1 },
    { sec: "acBoard", g: "ทุกงาน", key: "acSpd2", th: "AC SPD Type II ที่มีขาย", unit: "V Uc", unitA: "kA Imax", type: "pairs", poles: ["2P", "1P+N", "3P", "3P+N", "4P"], poleDef: "2P",
      def: [{ v: 275, p: "2P", a: [40] }, { v: 385, p: "4P", a: [40] }] },   // SUNTREE SUP1H-40 (ต.ค. 2026)
    { sec: "acBoard", g: "งานโครงการ", key: "acSpd12", th: "AC SPD Type I+II ที่มีขาย (ระบบล่อฟ้า · แผงใกล้)", unit: "V Uc", unitA: "kA Iimp", type: "pairs", poles: ["2P", "1P+N", "3P", "3P+N", "4P"], poleDef: "2P",
      def: [{ v: 275, p: "2P", a: [7, 12.5] }, { v: 385, p: "3P", a: [7] }, { v: 385, p: "4P", a: [7, 12.5] }] },   // SUNTREE SUP2-T1+T2 (ฉลาก Iimp 7kA) · CHINT NXU-I+II 12.5kA 2P/4P
    { sec: "acBoard", g: "ทุกงาน", key: "acUc1", th: "AC SPD 1 เฟส · Uc ไม่ต่ำกว่า (ขั้ว 2P / 1P+N)", unit: "V", def: 275, min: 1 },
    { sec: "acBoard", g: "ทุกงาน", key: "acUc3", th: "AC SPD 3 เฟส · Uc ไม่ต่ำกว่า (ขั้ว 3P+N / 4P)", unit: "V", def: 385, min: 1 },
    { sec: "acBoard", g: "งานโครงการ", key: "acIimp", th: "AC SPD Type I+II · Iimp ไม่ต่ำกว่า (ต่อขั้ว)", unit: "kA", def: 12.5, min: 0.1 },
    { sec: "acBoard", g: "งานโครงการ", key: "nhT2", th: "ฟิวส์ NH00 กันหลัง AC SPD Type 2", unit: "A", def: 63, min: 1 },
    { sec: "acBoard", g: "งานโครงการ", key: "nhT12", th: "ฟิวส์ NH00 กันหลัง AC SPD Type 1+2 (เมนไม่เกินค่านี้ไม่ต้องมีฟิวส์)", unit: "A", def: 125, min: 1 },
    { sec: "acBoard", g: "งานโครงการ", key: "ctR", th: "อัตราส่วน CT ของ Power Meter ที่มีขาย (/5A · เลือกตัวแรกที่ ≥ เมน)", unit: "A", type: "nums", def: [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1250, 1500, 1600, 2000, 2500, 3000, 4000] },
    { sec: "acBoard", g: "งานโครงการ", key: "pmMcb", th: "MCB กันสายวัดแรงดัน PM2230 / ไฟเลี้ยง GFR", unit: "A", def: 6, min: 1 },
    { sec: "acBoard", g: "งานโครงการ", key: "zctAt", th: "ZCT · ขนาดเมนแต่ละขั้น (ไม่เกิน)", unit: "AT", type: "nums", def: [125, 250, 630] },
    { sec: "acBoard", g: "งานโครงการ", key: "zctD", th: "ZCT · ขนาดรูของแต่ละขั้น (ตัวสุดท้าย = เมนใหญ่กว่าขั้นสุดท้าย)", unit: "มม.", type: "nums", def: [60, 80, 120, 200] },
    /* งานบ้าน = MCB (กระแสเกิน) + RCCB (ไฟรั่ว) แทน RCBO (ผู้ใช้: ของที่มีขายมีแต่ RCCB) · rcboMa คีย์เดิมเก็บรุ่นกระแสรั่วของ RCCB */
    { sec: "acBoard", g: "งานบ้าน", key: "fixK", th: "MCB (ปรับตั้งไม่ได้) เลือกขนาดแรกที่ ≥ กระแส ×", unit: "เท่า", def: 1.25, min: 1 },
    { sec: "acBoard", g: "งานบ้าน", key: "rcboMa", th: "RCCB รุ่นกระแสรั่ว (ใช้กับทุกขนาดด้านล่าง)", unit: "mA", def: 100, min: 1, stock: [30, 100, 300] },
    { sec: "acBoard", g: "งานบ้าน", key: "mcbHome2P", th: "MCB 2P (1 เฟส) ที่มีขาย — เกินตัวใหญ่สุดใช้ MCCB", unit: "A", type: "nums", def: [16, 20, 25, 32, 40, 50, 63] },
    { sec: "acBoard", g: "งานบ้าน", key: "mcbHome3P", th: "MCB 3P (3 เฟส) ที่มีขาย — เกินตัวใหญ่สุดใช้ MCCB", unit: "A", type: "nums", def: [16, 20, 25, 32, 40, 50, 63] },
    { sec: "acBoard", g: "งานบ้าน", key: "rccb2P", th: "RCCB 2P (1 เฟส) ที่มีขาย — ขนาดแรกที่ ≥ MCB", unit: "A", type: "nums", def: [25, 40, 63] },
    { sec: "acBoard", g: "งานบ้าน", key: "rccb4P", th: "RCCB 4P (3 เฟส) ที่มีขาย — ขนาดแรกที่ ≥ MCB", unit: "A", type: "nums", def: [25, 40, 63] },
    { sec: "acBoard", g: "งานบ้าน", key: "homeSpdMcb", th: "MCB กันหลัง AC SPD", unit: "A", def: 32, min: 1 },
    /* ── สาย AC ── */
    { sec: "acWire", key: "wireK", th: "สาย AC เลือกขนาดจากกระแส × (โหลดต่อเนื่อง)", unit: "เท่า", def: 1.25, min: 1 },
    { sec: "acWire", key: "acTempK", th: "ตัวคูณลดพิกัดสาย AC ตามอุณหภูมิแวดล้อม (ตาราง วสท. อ้างอิง 40°C · ใต้หลังคาร้อน ~0.87)", unit: "เท่า", def: 1, min: 0.3, max: 1.2 },
    { sec: "acWire", key: "gndSmallBelow", th: "สายประธานเล็กกว่านี้ ใช้สายกราวด์ขนาดเล็ก (ไม่ใช้ตารางสายต่อหลักดิน)", unit: "ตร.มม.", def: 25, min: 0 },
    { sec: "acWire", key: "gndSmall", th: "ขนาดสายกราวด์เมื่อสายประธานเล็ก", unit: "ตร.มม.", def: 6, min: 1 },
    { sec: "acWire", key: "vdAc", th: "แรงดันตกฝั่ง AC ไม่เกิน", unit: "%", def: 3, min: 0.1, max: 20 },
    { sec: "acWire", key: "vdTotal", th: "แรงดันตกรวม DC + AC ไม่เกิน", unit: "%", def: 5, min: 0.1, max: 30 },
    /* ── รางไฟ ── */
    { sec: "tray", g: "ถอดวัสดุ", key: "traySpare", th: "% เผื่ออุปกรณ์ประกอบรางไฟ (ใบที่ยังไม่ได้ตั้ง)", unit: "%", def: 10, max: 100 },
    { sec: "tray", g: "ถอดวัสดุ", key: "trayHanger", th: "ขาล็อกรางไฟ ทุก", unit: "ม.", def: 1.5, min: 0.1 },
    { sec: "tray", g: "ถอดวัสดุ", key: "trayAnchor", th: "ตัวยึด (พุ๊ก / T-BOLT) ต่อขาล็อก", unit: "ตัว", def: 2 },
    { sec: "tray", g: "ถอดวัสดุ", key: "trayRailSide", th: "Rail รองขาล็อก ยื่นพ้นรางข้างละ", unit: "มม.", def: 100 },
    { sec: "tray", g: "ถอดวัสดุ", key: "trayJointX", th: "ชุดข้อต่อราง เผื่อนอกจากรอยต่อ (หัว-ท้าย)", unit: "ชุด", def: 2 },
    { sec: "tray", g: "ถอดวัสดุ", key: "wayFill", th: "Wireway บรรจุสายได้ไม่เกิน (พื้นที่หน้าตัด)", unit: "%", def: 20, min: 1, max: 100 },
    { sec: "tray", g: "ถอดวัสดุ", key: "trayFill", th: "Cable Tray บรรจุสายได้ไม่เกิน (พื้นที่หน้าตัด)", unit: "%", def: 50, min: 1, max: 100 },
    { sec: "tray", g: "จากแบบ 3D", key: "trayTurn90", th: "มุมเลี้ยวตั้งแต่กี่องศานับเป็นข้องอ 90° (น้อยกว่า = 45°)", unit: "°", def: 60, max: 180 },
    { sec: "tray", g: "จากแบบ 3D", key: "trayTurn45", th: "มุมเลี้ยวน้อยกว่านี้ไม่นับข้องอ", unit: "°", def: 15, max: 180 },
    { sec: "tray", g: "จากแบบ 3D", key: "trayEnd", th: "แผ่นปิดหัว-ท้าย ต่อเส้น", unit: "ชุด", def: 2 },
    { sec: "tray", g: "จากแบบ 3D", key: "trayPerfW", th: "ทุกเส้นกว้างตั้งแต่เท่านี้ เลือก Perforated ให้ (แคบกว่า = Wireway)", unit: "ซม.", def: 15, min: 1 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "condFill1", th: "บรรจุสายในท่อ · สาย 1 เส้น ไม่เกิน", unit: "%", def: 53, min: 1, max: 100 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "condFill2", th: "บรรจุสายในท่อ · สาย 2 เส้น ไม่เกิน", unit: "%", def: 31, min: 1, max: 100 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "condFill3", th: "บรรจุสายในท่อ · 3 เส้นขึ้นไป ไม่เกิน", unit: "%", def: 40, min: 1, max: 100 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "upStraightX", th: "uPVC ข้อต่อตรง = จำนวนท่อน +", unit: "ตัว", def: 4 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "upClamp", th: "uPVC แคลมป์ก้ามปู ทุก", unit: "ม.", def: 0.6, min: 0.1 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "upConn", th: "uPVC คอนเน็ตเตอร์ ต่อขนาด (พื้นฐาน)", unit: "ตัว", def: 8 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "upConnBat", th: "uPVC คอนเน็ตเตอร์ เพิ่มเมื่อมีแบต / Backup (อย่างละ)", unit: "ตัว", def: 4 },
    { sec: "tray", g: "ท่อร้อยสาย", key: "upConnPb", th: "uPVC คอนเน็ตเตอร์ เพิ่มต่อ Pull box", unit: "ตัว", def: 3 },
    /* ── โครงยึดแผง ── */
    { sec: "mount", g: "RAIL", key: "railLens", th: "ความยาวท่อน RAIL ที่มีขาย (เลือกต่อใบ · ท่อนแรก = ค่าเริ่มใบใหม่)", unit: "ม.", type: "nums", def: [4.2, 4.8] },
    { sec: "mount", g: "RAIL", key: "railLines", th: "RAIL ต่อแถวแผง (จำนวนแนว)", unit: "แนว", def: 2, min: 1, max: 6 },
    { sec: "mount", g: "RAIL", key: "splicePerJoint", th: "RAIL SPLICE KIT ต่อรอยต่อท่อน (ต่อแนว)", unit: "ชุด", def: 1, max: 4 },
    { sec: "mount", g: "CLAMP", key: "midPerJoint", th: "MID CLAMP ต่อรอยต่อระหว่างแผง", unit: "ชุด", def: 2, max: 6 },
    { sec: "mount", g: "CLAMP", key: "endPerRow", th: "END CLAMP ต่อแถว", unit: "ชุด", def: 4, max: 12 },
    { sec: "mount", g: "L-FEET", key: "purlinSpan", th: "ระยะแปเริ่มต้น (ใบที่เลือกคิด L-FEET ตามระยะแป)", unit: "ม.", def: 1.2, min: 0.3, max: 6 },
    { sec: "mount", g: "กราวด์โครงแผง", key: "lugPerRow", th: "GROUNDING LUG ต่อแถว", unit: "ชุด", def: 2, max: 10 },
    { sec: "mount", g: "กราวด์โครงแผง", key: "earthClipPer", th: "EARTHING CLIP ต่อแผง", unit: "ตัว", def: 1, max: 10 },
    { sec: "mount", g: "กราวด์โครงแผง", key: "boltPerLug", th: "BOLT&N2 NUT M8 ต่อ GROUNDING LUG", unit: "ชุด", def: 1, max: 10 },
    { sec: "mount", g: "ค่าเริ่มต้นของใบใหม่", key: "mGap", th: "ช่องห่างระหว่างแผง", unit: "ม.", def: 0.025, max: 0.5 },
    { sec: "mount", g: "ค่าเริ่มต้นของใบใหม่", key: "mEndSpare", th: "เผื่อหัวท้ายต่อแถว", unit: "ม.", def: 0.6, max: 5 },
    { sec: "mount", g: "ค่าเริ่มต้นของใบใหม่", key: "mLfeetPerRail", th: "L-FEET ต่อท่อนราง (ใบที่คิดต่อท่อนราง)", unit: "ตัว", def: 4, max: 20 },
    { sec: "mount", g: "% เผื่อเริ่มต้นของใบใหม่", key: "mSpRail", th: "RAIL", unit: "%", def: 5, max: 100 },
    { sec: "mount", g: "% เผื่อเริ่มต้นของใบใหม่", key: "mSpJoiner", th: "RAIL SPLICE KIT", unit: "%", def: 5, max: 100 },
    { sec: "mount", g: "% เผื่อเริ่มต้นของใบใหม่", key: "mSpMid", th: "MID CLAMP", unit: "%", def: 10, max: 100 },
    { sec: "mount", g: "% เผื่อเริ่มต้นของใบใหม่", key: "mSpEnd", th: "END CLAMP", unit: "%", def: 10, max: 100 },
    { sec: "mount", g: "% เผื่อเริ่มต้นของใบใหม่", key: "mSpLfeet", th: "L-FEET / ROOF HOOK", unit: "%", def: 5, max: 100 },
    { sec: "mount", g: "% เผื่อเริ่มต้นของใบใหม่", key: "mSpGround", th: "GROUNDING LUG", unit: "%", def: 10, max: 100 },
    /* ── กราวด์ ── */
    { sec: "gnd", key: "gndBigKw", th: "ไซต์ใหญ่ตั้งแต่ (เพิ่มแท่งกราวด์ · เทอร์โมเวล 3 ทาง · Test box)", unit: "kW", def: 30 },
    { sec: "gnd", g: "ไซต์เล็ก", key: "gndRodS", th: "แท่งกราวด์", unit: "แท่ง", def: 1 },
    { sec: "gnd", g: "ไซต์เล็ก", key: "gndWeldS", th: "เทอร์โมเวล 2 ทาง", unit: "ชุด", def: 1 },
    { sec: "gnd", g: "ไซต์ใหญ่", key: "gndRodB", th: "แท่งกราวด์", unit: "แท่ง", def: 3 },
    { sec: "gnd", g: "ไซต์ใหญ่", key: "gndWeldB", th: "เทอร์โมเวล 2 ทาง", unit: "ชุด", def: 2 },
    /* ── ทางเดิน · บันได · ราวกันตก ── */
    { sec: "walk", g: "ทางเดิน (WALKWAY)", key: "walkSheet", th: "ความยาวแผ่น WALKWAY ที่มีขาย (เลือกต่อใบในหัวข้อทางเดิน)", unit: "ม.", type: "nums", def: [2.44] },
    { sec: "walk", g: "ทางเดิน (WALKWAY)", key: "walkClampRail", th: "END CLAMP + ชุดยึด ต่อ RAIL รองใต้ 1 เส้น (ซ้าย-ขวาแผ่น)", unit: "ชุด", def: 2, min: 0 },   // เดิม walkClamp 6 ชุด/แผ่น
    // RAIL รองใต้คิดตามความยาวทางเดิน (ผู้ใช้ ต.ค. 2026 — แผ่นมีหลายความยาวแล้ว ต่อแผ่นใช้ไม่ได้) · คีย์ใหม่ ค่าเก่า walkRailPts (เส้น/แผ่น) ไม่ใช้
    { sec: "walk", g: "ทางเดิน (WALKWAY)", key: "walkRailEvery", th: "RAIL รองใต้แผ่น วางทุกระยะ (ตามความยาวทางเดิน · หัว-ท้ายแนวมีเสมอ)", unit: "ม.", def: 1.22, min: 0.1 },
    // ชิ้น RAIL รองใต้ = กว้างทางเดิน + ยื่นข้างละ (แบบ Rail รองขาล็อกรางไฟ) ตัดจากท่อน 4.2 ม. ปัดลง (ผู้ใช้ ต.ค. 2026 · แทน walkRailLen ยาวเส้นละ 1.5 ม.)
    { sec: "walk", g: "ทางเดิน (WALKWAY)", key: "walkWidth", th: "ความกว้างแผ่นทางเดิน", unit: "มม.", def: 300, min: 50 },
    { sec: "walk", g: "ทางเดิน (WALKWAY)", key: "walkRailSide", th: "RAIL รองใต้แผ่น ยื่นพ้นทางเดินข้างละ", unit: "มม.", def: 100, min: 0 },
    { sec: "walk", g: "ทางเดิน (WALKWAY)", key: "walkRound", th: "ความยาวทางเดินจากแบบ 3D ปัดขึ้นทีละ", unit: "ม.", def: 0.1, min: 0.01 },
    { sec: "walk", g: "% เผื่อเริ่มต้นของใบใหม่", key: "walkSpare", th: "ทางเดิน", unit: "%", def: 10, max: 100 },
    { sec: "walk", g: "% เผื่อเริ่มต้นของใบใหม่", key: "ladderSpare", th: "บันไดลิง", unit: "%", def: 5, max: 100 },
    { sec: "walk", g: "% เผื่อเริ่มต้นของใบใหม่", key: "railSpare", th: "ราวกันตก", unit: "%", def: 5, max: 100 },
    { sec: "walk", g: "บันไดลิง", key: "ladTop", th: "ยื่นเหนือขอบหลังคา", unit: "ม.", def: 1 },
    { sec: "walk", g: "บันไดลิง", key: "ladRung", th: "ขั้นบันไดห่างกัน", unit: "ม.", def: 0.35, min: 0.1 },
    { sec: "walk", g: "บันไดลิง", key: "ladRungW", th: "ขั้นบันไดกว้าง (เหล็กกลม)", unit: "ม.", def: 0.5, min: 0.1 },
    { sec: "walk", g: "บันไดลิง", key: "ladCageAt", th: "มีครอบหลัง (กรง) เมื่อยาวรวมตั้งแต่", unit: "ม.", def: 5 },
    { sec: "walk", g: "บันไดลิง", key: "ladCageFrom", th: "ครอบหลังเริ่มที่ความสูง", unit: "ม.", def: 2.5 },
    { sec: "walk", g: "บันไดลิง", key: "ladCageV", th: "ครอบหลัง · เหล็กแบนแนวตั้ง", unit: "เส้น", def: 3 },
    { sec: "walk", g: "บันไดลิง", key: "ladRing", th: "ครอบหลัง · ห่วงทุก", unit: "ม.", def: 0.5, min: 0.1 },
    { sec: "walk", g: "บันไดลิง", key: "ladBrkAt", th: "ขายึดผนัง 2 จุดเมื่อสูงตั้งแต่ (ต่ำกว่า = 1 จุด)", unit: "ม.", def: 3 },
    { sec: "walk", g: "บันไดลิง", key: "ladAnchor", th: "พุ๊กต่อแผ่นยึด", unit: "ตัว", def: 4 },
    { sec: "walk", g: "ราวกันตก (สลิง)", key: "grlPost", th: "เสาเหล็กฉากทุก", unit: "ม.", def: 3, min: 0.5 },
    { sec: "walk", g: "ราวกันตก (สลิง)", key: "grlSlingX", th: "สลิง 2 เส้น + เผื่อต่อจุด", unit: "ม.", def: 20 },
    { sec: "walk", g: "ราวกันตก (สลิง)", key: "grlCorner", th: "เกลียวเร่ง/ปลอก ต่อมุม (กิ๊บ × 2)", unit: "ตัว", def: 4 },
    /* ── ค่าขออนุญาต ── */
    { sec: "permit", key: "gridMEA", th: "ค่าเชื่อมต่อระบบขนานไฟ · MEA (นครหลวง)", unit: "บาท", def: 2140 },
    { sec: "permit", key: "gridPEA", th: "ค่าเชื่อมต่อระบบขนานไฟ · PEA (ภูมิภาค)", unit: "บาท", def: 3745 },
    { sec: "permit", key: "meaProv", th: "จังหวัดที่เป็นเขต MEA (คำที่อยู่ในชื่อจังหวัด)", unit: "", type: "words", def: ["กรุงเทพ", "กทม", "bangkok", "นนทบุรี", "nonthaburi", "สมุทรปราการ", "samut prakan"] },
    { sec: "permit", key: "ercMin", th: "กกพ. จดแจ้งยกเว้น / พค.2 เมื่อระบบเกิน", unit: "kWp", def: 10 },
    { sec: "permit", key: "ercLic", th: "ตั้งแต่ขนาดนี้ต้องขอใบอนุญาตผลิตไฟฟ้า (กกพ.)", unit: "kWp", def: 1000 },
    { sec: "permit", key: "pk2Max", th: "พค.2 (พพ.) ถึงขนาด", unit: "kWp", def: 200 },
    { sec: "permit", key: "areaPerKw", th: "พื้นที่แผงโดยประมาณ ต่อ kWp", unit: "ตร.ม.", def: 4.5, min: 0.1 },
    { sec: "permit", key: "a1Area", th: "ต้องขอ อ.1 เมื่อพื้นที่แผงเกิน", unit: "ตร.ม.", def: 160 },
    { sec: "permit", key: "eng1Kw", th: "ค่าวิศวกร ขั้นที่ 1 · ระบบไม่เกิน", unit: "kWp", def: 10 },
    { sec: "permit", key: "eng1", th: "ค่าวิศวกร ขั้นที่ 1", unit: "บาท", def: 5000 },
    { sec: "permit", key: "eng2Kw", th: "ค่าวิศวกร ขั้นที่ 2 · ระบบไม่เกิน", unit: "kWp", def: 100 },
    { sec: "permit", key: "eng2", th: "ค่าวิศวกร ขั้นที่ 2", unit: "บาท", def: 10000 },
    { sec: "permit", key: "eng3", th: "ค่าวิศวกร ใหญ่กว่าขั้นที่ 2", unit: "บาท", def: 15000 },
    { sec: "price", only: "home", key: "accHome", th: "Accessories เผื่อ · งานบ้าน (% ของทุนวัสดุ)", unit: "%", def: 10, max: 100 },
    { sec: "price", only: "home", key: "accQuick", th: "Accessories เผื่อ · BOQ ด่วน (% ของทุนวัสดุ)", unit: "%", def: 15, max: 100 },
    { sec: "price", only: "proj", key: "accProj", th: "Accessories เผื่อ · งานโครงการ (% ของทุนวัสดุ)", unit: "%", def: 5, max: 100 },
    { sec: "price", key: "profitPct", th: "กำไรเริ่มต้น (% ของราคาขาย)", unit: "%", def: 15, max: 90 },
    { sec: "price", key: "vat", th: "ภาษีมูลค่าเพิ่ม", unit: "%", def: 7, max: 30 },
    { sec: "price", key: "omYears", th: "O&M ฟรี · ปีที่แถม", unit: "ปี", def: 2 },
    { sec: "price", key: "omPerYear", th: "O&M ฟรี · ล้างแผงปีละ", unit: "ครั้ง", def: 1 },
    { sec: "price", key: "omRound", th: "ราคาล้างแผง / งาน O&M (เฉลี่ยระหว่างขั้นของตาราง) ปัดขึ้นทีละ", unit: "บาท", def: 100, min: 1 },
    { sec: "plan", key: "pprLen", th: "ท่อ PPR 1 เส้นยาว", unit: "ม.", def: 4, min: 0.5 },
    { sec: "plan", key: "pprSpare", th: "ท่อ PPR เผื่อ", unit: "%", def: 10 },
    { sec: "plan", key: "pprTap", th: "ท่อเพิ่มต่อก๊อก 1 จุด", unit: "ม.", def: 0.2 },
    { sec: "plan", key: "pprClamp", th: "แคลมป์รัดท่อ ทุก", unit: "ม.", def: 1.2, min: 0.1 },
    { sec: "plan", key: "turn90", th: "มุมเลี้ยวตั้งแต่กี่องศานับเป็นข้องอ 90° (น้อยกว่า = 45°)", unit: "°", def: 60, max: 180 },
    { sec: "plan", key: "turn45", th: "มุมเลี้ยวน้อยกว่านี้ไม่นับข้องอ", unit: "°", def: 15, max: 180 },
  ];
  const RULES = {};
  /* แปลงค่าที่เก็บ (ข้อความ) → ค่าที่ใช้ · ผิดรูป/ว่าง/นอกช่วง = ค่าตั้งต้น */
  function ruleVal(d, raw) {
    if (raw === "" || raw == null) return d.def;
    if (d.type === "nums") {
      const a = String(raw).split(/[,\s]+/).map(Number).filter((x) => isFinite(x) && x > 0).sort((x, y) => x - y);
      return a.length ? a.filter((x, i) => i === 0 || x !== a[i - 1]) : d.def;
    }
    if (d.type === "pairs") {
      const m = {};
      String(raw).split(/[;\n]+/).forEach((ln) => {
        const p = ln.split(":"); if (p.length < 2) return;
        let h = ""; const left = p[0].replace(/\[([^\]]*)\]/, (_, x) => { h = x.trim(); return " "; });
        const lm = left.trim().match(/^([\d.]+)\s*(?:V(?:DC)?)?\s*(.*)$/i); if (!lm) return;
        const v = +lm[1]; if (!(v > 0)) return;
        const pole = d.poles ? (lm[2].trim().toUpperCase().replace(/\s+/g, "") || d.poleDef) : "";
        const a = p[1].split(/[,\s]+/).map(Number).filter((x) => isFinite(x) && x > 0);
        const k = v + "|" + pole;
        m[k] = { v: v, p: pole, h: h || (m[k] && m[k].h) || "", a: ((m[k] && m[k].a) || []).concat(a) };
      });
      const hDef = (v) => { const q = d.holder && Array.isArray(d.def) ? d.def.find((x) => x.v === v) : null; return (q && q.h) || ""; };
      const out = Object.keys(m).map((k) => m[k]).map((r) => Object.assign({ v: r.v }, d.poles ? { p: r.p } : {},
        d.holder && (r.h || hDef(r.v)) ? { h: r.h || hDef(r.v) } : {}, { a: Array.from(new Set(r.a)).sort((x, y) => x - y) }))
        .filter((r) => r.a.length).sort((x, y) => x.v - y.v || String(x.p || "").localeCompare(String(y.p || "")));
      return out.length ? out : d.def;
    }
    if (d.type === "words") {
      const a = String(raw).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
      return a.length ? a : d.def;
    }
    const v = +raw;
    if (!isFinite(v) || v < (d.min != null ? d.min : 0) || (d.max != null && v > d.max)) return d.def;
    return v;
  }
  /* ── ใช้ร่วม / งานบ้าน / งานโครงการ ──
     ทุกแถวมีค่าเดียว เก็บที่ boqRules/<key> · แถวที่ใช้กับงานประเภทเดียว (หัวย่อย g "งานบ้าน"/"งานโครงการ" หรือ only) โชว์ในแท็บประเภทนั้น
     ที่เหลือ = ใช้ร่วมทั้งสองประเภท (ผู้ใช้: แยกเฉพาะข้อที่ต่างกันจริง)
     ค่าเก่าที่เคยตั้งแยก boqRules/home|proj/<key> ใช้เมื่อยังไม่มีค่ากลาง (งานโครงการก่อน แล้วงานบ้าน — ได้ค่าเดียวกันทั้งสองประเภท)
     RULES = ชุดของประเภทงานที่กำลังคิด (useRuleType) · ฟังก์ชันที่ส่งออกทุกตัวสลับชุดเองเมื่อได้ใบ/งานที่บอกประเภท (ห่อท้ายไฟล์) */
  const ruleOnly = (d) => d.only || (d.g === "งานบ้าน" ? "home" : d.g === "งานโครงการ" ? "proj" : null);
  /* "ของที่มีขาย" (รายการขนาด/แรงดันที่มีจริง · type nums/pairs) เป็นของชิ้นเดียวกันทั้งงานบ้านและงานโครงการ
     → เก็บค่าเดียวที่ boqRules/<key> เหมือนแถวประเภทเดียว · ค่าที่เคยตั้งแยก home/proj ไว้ใช้เมื่อยังไม่มีค่ากลาง */
  const ruleFlat = () => true;
  const ruleRaw = (src, d) => {
    const s = src || {};
    const has = (x) => x != null && x !== "";
    const pick = (k) => { const f = s[k];
      if (ruleOnly(d) || has(f)) return f;
      const p = (s.proj || {})[k];
      return has(p) ? p : (s.home || {})[k]; };
    const r = pick(d.key);
    if ((r == null || r === "") && d.legacyV) {
      const rv = pick(d.legacyV);
      if (rv == null || rv === "") return r;
      const V = ruleVal({ type: "nums", def: d.def.map((p) => p.v) }, rv);
      return V.map((v) => v + " " + d.poleDef + ": " + d.def[0].a.join(", ")).join("; ");
    }
    if ((r == null || r === "") && d.legacy) {
      /* ค่าเก่าที่ตั้งเป็นรายการ A กับรายการ V แยกกัน → ทุกแรงดันมีทุกขนาด (เหมือนที่ระบบเคยคิด) จนกว่าจะบันทึกแบบคู่ */
      const ra = pick(d.legacy[0]), rv = pick(d.legacy[1]);
      if ((ra == null || ra === "") && (rv == null || rv === "")) return r;
      const nums = (x, def) => ruleVal({ type: "nums", def: def }, x);
      const A = nums(ra, d.def[0].a), V = nums(rv, d.def.map((p) => p.v));
      return V.map((v) => v + (d.poles ? " " + d.poleDef : "") + ": " + A.join(", ")).join("; ");
    }
    return r;
  };
  const RULES_T = { home: {}, proj: {} };
  let ruleType = "proj";
  function useRuleType(t) {
    t = t === "home" ? "home" : "proj";
    ruleType = t;
    Object.assign(RULES, RULES_T[t]);
    /* ค่าที่ส่งออกเป็นตัวเลขตรง ๆ (หน้าอื่นอ่าน window.BOQ.VAT_RATE) ต้องตามด้วย */
    if (window.BOQ) Object.assign(window.BOQ, { VAT_RATE: RULES.vat, PROFIT_PCT_DEF: RULES.profitPct, PV_DC_SPARE: RULES.pvSpare,
      ACC_ALLOW_PCT: RULES_T.proj.accProj, ACC_ALLOW_PCT_HOME: RULES_T.home.accHome,
      PERMIT_GRID_FEE: { MEA: RULES.gridMEA, PEA: RULES.gridPEA }, DCAC_LIMIT: RULES.dcacMax });
    return t;
  }
  function setRules(v) {
    ["home", "proj"].forEach((t) => {
      RULE_DEFS.forEach((d) => { RULES_T[t][d.key] = ruleVal(d, ruleRaw(v, d, t)); });
      const ats = (L) => { const at = {}; (L || []).forEach((p) => p.a.forEach((a) => { at[a] = 1; })); return Object.keys(at).map(Number).sort((x, y) => x - y); };
      RULES_T[t].mccbAtMain = ats(RULES_T[t].mccbMain);
      RULES_T[t].mccbAtInv = ats(RULES_T[t].mccbInv);
    });
    useRuleType(ruleType);
  }
  setRules(null);
  const ruleTxt = (d, v) => (d && d.type === "pairs" && Array.isArray(v) ? v.map((p) => p.v + (p.p ? " " + p.p : "") + (p.h ? " [" + p.h + "]" : "") + ": " + p.a.join(", ")).join("; ")
    : Array.isArray(v) ? v.join(", ") : String(v));
  /* เลือกจากของที่ขายเป็นคู่: แรงดันต่ำสุดที่ ≥ needV และมีขนาด ≥ needA → ขนาดแรกที่ ≥ needA
     ไม่มีคู่ที่ผ่านทั้งสอง = ยึดแรงดันก่อน (ขนาดใหญ่สุดของแรงดันนั้น okA false) · แรงดันไม่พอเลย = แรงดันสูงสุด (okV false) */
  function pairPick(P, needV, needA, poleOk) {
    P = P || [];
    /* poleOk(p) = ขั้วที่ใช้ได้ (ไม่ส่ง = ขั้วไหนก็ได้) · ไม่มีขั้วที่ใช้ได้เลย = เลือกจากทั้งหมดแล้ว okP false */
    let okP = true;
    if (poleOk) { const Q = P.filter((p) => poleOk(p.p)); if (Q.length) P = Q; else okP = false; }
    const r = pairPick0(P, needV, needA); r.okP = okP; return r;
  }
  /* MCCB: w = "main" (เมนตู้ AC) / อื่น = อินเวอร์เตอร์ · เฟรม AF เล็กสุดที่มีขนาด AT นี้ + kA ของเฟรม · ไม่มีในตาราง = ชื่อแบบไม่มี AF
     เมน: ต่อท้าย " TM-D" (ปรับตั้งได้ · ชื่อไม่ชนกับรุ่นอินเวอร์เตอร์ที่ AF/AT/kA เท่ากัน) · lsig = trip unit LSIG แทน */
  function mccbFrame(at, w) { const r = (RULES[w === "main" ? "mccbMain" : "mccbInv"] || []).find((p) => p.a.indexOf(+at) >= 0); return r ? { af: r.v, ka: r.h || "" } : null; }
  function mccbName(at, w, lsig) { return mccbName0(at, w) + (w === "main" ? (lsig ? " LSIG" : " TM-D") : ""); }
  function mccbName0(at, w) { const f = mccbFrame(at, w); return "MCCB 3P " + (f ? f.af + "AF " : "") + at + "AT" + (f && f.ka ? " " + String(f.ka).replace(/\s*kA$/i, "") + "kA" : ""); }
  /* ชื่อ SPD ตามที่เลือกได้ (ต้องตรงกับชื่อในคลัง) · Type II In = Imax/2 */
  function spdName(kind, s) {
    const k = (x) => Math.round(x * 100) / 100;
    if (kind === "dc2") return "DC SPD " + s.p + " " + s.v + "VDC " + k(s.a / 2) + "-" + k(s.a) + "KA";
    if (kind === "dc12") return "DC SPD " + s.p + " " + s.v + "VDC TYPE I+II Iimp" + k(s.a) + "KA";
    if (kind === "ac2") return "AC SPD TYPE II " + s.p + " Uc" + s.v + "V In" + k(s.a / 2) + "Ka/Imax" + k(s.a) + "Ka";
    return "AC SPD TYPE I+II " + s.p + " Uc" + s.v + "V Iimp" + k(s.a) + "kA";
  }
  function pairPick0(P, needV, needA) {
    for (const p of P) if (p.v >= needV) { const a = p.a.find((x) => x >= needA); if (a != null) return { v: p.v, p: p.p, h: p.h, a: a, okV: true, okA: true }; }
    const vOk = P.filter((p) => p.v >= needV);
    if (vOk.length) { const p = vOk.reduce((m, q) => (q.a[q.a.length - 1] > m.a[m.a.length - 1] ? q : m)); return { v: p.v, p: p.p, h: p.h, a: p.a[p.a.length - 1], okV: true, okA: false }; }
    const p = P[P.length - 1]; if (!p) return { v: 0, a: 0, okV: false, okA: false };
    const a = p.a.find((x) => x >= needA);
    return { v: p.v, p: p.p, h: p.h, a: a != null ? a : p.a[p.a.length - 1], okV: false, okA: a != null };
  }
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

  /* ── Smart Module Controller / Optimizer ──
     ติดหลังแผงทีละใบ แปลงแรงดันของแผงใบนั้นก่อนส่งเข้าสตริง ทำให้
       · แผงในสตริงเดียวกันไม่ต้องทิศ/มุมเดียวกัน และเงาบังใบเดียวไม่ฉุดทั้งสตริง
       · แรงดันสตริงไม่ใช่ Voc ของแผง × จำนวนแผงอีกต่อไป — ตัวคุมจะปรับให้อยู่ในช่วงที่อินเวอร์เตอร์รับได้
       · ตอนสั่งปิด (rapid shutdown) เหลือแรงดันแค่ vOff ต่อตัว ซึ่งคือเหตุผลด้านความปลอดภัยที่คนติดกัน

     ฟิลด์: w = กำลังแผงสูงสุดที่รับได้ · vInMax/mpptMin/mpptMax/iscMax = ฝั่งเข้า (ต้องครอบสเปคแผง)
            vOutMax/iOutMax = ฝั่งออก (ใช้คิดว่าต่อได้กี่ตัวต่อสตริง) · eff = ประสิทธิภาพ
            vOff = แรงดันคงเหลือต่อตัวตอนปิด · perPanel = 1 ตัวคุมกี่แผง
     ว่างไว้ทั้งอาเรย์ — setOptimizers() จะเติมจากคลังสินค้าเหมือน PANELS/INVERTERS */
  const OPTIMIZERS = [];

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
  };

  const COMBINER = { 1: "M-Combiner 1P (MC-100)", 3: "M-Combiner 3P (MC-100T)" };
  const CT       = { 1: "CT 250A x1", 3: "CT 250A x3" };
  const BACKUP   = { 1: "M-Backup 1P (MU100-S)", 3: "M-Backup 3P (MU100-T)" };
  const JUNCTION = { 1: "Single-phase junction adapter", 3: "Three-phase junction adapter" };
  const BATTERY_MODEL = "7kWh M-Battery (MS-7K-U)";
  const BATTERY_UNIT_KWH = 7;

  // ── ขนาดเบรกเกอร์มาตรฐาน (AT) — เลือกจากกระแส × 1.25 ปัดขึ้นขนาดถัดไป ──
  const BREAKER_AT = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 225, 250, 320, 400, 500, 630];
  function pickBreakerAT(amp) { const v = (+amp || 0) * RULES.fixK; for (let i = 0; i < BREAKER_AT.length; i++) { if (BREAKER_AT[i] >= v) return BREAKER_AT[i]; } return BREAKER_AT[BREAKER_AT.length - 1]; }

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
  // ชื่อ MCB/RCCB ตามสเปค CHINT ในคลัง (ผู้ใช้ ต.ค. 2026: "MCB 2P 25A" · "RCCB 25A 2P 100mA") — เลิกใช้ชื่อเก่า "MCB 2P 25AT" / "… 10AT 400V"
  const ATMOCE_ASM_POLE = {
    3: { pole: "4P", mcb25: "MCB 4P 25A", spd: "AC SPD TYPE II 4P Uc385V In20Ka/Imax40Ka", mcb10: "MCB 4P 10A" },
    1: { pole: "2P", mcb25: "MCB 2P 25A", spd: "AC SPD TYPE II 2P Uc275V In20Ka/Imax40Ka",   mcb10: "MCB 2P 10A" },
  };
  // สร้างรายการอุปกรณ์ในตู้ประกอบ — iMicro/iBatt = กระแสรวม (A) · hasBatt = มีแบตเตอรี่ · phase = 1|3
  // RCCB เลือกจากกระแสรวม (ไมโคร+แบต) · MCB ไมโคร/แบต เลือกตามกระแสแต่ละชุด (×1.25)
  function atmoceAssembled(iMicro, iBatt, hasBatt, phase) {
    const cfg = ATMOCE_ASM_POLE[phase === 3 ? 3 : 1];
    const out = [];
    out.push(ATMOCE_ASM_ENCLOSURE);                                                                                         // ตัวตู้หน้ากระจก เบอร์4
    const rcA = pickBreakerAT(iMicro + iBatt), rcL = (phase === 3 ? RULES.rccb4P : RULES.rccb2P) || [25, 40, 63];
    out.push({ name: "RCCB " + (rcL.find((a) => a >= rcA) || rcL[rcL.length - 1]) + "A " + cfg.pole + " " + RULES.rcboMa + "mA", qty: 1, unit: "ตัว" });  // ตามกระแสรวม BAT+Micro · ขนาด RCCB ที่มีขาย
    out.push({ name: cfg.mcb25, qty: 1, unit: "ตัว" });                                                                     // MCB 25AT เท่าเดิม
    out.push({ name: cfg.spd, qty: 1, unit: "ตัว" });                                                                       // AC SPD เท่าเดิม
    if (hasBatt) out.push({ name: "MCB " + cfg.pole + " " + pickBreakerAT(iBatt) + "A", qty: 1, unit: "ตัว", note: "แบตเตอรี่" });  // ตามกระแสรวม BATTERY
    out.push({ name: "MCB " + cfg.pole + " " + pickBreakerAT(iMicro) + "A", qty: 1, unit: "ตัว", note: "ไมโคร" });            // ตามกระแสรวม Micro
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
  /* ความยาวท่อน RAIL ที่มีขาย (กฎ railLens) · ชื่อ 4.2/4.8 ตรงกับคลังเดิม (มีช่องว่างท้าย) */
  function railLens() { const a = RULES.railLens; return Array.isArray(a) && a.length ? a : [4.2]; }

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
  const PV_DC_SPARE = 1.2;   // ค่าตั้งต้น — ใช้จริง RULES.pvSpare
  function pvDcLength(farthest, strings) {
    const L = Math.max(0, +farthest || 0);
    const n = Math.max(1, Math.round(+strings || 1));
    const perPole = Math.round(L * n * RULES.pvSpare * 100) / 100;
    return { farthest: L, strings: n, spare: RULES.pvSpare, perPole: perPole, total: Math.round(perPole * 2 * 100) / 100 };
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
  /* ตารางพิกัดกระแสมาตรฐาน วสท. — ทองแดง (แอมแปร์) ครบทุกวิธีเดินสาย ทั้ง PVC 70°C และ XLPE 90°C
     ค่าที่กรอกจากหน้าคลัง › พิกัดกระแสสายไฟ ฝังเป็นค่าตั้งต้นไว้ที่นี่ (1 ต.ค. 2026) — กดคืนค่าในหน้าคลังแล้วไม่หาย
     ค่าที่แก้ในหน้าคลังภายหลังยังทับค่านี้ได้เหมือนเดิม (setAmpacity) */
  const DEFAULT_AMPACITY = {
    pvc: {
      // เดินในท่อ (กลุ่ม 1, 2, 5)
      conduitAir: {
        "g1|2|multi":  { 1: 10, 1.5: 12, 2.5: 16, 4: 22, 6: 28, 10: 37, 16: 50, 25: 65, 35: 80, 50: 96, 70: 121, 95: 145, 120: 167, 150: 191, 185: 216, 240: 253, 300: 291 },
        "g1|2|single": { 1: 10, 1.5: 13, 2.5: 17, 4: 23, 6: 30, 10: 40, 16: 53, 25: 70, 35: 86, 50: 104, 70: 131, 95: 158, 120: 183, 150: 209, 185: 238, 240: 279, 300: 319 },
        "g1|3|multi":  { 1: 9, 1.5: 11, 2.5: 15, 4: 20, 6: 25, 10: 34, 16: 45, 25: 59, 35: 72, 50: 86, 70: 109, 95: 131, 120: 150, 150: 171, 185: 194, 240: 227, 300: 259 },
        "g1|3|single": { 1: 9, 1.5: 12, 2.5: 16, 4: 21, 6: 27, 10: 37, 16: 49, 25: 64, 35: 77, 50: 94, 70: 118, 95: 143, 120: 164, 150: 188, 185: 213, 240: 249, 300: 285 },
        "g2|2|multi":  { 1: 11, 1.5: 14, 2.5: 20, 4: 26, 6: 33, 10: 45, 16: 60, 25: 78, 35: 97, 50: 116, 70: 146, 95: 175, 120: 202, 150: 224, 185: 256, 240: 299, 300: 343 },
        "g2|2|single": { 1: 12, 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 66, 25: 88, 35: 109, 50: 131, 70: 167, 95: 202, 120: 234, 150: 261, 185: 297, 240: 348, 300: 398, 400: 475, 500: 545 },
        "g2|3|multi":  { 1: 10, 1.5: 13, 2.5: 17, 4: 23, 6: 30, 10: 40, 16: 54, 25: 70, 35: 86, 50: 103, 70: 130, 95: 156, 120: 179, 150: 196, 185: 222, 240: 258, 300: 295 },
        "g2|3|single": { 1: 10, 1.5: 13, 2.5: 18, 4: 24, 6: 31, 10: 44, 16: 59, 25: 77, 35: 96, 50: 117, 70: 149, 95: 180, 120: 208, 150: 228, 185: 258, 240: 301, 300: 343, 400: 406, 500: 464 },
        "g5|2|any":    { 1: 17, 1.5: 21, 2.5: 28, 4: 36, 6: 46, 10: 62, 16: 81, 25: 106, 35: 129, 50: 153, 70: 190, 95: 232, 120: 265, 150: 303, 185: 344, 240: 404, 300: 462, 400: 529, 500: 605 },
        "g5|3|any":    { 1: 15, 1.5: 19, 2.5: 25, 4: 33, 6: 41, 10: 55, 16: 72, 25: 94, 35: 114, 50: 136, 70: 168, 95: 204, 120: 234, 150: 266, 185: 303, 240: 361, 300: 404, 400: 462, 500: 527 },
      },
      // เกาะผนัง/เพดานโดยตรง (กลุ่ม 3)
      surface: {
        "g3|2|multi":  { 1: 13, 1.5: 17, 2.5: 23, 4: 31, 6: 40, 10: 55, 16: 74, 25: 97, 35: 120, 50: 146, 70: 185, 95: 224, 120: 260, 150: 299, 185: 341, 240: 401, 300: 461 },
        "g3|2|single": { 1: 13, 1.5: 17, 2.5: 23, 4: 32, 6: 41, 10: 57, 16: 76, 25: 99, 35: 123, 50: 158, 70: 204, 95: 247, 120: 287, 150: 331, 185: 379, 240: 448, 300: 517, 400: 604, 500: 689 },
        "g3|3|multi":  { 1: 12, 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 66, 25: 84, 35: 104, 50: 125, 70: 160, 95: 194, 120: 225, 150: 260, 185: 297, 240: 351, 300: 404 },
        "g3|3|single": { 1: 12, 1.5: 16, 2.5: 22, 4: 29, 6: 37, 10: 51, 16: 69, 25: 90, 35: 112, 50: 145, 70: 186, 95: 227, 120: 264, 150: 304, 185: 348, 240: 411, 300: 474, 400: 552, 500: 629 },
      },
      // บนลูกถ้วยในอากาศ (กลุ่ม 4)
      insulator: {
        "g4|2|horiz": { 4: 30, 6: 39, 10: 56, 16: 78, 25: 113, 35: 141, 50: 171, 70: 221, 95: 271, 120: 315, 150: 356, 185: 418, 240: 495, 300: 573, 400: 692 },
        "g4|2|vert":  { 4: 30, 6: 39, 10: 56, 16: 78, 25: 113, 35: 141, 50: 171, 70: 221, 95: 271, 120: 315, 150: 365, 185: 418, 240: 495, 300: 573, 400: 692 },
        "g4|3|horiz": { 4: 37, 6: 48, 10: 67, 16: 92, 25: 127, 35: 157, 50: 191, 70: 244, 95: 297, 120: 345, 150: 397, 185: 453, 240: 535, 300: 617, 400: 741 },
        "g4|3|vert":  { 4: 37, 6: 48, 10: 67, 16: 92, 25: 127, 35: 157, 50: 191, 70: 244, 95: 297, 120: 345, 150: 397, 185: 453, 240: 535, 300: 617, 400: 741 },
      },
      // ฝังดินโดยตรง (กลุ่ม 6)
      buried: {
        "g6|2|any": { 1: 21, 1.5: 26, 2.5: 35, 4: 45, 6: 57, 10: 76, 16: 99, 25: 128, 35: 154, 50: 181, 70: 223, 95: 267, 120: 304, 150: 342, 185: 386, 240: 448, 300: 507, 400: 577, 500: 654 },
        "g6|3|any": { 1: 21, 1.5: 26, 2.5: 35, 4: 45, 6: 57, 10: 76, 16: 99, 25: 128, 35: 154, 50: 181, 70: 223, 95: 267, 120: 304, 150: 342, 185: 386, 240: 448, 300: 507, 400: 577, 500: 654 },
      },
      // รางเคเบิลด้านล่างทึบ เปิดฝา (กลุ่ม 7)
      traySolid: {
        "g7|2|multi":  { 1: 13, 1.5: 17, 2.5: 23, 4: 31, 6: 40, 10: 55, 16: 74, 25: 97, 35: 120, 50: 146, 70: 185, 95: 224, 120: 260, 150: 299, 185: 341, 240: 401, 300: 461 },
        "g7|2|single": { 25: 99, 35: 123, 50: 158, 70: 204, 95: 247, 120: 287, 150: 331, 185: 379, 240: 448, 300: 517, 400: 604, 500: 689 },
        "g7|3|multi":  { 1: 12, 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 50, 16: 66, 25: 84, 35: 104, 50: 125, 70: 160, 95: 194, 120: 225, 150: 260, 185: 297, 240: 351, 300: 404 },
        "g7|3|single": { 25: 90, 35: 112, 50: 145, 70: 186, 95: 227, 120: 264, 150: 304, 185: 348, 240: 411, 300: 474, 400: 552, 500: 629 },
      },
      // รางเคเบิลระบายอากาศ เปิดฝา (กลุ่ม 7)
      trayPerf: {
        "g7|2|multi":  { 1: 15, 1.5: 19, 2.5: 26, 4: 35, 6: 44, 10: 61, 16: 82, 25: 104, 35: 129, 50: 157, 70: 202, 95: 245, 120: 285, 150: 330, 185: 378, 240: 447, 300: 516 },
        "g7|2|single": { 25: 114, 35: 141, 50: 171, 70: 218, 95: 264, 120: 306, 150: 353, 185: 403, 240: 475, 300: 547, 400: 666, 500: 755 },
        "g7|3|multi":  { 1: 13, 1.5: 16, 2.5: 22, 4: 30, 6: 37, 10: 52, 16: 70, 25: 88, 35: 110, 50: 133, 70: 171, 95: 207, 120: 240, 150: 278, 185: 317, 240: 374, 300: 432 },
        "g7|3|single": { 25: 99, 35: 124, 50: 151, 70: 196, 95: 239, 120: 279, 150: 324, 185: 371, 240: 441, 300: 511, 400: 559, 500: 686 },
      },
      // รางเคเบิลแบบบันได เปิดฝา (กลุ่ม 7)
      ladder: {
        "g7|2|multi":  { 1: 15, 1.5: 19, 2.5: 26, 4: 35, 6: 44, 10: 61, 16: 82, 25: 104, 35: 129, 50: 157, 70: 202, 95: 245, 120: 285, 150: 330, 185: 378, 240: 447, 300: 516 },
        "g7|2|single": { 25: 114, 35: 141, 50: 171, 70: 218, 95: 264, 120: 306, 150: 353, 185: 403, 240: 475, 300: 547, 400: 656, 500: 755 },
        "g7|3|multi":  { 1: 13, 1.5: 16, 2.5: 22, 4: 30, 6: 37, 10: 52, 16: 70, 25: 88, 35: 110, 50: 133, 70: 171, 95: 207, 120: 240, 150: 278, 185: 317, 240: 374, 300: 432 },
        "g7|3|single": { 25: 99, 35: 124, 50: 151, 70: 196, 95: 239, 120: 279, 150: 324, 185: 371, 240: 441, 300: 511, 400: 599, 500: 686 },
      },
      // รางเคเบิลปิดฝา (กลุ่ม 7)
      trayCover: {
        "g7|2|multi":  { 1: 11, 1.5: 14, 2.5: 20, 4: 26, 6: 33, 10: 45, 16: 60, 25: 78, 35: 97, 50: 116, 70: 146, 95: 175, 120: 202, 150: 224, 185: 256, 240: 299, 300: 343 },
        "g7|2|single": { 25: 88, 35: 109, 50: 131, 70: 167, 95: 202, 120: 234, 150: 261, 185: 279, 240: 348, 300: 398, 400: 475, 500: 545 },
        "g7|3|multi":  { 1: 10, 1.5: 13, 2.5: 17, 4: 23, 6: 30, 10: 40, 16: 54, 25: 70, 35: 86, 50: 103, 70: 130, 95: 156, 120: 179, 150: 196, 185: 222, 240: 258, 300: 295 },
        "g7|3|single": { 25: 77, 35: 96, 50: 117, 70: 149, 95: 180, 120: 208, 150: 228, 185: 258, 240: 301, 300: 343, 400: 406, 500: 464 },
      },
    },
    xlpe: {
      // เดินในท่อ (กลุ่ม 1, 2, 5)
      conduitAir: {
        "g1|2|multi":  { 1: 13, 1.5: 17, 2.5: 23, 4: 30, 6: 38, 10: 52, 16: 69, 25: 90, 35: 110, 50: 132, 70: 167, 95: 200, 120: 230, 150: 264, 185: 299, 240: 351, 300: 402 },
        "g1|2|single": { 1: 13, 1.5: 17, 2.5: 24, 4: 32, 6: 41, 10: 56, 16: 74, 25: 96, 35: 119, 50: 144, 70: 182, 95: 219, 120: 253, 150: 289, 185: 329, 240: 386, 300: 442 },
        "g1|3|multi":  { 1: 12, 1.5: 15, 2.5: 20, 4: 27, 6: 35, 10: 46, 16: 62, 25: 81, 35: 99, 50: 118, 70: 149, 95: 179, 120: 207, 150: 236, 185: 268, 240: 315, 300: 360 },
        "g1|3|single": { 1: 12, 1.5: 15, 2.5: 21, 4: 28, 6: 36, 10: 49, 16: 66, 25: 86, 35: 106, 50: 128, 70: 163, 95: 197, 120: 227, 150: 259, 185: 295, 240: 346, 300: 396 },
        "g2|2|multi":  { 1: 15, 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 83, 25: 108, 35: 133, 50: 159, 70: 201, 95: 241, 120: 278, 150: 304, 185: 349, 240: 418, 300: 484 },
        "g2|2|single": { 1: 15, 1.5: 21, 2.5: 28, 4: 38, 6: 49, 10: 68, 16: 91, 25: 121, 35: 149, 50: 180, 70: 230, 95: 278, 120: 322, 150: 358, 185: 409, 240: 480, 300: 549, 400: 622, 500: 713 },
        "g2|3|multi":  { 1: 14, 1.5: 18, 2.5: 24, 4: 32, 6: 40, 10: 55, 16: 73, 25: 96, 35: 116, 50: 140, 70: 177, 95: 212, 120: 244, 150: 273, 185: 309, 240: 362, 300: 414 },
        "g2|3|single": { 1: 14, 1.5: 18, 2.5: 25, 4: 34, 6: 44, 10: 60, 16: 80, 25: 106, 35: 131, 50: 159, 70: 202, 95: 245, 120: 284, 150: 311, 185: 349, 240: 410, 300: 468, 400: 531, 500: 606 },
        "g5|2|any":    { 1.5: 25, 2.5: 33, 4: 43, 6: 54, 10: 71, 16: 94, 25: 124, 35: 150, 50: 180, 70: 223, 95: 271, 120: 313, 150: 355, 185: 406, 240: 477, 300: 543, 400: 625, 500: 717 },
        "g5|3|any":    { 1.5: 22, 2.5: 29, 4: 38, 6: 47, 10: 63, 16: 83, 25: 109, 35: 132, 50: 159, 70: 196, 95: 238, 120: 275, 150: 312, 185: 356, 240: 418, 300: 475, 400: 545, 500: 623 },
      },
      // เกาะผนัง/เพดานโดยตรง (กลุ่ม 3)
      surface: {
        "g3|2|multi":  { 1: 17, 1.5: 22, 2.5: 30, 4: 41, 6: 53, 10: 73, 16: 97, 25: 126, 35: 156, 50: 190, 70: 245, 95: 298, 120: 348, 150: 401, 185: 460, 240: 545, 300: 630 },
        "g3|2|single": { 1: 17, 1.5: 23, 2.5: 31, 4: 42, 6: 54, 10: 74, 16: 99, 25: 130, 35: 160, 50: 207, 70: 267, 95: 323, 120: 375, 150: 443, 185: 496, 240: 586, 300: 676, 400: 790, 500: 900 },
        "g3|3|multi":  { 1: 15, 1.5: 20, 2.5: 27, 4: 36, 6: 47, 10: 65, 16: 87, 25: 108, 35: 134, 50: 163, 70: 208, 95: 253, 120: 293, 150: 338, 185: 386, 240: 455, 300: 524 },
        "g3|3|single": { 1: 16, 1.5: 21, 2.5: 29, 4: 37, 6: 49, 10: 67, 16: 90, 25: 118, 35: 147, 50: 190, 70: 244, 95: 297, 120: 345, 150: 397, 185: 455, 240: 537, 300: 620, 400: 722, 500: 823 },
      },
      // บนลูกถ้วยในอากาศ (กลุ่ม 4)
      insulator: {
        "g4|2|horiz": { 4: 54, 6: 68, 10: 90, 16: 124, 25: 166, 35: 206, 50: 250, 70: 321, 95: 391, 120: 455, 150: 525, 185: 602, 240: 711, 300: 821, 400: 987, 500: 1140 },
        "g4|2|vert":  { 4: 54, 6: 68, 10: 90, 16: 124, 25: 166, 35: 206, 50: 250, 70: 321, 95: 391, 120: 455, 150: 525, 185: 602, 240: 711, 300: 821, 400: 987, 500: 1140 },
        "g4|3|horiz": { 4: 47, 6: 60, 10: 82, 16: 110, 25: 147, 35: 183, 50: 224, 70: 289, 95: 354, 120: 413, 150: 480, 185: 551, 240: 654, 300: 758, 400: 917, 500: 1064 },
        "g4|3|vert":  { 4: 47, 6: 60, 10: 82, 16: 110, 25: 147, 35: 183, 50: 224, 70: 289, 95: 354, 120: 413, 150: 480, 185: 551, 240: 654, 300: 758, 400: 917, 500: 1064 },
      },
      // ฝังดินโดยตรง (กลุ่ม 6)
      buried: {
        "g6|2|any": { 1.5: 33, 2.5: 43, 4: 55, 6: 70, 10: 92, 16: 119, 25: 152, 35: 184, 50: 217, 70: 266, 95: 318, 120: 362, 150: 406, 185: 459, 240: 533, 300: 601, 400: 684, 500: 777 },
        "g6|3|any": { 1.5: 33, 2.5: 43, 4: 55, 6: 70, 10: 92, 16: 119, 25: 152, 35: 184, 50: 217, 70: 266, 95: 318, 120: 362, 150: 406, 185: 459, 240: 533, 300: 601, 400: 684, 500: 777 },
      },
      // รางเคเบิลด้านล่างทึบ เปิดฝา (กลุ่ม 7)
      traySolid: {
        "g7|2|multi":  { 1: 17, 1.5: 22, 2.5: 30, 4: 41, 6: 53, 10: 73, 16: 97, 25: 126, 35: 156, 50: 190, 70: 245, 95: 298, 120: 348, 150: 401, 185: 460, 240: 545, 300: 630 },
        "g7|2|single": { 25: 130, 35: 160, 50: 207, 70: 267, 95: 323, 120: 376, 150: 433, 185: 496, 240: 586, 300: 676, 400: 790, 500: 901 },
        "g7|3|multi":  { 1: 15, 1.5: 20, 2.5: 27, 4: 36, 6: 47, 10: 65, 16: 87, 25: 108, 35: 134, 50: 163, 70: 208, 95: 253, 120: 293, 150: 338, 185: 386, 240: 455, 300: 524 },
        "g7|3|single": { 25: 118, 35: 147, 50: 190, 70: 244, 95: 297, 120: 345, 150: 397, 185: 455, 240: 537, 300: 620, 400: 722, 500: 823 },
      },
      // รางเคเบิลระบายอากาศ เปิดฝา (กลุ่ม 7)
      trayPerf: {
        "g7|2|multi":  { 1: 19, 1.5: 24, 2.5: 33, 4: 45, 6: 57, 10: 78, 16: 105, 25: 136, 35: 168, 50: 205, 70: 263, 95: 320, 120: 374, 150: 430, 185: 493, 240: 583, 300: 674 },
        "g7|2|single": { 25: 147, 35: 182, 50: 220, 70: 282, 95: 343, 120: 398, 150: 459, 185: 523, 240: 618, 300: 713, 400: 855, 500: 986 },
        "g7|3|multi":  { 1: 16, 1.5: 21, 2.5: 29, 4: 38, 6: 49, 10: 68, 16: 91, 25: 116, 35: 144, 50: 175, 70: 224, 95: 271, 120: 315, 150: 363, 185: 415, 240: 490, 300: 564 },
        "g7|3|single": { 25: 128, 35: 160, 50: 197, 70: 254, 95: 311, 120: 364, 150: 422, 185: 485, 240: 577, 300: 670, 400: 790, 500: 908 },
      },
      // รางเคเบิลแบบบันได เปิดฝา (กลุ่ม 7)
      ladder: {
        "g7|2|multi":  { 1: 19, 1.5: 24, 2.5: 33, 4: 45, 6: 57, 10: 78, 16: 105, 25: 136, 35: 168, 50: 205, 70: 263, 95: 320, 120: 374, 150: 430, 185: 493, 240: 583, 300: 674 },
        "g7|2|single": { 25: 147, 35: 182, 50: 220, 70: 282, 95: 343, 120: 398, 150: 459, 185: 523, 240: 618, 300: 713, 400: 855, 500: 986 },
        "g7|3|multi":  { 1: 16, 1.5: 21, 2.5: 29, 4: 38, 6: 49, 10: 68, 16: 91, 25: 116, 35: 144, 50: 175, 70: 224, 95: 271, 120: 315, 150: 363, 185: 415, 240: 490, 300: 564 },
        "g7|3|single": { 25: 128, 35: 160, 50: 197, 70: 254, 95: 311, 120: 364, 150: 422, 185: 485, 240: 577, 300: 670, 400: 790, 500: 908 },
      },
      // รางเคเบิลปิดฝา (กลุ่ม 7)
      trayCover: {
        "g7|2|multi":  { 1: 15, 1.5: 20, 2.5: 27, 4: 36, 6: 46, 10: 63, 16: 83, 25: 108, 35: 133, 50: 159, 70: 201, 95: 241, 120: 278, 150: 304, 185: 349, 240: 418, 300: 484 },
        "g7|2|single": { 25: 121, 35: 149, 50: 180, 70: 230, 95: 278, 120: 322, 150: 358, 185: 409, 240: 480, 300: 549, 400: 622, 500: 713 },
        "g7|3|multi":  { 1: 14, 1.5: 18, 2.5: 24, 4: 32, 6: 40, 10: 55, 16: 73, 25: 96, 35: 116, 50: 140, 70: 177, 95: 212, 120: 244, 150: 373, 185: 309, 240: 362, 300: 414 },
        "g7|3|single": { 25: 106, 35: 131, 50: 159, 70: 202, 95: 245, 120: 384, 150: 311, 185: 349, 240: 410, 300: 468, 400: 531, 500: 606 },
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
  const acTk = () => (+RULES.acTempK > 0 ? +RULES.acTempK : 1);
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
    const d = (+opts.derate > 0 ? +opts.derate : 1) * acTk();
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
    const d = (+opts.derate > 0 ? +opts.derate : 1) * acTk();   // × ตัวคูณอุณหภูมิแวดล้อม (กฎ acTempK)
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
  /* ขนาดเล็กสุด/ตัวคูณอุณหภูมิอ่านจากกฎ (สาย DC) — ตาราง PV_WIRE_AMP เป็นพิกัดที่อากาศ 60°C */
  const pvMin = () => (+RULES.pvWireMin > 0 ? +RULES.pvWireMin : PV_WIRE_MIN);
  function pickPvWireSize(needAmp) {
    const k = +RULES.pvWireTempK > 0 ? +RULES.pvWireTempK : 1;
    for (let i = 0; i < PV_WIRE_SIZES.length; i++) { const sz = PV_WIRE_SIZES[i]; if (sz >= pvMin() && PV_WIRE_AMP[sz] * k >= needAmp) return sz + " mm²"; }
    return "มากกว่า " + PV_WIRE_SIZES[PV_WIRE_SIZES.length - 1] + " mm²";
  }
  // ── แรงดันตกในสาย (voltage drop) ──
  // ΔV = k × L × I × ρ ÷ A   ·  k = 2 สำหรับ DC/1 เฟส (ไป-กลับ 2 เส้น) · k = √3 สำหรับ 3 เฟส
  // ρ = ความต้านทานจำเพาะทองแดง "ที่อุณหภูมิใช้งาน" ไม่ใช่ที่ 20°C (0.0172) เพราะสายร้อนแล้วต้านทานสูงขึ้น
  //     PVC 70°C ≈ 0.0206 · XLPE/PV1-F 90°C ≈ 0.0219 Ω·mm²/m (α ทองแดง 0.00393/°C)
  // เกณฑ์ออกแบบ: ฝั่ง DC ≤ 2% · ฝั่ง AC ≤ 3% · รวมทั้งเส้นทางไม่เกิน 5%
  const VD_RHO = { pvc: 0.0206, xlpe: 0.0219 };
  /* เกณฑ์อ่านจาก RULES (ตั้งค่าคำนวณ BOQ → สาย DC / สาย AC) — getter เพราะ RULES เปลี่ยนค่าได้ทีหลัง */
  const VD_LIMIT = { get dc() { return RULES.vdDc; }, get ac() { return RULES.vdAc; }, get total() { return RULES.vdTotal; } };
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
    for (let i = 0; i < pool.length; i++) { if (pool[i] >= need && (!o.dc || pool[i] >= pvMin())) { minSize = pool[i]; break; } }
    return { dv: Math.round(dv * 100) / 100, pct: Math.round(pct * 100) / 100, lim,
      ok: pct <= lim, size: A, need: Math.round(need * 100) / 100, minSize, volts: V, amp: I, length: L,
      phase: +o.phase === 3 ? 3 : 1 };
  }

  // หาแผง / อินเวอร์เตอร์จากชื่อรุ่น (สะท้อนคลัง)
  function findPanel(model) { return PANELS.find((p) => p.model === model) || null; }
  /* อินเวอร์เตอร์ Huawei (SUN2000 / LUNA) — อุปกรณ์เสริมในชุด HW ใช้ได้เฉพาะยี่ห้อนี้ */
  function isHwInv(model) { return /huawei|sun2000|luna2000/i.test(String(model || "")); }
  function findInverter(model) { return INVERTERS.find((x) => x.model === model) || null; }
  // ── คำนวณการต่ออนุกรมแผง (String) + สาย DC ──
  // panel = { voc, isc, vmp, imp } · inv = { mpptVmin, mpptVmax, maxVdc, maxInA }
  // คืนช่วงจำนวนแผง/สตริงที่ "แรงดัน" อยู่ในช่วงทำงาน MPPT (Vmin–Vmax) และ Voc รวมไม่เกินแรงดันระบบสูงสุด + ขนาดสาย DC
  function stringConfig(panel, inv, opts) {
    opts = opts || {}; panel = panel || {}; inv = inv || {};
    const voc = +panel.voc || 0, isc = +panel.isc || 0, vmp = +panel.vmp || 0, imp = +panel.imp || 0;
    /* Voc สูงขึ้นเมื่ออากาศเย็น (tcVoc ติดลบ %/°C · ไม่มีในคลัง = −0.25 ค่ากลางของแผงซิลิคอน)
       จำนวนแผงต่อสตริงต้องคิดจาก Voc ที่อุณหภูมิต่ำสุด ไม่ใช่ 25°C — ตรงกับหน้าออกแบบระบบ (scVocAt) และ SLD */
    const tMin = RULES.tMin, tc = +panel.tcVoc < 0 ? +panel.tcVoc : -0.25;
    const vocCold = voc * (1 + tc / 100 * (tMin - 25));
    const vmin = +inv.mpptVmin || 0, vmax = +inv.mpptVmax || 0, maxVdc = +inv.maxVdc || 0, maxInA = +inv.maxInA || 0;
    const vRef = vmp > 0 ? vmp : voc;   // จุดทำงาน: ใช้ Vmp ถ้ามี ไม่งั้นใช้ Voc
    /* Vmp ตกเมื่อเซลล์ร้อน (tcVmp · ไม่มี = tcVoc) — จำนวนแผงขั้นต่ำต้องคิดตอนร้อนสุด ไม่งั้นบ่ายแดดจัดแรงดันหลุดใต้ MPPT */
    const tHot = RULES.tCellHot, tcV = +panel.tcVmp < 0 ? +panel.tcVmp : tc;
    /* แผงสองหน้า: ด้านหลังรับแสงสะท้อนเพิ่มกระแส — ใช้ Isc × bifacialK เลือกฟิวส์/สาย (ช่อง "แผงสองหน้า" ในคลัง · ไม่ระบุ = เดาจากชื่อรุ่น) */
    const bif = panel.bifacial === true || (panel.bifacial == null && /bifacial|BDV|BDB|HBD|DEG\d|JAM\d+D\d/i.test(String(panel.model || "")));
    const iscD = isc * (bif ? RULES.bifacialK : 1);
    const maxMpptA = +inv.maxMpptA || 0, maxIscA = +inv.maxIscA || 0, spm = Math.max(1, Math.round(+inv.strPerMppt || 1));
    const out = { voc, vocCold: Math.round(vocCold * 100) / 100, tMin, tcVoc: tc, tHot, isc, iscD: Math.round(iscD * 100) / 100, bifacial: bif, vmp, imp, vmin, vmax, maxVdc, maxInA, maxMpptA, maxIscA, strPerMppt: spm, vRef, warns: [], ready: false };
    if (!voc || !vmin || !vmax) {
      if (!voc) out.warns.push("ยังไม่ระบุ Voc ของแผง — เพิ่มได้ที่หน้าคลัง › สเปคแผง");
      if (!vmin || !vmax) out.warns.push("ยังไม่ระบุช่วงแรงดันทำงาน MPPT ของอินเวอร์เตอร์ — เพิ่มได้ที่หน้าคลัง");
      return out;
    }
    out.ready = true;
    const vHot = vRef * (1 + tcV / 100 * (tHot - 25));
    out.vmpHot = Math.round(vHot * 100) / 100;
    out.minSeries = Math.max(1, Math.ceil(vmin / vHot));          // ขั้นต่ำ ให้แรงดันตอนเซลล์ร้อนสุดยังถึง Vmin
    const maxByOp = Math.floor(vmax / vRef);                      // สูงสุด ให้แรงดันทำงานไม่เกิน Vmax
    const maxByVoc = maxVdc > 0 ? Math.floor(maxVdc / vocCold) : maxByOp;  // Voc รวมตอนหนาวสุด ต้องไม่เกินแรงดันระบบสูงสุด
    out.maxByOp = maxByOp; out.maxByVoc = maxByVoc;
    out.maxSeries = Math.min(maxByOp, maxByVoc);
    out.recSeries = out.maxSeries >= out.minSeries ? out.maxSeries : out.minSeries;  // เลือกมากสุดที่อยู่ในช่วง (กระแสรวมต่ำสุด)
    if (out.maxSeries < out.minSeries) out.warns.push("ช่วงแรงดันทำงานแคบเกินไป — แผงรุ่นนี้ต่ออนุกรมให้อยู่ในช่วง MPPT ไม่ได้");
    // สถานะของจำนวนที่เลือกใช้ (ถ้าระบุ series มา)
    const series = Math.max(1, Math.round(+opts.series || out.recSeries));
    out.series = series;
    out.stringVoc = Math.round(series * vocCold * 100) / 100;    // แรงดันเปิดวงจรรวมตอนหนาวสุด (tMin) — ใช้เลือกแรงดันพิกัดอุปกรณ์
    out.stringVoc25 = Math.round(series * voc * 100) / 100;      // ที่ 25°C (ไว้แสดงเทียบ)
    out.stringVop = Math.round(series * vRef * 100) / 100;       // แรงดันทำงานรวม (โดยประมาณ)
    out.stringVopHot = Math.round(series * vHot * 100) / 100;    // แรงดันทำงานตอนเซลล์ร้อนสุด (tCellHot)
    out.hotLow = out.stringVopHot < vmin;
    out.inRange = out.stringVop >= vmin && out.stringVop <= vmax;
    out.overMaxVdc = maxVdc > 0 && out.stringVoc > maxVdc;
    if (!out.inRange) out.warns.push("แรงดันทำงานรวม " + out.stringVop + " V อยู่นอกช่วง MPPT " + vmin + "–" + vmax + " V");
    if (out.inRange && out.hotLow) out.warns.push("ตอนเซลล์ร้อน " + tHot + "°C แรงดันทำงาน " + out.stringVopHot + " V ต่ำกว่า MPPT " + vmin + " V — ต้องต่ออนุกรมอย่างน้อย " + out.minSeries + " แผง");
    if (out.overMaxVdc) out.warns.push("Voc รวมที่ " + tMin + "°C " + out.stringVoc + " V เกินแรงดันระบบสูงสุด " + maxVdc + " V");
    // กระแส DC = Isc × 1.25 (ป้องกันกระแสเกินตามมาตรฐาน) → เลือกขนาดสาย PV1-F
    out.dcAmp = Math.round(iscD * RULES.pvWireK * 100) / 100;
    out.dcWire = isc > 0 ? pickPvWireSize(out.dcAmp) : "—";
    /* กระแสเทียบสเปคอินเวอร์เตอร์ (ตรงกับหน้าออกแบบระบบ scCurrent):
       Imp 1 สตริง ≤ กระแสเข้าสูงสุดต่อขั้ว · Imp × สตริง/MPPT ≤ ต่อช่อง MPPT · Isc × 1.25 × สตริง/MPPT ≤ Isc สูงสุดต่อ MPPT */
    const iOp = imp || isc, limOp = maxMpptA || maxInA, r2 = (x) => Math.round(x * 100) / 100;
    if (maxInA > 0 && iOp > maxInA) out.warns.push("กระแสทำงาน 1 สตริง " + r2(iOp) + " A เกินกระแสเข้าสูงสุดต่อขั้ว " + maxInA + " A");
    if (limOp > 0 && spm > 1 && iOp * spm > limOp) out.warns.push("กระแสทำงานรวม " + r2(iOp * spm) + " A (" + spm + " สตริง/MPPT) เกินกระแสเข้าสูงสุดต่อ MPPT " + limOp + " A");
    /* เทียบ Isc ตรง ๆ กับพิกัดลัดวงจรของ MPPT ไม่คูณ 1.25 (ผู้ใช้ ต.ค. 2026 · ตรงกับ solarcalc scCurrent) */
    if (maxIscA > 0 && isc > 0 && iscD * spm > maxIscA) out.warns.push("Isc" + (bif ? " (สองหน้า ×" + RULES.bifacialK + ")" : "") + (spm > 1 ? " × " + spm + " สตริง" : "") + " = " + r2(iscD * spm) + " A เกินกระแสลัดวงจรสูงสุดต่อ MPPT " + maxIscA + " A");
    return out;
  }

  /* ── แผนสตริง ── ตอบคำถาม "ลงสตริงละ N แผง แล้วจะได้กี่สตริง"
     แผงทั้งงาน ÷ แผงต่ออนุกรม = จำนวนสตริง (ปัดขึ้น) · เศษที่เหลือกลายเป็นสตริงสุดท้ายที่แผงไม่เต็ม
     ช่องรับสตริงของอินเวอร์เตอร์ = จำนวน MPPT × สตริงต่อ MPPT (ค่าปริยาย 1 ถ้ายังไม่กรอกในคลัง)
     สตริงที่แผงไม่เต็มแรงดันจะต่ำกว่าเพื่อน — เตือนไว้เพราะกำลังจะหายไปบางส่วน */
  /* extraCap = ช่องรับสตริงของอินเวอร์เตอร์รุ่นอื่นในงานเดียวกัน (งานสองขนาด)
     จำนวนสตริงขึ้นกับแผงกับแผงต่ออนุกรมเท่านั้น ไม่ขึ้นกับรุ่น — ที่ต่างคือช่องที่รับได้ */
  function stringPlan(panelCount, series, inv, invCount, extraCap) {
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
    const cap = capPerInv * nInv + Math.max(0, Math.round(+extraCap || 0));
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

  /* ── ข้อต่อ/ข้องอของท่อร้อยสาย ──
     จำนวนขึ้นกับรูปทรงการเดินท่อจริง (เลี้ยวกี่มุม แยกกี่จุด) ระบบเดาจากความยาวไม่ได้ ต้องกรอกเอง
     แต่ให้ "เลือกจากรายการ" แทนพิมพ์เอง ชื่อจะได้ตรงกับคลังทุกครั้ง ไม่ต้องมานั่งไล่ชื่อซ้ำทีหลัง */
  const COND_FIT_KINDS = ["ข้องอ 90°", "ข้องอ 45°", "สามทาง", "ข้อลด", "ยูเนี่ยนคัปปลิ้ง", "ข้อต่อเข้ากล่อง"];
  const upvcSuffix = (nm) => {
    const mm = (String(nm).match(/(\d+)\s*mm/) || [])[1];
    return mm ? "uPVC " + mm + "mm. (สีขาว)" : String(nm).trim();
  };
  /* รายการข้อต่อท่อทุกขนาด — IMC และ uPVC แยกกลุ่มกันในดรอปดาวน์ */
  function condFittings() {
    const out = [];
    IMC_SIZES.forEach((nm) => {
      const sz = nm.replace(/^IMC\s*/i, "").trim();
      COND_FIT_KINDS.forEach((k) => out.push({ name: k + " IMC " + sz, unit: "pcs", group: "IMC" }));
    });
    UPVC_SIZES.forEach((nm) => {
      const suf = upvcSuffix(nm);
      COND_FIT_KINDS.forEach((k) => out.push({ name: k + " " + suf, unit: "pcs", group: "uPVC" }));
    });
    return out;
  }

  /* ── รางไฟ (WIREWAY / CABLE TRAY) ──
     Wireway = รางเหล็กพับมีฝาปิด ยาว 2.40 ม./ท่อน — ใช้เดินสายในอาคาร/ข้างตู้
     Cable Tray Ladder = รางบันได ยาว 2.44 ม./ท่อน (8 ฟุต) — ใช้เดินสายจำนวนมากระยะไกล
     Cable Tray Perforated = รางเจาะรู ยาว 2.44 ม./ท่อน — พื้นรางเป็นแผ่นเจาะรู รองสายเส้นเล็กได้ไม่ตกร่อง
     ถอดของ: ตัวราง + ชุดข้อต่อทุกรอยต่อ + ขาล็อกรางไฟทุก 1.5 ม. + ตัวยึดขา 2 ตัว/ขา

     ขาล็อกยึดได้ 2 แบบ เลือกทีละแถว
       ยึดเข้าโครง/ผนัง = พุ๊กเหล็ก 3/8" 2 ตัว/ขา
       ยึดบน Rail       = T-BOLT KIT 2 ชุด/ขา + Rail รองใต้ขา 1 ชิ้น/ขา
     Rail ต้องยาวกว่ารางไฟข้างละ 10 ซม. (ราง 10 ซม. → ชิ้นละ 30 ซม.) ไว้ให้ขาล็อกจับได้ทั้งสองฝั่ง
     สั่งเป็นท่อนเต็ม (RAIL 4.2 / 4.8 M ท่อนเดียวกับงานโครงยึดแผง) แล้วตัดแบ่ง —
     ท่อนหนึ่งได้กี่ชิ้นก็ปัดลง เศษที่เหลือสั้นกว่า 1 ชิ้นใช้ต่อไม่ได้

     ชุบ HDG (กัลวาไนซ์จุ่มร้อน) เลือกได้ทีละแถว — ของชุบเป็นคนละตัวกับของ Pre-Zinc ราคาคนละราคา
     จึงต่อท้ายชื่อด้วย " (HDG.)" ทั้งตัวราง ชุดข้อต่อ และขาแขวน ให้เทียบราคา/ตัดสต็อกแยกกันได้ */
  /* ── อัตรา DC/AC (กำลังแผง ÷ กำลังออก AC สูงสุด) ──
     อินเวอร์เตอร์ตัด (clip) กำลังออกไว้ที่ Max AC Active Power (cosφ=1) อยู่แล้ว
     ใส่แผงเกินกำลัง AC จึงทำได้ และทำกันทั่วไป — ช่วยเก็บกำลังช่วงเช้า/เย็นที่แดดอ่อน
     เกิน 1.2 เท่าเมื่อไหร่ค่อยเตือน เพราะเลยจุดนั้นแล้ว clip ช่วงเที่ยงจะกินกำลังที่ได้เพิ่ม */
  const DCAC_LIMIT = 1.2;

  const WAY_PIPE_LEN = 2.4, TRAY_PIPE_LEN = 2.44;   // ความยาวท่อนอยู่ในชื่อรายการ (ผูกราคาคลัง) จึงไม่ให้ตั้งค่า
  /* Rail ที่รองใต้ขาล็อก ต้องยื่นพ้นรางไฟข้างละ 10 ซม. ไว้ให้ขาล็อกจับ — สั้นกว่านี้ไม่มีที่ยึด
     คิดจากความกว้างรางในชื่อรุ่น เช่น 100x50 → 100 + 100 + 100 = 300 mm = 30 ซม. */
  // RULES.trayRailSide (100 มม.) · ตัวยึดต่อขา RULES.trayAnchor (2)
  /* T-BOLT KIT ใช้ทั้งยึดขาล็อกรางไฟกับ Rail และยึดตัวคุมแผงเข้ากับราง — ของชิ้นเดียวกัน
     ชื่อจึงไม่ผูกกับงานใดงานหนึ่ง ตั้งราคาที่เดียวแล้วใช้ได้ทั้งสองหมวด */
  const TBOLT_NAME = "T-BOLT KIT";
  const railLenCm = (name) => Math.round((trayDim(name).w + RULES.trayRailSide * 2) / 10);
  /* กี่ชิ้นต่อท่อน — ปัดลง เพราะเศษท้ายท่อนที่สั้นกว่า 1 ชิ้นเอาไปรองขาไม่ได้
     ชิ้นยาวกว่าท่อน (ไม่น่าเกิดกับรางที่มีในรายการ) ให้เป็น 0 แล้วไปคิดแบบต่อท่อนข้างล่าง */
  const railPerTon = (name, tonLen) => Math.floor((+tonLen || 4.2) * 100 / Math.max(1, railLenCm(name)));
  /* จำนวนท่อนเต็มที่ต้องสั่ง จากจำนวนชิ้นที่ต้องใช้ */
  function railTon(name, pieces, tonLen) {
    const per = railPerTon(name, tonLen);
    if (per > 0) return Math.ceil(pieces / per);
    return Math.ceil((pieces * railLenCm(name)) / ((+tonLen || 4.2) * 100));   // ชิ้นเดียวกินหลายท่อน
  }
  const railName = (tonLen) => RAIL[+tonLen] || ("RAIL " + (+tonLen || 4.2) + " M");
  /* ความยาว/ท่อนในชื่อรายการ — ตัดศูนย์ท้ายทิ้ง (2.44 → "2.44" · 2.4 → "2.4")
     toFixed(1) เดิมจะปัด 2.44 เหลือ 2.4 ชื่อของก็จะบอกความยาวผิด */
  const trayLenTxt = (v) => String(+(+v).toFixed(2));
  const WAY_SIZES = [
    "Wireway 50x50 mm.", "Wireway 100x50 mm.", "Wireway 100x100 mm.",
    "Wireway 150x100 mm.", "Wireway 200x100 mm.", "Wireway 200x200 mm.", "Wireway 300x100 mm.",
  ];
  const TRAY_SIZES = [
    "Cable Tray Ladder 150x50 mm.", "Cable Tray Ladder 200x50 mm.", "Cable Tray Ladder 300x100 mm.",
    "Cable Tray Ladder 450x100 mm.", "Cable Tray Ladder 600x100 mm.",
  ];
  const PERF_SIZES = [
    "Cable Tray Perforated 150x50 mm.", "Cable Tray Perforated 200x50 mm.", "Cable Tray Perforated 300x100 mm.",
    "Cable Tray Perforated 450x100 mm.", "Cable Tray Perforated 600x100 mm.",
  ];
  /* สเปคของรางแต่ละชนิดรวมไว้ที่เดียว — เดิมกระจายเป็น if (isTray) หลายจุด พอเพิ่มชนิดที่สามเลยต้องตามแก้ทุกจุด
     fill     = % เติมเต็มสูงสุด (รางปิดฝาระบายความร้อนไม่ออก จึงคุมแน่นกว่ารางเปิด)
     hanger   = แขวนด้วยขาแขวนสำเร็จ (Wireway ยึดพุ๊กเข้าโครงตรง ๆ)
     oneLayer = ควรวางสายชั้นเดียว จึงต้องเช็คผลรวมเส้นผ่านศูนย์กลางเทียบความกว้างรางด้วย */
  const TRAY_KINDS = {
    way:  { key: "way",  brief: "Wireway",               label: "Wireway เหล็กมีฝา",     sizes: WAY_SIZES,  pipeLen: WAY_PIPE_LEN,  get fill() { return RULES.wayFill; }, hanger: false, oneLayer: false },
    tray: { key: "tray", brief: "Cable Tray Ladder",     label: "Cable Tray Ladder",     sizes: TRAY_SIZES, pipeLen: TRAY_PIPE_LEN, get fill() { return RULES.trayFill; }, hanger: true,  oneLayer: true },
    perf: { key: "perf", brief: "Cable Tray Perforated", label: "Cable Tray Perforated", sizes: PERF_SIZES, pipeLen: TRAY_PIPE_LEN, get fill() { return RULES.trayFill; }, hanger: true,  oneLayer: true },
  };
  const TRAY_KIND_KEYS = ["way", "tray", "perf"];
  /* รับได้ทั้งคีย์ชนิด ("way"/"tray"/"perf") และ boolean isTray แบบเดิม — ที่เรียกด้วย true/false อยู่จึงไม่พัง */
  const trayKindOf = (k) => TRAY_KINDS[k === true ? "tray" : (k || "way")] || TRAY_KINDS.way;
  /* ขนาดรางดึงจากคลัง (ผู้ใช้ ต.ค. 2026) — ตัวรางในคลังชื่อ "<ชนิด> WxH mm.[ สีขาว] (2.4m/ท่อน)"
     ไม่นับของชุบ (HDG.) และของในถังขยะ (มี trashFrom) · คลังมีอย่างน้อย 1 ขนาด = ใช้ชุดนั้นแทนรายการตั้งต้น ไม่มี = รายการตั้งต้น
     แก้อาร์เรย์เดิมในที่ ทุกที่ที่ถือ WAY_SIZES / spec.sizes ไว้จึงเห็นค่าใหม่ · store เรียกทุกครั้งที่คลังเปลี่ยน */
  const TRAY_SIZE_DEF = { way: WAY_SIZES.slice(), tray: TRAY_SIZES.slice(), perf: PERF_SIZES.slice() };
  let traySizesV = 0;
  function syncTraySizes(items) {
    TRAY_KIND_KEYS.forEach((kk) => {
      const spec = TRAY_KINDS[kk];
      const re = new RegExp("^" + spec.brief + " (\\d+)x(\\d+) mm\\.( [^()]+)? \\([\\d.]+m/ท่อน\\)$");
      const got = {};
      (items || []).forEach((it) => {
        const m = it && !it.trashFrom && re.exec(String(it.name || "").trim());
        if (m) got[spec.brief + " " + m[1] + "x" + m[2] + " mm." + (m[3] || "")] = [+m[1], +m[2], m[3] ? 1 : 0];
      });
      const want = Object.keys(got).sort((a, b) => got[a][0] - got[b][0] || got[a][1] - got[b][1] || got[a][2] - got[b][2] || a.localeCompare(b));
      const next = want.length ? want : TRAY_SIZE_DEF[kk];
      if (next.join("|") === spec.sizes.join("|")) return;
      spec.sizes.splice.apply(spec.sizes, [0, spec.sizes.length].concat(next));
      traySizesV++;
    });
  }
  const traySizesVer = () => traySizesV;

  const HDG_TAG = " (HDG.)";
  const hdgName = (nm, on) => (on ? String(nm) + HDG_TAG : String(nm));
  /* ชื่อรุ่นเก่า — ก่อนแยกชนิดราง รางบันไดชื่อ "Cable Tray บันได" และของประกอบชื่อ "… Cable Tray <ขนาด>"
     แปลงให้ตรงชื่อใหม่ทุกครั้งที่เทียบชื่อ ของในคลังกับใบถอดของเก่าจึงยังหาราคาเจอ ไม่ต้องไล่เปลี่ยนชื่อเอง */
  const trayAlias = (s) => String(s || "")
    .replace(/ขาแขวนราง/g, "ขาล็อกรางไฟ")
    .replace(/Cable Tray\s*บันได/g, "Cable Tray Ladder")
    .replace(/Cable Tray (?!Ladder|Perforated)/g, "Cable Tray Ladder ");
  const traySuffix = (nm) => trayAlias(nm).replace(/^(Wireway|Cable Tray Ladder|Cable Tray Perforated)\s*/i, "").trim();
  /* ถอดวัสดุรางไฟ 1 ขนาด — คืน array ของ item · pct = % เผื่อของอุปกรณ์ประกอบ */
  function wayItems(name, lenM, pct, kind, hdg, rail, tonLen) {
    const len = +lenM || 0;
    if (len <= 0) return [];
    const spec = trayKindOf(kind);
    const sz = traySuffix(name);
    const up = (v) => Math.ceil(v * (1 + (+pct || 0) / 100));
    const pipeLen = spec.pipeLen;
    const pcs = Math.ceil(len / pipeLen);
    const joint = Math.max(0, pcs - 1) + RULES.trayJointX;        // ทุกรอยต่อ + เผื่อหัวท้าย
    const hanger = Math.ceil(len / RULES.trayHanger);             // ขาล็อกทุก 1.5 ม. (ตั้งค่าได้)
    const z = (nm) => hdgName(nm, hdg);                           // ของที่สั่งชุบมาทั้งชิ้น — ตัวราง ข้อต่อ ขาล็อก
    const onRail = !!rail && spec.hanger;                         // Wireway ยึดพุ๊กเข้าโครงตรง ๆ ไม่มีขาล็อกให้วางบน Rail
    const out = [
      { name: z(trayAlias(name)) + " (" + trayLenTxt(pipeLen) + "m/ท่อน)", qty: pcs, unit: "ท่อน" },
    ];
    // Wireway ไม่ต้องมีของประกอบ (ข้อต่อ · สกรู M6 · พุ๊ก) — ผู้ใช้ยืนยัน · ถอดแค่ตัวราง
    if (!spec.hanger) return out;
    out.push({ name: z("ชุดข้อต่อราง " + spec.brief + " " + sz), qty: up(joint), unit: "ชุด" });
    // รางเคเบิลล็อกด้วยขาล็อกสำเร็จ
    if (spec.hanger) out.push({ name: z("ขาล็อกรางไฟ " + spec.brief + " " + sz), qty: up(hanger), unit: "ชุด" });
    /* ตัวยึดขา — ของมาตรฐานที่ใช้ร่วมกับงานอื่นทั้งใบ ไม่ต่อท้าย (HDG.) ไม่งั้นบรรทัดเดียวแตกเป็นสองบรรทัด
       Rail ก็เช่นกัน เป็นรางอะลูมิเนียมตัวเดียวกับงานโครงยึดแผง ไม่ได้ชุบ */
    if (onRail) {
      out.push({ name: TBOLT_NAME, qty: up(hanger * RULES.trayAnchor), unit: "ชุด" });
      /* เผื่อที่ระดับ "ชิ้น" ก่อนค่อยแปลงเป็นท่อน — เผื่อทีหลังจะได้เศษท่อนที่ตัดใช้ไม่ได้จริง */
      out.push({ name: railName(tonLen), qty: railTon(name, up(hanger), tonLen), unit: "เส้น" });
    } else {
      out.push({ name: 'พุ๊กเหล็ก 3/8"', qty: up(hanger * RULES.trayAnchor), unit: "ตัว" });
    }
    return out;
  }

  /* ── ข้องอ/ข้อต่อของรางไฟ ──
     เหมือนฝั่งท่อ คือขึ้นกับรูปทรงจริง กรอกเอง แต่เลือกจากรายการได้ทุกขนาด
     แยกกลุ่ม Wireway กับ Cable Tray บันได เพราะของคนละแบบ ใช้แทนกันไม่ได้ */
  const WAY_FIT_KINDS = [
    "ข้องอ 90° แนวราบ", "ข้องอ 45° แนวราบ",
    "ข้องอ 90° เปิดนอก", "ข้องอ 90° เปิดใน", "ข้องอ เปิดบน (ขึ้น)", "ข้องอลง",
    "สามทาง", "สี่ทาง", "ข้อลด", "ข้อต่อลงตู้", "แผ่นปิดหัว-ท้าย",
  ];
  function trayFittings() {
    const out = [];
    TRAY_KIND_KEYS.forEach((kk) => {
      const spec = TRAY_KINDS[kk];
      // ของชุบ HDG แยกเป็นกลุ่มของตัวเอง — อยู่กลุ่มเดียวกันจะเลือกผิดง่าย เพราะชื่อต่างกันแค่วงเล็บท้าย
      [false, true].forEach((z) => {
        spec.sizes.forEach((nm) => {
          const sz = traySuffix(nm);
          WAY_FIT_KINDS.forEach((k) => out.push({
            name: hdgName(k + " " + spec.brief + " " + sz, z), unit: "ชุด", group: hdgName(spec.brief, z),
          }));
        });
      });
    });
    return out;
  }

  /* ── ตรวจสายในราง ──
     Wireway (รางปิดมีฝา): พื้นที่หน้าตัดสายรวม ≤ 20% ของพื้นที่ราง — สายเบียดกันแล้วระบายความร้อนไม่ออก
     Cable Tray (รางบันได): ≤ 50% ของพื้นที่ราง และควรวางชั้นเดียว คือผลรวมเส้นผ่านศูนย์กลาง ≤ ความกว้างราง
     ตัวคูณลดกระแส: ยิ่งมีตัวนำนำกระแสในรางเดียวกันมาก แต่ละเส้นยิ่งรับกระแสได้น้อยลง
     (ตารางตัวคูณตามจำนวนตัวนำ — แก้ตัวเลขได้ที่นี่ถ้าใช้เกณฑ์ของโครงการอื่น) */
  const TRAY_FILL_LIMIT = { get way() { return TRAY_KINDS.way.fill; }, get tray() { return TRAY_KINDS.tray.fill; }, get perf() { return TRAY_KINDS.perf.fill; } };
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
  function trayCheck(name, cables, kind, sizePool) {
    const spec = trayKindOf(kind);
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
    const limit = spec.fill;
    const pct = dim.area > 0 ? (area / dim.area) * 100 : 0;
    const need = limit > 0 ? area / (limit / 100) : 0;      // พื้นที่รางขั้นต่ำที่ต้องมี (mm²)
    // ขนาดเล็กสุดในรายการที่ยังผ่านเกณฑ์ — ไว้บอกว่าต้องขยับไปเบอร์ไหน
    let suggest = null;
    (sizePool || []).forEach((nm) => {
      if (suggest) return;
      const d = trayDim(nm);
      // รางเคเบิลต้องกว้างพอวางชั้นเดียวด้วย ไม่ใช่ดูแค่พื้นที่
      if (d.area > 0 && d.area >= need && (!spec.oneLayer || d.w >= odSum)) suggest = nm;
    });
    return {
      dim: dim, area: Math.round(area * 10) / 10, fillPct: Math.round(pct * 10) / 10, limit: limit,
      ok: dim.area > 0 && pct <= limit,
      odSum: Math.round(odSum * 10) / 10,
      widthOk: !spec.oneLayer || dim.w === 0 || odSum <= dim.w,   // รางเคเบิลควรวางชั้นเดียว
      cores: cores, derate: trayDerate(cores),
      needArea: Math.round(need), suggest: suggest, unknown: unknown,
    };
  }

  /* ใบถอดของที่บันทึกไว้ก่อนแยกชนิดราง — แปลงชื่อขนาดให้ตรงรายการใหม่
     ไม่แปลงแล้วดรอปดาวน์จะขึ้นเป็นของนอกรายการ และตารางตรวจสายหาขนาดรางไม่เจอ */
  function trayNorm(tray) {
    const t = Object.assign({ way: [], tray: [], perf: [], spare: RULES.traySpare, extra: [] }, tray);
    TRAY_KIND_KEYS.forEach((k) => {
      t[k] = (t[k] || []).map((r) => Object.assign({}, r, { size: trayAlias(r.size || "") }));
    });
    t.extra = (t.extra || []).map((r) => Object.assign({}, r, { name: trayAlias(r.name || "") }));
    return t;
  }

  /* รวมบรรทัดชื่อซ้ำเป็นบรรทัดเดียว — เช่น พุ๊กเหล็ก ที่ถอดมาจากรางหลายขนาด/หลายจุด */
  /* ของที่ซื้อเป็นกล่อง/ม้วน แต่ถอดเป็นเมตร → ชื่อกล่องในคลัง + ความยาวต่อกล่อง (ใช้ตอนยังไม่ตั้งราคาต่อเมตร)
     ดูจากชื่อ เพราะ mergeItems/ตัวแก้จำนวนสร้างแถวใหม่ ฟิลด์เสริมบนแถวไม่รอด */
  function boxOfMeter(name) {
    const m = String(name || "").match(/^ท่ออ่อนเหล็กกันน้ำ (?!30m)(.+)$/);
    return m ? { name: "ท่ออ่อนเหล็กกันน้ำ 30m. " + m[1], len: 30 } : null;
  }
  function mergeItems(rows) {
    const order = [], map = {};
    (rows || []).forEach((r) => {
      const k = r.name + "|" + (r.unit || "");
      if (map[k]) map[k].qty += +r.qty || 0;
      else { map[k] = { name: r.name, qty: +r.qty || 0, unit: r.unit || "" }; order.push(k); }
    });
    return order.map((k) => map[k]).filter((x) => x.qty > 0);
  }

  /* ── ขนาด/ความหนาเหล็ก ──
     งานโครงสร้าง (บันไดลิง · ราวกันตก · โครงรองรับอุปกรณ์) เดิมล็อกขนาดไว้ตายตัว
     หน้างานจริงเปลี่ยนได้ตามความสูง/น้ำหนัก จึงให้เลือกเองต่อรายงาน
     ค่าเริ่มต้น (dSize/dThk) ต้องได้ชื่อ "เดิม" เป๊ะ ๆ ของเก่าในคลังจะได้ยังผูกราคาได้ */
  const STEEL_SPECS = {
    box: { th: "เหล็กกล่องดำ", unit: "เส้น", barLen: 6,
      sizes: ['1"x1"', '1"x2"', '1.5"x1.5"', '2"x2"', '2"x4"', '3"x3"', '4"x4"'],
      thks: [1.2, 1.6, 2.0, 2.3, 3.2, 4.0], dSize: '2"x2"', dThk: "" },
    round: { th: "เหล็กกลมดำ", unit: "เส้น", barLen: 6,
      sizes: ['3/8"', '1/2"', '5/8"', '3/4"', '1"', '1 1/4"', '1 1/2"'],
      thks: [], dSize: '1"', dThk: "" },
    flat: { th: "เหล็กแบน", unit: "เส้น", barLen: 6, sizeUnit: "มม.",
      sizes: [25, 32, 38, 50, 65, 75], thks: [3, 4, 5, 6, 9], dSize: 32, dThk: "" },
    angle: { th: "เหล็กฉาก", unit: "เส้น", barLen: 6, sizeUnit: "มม.",
      sizes: ["40x40", "50x50", "65x65", "75x75", "100x100"],
      thks: [3, 4, 5, 6, 9], dSize: "40x40", dThk: 4 },
    plate: { th: "แผ่นเพลท", unit: "แผ่น",
      sizes: ['3"x3"', '4"x4"', '5"x5"', '6"x6"'],
      thks: [4.5, 6, 9, 12], dSize: '4"x4"', dThk: "" },
    anchor: { th: "พุ๊กเหล็ก", unit: "ตัว",
      sizes: ['1/4"', '3/8"', '1/2"', '5/8"'], thks: [], dSize: '3/8"', dThk: "" },
  };
  /* ชื่อรายการจากขนาด+ความหนา — ไม่ระบุความหนา = ได้ชื่อสั้นแบบเดิม ไม่ทำของเก่าหลุด */
  function steelName(kind, sel) {
    const S = STEEL_SPECS[kind];
    if (!S) return "";
    const s = (sel && sel.size != null && sel.size !== "") ? sel.size : S.dSize;
    const t = (sel && sel.thk != null && sel.thk !== "") ? sel.thk : S.dThk;
    return S.th + " " + s + (S.sizeUnit ? " " + S.sizeUnit : "") + (t === "" || t == null ? "" : " หนา " + t + " มม.");
  }
  // ความยาวท่อน (ม.) — เผื่อเปลี่ยนเป็นเหล็ก 6 ม. เป็นอย่างอื่นในอนาคต
  function steelBarLen(kind, sel) {
    const S = STEEL_SPECS[kind] || {};
    const v = +((sel && sel.barLen) || 0);
    return v > 0 ? v : (S.barLen || 6);
  }
  function steelSel(b, kind) { return (((b && b.struct) || {}).steel || {})[kind] || {}; }
  function steelOf(b, kind) { return steelName(kind, steelSel(b, kind)); }

  /* ── โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB) ──
     อินเวอร์เตอร์ตัวใหญ่และตู้ MDB ต้องมีโครงเหล็กหรือฉากยึด ไม่ได้แขวนกับผนังเปล่า ๆ
     "ตั้งพื้น" = ทำโครงเหล็กกล่องยืนพื้น · "ยึดผนัง" = ฉากรองรับยิงพุกเข้าผนัง */
  const SUPPORT_KINDS = {
    floor: {
      label: "โครงเหล็กตั้งพื้น",
      per: (b) => [
        { name: steelOf(b, "box"), qty: 2, unit: "เส้น" },
        { name: steelOf(b, "plate"), qty: 4, unit: "แผ่น" },
        { name: steelOf(b, "anchor"), qty: 16, unit: "ตัว" },
      ],
    },
    wall: {
      label: "ฉากยึดผนัง",
      per: (b) => [
        { name: steelOf(b, "angle"), qty: 1, unit: "เส้น" },
        { name: steelOf(b, "plate"), qty: 2, unit: "แผ่น" },
        { name: steelOf(b, "anchor"), qty: 8, unit: "ตัว" },
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
    /* ขนส่ง · เครน · นั่งร้าน ไม่อยู่ในค่าแรงแล้ว — แยกไปหมวด "ขนส่ง & เครื่องจักร" (TRANSPORT_PRESET)
       ค่าแรงเหมารวมจะได้เทียบเรต ฿/W กันได้ตรง ๆ ไม่มีค่ารถปนอยู่ข้างใน */
  ];
  /* ── ค่าขออนุญาต & เอกสาร ── ค่าธรรมเนียมจริงเปลี่ยนตามพื้นที่/ขนาดระบบ จึงเว้นราคาไว้ให้กรอก */
  /* when(k, b) = งานนี้ต้องมีบรรทัดนี้ไหม (k = kWp) · ไม่มี when = ทุกงาน
     บรรทัดที่ไม่เข้าเงื่อนไขไม่ขึ้นในรายการตั้งต้นเลย — ใบที่บันทึกรายการไว้แล้วไม่ขยับตาม */
  const PERMIT_AREA_PER_KW = 4.5;   // ตร.ม. ต่อ kWp โดยประมาณ (แผง ~650 W ≈ 2.7 ตร.ม. + ช่องเดิน)
  const PERMIT_PRESET = [
    { name: "ค่าเชื่อมต่อระบบขนานไฟฟ้า", unit: "งาน" },
    // กกพ.: ไม่เกิน 10 kW ไม่ต้องยื่น · เกิน 10 ถึงต่ำกว่า 1,000 kW จดแจ้งยกเว้น · ตั้งแต่ 1,000 kW ขึ้นไปต้องขอใบอนุญาตผลิตไฟฟ้า
    { name: "ค่าจดแจ้งยกเว้นใบอนุญาต (กกพ.)", unit: "งาน", when: (k) => k > RULES.ercMin && k < RULES.ercLic },
    { name: "ใบอนุญาตผลิตไฟฟ้า (กกพ.)", unit: "ฉบับ", when: (k) => k >= RULES.ercLic },
    // พค.2 จาก พพ.: เกิน 10 ถึง 200 kW · ไม่มีค่าธรรมเนียม
    { name: "ใบรับรองการแจ้งผลิตพลังงานควบคุม (พค.2) — พพ. ไม่มีค่าธรรมเนียม", unit: "ฉบับ", when: (k) => k > RULES.ercMin && k <= RULES.pk2Max },
    // งานวิศวกรรมรวมเป็นบรรทัดเดียว ยอดรวม 5,000–15,000 ตามขนาดระบบ (เดิมแยก 4 บรรทัด — ใบเก่าที่บันทึกไว้ยังเห็น 4 บรรทัดเดิม)
    { name: "ค่าวิศวกร — เซ็นรับรองแบบไฟฟ้า/โครงสร้าง · คำนวณโครงสร้าง · แบบ As-built", unit: "งาน" },
    // อ.1: พื้นที่แผงบนหลังคาเกิน 160 ตร.ม. (ประมาณจาก kWp)
    { name: "ค่าขออนุญาตดัดแปลงอาคาร (อ.1)", unit: "งาน", when: (k) => k * RULES.areaPerKw > RULES.a1Area },
  ];
  /* ราคาตั้งต้นของใบใหม่ (ใบที่บันทึกรายการไว้แล้วไม่ขยับตาม) — ตัวเลขจากผู้ใช้
     ค่าบริการขนานไฟ ตามการไฟฟ้า (ทุกประเภทงาน): MEA นครหลวง 2,140 · PEA ภูมิภาค 3,745 · ยังไม่รู้การไฟฟ้า = 0
     ค่าวิศวกร (บรรทัดเดียวรวมทุกอย่าง) ยอดรวม 5,000–15,000 ตามขนาดระบบ: ≤10 kWp 5,000 · ≤100 kWp 10,000 · ใหญ่กว่านั้น 15,000
     การไฟฟ้าดูจากจังหวัดในฐานลูกค้า: กรุงเทพฯ · นนทบุรี · สมุทรปราการ = MEA · จังหวัดอื่น = PEA */
  const PERMIT_GRID_NAME = "ค่าเชื่อมต่อระบบขนานไฟฟ้า";
  const PERMIT_GRID_FEE = { MEA: 2140, PEA: 3745 };
  const MEA_PROVINCES = ["กรุงเทพ", "กทม", "bangkok", "นนทบุรี", "nonthaburi", "สมุทรปราการ", "samut prakan"];
  function gridAuthOf(job) {
    const pv = String((job && job.province) || "").trim().toLowerCase();
    if (pv) return RULES.meaProv.some((x) => pv.indexOf(x) >= 0) ? "MEA" : "PEA";
    // ไม่มีจังหวัด → ถอยไปดูที่เลือกไว้ในใบขออนุญาต / แบบสำรวจ
    return (job && ((job.permit && job.permit.auth) || (job.survey && job.survey.meterAuth))) || "";
  }
  const PERMIT_ENG_NAMES = ["ค่าวิศวกร — เซ็นรับรองแบบไฟฟ้า/โครงสร้าง · คำนวณโครงสร้าง · แบบ As-built"];
  const PERMIT_ENG_TIERS = [[10, 5000], [100, 10000], [Infinity, 15000]];
  const permitGridFee = (b) => ({ MEA: RULES.gridMEA, PEA: RULES.gridPEA })[(b && b.gridAuth) || ""] || 0;   // ทุกประเภทงาน
  function permitPresetFor(b, kw) {
    const k = +kw || 0;
    const eng = k <= 0 ? 0 : k <= RULES.eng1Kw ? RULES.eng1 : k <= RULES.eng2Kw ? RULES.eng2 : RULES.eng3;
    return PERMIT_PRESET.filter((p) => !p.when || p.when(k, b)).map((p) => ({ name: p.name, unit: p.unit, qty: 1,
      price: PERMIT_ENG_NAMES.indexOf(p.name) >= 0 ? eng : p.name === PERMIT_GRID_NAME ? permitGridFee(b) : 0 }));
  }
  /* ── ค่าขนส่ง & เครื่องจักร · ค่าบริหารจัดการหน้างาน ──
     งานโครงการต้องขนของขึ้นหลังคาด้วยเฮี้ยบ/เครน และทีมค้างที่หน้างานหลายวัน
     สองหมวดนี้ราคาอยู่ในบรรทัดเองเหมือนค่าแรง ไม่ใช่ของในคลัง */
  const TRANSPORT_PRESET = [
    { name: "รถบรรทุก / รถเฮี้ยบ", unit: "เที่ยว" },
    { name: "รถเครน", unit: "วัน" },
    { name: "นั่งร้าน", unit: "งาน" },
  ];
  const MANAGE_PRESET = [
    { name: "ค่าที่พักทีมติดตั้ง", unit: "คืน" },
    { name: "ค่าเดินทาง", unit: "เที่ยว" },
  ];
  const G_TRAY = "รางไฟ (WIREWAY / TRAY)";
  const G_SUPPORT = "โครงสร้างรองรับอุปกรณ์";
  const G_LABOR = "ค่าแรงติดตั้ง";
  const G_PERMIT = "ค่าขออนุญาต & เอกสาร";
  const G_TRANSPORT = "ขนส่ง & เครื่องจักร";
  const G_MANAGE = "บริหารจัดการหน้างาน";
  const G_OM = "O&M · ประกัน + ล้างแผง";
  const SERVICE_GROUPS = [G_LABOR, G_PERMIT, G_TRANSPORT, G_MANAGE, G_OM];   // หมวดที่ราคาอยู่ในบรรทัดเอง ไม่ดึงจากคลัง

  /* ── O&M: ล้างแผง + งาน O&M ──
     ฝั่งลูกค้าเสนอว่า "O&M ฟรี" N ปีแรก (ค่าฐาน 2 ปี · ล้างแผงปีละ 1 ครั้ง) — ค่าบริการช่วงนั้นบวกเข้างานนี้ ซ่อนอยู่ในราคาติดตั้ง
     หลังจากนั้นลูกค้าต่อเป็นรายปี ราคาเท่ากับค่าบริการต่อปีเดียวกัน
     ราคาเป็น "ราคางาน" ตามตารางของบริษัท แบ่งตามขนาดระบบ (kWp) — ขนาดไม่เกินขั้นไหนใช้ราคาขั้นนั้น
     ใหญ่เกินขั้นสุดท้าย = คูณต่อด้วยเรตต่อ kWp ของขั้นสุดท้าย ปัดขึ้นทีละ 500 บาท (ราคาไม่กระโดด)
     แก้ได้ต่อใบ: ปีที่แถม · ครั้งต่อปี · ราคาล้าง/ครั้ง · ราคา O&M/ปี (เว้นว่าง = ตามตาราง) */
  /* ค่าตั้งต้น = ตารางที่ผู้ใช้ให้มา · แก้ได้ที่หน้าคลัง แท็บ "ราคา O&M · ล้างแผง" (เก็บที่ omTiers/{clean,svc})
     OM_CLEAN_TIERS / OM_SVC_TIERS เป็นอาร์เรย์ตัวเดิมตลอด setOmTiers แทนที่ไส้ข้างใน — ที่อ้างไว้แล้วจะได้เห็นค่าใหม่ */
  const OM_CLEAN_DEF = [[5, 4000], [10, 5000], [15, 7000], [20, 8000], [30, 9500], [40, 11000], [50, 13000], [100, 17500], [200, 33000]];
  const OM_SVC_DEF = [[10, 5000], [100, 10000], [250, 20000], [1000, 50000]];
  const OM_CLEAN_TIERS = OM_CLEAN_DEF.map((r) => r.slice());
  const OM_SVC_TIERS = OM_SVC_DEF.map((r) => r.slice());
  /* แถวที่ใช้ได้ = ขนาด > 0 และราคา ≥ 0 · เรียงตามขนาด · ไม่เหลือสักแถว = กลับไปใช้ค่าตั้งต้น */
  function omTierNorm(rows) {
    const out = (Array.isArray(rows) ? rows : rows && typeof rows === "object" ? Object.values(rows) : [])
      .map((r) => [+(r || [])[0], +(r || [])[1]])
      .filter((r) => isFinite(r[0]) && r[0] > 0 && isFinite(r[1]) && r[1] >= 0)
      .sort((a, b) => a[0] - b[0]);
    return out.length ? out : null;
  }
  function setOmTiers(v) {
    const put = (dst, src, def) => { dst.length = 0; (omTierNorm(src) || def).forEach((r) => dst.push(r.slice())); };
    put(OM_CLEAN_TIERS, (v || {}).clean, OM_CLEAN_DEF);
    put(OM_SVC_TIERS, (v || {}).svc, OM_SVC_DEF);
  }
  /* ราคาในตาราง = ราคาที่ขนาดนั้นพอดี · ระหว่างสองแถวคิดเฉลี่ยตามสัดส่วน (เส้นตรง) ไม่กระโดดเป็นขั้น
     (ผู้ใช้: 60 kWp เดิมได้ราคาเท่า 100 kWp) · เล็กกว่าแถวแรก = ราคาแถวแรก · เกินแถวสุดท้าย = เรต/kWp ของแถวสุดท้าย
     ปัดขึ้นทีละ RULES.omRound (ค่าเริ่ม 100) · ตรงขนาดในตารางพอดีได้ราคาในตารางเป๊ะ */
  function omTierPrice(tiers, kw) {
    const k = Math.max(0, +kw || 0);
    if (!k || !tiers.length) return 0;
    const st = RULES.omRound > 0 ? RULES.omRound : 100;
    const up = (v) => Math.ceil(v / st - 1e-9) * st;
    if (k <= tiers[0][0]) return tiers[0][1];
    for (let i = 1; i < tiers.length; i++) {
      const a = tiers[i - 1], b = tiers[i];
      if (k <= b[0]) return k === b[0] ? b[1] : up(a[1] + (b[1] - a[1]) * (k - a[0]) / (b[0] - a[0]));
    }
    const last = tiers[tiers.length - 1];
    return up(k * last[1] / last[0]);
  }
  const OM_DEF = { years: 2, perYear: 1 };
  function omDefaults(b, kw) { return Object.assign({}, OM_DEF, { years: RULES.omYears, perYear: RULES.omPerYear, visit: omTierPrice(OM_CLEAN_TIERS, kw), svc: omTierPrice(OM_SVC_TIERS, kw) }); }
  /* O&M รวมในราคาติดตั้งทุกใบ (ไม่มีตัวเลือกไม่รวม) · แก้ต่อใบได้แค่ ปีรับประกัน กับ ล้างแผงปีละกี่ครั้ง
     ราคาล้าง/ครั้ง กับงาน O&M/ปี มาจากตารางเสมอ — ใบเก่าที่เคยเก็บ visit/svc/off ไว้ ไม่ถูกอ่านแล้ว */
  function omCalc(b, panels, kw) {
    const d = omDefaults(b, kw), raw = (b && b.om) || {};
    const o = Object.assign({}, d);
    ["years", "perYear"].forEach((k) => { const v = raw[k]; o[k] = v === "" || v == null || !isFinite(+v) ? d[k] : Math.max(0, +v); });
    const visit = d.visit, svc = d.svc;
    const year = o.perYear * visit + svc;   // ค่าบริการต่อปี = ล้าง × ครั้ง + งาน O&M
    return { o, def: d, visit, svc, year, included: o.years * year, renew: year, renew3: year * 3, off: false };
  }

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
    { key: "board", sec: "board", group: G_BOARD, th: "ตู้ไฟ", icon: "box",
      hint: "แยกเป็นตู้ — กรอกจำนวนตู้ แล้วกรอกอุปกรณ์ที่อยู่ในตู้นั้น",
      boards: [
        { key: "ac", name: "ตู้ไฟ AC", unit: "ตู้", items: [] },
        { key: "dc", name: "ตู้ไฟ DC", unit: "ตู้", items: [] },
        { key: "logger", name: "ตู้ไฟ DATA LOGGER", unit: "ตู้", items: [
          { key: "janitza", name: "Janitza Power Meter", unit: "ตัว" },
          { key: "ct", name: "CT (หม้อแปลงกระแส)", unit: "ตัว" },
        ] },
      ] },
    { key: "water", sec: "water", group: G_WATER, th: "ระบบสูบน้ำ", icon: "power",
      hint: "ปั๊มน้ำสำหรับระบบล้างแผง — เลือกกำลังตามหน้างาน",
      items: [
        { key: "p300", name: "Pump 300W", unit: "ตัว" },
        { key: "p350", name: "Pump 350W", unit: "ตัว" },
        { key: "p400", name: "Pump 400W", unit: "ตัว" },
        { key: "p900", name: "Pump 900W", unit: "ตัว" },
        { key: "booster", name: "Booster Pump set (2 motor)", unit: "ชุด" },
      ] },
    { key: "tank", sec: "water", group: G_TANK, th: "ถังเก็บน้ำ", icon: "box",
      items: [
        { key: "t1000", name: "ถังเก็บน้ำ 1,000 ลิตร", unit: "ใบ" },
        { key: "t2000", name: "ถังเก็บน้ำ 2,000 ลิตร", unit: "ใบ" },
        { key: "t3000", name: "ถังเก็บน้ำ 3,000 ลิตร", unit: "ใบ" },
      ] },
    { key: "pipe", sec: "water", group: G_PIPE, th: "ท่อน้ำ", icon: "grid",
      hint: "ท่อ PPR — กรอกจำนวนเส้น (ข้อต่อ/วาล์ว ใส่ในอุปกรณ์ประกอบ)",
      items: [{ key: "ppr34", name: "ท่อ PPR 3/4\"", unit: "เส้น" }] },
  ];

  /* ── ข้อต่อ/วาล์วท่อน้ำ PPR ──
     แนวเดียวกับข้อต่อรางไฟ/ท่อร้อยสาย: จำนวนขึ้นกับการเดินท่อจริง กรอกเอง แต่ชื่อเลือกจากรายการ
     เดิมช่องนี้ให้ไล่หาจากของทั้งคลัง 500 กว่าตัว ซึ่งของท่อน้ำกองอยู่ในหมวด "อื่นๆ" ปนกับของอื่นหมด
     แยกกลุ่มตามขนาดท่อ จะได้กดกรองขนาดแล้วเห็นเฉพาะของขนาดนั้น */
  const PPR_SIZES = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"'];
  const PPR_FIT_KINDS = [
    "ข้องอ 90°", "ข้องอ 45°", "ข้องอเกลียวใน 90°", "ข้องอเกลียวนอก 90°",
    "ข้อต่อตรง", "ข้อต่อเกลียวใน", "ข้อต่อเกลียวนอก", "ข้อต่อยูเนี่ยนเกลียวนอก",
    "สามทาง", "สามทางเกลียวใน", "ข้อลด", "ฝาครอบปิดปลายท่อ",
    "สต๊อปวาล์ว", "บอลวาล์ว", "เช็ควาล์ว", "แคลมป์รัดท่อ",
  ];
  function pipeFittings() {
    const out = [];
    PPR_SIZES.forEach((sz) => PPR_FIT_KINDS.forEach((k) => out.push({ name: k + " PPR " + sz, unit: "ชิ้น", group: "PPR " + sz })));
    return out;
  }
  /* ── ท่อ PPR + ก๊อกน้ำจากแบบ 3D (plan3d.obstacles ชนิด pipe) ──
     ท่อ 4 ม./เส้น เผื่อ 10% (รวมท่อตั้งขึ้นก๊อก) · ข้อต่อตรงทุก 4 ม. · ข้องอตามมุมเลี้ยว (< 60° = 45°) · ฝาปิดปลาย 1 ต่อเส้น
     · แคลมป์ทุก ~1.2 ม. (ตรงกับ Rail ที่วางใน 3D) · ก๊อก 1 จุด = สามทาง + ข้องอเกลียวใน + ก๊อกบอลสนาม
     คืนชื่อมาตรฐาน (ตระกูล pipeFittings) + kind/size — หน้า BOQ เทียบชื่อในคลังให้ทีหลัง */
  const PPR_MM = { 20: '1/2"', 25: '3/4"', 32: '1"', 40: '1-1/4"', 50: '1-1/2"', 63: '2"' };
  function pipeFromPlan(plan) {
    const obs = ((plan && plan.obstacles) || []).filter((o) => o && o.p3sType === "pipe");
    if (!obs.length) return null;
    const by = {};
    obs.forEach((o) => {
      const mm = Math.round((+o.d || 0.025) * 1000), sz = PPR_MM[mm] || '3/4"';
      const x = +o.x || 0, z = +o.z || 0;
      let P;
      if (Array.isArray(o.pts) && o.pts.length >= 2) P = o.pts.map((q) => ({ x: x + (+q.x || 0), z: z + (+q.z || 0) }));
      else { const L = (+o.w || 1) / 2, a = (+o.rot || 0) * Math.PI / 180; P = [{ x: x - Math.cos(a) * L, z: z - Math.sin(a) * L }, { x: x + Math.cos(a) * L, z: z + Math.sin(a) * L }]; }
      let len = 0, e90 = 0, e45 = 0;
      for (let i = 1; i < P.length; i++) len += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
      for (let i = 1; i < P.length - 1; i++) {
        const ax = P[i].x - P[i - 1].x, az = P[i].z - P[i - 1].z, bx = P[i + 1].x - P[i].x, bz = P[i + 1].z - P[i].z;
        const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz); if (la < 1e-3 || lb < 1e-3) continue;
        const t = Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb)))) * 180 / Math.PI;
        if (t >= RULES.turn90) e90++; else if (t >= RULES.turn45) e45++;
      }
      const g = by[sz] || (by[sz] = { size: sz, len: 0, pipes: 0, taps: 0, e90: 0, e45: 0, joints: 0, clamps: 0 });
      g.len += len; g.pipes++; g.taps += (o.taps || []).length; g.e90 += e90; g.e45 += e45;
      g.joints += Math.max(0, Math.ceil(len / RULES.pprLen) - 1); g.clamps += Math.ceil(len / RULES.pprClamp) + 1;
    });
    const sizes = PPR_SIZES.filter((s) => by[s]).map((s) => by[s]), items = [];
    sizes.forEach((g) => {
      const it = (kind, name, qty, unit) => { if (qty > 0) items.push({ kind, size: g.size, name, qty, unit }); };
      it("pipe", "ท่อ PPR " + g.size, Math.ceil((g.len + g.taps * RULES.pprTap) * (1 + RULES.pprSpare / 100) / RULES.pprLen), "เส้น");
      it("e90", "ข้องอ 90° PPR " + g.size, g.e90, "ชิ้น");
      it("e45", "ข้องอ 45° PPR " + g.size, g.e45, "ชิ้น");
      it("joint", "ข้อต่อตรง PPR " + g.size, g.joints, "ชิ้น");
      it("tee", "สามทาง PPR " + g.size, g.taps, "ชิ้น");
      it("telb", "ข้องอเกลียวใน 90° PPR " + g.size, g.taps, "ชิ้น");
      it("cap", "ฝาครอบปิดปลายท่อ PPR " + g.size, g.pipes, "ชิ้น");
      it("clamp", "แคลมป์รัดท่อ PPR " + g.size, g.clamps, "ชิ้น");
      it("tap", "ก๊อกบอลสนาม " + g.size, g.taps, "ตัว");
    });
    return { sizes: sizes.map((g) => ({ size: g.size, len: Math.round(g.len * 10) / 10, pipes: g.pipes, taps: g.taps })), items };
  }
  /* ── รางไฟจากแบบ 3D (plan3d.obstacles ชนิด tray) ──
     ทุกเส้นวางบนหลังคา (บน Rail ขวาง + L-feet ในแบบ 3D) → แถวรางต่อขนาด ติด rail: true (เฉพาะรางที่มีขาล็อก)
     ขนาด = รางขนาดแรกของชนิดนั้นที่กว้าง ≥ ความกว้างที่วาด (o.d ม.) · กว้างเกินทุกขนาด = ขนาดใหญ่สุด
     ข้อต่อ: มุมเลี้ยว ≥ 60° = ข้องอ 90° แนวราบ · 15–60° = 45° · แผ่นปิดหัว-ท้าย 2 ต่อเส้น
     ตัวราง/ชุดข้อต่อ/ขาล็อก/T-BOLT/Rail ถอดต่อจาก wayItems ตามแถวเหมือนรางที่มาจากสายไฟ */
  // ── ทางเดิน (WALKWAY) จากแบบ 3D — obstacles p3sType "walkway" (เส้นหลายจุด pts สัมพัทธ์ x/z · ของเก่า = เส้นตรงตาม w/rot)
  //    ได้แถว struct.walkway แนวละแถว { len, p3: 1 } แล้วสูตร WALKWAY เดิมใน calcStructures คิดแผ่น/END CLAMP/RAIL/ชุดยึดต่อ
  /* ความยาวแผ่น WALKWAY: เลือกต่อใบ (st.walkwayLen) จากรายการที่มีขาย (RULES.walkSheet)
     ไม่ได้เลือก/เลือกไว้แต่เอาออกจากรายการแล้ว = 2.44 ถ้ามีขาย ไม่งั้นตัวแรก
     ชื่อ: 2.44 ม. = "WALKWAY+JOINER" (ชื่อเดิมในคลัง) · ยาวอื่น = "WALKWAY+JOINER 3M" */
  const WALK_STD = 2.44;
  function walkLens() { const a = RULES.walkSheet; return Array.isArray(a) && a.length ? a : [+a > 0 ? +a : WALK_STD]; }
  function walkLenOf(st) {
    const L = walkLens(), v = st && +st.walkwayLen;
    return v > 0 && L.indexOf(v) >= 0 ? v : L.indexOf(WALK_STD) >= 0 ? WALK_STD : L[0];
  }
  function walkName(len) { return "WALKWAY+JOINER" + (+len === WALK_STD ? "" : " " + (+len) + "M"); }
  function walkFromPlan(plan) {
    const obs = ((plan && plan.obstacles) || []).filter((o) => o && o.p3sType === "walkway");
    const rows = [];
    let total = 0;
    obs.forEach((o) => {
      const x = +o.x || 0, z = +o.z || 0;
      let P;
      if (Array.isArray(o.pts) && o.pts.length >= 2) P = o.pts.map((q) => ({ x: x + (+q.x || 0), z: z + (+q.z || 0) }));
      else { const L = (+o.w || 1) / 2, a = (+o.rot || 0) * Math.PI / 180; P = [{ x: x - Math.cos(a) * L, z: z - Math.sin(a) * L }, { x: x + Math.cos(a) * L, z: z + Math.sin(a) * L }]; }
      let len = 0;
      for (let i = 1; i < P.length; i++) len += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
      if (len < 0.05) return;
      len = Math.round(Math.ceil(len / RULES.walkRound - 1e-9) * RULES.walkRound * 100) / 100;   // ปัดขึ้นทีละ 10 ซม. (ตั้งค่าได้)
      rows.push({ len, p3: 1, segs: P.length - 1 });
      total += len;
    });
    if (!rows.length) return null;
    return { rows, runs: rows.length, total: Math.round(total * 10) / 10, sheets: rows.reduce((t, r) => t + Math.ceil(r.len / walkLenOf(null)), 0) };
  }

  function trayFromPlan(plan, kind, hdg) {
    const obs = ((plan && plan.obstacles) || []).filter((o) => o && o.p3sType === "tray");
    if (!obs.length) return null;
    const spec = trayKindOf(kind);
    // เลือกเองเฉพาะรางสีมาตรฐาน (ชื่อจบที่ "mm.") — รางสีพิเศษ (สีขาว) ให้คนเลือกเองในตาราง
    const std = spec.sizes.filter((nm) => /mm.$/.test(nm));
    const pool = std.length ? std : spec.sizes;
    const pick = (wMm) => pool.find((nm) => trayDim(nm).w >= wMm - 0.5) || pool[pool.length - 1];
    const by = {}, fit = {};
    let total = 0, bends = 0;
    const addFit = (k, sz, q) => { if (q <= 0) return; const nm = hdgName(k + " " + spec.brief + " " + sz, hdg); fit[nm] = (fit[nm] || 0) + q; };
    obs.forEach((o) => {
      const x = +o.x || 0, z = +o.z || 0;
      let P;
      if (Array.isArray(o.pts) && o.pts.length >= 2) P = o.pts.map((q) => ({ x: x + (+q.x || 0), z: z + (+q.z || 0) }));
      else { const L = (+o.w || 1) / 2, a = (+o.rot || 0) * Math.PI / 180; P = [{ x: x - Math.cos(a) * L, z: z - Math.sin(a) * L }, { x: x + Math.cos(a) * L, z: z + Math.sin(a) * L }]; }
      let len = 0, e90 = 0, e45 = 0;
      for (let i = 1; i < P.length; i++) len += Math.hypot(P[i].x - P[i - 1].x, P[i].z - P[i - 1].z);
      for (let i = 1; i < P.length - 1; i++) {
        const ax = P[i].x - P[i - 1].x, az = P[i].z - P[i - 1].z, bx = P[i + 1].x - P[i].x, bz = P[i + 1].z - P[i].z;
        const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz); if (la < 1e-3 || lb < 1e-3) continue;
        const t = Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (la * lb)))) * 180 / Math.PI;
        if (t >= RULES.trayTurn90) e90++; else if (t >= RULES.trayTurn45) e45++;
      }
      if (len < 0.05) return;
      const wMm = Math.round((+o.d || 0.1) * 1000), sz = pick(wMm), suf = traySuffix(sz);
      const g = by[sz] || (by[sz] = { size: sz, wMm, len: 0, runs: 0 });
      g.len += len; g.runs++; total += len; bends += e90 + e45;
      addFit("ข้องอ 90° แนวราบ", suf, e90);
      addFit("ข้องอ 45° แนวราบ", suf, e45);
      addFit("แผ่นปิดหัว-ท้าย", suf, RULES.trayEnd);
    });
    const rows = spec.sizes.filter((nm) => by[nm]).map((nm) => Object.assign({ size: nm, length: Math.round(by[nm].len * 10) / 10, p3: 1 },
      hdg ? { hdg: true } : {}, spec.hanger ? { rail: true } : {}));
    if (!rows.length) return null;
    const fits = Object.keys(fit).map((nm) => ({ name: nm, qty: fit[nm], unit: "ชุด", p3: 1 }));
    return { kind: spec.key, rows, fits, runs: obs.length, total: Math.round(total * 10) / 10, bends,
      sizes: rows.map((r) => ({ size: r.size, len: r.length, runs: by[r.size].runs })) };
  }
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
  /* งานโครงการไม่ไล่ถอด Accessories ทีละชิ้น ใช้เงินเผื่อเป็น % ของราคาทุนวัสดุแทน
     ฐานคิด = ทุกหมวดวัสดุ ยกเว้นหมวดค่าแรง/ค่าธรรมเนียม/ขนส่ง/บริหาร และยกเว้นตัวเอง */
  const ACC_ALLOW_PCT = 5;
  const ACC_ALLOW_PCT_HOME = 10;   // งานบ้านของจุกจิกต่อเงินวัสดุมากกว่า
  const accAllowDef = (b) => (b && b.jobType === "home" ? RULES.accHome : RULES.accProj);
  /* 5% เป็นค่ามาตรฐาน ไม่ใช่ค่าตายตัว — งานที่ของจุกจิกเยอะ (หลังคาหลายผืน เดินสายไกล)
     ต้องเผื่อมากกว่านี้ ปล่อยให้ตั้งเองได้ต่อใบ · เว้นว่าง = กลับไปใช้ 5%
     คุมไว้ 0–100% กันพิมพ์ผิดแล้วเงินเผื่อบานเกินราคาวัสดุทั้งงาน */
  function accAllowPct(b) {
    const raw = b && b.accAllowPct;
    if (raw === "" || raw == null) return accAllowDef(b);
    const v = +raw;
    if (!isFinite(v)) return accAllowDef(b);
    return Math.max(0, Math.min(100, v));
  }

  const ROOF_OPTIONS = ROOF_HOOKS.map((r) => r.roof);

  // ── ตาราง OD สายไฟ (mm) ตามชนิด + ขนาด sq.mm — อ้างอิง "คำนวณ BOQ.xlsx" ──
  const CABLE_OD = {
    "CV FD 4C":    {2.5:13.5,4:14.5,6:16,10:17.5,16:20,25:24,35:27,50:30,70:35,95:39,120:44,150:49,185:54,240:61,300:68,400:76},
    "CV FD 3C":    {2.5:12.5,4:13.5,6:15,10:16,16:18,25:22,35:24,50:27,70:31,95:36,120:39,150:44,185:49,240:55,300:61,400:68},
    "CV FD 2C":    {2.5:12,4:13,6:14,10:15,16:17,25:21,35:23,50:26,70:29,95:33,120:37,150:41,185:45,240:51,300:56,400:63},
    "CV FD 1C":    {1.5:6.3,2.5:6.8,4:7.3,6:7.9,10:8.4,16:9.4,25:11,35:12,50:13.5,70:15,95:17.5,120:19,150:21,185:23,240:26,300:29,400:32,500:36,630:40,800:45,1000:51},
    "IEC01 (THW)": {2.5:4,4:4.6,6:5.2,10:6.7,16:7,25:9.7,35:10.9,50:12.8,70:14.6,95:17.1,120:18.8,150:20.9,185:23.3,240:26.6,300:29.6,400:33.2},
    "PV Cable":    {2.5:4.6,4:5,6:6.5,10:7.6},
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
  function conduitFillLimit(n) { const k = Math.max(0, Math.round(+n || 0)); return k === 1 ? RULES.condFill1 : k === 2 ? RULES.condFill2 : RULES.condFill3; }
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
    return { totalArea: total, wayArea: area, fillPct: pct, ok: pct <= RULES.wayFill };
  }
  // หาขนาดท่อขั้นต่ำที่รับสายได้ fill ≤ 40%
  function calcConduitSize(cables) {
    let total = 0;
    (cables || []).forEach(function (c) { total += wireArea(c.type, c.size) * (+c.qty || 0); });
    function find(table, keyFn) {
      for (var i = 0; i < table.length; i++) {
        var r = table[i]; var a = Math.PI * (r.id / 2) * (r.id / 2);
        if (a * RULES.condFill3 / 100 >= total) return { label: keyFn(r), fillPct: total / a * 100 };
      }
      return null;
    }
    return { totalArea: total, hdpe: find(HDPE_TABLE, function (r) { return r.mm + "mm"; }), imc: find(IMC_CONDUIT, function (r) { return r.sz; }) };
  }

  /* ══════════════════════════════════════════════════
     ค่าตั้งต้นอุปกรณ์ท่อร้อยสายของบริษัท — ตั้งครั้งเดียวที่หน้าคลังสินค้า ใช้กับใบใหม่ทุกใบ
     ท่าเดียวกับตารางพิกัดกระแส (setAmpacity) คือแอปโหลดจาก RTDB แล้วยัดเข้ามาที่นี่ตอนบูต

     ⚠ ใบที่ถอดไว้แล้วต้องไม่ขยับตามค่าตั้งต้นที่มาแก้ทีหลัง — ใบเสนอราคาที่ส่งลูกค้าไปแล้ว
       เปลี่ยนจำนวนเองไม่ได้ · กติกานั้นอยู่ใน mergeBOQ ไม่ใช่ที่นี่
     ══════════════════════════════════════════════════ */
  const CONDUIT_SPARE_FIXED = { clamp: 10, bushing: 10, cchannel: 10, connector: 10, coupling: 10, upStraight: 10, upClamp: 10, upConnector: 10, flex: 10 };

  /* ── กฎคิดจำนวนอุปกรณ์ท่อ IMC — ตัวเลขทุกตัวตั้งค่าได้ที่หน้าคลังสินค้า ──
     เดิมกฎพวกนี้ฝังเป็นตัวเลขในสูตร แก้ได้แค่คนเขียนโค้ด ตอนนี้เป็นค่าตั้งต้นของบริษัท
     หน่วยของแต่ละตัวเขียนกำกับไว้ เพราะ "1.2" ในสูตรไม่เคยบอกว่าคือความยาวรางซี */
  /* acc = อุปกรณ์ที่กฎแถวนี้คุม — ใช้จับคู่กับ % เผื่อ (คีย์เดียวกับ conduitSpare)
     อุปกรณ์หนึ่งตัวมีได้หลายกฎ (รางซี · คุปปิ้ง) แถวที่ acc ซ้ำกันต้องอยู่ติดกันเสมอ
     หน้าตั้งค่ารวมช่อง % เผื่อ ของกลุ่มที่ติดกันเป็นช่องเดียว */
  const IMC_RULE = [
    { key: "clampM",     acc: "clamp",     th: "ท่อยาวกี่เมตร ต่อแคล้มประกับ 1 ตัว",  unit: "ม./ตัว",  def: 1,   min: 0.05 },
    { key: "bushingPer", acc: "bushing",   th: "บุชชิ่ง/ล็อกนัท ต่อท่อ 1 ท่อน",        unit: "ชิ้น/ท่อน", def: 3 },
    { key: "ccPerClamp", acc: "cchannel",  th: "รางซี ที่ใช้ต่อแคล้ม 1 ตัว",           unit: "ม./ตัว",  def: 0.2 },
    { key: "ccLen",      acc: "cchannel",  th: "รางซี 1 เส้น ยาว",                    unit: "ม./เส้น", def: 1.2, min: 0.05 },
    { key: "connPer",    acc: "connector", th: "คอนเนคเตอร์ ต่อท่อ 1 ท่อน",            unit: "ชิ้น/ท่อน", def: 1 },
    { key: "coupPer",    acc: "coupling",  th: "คุปปิ้ง ต่อท่อ 1 ท่อน",                 unit: "ชิ้น/ท่อน", def: 1 },
    { key: "coupPb",     acc: "coupling",  th: "คุปปิ้ง เพิ่มต่อ PULL BOX 1 ใบ",        unit: "ชิ้น/ใบ",  def: 2 },
    { key: "flexPerConn", acc: "flex",     th: "ท่ออ่อน ต่อคอนเนคเตอร์ 1 ตัว",          unit: "ม./ตัว",  def: 0.5 },
  ];
  const IMC_RULE_DEF = {};
  IMC_RULE.forEach((r) => { IMC_RULE_DEF[r.key] = r.def; });

  const CONDUIT_DEF = { rule: {}, per: {}, spare: {} };
  function setConduitDefaults(d) {
    const v = d || {};
    CONDUIT_DEF.rule = Object.assign({}, v.rule);
    CONDUIT_DEF.per = Object.assign({}, v.per);
    CONDUIT_DEF.spare = Object.assign({}, v.spare);
  }
  /* กฎที่ใช้จริงของใบหนึ่ง — เติมคีย์ที่ขาดด้วยค่าตั้งต้นเสมอ
     ตัวเลขที่ต้องหาร (clampM · ccLen) กัน 0 ไว้ ไม่งั้นได้ Infinity แล้ว Math.round ระเบิดเป็น NaN */
  function imcRule(r) {
    const out = {};
    IMC_RULE.forEach((d) => {
      const v = +(r || {})[d.key];
      out[d.key] = isFinite(v) && v >= 0 && !(d.min != null && v < d.min) ? v : d.def;
    });
    return out;
  }
  function conduitDefaults() {
    return { rule: Object.assign({}, CONDUIT_DEF.rule), per: Object.assign({}, CONDUIT_DEF.per),
      spare: Object.assign({}, CONDUIT_SPARE_FIXED, CONDUIT_DEF.spare) };
  }

  /* ใบ BOQ ที่พร้อมใช้ของงานหนึ่ง = ค่าเริ่มต้น ทับด้วยของที่บันทึกไว้
     ใบที่เคยถอดไว้แล้วได้ค่าอุปกรณ์ท่อของตัวเองเสมอ ไม่รับค่าตั้งต้นของบริษัทที่มาแก้ทีหลัง
     (ใบเก่าที่ยังไม่มีคีย์ conduitPer แปลว่าถอดไว้ตอนที่ยังไม่มีฟีเจอร์นี้ = ใช้กฎอัตโนมัติ) */
  function mergeBOQ(job) {
    const base = blankBOQ(job);
    const saved = (job || {}).boq;
    if (!saved) return base;
    const out = Object.assign(base, saved);
    out.conduitPer = Object.assign({}, saved.conduitPer);
    out.conduitSpare = Object.assign({}, CONDUIT_SPARE_FIXED, saved.conduitSpare);
    /* ใบที่ถอดไว้ก่อนมีกฎแบบตั้งค่าได้ ไม่มีคีย์ conduitRule — ปล่อย null ไว้แบบนั้น
       calcBOQ เห็น null แล้วใช้สูตรชุดเดิม จำนวนและราคาของใบที่ส่งลูกค้าไปแล้วจะได้ไม่ขยับ
       ห้ามเติมค่าตั้งต้นให้ใบเก่าที่นี่ — เติมเมื่อไร ใบเก่าทั้งระบบเปลี่ยนราคาพร้อมกันทันที */
    out.conduitRule = saved.conduitRule ? imcRule(saved.conduitRule) : null;
    /* ค่าแรงตั้งเหมารวมเป็นค่าเริ่ม — ใบเก่าบันทึก "split" ติดมาจากค่าเริ่มเดิมทั้งที่ไม่เคยกรอกรายการ (labor ยัง null)
       ใบแบบนั้นถือว่ายังไม่ได้เลือก ให้เป็นเหมารวม · ใบที่กรอกแยกรายการไว้จริงคงเดิม */
    if (out.laborMode !== "lump" && saved.labor == null) out.laborMode = "lump";
    /* การไฟฟ้า / ประเภทการขออนุญาต อ่านจากข้อมูลลูกค้าทุกครั้งที่เปิด ไม่ใช้ค่าที่ติดมากับใบ — แก้จังหวัดแล้วใบตามทันที */
    out.gridAuth = gridAuthOf(job);   // base ถูก Object.assign ทับด้วย saved แล้ว ต้องอ่านจากงานตรง ๆ
    out.permitType = blankBOQ(job).permitType;
    return out;
  }

  function blankBOQ(job) {
    job = job || {};
    return {
      panels: +job.panels || 0,
      panelModel: job.panelModel || PANELS[0].model,
      /* เฟสตามที่สำรวจมาจริง ไม่ใช่ค่าที่กรอกไว้ตอนเปิดงาน (ดู SF.phaseOf) */
      phase: window.SF && window.SF.phaseOf ? window.SF.phaseOf(job) : (String(job.phase) === "3" ? 3 : 1),
      comboType: job.comboType || "ready",   // ตู้ Combiner ATMOCE: ready=สำเร็จ · assembled=ตู้ประกอบ
      microRatio: "2:1",
      inverterModel: "",
      invCount: 0,    // 0 = คิดให้อัตโนมัติจากกำลังแผง ÷ MAX PV ต่อตัว
      /* อินเวอร์เตอร์ขนาดที่สอง — งานที่แบ่งตามหลังคาคนละทิศ หรือตัวใหญ่เหลือเศษไม่พอกำลังตัวหนึ่ง
         ว่าง = ใช้รุ่นเดียวทั้งงาน · inv2Count กรอกเองเสมอ ไม่มีค่าอัตโนมัติ */
      inv2Model: "",
      inv2Count: 1,
      strings: 0,     // 0 = คิดให้อัตโนมัติจากแผนสตริง (แผงทั้งงาน ÷ แผงต่ออนุกรม)
      hwBackup: "none",
      /* งานที่ระบุว่ามีตัวคุมแผงมาจากใบสำรวจ — ยังไม่รู้ว่ารุ่นไหน ให้ไปเลือกเองในหน้า BOQ */
      optimizerModel: "",
      hwOptimizer: !!(job.connect && job.connect !== "-" && job.connect !== "ไม่มี"),
      batteryKwh: 0,
      backup: !!job.backup,
      birdnet: !!job.birdnet,
      roof: "เมทัลชีท",
      railSize: railLens()[0],
      gap: RULES.mGap,
      endSpare: RULES.mEndSpare,
      lfeetPerRail: RULES.mLfeetPerRail,
      sparePct: { rail: RULES.mSpRail, joiner: RULES.mSpJoiner, endClamp: RULES.mSpEnd, midClamp: RULES.mSpMid, lfeet: RULES.mSpLfeet, ground: RULES.mSpGround },
      rows: [{ panels: +job.panels || 0, count: 1 }],
      // ค่าเริ่มต้นสายไฟ — ตัด COMBINER-BAT. ออกถ้าไม่มีแบต, ตัด COMBINER-BACKUP ออกถ้าไม่มี Backup
      cables: DEFAULT_CABLES
        .filter((c) => !((c.name === "COMBINER-BAT." && !job.battery) || (c.name === "COMBINER-BACKUP" && !job.backup)))
        .map((c) => Object.assign({}, c)),
      // ท่อร้อยสาย — extra = ข้องอ/ข้อลด/สามทาง ที่เลือกเพิ่มเอง (ระบบเดาจากความยาวไม่ได้)
      conduit: { imc: [], upvc: [], pullbox: [], flex: {}, upFlex: {}, extra: [] },
      // รางไฟ — way = Wireway เหล็กมีฝา · tray = Cable Tray บันได · extra = ข้องอ/ข้อต่อพิเศษที่กรอกเอง
      tray: { way: [], tray: [], spare: CONDUIT_DEF.spare.tray != null && CONDUIT_DEF.spare.tray !== "" ? +CONDUIT_DEF.spare.tray : 10, extra: [] },
      // โครงสร้างรองรับอุปกรณ์ — 0 = ไม่ถอด · kind: floor(โครงตั้งพื้น) / wall(ฉากยึดผนัง)
      support: { inv: 0, invKind: "floor", mdb: 0, mdbKind: "floor", spare: 10, extra: [] },
      // ค่าแรง / ค่าขออนุญาต — null = ยังไม่เคยตั้งค่า ใช้รายการตั้งต้น (ราคา 0 รอกรอก)
      labor: null,
      laborMode: "lump",                          // lump = เหมารวม (ค่าเริ่ม) · split = แยกรายการงาน
      laborLump: { basis: "w", rate: 0, note: "" },   // basis: w(บาท/วัตต์ · ที่ใช้กันจริง) / job / kw / panel
      permit: null,
      // การไฟฟ้าของงาน — ใช้คิดค่าบริการขนานไฟ · ตั้งต้นจากใบขออนุญาต แล้วแบบสำรวจ (ใบเก่าไม่มีคีย์ = ได้จากงานตอนเปิด)
      gridAuth: gridAuthOf(job),
      permitType: (job && ((job.permit && job.permit.permitType) || (job.survey && job.survey.permitType))) || "",
      /* % เผื่อ และ ชิ้น/ท่อน ของอุปกรณ์ท่อ — เริ่มจากค่าตั้งต้นของบริษัท (ตั้งที่หน้าคลังสินค้า)
         ใบที่ถอดไว้แล้วไม่ไหลตามค่าตั้งต้นที่มาแก้ทีหลัง ดู mergeBOQ */
      conduitSpare: Object.assign({}, CONDUIT_SPARE_FIXED, CONDUIT_DEF.spare),
      conduitPer: Object.assign({}, CONDUIT_DEF.per),
      /* กฎคิดจำนวนอุปกรณ์ IMC ติดไปกับใบตั้งแต่เกิด ใบนี้จะได้ไม่เปลี่ยนจำนวนตามค่าที่บริษัทมาแก้ทีหลัง */
      conduitRule: imcRule(CONDUIT_DEF.rule),
      // งานเพิ่มเติม (Input) — โครงสร้างบนหลังคา ถอดวัสดุตามสูตร (ว่าง = ไม่ใช้/ไม่ถอด)
      // งานเพิ่มเติม (Input) — โครงสร้างบนหลังคา ถอดวัสดุตามสูตร (ว่าง = ไม่ใช้/ไม่ถอด)
      struct: {
        ladder: [], walkway: [], walkwayThk: 35, guardrail: [],
        ladderSpare: RULES.ladderSpare, walkwaySpare: RULES.walkSpare, guardrailSpare: RULES.railSpare,
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
    const ladSp = +(st.ladderSpare != null ? st.ladderSpare : RULES.ladderSpare);
    const wlkSp = +(st.walkwaySpare != null ? st.walkwaySpare : RULES.walkSpare);
    const grlSp = +(st.guardrailSpare != null ? st.guardrailSpare : RULES.railSpare);

    // LADDER (บันไดลิง) — ต่อจุด: ความสูง h (m)
    const lad = (st.ladder || []).filter((p) => (+p.h || 0) > 0);
    if (lad.length) {
      // ความยาวท่อนเหล็กตามที่เลือก (ปกติ 6 ม.) — เปลี่ยนแล้วจำนวนท่อนคิดใหม่ตาม
      const lBox = steelBarLen("box", steelSel(b, "box"));
      const lRound = steelBarLen("round", steelSel(b, "round"));
      const lFlat = steelBarLen("flat", steelSel(b, "flat"));
      let boxF = 0, flatPcs = 0, roundLen = 0, plate = 0, anchor = 0;
      lad.forEach((p) => {
        const B = +p.h, C = B + RULES.ladTop;
        boxF += Math.ceil((C * 2) / lBox);                       // เหล็กกล่อง (2 ราง ÷ ความยาวท่อน)
        const G = C >= RULES.ladCageAt ? C - RULES.ladCageFrom : 0;   // ครอบหลัง เมื่อสูง ≥5m
        const K = G * RULES.ladCageV + (G / RULES.ladRing) * 2;
        flatPcs += Math.ceil(K / lFlat);                        // เหล็กแบน (÷ ความยาวท่อน)
        const rungs = Math.ceil(B / RULES.ladRung);
        roundLen += RULES.ladRungW * rungs;                                // ความยาวรวมเหล็กกลม (ขั้นละ 0.5m)
        const Q = B >= RULES.ladBrkAt ? 2 : 1, R = roundLen > 0 ? Q * 2 : 0;
        plate += R; anchor += R * RULES.ladAnchor;
      });
      const roundPcs = Math.ceil(roundLen / lRound);
      const it = [];
      if (boxF) it.push({ name: steelOf(b, "box"), qty: sp(boxF + 1, ladSp), unit: "เส้น" });
      if (roundPcs) it.push({ name: steelOf(b, "round"), qty: sp(roundPcs + 1, ladSp), unit: "เส้น" });
      if (flatPcs) it.push({ name: steelOf(b, "flat"), qty: sp(flatPcs + 1, ladSp), unit: "เส้น" });
      if (plate) it.push({ name: steelOf(b, "plate"), qty: sp(plate + 2, ladSp), unit: "แผ่น" });
      if (anchor) it.push({ name: steelOf(b, "anchor"), qty: sp(anchor + 5, ladSp), unit: "ตัว" });
      (st.ladderExtra || []).filter((x) => (x.name || "").trim() && +x.qty > 0).forEach((x) => it.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
      if (it.length) out.push({ group: "LADDER (บันไดลิง)", items: it });
    }

    // WALKWAY — ต่อแนว: ความยาว len (m). แผ่นยาวตามที่เลือกในใบ (walkLenOf · ค่าเริ่ม 2.44m), RAIL 4.2m
    const wlk = (st.walkway || []).filter((r) => (+r.len || 0) > 0);
    if (wlk.length) {
      let dT = 0, fT = 0, hT = 0, mT = 0;
      const wLen = walkLenOf(st);
      wlk.forEach((r) => {
        const D = Math.ceil((+r.len) / wLen);
        const E = D - 1, F = (E >= 1 ? E : 0) * 2;
        const nR = Math.ceil((+r.len) / RULES.walkRailEvery) + 1;              // RAIL รองใต้ ทุก walkRailEvery ม. + หัวท้าย (เดิม 3 เส้น/แผ่น 2.44 ม.)
        const H = nR * RULES.walkClampRail;                                     // END CLAMP + ชุดยึด ต่อ RAIL (เดิม 6/แผ่น)
        dT += D; fT += F; hT += H; mT += nR;
      });
      // RAIL รองใต้: ชิ้นยาว = กว้างทางเดิน + ยื่นข้างละ · รวมทุกแนวแล้วตัดจากท่อน 4.2 ม. (ชิ้นต่อท่อนปัดลง — เศษสั้นกว่า 1 ชิ้นใช้ไม่ได้)
      const pc = (RULES.walkWidth + RULES.walkRailSide * 2) / 1000, per = Math.floor(4.2 / pc);
      mT = per > 0 ? Math.ceil(mT / per) : Math.ceil(mT * pc / 4.2);
      // ความหนา walkway → ขนาด END CLAMP KIT · 0 = รุ่นที่ไม่ใช้ END CLAMP (ไม่มีค่า = 35 ใบเก่า) — ชุดยึด Rail กับหลังคายังคิดตามเดิม
      const thk = st.walkwayThk != null && st.walkwayThk !== "" ? +st.walkwayThk : 35;
      const it = [];
      // JOINER มาพร้อมแผ่น WALKWAY อยู่แล้ว จึงเป็นรายการเดียวกัน ไม่แยกบรรทัด
      if (dT) it.push({ name: walkName(wLen), qty: dT, unit: "แผ่น" });
      if (hT && thk > 0) it.push({ name: END_CLAMP[thk] || ("END CLAMP KIT " + thk + "mm."), qty: sp(hT, wlkSp), unit: "ชุด" });
      if (mT) it.push({ name: "RAIL 4.2 M", qty: sp(mT, wlkSp), unit: "เส้น" });
      // ชื่อชุดยึด WALKWAY ตรงกับ L FEET ที่เลือกไว้ใน MOUNTING (เปลี่ยนตามประเภทหลังคา)
      if (hT) it.push({ name: roofHookModel, qty: sp(hT, wlkSp), unit: "SET" });
      (st.walkwayExtra || []).filter((x) => (x.name || "").trim() && +x.qty > 0).forEach((x) => it.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
      if (it.length) out.push({ group: "WALKWAY", items: it });
    }

    // GUARD RAIL — ต่อจุด: ความยาว layout len (m), จำนวนมุม corners
    const grl = (st.guardrail || []).filter((p) => (+p.len || 0) > 0 || (+p.corners || 0) > 0);
    if (grl.length) {
      const lAng = steelBarLen("angle", steelSel(b, "angle"));
      let angle = 0, sling = 0, turnb = 0, clip = 0, sleeve = 0;
      grl.forEach((p) => {
        const B = +p.len || 0, D = +p.corners || 0;
        // เหล็กฉาก — support ทุก 3m, 1 ท่อน (ยาว lAng) ทำได้ lAng/3 support
        angle += Math.ceil((B / RULES.grlPost) / Math.max(1, Math.floor(lAng / RULES.grlPost)));
        sling += B > 0 ? B * 2 + RULES.grlSlingX : 0;                        // สลิง = layout ×2 + เผื่อ 20m/จุด
        const L = D * RULES.grlCorner; turnb += L; clip += L * 2; sleeve += L;
      });
      const it = [];
      if (angle) it.push({ name: steelOf(b, "angle"), qty: sp(angle + 1, grlSp), unit: "เส้น" });
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
    const railSize = +b.railSize || railLens()[0];
    const gap = +b.gap || 0;
    const endSpare = +b.endSpare || 0;
    const lfeetPerRail = +b.lfeetPerRail || 0;
    const lfeetBy = b.lfeetBy === "purlin" ? "purlin" : "rail";
    const purlin = +b.purlin > 0 ? +b.purlin : RULES.purlinSpan;
    const nLine = RULES.railLines, spJ = RULES.splicePerJoint, midJ = RULES.midPerJoint, endR = RULES.endPerRow, lugR = RULES.lugPerRow;

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
      /* รางวิ่งตั้งฉากกับด้านยาวของแผงเสมอ (แคล้มจับด้านยาว) — แนวตั้งรางวิ่งตามแถว แนวนอนรางวิ่งตามคอลัมน์
         ทั้งสองแบบแผงเรียงบนรางด้วยด้านสั้น "แผง/แถว" ของแนวนอนจึงหมายถึงแผงต่อแนวราง (ขึ้นตามลาด) */
      const lenRow = (((panel.width + gap) * pr) - gap) + endSpare;     // ความยาว/แถว
      const tonRow = Math.ceil(lenRow / railSize);                       // ปัดเศษ ท่อน/แถว (ROUNDUP)
      const railx2 = tonRow * nLine;                                     // ราง nLine แนว (ค่าเริ่ม 2)
      railSum     += nr * railx2;
      joinerSum   += nr * ((tonRow - 1) * nLine * spJ);
      midSum      += nr * ((pr - 1) * midJ);
      endSum      += nr * endR;
      /* L-FEET: ต่อท่อนราง (เดิม) หรือ ตามระยะแป = จุดยึดทุกแปตลอดแนวราง + 1 · ราง 2 แนวต่อแถว */
      lbracketSum += lfeetBy === "purlin" ? nr * nLine * (Math.ceil(Math.max(0, lenRow - endSpare) / purlin) + 1) : (nr * railx2) * lfeetPerRail;
      earthlugSum += nr * lugR;
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
    /* แบตรุ่นที่เลือกในหน้าออกแบบระบบ (b.batteryModel/batteryQty — BOQEditor ดึงจาก sys.batt ของแบบ 3D)
       มี = ถอดรุ่นนี้ตามจำนวนก้อนแทนแบตรุ่นกลาง · ไม่มี = ใช้แบตรุ่นกลางตาม kWh ของงานเหมือนเดิม */
    const battPick = (+b.batteryKwh || 0) > 0 ? String(b.batteryModel || "").trim() : "";
    const battPickQty = battPick ? Math.max(1, Math.round(+b.batteryQty || 1)) : 0;
    const pushBatt = (arr) => {
      if (battPick) arr.push({ name: battPick, qty: battPickQty, unit: "ก้อน" });
      else if (battCount > 0) arr.push({ name: BATTERY_MODEL, qty: battCount, unit: "SET" });
    };
    const selInv = b.inverterModel ? INVERTERS.find((x) => x.model === b.inverterModel) : null;
    /* ── อินเวอร์เตอร์ขนาดที่สอง ──
       จำนวนตัวกรอกเองเสมอ สิ่งที่ระบบคิดให้คือกำลังที่เหลือให้รุ่นแรกรับ (invAuto ด้านล่าง)
       เลือกรุ่นซ้ำกับตัวแรกไม่ได้ — จะกลายเป็นรุ่นเดียวสองบรรทัดที่รวมกันไม่ได้ในใบเสนอราคา */
    const selInv2 = selInv && b.inv2Model && b.inv2Model !== b.inverterModel
      ? INVERTERS.find((x) => x.model === b.inv2Model) : null;
    const inv2Count = selInv2 ? Math.max(1, Math.round(+b.inv2Count || 1)) : 0;
    const inv2PvKw = selInv2 ? (selInv2.maxPv > 0 ? selInv2.maxPv : selInv2.kw) * inv2Count : 0;

    let invCount, invItems, combItems = null;
    let invAuto = 0, plan = null;
    // งานโครงการ vs งานบ้าน — ต่างกันที่อุปกรณ์มอนิเตอร์และตู้รวม (โครงการใช้ตู้ไฟ DC/AC ของตัวเอง)
    const isProject = (b.jobType || "") !== "home";
    if (selInv) {
      // จำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) — ถ้าไม่ได้ตั้ง MAX PV ใช้ kW ต่อตัวแทน
      // ระบุเองได้ที่ b.invCount (0/ว่าง = ใช้ค่าอัตโนมัติ) เช่นงานที่แบ่งอินเวอร์เตอร์ตามหลังคาคนละทิศ
      const invSizeBase = selInv.maxPv > 0 ? selInv.maxPv : selInv.kw;
      invAuto = invSizeBase > 0 ? Math.max(1, Math.ceil(Math.max(0, kw - inv2PvKw) / invSizeBase)) : 0;
      invCount = +b.invCount > 0 ? Math.max(1, Math.round(+b.invCount)) : invAuto;
      if (selInv.inputs > 0) {
        // ── Huawei (string/hybrid) ── INVERTER = ตัวหลัก/แบต/สำรอง · COMBINER BOX = ตู้+อุปกรณ์ป้องกัน
        const ph = selInv.phase === 3 ? 3 : 1;
        const hw = isHwInv(selInv.model);   // อุปกรณ์มอนิเตอร์/แบต/สำรองไฟของ Huawei ใช้ได้กับ Huawei เท่านั้น
        /* จำนวนสตริงรวม — เอาจากแผนสตริงจริง (แผงทั้งงาน ÷ แผงต่ออนุกรม) ไม่ใช่เดาจากจำนวนช่อง MPPT
           ของเดิมใช้ "ช่องต่อตัว × จำนวนตัว" ซึ่งได้ 4 สตริงสำหรับงาน 155 แผง — น้อยกว่าจริงมาก
           ระบุเองได้ที่ b.strings (สตริงต่อตัว · 0 = อัตโนมัติ) */
        const scIn = stringConfig(panel, selInv, { series: (b.dcSeries != null && b.dcSeries !== "") ? b.dcSeries : undefined });
        const cap2 = selInv2
          ? inv2Count * Math.max(1, (+selInv2.inputs || 1) * Math.max(1, Math.round(+selInv2.strPerMppt || 1)))
          : 0;
        if (scIn.ready) plan = stringPlan(panelCount, scIn.series, selInv, invCount, cap2);
        const capPerInv = Math.max(1, (+selInv.inputs || 1) * Math.max(1, Math.round(+selInv.strPerMppt || 1)));
        const strPer = +b.strings > 0
          ? Math.min(Math.max(Math.round(+b.strings), 1), capPerInv)
          : (plan ? plan.perInv : selInv.inputs);
        const invTotal = invCount + inv2Count;
        const totalStr = +b.strings > 0 || !plan ? invTotal * strPer : plan.strings;
        // กลุ่ม INVERTER
        invItems = [];
        invItems.push({ name: selInv.model, qty: invCount, unit: "ตัว" });
        if (selInv2) invItems.push({ name: selInv2.model, qty: inv2Count, unit: "ตัว" });
        /* ── อุปกรณ์มอนิเตอร์ระดับระบบ: 1 ชุด/งาน ──
           งานโครงการใช้ SmartLogger รวมศูนย์ตัวเดียว (อ่านหลายอินเวอร์เตอร์ผ่าน RS485) ไม่ใช้ Smart Meter + Dongle
           งานบ้านใช้ Smart Meter วัดที่จุดต่อกริด + Dongle 1 ตัว */
        if (!hw) {
          // ยี่ห้ออื่น: ยังไม่มีชุดมอนิเตอร์/มิเตอร์ของยี่ห้อนั้นในระบบ — ให้เพิ่มเองในใบ · แบตใช้รุ่นกลางเดิม
          pushBatt(invItems);
        } else if (isProject) {
          invItems.push({ name: HW.logger, qty: 1, unit: "ตัว" });
        } else {
          invItems.push({ name: ph === 3 ? HW.meter3 : HW.meter1, qty: 1, unit: "ชุด" });
          // 2 รุ่นนี้มี dongle ในตัว (SUN2000-10K-LC0, SUN2000-5K-LB0) — ไม่ต้องถอด Smart Dongle เพิ่ม
          if (!/SUN2000-10K-LC0|SUN2000-5K-LB0/i.test(selInv.model)) invItems.push({ name: HW.dongle, qty: 1, unit: "ชุด" });
        }
        /* โมดูล LUNA S1 (ในคลังชื่อ LUNA2000-7-E1) ต้องมี Power Module C1 — เลือกรุ่นนี้จากออกแบบระบบก็ยังถอด C1 ให้ */
        const lunaPick = battPick && (battPick === HW.lunaS1 || /LUNA2000-(S1|7-E1)/i.test(battPick));
        if (hw && battPick && !lunaPick) pushBatt(invItems);
        else if (hw && (+b.batteryKwh || 0) > 0) {
          const s1 = lunaPick ? battPickQty : Math.ceil((+b.batteryKwh || 0) / RULES.battS1Kwh);   // แบต S1 ก้อนละ battS1Kwh kWh
          const c1 = Math.ceil(s1 / RULES.battS1Per);                       // Power Module 1 ตัว/แสตก (สูงสุด battS1Per ก้อน)
          invItems.push({ name: HW.lunaC1, qty: c1, unit: "ตัว" });
          invItems.push({ name: lunaPick ? battPick : HW.lunaS1, qty: s1, unit: "ก้อน" });
        }
        // ระบบสำรองไฟ 1 ชุด/งาน
        if (!hw) { /* ระบบสำรองไฟ SmartGuard/Backup Box เป็นของ Huawei */ }
        else if (b.hwBackup === "smartguard") invItems.push({ name: ph === 3 ? HW.smartguard3 : HW.smartguard1, qty: 1, unit: "ตัว" });
        else if (b.hwBackup === "backupbox") invItems.push({ name: ph === 3 ? HW.backupbox3 : HW.backupbox1, qty: 1, unit: "ตัว" });
        /* ตัวคุมแผง — เลือกรุ่นจากคลัง ใบเก่าที่ติ๊กแค่ "ใช้" ไว้ (hwOptimizer) ยังถอดรุ่นเดิมแบบ 1:1 ต่อไป
           ไม่งั้นใบที่เคยเสนอราคาไปแล้วจะมีของหายไปเฉย ๆ ตอนเปิดดูย้อนหลัง */
        const optModel = String(b.optimizerModel || "").trim() || (hw && b.hwOptimizer ? HW.optimizer : "");
        if (optModel) {
          const optQty = optimizerQty(optModel, panelCount);
          invItems.push({ name: optModel, qty: optQty, unit: "ตัว" });
          // ตัวคุมแผงยึดเข้ารางด้วย T-BOLT 1 ชุด/ตัวคุม — ไม่เผื่อ เพราะผูกกันแบบ 1:1
          invItems.push({ name: TBOLT_NAME, qty: optQty, unit: "ชุด" });
        }
        /* งานบ้าน/งานโครงการ: ตู้และอุปกรณ์ในตู้ (เบรกเกอร์ · SPD · ฟิวส์ DC) คิดแบบเดียวกันในหมวดตู้ไฟ AC / DC — ไม่มีกลุ่ม COMBINER BOX แล้ว */
        combItems = [];
      } else {
        // String / Hybrid ทั่วไป: จำนวนตัว = ปัดขึ้น(kW รวม ÷ kW ต่อตัว) + แบต
        invItems = [{ name: selInv.model, qty: invCount, unit: "ตัว" }];
        if (selInv2) invItems.push({ name: selInv2.model, qty: inv2Count, unit: "ตัว" });
        pushBatt(invItems);
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
      pushBatt(invItems);
      invItems.push({ name: JUNCTION[phase], qty: 1, unit: "SET" });
      invItems.push({ name: "1.3 m, Three-terminal AC Cable (MW-025013-A)", qty: invCount, unit: "SET" });
      invItems.push({ name: "2 m, Two-terminal AC Cable (MW-025020-B0)", qty: Math.max(invCount - 3, 0), unit: "SET" });
    }

    /* จำนวนอินเวอร์เตอร์รวมทั้งงาน — ใช้กับของที่นับต่อหัวอินเวอร์เตอร์ ไม่ใช่ต่อรุ่น
       ไมโครไม่เข้าทางนี้ (invCount ของไมโครเป็น LOT ไม่ใช่จำนวนตัว) จึงบวก inv2Count ได้ตรง ๆ */
    const invTotalAll = invCount + inv2Count;

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
        /* สายกำลัง AC: ความยาวเส้นทาง × จำนวนชุดเดินขนาน × เส้นต่อชุด (แกนเดียว 1 เฟส = 2 · 3 เฟส = 4 · หลายแกน = 1)
           + สายกราวด์ (c.gnd) ชุดละ 1 เส้น — แถวเก่าที่ไม่มี sets/wires = 1 เท่าเดิม */
        const sets = Math.max(1, Math.round(+c.sets || 1)), wires = Math.max(1, Math.round(+c.wires || 1));
        cableAgg[t] = (cableAgg[t] || 0) + len * sets * wires;
        const g = (c.gnd || "").trim();
        if (g) cableAgg[g] = (cableAgg[g] || 0) + len;   // กราวด์ 1 เส้นต่อเส้นทาง ไม่คูณจำนวนชุด
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
      { name: "BOLT&N2 NUT M8 20mm.", qty: Math.ceil(groundlug * RULES.boltPerLug), unit: "SET" },   // ยึด GROUNDING LUG กับราง
      { name: "EARTHING CLIP", qty: Math.ceil(rowsSum * RULES.earthClipPer), unit: "SET" },          // ต่อแผง (เดิม L-FEET ÷ 2)
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
    /* ── จำนวนอุปกรณ์ต่อท่อ 1 ท่อน ──
       เว้นว่าง = ใช้กฎในโปรแกรม (ตามความยาว / จำนวน PULL BOX) เหมือนเดิมทุกประการ
       กรอกตัวเลข = คิดเป็น ชิ้น/ท่อน × จำนวนท่อน แทนกฎนั้น แล้วบวก % เผื่อทับเหมือนกัน
       ท่าเดียวกับช่องท่ออ่อน (flexMap) ที่เว้นว่างแล้วได้ค่าอัตโนมัติ
       ⚠ ต้องเว้นว่าง = อัตโนมัติ ห้ามตั้งค่าตั้งต้นเป็นตัวเลข
         ไม่งั้นงานที่บันทึกไว้แล้วจะเปลี่ยนจำนวนและราคาเองโดยไม่มีใครแตะ */
    /* ── กฎคิดจำนวนอุปกรณ์ IMC ──
       มี conduitRule = ใบนี้ใช้กฎแบบตั้งค่าได้ (ค่าที่ติดมากับใบ ไม่ใช่ค่าบริษัทวันนี้)
       ไม่มี = ใบที่ถอดไว้ก่อนมีฟีเจอร์นี้ ใช้สูตรชุดเดิมตลอดไป ดูเหตุผลที่ mergeBOQ */
    const ir = b.conduitRule ? imcRule(b.conduitRule) : null;
    const cper = b.conduitPer || {};
    const perPipe = (k) => {
      const v = cper[k];
      if (v === "" || v === null || v === undefined) return null;
      const n = +v;
      return isFinite(n) && n >= 0 ? n : null;
    };
    const cqty = (k, pipes, auto, spare) => {
      const per = perPipe(k);
      return cpct(per != null ? per * pipes : auto, spare);
    };
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
    let totalClamp = 0, totalImcPipes = 0;
    imcSizes.forEach((nm) => {
      const len = imcMap[nm];
      const sz = nm.replace(/^IMC\s*/i, "").trim();      // เช่น 1"
      const pipes = Math.ceil(len / 3);                   // 3m/ท่อน
      const clamp = cqty("clamp", pipes, ir ? len / ir.clampM : len, cs.clamp);
      const bushing = cqty("bushing", pipes, ir ? pipes * ir.bushingPer : 8 + pipes, cs.bushing);
      const connector = cqty("connector", pipes, ir ? pipes * ir.connPer : 10 + 2 * pbHdg, cs.connector);
      const coupling = cqty("coupling", pipes, ir ? pipes * ir.coupPer + pbHdg * ir.coupPb : pipes / 2 + connector, cs.coupling);
      /* ท่ออ่อนคิดเป็นเมตร (เดิมเหมา 1 กล่อง 30 ม. ต่อขนาด ทั้งที่งานบ้านใช้แค่ไม่กี่เมตร)
         = คอนเนคเตอร์ × ม./ตัว (กฎ flexPerConn ค่าตั้งต้น 0.5) + % เผื่อ · อย่างน้อย 1 ม. */
      const flex = Math.max(1, cpct(connector * (ir ? ir.flexPerConn : IMC_RULE_DEF.flexPerConn), cs.flex != null && cs.flex !== "" ? cs.flex : CONDUIT_SPARE_FIXED.flex));
      totalClamp += clamp;
      totalImcPipes += pipes;
      race.push({ name: nm + " (3m/ท่อน)", qty: pipes, unit: "pcs" });
      race.push({ name: "แคล้มประกับ IMC " + sz, qty: clamp, unit: "pcs" });
      race.push({ name: "บุชชิ่ง,ล็อกนัท IMC " + sz, qty: bushing, unit: "pcs" });
      race.push({ name: "คอนเนคเตอร์ท่ออ่อนกันน้ำ IMC " + sz, qty: connector, unit: "pcs" });
      race.push({ name: "คุปปิ้ง " + sz, qty: coupling, unit: "pcs" });
      // ราคา: ตั้งราคาต่อเมตรในคลังได้ · ยังไม่ตั้ง = ราคากล่อง 30 ม. ÷ 30
      race.push({ name: "ท่ออ่อนเหล็กกันน้ำ " + sz, qty: flex, unit: "M" });
    });
    if (imcTotalLen > 0) {
      // รางซี เป็นของรวมทั้งงาน (ไม่แยกขนาด)
      /* รางซีเป็นของรวมทั้งงาน ไม่แยกขนาด — ชิ้น/ท่อน จึงคิดจากจำนวนท่อน IMC ทั้งหมด */
      const cchannel = cqty("cchannel", totalImcPipes,
        ir ? (totalClamp * ir.ccPerClamp) / ir.ccLen : (totalClamp * 0.2) / 1.2, cs.cchannel);
      race.push({ name: "รางซี C-Channel 20x1200x40x1.0 mm.", qty: cchannel, unit: "pcs" });
    }
    // uPVC แยกตามขนาด — ท่อ (2.9m/ท่อน) + อุปกรณ์
    const upFlexMap = cond.upFlex || {};
    Object.keys(upvcMap).forEach((nm) => {
      const len = upvcMap[nm];
      const mm = (nm.match(/(\d+)\s*mm/) || [])[1] || "";
      const suf = mm ? (mm + "mm. (สีขาว)") : "";
      const pipes = Math.ceil(len / 2.9);                 // 2.90m/ท่อน
      const straight = cqty("upStraight", pipes, pipes + RULES.upStraightX, cs.upStraight);  // อัตโนมัติ ท่อน + 4
      const clamp = cqty("upClamp", pipes, len / RULES.upClamp, cs.upClamp);            // อัตโนมัติ ทุก 60cm
      const connector = cqty("upConnector", pipes, RULES.upConn + (hasBat ? RULES.upConnBat : 0) + (hasBk ? RULES.upConnBat : 0) + RULES.upConnPb * pbUpvc, cs.upConnector);
      const flex = (upFlexMap[nm] != null && upFlexMap[nm] !== "") ? Math.round(+upFlexMap[nm] || 0) : 1;
      race.push({ name: nm + " (2.9m/ท่อน)", qty: pipes, unit: "pcs" });
      race.push({ name: "ข้อต่อตรง uPVC " + suf, qty: straight, unit: "pcs" });
      race.push({ name: "แคลมป์ก้ามปู uPVC " + suf, qty: clamp, unit: "pcs" });
      race.push({ name: "คอนเน็ตเตอร์ uPVC " + suf, qty: connector, unit: "pcs" });
      if (flex > 0) race.push({ name: "ท่ออ่อนขาว uPVC " + suf, qty: flex, unit: "box" });
    });
    // PULL BOX (ชิ้น)
    Object.keys(pbMap).forEach((nm) => race.push({ name: nm, qty: pbMap[nm], unit: "pcs" }));
    // ข้องอ/ข้อลด/สามทาง ที่เลือกเพิ่มเอง
    (cond.extra || []).filter((x) => (x.name || "").trim() && +x.qty > 0)
      .forEach((x) => race.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "pcs" }));

    if (race.length) groups.push({ group: "RACE WAY", items: mergeItems(race) });

    // ── รางไฟ (WIREWAY / CABLE TRAY) ──
    const tw = trayNorm(b.tray);
    const waySpare = tw.spare != null ? +tw.spare : RULES.traySpare;
    let wayTotalLen = 0;
    const wayRows = [];
    /* รวมแถวขนาดเดียวกันเข้าด้วยกัน แต่ต้องแยกชุบ/ไม่ชุบ — เป็นของคนละตัว คนละราคา รวมบรรทัดกันไม่ได้ */
    TRAY_KIND_KEYS.forEach((kk) => {
      const map = {};
      (tw[kk] || []).forEach((r) => {
        const nm = (r.size || "").trim(), q = +r.length || 0;
        if (!nm || q <= 0) return;
        const key = (r.hdg ? "1" : "0") + (r.rail ? "1|" : "0|") + nm;
        map[key] = (map[key] || 0) + q;
      });
      Object.keys(map).forEach((key) => {
        wayTotalLen += map[key];
        wayItems(key.slice(3), map[key], waySpare, kk, key.charAt(0) === "1", key.charAt(1) === "1", +b.railSize || 4.2)
          .forEach((x) => wayRows.push(x));
      });
    });
    (tw.extra || []).filter((x) => (x.name || "").trim() && +x.qty > 0)
      .forEach((x) => wayRows.push({ name: x.name.trim(), qty: +x.qty, unit: x.unit || "" }));
    // ชื่อซ้ำ (เช่น พุ๊กเหล็ก ที่มาจากหลายขนาด) รวมเป็นบรรทัดเดียว
    if (wayRows.length) groups.push({ group: G_TRAY, items: mergeItems(wayRows) });

    // ── โครงสร้างรองรับอุปกรณ์ (Inverter / ตู้ MDB) ──
    const sup = b.support || {};
    const supSpare = sup.spare != null ? +sup.spare : 10;
    const nInvSup = Math.max(0, Math.round(+sup.inv || 0));
    const nMdbSup = Math.max(0, Math.round(+sup.mdb || 0));
    if ((nInvSup > 0 || nMdbSup > 0) && (b.jobType || "") !== "home") {   // งานบ้านไม่มีโครงรองรับอุปกรณ์
      const supRows = [];
      const addKind = (n, kindKey) => {
        const K = SUPPORT_KINDS[kindKey] || SUPPORT_KINDS.floor;
        K.per(b).forEach((x) => supRows.push({ name: x.name, qty: Math.ceil(x.qty * n * (1 + supSpare / 100)), unit: x.unit }));
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
      const big = kw >= RULES.gndBigKw;
      const gnd = [
        { name: 'แท่งกราวด์ชุบทองแดง 5/8" ยาว 2.4 m', qty: big ? RULES.gndRodB : RULES.gndRodS, unit: "pcs" },
        { name: 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 2 ทาง 16 sq.mm Rod 5/8"', qty: big ? RULES.gndWeldB : RULES.gndWeldS, unit: "pcs" },
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
      /* หมวดที่แยกเป็นตู้ — ใบรายการแยกหมวดละตู้ (ตู้ไฟ AC / ตู้ไฟ DC / ตู้ไฟ DATA LOGGER) ตัวตู้ + อุปกรณ์ในตู้นั้นอยู่ด้วยกัน */
      if (k.boards) {
        k.boards.forEach((bd) => {
          const rows = [];
          const q0 = Math.max(0, +st[bd.key] || 0);
          if (q0 > 0) rows.push({ name: bd.name, qty: q0, unit: bd.unit });
          (bd.items || []).forEach((it) => { const q = Math.max(0, +st[it.key] || 0); if (q > 0) rows.push({ name: it.name, qty: q, unit: it.unit }); });
          (st[bd.extraKey] || []).forEach((x) => {
            const nm = String(x.name || "").trim(), q = Math.max(0, +x.qty || 0);
            if (nm && q > 0) rows.push({ name: nm, qty: q, unit: x.unit || "ชิ้น" });
          });
          if (rows.length) groups.push({ group: bd.name, items: mergeItems(rows) });
        });
        return;
      }
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
    else if (b.struct && (b.struct.walkway || []).length) {           // งานบ้าน: คิดเฉพาะ WALKWAY (มาจากแบบ 3D) — บันได/ราวกันตกที่ค้างในข้อมูลไม่นับ
      const s0 = b.struct;
      calcStructures(Object.assign({}, b, { struct: { walkway: s0.walkway, walkwayThk: s0.walkwayThk, walkwayLen: s0.walkwayLen, walkwaySpare: s0.walkwaySpare, walkwayExtra: s0.walkwayExtra } })).forEach((g) => groups.push(g));
    }

    // ── ตาข่ายกันนก (BIRD NET) — ถอดวัสดุให้อัตโนมัติเมื่อบ้านติดตาข่ายกันนก ──
    if (b.birdnet) {
      const rolls = Math.max(1, Math.ceil(panelCount / 24));   // ม้วนตาข่าย 8" x 30 ม. (ราว 1 ม้วน/งานบ้าน)
      const clips = Math.max(1, panelCount * 5);               // คลิปล็อค C ~5 ตัว/แผง (เช่น 10 แผง = 50 ตัว)
      groups.push({ group: "BIRD NET (ตาข่ายกันนก)", items: [
        { name: 'ตะแกรงกันนกใต้แผงโซล่าเซล กว้าง 8" ยาว 30 ม.', qty: rolls, unit: "ม้วน" },
        { name: "คลิปล็อคตัว C (short frame) ตามขนาดแผงโซล่า", qty: clips, unit: "ตัว" },
      ] });
    }

    /* ── ACCESSORIES ── งานบ้านและงานโครงการ: ไม่ไล่ถอดทีละชิ้น ใช้เงินเผื่อ % ของราคาทุนวัสดุแทน
         (ยอดคิดตอน applyPrices เพราะต้องรู้ราคาทุนหมวดอื่นก่อน) */
    {
      const accPct = accAllowPct(b);
      groups.push({ group: "ACCESSORIES", items: [
        { name: "Accessories Allowance " + accPct + "%", qty: 1, unit: "เหมา", allowancePct: accPct },
      ] });
    }

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
      inv: invTotalAll,
      // ตู้ Combiner (ATMOCE) + ตู้ไฟ AC / DC / DATA LOGGER ตามจำนวนตู้ในใบถอดของ
      board: (combItems && combItems.length ? 1 : 0) + groups.reduce((n, g) => n + (/^ตู้ไฟ/.test(g.group) ? g.items.filter((x) => x.name === g.group).reduce((m, x) => m + (+x.qty || 0), 0) : 0), 0),
      dcLen: Math.round(dcLen),
      acLen: Math.round(acLen),
      wayLen: Math.round(imcTotalLen + upvcTotalLen + wayTotalLen),
      struct: structPts,
      one: 1,
    };
    /* จำนวนเว้นว่าง = 1 — รายการตั้งต้นไม่มีจำนวน เดิมคิดเป็น 0 ราคาที่กรอกเลยหายไปจากยอด */
    const svcRows = (rows, preset) => (rows == null ? preset.map((p) => Object.assign({}, p, { price: +p.price || 0 })) : rows)
      .filter((r) => r && (r.name || "").trim())
      .map((r) => ({
        name: String(r.name).trim(),
        qty: r.auto && AUTO[r.auto] != null ? AUTO[r.auto] : r.qty == null || r.qty === "" ? (+r.price > 0 ? 1 : 0) : Math.max(0, +r.qty || 0),   // จำนวนว่าง: มีราคา = 1 · ยังไม่ใส่ราคา = 0 (บรรทัดสำรองไว้เฉย ๆ)
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
    const permit = svcRows(b.permit, permitPresetFor(b, kw));
    if (labor.length) groups.push({ group: G_LABOR, items: labor });
    if (permit.length) groups.push({ group: G_PERMIT, items: permit });
    /* ขนส่ง & บริหารจัดการ — เป็นของงานโครงการ งานบ้านส่วนใหญ่ไม่มี
       จึงขึ้นเฉพาะงานที่เข้าไปกรอกไว้จริง (ยังไม่แตะ = null = ไม่ต้องโผล่ในใบถอดของ) */
    if (b.transport != null) { const r = svcRows(b.transport, TRANSPORT_PRESET); if (r.length) groups.push({ group: G_TRANSPORT, items: r }); }
    if (b.manage != null) { const r = svcRows(b.manage, MANAGE_PRESET); if (r.length) groups.push({ group: G_MANAGE, items: r }); }
    // O&M ที่รวมในราคาติดตั้ง (N ปีแรก) — ต้นทุนเข้างานนี้ทุกใบ (om.off เป็น false เสมอแล้ว)
    const om = omCalc(b, panelCount, kw);
    if (!om.off && om.o.years > 0 && om.year > 0) {
      const omRows = [];
      if (om.o.perYear > 0 && om.visit > 0) omRows.push({ name: "ล้างแผง (" + om.o.years + " ปีแรก · ปีละ " + om.o.perYear + " ครั้ง)", qty: om.o.years * om.o.perYear, unit: "ครั้ง", price: om.visit });
      if (om.svc > 0) omRows.push({ name: "งาน O&M ตรวจ/บำรุงรักษาระบบ (" + om.o.years + " ปีแรก)", qty: om.o.years, unit: "ปี", price: om.svc });
      if (omRows.length) groups.push({ group: G_OM, items: omRows });
    }

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

    /* ชื่อที่เปลี่ยนเองจากในใบถอดของ — ทับชื่อที่ระบบถอดให้
       ทำหลัง qtyAdj เพราะคีย์ของ qtyAdj อิงชื่อเดิม ถ้าสลับลำดับจะหากันไม่เจอ
       ราคาไปหาจากคลังด้วย "ชื่อใหม่" ต้นทุนจึงผูกกับของที่เลือกจริง ไม่ใช่ชื่อที่ระบบตั้ง */
    const ren = b.rename || {};
    const renKeep = b.renameKeep || {};   // ชื่อไหนติ๊ก "ใช้ราคาเดิม" ไว้ ราคายังไปหาจากชื่อที่ระบบถอดให้
    if (Object.keys(ren).length) {
      groups.forEach((g) => {
        if (SERVICE_GROUPS.indexOf(g.group) >= 0) return;
        g.items = g.items.map((it) => {
          const k = qtyKey(g.group, it.name);
          const nm = String(ren[k] || "").trim();
          if (!nm || nm === it.name) return it;
          const o = { name: nm, nameAuto: it.name, renamed: true };
          /* priceName = ชื่อที่ใช้ "หาราคา" ปกติเท่ากับชื่อที่แสดง
             ติ๊กใช้ราคาเดิม → ล็อกไว้ที่ชื่อเดิม เปลี่ยนแค่ป้ายบนใบ ต้นทุนไม่ขยับ */
          if (renKeep[k]) o.priceName = it.name;
          return Object.assign({}, it, o);
        });
      });
    }

    return { groups, meta: { panelCount, kw, rowsSum, invCount, invAuto, inv2Count, invTotal: invTotalAll, plan, battCount, auto: AUTO, om, valid: rowsSum === panelCount } };
  }

  /* คีย์จำนวนที่แก้มือ — ผูกกับหมวดด้วย กันชื่อซ้ำข้ามหมวดทับกัน */
  function qtyKey(group, name) { return String(group || "") + "|" + matKey(name); }

  // ── ราคา/ต้นทุน ──────────────────────────────────────────
  // key สำหรับจับคู่ราคา = ชื่อวัสดุ (ตัดส่วนต่อท้าย "(3m/ท่อน)"/"(2.9m/ท่อน)")
  function matKey(name) {
    // trayAlias: ชื่อรางรุ่นเก่าในคลัง/ใบถอดของเก่า ให้เทียบกับชื่อใหม่ได้ ราคาที่ตั้งไว้แล้วจึงไม่หลุด
    return trayAlias(String(name || "").replace(/\s*\(\d+(?:\.\d+)?m\/ท่อน\)\s*$/, "")).trim();
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
    OPTIMIZERS.forEach((o) => add("INVERTER", o.model, "ตัว"));   // ตัวคุมแผงทุกรุ่นในคลัง
    add("INVERTER", JUNCTION[1], "SET"); add("INVERTER", JUNCTION[3], "SET");
    add("INVERTER", "1.3 m, Three-terminal AC Cable (MW-025013-A)", "SET");
    add("INVERTER", "2 m, Two-terminal AC Cable (MW-025020-B0)", "SET");
    // ตู้ประกอบ ATMOCE: ตัวตู้ + อุปกรณ์คงที่ทั้ง 1 เฟส (2P) และ 3 เฟส (4P) — เบรกเกอร์ตามกระแสเป็นชื่อ dynamic ตั้งราคาในสต็อกได้
    add("COMBINER BOX", ATMOCE_ASM_ENCLOSURE.name, ATMOCE_ASM_ENCLOSURE.unit);
    [ATMOCE_ASM_POLE[1], ATMOCE_ASM_POLE[3]].forEach((c) => { add("COMBINER BOX", c.mcb25, "ตัว"); add("COMBINER BOX", c.spd, "ตัว"); add("COMBINER BOX", c.mcb10, "ตัว"); });
    ATMOCE_ASM_SHARED.forEach((x) => add("COMBINER BOX", x.name, x.unit));
    Object.keys(RAIL).forEach((k) => add("MOUNTING", RAIL[k], "SET"));
    add("MOUNTING", "RAIL SPLICE KIT", "SET");
    add("MOUNTING", TBOLT_NAME, "ชุด");        // ยึดขาล็อกรางไฟกับ Rail · ยึดตัวคุมแผงเข้าราง
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
      add("RACE WAY", "ท่ออ่อนเหล็กกันน้ำ " + sz, "M");
      add("RACE WAY", "ท่ออ่อนเหล็กกันน้ำ 30m. " + sz, "box");   // ราคากล่อง — ใช้หารเป็นราคาต่อเมตรถ้ายังไม่ตั้ง
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
    condFittings().forEach((f) => add("RACE WAY", f.name, f.unit));   // ข้องอ/สามทาง/ข้อลด ของท่อ ทุกขนาด
    // รางไฟ — ตัวราง/ข้อต่อ/ขาแขวน แยกตามขนาด (พุ๊กเหล็กใช้ร่วมกับงานโครงสร้าง)
    TRAY_KIND_KEYS.forEach((kk) => {
      const spec = TRAY_KINDS[kk];
      spec.sizes.forEach((nm) => {
        const sz = traySuffix(nm);
        [false, true].forEach((z) => {                            // ของธรรมดา + ของชุบ HDG ตั้งราคาแยกกันได้
          add(G_TRAY, hdgName(nm, z) + " (" + trayLenTxt(spec.pipeLen) + "m/ท่อน)", "ท่อน");
          add(G_TRAY, hdgName("ชุดข้อต่อราง " + spec.brief + " " + sz, z), "ชุด");
          if (spec.hanger) add(G_TRAY, hdgName("ขาล็อกรางไฟ " + spec.brief + " " + sz, z), "ชุด");
        });
      });
    });
    add(G_TRAY, "สกรู+น็อต M6 ประกอบราง", "ชุด");
    trayFittings().forEach((f) => add(G_TRAY, f.name, f.unit));       // ข้องอ/สามทาง/แผ่นปิด ของราง ทุกขนาด
    // โครงสร้างรองรับอุปกรณ์ (เหล็กกล่อง/เหล็กฉาก/เพลท/พุ๊ก ใช้ชื่อร่วมกับงานโครงสร้างบนหลังคา)
    SUPPORT_SHARED.forEach((x) => add(G_SUPPORT, x.name, x.unit));
    add("GROUNDING", 'แท่งกราวด์ชุบทองแดง 5/8" ยาว 2.4 m', "pcs");
    add("GROUNDING", 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 2 ทาง 16 sq.mm Rod 5/8"', "pcs");
    add("GROUNDING", 'อุปกรณ์เชื่อมสายกราวด์เทอร์โมเวล 3 ทาง 16 sq.mm Rod 5/8"', "pcs");
    add("GROUNDING", "GROUNDTESTBOX-PVC-SEC", "pcs");
    // งานโครงสร้าง (LADDER / WALKWAY / GUARD RAIL) — วัสดุเฉพาะที่ยังไม่อยู่ในหมวดอื่น
    // (END CLAMP / RAIL / L FEET ใช้ร่วมกับ MOUNTING แล้ว จึงไม่ซ้ำที่นี่)
    // ชื่อเหล็กมาจาก steelName() ตัวเดียวกับที่ถอดใช้ — ขนาดตั้งต้นจึงตรงกันเสมอ ไม่หลุดจากกัน
    ["box", "round", "flat", "plate", "anchor"].forEach((k) =>
      add("LADDER (บันไดลิง)", steelName(k), STEEL_SPECS[k].unit));
    walkLens().forEach((l) => add("WALKWAY", walkName(l), "แผ่น"));
    add("GUARD RAIL", steelName("angle"), STEEL_SPECS.angle.unit);
    add("GUARD RAIL", "สลิงสแตนเลส 6 มม.", "ม.");
    add("GUARD RAIL", "เกลียวเร่งสแตนเลส 8 มม.", "ตัว");
    add("GUARD RAIL", "กิ๊บสลิงสแตนเลส 6 มม.", "ตัว");
    add("GUARD RAIL", "ปลอกอลูมิเนียม 6 มม.", "ตัว");
    // หมวดงานโครงการ — ตู้ไฟ / ปั๊ม / ถัง / ท่อ / อุปกรณ์มอนิเตอร์
    PROJECT_KITS.forEach((k) => k.items.forEach((it) => add(k.group, it.name, it.unit)));
    pipeFittings().forEach((f) => add(G_PIPE, f.name, f.unit));       // ข้อต่อ/วาล์ว PPR ทุกขนาด
    PPR_SIZES.forEach((sz) => { add(G_PIPE, "ท่อ PPR " + sz, "เส้น"); add(G_PIPE, "ก๊อกบอลสนาม " + sz, "ตัว"); });   // ท่อ/ก๊อกที่ถอดจากแบบ 3D
    // ACCESSORIES มาตรฐาน + เทปพันสายไฟทุกสี (1 เฟส + 3 เฟส)
    ACC_STD.forEach((n) => add("ACCESSORIES", n, "ชิ้น"));
    [...new Set([...ACC_TAPE_1P, ...ACC_TAPE_3P])].forEach((c) => add("ACCESSORIES", "เทปพันสายไฟ " + c, "ชิ้น"));
    return list;
  }

  // ผูกราคาเข้ากับผลลัพธ์ BOQ → คืน groups (มี code/price/total ต่อรายการ) + grandTotal
  function applyPrices(result, priceMap, picks) {
    priceMap = priceMap || {};
    picks = picks || {};
    /* เลือกว่าจะใช้ของยี่ห้อ/รุ่นไหน — ไม่ได้เลือกไว้ = ตัวตั้งต้น (ตัวแรกในคลัง)
       เลือกไว้แล้วแต่ของถูกลบจากคลัง = ถอยกลับไปตัวตั้งต้น ไม่ให้ราคาหาย */
    const variantOf = (key, rec) => {
      const list = rec.variants || [];
      if (list.length < 2) return rec;
      const want = picks[key];
      return (want && list.find((v) => v.sku === want)) || rec;
    };
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
        const key = matKey(it.priceName || it.name);   // priceName = ชื่อที่ล็อกราคาไว้ (ติ๊ก "ใช้ราคาเดิม" ตอนเปลี่ยนชื่อ)
        const base = service ? {} : (priceMap[key] || {});
        const rec = service ? base : variantOf(key, base);
        let price = service ? (+it.price || 0) : (+rec.price || 0);
        // ของที่ขายเป็นม้วน/กล่องแต่คิดเป็นเมตร — ยังไม่มีราคาต่อเมตรในคลัง ใช้ราคากล่อง ÷ ความยาว
        const box = !service && !price ? boxOfMeter(key) : null;
        if (box) { const bx = priceMap[matKey(box.name)] || {}; if (+bx.price > 0) price = Math.round((+bx.price / box.len) * 100) / 100; }
        const total = price * (it.qty || 0);
        sub += total;
        return Object.assign({}, it, { code: rec.code || "", price: price, total: total, perKw: perKw(total), perW: perW(total),
          brand: rec.brand || "", model: rec.model || "", variantLabel: rec.label || "",
          variants: base.variants || [], pickSku: rec.sku || "" });
      });
      return { group: g.group, service: service, items: items, subtotal: sub, perKw: perKw(sub),
        perW: perW(sub), allowance: g.items.some((it) => +it.allowancePct > 0) };
    });
    /* เงินเผื่อ Accessories — คิดเป็น % ของราคาทุนวัสดุที่ถอดได้ทั้งงาน
       ต้องคิดรอบสองเพราะรอบแรกยังไม่รู้ยอดหมวดอื่น · ฐานไม่รวมหมวดบริการ และไม่รวมตัวเอง (กันคิดซ้อน) */
    if (groups.some((g) => g.allowance)) {
      const base = groups.filter((g) => !g.service && !g.allowance).reduce((s, g) => s + g.subtotal, 0);
      groups.forEach((g) => {
        if (!g.allowance) return;
        g.items = g.items.map((it) => {
          if (!(+it.allowancePct > 0)) return it;
          const total = Math.round(base * it.allowancePct) / 100;
          return Object.assign({}, it, { price: total, total: total, perKw: perKw(total), perW: perW(total), allowBase: base });
        });
        g.subtotal = g.items.reduce((s, it) => s + it.total, 0);
        g.perKw = perKw(g.subtotal); g.perW = perW(g.subtotal);
      });
    }
    const grand = groups.reduce((s, g) => s + g.subtotal, 0);
    const sumOf = (keys) => groups.filter((g) => keys.indexOf(g.group) >= 0).reduce((s, g) => s + g.subtotal, 0);
    const laborTotal = sumOf([G_LABOR]), permitTotal = sumOf([G_PERMIT]), omTotal = sumOf([G_OM]);
    const siteTotal = sumOf([G_TRANSPORT, G_MANAGE]);
    // ค่าแรงผู้รับเหมา = ค่าแรง + ค่าขออนุญาต + ขนส่ง & บริหารจัดการ (ผู้รับเหมาเป็นคนจ่ายก้อนนี้)
    const contractorTotal = laborTotal + permitTotal + siteTotal;
    const matTotal = grand - laborTotal - permitTotal - omTotal;
    return {
      groups: groups, grandTotal: grand, kw: kw, perKw: perKw(grand), perW: perW(grand),
      matTotal: matTotal, matPerKw: perKw(matTotal), matPerW: perW(matTotal),
      laborTotal: laborTotal, laborPerKw: perKw(laborTotal), laborPerW: perW(laborTotal),
      permitTotal: permitTotal, permitPerKw: perKw(permitTotal), permitPerW: perW(permitTotal),
      omTotal: omTotal, omPerW: perW(omTotal),
      siteTotal: siteTotal, contractorTotal: contractorTotal,
    };
  }

  /* ── แบ่งราคา: ต้นทุนวัสดุ + ค่าแรงผู้รับเหมา → กำไร → ราคาขาย → ส่วนลด ──
     cost = ยอดรวมทั้งใบ (grandTotal) · contractor = ค่าแรง + ขออนุญาต + ขนส่ง/บริหาร ซึ่งอยู่ใน cost แล้ว
     (แยกโชว์ ไม่ได้บวกซ้ำ · ค่า pricing.contractor ที่ใบเก่ากรอกเองไม่ถูกอ่านแล้ว)
     กำไรตั้งได้สองแบบ: "pct" = % ของราคาขาย (ค่าเริ่ม 15%) → ราคาขาย = ต้นทุน ÷ (1 − %)
                        "baht" = จำนวนเงิน → ราคาขาย = ต้นทุน + กำไร
     ใบเก่าที่กรอกราคาขายเองไว้ (ไม่มี profitMode แต่มี sell) = "sell" ใช้ราคาขายเดิมจนกว่าจะเลือก % หรือ ฿
     ส่วนลดกรอกเป็น "จำนวนเงินที่ลด" ราคาหลังลดคำนวณให้ ไม่ใช่กรอกราคาสุทธิเอง
     จะได้เห็นทันทีว่าลดไปเท่าไรแล้วกำไรเหลือเท่าไร */
  const VAT_RATE = 7;
  const PROFIT_PCT_DEF = 15;
  function priceBreakdown(cost, p, watt, contractorAmt) {
    p = p || {};
    const vat = +p.vat >= 0 && p.vat !== "" && p.vat != null ? +p.vat : RULES.vat;
    const r2 = (v) => Math.round(v * 100) / 100;
    const addVat = (v) => r2(v * (1 + vat / 100));
    const totalCost = Math.max(0, +cost || 0);
    const contractor = Math.min(totalCost, Math.max(0, +contractorAmt || 0));
    const base = totalCost - contractor;
    const mode = p.profitMode === "pct" || p.profitMode === "baht" ? p.profitMode : +p.sell > 0 ? "sell" : "pct";
    const profitPct = p.profitPct === "" || p.profitPct == null || !isFinite(+p.profitPct) ? RULES.profitPct : Math.min(90, Math.max(0, +p.profitPct));
    const profitBaht = Math.max(0, +p.profitBaht || 0);
    const sell = totalCost <= 0 && mode !== "sell" ? 0
      : mode === "sell" ? Math.max(0, +p.sell || 0)
      : mode === "baht" ? r2(totalCost + profitBaht)
      : Math.ceil(totalCost / (1 - profitPct / 100));   // ปัดขึ้นเป็นบาทเต็ม
    const discount = Math.max(0, +p.discount || 0);
    const net = Math.max(0, sell - discount);
    const w = Math.max(0, +watt || 0);
    const perW = (v) => (w > 0 ? Math.round((v / w) * 1000) / 1000 : 0);
    const pct = (profit, price) => (price > 0 ? Math.round((profit / price) * 10000) / 100 : 0);
    return {
      vat: vat, cost: base, contractor: contractor, mode: mode, profitPct: profitPct, profitBaht: profitBaht,
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
        group: String(p.group || "").trim(),   // หมวดย่อยในคลัง (AIKO / JINKO / LONGI) — ใช้จัดกลุ่มในดรอปดาวน์
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
      if (p.bifacial === true || p.bifacial === false) row.bifacial = p.bifacial;   // ไม่ระบุ = stringConfig เดาจากชื่อรุ่น
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
      /* group = ยี่ห้อจากคลัง — แผงพกมาด้วยอยู่แล้ว อินเวอร์เตอร์เคยตกไป
         ทำให้ช่อง "ยี่ห้ออินเวอร์เตอร์" ในสมุดส่งมอบเติมให้ไม่ได้ ทั้งที่คลังรู้อยู่ */
      out.push({ model: String(p.model).trim(), group: p.group || "", type: type, kw: kwUnit(p.kw), phase: +p.phase || 0, inputs: +p.inputs || 0, maxPv: kwUnit(p.maxPv), outA: +p.outA || 0, mpptVmin: +p.mpptVmin || 0, mpptVmax: +p.mpptVmax || 0, maxVdc: +p.maxVdc || 0, maxInA: +p.maxInA || 0, maxIscA: +p.maxIscA || 0,
        maxMpptA: +p.maxMpptA || 0, vStart: +p.vStart || 0, vRated: +p.vRated || 0, maxAcKw: +p.maxAcKw || 0 });
      // ค่าที่ยังไม่กรอกต้องไม่ทับค่ากลางในเครื่องคำนวณ จึงใส่เฉพาะตอนมีค่าจริง
      const row = out[out.length - 1];
      if ((+p.maxPv || 0) >= 1000 || (+p.kw || 0) >= 1000) row.unitFixed = true;   // เตือนให้ไปแก้ที่คลัง
      if (+p.strPerMppt > 0) row.strPerMppt = Math.round(+p.strPerMppt);
      if (+p.eff > 0) row.eff = +p.eff;
      if (+p.effEuro > 0) row.effEuro = +p.effEuro;
      /* ขนาดตัวเครื่อง (มม.) + ตั้งพื้น — ห้องอุปกรณ์ 3D (eroom.jsx) */
      if (+p.dimW > 0 && +p.dimH > 0) row.dim = { w: +p.dimW, h: +p.dimH, d: +p.dimD || 250 };
      if (p.mount === "floor") row.mount = "floor";
      if (p.batV === "lv" || p.batV === "hv") row.batV = p.batV;   // แรงดันแบตที่ไฮบริดรับได้ — หน้าออกแบบระบบคัดแบต
    });
    INVERTERS.length = 0;
    out.forEach((x) => INVERTERS.push(x));
  }

  /* ── ตัวคุมแผงจากคลัง → OPTIMIZERS ──
     ค่าที่ยังไม่กรอกปล่อยเป็น 0 แล้วให้หน้าจอขึ้นว่า "ยังไม่ระบุ"
     ห้ามเดาค่ากลางแทน เพราะตัวเลขพวกนี้ตัดสินว่าต่อกี่ตัวต่อสตริงถึงจะไม่เกินพิกัด */
  function setOptimizers(list) {
    const out = [];
    (list || []).forEach((p) => {
      if (!p || !p.model) return;
      out.push({
        model: String(p.model).trim(), group: p.group || "",
        w: +p.w || 0, vInMax: +p.vInMax || 0, mpptMin: +p.mpptMin || 0, mpptMax: +p.mpptMax || 0,
        iscMax: +p.iscMax || 0, vOutMax: +p.vOutMax || 0, iOutMax: +p.iOutMax || 0,
        eff: +p.eff || 0, vOff: +p.vOff || 0, /* 0 = ไม่ได้กำหนดเพดานไว้ ให้กติกากำลังวัตต์เป็นตัวตัดสินอย่างเดียว */
        perPanel: Math.max(0, Math.round(+p.perPanel || 0)),
        /* ช่วงจำนวนตัวคุมต่อสตริงตามคู่มือของรุ่นนั้น — 0 = ยังไม่ระบุ ระบบจะไม่เอาไปตัดสิน */
        minPerStr: Math.max(0, Math.round(+p.minPerStr || 0)),
        maxPerStr: Math.max(0, Math.round(+p.maxPerStr || 0)),
        /* ตารางจับคู่กับอินเวอร์เตอร์ — คู่มือกำหนดความยาวสตริงไว้ต่อรุ่น ไม่ใช่ค่าเดียวทั้งยี่ห้อ */
        pairs: (Array.isArray(p.pairs) ? p.pairs : []).filter((r) => r && r.inv)
          .map((r) => ({ inv: String(r.inv), min: Math.max(0, Math.round(+r.min || 0)),
            max: Math.max(0, Math.round(+r.max || 0)), maxW: Math.max(0, Math.round(+r.maxW || 0)) })),
      });
    });
    OPTIMIZERS.length = 0;
    out.forEach((x) => OPTIMIZERS.push(x));
  }
  const findOptimizer = (model) => OPTIMIZERS.find((o) => o.model === model) || null;
  /* ตัวคุมแผงกี่ตัว — บางรุ่นคุมแผงละตัว (1:1) บางรุ่นคุมทีละ 2 แผง (2:1)
     perPanel = จำนวนแผงต่อตัวคุม 1 ตัว · ยังไม่กรอกในคลัง (0) ให้ถือเป็น 1:1 ไว้ก่อน
     ปัดขึ้น เพราะแผงที่เหลือเศษก็ยังต้องมีตัวคุมของตัวเอง */
  /* ── ตัวคุมแผงรุ่นนี้ใช้กับอินเวอร์เตอร์รุ่นนี้ได้ไหม ──
     คลังเก็บตารางจับคู่ไว้ที่ตัวคุม (pairs) — คู่มือระบุไว้เป็นรายอินเวอร์เตอร์
     ไม่ใช่ค่าเดียวทั้งยี่ห้อ เพราะความยาวสตริงที่อนุญาตต่างกันไปตามรุ่น

     ตารางว่าง = ยังไม่ได้กรอกในคลัง ไม่ใช่ "ใช้ไม่ได้" — คืน unknown ไว้
     ให้หน้าจอบอกว่ายังไม่มีข้อมูล ดีกว่าล็อกจนเลือกรุ่นนั้นไม่ได้เลย */
  function optimizerFits(model, invModel) {
    const o = findOptimizer(model);
    if (!o) return { ok: false, unknown: true, pair: null };
    const list = o.pairs || [];
    if (!list.length) return { ok: true, unknown: true, pair: null };
    const pair = list.find((r) => r.inv === invModel) || null;
    return { ok: !!pair, unknown: false, pair: pair };
  }

  function optimizerQty(model, panels) {
    const n = Math.max(0, Math.round(+panels || 0));
    if (!n) return 0;
    const o = findOptimizer(model);
    const per = Math.max(1, (o && o.perPanel) || 1);
    return Math.ceil(n / per);
  }

  window.BOQ = { PANELS, MICRO, INVERTERS, OPTIMIZERS, setOptimizers, findOptimizer, ROOF_HOOKS, ROOF_OPTIONS, CABLE_TYPES, CABLE_GROUPS, cableCategory, MATERIAL_SUBGROUPS, materialSubGroup, CABLE_POINTS, DEFAULT_CABLES, STRING_CABLE_POINTS, MICRO_CABLE_NAMES, DEFAULT_STRING_CABLES, IMC_SIZES, UPVC_SIZES, PULLBOX_SIZES, CABLE_OD, HDPE_TABLE, IMC_CONDUIT, WIRE_SIZES, WIRE_METHODS, INS_CLASSES, AMP_GROUPS, AMP_NCOND, AMP_CORES, ampColKey, DEFAULT_AMPACITY, AMPACITY, setAmpacity, WIRE_METHOD_BASE, ampTableFor, cableInsClass, cableCoreType, cableSizeNum, ampacityOf, pickWireSize, PV_WIRE_SIZES, PV_WIRE_AMP, PV_WIRE_MIN, pickPvWireSize, calcVdrop, VD_LIMIT, findPanel, findInverter, stringConfig, stringPlan, wireArea, calcWireWay, calcConduitSize, blankBOQ, mergeBOQ, setConduitDefaults, conduitDefaults, CONDUIT_SPARE_FIXED, IMC_RULE, IMC_RULE_DEF, imcRule, calcBOQ, calcStructures, matKey, qtyKey, catalog, isPvDcCable, PV_DC_COLORS, PV_DC_SPARE, pvDcLength, applyPrices, setPanels, setInverters,
    WAY_SIZES, TRAY_SIZES, PERF_SIZES, syncTraySizes, traySizesVer, TRAY_KINDS, TRAY_KIND_KEYS, trayKindOf, trayNorm, trayAlias, hdgName,
    optimizerQty, optimizerFits, DCAC_LIMIT, WAY_PIPE_LEN, TRAY_PIPE_LEN, trayLenTxt, railLenCm, railPerTon, railName, SUPPORT_KINDS, LABOR_PRESET, PERMIT_PRESET, permitPresetFor, permitGridFee, gridAuthOf, PERMIT_ENG_TIERS, PERMIT_GRID_FEE, PERMIT_GRID_NAME,
    COND_FIT_KINDS, WAY_FIT_KINDS, condFittings, trayFittings, PPR_SIZES, PPR_FIT_KINDS, pipeFittings, pipeFromPlan, trayFromPlan, walkFromPlan, walkLens, walkLenOf, walkName, railLens, mccbFrame, mccbName, mccbName0,
    STEEL_SPECS, steelName, steelBarLen, steelSel, steelOf,
    TRANSPORT_PRESET, MANAGE_PRESET, G_TRANSPORT, G_MANAGE, PROJECT_KITS, normProject, kitExtraKeys, ACC_ALLOW_PCT, ACC_ALLOW_PCT_HOME, accAllowDef, accAllowPct, VAT_RATE, PROFIT_PCT_DEF, priceBreakdown,
    TRAY_FILL_LIMIT, TRAY_DERATE, trayDerate, trayDim, trayCheck, cableCores,
    UPVC_CONDUIT, conduitFillLimit, conduitDim, conduitCheck,
    AMP_CORE_LABEL, ampGroupMeta, ampCoresFor, ampCoreKey, WIRE_METHOD_LEGACY, normWireMethod,
    G_TRAY, G_SUPPORT, G_LABOR, G_PERMIT, G_OM, OM_DEF, OM_CLEAN_TIERS, OM_SVC_TIERS, OM_CLEAN_DEF, OM_SVC_DEF, omTierNorm, setOmTiers, omTierPrice, omDefaults, omCalc, SERVICE_GROUPS, mergeItems,
    RULE_SECS, RULE_DEFS, RULES, RULES_T, setRules, ruleVal, ruleTxt, ruleOnly, ruleFlat, ruleRaw, pairPick, spdName, isHwInv };
  /* ห่อฟังก์ชันที่ส่งออก: เจออาร์กิวเมนต์ที่เป็นใบ BOQ (jobType) หรืองาน (type) = สลับ RULES เป็นชุดของประเภทนั้นก่อนคิด
     ฟังก์ชันข้างในเรียกกันตรง ๆ (ไม่ผ่านตัวห่อ) จึงใช้ชุดเดียวกันตลอดการคิดหนึ่งครั้ง */
  const typeHint = (a) => {
    if (!a || typeof a !== "object" || Array.isArray(a)) return null;
    if (a.jobType) return a.jobType === "home" ? "home" : "proj";
    if (a.type === "home" || a.type === "project") return a.type === "home" ? "home" : "proj";
    return null;
  };
  Object.keys(window.BOQ).forEach((k) => {
    const fn = window.BOQ[k];
    if (typeof fn !== "function" || /^(set|rule)/.test(k)) return;
    window.BOQ[k] = function () {
      for (let i = 0; i < arguments.length; i++) { const t = typeHint(arguments[i]); if (t) { if (t !== ruleType) useRuleType(t); break; } }
      return fn.apply(this, arguments);
    };
  });
  window.BOQ.useRuleType = useRuleType;
  window.BOQ.ruleTypeNow = () => ruleType;
  setRules(null);
})();
