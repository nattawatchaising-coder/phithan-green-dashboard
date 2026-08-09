function useMobileCal(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = e => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}
const TH_MONTH_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
function calTasksOn(jobs, k) {
  const SF = window.SF;
  const out = [];
  (jobs || []).forEach(j => {
    const s = SF.installDate ? SF.installDate(j) : "";
    if (!s) return;
    const e = SF.installEnd ? SF.installEnd(j) : s;
    if (k < s || k > e) return;
    const cur = SF.STAGES.find(x => x.key === j.stage) || {
      key: j.stage,
      th: j.stage,
      en: "",
      color: "#64748B"
    };
    const kind = s === e ? "single" : k === s ? "start" : k === e ? "end" : "mid";
    const late = j.stage !== "done" && k < SF.TODAY;
    out.push({
      job: j,
      stage: cur,
      kind: kind,
      late: late
    });
  });
  return out;
}
function calGroupByJob(tasks) {
  const m = {};
  const order = [];
  (tasks || []).forEach(t => {
    if (!m[t.job.id]) {
      m[t.job.id] = {
        job: t.job,
        stages: [],
        late: false
      };
      order.push(t.job.id);
    }
    m[t.job.id].stages.push(Object.assign({}, t.stage, {
      kind: t.kind
    }));
    if (t.late) m[t.job.id].late = true;
  });
  return order.map(id => m[id]);
}
function CalendarView({
  jobs,
  onOpen,
  onAddOnDate,
  canAdd,
  onAdvance
}) {
  const isMobile = useMobileCal();
  const [ym, setYm] = React.useState({
    y: 2026,
    m: 5
  });
  const [selDay, setSelDay] = React.useState(() => {
    const t = new Date(window.SF.TODAY + "T00:00:00");
    return t.getFullYear() === 2026 && t.getMonth() === 5 ? t.getDate() : null;
  });
  const first = new Date(ym.y, ym.m, 1);
  const startDow = first.getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const keyOf = d => ym.y + "-" + String(ym.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const tasksOn = d => calTasksOn(jobs, keyOf(d));
  const groupsOn = d => calGroupByJob(tasksOn(d));
  const todayKey = window.SF.TODAY;
  const shift = delta => {
    setSelDay(null);
    setYm(s => {
      const n = new Date(s.y, s.m + delta, 1);
      return {
        y: n.getFullYear(),
        m: n.getMonth()
      };
    });
  };
  if (isMobile) {
    return React.createElement(MobileCalendar, {
      ym: ym,
      cells: cells,
      tasksOn: tasksOn,
      groupsOn: groupsOn,
      keyOf: keyOf,
      todayKey: todayKey,
      shift: shift,
      selDay: selDay,
      setSelDay: setSelDay,
      onOpen: onOpen,
      onAdvance: onAdvance,
      jobs: jobs
    });
  }
  const monthKey = ym.y + "-" + String(ym.m + 1).padStart(2, "0");
  const monthCount = jobs.filter(j => (j.deadline || "").startsWith(monthKey)).length;
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 372px",
      gap: 18,
      alignItems: "start"
    }
  }, React.createElement("div", {
    className: "pnl"
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, TH_MONTH_FULL[ym.m], " ", ym.y + 543), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\xB7 ", monthCount, " \u0E19\u0E31\u0E14")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, React.createElement(NavBtn, {
    dir: "prev",
    onClick: () => shift(-1)
  }), React.createElement(NavBtn, {
    dir: "next",
    onClick: () => shift(1)
  }))), React.createElement(FlowLegend, null), React.createElement("div", {
    style: {
      overflowX: "auto",
      WebkitOverflowScrolling: "touch",
      margin: "0 -4px",
      padding: "0 4px"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      minWidth: 490
    }
  }, window.TH_DAYS.map((d, i) => React.createElement("div", {
    key: d,
    style: {
      textAlign: "center",
      fontSize: 11.5,
      fontWeight: 700,
      color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)",
      paddingBottom: 4
    }
  }, d)), cells.map((d, i) => {
    if (d === null) return React.createElement("div", {
      key: i
    });
    const key = keyOf(d);
    const isToday = key === todayKey;
    const isSel = d === selDay;
    const tasks = tasksOn(d);
    const hasDelayed = tasks.some(t => t.late);
    return React.createElement("button", {
      key: i,
      onClick: () => setSelDay(d),
      title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14",
      style: {
        height: 116,
        borderRadius: 12,
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
        border: isSel ? "2px solid var(--primary)" : "1px solid " + (isToday ? "var(--primary)" : "var(--border)"),
        background: isSel || isToday ? "var(--primary-soft)" : "var(--surface2)",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 5,
        alignSelf: "stretch"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: isToday || isSel ? 800 : 600,
        color: isToday || isSel ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, d), hasDelayed && React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 99,
        background: "#EF4444",
        marginLeft: "auto"
      }
    })), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3,
        overflow: "hidden"
      }
    }, tasks.slice(0, 4).map((t, k2) => {
      const c = t.late ? "#EF4444" : t.stage.color;
      const kindTxt = t.kind === "start" ? " · เริ่ม" : t.kind === "end" ? " · เสร็จ" : "";
      return React.createElement("span", {
        key: t.job.id + t.stage.key + k2,
        title: t.stage.th + kindTxt + " · " + t.job.name,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: c + "1f",
          borderRadius: 6,
          padding: "2px 5px",
          overflow: "hidden"
        }
      }, React.createElement("span", {
        style: {
          width: 7,
          height: 7,
          borderRadius: 99,
          background: c,
          flexShrink: 0
        }
      }), React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 600,
          color: t.late ? "#EF4444" : "var(--text-2)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }, t.job.name.replace("คุณ", "")));
    }), tasks.length > 4 && React.createElement("span", {
      style: {
        fontSize: 9,
        color: "var(--text-3)",
        paddingLeft: 1
      }
    }, "+", tasks.length - 4, " \u0E07\u0E32\u0E19")));
  })))), React.createElement(DaySidebar, {
    day: selDay,
    ym: ym,
    groups: selDay ? groupsOn(selDay) : [],
    todayKey: todayKey,
    keyOf: keyOf,
    onOpen: onOpen,
    onAdvance: onAdvance,
    canAdd: canAdd,
    onAddOnDate: onAddOnDate
  }));
}
function DaySidebar({
  day,
  ym,
  groups,
  todayKey,
  keyOf,
  onOpen,
  onAdvance,
  canAdd,
  onAddOnDate
}) {
  const list = groups || [];
  const isToday = day != null && keyOf(day) === todayKey;
  const dayKey = day != null ? keyOf(day) : "";
  return React.createElement("div", {
    className: "pnl",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      position: "sticky",
      top: 12
    }
  }, day == null ? React.createElement("div", {
    style: {
      padding: "48px 8px",
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: "calendar",
    size: 26,
    color: "var(--text-3)"
  }), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 600,
      marginTop: 8
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E31\u0E19\u0E1A\u0E19\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19"), React.createElement("div", {
    style: {
      fontSize: 12,
      marginTop: 2
    }
  }, "\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E31\u0E49\u0E19")) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, day, " ", TH_MONTH_FULL[ym.m], " ", ym.y + 543), isToday && React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontWeight: 800,
      color: "var(--primary-dark)",
      background: "var(--primary-soft)",
      padding: "2px 7px",
      borderRadius: 99
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, list.length, " \u0E07\u0E32\u0E19")), canAdd && onAddOnDate && React.createElement("button", {
    onClick: () => onAddOnDate(dayKey),
    title: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      flexShrink: 0,
      background: "var(--primary)",
      color: "#fff",
      border: "none",
      borderRadius: 9,
      padding: "8px 11px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "#fff"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 11,
      maxHeight: "66vh",
      overflowY: "auto",
      margin: "0 -4px",
      padding: "0 4px"
    }
  }, list.length === 0 ? React.createElement("div", {
    style: {
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13,
      padding: "26px 0"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49", canAdd && onAddOnDate ? " — กด “เพิ่มงาน”" : "") : list.map(g => React.createElement(window.JobTaskCard, {
    key: g.job.id,
    job: g.job,
    stages: g.stages,
    day: dayKey,
    onOpen: onOpen,
    onAdvance: onAdvance
  })))));
}
function MobileCalendar({
  ym,
  cells,
  tasksOn,
  groupsOn,
  keyOf,
  todayKey,
  shift,
  selDay,
  setSelDay,
  onOpen,
  onAdvance,
  jobs
}) {
  const monthName = TH_MONTH_FULL[ym.m];
  const monthCount = jobs.filter(j => (j.deadline || "").startsWith(ym.y + "-" + String(ym.m + 1).padStart(2, "0"))).length;
  const selGroups = selDay ? groupsOn(selDay) : [];
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 14,
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0,
      whiteSpace: "nowrap"
    }
  }, monthName, " ", ym.y + 543), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, monthCount, " \u0E19\u0E31\u0E14\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement(NavBtn, {
    dir: "prev",
    onClick: () => shift(-1)
  }), React.createElement(NavBtn, {
    dir: "next",
    onClick: () => shift(1)
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 4
    }
  }, window.TH_DAYS.map((d, i) => React.createElement("div", {
    key: d,
    style: {
      textAlign: "center",
      fontSize: 10.5,
      fontWeight: 700,
      color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)"
    }
  }, d))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7,1fr)",
      gap: 4
    }
  }, cells.map((d, i) => {
    if (d === null) return React.createElement("div", {
      key: i
    });
    const tasks = tasksOn(d);
    const has = tasks.length > 0;
    const isToday = keyOf(d) === todayKey;
    const isSel = d === selDay;
    const hasDelayed = tasks.some(t => t.late);
    const border = isSel ? "2px solid var(--primary)" : "1px solid " + (isToday ? "var(--primary)" : "var(--border)");
    return React.createElement("button", {
      key: i,
      onClick: () => has ? setSelDay(isSel ? null : d) : setSelDay(null),
      disabled: !has,
      style: {
        minHeight: 50,
        borderRadius: 9,
        border,
        fontFamily: "inherit",
        background: isSel ? "var(--primary-soft)" : isToday ? "var(--primary-soft)" : "var(--surface2)",
        cursor: has ? "pointer" : "default",
        padding: "5px 0 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 3
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: isToday || isSel ? 800 : 600,
        color: isToday || isSel ? "var(--primary-dark)" : "var(--text-2)",
        lineHeight: 1
      }
    }, d), tasks.length > 0 && React.createElement("span", {
      style: {
        display: "flex",
        gap: 2,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        maxWidth: "100%"
      }
    }, tasks.slice(0, 4).map((t, k) => React.createElement("span", {
      key: k,
      style: {
        width: 6,
        height: 6,
        borderRadius: 2,
        background: t.late ? "#EF4444" : t.stage.color,
        transform: "rotate(45deg)"
      }
    }))));
  })), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      textAlign: "center"
    }
  }, "\u0E41\u0E15\u0E30\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), selDay && React.createElement(React.Fragment, null, React.createElement("div", {
    onClick: () => setSelDay(null),
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.34)",
      backdropFilter: "blur(2px)",
      zIndex: 88
    }
  }), React.createElement("div", {
    style: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 89,
      background: "var(--bg)",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      boxShadow: "0 -10px 40px rgba(8,20,14,.22)",
      maxHeight: "62dvh",
      display: "flex",
      flexDirection: "column",
      animation: "sheetUp .26s cubic-bezier(.3,.9,.3,1)"
    }
  }, React.createElement("div", {
    style: {
      padding: "10px 0 4px",
      display: "flex",
      justifyContent: "center",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 99,
      background: "var(--border-strong)"
    }
  })), React.createElement("div", {
    style: {
      padding: "6px 20px 12px",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, selDay, " ", TH_MONTH_FULL[ym.m], " ", ym.y + 543), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, selGroups.length, " \u0E07\u0E32\u0E19")), React.createElement("button", {
    onClick: () => setSelDay(null),
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 17
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: "12px 16px",
      paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, selGroups.length === 0 && React.createElement("div", {
    style: {
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13,
      padding: "20px 0"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), selGroups.map(g => React.createElement(window.JobTaskCard, {
    key: g.job.id,
    job: g.job,
    stages: g.stages,
    day: keyOf(selDay),
    onOpen: jb => {
      setSelDay(null);
      onOpen(jb);
    },
    onAdvance: onAdvance
  }))))));
}
function FlowLegend() {
  const SF = window.SF;
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 16,
      padding: "10px 14px",
      background: "var(--surface2)",
      borderRadius: 12,
      border: "1px solid var(--border)",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-2)",
      display: "flex",
      alignItems: "center",
      gap: 6,
      letterSpacing: ".03em"
    }
  }, React.createElement(Icon, {
    name: "flow",
    size: 14,
    color: "var(--primary)"
  }), " Flow \u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19:"), SF.STAGES.map((s, i) => React.createElement("span", {
    key: s.key,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      background: s.color
    }
  }), i + 1, ". ", s.th)));
}
function NavBtn({
  dir,
  onClick
}) {
  return React.createElement("button", {
    onClick: onClick,
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 17,
    style: {
      transform: dir === "prev" ? "rotate(180deg)" : "none"
    }
  }));
}
function MapView({
  jobs,
  onOpen
}) {
  const isMobile = useMobileCal();
  const mapDiv = React.useRef(null);
  const mapObj = React.useRef(null);
  const layer = React.useRef(null);
  const LATLNG = window.SF.PROVINCE_LATLNG;
  const byProvince = React.useMemo(() => {
    const m = {};
    jobs.forEach(j => {
      (m[j.province] = m[j.province] || []).push(j);
    });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [jobs]);
  const latlngOf = React.useCallback(j => {
    const base = LATLNG[j.province] || [13.7, 100.6];
    const seed = parseInt((j.code || "").replace(/\D/g, ""), 10) || 0;
    const dlat = (seed % 7 - 3) * 0.018;
    const dlng = (seed * 3 % 7 - 3) * 0.018;
    return [base[0] + dlat, base[1] + dlng];
  }, [LATLNG]);
  const [openProv, setOpenProv] = React.useState(null);
  const flyToProv = React.useCallback(prov => {
    const ll = LATLNG[prov];
    if (ll && mapObj.current) mapObj.current.flyTo(ll, 10, {
      duration: 0.7
    });
  }, [LATLNG]);
  const focusJob = React.useCallback(j => {
    if (mapObj.current) mapObj.current.flyTo(latlngOf(j), 12, {
      duration: 0.7
    });
    onOpen(j);
  }, [latlngOf, onOpen]);
  React.useEffect(() => {
    if (!window.L || mapObj.current || !mapDiv.current) return;
    const map = window.L.map(mapDiv.current, {
      scrollWheelZoom: true,
      zoomControl: true
    }).setView([14.2, 100.6], 6);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    layer.current = window.L.layerGroup().addTo(map);
    mapObj.current = map;
    setTimeout(() => map.invalidateSize(), 250);
    return () => {
      map.remove();
      mapObj.current = null;
      layer.current = null;
    };
  }, []);
  React.useEffect(() => {
    const map = mapObj.current;
    if (!map || !layer.current) return;
    layer.current.clearLayers();
    const pts = [];
    jobs.forEach(j => {
      const ll = latlngOf(j);
      pts.push(ll);
      const color = j.problem ? "#EF4444" : stageOf(j.stage).color;
      const marker = window.L.circleMarker(ll, {
        radius: 9,
        color: "#fff",
        weight: 2.5,
        fillColor: color,
        fillOpacity: 1
      });
      marker.bindTooltip(j.name + " · " + j.kw + "kW · " + stageOf(j.stage).th, {
        direction: "top",
        offset: [0, -6]
      });
      marker.on("click", () => onOpen(j));
      marker.addTo(layer.current);
    });
    if (pts.length) {
      try {
        map.fitBounds(pts, {
          padding: [50, 50],
          maxZoom: 11
        });
      } catch (e) {}
    }
    setTimeout(() => map.invalidateSize(), 120);
  }, [jobs, latlngOf, onOpen]);
  React.useEffect(() => {
    if (mapObj.current) setTimeout(() => mapObj.current.invalidateSize(), 220);
  }, [isMobile]);
  return React.createElement("div", {
    style: isMobile ? {
      display: "flex",
      flexDirection: "column",
      gap: 14
    } : {
      display: "grid",
      gridTemplateColumns: "1.7fr 1fr",
      gap: 18,
      flex: 1,
      minHeight: 0
    }
  }, React.createElement("div", {
    className: "pnl",
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement(PanelTitle, {
    icon: "map",
    iconColor: "var(--primary)",
    title: "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07",
    sub: "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E08\u0E23\u0E34\u0E07 \xB7 \u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19/\u0E0B\u0E39\u0E21\u0E44\u0E14\u0E49 \xB7 \u0E04\u0E25\u0E34\u0E01\u0E2B\u0E21\u0E38\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E07\u0E32\u0E19"
  }), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
      margin: "12px 0 4px"
    }
  }, window.SF.STAGES.map(s => React.createElement("span", {
    key: s.key,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: s.color,
      border: "1.5px solid #fff",
      boxShadow: "0 0 0 1px " + s.color
    }
  }), s.th)), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      fontWeight: 600,
      color: "#EF4444"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: "#EF4444"
    }
  }), " \u0E15\u0E34\u0E14\u0E1B\u0E31\u0E0D\u0E2B\u0E32")), React.createElement("div", {
    ref: mapDiv,
    style: {
      flex: isMobile ? "none" : 1,
      height: isMobile ? 320 : "auto",
      minHeight: isMobile ? 320 : 460,
      borderRadius: 14,
      overflow: "hidden",
      marginTop: 10,
      border: "1px solid var(--border)",
      zIndex: 0
    }
  })), React.createElement("div", {
    className: "pnl",
    style: {
      display: "flex",
      flexDirection: "column",
      minHeight: isMobile ? "auto" : 0
    }
  }, React.createElement(PanelTitle, {
    icon: "pin",
    title: "\u0E07\u0E32\u0E19\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14",
    sub: "แตะจังหวัดเพื่อโฟกัสบนแผนที่ · " + byProvince.length + " จังหวัด"
  }), React.createElement("div", {
    style: isMobile ? {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10
    } : {
      marginTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflowY: "auto",
      flex: 1,
      minHeight: 0
    }
  }, byProvince.map(([prov, list]) => {
    const open = openProv === prov;
    const problems = list.filter(j => j.problem || j.delayed).length;
    return React.createElement("div", {
      key: prov,
      style: {
        border: "1px solid " + (open ? "var(--primary)" : "var(--border)"),
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color .15s",
        flexShrink: 0
      }
    }, React.createElement("button", {
      onClick: () => {
        setOpenProv(open ? null : prov);
        flyToProv(prov);
      },
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 6,
        padding: "11px 13px",
        background: open ? "var(--primary-soft)" : "var(--surface2)",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        flex: 1
      }
    }, React.createElement(Icon, {
      name: "chevronRight",
      size: 15,
      color: "var(--text-3)",
      style: {
        transform: open ? "rotate(90deg)" : "none",
        transition: "transform .18s",
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: open ? "var(--primary-dark)" : "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0
      }
    }, prov), problems > 0 && React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "#EF4444",
        background: "var(--tint-red-bg2)",
        padding: "1px 6px",
        borderRadius: 99,
        flexShrink: 0
      }
    }, problems, "\u26A0")), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-2)",
        flexShrink: 0,
        whiteSpace: "nowrap"
      }
    }, list.length, " \u0E07\u0E32\u0E19")), open && React.createElement("div", {
      style: {
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        borderTop: "1px solid var(--border)"
      }
    }, list.map(j => React.createElement("button", {
      key: j.id,
      onClick: () => focusJob(j),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 8px",
        background: "none",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        width: "100%",
        textAlign: "left"
      },
      onMouseEnter: e => e.currentTarget.style.background = "var(--surface2)",
      onMouseLeave: e => e.currentTarget.style.background = "none"
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: j.problem ? "#EF4444" : stageOf(j.stage).color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, j.name), React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, stageOf(j.stage).th)), React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        fontFamily: "var(--mono)",
        flexShrink: 0
      }
    }, j.kw, "kW")))));
  }))));
}
Object.assign(window, {
  CalendarView,
  MapView
});