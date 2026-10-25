(function fsInjectChartCss() {
  if (document.getElementById("fs-chart-css")) return;
  const el = document.createElement("style");
  el.id = "fs-chart-css";
  el.textContent = "@keyframes fsGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}" + ".fs-grow{transform-box:fill-box;transform-origin:50% 100%;animation:fsGrow .7s cubic-bezier(.2,.8,.2,1) both}" + "@keyframes fsDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}.fs-draw{stroke-dasharray:1;animation:fsDraw 1.2s ease both}" + "@keyframes fsFade{from{opacity:0}to{opacity:1}}.fs-fade{animation:fsFade 1s ease both}" + "@keyframes fsPulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(3.2);opacity:0}}" + ".fs-pulse{transform-box:fill-box;transform-origin:center;animation:fsPulse 1.8s ease-out infinite}" + "@keyframes fsDrop{to{stroke-dashoffset:-20}}.fs-drop{stroke-dasharray:5 15;animation:fsDrop .8s linear infinite}" + "@keyframes fsWide{from{transform:scaleX(0)}to{transform:scaleX(1)}}.fs-wide{transform-box:fill-box;transform-origin:0 50%;animation:fsWide .8s cubic-bezier(.2,.8,.2,1) both}" + "@media (prefers-reduced-motion: reduce){.fs-grow,.fs-draw,.fs-fade,.fs-pulse,.fs-drop,.fs-wide{animation:none!important}}";
  document.head.appendChild(el);
})();
function useFsWidth(def) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(def);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || def));
    ro.observe(el);
    setW(el.clientWidth || def);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
