const EC_ROOT = (() => {
  try {
    if (/(^|[?&])test=1(&|$)/.test(window.location.search || "")) return "_sandbox/";
    return localStorage.getItem("ec_test_root") || "";
  } catch (e) {
    return "";
  }
})();
const _ECFB = () => !!window.FBDB;
const _ecRef = p => window.FBDB.ref(EC_ROOT + p);
const _ecRoot = () => window.FBDB.ref(EC_ROOT || "/");
const ecRound = n => Math.round((+n || 0) * 100) / 100;
const ecBaht = n => ecRound(n).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const ecBahtShort = n => Math.round(+n || 0).toLocaleString("en-US");
const EC_KIND = [{
  key: "buy",
  th: "ซื้อของหน้างาน",
  color: "#2563EB",
  hint: "ของขาด ของเสีย ซื้อเพิ่มหน้างาน"
}, {
  key: "transport",
  th: "ค่าขนส่งของ",
  color: "#0D9488",
  hint: "ค่ารถส่งของ ค่าขนของขึ้นหลังคา"
}, {
  key: "fuel",
  th: "ค่าน้ำมัน / เดินทาง",
  color: "#F59E0B",
  hint: "น้ำมันรถ ทางด่วน ที่จอดรถ"
}, {
  key: "food",
  th: "ค่าอาหาร / ที่พัก",
  color: "#7C5CFC",
  hint: "งานต่างจังหวัดที่ค้างคืน"
}, {
  key: "labor",
  th: "ค่าแรงจ้างช่วง",
  color: "#EC4899",
  hint: "จ้างคนช่วยยกของ ช่างนอกทีม"
}, {
  key: "other",
  th: "อื่น ๆ",
  color: "#64748B",
  hint: "ระบุในหมายเหตุให้ชัด"
}];
const EC_KIND_BY = {};
EC_KIND.forEach(k => {
  EC_KIND_BY[k.key] = k;
});
const ecKindOf = k => EC_KIND_BY[k] || EC_KIND_BY.other;
const EC_PAY = [{
  key: "own",
  th: "ออกเงินตัวเองไปก่อน",
  color: "#EF4444",
  owed: true,
  hint: "บริษัทต้องคืนเงินให้คนนี้"
}, {
  key: "mate",
  th: "คนอื่นออกเงินให้",
  color: "#EF4444",
  owed: true,
  hint: "เลือกชื่อคนที่ควักเงินจริง เงินคืนจะเข้าชื่อคนนั้น"
}, {
  key: "petty",
  th: "เงินสดกองกลาง",
  color: "#F59E0B",
  owed: false,
  hint: "ใช้เงินสดย่อยของบริษัท"
}, {
  key: "company",
  th: "บัตร / บัญชีบริษัท",
  color: "#10B981",
  owed: false,
  hint: "จ่ายจากบัญชีบริษัทโดยตรง"
}];
const EC_PAY_BY = {};
EC_PAY.forEach(p => {
  EC_PAY_BY[p.key] = p;
});
const ecPayOf = k => EC_PAY_BY[k] || EC_PAY_BY.own;
function ecOwedTo(c) {
  const o = c || {};
  if (!ecPayOf(o.payMethod).owed) return {
    id: null,
    name: ""
  };
  if (o.payMethod === "mate" && o.owedToId) return {
    id: o.owedToId,
    name: o.owedToName || ""
  };
  return {
    id: o.byId || null,
    name: o.byName || ""
  };
}
const EC_STATUS = [{
  key: "draft",
  th: "ร่าง",
  color: "#94A3B8",
  next: ["sent"]
}, {
  key: "sent",
  th: "รออนุมัติ",
  color: "#F59E0B",
  next: ["approved", "rejected"]
}, {
  key: "approved",
  th: "อนุมัติแล้ว",
  color: "#0EA5E9",
  next: ["paid", "sent"]
}, {
  key: "paid",
  th: "จ่ายคืนแล้ว",
  color: "#10B981",
  next: []
}, {
  key: "rejected",
  th: "ไม่อนุมัติ",
  color: "#EF4444",
  next: ["draft"]
}];
const EC_STATUS_BY = {};
EC_STATUS.forEach(s => {
  EC_STATUS_BY[s.key] = s;
});
const ecStatusOf = k => EC_STATUS_BY[k] || EC_STATUS_BY.draft;
const ecOpen = c => {
  const k = (c || {}).status || "draft";
  return k !== "paid" && k !== "rejected";
};
const ecCanUse = role => window.can(role, "expense");
const ecCanApprove = role => window.can(role, "expenseApprove");
const ecCanPay = role => window.can(role, "expensePay");
const ecCanCover = role => window.can(role, "expenseCover") || ecCanPay(role);
const ecCanDelete = role => window.hasRole(role, "admin");
function ecApproverFor(user, users) {
  const id = (user || {}).approverId;
  if (!id) return null;
  return (users || []).find(u => u.id === id) || null;
}
function ecApproveCheck(claim, user, role) {
  if (!claim || !user) return {
    ok: false,
    why: ""
  };
  if (!ecCanApprove(role)) return {
    ok: false,
    why: "ไม่มีสิทธิ์อนุมัติใบเบิก"
  };
  if (claim.byId && claim.byId === user.id && !user.selfApprove) {
    return {
      ok: false,
      why: "อนุมัติใบของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ"
    };
  }
  if (claim.approverId && claim.approverId !== claim.byId && claim.approverId !== user.id && !window.hasRole(role, "admin")) {
    return {
      ok: false,
      why: "ใบนี้ส่งถึง " + (claim.approverName || "คนอื่น") + " โดยตรง"
    };
  }
  const lim = +user.approveLimit || 0;
  if (lim > 0 && ecRound(claim.amount) > lim) {
    return {
      ok: false,
      why: "เกินวงเงินที่อนุมัติได้ (" + ecBahtShort(lim) + " บาท) — ต้องให้แอดมินอนุมัติ"
    };
  }
  return {
    ok: true,
    why: ""
  };
}
function ecPayCheck(amount, user, role) {
  if (!ecCanPay(role)) return {
    ok: false,
    why: "ไม่มีสิทธิ์บันทึกจ่ายเงินคืน"
  };
  const lim = +(user || {}).payLimit || 0;
  const amt = ecRound(amount && typeof amount === "object" ? amount.amount : amount);
  if (lim > 0 && amt > lim) {
    return {
      ok: false,
      why: "ยอดนี้เกินวงเงินที่คุณจ่ายได้ (" + ecBahtShort(lim) + " บาท) — ต้องให้คนที่วงเงินสูงกว่าเป็นคนกด"
    };
  }
  return {
    ok: true,
    why: ""
  };
}
function ecNext(claim, role, user) {
  const cur = ecStatusOf((claim || {}).status);
  const mine = claim && user && claim.byId === user.id;
  const appr = ecApproveCheck(claim, user, role).ok;
  return (cur.next || []).filter(k => {
    if (k === "sent") return mine || ecCanApprove(role);
    if (k === "approved") return appr;
    if (k === "rejected") return appr;
    if (k === "paid") return ecPayCheck(claim, user, role).ok;
    if (k === "draft") return mine || ecCanApprove(role);
    return false;
  }).map(k => EC_STATUS_BY[k]);
}
const ecCan = (from, to, role, user, claim) => ecNext(Object.assign({}, claim || {}, {
  status: from
}), role, user).some(s => s.key === to);
function ecMove(claim, to, user, note) {
  if (!claim) return null;
  const now = new Date().toISOString();
  const rec = Object.assign({}, claim, {
    status: to,
    updatedAt: now
  });
  rec.hist = (claim.hist || []).concat([{
    at: now,
    from: claim.status || "draft",
    to: to,
    by: (user || {}).id || null,
    byName: (user || {}).name || "",
    note: (note && typeof note === "object" ? note.text : note) || ""
  }]);
  if (to === "sent") {
    rec.sentAt = now;
  }
  if (to === "approved" || to === "rejected") {
    rec.decidedAt = now;
    rec.decidedNote = (note && typeof note === "object" ? note.text : note) || "";
    rec.decidedById = (user || {}).id || null;
    rec.decidedByName = (user || {}).name || "";
  }
  if (to === "paid") {
    rec.paidAt = now;
    rec.paidById = (user || {}).id || null;
    rec.paidByName = (user || {}).name || "";
    if (note && note.ref != null) rec.paidRef = String(note.ref || "");
  }
  if (to === "draft" || to === "sent") {
    rec.decidedAt = null;
    rec.decidedNote = "";
    rec.decidedById = null;
    rec.decidedByName = "";
    rec.paidAt = null;
    rec.paidById = null;
    rec.paidByName = "";
  }
  return rec;
}
function ecPayable(claims, userId) {
  return (claims || []).filter(c => c && c.status === "approved" && ecPayOf(c.payMethod).owed && (!userId || ecOwedTo(c).id === userId));
}
function ecBatchNo(batches, today) {
  const d = String(today || window.drToday());
  const ym = d.slice(2, 4) + d.slice(5, 7);
  const n = (batches || []).filter(b => b && String(b.no || "").indexOf("PAY-" + ym) === 0).length + 1;
  return "PAY-" + ym + "-" + window.drPad2(n);
}
function ecBlankBatch(person, claims, user, batches) {
  const list = claims || [];
  return {
    id: "PB-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: ecBatchNo(batches, window.drToday()),
    date: window.drToday(),
    toId: (person || {}).id || null,
    toName: (person || {}).name || "",
    claimIds: list.map(c => c.id),
    count: list.length,
    total: ecRound(list.reduce((a, c) => a + ecRound(c.amount), 0)),
    ref: "",
    note: "",
    byId: (user || {}).id || null,
    byName: (user || {}).name || "",
    at: new Date().toISOString()
  };
}
function ecDocNo(job, claims) {
  const code = String((job || {}).code || "GEN").replace(/^SF-/, "");
  const n = (claims || []).filter(c => c && (c.jobId || "") === ((job || {}).id || "")).length + 1;
  return "FS-EX-" + code + "-" + window.drPad2(n);
}
function ecBlank(job, user, claims, users) {
  const now = new Date().toISOString();
  const id = "EC-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return {
    id,
    no: ecDocNo(job, claims),
    jobId: (job || {}).id || null,
    siteCode: (job || {}).code || "",
    siteName: (job || {}).name || "",
    kind: "buy",
    items: [],
    amount: 0,
    date: window.drToday(),
    payMethod: "own",
    note: "",
    byId: (user || {}).id || null,
    byName: (user || {}).name || "",
    approverId: (user || {}).approverId || null,
    approverName: (ecApproverFor(user, users) || {}).name || "",
    status: "draft",
    createdAt: now,
    hist: []
  };
}
function ecSum(items) {
  return ecRound((items || []).reduce((s, r) => {
    const amt = r && r.amount !== "" && r.amount != null ? +r.amount : (+(r || {}).qty || 0) * (+(r || {}).price || 0);
    return s + (isFinite(amt) ? amt : 0);
  }, 0));
}
function ecVisible(claims, user, role) {
  const all = claims || [];
  if (ecCanApprove(role) || ecCanPay(role) || ecCanCover(role)) return all;
  const uid = (user || {}).id || null;
  return all.filter(c => c && (c.byId === uid || ecOwedTo(c).id === uid));
}
function ecRollupByPerson(claims) {
  const out = {};
  const row = (id, name) => {
    const k = id || "-";
    if (!out[k]) out[k] = {
      id: k,
      name: name || "-",
      draft: 0,
      waiting: 0,
      approved: 0,
      paid: 0,
      owed: 0,
      count: 0
    };
    if (name) out[k].name = name;
    return out[k];
  };
  (claims || []).forEach(c => {
    if (!c) return;
    const to = ecOwedTo(c);
    const o = row(to.id || c.byId, to.name || c.byName);
    const amt = ecRound(c.amount);
    o.count += 1;
    if (c.status === "draft") o.draft += amt;else if (c.status === "sent") o.waiting += amt;else if (c.status === "approved") {
      o.approved += amt;
      if (ecPayOf(c.payMethod).owed) o.owed += amt;
    } else if (c.status === "paid") o.paid += amt;
  });
  Object.keys(out).forEach(k => {
    const o = out[k];
    o.draft = ecRound(o.draft);
    o.waiting = ecRound(o.waiting);
    o.approved = ecRound(o.approved);
    o.paid = ecRound(o.paid);
    o.owed = ecRound(o.owed);
  });
  return out;
}
function ecRollupByJob(claims) {
  const out = {};
  (claims || []).forEach(c => {
    if (!c || !c.jobId) return;
    if (!out[c.jobId]) out[c.jobId] = {
      jobId: c.jobId,
      code: c.siteCode || "",
      name: c.siteName || "",
      total: 0,
      count: 0,
      byKind: {},
      waiting: 0,
      waitCount: 0,
      owed: 0
    };
    const o = out[c.jobId];
    const amt = ecRound(c.amount);
    if (c.siteName) o.name = c.siteName;
    if (c.siteCode) o.code = c.siteCode;
    if (c.status === "sent") {
      o.waiting = ecRound(o.waiting + amt);
      o.waitCount += 1;
      return;
    }
    if (c.status !== "approved" && c.status !== "paid") return;
    o.total = ecRound(o.total + amt);
    o.count += 1;
    o.byKind[c.kind || "other"] = ecRound((o.byKind[c.kind || "other"] || 0) + amt);
    if (c.status === "approved" && ecPayOf(c.payMethod).owed) o.owed = ecRound(o.owed + amt);
  });
  return out;
}
function ecJobSum(claims, jobId) {
  const empty = {
    jobId: jobId || null,
    total: 0,
    count: 0,
    byKind: {},
    waiting: 0,
    waitCount: 0,
    owed: 0
  };
  if (!jobId) return empty;
  return ecRollupByJob((claims || []).filter(c => c && c.jobId === jobId))[jobId] || empty;
}
function ecRollup(claims, user, role) {
  const list = claims || [];
  const r = {
    total: list.length,
    draft: 0,
    sent: 0,
    approved: 0,
    paid: 0,
    rejected: 0,
    sentAmt: 0,
    owedAmt: 0,
    mineOpen: 0,
    mineOwed: 0,
    waitingMine: 0
  };
  list.forEach(c => {
    const amt = ecRound(c.amount);
    const k = c.status || "draft";
    if (r[k] != null) r[k] += 1;
    if (k === "sent") {
      r.sentAmt += amt;
      if (ecApproveCheck(c, user, role).ok) r.waitingMine += 1;
    }
    if (k === "approved" && ecPayOf(c.payMethod).owed) r.owedAmt += amt;
    if (user && c.byId === user.id && ecOpen(c)) r.mineOpen += 1;
    if (user && k === "approved" && ecPayOf(c.payMethod).owed && ecOwedTo(c).id === user.id) r.mineOwed += amt;
  });
  r.sentAmt = ecRound(r.sentAmt);
  r.owedAmt = ecRound(r.owedAmt);
  r.mineOwed = ecRound(r.mineOwed);
  return r;
}
function useEcClaims() {
  const [claims, setClaims] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_ECFB()) {
      setLoading(false);
      return;
    }
    const ref = _ecRef("ecClaims");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const arr = Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k]));
      arr.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setClaims(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback(c => {
    if (!c || !c.id || !_ECFB()) return;
    const rec = Object.assign({}, c, {
      amount: ecSum(c.items),
      updatedAt: new Date().toISOString()
    });
    _ecRef("ecClaims/" + c.id).set(rec);
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (!id || !_ECFB()) return;
    const extra = fields && fields.items ? {
      amount: ecSum(fields.items)
    } : {};
    _ecRef("ecClaims/" + id).update(Object.assign({}, fields, extra, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const remove = React.useCallback(id => {
    if (!id || !_ECFB()) return;
    _ecRef("ecClaims/" + id).remove();
    _ecRef("ecReceipts/" + id).remove();
  }, []);
  return {
    claims,
    loading,
    save,
    patch,
    remove
  };
}
function useEcReceipts(claimId) {
  const [shots, setShots] = React.useState([]);
  React.useEffect(() => {
    if (!claimId || !_ECFB()) {
      setShots([]);
      return;
    }
    const ref = _ecRef("ecReceipts/" + claimId);
    const h = ref.on("value", s => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setShots(arr);
    });
    return () => ref.off("value", h);
  }, [claimId]);
  const add = React.useCallback((dataUrl, user, meta) => {
    if (!claimId || !_ECFB() || !dataUrl) return;
    const m = meta || {};
    const id = "RC-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _ecRef("ecReceipts/" + claimId + "/" + id).set({
      id,
      dataUrl,
      at: new Date().toISOString(),
      kind: m.kind === "pdf" ? "pdf" : "img",
      name: m.name || "",
      size: +m.size || 0,
      by: (user || {}).id || null,
      byName: (user || {}).name || ""
    });
  }, [claimId]);
  const remove = React.useCallback(id => {
    if (!claimId || !_ECFB() || !id) return;
    _ecRef("ecReceipts/" + claimId + "/" + id).remove();
  }, [claimId]);
  const sync = React.useCallback(current => {
    if (!claimId || !_ECFB()) return;
    if (Number(current || 0) === shots.length) return;
    _ecRef("ecClaims/" + claimId).update({
      receiptCount: shots.length
    });
  }, [claimId, shots.length]);
  return {
    shots,
    add,
    remove,
    sync
  };
}
const EC_PDF_MAX_MB = 4;
const ecReceiptKind = r => (r || {}).kind === "pdf" ? "pdf" : "img";
const ecFileSize = n => !n ? "" : n < 1024 ? n + " B" : n < 1024 * 1024 ? Math.round(n / 1024) + " KB" : (n / 1024 / 1024).toFixed(1) + " MB";
function useEcBatches() {
  const [batches, setBatches] = React.useState([]);
  React.useEffect(() => {
    if (!_ECFB()) return;
    const ref = _ecRef("ecBatches");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const arr = Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k]));
      arr.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
      setBatches(arr);
    });
    return () => ref.off("value", h);
  }, []);
  const payBatch = React.useCallback((batch, claims, user) => {
    if (!batch || !_ECFB()) return Promise.resolve(false);
    const now = new Date().toISOString();
    const up = {};
    up["ecBatches/" + batch.id] = batch;
    (claims || []).forEach(c => {
      const rec = ecMove(c, "paid", user, {
        text: "จ่ายในรอบ " + batch.no,
        ref: batch.ref
      });
      rec.batchId = batch.id;
      rec.batchNo = batch.no;
      rec.paidAt = now;
      up["ecClaims/" + c.id] = rec;
    });
    return _ecRoot().update(up).then(() => true).catch(() => false);
  }, []);
  return {
    batches,
    payBatch
  };
}
function ecNotify(n) {
  if (!_ECFB() || !n) return;
  const id = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  _ecRef("notifications/" + id).set(Object.assign({
    id,
    read: false,
    at: new Date().toISOString(),
    type: "expense",
    event: "expense"
  }, n));
  if (!EC_ROOT && window.lnPush) window.lnPush(id);
}
function useEcLive(on) {
  const [claims, setClaims] = React.useState([]);
  React.useEffect(() => {
    if (!on || !_ECFB()) {
      setClaims([]);
      return;
    }
    const ref = _ecRef("ecClaims");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      setClaims(Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k])));
    });
    return () => ref.off("value", h);
  }, [on]);
  const byJob = React.useMemo(() => ecRollupByJob(claims), [claims]);
  return {
    claims,
    byJob
  };
}
Object.assign(window, {
  EC_ROOT,
  EC_KIND,
  EC_KIND_BY,
  EC_PAY,
  EC_PAY_BY,
  EC_STATUS,
  EC_STATUS_BY,
  ecRound,
  ecBaht,
  ecBahtShort,
  ecKindOf,
  ecPayOf,
  ecOwedTo,
  ecStatusOf,
  ecOpen,
  ecCanUse,
  ecCanApprove,
  ecCanPay,
  ecCanCover,
  ecCanDelete,
  ecApproverFor,
  ecApproveCheck,
  ecPayCheck,
  ecNext,
  ecCan,
  ecMove,
  ecDocNo,
  ecBlank,
  ecSum,
  ecVisible,
  ecPayable,
  ecBatchNo,
  ecBlankBatch,
  useEcReceipts,
  useEcBatches,
  EC_PDF_MAX_MB,
  ecReceiptKind,
  ecFileSize,
  ecRollupByPerson,
  ecRollupByJob,
  ecJobSum,
  ecRollup,
  useEcClaims,
  useEcLive,
  ecNotify
});