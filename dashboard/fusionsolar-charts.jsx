/* ============================================================
   flash+solar — กราฟส่วนล่างของหน้ารายละเอียดไซต์ FusionSolar (docs/fusionsolar.md)
   ตามแบบอ้างอิงที่ผู้ใช้ส่งมา (Solis / Lumos / SolarSync / Sunsolar) · โหลดหลัง fusionsolar-scene.jsx ก่อน fusionsolar.jsx
   - FsTrendChart     ประวัติการผลิต · "area" = เส้นโค้งส้มเรืองแสงไล่สีลงพื้น + จุด "ตอนนี้" (รายชั่วโมงวันนี้)
                      "bars" = แท่งในราง แท่งที่ยังไม่จบเป็นลายเฉียง (รายวัน/รายเดือน) · ชี้ = กล่องค่า · มีมุมมองตาราง
   - FsEnergyBalance  แถบ "ไฟที่ผลิต" กับ "ไฟที่อาคารใช้" ชิดซ้ายสเกลเดียวกัน ส่วน "ใช้เอง" อยู่หน้าสุดทั้งคู่
   ไม่มีการเขียนฐานข้อมูลในไฟล์นี้ · ลดการเคลื่อนไหว = ไม่มีอนิเมชัน
   ============================================================ */

(function fsInjectChartCss() {
  if (document.getElementById("fs-chart-css")) return;
  const el = document.createElement("style");
  el.id = "fs-chart-css";
  el.textContent = "@keyframes fsGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}"
    + ".fs-grow{transform-box:fill-box;transform-origin:50% 100%;animation:fsGrow .7s cubic-bezier(.2,.8,.2,1) both}"
    + "@keyframes fsDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}.fs-draw{stroke-dasharray:1;animation:fsDraw 1.2s ease both}"
    + "@keyframes fsFade{from{opacity:0}to{opacity:1}}.fs-fade{animation:fsFade 1s ease both}"
    + "@keyframes fsPulse{0%{transform:scale(1);opacity:.55}100%{transform:scale(3.2);opacity:0}}"
    + ".fs-pulse{transform-box:fill-box;transform-origin:center;animation:fsPulse 1.8s ease-out infinite}"
    + "@keyframes fsDrop{to{stroke-dashoffset:-20}}.fs-drop{stroke-dasharray:5 15;animation:fsDrop .8s linear infinite}"
    + "@keyframes fsWide{from{transform:scaleX(0)}to{transform:scaleX(1)}}.fs-wide{transform-box:fill-box;transform-origin:0 50%;animation:fsWide .8s cubic-bezier(.2,.8,.2,1) both}"
    + ":root{--fs-load:#3B5BDB}[data-theme=\"aurora\"]{--fs-load:#6C8CF5}"
    + "@media (prefers-reduced-motion: reduce){.fs-grow,.fs-draw,.fs-fade,.fs-pulse,.fs-drop,.fs-wide{animation:none!important}}";
  document.head.appendChild(el);
})();

/* ความกว้างกล่องสด — ref ต้องติดกล่องที่ render ทุกสถานะ */
function useFsWidth(def) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(def);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth || def));
    ro.observe(el); setW(el.clientWidth || def);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* เส้นโค้งผ่านทุกจุดแบบไม่พุ่งเกิน (monotone cubic) — กราฟผลิตไม่ติดลบ/ไม่โป่งเกินค่าจริง */
function fsMonoPath(P) {
  const n = P.length;
  if (n < 2) return n ? "M" + P[0][0] + "," + P[0][1] : "";
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1][0] - P[i][0]; m[i] = (P[i + 1][1] - P[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  let d = "M" + P[0][0] + "," + P[0][1];
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += "C" + (P[i][0] + h) + "," + (P[i][1] + h * t[i]) + " " + (P[i + 1][0] - h) + "," + (P[i + 1][1] - h * t[i + 1]) + " " + P[i + 1][0] + "," + P[i + 1][1];
  }
  return d;
}

/* ── ประวัติการผลิต ──
   bars: [{ k, label, value, tip: [บรรทัด], partial }] · avg = เส้นค่าเฉลี่ยประ (แท่งเท่านั้น) */
