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
  const sumJs = JSON.stringify({
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
      pct: r.pct
    }))
  });
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const s = D.sumAc ? JSON.stringify({
      maxPct: D.sumAc.maxPct,
      bad: D.sumAc.bad,
      cables: D.sumAc.cables
    }) : "";
    if (s === sumJs) return;
    const t = setTimeout(() => store.patch({
      sumAc: Object.assign(JSON.parse(sumJs), {
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
    className: "p3-eb"
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
  }, ok.length ? "แรงดันตกถึง MDB สูงสุด " + pct(maxPct) + " · เกณฑ์ ≤ " + vdLim + "%" + (bad ? " · ไม่ผ่าน " + bad + " วงจร" : " · ผ่านทุกวงจร") : "ยังไม่มีระยะสาย")), !hasMdb && React.createElement("div", {
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
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E40\u0E2D\u0E07 (", nEdited, ")")), React.createElement("div", {
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
  }, "CB = \u0E02\u0E31\u0E49\u0E19\u0E41\u0E23\u0E01\u0E17\u0E35\u0E48 \u2265 Imax \xD7 1.25 (\u0E2A\u0E32\u0E22\u0E40\u0E21\u0E19\u0E15\u0E39\u0E49\u0E22\u0E48\u0E2D\u0E22 \xD7 1) \xB7 It = AT \xF7 (Ca \xD7 Cg \xD7 \u0E0A\u0E38\u0E14) \xB7 \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E32\u0E23\u0E32\u0E07 5-33 \u0E01\u0E25\u0E38\u0E48\u0E21 7 (XLPE 90\xB0C \u0E1A\u0E19\u0E23\u0E32\u0E07) \xB7 \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E01 = mV/A/m (\u0E10.3/\u0E10.4) \xD7 Imax \xF7 \u0E0A\u0E38\u0E14 \xD7 \u0E23\u0E30\u0E22\u0E30 \xF7 1000 \xB7 PE \u0E15\u0E32\u0E23\u0E32\u0E07 4-2 \xB7 \u0E23\u0E30\u0E22\u0E30\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 = \u0E08\u0E38\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2192 \u0E15\u0E39\u0E49 MDB \u0E41\u0E19\u0E27\u0E09\u0E32\u0E01 \xD7 1.1 + 2 \u0E21. \xB7 \u0E15\u0E39\u0E49\u0E22\u0E48\u0E2D\u0E22\u0E02\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C 5 \u0E21."));
}
Object.assign(window, {
  CcDcCard,
  CcAcCard,
  CcDd,
  CcNum,
  useCcStore
});