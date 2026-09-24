/* ============================================================
   SolarFlow / flash+solar — งวดงาน · วางบิล (billing milestones)

   งานติดตั้งเก็บเงินเป็นงวด เงื่อนไขการชำระเงินถูกเขียนไว้ในใบเสนอราคาเป็นข้อความอยู่แล้ว
   (q.terms) และ quoteTermSplit ก็แปลงเป็นตัวเงินให้ลูกค้าอ่านตอนเสนอราคาไปแล้ว
   ไฟล์นี้คือขาต่อจากนั้น — ยึดตัวเลขชุดเดียวกันมาเป็น "งวดงาน" ที่เดินสถานะได้
   จะได้ไม่มีใครต้องกดเครื่องคิดเลขซ้ำ แล้วได้ตัวเลขคนละชุดกับใบที่ลูกค้าถืออยู่

   เก็บที่ jobs/<id>.bills (ข้อความล้วน เขียนทั้งก้อนเหมือน job.permit / job.boq)
   รูปประกอบแยกโหนด billPhotos/<jobId>/<rowId>/<photoId> เพราะเป็น base64 ก้อนใหญ่
   ชื่อระดับบนสุดขึ้นต้นด้วย bl/Bl — ทุกไฟล์โหลดเป็นสคริปต์ธรรมดา ชนชื่อเมื่อไหร่ = ทั้งเว็บพัง
   ============================================================ */

const _BLFB = () => !!window.FBDB;
/* ใช้กล่องทรายตัวเดียวกับรายงานประจำวัน — ตั้ง dr_test_root แล้วต้องย้ายทั้งชุด
   ไม่งั้นทดสอบอยู่ในกล่องทรายแต่รูปวิ่งไปกองที่ข้อมูลจริง */
const BL_ROOT = () => window.DR_ROOT || "";
const _blRef = (p) => window.FBDB.ref(BL_ROOT() + p);

const blR2 = (v) => Math.round((+v || 0) * 100) / 100;
const blPad2 = (n) => (n < 10 ? "0" : "") + n;

/* ── ตารางเดินสถานะ ประกาศเป็นข้อมูล ไม่ใช่ if ซ้อน ──
   สี่ขั้นตามที่ออฟฟิศเรียกกันจริง: ถึงงวด → ออกเอกสาร → ส่งมอบเอกสาร → รับเงิน
   pending ไม่ใช่ขั้นตอน มันคือช่องว่างก่อนเริ่ม (งวดที่ยังไม่ถึงกำหนด ยังไม่มีอะไรให้ทำ)
   ปุ่มบนหน้าจอสร้างจากตารางนี้ จึงเสนอขั้นที่ผิดกติกาไม่ได้ตั้งแต่แรก (กฎเดียวกับ EC_STATUS)
   ถอยหลังได้ทุกขั้น เพราะงานเก็บเงินพลาดกันจริง — แต่ถอยได้เฉพาะแอดมิน และประวัติไม่หาย */
const BL_STATUS = [
  { key: "pending",  th: "ยังไม่ถึงงวด",      short: "ยังไม่ถึง",   color: "#94A3B8", next: ["ready"] },
  { key: "ready",    th: "ถึงงวดแล้ว",        short: "ถึงงวด",      color: "#F59E0B", next: ["billed", "pending"] },
  { key: "billed",   th: "ออกเอกสารแล้ว",     short: "ออกเอกสาร",   color: "#3B82F6", next: ["accepted", "ready"] },
  { key: "accepted", th: "ส่งมอบเอกสารแล้ว",  short: "ส่งมอบแล้ว",  color: "#0EA5E9", next: ["paid", "billed"] },
  { key: "paid",     th: "รับเงินแล้ว",        short: "รับเงินแล้ว", color: "#10B981", next: ["accepted"] },
];
const BL_STATUS_BY = {}; BL_STATUS.forEach((s) => { BL_STATUS_BY[s.key] = s; });
const blStatusOf = (k) => BL_STATUS_BY[k] || BL_STATUS_BY.pending;
/* ลำดับความคืบหน้า — ใช้เรียงและหา "งวดที่กำลังเดินอยู่" */
const BL_FLOW = ["pending", "ready", "billed", "accepted", "paid"];
const blFlowIdx = (k) => BL_FLOW.indexOf(String(k || "pending"));

