const OM_INPUT = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13.5,
  boxSizing: "border-box"
};
function OmPill({
  th,
  color,
  sub
}) {
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      whiteSpace: "nowrap",
      fontSize: 11.5,
      fontWeight: 700,
      color: color,
      background: color + "1a",
      borderRadius: 99,
      padding: "3px 10px"
    }
  }, th, sub && React.createElement("span", {
    style: {
      fontWeight: 500,
      opacity: 0.85
    }
  }, sub));
}
function OmStat({
  label,
  value,
  color,
  hint,
  on,
  onClick
}) {
  return React.createElement("button", {
    type: "button",
    onClick: onClick,
    disabled: !onClick,
    style: {
      flex: 1,
      minWidth: 108,
      textAlign: "left",
      padding: "11px 13px",
      borderRadius: 12,
      fontFamily: "inherit",
      background: on ? (color || "var(--primary)") + "14" : "var(--surface2)",
      border: "1px solid " + (on ? color || "var(--primary)" : "var(--border)"),
      cursor: onClick ? "pointer" : "default"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, label), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 22,
      fontWeight: 800,
      color: color,
      lineHeight: 1.2
    }
  }, value), hint && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, hint));
}
function OmWarrantyBar({
  w
}) {
  const st = window.omWarrantyState(w);
  const total = ((+w.years || 0) * 12 + (+w.months || 0)) * 30.4;
  const left = st.key === "expired" ? 0 : Math.max(0, Math.min(1, total ? st.days / total : 0));
  return React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 99,
      background: "var(--border)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      height: "100%",
      width: (left * 100).toFixed(1) + "%",
      background: st.color,
      borderRadius: 99
    }
  }));
}
function OmWarrantyTable({
  site,
  disabled,
  onChange
}) {
  const list = window.omWarrantyList(site);
  const setW = (id, fields) => {
    const w = Object.assign({}, site.warranties || {});
    w[id] = Object.assign({}, w[id], fields);
    onChange(w);
  };
  const add = () => {
    const id = window.omNewId("OW");
    const w = Object.assign({}, site.warranties || {});
    w[id] = {
      id,
      kind: "other",
      label: "",
      years: 1,
      months: 0,
      start: site.comDate || window.drToday(),
      note: ""
    };
    onChange(w);
  };
  const del = id => {
    const w = Object.assign({}, site.warranties || {});
    delete w[id];
    onChange(w);
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, !list.length && React.createElement("div", {
    style: {
      padding: "14px 6px",
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19"), list.map(w => {
    const st = window.omWarrantyState(w);
    const kind = window.OM_WARRANTY_KIND_BY[w.kind] || window.OM_WARRANTY_KIND_BY.other;
    return React.createElement("div", {
      key: w.id,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        padding: "11px 12px"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 9,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: kind.color,
        flexShrink: 0
      }
    }), React.createElement("input", {
      value: w.label || "",
      disabled: disabled,
      placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19",
      onChange: e => setW(w.id, {
        label: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        flex: 1,
        minWidth: 130,
        width: "auto",
        padding: "7px 10px",
        fontSize: 13,
        fontWeight: 700
      })
    }), React.createElement(OmPill, {
      th: st.th,
      color: st.color
    }), !disabled && React.createElement("button", {
      type: "button",
      onClick: () => del(w.id),
      title: "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E19\u0E35\u0E49",
      style: {
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface2)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 13
    }))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(116px, 1fr))",
        gap: 8,
        marginBottom: 9
      }
    }, React.createElement("label", {
      style: {
        display: "block"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 700,
        marginBottom: 3
      }
    }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), React.createElement("select", {
      value: w.kind || "other",
      disabled: disabled,
      onChange: e => setW(w.id, {
        kind: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5
      })
    }, window.OM_WARRANTY_KIND.map(k => React.createElement("option", {
      key: k.key,
      value: k.key
    }, k.th)))), React.createElement("label", {
      style: {
        display: "block"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 700,
        marginBottom: 3
      }
    }, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E04\u0E38\u0E49\u0E21\u0E04\u0E23\u0E2D\u0E07"), React.createElement("input", {
      type: "date",
      value: w.start || "",
      disabled: disabled,
      onChange: e => setW(w.id, {
        start: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)"
      })
    })), React.createElement("label", {
      style: {
        display: "block"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 700,
        marginBottom: 3
      }
    }, "\u0E01\u0E35\u0E48\u0E1B\u0E35"), React.createElement("input", {
      value: String(w.years == null ? "" : w.years),
      disabled: disabled,
      inputMode: "numeric",
      onChange: e => setW(w.id, {
        years: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)",
        textAlign: "right"
      })
    })), React.createElement("label", {
      style: {
        display: "block"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 700,
        marginBottom: 3
      }
    }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01\u0E01\u0E35\u0E48\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("input", {
      value: String(w.months == null ? "" : w.months),
      disabled: disabled,
      inputMode: "numeric",
      onChange: e => setW(w.id, {
        months: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)",
        textAlign: "right"
      })
    }))), React.createElement(OmWarrantyBar, {
      w: w
    }), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        marginTop: 6,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E04\u0E38\u0E49\u0E21\u0E04\u0E23\u0E2D\u0E07\u0E16\u0E36\u0E07 ", React.createElement("b", {
      style: {
        color: "var(--text-2)",
        fontFamily: "var(--mono)"
      }
    }, st.end ? window.drDateTH(st.end) : "—")), React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: st.color
      }
    }, window.omWarrantyLeftTH(w))));
  }), !disabled && React.createElement("button", {
    type: "button",
    onClick: add,
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19"));
}
function OmCleanVisits({
  site,
  visits,
  store,
  disabled
}) {
  const list = React.useMemo(() => (visits || []).slice().sort((a, b) => String(b.date || b.due || "").localeCompare(String(a.date || a.due || ""))), [visits]);
  const cs = window.omCleanState(site, visits);
  const freeLeft = window.omFreeLeft(site, visits);
  const backlog = window.omCleanBacklog(site, visits);
  const open = window.omOpenVisit(visits);
  const book = () => {
    if (disabled) return;
    store.save(window.omBlankCleanVisit(site, cs.due || window.drToday(), visits, window.DR_ME && window.DR_ME.user));
  };
  const setV = (v, fields) => {
    if (!disabled) store.patch(site.id, v.id, fields);
  };
  const done = v => setV(v, {
    status: "done",
    date: v.date || window.drToday(),
    doneAt: new Date().toISOString(),
    doneBy: ((window.DR_ME || {}).user || {}).id || null
  });
  return React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "10px 12px",
      flexWrap: "wrap",
      border: "1px solid " + cs.color + "40",
      background: cs.color + "12",
      borderRadius: 11,
      marginBottom: 12
    }
  }, React.createElement(Icon, {
    name: "panel",
    size: 16,
    color: cs.color
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 150,
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, React.createElement("b", {
    style: {
      color: cs.color
    }
  }, cs.th), cs.due ? " · " + window.drDateTH(cs.due) : "", backlog > 1 ? " · ตกรอบไปแล้ว " + backlog + " ครั้ง" : "", React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E49\u0E32\u0E07\u0E1F\u0E23\u0E35\u0E40\u0E2B\u0E25\u0E37\u0E2D ", freeLeft, " \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E08\u0E32\u0E01 ", omFreeTotal(site), " \u0E04\u0E23\u0E31\u0E49\u0E07", window.omLastClean(visits) ? " · ล้างล่าสุด " + window.drShort(window.omLastClean(visits)) : " · ยังไม่เคยล้าง")), !disabled && !open && React.createElement("button", {
    onClick: book,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 13px",
      borderRadius: 9,
      border: "none",
      background: cs.color,
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "calendar",
    size: 14,
    color: "#fff"
  }), " \u0E08\u0E2D\u0E07\u0E04\u0E34\u0E27\u0E25\u0E49\u0E32\u0E07")), list.map(v => {
    const s = window.omCleanStatusOf(v.status);
    const lock = disabled || v.status === "done";
    return React.createElement("div", {
      key: v.id,
      style: {
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        padding: "10px 12px",
        marginBottom: 9
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: lock ? 0 : 9,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: s.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, v.date ? window.drDateTH(v.date) : "—", v.timeFrom ? React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontWeight: 500,
        color: "var(--text-3)"
      }
    }, " ", v.timeFrom, "\u2013", v.timeTo) : null), React.createElement(OmPill, {
      th: s.th,
      color: s.color
    }), React.createElement(OmPill, {
      th: v.free ? "ล้างฟรีตามสัญญา" : "คิดค่าบริการ",
      color: v.free ? "#10B981" : "#F59E0B"
    }), !disabled && React.createElement("button", {
      onClick: () => store.remove(site.id, v.id),
      title: "\u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E31\u0E14\u0E19\u0E35\u0E49",
      style: {
        marginLeft: "auto",
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--surface2)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 13
    }))), !lock && React.createElement(React.Fragment, null, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(108px, 1fr))",
        gap: 8
      }
    }, React.createElement("input", {
      type: "date",
      value: v.date || "",
      onChange: e => setV(v, {
        date: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)"
      })
    }), React.createElement("input", {
      type: "time",
      value: v.timeFrom || "",
      onChange: e => setV(v, {
        timeFrom: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)"
      })
    }), React.createElement("input", {
      type: "time",
      value: v.timeTo || "",
      onChange: e => setV(v, {
        timeTo: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)"
      })
    }), React.createElement("input", {
      value: v.charge == null ? "" : String(v.charge),
      inputMode: "decimal",
      placeholder: "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
      onChange: e => {
        const t = e.target.value.replace(/[^0-9.]/g, "");
        setV(v, {
          charge: t === "" ? null : +t,
          free: t === "" ? v.free : false
        });
      },
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        fontFamily: "var(--mono)",
        textAlign: "right"
      })
    })), React.createElement("input", {
      value: v.note || "",
      placeholder: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38 \u0E40\u0E0A\u0E48\u0E19 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19 \xB7 \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E01\u0E23\u0E30\u0E40\u0E0A\u0E49\u0E32",
      onChange: e => setV(v, {
        note: e.target.value
      }),
      style: Object.assign({}, OM_INPUT, {
        padding: "7px 9px",
        fontSize: 12.5,
        marginTop: 8
      })
    }), React.createElement("div", {
      style: {
        display: "flex",
        gap: 7,
        marginTop: 9,
        flexWrap: "wrap"
      }
    }, React.createElement("button", {
      onClick: () => done(v),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 13px",
        borderRadius: 9,
        border: "none",
        background: "#10B981",
        color: "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700
      }
    }, React.createElement(Icon, {
      name: "check",
      size: 14,
      color: "#fff"
    }), " \u0E25\u0E49\u0E32\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27"), React.createElement("button", {
      onClick: () => setV(v, {
        free: !v.free
      }),
      style: {
        padding: "7px 13px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface2)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, v.free ? "เปลี่ยนเป็นคิดเงิน" : "เปลี่ยนเป็นล้างฟรี"), React.createElement("button", {
      onClick: () => setV(v, {
        status: "skipped"
      }),
      style: {
        padding: "7px 13px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface2)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E02\u0E49\u0E32\u0E21\u0E23\u0E2D\u0E1A\u0E19\u0E35\u0E49"))), v.status === "done" && v.note && React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        marginTop: 5
      }
    }, v.note));
  }), !list.length && React.createElement("div", {
    style: {
      padding: "12px 6px",
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07"));
}
const omFreeTotal = site => ((site || {}).clean || {}).freeCount || 0;
function OmSiteModal({
  site,
  job,
  role,
  visits,
  cleanStore,
  onClose,
  onPatch,
  onRemove
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const disabled = !window.omCanWrite(role, null);
  const canDelete = window.omCanDelete(role);
  const [delAsk, setDelAsk] = React.useState(false);
  if (!site) return null;
  const st = window.omSiteWarrantyState(site);
  const clean = site.clean || window.omBlankClean(site.comDate);
  const set = fields => {
    if (!disabled) onPatch(site.id, fields);
  };
  const setClean = fields => set({
    clean: Object.assign({}, clean, fields)
  });
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 90,
      background: "rgba(8,20,26,.5)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: isMobile ? "flex-end" : "center",
      justifyContent: "center",
      padding: isMobile ? 0 : 24
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: 760,
      maxHeight: isMobile ? "94vh" : "88vh",
      overflowY: "auto",
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: isMobile ? "18px 18px 0 0" : 18,
      boxShadow: "0 24px 60px rgba(0,0,0,.28)"
    }
  }, React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: "var(--bg)",
      borderBottom: "1px solid var(--border)",
      padding: isMobile ? "14px 13px" : "16px 20px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: st.color + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "shield",
    size: 18,
    color: st.color
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, site.name || "(ยังไม่ได้ตั้งชื่อไซต์)"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, site.code, " \xB7 ", window.omIsExternal(site.id) ? "ไซต์นอกระบบ" : "งานติดตั้งของเรา", typeof site.kw === "number" && site.kw > 0 ? " · " + site.kw + " kW" : "")), React.createElement(OmPill, {
    th: st.th,
    color: st.color
  }), React.createElement("button", {
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  })))), React.createElement("div", {
    style: {
      padding: isMobile ? "14px 13px 24px" : "18px 20px 26px"
    }
  }, disabled && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 13px",
      marginBottom: 14,
      border: "1px solid var(--border)",
      background: "var(--surface2)",
      borderRadius: 12
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E14\u0E39\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E41\u0E01\u0E49\u0E07\u0E32\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E2B\u0E25\u0E31\u0E07\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22")), site.source === "job" && !job && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 13px",
      marginBottom: 14,
      border: "1px solid #F59E0B40",
      background: "#F59E0B14",
      borderRadius: 12
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E07\u0E32\u0E19\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E15\u0E48\u0E2D\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2B\u0E21\u0E14")), React.createElement(window.DrSection, {
    n: "1",
    title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E0B\u0E15\u0E4C",
    hint: site.tech ? "" : "ยังไม่ได้ระบุช่างผู้ดูแล"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E0B\u0E15\u0E4C / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement("input", {
    value: site.name || "",
    disabled: disabled,
    onChange: e => set({
      name: e.target.value
    }),
    style: OM_INPUT
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D"), React.createElement("input", {
    value: site.phone || "",
    disabled: disabled,
    onChange: e => set({
      phone: e.target.value
    }),
    style: Object.assign({}, OM_INPUT, {
      fontFamily: "var(--mono)"
    })
  }))), React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, React.createElement(window.DrLabel, null, "\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07"), React.createElement(window.DrText, {
    value: site.address,
    disabled: disabled,
    rows: 2,
    onChange: v => set({
      address: v
    })
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 10,
      marginTop: 12
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14"), React.createElement("input", {
    value: site.province || "",
    disabled: disabled,
    onChange: e => set({
      province: e.target.value
    }),
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontSize: 12.5
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E02\u0E19\u0E32\u0E14 (kW)"), React.createElement("input", {
    value: String(site.kw == null ? "" : site.kw),
    disabled: disabled,
    inputMode: "decimal",
    onChange: e => {
      const v = e.target.value.replace(/[^0-9.]/g, "");
      set({
        kw: v === "" ? null : +v
      });
    },
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontSize: 12.5,
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07"), React.createElement("input", {
    value: String(site.panels == null ? "" : site.panels),
    disabled: disabled,
    inputMode: "numeric",
    onChange: e => {
      const v = e.target.value.replace(/[^0-9]/g, "");
      set({
        panels: v === "" ? null : +v
      });
    },
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontSize: 12.5,
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D"), React.createElement("input", {
    value: site.brand || "",
    disabled: disabled,
    onChange: e => set({
      brand: e.target.value
    }),
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontSize: 12.5
    })
  })))), React.createElement(window.DrSection, {
    n: "2",
    title: "\u0E27\u0E31\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08",
    tone: "#0EA5E9",
    hint: "ประกันทุกรายการเริ่มนับจากวันนี้ · " + (window.OM_COMSRC_TH[site.comSrc] || "")
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("input", {
    type: "date",
    value: site.comDate || "",
    disabled: disabled,
    onChange: e => {
      if (e.target.value) set(window.omSetComDate(site, e.target.value, "confirmed"));
    },
    style: Object.assign({}, OM_INPUT, {
      width: "auto",
      padding: "8px 11px",
      fontFamily: "var(--mono)",
      fontSize: 13
    })
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, site.comDate ? window.drDateTH(site.comDate, true) : "—")), window.omComUnsure(site) && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginTop: 11,
      padding: "10px 12px",
      border: "1px solid #F59E0B40",
      background: "#F59E0B14",
      borderRadius: 11
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: "#F59E0B"
  }), React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E27\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 (", window.OM_COMSRC_TH[site.comSrc] || "ไม่ทราบที่มา", ") \u0E01\u0E23\u0E38\u0E13\u0E32\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19"), !disabled && React.createElement("button", {
    onClick: () => set(window.omSetComDate(site, site.comDate, "confirmed")),
    style: {
      padding: "6px 12px",
      borderRadius: 9,
      border: "none",
      background: "#F59E0B",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E16\u0E39\u0E01\u0E41\u0E25\u0E49\u0E27"))), React.createElement(window.DrSection, {
    n: "3",
    title: "\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19",
    tone: "#1B9B75",
    hint: "เตือนล่วงหน้า " + window.OM_WARN_DAYS + " วันก่อนหมด"
  }, React.createElement(OmWarrantyTable, {
    site: site,
    disabled: disabled,
    onChange: w => set({
      warranties: w
    })
  })), React.createElement(window.DrSection, {
    n: "4",
    title: "\u0E23\u0E2D\u0E1A\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07",
    tone: "#0EA5E9",
    hint: (() => {
      const cs = window.omCleanState(site, visits);
      return cs.due ? cs.th + " · " + window.drShort(cs.due) : cs.th;
    })()
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginBottom: 13
    }
  }, React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: () => setClean({
      on: !clean.on
    }),
    style: {
      padding: "7px 13px",
      borderRadius: 99,
      cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      border: "1px solid " + (clean.on ? "#0EA5E9" : "var(--border-strong)"),
      background: clean.on ? "#0EA5E91e" : "var(--surface)",
      color: clean.on ? "#0EA5E9" : "var(--text-2)"
    }
  }, clean.on ? "อยู่ในรอบล้างแผง" : "ไม่อยู่ในรอบล้างแผง")), clean.on && React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E25\u0E49\u0E32\u0E07\u0E17\u0E38\u0E01\u0E01\u0E35\u0E48\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("input", {
    value: String(clean.everyMon == null ? "" : clean.everyMon),
    disabled: disabled,
    inputMode: "numeric",
    onChange: e => setClean({
      everyMon: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0
    }),
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E0D\u0E0D\u0E32"
  }, "\u0E25\u0E49\u0E32\u0E07\u0E1F\u0E23\u0E35\u0E01\u0E35\u0E48\u0E04\u0E23\u0E31\u0E49\u0E07"), React.createElement("input", {
    value: String(clean.freeCount == null ? "" : clean.freeCount),
    disabled: disabled,
    inputMode: "numeric",
    onChange: e => setClean({
      freeCount: +e.target.value.replace(/[^0-9]/g, "").slice(0, 2) || 0
    }),
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  })), React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01"
  }, "\u0E04\u0E23\u0E1A\u0E23\u0E2D\u0E1A\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: clean.firstDue || "",
    disabled: disabled,
    onChange: e => setClean({
      firstDue: e.target.value
    }),
    style: Object.assign({}, OM_INPUT, {
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  }))), clean.on && React.createElement(OmCleanVisits, {
    site: site,
    visits: visits,
    store: cleanStore,
    disabled: disabled,
    role: role
  })), React.createElement(window.DrSection, {
    n: "5",
    title: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    tone: "#94A3B8"
  }, React.createElement(window.DrText, {
    value: site.note,
    disabled: disabled,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E2A\u0E39\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E01\u0E23\u0E30\u0E40\u0E0A\u0E49\u0E32 \xB7 \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E2A\u0E30\u0E14\u0E27\u0E01\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E27\u0E31\u0E19\u0E40\u0E2A\u0E32\u0E23\u0E4C",
    onChange: v => set({
      note: v
    })
  })), canDelete && (delAsk ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "12px 13px",
      flexWrap: "wrap",
      border: "1px solid #EF444440",
      background: "#EF44440e",
      borderRadius: 12
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 160,
      fontSize: 12.5,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, "\u0E25\u0E1A\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07 ", site.code, "? \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E23\u0E2D\u0E1A\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E2B\u0E32\u0E22\u0E16\u0E32\u0E27\u0E23 (\u0E43\u0E1A\u0E07\u0E32\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E41\u0E15\u0E30)"), React.createElement("button", {
    onClick: () => setDelAsk(false),
    style: {
      padding: "7px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: () => {
      onRemove(site.id);
      onClose();
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 13px",
      borderRadius: 9,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#fff"
  }), " \u0E25\u0E1A\u0E40\u0E25\u0E22")) : React.createElement("button", {
    onClick: () => setDelAsk(true),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#EF4444"
  }), " \u0E25\u0E1A\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19)")))));
}
const OM_TH_MONTH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
function OmCleanView({
  sites,
  cleanStore,
  role,
  onOpenSite
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.drToday();
  const now = React.useMemo(() => new Date(today + "T00:00:00"), [today]);
  const [ym, setYm] = React.useState(() => ({
    y: now.getFullYear(),
    m: now.getMonth()
  }));
  const [sel, setSel] = React.useState(today);
  const canWrite = window.omCanWrite(role, null);
  const agenda = React.useMemo(() => window.omCleanAgenda(sites, cleanStore.bySite, today), [sites, cleanStore.bySite, today]);
  const byDate = React.useMemo(() => {
    const m = {};
    agenda.forEach(a => {
      (m[a.date] = m[a.date] || []).push(a);
    });
    return m;
  }, [agenda]);
  const pad = n => String(n).padStart(2, "0");
  const keyOf = d => ym.y + "-" + pad(ym.m + 1) + "-" + pad(d);
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const startDow = new Date(ym.y, ym.m, 1).getDay();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const shift = n => setYm(s => {
    const d = new Date(s.y, s.m + n, 1);
    return {
      y: d.getFullYear(),
      m: d.getMonth()
    };
  });
  const monthCount = agenda.filter(a => a.date.slice(0, 7) === ym.y + "-" + pad(ym.m + 1)).length;
  const selList = byDate[sel] || [];
  const toneOf = a => {
    if (!a.virtual) return window.omCleanStatusOf(a.status).color;
    const d = window.omDiffDays(today, a.date);
    return d < -7 ? "#EF4444" : d <= 0 ? "#F59E0B" : "#94A3B8";
  };
  const bookOn = a => {
    if (!canWrite) return;
    const vs = (cleanStore.bySite || {})[a.site.id] || [];
    const rec = window.omBlankCleanVisit(a.site, a.date, vs, window.DR_ME && window.DR_ME.user);
    cleanStore.save(rec);
  };
  const dayPanel = React.createElement("div", {
    className: "pnl",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 11
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.drDateTH(sel, true)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, selList.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), !selList.length && React.createElement("div", {
    style: {
      padding: "26px 8px",
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E34\u0E27\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07"), selList.map((a, i) => {
    const c = toneOf(a);
    return React.createElement("div", {
      key: a.site.id + "-" + i,
      style: {
        border: "1px solid var(--border)",
        borderLeft: "3px solid " + c,
        borderRadius: 11,
        background: "var(--surface)",
        padding: "10px 12px"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, a.site.name || a.site.code), React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        marginBottom: 7
      }
    }, a.site.code, a.site.province ? " · " + a.site.province : "", a.visit && a.visit.timeFrom ? " · " + a.visit.timeFrom + "–" + a.visit.timeTo : ""), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        alignItems: "center"
      }
    }, React.createElement(OmPill, {
      th: a.virtual ? "ถึงรอบ ยังไม่จองคิว" : window.omCleanStatusOf(a.status).th,
      color: c
    }), a.visit && React.createElement(OmPill, {
      th: a.visit.free ? "ล้างฟรี" : "คิดค่าบริการ",
      color: a.visit.free ? "#10B981" : "#F59E0B"
    }), a.virtual && canWrite && React.createElement("button", {
      onClick: () => bookOn(a),
      style: {
        padding: "6px 12px",
        borderRadius: 9,
        border: "none",
        background: c,
        color: "#fff",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700
      }
    }, "\u0E08\u0E2D\u0E07\u0E04\u0E34\u0E27\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("button", {
      onClick: () => onOpenSite(a.site.id),
      style: {
        padding: "6px 12px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface2)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E40\u0E1B\u0E34\u0E14\u0E44\u0E0B\u0E15\u0E4C")));
  }));
  return React.createElement("div", {
    style: {
      display: isMobile ? "flex" : "grid",
      flexDirection: "column",
      gridTemplateColumns: isMobile ? undefined : "1fr 360px",
      gap: 16,
      alignItems: "start"
    }
  }, React.createElement("div", {
    className: "pnl"
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, OM_TH_MONTH[ym.m], " ", ym.y + 543), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\xB7 ", monthCount, " \u0E04\u0E34\u0E27")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, React.createElement("button", {
    onClick: () => shift(-1),
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E01\u0E48\u0E2D\u0E19",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    style: {
      transform: "rotate(180deg)"
    }
  })), React.createElement("button", {
    onClick: () => shift(1),
    title: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15
  })))), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: 4,
      minWidth: 420
    }
  }, window.TH_DAYS.map((d, i) => React.createElement("div", {
    key: d,
    style: {
      textAlign: "center",
      fontSize: 11.5,
      fontWeight: 700,
      paddingBottom: 4,
      color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)"
    }
  }, d)), cells.map((d, i) => {
    if (d === null) return React.createElement("div", {
      key: i
    });
    const k = keyOf(d);
    const list = byDate[k] || [];
    const isToday = k === today;
    const isSel = k === sel;
    return React.createElement("button", {
      key: i,
      onClick: () => setSel(k),
      style: {
        minHeight: isMobile ? 62 : 92,
        borderRadius: 11,
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
        border: isSel ? "2px solid var(--primary)" : "1px solid " + (isToday ? "var(--primary)" : "var(--border)"),
        background: isSel || isToday ? "var(--primary-soft)" : "var(--surface2)",
        padding: 7,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: isToday || isSel ? 800 : 600,
        color: isToday || isSel ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, d), list.slice(0, 3).map((a, k2) => {
      const c = toneOf(a);
      return React.createElement("span", {
        key: k2,
        title: (a.site.name || a.site.code) + (a.virtual ? " · ถึงรอบ ยังไม่จองคิว" : ""),
        style: {
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderRadius: 6,
          padding: "1px 4px",
          background: c + "1f",
          overflow: "hidden"
        }
      }, React.createElement("span", {
        style: {
          width: 6,
          height: 6,
          borderRadius: 99,
          background: c,
          flexShrink: 0,
          border: a.virtual ? "1px solid " + c : "none",
          opacity: a.virtual ? 0.55 : 1
        }
      }), React.createElement("span", {
        style: {
          fontSize: 9.5,
          fontWeight: 600,
          color: "var(--text-2)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      }, String(a.site.name || a.site.code).replace("บ้าน", "").replace("คุณ", "")));
    }), list.length > 3 && React.createElement("span", {
      style: {
        fontSize: 9,
        color: "var(--text-3)"
      }
    }, "+", list.length - 3));
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      marginTop: 12,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, [["#F59E0B", "ถึงรอบ ยังไม่จองคิว"], ["#EF4444", "เลยกำหนดเกิน 7 วัน"], ["#0EA5E9", "จองคิวแล้ว"], ["#10B981", "ล้างแล้ว"]].map(([c, th]) => React.createElement("span", {
    key: th,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: c
    }
  }), th)))), dayPanel);
}
function OmView({
  jobs,
  role,
  currentUser
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const {
    sites,
    loading,
    upsert,
    patch,
    remove
  } = window.useOmSites();
  const cleanStore = window.useOmCleanVisits();
  const [tab, setTab] = React.useState("sites");
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [open, setOpen] = React.useState(null);
  const [enrolling, setEnrolling] = React.useState(false);
  const canWrite = window.omCanWrite(role, null);
  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach(j => {
      if (j && j.id) m[j.id] = j;
    });
    return m;
  }, [jobs]);
  const pending = React.useMemo(() => window.omEnrollable(jobs, sites), [jobs, sites]);
  const roll = React.useMemo(() => window.omRollup(sites, cleanStore.bySite), [sites, cleanStore.bySite]);
  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = (sites || []).map(s => ({
      site: s,
      st: window.omSiteWarrantyState(s),
      cs: window.omCleanState(s, (cleanStore.bySite || {})[s.id] || [])
    })).filter(r => {
      if (filter === "unsure" && !window.omComUnsure(r.site)) return false;
      if ((filter === "soon" || filter === "expired") && r.st.key !== filter) return false;
      if (filter === "cleanDue") {
        const k = window.omCleanState(r.site, (cleanStore.bySite || {})[r.site.id] || []).key;
        if (k !== "due" && k !== "overdue") return false;
      }
      if (!kw) return true;
      return [r.site.name, r.site.code, r.site.province, r.site.address, r.site.phone].some(v => String(v || "").toLowerCase().includes(kw));
    });
    const rank = {
      expired: 0,
      soon: 1,
      active: 2,
      none: 3
    };
    out.sort((a, b) => rank[a.st.key] - rank[b.st.key] || a.st.days - b.st.days);
    return out;
  }, [sites, q, filter, cleanStore.bySite]);
  const enrollAll = () => {
    if (!canWrite || !pending.length) return;
    setEnrolling(true);
    pending.forEach(j => upsert(window.omSiteFromJob(j, currentUser)));
    setEnrolling(false);
  };
  const addExternal = () => {
    if (!canWrite) return;
    const rec = window.omBlankSite(sites, currentUser);
    upsert(rec);
    setOpen(rec.id);
  };
  const tog = k => setFilter(filter === k ? "" : k);
  const cur = (sites || []).find(s => s.id === open) || null;
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
  }, React.createElement(OmStat, {
    label: "\u0E44\u0E0B\u0E15\u0E4C\u0E43\u0E19\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23",
    value: roll.total,
    color: "var(--text-1)",
    hint: roll.kwSites ? roll.kw.toFixed(1) + " kW (เฉพาะไซต์ที่มีข้อมูลขนาดระบบ)" : ""
  }), React.createElement(OmStat, {
    label: "\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19",
    value: roll.warnSoon,
    color: "#F59E0B",
    hint: "เหลือไม่เกิน " + window.OM_WARN_DAYS + " วัน",
    on: filter === "soon",
    onClick: () => tog("soon")
  }), React.createElement(OmStat, {
    label: "\u0E2B\u0E21\u0E14\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E41\u0E25\u0E49\u0E27",
    value: roll.warnExpired,
    color: "#EF4444",
    on: filter === "expired",
    onClick: () => tog("expired")
  }), React.createElement(OmStat, {
    label: "\u0E27\u0E31\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19",
    value: roll.unsure,
    color: "#7C5CFC",
    on: filter === "unsure",
    onClick: () => tog("unsure")
  }), React.createElement(OmStat, {
    label: "\u0E16\u0E36\u0E07\u0E23\u0E2D\u0E1A\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07",
    value: roll.cleanDue + roll.cleanOverdue,
    color: roll.cleanOverdue ? "#EF4444" : "#F59E0B",
    hint: roll.cleanOverdue ? "เลยกำหนด " + roll.cleanOverdue + " ไซต์" : "จองคิวแล้ว " + roll.cleanBooked + " ไซต์",
    on: filter === "cleanDue",
    onClick: () => {
      setTab("sites");
      tog("cleanDue");
    }
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, [["sites", "ทะเบียนไซต์", "list"], ["clean", "ปฏิทินล้างแผง", "calendar"]].map(([k, th, ic]) => React.createElement("button", {
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
  }), " ", th))), tab === "clean" && React.createElement(OmCleanView, {
    sites: sites,
    cleanStore: cleanStore,
    role: role,
    onOpenSite: id => setOpen(id)
  }), tab === "sites" && !!pending.length && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "12px 14px",
      flexWrap: "wrap",
      border: "1px solid #1B9B7540",
      background: "#1B9B7512",
      borderRadius: 14
    }
  }, React.createElement(Icon, {
    name: "wrench",
    size: 17,
    color: "#1B9B75"
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 180,
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E02\u0E36\u0E49\u0E19\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 ", React.createElement("b", null, pending.length), " \u0E07\u0E32\u0E19", React.createElement("span", {
    style: {
      display: "block",
      color: "var(--text-3)",
      fontSize: 11.5
    }
  }, pending.slice(0, 4).map(j => j.code).join(" · "), pending.length > 4 ? " · อีก " + (pending.length - 4) : "")), canWrite && React.createElement("button", {
    onClick: enrollAll,
    disabled: enrolling,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 10,
      border: "none",
      background: "#1B9B75",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "#fff"
  }), " \u0E02\u0E36\u0E49\u0E19\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), tab === "sites" && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 180
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      left: 11,
      top: "50%",
      transform: "translateY(-50%)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  })), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E0B\u0E15\u0E4C \xB7 \u0E23\u0E2B\u0E31\u0E2A \xB7 \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14 \xB7 \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23",
    style: Object.assign({}, OM_INPUT, {
      padding: "9px 12px 9px 34px",
      fontSize: 13
    })
  })), canWrite && React.createElement("button", {
    onClick: addExternal,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 14px",
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E0B\u0E15\u0E4C\u0E19\u0E2D\u0E01\u0E23\u0E30\u0E1A\u0E1A")), tab === "sites" && React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 14,
      background: "var(--surface2)",
      overflow: "hidden"
    }
  }, loading && React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."), !loading && !rows.length && React.createElement("div", {
    style: {
      padding: 24,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, sites.length ? "ไม่มีไซต์ที่ตรงกับที่ค้นหา" : "ยังไม่มีไซต์ในสัญญาบริการ — ขึ้นทะเบียนจากงานที่ติดตั้งเสร็จ หรือเพิ่มไซต์นอกระบบ"), rows.map(r => {
    const s = r.site;
    const unsure = window.omComUnsure(s);
    return React.createElement("button", {
      key: s.id,
      onClick: () => setOpen(s.id),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: isMobile ? "11px 12px" : "13px 16px",
        borderBottom: "1px solid var(--border)",
        background: "none",
        border: "none",
        borderTop: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: r.st.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, s.name || "(ยังไม่ได้ตั้งชื่อไซต์)"), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, s.code, s.province ? " · " + s.province : "", typeof s.kw === "number" && s.kw > 0 ? " · " + s.kw + " kW" : "", s.comDate ? " · ติดตั้งเสร็จ " + window.drShort(s.comDate) : "")), r.cs && (r.cs.key === "due" || r.cs.key === "overdue" || r.cs.key === "booked") && React.createElement(OmPill, {
      th: r.cs.th,
      color: r.cs.color,
      sub: r.cs.due ? "· " + window.drShort(r.cs.due) : ""
    }), unsure && React.createElement(OmPill, {
      th: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E31\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08",
      color: "#7C5CFC"
    }), React.createElement(OmPill, {
      th: r.st.th,
      color: r.st.color,
      sub: r.st.key === "none" ? "" : "· " + window.omDaysTH(r.st)
    }), React.createElement(Icon, {
      name: "chevronRight",
      size: 15,
      color: "var(--text-3)"
    }));
  })), cur && React.createElement(OmSiteModal, {
    site: cur,
    job: jobById[cur.id] || null,
    role: role,
    visits: (cleanStore.bySite || {})[cur.id] || [],
    cleanStore: cleanStore,
    onClose: () => setOpen(null),
    onPatch: patch,
    onRemove: remove
  }));
}
Object.assign(window, {
  OM_INPUT,
  OmPill,
  OmStat,
  OmWarrantyBar,
  OmWarrantyTable,
  OmCleanVisits,
  OmCleanView,
  OmSiteModal,
  OmView
});