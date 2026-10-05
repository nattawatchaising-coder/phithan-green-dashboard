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
  LnSub
});
