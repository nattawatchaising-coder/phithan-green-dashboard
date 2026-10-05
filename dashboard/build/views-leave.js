function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const LV_IN = {
  padding: "9px 11px",
  borderRadius: "var(--r-chip)",
  border: "none",
  background: "var(--surface2)",
  boxShadow: "var(--shadow-inset)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none"
};
const LV_IN_W = Object.assign({}, LV_IN, {
  width: "100%"
});
const LV_LB = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--text-3)"
};
const LV_CARD = {
  background: "var(--surface)",
  boxShadow: "var(--shadow-sm)",
  borderRadius: "var(--r-tile)"
};
const lvBtn = (main, color) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 15px",
  borderRadius: "var(--r-chip)",
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 800,
  background: main ? color || "var(--primary)" : "var(--surface)",
  boxShadow: main ? "none" : "var(--shadow-sm)",
  color: main ? "#fff" : color || "var(--text-1)"
});
function LvTypeTag({
  t
}) {
  return React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: "var(--r-pill)",
      background: t.color + "1A",
      color: t.color,
      fontSize: 10.5,
      fontWeight: 800,
      whiteSpace: "nowrap"
    }
  }, t.th);
}
function LvBalanceCards({
  bal
}) {
  const show = (bal || []).filter(b => b.quota !== 0 || b.used || b.pending);
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
      gap: 10
    }
  }, show.map(b => {
    const low = b.left != null && b.left <= 0;
    return React.createElement("div", {
      key: b.type.key,
      style: Object.assign({
        padding: "12px 14px",
        borderLeft: "3px solid " + b.type.color
      }, LV_CARD)
    }, React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: b.type.color
      }
    }, b.type.th), React.createElement("div", {
      style: {
        marginTop: 4,
        display: "flex",
        alignItems: "baseline",
        gap: 5
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 22,
        fontWeight: 800,
        color: low ? "#EF4444" : "var(--text-1)"
      }
    }, b.left == null ? "∞" : Math.round(b.left * 10) / 10), React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        fontWeight: 700
      }
    }, b.quota == null ? "ไม่จำกัด" : "เหลือ / " + Math.round(b.quota * 10) / 10 + " วัน")), React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, "\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 ", Math.round(b.used * 10) / 10, b.pending ? " · รออนุมัติ " + Math.round(b.pending * 10) / 10 : ""));
  }));
}
function LvModal({
  rec,
  cfg,
  types,
  users,
  rows,
  quota,
  role,
  currentUser,
  onSave,
  onMove,
  onDelete,
  onClose
}) {
  const [f, setF] = React.useState(rec);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    setF(rec);
  }, [rec && rec.id, rec && rec.status]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  if (!f) return null;
  const mine = currentUser && f.userId === currentUser.id;
  const editable = false;
  const set = (k, v) => setF(p => {
    const n = Object.assign({}, p, {
      [k]: v
    });
    if (k === "from" && (!n.to || n.to < v)) n.to = v;
    if (n.to !== n.from) n.part = "full";
    n.days = window.lvCountDays(n.from, n.to, n.part, cfg);
    return n;
  });
  const bal = window.lvBalance(rows, quota, f.userId, window.lvYearOf(f.from), types);
  const why = window.lvSendWhy(f, bal);
  const nexts = window.lvNext(f, role, currentUser).filter(s => s.key !== "sent" && s.key !== "draft");
  const apprWhy = window.lvApproveCheck(f, currentUser, role).why;
  const one = f.from === (f.to || f.from);
  const pickable = bal.filter(b => b.quota !== 0 || b.type.key === f.type);
  const t = window.lvTypeOf(types, f.type);
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
    onClick: e => e.stopPropagation(),
    style: {
      width: "min(560px,100%)",
      maxHeight: "90vh",
      overflow: "auto",
      background: "var(--surface)",
      boxShadow: "var(--shadow-card)",
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
  }, editable ? "ขอลา" : window.tmNameOf(users, f.userId, f.userName))), React.createElement(window.TmPill, {
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
      gap: 6
    }
  }, React.createElement("span", {
    style: LV_LB
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E25\u0E32"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, (editable ? pickable : bal.filter(b => b.type.key === f.type)).map(b => {
    const on = f.type === b.type.key;
    return React.createElement("button", {
      key: b.type.key,
      disabled: !editable,
      onClick: () => set("type", b.type.key),
      style: {
        padding: "7px 12px",
        borderRadius: "var(--r-pill)",
        border: "none",
        fontFamily: "inherit",
        cursor: editable ? "pointer" : "default",
        fontSize: 12.5,
        fontWeight: 700,
        background: on ? b.type.color + "1A" : "var(--surface)",
        boxShadow: on ? "inset 0 0 0 1px " + b.type.color : "var(--shadow-sm)",
        color: on ? b.type.color : "var(--text-2)"
      }
    }, b.type.th, React.createElement("span", {
      style: {
        marginLeft: 6,
        fontFamily: "var(--mono)",
        fontSize: 11,
        opacity: .8
      }
    }, b.left == null ? "∞" : "เหลือ " + Math.round(b.left * 10) / 10));
  }), !f.type && !editable && React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u2014"))), React.createElement("div", {
    style: {
      marginTop: 12,
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
    style: LV_LB
  }, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: f.from,
    disabled: !editable,
    onChange: e => set("from", e.target.value),
    style: LV_IN_W
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: LV_LB
  }, "\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), React.createElement("input", {
    type: "date",
    value: f.to || f.from,
    min: f.from,
    disabled: !editable,
    onChange: e => set("to", e.target.value),
    style: LV_IN_W
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: LV_LB
  }, "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"), React.createElement("select", {
    value: one ? f.part || "full" : "full",
    disabled: !editable || !one,
    onChange: e => set("part", e.target.value),
    style: LV_IN_W
  }, window.LV_PART.map(p => React.createElement("option", {
    key: p.key,
    value: p.key
  }, p.th))))), React.createElement("div", {
    style: {
      marginTop: 12,
      padding: "11px 13px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E19\u0E25\u0E32 "), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 18,
      fontWeight: 800,
      color: f.days ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, window.lvDaysTH(f.days)), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, " \xB7 \u0E19\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19 (\u0E15\u0E31\u0E14\u0E27\u0E31\u0E19\u0E2B\u0E22\u0E38\u0E14\u0E15\u0E32\u0E21\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E27\u0E25\u0E32\u0E17\u0E33\u0E07\u0E32\u0E19)")), React.createElement("label", {
    style: {
      marginTop: 12,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: LV_LB
  }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25"), React.createElement("textarea", {
    value: f.reason || "",
    disabled: !editable,
    rows: 3,
    onChange: e => set("reason", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E21\u0E48\u0E2A\u0E1A\u0E32\u0E22 \u0E21\u0E35\u0E44\u0E02\u0E49 \xB7 \u0E44\u0E1B\u0E17\u0E33\u0E18\u0E38\u0E23\u0E30\u0E17\u0E35\u0E48\u0E2D\u0E33\u0E40\u0E20\u0E2D",
    style: Object.assign({}, LV_IN_W, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("label", {
    style: {
      marginTop: 10,
      display: "grid",
      gap: 4
    }
  }, React.createElement("span", {
    style: LV_LB
  }, "\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), editable ? React.createElement("select", {
    value: f.approverId || "",
    style: LV_IN_W,
    onChange: e => {
      const u = (users || []).find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        approverId: u ? u.id : null,
        approverName: u ? u.name : ""
      }));
    }
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 \u2014"), window.lvApprovers(users, {
    id: f.userId
  }).map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name))) : React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, f.approverName || "—")), f.decidedAt && React.createElement("div", {
    style: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, window.tmOtStatusOf(f.status).th, " \u0E42\u0E14\u0E22 ", f.decidedByName || "-", " \xB7 ", window.drShort(String(f.decidedAt).slice(0, 10)), f.decidedNote ? React.createElement("div", {
    style: {
      marginTop: 3
    }
  }, "\u201C", f.decidedNote, "\u201D") : null), editable && f.type && React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, t.th, " \xB7 ", window.lvAdvTH(t)), editable && why && React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12,
      color: "#F59E0B",
      fontWeight: 700
    }
  }, why), f.status === "sent" && !mine && window.lvApproveCheck(f, currentUser, role).ok && React.createElement("input", {
    value: note,
    onChange: e => setNote(e.target.value),
    placeholder: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E16\u0E36\u0E07\u0E1C\u0E39\u0E49\u0E25\u0E32 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)",
    style: Object.assign({}, LV_IN_W, {
      marginTop: 12
    })
  }), React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, editable && React.createElement("button", {
    onClick: () => {
      onSave(f);
      onClose();
    },
    style: lvBtn(false)
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E48\u0E32\u0E07"), nexts.map(s => {
    const soft = s.key === "cancelled" || s.key === "draft" && f.status === "sent" && !mine;
    const label = s.key === "sent" ? "ส่งขออนุมัติ" : s.key === "approved" ? "อนุมัติ" : s.key === "rejected" ? "ไม่อนุมัติ" : s.key === "cancelled" ? "ยกเลิกใบนี้" : mine ? "เอากลับมาแก้" : "ตีกลับให้แก้";
    return React.createElement("button", {
      key: s.key,
      onClick: () => {
        onMove(f, s.key, note);
        onClose();
      },
      style: soft ? lvBtn(false, s.color) : lvBtn(true, s.color)
    }, label);
  }), f.status === "sent" && !mine && apprWhy && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, apprWhy), mine && f.status === "draft" && onDelete && React.createElement("button", {
    onClick: () => {
      onDelete(f.id);
      onClose();
    },
    style: Object.assign(lvBtn(false, "var(--tint-red-tx2)"), {
      marginLeft: "auto"
    })
  }, "\u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49")), t && t.days == null && f.type && React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, t.th, " \u0E44\u0E21\u0E48\u0E2B\u0E31\u0E01\u0E22\u0E2D\u0E14\u0E27\u0E31\u0E19\u0E25\u0E32")));
}
function LvRow({
  rec,
  users,
  types,
  onOpen
}) {
  const t = window.lvTypeOf(types, rec.type);
  return React.createElement("button", {
    onClick: () => onOpen(rec),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "11px 14px",
      border: "none",
      borderBottom: "1px solid var(--divider)",
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
  }, window.tmNameOf(users, rec.userId, rec.userName)), React.createElement(LvTypeTag, {
    t: t
  }), React.createElement(window.TmPill, {
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
  }, window.lvDaysTH(rec.days))), React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, window.lvRangeTH(rec), rec.reason ? " · " + rec.reason : "", rec.approverName ? " · ถึง " + rec.approverName : ""));
}
function LvQuotaTable({
  users,
  types,
  rows,
  quota,
  year
}) {
  const people = React.useMemo(() => (users || []).filter(u => u && u.id && u.active !== false && window.can(window.userRoles(u), "leave")).sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th")), [users]);
  const [q, setQ] = React.useState("");
  const list = people.filter(u => !q.trim() || String(u.name || "").toLowerCase().includes(q.trim().toLowerCase()));
  return React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    className: "search-box",
    style: {
      width: 260
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D"
  })), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E35 ", year + 543, " \xB7 \u0E0A\u0E48\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E22\u0E2D\u0E14\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19 (\u0E15\u0E31\u0E27\u0E08\u0E32\u0E07) \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E25\u0E02 = \u0E22\u0E2D\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19\u0E19\u0E35\u0E49 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E2D\u0E07")), React.createElement("div", {
    style: Object.assign({
      overflow: "auto"
    }, LV_CARD)
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12.5
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      background: "var(--surface2)"
    }
  }, React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "9px 13px",
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), types.map(t => React.createElement("th", {
    key: t.key,
    style: {
      padding: "9px 10px",
      color: t.color,
      fontWeight: 800,
      whiteSpace: "nowrap"
    }
  }, t.th, React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19 ", t.days == null ? "ไม่จำกัด" : t.days))))), React.createElement("tbody", null, list.map(u => {
    const bal = window.lvBalance(rows, quota.map, u.id, year, types);
    const own = (quota.map[u.id] || {})[year] || {};
    return React.createElement("tr", {
      key: u.id,
      style: {
        borderTop: "1px solid var(--divider)"
      }
    }, React.createElement("td", {
      style: {
        padding: "8px 13px",
        fontWeight: 700,
        color: "var(--text-1)",
        whiteSpace: "nowrap"
      }
    }, u.name), bal.map(b => {
      const v = own[b.type.key];
      return React.createElement("td", {
        key: b.type.key,
        style: {
          padding: "6px 10px",
          textAlign: "center"
        }
      }, React.createElement("input", {
        key: u.id + b.type.key + String(v),
        defaultValue: v === "inf" ? "" : v == null ? "" : v,
        placeholder: b.type.days == null ? "∞" : String(b.type.days),
        inputMode: "decimal",
        onBlur: e => {
          const raw = e.target.value.trim();
          const cur = v == null ? "" : String(v);
          if (raw === cur) return;
          quota.set(u.id, year, b.type.key, raw === "" ? null : raw);
        },
        style: Object.assign({}, LV_IN, {
          width: 64,
          textAlign: "center",
          fontFamily: "var(--mono)",
          padding: "6px 6px"
        })
      }), React.createElement("div", {
        style: {
          marginTop: 3,
          fontSize: 10.5,
          color: b.left != null && b.left < 0 ? "#EF4444" : "var(--text-3)",
          whiteSpace: "nowrap"
        }
      }, "\u0E43\u0E0A\u0E49 ", Math.round(b.used * 10) / 10, b.pending ? " +รอ " + Math.round(b.pending * 10) / 10 : "", b.left != null ? " · เหลือ " + Math.round(b.left * 10) / 10 : ""));
    }));
  }))), !list.length && React.createElement("div", {
    style: {
      padding: 30,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E32")));
}
function LvTypesEditor({
  types,
  onSave
}) {
  const [list, setList] = React.useState(types);
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => {
    setList(types);
  }, [types]);
  const upd = (i, k, v) => {
    setSaved(false);
    setList(p => p.map((t, j) => j === i ? Object.assign({}, t, {
      [k]: v
    }) : t));
  };
  const COLS = ["#EF4444", "#F59E0B", "#0EA5E9", "#EC4899", "#10B981", "#8B5CF6", "#64748B"];
  return React.createElement("div", {
    style: Object.assign({
      padding: 16,
      display: "grid",
      gap: 10,
      maxWidth: 860
    }, LV_CARD)
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E25\u0E32 \xB7 \u0E22\u0E2D\u0E14\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E15\u0E48\u0E2D\u0E1B\u0E35"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E17\u0E38\u0E01\u0E04\u0E19\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E22\u0E2D\u0E14\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E15\u0E31\u0E27\u0E43\u0E19\u0E41\u0E17\u0E47\u0E1A \u201C\u0E22\u0E2D\u0E14\u0E27\u0E31\u0E19\u0E25\u0E32\u0E17\u0E38\u0E01\u0E04\u0E19\u201D \xB7 \u0E0A\u0E48\u0E2D\u0E07\u0E08\u0E33\u0E19\u0E27\u0E19\u0E27\u0E31\u0E19\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14 (\u0E44\u0E21\u0E48\u0E2B\u0E31\u0E01\u0E22\u0E2D\u0E14) \xB7 0 = \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E25\u0E32\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E35\u0E49 (\u0E15\u0E31\u0E49\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E04\u0E19\u0E44\u0E14\u0E49) \xB7 \u0E22\u0E37\u0E48\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32 = \u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E48\u0E07\u0E43\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E27\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E25\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E35\u0E48\u0E27\u0E31\u0E19 (0 = \u0E27\u0E31\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49) \xB7 \u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E44\u0E14\u0E49 = \u0E22\u0E37\u0E48\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E25\u0E32\u0E44\u0E14\u0E49 (\u0E40\u0E0A\u0E48\u0E19 \u0E25\u0E32\u0E1B\u0E48\u0E27\u0E22)"), list.map((t, i) => React.createElement("div", {
    key: t.key,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("input", {
    value: t.th,
    onChange: e => upd(i, "th", e.target.value),
    style: Object.assign({}, LV_IN, {
      flex: "1 1 160px"
    })
  }), React.createElement("input", {
    value: t.days == null ? "" : t.days,
    placeholder: "\u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14",
    inputMode: "decimal",
    onChange: e => upd(i, "days", e.target.value === "" ? null : e.target.value),
    style: Object.assign({}, LV_IN, {
      width: 90,
      textAlign: "center",
      fontFamily: "var(--mono)"
    })
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19/\u0E1B\u0E35 \xB7 \u0E22\u0E37\u0E48\u0E19\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32"), React.createElement("input", {
    value: t.adv == null ? "" : t.adv,
    placeholder: "0",
    inputMode: "numeric",
    onChange: e => upd(i, "adv", e.target.value === "" ? 0 : e.target.value),
    style: Object.assign({}, LV_IN, {
      width: 60,
      textAlign: "center",
      fontFamily: "var(--mono)"
    })
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19"), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 12,
      color: "var(--text-2)",
      cursor: "pointer"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: !!t.back,
    onChange: e => upd(i, "back", e.target.checked)
  }), " \u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E44\u0E14\u0E49"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, COLS.map(c => React.createElement("button", {
    key: c,
    onClick: () => upd(i, "color", c),
    title: c,
    style: {
      width: 18,
      height: 18,
      borderRadius: 99,
      border: "none",
      cursor: "pointer",
      background: c,
      boxShadow: t.color === c ? "0 0 0 2px var(--surface), 0 0 0 4px " + c : "none"
    }
  }))), React.createElement("button", {
    onClick: () => {
      setSaved(false);
      setList(p => p.filter((_, j) => j !== i));
    },
    title: "\u0E25\u0E1A\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E35\u0E49",
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: 4
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 15,
    color: "var(--text-3)"
  })))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => {
      setSaved(false);
      setList(p => p.concat([{
        key: "t" + Date.now().toString(36),
        th: "ประเภทใหม่",
        days: 0,
        color: "#10B981"
      }]));
    },
    style: lvBtn(false)
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), React.createElement("button", {
    onClick: () => {
      onSave(list);
      setSaved(true);
    },
    style: lvBtn(true)
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), saved && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--primary-dark)",
      fontWeight: 700
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27"), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E1A\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E41\u0E25\u0E49\u0E27 \u0E43\u0E1A\u0E25\u0E32\u0E40\u0E01\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E19\u0E31\u0E49\u0E19\u0E22\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48 \u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E02\u0E36\u0E49\u0E19\u0E43\u0E19\u0E22\u0E2D\u0E14")));
}
function LeaveTab({
  users,
  role,
  currentUser,
  cfg
}) {
  const lv = window.useLeaves();
  const tp = window.useLeaveTypes();
  const quota = window.useLeaveQuota();
  const types = tp.types;
  const uid = (currentUser || {}).id || null;
  const [year, setYear] = React.useState(+String(window.drToday()).slice(0, 4));
  const [sub, setSub] = React.useState("mine");
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");
  const canAppr = window.lvCanApprove(role);
  const canAll = canAppr || window.can(role, "attendAll");
  const canQuota = window.lvCanQuota(role);
  const canTypes = window.can(role, "manageUsers");
  const visible = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role), [lv.rows, currentUser, role]);
  const myBal = React.useMemo(() => window.lvBalance(lv.rows, quota.map, uid, year, types), [lv.rows, quota.map, uid, year, types]);
  const waiting = React.useMemo(() => visible.filter(r => r.status === "sent" && window.lvApproveCheck(r, currentUser, role).ok), [visible, currentUser, role]);
  const list = React.useMemo(() => {
    let out = sub === "mine" ? visible.filter(r => r.userId === uid) : sub === "inbox" ? waiting : visible.filter(r => window.lvYearOf(r.from) === year);
    const kw = q.trim().toLowerCase();
    if (kw) out = out.filter(r => [r.no, r.userName, r.reason, window.lvTypeOf(types, r.type).th].some(v => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [sub, visible, waiting, uid, year, q, types]);
  const move = (rec, to, note) => {
    const next = window.lvMove(Object.assign({}, rec, {
      days: window.lvCountDays(rec.from, rec.to, rec.part, cfg)
    }), to, currentUser, note || "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(rec, next, currentUser, types);
  };
  const SUBS = [["mine", "ใบลาของฉัน", 0]].concat(canAppr ? [["inbox", "รอฉันอนุมัติ", waiting.length]] : []).concat(canAll ? [["all", "ใบลาทั้งหมด", 0]] : []).concat(canQuota ? [["quota", "ยอดวันลาทุกคน", 0]] : []).concat(canTypes ? [["types", "ประเภทการลา", 0]] : []);
  const cur = (lv.rows || []).find(r => r.id === open) || null;
  const can = window.lvCanLeave(role);
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E22\u0E2D\u0E14\u0E27\u0E31\u0E19\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement("button", {
    onClick: () => setYear(year - 1),
    style: lvBtn(false)
  }, "\u2039"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 800,
      minWidth: 56,
      textAlign: "center"
    }
  }, "\u0E1B\u0E35 ", year + 543), React.createElement("button", {
    onClick: () => setYear(year + 1),
    style: lvBtn(false)
  }, "\u203A")), can && React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E22\u0E37\u0E48\u0E19\u0E43\u0E1A\u0E25\u0E32\u0E44\u0E14\u0E49\u0E17\u0E32\u0E07\u0E41\u0E2D\u0E1B\u0E44\u0E25\u0E19\u0E4C\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E1B\u0E38\u0E48\u0E21 \"\u0E02\u0E2D\u0E25\u0E32\" \u0E17\u0E35\u0E48\u0E40\u0E21\u0E19\u0E39\u0E25\u0E48\u0E32\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E17\u0E47\u0E1A\u0E40\u0E27\u0E25\u0E32 \u2192 \u0E01\u0E32\u0E23\u0E25\u0E32")), React.createElement(LvBalanceCards, {
    bal: myBal
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, SUBS.map(([k, th, n]) => React.createElement("button", {
    key: k,
    onClick: () => setSub(k),
    style: {
      padding: "7px 13px",
      borderRadius: "var(--r-pill)",
      border: "none",
      fontFamily: "inherit",
      cursor: "pointer",
      fontSize: 12.5,
      fontWeight: 700,
      boxShadow: sub === k ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
      background: sub === k ? "var(--primary-soft)" : "var(--surface)",
      color: sub === k ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, th, n > 0 && React.createElement("span", {
    style: {
      marginLeft: 6,
      fontFamily: "var(--mono)",
      fontWeight: 800,
      color: "#F59E0B"
    }
  }, n)))), sub === "quota" && canQuota && React.createElement(LvQuotaTable, {
    users: users,
    types: types,
    rows: lv.rows,
    quota: quota,
    year: year
  }), sub === "types" && canTypes && React.createElement(LvTypesEditor, {
    types: types,
    onSave: tp.save
  }), (sub === "mine" || sub === "inbox" || sub === "all") && React.createElement(React.Fragment, null, sub !== "mine" && React.createElement("div", {
    className: "search-box",
    style: {
      width: "100%",
      maxWidth: 420
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E0A\u0E37\u0E48\u0E2D \xB7 \u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \xB7 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25"
  })), React.createElement("div", {
    style: Object.assign({
      overflow: "hidden"
    }, LV_CARD)
  }, list.length === 0 ? React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13
    }
  }, sub === "inbox" ? "ไม่มีใบลารอคุณอนุมัติ" : "ยังไม่มีใบลา") : list.map(r => React.createElement(LvRow, {
    key: r.id,
    rec: r,
    users: users,
    types: types,
    onOpen: x => setOpen(x.id)
  })))), cur && React.createElement(LvModal, {
    rec: cur,
    cfg: cfg,
    types: types,
    users: users,
    rows: lv.rows,
    quota: quota.map,
    role: role,
    currentUser: currentUser,
    onSave: lv.save,
    onMove: move,
    onDelete: lv.remove,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  LeaveTab,
  LvModal,
  LvRow,
  LvBalanceCards,
  LvQuotaTable,
  LvTypesEditor,
  LvTypeTag
});
