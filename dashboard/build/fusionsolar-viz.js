const fsVendor = s => s && s.isc_ps_id != null ? "sungrow" : s && s.source === "manual" ? "manual" : "huawei";
const fsCodeOf = s => !s ? "" : s.fusionsolar_station_code || (s.isc_ps_id != null ? "PS " + s.isc_ps_id : "");
const fsVendorTH = s => ({
  sungrow: "Sungrow iSolarCloud",
  huawei: "Huawei FusionSolar",
  manual: "เพิ่มเองในเว็บ"
})[fsVendor(s)];
(function fsInjectCss() {
  if (document.getElementById("fs-viz-css")) return;
  const el = document.createElement("style");
  el.id = "fs-viz-css";
  el.textContent = ":root{--fs-self:#1B9B75;--fs-exp:#2F6FDB;--fs-imp:#C2410C}" + "[data-theme=\"aurora\"]{--fs-self:#21A77D;--fs-exp:#4A84E8;--fs-imp:#DB6E2E}" + ":root{--fs-zebra:color-mix(in srgb,var(--surface2) 55%,transparent)}.fs-row:hover td{background:var(--surface2)!important}.fs-att:hover{background:var(--surface2)}";
  document.head.appendChild(el);
})();
const fsN = v => v == null || v === "" || isNaN(+v) ? null : +v;
const fsFmt = (v, d) => fsN(v) == null ? "–" : (+v).toLocaleString("th-TH", {
  maximumFractionDigits: d == null ? 1 : d
});
const fsEnergy = kwh => fsN(kwh) == null ? ["–", "kWh"] : Math.abs(kwh) >= 10000 ? [fsFmt(kwh / 1000, 1), "MWh"] : [fsFmt(kwh, 1), "kWh"];
const fsBkk = ms => {
  const x = new Date(ms + 7 * 3600e3).toISOString();
  return {
    day: x.slice(0, 10),
    mon: x.slice(0, 7),
    hh: x.slice(11, 13),
    h: +x.slice(11, 13)
  };
};
const FS_MON_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const fsDayTH = key => {
  const [y, m, d] = key.split("-");
  return +d + " " + FS_MON_TH[+m - 1] + " " + String(+y + 543).slice(2);
};
const fsMonTH = key => {
  const [y, m] = key.split("-");
  return FS_MON_TH[+m - 1] + " " + String(+y + 543).slice(2);
};
const fsMedian = a => {
  const s = a.filter(v => v != null).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const FS_GRID_EF = 0.4999;
const FS_KPI_LABELS = {
  inverter_state: ["สถานะอินเวอร์เตอร์"],
  run_state: ["การเชื่อมต่อ"],
  meter_status: ["สถานะมิเตอร์"],
  total_cap: ["ผลิตสะสม", "kWh"],
  day_cap: ["ผลิตวันนี้", "kWh"],
  mppt_total_cap: ["ผลิตสะสมด้าน DC", "kWh"],
  active_power: ["กำลังไฟฟ้า", "kW"],
  reactive_power: ["กำลังรีแอกทีฟ", "kVar"],
  mppt_power: ["กำลังด้าน DC", "kW"],
  efficiency: ["ประสิทธิภาพ", "%"],
  temperature: ["อุณหภูมิภายใน", "°C"],
  power_factor: ["ตัวประกอบกำลัง (PF)"],
  elec_freq: ["ความถี่กริด", "Hz"],
  grid_frequency: ["ความถี่กริด", "Hz"],
  a_u: ["แรงดันเฟส A", "V"],
  b_u: ["แรงดันเฟส B", "V"],
  c_u: ["แรงดันเฟส C", "V"],
  ab_u: ["แรงดัน AB", "V"],
  bc_u: ["แรงดัน BC", "V"],
  ca_u: ["แรงดัน CA", "V"],
  a_i: ["กระแสเฟส A", "A"],
  b_i: ["กระแสเฟส B", "A"],
  c_i: ["กระแสเฟส C", "A"],
  meter_u: ["แรงดัน", "V"],
  meter_i: ["กระแส", "A"],
  active_cap: ["พลังงานทางบวกสะสม", "kWh"],
  reverse_active_cap: ["พลังงานย้อนกลับสะสม", "kWh"],
  battery_status: ["สถานะแบตเตอรี่"],
  battery_soc: ["ประจุคงเหลือ (SOC)", "%"],
  battery_soh: ["สุขภาพแบต (SOH)", "%"],
  ch_discharge_power: ["กำลังชาร์จ/คายประจุ", "W"],
  max_charge_power: ["ชาร์จได้สูงสุด", "W"],
  max_discharge_power: ["คายได้สูงสุด", "W"],
  busbar_u: ["แรงดันบัส", "V"],
  charge_cap: ["ชาร์จสะสม", "kWh"],
  discharge_cap: ["คายประจุสะสม", "kWh"],
  ch_discharge_model: ["โหมดการทำงาน"],
  open_time: ["เริ่มทำงานวันนี้"],
  close_time: ["หยุดทำงาน"],
  radiant_total: ["ความเข้มแสงสะสมวันนี้", "MJ/m²"],
  radiant_line: ["ความเข้มแสงตอนนี้", "W/m²"],
  pv_temperature: ["อุณหภูมิแผง", "°C"],
  wind_speed: ["ความเร็วลม", "m/s"],
  wind_direction: ["ทิศลม"]
};
const FS_METER_LABELS = {
  active_cap: ["ขายเข้ากริดสะสม (ทางบวก)", "kWh"],
  reverse_active_cap: ["ซื้อจากกริดสะสม (ย้อนกลับ)", "kWh"],
  active_power: ["กำลังที่จุดมิเตอร์ (บวก = ขาย)", "W"],
  reactive_power: ["กำลังรีแอกทีฟ", "var"],
  active_power_a: ["กำลังเฟส A", "W"],
  active_power_b: ["กำลังเฟส B", "W"],
  active_power_c: ["กำลังเฟส C", "W"],
  total_apparent_power: ["กำลังปรากฏรวม", "kVA"],
  reverse_reactive_cap: ["พลังงานรีแอกทีฟย้อนกลับสะสม", "kvarh"],
  forward_reactive_cap: ["พลังงานรีแอกทีฟทางบวกสะสม", "kvarh"]
};
const FS_INV_STATE = {
  0: ["สแตนด์บาย: กำลังเริ่มต้น", "idle"],
  1: ["สแตนด์บาย: ตรวจความต้านทานฉนวน", "idle"],
  2: ["สแตนด์บาย: ตรวจแสง", "idle"],
  3: ["สแตนด์บาย: ตรวจกริด", "idle"],
  256: ["กำลังเริ่มทำงาน", "idle"],
  512: ["ต่อกริด ทำงานปกติ", "ok"],
  513: ["ต่อกริด จำกัดกำลัง", "info"],
  514: ["ต่อกริด ลดกำลังเอง (ร้อน/แรงดัน)", "info"],
  768: ["หยุด: เกิดข้อผิดพลาด", "bad"],
  769: ["หยุด: ถูกสั่งหยุด", "bad"],
  770: ["หยุด: OVGR", "bad"],
  771: ["หยุด: การสื่อสารขาด", "bad"],
  772: ["หยุด: จำกัดกำลัง", "bad"],
  773: ["หยุด: ต้องสั่งเริ่มด้วยมือ", "bad"],
  774: ["หยุด: สวิตช์ DC ปิด", "bad"],
  1025: ["ต่อกริด ตามคำสั่งกริด (cosφ-P)", "info"],
  1026: ["ต่อกริด ตามคำสั่งกริด (Q-U)", "info"],
  1280: ["พร้อมตรวจสอบ", "idle"],
  1281: ["กำลังตรวจสอบ", "idle"],
  1536: ["กำลังตรวจสอบ", "idle"],
  1792: ["ทดสอบ AFCI", "idle"],
  2048: ["สแกน I-V", "idle"],
  2304: ["ตรวจอินพุต DC", "idle"],
  40960: ["สแตนด์บาย: ไม่มีแสง", "idle"],
  45056: ["การสื่อสารขาด", "bad"],
  49152: ["กำลังโหลดเฟิร์มแวร์", "idle"]
};
const FS_ENUMS = {
  run_state: {
    0: "ขาดการเชื่อมต่อ",
    1: "เชื่อมต่ออยู่"
  },
  meter_status: {
    0: "ออฟไลน์",
    1: "ปกติ"
  },
  battery_status: {
    0: "ออฟไลน์",
    1: "สแตนด์บาย",
    2: "ทำงาน",
    3: "ผิดพลาด",
    4: "จำศีล"
  },
  ch_discharge_model: {
    0: "ไม่ได้ตั้ง",
    1: "บังคับชาร์จ/คาย",
    2: "ตามช่วงเวลาค่าไฟ (TOU)",
    3: "ชาร์จ/คายคงที่",
    4: "ใช้เองให้มากที่สุด",
    5: "ขายเข้ากริดทั้งหมด"
  }
};
const fsInvState = v => v == null ? null : FS_INV_STATE[v] || ["รหัสสถานะ " + v, "idle"];
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
  if ((key === "open_time" || key === "close_time") && +v > 1e12) return new Date(+v + 3600e3).toLocaleTimeString("th-TH", {
    timeStyle: "short",
    timeZone: "Asia/Bangkok"
  });
  if (typeof v === "object") return JSON.stringify(v);
  return fsN(v) != null ? fsFmt(v, 2) : String(v);
}
const fsKw = (v, capKw, isW) => {
  const n = fsN(v);
  if (n == null) return null;
  if (isW) return n / 1000;
  return capKw && Math.abs(n) > capKw * 3 && Math.abs(n) > 50 ? n / 1000 : n;
};
const fsRatedKw = model => {
  const m = /-(\d+(?:\.\d+)?)K(?:TL)?(?=-|$)/i.exec(model || "");
  return m ? +m[1] : null;
};
const FS_PROV = [["กรุงเทพฯ", "Bangkok", 10], ["นนทบุรี", "Nonthaburi", 11], ["ปทุมธานี", "Pathum Thani", 12], ["พระนครศรีอยุธยา", "Ayutthaya", 13], ["อ่างทอง", "Ang Thong", 14], ["ลพบุรี", "Lop Buri", 15], ["สิงห์บุรี", "Sing Buri", 16], ["ชัยนาท", "Chai Nat", 17], ["สระบุรี", "Saraburi", 18], ["ชลบุรี", "Chon Buri", 20], ["ระยอง", "Rayong", 21], ["จันทบุรี", "Chanthaburi", 22], ["ตราด", "Trat", 23], ["ฉะเชิงเทรา", "Chachoengsao", 24], ["ปราจีนบุรี", "Prachin Buri", 25], ["นครนายก", "Nakhon Nayok", 26], ["สระแก้ว", "Sa Kaeo", 27], ["นครราชสีมา", "Nakhon Ratchasima", 30], ["บุรีรัมย์", "Buri Ram", 31], ["สุรินทร์", "Surin", 32], ["ศรีสะเกษ", "Si Sa Ket", 33], ["อุบลราชธานี", "Ubon Ratchathani", 34], ["ยโสธร", "Yasothon", 35], ["ชัยภูมิ", "Chaiyaphum", 36], ["อำนาจเจริญ", "Amnat Charoen", 37], ["บึงกาฬ", "Bueng Kan", 38], ["หนองบัวลำภู", "Nong Bua Lam Phu", 39], ["ขอนแก่น", "Khon Kaen", 40], ["อุดรธานี", "Udon Thani", 41], ["เลย", "Loei", 42], ["หนองคาย", "Nong Khai", 43], ["มหาสารคาม", "Maha Sarakham", 44], ["ร้อยเอ็ด", "Roi Et", 45], ["กาฬสินธุ์", "Kalasin", 46], ["สกลนคร", "Sakon Nakhon", 47], ["นครพนม", "Nakhon Phanom", 48], ["มุกดาหาร", "Mukdahan", 49], ["เชียงใหม่", "Chiang Mai", 50], ["ลำพูน", "Lamphun", 51], ["ลำปาง", "Lampang", 52], ["อุตรดิตถ์", "Uttaradit", 53], ["แพร่", "Phrae", 54], ["น่าน", "Nan", 55], ["พะเยา", "Phayao", 56], ["เชียงราย", "Chiang Rai", 57], ["แม่ฮ่องสอน", "Mae Hong Son", 58], ["นครสวรรค์", "Nakhon Sawan", 60], ["อุทัยธานี", "Uthai Thani", 61], ["กำแพงเพชร", "Kamphaeng Phet", 62], ["ตาก", "Tak", 63], ["สุโขทัย", "Sukhothai", 64], ["พิษณุโลก", "Phitsanulok", 65], ["พิจิตร", "Phichit", 66], ["เพชรบูรณ์", "Phetchabun", 67], ["ราชบุรี", "Ratchaburi", 70], ["กาญจนบุรี", "Kanchanaburi", 71], ["สุพรรณบุรี", "Suphan Buri", 72], ["นครปฐม", "Nakhon Pathom", 73], ["สมุทรสาคร", "Samut Sakhon", 74], ["สมุทรสงคราม", "Samut Songkhram", 75], ["เพชรบุรี", "Phetchaburi", 76], ["ประจวบคีรีขันธ์", "Prachuap Khiri Khan", 77], ["นครศรีธรรมราช", "Nakhon Si Thammarat", 80], ["กระบี่", "Krabi", 81], ["พังงา", "Phangnga", 82], ["ภูเก็ต", "Phuket", 83], ["สุราษฎร์ธานี", "Surat Thani", 84], ["ระนอง", "Ranong", 85], ["ชุมพร", "Chumphon", 86], ["สงขลา", "Songkhla", 90], ["สตูล", "Satun", 91], ["ตรัง", "Trang", 92], ["พัทลุง", "Phatthalung", 93], ["ปัตตานี", "Pattani", 94], ["ยะลา", "Yala", 95], ["นราธิวาส", "Narathiwat", 96], ["สมุทรปราการ", "Samut Prakan", 0]];
const FS_PROV_ALIAS = [["กรุงเทพมหานคร", "กรุงเทพฯ"], ["Krung Thep", "กรุงเทพฯ"], ["Phra Nakhon Si Ayutthaya", "พระนครศรีอยุธยา"], ["Lopburi", "ลพบุรี"], ["Chonburi", "ชลบุรี"], ["Prachinburi", "ปราจีนบุรี"], ["Buriram", "บุรีรัมย์"], ["Suphanburi", "สุพรรณบุรี"], ["Singburi", "สิงห์บุรี"]];
const FS_AMPHOE = [["สมุทรปราการ", /บางพลี|บางเสาธง|พระสมุทรเจดีย์|พระประแดง|บางบ่อ|แพรกษา|Bang Phli|Bang Sao Thong|Phraeksa/], ["นนทบุรี", /บางบัวทอง|ปากเกร็ด|บางใหญ่|บางกรวย|ไทรน้อย|Bang Bua Thong|Pak Kret/], ["ปทุมธานี", /คลองหลวง|ลำลูกกา|ธัญบุรี|Khlong Luang|Lam Luk Ka|Thanyaburi/], ["สมุทรสาคร", /กระทุ่มแบน|บ้านแพ้ว|Krathum Baen/], ["นครปฐม", /บางเลน|สามพรา|นครชัยศรี|Bang Len|Sam Phran/], ["อ่างทอง", /วิเศษชัยชาญ|Wiset Chai Chan/], ["พระนครศรีอยุธยา", /บางปะอิน|Bang Pa-in/], ["ประจวบคีรีขันธ์", /บางสะพาน|Bang Saphan/], ["สระบุรี", /พระพุทธบาท/], ["เชียงใหม่", /แม่ริม|Mae Rim/]];
const FS_BKK = /เขต|แขวง|Khet|Khwaeng|Bang Kapi|Thung Khru|Wang Thonglang|Lat Phrao|Bang Khen|Min Buri|Prawet|Bueng Kum|Sathon|Watthana|Khlong Toei|Chatuchak|Huai Khwang|Don Mueang|Sai Mai|Lat Krabang|Nong Chok|Bang Na|Phra Khanong|Bang Bon|Bang Khun Thian|Rat Burana|Thon Buri|Taling Chan|Bang Khae|Phasi Charoen|Nong Khaem|Bang Sue|Din Daeng|Phaya Thai|Ratchathewi|Pathum Wan|Bang Rak|Sukhumvit/;
const FS_PM_ZIP = /^(10130|10270|10280|10290|10540|10550|10560)$/;
function fsProvince(addr) {
  const a = String(addr || "").replace(/[​-‏‪-‮]/g, "");
  if (!a) return "";
  const zips = a.match(/(?<![\d/])[1-9]\d{4}(?![\d/])/g) || [];
  for (const z of zips) {
    if (FS_PM_ZIP.test(z)) return "สมุทรปราการ";
    const p = FS_PROV.find(r => r[2] === +z.slice(0, 2));
    if (p) return p[0];
  }
  if (FS_BKK.test(a)) return "กรุงเทพฯ";
  const en = n => new RegExp(n.replace(/ /g, "\\s*") + "(?![a-z])");
  for (const [th, n] of FS_PROV_ALIAS) if (a.includes(th) || en(th).test(a)) return n;
  for (const [th, n] of FS_PROV) if (a.includes(th) || en(n).test(a)) return th;
  const m = FS_AMPHOE.find(r => r[1].test(a));
  return m ? m[0] : "";
}
function fsStrUsed(k, u, i) {
  if (i > 0.05) return true;
  return u > 5 && !Object.keys(k).some(x => /^pv\d+_i$/.test(x) && fsN(k[x]) > 0.5);
}
function fsStrings(k) {
  const out = [];
  Object.keys(k || {}).forEach(key => {
    const m = /^pv(\d+)_u$/.exec(key);
    if (!m) return;
    const u = fsN(k[key]),
      i = fsN(k["pv" + m[1] + "_i"]);
    if (!fsStrUsed(k, u, i)) return;
    out.push({
      n: +m[1],
      u,
      i,
      kw: u != null && i != null ? u * i / 1000 : null
    });
  });
  out.sort((a, b) => a.n - b.n);
  const med = fsMedian(out.map(s => s.i));
  out.forEach(s => {
    s.ratio = med ? s.i / med : null;
    s.weak = out.length >= 2 && med > 1 && s.i != null && s.i < med * 0.6;
  });
  return out;
}
function fsEnergyModel(site, devs) {
  const cap = fsN(site.capacity_kw);
  const invs = devs.filter(d => +d.dev_type_id === 1 || +d.dev_type_id === 38);
  const meter = devs.find(d => +d.dev_type_id === 47 || +d.dev_type_id === 17);
  const batt = devs.find(d => +d.dev_type_id === 39);
  const K = d => window.fsKpi ? window.fsKpi(d) : {};
  let pvKw = null,
    pvTotal = null;
  invs.forEach(d => {
    const k = K(d);
    if (fsN(k.active_power) != null) pvKw = (pvKw || 0) + +k.active_power;
    if (fsN(k.total_cap) != null) pvTotal = (pvTotal || 0) + +k.total_cap;
  });
  const out = {
    pvKw,
    pvTotal,
    cap,
    hasInv: invs.length > 0
  };
  if (meter) {
    const k = K(meter);
    const pos = fsN(k.active_cap),
      rev = fsN(k.reverse_active_cap);
    let revIsExport = false;
    if (pvTotal != null && pos != null && rev != null && pos > pvTotal * 1.02 && rev <= pvTotal * 1.02) revIsExport = true;
    out.revIsExport = revIsExport;
    out.exportTotal = revIsExport ? rev : pos;
    out.importTotal = revIsExport ? pos : rev;
    const p = fsKw(k.active_power, cap, true);
    if (p != null) out.gridKw = revIsExport ? -p : p;
    out.meter = meter;
  }
  if (batt) {
    const k = K(batt);
    out.battKw = fsKw(k.ch_discharge_power, cap, true);
    out.soc = fsN(k.battery_soc);
    out.batt = batt;
  }
  if (pvKw != null && out.gridKw != null) {
    const load = pvKw - out.gridKw - (out.battKw || 0);
    if (load >= -0.05) out.loadKw = Math.max(0, load);
  }
  if (pvTotal > 0 && out.exportTotal != null && out.exportTotal <= pvTotal * 1.02) {
    out.selfTotal = Math.max(0, pvTotal - out.exportTotal);
    out.selfRate = out.selfTotal / pvTotal;
    if (out.importTotal != null) out.sufficiency = out.selfTotal / (out.selfTotal + out.importTotal);
  }
  return out;
}
function fsMonthYield(s) {
  const dom = +fsBkk(Date.now()).day.slice(8);
  if (dom < 3 || s.fs_status === "not_found_in_fusionsolar" || fsN(s.month_kwh) == null || !(fsN(s.capacity_kw) > 0)) return null;
  return s.month_kwh / s.capacity_kw / dom;
}
const FS_PSH = [4.9, 5.4, 5.6, 5.8, 5.3, 4.9, 4.7, 4.6, 4.6, 4.7, 4.8, 4.7];
function fsSunFrac(ms) {
  const b = new Date(ms + 7 * 3600e3),
    t = (b.getUTCHours() + b.getUTCMinutes() / 60 - 6) / 12;
  return t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.cos(Math.PI * t)) / 2;
}
function fsPR(s, mode, liveKw) {
  const cap = fsN(s.capacity_kw),
    now = Date.now();
  if (!(cap > 0) || s.fs_status === "not_found_in_fusionsolar") return null;
  const H = FS_PSH[+fsBkk(now).mon.slice(5) - 1];
  if (mode === "month") {
    const y = fsMonthYield(s);
    return y == null ? null : y / H * 100;
  }
  if (mode === "day") {
    const f = fsSunFrac(now),
      kwh = fsN(s.day_kwh);
    return f < 0.15 || kwh == null ? null : kwh / cap / (H * f) * 100;
  }
  const b = new Date(now + 7 * 3600e3),
    t = (b.getUTCHours() + b.getUTCMinutes() / 60 - 6) / 12;
  if (liveKw == null || t < 0.15 || t > 0.85) return null;
  const g = H * Math.PI / 24 * Math.sin(Math.PI * t);
  return liveKw / cap / g * 100;
}
function fsSiteIssues(site, devs, ctx) {
  const out = [];
  if (!fsCodeOf(site)) return out;
  if (site.fs_status === "not_found_in_fusionsolar") out.push({
    tone: "bad",
    text: "ไม่พบสถานีนี้ใน " + (fsVendor(site) === "sungrow" ? "iSolarCloud" : "FusionSolar") + " ในการซิงก์ล่าสุด"
  });else if (+site.health_state === 1) out.push({
    tone: "bad",
    text: "สถานีออฟไลน์ — ไม่ได้รับข้อมูลจากอุปกรณ์"
  });else if (+site.health_state === 2) out.push({
    tone: "warn",
    text: (fsVendor(site) === "sungrow" ? "iSolarCloud" : "FusionSolar") + " แจ้งว่าสถานีมีปัญหา (มีสัญญาณเตือนค้าง)"
  });
  const at = Date.parse(site.kpi_updated_at || "");
  if (at && Date.now() - at > 3 * 3600e3 && site.fs_status !== "not_found_in_fusionsolar") out.push({
    tone: "warn",
    text: "ข้อมูลผลิตไม่อัปเดตมา " + Math.round((Date.now() - at) / 3600e3) + " ชม."
  });
  const sun = fsBkk(Date.now()).h;
  (devs || []).forEach(d => {
    const k = window.fsKpi ? window.fsKpi(d) : {};
    const nm = d.dev_name || d.id;
    if (d.fs_status === "not_found_in_fusionsolar") out.push({
      tone: "warn",
      text: nm + " ไม่อยู่ในรายการอุปกรณ์ของ " + (d.isc_ps_key ? "iSolarCloud" : "FusionSolar") + " แล้ว"
    });
    const t = +d.dev_type_id;
    if (t === 1 || t === 38) {
      const s = fsInvState(fsN(k.inverter_state));
      if (s && s[1] === "bad") out.push({
        tone: "bad",
        text: nm + " — " + s[0]
      });
      if (fsN(k.temperature) >= 75) out.push({
        tone: "warn",
        text: nm + " อุณหภูมิสูง " + fsFmt(k.temperature) + " °C"
      });
      if (sun >= 9 && sun <= 15 && !d.isc_ps_key) fsStrings(k).filter(x => x.weak).forEach(x => out.push({
        tone: "warn",
        text: nm + " สตริง PV" + x.n + " กระแสต่ำ (" + Math.round(x.ratio * 100) + "% ของสตริงอื่น) — ตรวจเงา/ความสกปรก/ขั้วต่อ"
      }));
    }
    if (t === 39 && +k.battery_status === 3) out.push({
      tone: "bad",
      text: nm + " แบตเตอรี่แจ้งผิดพลาด"
    });
    if ((t === 62 || t === 63 || t === 2) && fsN(k.run_state) === 0) out.push({
      tone: "bad",
      text: nm + " ขาดการเชื่อมต่อ"
    });
  });
  const my = fsMonthYield(site);
  if (ctx && ctx.medMonth && my != null && +site.health_state === 3 && my < ctx.medMonth * 0.6) out.push({
    tone: "warn",
    text: "เดือนนี้ผลิตเฉลี่ย " + fsFmt(my, 2) + " kWh/kWp/วัน = " + Math.round(my / ctx.medMonth * 100) + "% ของไซต์อื่น"
  });
  return out;
}
const fsNice = m => {
  if (!(m > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(m))),
    n = m / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
function FsBarChart({
  bars,
  unit,
  avg,
  avgLabel,
  height,
  empty
}) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(640);
  const [hov, setHov] = React.useState(null);
  const [table, setTable] = React.useState(false);
  const vals = bars.map(b => b.value).filter(v => v != null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || 640));
    ro.observe(el);
    setW(el.clientWidth || 640);
    return () => ro.disconnect();
  }, [table, vals.length > 0]);
  const H = height || 200,
    padL = 44,
    padR = 6,
    padT = 24,
    padB = 24;
  const plotW = Math.max(60, w - padL - padR),
    plotH = H - padT - padB;
  const max = fsNice(Math.max.apply(null, vals.concat([avg || 0, 0])));
  const step = plotW / Math.max(1, bars.length);
  const bw = Math.max(3, Math.min(30, step - Math.max(2, step * 0.3)));
  const Y = v => padT + plotH * (1 - v / max);
  const every = Math.max(1, Math.ceil(bars.length * 38 / plotW));
  const fmtTick = v => max >= 10000 ? fsFmt(v / 1000, 1) + "k" : fsFmt(v, max < 10 ? 1 : 0);
  const tog = React.createElement("button", {
    type: "button",
    onClick: () => setTable(!table),
    style: {
      position: "absolute",
      top: -2,
      right: 0,
      border: "none",
      background: "var(--surface2)",
      borderRadius: "var(--r-chip)",
      padding: "3px 9px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-2)",
      cursor: "pointer",
      fontFamily: "inherit",
      zIndex: 2
    }
  }, table ? "กราฟ" : "ตาราง");
  if (!vals.length) return React.createElement("div", {
    style: {
      height: H,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5,
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: 16
    }
  }, empty || "ยังไม่มีข้อมูล");
  if (table) return React.createElement("div", {
    style: {
      position: "relative",
      paddingTop: 22
    }
  }, tog, React.createElement("div", {
    style: {
      maxHeight: H + 40,
      overflowY: "auto",
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)"
    }
  }, bars.filter(b => b.value != null).map((b, i) => React.createElement("div", {
    key: b.k,
    style: {
      display: "flex",
      padding: "6px 12px",
      fontSize: 12,
      borderTop: i ? "1px solid var(--divider)" : "none"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      color: "var(--text-2)"
    }
  }, b.tip && b.tip[0] || b.label, b.partial ? " (ยังไม่จบ)" : ""), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, fsFmt(b.value, 1), " ", unit)))));
  const hb = hov != null ? bars[hov] : null;
  const tipX = hov != null ? Math.min(Math.max(padL + step * hov + step / 2, 90), w - 90) : 0;
  return React.createElement("div", {
    ref: ref,
    style: {
      position: "relative",
      width: "100%"
    },
    onMouseLeave: () => setHov(null)
  }, tog, React.createElement("svg", {
    width: w,
    height: H,
    style: {
      display: "block",
      overflow: "visible"
    },
    role: "img",
    "aria-label": "กราฟ " + unit
  }, [0, 0.5, 1].map(f => React.createElement("g", {
    key: f
  }, React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: Y(max * f),
    y2: Y(max * f),
    style: {
      stroke: "var(--divider)",
      strokeWidth: 1
    }
  }), React.createElement("text", {
    x: padL - 7,
    y: Y(max * f) + 3.5,
    textAnchor: "end",
    style: {
      fill: "var(--text-3)",
      fontSize: 10,
      fontFamily: "var(--mono)"
    }
  }, fmtTick(max * f)))), React.createElement("text", {
    x: 0,
    y: 10,
    textAnchor: "start",
    style: {
      fill: "var(--text-3)",
      fontSize: 10,
      fontWeight: 700
    }
  }, unit), bars.map((b, i) => {
    const x = padL + step * i + (step - bw) / 2;
    const on = hov === i;
    if (b.value == null || b.value <= 0) return b.value == null ? null : React.createElement("line", {
      key: b.k,
      x1: x,
      x2: x + bw,
      y1: Y(0) - 1,
      y2: Y(0) - 1,
      style: {
        stroke: "var(--border-strong)",
        strokeWidth: 2
      }
    });
    const y = Y(b.value),
      yb = Y(0),
      r = Math.min(4, bw / 2, yb - y);
    return React.createElement("path", {
      key: b.k,
      d: "M" + x + "," + yb + "L" + x + "," + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y + "L" + (x + bw - r) + "," + y + "Q" + (x + bw) + "," + y + " " + (x + bw) + "," + (y + r) + "L" + (x + bw) + "," + yb + "Z",
      style: {
        fill: "var(--primary)",
        opacity: b.partial ? on ? 0.6 : 0.42 : hov != null && !on ? 0.55 : 1,
        transition: "opacity .12s"
      }
    });
  }), avg > 0 && React.createElement("g", null, React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: Y(avg),
    y2: Y(avg),
    style: {
      stroke: "var(--text-2)",
      strokeWidth: 1.2,
      strokeDasharray: "4 4"
    }
  }), React.createElement("text", {
    x: w - padR,
    y: Y(avg) - 5,
    textAnchor: "end",
    style: {
      fill: "var(--text-2)",
      fontSize: 10.5,
      fontWeight: 700
    }
  }, avgLabel || "เฉลี่ย", " ", fsFmt(avg, 1))), bars.map((b, i) => (i % every === 0 || i === bars.length - 1) && (bars.length - 1 - i >= every || i === bars.length - 1) ? React.createElement("text", {
    key: "l" + b.k,
    x: padL + step * i + step / 2,
    y: H - 7,
    textAnchor: "middle",
    style: {
      fill: hov === i ? "var(--text-1)" : "var(--text-3)",
      fontSize: 10,
      fontWeight: hov === i ? 700 : 500
    }
  }, b.label) : null), bars.map((b, i) => React.createElement("rect", {
    key: "h" + b.k,
    x: padL + step * i,
    y: padT,
    width: step,
    height: plotH + padB,
    style: {
      fill: "transparent",
      cursor: "default"
    },
    onMouseEnter: () => setHov(i),
    onTouchStart: () => setHov(i)
  }))), hb && React.createElement("div", {
    style: {
      position: "absolute",
      left: tipX,
      top: 0,
      transform: "translate(-50%, -6px)",
      pointerEvents: "none",
      background: "var(--surface)",
      boxShadow: "var(--shadow-pop)",
      borderRadius: "var(--r-tile)",
      padding: "7px 11px",
      fontSize: 11.5,
      whiteSpace: "nowrap",
      zIndex: 3
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700,
      color: "var(--text-1)",
      marginBottom: 2
    }
  }, hb.tip && hb.tip[0] || hb.label), React.createElement("div", {
    style: {
      color: "var(--text-1)",
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, hb.value == null ? "ไม่มีข้อมูล" : fsFmt(hb.value, 1) + " " + unit), (hb.tip || []).slice(1).map((t, i) => React.createElement("div", {
    key: i,
    style: {
      color: "var(--text-3)"
    }
  }, t))));
}
function FsSplitBar({
  title,
  total,
  parts,
  foot
}) {
  const sum = parts.reduce((s, p) => s + (p.value > 0 ? p.value : 0), 0) || 1;
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 7
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, title), total && React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, total)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      height: 14,
      borderRadius: 7,
      overflow: "hidden"
    }
  }, parts.filter(p => p.value > 0).map(p => React.createElement("div", {
    key: p.label,
    title: p.label + " " + fsFmt(p.value, 0) + " kWh",
    style: {
      width: p.value / sum * 100 + "%",
      background: p.color,
      minWidth: 3
    }
  }))), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px 18px",
      marginTop: 8
    }
  }, parts.map(p => React.createElement("div", {
    key: p.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      background: p.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, p.label), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, Math.round(Math.max(0, p.value) / sum * 100), "%"), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 11
    }
  }, fsEnergy(p.value).join(" "))))), foot && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 6
    }
  }, foot));
}
function FsMeter({
  value,
  max,
  tone,
  h
}) {
  const f = max > 0 && value != null ? Math.max(0, Math.min(1, value / max)) : 0;
  return React.createElement("div", {
    style: {
      height: h || 6,
      borderRadius: 4,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: f * 100 + "%",
      height: "100%",
      borderRadius: 4,
      background: tone || "var(--primary)",
      transition: "width .4s"
    }
  }));
}
function FsFlowNode({
  icon,
  label,
  value,
  sub,
  tone
}) {
  return React.createElement("div", {
    style: {
      flex: "1 1 130px",
      minWidth: 0,
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: "11px 13px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 13,
    color: tone || "var(--text-3)"
  }), label), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums",
      marginTop: 2
    }
  }, value), sub && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, sub));
}
const FsArrow = () => React.createElement("div", {
  style: {
    alignSelf: "center",
    color: "var(--text-3)",
    fontSize: 16,
    flexShrink: 0
  }
}, "\u2192");
function FsEnergyFlow({
  em
}) {
  const kw = v => v == null ? "–" : fsFmt(Math.abs(v), 2) + " kW";
  const g = em.gridKw;
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "stretch"
    }
  }, React.createElement(FsFlowNode, {
    icon: "sun",
    label: "\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E1C\u0E25\u0E34\u0E15",
    value: kw(em.pvKw),
    sub: em.cap && em.pvKw != null ? Math.round(em.pvKw / em.cap * 100) + "% ของ " + fsFmt(em.cap, 2) + " kWp" : null,
    tone: "var(--primary)"
  }), React.createElement(FsArrow, null), React.createElement(FsFlowNode, {
    icon: "home",
    label: "\u0E1A\u0E49\u0E32\u0E19/\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E43\u0E0A\u0E49",
    value: kw(em.loadKw),
    sub: em.loadKw != null && em.pvKw ? "มาจากโซลาร์ " + Math.round(Math.min(1, (em.pvKw - Math.max(0, g || 0) - Math.max(0, em.battKw || 0)) / Math.max(em.loadKw, 0.001)) * 100) + "%" : null
  }), React.createElement(FsFlowNode, {
    icon: "bolt",
    label: g == null ? "กริด" : g > 0.02 ? "ขายเข้ากริด" : g < -0.02 ? "ซื้อจากกริด" : "กริด (สมดุล)",
    value: kw(g),
    tone: g > 0.02 ? "var(--fs-exp)" : g < -0.02 ? "var(--fs-imp)" : null
  }), em.batt && React.createElement(FsFlowNode, {
    icon: "battery",
    label: em.battKw > 0.02 ? "แบตกำลังชาร์จ" : em.battKw < -0.02 ? "แบตกำลังจ่าย" : "แบตเตอรี่",
    value: em.soc != null ? em.soc + "%" : "–",
    sub: em.battKw != null ? kw(em.battKw) : null
  }));
}
function FsKv({
  k,
  keys,
  meter
}) {
  const list = (keys || Object.keys(k)).filter(x => k[x] != null && k[x] !== "" && k[x] !== "N/A");
  if (!list.length) return React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32\u0E08\u0E32\u0E01\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C");
  return React.createElement("div", {
    style: {
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      overflow: "hidden"
    }
  }, list.map((key, i) => {
    const lb = fsKpiLabel(key, meter);
    return React.createElement("div", {
      key: key,
      style: {
        display: "flex",
        gap: 10,
        padding: "6px 11px",
        fontSize: 12,
        borderTop: i ? "1px solid var(--divider)" : "none",
        alignItems: "baseline"
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        color: "var(--text-2)",
        minWidth: 0
      }
    }, lb ? lb[0] : key, lb && React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 10,
        color: "var(--text-3)",
        marginLeft: 6
      }
    }, key)), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        color: "var(--text-1)",
        fontWeight: 700,
        textAlign: "right"
      }
    }, fsKpiValue(key, k[key]), lb && lb[1] && fsN(k[key]) != null && !FS_ENUMS[key] ? " " + lb[1] : ""));
  }));
}
function FsRawToggle({
  k,
  meter
}) {
  const [open, setOpen] = React.useState(false);
  if (!Object.keys(k).length) return null;
  return React.createElement("div", {
    style: {
      marginTop: 9
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => setOpen(!open),
    style: {
      border: "none",
      background: "transparent",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--primary)"
    }
  }, open ? "ซ่อนค่าทั้งหมด" : "ดูค่าทั้งหมดจากอุปกรณ์ (" + Object.keys(k).length + ")"), open && React.createElement("div", {
    className: "fs-in",
    style: {
      marginTop: 9
    }
  }, window.FsKvGroups ? React.createElement(window.FsKvGroups, {
    k: k,
    meter: meter
  }) : React.createElement(FsKv, {
    k: k,
    meter: meter
  })));
}
function FsTile({
  label,
  value,
  unit,
  sub,
  tone
}) {
  return React.createElement("div", {
    style: {
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      borderRadius: "var(--r-tile)",
      padding: "9px 12px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, label), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: tone || "var(--text-1)",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, value, unit && value !== "–" && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 4
    }
  }, unit)), sub && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, sub));
}
const FS_TONE = {
  ok: ["var(--tint-ok-tx)", "var(--tint-ok-bg)"],
  info: ["var(--tint-amber-tx)", "var(--tint-amber-bg)"],
  idle: ["var(--text-2)", "var(--surface3)"],
  bad: ["var(--tint-red-tx)", "var(--tint-red-bg)"]
};
function FsChip({
  tone,
  children
}) {
  const t = FS_TONE[tone] || FS_TONE.idle;
  return React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: "var(--r-pill)",
      color: t[0],
      background: t[1],
      whiteSpace: "nowrap"
    }
  }, children);
}
function FsInvStage({
  d,
  k,
  size
}) {
  const st = fsInvState(fsN(k.inverter_state));
  const led = !st ? "var(--text-3)" : st[1] === "ok" ? "#2FB36B" : st[1] === "bad" ? "#E5484D" : "#F5A524";
  const huawei = /^SUN[25]000/i.test(d.model || "");
  const dark = document.documentElement.getAttribute("data-theme") === "aurora";
  return React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0,
      borderRadius: 18,
      overflow: "hidden",
      background: "transparent"
    }
  }, huawei ? React.createElement("img", {
    src: "dashboard/assets/pkg-inv-huawei.jpg",
    alt: "",
    loading: "lazy",
    style: {
      position: "absolute",
      inset: "6%",
      width: "88%",
      height: "88%",
      objectFit: "contain",
      mixBlendMode: dark ? "normal" : "multiply",
      borderRadius: dark ? 12 : 0
    }
  }) : React.createElement("svg", {
    viewBox: "0 0 100 100",
    style: {
      position: "absolute",
      inset: "14%",
      width: "72%",
      height: "72%"
    },
    "aria-hidden": "true"
  }, React.createElement("rect", {
    x: "18",
    y: "10",
    width: "64",
    height: "78",
    rx: "9",
    fill: "#fff",
    stroke: "#D8D5CC",
    strokeWidth: "1.5"
  }), React.createElement("rect", {
    x: "80",
    y: "20",
    width: "6",
    height: "58",
    rx: "2",
    fill: "#C9C6BD"
  }), React.createElement("rect", {
    x: "36",
    y: "38",
    width: "28",
    height: "15",
    rx: "5",
    fill: "#1E2326"
  }), React.createElement("circle", {
    cx: "50",
    cy: "45.5",
    r: "2.2",
    fill: led
  }), React.createElement("rect", {
    x: "30",
    y: "88",
    width: "5",
    height: "6",
    rx: "1",
    fill: "#55595C"
  }), React.createElement("rect", {
    x: "40",
    y: "88",
    width: "5",
    height: "6",
    rx: "1",
    fill: "#55595C"
  }), React.createElement("rect", {
    x: "58",
    y: "88",
    width: "5",
    height: "6",
    rx: "1",
    fill: "#55595C"
  })), React.createElement("span", {
    style: {
      position: "absolute",
      top: 10,
      left: 10,
      display: "flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 8px 3px 6px",
      borderRadius: 999,
      background: "rgba(255,255,255,.85)",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#2B3336"
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 4,
      background: led,
      boxShadow: "0 0 0 3px color-mix(in srgb, " + led + " 22%, transparent)"
    }
  }), st ? st[0] : "ไม่ทราบสถานะ"));
}
function FsInverterBody({
  d,
  k,
  isMobile
}) {
  const rated = fsRatedKw(d.model);
  const p = fsN(k.active_power);
  const pct = rated && p != null ? Math.max(0, Math.min(100, p / rated * 100)) : null;
  const strs = fsStrings(k);
  const grid = k.ab_u != null ? [fsFmt(k.ab_u, 0), fsFmt(k.bc_u, 0), fsFmt(k.ca_u, 0)].join(" / ") : fsFmt(k.a_u, 1);
  const cur = k.b_i != null ? [fsFmt(k.a_i, 1), fsFmt(k.b_i, 1), fsFmt(k.c_i, 1)].join(" / ") : fsFmt(k.a_i, 1);
  const hot = fsN(k.temperature) >= 75;
  const tot = fsEnergy(k.total_cap);
  const big = [{
    icon: "sun",
    l: "ผลิตวันนี้",
    v: fsFmt(k.day_cap, 1),
    u: "kWh"
  }, {
    icon: "trend",
    l: "ผลิตสะสม",
    v: tot[0],
    u: tot[1]
  }, {
    icon: "bolt",
    l: "ประสิทธิภาพ",
    v: fsFmt(k.efficiency, 1),
    u: "%"
  }];
  const small = [[k.ab_u != null ? "แรงดันกริด AB/BC/CA" : "แรงดันกริด", grid, "V"], [k.b_i != null ? "กระแส A/B/C" : "กระแสกริด", cur, "A"], ["ความถี่ · PF", +k.elec_freq > 0 ? fsFmt(k.elec_freq, 2) + " Hz · " + fsFmt(k.power_factor, 3) : "–", ""], ["อุณหภูมิภายใน", fsFmt(k.temperature, 1), "°C", hot], ["เริ่มทำงานวันนี้", fsKpiValue("open_time", k.open_time), ""]];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: isMobile ? 12 : 18,
      alignItems: "stretch",
      flexDirection: isMobile ? "column" : "row"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, React.createElement(FsInvStage, {
    d: d,
    k: k,
    size: isMobile ? 150 : 168
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 12
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1C\u0E25\u0E34\u0E15\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.1,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, fsFmt(p, 2)), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "kW"), rated && React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, React.createElement("b", {
    style: {
      color: "var(--fs-sun)",
      fontSize: 13
    }
  }, pct == null ? "–" : Math.round(pct) + "%"), " \u0E02\u0E2D\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14 ", rated, " kW")), rated && React.createElement("div", {
    style: {
      height: 14,
      padding: 3,
      marginTop: 7,
      borderRadius: 999,
      background: "color-mix(in srgb, var(--fs-sun) 9%, var(--surface2))",
      boxShadow: "var(--shadow-inset)"
    }
  }, React.createElement("div", {
    className: "fs-wide",
    style: {
      width: Math.max(pct || 0, pct ? 3 : 0) + "%",
      height: "100%",
      borderRadius: 999,
      background: "linear-gradient(90deg, var(--fs-sun), color-mix(in srgb, var(--fs-sun) 72%, #FFD27A))",
      boxShadow: "0 3px 10px color-mix(in srgb, var(--fs-sun) 45%, transparent)"
    }
  }))), React.createElement("div", {
    className: "kpi-grid",
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, minmax(0, 1fr))",
      gap: isMobile ? 10 : 0
    }
  }, big.map((x, i) => React.createElement("div", {
    key: x.l,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      minWidth: 0,
      padding: isMobile || !i ? 0 : "0 0 0 14px",
      boxShadow: !isMobile && i ? "inset 1px 0 0 var(--divider)" : "none"
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: "color-mix(in srgb, var(--fs-sun) 15%, var(--surface))"
    }
  }, React.createElement(Icon, {
    name: x.icon,
    size: 15,
    color: "var(--fs-sun)"
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, x.l), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 18,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums"
    }
  }, x.v, x.v !== "–" && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, x.u)))))))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, minmax(0, 1fr))",
      gap: 8,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      borderRadius: "var(--r-tile)",
      padding: "10px 12px"
    }
  }, small.map(x => React.createElement("div", {
    key: x[0],
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, x[0]), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: x[3] ? "var(--tint-amber-tx)" : "var(--text-1)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums"
    }
  }, x[1], x[2] && x[1] !== "–" && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, x[2]))))), strs.length > 0 && window.FsStringGrid && React.createElement(window.FsStringGrid, {
    strs: strs
  }), React.createElement(FsRawToggle, {
    k: k
  }));
}
function FsDevStats({
  items,
  isMobile
}) {
  return React.createElement("div", {
    className: "kpi-grid",
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(" + items.length + ", minmax(0, 1fr))",
      gap: isMobile ? 10 : 0
    }
  }, items.map((x, i) => React.createElement("div", {
    key: x.l,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      minWidth: 0,
      padding: isMobile || !i ? 0 : "0 0 0 14px",
      boxShadow: !isMobile && i ? "inset 1px 0 0 var(--divider)" : "none"
    }
  }, React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 999,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: "color-mix(in srgb, " + (x.c || "var(--fs-sun)") + " 15%, var(--surface))"
    }
  }, React.createElement(Icon, {
    name: x.icon,
    size: 15,
    color: x.c || "var(--fs-sun)"
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, x.l), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 18,
      fontWeight: 700,
      color: x.tone || "var(--text-1)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums"
    }
  }, x.v, x.u && x.v !== "–" && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, x.u))))));
}
function FsDevInset({
  items,
  isMobile
}) {
  const list = items.filter(Boolean);
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(" + Math.min(5, list.length) + ", minmax(0, 1fr))",
      gap: 8,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      borderRadius: "var(--r-tile)",
      padding: "10px 12px"
    }
  }, list.map(x => React.createElement("div", {
    key: x[0],
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, x[0]), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: x[3] || "var(--text-1)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums"
    }
  }, x[1], x[2] && x[1] !== "–" && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, x[2])))));
}
function FsLed({
  color,
  children
}) {
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 4,
      background: color,
      boxShadow: "0 0 0 3px color-mix(in srgb, " + color + " 22%, transparent)"
    }
  }), children);
}
function FsMeterBody({
  d,
  k,
  em,
  isMobile
}) {
  const g = em && em.meter === d ? em.gridKw : null;
  const ph3u = fsN(k.meter_u) == null && fsN(k.a_u) != null,
    ph3i = fsN(k.meter_i) == null && fsN(k.a_i) != null;
  const kw = g != null ? Math.abs(g) : fsKw(k.active_power, null, true);
  const dir = g == null ? "none" : g > 0.02 ? "exp" : g < -0.02 ? "imp" : "zero";
  const head = {
    exp: "กำลังขายเข้ากริด",
    imp: "กำลังซื้อจากกริด",
    zero: "ไม่ได้ซื้อ/ขายไฟ",
    none: "กำลังที่จุดมิเตอร์"
  }[dir];
  const dirC = dir === "exp" ? "var(--fs-sun)" : dir === "imp" ? "var(--text-1)" : "var(--text-3)";
  const st = k.meter_status != null ? k.meter_status : k.run_state;
  const ok = st == null ? null : +st === 1;
  const imp = em && em.importTotal != null ? fsEnergy(em.importTotal) : ["–", ""];
  const exp = em && em.exportTotal != null ? fsEnergy(em.exportTotal) : ["–", ""];
  const size = isMobile ? 120 : 140;
  const dark = document.documentElement.getAttribute("data-theme") === "aurora";
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: isMobile ? 12 : 18,
      alignItems: "center",
      flexDirection: isMobile ? "column" : "row"
    }
  }, !d.isc_ps_key ? React.createElement("img", {
    src: "dashboard/assets/pkg-meter-huawei.jpg",
    alt: "",
    loading: "lazy",
    style: {
      width: size,
      height: size,
      objectFit: "contain",
      flexShrink: 0,
      mixBlendMode: dark ? "normal" : "multiply",
      borderRadius: dark ? 12 : 0
    }
  }) : React.createElement("svg", {
    viewBox: "0 0 100 100",
    width: size,
    height: size,
    style: {
      flexShrink: 0
    },
    "aria-hidden": "true"
  }, React.createElement("rect", {
    x: "24",
    y: "8",
    width: "52",
    height: "80",
    rx: "8",
    style: {
      fill: "var(--surface)",
      stroke: "var(--border-strong)",
      strokeWidth: 1.5
    }
  }), React.createElement("rect", {
    x: "31",
    y: "17",
    width: "38",
    height: "20",
    rx: "3",
    style: {
      fill: "#1E2A2E"
    }
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: isMobile ? "100%" : "auto"
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, head), ok != null && React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, React.createElement(FsLed, {
    color: ok ? "#2FB36B" : "#E5484D"
  }, fsKpiValue("meter_status", st)))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.1,
      color: dirC,
      fontVariantNumeric: "tabular-nums"
    }
  }, fsFmt(kw, 2)), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "kW"), (dir === "exp" || dir === "imp") && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, dir === "exp" ? "บ้าน → กริด" : "กริด → บ้าน"))), React.createElement(FsDevStats, {
    isMobile: isMobile,
    items: [{
      icon: "home",
      l: "ซื้อจากกริดสะสม",
      v: imp[0],
      u: imp[1],
      c: "var(--text-2)"
    }, {
      icon: "sun",
      l: "ขายเข้ากริดสะสม",
      v: exp[0],
      u: exp[1]
    }]
  }))), React.createElement(FsDevInset, {
    isMobile: isMobile,
    items: [[ph3u ? "แรงดัน A/B/C" : "แรงดัน", ph3u ? [k.a_u, k.b_u, k.c_u].map(v => fsFmt(v, 0)).join(" / ") : fsFmt(k.meter_u, 1), "V"], [ph3i ? "กระแส A/B/C" : "กระแส", ph3i ? [k.a_i, k.b_i, k.c_i].map(v => fsFmt(fsN(v) != null ? Math.abs(v) : null, 0)).join(" / ") : fsFmt(fsN(k.meter_i) != null ? Math.abs(k.meter_i) : null, 2), "A"], fsN(k.grid_frequency) != null ? ["ความถี่", fsFmt(k.grid_frequency, 2), "Hz"] : null, ["ตัวประกอบกำลัง", fsFmt(k.power_factor, 3), ""]]
  }), React.createElement(FsRawToggle, {
    k: k,
    meter: true
  }));
}
function FsBatteryBody({
  k,
  em,
  isMobile,
  d
}) {
  const soc = fsN(k.battery_soc),
    pw = em && em.battKw != null ? em.battKw : fsKw(k.ch_discharge_power, null, true);
  const low = soc != null && soc < 15;
  const bs = +k.battery_status;
  const led = bs === 3 ? "#E5484D" : bs === 2 ? "#2FB36B" : "#9AA5A7";
  const huawei = /LUNA|^ESS|huawei/i.test(d && d.model || "") || !(d && d.model);
  const act = pw == null ? "–" : pw > 0.02 ? "กำลังชาร์จ" : pw < -0.02 ? "กำลังจ่ายไฟ" : "พัก (ไม่ชาร์จ/จ่าย)";
  const size = isMobile ? 120 : 132;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: isMobile ? 12 : 18,
      alignItems: "center",
      flexDirection: isMobile ? "column" : "row"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      flexShrink: 0
    }
  }, huawei ? React.createElement("img", {
    src: "dashboard/assets/pkg-batt-huawei-1.png",
    alt: "",
    loading: "lazy",
    style: {
      position: "absolute",
      inset: "8%",
      width: "84%",
      height: "84%",
      objectFit: "contain"
    }
  }) : React.createElement("svg", {
    viewBox: "0 0 100 100",
    style: {
      position: "absolute",
      inset: 0
    },
    "aria-hidden": "true"
  }, React.createElement("rect", {
    x: "20",
    y: "16",
    width: "60",
    height: "70",
    rx: "8",
    style: {
      fill: "var(--surface)",
      stroke: "var(--border-strong)",
      strokeWidth: 1.5
    }
  }), React.createElement("rect", {
    x: "38",
    y: "24",
    width: "24",
    height: "7",
    rx: "3.5",
    style: {
      fill: "var(--surface2)"
    }
  }))), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: isMobile ? "100%" : "auto"
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E23\u0E30\u0E08\u0E38\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D"), k.battery_status != null && React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, React.createElement(FsLed, {
    color: led
  }, fsKpiValue("battery_status", k.battery_status)))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.1,
      color: low ? "var(--tint-red-tx)" : "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, soc == null ? "–" : fsFmt(soc, 0)), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, "%"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, act, pw != null && Math.abs(pw) > 0.02 && React.createElement("b", {
    style: {
      color: "var(--fs-sun)",
      marginLeft: 5
    }
  }, fsFmt(Math.abs(pw), 2), " kW"))), React.createElement("div", {
    style: {
      height: 16,
      padding: 3,
      marginTop: 7,
      borderRadius: 999,
      background: "color-mix(in srgb, var(--fs-sun) 9%, var(--surface2))",
      boxShadow: "var(--shadow-inset)"
    }
  }, React.createElement("div", {
    className: "fs-wide",
    style: {
      width: Math.max(0, Math.min(100, soc || 0)) + "%",
      height: "100%",
      borderRadius: 999,
      background: low ? "var(--tint-red-tx)" : "linear-gradient(90deg, var(--fs-sun), color-mix(in srgb, var(--fs-sun) 72%, #FFD27A))",
      boxShadow: low ? "none" : "0 3px 10px color-mix(in srgb, var(--fs-sun) 45%, transparent)"
    }
  }))), React.createElement(FsDevStats, {
    isMobile: isMobile,
    items: [{
      icon: "trend",
      l: "ชาร์จสะสม",
      v: fsFmt(k.charge_cap, 0),
      u: "kWh"
    }, {
      icon: "bolt",
      l: "จ่ายไฟสะสม",
      v: fsFmt(k.discharge_cap, 0),
      u: "kWh"
    }, {
      icon: "sparkle",
      l: "สุขภาพแบต (SOH)",
      v: +k.battery_soh > 0 ? fsFmt(k.battery_soh, 0) : "–",
      u: "%"
    }]
  }))), React.createElement(FsDevInset, {
    isMobile: isMobile,
    items: [["โหมดการทำงาน", fsKpiValue("ch_discharge_model", k.ch_discharge_model), ""], fsN(k.max_charge_power) != null ? ["ชาร์จได้สูงสุด", fsFmt(fsKw(k.max_charge_power, null, true), 2), "kW"] : null, fsN(k.max_discharge_power) != null ? ["จ่ายได้สูงสุด", fsFmt(fsKw(k.max_discharge_power, null, true), 2), "kW"] : null]
  }), React.createElement(FsRawToggle, {
    k: k
  }));
}
Object.assign(window, {
  fsN,
  fsFmt,
  fsEnergy,
  fsBkk,
  fsDayTH,
  fsMonTH,
  fsMedian,
  FS_GRID_EF,
  fsInvState,
  fsStrings,
  fsStrUsed,
  fsProvince,
  fsPR,
  FS_PSH,
  fsEnergyModel,
  fsSiteIssues,
  fsMonthYield,
  FsBarChart,
  FsSplitBar,
  FsMeter,
  FsEnergyFlow,
  FsKv,
  FsTile,
  FsChip,
  FsInverterBody,
  FsMeterBody,
  FsBatteryBody
});