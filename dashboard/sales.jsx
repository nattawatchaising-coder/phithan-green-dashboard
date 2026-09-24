/* ============================================================
   flash+solar — งานฝ่ายขาย (เซลล์)

   ลูกค้าสำรวจ (surveyLeads) = วัตถุงานของเซลล์ · งานติดตั้ง (jobs) = หลังปิดการขาย
   ไฟล์นี้เก็บ: ขั้นการขาย · ใบเสนอราคา · บอร์ดขาย · ยอดขาย · บล็อกสรุปในใบงาน
   ============================================================ */

/* อ่านแบบ 3D ที่บันทึกไว้ — plan3d.js โหลดก่อนไฟล์นี้เสมอ (ดูลำดับ script ใน index.html)
   ผูกตอนโหลดไฟล์ ไม่เช็คตอนเรนเดอร์ เพราะ hook ต้องถูกเรียกทุกครั้งเท่ากัน */
const useQuotePlan3d = window.usePlan3d || (() => ({ saved: null, loading: false, save: () => {} }));

/* ── ขั้นการขาย ──
   เดิมลูกค้าสำรวจมีแค่ 3 สถานะ (open/won/lost) ซึ่งบอกได้แค่ "จบแล้วหรือยัง"
   ไม่ได้บอกว่าค้างอยู่ตรงไหน — เซลล์เลยไม่รู้ว่าวันนี้ต้องไปดันงานไหนต่อ
   ขั้นใหม่เก็บที่ฟิลด์ sstage แยกจาก status เดิม เรคอร์ดเก่าจึงไม่ต้องแก้อะไรเลย */
const SALES_STAGES = [
  { key: "new",     th: "ลูกค้าใหม่",           color: "#0EA5E9", soft: "#0EA5E914" },
  { key: "contact", th: "ติดต่อแล้ว",            color: "#8B5CF6", soft: "#8B5CF614" },
  { key: "survey",  th: "นัดสำรวจ",              color: "#F59E0B", soft: "var(--tint-amber-bg)" },
  { key: "quoted",  th: "เสนอราคาแล้ว",          color: "#EC4899", soft: "#EC489914" },
  { key: "nego",    th: "ต่อรอง / รอตัดสินใจ",   color: "#EAB308", soft: "#EAB30814" },
  { key: "won",     th: "ปิดการขาย",             color: "#10B981", soft: "var(--primary-soft)" },
  { key: "lost",    th: "ไม่ติดตั้ง",             color: "#94A3B8", soft: "var(--surface2)" },
];
const SALES_BY = {}; SALES_STAGES.forEach((s) => { SALES_BY[s.key] = s; });

/* ขั้นของลูกค้าหนึ่งราย — เรคอร์ดเก่าที่ยังไม่มี sstage ให้เดาจาก status เดิม
   (won/lost มีความหมายชัดอยู่แล้ว · ที่เหลือถือเป็นลูกค้าใหม่ที่ยังไม่มีใครแตะ) */
function salesStageKey(l) {
  if (!l) return "new";
  if (l.sstage && SALES_BY[l.sstage]) return l.sstage;
  const st = l.status || "open";
  return st === "won" ? "won" : st === "lost" ? "lost" : "new";
}
function salesStageOf(key) { return SALES_BY[key] || SALES_BY.new; }

/* เดินไปขั้นไหนก็ได้ (งานขายไม่ได้เดินเป็นเส้นตรงเหมือนงานเอกสาร ลูกค้าถอยกลับมาต่อรองใหม่ได้เสมอ)
   แต่ยังเก็บ "ถอย 1 ขั้น" ไว้ให้ปุ่มย้อนกลับใช้ */
const SALES_BACK = { contact: "new", survey: "contact", quoted: "survey", nego: "quoted", won: "nego", lost: "nego" };

/* status เดิมยังต้องถูกต้องอยู่ เพราะ convertLead / ตัวกรองเก่า / โค้ดอื่นอ่านช่องนี้
   ทุกครั้งที่เดินขั้น จึงเขียน status เป็นยอดรวมหยาบคู่ไปด้วย */
function salesStagePatch(key) {
  return { sstage: key, status: key === "won" ? "won" : key === "lost" ? "lost" : "open" };
}

const LEAD_SOURCES = [
  { key: "facebook", th: "Facebook" },
  { key: "line",     th: "LINE / OA" },
  { key: "referral", th: "ลูกค้าแนะนำ" },
  { key: "walkin",   th: "เดินเข้ามาเอง" },
  { key: "phone",    th: "โทรเข้ามา" },
  { key: "event",    th: "ออกบูธ / งานแสดงสินค้า" },
  { key: "other",    th: "อื่น ๆ" },
];
const LEAD_SOURCE_TH = (k) => (LEAD_SOURCES.find((x) => x.key === k) || {}).th || "";

const CONTACT_WAYS = [
  { key: "call",  th: "โทร",       icon: "phone" },
  { key: "line",  th: "แชต / LINE", icon: "message" },
  { key: "visit", th: "เข้าพบ",     icon: "pin" },
  { key: "other", th: "อื่น ๆ",     icon: "list" },
];

const sPad2 = (n) => (n < 10 ? "0" : "") + n;
/* วันที่ตามเวลาไทย ไม่ใช่ UTC — toISOString() จะเพี้ยนไป 1 วันช่วงเที่ยงคืนถึงเจ็ดโมงเช้า */
const sToday10 = () => { const d = new Date(); return d.getFullYear() + "-" + sPad2(d.getMonth() + 1) + "-" + sPad2(d.getDate()); };
/* เดือนของเวลาที่บันทึกไว้ (ISO หรือ timestamp) เทียบตามเวลาไทย → "YYYY-MM" */
const sMonthKey = (v) => {
  if (v == null || v === "") return "";
  const d = new Date(typeof v === "number" ? v : String(v));
  if (isNaN(d.getTime())) return String(v).slice(0, 7);
  return d.getFullYear() + "-" + sPad2(d.getMonth() + 1);
};
/* จำนวนเงินแบบเต็ม — ตัวเลขบนใบเสนอราคาย่อไม่ได้ ลูกค้าต้องอ่านได้ตรงตัว */
const sBaht = (n) => (Math.round((+n || 0) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const sEsc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
/* วันที่เลยกำหนดไหม — ใช้กับวันติดตามครั้งถัดไป */
const sOverdue = (d) => !!d && String(d) < sToday10();

/* ============================================================
   ใบเสนอราคา
   ============================================================ */
const QUOTE_STATUS = [
  { key: "draft",    th: "ร่าง",         color: "#94A3B8" },
  { key: "sent",     th: "ส่งให้ลูกค้าแล้ว", color: "#0EA5E9" },
  { key: "accepted", th: "ลูกค้าตกลง",    color: "#10B981" },
  { key: "rejected", th: "ลูกค้าไม่เอา",   color: "#EF4444" },
];
const QUOTE_STATUS_BY = {}; QUOTE_STATUS.forEach((s) => { QUOTE_STATUS_BY[s.key] = s; });

const QUOTE_TERMS_DEF = [
  "งวดที่ 1 · มัดจำ 50% เมื่อตกลงทำสัญญา",
  "งวดที่ 2 · 40% เมื่อของถึงหน้างานและเริ่มติดตั้ง",
  "งวดที่ 3 · 10% เมื่อติดตั้งเสร็จและทดสอบระบบเรียบร้อย",
];
const QUOTE_WARRANTY_DEF = [
  "รับประกันงานติดตั้ง 5 ปี",
  "รับประกันแผงโซลาร์เซลล์ 15 ปี",
  "รับประกันอินเวอร์เตอร์ 5 ปี",
  "ฟรีล้างแผงโซลาร์เซลล์ 3 ครั้ง",
  "สำรวจหน้างานก่อนติดตั้งฟรี",
];

/* ── แผ่นที่จะออกไปกับใบเสนอราคา ──
   ชุดเอกสารเต็มของงานโครงการมีหลายแผ่น (หน้าปก · ใบเสนอราคา · BOQ · ตารางรับประกัน ·
   ตารางคืนทุน 30 ปี · สรุปผลตอบแทน · DATA SHEET) แต่ไม่ใช่ทุกงานต้องส่งครบ
   งานบ้านหลังเล็กส่งแค่ใบเสนอราคาก็จบ · งานโรงงานลูกค้าขอทั้งเล่มไปเข้าที่ประชุม
   จึงติ๊กเลือกเป็นแผ่น ๆ ได้ แล้วเก็บไว้ที่ตัวใบ (q.pages) ไม่ใช่ตั้งค่ารวมของระบบ
   — ใบหนึ่งใบส่งซ้ำอีกรอบต้องได้ชุดเดิมเสมอ */
const QUOTE_PAGES = [
  { key: "cover",   th: "หน้าปก",                   hint: "ชื่อลูกค้า · ขนาดระบบ · เลขที่ใบ" },
  { key: "quote",   th: "ใบเสนอราคา",                hint: "แผ่นหลัก · ปิดไม่ได้", lock: true },
  { key: "terms",   th: "เงื่อนไขชำระเงิน & รับประกัน", hint: "แนบท้ายใบเสนอราคา" },
  { key: "boq",     th: "BOQ รายการงาน",             hint: "ขอบเขตงานเป็นข้อ ๆ พร้อมช่องเซ็น" },
  { key: "wty",     th: "ตารางรับประกันอุปกรณ์",       hint: "อุปกรณ์ทีละรายการ · กี่ปี" },
  { key: "cash",    th: "ตารางคืนทุน 30 ปี",           hint: "ผลิตไฟ · ค่าไฟที่ประหยัด · ยอดสะสม" },
  { key: "payback", th: "สรุปผลตอบแทน",               hint: "ระยะเวลาคืนทุน · กำไรตลอดอายุ" },
  { key: "sheets",  th: "DATA SHEET ที่แนบ",          hint: "สเปกแผง/อินเวอร์เตอร์จากคลัง" },
];
/* ใบเก่าที่ทำไว้ก่อนมีระบบนี้ไม่มีช่อง pages — ต้องออกเหมือนเดิมเป๊ะ ๆ
   (ใบเสนอราคา + แผ่นเงื่อนไข + DATA SHEET) ไม่ใช่มีแผ่นใหม่โผล่เองในใบที่ส่งลูกค้าไปแล้ว */
const QUOTE_PAGES_LEGACY = { quote: true, terms: true, sheets: true };
const quotePagesAll = () => { const o = {}; QUOTE_PAGES.forEach((p) => { o[p.key] = true; }); return o; };
function quotePageOn(q, key) {
  if (key === "quote") return true;
  const p = q && q.pages;
  return !!(p && typeof p === "object" ? p[key] : QUOTE_PAGES_LEGACY[key]);
}

/* ── ตัวเลขที่ใช้คิดคืนทุน ──
   สมมุติฐานเดียวกับที่ทีมขายใช้คิดในเอกสารเดิม เก็บไว้ที่ตัวใบด้วย
   ใบที่ส่งไปแล้วจะได้ออกตัวเลขเดิมตลอด แม้ภายหลังจะปรับค่าตั้งต้นของระบบ
   · sun      ชั่วโมงแดดเฉลี่ยต่อวัน (kWh/m²/วัน)
   · pr       Performance Ratio ของระบบ — แดดที่ได้กลายเป็นไฟจริงกี่ %
              ค่าตั้งต้น 73.5% คือค่าที่ทำให้ได้ 3.60 ชม./วัน เท่ากับเอกสารที่ทีมขายใช้คุยกับลูกค้ามาตลอด
              (แดด 4.9 ชม. × 73.5% ≈ 3.60 ชม.) ตัวเลขในใบใหม่จะได้เทียบกับใบเก่าได้
   · onPct    สัดส่วนหน่วยที่ผลิตได้ช่วง On Peak
   · ft       ค่า FT ปัจจุบัน บวกเข้ากับค่าพลังงาน
   · up       ค่าไฟขึ้นกี่ % · upEvery ขึ้นทุกกี่ปี (เอกสารเดิมขยับทุก 10 ปี)
   · deg1/deg ประสิทธิภาพแผงลดลงปีแรก / ปีถัด ๆ ไป
   · om       ค่าดูแลรักษาต่อปี (หักออกจากเงินที่ประหยัดได้) */
const QUOTE_ROI_DEF = { sun: 4.9, pr: 73.5, days: 365, onPct: 70, priceOn: 4.583, priceOff: 4.583,
  ft: 0.1623, up: 1, upEvery: 10, deg1: 1, deg: 0.35, years: 30, om: 0 };
const QUOTE_ROI_FLD = [
  { key: "sun",      th: "ชั่วโมงแดดเฉลี่ย",      unit: "ชม./วัน" },
  { key: "pr",       th: "Performance Ratio",    unit: "%" },
  { key: "days",     th: "จำนวนวันที่ผลิตไฟ",      unit: "วัน/ปี" },
  { key: "priceOn",  th: "ค่าพลังงาน On Peak",    unit: "฿/หน่วย" },
  { key: "priceOff", th: "ค่าพลังงาน Off Peak",   unit: "฿/หน่วย" },
  { key: "onPct",    th: "สัดส่วน On Peak",       unit: "%" },
  { key: "ft",       th: "ค่า FT",               unit: "฿/หน่วย" },
  { key: "up",       th: "ค่าไฟขึ้น",             unit: "%" },
  { key: "upEvery",  th: "ขึ้นทุก",               unit: "ปี" },
  { key: "deg1",     th: "แผงเสื่อมปีแรก",         unit: "%" },
  { key: "deg",      th: "แผงเสื่อมปีถัดไป",       unit: "%/ปี" },
  { key: "om",       th: "ค่าดูแลรักษา",           unit: "฿/ปี" },
  { key: "years",    th: "คิดผลตอบแทน",           unit: "ปี" },
];
function quoteRoiCfg(q) {
  const src = (q && q.roi) || {};
  const o = {};
  Object.keys(QUOTE_ROI_DEF).forEach((k) => {
    const v = src[k];
    o[k] = (v === "" || v == null || isNaN(+v)) ? QUOTE_ROI_DEF[k] : +v;
  });
  o.years = Math.min(Math.max(1, Math.round(o.years)), 40);
  return o;
}
/* ตารางคืนทุนของใบนี้ — เงินลงทุนใช้ราคาก่อน VAT (หลังหักส่วนลด)
   เพราะลูกค้านิติบุคคลขอ VAT คืนได้ จำนวนที่จมจริงคือยอดก่อนภาษี
   เงินที่ประหยัด = หน่วยที่ผลิตได้ × ค่าไฟ ณ ปีนั้น − ค่าดูแลรักษา */
function quoteRoi(q) {
  const c = quoteRoiCfg(q);
  const T = quoteTotals(q);
  const kwp = +(q && q.kwp) || 0;
  const invest = T.afterDisc;
  const hrs = c.sun * c.pr / 100;
  const dayKwh = kwp * hrs;
  const yearKwh = dayKwh * c.days;
  const rows = [];
  let eff = 1, cum = 0;
  for (let y = 1; y <= c.years; y++) {
    eff -= (y === 1 ? c.deg1 : c.deg) / 100;
    if (eff < 0) eff = 0;
    /* ค่าไฟขึ้นเป็นขั้น ๆ ตามรอบปีที่ตั้งไว้ ไม่ใช่ขึ้นทุกปีแบบทบต้น
       — เอกสารที่ใช้คุยกับลูกค้ามาตลอดคิดแบบนี้ ตัวเลขจะได้ตรงกับใบเก่า */
    const step = c.upEvery > 0 ? Math.floor(y / c.upEvery) : 0;
    const mul = Math.pow(1 + c.up / 100, step);
    const pOn = (c.priceOn + c.ft) * mul, pOff = (c.priceOff + c.ft) * mul;
    const prod = yearKwh * eff;
    const on = prod * c.onPct / 100, off = prod - on;
    const save = on * pOn + off * pOff - c.om;
    cum += save;
    rows.push({ y: y, eff: eff, prod: prod, on: on, off: off, price: pOn, save: save, cum: cum });
  }
  const tot = rows.reduce((a, r) => ({ prod: a.prod + r.prod, save: a.save + r.save }), { prod: 0, save: 0 });
  /* จุดคืนทุน — ปีที่ยอดสะสมแซงเงินลงทุน แล้วเกลี่ยเศษเป็นเดือนจากเงินที่ประหยัดได้ปีนั้น */
  let pb = null;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].cum >= invest && invest > 0) {
      const prev = i ? rows[i - 1].cum : 0;
      const m = rows[i].save > 0 ? Math.ceil((invest - prev) / rows[i].save * 12) : 12;
      pb = { y: rows[i].y - 1 + Math.floor(m / 12), m: m % 12 };
      break;
    }
  }
  const first = rows[0] || { save: 0, prod: 0 };
  return { cfg: c, kwp: kwp, invest: invest, perW: kwp > 0 ? invest / (kwp * 1000) : 0,
    hrs: hrs, dayKwh: dayKwh, yearKwh: yearKwh, rows: rows, total: tot,
    payback: pb, month1: first.save / 12, day1: first.save / c.days, profit: tot.save - invest };
}

/* ── รายการตั้งต้นของแผ่น BOQ ──
   ไม่ได้ดึงจาก BOQ ของช่างที่ถอดของทีละน็อต (เป็นร้อยบรรทัด + มีราคาทุนอยู่ในนั้น)
   แผ่นนี้คือ "ขอบเขตงานที่ลูกค้าจะได้" จึงเป็นรายการระดับหัวข้อ แก้เพิ่มลดเองได้ */
function quoteBoqSeed(t) {
  const sp = quoteSpec(t || {});
  const r = [];
  r.push({ name: "งานออกแบบระบบไฟฟ้าโซลาร์เซลล์ และดำเนินการขออนุญาตที่เกี่ยวข้อง", qty: 1, unit: "job" });
  r.push({ name: "แผงโซลาร์เซลล์" + (sp.panel ? " " + sp.panel : ""), qty: sp.panels || 1, unit: sp.panels ? "แผง" : "job" });
  r.push({ name: "อินเวอร์เตอร์" + (sp.inv ? " " + sp.inv : "") + (sp.phase ? " · ระบบ " + sp.phase + " เฟส" : ""), qty: 1, unit: "set" });
  r.push({ name: "โครงสร้างรองรับแผง (Solar Mounting Structure)" + (sp.roof ? " สำหรับหลังคา" + sp.roof : ""), qty: 1, unit: "set" });
  r.push({ name: "สายไฟ AC / DC พร้อมอุปกรณ์ประกอบ", qty: 1, unit: "job" });
  r.push({ name: "ตู้รวมสาย AC / DC (Combiner Box)", qty: 1, unit: "job" });
  r.push({ name: "รางเดินสาย / ท่อร้อยสาย (Cable Tray · Ladder · IMC Conduit)", qty: 1, unit: "job" });
  r.push({ name: "ระบบสายดิน (Grounding System)", qty: 1, unit: "job" });
  r.push({ name: "ระบบป้องกันไฟไหลย้อนเข้าระบบจำหน่าย (Zero Export Protection)", qty: 1, unit: "job" });
  r.push({ name: "ระบบสื่อสารและมอนิเตอร์การผลิตไฟ" + (sp.monitoring ? " " + sp.monitoring : ""), qty: 1, unit: "job" });
  if (sp.battery) r.push({ name: "ระบบแบตเตอรี่สำรอง " + sp.battery, qty: 1, unit: "set" });
  r.push({ name: "ค่าแรงติดตั้งระบบ Solar Rooftop", qty: 1, unit: "job" });
  r.push({ name: "รับประกันงานติดตั้งและการทำงานของระบบ", qty: 3, unit: "ปี" });
  r.push({ name: "บริการตรวจเช็คระบบและล้างแผง 1 ครั้ง/ปี", qty: 3, unit: "ปี" });
  return r;
}
/* ── รายการตั้งต้นของตารางรับประกัน ──
   ปีรับประกันของแผงกับอินเวอร์เตอร์เป็นของผู้ผลิต ที่เหลือเป็นของบริษัท */
function quoteWtySeed(t) {
  const sp = quoteSpec(t || {});
  return [
    { name: "แผงโซลาร์เซลล์" + (sp.panel ? " " + sp.panel : ""), qty: sp.panels || 1, unit: "PV", yr: "15 ปี (วัสดุ) · 30 ปี (ประสิทธิภาพ)" },
    { name: "อินเวอร์เตอร์" + (sp.inv ? " " + sp.inv : ""), qty: 1, unit: "System", yr: "5 ปี" },
    { name: "โครงสร้างรองรับแผง", qty: 1, unit: "Lot", yr: "3 ปี" },
    { name: "ตู้รวมสาย AC / DC", qty: 1, unit: "Lot", yr: "3 ปี" },
    { name: "ระบบควบคุม / ระบบสื่อสาร", qty: 1, unit: "Lot", yr: "3 ปี" },
    { name: "การทำงานของระบบโซลาร์เซลล์ทั้งระบบ", qty: 1, unit: "Lot", yr: "3 ปี" },
    { name: "บริการตรวจเช็คระบบและล้างแผง ปีละ 1 ครั้ง", qty: 1, unit: "Lot", yr: "3 ปี" },
  ];
}
/* แถวในตารางที่กรอกไว้ — ว่างก็ใช้รายการตั้งต้นไปก่อน คนที่ยังไม่เคยเข้ามาแก้จะได้ไม่ได้แผ่นเปล่า */
const quoteRowsOr = (rows, seed) => {
  const a = (rows || []).filter((r) => r && String(r.name || "").trim());
  return a.length ? a : seed;
};