/* ── สิทธิ์ ──
   billing = ตั้งงวด ออกเอกสาร เดินสถานะ (บัญชี/แอดมินออฟฟิศ และหัวหน้า/ผู้จัดการโครงการ)
   ช่างเห็นสถานะได้ แต่กดอะไรไม่ได้ — เขาต้องรู้ว่างวดไหนรอเอกสารจากหน้างานอยู่ */
const blCanUse = (role) => window.can(role, "billing");
/* ถอยหลังคือการแก้เอกสารที่ออกไปแล้ว จำกัดไว้ที่แอดมิน */
const blCanBack = (role) => window.can(role, "billing") && window.hasRole(role, "admin");

/* ── ลายนิ้วมือของใบเสนอราคา ──
   เก็บไว้ในงวด เพื่อตอบคำถามเดียว: "ใบที่งวดนี้ถอดมา ถูกแก้ทีหลังหรือยัง"
   ถ้าถูกแก้ ห้ามเขียนทับเงียบ ๆ เพราะเอกสารบางใบอาจส่งลูกค้าไปแล้ว */
function blSig(quote) {
  if (!quote) return "";
  const T = window.quoteTotals(quote);
  return [quote.no || quote.id || "", blR2(T.grand), (quote.terms || []).join("|")].join("¦");
}
function blDrift(job, quote) {
  const b = (job || {}).bills;
  if (!b || !b.sig || !quote) return false;
  return b.sig !== blSig(quote);
}

/* ใบเสนอราคาที่ควรใช้ถอดงวด — ใบที่ลูกค้าตกลงแล้วมาก่อนเสมอ ไม่มีก็ใบใหม่สุด
   แยกจาก blSeed ตั้งใจ เพื่อให้ blSeed เป็นฟังก์ชันบริสุทธิ์รับใบเดียว ทดสอบได้ไม่ต้องมีตาราง leads */
function blPickQuote(quotes, job, leads) {
  const list = window.quotesOfJob(quotes, job, leads);
  return list.find((q) => q.status === "accepted") || list[0] || null;
}

const blRowId = (i) => "MS-" + (i + 1);
/* เลขงวดที่จะพิมพ์บนเอกสาร — เซลล์พิมพ์ "งวดที่ 2" ไว้ในเงื่อนไขอยู่แล้ว ยึดเลขนั้น
   ลูกค้าอ้างเลขงวดตามใบเสนอราคาเวลาโทรมาถาม ถ้าระบบนับใหม่เองจะคุยกันไม่ตรง */
function blRowNo(line, i) {
  const m = String(line || "").match(/งวดที่\s*(\d+)/);
  return m ? +m[1] : i + 1;
}

/* ── ถอดงวดจากใบเสนอราคา ──
   ยืม quoteTermSplit มาทั้งดุ้น รวมทั้งกฎ "งวด %-สุดท้ายดูดเศษสตางค์" (sales.jsx:390)
   ยอดงวดจึงรวมกันได้เท่ายอดท้ายใบเป๊ะ ๆ ซึ่งเป็นเรื่องความน่าเชื่อถือ ไม่ใช่ความสวยงาม
   บรรทัดที่ไม่มี % คือข้อความอธิบาย (เช่น "ราคานี้ไม่รวมงานฐานราก") ไม่ใช่งวด ต้องไม่ติดมา */
