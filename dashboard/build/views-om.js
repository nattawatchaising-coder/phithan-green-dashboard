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
function OmSiteModal({
  site,
  job,
  role,
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
    title: "\u0E27\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A\u0E07\u0E32\u0E19",
    tone: "#0EA5E9",
    hint: window.OM_COMSRC_TH[site.comSrc] || ""
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
    onChange: e => set({
      comDate: e.target.value,
      comSrc: "confirmed"
    }),
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
    onClick: () => set({
      comSrc: "confirmed"
    }),
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
    hint: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E23\u0E2D\u0E1A\u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E2B\u0E19\u0E49\u0E32\u0E15\u0E32\u0E23\u0E32\u0E07\u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E08\u0E30\u0E21\u0E32\u0E43\u0E19\u0E02\u0E31\u0E49\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B"
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
  }))), clean.on && site.comDate && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 9
    }
  }, "\u0E19\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E27\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A ", window.drShort(site.comDate), " + ", clean.everyMon || 0, " \u0E40\u0E14\u0E37\u0E2D\u0E19 = ", " ", React.createElement("b", {
    style: {
      color: "var(--text-2)",
      fontFamily: "var(--mono)"
    }
  }, window.drShort(window.omAddMonths(site.comDate, clean.everyMon || 0))))), React.createElement(window.DrSection, {
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
  const roll = React.useMemo(() => window.omRollup(sites), [sites]);
  const rows = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    const out = (sites || []).map(s => ({
      site: s,
      st: window.omSiteWarrantyState(s)
    })).filter(r => {
      if (filter === "unsure" && !window.omComUnsure(r.site)) return false;
      if ((filter === "soon" || filter === "expired") && r.st.key !== filter) return false;
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
  }, [sites, q, filter]);
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
    label: "\u0E27\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19",
    value: roll.unsure,
    color: "#7C5CFC",
    on: filter === "unsure",
    onClick: () => tog("unsure")
  })), !!pending.length && React.createElement("div", {
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
  }), " \u0E02\u0E36\u0E49\u0E19\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), React.createElement("div", {
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
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E0B\u0E15\u0E4C\u0E19\u0E2D\u0E01\u0E23\u0E30\u0E1A\u0E1A")), React.createElement("div", {
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
    }, s.code, s.province ? " · " + s.province : "", typeof s.kw === "number" && s.kw > 0 ? " · " + s.kw + " kW" : "", s.comDate ? " · รับมอบ " + window.drShort(s.comDate) : "")), unsure && React.createElement(OmPill, {
      th: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E27\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E21\u0E2D\u0E1A",
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
  OmSiteModal,
  OmView
});