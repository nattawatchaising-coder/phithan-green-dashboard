const _lvFB = () => !!window.FBDB;
const _lvRef = p => window.FBDB.ref((window.TM_ROOT || "") + p);
const LV_TYPES_DEFAULT = [{
  key: "sick",
  th: "ลาป่วย",
  days: 30,
  color: "#EF4444",
  adv: 0,
  back: true
}, {
  key: "personal",
  th: "ลากิจ",
  days: 3,
  color: "#F59E0B",
  adv: 3
}, {
  key: "vacation",
  th: "ลาพักร้อน",
  days: 6,
  color: "#0EA5E9",
  adv: 7
}, {
  key: "maternity",
  th: "ลาคลอด",
  days: 0,
  color: "#EC4899",
  adv: 30
}, {
  key: "unpaid",
  th: "ลาไม่รับค่าจ้าง",
  days: null,
  color: "#64748B",
  adv: 3
}];
const LV_ADV_DEF = {
  sick: 0,
  personal: 3,
  vacation: 7,
  maternity: 30,
  unpaid: 3
};
const LV_PART = [{
  key: "full",
  th: "ทั้งวัน"
}, {
  key: "am",
  th: "ครึ่งเช้า"
}, {
  key: "pm",
  th: "ครึ่งบ่าย"
}];
const lvPartTH = k => (LV_PART.find(p => p.key === k) || LV_PART[0]).th;
const lvKeyOk = k => /^[A-Za-z0-9_-]{1,30}$/.test(String(k || ""));
function lvTypesNorm(v) {
  const arr = Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : null;
  const out = (arr || LV_TYPES_DEFAULT).filter(t => t && lvKeyOk(t.key)).map(t => ({
    key: t.key,
    th: String(t.th || t.key),
    days: t.days == null || t.days === "" ? null : Math.max(0, +t.days || 0),
    color: t.color || "#64748B",
    adv: t.adv == null || t.adv === "" ? LV_ADV_DEF[t.key] || 0 : Math.max(0, Math.round(+t.adv || 0)),
    back: t.back == null ? t.key === "sick" : !!t.back
  }));
  return out.length ? out : LV_TYPES_DEFAULT.slice();
}
const lvTypeOf = (types, k) => (types || []).find(t => t.key === k) || {
  key: k || "",
  th: k || "ไม่ระบุ",
  days: null,
  color: "#94A3B8"
};
const lvDaysTH = d => (Math.round((+d || 0) * 10) / 10).toString() + " วัน";
const lvYearOf = iso => +String(iso || "").slice(0, 4) || +String(window.drToday()).slice(0, 4);
function lvCountDays(from, to, part, cfg) {
  const a = String(from || ""),
    b = String(to || a);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b) || b < a) return 0;
  if (a === b && (part === "am" || part === "pm")) return window.tmIsWorkday(a, cfg) ? 0.5 : 0;
  let n = 0,
    d = a,
    guard = 0;
  while (d <= b && guard++ < 400) {
    if (window.tmIsWorkday(d, cfg)) n += 1;
    d = window.drAddDays(d, 1);
  }
  return n;
}
function lvRangeTH(r) {
  if (!r) return "";
  const a = window.drShort(r.from),
    b = window.drShort(r.to || r.from);
  const one = !r.to || r.to === r.from;
  return (one ? a : a + " – " + b) + (one && r.part && r.part !== "full" ? " (" + lvPartTH(r.part) + ")" : "");
}
const lvCovers = (r, iso) => !!r && String(r.from) <= iso && iso <= String(r.to || r.from);
function lvQuotaOf(quotaMap, userId, year, t) {
  const mine = ((quotaMap || {})[userId] || {})[year] || {};
  const v = mine[t.key];
  if (v === undefined || v === null || v === "") return t.days;
  return v === "inf" ? null : Math.max(0, +v || 0);
}
function lvBalance(rows, quotaMap, userId, year, types) {
  return (types || []).map(t => {
    let used = 0,
      pending = 0;
    (rows || []).forEach(r => {
      if (!r || r.userId !== userId || r.type !== t.key || lvYearOf(r.from) !== +year) return;
      if (r.status === "approved") used += +r.days || 0;else if (r.status === "sent") pending += +r.days || 0;
    });
    const quota = lvQuotaOf(quotaMap, userId, year, t);
    return {
      type: t,
      quota,
      used,
      pending,
      left: quota == null ? null : quota - used - pending
    };
  });
}
function lvLeadDays(from, today) {
  const a = Date.parse(String(today || window.drToday()) + "T00:00:00Z"),
    b = Date.parse(String(from) + "T00:00:00Z");
  return isNaN(a) || isNaN(b) ? 0 : Math.round((b - a) / 864e5);
}
function lvAdvTH(t) {
  if (!t) return "";
  const a = +t.adv || 0;
  return (a ? "ต้องยื่นล่วงหน้าอย่างน้อย " + a + " วัน" : "ยื่นวันเดียวกันได้") + (t.back ? " · ยื่นย้อนหลังได้" : "");
}
function lvSendWhy(f, bal) {
  if (!f) return "";
  if (!f.type) return "เลือกประเภทการลา";
  if (!f.from) return "เลือกวันที่ลา";
  if ((f.to || f.from) < f.from) return "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
  if (!(+f.days > 0)) return "ช่วงนี้ไม่มีวันทำงาน — ไม่ต้องลา";
  if (!String(f.reason || "").trim()) return "กรอกเหตุผลการลา";
  const b = (bal || []).find(x => x.type.key === f.type);
  if (b) {
    const lead = lvLeadDays(f.from);
    const adv = +b.type.adv || 0;
    if (lead < 0 && !b.type.back) return b.type.th + " ยื่นย้อนหลังไม่ได้ — " + lvAdvTH(b.type);
    if (lead >= 0 && lead < adv) return b.type.th + " ต้องยื่นล่วงหน้าอย่างน้อย " + adv + " วัน — ลาได้เร็วสุดวันที่ " + window.drShort(window.drAddDays(window.drToday(), adv));
  }
  if (b && b.quota != null) {
    const self = f.status === "sent" ? +f.days || 0 : 0;
    const room = b.quota - b.used - b.pending + self;
    if (+f.days > room) return "เกินยอดวันลา " + b.type.th + " — เหลือ " + lvDaysTH(Math.max(0, room)) + " (ส่วนที่เกินใช้ลาไม่รับค่าจ้าง)";
  }
  return "";
}
const lvCanLeave = role => window.can(role, "leave");
const lvCanApprove = role => window.can(role, "leaveApprove");
const lvCanQuota = role => window.can(role, "attendAll") && window.can(role, "leaveApprove");
function lvApproveCheck(rec, user, role) {
  if (!rec || !user) return {
    ok: false,
    why: ""
  };
  if (!lvCanApprove(role)) return {
    ok: false,
    why: "ไม่มีสิทธิ์อนุมัติใบลา"
  };
  if (rec.userId && rec.userId === user.id) return {
    ok: false,
    why: "อนุมัติใบลาของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ"
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
function lvNext(rec, role, user) {
  const cur = window.tmOtStatusOf((rec || {}).status);
  const mine = rec && user && rec.userId === user.id;
  const appr = lvApproveCheck(rec, user, role).ok;
  return (cur.next || []).filter(k => {
    if (k === "sent") return mine;
    if (k === "approved") return appr;
    if (k === "rejected") return appr;
    if (k === "cancelled") return mine;
    if (k === "draft") return mine || appr;
    return false;
  }).map(k => window.tmOtStatusOf(k));
}
const lvMove = (rec, to, user, note) => window.tmOtMove(rec, to, user, note);
function lvDocNo(list, dateISO) {
  const d = String(dateISO || window.drToday());
  const ym = String(+d.slice(0, 4) + 543).slice(2) + d.slice(5, 7);
  const n = (list || []).filter(r => r && String(r.no || "").indexOf("LV-" + ym) === 0).length + 1;
  return "LV-" + ym + "-" + window.drPad2(n);
}
function lvApprovers(users, forUser) {
  const skip = (forUser || {}).id || null;
  return (users || []).filter(u => u && u.id && u.active !== false && u.id !== skip && window.can(window.userRoles(u), "leaveApprove")).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
}
function lvPickApprover(user, users) {
  const all = lvApprovers(users, user);
  const mine = (user || {}).approverId && all.find(u => u.id === user.approverId) || null;
  if (mine) return mine;
  return all.length === 1 ? all[0] : null;
}
function lvBlank(user, users, list, cfg) {
  const date = window.drToday();
  const ap = lvPickApprover(user, users);
  return {
    id: "LV-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: lvDocNo(list, date),
    userId: (user || {}).id || null,
    userName: (user || {}).name || "",
    type: "",
    from: date,
    to: date,
    part: "full",
    days: lvCountDays(date, date, "full", cfg),
    reason: "",
    approverId: (ap || {}).id || null,
    approverName: (ap || {}).name || "",
    status: "draft",
    createdAt: new Date().toISOString(),
    hist: []
  };
}
function lvVisible(list, user, role) {
  if (lvCanApprove(role) || window.can(role, "attendAll")) return list || [];
  const uid = (user || {}).id || null;
  return (list || []).filter(r => r && r.userId === uid);
}
function lvOnDay(list, iso) {
  const out = {};
  (list || []).forEach(r => {
    if (r && r.status === "approved" && lvCovers(r, iso)) out[r.userId] = r;
  });
  return out;
}
function lvNotifyMove(prev, next, actor, types) {
  if (!next || !window.tmNotify) return;
  const t = lvTypeOf(types, next.type);
  const what = t.th + " " + lvRangeTH(next) + " · " + lvDaysTH(next.days);
  const by = (actor || {}).name || "";
  const send = n => window.tmNotify(Object.assign({
    type: "leave",
    event: "leave"
  }, n));
  const to = next.status;
  if (to === "sent") {
    const head = {
      title: "ขออนุมัติการลา · " + next.no,
      body: (next.userName || "") + " · " + what + (next.reason ? " · " + next.reason : "")
    };
    send(next.approverId ? Object.assign({
      toUserId: next.approverId
    }, head) : Object.assign({
      toPerm: "leaveApprove"
    }, head));
  } else if ((to === "approved" || to === "rejected") && next.userId !== (actor || {}).id) {
    send({
      toUserId: next.userId,
      title: (to === "approved" ? "อนุมัติการลาแล้ว · " : "ไม่อนุมัติการลา · ") + next.no,
      body: what + " · โดย " + by + (next.decidedNote ? " · " + next.decidedNote : "")
    });
  } else if (to === "draft" && prev && prev.status === "sent" && next.userId !== (actor || {}).id) {
    send({
      toUserId: next.userId,
      title: "ตีกลับใบลา · " + next.no,
      body: what + " · แก้แล้วส่งใหม่ได้ · โดย " + by
    });
  } else if (to === "cancelled" && prev && prev.status === "sent" && next.approverId) {
    send({
      toUserId: next.approverId,
      title: "ยกเลิกใบลา · " + next.no,
      body: (next.userName || "") + " · " + what + " · ไม่ต้องพิจารณาแล้ว"
    });
  }
}
function useLeaves() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_lvFB()) {
      setLoading(false);
      return;
    }
    const ref = _lvRef("tmLeave");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const arr = Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k]));
      arr.sort((a, b) => String(b.from || "").localeCompare(String(a.from || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setRows(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback(r => {
    if (!r || !r.id || !_lvFB()) return;
    _lvRef("tmLeave/" + r.id).set(Object.assign({}, r, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const remove = React.useCallback(id => {
    if (!id || !_lvFB()) return;
    _lvRef("tmLeave/" + id).remove();
  }, []);
  return {
    rows,
    loading,
    save,
    remove
  };
}
function useLeaveTypes() {
  const [types, setTypes] = React.useState(LV_TYPES_DEFAULT);
  React.useEffect(() => {
    if (!_lvFB()) return;
    const ref = window.FBDB.ref("config/leaveTypes");
    const h = ref.on("value", s => setTypes(lvTypesNorm(s.val())));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback(next => {
    if (!_lvFB()) return;
    window.FBDB.ref("config/leaveTypes").set(lvTypesNorm(next));
  }, []);
  return {
    types,
    save
  };
}
function useLeaveQuota() {
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    if (!_lvFB()) return;
    const ref = _lvRef("leaveQuota");
    const h = ref.on("value", s => setMap(s.val() || {}));
    return () => ref.off("value", h);
  }, []);
  const set = React.useCallback((userId, year, typeKey, val) => {
    if (!_lvFB() || !userId || !year || !lvKeyOk(typeKey)) return;
    const ref = _lvRef("leaveQuota/" + userId + "/" + year + "/" + typeKey);
    if (val === null || val === undefined || val === "") ref.remove();else ref.set(val === "inf" ? "inf" : Math.max(0, Math.round((+val || 0) * 2) / 2));
  }, []);
  return {
    map,
    set
  };
}
Object.assign(window, {
  LV_TYPES_DEFAULT,
  LV_PART,
  lvPartTH,
  lvTypesNorm,
  lvTypeOf,
  lvDaysTH,
  lvYearOf,
  lvCountDays,
  lvRangeTH,
  lvCovers,
  lvLeadDays,
  lvAdvTH,
  lvQuotaOf,
  lvBalance,
  lvSendWhy,
  lvCanLeave,
  lvCanApprove,
  lvCanQuota,
  lvApproveCheck,
  lvNext,
  lvMove,
  lvDocNo,
  lvApprovers,
  lvPickApprover,
  lvBlank,
  lvVisible,
  lvOnDay,
  lvNotifyMove,
  useLeaves,
  useLeaveTypes,
  useLeaveQuota
});
