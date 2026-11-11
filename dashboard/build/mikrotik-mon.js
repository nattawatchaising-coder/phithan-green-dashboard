const MT_REG_TH = {
  kwh_imp: "kWh Import (ไฟเข้า)",
  kwh_exp: "kWh Export (ไฟออก)",
  kwh_net: "kWh Net (สุทธิ)"
};
const MT_MODEL_TH = {
  "leos-ipm310": "LEOS IPM310",
  "pm2200": "Schneider PM2200 (ผ่าน Waveshare) — ยังไม่ได้ลองเครื่องจริง",
  "none": "ไม่มีมิเตอร์"
};
const MT_TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MT_TH_MON_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
function mtThDay(ms) {
  const d = new Date((ms == null ? Date.now() : ms) + 7 * 3600e3);
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0");
}
const mtDayLabel = k => Number(k.slice(6, 8)) + " " + MT_TH_MON[Number(k.slice(4, 6)) - 1];
const mtNum = (v, d) => v == null || !isFinite(v) ? "—" : Number(v).toLocaleString("th-TH", {
  minimumFractionDigits: d || 0,
  maximumFractionDigits: d == null ? 2 : d
});
const mtRegOf = s => s && s.bill && s.bill.reg || "kwh_imp";
const mtDayKwh = (d, reg) => d && d.first && d.last && d.first[reg] != null && d.last[reg] != null ? Math.max(0, d.last[reg] - d.first[reg]) : null;
function useMtRef(path) {
  const [val, setVal] = React.useState(undefined);
  React.useEffect(() => {
    setVal(undefined);
    if (!path || !window.FBDB) return;
    const ref = window.FBDB.ref(path);
    const h = ref.on("value", s => setVal(s.val()), () => setVal(null));
    return () => ref.off("value", h);
  }, [path]);
  return val;
}
const mtCard = {
  background: "var(--surface)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "var(--r-card)",
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 10
};
function MtStat({
  label,
  value,
  unit,
  sub
}) {
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-card)",
      padding: "12px 16px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      color: "var(--text-1)"
    }
  }, value, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 5
    }
  }, unit)), sub && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, sub));
}
const MT_TONE_DOT = {
  green: "var(--tint-ok-tx)",
  amber: "var(--tint-amber-tx)",
  red: "var(--tint-red-tx)",
  gray: "var(--text-3)"
};
function MtMonRow({
  s,
  st,
  now,
  i,
  onOpen
}) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const k = window.mtState ? window.mtState(s, st, now) : {
    label: "",
    tone: "gray"
  };
  const m = st && st.meter,
    v = m && m.v || {};
  const reg = mtRegOf(s),
    today = mtThDay(now),
    mon = today.slice(0, 6);
  const dayKwh = mtDayKwh(days && days[today], reg);
  const monKeys = Object.keys(days || {}).filter(x => x.slice(0, 6) === mon);
  const monKwh = monKeys.length ? monKeys.reduce((t, x) => t + (mtDayKwh(days[x], reg) || 0), 0) : null;
  const td = {
    padding: "11px 14px",
    verticalAlign: "middle",
    background: i % 2 ? "var(--fs-zebra)" : "transparent"
  };
  const nm = Object.assign({}, td, {
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap"
  });
  const meterBad = m && !(m.modbus && m.modbus.ok);
  return React.createElement("tr", {
    className: "fs-row",
    onClick: onOpen,
    style: {
      cursor: "pointer"
    }
  }, React.createElement("td", {
    style: Object.assign({}, td, {
      maxWidth: 300
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, s.bill && s.bill.cust || s.name), meterBad && React.createElement("span", {
    title: "มิเตอร์ไม่ตอบ" + (m.error ? " — " + m.error : ""),
    style: {
      display: "flex"
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 13,
    color: "var(--tint-amber-tx)"
  }))), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      fontFamily: "var(--mono)",
      marginTop: 1
    }
  }, mtIdent(s), " \xB7 ", MT_MODEL_TH[s.meter_model || "leos-ipm310"].split(" (")[0].split(" —")[0])), React.createElement("td", {
    style: Object.assign({}, td, {
      whiteSpace: "nowrap"
    }),
    title: k.why
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 4,
      background: MT_TONE_DOT[k.tone]
    }
  }), k.label)), React.createElement("td", {
    style: Object.assign({}, nm, {
      fontWeight: 700
    })
  }, mtNum(v.kw, 1)), React.createElement("td", {
    style: Object.assign({}, nm, {
      fontWeight: 700
    })
  }, mtNum(dayKwh, 1)), React.createElement("td", {
    style: nm
  }, mtNum(monKwh, 0)), React.createElement("td", {
    style: nm
  }, mtNum(v[reg] != null ? v[reg] / 1000 : null, 2)), React.createElement("td", {
    style: Object.assign({}, td, {
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      fontSize: 12
    })
  }, st && st.at ? window.mtAgo ? window.mtAgo(now - Date.parse(st.at)) : new Date(st.at).toLocaleTimeString("th-TH") : "—"));
}
function MtMonTable({
  sites,
  status,
  now,
  onOpen
}) {
  const cols = [["ไซต์"], ["สถานะ"], ["ตอนนี้", "kW", 1], ["วันนี้", "kWh", 1], ["เดือนนี้", "kWh", 1], ["เลขมิเตอร์", "MWh", 1], ["อัปเดต"]];
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-card)",
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      fontSize: 13
    }
  }, React.createElement("thead", null, React.createElement("tr", null, cols.map(([t, u, num]) => React.createElement("th", {
    key: t,
    style: {
      padding: "12px 14px 10px",
      textAlign: num ? "right" : "left",
      fontSize: 11.5,
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: "var(--text-3)",
      boxShadow: "inset 0 -1px 0 var(--divider)"
    }
  }, t, u && React.createElement("span", {
    style: {
      fontWeight: 500,
      marginLeft: 4
    }
  }, u))))), React.createElement("tbody", null, sites.map((s, i) => React.createElement(MtMonRow, {
    key: s.n,
    s: s,
    st: status && status[s.n],
    now: now,
    i: i,
    onOpen: () => onOpen(s.n)
  })))));
}
function MtMonCard({
  s,
  st,
  now,
  picked,
  onPick
}) {
  const today = useMtRef("mtMeter/" + s.n + "/d/" + mtThDay(now));
  const k = window.mtState ? window.mtState(s, st, now) : {
    label: "",
    tone: "gray"
  };
  const m = st && st.meter;
  const v = m && m.v || {};
  const reg = mtRegOf(s);
  const kwh = mtDayKwh(today, reg);
  return React.createElement("button", {
    type: "button",
    onClick: onPick,
    style: Object.assign({}, mtCard, {
      textAlign: "left",
      cursor: "pointer",
      border: "none",
      fontFamily: "inherit",
      boxShadow: picked ? "0 0 0 2px var(--primary), var(--shadow-card)" : "var(--shadow-card)"
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      fontSize: 13
    }
  }, mtIdent(s)), React.createElement("div", {
    style: {
      flex: 1
    }
  }), window.MtPill && React.createElement(window.MtPill, {
    state: k
  })), s.bill && s.bill.cust && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      marginTop: -4
    }
  }, s.bill.cust), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      fontFamily: "var(--mono)"
    }
  }, mtNum(v.kw, 2), " ", React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "kW"))), React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      fontFamily: "var(--mono)"
    }
  }, mtNum(kwh, 1), " ", React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "kWh")))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, !m ? "ไม่ได้ตั้งมิเตอร์" : !m.modbus || !m.modbus.ok ? "มิเตอร์ไม่ตอบ" + (m.error ? " — " + m.error : "") : "V " + [v.v1, v.v2, v.v3].map(x => mtNum(x, 0)).join(" / ") + " · A " + [v.i1, v.i2, v.i3].map(x => mtNum(x, 1)).join(" / ")));
}
function MtMonDetail({
  s,
  st,
  isAdmin,
  user,
  onBack
}) {
  const [tab, setTab] = React.useState("meter");
  const opts = [{
    value: "meter",
    label: "มิเตอร์"
  }, {
    value: "bill",
    label: "บิลรายเดือน"
  }];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: onBack,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 14
  }), "\u0E17\u0E38\u0E01\u0E44\u0E0B\u0E15\u0E4C"), React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, s.bill && s.bill.cust || mtIdent(s)), React.createElement("div", {
    style: {
      flex: 1
    }
  }), window.Segmented ? React.createElement(window.Segmented, {
    value: tab,
    onChange: setTab,
    options: opts
  }) : opts.map(o => React.createElement("button", {
    key: o.value,
    className: tab === o.value ? "btn btn-pri" : "btn",
    onClick: () => setTab(o.value)
  }, o.label))), tab === "bill" ? React.createElement(MtSiteBill, {
    s: s,
    st: st,
    isAdmin: isAdmin,
    user: user
  }) : React.createElement(MtMonMeter, {
    s: s,
    st: st,
    isAdmin: isAdmin
  }));
}
function MtMonMeter({
  s,
  st,
  isAdmin
}) {
  const [day, setDay] = React.useState(mtThDay());
  const hist = useMtRef("mtMeter/" + s.n + "/h/" + day);
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const reg = mtRegOf(s);
  const v = st && st.meter && st.meter.v || {};
  const C = window.FsTrendChart;
  const dayBars = Object.keys(hist || {}).sort().map(hm => {
    const r = hist[hm] || {};
    return {
      k: hm,
      t: Number(hm.slice(0, 2)) * 60 + Number(hm.slice(2)),
      value: r.kw != null ? Math.round(r.kw * 100) / 100 : null,
      label: hm.slice(0, 2) + ":" + hm.slice(2),
      tip: [hm.slice(0, 2) + ":" + hm.slice(2) + " น."]
    };
  });
  const month = day.slice(0, 6);
  const monBars = Object.keys(days || {}).filter(k => k.slice(0, 6) === month).sort().map(k => {
    const val = mtDayKwh(days[k], reg);
    return {
      k,
      label: String(Number(k.slice(6))),
      value: val != null ? Math.round(val * 10) / 10 : null,
      tip: [mtDayLabel(k)],
      partial: k === mtThDay()
    };
  });
  const monSum = monBars.reduce((t, b) => t + (b.value || 0), 0);
  const dayIso = day.slice(0, 4) + "-" + day.slice(4, 6) + "-" + day.slice(6);
  const row = (label, vals, unit, d) => React.createElement("tr", null, React.createElement("td", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      padding: "4px 10px 4px 0",
      whiteSpace: "nowrap"
    }
  }, label), vals.map((x, i) => React.createElement("td", {
    key: i,
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 600,
      padding: "4px 12px",
      textAlign: "right"
    }
  }, mtNum(x, d))), React.createElement("td", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, unit));
  return React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      fontFamily: "var(--mono)"
    }
  }, mtIdent(s)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, MT_MODEL_TH[s.meter_model || "leos-ipm310"], " \xB7 \u0E04\u0E34\u0E14\u0E1C\u0E25\u0E34\u0E15/\u0E1A\u0E34\u0E25\u0E08\u0E32\u0E01 ", MT_REG_TH[reg]), React.createElement("div", {
    style: {
      flex: 1
    }
  }), React.createElement("input", {
    type: "date",
    value: dayIso,
    max: (() => {
      const t = mtThDay();
      return t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6);
    })(),
    onChange: e => e.target.value && setDay(e.target.value.replace(/-/g, "")),
    style: Object.assign({}, mtField, {
      width: "auto",
      padding: "6px 10px",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  })), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F ", mtDayLabel(day), " (\u0E23\u0E32\u0E22 5 \u0E19\u0E32\u0E17\u0E35)"), C ? React.createElement(C, {
    mode: "time",
    t0: 0,
    t1: 1440,
    bars: dayBars.some(b => b.value != null) ? dayBars : [],
    unit: "kW",
    height: 200,
    empty: hist === undefined ? "กำลังโหลด…" : "ยังไม่มีข้อมูลของวันนี้ — agent เก็บทุก 5 นาที"
  }) : null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "baseline"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700
    }
  }, "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19 \u0E40\u0E14\u0E37\u0E2D\u0E19", MT_TH_MON_FULL[Number(month.slice(4)) - 1]), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E27\u0E21 ", mtNum(monSum, 1), " kWh")), C ? React.createElement(C, {
    mode: "bars",
    bars: monBars,
    unit: "kWh",
    height: 180,
    empty: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49"
  }) : null, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700
    }
  }, "\u0E04\u0E48\u0E32\u0E2A\u0E14\u0E08\u0E32\u0E01\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C ", st && st.at ? React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "\xB7 ", new Date(st.at).toLocaleTimeString("th-TH")) : null), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null), React.createElement("th", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      padding: "0 12px"
    }
  }, "L1"), React.createElement("th", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      padding: "0 12px"
    }
  }, "L2"), React.createElement("th", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      padding: "0 12px"
    }
  }, "L3"), React.createElement("th", null))), React.createElement("tbody", null, row("แรงดัน", [v.v1, v.v2, v.v3], "V", 1), row("กระแส", [v.i1, v.i2, v.i3], "A", 2), row("กำลังไฟ", [v.kw1, v.kw2, v.kw3], "kW", 2)))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
      gap: 8
    }
  }, React.createElement(MtSpec, {
    label: "kW \u0E23\u0E27\u0E21",
    value: mtNum(v.kw, 2),
    mono: true
  }), React.createElement(MtSpec, {
    label: "PF",
    value: mtNum(v.pf, 2),
    mono: true
  }), React.createElement(MtSpec, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E16\u0E35\u0E48 (Hz)",
    value: mtNum(v.hz, 1),
    mono: true
  }), React.createElement(MtSpec, {
    label: "kWh Import",
    value: mtNum(v.kwh_imp, 1),
    mono: true
  }), React.createElement(MtSpec, {
    label: "kWh Export",
    value: mtNum(v.kwh_exp, 1),
    mono: true
  }), React.createElement(MtSpec, {
    label: "kWh Net",
    value: mtNum(v.kwh_net, 1),
    mono: true
  })), isAdmin && React.createElement(MtMeterCfg, {
    s: s
  }));
}
function MtMeterCfg({
  s
}) {
  const [model, setModel] = React.useState(s.meter_model || "leos-ipm310");
  const [unit, setUnit] = React.useState(String(s.meter_unit == null ? 1 : s.meter_unit));
  const [msg, setMsg] = React.useState("");
  const dirty = model !== (s.meter_model || "leos-ipm310") || unit !== String(s.meter_unit == null ? 1 : s.meter_unit);
  const save = async () => {
    setMsg("กำลังบันทึก…");
    try {
      await mtCall({
        action: "meter-cfg",
        n: s.n,
        meter_model: model,
        meter_unit: Number(unit)
      });
      setMsg("บันทึกแล้ว — agent ใช้ค่าใหม่ในรอบถัดไป");
    } catch (e) {
      setMsg(String(e.message || e));
    }
  };
  const fld = Object.assign({}, mtField, {
    width: "auto",
    padding: "7px 10px",
    background: "var(--surface2)",
    boxShadow: "var(--shadow-inset)"
  });
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      paddingTop: 4
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48 10.10.", s.n, ".20"), React.createElement("select", {
    value: model,
    onChange: e => setModel(e.target.value),
    style: fld
  }, Object.keys(MT_MODEL_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, MT_MODEL_TH[k]))), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    },
    title: "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E1A\u0E19\u0E2A\u0E32\u0E22 Modbus \u2014 \u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48\u0E15\u0E31\u0E27\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C (LEOS \u0E04\u0E48\u0E32\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19 = 1) \xB7 \u0E15\u0E48\u0E2D\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E23\u0E07 LAN \u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E43\u0E0A\u0E49 1 \xB7 \u0E1C\u0E48\u0E32\u0E19 Waveshare \u0E2B\u0E25\u0E32\u0E22\u0E15\u0E31\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E19"
  }, "\u0E40\u0E25\u0E02\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07 Modbus (unit id)"), React.createElement("input", {
    value: unit,
    onChange: e => setUnit(e.target.value.replace(/\D/g, "")),
    style: Object.assign({}, fld, {
      width: 60,
      textAlign: "right"
    })
  }), React.createElement("button", {
    className: "btn btn-sm",
    disabled: !dirty,
    onClick: save
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), msg && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, msg));
}
function mtMonthKeys(ym) {
  const y = Number(ym.slice(0, 4)),
    m = Number(ym.slice(5, 7));
  const ny = m === 12 ? y + 1 : y,
    nm = m === 12 ? 1 : m + 1;
  return {
    pre: ym.replace("-", ""),
    next: ny + String(nm).padStart(2, "0")
  };
}
const mtAtOf = (dayKey, hm) => dayKey.slice(0, 4) + "-" + dayKey.slice(4, 6) + "-" + dayKey.slice(6) + " " + hm.slice(0, 2) + ":" + hm.slice(2);
function mtAtOfMs(ms) {
  const d = new Date(ms + 7 * 3600e3);
  return mtAtOf(mtThDay(ms), String(d.getUTCHours()).padStart(2, "0") + String(d.getUTCMinutes()).padStart(2, "0"));
}
function mtFmtAt(at) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/.exec(String(at || ""));
  if (!m) return "—";
  return Number(m[3]) + " " + MT_TH_MON[Number(m[2]) - 1] + " " + (Number(m[1]) + 543) + (m[4] ? " เวลา " + m[4] + ":" + m[5] + " น." : "");
}
const mtMonTH = ym => MT_TH_MON_FULL[Number(ym.slice(5, 7)) - 1] + " " + (Number(ym.slice(0, 4)) + 543);
function mtBillAuto(days, ym, reg, live) {
  const {
    pre,
    next
  } = mtMonthKeys(ym);
  const keys = Object.keys(days || {}).sort();
  const inMon = keys.filter(k => k.slice(0, 6) === pre && days[k] && days[k].first && days[k].first[reg] != null);
  const out = {
    start: null,
    end: null,
    start_at: "",
    end_at: "",
    warn: [],
    partial: false
  };
  if (!inMon.length) {
    out.warn.push("เดือนนี้ยังไม่มีข้อมูลมิเตอร์ (เริ่มเก็บเมื่อติดตั้ง agent)");
    return out;
  }
  const k0 = inMon[0],
    f0 = days[k0].first;
  out.start = f0[reg];
  out.start_at = mtAtOf(k0, f0.t);
  if (!k0.endsWith("01") || f0.t !== "0000") out.warn.push("เดือนแรกที่เก็บข้อมูล — จดครั้งก่อนเป็นค่าแรกที่มี ไม่ใช่ต้นเดือนพอดี");
  const k1 = next + "01";
  if (days[k1] && days[k1].first && days[k1].first[reg] != null) {
    out.end = days[k1].first[reg];
    out.end_at = mtAtOf(k1, days[k1].first.t);
  } else if (live && live.v && live.v[reg] != null && mtThDay(live.at).slice(0, 6) === pre && live.v[reg] >= out.start) {
    out.end = live.v[reg];
    out.end_at = mtAtOfMs(live.at);
    out.partial = true;
    out.warn.push("เดือนยังไม่จบ — เป็นยอดถึงตอนนี้ ค่าเปลี่ยนตามมิเตอร์ (บันทึกบิลหลังวันที่ 1 เดือนหน้า)");
  } else {
    const kl = inMon[inMon.length - 1],
      l = days[kl].last || days[kl].first;
    out.end = l[reg];
    out.end_at = mtAtOf(kl, l.t);
    out.warn.push("ยังไม่มีค่าวันที่ 1 เดือนถัดไป — จดครั้งนี้เป็นค่าล่าสุดที่เก็บได้");
  }
  return out;
}
function MtBillSheet({
  s,
  st,
  ym,
  isAdmin,
  onCfg
}) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const saved = useMtRef("mtBills/" + s.n + "/" + ym.replace("-", ""));
  const reg = mtRegOf(s);
  const b = s.bill || {};
  const live = st && st.meter && st.meter.modbus && st.meter.modbus.ok && st.meter.v ? {
    v: st.meter.v,
    at: Date.parse(st.at)
  } : null;
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg, live), [days, ym, reg, live && live.v[reg], live && live.at]);
  const [edit, setEdit] = React.useState(false);
  const [ov, setOv] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const useSaved = saved && !edit;
  const src = useSaved ? saved : auto;
  const num = k => ov[k] != null && ov[k] !== "" ? Number(ov[k]) : src[k] == null ? null : Number(src[k]);
  const start = num("start"),
    end = num("end");
  const rate = useSaved ? Number(saved.rate) : ov.rate != null && ov.rate !== "" ? Number(ov.rate) : b.rate != null ? Number(b.rate) : null;
  const vatRate = useSaved ? Number(saved.vat_rate || 0) : b.vat === false ? 0 : 7;
  const ok = start != null && end != null && isFinite(start) && isFinite(end) && end >= start;
  const kwh = ok ? Math.round((end - start) * 1000) / 1000 : null;
  const amount = ok && rate != null ? Math.round(kwh * rate * 100) / 100 : null;
  const vat = amount != null ? Math.round(amount * vatRate) / 100 : null;
  const total = amount != null ? Math.round((amount + vat) * 100) / 100 : null;
  const startAt = ov.start != null ? "" : src.start_at,
    endAt = ov.end != null ? "" : src.end_at;
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await mtCall({
        action: "bill-save",
        n: s.n,
        month: ym,
        start,
        end,
        rate,
        reg,
        start_at: startAt,
        end_at: endAt,
        start_src: ov.start != null ? "พิมพ์เอง" : "มิเตอร์",
        end_src: ov.end != null ? "พิมพ์เอง" : auto.partial ? "ค่าสด" : "มิเตอร์"
      });
      setEdit(false);
      setOv({});
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  };
  const inp = (k, v, w) => React.createElement("input", {
    value: ov[k] != null ? ov[k] : v == null ? "" : String(v),
    onChange: e => setOv(Object.assign({}, ov, {
      [k]: e.target.value.replace(/[^\d.]/g, "")
    })),
    style: Object.assign({}, mtField, {
      width: w || 130,
      padding: "5px 8px",
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontSize: 13,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  });
  const L = {
    fontSize: 12,
    color: "var(--text-3)",
    padding: "7px 10px"
  };
  const V = {
    fontSize: 13.5,
    fontFamily: "var(--mono)",
    textAlign: "right",
    padding: "7px 10px",
    whiteSpace: "nowrap"
  };
  const box = {
    background: "var(--surface2)",
    borderRadius: "var(--r-tile)",
    padding: "10px 12px"
  };
  const baht = window.ecBahtText && total != null ? window.ecBahtText(total) : "";
  return React.createElement("div", {
    style: Object.assign({}, mtCard, {
      gap: 12
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      flexWrap: "wrap"
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32 \u0E23\u0E30\u0E1A\u0E1A\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E40\u0E0B\u0E25\u0E25\u0E4C"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19 ", mtMonTH(ym))), React.createElement("div", {
    style: {
      flex: 1
    }
  }), React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 12
    }
  }, React.createElement("div", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, saved && saved.no || "SITE" + mtPad(s.n) + "-" + ym.replace("-", "")), saved ? React.createElement("div", {
    style: {
      color: "var(--tint-ok-tx)",
      fontWeight: 700,
      marginTop: 2
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 ", new Date(saved.at).toLocaleDateString("th-TH")) : React.createElement("div", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 700,
      marginTop: 2
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 10
    }
  }, React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1F"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, useSaved && saved.cust || b.cust || React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32")), (useSaved && saved.addr || b.addr) && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      whiteSpace: "pre-line"
    }
  }, useSaved && saved.addr || b.addr)), React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 / \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("div", {
    style: {
      fontSize: 13,
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, mtIdent(s)), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, MT_MODEL_TH[s.meter_model || "leos-ipm310"].split(" (")[0].split(" —")[0], " \xB7 10.10.", s.n, ".20 \xB7 ", MT_REG_TH[reg]))), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, L, {
      textAlign: "left",
      fontWeight: 700
    })
  }, "\u0E01\u0E32\u0E23\u0E08\u0E14\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("th", {
    style: Object.assign({}, L, {
      textAlign: "left",
      fontWeight: 700
    })
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 / \u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E08\u0E14"), React.createElement("th", {
    style: Object.assign({}, L, {
      textAlign: "right",
      fontWeight: 700
    })
  }, "\u0E40\u0E25\u0E02\u0E2D\u0E48\u0E32\u0E19\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C (kWh)"))), React.createElement("tbody", null, React.createElement("tr", {
    style: {
      background: "var(--fs-zebra)"
    }
  }, React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E48\u0E2D\u0E19"), React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, ov.start != null ? "พิมพ์เอง" : mtFmtAt(startAt)), React.createElement("td", {
    style: V
  }, edit ? inp("start", src.start) : mtNum(start, 3))), React.createElement("tr", null, React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49"), React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, ov.end != null ? "พิมพ์เอง" : mtFmtAt(endAt), !useSaved && auto.partial && ov.end == null ? " (ค่าสด)" : ""), React.createElement("td", {
    style: V
  }, edit ? inp("end", src.end) : mtNum(end, 3))), React.createElement("tr", {
    style: {
      background: "var(--fs-zebra)"
    }
  }, React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)",
      fontWeight: 700
    }),
    colSpan: 2
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49 (\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49 \u2212 \u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E48\u0E2D\u0E19)"), React.createElement("td", {
    style: Object.assign({}, V, {
      fontWeight: 800
    })
  }, mtNum(kwh, 3))))), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, "\u0E04\u0E48\u0E32\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32 ", mtNum(kwh, 2), " \u0E2B\u0E19\u0E48\u0E27\u0E22 \xD7 ", edit ? inp("rate", rate, 80) : rate == null ? "—" : mtNum(rate, 4), " \u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("td", {
    style: V
  }, rate == null ? isAdmin ? React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: onCfg,
    style: {
      fontFamily: "inherit"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E01\u0E48\u0E2D\u0E19") : "—" : mtNum(amount, 2))), React.createElement("tr", null, React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, "\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 ", vatRate ? vatRate + "%" : "(ไม่คิด)"), React.createElement("td", {
    style: V
  }, mtNum(vat, 2))), React.createElement("tr", {
    style: {
      background: "var(--primary-soft)"
    }
  }, React.createElement("td", {
    style: {
      padding: "11px 10px",
      fontSize: 14,
      fontWeight: 800,
      color: "var(--primary-dark)"
    }
  }, "\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E0A\u0E33\u0E23\u0E30", baht && React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600
    }
  }, "(", baht, ")")), React.createElement("td", {
    style: Object.assign({}, V, {
      fontSize: 20,
      fontWeight: 800,
      color: "var(--primary-dark)"
    })
  }, mtNum(total, 2), " ", React.createElement("span", {
    style: {
      fontSize: 12
    }
  }, "\u0E1A\u0E32\u0E17"))))), !useSaved && auto.warn.map((w, i) => React.createElement("div", {
    key: i,
    style: {
      fontSize: 11.5,
      color: "var(--tint-amber-tx)"
    }
  }, w)), useSaved && (saved.start_src === "พิมพ์เอง" || saved.end_src === "พิมพ์เอง") && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E21\u0E35\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E07 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22 ", saved.by), useSaved && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E02\u0E43\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E04\u0E37\u0E2D\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 \u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22 ", saved.by), err && React.createElement("div", {
    style: mtErrBox
  }, err), isAdmin && React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: onCfg
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E34\u0E25"), edit ? React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => {
      setEdit(false);
      setOv({});
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E41\u0E01\u0E49") : React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setEdit(true)
  }, saved ? "คำนวณใหม่ / แก้เลข" : "แก้เลขเอง"), !useSaved && React.createElement("button", {
    className: "btn btn-sm btn-pri",
    disabled: !ok || rate == null || busy,
    onClick: save
  }, busy ? "กำลังบันทึก…" : saved ? "บันทึกทับ" : "บันทึกบิล")));
}
function MtBillCfg({
  s,
  onClose
}) {
  const b = s.bill || {};
  const [cust, setCust] = React.useState(b.cust || "");
  const [addr, setAddr] = React.useState(b.addr || "");
  const [rate, setRate] = React.useState(b.rate == null ? "" : String(b.rate));
  const [reg, setReg] = React.useState(b.reg || "kwh_imp");
  const [vat, setVat] = React.useState(b.vat !== false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await mtCall({
        action: "bill-cfg",
        n: s.n,
        cust,
        addr,
        rate: Number(rate),
        reg,
        vat
      });
      onClose();
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  };
  const fld = Object.assign({}, mtField, {
    background: "var(--surface2)",
    boxShadow: "var(--shadow-inset)"
  });
  return React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E34\u0E25 ", mtIdent(s)), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1F (\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32)"), React.createElement("input", {
    value: cust,
    onChange: e => setCust(e.target.value),
    style: fld,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E44\u0E17\u0E22\u0E2A\u0E15\u0E35\u0E25 \u0E08\u0E33\u0E01\u0E31\u0E14"
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"), React.createElement("textarea", {
    rows: 2,
    value: addr,
    onChange: e => setAddr(e.target.value),
    style: Object.assign({}, fld, {
      resize: "vertical"
    })
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E32\u0E04\u0E32 (\u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22)"), React.createElement("input", {
    value: rate,
    onChange: e => setRate(e.target.value.replace(/[^\d.]/g, "")),
    style: Object.assign({}, fld, {
      textAlign: "right",
      fontFamily: "var(--mono)"
    })
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E08\u0E14\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E2B\u0E19\u0E02\u0E2D\u0E07\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("select", {
    value: reg,
    onChange: e => setReg(e.target.value),
    style: fld
  }, Object.keys(MT_REG_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, MT_REG_TH[k]))))), React.createElement("label", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      fontSize: 13
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: vat,
    onChange: e => setVat(e.target.checked)
  }), " \u0E04\u0E34\u0E14\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 7%"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E27\u0E31\u0E14\u0E44\u0E1F\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E08\u0E48\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19 \u0E1B\u0E01\u0E15\u0E34\u0E43\u0E0A\u0E49 Import \xB7 \u0E16\u0E49\u0E32\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E40\u0E14\u0E34\u0E19\u0E17\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E25\u0E34\u0E15\u0E2D\u0E22\u0E39\u0E48 \u0E43\u0E2B\u0E49\u0E25\u0E2D\u0E07 Export (\u0E02\u0E36\u0E49\u0E19\u0E01\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D CT)"), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: onClose,
    disabled: busy
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    className: "btn btn-pri",
    onClick: save,
    disabled: busy || rate === ""
  }, busy ? "กำลังบันทึก…" : "บันทึก")));
}
function MtSiteBill({
  s,
  st,
  isAdmin
}) {
  const cur = (() => {
    const t = mtThDay();
    return t.slice(0, 4) + "-" + t.slice(4, 6);
  })();
  const prev = (() => {
    const d = new Date(Date.now() + 7 * 3600e3);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
  })();
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const bills = useMtRef("mtBills/" + s.n);
  const [ym, setYm] = React.useState(null);
  const [cfg, setCfg] = React.useState(false);
  React.useEffect(() => {
    if (ym || days === undefined) return;
    setYm(Object.keys(days || {}).some(k => k.slice(0, 6) === prev.replace("-", "")) ? prev : cur);
  }, [days]);
  const past = Object.keys(bills || {}).sort().reverse();
  const th = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "left",
    padding: "6px 8px",
    whiteSpace: "nowrap"
  };
  if (!ym) return React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026"));
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("input", {
    type: "month",
    value: ym,
    max: cur,
    onChange: e => e.target.value && setYm(e.target.value),
    style: Object.assign({}, mtField, {
      width: "auto",
      padding: "6px 10px",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)"
    })
  })), cfg && React.createElement(MtBillCfg, {
    s: s,
    onClose: () => setCfg(false)
  }), React.createElement(MtBillSheet, {
    key: ym,
    s: s,
    st: st,
    ym: ym,
    isAdmin: isAdmin,
    onCfg: () => setCfg(true)
  }), past.length > 0 && React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E1A\u0E34\u0E25"), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: th
  }, "\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("th", {
    style: th
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E48\u0E2D\u0E19"), React.createElement("th", {
    style: th
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right"
    })
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right"
    })
  }, "\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)"))), React.createElement("tbody", null, past.map((k, i) => {
    const b = bills[k] || {};
    const td = {
      padding: "8px",
      fontSize: 12.5,
      background: i % 2 ? "var(--fs-zebra)" : "transparent"
    };
    const nm = Object.assign({}, td, {
      textAlign: "right",
      fontFamily: "var(--mono)"
    });
    return React.createElement("tr", {
      key: k,
      className: "fs-row",
      onClick: () => setYm(k.slice(0, 4) + "-" + k.slice(4)),
      style: {
        cursor: "pointer"
      }
    }, React.createElement("td", {
      style: Object.assign({}, td, {
        fontWeight: 700
      })
    }, mtMonTH(k.slice(0, 4) + "-" + k.slice(4))), React.createElement("td", {
      style: td
    }, mtFmtAt(b.start_at).replace(/ เวลา.*/, ""), " \xB7 ", mtNum(b.start, 1)), React.createElement("td", {
      style: td
    }, mtFmtAt(b.end_at).replace(/ เวลา.*/, ""), " \xB7 ", mtNum(b.end, 1)), React.createElement("td", {
      style: nm
    }, mtNum(b.kwh, 2)), React.createElement("td", {
      style: Object.assign({}, nm, {
        fontWeight: 700
      })
    }, mtNum(b.total != null ? b.total : b.amount, 2)));
  }))))));
}
function MtMonView({
  role,
  currentUser
}) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const {
    list,
    loading
  } = useMtSites();
  const status = window.useMtStatus ? window.useMtStatus() : null;
  const now = useMtNowMon();
  const [pick, setPick] = React.useState(null);
  const sites = list.filter(s => s.meter_model !== "none" || status && status[s.n]);
  const sel = pick == null ? null : sites.find(s => s.n === pick);
  if (sel) return React.createElement(MtMonDetail, {
    key: sel.n,
    s: sel,
    st: status && status[sel.n],
    isAdmin: isAdmin,
    user: currentUser,
    onBack: () => setPick(null)
  });
  const online = list.filter(s => window.mtState && window.mtState(s, status && status[s.n], now).tone === "green").length;
  const kwNow = list.reduce((t, s) => {
    const v = status && status[s.n] && status[s.n].meter && status[s.n].meter.v;
    return t + (v && v.kw > 0 ? v.kw : 0);
  }, 0);
  const ag = status && status._agent;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: 12
    }
  }, React.createElement(MtStat, {
    label: "\u0E44\u0E0B\u0E15\u0E4C\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C",
    value: online + "/" + list.length,
    unit: "\u0E44\u0E0B\u0E15\u0E4C"
  }), React.createElement(MtStat, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E23\u0E27\u0E21\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49",
    value: mtNum(kwNow, 1),
    unit: "kW",
    sub: "\u0E23\u0E27\u0E21\u0E17\u0E38\u0E01\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }), React.createElement(MtStat, {
    label: "agent \u0E1A\u0E19 VPS",
    value: ag ? now - Date.parse(ag.at || ag.seen) < 5 * 60e3 ? "ปกติ" : "เงียบ" : "—",
    unit: "",
    sub: ag ? "ติดต่อล่าสุด " + new Date(ag.at || ag.seen).toLocaleTimeString("th-TH") : "ยังไม่ได้ติดตั้ง"
  })), loading ? React.createElement("div", {
    style: {
      padding: 18,
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : !sites.length ? React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E17\u0E35\u0E48 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 \u2192 \u0E44\u0E0B\u0E15\u0E4C MikroTik")) : React.createElement(MtMonTable, {
    sites: sites,
    status: status,
    now: now,
    onOpen: setPick
  }));
}
function useMtNowMon() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30e3);
    return () => clearInterval(t);
  }, []);
  return now;
}
window.MtMonView = MtMonView;
window.mtBillAuto = mtBillAuto;