/* ============================================================
   PHITHAN GREEN — งานฝ่ายขาย (เซลล์)

   ลูกค้าสำรวจ (surveyLeads) = วัตถุงานของเซลล์ · งานติดตั้ง (jobs) = หลังปิดการขาย
   ไฟล์นี้เก็บ: ขั้นการขาย · ใบเสนอราคา · บอร์ดขาย · ยอดขาย · บล็อกสรุปในใบงาน
   ============================================================ */

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
    phase: String(o.phase || s.phase || "").replace(/[^13]/g, ""),
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
  return out.join(" · ");
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
    discount: 0, vat: (window.BOQ && window.BOQ.VAT_RATE != null) ? window.BOQ.VAT_RATE : 7,
    terms: QUOTE_TERMS_DEF.slice(), warranties: QUOTE_WARRANTY_DEF.slice(),
    validDays: 30, note: "",
    status: "draft",
    ownerId: t.ownerId || (user && user.id) || "", ownerName: t.ownerName || (user && user.name) || "",
    byId: (user && user.id) || "", byName: (user && user.name) || "",
    date: sToday10(), at: now, updatedAt: now, sentAt: "", decidedAt: "",
  };
}

/* ยอดในใบเสนอราคา — ส่วนลดเป็น "จำนวนเงินที่ลด" เหมือนหน้าราคาใน BOQ
   (กรอกราคาสุทธิเองแล้วมองไม่เห็นว่าลดไปเท่าไร) */
