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
    { key: "wiring",    th: "สายไฟ / ไฟฟ้า",   color: "#EF4444", icon: "flow" },
    { key: "conduit",   th: "ท่อร้อยสาย",       color: "#0EA5E9", icon: "menu" },
    { key: "grounding", th: "กราวด์ / กันดูด",  color: "#A16207", icon: "shield" },
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
  SF.MAT_PREFIX = { panel: "PNL", inverter: "INV", invacc: "INVA", battery: "BAT", structure: "MT", wiring: "WIR", conduit: "CDT", grounding: "GND", accessory: "ACS", other: "GEN" };
  // กลุ่มราคา BOQ → หมวดคลังสินค้า (เวลา auto-สร้างวัสดุจากหน้าราคา)
  SF.BOQ_GROUP_TO_CAT = { "PV MODULE": "panel", INVERTER: "inverter", MOUNTING: "structure", CABLE: "wiring", "RACE WAY": "conduit", GROUNDING: "grounding", ACCESSORIES: "accessory" };
  // สร้างรหัสถัดไปของหมวด เช่น INV-0007 (กันซ้ำกับ used เพิ่มเติมได้)
  SF.genMatCode = function (cat, items, used) {
    const pre = SF.MAT_PREFIX[cat] || "GEN";
    const re = new RegExp("^" + pre + "-(\\d+)$", "i");
    let max = 0;
    (items || []).forEach((it) => { const m = re.exec(String(it.sku || "")); if (m) { const n = +m[1]; if (n > max) max = n; } });
    if (used) used.forEach((c) => { const m = re.exec(String(c || "")); if (m) { const n = +m[1]; if (n > max) max = n; } });
    return pre + "-" + String(max + 1).padStart(4, "0");
  };
})();
