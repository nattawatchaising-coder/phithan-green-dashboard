/* ============================================================
   flash+solar — ใบเบิกเงินหน้างาน (Expense Claims)

   ระบบเดิมรู้ว่า "เบิกของ" ไปเท่าไหร่ (ตัดสต๊อกใน store.jsx) แต่ไม่รู้เลยว่า
   ใครควักเงินตัวเองไปเท่าไหร่ — ช่างซื้อของหน้างาน จ่ายค่าขนส่ง ค่าน้ำมัน
   แล้วต้องทวงกันทางแชท ไม่มีที่บันทึกและไม่มีใครรู้ว่าบริษัทติดเงินใครอยู่

   ระวังคำว่า "เบิก" ในโปรเจกต์นี้ — ทุกจุดที่มีอยู่เดิมหมายถึงเบิกวัสดุจากคลัง
   ไฟล์นี้คือเบิก "เงิน" คนละเรื่องกันคนละก้อนเงิน

   ── แยกของหนักออกจากของเบา (กฎเดียวกับรายงานประจำวัน daily.jsx:10-13) ──
     ecClaims/{claimId}              = ใบเบิก (เบา · แบน ไม่ซ้อนใต้งาน)
     ecReceipts/{claimId}/{photoId}  = รูปบิล base64 (หนัก — โหลดเฉพาะใบที่เปิด)

   แบนไม่ซ้อนใต้ jobs/ ด้วยเหตุผลเดียวกับ omTickets: useJobStore ฟังทั้งต้นไม้ jobs
   และทุกหน้าถือมันอยู่ · ใบเบิกบางใบไม่ผูกกับงาน · และหนี้ที่ค้างจ่ายต้องอยู่ต่อ
   แม้ใบงานจะถูกลบทิ้ง (store.jsx:166 purge)

   ── เงิน ──
   เก็บเป็นตัวเลขบาท ทศนิยม 2 ตำแหน่ง ปัดทุกครั้งที่เขียนด้วย ecRound()
   อย่าบวก float ดิบหลายสิบรายการแล้วเอาไปเทียบเท่ากัน

   ── ปีไทย ──
   ทุกฟังก์ชันในไฟล์นี้รับ-คืนเป็น ค.ศ. (YYYY-MM-DD) เท่านั้น
   แปลงเป็น พ.ศ. ตอนแสดงผลด้วย drDateTH เท่านั้น

   ตั้งชื่อ top-level ขึ้นต้นด้วย ec/Ec/EC เพราะทุกไฟล์โหลดเป็นสคริปต์ธรรมดา
   (ใช้ ex/Ex ไม่ได้ ชนกับ exportShortageXlsx ใน views-overview.jsx)
   ============================================================ */

/* ── โหมดทดสอบ ──
   ตั้ง localStorage.ec_test_root = "_sandbox/" แล้วรีโหลด — ข้อมูลทุกอย่างของโมดูลนี้
   จะไปอยู่ใต้ _sandbox/ ไม่แตะข้อมูลจริง ค่าปกติต้องเป็นค่าว่างเสมอ */
const EC_ROOT = (() => { try { return localStorage.getItem("ec_test_root") || ""; } catch (e) { return ""; } })();
const _ECFB = () => !!window.FBDB;
const _ecRef = (p) => window.FBDB.ref(EC_ROOT + p);