function blSeed(quote, job, user) {
  const now = new Date().toISOString();
  const j = job || {};
  if (!quote) {
    return {
      v: 1, from: "manual", quoteId: "", quoteNo: "", ref: "",
      grand: 0, vatRate: (window.BOQ && window.BOQ.VAT_RATE) || 7, kwp: +j.kw || 0, sig: "",
      seededAt: now, seededBy: (user || {}).id || null, seededByName: (user || {}).name || "",
      pctTotal: 0, rows: [],
    };
  }
  const T = window.quoteTotals(quote);
  const split = window.quoteTermSplit(quote.terms, T.grand);
  const rows = split.rows.filter((r) => r.pct != null).map((r, i) => blBlankRow({
    id: blRowId(i), n: blRowNo(r.line, i), line: r.line, pct: r.pct, amount: blR2(r.amount),
  }));
  return {
    v: 1, from: "quote",
    quoteId: quote.id || "", quoteNo: quote.no || "",
    ref: quote.no ? "ใบเสนอราคาเลขที่ " + quote.no : "",
    grand: blR2(T.grand), vatRate: T.vatRate, kwp: +quote.kwp || +j.kw || 0,
    sig: blSig(quote),
    seededAt: now, seededBy: (user || {}).id || null, seededByName: (user || {}).name || "",
    pctTotal: split.pctTotal, rows: rows,
  };
}

function blBlankRow(o) {
  const r = o || {};
  return {
    id: r.id || "MS-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    n: r.n || 1, line: r.line || "", pct: r.pct != null ? r.pct : null, amount: blR2(r.amount),
    due: r.due || "", subject: "", items: [], cap: "", capDate: "", photoIds: [],
    status: "pending", docNo: "", docDate: "",
    paidAmt: 0, payRef: "", note: "", hist: [],
  };
}

/* ── รายการส่งมอบของงวด — ชุดเดียวที่ใช้ทั้งสองที่ ──
   ข้อ 1, 2, 3 บนใบแจ้งส่งมอบ กับหัวข้อที่ใช้แยกรูปบนหน้ารูป คือของสิ่งเดียวกัน
   แยกเป็นสองชุดเมื่อไร คนกรอกต้องพิมพ์ชื่องานเดียวกันสองรอบ แล้วสุดท้ายก็ไม่ตรงกัน

   รุ่นแรกเก็บ items เป็นสตริงล้วน และมีคำบรรยาย/วันที่/รูปก้อนเดียวทั้งงวด (cap/capDate)
   แปลงตอนอ่านเอา ไม่ไล่ย้ายข้อมูลในฐาน — งวดที่ออกเอกสารไปแล้วห้ามมีอะไรขยับเอง
   รูปเก่าที่ยังไม่ถูกผูกกับข้อไหน ยังพิมพ์ออกมาได้เหมือนเดิมใต้คำบรรยายเดิม */
function blItems(row) {
  const raw = Array.isArray((row || {}).items) ? (row || {}).items : [];
  return raw.map((it, i) => (it && typeof it === "object"
    ? Object.assign({ id: "IT-" + (i + 1), text: "", qty: null, unit: "", date: "" }, it)
    : { id: "IT-" + (i + 1), text: String(it == null ? "" : it), qty: null, unit: "", date: "" }));
}
const blItemId = () => "IT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
const blBlankItem = () => ({ id: blItemId(), text: "", qty: null, unit: "", date: "" });
/* ข้อความที่พิมพ์จริง — "ส่งแผงโซลาร์เซลล์ จำนวน 120 แผง" · ไม่ใส่จำนวนก็เหลือแต่ชื่อ */
function blItemText(it) {
  const o = it || {};
  const t = String(o.text || "").trim();
  const q = o.qty === "" || o.qty == null ? null : +o.qty;
  if (q == null || !isFinite(q) || q <= 0) return t;
  const n = (Math.round(q * 100) / 100).toLocaleString("en-US");
  const u = String(o.unit || "").trim();
  return (t ? t + " " : "") + "จำนวน " + n + (u ? " " + u : "");
}
const blItemsUsed = (row) => blItems(row).filter((it) => String(it.text || "").trim() || blR2(it.qty) > 0);

