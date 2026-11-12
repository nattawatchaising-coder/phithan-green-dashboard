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
const mtModelShort = s => mtModelName(s && s.meter_model || "leos-ipm310").split(" (")[0].split("（")[0].split(" —")[0];
const MT_TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MT_TH_MON_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const MT_LIVE_MS = 5 * 60e3;
const MT_HS_MS = 180e3;
const MT_LANGS = [["th", "ไทย"], ["en", "English"], ["zh", "中文"]];
let mtLangCur = (() => {
  try {
    const v = localStorage.getItem("mt_lang");
    return v === "en" || v === "zh" ? v : "th";
  } catch (e) {
    return "th";
  }
})();
const mtLangSubs = new Set();
function mtSetLang(l) {
  if (l === mtLangCur || !MT_LANGS.some(x => x[0] === l)) return;
  mtLangCur = l;
  try {
    localStorage.setItem("mt_lang", l);
  } catch (e) {}
  mtLangSubs.forEach(fn => fn(l));
}
function useMtLang() {
  const [l, setL] = React.useState(mtLangCur);
  React.useEffect(() => {
    mtLangSubs.add(setL);
    setL(mtLangCur);
    return () => {
      mtLangSubs.delete(setL);
    };
  }, []);
  return l;
}
const mtT = (th, en, zh) => mtLangCur === "en" ? en : mtLangCur === "zh" ? zh : th;
const mtLoc = () => mtLangCur === "en" ? "en-GB" : mtLangCur === "zh" ? "zh-CN" : "th-TH";
const mtBaht = () => mtT("บาท", "THB", "泰铢");
const mtPctOf = (p, of) => mtT(p + "% ของ" + (/^\d/.test(of) ? " " : "") + of, p + "% of " + of, "占" + of + "的" + p + "%");
const MT_EN_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MT_EN_MON_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const mtMonName = (m, full) => mtLangCur === "zh" ? m + "月" : (mtLangCur === "en" ? full ? MT_EN_MON_FULL : MT_EN_MON : full ? MT_TH_MON_FULL : MT_TH_MON)[m - 1];
const mtYear = y => mtLangCur === "th" ? y + 543 : y;
function mtAgoL(ms) {
  if (ms == null || !isFinite(ms)) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  const u = s < 60 ? 0 : s < 3600 ? 1 : s < 86400 ? 2 : 3;
  const n = [s, Math.round(s / 60), Math.round(s / 3600), Math.round(s / 86400)][u];
  if (mtLangCur === "en") return n + ["s", " min", " h", n === 1 ? " day" : " days"][u] + " ago";
  if (mtLangCur === "zh") return n + ["秒前", "分钟前", "小时前", "天前"][u];
  return n + [" วิที่แล้ว", " นาทีที่แล้ว", " ชม.ที่แล้ว", " วันที่แล้ว"][u];
}
const mtWhenL = iso => iso ? new Date(iso).toLocaleString(mtLoc(), {
  dateStyle: "medium",
  timeStyle: "short"
}) : "—";
const mtRegName = r => ({
  kwh_imp: mtT("kWh Import (ไฟเข้า)", "kWh Import", "kWh 输入"),
  kwh_exp: mtT("kWh Export (ไฟออก)", "kWh Export", "kWh 输出"),
  kwh_net: mtT("kWh Net (สุทธิ)", "kWh Net", "kWh 净值")
})[r] || "";
const mtModelName = k => k === "none" ? mtT("ไม่มีมิเตอร์", "No meter", "无电表") : k === "pm2200" ? mtT(MT_MODEL_TH.pm2200, "Schneider PM2200 (via Waveshare) — not yet tested on real hardware", "Schneider PM2200（经 Waveshare）— 尚未实机测试") : MT_MODEL_TH[k] || k;
function mtEnWords(n) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const t = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const h = x => [x >= 100 ? a[Math.floor(x / 100)] + " Hundred" : "", x % 100 >= 20 ? t[Math.floor(x % 100 / 10)] + (x % 10 ? "-" + a[x % 10] : "") : a[x % 100]].filter(Boolean).join(" ");
  if (!n) return "Zero";
  const out = [];
  ["", " Thousand", " Million", " Billion"].forEach(sc => {
    const c = n % 1000;
    if (c) out.unshift(h(c) + sc);
    n = Math.floor(n / 1000);
  });
  return out.join(" ");
}
function mtZhCap(n) {
  const D = "零壹贰叁肆伍陆柒捌玖",
    U = ["仟", "佰", "拾", ""],
    S = ["", "万", "亿"];
  if (!n) return "零";
  const secs = [];
  while (n > 0) {
    secs.push(n % 10000);
    n = Math.floor(n / 10000);
  }
  let out = "";
  for (let i = secs.length - 1; i >= 0; i--) {
    const v = secs[i];
    if (!v) {
      if (out && !out.endsWith("零")) out += "零";
      continue;
    }
    if (out && v < 1000 && !out.endsWith("零")) out += "零";
    const ds = [Math.floor(v / 1000), Math.floor(v / 100) % 10, Math.floor(v / 10) % 10, v % 10];
    let s = "",
      started = false,
      zero = false;
    ds.forEach((dg, j) => {
      if (dg) {
        s += (zero ? "零" : "") + D[dg] + U[j];
        zero = false;
        started = true;
      } else if (started) zero = true;
    });
    out += s + (S[i] || "");
  }
  return out.replace(/零+$/, "");
}
function mtBahtWords(total) {
  if (total == null || !isFinite(total)) return "";
  const v = Math.round(Math.abs(total) * 100),
    b = Math.floor(v / 100),
    st = v % 100,
    neg = total < 0;
  if (mtLangCur === "en") return (neg ? "Minus " : "") + mtEnWords(b) + " Baht" + (st ? " and " + mtEnWords(st) + " Satang" : " Only");
  if (mtLangCur === "zh") return (neg ? "负" : "") + mtZhCap(b) + "铢" + (st ? mtZhCap(st) + "萨当" : "整");
  return window.ecBahtText ? window.ecBahtText(total) : "";
}
const mtChartTx = () => mtLangCur === "en" ? {
  expand: "Expand",
  chart: "Chart",
  table: "Table",
  nodata: "No data yet",
  none: "No data",
  unfinished: "in progress",
  now: "Now",
  use: "Use",
  gen: "Gen"
} : mtLangCur === "zh" ? {
  expand: "展开",
  chart: "图表",
  table: "表格",
  nodata: "暂无数据",
  none: "无数据",
  unfinished: "未结束",
  now: "现在",
  use: "用电",
  gen: "发电"
} : null;
function mtStar(cx, cy, r, toX, toY) {
  const rot = toX == null ? -Math.PI / 2 : Math.atan2(toY - cy, toX - cx);
  let d = "";
  for (let i = 0; i < 10; i++) {
    const a = rot + i * Math.PI / 5,
      q = i % 2 ? r * 0.382 : r;
    d += (i ? "L" : "M") + (cx + q * Math.cos(a)).toFixed(2) + "," + (cy + q * Math.sin(a)).toFixed(2);
  }
  return d + "Z";
}
function MtFlag({
  l,
  h
}) {
  const H = h || 13,
    st = {
      width: Math.round(H * 1.5),
      height: H,
      display: "block",
      flexShrink: 0,
      borderRadius: 2.5,
      boxShadow: "0 0 0 1px rgba(15, 43, 51, .14)"
    };
  if (l === "en") return React.createElement("svg", {
    viewBox: "0 0 60 40",
    preserveAspectRatio: "none",
    style: st,
    "aria-hidden": "true"
  }, React.createElement("rect", {
    width: "60",
    height: "40",
    fill: "#012169"
  }), React.createElement("path", {
    d: "M0,0L60,40M60,0L0,40",
    stroke: "#fff",
    strokeWidth: "8"
  }), React.createElement("path", {
    d: "M0,0L60,40M60,0L0,40",
    stroke: "#C8102E",
    strokeWidth: "3"
  }), React.createElement("path", {
    d: "M30,0V40M0,20H60",
    stroke: "#fff",
    strokeWidth: "12"
  }), React.createElement("path", {
    d: "M30,0V40M0,20H60",
    stroke: "#C8102E",
    strokeWidth: "7"
  }));
  if (l === "zh") return React.createElement("svg", {
    viewBox: "0 0 30 20",
    style: st,
    "aria-hidden": "true"
  }, React.createElement("rect", {
    width: "30",
    height: "20",
    fill: "#EE1C25"
  }), React.createElement("path", {
    d: mtStar(5, 5, 3),
    fill: "#FFDE00"
  }), [[10, 2], [12, 4], [12, 7], [10, 9]].map(([x, y]) => React.createElement("path", {
    key: x + "-" + y,
    d: mtStar(x, y, 1, 5, 5),
    fill: "#FFDE00"
  })));
  return React.createElement("svg", {
    viewBox: "0 0 9 6",
    style: st,
    "aria-hidden": "true"
  }, React.createElement("rect", {
    width: "9",
    height: "6",
    fill: "#A51931"
  }), React.createElement("rect", {
    y: "1",
    width: "9",
    height: "4",
    fill: "#F4F5F8"
  }), React.createElement("rect", {
    y: "2",
    width: "9",
    height: "2",
    fill: "#2D2A4A"
  }));
}
function MtLangPick({
  compact
}) {
  const cur = useMtLang();
  return React.createElement("div", {
    className: "mt-noprint",
    role: "group",
    "aria-label": "\u0E20\u0E32\u0E29\u0E32 \xB7 Language \xB7 \u8BED\u8A00",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      padding: 3,
      flexShrink: 0,
      borderRadius: "var(--r-pill)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    }
  }, MT_LANGS.map(([k, name]) => {
    const on = cur === k;
    return React.createElement("button", {
      key: k,
      type: "button",
      onClick: () => mtSetLang(k),
      title: name,
      "aria-label": name,
      "aria-pressed": on,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 11.5,
        fontWeight: 700,
        lineHeight: 1,
        padding: on && !compact ? "5px 10px 5px 7px" : "5px 7px",
        borderRadius: "var(--r-pill)",
        color: "var(--text-1)",
        background: on ? "var(--surface)" : "transparent",
        boxShadow: on ? "var(--shadow-sm)" : "none",
        opacity: on ? 1 : 0.62,
        transition: "opacity .15s"
      }
    }, React.createElement(MtFlag, {
      l: k
    }), on && !compact && React.createElement("span", null, name));
  }));
}
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
const mtDayLabel = k => {
  const d = Number(k.slice(6, 8)),
    m = Number(k.slice(4, 6));
  return mtLangCur === "zh" ? m + "月" + d + "日" : d + " " + mtMonName(m);
};
const mtDayLong = k => mtLangCur === "zh" ? Number(k.slice(0, 4)) + "年" + mtDayLabel(k) : mtDayLabel(k) + " " + mtYear(Number(k.slice(0, 4)));
const mtMonTH = ym => {
  const y = Number(ym.slice(0, 4)),
    m = Number(ym.slice(5, 7));
  return mtLangCur === "zh" ? y + "年" + m + "月" : mtMonName(m, true) + " " + mtYear(y);
};
const mtMonShort = ym => {
  const y = Number(ym.slice(0, 4)),
    m = Number(ym.slice(5, 7));
  return mtLangCur === "zh" ? y + "年" + m + "月" : mtLangCur === "en" ? MT_EN_MON[m - 1] + " " + y : MT_TH_MON[m - 1] + " " + String(y + 543).slice(2);
};
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
    label: mtT("ไม่มีมิเตอร์", "No meter", "无电表"),
    tone: "gray",
    why: mtT("ไซต์นี้ไม่ได้ต่อมิเตอร์", "No meter is connected at this site", "此站点未连接电表")
  };
  if (!st || !st.at) return {
    k: "wait",
    label: mtT("รอข้อมูลแรก", "Waiting for data", "等待数据"),
    tone: "gray",
    why: mtT("ยังไม่เคยได้รับข้อมูลจากไซต์นี้", "No data has been received from this site yet", "尚未收到此站点的任何数据")
  };
  const age = now - Date.parse(st.at);
  const hs = st.wg && st.wg.hs ? st.wg.hs * 1000 : 0;
  if (age > MT_LIVE_MS || !hs || now - hs > MT_HS_MS) return {
    k: "lost",
    label: mtT("ขาดการติดต่อ", "Offline", "离线"),
    tone: "red",
    why: age > MT_LIVE_MS ? mtT("ไม่ได้รับข้อมูลมา ", "Last data ", "最后数据：") + mtAgoL(age) : mtT("อินเทอร์เน็ตที่ไซต์ขาด หรือเราเตอร์ดับ", "The site's internet is down or the router is off", "站点网络中断或路由器断电")
  };
  const m = st.meter;
  if (!m || !m.modbus || !m.modbus.ok) return {
    k: "meter",
    label: mtT("มิเตอร์ไม่ตอบ", "Meter not responding", "电表无响应"),
    tone: "amber",
    why: m && m.error || mtT("เราเตอร์ต่ออยู่ แต่อ่านมิเตอร์ไม่ได้", "The router is online but the meter can't be read", "路由器在线，但无法读取电表")
  };
  return m.v && m.v.kw > 0.05 ? {
    k: "gen",
    label: mtT("กำลังผลิต", "Generating", "发电中"),
    tone: "green",
    why: ""
  } : {
    k: "ok",
    label: mtT("ออนไลน์", "Online", "在线"),
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
    "aria-label": mtT("ก่อนหน้า", "Previous", "上一个"),
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
    "aria-label": mtT("ถัดไป", "Next", "下一个"),
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
  foot,
  langPick
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
    label: mtT("กำลังผลิตตอนนี้", "Power now", "当前功率"),
    v: [roll.live ? cu(roll.kw, mtKwD(roll.kw)) : "—", "kW"],
    frac: roll.kwp > 0 && roll.live ? roll.kw / roll.kwp : null,
    sub: roll.kwp > 0 && roll.live ? mtPctOf(Math.round(roll.kw / roll.kwp * 100), mtNum(roll.kwp, 0) + " kWp") : roll.live + mtT(" ไซต์ส่งค่าสด", roll.live === 1 ? " site live" : " sites live", " 个站点实时在线")
  }, {
    k: "day",
    icon: "sun",
    label: mtT("ผลิตวันนี้", "Today", "今日发电"),
    v: eV(roll.day),
    sub: roll.yday != null ? mtT("เมื่อวาน ", "Yesterday ", "昨日 ") + mtEnergy(roll.yday).join(" ") : mtT("เริ่มนับตั้งแต่ 00:00 น.", "Counted from 00:00", "自 00:00 起计")
  }, {
    k: "mon",
    icon: "calendar",
    label: mtT("ผลิตเดือนนี้", "This month", "本月发电"),
    v: eV(roll.mon),
    sub: roll.mon != null ? mtT("เฉลี่ย ", "Avg ", "日均 ") + mtEnergy(roll.mon / Math.max(1, Math.min(dom, roll.mdays || dom))).join(" ") + mtT("/วัน", "/day", "") : null
  }, roll.money != null ? {
    k: "baht",
    icon: "wallet",
    label: mtT("ค่าไฟเดือนนี้ (ถึงตอนนี้)", "Bill this month (to date)", "本月电费（截至目前）"),
    v: [cu(roll.money, roll.money < 1000 ? 2 : 0), mtBaht()],
    sub: mtT("ก่อน VAT · ตามราคาต่อหน่วยของแต่ละไซต์", "Before VAT · at each site's unit rate", "不含增值税 · 按各站点单价")
  } : {
    k: "tot",
    icon: "trend",
    label: mtT("เลขมิเตอร์รวม", "Total meter reading", "电表总读数"),
    v: mtEnergy(roll.reading),
    sub: mtT("เลขสะสมของทุกมิเตอร์", "Cumulative reading of all meters", "所有电表累计读数")
  }];
  const chips = [["gen", mtT("กำลังผลิต", "Generating", "发电中"), "var(--tint-ok-tx)"], ["ok", mtT("ออนไลน์", "Online", "在线"), "var(--tint-ok-tx)"], ["meter", mtT("มิเตอร์ไม่ตอบ", "Meter not responding", "电表无响应"), "var(--tint-amber-tx)"], ["lost", mtT("ขาดการติดต่อ", "Offline", "离线"), "var(--tint-red-tx)"], ["wait", mtT("รอข้อมูล", "Waiting", "等待数据"), "var(--text-3)"]].filter(c => counts[c[0]] > 0);
  const titleBlock = React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
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
  }), lastAt ? mtT("อัปเดต ", "Updated ", "更新于 ") + mtAgoL(now - lastAt) : mtT("ยังไม่ได้รับข้อมูล", "No data yet", "尚无数据")), langPick), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: lay === "s" ? 27 : lay === "m" ? 32 : 36,
      fontWeight: 700,
      lineHeight: 1.15,
      color: "var(--text-1)"
    }
  }, title || mtT("ไฟฟ้าโซลาร์", "Solar power", "太阳能发电"), React.createElement("br", null), mtT("จาก ", "from ", "共 "), React.createElement("span", {
    style: {
      color: mtSun
    }
  }, roll.n), mtT(" ไซต์", roll.n === 1 ? " site" : " sites", " 个站点")), React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, roll.kwp > 0 && React.createElement("div", null, mtT("ติดตั้งรวม ", "Installed ", "总装机 "), mtNum(roll.kwp, roll.kwp < 100 ? 1 : 0), " kWp"), React.createElement("div", null, mtT("อ่านมิเตอร์อัตโนมัติทุก 1 นาที", "Meters are read automatically every minute", "每分钟自动读取电表"))), chips.length > 0 && React.createElement("div", {
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
  }, kwp && live ? mtPctOf(Math.round(Math.max(0, live.kw) / kwp * 100), mtT("กำลังติดตั้ง", "capacity", "装机容量")) : mtT("กำลังไฟตอนนี้", "Power now", "当前功率"))), React.createElement("div", {
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
  }, stat(mtT("วันนี้", "Today", "今日"), mtEnergy(dayK)), stat(mtT("เดือนนี้", "This month", "本月"), mtEnergy(monK)), stat(mtT("ค่าไฟเดือนนี้", "Bill (month)", "本月电费"), rate != null && monK != null ? [mtNum(monK * rate, 0), mtBaht()] : ["—", ""])), React.createElement("div", {
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
  }), mtT("บิล " + mtMonShort(prevYm) + " ออกแล้ว", mtMonShort(prevYm) + " bill issued", mtMonShort(prevYm) + " 账单已开具"), " \xB7 ", mtMoney(prevBill.total), " ", mtBaht()) : prevHas ? React.createElement("span", {
    style: {
      fontWeight: 700,
      padding: "3px 9px",
      borderRadius: 999,
      background: "var(--tint-amber-bg)",
      color: "var(--tint-amber-tx)"
    }
  }, mtT("บิล " + mtMonShort(prevYm) + " ยังไม่ออก", mtMonShort(prevYm) + " bill not issued", mtMonShort(prevYm) + " 账单未开具")) : rate == null ? React.createElement("span", null, mtT("ยังไม่ตั้งราคาต่อหน่วย", "No unit rate set", "未设置单价")) : React.createElement("span", null, mtNum(rate, 2), " ", mtT("บาท/หน่วย", "THB/kWh", "泰铢/度")), React.createElement("span", {
    style: {
      marginLeft: "auto",
      whiteSpace: "nowrap"
    }
  }, st && st.at ? mtAgoL(now - Date.parse(st.at)) : "")));
}
function MtMonDetail({
  s,
  st,
  isAdmin,
  canEdit,
  onBack,
  now,
  partner,
  langPick
}) {
  const isMobile = useMtMobile();
  const [tab, setTab] = React.useState("over");
  const k = mtSiteState(s, st, now);
  const ci = mtCustOf(s),
    kwp = mtKwpOf(s);
  const opts = [{
    value: "over",
    label: mtT("ภาพรวม", "Overview", "概览"),
    icon: "chart"
  }, {
    value: "bill",
    label: mtT("บิลค่าไฟ", "Bills", "电费账单"),
    icon: "file"
  }, {
    value: "info",
    label: mtT("ข้อมูลไซต์", "Site info", "站点信息"),
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
  }), mtT("ทุกไซต์", "All sites", "所有站点")), React.createElement(MtStatePill, {
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
    title: mtT("เปิด VPN (แอป WireGuard) บนคอมก่อน — คู่มือข้อ 11", "Turn on the VPN (WireGuard app) on this computer first — guide step 11", "请先在电脑上开启 VPN（WireGuard 应用）— 见指南第 11 步"),
    href: "http://10.10." + s.n + ".20",
    target: "_blank",
    rel: "noopener noreferrer",
    style: lk
  }, React.createElement(Icon, {
    name: "link",
    size: 13
  }), mtT("หน้าเว็บมิเตอร์", "Meter web page", "电表网页")), React.createElement("a", {
    className: "btn btn-sm",
    title: mtT("เปิด VPN (แอป WireGuard) บนคอมก่อน — คู่มือข้อ 11", "Turn on the VPN (WireGuard app) on this computer first — guide step 11", "请先在电脑上开启 VPN（WireGuard 应用）— 见指南第 11 步"),
    href: "https://10.10." + s.n + ".10",
    target: "_blank",
    rel: "noopener noreferrer",
    style: lk
  }, React.createElement(Icon, {
    name: "link",
    size: 13
  }), "SmartLogger")), langPick && React.createElement("div", {
    className: "mt-noprint",
    style: {
      marginLeft: isAdmin ? 0 : "auto"
    }
  }, langPick)), React.createElement("div", {
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
  }, mtIdent(s)), kwp && React.createElement("span", null, "\xB7 ", mtNum(kwp, kwp < 100 ? 1 : 0), " kWp"), React.createElement("span", null, "\xB7 ", mtT("มิเตอร์", "Meter", "电表"), " ", mtModelShort(s)))), window.Segmented && React.createElement("div", {
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
      tip: [hm.slice(0, 2) + ":" + hm.slice(2) + mtT(" น.", "", "")]
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
    title: mtT("กำลังผลิตตอนนี้", "Power now", "当前功率"),
    sub: at ? mtT("อ่านค่าเมื่อ ", "Read at ", "读取于 ") + new Date(at).toLocaleTimeString(mtLoc(), {
      timeStyle: "short"
    }) + mtT(" น.", "", "") + " · " + mtAgoL(now - at) : mtT("ยังไม่ได้รับข้อมูล", "No data yet", "尚无数据")
  })), Gauge ? React.createElement(Gauge, {
    frac: kwp && live ? Math.max(0, v.kw) / kwp : live && v.kw > 0 ? 1 : 0,
    value: live ? mtNum(v.kw, mtKwD(v.kw)) : "—",
    unit: "kW",
    size: 210,
    color: mtSun,
    sub: kwp ? live ? mtPctOf(Math.round(Math.max(0, v.kw) / kwp * 100), mtT("กำลังติดตั้ง " + mtNum(kwp, kwp < 100 ? 1 : 0) + " kWp", mtNum(kwp, kwp < 100 ? 1 : 0) + " kWp capacity", "装机容量 " + mtNum(kwp, kwp < 100 ? 1 : 0) + " kWp")) : mtT("กำลังติดตั้ง ", "Capacity ", "装机容量 ") + mtNum(kwp, 1) + " kWp" : mtT("ใส่ขนาดระบบ (kWp) ในแท็บข้อมูลไซต์ เพื่อดูสัดส่วน", "Enter the system size (kWp) under Site info to see the ratio", "在“站点信息”中填写系统容量 (kWp) 以查看占比")
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
  }, mtT("อ่านมิเตอร์ไม่ได้", "Can't read the meter", "无法读取电表"), m.error ? " — " + m.error : "")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignContent: "stretch"
    }
  }, React.createElement(MtKpi, {
    icon: "sun",
    label: mtT("ผลิตวันนี้", "Generated today", "今日发电量"),
    v: mtEnergy(dayK),
    sub: ydK != null ? mtT("เมื่อวาน ", "Yesterday ", "昨日 ") + mtEnergy(ydK).join(" ") : mtT("นับตั้งแต่ 00:00 น.", "Counted from 00:00", "自 00:00 起计")
  }), React.createElement(MtKpi, {
    icon: "calendar",
    label: mtT("ผลิตเดือน" + mtMonName(Number(curYm.slice(5)), true), "Generated in " + mtMonName(Number(curYm.slice(5)), true), mtMonName(Number(curYm.slice(5)), true) + "发电量"),
    v: mtEnergy(monK),
    sub: monK != null ? mtT("เฉลี่ย ", "Avg ", "日均 ") + mtEnergy(monK / Math.max(1, Math.min(Number(today.slice(6)), mtDataDays(days, curYm) || 1))).join(" ") + mtT("/วัน", "/day", "") : null
  }), React.createElement(MtKpi, {
    icon: "wallet",
    label: mtT("ค่าไฟเดือนนี้ (ถึงตอนนี้)", "Bill this month (to date)", "本月电费（截至目前）"),
    v: rate != null && monK != null ? [mtMoney(monK * rate), mtBaht()] : ["—", ""],
    sub: rate != null ? mtNum(rate, rate % 1 ? 2 : 0) + mtT(" บาท/หน่วย · ก่อน VAT", " THB/kWh · before VAT", " 泰铢/度 · 不含增值税") : mtT("ยังไม่ตั้งราคาต่อหน่วย (แท็บบิลค่าไฟ)", "No unit rate set (Bills tab)", "未设置单价（电费账单页）")
  }), React.createElement(MtKpi, {
    icon: "trend",
    label: mtT("เลขมิเตอร์ (สะสม)", "Meter reading (total)", "电表读数（累计）"),
    v: [live && v[reg] != null ? mtNum(Math.abs(v[reg]), 1) : "—", "kWh"],
    sub: mtRegName(reg)
  }))), React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "bolt",
    title: mtT("กำลังไฟฟ้า", "Power", "功率"),
    sub: mtT("ราย 5 นาที · ", "Every 5 min · ", "每 5 分钟 · ") + (thisDayK != null ? mtT("รวม ", "Total ", "合计 ") + mtEnergy(thisDayK).join(" ") : mtT("ยังไม่มีข้อมูล", "No data yet", "尚无数据")) + (dayMax > 0 ? mtT(" · สูงสุด ", " · peak ", " · 峰值 ") + mtNum(dayMax, mtKwD(dayMax)) + " kW" : ""),
    right: React.createElement(MtStepper, {
      label: day === today ? mtT("วันนี้", "Today", "今天") : mtDayLong(day),
      onPrev: () => setDay(mtShiftDay(day, -1)),
      onNext: () => setDay(mtShiftDay(day, 1)),
      canNext: day < today
    })
  }), C ? React.createElement(C, {
    tx: mtChartTx(),
    mode: "time",
    t0: t0,
    t1: t1,
    bars: dayBars.some(b => b.value != null) ? dayBars.filter(b => b.t >= t0 && b.t <= t1) : [],
    unit: "kW",
    height: isMobile ? 190 : 230,
    empty: hist === undefined ? mtT("กำลังโหลด…", "Loading…", "加载中…") : mtT("ยังไม่มีข้อมูลของวันนี้ — ระบบเก็บทุก 5 นาที", "No data for this day yet — recorded every 5 minutes", "当天暂无数据 — 系统每 5 分钟记录一次")
  }) : null), React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "calendar",
    title: mtT("พลังงานรายวัน", "Daily energy", "每日发电量"),
    sub: (selMonK != null ? mtT("รวม ", "Total ", "合计 ") + mtEnergy(selMonK).join(" ") : mtT("ยังไม่มีข้อมูล", "No data yet", "尚无数据")) + (avg != null ? mtT(" · เฉลี่ย ", " · avg ", " · 日均 ") + mtEnergy(avg).join(" ") + mtT("/วัน", "/day", "") : ""),
    right: React.createElement(MtStepper, {
      label: mtMonTH(ym),
      onPrev: () => setYm(mtShiftYm(ym, -1)),
      onNext: () => setYm(mtShiftYm(ym, 1)),
      canNext: ym < curYm
    })
  }), C ? React.createElement(C, {
    tx: mtChartTx(),
    mode: "bars",
    bars: monBars,
    unit: "kWh",
    avg: avg,
    avgLabel: mtT("เฉลี่ย", "Avg", "平均"),
    height: isMobile ? 180 : 210,
    empty: mtT("ยังไม่มีข้อมูลรายวันของเดือนนี้", "No daily data for this month yet", "本月暂无每日数据")
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
    title: mtT("ค่าทางไฟฟ้าจากมิเตอร์", "Electrical values from the meter", "电表电气参数"),
    sub: (live ? mtT("ค่าสด ณ ", "Live at ", "实时 ") + new Date(at).toLocaleTimeString(mtLoc()) : mtT("ไม่มีค่าสด — แสดงเมื่อมิเตอร์ส่งค่าภายใน 5 นาทีล่าสุด", "No live values — shown when the meter reported in the last 5 minutes", "无实时数据 — 电表在最近 5 分钟内上报时显示")) + " · " + mtModelShort(s)
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
    }, off ? mtT("ไม่มีโหลด", "No load", "无负载") : mtT("เฟส " + p.i, "Phase " + p.i, "第 " + p.i + " 相"))), cell(mtT("แรงดัน", "Voltage", "电压"), mtNum(p.V, 1), "V"), cell(mtT("กระแส", "Current", "电流"), mtNum(p.A, 2), "A"), cell(mtT("กำลังไฟ", "Power", "功率"), mtNum(p.kW, 2), "kW"));
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
      gap: 8
    }
  }, spec(mtT("กำลังไฟรวม", "Total power", "总功率"), mtNum(v.kw, 2), "kW"), spec(mtT("ตัวประกอบกำลัง (PF)", "Power factor (PF)", "功率因数 (PF)"), mtNum(v.pf, 2), ""), spec(mtT("ความถี่", "Frequency", "频率"), mtNum(v.hz, 2), "Hz"), spec(mtRegName("kwh_imp"), mtNum(v.kwh_imp == null ? null : Math.abs(v.kwh_imp), 1), "kWh"), spec(mtRegName("kwh_exp"), mtNum(v.kwh_exp == null ? null : Math.abs(v.kwh_exp), 1), "kWh"), spec(mtRegName("kwh_net"), mtNum(v.kwh_net, 1), "kWh")));
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
    const head = mode === "day" ? mtT(["วันที่", "เลขต้นวัน kWh", "เลขท้ายวัน kWh", "พลังงาน kWh", "kW สูงสุด"], ["Date", "Start reading kWh", "End reading kWh", "Energy kWh", "Peak kW"], ["日期", "日初读数 kWh", "日末读数 kWh", "发电量 kWh", "峰值 kW"]) : mtT(["เดือน", "วันที่มีข้อมูล", "เลขต้นเดือน kWh", "เลขล่าสุด kWh", "พลังงาน kWh", "kW สูงสุด"], ["Month", "Days with data", "Month start reading kWh", "Latest reading kWh", "Energy kWh", "Peak kW"], ["月份", "有数据天数", "月初读数 kWh", "最新读数 kWh", "发电量 kWh", "峰值 kW"]);
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
    label: mtT("รายวัน", "Daily", "按日")
  }, {
    value: "month",
    label: mtT("รายเดือน", "Monthly", "按月")
  }];
  return React.createElement("div", {
    style: mtCard
  }, React.createElement(MtHead, {
    icon: "table",
    title: mode === "day" ? mtT("รายงานรายวัน · ", "Daily report · ", "日报 · ") + mtMonTH(ym) : mtT("รายงานรายเดือน", "Monthly report", "月报"),
    sub: mtT("รวม ", "Total ", "合计 ") + mtEnergy(total).join(" ") + " · " + mtRegName(reg),
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
  }, mode === "day" ? mtT("วันที่", "Date", "日期") : mtT("เดือน", "Month", "月份")), mode === "month" && React.createElement("th", {
    style: th
  }, mtT("วันที่มีข้อมูล", "Days with data", "有数据天数")), React.createElement("th", {
    style: th
  }, mode === "day" ? mtT("เลขต้นวัน", "Start", "日初读数") : mtT("เลขต้นเดือน", "Month start", "月初读数"), " ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kWh")), React.createElement("th", {
    style: th
  }, mode === "day" ? mtT("เลขท้ายวัน", "End", "日末读数") : mtT("เลขล่าสุด", "Latest", "最新读数"), " ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kWh")), React.createElement("th", {
    style: th
  }, mtT("พลังงาน", "Energy", "发电量"), " ", React.createElement("span", {
    style: {
      fontWeight: 500
    }
  }, "kWh")), React.createElement("th", {
    style: th
  }, mtT("สูงสุด", "Peak", "峰值"), " ", React.createElement("span", {
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
  }, days === undefined ? mtT("กำลังโหลด…", "Loading…", "加载中…") : mtT("ยังไม่มีข้อมูลในช่วงนี้", "No data in this period", "此期间暂无数据"))));
}
function MtMeterCfg({
  s
}) {
  const [model, setModel] = React.useState(s.meter_model || "leos-ipm310");
  const [unit, setUnit] = React.useState(String(s.meter_unit == null ? 1 : s.meter_unit));
  const [msg, setMsg] = React.useState("");
  const dirty = model !== (s.meter_model || "leos-ipm310") || unit !== String(s.meter_unit == null ? 1 : s.meter_unit);
  const save = async () => {
    setMsg(mtT("กำลังบันทึก…", "Saving…", "保存中…"));
    try {
      await mtCall({
        action: "meter-cfg",
        n: s.n,
        meter_model: model,
        meter_unit: Number(unit)
      });
      setMsg(mtT("บันทึกแล้ว — agent ใช้ค่าใหม่ในรอบถัดไป", "Saved — the agent uses the new values next round", "已保存 — agent 将在下一轮使用新设置"));
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
    title: mtT("ตั้งค่ามิเตอร์", "Meter settings", "电表设置"),
    sub: mtT("เฉพาะแอดมิน · มิเตอร์ที่ ", "Admin only · meter at ", "仅管理员 · 电表地址 ") + "10.10." + s.n + ".20" + mtT(" (Modbus TCP อ่านอย่างเดียว)", " (Modbus TCP, read-only)", "（Modbus TCP，只读）")
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-end",
      flexWrap: "wrap"
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, mtT("รุ่นมิเตอร์", "Meter model", "电表型号")), React.createElement("select", {
    value: model,
    onChange: e => setModel(e.target.value),
    style: fld
  }, Object.keys(MT_MODEL_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, mtModelName(k))))), React.createElement("div", {
    title: mtT("เลขประจำตัวมิเตอร์บนสาย Modbus — ตั้งไว้ที่ตัวมิเตอร์ (LEOS ค่าโรงงาน = 1) · ต่อมิเตอร์ตรง LAN ตัวเดียวใช้ 1 · ผ่าน Waveshare หลายตัวต้องไม่ซ้ำกัน", "Meter ID on the Modbus line — set on the meter itself (LEOS factory default = 1) · one meter direct on the LAN uses 1 · several via Waveshare must all differ", "Modbus 总线上的电表地址 — 在电表上设置（LEOS 出厂默认 = 1）· 局域网直连单台用 1 · 经 Waveshare 多台时不可重复")
  }, React.createElement("div", {
    style: mtLbl
  }, mtT("เลขเครื่อง Modbus (unit id)", "Modbus unit ID", "Modbus 设备号 (unit id)")), React.createElement("input", {
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
  }, mtT("บันทึก", "Save", "保存")), msg && React.createElement("span", {
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
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]),
    t = m[4] && !noTime ? m[4] + ":" + m[5] : "";
  const date = mtLangCur === "zh" ? y + "年" + mo + "月" + d + "日" : d + " " + mtMonName(mo) + " " + mtYear(y);
  return date + (t ? mtT(" เวลา " + t + " น.", " " + t, " " + t) : "");
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
    out.warn.push(mtT("เดือนนี้ยังไม่มีข้อมูลมิเตอร์", "No meter data for this month yet", "本月暂无电表数据"));
    return out;
  }
  const k0 = inMon[0],
    f0 = days[k0].first;
  out.start = f0[reg];
  out.start_at = mtAtOf(k0, f0.t);
  if (!k0.endsWith("01") || f0.t !== "0000") out.warn.push(mtT("เดือนแรกที่เก็บข้อมูล — จดครั้งก่อนเป็นค่าแรกที่มี ไม่ใช่ต้นเดือนพอดี", "First month of data — the previous reading is the first value recorded, not exactly the start of the month", "首个记录月份 — 上次读数为最早记录值，并非恰好月初"));
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
    out.warn.push(mtT("เดือนยังไม่จบ — เป็นยอดถึงตอนนี้ เลขเปลี่ยนตามมิเตอร์ (ออกบิลจริงหลังวันที่ 1 เดือนหน้า)", "Month not over — amount to date, changes with the meter (issue the real bill after the 1st of next month)", "本月尚未结束 — 为截至目前的数额，随电表变化（请在下月 1 日后正式开具）"));
  } else {
    const kl = inMon[inMon.length - 1],
      l = days[kl].last || days[kl].first;
    out.end = l[reg];
    out.end_at = mtAtOf(kl, l.t);
    out.warn.push(mtT("ยังไม่มีค่าวันที่ 1 เดือนถัดไป — จดครั้งนี้เป็นค่าล่าสุดที่เก็บได้", "No reading for the 1st of next month yet — the current reading is the latest value recorded", "尚无下月 1 日读数 — 本次读数为最新记录值"));
  }
  if (out.end != null && out.end < out.start - 0.5) resetAt(out.end_at.slice(0, 10));
  if (out.reset) out.warn.push(mtT("มิเตอร์ถูกรีเซ็ตในเดือนนี้ — จดครั้งก่อนนับจาก 0 ตั้งแต่วันที่รีเซ็ต", "The meter was reset this month — the previous reading counts from 0 at the reset date", "本月电表已重置 — 上次读数自重置日起从 0 计"));
  return out;
}
function MtBillPaper({
  d,
  paperRef,
  compact
}) {
  const P = k => "var(--paper-" + k + ")";
  const iss = d.issuer || {};
  const words = mtBahtWords(d.total);
  const lab = {
    fontSize: 10.5,
    fontWeight: 700,
    color: P("mute"),
    marginBottom: 4
  };
  const box = {
    background: P("tint"),
    borderRadius: 10,
    padding: "11px 13px",
    minWidth: 0
  };
  const line = "1px solid " + P("line3");
  const cellL = {
    padding: compact ? "8px 9px" : "9px 13px",
    fontSize: compact ? 12 : 12.5,
    color: P("ink2"),
    borderBottom: line
  };
  const cellR = Object.assign({}, cellL, {
    textAlign: "right",
    fontFamily: "var(--mono)",
    color: P("ink"),
    whiteSpace: "nowrap"
  });
  const n2 = v => mtNum(v, 2),
    n3 = v => mtNum(v, 3);
  const reset = d.start_src === "รีเซ็ตมิเตอร์" || d.reset;
  const sec = t => React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      margin: "20px 0 8px",
      fontSize: 11.5,
      fontWeight: 800,
      color: P("brand-dk")
    }
  }, t, React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: P("line3")
    }
  }));
  const sumRow = (label, sub, val) => React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "baseline",
      padding: compact ? "9px 12px" : "10px 16px",
      borderBottom: line
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: P("ink")
    }
  }, label), sub && React.createElement("div", {
    style: {
      fontSize: 11,
      color: P("ink3"),
      marginTop: 1
    }
  }, sub)), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13.5,
      fontWeight: 700,
      color: P("ink"),
      whiteSpace: "nowrap"
    }
  }, val));
  const summary = React.createElement("div", {
    style: {
      border: "1px solid " + P("line2"),
      borderRadius: 12,
      overflow: "hidden",
      minWidth: 0
    }
  }, sumRow(mtT("ค่าพลังงานไฟฟ้า", "Energy charge", "电能费"), n2(d.kwh) + " " + mtT("หน่วย", "kWh", "度") + " × " + (d.rate == null ? "—" : mtNum(d.rate, 4)) + " " + mtT("บาท/หน่วย", "THB/kWh", "泰铢/度"), n2(d.amount)), sumRow(mtT("ภาษีมูลค่าเพิ่ม", "VAT", "增值税") + " " + (d.vat_rate ? d.vat_rate + "%" : mtT("(ไม่คิด)", "(not charged)", "（不计）")), null, n2(d.vat)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      padding: compact ? "12px" : "14px 16px",
      background: P("brand"),
      color: P("bg")
    }
  }, React.createElement("div", {
    style: {
      flex: "1 1 120px",
      minWidth: 0,
      fontSize: 13.5,
      fontWeight: 800
    }
  }, mtT("รวมเงินที่ต้องชำระ", "Total amount due", "应付总额")), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: compact ? 21 : 24,
      fontWeight: 800,
      whiteSpace: "nowrap",
      marginLeft: "auto"
    }
  }, n2(d.total), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontFamily: "var(--sans)",
      fontWeight: 700,
      marginLeft: 6
    }
  }, mtBaht()))));
  const wordsBox = React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: lab
  }, mtT("จำนวนเงิน (ตัวอักษร)", "Amount in words", "金额（大写）")), React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: P("ink"),
      lineHeight: 1.5
    }
  }, words || "—")), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: P("mute"),
      lineHeight: 1.6,
      display: "flex",
      gap: 6
    }
  }, React.createElement("span", null, "\u2022"), React.createElement("span", null, mtT("เลขมิเตอร์อ่านอัตโนมัติจากมิเตอร์ของระบบ ไม่ได้จดด้วยมือ", "Meter readings are taken automatically by the system, not by hand", "电表读数由系统自动采集，非人工抄录"))));
  return React.createElement("div", {
    ref: paperRef,
    className: "mt-paper",
    lang: mtLangCur === "zh" ? "zh-CN" : mtLangCur,
    style: {
      background: P("bg"),
      color: P("ink"),
      fontFamily: "var(--sans)",
      borderRadius: 14,
      boxShadow: "var(--shadow-sm)",
      padding: compact ? 10 : 16,
      minWidth: 0,
      maxWidth: 820,
      width: "100%",
      boxSizing: "border-box",
      margin: "0 auto"
    }
  }, d.draft && React.createElement("div", {
    className: "mt-noprint",
    style: {
      marginBottom: 10,
      padding: "8px 12px",
      borderRadius: 10,
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
  }), mtT("ตัวอย่างบิล — ยังไม่ได้ออก · ตัวเลขคำนวณจากมิเตอร์ล่าสุด", "Preview — not issued yet · figures from the latest meter reading", "账单预览 — 尚未开具 · 数据按最新电表读数计算")), React.createElement("div", {
    style: {
      border: "1px solid " + P("line2"),
      borderRadius: 12,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      height: 6,
      background: "linear-gradient(90deg, " + P("brand") + ", " + P("brand-dk") + ")"
    }
  }), React.createElement("div", {
    style: {
      padding: compact ? "16px 14px" : "22px 26px"
    }
  }, React.createElement("div", {
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
  }, mtT("ผู้ออกบิล (ยังไม่ได้ลงทะเบียนบริษัท)", "Issuer (company not registered)", "开具方（尚未登记公司）"))), iss.addr && React.createElement("div", {
    style: {
      whiteSpace: "pre-line"
    }
  }, iss.addr), (iss.tax || iss.phone || iss.email) && React.createElement("div", null, [iss.tax ? mtT("เลขประจำตัวผู้เสียภาษี ", "Tax ID ", "纳税人识别号 ") + iss.tax + (iss.branch ? " (" + iss.branch + ")" : "") : "", iss.phone ? mtT("โทร ", "Tel. ", "电话 ") + iss.phone : "", iss.email].filter(Boolean).join(" · ")))), React.createElement("div", {
    style: {
      textAlign: compact ? "left" : "right",
      marginLeft: compact ? 0 : "auto"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: P("brand-dk"),
      lineHeight: 1.2
    }
  }, mtT("ใบแจ้งค่าไฟฟ้า", "Electricity Bill", "电费通知单")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink3")
    }
  }, mtT("ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์", "Solar power generation system", "太阳能发电系统")), React.createElement("div", {
    style: {
      display: "inline-grid",
      gridTemplateColumns: "auto auto",
      gap: "3px 12px",
      marginTop: 10,
      padding: "8px 12px",
      borderRadius: 9,
      border: "1px solid " + P("line2"),
      fontSize: 11.5,
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      color: P("mute")
    }
  }, mtT("เลขที่", "No.", "单号")), React.createElement("b", {
    style: {
      fontFamily: "var(--mono)",
      color: P("ink")
    }
  }, d.no), React.createElement("span", {
    style: {
      color: P("mute")
    }
  }, mtT("วันที่ออก", "Issue date", "开具日期")), React.createElement("span", {
    style: {
      color: P("ink")
    }
  }, d.at ? new Date(d.at).toLocaleDateString(mtLoc(), {
    dateStyle: "long"
  }) : mtT("— (ยังไม่ออก)", "— (not issued)", "—（未开具）"))))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "baseline",
      marginTop: 16,
      padding: "10px 14px",
      borderRadius: 10,
      background: "color-mix(in srgb, " + P("brand") + " 9%, " + P("bg") + ")"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: P("ink")
    }
  }, mtT("ประจำเดือน ", "Billing month: ", "账单月份："), mtMonTH(d.month)), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink3")
    }
  }, mtT("ช่วงจดหน่วย ", "Reading period ", "抄表期间 "), mtFmtAt(d.start_at, true), " \u2013 ", mtFmtAt(d.end_at, true))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: 10,
      marginTop: 12
    }
  }, React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: lab
  }, mtT("ผู้ใช้ไฟ", "Customer", "用电客户")), React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700
    }
  }, d.cust || React.createElement("span", {
    style: {
      color: P("warn-tx")
    }
  }, mtT("ยังไม่ลงทะเบียนลูกค้า", "Customer not registered", "尚未登记客户"))), d.addr && React.createElement("div", {
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
  }, mtT("เลขประจำตัวผู้เสียภาษี ", "Tax ID ", "纳税人识别号 "), d.cust_tax, d.cust_branch ? " (" + d.cust_branch + ")" : "")), React.createElement("div", {
    style: box
  }, React.createElement("div", {
    style: lab
  }, mtT("สถานที่ติดตั้ง / มิเตอร์", "Installation site / meter", "安装地点 / 电表")), React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, d.place || d.site_id), (d.ca || d.meter_no) && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink2")
    }
  }, [d.ca ? mtT("เลขที่ผู้ใช้ไฟ ", "Account no. ", "用电户号 ") + d.ca : "", d.meter_no ? mtT("เลขมิเตอร์ ", "Meter no. ", "电表号 ") + d.meter_no : ""].filter(Boolean).join(" · ")), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: P("ink2")
    }
  }, d.model, " \xB7 ", mtRegName(d.reg)))), sec(mtT("การจดหน่วยมิเตอร์", "Meter readings", "电表读数")), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", null, [mtT("การจดหน่วย", "Reading", "抄表"), mtT("วันที่ / เวลาที่จด", "Date / time", "抄表时间"), mtT("เลขอ่านมิเตอร์ (kWh)", "Meter reading (kWh)", "电表读数 (kWh)")].map((h, i) => React.createElement("th", {
    key: i,
    style: {
      padding: compact ? "7px 9px" : "8px 13px",
      fontSize: 11,
      fontWeight: 700,
      color: P("mute"),
      textAlign: i === 2 ? "right" : "left",
      borderBottom: "1.5px solid " + P("line2")
    }
  }, h)))), React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
    style: cellL
  }, mtT("จดครั้งก่อน", "Previous", "上次读数")), React.createElement("td", {
    style: cellL
  }, mtFmtAt(d.start_at), reset ? mtT(" (รีเซ็ตมิเตอร์)", " (meter reset)", "（电表已重置）") : ""), React.createElement("td", {
    style: cellR
  }, n3(d.start))), React.createElement("tr", null, React.createElement("td", {
    style: cellL
  }, mtT("จดครั้งนี้", "Current", "本次读数")), React.createElement("td", {
    style: cellL
  }, mtFmtAt(d.end_at), d.partial ? mtT(" (ยอดถึงเวลานี้)", " (to date)", "（截至目前）") : ""), React.createElement("td", {
    style: cellR
  }, n3(d.end))), React.createElement("tr", {
    style: {
      background: P("tint")
    }
  }, React.createElement("td", {
    colSpan: 2,
    style: Object.assign({}, cellL, {
      fontWeight: 700,
      color: P("ink"),
      borderBottom: "none"
    })
  }, mtT("หน่วยที่ใช้ (ครั้งนี้ − ครั้งก่อน)", "Units used (current − previous)", "用电量（本次 − 上次）")), React.createElement("td", {
    style: Object.assign({}, cellR, {
      fontWeight: 800,
      fontSize: 14,
      borderBottom: "none"
    })
  }, n3(d.kwh))))), sec(mtT("สรุปค่าไฟฟ้า", "Charges", "费用汇总")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: compact ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(300px, 1.25fr)",
      gap: 14,
      alignItems: "start"
    }
  }, compact ? summary : wordsBox, compact ? wordsBox : summary)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      justifyContent: "space-between",
      flexWrap: "wrap",
      padding: compact ? "9px 14px" : "10px 26px",
      background: P("tint"),
      borderTop: line,
      fontSize: 10.5,
      color: P("mute"),
      lineHeight: 1.6
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)"
    }
  }, d.no), React.createElement("span", null, d.by ? mtT("ออกบิลโดย ", "Issued by ", "开具人：") + d.by : ""))));
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
  }, mtT("กำลังโหลด…", "Loading…", "加载中…")));
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
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg, live), [days, ym, reg, live && live.v[reg], live && live.at, mtLangCur]);
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
        title: mtT("ออกบิลยอดถึงตอนนี้?", "Issue the bill to date?", "开具截至目前的账单？"),
        body: mtT("เดือน" + mtMonTH(ym) + " ยังไม่จบ — บิลจะใช้เลขมิเตอร์ ณ ตอนนี้ (" + mtNum(draft.kwh, 2) + " หน่วย) ปกติออกบิลหลังวันที่ 1 เดือนหน้า เลขจะครบทั้งเดือน", mtMonTH(ym) + " isn't over — the bill will use the meter reading as of now (" + mtNum(draft.kwh, 2) + " kWh). Bills are normally issued after the 1st of next month, when the month is complete.", mtMonTH(ym) + " 尚未结束 — 账单将使用当前电表读数（" + mtNum(draft.kwh, 2) + " 度）。通常在下月 1 日后开具，届时为整月数据。"),
        ok: mtT("ออกบิลยอดถึงตอนนี้", "Issue bill to date", "开具截至目前的账单"),
        icon: "file"
      });
      if (!yes) return;
    }
    if (saved) {
      const yes = await window.askConfirm({
        title: mtT("ออกบิล " + mtMonTH(ym) + " ทับฉบับเดิม?", "Re-issue the " + mtMonTH(ym) + " bill?", "重新开具 " + mtMonTH(ym) + " 账单？"),
        body: mtT("ฉบับเดิม " + mtMoney(saved.total) + " บาท (ออกโดย " + (saved.by || "—") + ") จะเก็บไว้ในประวัติของบิลนี้", "The current version (" + mtMoney(saved.total) + " THB, issued by " + (saved.by || "—") + ") will be kept in this bill's history", "原账单（" + mtMoney(saved.total) + " 泰铢，开具人 " + (saved.by || "—") + "）将保留在此账单的历史记录中"),
        ok: mtT("ออกบิลทับ", "Re-issue", "重新开具"),
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
      setOk(mtT("ออกบิลแล้ว", "Bill issued", "账单已开具"));
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
      setOk(mtT("บันทึกราคาแล้ว", "Rate saved", "单价已保存"));
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
    t: mtT("ออกบิลแล้ว", "Issued", "已开具"),
    s: mtWhenL(saved.at) + mtT(" · โดย ", " · by ", " · 开具人 ") + (saved.by || "—") + (saved.by_kind === "partner" ? mtT(" (พาร์ทเนอร์)", " (partner)", "（合作方）") : "")
  } : saved ? {
    bg: "var(--surface2)",
    tx: "var(--text-2)",
    icon: "history",
    t: mtT("กำลังคำนวณใหม่", "Recalculating", "正在重新计算"),
    s: mtT("ยังไม่บันทึก — บิลเดิม " + mtMoney(saved.total) + " บาท ยังมีผล", "Not saved — the issued bill (" + mtMoney(saved.total) + " THB) still stands", "尚未保存 — 原账单 " + mtMoney(saved.total) + " 泰铢仍有效")
  } : ym === cur ? {
    bg: "var(--surface2)",
    tx: "var(--text-2)",
    icon: "clock",
    t: mtT("เดือนนี้ยังไม่จบ", "Month not over", "本月尚未结束"),
    s: mtT("แสดงยอดถึงตอนนี้ · ออกบิลได้หลังวันที่ 1 เดือนหน้า", "Showing the amount to date · issue after the 1st of next month", "显示截至目前的数额 · 下月 1 日后可开具")
  } : {
    bg: "var(--tint-amber-bg)",
    tx: "var(--tint-amber-tx)",
    icon: "alert",
    t: mtT("ยังไม่ออกบิล", "Not issued yet", "尚未开具"),
    s: mtT("ตรวจราคาต่อหน่วย แล้วกดออกบิล", "Check the unit rate, then issue the bill", "核对单价后点击开具")
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
  }, mtT("เลือกเดือนที่จะดู/ออกบิล", "Choose a month to view / issue", "选择要查看/开具的月份")), useSaved && React.createElement("button", {
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
  }), mtT("พิมพ์ / PDF", "Print / PDF", "打印 / PDF"))), React.createElement(MtBillPaper, {
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
  }, mtT("หน่วยที่ใช้", "Units used", "用电量")), React.createElement("div", {
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
  }, mtT("รวมเงิน", "Total", "合计")), React.createElement("div", {
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
  }, mtBaht())))), canEdit && !useSaved && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, mtT("ราคาต่อหน่วย", "Unit rate", "单价")), React.createElement("div", {
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
  }, mtT("บาท/หน่วย", "THB/kWh", "泰铢/度")))), React.createElement("label", {
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
  }), " ", mtT("คิดภาษีมูลค่าเพิ่ม 7%", "Charge VAT 7%", "计增值税 7%")), isAdmin && React.createElement("div", null, React.createElement("div", {
    style: mtLbl
  }, mtT("จดหน่วยจากช่องไหนของมิเตอร์ (แอดมิน)", "Meter register used for billing (admin)", "计费所用电表寄存器（管理员）")), React.createElement("select", {
    value: regIn,
    onChange: e => setRegIn(e.target.value),
    style: Object.assign({}, mtField, {
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    })
  }, Object.keys(MT_REG_TH).map(k => React.createElement("option", {
    key: k,
    value: k
  }, mtRegName(k)))), regIn !== reg && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--tint-amber-tx)",
      marginTop: 4
    }
  }, mtT("บันทึกแล้วตัวเลขบนบิลจะเปลี่ยนตามช่องใหม่", "Once saved, the bill figures follow the new register", "保存后账单数据将按新寄存器计算"))), React.createElement("div", {
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
  }), mtT("เลขมิเตอร์อ่านอัตโนมัติ แก้ไม่ได้ · ราคาที่ใช้ออกบิลจะจำเป็นค่าเริ่มของเดือนต่อไป", "Meter readings are automatic and can't be edited · the rate used is remembered for next month", "电表读数自动采集，不可修改 · 本次单价将作为下月默认值"))), warn.length > 0 && React.createElement("div", {
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
  }, busy ? mtT("กำลังบันทึก…", "Saving…", "保存中…") : saved ? mtT("ออกบิลทับฉบับเดิม", "Re-issue bill", "重新开具账单") : ym === cur ? mtT("ออกบิลยอดถึงตอนนี้", "Issue bill to date", "开具截至目前的账单") : mtT("ออกบิล ", "Issue bill · ", "开具账单 · ") + mtMonTH(ym)), canEdit && !useSaved && cfgDirty && React.createElement("button", {
    className: "btn",
    disabled: busy || rate == null,
    onClick: saveCfg
  }, mtT("บันทึกราคาไว้ก่อน (ยังไม่ออกบิล)", "Save the rate only (don't issue yet)", "仅保存单价（暂不开具）")), useSaved && React.createElement("button", {
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
  }), mtT("พิมพ์ / บันทึก PDF", "Print / save PDF", "打印 / 保存 PDF")), canEdit && useSaved && React.createElement("button", {
    className: "btn",
    onClick: () => {
      setRecalc(true);
      setOk("");
    }
  }, mtT("คำนวณใหม่จากมิเตอร์", "Recalculate from meter", "按电表重新计算")), canEdit && recalc && React.createElement("button", {
    className: "btn",
    onClick: () => {
      setRecalc(false);
      setErr("");
    }
  }, mtT("ยกเลิก กลับไปบิลเดิม", "Cancel — back to the issued bill", "取消，返回原账单"))), !canEdit && !useSaved && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, mtT("บัญชีนี้ดูได้อย่างเดียว", "This account is view-only", "此账户仅可查看")), hist.length > 0 && React.createElement("div", {
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
  }, mtT("ฉบับก่อนหน้าของเดือนนี้ (ถูกออกทับ)", "Earlier versions this month (replaced)", "本月之前的版本（已被替换）")), hist.map((h, i) => React.createElement("div", {
    key: i
  }, mtWhenL(h.at), " \xB7 ", h.by, " \xB7 ", mtMoney(h.total), " ", mtBaht())))));
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
      title: mtT("ลบบิล ", "Delete bill ", "删除账单 ") + (b.no || k) + "?",
      body: mtMonTH(k.slice(0, 4) + "-" + k.slice(4)) + " · " + mtMoney(b.total != null ? b.total : b.amount) + " " + mtBaht() + mtT(" · ออกโดย ", " · issued by ", " · 开具人 ") + (b.by || "—") + mtT(" — บิลจะหายจากหน้าเว็บ (ระบบเก็บสำเนาไว้หลังบ้าน)", " — the bill disappears from the web page (a copy is kept in the back end)", " — 账单将从网页上消失（系统后台保留副本）"),
      ok: mtT("ลบบิล", "Delete bill", "删除账单"),
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
    title: mtT("บิลที่ออกแล้ว", "Issued bills", "已开具账单"),
    sub: past.length ? mtT(past.length + " ใบ · รวม ", past.length + (past.length === 1 ? " bill" : " bills") + " · total ", past.length + " 张 · 合计 ") + mtMoney(sum) + " " + mtBaht() : mtT("ยังไม่มีบิลที่ออก", "No bills issued yet", "尚未开具账单")
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
    }, mtNum(b.kwh, 2), " ", mtT("หน่วย", "kWh", "度"), " \xD7 ", mtNum(b.rate, 2), " ", mtBaht(), b.vat_rate ? " + VAT " + b.vat_rate + "%" : ""), React.createElement("div", {
      style: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, mtT("ออกโดย ", "Issued by ", "开具人 "), b.by || "—", " \xB7 ", mtWhenL(b.at), nh ? mtT(" · ออกทับ " + nh + " ครั้ง", " · re-issued " + nh + "×", " · 重新开具 " + nh + " 次") : "")), React.createElement("div", {
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
    }, mtBaht())), isAdmin && React.createElement("button", {
      className: "btn btn-sm btn-dngr",
      title: mtT("ลบบิลนี้", "Delete this bill", "删除此账单"),
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
const mtInfoGroups = () => [{
  icon: "user",
  title: mtT("ลูกค้า (ผู้ใช้ไฟ)", "Customer (power user)", "客户（用电方）"),
  sub: mtT("ชื่อและที่อยู่นี้ขึ้นบนบิลทุกใบ", "This name and address appear on every bill", "此名称和地址显示在每张账单上"),
  fields: [["cust", mtT("ชื่อลูกค้า", "Customer name", "客户名称"), mtT("เช่น บริษัท ไทยสตีล จำกัด", "e.g. Thai Steel Co., Ltd.", "例如：泰国钢铁有限公司"), 2], ["tax", mtT("เลขประจำตัวผู้เสียภาษี", "Tax ID", "纳税人识别号"), mtT("13 หลัก", "13 digits", "13 位"), 1], ["branch", mtT("สาขา", "Branch", "分支机构"), mtT("สำนักงานใหญ่ / 00001", "Head office / 00001", "总部 / 00001"), 1], ["addr", mtT("ที่อยู่ (ขึ้นบนบิล)", "Address (shown on bills)", "地址（显示在账单上）"), "", 2, true]]
}, {
  icon: "pin",
  title: mtT("สถานที่ติดตั้งและระบบ", "Installation site & system", "安装地点与系统"),
  sub: "",
  fields: [["place", mtT("สถานที่ติดตั้ง", "Installation site", "安装地点"), mtT("เช่น หลังคาโรงงาน 2 นิคมอมตะซิตี้", "e.g. Factory 2 roof, Amata City", "例如：安美德城 2 号厂房屋顶"), 2], ["kwp", mtT("ขนาดระบบ (kWp)", "System size (kWp)", "系统容量 (kWp)"), mtT("เช่น 500", "e.g. 500", "例如 500"), 1], ["cod", mtT("วันเริ่มจ่ายไฟ", "Commercial operation date", "并网发电日期"), "", 1, false, "date"], ["ca", mtT("เลขที่ผู้ใช้ไฟ (การไฟฟ้า)", "Utility account no.", "电力局用电户号"), "", 1], ["meter_no", mtT("เลขมิเตอร์ (S/N)", "Meter no. (S/N)", "电表编号 (S/N)"), "", 1]]
}, {
  icon: "phone",
  title: mtT("ผู้ติดต่อ", "Contact", "联系人"),
  sub: "",
  fields: [["contact", mtT("ชื่อผู้ติดต่อ", "Contact name", "联系人姓名"), "", 1], ["phone", mtT("โทร", "Phone", "电话"), "", 1], ["note", mtT("หมายเหตุ", "Note", "备注"), "", 2, true]]
}];
const MT_INFO_KEYS = ["cust", "tax", "branch", "addr", "place", "kwp", "cod", "ca", "meter_no", "contact", "phone", "note"];
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
      setMsg(mtT("บันทึกแล้ว", "Saved", "已保存"));
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
  }, mtInfoGroups().map(g => React.createElement("div", {
    key: g.icon,
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
  }, s.info && s.info.by ? mtT("แก้ล่าสุดโดย ", "Last edited by ", "最后编辑：") + s.info.by + " · " + mtWhenL(s.info.at) : mtT("ยังไม่เคยลงทะเบียนไซต์นี้", "This site hasn't been registered yet", "此站点尚未登记")), err && React.createElement("span", {
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
  }, busy ? mtT("กำลังบันทึก…", "Saving…", "保存中…") : mtT("บันทึกข้อมูลไซต์", "Save site info", "保存站点信息"))));
}
function MtMonView({
  role,
  currentUser,
  partner
}) {
  const isAdmin = !partner && (window.hasRole ? window.hasRole(role, "admin") : false);
  const isMobile = useMtMobile();
  useMtLang();
  const langPick = partner ? null : React.createElement(MtLangPick, null);
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
    partner: partner,
    langPick: langPick
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
    title: ag ? mtT("ติดต่อล่าสุด ", "Last contact ", "最后联系 ") + new Date(ag.at || ag.seen).toLocaleTimeString(mtLoc()) : mtT("ยังไม่ได้ติดตั้ง agent บน VPS", "Agent not installed on the VPS", "VPS 上尚未安装 agent"),
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
  }), ag ? "agent " + (ag.ver ? "v" + ag.ver + " · " : "") + (agOk ? mtT("ปกติ", "OK", "正常") : mtT("เงียบ", "silent", "无响应")) : mtT("ยังไม่มี agent", "No agent", "无 agent")), React.createElement("button", {
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
  }), mtT("บัญชีพาร์ทเนอร์ / มอบไซต์", "Partner accounts / assign sites", "合作方账户 / 分配站点"))) : null;
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
  }, mtT("กำลังโหลด…", "Loading…", "加载中…"))) : !sites.length ? React.createElement("div", {
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
  }, partner ? mtT("ยังไม่มีไซต์ในบัญชีนี้", "No sites in this account yet", "此账户暂无站点") : mtT("ยังไม่มีไซต์ที่ต่อมิเตอร์", "No sites with a meter yet", "暂无连接电表的站点")), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      maxWidth: 380
    }
  }, partner ? mtT("เมื่อผู้ดูแลระบบมอบไซต์ให้ ไซต์จะขึ้นที่นี่พร้อมกำลังไฟ พลังงาน และบิลค่าไฟ", "When the administrator assigns sites to you, they'll appear here with power, energy and bills", "管理员为您分配站点后，站点将显示在此处，包括功率、发电量和电费账单") : mtT("เพิ่มไซต์ที่ ตั้งค่า → ไซต์ MikroTik แล้วตั้ง IP มิเตอร์เป็น 10.10.N.20", "Add sites under Settings → MikroTik Sites, then set the meter IP to 10.10.N.20", "在 设置 → MikroTik 站点 中添加站点，并将电表 IP 设为 10.10.N.20")), adminFoot) : React.createElement(React.Fragment, null, React.createElement(MtHero, {
    roll: roll,
    counts: counts,
    filter: filter,
    setFilter: setFilter,
    lastAt: lastAt,
    now: now,
    isMobile: isMobile,
    foot: adminFoot,
    langPick: langPick
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
  }, mtT("ไซต์ทั้งหมด", "All sites", "所有站点")), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, filter === "all" && !ql ? mtT(sites.length + " ไซต์", sites.length + (sites.length === 1 ? " site" : " sites"), sites.length + " 个站点") : mtT("แสดง " + shown.length + " จาก " + sites.length, "Showing " + shown.length + " of " + sites.length, "显示 " + shown.length + " / " + sites.length)), filter !== "all" && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setFilter("all")
  }, mtT("ล้างตัวกรอง", "Clear filter", "清除筛选")), sites.length > 6 && React.createElement("div", {
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
    placeholder: mtT("ค้นหาไซต์ / ลูกค้า", "Search site / customer", "搜索站点 / 客户"),
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
  }, mtT("ไม่มีไซต์ตามตัวกรองนี้", "No sites match this filter", "没有符合筛选的站点"))));
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
  mtPanel,
  mtT,
  mtLoc,
  mtBaht,
  useMtLang,
  mtSetLang,
  MtLangPick,
  MtFlag
});