/* เลขที่ใบเสนอราคา QT-YYMM-NNN — เลขรันนิ่งนับเฉพาะในเดือนเดียวกัน */
function quoteNo(quotes) {
  const d = new Date();
  const pre = "QT-" + String(d.getFullYear() % 100).padStart(2, "0") + String(d.getMonth() + 1).padStart(2, "0") + "-";
  let max = 0;
  (quotes || []).forEach((q) => {
    if (String(q.no || "").indexOf(pre) !== 0) return;
    const n = parseInt(String(q.no).slice(pre.length), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return pre + String(max + 1).padStart(3, "0");
}

/* สเปกอุปกรณ์ที่จะติดตั้งจริง — ลูกค้าอยากรู้ว่าได้แผงรุ่นไหน อินเวอร์เตอร์ตัวไหน
   ที่มาหลักคือผลสำรวจหน้างาน (invModel/panelModel เลือกจากคลัง) แล้วเติมด้วยสเปกในใบงาน */
function quoteSpec(t) {
  const o = t || {};
  const s = o.survey || {};
  const num = (v) => { const n = +v; return n > 0 ? n : 0; };
  return {
    /* ฝั่งลูกค้าสำรวจ: ขนาดที่วัดได้จากหน้างานแม่นกว่าตัวเลขที่เซลล์คาดไว้ตอนแรก
       ฝั่งใบงาน: ขนาดในใบงานคือตัวที่วิศวกรสรุปแล้ว จึงมาก่อนตัวเลขในแบบสำรวจ */
    kwp: o.kind === "lead" ? (num(s.sizeKw) || num(o.kwp)) : (num(o.kwp) || num(s.sizeKw)),
    panels: num(o.panels),
    /* เฟสมีคำตอบเดียวต่อหนึ่งหลังคา — เอาที่วัดมาจากหน้างานก่อนค่าที่คาดไว้ตอนแรกเสมอ */
    phase: (o.phase || s.phase) ? String(window.SF.phaseOf(o)) : "",
    panel: (s.panelModel || o.panelModel || "").trim(),
    inv: (s.invModel || o.invModel || "").trim(),
    roof: (s.roofType || o.roof || "").trim(),
    monitoring: (s.monitoring || "").trim(),
    battery: o.battery ? String(o.batSize || "มี").trim() : "",
    backup: !!o.backup,
  };
}
/* มีสเปกจริงให้ใส่ในใบเสนอราคาหรือยัง — ถ้ายังก็ใช้ข้อความกลาง ๆ ไปก่อน */
function quoteHasSpec(t) { const sp = quoteSpec(t); return !!(sp.panel || sp.inv || sp.panels); }
function quoteSpecName(t) {
  const sp = quoteSpec(t);
  return "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ " + (sp.kwp ? sp.kwp + " kWp " : "") + "พร้อมติดตั้ง";
}
function quoteSpecDetail(t) {
  const sp = quoteSpec(t);
  const out = [];
  out.push("แผงโซลาร์เซลล์" + (sp.panel ? " " + sp.panel : "") + (sp.panels ? " จำนวน " + sp.panels + " แผง" : ""));
  out.push("อินเวอร์เตอร์" + (sp.inv ? " " + sp.inv : "") + (sp.phase ? " · ระบบ " + sp.phase + " เฟส" : ""));
  if (sp.battery) out.push("แบตเตอรี่ " + sp.battery + (sp.backup ? " · ระบบไฟสำรอง" : ""));
  out.push("โครงสร้างรองรับ" + (sp.roof ? "สำหรับหลังคา" + sp.roof : ""));
  out.push("ระบบสายไฟและอุปกรณ์ป้องกัน");
  if (sp.monitoring) out.push("ระบบมอนิเตอร์ " + sp.monitoring);
  out.push("ค่าแรงติดตั้ง");
  /* บรรทัดละอย่าง — ต่อกันด้วย · จนเป็นพืดเดียว ลูกค้าอ่านไม่ออกว่าได้แผงรุ่นอะไรกี่แผง
     ซึ่งเป็นบรรทัดที่เขาอยากรู้ที่สุดในใบ */
  return out.join("\n");
}

/* รายละเอียดหนึ่งช่อง → หลายบรรทัดสำหรับเอกสาร
   ใบเก่าเก็บไว้เป็นพืดเดียวคั่นด้วย · จึงต้องแตกให้ด้วย ไม่งั้นใบเก่าที่ยังไม่ได้แก้จะยังเป็นพืด */
function quoteDetailLines(detail) {
  const s = String(detail || "").trim();
  if (!s) return [];
  /* เซลล์หลายคนพิมพ์ขีด/จุดนำหน้าเองติดมาด้วย พอเอกสารใส่จุดให้อีกจะกลายเป็น "· - ข้อความ"
     ตัดตัวนำหน้าที่พิมพ์มาออกก่อนเสมอ ให้เหลือจุดของเอกสารตัวเดียว */
  const clean = (x) => String(x).trim().replace(/^[-–—·•*]+\s*/, "").trim();
  const nl = s.split(/\r?\n/).map(clean).filter(Boolean);
  if (nl.length > 1) return nl;
  return s.split(/\s+·\s+/).map(clean).filter(Boolean);
}

/* รายการตั้งต้น — เซลล์เสนอเป็นราคาเหมาต่อระบบ ไม่ได้แจกแจงทีละน็อตแบบ BOQ
   จึงตั้งให้ 3 บรรทัด แล้วให้เซลล์แก้/เพิ่มเอง */
function quoteStdItems(t) {
  return [
    { id: "qi1", name: quoteSpecName(t), detail: quoteSpecDetail(t),
      qty: 1, unit: "ระบบ", price: 0 },
    { id: "qi2", name: "ค่าดำเนินการขออนุญาตการไฟฟ้า",
      detail: "จัดทำแบบ ยื่นคำร้อง และประสานงานจนได้รับอนุมัติ", qty: 1, unit: "งาน", price: 0 },
    { id: "qi3", name: "ค่าขนส่งและบริการหน้างาน", detail: "", qty: 1, unit: "งาน", price: 0 },
  ];
}

function blankQuote(target, user, quotes) {
  const t = target || {};
  const now = new Date().toISOString();
  return {
    id: "QT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: quoteNo(quotes),
    leadId: t.kind === "lead" ? t.id : "",
    jobId: t.kind === "job" ? t.id : "",
    refCode: t.code || "",
    customer: { name: t.name || "", phone: t.phone || "", address: t.address || "", province: t.province || "" },
    kwp: +t.kwp || 0,
    items: quoteStdItems(t),
    discount: 0, discountPct: 0, discountMode: "baht",
    sheetIds: [],
    /* ใบที่ทำใหม่ตั้งต้นเป็นชุดเต็ม — ลูกค้าโครงการขอทั้งเล่มเป็นปกติ
       ไม่อยากส่งแผ่นไหนก็ติ๊กออกได้ในหน้าทำใบ ง่ายกว่ามาตามเปิดทีหลังแล้วลืม */
    pages: quotePagesAll(),
    boqRows: quoteBoqSeed(t), wtyRows: quoteWtySeed(t), roi: {},
    vat: (window.BOQ && window.BOQ.VAT_RATE != null) ? window.BOQ.VAT_RATE : 7,
    terms: QUOTE_TERMS_DEF.slice(), warranties: QUOTE_WARRANTY_DEF.slice(),
    validDays: 30, note: "",
    status: "draft",
    ownerId: t.ownerId || (user && user.id) || "", ownerName: t.ownerName || (user && user.name) || "",
    byId: (user && user.id) || "", byName: (user && user.name) || "",
    date: sToday10(), at: now, updatedAt: now, sentAt: "", decidedAt: "",
  };
}

/* ยอดในใบเสนอราคา — ส่วนลดกรอกได้สองแบบ
   เป็นบาท (ต่อรองกันเป็นเงินก้อน) หรือเป็น % ของยอดก่อนภาษี (ลดตามนโยบายการขาย)
   เก็บทั้งสองช่องไว้ในใบ สลับโหมดกลับไปมาแล้วเลขเดิมไม่หาย
   ไม่ให้กรอกราคาสุทธิเองเหมือนเดิม เพราะจะมองไม่เห็นว่าลดไปเท่าไร */
function quoteTotals(q) {
  const r2 = (v) => Math.round(v * 100) / 100;
  const items = (q && q.items) || [];
  const sub = r2(items.reduce((s, it) => s + (+it.qty || 0) * (+it.price || 0), 0));
  const discMode = (q && q.discountMode) === "pct" ? "pct" : "baht";
  const discPct = Math.min(Math.max(0, +(q && q.discountPct) || 0), 100);
  const disc = discMode === "pct"
    ? r2(sub * discPct / 100)
    : r2(Math.min(Math.max(0, +(q && q.discount) || 0), sub));
  const afterDisc = r2(sub - disc);
  const rate = (q && q.vat != null && q.vat !== "") ? +q.vat : ((window.BOQ && window.BOQ.VAT_RATE) || 7);
  const vat = r2(afterDisc * rate / 100);
  return { sub, disc, discMode: discMode, discPct: discPct, afterDisc, vatRate: rate, vat, grand: r2(afterDisc + vat) };
}

/* ── แตกเงื่อนไขการชำระเงินเป็นจำนวนเงินรายงวด ──
   เซลล์พิมพ์เป็น % ("งวดที่ 1 · มัดจำ 30% เมื่อตกลงทำสัญญา") แล้วลูกค้าถามกลับมาทุกครั้งว่า
   "งวดแรกโอนเท่าไร" — ให้ระบบคิดให้ ไม่ต้องมานั่งกดเครื่องคิดเลขแล้วพิมพ์ผิดกันเอง

   บรรทัดที่ไม่มี % ถือว่าเป็นข้อความอธิบาย ไม่ต้องคิดเงิน
   งวดสุดท้ายที่มี % ใช้ "ยอดรวมลบงวดก่อนหน้า" ไม่ใช่คิด % ตรง ๆ — ไม่งั้นเศษสตางค์จากการปัด
   ทำให้ผลรวมรายงวดไม่เท่ากับยอดท้ายใบ ซึ่งลูกค้าจับได้ทันทีและกลายเป็นเรื่องความน่าเชื่อถือ */
function quoteTermSplit(terms, grand) {
  const total = Math.round((+grand || 0) * 100) / 100;
  const rows = (terms || []).map((s) => {
    const line = String(s || "");
    const m = line.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const pct = m ? +String(m[1]).replace(",", ".") : null;
    return { line: line, pct: pct != null && isFinite(pct) ? pct : null, amount: null };
  });
  const paid = rows.filter((r) => r.pct != null);
  const pctTotal = Math.round(paid.reduce((a, r) => a + r.pct, 0) * 100) / 100;
  let acc = 0;
  paid.forEach((r, i) => {
    if (i === paid.length - 1 && pctTotal === 100) r.amount = Math.round((total - acc) * 100) / 100;
    else { r.amount = Math.round(total * r.pct) / 100; acc = Math.round((acc + r.amount) * 100) / 100; }
  });
  return { rows: rows, pctTotal: pctTotal, count: paid.length, full: pctTotal === 100 };
}

/* ── คลังรูปอุปกรณ์ที่ใช้แนบท้ายใบเสนอราคา ──
   รูปชุดเดียวกัน (แผง · อินเวอร์เตอร์ · ตู้ไฟ · หน้างานตัวอย่าง) ถูกแนบซ้ำแทบทุกใบ
   จึงเก็บไว้ที่ส่วนกลางครั้งเดียวแล้วติ๊กเลือกเอา ไม่ใช่อัปไฟล์ใหม่ทุกครั้งที่ทำใบ
   แยกเป็นสองชั้นเหมือน DATA SHEET ในคลัง — รายการ (มีรูปย่อ) กับไฟล์เต็ม
   ถ้าเก็บรูปเต็มไว้ในรายการ หน้าทำใบจะต้องโหลดรูปทุกใบในคลังทุกครั้งที่เปิด */
const SF_QPIC_KEY = "solarflow_quotepics_v1";
const QPIC_MAX = 4 * 1024 * 1024;
function useQuotePics() {
  const [pics, setPics] = React.useState(_FB() ? null : () => _lsGet(SF_QPIC_KEY, []));
  const [busy, setBusy] = React.useState(false);
  const cache = React.useRef({});
  React.useEffect(() => {
    if (!_FB()) return;
    const r = _fbr("quotePics");
    const h = r.on("value", (snap) => setPics(_snap2arr(snap) || []), () => setPics([]));
    return () => r.off("value", h);
  }, []);
  React.useEffect(() => { if (!_FB() && pics !== null) _lsSet(SF_QPIC_KEY, pics); }, [pics]);

  /* รูปที่จะเอาไปพิมพ์ลงกระดาษ ย่อที่ด้านยาว 1400px ก็คมพอแล้วที่ 150dpi
     ส่วนรูปย่อในรายการเก็บไว้ในเรคอร์ดเลย จะได้เห็นทันทีโดยไม่ต้องโหลดไฟล์เต็ม */
  const add = React.useCallback((file, name) => {
    if (!file) return Promise.resolve(null);
    setBusy(true);
    return Promise.all([
      window.resizeImageFile(file, 1400, 0.82),
      window.resizeImageFile(file, 240, 0.6),
    ]).then(([full, thumb]) => {
      if (full.length > QPIC_MAX) { alert("รูปใหญ่เกินไป — ย่อรูปก่อนอัปโหลด"); return null; }
      const rec = { id: "QP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        name: String(name || file.name || "รูปอุปกรณ์").replace(/\.[a-z0-9]+$/i, ""),
        thumb: thumb, size: full.length, at: new Date().toISOString() };
      cache.current[rec.id] = full;
      if (_FB()) { _fbSet("quotePicData/" + rec.id, full); _fbSet("quotePics/" + rec.id, rec); }
      else { _lsSetRaw(SF_QPIC_KEY + "_" + rec.id, full); setPics((p) => (p || []).concat([rec])); }
      return rec;
    }).catch((e) => { alert("อ่านไฟล์รูปไม่สำเร็จ: " + e.message); return null; })
      .then((r) => { setBusy(false); return r; });
  }, []);
  const rename = React.useCallback((id, name) => {
    if (_FB()) _fbUpd("quotePics/" + id, { name: name });
    else setPics((p) => (p || []).map((x) => x.id === id ? Object.assign({}, x, { name: name }) : x));
  }, []);
  const remove = React.useCallback((id) => {
    delete cache.current[id];
    if (_FB()) { _fbRem("quotePics/" + id); _fbRem("quotePicData/" + id); }
    else { _lsSetRaw(SF_QPIC_KEY + "_" + id, null); setPics((p) => (p || []).filter((x) => x.id !== id)); }
  }, []);
  /* ไฟล์เต็มโหลดตอนจะออกเอกสารเท่านั้น — จำไว้ในหน่วยความจำ กดดูซ้ำจะได้ไม่โหลดใหม่ */
  const load = React.useCallback((id) => {
    if (cache.current[id]) return Promise.resolve(cache.current[id]);
    if (!_FB()) { const v = _lsGetRaw(SF_QPIC_KEY + "_" + id); cache.current[id] = v; return Promise.resolve(v); }
    return _fbGet("quotePicData/" + id).then((sn) => { const v = sn.val() || null; cache.current[id] = v; return v; }).catch(() => null);
  }, []);
  return { pics: pics || [], loading: pics === null, busy: busy, add, rename, remove, load };
}

const SF_QUOTE_KEY = "solarflow_quotes_v1";

function useQuoteStore() {
  const [quotes, setQuotes] = React.useState(_FB() ? null : () => _lsGet(SF_QUOTE_KEY, []));
  const ref = React.useRef(quotes);
  React.useEffect(() => { ref.current = quotes; }, [quotes]);
  React.useEffect(() => {
    if (!_FB()) return;
    const r = _fbr("quotes");
    const h = r.on("value", (snap) => setQuotes(_snap2arr(snap) || []), () => setQuotes([]));
    return () => r.off("value", h);
  }, []);
  React.useEffect(() => { if (!_FB() && quotes !== null) _lsSet(SF_QUOTE_KEY, quotes); }, [quotes]);

  const upsert = React.useCallback((rec) => {
    const r = Object.assign({}, rec, { updatedAt: new Date().toISOString() });
    if (_FB()) _fbSet("quotes/" + r.id, r);
    else setQuotes((p) => { const a = p || []; const i = a.findIndex((x) => x.id === r.id); if (i === -1) return a.concat([r]); const c = a.slice(); c[i] = Object.assign({}, a[i], r); return c; });
    return r;
  }, []);
  const patch = React.useCallback((id, fields) => {
    const f = Object.assign({}, fields, { updatedAt: new Date().toISOString() });
    if (_FB()) _fbUpd("quotes/" + id, f);
    else setQuotes((p) => (p || []).map((x) => x.id === id ? Object.assign({}, x, f) : x));
  }, []);
  const remove = React.useCallback((id) => {
    if (_FB()) _fbRem("quotes/" + id);
    else setQuotes((p) => (p || []).filter((x) => x.id !== id));
  }, []);

  return { quotes: quotes || [], upsert, patch, remove, blank: (target, user) => blankQuote(target, user, ref.current || []) };
}

/* ── หน้ากระดาษของไฟล์ PDF → รูป ──
   เบราว์เซอร์พิมพ์ไฟล์ PDF รวมกับหน้า HTML ไม่ได้ (คนละเครื่องพิมพ์เอกสารกันคนละตัว)
   จึงวาดทีละหน้าลง canvas ด้วย pdf.js แล้วเอารูปไปวางเป็นหน้าในชุดเดียวกัน
   — ลูกค้าได้ใบเสนอราคาพร้อม DATA SHEET เป็นไฟล์เดียวจบ ไม่ต้องสั่งพิมพ์สองรอบแล้วเอามาแนบเอง
   กว้าง 1240px ≈ A4 ที่ 150dpi อ่านตัวเลขในตารางสเปกออกตอนพิมพ์ · JPEG 0.82 คุมขนาดไฟล์
   loadPdfJs อยู่ใน views-stock.jsx (หน้าคลังใช้เปิดดู DATA SHEET อยู่แล้ว) โหลดจาก CDN ตอนเรียกครั้งแรก */
const QUOTE_SHEET_MAXPG = 8;
function quotePdfPages(dataUrl, maxPages) {
  const lim = maxPages || QUOTE_SHEET_MAXPG;
  if (!window.loadPdfJs) return Promise.reject(new Error("no pdfjs"));
  return window.loadPdfJs()
    .then((lib) => {
      const b64 = String(dataUrl).split(",")[1] || "";
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return lib.getDocument({ data: arr }).promise;
    })
    .then((pdf) => {
      const out = [];
      const one = (n) => {
        if (n > Math.min(pdf.numPages, lim)) return Promise.resolve(out);
        return pdf.getPage(n).then((page) => {
          const v1 = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: Math.min(2.2, 1240 / v1.width) });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width; canvas.height = vp.height;
          return page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise
            .then(() => { out.push(canvas.toDataURL("image/jpeg", 0.82)); return one(n + 1); });
        });
      };
      return one(1).then(() => ({ pages: out, total: pdf.numPages }));
    });
}

/* ── ใบใหม่ที่ตั้งต้นจากใบเก่า ──
   เสนอรอบสองมักแก้จากรอบแรกไม่กี่จุด (ลดราคา · เปลี่ยนรุ่นแผง · แก้งวดจ่าย)
   ถ้าเปิดใบเปล่าทุกครั้ง เซลล์ต้องพิมพ์รายการกับเงื่อนไขใหม่ทั้งใบ แล้วมักตกหล่นไม่ตรงกับรอบก่อน
   เลขที่ / วันที่ / สถานะ ขึ้นใหม่เสมอ — ใบเก่าต้องไม่ถูกแตะ ส่วนชื่อลูกค้าเอาของปัจจุบัน (อาจแก้ไปแล้ว) */
function quoteFrom(prev, target, user, quotes) {
  const q = blankQuote(target, user, quotes);
  if (!prev) return q;
  const stamp = Date.now().toString(36);
  return Object.assign(q, {
    items: (prev.items || []).map((x, i) => Object.assign({}, x, { id: "qi" + (i + 1) + stamp })),
    discount: +prev.discount || 0, discountPct: +prev.discountPct || 0,
    discountMode: prev.discountMode === "pct" ? "pct" : "baht",
    vat: prev.vat != null ? prev.vat : q.vat,
    terms: (prev.terms || []).slice(), warranties: (prev.warranties || []).slice(),
    sheetIds: (prev.sheetIds || []).slice(),
    pages: Object.assign(quotePagesAll(), prev.pages || QUOTE_PAGES_LEGACY),
    boqRows: (prev.boqRows || []).map((x) => Object.assign({}, x)),
    wtyRows: (prev.wtyRows || []).map((x) => Object.assign({}, x)),
    roi: Object.assign({}, prev.roi || {}),
    validDays: prev.validDays || q.validDays, note: prev.note || "",
    kwp: +prev.kwp > 0 ? +prev.kwp : q.kwp,
    basedOn: prev.no || "",
  });
}

/* ใบเสนอราคาของลูกค้า/งานหนึ่งราย — ใบล่าสุดอยู่บน */
function quotesFor(quotes, kind, id) {
  if (!id) return [];
  return (quotes || []).filter((q) => (kind === "job" ? q.jobId === id : q.leadId === id))
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}

/* ── ใบเสนอราคาของ "งาน" หนึ่งใบ ──
   ใบที่ทำตอนยังเป็นลูกค้าสำรวจจะมีแต่ leadId · ถ้าดูแค่ jobId จะไม่เห็นใบที่เสนอลูกค้าไปจริง ๆ
   ซึ่งเป็นใบที่สำคัญที่สุด (ราคาที่ตกลงกัน) จึงไล่ผ่าน lead.jobId ที่ผูกกันอยู่แล้วด้วย
   ไม่ไปเขียน jobId ทับของเก่า เพราะใบเสนอราคาเป็นเอกสารที่ออกไปแล้ว ไม่ควรแก้ย้อนหลังเอง */
function quotesOfJob(quotes, job, leads) {
  if (!job) return [];
  const lid = {};
  (leads || []).forEach((l) => { if (l.jobId === job.id) lid[l.id] = 1; });
  return (quotes || []).filter((q) => q.jobId === job.id || (q.leadId && lid[q.leadId]))
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}
/* ใบเสนอราคาของลูกค้าสำรวจหนึ่งราย — รวมใบที่ออกหลังแปลงเป็นงานแล้วด้วย
   ลูกค้ารายเดียวกันต้องเห็นใบครบทุกฉบับไม่ว่าจะออกตอนไหน */
function quotesOfLead(quotes, lead) {
  if (!lead) return [];
  return (quotes || []).filter((q) => q.leadId === lead.id || (lead.jobId && q.jobId === lead.jobId))
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}

/* ── รายการใบเสนอราคาของงาน — ใช้ทั้งในบล็อกของเซลล์ และในใบงานหน้าฐานข้อมูล ──
   ใบเสนอราคาคือ "ราคาที่ตกลงกับลูกค้า" ซึ่งคนดูใบงานต้องเปิดดูได้โดยไม่ต้องไปหาที่หน้าขาย
   card = วาดกรอบของตัวเอง (ตอนอยู่ในใบงาน) · ในบล็อกเซลล์มีกรอบอยู่แล้วจึงไม่ต้องซ้อน */
function SalesQuoteList({ job, lead, quotes, leads, onOpenQuote, card }) {
  const qs = lead ? quotesOfLead(quotes, lead) : quotesOfJob(quotes, job, leads);
  const body = (
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: "var(--text-3)" }}>ใบเสนอราคา</span>
        {onOpenQuote && (
          <button onClick={() => onOpenQuote(null)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4,
            background: "none", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 10px", cursor: "pointer",
            fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--primary-dark)" }}>
            <Icon name="plus" size={13} color="var(--primary-dark)" /> ทำใบใหม่
          </button>
        )}
      </div>
      {qs.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
          {lead ? "ยังไม่มีใบเสนอราคาของลูกค้ารายนี้" : "ยังไม่มีใบเสนอราคาผูกกับงานนี้"}
        </div>
      ) : qs.map((q, i) => {
        const s = QUOTE_STATUS_BY[q.status] || QUOTE_STATUS_BY.draft;
        const T = quoteTotals(q);
        /* เรียงใบใหม่อยู่บน — ฉบับที่เท่าไรจึงนับจากท้ายรายการขึ้นมา
           เสนอไปหลายรอบแล้วต้องรู้ว่ากำลังคุยกันอยู่ที่ฉบับไหน ไม่ใช่เห็นแต่เลขที่ใบซึ่งดูไม่ออกว่าใบไหนก่อนหลัง */
        const ver = qs.length - i;
        return (
          <button key={q.id} onClick={() => onOpenQuote && onOpenQuote(q)} disabled={!onOpenQuote}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 6,
              background: i === 0 ? "var(--surface2)" : "transparent", border: "1px solid var(--border)", borderRadius: 11,
              cursor: onOpenQuote ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--mono)" }}>{q.no}</span>
                {qs.length > 1 && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: i === 0 ? "var(--primary-dark)" : "var(--text-3)",
                    background: i === 0 ? "var(--primary-soft)" : "var(--surface2)", padding: "1px 7px", borderRadius: 99 }}>
                    ฉบับที่ {ver}{i === 0 ? " · ล่าสุด" : ""}
                  </span>
                )}
              </span>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{thDate(q.date, true)}{q.ownerName ? " · " + q.ownerName : ""}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>฿{sBaht(T.grand)}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color, background: s.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.th}</span>
          </button>
        );
      })}
    </React.Fragment>
  );
  if (!card) return <div>{body}</div>;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 10 }}>{body}</div>
  );
}