/* ── เงิน ── */
const ecRound = (n) => Math.round((+n || 0) * 100) / 100;
const ecBaht = (n) => ecRound(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* ตัวเลขสั้นสำหรับไทล์ — 12,400 ไม่ใช่ 12,400.00 เพราะไทล์อ่านเร็ว ๆ ไม่ได้เอาไปกระทบยอด */
const ecBahtShort = (n) => Math.round(+n || 0).toLocaleString("en-US");

/* ── หมวดค่าใช้จ่าย ── */
const EC_KIND = [
  { key: "buy",       th: "ซื้อของหน้างาน", color: "#2563EB", hint: "ของขาด ของเสีย ซื้อเพิ่มหน้างาน" },
  { key: "transport", th: "ค่าขนส่งของ",    color: "#0D9488", hint: "ค่ารถส่งของ ค่าขนของขึ้นหลังคา" },
  { key: "fuel",      th: "ค่าน้ำมัน / เดินทาง", color: "#F59E0B", hint: "น้ำมันรถ ทางด่วน ที่จอดรถ" },
  { key: "food",      th: "ค่าอาหาร / ที่พัก", color: "#7C5CFC", hint: "งานต่างจังหวัดที่ค้างคืน" },
  { key: "labor",     th: "ค่าแรงจ้างช่วง",  color: "#EC4899", hint: "จ้างคนช่วยยกของ ช่างนอกทีม" },
  { key: "other",     th: "อื่น ๆ",          color: "#64748B", hint: "ระบุในหมายเหตุให้ชัด" },
];
const EC_KIND_BY = {}; EC_KIND.forEach((k) => { EC_KIND_BY[k.key] = k; });
const ecKindOf = (k) => EC_KIND_BY[k] || EC_KIND_BY.other;

/* ── ที่มาของเงินที่จ่ายไป ──
   สำคัญกว่าที่เห็น: "own" เท่านั้นที่เป็นหนี้ที่บริษัทต้องคืนคน
   petty/company คือเงินบริษัทที่จ่ายออกไปแล้ว ต้องแยกออกจากยอดค้างจ่ายรายคน
   ไม่งั้นตัวเลข "ติดเงินคนนี้อยู่เท่าไหร่" จะบวมเกินจริงจนเอาไปจ่ายจริงไม่ได้ */
const EC_PAY = [
  { key: "own",     th: "ออกเงินตัวเองไปก่อน", color: "#EF4444", owed: true,  hint: "บริษัทต้องคืนเงินให้คนนี้" },
  { key: "petty",   th: "เงินสดกองกลาง",       color: "#F59E0B", owed: false, hint: "ใช้เงินสดย่อยของบริษัท" },
  { key: "company", th: "บัตร / บัญชีบริษัท",   color: "#10B981", owed: false, hint: "จ่ายจากบัญชีบริษัทโดยตรง" },
];
const EC_PAY_BY = {}; EC_PAY.forEach((p) => { EC_PAY_BY[p.key] = p; });
const ecPayOf = (k) => EC_PAY_BY[k] || EC_PAY_BY.own;

/* ── ตารางเดินสถานะ ประกาศเป็นข้อมูล ไม่ใช่ if ซ้อน ──
   ปุ่มบนหน้าจอสร้างจากตารางนี้ จึงเสนอขั้นที่ผิดกติกาไม่ได้ตั้งแต่แรก */
const EC_STATUS = [
  { key: "draft",    th: "ร่าง",          color: "#94A3B8", next: ["sent"] },
  { key: "sent",     th: "รออนุมัติ",     color: "#F59E0B", next: ["approved", "rejected"] },
  { key: "approved", th: "อนุมัติแล้ว",   color: "#0EA5E9", next: ["paid", "sent"] },
  { key: "paid",     th: "จ่ายคืนแล้ว",   color: "#10B981", next: [] },
  { key: "rejected", th: "ไม่อนุมัติ",    color: "#EF4444", next: ["draft"] },
];
const EC_STATUS_BY = {}; EC_STATUS.forEach((s) => { EC_STATUS_BY[s.key] = s; });
const ecStatusOf = (k) => EC_STATUS_BY[k] || EC_STATUS_BY.draft;
/* ใบที่ยัง "เดินอยู่" — ยังไม่จบกระบวนการ ใช้กับไทล์และแถบเตือน */
const ecOpen = (c) => { const k = ((c || {}).status) || "draft"; return k !== "paid" && k !== "rejected"; };

/* ── สิทธิ์ ──
   expense        ส่งใบเบิกของตัวเอง
   expenseApprove อนุมัติ / ไม่อนุมัติ
   expensePay     บันทึกว่าจ่ายเงินคืนแล้ว
   แยกคนอนุมัติออกจากคนจ่ายตั้งใจ — เป็นการควบคุมขั้นพื้นฐานของเงินสดย่อย */
const ecCanUse     = (role) => window.can(role, "expense");
const ecCanApprove = (role) => window.can(role, "expenseApprove");
const ecCanPay     = (role) => window.can(role, "expensePay");
const ecCanDelete  = (role) => window.hasRole(role, "admin");

/* ใครต้องอนุมัติใบของคนนี้ — ว่าง = เข้ากองกลาง ใครที่มีสิทธิ์อนุมัติก็หยิบได้ */
function ecApproverFor(user, users) {
  const id = (user || {}).approverId;
  if (!id) return null;
  return (users || []).find((u) => u.id === id) || null;
}

/* คนนี้อนุมัติ "ใบนี้" ได้ไหม — คืนเหตุผลกลับไปด้วย หน้าจอจะได้บอกได้ว่าทำไมกดไม่ได้
   กฎที่ไม่มีข้อยกเว้น: ห้ามอนุมัติใบของตัวเอง แม้แอดมิน
   แอดมินที่เบิกเองต้องให้แอดมินอีกคนอนุมัติ หรือใช้ "บัตร/บัญชีบริษัท" ซึ่งไม่ใช่หนี้ที่ต้องคืนใคร */
function ecApproveCheck(claim, user, role) {
  if (!claim || !user) return { ok: false, why: "" };
  if (!ecCanApprove(role)) return { ok: false, why: "ไม่มีสิทธิ์อนุมัติใบเบิก" };
  if (claim.byId && claim.byId === user.id) return { ok: false, why: "อนุมัติใบของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ" };
  /* ใบที่ระบุตัวผู้อนุมัติไว้แล้ว คนอื่นไม่ควรมาแย่งอนุมัติ ยกเว้นแอดมินที่ต้องปลดล็อกได้เวลาคนนั้นลา */
  if (claim.approverId && claim.approverId !== user.id && !window.hasRole(role, "admin")) {
    return { ok: false, why: "ใบนี้ส่งถึง " + (claim.approverName || "คนอื่น") + " โดยตรง" };
  }
  const lim = +user.approveLimit || 0;
  if (lim > 0 && ecRound(claim.amount) > lim) {
    return { ok: false, why: "เกินวงเงินที่อนุมัติได้ (" + ecBahtShort(lim) + " บาท) — ต้องให้แอดมินอนุมัติ" };
  }
  return { ok: true, why: "" };
}

/* ขั้นถัดไปที่ "คนนี้" กดได้จริง — กรองด้วยสิทธิ์แล้ว ปุ่มที่กดไม่ได้จะไม่โผล่ตั้งแต่แรก */
function ecNext(claim, role, user) {
  const cur = ecStatusOf((claim || {}).status);
  const mine = claim && user && claim.byId === user.id;
  const appr = ecApproveCheck(claim, user, role).ok;
  return (cur.next || []).filter((k) => {
    if (k === "sent")     return mine || ecCanApprove(role);          /* ส่งใบ / ตีกลับให้แก้ */
    if (k === "approved") return appr;
    if (k === "rejected") return appr;
    if (k === "paid")     return ecCanPay(role);
    if (k === "draft")    return mine || ecCanApprove(role);          /* ใบที่ไม่อนุมัติ เอากลับมาแก้ */
    return false;
  }).map((k) => EC_STATUS_BY[k]);
}
const ecCan = (from, to, role, user, claim) =>
  ecNext(Object.assign({}, claim || {}, { status: from }), role, user).some((s) => s.key === to);

/* เดินสถานะ = คืนเรคคอร์ดใหม่พร้อมต่อประวัติ ไม่เขียนฐานข้อมูลเอง
   (ให้ที่เรียกเป็นคนเขียน จะได้ทดสอบตรรกะได้โดยไม่ต้องมี Firebase) */
function ecMove(claim, to, user, note) {
  if (!claim) return null;
  const now = new Date().toISOString();
  const rec = Object.assign({}, claim, { status: to, updatedAt: now });
  rec.hist = (claim.hist || []).concat([{
    at: now, from: claim.status || "draft", to: to,
    by: (user || {}).id || null, byName: (user || {}).name || "", note: note || "",
  }]);
  if (to === "sent") { rec.sentAt = now; }
  if (to === "approved" || to === "rejected") {
    /* คนตัดสินเก็บแยกจาก approverId เสมอ — approverId คือ "ใบนี้ส่งถึงใคร" ตามที่ตั้งไว้ในโปรไฟล์
       ถ้าเขียนทับกัน ใบที่ถูกตีกลับมาแก้จะล็อกให้เฉพาะคนที่เคยปฏิเสธเท่านั้นที่อนุมัติได้ */
    rec.decidedAt = now; rec.decidedNote = note || "";
    rec.decidedById = (user || {}).id || null; rec.decidedByName = (user || {}).name || "";
  }
  if (to === "paid") { rec.paidAt = now; rec.paidById = (user || {}).id || null; rec.paidByName = (user || {}).name || ""; }
  /* ตีกลับมาแก้ = ล้างผลการตัดสินเดิมทิ้ง ไม่งั้นใบจะโชว์ว่า "อนุมัติโดย X" ทั้งที่ยังรออนุมัติอยู่ */
  if (to === "draft" || to === "sent") {
    rec.decidedAt = null; rec.decidedNote = ""; rec.decidedById = null; rec.decidedByName = "";
    rec.paidAt = null; rec.paidById = null; rec.paidByName = "";
  }
  return rec;
}

/* ── เลขที่ใบ — FS-EX-2446-01 ── (ลอกรูปแบบจาก drDocNo daily.jsx:201) */
function ecDocNo(job, claims) {
  const code = String((job || {}).code || "GEN").replace(/^SF-/, "");
  const n = (claims || []).filter((c) => c && (c.jobId || "") === ((job || {}).id || "") ).length + 1;
  return "FS-EX-" + code + "-" + window.drPad2(n);
}

function ecBlank(job, user, claims, users) {
  const now = new Date().toISOString();
  const id = "EC-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return {
    id, no: ecDocNo(job, claims),
    /* snapshot ชื่อ/รหัสไซต์ไว้ในใบ เพราะเป็นเอกสารการเงิน ต้องอ่านรู้เรื่องแม้ใบงานถูกลบไปแล้ว */
    jobId: (job || {}).id || null,
    siteCode: (job || {}).code || "", siteName: (job || {}).name || "",
    kind: "buy", items: [], amount: 0,
    date: window.drToday(), payMethod: "own", note: "",
    byId: (user || {}).id || null, byName: (user || {}).name || "",
    /* ชื่อคนอนุมัติถ่ายสำเนาไว้ตอนเปิดใบ เพื่อให้ใบเก่ายังอ่านออกแม้ผู้ใช้คนนั้นถูกลบทีหลัง */
    approverId: (user || {}).approverId || null,
    approverName: (ecApproverFor(user, users) || {}).name || "",
    status: "draft", createdAt: now, hist: [],
  };
}

