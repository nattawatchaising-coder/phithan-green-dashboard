/* ============================================================
   flash+solar — ชิ้นแสดงผลข้อมูล FusionSolar (docs/fusionsolar.md)
   โหลดก่อน fusionsolar.jsx · ไม่มีการเขียนฐานข้อมูลในไฟล์นี้ — แปลค่าดิบของ Huawei ให้อ่านรู้เรื่อง

   - ความหมายของ key ใน dataItemMap (getDevRealKpi) + ค่าสถานะเป็นข้อความไทย
   - ตรวจหาเรื่องที่ควรดู (ออฟไลน์ · ข้อมูลค้าง · อินเวอร์เตอร์หยุด · สตริงกระแสต่ำ · ร้อนเกิน · แบตผิดพลาด)
   - การไหลของพลังงาน (โซลาร์ → บ้าน / กริด / แบต) และสัดส่วนใช้เอง-ขาย-ซื้อ จากมิเตอร์สะสม
   - กราฟแท่งรายชั่วโมง/วัน/เดือน จากประวัติที่ซิงก์เก็บเอง (fsKpiDay · fsKpiMonth)
   ============================================================ */

/* ยี่ห้อ/รหัสของไซต์ — Huawei ผูกด้วย fusionsolar_station_code · Sungrow (docs/isolarcloud.md) ด้วย isc_ps_id */
const fsVendor = (s) => (s && s.isc_ps_id != null ? "sungrow" : s && s.source === "manual" ? "manual" : "huawei");
const fsCodeOf = (s) => (!s ? "" : s.fusionsolar_station_code || (s.isc_ps_id != null ? "PS " + s.isc_ps_id : ""));
const fsVendorTH = (s) => ({ sungrow: "Sungrow iSolarCloud", huawei: "Huawei FusionSolar", manual: "เพิ่มเองในเว็บ" })[fsVendor(s)];

/* สีกราฟสัดส่วนพลังงาน 3 ชุด (ใช้เอง · ขายเข้ากริด · ซื้อจากกริด) — ผ่านตัวตรวจสีของ dataviz ทั้งสว่าง/มืด
   (ช่วงความสว่าง · ความต่างสำหรับคนตาบอดสี · คอนทราสต์กับพื้น) · กราฟชุดเดียวใช้ --primary */
(function fsInjectCss() {
  if (document.getElementById("fs-viz-css")) return;
  const el = document.createElement("style");
  el.id = "fs-viz-css";
  el.textContent = ":root{--fs-self:#1B9B75;--fs-exp:#2F6FDB;--fs-imp:#C2410C}"
    + "[data-theme=\"aurora\"]{--fs-self:#21A77D;--fs-exp:#4A84E8;--fs-imp:#DB6E2E}"
    + ":root{--fs-zebra:color-mix(in srgb,var(--surface2) 55%,transparent)}.fs-row:hover td{background:var(--surface2)!important}.fs-att:hover{background:var(--surface2)}";
  document.head.appendChild(el);
})();

