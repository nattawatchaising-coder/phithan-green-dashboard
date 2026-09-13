const TM_ROOT = (() => {
  try {
    if (new URLSearchParams(location.search).get("test") === "1") return "_sandbox/";
    return localStorage.getItem("tm_test_root") || "";
  } catch (e) {
    return "";
  }
})();
const _TMFB = () => !!window.FBDB;
const _tmRef = p => window.FBDB.ref(TM_ROOT + p);
const _tmRoot = () => window.FBDB.ref(TM_ROOT || "/");
function tmHM(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(str || "").trim());
  if (!m) return null;
  const h = +m[1],
    mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
const tmHHMM = mins => {
  const n = Math.max(0, Math.round(+mins || 0)) % 1440;
  return window.drPad2(Math.floor(n / 60)) + ":" + window.drPad2(n % 60);
};
const tmNowHM = () => {
  const d = new Date();
  return window.drPad2(d.getHours()) + ":" + window.drPad2(d.getMinutes());
};
function tmSpanMins(from, to) {
  const a = tmHM(from),
    b = tmHM(to);
  if (a == null || b == null) return 0;
  return b >= a ? b - a : b + 1440 - a;
}
function tmDur(mins) {
  const n = Math.max(0, Math.round(+mins || 0));
  const h = Math.floor(n / 60),
    m = n % 60;
  if (!n) return "—";
  return (h ? h + " ชม." : "") + (h && m ? " " : "") + (m ? m + " น." : "");
}
const TM_WH_DEFAULT = {
  start: "08:00",
  end: "17:00",
  days: [1, 2, 3, 4, 5, 6],
  lunchMins: 60,
  minOtMins: 30,
  roundMins: 30,
  holidays: {}
};
function tmWhNorm(cfg) {
  const c = Object.assign({}, TM_WH_DEFAULT, cfg || {});
  c.days = Array.isArray(c.days) && c.days.length ? c.days.map(Number) : TM_WH_DEFAULT.days;
  c.lunchMins = Math.max(0, +c.lunchMins || 0);
  c.minOtMins = Math.max(0, +c.minOtMins || 0);
  c.roundMins = Math.max(0, +c.roundMins || 0);
  c.holidays = c.holidays && typeof c.holidays === "object" ? c.holidays : {};
  if (tmHM(c.start) == null) c.start = TM_WH_DEFAULT.start;
  if (tmHM(c.end) == null) c.end = TM_WH_DEFAULT.end;
  return c;
}
const tmIsHoliday = (dateISO, cfg) => !!tmWhNorm(cfg).holidays[String(dateISO || "").slice(0, 10)];
function tmIsWorkday(dateISO, cfg) {
  const c = tmWhNorm(cfg);
  if (c.holidays[String(dateISO || "").slice(0, 10)]) return false;
  const d = new Date(String(dateISO || "").slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return true;
  return c.days.indexOf(d.getDay()) >= 0;
}
const TM_OT_KIND = [{
  key: "ot",
  th: "ล่วงเวลาวันทำงาน",
  color: "#F59E0B",
  hint: "ทำต่อหลังเลิกงาน หรือมาก่อนเวลา"
}, {
  key: "holiday",
  th: "ทำงานวันหยุด",
  color: "#EF4444",
  hint: "เสาร์-อาทิตย์ หรือวันหยุดที่บริษัทประกาศ"
}, {
  key: "night",
  th: "งานกลางคืน",
  color: "#6366F1",
  hint: "งานที่ต้องทำหลังพระอาทิตย์ตกถึงเช้า"
}];
const TM_OT_KIND_BY = {};
TM_OT_KIND.forEach(k => {
  TM_OT_KIND_BY[k.key] = k;
});
const tmOtKindOf = k => TM_OT_KIND_BY[k] || TM_OT_KIND_BY.ot;
function tmOtKindGuess(dateISO, from, cfg) {
  if (!tmIsWorkday(dateISO, cfg)) return "holiday";
  const a = tmHM(from);
  if (a != null && (a >= 20 * 60 || a < 5 * 60)) return "night";
  return "ot";
}
function tmOtMinutes(dateISO, from, to, cfg) {
  const c = tmWhNorm(cfg);
  const span = tmSpanMins(from, to);
  if (span <= 0) return 0;
  let outside = span;
  if (tmIsWorkday(dateISO, c)) {
    const ws = tmHM(c.start),
      we = tmHM(c.end);
    const a = tmHM(from);
    const s = a,
      e = a + span;
    const lo = Math.max(s, ws),
      hi = Math.min(e, we);
    outside = span - Math.max(0, hi - lo);
  }
  if (c.roundMins > 0) outside = Math.floor(outside / c.roundMins) * c.roundMins;
  return outside >= c.minOtMins ? outside : 0;
}
function tmWorkedMins(rec, cfg) {
  const c = tmWhNorm(cfg);
  const spans = [];
  if (rec && rec.in && rec.in.hm && rec.out && rec.out.hm) spans.push([rec.in.hm, rec.out.hm]);
  (rec && Array.isArray(rec.extra) ? rec.extra : []).forEach(x => {
    if (x && x.in && x.in.hm && x.out && x.out.hm) spans.push([x.in.hm, x.out.hm]);
  });
  let total = 0;
  spans.forEach(([a, b]) => {
    let m = tmSpanMins(a, b);
    if (c.lunchMins > 0 && m > 360) m -= c.lunchMins;
    total += Math.max(0, m);
  });
  return total;
}
const tmOpen = rec => !!(rec && rec.in && rec.in.hm && !(rec.out && rec.out.hm));
function tmAttendBlank(user, dateISO) {
  return {
    id: (user || {}).id + "_" + dateISO,
    userId: (user || {}).id || null,
    userName: (user || {}).name || "",
    techId: (user || {}).techId || null,
    date: dateISO,
    in: null,
    out: null,
    extra: [],
    jobId: null,
    jobCode: "",
    note: "",
    mins: 0,
    src: "web",
    hist: [],
    updatedAt: new Date().toISOString()
  };
}
function tmPunch(gps, src) {
  const d = new Date();
  const p = {
    at: d.toISOString(),
    hm: window.drPad2(d.getHours()) + ":" + window.drPad2(d.getMinutes()),
    src: src || "web"
  };
  if (gps && !gps.err) {
    p.lat = gps.lat;
    p.lng = gps.lng;
    p.acc = gps.acc || 0;
  } else if (gps && gps.err) {
    p.err = gps.err;
  }
  return p;
}
const tmDayIndex = (rec, cfg) => ({
  userId: rec.userId,
  name: rec.userName || "",
  techId: rec.techId || null,
  in: rec.in && rec.in.hm || "",
  out: rec.out && rec.out.hm || "",
  mins: tmWorkedMins(rec, cfg),
  gps: !!(rec.in && rec.in.lat),
  jobCode: rec.jobCode || ""
});
const TM_OT_STATUS = [{
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
  color: "#10B981",
  next: []
}, {
  key: "rejected",
  th: "ไม่อนุมัติ",
  color: "#EF4444",
  next: ["draft"]
}];
const TM_OT_STATUS_BY = {};
TM_OT_STATUS.forEach(s => {
  TM_OT_STATUS_BY[s.key] = s;
});
const tmOtStatusOf = k => TM_OT_STATUS_BY[k] || TM_OT_STATUS_BY.draft;
const tmOtOpen = r => {
  const k = (r || {}).status || "draft";
  return k === "draft" || k === "sent";
};
const tmCanAttend = role => window.can(role, "attend");
const tmCanAttendAll = role => window.can(role, "attendAll");
const tmCanOt = role => window.can(role, "ot");
const tmCanOtApprove = role => window.can(role, "otApprove");
function tmOtApproveCheck(rec, user, role) {
  if (!rec || !user) return {
    ok: false,
    why: ""
  };
  if (!tmCanOtApprove(role)) return {
    ok: false,
    why: "ไม่มีสิทธิ์อนุมัติใบ OT"
  };
  if (rec.userId && rec.userId === user.id) return {
    ok: false,
    why: "อนุมัติใบของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ"
  };
  if (rec.approverId && rec.approverId !== user.id && !window.hasRole(role, "admin")) {
    return {
      ok: false,
      why: "ใบนี้ส่งถึง " + (rec.approverName || "คนอื่น") + " โดยตรง"
    };
  }
  return {
    ok: true,
    why: ""
  };
}
function tmOtNext(rec, role, user) {
  const cur = tmOtStatusOf((rec || {}).status);
  const mine = rec && user && rec.userId === user.id;
  const appr = tmOtApproveCheck(rec, user, role).ok;
  return (cur.next || []).filter(k => {
    if (k === "sent") return mine;
    if (k === "approved") return appr;
    if (k === "rejected") return appr;
    if (k === "draft") return mine || appr;
    return false;
  }).map(k => TM_OT_STATUS_BY[k]);
}
function tmOtMove(rec, to, user, note) {
  if (!rec) return null;
  const now = new Date().toISOString();
  const out = Object.assign({}, rec, {
    status: to,
    updatedAt: now
  });
  const txt = (note && typeof note === "object" ? note.text : note) || "";
  out.hist = (rec.hist || []).concat([{
    at: now,
    from: rec.status || "draft",
    to: to,
    by: (user || {}).id || null,
    byName: (user || {}).name || "",
    note: txt
  }]);
  if (to === "sent") out.sentAt = now;
  if (to === "approved" || to === "rejected") {
    out.decidedAt = now;
    out.decidedNote = txt;
    out.decidedById = (user || {}).id || null;
    out.decidedByName = (user || {}).name || "";
  }
  if (to === "draft") {
    out.decidedAt = null;
    out.decidedNote = "";
    out.decidedById = null;
    out.decidedByName = "";
  }
  return out;
}
function tmOtDocNo(list, dateISO) {
  const d = String(dateISO || window.drToday());
  const be = String(+d.slice(0, 4) + 543).slice(2);
  const ym = be + d.slice(5, 7);
  const n = (list || []).filter(r => r && String(r.no || "").indexOf("OT-" + ym) === 0).length + 1;
  return "OT-" + ym + "-" + window.drPad2(n);
}
function tmOtBlank(user, users, list, job, cfg) {
  const now = new Date().toISOString();
  const date = window.drToday();
  const approver = (user || {}).approverId && (users || []).find(u => u.id === user.approverId) || null;
  return {
    id: "OT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: tmOtDocNo(list, date),
    userId: (user || {}).id || null,
    userName: (user || {}).name || "",
    techId: (user || {}).techId || null,
    jobId: (job || {}).id || null,
    jobCode: (job || {}).code || "",
    date,
    from: "17:00",
    to: "20:00",
    mins: 0,
    kind: tmOtKindGuess(date, "17:00", cfg),
    reason: "",
    approverId: (user || {}).approverId || null,
    approverName: (approver || {}).name || "",
    status: "draft",
    createdAt: now,
    hist: []
  };
}
function tmOtVisible(list, user, role) {
  if (tmCanOtApprove(role) || tmCanAttendAll(role)) return list || [];
  const uid = (user || {}).id || null;
  return (list || []).filter(r => r && r.userId === uid);
}
function tmOtRollup(list, user, role) {
  const r = {
    total: 0,
    draft: 0,
    sent: 0,
    approved: 0,
    rejected: 0,
    waitingMine: 0,
    minsApproved: 0,
    mineOpen: 0
  };
  (list || []).forEach(x => {
    if (!x) return;
    r.total += 1;
    const k = x.status || "draft";
    if (r[k] != null) r[k] += 1;
    if (k === "sent" && tmOtApproveCheck(x, user, role).ok) r.waitingMine += 1;
    if (k === "approved") r.minsApproved += Math.max(0, +x.mins || 0);
    if (user && x.userId === user.id && tmOtOpen(x)) r.mineOpen += 1;
  });
  return r;
}
function useAttend(userId, days) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const n = Math.max(1, +days || 45);
  React.useEffect(() => {
    if (!userId || !_TMFB()) {
      setRows([]);
      setLoading(false);
      return;
    }
    const ref = _tmRef("attend/" + userId).orderByKey().limitToLast(n);
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const arr = Object.keys(v).map(k => Object.assign({
        date: k
      }, v[k]));
      arr.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      setRows(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [userId, n]);
  return {
    rows,
    loading,
    today: rows.find(r => r.date === window.drToday()) || null
  };
}
function useAttendDay(dateISO) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!dateISO || !_TMFB()) {
      setRows([]);
      setLoading(false);
      return;
    }
    const ref = _tmRef("attendDay/" + dateISO);
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const arr = Object.keys(v).map(k => Object.assign({
        userId: k
      }, v[k]));
      arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
      setRows(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [dateISO]);
  return {
    rows,
    loading
  };
}
function useAttendWriter(user, cfg) {
  const uid = (user || {}).id || null;
  const punch = React.useCallback(async (which, opt) => {
    if (!uid || !_TMFB()) return {
      ok: false,
      why: "ยังเชื่อมต่อฐานข้อมูลไม่ได้"
    };
    const o = opt || {};
    const date = window.drToday();
    const gps = o.skipGps ? {
      err: "skipped"
    } : await window.captureGps();
    const p = tmPunch(gps, o.src || "web");
    const snap = await _tmRef("attend/" + uid + "/" + date).once("value").catch(() => null);
    const cur = snap && snap.val() || tmAttendBlank(user, date);
    const rec = Object.assign({}, tmAttendBlank(user, date), cur);
    if (which === "in") {
      if (rec.in && rec.in.hm && !(rec.out && rec.out.hm)) return {
        ok: false,
        why: "ลงเวลาเข้างานไปแล้วเมื่อ " + rec.in.hm,
        rec
      };
      if (rec.in && rec.in.hm && rec.out && rec.out.hm) {
        rec.extra = (rec.extra || []).concat([{
          in: p,
          out: null
        }]);
      } else {
        rec.in = p;
      }
    } else {
      const ex = rec.extra || [];
      const openIdx = ex.findIndex(x => x && x.in && !(x.out && x.out.hm));
      if (openIdx >= 0) ex[openIdx] = Object.assign({}, ex[openIdx], {
        out: p
      });else if (rec.in && rec.in.hm && !(rec.out && rec.out.hm)) rec.out = p;else return {
        ok: false,
        why: "ยังไม่ได้ลงเวลาเข้างานของวันนี้",
        rec
      };
      rec.extra = ex;
    }
    if (o.jobId !== undefined) {
      rec.jobId = o.jobId || null;
      rec.jobCode = o.jobCode || "";
    }
    if (o.note !== undefined) rec.note = o.note || "";
    rec.src = o.src || rec.src || "web";
    rec.mins = tmWorkedMins(rec, cfg);
    rec.updatedAt = new Date().toISOString();
    rec.hist = (rec.hist || []).concat([{
      at: rec.updatedAt,
      what: which,
      hm: p.hm,
      gps: !p.err
    }]);
    const patch = {};
    patch["attend/" + uid + "/" + date] = rec;
    patch["attendDay/" + date + "/" + uid] = tmDayIndex(rec, cfg);
    await _tmRoot().update(patch);
    return {
      ok: true,
      rec,
      punch: p
    };
  }, [uid, user, cfg]);
  return {
    punch
  };
}
function useOtClaims() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_TMFB()) {
      setLoading(false);
      return;
    }
    const ref = _tmRef("tmOt");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const arr = Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k]));
      arr.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setRows(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback(r => {
    if (!r || !r.id || !_TMFB()) return;
    _tmRef("tmOt/" + r.id).set(Object.assign({}, r, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (!id || !_TMFB()) return;
    _tmRef("tmOt/" + id).update(Object.assign({}, fields, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const remove = React.useCallback(id => {
    if (!id || !_TMFB()) return;
    _tmRef("tmOt/" + id).remove();
  }, []);
  return {
    rows,
    loading,
    save,
    patch,
    remove
  };
}
function useWorkHours() {
  const [cfg, setCfg] = React.useState(TM_WH_DEFAULT);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_TMFB()) {
      setLoading(false);
      return;
    }
    const ref = window.FBDB.ref("config/workHours");
    const h = ref.on("value", s => {
      setCfg(tmWhNorm(s.val()));
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback(next => {
    if (!_TMFB()) return;
    window.FBDB.ref("config/workHours").set(tmWhNorm(next));
  }, []);
  return {
    cfg,
    loading,
    save
  };
}
function tmNotify(n) {
  if (!_TMFB() || !n) return;
  const id = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  window.FBDB.ref("notifications/" + id).set(Object.assign({
    id,
    read: false,
    at: new Date().toISOString(),
    type: "ot",
    event: "ot"
  }, n));
  if (!TM_ROOT && window.lnPush) window.lnPush(id);
}
Object.assign(window, {
  tmNotify,
  TM_ROOT,
  TM_WH_DEFAULT,
  TM_OT_KIND,
  TM_OT_STATUS,
  tmHM,
  tmHHMM,
  tmNowHM,
  tmSpanMins,
  tmDur,
  tmWhNorm,
  tmIsHoliday,
  tmIsWorkday,
  tmOtKindOf,
  tmOtKindGuess,
  tmOtMinutes,
  tmWorkedMins,
  tmOpen,
  tmAttendBlank,
  tmPunch,
  tmDayIndex,
  tmOtStatusOf,
  tmOtOpen,
  tmCanAttend,
  tmCanAttendAll,
  tmCanOt,
  tmCanOtApprove,
  tmOtApproveCheck,
  tmOtNext,
  tmOtMove,
  tmOtDocNo,
  tmOtBlank,
  tmOtVisible,
  tmOtRollup,
  useAttend,
  useAttendDay,
  useAttendWriter,
  useOtClaims,
  useWorkHours
});