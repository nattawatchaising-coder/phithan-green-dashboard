/* ============================================================
   SolarFlow — Inventory / Stock seed data  (extends window.SF)
   ============================================================ */
(function () {
  const SF = window.SF;

  const STOCK_CATS = [
    { key: "panel",     th: "แผงโซล่าเซลล์",  color: "#3B82F6", icon: "panel" },
    { key: "inverter",  th: "อินเวอร์เตอร์",   color: "#7C5CFC", icon: "bolt" },
    { key: "invacc",    th: "อุปกรณ์อินเวอร์เตอร์", color: "#9333EA", icon: "settings" },
    { key: "battery",   th: "แบตเตอรี่",       color: "#14B8A6", icon: "battery" },
    { key: "structure", th: "Solar Mounting",    color: "#F59E0B", icon: "box" },
    { key: "steelwork", th: "งานโครงสร้าง",       color: "#475569", icon: "box" },
    { key: "wiring",    th: "สายไฟ / ไฟฟ้า",   color: "#EF4444", icon: "flow" },
    { key: "conduit",   th: "ท่อร้อยสาย",       color: "#0EA5E9", icon: "menu" },
    { key: "grounding", th: "กราวด์ / กันดูด",  color: "#A16207", icon: "shield" },
    { key: "electrical",th: "อุปกรณ์ไฟฟ้า",     color: "#4F46E5", icon: "bolt" },
    { key: "accessory", th: "Accessories",      color: "#EC4899", icon: "box" },
    { key: "other",     th: "อื่นๆ",            color: "#84CC16", icon: "box" },
  ];

  const INVENTORY = [
    { id: "IV-01", sku: "PNL-LR550", name: "แผงโซล่า Longi 550W", cat: "panel", unit: "แผง", qty: 318, min: 100, loc: "คลัง A-01" },
    { id: "IV-02", sku: "PNL-JA450", name: "แผงโซล่า JA Solar 450W", cat: "panel", unit: "แผง", qty: 72, min: 100, loc: "คลัง A-02" },
    { id: "IV-03", sku: "INV-ATM5",  name: "อินเวอร์เตอร์ ATMOCE 5kW Hybrid", cat: "inverter", unit: "ตัว", qty: 12, min: 5, loc: "คลัง B-01" },
    { id: "IV-04", sku: "INV-ATM10", name: "อินเวอร์เตอร์ ATMOCE 10kW Hybrid", cat: "inverter", unit: "ตัว", qty: 6, min: 4, loc: "คลัง B-01" },
    { id: "IV-05", sku: "INV-HW5",   name: "อินเวอร์เตอร์ Huawei SUN2000 5KTL", cat: "inverter", unit: "ตัว", qty: 3, min: 5, loc: "คลัง B-02" },
    { id: "IV-06", sku: "INV-HW10",  name: "อินเวอร์เตอร์ Huawei SUN2000 10KTL", cat: "inverter", unit: "ตัว", qty: 8, min: 4, loc: "คลัง B-02" },
    { id: "IV-07", sku: "BAT-ATM07", name: "แบตเตอรี่ ATMOCE 7 kWh", cat: "battery", unit: "ลูก", qty: 10, min: 4, loc: "คลัง C-01" },
    { id: "IV-08", sku: "BAT-ATM14", name: "แบตเตอรี่ ATMOCE 14 kWh", cat: "battery", unit: "ลูก", qty: 5, min: 3, loc: "คลัง C-01" },
    { id: "IV-09", sku: "BAT-ATM35", name: "แบตเตอรี่ ATMOCE 35 kWh", cat: "battery", unit: "ลูก", qty: 2, min: 3, loc: "คลัง C-02" },
    { id: "IV-10", sku: "STR-RAIL42", name: "รางอลูมิเนียม 4.2 ม.", cat: "structure", unit: "เส้น", qty: 540, min: 200, loc: "คลัง D-01" },
    { id: "IV-11", sku: "STR-CLAMP", name: "คลิปล็อกแผง (Mid/End Clamp)", cat: "structure", unit: "ชุด", qty: 1180, min: 400, loc: "คลัง D-02" },
    { id: "IV-12", sku: "WIR-DC6",   name: "สายไฟ DC Solar 6 sq.", cat: "wiring", unit: "เมตร", qty: 2460, min: 1000, loc: "คลัง E-01" },
    { id: "IV-13", sku: "WIR-AC16",  name: "สายไฟ AC 16 sq.", cat: "wiring", unit: "เมตร", qty: 880, min: 500, loc: "คลัง E-01" },
    { id: "IV-14", sku: "WIR-DCB",   name: "เบรกเกอร์ DC 1000V", cat: "wiring", unit: "ตัว", qty: 18, min: 20, loc: "คลัง E-02" },
    { id: "IV-15", sku: "BRD-NET30", name: "ตาข่ายกันนก (ม้วน 30 ม.)", cat: "other", unit: "ม้วน", qty: 16, min: 10, loc: "คลัง F-01" },
    // ── งานโครงสร้าง (LADDER / WALKWAY / GUARD RAIL) — ถอดจากสูตร BOQ ──
    { id: "IV-16", sku: "STW-0001", name: 'เหล็กกล่องดำ 2"x2"', cat: "steelwork", unit: "เส้น", qty: 0, min: 0, loc: "" },
    { id: "IV-17", sku: "STW-0002", name: 'เหล็กกลมดำ 1"', cat: "steelwork", unit: "เส้น", qty: 0, min: 0, loc: "" },
    { id: "IV-18", sku: "STW-0003", name: "เหล็กแบน 32 มม.", cat: "steelwork", unit: "เส้น", qty: 0, min: 0, loc: "" },
    { id: "IV-19", sku: "STW-0004", name: 'แผ่นเพลท 4"x4"', cat: "steelwork", unit: "แผ่น", qty: 0, min: 0, loc: "" },
    { id: "IV-20", sku: "STW-0005", name: 'พุ๊กเหล็ก 3/8"', cat: "steelwork", unit: "ตัว", qty: 0, min: 0, loc: "" },
    { id: "IV-21", sku: "STW-0006", name: "WALKWAY", cat: "steelwork", unit: "แผ่น", qty: 0, min: 0, loc: "" },
    { id: "IV-22", sku: "STW-0007", name: "WALKWAY JOINER", cat: "steelwork", unit: "ตัว", qty: 0, min: 0, loc: "" },
    { id: "IV-23", sku: "STW-0008", name: "เหล็กฉาก 40x40 มม. หนา 4 มม.", cat: "steelwork", unit: "เส้น", qty: 0, min: 0, loc: "" },
    { id: "IV-24", sku: "STW-0009", name: "สลิงสแตนเลส 6 มม.", cat: "steelwork", unit: "ม.", qty: 0, min: 0, loc: "" },
    { id: "IV-25", sku: "STW-0010", name: "เกลียวเร่งสแตนเลส 8 มม.", cat: "steelwork", unit: "ตัว", qty: 0, min: 0, loc: "" },
    { id: "IV-26", sku: "STW-0011", name: "กิ๊บสลิงสแตนเลส 6 มม.", cat: "steelwork", unit: "ตัว", qty: 0, min: 0, loc: "" },
    { id: "IV-27", sku: "STW-0012", name: "ปลอกอลูมิเนียม 6 มม.", cat: "steelwork", unit: "ตัว", qty: 0, min: 0, loc: "" },
  ];

  const MOVES = [
    { id: "MV-1008", itemId: "IV-01", type: "out", qty: 18, date: "2026-06-06", ref: "SF-2401", note: "เบิกหน้างาน คุณวิชัย" },
    { id: "MV-1007", itemId: "IV-03", type: "out", qty: 1, date: "2026-06-06", ref: "SF-2414", note: "เบิกหน้างาน คุณชัยวัฒน์" },
    { id: "MV-1006", itemId: "IV-01", type: "in", qty: 120, date: "2026-06-05", ref: "PO-2406", note: "รับเข้าจาก Longi (PO มิ.ย.)" },
    { id: "MV-1005", itemId: "IV-08", type: "out", qty: 1, date: "2026-06-04", ref: "SF-2405", note: "เบิกแบต 14kWh" },
    { id: "MV-1004", itemId: "IV-05", type: "out", qty: 2, date: "2026-06-03", ref: "SF-2402", note: "เบิกอินเวอร์เตอร์ Huawei" },
    { id: "MV-1003", itemId: "IV-15", type: "in", qty: 20, date: "2026-06-02", ref: "PO-2405", note: "รับเข้าตาข่ายกันนก" },
    { id: "MV-1002", itemId: "IV-10", type: "out", qty: 40, date: "2026-06-02", ref: "SF-2416", note: "เบิกรางโครงสร้าง" },
    { id: "MV-1001", itemId: "IV-02", type: "out", qty: 60, date: "2026-06-01", ref: "SF-2407", note: "เบิกแผง 450W งานโกดัง" },
  ];

  SF.STOCK_CATS = STOCK_CATS;
  SF.STOCK_CAT_BY = Object.fromEntries(STOCK_CATS.map((c) => [c.key, c]));
  SF.INVENTORY_SEED = INVENTORY;
  SF.MOVES_SEED = MOVES;

  // ── รหัสวัสดุ (mat code) — auto-gen ตามหมวด, แก้ทับได้ ──
  SF.MAT_PREFIX = { panel: "PNL", inverter: "INV", invacc: "INVA", battery: "BAT", structure: "MT", steelwork: "STW", wiring: "WIR", conduit: "CDT", grounding: "GND", electrical: "ELC", accessory: "ACS", other: "GEN" };
  // กลุ่มราคา BOQ → หมวดคลังสินค้า (เวลา auto-สร้างวัสดุจากหน้าราคา)
  SF.BOQ_GROUP_TO_CAT = { "PV MODULE": "panel", INVERTER: "inverter", MOUNTING: "structure", CABLE: "wiring", "RACE WAY": "conduit", GROUNDING: "grounding", ACCESSORIES: "accessory", "LADDER (บันไดลิง)": "steelwork", WALKWAY: "steelwork", "GUARD RAIL": "steelwork",
    // รางไฟอยู่หมวดเดียวกับท่อร้อยสาย · โครงเหล็กรองรับอุปกรณ์อยู่หมวดงานเหล็กเหมือนบันได/ทางเดิน
    "รางไฟ (WIREWAY / TRAY)": "conduit", "โครงสร้างรองรับอุปกรณ์": "steelwork",
    "COMBINER BOX": "electrical" };   // เดิมไม่ได้แมป ทำให้ของในตู้ไปตกหมวด "อื่นๆ" ตอนสร้างวัสดุอัตโนมัติ
  // สร้างรหัสถัดไปของหมวด เช่น INV-0007 (กันซ้ำกับ used เพิ่มเติมได้)
  SF.genMatCode = function (cat, items, used) {
    const pre = SF.MAT_PREFIX[cat] || "GEN";
    const re = new RegExp("^" + pre + "-(\\d+)$", "i");
    let max = 0;
    (items || []).forEach((it) => { const m = re.exec(String(it.sku || "")); if (m) { const n = +m[1]; if (n > max) max = n; } });
    if (used) used.forEach((c) => { const m = re.exec(String(c || "")); if (m) { const n = +m[1]; if (n > max) max = n; } });
    return pre + "-" + String(max + 1).padStart(4, "0");
  };
  /* ป้ายบอกว่าเป็นของตัวไหน — ของชิ้นเดียวกันมีหลายยี่ห้อ/หลายรุ่น ราคาไม่เท่ากัน
     คืนค่าว่างถ้าไม่ได้กรอกทั้งคู่ (ของเก่าที่ยังไม่ได้ระบุ) */
  SF.matVariantLabel = function (it) {
    const b = String((it && it.brand) || "").trim();
    const m = String((it && it.model) || "").trim();
    return b && m ? b + " · " + m : (b || m);
  };

  /* ── เดายี่ห้อ/รุ่นจากชื่อวัสดุ ──
     ชื่อของเดิมในคลังมักมียี่ห้อกับรุ่นเขียนติดอยู่แล้ว เช่น
       "ข้องอ 90 องศา 3/4 นิ้ว THAI PP-R รุ่น D25 ขนาด ... สีเขียว" → THAI PP-R · D25
       "Huawei SUN2000-50K-MC0"                                   → Huawei · SUN2000-50K-MC0
     ของโหลที่ไม่มียี่ห้อจริง ๆ (ท่อ uPVC, IMC, สายไฟ, รางไฟ, เหล็ก) คืน null ปล่อยว่างไว้ถูกแล้ว */
  // ยี่ห้อที่เขียนอยู่ในชื่อตรง ๆ — เรียงยาวไปสั้น กันชื่อสั้นไปกินชื่อยาว
  SF.MAT_BRANDS = ["THAI PP-R", "THAIPP-R", "THAIPPR", "BLOX CONNECT", "SCHNEIDER", "SUPREMPRO",
    "ATMOCE", "HUAWEI", "SANWA", "LONGi", "JINKO", "BASOR", "AIKO", "TBR"];
  // เขียนยี่ห้อให้เป็นแบบเดียวกันทั้งคลัง (ในชื่อสะกดปนกันหลายแบบ)
  SF.MAT_BRAND_CANON = { HUAWEI: "Huawei", THAIPPR: "THAI PP-R", "THAIPP-R": "THAI PP-R" };
  /* ชื่อที่ไม่ได้เขียนยี่ห้อไว้ แต่รู้ว่าเป็นของใครจากตระกูลรหัสรุ่น
     วงเล็บที่ 1 (ถ้ามี) = ชื่อรุ่นที่จะหยิบมาใช้ */
  SF.MAT_BRAND_HINTS = [
    { re: /(SUN2000-[A-Za-z0-9\-]+)/, brand: "Huawei" },
    { re: /(LUNA2000-[A-Za-z0-9\-]+)/, brand: "Huawei" },
    { re: /(SmartGuard-[A-Za-z0-9\-]+)/, brand: "Huawei" },
    { re: /(Smart Dongle-[A-Za-z0-9\-]+)/, brand: "Huawei" },
    { re: /(D[DT]SU\d+-[A-Za-z0-9]+)/, brand: "Huawei" },
    { re: /(Backup Box-[A-Za-z0-9]+)/, brand: "Huawei" },
    { re: /\((M[A-Z]?-?\d[A-Za-z0-9\-]*)\)/, brand: "ATMOCE" },     // (MC-100) (MU100-S) (MS-7K-U)
    { re: /\((MW-[0-9A-Za-z\-]+)\)/, brand: "ATMOCE" },             // สาย AC ของไมโครอินเวอร์เตอร์
    { re: /(M-Combiner|M-Backup|M-Battery|M-ELV|Micro-inverter|phase junction adapter|phase AC cable sealing)/i, brand: "ATMOCE" },
  ];
  SF.guessVariant = function (name) {
    const raw = String(name || "").replace(/\s+/g, " ").trim();
    if (!raw) return null;
    let brand = "", model = "", at = -1;
    // 1) ยี่ห้อที่เขียนอยู่ในชื่อ — จำตำแหน่งที่เจอจริง (indexOf เดา ๆ ตัดคำผิดได้)
    for (let i = 0; i < SF.MAT_BRANDS.length; i++) {
      const b = SF.MAT_BRANDS[i];
      const re = new RegExp("(^|[\\s\\-(])(" + b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")([\\s\\-)]|$)", "i");
      const m = re.exec(raw);
      if (m) { brand = b; at = m.index + m[1].length; break; }
    }
    /* 2) รุ่นแบบ "รุ่น X" มาก่อนเสมอ — ตัดที่ ขนาด/สี/ยาว/เกลียว เพราะนั่นเป็นสเปค ไม่ใช่ชื่อรุ่น */
    const mRun = /รุ่น\s*([^\s].*?)(?=\s*(?:ขนาด|สี|ยาว|เกลียว|$))/.exec(raw);
    if (mRun) model = mRun[1].trim();
    // 3) ไม่มียี่ห้อในชื่อ → ดูจากตระกูลรหัสรุ่น (วงเล็บที่ 1 คือชื่อรุ่น)
    if (!brand) {
      for (let i = 0; i < SF.MAT_BRAND_HINTS.length; i++) {
        const h = SF.MAT_BRAND_HINTS[i], m = h.re.exec(raw);
        if (!m) continue;
        brand = h.brand;
        // เอาเฉพาะที่หน้าตาเป็นรหัสรุ่นจริง (มีตัวเลข หรือมีตัวพิมพ์ใหญ่ติดกัน) ไม่ใช่คำบรรยาย
        if (!model && m[1] && (/\d/.test(m[1]) || /-[A-Z]{3,}/.test(m[1]))) model = m[1].trim();
        break;
      }
    }
    if (!model && brand && at === 0) {
      // 4) ยี่ห้ออยู่หน้าชื่อ → ที่เหลือคือรุ่น (ตัดวงเล็บอธิบายท้ายออก)
      model = raw.slice(brand.length).replace(/^[\s\-–]+/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
    } else if (!model && brand && at > 0) {
      /* 5) ยี่ห้ออยู่กลางชื่อ → เอาคำที่ตามหลังยี่ห้อเป็นรุ่น
            ตัดที่จุลภาค แล้วตัดหางที่เป็นสเปค (3P / 20A / (10kA)) ออก เหลือแต่ชื่อรุ่นจริง */
      const after = raw.slice(at + brand.length).replace(/^[\s\-–]+/, "").split(",")[0];
      const toks = after.split(" ").filter(Boolean);
      const keep = [];
      for (let i = 0; i < toks.length && i < 3; i++) {
        if (/^\d+P$|^\d+A[TF]?$|^\(.*\)$|^ขนาด$|^สี/.test(toks[i])) break;
        keep.push(toks[i]);
      }
      const cand = keep.join(" ").trim();
      // กันไปหยิบ "ขนาด" มาเป็นชื่อรุ่น (3/4 นิ้ว · 50 มม. · 2,000 ลิตร ไม่ใช่รุ่น)
      if (/\d/.test(cand) && !/นิ้ว|มม\.|ซม\.|ลิตร|เมตร/.test(cand)) model = cand;
    }
    // 6) ไม่มียี่ห้อ แต่มี "รุ่น X" → คำหน้า "รุ่น" มักเป็นยี่ห้อ
    if (!brand && model) {
      const mB = /([A-Za-z][A-Za-z0-9&.\- ]{1,20}?)\s*รุ่น/.exec(raw);
      if (mB) brand = mB[1].trim();
    }
    brand = SF.MAT_BRAND_CANON[brand.toUpperCase()] || SF.MAT_BRAND_CANON[brand] || brand;
    model = model.replace(/[\s,]+$/, "");
    return brand || model ? { brand: brand, model: model } : null;
  };
})();
