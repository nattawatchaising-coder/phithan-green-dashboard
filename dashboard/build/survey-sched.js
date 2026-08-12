function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const APPT_STATUS = [{
  key: "scheduled",
  th: "นัดหมายแล้ว",
  color: "#3B82F6",
  icon: "calendar"
}, {
  key: "transit",
  th: "กำลังเดินทาง",
  color: "#F59E0B",
  icon: "map"
}, {
  key: "progress",
  th: "ถึงไซต์ / กำลังสำรวจ",
  color: "#8B5CF6",
  icon: "pin"
}, {
  key: "done",
  th: "สำรวจเสร็จ",
  color: "var(--tint-green-tx)",
  icon: "check"
}, {
  key: "rescheduled",
  th: "เลื่อนนัด",
  color: "#0EA5E9",
  icon: "history"
}, {
  key: "canceled",
  th: "ยกเลิก",
  color: "#EF4444",
  icon: "x"
}];
const APPT_STATUS_BY = Object.fromEntries(APPT_STATUS.map(s => [s.key, s]));
function _ymdLocal(d) {
  const x = d instanceof Date ? d : new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const da = String(x.getDate()).padStart(2, "0");
  return x.getFullYear() + "-" + m + "-" + da;
}
function _hm(iso) {
  if (!iso) return "--:--";
  const x = new Date(iso);
  return String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0");
}
function _addDays(ymd, n) {
  const x = new Date(ymd + "T00:00:00");
  x.setDate(x.getDate() + n);
  return _ymdLocal(x);
}
function _composeISO(ymd, hm) {
  if (!ymd || !hm) return "";
  const d = new Date(ymd + "T" + hm);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}
