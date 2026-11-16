function useCcStore(jobId, ver) {
  const key = jobId ? "cableCalc/" + jobId + "/" + String(ver || "1") : null;
  const [data, setData] = React.useState(undefined);
  React.useEffect(() => {
    if (!key || !window.FBDB) {
      setData(null);
      return;
    }
    const ref = window.FBDB.ref(key);
    const h = ref.on("value", s => setData(s.val() || null), () => setData(null));
    return () => ref.off("value", h);
  }, [key]);
  const patch = React.useCallback(p => key && window.FBDB ? window.FBDB.ref(key).update(Object.assign({
    updatedAt: new Date().toISOString()
  }, p)) : Promise.resolve(), [key]);
  return {
    data,
    key,
    patch
  };
}
const ccCanon = x => Array.isArray(x) ? "[" + x.map(ccCanon).join(",") + "]" : x && typeof x === "object" ? "{" + Object.keys(x).sort().filter(k => x[k] != null && !(typeof x[k] === "number" && isNaN(x[k]))).map(k => k + ":" + ccCanon(x[k])).join(",") + "}" : JSON.stringify(x);
const CC_LIVE = {};
const ccLiveOf = (job, ver) => {
  const k = (job && job.id || "") + "/" + String(ver || "1");
  return CC_LIVE[k] = CC_LIVE[k] || {};
};
function useCcFold(name) {
  const k = "ccFold:" + name;
  const [fold, setFold] = React.useState(() => {
    try {
      return localStorage.getItem(k) === "1";
    } catch (e) {
      return false;
    }
  });
  const toggle = React.useCallback(e => {
    if (e && e.target && e.target.closest && e.target.closest("input,select,a")) return;
    setFold(v => {
      const n = !v;
      try {
        localStorage.setItem(k, n ? "1" : "0");
      } catch (er) {}
      return n;
    });
  }, [k]);
  return [fold, toggle];
}
const CC_EB_CLICK = {
  cursor: "pointer",
  userSelect: "none"
};
function CcFoldBtn({
  fold,
  onToggle
}) {
  return React.createElement("button", {
    type: "button",
    title: fold ? "ขยาย" : "ย่อ",
    "aria-label": fold ? "ขยาย" : "ย่อ",
    "aria-expanded": !fold,
    style: {
      marginLeft: 10,
      width: 26,
      height: 26,
      flex: "0 0 26px",
      borderRadius: "50%",
      border: "none",
      padding: 0,
      cursor: "pointer",
      display: "inline-grid",
      placeItems: "center",
      boxShadow: "var(--shadow-sm)",
      transition: "background .15s, color .15s",
      background: fold ? "var(--primary)" : "var(--primary-soft)",
      color: fold ? "#fff" : "var(--primary)"
    },
    onClick: e => {
      e.stopPropagation();
      onToggle();
    }
  }, React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      transform: fold ? "none" : "rotate(180deg)",
      transition: "transform .15s"
    }
  }, React.createElement("path", {
    d: "M4 6l4 4 4-4"
  })));
}
const ccBif = P => !!P && (P.bifacial === true || P.bifacial == null && /bifacial|BDV|BDB|HBD|DEG\d|JAM\d+D\d/i.test(String(P.model || "")));
function CcDcCard({
  job,
  ver,
  st,
  strings,
  paths,
  foot,
  panel,
  colorOf,
  invs,
  opt
}) {
  const CC = window.CC,
    B = window.BOQ || {},
    R = B.RULES || {};
  const store = useCcStore(job && job.id, ver);
  const D = store.data || {};
  const dcEdit = D.dc || {};
  const [draft, setDraft] = React.useState({});
  const [fold, toggleFold] = useCcFold("dc");
  const stations = React.useMemo(() => (st && st.obstacles || []).filter(o => o && o.p3sType === "invst").map(o => ({
    id: o.id,
    x: +o.x || 0,
    z: +o.z || 0,
    y: +o.y || 0
  })), [st]);
  const yOf = React.useMemo(() => {
    const m = {};
    (foot && foot.panels || []).forEach(q => {
      m[q.uid] = +q.cy || 0;
    });
    return m;
  }, [foot]);
  const jump = React.useMemo(() => {
    let L = 0;
    const q = (foot && foot.panels || [])[0];
    if (q) for (let i = 0; i < q.pts.length; i++) {
      const a = q.pts[i],
        b = q.pts[(i + 1) % q.pts.length];
      L = Math.max(L, Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    return (L || 2.4) * 1.25;
  }, [foot]);
  const spare = +R.pvSpare > 0 ? +R.pvSpare : 1.2;
  const est = React.useMemo(() => CC ? CC.dcRoutes((paths || []).map(p => ({
    id: p.id,
    pts: p.pts,
    ys: (p.uids || []).map(u => yOf[u] || 0)
  })), stations, {
    jump,
    spare
  }) : {}, [paths, stations, yOf, jump, spare]);
  const vdLim = +R.vdDc > 0 ? +R.vdDc : 3,
    minSize = +R.pvWireMin > 0 ? +R.pvWireMin : 4;
  const kDC = (+R.pvWireK || 1.25) * (ccBif(panel) ? +R.bifacialK || 1.1 : 1);
  const Ca = +D.ca > 0 ? +D.ca : 1,
    Cg = +D.cg > 0 ? +D.cg : 1;
  const mod = {
    vmp: +panel.vmp || 0,
    imp: +panel.imp || 0,
    isc: +panel.isc || 0
  };
  const optC = opt ? {
    per: +opt.per || 1,
    vOutMax: +opt.vOutMax || 0,
    iOutMax: +opt.iOutMax || 0,
    mpptMax: +opt.mpptMax || 0
  } : null;
  const optKey = optC ? [optC.per, optC.vOutMax, optC.iOutMax, optC.mpptMax].join() : "";
  const rows = React.useMemo(() => (strings || []).map(s => {
    const e = est[s.id],
      ed = dcEdit[s.id] || {};
    const len = +ed.len > 0 ? +ed.len : e ? e.len : NaN;
    const r = CC ? CC.dcString({
      n: s.n,
      len,
      ovr: ed.ovr
    }, mod, {
      kDC,
      ca: Ca,
      cg: Cg,
      vdLim,
      minSize,
      tempK: +R.pvWireTempK || 1,
      opt: optC
    }) : {};
    return Object.assign(r, {
      id: s.id,
      addr: s.addr,
      est: e ? e.len : null,
      edited: +ed.len > 0,
      ovr: ed.ovr || ""
    });
  }), [strings, est, D.dc, mod.vmp, mod.imp, mod.isc, kDC, Ca, Cg, vdLim, minSize, optKey]);
  const ok = rows.filter(r => r.valid);
  const maxPct = ok.length ? Math.max.apply(null, ok.map(r => r.pct || 0)) : 0;
  const bad = ok.filter(r => !r.ok).length;
  const perPole = Math.round(ok.reduce((t, r) => t + r.len, 0));
  const sizes = {},
    bySid = {};
  ok.forEach(r => {
    if (isFinite(r.use)) {
      sizes["mm" + r.use] = (sizes["mm" + r.use] || 0) + 1;
      bySid["s" + r.id] = r.use;
    }
  });
  const missing = rows.length - ok.length;
  const sumObj = {
      strings: ok.length,
      perPole,
      maxPct,
      sizes,
      bySid
    },
    sumJs = ccCanon(sumObj);
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const cur = D.sum ? ccCanon({
      strings: D.sum.strings,
      perPole: D.sum.perPole,
      maxPct: D.sum.maxPct,
      sizes: D.sum.sizes,
      bySid: D.sum.bySid
    }) : "";
    if (cur === sumJs) return;
    const t = setTimeout(() => store.patch({
      sum: Object.assign({}, sumObj, {
        at: new Date().toISOString()
      })
    }), 1500);
    return () => clearTimeout(t);
  }, [sumJs, store.data === undefined]);
  const setRow = (id, k, v) => {
    const cur = Object.assign({}, dcEdit[id] || {});
    if (v === "" || v == null) delete cur[k];else cur[k] = v;
    store.patch({
      ["dc/" + id]: Object.keys(cur).length ? cur : null
    });
  };
  const commitLen = id => {
    const v = draft[id];
    setDraft(d => {
      const n = Object.assign({}, d);
      delete n[id];
      return n;
    });
    if (v == null) return;
    const x = Math.round(+v * 10) / 10;
    const e = est[id];
    setRow(id, "len", x > 0 && !(e && x === e.len) ? x : "");
  };
  const resetAll = () => window.askConfirm({
    title: "คืนระยะสายที่แก้เองทั้งหมด?",
    body: "ทุกสตริงกลับไปใช้ระยะที่ระบบประมาณจากแบบ 3D และขนาดสายอัตโนมัติ",
    ok: "คืนค่า",
    danger: true
  }).then(y => {
    if (y) store.patch({
      dc: null
    });
  });
  ccLiveOf(job, ver).dc = {
    rows,
    kDC,
    Ca,
    Cg,
    vdLim,
    minSize,
    spare,
    mod,
    panel,
    invs: invs || [],
    tMin: +R.tMin || 15,
    bif: ccBif(panel),
    stations: stations.length,
    opt: opt || null
  };
  if (!CC || !strings || !strings.length) return null;
  const nEdited = Object.keys(dcEdit).length;
  const ovrs = rows.map(r => r.ovr === "" || r.ovr == null ? "" : String(r.ovr));
  const allOvr = ovrs.every(x => x === "") ? "auto" : ovrs.every(x => x === ovrs[0]) ? ovrs[0] : "mixed";
  const setAllOvr = v => {
    if (v === "mixed" || v === allOvr) return;
    const p = {};
    rows.forEach(r => {
      p["dc/" + r.id + "/ovr"] = v === "auto" ? null : +v;
    });
    store.patch(p);
  };
  const pct = v => isFinite(v) ? v.toFixed(2) + "%" : "—";
  const inp = {
    padding: "5px 7px",
    fontSize: 11.5,
    width: 66,
    textAlign: "right",
    fontFamily: "inherit"
  };
  return React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb",
    style: CC_EB_CLICK,
    onClick: toggleFold
  }, React.createElement(P3Icon, {
    name: "bolt",
    size: 13
  }), "\u0E2A\u0E32\u0E22 DC \u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E01", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600,
      color: bad ? "var(--tint-red-tx)" : undefined
    }
  }, ok.length ? "สูงสุด " + pct(maxPct) + " · เกณฑ์ ≤ " + vdLim + "%" + (bad ? " · ไม่ผ่าน " + bad + " สตริง" : " · ผ่านทุกสตริง") : "ยังไม่มีระยะสาย"), React.createElement(CcFoldBtn, {
    fold: fold,
    onToggle: toggleFold
  })), !fold && React.createElement(React.Fragment, null, !stations.length && React.createElement("div", {
    className: "su-alert info"
  }, React.createElement(P3Icon, {
    name: "bulb",
    size: 14
  }), React.createElement("span", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 ", React.createElement("b", null, "\u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), " \u0E43\u0E19\u0E41\u0E1A\u0E1A 3D \u2014 \u0E27\u0E32\u0E07\u0E17\u0E35\u0E48\u0E02\u0E31\u0E49\u0E19 \"\u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07\" (\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E44\u0E1F\u0E1F\u0E49\u0E32 \u203A \u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C) \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E23\u0E30\u0E22\u0E30\u0E2A\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E17\u0E38\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E23\u0E30\u0E22\u0E30\u0E40\u0E2D\u0E07\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "center",
      fontSize: 11.5,
      color: "var(--text-2)"
    }
  }, React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    title: "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E41\u0E27\u0E14\u0E25\u0E49\u0E2D\u0E21 (\u0E15\u0E32\u0E23\u0E32\u0E07 5-43 \u0E10\u0E32\u0E19 40\xB0C) \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22 PV \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E2D\u0E32\u0E01\u0E32\u0E28 60\xB0C \u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E14\u0E22\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B\u0E43\u0E0A\u0E49 1"
  }, "Ca ", React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.01",
    min: "0.3",
    max: "1.3",
    defaultValue: Ca,
    key: "ca" + Ca,
    style: inp,
    onBlur: e => {
      const v = +e.target.value;
      store.patch({
        ca: v > 0 && v !== 1 ? v : null
      });
    }
  })), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    title: "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E08\u0E31\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21 \u2014 \u0E2B\u0E25\u0E32\u0E22\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E43\u0E19\u0E17\u0E48\u0E2D/\u0E23\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E23\u0E49\u0E2D\u0E19\u0E41\u0E22\u0E48\u0E25\u0E07 (\u0E15\u0E32\u0E23\u0E32\u0E07 5-40 \u0E2B\u0E23\u0E37\u0E2D datasheet \u0E2A\u0E32\u0E22) \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 = 1"
  }, "Cg ", React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.01",
    min: "0.2",
    max: "1",
    defaultValue: Cg,
    key: "cg" + Cg,
    style: inp,
    onBlur: e => {
      const v = +e.target.value;
      store.patch({
        cg: v > 0 && v !== 1 ? v : null
      });
    }
  })), optC && optC.iOutMax > 0 ? React.createElement("span", {
    title: "\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21\u0E41\u0E1C\u0E07\u0E08\u0E33\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22\u0E08\u0E32\u0E01\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21"
  }, "\u0E21\u0E35\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21\u0E41\u0E1C\u0E07 ", opt.model || "", " \xB7 Id = Iout ", optC.iOutMax, " \xD7 ", Math.round(kDC * 1000) / 1000, " = ", React.createElement("b", null, Math.round(optC.iOutMax * kDC * 100) / 100, " A")) : React.createElement("span", null, "Id = Isc ", mod.isc, " \xD7 ", Math.round(kDC * 1000) / 1000, " = ", React.createElement("b", null, Math.round(mod.isc * kDC * 100) / 100, " A")), React.createElement("span", null, "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 ", minSize, " mm\xB2 \xB7 \u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E22\u0E30 \xD7", spare), React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    },
    title: "\u0E15\u0E31\u0E49\u0E07\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22 PV1-F \u0E43\u0E2B\u0E49\u0E17\u0E38\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 (\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E01/\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E41\u0E14\u0E07)"
  }, "\u0E17\u0E38\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07", React.createElement(CcDd, {
    value: allOvr,
    style: {
      width: 128
    },
    onChange: setAllOvr,
    options: (allOvr === "mixed" ? [{
      value: "mixed",
      label: "ผสม (แก้รายเส้น)"
    }] : []).concat([{
      value: "auto",
      label: "อัตโนมัติ"
    }]).concat(CC.PV.filter(p => p.s >= minSize && p.s <= 16).map(p => ({
      value: String(p.s),
      label: p.s + " mm² ทั้งหมด"
    })))
  })), React.createElement("span", {
    style: {
      flex: 1
    }
  }), nEdited > 0 && React.createElement("button", {
    className: "p3-lnk",
    onClick: resetAll
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07 (", nEdited, ")"), React.createElement(CcReportBtn, {
    job: job,
    ver: ver
  })), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E2A\u0E15\u0E23\u0E34\u0E07"), React.createElement("th", null, "INV / MPPT"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", {
    title: optC ? "ตัวคุมแผงกดแรงดันสตริงให้ไม่เกินช่วง MPPT ของอินเวอร์เตอร์ → กระแสสูงขึ้นตาม (ไม่เกิน Iout ของตัวคุม)" : "Vmp × จำนวนแผง · กระแส = Imp"
  }, optC ? "V / I ใช้งาน" : "Vmp สตริง"), React.createElement("th", {
    title: "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 L \u0E43\u0E19\u0E2A\u0E39\u0E15\u0E23 VD = 2 \xD7 Imp \xD7 R90 \xD7 L"
  }, "\u0E23\u0E30\u0E22\u0E30 L (\u0E21.)"), React.createElement("th", null, "\u0E2A\u0E32\u0E22 PV1-F"), React.createElement("th", {
    title: "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22 \xD7 Ca \xD7 Cg \xD7 \u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 \u0E15\u0E49\u0E2D\u0E07 \u2265 Id"
  }, "Iz (A)"), React.createElement("th", null, "VD (V)"), React.createElement("th", null, "%VD"), React.createElement("th", null, "\u0E1C\u0E25"))), React.createElement("tbody", null, rows.map(r => React.createElement("tr", {
    key: r.id
  }, React.createElement("td", null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: "var(--r-pill)",
      background: colorOf ? colorOf(r.id) : "var(--primary)"
    }
  }), React.createElement("b", null, "#", r.id))), React.createElement("td", {
    style: {
      whiteSpace: "nowrap"
    }
  }, r.addr || "—"), React.createElement("td", null, React.createElement("b", null, r.n)), React.createElement("td", {
    style: {
      whiteSpace: "nowrap"
    }
  }, isFinite(r.vStr) ? Math.round(r.vStr) + " V" : "—", optC && isFinite(r.iOp) ? " · " + r.iOp + " A" : ""), React.createElement("td", null, React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: "0.5",
    min: "0",
    style: Object.assign({}, inp, {
      fontWeight: r.edited ? 800 : 500,
      color: r.edited ? "var(--acd)" : undefined
    }),
    value: draft[r.id] != null ? draft[r.id] : isFinite(r.len) ? r.len : "",
    placeholder: r.est != null ? String(r.est) : "กรอก",
    title: r.edited ? "แก้เอง · ระบบประมาณได้ " + (r.est != null ? r.est + " ม." : "—") + " (ลบให้ว่างเพื่อใช้ค่าประมาณ)" : r.est != null ? "ประมาณจากแบบ 3D" : "ยังไม่มีจุดอินเวอร์เตอร์ — กรอกเอง",
    onChange: e => setDraft(d => Object.assign({}, d, {
      [r.id]: e.target.value
    })),
    onBlur: () => commitLen(r.id),
    onKeyDown: e => {
      if (e.key === "Enter") e.target.blur();
    }
  }), r.edited && React.createElement("span", {
    style: {
      marginLeft: 4,
      fontSize: 9.5,
      fontWeight: 800,
      color: "var(--acd)"
    }
  }, "\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07")), React.createElement("td", null, React.createElement(CcDd, {
    value: r.ovr,
    style: {
      width: 130
    },
    onChange: v => setRow(r.id, "ovr", v === "" ? "" : +v),
    options: [{
      value: "",
      label: isFinite(r.auto) ? "อัตโนมัติ · " + r.auto + " mm²" : "อัตโนมัติ · —"
    }].concat(CC.PV.filter(p => p.s >= 2.5 && p.s <= 16).map(p => ({
      value: String(p.s),
      label: p.s + " mm²"
    })))
  })), React.createElement("td", {
    style: {
      color: r.valid && !r.ampOk ? "var(--tint-red-tx)" : undefined
    }
  }, isFinite(r.iz) ? r.iz : "—"), React.createElement("td", null, isFinite(r.vd) ? r.vd : "—"), React.createElement("td", null, React.createElement("b", {
    style: {
      color: r.valid && !r.vdOk ? "var(--tint-red-tx)" : undefined
    }
  }, pct(r.pct))), React.createElement("td", null, !r.valid ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E2D\u0E23\u0E30\u0E22\u0E30") : r.ok ? React.createElement("span", {
    style: {
      color: "var(--tint-ok-tx)",
      fontWeight: 800
    }
  }, "\u0E1C\u0E48\u0E32\u0E19") : React.createElement("span", {
    style: {
      color: "var(--tint-red-tx)",
      fontWeight: 800
    },
    title: [!r.ampOk && "พิกัดกระแสไม่พอ", !r.vdOk && "แรงดันตกเกินเกณฑ์", !r.minOk && "เล็กกว่าขั้นต่ำ"].filter(Boolean).join(" · ")
  }, "\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19"))))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      borderTop: "1px solid var(--ln)",
      paddingTop: 9
    }
  }, React.createElement("span", {
    className: "p3-stat"
  }, "\u0E2A\u0E32\u0E22 PV \u0E15\u0E48\u0E2D\u0E02\u0E31\u0E49\u0E27 ", React.createElement("b", null, perPole.toLocaleString()), " \u0E21."), React.createElement("span", {
    className: "p3-stat"
  }, "\u0E41\u0E14\u0E07 + \u0E14\u0E33 ", React.createElement("b", null, (perPole * 2).toLocaleString()), " \u0E21."), Object.keys(sizes).sort((a, b) => a.slice(2) - b.slice(2)).map(s => React.createElement("span", {
    key: s,
    className: "p3-stat"
  }, s.slice(2), " mm\xB2 ", React.createElement("b", null, sizes[s]), " \u0E2A\u0E15\u0E23\u0E34\u0E07")), missing > 0 && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E30\u0E22\u0E30 ", React.createElement("b", null, missing), " \u0E2A\u0E15\u0E23\u0E34\u0E07")), React.createElement("span", {
    className: "p3-note"
  }, "\u0E23\u0E30\u0E22\u0E30 = (\u0E2A\u0E32\u0E22 + \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07\u0E41\u0E23\u0E01 + \u0E2A\u0E32\u0E22 \u2212 \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22 \u0E16\u0E36\u0E07\u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E2A\u0E38\u0E14 \u0E40\u0E14\u0E34\u0E19\u0E41\u0E19\u0E27\u0E09\u0E32\u0E01 + \u0E25\u0E07\u0E08\u0E32\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 + \u0E2A\u0E32\u0E22\u0E02\u0E49\u0E32\u0E21\u0E41\u0E16\u0E27) \xF7 2 \xD7 \u0E40\u0E1C\u0E37\u0E48\u0E2D ", spare, " \xB7", optC ? "มีตัวคุมแผง: V ใช้งาน = ต่ำสุดของ (Vmp × แผง, ตัวคุม × Vout สูงสุด, MPPT สูงสุดของอินเวอร์เตอร์) · I = กำลังสตริง ÷ V (ไม่เกิน Iout) · VD = 2 × I × R90 × L · %VD เทียบ V ใช้งาน ·" : "VD = 2 × Imp × R90 × L · %VD เทียบ Vmp × จำนวนแผง ·", " R90 = 1.275 \xD7 R20 (\u0E2A\u0E32\u0E22 PV class 5) \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22 EN 50618 (\u0E40\u0E17\u0E35\u0E22\u0E1A datasheet \u0E1C\u0E39\u0E49\u0E1C\u0E25\u0E34\u0E15\u0E2A\u0E32\u0E22) \xB7 \u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E23\u0E27\u0E21\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49 BOQ \u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49 (\u0E2B\u0E19\u0E49\u0E32 BOQ \u203A \u0E2A\u0E32\u0E22\u0E44\u0E1F PV)")));
}
const ccDdStyle = {
  fontSize: 11.5,
  fontWeight: 600,
  padding: "5px 8px",
  borderRadius: 8,
  boxShadow: "var(--shadow-inset)",
  minWidth: 0
};
function CcDd({
  value,
  options,
  onChange,
  style
}) {
  const Dd = window.Dropdown;
  const v = String(value == null ? "" : value);
  if (Dd) return React.createElement(Dd, {
    value: v,
    options: options,
    onChange: onChange,
    style: Object.assign({}, ccDdStyle, style)
  });
  return React.createElement("select", {
    className: "p3-inp",
    style: Object.assign({}, ccDdStyle, style),
    value: v,
    onChange: e => onChange(e.target.value)
  }, options.map(o => React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)));
}
function CcNum({
  value,
  placeholder,
  onCommit,
  width,
  bold,
  title,
  step
}) {
  const [d, setD] = React.useState(null);
  return React.createElement("input", {
    className: "p3-inp",
    type: "number",
    step: step || "any",
    min: "0",
    title: title,
    style: {
      padding: "5px 7px",
      fontSize: 11.5,
      width: width || 62,
      textAlign: "right",
      fontFamily: "inherit",
      fontWeight: bold ? 800 : 500,
      color: bold ? "var(--acd)" : undefined
    },
    value: d != null ? d : value != null && isFinite(value) ? value : "",
    placeholder: placeholder,
    onChange: e => setD(e.target.value),
    onBlur: () => {
      if (d == null) return;
      const x = d;
      setD(null);
      onCommit(x === "" ? null : +x);
    },
    onKeyDown: e => {
      if (e.key === "Enter") e.target.blur();
    }
  });
}
const CC_ARR = [{
  value: "Trefoil",
  label: "สามเหลี่ยม (Trefoil)"
}, {
  value: "Flat",
  label: "แนวราบชิดกัน"
}, {
  value: "Spaced",
  label: "แนวราบเว้นระยะ"
}];
function CcAcCard({
  job,
  ver,
  st,
  invs
}) {
  const CC = window.CC,
    R = (window.BOQ || {}).RULES || {};
  const store = useCcStore(job && job.id, ver);
  const D = store.data || {},
    A = D.ac || {},
    E = A.rows || {};
  const [fold, toggleFold] = useCcFold("ac");
  const vdLim = +R.vdAc > 0 ? +R.vdAc : 3;
  const ta = +A.ta > 0 ? +A.ta : 40,
    cgm = A.cgm || "L-2D",
    arr = A.arr || "Trefoil";
  const obs = st && st.obstacles || [];
  const hasMdb = !!obs.find(o => o && o.p3sType === "mdb");
  const hasXfObj = !!obs.find(o => o && o.p3sType === "xfmr");
  const est = React.useMemo(() => {
    const ivs = obs.filter(o => o && o.p3sType === "invst"),
      mdb = obs.find(o => o && o.p3sType === "mdb");
    if (!mdb || !ivs.length) return {
      inv: 5
    };
    const d = Math.min.apply(null, ivs.map(o => Math.abs((+o.x || 0) - (+mdb.x || 0)) + Math.abs((+o.z || 0) - (+mdb.z || 0))));
    return {
      inv: 5,
      feed: Math.ceil(d * 1.1 + 2)
    };
  }, [st]);
  const plan = React.useMemo(() => CC && CC.acPlan ? CC.acPlan(invs, {
    edits: E,
    ta,
    cgm,
    arr,
    vdLim,
    est
  }) : {
    rows: [],
    boards: []
  }, [JSON.stringify(invs), JSON.stringify(E), ta, cgm, arr, vdLim, est]);
  const rows = plan.rows,
    ok = rows.filter(r => r.valid);
  const maxPct = ok.length ? Math.max.apply(null, ok.map(r => r.pctTotal || 0)) : 0;
  const bad = ok.filter(r => !r.ok).length;
  const xf = A.xf || null,
    xr = xf && CC && +xf.kva > 0 ? CC.xfmr(+xf.kva, +xf.hv || 22000, +xf.lv || 400, +xf.z || 6) : null;
  const sumObj = {
      maxPct,
      bad,
      cables: ok.map(r => ({
        id: r.id,
        from: r.from,
        to: r.to,
        cable: r.cable,
        len: r.len,
        at: r.at,
        af: r.af,
        pe: r.pe,
        pct: r.pct,
        ct: r.ct,
        use: r.use,
        n: r.n,
        sys: r.sys
      }))
    },
    sumJs = ccCanon(sumObj);
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const s = D.sumAc ? ccCanon({
      maxPct: D.sumAc.maxPct,
      bad: D.sumAc.bad,
      cables: D.sumAc.cables
    }) : "";
    if (s === sumJs) return;
    const t = setTimeout(() => store.patch({
      sumAc: Object.assign({}, sumObj, {
        at: new Date().toISOString()
      })
    }), 1500);
    return () => clearTimeout(t);
  }, [sumJs, store.data === undefined]);
  const setA = (k, v) => store.patch({
    ["ac/" + k]: v === "" || v == null ? null : v
  });
  const setRow = (id, k, v) => {
    const cur = Object.assign({}, E[id] || {});
    if (v === "" || v == null) delete cur[k];else cur[k] = v;
    store.patch({
      ["ac/rows/" + id]: Object.keys(cur).length ? cur : null
    });
  };
  const resetAll = () => window.askConfirm({
    title: "คืนค่าสาย AC ที่แก้เองทั้งหมด?",
    body: "ปลายทาง ระยะ ขนาดสาย ชุดขนาน ทุกวงจรกลับไปใช้ค่าที่ระบบคิดให้",
    ok: "คืนค่า",
    danger: true
  }).then(y => {
    if (y) store.patch({
      "ac/rows": null
    });
  });
  ccLiveOf(job, ver).ac = {
    rows,
    ta,
    cgm,
    arr,
    vdLim,
    xf,
    xr,
    ca: CC.ca(ta)
  };
  if (!CC || !CC.acPlan || !rows.length) return null;
  const nEdited = Object.keys(E).length;
  const boardOpts = ["MDB", "SMDB-1", "SMDB-2", "SMDB-3"].map(b => ({
    value: b,
    label: b
  }));
  const sizeOpts = r => [{
    value: "",
    label: isFinite(r.auto) ? "อัตโนมัติ · " + r.auto : "อัตโนมัติ · —"
  }].concat(CC.SIZES.filter(s => s >= 2.5).map(s => ({
    value: String(s),
    label: s + " mm²"
  })));
  const cgOpts = Object.keys(CC.CG).map(k => ({
    value: k,
    label: k + " · " + CC.CG[k].th
  }));
  const red = {
    color: "var(--tint-red-tx)"
  };
  const pct = v => isFinite(v) ? v.toFixed(2) + "%" : "—";
  const lab = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6
  };
  return React.createElement("div", {
    className: "p3-card"
  }, React.createElement("span", {
    className: "p3-eb",
    style: CC_EB_CLICK,
    onClick: toggleFold
  }, React.createElement(P3Icon, {
    name: "bolt",
    size: 13
  }), "\u0E2A\u0E32\u0E22 AC \xB7 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2192 \u0E15\u0E39\u0E49 \u2192 MDB", React.createElement("span", {
    className: "ln"
  }), React.createElement("span", {
    style: {
      fontWeight: 600,
      color: bad ? "var(--tint-red-tx)" : undefined
    }
  }, ok.length ? "แรงดันตกถึง MDB สูงสุด " + pct(maxPct) + " · เกณฑ์ ≤ " + vdLim + "%" + (bad ? " · ไม่ผ่าน " + bad + " วงจร" : " · ผ่านทุกวงจร") : "ยังไม่มีระยะสาย"), React.createElement(CcFoldBtn, {
    fold: fold,
    onToggle: toggleFold
  })), !fold && React.createElement(React.Fragment, null, !hasMdb && React.createElement("div", {
    className: "su-alert info"
  }, React.createElement(P3Icon, {
    name: "bulb",
    size: 14
  }), React.createElement("span", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35 ", React.createElement("b", null, "\u0E15\u0E39\u0E49 MDB"), " \u0E43\u0E19\u0E41\u0E1A\u0E1A 3D \u2014 \u0E27\u0E32\u0E07\u0E17\u0E35\u0E48\u0E02\u0E31\u0E49\u0E19 \"\u0E2A\u0E34\u0E48\u0E07\u0E1A\u0E14\u0E1A\u0E31\u0E07\" \u203A \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E44\u0E1F\u0E1F\u0E49\u0E32 (\u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A\u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C) \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13\u0E23\u0E30\u0E22\u0E30\u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19\u0E43\u0E2B\u0E49 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E23\u0E2D\u0E01\u0E23\u0E30\u0E22\u0E30\u0E40\u0E2D\u0E07\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "center",
      fontSize: 11.5,
      color: "var(--text-2)"
    }
  }, React.createElement("label", {
    style: lab,
    title: "\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E41\u0E27\u0E14\u0E25\u0E49\u0E2D\u0E21\u0E17\u0E35\u0E48\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22 \u2192 \u0E15\u0E31\u0E27\u0E04\u0E39\u0E13 Ca \u0E15\u0E32\u0E23\u0E32\u0E07 5-43 (\u0E10\u0E32\u0E19 40\xB0C)"
  }, "\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34", React.createElement(CcNum, {
    value: ta,
    width: 52,
    onCommit: v => setA("ta", v > 0 && v !== 40 ? v : null)
  }), "\xB0C \xB7 Ca ", CC.ca(ta)), React.createElement("label", {
    style: lab,
    title: "\u0E15\u0E31\u0E27\u0E04\u0E39\u0E13\u0E08\u0E31\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21 Cg \u0E15\u0E32\u0E23\u0E32\u0E07 5-40 (\u0E2A\u0E32\u0E22\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E1A\u0E19\u0E23\u0E32\u0E07) \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E27\u0E07\u0E08\u0E23\u0E43\u0E19\u0E23\u0E32\u0E07\u0E19\u0E31\u0E1A\u0E08\u0E32\u0E01\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E02\u0E49\u0E32\u0E15\u0E39\u0E49\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19"
  }, "\u0E23\u0E32\u0E07\u0E2A\u0E32\u0E22", React.createElement(CcDd, {
    value: cgm,
    options: cgOpts,
    onChange: v => setA("cgm", v === "L-2D" ? null : v),
    style: {
      width: 250
    }
  })), React.createElement("label", {
    style: lab,
    title: "\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E27\u0E32\u0E07\u0E2A\u0E32\u0E22\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27 \u2192 \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C mV/A/m \u0E15\u0E32\u0E23\u0E32\u0E07 \u0E10.3"
  }, "\u0E08\u0E31\u0E14\u0E27\u0E32\u0E07", React.createElement(CcDd, {
    value: arr,
    options: CC_ARR,
    onChange: v => setA("arr", v === "Trefoil" ? null : v),
    style: {
      width: 170
    }
  })), React.createElement("span", {
    style: {
      flex: 1
    }
  }), nEdited > 0 && React.createElement("button", {
    className: "p3-lnk",
    onClick: resetAll
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07 (", nEdited, ")"), React.createElement(CcReportBtn, {
    job: job,
    ver: ver
  })), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E27\u0E07\u0E08\u0E23"), React.createElement("th", null, "\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07"), React.createElement("th", {
    title: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 \xB7 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \xD7 1.25 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C \xB7 \u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19\u0E15\u0E39\u0E49\u0E22\u0E48\u0E2D\u0E22 \xD7 1"
  }, "Imax (A)"), React.createElement("th", null, "CB AT/AF"), React.createElement("th", {
    title: "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 (\u0E21.)"
  }, "\u0E23\u0E30\u0E22\u0E30 (\u0E21.)"), React.createElement("th", {
    title: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E38\u0E14\u0E40\u0E14\u0E34\u0E19\u0E02\u0E19\u0E32\u0E19"
  }, "\u0E0A\u0E38\u0E14"), React.createElement("th", null, "\u0E41\u0E01\u0E19"), React.createElement("th", null, "\u0E02\u0E19\u0E32\u0E14 mm\xB2"), React.createElement("th", {
    title: "It = AT \xF7 (Ca \xD7 Cg \xD7 \u0E0A\u0E38\u0E14) \xB7 Iz = \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E32\u0E23\u0E32\u0E07 5-33 \xD7 Ca \xD7 Cg \xD7 \u0E0A\u0E38\u0E14 \u0E15\u0E49\u0E2D\u0E07 \u2265 AT"
  }, "It / Iz"), React.createElement("th", {
    title: "mV/A/m \u0E15\u0E32\u0E23\u0E32\u0E07 \u0E10.3/\u0E10.4"
  }, "mV/A/m"), React.createElement("th", null, "%VD"), React.createElement("th", {
    title: "\u0E23\u0E27\u0E21\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E16\u0E36\u0E07 MDB (\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C + \u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19\u0E15\u0E39\u0E49\u0E22\u0E48\u0E2D\u0E22)"
  }, "\u0E16\u0E36\u0E07 MDB"), React.createElement("th", {
    title: "\u0E2A\u0E32\u0E22\u0E14\u0E34\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07 4-2 (mm\xB2)"
  }, "PE"), React.createElement("th", null, "\u0E2A\u0E32\u0E22"), React.createElement("th", null, "\u0E1C\u0E25"))), React.createElement("tbody", null, rows.map(r => {
    const e = E[r.id] || {};
    return React.createElement("tr", {
      key: r.id,
      style: r.kind === "feed" ? {
        background: "var(--surface2)"
      } : undefined
    }, React.createElement("td", {
      style: {
        whiteSpace: "nowrap"
      }
    }, React.createElement("b", null, r.label), r.model ? React.createElement("div", {
      style: {
        fontSize: 10,
        color: "var(--text-3)"
      }
    }, r.model) : null), React.createElement("td", null, r.kind === "inv" ? React.createElement(CcDd, {
      value: r.to,
      options: boardOpts,
      onChange: v => setRow(r.id, "to", v),
      style: {
        width: 96
      }
    }) : "MDB"), React.createElement("td", null, isFinite(r.imax) ? Math.round(r.imax * 10) / 10 : "—"), React.createElement("td", {
      style: {
        whiteSpace: "nowrap"
      }
    }, isFinite(r.at) ? r.at + "/" + r.af : "—"), React.createElement("td", {
      style: {
        whiteSpace: "nowrap"
      }
    }, React.createElement(CcNum, {
      value: r.edited ? r.len : null,
      placeholder: r.est != null ? String(r.est) : "กรอก",
      bold: r.edited,
      title: r.edited ? "แก้เอง · ประมาณได้ " + (r.est != null ? r.est + " ม." : "—") + " (ลบให้ว่างเพื่อใช้ค่าประมาณ)" : r.est != null ? "ประมาณจากแบบ 3D" : "กรอกระยะ",
      onCommit: v => setRow(r.id, "len", v > 0 && v !== r.est ? v : null)
    })), React.createElement("td", null, React.createElement(CcNum, {
      value: +e.n > 1 ? +e.n : null,
      placeholder: "1",
      width: 42,
      step: "1",
      onCommit: v => setRow(r.id, "n", v > 1 ? Math.round(v) : null)
    })), React.createElement("td", null, React.createElement(CcDd, {
      value: r.ct,
      options: [{
        value: "1C",
        label: "แกนเดียว"
      }, {
        value: "MC",
        label: "หลายแกน"
      }],
      onChange: v => setRow(r.id, "ct", v),
      style: {
        width: 96
      }
    })), React.createElement("td", null, React.createElement(CcDd, {
      value: e.ovr != null ? String(e.ovr) : "",
      options: sizeOpts(r),
      onChange: v => setRow(r.id, "ovr", v === "" ? null : +v),
      style: {
        width: 124
      }
    })), React.createElement("td", {
      style: {
        whiteSpace: "nowrap",
        color: r.valid && !r.ampOk ? "var(--tint-red-tx)" : undefined
      }
    }, isFinite(r.it) ? Math.round(r.it) : "—", " / ", isFinite(r.iz) ? Math.round(r.iz) : "—"), React.createElement("td", null, r.mv != null ? r.mv : "—"), React.createElement("td", null, React.createElement("b", {
      style: r.valid && !r.vdOk ? red : undefined
    }, pct(r.pct))), React.createElement("td", {
      style: r.valid && r.pctTotal > vdLim ? red : undefined
    }, pct(r.pctTotal)), React.createElement("td", {
      style: {
        whiteSpace: "nowrap"
      }
    }, isFinite(r.pe) ? r.pe : "—"), React.createElement("td", {
      style: {
        whiteSpace: "nowrap",
        fontWeight: 700
      }
    }, r.cable || "—"), React.createElement("td", null, !r.valid ? React.createElement("span", {
      style: {
        color: "var(--text-3)"
      }
    }, "\u0E23\u0E2D\u0E23\u0E30\u0E22\u0E30") : r.ok ? React.createElement("span", {
      style: {
        color: "var(--tint-ok-tx)",
        fontWeight: 800
      }
    }, "\u0E1C\u0E48\u0E32\u0E19") : React.createElement("span", {
      style: {
        color: "var(--tint-red-tx)",
        fontWeight: 800
      },
      title: [!r.ampOk && "พิกัดกระแสไม่พอ", !r.vdOk && "แรงดันตกเกินเกณฑ์", !r.peOk && "สายดินเล็กกว่าตาราง 4-2"].filter(Boolean).join(" · ")
    }, "\u0E44\u0E21\u0E48\u0E1C\u0E48\u0E32\u0E19")));
  })))), hasXfObj || xf ? React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "center",
      fontSize: 11.5,
      color: "var(--text-2)"
    }
  }, React.createElement("b", {
    style: {
      color: "var(--text)"
    }
  }, "\u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07"), React.createElement("label", {
    style: lab
  }, "kVA ", React.createElement(CcNum, {
    value: xf && +xf.kva,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 1000",
    width: 74,
    onCommit: v => setA("xf/kva", v)
  })), React.createElement("label", {
    style: lab
  }, "HV ", React.createElement(CcNum, {
    value: xf && +xf.hv,
    placeholder: "22000",
    width: 70,
    onCommit: v => setA("xf/hv", v)
  }), "V"), React.createElement("label", {
    style: lab
  }, "LV ", React.createElement(CcNum, {
    value: xf && +xf.lv,
    placeholder: "400",
    width: 56,
    onCommit: v => setA("xf/lv", v)
  }), "V"), React.createElement("label", {
    style: lab
  }, "%Z ", React.createElement(CcNum, {
    value: xf && +xf.z,
    placeholder: "6",
    width: 48,
    onCommit: v => setA("xf/z", v)
  })), xr && React.createElement(React.Fragment, null, React.createElement("span", {
    className: "p3-stat"
  }, "In HV ", React.createElement("b", null, xr.inHv), " A"), React.createElement("span", {
    className: "p3-stat"
  }, "In LV ", React.createElement("b", null, xr.inLv.toLocaleString()), " A"), React.createElement("span", {
    className: "p3-stat"
  }, "Ib HV \xD71.25 ", React.createElement("b", null, xr.ibHv), " A"), React.createElement("span", {
    className: "p3-stat",
    title: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23\u0E14\u0E49\u0E32\u0E19 LV = In LV \xD7 100 \xF7 %Z \xB7 \u0E43\u0E0A\u0E49\u0E40\u0E0A\u0E47\u0E01\u0E04\u0E48\u0E32 Icu \u0E02\u0E2D\u0E07\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C"
  }, "Isc LV ", React.createElement("b", null, xr.iscLv), " kA"))) : React.createElement("div", null, React.createElement("button", {
    className: "p3-lnk",
    onClick: () => setA("xf/z", 6)
  }, "+ \u0E04\u0E33\u0E19\u0E27\u0E13\u0E2B\u0E21\u0E49\u0E2D\u0E41\u0E1B\u0E25\u0E07")), React.createElement("span", {
    className: "p3-note"
  }, "CB = \u0E02\u0E31\u0E49\u0E19\u0E41\u0E23\u0E01\u0E17\u0E35\u0E48 \u2265 Imax \xD7 1.25 (\u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19\u0E15\u0E39\u0E49\u0E22\u0E48\u0E2D\u0E22 \xD7 1) \xB7 It = AT \xF7 (Ca \xD7 Cg \xD7 \u0E0A\u0E38\u0E14) \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E32\u0E23\u0E32\u0E07 5-33 \u0E01\u0E25\u0E38\u0E48\u0E21 7 (XLPE 90\xB0C \u0E1A\u0E19\u0E23\u0E32\u0E07) \xB7 \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E01 = mV/A/m (\u0E10.3/\u0E10.4) \xD7 Imax \xF7 \u0E0A\u0E38\u0E14 \xD7 \u0E23\u0E30\u0E22\u0E30 \xF7 1000 \xB7 PE \u0E15\u0E32\u0E23\u0E32\u0E07 4-2 \xB7 \u0E23\u0E30\u0E22\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 = \u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2192 \u0E15\u0E39\u0E49 MDB \u0E41\u0E19\u0E27\u0E09\u0E32\u0E01 \xD7 1.1 + 2 \u0E21. \xB7 \u0E15\u0E39\u0E49\u0E22\u0E48\u0E2D\u0E22\u0E02\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C 5 \u0E21.")));
}
const ccEsc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
})[c]);
const ccF = (v, d) => isFinite(v) && v !== null && v !== "" ? (+v).toLocaleString("en-US", {
  minimumFractionDigits: d || 0,
  maximumFractionDigits: d == null ? 2 : d
}) : "—";
function ccThDate(d) {
  const M = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return d.getDate() + " " + M[d.getMonth()] + " " + (d.getFullYear() + 543);
}
function ccReportHTML(job, ver, L) {
  job = job || {};
  const B = window.BRANDING || {},
    dc = L.dc || null,
    ac = L.ac || null,
    now = new Date();
  const title = window.rpFileName ? window.rpFileName(job, "CC") : "CC " + (job.code || "");
  let logo = "";
  try {
    logo = new URL(B.docMark || "dashboard/assets/flashplussolar-mark.png", location.href).href;
  } catch (e) {
    logo = "";
  }
  const ok = b => b ? '<b class="ok">ผ่าน</b>' : '<b class="ng">ไม่ผ่าน</b>';
  const tbl = (head, rows, cls) => '<table class="t ' + (cls || "") + '"><thead><tr>' + head.map(h => "<th>" + h + "</th>").join("") + "</tr></thead><tbody>" + rows.map(r => "<tr" + (r.cls ? ' class="' + r.cls + '"' : "") + ">" + (r.c || r).map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
  const kv = rows => '<table class="kv">' + rows.filter(x => x && x[1] !== "" && x[1] != null).map(x => "<tr><td>" + x[0] + "</td><td>" + x[1] + "</td></tr>").join("") + "</table>";
  const sec = (no, t) => '<h2><span>' + no + "</span>" + t + "</h2>";
  let n = 0,
    body = "";
  body += sec(++n, "ข้อมูลโครงการและเกณฑ์ออกแบบ");
  body += '<div class="two">' + kv([["โครงการ", ccEsc([job.code, job.name].filter(Boolean).join(" · "))], ["สถานที่", ccEsc([job.address, job.province].filter(Boolean).join(" "))], ["ขนาดระบบ", job.kw ? ccF(job.kw) + " kWp" : ""], ["แบบ 3D เวอร์ชัน", ccEsc(String(ver || "1"))]]) + kv([["มาตรฐานอ้างอิง", "วสท. 022001-22 (มาตรฐานการติดตั้งทางไฟฟ้าฯ พ.ศ. 2564) · IEC 62548 · EN 50618 (สาย PV)"], ["แรงดันตกสาย DC", dc ? "≤ " + dc.vdLim + "% ต่อสตริง" : ""], ["แรงดันตกสาย AC", ac ? "≤ " + ac.vdLim + "% ต่อวงจร" : ""], ["สาย DC ขนาดเล็กสุด", dc ? dc.minSize + " mm² (PV1-F / H1Z2Z2-K)" : ""]]) + "</div>";
  if (dc && dc.rows && dc.rows.length) {
    const P = dc.panel || {},
      m = dc.mod || {};
    const ns = Array.from(new Set(dc.rows.map(r => r.n).filter(x => x > 0))).sort((a, b) => b - a);
    const tc = +P.tcVoc < 0 ? +P.tcVoc : -0.25;
    const vmaxInv = Math.min.apply(null, (dc.invs || []).map(x => +x.maxVdc).filter(x => x > 0).concat([Infinity]));
    const O = dc.opt;
    if (O) {
      body += sec(++n, "ตัวคุมแผง (Optimizer) ต่อสตริง");
      body += '<p class="f">' + ccEsc(O.model || "ตัวคุมแผง") + " · " + (+O.per || 1) + " แผง/ตัว · Vout สูงสุด " + ccF(O.vOutMax, 0) + " V · Iout สูงสุด " + ccF(O.iOutMax, 1) + " A" + (+O.vOff > 0 ? " · แรงดันตอนสั่งปิด " + O.vOff + " V/ตัว" : "") + " — แรงดันสตริงถูกตัวคุมจำกัดให้อยู่ในช่วงของอินเวอร์เตอร์ จึงไม่คิด Voc × จำนวนแผง</p>";
      body += tbl(["แผงต่อสตริง", "ตัวคุม (ตัว)", "ช่วงที่คู่มือกำหนด", "แรงดันตอนสั่งปิด (V)", "แรงดันสูงสุดอินเวอร์เตอร์ (V)", "ผล"], ns.map(k => {
        const u = Math.ceil(k / Math.max(1, +O.per || 1)),
          off = u * (+O.vOff || 0);
        const inR = (!(+O.minPerStr > 0) || u >= +O.minPerStr) && (!(+O.maxPerStr > 0) || u <= +O.maxPerStr);
        const okOff = !(isFinite(vmaxInv) && off > vmaxInv);
        return [k, u, (+O.minPerStr > 0 ? O.minPerStr : "—") + " – " + (+O.maxPerStr > 0 ? O.maxPerStr : "—"), +O.vOff > 0 ? ccF(off, 1) : "—", isFinite(vmaxInv) ? ccF(vmaxInv, 0) : "—", ok(inR && okOff)];
      }));
    } else {
      body += sec(++n, "แรงดันวงจรเปิดสูงสุดของสตริง (Voc ที่อุณหภูมิต่ำสุด)");
      body += '<p class="f">Voc,max = จำนวนแผง × Voc × [1 + (β/100) × (Tmin − 25)] · β = ' + tc + " %/°C · Tmin = " + dc.tMin + " °C</p>";
      body += tbl(["แผงต่อสตริง", "Voc แผง (V)", "Voc,max สตริง (V)", "แรงดันสูงสุดอินเวอร์เตอร์ (V)", "ผล"], ns.map(k => {
        const v = window.CC.vocMax(k, +P.voc, tc, dc.tMin);
        return [k, ccF(P.voc, 2), ccF(v, 1), isFinite(vmaxInv) ? ccF(vmaxInv, 0) : "—", isFinite(vmaxInv) ? ok(v <= vmaxInv) : "—"];
      }));
    }
    body += sec(++n, "สายไฟ DC ต่อสตริง (แผง → อินเวอร์เตอร์)");
    body += kv([["แผง", ccEsc(P.model || "") + " · Vmp " + ccF(m.vmp, 2) + " V · Imp " + ccF(m.imp, 2) + " A · Isc " + ccF(m.isc, 2) + " A" + (dc.bif ? " · สองหน้า" : "")], ["กระแสออกแบบ", O && +O.iOutMax > 0 ? "Id = Iout ตัวคุม × " + ccF(dc.kDC, 3) + " = " + ccF(O.iOutMax * dc.kDC, 2) + " A" : "Id = Isc × " + ccF(dc.kDC, 3) + " = " + ccF(m.isc * dc.kDC, 2) + " A" + (dc.bif ? " (รวมตัวคูณแผงสองหน้า)" : "")], ["ตัวคูณ", "Ca = " + dc.Ca + " · Cg = " + dc.Cg], ["ระยะสาย", dc.stations ? "ประมาณจากแบบ 3D (แผงแรก/แผงสุดท้าย → จุดอินเวอร์เตอร์ แนวฉาก + ลงหลังคา + สายข้ามแถว) ÷ 2 × เผื่อ " + dc.spare + " · ช่องที่มี * = แก้ตามหน้างาน" : "กรอกตามหน้างาน"]]);
    body += '<p class="f">R90 = R20 × (1 + 0.00393 × 70) ≈ 1.275 × R20 · ' + (O ? "V ใช้งาน = ต่ำสุดของ (Vmp × แผง, ตัวคุม × Vout สูงสุด, MPPT สูงสุดอินเวอร์เตอร์ " + ccF(O.mpptMax, 0) + " V) · I = Vmp × Imp × แผง ÷ V ใช้งาน (ไม่เกิน Iout) · VD = 2 × I × R90 × L ÷ 1000 · %VD = VD ÷ V ใช้งาน × 100" : "VD = 2 × Imp × R90 × L ÷ 1000 · %VD = VD ÷ (Vmp × จำนวนแผง) × 100") + " · Iz = พิกัดสาย × Ca × Cg ≥ Id</p>";
    body += tbl(["สตริง", "INV / MPPT", "แผง", O ? "V / I ใช้งาน" : "Vmp สตริง (V)", "L (ม.)", "สาย (mm²)", "R90 (Ω/km)", "Iz (A)", "VD (V)", "%VD", "ผล"], dc.rows.map(r => ["#" + r.id, ccEsc(r.addr || "—"), r.n, O ? ccF(r.vStr, 0) + " V · " + ccF(r.iOp, 2) + " A" : ccF(r.vStr, 0), isFinite(r.len) ? ccF(r.len, 1) + (r.edited ? "*" : "") : "—", isFinite(r.use) ? r.use : "—", ccF(r.r90, 3), ccF(r.iz, 1), ccF(r.vd, 2), isFinite(r.pct) ? ccF(r.pct, 2) + "%" : "—", r.valid ? ok(r.ok) : "รอระยะ"]), "sm");
    const v = dc.rows.filter(r => r.valid),
      per = Math.round(v.reduce((t, r) => t + r.len, 0));
    body += '<p class="sum">สรุป: ' + v.length + " สตริง · %VD สูงสุด <b>" + ccF(Math.max.apply(null, v.map(r => r.pct).concat([0])), 2) + "%</b> · ความยาวสายต่อขั้ว " + ccF(per, 0) + " ม. (แดง + ดำ " + ccF(per * 2, 0) + " ม.)" + (v.some(r => !r.ok) ? ' · <b class="ng">มีสตริงไม่ผ่าน</b>' : "") + "</p>";
  }
  if (ac && ac.rows && ac.rows.length) {
    const cgTh = (window.CC.CG[ac.cgm] || {}).th || ac.cgm;
    body += sec(++n, "สายไฟ AC (อินเวอร์เตอร์ → ตู้ย่อย → MDB)");
    body += kv([["สภาพการเดินสาย", "สาย XLPE 90°C (CV) บนราง · " + ccEsc(cgTh) + " · จัดวาง " + ({
      Trefoil: "สามเหลี่ยม",
      Flat: "แนวราบชิดกัน",
      Spaced: "แนวราบเว้นระยะ"
    }[ac.arr] || ac.arr)], ["อุณหภูมิแวดล้อม", ac.ta + " °C → Ca = " + ac.ca + " (ตาราง 5-43)"]]);
    body += '<p class="f">AT = ขั้นแรกที่ ≥ Imax × 1.25 (สายเมนตู้ย่อย × 1) · It = AT ÷ (Ca × Cg × ชุด) · Iz = พิกัดตาราง 5-33 × Ca × Cg × ชุด ≥ AT · VD = mV/A/m (ตาราง ฐ.3/ฐ.4) × (Imax ÷ ชุด) × L ÷ 1000 · สายดิน (PE) ตาราง 4-2</p>';
    body += tbl(["วงจร", "Imax (A)", "AT/AF", "Cg", "It (A)", "สาย", "Iz (A)", "L (ม.)", "mV/A/m", "%VD", "ถึง MDB", "PE (mm²)", "ผล"], ac.rows.map(r => ({
      cls: r.kind === "feed" ? "fd" : "",
      c: [ccEsc(r.from + " → " + r.to), ccF(r.imax, 1), isFinite(r.at) ? r.at + "/" + r.af : "—", ccF(r.cg, 2), ccF(r.it, 1), ccEsc(r.cable || "—"), ccF(r.iz, 1), isFinite(r.len) ? ccF(r.len, 1) + (r.edited ? "*" : "") : "—", r.mv != null ? r.mv : "—", isFinite(r.pct) ? ccF(r.pct, 2) + "%" : "—", isFinite(r.pctTotal) ? ccF(r.pctTotal, 2) + "%" : "—", ccF(r.pe, 0), r.valid ? ok(r.ok) : "รอระยะ"]
    })), "sm");
    if (ac.xr) {
      const x = ac.xf || {};
      body += sec(++n, "หม้อแปลง");
      body += '<p class="f">In = kVA × 1000 ÷ (√3 × V) · Isc(LV) = In(LV) × 100 ÷ %Z</p>';
      body += tbl(["ขนาด (kVA)", "HV / LV (V)", "%Z", "In HV (A)", "Ib HV × 1.25 (A)", "In LV (A)", "Isc LV (kA)"], [[ccF(x.kva, 0), ccF(+x.hv || 22000, 0) + " / " + ccF(+x.lv || 400, 0), ccF(+x.z || 6, 1), ccF(ac.xr.inHv, 2), ccF(ac.xr.ibHv, 2), ccF(ac.xr.inLv, 2), ccF(ac.xr.iscLv, 2)]]);
    }
  }
  const sign = t => '<div class="sg"><div class="ln"></div><div>(' + "&nbsp;".repeat(46) + ')</div><b>' + t + '</b><div class="lic">เลขทะเบียนใบอนุญาต ................................</div><div>วันที่ ........../........../..........</div></div>';
  const css = "@page{size:A4 portrait;margin:12mm 11mm 14mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}" + "body{margin:0;font-family:'IBM Plex Sans Thai',sans-serif;color:#15211A;font-size:10px;background:#fff}" + ".hd{display:flex;align-items:center;gap:12px;border-bottom:2.5px solid #1B9B75;padding-bottom:8px;margin-bottom:6px}.hd img{height:38px}" + ".hd .t{flex:1}.hd h1{margin:0;font-size:17px;letter-spacing:.01em}.hd .e{font-size:10px;color:#4A5A51;letter-spacing:.06em}.hd .r{text-align:right;font-size:9.5px;color:#4A5A51;line-height:1.5}" + "h2{font-size:12px;margin:14px 0 6px;display:flex;align-items:center;gap:7px;break-after:avoid}h2 span{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:5px;background:#1B9B75;color:#fff;font-size:10.5px}" + ".two{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}table.kv{border-collapse:collapse;margin-bottom:3px}table.kv td{padding:2px 10px 2px 0;vertical-align:top;font-size:10px}table.kv td:first-child{color:#6A7A71;white-space:nowrap}" + "p.f{margin:5px 0 6px;padding:5px 9px;background:#F3F6F4;border-radius:6px;font-size:9.5px;color:#334139;line-height:1.55}" + "table.t{width:100%;border-collapse:collapse;margin:3px 0}table.t th{background:#1B5E4A;color:#fff;font-weight:700;font-size:9px;padding:4px 4px;text-align:center}" + "table.t td{padding:3px 4px;border-bottom:1px solid #E1E8E4;text-align:center;font-variant-numeric:tabular-nums;font-size:9.5px}table.t tr{break-inside:avoid}" + "table.sm td,table.sm th{font-size:8.6px;padding:3px 3px}tr.fd td{background:#EEF4F0;font-weight:700}" + "b.ok{color:#15803D}b.ng{color:#B91C1C}p.sum{margin:5px 0 0;font-size:10px}" + ".sgs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px;break-inside:avoid}.sg{text-align:center;font-size:9.5px;line-height:1.75}.sg .ln{border-bottom:1px dotted #333;height:34px;margin:0 8px 4px}.sg b{font-size:10.5px}.sg .lic{color:#4A5A51}" + ".ft{margin-top:14px;font-size:8.5px;color:#7A8A81;display:flex;justify-content:space-between;border-top:1px solid #E1E8E4;padding-top:5px}";
  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + ccEsc(title) + "</title>" + '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet"><style>' + css + "</style></head><body>" + '<div class="hd">' + (logo ? '<img src="' + ccEsc(logo) + '" alt="">' : "") + '<div class="t"><h1>รายการคำนวณขนาดสายไฟฟ้าและแรงดันตก</h1><div class="e">CABLE SIZING &amp; VOLTAGE DROP CALCULATION</div></div>' + '<div class="r">' + ccEsc(B.legalTH || B.legal || "") + "<br>เอกสาร " + ccEsc(title) + "<br>วันที่ " + ccThDate(now) + "</div></div>" + body + '<div class="sgs">' + sign("ผู้คำนวณ") + sign("ผู้ตรวจสอบ") + sign("ผู้อนุมัติ (วิศวกรไฟฟ้า)") + "</div>" + '<div class="ft"><span>* = ระยะที่แก้ตามหน้างาน · ตัวเลขจากหน้าออกแบบระบบ ณ วันที่ออกเอกสาร</span><span>' + ccEsc(B.legal || "") + "</span></div></body></html>";
}
function CcReportBtn({
  job,
  ver
}) {
  const [html, setHtml] = React.useState(null);
  const open = () => setHtml(ccReportHTML(job, ver, ccLiveOf(job, ver)));
  return React.createElement(React.Fragment, null, React.createElement("button", {
    className: "p3-lnk",
    onClick: open,
    title: "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E22 DC + AC \u0E41\u0E22\u0E01\u0E44\u0E1F\u0E25\u0E4C A4 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E0A\u0E48\u0E2D\u0E07\u0E25\u0E07\u0E19\u0E32\u0E21",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "var(--acd)"
    }
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 13
  }), "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E22 (PDF)"), html && window.SuReportView && ReactDOM.createPortal(React.createElement(window.SuReportView, {
    html: html,
    title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E04\u0E33\u0E19\u0E27\u0E13\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E41\u0E25\u0E30\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E01",
    onClose: () => setHtml(null)
  }), document.body));
}
Object.assign(window, {
  useCcFold,
  CcFoldBtn,
  CC_EB_CLICK,
  CcDcCard,
  CcAcCard,
  CcDd,
  CcNum,
  CcReportBtn,
  useCcStore,
  ccReportHTML
});