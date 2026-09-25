const PM_STATE_COLOR = {
  na: "#94A3B8",
  empty: "#94A3B8",
  partial: "#F59E0B",
  done: "var(--tint-green-tx)"
};
const pmInputStyle = {
  width: "100%",
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13.5,
  boxSizing: "border-box"
};
function PmField({
  field,
  value,
  prefilled,
  onCommit
}) {
  const [v, setV] = React.useState(value == null ? "" : String(value));
  const ref = React.useRef(value);
  React.useEffect(() => {
    if (String(ref.current == null ? "" : ref.current) !== String(value == null ? "" : value)) {
      ref.current = value;
      setV(value == null ? "" : String(value));
    }
  }, [value]);
  const commit = () => {
    ref.current = v;
    onCommit(field.key, v);
  };
  const label = React.createElement("label", {
    style: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 4
    }
  }, field.en, React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, " (", field.th, ")"), field.unit ? React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, " \xB7 ", field.unit) : null, field.req ? React.createElement("span", {
    style: {
      color: "#DC2626"
    }
  }, " *") : null, prefilled && String(v).trim() !== "" ? React.createElement("span", {
    style: {
      marginLeft: 6,
      padding: "1px 6px",
      borderRadius: 99,
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontSize: 10,
      fontWeight: 700
    }
  }, window.PM_FROM_LABEL[field.from] || "เติมให้") : null);
  return React.createElement("div", {
    style: {
      marginBottom: 11
    }
  }, label, field.type === "area" ? React.createElement("textarea", {
    value: v,
    rows: 2,
    onChange: e => setV(e.target.value),
    onBlur: commit,
    style: Object.assign({}, pmInputStyle, {
      resize: "vertical"
    })
  }) : field.type === "select" ? React.createElement("select", {
    value: v,
    onChange: e => {
      setV(e.target.value);
      ref.current = e.target.value;
      onCommit(field.key, e.target.value);
    },
    style: pmInputStyle
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014"), (field.opts || []).map(o => React.createElement("option", {
    key: o,
    value: o
  }, o))) : React.createElement("input", {
    value: v,
    type: field.type === "date" ? "date" : field.type === "num" ? "number" : "text",
    placeholder: field.ph || "",
    inputMode: field.type === "num" ? "decimal" : undefined,
    onChange: e => setV(e.target.value),
    onBlur: commit,
    style: pmInputStyle
  }));
}
function PmDocRow({
  item,
  job,
  value,
  onSet
}) {
  const lb = window.pmDocLabel(item, job);
  const btn = (val, text, color) => {
    const on = value === val;
    return React.createElement("button", {
      onClick: () => onSet(item.key, on ? null : val),
      style: {
        width: 38,
        height: 32,
        borderRadius: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 15,
        fontWeight: 800,
        border: "1px solid " + (on ? color : "var(--border-strong)"),
        background: on ? color : "var(--surface)",
        color: on ? "#fff" : "var(--text-3)"
      }
    }, text);
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 0",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-1)"
    }
  }, lb.en), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, lb.th)), btn("y", "√", "#16A34A"), btn("n", "–", "#64748B"));
}
function PmCell({
  col,
  value,
  onCommit,
  mobile
}) {
  const [v, setV] = React.useState(value == null ? "" : String(value));
  const ref = React.useRef(value);
  React.useEffect(() => {
    if (String(ref.current == null ? "" : ref.current) !== String(value == null ? "" : value)) {
      ref.current = value;
      setV(value == null ? "" : String(value));
    }
  }, [value]);
  const commit = () => {
    ref.current = v;
    onCommit(col.key, v);
  };
  const st = Object.assign({}, pmInputStyle, {
    padding: mobile ? "9px 11px" : "6px 8px",
    fontSize: mobile ? 13.5 : 12.5,
    borderRadius: 8
  });
  if (col.type === "select") {
    return React.createElement("select", {
      value: v,
      style: st,
      onChange: e => {
        setV(e.target.value);
        ref.current = e.target.value;
        onCommit(col.key, e.target.value);
      }
    }, React.createElement("option", {
      value: ""
    }, "\u2014"), (col.opts || []).map(o => React.createElement("option", {
      key: o,
      value: o
    }, o)));
  }
  return React.createElement("input", {
    value: v,
    type: col.type === "num" ? "number" : "text",
    inputMode: col.type === "num" ? "decimal" : undefined,
    onChange: e => setV(e.target.value),
    onBlur: commit,
    style: st
  });
}
function PmTableRow({
  table,
  row,
  no,
  mobile,
  onSet,
  onRemove
}) {
  const cols = table.cols || [];
  const set = (k, v) => onSet(row.id, k, v);
  const done = cols.every(c => !c.req || String(row[c.key] == null ? "" : row[c.key]).trim() !== "");
  const ok = table.pass && table.resultCol !== false && done ? table.pass(row) : null;
  if (mobile) {
    return React.createElement("div", {
      style: {
        marginBottom: 11,
        padding: 11,
        border: "1px solid var(--border)",
        borderRadius: 11,
        background: "var(--surface)"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 12,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, "\u0E41\u0E16\u0E27\u0E17\u0E35\u0E48 ", no), ok === null ? null : React.createElement("span", {
      style: {
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 10.5,
        fontWeight: 800,
        background: ok ? "var(--tint-ok-bg)" : "var(--tint-red-bg)",
        color: ok ? "var(--tint-ok-tx)" : "#B91C1C"
      }
    }, ok ? "ผ่าน" : "ยังไม่ผ่าน"), React.createElement("button", {
      onClick: () => onRemove(row),
      "aria-label": "\u0E25\u0E1A\u0E41\u0E16\u0E27",
      style: {
        width: 28,
        height: 28,
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-3)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        lineHeight: 1
      }
    }, "\xD7")), cols.map(c => React.createElement("div", {
      key: c.key,
      style: {
        marginBottom: 8
      }
    }, React.createElement("label", {
      style: {
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-2)",
        marginBottom: 3
      }
    }, c.en, " ", React.createElement("span", {
      style: {
        fontWeight: 400,
        color: "var(--text-3)"
      }
    }, "(", c.th, ")"), c.unit ? React.createElement("span", {
      style: {
        fontWeight: 400,
        color: "var(--text-3)"
      }
    }, " \xB7 ", c.unit) : null, c.req ? React.createElement("span", {
      style: {
        color: "#DC2626"
      }
    }, " *") : null), React.createElement(PmCell, {
      col: c,
      value: row[c.key],
      onCommit: set,
      mobile: true
    }))));
  }
  return React.createElement("tr", null, React.createElement("td", {
    style: {
      padding: "4px 5px",
      fontSize: 11,
      color: "var(--text-3)",
      textAlign: "center",
      verticalAlign: "middle"
    }
  }, no), cols.map(c => React.createElement("td", {
    key: c.key,
    style: {
      padding: "4px 5px",
      verticalAlign: "middle"
    }
  }, React.createElement(PmCell, {
    col: c,
    value: row[c.key],
    onCommit: set,
    mobile: false
  }))), React.createElement("td", {
    style: {
      padding: "4px 5px",
      textAlign: "center",
      verticalAlign: "middle",
      whiteSpace: "nowrap"
    }
  }, ok === null ? null : React.createElement("span", {
    style: {
      marginRight: 5,
      padding: "2px 7px",
      borderRadius: 99,
      fontSize: 10,
      fontWeight: 800,
      background: ok ? "var(--tint-ok-bg)" : "var(--tint-red-bg)",
      color: ok ? "var(--tint-ok-tx)" : "#B91C1C"
    }
  }, ok ? "ผ่าน" : "NG"), React.createElement("button", {
    onClick: () => onRemove(row),
    "aria-label": "\u0E25\u0E1A\u0E41\u0E16\u0E27",
    style: {
      width: 26,
      height: 26,
      borderRadius: 7,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-3)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      lineHeight: 1
    }
  }, "\xD7")));
}
function PmTableBlock({
  table,
  hdr,
  rows,
  mobile,
  onHdr,
  onSet,
  onAdd,
  onRemove,
  onSeed
}) {
  const cols = table.cols || [];
  return React.createElement("div", {
    style: {
      marginBottom: 22
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 9,
      paddingBottom: 4,
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, table.code ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, table.code, " \xB7 ") : null, table.en, " ", React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "(", table.th, ")")), React.createElement("span", {
    style: {
      flexShrink: 0,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, rows.length, " \u0E41\u0E16\u0E27")), (table.hdr || []).length ? React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
      columnGap: 14,
      marginBottom: 6
    }
  }, (table.hdr || []).map(f => React.createElement(PmField, {
    key: f.key,
    field: f,
    value: hdr[f.key],
    prefilled: false,
    onCommit: onHdr
  }))) : null, table.unitNote ? React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginBottom: 7
    }
  }, table.unitNote) : null, !rows.length ? React.createElement("div", {
    style: {
      padding: "14px 12px",
      border: "1px dashed var(--border-strong)",
      borderRadius: 11,
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)",
      marginBottom: 9
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E16\u0E27\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E19\u0E35\u0E49") : mobile ? rows.map((r, i) => React.createElement(PmTableRow, {
    key: r.id,
    table: table,
    row: r,
    no: i + 1,
    mobile: true,
    onSet: onSet,
    onRemove: onRemove
  })) : React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 40 + cols.length * 96
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      width: 28,
      padding: "4px 5px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "#"), cols.map(c => React.createElement("th", {
    key: c.key,
    style: {
      padding: "4px 5px",
      textAlign: "left",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, c.en, c.req ? React.createElement("span", {
    style: {
      color: "#DC2626"
    }
  }, " *") : null, React.createElement("span", {
    style: {
      display: "block",
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, c.th, c.unit ? " · " + c.unit : ""))), React.createElement("th", {
    style: {
      width: 66
    }
  }))), React.createElement("tbody", null, rows.map((r, i) => React.createElement(PmTableRow, {
    key: r.id,
    table: table,
    row: r,
    no: i + 1,
    mobile: false,
    onSet: onSet,
    onRemove: onRemove
  }))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 9
    }
  }, React.createElement("button", {
    onClick: onAdd,
    style: {
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27"), table.seed && !rows.length ? React.createElement("button", {
    onClick: onSeed,
    style: {
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E16\u0E27\u0E08\u0E32\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48") : null));
}
function PmSignRow({
  block,
  value,
  onCommit
}) {
  const v = value || {};
  const [name, setName] = React.useState(v.name || "");
  const [date, setDate] = React.useState(v.date || "");
  React.useEffect(() => {
    setName((value || {}).name || "");
    setDate((value || {}).date || "");
  }, [value]);
  return React.createElement("div", {
    style: {
      marginBottom: 13,
      padding: 11,
      border: "1px solid var(--border)",
      borderRadius: 10,
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-1)",
      marginBottom: 6
    }
  }, block.en, " ", React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "(", block.th, ")")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("input", {
    value: name,
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E25\u0E07\u0E19\u0E32\u0E21",
    onChange: e => setName(e.target.value),
    onBlur: () => onCommit(block.key, {
      name: name,
      date: date
    }),
    style: Object.assign({}, pmInputStyle, {
      flex: 2,
      minWidth: 160
    })
  }), React.createElement("input", {
    value: date,
    type: "date",
    onChange: e => {
      setDate(e.target.value);
      onCommit(block.key, {
        name: name,
        date: e.target.value
      });
    },
    style: Object.assign({}, pmInputStyle, {
      flex: 1,
      minWidth: 140
    })
  })), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 5
    }
  }, "\u0E43\u0E1A\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2D\u0E2D\u0E01\u0E21\u0E32\u0E22\u0E31\u0E07\u0E40\u0E27\u0E49\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E0B\u0E47\u0E19\u0E14\u0E49\u0E27\u0E22\u0E1B\u0E32\u0E01\u0E01\u0E32\u0E44\u0E27\u0E49\u0E40\u0E2A\u0E21\u0E2D"));
}
function PmHandoverModal({
  job,
  currentUser,
  onClose,
  onSummary
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const jobId = job ? job.id : null;
  const store = window.usePmHandover(jobId);
  const ph = window.usePmPhotoIdx(jobId);
  const [tab, setTab] = React.useState("home");
  const [paper, setPaper] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);
  const rec = store.rec;
  const started = !!(rec && rec.meta);
  const sum = React.useMemo(() => window.pmMerged(rec, job, currentUser), [rec, job, currentUser]);
  const prog = React.useMemo(() => window.pmProgress(rec, job, currentUser), [rec, job, currentUser]);
  const newer = started ? window.pmNewerItems(rec, job, currentUser) : 0;
  const lastShadow = React.useRef("");
  React.useEffect(() => {
    if (!started || !onSummary || window.PM_ROOT) return;
    const s = window.pmSummaryOf(rec, job, currentUser);
    const sig = [s.pct, s.done, s.total, s.status, s.ver].join("|");
    if (sig === lastShadow.current) return;
    lastShadow.current = sig;
    onSummary(s);
  }, [rec, job, currentUser, started, onSummary]);
  if (!job) return null;
  const setField = (key, val) => store.patch("sum", {
    [key]: val == null ? "" : String(val)
  }, currentUser);
  const setDoc = (key, val) => store.patch("docs", {
    [key]: val
  }, currentUser);
  const addSet = g => store.patch("sum", {
    [g.repeat.countKey]: String(g.setCount + 1)
  }, currentUser);
  const removeSet = async g => {
    const filled = (g.fields || []).some(f => String(sum[f.key] == null ? "" : sum[f.key]).trim() !== "");
    if (filled) {
      const ok = await window.askConfirm({
        title: "ลบ" + g.th + "?",
        icon: "alert",
        ok: "ลบชุดนี้",
        danger: true,
        body: "ชุดนี้มีข้อมูลกรอกไว้แล้ว ลบแล้วค่าที่กรอกในชุดนี้จะหายไป"
      });
      if (!ok) return;
    }
    const patch = {
      [g.repeat.countKey]: String(Math.max(1, g.setCount - 1))
    };
    (g.fields || []).forEach(f => {
      patch[f.key] = "";
    });
    store.patch("sum", patch, currentUser);
  };
  const setSign = (key, val) => store.patch("sign", {
    [key]: val
  }, currentUser);
  const tPath = (tb, tail) => "tests/" + tab + "/" + tb.key + (tail ? "/" + tail : "");
  const setHdr = tb => (key, val) => store.patch(tPath(tb, "hdr"), {
    [key]: val == null ? "" : String(val)
  }, currentUser);
  const setCell = tb => (rowId, key, val) => store.patch(tPath(tb, "rows/" + rowId), {
    [key]: val == null ? "" : String(val)
  }, currentUser);
  const addRow = (tb, data) => {
    const rows = window.pmRowsOf(rec, tab, tb.key);
    const row = Object.assign({
      ord: window.pmNextOrd(rows)
    }, data || {});
    store.patch(tPath(tb, "rows/" + window.pmRowId()), row, currentUser);
  };
  const seedRows = tb => {
    const list = tb.seed(job, sum) || [];
    if (!list.length) {
      window.askConfirm({
        title: "ยังสร้างแถวให้ไม่ได้",
        icon: "alert",
        ok: "เข้าใจ",
        danger: false,
        body: "ตารางนี้สร้างแถวจากจำนวนอินเวอร์เตอร์ในแผ่นข้อมูลโครงการ ซึ่งยังไม่ได้กรอก · กรอกจำนวนเครื่องก่อนแล้วกดใหม่"
      });
      return;
    }
    const base = window.pmNextOrd(window.pmRowsOf(rec, tab, tb.key));
    const up = {};
    list.forEach((d, i) => {
      up[window.pmRowId() + i] = Object.assign({
        ord: base + i * 10
      }, d);
    });
    store.patch(tPath(tb, "rows"), up, currentUser);
  };
  const removeRow = async (tb, row) => {
    const filled = (tb.cols || []).some(c => String(row[c.key] == null ? "" : row[c.key]).trim() !== "");
    if (filled) {
      const ok = await window.askConfirm({
        title: "ลบแถวนี้?",
        icon: "trash",
        ok: "ลบแถว",
        danger: true,
        body: "แถวนี้มีค่าที่กรอกไว้แล้ว ลบแล้วค่าในแถวนี้จะหายไป"
      });
      if (!ok) return;
    }
    store.patch(tPath(tb, "rows"), {
      [row.id]: null
    }, currentUser);
  };
  const addPhotos = async files => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < arr.length; i++) {
        if (!arr[i].type || arr[i].type.indexOf("image/") !== 0) continue;
        const dataUrl = await window.resizeImageFile(arr[i], 1100, 0.70);
        ph.add(dataUrl, {
          sec: "gen"
        }, currentUser);
      }
    } finally {
      setBusy(false);
    }
  };
  React.useEffect(() => {
    if (!started) return;
    const flags = window.pmPhotoFlags(ph.idx);
    const cur = rec && rec.flags || {};
    if (JSON.stringify(flags) === JSON.stringify(cur)) return;
    store.patch("flags", flags, currentUser);
  }, [ph.idx, started]);
  const signOff = async () => {
    if (prog.missing.length) {
      const ok = await window.askConfirm({
        title: "ปิดเล่มทั้งที่ยังไม่ครบ?",
        icon: "alert",
        ok: "ปิดเล่มเลย",
        body: "ยังขาดอีก " + prog.missing.length + " รายการ · ปิดเล่มได้ แต่ใบที่พิมพ์ออกมาจะมีหน้าบอกว่าขาดอะไรบ้างติดไปด้วย"
      });
      if (!ok) return;
    }
    store.setStatus("signed", currentUser);
  };
  const secs = window.PM_SECTIONS;
  const cur = window.PM_SEC_BY[tab];
  const tabBtn = sec => {
    const st = prog.bySection[sec.key] || {
      pct: 0,
      state: "empty",
      done: 0,
      total: 0
    };
    const on = tab === sec.key;
    return React.createElement("button", {
      key: sec.key,
      onClick: () => setTab(sec.key),
      style: {
        flexShrink: 0,
        padding: "8px 13px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 12.5,
        fontWeight: 700,
        color: on ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, sec.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 10.5,
        fontWeight: 700,
        color: PM_STATE_COLOR[st.state] || "var(--text-3)"
      }
    }, st.total ? st.done + "/" + st.total + " · " + st.pct + "%" : "ไม่มีรายการบังคับ"));
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 132,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }, React.createElement("div", {
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(760px,100%)",
      maxHeight: isMobile ? "94dvh" : "92vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: "#16A34A1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 17,
    color: "#16A34A"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E2A\u0E21\u0E38\u0E14\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job.code, " \xB7 ", job.name)), React.createElement("button", {
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
  }, "\xD7")), !started ? React.createElement("div", {
    style: {
      padding: 26,
      textAlign: "center"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-2)",
      lineHeight: 1.7,
      marginBottom: 16
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E21\u0E38\u0E14\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49", React.createElement("br", null), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E25\u0E49\u0E27\u0E01\u0E23\u0E2D\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E17\u0E35\u0E25\u0E30\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E17\u0E33\u0E07\u0E32\u0E19 \xB7 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E23\u0E39\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E16\u0E39\u0E01\u0E40\u0E15\u0E34\u0E21\u0E43\u0E2B\u0E49\u0E01\u0E48\u0E2D\u0E19")), React.createElement("button", {
    onClick: () => store.open(currentUser),
    disabled: !window.FBDB,
    style: {
      padding: "11px 20px",
      borderRadius: 11,
      border: "1px solid var(--primary)",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 800,
      cursor: window.FBDB ? "pointer" : "not-allowed",
      opacity: window.FBDB ? 1 : .5
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E21\u0E38\u0E14\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A"), !window.FBDB ? React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 10
    }
  }, "\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E48\u0E2D\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E25\u0E48\u0E21\u0E44\u0E14\u0E49") : null) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: "10px 16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E01\u0E23\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 ", prog.pct, "%"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "(", prog.done, "/", prog.total, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), (rec.meta || {}).status === "signed" ? React.createElement("span", {
    style: {
      padding: "3px 9px",
      borderRadius: 99,
      background: "var(--tint-ok-bg)",
      border: "1px solid var(--tint-ok-bd)",
      color: "var(--tint-ok-tx)",
      fontSize: 10.5,
      fontWeight: 800
    }
  }, "\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E41\u0E25\u0E49\u0E27") : null), React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 99,
      background: "var(--border)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: prog.pct + "%",
      height: "100%",
      borderRadius: 99,
      background: prog.pct >= 100 ? "var(--tint-green-tx)" : "#F59E0B",
      transition: "width .2s"
    }
  }))), newer ? React.createElement("div", {
    style: {
      flexShrink: 0,
      padding: "9px 16px",
      background: "var(--tint-amber-bg)",
      borderBottom: "1px solid var(--tint-amber-bd)",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 12,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E2B\u0E21\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E21\u0E32 ", newer, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E40\u0E25\u0E48\u0E21\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E43\u0E0A\u0E49\u0E41\u0E1A\u0E1A\u0E40\u0E14\u0E34\u0E21\u0E2D\u0E22\u0E39\u0E48"), React.createElement("button", {
    onClick: store.bumpVer,
    style: {
      flexShrink: 0,
      padding: "6px 11px",
      borderRadius: 8,
      border: "1px solid var(--tint-amber-bd)",
      background: "var(--surface)",
      color: "var(--tint-amber-tx)",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21")) : null, React.createElement("div", {
    style: {
      flexShrink: 0,
      display: "flex",
      gap: 8,
      padding: "10px 16px",
      overflowX: "auto",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("button", {
    onClick: () => setTab("home"),
    style: {
      flexShrink: 0,
      padding: "8px 13px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      border: "1px solid " + (tab === "home" ? "var(--primary)" : "var(--border-strong)"),
      background: tab === "home" ? "var(--primary-soft)" : "var(--surface)",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      fontWeight: 700,
      color: tab === "home" ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, "\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      fontWeight: 700,
      color: PM_STATE_COLOR[prog.pct >= 100 ? "done" : "partial"]
    }
  }, prog.done, "/", prog.total, " \xB7 ", prog.pct, "%")), secs.map(tabBtn), React.createElement("button", {
    onClick: () => setTab("photo"),
    style: {
      flexShrink: 0,
      padding: "8px 13px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      border: "1px solid " + (tab === "photo" ? "var(--primary)" : "var(--border-strong)"),
      background: tab === "photo" ? "var(--primary-soft)" : "var(--surface)",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      fontWeight: 700,
      color: tab === "photo" ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, "\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, ph.idx.length, " \u0E23\u0E39\u0E1B"))), React.createElement("div", {
    style: {
      padding: 16,
      overflowY: "auto",
      flex: 1,
      minHeight: 0
    }
  }, tab === "home" ? React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.7,
      marginBottom: 13
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E21\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E01\u0E23\u0E2D\u0E01\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27 ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, prog.pct, "%"), " ", "(", prog.done, " \u0E08\u0E32\u0E01 ", prog.total, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)", prog.missing.length ? React.createElement("span", null, " \xB7 \u0E22\u0E31\u0E07\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ", prog.missing.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23") : React.createElement("span", null, " \xB7 \u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27")), secs.map(sec => {
    const st = prog.bySection[sec.key] || {
      pct: 0,
      done: 0,
      total: 0,
      state: "empty"
    };
    return React.createElement("button", {
      key: sec.key,
      onClick: () => setTab(sec.key),
      style: {
        display: "block",
        width: "100%",
        textAlign: "left",
        marginBottom: 9,
        padding: "11px 13px",
        borderRadius: 12,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 9
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, sec.th), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, sec.en)), React.createElement("span", {
      style: {
        flexShrink: 0,
        fontSize: 12,
        fontWeight: 800,
        color: PM_STATE_COLOR[st.state] || "var(--text-3)"
      }
    }, st.total ? st.done + "/" + st.total + " · " + st.pct + "%" : "ไม่บังคับ")), st.total ? React.createElement("div", {
      style: {
        height: 5,
        borderRadius: 99,
        background: "var(--border)",
        overflow: "hidden",
        marginTop: 8
      }
    }, React.createElement("div", {
      style: {
        width: st.pct + "%",
        height: "100%",
        borderRadius: 99,
        background: PM_STATE_COLOR[st.state] || "var(--border-strong)"
      }
    })) : null);
  }), React.createElement("button", {
    onClick: () => setTab("photo"),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "11px 13px",
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E39\u0E1B\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "Photos \xB7 ", ph.idx.length, " \u0E23\u0E39\u0E1B"))) : null, cur && cur.kind === "fields" && window.pmGroupsOf(cur, sum).map(g => React.createElement("div", {
    key: g.key,
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 9,
      paddingBottom: 4,
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 12,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, g.en, " ", React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "(", g.th, ")"), g.optional ? React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, " \xB7 \u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A") : null), g.repeat && g.setNo === g.setCount && g.setCount > 1 ? React.createElement("button", {
    onClick: () => removeSet(g),
    style: {
      flexShrink: 0,
      padding: "4px 9px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49") : null), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      columnGap: 14
    }
  }, (g.fields || []).map(f => React.createElement(PmField, {
    key: f.key,
    field: f,
    value: sum[f.key],
    prefilled: window.pmIsPrefilled(rec, f.key) && !!f.from,
    onCommit: setField
  }))), g.repeat && g.setNo === g.setCount && g.setCount < g.repeat.max ? React.createElement("button", {
    onClick: () => addSet(g),
    style: {
      marginTop: 2,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ ", g.repeat.addTh) : null)), cur && cur.kind === "checklist" && (cur.groups || []).map(g => React.createElement("div", {
    key: g.key,
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "var(--text-1)",
      marginBottom: 4,
      paddingBottom: 4,
      borderBottom: "1px solid var(--border)"
    }
  }, g.en, " ", React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "(", g.th, ")")), (g.items || []).map(it => React.createElement(PmDocRow, {
    key: it.key,
    item: it,
    job: job,
    value: (rec.docs || {})[it.key],
    onSet: setDoc
  })))), cur && cur.kind === "table" && (cur.tables || []).map(tb => React.createElement(PmTableBlock, {
    key: tb.key,
    table: tb,
    mobile: isMobile,
    hdr: window.pmTableOf(rec, cur.key, tb.key).hdr || {},
    rows: window.pmRowsOf(rec, cur.key, tb.key),
    onHdr: setHdr(tb),
    onSet: setCell(tb),
    onAdd: () => addRow(tb),
    onSeed: () => seedRows(tb),
    onRemove: row => removeRow(tb, row)
  })), cur && cur.kind === "sign" && React.createElement(React.Fragment, null, (cur.blocks || []).map(b => React.createElement(PmSignRow, {
    key: b.key,
    block: b,
    value: (rec.sign || {})[b.key],
    onCommit: setSign
  })), (rec.meta || {}).status !== "signed" ? React.createElement("button", {
    onClick: signOff,
    style: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 11,
      border: "1px solid var(--primary)",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14\u0E40\u0E25\u0E48\u0E21 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E27\u0E48\u0E32\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E41\u0E25\u0E49\u0E27") : React.createElement("button", {
    onClick: () => store.setStatus("draft", currentUser),
    style: {
      width: "100%",
      padding: "11px 16px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E25\u0E48\u0E21\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E41\u0E01\u0E49\u0E44\u0E02")), tab === "photo" && React.createElement(React.Fragment, null, React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    multiple: true,
    style: {
      display: "none"
    },
    onChange: e => {
      addPhotos(e.target.files);
      e.target.value = "";
    }
  }), React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    disabled: busy,
    style: {
      width: "100%",
      marginBottom: 14,
      padding: "11px 16px",
      borderRadius: 11,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: busy ? "wait" : "pointer"
    }
  }, busy ? "กำลังย่อรูป…" : "＋ เพิ่มรูปประกอบการส่งมอบ"), !ph.idx.length ? React.createElement("div", {
    style: {
      padding: 28,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B \xB7 \u0E23\u0E39\u0E1B\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E08\u0E30\u0E44\u0E1B\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E49\u0E32\u0E22\u0E44\u0E1F\u0E25\u0E4C PDF \u0E2B\u0E19\u0E49\u0E32\u0E25\u0E30 6 \u0E23\u0E39\u0E1B") : React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 10
    }
  }, ph.idx.map((x, i) => React.createElement("div", {
    key: x.id,
    style: {
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: 9,
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--text-2)"
    }
  }, "#", i + 1), React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, x.byName || ""), React.createElement("button", {
    onClick: async () => {
      const ok = await window.askConfirm({
        title: "ลบรูปนี้?",
        icon: "trash",
        ok: "ลบรูป"
      });
      if (ok) ph.remove(x.id);
    },
    style: {
      border: "none",
      background: "none",
      cursor: "pointer",
      color: "var(--text-3)",
      padding: 2
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14
  }))), React.createElement("input", {
    defaultValue: x.cap || "",
    placeholder: "\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E23\u0E39\u0E1B (\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E15\u0E49\u0E23\u0E39\u0E1B\u0E43\u0E19\u0E43\u0E1A)",
    onBlur: e => ph.setCap(x.id, e.target.value),
    style: Object.assign({}, pmInputStyle, {
      fontSize: 12.5,
      padding: "7px 9px"
    })
  })))), React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E23\u0E39\u0E1B\u0E16\u0E39\u0E01\u0E22\u0E48\u0E2D\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E01\u0E47\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E25\u0E37\u0E2D\u0E07\u0E40\u0E19\u0E47\u0E15\u0E02\u0E2D\u0E07\u0E0A\u0E48\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 \u0E44\u0E1F\u0E25\u0E4C Excel \u0E1D\u0E31\u0E07\u0E23\u0E39\u0E1B\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u0E41\u0E1C\u0E48\u0E19 Photos \u0E43\u0E19\u0E19\u0E31\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E32\u0E23\u0E1A\u0E31\u0E0D\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E40\u0E25\u0E02\u0E23\u0E39\u0E1B\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E43\u0E19 PDF"))), React.createElement("div", {
    style: {
      flexShrink: 0,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      padding: "11px 16px"
    }
  }, prog.missing.length ? React.createElement("details", {
    style: {
      marginBottom: 10
    }
  }, React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontSize: 12.5,
      fontWeight: 700,
      color: "#B45309"
    }
  }, "\u26A0\uFE0F \u0E22\u0E31\u0E07\u0E02\u0E32\u0E14\u0E2D\u0E35\u0E01 ", prog.missing.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39"), React.createElement("div", {
    style: {
      maxHeight: 170,
      overflowY: "auto",
      marginTop: 8
    }
  }, prog.missing.map((m, i) => React.createElement("button", {
    key: m.key + i,
    onClick: () => setTab(m.section),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "5px 8px",
      marginBottom: 3,
      borderRadius: 7,
      border: "1px solid var(--border)",
      background: "var(--bg)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      color: "var(--text-2)"
    }
  }, React.createElement("b", {
    style: {
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, m.secTh), " \xB7 ", m.th)))) : React.createElement("div", {
    style: {
      marginBottom: 10,
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-green-tx)"
    }
  }, "\u2713 \u0E01\u0E23\u0E2D\u0E01\u0E04\u0E23\u0E1A\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E41\u0E25\u0E49\u0E27"), React.createElement("button", {
    onClick: () => setPaper(true),
    style: {
      width: "100%",
      padding: "11px 16px",
      borderRadius: 11,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer"
    }
  }, "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF / \u0E2D\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C Excel"))))), paper && started && React.createElement(PmPaperHost, {
    job: job,
    rec: rec,
    sum: sum,
    prog: prog,
    onClose: () => setPaper(false)
  }));
}
function PmPaperHost({
  job,
  rec,
  sum,
  prog,
  onClose
}) {
  const photos = window.usePmPhotos(job ? job.id : null, true);
  if (!window.PmHandoverPaper) return null;
  return React.createElement(window.PmHandoverPaper, {
    job: job,
    rec: rec,
    sum: sum,
    prog: prog,
    photos: photos,
    onClose: onClose
  });
}
Object.assign(window, {
  PmField,
  PmDocRow,
  PmSignRow,
  PmHandoverModal,
  PmPaperHost
});