/* ยอดรวมของใบ = ผลบวกรายการเสมอ ห้ามให้พิมพ์ทับ — ตัวเลขต้องตรงกับบิลที่แนบมา */
function ecSum(items) {
  return ecRound((items || []).reduce((s, r) => {
    const amt = (r && r.amount !== "" && r.amount != null) ? +r.amount : (+(r || {}).qty || 0) * (+(r || {}).price || 0);
    return s + (isFinite(amt) ? amt : 0);
  }, 0));
}

/* ── ขอบเขตการมองเห็น (เข้มกว่าโมดูลอื่น เพราะเป็นเงิน) ──
   คนที่ไม่มีสิทธิ์อนุมัติเห็นเฉพาะใบของตัวเอง — กรองที่ชั้นข้อมูล ไม่ใช่ซ่อนปุ่มบนหน้าจอ */
function ecVisible(claims, user, role) {
  const all = claims || [];
  if (ecCanApprove(role) || ecCanPay(role)) return all;
  const uid = (user || {}).id || null;
  return all.filter((c) => c && c.byId === uid);
}

/* ── ยอดรายคน ──
   owed = อนุมัติแล้วแต่ยังไม่จ่าย และเป็นเงินที่คนนั้นควักเอง = "บริษัทติดเงินคนนี้อยู่เท่าไหร่"
   ตัวเลขนี้คือตัวเดียวที่เอาไปจ่ายจริงได้ ที่เหลือเป็นข้อมูลประกอบ */