function quoteTotals(q) {
  const r2 = (v) => Math.round(v * 100) / 100;
  const items = (q && q.items) || [];
  const sub = r2(items.reduce((s, it) => s + (+it.qty || 0) * (+it.price || 0), 0));
  const disc = r2(Math.min(Math.max(0, +(q && q.discount) || 0), sub));
  const afterDisc = r2(sub - disc);
  const rate = (q && q.vat != null && q.vat !== "") ? +q.vat : ((window.BOQ && window.BOQ.VAT_RATE) || 7);
  const vat = r2(afterDisc * rate / 100);
  return { sub, disc, afterDisc, vatRate: rate, vat, grand: r2(afterDisc + vat) };
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

/* ใบเสนอราคาของลูกค้า/งานหนึ่งราย — ใบล่าสุดอยู่บน */
function quotesFor(quotes, kind, id) {
  if (!id) return [];
  return (quotes || []).filter((q) => (kind === "job" ? q.jobId === id : q.leadId === id))
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}

/* ============================================================
   quoteHTML — ใบเสนอราคา A4 สำหรับพิมพ์/บันทึกเป็น PDF
   เปิดผ่าน SuReportView ตัวเดียวกับรายงานอื่น ๆ จะได้ปุ่มพิมพ์เหมือนกันหมด
   ============================================================ */
function quoteHTML(q) {
  const T = quoteTotals(q);
  const c = q.customer || {};
  const items = (q.items || []).filter((it) => (it.name || "").trim() || +it.price);
  const valid = q.validDays ? "ยืนราคา " + q.validDays + " วัน นับจากวันที่ออกใบเสนอราคา" : "";
  const dsp = (s) => (s ? thDate(s, true) : "—");
  const rows = items.map((it, i) =>
    '<tr><td class="c">' + (i + 1) + '</td><td><b>' + sEsc(it.name) + "</b>" +
    (it.detail ? '<div class="dt">' + sEsc(it.detail) + "</div>" : "") + "</td>" +
    '<td class="c">' + sEsc(it.qty) + "</td><td class=\"c\">" + sEsc(it.unit || "") + "</td>" +
    '<td class="r">' + sBaht(it.price) + '</td><td class="r">' + sBaht((+it.qty || 0) * (+it.price || 0)) + "</td></tr>"
  ).join("");
  const money = (label, val, big) =>
    '<tr class="' + (big ? "big" : "") + '"><td>' + label + '</td><td class="r">' + sBaht(val) + " บาท</td></tr>";
  const list = (arr, title) => {
    const a = (arr || []).map((s) => String(s || "").trim()).filter(Boolean);
    if (!a.length) return "";
    return '<div class="blk"><h3>' + title + "</h3><ul>" + a.map((s) => "<li>" + sEsc(s) + "</li>").join("") + "</ul></div>";
  };
  return '<!doctype html><html lang="th"><head><meta charset="utf-8">' +
    "<title>ใบเสนอราคา " + sEsc(q.no) + "</title>" +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    "<style>" +
    "@page{size:A4;margin:14mm}" +
    "*{box-sizing:border-box}" +
    "body{font-family:'IBM Plex Sans Thai',sans-serif;color:#111827;font-size:12px;margin:0;line-height:1.55}" +
    ".hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #22A35B;padding-bottom:12px;margin-bottom:16px}" +
    ".bd{font-size:20px;font-weight:700;color:#14663A;letter-spacing:.02em}" +
    ".bs{font-size:11px;color:#6b7280;margin-top:2px}" +
    ".ti{text-align:right}.ti h1{font-size:19px;margin:0;color:#111827}" +
    ".ti .no{font-size:12px;color:#374151;margin-top:3px}" +
    ".two{display:flex;gap:14px;margin-bottom:14px}" +
    ".two>div{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px}" +
    ".two h3,.blk h3{font-size:11px;margin:0 0 6px;color:#14663A;letter-spacing:.04em}" +
    ".kv{display:flex;gap:6px;font-size:11.5px}.kv b{min-width:58px;color:#6b7280;font-weight:500}" +
    "table{width:100%;border-collapse:collapse;font-size:11.5px}" +
    "th{background:#14663A;color:#fff;padding:7px 8px;text-align:left;font-weight:600;font-size:11px}" +
    "td{padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}" +
    ".c{text-align:center}.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}" +
    ".dt{color:#6b7280;font-size:10.5px;margin-top:2px}" +
    ".sum{margin-top:12px;margin-left:auto;width:290px}" +
    ".sum td{border:0;padding:4px 8px}.sum .big td{border-top:2px solid #14663A;font-weight:700;font-size:14px;color:#14663A;padding-top:8px}" +
    ".blk{margin-top:14px;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;break-inside:avoid}" +
    ".blk ul{margin:0;padding-left:18px}.blk li{margin-bottom:3px}" +
    ".note{margin-top:12px;font-size:11px;color:#374151;white-space:pre-wrap}" +
    ".sig{display:flex;gap:40px;margin-top:34px;break-inside:avoid}" +
    ".sig>div{flex:1;text-align:center}.sig .ln{border-top:1px solid #9ca3af;margin:34px 10px 6px}" +
    ".sig .rl{font-size:11px;color:#6b7280}" +
    ".ft{margin-top:16px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center}" +
    "</style></head><body>" +
    '<div class="hd"><div><div class="bd">PHITHAN GREEN</div>' +
    '<div class="bs">ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์ · ออกแบบ · ติดตั้ง · ขออนุญาตการไฟฟ้า</div>' +
    '<div class="bs">solar@phithangreen.com · 064-867-5020</div></div>' +
    '<div class="ti"><h1>ใบเสนอราคา</h1><div class="no">เลขที่ <b>' + sEsc(q.no) + "</b></div>" +
    '<div class="no">วันที่ ' + dsp(q.date) + "</div></div></div>" +
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
    '<table class="sum">' + money("รวมเป็นเงิน", T.sub) +
    (T.disc > 0 ? money("หักส่วนลด", T.disc) + money("ราคาหลังหักส่วนลด", T.afterDisc) : "") +
    money("ภาษีมูลค่าเพิ่ม " + T.vatRate + "%", T.vat) +
    money("ราคารวมทั้งสิ้น", T.grand, true) + "</table>" +
    list(q.terms, "เงื่อนไขการชำระเงิน") +
    list(q.warranties, "การรับประกันและบริการ") +
    (valid ? '<div class="note">' + sEsc(valid) + "</div>" : "") +
    (q.note ? '<div class="note">หมายเหตุ: ' + sEsc(q.note) + "</div>" : "") +
    '<div class="sig"><div><div class="ln"></div><div class="rl">ผู้เสนอราคา · ' + sEsc(q.ownerName || q.byName || "") +
    '</div></div><div><div class="ln"></div><div class="rl">ผู้อนุมัติ / ลูกค้า</div>' +
    '<div class="rl">วันที่ ______ / ______ / ______</div></div></div>' +
    '<div class="ft">เอกสารนี้ออกจากระบบติดตามงานติดตั้ง PHITHAN GREEN</div>' +
    "</body></html>";
}

/* ============================================================
   QuoteEditor — โมดัลทำ/แก้ใบเสนอราคา
   ============================================================ */
function QuoteEditor({ quote, job, target, onClose, onSave, onDelete, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [q, setQ] = React.useState(() => Object.assign({}, quote, {
    customer: Object.assign({}, quote.customer),
    items: (quote.items || []).map((x) => Object.assign({}, x)),
    terms: (quote.terms || []).slice(), warranties: (quote.warranties || []).slice(),
  }));
  const [rep, setRep] = React.useState(null);
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

  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const cell = Object.assign({}, inputStyle, { padding: "8px 9px", fontSize: 12.5 });
  const num = Object.assign({}, cell, { textAlign: "right", fontVariantNumeric: "tabular-nums" });

  const setStatus = (to) => {
    const now = new Date().toISOString();
    const extra = to === "sent" ? { sentAt: now } : (to === "accepted" || to === "rejected") ? { decidedAt: now } : {};
    setQ((p) => Object.assign({}, p, extra, { status: to }));
  };

  const save = (extra) => { onSave(Object.assign({}, q, extra || {})); };

  const lineList = (key, title, hint) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={lbl}>{title}</label>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</div>
      <textarea rows={4} value={(q[key] || []).join("\n")} disabled={locked}
        onChange={(e) => set(key, e.target.value.split("\n"))}
        style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.6, fontSize: 12.5 })} />
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
                {boqSell > 0 && !locked && (
                  <button onClick={pullBoq} style={{ marginLeft: canPullSpec ? 0 : "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "none",
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-2)" }}>
                <span style={{ flex: 1 }}>หักส่วนลด (บาท)</span>
                <input type="number" value={q.discount} disabled={locked} onChange={(e) => set("discount", e.target.value === "" ? "" : +e.target.value)}
                  style={Object.assign({}, num, { width: 130 })} />
              </div>
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

            {lineList("terms", "เงื่อนไขการชำระเงิน", "บรรทัดละ 1 งวด")}
            {lineList("warranties", "การรับประกันและบริการ", "บรรทัดละ 1 ข้อ")}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={lbl}>หมายเหตุ</label>
              <textarea rows={2} value={q.note || ""} disabled={locked} onChange={(e) => set("note", e.target.value)}
                style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
            </div>
          </div>

          {/* ท้าย */}
          <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
            borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setRep(quoteHTML(q))} style={qBtn()}>
              <Icon name="file" size={15} /> ดู / ออก PDF
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
        <SuReportView html={rep} onClose={() => setRep(null)} title={"ใบเสนอราคา " + q.no} />
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
  const late = sOverdue(lead.nextFollow) && salesStageKey(lead) !== "won" && salesStageKey(lead) !== "lost";
  const val = +lead.expValue || 0;
  return (
    <div draggable onDragStart={(e) => onDragStart(e, lead)} onClick={() => onOpen(lead)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 13px",
        cursor: "grab", boxShadow: "var(--shadow-sm)", opacity: dragging ? .4 : 1,
        borderLeft: "3px solid " + (late ? "#EF4444" : st.color), transition: "box-shadow .16s, transform .16s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 22px rgba(8,20,14,.09)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{lead.code}</span>
        {late && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "var(--tint-red-bg2)", padding: "1px 7px", borderRadius: 99 }}>เลยวันติดตาม</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, marginBottom: 3 }}>{lead.name || "(ไม่ระบุชื่อ)"}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        <Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {lead.province || "—"}
        {lead.source ? " · " + LEAD_SOURCE_TH(lead.source) : ""}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", fontSize: 10.5, color: "var(--text-2)" }}>
        {lead.expKwp > 0 && <span style={{ background: "var(--surface2)", padding: "3px 8px", borderRadius: 7, fontFamily: "var(--mono)" }}>{lead.expKwp} kWp</span>}
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
function SalesKpiView({ leads, quotes, users, currentUser, onMenuOpen }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [month, setMonth] = React.useState(() => sToday10().slice(0, 7));   // "" = ทั้งหมด

  const inMonth = React.useCallback((iso) => {
    if (!month) return true;
    return sMonthKey(iso) === month;
  }, [month]);

  /* รายชื่อเซลล์ = ผู้ใช้ที่ถือตำแหน่งเซลล์ · บวก "ไม่ระบุเจ้าของ" ไว้ท้ายสุดถ้ามีของค้าง */
  const sellers = React.useMemo(() => {
    const arr = (users || []).filter((u) => u.active !== false && window.hasRole(window.userRoles(u), "sales"))
      .map((u) => ({ id: u.id, name: u.name || u.username || "—" }));
    return arr;
  }, [users]);

  const rows = React.useMemo(() => {
    const mk = (id, name) => ({ id, name, fresh: 0, quoted: 0, won: 0, lost: 0, sales: 0, pipe: 0 });
    const map = {}; const order = [];
    sellers.forEach((s) => { map[s.id] = mk(s.id, s.name); order.push(s.id); });
    const bucket = (id, name) => {
      const k = id || "__none";
      if (!map[k]) { map[k] = mk(k, name || "ไม่ระบุเจ้าของ"); order.push(k); }
      return map[k];
    };
    (leads || []).forEach((l) => {
      const b = bucket(l.ownerId, l.ownerName);
      const st = salesStageKey(l);
      if (inMonth(l.createdAt)) b.fresh++;
      /* ปิดได้/เสียนับตอนที่ "ตัดสิน" ไม่ใช่ตอนรับลูกค้าเข้ามา — เดือนที่ปิดคือเดือนที่ควรได้เครดิต */
      if (st === "won" && inMonth(l.updatedAt)) b.won++;
      if (st === "lost" && inMonth(l.updatedAt)) b.lost++;
      if (st !== "won" && st !== "lost") b.pipe += +l.expValue || 0;
    });
    (quotes || []).forEach((q) => {
      const b = bucket(q.ownerId || q.byId, q.ownerName || q.byName);
      if (q.status !== "draft" && inMonth(q.sentAt || q.at)) b.quoted++;
      if (q.status === "accepted" && inMonth(q.decidedAt || q.updatedAt)) b.sales += quoteTotals(q).grand;
    });
    return order.map((k) => map[k]).filter((r) => r.fresh || r.quoted || r.won || r.lost || r.sales || r.pipe || sellers.some((s) => s.id === r.id));
  }, [leads, quotes, sellers, inMonth]);

  const tot = React.useMemo(() => rows.reduce((a, r) => ({
    fresh: a.fresh + r.fresh, quoted: a.quoted + r.quoted, won: a.won + r.won, lost: a.lost + r.lost,
    sales: a.sales + r.sales, pipe: a.pipe + r.pipe,
  }), { fresh: 0, quoted: 0, won: 0, lost: 0, sales: 0, pipe: 0 }), [rows]);

  const closeRate = (r) => { const d = r.won + r.lost; return d > 0 ? Math.round(r.won / d * 100) : null; };

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

  return (
    <React.Fragment>
      <window.SchedHeader title="ยอดขาย" onMenuOpen={onMenuOpen}
        sub={monthTh(month) + " · ปิดการขาย " + tot.won + " ราย · ยอด ฿" + fmtBaht(Math.round(tot.sales)) + " · pipeline ฿" + fmtBaht(Math.round(tot.pipe))} />
      <div className="app-content">
        <div className="cat-chip-row" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14 }}>
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

        <div style={{ display: "flex", gap: 11, flexWrap: "wrap", marginBottom: 16 }}>
          {kpi("ยอดขายที่ปิดได้", "฿" + fmtBaht(Math.round(tot.sales)), "จากใบเสนอราคาที่ลูกค้าตกลง", "var(--primary-dark)")}
          {kpi("ปิดการขาย", tot.won + " ราย", tot.won + tot.lost > 0 ? "อัตราปิด " + Math.round(tot.won / (tot.won + tot.lost) * 100) + "%" : "ยังไม่มีรายที่ตัดสิน")}
          {kpi("เสนอราคา", tot.quoted + " ใบ", "ที่ส่งให้ลูกค้าแล้ว")}
          {kpi("ลูกค้าใหม่", tot.fresh + " ราย", "รับเข้ามาในช่วงนี้")}
          {kpi("มูลค่าที่ยังไล่อยู่", "฿" + fmtBaht(Math.round(tot.pipe)), "ลูกค้าที่ยังไม่ปิด (ทุกช่วงเวลา)", "#F59E0B")}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={Object.assign({}, th, { textAlign: "left" })}>เซลล์</th>
                  <th style={th}>ลูกค้าใหม่</th>
                  <th style={th}>เสนอราคา</th>
                  <th style={th}>ปิดได้</th>
                  <th style={th}>ไม่ติดตั้ง</th>
                  <th style={th}>อัตราปิด</th>
                  <th style={th}>ยอดขาย</th>
                  <th style={th}>ยังไล่อยู่</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
                    ยังไม่มีข้อมูลในช่วงนี้ — เพิ่มลูกค้าที่หน้า “ลูกค้าสำรวจ” แล้วระบุเจ้าของลูกค้า
                  </td></tr>
                )}
                {rows.map((r) => {
                  const cr = closeRate(r);
                  const me = currentUser && r.id === currentUser.id;
                  return (
                    <tr key={r.id} style={me ? { background: "var(--primary-soft)" } : undefined}>
                      <td style={Object.assign({}, td, { textAlign: "left", fontWeight: 700, color: "var(--text-1)" })}>
                        {r.name}{me ? " (คุณ)" : ""}
                      </td>
                      <td style={td}>{r.fresh || "—"}</td>
                      <td style={td}>{r.quoted || "—"}</td>
                      <td style={Object.assign({}, td, { fontWeight: 700, color: r.won ? "var(--tint-green-tx)" : "var(--text-3)" })}>{r.won || "—"}</td>
                      <td style={Object.assign({}, td, { color: "var(--text-3)" })}>{r.lost || "—"}</td>
                      <td style={td}>{cr == null ? "—" : cr + "%"}</td>
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
          ยอดขายนับจากใบเสนอราคาที่สถานะ “ลูกค้าตกลง” (ราคารวม VAT) ตามเดือนที่ตัดสิน ·
          “ยังไล่อยู่” คือมูลค่าที่คาดของลูกค้าที่ยังไม่ปิดการขาย นับทุกช่วงเวลาไม่ขึ้นกับเดือนที่เลือก
        </div>
      </div>
    </React.Fragment>
  );
}

/* ============================================================
   SalesJobSummary — บล็อกในใบงานสำหรับเซลล์
   เซลล์ไม่ได้ต้องการสเปคหรือเครื่องมือช่าง แต่ต้องตอบลูกค้าให้ได้ว่า
   "ตอนนี้ถึงไหนแล้ว ติดอะไรอยู่ ติดตั้งวันไหน"
   ============================================================ */
function SalesJobSummary({ job, quotes, onOpenQuote }) {
  const SF = window.SF;
  const idx = SF.STAGE_INDEX[job.stage] != null ? SF.STAGE_INDEX[job.stage] : 0;
  const st = stageOf(job.stage);
  const qs = quotesFor(quotes, "job", job.id);
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
      <div>
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
          <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีใบเสนอราคาผูกกับงานนี้</div>
        ) : qs.map((q) => {
          const s = QUOTE_STATUS_BY[q.status] || QUOTE_STATUS_BY.draft;
          const T = quoteTotals(q);
          return (
            <button key={q.id} onClick={() => onOpenQuote && onOpenQuote(q)} disabled={!onOpenQuote}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", marginBottom: 6,
                background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 11,
                cursor: onOpenQuote ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--mono)" }}>{q.no}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{thDate(q.date, true)}{q.ownerName ? " · " + q.ownerName : ""}</span>
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>฿{sBaht(T.grand)}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color, background: s.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.th}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  SALES_STAGES, SALES_BY, SALES_BACK, salesStageKey, salesStageOf, salesStagePatch,
  LEAD_SOURCES, LEAD_SOURCE_TH, CONTACT_WAYS, sOverdue, sBaht,
  QUOTE_STATUS, QUOTE_STATUS_BY, QUOTE_TERMS_DEF, QUOTE_WARRANTY_DEF,
  blankQuote, quoteTotals, quoteNo, quotesFor, quoteHTML, useQuoteStore,
  quoteSpec, quoteHasSpec, quoteSpecName, quoteSpecDetail,
  QuoteEditor, SalesCard, SalesBoardView, SalesKpiView, SalesJobSummary,
});