/* ── ตัวช่วยตัวเลข/เวลา ── */
const fsN = (v) => (v == null || v === "" || isNaN(+v) ? null : +v);
const fsFmt = (v, d) => (fsN(v) == null ? "–" : (+v).toLocaleString("th-TH", { maximumFractionDigits: d == null ? 1 : d }));
/* พลังงานก้อนใหญ่เปลี่ยนเป็น MWh — 402,311 kWh อ่านยากกว่า 402.3 MWh */
const fsEnergy = (kwh) => (fsN(kwh) == null ? ["–", "kWh"] : Math.abs(kwh) >= 10000 ? [fsFmt(kwh / 1000, 1), "MWh"] : [fsFmt(kwh, 1), "kWh"]);
/* วัน/เดือน/ชั่วโมงตามเวลาไทย — ต้องตรงกับ bkk() ฝั่งซิงก์ (ประวัติเก็บด้วย key แบบนี้) */
const fsBkk = (ms) => { const x = new Date(ms + 7 * 3600e3).toISOString(); return { day: x.slice(0, 10), mon: x.slice(0, 7), hh: x.slice(11, 13), h: +x.slice(11, 13) }; };
const FS_MON_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const fsDayTH = (key) => { const [y, m, d] = key.split("-"); return +d + " " + FS_MON_TH[+m - 1] + " " + String(+y + 543).slice(2); };
const fsMonTH = (key) => { const [y, m] = key.split("-"); return FS_MON_TH[+m - 1] + " " + String(+y + 543).slice(2); };
const fsMedian = (a) => { const s = a.filter((v) => v != null).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/* ค่าการปล่อย CO₂ ของไฟฟ้าในระบบของไทย (อบก. — Grid Emission Factor) */
const FS_GRID_EF = 0.4999;

/* ── ความหมายของ key (เอกสาร Northbound: getDevRealKpi) ── */
const FS_KPI_LABELS = {
  inverter_state: ["สถานะอินเวอร์เตอร์"], run_state: ["การเชื่อมต่อ"], meter_status: ["สถานะมิเตอร์"],
  total_cap: ["ผลิตสะสม", "kWh"], day_cap: ["ผลิตวันนี้", "kWh"], mppt_total_cap: ["ผลิตสะสมด้าน DC", "kWh"],
  active_power: ["กำลังไฟฟ้า", "kW"], reactive_power: ["กำลังรีแอกทีฟ", "kVar"], mppt_power: ["กำลังด้าน DC", "kW"],
  efficiency: ["ประสิทธิภาพ", "%"], temperature: ["อุณหภูมิภายใน", "°C"], power_factor: ["ตัวประกอบกำลัง (PF)"],
  elec_freq: ["ความถี่กริด", "Hz"], grid_frequency: ["ความถี่กริด", "Hz"],
  a_u: ["แรงดันเฟส A", "V"], b_u: ["แรงดันเฟส B", "V"], c_u: ["แรงดันเฟส C", "V"],
  ab_u: ["แรงดัน AB", "V"], bc_u: ["แรงดัน BC", "V"], ca_u: ["แรงดัน CA", "V"],
  a_i: ["กระแสเฟส A", "A"], b_i: ["กระแสเฟส B", "A"], c_i: ["กระแสเฟส C", "A"],
  meter_u: ["แรงดัน", "V"], meter_i: ["กระแส", "A"],
  active_cap: ["พลังงานทางบวกสะสม", "kWh"], reverse_active_cap: ["พลังงานย้อนกลับสะสม", "kWh"],
  battery_status: ["สถานะแบตเตอรี่"], battery_soc: ["ประจุคงเหลือ (SOC)", "%"], battery_soh: ["สุขภาพแบต (SOH)", "%"],
  ch_discharge_power: ["กำลังชาร์จ/คายประจุ", "W"], max_charge_power: ["ชาร์จได้สูงสุด", "W"], max_discharge_power: ["คายได้สูงสุด", "W"],
  busbar_u: ["แรงดันบัส", "V"], charge_cap: ["ชาร์จสะสม", "kWh"], discharge_cap: ["คายประจุสะสม", "kWh"],
  ch_discharge_model: ["โหมดการทำงาน"], open_time: ["เริ่มทำงานวันนี้"], close_time: ["หยุดทำงาน"],
  radiant_total: ["ความเข้มแสงสะสมวันนี้", "MJ/m²"], radiant_line: ["ความเข้มแสงตอนนี้", "W/m²"], pv_temperature: ["อุณหภูมิแผง", "°C"],
  wind_speed: ["ความเร็วลม", "m/s"], wind_direction: ["ทิศลม"],
};
/* มิเตอร์: กำลังเป็น W/var · ตรวจกับมิเตอร์จริง 100 ตัว (2026-10-25 กลางคืน โซลาร์ 0) — active_cap = ขาย, reverse = ซื้อ, กำลังบวก = ขาย */
const FS_METER_LABELS = {
  active_cap: ["ขายเข้ากริดสะสม (ทางบวก)", "kWh"], reverse_active_cap: ["ซื้อจากกริดสะสม (ย้อนกลับ)", "kWh"],
  active_power: ["กำลังที่จุดมิเตอร์ (บวก = ขาย)", "W"], reactive_power: ["กำลังรีแอกทีฟ", "var"],
  active_power_a: ["กำลังเฟส A", "W"], active_power_b: ["กำลังเฟส B", "W"], active_power_c: ["กำลังเฟส C", "W"],
  total_apparent_power: ["กำลังปรากฏรวม", "kVA"], reverse_reactive_cap: ["พลังงานรีแอกทีฟย้อนกลับสะสม", "kvarh"], forward_reactive_cap: ["พลังงานรีแอกทีฟทางบวกสะสม", "kvarh"],
};
/* inverter_state — tone: ok ทำงาน · info ทำงานแต่ถูกจำกัด · idle รอ/ไม่มีแสง · bad หยุดผิดปกติ */
const FS_INV_STATE = {
  0: ["สแตนด์บาย: กำลังเริ่มต้น", "idle"], 1: ["สแตนด์บาย: ตรวจความต้านทานฉนวน", "idle"], 2: ["สแตนด์บาย: ตรวจแสง", "idle"],
  3: ["สแตนด์บาย: ตรวจกริด", "idle"], 256: ["กำลังเริ่มทำงาน", "idle"], 512: ["ต่อกริด ทำงานปกติ", "ok"],
  513: ["ต่อกริด จำกัดกำลัง", "info"], 514: ["ต่อกริด ลดกำลังเอง (ร้อน/แรงดัน)", "info"],
  768: ["หยุด: เกิดข้อผิดพลาด", "bad"], 769: ["หยุด: ถูกสั่งหยุด", "bad"], 770: ["หยุด: OVGR", "bad"],
  771: ["หยุด: การสื่อสารขาด", "bad"], 772: ["หยุด: จำกัดกำลัง", "bad"], 773: ["หยุด: ต้องสั่งเริ่มด้วยมือ", "bad"],
  774: ["หยุด: สวิตช์ DC ปิด", "bad"], 1025: ["ต่อกริด ตามคำสั่งกริด (cosφ-P)", "info"], 1026: ["ต่อกริด ตามคำสั่งกริด (Q-U)", "info"],
  1280: ["พร้อมตรวจสอบ", "idle"], 1281: ["กำลังตรวจสอบ", "idle"], 1536: ["กำลังตรวจสอบ", "idle"], 1792: ["ทดสอบ AFCI", "idle"],
  2048: ["สแกน I-V", "idle"], 2304: ["ตรวจอินพุต DC", "idle"], 40960: ["สแตนด์บาย: ไม่มีแสง", "idle"],
  45056: ["การสื่อสารขาด", "bad"], 49152: ["กำลังโหลดเฟิร์มแวร์", "idle"],
};
const FS_ENUMS = {
  run_state: { 0: "ขาดการเชื่อมต่อ", 1: "เชื่อมต่ออยู่" },
  meter_status: { 0: "ออฟไลน์", 1: "ปกติ" },
  battery_status: { 0: "ออฟไลน์", 1: "สแตนด์บาย", 2: "ทำงาน", 3: "ผิดพลาด", 4: "จำศีล" },
  ch_discharge_model: { 0: "ไม่ได้ตั้ง", 1: "บังคับชาร์จ/คาย", 2: "ตามช่วงเวลาค่าไฟ (TOU)", 3: "ชาร์จ/คายคงที่", 4: "ใช้เองให้มากที่สุด", 5: "ขายเข้ากริดทั้งหมด" },
};
const fsInvState = (v) => (v == null ? null : FS_INV_STATE[v] || ["รหัสสถานะ " + v, "idle"]);
function fsKpiLabel(key, meter) {
  if (meter && FS_METER_LABELS[key]) return FS_METER_LABELS[key];
  const m = /^pv(\d+)_(u|i)$/.exec(key);
  if (m) return ["สตริง PV" + m[1] + (m[2] === "u" ? " แรงดัน" : " กระแส"), m[2] === "u" ? "V" : "A"];
  const mp = /^mppt_(\d+)_cap$/.exec(key);
  if (mp) return ["MPPT " + mp[1] + " ผลิตสะสม", "kWh"];
  return FS_KPI_LABELS[key] || null;
}
function fsKpiValue(key, v) {
  if (v == null || v === "" || v === "N/A") return "–";
  if (key === "inverter_state") return fsInvState(v)[0];
  if (FS_ENUMS[key] && FS_ENUMS[key][v] != null) return FS_ENUMS[key][v];
  /* Huawei ส่งเวลาท้องถิ่นของไซต์แต่ตีความเป็นเวลาจีน (UTC+8) — อินเวอร์เตอร์จริง 150 ตัวเริ่ม 05:0x หยุด 17:0x (พระอาทิตย์ขึ้น ~06:13) → บวก 1 ชม. */
  if ((key === "open_time" || key === "close_time") && +v > 1e12) return new Date(+v + 3600e3).toLocaleTimeString("th-TH", { timeStyle: "short", timeZone: "Asia/Bangkok" });
  if (typeof v === "object") return JSON.stringify(v);
  return fsN(v) != null ? fsFmt(v, 2) : String(v);
}

/* ── หน่วยกำลังที่ Huawei ส่งไม่เท่ากันทุกรุ่น (มิเตอร์/แบตบางรุ่นเป็น W) ──
   ค่าที่เกิน 3 เท่าของกำลังติดตั้งเป็นไปไม่ได้ในหน่วย kW → ถือว่าเป็น W */
const fsKw = (v, capKw, isW) => { const n = fsN(v); if (n == null) return null; if (isW) return n / 1000; return capKw && Math.abs(n) > capKw * 3 && Math.abs(n) > 50 ? n / 1000 : n; };
/* พิกัดอินเวอร์เตอร์จากชื่อรุ่น — SUN2000-10KTL-M1 = 10 · SUN5000-150K-MG0 = 150 · SUN2000-5K-MAP0 = 5 kW (ทุกรุ่นในข้อมูลจริงผ่าน) */
const fsRatedKw = (model) => { const m = /-(\d+(?:\.\d+)?)K(?:TL)?(?=-|$)/i.exec(model || ""); return m ? +m[1] : null; };

/* จังหวัดจากที่อยู่ไซต์ — ที่อยู่จาก Huawei/Sungrow ปนไทย/อังกฤษและติดกันเป็นพรืด ("ThailandBang Kapi DistrictKhlong Chan")
   ลำดับ: รหัสไปรษณีย์ 2 หลักแรก → คำบอกกรุงเทพ (เขต/แขวง/Khet) → ชื่อจังหวัด → ชื่อเขต/อำเภอที่เจอบ่อย · ไม่รู้ = "" (ผู้ใช้สั่ง 2026-10-28 หัวไซต์เหลือแค่ขนาดกับจังหวัด) */
const FS_PROV = [
  ["กรุงเทพฯ", "Bangkok", 10], ["นนทบุรี", "Nonthaburi", 11], ["ปทุมธานี", "Pathum Thani", 12], ["พระนครศรีอยุธยา", "Ayutthaya", 13],
  ["อ่างทอง", "Ang Thong", 14], ["ลพบุรี", "Lop Buri", 15], ["สิงห์บุรี", "Sing Buri", 16], ["ชัยนาท", "Chai Nat", 17], ["สระบุรี", "Saraburi", 18],
  ["ชลบุรี", "Chon Buri", 20], ["ระยอง", "Rayong", 21], ["จันทบุรี", "Chanthaburi", 22], ["ตราด", "Trat", 23], ["ฉะเชิงเทรา", "Chachoengsao", 24],
  ["ปราจีนบุรี", "Prachin Buri", 25], ["นครนายก", "Nakhon Nayok", 26], ["สระแก้ว", "Sa Kaeo", 27], ["นครราชสีมา", "Nakhon Ratchasima", 30],
  ["บุรีรัมย์", "Buri Ram", 31], ["สุรินทร์", "Surin", 32], ["ศรีสะเกษ", "Si Sa Ket", 33], ["อุบลราชธานี", "Ubon Ratchathani", 34], ["ยโสธร", "Yasothon", 35],
  ["ชัยภูมิ", "Chaiyaphum", 36], ["อำนาจเจริญ", "Amnat Charoen", 37], ["บึงกาฬ", "Bueng Kan", 38], ["หนองบัวลำภู", "Nong Bua Lam Phu", 39],
  ["ขอนแก่น", "Khon Kaen", 40], ["อุดรธานี", "Udon Thani", 41], ["เลย", "Loei", 42], ["หนองคาย", "Nong Khai", 43], ["มหาสารคาม", "Maha Sarakham", 44],
  ["ร้อยเอ็ด", "Roi Et", 45], ["กาฬสินธุ์", "Kalasin", 46], ["สกลนคร", "Sakon Nakhon", 47], ["นครพนม", "Nakhon Phanom", 48], ["มุกดาหาร", "Mukdahan", 49],
  ["เชียงใหม่", "Chiang Mai", 50], ["ลำพูน", "Lamphun", 51], ["ลำปาง", "Lampang", 52], ["อุตรดิตถ์", "Uttaradit", 53], ["แพร่", "Phrae", 54], ["น่าน", "Nan", 55],
  ["พะเยา", "Phayao", 56], ["เชียงราย", "Chiang Rai", 57], ["แม่ฮ่องสอน", "Mae Hong Son", 58], ["นครสวรรค์", "Nakhon Sawan", 60], ["อุทัยธานี", "Uthai Thani", 61],
  ["กำแพงเพชร", "Kamphaeng Phet", 62], ["ตาก", "Tak", 63], ["สุโขทัย", "Sukhothai", 64], ["พิษณุโลก", "Phitsanulok", 65], ["พิจิตร", "Phichit", 66],
  ["เพชรบูรณ์", "Phetchabun", 67], ["ราชบุรี", "Ratchaburi", 70], ["กาญจนบุรี", "Kanchanaburi", 71], ["สุพรรณบุรี", "Suphan Buri", 72], ["นครปฐม", "Nakhon Pathom", 73],
  ["สมุทรสาคร", "Samut Sakhon", 74], ["สมุทรสงคราม", "Samut Songkhram", 75], ["เพชรบุรี", "Phetchaburi", 76], ["ประจวบคีรีขันธ์", "Prachuap Khiri Khan", 77],
  ["นครศรีธรรมราช", "Nakhon Si Thammarat", 80], ["กระบี่", "Krabi", 81], ["พังงา", "Phangnga", 82], ["ภูเก็ต", "Phuket", 83], ["สุราษฎร์ธานี", "Surat Thani", 84],
  ["ระนอง", "Ranong", 85], ["ชุมพร", "Chumphon", 86], ["สงขลา", "Songkhla", 90], ["สตูล", "Satun", 91], ["ตรัง", "Trang", 92], ["พัทลุง", "Phatthalung", 93],
  ["ปัตตานี", "Pattani", 94], ["ยะลา", "Yala", 95], ["นราธิวาส", "Narathiwat", 96], ["สมุทรปราการ", "Samut Prakan", 0],
];
const FS_PROV_ALIAS = [["กรุงเทพมหานคร", "กรุงเทพฯ"], ["Krung Thep", "กรุงเทพฯ"], ["Phra Nakhon Si Ayutthaya", "พระนครศรีอยุธยา"], ["Lopburi", "ลพบุรี"],
  ["Chonburi", "ชลบุรี"], ["Prachinburi", "ปราจีนบุรี"], ["Buriram", "บุรีรัมย์"], ["Suphanburi", "สุพรรณบุรี"], ["Singburi", "สิงห์บุรี"]];
/* เขต/อำเภอที่ไม่มีจังหวัดหรือรหัสไปรษณีย์ในที่อยู่ */
const FS_AMPHOE = [["สมุทรปราการ", /บางพลี|บางเสาธง|พระสมุทรเจดีย์|พระประแดง|บางบ่อ|แพรกษา|Bang Phli|Bang Sao Thong|Phraeksa/],
  ["นนทบุรี", /บางบัวทอง|ปากเกร็ด|บางใหญ่|บางกรวย|ไทรน้อย|Bang Bua Thong|Pak Kret/], ["ปทุมธานี", /คลองหลวง|ลำลูกกา|ธัญบุรี|Khlong Luang|Lam Luk Ka|Thanyaburi/],
  ["สมุทรสาคร", /กระทุ่มแบน|บ้านแพ้ว|Krathum Baen/], ["นครปฐม", /บางเลน|สามพรา|นครชัยศรี|Bang Len|Sam Phran/], ["อ่างทอง", /วิเศษชัยชาญ|Wiset Chai Chan/],
  ["พระนครศรีอยุธยา", /บางปะอิน|Bang Pa-in/], ["ประจวบคีรีขันธ์", /บางสะพาน|Bang Saphan/], ["สระบุรี", /พระพุทธบาท/], ["เชียงใหม่", /แม่ริม|Mae Rim/]];
const FS_BKK = /เขต|แขวง|Khet|Khwaeng|Bang Kapi|Thung Khru|Wang Thonglang|Lat Phrao|Bang Khen|Min Buri|Prawet|Bueng Kum|Sathon|Watthana|Khlong Toei|Chatuchak|Huai Khwang|Don Mueang|Sai Mai|Lat Krabang|Nong Chok|Bang Na|Phra Khanong|Bang Bon|Bang Khun Thian|Rat Burana|Thon Buri|Taling Chan|Bang Khae|Phasi Charoen|Nong Khaem|Bang Sue|Din Daeng|Phaya Thai|Ratchathewi|Pathum Wan|Bang Rak|Sukhumvit/;
const FS_PM_ZIP = /^(10130|10270|10280|10290|10540|10550|10560)$/;
function fsProvince(addr) {
  const a = String(addr || "").replace(/[​-‏‪-‮]/g, "");
  if (!a) return "";
  const zips = a.match(/(?<![\d/])[1-9]\d{4}(?![\d/])/g) || [];
  for (const z of zips) {
    if (FS_PM_ZIP.test(z)) return "สมุทรปราการ";
    const p = FS_PROV.find((r) => r[2] === +z.slice(0, 2));
    if (p) return p[0];
  }
  if (FS_BKK.test(a)) return "กรุงเทพฯ";
  const en = (n) => new RegExp(n.replace(/ /g, "\\s*") + "(?![a-z])");
  for (const [th, n] of FS_PROV_ALIAS) if (a.includes(th) || en(th).test(a)) return n;
  for (const [th, n] of FS_PROV) if (a.includes(th) || en(n).test(a)) return th;
  const m = FS_AMPHOE.find((r) => r[1].test(a));
  return m ? m[0] : "";
}

/* สตริง PV ของอินเวอร์เตอร์ — Huawei ส่งมาครบทุกช่อง (ช่องว่างเป็น 0) จึงตัดช่องที่ไม่มีอะไรต่อออก
   ช่องที่ไม่ได้ต่อแผงแต่อยู่ MPPT เดียวกับสตริงที่ต่อ จะมีแรงดันตาม MPPT แต่กระแส 0 พอดี — ตอนสตริงอื่นมีกระแส
   ถือว่าไม่ได้ต่อ ไม่เตือน (ผู้ใช้แจ้ง 2026-10-28 Glow Film เตือน 49 เรื่อง "มันไม่ได้ต่อ กระแสเลยไม่มี") · สตริงที่ต่อแต่กระแส 0 (ฟิวส์ขาด) จึงไม่ถูกเตือนด้วย
   กระแสต่ำกว่า 60% ของค่ากลางสตริงอื่น (ตอนมีแดดพอ) = ควรตรวจ (แผงสกปรก/บังเงา/ขั้วหลวม/แผงเสีย) */
/* ช่องสตริงมีของต่อ — มีกระแส · หรือทั้งเครื่องไม่มีกระแส (เช้า/ค่ำ) แต่มีแรงดัน */
function fsStrUsed(k, u, i) {
  if (i > 0.05) return true;
  return u > 5 && !Object.keys(k).some((x) => /^pv\d+_i$/.test(x) && fsN(k[x]) > 0.5);
}
function fsStrings(k) {
  const out = [];
  Object.keys(k || {}).forEach((key) => {
    const m = /^pv(\d+)_u$/.exec(key); if (!m) return;
    const u = fsN(k[key]), i = fsN(k["pv" + m[1] + "_i"]);
    if (!fsStrUsed(k, u, i)) return;
    out.push({ n: +m[1], u, i, kw: u != null && i != null ? (u * i) / 1000 : null });
  });
  out.sort((a, b) => a.n - b.n);
  const med = fsMedian(out.map((s) => s.i));
  out.forEach((s) => { s.ratio = med ? s.i / med : null; s.weak = out.length >= 2 && med > 1 && s.i != null && s.i < med * 0.6; });
  return out;
}

/* ── การไหลของพลังงาน ──
   แบบมาตรฐานของ Huawei (ตรวจกับมิเตอร์จริง 100 ตัว): active_cap (ทางบวก) = ขายเข้ากริด · reverse_active_cap = ซื้อ · active_power เป็น W บวก = ขาย
   มิเตอร์ที่ต่อกลับทิศ: ขายสะสมต้องไม่เกินที่อินเวอร์เตอร์ผลิตสะสม → ถ้า active_cap เกิน แต่ reverse ไม่เกิน → สลับ */
function fsEnergyModel(site, devs) {
  const cap = fsN(site.capacity_kw);
  const invs = devs.filter((d) => +d.dev_type_id === 1 || +d.dev_type_id === 38);
  const meter = devs.find((d) => +d.dev_type_id === 47 || +d.dev_type_id === 17);
  const batt = devs.find((d) => +d.dev_type_id === 39);
  const K = (d) => (window.fsKpi ? window.fsKpi(d) : {});
  let pvKw = null, pvTotal = null;
  invs.forEach((d) => { const k = K(d); if (fsN(k.active_power) != null) pvKw = (pvKw || 0) + +k.active_power; if (fsN(k.total_cap) != null) pvTotal = (pvTotal || 0) + +k.total_cap; });
  const out = { pvKw, pvTotal, cap, hasInv: invs.length > 0 };
  if (meter) {
    const k = K(meter);
    const pos = fsN(k.active_cap), rev = fsN(k.reverse_active_cap);
    let revIsExport = false;
    if (pvTotal != null && pos != null && rev != null && pos > pvTotal * 1.02 && rev <= pvTotal * 1.02) revIsExport = true;
    out.revIsExport = revIsExport;
    out.exportTotal = revIsExport ? rev : pos;
    out.importTotal = revIsExport ? pos : rev;
    const p = fsKw(k.active_power, cap, true);
    if (p != null) out.gridKw = revIsExport ? -p : p;            // บวก = กำลังขายเข้ากริด · ลบ = กำลังซื้อ
    out.meter = meter;
  }
  if (batt) {
    const k = K(batt);
    out.battKw = fsKw(k.ch_discharge_power, cap, true);           // บวก = กำลังชาร์จ · ลบ = กำลังคายประจุ
    out.soc = fsN(k.battery_soc);
    out.batt = batt;
  }
  if (pvKw != null && out.gridKw != null) {
    const load = pvKw - out.gridKw - (out.battKw || 0);
    if (load >= -0.05) out.loadKw = Math.max(0, load);
  }
  /* ใช้เอง/พึ่งตัวเอง จากตัวเลขสะสม — ใช้ได้เมื่อมิเตอร์กับอินเวอร์เตอร์เริ่มนับพร้อมกัน (ติดตั้งพร้อมกัน) */
  if (pvTotal > 0 && out.exportTotal != null && out.exportTotal <= pvTotal * 1.02) {
    out.selfTotal = Math.max(0, pvTotal - out.exportTotal);
    out.selfRate = out.selfTotal / pvTotal;
    if (out.importTotal != null) out.sufficiency = out.selfTotal / (out.selfTotal + out.importTotal);
  }
  return out;
}

/* ผลิตเฉลี่ยต่อวันของเดือนนี้ ต่อ kWp — นับตั้งแต่วันที่ 3 ของเดือน (ก่อนนั้นข้อมูลน้อยเกิน) */
function fsMonthYield(s) {
  const dom = +fsBkk(Date.now()).day.slice(8);
  if (dom < 3 || s.fs_status === "not_found_in_fusionsolar" || fsN(s.month_kwh) == null || !(fsN(s.capacity_kw) > 0)) return null;
  return s.month_kwh / s.capacity_kw / dom;
}
/* ── เรื่องที่ควรดูของไซต์หนึ่ง ── tone: bad (ต้องลงมือ) · warn (ควรตรวจ) */
function fsSiteIssues(site, devs, ctx) {
  const out = [];
  if (!fsCodeOf(site)) return out;
  if (site.fs_status === "not_found_in_fusionsolar") out.push({ tone: "bad", text: "ไม่พบสถานีนี้ใน " + (fsVendor(site) === "sungrow" ? "iSolarCloud" : "FusionSolar") + " ในการซิงก์ล่าสุด" });
  else if (+site.health_state === 1) out.push({ tone: "bad", text: "สถานีออฟไลน์ — ไม่ได้รับข้อมูลจากอุปกรณ์" });
  else if (+site.health_state === 2) out.push({ tone: "warn", text: (fsVendor(site) === "sungrow" ? "iSolarCloud" : "FusionSolar") + " แจ้งว่าสถานีมีปัญหา (มีสัญญาณเตือนค้าง)" });
  const at = Date.parse(site.kpi_updated_at || "");
  if (at && Date.now() - at > 3 * 3600e3 && site.fs_status !== "not_found_in_fusionsolar")
    out.push({ tone: "warn", text: "ข้อมูลผลิตไม่อัปเดตมา " + Math.round((Date.now() - at) / 3600e3) + " ชม." });
  const sun = fsBkk(Date.now()).h;
  (devs || []).forEach((d) => {
    const k = window.fsKpi ? window.fsKpi(d) : {};
    const nm = d.dev_name || d.id;
    if (d.fs_status === "not_found_in_fusionsolar") out.push({ tone: "warn", text: nm + " ไม่อยู่ในรายการอุปกรณ์ของ " + (d.isc_ps_key ? "iSolarCloud" : "FusionSolar") + " แล้ว" });
    const t = +d.dev_type_id;
    if (t === 1 || t === 38) {
      const s = fsInvState(fsN(k.inverter_state));
      if (s && s[1] === "bad") out.push({ tone: "bad", text: nm + " — " + s[0] });
      if (fsN(k.temperature) >= 75) out.push({ tone: "warn", text: nm + " อุณหภูมิสูง " + fsFmt(k.temperature) + " °C" });
      /* Sungrow ส่งค่าต่อ MPPT (แต่ละ MPPT ต่อสตริงไม่เท่ากัน เช่น 5.9 / 12.2 / 4.3 A) — เทียบกันแล้วเตือนผิด จึงไม่ตรวจ */
      if (sun >= 9 && sun <= 15 && !d.isc_ps_key) fsStrings(k).filter((x) => x.weak).forEach((x) =>
        out.push({ tone: "warn", text: nm + " สตริง PV" + x.n + " กระแสต่ำ (" + Math.round(x.ratio * 100) + "% ของสตริงอื่น) — ตรวจเงา/ความสกปรก/ขั้วต่อ" }));
    }
    if (t === 39 && +k.battery_status === 3) out.push({ tone: "bad", text: nm + " แบตเตอรี่แจ้งผิดพลาด" });
    if ((t === 62 || t === 63 || t === 2) && fsN(k.run_state) === 0) out.push({ tone: "bad", text: nm + " ขาดการเชื่อมต่อ" });
  });
  /* ผลิตต่ำกว่าไซต์อื่น — เทียบเฉลี่ยต่อวันของเดือนนี้ต่อ kWp กับค่ากลางของไซต์ที่ออนไลน์ (ctx.medMonth · ต้องมี ≥ 3 ไซต์)
     ไม่ใช้ "วันนี้": ข้อมูลจริงวันอาทิตย์ โรงงานที่จำกัดการขายไฟผลิตต่ำเพราะไม่มีโหลด = เตือนผิด 20 กว่าไซต์ */
  const my = fsMonthYield(site);
  if (ctx && ctx.medMonth && my != null && +site.health_state === 3 && my < ctx.medMonth * 0.6)
    out.push({ tone: "warn", text: "เดือนนี้ผลิตเฉลี่ย " + fsFmt(my, 2) + " kWh/kWp/วัน = " + Math.round((my / ctx.medMonth) * 100) + "% ของไซต์อื่น" });
  return out;
}

/* ── กราฟแท่งชุดเดียว (SVG วาดเอง) ──
   bars: [{ k, label, value, tip: [บรรทัด], partial }] · avg = เส้นค่าเฉลี่ยประ · ชี้ที่คอลัมน์ = กล่องค่า · มีมุมมองตาราง */
const fsNice = (m) => { if (!(m > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(m))), n = m / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
function FsBarChart({ bars, unit, avg, avgLabel, height, empty }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(640);
  const [hov, setHov] = React.useState(null);
  const [table, setTable] = React.useState(false);
  const vals = bars.map((b) => b.value).filter((v) => v != null);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 640));
    ro.observe(el); setW(el.clientWidth || 640);
    return () => ro.disconnect();
  }, [table, vals.length > 0]);
  const H = height || 200, padL = 44, padR = 6, padT = 24, padB = 24;
  const plotW = Math.max(60, w - padL - padR), plotH = H - padT - padB;
  const max = fsNice(Math.max.apply(null, vals.concat([avg || 0, 0])));
  const step = plotW / Math.max(1, bars.length);
  const bw = Math.max(3, Math.min(30, step - Math.max(2, step * 0.3)));
  const Y = (v) => padT + plotH * (1 - v / max);
  const every = Math.max(1, Math.ceil((bars.length * 38) / plotW));
  const fmtTick = (v) => (max >= 10000 ? fsFmt(v / 1000, 1) + "k" : fsFmt(v, max < 10 ? 1 : 0));
  const tog = (
    <button type="button" onClick={() => setTable(!table)}
      style={{ position: "absolute", top: -2, right: 0, border: "none", background: "var(--surface2)", borderRadius: "var(--r-chip)", padding: "3px 9px",
        fontSize: 10.5, fontWeight: 700, color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", zIndex: 2 }}>{table ? "กราฟ" : "ตาราง"}</button>
  );
  if (!vals.length) return (
    <div style={{ height: H, display: "grid", placeItems: "center", textAlign: "center", color: "var(--text-3)", fontSize: 12.5, background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: 16 }}>
      {empty || "ยังไม่มีข้อมูล"}
    </div>
  );
  if (table) return (
    <div style={{ position: "relative", paddingTop: 22 }}>{tog}
      <div style={{ maxHeight: H + 40, overflowY: "auto", borderRadius: "var(--r-tile)", background: "var(--surface2)" }}>
        {bars.filter((b) => b.value != null).map((b, i) => (
          <div key={b.k} style={{ display: "flex", padding: "6px 12px", fontSize: 12, borderTop: i ? "1px solid var(--divider)" : "none" }}>
            <span style={{ flex: 1, color: "var(--text-2)" }}>{(b.tip && b.tip[0]) || b.label}{b.partial ? " (ยังไม่จบ)" : ""}</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{fsFmt(b.value, 1)} {unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
  const hb = hov != null ? bars[hov] : null;
  const tipX = hov != null ? Math.min(Math.max(padL + step * hov + step / 2, 90), w - 90) : 0;
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }} onMouseLeave={() => setHov(null)}>
      {tog}
      <svg width={w} height={H} style={{ display: "block", overflow: "visible" }} role="img" aria-label={"กราฟ " + unit}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={w - padR} y1={Y(max * f)} y2={Y(max * f)} style={{ stroke: "var(--divider)", strokeWidth: 1 }} />
            <text x={padL - 7} y={Y(max * f) + 3.5} textAnchor="end" style={{ fill: "var(--text-3)", fontSize: 10, fontFamily: "var(--mono)" }}>{fmtTick(max * f)}</text>
          </g>
        ))}
        <text x={0} y={10} textAnchor="start" style={{ fill: "var(--text-3)", fontSize: 10, fontWeight: 700 }}>{unit}</text>
        {bars.map((b, i) => {
          const x = padL + step * i + (step - bw) / 2;
          const on = hov === i;
          if (b.value == null || b.value <= 0) return b.value == null ? null : (
            <line key={b.k} x1={x} x2={x + bw} y1={Y(0) - 1} y2={Y(0) - 1} style={{ stroke: "var(--border-strong)", strokeWidth: 2 }} />);
          const y = Y(b.value), yb = Y(0), r = Math.min(4, bw / 2, yb - y);
          return (
            <path key={b.k} d={"M" + x + "," + yb + "L" + x + "," + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "L" + (x + bw - r) + "," + y
              + "Q" + (x + bw) + "," + y + " " + (x + bw) + "," + (y + r) + "L" + (x + bw) + "," + yb + "Z"}
              style={{ fill: "var(--primary)", opacity: b.partial ? (on ? 0.6 : 0.42) : hov != null && !on ? 0.55 : 1, transition: "opacity .12s" }} />
          );
        })}
        {avg > 0 && (
          <g>
            <line x1={padL} x2={w - padR} y1={Y(avg)} y2={Y(avg)} style={{ stroke: "var(--text-2)", strokeWidth: 1.2, strokeDasharray: "4 4" }} />
            <text x={w - padR} y={Y(avg) - 5} textAnchor="end" style={{ fill: "var(--text-2)", fontSize: 10.5, fontWeight: 700 }}>{avgLabel || "เฉลี่ย"} {fsFmt(avg, 1)}</text>
          </g>
        )}
        {bars.map((b, i) => (i % every === 0 || i === bars.length - 1) && (bars.length - 1 - i >= every || i === bars.length - 1) ? (
          <text key={"l" + b.k} x={padL + step * i + step / 2} y={H - 7} textAnchor="middle"
            style={{ fill: hov === i ? "var(--text-1)" : "var(--text-3)", fontSize: 10, fontWeight: hov === i ? 700 : 500 }}>{b.label}</text>
        ) : null)}
        {bars.map((b, i) => (
          <rect key={"h" + b.k} x={padL + step * i} y={padT} width={step} height={plotH + padB} style={{ fill: "transparent", cursor: "default" }}
            onMouseEnter={() => setHov(i)} onTouchStart={() => setHov(i)} />
        ))}
      </svg>
      {hb && (
        <div style={{ position: "absolute", left: tipX, top: 0, transform: "translate(-50%, -6px)", pointerEvents: "none", background: "var(--surface)",
          boxShadow: "var(--shadow-pop)", borderRadius: "var(--r-tile)", padding: "7px 11px", fontSize: 11.5, whiteSpace: "nowrap", zIndex: 3 }}>
          <div style={{ fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{(hb.tip && hb.tip[0]) || hb.label}</div>
          <div style={{ color: "var(--text-1)", fontFamily: "var(--mono)", fontWeight: 700 }}>{hb.value == null ? "ไม่มีข้อมูล" : fsFmt(hb.value, 1) + " " + unit}</div>
          {(hb.tip || []).slice(1).map((t, i) => <div key={i} style={{ color: "var(--text-3)" }}>{t}</div>)}
        </div>
      )}
    </div>
  );
}

/* ── แถบสัดส่วน 100% (ใช้เอง/ขาย/ซื้อ) — ช่องว่าง 2px ระหว่างส่วน · ป้ายชื่อ+ตัวเลขใต้แถบ (ไม่พึ่งสีอย่างเดียว) ── */
function FsSplitBar({ title, total, parts, foot }) {
  const sum = parts.reduce((s, p) => s + (p.value > 0 ? p.value : 0), 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{title}</span>
        {total && <span style={{ marginLeft: "auto", fontSize: 12, fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-2)" }}>{total}</span>}
      </div>
      <div style={{ display: "flex", gap: 2, height: 14, borderRadius: 7, overflow: "hidden" }}>
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} title={p.label + " " + fsFmt(p.value, 0) + " kWh"}
            style={{ width: (p.value / sum) * 100 + "%", background: p.color, minWidth: 3 }} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginTop: 8 }}>
        {parts.map((p) => (
          <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ color: "var(--text-2)" }}>{p.label}</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{Math.round((Math.max(0, p.value) / sum) * 100)}%</span>
            <span style={{ color: "var(--text-3)", fontSize: 11 }}>{fsEnergy(p.value).join(" ")}</span>
          </div>
        ))}
      </div>
      {foot && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>{foot}</div>}
    </div>
  );
}