/* ── พจนานุกรมใบเสนอราคา (ไทย → [อังกฤษ, จีน]) ──
   แปลทั้งใบตอนท้ายด้วย window.pgDocHTML — วิธีเขียนคีย์ดูที่ i18n.jsx
   รายการสินค้า เงื่อนไขชำระเงิน และข้อรับประกัน เป็นข้อความที่เซลล์พิมพ์เอง
   จึงไม่อยู่ในตารางนี้ ออกมาตามที่พิมพ์ไว้เสมอ ไม่ว่าเลือกภาษาอะไร */
const QUOTE_I18N = {
  "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ · ออกแบบ · ติดตั้ง · ขออนุญาตการไฟฟ้า":
    ["Solar power systems · design · installation · utility permitting",
     "太阳能发电系统 · 设计 · 安装 · 电力报装"],
  "ยืนราคา {} วัน นับจากวันที่ออกใบเสนอราคา":
    ["Prices held for {} days from the date of this quotation", "报价自开具之日起 {} 天内有效"],
  "เอกสารนี้ออกจากระบบติดตามงานติดตั้ง ":
    ["Issued by the installation tracking system of ", "本文件由安装管理系统开具 · "],
  "วันที่ ______ / ______ / ______": ["Date ______ / ______ / ______", "日期 ______ / ______ / ______"],
  "— ยังไม่มีรายการ —": ["— no items —", "— 暂无项目 —"],
  "ภาษีมูลค่าเพิ่ม {}%": ["VAT {}%", "增值税 {}%"],
  "ราคาหลังหักส่วนลด": ["Price after discount", "折后金额"],
  "การรับประกันและบริการ": ["Warranty and service", "质保与服务"],
  "เงื่อนไขการชำระเงิน": ["Payment terms", "付款条件"],
  "รายละเอียดข้อเสนอ": ["Proposal details", "报价概要"],
  "ผู้อนุมัติ / ลูกค้า": ["Approved by / customer", "批准人 / 客户"],
  "ราคารวมทั้งสิ้น": ["Grand total", "总计"],
  "ผู้เสนอราคา · ": ["Quoted by · ", "报价人 · "],
  "ใบเสนอราคา": ["Quotation", "报价单"],
  "รวมเป็นเงิน": ["Subtotal", "小计"],
  "หักส่วนลด": ["Discount", "折扣"],
  "หักส่วนลด {}%": ["Discount {}%", "折扣 {}%"],
  "เอกสารแนบ (DATA SHEET)": ["Attachments (data sheets)", "附件（产品数据表）"],
  "ราคา/หน่วย": ["Unit price", "单价"],
  "จำนวนเงิน": ["Amount", "金额"],
  "หมายเหตุ: ": ["Note: ", "备注："],
  "ผู้เสนอ": ["Prepared by", "报价人"],
  "อ้างอิง": ["Reference", "关联编号"],
  "รายการ": ["Description", "项目"],
  "จำนวน": ["Qty", "数量"],
  "เลขที่": ["No.", "编号"],
  "ที่อยู่": ["Address", "地址"],
  "ลูกค้า": ["Customer", "客户"],
  "วันที่": ["Date", "日期"],
  "หน่วย": ["Unit", "单位"],
  "ขนาด": ["Size", "规模"],
  "ชื่อ": ["Name", "姓名"],
  "โทร": ["Tel", "电话"],
  "ข้อเสนอโครงการ": ["Project proposal", "项目方案"],
  "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์บนหลังคา": ["Solar Rooftop Power System", "屋顶太阳能发电系统"],
  "เสนอต่อ": ["Presented to", "呈送"],
  "ขนาดติดตั้ง": ["Installed capacity", "装机容量"],
  "BOQ รายการงาน": ["Bill of quantity", "工程量清单"],
  "BOQ · ขอบเขตงานระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์บนหลังคา": ["Bill of quantity · solar rooftop system scope of work", "工程量清单 · 屋顶太阳能系统工作范围"],
  "ตารางรับประกันอุปกรณ์": ["Equipment warranty", "设备质保"],
  "การรับประกันอุปกรณ์ในระบบที่ติดตั้ง": ["Warranty of the installed equipment", "安装设备质保明细"],
  "การรับประกัน": ["Warranty", "质保"],
  "วิเคราะห์ผลตอบแทน": ["Return analysis", "收益分析"],
  "ประมาณการผลิตไฟและค่าไฟที่ประหยัดได้": ["Estimated generation and electricity savings", "发电量与电费节省预估"],
  "สรุปผลตอบแทน": ["Return summary", "收益摘要"],
  "ระยะเวลาคืนทุน": ["Payback period", "投资回收期"],
  "ลดค่าไฟเดือนละ": ["Monthly bill reduction", "每月电费减少"],
  "รายได้รวมทั้งหมด": ["Total savings", "累计收益"],
  "กำไรหลังหักเงินลงทุน": ["Profit after investment", "扣除投资后利润"],
  "เงินลงทุน (ก่อน VAT)": ["Investment (excl. VAT)", "投资额（不含税）"],
  "ราคาต่อวัตต์": ["Price per watt", "每瓦价格"],
  "ชั่วโมงผลิตไฟเฉลี่ย": ["Effective sun hours", "有效发电小时"],
  "ผลิตไฟรายวัน": ["Daily generation", "日发电量"],
  "ผลิตไฟรายปี": ["Annual generation", "年发电量"],
  "ค่าไฟรวมค่า FT": ["Tariff incl. FT", "含 FT 电价"],
  "ปีที่": ["Year", "年"],
  "ประสิทธิภาพ": ["Efficiency", "效率"],
  "หน่วยที่ผลิตได้": ["Generation", "发电量"],
  "ค่าไฟ/หน่วย": ["Tariff", "电价"],
  "ค่าไฟที่ประหยัด": ["Savings", "节省"],
  "ยอดสะสม": ["Cumulative", "累计"],
  "รวม {} ปี": ["{}-year total", "{} 年合计"],
  "คืนทุนปีนี้": ["payback here", "回收于此"],
  "ปี": [" yr", " 年"],
  "เดือน": [" mo", " 个月"],
  "รูป": ["Pic", "图片"],
  "ผู้ขาย": ["Seller", "卖方"],
  "ผู้ซื้อ": ["Buyer", "买方"],
  " บาท": [" THB", " 泰铢"],
};

/* ============================================================
   quoteHTML — ใบเสนอราคา A4 สำหรับพิมพ์/บันทึกเป็น PDF
   เปิดผ่าน SuReportView ตัวเดียวกับรายงานอื่น ๆ จะได้ปุ่มพิมพ์เหมือนกันหมด
   ============================================================ */