/* ── จัดรูปเข้ากลุ่มตามข้อ ── หนึ่งข้อ = หนึ่งหัวข้อบนหน้ารูป ขึ้นแผ่นใหม่เสมอ
   รูปที่ยังไม่ถูกผูกกับข้อไหน (รวมถึงรูปที่เลือกไว้ก่อนมีระบบนี้) ไปอยู่กลุ่มท้ายสุด ไม่หายไปเฉย ๆ */
function blPhotoGroups(row, photos) {
  const r = row || {};
  const list = (photos || []).filter((p) => p && p.dataUrl);
  const its = blItems(r);
  const out = [];
  its.forEach((it) => {
    const ps = list.filter((p) => p.item === it.id);
    if (ps.length) out.push({ id: it.id, head: blItemText(it), date: it.date || "", photos: ps });
  });
  const rest = list.filter((p) => !p.item || !its.some((it) => it.id === p.item));
  if (rest.length) out.push({ id: "", head: r.cap || "", date: r.capDate || "", photos: rest });
  return out;
}

const BL_UNITS = ["แผง", "ตัว", "ชุด", "ใบ", "ต้น", "จุด", "เส้น", "เมตร", "ระบบ", "งาน"];
/* งวดที่ออกเอกสารไปแล้ว ห้ามแก้ตัวเลข — ใบที่ลูกค้าถืออยู่ต้องตรงกับที่ระบบบอก */
const blRowLocked = (row) => blFlowIdx((row || {}).status) >= blFlowIdx("billed");

/* ถอดงวดใหม่จากใบล่าสุด โดยไม่แตะงวดที่ออกเอกสารแล้ว
   คืนจำนวนงวดที่ข้ามไปด้วย หน้าจอจะได้บอกตรง ๆ ว่าอะไรไม่ถูกเขียนทับ */
function blReseed(bills, quote, job, user) {
  const fresh = blSeed(quote, job, user);
  const old = (bills && bills.rows) || [];
  let kept = 0;
  fresh.rows = fresh.rows.map((r) => {
    const prev = old.find((o) => o.id === r.id);
    if (!prev) return r;
    if (blRowLocked(prev)) { kept++; return prev; }
    /* งวดที่ยังไม่ออกเอกสาร: เอาตัวเลขใหม่ แต่เก็บของที่คนกรอกมือไว้ (รายการงาน รูป กำหนดวางบิล) */
    return Object.assign({}, prev, { line: r.line, pct: r.pct, amount: r.amount, n: r.n });
  });
  /* งวดที่เคยมีเกินจำนวนในใบใหม่ และออกเอกสารไปแล้ว ต้องไม่หาย */
  old.forEach((o) => {
    if (blRowLocked(o) && !fresh.rows.some((r) => r.id === o.id)) { fresh.rows.push(o); kept++; }
  });
  fresh.rows.sort((a, b) => (a.n - b.n) || String(a.id).localeCompare(String(b.id)));
  fresh.locked = kept;
  return fresh;
}

/* ── ขั้นถัดไปที่ "คนนี้" กดได้จริง ── (กฎเดียวกับ ecNext) */
function blNext(row, role, user, bills) {
  const cur = blStatusOf((row || {}).status);
  const back = (k) => blFlowIdx(k) >= 0 && blFlowIdx(k) < blFlowIdx((row || {}).status);
  return (cur.next || []).filter((k) => {
    if (back(k)) return blCanBack(role);            /* ถอยหลัง = แก้เอกสารที่ออกไปแล้ว */
    if (!blCanUse(role)) return false;
    if (k === "billed") return blReadyToBill(row, bills).ok;
    /* ปุ่มรับเงินเปิดเมื่อมียอดให้รับ — ไม่ใช่รอให้ใครไปกรอก paidAmt ล่วงหน้า (ไม่งั้นปุ่มไม่มีวันโผล่)
       จ่ายมาบางส่วนก่อนหน้านี้ก็กดได้ blMove จะเติมให้เต็มงวดเอง */
    if (k === "paid")   return blR2((row || {}).amount) > 0;
    return true;
  }).map((k) => BL_STATUS_BY[k]);
}
const blCan = (from, to, role, user, row, bills) =>
  blNext(Object.assign({}, row || {}, { status: from }), role, user, bills).some((s) => s.key === to);

