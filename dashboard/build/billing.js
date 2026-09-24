const _BLFB = () => !!window.FBDB;
const BL_ROOT = () => window.DR_ROOT || "";
const _blRef = p => window.FBDB.ref(BL_ROOT() + p);
const blR2 = v => Math.round((+v || 0) * 100) / 100;
const blPad2 = n => (n < 10 ? "0" : "") + n;
const BL_STATUS = [{
  key: "pending",
  th: "ยังไม่ถึงงวด",
  short: "ยังไม่ถึง",
  color: "#94A3B8",
  next: ["ready"]
}, {
  key: "ready",
  th: "ถึงงวดแล้ว",
  short: "ถึงงวด",
  color: "#F59E0B",
  next: ["billed", "pending"]
}, {
  key: "billed",
  th: "ออกเอกสารแล้ว",
  short: "ออกเอกสาร",
  color: "#3B82F6",
  next: ["accepted", "ready"]
}, {
  key: "accepted",
  th: "ส่งมอบเอกสารแล้ว",
  short: "ส่งมอบแล้ว",
  color: "#0EA5E9",
  next: ["paid", "billed"]
}, {
  key: "paid",
  th: "รับเงินแล้ว",
  short: "รับเงินแล้ว",
  color: "#10B981",
  next: ["accepted"]
}];
const BL_STATUS_BY = {};
BL_STATUS.forEach(s => {
  BL_STATUS_BY[s.key] = s;
});
const blStatusOf = k => BL_STATUS_BY[k] || BL_STATUS_BY.pending;
const BL_FLOW = ["pending", "ready", "billed", "accepted", "paid"];
const blFlowIdx = k => BL_FLOW.indexOf(String(k || "pending"));
const blCanUse = role => window.can(role, "billing");
const blCanBack = role => window.can(role, "billing") && window.hasRole(role, "admin");
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
function blPickQuote(quotes, job, leads) {
  const list = window.quotesOfJob(quotes, job, leads);
  return list.find(q => q.status === "accepted") || list[0] || null;
}
const blRowId = i => "MS-" + (i + 1);
function blRowNo(line, i) {
  const m = String(line || "").match(/งวดที่\s*(\d+)/);
  return m ? +m[1] : i + 1;
}
function blSeed(quote, job, user) {
  const now = new Date().toISOString();
  const j = job || {};
  if (!quote) {
    return {
      v: 1,
      from: "manual",
      quoteId: "",
      quoteNo: "",
      ref: "",
      grand: 0,
      vatRate: window.BOQ && window.BOQ.VAT_RATE || 7,
      kwp: +j.kw || 0,
      sig: "",
      seededAt: now,
      seededBy: (user || {}).id || null,
      seededByName: (user || {}).name || "",
      pctTotal: 0,
      rows: []
    };
  }
  const T = window.quoteTotals(quote);
  const split = window.quoteTermSplit(quote.terms, T.grand);
  const rows = split.rows.filter(r => r.pct != null).map((r, i) => blBlankRow({
    id: blRowId(i),
    n: blRowNo(r.line, i),
    line: r.line,
    pct: r.pct,
    amount: blR2(r.amount)
  }));
  return {
    v: 1,
    from: "quote",
    quoteId: quote.id || "",
    quoteNo: quote.no || "",
    ref: quote.no ? "ใบเสนอราคาเลขที่ " + quote.no : "",
    grand: blR2(T.grand),
    vatRate: T.vatRate,
    kwp: +quote.kwp || +j.kw || 0,
    sig: blSig(quote),
    seededAt: now,
    seededBy: (user || {}).id || null,
    seededByName: (user || {}).name || "",
    pctTotal: split.pctTotal,
    rows: rows
  };
}
function blBlankRow(o) {
  const r = o || {};
  return {
    id: r.id || "MS-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4),
    n: r.n || 1,
    line: r.line || "",
    pct: r.pct != null ? r.pct : null,
    amount: blR2(r.amount),
    due: r.due || "",
    subject: "",
    items: [],
    cap: "",
    capDate: "",
    photoIds: [],
    status: "pending",
    docNo: "",
    docDate: "",
    paidAmt: 0,
    payRef: "",
    note: "",
    hist: []
  };
}
function blItems(row) {
  const raw = Array.isArray((row || {}).items) ? (row || {}).items : [];
  return raw.map((it, i) => it && typeof it === "object" ? Object.assign({
    id: "IT-" + (i + 1),
    text: "",
    qty: null,
    unit: "",
    date: ""
  }, it) : {
    id: "IT-" + (i + 1),
    text: String(it == null ? "" : it),
    qty: null,
    unit: "",
    date: ""
  });
}
const blItemId = () => "IT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
const blBlankItem = () => ({
  id: blItemId(),
  text: "",
  qty: null,
  unit: "",
  date: ""
});
function blItemText(it) {
  const o = it || {};
  const t = String(o.text || "").trim();
  const q = o.qty === "" || o.qty == null ? null : +o.qty;
  if (q == null || !isFinite(q) || q <= 0) return t;
  const n = (Math.round(q * 100) / 100).toLocaleString("en-US");
  const u = String(o.unit || "").trim();
  return (t ? t + " " : "") + "จำนวน " + n + (u ? " " + u : "");
}
const blItemsUsed = row => blItems(row).filter(it => String(it.text || "").trim() || blR2(it.qty) > 0);
function blPhotoGroups(row, photos) {
  const r = row || {};
  const list = blDocPhotos(photos);
  const its = blItems(r);
  const out = [];
  its.forEach(it => {
    const ps = list.filter(p => p.item === it.id);
    if (ps.length) out.push({
      id: it.id,
      head: blItemText(it),
      date: it.date || "",
      photos: ps
    });
  });
  const rest = list.filter(p => !p.item || !its.some(it => it.id === p.item));
  if (rest.length) out.push({
    id: "",
    head: r.cap || "",
    date: r.capDate || "",
    photos: rest
  });
  return out;
}
const BL_UNITS = ["แผง", "ตัว", "ชุด", "ใบ", "ต้น", "จุด", "เส้น", "เมตร", "ระบบ", "งาน"];
const blRowLocked = row => blFlowIdx((row || {}).status) >= blFlowIdx("billed");
function blReseed(bills, quote, job, user) {
  const fresh = blSeed(quote, job, user);
  const old = bills && bills.rows || [];
  let kept = 0;
  fresh.rows = fresh.rows.map(r => {
    const prev = old.find(o => o.id === r.id);
    if (!prev) return r;
    if (blRowLocked(prev)) {
      kept++;
      return prev;
    }
    return Object.assign({}, prev, {
      line: r.line,
      pct: r.pct,
      amount: r.amount,
      n: r.n
    });
  });
  old.forEach(o => {
    if (blRowLocked(o) && !fresh.rows.some(r => r.id === o.id)) {
      fresh.rows.push(o);
      kept++;
    }
  });
  fresh.rows.sort((a, b) => a.n - b.n || String(a.id).localeCompare(String(b.id)));
  fresh.locked = kept;
  return fresh;
}
function blNext(row, role, user, bills) {
  const cur = blStatusOf((row || {}).status);
  const back = k => blFlowIdx(k) >= 0 && blFlowIdx(k) < blFlowIdx((row || {}).status);
  return (cur.next || []).filter(k => {
    if (back(k)) return blCanBack(role);
    if (!blCanUse(role)) return false;
    if (k === "billed") return blReadyToBill(row, bills).ok;
    if (k === "paid") return blR2((row || {}).amount) > 0;
    return true;
  }).map(k => BL_STATUS_BY[k]);
}
const blCan = (from, to, role, user, row, bills) => blNext(Object.assign({}, row || {}, {
  status: from
}), role, user, bills).some(s => s.key === to);
function blReadyToBill(row, bills) {
  const r = row || {};
  if (!(blR2(r.amount) > 0)) return {
    ok: false,
    why: "ยังไม่ได้ใส่จำนวนเงินของงวดนี้"
  };
  if (!blItemsUsed(r).filter(it => String(it.text || "").trim()).length) return {
    ok: false,
    why: "ยังไม่ได้ใส่รายการงานที่ส่งมอบในงวดนี้"
  };
  return {
    ok: true,
    why: ""
  };
}
function blMove(row, to, user, opt, job) {
  if (!row) return null;
  const o = opt || {};
  const now = new Date().toISOString();
  const rec = Object.assign({}, row, {
    status: to
  });
  rec.hist = (row.hist || []).concat([{
    at: now,
    from: row.status || "pending",
    to: to,
    by: (user || {}).id || null,
    byName: (user || {}).name || "",
    note: o.note || ""
  }]);
  if (to === "ready" || to === "billed") {
    if (!rec.docNo) rec.docNo = blDocNo(job, rec);
    if (!rec.docDate) rec.docDate = o.date || (window.drToday ? window.drToday() : now.slice(0, 10));
  }
  if (to === "billed") {
    rec.billedAt = now;
    rec.billedBy = (user || {}).id || null;
    rec.billedByName = (user || {}).name || "";
  }
  if (to === "accepted") {
    rec.acceptedAt = now;
    rec.acceptedBy = (user || {}).id || null;
    rec.acceptedByName = (user || {}).name || "";
  }
  if (to === "paid") {
    rec.paidAt = now;
    rec.paidBy = (user || {}).id || null;
    rec.paidByName = (user || {}).name || "";
    if (o.ref != null) rec.payRef = String(o.ref || "");
    if (blR2(rec.paidAmt) < blR2(rec.amount) - 0.01) rec.paidAmt = blR2(rec.amount);
    if (+o.slipN) rec.paySlip = (+rec.paySlip || 0) + +o.slipN;
  }
  if (blFlowIdx(to) < blFlowIdx("paid")) {
    rec.paidAt = null;
    rec.paidBy = null;
    rec.paidByName = "";
  }
  if (blFlowIdx(to) < blFlowIdx("accepted")) {
    rec.acceptedAt = null;
    rec.acceptedBy = null;
    rec.acceptedByName = "";
  }
  return rec;
}
function blDocNo(job, row) {
  const code = String((job || {}).code || "GEN").replace(/^SF-/, "");
  return "FS-BL-" + code + "-" + blPad2((row || {}).n || 1);
}
const blPrintable = row => blFlowIdx((row || {}).status) >= blFlowIdx("ready");
const blRows = job => {
  const b = (job || {}).bills;
  return b && Array.isArray(b.rows) ? b.rows : [];
};
const blHas = job => blRows(job).length > 0;
const blLive = row => (row || {}).status !== "void";
function blCurrentRow(job) {
  const rows = blRows(job).filter(blLive);
  return rows.find(r => r.status !== "paid") || rows[rows.length - 1] || null;
}
function blOverdue(row, today) {
  const r = row || {};
  if (!r.due || !blLive(r) || blFlowIdx(r.status) >= blFlowIdx("billed")) return false;
  return String(r.due) < String(today || (window.drToday ? window.drToday() : ""));
}
function blSummary(job, today) {
  const b = (job || {}).bills || null;
  const all = blRows(job);
  const rows = all.filter(blLive);
  const sum = f => blR2(rows.reduce((a, r) => a + (f(r) || 0), 0));
  const at = k => rows.filter(r => blFlowIdx(r.status) >= blFlowIdx(k));
  const total = sum(r => +r.amount);
  const collected = sum(r => +r.paidAmt);
  const billed = blR2(at("billed").reduce((a, r) => a + (+r.amount || 0), 0));
  return {
    has: all.length > 0,
    grand: blR2(b && b.grand),
    total: total,
    billed: billed,
    collected: collected,
    outstanding: blR2(billed - collected),
    remain: blR2(total - collected),
    count: rows.length,
    voided: all.length - rows.length,
    doneCount: rows.filter(r => r.status === "paid").length,
    readyCount: rows.filter(r => r.status === "ready").length,
    cur: blCurrentRow(job),
    overdue: rows.filter(r => blOverdue(r, today)),
    mismatch: !!(b && b.grand && Math.abs(total - blR2(b.grand)) > 0.01),
    allPaid: rows.length > 0 && rows.every(r => r.status === "paid")
  };
}
const blSubjectOf = row => row && row.subject || "แจ้งส่งมอบงานและวางบิล งวดที่ " + ((row || {}).n || 1);
const blIsSlip = p => (p || {}).kind === "slip";
const blDocPhotos = photos => (photos || []).filter(p => p && p.dataUrl && !blIsSlip(p));
const blSlipsOf = photos => (photos || []).filter(p => p && p.dataUrl && blIsSlip(p));
function blAddSlip(jobId, rowId, slip, user) {
  if (!jobId || !rowId || !_BLFB() || !slip || !slip.dataUrl) return null;
  const id = "BP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).set({
    id: id,
    dataUrl: slip.dataUrl,
    cap: slip.cap || "",
    at: new Date().toISOString(),
    by: (user || {}).id || null,
    byName: (user || {}).name || "",
    src: "upload",
    srcRef: "",
    item: "",
    kind: "slip",
    fileKind: slip.fileKind === "pdf" ? "pdf" : "img",
    name: slip.name || "",
    size: +slip.size || 0
  });
  return id;
}
function useBillPhotos(jobId, rowId) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !rowId || !_BLFB()) {
      setPhotos([]);
      return;
    }
    const ref = _blRef("billPhotos/" + jobId + "/" + rowId);
    const h = ref.on("value", s => {
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
      id,
      dataUrl,
      cap: m.cap || "",
      at: new Date().toISOString(),
      by: (m.user || {}).id || null,
      byName: (m.user || {}).name || "",
      src: m.src || "upload",
      srcRef: m.srcRef || "",
      item: m.item || "",
      kind: m.kind === "slip" ? "slip" : "doc",
      fileKind: m.fileKind === "pdf" ? "pdf" : "img",
      name: m.name || "",
      size: +m.size || 0
    });
    return id;
  }, [jobId, rowId]);
  const setItem = React.useCallback((id, item) => {
    if (!jobId || !rowId || !_BLFB()) return;
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).update({
      item: item || ""
    });
  }, [jobId, rowId]);
  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !rowId || !_BLFB()) return;
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).update({
      cap: cap || ""
    });
  }, [jobId, rowId]);
  const remove = React.useCallback(id => {
    if (!jobId || !rowId || !_BLFB()) return;
    _blRef("billPhotos/" + jobId + "/" + rowId + "/" + id).remove();
  }, [jobId, rowId]);
  return {
    photos,
    add,
    setCap,
    setItem,
    remove
  };
}
Object.assign(window, {
  BL_STATUS,
  BL_STATUS_BY,
  BL_FLOW,
  blStatusOf,
  blFlowIdx,
  blCanUse,
  blCanBack,
  blSig,
  blDrift,
  blPickQuote,
  blSeed,
  blBlankRow,
  blReseed,
  blRowLocked,
  blRowNo,
  blNext,
  blCan,
  blMove,
  blReadyToBill,
  blDocNo,
  blPrintable,
  blItems,
  blItemId,
  blBlankItem,
  blItemText,
  blItemsUsed,
  blPhotoGroups,
  BL_UNITS,
  blRows,
  blHas,
  blLive,
  blCurrentRow,
  blOverdue,
  blSummary,
  blSubjectOf,
  blR2,
  blIsSlip,
  blDocPhotos,
  blSlipsOf,
  blAddSlip,
  useBillPhotos
});