function ecRollupByPerson(claims) {
  const out = {};
  (claims || []).forEach((c) => {
    if (!c) return;
    const id = c.byId || "-";
    if (!out[id]) out[id] = { id, name: c.byName || "-", draft: 0, waiting: 0, approved: 0, paid: 0, owed: 0, count: 0 };
    const o = out[id];
    const amt = ecRound(c.amount);
    o.count += 1;
    if (c.byName) o.name = c.byName;
    if (c.status === "draft") o.draft += amt;
    else if (c.status === "sent") o.waiting += amt;
    else if (c.status === "approved") { o.approved += amt; if (ecPayOf(c.payMethod).owed) o.owed += amt; }
    else if (c.status === "paid") o.paid += amt;
  });
  Object.keys(out).forEach((k) => {
    const o = out[k];
    o.draft = ecRound(o.draft); o.waiting = ecRound(o.waiting);
    o.approved = ecRound(o.approved); o.paid = ecRound(o.paid); o.owed = ecRound(o.owed);
  });
  return out;
}

/* ── ยอดรายไซต์ = ต้นทุนจริงหน้างาน ──
   นับเฉพาะใบที่ผ่านการอนุมัติแล้ว (approved/paid) — ใบที่ยังไม่มีใครตรวจ ไม่ใช่ต้นทุน
   ไม่รวมค่าของที่เบิกจากคลัง เพราะของนั้นบริษัทซื้อไปก่อนแล้ว คนละก้อนเงินกัน */
