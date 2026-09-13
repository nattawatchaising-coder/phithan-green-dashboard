const LN_TAB = [{
  key: "jobs",
  th: "งาน",
  icon: "wrench"
}, {
  key: "fix",
  th: "ซ่อม",
  icon: "alert"
}, {
  key: "time",
  th: "เวลา",
  icon: "clock"
}, {
  key: "daily",
  th: "รายงาน",
  icon: "pen"
}, {
  key: "ec",
  th: "เบิก",
  icon: "wallet"
}, {
  key: "bell",
  th: "เตือน",
  icon: "bell"
}, {
  key: "me",
  th: "ฉัน",
  icon: "user"
}];
const LN_START = (() => {
  let t = "";
  try {
    t = new URLSearchParams(window.location.search).get("tab") || "";
  } catch (e) {
    t = "";
  }
  if (t === "ot") return {
    tab: "time",
    ot: true
  };
  return {
    tab: LN_TAB.some(x => x.key === t) ? t : "jobs",
    ot: false
  };
})();
function LnHead({
  tab,
  setTab,
  unread
}) {
  return React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      paddingTop: "env(safe-area-inset-top, 0px)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 16px 9px"
    }
  }, window.BrandLockup ? React.createElement(window.BrandLockup, {
    size: 19
  }) : React.createElement("b", null, "flash+solar")), React.createElement("div", {
    style: {
      display: "flex"
    }
  }, LN_TAB.map(t => {
    const on = tab === t.key;
    return React.createElement("button", {
      key: t.key,
      onClick: () => setTab(t.key),
      style: {
        flex: 1,
        position: "relative",
        padding: "8px 0 9px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 10.5,
        fontWeight: 700,
        color: on ? "var(--primary-dark)" : "var(--text-3)",
        boxShadow: on ? "inset 0 -2.5px 0 var(--primary)" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3
      }
    }, React.createElement("span", {
      style: {
        position: "relative",
        lineHeight: 0
      }
    }, React.createElement(Icon, {
      name: t.icon,
      size: 18,
      color: on ? "var(--primary-dark)" : "var(--text-3)"
    }), t.key === "bell" && unread > 0 && React.createElement("span", {
      style: {
        position: "absolute",
        top: -6,
        right: -11,
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        borderRadius: 99,
        background: "#D93025",
        color: "#fff",
        fontSize: 10,
        fontWeight: 800,
        display: "inline-grid",
        placeItems: "center"
      }
    }, unread)), t.th);
  })));
}
function LnJobRow({
  job,
  onOpen
}) {
  const st = (window.SF.STAGES || []).find(s => s.key === job.stage) || {};
  return React.createElement("button", {
    onClick: () => onOpen(job),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "13px 16px",
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
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, job.code), React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: 99,
      background: st.soft || "var(--surface3)",
      color: st.fg || "var(--text-2)",
      fontSize: 10.5,
      fontWeight: 800
    }
  }, st.th || job.stage), job.delayed && React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: 99,
      background: "var(--tint-red-bg)",
      color: "var(--tint-red-tx)",
      fontSize: 10.5,
      fontWeight: 800
    }
  }, "\u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32")), React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, job.name || "—"), React.createElement("div", {
    style: {
      marginTop: 2,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, [job.province, job.kw ? job.kw + " kW" : "", job.brand].filter(Boolean).join(" · ")));
}
function LnJobSheet({
  job,
  techs,
  onClose
}) {
  if (!job) return null;
  const tech = (techs || []).find(t => t.id === job.tech);
  const rows = [["ลูกค้า", job.name], ["ที่อยู่", job.address], ["จังหวัด", job.province], ["ประเภท", ((window.SF.TYPES || []).find(x => x.key === job.type) || {}).th || job.type], ["ขนาดระบบ", job.kw ? job.kw + " kW" + (job.panels ? " · " + job.panels + " แผง" : "") : ""], ["ยี่ห้อ", job.brand], ["ช่างผู้รับผิดชอบ", tech ? tech.name : ""], ["วิศวกรผู้รับผิดชอบ", job.eeName], ["วันติดตั้ง", job.startDate ? job.deadline && job.deadline !== job.startDate ? window.drShort(job.startDate) + " – " + window.drDateTH(job.deadline) : window.drDateTH(job.startDate) : ""]].filter(r => r[1]);
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60,
      background: "rgba(15,43,51,.42)",
      display: "flex",
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxHeight: "88dvh",
      overflowY: "auto",
      background: "var(--surface)",
      borderRadius: "18px 18px 0 0",
      padding: "16px 18px",
      paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))"
    }
  }, React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 99,
      background: "var(--border-strong)",
      margin: "0 auto 14px"
    }
  }), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, job.code), React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: "var(--text-1)",
      marginBottom: 12
    }
  }, job.name || "—"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    }
  }, job.phone && React.createElement("a", {
    href: "tel:" + String(job.phone).replace(/[^0-9+]/g, ""),
    style: {
      flex: 1,
      textAlign: "center",
      padding: "11px 0",
      borderRadius: 11,
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontSize: 13.5,
      textDecoration: "none"
    }
  }, "\u0E42\u0E17\u0E23\u0E2B\u0E32\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), job.map && React.createElement("a", {
    href: job.map,
    target: "_blank",
    rel: "noopener noreferrer",
    style: {
      flex: 1,
      textAlign: "center",
      padding: "11px 0",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-1)",
      fontWeight: 700,
      fontSize: 13.5,
      textDecoration: "none"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48")), rows.map(([k, v]) => React.createElement("div", {
    key: k,
    style: {
      display: "flex",
      gap: 12,
      padding: "9px 0",
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      width: 116,
      flexShrink: 0,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, k), React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 13.5,
      color: "var(--text-1)",
      fontWeight: 600,
      wordBreak: "break-word"
    }
  }, v))), React.createElement("button", {
    onClick: onClose,
    style: {
      marginTop: 16,
      width: "100%",
      padding: "13px 0",
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14")));
}
const LN_BTN = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 15,
  border: "none",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer"
};
const LN_FIELD = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface2)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none"
};
function LnClock({
  me,
  cfg,
  jobs,
  onAskOt
}) {
  const at = window.useAttend(me ? me.id : null, 14);
  const writer = window.useAttendWriter(me, cfg);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [jobId, setJobId] = React.useState("");
  const [place, setPlace] = React.useState("site");
  const [jobType, setJobType] = React.useState("all");
  const [nowHM, setNowHM] = React.useState(window.tmNowHM);
  React.useEffect(() => {
    const t = setInterval(() => setNowHM(window.tmNowHM()), 20000);
    return () => clearInterval(t);
  }, []);
  const today = at.today;
  const open = window.tmOpen(today);
  const worked = window.tmWorkedMins(today, cfg, open ? nowHM : null);
  const win = window.tmDayWindow(today, cfg);
  const earned = window.tmOtEarned(today, cfg);
  const left = Math.max(0, window.tmWhNorm(cfg).workMins - worked);
  const closed = !open && !!(today && today.in && today.in.hm);
  const shifts = (today && Array.isArray(today.extra) ? today.extra : []).filter(x => x && x.in && x.in.hm);
  const jobPick = React.useMemo(() => (jobs || []).filter(j => jobType === "all" || j.type === jobType).slice(0, 80), [jobs, jobType]);
  React.useEffect(() => {
    if (today && today.jobId) setJobId(today.jobId);
    if (today && today.place) setPlace(today.place);
  }, [today && today.jobId, today && today.place]);
  const go = async redo => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const j = place === "office" ? null : (jobs || []).find(x => x.id === jobId);
    const which = redo ? "out" : open ? "out" : "in";
    const res = await writer.punch(which, {
      src: "liff",
      place: place,
      jobId: j ? j.id : null,
      jobCode: j ? j.code : "",
      redo: !!redo
    });
    setBusy(false);
    if (!res.ok) {
      setMsg({
        bad: true,
        text: res.why
      });
      return;
    }
    const p = res.punch || {};
    const head = redo ? "แก้เวลาออกงานเป็น " : open ? "ลงเวลาออกงาน " : "ลงเวลาเข้างาน ";
    setMsg({
      bad: false,
      text: head + p.hm + (p.redoOf ? " (จากเดิม " + p.redoOf + ")" : "") + (p.err ? " · ไม่ได้พิกัด บันทึกไว้แล้วว่าไม่มี" : " · บันทึกพิกัดแล้ว")
    });
  };
  return React.createElement("div", {
    style: {
      padding: 18
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 16px",
      borderRadius: 17,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, window.drDateTH(window.drToday())), React.createElement("div", {
    style: {
      marginTop: 9,
      display: "flex",
      justifyContent: "center",
      gap: 26
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 26,
      fontWeight: 800,
      color: today && today.in ? "var(--text-1)" : "var(--text-3)"
    }
  }, today && today.in && today.in.hm || "--:--")), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 26,
      fontWeight: 800,
      color: today && today.out ? "var(--text-1)" : "var(--text-3)"
    }
  }, today && today.out && today.out.hm || "--:--"))), today && today.in && React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 30,
      fontWeight: 800,
      color: "var(--text-1)",
      lineHeight: 1.1
    }
  }, window.tmDur(worked)), React.createElement("div", {
    style: {
      marginTop: 2,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, open ? "ทำงานแล้ว · กำลังนับอยู่" : "ทำงานทั้งวัน"), React.createElement("div", {
    style: {
      marginTop: 7,
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, open && left > 0 ? React.createElement(React.Fragment, null, "\u0E04\u0E23\u0E1A ", window.tmDur(window.tmWhNorm(cfg).workMins), " \u0E40\u0E27\u0E25\u0E32 ", React.createElement("b", null, win.end), " \xB7 \u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E2D\u0E35\u0E01 ", window.tmDur(left)) : React.createElement(React.Fragment, null, "\u0E04\u0E23\u0E1A\u0E40\u0E27\u0E25\u0E32\u0E07\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48 ", React.createElement("b", null, win.end))), open && left === 0 && React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E40\u0E25\u0E22\u0E40\u0E27\u0E25\u0E32\u0E07\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34\u0E21\u0E32\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E01\u0E14\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E25\u0E49\u0E27\u0E04\u0E48\u0E2D\u0E22\u0E02\u0E2D OT \u0E15\u0E32\u0E21\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E01\u0E14\u0E08\u0E23\u0E34\u0E07"), shifts.length > 0 && React.createElement("div", {
    style: {
      marginTop: 7,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E21\u0E35\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E43\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01 ", shifts.length, " \u0E0A\u0E48\u0E27\u0E07 \xB7", " ", React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, shifts.map(x => x.in.hm + "–" + (x.out && x.out.hm || "?")).join(", ")), " ", "\u2014 \u0E23\u0E27\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07\u0E02\u0E49\u0E32\u0E07\u0E1A\u0E19\u0E41\u0E25\u0E49\u0E27 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E08\u0E49\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28"), win.late && React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11.5,
      color: "#F59E0B",
      fontWeight: 700
    }
  }, "\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E2B\u0E25\u0E31\u0E07 ", window.tmWhNorm(cfg).startLate, " \xB7 \u0E2A\u0E32\u0E22 ", window.tmDur(win.lateMins), " \u2014 \u0E40\u0E27\u0E25\u0E32\u0E40\u0E25\u0E34\u0E01\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E15\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07"))), earned.mins > 0 && React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "13px 15px",
      borderRadius: 14,
      background: "var(--tint-amber-bg)",
      border: "1px solid #F59E0B44"
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
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E17\u0E33\u0E40\u0E01\u0E34\u0E19\u0E40\u0E27\u0E25\u0E32\u0E07\u0E32\u0E19\u0E41\u0E25\u0E49\u0E27"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 19,
      fontWeight: 800,
      color: "var(--tint-amber-tx)"
    }
  }, window.tmDur(earned.mins))), React.createElement("div", {
    style: {
      marginTop: 3,
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--tint-amber-tx)",
      opacity: .85
    }
  }, earned.from, " \u2013 ", earned.to), onAskOt && React.createElement("button", {
    onClick: () => onAskOt(Object.assign({}, earned, {
      win: win
    })),
    style: {
      marginTop: 10,
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      border: "none",
      background: "#F59E0B",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "\u0E02\u0E2D OT \u0E0A\u0E48\u0E27\u0E07\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      marginTop: 7,
      fontSize: 11,
      color: "var(--tint-amber-tx)",
      opacity: .8,
      lineHeight: 1.6
    }
  }, "\u0E08\u0E30\u0E02\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E02\u0E2D\u0E01\u0E47\u0E44\u0E14\u0E49 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 \u2014 \u0E02\u0E2D\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E17\u0E33\u0E40\u0E01\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E25\u0E07\u0E44\u0E27\u0E49")), React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 5
    }
  }, "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E44\u0E2B\u0E19"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 9
    }
  }, window.TM_PLACE.map(p => React.createElement("button", {
    key: p.key,
    onClick: () => setPlace(p.key),
    style: {
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: "13px 10px",
      borderRadius: 13,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 800,
      border: "1px solid " + (place === p.key ? "var(--primary)" : "var(--border-strong)"),
      background: place === p.key ? "var(--primary-soft)" : "var(--surface)",
      color: place === p.key ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: p.icon,
    size: 16,
    color: place === p.key ? "var(--primary-dark)" : "var(--text-3)"
  }), p.th)))), place !== "office" && React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 5
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E44\u0E1B\u0E07\u0E32\u0E19\u0E44\u0E2B\u0E19 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginBottom: 7
    }
  }, [{
    key: "all",
    th: "ทั้งหมด"
  }].concat(window.SF.TYPES).map(t => React.createElement("button", {
    key: t.key,
    onClick: () => {
      setJobType(t.key);
      const cur = (jobs || []).find(x => x.id === jobId);
      if (cur && t.key !== "all" && cur.type !== t.key) setJobId("");
    },
    style: {
      flex: 1,
      padding: "8px 6px",
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      border: "1px solid " + (jobType === t.key ? "var(--primary)" : "var(--border-strong)"),
      background: jobType === t.key ? "var(--primary-soft)" : "var(--surface)",
      color: jobType === t.key ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, t.th))), React.createElement("select", {
    value: jobId,
    onChange: e => setJobId(e.target.value),
    style: LN_FIELD
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), jobPick.map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name))), jobPick.length === 0 && React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E35\u0E49\u0E43\u0E19\u0E21\u0E37\u0E2D \u2014 \u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E07\u0E32\u0E19\u0E01\u0E47\u0E44\u0E14\u0E49")), !closed && React.createElement("button", {
    onClick: () => go(false),
    disabled: busy,
    style: Object.assign({}, LN_BTN, {
      marginTop: 14,
      background: busy ? "var(--surface3)" : open ? "#EF4444" : "var(--primary)",
      color: busy ? "var(--text-3)" : "#fff"
    })
  }, busy ? "กำลังบันทึก…" : open ? "ลงเวลาออกงาน" : "ลงเวลาเข้างาน"), closed && React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => go(true),
    disabled: busy,
    style: Object.assign({}, LN_BTN, {
      marginTop: 14,
      background: busy ? "var(--surface3)" : "var(--surface)",
      color: busy ? "var(--text-3)" : "var(--text-1)",
      border: "1px solid var(--border-strong)"
    })
  }, busy ? "กำลังบันทึก…" : "กดออกงานใหม่ · ทับเวลาเดิม"), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7,
      textAlign: "center"
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E01\u0E14\u0E2D\u0E2D\u0E01\u0E40\u0E23\u0E47\u0E27\u0E44\u0E1B\u0E01\u0E14\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u0E44\u0E21\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E2D\u0E1A\u0E43\u0E2B\u0E21\u0E48", React.createElement("br", null), "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E15\u0E49\u0E2D\u0E07\u0E41\u0E08\u0E49\u0E07\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28")), msg && React.createElement("div", {
    style: {
      marginTop: 11,
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      textAlign: "center",
      background: msg.bad ? "var(--tint-amber-bg)" : "var(--primary-soft)",
      color: msg.bad ? "var(--tint-amber-tx)" : "var(--primary-dark)"
    }
  }, msg.text), React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7,
      textAlign: "center"
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E2D\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E2D\u0E19\u0E01\u0E14 \u2014 \u0E16\u0E49\u0E32\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E01\u0E47\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E43\u0E2B\u0E49\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49\u0E27\u0E48\u0E32\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E34\u0E01\u0E31\u0E14", React.createElement("br", null), "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E41\u0E08\u0E49\u0E07\u0E40\u0E2D\u0E07 \u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E30\u0E22\u0E30\u0E17\u0E32\u0E07"), (at.rows || []).length > 0 && React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)",
      marginBottom: 7
    }
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07"), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, (at.rows || []).slice(0, 10).map(r => React.createElement("div", {
    key: r.date,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 13px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      minWidth: 84
    }
  }, window.drShort(r.date)), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, r.in && r.in.hm || "—", " \u2192 ", r.out && r.out.hm || "—"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, window.tmDur(window.tmWorkedMins(r, cfg))))))));
}
function LnOtForm({
  me,
  users,
  cfg,
  jobs,
  otStore,
  limit,
  onClose
}) {
  const locked = !!(limit && limit.has && limit.mins > 0);
  const [f, setF] = React.useState(() => {
    const b = window.tmOtBlank(me, users, otStore.rows, null, cfg);
    if (!locked) return b;
    return Object.assign(b, {
      date: limit.date || b.date,
      from: limit.from,
      to: limit.to,
      kind: window.tmOtKindGuess(limit.date || b.date, limit.from, cfg)
    });
  });
  const [sending, setSending] = React.useState(false);
  const set = (k, v) => setF(p => {
    const n = Object.assign({}, p, {
      [k]: v
    });
    if (k === "date" || k === "from") n.kind = window.tmOtKindGuess(n.date, n.from, cfg);
    return n;
  });
  const win = locked && f.date === limit.date ? limit.win : null;
  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg, win);
  const inLimit = window.tmOtInLimit(f.date, f.from, f.to, limit);
  const approvers = React.useMemo(() => window.tmOtApprovers(users, me), [users, me]);
  const ready = mins > 0 && inLimit && !!f.reason.trim();
  const send = () => {
    if (!ready || sending) return;
    setSending(true);
    const j = (jobs || []).find(x => x.id === f.jobId);
    const rec = window.tmOtMove(Object.assign({}, f, {
      mins,
      jobCode: j ? j.code : ""
    }), "sent", me, "");
    otStore.save(rec);
    const when = window.drShort(rec.date) + " " + rec.from + "-" + rec.to;
    if (rec.approverId) {
      window.tmNotify({
        toUserId: rec.approverId,
        title: "ขออนุมัติ OT · " + rec.no,
        body: rec.userName + " · " + when + " · " + window.tmDur(rec.mins)
      });
    } else {
      window.tmNotify({
        toPerm: "otApprove",
        title: "ขออนุมัติ OT · " + rec.no,
        body: rec.userName + " · " + when + " · " + window.tmDur(rec.mins)
      });
    }
    onClose();
  };
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60,
      background: "var(--bg)",
      overflowY: "auto",
      overflowX: "hidden"
    }
  }, React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      paddingTop: "calc(13px + env(safe-area-inset-top, 0px))"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: 4,
      lineHeight: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 20,
    color: "var(--text-2)"
  })), React.createElement("b", {
    style: {
      fontSize: 15.5,
      color: "var(--text-1)"
    }
  }, "\u0E02\u0E2D\u0E17\u0E33\u0E07\u0E32\u0E19\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, f.no)), React.createElement("div", {
    style: {
      padding: 18,
      display: "grid",
      gap: 13
    }
  }, React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
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
    disabled: locked,
    onChange: e => set("date", e.target.value),
    style: LN_FIELD
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: 11
    }
  }, React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
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
    min: locked ? limit.lo : undefined,
    max: locked ? limit.hi : undefined,
    onChange: e => set("from", e.target.value),
    style: LN_FIELD
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
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
    min: locked ? limit.lo : undefined,
    max: locked ? limit.hi : undefined,
    onChange: e => set("to", e.target.value),
    style: LN_FIELD
  }))), locked && React.createElement("div", {
    style: {
      padding: "10px 13px",
      borderRadius: 12,
      fontSize: 11.5,
      lineHeight: 1.7,
      background: inLimit ? "var(--surface2)" : "var(--tint-amber-bg)",
      color: inLimit ? "var(--text-3)" : "var(--tint-amber-tx)"
    }
  }, inLimit ? "ขอได้เฉพาะช่วงที่อยู่ที่ทำงานจริงวันนี้ — ลงเวลา " + limit.lo + " ถึง " + limit.hi : "ช่วงนี้อยู่นอกเวลาที่ลงไว้ (" + limit.lo + " – " + limit.hi + ") ขอไม่ได้"), React.createElement("div", {
    style: {
      padding: "12px 14px",
      borderRadius: 13,
      background: "var(--surface)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
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
  }, window.tmDur(mins))), React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, window.tmOtKindOf(f.kind).th, window.tmIsWorkday(f.date, cfg) ? " · ตัดช่วงที่ทับเวลางานปกติออกแล้ว" : " · นอกวันทำงาน นับทั้งช่วง")), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)"), React.createElement("select", {
    value: f.jobId || "",
    onChange: e => set("jobId", e.target.value || null),
    style: LN_FIELD
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), (jobs || []).slice(0, 80).map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name)))), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), React.createElement("select", {
    value: f.approverId || "",
    onChange: e => {
      const u = approvers.find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        approverId: u ? u.id : null,
        approverName: u ? u.name : ""
      }));
    },
    style: LN_FIELD
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E43\u0E04\u0E23\u0E01\u0E47\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C \u2014"), approvers.map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name)))), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25"), React.createElement("textarea", {
    rows: 3,
    value: f.reason,
    onChange: e => set("reason", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E1B\u0E34\u0E14\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E49\u0E17\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E02\u0E49\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49\u0E40\u0E0A\u0E49\u0E32",
    style: Object.assign({}, LN_FIELD, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("button", {
    onClick: send,
    disabled: !ready || sending,
    style: Object.assign({}, LN_BTN, {
      background: ready && !sending ? "var(--primary)" : "var(--surface3)",
      color: ready && !sending ? "#fff" : "var(--text-3)"
    })
  }, sending ? "กำลังส่ง…" : "ส่งขออนุมัติ"), mins <= 0 && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      textAlign: "center",
      lineHeight: 1.7
    }
  }, "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19 OT \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E40\u0E27\u0E25\u0E32\u0E07\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34 \u0E41\u0E25\u0E30\u0E19\u0E32\u0E19\u0E1E\u0E2D\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49", win ? " (วันนี้เวลางานปกติจบ " + win.end + " เพราะเข้างาน " + limit.lo + ")" : ""), mins > 0 && !f.reason.trim() && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      textAlign: "center",
      lineHeight: 1.7
    }
  }, "\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25 \u2014 \u0E04\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E08\u0E32\u0E01\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E19\u0E35\u0E49\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27")));
}
function LnTimeTab({
  me,
  users,
  role,
  jobs,
  startOt
}) {
  const wh = window.useWorkHours();
  const otStore = window.useOtClaims();
  const [form, setForm] = React.useState(!!startOt && window.tmCanOt(role));
  const [limit, setLimit] = React.useState(null);
  const closeForm = () => {
    setForm(false);
    setLimit(null);
  };
  const cancelOt = r => {
    const next = window.tmOtMove(r, "cancelled", me, "");
    if (!next) return;
    otStore.save(next);
    if (r.status === "sent" && r.approverId) {
      window.tmNotify({
        toUserId: r.approverId,
        title: "ยกเลิกใบขอ OT · " + r.no,
        body: r.userName + " · " + window.drShort(r.date) + " " + r.from + "-" + r.to + " · ไม่ต้องพิจารณาแล้ว"
      });
    }
  };
  const myOt = React.useMemo(() => (otStore.rows || []).filter(r => r && r.userId === (me || {}).id), [otStore.rows, me]);
  return React.createElement(React.Fragment, null, window.tmCanAttend(role) ? React.createElement(LnClock, {
    me: me,
    cfg: wh.cfg,
    jobs: jobs,
    onAskOt: window.tmCanOt(role) ? lim => {
      setLimit(lim);
      setForm(true);
    } : null
  }) : React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32"), window.tmCanOt(role) && React.createElement("div", {
    style: {
      padding: "0 18px 28px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginBottom: 8
    }
  }, React.createElement("b", {
    style: {
      fontSize: 13,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E02\u0E2D OT \u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("button", {
    onClick: () => {
      setLimit(null);
      setForm(true);
    },
    style: {
      marginLeft: "auto",
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "+ \u0E02\u0E2D OT")), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, myOt.length === 0 ? React.createElement("div", {
    style: {
      padding: 22,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E02\u0E2D OT") : myOt.slice(0, 15).map(r => {
    const st = window.tmOtStatusOf(r.status);
    return React.createElement("div", {
      key: r.id,
      style: {
        padding: "11px 13px",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, window.drShort(r.date), " \xB7 ", r.from, "-", r.to), React.createElement("span", {
      style: {
        padding: "2px 8px",
        borderRadius: 99,
        background: st.color + "1A",
        color: st.color,
        fontSize: 10.5,
        fontWeight: 800
      }
    }, st.th), React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, window.tmDur(r.mins))), r.approverName && React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E2A\u0E48\u0E07\u0E16\u0E36\u0E07 ", r.approverName), r.reason && React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, r.reason), r.decidedNote && React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 11.5,
        color: st.color
      }
    }, "\u201C", r.decidedNote, "\u201D"), window.tmOtOpen(r) && React.createElement("button", {
      onClick: () => cancelOt(r),
      style: {
        marginTop: 7,
        padding: "7px 13px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E19\u0E35\u0E49"));
  }))), form && React.createElement(LnOtForm, {
    me: me,
    users: users,
    cfg: wh.cfg,
    jobs: jobs,
    otStore: otStore,
    limit: limit,
    onClose: closeForm
  }));
}
function LnPick({
  items,
  value,
  onPick
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, items.map(it => {
    const on = value === it.key;
    return React.createElement("button", {
      key: it.key,
      onClick: () => onPick(it.key),
      style: {
        padding: "7px 13px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface2)",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, it.th, it.n != null ? " " + it.n : "");
  }));
}
function LnFixTab({
  me,
  role
}) {
  const store = window.useOmTickets ? window.useOmTickets() : {
    tickets: [],
    loading: false,
    save: null
  };
  const [filter, setFilter] = React.useState("open");
  const [open, setOpen] = React.useState(null);
  const today = window.drToday();
  const canAll = window.can(role, "om");
  const uid = (me || {}).id || null;
  const tid = (me || {}).techId || null;
  const visible = React.useMemo(() => {
    const all = store.tickets || [];
    if (filter === "all" && canAll) return all;
    return all.filter(t => t && (uid && t.assigneeId === uid || tid && t.techId === tid));
  }, [store.tickets, filter, canAll, uid, tid]);
  const list = React.useMemo(() => {
    if (filter === "done") return visible.filter(t => !window.omTicketOpen(t));
    if (filter === "open") return visible.filter(t => window.omTicketOpen(t));
    return visible;
  }, [visible, filter]);
  const mineOpen = (store.tickets || []).filter(t => window.omTicketOpen(t) && (uid && t.assigneeId === uid || tid && t.techId === tid)).length;
  const chips = [{
    key: "open",
    th: "ที่ต้องทำ",
    n: mineOpen
  }, {
    key: "done",
    th: "ปิดแล้ว"
  }];
  if (canAll) chips.push({
    key: "all",
    th: "ทั้งบริษัท"
  });
  const move = (t, to) => {
    const next = window.omTicketMove(t, to, me, "");
    if (!next || !store.save) return;
    store.save(next);
    setOpen(next);
  };
  if (store.loading) return React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026");
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "12px 16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement(LnPick, {
    items: chips,
    value: filter,
    onPick: setFilter
  }), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, filter === "all" ? "ใบแจ้งซ่อมทั้งบริษัท" : "เฉพาะใบที่คุณรับผิดชอบ", " \xB7 ", list.length, " \u0E43\u0E1A")), list.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5,
      lineHeight: 1.7
    }
  }, filter === "done" ? "ยังไม่มีใบที่ปิดแล้ว" : "ไม่มีใบแจ้งซ่อมที่ค้างอยู่", React.createElement("br", null), React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E0B\u0E48\u0E2D\u0E21\u0E40\u0E1B\u0E34\u0E14\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32 O&M \u0E1A\u0E19\u0E40\u0E27\u0E47\u0E1A \u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E21\u0E32\u0E42\u0E1C\u0E25\u0E48\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E1A\u0E38\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E38\u0E13")) : list.map(t => {
    const st = window.omTicketStatusOf(t.status);
    const sev = window.OM_SEVERITY_BY[t.severity] || {};
    const late = window.omTicketOverdue(t, today);
    return React.createElement("div", {
      key: t.id,
      onClick: () => setOpen(t),
      style: {
        padding: "13px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, t.no || t.id), React.createElement("span", {
      style: {
        padding: "2px 8px",
        borderRadius: 99,
        background: st.color + "1A",
        color: st.color,
        fontSize: 10.5,
        fontWeight: 800
      }
    }, st.th), late && React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontSize: 10.5,
        fontWeight: 800,
        color: "#EF4444"
      }
    }, "\u0E40\u0E25\u0E22 ", late.over, " \u0E27\u0E31\u0E19")), React.createElement("div", {
      style: {
        marginTop: 4,
        fontSize: 14.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, t.title || "ไม่ได้ระบุอาการ"), React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 12,
        color: "var(--text-3)"
      }
    }, t.siteName || t.siteCode || "—", sev.th ? " · " + sev.th : "", t.apptDate ? " · นัด " + window.drShort(t.apptDate) : ""));
  }), open && React.createElement(LnFixSheet, {
    t: open,
    role: role,
    onMove: move,
    onClose: () => setOpen(null)
  }));
}
function LnFixSheet({
  t,
  role,
  onMove,
  onClose
}) {
  const st = window.omTicketStatusOf(t.status);
  const sev = window.OM_SEVERITY_BY[t.severity] || {};
  const cat = window.OM_TICKET_CAT_BY[t.category] || {};
  const nexts = window.omTicketNext(t, role);
  const rows = [["ไซต์", t.siteName || t.siteCode], ["อาการ", t.detail], ["ประเภท", cat.th], ["ความเร่งด่วน", sev.th], ["ความคุ้มครอง", window.omCoverTH(t.cover).th], ["ผู้รับผิดชอบ", t.assigneeName], ["วันนัด", t.apptDate ? window.drDateTH(t.apptDate) + (t.apptFrom ? " " + t.apptFrom + "-" + t.apptTo : "") : ""], ["แจ้งเมื่อ", t.reportedAt ? window.drDateTH(String(t.reportedAt).slice(0, 10)) : ""], ["ผลการแก้ไข", t.result]].filter(r => r[1]);
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60,
      background: "rgba(15,43,51,.42)",
      display: "flex",
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxHeight: "88dvh",
      overflowY: "auto",
      overflowX: "hidden",
      background: "var(--surface)",
      borderRadius: "18px 18px 0 0",
      padding: "16px 18px",
      paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))"
    }
  }, React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 99,
      background: "var(--border-strong)",
      margin: "0 auto 14px"
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, t.no || t.id), React.createElement("span", {
    style: {
      padding: "2px 9px",
      borderRadius: 99,
      background: st.color + "1A",
      color: st.color,
      fontSize: 11,
      fontWeight: 800
    }
  }, st.th)), React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: "4px 0 12px"
    }
  }, t.title || "ไม่ได้ระบุอาการ"), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden"
    }
  }, rows.map((r, i) => React.createElement("div", {
    key: r[0],
    style: {
      display: "flex",
      gap: 10,
      padding: "10px 13px",
      borderTop: i ? "1px solid var(--border)" : "none",
      background: i % 2 ? "var(--surface2)" : "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      flex: "0 0 104px",
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, r[0]), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: "var(--text-1)",
      lineHeight: 1.6,
      wordBreak: "break-word"
    }
  }, r[1])))), nexts.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 14,
      flexWrap: "wrap"
    }
  }, nexts.map(n => React.createElement("button", {
    key: n.key,
    onClick: () => onMove(t, n.key),
    style: {
      flex: 1,
      minWidth: 120,
      padding: "12px 14px",
      borderRadius: 11,
      border: "none",
      background: n.key === "closed" ? "var(--primary)" : n.color,
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, n.th))), React.createElement("button", {
    onClick: onClose,
    style: {
      marginTop: 10,
      width: "100%",
      padding: "12px 14px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14")));
}
function LnApp() {
  const auth = window.useAuthStore();
  const store = window.useJobStore();
  const techStore = window.useTechStore();
  const notif = window.useNotifStore();
  const roleCfg = window.useRoleConfig();
  const [tab, setTab] = React.useState(LN_START.tab);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(null);
  const [jobType, setJobType] = React.useState("all");
  const [onlyMine, setOnlyMine] = React.useState(true);
  const me = auth.current;
  const role = React.useMemo(() => me ? window.userRoles(me) : [], [me]);
  const scope = React.useMemo(() => window.jobScopeOf(role), [role, roleCfg.rev]);
  const mine = React.useMemo(() => {
    if (!me) return [];
    return (store.jobs || []).filter(j => window.jobInScope(j, scope, me));
  }, [store.jobs, scope, me]);
  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    let base = mine;
    if (scope.all && onlyMine) base = base.filter(j => window.jobIsMine(j, me));
    if (jobType !== "all") base = base.filter(j => j.type === jobType);
    const hit = base.filter(j => window.jobMatchQ(j, s));
    return hit.slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0,
        bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return String(a.startDate || "9999").localeCompare(String(b.startDate || "9999"));
    });
  }, [mine, q, jobType, onlyMine, scope.all, me]);
  const myNotifs = React.useMemo(() => {
    if (!me) return [];
    const tid = me.techId;
    return (notif.notifs || []).filter(n => tid && n.toTechId === tid || n.toUserId === me.id || n.toPerm && window.can(role, n.toPerm));
  }, [notif.notifs, me, role]);
  const unread = myNotifs.filter(n => !n.read).length;
  if (auth.loading || store.loading) return React.createElement(window.LnSplash, {
    text: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u2026"
  });
  if (!me) return React.createElement(window.LnSplash, {
    tone: "bad",
    text: "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E23\u0E30\u0E07\u0E31\u0E1A\u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",
    sub: "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E02\u0E2D\u0E07\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17"
  });
  return React.createElement("div", {
    style: {
      minHeight: "100dvh",
      background: "var(--bg)"
    }
  }, React.createElement(LnHead, {
    tab: tab,
    setTab: setTab,
    unread: unread
  }), tab === "jobs" && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "12px 16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: false,
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E0A\u0E37\u0E48\u0E2D \xB7 \u0E23\u0E2B\u0E31\u0E2A\u0E07\u0E32\u0E19 \xB7 \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14 \xB7 \u0E40\u0E1A\u0E2D\u0E23\u0E4C \xB7 \u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48",
    style: {
      width: "100%",
      padding: "11px 13px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 15,
      outline: "none"
    }
  }), React.createElement("div", {
    style: {
      marginTop: 9
    }
  }, React.createElement(LnPick, {
    items: [{
      key: "all",
      th: "ทั้งหมด"
    }].concat((window.SF.TYPES || []).map(t => ({
      key: t.key,
      th: t.th
    }))),
    value: jobType,
    onPick: setJobType
  })), scope.all && React.createElement("div", {
    style: {
      marginTop: 7
    }
  }, React.createElement(LnPick, {
    items: [{
      key: "mine",
      th: "ของฉัน"
    }, {
      key: "all",
      th: "ทั้งบริษัท"
    }],
    value: onlyMine ? "mine" : "all",
    onPick: k => setOnlyMine(k === "mine")
  })), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, !scope.all || onlyMine ? "เฉพาะงานที่คุณรับผิดชอบ" : "ทุกงานในระบบ", " \xB7 ", list.length, " \u0E07\u0E32\u0E19")), list.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5,
      lineHeight: 1.7
    }
  }, q ? "ไม่พบงานที่ตรงกับคำค้น" : jobType !== "all" ? "ไม่มีงานประเภทนี้ที่คุณรับผิดชอบ" : "ยังไม่มีงานที่คุณรับผิดชอบ", !q && jobType === "all" && !scope.all && React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 12
    }
  }, "\u0E07\u0E32\u0E19\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2D\u0E2D\u0E1F\u0E1F\u0E34\u0E28\u0E23\u0E30\u0E1A\u0E38\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E48\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A\u0E43\u0E19\u0E43\u0E1A\u0E07\u0E32\u0E19")) : list.map(j => React.createElement(LnJobRow, {
    key: j.id,
    job: j,
    onOpen: setOpen
  }))), tab === "fix" && React.createElement(LnFixTab, {
    me: me,
    role: role
  }), tab === "time" && React.createElement(LnTimeTab, {
    me: me,
    users: auth.users,
    role: role,
    jobs: mine,
    startOt: LN_START.ot
  }), tab === "daily" && React.createElement(window.LnDailyTab, {
    me: me,
    role: role,
    jobs: mine,
    notify: notif.addNotif
  }), tab === "ec" && React.createElement(window.LnEcTab, {
    me: me,
    users: auth.users,
    role: role,
    jobs: mine
  }), tab === "bell" && (myNotifs.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19") : myNotifs.map(n => React.createElement("div", {
    key: n.id,
    onClick: () => {
      if (!n.read) notif.markRead(n.id);
      const j = (store.jobs || []).find(x => x.id === n.jobId);
      if (j) {
        setOpen(j);
        setTab("jobs");
      }
    },
    style: {
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)",
      cursor: "pointer",
      background: n.read ? "var(--surface)" : "var(--primary-soft)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, n.title || "แจ้งเตือน"), n.body && React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, n.body), React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, n.at ? window.drShort(String(n.at).slice(0, 10)) + " " + String(n.at).slice(11, 16) : "")))), tab === "me" && React.createElement("div", {
    style: {
      padding: 18
    }
  }, React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: 18,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, me.name), React.createElement("div", {
    style: {
      marginTop: 6,
      display: "flex",
      gap: 6,
      justifyContent: "center",
      flexWrap: "wrap"
    }
  }, role.map(r => {
    const ri = window.ROLE_INFO[r] || {};
    return React.createElement("span", {
      key: r,
      style: {
        padding: "3px 10px",
        borderRadius: 99,
        background: (ri.color || "#888") + "18",
        color: ri.color || "var(--text-2)",
        fontSize: 11.5,
        fontWeight: 700
      }
    }, ri.th || r);
  })), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49 ", me.username || "—")), window.LN_TEST && React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      fontWeight: 700,
      textAlign: "center"
    }
  }, "\u0E42\u0E2B\u0E21\u0E14\u0E17\u0E14\u0E2A\u0E2D\u0E1A \u2014 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E23\u0E34\u0E07")), React.createElement(LnJobSheet, {
    job: open,
    techs: techStore.techs,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  LnApp,
  LnJobRow,
  LnJobSheet,
  LnHead,
  LnClock,
  LnOtForm,
  LnTimeTab,
  LnFixTab,
  LnFixSheet,
  LnPick
});