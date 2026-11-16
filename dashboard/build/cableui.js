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
const ccBif = P => !!P && (P.bifacial === true || P.bifacial == null && /bifacial|BDV|BDB|HBD|DEG\d|JAM\d+D\d/i.test(String(P.model || "")));
function CcDcCard({
  job,
  ver,
  st,
  strings,
  paths,
  foot,
  panel,
  colorOf
}) {
  const CC = window.CC,
    B = window.BOQ || {},
    R = B.RULES || {};
  const store = useCcStore(job && job.id, ver);
  const D = store.data || {};
  const dcEdit = D.dc || {};
  const [draft, setDraft] = React.useState({});
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
      tempK: +R.pvWireTempK || 1
    }) : {};
    return Object.assign(r, {
      id: s.id,
      addr: s.addr,
      est: e ? e.len : null,
      edited: +ed.len > 0,
      ovr: ed.ovr || ""
    });
  }), [strings, est, D.dc, mod.vmp, mod.imp, mod.isc, kDC, Ca, Cg, vdLim, minSize]);
  const ok = rows.filter(r => r.valid);
  const maxPct = ok.length ? Math.max.apply(null, ok.map(r => r.pct || 0)) : 0;
  const bad = ok.filter(r => !r.ok).length;
  const perPole = Math.round(ok.reduce((t, r) => t + r.len, 0));
  const sizes = {};
  ok.forEach(r => {
    if (isFinite(r.use)) sizes[r.use] = (sizes[r.use] || 0) + 1;
  });
  const missing = rows.length - ok.length;
  const sumJs = JSON.stringify({
    strings: ok.length,
    perPole,
    maxPct,
    sizes
  });
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const cur = D.sum ? JSON.stringify({
      strings: D.sum.strings,
      perPole: D.sum.perPole,
      maxPct: D.sum.maxPct,
      sizes: D.sum.sizes
    }) : "";
    if (cur === sumJs) return;
    const t = setTimeout(() => store.patch({
      sum: Object.assign(JSON.parse(sumJs), {
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
  if (!CC || !strings || !strings.length) return null;
  const nEdited = Object.keys(dcEdit).length;
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
    className: "p3-eb"
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
  }, ok.length ? "สูงสุด " + pct(maxPct) + " · เกณฑ์ ≤ " + vdLim + "%" + (bad ? " · ไม่ผ่าน " + bad + " สตริง" : " · ผ่านทุกสตริง") : "ยังไม่มีระยะสาย")), !stations.length && React.createElement("div", {
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
  })), React.createElement("span", null, "Id = Isc ", mod.isc, " \xD7 ", Math.round(kDC * 1000) / 1000, " = ", React.createElement("b", null, Math.round(mod.isc * kDC * 100) / 100, " A")), React.createElement("span", null, "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 ", minSize, " mm\xB2 \xB7 \u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E23\u0E30\u0E22\u0E30 \xD7", spare), React.createElement("span", {
    style: {
      flex: 1
    }
  }), nEdited > 0 && React.createElement("button", {
    className: "p3-lnk",
    onClick: resetAll
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07 (", nEdited, ")")), React.createElement("div", {
    className: "su-scroll"
  }, React.createElement("table", {
    className: "su-tb"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "\u0E2A\u0E15\u0E23\u0E34\u0E07"), React.createElement("th", null, "INV / MPPT"), React.createElement("th", null, "\u0E41\u0E1C\u0E07"), React.createElement("th", null, "Vmp \u0E2A\u0E15\u0E23\u0E34\u0E07"), React.createElement("th", {
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
  }, r.addr || "—"), React.createElement("td", null, React.createElement("b", null, r.n)), React.createElement("td", null, isFinite(r.vStr) ? Math.round(r.vStr) + " V" : "—"), React.createElement("td", null, React.createElement("input", {
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
  }, "\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07")), React.createElement("td", null, React.createElement("select", {
    className: "p3-inp",
    style: {
      padding: "5px 7px",
      fontSize: 11.5
    },
    value: r.ovr,
    onChange: e => setRow(r.id, "ovr", e.target.value === "" ? "" : +e.target.value)
  }, React.createElement("option", {
    value: ""
  }, isFinite(r.auto) ? "อัตโนมัติ · " + r.auto + " mm²" : "อัตโนมัติ · —"), CC.PV.filter(p => p.s >= 2.5 && p.s <= 16).map(p => React.createElement("option", {
    key: p.s,
    value: p.s
  }, p.s, " mm\xB2")))), React.createElement("td", {
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
  }, "\u0E41\u0E14\u0E07 + \u0E14\u0E33 ", React.createElement("b", null, (perPole * 2).toLocaleString()), " \u0E21."), Object.keys(sizes).sort((a, b) => a - b).map(s => React.createElement("span", {
    key: s,
    className: "p3-stat"
  }, s, " mm\xB2 ", React.createElement("b", null, sizes[s]), " \u0E2A\u0E15\u0E23\u0E34\u0E07")), missing > 0 && React.createElement("span", {
    className: "p3-stat",
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E30\u0E22\u0E30 ", React.createElement("b", null, missing), " \u0E2A\u0E15\u0E23\u0E34\u0E07")), React.createElement("span", {
    className: "p3-note"
  }, "\u0E23\u0E30\u0E22\u0E30 = (\u0E2A\u0E32\u0E22 + \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07\u0E41\u0E23\u0E01 + \u0E2A\u0E32\u0E22 \u2212 \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22 \u0E16\u0E36\u0E07\u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E43\u0E01\u0E25\u0E49\u0E2A\u0E38\u0E14 \u0E40\u0E14\u0E34\u0E19\u0E41\u0E19\u0E27\u0E09\u0E32\u0E01 + \u0E25\u0E07\u0E08\u0E32\u0E01\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 + \u0E2A\u0E32\u0E22\u0E02\u0E49\u0E32\u0E21\u0E41\u0E16\u0E27) \xF7 2 \xD7 \u0E40\u0E1C\u0E37\u0E48\u0E2D ", spare, " \xB7 VD = 2 \xD7 Imp \xD7 R90 \xD7 L \xB7 R90 = 1.275 \xD7 R20 (\u0E2A\u0E32\u0E22 PV class 5) \xB7 %VD \u0E40\u0E17\u0E35\u0E22\u0E1A Vmp \xD7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07 \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22 EN 50618 (\u0E40\u0E17\u0E35\u0E22\u0E1A datasheet \u0E1C\u0E39\u0E49\u0E1C\u0E25\u0E34\u0E15\u0E2A\u0E32\u0E22) \xB7 \u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E23\u0E27\u0E21\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E49 BOQ \u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49 (\u0E2B\u0E19\u0E49\u0E32 BOQ \u203A \u0E2A\u0E32\u0E22\u0E44\u0E1F PV)"));
}
Object.assign(window, {
  CcDcCard,
  useCcStore
});