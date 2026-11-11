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
    }
  }, "unit id"), React.createElement("input", {
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
function MtMonView({
  role,
  currentUser
}) {
  const [tab, setTab] = React.useState(() => {
    try {
      return localStorage.getItem("mtmon.tab") || "mon";
    } catch (e) {
      return "mon";
    }
  });
  const pickTab = t => {
    setTab(t);
    try {
      localStorage.setItem("mtmon.tab", t);
    } catch (e) {}
  };
  const opts = [{
    value: "mon",
    label: "มิเตอร์ · สถานะ"
  }, {
    value: "bill",
    label: "บิลรายเดือน"
  }];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", null, window.Segmented ? React.createElement(window.Segmented, {
    value: tab,
    onChange: pickTab,
    options: opts
  }) : opts.map(o => React.createElement("button", {
    key: o.value,
    className: tab === o.value ? "btn btn-pri" : "btn",
    onClick: () => pickTab(o.value),
    style: {
      marginRight: 6
    }
  }, o.label))), tab === "bill" ? React.createElement(MtBillView, {
    role: role,
    currentUser: currentUser
  }) : React.createElement(MtMonPanel, {
    role: role
  }));
}
function MtMonPanel({
  role
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
  const sel = sites.find(s => s.n === pick) || sites[0];
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
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E17\u0E35\u0E48 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 \u2192 \u0E44\u0E0B\u0E15\u0E4C MikroTik")) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 12
    }
  }, sites.map(s => React.createElement(MtMonCard, {
    key: s.n,
    s: s,
    st: status && status[s.n],
    now: now,
    picked: sel && sel.n === s.n,
    onPick: () => setPick(s.n)
  }))), sel && React.createElement(MtMonDetail, {
    key: sel.n,
    s: sel,
    st: status && status[sel.n],
    isAdmin: isAdmin
  })));
}
function useMtNowMon() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30e3);
    return () => clearInterval(t);
  }, []);
  return now;
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
function mtBillAuto(days, ym, reg) {
  const {
    pre,
    next
  } = mtMonthKeys(ym);
  const keys = Object.keys(days || {}).sort();
  const inMon = keys.filter(k => k.slice(0, 6) === pre && days[k] && days[k].first && days[k].first[reg] != null);
  const out = {
    start: null,
    end: null,
    start_src: "",
    end_src: "",
    warn: []
  };
  if (!inMon.length) {
    out.warn.push("ไม่มีข้อมูลมิเตอร์ในเดือนนี้");
    return out;
  }
  const k0 = inMon[0],
    f0 = days[k0].first;
  out.start = f0[reg];
  out.start_src = mtDayLabel(k0) + " " + f0.t.slice(0, 2) + ":" + f0.t.slice(2);
  if (!k0.endsWith("01") || f0.t !== "0000") out.warn.push("ข้อมูลเริ่ม " + out.start_src + " (ไม่ใช่ต้นเดือนพอดี)");
  const k1 = next + "01";
  if (days[k1] && days[k1].first && days[k1].first[reg] != null) {
    out.end = days[k1].first[reg];
    out.end_src = mtDayLabel(k1) + " " + days[k1].first.t.slice(0, 2) + ":" + days[k1].first.t.slice(2);
  } else {
    const kl = inMon[inMon.length - 1],
      l = days[kl].last || days[kl].first;
    out.end = l[reg];
    out.end_src = mtDayLabel(kl) + " " + l.t.slice(0, 2) + ":" + l.t.slice(2) + " (ล่าสุด)";
    out.warn.push("ยังไม่จบเดือน/ยังไม่มีค่าวันที่ 1 เดือนถัดไป — เลขสิ้นสุดเป็นค่าล่าสุด");
  }
  return out;
}
function MtBillRow({
  s,
  ym,
  isAdmin,
  onCfg,
  user
}) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const saved = useMtRef("mtBills/" + s.n + "/" + ym.replace("-", ""));
  const reg = mtRegOf(s);
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg), [days, ym, reg]);
  const [ov, setOv] = React.useState({});
  React.useEffect(() => setOv({}), [ym]);
  const [busy, setBusy] = React.useState("");
  const [err, setErr] = React.useState("");
  const val = (k, def) => ov[k] != null ? ov[k] : def;
  const start = Number(val("start", saved ? saved.start : auto.start));
  const end = Number(val("end", saved ? saved.end : auto.end));
  const rate = Number(val("rate", saved ? saved.rate : s.bill ? s.bill.rate : ""));
  const ok = isFinite(start) && isFinite(end) && end >= start && rate >= 0 && val("start", saved ? saved.start : auto.start) != null;
  const kwh = ok ? Math.round((end - start) * 1000) / 1000 : null;
  const amount = ok && isFinite(rate) ? Math.round(kwh * rate * 100) / 100 : null;
  const payload = extra => Object.assign({
    action: "bill-save",
    n: s.n,
    month: ym,
    start,
    end,
    rate,
    reg,
    start_src: ov.start != null ? "พิมพ์เอง" : saved ? saved.start_src : auto.start_src,
    end_src: ov.end != null ? "พิมพ์เอง" : saved ? saved.end_src : auto.end_src,
    cust: s.bill && s.bill.cust || "",
    invoice_id: saved ? saved.invoice_id : ""
  }, extra || {});
  const save = async () => {
    setBusy("save");
    setErr("");
    try {
      await mtCall(payload());
      setOv({});
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy("");
  };
  const invoice = async () => {
    const ok2 = await window.askConfirm({
      title: "สร้างร่างใบแจ้งหนี้ " + mtIdent(s) + "?",
      body: "ค่าไฟโซลาร์ " + MT_TH_MON_FULL[Number(ym.slice(5)) - 1] + " " + (Number(ym.slice(0, 4)) + 543) + "\n" + mtNum(kwh, 2) + " kWh × " + rate + " บาท = " + mtNum(amount, 2) + " บาท (ก่อน VAT)\nร่างไปอยู่ที่ เอกสารงวดงาน → ใบแจ้งหนี้ ตรวจลูกค้า/ที่อยู่แล้วกดออกใบที่นั่น",
      ok: "สร้างร่าง",
      icon: "file"
    });
    if (!ok2) return;
    setBusy("inv");
    setErr("");
    try {
      if (!window.ivBlank || !window.FBDB) throw new Error("ระบบใบแจ้งหนี้ยังไม่โหลด");
      const root = window.DR_ROOT || "";
      const cfg = (await window.FBDB.ref(root + "invoiceCfg").once("value")).val() || {};
      const issuers = window.ivIssuers ? window.ivIssuers(cfg) : [];
      const iss = issuers[0] || window.ivCompanyIssuer && window.ivCompanyIssuer();
      const inv = window.ivBlank(iss, user);
      const monTxt = MT_TH_MON_FULL[Number(ym.slice(5)) - 1] + " " + (Number(ym.slice(0, 4)) + 543);
      inv.cust = Object.assign({}, inv.cust, {
        name: s.bill && s.bill.cust || mtIdent(s)
      });
      inv.ref = mtIdent(s) + " " + ym;
      inv.items = [Object.assign(inv.items[0], {
        t: "ค่าไฟฟ้าจากระบบโซลาร์ เดือน" + monTxt,
        d: "มิเตอร์ " + MT_REG_TH[reg] + " เลขเริ่ม " + mtNum(start, 2) + " – เลขสิ้นสุด " + mtNum(end, 2),
        qty: kwh,
        unit: "kWh",
        price: rate
      })];
      inv.note = "ไซต์ " + mtIdent(s);
      await window.FBDB.ref(root + "invoices/" + inv.id).set(inv);
      await mtCall(payload({
        invoice_id: inv.id
      }));
      setOv({});
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy("");
  };
  const cell = {
    padding: "9px 8px",
    fontSize: 12.5,
    verticalAlign: "top"
  };
  const inp = (k, v, w) => React.createElement("input", {
    value: ov[k] != null ? ov[k] : v == null ? "" : String(v),
    disabled: !isAdmin,
    onChange: e => setOv(Object.assign({}, ov, {
      [k]: e.target.value.replace(/[^\d.]/g, "")
    })),
    style: Object.assign({}, mtField, {
      width: w || 110,
      padding: "6px 8px",
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontSize: 12.5,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  });
  return React.createElement("tr", null, React.createElement("td", {
    style: cell
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700
    }
  }, mtIdent(s)), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-2)"
    }
  }, s.bill && s.bill.cust || React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32")), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, MT_REG_TH[reg]), isAdmin && React.createElement("button", {
    className: "btn btn-sm btn-soft",
    style: {
      marginTop: 4
    },
    onClick: () => onCfg(s)
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E34\u0E25")), React.createElement("td", {
    style: cell
  }, inp("start", saved ? saved.start : auto.start), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, ov.start != null ? "พิมพ์เอง" : saved ? saved.start_src : auto.start_src)), React.createElement("td", {
    style: cell
  }, inp("end", saved ? saved.end : auto.end), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, ov.end != null ? "พิมพ์เอง" : saved ? saved.end_src : auto.end_src)), React.createElement("td", {
    style: Object.assign({}, cell, {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      textAlign: "right"
    })
  }, mtNum(kwh, 2)), React.createElement("td", {
    style: cell
  }, inp("rate", saved ? saved.rate : s.bill ? s.bill.rate : null, 70)), React.createElement("td", {
    style: Object.assign({}, cell, {
      fontFamily: "var(--mono)",
      fontWeight: 800,
      textAlign: "right",
      fontSize: 14
    })
  }, mtNum(amount, 2)), React.createElement("td", {
    style: Object.assign({}, cell, {
      minWidth: 190
    })
  }, saved && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-ok-tx)",
      fontWeight: 700
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27 \xB7 ", saved.by, " ", new Date(saved.at).toLocaleDateString("th-TH")), saved && saved.invoice_id && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E21\u0E35\u0E23\u0E48\u0E32\u0E07/\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27 (\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E07\u0E27\u0E14\u0E07\u0E32\u0E19 \u2192 \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49)"), !saved && auto.warn.map((w, i) => React.createElement("div", {
    key: i,
    style: {
      fontSize: 11,
      color: "var(--tint-amber-tx)"
    }
  }, w)), isAdmin && React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 5,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    className: "btn btn-sm",
    disabled: !ok || !!busy,
    onClick: save
  }, busy === "save" ? "กำลังบันทึก…" : saved ? "บันทึกทับ" : "บันทึกบิล"), !(saved && saved.invoice_id) && React.createElement("button", {
    className: "btn btn-sm btn-pri",
    disabled: !ok || !(rate > 0) || !!busy,
    onClick: invoice
  }, busy === "inv" ? "กำลังสร้าง…" : "สร้างร่างใบแจ้งหนี้")), err && React.createElement("div", {
    style: Object.assign({}, mtErrBox, {
      marginTop: 5,
      fontSize: 11.5
    })
  }, err)));
}
function MtBillCfg({
  s,
  onClose
}) {
  const b = s.bill || {};
  const [cust, setCust] = React.useState(b.cust || "");
  const [rate, setRate] = React.useState(b.rate == null ? "" : String(b.rate));
  const [reg, setReg] = React.useState(b.reg || "kwh_imp");
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
        rate: Number(rate),
        reg
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
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 (\u0E43\u0E0A\u0E49\u0E43\u0E19\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49)"), React.createElement("input", {
    value: cust,
    onChange: e => setCust(e.target.value),
    style: fld,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 \u0E44\u0E17\u0E22\u0E2A\u0E15\u0E35\u0E25 \u0E08\u0E33\u0E01\u0E31\u0E14"
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: 10
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E32\u0E04\u0E32 (\u0E1A\u0E32\u0E17/kWh)"), React.createElement("input", {
    value: rate,
    onChange: e => setRate(e.target.value.replace(/[^\d.]/g, "")),
    style: Object.assign({}, fld, {
      textAlign: "right",
      fontFamily: "var(--mono)"
    })
  })), React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E04\u0E34\u0E14\u0E40\u0E07\u0E34\u0E19\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E2B\u0E19\u0E02\u0E2D\u0E07\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("select", {
    value: reg,
    onChange: e => setReg(e.target.value),
    style: fld
  }, Object.keys(MT_REG_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, MT_REG_TH[k]))))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14\u0E44\u0E1F\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E08\u0E48\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19 \u0E1B\u0E01\u0E15\u0E34\u0E43\u0E0A\u0E49 Import \xB7 \u0E16\u0E49\u0E32\u0E04\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E16\u0E2D\u0E22\u0E2B\u0E25\u0E31\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E47\u0E19 0 \u0E17\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E25\u0E34\u0E15\u0E2D\u0E22\u0E39\u0E48 \u0E43\u0E2B\u0E49\u0E25\u0E2D\u0E07 Export (\u0E02\u0E36\u0E49\u0E19\u0E01\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D CT)"), err && React.createElement("div", {
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
function MtBillView({
  role,
  currentUser
}) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const {
    list,
    loading
  } = useMtSites();
  const prev = (() => {
    const d = new Date(Date.now() + 7 * 3600e3);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
  })();
  const [ym, setYm] = React.useState(prev);
  const [cfg, setCfg] = React.useState(null);
  const sites = list.filter(s => s.meter_model !== "none");
  const th = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "left",
    padding: "6px 8px",
    whiteSpace: "nowrap"
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
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
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E1A\u0E34\u0E25\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 \u2192 \u0E15\u0E49\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E16\u0E31\u0E14\u0E44\u0E1B \xD7 \u0E23\u0E32\u0E04\u0E32\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22 \xB7 \u0E23\u0E32\u0E04\u0E32\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E27\u0E21 VAT"), React.createElement("div", {
    style: {
      flex: 1
    }
  }), React.createElement("input", {
    type: "month",
    value: ym,
    onChange: e => e.target.value && setYm(e.target.value),
    style: Object.assign({}, mtField, {
      width: "auto",
      padding: "6px 10px",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  })), !isAdmin && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E1A\u0E34\u0E25/\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E2B\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19")), cfg && React.createElement(MtBillCfg, {
    s: cfg,
    onClose: () => setCfg(null)
  }), React.createElement("div", {
    style: mtCard
  }, loading ? React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : !sites.length ? React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E35\u0E48\u0E21\u0E35\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C") : React.createElement("div", {
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
  }, "\u0E44\u0E0B\u0E15\u0E4C / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement("th", {
    style: th
  }, "\u0E40\u0E25\u0E02\u0E40\u0E23\u0E34\u0E48\u0E21"), React.createElement("th", {
    style: th
  }, "\u0E40\u0E25\u0E02\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right"
    })
  }, "kWh"), React.createElement("th", {
    style: th
  }, "\u0E1A\u0E32\u0E17/kWh"), React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "right"
    })
  }, "\u0E22\u0E2D\u0E14\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)"), React.createElement("th", {
    style: th
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), React.createElement("tbody", null, sites.map(s => React.createElement(MtBillRow, {
    key: s.n + ym,
    s: s,
    ym: ym,
    isAdmin: isAdmin,
    onCfg: x => setCfg(x),
    user: currentUser
  })))))));
}
window.MtMonView = MtMonView;
window.MtBillView = MtBillView;
window.mtBillAuto = mtBillAuto;