/* พร้อมออกเอกสารวางบิลหรือยัง — ตอบเป็นเหตุผล ไม่ใช่แค่ true/false
   ปุ่มที่กดไม่ได้ต้องบอกได้ว่าขาดอะไร ไม่ใช่เทาเฉย ๆ แล้วให้คนเดา */
function blReadyToBill(row, bills) {
  const r = row || {};
  if (!(blR2(r.amount) > 0)) return { ok: false, why: "ยังไม่ได้ใส่จำนวนเงินของงวดนี้" };
  if (!blItemsUsed(r).filter((it) => String(it.text || "").trim()).length)
    return { ok: false, why: "ยังไม่ได้ใส่รายการงานที่ส่งมอบในงวดนี้" };
  return { ok: true, why: "" };
}

/* ── เดินสถานะ = คืนงวดใหม่พร้อมต่อประวัติ ไม่เขียนฐานข้อมูลเอง ──
   (ให้ที่เรียกเป็นคนเขียน จะได้ทดสอบตรรกะได้โดยไม่ต้องมี Firebase — สัญญาเดียวกับ ecMove) */
function blMove(row, to, user, opt, job) {
  if (!row) return null;
  const o = opt || {};
  const now = new Date().toISOString();
  const rec = Object.assign({}, row, { status: to });
  rec.hist = (row.hist || []).concat([{
    at: now, from: row.status || "pending", to: to,
    by: (user || {}).id || null, byName: (user || {}).name || "",
    note: o.note || "",
  }]);
  /* เลขที่เอกสารกับวันที่ถูกแช่แข็งตั้งแต่ "ถึงงวด" ครั้งเดียว — เพราะพิมพ์ใบได้ตั้งแต่ขั้นนั้น
     ห้ามคิดใหม่ตอน render ใบที่ส่งลูกค้าไปแล้วต้องอ้างเลขเดิมได้ตลอด แม้ถอยกลับมาแก้แล้วออกซ้ำ */
  if (to === "ready" || to === "billed") {
    if (!rec.docNo) rec.docNo = blDocNo(job, rec);
    if (!rec.docDate) rec.docDate = o.date || (window.drToday ? window.drToday() : now.slice(0, 10));
  }
  if (to === "billed") {
    rec.billedAt = now; rec.billedBy = (user || {}).id || null; rec.billedByName = (user || {}).name || "";
  }
  if (to === "accepted") {
    rec.acceptedAt = now; rec.acceptedBy = (user || {}).id || null; rec.acceptedByName = (user || {}).name || "";
  }
  if (to === "paid") {
    rec.paidAt = now; rec.paidBy = (user || {}).id || null; rec.paidByName = (user || {}).name || "";
    if (o.ref != null) rec.payRef = String(o.ref || "");
    /* กดรับเงิน = รับครบงวดนี้แล้ว — ยอดที่เคยรับบางส่วนไว้ถูกเติมให้เต็ม ไม่งั้นยอดคงค้างจะค้างเป็นเศษตลอดไป */
    if (blR2(rec.paidAmt) < blR2(rec.amount) - 0.01) rec.paidAmt = blR2(rec.amount);
  }
  /* ถอยกลับก่อนรับเงิน = ยอดที่บันทึกรับไว้ยังไม่ควรนับ แต่ไม่ลบทิ้ง (เผื่อเป็นเงินมัดจำที่เข้ามาจริง)
     ล้างแค่ตราเวลาการรับเงิน ไม่งั้นหน้ารวมจะโชว์ว่า "รับเงินโดย X" ทั้งที่สถานะถอยมาแล้ว */
  if (blFlowIdx(to) < blFlowIdx("paid")) { rec.paidAt = null; rec.paidBy = null; rec.paidByName = ""; }
  if (blFlowIdx(to) < blFlowIdx("accepted")) { rec.acceptedAt = null; rec.acceptedBy = null; rec.acceptedByName = ""; }
  return rec;
}

