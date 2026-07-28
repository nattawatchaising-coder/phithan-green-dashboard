/* ============================================================
   PHITHAN GREEN — เวิร์กสเปซ "ออกแบบระบบ & ผลผลิต 15 ปี"
   เปิดจากโหมดวางแผง 3D · ใช้ทิศ/มุมของแผงจริงจากโมเดล
   คำนวณทั้งหมดอยู่ใน solarcalc.jsx (ไฟล์นี้เป็น UI ล้วน)
   ============================================================ */
const SU_CSS = `
.su{position:fixed;inset:0;z-index:130;background:var(--bg);display:flex;flex-direction:column}
.su-body{flex:1;min-height:0;display:flex}
.su-rail{width:212px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);
  padding:16px 12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto}
.su-main{flex:1;min-width:0;overflow-y:auto;padding:20px 22px 26px;background:var(--bg)}
.su-wrap{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:16px}

/* ---- ขั้นตอนด้านซ้าย ---- */
.su-step{display:flex;gap:10px;align-items:flex-start;padding:10px 10px;border-radius:12px;border:none;
  background:transparent;text-align:left;width:100%;transition:background .15s ease}
.su-step:hover{background:var(--surface2)}
.su-step[data-on="1"]{background:var(--acs)}
.su-step .no{width:21px;height:21px;border-radius:99px;flex:0 0 auto;display:grid;place-items:center;
  font-size:10.5px;font-weight:800;background:var(--surface3);color:var(--text-3);margin-top:1px}
.su-step[data-on="1"] .no{background:var(--ac);color:#fff}
.su-step[data-done="1"] .no{background:var(--acs);color:var(--acd)}
.su-step .tt{font-size:12.5px;font-weight:700;color:var(--text-1);line-height:1.35}
.su-step[data-on="1"] .tt{color:var(--acd)}
.su-step .sb{font-size:10.5px;color:var(--text-3);line-height:1.45;margin-top:2px;
  overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}

/* ---- แถบสรุปล่าง ---- */
.su-foot{flex-shrink:0;border-top:1px solid var(--border);background:var(--surface);
  padding:10px 18px calc(10px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:0}
.su-kpi{display:flex;flex-direction:column;gap:2px;padding:0 16px;border-left:1px solid var(--ln);min-width:0}
.su-kpi:first-child{border-left:none;padding-left:0}
.su-kpi .k{font-size:9.5px;font-weight:700;color:var(--text-3);white-space:nowrap}
.su-kpi .v{font-size:15px;font-weight:800;color:var(--text-1);letter-spacing:-.3px;white-space:nowrap}
.su-kpi .v small{font-size:10px;font-weight:700;color:var(--text-3);margin-left:2px}

/* ---- การ์ดเลือกโหมด ---- */
.su-pick{display:flex;gap:10px}
.su-pick button{flex:1;display:flex;flex-direction:column;gap:7px;align-items:flex-start;padding:13px 14px;
  border-radius:14px;border:1.5px solid var(--ln2);background:var(--surface);text-align:left;transition:all .15s ease}
.su-pick button:hover{border-color:var(--text-3)}
.su-pick button[data-on="1"]{border-color:var(--ac);background:var(--acs);box-shadow:0 0 0 3px var(--acs)}
.su-pick .h{font-size:13px;font-weight:800;color:var(--text-1)}
.su-pick button[data-on="1"] .h{color:var(--acd)}
.su-pick .d{font-size:10.5px;color:var(--text-3);line-height:1.55}

/* ---- ตาราง ---- */
.su-tb{width:100%;border-collapse:collapse;font-size:11.5px}
.su-tb th{text-align:left;font-size:9.5px;font-weight:800;color:var(--text-3);padding:0 8px 6px;white-space:nowrap}
.su-tb td{padding:6px 8px;border-top:1px solid var(--ln);color:var(--text-2);font-variant-numeric:tabular-nums}
.su-tb tr[data-on="1"] td{background:var(--acs)}
.su-tb td b{color:var(--text-1);font-weight:800}
.su-scroll{overflow-x:auto;margin:0 -2px;padding:0 2px}
/* ปุ่มสลับแบบยาว (ข้อความล้วน) — เวอร์ชันเดิมออกแบบไว้ให้ไอคอนซ้อนข้อความ เลยแคบไป */
.su .p3-seg.wide{gap:3px}
.su .p3-seg.wide button{flex-direction:row;padding:6px 16px;font-size:10.5px;white-space:nowrap;min-width:74px;justify-content:center}
/* ตารางที่กดเลือกแถวได้ */
.su-pick-row tbody tr{cursor:pointer;transition:background .12s ease}
.su-pick-row tbody tr:hover td{background:var(--surface2)}
.su-pick-row tbody tr[data-on="1"] td{background:var(--acs)}
.su-pick-row tbody tr[data-on="1"] td:first-child{box-shadow:inset 2px 0 0 var(--ac)}

/* ---- ป้ายที่มาของค่า ---- */
.su-src{font-size:8.5px;font-weight:800;padding:2px 6px;border-radius:99px;letter-spacing:.02em;white-space:nowrap}
.su-src.stock{background:var(--acs);color:var(--acd)}
.su-src.def{background:var(--surface3);color:var(--text-3)}
.su-src.edit{background:rgba(37,99,235,.12);color:#1D4ED8}

/* ---- จอแคบ: ขั้นตอนย้ายมาเป็นแถบนอนด้านบน ---- */
@media (max-width:820px){
  .su-body{flex-direction:column}
  .su-rail{width:100%;flex-direction:row;gap:6px;overflow-x:auto;padding:10px 12px;border-right:none;border-bottom:1px solid var(--border)}
  .su-rail>.p3-eb,.su-rail>div:last-child{display:none}
  .su-step{width:auto;flex:1 0 auto;min-width:132px;padding:8px 10px}
  .su-main{padding:14px 13px 20px}
  .su-pick{flex-direction:column}
  .su-foot{overflow-x:auto;gap:0;padding:9px 12px}
  .su-kpi{padding:0 11px}
}

.su-bar{height:8px;border-radius:99px;background:var(--surface3);overflow:hidden}
.su-bar span{display:block;height:100%;border-radius:99px;transition:width .3s ease}
.su-alert{display:flex;gap:8px;align-items:flex-start;font-size:11.5px;line-height:1.6;border-radius:11px;padding:9px 11px}
.su-alert.warn{background:rgba(245,158,11,.11);border:1px solid rgba(180,83,9,.22);color:#8A4408}
.su-alert.bad{background:rgba(185,28,28,.08);border:1px solid rgba(185,28,28,.24);color:#991B1B}
.su-alert.good{background:var(--acs);border:1px solid transparent;color:var(--acd)}
.su-alert.info{background:rgba(37,99,235,.07);border:1px solid rgba(37,99,235,.18);color:#1D4ED8}
`;

/* กล่องกรอกเลขพร้อมป้ายบอกที่มาของค่า (คลัง / ค่ากลาง / แก้เอง) */
function SuSpec({ label, value, src, suffix, step, onChange, onReset }) {
  return (
    <label className="p3-f">
      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <span className={"su-src " + src} style={{ marginLeft: "auto" }}>{src === "stock" ? "คลัง" : src === "edit" ? "แก้เอง" : "ค่ากลาง"}</span>
        {src === "edit" && <button className="p3-lnk" style={{ fontSize: 9.5 }} onClick={(e) => { e.preventDefault(); onReset(); }}>คืนค่า</button>}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <input className="p3-inp" type="number" step={step || 0.01} value={value == null ? "" : value}
          onChange={(e) => onChange(e.target.value === "" ? null : +e.target.value)} />
        {suffix && <span className="p3-sfx">{suffix}</span>}
      </span>
    </label>
  );
}

/* เข็มทิศเล็ก + มุมเอียง — บอกทิศทางของกลุ่มแผงแบบเห็นภาพ */
function SuFacing({ tilt, az, size }) {
  const s = size || 46, r = s / 2 - 3;
  const a = (az - 90) * Math.PI / 180;
  return (
    <svg width={s} height={s} viewBox={"0 0 " + s + " " + s} style={{ display: "block", flex: "0 0 auto" }}>
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="var(--ln2)" strokeWidth="1" />
      <text x={s / 2} y="8" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--text-3)">N</text>
      <line x1={s / 2} y1={s / 2} x2={s / 2 + Math.cos(a) * r * 0.82} y2={s / 2 + Math.sin(a) * r * 0.82}
        stroke="var(--ac)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx={s / 2} cy={s / 2} r="2.4" fill="var(--ac)" />
      <text x={s / 2} y={s - 1} textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--text-2)">{Math.round(tilt)}°</text>
    </svg>
  );
}

/* ── แถบแรงดัน: ให้เห็นด้วยตาว่าสตริงยาวเท่านี้ "ตกอยู่ในช่วงทำงาน" หรือหลุด ── */
function SuVoltBand({ rows, inv, sel, onPick }) {
  const vmin = scNum(inv.mpptVmin), vmax = scNum(inv.mpptVmax), vdc = scNum(inv.maxVdc);
  const top = Math.max(vdc, vmax) * 1.06 || 1;
  const px = (v) => Math.max(0, Math.min(100, v / top * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {/* สเกลบนสุด */}
      <div style={{ position: "relative", height: 15, fontSize: 9, color: "var(--text-3)", fontWeight: 700 }}>
        <span style={{ position: "absolute", left: px(vmin) + "%", transform: "translateX(-50%)" }}>{vmin}V</span>
        <span style={{ position: "absolute", left: px(vmax) + "%", transform: "translateX(-50%)" }}>{vmax}V</span>
        {vdc ? <span style={{ position: "absolute", left: px(vdc) + "%", transform: "translateX(-50%)", color: "#B91C1C" }}>{vdc}V</span> : null}
      </div>
      {rows.map((r) => {
        const lo = px(r.vmpHot), hi = px(r.vmpCold);
        const on = sel === r.n;
        return (
          <button key={r.n} onClick={() => onPick && onPick(r.n)} title={r.ok ? "แรงดันทำงาน " + r.vmpHot + "–" + r.vmpCold + " V · Voc เย็น " + r.vocCold + " V" : r.fails.join(" · ")}
            style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid " + (on ? "var(--ac)" : "transparent"),
              background: on ? "var(--acs)" : "transparent", borderRadius: 10, padding: "5px 7px", width: "100%", textAlign: "left" }}>
            <span style={{ width: 30, fontSize: 11.5, fontWeight: 800, color: r.ok ? "var(--text-1)" : "var(--text-3)", flex: "0 0 auto" }}>{r.n}</span>
            <span style={{ position: "relative", flex: 1, height: 18, borderRadius: 6, background: "var(--surface2)", overflow: "hidden" }}>
              {/* ช่วงทำงาน MPPT = พื้นเขียวจาง */}
              <span style={{ position: "absolute", left: px(vmin) + "%", width: (px(vmax) - px(vmin)) + "%", top: 0, bottom: 0, background: "rgba(34,163,91,.14)" }} />
              {vdc ? <span style={{ position: "absolute", left: px(vdc) + "%", top: 0, bottom: 0, width: 2, background: "#B91C1C" }} /> : null}
              {/* ช่วงแรงดันจริงของสตริงนี้ ร้อน→เย็น */}
              <span style={{ position: "absolute", left: lo + "%", width: Math.max(1.5, hi - lo) + "%", top: 4, height: 10, borderRadius: 99,
                background: r.ok ? "linear-gradient(90deg,#F59E0B,#22A35B)" : "#B91C1C", opacity: r.ok ? 1 : .55 }} />
              {/* Voc ตอนอากาศเย็น = ขีดที่ห้ามเลยเส้นแดง */}
              <span style={{ position: "absolute", left: px(r.vocCold) + "%", top: 1, bottom: 1, width: 2, background: r.vocCold > vdc && vdc ? "#B91C1C" : "var(--text-3)" }} />
            </span>
            <span style={{ width: 54, textAlign: "right", fontSize: 10, fontWeight: 800, flex: "0 0 auto",
              color: r.ok ? (r.score >= 75 ? "var(--acd)" : "var(--text-2)") : "#B91C1C" }}>{r.ok ? r.band : "ไม่ผ่าน"}</span>
          </button>
        );
      })}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", paddingLeft: 39 }}>
        <span><b style={{ color: "#F59E0B" }}>■</b> แผงร้อน (แรงดันต่ำสุด)</span>
        <span><b style={{ color: "#22A35B" }}>■</b> อากาศเย็น (แรงดันสูงสุด)</span>
        <span><b style={{ color: "#B91C1C" }}>│</b> เพดาน Voc</span>
      </div>
    </div>
  );
}

/* สีประจำสตริง — ไล่โทนให้แยกออกจากกันชัดแม้อยู่ติดกัน */
const SU_SCOLOR = ["#22A35B", "#2563EB", "#D97706", "#7C3AED", "#DC2626", "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#4F46E5"];
const suColor = (i) => SU_SCOLOR[(i - 1 + SU_SCOLOR.length) % SU_SCOLOR.length];

/* ── ผังแผง 2D (มองจากด้านบน) — แตะ/ลากเพื่อจัดแผงเข้าสตริง ──
   foot = ผลจาก p3FootAll(st) · assign = { uid: หมายเลขสตริง } */
function SuLayout2D({ foot, assign, active, onPaint, height }) {
  const wrapRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const b = foot.bounds;
  const pad = 1.2;
  const W = (b.maxX - b.minX) + pad * 2, H = (b.maxZ - b.minZ) + pad * 2;
  const vb = (b.minX - pad) + " " + (b.minZ - pad) + " " + Math.max(1, W) + " " + Math.max(1, H);
  /* ลากผ่านแผงไหนก็ทาแผงนั้น — ใช้ elementFromPoint เพื่อให้ลากยาว ๆ ได้ลื่น ไม่ต้องแตะทีละแผง */
  const paintAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.dataset && el.dataset.uid) onPaint(el.dataset.uid);
  };
  return (
    <div ref={wrapRef} style={{ position: "relative", borderRadius: 12, border: "1px solid var(--ln)", background: "var(--surface2)", overflow: "hidden", touchAction: "none" }}>
      <svg viewBox={vb} style={{ width: "100%", height: height || 340, display: "block", cursor: active ? "crosshair" : "default" }}
        onPointerDown={(e) => { if (!active) return;
          /* จับ pointer ไว้เพื่อให้ลากออกนอก svg แล้วยังทาต่อได้ — บางเบราว์เซอร์โยน error ถ้า pointer ไม่ active */
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
          setDrag(true); paintAt(e); }}
        onPointerMove={(e) => { if (drag && active) paintAt(e); }}
        onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)}>
        {/* เส้นขอบผืนหลังคา */}
        {foot.outlines.map((o, i) => (
          <polygon key={i} points={o.pts.map((p) => p[0] + "," + p[1]).join(" ")}
            fill="rgba(148,163,184,.10)" stroke="var(--ln2)" strokeWidth="0.08" />
        ))}
        {/* แผง */}
        {foot.panels.map((p) => {
          const s = assign[p.uid] || 0;
          const c = s ? suColor(s) : null;
          return (
            <polygon key={p.uid} data-uid={p.uid} points={p.pts.map((q) => q[0] + "," + q[1]).join(" ")}
              fill={c ? c : "#CBD5E1"} fillOpacity={c ? 0.88 : 0.5}
              stroke={c ? "#fff" : "#94A3B8"} strokeWidth="0.035" strokeDasharray={c ? null : "0.12 0.09"}
              style={{ cursor: active ? "crosshair" : "pointer" }}>
              <title>{p.roofName + " · " + p.key + (s ? " · สตริง " + s : " · ยังไม่อยู่สตริงไหน")}</title>
            </polygon>
          );
        })}
        {/* เข็มทิศ: บนจอ +Z = ทิศใต้ ตามฉาก 3 มิติ */}
        <g transform={"translate(" + (b.minX - pad + 0.7) + "," + (b.minZ - pad + 0.7) + ")"}>
          <line x1="0" y1="0" x2="0" y2="1.1" stroke="#B91C1C" strokeWidth="0.09" />
          <text x="0" y="-0.15" fontSize="0.62" fontWeight="800" fill="#B91C1C" textAnchor="middle">N</text>
        </g>
      </svg>
    </div>
  );
}

/* ── กราฟแท่งรายเดือน ── */
function SuMonthly({ data }) {
  const max = Math.max.apply(null, data.concat([1]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 128 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 8.5, fontWeight: 800, color: "var(--text-3)" }}>{Math.round(v / 100) / 10}k</span>
          <div title={SC_MON[i] + " · " + v.toLocaleString() + " kWh"}
            style={{ width: "100%", height: Math.max(2, v / max * 88), borderRadius: "5px 5px 2px 2px",
              background: "linear-gradient(180deg,#3DBE74,#1E8A4C)" }} />
          <span style={{ fontSize: 8.5, color: "var(--text-3)", fontWeight: 700 }}>{SC_MON[i].replace(".", "")}</span>
        </div>
      ))}
    </div>
  );
}