function apptConflicts(list) {
  const bad = new Set();
  const byEng = {};
  (list || []).forEach(a => {
    if (a.status === "canceled" || !a.start || !a.end) return;
    (byEng[a.engineerId || "_"] = byEng[a.engineerId || "_"] || []).push(a);
  });
  Object.values(byEng).forEach(arr => {
    const s = arr.slice().sort((x, y) => new Date(x.start) - new Date(y.start));
    for (let i = 1; i < s.length; i++) {
      if (new Date(s[i].start).getTime() < new Date(s[i - 1].end).getTime()) {
        bad.add(s[i].id);
        bad.add(s[i - 1].id);
      }
    }
  });
  return bad;
}
function blankAppt() {
  return {
    id: "SA-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    projectId: "",
    leadId: "",
    jobName: "",
    jobCode: "",
    province: "",
    address: "",
    phone: "",
    engineerId: "",
    start: "",
    end: "",
    status: "scheduled",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
const LEAD_STATUS = [{
  key: "open",
  th: "รอตัดสินใจ",
  color: "#0EA5E9"
}, {
  key: "won",
  th: "เป็นงานแล้ว",
  color: "var(--tint-green-tx)"
}, {
  key: "lost",
  th: "ไม่ติดตั้ง",
  color: "#94A3B8"
}];
const LEAD_STATUS_BY = Object.fromEntries(LEAD_STATUS.map(s => [s.key, s]));
const SF_LEAD_KEY = "solarflow_leads_v1";
function blankLead(leads) {
  let max = 0;
  (leads || []).forEach(l => {
    const n = parseInt(String(l.code || "").replace(/\D/g, ""), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  const now = new Date().toISOString();
  return {
    id: "LD-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: "LD-" + String(max + 1).padStart(3, "0"),
    name: "",
    phone: "",
    address: "",
    province: "",
    type: "home",
    phase: "1",
    roof: "",
    note: "",
    status: "open",
    jobId: "",
    survey: null,
    createdAt: now,
    updatedAt: now
  };
}
function leadAsJob(l) {
  if (!l) return null;
  return {
    __lead: true,
    id: l.id,
    code: l.code,
    name: l.name,
    phone: l.phone,
    address: l.address,
    province: l.province,
    type: l.type || "home",
    phase: l.phase || "1",
    roof: l.roof || "",
    map: "",
    survey: l.survey || null
  };
}
function useSurveyLeadStore() {
  const [leads, setLeads] = React.useState(_FB() ? null : () => _lsGet(SF_LEAD_KEY, []));
  const ref = React.useRef(leads);
  React.useEffect(() => {
    ref.current = leads;
  }, [leads]);
  React.useEffect(() => {
    if (!_FB()) return;
    const r = _fbr("surveyLeads");
    const h = r.on("value", snap => setLeads(_snap2arr(snap) || []), () => setLeads([]));
    return () => r.off("value", h);
  }, []);
  React.useEffect(() => {
    if (!_FB() && leads !== null) _lsSet(SF_LEAD_KEY, leads);
  }, [leads]);
  const upsert = React.useCallback(rec => {
    const r = Object.assign({}, rec, {
      updatedAt: new Date().toISOString()
    });
    if (_FB()) _fbSet("surveyLeads/" + r.id, r);else setLeads(p => {
      const a = p || [];
      const i = a.findIndex(x => x.id === r.id);
      if (i === -1) return a.concat([r]);
      const c = a.slice();
      c[i] = Object.assign({}, a[i], r);
      return c;
    });
    return r;
  }, []);
  const patch = React.useCallback((id, fields) => {
    const f = Object.assign({}, fields, {
      updatedAt: new Date().toISOString()
    });
    if (_FB()) _fbUpd("surveyLeads/" + id, f);else setLeads(p => (p || []).map(x => x.id === id ? Object.assign({}, x, f) : x));
  }, []);
  const remove = React.useCallback(id => {
    if (_FB()) {
      _fbRem("surveyLeads/" + id);
      _fbRem("surveyPhotos/" + id);
    } else setLeads(p => (p || []).filter(x => x.id !== id));
  }, []);
  return {
    leads: leads || [],
    upsert,
    patch,
    remove,
    blank: () => blankLead(ref.current || [])
  };
}
function moveSurveyPhotos(fromId, toId) {
  if (!window.FBDB || !fromId || !toId || fromId === toId) return Promise.resolve();
  return window.FBDB.ref("surveyPhotos/" + fromId).once("value").then(s => {
    const v = s.val();
    if (!v) return null;
    return window.FBDB.ref("surveyPhotos/" + toId).set(v).then(() => window.FBDB.ref("surveyPhotos/" + fromId).remove());
  }).catch(() => null);
}
const SF_APPT_KEY = "solarflow_appts_v1";
function useSurveyApptStore() {
  const [appts, setAppts] = React.useState(_FB() ? null : () => _lsGet(SF_APPT_KEY, []));
  const [loading, setLoading] = React.useState(_FB());
  React.useEffect(() => {
    if (!_FB()) {
      setLoading(false);
      return;
    }
    const ref = _fbr("surveyAppointments");
    const h = ref.on("value", snap => {
      setAppts(_snap2arr(snap) || []);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  React.useEffect(() => {
    if (!_FB() && appts !== null) _lsSet(SF_APPT_KEY, appts);
  }, [appts]);
  const upsert = React.useCallback(rec => {
    const r = Object.assign({}, rec, {
      updatedAt: new Date().toISOString()
    });
    if (_FB()) {
      _fbSet("surveyAppointments/" + r.id, r);
    } else setAppts(prev => {
      const a = prev || [];
      const i = a.findIndex(x => x.id === r.id);
      if (i === -1) return a.concat([r]);
      const c = a.slice();
      c[i] = Object.assign({}, a[i], r);
      return c;
    });
  }, []);
  const remove = React.useCallback(id => {
    if (_FB()) {
      _fbRem("surveyAppointments/" + id);
    } else setAppts(prev => (prev || []).filter(x => x.id !== id));
  }, []);
  const setStatus = React.useCallback((id, status) => {
    const now = new Date().toISOString();
    const stamp = {
      transit: {
        transitAt: now
      },
      progress: {
        arrivedAt: now
      },
      done: {
        completedAt: now
      }
    }[status] || {};
    const fields = Object.assign({
      status,
      updatedAt: now
    }, stamp);
    if (_FB()) {
      _fbUpd("surveyAppointments/" + id, fields);
    } else setAppts(prev => (prev || []).map(x => x.id === id ? Object.assign({}, x, fields) : x));
  }, []);
  return {
    appts: appts || [],
    loading,
    upsert,
    remove,
    setStatus
  };
}
function SchedHeader({
  icon,
  title,
  sub,
  onMenuOpen,
  right
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("header", {
    className: "app-header",
    style: isMobile ? {
      paddingBottom: 12
    } : undefined
  }, React.createElement("div", {
    className: "header-top"
  }, React.createElement("button", {
    className: "hamburger",
    onClick: onMenuOpen,
    "aria-label": "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39"
  }, React.createElement(Icon, {
    name: "menu",
    size: 18,
    color: "var(--text-2)"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("h1", {
    className: "page-title"
  }, title), React.createElement("p", {
    className: "page-sub"
  }, sub)), React.createElement("div", {
    className: "header-actions"
  }, right)));
}
function DispatchView({
  appts,
  jobs,
  techs,
  store,
  leadStore,
  onMenuOpen,
  onOpenJob
}) {
  const leads = leadStore && leadStore.leads || [];
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [day, setDay] = React.useState(() => _ymdLocal(new Date()));
  const [edit, setEdit] = React.useState(null);
  const dayAppts = React.useMemo(() => (appts || []).filter(a => a.start && _ymdLocal(a.start) === day), [appts, day]);
  const conflicts = React.useMemo(() => apptConflicts(dayAppts), [dayAppts]);
  const columns = React.useMemo(() => {
    const engsWith = [...new Set(dayAppts.map(a => a.engineerId).filter(Boolean))];
    const cols = (techs || []).filter(t => engsWith.includes(t.id)).map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || "#64748B"
    }));
    if (dayAppts.some(a => !a.engineerId)) cols.push({
      id: "",
      name: "ยังไม่มอบหมาย",
      color: "#94A3B8"
    });
    return cols;
  }, [dayAppts, techs]);
  const [mode, setMode] = React.useState("day");
  const allConflicts = React.useMemo(() => apptConflicts(appts || []), [appts]);
  const techById = React.useMemo(() => Object.fromEntries((techs || []).map(t => [t.id, t])), [techs]);
  const scopeAppts = mode === "day" ? dayAppts : appts || [];
  const summary = APPT_STATUS.map(s => ({
    s,
    n: scopeAppts.filter(a => a.status === s.key).length
  })).filter(x => x.n > 0);
  const conflictScope = mode === "day" ? conflicts : allConflicts;
  const allGroups = React.useMemo(() => {
    const m = {};
    (appts || []).forEach(a => {
      const k = a.start ? _ymdLocal(a.start) : "ไม่ระบุวัน";
      (m[k] = m[k] || []).push(a);
    });
    return Object.keys(m).sort().map(k => ({
      day: k,
      items: m[k].slice().sort((x, y) => new Date(x.start || 0) - new Date(y.start || 0))
    }));
  }, [appts]);
  return React.createElement(React.Fragment, null, React.createElement(SchedHeader, {
    icon: "calendar",
    title: "\u0E08\u0E31\u0E14\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E33\u0E23\u0E27\u0E08",
    onMenuOpen: onMenuOpen,
    sub: React.createElement("span", null, scopeAppts.length, " \u0E19\u0E31\u0E14", mode === "day" ? " (วันนี้)" : " (ทั้งหมด)", " \xB7 ", conflictScope.size > 0 ? React.createElement("span", {
      style: {
        color: "#EF4444",
        fontWeight: 700
      }
    }, "\u26A0 \u0E0B\u0E49\u0E2D\u0E19\u0E17\u0E31\u0E1A ", conflictScope.size / 2 | 0, " \u0E04\u0E39\u0E48") : "ไม่มีเวลาซ้อนทับ"),
    right: React.createElement("button", {
      onClick: () => setEdit(Object.assign(blankAppt(), {
        start: _composeISO(mode === "day" ? day : _ymdLocal(new Date()), "09:00"),
        end: _composeISO(mode === "day" ? day : _ymdLocal(new Date()), "11:00")
      })),
      className: "btn-add"
    }, React.createElement(Icon, {
      name: "plus",
      size: 17,
      color: "#fff",
      sw: 2.4
    }), React.createElement("span", null, "\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08"))
  }), React.createElement("div", {
    className: "app-content"
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
      flexWrap: "wrap"
    }
  }, React.createElement(Segmented, {
    value: mode,
    onChange: setMode,
    options: [{
      value: "day",
      label: "รายวัน",
      icon: "calendar"
    }, {
      value: "all",
      label: "ทั้งหมด",
      icon: "list"
    }]
  }), mode === "day" && React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setDay(d => _addDays(d, -1)),
    style: navBtn
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    color: "var(--text-2)",
    style: {
      transform: "scaleX(-1)"
    }
  })), React.createElement("button", {
    onClick: () => setDay(_ymdLocal(new Date())),
    style: {
      ...navBtn,
      width: "auto",
      padding: "0 14px",
      fontWeight: 700,
      fontSize: 13
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("button", {
    onClick: () => setDay(d => _addDays(d, 1)),
    style: navBtn
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    color: "var(--text-2)"
  })), React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)",
      marginLeft: 4
    }
  }, thDate(day, true))), React.createElement("span", {
    style: {
      flex: 1
    }
  }), summary.map(({
    s,
    n
  }) => React.createElement("span", {
    key: s.key,
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: s.color,
      background: s.color + "16",
      padding: "4px 10px",
      borderRadius: 99
    }
  }, s.th, " ", n))), mode === "all" ? allGroups.length === 0 ? React.createElement("div", {
    style: {
      padding: 48,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 14,
      background: "var(--surface)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 16
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \xB7 \u0E01\u0E14 \u201C\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E48\u0E32\u0E22\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23") : allGroups.map(g => React.createElement("div", {
    key: g.day,
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 9
    }
  }, g.day === "ไม่ระบุวัน" ? g.day : thDate(g.day, true), " (", g.items.length, ")"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, g.items.map(a => {
    const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
    const t = techById[a.engineerId];
    const clash = allConflicts.has(a.id);
    return React.createElement("button", {
      key: a.id,
      onClick: () => setEdit(Object.assign({}, a)),
      style: {
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
        padding: 13,
        borderRadius: 13,
        background: "var(--surface)",
        border: "1px solid " + (clash ? "#EF4444" : "var(--border)"),
        boxShadow: clash ? "0 0 0 3px #EF444418" : "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, _hm(a.start), "\u2013", _hm(a.end)), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: stt.color,
        background: stt.color + "16",
        padding: "2px 8px",
        borderRadius: 99
      }
    }, stt.th), React.createElement(Icon, {
      name: "chevronRight",
      size: 14,
      color: "var(--text-3)"
    }))), React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, a.jobName || "—"), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, a.jobCode, a.province ? " · " + a.province : "", a.leadId ? React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10,
        fontWeight: 700,
        color: "#0EA5E9",
        background: "#0EA5E916",
        padding: "2px 7px",
        borderRadius: 99
      }
    }, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E33\u0E23\u0E27\u0E08") : null), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "var(--text-2)",
        marginTop: 1
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: t && t.color || "#94A3B8",
        flexShrink: 0
      }
    }), t ? t.name : "ยังไม่มอบหมาย"), clash && React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "#EF4444"
      }
    }, "\u26A0 \u0E40\u0E27\u0E25\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E17\u0E31\u0E1A\u0E01\u0E31\u0E1A\u0E19\u0E31\u0E14\u0E2D\u0E37\u0E48\u0E19\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E04\u0E19\u0E19\u0E35\u0E49"));
  })))) : dayAppts.length === 0 ? React.createElement("div", {
    style: {
      padding: 48,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 14,
      background: "var(--surface)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 16
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 \xB7 \u0E01\u0E14 \u201C\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E08\u0E48\u0E32\u0E22\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23") : React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      overflowX: "auto",
      paddingBottom: 8
    }
  }, columns.map(col => {
    const list = dayAppts.filter(a => (a.engineerId || "") === col.id).sort((x, y) => new Date(x.start) - new Date(y.start));
    return React.createElement("div", {
      key: col.id || "none",
      style: {
        flex: "0 0 auto",
        width: isMobile ? 240 : 270,
        display: "flex",
        flexDirection: "column",
        gap: 9
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 11px",
        background: "var(--surface2)",
        borderRadius: 11,
        position: "sticky",
        top: 0
      }
    }, React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 99,
        background: col.color
      }
    }), React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: "var(--text-1)",
        flex: 1,
        minWidth: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, col.name), React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-3)",
        fontFamily: "var(--mono)"
      }
    }, list.length)), list.map(a => {
      const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
      const clash = conflicts.has(a.id);
      return React.createElement("button", {
        key: a.id,
        onClick: () => setEdit(Object.assign({}, a)),
        style: {
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 11,
          borderRadius: 12,
          background: "var(--surface)",
          border: "1px solid " + (clash ? "#EF4444" : "var(--border)"),
          boxShadow: clash ? "0 0 0 3px #EF444418" : "var(--shadow-sm)"
        }
      }, React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6
        }
      }, React.createElement("span", {
        style: {
          fontFamily: "var(--mono)",
          fontSize: 13,
          fontWeight: 800,
          color: "var(--text-1)"
        }
      }, _hm(a.start), "\u2013", _hm(a.end)), React.createElement("span", {
        style: {
          fontSize: 10,
          fontWeight: 700,
          color: stt.color,
          background: stt.color + "16",
          padding: "2px 8px",
          borderRadius: 99
        }
      }, stt.th)), React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-1)",
          marginTop: 5,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }, a.jobName || "—"), React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--text-3)",
          marginTop: 1
        }
      }, a.jobCode, a.province ? " · " + a.province : "", a.leadId ? React.createElement("span", {
        style: {
          marginLeft: 5,
          fontSize: 9.5,
          fontWeight: 700,
          color: "#0EA5E9",
          background: "#0EA5E916",
          padding: "2px 6px",
          borderRadius: 99
        }
      }, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E33\u0E23\u0E27\u0E08") : null), clash && React.createElement("div", {
        style: {
          fontSize: 10.5,
          fontWeight: 700,
          color: "#EF4444",
          marginTop: 5
        }
      }, "\u26A0 \u0E40\u0E27\u0E25\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E17\u0E31\u0E1A\u0E01\u0E31\u0E1A\u0E19\u0E31\u0E14\u0E2D\u0E37\u0E48\u0E19"), a.notes && React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--text-2)",
          marginTop: 5,
          background: "var(--surface2)",
          borderRadius: 7,
          padding: "5px 8px"
        }
      }, "\uD83D\uDCDD ", a.notes));
    }));
  }))), edit && React.createElement(SurveyApptModal, {
    initial: edit,
    jobs: jobs,
    techs: techs,
    appts: appts,
    leads: leads,
    blankLead: leadStore && leadStore.blank,
    onClose: () => setEdit(null),
    onSave: (rec, newLead) => {
      if (newLead && leadStore) leadStore.upsert(newLead);
      store.upsert(rec);
      setEdit(null);
    },
    onDelete: id => {
      if (confirm("ลบนัดสำรวจนี้?")) {
        store.remove(id);
        setEdit(null);
      }
    }
  }));
}
const navBtn = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  color: "var(--text-2)",
  flexShrink: 0
};
function SurveyApptModal({
  initial,
  jobs,
  techs,
  appts,
  leads,
  blankLead,
  onClose,
  onSave,
  onDelete
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const isNew = !(appts || []).some(a => a.id === initial.id);
  const [f, setF] = React.useState(() => Object.assign({}, initial, {
    _date: initial.start ? _ymdLocal(initial.start) : _ymdLocal(new Date()),
    _start: initial.start ? _hm(initial.start) : "09:00",
    _end: initial.end ? _hm(initial.end) : "11:00"
  }));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const [target, setTarget] = React.useState(() => initial.projectId ? "job" : "lead");
  const [nl, setNl] = React.useState(() => ({
    name: "",
    phone: "",
    address: "",
    province: ""
  }));
  const setN = (k, v) => setNl(p => Object.assign({}, p, {
    [k]: v
  }));
  const newLead = target === "lead" && !f.leadId;
  const pickJob = id => setF(p => {
    const j = (jobs || []).find(x => x.id === id) || {};
    return Object.assign({}, p, {
      projectId: id,
      leadId: "",
      jobName: j.name || "",
      jobCode: j.code || "",
      province: j.province || "",
      address: j.address || "",
      phone: j.phone || ""
    });
  });
  const pickLead = id => setF(p => {
    const l = (leads || []).find(x => x.id === id) || {};
    return Object.assign({}, p, {
      leadId: id,
      projectId: "",
      jobName: l.name || "",
      jobCode: l.code || "",
      province: l.province || "",
      address: l.address || "",
      phone: l.phone || ""
    });
  });
  const switchTarget = v => {
    setTarget(v);
    setF(p => Object.assign({}, p, v === "job" ? {
      leadId: ""
    } : {
      projectId: ""
    }));
  };
  const startISO = _composeISO(f._date, f._start),
    endISO = _composeISO(f._date, f._end);
  const clash = React.useMemo(() => {
    if (!f.engineerId || !startISO || !endISO) return null;
    return (appts || []).find(a => a.id !== f.id && a.engineerId === f.engineerId && a.status !== "canceled" && a.start && a.end && new Date(startISO).getTime() < new Date(a.end).getTime() && new Date(a.start).getTime() < new Date(endISO).getTime());
  }, [f.engineerId, startISO, endISO, appts]);
  const submit = () => {
    let lead = null;
    if (target === "job") {
      if (!f.projectId) {
        alert("กรุณาเลือกงาน/โครงการ");
        return;
      }
    } else if (newLead) {
      if (!nl.name.trim()) {
        alert("กรุณากรอกชื่อลูกค้า");
        return;
      }
      lead = Object.assign(blankLead ? blankLead() : {}, {
        name: nl.name.trim(),
        phone: nl.phone.trim(),
        address: nl.address.trim(),
        province: nl.province.trim()
      });
    }
    if (!startISO || !endISO) {
      alert("กรุณาระบุวันและเวลา");
      return;
    }
    if (new Date(endISO) <= new Date(startISO)) {
      alert("เวลาสิ้นสุดต้องหลังเวลาเริ่ม");
      return;
    }
    const out = Object.assign({}, f, {
      start: startISO,
      end: endISO
    });
    if (lead) Object.assign(out, {
      leadId: lead.id,
      projectId: "",
      jobName: lead.name,
      jobCode: lead.code,
      province: lead.province,
      address: lead.address,
      phone: lead.phone
    });
    delete out._date;
    delete out._start;
    delete out._end;
    onSave(out, lead);
  };
  const lbl = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 118,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(520px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 16.5,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: 0
    }
  }, isNew ? "นัดสำรวจใหม่" : "แก้ไขนัดสำรวจ"), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23"), React.createElement(Segmented, {
    value: target,
    onChange: switchTarget,
    options: [{
      value: "lead",
      label: "ลูกค้าสำรวจ"
    }, {
      value: "job",
      label: "งานในระบบ"
    }]
  })), target === "job" ? React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E07\u0E32\u0E19 / \u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23 *"), React.createElement(Dropdown, {
    value: f.projectId,
    onChange: pickJob,
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E07\u0E32\u0E19 \u2014",
    options: (jobs || []).map(j => ({
      value: j.id,
      label: j.name + " · " + j.code + (j.province ? " · " + j.province : "")
    }))
  })) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement(Dropdown, {
    value: f.leadId,
    onChange: pickLead,
    placeholder: "\uFF0B \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48 (\u0E01\u0E23\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)",
    options: [{
      value: "",
      label: "＋ ลูกค้าใหม่ (กรอกข้อมูลด้านล่าง)"
    }].concat((leads || []).filter(l => l.status !== "won").map(l => ({
      value: l.id,
      label: l.name + " · " + l.code + (l.province ? " · " + l.province : "")
    })))
  })), newLead && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 11,
      padding: 13,
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 \u201C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E33\u0E23\u0E27\u0E08\u201D \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19 \xB7 \u0E16\u0E49\u0E32\u0E15\u0E01\u0E25\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E2D\u0E22\u0E01\u0E14\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 *"), React.createElement("input", {
    value: nl.name,
    onChange: e => setN("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E04\u0E38\u0E13\u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E43\u0E08\u0E14\u0E35",
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23"), React.createElement("input", {
    value: nl.phone,
    onChange: e => setN("phone", e.target.value),
    placeholder: "08x-xxx-xxxx",
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14"), React.createElement("input", {
    value: nl.province,
    onChange: e => setN("province", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0A\u0E25\u0E1A\u0E38\u0E23\u0E35",
    style: inputStyle
  }))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("input", {
    value: nl.address,
    onChange: e => setN("address", e.target.value),
    placeholder: "\u0E1A\u0E49\u0E32\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 / \u0E16\u0E19\u0E19 / \u0E15\u0E33\u0E1A\u0E25",
    style: inputStyle
  })))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E2A\u0E33\u0E23\u0E27\u0E08"), React.createElement(Dropdown, {
    value: f.engineerId,
    onChange: v => set("engineerId", v),
    placeholder: "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22 \u2014",
    options: [{
      value: "",
      label: "— ยังไม่มอบหมาย —"
    }].concat((techs || []).map(t => ({
      value: t.id,
      label: t.name + (t.nick ? " (" + t.nick + ")" : "")
    })))
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: f._date,
    onChange: e => set("_date", e.target.value),
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 11
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21"), React.createElement("input", {
    type: "time",
    value: f._start,
    onChange: e => set("_start", e.target.value),
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14"), React.createElement("input", {
    type: "time",
    value: f._end,
    onChange: e => set("_end", e.target.value),
    style: inputStyle
  }))), clash && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-red-tx)",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd)",
      borderRadius: 9,
      padding: "9px 11px",
      fontWeight: 600
    }
  }, "\u26A0 \u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E04\u0E19\u0E19\u0E35\u0E49\u0E21\u0E35\u0E19\u0E31\u0E14\u0E0B\u0E49\u0E2D\u0E19\u0E17\u0E31\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49 (", _hm(clash.start), "\u2013", _hm(clash.end), " \xB7 ", clash.jobName, ")"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), React.createElement(Dropdown, {
    value: f.status,
    onChange: v => set("status", v),
    options: APPT_STATUS.map(s => ({
      value: s.key,
      label: s.th
    }))
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E07\u0E32\u0E19"), React.createElement("textarea", {
    value: f.notes,
    onChange: e => set("notes", e.target.value),
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \"\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E30\u0E14\u0E27\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E1A\u0E48\u0E32\u0E22\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\"",
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.5
    })
  }))), React.createElement("div", {
    style: {
      padding: "12px 18px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, !isNew && React.createElement("button", {
    onClick: () => onDelete(f.id),
    style: {
      flex: "0 0 auto",
      width: 44,
      height: 44,
      borderRadius: 11,
      border: "1px solid var(--tint-red-bd)",
      background: "var(--tint-red-bg)",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  })), React.createElement("button", {
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      padding: "12px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: submit,
    style: {
      flex: 1,
      padding: "12px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22"))));
}
const APPT_FLOW = [{
  key: "scheduled",
  th: "รับงาน / นัดหมาย",
  stamp: null
}, {
  key: "transit",
  th: "ออกเดินทาง",
  stamp: "transitAt",
  enterCta: "เริ่มเดินทาง",
  enterIcon: "map"
}, {
  key: "progress",
  th: "เช็คอิน · ถึงไซต์",
  stamp: "arrivedAt",
  enterCta: "เช็คอิน · ถึงไซต์",
  enterIcon: "pin"
}, {
  key: "done",
  th: "ทำแบบสำรวจเสร็จ",
  stamp: "completedAt",
  enterCta: "เปิดแบบสำรวจ",
  enterIcon: "list"
}];
function flowCta(bg) {
  return {
    marginTop: 8,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 15px",
    borderRadius: 10,
    border: "none",
    background: bg,
    color: "#fff",
    fontWeight: 700,
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer"
  };
}
function ApptFlow({
  a,
  job,
  onStatus,
  onOpenSurvey
}) {
  const idx = APPT_FLOW.findIndex(s => s.key === a.status);
  return React.createElement("div", {
    style: {
      paddingLeft: 2
    }
  }, APPT_FLOW.map((s, i) => {
    const reached = i <= idx;
    const isNext = i === idx + 1;
    const last = i === APPT_FLOW.length - 1;
    const time = s.stamp && a[s.stamp] ? _hm(a[s.stamp]) : i === 0 && a.start ? _hm(a.start) : "";
    return React.createElement("div", {
      key: s.key,
      style: {
        display: "flex",
        gap: 11
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }
    }, React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: 99,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: reached ? "var(--primary)" : isNext ? "var(--surface)" : "var(--surface3)",
        border: isNext ? "2px solid var(--primary)" : "2px solid transparent",
        color: "#fff"
      }
    }, reached ? React.createElement(Icon, {
      name: "check",
      size: 12,
      color: "#fff",
      sw: 2.6
    }) : isNext ? React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: "var(--primary)"
      }
    }) : React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 99,
        background: "var(--text-3)"
      }
    })), !last && React.createElement("span", {
      style: {
        width: 2,
        flex: 1,
        minHeight: 18,
        background: i < idx ? "var(--primary)" : "var(--border)",
        margin: "2px 0"
      }
    })), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        paddingBottom: last ? 0 : 12
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: reached || isNext ? 700 : 600,
        color: reached || isNext ? "var(--text-1)" : "var(--text-3)"
      }
    }, s.th), time && React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        fontFamily: "var(--mono)"
      }
    }, time)), isNext && (s.key === "done" ? job ? React.createElement("button", {
      onClick: () => onOpenSurvey(job, a),
      style: flowCta("var(--primary)")
    }, React.createElement(Icon, {
      name: s.enterIcon,
      size: 14,
      color: "#fff"
    }), " ", s.enterCta) : React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "#EF4444",
        marginTop: 6,
        fontWeight: 600
      }
    }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E01\u0E44\u0E27\u0E49") : React.createElement("button", {
      onClick: () => onStatus(a.id, s.key),
      style: flowCta((APPT_STATUS_BY[s.key] || {}).color || "var(--primary)")
    }, React.createElement(Icon, {
      name: s.enterIcon,
      size: 14,
      color: "#fff"
    }), " ", s.enterCta))));
  }), a.status === "done" && job && React.createElement("button", {
    onClick: () => onOpenSurvey(job, a),
    style: {
      width: "100%",
      marginTop: 4,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "10px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39 / \u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E27\u0E08"));
}
function ApptCard({
  a,
  job,
  onStatus,
  onOpenSurvey
}) {
  const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
  const idx = APPT_FLOW.findIndex(s => s.key === a.status);
  const sv = job && window.surveyStatus ? window.surveyStatus(job) : null;
  const mapHref = job && job.map ? job.map : a.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((a.address || "") + " " + (a.province || "")) : null;
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: "4px solid " + stt.color,
      borderRadius: 14,
      boxShadow: "var(--shadow-sm)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--mono)",
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, React.createElement(Icon, {
    name: "clock",
    size: 14,
    color: "var(--text-3)"
  }), thDate(_ymdLocal(a.start), true), " \xB7 ", _hm(a.start), "\u2013", _hm(a.end)), React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "#0EA5E9",
      background: "#0EA5E916",
      padding: "3px 9px",
      borderRadius: 99,
      whiteSpace: "nowrap"
    }
  }, a.leadId ? "สำรวจ · ลูกค้าใหม่" : "สำรวจหน้างาน")), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, a.jobName || job && job.name || "—"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      display: "flex",
      alignItems: "flex-start",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 13,
    color: "var(--text-3)",
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, a.address || "-", a.province ? ", " + a.province : ""), mapHref && React.createElement("a", {
    href: mapHref,
    target: "_blank",
    rel: "noreferrer",
    style: {
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontSize: 11.5,
      textDecoration: "none"
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 12,
    color: "var(--primary-dark)"
  }), " \u0E19\u0E33\u0E17\u0E32\u0E07")), a.phone && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "phone",
    size: 13,
    color: "var(--text-3)"
  }), React.createElement("a", {
    href: "tel:" + a.phone,
    style: {
      color: "var(--primary-dark)",
      textDecoration: "none",
      fontWeight: 600
    }
  }, a.phone)), a.notes && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      background: "var(--surface2)",
      borderRadius: 8,
      padding: "7px 10px"
    }
  }, "\uD83D\uDCDD ", a.notes), a.status === "done" && sv && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--primary-dark)",
      fontWeight: 700
    }
  }, "\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E27\u0E08: ", sv.label, " \xB7 ", sv.pct, "%")), React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border)",
      padding: "13px 14px",
      background: "var(--surface2)"
    }
  }, idx >= 0 ? React.createElement(ApptFlow, {
    a: a,
    job: job,
    onStatus: onStatus,
    onOpenSurvey: onOpenSurvey
  }) : React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: stt.color
    }
  }, stt.th)));
}
const STAGE_KIND_TH = {
  start: "เริ่ม",
  end: "กำหนดเสร็จ",
  mid: "กำลังทำ"
};
function JobTaskCard({
  job,
  stages,
  day,
  dayEnd,
  onOpen,
  onAdvance
}) {
  const SF = window.SF;
  const list = stages && stages.length ? stages : [{
    th: job.stage,
    en: "",
    color: "#64748B"
  }];
  const color = list[0].color || "#64748B";
  const mapHref = job.map ? job.map : job.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((job.address || "") + " " + (job.province || "")) : null;
  const dateStr = day ? dayEnd && dayEnd !== day ? thDate(day, true) + " – " + thDate(dayEnd, true) : thDate(day, true) : "ไม่ระบุวัน";
  const curIdx = (SF.STAGES || []).findIndex(s => s.key === job.stage);
  const curStage = (SF.STAGES || [])[curIdx];
  const nextStage = (SF.STAGES || [])[curIdx + 1];
  const canAdvance = !!(onAdvance && curStage && nextStage && job.stage !== "done" && list.some(s => s.key === curStage.key));
  const isInstall = !!(canAdvance && curStage.key === "install");
  const _instS = isInstall && SF.installDate ? SF.installDate(job) : "";
  const _instE = isInstall && SF.installEnd ? SF.installEnd(job) : _instS;
  const _today = SF.TODAY;
  const advNoDate = isInstall && !_instS;
  const advEarly = isInstall && _instS && _today < _instS;
  const advOverdue = isInstall && _instE && _today > _instE;
  const daysLate = advOverdue ? Math.max(1, Math.round((new Date(_today + "T00:00:00") - new Date(_instE + "T00:00:00")) / 86400000)) : 0;
  const doAdvance = e => {
    e.stopPropagation();
    if (confirm("ขั้น \"" + curStage.th + "\" เสร็จแล้ว เลื่อนไป \"" + nextStage.th + "\" ?")) onAdvance(job);
  };
  return React.createElement("div", {
    role: "button",
    tabIndex: 0,
    onClick: () => onOpen && onOpen(job),
    style: {
      textAlign: "left",
      cursor: "pointer",
      fontFamily: "inherit",
      width: "100%",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: "4px solid " + color,
      borderRadius: 14,
      boxShadow: "var(--shadow-sm)",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      minWidth: 0
    }
  }, list.map(s => React.createElement("span", {
    key: (s.key || s.th) + (s.kind || ""),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 9px",
      borderRadius: 99,
      background: (s.color || "#64748B") + "16",
      color: s.color || "#64748B",
      fontSize: 12,
      fontWeight: 800,
      whiteSpace: "nowrap"
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: s.color || "#64748B"
    }
  }), s.th, s.kind && STAGE_KIND_TH[s.kind] && React.createElement("span", {
    style: {
      fontWeight: 600,
      opacity: .7
    }
  }, "\xB7 ", STAGE_KIND_TH[s.kind])))), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--primary-dark)",
      flexShrink: 0
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19 ", React.createElement(Icon, {
    name: "chevronRight",
    size: 14,
    color: "var(--primary-dark)"
  }))), React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job.name), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "clock",
    size: 13,
    color: "var(--text-3)"
  }), dateStr, list.length > 1 ? " · " + list.length + " งาน" : "", typeof job.progressPct === "number" && React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)",
      fontFamily: "var(--mono)"
    }
  }, job.progressPct, "%")), (() => {
    const STAGES = SF.STAGES || [];
    const ci = Math.max(0, STAGES.findIndex(s => s.key === job.stage));
    const SHORT = {
      design: "ออกแบบ",
      takeoff: "ถอดของ",
      queue: "นัดคิว",
      install: "ติดตั้ง",
      done: "เสร็จ"
    };
    return React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        marginTop: 2,
        marginBottom: 2
      }
    }, STAGES.map((s, i) => {
      const passed = i < ci,
        current = i === ci,
        filled = passed || current;
      const isLast = i === STAGES.length - 1;
      return React.createElement("div", {
        key: s.key,
        title: s.th,
        style: {
          flex: isLast ? "0 0 auto" : "1 1 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          minWidth: 0
        }
      }, React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          alignSelf: "stretch"
        }
      }, React.createElement("span", {
        style: {
          width: current ? 13 : 9,
          height: current ? 13 : 9,
          borderRadius: 99,
          flexShrink: 0,
          background: filled ? s.color : "var(--surface)",
          border: current ? "2px solid " + s.color : passed ? "none" : "1.5px solid var(--border-strong)",
          boxShadow: current ? "0 0 0 3px " + s.color + "33" : "none",
          display: "grid",
          placeItems: "center"
        }
      }, passed && React.createElement(Icon, {
        name: "check",
        size: 6,
        color: "#fff",
        sw: 3.5
      })), !isLast && React.createElement("span", {
        style: {
          flex: 1,
          height: 2,
          margin: "0 2px",
          background: i < ci ? s.color : "var(--border)"
        }
      })), React.createElement("span", {
        style: {
          marginTop: 3,
          fontSize: 8.5,
          fontWeight: current ? 800 : 500,
          color: current ? s.color : passed ? "var(--text-2)" : "var(--text-3)",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%"
        }
      }, SHORT[s.key] || s.th));
    }));
  })(), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 13,
    color: "var(--text-3)",
    style: {
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job.address || "-", job.province ? ", " + job.province : ""), mapHref && React.createElement("a", {
    href: mapHref,
    target: "_blank",
    rel: "noreferrer",
    onClick: e => e.stopPropagation(),
    style: {
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontSize: 11.5,
      textDecoration: "none"
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 12,
    color: "var(--primary-dark)"
  }), " \u0E19\u0E33\u0E17\u0E32\u0E07")), canAdvance && (advNoDate || advEarly ? React.createElement("div", {
    style: {
      marginTop: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "9px",
      borderRadius: 10,
      background: "var(--surface3)",
      color: "var(--text-3)",
      fontWeight: 700,
      fontSize: 12.5
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 13,
    color: "var(--text-3)"
  }), " ", advNoDate ? "ยังไม่กำหนดวันนัดติดตั้ง" : "ติดตั้งวันที่ " + thDate(_instS, true) + (_instE && _instE !== _instS ? "–" + thDate(_instE, true) : "")) : React.createElement("button", {
    onClick: doAdvance,
    style: {
      marginTop: 2,
      width: "100%",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "10px",
      borderRadius: 10,
      border: "none",
      background: advOverdue ? "var(--tint-red-tx2)" : curStage.color || "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: advOverdue ? "alert" : "check",
    size: 15,
    color: "#fff",
    sw: 2.5
  }), " ", advOverdue ? "เลยกำหนด " + daysLate + " วัน · " : "", "\u0E40\u0E2A\u0E23\u0E47\u0E08 \u201C", curStage.th, "\u201D \u2192 ", nextStage.th)));
}
function buildMySchedItems(appts, jobs, techId) {
  if (!techId) return [];
  const SF = window.SF;
  const out = [];
  const todayY = _ymdLocal(new Date());
  (appts || []).forEach(a => {
    if (a.engineerId !== techId || a.status === "canceled") return;
    const day = a.start ? _ymdLocal(a.start) : "";
    if ((a.status === "done" || a.status === "rescheduled") && day !== todayY) return;
    out.push({
      type: "survey",
      key: "a-" + a.id,
      a: a,
      day: day,
      ts: a.start ? new Date(a.start).getTime() : 0
    });
  });
  (jobs || []).forEach(j => {
    if (j.tech !== techId || j.stage === "done") return;
    const STAGES = SF.STAGES || [];
    const cur = Math.max(0, STAGES.findIndex(s => s.key === j.stage));
    const curStage = STAGES[cur] || {
      key: j.stage,
      th: j.stage,
      en: "",
      color: "#64748B"
    };
    const s = SF.installDate ? SF.installDate(j) : "";
    if (!s) return;
    const e = SF.installEnd ? SF.installEnd(j) : s;
    out.push({
      type: "job",
      key: "j-" + j.id,
      job: j,
      day: s,
      dayEnd: e,
      stages: [Object.assign({}, curStage)],
      ts: new Date(s + "T00:00:00").getTime()
    });
  });
  return out.sort((x, y) => x.ts - y.ts);
}
function MyScheduleView({
  appts,
  jobs,
  leads,
  me,
  onMenuOpen,
  onStatus,
  onOpenSurvey,
  onOpen,
  onAdvance
}) {
  const techId = me && me.techId;
  const jobsById = React.useMemo(() => Object.fromEntries((jobs || []).map(j => [j.id, j])), [jobs]);
  const leadsById = React.useMemo(() => Object.fromEntries((leads || []).map(l => [l.id, l])), [leads]);
  const targetOf = a => a.leadId ? leadAsJob(leadsById[a.leadId]) : jobsById[a.projectId];
  const items = React.useMemo(() => buildMySchedItems(appts, jobs, techId), [appts, jobs, techId]);
  const todayY = _ymdLocal(new Date());
  const grp = it => {
    if (!it.day) return "nodate";
    const end = it.dayEnd || it.day;
    if (end < todayY) return "past";
    if (it.day > todayY) return "upcoming";
    return "today";
  };
  const groups = [{
    key: "past",
    th: "เลยกำหนด / ผ่านมา",
    items: items.filter(it => grp(it) === "past")
  }, {
    key: "today",
    th: "วันนี้",
    items: items.filter(it => grp(it) === "today")
  }, {
    key: "upcoming",
    th: "กำลังจะถึง",
    items: items.filter(it => grp(it) === "upcoming")
  }, {
    key: "nodate",
    th: "ไม่ระบุวันที่",
    items: items.filter(it => grp(it) === "nodate")
  }].filter(g => g.items.length);
  const nAppt = items.filter(i => i.type === "survey").length;
  const nJob = items.filter(i => i.type === "job").length;
  const sub = !techId ? "บัญชียังไม่ผูกกับพนักงาน — แจ้งแอดมิน" : items.length ? [nJob ? nJob + " งานติดตั้งที่นัดแล้ว" : null, nAppt ? nAppt + " นัดสำรวจ" : null].filter(Boolean).join(" · ") : "ยังไม่มีงานที่นัดวันแล้ว";
  const renderCard = it => it.type === "survey" ? React.createElement(ApptCard, {
    key: it.key,
    a: it.a,
    job: targetOf(it.a),
    onStatus: onStatus,
    onOpenSurvey: onOpenSurvey
  }) : React.createElement(JobTaskCard, {
    key: it.key,
    job: it.job,
    stages: it.stages,
    day: it.day,
    dayEnd: it.dayEnd,
    onOpen: onOpen,
    onAdvance: onAdvance
  });
  return React.createElement(React.Fragment, null, React.createElement(SchedHeader, {
    icon: "list",
    title: "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19",
    onMenuOpen: onMenuOpen,
    sub: sub
  }), React.createElement("div", {
    className: "app-content"
  }, !techId ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 14,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19 \xB7 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2B\u0E49\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E43\u0E19\u0E40\u0E21\u0E19\u0E39\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19") : items.length === 0 ? React.createElement("div", {
    style: {
      padding: 44,
      textAlign: "center",
      color: "var(--text-3)",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16
    }
  }, React.createElement("div", {
    style: {
      fontSize: 30,
      marginBottom: 6
    }
  }, "\uD83C\uDF89"), React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49")) : groups.map(g => React.createElement("div", {
    key: g.key,
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 9
    }
  }, g.th, " (", g.items.length, ")"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, g.items.map(renderCard))))));
}
Object.assign(window, {
  useSurveyApptStore,
  DispatchView,
  MyScheduleView,
  SurveyApptModal,
  ApptCard,
  JobTaskCard,
  ApptFlow,
  apptConflicts,
  blankAppt,
  buildMySchedItems,
  APPT_STATUS,
  APPT_STATUS_BY,
  APPT_FLOW,
  useSurveyLeadStore,
  blankLead,
  leadAsJob,
  moveSurveyPhotos,
  LEAD_STATUS,
  LEAD_STATUS_BY,
  SchedHeader
});