/* ── แถบระดับ (กำลังเทียบพิกัด · SOC) ── */
function FsMeter({ value, max, tone, h }) {
  const f = max > 0 && value != null ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div style={{ height: h || 6, borderRadius: 4, background: "var(--surface3)", overflow: "hidden" }}>
      <div style={{ width: f * 100 + "%", height: "100%", borderRadius: 4, background: tone || "var(--primary)", transition: "width .4s" }} />
    </div>
  );
}

/* ── การไหลของพลังงานตอนนี้: โซลาร์ → บ้าน · กริด · แบต ── */
function FsFlowNode({ icon, label, value, sub, tone }) {
  return (
    <div style={{ flex: "1 1 130px", minWidth: 0, background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "11px 13px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>
        <Icon name={icon} size={13} color={tone || "var(--text-3)"} />{label}
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}
const FsArrow = () => <div style={{ alignSelf: "center", color: "var(--text-3)", fontSize: 16, flexShrink: 0 }}>→</div>;
function FsEnergyFlow({ em }) {
  const kw = (v) => (v == null ? "–" : fsFmt(Math.abs(v), 2) + " kW");
  const g = em.gridKw;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "stretch" }}>
      <FsFlowNode icon="sun" label="โซลาร์ผลิต" value={kw(em.pvKw)} sub={em.cap && em.pvKw != null ? Math.round((em.pvKw / em.cap) * 100) + "% ของ " + fsFmt(em.cap, 2) + " kWp" : null} tone="var(--primary)" />
      <FsArrow />
      <FsFlowNode icon="home" label="บ้าน/อาคารใช้" value={kw(em.loadKw)} sub={em.loadKw != null && em.pvKw ? "มาจากโซลาร์ " + Math.round(Math.min(1, (em.pvKw - Math.max(0, g || 0) - Math.max(0, em.battKw || 0)) / Math.max(em.loadKw, 0.001)) * 100) + "%" : null} />
      <FsFlowNode icon="bolt" label={g == null ? "กริด" : g > 0.02 ? "ขายเข้ากริด" : g < -0.02 ? "ซื้อจากกริด" : "กริด (สมดุล)"} value={kw(g)}
        tone={g > 0.02 ? "var(--fs-exp)" : g < -0.02 ? "var(--fs-imp)" : null} />
      {em.batt && (
        <FsFlowNode icon="battery" label={em.battKw > 0.02 ? "แบตกำลังชาร์จ" : em.battKw < -0.02 ? "แบตกำลังจ่าย" : "แบตเตอรี่"} value={em.soc != null ? em.soc + "%" : "–"}
          sub={em.battKw != null ? kw(em.battKw) : null} />
      )}
    </div>
  );
}

