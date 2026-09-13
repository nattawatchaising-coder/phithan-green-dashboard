const LN_EC_FIELD = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface2)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 16,
  outline: "none"
};
function LnChips({
  list,
  value,
  onChange
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, list.map(k => {
    const on = value === k.key;
    return React.createElement("button", {
      key: k.key,
      onClick: () => onChange(k.key),
      style: {
        padding: "9px 13px",
        borderRadius: 11,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        border: "1px solid " + (on ? k.color : "var(--border-strong)"),
        background: on ? k.color + "1A" : "var(--surface2)",
        color: on ? k.color : "var(--text-2)"
      }
    }, k.th);
  }));
}
function LnEcForm({
  me,
  users,
  role,
  jobs,
  store,
  claim,
  onClose
}) {
  const [c, setC] = React.useState(claim);
  const [busy, setBusy] = React.useState(false);
  const [zoom, setZoom] = React.useState(null);
  const rec = useEcReceiptsSafe(c.id);
  const locked = c.status !== "draft";
  const total = window.ecSum(c.items);
  const set = fields => setC(p => Object.assign({}, p, fields));
  const rows = c.items && c.items.length ? c.items : [{
    name: "",
    amount: ""
  }];
  const setRow = (i, k, v) => set({
    items: rows.map((r, x) => x === i ? Object.assign({}, r, {
      [k]: v
    }) : r)
  });
  const addRow = () => set({
    items: rows.concat([{
      name: "",
      amount: ""
    }])
  });
  const delRow = i => set({
    items: rows.filter((_, x) => x !== i)
  });
  const onPick = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    store.save(c);
    for (const f of files) {
      try {
        rec.add(await window.resizeImageFile(f, 1100, 0.70), me, {
          kind: "img",
          name: f.name,
          size: f.size
        });
      } catch (err) {}
    }
    setBusy(false);
  };
  const saveDraft = () => {
    store.save(c);
    onClose();
  };
  const send = () => {
    if (busy) return;
    setBusy(true);
    const next = window.ecMove(Object.assign({}, c, {
      amount: total
    }), "sent", me, "");
    store.save(next);
    const money = window.ecBaht(next.amount) + " บาท";
    const where = next.siteCode ? " · " + next.siteCode : "";
    window.ecNotify(next.approverId ? {
      toUserId: next.approverId,
      title: "ใบเบิกเงินรออนุมัติ · " + next.no,
      body: (next.byName || "") + " · " + money + where
    } : {
      toPerm: "expenseApprove",
      title: "ใบเบิกเงินรออนุมัติ · " + next.no,
      body: (next.byName || "") + " · " + money + where
    });
    onClose();
  };
  const noBill = rec.shots.length === 0;
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60,
      background: "var(--bg)",
      overflowY: "auto",
      overflowX: "hidden"
    }
  }, React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      paddingTop: "calc(13px + env(safe-area-inset-top, 0px))"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: 4,
      lineHeight: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 20,
    color: "var(--text-2)"
  })), React.createElement("b", {
    style: {
      fontSize: 15.5,
      color: "var(--text-1)"
    }
  }, locked ? "ใบเบิกเงิน" : "เบิกเงิน"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, c.no)), React.createElement("div", {
    style: {
      padding: 18,
      display: "grid",
      gap: 14
    }
  }, locked && React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 12.5,
      fontWeight: 700,
      textAlign: "center",
      background: window.ecStatusOf(c.status).color + "1A",
      color: window.ecStatusOf(c.status).color
    }
  }, window.ecStatusOf(c.status).th, " \u2014 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E08\u0E32\u0E01\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E41\u0E25\u0E49\u0E27"), React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E08\u0E48\u0E32\u0E22\u0E04\u0E48\u0E32\u0E2D\u0E30\u0E44\u0E23"), locked ? React.createElement("b", {
    style: {
      fontSize: 14,
      color: window.ecKindOf(c.kind).color
    }
  }, window.ecKindOf(c.kind).th) : React.createElement(LnChips, {
    list: window.EC_KIND,
    value: c.kind,
    onChange: v => set({
      kind: v
    })
  })), React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E43\u0E04\u0E23\u0E2D\u0E2D\u0E01\u0E40\u0E07\u0E34\u0E19\u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19"), locked ? React.createElement("b", {
    style: {
      fontSize: 14,
      color: window.ecPayOf(c.payMethod).color
    }
  }, window.ecPayOf(c.payMethod).th) : React.createElement(LnChips, {
    list: window.EC_PAY,
    value: c.payMethod,
    onChange: v => set({
      payMethod: v
    })
  }), !locked && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, window.ecPayOf(c.payMethod).hint)), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19"), React.createElement("input", {
    type: "date",
    value: c.date,
    disabled: locked,
    onChange: e => set({
      date: e.target.value
    }),
    style: LN_EC_FIELD
  })), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)"), React.createElement("select", {
    value: c.jobId || "",
    disabled: locked,
    style: LN_EC_FIELD,
    onChange: e => {
      const j = (jobs || []).find(x => x.id === e.target.value);
      set({
        jobId: j ? j.id : null,
        siteCode: j ? j.code : "",
        siteName: j ? j.name : ""
      });
    }
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), (jobs || []).slice(0, 80).map(j => React.createElement("option", {
    key: j.id,
    value: j.id
  }, j.code, " \xB7 ", j.name)))), React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22"), rows.map((r, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 7
    }
  }, React.createElement("input", {
    value: r.name || "",
    disabled: locked,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E32\u0E22\u0E44\u0E1F 2.5 sq.mm.",
    onChange: e => setRow(i, "name", e.target.value),
    style: Object.assign({}, LN_EC_FIELD, {
      flex: 1
    })
  }), React.createElement("input", {
    value: r.amount || "",
    disabled: locked,
    inputMode: "decimal",
    placeholder: "0.00",
    onChange: e => setRow(i, "amount", e.target.value),
    style: Object.assign({}, LN_EC_FIELD, {
      width: 104,
      fontFamily: "var(--mono)",
      textAlign: "right"
    })
  }), !locked && rows.length > 1 && React.createElement("button", {
    onClick: () => delRow(i),
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: "0 2px"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 17,
    color: "var(--text-3)"
  })))), !locked && React.createElement("button", {
    onClick: addRow,
    style: {
      padding: "10px 13px",
      borderRadius: 11,
      border: "1px dashed var(--border-strong)",
      background: "none",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      paddingTop: 3
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E23\u0E27\u0E21"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 22,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.ecBaht(total)), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E32\u0E17"))), React.createElement("label", {
    style: {
      display: "grid",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), React.createElement("textarea", {
    rows: 2,
    value: c.note || "",
    disabled: locked,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0B\u0E37\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E23\u0E49\u0E32\u0E19\u0E43\u0E01\u0E25\u0E49\u0E44\u0E0B\u0E15\u0E4C\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E02\u0E2D\u0E07\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E2B\u0E21\u0E14",
    onChange: e => set({
      note: e.target.value
    }),
    style: Object.assign({}, LN_EC_FIELD, {
      resize: "vertical",
      lineHeight: 1.6
    })
  })), React.createElement("div", {
    style: {
      display: "grid",
      gap: 7
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E34\u0E25 / \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, rec.shots.map(s => React.createElement("div", {
    key: s.id,
    style: {
      position: "relative"
    }
  }, React.createElement("img", {
    src: s.dataUrl,
    alt: "",
    onClick: () => setZoom(s.dataUrl),
    style: {
      width: 84,
      height: 84,
      objectFit: "cover",
      borderRadius: 10,
      border: "1px solid var(--border)"
    }
  }), !locked && React.createElement("button", {
    onClick: () => rec.remove(s.id),
    style: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 99,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      fontSize: 14,
      fontWeight: 800,
      cursor: "pointer",
      lineHeight: "24px",
      padding: 0
    }
  }, "\xD7"))), !locked && React.createElement("label", {
    style: {
      width: 84,
      height: 84,
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 22,
    color: "var(--text-3)"
  }), React.createElement("input", {
    type: "file",
    accept: "image/*",
    capture: "environment",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  }))), noBill && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      lineHeight: 1.6
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1A\u0E34\u0E25\u0E41\u0E19\u0E1A \u2014 \u0E2A\u0E48\u0E07\u0E44\u0E14\u0E49 \u0E41\u0E15\u0E48\u0E04\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E21\u0E31\u0E01\u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E02\u0E2D\u0E1A\u0E34\u0E25 \u0E16\u0E48\u0E32\u0E22\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E40\u0E23\u0E47\u0E27\u0E01\u0E27\u0E48\u0E32\u0E21\u0E32\u0E15\u0E32\u0E21\u0E17\u0E35\u0E2B\u0E25\u0E31\u0E07")), !locked && React.createElement("div", {
    style: {
      display: "grid",
      gap: 9,
      paddingTop: 3
    }
  }, React.createElement("button", {
    onClick: send,
    disabled: busy || total <= 0,
    style: {
      width: "100%",
      padding: "16px 18px",
      borderRadius: 15,
      border: "none",
      fontFamily: "inherit",
      fontSize: 16,
      fontWeight: 800,
      cursor: "pointer",
      background: !busy && total > 0 ? "var(--primary)" : "var(--surface3)",
      color: !busy && total > 0 ? "#fff" : "var(--text-3)"
    }
  }, busy ? "กำลังบันทึก…" : "ส่งขออนุมัติ"), React.createElement("button", {
    onClick: saveDraft,
    disabled: busy,
    style: {
      width: "100%",
      padding: "13px 18px",
      borderRadius: 13,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19"), total <= 0 && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      textAlign: "center"
    }
  }, "\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E21\u0E35\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), locked && (c.hist || []).length > 0 && React.createElement("div", {
    style: {
      display: "grid",
      gap: 5,
      paddingTop: 3
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E43\u0E1A\u0E19\u0E35\u0E49"), (c.hist || []).slice().reverse().slice(0, 6).map((h, i) => React.createElement("div", {
    key: i,
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, window.drShort(String(h.at || "").slice(0, 10)), " \xB7 ", window.ecStatusOf(h.to).th, h.byName ? " โดย " + h.byName : "", h.note ? " — " + h.note : "")))), zoom && React.createElement("div", {
    onClick: () => setZoom(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 70,
      background: "rgba(0,0,0,.92)",
      display: "grid",
      placeItems: "center",
      padding: 14,
      cursor: "zoom-out"
    }
  }, React.createElement("img", {
    src: zoom,
    alt: "",
    style: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain"
    }
  })));
}
function useEcReceiptsSafe(id) {
  return window.useEcReceipts(id || null);
}
function LnEcTab({
  me,
  users,
  role,
  jobs
}) {
  const store = window.useEcClaims();
  const [open, setOpen] = React.useState(null);
  const mine = React.useMemo(() => (store.claims || []).filter(c => c && c.byId === (me || {}).id), [store.claims, me]);
  const owed = mine.reduce((s, c) => s + (c.status === "approved" && window.ecPayOf(c.payMethod).owed ? window.ecRound(c.amount) : 0), 0);
  if (!window.ecCanUse(role)) {
    return React.createElement("div", {
      style: {
        padding: 34,
        textAlign: "center",
        color: "var(--text-3)",
        fontSize: 13.5
      }
    }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E07\u0E34\u0E19");
  }
  return React.createElement("div", {
    style: {
      padding: 18
    }
  }, owed > 0 && React.createElement("div", {
    style: {
      padding: "13px 15px",
      borderRadius: 14,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 13
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17\u0E15\u0E34\u0E14\u0E40\u0E07\u0E34\u0E19\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--mono)",
      fontSize: 20,
      fontWeight: 800,
      color: "#EF4444"
    }
  }, window.ecBaht(owed)), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E32\u0E17")), React.createElement("button", {
    onClick: () => setOpen(window.ecBlank(null, me, store.claims, users)),
    style: {
      width: "100%",
      padding: "15px 18px",
      borderRadius: 14,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 15.5,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E43\u0E2B\u0E21\u0E48"), React.createElement("div", {
    style: {
      marginTop: 16,
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)",
      marginBottom: 7
    }
  }, "\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19"), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 13,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, mine.length === 0 ? React.createElement("div", {
    style: {
      padding: 24,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E40\u0E1A\u0E34\u0E01") : mine.slice(0, 25).map(c => {
    const st = window.ecStatusOf(c.status);
    return React.createElement("button", {
      key: c.id,
      onClick: () => setOpen(c),
      style: {
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "12px 13px",
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
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, window.ecKindOf(c.kind).th), React.createElement("span", {
      style: {
        padding: "2px 8px",
        borderRadius: 99,
        background: st.color + "1A",
        color: st.color,
        fontSize: 10.5,
        fontWeight: 800
      }
    }, st.th), React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontFamily: "var(--mono)",
        fontSize: 13.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, window.ecBaht(c.amount))), React.createElement("div", {
      style: {
        marginTop: 3,
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, window.drShort(c.date), c.siteCode ? " · " + c.siteCode : "", c.receiptCount ? " · บิล " + c.receiptCount + " ใบ" : " · ไม่มีบิลแนบ"));
  })), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7,
      textAlign: "center"
    }
  }, "\u0E04\u0E19\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E01\u0E14\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E41\u0E17\u0E47\u0E1A \u201C\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u201D \xB7 \u0E01\u0E32\u0E23\u0E08\u0E48\u0E32\u0E22\u0E40\u0E07\u0E34\u0E19\u0E04\u0E37\u0E19\u0E17\u0E33\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A", React.createElement("br", null), "\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07\u0E08\u0E32\u0E01\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E1A\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E23\u0E2D\u0E01\u0E0B\u0E49\u0E33"), open && React.createElement(LnEcForm, {
    me: me,
    users: users,
    role: role,
    jobs: jobs,
    store: store,
    claim: open,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  LnEcTab,
  LnEcForm,
  LnChips
});