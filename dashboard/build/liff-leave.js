function LnLvBalance({
  bal
}) {
  const show = (bal || []).filter(b => b.quota !== 0 || b.used || b.pending);
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 9,
      padding: "0 14px 14px"
    }
  }, show.map(b => {
    const low = b.left != null && b.left <= 0;
    return React.createElement("div", {
      key: b.type.key,
      style: Object.assign({
        padding: "11px 13px"
      }, LN_CARD)
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: b.type.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: "var(--text-2)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, b.type.th)), React.createElement("div", {
      style: {
        marginTop: 4,
        display: "flex",
        alignItems: "baseline",
        gap: 4
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
        fontSize: 11,
        color: "var(--text-3)",
        fontWeight: 700
      }
    }, b.quota == null ? "ไม่จำกัด" : "/ " + Math.round(b.quota * 10) / 10 + " วัน")), React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, "\u0E43\u0E0A\u0E49 ", Math.round(b.used * 10) / 10, b.pending ? " · รอ " + Math.round(b.pending * 10) / 10 : ""));
  }));
}
function LnLvForm({
  me,
  users,
  rows,
  quota,
  types,
  cfg,
  onSave,
  onClose
}) {
  const [f, setF] = React.useState(() => window.lvBlank(me, users, rows, cfg));
  const [msg, setMsg] = React.useState("");
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
  const one = f.from === f.to;
  const approvers = window.lvApprovers(users, me);
  const send = () => {
    if (why) {
      setMsg(why);
      return;
    }
    const next = window.lvMove(f, "sent", me, "");
    if (!next) return;
    onSave(next);
    window.lvNotifyMove(f, next, me, types);
    onClose();
  };
  return React.createElement("div", {
    style: LN_SHEET
  }, React.createElement(LnSheetHead, {
    title: "\u0E02\u0E2D\u0E25\u0E32",
    no: f.no,
    onClose: onClose
  }), React.createElement("div", {
    style: {
      padding: "4px 16px 24px",
      display: "grid",
      gap: 14
    }
  }, React.createElement(LnField, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E01\u0E32\u0E23\u0E25\u0E32",
    req: true
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, bal.filter(b => b.quota !== 0).map(b => React.createElement("button", {
    key: b.type.key,
    onClick: () => set("type", b.type.key),
    style: lnChip(f.type === b.type.key, b.type.color)
  }, b.type.th, React.createElement("span", {
    style: {
      marginLeft: 5,
      fontFamily: "var(--mono)",
      fontSize: 11,
      opacity: .8
    }
  }, b.left == null ? "∞" : Math.round(b.left * 10) / 10))))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10
    }
  }, React.createElement(LnField, {
    label: "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48",
    req: true
  }, React.createElement("input", {
    type: "date",
    value: f.from,
    onChange: e => set("from", e.target.value),
    style: LN_FIELD
  })), React.createElement(LnField, {
    label: "\u0E16\u0E36\u0E07",
    req: true
  }, React.createElement("input", {
    type: "date",
    value: f.to,
    min: f.from,
    onChange: e => set("to", e.target.value),
    style: LN_FIELD
  }))), one && React.createElement(LnField, {
    label: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, window.LV_PART.map(p => React.createElement("button", {
    key: p.key,
    onClick: () => set("part", p.key),
    style: lnChip((f.part || "full") === p.key)
  }, p.th)))), React.createElement("div", {
    style: Object.assign({
      padding: "12px 14px",
      textAlign: "center"
    }, LN_CARD)
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E19\u0E31\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E31\u0E19\u0E25\u0E32 "), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 20,
      fontWeight: 800,
      color: f.days ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, window.lvDaysTH(f.days)), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E19\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E27\u0E31\u0E19\u0E17\u0E33\u0E07\u0E32\u0E19")), React.createElement(LnField, {
    label: "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25",
    req: true
  }, React.createElement("textarea", {
    value: f.reason,
    rows: 3,
    onChange: e => set("reason", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E21\u0E48\u0E2A\u0E1A\u0E32\u0E22 \u0E21\u0E35\u0E44\u0E02\u0E49 \xB7 \u0E44\u0E1B\u0E17\u0E33\u0E18\u0E38\u0E23\u0E30\u0E17\u0E35\u0E48\u0E2D\u0E33\u0E40\u0E20\u0E2D",
    style: Object.assign({}, LN_FIELD, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement(LnField, {
    label: "\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E43\u0E04\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"
  }, React.createElement("select", {
    value: f.approverId || "",
    style: LN_FIELD,
    onChange: e => {
      const u = approvers.find(x => x.id === e.target.value);
      setF(p => Object.assign({}, p, {
        approverId: u ? u.id : null,
        approverName: u ? u.name : ""
      }));
    }
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E43\u0E04\u0E23\u0E01\u0E47\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 \u2014"), approvers.map(u => React.createElement("option", {
    key: u.id,
    value: u.id
  }, u.name)))), f.type && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: -6
    }
  }, window.lvTypeOf(types, f.type).th, " \xB7 ", window.lvAdvTH(window.lvTypeOf(types, f.type))), (msg || why) && f.type && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 14,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      lineHeight: 1.6
    }
  }, msg || why), React.createElement("button", {
    onClick: send,
    disabled: !!why,
    style: Object.assign({}, LN_BTN, {
      background: why ? "var(--surface3)" : "var(--primary)",
      color: why ? "var(--text-3)" : "#fff",
      cursor: why ? "default" : "pointer",
      marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))"
    })
  }, "\u0E2A\u0E48\u0E07\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34")));
}
function LnLeavePanel({
  me,
  users,
  role,
  cfg,
  startForm
}) {
  const lv = window.useLeaves();
  const types = window.useLeaveTypes().types;
  const quota = window.useLeaveQuota().map;
  const can = window.lvCanLeave(role);
  const [form, setForm] = React.useState(!!startForm && can);
  const year = +String(window.drToday()).slice(0, 4);
  const uid = (me || {}).id || null;
  const mine = React.useMemo(() => (lv.rows || []).filter(r => r && r.userId === uid), [lv.rows, uid]);
  const bal = window.lvBalance(lv.rows, quota, uid, year, types);
  const cancel = r => {
    if (!window.confirm("ยกเลิกใบลา " + r.no + "?")) return;
    const next = window.lvMove(r, "cancelled", me, "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(r, next, me, types);
  };
  if (!can) return React.createElement("div", {
    style: {
      padding: 34,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E02\u0E2D\u0E25\u0E32");
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      margin: "0 18px 9px"
    }
  }, React.createElement("b", {
    style: {
      fontSize: 13,
      color: "var(--text-1)"
    }
  }, "\u0E22\u0E2D\u0E14\u0E27\u0E31\u0E19\u0E25\u0E32\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D \u0E1B\u0E35 ", year + 543)), React.createElement(LnLvBalance, {
    bal: bal
  }), React.createElement("div", {
    style: {
      padding: "0 14px 28px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      margin: "0 4px 9px"
    }
  }, React.createElement("b", {
    style: {
      fontSize: 13,
      color: "var(--text-1)"
    }
  }, "\u0E43\u0E1A\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("button", {
    onClick: () => setForm(true),
    style: {
      marginLeft: "auto",
      padding: "8px 15px",
      borderRadius: 99,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "+ \u0E02\u0E2D\u0E25\u0E32")), lv.loading ? React.createElement("div", {
    style: {
      padding: 22,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : mine.length === 0 ? React.createElement("div", {
    style: Object.assign({
      padding: 22,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }, LN_CARD)
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E25\u0E32") : mine.slice(0, 20).map(r => {
    const st = window.tmOtStatusOf(r.status);
    const t = window.lvTypeOf(types, r.type);
    const canCancel = r.status === "draft" || r.status === "sent";
    return React.createElement("div", {
      key: r.id,
      style: Object.assign({
        padding: "12px 14px",
        marginBottom: 10
      }, LN_CARD)
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        color: t.color
      }
    }, t.th), React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, window.lvDaysTH(r.days)), React.createElement("span", {
      style: {
        marginLeft: "auto",
        padding: "2px 9px",
        borderRadius: 99,
        background: st.color + "1A",
        color: st.color,
        fontSize: 11,
        fontWeight: 800
      }
    }, st.th)), React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 12,
        color: "var(--text-3)"
      }
    }, window.lvRangeTH(r), r.reason ? " · " + r.reason : ""), r.decidedNote && React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 12,
        color: "var(--text-2)"
      }
    }, "\u201C", r.decidedNote, "\u201D \u2014 ", r.decidedByName), canCancel && React.createElement("button", {
      onClick: () => cancel(r),
      style: {
        marginTop: 8,
        padding: "6px 12px",
        borderRadius: 99,
        border: "none",
        boxShadow: "var(--soft)",
        background: "var(--surface)",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E43\u0E1A\u0E19\u0E35\u0E49"));
  })), form && React.createElement(LnLvForm, {
    me: me,
    users: users,
    rows: lv.rows,
    quota: quota,
    types: types,
    cfg: cfg,
    onSave: lv.save,
    onClose: () => setForm(false)
  }));
}
function LnApprLeaveSheet({
  me,
  role,
  rec,
  store,
  types,
  onClose
}) {
  const [msg, setMsg] = React.useState("");
  const cur = (store.rows || []).find(r => r.id === rec.id) || rec;
  const chk = window.lvApproveCheck(cur, me, role);
  const t = window.lvTypeOf(types, cur.type);
  const quota = window.useLeaveQuota().map;
  const b = window.lvBalance(store.rows, quota, cur.userId, window.lvYearOf(cur.from), types).find(x => x.type.key === cur.type);
  const move = (to, note) => {
    const next = window.lvMove(cur, to, me, note || "");
    if (!next) return;
    store.save(next);
    window.lvNotifyMove(cur, next, me, types);
    setMsg(to === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติแล้ว");
  };
  return React.createElement("div", {
    style: LN_SHEET
  }, React.createElement(LnApHead, {
    kind: "leave",
    no: cur.no,
    title: (cur.userName || "") + " · " + t.th,
    sub: window.lvRangeTH(cur),
    onClose: onClose
  }), React.createElement("div", {
    style: {
      padding: 16,
      display: "grid",
      gap: 13
    }
  }, React.createElement(LnApRows, {
    rows: [["ประเภท", t.th], ["วันที่", window.lvRangeTH(cur)], ["จำนวน", window.lvDaysTH(cur.days)], ["เหตุผล", cur.reason], ["ยอดคงเหลือ", b ? b.quota == null ? "ไม่จำกัด" : "เหลือ " + window.lvDaysTH(b.left) + " จาก " + window.lvDaysTH(b.quota) + " (รวมใบนี้แล้ว)" : ""], ["ส่งถึง", cur.approverName]]
  }), msg ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 16,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontSize: 13.5,
      fontWeight: 700,
      textAlign: "center"
    }
  }, msg) : cur.status !== "sent" ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 16,
      background: "var(--surface2)",
      color: "var(--text-3)",
      fontSize: 12.5,
      textAlign: "center"
    }
  }, "\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2D\u0E32\u0E08\u0E21\u0E35\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19") : !chk.ok ? React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 16,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)",
      fontSize: 12.5,
      textAlign: "center"
    }
  }, chk.why) : React.createElement(LnApDecide, {
    okText: "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E25\u0E32",
    noText: "\u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    busy: false,
    onOk: () => move("approved", ""),
    onNo: note => move("rejected", note)
  }), React.createElement("button", {
    onClick: onClose,
    style: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 16,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      marginBottom: "calc(10px + env(safe-area-inset-bottom, 0px))"
    }
  }, msg ? "กลับไปรายการ" : "ปิด")));
}
function LnApLeaveList({
  me,
  role,
  store,
  types
}) {
  const [open, setOpen] = React.useState(null);
  const rows = React.useMemo(() => (store.rows || []).filter(r => r && r.status === "sent" && window.lvApproveCheck(r, me, role).ok), [store.rows, me, role]);
  if (store.loading || !rows.length) return null;
  return React.createElement("div", {
    style: LN_AP_WRAP
  }, React.createElement("div", {
    style: {
      margin: "0 4px 9px",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E43\u0E1A\u0E25\u0E32\u0E23\u0E2D\u0E04\u0E38\u0E13\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19 \xB7 ", rows.length, " \u0E43\u0E1A"), rows.map(r => {
    const t = window.lvTypeOf(types, r.type);
    return React.createElement(LnApCard, {
      key: r.id,
      kind: "leave",
      title: (r.userName || "") + " · " + t.th,
      sub: window.lvRangeTH(r) + (r.reason ? " · " + r.reason : ""),
      right: window.lvDaysTH(r.days),
      onClick: () => setOpen(r)
    });
  }), open && React.createElement(LnApprLeaveSheet, {
    me: me,
    role: role,
    rec: open,
    store: store,
    types: types,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  LnLeavePanel,
  LnLvForm,
  LnLvBalance,
  LnApLeaveList,
  LnApprLeaveSheet
});