function quoteHTML(q, lang, sheets, pics) {
  /* ภาษาของเอกสาร — ประกอบเป็นไทยตามปกติทั้งใบ แล้วแปลทีเดียวตอนท้าย (ดู i18n.jsx)
     วันที่ต้องแปลตรงนี้ เพราะไทยเป็น พ.ศ. ส่วนอังกฤษ/จีนเป็น ค.ศ. */
  const L = lang || "th";
  const T = quoteTotals(q);
  const c = q.customer || {};
  const items = (q.items || []).filter((it) => (it.name || "").trim() || +it.price);
  const valid = q.validDays ? "ยืนราคา " + q.validDays + " วัน นับจากวันที่ออกใบเสนอราคา" : "";
  const dsp = (s) => (!s ? "—" : L === "th" || !window.pgDate ? thDate(s, true) : window.pgDate(s, L));
  /* รายละเอียดแตกเป็นบรรทัดละอย่าง — ลูกค้าต้องกวาดตาเจอทันทีว่าแผงรุ่นไหน กี่แผง */
  const rows = items.map((it, i) =>
    '<tr><td class="c">' + (i + 1) + '</td><td><b>' + sEsc(it.name) + "</b>" +
    (quoteDetailLines(it.detail).map((ln) => '<div class="dt">· ' + sEsc(ln) + "</div>").join("")) + "</td>" +
    '<td class="c">' + sEsc(it.qty) + "</td><td class=\"c\">" + sEsc(it.unit || "") + "</td>" +
    '<td class="r">' + sBaht(it.price) + '</td><td class="r">' + sBaht((+it.qty || 0) * (+it.price || 0)) + "</td></tr>"
  ).join("");
  /* ── DATA SHEET ที่เลือกแนบ ──
     ที่เป็นรูปพิมพ์ต่อท้ายในชุดเดียวกันได้เลย · ไฟล์ PDF พิมพ์รวมไม่ได้ ต้องบอกให้แนบแยก
     (วิธีเดียวกับชุดเอกสารขออนุญาต) */
  /* ปิดแผ่น DATA SHEET = ไม่ต้องเอาไฟล์ที่แนบไว้มาประกอบเลย (ไม่ใช่แนบแต่ไม่พิมพ์) */
  const sh = quotePageOn(q, "sheets") ? (sheets || []).filter(Boolean) : [];
  const shImgs = sh.filter((x) => x.kind === "image");
  const shPdfs = sh.filter((x) => x.kind !== "image");
  /* ใบเสนอราคาต้องจบในตัวมันเอง — DATA SHEET เป็นเอกสารแนบ ไปขึ้นแผ่นใหม่ต่อท้าย
     ไม่แทรกรายการไว้กลางใบให้ลูกค้าสับสนว่าเป็นของที่ต้องจ่ายเพิ่มหรือเปล่า */
  /* หน้ากระดาษของเอกสารแนบ — ถ้าแปลงหน้า PDF มาเป็นรูปได้แล้ว (pages) ก็พิมพ์ไปในชุดเดียวกันเลย
     แปลงไม่ได้ (ต่อเน็ตไม่ได้ / ไฟล์เสีย) ค่อยขึ้นเป็นบรรทัดบอกว่าต้องพิมพ์แยก จะได้ไม่เงียบหาย */
  const pagesOf = (x) => (x.pages && x.pages.length ? x.pages : (x.kind === "image" ? [x.dataUrl] : []));
  const shList = sh.length
    ? '<div class="blk"><h3>เอกสารแนบ · DATA SHEET</h3><ul>' +
      sh.map((x) => {
        const pg = pagesOf(x);
        const more = x.total && x.total > pg.length ? " (จาก " + x.total + " หน้า)" : "";
        return "<li>" + sEsc(x.label) +
          (pg.length ? ' <span class="pdf">แนบมาด้วย ' + pg.length + " หน้า" + more + "</span>"
                     : ' <span class="pdf">ไฟล์ PDF · พิมพ์แยกจากไฟล์ต้นฉบับ</span>') + "</li>";
      }).join("") +
      "</ul></div>"
    : "";
  /* ตัวหน้า DATA SHEET จริง ๆ ยังขึ้นแผ่นใหม่แผ่นละหน้า เพราะเป็นรูปเต็มหน้ากระดาษ */
  const shPages = sh.map((x) => pagesOf(x).map((src, i, all) => (
    '<div class="shpg"><h3>DATA SHEET — ' + sEsc(x.label) +
    (all.length > 1 ? " (หน้า " + (i + 1) + "/" + all.length + ")" : "") + "</h3>" +
    '<img class="shimg" src="' + src + '" alt="" /></div>'
  )).join("")).join("");
  /* หัวจดหมาย — ใช้ทั้งแผ่นใบเสนอราคาและแผ่นแนบ ต่างกันแค่ชื่อเอกสารมุมขวา
     แผ่นแนบที่หลุดจากชุดต้องอ่านออกว่าเป็นของบริษัทไหน ใบเลขที่อะไร */
  const headHTML = (title) =>
    '<div class="hd"><div>' + window.brandHeadHTML({ size: 40 }) +
    (window.BRANDING.legalTH ? '<div class="bs bl">' + sEsc(window.BRANDING.legalTH) +
      (window.BRANDING.taxId ? " · เลขประจำตัวผู้เสียภาษี " + sEsc(window.BRANDING.taxId) : "") + "</div>" : "") +
    (window.BRANDING.addrTH ? '<div class="bs">' + sEsc(window.BRANDING.addrTH) + "</div>" : "") +
    '<div class="bs">' + window.BRANDING.email + " · " + window.BRANDING.tel + "</div></div>" +
    '<div class="ti"><h1>' + title + '</h1><div class="no">เลขที่ <b>' + sEsc(q.no) + "</b></div>" +
    '<div class="no">วันที่ ' + dsp(q.date) + "</div></div></div>";
  const footHTML = '<div class="ft">ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ · ออกแบบ · ติดตั้ง · ขออนุญาตการไฟฟ้า</div>';
  const money = (label, val, big) =>
    '<tr class="' + (big ? "big" : "") + '"><td>' + label + '</td><td class="r">' + sBaht(val) + " บาท</td></tr>";
  const list = (arr, title) => {
    const a = (arr || []).map((s) => String(s || "").trim()).filter(Boolean);
    if (!a.length) return "";
    return '<div class="blk"><h3>' + title + "</h3><ul>" + a.map((s) => "<li>" + sEsc(s) + "</li>").join("") + "</ul></div>";
  };
  /* เงื่อนไขการชำระเงิน — งวดที่ระบุ % ไว้ พิมพ์จำนวนเงินต่อท้ายให้ด้วย
     ลูกค้าจะได้ไม่ต้องคิดเองว่าโอนงวดแรกเท่าไร และไม่มีใครคิดเลขผิดคนละแบบ
     บรรทัดที่ไม่มี % (ข้อความอธิบาย) พิมพ์ตามเดิม */
  const termList = (arr, grand) => {
    const a = (arr || []).map((s) => String(s || "").trim()).filter(Boolean);
    if (!a.length) return "";
    const sp = quoteTermSplit(a, grand);
    /* เขียนเป็นไทยไว้ก่อนเหมือนทั้งใบ แล้วให้ตัวแปลตอนท้ายจัดการ (" บาท" อยู่ในพจนานุกรมแล้ว) */
    const li = sp.rows.map((r) => "<li>" + sEsc(r.line)
      + (r.amount != null ? ' <b style="white-space:nowrap">= ' + sBaht(r.amount) + " บาท</b>" : "")
      + "</li>").join("");
    return '<div class="blk"><h3>เงื่อนไขการชำระเงิน</h3><ul>' + li + "</ul></div>";
  };
  /* ── หน้าปก ──
     ชุดเอกสารของงานโครงการถูกพรินต์ไปวางบนโต๊ะประชุมรวมกับของเจ้าอื่น
     แผ่นแรกจึงต้องบอกครบในสายตาเดียวว่าใครเสนอ เสนอให้ใคร ระบบใหญ่เท่าไร */
  const coverHTML = () =>
    '<div class="cv">' +
    '<div class="cvh">' + window.brandHeadHTML({ size: 44 }) +
    (window.BRANDING.legalTH ? '<div class="bs bl">' + sEsc(window.BRANDING.legalTH) +
      (window.BRANDING.taxId ? " · เลขประจำตัวผู้เสียภาษี " + sEsc(window.BRANDING.taxId) : "") + "</div>" : "") +
    (window.BRANDING.addrTH ? '<div class="bs">' + sEsc(window.BRANDING.addrTH) + "</div>" : "") +
    '<div class="bs">' + window.BRANDING.email + " · " + window.BRANDING.tel + "</div></div>" +
    /* แผ่นสีเต็มผืนกลางหน้า — ชื่อโครงการกับขนาดระบบต้องเด่นที่สุดในกอง
       ตัวหนังสือขาวบนพื้นไล่สีแบรนด์ อ่านออกทั้งบนจอและบนกระดาษ */
    '<div class="cvhero">' +
    '<div class="cvk">ข้อเสนอโครงการ</div>' +
    '<h1 class="cvt">ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์บนหลังคา</h1>' +
    '<div class="cvline"></div>' +
    '<div class="cvto">เสนอต่อ</div>' +
    '<div class="cvcu">' + sEsc(c.name || "—") + "</div>" +
    ((c.address || c.province) ? '<div class="cvad">' + sEsc((c.address || "") + (c.province ? " " + c.province : "")) + "</div>" : "") +
    '<div class="cvrow">' +
    '<div class="cvcap"><span class="cl">ขนาดติดตั้ง</span>' +
    '<span class="cn">' + (q.kwp ? sEsc(q.kwp) : "—") + '</span><span class="cu">kWp</span></div>' +
    '<div class="cvtag">ออกแบบ · ติดตั้ง · ขออนุญาตการไฟฟ้า</div>' +
    "</div></div>" +
    '<div class="cvf">' +
    '<div><span>เลขที่</span><b>' + sEsc(q.no) + "</b></div>" +
    '<div><span>วันที่</span><b>' + dsp(q.date) + "</b></div>" +
    '<div><span>ผู้เสนอ</span><b>' + sEsc(q.ownerName || q.byName || "—") + "</b></div>" +
    (c.phone ? '<div><span>โทร</span><b>' + sEsc(c.phone) + "</b></div>" : "") +
    "</div>" + footHTML + "</div>";

  /* รูปอุปกรณ์ที่โหลดมาแล้ว แยกตาม id — ใช้ในช่องรูปของตารางรับประกัน */
  const picById = {};
  (pics || []).forEach((p) => { if (p && p.data) picById[p.id] = p; });

  /* หัวแผ่นแนบทุกแผ่น — ชื่อเอกสาร + บรรทัดบอกว่าเป็นของใบไหนของใคร
     แผ่นที่หลุดจากชุดต้องอ่านออกว่าเป็นของงานไหน */
  const sheetHead = (title, h2, sub) => headHTML(title) + "<h2>" + h2 + "</h2>" +
    '<div class="sub">' + sEsc(c.name || "") + (q.kwp ? " · ขนาดติดตั้ง " + sEsc(q.kwp) + " kWp" : "") +
    " · แนบท้ายใบเสนอราคาเลขที่ " + sEsc(q.no) + (sub ? " · " + sub : "") + "</div>";

  /* ── BOQ ── ขอบเขตงานที่ลูกค้าจะได้ ไม่มีราคาทีละบรรทัด
     ราคาต่อรายการเป็นเรื่องภายใน ถ้าพิมพ์ลงไปลูกค้าจะหยิบมาต่อรองทีละบรรทัด
     แต่ยอดท้ายแผ่นต้องมี ไม่งั้นแผ่นนี้ไม่ผูกกับใบเสนอราคาที่เซ็นกัน */
  const boqRows = quoteRowsOr(q.boqRows, quoteBoqSeed(q));
  const boqHTML = () =>
    '<div class="dpg">' + sheetHead("BOQ รายการงาน", "BOQ · ขอบเขตงานระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์บนหลังคา", "") +
    '<table><thead><tr><th class="c" style="width:34px">ลำดับ</th><th>รายการ</th>' +
    '<th class="c" style="width:56px">จำนวน</th><th class="c" style="width:56px">หน่วย</th></tr></thead><tbody>' +
    (boqRows.map((r, i) => '<tr><td class="c">' + (i + 1) + "</td><td>" + sEsc(r.name) +
      '</td><td class="c">' + sEsc(r.qty == null || r.qty === "" ? "" : r.qty) +
      '</td><td class="c">' + sEsc(r.unit || "") + "</td></tr>").join("")
      || '<tr><td colspan="4" class="c">— ยังไม่มีรายการ —</td></tr>') +
    "</tbody></table>" +
    '<div class="pgft"><table class="sum">' +
    money("รวมเป็นเงิน", T.afterDisc) + money("ภาษีมูลค่าเพิ่ม " + T.vatRate + "%", T.vat) +
    money("ราคารวมทั้งสิ้น", T.grand, true) + "</table>" +
    footHTML + "</div></div>";

  /* ── ตารางรับประกัน ── ลูกค้าถามทุกรายว่า "อะไรรับประกันกี่ปี"
     เขียนเป็นตารางให้เทียบได้ทีเดียว ดีกว่าให้ไปไล่อ่านในข้อความยาว ๆ */
  const wtyRows = quoteRowsOr(q.wtyRows, quoteWtySeed(q));
  const wtyPic = wtyRows.some((r) => r && picById[r.pic]);
  const wtyYr = (s) => String(s == null ? "" : s).split("·").map((x) => x.trim()).filter(Boolean)
    .map((x) => '<div class="wl"><b>' + sEsc(x) + "</b></div>").join("");
  const wtyHTML = () =>
    '<div class="dpg">' + sheetHead("ตารางรับประกันอุปกรณ์", "การรับประกันอุปกรณ์ในระบบที่ติดตั้ง", "") +
    '<table><thead><tr><th class="c" style="width:34px">ลำดับ</th>' +
    (wtyPic ? '<th class="c" style="width:76px">รูป</th>' : "") + "<th>รายการ</th>" +
    '<th class="c" style="width:56px">จำนวน</th><th class="c" style="width:64px">หน่วย</th>' +
    '<th style="width:150px">การรับประกัน</th></tr></thead><tbody>' +
    (wtyRows.map((r, i) => '<tr><td class="c">' + (i + 1) + "</td>" +
      (wtyPic ? '<td class="pc">' + (picById[r.pic] ? '<img src="' + picById[r.pic].data + '" alt="" />' : "") + "</td>" : "") +
      "<td>" + sEsc(r.name) +
      '</td><td class="c">' + sEsc(r.qty == null || r.qty === "" ? "" : r.qty) +
      '</td><td class="c">' + sEsc(r.unit || "") + "</td><td>" + wtyYr(r.yr) + "</td></tr>").join("")
      || '<tr><td colspan="' + (wtyPic ? 6 : 5) + '" class="c">— ยังไม่มีรายการ —</td></tr>') +
    "</tbody></table>" +
    /* ข้อ "การรับประกันและบริการ" อยู่ในแผ่นเงื่อนไข (หน้า 2) แล้ว ไม่ลอกมาซ้ำอีกแผ่น */
    '<div class="pgft">' + footHTML + "</div></div>";

  /* ── แผ่นวิเคราะห์ผลตอบแทน ──
     คิดได้เฉพาะใบที่มีทั้งขนาดระบบและราคา — ขาดอย่างใดอย่างหนึ่งตารางจะเป็นศูนย์ทั้งแผ่น
     ปิดแผ่นไปเงียบ ๆ ดีกว่าส่งแผ่นที่เลขเป็นศูนย์ให้ลูกค้า (หน้าทำใบมีคำเตือนบอกอยู่) */
  const R = (+q.kwp > 0 && T.afterDisc > 0) ? quoteRoi(q) : null;
  const n0 = (v) => Math.round(+v || 0).toLocaleString("en-US");
  const n2 = (v) => sBaht(v);
  const prm = (rows) => '<table class="prm"><tbody>' + rows.map((r) =>
    "<tr><td>" + r[0] + '</td><td class="r"><b>' + r[1] + "</b></td></tr>").join("") + "</tbody></table>";
  const cashHTML = () => !R ? "" :
    '<div class="dpg fit">' + sheetHead("วิเคราะห์ผลตอบแทน", "ประมาณการผลิตไฟและค่าไฟที่ประหยัดได้", "") +
    '<div class="prmw">' +
    prm([["ขนาดติดตั้ง", sEsc(R.kwp) + " kWp"],
         ["เงินลงทุน (ก่อน VAT)", n2(R.invest) + " บาท"],
         ["ราคาต่อวัตต์", n2(R.perW) + " บาท"],
         ["ชั่วโมงแดดเฉลี่ย", n2(R.cfg.sun) + " ชม./วัน"],
         ["Performance Ratio", R.cfg.pr + "%"]]) +
    prm([["ชั่วโมงผลิตไฟเฉลี่ย", n2(R.hrs) + " ชม./วัน"],
         ["ผลิตไฟรายวัน", n2(R.dayKwh) + " หน่วย"],
         ["ผลิตไฟรายปี", n0(R.yearKwh) + " หน่วย"],
         ["ค่าไฟรวมค่า FT", n2(R.cfg.priceOn + R.cfg.ft) + " ฿/หน่วย"],
         ["ค่าไฟขึ้น", R.cfg.up + "% ทุก " + R.cfg.upEvery + " ปี"]]) +
    "</div>" +
    '<table class="rt"><thead><tr><th class="c">ปีที่</th><th class="c">ประสิทธิภาพ</th>' +
    '<th class="r">หน่วยที่ผลิตได้</th><th class="r">ค่าไฟ/หน่วย</th>' +
    '<th class="r">ค่าไฟที่ประหยัด</th><th class="r">ยอดสะสม</th><th style="width:58px"></th></tr></thead><tbody>' +
    R.rows.map((r) => {
      const hit = R.payback && r.y === R.payback.y + (R.payback.m ? 1 : 0);
      return '<tr' + (hit ? ' class="hit"' : "") + '><td class="c">' + r.y + '</td><td class="c">' +
        (Math.round(r.eff * 10000) / 100).toFixed(2) + '%</td><td class="r">' + n0(r.prod) +
        '</td><td class="r">' + (Math.round(r.price * 10000) / 10000).toFixed(4) +
        '</td><td class="r">' + n2(r.save) + '</td><td class="r">' + n2(r.cum) + "</td><td>" +
        (hit ? "คืนทุนปีนี้" : "") + "</td></tr>";
    }).join("") +
    '<tr class="tt"><td class="c">รวม ' + R.cfg.years + ' ปี</td><td></td><td class="r">' + n0(R.total.prod) +
    '</td><td></td><td class="r">' + n2(R.total.save) + '</td><td class="r">' + n2(R.total.save) + "</td><td></td></tr>" +
    "</tbody></table>" +
    '<div class="pgft"><div class="nt">หมายเหตุ · ประสิทธิภาพแผงลดลงปีแรก ' + R.cfg.deg1 + "% หลังจากนั้นปีละ " + R.cfg.deg +
    "% · ค่าไฟอ้างอิงอัตราปัจจุบันรวมค่า FT และคาดการณ์ว่าขึ้น " + R.cfg.up + "% ทุก " + R.cfg.upEvery +
    " ปี · ตัวเลขทั้งหมดเป็นการประมาณการเพื่อใช้ประกอบการตัดสินใจ ไม่ใช่การรับประกันผลผลิต</div>" +
    footHTML + "</div></div>";

  /* ── สรุปผลตอบแทน ── แผ่นที่ลูกค้าเปิดดูก่อนแผ่นอื่นเสมอ ตัวเลขใหญ่ อ่านจบในสิบวินาที */
  const pbTxt = !R ? "" : (R.payback ? R.payback.y + " ปี" + (R.payback.m ? " " + R.payback.m + " เดือน" : "")
    : "เกิน " + R.cfg.years + " ปี");
  const paybackHTML = () => !R ? "" :
    '<div class="dpg">' + sheetHead("สรุปผลตอบแทน", "สรุปผลตอบแทนของระบบที่เสนอ", "") +
    '<div class="kpi">' +
    '<div class="k1"><span class="kl">ระยะเวลาคืนทุน</span><span class="kv">' + pbTxt + "</span></div>" +
    '<div><span class="kl">ลดค่าไฟเดือนละ</span><span class="kv">฿' + n2(R.month1) + "</span></div>" +
    '<div><span class="kl">รายได้รวมทั้งหมด</span><span class="kv">฿' + n0(R.total.save) +
    '</span><span class="ks">' + R.cfg.years + " ปี</span></div>" +
    '<div><span class="kl">กำไรหลังหักเงินลงทุน</span><span class="kv">฿' + n0(R.profit) +
    '</span><span class="ks">' + R.cfg.years + " ปี</span></div>" +
    "</div>" +
    '<div class="prmw">' +
    prm([["ขนาดติดตั้ง", sEsc(R.kwp) + " kWp"],
         ["เงินลงทุน (ก่อน VAT)", n2(R.invest) + " บาท"],
         ["ผลิตไฟรายวัน", n2(R.dayKwh) + " หน่วย"],
         ["ผลิตไฟรายปี", n0(R.yearKwh) + " หน่วย"]]) +
    prm([["ค่าไฟรวมค่า FT", n2(R.cfg.priceOn + R.cfg.ft) + " ฿/หน่วย"],
         ["มูลค่าไฟที่ผลิตได้", n2(R.day1) + " บาท/วัน"],
         ["รวม " + R.cfg.years + " ปี", n0(R.total.prod) + " หน่วย"],
         ["ราคาต่อวัตต์", n2(R.perW) + " บาท"]]) +
    "</div>" +
    '<table class="rt"><thead><tr><th class="c">ปีที่</th><th class="c">ประสิทธิภาพ</th>' +
    '<th class="r">หน่วยที่ผลิตได้</th><th class="r">ค่าไฟที่ประหยัด</th><th class="r">ยอดสะสม</th>' +
    '<th style="width:58px"></th></tr></thead><tbody>' +
    R.rows.slice(0, 10).map((r) => {
      const hit = R.payback && r.y === R.payback.y + (R.payback.m ? 1 : 0);
      return '<tr' + (hit ? ' class="hit"' : "") + '><td class="c">' + r.y + '</td><td class="c">' +
        (Math.round(r.eff * 10000) / 100).toFixed(2) + '%</td><td class="r">' + n0(r.prod) +
        '</td><td class="r">' + n2(r.save) + '</td><td class="r">' + n2(r.cum) + "</td><td>" +
        (hit ? "คืนทุนปีนี้" : "") + "</td></tr>";
    }).join("") + "</tbody></table>" +
    '<div class="pgft"><div class="nt">หมายเหตุ · ตัวเลขคิดจากสมมุติฐานในแผ่นวิเคราะห์ผลตอบแทน ' +
    "เป็นการประมาณการเพื่อประกอบการตัดสินใจ ไม่ใช่การรับประกันผลผลิตหรือรายได้</div>" + footHTML + "</div></div>";

  /* ฟอนต์ไทยไม่มีตัวอักษรจีน — ภาษาจีนต้องโหลด Noto Sans SC เพิ่ม ไม่งั้นได้สี่เหลี่ยมทั้งใบ */
  const fontStack = window.pgFontStack ? window.pgFontStack(L) : "'IBM Plex Sans Thai',sans-serif";
  const doc = '<!doctype html><html lang="' + L + '"><head><meta charset="utf-8">' +
    "<title>ใบเสนอราคา " + sEsc(q.no) + "</title>" +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    (window.pgFontLink ? window.pgFontLink(L) : "") +
    "<style>" +
    "@page{size:A4;margin:14mm}" +
    "*{box-sizing:border-box}" +
    "body{font-family:" + fontStack + ";color:#111827;font-size:12px;margin:0;line-height:1.55;" +
      "-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    ".hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1B9B75;padding-bottom:12px;margin-bottom:16px}" +
    ".bd{font-size:20px;font-weight:700;color:#0A4D68;letter-spacing:.02em}" +
    ".bs{font-size:11px;color:#6b7280;margin-top:2px}" +
    ".bl{color:#374151;font-weight:600;margin-top:5px}" +
    ".ti{text-align:right}.ti h1{font-size:19px;margin:0;color:#111827}" +
    ".ti .no{font-size:12px;color:#374151;margin-top:3px}" +
    ".two{display:flex;gap:14px;margin-bottom:14px}" +
    ".two>div{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px}" +
    ".two h3,.blk h3{font-size:11px;margin:0 0 6px;color:#0A4D68;letter-spacing:.04em}" +
    ".kv{display:flex;gap:6px;font-size:11.5px}.kv b{min-width:58px;color:#6b7280;font-weight:500}" +
    "table{width:100%;border-collapse:collapse;font-size:11.5px}" +
    "th{background:#0A4D68;color:#fff;padding:7px 8px;text-align:left;font-weight:600;font-size:11px}" +
    "td{padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}" +
    ".c{text-align:center}.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}" +
    ".dt{color:#6b7280;font-size:10.5px;margin-top:2px;line-height:1.45}" +
    ".shpg{page-break-before:always;break-before:page;padding-top:6mm}" +
    ".shpg h3{font-size:12px;color:#0A4D68;margin:0 0 8px}" +
    ".shpg .shsub{font-size:11px;color:#6b7280;margin:-4px 0 10px}" +
    ".shls{margin:0;padding-left:18px}.shls li{margin-bottom:4px}" +
    ".shls .pdf{color:#6b7280;font-size:10.5px}" +
    ".blk .pdf{color:#6b7280;font-size:10.5px}" +
    ".shimg{width:100%;height:auto;max-height:248mm;object-fit:contain;border:1px solid #e5e7eb;border-radius:6px}" +
    ".sum{margin-top:12px;margin-left:auto;width:290px}" +
    ".sum td{border:0;padding:4px 8px}.sum .big td{border-top:2px solid #0A4D68;font-weight:700;font-size:14px;color:#0A4D68;padding-top:8px}" +
    ".blk{margin-top:14px;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;break-inside:avoid}" +
    ".blk ul{margin:0;padding-left:18px}.blk li{margin-bottom:3px}" +
    ".note{margin-top:12px;font-size:11px;color:#374151;white-space:pre-wrap}" +
    ".vbx{margin-top:14px;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;break-inside:avoid}" +
    ".vbx h3{font-size:11px;margin:0 0 6px;color:#0A4D68;letter-spacing:.04em}" +
    ".vbx .vl{font-size:11.5px;color:#374151;white-space:pre-wrap}" +
    /* หน้าแรกสูงเต็มพื้นที่พิมพ์ของ A4 (297mm − ขอบบน/ล่าง 14mm) แล้วดัน .pgft ลงไปชิดขอบล่าง
       ราคากับลายเซ็นจะได้อยู่ที่เดิมทุกใบ ไม่ลอยตามจำนวนรายการ */
    ".pg1{display:flex;flex-direction:column;min-height:269mm}" +
    ".pgft{margin-top:auto}" +
    ".tmpg{page-break-before:always;break-before:page;display:flex;flex-direction:column;min-height:269mm}" +
    ".tmpg .ft{margin-top:auto}" +
    ".tmpg h2{font-size:13px;color:#0A4D68;margin:0 0 2px}" +
    ".tmpg .sub{font-size:11px;color:#6b7280;margin-bottom:10px}" +
    ".sig{display:flex;gap:40px;margin-top:34px;break-inside:avoid}" +
    ".sig>div{flex:1;text-align:center}.sig .ln{border-top:1px solid #9ca3af;margin:34px 10px 6px}" +
    ".sig .rl{font-size:11px;color:#6b7280}" +
    ".ft{margin-top:16px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}" +
    /* ── แผ่นเพิ่มเติมในชุดเอกสาร ── ทุกแผ่นขึ้นกระดาษใหม่และสูงเต็มหน้าเหมือนแผ่นแนบเดิม */
    ".dpg{page-break-before:always;break-before:page;display:flex;flex-direction:column;min-height:269mm}" +
    ".dpg h2{font-size:13px;color:#0A4D68;margin:0 0 2px}" +
    ".dpg .sub{font-size:11px;color:#6b7280;margin-bottom:10px}" +
    ".brk{page-break-before:always;break-before:page}" +
    /* หน้าปก */
    ".cv{display:flex;flex-direction:column;min-height:269mm}" +
    ".cvh{border-bottom:3px solid #1B9B75;padding-bottom:12px}" +
    ".cvhero{flex:1;margin:14mm 0;display:flex;flex-direction:column;justify-content:center}" +
    ".cvk{font-size:11.5px;font-weight:700;letter-spacing:.24em;color:#1B9B75;text-transform:uppercase}" +
    ".cvt{font-size:34px;line-height:1.24;margin:10px 0 0;color:#0A4D68;font-weight:700;max-width:135mm}" +
    ".cvline{width:76px;height:4px;border-radius:2px;margin:20px 0 26px;" +
      "background:linear-gradient(90deg,#0A4D68 0%,#1B9B75 100%)}" +
    ".cvto{font-size:10.5px;letter-spacing:.18em;color:#9ca3af;text-transform:uppercase}" +
    ".cvcu{font-size:23px;font-weight:700;color:#111827;margin-top:5px}" +
    ".cvad{font-size:12px;color:#6b7280;margin-top:4px;max-width:120mm}" +
    ".cvrow{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin-top:30px}" +
    ".cvcap{display:inline-flex;align-items:baseline;gap:9px;padding-left:13px;border-left:3px solid #1B9B75}" +
    ".cvcap .cl{font-size:11px;color:#6b7280}" +
    ".cvcap .cn{font-size:32px;font-weight:700;color:#0A4D68;font-variant-numeric:tabular-nums;line-height:1}" +
    ".cvcap .cu{font-size:13px;font-weight:600;color:#1B9B75}" +
    ".cvtag{font-size:11px;color:#1B9B75;font-weight:600;padding-bottom:4px}" +
    /* แผ่นรูปอุปกรณ์ — 2 คอลัมน์ 2 แถว รูปสัดส่วนเดิมไม่ยืด */
    ".wl{line-height:1.45}.wl+.wl{margin-top:2px}" +
    ".pc{padding:3px 4px}.pc img{width:66px;height:42px;object-fit:contain;display:block;margin:0 auto}" +
    ".fit{min-height:0}" +
    ".cvf{display:flex;flex-wrap:wrap;gap:8px 26px;border-top:1px solid #e5e7eb;padding-top:10px}" +
    ".cvf div{font-size:11.5px;color:#374151}.cvf span{color:#9ca3af;margin-right:6px}" +
    /* ตารางพารามิเตอร์ 2 คอลัมน์ */
    ".prmw{display:flex;gap:14px;margin-bottom:8px}.prmw>table{flex:1}" +
    ".prm{font-size:11px}.prm td{padding:2.8px 9px;border-bottom:1px solid #e5e7eb;color:#374151}" +
    ".prm tr:nth-child(odd) td{background:#f9fafb}" +
    /* ตารางคืนทุน — 30 บรรทัดต้องจบในหน้าเดียว ตัวเล็กแต่ยังอ่านออกตอนพิมพ์ */
    ".rt{font-size:9px}.rt th{padding:3px 6px;font-size:8.8px}.rt td{padding:1px 6px;line-height:1.3}" +
    ".rt .hit td{background:#ECFDF5;font-weight:700;color:#065F46}" +
    ".rt .tt td{background:#0A4D68;color:#fff;font-weight:700;border:0}" +
    /* การ์ดตัวเลขใหญ่ในแผ่นสรุป */
    ".kpi{display:flex;gap:10px;margin-bottom:14px}" +
    ".kpi>div{flex:1;border:1px solid #d1d5db;border-radius:9px;padding:11px 12px}" +
    ".kpi .k1{border-color:#1B9B75;background:#F0FDF9}" +
    ".kpi .kl{display:block;font-size:10px;color:#6b7280}" +
    ".kpi .kv{display:block;font-size:19px;font-weight:700;color:#0A4D68;margin-top:3px;" +
      "font-variant-numeric:tabular-nums;line-height:1.2}" +
    ".kpi .ks{display:block;font-size:9.5px;color:#9ca3af}" +
    ".nt{font-size:9.2px;color:#6b7280;line-height:1.45;margin-top:7px}" +
    "</style></head><body>" +
    (quotePageOn(q, "cover") ? coverHTML() : "") +
    '<div class="pg1' + (quotePageOn(q, "cover") ? " brk" : "") + '">' + headHTML("ใบเสนอราคา") +
    '<div class="two"><div><h3>ลูกค้า</h3>' +
    '<div class="kv"><b>ชื่อ</b><span>' + sEsc(c.name || "—") + "</span></div>" +
    '<div class="kv"><b>โทร</b><span>' + sEsc(c.phone || "—") + "</span></div>" +
    '<div class="kv"><b>ที่อยู่</b><span>' + sEsc((c.address || "") + (c.province ? " " + c.province : "") || "—") + "</span></div></div>" +
    "<div><h3>รายละเอียดข้อเสนอ</h3>" +
    '<div class="kv"><b>ขนาด</b><span>' + (q.kwp ? sEsc(q.kwp) + " kWp" : "—") + "</span></div>" +
    '<div class="kv"><b>อ้างอิง</b><span>' + sEsc(q.refCode || "—") + "</span></div>" +
    '<div class="kv"><b>ผู้เสนอ</b><span>' + sEsc(q.ownerName || q.byName || "—") + "</span></div></div></div>" +
    "<table><thead><tr><th class=\"c\" style=\"width:26px\">#</th><th>รายการ</th>" +
    "<th class=\"c\" style=\"width:46px\">จำนวน</th><th class=\"c\" style=\"width:52px\">หน่วย</th>" +
    "<th class=\"r\" style=\"width:88px\">ราคา/หน่วย</th><th class=\"r\" style=\"width:96px\">จำนวนเงิน</th></tr></thead>" +
    "<tbody>" + (rows || '<tr><td colspan="6" class="c">— ยังไม่มีรายการ —</td></tr>') + "</tbody></table>" +
    '<div class="pgft">' +
    '<table class="sum">' + money("รวมเป็นเงิน", T.sub) +
    (T.disc > 0 ? money(T.discMode === "pct" ? "หักส่วนลด " + T.discPct + "%" : "หักส่วนลด", T.disc)
      + money("ราคาหลังหักส่วนลด", T.afterDisc) : "") +
    money("ภาษีมูลค่าเพิ่ม " + T.vatRate + "%", T.vat) +
    money("ราคารวมทั้งสิ้น", T.grand, true) + "</table>" +
    /* ช่องยืนราคา — เดิมเป็นบรรทัดเล็ก ๆ ลอยอยู่ ลูกค้ามองข้าม
       ทำเป็นช่องให้เห็นชัดว่าราคานี้มีวันหมดอายุ และเว้นที่ให้เขียนวันครบกำหนดด้วยมือได้ */
    '<div class="vbx"><h3>การยืนราคา</h3>' +
    '<div class="vl">' + (valid ? sEsc(valid) : "ยืนราคาตามที่ตกลงกัน") + "</div>" +
    (q.note ? '<div class="vl" style="margin-top:6px">หมายเหตุ: ' + sEsc(q.note) + "</div>" : "") +
    "</div>" +
    '<div class="sig"><div><div class="ln"></div><div class="rl">ผู้เสนอราคา · ' + sEsc(q.ownerName || q.byName || "") +
    '</div></div><div><div class="ln"></div><div class="rl">ผู้อนุมัติ / ลูกค้า</div>' +
    '<div class="rl">วันที่ ______ / ______ / ______</div></div></div>' +
    /* ท้ายใบบอกขอบเขตงานที่บริษัททำ — ย้ายมาจากหัวใบ หัวใบจะได้เหลือแต่ตัวตนนิติบุคคลล้วน ๆ */
    footHTML +
    "</div></div>" +
    /* เงื่อนไขชำระเงิน + การรับประกัน ขึ้นแผ่นใหม่
       หน้าแรกจะได้เหลือแค่ของกับราคา ลูกค้าเซ็นจบในแผ่นเดียว ส่วนเงื่อนไขอ่านต่อแผ่นหลังได้เต็ม ๆ */
    (quotePageOn(q, "terms") && (termList(q.terms, T.grand) || list(q.warranties, "การรับประกันและบริการ") || shList)
      ? '<div class="tmpg">' + headHTML("เอกสารแนบ") +
        "<h2>เงื่อนไขการชำระเงินและการรับประกัน</h2>" +
        '<div class="sub">แนบท้ายใบเสนอราคาเลขที่ ' + sEsc(q.no) + " · " + sEsc(c.name || "") + "</div>" +
        termList(q.terms, T.grand) + list(q.warranties, "การรับประกันและบริการ") + shList + footHTML + "</div>"
      : "") +
    (quotePageOn(q, "boq") ? boqHTML() : "") +
    (quotePageOn(q, "wty") ? wtyHTML() : "") +
    (quotePageOn(q, "cash") ? cashHTML() : "") +
    (quotePageOn(q, "payback") ? paybackHTML() : "") +
    shPages +
    "</body></html>";
  return window.pgDocHTML ? window.pgDocHTML(doc, L, QUOTE_I18N) : doc;
}