/* ── กราฟผลผลิตสะสม/รายปี 15 ปี (พื้นที่ + เส้นเสื่อม) ── */
function SuLifeChart({ rows }) {
  const W = 560, H = 132, pad = 4;
  const max = Math.max.apply(null, rows.map((r) => r.kwh));
  const x = (i) => pad + i / Math.max(1, rows.length - 1) * (W - pad * 2);
  const y = (v) => H - 18 - (v / max) * (H - 34);
  const line = rows.map((r, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(r.kwh).toFixed(1)).join(" ");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="suFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22A35B" stopOpacity=".28" /><stop offset="100%" stopColor="#22A35B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={line + " L" + x(rows.length - 1) + " " + (H - 18) + " L" + x(0) + " " + (H - 18) + " Z"} fill="url(#suFill)" />
      <path d={line} fill="none" stroke="#22A35B" strokeWidth="2" strokeLinejoin="round" />
      {rows.map((r, i) => (i % 2 === 0 || i === rows.length - 1) && (
        <g key={i}>
          <circle cx={x(i)} cy={y(r.kwh)} r="2.6" fill="#fff" stroke="#22A35B" strokeWidth="1.6" />
          <text x={x(i)} y={H - 5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--text-3)">ปี {r.year}</text>
        </g>
      ))}
    </svg>
  );
}

/* ตัวช่วยลากเลื่อนเวลาบนกราฟรายวัน — ใช้ร่วมกันทั้งกราฟแสงและกราฟกำลังไฟ
   (เก็บ element ไว้ก่อน เพราะ React เคลียร์ currentTarget ทิ้งหลังจบ handler) */
function suScrub(geo, onHour) {
  if (!onHour) return null;
  return (e) => {
    const el = e.currentTarget;
    const pick = (cx) => {
      const b = el.getBoundingClientRect();
      const f = (cx - b.left) / b.width * geo.W;
      onHour(scClamp(geo.h0 + (f - geo.L) / (geo.W - geo.L - geo.R) * (geo.h1 - geo.h0), geo.h0, geo.h1));
    };
    pick(e.clientX);
    const move = (ev) => pick(ev.clientX);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
}

/* ── กราฟความเข้มแสงตลอดวัน ──
   เส้นเทา = แสงบนพื้นราบ · พื้นเขียว = แสงที่ตกบนหน้าแผงจริงหลังหักเงา
   แถบลายทแยง = ส่วนที่เงาบังกินไป (เห็นชัดว่าตึก/ต้นไม้บังช่วงไหนของวัน) */
function SuDayLight({ sim, groups, hour, onHour }) {
  const W = 660, H = 254, L = 44, R = 14, T = 20, B = 30;
  if (!sim || !sim.rows.length) return null;
  const top = Math.max(200, sim.maxGhi, sim.maxPoa) * 1.1;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = (h) => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Y = (v) => H - B - v / top * (H - T - B);
  const path = (f) => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Y(f(r)).toFixed(1)).join(" ");
  const area = (f) => path(f) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Y(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Y(0) + " Z";
  const cur = sim.rows.reduce((a, r) => (Math.abs(r.h - hour) < Math.abs(a.h - hour) ? r : a), sim.rows[0]);
  const ticks = [];
  for (let h = Math.ceil(h0); h <= h1; h++) if (h % 2 === 0) ticks.push(h);
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible", cursor: onHour ? "col-resize" : "default" }}
        onPointerDown={suScrub({ W, L, R, h0, h1 }, onHour)}>
        <defs>
          <linearGradient id="suPoaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22A35B" stopOpacity=".30" /><stop offset="100%" stopColor="#22A35B" stopOpacity=".02" />
          </linearGradient>
          <pattern id="suShadeHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(71,85,105,.20)" /><line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="2" opacity=".55" />
          </pattern>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, k) => (
          <g key={k}>
            <line x1={L} y1={Y(top * f)} x2={W - R} y2={Y(top * f)} stroke="var(--ln)" strokeWidth="1" strokeDasharray={f ? "3 4" : null} />
            <text x={L - 7} y={Y(top * f) + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{Math.round(top * f)}</text>
          </g>
        ))}
        {ticks.map((h) => (
          <text key={h} x={X(h)} y={H - B + 14} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{h}:00</text>
        ))}
        <text x={L - 7} y={9} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">W/m²</text>
        {/* ส่วนที่เงากิน = ระหว่างเส้น POA เต็ม กับ POA หลังหักเงา */}
        {sim.shadeFrom != null && (
          <path d={path((r) => r.poaAvg) + " " + sim.rows.slice().reverse().map((r, i) =>
            (i ? "L" : "L") + X(r.h).toFixed(1) + " " + Y(r.per && groups.length ? poaNetAvg(r, groups) : 0).toFixed(1)).join(" ") + " Z"}
            fill="url(#suShadeHatch)" />
        )}
        <path d={area((r) => (groups.length ? poaNetAvg(r, groups) : 0))} fill="url(#suPoaFill)" />
        <path d={path((r) => r.ghi)} fill="none" stroke="var(--text-3)" strokeWidth="1.4" strokeDasharray="5 4" />
        <path d={path((r) => r.poaAvg)} fill="none" stroke="#22A35B" strokeWidth="1.3" opacity=".45" />
        <path d={path((r) => (groups.length ? poaNetAvg(r, groups) : 0))} fill="none" stroke="#22A35B" strokeWidth="2.3" strokeLinejoin="round" />
        {/* เส้นเวลาปัจจุบัน */}
        <line x1={X(cur.h)} y1={T} x2={X(cur.h)} y2={H - B} stroke="var(--ac)" strokeWidth="1.6" />
        <circle cx={X(cur.h)} cy={Y(groups.length ? poaNetAvg(cur, groups) : 0)} r="4.5" fill="#fff" stroke="var(--ac)" strokeWidth="2.2" />
        <g transform={"translate(" + scClamp(X(cur.h), L + 4, W - R - 96) + "," + (T + 2) + ")"}>
          <rect width="94" height="17" rx="5" fill="var(--ac)" />
          <text x="47" y="12" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
            {ivHM(cur.h)} · {Math.round(groups.length ? poaNetAvg(cur, groups) : 0)} W/m²
          </text>
        </g>
      </svg>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700, paddingLeft: 44 }}>
        <span><b style={{ color: "var(--text-3)" }}>┅</b> แสงบนพื้นราบ</span>
        <span><b style={{ color: "#22A35B" }}>━</b> แสงบนหน้าแผงจริง (หลังหักเงา)</span>
        {sim.shadeFrom != null && <span><b style={{ color: "#475569" }}>▨</b> ส่วนที่เงาบังกินไป</span>}
      </div>
    </div>
  );
}
/* แสงบนหน้าแผงหลังหักเงา เฉลี่ยถ่วงน้ำหนักด้วยจำนวนแผงของแต่ละกลุ่ม */
function poaNetAvg(row, groups) {
  let s = 0, n = 0;
  groups.forEach((g) => { const p = row.per[g.key]; if (p) { s += p.poaNet * g.count; n += g.count; } });
  return n ? s / n : 0;
}

