function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  required,
  children,
  span
}) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  const gc = span === true ? "1 / -1" : typeof span === "number" ? mob ? "1 / -1" : "span " + span : "auto";
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      gridColumn: gc
    }
  }, React.createElement("label", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, label, required && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), children);
}
const inputStyle = {
  background: "var(--surface2)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-1)",
  fontFamily: "inherit",
  fontSize: 13.5,
  padding: "9px 11px",
  borderRadius: 10,
  outline: "none",
  width: "100%"
};
function useFormMobile(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = e => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}
function JobForm({
  initial,
  isNew,
  onSave,
  onClose,
  onManageTechs,
  onManageBrands,
  jobs
}) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => JSON.parse(JSON.stringify(initial)));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const setMat = (k, v) => setF(p => Object.assign({}, p, {
    mat: Object.assign({}, p.mat, {
      [k]: v
    })
  }));
  const setStageField = (k, which, v) => setF(p => {
    const prev = p.stageDates && p.stageDates[k];
    const cur = prev && typeof prev === "object" ? prev : {
      start: "",
      end: typeof prev === "string" ? prev : ""
    };
    return Object.assign({}, p, {
      stageDates: Object.assign({}, p.stageDates, {
        [k]: Object.assign({}, cur, {
          [which]: v
        })
      })
    });
  });
  const stageVal = k => {
    const v = f.stageDates && f.stageDates[k];
    if (!v) return {
      start: "",
      end: ""
    };
    if (typeof v === "object") return {
      start: v.start || "",
      end: v.end || ""
    };
    return {
      start: "",
      end: v
    };
  };
  const installDate = SF.installDate ? SF.installDate(f) : "";
  const installEnd = SF.installEnd ? SF.installEnd(f) : installDate;
  const setInstall = (start, end) => setF(p => Object.assign({}, p, {
    stageDates: Object.assign({}, p.stageDates, {
      install: {
        start: start,
        end: end
      }
    })
  }));
  const setInstallStart = v => setInstall(v, installEnd && installEnd >= v ? installEnd : v);
  const setInstallEnd = v => setInstall(installDate || v, v && installDate && v < installDate ? installDate : v);
  const setCurStage = k => set("stage", k);
  const setStageEnd = (k, idx, v) => setF(p => {
    const stages = SF.STAGES;
    const prev = p.stageDates && p.stageDates[k];
    const cur = prev && typeof prev === "object" ? prev : {
      start: "",
      end: typeof prev === "string" ? prev : ""
    };
    const sd = Object.assign({}, p.stageDates, {
      [k]: Object.assign({}, cur, {
        end: v
      })
    });
    const nx = stages[idx + 1];
    if (nx && v) {
      const nv = sd[nx.key];
      const ncur = nv && typeof nv === "object" ? nv : {
        start: "",
        end: typeof nv === "string" ? nv : ""
      };
      if (!ncur.start) sd[nx.key] = Object.assign({}, ncur, {
        start: v
      });
    }
    return Object.assign({}, p, {
      stageDates: sd
    });
  });
  const brandInfo = (SF.BRAND_BY_NAME || {})[f.brand];
  const noBattery = brandInfo ? !brandInfo.battery : false;
  const isMobile = useFormMobile();
  const _addDayYmd = (k, n) => {
    const d = new Date(k + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  const techNick = SF.TECH_BY_ID && SF.TECH_BY_ID[f.tech] ? SF.TECH_BY_ID[f.tech].nick || SF.TECH_BY_ID[f.tech].name : "";
  const otherTasksByDay = React.useMemo(() => {
    const map = {};
    if (!f.tech) return map;
    (jobs || []).forEach(j => {
      if (j.id === f.id || j.tech !== f.tech || j.stage === "done") return;
      const s = SF.installDate ? SF.installDate(j) : "";
      if (!s) return;
      const e = SF.installEnd ? SF.installEnd(j) : s;
      let day = s,
        g = 0;
      while (g < 120) {
        (map[day] = map[day] || []).push(j);
        if (day === e) break;
        day = _addDayYmd(day, 1);
        g++;
      }
    });
    return map;
  }, [jobs, f.tech, f.id]);
  const loadInSpan = (start, end) => {
    if (!f.tech || !start) return [];
    let s = start.slice(0, 10),
      e = (end || start).slice(0, 10);
    if (e < s) e = s;
    const seen = {};
    const out = [];
    let day = s,
      g = 0;
    while (g < 120) {
      (otherTasksByDay[day] || []).forEach(j => {
        if (!seen[j.id]) {
          seen[j.id] = 1;
          out.push(j);
        }
      });
      if (day === e) break;
      day = _addDayYmd(day, 1);
      g++;
    }
    return out;
  };
  const otherCountByDay = React.useMemo(() => {
    const m = {};
    Object.keys(otherTasksByDay).forEach(day => {
      const seen = {};
      let n = 0;
      otherTasksByDay[day].forEach(j => {
        if (!seen[j.id]) {
          seen[j.id] = 1;
          n++;
        }
      });
      m[day] = n;
    });
    return m;
  }, [otherTasksByDay]);
  const thisJobDays = React.useMemo(() => {
    const set = {};
    if (!installDate) return set;
    let day = installDate,
      g = 0;
    const e = installEnd || installDate;
    while (g < 120) {
      set[day] = 1;
      if (day === e) break;
      day = _addDayYmd(day, 1);
      g++;
    }
    return set;
  }, [installDate, installEnd]);
  const [flowMonth, setFlowMonth] = React.useState(() => {
    const base = new Date((installDate || window.SF.TODAY || "2026-06-15") + "T00:00:00");
    return {
      y: base.getFullYear(),
      m: base.getMonth()
    };
  });
  const FLOW_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  React.useEffect(() => {
    if (noBattery && f.battery) {
      set("battery", false);
      set("batSize", "ไม่มี");
    }
  }, [f.brand]);
  const save = () => {
    if (!f.name.trim()) {
      alert("กรุณากรอกชื่อลูกค้า");
      return;
    }
    const rec = Object.assign({}, f);
    if (!rec.battery) {
      rec.batSize = "ไม่มี";
      rec.mat = Object.assign({}, rec.mat, {
        battery: "na"
      });
    }
    if (!rec.backup) rec.mat = Object.assign({}, rec.mat, {
      backup: rec.mat.backup === "na" ? "na" : rec.battery ? rec.mat.backup : "na"
    });
    if (!rec.birdnet) rec.mat = Object.assign({}, rec.mat, {
      birdnet: "na"
    });
    onSave(rec);
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.4)",
      backdropFilter: "blur(3px)",
      zIndex: 100,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 20,
      width: isMobile ? "100%" : "min(820px, 100%)",
      maxHeight: isMobile ? "94dvh" : "92dvh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 24px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: isNew ? "plus" : "settings",
    size: 19,
    color: "var(--primary-dark)"
  })), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, isNew ? "เพิ่มงานติดตั้งใหม่" : "แก้ไขข้อมูลงาน"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, f.code))), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 17
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: isMobile ? 14 : 24,
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 14 : 18
    }
  }, React.createElement(Section, {
    title: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    icon: "user"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
      gap: isMobile ? 12 : 14
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    required: true
  }, React.createElement("input", {
    style: inputStyle,
    value: f.name,
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E04\u0E38\u0E13..."
  })), React.createElement(Field, {
    label: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.phone,
    onChange: e => set("phone", e.target.value),
    placeholder: "08x-xxx-xxxx"
  })), React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19"
  }, React.createElement(Dropdown, {
    value: f.type,
    onChange: v => set("type", v),
    options: SF.TYPES.map(t => ({
      value: t.key,
      label: t.th
    }))
  })), React.createElement(Field, {
    label: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48",
    span: 2
  }, React.createElement("input", {
    style: inputStyle,
    value: f.address,
    onChange: e => set("address", e.target.value)
  })), React.createElement(Field, {
    label: "\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.province,
    onChange: e => set("province", e.target.value)
  })), React.createElement(Field, {
    label: "\u0E25\u0E34\u0E07\u0E01\u0E4C Google Maps",
    span: true
  }, React.createElement("input", {
    style: inputStyle,
    value: f.map,
    onChange: e => set("map", e.target.value),
    placeholder: "https://maps.app.goo.gl/..."
  })), React.createElement(Field, {
    label: "\u0E25\u0E34\u0E07\u0E01\u0E4C Trello (\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E07\u0E32\u0E19)",
    span: true
  }, React.createElement("input", {
    style: inputStyle,
    value: f.trello || "",
    onChange: e => set("trello", e.target.value.trim()),
    placeholder: "https://trello.com/c/..."
  })), React.createElement(Field, {
    label: "\u0E17\u0E35\u0E21\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.contractor || "",
    onChange: e => set("contractor", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E17\u0E35\u0E21\u0E0A\u0E48\u0E32\u0E07\u0E2A\u0E21\u0E28\u0E31\u0E01\u0E14\u0E34\u0E4C"
  })), React.createElement(Field, {
    label: "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 (\u0E1A\u0E32\u0E17)"
  }, React.createElement("input", {
    style: inputStyle,
    type: "number",
    min: "0",
    inputMode: "numeric",
    value: f.laborCost == null ? "" : f.laborCost,
    onChange: e => set("laborCost", e.target.value === "" ? null : Number(e.target.value)),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 15000"
  })), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E48\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, SF.TECHS.map(t => {
    const sel = f.tech === t.id;
    return React.createElement("button", {
      type: "button",
      key: t.id,
      onClick: () => set("tech", t.id),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 13px 7px 7px",
        borderRadius: 99,
        border: "1.5px solid " + (sel ? t.color : "var(--border-strong)"),
        background: sel ? t.color + "14" : "var(--surface2)",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all .14s"
      }
    }, React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: 99,
        background: t.color,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: 11,
        flexShrink: 0
      }
    }, t.nick.slice(0, 2)), React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.2,
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: sel ? "var(--text-1)" : "var(--text-2)",
        whiteSpace: "nowrap"
      }
    }, t.name), React.createElement("span", {
      style: {
        fontSize: 10,
        color: "var(--text-3)",
        whiteSpace: "nowrap"
      }
    }, t.role)), sel && React.createElement(Icon, {
      name: "check",
      size: 14,
      color: t.color,
      sw: 2.6,
      style: {
        marginLeft: 2
      }
    }));
  }), React.createElement("button", {
    type: "button",
    onClick: onManageTechs,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 14px",
      borderRadius: 99,
      border: "1.5px dashed var(--border-strong)",
      background: "transparent",
      cursor: "pointer",
      fontFamily: "inherit",
      color: "var(--text-2)",
      fontSize: 12.5,
      fontWeight: 600
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 15,
    color: "var(--text-2)"
  }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E0A\u0E48\u0E32\u0E07")))))), React.createElement(Section, {
    title: "\u0E2A\u0E40\u0E1B\u0E01\u0E23\u0E30\u0E1A\u0E1A",
    icon: "sun"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
      gap: isMobile ? 12 : 14
    }
  }, React.createElement(Field, {
    label: "\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C / \u0E23\u0E38\u0E48\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07",
    span: isMobile ? 2 : undefined
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, React.createElement(Dropdown, {
    value: f.brand,
    onChange: v => set("brand", v),
    options: SF.BRANDS.map(b => ({
      value: b,
      label: b
    })),
    style: {
      flex: 1,
      minWidth: 0
    }
  }), React.createElement("button", {
    type: "button",
    onClick: onManageBrands,
    title: "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C / \u0E23\u0E38\u0E48\u0E19",
    style: {
      flexShrink: 0,
      width: 38,
      height: 38,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 16,
    color: "var(--text-2)"
  })))), React.createElement(Field, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E23\u0E30\u0E1A\u0E1A (kW)"
  }, React.createElement("input", {
    type: "number",
    step: "0.1",
    style: inputStyle,
    value: f.kw,
    onChange: e => set("kw", parseFloat(e.target.value) || 0)
  })), React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.panels,
    onChange: e => set("panels", parseInt(e.target.value) || 0)
  })), React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32"
  }, React.createElement(Dropdown, {
    value: f.phase || "1",
    onChange: v => set("phase", v),
    options: [{
      value: "1",
      label: "1 เฟส"
    }, {
      value: "3",
      label: "3 เฟส"
    }]
  })), React.createElement(Field, {
    label: "\u0E15\u0E32\u0E02\u0E48\u0E32\u0E22\u0E01\u0E31\u0E19\u0E19\u0E01"
  }, React.createElement(ToggleField, {
    on: f.birdnet,
    onChange: v => set("birdnet", v),
    labelOn: "\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07",
    labelOff: "\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14"
  })), (f.brand || "").toUpperCase().includes("ATMOCE") && React.createElement(Field, {
    label: "\u0E15\u0E39\u0E49 Combiner"
  }, React.createElement(Dropdown, {
    value: f.comboType || "ready",
    onChange: v => set("comboType", v),
    options: [{
      value: "ready",
      label: "ตู้สำเร็จ"
    }, {
      value: "assembled",
      label: "ตู้ประกอบ"
    }]
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
      gap: isMobile ? 12 : 14,
      marginTop: isMobile ? 12 : 14,
      opacity: noBattery ? 0.45 : 1,
      pointerEvents: noBattery ? "none" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48"
  }, React.createElement(ToggleField, {
    on: f.battery,
    onChange: v => set("battery", v),
    labelOn: "\u0E21\u0E35\u0E41\u0E1A\u0E15",
    labelOff: "\u0E44\u0E21\u0E48\u0E21\u0E35"
  })), React.createElement(Field, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E41\u0E1A\u0E15"
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("input", {
    type: "number",
    min: "0",
    step: "0.5",
    style: Object.assign({}, inputStyle, {
      flex: 1,
      minWidth: 0
    }),
    value: f.battery ? parseFloat(f.batSize) || "" : "",
    onChange: e => set("batSize", e.target.value ? (parseFloat(e.target.value) || 0) + " kWh" : "ไม่มี"),
    disabled: !f.battery,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, "kWh"))), React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A / \u0E2D\u0E2D\u0E1F\u0E15\u0E34\u0E44\u0E21\u0E40\u0E0B\u0E2D\u0E23\u0E4C"
  }, React.createElement(Dropdown, {
    value: f.connect,
    onChange: v => set("connect", v),
    options: ["-", "ต่อ 1:1", "ต่อ 1:2"].map(s => ({
      value: s,
      label: s
    }))
  })), React.createElement(Field, {
    label: "\u0E23\u0E30\u0E1A\u0E1A Backup"
  }, React.createElement(ToggleField, {
    on: f.backup,
    onChange: v => set("backup", v),
    labelOn: "\u0E21\u0E35",
    labelOff: "\u0E44\u0E21\u0E48\u0E21\u0E35"
  }))), noBattery && React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 12,
      color: "var(--text-3)",
      fontStyle: "italic"
    }
  }, "* \u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C ", f.brand, " \u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48/Backup \u2014 \u0E1B\u0E23\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 \u201C\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C\u201D")), React.createElement(Section, {
    title: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E27\u0E31\u0E2A\u0E14\u0E38",
    icon: "box"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, SF.MATERIALS.map(m => React.createElement(Field, {
    key: m.key,
    label: m.th
  }, React.createElement(Dropdown, {
    value: f.mat[m.key],
    onChange: v => setMat(m.key, v),
    options: Object.entries(SF.MAT_STATUS).map(([k, v]) => ({
      value: k,
      label: v.icon + " " + v.th
    }))
  }))))), React.createElement(Section, {
    title: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E07\u0E32\u0E19 & \u0E1B\u0E31\u0E0D\u0E2B\u0E32",
    icon: "flow"
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: isMobile ? 12 : 14
    }
  }, React.createElement(Field, {
    label: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19",
    span: true
  }, React.createElement(Dropdown, {
    value: f.stage,
    onChange: v => set("stage", v),
    options: SF.STAGES.map((s, i) => ({
      value: s.key,
      label: i + 1 + ". " + s.th
    }))
  })), React.createElement(Field, {
    label: "\u0E1B\u0E31\u0E0D\u0E2B\u0E32 / \u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14 (\u0E16\u0E49\u0E32\u0E21\u0E35)",
    span: true
  }, React.createElement("input", {
    style: inputStyle,
    value: f.problem || "",
    onChange: e => set("problem", e.target.value || null),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E23\u0E2D\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E02\u0E2D\u0E07\u0E02\u0E32\u0E14\u0E2A\u0E15\u0E47\u0E2D\u0E01..."
  })), React.createElement(Field, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    span: true
  }, React.createElement("textarea", {
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      minHeight: 56
    }),
    value: f.note,
    onChange: e => set("note", e.target.value)
  })))), React.createElement(Section, {
    title: "\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E07\u0E32\u0E19 & \u0E27\u0E31\u0E19\u0E19\u0E31\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07",
    icon: "calendar"
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "\u0E41\u0E15\u0E30\u0E17\u0E35\u0E48\u0E02\u0E31\u0E49\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32", React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E07\u0E32\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E02\u0E31\u0E49\u0E19\u0E44\u0E2B\u0E19"), " \u2014 \u0E02\u0E31\u0E49\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E30\u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      marginBottom: 4
    }
  }, (() => {
    const curIdx = SF.STAGE_INDEX[f.stage] != null ? SF.STAGE_INDEX[f.stage] : 0;
    return SF.STAGES.map((s, i) => {
      const isLast = i === SF.STAGES.length - 1;
      const passed = i < curIdx;
      const current = i === curIdx;
      const filled = passed || current;
      return React.createElement("button", {
        key: s.key,
        type: "button",
        onClick: () => setCurStage(s.key),
        style: {
          display: "flex",
          gap: 12,
          alignItems: "stretch",
          background: "none",
          border: "none",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          fontFamily: "inherit"
        }
      }, React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: 28
        }
      }, React.createElement("span", {
        style: {
          width: 28,
          height: 28,
          borderRadius: 99,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 12.5,
          fontWeight: 800,
          background: filled ? s.color : "var(--surface2)",
          border: "2px solid " + (filled ? s.color : "var(--border-strong)"),
          color: filled ? "#fff" : "var(--text-3)",
          boxShadow: current ? "0 0 0 4px " + (s.soft || "var(--primary-soft)") : "none",
          transition: "all .15s"
        }
      }, passed ? React.createElement(Icon, {
        name: "check",
        size: 14,
        color: "#fff",
        sw: 3
      }) : i + 1), !isLast && React.createElement("span", {
        style: {
          flex: 1,
          width: 2,
          minHeight: 18,
          background: passed ? s.color : "var(--border)",
          margin: "3px 0"
        }
      })), React.createElement("div", {
        style: {
          flex: 1,
          paddingBottom: isLast ? 2 : 16,
          paddingTop: 3,
          minWidth: 0
        }
      }, React.createElement("span", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 13.5,
          fontWeight: current ? 800 : 600,
          color: current ? "var(--text-1)" : passed ? "var(--text-2)" : "var(--text-3)"
        }
      }, s.th, " ", React.createElement("span", {
        style: {
          fontWeight: 400,
          color: "var(--text-3)",
          fontFamily: "var(--mono)",
          fontSize: 11
        }
      }, s.en), current && React.createElement("span", {
        style: {
          marginLeft: "auto",
          fontSize: 10.5,
          fontWeight: 800,
          color: s.color,
          background: s.soft || "var(--primary-soft)",
          padding: "2px 9px",
          borderRadius: 99,
          flexShrink: 0
        }
      }, "\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49"), passed && React.createElement("span", {
        style: {
          marginLeft: "auto",
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--text-3)",
          flexShrink: 0
        }
      }, "\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27"))));
    });
  })()), React.createElement("div", {
    style: {
      borderTop: "1px dashed var(--border)",
      marginTop: 6,
      paddingTop: 16
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginBottom: 10,
      lineHeight: 1.5
    }
  }, "\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E32\u0E22\u0E27\u0E31\u0E19 \u0E43\u0E2A\u0E48", React.createElement("b", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0E27\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u2013\u0E27\u0E31\u0E19\u0E40\u0E2A\u0E23\u0E47\u0E08"), "\u0E44\u0E14\u0E49 \xB7 \u0E16\u0E49\u0E32\u0E27\u0E31\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E43\u0E2A\u0E48\u0E41\u0E04\u0E48\u0E27\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, React.createElement("input", {
    type: "date",
    style: inputStyle,
    value: installDate,
    max: installEnd || undefined,
    onChange: e => setInstallStart(e.target.value)
  })), React.createElement(Field, {
    label: "\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, React.createElement("input", {
    type: "date",
    style: Object.assign({}, inputStyle, installDate ? null : {
      opacity: .5,
      cursor: "not-allowed"
    }),
    disabled: !installDate,
    min: installDate || undefined,
    value: installEnd,
    onChange: e => setInstallEnd(e.target.value)
  }))), installDate && f.tech && (() => {
    const days = Object.keys(thisJobDays);
    const clash = days.reduce((n, d) => n + (otherCountByDay[d] || 0), 0);
    if (!clash) return null;
    return React.createElement("div", {
      style: {
        marginTop: 8,
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--tint-amber-tx)",
        background: "var(--tint-amber-bg2)",
        border: "1px solid #FCD34D",
        borderRadius: 8,
        padding: "7px 10px",
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement(Icon, {
      name: "alert",
      size: 13,
      color: "var(--tint-amber-tx)"
    }), " \u0E0A\u0E48\u0E32\u0E07", techNick, " \u0E21\u0E35\u0E07\u0E32\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E19\u0E35\u0E49 ", clash, " \u0E07\u0E32\u0E19 \u2014 \u0E40\u0E0A\u0E47\u0E01\u0E27\u0E48\u0E32\u0E0B\u0E49\u0E2D\u0E19\u0E01\u0E31\u0E19\u0E44\u0E2B\u0E21");
  })()), f.tech && (() => {
    const fm = flowMonth;
    const fFirst = new Date(fm.y, fm.m, 1).getDay();
    const fDays = new Date(fm.y, fm.m + 1, 0).getDate();
    const fCells = [];
    for (let i = 0; i < fFirst; i++) fCells.push(null);
    for (let d = 1; d <= fDays; d++) fCells.push(d);
    const fKey = d => fm.y + "-" + String(fm.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const fShift = delta => setFlowMonth(s => {
      const n = new Date(s.y, s.m + delta, 1);
      return {
        y: n.getFullYear(),
        m: n.getMonth()
      };
    });
    const navB = {
      width: 26,
      height: 26,
      borderRadius: 7,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    };
    return React.createElement("div", {
      style: {
        marginTop: 14,
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 12,
        background: "var(--surface2)"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--text-1)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0
      }
    }, React.createElement(Icon, {
      name: "calendar",
      size: 13,
      color: "var(--primary)"
    }), React.createElement("span", {
      style: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, "\u0E1B\u0E0F\u0E34\u0E17\u0E34\u0E19\u0E07\u0E32\u0E19\u0E0A\u0E48\u0E32\u0E07", techNick ? " " + techNick : "", " \xB7 ", FLOW_MONTHS[fm.m], " ", fm.y + 543)), React.createElement("span", {
      style: {
        display: "flex",
        gap: 6,
        flexShrink: 0
      }
    }, React.createElement("button", {
      type: "button",
      onClick: () => fShift(-1),
      style: navB
    }, React.createElement(Icon, {
      name: "chevronRight",
      size: 14,
      color: "var(--text-2)",
      style: {
        transform: "scaleX(-1)"
      }
    })), React.createElement("button", {
      type: "button",
      onClick: () => fShift(1),
      style: navB
    }, React.createElement(Icon, {
      name: "chevronRight",
      size: 14,
      color: "var(--text-2)"
    })))), React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(7,1fr)",
        gap: 3
      }
    }, window.TH_DAYS.map((d, i) => React.createElement("div", {
      key: d,
      style: {
        textAlign: "center",
        fontSize: 9.5,
        fontWeight: 700,
        color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)"
      }
    }, d)), fCells.map((d, i) => {
      if (d === null) return React.createElement("div", {
        key: i
      });
      const k = fKey(d);
      const cnt = otherCountByDay[k] || 0;
      const mine = !!thisJobDays[k];
      const isToday = k === window.SF.TODAY;
      let bg = "var(--surface)",
        col = "var(--text-2)",
        bd = "1px solid var(--border)";
      if (mine) {
        bg = "var(--primary-soft)";
        col = "var(--primary-dark)";
        bd = "1px solid var(--primary)";
      } else if (cnt >= 2) {
        bg = "var(--tint-red-bg2)";
        col = "var(--tint-red-tx)";
        bd = "1px solid #FCA5A5";
      } else if (cnt === 1) {
        bg = "var(--tint-amber-bg2)";
        col = "var(--tint-amber-tx)";
        bd = "1px solid #FCD34D";
      }
      return React.createElement("button", {
        type: "button",
        key: i,
        onClick: () => setInstallStart(k),
        title: (mine ? "วันนัดติดตั้งงานนี้" : cnt ? "ช่างมี " + cnt + " งาน" : "ว่าง") + " · " + d + " " + FLOW_MONTHS[fm.m] + " — แตะเพื่อเลือกวันเริ่มติดตั้ง",
        style: {
          minHeight: 30,
          borderRadius: 7,
          border: isToday && !mine ? "1.5px solid var(--primary)" : bd,
          background: bg,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1
        }
      }, React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: isToday ? 800 : 600,
          color: col
        }
      }, d), !mine && cnt > 0 && React.createElement("span", {
        style: {
          fontSize: 8,
          fontWeight: 700,
          color: col,
          lineHeight: 1
        }
      }, cnt, " \u0E07\u0E32\u0E19"), mine && React.createElement("span", {
        style: {
          width: 5,
          height: 5,
          borderRadius: 99,
          background: "var(--primary)"
        }
      }));
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        marginTop: 9,
        flexWrap: "wrap",
        fontSize: 10,
        color: "var(--text-3)"
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4
      }
    }, React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        border: "1px solid var(--border)",
        background: "var(--surface)"
      }
    }), " \u0E27\u0E48\u0E32\u0E07"), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4
      }
    }, React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        background: "var(--tint-amber-bg2)",
        border: "1px solid #FCD34D"
      }
    }), " \u0E21\u0E35 1 \u0E07\u0E32\u0E19"), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4
      }
    }, React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        background: "var(--tint-red-bg2)",
        border: "1px solid #FCA5A5"
      }
    }), " 2+ \u0E07\u0E32\u0E19"), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4
      }
    }, React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        background: "var(--primary-soft)",
        border: "1px solid var(--primary)"
      }
    }), " \u0E27\u0E31\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49")));
  })())), React.createElement("div", {
    style: {
      padding: isMobile ? "14px 16px calc(14px + env(safe-area-inset-bottom, 0px))" : "16px 24px calc(16px + env(safe-area-inset-bottom, 0px))",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      flex: isMobile ? "0 0 auto" : "none",
      padding: "11px 20px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: save,
    style: {
      flex: isMobile ? 1 : "none",
      padding: "11px 24px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#fff",
    sw: 2.5
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"))));
}
function Section({
  title,
  icon,
  right,
  children
}) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: mob ? 14 : 18
    }
  }, React.createElement("div", {
    style: {
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".06em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 14,
    color: "var(--primary)"
  }), " ", title), right), children);
}
function ToggleField({
  on,
  onChange,
  labelOn,
  labelOff
}) {
  return React.createElement("button", {
    onClick: () => onChange(!on),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "8px 11px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      cursor: "pointer",
      fontFamily: "inherit",
      height: 38
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 22,
      borderRadius: 99,
      background: on ? "var(--primary)" : "var(--surface3)",
      position: "relative",
      transition: "background .2s",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: on ? 19 : 3,
      width: 16,
      height: 16,
      borderRadius: 99,
      background: "#fff",
      transition: "left .2s",
      boxShadow: "0 1px 3px rgba(0,0,0,.2)"
    }
  })), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: on ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, on ? labelOn : labelOff));
}
Object.assign(window, {
  JobForm,
  TechManager,
  BrandManager
});
function TechManager({
  store,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const techs = store.techs;
  const [editing, setEditing] = React.useState(null);
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 110,
      display: "grid",
      placeItems: "center",
      padding: 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: 20,
      width: "min(560px,100%)",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "users",
    size: 19,
    color: "var(--primary-dark)"
  })), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E17\u0E35\u0E21\u0E0A\u0E48\u0E32\u0E07"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, techs.length, " \u0E04\u0E19 \xB7 \u0E40\u0E1E\u0E34\u0E48\u0E21 / \u0E41\u0E01\u0E49\u0E44\u0E02 / \u0E25\u0E1A \u0E44\u0E14\u0E49"))), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 17
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, techs.map(t => React.createElement("div", {
    key: t.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 13px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 99,
      background: t.color,
      color: "#fff",
      display: "grid",
      placeItems: "center",
      fontWeight: 700,
      fontSize: 13,
      flexShrink: 0
    }
  }, t.nick.slice(0, 2) || "?"), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--text-1)"
    }
  }, t.name || "(ยังไม่ระบุชื่อ)"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, t.role)), React.createElement("button", {
    onClick: () => setEditing(Object.assign({}, t)),
    title: "\u0E41\u0E01\u0E49\u0E44\u0E02",
    style: {
      background: "#3B82F614",
      border: "none",
      color: "#3B82F6",
      width: 32,
      height: 32,
      borderRadius: 8,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 15
  })), React.createElement("button", {
    onClick: () => {
      if (techs.length <= 1) {
        alert("ต้องมีช่างอย่างน้อย 1 คน");
        return;
      }
      if (confirm("ลบช่าง \"" + t.name + "\" ?")) store.remove(t.id);
    },
    title: "\u0E25\u0E1A",
    style: {
      background: "#EF444414",
      border: "none",
      color: "#EF4444",
      width: 32,
      height: 32,
      borderRadius: 8,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: () => setEditing(store.blankTech()),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 18px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "#fff",
    sw: 2.4
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E0A\u0E48\u0E32\u0E07"))), editing && React.createElement(TechEditModal, {
    initial: editing,
    colors: store.colors,
    onSave: rec => {
      store.upsert(rec);
      setEditing(null);
    },
    onClose: () => setEditing(null)
  }));
}
function TechEditModal({
  initial,
  colors,
  onSave,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const isNew = !initial.name;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.4)",
      zIndex: 120,
      display: "grid",
      placeItems: "center",
      padding: 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: 18,
      width: "min(420px,100%)",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, isNew ? "เพิ่มช่างใหม่" : "แก้ไขข้อมูลช่าง"), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))), React.createElement("div", {
    style: {
      padding: 22,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 99,
      background: f.color,
      color: "#fff",
      display: "grid",
      placeItems: "center",
      fontWeight: 800,
      fontSize: 19
    }
  }, (f.nick || f.name).slice(0, 2) || "?")), React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25",
    required: true
  }, React.createElement("input", {
    autoFocus: true,
    style: inputStyle,
    value: f.name,
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E15\u0E31\u0E49\u0E07\u0E43\u0E08"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E48\u0E19 (\u0E22\u0E48\u0E2D)"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.nick,
    onChange: e => set("nick", e.target.value),
    placeholder: "\u0E0A\u0E32\u0E22"
  })), React.createElement(Field, {
    label: "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07"
  }, React.createElement(Dropdown, {
    value: f.role,
    onChange: v => set("role", v),
    options: ["หัวหน้าทีม A", "หัวหน้าทีม B", "ช่างไฟ", "ช่างติดตั้ง", "ผู้ช่วยช่าง"].map(r => ({
      value: r,
      label: r
    }))
  }))), React.createElement(Field, {
    label: "\u0E2A\u0E35\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      flexWrap: "wrap"
    }
  }, colors.map(c => React.createElement("button", {
    type: "button",
    key: c,
    onClick: () => set("color", c),
    style: {
      width: 30,
      height: 30,
      borderRadius: 99,
      background: c,
      border: f.color === c ? "3px solid var(--text-1)" : "3px solid transparent",
      cursor: "pointer",
      boxShadow: "0 0 0 1px var(--border)"
    }
  }))))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "10px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: () => {
      if (!f.name.trim()) {
        alert("กรุณากรอกชื่อช่าง");
        return;
      }
      const rec = Object.assign({}, f);
      if (!rec.nick.trim()) rec.nick = rec.name.trim().slice(0, 2);
      onSave(rec);
    },
    style: {
      padding: "10px 22px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
function BrandManager({
  store,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const brands = store.brands;
  const [editing, setEditing] = React.useState(null);
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 110,
      display: "grid",
      placeItems: "center",
      padding: 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: 20,
      width: "min(560px,100%)",
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "sun",
    size: 19,
    color: "var(--primary-dark)"
  })), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C / \u0E23\u0E38\u0E48\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, brands.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 \u0E40\u0E1E\u0E34\u0E48\u0E21 / \u0E41\u0E01\u0E49\u0E44\u0E02 / \u0E25\u0E1A \u0E44\u0E14\u0E49"))), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 17
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 18,
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, brands.map(b => React.createElement("div", {
    key: b.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      display: "grid",
      placeItems: "center",
      color: "var(--primary-dark)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "sun",
    size: 17,
    color: "var(--primary-dark)"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, b.name), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: b.battery ? "var(--primary-dark)" : "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, b.battery ? "รองรับแบต/Backup" : "ไม่รองรับแบต/Backup")), React.createElement("button", {
    onClick: () => setEditing({
      rec: Object.assign({}, b),
      origName: b.name
    }),
    title: "\u0E41\u0E01\u0E49\u0E44\u0E02",
    style: {
      flexShrink: 0,
      background: "#3B82F614",
      border: "none",
      color: "#3B82F6",
      width: 32,
      height: 32,
      borderRadius: 8,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 15
  })), React.createElement("button", {
    onClick: () => {
      if (brands.length <= 1) {
        alert("ต้องมีแบรนด์อย่างน้อย 1 รายการ");
        return;
      }
      if (confirm("ลบแบรนด์ \"" + b.name + "\" ?\n(งานที่ใช้แบรนด์นี้อยู่จะยังคงค่าเดิมไว้)")) store.remove(b.name);
    },
    title: "\u0E25\u0E1A",
    style: {
      flexShrink: 0,
      background: "#EF444414",
      border: "none",
      color: "#EF4444",
      width: 32,
      height: 32,
      borderRadius: 8,
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: () => setEditing({
      rec: {
        name: "",
        battery: true
      },
      origName: null
    }),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "10px 18px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "#fff",
    sw: 2.4
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C / \u0E23\u0E38\u0E48\u0E19"))), editing && React.createElement(BrandEditModal, {
    initial: editing.rec,
    origName: editing.origName,
    existing: brands,
    onSave: rec => {
      store.upsert(rec, editing.origName);
      setEditing(null);
    },
    onClose: () => setEditing(null)
  }));
}
function BrandEditModal({
  initial,
  origName,
  existing,
  onSave,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const isNew = origName == null;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.4)",
      zIndex: 120,
      display: "grid",
      placeItems: "center",
      padding: 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: 18,
      width: "min(420px,100%)",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("h3", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, isNew ? "เพิ่มแบรนด์ / รุ่นใหม่" : "แก้ไขแบรนด์ / รุ่น"), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  }))), React.createElement("div", {
    style: {
      padding: 22,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C / \u0E23\u0E38\u0E48\u0E19",
    required: true
  }, React.createElement("input", {
    autoFocus: true,
    style: inputStyle,
    value: f.name,
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Deye, Growatt, SUN2000..."
  })), React.createElement(Field, {
    label: "\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48 / Backup"
  }, React.createElement(ToggleField, {
    on: f.battery,
    onChange: v => set("battery", v),
    labelOn: "\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A",
    labelOff: "\u0E44\u0E21\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A"
  }))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "10px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: () => {
      const name = f.name.trim();
      if (!name) {
        alert("กรุณากรอกชื่อแบรนด์/รุ่น");
        return;
      }
      if (existing.some(b => b.name === name && name !== origName)) {
        alert("มีแบรนด์ชื่อนี้อยู่แล้ว");
        return;
      }
      onSave(Object.assign({}, f, {
        name
      }));
    },
    style: {
      padding: "10px 22px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}