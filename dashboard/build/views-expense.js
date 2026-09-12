const EC_INPUT = {
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
function EcPill({
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
function EcStat({
  label,
  value,
  unit,
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
      minWidth: 130,
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
      fontSize: 21,
      fontWeight: 800,
      color: color,
      lineHeight: 1.25
    }
  }, value, unit && React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      marginLeft: 3,
      opacity: .75
    }
  }, unit)), hint && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, hint));
}
function EcClaimModal({
  claim,
  job,
  users,
  role,
  currentUser,
  onClose,
  onPatch,
  onMove,
  onRemove
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [note, setNote] = React.useState("");
  const [delAsk, setDelAsk] = React.useState(false);
  if (!claim) return null;
  const c = claim;
  const st = window.ecStatusOf(c.status);
  const pay = window.ecPayOf(c.payMethod);
  const kind = window.ecKindOf(c.kind);
  const mine = currentUser && c.byId === currentUser.id;
  const locked = c.status !== "draft" || !mine;
  const set = fields => {
    if (!locked) onPatch(c.id, fields);
  };
  const nexts = window.ecNext(c, role, currentUser);
  const chk = window.ecApproveCheck(c, currentUser, role);
  const canDel = window.ecCanDelete(role) || mine && c.status === "draft";
  const total = window.ecSum(c.items);
  const ecRowsClean = rows => (rows || []).map(r => ({
    name: r && r.name || "",
    qty: r && r.qty || "",
    unit: r && r.unit || "",
    price: r && r.price || "",
    amount: r && r.amount || ""
  }));
  const del = () => {
    if (delAsk) return;
    setDelAsk(true);
    window.askConfirm({
      title: "ลบใบเบิก " + (c.no || "") + " ?",
      body: c.status === "paid" || c.status === "approved" ? "ใบนี้ผ่านการอนุมัติแล้ว การลบทิ้งจะทำให้ยอดของ " + (c.byName || "") + " หายไปด้วย" : "ลบแล้วกู้คืนไม่ได้",
      danger: true
    }).then(ok => {
      setDelAsk(false);
      if (ok) {
        onRemove(c.id);
        onClose();
      }
    });
  };
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 95,
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
      background: "var(--bg)",
      borderRadius: isMobile ? "16px 16px 0 0" : 18,
      width: "min(760px, 100%)",
      maxHeight: isMobile ? "94dvh" : "92dvh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: isMobile ? "13px 14px" : "15px 18px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: kind.color + "1a"
    }
  }, React.createElement(Icon, {
    name: "wallet",
    size: 17,
    color: kind.color
  })), React.createElement("div", {
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
  }, kind.th), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, c.no, " \xB7 ", c.byName || "-", " \xB7 ", window.drDateTH(c.date))), React.createElement(EcPill, {
    th: st.th,
    color: st.color
  }), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15,
    color: "var(--text-2)"
  }))), React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: isMobile ? 13 : 18
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 16,
      padding: "13px 16px",
      borderRadius: 13,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid " + pay.color
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 140
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E40\u0E1A\u0E34\u0E01"), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 27,
      fontWeight: 800,
      color: "var(--text-1)",
      lineHeight: 1.2
    }
  }, window.ecBaht(total), " ", React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E32\u0E17"))), React.createElement("div", {
    style: {
      textAlign: isMobile ? "left" : "right"
    }
  }, React.createElement(EcPill, {
    th: pay.th,
    color: pay.color
  }), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, pay.hint))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 16,
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "sun",
    size: 13,
    color: "var(--text-3)"
  }), c.jobId ? React.createElement("span", null, React.createElement("b", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, c.siteCode), " ", c.siteName, !job && React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, " \xB7 \u0E07\u0E32\u0E19\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E49\u0E27")) : React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E44\u0E2B\u0E19 (\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B)")), React.createElement(window.DrSection, {
    n: "1",
    title: "\u0E04\u0E48\u0E32\u0E2D\u0E30\u0E44\u0E23 \u0E08\u0E48\u0E32\u0E22\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E2B\u0E23\u0E48",
    tone: kind.color
  }, React.createElement(window.DrLabel, {
    hint: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E2B\u0E21\u0E27\u0E14 \u0E08\u0E30\u0E44\u0E14\u0E49\u0E2A\u0E23\u0E38\u0E1B\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E23\u0E32\u0E22\u0E44\u0E0B\u0E15\u0E4C\u0E44\u0E14\u0E49"
  }, "\u0E2B\u0E21\u0E27\u0E14\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22"), React.createElement(window.DrChips, {
    options: window.EC_KIND,
    value: c.kind,
    disabled: locked,
    onChange: v => set({
      kind: v || "other"
    })
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12,
      marginTop: 14
    }
  }, React.createElement("div", null, React.createElement(window.DrLabel, {
    hint: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E08\u0E23\u0E34\u0E07 \u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E43\u0E1A"
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22"), React.createElement("input", {
    type: "date",
    value: c.date || "",
    disabled: locked,
    onChange: e => set({
      date: e.target.value
    }),
    style: EC_INPUT
  })), React.createElement("div", null, React.createElement(window.DrLabel, null, "\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E44\u0E1B\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E43\u0E04\u0E23"), React.createElement(window.DrChips, {
    options: window.EC_PAY,
    value: c.payMethod,
    disabled: locked,
    onChange: v => set({
      payMethod: v || "own"
    })
  }))), React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement(window.DrLabel, {
    hint: "\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A"
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement(window.DrText, {
    value: c.note,
    disabled: locked,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0B\u0E37\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E23\u0E49\u0E32\u0E19\u0E43\u0E01\u0E25\u0E49\u0E44\u0E0B\u0E15\u0E4C\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E02\u0E2D\u0E07\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E2B\u0E21\u0E14",
    onChange: v => set({
      note: v
    })
  }))), React.createElement(window.DrSection, {
    n: "2",
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22",
    tone: kind.color,
    hint: "รวม " + window.ecBaht(total) + " บาท"
  }, React.createElement(window.DrRows, {
    disabled: locked,
    rows: c.items || [],
    addLabel: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23",
    cols: [{
      k: "name",
      th: "รายการ",
      w: "40%"
    }, {
      k: "qty",
      th: "จำนวน",
      w: "14%",
      type: "num"
    }, {
      k: "unit",
      th: "หน่วย",
      w: "14%"
    }, {
      k: "price",
      th: "ราคา/หน่วย",
      w: "16%",
      type: "num"
    }, {
      k: "amount",
      th: "รวม (บาท)",
      w: "16%",
      type: "num"
    }],
    onChange: rows => set({
      items: ecRowsClean(rows)
    })
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 9,
      lineHeight: 1.55
    }
  }, "\u0E40\u0E27\u0E49\u0E19\u0E0A\u0E48\u0E2D\u0E07 \u201C\u0E23\u0E27\u0E21\u201D \u0E44\u0E27\u0E49 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01 \u0E08\u0E33\u0E19\u0E27\u0E19 \xD7 \u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22 \u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07 \xB7 \u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21\u0E02\u0E2D\u0E07\u0E43\u0E1A\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E40\u0E2A\u0E21\u0E2D \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E17\u0E31\u0E1A\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E1A\u0E34\u0E25\u0E17\u0E35\u0E48\u0E41\u0E19\u0E1A")), React.createElement(window.DrSection, {
    n: "3",
    title: "\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    tone: st.color,
    hint: c.status === "sent" ? c.approverName ? "รอ " + c.approverName : "รอหัวหน้าอนุมัติ" : c.decidedByName ? "โดย " + c.decidedByName : ""
  }, c.status === "sent" && !chk.ok && chk.why && React.createElement("div", {
    style: {
      fontSize: 12,
      lineHeight: 1.55,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      borderRadius: 9,
      padding: "8px 11px",
      marginBottom: 12
    }
  }, chk.why), c.decidedAt && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      marginBottom: 12,
      lineHeight: 1.6
    }
  }, st.key === "rejected" ? "ไม่อนุมัติ" : "อนุมัติ", "\u0E42\u0E14\u0E22 ", React.createElement("b", null, c.decidedByName || "-"), " \xB7 ", window.drDateTH(String(c.decidedAt).slice(0, 10)), c.decidedNote && React.createElement("div", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u201C", c.decidedNote, "\u201D")), c.paidAt && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-ok-tx)",
      marginBottom: 12
    }
  }, "\u0E08\u0E48\u0E32\u0E22\u0E04\u0E37\u0E19\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22 ", React.createElement("b", null, c.paidByName || "-"), " \xB7 ", window.drDateTH(String(c.paidAt).slice(0, 10))), nexts.length > 0 && React.createElement(React.Fragment, null, React.createElement(window.DrLabel, {
    hint: "\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A \xB7 \u0E08\u0E30\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49\u0E43\u0E19\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34"
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19"), React.createElement("input", {
    value: note,
    onChange: e => setNote(e.target.value),
    style: Object.assign({}, EC_INPUT, {
      marginBottom: 11
    }),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E1A\u0E34\u0E25\u0E44\u0E21\u0E48\u0E0A\u0E31\u0E14 \u0E02\u0E2D\u0E16\u0E48\u0E32\u0E22\u0E43\u0E2B\u0E21\u0E48"
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, nexts.map(s => React.createElement("button", {
    key: s.key,
    onClick: () => {
      onMove(c, s.key, note);
      setNote("");
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 16px",
      borderRadius: 10,
      border: "1px solid " + s.color,
      background: s.color + "16",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 800,
      color: s.color
    }
  }, React.createElement(Icon, {
    name: "arrowRight",
    size: 14,
    color: s.color
  }), " ", s.th)))), !nexts.length && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, c.status === "paid" ? "ใบนี้จบแล้ว — ล็อกไว้เป็นหลักฐานการจ่ายเงิน" : "ไม่มีขั้นตอนที่คุณกดได้กับใบนี้")), (c.hist || []).length > 0 && React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".07em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 8
    }
  }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34"), (c.hist || []).slice().reverse().map((h, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "baseline",
      fontSize: 12,
      color: "var(--text-2)",
      padding: "5px 0",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 10.5,
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, window.drDateTH(String(h.at).slice(0, 10))), React.createElement("span", {
    style: {
      flex: 1
    }
  }, window.ecStatusOf(h.from).th, " \u2192 ", React.createElement("b", {
    style: {
      color: window.ecStatusOf(h.to).color
    }
  }, window.ecStatusOf(h.to).th), h.byName ? " · " + h.byName : "", h.note ? " · “" + h.note + "”" : "")))), canDel && React.createElement("button", {
    onClick: del,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 9,
      border: "1px solid var(--tint-red-bd)",
      background: "var(--tint-red-bg)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-red-tx)"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13,
    color: "var(--tint-red-tx)"
  }), " \u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49"))));
}
function EcClaimRow({
  claim,
  onOpen,
  gone
}) {
  const st = window.ecStatusOf(claim.status);
  const kind = window.ecKindOf(claim.kind);
  const pay = window.ecPayOf(claim.payMethod);
  return React.createElement("button", {
    onClick: () => onOpen(claim.id),
    style: {
      width: "100%",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: "3px solid " + st.color,
      cursor: "pointer",
      fontFamily: "inherit",
      marginBottom: 7
    }
  }, React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: kind.color + "1a"
    }
  }, React.createElement(Icon, {
    name: "wallet",
    size: 15,
    color: kind.color
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, kind.th, claim.note ? " · " + claim.note : ""), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 2,
      fontFamily: "var(--mono)"
    }
  }, claim.no, " \xB7 ", claim.byName || "-", " \xB7 ", window.drShort(claim.date), claim.siteCode ? " · " + claim.siteCode : "", gone && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontFamily: "inherit"
    }
  }, " \xB7 \u0E07\u0E32\u0E19\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))), React.createElement("span", {
    style: {
      textAlign: "right",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--mono)",
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.ecBaht(claim.amount)), React.createElement("span", {
    style: {
      display: "block",
      marginTop: 3
    }
  }, React.createElement(EcPill, {
    th: st.th,
    color: st.color
  }), pay.owed && claim.status !== "paid" && React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: pay.color,
      marginLeft: 5
    }
  }, "\u0E2D\u0E2D\u0E01\u0E40\u0E07\u0E34\u0E19\u0E40\u0E2D\u0E07"))));
}
function EcPersonTable({
  claims,
  users,
  onPick
}) {
  const roll = window.ecRollupByPerson(claims);
  const rows = Object.keys(roll).map(k => roll[k]).sort((a, b) => b.owed - a.owed || b.waiting - a.waiting || b.count - a.count);
  const sum = rows.reduce((s, r) => s + r.owed, 0);
  if (!rows.length) {
    return React.createElement("div", {
      style: {
        padding: 28,
        textAlign: "center",
        fontSize: 13,
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A");
  }
  const th = {
    textAlign: "right",
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-3)",
    whiteSpace: "nowrap"
  };
  const td = {
    textAlign: "right",
    padding: "10px",
    fontFamily: "var(--mono)",
    fontSize: 12.5,
    whiteSpace: "nowrap"
  };
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      minWidth: 560,
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "left"
    })
  }, "\u0E0A\u0E37\u0E48\u0E2D"), React.createElement("th", {
    style: th
  }, "\u0E23\u0E48\u0E32\u0E07"), React.createElement("th", {
    style: th
  }, "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), React.createElement("th", {
    style: th
  }, "\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22"), React.createElement("th", {
    style: th
  }, "\u0E08\u0E48\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27"), React.createElement("th", {
    style: th
  }, "\u0E43\u0E1A"))), React.createElement("tbody", null, rows.map(r => {
    const u = (users || []).find(x => x.id === r.id);
    return React.createElement("tr", {
      key: r.id,
      onClick: () => onPick && onPick(r),
      style: {
        borderBottom: "1px solid var(--border)",
        cursor: onPick ? "pointer" : "default"
      }
    }, React.createElement("td", {
      style: {
        padding: "10px",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, r.name, u && !u.active && React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        fontWeight: 500
      }
    }, " \xB7 \u0E1B\u0E34\u0E14\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E41\u0E25\u0E49\u0E27")), React.createElement("td", {
      style: Object.assign({}, td, {
        color: "var(--text-3)"
      })
    }, r.draft ? window.ecBaht(r.draft) : "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        color: r.waiting ? "#F59E0B" : "var(--text-3)"
      })
    }, r.waiting ? window.ecBaht(r.waiting) : "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        fontWeight: 800,
        color: r.owed ? "#EF4444" : "var(--text-3)"
      })
    }, r.owed ? window.ecBaht(r.owed) : "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        color: "var(--text-3)"
      })
    }, r.paid ? window.ecBaht(r.paid) : "—"), React.createElement("td", {
      style: Object.assign({}, td, {
        color: "var(--text-3)"
      })
    }, r.count));
  })), React.createElement("tfoot", null, React.createElement("tr", {
    style: {
      background: "var(--surface2)"
    }
  }, React.createElement("td", {
    style: {
      padding: "11px 10px",
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-2)"
    }
  }, "\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E15\u0E34\u0E14\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48"), React.createElement("td", {
    colSpan: 5,
    style: Object.assign({}, td, {
      fontSize: 15,
      fontWeight: 800,
      color: sum ? "#EF4444" : "var(--text-3)"
    })
  }, window.ecBaht(sum), " \u0E1A\u0E32\u0E17"))))), React.createElement("div", {
    style: {
      padding: "9px 12px",
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.55,
      borderTop: "1px solid var(--border)"
    }
  }, "\u201C\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22\u201D \u0E19\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27\u0E41\u0E25\u0E30\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E2D\u0E2D\u0E01\u0E40\u0E07\u0E34\u0E19\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E01\u0E2D\u0E07\u0E01\u0E25\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E2B\u0E19\u0E35\u0E49\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E04\u0E37\u0E19\u0E43\u0E04\u0E23 \u0E08\u0E36\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E19\u0E31\u0E1A", onPick ? " · กดที่ชื่อเพื่อดูใบของคนนั้น" : ""));
}
function EcJobTable({
  claims,
  jobs,
  onPick
}) {
  const roll = window.ecRollupByJob(claims);
  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach(j => {
      if (j && j.id) m[j.id] = j;
    });
    return m;
  }, [jobs]);
  const rows = Object.keys(roll).map(k => {
    const r = roll[k];
    const j = jobById[r.jobId] || null;
    const labor = j && j.laborCost ? Number(j.laborCost) || 0 : 0;
    return Object.assign({}, r, {
      job: j,
      labor: labor,
      grand: window.ecRound(r.total + labor)
    });
  }).sort((a, b) => b.grand - a.grand);
  if (!rows.length) {
    return React.createElement("div", {
      style: {
        padding: 28,
        textAlign: "center",
        fontSize: 13,
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E17\u0E35\u0E48\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19 \u2014 \u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E23\u0E32\u0E22\u0E44\u0E0B\u0E15\u0E4C\u0E19\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E44\u0E27\u0E49\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19");
  }
  const sumCash = rows.reduce((a, r) => a + r.total, 0);
  const sumLabor = rows.reduce((a, r) => a + r.labor, 0);
  return React.createElement("div", null, rows.map(r => React.createElement("div", {
    key: r.jobId,
    onClick: () => onPick && onPick(r),
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      marginBottom: 7,
      cursor: onPick ? "pointer" : "default"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 180
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, r.name || "-"), React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--mono)",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, r.code, " \xB7 ", r.count, " \u0E43\u0E1A", r.waitCount > 0 && React.createElement("span", {
    style: {
      color: "#F59E0B"
    }
  }, " \xB7 \u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E2D\u0E35\u0E01 ", r.waitCount, " \u0E43\u0E1A ", window.ecBahtShort(r.waiting), " \u0E1A\u0E32\u0E17"), !r.job && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontFamily: "inherit"
    }
  }, " \xB7 \u0E07\u0E32\u0E19\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))), React.createElement("span", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, Object.keys(r.byKind).map(k => React.createElement(EcPill, {
    key: k,
    th: window.ecKindOf(k).th,
    color: window.ecKindOf(k).color,
    sub: window.ecBahtShort(r.byKind[k])
  })))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      justifyContent: "flex-end",
      marginTop: 9,
      paddingTop: 8,
      borderTop: "1px dashed var(--border)"
    }
  }, React.createElement(EcMini, {
    label: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    value: window.ecBaht(r.total),
    color: "var(--text-1)"
  }), React.createElement(EcMini, {
    label: "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32",
    value: r.labor ? window.ecBaht(r.labor) : "ยังไม่ตั้ง",
    color: "var(--text-3)"
  }), React.createElement(EcMini, {
    label: "\u0E23\u0E27\u0E21",
    value: window.ecBaht(r.grand),
    color: "var(--text-1)",
    big: true
  })))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      justifyContent: "flex-end",
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement(EcMini, {
    label: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21",
    value: window.ecBaht(sumCash),
    color: "var(--text-1)"
  }), React.createElement(EcMini, {
    label: "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32\u0E23\u0E27\u0E21",
    value: window.ecBaht(sumLabor),
    color: "var(--text-3)"
  }), React.createElement(EcMini, {
    label: "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    value: window.ecBaht(window.ecRound(sumCash + sumLabor)),
    color: "var(--text-1)",
    big: true
  })), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.55,
      marginTop: 9
    }
  }, "\u201C\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u201D \u0E19\u0E31\u0E1A\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E2A\u0E14\u0E07\u0E41\u0E22\u0E01\u0E44\u0E27\u0E49 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E37\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19 \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21\u0E04\u0E48\u0E32\u0E02\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1A\u0E34\u0E01\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E02\u0E2D\u0E07\u0E19\u0E31\u0E49\u0E19\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E0B\u0E37\u0E49\u0E2D\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19\u0E41\u0E25\u0E49\u0E27 \u0E04\u0E19\u0E25\u0E30\u0E01\u0E49\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19\u0E01\u0E31\u0E19 \u0E40\u0E2D\u0E32\u0E44\u0E1B\u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A BOQ \u0E15\u0E23\u0E07 \u0E46 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"));
}
function EcMini({
  label,
  value,
  color,
  big
}) {
  return React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, label), React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--mono)",
      fontSize: big ? 15 : 13,
      fontWeight: big ? 800 : 700,
      color: color,
      marginTop: 1
    }
  }, value));
}
function EcJobButton({
  job,
  sum,
  onOpen
}) {
  const s = sum || {
    total: 0,
    count: 0,
    waiting: 0,
    waitCount: 0,
    owed: 0
  };
  const color = s.waitCount ? "#F59E0B" : s.total ? "#0EA5E9" : "#94A3B8";
  const sub = !s.count && !s.waitCount ? "ยังไม่มีใบเบิกของงานนี้ — กดเพื่อเปิดใบ" : [s.count ? window.ecBaht(s.total) + " บาท · " + s.count + " ใบ" : "", s.waitCount ? "รออนุมัติ " + s.waitCount + " ใบ" : "", s.owed ? "ค้างจ่ายพนักงาน " + window.ecBahtShort(s.owed) : ""].filter(Boolean).join(" · ");
  return React.createElement("button", {
    onClick: onOpen,
    style: {
      width: "100%",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderLeft: "3px solid " + color,
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
    name: "wallet",
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
  }, "\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: color,
      fontWeight: 700,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, sub)), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  }));
}
function ExpenseView({
  jobs,
  users,
  role,
  currentUser,
  focus
}) {
  const store = window.useEcClaims();
  const [tab, setTab] = React.useState("mine");
  const [open, setOpen] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [newJob, setNewJob] = React.useState("");
  const [jobFilter, setJobFilter] = React.useState("");
  const canApprove = window.ecCanApprove(role);
  const uid = currentUser ? currentUser.id : null;
  React.useEffect(() => {
    if (!focus || !focus.jobId) return;
    setJobFilter(focus.jobId);
    setNewJob(focus.jobId);
    setTab(canApprove ? "all" : "mine");
    setQ("");
  }, [focus && focus.at]);
  const all = React.useMemo(() => window.ecVisible(store.claims, currentUser, role), [store.claims, currentUser, role]);
  const jobById = React.useMemo(() => {
    const m = {};
    (jobs || []).forEach(j => {
      if (j && j.id) m[j.id] = j;
    });
    return m;
  }, [jobs]);
  const roll = React.useMemo(() => window.ecRollup(all, currentUser, role), [all, currentUser, role]);
  const list = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    let out = all;
    if (jobFilter) out = out.filter(c => (c.jobId || "") === jobFilter);
    if (tab === "mine") out = out.filter(c => c.byId === uid);else if (tab === "inbox") out = out.filter(c => c.status === "sent" && window.ecApproveCheck(c, currentUser, role).ok);
    if (kw) out = out.filter(c => [c.no, c.byName, c.siteCode, c.siteName, c.note, window.ecKindOf(c.kind).th].some(v => String(v || "").toLowerCase().includes(kw)));
    return out;
  }, [all, tab, q, uid, currentUser, role, jobFilter]);
  const openNew = () => {
    const job = newJob ? jobById[newJob] : null;
    const rec = window.ecBlank(job, currentUser, store.claims, users);
    store.save(rec);
    setOpen(rec.id);
    setTab("mine");
  };
  const move = (c, to, note) => {
    const rec = window.ecMove(c, to, currentUser, note);
    if (!rec) return;
    store.save(rec);
    const money = window.ecBaht(rec.amount) + " บาท";
    const where = rec.siteCode ? " · " + rec.siteCode : "";
    if (to === "sent") {
      window.ecNotify(rec.approverId ? {
        toUserId: rec.approverId,
        title: "ใบเบิกเงินรออนุมัติ · " + rec.no,
        body: (rec.byName || "") + " · " + money + where
      } : {
        toPerm: "expenseApprove",
        title: "ใบเบิกเงินรออนุมัติ · " + rec.no,
        body: (rec.byName || "") + " · " + money + where
      });
    } else if (to === "approved" || to === "rejected" || to === "paid") {
      window.ecNotify({
        toUserId: rec.byId,
        title: (to === "approved" ? "อนุมัติใบเบิกแล้ว · " : to === "rejected" ? "ไม่อนุมัติใบเบิก · " : "จ่ายเงินคืนแล้ว · ") + rec.no,
        body: money + where + (note ? " · " + note : "")
      });
    }
  };
  const cur = (store.claims || []).find(c => c.id === open) || null;
  const doneJobs = React.useMemo(() => (jobs || []).slice().sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);
  const TABS = [["mine", "ใบของฉัน", "pen", roll.mineOpen]].concat(canApprove ? [["inbox", "รออนุมัติ", "check", roll.waitingMine]] : []).concat(canApprove ? [["person", "ยอดรายคน", "users", 0], ["job", "ต้นทุนรายไซต์", "sun", 0]] : []).concat([["all", canApprove ? "ทั้งหมด" : "ใบที่เกี่ยวกับฉัน", "list", 0]]);
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
  }, React.createElement(EcStat, {
    label: "\u0E43\u0E1A\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E08\u0E1A",
    value: roll.mineOpen,
    unit: "\u0E43\u0E1A",
    color: "var(--text-1)",
    hint: roll.mineOwed ? "รอรับคืน " + window.ecBahtShort(roll.mineOwed) + " บาท" : "ไม่มียอดค้างรับ",
    on: tab === "mine",
    onClick: () => setTab("mine")
  }), canApprove && React.createElement(EcStat, {
    label: "\u0E23\u0E2D\u0E09\u0E31\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34",
    value: roll.waitingMine,
    unit: "\u0E43\u0E1A",
    color: roll.waitingMine ? "#F59E0B" : "var(--text-1)",
    hint: "รออนุมัติทั้งระบบ " + roll.sent + " ใบ · " + window.ecBahtShort(roll.sentAmt) + " บาท",
    on: tab === "inbox",
    onClick: () => setTab("inbox")
  }), canApprove && React.createElement(EcStat, {
    label: "\u0E04\u0E49\u0E32\u0E07\u0E08\u0E48\u0E32\u0E22\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
    value: window.ecBahtShort(roll.owedAmt),
    unit: "\u0E1A\u0E32\u0E17",
    color: roll.owedAmt ? "#EF4444" : "var(--text-1)",
    hint: "อนุมัติแล้วรอจ่าย " + roll.approved + " ใบ",
    on: tab === "person",
    onClick: () => setTab("person")
  }), React.createElement(EcStat, {
    label: "\u0E08\u0E48\u0E32\u0E22\u0E04\u0E37\u0E19\u0E41\u0E25\u0E49\u0E27",
    value: roll.paid,
    unit: "\u0E43\u0E1A",
    color: "#10B981",
    hint: roll.rejected ? "ไม่อนุมัติ " + roll.rejected + " ใบ" : ""
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center",
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E43\u0E2B\u0E21\u0E48"), React.createElement("select", {
    value: newJob,
    onChange: e => setNewJob(e.target.value),
    style: Object.assign({}, EC_INPUT, {
      width: "auto",
      flex: 1,
      minWidth: 200,
      padding: "8px 10px",
      fontSize: 12.5
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E1C\u0E39\u0E01\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19 (\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B) \u2014"), doneJobs.map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name))), React.createElement("button", {
    onClick: openNew,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 15px",
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 800
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "#fff"
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, TABS.map(([k, th, ic, n]) => React.createElement("button", {
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
  }), " ", th, n > 0 && React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11,
      fontWeight: 800,
      color: tab === k ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, n)))), tab === "person" && React.createElement(EcPersonTable, {
    claims: all,
    users: users,
    onPick: r => {
      setJobFilter("");
      setQ(r.name || "");
      setTab("all");
    }
  }), tab === "job" && React.createElement(EcJobTable, {
    claims: all,
    jobs: jobs,
    onPick: r => {
      setQ("");
      setJobFilter(r.jobId);
      setNewJob(r.jobId);
      setTab("all");
    }
  }), tab !== "person" && tab !== "job" && React.createElement(React.Fragment, null, jobFilter && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      padding: "8px 12px",
      borderRadius: 10,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement(Icon, {
    name: "sun",
    size: 13,
    color: "#0EA5E9"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19 ", (jobById[jobFilter] || {}).code || jobFilter, jobById[jobFilter] ? " · " + jobById[jobFilter].name : " · งานถูกลบจากฐานข้อมูล"), React.createElement("button", {
    onClick: () => setJobFilter(""),
    style: {
      marginLeft: "auto",
      padding: "5px 11px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E14\u0E39\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E1A \xB7 \u0E0A\u0E37\u0E48\u0E2D\u0E04\u0E19 \xB7 \u0E23\u0E2B\u0E31\u0E2A\u0E07\u0E32\u0E19 \xB7 \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    style: EC_INPUT
  }), React.createElement("div", null, list.map(c => React.createElement(EcClaimRow, {
    key: c.id,
    claim: c,
    onOpen: setOpen,
    gone: !!c.jobId && !jobById[c.jobId]
  })), !list.length && React.createElement("div", {
    style: {
      padding: 28,
      textAlign: "center",
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, jobFilter ? "งานนี้ยังไม่มีใบเบิก — กด “เปิดใบเบิก” ด้านบนได้เลย" : q ? "ไม่พบใบเบิกที่ตรงกับคำค้น" : tab === "inbox" ? "ไม่มีใบที่รอคุณอนุมัติ" : tab === "mine" ? "ยังไม่มีใบเบิกของคุณ — กด “เปิดใบเบิก” ด้านบน" : "ยังไม่มีใบเบิกในระบบ"))), cur && React.createElement(EcClaimModal, {
    claim: cur,
    job: jobById[cur.jobId] || null,
    users: users,
    role: role,
    currentUser: currentUser,
    onClose: () => setOpen(null),
    onPatch: store.patch,
    onMove: move,
    onRemove: store.remove
  }));
}
Object.assign(window, {
  EC_INPUT,
  EcPill,
  EcStat,
  EcMini,
  EcClaimModal,
  EcClaimRow,
  EcPersonTable,
  EcJobTable,
  EcJobButton,
  ExpenseView
});