/* ── เลขที่เอกสาร — FS-BL-2448-02 ── (ลอกรูปแบบจาก ecDocNo expense.jsx:238)
   ผูกกับรหัสงาน + เลขงวด จึงชนกันไม่ได้แม้บัญชีสองคนออกใบต่างงานพร้อมกัน
   ตัวนับกลางที่ไล่จากรายการทั้งระบบทำแบบนั้นไม่ได้ */
function blDocNo(job, row) {
  const code = String((job || {}).code || "GEN").replace(/^SF-/, "");
  return "FS-BL-" + code + "-" + blPad2((row || {}).n || 1);
}

/* พิมพ์ชุดเอกสารได้ตั้งแต่กด "ถึงงวด" — ออฟฟิศต้องเอาใบไปคุยกับลูกค้าก่อน ถึงจะออกเอกสารจริงได้ */
const blPrintable = (row) => blFlowIdx((row || {}).status) >= blFlowIdx("ready");

const blRows = (job) => { const b = (job || {}).bills; return (b && Array.isArray(b.rows)) ? b.rows : []; };
const blHas = (job) => blRows(job).length > 0;
/* void ถูกเลิกใช้แล้ว เหลือไว้เป็นตะแกรงกันงวดเก่าที่เคยถูกยกเลิกไว้ ไม่ให้หลุดเข้ามาในยอดเงิน */
const blLive = (row) => (row || {}).status !== "void";

/* งวดที่กำลังเดินอยู่ — งวดแรกที่ยังไม่ปิด ใช้เป็นหัวใจของการ์ดในใบงาน
   ปิดครบแล้วคืนงวดสุดท้าย เพื่อให้การ์ดยังมีอะไรให้อ่าน ไม่ใช่ว่างเปล่า */
function blCurrentRow(job) {
  const rows = blRows(job).filter(blLive);
  return rows.find((r) => r.status !== "paid") || rows[rows.length - 1] || null;
}

/* เลยกำหนดวางบิล — มีกำหนดไว้ ผ่านมาแล้ว และยังไม่ได้ออกเอกสาร */
function blOverdue(row, today) {
  const r = row || {};
  if (!r.due || !blLive(r) || blFlowIdx(r.status) >= blFlowIdx("billed")) return false;
  return String(r.due) < String(today || (window.drToday ? window.drToday() : ""));
}

/* ── สรุปเงินของงานหนึ่งงาน ──
   ตัวเลขชุดเดียวที่การ์ด หน้ารวม และไทล์ใช้ร่วมกัน ไม่ให้แต่ละที่บวกเอง */