/* ============================================================
   QuoteEditor — โมดัลทำ/แก้ใบเสนอราคา
   ============================================================ */
/* ── เลือก DATA SHEET ที่จะแนบไปกับใบเสนอราคา ──
   ไม่ได้แนบทุกใบทุกครั้ง — บางงานลูกค้าขอเฉพาะสเปกแผง บางงานขอของอินเวอร์เตอร์ด้วย
   รายการมาจากคลังสินค้า (ชิ้นที่แนบ DATA SHEET ไว้แล้วเท่านั้น) จะได้ไม่ต้องอัปไฟล์ซ้ำทุกใบ
   ชิ้นที่ชื่อ/รุ่นไปโผล่ในรายการที่เสนอ เด้งขึ้นมาก่อน เพราะเป็นตัวที่จะแนบจริงเกือบทุกครั้ง */
/* ── ติ๊กว่าจะออกแผ่นไหน ──
   เรียงตามลำดับที่จะออกจริง คนกดจะได้เห็นหน้าตาเล่มในหัวตรงกับที่พรินต์ออกมา
   แผ่นใบเสนอราคาปิดไม่ได้ — ปิดแล้วเอกสารที่เหลือไม่มีราคาให้อ้างอิง */
function QuotePagePick({ q, locked, onToggle, onAll, warn }) {
  const n = QUOTE_PAGES.filter((p) => quotePageOn(q, p.key)).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>แผ่นที่จะออกไปกับใบนี้</label>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>เลือกไว้ {n} แผ่น</span>
        {!locked && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button type="button" onClick={() => onAll(true)} style={pgQuick}>เปิดทั้งชุด</button>
            <button type="button" onClick={() => onAll(false)} style={pgQuick}>เฉพาะใบเสนอราคา</button>
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 6 }}>
        {QUOTE_PAGES.map((p, i) => {
          const on = quotePageOn(q, p.key);
          const dis = locked || p.lock;
          return (
            <button key={p.key} type="button" disabled={dis} onClick={() => onToggle(p.key)}
              style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", borderRadius: 11,
                border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
                background: on ? "var(--primary-soft)" : "var(--surface)", cursor: dis ? "default" : "pointer",
                fontFamily: "inherit", textAlign: "left", opacity: dis && !on ? .55 : 1 }}>
              <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center",
                border: "1.5px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                background: on ? "var(--primary)" : "transparent" }}>
                {on && <Icon name="check" size={11} color="#fff" sw={3} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--text-3)", marginRight: 5 }}>{i + 1}</span>{p.th}
                </span>
                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.45 }}>{p.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      {warn && (
        <div style={{ fontSize: 11.5, color: "#B45309", background: "var(--tint-amber-bg)", border: "1px solid #F59E0B55",
          borderRadius: 10, padding: "8px 11px", lineHeight: 1.6 }}>{warn}</div>
      )}
    </div>
  );
}
const pgQuick = { padding: "5px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
  cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700, color: "var(--text-2)" };

/* ── ตารางเล็ก ๆ ในเอกสาร (BOQ · ตารางรับประกัน) ──
   คอลัมน์ไม่เหมือนกัน แต่การแก้เหมือนกันหมด จึงเขียนตัวเดียวแล้วส่ง cols เข้าไป */
/* รูปประจำแถวในตารางรับประกัน — หยิบจากคลังกลางใบเดียวกับแผ่นรูป ไม่ได้อัปแยก
   กดที่ช่องแล้วเลือกจากคลัง ไม่มีรูปที่อยากได้ค่อยไปเพิ่มที่หัวข้อ "รูปอุปกรณ์" */
function QuoteRowPic({ lib, id, locked, onPick }) {
  const [open, setOpen] = React.useState(false);
  const pics = (lib && lib.pics) || [];
  const cur = pics.find((p) => p.id === id);
  return (
    <div style={{ position: "relative" }}>
      <button type="button" disabled={locked} title={cur ? cur.name || "เปลี่ยนรูป" : "เลือกรูปจากคลัง"}
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", height: 34, padding: 0, borderRadius: 8, overflow: "hidden", display: "grid", placeItems: "center",
          border: "1px solid " + (cur ? "var(--primary)" : "var(--border-strong)"), background: "var(--surface)",
          cursor: locked ? "default" : "pointer" }}>
        {cur ? <img src={cur.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <Icon name="image" size={14} color="var(--text-3)" />}
      </button>
      {open && !locked && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", zIndex: 41, top: 38, left: 0, width: 232, padding: 8, borderRadius: 11,
            border: "1px solid var(--border-strong)", background: "var(--surface)", boxShadow: "0 18px 44px rgba(8,20,14,.22)" }}>
            {pics.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
                คลังยังว่าง — เพิ่มรูปที่หัวข้อ “คลังรูปอุปกรณ์” ด้านล่างก่อน
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, maxHeight: 186, overflowY: "auto" }}>
                {pics.map((p) => (
                  <img key={p.id} src={p.thumb} alt="" title={p.name || ""}
                    onClick={() => { onPick(p.id); setOpen(false); }}
                    style={{ width: "100%", height: 44, objectFit: "cover", display: "block", cursor: "pointer", borderRadius: 7,
                      border: "2px solid " + (p.id === id ? "var(--primary)" : "transparent") }} />
                ))}
              </div>
            )}
            {cur && (
              <button type="button" onClick={() => { onPick(""); setOpen(false); }}
                style={Object.assign({}, pgQuick, { marginTop: 7, width: "100%" })}>เอารูปออก</button>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function QuoteRowsEdit({ title, hint, cols, rows, locked, onChange, onSeed, seedLabel, picLib }) {
  const a = rows || [];
  const grid = cols.map((c) => c.w).join(" ") + (locked ? "" : " 30px");
  const setCell = (i, k, v) => onChange(a.map((r, j) => j === i ? Object.assign({}, r, { [k]: v }) : r));
  const cell = { padding: "7px 8px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
    color: "var(--text-1)", fontFamily: "inherit", fontSize: 12, width: "100%", minWidth: 0 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>{title}</label>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</span>
        {!locked && onSeed && (
          <button type="button" onClick={onSeed} style={Object.assign({}, pgQuick, { marginLeft: "auto", color: "var(--primary-dark)" })}>
            {seedLabel || "ตั้งรายการใหม่จากสเปก"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {a.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: grid, gap: 6, alignItems: "center" }}>
            {cols.map((c) => (c.pic ? (
              <QuoteRowPic key={c.key} lib={picLib} id={r[c.key] || ""} locked={locked} onPick={(v) => setCell(i, c.key, v)} />
            ) : (
              <input key={c.key} value={r[c.key] == null ? "" : r[c.key]} disabled={locked} placeholder={c.ph || ""}
                type={c.num ? "number" : "text"}
                onChange={(e) => setCell(i, c.key, c.num ? (e.target.value === "" ? "" : +e.target.value) : e.target.value)}
                style={Object.assign({}, cell, c.num ? { textAlign: "right", fontVariantNumeric: "tabular-nums" } : null,
                  c.key === "name" ? { fontWeight: 600 } : null)} />
            )))}
            {!locked && (
              <button type="button" onClick={() => onChange(a.filter((_, j) => j !== i))} title="ลบบรรทัดนี้"
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: "pointer", display: "grid", placeItems: "center" }}>
                <Icon name="trash" size={13} color="#EF4444" />
              </button>
            )}
          </div>
        ))}
        {a.length === 0 && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่มีบรรทัด — กดปุ่มด้านบนให้ระบบตั้งรายการให้จากสเปกในใบนี้</div>
        )}
      </div>
      {!locked && (
        <button type="button" onClick={() => onChange(a.concat([cols.reduce((o, c) => Object.assign(o, { [c.key]: c.num && !c.pic ? 1 : "" }), {})]))}
          style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "none",
            border: "1px dashed var(--border-strong)", borderRadius: 10, padding: "7px 12px", cursor: "pointer",
            fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
          <Icon name="plus" size={13} color="var(--text-2)" /> เพิ่มบรรทัด
        </button>
      )}
    </div>
  );
}

/* ── สมมุติฐานที่ใช้คิดคืนทุน ──
   ค่าตั้งต้นคือค่าที่ทีมขายใช้คุยกับลูกค้าอยู่แล้ว งานที่มีเงื่อนไขต่างไป (ค่าไฟโรงงาน · แดดภาคใต้)
   ค่อยแก้ทีละช่อง แก้แล้วผลในแผ่นเอกสารเปลี่ยนตามทันที */