function ecRollupByJob(claims) {
  const out = {};
  (claims || []).forEach((c) => {
    if (!c || !c.jobId) return;
    if (c.status !== "approved" && c.status !== "paid") return;
    if (!out[c.jobId]) out[c.jobId] = { jobId: c.jobId, code: c.siteCode || "", name: c.siteName || "", total: 0, count: 0, byKind: {} };
    const o = out[c.jobId];
    const amt = ecRound(c.amount);
    o.total = ecRound(o.total + amt); o.count += 1;
    o.byKind[c.kind || "other"] = ecRound((o.byKind[c.kind || "other"] || 0) + amt);
    if (c.siteName) o.name = c.siteName;
  });
  return out;
}

/* ไทล์บนหัวหน้า — waitingMine = ใบที่ "คนนี้" ต้องไปกดอนุมัติ ไม่ใช่ใบที่รออนุมัติทั้งระบบ */
function ecRollup(claims, user, role) {
  const list = claims || [];
  const r = { total: list.length, draft: 0, sent: 0, approved: 0, paid: 0, rejected: 0,
    sentAmt: 0, owedAmt: 0, mineOpen: 0, mineOwed: 0, waitingMine: 0 };
  list.forEach((c) => {
    const amt = ecRound(c.amount);
    const k = c.status || "draft";
    if (r[k] != null) r[k] += 1;
    if (k === "sent") { r.sentAmt += amt; if (ecApproveCheck(c, user, role).ok) r.waitingMine += 1; }
    if (k === "approved" && ecPayOf(c.payMethod).owed) r.owedAmt += amt;
    if (user && c.byId === user.id) {
      if (ecOpen(c)) r.mineOpen += 1;
      if (k === "approved" && ecPayOf(c.payMethod).owed) r.mineOwed += amt;
    }
  });
  r.sentAmt = ecRound(r.sentAmt); r.owedAmt = ecRound(r.owedAmt); r.mineOwed = ecRound(r.mineOwed);
  return r;
}