function blSummary(job, today) {
  const b = (job || {}).bills || null;
  const all = blRows(job);
  const rows = all.filter(blLive);
  const sum = (f) => blR2(rows.reduce((a, r) => a + (f(r) || 0), 0));
  const at = (k) => rows.filter((r) => blFlowIdx(r.status) >= blFlowIdx(k));
  const total = sum((r) => +r.amount);
  const collected = sum((r) => +r.paidAmt);
  const billed = blR2(at("billed").reduce((a, r) => a + (+r.amount || 0), 0));
  return {
    has: all.length > 0,
    grand: blR2(b && b.grand),
    total: total, billed: billed, collected: collected,
    outstanding: blR2(billed - collected),
    remain: blR2(total - collected),
    count: rows.length, voided: all.length - rows.length,
    doneCount: rows.filter((r) => r.status === "paid").length,
    readyCount: rows.filter((r) => r.status === "ready").length,
    cur: blCurrentRow(job),
    overdue: rows.filter((r) => blOverdue(r, today)),
    /* ผลรวมรายงวดไม่เท่ายอดตามใบ = มีคนแก้มือแล้วลืมปรับงวดอื่น ต้องเตือน ไม่ใช่แก้ให้เอง */
    mismatch: !!(b && b.grand && Math.abs(total - blR2(b.grand)) > 0.01),
    allPaid: rows.length > 0 && rows.every((r) => r.status === "paid"),
  };
}

/* หัวข้อ "เรื่อง" บนใบ — ว่างไว้ก็ได้ ระบบเขียนให้ตามมาตรฐาน */
const blSubjectOf = (row) => (row && row.subject) || ("แจ้งส่งมอบงานและวางบิล งวดที่ " + ((row || {}).n || 1));

/* ── รูปประกอบการวางบิล ──
   คัดลอก dataUrl มาเก็บที่นี่เสมอ ไม่อ้างอิงรูปต้นทาง — dailyPhotos/jobPhotos ช่างลบได้
   เอกสารที่ส่งลูกค้าไปแล้วกลายเป็นหน้าเปล่าไม่ได้ (หลักเดียวกับใบเบิกที่ยึดยอดตอนบันทึก)
   โครงลอกจาก useDailyPhotos (daily.jsx:336) */
function useBillPhotos(jobId, rowId) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !rowId || !_BLFB()) { setPhotos([]); return; }
    const ref = _blRef("billPhotos/" + jobId + "/" + rowId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId, rowId]);

  const add = React.useCallback((dataUrl, meta) => {
    if (!jobId || !rowId || !_BLFB() || !dataUrl) return null;
    const m = meta || {};
    const id = "BP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).set({
      id, dataUrl, cap: m.cap || "", at: new Date().toISOString(),
      by: (m.user || {}).id || null, byName: (m.user || {}).name || "",
      src: m.src || "upload", srcRef: m.srcRef || "",
      /* ผูกกับข้อที่กำลังเปิดอยู่ตั้งแต่ตอนเลือก — ย้ายทีหลังได้ แต่ส่วนใหญ่ไม่ต้องแตะอีก */
      item: m.item || "",
    });
    return id;
  }, [jobId, rowId]);

  /* ย้ายรูประหว่างข้อ — เขียนแค่ฟิลด์เดียว ไม่แตะ dataUrl ที่เป็นก้อนใหญ่ */
  const setItem = React.useCallback((id, item) => {
    if (!jobId || !rowId || !_BLFB()) return;
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).update({ item: item || "" });
  }, [jobId, rowId]);

  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !rowId || !_BLFB()) return;
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).update({ cap: cap || "" });
  }, [jobId, rowId]);

  const remove = React.useCallback((id) => {
    if (!jobId || !rowId || !_BLFB()) return;
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).remove();
  }, [jobId, rowId]);

  return { photos, add, setCap, setItem, remove };
}

Object.assign(window, {
  BL_STATUS, BL_STATUS_BY, BL_FLOW, blStatusOf, blFlowIdx,
  blCanUse, blCanBack, blSig, blDrift, blPickQuote, blSeed, blBlankRow, blReseed, blRowLocked, blRowNo,
  blNext, blCan, blMove, blReadyToBill, blDocNo, blPrintable,
  blItems, blItemId, blBlankItem, blItemText, blItemsUsed, blPhotoGroups, BL_UNITS,
  blRows, blHas, blLive, blCurrentRow, blOverdue, blSummary, blSubjectOf, blR2,
  useBillPhotos,
});
