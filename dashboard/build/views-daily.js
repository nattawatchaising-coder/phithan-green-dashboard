function DrLabel({
  children,
  hint
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 7,
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "var(--text-2)",
      letterSpacing: ".02em"
    }
  }, children), hint && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, hint));
}
const DR_INPUT = {
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
function DrText({
  value,
  onChange,
  rows,
  placeholder,
  disabled
}) {
  return React.createElement("textarea", {
    value: value || "",
    disabled: disabled,
    placeholder: placeholder,
    rows: rows || 3,
    onChange: e => onChange(e.target.value),
    style: Object.assign({}, DR_INPUT, {
      resize: "vertical",
      lineHeight: 1.6,
      opacity: disabled ? 0.65 : 1
    })
  });
}
function DrSection({
  n,
  title,
  hint,
  children,
  tone
}) {
  return React.createElement("div", {
    style: {
      marginBottom: 16,
      border: "1px solid var(--border)",
      borderRadius: 14,
      background: "var(--surface2)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 14px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 7,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: (tone || "var(--primary)") + "1e",
      color: tone || "var(--primary-dark)",
      fontSize: 11.5,
      fontWeight: 800,
      fontFamily: "var(--mono)"
    }
  }, n), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), hint && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginLeft: "auto",
      textAlign: "right"
    }
  }, hint)), React.createElement("div", {
    style: {
      padding: 14
    }
  }, children));
}
function DrChips({
  options,
  value,
  onChange,
  disabled
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, options.map(o => {
    const on = value === o.key;
    const c = o.color || "var(--primary)";
    return React.createElement("button", {
      key: o.key,
      type: "button",
      disabled: disabled,
      onClick: () => onChange(on ? "" : o.key),
      style: {
        padding: "7px 13px",
        borderRadius: 99,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        opacity: disabled && !on ? 0.5 : 1,
        border: "1px solid " + (on ? c : "var(--border-strong)"),
        background: on ? c + "1e" : "var(--surface)",
        color: on ? c : "var(--text-2)"
      }
    }, o.th, o.range && React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11,
        opacity: 0.75
      }
    }, " ", o.range));
  }));
}
function drBlankRow(cols) {
  const r = {};
  r[(cols[0] || {}).k || "name"] = "";
  return r;
}
function DrRows({
  cols,
  rows,
  onChange,
  disabled,
  addLabel
}) {
  const list = rows || [];
  const setCell = (i, k, v) => {
    const copy = list.map((r, x) => x === i ? Object.assign({}, r, {
      [k]: v
    }) : r);
    onChange(copy);
  };
  return React.createElement("div", null, React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      minWidth: 420,
      borderCollapse: "collapse",
      fontSize: 12.5
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: {
      width: 30,
      textAlign: "left",
      padding: "4px 6px",
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "#"), cols.map(c => React.createElement("th", {
    key: c.k,
    style: {
      width: c.w,
      textAlign: "left",
      padding: "4px 6px",
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, c.th)), !disabled && React.createElement("th", {
    style: {
      width: 30
    }
  }))), React.createElement("tbody", null, list.map((r, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    style: {
      padding: "3px 6px",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, i + 1), cols.map(c => React.createElement("td", {
    key: c.k,
    style: {
      padding: "3px 3px"
    }
  }, React.createElement("input", {
    value: r[c.k] || "",
    disabled: disabled,
    inputMode: c.type === "num" ? "decimal" : undefined,
    onChange: e => setCell(i, c.k, e.target.value),
    style: Object.assign({}, DR_INPUT, {
      padding: "7px 9px",
      fontSize: 12.5,
      fontFamily: c.type === "num" ? "var(--mono)" : "inherit",
      opacity: disabled ? 0.65 : 1
    })
  }))), !disabled && React.createElement("td", {
    style: {
      padding: "3px 3px",
      textAlign: "center"
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => onChange(list.filter((_, x) => x !== i)),
    title: "\u0E25\u0E1A\u0E41\u0E16\u0E27\u0E19\u0E35\u0E49",
    style: {
      width: 26,
      height: 26,
      borderRadius: 7,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13
  }))))), !list.length && React.createElement("tr", null, React.createElement("td", {
    colSpan: cols.length + 2,
    style: {
      padding: "14px 6px",
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))))), !disabled && React.createElement("button", {
    type: "button",
    onClick: () => onChange(list.concat([drBlankRow(cols)])),
    style: {
      marginTop: 9,
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
  }), " ", addLabel || "เพิ่มแถว"));
}
function DrStepTable({
  steps,
  onChange,
  disabled,
  editable,
  onReset,
  plan,
  dates,
  weight,
  rename
}) {
  const list = steps || [];
  const set = (i, k, v) => onChange(list.map((r, x) => x === i ? Object.assign({}, r, {
    [k]: v
  }) : r));
  const cell = {
    padding: "5px 6px",
    borderBottom: "1px solid var(--border)",
    fontSize: 12
  };
  const dateBox = (i, k, r) => editable && !disabled ? React.createElement("input", {
    type: "date",
    value: r[k] || "",
    onChange: e => set(i, k, e.target.value),
    style: Object.assign({}, DR_INPUT, {
      padding: "6px 7px",
      fontSize: 11.5,
      fontFamily: "var(--mono)",
      minWidth: 118
    })
  }) : React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      color: "var(--text-2)"
    }
  }, r[k] ? window.drShort(r[k]) : "—");
  return React.createElement("div", null, React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      minWidth: plan ? 640 : 400,
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, ["ขั้น", "รายละเอียดงาน"].concat(plan ? ["แผน เริ่ม", "แผน จบ"] : []).concat(dates ? ["จริง เริ่ม", "จริง จบ"] : []).concat(weight ? ["น้ำหนักงาน %"] : []).concat(["ทำไปแล้ว %"]).map((h, i, a) => React.createElement("th", {
    key: i,
    style: {
      textAlign: i === a.length - 1 ? "right" : "left",
      padding: "5px 6px",
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 700,
      borderBottom: "1px solid var(--border-strong)",
      whiteSpace: "nowrap"
    }
  }, h)), editable && !disabled && React.createElement("th", {
    style: {
      width: 30,
      borderBottom: "1px solid var(--border-strong)"
    }
  }))), React.createElement("tbody", null, list.map((r, i) => React.createElement("tr", {
    key: i,
    style: {
      background: r.head ? "var(--surface)" : "transparent"
    }
  }, React.createElement("td", {
    style: Object.assign({}, cell, {
      fontFamily: "var(--mono)",
      fontWeight: r.head ? 800 : 500,
      color: r.head ? "var(--primary-dark)" : "var(--text-3)",
      whiteSpace: "nowrap"
    })
  }, r.no), React.createElement("td", {
    style: Object.assign({}, cell, {
      minWidth: 190
    })
  }, rename && editable && !disabled ? React.createElement("input", {
    value: r.th || "",
    onChange: e => set(i, "th", e.target.value),
    style: Object.assign({}, DR_INPUT, {
      padding: "6px 8px",
      fontSize: 12.5,
      fontWeight: r.head ? 700 : 400
    })
  }) : React.createElement("span", {
    style: {
      fontWeight: r.head ? 700 : 400,
      color: "var(--text-1)"
    }
  }, r.th)), plan && React.createElement("td", {
    style: cell
  }, dateBox(i, "planStart", r)), plan && React.createElement("td", {
    style: cell
  }, dateBox(i, "planEnd", r)), dates && React.createElement("td", {
    style: cell
  }, dateBox(i, "actStart", r)), dates && React.createElement("td", {
    style: cell
  }, dateBox(i, "actEnd", r)), weight && React.createElement("td", {
    style: Object.assign({}, cell, {
      textAlign: "right"
    })
  }, React.createElement("input", {
    value: r.w === 0 || r.w ? String(r.w) : "",
    disabled: disabled || !editable,
    inputMode: "numeric",
    onChange: e => set(i, "w", e.target.value.replace(/[^0-9]/g, "").slice(0, 3)),
    style: Object.assign({}, DR_INPUT, {
      padding: "6px 7px",
      fontSize: 12,
      fontFamily: "var(--mono)",
      textAlign: "right",
      width: 56,
      opacity: disabled ? 0.65 : 1
    })
  })), React.createElement("td", {
    style: Object.assign({}, cell, {
      textAlign: "right"
    })
  }, React.createElement("input", {
    value: r.pct === 0 || r.pct ? String(r.pct) : "",
    disabled: disabled,
    inputMode: "numeric",
    onChange: e => set(i, "pct", e.target.value.replace(/[^0-9]/g, "").slice(0, 3)),
    style: Object.assign({}, DR_INPUT, {
      padding: "6px 7px",
      fontSize: 12,
      fontFamily: "var(--mono)",
      textAlign: "right",
      width: 56,
      opacity: disabled ? 0.65 : 1
    })
  })), editable && !disabled && React.createElement("td", {
    style: Object.assign({}, cell, {
      textAlign: "center"
    })
  }, React.createElement("button", {
    type: "button",
    onClick: () => onChange(list.filter((_, x) => x !== i)),
    title: "\u0E25\u0E1A\u0E02\u0E31\u0E49\u0E19\u0E19\u0E35\u0E49",
    style: {
      width: 24,
      height: 24,
      borderRadius: 6,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 12
  })))))))), weight && (() => {
    const sum = window.drWeightSum(list);
    const ok = sum === 100;
    return React.createElement("div", {
      style: {
        marginTop: 7,
        fontSize: 11.5,
        fontWeight: 700,
        color: ok ? "var(--text-3)" : "#B45309"
      }
    }, "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E23\u0E27\u0E21 ", sum, "%", ok ? "" : " · ยังไม่ครบ 100% — ระบบจะเทียบสัดส่วนให้จากยอดนี้");
  })(), editable && !disabled && React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 9,
      flexWrap: "wrap"
    }
  }, rename && React.createElement("button", {
    type: "button",
    onClick: () => onChange(list.concat([{
      no: String(list.length + 1),
      th: "",
      head: true,
      pct: 0,
      w: 0
    }])),
    style: {
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
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E43\u0E2B\u0E0D\u0E48"), React.createElement("button", {
    type: "button",
    onClick: () => onChange((onReset || window.drWhaSteps)()),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: "undo",
    size: 14
  }), " \u0E04\u0E37\u0E19\u0E0A\u0E38\u0E14\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19")));
}
function DrPhotoCap({
  value,
  disabled,
  onSave
}) {
  const [v, setV] = React.useState(value || "");
  const timer = React.useRef(null);
  const typing = React.useRef(false);
  React.useEffect(() => {
    if (!typing.current) setV(value || "");
  }, [value]);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const edit = nv => {
    setV(nv);
    typing.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      typing.current = false;
      onSave(nv);
    }, 500);
  };
  const flush = () => {
    clearTimeout(timer.current);
    typing.current = false;
    onSave(v);
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      borderTop: "1px solid var(--border)",
      padding: "6px 8px",
      background: "var(--surface2)"
    }
  }, React.createElement(Icon, {
    name: "pen",
    size: 12,
    color: v ? "var(--primary-dark)" : "var(--text-3)"
  }), React.createElement("input", {
    value: v,
    disabled: disabled,
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49\u2026",
    onChange: e => edit(e.target.value),
    onBlur: flush,
    style: {
      width: "100%",
      border: "none",
      padding: "3px 0",
      background: "transparent",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12,
      boxSizing: "border-box",
      outline: "none"
    }
  }));
}
function DrPhotos({
  jobId,
  date,
  currentUser,
  disabled
}) {
  const {
    photos,
    add,
    setCap,
    remove
  } = window.useDailyPhotos(jobId, date);
  const [busy, setBusy] = React.useState(0);
  const onPick = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(files.length);
    for (const f of files) {
      try {
        add(await window.resizeImageFile(f, 1200, 0.72), currentUser);
      } catch (err) {}
      setBusy(n => n - 1);
    }
  };
  return React.createElement("div", null, !disabled && React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "9px 14px",
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: photos.length ? 12 : 0
    }
  }, React.createElement(Icon, {
    name: "camera",
    size: 15
  }), " ", busy ? "กำลังใส่รูป " + busy + " ใบ..." : "เพิ่มรูป (เลือกได้หลายใบ)", React.createElement("input", {
    type: "file",
    accept: "image/*",
    multiple: true,
    onChange: onPick,
    style: {
      display: "none"
    }
  })), !photos.length && disabled && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E43\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: 11
    }
  }, photos.map(p => React.createElement("div", {
    key: p.id,
    style: {
      border: "1px solid var(--border)",
      borderRadius: 11,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      background: "#0d1512"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "รูปหน้างาน",
    style: {
      width: "100%",
      height: 112,
      objectFit: "cover",
      display: "block"
    }
  }), !disabled && React.createElement("button", {
    type: "button",
    onClick: () => remove(p.id),
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49",
    style: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 8,
      border: "none",
      background: "rgba(8,20,14,.62)",
      color: "#fff",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13,
    color: "#fff"
  }))), React.createElement(DrPhotoCap, {
    value: p.cap,
    disabled: disabled,
    onSave: v => setCap(p.id, v)
  })))));
}
function DrSignSlot({
  title,
  sub,
  sig,
  canSign,
  onSign,
  onClear,
  saved,
  onUseSaved
}) {
  return React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 12,
      background: "var(--surface)",
      padding: "12px 13px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "var(--text-2)"
    }
  }, title), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, sub), React.createElement("div", {
    style: {
      height: 76,
      marginTop: 9,
      borderRadius: 9,
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden"
    }
  }, sig && sig.img ? React.createElement("img", {
    src: sig.img,
    alt: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19",
    style: {
      maxWidth: "94%",
      maxHeight: 66,
      objectFit: "contain"
    }
  }) : React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E0B\u0E47\u0E19")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 9,
      flexWrap: "wrap"
    }
  }, sig && sig.img && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      flex: 1,
      minWidth: 90
    }
  }, sig.name || "-", " \xB7 ", window.drDateTH(window.drSignDay(sig))), canSign && !(sig && sig.img) && saved && saved.img && React.createElement("button", {
    onClick: onUseSaved,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 13,
    color: "#fff",
    sw: 2.6
  }), " \u0E43\u0E0A\u0E49\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49"), canSign && React.createElement("button", {
    onClick: onSign,
    style: {
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, sig && sig.img ? "เซ็นใหม่" : "เซ็นสด"), canSign && sig && sig.img && React.createElement("button", {
    onClick: onClear,
    style: {
      padding: "7px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A")));
}
const DR_MODES = [{
  key: "home",
  th: "ปกติ",
  hint: "งานที่ทำ · ทีม/อากาศ · รูป · ปัญหา · ลายเซ็น"
}, {
  key: "project",
  th: "จัดเต็ม",
  hint: "เพิ่ม วัสดุ · เครื่องจักร · กำลังคน · ความปลอดภัย และตารางขั้นงานแบบมีวันแผน/วันจริง"
}];
function DrModeSwitch({
  value,
  onChange,
  disabled
}) {
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21"), React.createElement("span", {
    style: {
      display: "inline-flex",
      padding: 2,
      gap: 2,
      borderRadius: 99,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, DR_MODES.map(m => {
    const on = value === m.key;
    return React.createElement("button", {
      key: m.key,
      type: "button",
      disabled: disabled,
      title: m.hint,
      onClick: () => onChange(m.key),
      style: {
        padding: "3px 11px",
        borderRadius: 99,
        border: "none",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        background: on ? "var(--primary)" : "transparent",
        color: on ? "#fff" : "var(--text-3)",
        opacity: disabled && !on ? 0.45 : 1
      }
    }, m.th);
  })));
}
function DailyReportModal({
  job,
  role,
  currentUser,
  onClose,
  onNotify,
  openDate
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = window.useDailyReports(job ? job.id : null);
  const [date, setDate] = React.useState(() => openDate || window.drToday());
  const [form, setForm] = React.useState(null);
  const [paper, setPaper] = React.useState(false);
  const sigs = window.useDailySigns(job ? job.id : null, date);
  const mine = window.useDrMySign((currentUser || {}).id);
  const [pad, setPad] = React.useState(null);
  const [remember, setRemember] = React.useState(true);
  const [delAsk, setDelAsk] = React.useState(false);
  const timer = React.useRef(null);
  const saved = store.byDate[date] || null;
  React.useEffect(() => {
    if (!job) return;
    const blank = window.drBlank(job, date, currentUser, window.drPrevOf(store.byDate, date));
    const rec = saved ? Object.assign(blank, saved) : blank;
    if (rec.mode !== "project" && window.drIsBoardSteps(rec.steps)) rec.steps = window.drHomeSteps();
    if (rec.mode !== "project") rec.pct = window.drRollup(rec.steps);
    setForm(rec);
  }, [job ? job.id : null, date, saved ? saved.updatedAt : null]);
  React.useEffect(() => setDelAsk(false), [date]);
  const locked = !window.drCanEdit(role, form);
  const canApprove = window.drCanApprove(role, job, currentUser, form);
  const noEe = window.drNoEe(job);
  const whyNoApprove = React.useMemo(() => {
    if (canApprove || !form || form.status !== "sent") return "";
    if (noEe) return "งานนี้ยังไม่ระบุวิศวกรผู้รับผิดชอบ — ไปใส่ชื่อในใบงานก่อน จึงจะมีคนอนุมัติได้";
    const uid = (currentUser || {}).id || "";
    if (uid && job.eeId === uid && form.byId === uid) return "ใบนี้คุณเป็นคนส่งเอง — ถ้าคุณลงหน้างานงานนี้เองด้วย ให้เปิด “ลงหน้างานเองด้วย” ในใบงาน จึงจะเซ็นอนุมัติใบตัวเองได้";
    return "รอ" + (job.eeName ? "วิศวกร " + job.eeName : "วิศวกรผู้รับผิดชอบ") + "ตรวจและเซ็นอนุมัติ";
  }, [canApprove, form && form.status, form && form.byId, noEe, job && job.eeId, job && job.eeName, currentUser && currentUser.id]);
  const canDelete = window.drCanDelete(role);
  const prev = window.drPrevOf(store.byDate, date);
  const isProject = form && form.mode === "project";
  const edit = fields => {
    if (locked) return;
    setForm(f => {
      const next = Object.assign({}, f, fields);
      if (next.mode !== "project") next.pct = window.drRollup(next.steps);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => store.save(date, next), 600);
      return next;
    });
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const setMode = m => {
    if (locked || !form || form.mode === m) return;
    const next = {
      mode: m
    };
    if (m === "project") {
      if (form.pctManual != null) next.pct = form.pctManual;
    } else next.pctManual = form.pct;
    if (window.drStepsFresh(form.steps)) next.steps = m === "project" ? window.drWhaSteps() : window.drHomeSteps(job);
    edit(next);
  };
  const flush = () => {
    clearTimeout(timer.current);
    if (form && !locked) store.save(date, form);
  };
  const doSend = () => {
    flush();
    store.save(date, Object.assign({}, form, {
      status: "sent",
      sentAt: new Date().toISOString(),
      byId: (currentUser || {}).id || null,
      byName: (currentUser || {}).name || ""
    }));
    const eeId = (job || {}).eeId || "";
    if (onNotify && eeId && eeId !== ((currentUser || {}).id || "")) {
      onNotify({
        toUserId: eeId,
        type: "daily",
        event: "sent",
        jobId: job.id,
        jobName: job.name,
        title: "รายงานประจำวันรออนุมัติ",
        body: [job.code, window.drDateTH(date), "โดย " + ((currentUser || {}).name || "ช่าง")].filter(Boolean).join(" · ")
      });
    }
  };
  const doApprove = () => {
    store.save(date, Object.assign({}, form, {
      status: "approved",
      approvedAt: new Date().toISOString(),
      appId: (currentUser || {}).id || null,
      appName: (currentUser || {}).name || ""
    }));
  };
  const needSign = (slot, title, hint, then) => {
    if (sigs.signs[slot] && sigs.signs[slot].img) return then();
    if (mine.sign && mine.sign.img) {
      sigs.sign(slot, mine.sign.img, currentUser);
      return then();
    }
    setPad({
      slot: slot,
      title: title,
      hint: hint,
      then: then
    });
  };
  const send = () => needSign("by", "ลายเซ็นผู้บันทึก", "เซ็นแล้วระบบจะส่งใบนี้ให้" + ((job || {}).eeName ? "วิศวกร " + job.eeName : "วิศวกรผู้รับผิดชอบ") + "อนุมัติทันที", doSend);
  const approve = () => needSign("app", "ลายเซ็นผู้อนุมัติ", "เซ็นแล้วระบบจะอนุมัติและล็อกใบนี้ทันที", doApprove);
  const doDelete = () => {
    clearTimeout(timer.current);
    store.remove(date);
    setDelAsk(false);
  };
  const reopen = () => {
    sigs.clear("app");
    store.patch(date, {
      status: "draft",
      approvedAt: null,
      appId: null,
      appName: null
    });
  };
  if (!job || !form) return null;
  const st = window.drStatusOf(form.status);
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 150,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    style: {
      maxWidth: 880,
      margin: "0 auto",
      background: "var(--bg)",
      borderRadius: isMobile ? 0 : 16,
      minHeight: isMobile ? "100dvh" : 0,
      overflow: "hidden",
      boxShadow: "0 24px 70px rgba(8,20,14,.32)"
    }
  }, React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 3,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: isMobile ? "13px 14px" : "16px 20px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 11
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: isMobile ? 15.5 : 17.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: st.color,
      background: st.color + "1c",
      border: "1px solid " + st.color + "40",
      borderRadius: 99,
      padding: "2px 10px"
    }
  }, st.th), locked ? React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 99,
      padding: "2px 9px",
      color: isProject ? "#7C5CFC" : "#F59E0B",
      background: (isProject ? "#7C5CFC" : "#F59E0B") + "1c"
    }
  }, isProject ? "แบบจัดเต็ม" : "แบบปกติ") : React.createElement(DrModeSwitch, {
    value: form.mode,
    onChange: setMode,
    disabled: locked
  })), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 4,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job.code, " \xB7 ", job.name)), React.createElement("button", {
    onClick: () => {
      flush();
      onClose();
    },
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
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
    size: 16
  }))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 11,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, -1)),
    title: "\u0E27\u0E31\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
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
  })), React.createElement("input", {
    type: "date",
    value: date,
    max: window.drToday(),
    onChange: e => setDate(e.target.value || window.drToday()),
    style: Object.assign({}, DR_INPUT, {
      width: "auto",
      padding: "7px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  }), React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, 1)),
    disabled: date >= window.drToday(),
    title: "\u0E27\u0E31\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: date >= window.drToday() ? "default" : "pointer",
      opacity: date >= window.drToday() ? 0.4 : 1,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, window.drDateTH(date, true)), !!store.dates.length && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginLeft: "auto"
    }
  }, "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27 ", store.dates.length, " \u0E27\u0E31\u0E19")), store.dates.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 9,
      overflowX: "auto",
      paddingBottom: 2
    }
  }, store.dates.slice(0, 14).map(d => {
    const s = window.drStatusOf((store.byDate[d] || {}).status);
    const on = d === date;
    return React.createElement("button", {
      key: d,
      onClick: () => setDate(d),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 99,
        flexShrink: 0,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 99,
        background: s.color
      }
    }), window.drShort(d));
  }))), React.createElement("div", {
    style: {
      padding: isMobile ? "14px 13px 90px" : "18px 20px 100px"
    }
  }, locked && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "11px 13px",
      marginBottom: 14,
      border: "1px solid #10B98140",
      background: "#10B98114",
      borderRadius: 12
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 15,
    color: "#10B981"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27\u0E42\u0E14\u0E22 ", React.createElement("b", null, form.appName || "-"), " \xB7 \u0E41\u0E01\u0E49\u0E44\u0E02\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", canApprove ? " — หัวหน้ากดปลดล็อกได้ที่ปุ่มด้านล่าง" : "")), React.createElement(DrSection, {
    n: "1",
    title: "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
    hint: "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E2A\u0E31\u0E49\u0E19 \u0E46 \u0E27\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E07\u0E32\u0E19\u0E2D\u0E30\u0E44\u0E23\u0E44\u0E1B\u0E1A\u0E49\u0E32\u0E07"
  }, React.createElement(DrText, {
    value: form.work,
    disabled: locked,
    rows: 3,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E07\u0E2A\u0E32\u0E22\u0E44\u0E1F\u0E1D\u0E31\u0E48\u0E07\u0E17\u0E34\u0E28\u0E43\u0E15\u0E49\u0E04\u0E23\u0E1A 40 \u0E40\u0E21\u0E15\u0E23 \xB7 \u0E22\u0E01\u0E41\u0E1C\u0E07\u0E02\u0E36\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 16 \u0E41\u0E1C\u0E07",
    onChange: v => edit({
      work: v
    })
  }), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, React.createElement(DrLabel, null, "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E37\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E27\u0E21\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19"), isProject ? React.createElement("input", {
    value: String(form.pct == null ? "" : form.pct),
    disabled: locked,
    inputMode: "numeric",
    onChange: e => edit({
      pct: e.target.value.replace(/[^0-9]/g, "").slice(0, 3)
    }),
    style: Object.assign({}, DR_INPUT, {
      width: 78,
      padding: "8px 10px",
      fontFamily: "var(--mono)",
      textAlign: "right",
      marginBottom: 6
    })
  }) : React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 26,
      fontWeight: 800,
      color: "var(--primary-dark)",
      lineHeight: 1,
      marginBottom: 6
    }
  }, +form.pct || 0), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 6
    }
  }, "%"), !isProject && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E04\u0E34\u0E14\u0E08\u0E32\u0E01\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E02\u0E49\u0E32\u0E07\u0E25\u0E48\u0E32\u0E07"), prev && prev.pct != null && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E19 ", prev.pct, "% \u2192 ", React.createElement("b", {
    style: {
      color: (+form.pct || 0) >= (+prev.pct || 0) ? "#10B981" : "#EF4444"
    }
  }, (+form.pct || 0) - (+prev.pct || 0) >= 0 ? "+" : "", (+form.pct || 0) - (+prev.pct || 0), "%"))), React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, React.createElement(DrLabel, {
    hint: isProject ? "เพิ่ม/แก้/ลบหัวข้อได้ตามแผนงานของโครงการนี้" : "น้ำหนักงาน = หัวข้อนี้คิดเป็นกี่ % ของงานทั้งหลัง · หัวข้อไหนไม่มีในบ้านหลังนี้กดถังขยะทิ้งได้"
  }, isProject ? "ตารางขั้นงาน" : "เนื้องานติดตั้ง"), React.createElement(DrStepTable, {
    steps: form.steps,
    disabled: locked,
    editable: true,
    plan: isProject,
    dates: isProject,
    weight: !isProject,
    rename: isProject,
    onReset: isProject ? window.drWhaSteps : window.drHomeSteps,
    onChange: v => edit({
      steps: v
    })
  }))), React.createElement(DrSection, {
    n: "2",
    title: "\u0E17\u0E35\u0E21\u0E0A\u0E48\u0E32\u0E07 & \u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28",
    tone: "#3B82F6"
  }, React.createElement(DrLabel, {
    hint: "\u0E43\u0E04\u0E23\u0E44\u0E1B\u0E1A\u0E49\u0E32\u0E07 \u0E01\u0E35\u0E48\u0E04\u0E19"
  }, "\u0E17\u0E35\u0E21\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement(DrText, {
    value: form.team,
    disabled: locked,
    rows: 2,
    placeholder: "เช่น ทีม A — " + (job.tech && job.tech.name || "หัวหน้าทีม") + " + ช่าง 3 คน",
    onChange: v => edit({
      team: v
    })
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 14,
      marginTop: 13
    }
  }, React.createElement("div", null, React.createElement(DrLabel, {
    hint: "08:30 \u2013 12:00"
  }, "\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E0A\u0E49\u0E32"), React.createElement(DrChips, {
    options: window.DR_WEATHER,
    value: form.weatherAm,
    disabled: locked,
    onChange: v => edit({
      weatherAm: v
    })
  })), React.createElement("div", null, React.createElement(DrLabel, {
    hint: "13:00 \u2013 17:00"
  }, "\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E0A\u0E48\u0E27\u0E07\u0E1A\u0E48\u0E32\u0E22"), React.createElement(DrChips, {
    options: window.DR_WEATHER,
    value: form.weatherPm,
    disabled: locked,
    onChange: v => edit({
      weatherPm: v
    })
  })))), React.createElement(DrSection, {
    n: "3",
    title: "\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    tone: "#F59E0B",
    hint: "\u0E43\u0E2A\u0E48\u0E44\u0E14\u0E49\u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14 \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E43\u0E15\u0E49\u0E23\u0E39\u0E1B\u0E44\u0E14\u0E49\u0E17\u0E38\u0E01\u0E43\u0E1A"
  }, React.createElement(DrPhotos, {
    jobId: job.id,
    date: date,
    currentUser: currentUser,
    disabled: locked
  })), React.createElement(DrSection, {
    n: "4",
    title: "\u0E1B\u0E31\u0E0D\u0E2B\u0E32 & \u0E07\u0E32\u0E19\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49",
    tone: "#EF4444"
  }, React.createElement(DrLabel, {
    hint: "\u0E15\u0E34\u0E14\u0E2D\u0E30\u0E44\u0E23 \u0E23\u0E2D\u0E43\u0E04\u0E23"
  }, "\u0E1B\u0E31\u0E0D\u0E2B\u0E32 / \u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement(DrText, {
    value: form.problem,
    disabled: locked,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E1D\u0E19\u0E15\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E1A\u0E48\u0E32\u0E22 \u0E2B\u0E22\u0E38\u0E14\u0E07\u0E32\u0E19\u0E1A\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \xB7 \u0E23\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E08\u0E38\u0E14\u0E27\u0E32\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    onChange: v => edit({
      problem: v
    })
  }), React.createElement("div", {
    style: {
      marginTop: 13
    }
  }, React.createElement(DrLabel, null, "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E15\u0E48\u0E2D"), React.createElement(DrText, {
    value: form.nextDay,
    disabled: locked,
    rows: 2,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22 DC \u0E15\u0E48\u0E2D\u0E08\u0E32\u0E01\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E04\u0E49\u0E32\u0E07 \xB7 \u0E19\u0E31\u0E14\u0E0A\u0E48\u0E32\u0E07\u0E44\u0E1F\u0E40\u0E02\u0E49\u0E32\u0E15\u0E48\u0E2D MDB",
    onChange: v => edit({
      nextDay: v
    })
  }))), isProject && React.createElement(React.Fragment, null, React.createElement(DrSection, {
    n: "5",
    title: "\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    tone: "#0EA5E9"
  }, React.createElement(DrRows, {
    disabled: locked,
    addLabel: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E27\u0E31\u0E2A\u0E14\u0E38",
    rows: form.materials,
    onChange: v => edit({
      materials: v
    }),
    cols: [{
      k: "name",
      th: "รายการวัสดุ"
    }, {
      k: "qty",
      th: "จำนวน",
      w: 80,
      type: "num"
    }, {
      k: "unit",
      th: "หน่วย",
      w: 80
    }, {
      k: "loc",
      th: "จุดจัดเก็บ",
      w: 130
    }, {
      k: "note",
      th: "หมายเหตุ",
      w: 130
    }]
  })), React.createElement(DrSection, {
    n: "6",
    title: "\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E31\u0E01\u0E23 / \u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D",
    tone: "#0EA5E9"
  }, React.createElement(DrRows, {
    disabled: locked,
    addLabel: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E31\u0E01\u0E23",
    rows: form.machines,
    onChange: v => edit({
      machines: v
    }),
    cols: [{
      k: "name",
      th: "รายการ"
    }, {
      k: "qty",
      th: "จำนวน",
      w: 80,
      type: "num"
    }, {
      k: "unit",
      th: "หน่วย",
      w: 80
    }, {
      k: "job",
      th: "ใช้กับงาน",
      w: 150
    }, {
      k: "note",
      th: "หมายเหตุ",
      w: 120
    }]
  })), React.createElement(DrSection, {
    n: "7",
    title: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E04\u0E19",
    tone: "#7C5CFC",
    hint: "รวม " + (form.manpower || []).reduce((s, r) => s + (+r.qty || 0), 0) + " คน"
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7,
      marginBottom: 11
    }
  }, window.DR_MANPOWER.map(m => React.createElement("button", {
    key: m.key,
    type: "button",
    disabled: locked,
    onClick: () => edit({
      manpower: (form.manpower || []).concat([{
        role: m.th,
        qty: "1"
      }])
    }),
    style: {
      padding: "6px 11px",
      borderRadius: 99,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      cursor: locked ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      opacity: locked ? 0.5 : 1
    }
  }, "+ ", m.th))), React.createElement(DrRows, {
    disabled: locked,
    addLabel: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27\u0E40\u0E1B\u0E25\u0E48\u0E32",
    rows: form.manpower,
    onChange: v => edit({
      manpower: v
    }),
    cols: [{
      k: "role",
      th: "ตำแหน่ง"
    }, {
      k: "qty",
      th: "จำนวน",
      w: 80,
      type: "num"
    }, {
      k: "name",
      th: "ชื่อผู้ปฏิบัติงาน",
      w: 180
    }, {
      k: "note",
      th: "หมายเหตุ",
      w: 120
    }]
  })), React.createElement(DrSection, {
    n: "8",
    title: "\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22 & \u0E2A\u0E34\u0E48\u0E07\u0E41\u0E27\u0E14\u0E25\u0E49\u0E2D\u0E21",
    tone: "#10B981"
  }, React.createElement(DrLabel, {
    hint: "JSA \u2014 \u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"
  }, "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07"), React.createElement(DrChips, {
    options: window.DR_JSA,
    value: form.jsa,
    disabled: locked,
    onChange: v => edit({
      jsa: v
    })
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 14,
      marginTop: 14
    }
  }, React.createElement("div", null, React.createElement(DrLabel, null, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E17\u0E33\u0E07\u0E32\u0E19\u0E40\u0E22\u0E47\u0E19"), React.createElement(DrChips, {
    disabled: locked,
    value: form.permitCold,
    onChange: v => edit({
      permitCold: v
    }),
    options: [{
      key: "yes",
      th: "มี",
      color: "#10B981"
    }, {
      key: "no",
      th: "ไม่มี",
      color: "#94A3B8"
    }]
  })), React.createElement("div", null, React.createElement(DrLabel, null, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E17\u0E33\u0E07\u0E32\u0E19\u0E23\u0E49\u0E2D\u0E19"), React.createElement(DrChips, {
    disabled: locked,
    value: form.permitHot,
    onChange: v => edit({
      permitHot: v
    }),
    options: [{
      key: "yes",
      th: "มี",
      color: "#10B981"
    }, {
      key: "no",
      th: "ไม่มี",
      color: "#94A3B8"
    }]
  }))), React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement(DrLabel, {
    hint: "\u0E15\u0E34\u0E4A\u0E01\u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E17\u0E33\u0E41\u0E25\u0E49\u0E27"
  }, "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E30\u0E2D\u0E32\u0E14 / \u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, window.DR_CLEAN.map(c => {
    const on = !!(form.clean || {})[c.key];
    return React.createElement("button", {
      key: c.key,
      type: "button",
      disabled: locked,
      onClick: () => edit({
        clean: Object.assign({}, form.clean, {
          [c.key]: !on
        })
      }),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        borderRadius: 99,
        border: "1px solid " + (on ? "#10B981" : "var(--border-strong)"),
        background: on ? "#10B9811c" : "var(--surface)",
        cursor: locked ? "default" : "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        color: on ? "#10B981" : "var(--text-2)"
      }
    }, on && React.createElement(Icon, {
      name: "check",
      size: 13,
      color: "#10B981"
    }), c.th);
  }))), React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement(DrLabel, {
    hint: "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07/\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07"
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07"), React.createElement(DrRows, {
    disabled: locked,
    addLabel: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23",
    rows: form.certs,
    onChange: v => edit({
      certs: v
    }),
    cols: [{
      k: "name",
      th: "รายละเอียดเอกสาร"
    }, {
      k: "by",
      th: "ผู้รับผิดชอบ",
      w: 150
    }]
  })))), React.createElement(DrSection, {
    n: isProject ? "9" : "5",
    title: "\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19",
    tone: "#7C5CFC",
    hint: "\u0E40\u0E0B\u0E47\u0E19\u0E14\u0E49\u0E27\u0E22\u0E19\u0E34\u0E49\u0E27\u0E1A\u0E19\u0E21\u0E37\u0E2D\u0E16\u0E37\u0E2D \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E21\u0E32\u0E2A\u0E4C\u0E1A\u0E19\u0E04\u0E2D\u0E21"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement(DrSignSlot, {
    title: "\u0E1C\u0E39\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 (\u0E0A\u0E48\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19)",
    sub: form.byName || (currentUser || {}).name || "-",
    sig: sigs.signs.by,
    canSign: !locked,
    saved: mine.sign,
    onUseSaved: () => sigs.sign("by", mine.sign.img, currentUser),
    onSign: () => setPad({
      slot: "by",
      title: "ลายเซ็นผู้บันทึก"
    }),
    onClear: () => sigs.clear("by")
  }), React.createElement(DrSignSlot, {
    title: "\u0E1C\u0E39\u0E49\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 (\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19)",
    sub: form.appName || (canApprove ? (currentUser || {}).name || "-" : "รอหัวหน้าเซ็น"),
    sig: sigs.signs.app,
    canSign: canApprove && form.status !== "approved",
    saved: mine.sign,
    onUseSaved: () => sigs.sign("app", mine.sign.img, currentUser),
    onSign: () => setPad({
      slot: "app",
      title: "ลายเซ็นผู้อนุมัติ"
    }),
    onClear: () => sigs.clear("app")
  })))), React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 0,
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      padding: isMobile ? "11px 13px" : "13px 20px",
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: delAsk ? "#EF4444" : "var(--text-3)",
      fontWeight: delAsk ? 700 : 400,
      flex: 1,
      minWidth: 100
    }
  }, delAsk ? "ลบใบของวันนี้ทั้งใบ (รูปและลายเซ็นด้วย) เรียกคืนไม่ได้" : locked ? "เอกสารถูกล็อกแล้ว" : "บันทึกอัตโนมัติ ไม่ต้องกดเซฟ"), canDelete && saved && (delAsk ? React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setDelAsk(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 15px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: doDelete,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 15,
    color: "#fff"
  }), " \u0E25\u0E1A\u0E40\u0E25\u0E22")) : React.createElement("button", {
    onClick: () => setDelAsk(true),
    title: "\u0E25\u0E1A\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 13px",
      borderRadius: 10,
      border: "1px solid #EF444455",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 15,
    color: "#EF4444"
  }), " \u0E25\u0E1A\u0E43\u0E1A\u0E19\u0E35\u0E49")), React.createElement("button", {
    onClick: () => {
      flush();
      setPaper(true);
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 15px",
      borderRadius: 10,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 15,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"), !locked && form.status !== "sent" && React.createElement("button", {
    onClick: send,
    title: noEe ? "งานนี้ยังไม่ระบุวิศวกรผู้รับผิดชอบ" : "ส่งให้ " + (job.eeName || "วิศวกร"),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff"
  }), " \u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23"), !canApprove && whyNoApprove && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      maxWidth: 380,
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.4
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 14,
    color: noEe ? "#F59E0B" : "var(--text-3)",
    style: {
      flexShrink: 0
    }
  }), whyNoApprove), canApprove && form.status === "sent" && React.createElement("button", {
    onClick: approve,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: "#10B981",
      color: "#fff",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff"
  }), " \u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), canApprove && form.status === "approved" && React.createElement("button", {
    onClick: reopen,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 15px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "undo",
    size: 15
  }), " \u0E1B\u0E25\u0E14\u0E25\u0E47\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E41\u0E01\u0E49")))), paper && React.createElement(DailyPaper, {
    job: job,
    rec: form,
    date: date,
    allDates: store.dates,
    onClose: () => setPaper(false)
  }), pad && React.createElement(window.DrSignPad, {
    title: pad.title,
    hint: pad.hint,
    onClose: () => setPad(null),
    saved: mine.sign,
    remember: remember,
    onRemember: setRemember,
    onSave: (img, drawn) => {
      sigs.sign(pad.slot, img, currentUser);
      if (drawn && remember) mine.save(img);
      const then = pad.then;
      setPad(null);
      if (then) then();
    }
  }));
}
function DrPRow({
  k,
  v
}) {
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: "6px 10px",
      borderRight: "1px solid #DCE4DF",
      borderBottom: "1px solid #DCE4DF",
      fontSize: 10.5,
      fontWeight: 700,
      color: "#0A4D68",
      background: "#F3F7F4"
    }
  }, k), React.createElement("div", {
    style: {
      padding: "6px 10px",
      borderBottom: "1px solid #DCE4DF",
      fontSize: 11,
      color: "#15211A"
    }
  }, v || "-"));
}
function DrPBlock({
  title,
  children,
  avoid
}) {
  return React.createElement("div", {
    style: {
      marginTop: 16,
      breakInside: avoid ? "avoid" : "auto"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      borderBottom: "1px solid #DCE4DF",
      paddingBottom: 5,
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: 99,
      background: "#1B9B75"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: "#15211A"
    }
  }, title)), children);
}
const drPara = t => React.createElement("div", {
  style: {
    fontSize: 11.5,
    lineHeight: 1.65,
    color: "#15211A",
    whiteSpace: "pre-wrap"
  }
}, t || "—");
const DR_PAPER_I18N = {
  "รายงานประจำวันหน้างาน": ["Site Daily Report", "现场日报"],
  "ชื่องาน": ["Job", "项目名称"],
  "รหัสงาน": ["Job code", "项目编号"],
  "ประเภท": ["Type", "类型"],
  "งานโครงการ": ["Commercial project", "工程项目"],
  "งานบ้าน": ["Residential", "住宅项目"],
  "ขนาดติดตั้ง": ["System size", "装机容量"],
  "สถานที่": ["Location", "地址"],
  "ทีมช่าง": ["Crew", "施工班组"],
  "ความคืบหน้ารวม": ["Overall progress", "总体进度"],
  "จากเมื่อวาน": ["from yesterday", "昨日为"],
  "สภาพอากาศ · เช้า": ["Weather · morning", "天气 · 上午"],
  "บ่าย": ["afternoon", "下午"],
  "ความคืบหน้าตามขั้นงาน": ["Progress by work stage", "各工序进度"],
  "เนื้องานติดตั้งที่เดินไปแล้ว": ["Installation work carried out", "已完成的安装工作"],
  "ขั้น": ["No.", "序号"],
  "รายละเอียดงาน": ["Work item", "工作内容"],
  "แผน เริ่ม": ["Plan start", "计划开始"],
  "แผน จบ": ["Plan finish", "计划完成"],
  "จริง เริ่ม": ["Actual start", "实际开始"],
  "จริง จบ": ["Actual finish", "实际完成"],
  "น้ำหนักงาน": ["Weight", "权重"],
  "ทำไปแล้ว": ["Done", "完成率"],
  "งานที่ทำวันนี้": ["Work done today", "今日工作"],
  "ปัญหา / อุปสรรค": ["Issues and obstacles", "问题与障碍"],
  "สิ่งที่ต้องทำต่อ": ["Next steps", "后续工作"],
  "วัสดุเข้าหน้างาน": ["Materials received on site", "进场材料"],
  "รายการวัสดุ": ["Material", "材料名称"],
  "เครื่องจักร / เครื่องมือ": ["Plant and tools", "机械与工具"],
  "รายการ": ["Item", "项目"],
  "จำนวน": ["Qty", "数量"],
  "หน่วย": ["Unit", "单位"],
  "จุดจัดเก็บ": ["Stored at", "存放位置"],
  "ใช้กับงาน": ["Used for", "用途"],
  "หมายเหตุ": ["Note", "备注"],
  "กำลังคน": ["Manpower", "人力"],
  "ตำแหน่ง": ["Role", "岗位"],
  "ชื่อผู้ปฏิบัติงาน": ["Name", "人员姓名"],
  "ความปลอดภัย & สิ่งแวดล้อม": ["Safety and environment", "安全与环境"],
  "ระดับความเสี่ยง (JSA):": ["Risk level (JSA):", "风险等级（JSA）："],
  "ใบอนุญาตทำงานเย็น:": ["Cold work permit:", "冷作业许可："],
  "ใบอนุญาตทำงานร้อน:": ["Hot work permit:", "动火作业许可："],
  "จัดเก็บพื้นที่:": ["Housekeeping:", "场地清理："],
  "เอกสารรับรอง": ["Certificate", "证明文件"],
  "ผู้รับผิดชอบ": ["Responsible", "负责人"],
  "มี": ["Yes", "有"],
  "ไม่มี": ["No", "无"],
  "รูปหน้างาน": ["Site photos", "现场照片"],
  "รูปที่": ["Photo", "照片"],
  "รูป": ["photos", "张"],
  "แผง": ["modules", "块组件"],
  "ผู้บันทึก (ช่างหน้างาน)": ["Recorded by (site technician)", "记录人（现场技师）"],
  "ผู้อนุมัติ (หัวหน้างาน)": ["Approved by (supervisor)", "批准人（工地主管）"],
  "ชื่อ:": ["Name:", "姓名："],
  "วันที่:": ["Date:", "日期："],
  "ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ": ["Signed electronically in the system", "已在系统内电子签名"],
  "เอกสารนี้ออกจากระบบติดตามงานติดตั้ง": ["Issued by the installation tracking system of", "本文件由安装管理系统开具"],
  "พิมพ์เมื่อ": ["printed", "打印于"],
  "ร่าง": ["Draft", "草稿"],
  "รออนุมัติ": ["Pending approval", "待批准"],
  "อนุมัติแล้ว": ["Approved", "已批准"],
  "แดดจัด": ["Sunny", "晴"],
  "เมฆมาก": ["Cloudy", "多云"],
  "ฝนตก": ["Rain", "雨"],
  "ฝนฟ้าคะนอง": ["Thunderstorm", "雷雨"],
  "ต่ำ": ["Low", "低"],
  "ปานกลาง": ["Medium", "中"],
  "สูง": ["High", "高"],
  "สูงมาก": ["Extreme", "极高"],
  "เก็บพื้นที่ทำงาน": ["Work area cleared", "清理作业区"],
  "เก็บขยะ": ["Waste removed", "清运垃圾"],
  "ทำความสะอาดเครื่องมือ": ["Tools cleaned", "工具清洁"],
  "จัดเก็บวัสดุ": ["Materials stored", "材料归位"],
  "เก็บงานทั้งหมด": ["Full site clean-up", "全面清场"]
};
function DailyPaper({
  job,
  rec,
  date,
  allDates,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [lang, setLang] = React.useState(() => window.pgLang ? window.pgLang() : "th");
  const pickLang = id => {
    setLang(id);
    if (window.pgSetLang) window.pgSetLang(id);
  };
  const T = React.useMemo(() => window.pgT ? window.pgT(DR_PAPER_I18N, lang) : k => k, [lang]);
  const DT = iso => !iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso, true) : window.pgDate(iso, lang);
  const DTs = iso => !iso ? "—" : lang === "th" || !window.pgDate ? window.drDateTH(iso) : window.pgDate(iso, lang);
  const {
    photos
  } = window.useDailyPhotos(job.id, date);
  const {
    signs
  } = window.useDailySigns(job.id, date);
  const st = window.drStatusOf(rec.status);
  const docNo = window.drDocNo(job, date, allDates);
  const isProject = rec.mode === "project";
  const wAm = window.drWeatherOf(rec.weatherAm);
  const wPm = window.drWeatherOf(rec.weatherPm);
  const jsa = (window.DR_JSA || []).find(j => j.key === rec.jsa);
  const pct = +rec.pct || 0;
  const steps = React.useMemo(() => {
    const all = rec.steps || [];
    if (isProject) return all;
    const used = all.filter(r => r.actStart || r.actEnd || r.planStart || r.planEnd || +r.pct > 0);
    return used.length ? used : all;
  }, [rec.steps, isProject]);
  const doPrint = () => {
    const old = document.title;
    document.title = T("รายงานประจำวันหน้างาน") + " " + (job.code || "") + " " + date;
    window.print();
    setTimeout(() => {
      document.title = old;
    }, 800);
  };
  const th = {
    textAlign: "left",
    padding: "5px 7px",
    fontSize: 10,
    fontWeight: 700,
    color: "#5A6B62",
    borderBottom: "1px solid #C9D5CE",
    whiteSpace: "nowrap"
  };
  const td = {
    padding: "5px 7px",
    fontSize: 10.5,
    color: "#15211A",
    borderBottom: "1px solid #ECF1EE",
    verticalAlign: "top"
  };
  const rowsTable = (title, cols, rows) => !rows || !rows.length ? null : React.createElement(DrPBlock, {
    title: T(title)
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 26
    })
  }, "#"), cols.map(c => React.createElement("th", {
    key: c.k,
    style: th
  }, T(c.th))))), React.createElement("tbody", null, rows.map((r, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      color: "#7A8A81"
    })
  }, i + 1), cols.map(c => React.createElement("td", {
    key: c.k,
    style: td
  }, r[c.k] || "-")))))));
  return React.createElement("div", {
    className: "sv-rep-overlay",
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 160,
      background: "rgba(8,20,14,.55)",
      overflow: "auto",
      padding: isMobile ? 0 : "24px 16px"
    }
  }, React.createElement("div", {
    className: "sv-rep-noprint",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      display: "flex",
      gap: 9,
      alignItems: "center",
      flexWrap: "wrap",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      marginBottom: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 12,
      maxWidth: 900,
      marginLeft: "auto",
      marginRight: "auto",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
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
    size: 16
  })), React.createElement("div", {
    style: {
      flex: "1 1 170px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19 \xB7 ", window.drDateTH(date)), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, photos.length, " \u0E23\u0E39\u0E1B \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap",
      minWidth: 0,
      marginLeft: "auto",
      justifyContent: "flex-end"
    }
  }, typeof window.LangPick === "function" && React.createElement(window.LangPick, {
    value: lang,
    onChange: pickLang
  }), React.createElement("button", {
    onClick: doPrint,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 16,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"))), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: "#15211A",
      fontFamily: lang === "zh" && window.pgFontStack ? window.pgFontStack("zh") : undefined,
      padding: isMobile ? "20px 16px" : "30px 34px",
      borderRadius: isMobile ? 0 : 12,
      boxShadow: "0 20px 60px rgba(8,20,14,.28)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
      borderBottom: "2px solid #1B9B75",
      paddingBottom: 11
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: "-.01em"
    }
  }, T("รายงานประจำวันหน้างาน")), React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "PROJECT INSTALLATION \u2014 DAILY REPORT"), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 6
    }
  }, React.createElement(window.BrandMark, {
    size: 22,
    variant: "light"
  }), React.createElement(window.BrandWord, {
    size: 16,
    color: "#0F2B33"
  }))), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 11,
      color: "#4A5A51",
      lineHeight: 1.75
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "#15211A"
    }
  }, docNo), React.createElement("div", null, DT(date)), React.createElement("div", {
    style: {
      display: "inline-block",
      marginTop: 3,
      padding: "2px 9px",
      borderRadius: 99,
      background: st.color + "22",
      color: st.color,
      fontWeight: 700,
      fontSize: 10.5
    }
  }, T(st.th)))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement(DrPRow, {
    k: T("ชื่องาน"),
    v: job.name
  }), React.createElement(DrPRow, {
    k: T("รหัสงาน"),
    v: job.code
  }), React.createElement(DrPRow, {
    k: T("ประเภท"),
    v: T(isProject ? "งานโครงการ" : "งานบ้าน")
  }), React.createElement(DrPRow, {
    k: T("ขนาดติดตั้ง"),
    v: (job.kw ? job.kw + " kW" : "") + (job.panels ? " · " + job.panels + " " + T("แผง") : "")
  }), React.createElement(DrPRow, {
    k: T("สถานที่"),
    v: [job.address, job.province].filter(Boolean).join(" · ")
  }), React.createElement(DrPRow, {
    k: T("ทีมช่าง"),
    v: rec.team || job.tech && job.tech.name || "-"
  })), React.createElement("div", {
    style: {
      marginTop: 14,
      border: "1px solid #DCE4DF",
      borderRadius: 9,
      padding: "12px 14px",
      breakInside: "avoid"
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
      fontSize: 11.5,
      fontWeight: 700,
      color: "#4A5A51"
    }
  }, T("ความคืบหน้ารวม")), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 160,
      height: 9,
      borderRadius: 99,
      background: "#E8EEEA",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(100, pct)) + "%",
      height: "100%",
      background: "#1B9B75"
    }
  })), React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      color: "#15211A"
    }
  }, pct, "%"), rec.prevPct != null && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#4A5A51"
    }
  }, T("จากเมื่อวาน"), " ", rec.prevPct, "%")), (wAm || wPm) && React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 11,
      color: "#4A5A51"
    }
  }, T("สภาพอากาศ · เช้า"), " ", React.createElement("b", {
    style: {
      color: "#15211A"
    }
  }, wAm ? T(wAm.th) : "-"), " \xB7 ", T("บ่าย"), " ", React.createElement("b", {
    style: {
      color: "#15211A"
    }
  }, wPm ? T(wPm.th) : "-"))), !!steps.length && React.createElement(DrPBlock, {
    title: T(isProject ? "ความคืบหน้าตามขั้นงาน" : "เนื้องานติดตั้งที่เดินไปแล้ว")
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 38
    })
  }, T("ขั้น")), React.createElement("th", {
    style: th
  }, T("รายละเอียดงาน")), isProject && React.createElement("th", {
    style: th
  }, T("แผน เริ่ม")), isProject && React.createElement("th", {
    style: th
  }, T("แผน จบ")), isProject && React.createElement("th", {
    style: th
  }, T("จริง เริ่ม")), isProject && React.createElement("th", {
    style: th
  }, T("จริง จบ")), !isProject && React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 78
    })
  }, T("น้ำหนักงาน")), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 66
    })
  }, T("ทำไปแล้ว")))), React.createElement("tbody", null, steps.map((r, i) => React.createElement("tr", {
    key: i,
    style: {
      background: r.head ? "#F3F7F4" : "transparent"
    }
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontWeight: r.head ? 800 : 400,
      color: r.head ? "#0A4D68" : "#7A8A81"
    })
  }, r.no), React.createElement("td", {
    style: Object.assign({}, td, {
      fontWeight: r.head ? 700 : 400
    })
  }, r.th), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.planStart ? window.pgShort ? window.pgShort(r.planStart, lang) : window.drShort(r.planStart) : "—"), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.planEnd ? window.pgShort ? window.pgShort(r.planEnd, lang) : window.drShort(r.planEnd) : "—"), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.actStart ? window.pgShort ? window.pgShort(r.actStart, lang) : window.drShort(r.actStart) : "—"), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.actEnd ? window.pgShort ? window.pgShort(r.actEnd, lang) : window.drShort(r.actEnd) : "—"), !isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      textAlign: "right",
      fontFamily: "var(--mono)",
      color: "#7A8A81"
    })
  }, r.w ? r.w + "%" : "—"), React.createElement("td", {
    style: Object.assign({}, td, {
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontWeight: 700
    })
  }, r.pct ? r.pct + "%" : "—")))))), React.createElement(DrPBlock, {
    title: T("งานที่ทำวันนี้"),
    avoid: true
  }, drPara(rec.work)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18
    }
  }, React.createElement(DrPBlock, {
    title: T("ปัญหา / อุปสรรค"),
    avoid: true
  }, drPara(rec.problem)), React.createElement(DrPBlock, {
    title: T("สิ่งที่ต้องทำต่อ"),
    avoid: true
  }, drPara(rec.nextDay))), isProject && React.createElement(React.Fragment, null, rowsTable("วัสดุเข้าหน้างาน", [{
    k: "name",
    th: "รายการวัสดุ"
  }, {
    k: "qty",
    th: "จำนวน"
  }, {
    k: "unit",
    th: "หน่วย"
  }, {
    k: "loc",
    th: "จุดจัดเก็บ"
  }, {
    k: "note",
    th: "หมายเหตุ"
  }], rec.materials), rowsTable("เครื่องจักร / เครื่องมือ", [{
    k: "name",
    th: "รายการ"
  }, {
    k: "qty",
    th: "จำนวน"
  }, {
    k: "unit",
    th: "หน่วย"
  }, {
    k: "job",
    th: "ใช้กับงาน"
  }, {
    k: "note",
    th: "หมายเหตุ"
  }], rec.machines), rowsTable("กำลังคน", [{
    k: "role",
    th: "ตำแหน่ง"
  }, {
    k: "qty",
    th: "จำนวน"
  }, {
    k: "name",
    th: "ชื่อผู้ปฏิบัติงาน"
  }, {
    k: "note",
    th: "หมายเหตุ"
  }], rec.manpower), (jsa || rec.permitCold || rec.permitHot || Object.keys(rec.clean || {}).length || (rec.certs || []).length) && React.createElement(DrPBlock, {
    title: T("ความปลอดภัย & สิ่งแวดล้อม"),
    avoid: true
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#15211A",
      lineHeight: 1.9
    }
  }, React.createElement("div", null, T("ระดับความเสี่ยง (JSA):"), " ", React.createElement("b", null, jsa ? T(jsa.th) + " (" + jsa.range + ")" : "—")), React.createElement("div", null, T("ใบอนุญาตทำงานเย็น:"), " ", React.createElement("b", null, rec.permitCold === "yes" ? T("มี") : rec.permitCold === "no" ? T("ไม่มี") : "—"), "  ·  ", T("ใบอนุญาตทำงานร้อน:"), " ", React.createElement("b", null, rec.permitHot === "yes" ? T("มี") : rec.permitHot === "no" ? T("ไม่มี") : "—")), React.createElement("div", null, T("จัดเก็บพื้นที่:"), " ", React.createElement("b", null, (window.DR_CLEAN || []).filter(c => (rec.clean || {})[c.key]).map(c => T(c.th)).join(" · ") || "—"))), !!(rec.certs || []).length && React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 8
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: th
  }, T("เอกสารรับรอง")), React.createElement("th", {
    style: th
  }, T("ผู้รับผิดชอบ")))), React.createElement("tbody", null, rec.certs.map((c, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    style: td
  }, c.name || "-"), React.createElement("td", {
    style: td
  }, c.by || "-"))))))), !!photos.length && React.createElement(DrPBlock, {
    title: T("รูปหน้างาน") + " (" + photos.length + " " + T("รูป") + ")"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignItems: "start"
    }
  }, photos.map((p, i) => React.createElement("div", {
    key: p.id,
    className: "dr-shot",
    style: {
      breakInside: "avoid",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement("img", {
    src: p.dataUrl,
    alt: p.cap || "",
    style: {
      width: "100%",
      display: "block",
      background: "#F3F7F4"
    }
  }), React.createElement("div", {
    style: {
      padding: "5px 8px",
      fontSize: 10.5,
      color: "#4A5A51",
      borderTop: "1px solid #ECF1EE"
    }
  }, React.createElement("b", {
    style: {
      color: "#0A4D68"
    }
  }, T("รูปที่"), " ", i + 1), p.cap ? " · " + p.cap : ""))))), React.createElement("div", {
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      breakInside: "avoid"
    }
  }, [{
    t: T("ผู้บันทึก (ช่างหน้างาน)"),
    n: rec.byName,
    d: rec.sentAt || rec.updatedAt || rec.createdAt,
    g: signs.by
  }, {
    t: T("ผู้อนุมัติ (หัวหน้างาน)"),
    n: rec.appName,
    d: rec.approvedAt,
    g: signs.app
  }].map((s, i) => React.createElement("div", {
    key: i,
    style: {
      border: "1px solid #DCE4DF",
      borderRadius: 8,
      padding: "12px 14px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "#5A6B62"
    }
  }, s.t), React.createElement("div", {
    style: {
      height: 42,
      borderBottom: "1px solid #C9D5CE",
      marginTop: 6,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      overflow: "hidden"
    }
  }, s.g && s.g.img && React.createElement("img", {
    src: s.g.img,
    alt: "",
    style: {
      maxWidth: "88%",
      maxHeight: 40,
      objectFit: "contain"
    }
  })), React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 6,
      color: "#15211A"
    }
  }, T("ชื่อ:"), " ", React.createElement("b", null, s.g && s.g.name || s.n || "-")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5A51"
    }
  }, T("วันที่:"), " ", DTs(s.g ? window.drSignDay(s.g) : window.drLocalDay(s.d))), s.g && s.g.img && React.createElement("div", {
    style: {
      fontSize: 8.5,
      color: "#8A9A91",
      marginTop: 3
    }
  }, T("ลงลายมือชื่ออิเล็กทรอนิกส์ในระบบ"), " ", window.drSignTime(s.g) ? window.drSignTime(s.g) + (lang === "th" ? " น." : "") : "")))), React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 9.5,
      color: "#8A9A91",
      textAlign: "center"
    }
  }, T("เอกสารนี้ออกจากระบบติดตามงานติดตั้ง"), " flash+solar \xB7 ", docNo, " \xB7 ", T("พิมพ์เมื่อ"), " ", DTs(window.drToday()))));
}
const DR_GRID_CELL = {
  approved: "#10B981",
  sent: "#F59E0B",
  draft: "#94A3B8"
};
function DrGrid({
  jobs,
  all,
  days,
  onOpen,
  onPickJob,
  sentOnly
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.drToday();
  const cols = React.useMemo(() => {
    const out = [];
    for (let i = days - 1; i >= 0; i--) out.push(window.drAddDays(today, -i));
    return out;
  }, [days, today]);
  const scroller = React.useRef(null);
  React.useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days, jobs.length]);
  const rows = React.useMemo(() => {
    const out = (jobs || []).map(j => {
      const byDate = (all || {})[j.id] || {};
      const cells = cols.map(d => ({
        d,
        rec: byDate[d] || null
      }));
      const written = cells.filter(c => c.rec).length;
      const sent = cells.filter(c => c.rec && c.rec.status === "sent").length;
      let last = null;
      for (let i = cells.length - 1; i >= 0; i--) if (cells[i].rec) {
        last = cells[i];
        break;
      }
      return {
        job: j,
        cells,
        written,
        sent,
        last
      };
    }).filter(r => r.job.stage === "install" || r.written);
    const use = sentOnly ? out.filter(r => r.sent) : out;
    use.sort((a, b) => b.sent - a.sent || a.written - b.written || String(a.job.code || "").localeCompare(String(b.job.code || "")));
    return use;
  }, [jobs, all, cols, sentOnly]);
  const cw = isMobile ? 17 : 21;
  const nameW = isMobile ? 132 : 200;
  if (!rows.length) return React.createElement("div", {
    style: {
      padding: 22,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, sentOnly ? "ไม่มีใบที่รออนุมัติในช่วงนี้" : "ไม่มีงานที่ต้องเขียนรายงานในช่วงนี้");
  return React.createElement("div", {
    ref: scroller,
    style: {
      overflowX: "auto"
    }
  }, React.createElement("div", {
    style: {
      minWidth: nameW + cols.length * cw + 108,
      width: "max-content"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 0,
      padding: "0 12px 6px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      width: nameW,
      flexShrink: 0,
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      position: "sticky",
      left: 0,
      background: "var(--surface2)",
      zIndex: 2
    }
  }, "\u0E07\u0E32\u0E19"), cols.map(d => {
    const dt = new Date(d + "T00:00:00");
    const mark = dt.getDay() === 1 || dt.getDate() === 1;
    return React.createElement("div", {
      key: d,
      style: {
        width: cw,
        flexShrink: 0,
        textAlign: "center",
        fontFamily: "var(--mono)",
        fontSize: 9,
        color: d === today ? "var(--primary-dark)" : "var(--text-3)",
        fontWeight: d === today ? 800 : 600
      }
    }, d === today ? "วันนี้" : mark ? dt.getDate() : "");
  }), React.createElement("div", {
    style: {
      width: 108,
      flexShrink: 0,
      textAlign: "right",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14")), rows.map(r => React.createElement("div", {
    key: r.job.id,
    style: {
      display: "flex",
      alignItems: "center",
      padding: "5px 12px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("button", {
    onClick: () => onPickJob(r.job),
    title: "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E17\u0E38\u0E01\u0E27\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49",
    style: {
      width: nameW,
      flexShrink: 0,
      textAlign: "left",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      padding: "2px 6px 2px 0",
      minWidth: 0,
      position: "sticky",
      left: 0,
      background: "var(--surface2)",
      zIndex: 2
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, r.job.name), React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--mono)",
      fontSize: 10,
      color: "var(--text-3)"
    }
  }, r.job.code, r.job.eeName ? " · " + r.job.eeName : " · ยังไม่ระบุวิศวกร")), r.cells.map(c => {
    const st = c.rec ? c.rec.status || "draft" : null;
    const col = st ? DR_GRID_CELL[st] || DR_GRID_CELL.draft : "";
    return React.createElement("button", {
      key: c.d,
      onClick: () => onOpen(r.job, c.d),
      title: window.drDateTH(c.d) + " · " + (c.rec ? window.drStatusOf(st).th + (c.rec.pct != null ? " · " + (+c.rec.pct || 0) + "%" : "") : "ยังไม่เขียน"),
      style: {
        width: cw,
        flexShrink: 0,
        height: 24,
        border: "none",
        background: "none",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        padding: 0
      }
    }, React.createElement("span", {
      style: {
        width: cw - 5,
        height: cw - 5,
        borderRadius: 5,
        background: col || "transparent",
        border: col ? "none" : "1px dashed var(--border-strong)",
        opacity: col ? 1 : 0.55
      }
    }));
  }), React.createElement("div", {
    style: {
      width: 108,
      flexShrink: 0,
      textAlign: "right",
      lineHeight: 1.3
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: r.written ? "var(--text-2)" : "#EF4444"
    }
  }, r.written, "/", days, " \u0E27\u0E31\u0E19"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10,
      color: "var(--text-3)"
    }
  }, r.sent ? React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700
    }
  }, "\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 ", r.sent) : r.last && r.last.rec.pct != null ? "คืบหน้า " + (+r.last.rec.pct || 0) + "%" : "—"))))));
}
function DrJobSummary({
  job,
  all,
  onOpen,
  onBack
}) {
  const byDate = (all || {})[job.id] || {};
  const dates = Object.keys(byDate).sort().reverse();
  const n = {
    sent: 0,
    approved: 0,
    draft: 0
  };
  dates.forEach(d => {
    const k = byDate[d].status || "draft";
    n[k] = (n[k] || 0) + 1;
  });
  return React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 14,
      background: "var(--surface2)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "11px 14px",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("button", {
    onClick: onBack,
    title: "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E15\u0E32\u0E23\u0E32\u0E07\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21",
    style: {
      width: 30,
      height: 30,
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
    name: "chevronRight",
    size: 14,
    style: {
      transform: "rotate(180deg)"
    }
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job.name), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, job.code, " \xB7 \u0E40\u0E02\u0E35\u0E22\u0E19\u0E41\u0E25\u0E49\u0E27 ", dates.length, " \u0E27\u0E31\u0E19", n.sent ? " · รออนุมัติ " + n.sent : "", " · วิศวกร " + (job.eeName || "ยังไม่ระบุ")))), !dates.length && React.createElement("div", {
    style: {
      padding: 22,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E40\u0E02\u0E35\u0E22\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"), dates.map(d => {
    const rec = byDate[d];
    const st = window.drStatusOf(rec.status || "draft");
    return React.createElement("button", {
      key: d,
      onClick: () => onOpen(job, d),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "11px 14px",
        border: "none",
        borderBottom: "1px solid var(--border)",
        background: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: st.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        color: "var(--text-2)",
        flexShrink: 0,
        width: 92
      }
    }, window.drShort(d)), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        fontSize: 12.5,
        color: "var(--text-2)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, rec.work ? String(rec.work) : React.createElement("span", {
      style: {
        color: "var(--text-3)"
      }
    }, "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E01\u0E23\u0E2D\u0E01\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33")), rec.pct != null && React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-2)",
        flexShrink: 0
      }
    }, +rec.pct || 0, "%"), React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        color: st.color,
        background: st.color + "1a",
        borderRadius: 99,
        padding: "3px 9px",
        flexShrink: 0,
        whiteSpace: "nowrap"
      }
    }, st.th));
  }));
}
function drApproveQueue(jobs, all, role, currentUser) {
  const out = [];
  (jobs || []).forEach(job => {
    const byDate = (all || {})[job.id] || {};
    Object.keys(byDate).forEach(d => {
      const rec = byDate[d];
      if (!rec || rec.status !== "sent") return;
      if (!window.drCanApprove(role, job, currentUser, rec)) return;
      out.push({
        job: job,
        date: d,
        rec: rec
      });
    });
  });
  out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return out;
}
function DrInbox({
  rows,
  onOpen
}) {
  if (!rows.length) {
    return React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "var(--text-3)",
        fontSize: 13
      }
    }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E1A\u0E23\u0E2D\u0E04\u0E38\u0E13\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34", React.createElement("div", {
      style: {
        marginTop: 6,
        fontSize: 11.5
      }
    }, "\u0E43\u0E1A\u0E08\u0E30\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E0A\u0E48\u0E32\u0E07\u0E01\u0E14\u0E2A\u0E48\u0E07\u0E43\u0E19\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"));
  }
  const today = window.drToday();
  return React.createElement("div", null, rows.map(r => {
    const late = Math.round((new Date(today) - new Date(r.date)) / 86400000);
    return React.createElement("button", {
      key: r.job.id + "|" + r.date,
      onClick: () => onOpen(r.job, r.date),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "13px 16px",
        background: "none",
        border: "none",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: "#F59E0B",
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
    }, r.job.name), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, r.job.code, " \xB7 ", window.drDateTH(r.date), " \xB7 \u0E42\u0E14\u0E22 ", r.rec.byName || "—", r.rec.work ? " · " + String(r.rec.work).slice(0, 40) : "")), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 800,
        color: "var(--text-2)",
        flexShrink: 0
      }
    }, (+r.rec.pct || 0) + "%"), late >= 2 && React.createElement("span", {
      style: {
        padding: "3px 9px",
        borderRadius: 99,
        background: "var(--tint-amber-bg)",
        color: "var(--tint-amber-tx)",
        fontSize: 11,
        fontWeight: 800,
        flexShrink: 0
      }
    }, "\u0E04\u0E49\u0E32\u0E07 ", late, " \u0E27\u0E31\u0E19"), React.createElement(Icon, {
      name: "chevronRight",
      size: 15
    }));
  }));
}
function DailyView({
  jobs,
  role,
  currentUser,
  onOpen
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const {
    all,
    loading
  } = window.useDailyAll();
  const [date, setDate] = React.useState(window.drToday);
  const [mode, setMode] = React.useState("day");
  const [days, setDays] = React.useState(14);
  const [sentOnly, setSentOnly] = React.useState(false);
  const [jobPick, setJobPick] = React.useState(null);
  React.useEffect(() => {
    if (mode !== "grid") setJobPick(null);
  }, [mode]);
  const pickedJob = React.useMemo(() => jobPick ? (jobs || []).find(j => j.id === jobPick.id) || jobPick : null, [jobs, jobPick]);
  const inbox = React.useMemo(() => drApproveQueue(jobs, all, role, currentUser), [jobs, all, role, currentUser]);
  const canDelete = window.drCanDelete(role);
  const [delAsk, setDelAsk] = React.useState(null);
  React.useEffect(() => setDelAsk(null), [date]);
  const rows = React.useMemo(() => {
    const out = (jobs || []).map(j => ({
      job: j,
      rec: ((all || {})[j.id] || {})[date] || null
    })).filter(r => r.job.stage === "install" || r.rec);
    const rank = {
      sent: 0,
      draft: 1,
      approved: 2
    };
    out.sort((a, b) => {
      const ka = a.rec ? rank[a.rec.status] != null ? rank[a.rec.status] : 1 : 3;
      const kb = b.rec ? rank[b.rec.status] != null ? rank[b.rec.status] : 1 : 3;
      if (ka !== kb) return ka - kb;
      return String(a.job.code || "").localeCompare(String(b.job.code || ""));
    });
    return out;
  }, [jobs, all, date]);
  const n = React.useMemo(() => {
    const o = {
      sent: 0,
      approved: 0,
      draft: 0,
      none: 0
    };
    rows.forEach(r => {
      o[r.rec ? r.rec.status || "draft" : "none"] += 1;
    });
    return o;
  }, [rows]);
  const stat = (label, value, color) => React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 92,
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
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
  }, value));
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
      alignItems: "center",
      gap: 7,
      flexWrap: "wrap"
    }
  }, [["day", "รายวัน", "calendar"], ["grid", "ตารางภาพรวม", "table"], ["inbox", "รอฉันอนุมัติ", "check"]].map(([k, th, ic]) => React.createElement("button", {
    key: k,
    onClick: () => setMode(k),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "7px 14px",
      borderRadius: 99,
      border: "1px solid " + (mode === k ? "var(--primary)" : "var(--border-strong)"),
      background: mode === k ? "var(--primary-soft)" : "var(--surface)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      color: mode === k ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: ic,
    size: 15,
    color: mode === k ? "var(--primary-dark)" : "var(--text-2)"
  }), th, k === "inbox" && inbox.length > 0 && React.createElement("span", {
    style: {
      minWidth: 18,
      padding: "0 6px",
      borderRadius: 99,
      background: "#F59E0B",
      color: "#fff",
      fontFamily: "var(--mono)",
      fontSize: 11,
      fontWeight: 800
    }
  }, inbox.length)))), mode === "inbox" ? React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 14,
      background: "var(--surface)",
      overflow: "hidden"
    }
  }, loading ? React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...") : React.createElement(DrInbox, {
    rows: inbox,
    onOpen: onOpen
  })) : mode === "grid" ? React.createElement(React.Fragment, null, !pickedJob && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      flexWrap: "wrap"
    }
  }, [14, 30].map(d => React.createElement("button", {
    key: d,
    onClick: () => setDays(d),
    style: {
      padding: "6px 13px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (days === d ? "var(--primary)" : "var(--border-strong)"),
      background: days === d ? "var(--primary-soft)" : "var(--surface)",
      color: days === d ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, d, " \u0E27\u0E31\u0E19\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14")), React.createElement("button", {
    onClick: () => setSentOnly(v => !v),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 13px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (sentOnly ? "#F59E0B" : "var(--border-strong)"),
      background: sentOnly ? "#F59E0B16" : "var(--surface)",
      color: sentOnly ? "#B45309" : "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 3,
      background: "#F59E0B"
    }
  }), "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E17\u0E35\u0E48\u0E23\u0E2D\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 11,
      flexWrap: "wrap"
    }
  }, [["อนุมัติแล้ว", "#10B981"], ["รออนุมัติ", "#F59E0B"], ["ยังเป็นร่าง", "#94A3B8"]].map(([th, c]) => React.createElement("span", {
    key: th,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      background: c
    }
  }), th)), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 3,
      border: "1px dashed var(--border-strong)"
    }
  }), "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E02\u0E35\u0E22\u0E19"))), React.createElement("div", {
    style: {
      border: "1px solid var(--border)",
      borderRadius: 14,
      background: "var(--surface2)",
      overflow: "hidden",
      padding: pickedJob ? 0 : "12px 0 4px"
    }
  }, loading && React.createElement("div", {
    style: {
      padding: 20,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."), !loading && (pickedJob ? React.createElement(DrJobSummary, {
    job: pickedJob,
    all: all,
    onOpen: onOpen,
    onBack: () => setJobPick(null)
  }) : React.createElement(DrGrid, {
    jobs: jobs,
    all: all,
    days: days,
    sentOnly: sentOnly,
    onOpen: onOpen,
    onPickJob: setJobPick
  })))) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, -1)),
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
  })), React.createElement("input", {
    type: "date",
    value: date,
    max: window.drToday(),
    onChange: e => setDate(e.target.value || window.drToday()),
    style: Object.assign({}, DR_INPUT, {
      width: "auto",
      padding: "7px 10px",
      fontFamily: "var(--mono)",
      fontSize: 12.5
    })
  }), React.createElement("button", {
    onClick: () => setDate(window.drAddDays(date, 1)),
    disabled: date >= window.drToday(),
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: date >= window.drToday() ? "default" : "pointer",
      opacity: date >= window.drToday() ? 0.4 : 1,
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15
  })), React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, window.drDateTH(date, true))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap"
    }
  }, stat("รออนุมัติ", n.sent, "#F59E0B"), stat("อนุมัติแล้ว", n.approved, "#10B981"), stat("ยังเป็นร่าง", n.draft, "#94A3B8"), stat("ยังไม่เขียน", n.none, "#EF4444")), React.createElement("div", {
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
      padding: 20,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E02\u0E35\u0E22\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), rows.map(r => {
    const s = r.rec ? window.drStatusOf(r.rec.status) : {
      th: "ยังไม่เขียน",
      color: "#EF4444"
    };
    if (canDelete && delAsk === r.job.id) return React.createElement("div", {
      key: r.job.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: isMobile ? "11px 12px" : "13px 16px",
        borderBottom: "1px solid var(--border)",
        background: "#EF44440e",
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 140,
        fontSize: 12.5,
        fontWeight: 700,
        color: "#EF4444"
      }
    }, "\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 ", r.job.code, " \u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E17\u0E31\u0E49\u0E07\u0E43\u0E1A? \u0E23\u0E39\u0E1B\u0E41\u0E25\u0E30\u0E25\u0E32\u0E22\u0E40\u0E0B\u0E47\u0E19\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"), React.createElement("button", {
      onClick: () => setDelAsk(null),
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
        window.drDeleteDay(r.job.id, date);
        setDelAsk(null);
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
    }), " \u0E25\u0E1A\u0E40\u0E25\u0E22"));
    return React.createElement("div", {
      key: r.job.id,
      style: {
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("button", {
      onClick: () => onOpen(r.job),
      style: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: isMobile ? "11px 12px" : "13px 16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
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
    }, r.job.name), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, r.job.code, " \xB7 ", r.job.type === "project" ? "งานโครงการ" : "งานบ้าน", r.rec && r.rec.work ? " · " + String(r.rec.work).slice(0, 46) : "")), r.rec && r.rec.pct != null && React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--text-2)",
        flexShrink: 0
      }
    }, +r.rec.pct || 0, "%"), React.createElement("span", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: s.color,
        background: s.color + "1a",
        borderRadius: 99,
        padding: "3px 10px",
        flexShrink: 0,
        whiteSpace: "nowrap"
      }
    }, s.th)), canDelete && r.rec && React.createElement("button", {
      onClick: () => setDelAsk(r.job.id),
      title: "\u0E25\u0E1A\u0E43\u0E1A\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 (\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19)",
      style: {
        width: 34,
        height: 34,
        marginRight: isMobile ? 8 : 12,
        borderRadius: 9,
        flexShrink: 0,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 15,
      color: "#EF4444"
    })));
  }))));
}
function DailyJobButton({
  job,
  onOpen
}) {
  const store = window.useDailyReports(job ? job.id : null);
  const today = window.drToday();
  const s = window.drDayState(store.byDate, today);
  const n = store.dates.length;
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
      borderLeft: "3px solid " + s.color,
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
      background: s.color + "1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "pen",
    size: 17,
    color: s.color
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
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: s.color,
      fontWeight: 700
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 \xB7 ", s.th, n ? React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 400
    }
  }, " \xB7 \u0E40\u0E02\u0E35\u0E22\u0E19\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27 ", n, " \u0E27\u0E31\u0E19") : null)), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  }));
}
Object.assign(window, {
  DailyReportModal,
  DailyPaper,
  DailyView,
  DailyJobButton,
  DrInbox,
  drApproveQueue,
  DrLabel,
  DrText,
  DrSection,
  DrChips,
  DrRows,
  DrPhotoCap,
  DrSignSlot,
  DR_INPUT
});