/* ================================================================
   hooks — โครงลอกจาก useOmTickets (om.jsx:642)
   ================================================================ */
function useEcClaims() {
  const [claims, setClaims] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_ECFB()) { setLoading(false); return; }
    const ref = _ecRef("ecClaims");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ id: k }, v[k]));
      /* เรียงตามวันที่จ่ายเงินจริง ไม่ใช่วันที่สร้างใบ — ใบที่กรอกย้อนหลังต้องไปอยู่ตามวันของมัน */
      arr.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))
        || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setClaims(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  const save = React.useCallback((c) => {
    if (!c || !c.id || !_ECFB()) return;
    const rec = Object.assign({}, c, { amount: ecSum(c.items), updatedAt: new Date().toISOString() });
    _ecRef("ecClaims/" + c.id).set(rec);
  }, []);
  /* แก้รายการเมื่อไหร่ ยอดรวมต้องขยับตามทันทีในคำสั่งเขียนเดียวกัน
     ไม่งั้นใบจะค้างยอดเก่าไว้จนกว่าจะมีใครกด save ทั้งใบ — ตัวเลขไม่ตรงบิลคือบั๊กที่แพงที่สุดของโมดูลนี้ */
  const patch = React.useCallback((id, fields) => {
    if (!id || !_ECFB()) return;
    const extra = fields && fields.items ? { amount: ecSum(fields.items) } : {};
    _ecRef("ecClaims/" + id).update(Object.assign({}, fields, extra, { updatedAt: new Date().toISOString() }));
  }, []);
  /* ลบใบ = ลบรูปบิลด้วย ไม่งั้นรูปค้างอยู่ในฐานข้อมูลโดยไม่มีใครอ้างถึง */
  const remove = React.useCallback((id) => {
    if (!id || !_ECFB()) return;
    _ecRef("ecClaims/" + id).remove();
    _ecRef("ecReceipts/" + id).remove();
  }, []);

  return { claims, loading, save, patch, remove };
}

/* แจ้งเตือน — เขียนผ่าน _ecRef เพราะโมดูลนี้ทดสอบใต้ _sandbox/ ได้
   (ผลคือในโหมดทดสอบ แจ้งเตือนจะไม่โผล่ในกระดิ่งจริง ตั้งใจให้เป็นแบบนั้น) */
function ecNotify(n) {
  if (!_ECFB() || !n) return;
  const id = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  _ecRef("notifications/" + id).set(Object.assign({
    id, read: false, at: new Date().toISOString(), type: "expense", event: "expense",
  }, n));
}

Object.assign(window, {
  EC_ROOT, EC_KIND, EC_KIND_BY, EC_PAY, EC_PAY_BY, EC_STATUS, EC_STATUS_BY,
  ecRound, ecBaht, ecBahtShort, ecKindOf, ecPayOf, ecStatusOf, ecOpen,
  ecCanUse, ecCanApprove, ecCanPay, ecCanDelete,
  ecApproverFor, ecApproveCheck, ecNext, ecCan, ecMove,
  ecDocNo, ecBlank, ecSum, ecVisible,
  ecRollupByPerson, ecRollupByJob, ecRollup,
  useEcClaims, ecNotify,
});
