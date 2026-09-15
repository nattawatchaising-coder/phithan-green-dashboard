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
  startEarly: "08:30",
  startLate: "09:00",
  workMins: 480,
  lunchMins: 60,
  days: [1, 2, 3, 4, 5, 6],
  minOtMins: 30,
  roundMins: 30,
  holidays: {},
  cutoffDay: 0,
  otRates: {
    ot: 1.5,
    holiday: 2,
    holidayOt: 3,
    night: 1.5
  },
  office: {
    name: "",
    lat: null,
    lng: null,
    radius: 150,
    lock: false
  }
};
function tmWhNorm(cfg) {
  const c = Object.assign({}, TM_WH_DEFAULT, cfg || {});
  if (cfg && cfg.start && !cfg.startEarly) {
    if (tmHM(cfg.start) != null) c.startEarly = cfg.start;
    c.startLate = tmHHMM(tmHM(c.startEarly) + 30);
    const span = cfg.end ? tmSpanMins(cfg.start, cfg.end) : 0;
    if (span > 0) c.workMins = Math.max(0, span - Math.max(0, +cfg.lunchMins || 0));
  }
  c.days = Array.isArray(c.days) && c.days.length ? c.days.map(Number) : TM_WH_DEFAULT.days;
  c.lunchMins = Math.max(0, +c.lunchMins || 0);
  c.workMins = Math.max(0, +c.workMins || 0) || TM_WH_DEFAULT.workMins;
  c.minOtMins = Math.max(0, +c.minOtMins || 0);
  c.roundMins = Math.max(0, +c.roundMins || 0);
  c.holidays = c.holidays && typeof c.holidays === "object" ? c.holidays : {};
  c.cutoffDay = Math.min(28, Math.max(0, Math.round(+c.cutoffDay || 0)));
  const rr = c.otRates && typeof c.otRates === "object" ? c.otRates : {};
  const rates = {};
  TM_OT_KIND.forEach(k => {
    const v = rr[k.key];
    rates[k.key] = v === 0 ? 0 : Math.min(10, Math.max(0, +v || TM_WH_DEFAULT.otRates[k.key] || 1));
  });
  c.otRates = rates;
  const of = c.office && typeof c.office === "object" ? c.office : {};
  const num = v => v === 0 || v && isFinite(+v) ? +v : null;
  c.office = {
    name: String(of.name || "").slice(0, 60),
    lat: num(of.lat),
    lng: num(of.lng),
    radius: Math.min(5000, Math.max(20, Math.round(+of.radius || TM_WH_DEFAULT.office.radius))),
    lock: !!of.lock
  };
  if (c.office.lat == null || c.office.lng == null || Math.abs(c.office.lat) > 90 || Math.abs(c.office.lng) > 180) {
    c.office.lat = null;
    c.office.lng = null;
  }
  if (c.office.lat == null || c.office.lng == null) c.office.lock = false;
  if (tmHM(c.startEarly) == null) c.startEarly = TM_WH_DEFAULT.startEarly;
  if (tmHM(c.startLate) == null || tmHM(c.startLate) < tmHM(c.startEarly)) c.startLate = c.startEarly;
  c.start = c.startEarly;
  c.end = tmHHMM(tmHM(c.startEarly) + c.workMins + c.lunchMins);
  return c;
}
const tmIsHoliday = (dateISO, cfg) => !!tmWhNorm(cfg).holidays[String(dateISO || "").slice(0, 10)];
const tmDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
function tmDayIn(y, m, d) {
  const t = y * 12 + (m - 1);
  const yy = Math.floor(t / 12),
    mm = (t % 12 + 12) % 12 + 1;
  return yy + "-" + window.drPad2(mm) + "-" + window.drPad2(Math.min(Math.max(1, d), tmDaysInMonth(yy, mm)));
}
function tmNextDay(iso) {
  const s = String(iso || "").slice(0, 10);
  const d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + 1);
  return d.getFullYear() + "-" + window.drPad2(d.getMonth() + 1) + "-" + window.drPad2(d.getDate());
}
function tmPrevDay(iso) {
  const s = String(iso || "").slice(0, 10);
  const d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) - 1);
  return d.getFullYear() + "-" + window.drPad2(d.getMonth() + 1) + "-" + window.drPad2(d.getDate());
}
function tmPeriodOf(dateISO, cfg) {
  const cut = tmWhNorm(cfg).cutoffDay;
  const iso = String(dateISO || window.drToday()).slice(0, 10);
  const y = +iso.slice(0, 4),
    m = +iso.slice(5, 7),
    d = +iso.slice(8, 10);
  if (!y || !m || !d) return tmPeriodOf(window.drToday(), cfg);
  if (!cut) {
    const from = tmDayIn(y, m, 1);
    return {
      from: from,
      to: tmDayIn(y, m, 31),
      key: from.slice(0, 7),
      cut: 0
    };
  }
  const em = m + (d <= cut ? 0 : 1);
  const to = tmDayIn(y, em, cut);
  return {
    from: tmNextDay(tmDayIn(y, em - 1, cut)),
    to: to,
    key: to.slice(0, 7),
    cut: cut
  };
}
function tmPeriodShift(p, n, cfg) {
  let cur = p || tmPeriodOf(window.drToday(), cfg);
  let k = Math.round(+n || 0);
  while (k > 0) {
    cur = tmPeriodOf(tmNextDay(cur.to), cfg);
    k -= 1;
  }
  while (k < 0) {
    cur = tmPeriodOf(tmPrevDay(cur.from), cfg);
    k += 1;
  }
  return cur;
}
const tmInPeriod = (dateISO, p) => {
  const s = String(dateISO || "").slice(0, 10);
  return !!p && !!s && s >= p.from && s <= p.to;
};
function tmPeriodTH(p) {
  if (!p) return "—";
  if (!p.cut) return tmYmTH(p.key);
  return window.drDateTH(p.from) + " – " + window.drDateTH(p.to);
}
function tmIsWorkday(dateISO, cfg) {
  const c = tmWhNorm(cfg);
  if (c.holidays[String(dateISO || "").slice(0, 10)]) return false;
  const d = new Date(String(dateISO || "").slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return true;
  return c.days.indexOf(d.getDay()) >= 0;
}
function tmDayWindow(rec, cfg) {
  const c = tmWhNorm(cfg);
  const lo = tmHM(c.startEarly),
    hi = tmHM(c.startLate);
  const inHM = rec && rec.in && rec.in.hm ? tmHM(rec.in.hm) : null;
  const base = inHM == null ? lo : Math.max(inHM, lo);
  const end = base + c.workMins + c.lunchMins;
  return {
    startMins: base,
    endMins: end,
    start: tmHHMM(base),
    end: tmHHMM(end),
    inMins: inHM,
    late: inHM != null && inHM > hi,
    lateMins: inHM != null && inHM > hi ? inHM - hi : 0,
    cfg: c
  };
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
  key: "holidayOt",
  th: "ล่วงเวลาในวันหยุด",
  color: "#B91C1C",
  hint: "วันหยุดที่ทำเกินชั่วโมงงานปกติไปอีก"
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
function tmOtRate(recOrKind, cfg) {
  if (recOrKind && typeof recOrKind === "object" && recOrKind.rate != null && +recOrKind.rate >= 0) return +recOrKind.rate;
  const key = recOrKind && typeof recOrKind === "object" ? recOrKind.kind : recOrKind;
  const r = tmWhNorm(cfg).otRates[tmOtKindOf(key).key];
  return r == null ? 1 : r;
}
const tmOtPayMins = (rec, cfg) => Math.round((+(rec || {}).mins || 0) * tmOtRate(rec, cfg));
const tmRateTH = r => (Math.round((+r || 0) * 100) / 100).toString().replace(/\.00$/, "") + " เท่า";
function tmOtKindGuess(dateISO, from, cfg) {
  if (!tmIsWorkday(dateISO, cfg)) return "holiday";
  const a = tmHM(from);
  if (a != null && (a >= 20 * 60 || a < 5 * 60)) return "night";
  return "ot";
}
function tmOtMinutes(dateISO, from, to, cfg, win) {
  const c = tmWhNorm(cfg);
  const span = tmSpanMins(from, to);
  if (span <= 0) return 0;
  let outside = span;
  if (tmIsWorkday(dateISO, c)) {
    const ws = win && win.startMins != null ? win.startMins : tmHM(c.start);
    const we = win && win.endMins != null ? win.endMins : tmHM(c.end);
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
function tmWorkedMins(rec, cfg, nowHM) {
  const c = tmWhNorm(cfg);
  const spans = [];
  const push = s => {
    if (!s || !s.in || !s.in.hm) return;
    const b = s.out && s.out.hm || nowHM || null;
    if (b) spans.push([s.in.hm, b]);
  };
  push(rec);
  (rec && Array.isArray(rec.extra) ? rec.extra : []).forEach(push);
  let total = 0;
  spans.forEach(([a, b]) => {
    let m = tmSpanMins(a, b);
    if (c.lunchMins > 0 && m > 360) m -= c.lunchMins;
    total += Math.max(0, m);
  });
  return total;
}
const tmOpen = rec => {
  if (!rec || !rec.in || !rec.in.hm) return false;
  const ex = Array.isArray(rec.extra) ? rec.extra : [];
  if (ex.some(x => x && x.in && x.in.hm && !(x.out && x.out.hm))) return true;
  return !(rec.out && rec.out.hm);
};
function tmLastHM(rec, nowHM) {
  if (!rec || !rec.in || !rec.in.hm) return "";
  const ex = Array.isArray(rec.extra) ? rec.extra : [];
  const last = ex.length ? ex[ex.length - 1] : null;
  if (last && last.in && last.in.hm) return last.out && last.out.hm || nowHM || "";
  return rec.out && rec.out.hm || nowHM || "";
}
function tmOtEarned(rec, cfg, nowHM) {
  const c = tmWhNorm(cfg);
  const none = {
    has: false,
    mins: 0,
    before: 0,
    after: 0,
    from: "",
    to: "",
    lo: "",
    hi: "",
    date: ""
  };
  if (!rec || !rec.in || !rec.in.hm) return none;
  const endHM = tmLastHM(rec, nowHM);
  if (!endHM) return none;
  const w = tmDayWindow(rec, cfg);
  const inM = w.inMins;
  const outAbs = inM + tmSpanMins(rec.in.hm, endHM);
  const round = m => c.roundMins > 0 ? Math.floor(Math.max(0, m) / c.roundMins) * c.roundMins : Math.max(0, m);
  const keep = m => m >= c.minOtMins ? m : 0;
  const base = {
    has: true,
    lo: rec.in.hm,
    hi: tmHHMM(outAbs),
    date: rec.date || ""
  };
  if (!tmIsWorkday(rec.date, c)) {
    const all = keep(round(outAbs - inM));
    return Object.assign(base, {
      mins: all,
      before: 0,
      after: all,
      from: rec.in.hm,
      to: tmHHMM(outAbs)
    });
  }
  const before = keep(round(w.startMins - inM));
  const after = keep(round(outAbs - w.endMins));
  const useAfter = after >= before;
  return Object.assign(base, {
    mins: useAfter ? after : before,
    before: before,
    after: after,
    from: useAfter ? w.end : rec.in.hm,
    to: useAfter ? tmHHMM(outAbs) : w.start
  });
}
function tmOtInLimit(date, from, to, lim) {
  if (!lim || !lim.has || !lim.date || date !== lim.date) return true;
  const lo = tmHM(lim.lo),
    hi = tmHM(lim.lo) + tmSpanMins(lim.lo, lim.hi);
  const a = tmHM(from);
  if (a == null || lo == null) return false;
  const s = a < lo ? a + 1440 : a;
  return s >= lo && s + tmSpanMins(from, to) <= hi;
}
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
const TM_PLACE = [{
  key: "site",
  th: "หน้างาน",
  icon: "wrench"
}, {
  key: "office",
  th: "ออฟฟิศ",
  icon: "box"
}];
const tmPlaceOf = k => TM_PLACE.find(p => p.key === k) || TM_PLACE[0];
function tmPunch(gps, src, place) {
  const d = new Date();
  const p = {
    at: d.toISOString(),
    hm: window.drPad2(d.getHours()) + ":" + window.drPad2(d.getMinutes()),
    src: src || "web",
    place: tmPlaceOf(place).key
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
const TM_GPS_ERR = {
  denied: "ไม่ได้ให้สิทธิ์ตำแหน่ง",
  timeout: "จับสัญญาณไม่ทัน",
  unavailable: "หาสัญญาณไม่ได้",
  skipped: "ข้ามการจับพิกัด",
  none: "อุปกรณ์ไม่รองรับ"
};
function tmGpsTH(pt) {
  const p = pt || {};
  if (p.lat != null && p.lng != null) return (+p.lat).toFixed(6) + ", " + (+p.lng).toFixed(6);
  if (!p.at) return "";
  return TM_GPS_ERR[p.err] || "ไม่มีพิกัด";
}
function tmDistM(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const rad = Math.PI / 180,
    R = 6371000;
  const dLat = (+b.lat - +a.lat) * rad,
    dLng = (+b.lng - +a.lng) * rad;
  const sLat = Math.sin(dLat / 2),
    sLng = Math.sin(dLng / 2);
  const h = sLat * sLat + Math.cos(+a.lat * rad) * Math.cos(+b.lat * rad) * sLng * sLng;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
}
function tmOfficeDist(pt, cfg) {
  const o = tmWhNorm(cfg).office;
  if (o.lat == null || o.lng == null) return null;
  return tmDistM(pt, o);
}
const tmOfficeNear = (pt, cfg) => {
  const d = tmOfficeDist(pt, cfg);
  return d == null ? null : d <= tmWhNorm(cfg).office.radius;
};
const tmDistTH = m => m == null ? "" : m < 1000 ? m + " ม." : Math.round(m / 100) / 10 + " กม.";
function tmLockDeny(p, cfg) {
  const o = tmWhNorm(cfg).office;
  if (!o.lock || o.lat == null || o.lng == null) return null;
  if (!p || p.lat == null || p.lng == null) {
    const why = p && p.err ? TM_GPS_ERR[p.err] || p.err : "ไม่มีพิกัด";
    return "เปิดล็อกพิกัดไว้ ต้องรู้ตำแหน่งก่อนถึงจะลงเวลาเข้างานได้ — " + why;
  }
  const d = tmDistM(p, o);
  if (d != null && d <= o.radius) return null;
  return "อยู่ห่าง" + (o.name ? o.name : "ออฟฟิศ") + " " + tmDistTH(d) + " เกินรัศมีที่ตั้งไว้ " + o.radius + " ม. — ลงเวลาเข้างานไม่ได้";
}
const tmGpsUrl = pt => pt && pt.lat != null && pt.lng != null ? "https://www.google.com/maps?q=" + (+pt.lat).toFixed(6) + "," + (+pt.lng).toFixed(6) : "";
const tmDayIndex = (rec, cfg) => ({
  userId: rec.userId,
  name: rec.userName || "",
  techId: rec.techId || null,
  in: rec.in && rec.in.hm || "",
  out: rec.out && rec.out.hm || "",
  mins: tmWorkedMins(rec, cfg),
  gps: !!(rec.in && rec.in.lat),
  jobCode: rec.jobCode || "",
  lat: (rec.in && rec.in.lat) != null ? rec.in.lat : null,
  lng: (rec.in && rec.in.lng) != null ? rec.in.lng : null,
  place: rec.in && rec.in.place || rec.place || ""
});
const TM_OT_STATUS = [{
  key: "draft",
  th: "ร่าง",
  color: "#94A3B8",
  next: ["sent", "cancelled"]
}, {
  key: "sent",
  th: "รออนุมัติ",
  color: "#F59E0B",
  next: ["approved", "rejected", "draft", "cancelled"]
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
}, {
  key: "cancelled",
  th: "ยกเลิกแล้ว",
  color: "#64748B",
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
    if (k === "cancelled") return mine;
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
  if (to === "cancelled") {
    out.cancelledAt = now;
    out.cancelNote = txt;
  }
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
    out.cancelledAt = null;
    out.cancelNote = "";
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
function tmOtApprovers(users, forUser) {
  const skip = (forUser || {}).id || null;
  return (users || []).filter(u => u && u.id && u.active !== false && u.id !== skip && window.can(window.userRoles(u), "otApprove")).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
}
function tmOtPickApprover(user, users) {
  const all = tmOtApprovers(users, user);
  const mine = (user || {}).approverId && all.find(u => u.id === user.approverId) || null;
  if (mine) return mine;
  return all.length === 1 ? all[0] : null;
}
function tmOtBlank(user, users, list, job, cfg) {
  const now = new Date().toISOString();
  const date = window.drToday();
  const approver = tmOtPickApprover(user, users);
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
    rate: tmOtRate(tmOtKindGuess(date, "17:00", cfg), cfg),
    approverId: (approver || {}).id || null,
    approverName: (approver || {}).name || "",
    status: "draft",
    createdAt: now,
    hist: []
  };
}
function tmNameOf(users, id, fallback) {
  if (!id) return fallback || "";
  const u = (users || []).find(x => x && x.id === id);
  return u && u.name || fallback || id;
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
    cancelled: 0,
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
    const p = tmPunch(gps, o.src || "web", o.place);
    if (which === "in") {
      const deny = tmLockDeny(p, cfg);
      if (deny) return {
        ok: false,
        why: deny
      };
    }
    const snap = await _tmRef("attend/" + uid + "/" + date).once("value").catch(() => null);
    const cur = snap && snap.val() || tmAttendBlank(user, date);
    const rec = Object.assign({}, tmAttendBlank(user, date), cur);
    if (which === "in") {
      if (tmOpen(rec)) return {
        ok: false,
        why: "ลงเวลาเข้างานไปแล้วเมื่อ " + rec.in.hm,
        rec
      };
      if (rec.in && rec.in.hm) return {
        ok: false,
        why: "วันนี้ลงเวลาครบแล้ว " + rec.in.hm + " – " + (rec.out && rec.out.hm || "?") + " · ถ้ากดออกผิดเวลา ใช้ปุ่มกดออกงานใหม่",
        rec
      };
      rec.in = p;
    } else {
      const ex = rec.extra || [];
      let closed = false;
      ex.forEach((x, i) => {
        if (x && x.in && x.in.hm && !(x.out && x.out.hm)) {
          ex[i] = Object.assign({}, x, {
            out: p
          });
          closed = true;
        }
      });
      if (closed) {} else if (rec.in && rec.in.hm && !(rec.out && rec.out.hm)) rec.out = p;else if (rec.in && rec.in.hm && o.redo) {
        const lastIdx = ex.map((x, i) => x && x.in && x.in.hm ? i : -1).filter(i => i >= 0).pop();
        const inHM = lastIdx >= 0 ? ex[lastIdx].in.hm : rec.in.hm;
        if (tmSpanMins(inHM, p.hm) <= 0) return {
          ok: false,
          why: "เวลาออกงานต้องอยู่หลังเวลาเข้างาน " + inHM,
          rec
        };
        const prev = lastIdx >= 0 ? ex[lastIdx].out : rec.out;
        const fix = Object.assign({}, p, {
          redoOf: prev && prev.hm || ""
        });
        if (lastIdx >= 0) ex[lastIdx] = Object.assign({}, ex[lastIdx], {
          out: fix
        });else rec.out = fix;
      } else return {
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
    if (o.place !== undefined) rec.place = tmPlaceOf(o.place).key;
    if (o.note !== undefined) rec.note = o.note || "";
    rec.src = o.src || rec.src || "web";
    rec.mins = tmWorkedMins(rec, cfg);
    rec.updatedAt = new Date().toISOString();
    rec.hist = (rec.hist || []).concat([{
      at: rec.updatedAt,
      what: which === "out" && o.redo ? "out-fix" : which,
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
function useAttendAdmin(actor) {
  const removeDay = React.useCallback(async (userId, date) => {
    if (!userId || !date) return {
      ok: false,
      why: "ข้อมูลไม่ครบ"
    };
    if (!_TMFB()) return {
      ok: false,
      why: "ยังเชื่อมต่อฐานข้อมูลไม่ได้"
    };
    const snap = await _tmRef("attend/" + userId + "/" + date).once("value").catch(() => null);
    const old = snap && snap.val() || null;
    const patch = {};
    patch["attend/" + userId + "/" + date] = null;
    patch["attendDay/" + date + "/" + userId] = null;
    patch["attendVoid/" + date + "/" + userId] = {
      at: new Date().toISOString(),
      byId: (actor || {}).id || null,
      byName: (actor || {}).name || "",
      rec: old
    };
    await _tmRoot().update(patch);
    return {
      ok: true,
      rec: old
    };
  }, [actor]);
  return {
    removeDay
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
const TM_MONTH_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const tmYm = iso => String(iso || "").slice(0, 7);
const tmYmNow = () => tmYm(window.drToday());
function tmYmShift(ym, n) {
  const y = +String(ym || "").slice(0, 4),
    m = +String(ym || "").slice(5, 7);
  if (!y || !m) return tmYmNow();
  const t = y * 12 + (m - 1) + (+n || 0);
  return Math.floor(t / 12) + "-" + window.drPad2(t % 12 + 1);
}
function tmYmTH(ym) {
  const y = +String(ym || "").slice(0, 4),
    m = +String(ym || "").slice(5, 7);
  if (!y || !m) return "—";
  return (TM_MONTH_TH[m - 1] || "") + " " + (y + 543);
}
function tmMonthDays(ym) {
  const y = +String(ym || "").slice(0, 4),
    m = +String(ym || "").slice(5, 7);
  if (!y || !m) return [];
  const last = new Date(y, m, 0).getDate();
  const out = [];
  for (let d = 1; d <= last; d++) out.push(ym + "-" + window.drPad2(d));
  return out;
}
function useAttendMonth(ym) {
  const [byDate, setByDate] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!ym || !_TMFB()) {
      setByDate({});
      setLoading(false);
      return;
    }
    const ref = _tmRef("attendDay").orderByKey().startAt(ym + "-00").endAt(ym + "-99");
    const h = ref.on("value", s => {
      setByDate(s.val() || {});
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [ym]);
  return {
    byDate,
    loading
  };
}
async function tmFetchMonthDetail(userIds, ym) {
  const out = {};
  if (!_TMFB() || !ym) return out;
  const ids = [];
  (userIds || []).forEach(u => {
    if (u && ids.indexOf(u) < 0) ids.push(u);
  });
  await Promise.all(ids.map(async uid => {
    const snap = await _tmRef("attend/" + uid).orderByKey().startAt(ym + "-00").endAt(ym + "-99").once("value").catch(() => null);
    out[uid] = snap && snap.val() || {};
  }));
  return out;
}
function tmMonthRollup(byDate, users, cfg, otRows, ym) {
  const map = {};
  const touch = (id, name) => {
    const u = map[id] || (map[id] = {
      userId: id,
      name: "",
      days: 0,
      mins: 0,
      noOut: 0,
      noGps: 0,
      otMins: 0,
      byDay: {}
    });
    if (name && !u.name) u.name = name;
    return u;
  };
  tmMonthDays(ym).forEach(d => {
    const row = (byDate || {})[d] || {};
    Object.keys(row).forEach(uid => {
      const r = row[uid] || {};
      const u = touch(uid, r.name);
      u.byDay[d] = r;
      if (r.in) u.days += 1;
      u.mins += +r.mins || 0;
      if (r.in && !r.out) u.noOut += 1;
      if (r.in && !r.gps) u.noGps += 1;
    });
  });
  (otRows || []).forEach(o => {
    if (!o || o.status !== "approved" || tmYm(o.date) !== ym) return;
    touch(o.userId, o.userName).otMins += +o.mins || 0;
  });
  (users || []).forEach(u => {
    if (!u || u.active === false || !u.id) return;
    if (!window.can(window.userRoles(u), "attend")) return;
    touch(u.id, u.name);
  });
  Object.keys(map).forEach(k => {
    map[k].name = tmNameOf(users, k, map[k].name);
  });
  const rows = Object.keys(map).map(k => map[k]);
  rows.forEach(r => {
    if (!r.name) r.name = r.userId;
  });
  rows.sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  return rows;
}
Object.assign(window, {
  tmNameOf,
  tmNotify,
  TM_ROOT,
  TM_WH_DEFAULT,
  TM_OT_KIND,
  TM_OT_STATUS,
  TM_PLACE,
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
  tmDayWindow,
  tmOtEarned,
  tmOtInLimit,
  tmLastHM,
  tmOtRate,
  tmOtPayMins,
  tmRateTH,
  tmWorkedMins,
  tmOpen,
  tmAttendBlank,
  tmPunch,
  tmDayIndex,
  tmPlaceOf,
  TM_GPS_ERR,
  tmGpsTH,
  tmGpsUrl,
  tmDistM,
  tmOfficeDist,
  tmOfficeNear,
  tmDistTH,
  tmLockDeny,
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
  tmOtApprovers,
  tmOtPickApprover,
  useAttend,
  useAttendDay,
  useAttendWriter,
  useAttendAdmin,
  useOtClaims,
  useWorkHours,
  useAttendMonth,
  tmFetchMonthDetail,
  tmYm,
  tmYmNow,
  tmYmShift,
  tmYmTH,
  tmMonthDays,
  tmMonthRollup,
  TM_MONTH_TH,
  tmDaysInMonth,
  tmDayIn,
  tmNextDay,
  tmPrevDay,
  tmPeriodOf,
  tmPeriodShift,
  tmInPeriod,
  tmPeriodTH
});