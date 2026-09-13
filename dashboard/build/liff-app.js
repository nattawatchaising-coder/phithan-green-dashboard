const LN_TAB = [{
  key: "jobs",
  th: "งาน",
  icon: "wrench"
}, {
  key: "bell",
  th: "แจ้งเตือน",
  icon: "bell"
}, {
  key: "me",
  th: "ฉัน",
  icon: "user"
}];
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
        padding: "9px 0 11px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        color: on ? "var(--primary-dark)" : "var(--text-3)",
        boxShadow: on ? "inset 0 -2.5px 0 var(--primary)" : "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
      }
    }, React.createElement(Icon, {
      name: t.icon,
      size: 15,
      color: on ? "var(--primary-dark)" : "var(--text-3)"
    }), t.th, t.key === "bell" && unread > 0 && React.createElement("span", {
      style: {
        minWidth: 17,
        height: 17,
        padding: "0 5px",
        borderRadius: 99,
        background: "#D93025",
        color: "#fff",
        fontSize: 10.5,
        fontWeight: 800,
        display: "inline-grid",
        placeItems: "center"
      }
    }, unread));
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
function LnApp() {
  const auth = window.useAuthStore();
  const store = window.useJobStore();
  const techStore = window.useTechStore();
  const notif = window.useNotifStore();
  const roleCfg = window.useRoleConfig();
  const [tab, setTab] = React.useState("jobs");
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(null);
  const me = auth.current;
  const role = React.useMemo(() => me ? window.userRoles(me) : [], [me]);
  const scope = React.useMemo(() => window.jobScopeOf(role), [role, roleCfg.rev]);
  const mine = React.useMemo(() => {
    if (!me) return [];
    return (store.jobs || []).filter(j => window.jobInScope(j, scope, me));
  }, [store.jobs, scope, me]);
  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const hit = mine.filter(j => window.jobMatchQ(j, s));
    return hit.slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0,
        bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return String(a.startDate || "9999").localeCompare(String(b.startDate || "9999"));
    });
  }, [mine, q]);
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
      marginTop: 7,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, scope.all ? "ทุกงานในระบบ" : "เฉพาะงานที่คุณรับผิดชอบ", " \xB7 ", list.length, " \u0E07\u0E32\u0E19")), list.length === 0 ? React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, q ? "ไม่พบงานที่ตรงกับคำค้น" : "ยังไม่มีงานที่คุณรับผิดชอบ") : list.map(j => React.createElement(LnJobRow, {
    key: j.id,
    job: j,
    onOpen: setOpen
  }))), tab === "bell" && (myNotifs.length === 0 ? React.createElement("div", {
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
  }, "\u0E42\u0E2B\u0E21\u0E14\u0E17\u0E14\u0E2A\u0E2D\u0E1A \u2014 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E23\u0E34\u0E07"), React.createElement("div", {
    style: {
      marginTop: 16,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7,
      textAlign: "center"
    }
  }, "\u0E25\u0E07\u0E40\u0E27\u0E25\u0E32\u0E40\u0E02\u0E49\u0E32-\u0E2D\u0E2D\u0E01\u0E07\u0E32\u0E19 \xB7 \u0E02\u0E2D OT \xB7 \u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19 \xB7 \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19", React.createElement("br", null), "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E22\u0E2D\u0E22\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E43\u0E19\u0E40\u0E1F\u0E2A\u0E16\u0E31\u0E14\u0E44\u0E1B")), React.createElement(LnJobSheet, {
    job: open,
    techs: techStore.techs,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  LnApp,
  LnJobRow,
  LnJobSheet,
  LnHead
});