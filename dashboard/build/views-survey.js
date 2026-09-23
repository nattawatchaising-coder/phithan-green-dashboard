function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SurveyView({
  jobs,
  role,
  onOpen,
  onToggleSkip
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("all");
  const withStatus = React.useMemo(() => jobs.map(j => ({
    job: j,
    st: window.surveyStatus(j)
  })), [jobs]);
  const counts = React.useMemo(() => {
    const c = {
      all: withStatus.length,
      none: 0,
      partial: 0,
      done: 0,
      skip: 0
    };
    withStatus.forEach(x => {
      c[x.st.state] = (c[x.st.state] || 0) + 1;
    });
    return c;
  }, [withStatus]);
  const shown = React.useMemo(() => {
    const arr = filter === "all" ? withStatus.slice() : withStatus.filter(x => x.st.state === filter);
    const order = {
      none: 0,
      partial: 1,
      done: 2,
      skip: 3
    };
    arr.sort((a, b) => order[a.st.state] - order[b.st.state] || (a.job.name || "").localeCompare(b.job.name || ""));
    return arr;
  }, [withStatus, filter]);
  const FILTERS = [{
    key: "all",
    label: "ทั้งหมด",
    color: "var(--text-2)"
  }, {
    key: "none",
    label: "ยังไม่สำรวจ",
    color: "#94A3B8"
  }, {
    key: "partial",
    label: "สำรวจบางส่วน",
    color: "#F59E0B"
  }, {
    key: "done",
    label: "สำรวจครบ",
    color: "var(--tint-green-tx)"
  }, {
    key: "skip",
    label: "ไม่ต้องสำรวจ",
    color: "#64748B"
  }];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, FILTERS.map(ff => {
    const active = filter === ff.key;
    return React.createElement("button", {
      key: ff.key,
      onClick: () => setFilter(ff.key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: isMobile ? "6px 12px" : "7px 14px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        border: "1px solid " + (active ? ff.color : "var(--border-strong)"),
        background: active ? ff.color + "16" : "var(--surface)",
        color: active ? ff.color : "var(--text-2)"
      }
    }, ff.key !== "all" && React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: ff.color
      }
    }), ff.label, React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "var(--mono)",
        opacity: active ? 1 : .6
      }
    }, counts[ff.key] || 0));
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, shown.length === 0 && React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 14,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E19\u0E35\u0E49"), shown.map(({
    job,
    st
  }) => {
    const isSkip = st.state === "skip";
    const toggleSkip = e => {
      e.stopPropagation();
      onToggleSkip && onToggleSkip(job);
    };
    return React.createElement("div", {
      key: job.id,
      role: "button",
      tabIndex: 0,
      onClick: () => onOpen(job),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: 14,
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "var(--shadow-sm)",
        opacity: isSkip ? 0.72 : 1
      }
    }, React.createElement("span", {
      style: {
        width: 42,
        height: 42,
        borderRadius: 12,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: st.color + "1c",
        color: st.color
      }
    }, st.state === "done" ? React.createElement(Icon, {
      name: "check",
      size: 20,
      color: st.color,
      sw: 2.4
    }) : isSkip ? React.createElement(Icon, {
      name: "check",
      size: 19,
      color: st.color,
      sw: 2.2
    }) : st.state === "partial" ? React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        fontFamily: "var(--mono)"
      }
    }, st.pct, "%") : React.createElement(Icon, {
      name: "pin",
      size: 18,
      color: st.color
    })), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 14,
        fontWeight: 700,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, job.name), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 1
      }
    }, job.code, " \xB7 ", job.province || "-", job.brand ? " · " + job.brand : ""), React.createElement("span", {
      style: {
        display: "block",
        marginTop: 7,
        height: 5,
        borderRadius: 99,
        background: "var(--surface3)",
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: st.pct + "%",
        background: st.color,
        borderRadius: 99,
        transition: "width .3s"
      }
    }))), React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        flexShrink: 0
      }
    }, React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: st.color,
        background: st.color + "16",
        padding: "3px 9px",
        borderRadius: 99,
        whiteSpace: "nowrap"
      }
    }, st.label), !isSkip && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 700,
        color: "var(--primary-dark)"
      }
    }, st.state === "none" ? "เริ่มสำรวจ" : "แก้ไข", " ", React.createElement(Icon, {
      name: "chevronRight",
      size: 14,
      color: "var(--primary-dark)"
    })), onToggleSkip && (isSkip ? React.createElement("button", {
      onClick: toggleSkip,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-2)",
        background: "var(--surface2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        padding: "5px 9px",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap"
      }
    }, React.createElement(Icon, {
      name: "history",
      size: 12,
      color: "var(--text-2)"
    }), " \u0E40\u0E02\u0E49\u0E32\u0E04\u0E34\u0E27\u0E2A\u0E33\u0E23\u0E27\u0E08") : React.createElement("button", {
      onClick: toggleSkip,
      title: "\u0E17\u0E33\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E2B\u0E21\u0E32\u0E22\u0E27\u0E48\u0E32\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E41\u0E25\u0E49\u0E27/\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E33\u0E23\u0E27\u0E08",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--tint-green-tx)",
        background: "rgba(22,163,74,.08)",
        border: "1px solid rgba(22,163,74,.27)",
        borderRadius: 8,
        padding: "5px 9px",
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap"
      }
    }, React.createElement(Icon, {
      name: "check",
      size: 12,
      color: "var(--tint-green-tx)",
      sw: 2.6
    }), " \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E33\u0E23\u0E27\u0E08"))));
  })));
}
function leadSetStage(leadStore, l, key) {
  leadStore.patch(l.id, (window.salesStagePatch || (() => ({})))(key));
}
function leadAddContact(leadStore, l, rec) {
  const stageKey = window.salesStageKey || (x => x.status || "open");
  const list = (l.contacts || []).concat([rec]);
  const patch = {
    contacts: list
  };
  if (stageKey(l) === "new") Object.assign(patch, (window.salesStagePatch || (() => ({})))("contact"));
  if (rec.nextFollow != null) patch.nextFollow = rec.nextFollow;
  leadStore.patch(l.id, patch);
}
function LeadsView({
  leadStore,
  appts,
  jobs,
  onMenuOpen,
  onOpenSurvey,
  onReport,
  onPlan3d,
  onConvert,
  canConvert,
  users,
  currentUser,
  quotes,
  onOpenQuote,
  onOpenLead,
  headRight,
  focusId,
  onFocusDone,
  newAt
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("all");
  const [edit, setEdit] = React.useState(null);
  const [log, setLog] = React.useState(null);
  React.useEffect(() => {
    if (newAt) setEdit({
      lead: leadStore.blank(),
      isNew: true
    });
  }, [newAt]);
  const leads = leadStore.leads || [];
  const STATUS = window.SALES_STAGES || [];
  const STATUS_BY = window.SALES_BY || {};
  const stageKey = window.salesStageKey || (l => l.status || "open");
  const apptsOf = React.useMemo(() => {
    const m = {};
    (appts || []).forEach(a => {
      if (a.leadId) (m[a.leadId] = m[a.leadId] || []).push(a);
    });
    return m;
  }, [appts]);
  const counts = React.useMemo(() => {
    const c = {
      all: leads.length
    };
    leads.forEach(l => {
      const k = stageKey(l);
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [leads, stageKey]);
  const shown = React.useMemo(() => {
    const arr = filter === "all" ? leads.slice() : leads.filter(l => stageKey(l) === filter);
    return arr.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [leads, filter, stageKey]);
  React.useEffect(() => {
    if (!focusId) return;
    const l = leads.find(x => x.id === focusId);
    if (l && onOpenLead) onOpenLead(l);
    if (onFocusDone) onFocusDone();
  }, [focusId, leads]);
  const FILTERS = [{
    key: "all",
    th: "ทั้งหมด",
    color: "var(--text-2)"
  }].concat(STATUS.map(s => ({
    key: s.key,
    th: s.th,
    color: s.color
  })));
  const setStage = (l, key) => leadSetStage(leadStore, l, key);
  const addContact = (l, rec) => leadAddContact(leadStore, l, rec);
  const cardCtx = {
    leadStore,
    jobs,
    quotes,
    apptsOf,
    STATUS,
    STATUS_BY,
    stageKey,
    onOpenSurvey,
    onReport,
    onOpenQuote,
    onPlan3d,
    onConvert,
    canConvert,
    setEdit,
    setLog,
    setStage,
    onOpen: onOpenLead
  };
  return React.createElement(React.Fragment, null, React.createElement(window.SchedHeader, {
    title: "\u0E07\u0E32\u0E19\u0E02\u0E32\u0E22",
    onMenuOpen: onMenuOpen,
    sub: leads.length + " ราย · " + ((counts.new || 0) + (counts.contact || 0) + (counts.survey || 0) + (counts.quoted || 0) + (counts.nego || 0)) + " ยังไล่อยู่ · " + (counts.won || 0) + " ปิดการขายแล้ว · " + leads.filter(l => window.sOverdue && window.sOverdue(l.nextFollow) && stageKey(l) !== "won" && stageKey(l) !== "lost").length + " เลยวันติดตาม",
    right: React.createElement(React.Fragment, null, headRight, React.createElement("button", {
      onClick: () => setEdit({
        lead: leadStore.blank(),
        isNew: true
      }),
      className: "btn-add"
    }, React.createElement(Icon, {
      name: "plus",
      size: 17,
      color: "#fff",
      sw: 2.4
    }), React.createElement("span", null, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48")))
  }), React.createElement("div", {
    className: "app-content"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, FILTERS.map(ff => {
    const active = filter === ff.key;
    return React.createElement("button", {
      key: ff.key,
      onClick: () => setFilter(ff.key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: isMobile ? "6px 12px" : "7px 14px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        border: "1px solid " + (active ? ff.color : "var(--border-strong)"),
        background: active ? ff.color + "16" : "var(--surface)",
        color: active ? ff.color : "var(--text-2)"
      }
    }, ff.key !== "all" && React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: ff.color
      }
    }), ff.th, React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "var(--mono)",
        opacity: active ? 1 : .6
      }
    }, counts[ff.key] || 0));
  })), shown.length === 0 ? React.createElement("div", {
    style: {
      padding: 44,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 14,
      background: "var(--surface)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 16
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E19\u0E35\u0E49 \xB7 \u0E01\u0E14 \u201C\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48\u201D \u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32 \u201C\u0E08\u0E31\u0E14\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E33\u0E23\u0E27\u0E08\u201D") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, shown.map(l => React.createElement(LeadCard, {
    key: l.id,
    l: l,
    ctx: cardCtx
  })))), edit && React.createElement(LeadModal, {
    initial: edit.lead,
    isNew: edit.isNew,
    users: users,
    onClose: () => setEdit(null),
    onSave: rec => {
      leadStore.upsert(rec);
      setEdit(null);
    }
  }), log && React.createElement(ContactLogModal, {
    lead: log,
    currentUser: currentUser,
    onClose: () => setLog(null),
    onSave: rec => {
      addContact(log, rec);
      setLog(null);
    }
  }));
}
function ContactLogModal({
  lead,
  currentUser,
  onClose,
  onSave
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const WAYS = window.CONTACT_WAYS || [{
    key: "call",
    th: "โทร"
  }];
  const [how, setHow] = React.useState("call");
  const [note, setNote] = React.useState("");
  const [next, setNext] = React.useState(lead.nextFollow || "");
  const lbl = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  const submit = () => onSave({
    id: "c-" + Date.now().toString(36),
    at: new Date().toISOString(),
    by: currentUser && currentUser.id || "",
    byName: currentUser && currentUser.name || "",
    how: how,
    note: note.trim(),
    nextFollow: next || ""
  });
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
      width: isMobile ? "100%" : "min(480px,100%)",
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
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 16.5,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, lead.name || "(ไม่ระบุชื่อ)", " \xB7 ", lead.code)), React.createElement("button", {
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
      gap: 6
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E17\u0E32\u0E07\u0E44\u0E2B\u0E19"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, WAYS.map(w => {
    const on = how === w.key;
    return React.createElement("button", {
      key: w.key,
      onClick: () => setHow(w.key),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "8px 13px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, React.createElement(Icon, {
      name: w.icon,
      size: 13,
      color: on ? "var(--primary-dark)" : "var(--text-2)"
    }), w.th);
  }))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E04\u0E38\u0E22\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E27\u0E49"), React.createElement("textarea", {
    value: note,
    onChange: e => setNote(e.target.value),
    rows: 3,
    autoFocus: true,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \"\u0E02\u0E2D\u0E40\u0E27\u0E25\u0E32\u0E04\u0E34\u0E14 1 \u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C \u0E15\u0E34\u0E14\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E07\u0E1A\" \u0E2B\u0E23\u0E37\u0E2D \"\u0E02\u0E2D\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32 10 kW \u0E40\u0E1E\u0E34\u0E48\u0E21\"",
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.5
    })
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E04\u0E23\u0E31\u0E49\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B"), React.createElement("input", {
    type: "date",
    value: next,
    onChange: e => setNext(e.target.value),
    style: inputStyle
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E22\u0E27\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E41\u0E14\u0E07\u0E41\u0E25\u0E30\u0E16\u0E39\u0E01\u0E14\u0E31\u0E19\u0E02\u0E36\u0E49\u0E19\u0E1A\u0E19\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E1A\u0E2D\u0E23\u0E4C\u0E14\u0E02\u0E32\u0E22"))), React.createElement("div", {
    style: {
      padding: "12px 18px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
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
      padding: 12,
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
function leadBtn(color, solid) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 13px",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 700,
    border: solid ? "none" : "1px solid var(--border-strong)",
    background: solid ? color : "var(--surface)",
    color: solid ? "#fff" : color
  };
}
function LeadModal({
  initial,
  isNew,
  users,
  onClose,
  onSave
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const sellers = React.useMemo(() => {
    const arr = (users || []).filter(u => u.active !== false && !(window.hasRole && window.hasRole(window.userRoles(u), "admin"))).map(u => {
      const name = u.name || u.username || "—";
      const r = (window.ROLE_INFO || {})[(window.userRoles(u) || [])[0]];
      return {
        id: u.id,
        name: name,
        label: r ? name + " · " + r.short : name
      };
    });
    if (initial.ownerId && !arr.some(x => x.id === initial.ownerId)) {
      const old = initial.ownerName || "";
      arr.push({
        id: initial.ownerId,
        name: old,
        label: old + " (ปิดบัญชีแล้ว)"
      });
    }
    return arr;
  }, [users, initial.ownerId, initial.ownerName]);
  const lbl = {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  const submit = () => {
    if (!String(f.name || "").trim()) {
      alert("กรุณากรอกชื่อลูกค้า");
      return;
    }
    onSave(Object.assign({}, f, {
      name: f.name.trim()
    }));
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
  }, isNew ? "ลูกค้าสำรวจใหม่" : "แก้ไขลูกค้าสำรวจ"), React.createElement("button", {
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
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E01\u0E47\u0E1A\u0E41\u0E22\u0E01\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E01\u0E14 \u201C\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u201D"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 *"), React.createElement("input", {
    value: f.name,
    onChange: e => set("name", e.target.value),
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
    value: f.phone,
    onChange: e => set("phone", e.target.value),
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
    value: f.province,
    onChange: e => set("province", e.target.value),
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
    value: f.address,
    onChange: e => set("address", e.target.value),
    placeholder: "\u0E1A\u0E49\u0E32\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 / \u0E16\u0E19\u0E19 / \u0E15\u0E33\u0E1A\u0E25",
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), React.createElement(Segmented, {
    value: f.type || "home",
    onChange: v => set("type", v),
    options: [{
      value: "home",
      label: "บ้าน"
    }, {
      value: "biz",
      label: "โรงงาน / ธุรกิจ"
    }]
  })), React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border)",
      paddingTop: 14,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      color: "var(--primary-dark)"
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1D\u0E48\u0E32\u0E22\u0E02\u0E32\u0E22"), React.createElement("div", {
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
  }, "\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement("select", {
    value: f.ownerId || "",
    style: inputStyle,
    onChange: e => {
      const u = (sellers || []).find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        ownerId: e.target.value,
        ownerName: u ? u.name : ""
      }));
    }
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07 \u2014"), sellers.map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.label || u.name)))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E04\u0E23\u0E31\u0E49\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B"), React.createElement("input", {
    type: "date",
    value: f.nextFollow || "",
    onChange: e => set("nextFollow", e.target.value),
    style: inputStyle
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
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
  }, "\u0E17\u0E35\u0E48\u0E21\u0E32"), React.createElement("select", {
    value: f.source || "",
    onChange: e => set("source", e.target.value),
    style: inputStyle
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), (window.LEAD_SOURCES || []).map(s => React.createElement("option", {
    key: s.key,
    value: s.key
  }, s.th)))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14 (kWp)"), React.createElement("input", {
    type: "number",
    value: f.expKwp != null ? f.expKwp : "",
    onChange: e => set("expKwp", e.target.value === "" ? "" : +e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10",
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14 (\u0E1A\u0E32\u0E17)"), React.createElement("input", {
    type: "number",
    value: f.expValue != null ? f.expValue : "",
    onChange: e => set("expValue", e.target.value === "" ? "" : +e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 350000",
    style: inputStyle
  }))), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14\u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14 \u201C\u0E22\u0E31\u0E07\u0E44\u0E25\u0E48\u0E2D\u0E22\u0E39\u0E48\u201D \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E22\u0E2D\u0E14\u0E02\u0E32\u0E22 \u0E15\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E08\u0E23\u0E34\u0E07")), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, React.createElement("label", {
    style: lbl
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("textarea", {
    value: f.note,
    onChange: e => set("note", e.target.value),
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \"\u0E2A\u0E19\u0E43\u0E08 5 kW \u0E02\u0E2D\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E01\u0E48\u0E2D\u0E19\"",
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
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
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
      padding: 12,
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
function LeadCard({
  l,
  ctx
}) {
  const {
    jobs,
    quotes,
    apptsOf,
    STATUS_BY,
    STATUS,
    stageKey,
    onOpenQuote,
    onOpen
  } = ctx;
  const st = window.surveyStatus({
    survey: l.survey
  });
  const sKey = stageKey(l);
  const sc = STATUS_BY[sKey] || STATUS[0] || {
    th: "—",
    color: "var(--text-3)"
  };
  const list = (apptsOf[l.id] || []).slice().sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
  const next = list.find(a => a.status !== "canceled" && a.status !== "done") || list[list.length - 1];
  const job = l.jobId ? (jobs || []).find(j => j.id === l.jobId) : null;
  const late = window.sOverdue && window.sOverdue(l.nextFollow) && sKey !== "won" && sKey !== "lost";
  return (React.createElement("div", {
      key: l.id,
      onClick: () => onOpen && onOpen(l),
      title: onOpen ? "เปิดใบลูกค้า" : undefined,
      style: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid " + sc.color,
        borderRadius: 14,
        boxShadow: "var(--shadow-sm)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 9,
        cursor: onOpen ? "pointer" : "default"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "flex-start",
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, l.name || "(ไม่ระบุชื่อ)"), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 2
      }
    }, l.code, l.province ? " · " + l.province : "", l.phone ? " · " + l.phone : "")), React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: sc.color,
        background: sc.color + "16",
        padding: "3px 9px",
        borderRadius: 99,
        whiteSpace: "nowrap",
        flexShrink: 0
      }
    }, sc.th)), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        fontSize: 10.5
      }
    }, l.ownerName && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "var(--surface2)",
        color: "var(--text-2)",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 99
      }
    }, React.createElement(Icon, {
      name: "user",
      size: 11,
      color: "var(--text-3)"
    }), l.ownerName), l.nextFollow && React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 99,
        background: late ? "var(--tint-red-bg2)" : "var(--surface2)",
        color: late ? "#EF4444" : "var(--text-2)"
      }
    }, React.createElement(Icon, {
      name: "clock",
      size: 11,
      color: late ? "#EF4444" : "var(--text-3)"
    }), "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21 ", thDate(l.nextFollow, true), late ? " · เลยแล้ว" : ""), +l.expKwp > 0 && React.createElement("span", {
      style: {
        background: "var(--surface2)",
        color: "var(--text-2)",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 99,
        fontFamily: "var(--mono)"
      }
    }, l.expKwp, " kWp"), +l.expValue > 0 && React.createElement("span", {
      style: {
        background: "var(--primary-soft)",
        color: "var(--primary-dark)",
        fontWeight: 800,
        padding: "3px 9px",
        borderRadius: 99
      }
    }, "\u0E3F", fmtBaht(+l.expValue)), l.source && window.LEAD_SOURCE_TH && React.createElement("span", {
      style: {
        background: "var(--surface2)",
        color: "var(--text-3)",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 99
      }
    }, window.LEAD_SOURCE_TH(l.source))), l.address && React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-2)",
        display: "flex",
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
    }, l.address)), next && React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-2)",
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement(Icon, {
      name: "clock",
      size: 13,
      color: "var(--text-3)"
    }), "\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08 ", next.start ? thDate(next.start.slice(0, 10), true) : "-", list.length > 1 ? " · ทั้งหมด " + list.length + " นัด" : ""), l.note && React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-2)",
        background: "var(--surface2)",
        borderRadius: 8,
        padding: "7px 10px"
      }
    }, "\uD83D\uDCDD ", l.note), (l.contacts || []).length > 0 && (() => {
      const c = l.contacts[l.contacts.length - 1];
      const w = (window.CONTACT_WAYS || []).find(x => x.key === c.how) || {
        th: "ติดต่อ",
        icon: "list"
      };
      return React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: "var(--text-2)",
          display: "flex",
          gap: 7,
          alignItems: "flex-start"
        }
      }, React.createElement(Icon, {
        name: w.icon,
        size: 13,
        color: "var(--text-3)",
        style: {
          flexShrink: 0,
          marginTop: 2
        }
      }), React.createElement("span", {
        style: {
          flex: 1,
          minWidth: 0
        }
      }, React.createElement("b", {
        style: {
          color: "var(--text-1)"
        }
      }, w.th), " ", thDateTime(c.at), c.byName ? " · " + c.byName : "", c.note ? React.createElement("span", {
        style: {
          display: "block",
          color: "var(--text-3)"
        }
      }, c.note) : null, l.contacts.length > 1 ? React.createElement("span", {
        style: {
          color: "var(--text-3)"
        }
      }, "\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 ", l.contacts.length, " \u0E04\u0E23\u0E31\u0E49\u0E07") : null));
    })(), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        height: 5,
        borderRadius: 99,
        background: "var(--surface3)",
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        height: "100%",
        width: st.pct + "%",
        background: st.color,
        borderRadius: 99
      }
    })), React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: st.color,
        whiteSpace: "nowrap"
      }
    }, st.label, " ", st.pct, "%")), job && React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--tint-green-tx)",
        fontWeight: 700
      }
    }, "\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19 ", job.code, " \xB7 ", job.name, " \u0E41\u0E25\u0E49\u0E27"), onOpenQuote && window.SalesQuoteList && React.createElement("div", {
      onClick: e => e.stopPropagation()
    }, React.createElement(window.SalesQuoteList, {
      lead: l,
      quotes: quotes,
      onOpenQuote: q => onOpenQuote(l, q)
    })))
  );
}
function LeadActionRow({
  icon,
  color,
  title,
  sub,
  onClick
}) {
  return React.createElement("button", {
    onClick: onClick,
    style: {
      width: "100%",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: color + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 17,
    color: color
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, title), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, sub)), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  }));
}
function LeadSpecNum({
  label,
  value,
  unit,
  mono,
  accent,
  onSave,
  disabled
}) {
  const [txt, setTxt] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const has = value != null && value !== "" && +value > 0;
  if (disabled) return React.createElement(SpecItem, {
    label: label,
    value: has ? value + " " + unit : "—",
    mono: mono,
    accent: accent && has
  });
  const commit = () => {
    setTyping(false);
    const n = parseFloat(String(txt).replace(/[^0-9.]/g, ""));
    const out = isFinite(n) && n > 0 ? n : "";
    if (String(out) !== String(value == null ? "" : value)) onSave(out);
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, label), React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      minWidth: 0
    }
  }, React.createElement("input", {
    value: typing ? txt : has ? String(value) : "",
    inputMode: "decimal",
    placeholder: "\u2014",
    onFocus: () => {
      setTxt(has ? String(value) : "");
      setTyping(true);
    },
    onChange: e => setTxt(e.target.value),
    onBlur: commit,
    onKeyDown: e => {
      if (e.key === "Enter") e.currentTarget.blur();
    },
    style: {
      flex: 1,
      minWidth: 0,
      padding: "5px 8px",
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface2)",
      color: accent ? "var(--primary-dark)" : "var(--text-1)",
      fontFamily: mono ? "var(--mono)" : "inherit",
      fontSize: 14,
      fontWeight: 600,
      outline: "none"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      flexShrink: 0
    }
  }, unit)));
}
function LeadSpecPhase({
  label,
  lead,
  onSave,
  disabled
}) {
  const known = !!(lead.phase || lead.survey && lead.survey.phase);
  const cur = known ? window.SF.phaseOf(lead) : 0;
  if (disabled) return React.createElement(SpecItem, {
    label: label,
    value: cur ? cur + " เฟส" : "—"
  });
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, label), React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 4,
      padding: 3,
      borderRadius: 9,
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      alignSelf: "flex-start"
    }
  }, ["1", "3"].map(k => {
    const on = cur === +k;
    return React.createElement("button", {
      key: k,
      type: "button",
      onClick: () => onSave(k),
      style: {
        padding: "4px 11px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        background: on ? "var(--surface)" : "transparent",
        color: on ? "var(--primary-dark)" : "var(--text-3)",
        boxShadow: on ? "0 1px 3px rgba(0,0,0,.08)" : "none"
      }
    }, k, " \u0E40\u0E1F\u0E2A");
  })));
}
function LeadDetail({
  l,
  ctx
}) {
  const {
    leadStore,
    jobs,
    quotes,
    apptsOf,
    STATUS,
    STATUS_BY,
    stageKey,
    currentUser,
    stock,
    priceMap,
    canManage,
    canDesign,
    onSaveBoq,
    onOpenSurvey,
    onReport,
    onOpenQuote,
    onPlan3d,
    onConvert,
    canConvert,
    setEdit,
    setLog,
    setStage
  } = ctx;
  const [ask, setAsk] = React.useState(null);
  const [designOpen, setDesignOpen] = React.useState(false);
  const [boqOpen, setBoqOpen] = React.useState(false);
  const [delC, setDelC] = React.useState(null);
  const st = window.surveyStatus({
    survey: l.survey
  });
  const sKey = stageKey(l);
  const sc = STATUS_BY[sKey] || STATUS[0] || {
    th: "—",
    color: "var(--text-3)"
  };
  const list = (apptsOf[l.id] || []).slice().sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
  const next = list.find(a => a.status !== "canceled" && a.status !== "done") || list[list.length - 1];
  const job = l.jobId ? (jobs || []).find(j => j.id === l.jobId) : null;
  const late = window.sOverdue && window.sOverdue(l.nextFollow) && sKey !== "won" && sKey !== "lost";
  const asJob = job || (window.leadAsJob ? window.leadAsJob(l) : null);
  const media = window.useJobMedia ? window.useJobMedia(asJob ? asJob.id : null) : null;
  const contacts = (l.contacts || []).slice().reverse();
  const lastC = contacts[0] || null;
  const wayOf = k => (window.CONTACT_WAYS || []).find(x => x.key === k) || {
    th: "ติดต่อ",
    icon: "list"
  };
  const toggleSurveySkip = () => {
    const cur = l.survey || {};
    leadStore.patch(l.id, {
      survey: Object.assign({}, cur, {
        skip: !cur.skip,
        skippedAt: !cur.skip ? new Date().toISOString() : null,
        skipBy: !cur.skip ? currentUser && currentUser.name || "" : null
      })
    });
  };
  const setLeadPhase = v => {
    const f = {
      phase: v
    };
    const cur = l.survey || {};
    if (cur.phase && String(cur.phase) !== String(v)) f.survey = Object.assign({}, cur, {
      phase: v
    });
    leadStore.patch(l.id, f);
  };
  const removeContact = (c, shownIdx) => {
    const all = (l.contacts || []).slice();
    const i = c.id ? all.findIndex(x => x.id === c.id) : all.length - 1 - shownIdx;
    if (i < 0) {
      setDelC(null);
      return;
    }
    all.splice(i, 1);
    leadStore.patch(l.id, {
      contacts: all
    });
    setDelC(null);
  };
  const card = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10
  };
  const capt = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".08em",
    color: "var(--text-3)",
    textTransform: "uppercase",
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: 6
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12.5,
      fontWeight: 800,
      color: sc.color,
      background: sc.color + "16",
      padding: "5px 12px",
      borderRadius: 99,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: sc.color
    }
  }), sc.th), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 90,
      height: 6,
      borderRadius: 99,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: st.pct + "%",
      background: st.color,
      borderRadius: 99
    }
  })), React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: st.color,
      whiteSpace: "nowrap"
    }
  }, st.label, " ", st.pct, "%")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
      marginBottom: 22
    }
  }, React.createElement(InfoRow, {
    label: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23"
  }, l.phone || "—"), React.createElement(InfoRow, {
    label: "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E04\u0E23\u0E31\u0E49\u0E07\u0E16\u0E31\u0E14\u0E44\u0E1B"
  }, l.nextFollow ? React.createElement("span", {
    style: {
      color: late ? "#EF4444" : "var(--text-1)",
      fontWeight: late ? 700 : 500
    }
  }, thDate(l.nextFollow, true), late ? " · เลยแล้ว" : "") : "—"), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(InfoRow, {
    label: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 / \u0E1E\u0E34\u0E01\u0E31\u0E14"
  }, [l.address, l.province].filter(x => x && String(x).trim() !== "-" && String(x).trim() !== "—").join(", ") || "—")), React.createElement(InfoRow, {
    label: "\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22"
  }, l.ownerName || "—"), React.createElement(InfoRow, {
    label: "\u0E17\u0E35\u0E48\u0E21\u0E32\u0E02\u0E2D\u0E07\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"
  }, (l.source && window.LEAD_SOURCE_TH ? window.LEAD_SOURCE_TH(l.source) : "") || "—"), React.createElement(InfoRow, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19"
  }, l.type === "biz" ? "โรงงาน / ธุรกิจ" : "บ้าน"), React.createElement(InfoRow, {
    label: "\u0E19\u0E31\u0E14\u0E2A\u0E33\u0E23\u0E27\u0E08"
  }, next ? (next.start ? thDate(next.start.slice(0, 10), true) : "-") + (list.length > 1 ? " · ทั้งหมด " + list.length + " นัด" : "") : "ยังไม่มีนัด"), job && React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(InfoRow, {
    label: "\u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E41\u0E25\u0E49\u0E27"
  }, React.createElement("span", {
    style: {
      color: "var(--tint-green-tx)",
      fontWeight: 700
    }
  }, job.code, " \xB7 ", job.name))), l.note && React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(InfoRow, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"
  }, l.note))), React.createElement("div", {
    style: card
  }, React.createElement("div", {
    style: capt
  }, React.createElement(Icon, {
    name: "sun",
    size: 14,
    color: "var(--primary)"
  }), " \u0E2A\u0E40\u0E1B\u0E01\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E19\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16
    }
  }, React.createElement(LeadSpecNum, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14",
    value: l.expKwp,
    unit: "kWp",
    mono: true,
    onSave: v => leadStore.patch(l.id, {
      expKwp: v
    })
  }), React.createElement(LeadSpecNum, {
    label: "\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E04\u0E32\u0E14",
    value: l.expValue,
    unit: "\u0E1A\u0E32\u0E17",
    accent: true,
    onSave: v => leadStore.patch(l.id, {
      expValue: v
    })
  }), React.createElement(LeadSpecPhase, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32",
    lead: l,
    onSave: setLeadPhase
  }))), onOpenQuote && window.SalesQuoteList && React.createElement(window.SalesQuoteList, {
    lead: l,
    quotes: quotes,
    onOpenQuote: q => onOpenQuote(l, q),
    card: true
  }), React.createElement(LeadActionRow, {
    icon: "phone",
    color: "var(--primary)",
    title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D",
    sub: lastC ? "ล่าสุด " + wayOf(lastC.how).th + " " + thDateTime(lastC.at) + " · ติดต่อไปแล้ว " + contacts.length + " ครั้ง" : "ยังไม่เคยบันทึกการติดต่อ",
    onClick: () => setLog(l)
  }), onOpenSurvey && React.createElement(LeadActionRow, {
    icon: "list",
    color: st.color,
    title: "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 (Site Survey)",
    sub: st.state === "skip" ? "ข้ามขั้นตอนสำรวจไว้" + (l.survey && l.survey.skipBy ? " โดย " + l.survey.skipBy : "") + " · แตะเพื่อกรอกแบบสำรวจ" : st.state === "none" ? "ยังไม่ได้สำรวจ · แตะเพื่อเริ่ม" : st.label + " · " + st.pct + "% · แตะเพื่อแก้ไข",
    onClick: () => onOpenSurvey(window.leadAsJob(l))
  }), onOpenSurvey && canManage !== false && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: -4,
      marginBottom: 10
    }
  }, React.createElement("button", {
    onClick: toggleSurveySkip,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      borderRadius: 9,
      padding: "5px 11px",
      color: st.state === "skip" ? "var(--text-2)" : "var(--tint-green-tx)",
      background: st.state === "skip" ? "var(--surface2)" : "rgba(22,163,74,.08)",
      border: "1px solid " + (st.state === "skip" ? "var(--border-strong)" : "rgba(22,163,74,.27)")
    }
  }, React.createElement(Icon, {
    name: st.state === "skip" ? "history" : "check",
    size: 12,
    color: st.state === "skip" ? "var(--text-2)" : "var(--tint-green-tx)",
    sw: 2.4
  }), st.state === "skip" ? "เอากลับเข้าคิวสำรวจ" : "ข้ามขั้นตอนสำรวจ · ไม่ต้องสำรวจ")), onReport && st.state !== "none" && l.survey && l.survey.startedAt && React.createElement("button", {
    onClick: () => onReport(window.leadAsJob(l)),
    style: {
      width: "100%",
      marginBottom: 10,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: "10px 14px",
      background: "var(--primary-soft)",
      border: "1px solid var(--primary)",
      borderRadius: 11,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 15,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1C\u0E25\u0E2A\u0E33\u0E23\u0E27\u0E08 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"), onPlan3d && React.createElement(LeadActionRow, {
    icon: "panel",
    color: "#4F46E5",
    title: "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07 3D",
    sub: "\u0E1B\u0E31\u0E49\u0E19\u0E1C\u0E31\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E44\u0E1B\u0E04\u0E38\u0E22\u0E01\u0E31\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 \xB7 \u0E14\u0E36\u0E07\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E40\u0E02\u0E49\u0E32\u0E43\u0E1A\u0E40\u0E2A\u0E19\u0E2D\u0E23\u0E32\u0E04\u0E32\u0E44\u0E14\u0E49",
    onClick: () => onPlan3d(job || window.leadAsJob(l))
  }), asJob && window.SolarDesignHost && canDesign !== false && React.createElement(LeadActionRow, {
    icon: "bolt",
    color: "#B45309",
    title: "\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A + \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15",
    sub: "\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 \u0E15\u0E23\u0E27\u0E08 I-V \xB7 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 25 \u0E1B\u0E35 \xB7 \u0E04\u0E37\u0E19\u0E17\u0E38\u0E19 \u2014 \u0E43\u0E0A\u0E49\u0E1C\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E31\u0E49\u0E19\u0E44\u0E27\u0E49",
    onClick: () => setDesignOpen(true)
  }), asJob && window.BOQEditor && React.createElement(LeadActionRow, {
    icon: "box",
    color: "var(--primary-dark)",
    title: "\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38 BOQ",
    sub: (job ? job.boq : l.boq) ? "มีรายการแล้ว · แตะเพื่อแก้ไข / ดาวน์โหลด" : "คำนวณปริมาณวัสดุเพื่อคิดราคาไปเสนอ",
    onClick: () => setBoqOpen(true)
  }), media && window.JobFiles && React.createElement(window.JobFiles, {
    media: media,
    currentUser: currentUser,
    canManage: canManage !== false
  }), contacts.length > 0 && React.createElement("div", {
    style: card
  }, React.createElement("div", {
    style: capt
  }, React.createElement(Icon, {
    name: "message",
    size: 14,
    color: "var(--text-3)"
  }), " \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D (", contacts.length, ")"), contacts.slice(0, 8).map((c, i) => {
    const w = wayOf(c.how);
    const asking = delC != null && delC === (c.id || "i" + i);
    return React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 9,
        alignItems: "flex-start",
        padding: "8px 0",
        borderTop: i ? "1px solid var(--border)" : "none"
      }
    }, React.createElement(Icon, {
      name: w.icon,
      size: 14,
      color: "var(--text-3)",
      style: {
        flexShrink: 0,
        marginTop: 2
      }
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 12,
        color: "var(--text-2)"
      }
    }, React.createElement("b", {
      style: {
        color: "var(--text-1)"
      }
    }, w.th), " ", thDateTime(c.at), c.byName ? " · " + c.byName : "", c.note ? React.createElement("span", {
      style: {
        display: "block",
        color: "var(--text-3)",
        lineHeight: 1.5
      }
    }, c.note) : null), canManage !== false && (asking ? React.createElement("span", {
      style: {
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
        flexShrink: 0
      }
    }, React.createElement("button", {
      onClick: () => removeContact(c, i),
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "#fff",
        background: "#EF4444",
        border: "none",
        borderRadius: 8,
        padding: "5px 10px",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "\u0E25\u0E1A\u0E40\u0E25\u0E22"), React.createElement("button", {
      onClick: () => setDelC(null),
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        padding: "5px 10px",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement("button", {
      onClick: () => setDelC(c.id || "i" + i),
      title: "\u0E25\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E19\u0E35\u0E49",
      style: {
        width: 26,
        height: 26,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 13
    }))));
  }), contacts.length > 8 && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      paddingTop: 8
    }
  }, "\xB7 \u0E41\u0E25\u0E30\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E35\u0E01 ", contacts.length - 8, " \u0E04\u0E23\u0E31\u0E49\u0E07")), React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 0,
      background: "var(--bg)",
      borderTop: "1px solid var(--border)",
      padding: "12px 0 14px",
      marginTop: 6,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, ask ? React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 140,
      fontSize: 12,
      fontWeight: 700,
      lineHeight: 1.5,
      color: ask.kind === "del" ? "#EF4444" : "var(--tint-green-tx)"
    }
  }, ask.kind === "del" ? "ลบ “" + (l.name || "รายนี้") + "” ? แบบสำรวจและรูปของรายนี้จะถูกลบด้วย" : "ย้าย “" + (l.name || "รายนี้") + "” เข้าฐานข้อมูลงานติดตั้ง? แบบสำรวจและรูปถ่ายจะถูกย้ายไปกับงานใหม่ด้วย"), ask.kind === "del" ? React.createElement("button", {
    onClick: () => {
      leadStore.remove(l.id);
      setAsk(null);
    },
    style: leadBtn("#EF4444", true)
  }, "\u0E25\u0E1A\u0E40\u0E25\u0E22") : React.createElement("button", {
    onClick: () => {
      setAsk(null);
      onConvert(l);
    },
    style: leadBtn("var(--tint-green-tx)", true)
  }, React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#fff",
    sw: 2.4
  }), " \u0E22\u0E49\u0E32\u0E22\u0E40\u0E25\u0E22"), React.createElement("button", {
    onClick: () => setAsk(null),
    style: leadBtn("var(--text-2)")
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setEdit({
      lead: Object.assign({}, l),
      isNew: false
    }),
    style: leadBtn("var(--text-2)")
  }, React.createElement(Icon, {
    name: "settings",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), sKey !== "lost" && sKey !== "won" && React.createElement("button", {
    onClick: () => setStage(l, "lost"),
    style: leadBtn("var(--text-2)")
  }, "\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"), sKey === "lost" && React.createElement("button", {
    onClick: () => setStage(l, "nego"),
    style: leadBtn("var(--text-2)")
  }, "\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E44\u0E25\u0E48\u0E15\u0E48\u0E2D"), React.createElement("button", {
    onClick: () => setAsk({
      kind: "del"
    }),
    style: leadBtn("#EF4444")
  }, "\u0E25\u0E1A"), canConvert && sKey !== "won" && React.createElement("button", {
    onClick: () => setAsk({
      kind: "conv"
    }),
    style: Object.assign({}, leadBtn("var(--tint-green-tx)", true), {
      marginLeft: "auto"
    })
  }, React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#fff",
    sw: 2.4
  }), " \u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"))), designOpen && asJob && window.SolarDesignHost && React.createElement(window.SolarDesignHost, {
    job: asJob,
    onClose: () => setDesignOpen(false)
  }), boqOpen && asJob && window.BOQEditor && React.createElement(window.BOQEditor, {
    job: asJob,
    priceMap: priceMap,
    stock: stock,
    onClose: () => setBoqOpen(false),
    onSave: onSaveBoq ? boq => {
      onSaveBoq(asJob, boq);
      setBoqOpen(false);
    } : null
  }));
}
function LeadDrawer({
  lead,
  leadStore,
  appts,
  jobs,
  quotes,
  users,
  currentUser,
  stock,
  priceMap,
  canManage,
  canDesign,
  onSaveBoq,
  onClose,
  onOpenSurvey,
  onReport,
  onOpenQuote,
  onPlan3d,
  onConvert,
  canConvert
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [edit, setEdit] = React.useState(null);
  const [log, setLog] = React.useState(null);
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape" && !edit && !log) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, edit, log]);
  if (!lead) return null;
  const stageKey = window.salesStageKey || (l => l.status || "open");
  const apptsOf = {};
  (appts || []).forEach(a => {
    if (a.leadId === lead.id) (apptsOf[a.leadId] = apptsOf[a.leadId] || []).push(a);
  });
  const ctx = {
    leadStore,
    jobs,
    quotes,
    apptsOf,
    currentUser,
    stock,
    priceMap,
    canManage,
    canDesign,
    onSaveBoq,
    STATUS: window.SALES_STAGES || [],
    STATUS_BY: window.SALES_BY || {},
    stageKey,
    onOpenSurvey,
    onReport,
    onOpenQuote,
    onPlan3d,
    onConvert,
    canConvert,
    setEdit,
    setLog,
    setStage: (l, key) => leadSetStage(leadStore, l, key)
  };
  return React.createElement(React.Fragment, null, React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 116,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(680px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, lead.name || "(ไม่ระบุชื่อ)"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, lead.code)), React.createElement("button", {
    onClick: onClose,
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 16,
      lineHeight: 1
    }
  }, "\xD7")), React.createElement("div", {
    style: {
      padding: "14px 16px 0",
      overflowY: "auto"
    }
  }, React.createElement(LeadDetail, {
    l: lead,
    ctx: ctx
  })))), edit && React.createElement(LeadModal, {
    initial: edit.lead,
    isNew: edit.isNew,
    users: users,
    onClose: () => setEdit(null),
    onSave: rec => {
      leadStore.upsert(rec);
      setEdit(null);
    }
  }), log && React.createElement(ContactLogModal, {
    lead: log,
    currentUser: currentUser,
    onClose: () => setLog(null),
    onSave: rec => {
      leadAddContact(leadStore, log, rec);
      setLog(null);
    }
  }));
}
Object.assign(window, {
  SurveyView,
  LeadsView,
  LeadCard,
  LeadDetail,
  LeadDrawer,
  LeadModal,
  ContactLogModal,
  LeadSpecNum,
  LeadSpecPhase
});