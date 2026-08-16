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
function LeadsView({
  leadStore,
  appts,
  jobs,
  onMenuOpen,
  onOpenSurvey,
  onReport,
  onConvert,
  canConvert,
  users,
  currentUser,
  quotes,
  onOpenQuote
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("all");
  const [edit, setEdit] = React.useState(null);
  const [log, setLog] = React.useState(null);
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
  const FILTERS = [{
    key: "all",
    th: "ทั้งหมด",
    color: "var(--text-2)"
  }].concat(STATUS.map(s => ({
    key: s.key,
    th: s.th,
    color: s.color
  })));
  const setStage = (l, key) => leadStore.patch(l.id, (window.salesStagePatch || (() => ({})))(key));
  const addContact = (l, rec) => {
    const list = (l.contacts || []).concat([rec]);
    const patch = {
      contacts: list
    };
    if (stageKey(l) === "new") Object.assign(patch, (window.salesStagePatch || (() => ({})))("contact"));
    if (rec.nextFollow != null) patch.nextFollow = rec.nextFollow;
    leadStore.patch(l.id, patch);
  };
  const [ask, setAsk] = React.useState(null);
  return React.createElement(React.Fragment, null, React.createElement(window.SchedHeader, {
    title: "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E33\u0E23\u0E27\u0E08",
    onMenuOpen: onMenuOpen,
    sub: leads.length + " ราย · " + ((counts.new || 0) + (counts.contact || 0) + (counts.survey || 0) + (counts.quoted || 0) + (counts.nego || 0)) + " ยังไล่อยู่ · " + (counts.won || 0) + " ปิดการขายแล้ว · " + leads.filter(l => window.sOverdue && window.sOverdue(l.nextFollow) && stageKey(l) !== "won" && stageKey(l) !== "lost").length + " เลยวันติดตาม",
    right: React.createElement("button", {
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
    }), React.createElement("span", null, "\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E43\u0E2B\u0E21\u0E48"))
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
  }, shown.map(l => {
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
    const lq = (window.quotesFor ? window.quotesFor(quotes, "lead", l.id) : [])[0];
    const late = window.sOverdue && window.sOverdue(l.nextFollow) && sKey !== "won" && sKey !== "lost";
    return React.createElement("div", {
      key: l.id,
      style: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid " + sc.color,
        borderRadius: 14,
        boxShadow: "var(--shadow-sm)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 9
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
    }, window.LEAD_SOURCE_TH(l.source)), lq && (() => {
      const qs = (window.QUOTE_STATUS_BY || {})[lq.status] || {
        th: lq.status,
        color: "var(--text-3)"
      };
      return React.createElement("span", {
        style: {
          background: qs.color + "16",
          color: qs.color,
          fontWeight: 800,
          padding: "3px 9px",
          borderRadius: 99,
          fontFamily: "var(--mono)"
        }
      }, lq.no, " \xB7 ", qs.th);
    })()), l.address && React.createElement("div", {
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
    }, "\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19 ", job.code, " \xB7 ", job.name, " \u0E41\u0E25\u0E49\u0E27"), ask && ask.id === l.id ? React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        borderTop: "1px solid var(--border)",
        paddingTop: 10
      }
    }, React.createElement("span", {
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
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        borderTop: "1px solid var(--border)",
        paddingTop: 10
      }
    }, React.createElement("button", {
      onClick: () => setLog(l),
      style: leadBtn("var(--primary)", true)
    }, React.createElement(Icon, {
      name: "phone",
      size: 14,
      color: "#fff"
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"), onOpenQuote && React.createElement("button", {
      onClick: () => onOpenQuote(l, lq || null),
      style: leadBtn("#EC4899")
    }, React.createElement(Icon, {
      name: "file",
      size: 14,
      color: "#EC4899"
    }), " ", lq ? "ใบเสนอราคา " + lq.no : "ทำใบเสนอราคา"), onOpenSurvey && React.createElement("button", {
      onClick: () => onOpenSurvey(window.leadAsJob(l)),
      style: leadBtn("var(--text-2)")
    }, React.createElement(Icon, {
      name: "list",
      size: 14,
      color: "var(--text-2)"
    }), " ", st.state === "none" ? "เริ่มแบบสำรวจ" : "ดู / แก้แบบสำรวจ"), onReport && st.state !== "none" && React.createElement("button", {
      onClick: () => onReport(window.leadAsJob(l)),
      style: leadBtn("var(--primary-dark)")
    }, React.createElement(Icon, {
      name: "file",
      size: 14,
      color: "var(--primary-dark)"
    }), " \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \xB7 PDF"), canConvert && sKey !== "won" && React.createElement("button", {
      onClick: () => setAsk({
        id: l.id,
        kind: "conv"
      }),
      style: leadBtn("var(--tint-green-tx)", true)
    }, React.createElement(Icon, {
      name: "check",
      size: 14,
      color: "#fff",
      sw: 2.4
    }), " \u0E41\u0E1B\u0E25\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"), sKey !== "lost" && sKey !== "won" && React.createElement("button", {
      onClick: () => setStage(l, "lost"),
      style: leadBtn("var(--text-2)")
    }, "\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"), sKey === "lost" && React.createElement("button", {
      onClick: () => setStage(l, "nego"),
      style: leadBtn("var(--text-2)")
    }, "\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E44\u0E25\u0E48\u0E15\u0E48\u0E2D"), React.createElement("button", {
      onClick: () => setEdit({
        lead: Object.assign({}, l),
        isNew: false
      }),
      style: leadBtn("var(--text-2)")
    }, "\u0E41\u0E01\u0E49\u0E44\u0E02"), React.createElement("button", {
      onClick: () => setAsk({
        id: l.id,
        kind: "del"
      }),
      style: leadBtn("#EF4444")
    }, "\u0E25\u0E1A")));
  }))), edit && React.createElement(LeadModal, {
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
    const arr = (users || []).filter(u => u.active !== false && window.hasRole && window.hasRole(window.userRoles(u), "sales")).map(u => ({
      id: u.id,
      name: u.name || u.username || "—"
    }));
    if (initial.ownerId && !arr.some(x => x.id === initial.ownerId)) arr.push({
      id: initial.ownerId,
      name: (initial.ownerName || "") + " (ไม่ใช่เซลล์แล้ว)"
    });
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
  }, u.name)))), React.createElement("div", {
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
Object.assign(window, {
  SurveyView,
  LeadsView,
  LeadModal,
  ContactLogModal
});