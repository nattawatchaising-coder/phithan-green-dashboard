const LN_CARD = {
  background: "var(--surface)",
  border: "1px solid var(--card-bd)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "var(--r-card)"
};
const LN_LIST_PAD = {
  padding: "0 14px 6px"
};
const lnCardBtn = extra => Object.assign({}, LN_CARD, {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "13px 15px",
  marginBottom: 10,
  cursor: "pointer",
  fontFamily: "inherit"
}, extra || {});
const LN_FIELD = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: "var(--r-tile)",
  border: "none",
  boxShadow: "var(--shadow-inset)",
  background: "var(--surface2)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none"
};
const LN_LABEL = {
  fontSize: 11.5,
  fontWeight: 800,
  color: "var(--text-3)"
};
const LN_BTN = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "var(--r-tile)",
  border: "none",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer"
};
const lnChip = (on, color) => ({
  padding: "9px 14px",
  borderRadius: 99,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: "nowrap",
  border: "none",
  background: on ? color ? color + "16" : "var(--primary-soft)" : "var(--surface)",
  boxShadow: on ? "inset 0 0 0 1px " + (color || "var(--primary)") : "var(--shadow-sm)",
  color: on ? color || "var(--primary-dark)" : "var(--text-2)"
});
function LnField({
  label,
  req,
  hint,
  children
}) {
  return React.createElement("label", {
    style: {
      display: "grid",
      gap: 6,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: LN_LABEL
  }, label, req && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), children, hint && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, hint));
}
const LN_SHEET = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  background: "var(--bg)",
  overflowY: "auto",
  overflowX: "hidden"
};
function LnSheetHead({
  title,
  no,
  onClose,
  right
}) {
  return React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "14px 16px 12px",
      background: "var(--bg)",
      paddingTop: "calc(14px + env(safe-area-inset-top, 0px))"
    }
  }, React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      flexShrink: 0,
      width: 34,
      height: 34,
      borderRadius: 99,
      padding: 0,
      cursor: "pointer",
      border: "none",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 18,
    color: "var(--text-2)"
  })), React.createElement("b", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), right, no && React.createElement("span", {
    style: {
      marginLeft: right ? 0 : "auto",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, no));
}
function LnSub({
  items,
  value,
  onPick
}) {
  const use = (items || []).filter(Boolean);
  if (use.length < 2) return null;
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      padding: 4,
      margin: "0 14px 12px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface3)"
    }
  }, use.map(it => {
    const on = value === it.key;
    return React.createElement("button", {
      key: it.key,
      onClick: () => onPick(it.key),
      style: {
        flex: 1,
        minWidth: 0,
        padding: "9px 4px",
        borderRadius: "var(--r-chip)",
        border: "none",
        cursor: "pointer",
        background: on ? "var(--surface)" : "transparent",
        boxShadow: on ? "var(--shadow-sm)" : "none",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 800,
        whiteSpace: "nowrap",
        color: on ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, it.th, it.n ? React.createElement("span", {
      style: {
        marginLeft: 5,
        padding: "1px 6px",
        borderRadius: 99,
        background: on ? "var(--primary-soft)" : "var(--surface)",
        fontSize: 11
      }
    }, it.n) : null);
  }));
}
function LnSelect({
  value,
  onChange,
  options,
  placeholder,
  title,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const opts = options || [];
  const cur = opts.find(o => o.value === (value || ""));
  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  const qq = q.trim().toLowerCase();
  const shown = [{
    value: "",
    label: placeholder || "— ไม่ระบุ —"
  }].concat(opts.filter(o => o.value !== "").filter(o => !qq || (o.label + " " + (o.sub || "")).toLowerCase().includes(qq)));
  let lastGroup = null;
  return React.createElement(React.Fragment, null, React.createElement("button", {
    type: "button",
    onClick: () => setOpen(true),
    style: Object.assign({}, LN_FIELD, {
      display: "flex",
      alignItems: "center",
      gap: 8,
      textAlign: "left",
      cursor: "pointer",
      boxSizing: "border-box"
    }, style || {})
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: cur && cur.value ? "var(--text-1)" : "var(--text-3)"
    }
  }, cur && cur.value ? cur.label : placeholder || "— ไม่ระบุ —", cur && cur.value && cur.sub ? React.createElement("span", {
    style: {
      marginLeft: 6,
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, cur.sub) : null), React.createElement(Icon, {
    name: "chevronDown",
    size: 18,
    color: "var(--text-3)"
  })), open && ReactDOM.createPortal(React.createElement("div", {
    onClick: () => setOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 80,
      background: "rgba(15,43,51,.38)",
      display: "flex",
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxHeight: "78vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      borderRadius: "22px 22px 0 0",
      boxShadow: "0 -10px 30px rgba(0,0,0,.18)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 16px 10px"
    }
  }, React.createElement("b", {
    style: {
      flex: 1,
      fontSize: 16,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title || "เลือก"), React.createElement("button", {
    type: "button",
    onClick: () => setOpen(false),
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      width: 32,
      height: 32,
      borderRadius: 99,
      padding: 0,
      border: "none",
      cursor: "pointer",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16,
    color: "var(--text-2)"
  }))), opts.length > 8 && React.createElement("div", {
    style: {
      padding: "0 16px 10px",
      position: "relative"
    }
  }, React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32",
    style: Object.assign({}, LN_FIELD, {
      boxSizing: "border-box",
      paddingLeft: 40
    })
  }), React.createElement("span", {
    style: {
      position: "absolute",
      left: 30,
      top: 15,
      pointerEvents: "none"
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 17,
    color: "var(--text-3)"
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: "0 16px 16px",
      display: "grid",
      gap: 6
    }
  }, shown.map(o => {
    const on = (value || "") === o.value;
    const head = o.group && o.group !== lastGroup ? o.group : null;
    if (o.value) lastGroup = o.group || null;
    return React.createElement(React.Fragment, {
      key: o.value || "__none"
    }, head && React.createElement("div", {
      style: {
        margin: "6px 2px 0",
        fontSize: 11.5,
        fontWeight: 800,
        color: "var(--text-3)"
      }
    }, head), React.createElement("button", {
      type: "button",
      onClick: () => {
        onChange(o.value);
        setOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: "var(--r-tile)",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        background: on ? "var(--primary-soft)" : "var(--surface)",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)"
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 14.5,
        fontWeight: 700,
        color: on ? "var(--primary-dark)" : o.value ? "var(--text-1)" : "var(--text-3)"
      }
    }, o.label), o.sub && React.createElement("span", {
      style: {
        display: "block",
        marginTop: 2,
        fontSize: 12,
        color: "var(--text-3)"
      }
    }, o.sub)), on && React.createElement(Icon, {
      name: "check",
      size: 18,
      color: "var(--primary-dark)"
    })));
  }), shown.length === 1 && qq && React.createElement("div", {
    style: {
      padding: 14,
      textAlign: "center",
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A \"", q, "\"")))), document.body));
}
function lnJobOpts(jobs, grouped) {
  const T = window.SF && window.SF.TYPES || [];
  const order = j => {
    const i = T.findIndex(t => t.key === j.type);
    return i < 0 ? 99 : i;
  };
  const list = (jobs || []).slice(0, 80);
  if (grouped) list.sort((a, b) => order(a) - order(b));
  return list.map(j => {
    const t = T.find(x => x.key === j.type);
    return {
      value: j.id,
      label: j.name || j.code,
      sub: j.code,
      group: grouped && t ? t.th : undefined
    };
  });
}
Object.assign(window, {
  LN_CARD,
  LN_LIST_PAD,
  lnCardBtn,
  LN_FIELD,
  LN_LABEL,
  LN_BTN,
  lnChip,
  LN_SHEET,
  LnField,
  LnSheetHead,
  LnSub,
  LnSelect,
  lnJobOpts
});
