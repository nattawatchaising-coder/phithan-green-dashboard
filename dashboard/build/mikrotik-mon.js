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
const mtDayKwh = (d, reg) => d && d.first && d.last && d.first[reg] != null && d.last[reg] != null ? Math.max(0, Math.abs(d.last[reg]) - Math.abs(d.first[reg])) : null;
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
  }, mtCustOf(s).cust || s.name), meterBad && React.createElement("span", {
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
  })), mtCustOf(s).cust && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      marginTop: -4
    }
  }, mtCustOf(s).cust), React.createElement("div", {
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
  canEdit,
  onBack
}) {
  const [tab, setTab] = React.useState("meter");
  const opts = [{
    value: "meter",
    label: "มิเตอร์"
  }, {
    value: "bill",
    label: "บิลรายเดือน"
  }, {
    value: "info",
    label: "ข้อมูลไซต์"
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
  }, mtCustOf(s).cust || mtIdent(s)), React.createElement("div", {
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
  }, o.label))), isAdmin && React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, React.createElement("span", null, "\u0E40\u0E02\u0E49\u0E32\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E43\u0E19\u0E44\u0E0B\u0E15\u0E4C (\u0E40\u0E1B\u0E34\u0E14 VPN \u0E1A\u0E19\u0E04\u0E2D\u0E21\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E02\u0E49\u0E2D 11):"), React.createElement("a", {
    className: "btn btn-sm",
    href: "http://10.10." + s.n + ".20",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("a", {
    className: "btn btn-sm",
    href: "https://10.10." + s.n + ".10",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "SmartLogger")), tab === "bill" ? React.createElement(MtSiteBill, {
    s: s,
    st: st,
    isAdmin: isAdmin,
    canEdit: canEdit
  }) : tab === "info" ? React.createElement(MtSiteInfo, {
    key: s.n,
    s: s,
    canEdit: canEdit
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
    value: mtNum(v.kwh_exp == null ? null : Math.abs(v.kwh_exp), 1),
    mono: true
  }), React.createElement(MtSpec, {
    label: "kWh Net",
    value: mtNum(v.kwh_net, 1),
    mono: true
  })), isAdmin && React.createElement(MtMeterCfg, {
    s: s
  }), React.createElement(MtMeterReport, {
    s: s,
    days: days,
    month: month,
    reg: reg
  }));
}
function MtMeterReport({
  s,
  days,
  month,
  reg
}) {
  const [mode, setMode] = React.useState("day");
  const D = days || {};
  const keys = Object.keys(D).sort();
  const val = r => r && r[reg] != null ? Math.abs(r[reg]) : null;
  const dayRows = keys.filter(k => k.slice(0, 6) === month).map(k => {
    const d = D[k] || {};
    return {
      k,
      label: mtDayLabel(k) + " " + (Number(k.slice(0, 4)) + 543),
      first: val(d.first),
      last: val(d.last),
      kwh: mtDayKwh(d, reg),
      kwmax: d.kw_max
    };
  });
  const mons = {};
  keys.forEach(k => {
    const m = k.slice(0, 6),
      d = D[k] || {},
      e = mons[m] || (mons[m] = {
        k: m,
        days: 0,
        kwh: 0,
        kwmax: 0,
        first: null,
        last: null
      });
    const x = mtDayKwh(d, reg);
    e.days++;
    e.kwh += x || 0;
    e.kwmax = Math.max(e.kwmax, Number(d.kw_max) || 0);
    if (e.first == null) e.first = val(d.first);
    e.last = val(d.last) != null ? val(d.last) : e.last;
  });
  const monRows = Object.values(mons).sort((a, b) => a.k < b.k ? 1 : -1).map(e => Object.assign(e, {
    label: mtMonTH(e.k.slice(0, 4) + "-" + e.k.slice(4))
  }));
  const rows = mode === "day" ? dayRows : monRows;
  const total = rows.reduce((t, r) => t + (r.kwh || 0), 0);
  const csv = () => {
    const head = mode === "day" ? ["วันที่", "เลขต้นวัน kWh", "เลขท้ายวัน kWh", "พลังงาน kWh", "kW สูงสุด"] : ["เดือน", "วันที่มีข้อมูล", "เลขต้นเดือน kWh", "เลขล่าสุด kWh", "พลังงาน kWh", "kW สูงสุด"];
    const body = rows.map(r => (mode === "day" ? [r.k.slice(0, 4) + "-" + r.k.slice(4, 6) + "-" + r.k.slice(6), r.first, r.last, r.kwh, r.kwmax] : [r.k.slice(0, 4) + "-" + r.k.slice(4), r.days, r.first, r.last, Math.round(r.kwh * 1000) / 1000, r.kwmax]).map(x => x == null ? "" : x).join(","));
    mtDownload("\ufeff" + [head.join(",")].concat(body).join("\n"), "SITE" + mtPad(s.n) + "-" + (mode === "day" ? "daily-" + month : "monthly") + ".csv");
  };
  const th = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "right",
    padding: "6px 8px",
    whiteSpace: "nowrap"
  };
  const opts = [{
    value: "day",
    label: "รายวัน"
  }, {
    value: "month",
    label: "รายเดือน"
  }];
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      paddingTop: 6
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700
    }
  }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19", mode === "day" ? "รายวัน เดือน" + MT_TH_MON_FULL[Number(month.slice(4)) - 1] : "รายเดือน"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E27\u0E21 ", mtNum(total, 3), " kWh \xB7 ", MT_REG_TH[reg]), React.createElement("div", {
    style: {
      flex: 1
    }
  }), window.Segmented ? React.createElement(window.Segmented, {
    value: mode,
    onChange: setMode,
    options: opts
  }) : null, React.createElement("button", {
    className: "btn btn-sm",
    disabled: !rows.length,
    onClick: csv,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 13
  }), "CSV")), React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "left"
    })
  }, mode === "day" ? "วันที่" : "เดือน"), mode === "month" && React.createElement("th", {
    style: th
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), React.createElement("th", {
    style: th
  }, mode === "day" ? "เลขต้นวัน" : "เลขต้นเดือน", " (kWh)"), React.createElement("th", {
    style: th
  }, mode === "day" ? "เลขท้ายวัน" : "เลขล่าสุด", " (kWh)"), React.createElement("th", {
    style: th
  }, "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 (kWh)"), React.createElement("th", {
    style: th
  }, "kW \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14"))), React.createElement("tbody", null, rows.map((r, i) => {
    const td = {
      padding: "7px 8px",
      fontSize: 12.5,
      textAlign: "right",
      fontFamily: "var(--mono)",
      background: i % 2 ? "var(--fs-zebra)" : "transparent"
    };
    return React.createElement("tr", {
      key: r.k
    }, React.createElement("td", {
      style: Object.assign({}, td, {
        textAlign: "left",
        fontFamily: "inherit",
        fontWeight: 600
      })
    }, r.label), mode === "month" && React.createElement("td", {
      style: td
    }, r.days), React.createElement("td", {
      style: td
    }, mtNum(r.first, 3)), React.createElement("td", {
      style: td
    }, mtNum(r.last, 3)), React.createElement("td", {
      style: Object.assign({}, td, {
        fontWeight: 700
      })
    }, mtNum(r.kwh, 3)), React.createElement("td", {
      style: td
    }, mtNum(r.kwmax, 2)));
  }))), !rows.length && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      padding: 8
    }
  }, days === undefined ? "กำลังโหลด…" : "ยังไม่มีข้อมูล")));
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
function mtCustOf(s) {
  const o = Object.assign({}, s.info || {});
  if (!o.cust) o.cust = s.bill && s.bill.cust || "";
  if (!o.addr) o.addr = s.bill && s.bill.addr || "";
  return o;
}
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
  const resetAt = k => {
    out.start = 0;
    out.start_at = k.length === 8 ? k.slice(0, 4) + "-" + k.slice(4, 6) + "-" + k.slice(6) : k;
    out.reset = true;
  };
  let prev = null;
  inMon.forEach(k => {
    const f = days[k].first[reg],
      l = days[k].last && days[k].last[reg] != null ? days[k].last[reg] : f;
    if (prev != null && f < prev - 0.5 || l < f - 0.5) resetAt(k);
    prev = l;
  });
  const k1 = next + "01";
  if (days[k1] && days[k1].first && days[k1].first[reg] != null) {
    out.end = days[k1].first[reg];
    out.end_at = mtAtOf(k1, days[k1].first.t);
  } else if (live && live.v && live.v[reg] != null && mtThDay(live.at).slice(0, 6) === pre) {
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
  if (out.end != null && out.end < out.start - 0.5) resetAt(out.end_at.slice(0, 10));
  if (out.reset) out.warn.push("มิเตอร์ถูกรีเซ็ตในเดือนนี้ — จดครั้งก่อนนับจาก 0 ตั้งแต่วันที่รีเซ็ต");
  return out;
}
const mtEsc = x => String(x == null ? "" : x).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[c]);
function mtBillPrint(bill, s, logo) {
  const w = window.open("", "_blank");
  if (!w) return;
  const iss = bill.issuer || {};
  const n2 = v => mtNum(v, 2),
    n3 = v => mtNum(v, 3);
  const ym = bill.month || "";
  const baht = window.ecBahtText ? window.ecBahtText(bill.total) : "";
  const logoOk = /^data:image\/(png|jpeg|webp);base64,/.test(String(logo || ""));
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + mtEsc(bill.no) + '</title><style>' + 'body{font-family:"IBM Plex Sans Thai",Tahoma,sans-serif;color:#111;margin:0;padding:28px;font-size:13px}' + '.top{display:flex;gap:16px;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px}.top img{max-height:70px;max-width:160px}' + 'h1{font-size:18px;margin:14px 0 2px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:7px 8px;border-bottom:1px solid #ddd;text-align:left}' + '.r{text-align:right;font-family:monospace;white-space:nowrap}.box{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.box div{background:#f5f5f5;padding:10px;border-radius:6px}' + '.tot td{font-size:16px;font-weight:800;border-bottom:2px solid #111}.muted{color:#666;font-size:11px}@page{size:A4;margin:14mm}</style></head><body>' + '<div class="top">' + (logoOk ? '<img src="' + logo + '">' : '') + '<div style="flex:1"><div style="font-size:16px;font-weight:800">' + mtEsc(iss.name || "") + '</div>' + '<div>' + mtEsc(iss.addr || "").replace(/\n/g, "<br>") + '</div>' + '<div>' + (iss.tax ? "เลขประจำตัวผู้เสียภาษี " + mtEsc(iss.tax) + (iss.branch ? " (" + mtEsc(iss.branch) + ")" : "") : "") + (iss.phone ? " · โทร " + mtEsc(iss.phone) : "") + '</div></div>' + '<div style="text-align:right">เลขที่<br><b style="font-family:monospace">' + mtEsc(bill.no) + '</b><br>วันที่ออก ' + mtEsc(new Date(bill.at).toLocaleDateString("th-TH", {
    dateStyle: "long"
  })) + '</div></div>' + '<h1>ใบแจ้งค่าไฟฟ้า ระบบโซลาร์เซลล์</h1><div>ประจำเดือน ' + mtEsc(mtMonTH(ym)) + '</div>' + '<div class="box"><div><div class="muted">ผู้ใช้ไฟ</div><b>' + mtEsc(bill.cust) + '</b><br>' + mtEsc(bill.addr).replace(/\n/g, "<br>") + (bill.cust_tax ? '<br>เลขประจำตัวผู้เสียภาษี ' + mtEsc(bill.cust_tax) + (bill.cust_branch ? " (" + mtEsc(bill.cust_branch) + ")" : "") : "") + '</div>' + '<div><div class="muted">สถานที่ติดตั้ง / มิเตอร์</div><b>' + mtEsc(bill.place || mtIdent(s)) + '</b>' + (bill.ca ? '<br>เลขที่ผู้ใช้ไฟ ' + mtEsc(bill.ca) : "") + (bill.meter_no ? '<br>เลขมิเตอร์ ' + mtEsc(bill.meter_no) : "") + '<br>' + mtEsc(MT_REG_TH[bill.reg] || "") + '</div></div>' + '<table><tr><th>การจดหน่วย</th><th>วันที่ / เวลาที่จด</th><th class="r">เลขอ่านมิเตอร์ (kWh)</th></tr>' + '<tr><td>จดครั้งก่อน</td><td>' + mtEsc(mtFmtAt(bill.start_at)) + '</td><td class="r">' + n3(bill.start) + '</td></tr>' + '<tr><td>จดครั้งนี้</td><td>' + mtEsc(mtFmtAt(bill.end_at)) + '</td><td class="r">' + n3(bill.end) + '</td></tr>' + '<tr><td colspan="2"><b>หน่วยที่ใช้</b></td><td class="r"><b>' + n3(bill.kwh) + '</b></td></tr></table>' + '<table><tr><td>ค่าพลังงานไฟฟ้า ' + n2(bill.kwh) + ' หน่วย × ' + mtNum(bill.rate, 4) + ' บาท/หน่วย</td><td class="r">' + n2(bill.amount) + '</td></tr>' + '<tr><td>ภาษีมูลค่าเพิ่ม ' + (bill.vat_rate ? bill.vat_rate + "%" : "(ไม่คิด)") + '</td><td class="r">' + n2(bill.vat) + '</td></tr>' + '<tr class="tot"><td>รวมเงินที่ต้องชำระ' + (baht ? '<div style="font-size:12px;font-weight:600">(' + mtEsc(baht) + ')</div>' : "") + '</td><td class="r">' + n2(bill.total) + ' บาท</td></tr></table>' + '<p class="muted">เลขมิเตอร์อ่านอัตโนมัติจากมิเตอร์ของระบบ · ออกบิลโดย ' + mtEsc(bill.by) + '</p>' + '<script>setTimeout(function(){print()},300)<\/script></body></html>');
  w.document.close();
}
function MtBillSheet({
  s,
  st,
  ym,
  canEdit,
  onCfg
}) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const saved = useMtRef("mtBills/" + s.n + "/" + ym.replace("-", ""));
  const owner = useMtRef(s.owner ? "mtPartners/" + s.owner : "");
  const reg = mtRegOf(s);
  const b = s.bill || {};
  const live = st && st.meter && st.meter.modbus && st.meter.modbus.ok && st.meter.v ? {
    v: st.meter.v,
    at: Date.parse(st.at)
  } : null;
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg, live), [days, ym, reg, live && live.v[reg], live && live.at]);
  const [recalc, setRecalc] = React.useState(false);
  const [rateIn, setRateIn] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const useSaved = saved && !recalc;
  const src = useSaved ? saved : auto;
  const start = src.start == null ? null : Number(src.start),
    end = src.end == null ? null : Number(src.end);
  const rate = useSaved ? Number(saved.rate) : rateIn != null && rateIn !== "" ? Number(rateIn) : b.rate != null ? Number(b.rate) : null;
  const vatRate = useSaved ? Number(saved.vat_rate || 0) : b.vat === false ? 0 : 7;
  const ok = start != null && end != null && isFinite(start) && isFinite(end) && end >= start;
  const kwh = ok ? Math.round((end - start) * 1000) / 1000 : null;
  const amount = ok && rate != null && isFinite(rate) ? Math.round(kwh * rate * 100) / 100 : null;
  const vat = amount != null ? Math.round(amount * vatRate) / 100 : null;
  const total = amount != null ? Math.round((amount + vat) * 100) / 100 : null;
  const company = owner && owner.company || {};
  const iss = useSaved ? saved.issuer || null : s.owner ? Object.assign({
    name: owner && owner.name
  }, company) : null;
  const logo = iss && s.owner && (!useSaved || !saved.issuer || saved.issuer.pid === s.owner) ? company.logo : "";
  const ci = useSaved ? {
    cust: saved.cust,
    addr: saved.addr,
    tax: saved.cust_tax,
    branch: saved.cust_branch,
    place: saved.place,
    ca: saved.ca,
    meter_no: saved.meter_no
  } : mtCustOf(s);
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await mtCall({
        action: "bill-save",
        n: s.n,
        month: ym,
        rate
      });
      setRecalc(false);
      setRateIn(null);
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  };
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
  const hist = saved && saved.hist ? Object.keys(saved.hist).sort().reverse().map(k => saved.hist[k]) : [];
  return React.createElement("div", {
    style: Object.assign({}, mtCard, {
      gap: 12
    })
  }, iss && (iss.name || logo) && React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      paddingBottom: 10,
      borderBottom: "1px solid var(--line, rgba(0,0,0,.08))"
    }
  }, logo && React.createElement("img", {
    src: logo,
    alt: "",
    style: {
      maxHeight: 52,
      maxWidth: 130,
      objectFit: "contain"
    }
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, iss.name), iss.addr && React.createElement("div", {
    style: {
      whiteSpace: "pre-line"
    }
  }, iss.addr), (iss.tax || iss.phone) && React.createElement("div", null, iss.tax ? "เลขประจำตัวผู้เสียภาษี " + iss.tax + (iss.branch ? " (" + iss.branch + ")" : "") : "", iss.phone ? " · โทร " + iss.phone : ""))), React.createElement("div", {
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
  }, "\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E41\u0E25\u0E49\u0E27 ", new Date(saved.at).toLocaleDateString("th-TH")) : React.createElement("div", {
    style: {
      color: "var(--tint-amber-tx)",
      fontWeight: 700,
      marginTop: 2
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25"))), React.createElement("div", {
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
  }, ci.cust || React.createElement("span", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 (\u0E41\u0E17\u0E47\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E0B\u0E15\u0E4C)")), ci.addr && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)",
      whiteSpace: "pre-line"
    }
  }, ci.addr), ci.tax && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 ", ci.tax, ci.branch ? " (" + ci.branch + ")" : "")), React.createElement("div", {
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
      fontWeight: 700
    }
  }, ci.place || React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, mtIdent(s))), (ci.ca || ci.meter_no) && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, ci.ca ? "เลขที่ผู้ใช้ไฟ " + ci.ca : "", ci.ca && ci.meter_no ? " · " : "", ci.meter_no ? "เลขมิเตอร์ " + ci.meter_no : ""), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, MT_MODEL_TH[s.meter_model || "leos-ipm310"].split(" (")[0].split(" —")[0], " \xB7 ", MT_REG_TH[reg]))), React.createElement("table", {
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
  }, mtFmtAt(src.start_at)), React.createElement("td", {
    style: V
  }, mtNum(start, 3))), React.createElement("tr", null, React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49"), React.createElement("td", {
    style: Object.assign({}, L, {
      color: "var(--text-1)"
    })
  }, mtFmtAt(src.end_at), (useSaved ? saved.partial : auto.partial) ? " (ค่าสด)" : ""), React.createElement("td", {
    style: V
  }, mtNum(end, 3))), React.createElement("tr", {
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
  }, "\u0E04\u0E48\u0E32\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32 ", mtNum(kwh, 2), " \u0E2B\u0E19\u0E48\u0E27\u0E22 \xD7", " ", !useSaved && canEdit ? React.createElement("input", {
    value: rateIn != null ? rateIn : rate == null ? "" : String(rate),
    placeholder: "\u0E23\u0E32\u0E04\u0E32",
    onChange: e => setRateIn(e.target.value.replace(/[^\d.]/g, "")),
    style: Object.assign({}, mtField, {
      width: 90,
      padding: "5px 8px",
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontSize: 13,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  }) : rate == null ? "—" : mtNum(rate, 4), " ", "\u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("td", {
    style: V
  }, mtNum(amount, 2))), React.createElement("tr", null, React.createElement("td", {
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
  }, w)), !useSaved && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \xB7 \u0E41\u0E01\u0E49\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E23\u0E32\u0E04\u0E32\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22"), useSaved && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E42\u0E14\u0E22 ", React.createElement("b", null, saved.by), saved.by_kind === "partner" ? " (พาร์ทเนอร์)" : "", " \xB7 ", mtWhen(saved.at), " \xB7 \u0E40\u0E25\u0E02\u0E43\u0E19\u0E43\u0E1A\u0E19\u0E35\u0E49\u0E04\u0E37\u0E2D\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E27\u0E49 \u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), hist.length > 0 && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E09\u0E1A\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32 (\u0E16\u0E39\u0E01\u0E2D\u0E2D\u0E01\u0E17\u0E31\u0E1A): ", hist.map((h, i) => React.createElement("span", {
    key: i
  }, i ? " · " : "", mtWhen(h.at), " \u0E42\u0E14\u0E22 ", h.by, " = ", mtNum(h.total, 2), " \u0E1A\u0E32\u0E17"))), err && React.createElement("div", {
    style: mtErrBox
  }, err), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end"
    }
  }, canEdit && React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: onCfg
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E34\u0E25"), useSaved && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => mtBillPrint(saved, s, logo)
  }, "\u0E1E\u0E34\u0E21\u0E1E\u0E4C / PDF"), canEdit && useSaved && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setRecalc(true)
  }, "\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48"), canEdit && recalc && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => {
      setRecalc(false);
      setRateIn(null);
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), canEdit && !useSaved && React.createElement("button", {
    className: "btn btn-sm btn-pri",
    disabled: !ok || rate == null || !isFinite(rate) || busy,
    onClick: save
  }, busy ? "กำลังบันทึก…" : saved ? "ออกบิลทับ" : "ออกบิล")));
}
function MtBillCfg({
  s,
  isAdmin,
  onClose
}) {
  const b = s.bill || {};
  const [rate, setRate] = React.useState(b.rate == null ? "" : String(b.rate));
  const [reg, setReg] = React.useState(b.reg || "kwh_imp");
  const [vat, setVat] = React.useState(b.vat !== false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await mtCall(Object.assign({
        action: "bill-cfg",
        n: s.n,
        rate: Number(rate),
        vat
      }, isAdmin ? {
        reg
      } : {}));
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
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1A\u0E34\u0E25 ", mtIdent(s)), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isAdmin ? "140px 1fr" : "160px",
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
  })), isAdmin && React.createElement("div", null, React.createElement("div", {
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
  }), " \u0E04\u0E34\u0E14\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 7%"), isAdmin && React.createElement("div", {
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
  isAdmin,
  canEdit
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
  const [delErr, setDelErr] = React.useState("");
  const delBill = async (k, b) => {
    const ok = await window.askConfirm({
      title: "ลบบิล " + (b.no || k) + "?",
      body: mtMonTH(k.slice(0, 4) + "-" + k.slice(4)) + " · " + mtNum(b.total != null ? b.total : b.amount, 2) + " บาท · ออกโดย " + (b.by || "—") + " — บิลจะหายจากหน้าเว็บ (ระบบเก็บสำเนาไว้หลังบ้าน)",
      ok: "ลบบิล",
      danger: true,
      icon: "trash"
    });
    if (!ok) return;
    setDelErr("");
    try {
      await mtCall({
        action: "bill-del",
        n: s.n,
        month: k.slice(0, 4) + "-" + k.slice(4)
      });
    } catch (e) {
      setDelErr(String(e.message || e));
    }
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
    isAdmin: isAdmin,
    onClose: () => setCfg(false)
  }), React.createElement(MtBillSheet, {
    key: ym,
    s: s,
    st: st,
    ym: ym,
    canEdit: canEdit,
    onCfg: () => setCfg(true)
  }), past.length > 0 && React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, "\u0E1A\u0E34\u0E25\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27"), delErr && React.createElement("div", {
    style: mtErrBox
  }, delErr), React.createElement("div", {
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
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), React.createElement("th", {
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
  }, "\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)"), React.createElement("th", {
    style: th
  }, "\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E42\u0E14\u0E22"), isAdmin && React.createElement("th", {
    style: th
  }))), React.createElement("tbody", null, past.map((k, i) => {
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
    const nh = b.hist ? Object.keys(b.hist).length : 0;
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
      style: Object.assign({}, td, {
        fontFamily: "var(--mono)"
      })
    }, b.no), React.createElement("td", {
      style: td
    }, mtFmtAt(b.start_at).replace(/ เวลา.*/, ""), " \xB7 ", mtNum(b.start, 1)), React.createElement("td", {
      style: td
    }, mtFmtAt(b.end_at).replace(/ เวลา.*/, ""), " \xB7 ", mtNum(b.end, 1)), React.createElement("td", {
      style: nm
    }, mtNum(b.kwh, 2)), React.createElement("td", {
      style: Object.assign({}, nm, {
        fontWeight: 700
      })
    }, mtNum(b.total != null ? b.total : b.amount, 2)), React.createElement("td", {
      style: Object.assign({}, td, {
        whiteSpace: "nowrap"
      })
    }, b.by || "—", " ", React.createElement("span", {
      style: {
        color: "var(--text-3)",
        fontSize: 11
      }
    }, mtWhen(b.at), nh ? " · ออกทับ " + nh + " ครั้ง" : "")), isAdmin && React.createElement("td", {
      style: td
    }, React.createElement("button", {
      className: "btn btn-sm",
      title: "\u0E25\u0E1A\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49",
      onClick: e => {
        e.stopPropagation();
        delBill(k, b);
      },
      style: {
        color: "var(--tint-red-tx)"
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 13
    }))));
  }))))));
}
const MT_INFO_FIELDS = [["cust", "ชื่อลูกค้า (ผู้ใช้ไฟ)", "เช่น บริษัท ไทยสตีล จำกัด", 2], ["tax", "เลขประจำตัวผู้เสียภาษีลูกค้า", "13 หลัก", 1], ["branch", "สาขา", "สำนักงานใหญ่ / 00001", 1], ["addr", "ที่อยู่ลูกค้า (ขึ้นบนบิล)", "", 2, true], ["place", "สถานที่ติดตั้ง", "เช่น หลังคาโรงงาน 2 นิคมอมตะซิตี้", 2], ["contact", "ผู้ติดต่อ", "", 1], ["phone", "โทร", "", 1], ["ca", "เลขที่ผู้ใช้ไฟ (การไฟฟ้า)", "", 1], ["meter_no", "เลขมิเตอร์ (S/N)", "", 1], ["kwp", "ขนาดระบบ (kWp)", "", 1], ["cod", "วันเริ่มจ่ายไฟ", "", 1, false, "date"], ["note", "หมายเหตุ", "", 2, true]];
function MtSiteInfo({
  s,
  canEdit
}) {
  const [f, setF] = React.useState(() => {
    const c = mtCustOf(s);
    const o = {};
    MT_INFO_FIELDS.forEach(([k]) => {
      o[k] = c[k] == null ? "" : String(c[k]);
    });
    return o;
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await mtCall({
        action: "site-info",
        n: s.n,
        info: f
      });
      setMsg("บันทึกแล้ว");
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
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, "\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E44\u0E0B\u0E15\u0E4C"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E41\u0E25\u0E30\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E35\u0E48\u0E02\u0E36\u0E49\u0E19\u0E1A\u0E19\u0E1A\u0E34\u0E25 \xB7 ", mtIdent(s))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 10
    }
  }, MT_INFO_FIELDS.map(([k, label, ph, span, multi, type]) => React.createElement("div", {
    key: k,
    style: {
      gridColumn: span === 2 ? "1 / -1" : undefined
    }
  }, React.createElement("div", {
    style: mtLbl
  }, label), multi ? React.createElement("textarea", {
    rows: 2,
    disabled: !canEdit,
    value: f[k],
    placeholder: ph,
    onChange: e => setF(Object.assign({}, f, {
      [k]: e.target.value
    })),
    style: Object.assign({}, fld, {
      resize: "vertical"
    })
  }) : React.createElement("input", {
    type: type || "text",
    disabled: !canEdit,
    value: f[k],
    placeholder: ph,
    onChange: e => setF(Object.assign({}, f, {
      [k]: k === "kwp" ? e.target.value.replace(/[^\d.]/g, "") : e.target.value
    })),
    style: fld
  })))), s.info && s.info.by && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E01\u0E49\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14\u0E42\u0E14\u0E22 ", s.info.by, " \xB7 ", mtWhen(s.info.at)), err && React.createElement("div", {
    style: mtErrBox
  }, err), canEdit && React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "flex-end",
      alignItems: "center"
    }
  }, msg && React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-ok-tx)",
      fontWeight: 700
    }
  }, msg), React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "บันทึกทะเบียนไซต์")));
}
function MtMonView({
  role,
  currentUser,
  partner
}) {
  const isAdmin = !partner && (window.hasRole ? window.hasRole(role, "admin") : false);
  const all = partner ? null : useMtSites();
  const allStatus = partner ? null : window.useMtStatus ? window.useMtStatus() : null;
  const mine = partner ? window.useMtPartnerData(partner) : null;
  const {
    list,
    loading
  } = partner ? mine : all;
  const status = partner ? mine.status : allStatus;
  const now = useMtNowMon();
  const [pick, setPick] = React.useState(null);
  const [admin, setAdmin] = React.useState(false);
  const sites = list.filter(s => s.meter_model !== "none" || status && status[s.n]);
  const sel = pick == null ? null : sites.find(s => s.n === pick);
  const canEdit = s => isAdmin || !!(partner && s.owner === partner.id);
  if (sel) return React.createElement(MtMonDetail, {
    key: sel.n,
    s: sel,
    st: status && status[sel.n],
    isAdmin: isAdmin,
    canEdit: canEdit(sel),
    onBack: () => setPick(null)
  });
  if (admin && window.MtPartnerAdmin) return React.createElement(window.MtPartnerAdmin, {
    sites: list,
    onBack: () => setAdmin(false)
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
  }), !partner && React.createElement(MtStat, {
    label: "agent \u0E1A\u0E19 VPS",
    value: ag ? now - Date.parse(ag.at || ag.seen) < 5 * 60e3 ? "ปกติ" : "เงียบ" : "—",
    unit: "",
    sub: ag ? "ติดต่อล่าสุด " + new Date(ag.at || ag.seen).toLocaleTimeString("th-TH") + (ag.ver ? " · รุ่น v" + ag.ver : "") : "ยังไม่ได้ติดตั้ง"
  })), isAdmin && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end"
    }
  }, React.createElement("button", {
    className: "btn btn-soft",
    onClick: () => setAdmin(true),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "user",
    size: 14
  }), "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C / \u0E21\u0E2D\u0E1A\u0E44\u0E0B\u0E15\u0E4C")), loading ? React.createElement("div", {
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
  }, partner ? "ยังไม่มีไซต์ที่มอบให้บัญชีนี้ — ติดต่อแอดมิน" : "ยังไม่มีไซต์ — เพิ่มที่ ตั้งค่า → ไซต์ MikroTik")) : React.createElement(MtMonTable, {
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
window.MtSiteInfo = MtSiteInfo;