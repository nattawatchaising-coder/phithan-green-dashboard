function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
const mtModelShort = s => MT_MODEL_TH[s && s.meter_model || "leos-ipm310"].split(" (")[0].split(" —")[0];
const MT_TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MT_TH_MON_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MT_LIVE_MS = 5 * 60e3;
const MT_HS_MS = 180e3;
const mtP2 = x => String(x).padStart(2, "0");
function mtThDay(ms) {
  const d = new Date((ms == null ? Date.now() : ms) + 7 * 3600e3);
  return d.getUTCFullYear() + mtP2(d.getUTCMonth() + 1) + mtP2(d.getUTCDate());
}
function mtShiftDay(k, n) {
  const d = new Date(Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8) + n));
  return d.getUTCFullYear() + mtP2(d.getUTCMonth() + 1) + mtP2(d.getUTCDate());
}
function mtShiftYm(ym, n) {
  const d = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1));
  return d.getUTCFullYear() + "-" + mtP2(d.getUTCMonth() + 1);
}
const mtCurYm = () => {
  const t = mtThDay();
  return t.slice(0, 4) + "-" + t.slice(4, 6);
};
const mtDayLabel = k => Number(k.slice(6, 8)) + " " + MT_TH_MON[Number(k.slice(4, 6)) - 1];
const mtDayLong = k => mtDayLabel(k) + " " + (Number(k.slice(0, 4)) + 543);
const mtMonTH = ym => MT_TH_MON_FULL[Number(ym.slice(5, 7)) - 1] + " " + (Number(ym.slice(0, 4)) + 543);
const mtMonShort = ym => MT_TH_MON[Number(ym.slice(5, 7)) - 1] + " " + String(Number(ym.slice(0, 4)) + 543).slice(2);
const mtNum = (v, d) => v == null || !isFinite(v) ? "—" : Number(v).toLocaleString("th-TH", {
  minimumFractionDigits: d || 0,
  maximumFractionDigits: d == null ? 2 : d
});
const mtKwD = v => v == null ? 1 : Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0;
function mtEnergy(kwh) {
  if (kwh == null || !isFinite(kwh)) return ["—", "kWh"];
  const a = Math.abs(kwh);
  if (a >= 10000) return [mtNum(kwh / 1000, a >= 100000 ? 1 : 2), "MWh"];
  return [mtNum(kwh, a < 10 ? 2 : a < 1000 ? 1 : 0), "kWh"];
}
const mtMoney = v => mtNum(v, 2);
const mtRegOf = s => s && s.bill && s.bill.reg || "kwh_imp";
const mtRateOf = s => s && s.bill && s.bill.rate != null && isFinite(s.bill.rate) ? Number(s.bill.rate) : null;
function mtLive(st, now) {
  const m = st && st.meter;
  if (!m || !m.modbus || !m.modbus.ok || !m.v || !st.at) return null;
  return (now || Date.now()) - Date.parse(st.at) <= MT_LIVE_MS ? m.v : null;
}
const MTM_TONE = {
  green: {
    bg: "var(--tint-ok-bg)",
    tx: "var(--tint-ok-tx)"
  },
  amber: {
    bg: "var(--tint-amber-bg)",
    tx: "var(--tint-amber-tx)"
  },
  red: {
    bg: "var(--tint-red-bg)",
    tx: "var(--tint-red-tx)"
  },
  gray: {
    bg: "var(--surface2)",
    tx: "var(--text-3)"
  }
};
function mtSiteState(s, st, now) {
  if (s.meter_model === "none") return {
    k: "none",
    label: "ไม่มีมิเตอร์",
    tone: "gray",
    why: "ไซต์นี้ไม่ได้ต่อมิเตอร์"
  };
  if (!st || !st.at) return {
    k: "wait",
    label: "รอข้อมูลแรก",
    tone: "gray",
    why: "ยังไม่เคยได้รับข้อมูลจากไซต์นี้"
  };
  const age = now - Date.parse(st.at);
  const hs = st.wg && st.wg.hs ? st.wg.hs * 1000 : 0;
  if (age > MT_LIVE_MS || !hs || now - hs > MT_HS_MS) return {
    k: "lost",
    label: "ขาดการติดต่อ",
    tone: "red",
    why: age > MT_LIVE_MS ? "ไม่ได้รับข้อมูลมา " + window.mtAgo(age) : "อินเทอร์เน็ตที่ไซต์ขาด หรือเราเตอร์ดับ"
  };
  const m = st.meter;
  if (!m || !m.modbus || !m.modbus.ok) return {
    k: "meter",
    label: "มิเตอร์ไม่ตอบ",
    tone: "amber",
    why: m && m.error || "เราเตอร์ต่ออยู่ แต่อ่านมิเตอร์ไม่ได้"
  };
  return m.v && m.v.kw > 0.05 ? {
    k: "gen",
    label: "กำลังผลิต",
    tone: "green",
    why: ""
  } : {
    k: "ok",
    label: "ออนไลน์",
    tone: "green",
    why: ""
  };
}
function MtStatePill({
  state,
  size
}) {
  const t = MTM_TONE[state.tone] || MTM_TONE.gray;
  return React.createElement("span", {
    title: state.why || undefined,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      whiteSpace: "nowrap",
      fontSize: size === "lg" ? 12 : 11,
      fontWeight: 700,
      padding: size === "lg" ? "5px 12px" : "4px 10px",
      borderRadius: "var(--r-pill)",
      background: t.bg,
      color: t.tx
    }
  }, React.createElement("span", {
    className: state.k === "gen" ? "mt-pulse" : "",
    style: {
      width: 7,
      height: 7,
      borderRadius: 4,
      background: "currentColor"
    }
  }), state.label);
}
function mtDayKwh(days, k, reg, live) {
  const d = days && days[k];
  if (!d || !d.first || d.first[reg] == null) return null;
  const nx = days[mtShiftDay(k, 1)];
  let e = nx && nx.first && nx.first[reg] != null ? nx.first[reg] : live && live[reg] != null && k === mtThDay() ? live[reg] : d.last && d.last[reg] != null ? d.last[reg] : null;
  if (e == null) return null;
  e = Math.abs(e);
  const x = e - Math.abs(d.first[reg]);
  return x < -0.5 ? e : Math.max(0, x);
}
const mtDataDays = (days, ym) => Object.keys(days || {}).filter(k => k.slice(0, 6) === ym.replace("-", "")).length;
function mtMonKwh(days, ym, reg, live) {
  const pre = ym.replace("-", "");
  const ks = Object.keys(days || {}).filter(k => k.slice(0, 6) === pre);
  if (!ks.length) return null;
  return ks.reduce((t, k) => t + (mtDayKwh(days, k, reg, live) || 0), 0);
}
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
function useMtMany(paths) {
  const key = paths.join("|");
  const [vals, setVals] = React.useState({});
  React.useEffect(() => {
    setVals({});
    if (!key || !window.FBDB) return;
    const offs = key.split("|").map(p => {
      const r = window.FBDB.ref(p);
      const h = r.on("value", s => setVals(o => Object.assign({}, o, {
        [p]: s.val()
      })), () => setVals(o => Object.assign({}, o, {
        [p]: null
      })));
      return () => r.off("value", h);
    });
    return () => offs.forEach(f => f());
  }, [key]);
  return vals;
}
function useMtNowMon() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20e3);
    return () => clearInterval(t);
  }, []);
  return now;
}
function useMtWidth() {
  const [w, setW] = React.useState(0);
  const ro = React.useRef(null);
  const ref = React.useCallback(el => {
    if (ro.current) {
      ro.current.disconnect();
      ro.current = null;
    }
    if (!el) return;
    setW(Math.round(el.getBoundingClientRect().width));
    if (window.ResizeObserver) {
      ro.current = new ResizeObserver(es => setW(Math.round(es[0].contentRect.width)));
      ro.current.observe(el);
    }
  }, []);
  return [ref, w];
}
function useMtMobile() {
  const mq = React.useMemo(() => window.matchMedia("(max-width: 860px)"), []);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const f = e => setM(e.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [mq]);
  return m;
}
function mtCustOf(s) {
  const o = Object.assign({}, s && s.info || {});
  if (!o.cust) o.cust = s && s.bill && s.bill.cust || "";
  if (!o.addr) o.addr = s && s.bill && s.bill.addr || "";
  return o;
}
const mtTitleOf = s => mtCustOf(s).cust || s.name;
const mtKwpOf = s => {
  const v = Number(mtCustOf(s).kwp);
  return v > 0 ? v : null;
};
(function mtMonCss() {
  if (document.getElementById("mt-mon-css")) return;
  const el = document.createElement("style");
  el.id = "mt-mon-css";
  el.textContent = ".mt-lift{transition:transform .16s,box-shadow .16s}.mt-lift:hover{transform:translateY(-2px);box-shadow:var(--hov-sh-lg)!important}.mt-lift:active{transform:translateY(0)}" + ".mt-row{transition:background .12s}.mt-row:hover{background:var(--surface2)}" + "@keyframes mtPulse{0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}.mt-pulse{animation:mtPulse 1.8s infinite}" + "@media (prefers-reduced-motion:reduce){.mt-lift,.mt-lift:hover{transform:none;transition:none}.mt-pulse{animation:none}}" + "@media print{.mt-noprint{display:none!important}}";
  document.head.appendChild(el);
})();
const mtPanel = x => Object.assign({
  background: "var(--surface)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "var(--r-card)",
  padding: "18px 20px",
  minWidth: 0
}, x);
const mtCard = mtPanel({
  display: "flex",
  flexDirection: "column",
  gap: 12
});
const mtSun = "var(--fs-sun, #E8930C)";
function MtBubble({
  icon,
  color,
  size
}) {
  const S = size || 30;
  return React.createElement("span", {
    style: {
      width: S,
      height: S,
      borderRadius: S / 2,
      display: "grid",
      placeItems: "center",
      flexShrink: 0,
      background: "color-mix(in srgb, " + (color || mtSun) + " 15%, var(--surface))"
    }
  }, React.createElement(Icon, {
    name: icon,
    size: Math.round(S * 0.52),
    color: color || mtSun
  }));
}
function MtHead({
  icon,
  title,
  sub,
  right,
  color
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      minWidth: 0
    }
  }, icon && React.createElement(MtBubble, {
    icon: icon,
    color: color,
    size: 28
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, title), sub && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, sub)), right && React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, right));
}
function MtBig({
  v,
  size,
  color
}) {
  return React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: size || 26,
      fontWeight: 700,
      lineHeight: 1.1,
      color: color || "var(--text-1)",
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums"
    }
  }, v[0], v[0] !== "—" && v[1] && React.createElement("span", {
    style: {
      fontSize: Math.max(11.5, (size || 26) * 0.46),
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 5
    }
  }, v[1]));
}
function MtKpi({
  icon,
  label,
  v,
  sub,
  color,
  flat
}) {
  return React.createElement("div", {
    style: {
      minWidth: 0,
      padding: "13px 15px",
      borderRadius: "var(--r-tile)",
      display: "flex",
      flexDirection: "column",
      gap: 7,
      background: flat ? "var(--surface2)" : "var(--surface)",
      boxShadow: flat ? "none" : "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0
    }
  }, React.createElement(MtBubble, {
    icon: icon,
    color: color,
    size: 26
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, label)), React.createElement(MtBig, {
    v: v,
    size: 23
  }), sub && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, sub));
}
function MtStepper({
  label,
  onPrev,
  onNext,
  canNext,
  children
}) {
  const b = {
    width: 30,
    height: 30,
    border: "none",
    borderRadius: "var(--r-chip)",
    background: "var(--surface2)",
    boxShadow: "var(--shadow-sm)",
    color: "var(--text-2)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    padding: 0
  };
  return React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("button", {
    type: "button",
    "aria-label": "\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32",
    onClick: onPrev,
    style: b
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 15
  })), React.createElement("div", {
    style: {
      minWidth: 112,
      textAlign: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)",
      position: "relative"
    }
  }, label, children), React.createElement("button", {
    type: "button",
    "aria-label": "\u0E16\u0E31\u0E14\u0E44\u0E1B",
    onClick: onNext,
    disabled: !canNext,
    style: Object.assign({}, b, {
      opacity: canNext ? 1 : 0.35,
      cursor: canNext ? "pointer" : "default"
    })
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15
  })));
}
function MtSpark({
  hist,
  height
}) {
  const H = height || 46,
    W = 200;
  const pts = Object.keys(hist || {}).sort().map(hm => ({
    t: +hm.slice(0, 2) * 60 + +hm.slice(2),
    v: Number((hist[hm] || {}).kw) || 0
  }));
  const max = Math.max.apply(null, pts.map(p => p.v).concat([0.001]));
  const X = t => t / 1440 * W,
    Y = v => H - 3 - Math.max(0, v) / max * (H - 8);
  const has = pts.length > 1 && pts.some(p => p.v > 0);
  const line = pts.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + "," + Y(p.v).toFixed(1)).join("");
  return React.createElement("svg", {
    viewBox: "0 0 " + W + " " + H,
    preserveAspectRatio: "none",
    style: {
      width: "100%",
      height: H,
      display: "block"
    },
    "aria-hidden": "true"
  }, React.createElement("line", {
    x1: "0",
    x2: W,
    y1: H - 3,
    y2: H - 3,
    style: {
      stroke: "var(--divider)",
      strokeWidth: 1
    },
    vectorEffect: "non-scaling-stroke"
  }), has && React.createElement("path", {
    d: line + "L" + X(pts[pts.length - 1].t).toFixed(1) + "," + (H - 3) + "L" + X(pts[0].t).toFixed(1) + "," + (H - 3) + "Z",
    style: {
      fill: "color-mix(in srgb, " + mtSun + " 16%, transparent)"
    }
  }), has && React.createElement("path", {
    d: line,
    fill: "none",
    style: {
      stroke: mtSun,
      strokeWidth: 2,
      strokeLinejoin: "round"
    },
    vectorEffect: "non-scaling-stroke"
  }));
}
function MtFloat({
  icon,
  label,
  v,
  sub,
  frac,
  flat
}) {
  return React.createElement("div", {
    style: {
      minWidth: 0,
      padding: flat ? "12px 14px" : "11px 14px",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      background: flat ? "var(--surface)" : "color-mix(in srgb, var(--surface) 84%, transparent)",
      boxShadow: flat ? "var(--shadow-sm)" : "var(--shadow-card)",
      backdropFilter: flat ? "none" : "blur(10px)",
      WebkitBackdropFilter: flat ? "none" : "blur(10px)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement(MtBubble, {
    icon: icon,
    size: 28
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, label)), React.createElement(MtBig, {
    v: v,
    size: flat ? 22 : 25
  }), frac != null && React.createElement("div", {
    style: {
      height: 5,
      borderRadius: 3,
      background: "var(--surface3)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(1, frac)) * 100 + "%",
      height: "100%",
      borderRadius: 3,
      background: mtSun,
      transition: "width .6s"
    }
  })), sub && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, sub));
}
function MtHero({
  roll,
  counts,
  filter,
  setFilter,
  lastAt,
  now,
  isMobile,
  title,
  foot
}) {
  const [boxRef, bw] = useMtWidth();
  const W = bw || (isMobile ? 360 : 1200);
  const lay = W < 600 ? "s" : W < 1080 ? "m" : "l";
  const cu = (v, d) => window.FsCountUp && v != null && isFinite(v) ? React.createElement(window.FsCountUp, {
    value: v,
    digits: d
  }) : mtNum(v, d);
  const eV = kwh => {
    const e = mtEnergy(kwh);
    return kwh == null ? e : [cu(Math.abs(kwh) >= 10000 ? kwh / 1000 : kwh, Math.abs(kwh) >= 10000 ? 2 : 1), e[1]];
  };
  const dom = Number(mtThDay(now).slice(6));
  const cards = [{
    k: "now",
    icon: "bolt",
    label: "กำลังผลิตตอนนี้",
    v: [roll.live ? cu(roll.kw, mtKwD(roll.kw)) : "—", "kW"],
    frac: roll.kwp > 0 && roll.live ? roll.kw / roll.kwp : null,
    sub: roll.kwp > 0 && roll.live ? Math.round(roll.kw / roll.kwp * 100) + "% ของ " + mtNum(roll.kwp, 0) + " kWp" : roll.live + " ไซต์ส่งค่าสด"
  }, {
    k: "day",
    icon: "sun",
    label: "ผลิตวันนี้",
    v: eV(roll.day),
    sub: roll.yday != null ? "เมื่อวาน " + mtEnergy(roll.yday).join(" ") : "เริ่มนับตั้งแต่ 00:00 น."
  }, {
    k: "mon",
    icon: "calendar",
    label: "ผลิตเดือนนี้",
    v: eV(roll.mon),
    sub: roll.mon != null ? "เฉลี่ย " + mtEnergy(roll.mon / Math.max(1, Math.min(dom, roll.mdays || dom))).join(" ") + "/วัน" : null
  }, roll.money != null ? {
    k: "baht",
    icon: "wallet",
    label: "ค่าไฟเดือนนี้ (ถึงตอนนี้)",
    v: [cu(roll.money, roll.money < 1000 ? 2 : 0), "บาท"],
    sub: "ก่อน VAT · ตามราคาต่อหน่วยของแต่ละไซต์"
  } : {
    k: "tot",
    icon: "trend",
    label: "เลขมิเตอร์รวม",
    v: mtEnergy(roll.reading),
    sub: "เลขสะสมของทุกมิเตอร์"
  }];
  const chips = [["gen", "กำลังผลิต", "var(--tint-ok-tx)"], ["ok", "ออนไลน์", "var(--tint-ok-tx)"], ["meter", "มิเตอร์ไม่ตอบ", "var(--tint-amber-tx)"], ["lost", "ขาดการติดต่อ", "var(--tint-red-tx)"], ["wait", "รอข้อมูล", "var(--text-3)"]].filter(c => counts[c[0]] > 0);
  const titleBlock = React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: 11.5,
      fontWeight: 700,
      padding: "5px 11px",
      borderRadius: 999,
      background: "color-mix(in srgb, " + mtSun + " 14%, var(--surface))",
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    className: roll.live ? "mt-pulse" : "",
    style: {
      width: 7,
      height: 7,
      borderRadius: 4,
      background: roll.live ? "var(--tint-ok-tx)" : "var(--text-3)",
      color: "var(--tint-ok-tx)"
    }
  }), lastAt ? "อัปเดต " + window.mtAgo(now - lastAt) : "ยังไม่ได้รับข้อมูล"), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: lay === "s" ? 27 : lay === "m" ? 32 : 36,
      fontWeight: 700,
      lineHeight: 1.15,
      color: "var(--text-1)"
    }
  }, title || "ไฟฟ้าโซลาร์", React.createElement("br", null), "\u0E08\u0E32\u0E01 ", React.createElement("span", {
    style: {
      color: mtSun
    }
  }, roll.n), " \u0E44\u0E0B\u0E15\u0E4C"), React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, roll.kwp > 0 && React.createElement("div", null, "\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E23\u0E27\u0E21 ", mtNum(roll.kwp, roll.kwp < 100 ? 1 : 0), " kWp"), React.createElement("div", null, "\u0E2D\u0E48\u0E32\u0E19\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E17\u0E38\u0E01 1 \u0E19\u0E32\u0E17\u0E35")), chips.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, chips.map(([k, th, c]) => React.createElement("button", {
    key: k,
    type: "button",
    onClick: () => setFilter(filter === k ? "all" : k),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      padding: "5px 11px",
      borderRadius: 999,
      color: filter === k ? "var(--primary-dark)" : "var(--text-2)",
      background: filter === k ? "var(--primary-soft)" : "var(--surface)",
      boxShadow: filter === k ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)"
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 4,
      background: c
    }
  }), th, " ", counts[k]))), foot);
  const bg = "radial-gradient(ellipse 48% 62% at " + (lay === "s" ? "50% 30%" : "64% 42%") + ", color-mix(in srgb, " + mtSun + " 15%, transparent), transparent 72%)," + " linear-gradient(180deg, color-mix(in srgb, var(--primary) 7%, var(--surface)) 0%, var(--surface) 80%)";
  const wrap = {
    position: "relative",
    overflow: "hidden",
    borderRadius: "var(--r-card)",
    background: bg,
    boxShadow: "var(--shadow-card)",
    isolation: "isolate"
  };
  if (lay === "s") return React.createElement("div", {
    ref: boxRef,
    style: wrap
  }, React.createElement("div", {
    style: {
      padding: "16px 14px 14px"
    }
  }, titleBlock), React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      gridTemplateColumns: "1fr 1fr",
      padding: "0 14px 14px"
    }
  }, cards.map(c => React.createElement(MtFloat, _extends({
    key: c.k
  }, c, {
    flat: true
  })))));
  if (lay === "m") {
    const cw = (W - 40 - 14) * 0.6,
      hh = Math.round(Math.min(250, Math.max(160, cw / 1.7)));
    return React.createElement("div", {
      ref: boxRef,
      style: Object.assign({}, wrap, {
        background: "var(--surface)"
      })
    }, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(230px, .8fr) minmax(0, 1.2fr)",
        gap: 14,
        padding: "18px 20px 6px",
        alignItems: "center"
      }
    }, titleBlock, React.createElement("div", {
      style: {
        position: "relative",
        height: hh
      }
    }, window.FsHouseBackdrop && React.createElement(window.FsHouseBackdrop, {
      bg: "transparent"
    }))), React.createElement("div", {
      style: {
        display: "grid",
        gap: 10,
        gridTemplateColumns: W >= 900 ? "repeat(4, minmax(0, 1fr))" : "1fr 1fr",
        padding: "6px 20px 18px"
      }
    }, cards.map(c => React.createElement(MtFloat, _extends({
      key: c.k
    }, c, {
      flat: true
    })))));
  }
  const cwL = Math.max(0, W - 300) * 1.6 / 2.45,
    hhL = Math.round(Math.min(380, Math.max(220, cwL / 1.72)));
  return React.createElement("div", {
    ref: boxRef,
    style: wrap
  }, React.createElement("div", {
    style: {
      position: "relative",
      display: "grid",
      gridTemplateColumns: "minmax(250px, .85fr) minmax(0, 1.6fr) 228px",
      gap: 14,
      padding: "20px 22px",
      alignItems: "center"
    }
  }, titleBlock, React.createElement("div", {
    style: {
      position: "relative",
      height: hhL
    }
  }, window.FsHouseBackdrop && React.createElement(window.FsHouseBackdrop, {
    bg: "transparent"
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, cards.map(c => React.createElement(MtFloat, _extends({
    key: c.k
  }, c))))));
}
function MtMonCard({
  s,
  st,
  days,
  bills,
  now,
  onOpen
}) {
  const today = mtThDay(now);
  const hist = useMtRef("mtMeter/" + s.n + "/h/" + today);
  const k = mtSiteState(s, st, now);
  const live = mtLive(st, now);
  const reg = mtRegOf(s),
    rate = mtRateOf(s),
    kwp = mtKwpOf(s);
  const ym = today.slice(0, 4) + "-" + today.slice(4, 6),
    prevYm = mtShiftYm(ym, -1);
  const dayK = mtDayKwh(days, today, reg, live),
    monK = mtMonKwh(days, ym, reg, live);
  const prevBill = bills && bills[prevYm.replace("-", "")];
  const prevHas = Object.keys(days || {}).some(x => x.slice(0, 6) === prevYm.replace("-", ""));
  const ci = mtCustOf(s);
  const stat = (label, v) => React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, label), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, v[0], React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, v[0] !== "—" ? v[1] : "")));
  return React.createElement("button", {
    type: "button",
    onClick: onOpen,
    className: "mt-lift",
    style: {
      textAlign: "left",
      border: "none",
      fontFamily: "inherit",
      cursor: "pointer",
      color: "inherit",
      background: "var(--surface)",
      boxShadow: "var(--shadow-card)",
      borderRadius: "var(--r-card)",
      padding: "16px 18px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, mtTitleOf(s)), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, [ci.place, kwp ? mtNum(kwp, kwp < 100 ? 1 : 0) + " kWp" : ""].filter(Boolean).join(" · ") || React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, mtIdent(s)))), React.createElement(MtStatePill, {
    state: k
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-end"
    }
  }, React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, React.createElement(MtBig, {
    v: [live ? mtNum(live.kw, mtKwD(live.kw)) : "—", "kW"],
    size: 28
  }), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, kwp && live ? Math.round(Math.max(0, live.kw) / kwp * 100) + "% ของกำลังติดตั้ง" : "กำลังไฟตอนนี้")), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(MtSpark, {
    hist: hist
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1.1fr",
      gap: 10,
      padding: "10px 12px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)"
    }
  }, stat("วันนี้", mtEnergy(dayK)), stat("เดือนนี้", mtEnergy(monK)), stat("ค่าไฟเดือนนี้", rate != null && monK != null ? [mtNum(monK * rate, 0), "บาท"] : ["—", ""])), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      fontSize: 11,
      color: "var(--text-3)",
      minHeight: 22
    }
  }, prevBill ? React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontWeight: 700,
      color: "var(--tint-ok-tx)"
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 12,
    sw: 2.6
  }), "\u0E1A\u0E34\u0E25 ", mtMonShort(prevYm), " \u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 \xB7 ", mtMoney(prevBill.total), " \u0E1A\u0E32\u0E17") : prevHas ? React.createElement("span", {
    style: {
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 999,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E1A\u0E34\u0E25 ", mtMonShort(prevYm), " \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01") : rate == null ? React.createElement("span", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E23\u0E32\u0E04\u0E32\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22") : React.createElement("span", null, mtNum(rate, 2), " \u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      whiteSpace: "nowrap"
    }
  }, st && st.at ? window.mtAgo(now - Date.parse(st.at)) : "")));
}
function MtMonDetail({
  s,
  st,
  isAdmin,
  canEdit,
  onBack,
  now,
  partner
}) {
  const isMobile = useMtMobile();
  const [tab, setTab] = React.useState("over");
  const k = mtSiteState(s, st, now);
  const ci = mtCustOf(s),
    kwp = mtKwpOf(s);
  const opts = [{
    value: "over",
    label: "ภาพรวม",
    icon: "chart"
  }, {
    value: "bill",
    label: "บิลค่าไฟ",
    icon: "file"
  }, {
    value: "info",
    label: "ข้อมูลไซต์",
    icon: "building"
  }];
  const lk = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    textDecoration: "none"
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, React.createElement("div", {
    style: mtPanel({
      padding: isMobile ? "14px" : "16px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    className: "btn btn-sm",
    onClick: onBack,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement(Icon, {
    name: "chevronLeft",
    size: 14
  }), "\u0E17\u0E38\u0E01\u0E44\u0E0B\u0E15\u0E4C"), React.createElement(MtStatePill, {
    state: k,
    size: "lg"
  }), isAdmin && React.createElement("div", {
    className: "mt-noprint",
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, React.createElement("a", {
    className: "btn btn-sm",
    title: "\u0E40\u0E1B\u0E34\u0E14 VPN (\u0E41\u0E2D\u0E1B WireGuard) \u0E1A\u0E19\u0E04\u0E2D\u0E21\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E02\u0E49\u0E2D 11",
    href: "http://10.10." + s.n + ".20",
    target: "_blank",
    rel: "noopener noreferrer",
    style: lk
  }, React.createElement(Icon, {
    name: "link",
    size: 13
  }), "\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E27\u0E47\u0E1A\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("a", {
    className: "btn btn-sm",
    title: "\u0E40\u0E1B\u0E34\u0E14 VPN (\u0E41\u0E2D\u0E1B WireGuard) \u0E1A\u0E19\u0E04\u0E2D\u0E21\u0E01\u0E48\u0E2D\u0E19 \u2014 \u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D\u0E02\u0E49\u0E2D 11",
    href: "https://10.10." + s.n + ".10",
    target: "_blank",
    rel: "noopener noreferrer",
    style: lk
  }, React.createElement(Icon, {
    name: "link",
    size: 13
  }), "SmartLogger"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement(MtBubble, {
    icon: "building",
    size: 46
  }), React.createElement("div", {
    style: {
      minWidth: 0,
      flex: "1 1 260px"
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: isMobile ? 20 : 24,
      fontWeight: 700,
      lineHeight: 1.2,
      color: "var(--text-1)"
    }
  }, mtTitleOf(s)), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      marginTop: 3,
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, ci.place && React.createElement("span", null, ci.place), ci.place && React.createElement("span", null, "\xB7"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5
    }
  }, mtIdent(s)), kwp && React.createElement("span", null, "\xB7 ", mtNum(kwp, kwp < 100 ? 1 : 0), " kWp"), React.createElement("span", null, "\xB7 \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C ", mtModelShort(s)))), window.Segmented && React.createElement("div", {
    style: {
      overflowX: "auto",
      flexShrink: 0,
      maxWidth: "100%"
    }
  }, React.createElement(window.Segmented, {
    value: tab,
    onChange: setTab,
    options: opts
  })))), tab === "bill" ? React.createElement(MtSiteBill, {
    s: s,
    st: st,
    isAdmin: isAdmin,
    canEdit: canEdit,
    now: now
  }) : tab === "info" ? React.createElement(MtSiteInfo, {
    key: s.n + "-" + (s.info && s.info.at || ""),
    s: s,
    canEdit: canEdit
  }) : React.createElement(MtSiteOverview, {
    s: s,
    st: st,
    isAdmin: isAdmin,
    now: now
  }));
}
function MtSiteOverview({
  s,
  st,
  isAdmin,
  now
}) {
  const isMobile = useMtMobile();
  const [boxRef, bw] = useMtWidth();
  const one = (bw || (isMobile ? 360 : 1200)) < 820;
  const today = mtThDay(now);
  const [day, setDay] = React.useState(today);
  const [ym, setYm] = React.useState(today.slice(0, 4) + "-" + today.slice(4, 6));
  const hist = useMtRef("mtMeter/" + s.n + "/h/" + day);
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const reg = mtRegOf(s),
    rate = mtRateOf(s),
    kwp = mtKwpOf(s);
  const live = mtLive(st, now);
  const v = live || {};
  const curYm = today.slice(0, 4) + "-" + today.slice(4, 6);
  const dayK = mtDayKwh(days, today, reg, live);
  const ydK = mtDayKwh(days, mtShiftDay(today, -1), reg, live);
  const monK = mtMonKwh(days, curYm, reg, live);
  const C = window.FsTrendChart;
  const dayBars = Object.keys(hist || {}).sort().map(hm => {
    const r = hist[hm] || {};
    return {
      k: hm,
      t: +hm.slice(0, 2) * 60 + +hm.slice(2),
      value: r.kw != null ? Math.round(r.kw * 100) / 100 : null,
      label: hm.slice(0, 2) + ":" + hm.slice(2),
      tip: [hm.slice(0, 2) + ":" + hm.slice(2) + " น."]
    };
  });
  const thisDayK = mtDayKwh(days, day, reg, live);
  const dayMax = dayBars.reduce((m, b) => Math.max(m, b.value || 0), 0);
  const onT = dayBars.filter(b => (b.value || 0) > 0.01).map(b => b.t);
  const t0 = Math.min(300, onT.length ? Math.floor(onT[0] / 60) * 60 : 300),
    t1 = Math.max(1140, onT.length ? Math.ceil(onT[onT.length - 1] / 60) * 60 : 1140);
  const pre = ym.replace("-", "");
  const monBars = Object.keys(days || {}).filter(x => x.slice(0, 6) === pre).sort().map(x => {
    const val = mtDayKwh(days, x, reg, live);
    return {
      k: x,
      label: String(Number(x.slice(6))),
      value: val != null ? Math.round(val * 100) / 100 : null,
      tip: [mtDayLong(x)],
      partial: x === today
    };
  });
  const selMonK = mtMonKwh(days, ym, reg, live);
  const fullDays = monBars.filter(b => !b.partial && b.value != null);
  const avg = fullDays.length ? fullDays.reduce((t, b) => t + b.value, 0) / fullDays.length : null;
  const Gauge = window.FsGauge;
  const at = st && st.at ? Date.parse(st.at) : null;
  const m = st && st.meter;
  return React.createElement("div", {
    ref: boxRef,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: one ? "1fr" : "minmax(260px, 340px) minmax(0, 1fr)",
      gap: 14
    }
  }, React.createElement("div", {
    style: mtPanel({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      justifyContent: "center"
    })
  }, React.createElement("div", {
    style: {
      alignSelf: "stretch"
    }
  }, React.createElement(MtHead, {
    icon: "bolt",
    title: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1C\u0E25\u0E34\u0E15\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49",
    sub: at ? "อ่านค่าเมื่อ " + new Date(at).toLocaleTimeString("th-TH", {
      timeStyle: "short"
    }) + " น. · " + window.mtAgo(now - at) : "ยังไม่ได้รับข้อมูล"
  })), Gauge ? React.createElement(Gauge, {
    frac: kwp && live ? Math.max(0, v.kw) / kwp : live && v.kw > 0 ? 1 : 0,
    value: live ? mtNum(v.kw, mtKwD(v.kw)) : "—",
    unit: "kW",
    size: 210,
    color: mtSun,
    sub: kwp ? live ? Math.round(Math.max(0, v.kw) / kwp * 100) + "% ของกำลังติดตั้ง " + mtNum(kwp, kwp < 100 ? 1 : 0) + " kWp" : "กำลังติดตั้ง " + mtNum(kwp, 1) + " kWp" : "ใส่ขนาดระบบ (kWp) ในแท็บข้อมูลไซต์ เพื่อดูสัดส่วน"
  }) : React.createElement(MtBig, {
    v: [live ? mtNum(v.kw, 2) : "—", "kW"],
    size: 40
  }), !live && m && !(m.modbus && m.modbus.ok) && React.createElement("div", {
    style: {
      alignSelf: "stretch",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      padding: "8px 11px",
      borderRadius: "var(--r-tile)"
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49", m.error ? " — " + m.error : "")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignContent: "stretch"
    }
  }, React.createElement(MtKpi, {
    icon: "sun",
    label: "\u0E1C\u0E25\u0E34\u0E15\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49",
    v: mtEnergy(dayK),
    sub: ydK != null ? "เมื่อวาน " + mtEnergy(ydK).join(" ") : "นับตั้งแต่ 00:00 น."
  }), React.createElement(MtKpi, {
    icon: "calendar",
    label: "ผลิตเดือน" + MT_TH_MON_FULL[Number(curYm.slice(5)) - 1],
    v: mtEnergy(monK),
    sub: monK != null ? "เฉลี่ย " + mtEnergy(monK / Math.max(1, Math.min(Number(today.slice(6)), mtDataDays(days, curYm) || 1))).join(" ") + "/วัน" : null
  }), React.createElement(MtKpi, {
    icon: "wallet",
    label: "\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 (\u0E16\u0E36\u0E07\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49)",
    v: rate != null && monK != null ? [mtMoney(monK * rate), "บาท"] : ["—", ""],
    sub: rate != null ? mtNum(rate, rate % 1 ? 2 : 0) + " บาท/หน่วย · ก่อน VAT" : "ยังไม่ตั้งราคาต่อหน่วย (แท็บบิลค่าไฟ)"
  }), React.createElement(MtKpi, {
    icon: "trend",
    label: "\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C (\u0E2A\u0E30\u0E2A\u0E21)",
    v: [live && v[reg] != null ? mtNum(Math.abs(v[reg]), 1) : "—", "kWh"],
    sub: MT_REG_TH[reg]
  }))), React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "bolt",
    title: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F\u0E1F\u0E49\u0E32",
    sub: "ราย 5 นาที · " + (thisDayK != null ? "รวม " + mtEnergy(thisDayK).join(" ") : "ยังไม่มีข้อมูล") + (dayMax > 0 ? " · สูงสุด " + mtNum(dayMax, mtKwD(dayMax)) + " kW" : ""),
    right: React.createElement(MtStepper, {
      label: day === today ? "วันนี้" : mtDayLong(day),
      onPrev: () => setDay(mtShiftDay(day, -1)),
      onNext: () => setDay(mtShiftDay(day, 1)),
      canNext: day < today
    })
  }), C ? React.createElement(C, {
    mode: "time",
    t0: t0,
    t1: t1,
    bars: dayBars.some(b => b.value != null) ? dayBars.filter(b => b.t >= t0 && b.t <= t1) : [],
    unit: "kW",
    height: isMobile ? 190 : 230,
    empty: hist === undefined ? "กำลังโหลด…" : "ยังไม่มีข้อมูลของวันนี้ — ระบบเก็บทุก 5 นาที"
  }) : null), React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "calendar",
    title: "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19",
    sub: (selMonK != null ? "รวม " + mtEnergy(selMonK).join(" ") : "ยังไม่มีข้อมูล") + (avg != null ? " · เฉลี่ย " + mtEnergy(avg).join(" ") + "/วัน" : ""),
    right: React.createElement(MtStepper, {
      label: mtMonTH(ym),
      onPrev: () => setYm(mtShiftYm(ym, -1)),
      onNext: () => setYm(mtShiftYm(ym, 1)),
      canNext: ym < curYm
    })
  }), C ? React.createElement(C, {
    mode: "bars",
    bars: monBars,
    unit: "kWh",
    avg: avg,
    avgLabel: "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22",
    height: isMobile ? 180 : 210,
    empty: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E23\u0E32\u0E22\u0E27\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49"
  }) : null), React.createElement(MtElecCard, {
    s: s,
    st: st,
    live: live,
    now: now
  }), React.createElement(MtMeterReport, {
    s: s,
    days: days,
    ym: ym,
    reg: reg,
    live: live
  }), isAdmin && React.createElement(MtMeterCfg, {
    s: s
  }));
}
function MtElecCard({
  s,
  st,
  live,
  now
}) {
  const v = live || {};
  const at = st && st.at ? Date.parse(st.at) : null;
  const ph = [1, 2, 3].map(i => ({
    i,
    V: v["v" + i],
    A: v["i" + i],
    kW: v["kw" + i]
  }));
  const used = ph.filter(p => (p.V || 0) > 1 || (p.A || 0) > 0.01);
  const cell = (label, val, unit) => React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      padding: "5px 0",
      boxShadow: "inset 0 -1px 0 var(--divider)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      flex: 1
    }
  }, label), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 14,
      fontWeight: 700,
      color: val === "—" ? "var(--text-3)" : "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, val), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      width: 22
    }
  }, unit));
  const spec = (label, val, unit) => React.createElement("div", {
    style: {
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: "9px 12px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      fontFamily: "var(--mono)",
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, val, val !== "—" && unit && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-3)",
      marginLeft: 4,
      fontFamily: "var(--sans)"
    }
  }, unit)));
  return React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "net",
    title: "\u0E04\u0E48\u0E32\u0E17\u0E32\u0E07\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E08\u0E32\u0E01\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    sub: (live ? "ค่าสด ณ " + new Date(at).toLocaleTimeString("th-TH") : "ไม่มีค่าสด — แสดงเมื่อมิเตอร์ส่งค่าภายใน 5 นาทีล่าสุด") + " · " + mtModelShort(s)
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
      gap: 10
    }
  }, ph.map(p => {
    const off = live && used.length && !used.some(u => u.i === p.i);
    return React.createElement("div", {
      key: p.i,
      style: {
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        borderRadius: "var(--r-tile)",
        padding: "10px 13px 6px",
        opacity: off ? 0.55 : 1
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 3
      }
    }, React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        padding: "2px 8px",
        borderRadius: "var(--r-chip)",
        background: "var(--primary-soft)",
        color: "var(--primary-dark)"
      }
    }, "L", p.i), React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, off ? "ไม่มีโหลด" : "เฟส " + p.i)), cell("แรงดัน", mtNum(p.V, 1), "V"), cell("กระแส", mtNum(p.A, 2), "A"), cell("กำลังไฟ", mtNum(p.kW, 2), "kW"));
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
      gap: 8
    }
  }, spec("กำลังไฟรวม", mtNum(v.kw, 2), "kW"), spec("ตัวประกอบกำลัง (PF)", mtNum(v.pf, 2), ""), spec("ความถี่", mtNum(v.hz, 2), "Hz"), spec("kWh Import (ไฟเข้า)", mtNum(v.kwh_imp == null ? null : Math.abs(v.kwh_imp), 1), "kWh"), spec("kWh Export (ไฟออก)", mtNum(v.kwh_exp == null ? null : Math.abs(v.kwh_exp), 1), "kWh"), spec("kWh Net (สุทธิ)", mtNum(v.kwh_net, 1), "kWh")));
}
function MtMeterReport({
  s,
  days,
  ym,
  reg,
  live
}) {
  const [mode, setMode] = React.useState("day");
  const D = days || {};
  const keys = Object.keys(D).sort();
  const val = r => r && r[reg] != null ? Math.abs(r[reg]) : null;
  const pre = ym.replace("-", "");
  const dayRows = keys.filter(k => k.slice(0, 6) === pre).map(k => {
    const d = D[k] || {};
    return {
      k,
      label: mtDayLong(k),
      first: val(d.first),
      last: val(d.last),
      kwh: mtDayKwh(D, k, reg, live),
      kwmax: d.kw_max
    };
  });
  const mons = {};
  keys.forEach(k => {
    const mk = k.slice(0, 6),
      d = D[k] || {};
    const e = mons[mk] || (mons[mk] = {
      k: mk,
      days: 0,
      kwh: 0,
      kwmax: 0,
      first: null,
      last: null
    });
    e.days++;
    e.kwh += mtDayKwh(D, k, reg, live) || 0;
    e.kwmax = Math.max(e.kwmax, Number(d.kw_max) || 0);
    if (e.first == null) e.first = val(d.first);
    if (val(d.last) != null) e.last = val(d.last);
  });
  const monRows = Object.values(mons).sort((a, b) => a.k < b.k ? 1 : -1).map(e => Object.assign(e, {
    label: mtMonTH(e.k.slice(0, 4) + "-" + e.k.slice(4))
  }));
  const rows = mode === "day" ? dayRows : monRows;
  const total = rows.reduce((t, r) => t + (r.kwh || 0), 0);
  const csv = () => {
    const head = mode === "day" ? ["วันที่", "เลขต้นวัน kWh", "เลขท้ายวัน kWh", "พลังงาน kWh", "kW สูงสุด"] : ["เดือน", "วันที่มีข้อมูล", "เลขต้นเดือน kWh", "เลขล่าสุด kWh", "พลังงาน kWh", "kW สูงสุด"];
    const body = rows.map(r => (mode === "day" ? [r.k.slice(0, 4) + "-" + r.k.slice(4, 6) + "-" + r.k.slice(6), r.first, r.last, r.kwh == null ? null : Math.round(r.kwh * 1000) / 1000, r.kwmax] : [r.k.slice(0, 4) + "-" + r.k.slice(4), r.days, r.first, r.last, Math.round(r.kwh * 1000) / 1000, r.kwmax]).map(x => x == null ? "" : x).join(","));
    mtDownload("﻿" + [head.join(",")].concat(body).join("\n"), "SITE" + mtPad(s.n) + "-" + (mode === "day" ? "daily-" + ym : "monthly") + ".csv");
  };
  const th = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-3)",
    textAlign: "right",
    padding: "8px 10px",
    whiteSpace: "nowrap",
    boxShadow: "inset 0 -1px 0 var(--divider)"
  };
  const opts = [{
    value: "day",
    label: "รายวัน"
  }, {
    value: "month",
    label: "รายเดือน"
  }];
  return React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "table",
    title: mode === "day" ? "รายงานรายวัน · " + mtMonTH(ym) : "รายงานรายเดือน",
    sub: "รวม " + mtEnergy(total).join(" ") + " · " + MT_REG_TH[reg],
    right: React.createElement(React.Fragment, null, window.Segmented ? React.createElement(window.Segmented, {
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
    }), "CSV"))
  }), React.createElement("div", {
    style: {
      overflowX: "auto",
      maxHeight: 420,
      overflowY: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontVariantNumeric: "tabular-nums"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    style: Object.assign({}, th, {
      textAlign: "left"
    })
  }, mode === "day" ? "วันที่" : "เดือน"), mode === "month" && React.createElement("th", {
    style: th
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), React.createElement("th", {
    style: th
  }, mode === "day" ? "เลขต้นวัน" : "เลขต้นเดือน", " ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kWh")), React.createElement("th", {
    style: th
  }, mode === "day" ? "เลขท้ายวัน" : "เลขล่าสุด", " ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kWh")), React.createElement("th", {
    style: th
  }, "\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kWh")), React.createElement("th", {
    style: th
  }, "\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kW")))), React.createElement("tbody", null, rows.map((r, i) => {
    const td = {
      padding: "8px 10px",
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
        fontWeight: 700,
        color: "var(--text-1)"
      })
    }, mtNum(r.kwh, 3)), React.createElement("td", {
      style: td
    }, mtNum(r.kwmax, 2)));
  }))), !rows.length && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      padding: "14px 10px"
    }
  }, days === undefined ? "กำลังโหลด…" : "ยังไม่มีข้อมูลในช่วงนี้")));
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
    padding: "8px 11px",
    background: "var(--surface2)",
    boxShadow: "var(--shadow-inset)"
  });
  return React.createElement("div", {
    className: "mt-noprint",
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "settings",
    color: "var(--text-3)",
    title: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C",
    sub: "เฉพาะแอดมิน · มิเตอร์ที่ 10.10." + s.n + ".20 (Modbus TCP อ่านอย่างเดียว)"
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-end",
      flexWrap: "wrap"
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E38\u0E48\u0E19\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("select", {
    value: model,
    onChange: e => setModel(e.target.value),
    style: fld
  }, Object.keys(MT_MODEL_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, MT_MODEL_TH[k])))), React.createElement("div", {
    title: "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E1A\u0E19\u0E2A\u0E32\u0E22 Modbus \u2014 \u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E17\u0E35\u0E48\u0E15\u0E31\u0E27\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C (LEOS \u0E04\u0E48\u0E32\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19 = 1) \xB7 \u0E15\u0E48\u0E2D\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E15\u0E23\u0E07 LAN \u0E15\u0E31\u0E27\u0E40\u0E14\u0E35\u0E22\u0E27\u0E43\u0E0A\u0E49 1 \xB7 \u0E1C\u0E48\u0E32\u0E19 Waveshare \u0E2B\u0E25\u0E32\u0E22\u0E15\u0E31\u0E27\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E19"
  }, React.createElement("div", {
    style: mtLbl
  }, "\u0E40\u0E25\u0E02\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07 Modbus (unit id)"), React.createElement("input", {
    value: unit,
    onChange: e => setUnit(e.target.value.replace(/\D/g, "")),
    style: Object.assign({}, fld, {
      width: 80,
      textAlign: "right",
      fontFamily: "var(--mono)"
    })
  })), React.createElement("button", {
    className: "btn btn-pri",
    disabled: !dirty,
    onClick: save
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), msg && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      paddingBottom: 10
    }
  }, msg)));
}
function mtMonthKeys(ym) {
  return {
    pre: ym.replace("-", ""),
    next: mtShiftYm(ym, 1).replace("-", "")
  };
}
const mtAtOf = (dayKey, hm) => dayKey.slice(0, 4) + "-" + dayKey.slice(4, 6) + "-" + dayKey.slice(6) + " " + hm.slice(0, 2) + ":" + hm.slice(2);
function mtAtOfMs(ms) {
  const d = new Date(ms + 7 * 3600e3);
  return mtAtOf(mtThDay(ms), mtP2(d.getUTCHours()) + mtP2(d.getUTCMinutes()));
}
function mtFmtAt(at, noTime) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/.exec(String(at || ""));
  if (!m) return "—";
  return Number(m[3]) + " " + MT_TH_MON[Number(m[2]) - 1] + " " + (Number(m[1]) + 543) + (m[4] && !noTime ? " เวลา " + m[4] + ":" + m[5] + " น." : "");
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
    out.warn.push("เดือนนี้ยังไม่มีข้อมูลมิเตอร์");
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
    out.warn.push("เดือนยังไม่จบ — เป็นยอดถึงตอนนี้ เลขเปลี่ยนตามมิเตอร์ (ออกบิลจริงหลังวันที่ 1 เดือนหน้า)");
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
function MtBillPaper({
  d,
  paperRef,
  compact
}) {
  const P = k => "var(--paper-" + k + ")";
  const iss = d.issuer || {};
  const baht = window.ecBahtText && d.total != null ? window.ecBahtText(d.total) : "";
  const lab = {
    fontSize: 10.5,
    fontWeight: 700,
    color: P("mute"),
    letterSpacing: 0,
    marginBottom: 3
  };
  const box = {
    background: P("tint"),
    borderRadius: 10,
    padding: "11px 13px",
    minWidth: 0
  };
  const tdL = {
    padding: compact ? "8px 8px" : "9px 12px",
    fontSize: compact ? 12 : 12.5,
    color: P("ink2"),
    boxShadow: "inset 0 -1px 0 " + P("line3")
  };
  const tdR = Object.assign({}, tdL, {
    textAlign: "right",
    fontFamily: "var(--mono)",
    color: P("ink"),
    whiteSpace: "nowrap"
  });
  const n2 = v => mtNum(v, 2),
    n3 = v => mtNum(v, 3);
  return React.createElement("div", {
    ref: paperRef,
    className: "mt-paper",
    style: {
      background: P("bg"),
      color: P("ink"),
      fontFamily: "var(--sans)",
      borderRadius: 14,
      boxShadow: "var(--shadow-sm)",
      padding: compact ? "16px 14px 14px" : "26px 28px 22px",
      position: "relative",
      overflow: "hidden",
      minWidth: 0,
      maxWidth: 820,
      width: "100%",
      boxSizing: "border-box",
      margin: "0 auto"
    }
  }, d.draft && React.createElement("div", {
    className: "mt-noprint",
    style: {
      margin: compact ? "-16px -14px 14px" : "-26px -28px 18px",
      padding: compact ? "7px 14px" : "7px 28px",
      background: P("warn-bg"),
      color: P("warn-tx2"),
      fontSize: 11.5,
      fontWeight: 700,
      display: "flex",
      gap: 8,
      alignItems: "center"
    }
  }, React.createElement(Icon, {
    name: "eye",
    size: 13
  }), "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E1A\u0E34\u0E25 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01 \xB7 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      alignItems: "flex-start",
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: compact ? 8 : 14,
      alignItems: compact ? "flex-start" : "center",
      flexDirection: compact ? "column" : "row",
      flex: "1 1 300px",
      minWidth: 0
    }
  }, d.logo && React.createElement("img", {
    src: d.logo,
    alt: "",
    style: {
      maxHeight: compact ? 48 : 64,
      maxWidth: 140,
      objectFit: "contain",
      flexShrink: 0
    }
  }), React.createElement("div", {
    style: {
      minWidth: 0,
      fontSize: 11.5,
      color: P("ink2"),
      lineHeight: 1.55
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 800,
      color: P("ink")
    }
  }, iss.name || React.createElement("span", {
    style: {
      color: P("mute")
    }
  }, "\u0E1C\u0E39\u0E49\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25 (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17)")), iss.addr && React.createElement("div", {
    style: {
      whiteSpace: "pre-line"
    }
  }, iss.addr), (iss.tax || iss.phone || iss.email) && React.createElement("div", null, [iss.tax ? "เลขประจำตัวผู้เสียภาษี " + iss.tax + (iss.branch ? " (" + iss.branch + ")" : "") : "", iss.phone ? "โทร " + iss.phone : "", iss.email].filter(Boolean).join(" · ")))), React.createElement("div", {
    style: {
      textAlign: compact ? "left" : "right",
      marginLeft: compact ? 0 : "auto"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      color: P("brand-dk"),
      lineHeight: 1.2
    }
  }, "\u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink3")
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E41\u0E2A\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C"), React.createElement("div", {
    style: {
      display: "inline-grid",
      gridTemplateColumns: "auto auto",
      gap: "2px 10px",
      marginTop: 8,
      fontSize: 11.5,
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      color: P("mute")
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), React.createElement("b", {
    style: {
      fontFamily: "var(--mono)",
      color: P("ink")
    }
  }, d.no), React.createElement("span", {
    style: {
      color: P("mute")
    }
  }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01"), React.createElement("span", {
    style: {
      color: P("ink")
    }
  }, d.at ? new Date(d.at).toLocaleDateString("th-TH", {
    dateStyle: "long"
  }) : "— (ยังไม่ออก)")))), React.createElement("div", {
    style: {
      height: 3,
      borderRadius: 2,
      background: P("brand"),
      margin: "16px 0 0"
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "baseline",
      padding: "10px 2px 12px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800
    }
  }, "\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19 ", mtMonTH(d.month)), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink3")
    }
  }, "\u0E0A\u0E48\u0E27\u0E07\u0E08\u0E14\u0E2B\u0E19\u0E48\u0E27\u0E22 ", mtFmtAt(d.start_at, true), " \u2013 ", mtFmtAt(d.end_at, true))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: 10
    }
  }, React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: lab
  }, "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E1F"), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, d.cust || React.createElement("span", {
    style: {
      color: P("warn-tx")
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32")), d.addr && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink2"),
      whiteSpace: "pre-line",
      lineHeight: 1.5
    }
  }, d.addr), d.cust_tax && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink2")
    }
  }, "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1C\u0E39\u0E49\u0E40\u0E2A\u0E35\u0E22\u0E20\u0E32\u0E29\u0E35 ", d.cust_tax, d.cust_branch ? " (" + d.cust_branch + ")" : "")), React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: lab
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 / \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, d.place || d.site_id), (d.ca || d.meter_no) && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink2")
    }
  }, [d.ca ? "เลขที่ผู้ใช้ไฟ " + d.ca : "", d.meter_no ? "เลขมิเตอร์ " + d.meter_no : ""].filter(Boolean).join(" · ")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink2")
    }
  }, d.model, " \xB7 ", MT_REG_TH[d.reg] || ""))), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 14
    }
  }, React.createElement("thead", null, React.createElement("tr", null, ["การจดหน่วย", "วันที่ / เวลาที่จด", "เลขอ่านมิเตอร์ (kWh)"].map((h, i) => React.createElement("th", {
    key: h,
    style: {
      padding: "8px 12px",
      fontSize: 11,
      fontWeight: 700,
      color: P("mute"),
      textAlign: i === 2 ? "right" : "left",
      boxShadow: "inset 0 -1.5px 0 " + P("line2")
    }
  }, h)))), React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
    style: tdL
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E48\u0E2D\u0E19"), React.createElement("td", {
    style: tdL
  }, mtFmtAt(d.start_at), d.start_src === "รีเซ็ตมิเตอร์" || d.reset ? " (รีเซ็ตมิเตอร์)" : ""), React.createElement("td", {
    style: tdR
  }, n3(d.start))), React.createElement("tr", null, React.createElement("td", {
    style: tdL
  }, "\u0E08\u0E14\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49"), React.createElement("td", {
    style: tdL
  }, mtFmtAt(d.end_at), d.partial ? " (ยอดถึงเวลานี้)" : ""), React.createElement("td", {
    style: tdR
  }, n3(d.end))), React.createElement("tr", null, React.createElement("td", {
    colSpan: 2,
    style: Object.assign({}, tdL, {
      fontWeight: 700,
      color: P("ink")
    })
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49 (\u0E04\u0E23\u0E31\u0E49\u0E07\u0E19\u0E35\u0E49 \u2212 \u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E48\u0E2D\u0E19)"), React.createElement("td", {
    style: Object.assign({}, tdR, {
      fontWeight: 800,
      fontSize: 14
    })
  }, n3(d.kwh))))), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 6
    }
  }, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
    style: tdL
  }, "\u0E04\u0E48\u0E32\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32 ", n2(d.kwh), " \u0E2B\u0E19\u0E48\u0E27\u0E22 \xD7 ", d.rate == null ? "—" : mtNum(d.rate, 4), " \u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("td", {
    style: tdR
  }, n2(d.amount))), React.createElement("tr", null, React.createElement("td", {
    style: tdL
  }, "\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 ", d.vat_rate ? d.vat_rate + "%" : "(ไม่คิด)"), React.createElement("td", {
    style: tdR
  }, n2(d.vat))))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 12,
      padding: "14px 16px",
      borderRadius: 12,
      background: "color-mix(in srgb, " + P("brand") + " 10%, " + P("bg") + ")"
    }
  }, React.createElement("div", {
    style: {
      flex: "1 1 220px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: P("brand-dk")
    }
  }, "\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E0A\u0E33\u0E23\u0E30"), baht && React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: P("ink2")
    }
  }, "(", baht, ")")), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: compact ? 22 : 26,
      fontWeight: 800,
      color: P("brand-dk"),
      whiteSpace: "nowrap"
    }
  }, n2(d.total), React.createElement("span", {
    style: {
      fontSize: 13,
      fontFamily: "var(--sans)",
      fontWeight: 700,
      marginLeft: 6
    }
  }, "\u0E1A\u0E32\u0E17"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "space-between",
      flexWrap: "wrap",
      marginTop: 14,
      fontSize: 10.5,
      color: P("mute"),
      lineHeight: 1.6
    }
  }, React.createElement("span", null, "\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E08\u0E32\u0E01\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E08\u0E14\u0E14\u0E49\u0E27\u0E22\u0E21\u0E37\u0E2D"), React.createElement("span", null, d.by ? "ออกบิลโดย " + d.by : "")));
}
function mtPrintPaper(el, title) {
  if (!el) return;
  const w = window.open("", "_blank");
  if (!w) return;
  const cs = getComputedStyle(document.documentElement);
  const vars = ["--paper-bg", "--paper-ink", "--paper-ink2", "--paper-ink3", "--paper-mute", "--paper-mute2", "--paper-line", "--paper-line2", "--paper-line3", "--paper-tint", "--paper-brand", "--paper-brand-dk", "--paper-warn-tx", "--paper-warn-tx2", "--paper-warn-bg", "--sans", "--mono", "--display", "--shadow-sm"].map(k => k + ":" + (k === "--shadow-sm" ? "none" : cs.getPropertyValue(k).trim())).join(";");
  const fonts = Array.prototype.map.call(document.querySelectorAll("link[rel=stylesheet][href*='fonts.googleapis']"), l => l.outerHTML).join("");
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + mtEsc(title) + "</title>" + fonts + "<style>:root{" + vars + "}html,body{margin:0;background:#fff}body{padding:10mm 0;-webkit-print-color-adjust:exact;print-color-adjust:exact}" + ".mt-noprint{display:none!important}.mt-paper{box-shadow:none!important;border-radius:0!important;max-width:none!important}@page{size:A4;margin:12mm}</style></head><body>" + el.outerHTML + "<script>window.onload=function(){setTimeout(function(){print()},350)}<\/script></body></html>");
  w.document.close();
}
const mtEsc = x => String(x == null ? "" : x).replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[c]);
function MtSiteBill({
  s,
  st,
  isAdmin,
  canEdit,
  now
}) {
  const isMobile = useMtMobile();
  const [boxRef, bw] = useMtWidth();
  const W = bw || (isMobile ? 360 : 1200);
  const stack = W < 980;
  const compact = (stack ? W : W - 334) < 600;
  const cur = mtCurYm(),
    prevYm = mtShiftYm(cur, -1);
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const bills = useMtRef("mtBills/" + s.n);
  const owner = useMtRef(s.owner ? "mtPartners/" + s.owner : "");
  const [ym, setYm] = React.useState(null);
  React.useEffect(() => {
    if (ym || days === undefined) return;
    setYm(Object.keys(days || {}).some(k => k.slice(0, 6) === prevYm.replace("-", "")) ? prevYm : cur);
  }, [days]);
  if (!ym) return React.createElement("div", {
    ref: boxRef,
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026"));
  const past = Object.keys(bills || {}).sort().reverse();
  return React.createElement("div", {
    ref: boxRef,
    style: {
      display: "grid",
      gridTemplateColumns: stack ? "minmax(0, 1fr)" : "minmax(0, 1fr) 320px",
      gap: 14,
      alignItems: "start"
    }
  }, React.createElement(MtBillWork, {
    key: ym,
    s: s,
    st: st,
    ym: ym,
    setYm: setYm,
    cur: cur,
    days: days,
    saved: bills ? bills[ym.replace("-", "")] || null : bills,
    owner: owner,
    canEdit: canEdit,
    isAdmin: isAdmin,
    now: now,
    stack: stack,
    compact: compact
  }), React.createElement("div", {
    style: {
      gridColumn: stack ? undefined : "1 / -1"
    }
  }, React.createElement(MtBillHistory, {
    s: s,
    bills: bills,
    past: past,
    ym: ym,
    setYm: setYm,
    isAdmin: isAdmin
  })));
}
function MtBillWork({
  s,
  st,
  ym,
  setYm,
  cur,
  days,
  saved,
  owner,
  canEdit,
  isAdmin,
  now,
  stack,
  compact
}) {
  const paperRef = React.useRef(null);
  const reg = mtRegOf(s);
  const b = s.bill || {};
  const live = (() => {
    const v = mtLive(st, now);
    return v ? {
      v,
      at: Date.parse(st.at)
    } : null;
  })();
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg, live), [days, ym, reg, live && live.v[reg], live && live.at]);
  const [recalc, setRecalc] = React.useState(false);
  const [rateIn, setRateIn] = React.useState(b.rate == null ? "" : String(b.rate));
  const [vatOn, setVatOn] = React.useState(b.vat !== false);
  const [regIn, setRegIn] = React.useState(reg);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");
  const useSaved = !!saved && !recalc;
  const rate = rateIn === "" || !isFinite(Number(rateIn)) ? null : Number(rateIn);
  const company = owner && owner.company || {};
  const draft = (() => {
    const okR = auto.start != null && auto.end != null && auto.end >= auto.start;
    const kwh = okR ? Math.round((auto.end - auto.start) * 1000) / 1000 : null;
    const amount = kwh != null && rate != null ? Math.round(kwh * rate * 100) / 100 : null;
    const vr = vatOn ? 7 : 0;
    const vat = amount != null ? Math.round(amount * vr) / 100 : null;
    const ci = mtCustOf(s);
    return {
      draft: true,
      month: ym,
      no: "SITE" + mtPad(s.n) + "-" + ym.replace("-", ""),
      at: null,
      start: auto.start,
      end: auto.end,
      start_at: auto.start_at,
      end_at: auto.end_at,
      partial: auto.partial,
      reset: auto.reset,
      kwh,
      rate,
      amount,
      vat_rate: vr,
      vat,
      total: amount != null ? Math.round((amount + vat) * 100) / 100 : null,
      cust: ci.cust,
      addr: ci.addr,
      cust_tax: ci.tax,
      cust_branch: ci.branch,
      place: ci.place,
      ca: ci.ca,
      meter_no: ci.meter_no,
      reg,
      issuer: s.owner ? Object.assign({
        name: owner && owner.name
      }, company) : null
    };
  })();
  const d = useSaved ? Object.assign({}, saved, {
    month: ym,
    reg: saved.reg || reg
  }) : draft;
  d.site_id = mtIdent(s);
  d.model = mtModelShort(s);
  d.logo = d.issuer && s.owner && (!useSaved || !saved.issuer || saved.issuer.pid === s.owner) ? company.logo : "";
  const canIssue = canEdit && !useSaved && draft.kwh != null && rate != null && rate >= 0 && rate <= 100;
  const issue = async () => {
    if (!canIssue) return;
    if (ym === cur) {
      const yes = await window.askConfirm({
        title: "ออกบิลยอดถึงตอนนี้?",
        body: "เดือน" + mtMonTH(ym) + " ยังไม่จบ — บิลจะใช้เลขมิเตอร์ ณ ตอนนี้ (" + mtNum(draft.kwh, 2) + " หน่วย) ปกติออกบิลหลังวันที่ 1 เดือนหน้า เลขจะครบทั้งเดือน",
        ok: "ออกบิลยอดถึงตอนนี้",
        icon: "file"
      });
      if (!yes) return;
    }
    if (saved) {
      const yes = await window.askConfirm({
        title: "ออกบิล " + mtMonTH(ym) + " ทับฉบับเดิม?",
        body: "ฉบับเดิม " + mtMoney(saved.total) + " บาท (ออกโดย " + (saved.by || "—") + ") จะเก็บไว้ในประวัติของบิลนี้",
        ok: "ออกบิลทับ",
        icon: "file"
      });
      if (!yes) return;
    }
    setBusy(true);
    setErr("");
    setOk("");
    try {
      if (rate !== b.rate || vatOn !== (b.vat !== false) || isAdmin && regIn !== reg) await mtCall(Object.assign({
        action: "bill-cfg",
        n: s.n,
        rate,
        vat: vatOn
      }, isAdmin ? {
        reg: regIn
      } : {}));
      await mtCall({
        action: "bill-save",
        n: s.n,
        month: ym,
        rate
      });
      setRecalc(false);
      setOk("ออกบิลแล้ว");
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  };
  const saveCfg = async () => {
    setBusy(true);
    setErr("");
    setOk("");
    try {
      await mtCall(Object.assign({
        action: "bill-cfg",
        n: s.n,
        rate,
        vat: vatOn
      }, isAdmin ? {
        reg: regIn
      } : {}));
      setOk("บันทึกราคาแล้ว");
    } catch (e) {
      setErr(String(e.message || e));
    }
    setBusy(false);
  };
  const cfgDirty = rate !== (b.rate == null ? null : Number(b.rate)) || vatOn !== (b.vat !== false) || isAdmin && regIn !== reg;
  const hist = saved && saved.hist ? Object.keys(saved.hist).sort().reverse().map(k => saved.hist[k]) : [];
  const warn = useSaved ? [] : auto.warn;
  const fieldWrap = {
    display: "flex",
    alignItems: "center",
    background: "var(--surface2)",
    boxShadow: "var(--shadow-inset)",
    borderRadius: "var(--r-tile)",
    height: 44,
    padding: "0 12px",
    gap: 8
  };
  const status = useSaved ? {
    bg: "var(--tint-ok-bg)",
    tx: "var(--tint-ok-tx)",
    icon: "check",
    t: "ออกบิลแล้ว",
    s: mtWhen(saved.at) + " · โดย " + (saved.by || "—") + (saved.by_kind === "partner" ? " (พาร์ทเนอร์)" : "")
  } : saved ? {
    bg: "var(--surface2)",
    tx: "var(--text-2)",
    icon: "history",
    t: "กำลังคำนวณใหม่",
    s: "ยังไม่บันทึก — บิลเดิม " + mtMoney(saved.total) + " บาท ยังมีผล"
  } : ym === cur ? {
    bg: "var(--surface2)",
    tx: "var(--text-2)",
    icon: "clock",
    t: "เดือนนี้ยังไม่จบ",
    s: "แสดงยอดถึงตอนนี้ · ออกบิลได้หลังวันที่ 1 เดือนหน้า"
  } : {
    bg: "var(--tint-amber-bg)",
    tx: "var(--tint-amber-tx)",
    icon: "alert",
    t: "ยังไม่ออกบิล",
    s: "ตรวจราคาต่อหน่วย แล้วกดออกบิล"
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0
    }
  }, React.createElement("div", {
    className: "mt-noprint",
    style: mtPanel({
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    })
  }, React.createElement(MtStepper, {
    label: mtMonTH(ym),
    onPrev: () => setYm(mtShiftYm(ym, -1)),
    onNext: () => setYm(mtShiftYm(ym, 1)),
    canNext: ym < cur
  }), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E14\u0E39/\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25"), useSaved && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => mtPrintPaper(paperRef.current, d.no),
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 13
  }), "\u0E1E\u0E34\u0E21\u0E1E\u0E4C / PDF")), React.createElement(MtBillPaper, {
    d: d,
    paperRef: paperRef,
    compact: compact
  })), React.createElement("div", {
    className: "mt-noprint",
    style: mtPanel({
      display: "flex",
      flexDirection: "column",
      gap: 14,
      position: stack ? "static" : "sticky",
      top: 12
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      padding: "11px 13px",
      borderRadius: "var(--r-tile)",
      background: status.bg
    }
  }, React.createElement(Icon, {
    name: status.icon,
    size: 17,
    color: status.tx,
    sw: 2.2
  }), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: status.tx
    }
  }, status.t), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-2)",
      lineHeight: 1.5
    }
  }, status.s))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, React.createElement("div", {
    style: {
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: "9px 12px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49"), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 700
    }
  }, mtNum(d.kwh, 2), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginLeft: 3,
      fontFamily: "var(--sans)"
    }
  }, "kWh"))), React.createElement("div", {
    style: {
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: "9px 12px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E27\u0E21\u0E40\u0E07\u0E34\u0E19"), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, mtMoney(d.total), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginLeft: 3,
      fontFamily: "var(--sans)"
    }
  }, "\u0E1A\u0E32\u0E17")))), canEdit && !useSaved && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E23\u0E32\u0E04\u0E32\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("div", {
    style: fieldWrap
  }, React.createElement("input", {
    value: rateIn,
    inputMode: "decimal",
    placeholder: "0.00",
    onChange: e => setRateIn(e.target.value.replace(/[^\d.]/g, "")),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      background: "transparent",
      boxShadow: "none",
      textAlign: "right",
      fontFamily: "var(--mono)",
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      outline: "none",
      padding: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, "\u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22"))), React.createElement("label", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      fontSize: 13,
      cursor: "pointer"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: vatOn,
    onChange: e => setVatOn(e.target.checked)
  }), " \u0E04\u0E34\u0E14\u0E20\u0E32\u0E29\u0E35\u0E21\u0E39\u0E25\u0E04\u0E48\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21 7%"), isAdmin && React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, "\u0E08\u0E14\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E2B\u0E19\u0E02\u0E2D\u0E07\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C (\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19)"), React.createElement("select", {
    value: regIn,
    onChange: e => setRegIn(e.target.value),
    style: Object.assign({}, mtField, {
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  }, Object.keys(MT_REG_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, MT_REG_TH[k]))), regIn !== reg && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-amber-tx)",
      marginTop: 4
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E1A\u0E19\u0E1A\u0E34\u0E25\u0E08\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E15\u0E32\u0E21\u0E0A\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6,
      display: "flex",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "lock",
    size: 13,
    color: "var(--text-3)"
  }), "\u0E40\u0E25\u0E02\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E2D\u0E48\u0E32\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u0E41\u0E01\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \xB7 \u0E23\u0E32\u0E04\u0E32\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25\u0E08\u0E30\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B")), warn.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, warn.map((w, i) => React.createElement("div", {
    key: i,
    style: {
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      background: "var(--tint-amber-bg)",
      padding: "7px 10px",
      borderRadius: "var(--r-tile)",
      lineHeight: 1.5
    }
  }, w))), err && React.createElement("div", {
    style: mtErrBox
  }, err), ok && !err && React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-ok-tx)"
    }
  }, ok), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, canEdit && !useSaved && React.createElement("button", {
    className: ym === cur ? "btn" : "btn btn-pri",
    disabled: !canIssue || busy,
    onClick: issue,
    style: {
      height: 46,
      fontSize: 14
    }
  }, busy ? "กำลังบันทึก…" : saved ? "ออกบิลทับฉบับเดิม" : ym === cur ? "ออกบิลยอดถึงตอนนี้" : "ออกบิล " + mtMonTH(ym)), canEdit && !useSaved && cfgDirty && React.createElement("button", {
    className: "btn",
    disabled: busy || rate == null,
    onClick: saveCfg
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E04\u0E32\u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19 (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E2D\u0E01\u0E1A\u0E34\u0E25)"), useSaved && React.createElement("button", {
    className: "btn btn-soft",
    onClick: () => mtPrintPaper(paperRef.current, d.no),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 14
  }), "\u0E1E\u0E34\u0E21\u0E1E\u0E4C / \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"), canEdit && useSaved && React.createElement("button", {
    className: "btn",
    onClick: () => {
      setRecalc(true);
      setOk("");
    }
  }, "\u0E04\u0E33\u0E19\u0E27\u0E13\u0E43\u0E2B\u0E21\u0E48\u0E08\u0E32\u0E01\u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C"), canEdit && recalc && React.createElement("button", {
    className: "btn",
    onClick: () => {
      setRecalc(false);
      setErr("");
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01 \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E1A\u0E34\u0E25\u0E40\u0E14\u0E34\u0E21")), !canEdit && !useSaved && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E19\u0E35\u0E49\u0E14\u0E39\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"), hist.length > 0 && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.7,
      boxShadow: "inset 0 1px 0 var(--divider)",
      paddingTop: 10
    }
  }, React.createElement("div", {
    style: {
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E09\u0E1A\u0E31\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49 (\u0E16\u0E39\u0E01\u0E2D\u0E2D\u0E01\u0E17\u0E31\u0E1A)"), hist.map((h, i) => React.createElement("div", {
    key: i
  }, mtWhen(h.at), " \xB7 ", h.by, " \xB7 ", mtMoney(h.total), " \u0E1A\u0E32\u0E17")))));
}
function MtBillHistory({
  s,
  bills,
  past,
  ym,
  setYm,
  isAdmin
}) {
  const [delErr, setDelErr] = React.useState("");
  const delBill = async (k, b) => {
    const ok = await window.askConfirm({
      title: "ลบบิล " + (b.no || k) + "?",
      body: mtMonTH(k.slice(0, 4) + "-" + k.slice(4)) + " · " + mtMoney(b.total != null ? b.total : b.amount) + " บาท · ออกโดย " + (b.by || "—") + " — บิลจะหายจากหน้าเว็บ (ระบบเก็บสำเนาไว้หลังบ้าน)",
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
  const sum = past.reduce((t, k) => t + (Number((bills[k] || {}).total) || 0), 0);
  return React.createElement("div", {
    className: "mt-noprint",
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "history",
    title: "\u0E1A\u0E34\u0E25\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27",
    sub: past.length ? past.length + " ใบ · รวม " + mtMoney(sum) + " บาท" : "ยังไม่มีบิลที่ออก"
  }), delErr && React.createElement("div", {
    style: mtErrBox
  }, delErr), past.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, past.map((k, i) => {
    const b = bills[k] || {};
    const km = k.slice(0, 4) + "-" + k.slice(4);
    const nh = b.hist ? Object.keys(b.hist).length : 0;
    const on = km === ym;
    return React.createElement("div", {
      key: k,
      role: "button",
      tabIndex: 0,
      className: "mt-row",
      onClick: () => setYm(km),
      onKeyDown: e => {
        if (e.key === "Enter") setYm(km);
      },
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(120px, 1.1fr) minmax(0, 1.4fr) auto",
        gap: 12,
        alignItems: "center",
        padding: "11px 12px",
        cursor: "pointer",
        borderRadius: "var(--r-tile)",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : i ? "inset 0 1px 0 var(--divider)" : "none",
        background: on ? "var(--primary-soft)" : undefined
      }
    }, React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, mtMonTH(km)), React.createElement("div", {
      style: {
        fontSize: 11,
        fontFamily: "var(--mono)",
        color: "var(--text-3)"
      }
    }, b.no)), React.createElement("div", {
      style: {
        minWidth: 0,
        fontSize: 11.5,
        color: "var(--text-3)",
        lineHeight: 1.5
      }
    }, React.createElement("div", {
      style: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, mtNum(b.kwh, 2), " \u0E2B\u0E19\u0E48\u0E27\u0E22 \xD7 ", mtNum(b.rate, 2), " \u0E1A\u0E32\u0E17", b.vat_rate ? " + VAT " + b.vat_rate + "%" : ""), React.createElement("div", {
      style: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, "\u0E2D\u0E2D\u0E01\u0E42\u0E14\u0E22 ", b.by || "—", " \xB7 ", mtWhen(b.at), nh ? " · ออกทับ " + nh + " ครั้ง" : "")), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 14.5,
        fontWeight: 800,
        color: "var(--text-1)",
        whiteSpace: "nowrap"
      }
    }, mtMoney(b.total != null ? b.total : b.amount), React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginLeft: 3,
        fontFamily: "var(--sans)"
      }
    }, "\u0E1A\u0E32\u0E17")), isAdmin && React.createElement("button", {
      className: "btn btn-sm btn-dngr",
      title: "\u0E25\u0E1A\u0E1A\u0E34\u0E25\u0E19\u0E35\u0E49",
      onClick: e => {
        e.stopPropagation();
        delBill(k, b);
      }
    }, React.createElement(Icon, {
      name: "trash",
      size: 13
    }))));
  })));
}
const MT_INFO_GROUPS = [{
  icon: "user",
  title: "ลูกค้า (ผู้ใช้ไฟ)",
  sub: "ชื่อและที่อยู่นี้ขึ้นบนบิลทุกใบ",
  fields: [["cust", "ชื่อลูกค้า", "เช่น บริษัท ไทยสตีล จำกัด", 2], ["tax", "เลขประจำตัวผู้เสียภาษี", "13 หลัก", 1], ["branch", "สาขา", "สำนักงานใหญ่ / 00001", 1], ["addr", "ที่อยู่ (ขึ้นบนบิล)", "", 2, true]]
}, {
  icon: "pin",
  title: "สถานที่ติดตั้งและระบบ",
  sub: "",
  fields: [["place", "สถานที่ติดตั้ง", "เช่น หลังคาโรงงาน 2 นิคมอมตะซิตี้", 2], ["kwp", "ขนาดระบบ (kWp)", "เช่น 500", 1], ["cod", "วันเริ่มจ่ายไฟ", "", 1, false, "date"], ["ca", "เลขที่ผู้ใช้ไฟ (การไฟฟ้า)", "", 1], ["meter_no", "เลขมิเตอร์ (S/N)", "", 1]]
}, {
  icon: "phone",
  title: "ผู้ติดต่อ",
  sub: "",
  fields: [["contact", "ชื่อผู้ติดต่อ", "", 1], ["phone", "โทร", "", 1], ["note", "หมายเหตุ", "", 2, true]]
}];
const MT_INFO_KEYS = MT_INFO_GROUPS.reduce((a, g) => a.concat(g.fields.map(f => f[0])), []);
function MtSiteInfo({
  s,
  canEdit
}) {
  const isMobile = useMtMobile();
  const [boxRef, bw] = useMtWidth();
  const two = (bw || (isMobile ? 360 : 1200)) >= 620;
  const init = () => {
    const c = mtCustOf(s);
    const o = {};
    MT_INFO_KEYS.forEach(k => {
      o[k] = c[k] == null ? "" : String(c[k]);
    });
    return o;
  };
  const [f, setF] = React.useState(init);
  const [base] = React.useState(init);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const dirty = MT_INFO_KEYS.some(k => f[k] !== base[k]);
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
  const ro = {
    fontSize: 13.5,
    color: "var(--text-1)",
    padding: "10px 12px",
    borderRadius: "var(--r-tile)",
    background: "color-mix(in srgb, var(--surface2) 60%, transparent)",
    minHeight: 20,
    whiteSpace: "pre-line"
  };
  return React.createElement("div", {
    ref: boxRef,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, MT_INFO_GROUPS.map(g => React.createElement("div", {
    key: g.title,
    style: mtCard
  }, React.createElement(MtHead, {
    icon: g.icon,
    color: "var(--primary)",
    title: g.title,
    sub: g.sub
  }), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: two ? "repeat(2, minmax(0, 1fr))" : "1fr",
      gap: 12
    }
  }, g.fields.map(([k, label, ph, span, multi, type]) => React.createElement("div", {
    key: k,
    style: {
      gridColumn: span === 2 ? "1 / -1" : undefined
    }
  }, React.createElement("div", {
    style: mtLbl
  }, label), !canEdit ? React.createElement("div", {
    style: ro
  }, k === "cod" && f[k] ? mtFmtAt(f[k]) : f[k] || React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2014")) : multi ? React.createElement("textarea", {
    rows: 2,
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
    value: f[k],
    placeholder: ph,
    inputMode: k === "kwp" ? "decimal" : undefined,
    onChange: e => setF(Object.assign({}, f, {
      [k]: k === "kwp" ? e.target.value.replace(/[^\d.]/g, "") : k === "tax" ? e.target.value.replace(/[^\d-]/g, "") : e.target.value
    })),
    style: fld
  })))))), canEdit && React.createElement("div", {
    style: mtPanel({
      padding: "12px 16px",
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      position: "sticky",
      bottom: 10,
      zIndex: 2
    })
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      flex: "1 1 200px"
    }
  }, s.info && s.info.by ? "แก้ล่าสุดโดย " + s.info.by + " · " + mtWhen(s.info.at) : "ยังไม่เคยลงทะเบียนไซต์นี้"), err && React.createElement("span", {
    style: Object.assign({}, mtErrBox, {
      padding: "6px 10px"
    })
  }, err), msg && !dirty && React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: "var(--tint-ok-tx)",
      fontWeight: 700
    }
  }, msg), React.createElement("button", {
    className: "btn btn-pri",
    disabled: busy || !dirty,
    onClick: save
  }, busy ? "กำลังบันทึก…" : "บันทึกข้อมูลไซต์")));
}
function MtMonView({
  role,
  currentUser,
  partner
}) {
  const isAdmin = !partner && (window.hasRole ? window.hasRole(role, "admin") : false);
  const isMobile = useMtMobile();
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
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");
  const sites = list.filter(s => s.meter_model !== "none" || status && status[s.n]);
  const daysAll = useMtMany(sites.map(s => "mtMeter/" + s.n + "/d"));
  const billsAll = useMtMany(sites.map(s => "mtBills/" + s.n));
  const sel = pick == null ? null : sites.find(s => s.n === pick);
  const canEdit = s => isAdmin || !!(partner && s.owner === partner.id);
  if (sel) return React.createElement(MtMonDetail, {
    key: sel.n,
    s: sel,
    st: status && status[sel.n],
    isAdmin: isAdmin,
    canEdit: canEdit(sel),
    onBack: () => setPick(null),
    now: now,
    partner: partner
  });
  if (admin && window.MtPartnerAdmin) return React.createElement(window.MtPartnerAdmin, {
    sites: list,
    onBack: () => setAdmin(false)
  });
  const today = mtThDay(now),
    ym = mtCurYm();
  const roll = {
    n: sites.length,
    kw: 0,
    live: 0,
    kwp: 0,
    day: null,
    yday: null,
    mon: null,
    money: null,
    reading: null,
    mdays: 0
  };
  const counts = {};
  let lastAt = 0;
  const add = (k, v) => {
    if (v != null) roll[k] = (roll[k] || 0) + v;
  };
  const stateOf = {};
  sites.forEach(s => {
    const st = status && status[s.n];
    const k = mtSiteState(s, st, now);
    stateOf[s.n] = k;
    counts[k.k] = (counts[k.k] || 0) + 1;
    if (st && st.at) lastAt = Math.max(lastAt, Date.parse(st.at));
    const live = mtLive(st, now),
      reg = mtRegOf(s),
      days = daysAll["mtMeter/" + s.n + "/d"],
      rate = mtRateOf(s);
    if (live) {
      roll.live++;
      roll.kw += Math.max(0, Number(live.kw) || 0);
      add("reading", live[reg] != null ? Math.abs(live[reg]) : null);
    }
    roll.kwp += mtKwpOf(s) || 0;
    add("day", mtDayKwh(days, today, reg, live));
    add("yday", mtDayKwh(days, mtShiftDay(today, -1), reg, live));
    const mk = mtMonKwh(days, ym, reg, live);
    add("mon", mk);
    roll.mdays = Math.max(roll.mdays, mtDataDays(days, ym));
    if (rate != null && mk != null) add("money", mk * rate);
  });
  const ql = q.trim().toLowerCase();
  const shown = sites.filter(s => (filter === "all" || stateOf[s.n].k === filter) && (!ql || [mtTitleOf(s), s.name, mtIdent(s), mtCustOf(s).place].join(" ").toLowerCase().includes(ql)));
  const ag = status && status._agent;
  const agOk = ag && now - Date.parse(ag.at || ag.seen) < MT_LIVE_MS;
  const adminFoot = isAdmin ? React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    title: ag ? "ติดต่อล่าสุด " + new Date(ag.at || ag.seen).toLocaleTimeString("th-TH") : "ยังไม่ได้ติดตั้ง agent บน VPS",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      padding: "5px 11px",
      borderRadius: 999,
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      color: agOk ? "var(--text-2)" : "var(--tint-red-tx)"
    }
  }, React.createElement(Icon, {
    name: "net",
    size: 13
  }), ag ? "agent " + (ag.ver ? "v" + ag.ver + " · " : "") + (agOk ? "ปกติ" : "เงียบ") : "ยังไม่มี agent"), React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: () => setAdmin(true),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "users",
    size: 13
  }), "\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E1E\u0E32\u0E23\u0E4C\u0E17\u0E40\u0E19\u0E2D\u0E23\u0E4C / \u0E21\u0E2D\u0E1A\u0E44\u0E0B\u0E15\u0E4C")) : null;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, loading ? React.createElement("div", {
    style: mtCard
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026")) : !sites.length ? React.createElement("div", {
    style: mtPanel({
      padding: "40px 24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      textAlign: "center"
    })
  }, React.createElement(MtBubble, {
    icon: "sun",
    size: 54
  }), React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, partner ? "ยังไม่มีไซต์ในบัญชีนี้" : "ยังไม่มีไซต์ที่ต่อมิเตอร์"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      maxWidth: 380
    }
  }, partner ? "เมื่อผู้ดูแลระบบมอบไซต์ให้ ไซต์จะขึ้นที่นี่พร้อมกำลังไฟ พลังงาน และบิลค่าไฟ" : "เพิ่มไซต์ที่ ตั้งค่า → ไซต์ MikroTik แล้วตั้ง IP มิเตอร์เป็น 10.10.N.20"), adminFoot) : React.createElement(React.Fragment, null, React.createElement(MtHero, {
    roll: roll,
    counts: counts,
    filter: filter,
    setFilter: setFilter,
    lastAt: lastAt,
    now: now,
    isMobile: isMobile,
    foot: adminFoot
  }), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "\u0E44\u0E0B\u0E15\u0E4C\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, filter === "all" && !ql ? sites.length + " ไซต์" : "แสดง " + shown.length + " จาก " + sites.length), filter !== "all" && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setFilter("all")
  }, "\u0E25\u0E49\u0E32\u0E07\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07"), sites.length > 6 && React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      borderRadius: "var(--r-pill)",
      padding: "0 14px",
      height: 38,
      minWidth: 220
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E44\u0E0B\u0E15\u0E4C / \u0E25\u0E39\u0E01\u0E04\u0E49\u0E32",
    style: {
      border: "none",
      background: "transparent",
      boxShadow: "none",
      outline: "none",
      flex: 1,
      fontFamily: "inherit",
      fontSize: 13,
      padding: 0
    }
  }))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(" + (isMobile ? 260 : 310) + "px, 1fr))",
      gap: 14
    }
  }, shown.map(s => React.createElement(MtMonCard, {
    key: s.n,
    s: s,
    st: status && status[s.n],
    days: daysAll["mtMeter/" + s.n + "/d"],
    bills: billsAll["mtBills/" + s.n],
    now: now,
    onOpen: () => setPick(s.n)
  }))), !shown.length && React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      padding: "6px 2px"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E0B\u0E15\u0E4C\u0E15\u0E32\u0E21\u0E15\u0E31\u0E27\u0E01\u0E23\u0E2D\u0E07\u0E19\u0E35\u0E49")));
}
window.MtMonView = MtMonView;
window.mtBillAuto = mtBillAuto;
window.MtSiteInfo = MtSiteInfo;
Object.assign(window, {
  MtBubble,
  MtHead,
  MtStatePill,
  mtSiteState,
  mtCustOf,
  useMtRef,
  mtPanel
});