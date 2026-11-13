function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MS_TEMPLATE = [["เริ่มโครงการ", ["ลงนามสัญญา / ใบสั่งซื้อ (PO)", "ประชุมเริ่มงาน (Kick-off)", "สำรวจหน้างานละเอียด"]], ["ออกแบบ", ["ออกแบบระบบ & Shop Drawing", "ตรวจสอบโครงสร้างหลังคา", "ลูกค้าอนุมัติแบบ"]], ["ขออนุญาต", ["ยื่นการไฟฟ้า (ขอเชื่อมต่อขนาน)", "ยื่น กกพ.", "แจ้งดัดแปลงอาคาร (อ.1)"]], ["จัดซื้อ & ขนส่ง", ["สั่งแผง & อินเวอร์เตอร์", "สั่งโครงสร้าง สายไฟ ตู้ไฟ", "ส่งของเข้าหน้างาน"]], ["งานติดตั้ง", null, "install"], ["ทดสอบ & เชื่อมต่อ", ["ทดสอบระบบ (Testing & Commissioning)", "การไฟฟ้าตรวจ & ขนานไฟ (COD)", "ตั้งค่าระบบมอนิเตอร์"]], ["ส่งมอบงาน", ["ตรวจรับงาน & แก้ Punch List", "ส่งมอบเอกสาร & อบรมการใช้งาน"]]];
const MS_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MS_DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MS_ST = {
  done: {
    th: "เสร็จแล้ว",
    tx: "var(--tint-ok-tx)",
    bg: "var(--tint-ok-bg)",
    bar: "var(--tint-ok-tx)"
  },
  doing: {
    th: "กำลังทำ",
    tx: "var(--tint-amber-tx)",
    bg: "var(--tint-amber-bg)",
    bar: "var(--primary)"
  },
  late: {
    th: "ล่าช้า",
    tx: "var(--tint-red-tx)",
    bg: "var(--tint-red-bg)",
    bar: "var(--tint-red-tx)"
  },
  todo: {
    th: "ยังไม่เริ่ม",
    tx: "var(--text-2)",
    bg: "var(--surface2)",
    bar: "var(--primary)"
  }
};
const MS_TRACK = "color-mix(in srgb, var(--primary) 20%, var(--surface2))";
let _msSeq = 0;
const msId = () => "r" + Date.now().toString(36) + (_msSeq++).toString(36);
const msRow = (th, head, link) => ({
  id: msId(),
  th: th || "",
  head: !!head,
  owner: "",
  planStart: "",
  planEnd: "",
  pct: 0,
  link: link || ""
});
function msTemplate() {
  const out = [];
  MS_TEMPLATE.forEach(([h, subs, link]) => {
    out.push(msRow(h, true, link));
    (subs || []).forEach(s => out.push(msRow(s, false)));
  });
  return out;
}
const msDay = iso => {
  if (!iso) return null;
  const t = Date.parse(String(iso).slice(0, 10) + "T00:00:00Z");
  return isNaN(t) ? null : Math.round(t / 86400000);
};
const msIso = n => new Date(n * 86400000).toISOString().slice(0, 10);
const msToday = () => window.drToday ? window.drToday() : new Date().toISOString().slice(0, 10);
const msPct = v => Math.max(0, Math.min(100, Math.round(+v || 0)));
const msDur = (a, b) => {
  const x = msDay(a),
    y = msDay(b || a);
  return x != null && y != null ? Math.max(1, y - x + 1) : null;
};
function msTH(iso, yr) {
  const n = msDay(iso);
  if (n == null) return "";
  const d = new Date(n * 86400000);
  return d.getUTCDate() + " " + MS_MON[d.getUTCMonth()] + (yr ? " " + String(d.getUTCFullYear() + 543).slice(2) : "");
}
const msSpanTH = (a, b) => !a && !b ? "" : a && b && a !== b ? msTH(a) + " – " + msTH(b, true) : msTH(a || b, true);
function msAxis(C, today, pad) {
  const td = msDay(today);
  let lo = C.lo,
    hi = C.hi;
  if (lo == null) {
    lo = td;
    hi = td + 27;
  }
  if (td != null && td >= lo - 30 && td <= hi + 30) {
    lo = Math.min(lo, td);
    hi = Math.max(hi, td);
  }
  const mon0 = d => d - (new Date(d * 86400000).getUTCDay() + 6) % 7;
  const p0 = C.lo != null ? C.lo : lo;
  lo = mon0(lo - (pad || 0));
  hi = mon0(hi + (pad || 0)) + 6;
  const span = hi - lo + 1;
  const months = [];
  for (let d = lo; d <= hi; d++) {
    const x = new Date(d * 86400000);
    if (d === lo || x.getUTCDate() === 1) months.push({
      d,
      th: MS_MON[x.getUTCMonth()] + " " + String(x.getUTCFullYear() + 543).slice(2)
    });
  }
  if (months.length > 1 && months[1].d - months[0].d < 8) months.shift();
  const weeks = [];
  for (let d = lo; d <= hi; d += 7) weeks.push({
    d,
    n: Math.floor((d - mon0(p0)) / 7) + 1
  });
  return {
    lo,
    hi,
    span,
    td,
    months,
    weeks,
    X: d => (d - lo) / span * 100,
    W: (a, b) => (Math.max(a, b) - Math.min(a, b) + 1) / span * 100
  };
}
function msInstallRows(daily, owner) {
  if (!daily) return [];
  const plan = daily.plan,
    last = daily.dates && daily.dates[0] ? daily.byDate[daily.dates[0]] : null;
  let steps = plan && plan.steps && plan.steps.length ? plan.steps : null;
  if (last && last.steps && last.steps.length && (!steps || (last.updatedAt || "") > (plan && plan.updatedAt || ""))) steps = last.steps;
  if (!steps) return [];
  const list = window.drRenumber ? window.drRenumber(steps) : steps;
  const groups = [];
  list.forEach(r => {
    if (r.head !== false || !groups.length) groups.push({
      self: r,
      subs: []
    });else groups[groups.length - 1].subs.push(r);
  });
  return groups.map((g, i) => {
    const rs = g.subs.length ? g.subs : [g.self];
    const ps = rs.map(r => r.planStart).filter(Boolean).sort(),
      pe = rs.map(r => r.planEnd || r.planStart).filter(Boolean).sort();
    const pct = Math.round(rs.reduce((t, r) => t + msPct(r.pct), 0) / rs.length);
    return {
      id: "d" + i,
      th: g.self.th || "",
      head: false,
      ro: true,
      owner: owner || "",
      planStart: ps[0] || "",
      planEnd: pe[pe.length - 1] || "",
      pct
    };
  });
}
function msCompute(rows, inst, job, today) {
  const out = [];
  (rows || []).forEach(r => {
    if (r.head && r.link === "install") {
      const sd = (job && job.stageDates || {}).install;
      const own = Object.assign({}, r);
      if (!inst.length && !own.planStart && sd) {
        if (typeof sd === "object") {
          own.planStart = sd.start || sd.end || "";
          own.planEnd = sd.end || sd.start || "";
        } else own.planStart = own.planEnd = String(sd).slice(0, 10);
      }
      out.push(own);
      inst.forEach(x => out.push(Object.assign({}, x, {
        link: "install"
      })));
    } else out.push(Object.assign({}, r));
  });
  const td = msDay(today);
  const leafW = r => msDur(r.planStart, r.planEnd) || 1;
  const status = r => {
    const p = msPct(r.pct),
      pe = msDay(r.planEnd || r.planStart);
    if (p >= 100) return "done";
    if (pe != null && td != null && pe < td) return "late";
    return p > 0 ? "doing" : "todo";
  };
  let no = 0,
    sub = 0;
  for (let i = 0; i < out.length; i++) {
    const r = out[i];
    if (r.head) {
      no += 1;
      sub = 0;
      r.no = String(no);
    } else {
      sub += 1;
      r.no = (no || 0) + "." + sub;
    }
    if (!r.head) continue;
    const kids = [];
    for (let j = i + 1; j < out.length && !out[j].head; j++) kids.push(out[j]);
    r.kids = kids.length;
    if (!kids.length) continue;
    const ps = kids.map(k => k.planStart).filter(Boolean).sort(),
      pe = kids.map(k => k.planEnd || k.planStart).filter(Boolean).sort();
    if (ps.length) r.planStart = ps[0];
    if (pe.length) r.planEnd = pe[pe.length - 1];
    const W = kids.reduce((t, k) => t + leafW(k), 0);
    r.pct = Math.round(kids.reduce((t, k) => t + leafW(k) * msPct(k.pct), 0) / (W || 1));
    const own = [...new Set(kids.map(k => k.owner).filter(Boolean))];
    if (!r.owner && own.length === 1) r.owner = own[0];
  }
  out.forEach(r => {
    r.st = status(r);
  });
  const leaves = out.filter(r => !r.head || !r.kids);
  const W = leaves.reduce((t, r) => t + leafW(r), 0);
  const pct = leaves.length ? Math.round(leaves.reduce((t, r) => t + leafW(r) * msPct(r.pct), 0) / (W || 1)) : 0;
  let lo = Infinity,
    hi = -Infinity;
  out.forEach(r => [r.planStart, r.planEnd].forEach(v => {
    const n = msDay(v);
    if (n != null) {
      lo = Math.min(lo, n);
      hi = Math.max(hi, n);
    }
  }));
  const cnt = {
    done: 0,
    doing: 0,
    late: 0,
    todo: 0
  };
  leaves.forEach(r => {
    cnt[r.st] += 1;
  });
  return {
    rows: out,
    pct,
    lo: isFinite(lo) ? lo : null,
    hi: isFinite(hi) ? hi : null,
    late: cnt.late,
    cnt,
    leaves: leaves.length
  };
}
function useMsNarrow(bp) {
  const mq = React.useMemo(() => window.matchMedia("(max-width: " + bp + "px)"), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = e => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}
function useMasterSchedule(jobId) {
  const [data, setData] = React.useState(undefined);
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setData(null);
      return;
    }
    const ref = window.FBDB.ref("masterSchedule/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setData(v && Array.isArray(v.rows) ? v : null);
    }, () => setData(null));
    return () => ref.off("value", h);
  }, [jobId]);
  const save = React.useCallback((rows, user) => {
    if (!jobId || !window.FBDB) return Promise.resolve();
    const clean = (rows || []).filter(r => !r.ro).map(r => ({
      id: r.id || msId(),
      th: String(r.th || ""),
      head: !!r.head,
      link: r.link || "",
      owner: String(r.owner || ""),
      planStart: r.planStart || "",
      planEnd: r.planEnd || "",
      pct: msPct(r.pct)
    }));
    return window.FBDB.ref("masterSchedule/" + jobId).set({
      rows: clean,
      updatedAt: new Date().toISOString(),
      byName: user && user.name || ""
    });
  }, [jobId]);
  return {
    data,
    rows: data && data.rows ? data.rows : null,
    loading: data === undefined,
    save
  };
}
function useMsData(job) {
  const ms = useMasterSchedule(job ? job.id : null);
  const daily = window.useDailyReports ? window.useDailyReports(job ? job.id : null) : null;
  const crew = job && (job.contractor || "") || "ทีมติดตั้ง";
  const inst = React.useMemo(() => msInstallRows(daily, crew), [daily && daily.plan, daily && daily.byDate, crew]);
  return {
    ms,
    inst
  };
}
function MsRing({
  pct,
  size
}) {
  const s = size || 64,
    r = s / 2 - 5,
    c = 2 * Math.PI * r;
  return React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 " + s + " " + s,
    style: {
      flexShrink: 0
    }
  }, React.createElement("circle", {
    cx: s / 2,
    cy: s / 2,
    r: r,
    fill: "none",
    stroke: MS_TRACK,
    strokeWidth: "7"
  }), React.createElement("circle", {
    cx: s / 2,
    cy: s / 2,
    r: r,
    fill: "none",
    stroke: "var(--primary)",
    strokeWidth: "7",
    strokeLinecap: "round",
    strokeDasharray: c * pct / 100 + " " + c,
    transform: "rotate(-90 " + s / 2 + " " + s / 2 + ")"
  }), React.createElement("text", {
    x: "50%",
    y: "50%",
    dominantBaseline: "central",
    textAnchor: "middle",
    style: {
      fontFamily: "var(--mono)",
      fontSize: s * 0.24,
      fontWeight: 800,
      fill: "var(--text-1)"
    }
  }, pct, "%"));
}
function MsSummary({
  C,
  today,
  narrow
}) {
  const td = msDay(today);
  const days = C.lo != null ? C.hi - C.lo + 1 : null;
  const left = C.hi != null && td != null ? C.hi - td : null;
  const tile = (lab, val, tx, bg) => React.createElement("div", {
    key: lab,
    style: {
      flex: "1 1 0",
      minWidth: narrow ? 70 : 92,
      background: bg || "var(--surface)",
      boxShadow: bg ? "none" : "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: narrow ? "8px 10px" : "10px 13px"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: tx || "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, lab), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: narrow ? 18 : 22,
      fontWeight: 800,
      color: tx || "var(--text-1)",
      marginTop: 2
    }
  }, val));
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "stretch",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: narrow ? "8px 12px" : "10px 16px",
      flex: narrow ? "1 1 100%" : "0 0 auto"
    }
  }, React.createElement(MsRing, {
    pct: C.pct,
    size: narrow ? 56 : 64
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      lineHeight: 1.7,
      color: "var(--text-2)"
    }
  }, React.createElement("div", null, React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E23\u0E34\u0E48\u0E21"), " ", React.createElement("b", null, C.lo != null ? msTH(msIso(C.lo), true) : "—"), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      marginLeft: 10
    }
  }, "\u0E08\u0E1A"), " ", React.createElement("b", null, C.hi != null ? msTH(msIso(C.hi), true) : "—")), React.createElement("div", null, days != null ? "รวม " + days + " วัน" : "ยังไม่ใส่วันแผน", left != null && React.createElement("b", {
    style: {
      marginLeft: 10,
      color: left < 0 && C.pct < 100 ? "var(--tint-red-tx)" : "var(--text-1)"
    }
  }, C.pct >= 100 ? "เสร็จแล้ว" : left > 0 ? "เหลือ " + left + " วัน" : left === 0 ? "ครบกำหนดวันนี้" : "เลยกำหนด " + -left + " วัน")))), tile("งานทั้งหมด", C.leaves), tile("เสร็จแล้ว", C.cnt.done, "var(--tint-ok-tx)", "var(--tint-ok-bg)"), tile("กำลังทำ", C.cnt.doing, "var(--tint-amber-tx)", "var(--tint-amber-bg)"), tile("ยังไม่เริ่ม", C.cnt.todo), C.cnt.late > 0 && tile("ล่าช้า", C.cnt.late, "var(--tint-red-tx)", "var(--tint-red-bg)"));
}
const MsPill = ({
  st,
  small
}) => {
  const s = MS_ST[st] || MS_ST.todo;
  return React.createElement("span", {
    style: {
      display: "inline-block",
      fontSize: small ? 10 : 10.5,
      fontWeight: 700,
      color: s.tx,
      background: s.bg,
      padding: small ? "2px 7px" : "3px 9px",
      borderRadius: "var(--r-pill)",
      whiteSpace: "nowrap"
    }
  }, s.th);
};
function MsGantt({
  C,
  today,
  compact,
  narrow,
  mid
}) {
  if (C.lo == null) {
    return React.createElement("div", {
      style: {
        padding: "18px 4px",
        fontSize: 12.5,
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E27\u0E31\u0E19\u0E43\u0E19\u0E41\u0E1C\u0E19 \u2014 \u0E01\u0E14 \"\u0E41\u0E01\u0E49\u0E41\u0E1C\u0E19\u0E07\u0E32\u0E19\" \u0E41\u0E25\u0E49\u0E27\u0E43\u0E2A\u0E48\u0E27\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21/\u0E08\u0E1A");
  }
  const A = msAxis(C, today, compact ? 0 : 1);
  const rows = compact ? C.rows.filter(r => r.head) : C.rows;
  const pxDay = compact ? 0 : A.span <= 49 ? 24 : A.span <= 120 ? 12 : 5;
  const dayHead = pxDay >= 20;
  const full = !compact && !narrow;
  const dates = full && !mid;
  const cols = compact ? narrow ? "1fr 34px" : "1fr 38px" : narrow ? "1fr 40px" : mid ? "38px minmax(150px,1fr) 74px 78px" : "38px minmax(180px,1fr) 62px 62px 74px 78px";
  const labW = compact ? narrow ? 124 : 150 : narrow ? 168 : mid ? 400 : 560;
  const rh = compact ? 20 : 34;
  const headH = compact ? 16 : dayHead ? 46 : 30;
  const showToday = A.td != null && A.td >= A.lo && A.td <= A.hi;
  const weekend = [];
  if (pxDay >= 5) for (let d = A.lo; d <= A.hi; d++) {
    const w = new Date(d * 86400000).getUTCDay();
    if (w === 0) weekend.push(d);
  }
  const thS = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-3)",
    whiteSpace: "nowrap"
  };
  return React.createElement("div", {
    style: {
      overflowX: compact ? "hidden" : "auto",
      WebkitOverflowScrolling: "touch"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: labW + "px 1fr",
      minWidth: compact ? 0 : labW + A.span * pxDay
    }
  }, React.createElement("div", {
    style: {
      position: "sticky",
      left: 0,
      zIndex: 3,
      background: "var(--surface)",
      height: headH,
      display: "grid",
      gridTemplateColumns: cols,
      alignItems: "end",
      gap: 6,
      paddingBottom: 4,
      paddingRight: 8,
      borderBottom: compact ? "none" : "1px solid var(--divider)"
    }
  }, !compact && (narrow ? React.createElement(React.Fragment, null, React.createElement("span", {
    style: thS
  }, "\u0E07\u0E32\u0E19"), React.createElement("span", {
    style: Object.assign({}, thS, {
      textAlign: "right"
    })
  }, "%")) : React.createElement(React.Fragment, null, React.createElement("span", {
    style: thS
  }, "ID"), React.createElement("span", {
    style: thS
  }, "\u0E07\u0E32\u0E19 \xB7 \u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"), dates && React.createElement("span", {
    style: thS
  }, "\u0E40\u0E23\u0E34\u0E48\u0E21"), dates && React.createElement("span", {
    style: thS
  }, "\u0E08\u0E1A"), React.createElement("span", {
    style: thS
  }, "\u0E04\u0E27\u0E32\u0E21\u0E04\u0E37\u0E1A\u0E2B\u0E19\u0E49\u0E32"), React.createElement("span", {
    style: thS
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30")))), React.createElement("div", {
    style: {
      position: "relative",
      height: headH,
      borderBottom: compact ? "none" : "1px solid var(--divider)"
    }
  }, A.months.map(m => React.createElement("span", {
    key: "m" + m.d,
    style: {
      position: "absolute",
      left: A.X(m.d) + "%",
      top: 0,
      fontSize: compact ? 9.5 : 10.5,
      fontWeight: 800,
      color: "var(--text-2)",
      paddingLeft: 3,
      borderLeft: m.d !== A.lo ? "1px solid var(--divider)" : "none",
      whiteSpace: "nowrap",
      height: compact ? "100%" : 15
    }
  }, m.th)), !compact && A.weeks.map(w => React.createElement("span", {
    key: "w" + w.d,
    style: {
      position: "absolute",
      left: A.X(w.d) + "%",
      width: A.W(w.d, w.d + 6) + "%",
      top: 15,
      height: 14,
      fontSize: 9.5,
      fontWeight: 700,
      color: "var(--text-3)",
      paddingLeft: 3,
      borderLeft: "1px solid var(--divider)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      boxSizing: "border-box"
    }
  }, w.n < 1 ? "" : pxDay >= 12 ? "สัปดาห์ " + w.n : "W" + w.n)), dayHead && Array.from({
    length: A.span
  }, (_, i) => {
    const d = A.lo + i,
      x = new Date(d * 86400000),
      wd = x.getUTCDay();
    return React.createElement("span", {
      key: "d" + d,
      style: {
        position: "absolute",
        left: A.X(d) + "%",
        width: A.W(d, d) + "%",
        top: 29,
        height: 16,
        textAlign: "center",
        lineHeight: 1,
        fontSize: 9,
        color: d === A.td ? "var(--tint-red-tx)" : wd === 0 ? "var(--text-3)" : "var(--text-2)",
        fontWeight: d === A.td ? 800 : 500
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 8,
        opacity: 0.75
      }
    }, MS_DOW[wd]), x.getUTCDate());
  })), rows.map((r, i) => {
    const ps = msDay(r.planStart),
      pe = msDay(r.planEnd || r.planStart);
    const st = MS_ST[r.st] || MS_ST.todo;
    const sub = !r.head;
    const line = r.head && i && !compact ? "1px solid var(--divider)" : "none";
    const p = msPct(r.pct);
    return React.createElement(React.Fragment, {
      key: r.id + "-" + i
    }, React.createElement("div", {
      style: {
        position: "sticky",
        left: 0,
        zIndex: 2,
        background: r.head && !compact ? "color-mix(in srgb, var(--surface2) 70%, var(--surface))" : "var(--surface)",
        height: rh,
        display: "grid",
        gridTemplateColumns: cols,
        alignItems: "center",
        gap: 6,
        paddingRight: 8,
        borderTop: line,
        minWidth: 0
      }
    }, full && React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 10.5,
        color: "var(--text-3)",
        paddingLeft: 4
      }
    }, r.no), React.createElement("span", {
      style: {
        minWidth: 0,
        paddingLeft: sub && !compact && narrow ? 10 : sub && full ? 12 : 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: compact ? 11.5 : sub ? 12 : 12.5,
        fontWeight: r.head ? 800 : 500,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      },
      title: r.th
    }, r.th || "—"), !compact && r.owner && React.createElement("span", {
      style: {
        display: "block",
        fontSize: 10,
        color: "var(--text-3)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        marginTop: 1
      }
    }, r.owner)), dates && React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-2)",
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums"
      }
    }, msTH(r.planStart)), dates && React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-2)",
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums"
      }
    }, msTH(r.planEnd || r.planStart)), full ? React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 5
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: MS_TRACK,
        overflow: "hidden"
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        width: p + "%",
        height: "100%",
        background: st.bar
      }
    })), React.createElement("span", {
      style: {
        width: 30,
        textAlign: "right",
        fontFamily: "var(--mono)",
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, p, "%")) : React.createElement("span", {
      style: {
        textAlign: "right",
        fontFamily: "var(--mono)",
        fontSize: compact ? 10.5 : 11.5,
        fontWeight: 700,
        color: r.st === "late" ? st.tx : "var(--text-1)"
      }
    }, p, "%"), full && React.createElement("span", null, React.createElement(MsPill, {
      st: r.st,
      small: true
    }))), React.createElement("div", {
      style: {
        position: "relative",
        height: rh,
        borderTop: line,
        background: r.head && !compact ? "color-mix(in srgb, var(--surface2) 45%, transparent)" : "transparent"
      }
    }, !compact && weekend.map(d => React.createElement("span", {
      key: d,
      style: {
        position: "absolute",
        left: A.X(d) + "%",
        width: A.W(d, d) + "%",
        top: 0,
        bottom: 0,
        background: "color-mix(in srgb, var(--text-3) 7%, transparent)"
      }
    })), !compact && A.weeks.map(w => React.createElement("span", {
      key: "g" + w.d,
      style: {
        position: "absolute",
        left: A.X(w.d) + "%",
        top: 0,
        bottom: 0,
        width: 1,
        background: "var(--divider)"
      }
    })), ps != null && React.createElement("div", {
      title: r.th + " · " + msSpanTH(r.planStart, r.planEnd) + " · " + p + "%",
      style: {
        position: "absolute",
        left: A.X(ps) + "%",
        width: A.W(ps, pe) + "%",
        top: rh / 2 - (compact ? 4 : r.head ? 6 : 7),
        height: compact ? 8 : r.head ? 12 : 14,
        borderRadius: compact ? 3 : 4,
        background: MS_TRACK,
        overflow: "hidden",
        boxShadow: r.st === "late" && !compact ? "inset 0 0 0 1px var(--tint-red-tx)" : "none"
      }
    }, React.createElement("div", {
      style: {
        width: p + "%",
        height: "100%",
        background: st.bar,
        opacity: r.head ? 0.85 : 1
      }
    })), showToday && React.createElement("span", {
      style: {
        position: "absolute",
        left: A.X(A.td + 0.5) + "%",
        top: 0,
        bottom: 0,
        width: 1.5,
        background: "var(--tint-red-tx)",
        zIndex: 1
      }
    })));
  })));
}
function MsEditor({
  rows,
  setRows,
  inst,
  narrow,
  owners
}) {
  const set = (i, k, v) => setRows(L => L.map((r, j) => {
    if (j !== i) return r;
    const up = {
      [k]: v
    };
    if (k === "pct") up.pct = v === "" ? "" : msPct(v);
    if (k === "planStart" && v && !r.planEnd) up.planEnd = v;
    if (k === "planStart" && v && r.planEnd && r.planStart) {
      const d = msDur(r.planStart, r.planEnd);
      up.planEnd = msIso(msDay(v) + d - 1);
    }
    if (k === "planStart" || k === "planEnd") up._dur = undefined;
    if (k === "dur") {
      delete up.dur;
      up._dur = v;
      const n = Math.max(1, Math.round(+v || 0));
      if (r.planStart && v !== "") up.planEnd = msIso(msDay(r.planStart) + n - 1);
    }
    return Object.assign({}, r, up);
  }));
  const move = (i, d) => setRows(L => {
    const a = L.slice(),
      j = i + d;
    if (j < 0 || j >= a.length) return L;
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
    return a;
  });
  const del = i => setRows(L => L.filter((_, j) => j !== i));
  const addSub = i => setRows(L => {
    let j = i + 1;
    while (j < L.length && !L[j].head) j++;
    const a = L.slice();
    a.splice(j, 0, msRow("", false));
    return a;
  });
  const inp = {
    padding: "7px 9px",
    fontSize: 12.5,
    border: "none",
    borderRadius: "var(--r-tile)",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit"
  };
  const dIn = Object.assign({}, inp, {
    fontFamily: "var(--mono)",
    fontSize: 12
  });
  const cols = narrow ? "1fr 1fr" : "minmax(170px,1.4fr) minmax(110px,.8fr) 132px 132px 58px 62px 88px";
  const lab = t => narrow ? React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, t) : null;
  const iconBtn = (ic, fn, title, danger, dis) => React.createElement("button", {
    onClick: fn,
    title: title,
    "aria-label": title,
    disabled: dis,
    style: {
      width: 26,
      height: 26,
      border: "none",
      borderRadius: 8,
      background: "transparent",
      cursor: dis ? "default" : "pointer",
      display: "grid",
      placeItems: "center",
      color: danger ? "var(--tint-red-tx)" : "var(--text-3)",
      opacity: dis ? 0.35 : 1,
      padding: 0,
      fontSize: 10
    }
  }, ic === "up" ? "▲" : ic === "down" ? "▼" : React.createElement(Icon, {
    name: ic,
    size: 14
  }));
  const fieldW = n => narrow ? {
    gridColumn: "span " + n
  } : null;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, React.createElement("datalist", {
    id: "ms-owners"
  }, owners.map(o => React.createElement("option", {
    key: o,
    value: o
  }))), !narrow && React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: cols,
      gap: 8,
      padding: "0 12px",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, React.createElement("span", null, "\u0E07\u0E32\u0E19"), React.createElement("span", null, "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"), React.createElement("span", null, "\u0E40\u0E23\u0E34\u0E48\u0E21"), React.createElement("span", null, "\u0E08\u0E1A"), React.createElement("span", null, "\u0E27\u0E31\u0E19"), React.createElement("span", null, "%"), React.createElement("span", null)), rows.map((r, i) => {
    const isInst = r.head && r.link === "install";
    const leaf = !r.head || isInst && !inst.length;
    return React.createElement(React.Fragment, {
      key: r.id
    }, React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: cols,
        gap: 8,
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: "var(--r-tile)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        marginTop: r.head && i ? 8 : 0,
        marginLeft: r.head || narrow ? 0 : 18
      }
    }, React.createElement("input", {
      value: r.th,
      onChange: e => set(i, "th", e.target.value),
      placeholder: r.head ? "หัวข้อใหญ่" : "ชื่องาน",
      style: Object.assign({}, inp, {
        fontWeight: r.head ? 800 : 500
      }, fieldW(2))
    }), leaf ? React.createElement(React.Fragment, null, React.createElement("label", {
      style: Object.assign({
        display: "flex",
        flexDirection: "column",
        gap: 3
      }, fieldW(2))
    }, lab("ผู้รับผิดชอบ"), React.createElement("input", {
      list: "ms-owners",
      value: r.owner || "",
      onChange: e => set(i, "owner", e.target.value),
      placeholder: "\u0E43\u0E04\u0E23",
      style: inp
    })), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3
      }
    }, lab("เริ่ม"), React.createElement("input", {
      type: "date",
      value: r.planStart || "",
      onChange: e => set(i, "planStart", e.target.value),
      style: dIn
    })), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3
      }
    }, lab("จบ"), React.createElement("input", {
      type: "date",
      value: r.planEnd || "",
      min: r.planStart || undefined,
      onChange: e => set(i, "planEnd", e.target.value),
      style: dIn
    })), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3
      }
    }, lab("วัน"), React.createElement("input", {
      type: "number",
      min: 1,
      value: r._dur != null ? r._dur : msDur(r.planStart, r.planEnd) || "",
      disabled: !r.planStart,
      onChange: e => set(i, "dur", e.target.value),
      onBlur: () => set(i, "_dur", undefined),
      style: Object.assign({}, inp, {
        textAlign: "right",
        fontFamily: "var(--mono)"
      })
    })), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 3
      }
    }, lab("ทำไปแล้ว %"), React.createElement("input", {
      type: "number",
      min: 0,
      max: 100,
      step: 5,
      value: r.pct === "" ? "" : r.pct,
      onChange: e => set(i, "pct", e.target.value),
      style: Object.assign({}, inp, {
        textAlign: "right",
        fontFamily: "var(--mono)"
      })
    }))) : React.createElement("span", {
      style: Object.assign({
        gridColumn: narrow ? "span 2" : "2 / span 5",
        fontSize: 11.5,
        color: "var(--text-3)"
      })
    }, isInst ? "ขั้นย่อยดึงจากตารางขั้นงานในรายงานประจำวัน — แก้วัน/% ที่นั่น" : "ช่วงวันและ % คิดจากงานย่อยใต้หัวข้อนี้"), React.createElement("span", {
      style: Object.assign({
        display: "flex",
        gap: 2,
        justifyContent: "flex-end"
      }, fieldW(2))
    }, r.head && !isInst && iconBtn("plus", () => addSub(i), "เพิ่มงานย่อย"), iconBtn("up", () => move(i, -1), "เลื่อนขึ้น", false, i === 0), iconBtn("down", () => move(i, 1), "เลื่อนลง", false, i === rows.length - 1), iconBtn("trash", () => del(i), "ลบแถว", true))), isInst && inst.map(x => React.createElement("div", {
      key: x.id,
      style: {
        display: "grid",
        gridTemplateColumns: narrow ? "1fr auto" : "minmax(160px,1fr) 1fr 64px",
        gap: 8,
        alignItems: "center",
        padding: "6px 12px",
        marginLeft: narrow ? 0 : 18,
        borderRadius: "var(--r-tile)",
        background: "var(--surface2)",
        fontSize: 12,
        color: "var(--text-2)"
      }
    }, React.createElement("span", {
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, x.th), !narrow && React.createElement("span", {
      style: {
        color: "var(--text-3)",
        fontSize: 11.5
      }
    }, msSpanTH(x.planStart, x.planEnd) || "ยังไม่ใส่วันแผน"), React.createElement("span", {
      style: {
        textAlign: "right",
        fontFamily: "var(--mono)",
        fontWeight: 700
      }
    }, x.pct, "%"))));
  }));
}
function msPrintHTML(job, C, today) {
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const A = msAxis(C, today, 0);
  const X = d => A.X(d).toFixed(3),
    W = (a, b) => A.W(a, b).toFixed(3);
  const daily = A.span <= 84;
  let grid = A.weeks.map(w => '<i class="wk" style="left:' + X(w.d) + '%"></i>').join("");
  if (daily) for (let d = A.lo; d <= A.hi; d++) if (new Date(d * 86400000).getUTCDay() === 0) grid += '<i class="we" style="left:' + X(d) + "%;width:" + W(d, d) + '%"></i>';
  if (A.td != null && A.td >= A.lo && A.td <= A.hi) grid += '<i class="td" style="left:' + X(A.td + 0.5) + '%"></i>';
  const stCls = {
    done: "done",
    doing: "doing",
    late: "late",
    todo: "todo"
  };
  const stTx = {
    done: "เสร็จแล้ว",
    doing: "กำลังทำ",
    late: "ล่าช้า",
    todo: "ยังไม่เริ่ม"
  };
  const body = C.rows.map(r => {
    const ps = msDay(r.planStart),
      pe = msDay(r.planEnd || r.planStart),
      p = msPct(r.pct);
    const bar = ps != null ? '<b class="bar ' + (r.head ? "h " : "") + stCls[r.st] + '" style="left:' + X(ps) + "%;width:" + W(ps, pe) + '%"><s style="width:' + p + '%"></s></b>' : "";
    return '<tr class="' + (r.head ? "h" : "s") + '"><td class="n">' + esc(r.no) + '</td><td class="t">' + esc(r.th) + '</td><td class="o">' + esc(r.owner) + '</td><td class="d">' + esc(msTH(r.planStart, true)) + '</td><td class="d">' + esc(msTH(r.planEnd || r.planStart, true)) + '</td><td class="u">' + (msDur(r.planStart, r.planEnd) || "") + '</td><td class="p"><span class="pb"><span class="' + stCls[r.st] + '" style="width:' + p + '%"></span></span>' + p + '%</td><td class="st"><span class="pill ' + stCls[r.st] + '">' + stTx[r.st] + '</span></td><td class="g"><div class="gc">' + grid + bar + "</div></td></tr>";
  }).join("");
  let hd = '<div class="gc mh">' + A.months.map(m => '<span style="left:' + X(m.d) + '%"' + (m.d !== A.lo ? ' class="b"' : "") + ">" + m.th + "</span>").join("") + "</div>" + '<div class="gc wh">' + A.weeks.map(w => '<span style="left:' + X(w.d) + "%;width:" + W(w.d, w.d + 6) + '%">' + (w.n < 1 ? "" : "สัปดาห์ " + w.n) + "</span>").join("") + "</div>";
  if (daily) {
    let dd = "";
    for (let d = A.lo; d <= A.hi; d++) {
      const x = new Date(d * 86400000);
      dd += '<span class="' + (x.getUTCDay() === 0 ? "su" : "") + (d === A.td ? " tdh" : "") + '" style="left:' + X(d) + "%;width:" + W(d, d) + '%"><em>' + MS_DOW[x.getUTCDay()] + "</em>" + x.getUTCDate() + "</span>";
    }
    hd += '<div class="gc dh">' + dd + "</div>";
  }
  const head = '<tr><th class="n">ID</th><th class="t">รายการงาน</th><th class="o">ผู้รับผิดชอบ</th><th class="d">เริ่ม</th><th class="d">จบ</th><th class="u">วัน</th>' + '<th class="p">ความคืบหน้า</th><th class="st">สถานะ</th><th class="g">' + hd + "</th></tr>";
  const title = window.rpFileName ? window.rpFileName(job, "MS") : "Master Schedule " + (job.code || "");
  const td = msDay(today),
    days = C.lo != null ? C.hi - C.lo + 1 : null,
    left = C.hi != null && td != null ? C.hi - td : null;
  const leftTx = left == null ? "—" : C.pct >= 100 ? "เสร็จแล้ว" : left > 0 ? "เหลือ " + left + " วัน" : left === 0 ? "ครบกำหนดวันนี้" : "เลยกำหนด " + -left + " วัน";
  const R = 34,
    Cc = 2 * Math.PI * R;
  const ring = '<svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="' + R + '" fill="none" stroke="#D5EEE5" stroke-width="10"/>' + '<circle cx="46" cy="46" r="' + R + '" fill="none" stroke="#1B9B75" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (Cc * C.pct / 100).toFixed(2) + " " + Cc.toFixed(2) + '" transform="rotate(-90 46 46)"/><text x="46" y="46" dominant-baseline="central" text-anchor="middle" font-size="20" font-weight="800" fill="#15211A" font-family="monospace">' + C.pct + "%</text></svg>";
  const kpi = (lab, v, cls) => '<div class="k ' + (cls || "") + '"><span>' + lab + "</span><b>" + v + "</b></div>";
  const info = [["โครงการ", [job.code, job.name].filter(Boolean).join(" · ")], ["ขนาดระบบ", job.kw ? job.kw + " kWp" : ""], ["สถานที่", [job.address, job.province].filter(Boolean).join(" ")], ["ผู้ดูแลโครงการ", job.eeName || ""], ["ลูกค้า", job.customer || job.customerName || ""]].filter(x => x[1]);
  const css = "@page{size:A3 landscape;margin:9mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}" + "body{margin:0;font-family:'IBM Plex Sans Thai',sans-serif;color:#15211A;font-size:10.5px;background:#fff;min-width:1500px}" + ".hd{display:flex;gap:14px;align-items:stretch;margin-bottom:10px}.ttl{flex:1.2;min-width:0;border-left:5px solid #1B9B75;padding:2px 0 2px 12px}" + ".ttl h1{margin:0;font-size:24px;letter-spacing:.03em}.ttl .sub{color:#4A5A51;font-size:12px;margin-top:2px}.ttl table{margin-top:6px;border-collapse:collapse}" + ".ttl td{padding:1px 10px 1px 0;font-size:11px;white-space:nowrap;border:0;height:auto}.ttl td:first-child{color:#7A8A81}" + ".ks{display:flex;gap:8px;align-items:stretch}.k{min-width:86px;border-radius:8px;background:#F3F6F4;padding:8px 12px;display:flex;flex-direction:column;justify-content:center}" + ".k span{font-size:10px;font-weight:700;color:#5A6B62}.k b{font-size:24px;font-family:monospace;margin-top:2px}.k.ok{background:#E3F4EC}.k.ok b,.k.ok span{color:#15803D}" + ".k.am{background:#FDF1DC}.k.am b,.k.am span{color:#935F07}.k.rd{background:#FDE6E6}.k.rd b,.k.rd span{color:#B91C1C}" + ".rg{display:flex;align-items:center;gap:10px;border-radius:8px;background:#F3F6F4;padding:4px 14px 4px 6px}.rg .ri{font-size:11px;line-height:1.75;color:#4A5A51}.rg .ri b{color:#15211A}" + "table.t1{width:100%;border-collapse:collapse;table-layout:fixed}" + "table.t1 th{font-size:10px;color:#fff;background:#1B5E4A;font-weight:700;text-align:left;padding:0 5px;height:22px;vertical-align:middle}" + "table.t1 th.g{padding:0;background:#24745C;vertical-align:top}" + "table.t1 td{padding:0 5px;height:20px;border-bottom:1px solid #E6ECE8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}" + "tr.h td{font-weight:800;background:#EEF4F0;height:22px}tr.s td.t{padding-left:14px}" + ".n{width:36px}td.n{font-family:monospace;color:#7A8A81}.t{width:220px}.o{width:110px}td.o{color:#4A5A51}.d{width:66px}.u{width:30px;text-align:right}.p{width:84px}.st{width:66px}" + "td.p{font-family:monospace;font-size:9.5px}.pb{display:inline-block;width:42px;height:6px;border-radius:3px;background:#D5EEE5;margin-right:5px;vertical-align:middle;overflow:hidden}" + ".pb span{display:block;height:100%;background:#1B9B75}.pb span.done{background:#15803D}.pb span.late{background:#DC2626}" + ".pill{display:inline-block;padding:1px 7px;border-radius:9px;font-size:9px;font-weight:700;background:#ECEFED;color:#4A5A51}" + ".pill.done{background:#DDF3E8;color:#15803D}.pill.doing{background:#FCE9C6;color:#935F07}.pill.late{background:#FDE0E0;color:#B91C1C}" + "td.g{padding:0}.gc{position:relative;height:20px}tr.h .gc{height:22px}" + ".mh{height:17px}.mh span{position:absolute;top:2px;padding-left:4px;font-size:10px;font-weight:800;color:#fff;white-space:nowrap}.mh span.b{border-left:1px solid rgba(255,255,255,.5)}" + ".wh{height:15px;background:#2F8A6D}.wh span{position:absolute;top:0;height:15px;line-height:15px;padding-left:4px;font-size:9px;color:#fff;border-left:1px solid rgba(255,255,255,.35);white-space:nowrap;overflow:hidden}" + ".dh{height:24px;background:#fff}.dh span{position:absolute;top:2px;text-align:center;font-size:9px;line-height:1.05;color:#15211A;font-weight:600}.dh span em{display:block;font-style:normal;font-size:7.5px;color:#7A8A81}" + ".dh span.su{color:#9AA8A0}.dh span.tdh{color:#DC2626;font-weight:800}" + "i.wk{position:absolute;top:0;bottom:0;width:1px;background:#DCE5E0}i.we{position:absolute;top:0;bottom:0;background:#F4F6F5}i.td{position:absolute;top:0;bottom:0;width:1.5px;background:#DC2626;z-index:2}" + "b.bar{position:absolute;top:4px;height:12px;border-radius:3px;background:#C9E9DD;overflow:hidden;z-index:1}tr.h b.bar{top:6px;height:10px}" + "b.bar s{display:block;height:100%;background:#1B9B75}b.bar.done s{background:#15803D}b.bar.late{box-shadow:inset 0 0 0 1px #DC2626}b.bar.late s{background:#DC2626}" + ".lg{display:flex;gap:16px;margin-top:8px;font-size:10px;color:#4A5A51;align-items:center}.lg i{display:inline-block;width:18px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle}";
  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(title) + "</title>" + '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700;800&display=swap" rel="stylesheet"><style>' + css + "</style></head><body>" + '<div class="hd"><div class="ttl"><h1>MASTER SCHEDULE</h1><div class="sub">แผนงานหลักโครงการ · ณ วันที่ ' + esc(msTH(today, true)) + "</div><table>" + info.map(x => "<tr><td>" + esc(x[0]) + "</td><td><b>" + esc(x[1]) + "</b></td></tr>").join("") + "</table></div>" + '<div class="rg">' + ring + '<div class="ri">เริ่ม <b>' + esc(C.lo != null ? msTH(msIso(C.lo), true) : "—") + "</b><br>จบ <b>" + esc(C.hi != null ? msTH(msIso(C.hi), true) : "—") + "</b><br>รวม <b>" + (days || "—") + " วัน</b><br><b" + (left != null && left < 0 && C.pct < 100 ? ' style="color:#B91C1C"' : "") + ">" + esc(leftTx) + "</b></div></div>" + '<div class="ks">' + kpi("งานทั้งหมด", C.leaves) + kpi("เสร็จแล้ว", C.cnt.done, "ok") + kpi("กำลังทำ", C.cnt.doing, "am") + kpi("ยังไม่เริ่ม", C.cnt.todo) + (C.cnt.late ? kpi("ล่าช้า", C.cnt.late, "rd") : "") + "</div></div>" + '<table class="t1"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>" + '<div class="lg"><span><i style="background:#C9E9DD"></i>ช่วงแผน</span><span><i style="background:#1B9B75"></i>ทำไปแล้ว (ระบายตาม %)</span>' + '<span><i style="background:#15803D"></i>เสร็จ</span><span><i style="background:#DC2626"></i>ล่าช้า</span><span><i style="background:#DC2626;width:2px"></i>วันนี้</span>' + '<span style="margin-left:auto">ออกเอกสาร ' + esc(msTH(msToday(), true)) + "</span></div></body></html>";
}
function MsModal({
  job,
  canEdit,
  currentUser,
  onClose
}) {
  const {
    ms,
    inst
  } = useMsData(job);
  const today = msToday();
  const narrow = useMsNarrow(860),
    mid = useMsNarrow(1180);
  const [edit, setEdit] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [print, setPrint] = React.useState(null);
  const base = React.useMemo(() => ms.rows || msTemplate(), [ms.rows]);
  const C = React.useMemo(() => msCompute(edit || base, inst, job, today), [edit, base, inst, job, today]);
  const bd = window.useBackdropClose ? window.useBackdropClose(() => {
    if (!edit) onClose();
  }) : {};
  const dirty = edit && JSON.stringify(edit) !== JSON.stringify(base);
  const owners = React.useMemo(() => {
    const tech = job.tech && window.SF && window.SF.TECH_BY_ID && window.SF.TECH_BY_ID[job.tech];
    const fromRows = (edit || base).map(r => r.owner);
    return [...new Set([job.eeName, job.salesName, tech && tech.name, job.contractor, "ทีมติดตั้ง", "ฝ่ายขาย", "ฝ่ายออกแบบ", "ฝ่ายจัดซื้อ", "ลูกค้า", "การไฟฟ้า"].concat(fromRows).filter(x => x && String(x).trim()))];
  }, [job, edit, base]);
  const doSave = () => {
    setBusy(true);
    Promise.resolve(ms.save(edit, currentUser)).then(() => {
      setBusy(false);
      setEdit(null);
    }, e => {
      setBusy(false);
      window.askConfirm({
        title: "บันทึกไม่สำเร็จ",
        body: String(e && e.message || e),
        ok: "ตกลง"
      });
    });
  };
  const cancel = () => {
    if (!dirty) {
      setEdit(null);
      return;
    }
    window.askConfirm({
      title: "ทิ้งที่แก้ไว้?",
      body: "แผนงานที่แก้ยังไม่ได้บันทึก",
      ok: "ทิ้ง",
      danger: true
    }).then(ok => {
      if (ok) setEdit(null);
    });
  };
  const reset = () => window.askConfirm({
    title: "เริ่มจากแม่แบบใหม่?",
    body: "หัวข้อ วันที่ และผู้รับผิดชอบที่แก้ไว้จะถูกแทนด้วยแม่แบบมาตรฐาน (ยังไม่บันทึกจนกว่าจะกดบันทึก)",
    ok: "ใช้แม่แบบ",
    danger: true
  }).then(ok => {
    if (ok) setEdit(msTemplate());
  });
  const btn = (solid, soft) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 15px",
    borderRadius: "var(--r-tile)",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 700,
    background: solid ? "var(--primary)" : soft ? "var(--primary-soft)" : "var(--surface2)",
    color: solid ? "#fff" : soft ? "var(--primary-dark)" : "var(--text-1)",
    boxShadow: solid ? "var(--shadow-btn)" : "var(--shadow-sm)"
  });
  return React.createElement("div", _extends({}, bd, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 115,
      display: "grid",
      placeItems: narrow ? "end center" : "center",
      padding: narrow ? 0 : 20
    }
  }), React.createElement("div", {
    style: {
      width: narrow ? "100%" : "min(1400px, 100%)",
      height: narrow ? "94%" : "min(900px, 100%)",
      background: "var(--bg)",
      borderRadius: narrow ? "var(--r-card) var(--r-card) 0 0" : "var(--r-card)",
      boxShadow: "var(--shadow-card)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: narrow ? "14px 15px" : "16px 20px",
      background: "var(--surface)",
      boxShadow: "0 6px 18px -12px rgba(8,20,14,.25)",
      zIndex: 3
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "var(--r-tile)",
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "calendar",
    size: 18,
    color: "var(--primary)"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "Master Schedule", edit ? " · แก้แผนงาน" : ""), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, [job.code, job.name].filter(Boolean).join(" · "), ms.data && ms.data.updatedAt ? " · แก้ล่าสุด " + msTH(ms.data.updatedAt.slice(0, 10), true) + (ms.data.byName ? " โดย " + ms.data.byName : "") : "")), React.createElement("button", {
    className: "x-close",
    onClick: () => edit ? cancel() : onClose(),
    title: "\u0E1B\u0E34\u0E14",
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      width: 34,
      height: 34,
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: narrow ? 12 : 18
    }
  }, ms.loading ? React.createElement("div", {
    style: {
      padding: 20,
      color: "var(--text-3)",
      fontSize: 13
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u2026") : React.createElement(React.Fragment, null, React.createElement(MsSummary, {
    C: C,
    today: today,
    narrow: narrow
  }), edit ? React.createElement(MsEditor, {
    rows: edit,
    setRows: setEdit,
    inst: inst,
    narrow: narrow,
    owners: owners
  }) : React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: narrow ? "10px 10px" : "12px 14px"
    }
  }, !ms.rows && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginBottom: 8
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E17\u0E33\u0E41\u0E1C\u0E19 \u2014 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E41\u0E21\u0E48\u0E41\u0E1A\u0E1A\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 \u0E01\u0E14 \"\u0E41\u0E01\u0E49\u0E41\u0E1C\u0E19\u0E07\u0E32\u0E19\" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2A\u0E48\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A \u0E27\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21/\u0E08\u0E1A \u0E41\u0E25\u0E49\u0E27\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), React.createElement(MsGantt, {
    C: C,
    today: today,
    narrow: narrow,
    mid: mid
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 10
    }
  }, [["ช่วงแผน", MS_TRACK], ["ทำไปแล้ว (ระบายตาม %)", "var(--primary)"], ["เสร็จ", "var(--tint-ok-tx)"], ["ล่าช้า", "var(--tint-red-tx)"]].map(([t, c]) => React.createElement("span", {
    key: t,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      width: 18,
      height: 8,
      borderRadius: 2,
      background: c
    }
  }), t)), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement("span", {
    style: {
      width: 2,
      height: 11,
      background: "var(--tint-red-tx)"
    }
  }), "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"))))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      padding: narrow ? "11px 12px calc(11px + env(safe-area-inset-bottom))" : "12px 20px",
      background: "var(--surface)",
      boxShadow: "0 -6px 18px -12px rgba(8,20,14,.25)"
    }
  }, edit ? React.createElement(React.Fragment, null, React.createElement("button", {
    style: btn(),
    onClick: () => setEdit(L => L.concat([msRow("", true)]))
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E43\u0E2B\u0E0D\u0E48"), React.createElement("button", {
    style: Object.assign(btn(), {
      color: "var(--tint-red-tx)"
    }),
    onClick: reset
  }, "\u0E04\u0E37\u0E19\u0E41\u0E21\u0E48\u0E41\u0E1A\u0E1A"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    style: btn(),
    onClick: cancel
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    style: btn(true),
    onClick: doSave,
    disabled: busy
  }, busy ? "กำลังบันทึก…" : "บันทึก")) : React.createElement(React.Fragment, null, React.createElement("button", {
    style: btn(),
    onClick: () => setPrint(msPrintHTML(job, C, today))
  }, React.createElement(Icon, {
    name: "file",
    size: 14
  }), " \u0E14\u0E39 / \u0E2D\u0E2D\u0E01 PDF"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), canEdit && React.createElement("button", {
    style: btn(false, true),
    onClick: () => setEdit(base.map(r => Object.assign({}, r))),
    disabled: ms.loading
  }, React.createElement(Icon, {
    name: "pen",
    size: 14
  }), " \u0E41\u0E01\u0E49\u0E41\u0E1C\u0E19\u0E07\u0E32\u0E19")))), print && window.SuReportView && React.createElement(window.SuReportView, {
    html: print,
    title: "Master Schedule",
    onClose: () => setPrint(null)
  }));
}
function MsCard({
  job,
  canEdit,
  currentUser
}) {
  const {
    ms,
    inst
  } = useMsData(job);
  const [open, setOpen] = React.useState(false);
  const today = msToday();
  const narrow = useMsNarrow(560);
  if (!job) return null;
  const C = msCompute(ms.rows || msTemplate(), inst, job, today);
  const sub = !ms.rows ? "ยังไม่ได้ทำแผน — กดเพื่อเริ่มจากแม่แบบ" : [C.lo != null ? msSpanTH(msIso(C.lo), msIso(C.hi)) : "ยังไม่ใส่วันแผน", C.cnt.done + "/" + C.leaves + " งานเสร็จ", C.late ? "ล่าช้า " + C.late : ""].filter(Boolean).join(" · ");
  return React.createElement(React.Fragment, null, React.createElement("div", {
    role: "button",
    tabIndex: 0,
    onClick: () => setOpen(true),
    onKeyDown: e => {
      if (e.key === "Enter") setOpen(true);
    },
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: narrow ? "11px 13px" : "13px 16px",
      marginBottom: narrow ? 14 : 16,
      cursor: "pointer"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      width: 18,
      height: 20,
      flexShrink: 0,
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "calendar",
    size: 15,
    color: "var(--primary)"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, "Master Schedule"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: C.late ? "var(--tint-red-tx)" : "var(--text-1)",
      marginTop: 2
    }
  }, sub)), ms.rows && React.createElement(MsRing, {
    pct: C.pct,
    size: 44
  }), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), ms.rows && C.lo != null && React.createElement("div", {
    style: {
      marginTop: 8,
      pointerEvents: "none"
    }
  }, React.createElement(MsGantt, {
    C: C,
    today: today,
    compact: true,
    narrow: narrow
  }))), open && ReactDOM.createPortal(React.createElement(MsModal, {
    job: job,
    canEdit: canEdit,
    currentUser: currentUser,
    onClose: () => setOpen(false)
  }), document.body));
}
Object.assign(window, {
  MsCard,
  MsModal,
  useMasterSchedule,
  msCompute,
  msInstallRows,
  msTemplate,
  msPrintHTML
});