/* ── กำลังไฟ + อุณหภูมิเซลล์ ตลอดวัน ── */
function SuDayPower({ sim, groups, acKw, hour, onHour }) {
  const W = 660, H = 214, L = 42, R = 42, T = 36, B = 28;
  if (!sim || !sim.rows.length) return null;
  const pTop = Math.max(1, sim.rows.reduce((a, r) => Math.max(a, r.dc), 0)) * 1.12;
  const tTop = 90;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = (h) => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Yp = (v) => H - B - v / pTop * (H - T - B);
  const Yt = (v) => H - B - v / tTop * (H - T - B);
  const line = (f, Yf) => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Yf(f(r)).toFixed(1)).join(" ");
  const tOf = (r) => { let s = 0, n = 0; groups.forEach((g) => { const p = r.per[g.key]; if (p) { s += p.tCell * g.count; n += g.count; } }); return n ? s / n : 0; };
  const cur = sim.rows.reduce((a, r) => (Math.abs(r.h - hour) < Math.abs(a.h - hour) ? r : a), sim.rows[0]);
  return (
    <svg viewBox={"0 0 " + W + " " + H} onPointerDown={suScrub({ W, L, R, h0, h1 }, onHour)}
      style={{ width: "100%", display: "block", overflow: "visible", cursor: onHour ? "col-resize" : "default" }}>
      {[0, 0.5, 1].map((f, k) => (
        <g key={k}>
          <line x1={L} y1={Yp(pTop * f)} x2={W - R} y2={Yp(pTop * f)} stroke="var(--ln)" strokeWidth="1" strokeDasharray={f ? "3 4" : null} />
          <text x={L - 6} y={Yp(pTop * f) + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(pTop * f, 1)}</text>
          <text x={W - R + 6} y={Yt(tTop * f) + 3.5} fontSize="9" fontWeight="700" fill="#DC2626">{Math.round(tTop * f)}</text>
        </g>
      ))}
      <text x={L - 6} y={9} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">kW</text>
      <text x={W - R + 6} y={9} fontSize="8.5" fontWeight="800" fill="#DC2626">°C</text>
      {/* เพดานอินเวอร์เตอร์ */}
      {acKw > 0 && acKw < pTop && (
        <g>
          <line x1={L} y1={Yp(acKw)} x2={W - R} y2={Yp(acKw)} stroke="#B45309" strokeWidth="1.4" strokeDasharray="5 3" />
          <text x={W - R - 2} y={Yp(acKw) - 4} textAnchor="end" fontSize="9" fontWeight="800" fill="#B45309">เพดานอินเวอร์เตอร์ {acKw} kW</text>
        </g>
      )}
      <path d={line((r) => r.dc, Yp) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Yp(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Yp(0) + " Z"}
        fill="rgba(34,163,91,.14)" />
      <path d={line((r) => r.dc, Yp)} fill="none" stroke="#22A35B" strokeWidth="1.4" strokeDasharray="4 3" />
      <path d={line((r) => r.ac, Yp)} fill="none" stroke="#0F7A43" strokeWidth="2.3" strokeLinejoin="round" />
      <path d={line(tOf, Yt)} fill="none" stroke="#DC2626" strokeWidth="1.7" strokeLinejoin="round" opacity=".85" />
      {/* จุดสูงสุดของแต่ละเส้น พร้อมตัวเลข */}
      {(() => {
        const pk = sim.rows.reduce((a, r) => (r.ac > a.ac ? r : a), sim.rows[0]);
        const tk = sim.rows.reduce((a, r) => (tOf(r) > tOf(a) ? r : a), sim.rows[0]);
        /* ถ้าจุดสูงสุดอยู่ตรงกับเวลาที่กำลังดูอยู่ ไม่ต้องเขียนซ้ำ (กล่องค่าปัจจุบันบอกอยู่แล้ว) */
        const farP = Math.abs(pk.h - cur.h) > 0.9, farT = Math.abs(tk.h - cur.h) > 0.9;
        return (
          <React.Fragment>
            <circle cx={X(pk.h)} cy={Yp(pk.ac)} r="3.2" fill="#fff" stroke="#0F7A43" strokeWidth="1.8" />
            {farP && (
              <text x={scClamp(X(pk.h), L + 34, W - R - 34)} y={Yp(pk.ac) - 7} textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#0F7A43">
                สูงสุด {scR(pk.ac, 2)} kW
              </text>
            )}
            <circle cx={X(tk.h)} cy={Yt(tOf(tk))} r="3" fill="#fff" stroke="#DC2626" strokeWidth="1.6" />
            {farT && (
              <text x={scClamp(X(tk.h), L + 30, W - R - 30)} y={Yt(tOf(tk)) - 6} textAnchor="middle" fontSize="9" fontWeight="800" fill="#DC2626">
                ร้อนสุด {scR(tOf(tk), 0)}°C
              </text>
            )}
          </React.Fragment>
        );
      })()}
      {/* ค่าที่เวลาปัจจุบัน */}
      <line x1={X(cur.h)} y1={T} x2={X(cur.h)} y2={H - B} stroke="var(--ac)" strokeWidth="1.4" />
      <circle cx={X(cur.h)} cy={Yp(cur.ac)} r="4" fill="#fff" stroke="var(--ac)" strokeWidth="2" />
      <circle cx={X(cur.h)} cy={Yt(tOf(cur))} r="3.4" fill="#fff" stroke="#DC2626" strokeWidth="1.8" />
      <g transform={"translate(" + scClamp(X(cur.h) + 7, L, W - R - 104) + "," + (T + 1) + ")"}>
        <rect width="102" height="30" rx="6" fill="var(--surface)" stroke="var(--ln2)" />
        <text x="7" y="13" fontSize="9.5" fontWeight="800" fill="var(--text-2)">{ivHM(cur.h)}</text>
        <text x="95" y="13" textAnchor="end" fontSize="9.5" fontWeight="800" fill="#0F7A43">{scR(cur.ac, 2)} kW</text>
        <text x="7" y="25" fontSize="9" fontWeight="700" fill="var(--text-3)">DC {scR(cur.dc, 2)}</text>
        <text x="95" y="25" textAnchor="end" fontSize="9" fontWeight="800" fill="#DC2626">เซลล์ {scR(tOf(cur), 0)}°C</text>
      </g>
      {[6, 9, 12, 15, 18].filter((h) => h >= h0 && h <= h1).map((h) => (
        <text key={h} x={X(h)} y={H - B + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{h}:00</text>
      ))}
    </svg>
  );
}

/* ── แผนที่ทั้งปี: เดือน × ชั่วโมง ──
   โหมด "แสง" = ความเข้มแสงบนหน้าแผงจริง · โหมด "เงา" = โดนบังกี่ % ณ ชั่วโมงนั้น
   อ่านได้ทันทีว่าเงามาช่วงไหนของวัน เดือนไหนของปี */
function SuYearMap({ year, mode, month, onMonth }) {
  if (!year || !year.months.length) return null;
  const hrs = year.hours;
  const colLight = (v) => {
    if (v <= 2) return "var(--surface3)";
    const t = scClamp(v / Math.max(1, year.maxPoa), 0, 1);
    /* ไล่จาก ฟ้าอ่อน → เขียว → เหลือง → ส้ม ตามความแรง */
    const stops = [[219, 234, 254], [134, 211, 180], [74, 179, 122], [250, 204, 21], [245, 158, 11]];
    const f = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(f)), k = f - i;
    const c = [0, 1, 2].map((j) => Math.round(stops[i][j] + (stops[i + 1][j] - stops[i][j]) * k));
    return "rgb(" + c.join(",") + ")";
  };
  const colShade = (v, poa) => {
    if (poa <= 2) return "var(--surface3)";
    if (v <= 0.5) return "#E8F5ED";
    return v < 15 ? "#FDE68A" : v < 40 ? "#F59E0B" : "#DC2626";
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 34 }}>
        {hrs.map((h) => (
          <span key={h} style={{ flex: 1, fontSize: 8, fontWeight: 700, color: "var(--text-3)", textAlign: "center", minWidth: 0 }}>
            {h % 2 === 0 ? h : ""}
          </span>
        ))}
      </div>
      {year.months.map((mo) => (
        <div key={mo.m} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => onMonth && onMonth(mo)} title={mo.label + " · " + mo.dayKwh + " kWh/วัน · เงา " + mo.shadeLossPct + "%"}
            style={{ width: 34, flex: "0 0 auto", fontSize: 9.5, fontWeight: 800, textAlign: "right", border: "none", background: "none",
              color: month === mo.m ? "var(--acd)" : "var(--text-3)", cursor: "pointer", padding: 0 }}>
            {mo.label.replace(".", "")}
          </button>
          <span style={{ display: "flex", flex: 1, gap: 1, height: 15, borderRadius: 4, overflow: "hidden",
            outline: month === mo.m ? "1.5px solid var(--ac)" : "none", outlineOffset: 1 }}>
            {mo.cells.map((c, i) => (
              <span key={i} title={mo.label + " " + ivHM(c.h) + " · แสง " + c.poa + " W/m²" + (c.shade > 0.5 ? " · เงาบัง " + c.shade + "%" : "")}
                style={{ flex: 1, background: mode === "shade" ? colShade(c.shade, c.poa) : colLight(c.poa) }} />
            ))}
          </span>
          <span style={{ width: 54, flex: "0 0 auto", fontSize: 9.5, fontWeight: 700, textAlign: "right",
            color: mode === "shade" ? (mo.shadeLossPct >= 5 ? "#B91C1C" : mo.shadeLossPct > 0 ? "#B45309" : "var(--text-3)") : "var(--text-2)" }}>
            {mode === "shade" ? mo.shadeLossPct + "%" : Math.round(mo.monthKwh / 100) / 10 + "k"}
          </span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 40, marginTop: 3, fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
        {mode === "shade" ? (
          <React.Fragment>
            <span><b style={{ color: "#E8F5ED" }}>■</b> ไม่มีเงา</span>
            <span><b style={{ color: "#FDE68A" }}>■</b> บังบางส่วน</span>
            <span><b style={{ color: "#F59E0B" }}>■</b> บังมาก</span>
            <span><b style={{ color: "#DC2626" }}>■</b> บังเกือบหมด</span>
            <span style={{ marginLeft: "auto" }}>ขวาสุด = เสียไปกี่ % ของเดือนนั้น</span>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <span>อ่อน = แดดน้อย</span>
            <span><b style={{ color: "#4AB37A" }}>■</b> ปานกลาง</span>
            <span><b style={{ color: "#F59E0B" }}>■</b> แรงสุด {year.maxPoa} W/m²</span>
            <span style={{ marginLeft: "auto" }}>ขวาสุด = ผลผลิตทั้งเดือน (kWh)</span>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* ── แถบเงารายชั่วโมง: สตริงไหนโดนบังตอนไหนของวัน ── */
function SuShadeStrip({ sim, groups }) {
  if (!sim || !sim.rows.length) return null;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const col = (v) => (v <= 0.5 ? "var(--surface3)" : v < 15 ? "#FDE68A" : v < 40 ? "#F59E0B" : "#DC2626");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {groups.map((g) => (
        <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 118, flex: "0 0 auto", fontSize: 10, fontWeight: 700, color: "var(--text-2)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            title={g.label}>{g.roofName}{g.side ? " · " + g.side : ""}</span>
          <span style={{ display: "flex", flex: 1, height: 15, borderRadius: 5, overflow: "hidden", gap: 1 }}>
            {sim.rows.map((r, i) => {
              const v = r.per[g.key] ? r.per[g.key].shade : 0;
              return <span key={i} title={ivHM(r.h) + " · เงาบัง " + v + "%"} style={{ flex: 1, background: col(v) }} />;
            })}
          </span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 127, fontSize: 9, color: "var(--text-3)", fontWeight: 700 }}>
        <span>{ivHM(h0)}</span><span>เที่ยง</span><span>{ivHM(h1)}</span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingLeft: 127, fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
        <span><b style={{ color: "#E5E9E6" }}>■</b> ไม่มีเงา</span>
        <span><b style={{ color: "#FDE68A" }}>■</b> บังบางส่วน</span>
        <span><b style={{ color: "#F59E0B" }}>■</b> บังมาก</span>
        <span><b style={{ color: "#DC2626" }}>■</b> บังเกือบหมด</span>
      </div>
    </div>
  );
}

/* ── กราฟเส้น I-V + P-V ──
   exp = เส้นที่ควรได้ ณ สภาพอากาศตอนวัด · stcRef = เส้นเดียวกันแต่ที่มาตรฐาน STC
   meas = ค่าที่วัดได้จริง (แต้มจุด ไม่ลากเส้น เพราะเครื่องวัดส่วนใหญ่รายงานแค่ 5 ค่า) */
/* curves = [{ id, name, curve, color }] · focusId = ดูสตริงเดียว (null = รวมทุกสตริง)
   โหมดรวม: วาดทุกเส้นแยกสี ไม่มีเส้นกำลัง/พื้นระบาย เพื่อไม่ให้ลายตา
   โหมดเดี่ยว: ใส่พื้นระบาย เส้นกำลัง และจุด MPP พร้อมตัวเลขเต็ม */
function SuIvChart({ curves, stcRef, meas, height, focusId }) {
  const W = 620, H = 292, L = 46, R = 48, T = 16, B = 32;
  const list = (curves || []).filter((x) => x && x.curve);
  if (!list.length) return null;
  const solo = focusId != null ? list.find((x) => x.id === focusId) : null;
  const exp = solo ? solo.curve : list[0].curve;
  const mx = (f) => list.reduce((a, x) => Math.max(a, f(x.curve)), 0);
  const vTop = Math.max(mx((c) => c.voc), stcRef ? stcRef.voc : 0, meas && meas.voc ? meas.voc : 0) * 1.07;
  const iTop = Math.max(mx((c) => c.isc), stcRef ? stcRef.isc : 0, meas && meas.isc ? meas.isc : 0) * 1.16;
  const pTop = Math.max(mx((c) => c.pmax), stcRef ? stcRef.pmax : 0, meas && meas.pmax ? meas.pmax : 0) * 1.16;
  const X = (v) => L + v / vTop * (W - L - R);
  const Yi = (i) => H - B - i / iTop * (H - T - B);
  const Yp = (p) => H - B - p / pTop * (H - T - B);
  const path = (pts, fy, fv) => pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  const ivOf = (c) => path(c.pts, Yi, (q) => q.i);
  const pvOf = (c) => path(c.pts, Yp, (q) => q.p);
  const gridV = 5, gridI = 4;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: height || "auto", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="suIvFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22A35B" stopOpacity=".16" /><stop offset="100%" stopColor="#22A35B" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* เส้นตาราง + สเกล */}
      {Array.from({ length: gridI + 1 }).map((_, k) => {
        const y = T + (H - T - B) * k / gridI, iv = iTop * (1 - k / gridI), pv = pTop * (1 - k / gridI);
        return (
          <g key={"h" + k}>
            <line x1={L} y1={y} x2={W - R} y2={y} stroke="var(--ln)" strokeWidth="1" strokeDasharray={k === gridI ? null : "3 4"} />
            <text x={L - 7} y={y + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(iv, iTop > 20 ? 0 : 1)}</text>
            <text x={W - R + 7} y={y + 3.5} fontSize="9" fontWeight="700" fill="#B45309">{pv >= 1000 ? scR(pv / 1000, 1) + "k" : scR(pv, 0)}</text>
          </g>
        );
      })}
      {Array.from({ length: gridV + 1 }).map((_, k) => {
        const v = vTop * k / gridV;
        return (
          <g key={"v" + k}>
            <line x1={X(v)} y1={T} x2={X(v)} y2={H - B} stroke="var(--ln)" strokeWidth="1" strokeDasharray="3 4" opacity={k ? 1 : 0} />
            <text x={X(v)} y={H - B + 13} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{scR(v, 0)}</text>
          </g>
        );
      })}
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--ln2)" strokeWidth="1.2" />
      <text x={L - 7} y={T - 5} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">A</text>
      <text x={W - R + 7} y={T - 5} fontSize="8.5" fontWeight="800" fill="#B45309">W</text>
      <text x={W - R} y={H - 4} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">แรงดัน (V)</text>

      {/* เส้นอ้างอิงที่ STC — จาง ๆ ไว้เทียบว่าอากาศตอนวัดกินไปเท่าไหร่ */}
      {stcRef && <path d={ivOf(stcRef)} fill="none" stroke="var(--text-3)" strokeWidth="1.3" strokeDasharray="5 4" opacity=".5" />}
      {solo ? (
        /* ── ดูสตริงเดียว: เต็มรูปแบบ ── */
        <g>
          <path d={ivOf(exp) + " L" + X(exp.voc) + " " + Yi(0) + " L" + X(0) + " " + Yi(0) + " Z"} fill="url(#suIvFill)" />
          <path d={ivOf(exp)} fill="none" stroke={solo.color || "#22A35B"} strokeWidth="2.2" strokeLinejoin="round" />
          <path d={pvOf(exp)} fill="none" stroke="#D97706" strokeWidth="1.7" strokeDasharray="4 3" />
          <line x1={X(exp.vmp)} y1={Yi(exp.imp)} x2={X(exp.vmp)} y2={H - B} stroke={solo.color || "#22A35B"} strokeWidth="1" strokeDasharray="2 3" opacity=".7" />
          <line x1={L} y1={Yi(exp.imp)} x2={X(exp.vmp)} y2={Yi(exp.imp)} stroke={solo.color || "#22A35B"} strokeWidth="1" strokeDasharray="2 3" opacity=".7" />
          <circle cx={X(exp.vmp)} cy={Yi(exp.imp)} r="4" fill="#fff" stroke={solo.color || "#22A35B"} strokeWidth="2.2" />
          <text x={X(exp.vmp)} y={Yi(exp.imp) - 9} textAnchor="middle" fontSize="9.5" fontWeight="800" fill={solo.color || "var(--acd)"}>
            {scR(exp.pmax >= 1000 ? exp.pmax / 1000 : exp.pmax, 2)}{exp.pmax >= 1000 ? " kW" : " W"}
          </text>
        </g>
      ) : (
        /* ── รวมทุกสตริง: แยกสี จุด MPP + ชื่อกำกับ ── */
        <g>
          {list.map((x) => (
            <g key={x.id}>
              <path d={ivOf(x.curve)} fill="none" stroke={x.color} strokeWidth="2" strokeLinejoin="round" opacity=".92" />
              <circle cx={X(x.curve.vmp)} cy={Yi(x.curve.imp)} r="3.6" fill="#fff" stroke={x.color} strokeWidth="2" />
            </g>
          ))}
          {/* ตัวเลขกำลังของแต่ละสตริง วางเรียงไม่ให้ทับกัน */}
          {list.map((x, k) => (
            <text key={"t" + x.id} x={X(x.curve.vmp)} y={Yi(x.curve.imp) - 9 - (k % 2) * 11} textAnchor="middle"
              fontSize="9.5" fontWeight="800" fill={x.color}>
              {scR(x.curve.pmax >= 1000 ? x.curve.pmax / 1000 : x.curve.pmax, 2)}{x.curve.pmax >= 1000 ? "k" : ""}
            </text>
          ))}
        </g>
      )}
      {/* ค่าที่วัดได้จริง */}
      {meas && (meas.voc || meas.isc) && (
        <g>
          {meas.voc ? <g><circle cx={X(meas.voc)} cy={Yi(0)} r="4.2" fill="#2563EB" />
            <text x={X(meas.voc)} y={Yi(0) - 8} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1D4ED8">Voc</text></g> : null}
          {meas.isc ? <g><circle cx={X(0)} cy={Yi(meas.isc)} r="4.2" fill="#2563EB" />
            <text x={X(0) + 8} y={Yi(meas.isc) - 5} fontSize="9" fontWeight="800" fill="#1D4ED8">Isc</text></g> : null}
          {meas.vmp && meas.imp ? <g>
            <circle cx={X(meas.vmp)} cy={Yi(meas.imp)} r="5" fill="#2563EB" stroke="#fff" strokeWidth="1.6" />
            <text x={X(meas.vmp)} y={Yi(meas.imp) + 15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1D4ED8">วัดได้</text>
          </g> : null}
        </g>
      )}
    </svg>
  );
}

/* ── แถบแยกส่วนของแสงที่ตกบนหน้าแผง ── */
function SuLightBar({ irr }) {
  const parts = [
    { k: "beam", v: irr.beam, c: "#F59E0B", lb: "ลำแสงตรง" },
    { k: "diff", v: irr.diff, c: "#60A5FA", lb: "แสงฟุ้งจากฟ้า" },
    { k: "refl", v: irr.refl, c: "#A78BFA", lb: "สะท้อนจากพื้น" },
  ];
  const tot = Math.max(1, irr.poa);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", background: "var(--surface3)" }}>
        {parts.map((p) => p.v > 0 && (
          <div key={p.k} title={p.lb + " " + p.v + " W/m²"}
            style={{ width: (p.v / tot * 100) + "%", background: p.c, display: "grid", placeItems: "center",
              fontSize: 9.5, fontWeight: 800, color: "#fff", minWidth: 0, overflow: "hidden" }}>
            {p.v / tot > 0.12 ? p.v : ""}
          </div>
        ))}
        {irr.shadeLoss > 0 && (
          <div title={"เงาบังไป " + irr.shadeLoss + " W/m²"}
            style={{ width: (irr.shadeLoss / tot * 100) + "%", background: "repeating-linear-gradient(45deg,#64748B,#64748B 3px,#475569 3px,#475569 6px)",
              display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 800, color: "#fff" }}>เงา</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 13, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
        {parts.map((p) => <span key={p.k}><b style={{ color: p.c }}>■</b> {p.lb} {p.v}</span>)}
        {irr.shadeLoss > 0 && <span><b style={{ color: "#475569" }}>■</b> เงาบัง −{irr.shadeLoss}</span>}
      </div>
    </div>
  );
}

/* ── ความร้อนสะสมหลังแผง: อากาศ → หลังแผง → เซลล์ ── */
function SuThermo({ temp }) {
  const stops = [{ v: temp.tAmb, lb: "อากาศ", c: "#60A5FA" }, { v: temp.tBack, lb: "หลังแผง", c: "#F59E0B" }, { v: temp.tCell, lb: "เซลล์", c: "#DC2626" }];
  const lo = 20, hi = Math.max(80, temp.tCell + 6);
  const px = (v) => scClamp((v - lo) / (hi - lo) * 100, 0, 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ position: "relative", height: 12, borderRadius: 99, background: "linear-gradient(90deg,#93C5FD,#FCD34D,#F87171)" }}>
        {stops.map((s) => (
          <span key={s.lb} title={s.lb + " " + s.v + " °C"} style={{ position: "absolute", left: px(s.v) + "%", top: -3, transform: "translateX(-50%)",
            width: 4, height: 18, borderRadius: 99, background: "#fff", boxShadow: "0 0 0 1.5px " + s.c }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {stops.map((s) => (
          <span key={s.lb} className="p3-stat"><span style={{ width: 8, height: 8, borderRadius: 99, background: s.c, display: "inline-block" }} />
            {s.lb} <b>{s.v}°C</b></span>
        ))}
        <span className="p3-stat" style={{ color: temp.rise > 30 ? "#B45309" : undefined }}>ร้อนกว่าอากาศ <b>+{temp.rise}°C</b></span>
      </div>
    </div>
  );
}

/* ── กราฟกระแสเงินสดสะสม + จุดคุ้มทุน ── */
function SuCash({ roi }) {
  const W = 620, H = 176, L = 4, B = 22, T = 10;
  const rows = roi.rows;
  const lo = Math.min(-roi.capex, 0), hi = Math.max(1, rows[rows.length - 1].cum);
  const X = (i) => L + i / Math.max(1, rows.length) * (W - L * 2);
  const Y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const bw = (W - L * 2) / rows.length * 0.72;
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", display: "block", overflow: "visible" }}>
      <line x1={L} y1={Y(0)} x2={W - L} y2={Y(0)} stroke="var(--ln2)" strokeWidth="1.2" />
      {rows.map((r, i) => (
        <rect key={i} x={X(i)} y={Math.min(Y(r.cum), Y(0))} width={bw} height={Math.max(1, Math.abs(Y(r.cum) - Y(0)))}
          rx="2" fill={r.cum >= 0 ? "#22A35B" : "#CBD5E1"} opacity={r.cum >= 0 ? 0.9 : 0.85}>
          <title>{"ปี " + r.year + " · สะสม " + r.cum.toLocaleString() + " บาท"}</title>
        </rect>
      ))}
      {roi.payback != null && roi.payback <= rows.length && (
        <g>
          <line x1={X(roi.payback)} y1={T} x2={X(roi.payback)} y2={H - B} stroke="#B45309" strokeWidth="1.6" strokeDasharray="4 3" />
          <text x={X(roi.payback) + 5} y={T + 10} fontSize="10" fontWeight="800" fill="#B45309">คืนทุนปีที่ {roi.payback}</text>
        </g>
      )}
      {rows.map((r, i) => (i % 5 === 4 || i === 0) && (
        <text key={"t" + i} x={X(i) + bw / 2} y={H - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-3)">{r.year}</text>
      ))}
      <text x={W - L} y={H - 7} textAnchor="end" fontSize="8.5" fontWeight="800" fill="var(--text-3)">ปี</text>
    </svg>
  );
}

/* ============================================================
   SolarWorkspace
   ============================================================ */
function SolarWorkspace({ job, st, sys, onChange, onClose, snap }) {
  const [step, setStep] = React.useState(0);
  /* ภาพฉาก 3 มิติสำหรับรายงาน — ถ่ายตอนเปิดหน้านี้ ตามมุมกล้องที่ผู้ใช้ตั้งไว้ล่าสุด */
  const [snapImg, setSnapImg] = React.useState(null);
  React.useEffect(() => { if (typeof snap === "function") { const u = snap(); if (u) setSnapImg(u); } }, []);
  const S = sys || scBlankSys();
  const set = (patch) => onChange(Object.assign({}, S, patch));
  const B = window.BOQ || {};
  const stockPanels = B.PANELS || [], stockInv = B.INVERTERS || [], micros = B.MICRO || [];

  /* ── สเปคที่ใช้จริง (คลัง → แก้ทับ → ค่ากลาง) ── */
  const panel = scPanelSpec(S), inv = scInvSpec(S);
  const stockPanel = stockPanels.find((p) => p.model === S.panelModel) || {};
  const stockInvRow = stockInv.find((p) => p.model === S.invModel) || {};
  const srcOf = (ov, stock, key) => (ov && ov[key] != null ? "edit" : (stock[key] != null && stock[key] !== 0 ? "stock" : "def"));
  const setP = (k, v) => { const o = Object.assign({}, S.panel); if (v == null) delete o[k]; else o[k] = v; set({ panel: o }); };
  const setI = (k, v) => { const o = Object.assign({}, S.inv); if (v == null) delete o[k]; else o[k] = v; set({ inv: o }); };

  /* ── กลุ่มทิศทาง + รอยเท้าแผงมองจากบน (มาจากโมเดล 3 มิติทั้งคู่) ── */
  const idx = React.useMemo(() => scPanelIndex(st), [st]);
  const groups = idx.groups;
  const foot = React.useMemo(() => (typeof p3FootAll === "function" ? p3FootAll(st) : { panels: [], outlines: [], bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 } }), [st]);
  const totalPanels = groups.reduce((a, g) => a + g.count, 0);
  const isMicro = S.mode === "micro";
  const [activeStr, setActiveStr] = React.useState(1);

  /* ── สตริง / ไมโคร ── */
  const range = React.useMemo(() => (panel.voc && inv.mpptVmin ? scSeriesRange(panel, inv, S.env) : null), [panel.voc, panel.vmp, panel.tcVoc, inv.mpptVmin, inv.mpptVmax, inv.maxVdc, S.env]);
  /* ระบบจัดสตริงให้เองตั้งแต่เปิดเข้ามา — ผังจึงมีสีและแตะแก้ได้ทันที ไม่ต้องกดปุ่มก่อน
     ยังไม่เขียนลง state จนกว่าผู้ใช้จะแตะแก้จริง (จะได้ไม่ขึ้น "ยังไม่บันทึก" ทั้งที่ยังไม่ได้แตะอะไร) */
  const isManual = !!S.manual;
  const autoSeed = React.useMemo(() => (!isMicro && panel.voc && inv.mpptVmin && foot.panels.length
    ? scAutoAssign(foot.panels, idx.byPanel, groups, panel, inv, S.env, { invCount: S.invCount })
    : {}), [isMicro, foot, idx, groups, panel, inv, S.env, S.invCount]);
  const effAssign = isManual ? (S.assign || {}) : autoSeed;
  /* ตาราง/ผัง/จานสี อ่านจากชุดข้อมูลเดียวกันทั้งหมด จะได้ไม่มีทางขัดกันเอง */
  const plan = React.useMemo(() => (!isMicro && panel.voc
    ? scStringsFromAssign(effAssign, idx.byPanel, groups, panel, inv, S.env, { invCount: S.invCount, totalPanels })
    : null), [isMicro, effAssign, idx, groups, panel, inv, S.env, S.invCount, totalPanels]);
  const doAuto = () => set({ assign: autoSeed, manual: true });
  const paint = (uid) => {
    const a = Object.assign({}, effAssign);
    if (!activeStr) delete a[uid]; else a[uid] = activeStr;
    set({ assign: a, manual: true });
  };
  const strIds = plan && plan.strings ? plan.strings.map((s) => s.id || 0).filter(Boolean) : [];
  const nextStr = (strIds.length ? Math.max.apply(null, strIds) : 0) + 1;
  const microPlans = React.useMemo(() => (isMicro ? scMicroPlan(groups, panel, micros) : null), [isMicro, groups, panel, micros]);
  const microSel = microPlans ? (microPlans.find((m) => m.ratio === S.microRatio) || microPlans[0]) : null;

  /* AC รวม = กำลังอินเวอร์เตอร์ × จำนวนตัว — ต้องคิดได้แม้สเปค MPPT ในคลังยังว่าง (ไม่งั้นผลผลิตจะไม่ถูกตัดยอด) */
  const acKw = isMicro ? (microSel ? microSel.acKw : 0) : scR(scNum(inv.kw) * Math.max(1, scNum(S.invCount, 1)), 2);
  /* จำนวนตัวที่พอดี = กำลังแผงรวม ÷ กำลัง PV สูงสุดต่อตัว (ถ้าคลังไม่ระบุ ใช้ 1.3 เท่าของ kW) */
  const dcKwAll = totalPanels * scNum(panel.wp) / 1000;
  const invSuggest = Math.max(1, Math.ceil(dcKwAll / Math.max(0.1, scNum(inv.maxPv) || scNum(inv.kw) * 1.3)));
  /* ── เงาบังทั้งปีจากโมเดล 3 มิติ — คิดให้อัตโนมัติ ──
     คำนวณใหม่เองทุกครั้งที่ผังเปลี่ยน (ราว 50 มิลลิวินาที) จะได้ไม่มีทางที่ตัวเลขผลผลิต
     กับเงาที่เห็นในกราฟรายวันจะขัดกันเอง · ปิดได้ถ้าอยากกรอก % เอง */
  const use3d = !(S.shadeOff === true);
  /* ตั้งค่าโมเดล "เงาบังนิดเดียวแต่ฉุดทั้งสตริง" (ไดโอดบายพาส)
     แผงครึ่งเซลล์เดาให้จากข้อมูลคลัง — แก้ทับได้ */
  const hc = scHalfCut(panel);
  const elecCfg = Object.assign({}, IV_ELEC, { halfCut: hc.half }, S.elec || {});
  const setElec = (p) => set({ elec: Object.assign({}, elecCfg, p) });
  const shade3d = React.useMemo(() => (use3d && typeof ivShadeAnnual === "function" && groups.length
    ? ivShadeAnnual(st, idx.byPanel, groups, { lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, albedo: S.env && S.env.albedo, elec: elecCfg })
    : null), [use3d, st, idx, groups, S.env, S.elec, hc.half]);
  const energy = React.useMemo(() => (groups.length && panel.wp
    ? scEnergy(groups, panel, { lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, loss: S.loss,
        shadeByGroup: shade3d ? shade3d.byGroup : null,
        invEff: (S.inv && S.inv.eff) != null ? S.inv.eff : (isMicro ? 96.5 : inv.eff), acKw, tamb: S.tamb, kc: S.kc })
    : null), [groups, panel, S.loss, S.inv, S.tamb, S.kc, acKw, isMicro, inv.eff, st.sun, shade3d]);
  const life = energy ? scLife(energy.annual, panel, S.years) : null;

  /* ══ ตรวจวัด I-V ══ */
  const site = Object.assign({ date: "", hour: null, wind: 1, mount: "close", tAmb: null, ghi: null, shade: 0, age: 0 }, S.site || {});
  const siteDate = site.date || new Date().toISOString().slice(0, 10);
  const setSite = (p) => set({ site: Object.assign({}, site, { date: siteDate }, p) });
  const meas = S.meas || {};
  const setMeas = (id, p) => set({ meas: Object.assign({}, meas, { [id]: Object.assign({}, meas[id] || {}, p) }) });
  const par = React.useMemo(() => (typeof ivExtract === "function" ? ivExtract(panel) : null),
    [panel.voc, panel.isc, panel.vmp, panel.imp, panel.wp, panel.cells]);
  /* หน่วยที่ตรวจวัดได้ — โหมดสตริงวัดทีละสตริง · โหมดไมโครวัดทีละแผง (แยกตามกลุ่มทิศทาง) */
  const ivUnits = React.useMemo(() => {
    if (isMicro) return groups.map((g) => ({ id: "g:" + g.key, name: g.roofName + " · เอียง " + scR(g.tilt, 0) + "°", n: 1, tilt: g.tilt, az: g.az, count: g.count, gk: g.key, micro: true }));
    /* ทิศ 0° = หันเหนือ ห้ามใช้ || เพราะ 0 จะกลายเป็น 180 (เคยพลาดตรงนี้ ผลลัพธ์ด้านเหนือเลยเท่าด้านใต้) */
    return (plan && plan.strings ? plan.strings : []).map((s) => ({ id: "s:" + s.id, name: "สตริง " + s.id, sid: s.id, n: s.n,
      tilt: s.tilt == null ? 0 : s.tilt, az: s.az == null ? 180 : s.az, gk: s.groupKey, label: s.label }));
  }, [isMicro, groups, plan]);
  const monthNow = new Date(siteDate + "T12:00:00").getMonth();
  /* ── จำลองทั้งวันอัตโนมัติ: แสง เงา อุณหภูมิ กำลังไฟ ทุก 15 นาที ตั้งแต่เช้าถึงเย็น ──
     ทุกอย่างในขั้นนี้อ่านจากผลจำลองชุดเดียวกัน ตัวเลขบนกราฟกับในตารางจึงตรงกันเสมอ */
  const sim = React.useMemo(() => (typeof ivDaySim === "function" && groups.length && panel.wp
    ? ivDaySim(st, panel, groups, idx.byPanel, {
        lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, date: siteDate,
        tAmb: site.tAmb, ghi: site.ghi, refHour: site.hour == null ? 12 : site.hour,
        albedo: S.env && S.env.albedo, elec: elecCfg, acKw, invEff: (S.inv && S.inv.eff) != null ? S.inv.eff : (isMicro ? 96.5 : inv.eff),
        dcLoss: energy ? 1 - energy.dcLoss / 100 : 0.92 })
    : null), [st, panel, groups, idx, siteDate, site.tAmb, site.ghi, site.hour, S.env, acKw, S.inv, isMicro, inv.eff, energy && energy.dcLoss, S.elec, hc.half]);
  /* เวลาที่ใช้ดู — ถ้ายังไม่ได้เลือกเอง ระบบเลือก "ช่วงที่เหมาะจะออกไปวัดที่สุด" ให้ (แดดแรง ไม่มีเงา) */
  const hourAuto = site.hour == null || site.hour === "";
  const simHour = hourAuto ? (sim ? sim.bestHour : 12) : scNum(site.hour, 12);
  /* จำลองทั้ง 12 เดือน — วันตัวแทนของแต่ละเดือน ใช้ทำแผนที่ เดือน × ชั่วโมง */
  const [mapMode, setMapMode] = React.useState("light");
  /* หนักสุดในหน้านี้ (12 วันจำลอง) — คำนวณต่อเมื่อเปิดมาถึงขั้นตรวจวัดจริง ๆ ไม่ถ่วงตอนเปิดหน้าแรก */
  const year = React.useMemo(() => (step >= 2 && typeof ivYearSim === "function" && groups.length && panel.wp
    ? ivYearSim(st, panel, groups, idx.byPanel, {
        lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, year: +siteDate.slice(0, 4) || undefined,
        tAmb: site.tAmb, albedo: S.env && S.env.albedo, elec: elecCfg, acKw,
        invEff: (S.inv && S.inv.eff) != null ? S.inv.eff : (isMicro ? 96.5 : inv.eff),
        dcLoss: energy ? 1 - energy.dcLoss / 100 : 0.92 })
    : null), [step >= 2, st, panel, groups, idx, siteDate.slice(0, 4), site.tAmb, S.env, acKw, S.inv, isMicro, inv.eff, energy && energy.dcLoss, S.elec, hc.half]);
  const simRow = sim ? sim.rows.reduce((a, r) => (Math.abs(r.h - simHour) < Math.abs(a.h - simHour) ? r : a), sim.rows[0]) : null;
  const shadeAuto = site.shadeAuto !== false;
  /* เงารายแผง ณ เวลาที่ดู — ใช้สร้างเส้น I-V แบบมีขั้นบันไดของสตริงที่โดนบัง */
  const shadeUid = React.useMemo(() => (typeof ivShadeMoment === "function" && groups.length
    ? ivShadeMoment(st, idx.byPanel, groups, { lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, date: siteDate, hour: simHour })
    : null), [st, idx, groups, siteDate, simHour]);
  const ivRows = React.useMemo(() => {
    if (!par) return [];
    return ivUnits.map((u) => {
      const m = meas[u.id] || {};
      /* เงาอ่านจากผลจำลอง ณ เวลานั้น (มาจากการยิงลำแสงจริงในโมเดล 3 มิติ) */
      const cell = simRow && u.gk != null ? simRow.per[u.gk] : null;
      const auto = shadeAuto && cell ? cell.shade : null;
      const shade = m.shade != null && m.shade !== "" ? scNum(m.shade) : (auto != null ? auto : scNum(site.shade, 0));
      const irr = ivIrradiance({ lat: st.sun && st.sun.lat, lng: st.sun && st.sun.lng, date: siteDate, hour: simHour,
        tilt: u.tilt, az: u.az, ghi: site.ghi, shade, albedo: S.env && S.env.albedo });
      const tAmb = site.tAmb != null && site.tAmb !== "" ? scNum(site.tAmb) : SC_TAMB[isFinite(monthNow) ? monthNow : 6];
      const temp = ivCellTemp(irr.poaNet, tAmb, site.wind, site.mount);
      const a = ivAssess({ panel, par, irr, temp, nSeries: u.n, nPar: 1, ageYears: site.age, meas: m });
      /* ── เส้น I-V จริงตอนโดนเงา ──
         แผงในสตริงต่ออนุกรมกัน เงาบังแผงเดียวจะฉุดทั้งสตริง ไดโอดบายพาสจึงตัดท่อนที่โดนบังทิ้ง
         ทำให้เส้นหักเป็นขั้น ไม่ใช่เส้นเรียบ ๆ ที่ย่อส่วนลงมา */
      const uids = shadeUid && shadeUid.byUid
        ? (isMicro ? (foot.panels.filter((p) => idx.byPanel[p.uid] === u.gk).map((p) => p.uid).slice(0, 1))
                   : foot.panels.filter((p) => effAssign[p.uid] === u.sid).map((p) => p.uid))
        : [];
      const fracs = uids.map((x) => (shadeUid.byUid[x] || 0));
      const el = fracs.length ? ivElecLoss(fracs, elecCfg) : null;
      return { u, irr, temp, a, m, shade, shadeAuto: auto, fracs, el };
    });
  }, [par, ivUnits, meas, site.shade, site.tAmb, site.wind, site.mount, site.ghi, site.age, siteDate, panel, st.sun, monthNow, simRow, simHour, shadeAuto, shadeUid, foot, effAssign, isMicro, idx, S.elec]);
  /* null = แสดงรวมทุกสตริงในกราฟเดียว · ใส่ id = เจาะดูสตริงเดียว (กดเลือกจากตารางด้านล่างกราฟ) */
  const [ivSel, setIvSel] = React.useState(null);
  const [measOpen, setMeasOpen] = React.useState(false);
  const ivCur = ivSel == null ? null : (ivRows.find((r) => r.u.id === ivSel) || null);
  const ivMain = ivCur || ivRows[0] || null;         // ตัวแทนสำหรับข้อมูลที่ต้องมีค่าเสมอ (สภาพอากาศ/อุณหภูมิ)
  const ivDone = ivRows.filter((r) => r.a && r.a.hasMeas);
  const ivAvg = ivDone.length ? scR(ivDone.reduce((a, r) => a + (r.a.ratio || 0), 0) / ivDone.length, 1) : null;
  /* สตริงไหนต่ำกว่าเพื่อนผิดปกติ = mismatch ระหว่างสตริง (อินเวอร์เตอร์จะดึงลงทั้งช่อง) */
  const ivOutliers = React.useMemo(() => {
    if (ivDone.length < 2) return [];
    const v = ivDone.map((r) => r.a.ratio).sort((a, b) => a - b);
    const med = v[Math.floor(v.length / 2)];
    return ivDone.filter((r) => r.a.ratio < med - 5).map((r) => ({ name: r.u.name, ratio: r.a.ratio, med }));
  }, [ivDone]);

  /* ══ ROI ══ */
  const roiCfg = Object.assign({}, IV_ROI, S.roi || {});
  const setRoi = (p) => set({ roi: Object.assign({}, roiCfg, p) });
  const roi = React.useMemo(() => (energy && energy.annual ? ivRoi(energy.annual, panel, energy.dcKw, roiCfg) : null),
    [energy, panel, S.roi]);

  const ready = { equip: !!(panel.wp && (isMicro ? microSel : inv.model)), plan: !!(isMicro ? microSel : (plan && plan.strings.length)) };
  const steps = [
    { t: "อุปกรณ์", s: panel.model ? (panel.model.length > 26 ? panel.model.slice(0, 26) + "…" : panel.model) + (isMicro ? " · ไมโคร" : inv.model ? " · " + inv.model.slice(0, 18) : "") : "เลือกแผง + อินเวอร์เตอร์", ic: "layers" },
    { t: isMicro ? "การต่อไมโคร" : "การต่อสตริง", s: isMicro ? (microSel ? microSel.ratio + " · " + microSel.units + " ตัว" : "—") : (plan && plan.strings.length ? plan.strings.length + " สตริง · " + plan.panels + " แผง" : "—"), ic: "grid" },
    { t: "แสง เงา & เส้น I-V", s: sim ? SC_MON[isFinite(monthNow) ? monthNow : 6] + " · " + sim.dayKwh + " kWh/วัน" + (sim.shadeLossPct > 0 ? " · เงา " + sim.shadeLossPct + "%" : "") : "จำลองรายเดือน", ic: "curve" },
    { t: "ผลผลิต " + S.years + " ปี", s: energy ? energy.annual.toLocaleString() + " kWh/ปี" : "—", ic: "sun" },
    { t: "คืนทุน & ROI", s: roi ? (roi.payback ? "คืนทุน " + roi.payback + " ปี" : "ยังไม่คืนทุนใน " + roi.years + " ปี") + (roi.irr != null ? " · IRR " + roi.irr + "%" : "") : "—", ic: "coin" },
  ];

  const warns = [].concat(plan ? plan.warns : [], microSel ? microSel.warns : []);

  /* รวมทุกอย่างที่คำนวณไว้แล้วส่งให้ตัวสร้างรายงาน — ไม่คำนวณซ้ำ ตัวเลขในรายงานจึงตรงกับบนจอเป๊ะ */
  const doReport = () => {
    if (typeof suPrintReport !== "function") { alert("ยังโหลดตัวสร้างรายงานไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง"); return; }
    suPrintReport({ job, sys: S, panel, inv, groups, plan, microSel, isMicro, energy, life, roi, roiCfg,
      ivRows, ivDone, ivAvg, ivOutliers, site, siteDate, acKw, totalPanels, warns, foot, assign: effAssign,
      shade3d, sim, simHour, year, snapImg });
  };

  return (
    <div className="p3 su">
      <style>{SU_CSS}</style>
      {/* header */}
      <div className="p3-head" style={{ padding: "11px 18px" }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(245,158,11,.14)", display: "grid", placeItems: "center", flexShrink: 0, color: "#B45309" }}>
          <P3Icon name="sun" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".14em", color: "var(--text-3)", textTransform: "uppercase" }}>
            ออกแบบระบบไฟฟ้า{job && job.code ? " · " + job.code : ""}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job ? job.name : ""}</div>
        </div>
        <button className="ghost" onClick={onClose} title="กลับไปหน้าวางแผง"><Icon name="x" size={16} /></button>
      </div>

      <div className="su-body">
        {/* ขั้นตอน */}
        <div className="su-rail">
          <span className="p3-eb" style={{ padding: "0 8px 6px" }}>ขั้นตอน</span>
          {steps.map((s, i) => (
            <button key={i} className="su-step" data-on={step === i ? "1" : "0"} data-done={i < step ? "1" : "0"} onClick={() => setStep(i)}>
              <span className="no">{i < step ? "✓" : i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span className="tt" style={{ display: "block" }}>{s.t}</span>
                <span className="sb" style={{ display: "block" }}>{s.s}</span>
              </span>
            </button>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 14 }}>
            <div className="p3-card" style={{ gap: 7, padding: "10px 11px" }}>
              <span className="p3-eb">แผงในผัง 3 มิติ</span>
              <span style={{ fontSize: 19, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{totalPanels} <small style={{ fontSize: 10, color: "var(--text-3)" }}>แผง</small></span>
              <span className="p3-note">{groups.length} กลุ่มทิศทาง · แผงที่ทิศ/มุมต่างกันต้องแยกสตริงกัน</span>
            </div>
          </div>
        </div>

        {/* เนื้อหา */}
        <div className="su-main">
          <div className="su-wrap">
            {!totalPanels && (
              <div className="su-alert warn"><P3Icon name="height" size={14} />ยังไม่มีแผงในผัง — กลับไปวางแผงบนหลังคาก่อน แล้วค่อยมาออกแบบระบบ</div>
            )}

            {/* ══ ขั้น 1 · อุปกรณ์ ══ */}
            {step === 0 && (
              <React.Fragment>
                <div className="su-pick">
                  {[["string", "สตริงอินเวอร์เตอร์", "แผงหลายแผงต่ออนุกรมเข้าตัวเดียว · ถูกกว่า ดูแลจุดเดียว แต่ทั้งสตริงต้องทิศ/มุมเดียวกัน และเงาบังแผงเดียวฉุดทั้งสตริง"],
                    ["micro", "ไมโครอินเวอร์เตอร์", "แปลงไฟที่แผงเลย 1 หรือ 2 แผงต่อตัว · เงาบังแผงไหนเสียแค่แผงนั้น วางคนละทิศได้อิสระ แต่ราคาสูงกว่า"]].map(([k, h, d]) => (
                    <button key={k} data-on={S.mode === k ? "1" : "0"} onClick={() => set({ mode: k })}>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                        {/* ไดอะแกรมเล็ก ๆ บอกวิธีต่อ */}
                        <svg width="40" height="22" viewBox="0 0 40 22" fill="none" stroke="currentColor" strokeWidth="1.5">
                          {k === "string" ? (
                            <React.Fragment>
                              <rect x="1" y="3" width="7" height="6" rx="1" /><rect x="10" y="3" width="7" height="6" rx="1" /><rect x="19" y="3" width="7" height="6" rx="1" />
                              <path d="M8 6h2M17 6h2M26 6h5v9h-8" /><rect x="14" y="13" width="9" height="7" rx="1.5" />
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <rect x="2" y="2" width="8" height="6" rx="1" /><rect x="15" y="2" width="8" height="6" rx="1" /><rect x="28" y="2" width="8" height="6" rx="1" />
                              <path d="M6 8v3M19 8v3M32 8v3" /><rect x="2" y="11" width="8" height="5" rx="1.5" /><rect x="15" y="11" width="8" height="5" rx="1.5" /><rect x="28" y="11" width="8" height="5" rx="1.5" />
                              <path d="M6 16v2h26v-2" />
                            </React.Fragment>
                          )}
                        </svg>
                        <span className="h">{h}</span>
                      </span>
                      <span className="d">{d}</span>
                    </button>
                  ))}
                </div>

                {/* ── แผง ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="grid" size={13} />แผงโซลาร์<span className="ln" />
                    <span style={{ fontWeight: 600 }}>สเปคดึงจากคลังสินค้า</span></span>
                  <select className="p3-inp" value={S.panelModel || ""} onChange={(e) => set({ panelModel: e.target.value })}>
                    <option value="">— เลือกรุ่นแผง —</option>
                    {stockPanels.map((p) => <option key={p.model} value={p.model}>{p.model} ({p.wp}W)</option>)}
                  </select>
                  {/* ค่าไฟฟ้าทั้งหมดคือคอลัมน์ STC ในดาต้าชีต (ไม่ใช่คอลัมน์ NOCT/NMOT) */}
                  <span className="p3-eb" style={{ marginTop: 2 }}>ค่าไฟฟ้า @ STC<span style={{ fontWeight: 600 }}>1000 W/m² · เซลล์ 25°C · AM1.5</span><span className="ln" /></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                    <SuSpec label="Pmax (STC)" value={panel.wp} step={5} suffix="W" src={srcOf(S.panel, stockPanel, "wp")} onChange={(v) => setP("wp", v)} onReset={() => setP("wp", null)} />
                    <SuSpec label="Voc (STC)" value={panel.voc} suffix="V" src={srcOf(S.panel, stockPanel, "voc")} onChange={(v) => setP("voc", v)} onReset={() => setP("voc", null)} />
                    <SuSpec label="Isc (STC)" value={panel.isc} suffix="A" src={srcOf(S.panel, stockPanel, "isc")} onChange={(v) => setP("isc", v)} onReset={() => setP("isc", null)} />
                    <SuSpec label="Vmp (STC)" value={panel.vmp} suffix="V" src={srcOf(S.panel, stockPanel, "vmp")} onChange={(v) => setP("vmp", v)} onReset={() => setP("vmp", null)} />
                    <SuSpec label="Imp (STC)" value={panel.imp} suffix="A" src={srcOf(S.panel, stockPanel, "imp")} onChange={(v) => setP("imp", v)} onReset={() => setP("imp", null)} />
                  </div>
                  <span className="p3-eb" style={{ marginTop: 2 }}>ค่าตามอุณหภูมิ &amp; อายุการใช้งาน<span className="ln" /></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                    <SuSpec label="ค่าอุณหภูมิ Voc" value={panel.tcVoc} suffix="%/°C" src={srcOf(S.panel, stockPanel, "tcVoc")} onChange={(v) => setP("tcVoc", v)} onReset={() => setP("tcVoc", null)} />
                    <SuSpec label="ค่าอุณหภูมิ Isc" value={panel.tcIsc} suffix="%/°C" src={srcOf(S.panel, stockPanel, "tcIsc")} onChange={(v) => setP("tcIsc", v)} onReset={() => setP("tcIsc", null)} />
                    <SuSpec label="ค่าอุณหภูมิ Pmax" value={panel.tcPmax} suffix="%/°C" src={srcOf(S.panel, stockPanel, "tcPmax")} onChange={(v) => setP("tcPmax", v)} onReset={() => setP("tcPmax", null)} />
                    <SuSpec label="NOCT / NMOT" value={panel.noct} step={1} suffix="°C" src={srcOf(S.panel, stockPanel, "noct")} onChange={(v) => setP("noct", v)} onReset={() => setP("noct", null)} />
                    <SuSpec label="เสื่อมปีแรก" value={panel.deg1} step={0.1} suffix="%" src={srcOf(S.panel, stockPanel, "deg1")} onChange={(v) => setP("deg1", v)} onReset={() => setP("deg1", null)} />
                    <SuSpec label="เสื่อมปีถัดไป" value={panel.degY} step={0.05} suffix="%/ปี" src={srcOf(S.panel, stockPanel, "degY")} onChange={(v) => setP("degY", v)} onReset={() => setP("degY", null)} />
                  </div>
                  <span className="p3-note">
                    กรอกจากคอลัมน์ <b>STC</b> ในดาต้าชีตเท่านั้น — ระบบจะแปลงไปที่อุณหภูมิใช้งานจริงเองด้วยค่าอุณหภูมิและ NOCT ด้านล่าง ·
                    ค่าที่คลังยังไม่มีจะเติมค่ากลางให้ก่อน แก้ทับได้ ผูกกับงานนี้งานเดียว ไม่กระทบคลัง
                  </span>
                </div>

                {/* ── อินเวอร์เตอร์ ── */}
                {!isMicro ? (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="box" size={13} />สตริงอินเวอร์เตอร์<span className="ln" /></span>
                    <div style={{ display: "flex", gap: 9 }}>
                      <select className="p3-inp" style={{ flex: 1 }} value={S.invModel || ""} onChange={(e) => set({ invModel: e.target.value })}>
                        <option value="">— เลือกรุ่นอินเวอร์เตอร์ —</option>
                        {stockInv.map((p) => <option key={p.model} value={p.model}>{p.model}</option>)}
                      </select>
                      <label className="p3-f" style={{ width: 108, flex: "0 0 auto" }}>
                        <span className="lb" style={{ display: "flex", gap: 5 }}>
                          <span>จำนวนตัว</span>
                          {inv.kw && S.invCount !== invSuggest ? (
                            <button className="p3-lnk" style={{ marginLeft: "auto", fontSize: 9.5 }} title={"กำลังแผง " + scR(dcKwAll, 1) + " kWp ÷ " + (scNum(inv.maxPv) || scR(scNum(inv.kw) * 1.3, 1)) + " kW ต่อตัว"}
                              onClick={(e) => { e.preventDefault(); set({ invCount: invSuggest }); }}>ใช้ {invSuggest}</button>
                          ) : null}
                        </span>
                        <input className="p3-inp" type="number" min="1" step="1" value={S.invCount} onChange={(e) => set({ invCount: Math.max(1, +e.target.value || 1) })} />
                      </label>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                      <SuSpec label="กำลัง AC" value={inv.kw} step={0.1} suffix="kW" src={srcOf(S.inv, stockInvRow, "kw")} onChange={(v) => setI("kw", v)} onReset={() => setI("kw", null)} />
                      <SuSpec label="MPPT ต่ำสุด" value={inv.mpptVmin} step={5} suffix="V" src={srcOf(S.inv, stockInvRow, "mpptVmin")} onChange={(v) => setI("mpptVmin", v)} onReset={() => setI("mpptVmin", null)} />
                      <SuSpec label="MPPT สูงสุด" value={inv.mpptVmax} step={5} suffix="V" src={srcOf(S.inv, stockInvRow, "mpptVmax")} onChange={(v) => setI("mpptVmax", v)} onReset={() => setI("mpptVmax", null)} />
                      <SuSpec label="แรงดัน DC สูงสุด" value={inv.maxVdc} step={10} suffix="V" src={srcOf(S.inv, stockInvRow, "maxVdc")} onChange={(v) => setI("maxVdc", v)} onReset={() => setI("maxVdc", null)} />
                      <SuSpec label="กระแสทำงานสูงสุด/MPPT" value={inv.maxInA} step={0.5} suffix="A" src={srcOf(S.inv, stockInvRow, "maxInA")} onChange={(v) => setI("maxInA", v)} onReset={() => setI("maxInA", null)} />
                      <SuSpec label="กระแสลัดวงจรสูงสุด/MPPT" value={inv.maxIscA} step={0.5} suffix="A" src={srcOf(S.inv, stockInvRow, "maxIscA")} onChange={(v) => setI("maxIscA", v)} onReset={() => setI("maxIscA", null)} />
                      <SuSpec label="จำนวน MPPT" value={inv.inputs} step={1} suffix="ช่อง" src={srcOf(S.inv, stockInvRow, "inputs")} onChange={(v) => setI("inputs", v)} onReset={() => setI("inputs", null)} />
                      <SuSpec label="ประสิทธิภาพ" value={inv.eff} step={0.1} suffix="%" src={srcOf(S.inv, stockInvRow, "eff")} onChange={(v) => setI("eff", v)} onReset={() => setI("eff", null)} />
                    </div>
                    {/* เทียบกระแสให้เห็นทันทีว่าคู่ไหนเทียบกับคู่ไหน */}
                    {panel.imp && (() => {
                      const cur = scCurrent(panel, inv, 1);
                      const row = (lb, val, lim, tip) => (
                        <span className="p3-stat" title={tip} style={{ color: lim && val > lim ? "#B91C1C" : undefined }}>
                          {lb} <b>{val} A</b>{lim ? <span style={{ color: "var(--text-3)", fontWeight: 700 }}>&nbsp;/ {lim} A</span> : <span style={{ color: "var(--text-3)" }}>&nbsp;/ ยังไม่ระบุ</span>}
                        </span>
                      );
                      return (
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                          {row("กระแสทำงาน (Imp)", cur.opA, cur.limOp, "Imp ของแผง ต่อ 1 สตริง เทียบกับกระแสทำงานสูงสุดของช่อง MPPT")}
                          {row("กระแสลัดวงจร (Isc×1.25)", cur.scA, cur.limSc, "Isc×1.25 ตามมาตรฐานการติดตั้ง เทียบกับพิกัดกระแสลัดวงจรของช่อง MPPT")}
                          <span className="p3-stat">ขนานได้ <b>{scStringsPerMppt(panel, inv)}</b> สตริง/ช่อง</span>
                        </div>
                      );
                    })()}
                    {(!inv.mpptVmin || !inv.maxVdc) && (
                      <div className="su-alert warn"><P3Icon name="height" size={14} />รุ่นนี้ยังไม่ได้กรอกช่วง MPPT / แรงดันสูงสุดในคลัง — กรอกตรงนี้ก่อนได้ แล้วค่อยไปเติมถาวรที่หน้าคลังสินค้า › สเปคอินเวอร์เตอร์</div>
                    )}
                  </div>
                ) : (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="box" size={13} />ไมโครอินเวอร์เตอร์<span className="ln" /><span style={{ fontWeight: 600 }}>แนะนำอัตราส่วนให้อัตโนมัติ</span></span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(microPlans || []).map((m, i) => (
                        <button key={m.ratio} className="p3-chip" data-on={(S.microRatio || (microPlans[0] || {}).ratio) === m.ratio ? "1" : "0"}
                          onClick={() => set({ microRatio: m.ratio })}
                          style={{ borderRadius: 12, padding: "11px 13px", flexDirection: "column", alignItems: "stretch", gap: 6, textAlign: "left" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <b style={{ fontSize: 14, fontWeight: 800 }}>แผง {m.per} : ไมโคร 1</b>
                            {i === 0 && <span className="su-src stock" title={m.why}>แนะนำ · {m.why}</span>}
                            <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 800 }}>{m.units} ตัว</span>
                          </span>
                          <span style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.55 }}>
                            {m.model} · {m.acW} W/ตัว · DC/AC {m.dcAc} · รวม AC {m.acKw} kW
                            {m.warns.length ? " · ⚠ " + m.warns[0] : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="p3-note">แบบ 2:1 ประหยัดกว่าแต่แผงคู่เดียวกันต้องอยู่ทิศ/มุมเดียวกัน ระบบเช็คให้แล้วจากผัง 3 มิติ — กลุ่มไหนแผงเป็นเลขคี่จะเตือนไว้</span>
                  </div>
                )}
                <button className="p3-b pri" style={{ alignSelf: "flex-end", padding: "10px 20px" }} onClick={() => setStep(1)}>
                  ถัดไป · {isMicro ? "การต่อไมโคร" : "การต่อสตริง"}<P3Icon name="arrow" size={14} />
                </button>
              </React.Fragment>
            )}

            {/* ══ ขั้น 2 · การต่อ ══ */}
            {step === 1 && (
              <React.Fragment>
                {/* กลุ่มทิศทาง */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="roof" size={13} />กลุ่มทิศทางจากผัง 3 มิติ<span className="ln" /><span style={{ fontWeight: 600 }}>{groups.length} กลุ่ม</span></span>
                  <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                    {groups.map((g) => (
                      <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--ln)", borderRadius: 12, padding: "8px 12px 8px 8px", minWidth: 168 }}>
                        <SuFacing tilt={g.tilt} az={g.az} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{g.count} แผง</span>
                          <span style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.45 }}>{g.roofName}{g.side ? " · " + g.side : ""}</span>
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>เอียง {g.tilt}° · ทิศ {g.az}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!isMicro && range && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="height" size={13} />จำนวนแผงต่ออนุกรม (ต่อ 1 สตริง)<span className="ln" /></span>
                    <span className="p3-note" style={{ marginTop: -3 }}>
                      แถบคือช่วงแรงดันจริงของสตริง ตั้งแต่ตอน<b style={{ color: "#B45309" }}>แผงร้อนจัด</b>ถึงตอน<b style={{ color: "var(--acd)" }}>อากาศเย็น</b> —
                      ต้องอยู่ในพื้นเขียว (ช่วง MPPT) ตลอด และขีด Voc ห้ามเลยเส้นแดง
                    </span>
                    <SuVoltBand rows={range.rows.filter((r) => r.n >= Math.max(1, range.min - 2) && r.n <= range.max + 2)}
                      inv={inv} sel={S.series || range.best} onPick={(n) => set({ series: n })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">ต่อได้ <b>{range.min}–{range.max}</b> แผง/สตริง</span>
                      <span className="p3-stat">ระบบแนะนำ <b>{range.best}</b> แผง</span>
                      <span className="p3-stat">สตริงต่อ MPPT <b>{scStringsPerMppt(panel, inv)}</b></span>
                    </div>
                  </div>
                )}

                {/* ── ผัง 2D: จัดแผงเข้าสตริงเองได้ ── */}
                {!isMicro && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="plan" size={13} />ผังแผง 2 มิติ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{isManual ? "แก้เอง" : "ระบบจัดให้"}</span></span>
                    {/* จานสี = เลือกสตริงที่จะทา แล้วแตะ/ลากบนแผงในผัง (ใช้ได้ทันที ไม่ต้องกดปุ่มก่อน) */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {(plan && plan.strings ? plan.strings : []).map((s) => (
                        <button key={s.id} className="p3-chip" data-on={activeStr === s.id ? "1" : "0"}
                          onClick={() => setActiveStr(s.id)}
                          title={s.chk.ok ? "สตริง " + s.id + " · " + s.chk.band + " — กดแล้วแตะแผงในผังเพื่อย้ายเข้าสตริงนี้" : s.chk.fails.join(" · ")}
                          style={{ borderColor: activeStr === s.id ? suColor(s.id) : "var(--ln2)",
                            background: activeStr === s.id ? suColor(s.id) + "1E" : "var(--surface)",
                            color: activeStr === s.id ? suColor(s.id) : "var(--text-2)" }}>
                          <span className="dot" style={{ background: suColor(s.id), width: 9, height: 9 }} />
                          สตริง {s.id} · <b>{s.n}</b>
                          {!s.chk.ok && <span style={{ color: "#B91C1C", fontWeight: 800 }}>!</span>}
                          {s.mixed && <span style={{ color: "#B45309", fontWeight: 800 }}>⌇</span>}
                        </button>
                      ))}
                      <button className="p3-chip" onClick={() => setActiveStr(nextStr)} data-on={activeStr === nextStr ? "1" : "0"}
                        title="เริ่มสตริงใหม่ แล้วแตะแผงที่จะใส่">
                        <P3Icon name="plus" size={12} />สตริงใหม่
                      </button>
                      <button className="p3-chip" onClick={() => setActiveStr(0)} data-on={activeStr === 0 ? "1" : "0"}
                        title="แตะแผงเพื่อเอาออกจากสตริง" style={{ borderStyle: "dashed" }}>
                        <P3Icon name="trash" size={12} />เอาออก
                      </button>
                      <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        {isManual && (
                          <button className="p3-b sm" onClick={() => set({ assign: {}, manual: false })}
                            title="ทิ้งที่แก้เองทั้งหมด กลับไปใช้ที่ระบบจัดให้">
                            <P3Icon name="reset" size={13} />คืนค่าที่ระบบจัด
                          </button>
                        )}
                        {!isManual && (
                          <button className="p3-b sm" onClick={doAuto} title="ยึดการจัดชุดนี้ไว้ แล้วเริ่มแก้เอง">
                            <P3Icon name="check" size={13} />ยึดชุดนี้ไว้แก้เอง
                          </button>
                        )}
                      </span>
                    </div>
                    <SuLayout2D foot={foot} assign={effAssign} active={activeStr !== null} onPaint={paint} />
                    <span className="p3-note">
                      {isManual
                        ? "กำลังใช้ผังที่แก้เอง · เลือกสตริงด้านบนแล้วแตะหรือลากบนแผงเพื่อย้ายเข้าสตริงนั้น · แผงเทาประ = ยังไม่อยู่สตริงไหน"
                        : "ระบบแบ่งสตริงให้แล้วตามที่เห็น — แตะหรือลากบนแผงได้เลยถ้าจะแก้ (แก้ครั้งแรกระบบจะยึดผังนี้เป็นของคุณทันที)"}
                      {" · มองจากด้านบน ทิศเหนืออยู่บน"}
                    </span>
                  </div>
                )}

                {!isMicro && plan && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="layers" size={13} />ผังการต่อ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{plan.strings.length} สตริง · {plan.panels} แผง</span></span>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>สตริง</th><th>แผง</th><th>กลุ่ม</th><th>MPPT</th><th>Voc เย็น</th><th>ช่วงทำงาน</th><th>สถานะ</th></tr></thead>
                        <tbody>
                          {plan.strings.map((s, i) => (
                            <tr key={i} data-on={s.id && activeStr === s.id ? "1" : "0"}>
                              <td>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 9, height: 9, borderRadius: 99, background: suColor(s.id || i + 1) }} />
                                  <b>#{s.id || i + 1}</b>
                                </span>
                              </td>
                              <td><b>{s.n}</b></td>
                              <td style={{ maxWidth: 190, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: s.mixed ? "#B45309" : undefined }}>{s.label}</td>
                              <td>{s.mppt == null ? "—" : "อินฯ " + (s.inv + 1) + " / ช่อง " + (s.mppt % Math.max(1, scNum(inv.inputs, 2)) + 1)}</td>
                              <td>{s.chk.vocCold} V</td>
                              <td>{s.chk.vmpHot}–{s.chk.vmpCold} V</td>
                              <td style={{ color: s.chk.ok ? "var(--acd)" : "#B91C1C", fontWeight: 800 }}>{s.chk.ok ? s.chk.band : "ไม่ผ่าน"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">DC <b>{plan.dcKw}</b> kWp</span>
                      <span className="p3-stat">AC <b>{plan.acKw}</b> kW</span>
                      <span className="p3-stat" style={{ color: plan.dcAc > 1.4 || plan.dcAc < 0.85 ? "#B45309" : undefined }}>DC/AC <b>{plan.dcAc}</b></span>
                    </div>
                  </div>
                )}

                {isMicro && microSel && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="layers" size={13} />การต่อไมโคร<span className="ln" /></span>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>กลุ่ม</th><th>แผง</th><th>ไมโคร</th><th>หมายเหตุ</th></tr></thead>
                        <tbody>
                          {groups.map((g) => {
                            const u = Math.ceil(g.count / microSel.per), odd = microSel.per > 1 && g.count % microSel.per;
                            return (
                              <tr key={g.key}>
                                <td style={{ maxWidth: 230 }}>{g.label}</td>
                                <td><b>{g.count}</b></td>
                                <td><b>{u}</b> ตัว</td>
                                <td style={{ color: odd ? "#B45309" : "var(--text-3)" }}>{odd ? "เหลือแผงเดี่ยว 1 แผง (ตัวสุดท้ายใช้ช่องเดียว)" : "ลงตัวพอดี"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">ไมโครรวม <b>{microSel.units}</b> ตัว</span>
                      <span className="p3-stat">DC <b>{microSel.dcKw}</b> kWp</span>
                      <span className="p3-stat">AC <b>{microSel.acKw}</b> kW</span>
                      <span className="p3-stat">DC/AC <b>{microSel.dcAc}</b></span>
                    </div>
                  </div>
                )}

                {warns.map((w, i) => (
                  <div key={i} className="su-alert warn"><P3Icon name="height" size={14} /><span>{w}</span></div>
                ))}
                {/* ข้อมูลที่ยังขาด — ไม่ใช่ความผิดพลาด แค่ยังตรวจให้ไม่ได้ */}
                {(plan && plan.notes ? plan.notes : []).map((n, i) => (
                  <div key={"n" + i} className="su-alert info"><P3Icon name="bulb" size={14} /><span>{n}</span></div>
                ))}
                {!warns.length && (plan || microSel) && (
                  <div className="su-alert good"><P3Icon name="check" size={14} />การต่อผ่านทุกเงื่อนไข — แรงดันอยู่ในช่วงทำงานทั้งตอนร้อนจัดและอากาศเย็น</div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(0)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(2)}>ถัดไป · ตรวจวัด I-V<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}

            {/* ══ ขั้น 3 · ตรวจวัด I-V + ชดเชยสภาพอากาศ ══ */}
            {step === 2 && (
              <React.Fragment>
                {!par && (
                  <div className="su-alert warn"><P3Icon name="height" size={14} />ยังสร้างเส้น I-V ไม่ได้ — ต้องมี Voc / Isc / Vmp / Imp ของแผงครบก่อน (กลับไปกรอกที่ขั้นอุปกรณ์)</div>
                )}

                {/* ── จำลองทั้งวันอัตโนมัติ ── */}
                {sim && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="sun" size={13} />จำลองแสงตลอดวัน<span className="ln" />
                      <span style={{ fontWeight: 600 }}>วันเฉลี่ยของเดือน{SC_MON[isFinite(monthNow) ? monthNow : 6]}</span></span>
                    <SuDayLight sim={sim} groups={groups} hour={simHour} onHour={(h) => setSite({ hour: scR(h, 2) })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat">พระอาทิตย์ขึ้น <b>{ivHM(sim.sunrise)}</b></span>
                      <span className="p3-stat">ตก <b>{ivHM(sim.sunset)}</b></span>
                      <span className="p3-stat">แดดแรงสุด <b>{sim.maxPoa}</b> W/m² ตอน <b>{ivHM(sim.peak ? sim.peak.h : null)}</b></span>
                      <span className="p3-stat">ผลิตได้วันนี้ <b>{sim.dayKwh}</b> kWh</span>
                      {sim.clipHours > 0 && <span className="p3-stat" style={{ color: "#B45309" }}>อินเวอร์เตอร์ตัดยอด <b>{sim.clipHours}</b> ชม.</span>}
                      {sim.shadeLossPct > 0 && <span className="p3-stat" style={{ color: "#B45309" }}>เงากินไป <b>{sim.shadeLossKwh}</b> kWh ({sim.shadeLossPct}%)</span>}
                    </div>

                    <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="tree" size={12} />เงาบังรายชั่วโมง — จากตัวอาคารและสิ่งบดบังในผัง 3 มิติ<span className="ln" />
                      <span style={{ fontWeight: 600 }}>{sim.shadeFrom != null ? "โดนบัง " + ivHM(sim.shadeFrom) + "–" + ivHM(sim.shadeTo) : "ไม่มีเงาบังทั้งวัน"}</span></span>
                    <SuShadeStrip sim={sim} groups={groups} />
                    <span className="p3-note">
                      ยิงลำแสงจากแผงทุกใบ ({sim.panels} ใบ × 5 จุด) ทุก 15 นาที ไปหาดวงอาทิตย์ แล้วดูว่าชน
                      <b> ตัวอาคาร/หลังคา {sim.buildings} ชิ้น</b> · <b>สิ่งบดบังที่สำรวจไว้ {sim.obstacles} ชิ้น</b> หรือแผงแถวหน้าหรือเปล่า —
                      ลากบนกราฟด้านบนเพื่อเลื่อนเวลาดูได้
                    </span>

                    <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="curve" size={12} />กำลังไฟและอุณหภูมิเซลล์ตลอดวัน<span className="ln" />
                      <span style={{ fontWeight: 600 }}>สูงสุด {sim.peak ? scR(sim.peak.ac, 2) : 0} kW ตอน {ivHM(sim.peak ? sim.peak.h : null)}</span></span>
                    <SuDayPower sim={sim} groups={groups} acKw={acKw} hour={simHour} onHour={(h) => setSite({ hour: scR(h, 2) })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 9.5, color: "var(--text-3)", fontWeight: 700 }}>
                      <span><b style={{ color: "#22A35B" }}>┅</b> กำลัง DC จากแผง</span>
                      <span><b style={{ color: "#0F7A43" }}>━</b> กำลัง AC ที่ออกจากอินเวอร์เตอร์จริง</span>
                      <span><b style={{ color: "#DC2626" }}>━</b> อุณหภูมิเซลล์ (แกนขวา)</span>
                    </div>
                  </div>
                )}

                {/* ── ทั้ง 12 เดือน ── */}
                {year && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="map" size={13} />ทั้งปี 12 เดือน<span className="ln" />
                      <span className="p3-seg wide" style={{ marginLeft: "auto" }}>
                        <button data-on={mapMode === "light" ? "1" : "0"} onClick={() => setMapMode("light")}>แสงที่ได้</button>
                        <button data-on={mapMode === "shade" ? "1" : "0"} onClick={() => setMapMode("shade")}>เงาบัง</button>
                      </span></span>
                    <span className="p3-note" style={{ marginTop: -2 }}>
                      แต่ละแถวคือ 1 เดือน แต่ละช่องคือครึ่งชั่วโมง — กดที่ชื่อเดือนเพื่อดูกราฟรายวันของเดือนนั้น
                    </span>
                    <SuYearMap year={year} mode={mapMode} month={isFinite(monthNow) ? monthNow : 0}
                      onMonth={(mo) => setSite({ date: mo.date })} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                      <span className="p3-stat" title="รวมจากวันตัวแทนของแต่ละเดือน — ตัวเลขทางการดูที่ขั้นผลผลิต ซึ่งเดินครบทุกวันของปี">
                        ผลิตทั้งปี (ประมาณ) <b>{Math.round(year.totalKwh / 1000).toLocaleString()}</b> MWh</span>
                      <span className="p3-stat" style={{ color: year.shadeLossPct > 0 ? "#B45309" : undefined }}>
                        เงากินทั้งปี <b>{year.shadeLossKwh.toLocaleString()}</b> kWh ({year.shadeLossPct}%)</span>
                      {year.worstMonth && year.worstMonth.shadeLossPct > 0 && (
                        <span className="p3-stat" style={{ color: "#B45309" }}>เดือนที่โดนหนักสุด <b>{year.worstMonth.label}</b> ({year.worstMonth.shadeLossPct}%)</span>
                      )}
                      {year.clipHours > 0 && <span className="p3-stat">อินเวอร์เตอร์ตัดยอดรวม <b>{year.clipHours}</b> ชม./ปี</span>}
                    </div>
                    <div className="su-scroll">
                      <table className="su-tb">
                        <thead><tr><th>เดือน</th><th>แดดขึ้น–ตก</th><th>แดดแรงสุด</th><th>กำลังสูงสุด</th><th>ผลิต/วัน</th><th>ผลิต/เดือน</th><th>เงาบัง</th></tr></thead>
                        <tbody>
                          {year.months.map((mo) => (
                            <tr key={mo.m} data-on={mo.m === monthNow ? "1" : "0"}>
                              <td><b>{mo.label}</b></td>
                              <td>{ivHM(mo.sunrise)}–{ivHM(mo.sunset)}</td>
                              <td>{mo.maxPoa} W/m²</td>
                              <td>{scR(mo.peakAc, 2)} kW</td>
                              <td>{scR(mo.dayKwh, 1)} kWh</td>
                              <td><b>{mo.monthKwh.toLocaleString()}</b> kWh</td>
                              <td style={{ fontWeight: 800, color: mo.shadeLossPct >= 5 ? "#B91C1C" : mo.shadeLossPct > 0 ? "#B45309" : "var(--text-3)" }}>
                                {mo.shadeLossPct}%{mo.shadeFrom != null ? " (" + ivHM(mo.shadeFrom) + "–" + ivHM(mo.shadeTo) + ")" : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── สภาพอากาศเฉลี่ยของเดือนที่เลือก ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="cloud" size={13} />สภาพอากาศเฉลี่ยเดือน{SC_MON[isFinite(monthNow) ? monthNow : 6]}<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{ivMain && ivMain.irr.measured ? "ใช้ค่าที่วัดได้จริง" : "ค่าเฉลี่ยรายเดือนของไทย"}</span></span>
                  {/* เลือกเดือน — ทุกอย่างในหน้านี้อ้างอิงวันตัวแทนของเดือนนั้น */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {SC_MON.map((mm, i) => (
                      <button key={i} className="p3-chip" data-on={i === monthNow ? "1" : "0"}
                        onClick={() => setSite({ date: (siteDate.slice(0, 4) || "2026") + "-" + String(i + 1).padStart(2, "0") + "-15" })}
                        style={{ padding: "5px 9px", fontSize: 10.5 }}>{mm}</button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(126px,1fr))", gap: 9 }}>
                    <label className="p3-f">
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span>เวลาในวัน</span>
                        <span className={"su-src " + (hourAuto ? "stock" : "edit")}>{hourAuto ? "ระบบเลือกให้" : "เลือกเอง"}</span>
                        {!hourAuto && <button className="p3-lnk" style={{ marginLeft: "auto", fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ hour: null }); }}>อัตโนมัติ</button>}
                      </span>
                      <input className="p3-inp" type="time" value={(() => { const hh = Math.floor(simHour), mm = Math.round((simHour - hh) * 60);
                        return String(hh).padStart(2, "0") + ":" + String(mm === 60 ? 0 : mm).padStart(2, "0"); })()}
                        onChange={(e) => { const p = (e.target.value || "12:00").split(":");
                          setSite({ hour: scClamp(+p[0] + (+p[1] || 0) / 60, 4, 20) }); }} />
                    </label>
                    {/* เติมค่าจำลองของเดือนนั้นให้เห็นเป็นตัวเลขจริง ไม่ใช่ช่องว่าง — แก้ทับได้ */}
                    <label className="p3-f">
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>อุณหภูมิอากาศกลางวัน</span>
                        <span className={"su-src " + (site.tAmb == null ? "stock" : "edit")}>{site.tAmb == null ? "เฉลี่ยเดือนนี้" : "แก้เอง"}</span>
                        {site.tAmb != null && <button className="p3-lnk" style={{ fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ tAmb: null }); }}>คืนค่า</button>}
                      </span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5"
                          value={site.tAmb == null ? SC_TAMB[isFinite(monthNow) ? monthNow : 6] : site.tAmb}
                          onChange={(e) => setSite({ tAmb: e.target.value === "" ? null : +e.target.value })} />
                        <span className="p3-sfx">°C</span></span></label>
                    <label className="p3-f"><span className="lb">ความเร็วลม</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" step="0.5" value={site.wind} onChange={(e) => setSite({ wind: Math.max(0, +e.target.value || 0) })} />
                        <span className="p3-sfx">m/s</span></span></label>
                    <label className="p3-f">
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ความเข้มแสงบนพื้นราบ</span>
                        <span className={"su-src " + (site.ghi == null ? "stock" : "edit")}>{site.ghi == null ? "จำลอง" : "แก้เอง"}</span>
                        {site.ghi != null && <button className="p3-lnk" style={{ fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ ghi: null }); }}>คืนค่า</button>}
                      </span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" step="10"
                          value={site.ghi == null ? (simRow ? simRow.ghi : "") : site.ghi}
                          onChange={(e) => setSite({ ghi: e.target.value === "" ? null : +e.target.value })} />
                        <span className="p3-sfx">W/m²</span></span></label>
                    <label className="p3-f"><span className="lb">อายุระบบ ณ วันวัด</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" max="30" step="0.5" value={site.age} onChange={(e) => setSite({ age: scClamp(+e.target.value || 0, 0, 30) })} />
                        <span className="p3-sfx">ปี</span></span></label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label className="p3-f"><span className="lb">วิธียึดแผง (มีผลกับความร้อนสะสม)</span>
                      <select className="p3-inp" value={site.mount} onChange={(e) => setSite({ mount: e.target.value })}>
                        {Object.keys(IV_MOUNT).map((k) => <option key={k} value={k}>{IV_MOUNT[k].label} — {IV_MOUNT[k].note}</option>)}
                      </select></label>
                    {/* เงา: อ่านจากโมเดล 3 มิติให้อัตโนมัติ หรือจะกรอกเองก็ได้ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="lb" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>
                        เงาบังตอนวัด
                        <span className={"su-src " + (shadeAuto ? "stock" : "edit")}>{shadeAuto ? "จากโมเดล 3 มิติ" : "กรอกเอง"}</span>
                        <button className="p3-lnk" style={{ marginLeft: "auto", fontSize: 9.5 }}
                          onClick={(e) => { e.preventDefault(); setSite({ shadeAuto: !shadeAuto }); }}>
                          {shadeAuto ? "กรอกเอง" : "ให้ระบบคิดจากผัง 3 มิติ"}
                        </button>
                      </span>
                      {shadeAuto ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minHeight: 30 }}>
                          {ivRows.map((r) => (
                            <span key={r.u.id} className="p3-stat" style={{ color: r.shade >= 10 ? "#B91C1C" : r.shade > 0 ? "#B45309" : undefined }}>
                              {r.u.name} <b>{scR(r.shade, 1)}%</b>
                            </span>
                          ))}
                          {!ivRows.some((r) => r.shade > 0.5) && (
                            <span className="p3-stat" style={{ color: "var(--acd)" }}><P3Icon name="check" size={12} />ไม่มีเงาบังเลยในเวลานี้</span>
                          )}
                        </div>
                      ) : (
                        <P3NumRange span label="" value={site.shade} min={0} max={60} step={1} suffix="%" onChange={(v) => setSite({ shade: v })} />
                      )}
                    </div>
                  </div>
                  {ivMain && !ivMain.irr.night && (
                    <React.Fragment>
                      <span className="p3-eb" style={{ marginTop: 3 }}>แสงที่ตกบนหน้าแผงจริง ({ivMain.u.name} · เอียง {scR(ivMain.u.tilt, 0)}° ทิศ {scR(ivMain.u.az, 0)}°)<span className="ln" />
                        <span style={{ fontWeight: 700, color: "var(--acd)" }}>{ivMain.irr.poaNet} W/m²</span></span>
                      <SuLightBar irr={ivMain.irr} />
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                        <span className="p3-stat" title="แสงรวมที่ตกบนพื้นราบ">แสงบนพื้นราบ <b>{ivMain.irr.ghi}</b> W/m²</span>
                        <span className="p3-stat" title="มุมระหว่างลำแสงกับเส้นตั้งฉากหน้าแผง — ยิ่งน้อยยิ่งได้แสงเต็ม">มุมตกกระทบ <b>{ivMain.irr.aoi}°</b></span>
                        <span className="p3-stat" title="แสงที่สะท้อนออกจากผิวกระจกเมื่อแสงเข้าเฉียง">ผ่านผิวกระจก <b>{scR(ivMain.irr.iam * 100, 1)}%</b></span>
                        <span className="p3-stat" style={{ color: ivMain.irr.tiltGain >= 1 ? "var(--acd)" : "#B45309" }}
                          title="มุมเอียงหลังคาทำให้ได้แสงมากกว่า/น้อยกว่าพื้นราบเท่าไหร่">
                          มุมหลังคา{ivMain.irr.tiltGain >= 1 ? "ช่วยเพิ่ม" : "ทำให้ลด"} <b>{scR(Math.abs(ivMain.irr.tiltGain - 1) * 100, 1)}%</b></span>
                        <span className="p3-stat">ดวงอาทิตย์สูง <b>{ivMain.irr.alt}°</b> ทิศ <b>{ivMain.irr.az}°</b></span>
                      </div>
                      <span className="p3-eb" style={{ marginTop: 3 }}><P3Icon name="thermo" size={12} />ความร้อนสะสมหน้าแผง<span className="ln" />
                        <span style={{ fontWeight: 600 }}>{ivMain.temp.label}</span></span>
                      <SuThermo temp={ivMain.temp} />
                      <span className="p3-note">
                        แผงไม่ได้ร้อนเท่าอากาศ — แสงที่ไม่ได้แปลงเป็นไฟจะกลายเป็นความร้อนค้างอยู่หลังแผง ยิ่งยึดชิดหลังคายิ่งระบายไม่ออก
                        ตอนนี้เซลล์ร้อน <b>{ivMain.temp.tCell}°C</b> คือสูงกว่ามาตรฐาน 25°C อยู่ {scR(ivMain.temp.tCell - 25, 1)}°C
                        → กำลังหายไป <b>{scR(Math.abs(scNum(panel.tcPmax, -0.29)) * (ivMain.temp.tCell - 25), 1)}%</b> จากสัมประสิทธิ์อุณหภูมิของแผงรุ่นนี้ ({scNum(panel.tcPmax, -0.29)} %/°C)
                      </span>
                    </React.Fragment>
                  )}
                  {ivMain && ivMain.irr.night && (
                    <div className="su-alert warn"><P3Icon name="height" size={14} />เวลาที่เลือกดวงอาทิตย์ยังไม่ขึ้น/ตกแล้ว — เลือกช่วง 8:00–16:00 จะวัดได้แม่นที่สุด</div>
                  )}
                </div>

                {/* ── เส้น I-V (รวมทุกสตริง · กดในตารางเพื่อเจาะดูทีละเส้น) ── */}
                {ivMain && ivMain.a && ivMain.a.exp && (
                  <div className="p3-card">
                    <span className="p3-eb"><P3Icon name="curve" size={13} />
                      เส้น I-V {ivCur ? "ของ" + ivCur.u.name : "รวมทุก" + (isMicro ? "กลุ่ม" : "สตริง")}<span className="ln" />
                      {ivCur ? (
                        <button className="p3-lnk" style={{ fontSize: 10 }} onClick={() => setIvSel(null)}>
                          <P3Icon name="layers" size={12} />แสดงทั้งหมด
                        </button>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{ivRows.length} เส้น · {ivMain.a.cond.g} W/m² · เซลล์ {scR(ivMain.a.cond.tc, 0)}°C</span>
                      )}
                    </span>
                    <SuIvChart focusId={ivSel} stcRef={ivMain.a.expStc}
                      curves={ivRows.map((r, i) => (r.a && r.a.exp
                        ? { id: r.u.id, name: r.u.name, curve: r.a.exp, color: suColor(r.u.sid || i + 1) } : null)).filter(Boolean)}
                      meas={ivCur && ivCur.a.stc ? { voc: scNum(ivCur.m.voc), isc: scNum(ivCur.m.isc), vmp: scNum(ivCur.m.vmp), imp: scNum(ivCur.m.imp), pmax: scNum(ivCur.m.pmax) } : null} />
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>
                      {ivCur
                        ? <span><b style={{ color: suColor(ivCur.u.sid || 1) }}>━</b> {ivCur.u.name}</span>
                        : ivRows.map((r, i) => <span key={r.u.id}><b style={{ color: suColor(r.u.sid || i + 1) }}>━</b> {r.u.name}</span>)}
                      <span><b style={{ color: "var(--text-3)" }}>┅</b> ที่มาตรฐาน STC (1000 W/m² · 25°C)</span>
                      {ivCur && <span><b style={{ color: "#D97706" }}>┅</b> กำลังไฟ (แกนขวา)</span>}
                      {ivCur && ivCur.a.stc && <span><b style={{ color: "#2563EB" }}>●</b> ที่วัดได้จริง</span>}
                    </div>

                    {/* ── เงาบังนิดเดียวแต่ฉุดทั้งสตริง ── */}
                    {ivCur && ivCur.el && ivCur.el.geo > 0 && (
                      <div className="su-alert warn"><P3Icon name="height" size={14} />
                        <span>
                          <b>สตริงนี้โดนเงาบังในเวลานี้</b> — เงาบังพื้นที่จริง <b>{scR(ivCur.el.geo * 100, 1)}%</b>
                          แต่แผงต่ออนุกรมกัน กระแสไหลได้เท่าตัวที่แย่ที่สุด ไดโอดบายพาสจึงตัดท่อนที่โดนบังทิ้ง
                          <b> {ivCur.el.subLost} จาก {ivCur.el.subTotal} ท่อน</b> →
                          กำลังหายจริง <b style={{ color: "#B91C1C" }}>{scR(ivCur.el.elec * 100, 1)}%</b>
                          {ivCur.el.geo > 0 ? " (แรงกว่าคิดตามพื้นที่ " + scR(ivCur.el.elec / Math.max(0.0001, ivCur.el.geo), 1) + " เท่า)" : ""}
                          {" · เส้นเขียวหักผลนี้ไปแล้ว"}
                        </span>
                      </div>
                    )}

                    {/* ── ค่าที่ควรได้ ทุกสตริง — กดแถวเพื่อเจาะดูเส้นเดียว ── */}
                    <span className="p3-eb" style={{ marginTop: 3 }}>ค่าที่ควรได้ของทุก{isMicro ? "กลุ่ม" : "สตริง"} ณ เวลานี้<span className="ln" />
                      <span style={{ fontWeight: 600 }}>กดแถวเพื่อดูทีละเส้น</span></span>
                    <div className="su-scroll">
                      <table className="su-tb su-pick-row">
                        <thead><tr><th></th><th>แผง</th><th>แสง</th><th>เซลล์</th><th>Voc</th><th>Isc</th><th>Vmp</th><th>Imp</th><th>Pmax</th></tr></thead>
                        <tbody>
                          {ivRows.map((r, i) => r.a && r.a.exp && (
                            <tr key={r.u.id} data-on={ivSel === r.u.id ? "1" : "0"}
                              onClick={() => setIvSel(ivSel === r.u.id ? null : r.u.id)}
                              title={ivSel === r.u.id ? "กดอีกครั้งเพื่อกลับไปดูรวมทุกเส้น" : "กดเพื่อดูเฉพาะเส้นนี้"}>
                              <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 9, height: 9, borderRadius: 99, background: suColor(r.u.sid || i + 1) }} />
                                <b>{r.u.name}</b></span></td>
                              <td>{r.u.n}</td>
                              <td>{r.a.cond.g}</td><td>{scR(r.a.cond.tc, 0)}°C</td>
                              <td>{scR(r.a.exp.voc, 1)}</td><td>{scR(r.a.exp.isc, 2)}</td>
                              <td>{scR(r.a.exp.vmp, 1)}</td><td>{scR(r.a.exp.imp, 2)}</td>
                              <td><b>{scR(r.a.exp.pmax, 0)}</b> W</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <span className="p3-note">หน่วย: แสง W/m² · Voc/Vmp เป็นโวลต์ · Isc/Imp เป็นแอมป์ — พกตารางนี้ไปหน้างานได้เลย ถ้าวัดได้ต่างจากนี้เกิน 5% ค่อยไล่หาสาเหตุ</span>

                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(1)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(3)}>ถัดไป · ผลผลิต<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}

            {/* ══ ขั้น 4 · ผลผลิต ══ */}
            {step === 3 && energy && life && (
              <React.Fragment>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  {[["ผลผลิตปีแรก", life.rows[0].kwh.toLocaleString(), "kWh"],
                    ["ต่อกำลังติดตั้ง", energy.perKwp.toLocaleString(), "kWh/kWp/ปี"],
                    ["Performance Ratio", energy.pr, "%"],
                    ["รวม " + S.years + " ปี", Math.round(life.total / 1000).toLocaleString(), "MWh"]].map(([k, v, u]) => (
                    <div key={k} className="p3-card" style={{ gap: 3, padding: "12px 13px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{k}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.5px", lineHeight: 1.15 }}>{v}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{u}</span>
                    </div>
                  ))}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="sun" size={13} />ผลผลิตรายเดือน (ปีแรก)<span className="ln" /><span style={{ fontWeight: 600 }}>kWh</span></span>
                  <SuMonthly data={energy.monthly} />
                  <span className="p3-note">คิดจากตำแหน่งดวงอาทิตย์จริงที่ละติจูด {scR(scNum(st.sun && st.sun.lat, 13.75), 2)}° ตกกระทบระนาบเอียงของแต่ละกลุ่มแผง แล้วหักอุณหภูมิเซลล์ตามสภาพอากาศรายเดือน</span>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="layers" size={13} />แยกตามกลุ่มทิศทาง<span className="ln" /></span>
                  <div className="su-scroll">
                    <table className="su-tb">
                      <thead><tr><th>กลุ่ม</th><th>เอียง</th><th>ทิศ</th><th>แผง</th><th>kWp</th><th>เงาบัง</th><th>kWh/kWp</th><th>kWh/ปี</th></tr></thead>
                      <tbody>
                        {energy.perGroup.map((g) => (
                          <tr key={g.key}>
                            <td style={{ maxWidth: 170, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.roofName}{g.side ? " · " + g.side : ""}</td>
                            <td>{g.tilt}°</td><td>{g.az}°</td><td>{g.count}</td><td>{g.kwp}</td>
                            <td style={{ color: g.shade >= 5 ? "#B45309" : undefined }}>{g.shade || 0}%</td>
                            <td>{g.kwhPerKwp.toLocaleString()}</td><td><b>{g.kwh.toLocaleString()}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="p3-note">ตัวเลขนี้ยังไม่หักค่าสูญเสียอื่น — ดูค่าหลังหักที่การ์ดด้านบน</span>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="reset" size={13} />ค่าเสื่อม {S.years} ปี<span className="ln" />
                    <span style={{ fontWeight: 600 }}>ปีสุดท้ายเหลือ {life.lastPct}%</span></span>
                  <SuLifeChart rows={life.rows} />
                  <div className="su-scroll">
                    <table className="su-tb">
                      <thead><tr><th>ปี</th>{life.rows.map((r) => <th key={r.year} style={{ textAlign: "right" }}>{r.year}</th>)}</tr></thead>
                      <tbody>
                        <tr><td style={{ fontWeight: 700 }}>kWh</td>{life.rows.map((r) => <td key={r.year} style={{ textAlign: "right" }}>{Math.round(r.kwh / 100) / 10}k</td>)}</tr>
                        <tr><td style={{ fontWeight: 700 }}>เหลือ %</td>{life.rows.map((r) => <td key={r.year} style={{ textAlign: "right" }}>{r.factor}</td>)}</tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── เงาบังทั้งปี คำนวณจากโมเดล 3 มิติ ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="tree" size={13} />เงาบังตลอดทั้งปี<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{shade3d ? "คำนวณจากโมเดล 3 มิติแล้ว" : "ยังใช้ค่า % ที่กรอกมือ"}</span></span>
                  {!shade3d ? (
                    <React.Fragment>
                      <span className="p3-note" style={{ marginTop: -2 }}>
                        ตอนนี้ปิดการคิดเงาจากโมเดลไว้ ใช้ % ที่กรอกเองด้านล่างแทน
                      </span>
                      <button className="p3-b pri" style={{ alignSelf: "flex-start" }} onClick={() => set({ shadeOff: false })}>
                        <P3Icon name="sunShadow" size={14} />ให้ระบบคิดเงาจากโมเดล 3 มิติ
                      </button>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span className="p3-stat">เงาเชิงพื้นที่ <b>{shade3d.geoOnly}%</b></span>
                        <span className="p3-stat" style={{ color: "#B91C1C" }}>+ ผลฉุดทั้งสตริง <b>{shade3d.elecExtra}%</b></span>
                        <span className="p3-stat" style={{ color: shade3d.overall >= 5 ? "#B45309" : "var(--acd)", fontWeight: 800 }}>
                          = เสียจริง <b>{shade3d.overall}%</b> ต่อปี</span>
                        <span className="p3-stat">ตัวอาคาร/หลังคา <b>{shade3d.buildings}</b> ชิ้น</span>
                        <span className="p3-stat">สิ่งบดบังในผัง <b>{shade3d.obstacles}</b> ชิ้น</span>
                      </div>
                      {/* ตั้งค่าโมเดลไฟฟ้า */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 9, borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                        <label className="p3-f">
                          <span className="lb" title="ไดโอดตัวเล็กในกล่องต่อสายหลังแผง ทำหน้าที่เป็นทางลัดให้กระแสเดินอ้อมส่วนที่โดนเงา ถ้าไม่มีมันเซลล์ที่โดนบังจะร้อนจัดจนไหม้">
                            ไดโอดบายพาสต่อแผง</span>
                          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input className="p3-inp" type="number" min="1" max="6" step="1" value={elecCfg.diodes}
                              onChange={(e) => setElec({ diodes: scClamp(+e.target.value || 3, 1, 6) })} />
                            <span className="p3-sfx">ท่อน</span></span></label>
                        <label className="p3-f"><span className="lb" title="PVsyst แนะนำ 60–80% สำหรับเงาไม่สม่ำเสมอ · 100% สำหรับแถวบังแถว">สัดส่วนผลทางไฟฟ้า</span>
                          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                            <input className="p3-inp" type="number" min="0" max="100" step="5" value={elecCfg.kElec}
                              onChange={(e) => setElec({ kElec: scClamp(+e.target.value || 80, 0, 100) })} />
                            <span className="p3-sfx">%</span></span></label>
                        <label className="p3-f">
                          <span className="lb" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span>แผงครึ่งเซลล์</span>
                            <span className={"su-src " + ((S.elec && S.elec.halfCut != null) ? "edit" : "stock")}>
                              {(S.elec && S.elec.halfCut != null) ? "แก้เอง" : hc.why}</span>
                          </span>
                          <button className="p3-b sm" onClick={() => setElec({ halfCut: !elecCfg.halfCut })}
                            title="แผงครึ่งเซลล์ทนเงาได้ดีกว่าเฉพาะเมื่อวางตั้งและเงาเป็นแถบแนวนอนเต็มความกว้าง (เช่น แถวหน้าบังแถวหลัง) — เงาต้นไม้/ปล่องเป็นหย่อมไม่เข้าข่าย">
                            <P3Icon name={elecCfg.halfCut ? "check" : "plus"} size={13} />{elecCfg.halfCut ? "ใช่ · ทนเงาแถบแนวนอน" : "ไม่ใช่ / เงาเป็นหย่อม"}
                          </button>
                        </label>
                      </div>
                      <span className="p3-note">
                        <b>ไดโอดบายพาสคืออะไร</b> — ไดโอดตัวเล็ก ๆ ในกล่องต่อสายหลังแผง (ปกติ 3 ตัว แบ่งแผงเป็น 3 ท่อน)
                        ทำหน้าที่เป็นทางลัดให้กระแสเดินอ้อมส่วนที่โดนเงา ถ้าไม่มีมัน เซลล์ที่โดนบังจะกลายเป็นตัวต้านทานร้อนจัดจนแผงไหม้ (hot spot)
                        มันจึงยอมตัดท่อนนั้นทิ้งแทน — นี่คือเหตุผลที่เงานิดเดียวเสียกำลังเป็นก้อน ไม่ได้เสียตามสัดส่วนพื้นที่
                      </span>
                      <div className="su-scroll">
                        <table className="su-tb">
                          <thead><tr><th>กลุ่มทิศทาง</th><th>แผง</th><th>เงาบัง</th><th></th></tr></thead>
                          <tbody>
                            {groups.map((g) => {
                              const v = scNum(shade3d.byGroup[g.key], 0);
                              return (
                                <tr key={g.key}>
                                  <td style={{ maxWidth: 210, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.label}</td>
                                  <td>{g.count}</td>
                                  <td style={{ fontWeight: 800, color: v >= 8 ? "#B91C1C" : v >= 3 ? "#B45309" : "var(--acd)" }}>{v}%</td>
                                  <td style={{ width: 110 }}>
                                    <span className="su-bar" style={{ display: "block", height: 6 }}>
                                      <span style={{ width: scClamp(v * 5, 0, 100) + "%", background: v >= 8 ? "#DC2626" : v >= 3 ? "#D97706" : "#22A35B" }} />
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {!!(shade3d.worst || []).length && (
                        <React.Fragment>
                          <span className="p3-eb" style={{ marginTop: 2 }}>แผงที่โดนบังหนักที่สุด<span className="ln" /></span>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {shade3d.worst.map((w) => (
                              <span key={w.uid} className="p3-chip" style={{ cursor: "default", color: w.pct >= 15 ? "#B91C1C" : "#B45309" }}>
                                {w.roofName} · {w.key} <b>{w.pct}%</b>
                              </span>
                            ))}
                          </div>
                          <span className="p3-note">แผงพวกนี้ถ้าย้ายที่ไม่ได้ ควรแยกไปสตริงของมันเอง หรือใช้ออปติไมเซอร์ — ไม่งั้นจะฉุดทั้งสตริงลงมา</span>
                        </React.Fragment>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="p3-b sm" onClick={() => set({ shadeOff: true })}>กลับไปกรอก % เอง</button>
                      </div>
                      <span className="p3-note">
                        คิดใหม่ให้เองทุกครั้งที่แก้ผัง 3 มิติ — ตัวเลขผลผลิตด้านบนหักเงาชุดนี้ไปแล้ว ·
                        นับเฉพาะลำแสงตรงที่โดนบัง (แสงฟุ้งจากท้องฟ้ายังเข้าถึงแผงได้อยู่) ·
                        นับตัวอาคาร/ผิวหลังคา สิ่งบดบังที่สำรวจไว้ และแผงที่บังกันเอง
                      </span>
                    </React.Fragment>
                  )}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="height" size={13} />ค่าสูญเสียของระบบ<span className="ln" />
                    <span style={{ fontWeight: 600 }}>รวม {energy.dcLoss}% ฝั่ง DC{shade3d ? " + เงา " + energy.shadeLoss + "%" : ""}</span></span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 18px" }}>
                    {[["soil", "ฝุ่น/คราบบนแผง"], ["mismatch", "แผงไม่เท่ากัน (mismatch)"], ["wire", "สูญเสียในสาย DC"]]
                      .concat(shade3d ? [] : [["shade", "เงาบัง"]]).concat([["avail", "ระบบหยุด/ซ่อมบำรุง"]]).map(([k, lb]) => (
                      <P3NumRange key={k} span label={lb} value={S.loss[k]} min={0} max={15} step={0.5} suffix="%"
                        onChange={(v) => set({ loss: Object.assign({}, S.loss, { [k]: v }) })} />
                    ))}
                  </div>
                  {energy.clipLoss > 0.2 && (
                    <div className={"su-alert " + (energy.clipLoss > 8 ? "bad" : "warn")}><P3Icon name="height" size={14} />
                      <span>DC/AC = {energy.dcAc} → อินเวอร์เตอร์รับไม่หมดช่วงแดดแรง ถูกตัดทิ้ง <b>{energy.clipKwh.toLocaleString()} kWh/ปี ({energy.clipLoss}%)</b>
                        {energy.clipLoss > 8 ? " — เพิ่มขนาด/จำนวนอินเวอร์เตอร์คุ้มกว่ามาก" : " — ปกติของการออกแบบให้ DC มากกว่า AC เล็กน้อย"}</span></div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <button className="p3-b" onClick={() => setStep(2)}>ย้อนกลับ</button>
                  <label className="p3-f" style={{ width: 108 }}>
                    <span className="lb">จำนวนปี</span>
                    <input className="p3-inp" type="number" min="1" max="30" step="1" value={S.years} onChange={(e) => set({ years: scClamp(+e.target.value || 15, 1, 30) })} />
                  </label>
                  <span style={{ flex: 1 }} />
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={() => setStep(4)}>ถัดไป · คืนทุน<P3Icon name="arrow" size={14} /></button>
                </div>
              </React.Fragment>
            )}
            {step === 3 && !energy && (
              <div className="su-alert warn"><P3Icon name="height" size={14} />ยังคำนวณไม่ได้ — ต้องมีแผงในผังและเลือกรุ่นแผงก่อน</div>
            )}

            {/* ══ ขั้น 5 · คืนทุน & ROI ══ */}
            {step === 4 && roi && (
              <React.Fragment>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                  {[["คืนทุนภายใน", roi.payback ? roi.payback : "ไม่คืนใน " + roi.years, roi.payback ? "ปี" : "ปี", roi.payback && roi.payback <= 8],
                    ["ผลตอบแทน IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี", roi.irr != null && roi.irr >= 8],
                    ["มูลค่าปัจจุบันสุทธิ", Math.round(roi.npv / 1000).toLocaleString(), "พันบาท", roi.npv > 0],
                    ["ต้นทุนไฟที่ผลิตเอง", roi.lcoe, "บาท/หน่วย", roi.lcoe < scNum(roiCfg.tariff)]].map(([k, v, u, good]) => (
                    <div key={k} className="p3-card" style={{ gap: 3, padding: "12px 13px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{k}</span>
                      <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.5px", lineHeight: 1.15, color: good ? "var(--acd)" : "var(--text-1)" }}>{v}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{u}</span>
                    </div>
                  ))}
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="coin" size={13} />เงินลงทุนและค่าไฟ<span className="ln" /></span>
                  <div className="su-pick" style={{ gap: 8 }}>
                    {[["perWp", "คิดเป็นบาทต่อวัตต์", "เหมาะกับตอนเสนอราคา — ระบบคูณกำลังติดตั้งให้เอง"],
                      ["lump", "กรอกยอดรวมทั้งโครงการ", "ใช้ยอดตามสัญญาจริง รวมทุกอย่างแล้ว"]].map(([k, h, d]) => (
                      <button key={k} data-on={roiCfg.costMode === k ? "1" : "0"} onClick={() => setRoi({ costMode: k })}>
                        <span className="h">{h}</span><span className="d">{d}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(126px,1fr))", gap: 9 }}>
                    {roiCfg.costMode === "perWp" ? (
                      <label className="p3-f"><span className="lb">ราคาต่อวัตต์</span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <input className="p3-inp" type="number" step="0.5" value={roiCfg.perWp} onChange={(e) => setRoi({ perWp: +e.target.value || 0 })} />
                          <span className="p3-sfx">บาท/W</span></span></label>
                    ) : (
                      <label className="p3-f"><span className="lb">ยอดรวมทั้งโครงการ</span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <input className="p3-inp" type="number" step="1000" value={roiCfg.lump} onChange={(e) => setRoi({ lump: +e.target.value || 0 })} />
                          <span className="p3-sfx">บาท</span></span></label>
                    )}
                    <label className="p3-f"><span className="lb">ค่าไฟที่ประหยัดได้</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.05" value={roiCfg.tariff} onChange={(e) => setRoi({ tariff: +e.target.value || 0 })} />
                        <span className="p3-sfx">บาท/หน่วย</span></span></label>
                    <label className="p3-f"><span className="lb">ค่าไฟขึ้นปีละ</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5" value={roiCfg.escal} onChange={(e) => setRoi({ escal: +e.target.value || 0 })} />
                        <span className="p3-sfx">%</span></span></label>
                    <label className="p3-f"><span className="lb">ขายคืนหน่วยละ</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.05" value={roiCfg.exportRate} onChange={(e) => setRoi({ exportRate: +e.target.value || 0 })} />
                        <span className="p3-sfx">บาท</span></span></label>
                    <label className="p3-f"><span className="lb">ค่าดูแลรักษาต่อปี</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.1" value={roiCfg.om} onChange={(e) => setRoi({ om: +e.target.value || 0 })} />
                        <span className="p3-sfx">% ของค่าติดตั้ง</span></span></label>
                    <label className="p3-f"><span className="lb">อัตราคิดลด</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="0.5" value={roiCfg.discount} onChange={(e) => setRoi({ discount: +e.target.value || 0 })} />
                        <span className="p3-sfx">%</span></span></label>
                    <label className="p3-f"><span className="lb">มองไปข้างหน้า</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="5" max="30" step="1" value={roiCfg.years} onChange={(e) => setRoi({ years: scClamp(+e.target.value || 25, 5, 30) })} />
                        <span className="p3-sfx">ปี</span></span></label>
                    <label className="p3-f"><span className="lb">เปลี่ยนอินเวอร์เตอร์ปีที่</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" min="0" max="30" step="1" value={roiCfg.invRepYear} onChange={(e) => setRoi({ invRepYear: +e.target.value || 0 })} />
                        <span className="p3-sfx">ปี</span></span></label>
                    <label className="p3-f"><span className="lb">ค่าเปลี่ยนอินเวอร์เตอร์</span>
                      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <input className="p3-inp" type="number" step="1000" value={roiCfg.invRepCost} onChange={(e) => setRoi({ invRepCost: +e.target.value || 0 })} />
                        <span className="p3-sfx">บาท</span></span></label>
                  </div>
                  <P3NumRange label="ไฟที่ผลิตได้ ใช้เองกี่ %" value={roiCfg.selfUse} min={0} max={100} step={5} suffix="%"
                    onChange={(v) => setRoi({ selfUse: v })} />
                  <span className="p3-note">
                    ส่วนที่ใช้เองคิดที่ค่าไฟเต็ม <b>{roiCfg.tariff} บาท/หน่วย</b> · ส่วนที่เหลือ {100 - scNum(roiCfg.selfUse)}% คิดที่ราคาขายคืน <b>{roiCfg.exportRate} บาท</b> —
                    ยิ่งใช้ไฟกลางวันเองมาก ยิ่งคืนทุนเร็ว ปรับสไลเดอร์ดูผลได้ทันที
                  </span>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="curve" size={13} />กระแสเงินสดสะสม<span className="ln" />
                    <span style={{ fontWeight: 600 }}>ลงทุน {roi.capex.toLocaleString()} บาท ({roi.perWp} บาท/W)</span></span>
                  <SuCash roi={roi} />
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
                    <span className="p3-stat">ประหยัดปีแรก <b>{roi.rows[0].net.toLocaleString()}</b> บาท</span>
                    <span className="p3-stat">รวม {roi.years} ปี <b>{Math.round(roi.totalSave / 1000).toLocaleString()}</b> พันบาท</span>
                    <span className="p3-stat">กำไรสุทธิ <b>{Math.round(roi.netTotal / 1000).toLocaleString()}</b> พันบาท</span>
                    <span className="p3-stat">ผลิตรวม <b>{Math.round(roi.totalKwh / 1000).toLocaleString()}</b> MWh</span>
                  </div>
                </div>

                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="doc" size={13} />ตารางกระแสเงินสด<span className="ln" /></span>
                  <div className="su-scroll" style={{ maxHeight: 320, overflowY: "auto" }}>
                    <table className="su-tb">
                      <thead><tr><th>ปี</th><th>ผลผลิต</th><th>เหลือ %</th><th>ประหยัดค่าไฟ</th><th>ขายคืน</th><th>ค่าดูแล</th><th>สุทธิ</th><th>สะสม</th></tr></thead>
                      <tbody>
                        {roi.rows.map((r) => (
                          <tr key={r.year} data-on={roi.payback && Math.ceil(roi.payback) === r.year ? "1" : "0"}>
                            <td><b>{r.year}</b></td>
                            <td>{r.kwh.toLocaleString()}</td><td>{r.keep}</td>
                            <td>{r.save.toLocaleString()}</td><td>{r.sell.toLocaleString()}</td>
                            <td>{(r.om + r.rep).toLocaleString()}</td>
                            <td><b>{r.net.toLocaleString()}</b></td>
                            <td style={{ color: r.cum >= 0 ? "var(--acd)" : "var(--text-3)", fontWeight: 800 }}>{r.cum.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="p3-note">หน่วยเป็นบาท · ผลผลิตลดลงทุกปีตามค่าเสื่อมของแผง ส่วนค่าไฟเพิ่มขึ้นปีละ {roiCfg.escal}% ตามที่ตั้งไว้</span>
                </div>

                {/* ── ภาพผัง 3 มิติที่จะแนบไปในรายงาน ── */}
                <div className="p3-card">
                  <span className="p3-eb"><P3Icon name="cube" size={13} />ภาพผัง 3 มิติในรายงาน<span className="ln" />
                    <span style={{ fontWeight: 600 }}>{snapImg ? "พร้อมแนบ" : "ยังไม่มีภาพ"}</span></span>
                  {snapImg ? (
                    <img src={snapImg} alt="ผัง 3 มิติ" style={{ width: "100%", maxHeight: 260, objectFit: "contain",
                      borderRadius: 11, border: "1px solid var(--ln)", background: "var(--surface2)", display: "block" }} />
                  ) : (
                    <span className="p3-note" style={{ margin: 0 }}>ยังถ่ายภาพฉาก 3 มิติไม่ได้ — รายงานจะออกได้ปกติ แค่ไม่มีรูปประกอบ</span>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="p3-b sm" disabled={typeof snap !== "function"}
                      onClick={() => { const u = snap && snap(); if (u) setSnapImg(u); }}>
                      <P3Icon name="camera" size={13} />ถ่ายใหม่
                    </button>
                    <span className="p3-note" style={{ margin: 0, border: "none", padding: 0 }}>
                      อยากได้มุมอื่น — กด “เสร็จ” กลับไปหมุนกล้องในโหมด 3 มิติให้ได้มุมที่ชอบ แล้วเปิดหน้านี้ใหม่ ระบบจะถ่ายมุมนั้นให้
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                  <button className="p3-b" onClick={() => setStep(3)}>ย้อนกลับ</button>
                  <button className="p3-b pri" style={{ padding: "10px 20px" }} onClick={doReport}>
                    <P3Icon name="doc" size={14} />ออกรายงาน PDF
                  </button>
                </div>
              </React.Fragment>
            )}
            {step === 4 && !roi && (
              <div className="su-alert warn"><P3Icon name="height" size={14} />ยังคำนวณคืนทุนไม่ได้ — ต้องมีผลผลิตก่อน (กลับไปขั้นผลผลิต)</div>
            )}
          </div>
        </div>
      </div>

      {/* สรุปติดขอบล่าง เห็นตลอดทุกขั้นตอน */}
      <div className="su-foot">
        <span className="su-kpi"><span className="k">กำลังติดตั้ง DC</span><span className="v">{energy ? energy.dcKw : 0}<small>kWp</small></span></span>
        <span className="su-kpi"><span className="k">อินเวอร์เตอร์ AC</span><span className="v">{acKw || 0}<small>kW</small></span></span>
        <span className="su-kpi"><span className="k">DC/AC</span>
          <span className="v" style={{ color: energy && (energy.dcAc > 1.4 || (energy.dcAc && energy.dcAc < 0.85)) ? "#B45309" : undefined }}>{energy ? energy.dcAc : "—"}</span></span>
        <span className="su-kpi"><span className="k">{isMicro ? "ไมโคร" : "สตริง"}</span>
          <span className="v">{isMicro ? (microSel ? microSel.units : 0) : (plan ? plan.strings.length : 0)}<small>{isMicro ? "ตัว" : "สตริง"}</small></span></span>
        <span className="su-kpi"><span className="k">ผลผลิตปีแรก</span><span className="v">{life ? life.rows[0].kwh.toLocaleString() : "—"}<small>kWh</small></span></span>
        <span className="su-kpi"><span className="k">รวม {S.years} ปี</span><span className="v">{life ? Math.round(life.total / 1000).toLocaleString() : "—"}<small>MWh</small></span></span>
        <span style={{ flex: 1 }} />
        {!!warns.length && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: "#B45309", marginRight: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,.22)" }} />
            {warns.length} ข้อควรแก้
          </span>
        )}
        <button className="p3-b" style={{ padding: "10px 16px", marginRight: 8 }} onClick={doReport} disabled={!energy} title="รวมทุกขั้นตอนเป็นรายงานหน้าเดียว แล้วสั่งพิมพ์/บันทึกเป็น PDF">
          <P3Icon name="doc" size={15} />รายงาน PDF
        </button>
        <button className="p3-b pri" style={{ padding: "10px 22px" }} onClick={onClose}>
          <P3Icon name="check" size={15} />เสร็จ
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { SolarWorkspace, SuVoltBand, SuFacing, SU_CSS });
