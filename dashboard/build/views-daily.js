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
    onClick: () => onChange(list.concat([{}])),
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
  }))), React.createElement("input", {
    value: p.cap || "",
    disabled: disabled,
    placeholder: "\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E23\u0E39\u0E1B",
    onChange: e => setCap(p.id, e.target.value),
    style: {
      width: "100%",
      border: "none",
      borderTop: "1px solid var(--border)",
      padding: "8px 10px",
      background: "var(--surface)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12,
      boxSizing: "border-box"
    }
  })))));
}
function DailyReportModal({
  job,
  role,
  currentUser,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const store = window.useDailyReports(job ? job.id : null);
  const [date, setDate] = React.useState(window.drToday);
  const [form, setForm] = React.useState(null);
  const [paper, setPaper] = React.useState(false);
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
  const locked = !window.drCanEdit(role, form);
  const canApprove = window.drCanApprove(role);
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
  const flush = () => {
    clearTimeout(timer.current);
    if (form && !locked) store.save(date, form);
  };
  const send = () => {
    flush();
    store.save(date, Object.assign({}, form, {
      status: "sent",
      sentAt: new Date().toISOString(),
      byId: (currentUser || {}).id || null,
      byName: (currentUser || {}).name || ""
    }));
  };
  const approve = () => {
    store.save(date, Object.assign({}, form, {
      status: "approved",
      approvedAt: new Date().toISOString(),
      appId: (currentUser || {}).id || null,
      appName: (currentUser || {}).name || ""
    }));
  };
  const reopen = () => store.patch(date, {
    status: "draft",
    approvedAt: null,
    appId: null,
    appName: null
  });
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
  }, st.th), isProject && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#7C5CFC",
      background: "#7C5CFC1c",
      borderRadius: 99,
      padding: "2px 9px"
    }
  }, "\u0E07\u0E32\u0E19\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23 \xB7 \u0E41\u0E1A\u0E1A\u0E04\u0E23\u0E1A"), !isProject && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#F59E0B",
      background: "#F59E0B1c",
      borderRadius: 99,
      padding: "2px 9px"
    }
  }, "\u0E07\u0E32\u0E19\u0E1A\u0E49\u0E32\u0E19 \xB7 \u0E41\u0E1A\u0E1A\u0E22\u0E48\u0E2D")), React.createElement("div", {
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
    hint: "\u0E43\u0E2A\u0E48\u0E44\u0E14\u0E49\u0E44\u0E21\u0E48\u0E08\u0E33\u0E01\u0E31\u0E14 \xB7 \u0E22\u0E48\u0E2D\u0E23\u0E39\u0E1B\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"
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
  }))))), React.createElement("div", {
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
      color: "var(--text-3)",
      flex: 1,
      minWidth: 100
    }
  }, locked ? "เอกสารถูกล็อกแล้ว" : "บันทึกอัตโนมัติ ไม่ต้องกดเซฟ"), React.createElement("button", {
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
  }), " \u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49\u0E2B\u0E31\u0E27\u0E2B\u0E19\u0E49\u0E32"), canApprove && form.status === "sent" && React.createElement("button", {
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
      color: "#2C6B48",
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
      background: "#22A35B"
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
function DailyPaper({
  job,
  rec,
  date,
  allDates,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const {
    photos
  } = window.useDailyPhotos(job.id, date);
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
    document.title = "รายงานประจำวัน " + (job.code || "") + " " + date;
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
    title: title
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
  }, c.th)))), React.createElement("tbody", null, rows.map((r, i) => React.createElement("tr", {
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
      flex: 1,
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
  }, photos.length, " \u0E23\u0E39\u0E1B \xB7 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 \u201C\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1B\u0E47\u0E19 PDF\u201D")), React.createElement("button", {
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
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), React.createElement("div", {
    className: "sv-rep-paper",
    style: {
      maxWidth: 900,
      margin: "0 auto",
      background: "#fff",
      color: "#15211A",
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
      borderBottom: "2px solid #22A35B",
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
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: ".12em",
      color: "#7A8A81",
      marginTop: 3
    }
  }, "PROJECT INSTALLATION \u2014 DAILY REPORT"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "#2C6B48",
      marginTop: 5
    }
  }, "PHITHAN GREEN")), React.createElement("div", {
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
  }, docNo), React.createElement("div", null, window.drDateTH(date, true)), React.createElement("div", {
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
  }, st.th))), React.createElement("div", {
    style: {
      marginTop: 13,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto 1fr",
      border: "1px solid #DCE4DF",
      borderRadius: 7,
      overflow: "hidden"
    }
  }, React.createElement(DrPRow, {
    k: "\u0E0A\u0E37\u0E48\u0E2D\u0E07\u0E32\u0E19",
    v: job.name
  }), React.createElement(DrPRow, {
    k: "\u0E23\u0E2B\u0E31\u0E2A\u0E07\u0E32\u0E19",
    v: job.code
  }), React.createElement(DrPRow, {
    k: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17",
    v: isProject ? "งานโครงการ" : "งานบ้าน"
  }), React.createElement(DrPRow, {
    k: "\u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07",
    v: (job.kw ? job.kw + " kW" : "") + (job.panels ? " · " + job.panels + " แผง" : "")
  }), React.createElement(DrPRow, {
    k: "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48",
    v: [job.address, job.province].filter(Boolean).join(" · ")
  }), React.createElement(DrPRow, {
    k: "\u0E17\u0E35\u0E21\u0E0A\u0E48\u0E32\u0E07",
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
  }, "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E37\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E23\u0E27\u0E21"), React.createElement("div", {
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
      background: "#22A35B"
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
  }, "\u0E08\u0E32\u0E01\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E19 ", rec.prevPct, "%")), (wAm || wPm) && React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 11,
      color: "#4A5A51"
    }
  }, "\u0E2A\u0E20\u0E32\u0E1E\u0E2D\u0E32\u0E01\u0E32\u0E28 \xB7 \u0E40\u0E0A\u0E49\u0E32 ", React.createElement("b", {
    style: {
      color: "#15211A"
    }
  }, wAm ? wAm.th : "-"), " \xB7 \u0E1A\u0E48\u0E32\u0E22 ", React.createElement("b", {
    style: {
      color: "#15211A"
    }
  }, wPm ? wPm.th : "-"))), !!steps.length && React.createElement(DrPBlock, {
    title: isProject ? "ความคืบหน้าตามขั้นงาน" : "เนื้องานติดตั้งที่เดินไปแล้ว"
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      width: 38
    })
  }, "\u0E02\u0E31\u0E49\u0E19"), React.createElement("th", {
    style: th
  }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E07\u0E32\u0E19"), isProject && React.createElement("th", {
    style: th
  }, "\u0E41\u0E1C\u0E19 \u0E40\u0E23\u0E34\u0E48\u0E21"), isProject && React.createElement("th", {
    style: th
  }, "\u0E41\u0E1C\u0E19 \u0E08\u0E1A"), isProject && React.createElement("th", {
    style: th
  }, "\u0E08\u0E23\u0E34\u0E07 \u0E40\u0E23\u0E34\u0E48\u0E21"), isProject && React.createElement("th", {
    style: th
  }, "\u0E08\u0E23\u0E34\u0E07 \u0E08\u0E1A"), !isProject && React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 78
    })
  }, "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right",
      width: 66
    })
  }, "\u0E17\u0E33\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27"))), React.createElement("tbody", null, steps.map((r, i) => React.createElement("tr", {
    key: i,
    style: {
      background: r.head ? "#F3F7F4" : "transparent"
    }
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontWeight: r.head ? 800 : 400,
      color: r.head ? "#2C6B48" : "#7A8A81"
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
  }, r.planStart ? window.drShort(r.planStart) : "—"), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.planEnd ? window.drShort(r.planEnd) : "—"), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.actStart ? window.drShort(r.actStart) : "—"), isProject && React.createElement("td", {
    style: Object.assign({}, td, {
      fontFamily: "var(--mono)",
      fontSize: 10
    })
  }, r.actEnd ? window.drShort(r.actEnd) : "—"), !isProject && React.createElement("td", {
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
    title: "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E33\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
    avoid: true
  }, drPara(rec.work)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18
    }
  }, React.createElement(DrPBlock, {
    title: "\u0E1B\u0E31\u0E0D\u0E2B\u0E32 / \u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04",
    avoid: true
  }, drPara(rec.problem)), React.createElement(DrPBlock, {
    title: "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E15\u0E48\u0E2D",
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
    title: "\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22 & \u0E2A\u0E34\u0E48\u0E07\u0E41\u0E27\u0E14\u0E25\u0E49\u0E2D\u0E21",
    avoid: true
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#15211A",
      lineHeight: 1.9
    }
  }, React.createElement("div", null, "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07 (JSA): ", React.createElement("b", null, jsa ? jsa.th + " (" + jsa.range + ")" : "—")), React.createElement("div", null, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E17\u0E33\u0E07\u0E32\u0E19\u0E40\u0E22\u0E47\u0E19: ", React.createElement("b", null, rec.permitCold === "yes" ? "มี" : rec.permitCold === "no" ? "ไม่มี" : "—"), "  ·  ", "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E17\u0E33\u0E07\u0E32\u0E19\u0E23\u0E49\u0E2D\u0E19: ", React.createElement("b", null, rec.permitHot === "yes" ? "มี" : rec.permitHot === "no" ? "ไม่มี" : "—")), React.createElement("div", null, "\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48: ", React.createElement("b", null, (window.DR_CLEAN || []).filter(c => (rec.clean || {})[c.key]).map(c => c.th).join(" · ") || "—"))), !!(rec.certs || []).length && React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 8
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: th
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07"), React.createElement("th", {
    style: th
  }, "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"))), React.createElement("tbody", null, rec.certs.map((c, i) => React.createElement("tr", {
    key: i
  }, React.createElement("td", {
    style: td
  }, c.name || "-"), React.createElement("td", {
    style: td
  }, c.by || "-"))))))), !!photos.length && React.createElement(DrPBlock, {
    title: "รูปหน้างาน (" + photos.length + " รูป)"
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
      color: "#2C6B48"
    }
  }, "\u0E23\u0E39\u0E1B\u0E17\u0E35\u0E48 ", i + 1), p.cap ? " · " + p.cap : ""))))), React.createElement("div", {
    style: {
      marginTop: 22,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
      breakInside: "avoid"
    }
  }, [{
    t: "ผู้บันทึก (ช่างหน้างาน)",
    n: rec.byName,
    d: rec.sentAt || rec.updatedAt || rec.createdAt
  }, {
    t: "ผู้อนุมัติ (หัวหน้างาน)",
    n: rec.appName,
    d: rec.approvedAt
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
      marginTop: 6
    }
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      marginTop: 6,
      color: "#15211A"
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D: ", React.createElement("b", null, s.n || "-")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5A51"
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ", s.d ? window.drDateTH(String(s.d).slice(0, 10)) : "-")))), React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 9.5,
      color: "#8A9A91",
      textAlign: "center"
    }
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 PHITHAN GREEN \xB7 ", docNo, " \xB7 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E21\u0E37\u0E48\u0E2D ", window.drDateTH(window.drToday()))));
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
    return React.createElement("button", {
      key: r.job.id,
      onClick: () => onOpen(r.job),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: isMobile ? "11px 12px" : "13px 16px",
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
    }, s.th));
  })));
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
  DailyJobButton
});