function fsMonoPath(P) {
  const n = P.length;
  if (n < 2) return n ? "M" + P[0][0] + "," + P[0][1] : "";
  const dx = [],
    m = [],
    t = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = P[i + 1][0] - P[i][0];
    m[i] = (P[i + 1][1] - P[i][1]) / dx[i];
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = "M" + P[0][0] + "," + P[0][1];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += "C" + (P[i][0] + h) + "," + (P[i][1] + h * t[i]) + " " + (P[i + 1][0] - h) + "," + (P[i + 1][1] - h * t[i + 1]) + " " + P[i + 1][0] + "," + P[i + 1][1];
  }
  return d;
}
function FsTrendChart({
  mode,
  bars,
  unit,
  avg,
  avgLabel,
  height,
  empty
}) {
  const [ref, w] = useFsWidth(640);
  const [hov, setHov] = React.useState(null);
  const [table, setTable] = React.useState(false);
  const uid = React.useMemo(() => "fst" + Math.random().toString(36).slice(2, 8), []);
  const area = mode === "area";
  const vals = bars.map(b => b.value).filter(v => v != null);
  const H = height || 210,
    padL = 40,
    padR = 8,
    padT = 28,
    padB = 26;
  const plotW = Math.max(60, w - padL - padR),
    plotH = H - padT - padB;
  const max = fsNice(Math.max.apply(null, vals.concat([avg || 0, 0])) * 1.06);
  const n = Math.max(1, bars.length),
    step = plotW / n;
  const X = i => padL + step * i + step / 2;
  const Y = v => padT + plotH * (1 - Math.max(0, v) / max);
  const base = Y(0);
  const every = Math.max(area ? 2 : 1, Math.ceil(n * (area ? 46 : 34) / plotW));
  const fmtTick = v => max >= 10000 ? fsFmt(v / 1000, 1) + "k" : fsFmt(v, max < 10 ? 1 : 0);
  const sun = "var(--fs-sun)";
  const bw = Math.max(4, Math.min(22, step * 0.6));
  const tog = vals.length > 0 && React.createElement("button", {
    type: "button",
    onClick: () => setTable(!table),
    style: {
      position: "absolute",
      top: 0,
      right: 0,
      border: "none",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      borderRadius: "var(--r-chip)",
      padding: "3px 10px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-2)",
      cursor: "pointer",
      fontFamily: "inherit",
      zIndex: 2
    }
  }, table ? "กราฟ" : "ตาราง");
  const grid = [0, 0.5, 1].map(f => React.createElement("g", {
    key: f
  }, React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: Y(max * f),
    y2: Y(max * f),
    style: {
      stroke: "var(--divider)",
      strokeWidth: 1,
      strokeDasharray: f ? "2 4" : "none"
    }
  }), React.createElement("text", {
    x: padL - 8,
    y: Y(max * f) + 3.5,
    textAnchor: "end",
    style: {
      fill: "var(--text-3)",
      fontSize: 10,
      fontFamily: "var(--mono)"
    }
  }, vals.length ? fmtTick(max * f) : "")));
  const track = i => React.createElement("rect", {
    key: "t" + i,
    x: X(i) - bw / 2,
    y: padT,
    width: bw,
    height: plotH,
    rx: bw / 2,
    style: {
      fill: "color-mix(in srgb, var(--fs-sun) 9%, var(--surface2))"
    }
  });
  if (!vals.length) {
    const gp = [];
    for (let i = 0; i <= 24; i++) {
      const f = i / 24;
      gp.push([padL + plotW * f, padT + plotH * (1 - 0.82 * Math.exp(-Math.pow((f - 0.5) / 0.21, 2)))]);
    }
    return React.createElement("div", {
      ref: ref,
      style: {
        position: "relative",
        height: H
      }
    }, React.createElement("svg", {
      width: w,
      height: H,
      style: {
        display: "block"
      },
      "aria-hidden": "true"
    }, grid, area ? React.createElement("path", {
      d: fsMonoPath(gp),
      fill: "none",
      style: {
        stroke: "var(--border-strong)",
        strokeWidth: 2,
        strokeDasharray: "5 7",
        strokeLinecap: "round"
      }
    }) : bars.map((b, i) => track(i))), React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: "0 16px"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        maxWidth: 440,
        padding: "9px 15px",
        borderRadius: 14,
        background: "var(--surface)",
        boxShadow: "var(--shadow-card)",
        fontSize: 12,
        color: "var(--text-2)",
        lineHeight: 1.45
      }
    }, React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background: "color-mix(in srgb, var(--fs-sun) 16%, var(--surface))"
      }
    }, React.createElement(Icon, {
      name: "clock",
      size: 15,
      color: sun
    })), empty || "ยังไม่มีข้อมูล")));
  }
  if (table) return React.createElement("div", {
    ref: ref,
    style: {
      position: "relative",
      paddingTop: 26
    }
  }, tog, React.createElement("div", {
    style: {
      maxHeight: H + 30,
      overflowY: "auto",
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    }
  }, bars.filter(b => b.value != null).map((b, i) => React.createElement("div", {
    key: b.k,
    style: {
      display: "flex",
      padding: "6px 12px",
      fontSize: 12,
      borderTop: i ? "1px solid var(--divider)" : "none"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      color: "var(--text-2)"
    }
  }, b.tip && b.tip[0] || b.label, b.partial ? " (ยังไม่จบ)" : ""), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, fsFmt(b.value, 1), " ", unit)))));
  const hb = hov != null ? bars[hov] : null;
  const tipX = hov != null ? Math.min(Math.max(X(hov), 90), w - 90) : 0;
  const nowI = bars.findIndex(b => b.partial && b.value != null);
  let peak = -1;
  bars.forEach((b, i) => {
    if (b.value != null && !b.partial && (peak < 0 || b.value > bars[peak].value)) peak = i;
  });
  const segs = [];
  if (area) {
    let cur = [];
    bars.forEach((b, i) => {
      if (b.value != null) cur.push([X(i), Y(b.value)]);else if (cur.length) {
        segs.push(cur);
        cur = [];
      }
    });
    if (cur.length) segs.push(cur);
  }
  return React.createElement("div", {
    ref: ref,
    style: {
      position: "relative",
      width: "100%"
    },
    onMouseLeave: () => setHov(null)
  }, tog, React.createElement("svg", {
    width: w,
    height: H,
    style: {
      display: "block",
      overflow: "visible"
    },
    role: "img",
    "aria-label": "กราฟการผลิต " + unit
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: uid + "a",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0",
    style: {
      stopColor: "var(--fs-sun)",
      stopOpacity: 0.42
    }
  }), React.createElement("stop", {
    offset: "1",
    style: {
      stopColor: "var(--fs-sun)",
      stopOpacity: 0
    }
  })), React.createElement("linearGradient", {
    id: uid + "b",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0",
    style: {
      stopColor: "var(--fs-sun)"
    }
  }), React.createElement("stop", {
    offset: "1",
    style: {
      stopColor: "color-mix(in srgb, var(--fs-sun) 62%, var(--surface))"
    }
  })), React.createElement("pattern", {
    id: uid + "h",
    width: "6",
    height: "6",
    patternUnits: "userSpaceOnUse",
    patternTransform: "rotate(45)"
  }, React.createElement("rect", {
    width: "6",
    height: "6",
    style: {
      fill: "color-mix(in srgb, var(--fs-sun) 30%, var(--surface))"
    }
  }), React.createElement("rect", {
    width: "2.6",
    height: "6",
    style: {
      fill: "var(--fs-sun)"
    }
  })), React.createElement("filter", {
    id: uid + "g",
    x: "-5%",
    y: "-40%",
    width: "110%",
    height: "180%"
  }, React.createElement("feGaussianBlur", {
    stdDeviation: "4"
  }))), area ? grid : bars.map((b, i) => track(i)), !area && grid.map(g => React.cloneElement(g, {
    style: {
      pointerEvents: "none"
    }
  })), React.createElement("text", {
    x: 0,
    y: 10,
    textAnchor: "start",
    style: {
      fill: "var(--text-3)",
      fontSize: 10,
      fontWeight: 700
    }
  }, unit), area && segs.map((s, k) => {
    const d = fsMonoPath(s);
    return React.createElement("g", {
      key: k
    }, s.length > 1 && React.createElement("path", {
      d: d + "L" + s[s.length - 1][0] + "," + base + "L" + s[0][0] + "," + base + "Z",
      className: "fs-fade",
      style: {
        fill: "url(#" + uid + "a)"
      }
    }), s.length > 1 && React.createElement("path", {
      d: d,
      pathLength: "1",
      fill: "none",
      className: "fs-draw",
      style: {
        stroke: sun,
        strokeWidth: 7,
        opacity: 0.4,
        filter: "url(#" + uid + "g)"
      }
    }), s.length > 1 && React.createElement("path", {
      d: d,
      pathLength: "1",
      fill: "none",
      className: "fs-draw",
      style: {
        stroke: sun,
        strokeWidth: 2.6,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    }), s.length === 1 && React.createElement("circle", {
      cx: s[0][0],
      cy: s[0][1],
      r: 3.5,
      style: {
        fill: sun
      }
    }));
  }), area && nowI >= 0 && React.createElement("g", null, React.createElement("line", {
    x1: X(nowI),
    x2: X(nowI),
    y1: Y(bars[nowI].value) + 6,
    y2: base,
    style: {
      stroke: sun,
      strokeWidth: 1.2,
      strokeDasharray: "2 3",
      opacity: 0.7
    }
  }), React.createElement("circle", {
    cx: X(nowI),
    cy: Y(bars[nowI].value),
    r: 5,
    className: "fs-pulse",
    style: {
      fill: sun
    }
  }), React.createElement("circle", {
    cx: X(nowI),
    cy: Y(bars[nowI].value),
    r: 5,
    style: {
      fill: sun,
      stroke: "var(--surface)",
      strokeWidth: 2.5
    }
  })), !area && bars.map((b, i) => {
    if (b.value == null) return null;
    const y = Y(b.value),
      hgt = Math.max(bw, base - y),
      on = hov === i;
    return React.createElement("rect", {
      key: b.k,
      x: X(i) - bw / 2,
      y: base - hgt,
      width: bw,
      height: hgt,
      rx: bw / 2,
      className: "fs-grow",
      style: {
        fill: "url(#" + uid + (b.partial ? "h" : "b") + ")",
        opacity: hov != null && !on ? 0.45 : 1,
        transition: "opacity .12s",
        animationDelay: Math.min(i * 18, 500) + "ms",
        filter: on ? "drop-shadow(0 4px 8px color-mix(in srgb, var(--fs-sun) 45%, transparent))" : "none"
      }
    });
  }), !area && peak >= 0 && hov == null && React.createElement("text", {
    x: X(peak),
    y: Y(bars[peak].value) - 7,
    textAnchor: "middle",
    style: {
      fill: "var(--text-1)",
      fontSize: 10.5,
      fontWeight: 800,
      fontFamily: "var(--mono)"
    }
  }, fsFmt(bars[peak].value, bars[peak].value >= 100 ? 0 : 1)), !area && avg > 0 && React.createElement("g", {
    style: {
      pointerEvents: "none"
    }
  }, React.createElement("line", {
    x1: padL,
    x2: w - padR,
    y1: Y(avg),
    y2: Y(avg),
    style: {
      stroke: "var(--text-2)",
      strokeWidth: 1.3,
      strokeDasharray: "5 4"
    }
  }), React.createElement("rect", {
    x: w - padR - 92,
    y: Y(avg) - 19,
    width: 92,
    height: 16,
    rx: 8,
    style: {
      fill: "var(--surface)",
      filter: "drop-shadow(0 1px 2px rgba(0,0,0,.15))"
    }
  }), React.createElement("text", {
    x: w - padR - 46,
    y: Y(avg) - 7.5,
    textAnchor: "middle",
    style: {
      fill: "var(--text-2)",
      fontSize: 10,
      fontWeight: 700
    }
  }, avgLabel || "เฉลี่ย", " ", fsFmt(avg, avg >= 100 ? 0 : 1))), hb && area && hb.value != null && React.createElement("g", {
    style: {
      pointerEvents: "none"
    }
  }, React.createElement("line", {
    x1: X(hov),
    x2: X(hov),
    y1: padT - 4,
    y2: base,
    style: {
      stroke: "var(--text-3)",
      strokeWidth: 1
    }
  }), React.createElement("circle", {
    cx: X(hov),
    cy: Y(hb.value),
    r: 4.5,
    style: {
      fill: "var(--surface)",
      stroke: sun,
      strokeWidth: 2.5
    }
  })), bars.map((b, i) => {
    const isNow = area && i === nowI;
    if (!isNow && !(i % every === 0 && (n - 1 - i >= every || i === n - 1)) && hov !== i) return null;
    if (!isNow && area && nowI >= 0 && Math.abs(i - nowI) < every && hov !== i) return null;
    return React.createElement("text", {
      key: "l" + b.k,
      x: X(i),
      y: H - 7,
      textAnchor: "middle",
      style: {
        fill: isNow ? sun : hov === i ? "var(--text-1)" : "var(--text-3)",
        fontSize: 10,
        fontWeight: isNow || hov === i ? 800 : 500
      }
    }, isNow ? "ตอนนี้" : area ? b.label + ":00" : b.label);
  }), bars.map((b, i) => React.createElement("rect", {
    key: "h" + b.k,
    x: padL + step * i,
    y: 0,
    width: step,
    height: H,
    style: {
      fill: "transparent"
    },
    onMouseEnter: () => setHov(i),
    onTouchStart: () => setHov(i)
  }))), hb && React.createElement("div", {
    style: {
      position: "absolute",
      left: tipX,
      top: hb.value != null ? Math.max(0, Y(hb.value) - 70) : 0,
      transform: "translateX(-50%)",
      pointerEvents: "none",
      background: "var(--surface)",
      boxShadow: "var(--shadow-pop)",
      borderRadius: "var(--r-tile)",
      padding: "7px 11px",
      fontSize: 11.5,
      whiteSpace: "nowrap",
      zIndex: 3
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 1
    }
  }, hb.tip && hb.tip[0] || hb.label, hb.partial ? " · ยังไม่จบ" : ""), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-1)",
      fontFamily: "var(--mono)",
      fontWeight: 800,
      fontSize: 13
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 4,
      background: sun
    }
  }), hb.value == null ? "ไม่มีข้อมูล" : fsFmt(hb.value, 1) + " " + unit), (hb.tip || []).slice(1).map((t, i) => React.createElement("div", {
    key: i,
    style: {
      color: "var(--text-3)"
    }
  }, t))));
}
function FsEnergyBalance({
  self,
  exp,
  imp,
  compact
}) {
  const [ref, w] = useFsWidth(560);
  const s = Math.max(0, self || 0),
    e = Math.max(0, exp || 0),
    m = Math.max(0, imp || 0),
    hasUse = imp != null;
  const span = e + s + (hasUse ? m : 0) || 1,
    k = w / span;
  const bh = compact ? 24 : 30,
    rib = compact ? 30 : 40,
    lh = 22;
  const y1 = lh,
    y2 = y1 + bh + rib,
    H = hasUse ? y2 + bh + lh : y1 + bh + 4;
  const xs = e * k,
    xe = (e + s) * k;
  const E = v => fsEnergy(v).join(" ");
  const pct = (v, t) => t > 0 ? Math.round(v / t * 100) + "%" : "";
  const seg = (key, x0, x1, y, color, label, delay) => {
    const g = 3,
      a = x0 + (x0 > 0.5 ? g / 2 : 0),
      b = x1 - (x1 < w - 0.5 ? g / 2 : 0),
      ww = Math.max(3, b - a);
    return React.createElement("g", {
      key: key
    }, React.createElement("rect", {
      x: a,
      y: y,
      width: ww,
      height: bh,
      rx: Math.min(9, bh / 2),
      className: "fs-wide",
      style: {
        fill: color,
        animationDelay: delay + "ms"
      }
    }), ww > 40 && React.createElement("text", {
      x: a + ww / 2,
      y: y + bh / 2 + 4,
      textAnchor: "middle",
      style: {
        fill: "#fff",
        fontSize: 11.5,
        fontWeight: 800,
        pointerEvents: "none"
      }
    }, label));
  };
  const lines = [];
  if (hasUse && xe - xs > 8) {
    const nL = Math.max(1, Math.min(6, Math.floor((xe - xs) / 26)));
    for (let i = 0; i < nL; i++) lines.push(xs + (xe - xs) * (i + 0.5) / nL);
  }
  const pv = e + s,
    use = s + m;
  return React.createElement("div", {
    ref: ref,
    style: {
      position: "relative",
      width: "100%"
    }
  }, React.createElement("svg", {
    width: w,
    height: H,
    style: {
      display: "block",
      overflow: "visible"
    },
    role: "img",
    "aria-label": "ผลิต " + E(pv) + " ใช้เอง " + E(s) + " ขาย " + E(e) + (hasUse ? " ซื้อ " + E(m) : "")
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "fsBalRib",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0",
    style: {
      stopColor: "var(--fs-self)",
      stopOpacity: 0.32
    }
  }), React.createElement("stop", {
    offset: "0.5",
    style: {
      stopColor: "var(--fs-self)",
      stopOpacity: 0.14
    }
  }), React.createElement("stop", {
    offset: "1",
    style: {
      stopColor: "var(--fs-self)",
      stopOpacity: 0.32
    }
  }))), React.createElement("text", {
    x: 0,
    y: 14,
    style: {
      fill: "var(--text-2)",
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C\u0E1C\u0E25\u0E34\u0E15 ", React.createElement("tspan", {
    style: {
      fill: "var(--text-1)",
      fontWeight: 800
    }
  }, E(pv))), seg("e", 0, xs, y1, "var(--fs-exp)", pct(e, pv), 0), seg("s1", xs, xe, y1, "var(--fs-self)", pct(s, pv), 120), hasUse && React.createElement("g", null, React.createElement("rect", {
    x: xs + 1.5,
    y: y1 + bh + 3,
    width: Math.max(2, xe - xs - 3),
    height: rib - 6,
    rx: 4,
    className: "fs-fade",
    style: {
      fill: "url(#fsBalRib)"
    }
  }), lines.map((x, i) => React.createElement("line", {
    key: i,
    x1: x,
    x2: x,
    y1: y1 + bh + 5,
    y2: y2 - 5,
    className: fsCalm() ? "" : "fs-drop",
    style: {
      stroke: "var(--fs-self)",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeDasharray: fsCalm() ? "3 5" : undefined,
      opacity: 0.85
    }
  })), seg("s2", xs, xe, y2, "var(--fs-self)", pct(s, use), 240), seg("m", xe, w, y2, "var(--fs-imp)", pct(m, use), 360), React.createElement("text", {
    x: Math.min(xs, Math.max(0, w - 190)),
    y: y2 + bh + 16,
    style: {
      fill: "var(--text-2)",
      fontSize: 12,
      fontWeight: 700
    }
  }, "\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E43\u0E0A\u0E49 ", React.createElement("tspan", {
    style: {
      fill: "var(--text-1)",
      fontWeight: 800
    }
  }, E(use))))));
}
Object.assign(window, {
  FsTrendChart,
  FsEnergyBalance,
  fsMonoPath
});
