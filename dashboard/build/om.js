const OM_ROOT = (() => {
  try {
    return localStorage.getItem("om_test_root") || "";
  } catch (e) {
    return "";
  }
})();
const _OMFB = () => !!window.FBDB;
const _omRef = p => window.FBDB.ref(OM_ROOT + p);
function omAddMonths(iso, n) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + (n || 0));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return window.drISO(d);
}
function omDiffDays(a, b) {
  if (!a || !b) return 0;
  const x = new Date(a + "T00:00:00").getTime();
  const y = new Date(b + "T00:00:00").getTime();
  if (isNaN(x) || isNaN(y)) return 0;
  return Math.round((y - x) / 86400000);
}
const OM_WARRANTY_DEF = [{
  kind: "install",
  label: "งานติดตั้ง",
  years: 5
}, {
  kind: "panel",
  label: "แผงโซลาร์เซลล์",
  years: 15
}, {
  kind: "inverter",
  label: "อินเวอร์เตอร์",
  years: 5
}];
const OM_WARRANTY_KIND = [{
  key: "install",
  th: "งานติดตั้ง",
  color: "#1B9B75"
}, {
  key: "panel",
  th: "แผงโซลาร์เซลล์",
  color: "#0A4D68"
}, {
  key: "inverter",
  th: "อินเวอร์เตอร์",
  color: "#148080"
}, {
  key: "battery",
  th: "แบตเตอรี่",
  color: "#7C5CFC"
}, {
  key: "other",
  th: "อื่น ๆ",
  color: "#64748B"
}];
const OM_WARRANTY_KIND_BY = {};
OM_WARRANTY_KIND.forEach(k => {
  OM_WARRANTY_KIND_BY[k.key] = k;
});
const OM_WARN_DAYS = 90;
const OM_CLEAN_EVERY = 6;
const OM_CLEAN_FREE = 3;
const OM_CLEAN_SOON = 30;
const OM_WARRANTY_STATE = {
  active: {
    key: "active",
    th: "อยู่ในประกัน",
    color: "#10B981"
  },
  soon: {
    key: "soon",
    th: "ใกล้หมดประกัน",
    color: "#F59E0B"
  },
  expired: {
    key: "expired",
    th: "หมดประกันแล้ว",
    color: "#EF4444"
  },
  none: {
    key: "none",
    th: "ยังไม่ระบุประกัน",
    color: "#94A3B8"
  }
};
function omWarrantyEnd(w) {
  if (!w || !w.start) return "";
  const mon = (Number(w.years) || 0) * 12 + (Number(w.months) || 0);
  if (!mon) return "";
  return window.drAddDays(omAddMonths(w.start, mon), -1);
}
function omWarrantyState(w, today) {
  const t = today || window.drToday();
  const end = omWarrantyEnd(w);
  if (!end) return Object.assign({
    end: "",
    days: 0
  }, OM_WARRANTY_STATE.none);
  const days = omDiffDays(t, end);
  if (days < 0) return Object.assign({
    end,
    days
  }, OM_WARRANTY_STATE.expired);
  if (days <= OM_WARN_DAYS) return Object.assign({
    end,
    days
  }, OM_WARRANTY_STATE.soon);
  return Object.assign({
    end,
    days
  }, OM_WARRANTY_STATE.active);
}
function omDaysTH(state) {
  if (!state || state.key === "none") return "—";
  const d = state.days;
  if (state.key === "expired") return "หมดแล้ว " + Math.abs(d) + " วัน";
  if (d >= 365) {
    const y = Math.floor(d / 365);
    const m = Math.floor((d - y * 365) / 30);
    return "เหลือ " + y + " ปี" + (m ? " " + m + " เดือน" : "");
  }
  if (d >= 60) return "เหลือ " + Math.floor(d / 30) + " เดือน";
  return "เหลือ " + d + " วัน";
}
const omWarrantyLeftTH = (w, today) => omDaysTH(omWarrantyState(w, today));
const omWarrantyList = site => {
  const w = (site || {}).warranties || {};
  return Object.keys(w).map(k => Object.assign({
    id: k
  }, w[k])).sort((a, b) => String(a.label || "").localeCompare(String(b.label || ""), "th"));
};
function omSiteWarrantyState(site, today) {
  const list = omWarrantyList(site);
  if (!list.length) return Object.assign({
    end: "",
    days: 0
  }, OM_WARRANTY_STATE.none);
  const rank = {
    expired: 3,
    soon: 2,
    active: 1,
    none: 0
  };
  let worst = null;
  list.forEach(w => {
    const st = omWarrantyState(w, today);
    if (!worst || rank[st.key] > rank[worst.key]) worst = st;
  });
  return worst;
}
const OM_CAT_TO_KIND = {
  inverter: "inverter",
  panel: "panel",
  mount: "install",
  wiring: "install",
  leak: "install"
};
function omCoverOf(site, category, today) {
  const kind = OM_CAT_TO_KIND[category];
  if (!kind) return {
    cover: "unknown",
    wid: "",
    note: ""
  };
  const w = omWarrantyList(site).find(x => x.kind === kind);
  if (!w) return {
    cover: "unknown",
    wid: "",
    note: "ไม่มีรายการประกัน " + (OM_WARRANTY_KIND_BY[kind] || {}).th
  };
  const st = omWarrantyState(w, today);
  if (st.key === "expired") return {
    cover: "charge",
    wid: w.id,
    note: (w.label || "") + " หมดประกันแล้วเมื่อ " + window.drShort(st.end)
  };
  if (st.key === "none") return {
    cover: "unknown",
    wid: w.id,
    note: "ยังไม่ได้ระบุวันเริ่มประกัน"
  };
  return {
    cover: "warranty",
    wid: w.id,
    note: (w.label || "") + " คุ้มครองถึง " + window.drShort(st.end)
  };
}
const omBlankClean = comDate => ({
  on: true,
  everyMon: OM_CLEAN_EVERY,
  freeCount: OM_CLEAN_FREE,
  firstDue: comDate ? omAddMonths(comDate, OM_CLEAN_EVERY) : "",
  price: null,
  note: ""
});
const OM_CLEAN_STATUS = {
  planned: {
    key: "planned",
    th: "ถึงรอบแล้ว",
    color: "#F59E0B"
  },
  booked: {
    key: "booked",
    th: "จองคิวแล้ว",
    color: "#0EA5E9"
  },
  done: {
    key: "done",
    th: "ล้างแล้ว",
    color: "#10B981"
  },
  skipped: {
    key: "skipped",
    th: "ข้ามรอบนี้",
    color: "#94A3B8"
  },
  canceled: {
    key: "canceled",
    th: "ยกเลิก",
    color: "#94A3B8"
  }
};
const omCleanStatusOf = k => OM_CLEAN_STATUS[k] || OM_CLEAN_STATUS.planned;
const omCleanLive = v => !!v && v.status !== "canceled" && v.status !== "skipped";
const omCleanDone = visits => (visits || []).filter(v => v && v.status === "done" && v.date).sort((a, b) => a.date < b.date ? -1 : 1);
const omLastClean = visits => {
  const d = omCleanDone(visits);
  return d.length ? d[d.length - 1].date : "";
};
const omFreeUsed = visits => omCleanDone(visits).filter(v => v.free).length;
const omFreeLeft = (site, visits) => Math.max(0, (((site || {}).clean || {}).freeCount || 0) - omFreeUsed(visits));
function omOpenVisit(visits) {
  const open = (visits || []).filter(v => omCleanLive(v) && v.status !== "done");
  open.sort((a, b) => String(a.due || a.date || "") < String(b.due || b.date || "") ? -1 : 1);
  return open[0] || null;
}
function omNextCleanDue(site, visits) {
  const c = (site || {}).clean || {};
  if (!c.on) return "";
  const open = omOpenVisit(visits);
  if (open) return open.date || open.due || "";
  const last = omLastClean(visits);
  if (last) return omAddMonths(last, c.everyMon || OM_CLEAN_EVERY);
  return c.firstDue || (site.comDate ? omAddMonths(site.comDate, c.everyMon || OM_CLEAN_EVERY) : "");
}
function omCleanState(site, visits, today) {
  const t = today || window.drToday();
  const c = (site || {}).clean || {};
  if (!c.on) return {
    key: "off",
    th: "ไม่อยู่ในรอบล้าง",
    color: "#94A3B8",
    due: "",
    days: 0
  };
  const due = omNextCleanDue(site, visits);
  if (!due) return {
    key: "off",
    th: "ยังไม่ได้ตั้งรอบ",
    color: "#94A3B8",
    due: "",
    days: 0
  };
  const days = omDiffDays(t, due);
  const open = omOpenVisit(visits);
  if (open && open.status === "booked") return {
    key: "booked",
    th: "จองคิวแล้ว",
    color: "#0EA5E9",
    due,
    days
  };
  if (days < -7) return {
    key: "overdue",
    th: "เลยกำหนดล้าง",
    color: "#EF4444",
    due,
    days
  };
  if (days <= 0) return {
    key: "due",
    th: "ถึงรอบล้างแล้ว",
    color: "#F59E0B",
    due,
    days
  };
  if (days <= OM_CLEAN_SOON) return {
    key: "soon",
    th: "ใกล้ถึงรอบล้าง",
    color: "#F59E0B",
    due,
    days
  };
  return {
    key: "ok",
    th: "ยังไม่ถึงรอบ",
    color: "#10B981",
    due,
    days
  };
}
function omCleanBacklog(site, visits, today) {
  const st = omCleanState(site, visits, today);
  if (st.key !== "overdue") return 0;
  const every = ((site || {}).clean || {}).everyMon || OM_CLEAN_EVERY;
  return Math.max(1, Math.floor(-st.days / Math.max(1, every * 30.4)) + 1);
}
function omCleanAgenda(sites, bySite, today) {
  const t = today || window.drToday();
  const out = [];
  (sites || []).forEach(s => {
    const vs = (bySite || {})[s.id] || [];
    vs.forEach(v => {
      if (!omCleanLive(v)) return;
      const d = v.date || v.due;
      if (d) out.push({
        site: s,
        visit: v,
        date: d,
        virtual: false,
        status: v.status || "booked"
      });
    });
    if (!(s.clean || {}).on) return;
    if (omOpenVisit(vs)) return;
    const due = omNextCleanDue(s, vs);
    if (due) out.push({
      site: s,
      visit: null,
      date: due,
      virtual: true,
      status: omDiffDays(t, due) <= 0 ? "planned" : "planned"
    });
  });
  out.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  return out;
}
function omBlankCleanVisit(site, due, visits, user) {
  const now = new Date().toISOString();
  return {
    id: omNewId("OC"),
    siteId: site.id,
    due: due || "",
    date: due || "",
    timeFrom: "09:00",
    timeTo: "12:00",
    techId: site.tech || "",
    status: "booked",
    free: omFreeLeft(site, visits) > 0,
    charge: null,
    visitId: null,
    note: "",
    doneAt: null,
    doneBy: null,
    createdAt: now,
    createdBy: (user || {}).id || null,
    updatedAt: now
  };
}
const omIsExternal = siteId => /^OMX-/.test(String(siteId || ""));
function omNextExtId(sites) {
  let max = 0;
  (sites || []).forEach(s => {
    const m = /^OMX-(\d+)$/.exec(String((s || {}).id || ""));
    if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
  });
  return "OMX-" + String(max + 1).padStart(4, "0");
}
const omNewId = p => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function omComDateOf(job) {
  const end = window.SF.installEnd ? window.SF.installEnd(job) : "";
  if (end) return {
    date: end,
    src: "install"
  };
  const done = ((job || {}).hist || []).find(h => h && h.key === "done" && h.date && h.status !== "pending");
  if (done) return {
    date: done.date,
    src: "done"
  };
  if ((job || {}).deadline) return {
    date: job.deadline,
    src: "deadline"
  };
  return {
    date: window.drToday(),
    src: "manual"
  };
}
const OM_COMSRC_TH = {
  install: "จากวันติดตั้งเสร็จ",
  done: "จากวันที่ปิดงาน",
  deadline: "จากกำหนดส่งมอบ",
  manual: "กรอกเอง"
};
const omComUnsure = site => !!site && site.comSrc !== "install" && site.comSrc !== "confirmed";
function omSetComDate(site, date, src) {
  const old = (site || {}).comDate || "";
  const out = {
    comDate: date,
    comSrc: src || "confirmed"
  };
  const w = Object.assign({}, (site || {}).warranties || {});
  Object.keys(w).forEach(k => {
    if (!w[k].start || w[k].start === old) w[k] = Object.assign({}, w[k], {
      start: date
    });
  });
  out.warranties = w;
  const c = (site || {}).clean;
  if (c && (!c.firstDue || c.firstDue === omAddMonths(old, c.everyMon || 0))) {
    out.clean = Object.assign({}, c, {
      firstDue: omAddMonths(date, c.everyMon || 0)
    });
  }
  return out;
}
function omSeedWarranties(job, comDate) {
  const out = {};
  OM_WARRANTY_DEF.forEach(d => {
    const id = omNewId("OW");
    out[id] = {
      id,
      kind: d.kind,
      label: "รับประกัน" + d.label,
      years: d.years,
      months: 0,
      start: comDate || "",
      note: ""
    };
  });
  if (job && job.battery) {
    const id = omNewId("OW");
    out[id] = {
      id,
      kind: "battery",
      label: "รับประกันแบตเตอรี่",
      years: 5,
      months: 0,
      start: comDate || "",
      note: ""
    };
  }
  return out;
}
function omSiteFromJob(job, user) {
  const c = omComDateOf(job);
  const now = new Date().toISOString();
  return {
    id: job.id,
    source: "job",
    jobId: job.id,
    code: job.code || job.id,
    name: job.name || "",
    phone: job.phone || "",
    address: job.address || "",
    province: job.province || "",
    type: job.type || "home",
    kw: job.kw == null ? null : job.kw,
    panels: job.panels == null ? null : job.panels,
    brand: job.brand || "",
    tech: job.tech || "",
    comDate: c.date,
    comSrc: c.src,
    active: true,
    note: "",
    warranties: omSeedWarranties(job, c.date),
    clean: omBlankClean(c.date),
    cleanSum: {
      lastDate: "",
      doneCount: 0
    },
    createdAt: now,
    createdBy: (user || {}).id || null,
    createdByName: (user || {}).name || "",
    updatedAt: now
  };
}
function omBlankSite(sites, user) {
  const today = window.drToday();
  const now = new Date().toISOString();
  const id = omNextExtId(sites);
  return {
    id,
    source: "external",
    jobId: null,
    code: id,
    name: "",
    phone: "",
    address: "",
    province: "",
    type: "home",
    kw: null,
    panels: null,
    brand: "",
    tech: "",
    comDate: today,
    comSrc: "manual",
    active: true,
    note: "",
    warranties: omSeedWarranties(null, today),
    clean: omBlankClean(today),
    cleanSum: {
      lastDate: "",
      doneCount: 0
    },
    createdAt: now,
    createdBy: (user || {}).id || null,
    createdByName: (user || {}).name || "",
    updatedAt: now
  };
}
function omEnrollable(jobs, sites) {
  const have = {};
  (sites || []).forEach(s => {
    if (s && s.id) have[s.id] = 1;
  });
  return (jobs || []).filter(j => j && j.stage === "done" && !have[j.id]);
}
function omRollup(sites, bySite, today) {
  const t = today || window.drToday();
  const out = {
    total: 0,
    active: 0,
    warnSoon: 0,
    warnExpired: 0,
    unsure: 0,
    kw: 0,
    kwSites: 0,
    cleanDue: 0,
    cleanOverdue: 0,
    cleanBooked: 0,
    freeLeft: 0
  };
  (sites || []).forEach(s => {
    out.total++;
    if (s.active) out.active++;
    if (omComUnsure(s)) out.unsure++;
    if (typeof s.kw === "number" && s.kw > 0) {
      out.kw += s.kw;
      out.kwSites++;
    }
    const st = omSiteWarrantyState(s, t);
    if (st.key === "soon") out.warnSoon++;else if (st.key === "expired") out.warnExpired++;
    const vs = (bySite || {})[s.id] || [];
    const cs = omCleanState(s, vs, t);
    if (cs.key === "overdue") out.cleanOverdue++;else if (cs.key === "due") out.cleanDue++;else if (cs.key === "booked") out.cleanBooked++;
    if ((s.clean || {}).on) out.freeLeft += omFreeLeft(s, vs);
  });
  return out;
}
const omCanWrite = (role, rec) => {
  if (!window.can(role, "om")) return false;
  return !(rec && rec.status === "approved");
};
const omCanApprove = role => window.hasRole(role, "lead") || window.hasRole(role, "admin");
const omCanDelete = role => window.hasRole(role, "admin");
function useOmSites() {
  const [sites, setSites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_OMFB()) {
      setLoading(false);
      return;
    }
    const ref = _omRef("omSites");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      setSites(Object.keys(v).map(k => Object.assign({
        id: k
      }, v[k])));
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const upsert = React.useCallback(rec => {
    if (!rec || !rec.id || !_OMFB()) return;
    _omRef("omSites/" + rec.id).set(Object.assign({}, rec, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (!id || !_OMFB()) return;
    _omRef("omSites/" + id).update(Object.assign({}, fields, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const remove = React.useCallback(id => {
    if (!id || !_OMFB()) return;
    _omRef("omSites/" + id).remove();
    _omRef("omCleanVisits/" + id).remove();
  }, []);
  return {
    sites,
    loading,
    upsert,
    patch,
    remove
  };
}
function useOmCleanVisits() {
  const [bySite, setBySite] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_OMFB()) {
      setLoading(false);
      return;
    }
    const ref = _omRef("omCleanVisits");
    const h = ref.on("value", s => {
      const v = s.val() || {};
      const out = {};
      Object.keys(v).forEach(sid => {
        const t = v[sid] || {};
        out[sid] = Object.keys(t).map(k => Object.assign({
          id: k,
          siteId: sid
        }, t[k]));
      });
      setBySite(out);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const all = React.useMemo(() => {
    const out = [];
    Object.keys(bySite).forEach(k => {
      (bySite[k] || []).forEach(v => out.push(v));
    });
    return out;
  }, [bySite]);
  const save = React.useCallback(v => {
    if (!v || !v.id || !v.siteId || !_OMFB()) return;
    _omRef("omCleanVisits/" + v.siteId + "/" + v.id).set(Object.assign({}, v, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const patch = React.useCallback((siteId, id, fields) => {
    if (!siteId || !id || !_OMFB()) return;
    _omRef("omCleanVisits/" + siteId + "/" + id).update(Object.assign({}, fields, {
      updatedAt: new Date().toISOString()
    }));
  }, []);
  const remove = React.useCallback((siteId, id) => {
    if (!siteId || !id || !_OMFB()) return;
    _omRef("omCleanVisits/" + siteId + "/" + id).remove();
  }, []);
  return {
    bySite,
    all,
    loading,
    save,
    patch,
    remove
  };
}
Object.assign(window, {
  OM_ROOT,
  OM_WARRANTY_DEF,
  OM_WARRANTY_KIND,
  OM_WARRANTY_KIND_BY,
  OM_WARRANTY_STATE,
  OM_WARN_DAYS,
  OM_CLEAN_EVERY,
  OM_CLEAN_FREE,
  OM_CLEAN_SOON,
  OM_COMSRC_TH,
  OM_CLEAN_STATUS,
  omAddMonths,
  omDiffDays,
  omWarrantyEnd,
  omWarrantyState,
  omDaysTH,
  omWarrantyLeftTH,
  omWarrantyList,
  omSiteWarrantyState,
  omCoverOf,
  omBlankClean,
  omCleanStatusOf,
  omCleanLive,
  omCleanDone,
  omLastClean,
  omFreeUsed,
  omFreeLeft,
  omOpenVisit,
  omNextCleanDue,
  omCleanState,
  omCleanBacklog,
  omBlankCleanVisit,
  omCleanAgenda,
  omIsExternal,
  omNextExtId,
  omNewId,
  omComDateOf,
  omComUnsure,
  omSetComDate,
  omSeedWarranties,
  omSiteFromJob,
  omBlankSite,
  omEnrollable,
  omRollup,
  omCanWrite,
  omCanApprove,
  omCanDelete,
  useOmSites,
  useOmCleanVisits
});