function QuoteRoiEdit({ q, locked, onChange }) {
  const cfg = quoteRoiCfg(q);
  const raw = q.roi || {};
  const R = (+q.kwp > 0 && quoteTotals(q).afterDisc > 0) ? quoteRoi(q) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 13, padding: 13 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>สมมุติฐานที่ใช้คิดผลตอบแทน</label>
        {!locked && Object.keys(raw).length > 0 && (
          <button type="button" onClick={() => onChange({})} style={Object.assign({}, pgQuick, { marginLeft: "auto" })}>คืนค่าตั้งต้น</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(132px,1fr))", gap: 8 }}>
        {QUOTE_ROI_FLD.map((f) => (
          <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{f.th} <span style={{ color: "var(--border-strong)" }}>· {f.unit}</span></span>
            <input type="number" value={raw[f.key] == null || raw[f.key] === "" ? "" : raw[f.key]} disabled={locked}
              placeholder={String(QUOTE_ROI_DEF[f.key])}
              onChange={(e) => onChange(Object.assign({}, raw, { [f.key]: e.target.value === "" ? "" : +e.target.value }))}
              style={{ padding: "7px 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)",
                color: "var(--text-1)", fontFamily: "inherit", fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums", width: "100%" }} />
          </div>
        ))}
      </div>
      {R ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", paddingTop: 4, borderTop: "1px solid var(--border)" }}>
          {[["ผลิตไฟรายปี", Math.round(R.yearKwh).toLocaleString() + " หน่วย"],
            ["คืนทุน", R.payback ? R.payback.y + " ปี" + (R.payback.m ? " " + R.payback.m + " เดือน" : "") : "เกิน " + cfg.years + " ปี"],
            ["ลดค่าไฟเดือนละ", "฿" + sBaht(R.month1)],
            ["กำไร " + cfg.years + " ปี", "฿" + Math.round(R.profit).toLocaleString()]].map((x) => (
            <span key={x[0]} style={{ fontSize: 11.5, color: "var(--text-3)" }}>
              {x[0]} <b style={{ color: "var(--primary-dark)", fontFamily: "var(--mono)" }}>{x[1]}</b>
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: "#B45309" }}>ต้องมีทั้งขนาดระบบ (kWp) และราคาในใบ ระบบจึงจะคิดผลตอบแทนได้</div>
      )}
    </div>
  );
}

/* ── คลังรูปอุปกรณ์ ──
   อัปรูปเข้าคลังครั้งเดียว ใบไหนอยากได้ก็ติ๊กเอา — รูปแผงกับอินเวอร์เตอร์ชุดเดิม
   ถูกแนบซ้ำแทบทุกใบอยู่แล้ว ไม่มีเหตุให้ต้องอัปใหม่ทุกครั้ง
   ชื่อใต้รูปเป็นคำบรรยายที่จะไปขึ้นในเอกสาร แก้ที่นี่ที่เดียวแล้วเปลี่ยนทุกใบที่ใช้รูปนั้น */
function QuotePicPick({ lib, locked }) {
  const fileRef = React.useRef(null);
  const pick = (e) => {
    const files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = "";
    files.reduce((p, f) => p.then(() => Promise.resolve(lib.add(f))), Promise.resolve());
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>คลังรูปอุปกรณ์</label>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
          {lib.pics.length} รูป · หยิบไปใส่ช่องรูปในตารางรับประกันด้านบน · ใช้ซ้ำได้ทุกใบ
        </span>
        {!locked && (
          <button type="button" disabled={lib.busy} onClick={() => fileRef.current && fileRef.current.click()}
            style={Object.assign({}, pgQuick, { marginLeft: "auto", color: "var(--primary-dark)" })}>
            {lib.busy ? "กำลังอัปรูป…" : "+ เพิ่มรูปเข้าคลัง"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={pick} style={{ display: "none" }} />
      </div>
      {lib.pics.length === 0 ? (
        <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
          ยังไม่มีรูปในคลัง — กด “เพิ่มรูปเข้าคลัง” อัปรูปแผง อินเวอร์เตอร์ ตู้ไฟ ไว้ก่อน
          แล้วค่อยกดช่องรูปในตารางรับประกันเลือกไปใช้
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(132px,1fr))", gap: 8 }}>
          {lib.pics.map((p) => {
            return (
              <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 11,
                overflow: "hidden", background: "var(--surface)" }}>
                <div style={{ position: "relative" }}>
                  <img src={p.thumb} alt="" style={{ width: "100%", height: 84, objectFit: "cover", display: "block", background: "var(--surface2)" }} />
                  {!locked && (
                    <button type="button" title="ลบรูปนี้ออกจากคลัง"
                      onClick={(e) => { e.stopPropagation(); window.askConfirm({ title: "ลบรูปนี้ออกจากคลัง?",
                        body: "ใบอื่นที่ใช้รูปนี้อยู่จะไม่มีรูปนี้ในเอกสารอีก", ok: "ลบเลย" })
                        .then((ok) => { if (ok) lib.remove(p.id); }); }}
                      style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 7, border: "none",
                        background: "rgba(8,20,14,.45)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <Icon name="trash" size={12} color="#fff" />
                    </button>
                  )}
                </div>
                <input value={p.name || ""} disabled={locked} placeholder="ชื่อใต้รูป"
                  onChange={(e) => lib.rename(p.id, e.target.value)}
                  style={{ width: "100%", border: "none", borderTop: "1px solid var(--border)", background: "transparent",
                    padding: "6px 8px", fontFamily: "inherit", fontSize: 11, color: "var(--text-2)", textAlign: "center" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuoteSheetPick({ ids, items, hintText, locked, onChange }) {
  const [qs, setQs] = React.useState("");
  const sel = ids || [];
  const norm = (x) => String(x || "").trim().toLowerCase();
  const hay = norm(hintText);
  const scored = (items || []).map((it) => {
    const keys = [it.model, it.name].concat(it.aka || []).map(norm).filter(Boolean);
    return { it: it, hit: keys.some((k) => k.length > 2 && hay.indexOf(k) !== -1) };
  });
  /* ตั้งต้นโชว์เฉพาะรุ่นที่ระบุไว้ในใบนี้ (บวกที่เลือกไว้แล้ว)
     คลังมีของเป็นร้อยชิ้น เอามากองให้เลือกหมดทุกครั้งคือให้ไล่หาเองในกองที่ไม่เกี่ยวกับงาน
     อยากได้รุ่นอื่นค่อยพิมพ์ค้นหา — ซึ่งค้นทั้งคลัง */
  const f = norm(qs);
  const shown = scored
    .filter((x) => (f
      ? (norm(x.it.name).indexOf(f) !== -1 || norm(x.it.model).indexOf(f) !== -1)
      : (x.hit || sel.indexOf(x.it.id) !== -1)))
    .sort((a, b) => {
      const sa = (sel.indexOf(a.it.id) !== -1 ? 0 : a.hit ? 1 : 2), sb = (sel.indexOf(b.it.id) !== -1 ? 0 : b.hit ? 1 : 2);
      return sa !== sb ? sa - sb : String(a.it.name || "").localeCompare(String(b.it.name || ""));
    });
  const hitCount = scored.filter((x) => x.hit).length;
  const toggle = (id) => {
    if (locked) return;
    onChange(sel.indexOf(id) !== -1 ? sel.filter((x) => x !== id) : sel.concat([id]));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>DATA SHEET ที่แนบไปกับใบนี้</label>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
          {qs ? "ค้นทั้งคลัง" : "แสดงเฉพาะรุ่นที่ระบุในใบนี้"} · เลือกไว้ {sel.length} ไฟล์
        </span>
      </div>
      {(items || []).length === 0 ? (
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่มีของชิ้นไหนในคลังที่แนบ DATA SHEET ไว้ — ไปแนบที่หน้าคลังสินค้าก่อน</div>
      ) : (
        <React.Fragment>
          <input value={qs} onChange={(e) => setQs(e.target.value)} placeholder="อยากแนบรุ่นอื่นด้วย — พิมพ์ค้นหาจากทั้งคลัง"
            style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 190, overflowY: "auto" }}>
            {shown.map((x) => {
              const on = sel.indexOf(x.it.id) !== -1;
              return (
                <button key={x.it.id} type="button" onClick={() => toggle(x.it.id)} disabled={locked}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 10,
                    border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
                    background: on ? "var(--primary-soft)" : "var(--surface)", cursor: locked ? "default" : "pointer",
                    fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, display: "grid", placeItems: "center",
                    border: "1.5px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                    background: on ? "var(--primary)" : "transparent" }}>
                    {on && <Icon name="check" size={11} color="#fff" sw={3} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{x.it.name}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)" }}>
                      {(x.it.model ? x.it.model + " · " : "") + ((x.it.doc || {}).name || "DATA SHEET")}
                    </span>
                  </span>
                  {x.hit && !on && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--primary-dark)", background: "var(--primary-soft)",
                      padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>อยู่ในใบนี้</span>
                  )}
                </button>
              );
            })}
            {shown.length === 0 && (
              <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                {qs ? "ไม่พบรุ่นที่ค้นหา"
                  : (hitCount === 0 ? "รุ่นที่ระบุในใบนี้ยังไม่มี DATA SHEET ในคลัง — พิมพ์ค้นหาเพื่อเลือกรุ่นอื่นได้" : "")}
              </div>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function QuoteEditor({ quote, job, target, stock, onClose, onSave, onDelete, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [q, setQ] = React.useState(() => Object.assign({}, quote, {
    customer: Object.assign({}, quote.customer),
    items: (quote.items || []).map((x) => Object.assign({}, x)),
    terms: (quote.terms || []).slice(), warranties: (quote.warranties || []).slice(),
  }));
  const [rep, setRep] = React.useState(null);
  /* ภาษาของใบที่จะออก — เลือกก่อนกดดู เอกสารหนึ่งใบมีภาษาเดียว
     จำค่าล่าสุดไว้ทั้งระบบ ออกให้ลูกค้าจีนติดกันหลายใบจะได้ไม่ต้องเลือกใหม่ */
  const [qLang, setQLang] = React.useState(() => (window.pgLang ? window.pgLang() : "th"));

  /* ── DATA SHEET ที่แนบ ──
     เก็บในใบแค่ "รหัสของในคลัง" ไม่ได้ copy ไฟล์เข้าใบ — ไฟล์ใหญ่และต้องอัปเดตที่เดียว
     ตอนจะออกเอกสารค่อยโหลดไฟล์จริงมาประกอบ */
  const sheetItems = ((stock && stock.items) || []).filter((it) => it && it.doc);
  const sheetIds = q.sheetIds || [];
  const [sheetDocs, setSheetDocs] = React.useState([]);
  const sheetKey = sheetIds.join("|");
  React.useEffect(() => {
    let dead = false;
    const picked = sheetItems.filter((it) => sheetIds.indexOf(it.id) !== -1);
    if (!picked.length || !stock || !stock.loadDoc) { setSheetDocs([]); return; }
    Promise.all(picked.map((it) => Promise.resolve(stock.loadDoc(it.id)).then((d) => (d && d.data
      ? { id: it.id, label: it.name + (it.model ? " · " + it.model : ""), name: d.name || it.name,
          dataUrl: d.data, kind: /^data:image/i.test(d.data) ? "image" : "pdf" }
      : null)).catch(() => null)))
      .then((list) => { if (!dead) setSheetDocs(list.filter(Boolean)); });
    return () => { dead = true; };
  }, [sheetKey]);
  /* คลังรูปอุปกรณ์ส่วนกลาง — อยู่นอกตัวใบ ใบไหนก็หยิบไปใช้ได้ */
  const picLib = useQuotePics();

  /* ข้อความที่ใช้เดาว่าใบนี้พูดถึงรุ่นไหนบ้าง — ชื่อกับรายละเอียดของทุกรายการรวมกัน */
  const sheetHint = (q.items || []).map((it) => (it.name || "") + " " + (it.detail || "")).join(" ");

  /* ── เปิดเอกสาร ──
     แปลงหน้า PDF ของ DATA SHEET เป็นรูปก่อน (ใช้เวลาหลักวินาที) แล้วค่อยประกอบเป็นชุดเดียว
     ทำตอนกดดูเท่านั้น ไม่ทำตอนติ๊กเลือก — ติ๊กเล่นไปมาแล้วเครื่องจะหน่วงทุกครั้งโดยไม่ได้ใช้ */
  const [repBusy, setRepBusy] = React.useState(false);
  /* รูปเต็มของช่องรูปในตารางรับประกัน โหลดตอนกดดูเท่านั้น เหมือน DATA SHEET
     เปลี่ยนรูปไปมาในหน้าทำใบจะได้ไม่ต้องดึงไฟล์รูปทุกครั้ง */
  const loadPics = () => {
    const ids = [];
    const push = (id) => { if (id && ids.indexOf(id) === -1) ids.push(id); };
    if (quotePageOn(q, "wty")) (q.wtyRows || []).forEach((r) => push(r && r.pic));
    if (!ids.length) return Promise.resolve([]);
    return Promise.all(ids.map((id) => {
      const meta = picLib.pics.find((p) => p.id === id);
      if (!meta) return null;
      return Promise.resolve(picLib.load(id)).then((d) => (d ? { id: id, name: meta.name, data: d } : null));
    })).then((a) => a.filter(Boolean)).catch(() => []);
  };
  const openDoc = () => {
    setRepBusy(true);
    const shP = !sheetDocs.length ? Promise.resolve([]) : Promise.all(sheetDocs.map((sd) => (sd.kind === "image"
      ? Promise.resolve(Object.assign({}, sd, { pages: [sd.dataUrl], total: 1 }))
      : quotePdfPages(sd.dataUrl)
          .then((r) => Object.assign({}, sd, { pages: r.pages, total: r.total }))
          .catch(() => Object.assign({}, sd, { pages: [] }))))).catch(() => sheetDocs);
    Promise.all([shP, loadPics()])
      .then((r) => { setRep(quoteHTML(q, qLang, r[0], r[1])); })
      .then(() => setRepBusy(false), () => setRepBusy(false));
  };
  const pickQLang = (id) => { setQLang(id); if (window.pgSetLang) window.pgSetLang(id); };
  const T = quoteTotals(q);
  const set = (k, v) => setQ((p) => Object.assign({}, p, { [k]: v }));
  const setCus = (k, v) => setQ((p) => Object.assign({}, p, { customer: Object.assign({}, p.customer, { [k]: v }) }));
  const setItem = (i, k, v) => setQ((p) => { const a = p.items.slice(); a[i] = Object.assign({}, a[i], { [k]: v }); return Object.assign({}, p, { items: a }); });
  const addItem = () => setQ((p) => Object.assign({}, p, {
    items: p.items.concat([{ id: "qi" + Date.now().toString(36), name: "", detail: "", qty: 1, unit: "งาน", price: 0 }]) }));
  const delItem = (i) => setQ((p) => Object.assign({}, p, { items: p.items.filter((_, j) => j !== i) }));

  const locked = q.status === "accepted";   /* ตกลงแล้วห้ามแก้ตัวเลข ไม่งั้นยอดขายที่สรุปไปแล้วจะเพี้ยน */

  /* ดึงราคาขายจาก BOQ ของงาน — เซลล์จะได้ไม่ต้องถามวิศวกรว่าเสนอเท่าไรถึงไม่ขาดทุน */
  const boqSell = job && job.boq && job.boq.pricing ? +job.boq.pricing.sell || 0 : 0;
  const pullBoq = () => {
    if (!boqSell) return;
    setQ((p) => { const a = p.items.slice(); if (!a.length) return p; a[0] = Object.assign({}, a[0], { price: boqSell, qty: 1 }); return Object.assign({}, p, { items: a }); });
  };

  /* ดึงรุ่นอุปกรณ์จากผลสำรวจ — ใบที่ทำไว้ก่อนสำรวจจะได้อัปเดตรุ่นแผง/อินเวอร์เตอร์ตามของจริงได้
     ทับเฉพาะบรรทัดแรก (บรรทัดตัวระบบ) · ราคาที่กรอกไว้ไม่ถูกแตะ */
  const specSrc = target || job || null;
  const canPullSpec = !!specSrc && quoteHasSpec(specSrc);
  const pullSpec = () => {
    if (!canPullSpec) return;
    setQ((p) => {
      const a = p.items.slice(); if (!a.length) return p;
      a[0] = Object.assign({}, a[0], { name: quoteSpecName(specSrc), detail: quoteSpecDetail(specSrc) });
      return Object.assign({}, p, { items: a, kwp: quoteSpec(specSrc).kwp || p.kwp });
    });
  };

  /* ดึงจากแบบ 3D — จำนวนแผงบนผังคือตัวเลขที่จริงที่สุด (วางจริงทีละแผงบนหลังคาจริง)
     แม่นกว่าขนาดที่เซลล์คาดไว้ตอนแรก และไม่ต้องนั่งนับแผงเองแล้วพิมพ์ผิด
     ทับเฉพาะบรรทัดแรก (บรรทัดตัวระบบ) เหมือนปุ่มดึงสเปก · ราคาที่กรอกไว้ไม่ถูกแตะ */
  /* แบบผูกกับเลข id — ลูกค้าที่แปลงเป็นงานแล้ว แบบจะย้ายไปอยู่ที่เลขงาน (ดู movePlan3d)
     จึงถามเลขงานก่อนเสมอ ถ้ายังไม่เป็นงานค่อยใช้เลขลูกค้า */
  const planId = (job && job.id) || (specSrc && specSrc.id) || null;
  const plan3d = useQuotePlan3d(planId);
  const planSum = window.p3PlanSummary ? window.p3PlanSummary(plan3d.saved) : null;
  const pullPlan = () => {
    if (!planSum) return;
    const src = Object.assign({}, specSrc || {}, { kwp: planSum.kwp, panels: planSum.panels });
    /* รุ่นที่เลือกไว้ในจอ 3D ต้องชนะรุ่นในแบบสำรวจ — มันคือรุ่นที่ใช้คิดผังจริง */
    src.survey = Object.assign({}, (specSrc && specSrc.survey) || {}, { sizeKw: planSum.kwp });
    if (planSum.panelModel) src.survey.panelModel = planSum.panelModel;
    if (planSum.invModel) src.survey.invModel = planSum.invModel;
    setQ((p) => {
      const a = p.items.slice(); if (!a.length) return p;
      a[0] = Object.assign({}, a[0], { name: quoteSpecName(src), detail: quoteSpecDetail(src) });
      return Object.assign({}, p, { items: a, kwp: planSum.kwp });
    });
  };

  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const cell = Object.assign({}, inputStyle, { padding: "8px 9px", fontSize: 12.5 });
  const num = Object.assign({}, cell, { textAlign: "right", fontVariantNumeric: "tabular-nums" });

  const setStatus = (to) => {
    const now = new Date().toISOString();
    const extra = to === "sent" ? { sentAt: now } : (to === "accepted" || to === "rejected") ? { decidedAt: now } : {};
    setQ((p) => Object.assign({}, p, extra, { status: to }));
  };

  const save = (extra) => { onSave(Object.assign({}, q, extra || {})); };

  const lineList = (key, title, hint, extra) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={lbl}>{title}</label>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</div>
      <textarea rows={4} value={(q[key] || []).join("\n")} disabled={locked}
        onChange={(e) => set(key, e.target.value.split("\n"))}
        style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.6, fontSize: 12.5 })} />
      {extra}
    </div>
  );

  /* ── เปิด/ปิดแผ่นในชุดเอกสาร ──
     เปิดแผ่น BOQ หรือตารางรับประกันครั้งแรก ตั้งรายการให้เลยจากสเปกในใบ
     ไม่ใช่ให้ไปนั่งพิมพ์เองสิบสามบรรทัดทุกครั้ง (แก้ทีหลังได้ตามปกติ) */
  const pageOn = (k) => quotePageOn(q, k);
  const pagesNow = () => { const o = {}; QUOTE_PAGES.forEach((p) => { o[p.key] = quotePageOn(q, p.key); }); return o; };
  const seedFor = (k, p) => (k === "boq" ? quoteBoqSeed(specSrc || p) : quoteWtySeed(specSrc || p));
  const togglePage = (k) => {
    if (locked) return;
    setQ((p) => {
      const cur = pagesNow(); cur[k] = !cur[k]; cur.quote = true;
      const next = Object.assign({}, p, { pages: cur });
      if ((k === "boq" || k === "wty") && cur[k]) {
        const fld = k === "boq" ? "boqRows" : "wtyRows";
        if (!(p[fld] || []).filter((r) => r && String(r.name || "").trim()).length) next[fld] = seedFor(k, p);
      }
      return next;
    });
  };
  const setAllPages = (on) => {
    if (locked) return;
    setQ((p) => {
      const o = {}; QUOTE_PAGES.forEach((x) => { o[x.key] = on ? true : x.key === "quote"; });
      const next = Object.assign({}, p, { pages: o });
      if (on) {
        if (!(p.boqRows || []).length) next.boqRows = quoteBoqSeed(specSrc || p);
        if (!(p.wtyRows || []).length) next.wtyRows = quoteWtySeed(specSrc || p);
      }
      return next;
    });
  };
  /* คำเตือนที่ต้องเห็นก่อนกดออกเอกสาร — แผ่นที่คิดเลขไม่ได้จะถูกข้ามไปเงียบ ๆ */
  const pageWarn = ((pageOn("cash") || pageOn("payback")) && !(+q.kwp > 0 && T.afterDisc > 0))
    ? "แผ่นคืนทุนกับแผ่นสรุปผลตอบแทนยังออกไม่ได้ — ต้องกรอกขนาดระบบ (kWp) และราคาในใบก่อน ตอนนี้ระบบจะข้ามสองแผ่นนี้ไป"
    : "";

  /* ตารางเงินรายงวด — คิดสดจากยอดท้ายใบทุกครั้งที่แก้ราคาหรือแก้ % จะได้ไม่มีทางค้างเลขเก่า */
  const split = quoteTermSplit(q.terms, T.grand);
  const termMoney = !split.count ? null : (
    <div style={{ marginTop: 3, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "var(--surface)" }}>
      {split.rows.filter((r) => r.pct != null).map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 11px",
          borderTop: i ? "1px solid var(--border)" : "none" }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.line}</span>
          <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{r.pct}%</span>
          <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--mono)", minWidth: 96, textAlign: "right" }}>
            ฿{sBaht(r.amount)}
          </span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 11px", borderTop: "1px solid var(--border-strong)",
        background: split.full ? "var(--surface2)" : "var(--tint-red-bg2)" }}>
        <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: split.full ? "var(--text-2)" : "#EF4444" }}>
          {split.full ? "รวมทุกงวด" : "รวมได้ " + split.pctTotal + "% — ยังไม่ครบ 100% ตรวจตัวเลขในบรรทัดอีกที"}
        </span>
        {split.full && (
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--mono)" }}>฿{sBaht(T.grand)}</span>
        )}
      </div>
    </div>
  );

  return (
    <React.Fragment>
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 118,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(880px,100%)",
          maxHeight: isMobile ? "94dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>

          {/* หัว */}
          <div style={{ padding: "15px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>
                ใบเสนอราคา <span style={{ fontFamily: "var(--mono)", color: "var(--primary-dark)" }}>{q.no}</span>
              </h2>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                {q.customer.name || "ยังไม่ระบุลูกค้า"}{q.refCode ? " · " + q.refCode : ""}
              </div>
            </div>
            {(() => { const s = QUOTE_STATUS_BY[q.status] || QUOTE_STATUS_BY.draft; return (
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.color + "16", padding: "4px 11px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.th}</span>
            ); })()}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
              <Icon name="x" size={16} />
            </button>
          </div>

          <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
            {locked && (
              <div style={{ fontSize: 12, color: "var(--tint-green-tx)", background: "var(--primary-soft)", border: "1px solid var(--primary)", borderRadius: 10, padding: "9px 12px" }}>
                ใบนี้ลูกค้าตกลงแล้ว — แก้ตัวเลขไม่ได้ เพราะยอดขายถูกนับไปแล้ว · ถ้าต้องแก้จริง ให้กด “ย้อนกลับเป็นส่งแล้ว” ก่อน
              </div>
            )}

            {/* ลูกค้า */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 11 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ชื่อลูกค้า</label>
                <input value={q.customer.name || ""} disabled={locked} onChange={(e) => setCus("name", e.target.value)} style={inputStyle} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เบอร์โทร</label>
                <input value={q.customer.phone || ""} disabled={locked} onChange={(e) => setCus("phone", e.target.value)} style={inputStyle} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ที่อยู่หน้างาน</label>
                <input value={q.customer.address || ""} disabled={locked} onChange={(e) => setCus("address", e.target.value)} style={inputStyle} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>kWp</label>
                  <input type="number" value={q.kwp || ""} disabled={locked} onChange={(e) => set("kwp", +e.target.value || 0)} style={inputStyle} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>วันที่</label>
                  <input type="date" value={q.date || ""} disabled={locked} onChange={(e) => set("date", e.target.value)} style={inputStyle} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ยืนราคา (วัน)</label>
                  <input type="number" value={q.validDays || ""} disabled={locked} onChange={(e) => set("validDays", +e.target.value || 0)} style={inputStyle} /></div>
              </div>
            </div>

            {/* รายการ */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <label style={lbl}>รายการที่เสนอ</label>
                {canPullSpec && !locked && (
                  <button onClick={pullSpec} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "none",
                    border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                    fontSize: 11.5, fontWeight: 700, color: "var(--primary-dark)" }}>
                    <Icon name="download" size={13} color="var(--primary-dark)" /> ดึงรุ่นอุปกรณ์จากผลสำรวจ
                  </button>
                )}
                {planSum && !locked && (
                  <button onClick={pullPlan} style={{ marginLeft: canPullSpec ? 0 : "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "none",
                    border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                    fontSize: 11.5, fontWeight: 700, color: "#4F46E5" }}>
                    <Icon name="download" size={13} color="#4F46E5" /> ดึงจากแบบ 3D ({planSum.panels} แผง · {planSum.kwp} kWp)
                  </button>
                )}
                {boqSell > 0 && !locked && (
                  <button onClick={pullBoq} style={{ marginLeft: (canPullSpec || planSum) ? 0 : "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "none",
                    border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                    fontSize: 11.5, fontWeight: 700, color: "var(--primary-dark)" }}>
                    <Icon name="download" size={13} color="var(--primary-dark)" /> ดึงราคาขายจาก BOQ (฿{sBaht(boqSell)})
                  </button>
                )}
              </div>
              {q.items.map((it, i) => (
                <div key={it.id || i} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 11, background: "var(--surface)", display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={it.name || ""} disabled={locked} placeholder="ชื่อรายการ" onChange={(e) => setItem(i, "name", e.target.value)}
                      style={Object.assign({}, cell, { flex: 1, fontWeight: 700 })} />
                    {!locked && (
                      <button onClick={() => delItem(i)} title="ลบรายการนี้"
                        style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Icon name="trash" size={14} color="#EF4444" />
                      </button>
                    )}
                  </div>
                  {/* รายละเอียดเป็นหลายบรรทัดได้ — พอใส่รุ่นอุปกรณ์จริงแล้วข้อความยาวเกินช่องบรรทัดเดียว */}
                  <textarea value={it.detail || ""} disabled={locked} rows={2} placeholder="รายละเอียด (ไม่ใส่ก็ได้)" onChange={(e) => setItem(i, "detail", e.target.value)}
                    style={Object.assign({}, cell, { fontSize: 12, resize: "vertical", lineHeight: 1.5 })} />
                  <div style={{ display: "grid", gridTemplateColumns: "70px 80px 1fr auto", gap: 8, alignItems: "center" }}>
                    <input type="number" value={it.qty} disabled={locked} onChange={(e) => setItem(i, "qty", e.target.value === "" ? "" : +e.target.value)} style={num} />
                    <input value={it.unit || ""} disabled={locked} placeholder="หน่วย" onChange={(e) => setItem(i, "unit", e.target.value)} style={cell} />
                    <input type="number" value={it.price} disabled={locked} onChange={(e) => setItem(i, "price", e.target.value === "" ? "" : +e.target.value)} style={num} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", minWidth: 96, textAlign: "right" }}>
                      ฿{sBaht((+it.qty || 0) * (+it.price || 0))}
                    </span>
                  </div>
                </div>
              ))}
              {!locked && (
                <button onClick={addItem} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "none",
                  border: "1px dashed var(--border-strong)", borderRadius: 10, padding: "8px 13px", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>
                  <Icon name="plus" size={14} color="var(--text-2)" /> เพิ่มรายการ
                </button>
              )}
            </div>

            {/* ยอดรวม */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {[["รวมเป็นเงิน", T.sub]].map((r) => (
                <div key={r[0]} style={{ display: "flex", fontSize: 13, color: "var(--text-2)" }}>
                  <span style={{ flex: 1 }}>{r[0]}</span>
                  <b style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-1)" }}>฿{sBaht(r[1])}</b>
                </div>
              ))}
              {/* ส่วนลดกรอกได้ทั้งเป็นบาทและเป็น % — เก็บคนละช่อง สลับโหมดแล้วเลขเดิมไม่หาย */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-2)", flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 90 }}>หักส่วนลด</span>
                <span style={{ display: "flex", gap: 3, padding: 3, borderRadius: 9, background: "var(--surface2)", flexShrink: 0 }}>
                  {[["baht", "บาท"], ["pct", "%"]].map((m) => (
                    <button key={m[0]} type="button" disabled={locked} onClick={() => set("discountMode", m[0])}
                      style={{ padding: "4px 11px", borderRadius: 7, border: "none", cursor: locked ? "default" : "pointer",
                        fontFamily: "inherit", fontSize: 11.5, fontWeight: 700,
                        background: (q.discountMode === "pct" ? "pct" : "baht") === m[0] ? "var(--surface)" : "transparent",
                        color: (q.discountMode === "pct" ? "pct" : "baht") === m[0] ? "var(--primary-dark)" : "var(--text-3)",
                        boxShadow: (q.discountMode === "pct" ? "pct" : "baht") === m[0] ? "0 1px 3px rgba(8,20,14,.12)" : "none" }}>{m[1]}</button>
                  ))}
                </span>
                {q.discountMode === "pct"
                  ? <input type="number" value={q.discountPct != null ? q.discountPct : ""} disabled={locked} placeholder="0"
                      onChange={(e) => set("discountPct", e.target.value === "" ? "" : +e.target.value)}
                      style={Object.assign({}, num, { width: 110 })} />
                  : <input type="number" value={q.discount != null ? q.discount : ""} disabled={locked} placeholder="0"
                      onChange={(e) => set("discount", e.target.value === "" ? "" : +e.target.value)}
                      style={Object.assign({}, num, { width: 130 })} />}
              </div>
              {T.disc > 0 && (
                <div style={{ display: "flex", fontSize: 12.5, color: "var(--text-3)" }}>
                  <span style={{ flex: 1 }}>
                    ลดแล้ว{T.discMode === "pct" ? " (" + T.discPct + "% ของ ฿" + sBaht(T.sub) + ")" : ""}
                  </span>
                  <b style={{ fontVariantNumeric: "tabular-nums", color: "#EF4444" }}>− ฿{sBaht(T.disc)}</b>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-2)" }}>
                <span style={{ flex: 1 }}>ภาษีมูลค่าเพิ่ม (%)</span>
                <input type="number" value={q.vat} disabled={locked} onChange={(e) => set("vat", e.target.value === "" ? "" : +e.target.value)}
                  style={Object.assign({}, num, { width: 130 })} />
              </div>
              <div style={{ display: "flex", fontSize: 13, color: "var(--text-2)" }}>
                <span style={{ flex: 1 }}>ภาษีมูลค่าเพิ่ม {T.vatRate}%</span>
                <b style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-1)" }}>฿{sBaht(T.vat)}</b>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, borderTop: "2px solid var(--primary)", paddingTop: 10 }}>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ราคารวมทั้งสิ้น</span>
                <b style={{ fontSize: 21, fontWeight: 800, color: "var(--primary-dark)", fontVariantNumeric: "tabular-nums", fontFamily: "var(--display)" }}>฿{sBaht(T.grand)}</b>
              </div>
              {q.kwp > 0 && T.grand > 0 && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "right" }}>
                  ≈ ฿{sBaht(T.grand / (q.kwp * 1000))} ต่อวัตต์ · ฿{sBaht(T.grand / q.kwp)} ต่อ kWp
                </div>
              )}
            </div>

            {lineList("terms", "เงื่อนไขการชำระเงิน", "บรรทัดละ 1 งวด · ใส่ % ไว้ในบรรทัด ระบบจะคิดเป็นเงินให้เอง", termMoney)}
            {lineList("warranties", "การรับประกันและบริการ", "บรรทัดละ 1 ข้อ")}
            <QuotePagePick q={q} locked={locked} onToggle={togglePage} onAll={setAllPages} warn={pageWarn} />
            {pageOn("boq") && (
              <QuoteRowsEdit title="รายการในแผ่น BOQ" hint="ขอบเขตงานที่ลูกค้าจะได้ · ไม่มีราคาทีละบรรทัด"
                cols={[{ key: "name", w: "1fr", ph: "ชื่อรายการ" }, { key: "qty", w: "72px", num: true }, { key: "unit", w: "78px", ph: "หน่วย" }]}
                rows={q.boqRows || []} locked={locked} onChange={(v) => set("boqRows", v)}
                onSeed={() => set("boqRows", quoteBoqSeed(specSrc || q))} />
            )}
            {pageOn("wty") && (
              <QuoteRowsEdit title="ตารางรับประกันอุปกรณ์" hint="อุปกรณ์ทีละรายการ · ใส่รูปข้างชื่อได้ · ช่องรับประกันคั่นด้วย · เพื่อขึ้นบรรทัดใหม่"
                cols={[{ key: "pic", w: "52px", pic: true }, { key: "name", w: "1fr", ph: "ชื่ออุปกรณ์" },
                  { key: "qty", w: "62px", num: true },
                  { key: "unit", w: "72px", ph: "หน่วย" }, { key: "yr", w: "170px", ph: "5 ปี · 30 ปี (ประสิทธิภาพ)" }]}
                rows={q.wtyRows || []} locked={locked} onChange={(v) => set("wtyRows", v)} picLib={picLib}
                onSeed={() => set("wtyRows", quoteWtySeed(specSrc || q))} />
            )}
            {(pageOn("cash") || pageOn("payback")) && (
              <QuoteRoiEdit q={q} locked={locked} onChange={(v) => set("roi", v)} />
            )}
            {pageOn("wty") && <QuotePicPick lib={picLib} locked={locked} />}
            <QuoteSheetPick ids={sheetIds} items={sheetItems} hintText={sheetHint} locked={locked}
              onChange={(v) => set("sheetIds", v)} />
            {/* ไฟล์ PDF พิมพ์รวมในใบเสนอราคาไม่ได้ (ข้อจำกัดของเบราว์เซอร์) — เปิดไปสั่งพิมพ์แยกแล้วแนบท้าย */}
            {sheetDocs.length > 0 && (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>เปิดไฟล์ไปสั่งพิมพ์แนบท้าย:</span>
                {sheetDocs.map((sd) => (
                  <button key={sd.id} type="button" onClick={() => {
                    try {
                      const url = window.dataUrlToBlobUrl ? window.dataUrlToBlobUrl(sd.dataUrl) : sd.dataUrl;
                      window.open(url, "_blank", "noopener");
                    } catch (e) { window.open(sd.dataUrl, "_blank", "noopener"); }
                  }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8,
                    border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>
                    <Icon name="file" size={13} color={sd.kind === "image" ? "var(--primary-dark)" : "#EF4444"} /> {sd.label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={lbl}>หมายเหตุ</label>
              <textarea rows={2} value={q.note || ""} disabled={locked} onChange={(e) => set("note", e.target.value)}
                style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
            </div>
          </div>

          {/* ท้าย */}
          <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
            borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
            {typeof window.LangPick === "function" && (
              <span style={{ flexBasis: "100%", marginBottom: 4 }}>
                <window.LangPick value={qLang} onChange={pickQLang} />
              </span>
            )}
            <button onClick={openDoc} disabled={repBusy} style={qBtn()}>
              <Icon name="file" size={15} /> {repBusy ? "กำลังเตรียมเอกสารแนบ…" : "ดู / ออก PDF"}
            </button>
            {onDelete && (
              <button onClick={() => window.askConfirm({ title: "ลบใบเสนอราคา " + q.no + " ?", body: "ลบแล้วเอากลับมาไม่ได้", ok: "ลบเลย" })
                .then((ok) => { if (ok) onDelete(); })} style={qBtn("#EF4444")}>ลบ</button>
            )}
            <span style={{ flex: 1 }} />
            {q.status === "draft" && <button onClick={() => { setStatus("sent"); save({ status: "sent", sentAt: new Date().toISOString() }); }} style={qBtn(null, "#0EA5E9")}>ส่งให้ลูกค้าแล้ว</button>}
            {q.status === "sent" && (
              <React.Fragment>
                <button onClick={() => save({ status: "rejected", decidedAt: new Date().toISOString() })} style={qBtn("#EF4444")}>ลูกค้าไม่เอา</button>
                <button onClick={() => save({ status: "accepted", decidedAt: new Date().toISOString() })} style={qBtn(null, "#10B981")}>ลูกค้าตกลง</button>
              </React.Fragment>
            )}
            {(q.status === "accepted" || q.status === "rejected") && (
              <button onClick={() => save({ status: "sent", decidedAt: "" })} style={qBtn()}>↩ ย้อนกลับเป็นส่งแล้ว</button>
            )}
            <button onClick={() => save()} style={qBtn(null, "var(--primary)")}>บันทึก</button>
          </div>
        </div>
      </div>
      {rep && typeof SuReportView === "function" && (
        <SuReportView html={rep} onClose={() => setRep(null)}
          title={(qLang === "en" ? "Quotation" : qLang === "zh" ? "报价单" : "ใบเสนอราคา") + " " + q.no} />
      )}
    </React.Fragment>
  );
}
function qBtn(color, solid) {
  return { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 15px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
    fontSize: 13, fontWeight: 700, border: solid ? "none" : "1px solid var(--border-strong)",
    background: solid || "var(--surface)", color: solid ? "#fff" : (color || "var(--text-1)") };
}

/* ============================================================
   บอร์ดขาย
   ============================================================ */
function SalesCard({ lead, quotes, onOpen, onDragStart, dragging }) {
  const st = salesStageOf(salesStageKey(lead));
  const qs = quotesFor(quotes, "lead", lead.id);
  const q0 = qs[0];
  /* ไฟล์แบบ/BOQ ที่แนบไว้ตั้งแต่ยังเป็นลูกค้า — ป้ายชุดเดียวกับการ์ดงาน กดดูไฟล์ได้จากบอร์ดเลย
     (เก็บอยู่ใต้เลขลูกค้า แล้วย้ายไปใต้เลขงานตอนกดแปลง — ดู moveJobFiles) */
  const flags = window.useJobFileFlag ? window.useJobFileFlag(lead.id) : null;
  const docJob = { id: lead.id, code: lead.code, name: lead.name };
  const late = sOverdue(lead.nextFollow) && salesStageKey(lead) !== "won" && salesStageKey(lead) !== "lost";
  const val = +lead.expValue || 0;
  /* เฟสตามที่สำรวจมาจริง — ว่างไว้ถ้ายังไม่มีใครระบุ จะได้ไม่ขึ้น "1 เฟส" ให้เข้าใจผิดว่ารู้แล้ว */
  const phTH = (lead.phase || (lead.survey && lead.survey.phase)) ? window.SF.phaseOf(lead) + " เฟส" : "";
  return (
    <div draggable onDragStart={(e) => onDragStart(e, lead)} onClick={() => onOpen(lead)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 13px",
        cursor: "grab", boxShadow: "var(--shadow-sm)", opacity: dragging ? .4 : 1,
        borderLeft: "3px solid " + (late ? "#EF4444" : st.color), transition: "box-shadow .16s, transform .16s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 22px rgba(8,20,14,.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
      {/* หัวการ์ด — รหัส + ป้าย ชุดเดียวกับการ์ดงาน จะได้กวาดตาอ่านบอร์ดเดียวกันได้แบบเดียวกัน
          ป้ายตกบรรทัดใหม่ได้ ไม่งั้นการ์ดแคบ ๆ จะโดนขอบตัดจนอ่านไม่ออก */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>{lead.code}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", marginLeft: "auto" }}>
          {late && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "var(--tint-red-bg2)", padding: "1px 7px", borderRadius: 99, whiteSpace: "nowrap" }}>เลยวันติดตาม</span>}
          {/* ยังไม่เป็นงาน — บอกไว้ว่าเป็นลูกค้าที่ยังไล่อยู่ ไม่ใช่งานที่ขายได้แล้ว */}
          <span title="ยังเป็นลูกค้า ยังไม่ได้แปลงเป็นงานติดตั้ง"
            style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-3)", background: "var(--surface2)",
              border: "1px solid var(--border)", padding: "2px 7px", borderRadius: 99, whiteSpace: "nowrap" }}>งานขาย</span>
          <TypeBadge type={lead.type} />
        </span>
      </div>
      {/* ป้ายไฟล์แนบ — วางที่เดิมกับการ์ดงาน (เหนือชื่อ) */}
      {flags && (flags.design || flags.boq) && window.DocChip && (
        <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
          {flags.design && <window.DocChip job={docJob} kind="design" label="แบบ" color="#2563EB" soft="#2563EB14" />}
          {flags.boq && <window.DocChip job={docJob} kind="boq" label="BOQ" color="#0D9488" soft="#0D948814" />}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, marginBottom: 3 }}>{lead.name || "(ไม่ระบุชื่อ)"}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {lead.province || "—"}
        {lead.source ? " · " + LEAD_SOURCE_TH(lead.source) : ""}
      </div>
      {/* บรรทัดสเปก — รูปแบบเดียวกับการ์ดงาน (ขนาด · เฟส) จะได้กวาดตาอ่านบอร์ดเดียวกันได้แบบเดียวกัน
         ของลูกค้ายังเป็น "ขนาดที่คาด" ไม่ใช่ขนาดที่วิศวกรสรุป จำนวนแผงจึงยังไม่มี */}
      {(+lead.expKwp > 0 || phTH) && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9, flexWrap: "wrap", fontSize: 11.5 }}>
          <span style={{ color: "var(--text-2)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {+lead.expKwp > 0 && <React.Fragment><b style={{ color: "var(--text-1)", fontWeight: 700 }}>{lead.expKwp}</b> kWp</React.Fragment>}
            {+lead.expKwp > 0 && phTH && <span style={{ color: "var(--text-3)", margin: "0 5px" }}>·</span>}
            {phTH}
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", fontSize: 10.5, color: "var(--text-2)" }}>
        {val > 0 && <span style={{ background: "var(--primary-soft)", color: "var(--primary-dark)", fontWeight: 800, padding: "3px 8px", borderRadius: 7, fontVariantNumeric: "tabular-nums" }}>฿{fmtBaht(val)}</span>}
        {q0 && (() => { const s = QUOTE_STATUS_BY[q0.status] || QUOTE_STATUS_BY.draft; return (
          <span style={{ background: s.color + "14", border: "1px solid " + s.color + "33", color: s.color, fontWeight: 800, padding: "3px 8px", borderRadius: 7 }}>
            ใบเสนอราคา · {s.th}
          </span>
        ); })()}
      </div>
      <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 7, fontSize: 10.5, color: late ? "#EF4444" : "var(--text-3)" }}>
        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lead.nextFollow ? "ติดตาม " + thDate(lead.nextFollow, true) : "ยังไม่ได้ตั้งวันติดตาม"}
        </span>
        {lead.ownerName && <span style={{ fontWeight: 700, color: "var(--text-2)", flexShrink: 0 }}>{lead.ownerName}</span>}
      </div>
    </div>
  );
}

function SalesBoardView({ leads, quotes, search, currentUser, onOpenLead, onPatchLead, onConvert }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const [mine, setMine] = React.useState(false);

  const pool = React.useMemo(() => {
    const qy = String(search || "").trim().toLowerCase();
    let arr = leads || [];
    if (mine && currentUser) arr = arr.filter((l) => l.ownerId === currentUser.id);
    if (!qy) return arr;
    return arr.filter((l) => ((l.name || "") + " " + (l.code || "") + " " + (l.province || "") + " " + (l.phone || "")).toLowerCase().includes(qy));
  }, [leads, search, mine, currentUser]);

  const byCol = React.useCallback((key) => pool.filter((l) => salesStageKey(l) === key)
    .sort((a, b) => {
      /* คนที่เลยวันติดตามต้องอยู่บนสุด — บอร์ดนี้มีไว้บอกว่าวันนี้ต้องโทรหาใคร */
      const la = sOverdue(a.nextFollow) ? 0 : 1, lb = sOverdue(b.nextFollow) ? 0 : 1;
      if (la !== lb) return la - lb;
      return String(a.nextFollow || "9999-99-99").localeCompare(String(b.nextFollow || "9999-99-99"));
    }), [pool]);

  const onDrop = (to) => {
    const l = drag && pool.find((x) => x.id === drag);
    setDrag(null); setOver(null);
    if (!l) return;
    const from = salesStageKey(l);
    if (from === to) return;
    if (to === "won") {
      window.askConfirm({
        title: "ปิดการขาย “" + (l.name || "รายนี้") + "” ?",
        body: "ปิดแล้วให้กด “แปลงเป็นงานติดตั้ง” ที่หน้าลูกค้าสำรวจ เพื่อย้ายเข้าฐานข้อมูลงานพร้อมแบบสำรวจและรูป",
        ok: "ปิดการขาย", danger: false, icon: "check",
      }).then((ok) => { if (ok) onPatchLead(l.id, salesStagePatch(to)); });
      return;
    }
    onPatchLead(l.id, salesStagePatch(to));
  };

  const head = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: "var(--text-3)", flex: 1, minWidth: 140 }}>
        ลากการ์ดข้ามคอลัมน์เพื่อเดินขั้นการขาย · การ์ดขีดแดงคือเลยวันติดตามแล้ว
      </span>
      {currentUser && (
        <button onClick={() => setMine((v) => !v)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
            fontSize: 12.5, fontWeight: 700, border: "1px solid " + (mine ? "var(--primary)" : "var(--border-strong)"),
            background: mine ? "var(--primary-soft)" : "var(--surface)", color: mine ? "var(--primary-dark)" : "var(--text-2)" }}>
          <Icon name="user" size={13} color={mine ? "var(--primary-dark)" : "var(--text-2)"} /> เฉพาะลูกค้าของฉัน
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {head}
        {SALES_STAGES.map((c) => {
          const col = byCol(c.key);
          if (!col.length) return null;
          return (
            <div key={c.key} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-2)" }}>{c.th}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{col.length}</span>
              </div>
              {col.map((l) => <SalesCard key={l.id} lead={l} quotes={quotes} onOpen={onOpenLead} dragging={false} onDragStart={() => {}} />)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0, flex: 1 }}>
      {head}
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, minHeight: 0, flex: 1 }}>
        {SALES_STAGES.map((c) => {
          const col = byCol(c.key);
          const ok = !!drag;
          const isOver = over === c.key && ok;
          const sum = col.reduce((s, l) => s + (+l.expValue || 0), 0);
          return (
            <div key={c.key}
              onDragOver={(e) => { if (!ok) return; e.preventDefault(); setOver(c.key); }}
              onDragLeave={() => setOver((o) => (o === c.key ? null : o))}
              onDrop={() => onDrop(c.key)}
              style={{ width: 262, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 18,
                background: isOver ? c.soft : "var(--surface2)", border: "1px solid " + (isOver ? c.color : "var(--border)"),
                transition: "background .15s, border-color .15s" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 1,
                background: isOver ? c.soft : "var(--surface2)", borderRadius: "17px 17px 0 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".05em", color: "var(--text-2)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.th}</span>
                  </span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, letterSpacing: "-.02em",
                    color: col.length ? "var(--text-1)" : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{col.length}</span>
                </div>
                {sum > 0 && <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>มูลค่ารวม ฿{fmtBaht(sum)}</div>}
              </div>
              <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto", flex: 1, minHeight: 80 }}>
                {col.map((l) => (
                  <SalesCard key={l.id} lead={l} quotes={quotes} onOpen={onOpenLead} dragging={drag === l.id}
                    onDragStart={(e, lead) => { setDrag(lead.id); e.dataTransfer.effectAllowed = "move"; }} />
                ))}
                {col.length === 0 && (
                  <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)", border: "1.5px dashed var(--border-strong)", borderRadius: 10 }}>
                    {isOver ? "วางที่นี่" : "ว่าง"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   ยอดขาย / KPI
   ============================================================ */
function SalesKpiView({ leads, quotes, appts, techs, currentUser, onMenuOpen, onNewLead }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [month, setMonth] = React.useState(() => sToday10().slice(0, 7));   // "" = ทั้งหมด
  /* งานบ้านกับงานโครงการเป็นคนละงานกันจริง ๆ — ขนาด ราคา และคนที่ต้องคุยด้วยคนละชุด
     ดูรวมกันแล้วตัวเลขไม่บอกอะไร จึงกรองทั้งหน้าเหมือนหน้า O&M */
  const [kind, setKind] = React.useState("all");

  const inMonth = React.useCallback((iso) => {
    if (!month) return true;
    return sMonthKey(iso) === month;
  }, [month]);

  /* ชื่อช่างที่ไปสำรวจ — นัดสำรวจผูกกับลูกค้าด้วย leadId ถ้ามีหลายนัดเอานัดล่าสุด */
  const engOfLead = React.useMemo(() => {
    const byId = {};
    (techs || []).forEach((t) => { byId[t.id] = t.name || t.username || ""; });
    const out = {};
    (appts || []).forEach((a) => {
      if (!a || !a.leadId || a.status === "canceled") return;
      const cur = out[a.leadId];
      if (!cur || String(a.start || "") > String(cur.start || "")) out[a.leadId] = { start: a.start, name: byId[a.engineerId] || "" };
    });
    return out;
  }, [appts, techs]);

  /* ใบเสนอราคาของลูกค้าแต่ละราย — ใบหนึ่งผูกได้ทั้งกับลูกค้าสำรวจ (leadId) และงานจริง (jobId) */
  const qByLead = React.useMemo(() => {
    const m = {};
    (quotes || []).forEach((q) => { const k = q && q.leadId; if (!k) return; (m[k] = m[k] || []).push(q); });
    return m;
  }, [quotes]);

  /* หนึ่งแถว = หนึ่งโครงการ (ไม่ใช่หนึ่งเซลล์ — ระบบนี้ยังไม่มีตำแหน่งเซลล์)
     ตัวเลขในแถวยังนับตามเดือนที่เลือกเหมือนเดิมทุกช่อง ยกเว้น "ยังไล่อยู่" ที่เป็นยอดคงค้างทุกช่วงเวลา */
  const allRows = React.useMemo(() => {
    return (leads || []).map((l) => {
      const st = salesStageKey(l);
      const done = st === "won" || st === "lost";
      let quoted = 0, sales = 0;
      (qByLead[l.id] || []).forEach((q) => {
        if (q.status !== "draft" && inMonth(q.sentAt || q.at)) quoted++;
        if (q.status === "accepted" && inMonth(q.decidedAt || q.updatedAt)) sales += quoteTotals(q).grand;
      });
      const eng = engOfLead[l.id];
      return {
        id: l.id, code: l.code || "", name: l.name || "(ยังไม่ได้ตั้งชื่อโครงการ)",
        type: l.type === "project" ? "project" : "home",
        ownerId: l.ownerId || "", owner: l.ownerName || "",
        eng: (eng && eng.name) || "", booked: !!eng,
        stage: st, at: l.updatedAt || l.createdAt || "",
        fresh: inMonth(l.createdAt) ? 1 : 0,
        won: st === "won" && inMonth(l.updatedAt) ? 1 : 0,
        lost: st === "lost" && inMonth(l.updatedAt) ? 1 : 0,
        quoted: quoted, sales: sales,
        pipe: done ? 0 : +l.expValue || 0,
      };
    });
  }, [leads, qByLead, engOfLead, inMonth]);

  const kindCount = React.useMemo(() => {
    const c = { all: allRows.length, home: 0, project: 0 };
    allRows.forEach((r) => { c[r.type]++; });
    return c;
  }, [allRows]);

  const rows = React.useMemo(() => allRows
    .filter((r) => kind === "all" || r.type === kind)
    /* ไม่มีความเคลื่อนไหวในเดือนที่เลือกและไม่มียอดค้าง = ไม่ต้องกินที่ในตาราง */
    .filter((r) => r.fresh || r.quoted || r.won || r.lost || r.sales || r.pipe)
    .sort((a, b) => String(b.at).localeCompare(String(a.at))), [allRows, kind]);

  const tot = React.useMemo(() => rows.reduce((a, r) => ({
    fresh: a.fresh + r.fresh, quoted: a.quoted + r.quoted, won: a.won + r.won, lost: a.lost + r.lost,
    sales: a.sales + r.sales, pipe: a.pipe + r.pipe,
  }), { fresh: 0, quoted: 0, won: 0, lost: 0, sales: 0, pipe: 0 }), [rows]);

  /* ยังไม่มอบหมาย = ไม่มีใครตามต่อ ตัวเลขนี้คือของที่จะหล่นหายถ้าไม่มีใครเห็น */
  const noOwner = React.useMemo(() => rows.filter((r) => !r.owner && r.stage !== "won" && r.stage !== "lost").length, [rows]);
  const noEng = React.useMemo(() => rows.filter((r) => !r.booked && r.stage !== "won" && r.stage !== "lost").length, [rows]);

  const months = React.useMemo(() => {
    const out = []; const d = new Date();
    for (let i = 0; i < 13; i++) { const m = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(m.getFullYear() + "-" + sPad2(m.getMonth() + 1)); }
    return out;
  }, []);
  const monthTh = (m) => { if (!m) return "ทั้งหมด"; const [y, mm] = m.split("-"); return TH_MONTHS[+mm - 1] + " " + (+y + 543).toString().slice(-2); };

  const kpi = (label, value, sub, color) => (
    <div style={{ flex: "1 1 150px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", color: color || "var(--text-1)", marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
  const th = { padding: "9px 11px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)" };
  const td = { padding: "11px", fontSize: 13, textAlign: "right", fontVariantNumeric: "tabular-nums", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
  const pill = (text, color) => (
    <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: color + "18", color: color, whiteSpace: "nowrap" }}>{text}</span>
  );
  const TYPE_TH = { home: { th: "งานบ้าน", color: "#1B9B75" }, project: { th: "งานโครงการ", color: "#7C5CFC" } };
  /* ช่องที่ยังไม่ได้มอบหมาย ต้องอ่านออกว่า "ยังว่าง" ไม่ใช่ขีดกลางที่ดูเหมือนไม่มีข้อมูล */
  const todo = (text) => <span style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B" }}>{text}</span>;

  return (
    <React.Fragment>
      <window.SchedHeader title="ยอดขาย" onMenuOpen={onMenuOpen}
        sub={monthTh(month) + " · ปิดการขาย " + tot.won + " ราย · ยอด ฿" + fmtBaht(Math.round(tot.sales)) + " · pipeline ฿" + fmtBaht(Math.round(tot.pipe))} />
      <div className="app-content">
        <div className="cat-chip-row" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 11 }}>
          {[""].concat(months).map((m) => {
            const on = month === m;
            return (
              <button key={m || "all"} onClick={() => setMonth(m)}
                style={{ padding: "7px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                  whiteSpace: "nowrap", flexShrink: 0, border: "1px solid " + (on ? "transparent" : "var(--border)"),
                  background: on ? "var(--primary)" : "var(--surface)", color: on ? "#fff" : "var(--text-2)" }}>
                {monthTh(m)}
              </button>
            );
          })}
        </div>

        {/* แยกงานบ้าน / งานโครงการ — กรองทั้งหน้า ตัวเลขในการ์ดสรุปเปลี่ยนตามที่เลือกด้วย */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          {[["all", "ทั้งหมด", "var(--primary-dark)"], ["home", TYPE_TH.home.th, TYPE_TH.home.color],
            ["project", TYPE_TH.project.th, TYPE_TH.project.color]].map(([k, label, c]) => (
            <button key={k} onClick={() => setKind(k)}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 99,
                border: "1px solid " + (kind === k ? c : "var(--border-strong)"),
                background: kind === k ? c + "16" : "var(--surface)", cursor: "pointer", fontFamily: "inherit",
                fontSize: 12.5, fontWeight: 700, color: kind === k ? c : "var(--text-2)" }}>
              {label}
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 800, color: kind === k ? c : "var(--text-3)" }}>{kindCount[k]}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 11, flexWrap: "wrap", marginBottom: 16 }}>
          {kpi("ยอดขายที่ปิดได้", "฿" + fmtBaht(Math.round(tot.sales)), "จากใบเสนอราคาที่ลูกค้าตกลง", "var(--primary-dark)")}
          {kpi("ปิดการขาย", tot.won + " ราย", tot.won + tot.lost > 0 ? "อัตราปิด " + Math.round(tot.won / (tot.won + tot.lost) * 100) + "%" : "ยังไม่มีรายที่ตัดสิน")}
          {kpi("รอมอบหมายผู้ดูแล", noOwner + " โครงการ", noOwner ? "ยังไม่มีใครตามต่อ" : "มอบหมายครบแล้ว", noOwner ? "#F59E0B" : undefined)}
          {kpi("ยังไม่ได้นัดสำรวจ", noEng + " โครงการ", noEng ? "ยังไม่มีช่างลงนัด" : "นัดครบแล้ว", noEng ? "#F59E0B" : undefined)}
          {kpi("มูลค่าที่ยังไล่อยู่", "฿" + fmtBaht(Math.round(tot.pipe)), "โครงการที่ยังไม่ปิด (ทุกช่วงเวลา)", "#F59E0B")}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={Object.assign({}, th, { textAlign: "left" })}>โครงการ</th>
                  <th style={Object.assign({}, th, { textAlign: "left" })}>ประเภท</th>
                  <th style={Object.assign({}, th, { textAlign: "left" })}>ผู้ดูแล</th>
                  <th style={Object.assign({}, th, { textAlign: "left" })}>ผู้สำรวจ</th>
                  <th style={Object.assign({}, th, { textAlign: "left" })}>ขั้นการขาย</th>
                  <th style={th}>เสนอราคา</th>
                  <th style={th}>ยอดขาย</th>
                  <th style={th}>ยังไล่อยู่</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
                    ยังไม่มีโครงการในช่วงนี้ — เพิ่มลูกค้าแล้วระบุว่าเป็นงานบ้านหรืองานโครงการ
                    {/* เดิมบอกให้ไปหน้าอื่น แต่หัวหน้า/แอดมินไม่มีเมนูนั้นในแถบซ้าย = ทางตัน
                       จึงเปิดฟอร์มให้จากตรงนี้เลย */}
                    {onNewLead && (
                      <button onClick={onNewLead}
                        style={{ marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px",
                          borderRadius: 99, border: "1px solid var(--primary)", background: "var(--primary)", color: "#fff",
                          cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
                        <Icon name="plus" size={13} color="#fff" sw={2.6} /> ลูกค้าใหม่
                      </button>
                    )}
                  </td></tr>
                )}
                {rows.map((r) => {
                  const sg = salesStageOf(r.stage);
                  const ty = TYPE_TH[r.type];
                  const mine = currentUser && r.ownerId && r.ownerId === currentUser.id;
                  /* ปิดไปแล้วไม่ต้องทวงว่ายังไม่มอบหมาย — ป้ายสีส้มมีไว้บอกของที่ยังต้องทำเท่านั้น */
                  const open = r.stage !== "won" && r.stage !== "lost";
                  return (
                    <tr key={r.id} style={mine ? { background: "var(--primary-soft)" } : undefined}>
                      <td style={Object.assign({}, td, { textAlign: "left", fontWeight: 700, color: "var(--text-1)", whiteSpace: "normal", minWidth: 160 })}>
                        {r.name}
                        {r.code && <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{r.code}</span>}
                      </td>
                      <td style={Object.assign({}, td, { textAlign: "left" })}>{pill(ty.th, ty.color)}</td>
                      <td style={Object.assign({}, td, { textAlign: "left", color: "var(--text-2)" })}>
                        {r.owner ? (r.owner + (mine ? " (คุณ)" : "")) : open ? todo("ยังไม่มอบหมาย") : "—"}
                      </td>
                      <td style={Object.assign({}, td, { textAlign: "left", color: "var(--text-2)" })}>
                        {r.eng ? r.eng : r.booked ? todo("นัดแล้ว · ยังไม่ระบุช่าง") : open ? todo("ยังไม่ได้นัด") : "—"}
                      </td>
                      <td style={Object.assign({}, td, { textAlign: "left" })}>{pill(sg.th, sg.color)}</td>
                      <td style={td}>{r.quoted || "—"}</td>
                      <td style={Object.assign({}, td, { fontWeight: 800, color: r.sales ? "var(--primary-dark)" : "var(--text-3)" })}>
                        {r.sales ? "฿" + fmtBaht(Math.round(r.sales)) : "—"}
                      </td>
                      <td style={Object.assign({}, td, { color: "var(--text-2)" })}>{r.pipe ? "฿" + fmtBaht(Math.round(r.pipe)) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 11, lineHeight: 1.6 }}>
          หนึ่งแถวคือหนึ่งโครงการ · ยอดขายนับจากใบเสนอราคาที่สถานะ “ลูกค้าตกลง” (ราคารวม VAT) ตามเดือนที่ตัดสิน ·
          “ยังไล่อยู่” คือมูลค่าที่คาดของโครงการที่ยังไม่ปิดการขาย นับทุกช่วงเวลาไม่ขึ้นกับเดือนที่เลือก ·
          ผู้สำรวจมาจากนัดสำรวจล่าสุดของโครงการนั้น
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================
   ภาพรวมงานขาย — หน้าแรกของเซลล์
   ภาพรวมเดิมพูดภาษาช่าง (ของพร้อมติดตั้ง · BOQ ขาด · ขั้นงานติดตั้ง)
   เซลล์เปิดมาแล้วไม่มีอะไรให้ทำต่อสักแผง — หน้านี้ตอบคำถามชุดเดียวกัน
   แต่เป็นภาษาของเขา: วันนี้ต้องโทรหาใคร · ใบไหนค้างรอลูกค้าตอบ · ของค้างขั้นไหน
   ============================================================ */
const sPlusDaysISO = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + sPad2(d.getMonth() + 1) + "-" + sPad2(d.getDate()); };
/* ส่งไปกี่วันแล้ว — ใบที่เงียบนานคือใบที่ต้องตามก่อน */
const sDaysSince = (v) => {
  if (!v) return null;
  const d = new Date(typeof v === "number" ? v : String(v));
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
};

function SalesOverview({ leads, quotes, jobs, currentUser, onOpenLead, onOpenJob, onGoBoard, onGoList, onGoKpi }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const L = leads || [];
  const Q = quotes || [];
  const today = sToday10();
  const month = today.slice(0, 7);

  const num = React.useMemo(() => {
    let live = 0, late = 0, wonM = 0, sale = 0;
    L.forEach((l) => {
      const k = salesStageKey(l);
      /* ปิดการขายนับตอนที่ "ตัดสิน" ตามแบบหน้ายอดขาย ไม่ใช่ตอนรับลูกค้าเข้ามา */
      if (k === "won") { if (sMonthKey(l.updatedAt) === month) wonM++; return; }
      if (k === "lost") return;
      live++;
      if (sOverdue(l.nextFollow)) late++;
    });
    Q.forEach((q) => {
      if (q.status === "accepted" && sMonthKey(q.decidedAt || q.updatedAt) === month) sale += quoteTotals(q).grand;
    });
    return { live, late, wonM, sale };
  }, [L, Q, month]);

  /* ต้องติดตาม = เลยกำหนด + ภายใน 7 วัน — เลยกำหนดอยู่บนสุดเสมอ */
  const follow = React.useMemo(() => {
    const max = sPlusDaysISO(7);
    return L.filter((l) => {
      const k = salesStageKey(l);
      if (k === "won" || k === "lost") return false;
      return !!l.nextFollow && String(l.nextFollow) <= max;
    }).sort((a, b) => String(a.nextFollow).localeCompare(String(b.nextFollow)));
  }, [L]);
  const noDate = React.useMemo(() => L.filter((l) => {
    const k = salesStageKey(l);
    return k !== "won" && k !== "lost" && !l.nextFollow;
  }).length, [L]);

  const pipe = React.useMemo(() => SALES_STAGES.map((st) => {
    const col = L.filter((l) => salesStageKey(l) === st.key);
    return { st, n: col.length, val: col.reduce((s, l) => s + (+l.expValue || 0), 0) };
  }), [L]);
  const pipeMax = Math.max.apply(null, pipe.map((x) => x.n).concat([1]));

  /* ใบที่ส่งไปแล้วยังไม่ตอบ — เรียงใบที่ค้างนานสุดอยู่บน */
  const waiting = React.useMemo(() => Q.filter((q) => q.status === "sent")
    .sort((a, b) => String(a.sentAt || a.at || "").localeCompare(String(b.sentAt || b.at || ""))), [Q]);
  const leadById = React.useMemo(() => { const m = {}; L.forEach((l) => { m[l.id] = l; }); return m; }, [L]);

  const openLead = (l) => { if (l && onOpenLead) onOpenLead(l); };

  /* งานติดตั้งที่มาจากลูกค้าของเรา — เซลล์ไม่ต้องเห็นบอร์ดงานทั้งบริษัท
     แต่ต้องตอบลูกค้าตัวเองได้ว่า "ถึงขั้นไหนแล้ว" · งานที่ยังไม่เสร็จอยู่บน เรียงตามวันติดตั้ง */
  const myJobs = React.useMemo(() => {
    const me = currentUser && currentUser.id;
    if (!me) return [];
    const SF = window.SF;
    return (jobs || []).filter((j) => j.salesId === me || (!j.salesId && j.createdBy === me))
      .sort((a, b) => {
        const da = a.stage === "done" ? 1 : 0, db = b.stage === "done" ? 1 : 0;
        if (da !== db) return da - db;
        const ia = (SF.installDate && SF.installDate(a)) || "9999-99-99";
        const ib = (SF.installDate && SF.installDate(b)) || "9999-99-99";
        return ia.localeCompare(ib);
      });
  }, [jobs, currentUser]);
  const myLive = myJobs.filter((j) => j.stage !== "done").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!isMobile && (
        <StatRail items={[
          { label: "ลูกค้าที่ยังไล่อยู่", value: num.live, unit: "ราย", accent: "#0EA5E9",
            sub: <React.Fragment>จากทั้งหมด <b>{L.length}</b> ราย</React.Fragment>, onClick: onGoBoard },
          { label: "เลยวันติดตาม", value: num.late, unit: "ราย", accent: "var(--text-3)", alert: num.late > 0,
            sub: num.late ? "ต้องโทรหาก่อนใคร" : "ตามทันทุกราย", onClick: onGoList },
          { label: "ปิดการขายเดือนนี้", value: num.wonM, unit: "ราย", accent: "var(--primary)",
            sub: num.sale > 0 ? "ยอด ฿" + fmtBaht(Math.round(num.sale)) : "ยังไม่มีใบที่ลูกค้าตกลง",
            onClick: onGoKpi || onGoBoard },
        ]} />
      )}

      <div className="pnl" style={num.late > 0 ? { borderLeft: "3px solid #EF4444" } : null}>
        <PanelTitle title="ต้องติดตาม"
          sub={num.late > 0 ? ("เลยกำหนดแล้ว " + num.late + " ราย · ถึงกำหนดใน 7 วัน " + follow.length + " ราย")
            : ("ถึงกำหนดใน 7 วัน " + follow.length + " ราย")} />
        {follow.length === 0 ? <Empty text="ไม่มีลูกค้าที่ต้องติดตามช่วงนี้" /> : (
          <div className="rows" style={{ maxHeight: 340, overflowY: "auto" }}>
            {follow.map((l) => {
              const late = sOverdue(l.nextFollow);
              const now = String(l.nextFollow) === today;
              const st = salesStageOf(salesStageKey(l));
              return (
                <button key={l.id} onClick={() => openLead(l)}>
                  <span className="mk" style={{ background: late ? "#D93025" : (now ? "#F59E0B" : st.color) }} />
                  <span className="bd">
                    <span className="nm">{l.name || "(ไม่ระบุชื่อ)"}</span>
                    <span className="mt">{[l.code, l.province, st.th].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="when" style={late ? { color: "#D93025" } : null}>
                    <b>{late ? "เลยกำหนด" : (now ? "วันนี้" : "ติดตาม")}</b>{thDate(l.nextFollow)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {noDate > 0 && (
          <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-3)" }}>
            * อีก <b>{noDate}</b> รายที่ยังไม่ได้ตั้งวันติดตาม — เปิดใบลูกค้าแล้วบันทึกการติดต่อเพื่อตั้งวันนัดถัดไป
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", gap: 18 }}>
        <div className="pnl">
          <PanelTitle title="ขั้นการขาย" sub="คลิกเพื่อไปที่บอร์ด" />
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
            {pipe.map((row) => (
              <button key={row.st.key} onClick={onGoBoard} style={{ display: "flex", alignItems: "center", gap: 10,
                background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left", width: "100%" }}>
                <span style={{ width: 118, flexShrink: 0, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.25 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: row.st.color, flexShrink: 0 }} />{row.st.th}
                </span>
                <span style={{ flex: 1, minWidth: 0, height: 10, background: "var(--surface3)", borderRadius: 99, overflow: "hidden", display: "block" }}>
                  <span style={{ display: "block", height: "100%", width: Math.max((row.n / pipeMax) * 100, row.n ? 5 : 0) + "%",
                    background: row.st.color, borderRadius: 99, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
                </span>
                <span style={{ width: 30, flexShrink: 0, fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, letterSpacing: "-.03em",
                  fontVariantNumeric: "tabular-nums", color: row.n ? "var(--text-1)" : "var(--text-3)", textAlign: "right" }}>{row.n}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-3)" }}>
            มูลค่าที่ยังไล่อยู่รวม ฿{fmtBaht(Math.round(pipe.filter((x) => x.st.key !== "won" && x.st.key !== "lost").reduce((s, x) => s + x.val, 0)))}
          </div>
        </div>

        <div className="pnl">
          <PanelTitle title="ใบเสนอราคาที่รอลูกค้าตอบ" sub={waiting.length + " ใบ"} />
          {waiting.length === 0 ? <Empty text="ไม่มีใบที่รอลูกค้าตอบอยู่" /> : (
            <div className="rows" style={{ maxHeight: 340, overflowY: "auto" }}>
              {waiting.map((q) => {
                const l = leadById[q.leadId];
                const days = sDaysSince(q.sentAt || q.at);
                const old = days != null && days >= 7;
                return (
                  <button key={q.id} onClick={() => openLead(l)} style={!l ? { cursor: "default" } : null}>
                    <span className="mk" style={{ background: old ? "#F59E0B" : QUOTE_STATUS_BY.sent.color }} />
                    <span className="bd">
                      <span className="nm">{(q.customer && q.customer.name) || q.refCode || q.no}</span>
                      <span className="mt">{[q.no, q.ownerName, "฿" + sBaht(quoteTotals(q).grand)].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="when" style={old ? { color: "#B45309" } : null}>
                      <b>ส่งแล้ว</b>{days == null ? "—" : (days === 0 ? "วันนี้" : days + " วัน")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {waiting.length > 0 && (
            <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-3)" }}>
              * ใบที่ส่งไปเกิน 7 วันขึ้นขีดเหลือง — ควรโทรตามก่อนลูกค้าลืม
            </div>
          )}
        </div>
      </div>

      <div className="pnl">
        <PanelTitle title="งานติดตั้งของลูกค้าฉัน"
          sub={myJobs.length ? ("กำลังดำเนินการ " + myLive + " งาน · เสร็จแล้ว " + (myJobs.length - myLive) + " งาน")
            : "หลังปิดการขายแล้วงานจะมาอยู่ที่นี่"} />
        {myJobs.length === 0 ? <Empty text="ยังไม่มีงานติดตั้งที่มาจากลูกค้าของคุณ" /> : (
          <div className="rows" style={{ maxHeight: 360, overflowY: "auto" }}>
            {myJobs.map((j) => {
              const SF = window.SF;
              const st = (SF.STAGES || []).find((x) => x.key === j.stage) || { th: j.stage, color: "var(--text-3)" };
              const ins = SF.installDate ? SF.installDate(j) : "";
              const end = SF.installEnd ? SF.installEnd(j) : "";
              const stuck = !!(j.problem || j.delayed);
              return (
                <button key={j.id} onClick={() => onOpenJob && onOpenJob(j)}>
                  <span className="mk" style={{ background: stuck ? "#D93025" : st.color }} />
                  <span className="bd">
                    <span className="nm">{j.name}</span>
                    <span className="mt">
                      {[j.code, st.th, j.kw ? j.kw + " kW" : ""].filter(Boolean).join(" · ")}
                      {j.problem ? " · " + j.problem : (j.delayed ? " · ล่าช้ากว่ากำหนด" : "")}
                    </span>
                  </span>
                  <span className="when" style={j.delayed ? { color: "#D93025" } : null}>
                    <b>{j.stage === "done" ? "ติดตั้งแล้ว" : "ติดตั้ง"}</b>
                    {ins ? (window._schedRange ? window._schedRange(ins, end) : thDate(ins)) : "ยังไม่นัดวัน"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--text-3)" }}>
          * กดที่งานเพื่อดูรายละเอียด — ดูอย่างเดียว แก้ไม่ได้ งานหน้างานเป็นหน้าที่ของช่าง
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SalesJobSummary — บล็อกในใบงานสำหรับเซลล์
   เซลล์ไม่ได้ต้องการสเปคหรือเครื่องมือช่าง แต่ต้องตอบลูกค้าให้ได้ว่า
   "ตอนนี้ถึงไหนแล้ว ติดอะไรอยู่ ติดตั้งวันไหน"
   ============================================================ */
function SalesJobSummary({ job, quotes, leads, onOpenQuote }) {
  const SF = window.SF;
  const idx = SF.STAGE_INDEX[job.stage] != null ? SF.STAGE_INDEX[job.stage] : 0;
  const st = stageOf(job.stage);
  const p = job.permit || {};
  const pst = p.status ? (window.permitStatusOf ? window.permitStatusOf(job) : null) : null;

  const blockers = [];
  if (job.problem) blockers.push({ th: job.problem, color: "#EF4444" });
  if (p.status === "rejected") blockers.push({ th: "ใบขออนุญาตถูกตีกลับ" + (p.rejectReason ? " · " + p.rejectReason : ""), color: "#EF4444" });
  if (job.delayed) blockers.push({ th: "เลยกำหนดที่วางไว้", color: "#F59E0B" });

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
      {/* ขั้นงานติดตั้ง */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: st.color, flexShrink: 0 }} />
        <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>{st.th}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          ขั้นที่ {idx + 1} จาก {SF.STAGES.length}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {SF.STAGES.map((s, i) => (
          <span key={s.key} title={s.th} style={{ flex: 1, height: 6, borderRadius: 99, background: i <= idx ? st.color : "var(--surface3)" }} />
        ))}
      </div>

      {/* วันสำคัญที่ลูกค้าถามบ่อย */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 14 }}>
        {[["วันนัดติดตั้ง", (() => {
            /* วันนัดติดตั้งอยู่ที่ stageDates.install เท่านั้น — ไม่มี deadline ให้ตกลงมา */
            const st = SF.installDate ? SF.installDate(job) : "";
            const en = SF.installEnd ? SF.installEnd(job) : st;
            return st ? thDate(st, true) + (en && en !== st ? " – " + thDate(en, true) : "") : "ยังไม่กำหนด";
          })()],
          ["ขนาดระบบ", (job.kw || "—") + " kW · " + (job.panels || "—") + " แผง"],
          ["ขออนุญาตการไฟฟ้า", pst ? pst.th : "ยังไม่เริ่ม"]].map((r) => (
          <div key={r[0]} style={{ background: "var(--surface2)", borderRadius: 11, padding: "9px 11px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".04em" }}>{r[0]}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginTop: 2 }}>{r[1]}</div>
          </div>
        ))}
      </div>

      {/* ติดอะไรอยู่ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: "var(--text-3)", marginBottom: 7 }}>ติดอะไรอยู่</div>
        {blockers.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--tint-green-tx)", background: "var(--primary-soft)", borderRadius: 10, padding: "9px 12px" }}>
            ไม่ติดอะไร · งานเดินตามแผน
          </div>
        ) : blockers.map((b, i) => (
          <div key={i} style={{ fontSize: 12.5, color: b.color, background: b.color + "12", border: "1px solid " + b.color + "33",
            borderRadius: 10, padding: "9px 12px", marginBottom: 6, lineHeight: 1.5 }}>⚠ {b.th}</div>
        ))}
      </div>

      {/* ใบเสนอราคาของงานนี้ */}
      <SalesQuoteList job={job} quotes={quotes} leads={leads} onOpenQuote={onOpenQuote} />
    </div>
  );
}

Object.assign(window, {
  SALES_STAGES, SALES_BY, SALES_BACK, salesStageKey, salesStageOf, salesStagePatch,
  LEAD_SOURCES, LEAD_SOURCE_TH, CONTACT_WAYS, sOverdue, sBaht,
  QUOTE_STATUS, QUOTE_STATUS_BY, QUOTE_TERMS_DEF, QUOTE_WARRANTY_DEF, quoteTermSplit,
  blankQuote, quoteFrom, quoteTotals, quoteNo, quotesFor, quotesOfJob, quotesOfLead,
  quoteDetailLines, quotePdfPages, quoteHTML, useQuoteStore,
  QUOTE_PAGES, quotePageOn, quotePagesAll, quoteRoi, quoteRoiCfg, quoteBoqSeed, quoteWtySeed, useQuotePics,
  quoteSpec, quoteHasSpec, quoteSpecName, quoteSpecDetail,
  QuoteEditor, QuoteSheetPick, SalesCard, SalesBoardView, SalesKpiView, SalesOverview, SalesJobSummary, SalesQuoteList,
});
