function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TM_IN = {
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none"
};
function TmPill({
  s,
  size
}) {
  const st = window.tmOtStatusOf(s);
  return React.createElement("span", {
    style: {
      padding: size === "sm" ? "2px 8px" : "3px 10px",
      borderRadius: 99,
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
      borderRadius: 13,
      border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
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
  users
}) {
  const day = window.useAttendDay(date);
  const holiday = window.tmIsHoliday(date, cfg);
  const workday = window.tmIsWorkday(date, cfg);
  const missing = React.useMemo(() => {
    if (!workday) return [];
    const have = {};
    (day.rows || []).forEach(r => {
      have[r.userId] = 1;
    });
    return (users || []).filter(u => u && u.active !== false && window.can(window.userRoles(u), "attend") && !have[u.id]);
  }, [day.rows, users, workday]);
  const totalMins = (day.rows || []).reduce((a, r) => a + (+r.mins || 0), 0);
  const noGps = (day.rows || []).filter(r => !r.gps).length;
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
    style: Object.assign({}, TM_IN, {
      cursor: "pointer",
      fontWeight: 700
    })
  }, "\u2039 \u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"), React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value || window.drToday()),
    style: TM_IN
  }), React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, 1)),
    style: Object.assign({}, TM_IN, {
      cursor: "pointer",
      fontWeight: 700
    })
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \u203A"), React.createElement("button", {
    onClick: () => setDate(window.drToday()),
    style: Object.assign({}, TM_IN, {
      cursor: "pointer",
      fontWeight: 700
    })
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.drDateTH(date, true)), holiday ? React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: 99,
      background: "var(--tint-red-bg)",
      color: "var(--tint-red-tx)",
      fontSize: 11.5,
      fontWeight: 800
    }
  }, "\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14 \xB7 ", window.tmWhNorm(cfg).holidays[date]) : !workday ? React.createElement("span", {
    style: {
      padding: "3px 10px",
      borderRadius: 99,
      background: "var(--surface3)",
      color: "var(--text-2)",
      fontSize: 11.5,
      fontWeight: 800
    }
  }, "\u0E19\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19") : null), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement(TmStat, {
    label: "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E25\u0E49\u0E27",
    value: (day.rows || []).length,
    unit: "\u0E04\u0E19"
  }), React.createElement(TmStat, {
    label: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32",
    value: missing.length,
    unit: "\u0E04\u0E19",
    color: missing.length ? "#F59E0B" : "var(--text-1)",
    hint: workday ? "" : "วันนี้ไม่ใช่วันทำงานมาตรฐาน"
  }), React.createElement(TmStat, {
    label: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19",
    value: stillIn,
    unit: "\u0E04\u0E19",
    color: stillIn ? "#EF4444" : "var(--text-1)",
    hint: stillIn ? "อาจลืมกดออก — ทักถามก่อนหักเวลา" : ""
  }), React.createElement(TmStat, {
    label: "\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E23\u0E27\u0E21",
    value: Math.round(totalMins / 60),
    unit: "\u0E0A\u0E21.",
    hint: noGps ? noGps + " ใบไม่มีพิกัด" : "ทุกใบมีพิกัด"
  })), React.createElement("div", {
    style: {
      overflowX: "auto",
      border: "1px solid var(--border)",
      borderRadius: 13,
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
  }, ["ชื่อ", "เข้า", "ออก", "ชั่วโมง", "งานที่แจ้ง", "พิกัด"].map((h, i) => React.createElement("th", {
    key: h,
    style: {
      textAlign: i >= 1 && i <= 3 ? "center" : "left",
      padding: "10px 13px",
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--text-3)",
      borderBottom: "1px solid var(--border)",
      whiteSpace: "nowrap"
    }
  }, h)))), React.createElement("tbody", null, day.loading && React.createElement("tr", null, React.createElement("td", {
    colSpan: 6,
    style: {
      padding: 26,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")), !day.loading && (day.rows || []).length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: 6,
    style: {
      padding: 26,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E04\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49")), (day.rows || []).map(r => React.createElement("tr", {
    key: r.userId,
    style: {
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("td", {
    style: {
      padding: "9px 13px",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, r.name || r.userId), React.createElement("td", {
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
  }, r.jobCode || "—"), React.createElement("td", {
    style: {
      padding: "9px 13px"
    }
  }, r.gps ? React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#10B981",
      fontWeight: 700
    }
  }, "\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14") : React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "#F59E0B",
      fontWeight: 700
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14")))), missing.map(u => React.createElement("tr", {
    key: u.id,
    style: {
      borderBottom: "1px solid var(--border)",
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
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32")))))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E0A\u0E48\u0E2D\u0E07 \u201C\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E41\u0E08\u0E49\u0E07\u201D \u0E04\u0E37\u0E2D\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E2D\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E27\u0E48\u0E32\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E44\u0E0B\u0E15\u0E4C\u0E19\u0E31\u0E49\u0E19\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E08\u0E36\u0E07\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E23\u0E30\u0E22\u0E30\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", React.createElement("br", null), "\u201C\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14\u201D \u0E40\u0E01\u0E34\u0E14\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E08\u0E32\u0E01\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07 \u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E44\u0E21\u0E48\u0E16\u0E36\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2D\u0E32\u0E04\u0E32\u0E23 \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E1A\u0E25\u0E47\u0E2D\u0E01\u0E01\u0E32\u0E23\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E14\u0E49\u0E27\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E19\u0E35\u0E49"));
}
function TmOtModal({
  rec,
  cfg,
  jobs,
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
  if (!f) return null;
  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && f.status === "draft";
  const set = (k, v) => setF(p => {
    const next = Object.assign({}, p, {
      [k]: v
    });
    next.mins = window.tmOtMinutes(next.date, next.from, next.to, cfg);
    return next;
  });
  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg);
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
      background: "var(--surface)",
      border: "1px solid var(--border)",
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
  }, f.userName)), React.createElement(TmPill, {
    s: f.status
  }), React.createElement("button", {
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
    style: {
      display: "grid",
      gap: 4
    }
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
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), React.createElement("input", {
    type: "time",
    value: f.from,
    disabled: !editable,
    onChange: e => set("from", e.target.value),
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E16\u0E36\u0E07"), React.createElement("input", {
    type: "time",
    value: f.to,
    disabled: !editable,
    onChange: e => set("to", e.target.value),
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
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
    style: TM_IN
  }, window.TM_OT_KIND.map(k => React.createElement("option", {
    key: k.key,
    value: k.key
  }, k.th))))), React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
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
      marginTop: 5,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, window.tmIsWorkday(f.date, cfg) ? "วันทำงานปกติ — ตัดช่วงที่ทับเวลางาน " + window.tmWhNorm(cfg).start + "-" + window.tmWhNorm(cfg).end + " ออกแล้ว" : "นอกวันทำงาน — นับทั้งช่วง", window.tmWhNorm(cfg).roundMins > 0 ? " · ปัดลงทีละ " + window.tmWhNorm(cfg).roundMins + " นาที" : "", window.tmWhNorm(cfg).minOtMins > 0 ? " · ไม่ถึง " + window.tmWhNorm(cfg).minOtMins + " นาทีไม่นับ" : "")), React.createElement("label", {
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
  })), f.approverName && React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E48\u0E07\u0E16\u0E36\u0E07 ", f.approverName), f.decidedAt && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 11,
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
      onSave(Object.assign({}, f, {
        mins
      }));
      onClose();
    },
    style: {
      padding: "9px 16px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07"), nexts.map(s => React.createElement("button", {
    key: s.key,
    onClick: () => {
      onMove(Object.assign({}, f, {
        mins
      }), s.key);
      onClose();
    },
    style: {
      padding: "9px 16px",
      borderRadius: 10,
      border: "none",
      background: s.color,
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800
    }
  }, s.key === "sent" ? "ส่งขออนุมัติ" : s.key === "approved" ? "อนุมัติ" : s.key === "rejected" ? "ไม่อนุมัติ" : "เอากลับมาแก้")), f.status === "sent" && !mine && why && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, why), mine && f.status === "draft" && onDelete && React.createElement("button", {
    onClick: () => {
      onDelete(f.id);
      onClose();
    },
    style: {
      marginLeft: "auto",
      padding: "9px 14px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, "\u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49"))));
}
function TmOtRow({
  rec,
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
      borderBottom: "1px solid var(--border)",
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
  }, rec.userName), React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: 99,
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
    style: {
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("input", {
    type: "time",
    value: f.start,
    onChange: e => set("start", e.target.value),
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E34\u0E01\u0E07\u0E32\u0E19"), React.createElement("input", {
    type: "time",
    value: f.end,
    onChange: e => set("end", e.target.value),
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
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
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
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
    style: TM_IN
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
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
    style: TM_IN
  }))), React.createElement("div", null, React.createElement("div", {
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
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 800,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
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
      borderRadius: 10,
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
      borderBottom: "1px solid var(--border)"
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
      color: "#EF4444",
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
  }, "\u0E04\u0E48\u0E32\u0E1E\u0E27\u0E01\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13\u0E27\u0E48\u0E32 \u201C\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E21\u0E32\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OT \u0E01\u0E35\u0E48\u0E19\u0E32\u0E17\u0E35\u201D \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E04\u0E34\u0E14\u0E04\u0E48\u0E32\u0E15\u0E2D\u0E1A\u0E41\u0E17\u0E19\u0E43\u0E2B\u0E49 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E23\u0E32\u0E22\u0E04\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E19\u0E35\u0E49 \u2014 \u0E01\u0E32\u0E23\u0E40\u0E14\u0E32\u0E41\u0E17\u0E19\u0E1D\u0E48\u0E32\u0E22\u0E1A\u0E38\u0E04\u0E04\u0E25\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22\u0E01\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E1A\u0E2D\u0E01\u0E40\u0E25\u0E22", React.createElement("br", null), "\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E44\u0E21\u0E48\u0E22\u0E49\u0E2D\u0E19\u0E44\u0E1B\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E43\u0E1A\u0E40\u0E01\u0E48\u0E32 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27\u0E40\u0E01\u0E47\u0E1A\u0E08\u0E33\u0E19\u0E27\u0E19\u0E19\u0E32\u0E17\u0E35\u0E44\u0E27\u0E49\u0E43\u0E19\u0E15\u0E31\u0E27\u0E43\u0E1A\u0E02\u0E2D\u0E07\u0E21\u0E31\u0E19\u0E40\u0E2D\u0E07"), React.createElement("div", null, React.createElement("button", {
    onClick: () => onSave(f),
    style: {
      padding: "10px 20px",
      borderRadius: 11,
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
function AttendView({
  jobs,
  users,
  role,
  currentUser
}) {
  const wh = window.useWorkHours();
  const ot = window.useOtClaims();
  const [tab, setTab] = React.useState("day");
  const [date, setDate] = React.useState(window.drToday());
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");
  const canAll = window.tmCanAttendAll(role);
  const canApprove = window.tmCanOtApprove(role);
  const uid = (currentUser || {}).id || null;
  const visible = React.useMemo(() => window.tmOtVisible(ot.rows, currentUser, role), [ot.rows, currentUser, role]);
  const roll = React.useMemo(() => window.tmOtRollup(visible, currentUser, role), [visible, currentUser, role]);
  const me = window.useAttend(uid, 30);
  const list = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    let out = visible;
    if (tab === "mine") out = out.filter(r => r.userId === uid);else if (tab === "inbox") out = out.filter(r => r.status === "sent" && window.tmOtApproveCheck(r, currentUser, role).ok);
    if (kw) out = out.filter(r => [r.no, r.userName, r.jobCode, r.reason, window.tmOtKindOf(r.kind).th].some(v => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [visible, tab, q, uid, currentUser, role]);
  const openNew = () => {
    const rec = window.tmOtBlank(currentUser, users, ot.rows, null, wh.cfg);
    ot.save(rec);
    setOpen(rec.id);
    setTab("mine");
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
    }
  };
  const TABS = [["day", "แผ่นเวลารายวัน", "calendar", 0]].concat([["mine", "ใบ OT ของฉัน", "pen", roll.mineOpen]]).concat(canApprove ? [["inbox", "รอฉันอนุมัติ", "check", roll.waitingMine]] : []).concat(canApprove || canAll ? [["all", "ใบ OT ทั้งหมด", "list", 0]] : []).concat(window.can(role, "manageUsers") ? [["cfg", "ตั้งค่าเวลาทำงาน", "settings", 0]] : []);
  const cur = (ot.rows || []).find(r => r.id === open) || null;
  const jobSorted = React.useMemo(() => (jobs || []).slice().sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);
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
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement(TmStat, {
    label: "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E04\u0E38\u0E13\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32",
    value: me.today && me.today.in && me.today.in.hm ? me.today.in.hm : "—",
    hint: me.today && me.today.out && me.today.out.hm ? "ออกงาน " + me.today.out.hm : me.today && me.today.in ? "ยังไม่ได้ลงเวลาออก" : "ลงเวลาได้จากแอปในไลน์"
  }), React.createElement(TmStat, {
    label: "\u0E43\u0E1A OT \u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E08\u0E1A",
    value: roll.mineOpen,
    unit: "\u0E43\u0E1A",
    on: tab === "mine",
    onClick: () => setTab("mine")
  }), canApprove && React.createElement(TmStat, {
    label: "\u0E23\u0E2D\u0E09\u0E31\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    value: roll.waitingMine,
    unit: "\u0E43\u0E1A",
    color: roll.waitingMine ? "#F59E0B" : "var(--text-1)",
    hint: "รออนุมัติทั้งระบบ " + roll.sent + " ใบ",
    on: tab === "inbox",
    onClick: () => setTab("inbox")
  }), React.createElement(TmStat, {
    label: "OT \u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27",
    value: Math.round(roll.minsApproved / 60),
    unit: "\u0E0A\u0E21.",
    hint: roll.rejected ? "ไม่อนุมัติ " + roll.rejected + " ใบ" : ""
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E02\u0E2D\u0E17\u0E33\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"), React.createElement("button", {
    onClick: openNew,
    disabled: !window.tmCanOt(role),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 15px",
      borderRadius: 10,
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
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A OT"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E08\u0E32\u0E01\u0E41\u0E2D\u0E1B\u0E43\u0E19\u0E44\u0E25\u0E19\u0E4C\u0E44\u0E14\u0E49\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E01\u0E31\u0E19")), React.createElement("div", {
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
      gap: 6,
      padding: "8px 14px",
      borderRadius: 99,
      border: "1px solid " + (tab === k ? "var(--primary)" : "var(--border-strong)"),
      background: tab === k ? "var(--primary-soft)" : "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: tab === k ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: ic,
    size: 14,
    color: tab === k ? "var(--primary-dark)" : "var(--text-3)"
  }), " ", th, n > 0 && React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11,
      fontWeight: 800
    }
  }, n)))), tab === "day" && (canAll ? React.createElement(TmDaySheet, {
    date: date,
    setDate: setDate,
    cfg: wh.cfg,
    users: users
  }) : React.createElement(TmMyDays, {
    rows: me.rows,
    cfg: wh.cfg
  })), tab === "cfg" && React.createElement(TmWorkHours, {
    cfg: wh.cfg,
    onSave: wh.save
  }), (tab === "mine" || tab === "inbox" || tab === "all") && React.createElement(React.Fragment, null, React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A \xB7 \u0E0A\u0E37\u0E48\u0E2D \xB7 \u0E23\u0E2B\u0E31\u0E2A\u0E07\u0E32\u0E19 \xB7 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25",
    style: Object.assign({}, TM_IN, {
      width: "100%",
      maxWidth: 420
    })
  }), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
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
  }, tab === "inbox" ? "ไม่มีใบรอคุณอนุมัติ" : "ยังไม่มีใบ OT") : list.map(r => React.createElement(TmOtRow, {
    key: r.id,
    rec: r,
    onOpen: x => setOpen(x.id)
  })))), cur && React.createElement(TmOtModal, {
    rec: cur,
    cfg: wh.cfg,
    jobs: jobSorted,
    role: role,
    currentUser: currentUser,
    onSave: ot.save,
    onMove: move,
    onDelete: ot.remove,
    onClose: () => setOpen(null)
  }));
}
function TmMyDays({
  rows,
  cfg
}) {
  return React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
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
      borderBottom: "1px solid var(--border)"
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
  AttendView,
  TmDaySheet,
  TmMyDays,
  TmOtModal,
  TmOtRow,
  TmWorkHours,
  TmStat,
  TmPill,
  TM_IN
});