/* ── การ์ดอุปกรณ์ ── */
function FsKv({ k, keys, meter }) {
  const list = (keys || Object.keys(k)).filter((x) => k[x] != null && k[x] !== "" && k[x] !== "N/A");
  if (!list.length) return <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีค่าจากอุปกรณ์</div>;
  return (
    <div style={{ borderRadius: "var(--r-tile)", background: "var(--surface2)", overflow: "hidden" }}>
      {list.map((key, i) => {
        const lb = fsKpiLabel(key, meter);
        return (
          <div key={key} style={{ display: "flex", gap: 10, padding: "6px 11px", fontSize: 12, borderTop: i ? "1px solid var(--divider)" : "none", alignItems: "baseline" }}>
            <span style={{ flex: 1, color: "var(--text-2)", minWidth: 0 }}>{lb ? lb[0] : key}
              {lb && <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)", marginLeft: 6 }}>{key}</span>}</span>
            <span style={{ fontFamily: "var(--mono)", color: "var(--text-1)", fontWeight: 700, textAlign: "right" }}>
              {fsKpiValue(key, k[key])}{lb && lb[1] && fsN(k[key]) != null && !FS_ENUMS[key] ? " " + lb[1] : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
function FsRawToggle({ k, meter }) {
  const [open, setOpen] = React.useState(false);
  if (!Object.keys(k).length) return null;
  return (
    <div style={{ marginTop: 9 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer",
        fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--primary)" }}>
        {open ? "ซ่อนค่าทั้งหมด" : "ดูค่าทั้งหมดจากอุปกรณ์ (" + Object.keys(k).length + ")"}
      </button>
      {open && <div className="fs-in" style={{ marginTop: 9 }}>{window.FsKvGroups ? <window.FsKvGroups k={k} meter={meter} /> : <FsKv k={k} meter={meter} />}</div>}
    </div>
  );
}
function FsTile({ label, value, unit, sub, tone }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "9px 12px", minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: tone || "var(--text-1)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}{unit && value !== "–" && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}
const FS_TONE = { ok: ["var(--tint-ok-tx)", "var(--tint-ok-bg)"], info: ["var(--tint-amber-tx)", "var(--tint-amber-bg)"],
  idle: ["var(--text-2)", "var(--surface3)"], bad: ["var(--tint-red-tx)", "var(--tint-red-bg)"] };
function FsChip({ tone, children }) {
  const t = FS_TONE[tone] || FS_TONE.idle;
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: "var(--r-pill)", color: t[0], background: t[1], whiteSpace: "nowrap" }}>{children}</span>;
}

function FsInverterBody({ d, k, isMobile }) {
  const rated = fsRatedKw(d.model);
  const p = fsN(k.active_power);
  const strs = fsStrings(k);
  const maxKw = Math.max.apply(null, strs.map((s) => s.kw || 0).concat([0.001]));
  const grid = k.ab_u != null ? [fsFmt(k.ab_u, 0), fsFmt(k.bc_u, 0), fsFmt(k.ca_u, 0)].join(" / ") : fsFmt(k.a_u, 1);
  const cur = k.b_i != null ? [fsFmt(k.a_i, 1), fsFmt(k.b_i, 1), fsFmt(k.c_i, 1)].join(" / ") : fsFmt(k.a_i, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
          <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fsFmt(p, 2)}</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>kW{rated ? " จากพิกัด " + rated + " kW (" + Math.round(((p || 0) / rated) * 100) + "%)" : ""}</span>
        </div>
        {rated && <FsMeter value={p} max={rated} />}
      </div>
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
        <FsTile label="ผลิตวันนี้" value={fsFmt(k.day_cap, 1)} unit="kWh" />
        <FsTile label="ผลิตสะสม" value={fsEnergy(k.total_cap)[0]} unit={fsEnergy(k.total_cap)[1]} />
        <FsTile label="ประสิทธิภาพ" value={fsFmt(k.efficiency, 1)} unit="%" />
        <FsTile label="อุณหภูมิภายใน" value={fsFmt(k.temperature, 1)} unit="°C" tone={fsN(k.temperature) >= 75 ? "var(--tint-amber-tx)" : null} />
        <FsTile label={k.ab_u != null ? "แรงดันกริด AB/BC/CA" : "แรงดันกริด"} value={grid} unit="V" />
        <FsTile label={k.b_i != null ? "กระแส A/B/C" : "กระแสกริด"} value={cur} unit="A" />
        <FsTile label="ความถี่ · PF" value={+k.elec_freq > 0 ? fsFmt(k.elec_freq, 2) + " Hz · " + fsFmt(k.power_factor, 3) : "–"} />
        <FsTile label="เริ่มทำงานวันนี้" value={fsKpiValue("open_time", k.open_time)} />
      </div>
      {strs.length > 0 && window.FsStringGrid && <window.FsStringGrid strs={strs} />}
      {strs.length > 0 && !window.FsStringGrid && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>สตริง PV ({strs.length}) — เทียบกระแสกันเพื่อหาสตริงที่ผิดปกติ</div>
          <div style={{ borderRadius: "var(--r-tile)", background: "var(--surface2)", overflow: "hidden" }}>
            {strs.map((s, i) => (
              <div key={s.n} style={{ display: "flex", gap: 8, alignItems: "center",
                padding: "6px 11px", fontSize: 12, borderTop: i ? "1px solid var(--divider)" : "none", fontVariantNumeric: "tabular-nums" }}>
                <span style={{ fontWeight: 700, color: "var(--text-1)", width: isMobile ? 40 : 52, flexShrink: 0 }}>PV{s.n}</span>
                {!isMobile && <span style={{ fontFamily: "var(--mono)", color: "var(--text-2)", width: 62, flexShrink: 0 }}>{fsFmt(s.u, 0)} V</span>}
                {!isMobile && <span style={{ fontFamily: "var(--mono)", color: "var(--text-2)", width: 62, flexShrink: 0 }}>{fsFmt(s.i, 2)} A</span>}
                {!isMobile && <span style={{ fontFamily: "var(--mono)", color: "var(--text-1)", fontWeight: 700, width: 70, flexShrink: 0 }}>{fsFmt(s.kw, 2)} kW</span>}
                <div style={{ flex: 1, minWidth: 40 }}><FsMeter value={s.kw} max={maxKw} tone={s.weak ? "var(--tint-amber-tx)" : "var(--primary)"} /></div>
                <span style={{ textAlign: "right", width: 72, flexShrink: 0 }}>{s.weak ? <FsChip tone="info">ต่ำ {Math.round(s.ratio * 100)}%</FsChip>
                  : isMobile ? <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{fsFmt(s.kw, 2)} kW</span> : <span style={{ color: "var(--text-3)", fontSize: 11 }}>ปกติ</span>}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <FsRawToggle k={k} />
    </div>
  );
}
function FsMeterBody({ d, k, em, isMobile }) {
  const g = em && em.meter === d ? em.gridKw : null;
  /* มิเตอร์ 3 เฟส (grid meter 17) ไม่มี meter_u/meter_i ส่งรายเฟสแทน */
  const ph3u = fsN(k.meter_u) == null && fsN(k.a_u) != null, ph3i = fsN(k.meter_i) == null && fsN(k.a_i) != null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
        <FsTile label={g == null ? "กำลังที่จุดมิเตอร์" : g > 0.02 ? "กำลังขายเข้ากริด" : g < -0.02 ? "กำลังซื้อจากกริด" : "กริด"} value={fsFmt(g != null ? Math.abs(g) : fsKw(k.active_power, null, true), 2)} unit="kW"
          tone={g > 0.02 ? "var(--fs-exp)" : g < -0.02 ? "var(--fs-imp)" : null} />
        <FsTile label="ซื้อจากกริดสะสม" value={em && em.importTotal != null ? fsEnergy(em.importTotal)[0] : "–"} unit={em && em.importTotal != null ? fsEnergy(em.importTotal)[1] : ""} />
        <FsTile label="ขายเข้ากริดสะสม" value={em && em.exportTotal != null ? fsEnergy(em.exportTotal)[0] : "–"} unit={em && em.exportTotal != null ? fsEnergy(em.exportTotal)[1] : ""} />
        {(k.meter_status != null || k.run_state != null) && <FsTile label="สถานะ" value={fsKpiValue("meter_status", k.meter_status != null ? k.meter_status : k.run_state)} />}
        <FsTile label={ph3u ? "แรงดัน A/B/C" : "แรงดัน"} value={ph3u ? [k.a_u, k.b_u, k.c_u].map((v) => fsFmt(v, 0)).join(" / ") : fsFmt(k.meter_u, 1)} unit="V" />
        <FsTile label={ph3i ? "กระแส A/B/C" : "กระแส"} value={ph3i ? [k.a_i, k.b_i, k.c_i].map((v) => fsFmt(fsN(v) != null ? Math.abs(v) : null, 0)).join(" / ") : fsFmt(fsN(k.meter_i) != null ? Math.abs(k.meter_i) : null, 2)} unit="A" />
        {fsN(k.grid_frequency) != null && <FsTile label="ความถี่" value={fsFmt(k.grid_frequency, 2)} unit="Hz" />}
        <FsTile label="ตัวประกอบกำลัง" value={fsFmt(k.power_factor, 3)} />
      </div>
      <FsRawToggle k={k} meter />
    </div>
  );
}
function FsBatteryBody({ k, em, isMobile }) {
  const soc = fsN(k.battery_soc), pw = em && em.battKw != null ? em.battKw : fsKw(k.ch_discharge_power, null, true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
          <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700 }}>{soc == null ? "–" : soc + "%"}</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>ประจุคงเหลือ · {pw == null ? "" : pw > 0.02 ? "กำลังชาร์จ " + fsFmt(pw, 2) + " kW" : pw < -0.02 ? "กำลังจ่าย " + fsFmt(-pw, 2) + " kW" : "ไม่ได้ชาร์จ/จ่าย"}</span>
        </div>
        <FsMeter value={soc} max={100} h={9} tone={soc != null && soc < 15 ? "var(--tint-amber-tx)" : "var(--primary)"} />
      </div>
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 8 }}>
        <FsTile label="สถานะ" value={fsKpiValue("battery_status", k.battery_status)} tone={+k.battery_status === 3 ? "var(--tint-red-tx)" : null} />
        <FsTile label="สุขภาพแบต (SOH)" value={+k.battery_soh > 0 ? fsFmt(k.battery_soh, 0) : "–"} unit="%" />
        <FsTile label="ชาร์จ / คายสะสม" value={fsFmt(k.charge_cap, 0) + " / " + fsFmt(k.discharge_cap, 0)} unit="kWh" />
        <FsTile label="โหมด" value={fsKpiValue("ch_discharge_model", k.ch_discharge_model)} />
      </div>
      <FsRawToggle k={k} />
    </div>
  );
}

Object.assign(window, {
  fsN, fsFmt, fsEnergy, fsBkk, fsDayTH, fsMonTH, fsMedian, FS_GRID_EF, fsInvState, fsStrings, fsStrUsed, fsProvince, fsEnergyModel, fsSiteIssues, fsMonthYield,
  FsBarChart, FsSplitBar, FsMeter, FsEnergyFlow, FsKv, FsTile, FsChip, FsInverterBody, FsMeterBody, FsBatteryBody,
});