function FsTrendChart({ mode, bars, unit, avg, avgLabel, height, empty, t0, t1 }) {
  const [ref, w] = useFsWidth(640);
  const [hov, setHov] = React.useState(null);
  const [table, setTable] = React.useState(false);
  const uid = React.useMemo(() => "fst" + Math.random().toString(36).slice(2, 8), []);
  /* "time" = เส้นตามเวลาจริง (กราฟกำลังไฟวันนี้ kW) — b.t = นาทีของวัน · แกน t0–t1 นาที · ห่างกันเกิน 75 นาที = เส้นขาด */
  const timeMode = mode === "time";
  const area = mode === "area" || timeMode;
  /* ไฟที่ใช้ (b.load) — เฉพาะโหมด area · วาดเป็นพื้นที่ใต้โซลาร์ ส่วนที่ซ้อนกัน = ไฟโซลาร์ที่ใช้เอง */
  const vals = bars.map((b) => b.value).filter((v) => v != null);
  const loads = area ? bars.map((b) => b.load).filter((v) => v != null) : [];
  const hasLoad = loads.length > 0;
  const H = height || 210, padL = 40, padR = 8, padT = 28, padB = 26;
  const plotW = Math.max(60, w - padL - padR), plotH = H - padT - padB;
  const max = fsNice(Math.max.apply(null, vals.concat(loads, [avg || 0, 0])) * 1.06);
  const n = Math.max(1, bars.length), step = plotW / n;
  const T0 = t0 != null ? t0 : 0, T1 = t1 != null && t1 > T0 ? t1 : T0 + 1440;
  const XT = (t) => padL + plotW * (t - T0) / (T1 - T0);
  const X = (i) => (timeMode ? XT(bars[i].t) : padL + step * i + step / 2);
  const Y = (v) => padT + plotH * (1 - Math.max(0, v) / max);
  const base = Y(0);
  const every = Math.max(area ? 2 : 1, Math.ceil((n * (area ? 46 : 34)) / plotW));
  const fmtTick = (v) => (max >= 10000 ? fsFmt(v / 1000, 1) + "k" : fsFmt(v, max < 10 ? 1 : 0));
  const sun = "var(--fs-sun)";
  const bw = Math.max(4, Math.min(22, step * 0.6));
  const tog = (vals.length > 0 || hasLoad) && (
    <button type="button" onClick={() => setTable(!table)}
      style={{ position: "absolute", top: 0, right: 0, border: "none", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", borderRadius: "var(--r-chip)",
        padding: "3px 10px", fontSize: 10.5, fontWeight: 700, color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", zIndex: 2 }}>{table ? "กราฟ" : "ตาราง"}</button>
  );
  const grid = [0, 0.5, 1].map((f) => (
    <g key={f}>
      <line x1={padL} x2={w - padR} y1={Y(max * f)} y2={Y(max * f)} style={{ stroke: "var(--divider)", strokeWidth: 1, strokeDasharray: f ? "2 4" : "none" }} />
      <text x={padL - 8} y={Y(max * f) + 3.5} textAnchor="end" style={{ fill: "var(--text-3)", fontSize: 10, fontFamily: "var(--mono)" }}>{vals.length ? fmtTick(max * f) : ""}</text>
    </g>
  ));
  const track = (i) => <rect key={"t" + i} x={X(i) - bw / 2} y={padT} width={bw} height={plotH} rx={bw / 2} style={{ fill: "color-mix(in srgb, var(--fs-sun) 9%, var(--surface2))" }} />;

  /* ยังไม่มีข้อมูล = โครงกราฟจาง ๆ + ป้ายบอกเหตุ (ไม่ใช่กล่องเทาว่าง) */
  if (!vals.length && !hasLoad) {
    const gp = [];
    for (let i = 0; i <= 24; i++) { const f = i / 24; gp.push([padL + plotW * f, padT + plotH * (1 - 0.82 * Math.exp(-Math.pow((f - 0.5) / 0.21, 2)))]); }
    return (
      <div ref={ref} style={{ position: "relative", height: H }}>
        <svg width={w} height={H} style={{ display: "block" }} aria-hidden="true">
          {grid}
          {area ? <path d={fsMonoPath(gp)} fill="none" style={{ stroke: "var(--border-strong)", strokeWidth: 2, strokeDasharray: "5 7", strokeLinecap: "round" }} />
            : bars.map((b, i) => track(i))}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, maxWidth: 440, padding: "9px 15px", borderRadius: 14, background: "var(--surface)",
            boxShadow: "var(--shadow-card)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.45 }}>
            <span style={{ width: 28, height: 28, borderRadius: 14, display: "grid", placeItems: "center", flexShrink: 0,
              background: "color-mix(in srgb, var(--fs-sun) 16%, var(--surface))" }}><Icon name="clock" size={15} color={sun} /></span>
            {empty || "ยังไม่มีข้อมูล"}
          </div>
        </div>
      </div>
    );
  }

  if (table) return (
    <div ref={ref} style={{ position: "relative", paddingTop: 26 }}>{tog}
      <div style={{ maxHeight: H + 30, overflowY: "auto", borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)" }}>
        {bars.filter((b) => b.value != null || b.load != null).map((b, i) => (
          <div key={b.k} style={{ display: "flex", padding: "6px 12px", fontSize: 12, borderTop: i ? "1px solid var(--divider)" : "none" }}>
            <span style={{ flex: 1, color: "var(--text-2)" }}>{(b.tip && b.tip[0]) || b.label}{b.partial ? " (ยังไม่จบ)" : ""}</span>
            <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{b.value == null ? "–" : fsFmt(b.value, 1)} {unit}</span>
            {hasLoad && <span style={{ width: 96, textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-2)" }}>ใช้ {b.load == null ? "–" : fsFmt(b.load, 1)}</span>}
          </div>
        ))}
      </div>
    </div>
  );

  const hb = hov != null ? bars[hov] : null;
  const tipX = hov != null ? Math.min(Math.max(X(hov), 90), w - 90) : 0;
  const nowI = bars.findIndex((b) => b.partial && b.value != null);
  let peak = -1;
  bars.forEach((b, i) => { if (b.value != null && !b.partial && (peak < 0 || b.value > bars[peak].value)) peak = i; });

  /* ส่วนเส้น = ช่วงที่มีค่าต่อเนื่องกัน (ชั่วโมงที่ไม่ได้ซิงก์ = เส้นขาด) */
  const mkSegs = (get) => {
    const out = []; let cur = [];
    bars.forEach((b, i) => {
      const v = get(b);
      if (timeMode && cur.length && i > 0 && b.t - bars[i - 1].t > 75) { out.push(cur); cur = []; }
      if (v != null) cur.push([X(i), Y(v)]); else if (cur.length) { out.push(cur); cur = []; }
    });
    if (cur.length) out.push(cur);
    return out;
  };
  const segs = area ? mkSegs((b) => b.value) : [], lsegs = hasLoad ? mkSegs((b) => b.load) : [];
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }} onMouseLeave={() => setHov(null)}>
      {tog}
      <svg width={w} height={H} style={{ display: "block", overflow: "visible" }} role="img" aria-label={"กราฟการผลิต " + unit}>
        <defs>
          <linearGradient id={uid + "a"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--fs-sun)", stopOpacity: 0.42 }} />
            <stop offset="1" style={{ stopColor: "var(--fs-sun)", stopOpacity: 0 }} />
          </linearGradient>
          <linearGradient id={uid + "b"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--fs-sun)" }} />
            <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--fs-sun) 62%, var(--surface))" }} />
          </linearGradient>
          <pattern id={uid + "h"} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" style={{ fill: "color-mix(in srgb, var(--fs-sun) 30%, var(--surface))" }} />
            <rect width="2.6" height="6" style={{ fill: "var(--fs-sun)" }} />
          </pattern>
          <linearGradient id={uid + "l"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--fs-load)", stopOpacity: 0.26 }} />
            <stop offset="1" style={{ stopColor: "var(--fs-load)", stopOpacity: 0.04 }} />
          </linearGradient>
          <filter id={uid + "g"} x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {area ? grid : bars.map((b, i) => track(i))}
        {!area && grid.map((g) => React.cloneElement(g, { style: { pointerEvents: "none" } }))}
        <text x={0} y={10} textAnchor="start" style={{ fill: "var(--text-3)", fontSize: 10, fontWeight: 700 }}>{unit}</text>

        {lsegs.map((s, k) => {
          const d = fsMonoPath(s);
          return (
            <g key={"ld" + k}>
              {s.length > 1 && <path d={d + "L" + s[s.length - 1][0] + "," + base + "L" + s[0][0] + "," + base + "Z"} className="fs-fade" style={{ fill: "url(#" + uid + "l)" }} />}
              {s.length > 1 && <path d={d} pathLength="1" fill="none" className="fs-draw" style={{ stroke: "var(--fs-load)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }} />}
              {s.length === 1 && <circle cx={s[0][0]} cy={s[0][1]} r={3} style={{ fill: "var(--fs-load)" }} />}
            </g>
          );
        })}
        {area && segs.map((s, k) => {
          const d = fsMonoPath(s);
          return (
            <g key={k}>
              {s.length > 1 && <path d={d + "L" + s[s.length - 1][0] + "," + base + "L" + s[0][0] + "," + base + "Z"} className="fs-fade" style={{ fill: "url(#" + uid + "a)" }} />}
              {s.length > 1 && <path d={d} pathLength="1" fill="none" className="fs-draw" style={{ stroke: sun, strokeWidth: 7, opacity: 0.4, filter: "url(#" + uid + "g)" }} />}
              {s.length > 1 && <path d={d} pathLength="1" fill="none" className="fs-draw" style={{ stroke: sun, strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" }} />}
              {s.length === 1 && <circle cx={s[0][0]} cy={s[0][1]} r={3.5} style={{ fill: sun }} />}
            </g>
          );
        })}
        {area && nowI >= 0 && (
          <g>
            <line x1={X(nowI)} x2={X(nowI)} y1={Y(bars[nowI].value) + 6} y2={base} style={{ stroke: sun, strokeWidth: 1.2, strokeDasharray: "2 3", opacity: 0.7 }} />
            <circle cx={X(nowI)} cy={Y(bars[nowI].value)} r={5} className="fs-pulse" style={{ fill: sun }} />
            <circle cx={X(nowI)} cy={Y(bars[nowI].value)} r={5} style={{ fill: sun, stroke: "var(--surface)", strokeWidth: 2.5 }} />
          </g>
        )}

        {!area && bars.map((b, i) => {
          if (b.value == null) return null;
          const y = Y(b.value), hgt = Math.max(bw, base - y), on = hov === i;
          return (
            <rect key={b.k} x={X(i) - bw / 2} y={base - hgt} width={bw} height={hgt} rx={bw / 2} className="fs-grow"
              style={{ fill: "url(#" + uid + (b.partial ? "h" : "b") + ")", opacity: hov != null && !on ? 0.45 : 1, transition: "opacity .12s",
                animationDelay: Math.min(i * 18, 500) + "ms", filter: on ? "drop-shadow(0 4px 8px color-mix(in srgb, var(--fs-sun) 45%, transparent))" : "none" }} />
          );
        })}
        {!area && peak >= 0 && hov == null && (
          <text x={X(peak)} y={Y(bars[peak].value) - 7} textAnchor="middle" style={{ fill: "var(--text-1)", fontSize: 10.5, fontWeight: 800, fontFamily: "var(--mono)" }}>
            {fsFmt(bars[peak].value, bars[peak].value >= 100 ? 0 : 1)}
          </text>
        )}
        {!area && avg > 0 && (
          <g style={{ pointerEvents: "none" }}>
            <line x1={padL} x2={w - padR} y1={Y(avg)} y2={Y(avg)} style={{ stroke: "var(--text-2)", strokeWidth: 1.3, strokeDasharray: "5 4" }} />
            <rect x={w - padR - 92} y={Y(avg) - 19} width={92} height={16} rx={8} style={{ fill: "var(--surface)", filter: "drop-shadow(0 1px 2px rgba(0,0,0,.15))" }} />
            <text x={w - padR - 46} y={Y(avg) - 7.5} textAnchor="middle" style={{ fill: "var(--text-2)", fontSize: 10, fontWeight: 700 }}>{avgLabel || "เฉลี่ย"} {fsFmt(avg, avg >= 100 ? 0 : 1)}</text>
          </g>
        )}

        {hb && area && hb.value != null && (
          <g style={{ pointerEvents: "none" }}>
            <line x1={X(hov)} x2={X(hov)} y1={padT - 4} y2={base} style={{ stroke: "var(--text-3)", strokeWidth: 1 }} />
            <circle cx={X(hov)} cy={Y(hb.value)} r={4.5} style={{ fill: "var(--surface)", stroke: sun, strokeWidth: 2.5 }} />
          </g>
        )}
        {hb && hasLoad && hb.load != null && (
          <g style={{ pointerEvents: "none" }}>
            {hb.value == null && <line x1={X(hov)} x2={X(hov)} y1={padT - 4} y2={base} style={{ stroke: "var(--text-3)", strokeWidth: 1 }} />}
            <circle cx={X(hov)} cy={Y(hb.load)} r={4} style={{ fill: "var(--surface)", stroke: "var(--fs-load)", strokeWidth: 2.2 }} />
          </g>
        )}
        {timeMode && (() => {
          /* ขีดชั่วโมงบนแกนเวลา — ระยะห่าง ≥ 60px · ซ่อนขีดที่ชนป้าย "ตอนนี้" */
          const span = (T1 - T0) / 60, ev = [1, 2, 3, 4, 6].find((x) => (plotW / span) * x >= 60) || 6, out = [];
          for (let h = Math.ceil(T0 / 60 / ev) * ev; h * 60 <= T1; h += ev) {
            const x = XT(h * 60);
            if (nowI >= 0 && Math.abs(x - X(nowI)) < 30) continue;
            out.push(<text key={"tk" + h} x={x} y={H - 7} textAnchor="middle" style={{ fill: "var(--text-3)", fontSize: 10 }}>{String(h).padStart(2, "0")}:00</text>);
          }
          if (nowI >= 0) out.push(<text key="tknow" x={X(nowI)} y={H - 7} textAnchor="middle" style={{ fill: sun, fontSize: 10, fontWeight: 800 }}>ตอนนี้</text>);
          return out;
        })()}
        {!timeMode && bars.map((b, i) => {
          const isNow = area && i === nowI;
          if (!isNow && !((i % every === 0) && (n - 1 - i >= every || i === n - 1)) && hov !== i) return null;
          if (!isNow && area && nowI >= 0 && Math.abs(i - nowI) < every && hov !== i) return null;
          return (
            <text key={"l" + b.k} x={X(i)} y={H - 7} textAnchor="middle"
              style={{ fill: isNow ? sun : hov === i ? "var(--text-1)" : "var(--text-3)", fontSize: 10, fontWeight: isNow || hov === i ? 800 : 500 }}>
              {isNow ? "ตอนนี้" : area ? b.label + ":00" : b.label}
            </text>
          );
        })}
        {bars.map((b, i) => {
          /* พื้นที่ชี้ — แกนเวลา = จากกึ่งกลางจุดก่อนหน้าถึงกึ่งกลางจุดถัดไป */
          const x0 = timeMode ? (i ? (X(i - 1) + X(i)) / 2 : padL) : padL + step * i;
          const x1 = timeMode ? (i < bars.length - 1 ? (X(i) + X(i + 1)) / 2 : w - padR) : x0 + step;
          return <rect key={"h" + b.k} x={x0} y={0} width={Math.max(1, x1 - x0)} height={H} style={{ fill: "transparent" }}
            onMouseEnter={() => setHov(i)} onTouchStart={() => setHov(i)} />;
        })}
      </svg>
      {hb && (
        <div style={{ position: "absolute", left: tipX, top: hb.value != null || hb.load != null ? Math.max(0, Y(Math.max(hb.value || 0, hb.load || 0)) - (hasLoad ? 92 : 70)) : 0, transform: "translateX(-50%)", pointerEvents: "none",
          background: "var(--surface)", boxShadow: "var(--shadow-pop)", borderRadius: "var(--r-tile)", padding: "7px 11px", fontSize: 11.5, whiteSpace: "nowrap", zIndex: 3 }}>
          <div style={{ fontWeight: 700, color: "var(--text-2)", marginBottom: 1 }}>{(hb.tip && hb.tip[0]) || hb.label}{hb.partial ? " · ยังไม่จบ" : ""}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-1)", fontFamily: "var(--mono)", fontWeight: 800, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: sun }} />{hasLoad ? "ผลิต " : ""}{hb.value == null ? "ไม่มีข้อมูล" : fsFmt(hb.value, 1) + " " + unit}
          </div>
          {hasLoad && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-1)", fontFamily: "var(--mono)", fontWeight: 800, fontSize: 13 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--fs-load)" }} />ใช้ {hb.load == null ? "ไม่มีข้อมูล" : fsFmt(hb.load, 1) + " " + unit}
            </div>
          )}
          {(hb.tip || []).slice(1).map((t, i) => <div key={i} style={{ color: "var(--text-3)" }}>{t}</div>)}
        </div>
      )}
    </div>
  );
}

/* ── ผลิต/ใช้ ซ้อนกันตรงส่วนใช้เอง ──
   แถบบน = ไฟที่โซลาร์ผลิต [ขายเข้ากริด | ใช้เอง] · แถบล่าง = ไฟที่อาคารใช้ [ใช้เอง | ซื้อจากกริด] · มาตราส่วนเดียวกัน
   imp = null (ไม่มีมิเตอร์ฝั่งซื้อ) = แถบบนอย่างเดียว */
function FsEnergyBalance({ self, exp, imp, compact }) {
  /* สองแถบชิดซ้าย สเกลเดียวกัน — ส่วน "ใช้เอง" (เขียว) อยู่หน้าสุดทั้งสองแถบ ยาวเท่ากันเพราะเป็นไฟก้อนเดียวกัน
     แถบบน = ไฟที่ผลิตไปไหน (ใช้เอง + ขาย) · แถบล่าง = ไฟที่ใช้มาจากไหน (โซลาร์ + ซื้อ) */
  const [ref, w] = useFsWidth(560);
  const s = Math.max(0, self || 0), e = Math.max(0, exp || 0), m = Math.max(0, imp || 0), hasUse = imp != null;
  const pv = s + e, use = s + m, k = w / (Math.max(pv, hasUse ? use : 0) || 1);
  const bh = compact ? 26 : 30, lh = 20, gap = compact ? 14 : 16;
  const y1 = lh, y2 = y1 + bh + gap + lh, H = (hasUse ? y2 : y1) + bh + 2, xs = s * k;
  const E = (v) => fsEnergy(v).join(" ");
  const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) + "%" : "");
  const seg = (key, x0, x1, y, color, label, delay) => {
    const g = 2, a = x0 + (x0 > 0.5 ? g / 2 : 0), ww = Math.max(3, x1 - a - g / 2);
    return (
      <g key={key}>
        <rect x={a} y={y} width={ww} height={bh} rx={Math.min(8, bh / 2)} className="fs-wide" style={{ fill: color, animationDelay: delay + "ms" }} />
        {ww > 34 && <text x={a + 10} y={y + bh / 2 + 4} style={{ fill: "#fff", fontSize: 11.5, fontWeight: 800, pointerEvents: "none" }}>{label}</text>}
      </g>
    );
  };
  const head = (y, label, total, end) => (
    <g>
      <text x={0} y={y - 7} style={{ fill: "var(--text-2)", fontSize: 12, fontWeight: 700 }}>{label}</text>
      <text x={Math.max(end, 150)} y={y - 7} textAnchor="end" style={{ fill: "var(--text-1)", fontSize: 12, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{E(total)}</text>
    </g>
  );
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width={w} height={H} style={{ display: "block", overflow: "visible" }} role="img"
        aria-label={"ผลิต " + E(pv) + " ใช้เอง " + E(s) + " ขาย " + E(e) + (hasUse ? " ใช้ไฟ " + E(use) + " ซื้อ " + E(m) : "")}>
        {head(y1, "ไฟที่โซลาร์ผลิต", pv, pv * k)}
        {seg("s1", 0, xs, y1, "var(--fs-self)", pct(s, pv), 0)}
        {seg("e", xs, pv * k, y1, "var(--fs-exp)", pct(e, pv), 120)}
        {hasUse && (
          <g>
            {xs > 4 && <line x1={xs} x2={xs} y1={y1 - 2} y2={y2 + bh + 2} style={{ stroke: "var(--fs-self)", strokeWidth: 1.5, strokeDasharray: "3 4", opacity: 0.55 }} />}
            {head(y2, "ไฟที่อาคารใช้", use, use * k)}
            {seg("s2", 0, xs, y2, "var(--fs-self)", pct(s, use), 240)}
            {seg("m", xs, use * k, y2, "var(--fs-imp)", pct(m, use), 360)}
          </g>
        )}
      </svg>
    </div>
  );
}

Object.assign(window, { FsTrendChart, FsEnergyBalance, fsMonoPath });
