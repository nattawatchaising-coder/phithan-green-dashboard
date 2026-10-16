function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TM_IN = {
  padding: "9px 11px",
  borderRadius: "var(--r-chip)",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none"
};
const TM_IN_W = Object.assign({}, TM_IN, {
  width: "100%"
});
const TM_LB = {
  display: "grid",
  gap: 4,
  minWidth: 0
};
const TM_WD_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
function tmWdOf(d) {
  const s = String(d || "");
  return new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12).getDay();
}
function TmPill({
  s,
  size
}) {
  const st = window.tmOtStatusOf(s);
  return React.createElement("span", {
    style: {
      padding: size === "sm" ? "2px 8px" : "3px 10px",
      borderRadius: "var(--r-pill)",
      background: st.color + "1A",
      color: st.color,
      fontSize: size === "sm" ? 10.5 : 11.5,
      fontWeight: 800,
      whiteSpace: "nowrap"
    }
  }, st.th);
}
function TmStat({
  label,
  value,
  unit,
  color,
  hint,
  on,
  onClick
}) {
  return React.createElement("button", {
    onClick: onClick,
    disabled: !onClick,
    style: {
      flex: "1 1 180px",
      minWidth: 165,
      textAlign: "left",
      padding: "12px 14px",
      borderRadius: "var(--r-tile)",
      border: "none",
      boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
      background: on ? "var(--primary-soft)" : "var(--surface)",
      cursor: onClick ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      marginTop: 3,
      display: "flex",
      alignItems: "baseline",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 22,
      fontWeight: 800,
      color: color || "var(--text-1)"
    }
  }, value), unit && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, unit)), hint && React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, hint));
}
function TmDaySheet({
  date,
  setDate,
  cfg,
  users,
  currentUser
}) {
  const lvRows = window.useLeaves().rows;
  const lvTypes = window.useLeaveTypes().types;
  const onLeave = React.useMemo(() => window.lvOnDay(lvRows, date), [lvRows, date]);
  const day = window.useAttendDay(date);
  const admin = window.useAttendAdmin(currentUser);
  const [msg, setMsg] = React.useState("");
  const nameOf = r => window.tmNameOf(users, r.userId, r.name);
  const gpsCell = r => {
    if (!r.gps && r.fix) return React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u2014");
    if (!r.gps) return React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "#F59E0B",
        fontWeight: 700
      }
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14");
    const ok = React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "#10B981",
        fontWeight: 700
      }
    }, "\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14");
    if (r.lat == null || r.lng == null) return ok;
    const d = window.tmOfficeDist(r, cfg);
    const link = kid => React.createElement("a", {
      href: window.tmGpsUrl(r),
      target: "_blank",
      rel: "noreferrer",
      title: "พิกัดตอนเข้างาน " + window.tmGpsTH(r),
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        textDecoration: "none"
      }
    }, kid);
    if (d == null) return link(ok);
    const near = d <= window.tmWhNorm(cfg).office.radius;
    const office = r.place === "office";
    const color = !office ? "var(--text-3)" : near ? "#10B981" : "#EF4444";
    const txt = office ? (near ? "ถึงออฟฟิศ · " : "ห่างออฟฟิศ ") + window.tmDistTH(d) : "ห่างออฟฟิศ " + window.tmDistTH(d);
    return link(React.createElement("span", {
      style: {
        color: color
      }
    }, txt));
  };
  const del = async r => {
    const ok = await window.askConfirm({
      title: "ลบใบลงเวลาของ " + nameOf(r) + "?",
      body: window.drDateTH(date, true) + " · " + (r.in || "—") + " – " + (r.out || "—") + " · " + window.tmDur(r.mins) + "\nลบแล้วคนคนนี้กดลงเวลาของวันนี้ใหม่ได้ตั้งแต่ต้น",
      ok: "ลบใบนี้",
      danger: true,
      icon: "trash"
    });
    if (!ok) return;
    const res = await admin.removeDay(r.userId, date);
    setMsg(res.ok ? "ลบใบลงเวลาของ " + nameOf(r) + " แล้ว" : "ลบไม่สำเร็จ — " + res.why);
  };
  const isAdmin = window.usePgAdmin();
  const [ed, setEd] = React.useState(null);
  const openEd = (uid, nm, inHM, outHM) => {
    const u = (users || []).find(x => x && x.id === uid) || {
      id: uid,
      name: nm
    };
    const c = window.tmWhNorm(cfg);
    setEd({
      user: u,
      inHM: inHM || c.startEarly,
      outHM: outHM != null ? outHM : c.end,
      why: "",
      busy: false,
      err: ""
    });
  };
  const saveEd = async () => {
    if (!ed || ed.busy) return;
    setEd(Object.assign({}, ed, {
      busy: true,
      err: ""
    }));
    const res = await admin.setTimes(ed.user, date, ed.inHM, ed.outHM, ed.why, cfg).catch(e => ({
      ok: false,
      why: String(e && e.message || e)
    }));
    if (!res.ok) {
      setEd(Object.assign({}, ed, {
        busy: false,
        err: res.why
      }));
      return;
    }
    setMsg("แก้เวลาของ " + (ed.user.name || "") + " แล้ว · " + ed.inHM + " – " + (ed.outHM || "ยังไม่ออก"));
    setEd(null);
  };
  const holiday = window.tmIsHoliday(date, cfg);
  const workday = window.tmIsWorkday(date, cfg);
  const missing = React.useMemo(() => {
    if (!workday) return [];
    const have = {};
    (day.rows || []).forEach(r => {
      have[r.userId] = 1;
    });
    return (users || []).filter(u => u && u.active !== false && !window.tmIsSysAcct(u) && window.can(window.userRoles(u), "attend") && !have[u.id] && !onLeave[u.id]);
  }, [day.rows, users, workday, onLeave]);
  const leaving = (users || []).filter(u => u && onLeave[u.id] && !(day.rows || []).some(r => r.userId === u.id));
  const totalMins = (day.rows || []).reduce((a, r) => a + (+r.mins || 0), 0);
  const noGps = (day.rows || []).filter(r => !r.gps && !r.fix).length;
  const stillIn = (day.rows || []).filter(r => r.in && !r.out).length;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, -1)),
    style: TM_NAV,
    title: "\u0E27\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"
  }, "\u2039"), React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value || window.drToday()),
    style: TM_IN
  }), React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, 1)),
    style: TM_NAV,
    title: "\u0E27\u0E31\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B"
  }, "\u203A"), date !== window.drToday() && React.createElement("button", {
    onClick: () => setDate(window.drToday()),
    style: TM_NAV
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.drDateTH(date, true)), holiday ? React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: "var(--r-pill)",
      background: "var(--tint-red-bg)",
      color: "var(--tint-red-tx)",
      fontSize: 11.5,
      fontWeight: 800
    }
  }, "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 \xB7 ", window.tmWhNorm(cfg).holidays[date]) : !workday ? React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: "var(--r-pill)",
      background: "var(--surface3)",
      color: "var(--text-2)",
      fontSize: 11.5,
      fontWeight: 800
    }
  }, "\u0E19\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19") : null), React.createElement(TmFacts, {
    items: [{
      label: "ลงเวลาแล้ว",
      value: (day.rows || []).length,
      unit: "คน"
    }, workday && {
      label: "ยังไม่ลง",
      value: missing.length,
      unit: "คน",
      color: missing.length ? "#F59E0B" : ""
    }, leaving.length > 0 && {
      label: "ลา",
      value: leaving.length,
      unit: "คน",
      color: "#0EA5E9"
    }, {
      label: "ยังไม่ออกงาน",
      value: stillIn,
      unit: "คน",
      color: stillIn ? "#EF4444" : "",
      hint: stillIn ? "อาจลืมกดออก — ทักถามก่อนหักเวลา" : ""
    }, {
      label: "ชั่วโมงรวม",
      value: Math.round(totalMins / 60),
      unit: "ชม."
    }, noGps > 0 && {
      label: "ไม่มีพิกัด",
      value: noGps,
      unit: "ใบ",
      color: "#F59E0B"
    }]
  }), React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      background: "var(--surface)"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      background: "var(--surface2)"
    }
  }, ["ชื่อ", "เข้า", "ออก", "ชั่วโมง", "งานที่แจ้ง", "พิกัด / ห่างจากออฟฟิศ", ""].map((h, i) => React.createElement("th", {
    key: i,
    style: {
      textAlign: i >= 1 && i <= 3 ? "center" : "left",
      padding: "10px 13px",
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--text-3)",
      borderBottom: "1px solid var(--divider)",
      whiteSpace: "nowrap"
    }
  }, h)))), React.createElement("tbody", null, day.loading && React.createElement("tr", null, React.createElement("td", {
    colSpan: 7,
    style: {
      padding: 26,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")), !day.loading && (day.rows || []).length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: 7,
    style: {
      padding: 26,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49")), (day.rows || []).map(r => React.createElement("tr", {
    key: r.userId,
    style: {
      borderBottom: "1px solid var(--divider)"
    }
  }, React.createElement("td", {
    style: {
      padding: "9px 13px",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, nameOf(r)), React.createElement("td", {
    style: {
      padding: "9px 13px",
      textAlign: "center",
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, r.in || "—"), React.createElement("td", {
    style: {
      padding: "9px 13px",
      textAlign: "center",
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: r.in && !r.out ? "#EF4444" : "var(--text-1)"
    }
  }, r.out || (r.in ? "ยังไม่ออก" : "—")), React.createElement("td", {
    style: {
      padding: "9px 13px",
      textAlign: "center",
      color: "var(--text-2)"
    }
  }, window.tmDur(r.mins)), React.createElement("td", {
    style: {
      padding: "9px 13px",
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, r.place === "office" || r.fix && !r.jobCode ? React.createElement("span", {
    style: {
      fontFamily: "inherit",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28") : r.jobCode || "—"), React.createElement("td", {
    style: {
      padding: "9px 13px"
    }
  }, gpsCell(r)), React.createElement("td", {
    style: {
      padding: "9px 13px",
      textAlign: "right"
    }
  }, isAdmin && React.createElement("button", {
    onClick: () => openEd(r.userId, nameOf(r), r.in, r.out || ""),
    title: "\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01\u0E02\u0E2D\u0E07\u0E04\u0E19\u0E19\u0E35\u0E49",
    style: {
      marginRight: 6,
      padding: "5px 11px",
      borderRadius: 8,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, "\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32"), React.createElement("button", {
    onClick: () => del(r),
    title: "\u0E25\u0E1A\u0E43\u0E1A\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E19\u0E19\u0E35\u0E49",
    style: {
      padding: "5px 11px",
      borderRadius: 8,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--tint-red-tx2)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, "\u0E25\u0E1A")))), leaving.map(u => {
    const lr = onLeave[u.id],
      lt = window.lvTypeOf(lvTypes, lr.type);
    return React.createElement("tr", {
      key: "lv" + u.id,
      style: {
        borderBottom: "1px solid var(--divider)"
      }
    }, React.createElement("td", {
      style: {
        padding: "9px 13px",
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, u.name), React.createElement("td", {
      colSpan: 6,
      style: {
        padding: "9px 13px",
        fontSize: 12,
        fontWeight: 700,
        color: lt.color
      }
    }, lt.th, " \xB7 ", window.lvRangeTH(lr), " \xB7 ", lr.no));
  }), missing.map(u => React.createElement("tr", {
    key: u.id,
    style: {
      borderBottom: "1px solid var(--divider)",
      background: "var(--surface2)"
    }
  }, React.createElement("td", {
    style: {
      padding: "9px 13px",
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, u.name), React.createElement("td", {
    colSpan: 5,
    style: {
      padding: "9px 13px",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32"), React.createElement("td", {
    style: {
      padding: "9px 13px",
      textAlign: "right"
    }
  }, isAdmin && React.createElement("button", {
    onClick: () => openEd(u.id, u.name, "", null),
    title: "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19\u0E04\u0E19\u0E17\u0E35\u0E48\u0E25\u0E37\u0E21\u0E25\u0E07",
    style: {
      padding: "5px 11px",
      borderRadius: 8,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      whiteSpace: "nowrap"
    }
  }, "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19"))))))), isAdmin && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E17\u0E19"), React.createElement("select", {
    value: "",
    onChange: e => {
      const u = (users || []).find(x => x && x.id === e.target.value);
      if (!u) return;
      const r = (day.rows || []).find(x => x.userId === u.id);
      openEd(u.id, u.name, r ? r.in : "", r ? r.out || "" : null);
    },
    style: Object.assign({}, TM_IN, {
      minWidth: 180
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E04\u0E19 \u2014"), (users || []).filter(u => u && u.active !== false && !window.tmIsSysAcct(u) && window.can(window.userRoles(u), "attend")).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name)))), msg && React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, msg), ed && React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 90,
      background: "rgba(15,23,42,.45)",
      display: "grid",
      placeItems: "center",
      padding: 18
    },
    onMouseDown: e => {
      if (e.target === e.currentTarget && !ed.busy) setEd(null);
    }
  }, React.createElement("div", {
    style: {
      width: "min(420px,100%)",
      background: "var(--bg)",
      boxShadow: "var(--shadow-card)",
      borderRadius: 17,
      padding: 20,
      display: "grid",
      gap: 12
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E25\u0E07\u0E07\u0E32\u0E19 \xB7 ", window.drDateTH(date, true)), React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, ed.user.name)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
      gap: 9,
      alignItems: "end"
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement(window.PgTime, {
    value: ed.inHM,
    ariaLabel: "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19",
    onChange: t => setEd(p => Object.assign({}, p, {
      inHM: t
    })),
    style: TM_IN_W
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-3)",
      paddingBottom: 10
    }
  }, "\u0E16\u0E36\u0E07"), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19 (\u0E27\u0E48\u0E32\u0E07 = \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01)"), React.createElement(window.PgTime, {
    value: ed.outHM,
    ariaLabel: "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19",
    onChange: t => setEd(p => Object.assign({}, p, {
      outHM: t
    })),
    style: TM_IN_W
  }))), ed.err && React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--tint-red-tx2)"
    }
  }, ed.err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    type: "button",
    className: "btn",
    disabled: ed.busy,
    onClick: () => setEd(null)
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    type: "button",
    className: "btn btn-pri",
    disabled: ed.busy || !ed.inHM,
    onClick: saveEd
  }, ed.busy ? "กำลังบันทึก…" : "บันทึกเวลา")))), React.createElement(TmHelp, null, "\u0E1B\u0E38\u0E48\u0E21 \u201C\u0E25\u0E1A\u201D \u0E25\u0E1A\u0E43\u0E1A\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E31\u0E49\u0E19\u0E17\u0E31\u0E49\u0E07\u0E43\u0E1A \u0E41\u0E25\u0E49\u0E27\u0E43\u0E2B\u0E49\u0E40\u0E08\u0E49\u0E32\u0E15\u0E31\u0E27\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E21\u0E48 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E01\u0E47\u0E1A\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E25\u0E1A\u0E44\u0E27\u0E49\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19\u0E25\u0E1A \u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E42\u0E15\u0E49\u0E40\u0E16\u0E35\u0E22\u0E07\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E15\u0E2D\u0E19\u0E2A\u0E34\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19", React.createElement("br", null), "\u0E0A\u0E48\u0E2D\u0E07 \u201C\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E08\u0E49\u0E07\u201D \u0E04\u0E37\u0E2D\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E2D\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E27\u0E48\u0E32\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E44\u0E0B\u0E15\u0E4C\u0E19\u0E31\u0E49\u0E19\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E08\u0E36\u0E07\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", React.createElement("br", null), "\u201C\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u201D \u0E40\u0E01\u0E34\u0E14\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E08\u0E32\u0E01\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E44\u0E21\u0E48\u0E16\u0E36\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2D\u0E32\u0E04\u0E32\u0E23 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E14\u0E49\u0E27\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E19\u0E35\u0E49", React.createElement("br", null), "\u0E23\u0E30\u0E22\u0E30\u0E2B\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E43\u0E19\u0E41\u0E17\u0E47\u0E1A \u201C\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u201D \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E15\u0E2D\u0E19\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 \u2014 \u0E02\u0E36\u0E49\u0E19\u0E2A\u0E35\u0E41\u0E14\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19\u0E17\u0E35\u0E48\u0E01\u0E14 \u201C\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u201D \u0E41\u0E15\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E23\u0E31\u0E28\u0E21\u0E35 \u0E2A\u0E48\u0E27\u0E19\u0E07\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E0B\u0E15\u0E4C\u0E2B\u0E48\u0E32\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1B\u0E01\u0E15\u0E34", React.createElement("br", null), "\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E1B\u0E31\u0E4A\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E23\u0E38\u0E48\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E47\u0E1A\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E25\u0E07\u0E14\u0E31\u0E0A\u0E19\u0E35\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E27\u0E48\u0E32 \u201C\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u201D \u0E40\u0E09\u0E22 \u0E46 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E30\u0E22\u0E30 \u2014 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E43\u0E1A\u0E40\u0E15\u0E47\u0E21 \u0E14\u0E39\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C Excel"));
}
async function tmExportMonthXlsx(rows, days, ym, otRows, users, cfg) {
  if (!window.XLSX) {
    alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)");
    return;
  }
  if (!rows || !rows.length) {
    alert("เดือนนี้ยังไม่มีข้อมูลให้ออกไฟล์");
    return;
  }
  const X = window.XLSX;
  const FONT = "Tahoma";
  const C = {
    brand: "1D854B",
    brandDk: "12603A",
    brandSoft: "EAF6EF",
    white: "FFFFFF",
    border: "CBD8D0",
    text: "16241D",
    sub: "5A6B62",
    alt: "F4FAF6",
    warn: "FDECEA",
    warnTx: "B42318"
  };
  const thin = {
    style: "thin",
    color: {
      rgb: C.border
    }
  };
  const boxAll = {
    top: thin,
    bottom: thin,
    left: thin,
    right: thin
  };
  const H = m => !m ? "" : Math.round(m / 60 * 100) / 100;
  const cols = ["ชื่อ"].concat(days.map(d => +d.slice(8))).concat(["วันที่ลงเวลา", "ชั่วโมงรวม", "OT อนุมัติแล้ว", "ลืมกดออก", "ไม่มีพิกัด"]);
  const lastC = cols.length - 1;
  const aoa = [],
    merges = [],
    meta = [],
    rowsH = [];
  let R = 0;
  const push = (cells, type, hpt) => {
    aoa.push(cells);
    meta[R] = type;
    if (hpt) rowsH[R] = {
      hpt: hpt
    };
    R += 1;
  };
  const full = r => merges.push({
    s: {
      r: r,
      c: 0
    },
    e: {
      r: r,
      c: lastC
    }
  });
  push(["สรุปเวลาทำงานรายเดือน · " + window.tmYmTH(ym)], "title", 30);
  full(R - 1);
  push(["flash+solar · ตัวเลขจากใบลงเวลาที่พนักงานปั๊มเอง ยังไม่ใช่ยอดจ่าย"], "subtitle", 20);
  full(R - 1);
  push([], "spacer", 6);
  push(cols, "head", 26);
  let alt = false;
  rows.forEach(r => {
    const line = [r.name].concat(days.map(d => r.byDay[d] ? H(r.byDay[d].mins) : "")).concat([r.days || "", H(r.mins), H(r.otMins), r.noOut || "", r.noGps || ""]);
    push(line, alt ? "itemAlt" : "item", 19);
    alt = !alt;
  });
  const sum = k => rows.reduce((a, r) => a + (+r[k] || 0), 0);
  push(["รวมทั้งสิ้น"].concat(days.map(() => "")).concat([sum("days"), H(sum("mins")), H(sum("otMins")), sum("noOut") || "", sum("noGps") || ""]), "total", 24);
  merges.push({
    s: {
      r: R - 1,
      c: 1
    },
    e: {
      r: R - 1,
      c: days.length
    }
  });
  push([], "spacer", 8);
  push(["ช่องว่าง = ไม่มีใบลงเวลาในวันนั้น · ใบที่ลืมกดออกงานชั่วโมงเป็นศูนย์ ระบบไม่เดาเวลาเลิกงานให้"], "foot", 18);
  full(R - 1);
  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{
    wch: 22
  }].concat(days.map(() => ({
    wch: 5.2
  }))).concat([{
    wch: 12
  }, {
    wch: 11
  }, {
    wch: 13
  }, {
    wch: 10
  }, {
    wch: 10
  }]);
  ws["!rows"] = rowsH;
  ws["!freeze"] = {
    xSplit: 1,
    ySplit: 4
  };
  ws["!autofilter"] = null;
  const styleCell = (r, c) => {
    const t = meta[r];
    if (t === "spacer") return null;
    const s = {
      font: {
        name: FONT,
        sz: 10.5,
        color: {
          rgb: C.text
        }
      },
      alignment: {
        vertical: "center"
      }
    };
    if (t === "title") {
      s.font = {
        name: FONT,
        sz: 15,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "subtitle") {
      s.font = {
        name: FONT,
        sz: 10.5,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandSoft
        }
      };
      s.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "head") {
      s.font = {
        name: FONT,
        sz: 10,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s.alignment = {
        horizontal: c === 0 ? "left" : "center",
        vertical: "center",
        wrapText: true
      };
      s.border = boxAll;
    } else if (t === "total") {
      s.font = {
        name: FONT,
        sz: 11,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandDk
        }
      };
      s.alignment = {
        horizontal: c === 0 ? "left" : "center",
        vertical: "center"
      };
      s.border = boxAll;
      if (c > days.length + 1) s.numFmt = "#,##0.00";
    } else if (t === "foot") {
      s.font = {
        name: FONT,
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
    } else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.alt
        }
      };
      s.border = boxAll;
      if (c === 0) {
        s.alignment = {
          horizontal: "left",
          vertical: "center"
        };
        s.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.text
          }
        };
      } else {
        s.alignment = {
          horizontal: "center",
          vertical: "center"
        };
        if (c !== lastC - 1 && c !== lastC && c !== days.length + 1) s.numFmt = "0.00";
      }
      if (c === lastC - 1 && aoa[r][c]) {
        s.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.warn
          }
        };
        s.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.warnTx
          }
        };
      }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({
        r: r,
        c: c
      });
      const st = styleCell(r, c);
      if (!st) continue;
      if (!ws[ref]) ws[ref] = {
        t: "s",
        v: ""
      };
      ws[ref].s = st;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "เวลาทำงาน");
  const otMine = {};
  (otRows || []).forEach(o => {
    if (!o || !o.userId) return;
    if (window.tmYm(o.date) !== ym) return;
    if (o.status !== "sent" && o.status !== "approved") return;
    (otMine[o.userId] || (otMine[o.userId] = [])).push(o);
  });
  const want = rows.filter(r => r.days > 0 || (otMine[r.userId] || []).length);
  let detail = {};
  try {
    detail = await window.tmFetchMonthDetail(want.map(r => r.userId), ym);
  } catch (e) {
    detail = {};
  }
  const used = {
    "เวลาทำงาน": 1
  };
  want.forEach(r => {
    const list = (otMine[r.userId] || []).slice();
    list.sort((a2, b2) => String(a2.date + a2.from).localeCompare(String(b2.date + b2.from)));
    X.utils.book_append_sheet(wb, tmPersonSheet(X, r, list, detail[r.userId] || {}, days, ym, cfg, FONT, C), tmSheetName(r.name, used));
  });
  X.writeFile(wb, "สรุปเวลาทำงาน_" + ym + ".xlsx");
}
function tmSheetName(raw, used) {
  let n = String(raw || "พนักงาน").replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "พนักงาน";
  if (used[n]) {
    let i = 2;
    while (used[n.slice(0, 28) + " " + i]) i += 1;
    n = n.slice(0, 28) + " " + i;
  }
  used[n] = 1;
  return n;
}
const TM_DOW_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
function tmPersonSheet(X, person, list, recs, days, ym, cfg, FONT, C) {
  const thin = {
    style: "thin",
    color: {
      rgb: C.border
    }
  };
  const boxAll = {
    top: thin,
    bottom: thin,
    left: thin,
    right: thin
  };
  const H = m => !m ? 0 : Math.round(m / 60 * 100) / 100;
  const name = person.name || person.userId;
  const office = window.tmWhNorm(cfg).office;
  const lastC = 12;
  const aoa = [],
    merges = [],
    meta = [],
    rowsH = [],
    links = {};
  let R = 0;
  const push = (cells, type, hpt) => {
    aoa.push(cells);
    meta[R] = type;
    if (hpt) rowsH[R] = {
      hpt: hpt
    };
    R += 1;
  };
  const full = r => merges.push({
    s: {
      r: r,
      c: 0
    },
    e: {
      r: r,
      c: lastC
    }
  });
  push(["ใบลงเวลาและการทำงานล่วงเวลา รายบุคคล"], "title", 30);
  full(R - 1);
  push([name + " · " + window.tmYmTH(ym)], "subtitle", 22);
  full(R - 1);
  push([], "spacer", 6);
  const otByDay = {};
  list.forEach(o => {
    (otByDay[o.date] || (otByDay[o.date] = [])).push(o);
  });
  let otApproved = 0,
    otWaiting = 0,
    payApproved = 0;
  list.forEach(o => {
    const m = +o.mins || 0;
    if (o.status === "approved") {
      otApproved += m;
      payApproved += window.tmOtPayMins(o, cfg);
    } else otWaiting += m;
  });
  push(["วันที่ลงเวลา", person.days || 0, "ชั่วโมงรวม", H(person.mins), "OT อนุมัติแล้ว", H(otApproved), "ชม.คิดค่าแรง", H(payApproved), "ลืมกดออกงาน", person.noOut || 0, "ไม่มีพิกัด", person.noGps || 0, ""], "kv", 21);
  push([], "spacer", 8);
  push(["รายวัน — เวลาเข้า-ออก และตำแหน่งตอนปั๊ม"], "sec", 22);
  full(R - 1);
  push(["วันที่", "วัน", "เข้า", "ออก", "รวม (ชม.)", "ที่ทำงาน", "งานที่แจ้ง", "พิกัดตอนเข้า", "พิกัดตอนออก", "ห่างจากออฟฟิศ", "แผนที่", "OT วันนี้ (ชม.)", "OT ประเภท / เรื่องที่ทำ"], "head", 28);
  const dayStart = R;
  let alt = false,
    shown = 0;
  (days || []).forEach(d => {
    const rec = recs[d] || null;
    const idx = person.byDay ? person.byDay[d] : null;
    const ots = otByDay[d] || [];
    if (!rec && !idx && !ots.length) return;
    shown += 1;
    const IN = rec && rec.in || null,
      OUT = rec && rec.out || null;
    const otMins = ots.reduce((a2, o) => a2 + (+o.mins || 0), 0);
    const otTxt = ots.map(o => window.tmOtKindOf(o.kind).th + (o.reason ? " — " + o.reason : "") + (o.status === "approved" ? "" : " (" + window.tmOtStatusOf(o.status).th + ")")).join(" · ");
    const place = idx && idx.place || rec && (rec.in && rec.in.place || rec.place) || "";
    const hm = (x, k) => x && x.hm || idx && idx[k] || "";
    push([window.drDateTH(d), TM_DOW_TH[new Date(d + "T00:00:00").getDay()], hm(IN, "in"), hm(OUT, "out"), rec || idx ? H(rec ? window.tmWorkedMins(rec, cfg) : idx && idx.mins || 0) : "", place ? window.tmPlaceOf(place).th : "", rec && rec.jobCode || idx && idx.jobCode || "", window.tmGpsTH(IN), window.tmGpsTH(OUT), window.tmDistTH(window.tmOfficeDist(IN, cfg)), window.tmGpsUrl(IN) ? "เปิดแผนที่" : "", otMins ? H(otMins) : "", otTxt], alt ? "itemAlt" : "item", 19);
    if (window.tmGpsUrl(IN)) links[R - 1 + ":10"] = window.tmGpsUrl(IN);
    alt = !alt;
  });
  if (!shown) {
    push(["เดือนนี้ไม่มีใบลงเวลาเลย"], "muted", 20);
    full(R - 1);
  } else {
    push(["รวมทั้งเดือน", "", "", "", H(person.mins), "", "", "", "", "", "", H(otApproved), "ชั่วโมง OT ที่อนุมัติแล้ว"], "total", 24);
    merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: 3
      }
    });
    merges.push({
      s: {
        r: R - 1,
        c: 5
      },
      e: {
        r: R - 1,
        c: 10
      }
    });
  }
  push([], "spacer", 10);
  push(["ใบขออนุมัติทำงานล่วงเวลา (OT) ในเดือนนี้"], "sec", 22);
  full(R - 1);
  push(["ลำดับ", "วันที่", "ตั้งแต่", "ถึง", "รวม (ชม.)", "ประเภท", "อัตรา", "ชม.คิดค่าแรง", "งาน", "ปฏิบัติหน้าที่", "สถานะในระบบ", "ผู้อนุมัติในระบบ", ""], "head", 28);
  const otStart = R;
  if (!list.length) {
    push(["เดือนนี้ไม่มีใบ OT ที่ส่งขออนุมัติ"], "muted", 20);
    full(R - 1);
  }
  alt = false;
  list.forEach((o, i) => {
    const mins = +o.mins || 0;
    const rt = window.tmOtRate(o, cfg);
    push([i + 1, window.drDateTH(o.date), o.from || "", o.to || "", H(mins), window.tmOtKindOf(o.kind).th, o.parts && o.parts.length ? window.tmOtPartsTH(o.parts) : rt, H(window.tmOtPayMins(o, cfg)), o.jobCode || "—", o.reason || "", window.tmOtStatusOf(o.status).th, o.approverName || "—", ""], alt ? "itemAlt2" : "item2", 19);
    alt = !alt;
  });
  if (list.length) {
    push(["รวมที่อนุมัติแล้วในระบบ", "", "", "", H(otApproved), "ชั่วโมง", "", H(payApproved), "ชม.คิดค่าแรง", "", "", "", ""], "total2", 24);
    merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: 3
      }
    });
    merges.push({
      s: {
        r: R - 1,
        c: 8
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
    push(["ยังรออนุมัติในระบบ", "", "", "", H(otWaiting), "ชั่วโมง", "", "", "ต้องกดอนุมัติในระบบก่อนจึงจะนับเป็นยอดจ่าย", "", "", "", ""], otWaiting ? "warnRow" : "muted2", 22);
    merges.push({
      s: {
        r: R - 1,
        c: 0
      },
      e: {
        r: R - 1,
        c: 3
      }
    });
    merges.push({
      s: {
        r: R - 1,
        c: 8
      },
      e: {
        r: R - 1,
        c: lastC
      }
    });
  }
  push([], "spacer", 14);
  const sign3 = r => {
    merges.push({
      s: {
        r: r,
        c: 0
      },
      e: {
        r: r,
        c: 3
      }
    });
    merges.push({
      s: {
        r: r,
        c: 4
      },
      e: {
        r: r,
        c: 7
      }
    });
    merges.push({
      s: {
        r: r,
        c: 8
      },
      e: {
        r: r,
        c: lastC
      }
    });
  };
  push(["ลงชื่อผู้ปฏิบัติงาน ....................................", "", "", "", "ลงชื่อหัวหน้างานผู้อนุมัติ ....................................", "", "", "", "ลงชื่อฝ่ายบุคคล / ผู้ตรวจสอบ ....................................", "", "", "", ""], "sign", 34);
  sign3(R - 1);
  push(["(" + name + ")", "", "", "", "(....................................)  วันที่ ......./......./.......", "", "", "", "(....................................)  วันที่ ......./......./.......", "", "", "", ""], "signSub", 22);
  sign3(R - 1);
  push([], "spacer", 8);
  push(["พิกัดคือตำแหน่งของ “เครื่องที่กดปั๊ม” ตอนกด ไม่ใช่การยืนยันว่าอยู่ที่ไซต์นั้นจริง — ระบบยังไม่มีพิกัดไซต์ให้เทียบระยะ"], "foot", 16);
  full(R - 1);
  push(["ช่องพิกัดที่ว่างหรือขึ้นเหตุผล แปลว่าจับพิกัดไม่ได้ตอนนั้น ระบบไม่เคยบล็อกการลงเวลาด้วยเหตุนี้"], "foot", 16);
  full(R - 1);
  push([office.lat != null ? "ระยะวัดจากพิกัดออฟฟิศที่ตั้งไว้ " + (office.name ? office.name + " " : "") + (+office.lat).toFixed(6) + ", " + (+office.lng).toFixed(6) + " (รัศมีที่ถือว่าถึงออฟฟิศ " + office.radius + " ม.)" : "ยังไม่ได้ตั้งพิกัดออฟฟิศในระบบ ช่อง “ห่างจากออฟฟิศ” จึงว่างทั้งคอลัมน์"], "foot", 16);
  full(R - 1);
  push(["เวลาในใบ OT เป็นเวลาที่ผู้ขอกรอกเอง ไม่ใช่เวลาที่ระบบจับได้ — เทียบกับตารางรายวันข้างบนได้"], "foot", 16);
  full(R - 1);
  push(["การเซ็นบนกระดาษไม่ได้เปลี่ยนสถานะในระบบ ใบที่ยังรออนุมัติต้องกดอนุมัติในระบบด้วย"], "foot", 16);
  full(R - 1);
  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{
    wch: 14
  }, {
    wch: 5
  }, {
    wch: 8
  }, {
    wch: 8
  }, {
    wch: 10
  }, {
    wch: 11
  }, {
    wch: 13
  }, {
    wch: 19
  }, {
    wch: 19
  }, {
    wch: 14
  }, {
    wch: 11
  }, {
    wch: 13
  }, {
    wch: 40
  }];
  ws["!rows"] = rowsH;
  ws["!freeze"] = {
    xSplit: 1,
    ySplit: dayStart
  };
  const styleCell = (r, c) => {
    const t = meta[r];
    if (t === "spacer") return null;
    const s2 = {
      font: {
        name: FONT,
        sz: 10.5,
        color: {
          rgb: C.text
        }
      },
      alignment: {
        vertical: "center"
      }
    };
    if (t === "title") {
      s2.font = {
        name: FONT,
        sz: 15,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s2.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "subtitle") {
      s2.font = {
        name: FONT,
        sz: 12,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandSoft
        }
      };
      s2.alignment = {
        horizontal: "center",
        vertical: "center"
      };
    } else if (t === "sec") {
      s2.font = {
        name: FONT,
        sz: 11.5,
        bold: true,
        color: {
          rgb: C.brandDk
        }
      };
      s2.alignment = {
        horizontal: "left",
        vertical: "center"
      };
    } else if (t === "kv") {
      s2.border = boxAll;
      if (c % 2 === 0) {
        s2.font = {
          name: FONT,
          sz: 9.5,
          color: {
            rgb: C.sub
          }
        };
        s2.fill = {
          patternType: "solid",
          fgColor: {
            rgb: C.brandSoft
          }
        };
        s2.alignment = {
          horizontal: "right",
          vertical: "center"
        };
      } else {
        s2.font = {
          name: FONT,
          sz: 11.5,
          bold: true,
          color: {
            rgb: C.text
          }
        };
        s2.alignment = {
          horizontal: "center",
          vertical: "center"
        };
        if (c === 3 || c === 5 || c === 7) s2.numFmt = "0.00";
      }
    } else if (t === "head") {
      s2.font = {
        name: FONT,
        sz: 10,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brand
        }
      };
      s2.alignment = {
        horizontal: "center",
        vertical: "center",
        wrapText: true
      };
      s2.border = boxAll;
    } else if (t === "total" || t === "total2") {
      s2.font = {
        name: FONT,
        sz: 11,
        bold: true,
        color: {
          rgb: C.white
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.brandDk
        }
      };
      s2.alignment = {
        horizontal: c <= 3 ? "left" : "center",
        vertical: "center"
      };
      s2.border = boxAll;
      if (c === 4 || t === "total" && c === 11 || t === "total2" && c === 7) s2.numFmt = "0.00";
    } else if (t === "warnRow") {
      s2.font = {
        name: FONT,
        sz: 10.5,
        bold: true,
        color: {
          rgb: C.warnTx
        }
      };
      s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.warn
        }
      };
      s2.alignment = {
        horizontal: c <= 3 ? "left" : "center",
        vertical: "center"
      };
      s2.border = boxAll;
      if (c === 4) s2.numFmt = "0.00";
    } else if (t === "muted" || t === "muted2") {
      s2.font = {
        name: FONT,
        sz: 10.5,
        color: {
          rgb: C.sub
        }
      };
      s2.alignment = {
        horizontal: c <= 3 ? "left" : "center",
        vertical: "center"
      };
      if (t === "muted2") s2.border = boxAll;
      if (t === "muted2" && c === 4) s2.numFmt = "0.00";
    } else if (t === "sign") {
      s2.font = {
        name: FONT,
        sz: 11,
        color: {
          rgb: C.text
        }
      };
      s2.alignment = {
        horizontal: "left",
        vertical: "bottom"
      };
    } else if (t === "signSub") {
      s2.font = {
        name: FONT,
        sz: 10,
        color: {
          rgb: C.sub
        }
      };
      s2.alignment = {
        horizontal: "left",
        vertical: "top"
      };
    } else if (t === "foot") {
      s2.font = {
        name: FONT,
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
    } else if (t === "item" || t === "itemAlt" || t === "item2" || t === "itemAlt2") {
      const two = t === "item2" || t === "itemAlt2";
      if (t === "itemAlt" || t === "itemAlt2") s2.fill = {
        patternType: "solid",
        fgColor: {
          rgb: C.alt
        }
      };
      s2.border = boxAll;
      const wrapCol = two ? 9 : 12;
      if (c === wrapCol) s2.alignment = {
        horizontal: "left",
        vertical: "center",
        wrapText: true
      };else if (c === 0 || !two && (c === 6 || c === 7 || c === 8) || two && c === 8) s2.alignment = {
        horizontal: "left",
        vertical: "center"
      };else {
        s2.alignment = {
          horizontal: "center",
          vertical: "center"
        };
      }
      if (c === 4) s2.numFmt = "0.00";
      if (two && c === 7) s2.numFmt = "0.00";
      if (two && c === 6) s2.numFmt = '0.##" เท่า"';
      if (!two && c === 11 && aoa[r][c]) {
        s2.numFmt = "0.00";
        s2.font = {
          name: FONT,
          sz: 10.5,
          bold: true,
          color: {
            rgb: C.brandDk
          }
        };
      }
      if (!two && (c === 7 || c === 8 || c === 9)) s2.font = {
        name: "Consolas",
        sz: 9.5,
        color: {
          rgb: C.sub
        }
      };
    }
    return s2;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({
        r: r,
        c: c
      });
      const st = styleCell(r, c);
      if (!st) continue;
      if (!ws[ref]) ws[ref] = {
        t: "s",
        v: ""
      };
      ws[ref].s = st;
    }
  }
  Object.keys(links).forEach(k => {
    const rc = k.split(":");
    const ref = X.utils.encode_cell({
      r: +rc[0],
      c: +rc[1]
    });
    if (!ws[ref]) return;
    ws[ref].l = {
      Target: links[k],
      Tooltip: "เปิดตำแหน่งนี้ใน Google Maps"
    };
    ws[ref].s = Object.assign({}, ws[ref].s, {
      font: {
        name: FONT,
        sz: 10,
        bold: true,
        underline: true,
        color: {
          rgb: "1155CC"
        }
      }
    });
  });
  return ws;
}
function TmOtModal({
  rec,
  cfg,
  jobs,
  users,
  role,
  currentUser,
  onSave,
  onMove,
  onDelete,
  onClose
}) {
  const [f, setF] = React.useState(rec);
  React.useEffect(() => {
    setF(rec);
  }, [rec && rec.id]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  const isAdmin = window.usePgAdmin ? window.usePgAdmin() : false;
  if (!f) return null;
  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && f.status === "draft";
  const set = (k, v) => setF(p => {
    let next = Object.assign({}, p, {
      [k]: v
    });
    if (k === "kind") next.rate = window.tmOtRate(v, cfg);
    if (next.status === "draft") next = window.tmOtFill(next, cfg);
    return next;
  });
  const pend = f.status === "draft" || f.status === "sent";
  const cur = pend ? window.tmOtFill(f, cfg) : f;
  const mins = pend ? cur.mins : +f.mins || 0;
  const rate = window.tmOtRate(cur, cfg);
  const span = window.tmSpanMins(f.from, f.to);
  const nexts = window.tmOtNext(f, role, currentUser);
  const why = window.tmOtApproveCheck(f, currentUser, role).why;
  return React.createElement("div", _extends({
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 90,
      background: "rgba(15,23,42,.45)",
      display: "grid",
      placeItems: "center",
      padding: 18
    }
  }, box), React.createElement("div", {
    style: {
      width: "min(620px,100%)",
      maxHeight: "90vh",
      overflow: "auto",
      background: "var(--bg)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      borderRadius: 17,
      padding: 20
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, f.no), React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.tmNameOf(users, f.userId, f.userName))), React.createElement(TmPill, {
    s: f.status
  }), React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: 4
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 18,
    color: "var(--text-3)"
  }))), React.createElement("div", {
    style: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 10
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: f.date,
    disabled: !editable,
    onChange: e => set("date", e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement(window.PgTime, {
    value: f.from,
    disabled: !editable,
    onChange: t => set("from", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E16\u0E36\u0E07"), React.createElement(window.PgTime, {
    value: f.to,
    disabled: !editable,
    onChange: t => set("to", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), React.createElement("select", {
    value: f.kind,
    disabled: !editable,
    onChange: e => set("kind", e.target.value),
    style: TM_IN_W
  }, window.TM_OT_KIND.map(k => React.createElement("option", {
    key: k.key,
    value: k.key
  }, k.th))))), React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OT"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 20,
      fontWeight: 800,
      color: mins ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, window.tmDur(mins)), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ", window.tmDur(span))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, cur.parts && cur.parts.length ? window.tmOtPartsTH(cur.parts) : window.tmRateTH(rate)), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "= ", (Math.round(window.tmOtPayMins(Object.assign({}, cur, {
    mins: mins
  }), cfg) / 60 * 100) / 100).toFixed(2), " \u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07")), React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, window.tmIsWorkday(f.date, cfg) ? "วันทำงาน — นับตามช่วงที่กรอกทั้งช่วง" : "วันหยุด — " + window.tmDur(window.tmWhNorm(cfg).workMins) + " แรก (หักพัก " + window.tmDur(window.tmWhNorm(cfg).lunchMins) + ") ×" + window.tmWhNorm(cfg).otRates.holiday + " · เกินจากนั้น ×" + window.tmWhNorm(cfg).otRates.holidayOt, window.tmWhNorm(cfg).roundMins > 0 ? " · ปัดลงทีละ " + window.tmWhNorm(cfg).roundMins + " นาที" : "", window.tmWhNorm(cfg).minOtMins > 0 ? " · ไม่ถึง " + window.tmWhNorm(cfg).minOtMins + " นาทีไม่นับ" : "")), React.createElement("label", {
    style: {
      marginTop: 12,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07"), React.createElement("select", {
    value: f.jobId || "",
    disabled: !editable,
    onChange: e => {
      const j = (jobs || []).find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        jobId: j ? j.id : null,
        jobCode: j ? j.code : ""
      }));
    },
    style: TM_IN
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E07\u0E32\u0E19 \u2014"), (jobs || []).map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name)))), React.createElement("label", {
    style: {
      marginTop: 10,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E19\u0E2D\u0E01\u0E40\u0E27\u0E25\u0E32"), React.createElement("textarea", {
    value: f.reason || "",
    disabled: !editable,
    rows: 3,
    onChange: e => set("reason", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E17\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E02\u0E49\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49\u0E40\u0E0A\u0E49\u0E32",
    style: Object.assign({}, TM_IN, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("label", {
    style: {
      marginTop: 10,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), editable ? React.createElement("select", {
    value: f.approverId || "",
    onChange: e => {
      const u = (users || []).find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        approverId: u ? u.id : null,
        approverName: u ? u.name : ""
      }));
    },
    style: TM_IN
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 (\u0E40\u0E02\u0E49\u0E32\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07) \u2014"), window.tmOtApprovers(users, {
    id: f.userId
  }).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name))) : React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: f.approverName ? "var(--text-1)" : "#F59E0B",
      fontWeight: 700
    }
  }, f.approverName || "ไม่ได้ระบุคนอนุมัติ — ใบนี้อยู่ในกองกลาง")), editable && !f.approverId && React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: "#F59E0B",
      lineHeight: 1.6
    }
  }, "\u0E2A\u0E48\u0E07\u0E44\u0E14\u0E49\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u0E41\u0E15\u0E48\u0E43\u0E1A\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E01\u0E47\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2B\u0E22\u0E34\u0E1A \u2014 \u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E27\u0E49\u0E43\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E04\u0E49\u0E32\u0E07"), f.cancelledAt && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E42\u0E14\u0E22\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E43\u0E1A \xB7 ", window.drShort(String(f.cancelledAt).slice(0, 10))), f.decidedAt && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, window.tmOtStatusOf(f.status).th, " \u0E42\u0E14\u0E22 ", f.decidedByName || "-", " \xB7 ", window.drShort(String(f.decidedAt).slice(0, 10)), f.decidedNote ? React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, "\u201C", f.decidedNote, "\u201D") : null), React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, editable && React.createElement("button", {
    onClick: () => {
      onSave(cur);
      onClose();
    },
    style: {
      padding: "9px 16px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07"), nexts.map(s => {
    const soft = s.key === "cancelled" || s.key === "draft" && f.status === "sent" && !mine;
    const label = s.key === "sent" ? "ส่งขออนุมัติ" : s.key === "approved" ? "อนุมัติ" : s.key === "rejected" ? "ไม่อนุมัติ" : s.key === "cancelled" ? "ยกเลิกใบนี้" : mine ? "เอากลับมาแก้" : "ตีกลับให้แก้";
    return React.createElement("button", {
      key: s.key,
      onClick: () => {
        onMove(cur, s.key);
        onClose();
      },
      style: {
        padding: "9px 16px",
        borderRadius: "var(--r-chip)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 800,
        border: soft ? "1px solid var(--border-strong)" : "none",
        background: soft ? "var(--surface)" : s.color,
        color: soft ? s.color : "#fff"
      }
    }, label);
  }), f.status === "sent" && !mine && why && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, why), (mine && f.status === "draft" || isAdmin) && onDelete && React.createElement("button", {
    onClick: async () => {
      const ok = await window.askConfirm({
        title: "ลบใบ " + (f.no || "OT") + " ?",
        body: "ลบแล้วกู้คืนไม่ได้",
        ok: "ลบใบนี้",
        danger: true
      });
      if (ok) {
        onDelete(f.id);
        onClose();
      }
    },
    style: {
      marginLeft: "auto",
      padding: "9px 14px",
      borderRadius: "var(--r-chip)",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-red-tx2)"
    }
  }, "\u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49"))));
}
function TmOtRow({
  rec,
  users,
  onOpen
}) {
  const k = window.tmOtKindOf(rec.kind);
  return React.createElement("button", {
    onClick: () => onOpen(rec),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "11px 14px",
      border: "none",
      borderBottom: "1px solid var(--divider)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, rec.no), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.tmNameOf(users, rec.userId, rec.userName)), React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: "var(--r-pill)",
      background: k.color + "1A",
      color: k.color,
      fontSize: 10.5,
      fontWeight: 800
    }
  }, k.th), React.createElement(TmPill, {
    s: rec.status,
    size: "sm"
  }), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.tmDur(rec.mins))), React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, window.drDateTH(rec.date), " \xB7 ", rec.from, "-", rec.to, rec.jobCode ? " · " + rec.jobCode : "", rec.reason ? " · " + rec.reason : ""));
}
function TmOfficeCfg({
  office,
  onChange
}) {
  const o = office || {};
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const set = (k, v) => onChange(Object.assign({}, o, {
    [k]: v
  }));
  const has = o.lat != null && o.lng != null && o.lat !== "" && o.lng !== "";
  const useHere = async () => {
    setBusy(true);
    setErr("");
    const g = await window.captureGps();
    setBusy(false);
    if (!g || g.err) {
      setErr(g && g.msg ? g.msg : "จับพิกัดไม่สำเร็จ");
      return;
    }
    onChange(Object.assign({}, o, {
      lat: g.lat,
      lng: g.lng
    }));
  };
  const numIn = (k, ph) => React.createElement("input", {
    type: "number",
    step: "0.000001",
    value: o[k] == null ? "" : o[k],
    placeholder: ph,
    onChange: e => set(k, e.target.value === "" ? null : +e.target.value),
    style: TM_IN_W
  });
  return React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 10
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E40\u0E23\u0E35\u0E22\u0E01"), React.createElement("input", {
    value: o.name || "",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E43\u0E2B\u0E0D\u0E48",
    maxLength: 60,
    onChange: e => set("name", e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E30\u0E15\u0E34\u0E08\u0E39\u0E14 (lat)"), numIn("lat", "13.736717")), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E2D\u0E07\u0E08\u0E34\u0E08\u0E39\u0E14 (lng)"), numIn("lng", "100.523186")), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E31\u0E28\u0E21\u0E35\u0E17\u0E35\u0E48\u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32\u0E16\u0E36\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28 (\u0E21.)"), React.createElement("input", {
    type: "number",
    min: 20,
    max: 5000,
    step: 10,
    value: o.radius == null ? 150 : o.radius,
    onChange: e => set("radius", +e.target.value),
    style: TM_IN_W
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 9
    }
  }, React.createElement("button", {
    onClick: useHere,
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--text-1)",
      cursor: busy ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 800
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 13
  }), " ", busy ? "กำลังจับพิกัด…" : "ใช้ตำแหน่งที่ยืนอยู่ตอนนี้"), has && React.createElement("a", {
    href: window.tmGpsUrl(o),
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "var(--primary)"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E14\u0E39\u0E43\u0E19\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48 \u2197"), has && React.createElement("button", {
    onClick: () => onChange(Object.assign({}, o, {
      lat: null,
      lng: null
    })),
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--tint-red-tx2)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700
    }
  }, "\u0E25\u0E49\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14"), err && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--tint-red-tx2)"
    }
  }, err)), React.createElement("div", {
    style: {
      marginTop: 11,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      border: "none",
      boxShadow: o.lock ? "inset 0 0 0 1px #F59E0B66" : "var(--shadow-sm)",
      background: o.lock ? "rgba(245,158,11,.07)" : "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => has && set("lock", !o.lock),
    disabled: !has,
    "aria-pressed": !!o.lock,
    title: has ? "" : "ตั้งพิกัดออฟฟิศก่อนถึงจะเปิดล็อกได้",
    style: {
      position: "relative",
      width: 52,
      height: 30,
      borderRadius: "var(--r-pill)",
      flexShrink: 0,
      border: "none",
      boxShadow: o.lock ? "inset 0 0 0 1px #F59E0B" : "var(--shadow-sm)",
      background: !has ? "var(--surface2)" : o.lock ? "#F59E0B" : "var(--surface2)",
      cursor: has ? "pointer" : "not-allowed",
      padding: 0
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: o.lock ? 25 : 3,
      width: 22,
      height: 22,
      borderRadius: "var(--r-pill)",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(8,20,14,.3)",
      transition: "left .15s"
    }
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E25\u0E47\u0E2D\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E2D\u0E19\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 ", o.lock ? "· เปิดอยู่" : "· ปิดอยู่"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, !has ? "ตั้งพิกัดออฟฟิศก่อนถึงจะเปิดได้" : o.lock ? "กดเข้างานได้เฉพาะตอนอยู่ในรัศมี " + (o.radius == null ? 150 : o.radius) + " ม. จากพิกัดนี้" : "กดเข้างานได้จากทุกที่ ระบบบันทึกระยะห่างไว้ให้ดูเฉย ๆ"))), o.lock && React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      lineHeight: 1.75
    }
  }, React.createElement("b", null, "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E39\u0E49\u0E44\u0E27\u0E49"), " \u2014 GPS \u0E43\u0E19\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E04\u0E25\u0E32\u0E14\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E49\u0E2D\u0E22\u0E40\u0E21\u0E15\u0E23 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E21\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E2D\u0E32\u0E08\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E16\u0E49\u0E32\u0E40\u0E08\u0E2D\u0E1A\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E31\u0E28\u0E21\u0E35\u0E41\u0E17\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E17\u0E34\u0E49\u0E07 \xB7 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E08\u0E30\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22", React.createElement("br", null), "\u0E01\u0E32\u0E23", React.createElement("b", null, "\u0E01\u0E14\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E16\u0E39\u0E01\u0E25\u0E47\u0E2D\u0E01"), " \u2014 \u0E04\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E1B\u0E34\u0E14\u0E01\u0E30\u0E44\u0E14\u0E49\u0E40\u0E2A\u0E21\u0E2D \u0E44\u0E21\u0E48\u0E07\u0E31\u0E49\u0E19\u0E08\u0E30\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E01\u0E30\u0E04\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E15\u0E32\u0E21\u0E41\u0E01\u0E49")), React.createElement("div", {
    style: {
      marginTop: 9,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, has ? React.createElement("span", null, "\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48 ", React.createElement("b", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, (+o.lat).toFixed(6), ", ", (+o.lng).toFixed(6)), " ", "\xB7 \u0E1B\u0E31\u0E4A\u0E21\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E31\u0E28\u0E21\u0E35 ", React.createElement("b", null, o.radius == null ? 150 : o.radius, " \u0E21."), " \u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E27\u0E48\u0E32 \u201C\u0E16\u0E36\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u201D") : React.createElement("b", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28 \u2014 \u0E41\u0E1C\u0E48\u0E19\u0E40\u0E27\u0E25\u0E32\u0E08\u0E30\u0E44\u0E21\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E23\u0E30\u0E22\u0E30\u0E2B\u0E48\u0E32\u0E07"), React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21 \u201C\u0E43\u0E0A\u0E49\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E17\u0E35\u0E48\u0E22\u0E37\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u201D \u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E15\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E22\u0E37\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E08\u0E23\u0E34\u0E07 \u2014 \u0E01\u0E14\u0E08\u0E32\u0E01\u0E17\u0E35\u0E48\u0E1A\u0E49\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E08\u0E30\u0E01\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E1A\u0E49\u0E32\u0E19 \u0E42\u0E14\u0E22\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2D\u0E30\u0E44\u0E23\u0E40\u0E15\u0E37\u0E2D\u0E19", React.createElement("br", null), "\u0E1B\u0E01\u0E15\u0E34\u0E23\u0E30\u0E22\u0E30\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E2B\u0E49\u0E04\u0E19\u0E2D\u0E48\u0E32\u0E19\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E40\u0E2D\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E22\u0E39\u0E48\u0E44\u0E01\u0E25 \u0E08\u0E30\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E47\u0E15\u0E48\u0E2D\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14 ", React.createElement("b", null, "\u0E25\u0E47\u0E2D\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14"), " \u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E02\u0E49\u0E32\u0E07\u0E25\u0E48\u0E32\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19", React.createElement("br", null), "\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E04\u0E19\u0E17\u0E35\u0E48\u0E01\u0E14 \u201C\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u201D \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \xB7 \u0E07\u0E32\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E0B\u0E15\u0E4C\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E23\u0E30\u0E1A\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49")));
}
function TmWorkHours({
  cfg,
  onSave
}) {
  const [f, setF] = React.useState(window.tmWhNorm(cfg));
  React.useEffect(() => {
    setF(window.tmWhNorm(cfg));
  }, [cfg]);
  const [hDate, setHDate] = React.useState("");
  const [hName, setHName] = React.useState("");
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 640
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 10
    }
  }, React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement(window.PgTime, {
    value: f.startEarly,
    onChange: t => set("startEarly", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E0A\u0E49\u0E32\u0E2A\u0E38\u0E14"), React.createElement(window.PgTime, {
    value: f.startLate,
    onChange: t => set("startLate", t),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E25\u0E30 (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    step: 30,
    value: f.workMins,
    onChange: e => set("workMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1E\u0E31\u0E01\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    value: f.lunchMins,
    onChange: e => set("lunchMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "OT \u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33\u0E17\u0E35\u0E48\u0E19\u0E31\u0E1A (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    value: f.minOtMins,
    onChange: e => set("minOtMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E31\u0E14\u0E40\u0E28\u0E29 OT \u0E17\u0E35\u0E25\u0E30 (\u0E19\u0E32\u0E17\u0E35)"), React.createElement("input", {
    type: "number",
    min: 0,
    value: f.roundMins,
    onChange: e => set("roundMins", +e.target.value),
    style: TM_IN_W
  })), React.createElement("label", {
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14 OT \u0E17\u0E38\u0E01\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "number",
    min: 0,
    max: 28,
    value: f.cutoffDay,
    onChange: e => set("cutoffDay", +e.target.value),
    style: TM_IN_W
  }))), React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, "\u0E23\u0E2D\u0E1A\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49 ", React.createElement("b", null, window.tmPeriodTH(window.tmPeriodOf(window.drToday(), f))), React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, window.tmWhNorm(f).cutoffDay ? "ใบ OT ของวันที่ " + window.tmWhNorm(f).cutoffDay + " นับเข้ารอบนี้ · วันที่ " + (window.tmWhNorm(f).cutoffDay + 1) + " เป็นต้นไปนับเข้ารอบถัดไป" : "ใส่ 0 = ใช้เดือนปฏิทิน (วันที่ 1 ถึงสิ้นเดือน) · ถ้าฝ่ายบุคคลปิดยอดวันที่ 25 ให้ใส่ 25", React.createElement("br", null), "\u0E15\u0E31\u0E49\u0E07\u0E44\u0E14\u0E49\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 28 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E44\u0E21\u0E48\u0E21\u0E35\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 29-31 \u0E17\u0E38\u0E01\u0E1B\u0E35 \u0E23\u0E2D\u0E1A\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E40\u0E07\u0E35\u0E22\u0E1A \u0E46")), React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, "\u0E40\u0E02\u0E49\u0E32 ", f.startEarly, " \u2192 \u0E40\u0E25\u0E34\u0E01 ", React.createElement("b", null, window.tmWhNorm(f).end), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, " (\u0E17\u0E33\u0E07\u0E32\u0E19 ", window.tmDur(f.workMins), " + \u0E1E\u0E31\u0E01 ", window.tmDur(f.lunchMins), ")"), React.createElement("br", null), "\u0E40\u0E02\u0E49\u0E32 ", f.startLate, " \u2192 \u0E40\u0E25\u0E34\u0E01 ", React.createElement("b", null, window.tmDayWindow({
    in: {
      hm: f.startLate
    }
  }, f).end), React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E14\u0E40\u0E02\u0E49\u0E32\u0E01\u0E48\u0E2D\u0E19 ", f.startEarly, " \u0E44\u0E21\u0E48\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E40\u0E25\u0E34\u0E01\u0E40\u0E23\u0E47\u0E27\u0E02\u0E36\u0E49\u0E19 \xB7 \u0E40\u0E02\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E07 ", f.startLate, " \u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32\u0E2A\u0E32\u0E22\u0E41\u0E25\u0E30\u0E40\u0E27\u0E25\u0E32\u0E40\u0E25\u0E34\u0E01\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E15\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A ", window.tmDur(f.workMins), " \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E16\u0E36\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14")), React.createElement(TmOfficeCfg, {
    office: f.office,
    onChange: o => set("office", o)
  }), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07 OT (\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: 10
    }
  }, window.TM_OT_KIND.map(k => React.createElement("label", {
    key: k.key,
    style: TM_LB
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: k.color
    }
  }, k.th), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement("input", {
    type: "number",
    min: 0,
    max: 10,
    step: 0.5,
    value: (f.otRates || {})[k.key] != null ? (f.otRates || {})[k.key] : "",
    onChange: e => set("otRates", Object.assign({}, f.otRates, {
      [k.key]: e.target.value === "" ? "" : +e.target.value
    })),
    style: Object.assign({}, TM_IN, {
      width: 88
    })
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E40\u0E17\u0E48\u0E32")), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, k.hint)))), React.createElement("div", {
    style: {
      marginTop: 9,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.8
    }
  }, "\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E15\u0E32\u0E21\u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19\u0E44\u0E17\u0E22 (\u0E1E.\u0E23.\u0E1A.\u0E04\u0E38\u0E49\u0E21\u0E04\u0E23\u0E2D\u0E07\u0E41\u0E23\u0E07\u0E07\u0E32\u0E19 \u0E21.61-63) \u2014 \u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19 1.5 \u0E40\u0E17\u0E48\u0E32 \xB7 \u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 2 \u0E40\u0E17\u0E48\u0E32 \xB7 \u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 3 \u0E40\u0E17\u0E48\u0E32", React.createElement("br", null), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u201C\u0E17\u0E33\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u201D \u0E15\u0E31\u0E49\u0E07 2 \u0E40\u0E17\u0E48\u0E32\u0E44\u0E27\u0E49\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E25\u0E39\u0E01\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19 \u2014 \u0E16\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E25\u0E39\u0E01\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E08\u0E48\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01 1 \u0E40\u0E17\u0E48\u0E32 \u0E43\u0E2B\u0E49\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E19 1 \xB7 \u201C\u0E07\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19\u201D \u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E44\u0E27\u0E49\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E32\u0E01 \u0E41\u0E15\u0E48\u0E25\u0E30\u0E17\u0E35\u0E48\u0E15\u0E01\u0E25\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07", React.createElement("br", null), "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E08\u0E48\u0E32\u0E22\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E01\u0E0E\u0E2B\u0E21\u0E32\u0E22\u0E44\u0E14\u0E49 \u0E41\u0E15\u0E48\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E31\u0E19\u0E44\u0E27\u0E49\u0E43\u0E2B\u0E49 \u0E15\u0E31\u0E49\u0E07\u0E40\u0E17\u0E48\u0E32\u0E44\u0E2B\u0E23\u0E48\u0E01\u0E47\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E15\u0E01\u0E25\u0E07\u0E01\u0E31\u0E19\u0E08\u0E23\u0E34\u0E07", React.createElement("br", null), React.createElement("b", null, "\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E41\u0E04\u0E48 \u201C\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u201D (\u0E19\u0E32\u0E17\u0E35\u0E08\u0E23\u0E34\u0E07 \xD7 \u0E15\u0E31\u0E27\u0E04\u0E39\u0E13) \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E04\u0E34\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E07\u0E34\u0E19"), "\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07\u0E23\u0E32\u0E22\u0E04\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49 \u2014 \u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E40\u0E2D\u0E32\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E44\u0E1B\u0E04\u0E39\u0E13\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E04\u0E19\u0E15\u0E48\u0E2D", React.createElement("br", null), "\u0E41\u0E01\u0E49\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E44\u0E21\u0E48\u0E22\u0E49\u0E2D\u0E19\u0E44\u0E1B\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E1A\u0E40\u0E01\u0E48\u0E32 \u0E43\u0E1A\u0E41\u0E15\u0E48\u0E25\u0E30\u0E43\u0E1A\u0E16\u0E48\u0E32\u0E22\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 \u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E31\u0E27\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27"))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, DAYS.map((d, i) => {
    const on = f.days.indexOf(i) >= 0;
    return React.createElement("button", {
      key: i,
      onClick: () => set("days", on ? f.days.filter(x => x !== i) : f.days.concat([i]).sort()),
      style: {
        width: 46,
        padding: "8px 0",
        borderRadius: "var(--r-chip)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 800,
        border: "none",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, d);
  }))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E17\u0E35\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, React.createElement("input", {
    type: "date",
    value: hDate,
    onChange: e => setHDate(e.target.value),
    style: TM_IN
  }), React.createElement("input", {
    value: hName,
    onChange: e => setHName(e.target.value),
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14",
    style: Object.assign({}, TM_IN, {
      flex: 1,
      minWidth: 160
    })
  }), React.createElement("button", {
    disabled: !hDate,
    onClick: () => {
      set("holidays", Object.assign({}, f.holidays, {
        [hDate]: hName || "วันหยุด"
      }));
      setHDate("");
      setHName("");
    },
    style: {
      padding: "9px 15px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: hDate ? "var(--primary)" : "var(--surface3)",
      color: hDate ? "#fff" : "var(--text-3)",
      cursor: hDate ? "pointer" : "default",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800
    }
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21")), Object.keys(f.holidays || {}).sort().map(d => React.createElement("div", {
    key: d,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "7px 11px",
      borderBottom: "1px solid var(--divider)"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, window.drDateTH(d)), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, f.holidays[d]), React.createElement("button", {
    onClick: () => {
      const h = Object.assign({}, f.holidays);
      delete h[d];
      set("holidays", h);
    },
    style: {
      marginLeft: "auto",
      border: "none",
      background: "none",
      cursor: "pointer",
      color: "var(--tint-red-tx2)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u0E25\u0E1A"))), Object.keys(f.holidays || {}).length === 0 && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E1E\u0E34\u0E40\u0E28\u0E29")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E27\u0E31\u0E19\u0E15\u0E31\u0E14\u0E22\u0E2D\u0E14\u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E48\u0E07\u0E23\u0E2D\u0E1A\u0E43\u0E19\u0E41\u0E17\u0E47\u0E1A \u201C\u0E2A\u0E23\u0E38\u0E1B\u0E40\u0E14\u0E37\u0E2D\u0E19\u201D \u0E41\u0E25\u0E30\u0E1A\u0E19\u0E43\u0E1A OT \u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2D\u0E2D\u0E01\u0E44\u0E1B \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E31\u0E27\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27", React.createElement("br", null), "\u0E04\u0E48\u0E32\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13\u0E27\u0E48\u0E32 \u201C\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E21\u0E32\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OT \u0E01\u0E35\u0E48\u0E19\u0E32\u0E17\u0E35\u201D \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E15\u0E2D\u0E1A\u0E41\u0E17\u0E19\u0E43\u0E2B\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E23\u0E32\u0E22\u0E04\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49 \u2014 \u0E01\u0E32\u0E23\u0E40\u0E14\u0E32\u0E41\u0E17\u0E19\u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22\u0E01\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E1A\u0E2D\u0E01\u0E40\u0E25\u0E22", React.createElement("br", null), "\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E44\u0E21\u0E48\u0E22\u0E49\u0E2D\u0E19\u0E44\u0E1B\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E1A\u0E40\u0E01\u0E48\u0E32 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E40\u0E01\u0E47\u0E1A\u0E08\u0E33\u0E19\u0E27\u0E19\u0E19\u0E32\u0E17\u0E35\u0E44\u0E27\u0E49\u0E43\u0E19\u0E15\u0E31\u0E27\u0E43\u0E1A\u0E02\u0E2D\u0E07\u0E21\u0E31\u0E19\u0E40\u0E2D\u0E07"), React.createElement("div", null, React.createElement("button", {
    onClick: () => onSave(f),
    style: {
      padding: "10px 20px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 800
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19")));
}
const tmChip = on => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 13px",
  borderRadius: "var(--r-pill)",
  border: "none",
  boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
  background: on ? "var(--primary-soft)" : "var(--surface)",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 700,
  color: on ? "var(--primary-dark)" : "var(--text-2)"
});
const TM_NAV = Object.assign({}, TM_IN, {
  cursor: "pointer",
  fontWeight: 700
});
const tmBadge = (n, warn) => n > 0 ? React.createElement("span", {
  style: {
    minWidth: 18,
    padding: "1px 6px",
    borderRadius: "var(--r-pill)",
    background: warn ? "#F59E0B" : "var(--primary)",
    color: "#fff",
    fontFamily: "var(--mono)",
    fontSize: 10.5,
    fontWeight: 800,
    textAlign: "center"
  }
}, n) : null;
function TmFacts({
  items
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px 20px",
      padding: "10px 14px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)"
    }
  }, items.filter(Boolean).map((it, i) => React.createElement("span", {
    key: i,
    title: it.hint || "",
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      gap: 5,
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, it.label, React.createElement("b", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 800,
      color: it.color || "var(--text-1)"
    }
  }, it.value), it.unit)));
}
function TmHelp({
  children
}) {
  return React.createElement("details", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontWeight: 700,
      color: "var(--text-2)",
      width: "fit-content"
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E27\u0E34\u0E18\u0E35\u0E04\u0E34\u0E14 / \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, children));
}
function TmDayGrid({
  days,
  byDay
}) {
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: 6,
      maxWidth: 760
    }
  }, TM_WD_TH.map((w, i) => React.createElement("div", {
    key: w,
    style: {
      textAlign: "center",
      padding: "0 0 2px",
      fontSize: 10.5,
      fontWeight: 800,
      color: i === 0 || i === 6 ? "var(--text-3)" : "var(--text-2)"
    }
  }, w)), Array.from({
    length: tmWdOf(days[0])
  }, (_, i) => React.createElement("div", {
    key: "pad" + i
  })), days.map(d => {
    const x = byDay[d];
    const open = x && x.in && !x.out;
    const wk = tmWdOf(d) === 0 || tmWdOf(d) === 6;
    return React.createElement("div", {
      key: d,
      title: d,
      style: {
        minWidth: 0,
        padding: "7px 9px",
        borderRadius: 9,
        minHeight: 58,
        background: wk && !x ? "var(--surface2)" : "var(--surface)",
        border: "none",
        boxShadow: open ? "inset 0 0 0 1px var(--tint-red-bd)" : x ? "var(--shadow-sm)" : "none",
        opacity: x ? 1 : 0.45
      }
    }, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 700
      }
    }, +d.slice(8)), React.createElement("div", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        fontWeight: 700,
        color: open ? "#EF4444" : "var(--text-1)"
      }
    }, x ? (x.in || "—") + " – " + (x.out || "?") : "—"), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, x ? window.tmDur(x.mins) : ""));
  }));
}
function TmMonthAll({
  cfg,
  users,
  jobs,
  otRows,
  byName,
  canAll
}) {
  const [ym, setYm] = React.useState(window.tmYmNow);
  const {
    byDate,
    loading
  } = window.useAttendMonth(canAll ? ym : null);
  const [pick, setPick] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [onlyApproved, setOnlyApproved] = React.useState(false);
  const [paper, setPaper] = React.useState(null);
  const days = React.useMemo(() => window.tmMonthDays(ym), [ym]);
  const cut = window.tmWhNorm(cfg).cutoffDay;
  const period = React.useMemo(() => window.tmPeriodOf(cut ? days[Math.min(cut, days.length) - 1] : days[0], cfg), [days, cfg, cut]);
  const att = React.useMemo(() => canAll ? window.tmMonthRollup(byDate, users, cfg, otRows, ym) : [], [canAll, byDate, users, cfg, otRows, ym]);
  const otPeople = React.useMemo(() => {
    const src = (otRows || []).filter(r => window.tmInPeriod(r && r.date, period) && (!onlyApproved || r.status === "approved"));
    return window.tmOtByPerson(src, users, cfg);
  }, [otRows, period, onlyApproved, users, cfg]);
  const rows = React.useMemo(() => {
    const map = {},
      order = [];
    const get = (id, name) => {
      const k = id || "name:" + name;
      if (!map[k]) {
        map[k] = {
          key: k,
          id: id,
          name: name,
          a: null,
          o: null
        };
        order.push(k);
      }
      return map[k];
    };
    att.forEach(a => {
      get(a.userId, a.name).a = a;
    });
    otPeople.forEach(g => {
      const r = get(g.id, g.name);
      r.o = g;
      if (!r.name) r.name = g.name;
    });
    return order.map(k => map[k]).sort((x, y) => String(x.name).localeCompare(String(y.name), "th"));
  }, [att, otPeople]);
  const tot = rows.reduce((t, r) => ({
    days: t.days + (r.a ? r.a.days : 0),
    mins: t.mins + (r.a ? r.a.mins : 0),
    noOut: t.noOut + (r.a ? r.a.noOut : 0),
    otOk: t.otOk + (r.o ? r.o.minsApproved : 0),
    pay: t.pay + (r.o ? r.o.payApproved : 0),
    wait: t.wait + (r.o ? r.o.minsWaiting : 0)
  }), {
    days: 0,
    mins: 0,
    noOut: 0,
    otOk: 0,
    pay: 0,
    wait: 0
  });
  const hrs = m => !m ? "—" : (Math.round(m / 60 * 100) / 100).toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
  const th = (t, align) => React.createElement("th", {
    key: t,
    style: {
      textAlign: align || "left",
      padding: "10px 12px",
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--text-3)",
      borderBottom: "1px solid var(--divider)",
      whiteSpace: "nowrap"
    }
  }, t);
  const td = (v, o) => React.createElement("td", {
    style: Object.assign({
      padding: "9px 12px",
      textAlign: "center",
      fontFamily: "var(--mono)",
      fontWeight: 700
    }, o)
  }, v);
  const cols = canAll ? 9 : 5;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setYm(window.tmYmShift(ym, -1)),
    style: TM_NAV
  }, "\u2039"), React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)",
      minWidth: 120,
      textAlign: "center"
    }
  }, window.tmYmTH(ym)), React.createElement("button", {
    onClick: () => setYm(window.tmYmShift(ym, 1)),
    style: TM_NAV
  }, "\u203A"), ym !== window.tmYmNow() && React.createElement("button", {
    onClick: () => setYm(window.tmYmNow()),
    style: TM_NAV
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49"), cut ? React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "OT \u0E23\u0E2D\u0E1A ", window.tmPeriodTH(period)) : null, canAll && React.createElement("button", {
    onClick: async () => {
      if (busy) return;
      setBusy(true);
      try {
        await tmExportMonthXlsx(att, days, ym, otRows, users, cfg);
      } finally {
        setBusy(false);
      }
    },
    disabled: busy,
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 15px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: busy ? "var(--text-3)" : "var(--primary)",
      color: "#fff",
      cursor: busy ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 14,
    color: "#fff"
  }), " ", busy ? "กำลังเตรียมไฟล์…" : "ออก Excel ทั้งเดือน")), React.createElement(TmFacts, {
    items: [canAll && {
      label: "วัน-คนที่ลงเวลา",
      value: tot.days,
      unit: "วัน"
    }, canAll && {
      label: "ชั่วโมงทำงาน",
      value: hrs(tot.mins),
      unit: "ชม."
    }, {
      label: "OT อนุมัติ",
      value: hrs(tot.otOk),
      unit: "ชม."
    }, {
      label: "คิดค่าแรง",
      value: hrs(tot.pay),
      unit: "ชม.",
      color: "var(--primary-dark)"
    }, tot.wait > 0 && {
      label: "OT รออนุมัติ",
      value: hrs(tot.wait),
      unit: "ชม.",
      color: "#F59E0B"
    }, canAll && tot.noOut > 0 && {
      label: "ลืมกดออก",
      value: tot.noOut,
      unit: "ใบ",
      color: "#EF4444"
    }]
  }), React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      background: "var(--surface)"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      background: "var(--surface2)"
    }
  }, th("ชื่อ"), canAll && th("วันที่มา", "center"), canAll && th("ชม.ทำงาน", "center"), canAll && th("ลืมออก", "center"), th("OT อนุมัติ", "center"), th("ชม.คิดค่าแรง", "center"), th("OT รออนุมัติ", "center"), canAll && th("", "center"), th("เอกสาร", "right"))), React.createElement("tbody", null, canAll && loading && React.createElement("tr", null, React.createElement("td", {
    colSpan: cols,
    style: {
      padding: 26,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")), !(canAll && loading) && rows.length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: cols,
    style: {
      padding: 26,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49")), !(canAll && loading) && rows.map(r => {
    const a = r.a,
      o = r.o;
    return React.createElement(React.Fragment, {
      key: r.key
    }, React.createElement("tr", {
      style: {
        borderBottom: "1px solid var(--divider)"
      }
    }, React.createElement("td", {
      style: {
        padding: "9px 12px",
        fontWeight: 700,
        color: a && a.days || o ? "var(--text-1)" : "var(--text-3)"
      }
    }, r.name), canAll && td(a && a.days ? a.days : "—"), canAll && td(hrs(a && a.mins)), canAll && td(a && a.noOut ? a.noOut : "—", {
      color: a && a.noOut ? "#EF4444" : "var(--text-3)"
    }), td(hrs(o && o.minsApproved)), td(hrs(o && o.payApproved), {
      fontWeight: 800,
      color: o && o.payApproved ? "var(--primary-dark)" : "var(--text-3)"
    }), td(hrs(o && o.minsWaiting), {
      color: o && o.minsWaiting ? "#F59E0B" : "var(--text-3)"
    }), canAll && React.createElement("td", {
      style: {
        padding: "9px 6px",
        textAlign: "center"
      }
    }, a && a.days > 0 && React.createElement("button", {
      onClick: () => setPick(pick === r.key ? null : r.key),
      style: tmChip(pick === r.key)
    }, pick === r.key ? "ซ่อน" : "รายวัน")), React.createElement("td", {
      style: {
        padding: "9px 12px",
        textAlign: "right"
      }
    }, o && o.rows.length > 0 && React.createElement("button", {
      onClick: () => setPaper(o),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        borderRadius: 9,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap"
      }
    }, React.createElement(Icon, {
      name: "file",
      size: 13,
      color: "#fff"
    }), " \u0E43\u0E1A OT"))), pick === r.key && a && React.createElement("tr", null, React.createElement("td", {
      colSpan: cols,
      style: {
        padding: "10px 13px 14px",
        background: "var(--surface2)",
        borderBottom: "1px solid var(--divider)"
      }
    }, React.createElement(TmDayGrid, {
      days: days,
      byDay: a.byDay
    }))));
  })))), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)",
      cursor: "pointer",
      width: "fit-content"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: onlyApproved,
    onChange: e => setOnlyApproved(e.target.checked),
    style: {
      width: 15,
      height: 15
    }
  }), "\u0E43\u0E1A OT \u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C \u2014 \u0E40\u0E2D\u0E32\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27"), React.createElement(TmHelp, null, React.createElement("b", null, "Excel \u0E17\u0E31\u0E49\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19"), " = \u0E41\u0E1C\u0E48\u0E19\u0E2A\u0E23\u0E38\u0E1B\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E41\u0E1C\u0E48\u0E19 + \u0E41\u0E1C\u0E48\u0E19\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E41\u0E22\u0E01\u0E23\u0E32\u0E22\u0E04\u0E19 (\u0E40\u0E02\u0E49\u0E32 \xB7 \u0E2D\u0E2D\u0E01 \xB7 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \xB7 \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E08\u0E49\u0E07 \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48) \u0E15\u0E48\u0E2D\u0E14\u0E49\u0E27\u0E22\u0E43\u0E1A OT \u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E0B\u0E47\u0E19", React.createElement("br", null), React.createElement("b", null, "\u0E43\u0E1A OT"), " = \u0E43\u0E1A A4 \u0E02\u0E2D\u0E07\u0E04\u0E19\u0E19\u0E31\u0E49\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E1A\u0E15\u0E48\u0E2D\u0E23\u0E2D\u0E1A \u0E43\u0E2B\u0E49\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E0B\u0E47\u0E19 (\u0E1C\u0E39\u0E49\u0E02\u0E2D \xB7 \u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 \u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25) \u2014 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E34\u0E14\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E30 \u0E41\u0E15\u0E48\u0E22\u0E2D\u0E14\u0E41\u0E22\u0E01\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14", React.createElement("br", null), "\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E1B\u0E31\u0E4A\u0E21\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01 \u0E2B\u0E31\u0E01\u0E1E\u0E31\u0E01\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49 \xB7 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E25\u0E37\u0E21\u0E01\u0E14\u0E2D\u0E2D\u0E01\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E28\u0E39\u0E19\u0E22\u0E4C \u0E15\u0E49\u0E2D\u0E07\u0E41\u0E01\u0E49\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E41\u0E17\u0E47\u0E1A \"\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\"", React.createElement("br", null), "\u201C\u0E0A\u0E21.\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u201D = \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 OT \xD7 \u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 (\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14: 8 \u0E0A\u0E21.\u0E41\u0E23\u0E01 \xD7 \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 \u0E2A\u0E48\u0E27\u0E19\u0E40\u0E01\u0E34\u0E19 \xD7 \u0E2D\u0E31\u0E15\u0E23\u0E32\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14) \u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19", React.createElement("br", null), "\u0E23\u0E2D\u0E1A OT ", cut ? "ตัดยอดทุกวันที่ " + cut + " — เดือนนี้นับ " + window.tmPeriodTH(period) : "ใช้เดือนปฏิทิน (ยังไม่ได้ตั้งวันตัดยอดในหน้าตั้งค่า)"), paper && window.TmOtPaper && React.createElement(window.TmOtPaper, {
    person: paper,
    period: period,
    rows: paper.rows,
    jobs: jobs,
    users: users,
    cfg: cfg,
    byName: byName,
    onClose: () => setPaper(null)
  }));
}
function TmRequests({
  cfg,
  users,
  role,
  currentUser,
  ot,
  otVisible,
  lv,
  lvTypes,
  lvQuota,
  onOpenOt,
  onOpenLv,
  otWaiting,
  lvWaiting
}) {
  const uid = (currentUser || {}).id || null;
  const canApprove = window.tmCanOtApprove(role) || window.lvCanApprove(role);
  const canAll = canApprove || window.tmCanAttendAll(role);
  const [scope, setScope] = React.useState(() => otWaiting.length + lvWaiting.length > 0 ? "inbox" : "mine");
  const [kind, setKind] = React.useState("all");
  const [q, setQ] = React.useState("");
  const lvVis = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role), [lv.rows, currentUser, role]);
  const year = +String(window.drToday()).slice(0, 4);
  const myBal = React.useMemo(() => window.lvBalance(lv.rows, lvQuota.map, uid, year, lvTypes), [lv.rows, lvQuota.map, uid, year, lvTypes]);
  const list = React.useMemo(() => {
    const pickOt = scope === "inbox" ? otWaiting : scope === "mine" ? otVisible.filter(r => r.userId === uid) : otVisible;
    const pickLv = scope === "inbox" ? lvWaiting : scope === "mine" ? lvVis.filter(r => r.userId === uid) : lvVis;
    let out = [];
    if (kind !== "lv") out = out.concat(pickOt.map(r => ({
      t: "ot",
      d: r.date,
      r: r
    })));
    if (kind !== "ot") out = out.concat(pickLv.map(r => ({
      t: "lv",
      d: r.from,
      r: r
    })));
    const kw = q.trim().toLowerCase();
    if (kw) out = out.filter(x => (x.t === "ot" ? [x.r.no, x.r.userName, x.r.jobCode, x.r.reason, window.tmOtKindOf(x.r.kind).th] : [x.r.no, x.r.userName, x.r.reason, window.lvTypeOf(lvTypes, x.r.type).th]).some(v => String(v || "").toLowerCase().includes(kw)));
    out.sort((a, b) => String(b.d || "").localeCompare(String(a.d || "")) || String(b.r.createdAt || "").localeCompare(String(a.r.createdAt || "")));
    return out;
  }, [scope, kind, q, otVisible, otWaiting, lvVis, lvWaiting, uid, lvTypes]);
  const SC = (canApprove ? [["inbox", "รอฉันอนุมัติ", otWaiting.length + lvWaiting.length]] : []).concat([["mine", "ของฉัน", 0]]).concat(canAll ? [["all", "ทั้งหมด", 0]] : []);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, SC.map(([k, th, n]) => React.createElement("button", {
    key: k,
    onClick: () => setScope(k),
    style: tmChip(scope === k)
  }, th, tmBadge(n, true))), React.createElement("span", {
    style: {
      width: 1,
      height: 22,
      background: "var(--divider)",
      margin: "0 4px"
    }
  }), [["all", "ทุกชนิด"], ["ot", "OT"], ["lv", "ลา"]].map(([k, th]) => React.createElement("button", {
    key: k,
    onClick: () => setKind(k),
    style: tmChip(kind === k)
  }, th)), React.createElement("div", {
    className: "search-box",
    style: {
      marginLeft: "auto",
      width: "100%",
      maxWidth: 260
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E0A\u0E37\u0E48\u0E2D \xB7 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \xB7 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25"
  }))), scope === "mine" && kind !== "ot" && window.LvBalanceCards && React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E25\u0E32\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19 \u0E1B\u0E35 ", year + 543), React.createElement(window.LvBalanceCards, {
    bal: myBal
  })), React.createElement("div", {
    style: {
      border: "none",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, list.length === 0 ? React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, scope === "inbox" ? "ไม่มีคำขอรอคุณอนุมัติ" : "ยังไม่มีคำขอ") : list.map((x, i) => {
    const ym = String(x.d || "").slice(0, 7);
    const head = i === 0 || String(list[i - 1].d || "").slice(0, 7) !== ym;
    const n = head ? list.filter(y => String(y.d || "").slice(0, 7) === ym).length : 0;
    return React.createElement(React.Fragment, {
      key: x.t + x.r.id
    }, head && React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        background: "var(--surface2)",
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, ym ? window.tmYmTH(ym) : "ไม่ระบุวันที่", React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--text-3)"
      }
    }, n, " \u0E43\u0E1A")), x.t === "ot" ? React.createElement(TmOtRow, {
      rec: x.r,
      users: users,
      onOpen: r => onOpenOt(r.id)
    }) : React.createElement(window.LvRow, {
      rec: x.r,
      users: users,
      types: lvTypes,
      onOpen: r => onOpenLv(r.id)
    }));
  })), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A OT \u0E41\u0E25\u0E30\u0E22\u0E37\u0E48\u0E19\u0E43\u0E1A\u0E25\u0E32\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E43\u0E19\u0E44\u0E25\u0E19\u0E4C \u2014 \u0E01\u0E14\u0E17\u0E35\u0E48\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 \u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E01\u0E49"));
}
function TmSettings({
  wh,
  users,
  role,
  lv,
  lvTp,
  lvQuota
}) {
  const canWh = window.can(role, "manageUsers");
  const canTypes = window.can(role, "manageUsers");
  const canQuota = window.lvCanQuota(role);
  const SUBS = [].concat(canWh ? [["wh", "เวลาทำงาน · วันหยุด · อัตรา OT"]] : []).concat(canTypes ? [["types", "ประเภทการลา"]] : []).concat(canQuota ? [["quota", "ยอดวันลารายคน"]] : []);
  const [sub, setSub] = React.useState(SUBS.length ? SUBS[0][0] : "");
  const [year, setYear] = React.useState(+String(window.drToday()).slice(0, 4));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, SUBS.map(([k, th]) => React.createElement("button", {
    key: k,
    onClick: () => setSub(k),
    style: tmChip(sub === k)
  }, th)), sub === "quota" && React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement("button", {
    onClick: () => setYear(year - 1),
    style: TM_NAV
  }, "\u2039"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 800,
      minWidth: 64,
      textAlign: "center"
    }
  }, "\u0E1B\u0E35 ", year + 543), React.createElement("button", {
    onClick: () => setYear(year + 1),
    style: TM_NAV
  }, "\u203A"))), sub === "wh" && React.createElement(TmWorkHours, {
    cfg: wh.cfg,
    onSave: wh.save
  }), sub === "types" && window.LvTypesEditor && React.createElement(window.LvTypesEditor, {
    types: lvTp.types,
    onSave: lvTp.save
  }), sub === "quota" && window.LvQuotaTable && React.createElement(window.LvQuotaTable, {
    users: (users || []).filter(u => !window.tmIsSysAcct(u)),
    types: lvTp.types,
    rows: lv.rows,
    quota: lvQuota,
    year: year
  }));
}
function AttendView({
  jobs,
  users,
  role,
  currentUser
}) {
  const wh = window.useWorkHours();
  const ot = window.useOtClaims(wh.cfg);
  const lv = window.useLeaves();
  const lvTp = window.useLeaveTypes();
  const lvQuota = window.useLeaveQuota();
  const lvTypes = lvTp.types;
  const [tab, setTab] = React.useState("day");
  const [date, setDate] = React.useState(window.drToday());
  const [open, setOpen] = React.useState(null);
  const [openLv, setOpenLv] = React.useState(null);
  const canAll = window.tmCanAttendAll(role);
  const canApprove = window.tmCanOtApprove(role);
  const uid = (currentUser || {}).id || null;
  const visible = React.useMemo(() => window.tmOtVisible(ot.rows, currentUser, role), [ot.rows, currentUser, role]);
  const otWaiting = React.useMemo(() => visible.filter(r => r.status === "sent" && window.tmOtApproveCheck(r, currentUser, role).ok), [visible, currentUser, role]);
  const lvWaiting = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role).filter(r => r.status === "sent" && window.lvApproveCheck(r, currentUser, role).ok), [lv.rows, currentUser, role]);
  const me = window.useAttend(uid, 30);
  const ymNow = window.tmYmNow();
  const myOtMonth = visible.filter(r => r.userId === uid && r.status === "approved" && String(r.date || "").slice(0, 7) === ymNow).reduce((a, r) => a + (+r.mins || 0), 0);
  const openNew = () => {
    const rec = window.tmOtBlank(currentUser, users, ot.rows, null, wh.cfg);
    ot.save(rec);
    setOpen(rec.id);
    setTab("req");
  };
  const move = (rec, to) => {
    const next = window.tmOtMove(rec, to, currentUser, "");
    if (!next) return;
    ot.save(next);
    const when = window.drDateTH(next.date) + " " + next.from + "-" + next.to;
    if (to === "sent" && next.approverId) {
      window.tmNotify({
        toUserId: next.approverId,
        title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins)
      });
    } else if (to === "sent") {
      window.tmNotify({
        toPerm: "otApprove",
        title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins)
      });
    } else if (to === "approved" || to === "rejected") {
      window.tmNotify({
        toUserId: next.userId,
        title: (to === "approved" ? "อนุมัติ OT แล้ว · " : "ไม่อนุมัติ OT · ") + next.no,
        body: when + " · " + window.tmDur(next.mins) + " · โดย " + ((currentUser || {}).name || "")
      });
    } else if (to === "draft" && rec.status === "sent" && next.userId !== uid) {
      window.tmNotify({
        toUserId: next.userId,
        title: "ตีกลับใบ OT · " + next.no,
        body: when + " · แก้แล้วส่งใหม่ได้ · โดย " + ((currentUser || {}).name || "")
      });
    } else if (to === "cancelled" && rec.status === "sent" && next.approverId) {
      window.tmNotify({
        toUserId: next.approverId,
        title: "ยกเลิกใบขอ OT · " + next.no,
        body: next.userName + " · " + when + " · ไม่ต้องพิจารณาแล้ว"
      });
    }
  };
  const moveLv = (rec, to, note) => {
    const next = window.lvMove(Object.assign({}, rec, {
      days: window.lvCountDays(rec.from, rec.to, rec.part, wh.cfg)
    }), to, currentUser, note || "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(rec, next, currentUser, lvTypes);
  };
  const canSet = window.can(role, "manageUsers") || window.lvCanQuota(role);
  const TABS = [["day", canAll ? "วันนี้" : "เวลาของฉัน", "calendar", 0]].concat([["req", "คำขอ OT · ลา", "list", otWaiting.length + lvWaiting.length]]).concat([["month", "สรุปเดือน · ออกเอกสาร", "file", 0]]).concat(canSet ? [["cfg", "ตั้งค่า", "settings", 0]] : []);
  const cur = (ot.rows || []).find(r => r.id === open) || null;
  const curLv = (lv.rows || []).find(r => r.id === openLv) || null;
  const jobSorted = React.useMemo(() => (jobs || []).slice().sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);
  const t = me.today;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minHeight: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: "8px 18px",
      flexWrap: "wrap",
      alignItems: "center",
      padding: "11px 14px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E04\u0E38\u0E13"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 16,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, t && t.in && t.in.hm ? t.in.hm + " → " + (t.out && t.out.hm || "ยังไม่ออก") : "ยังไม่ได้ลงเวลา"), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "OT \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 ", React.createElement("b", {
    style: {
      fontFamily: "var(--mono)",
      color: "var(--text-1)"
    }
  }, window.tmDur(myOtMonth))), React.createElement("button", {
    onClick: openNew,
    disabled: !window.tmCanOt(role),
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 15px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: window.tmCanOt(role) ? "var(--primary)" : "var(--surface3)",
      color: window.tmCanOt(role) ? "#fff" : "var(--text-3)",
      cursor: window.tmCanOt(role) ? "pointer" : "default",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: window.tmCanOt(role) ? "#fff" : "var(--text-3)"
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A OT")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, TABS.map(([k, th, ic, n]) => React.createElement("button", {
    key: k,
    onClick: () => setTab(k),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 16px",
      borderRadius: "var(--r-pill)",
      border: "none",
      boxShadow: tab === k ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
      background: tab === k ? "var(--primary-soft)" : "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 800,
      color: tab === k ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: ic,
    size: 15,
    color: tab === k ? "var(--primary-dark)" : "var(--text-3)"
  }), " ", th, tmBadge(n, true)))), tab === "day" && (canAll ? React.createElement(TmDaySheet, {
    date: date,
    setDate: setDate,
    cfg: wh.cfg,
    users: users,
    currentUser: currentUser
  }) : React.createElement(TmMyDays, {
    rows: me.rows,
    cfg: wh.cfg
  })), tab === "req" && React.createElement(TmRequests, {
    cfg: wh.cfg,
    users: users,
    role: role,
    currentUser: currentUser,
    ot: ot,
    otVisible: visible,
    lv: lv,
    lvTypes: lvTypes,
    lvQuota: lvQuota,
    otWaiting: otWaiting,
    lvWaiting: lvWaiting,
    onOpenOt: setOpen,
    onOpenLv: setOpenLv
  }), tab === "month" && React.createElement(TmMonthAll, {
    cfg: wh.cfg,
    users: users,
    jobs: jobSorted,
    otRows: canAll ? ot.rows : visible,
    byName: (currentUser || {}).name || "",
    canAll: canAll
  }), tab === "cfg" && canSet && React.createElement(TmSettings, {
    wh: wh,
    users: users,
    role: role,
    lv: lv,
    lvTp: lvTp,
    lvQuota: lvQuota
  }), cur && React.createElement(TmOtModal, {
    rec: cur,
    cfg: wh.cfg,
    jobs: jobSorted,
    users: users,
    role: role,
    currentUser: currentUser,
    onSave: ot.save,
    onMove: move,
    onDelete: ot.remove,
    onClose: () => setOpen(null)
  }), curLv && window.LvModal && React.createElement(window.LvModal, {
    rec: curLv,
    cfg: wh.cfg,
    types: lvTypes,
    users: users,
    rows: lv.rows,
    quota: lvQuota.map,
    role: role,
    currentUser: currentUser,
    onSave: lv.save,
    onMove: moveLv,
    onDelete: lv.remove,
    onClose: () => setOpenLv(null)
  }));
}
function TmMyDays({
  rows,
  cfg
}) {
  return React.createElement("div", {
    style: {
      border: "none",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, (rows || []).length === 0 ? React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32 \u2014 \u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E43\u0E19\u0E44\u0E25\u0E19\u0E4C") : (rows || []).map(r => React.createElement("div", {
    key: r.date,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
      borderBottom: "1px solid var(--divider)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      minWidth: 130
    }
  }, window.drDateTH(r.date, true)), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 700
    }
  }, r.in && r.in.hm || "—", " \u2192 ", r.out && r.out.hm || (r.in ? "ยังไม่ออก" : "—")), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, window.tmDur(window.tmWorkedMins(r, cfg))), r.jobCode && React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, r.jobCode), !(r.in && r.in.lat) && React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11,
      color: "#F59E0B",
      fontWeight: 700
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14"))));
}
Object.assign(window, {
  TM_IN,
  TM_IN_W,
  TM_LB,
  TM_WD_TH,
  tmWdOf,
  AttendView,
  TmDaySheet,
  TmMonthAll,
  TmRequests,
  TmSettings,
  TmDayGrid,
  TmMyDays,
  TmOtModal,
  TmOtRow,
  TmWorkHours,
  TmFacts,
  TmHelp,
  tmExportMonthXlsx,
  tmPersonSheet,
  tmSheetName,
  TmStat,
  TmPill
});
