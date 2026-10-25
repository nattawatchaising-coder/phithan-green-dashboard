/* ============================================================
   flash+solar — ภาพ/อนิเมชันของหน้า FusionSolar (docs/fusionsolar.md)
   โหลดหลัง fusionsolar-viz.jsx ก่อน fusionsolar.jsx · ไม่มีการเขียนฐานข้อมูลในไฟล์นี้

   - FsScene        อาคาร+แผงโซลาร์แบบสามมิติ (isometric) · ท้องฟ้า/ดวงอาทิตย์ตามเวลาไทย · แผงเรืองตามกำลังผลิต
                    จุดวิ่งตามทิศพลังงาน (โซลาร์→อาคาร · ขาย/ซื้อกับกริด · ชาร์จ/จ่ายแบต) ยิ่ง kW มากยิ่งเร็ว
   - FsFleetScene   ภาพรวมทุกไซต์ (หลายอาคาร) ของหน้า "ไซต์ทั้งหมด"
   - FsGauge หน้าปัดครึ่งวง · FsDonut วงสัดส่วน · FsCountUp ตัวเลขวิ่ง
   - FsKvGroups     ค่าดิบจากอุปกรณ์จัดเป็นหมวด (สถานะ · พลังงาน · ไฟสลับ · ไฟตรง/สตริง · แบต · อุณหภูมิ)
   - FsStringGrid   สตริง PV แบบแผนที่ความร้อน
   - fsExportMonthXlsx / fsExportSiteXlsx   สรุปรายเดือนเป็น Excel (xlsx-js-style · window.XLSX)

   ตั้ง "ลดการเคลื่อนไหว" ในเครื่อง (prefers-reduced-motion) = ไม่มีจุดวิ่ง/ตัวเลขวิ่ง/แผงกะพริบ (เส้นประนิ่งแทน)
   สีในภาพเป็นสีภาพประกอบ ตั้งเป็นตัวแปร --fs-* พร้อมค่าของธีมมืด
   ============================================================ */

(function fsInjectSceneCss() {
  if (document.getElementById("fs-scene-css")) return;
  const el = document.createElement("style");
  el.id = "fs-scene-css";
  el.textContent = ":root{--fs-sun:#F6A623;--fs-panel:#1D3557;--fs-panel-hi:#4C9BF0;--fs-bat:#7C5CD6;--fs-ground:#D5EBDD;--fs-ground2:#BFDFCB;"
    + "--fs-wall:#FFFFFF;--fs-wall2:#DCE5EC;--fs-roof:#C3CFD9;--fs-glass:#B9D6EE;--fs-tree:#3FA372;--fs-dim:0}"
    + "[data-theme=\"aurora\"]{--fs-bat:#9A80F0;--fs-ground:#1C3A31;--fs-ground2:#152C25;--fs-wall:#33475A;--fs-wall2:#26384A;--fs-roof:#455A6D;"
    + "--fs-glass:#4A6A86;--fs-tree:#2F8A5E;--fs-dim:.22}"
    + "@keyframes fsDash{to{stroke-dashoffset:-24}}.fs-dash{stroke-dasharray:6 6;animation:fsDash 1s linear infinite}"
    + "@keyframes fsGlow{0%,100%{opacity:.75}50%{opacity:1}}.fs-glow{animation:fsGlow 3.2s ease-in-out infinite}"
    + "@keyframes fsTwinkle{0%,100%{opacity:.25}50%{opacity:.95}}.fs-star{animation:fsTwinkle 2.8s ease-in-out infinite}"
    + "@keyframes fsSpin{to{transform:rotate(360deg)}}.fs-rays{transform-box:fill-box;transform-origin:center;animation:fsSpin 46s linear infinite}"
    + "@keyframes fsDrift{from{transform:translateX(-26px)}to{transform:translateX(26px)}}.fs-cloud{animation:fsDrift 16s ease-in-out infinite alternate}"
    + "@keyframes fsRise{from{opacity:0;transform:translate(-50%,-38%)}to{opacity:1;transform:translate(-50%,-50%)}}.fs-tag{animation:fsRise .5s ease both}"
    + "@keyframes fsIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.fs-in{animation:fsIn .45s ease both}"
    + ".fs-tr{transition:stroke-dasharray .9s cubic-bezier(.2,.8,.2,1),width .6s ease}"
    + "@keyframes fsPing{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.4);opacity:0}}"
    + ".fs-pin{position:relative;display:block;border-radius:50%;box-shadow:0 0 0 2.5px var(--surface),0 2px 6px rgba(0,0,0,.3);cursor:pointer}"
    + ".fs-pin.live::after{content:'';position:absolute;inset:0;border-radius:50%;background:inherit;animation:fsPing 2s ease-out infinite}"
    + ".fs-card-hov{transition:transform .15s ease,box-shadow .15s ease}.fs-card-hov:hover{transform:translateY(-2px);box-shadow:var(--shadow-card)}"
    + "@media (prefers-reduced-motion: reduce){.fs-dash,.fs-glow,.fs-star,.fs-rays,.fs-cloud,.fs-tag,.fs-in,.fs-pin.live::after{animation:none!important}"
    + ".fs-tr,.fs-card-hov{transition:none!important}.fs-card-hov:hover{transform:none}}";
  document.head.appendChild(el);
})();

const fsCalm = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const fsClamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* ต้นไม้ 1 ต้นดูดซับ CO₂ ราว 22 kg/ปี (ค่าที่ใช้กันทั่วไป) — ใช้เทียบให้เห็นภาพเท่านั้น */
const FS_TREE_KG = 22;

/* ── ตัวเลขวิ่งจากค่าเดิมไปค่าใหม่ ── */
function FsCountUp({ value, digits, fmt }) {
  const [shown, setShown] = React.useState(value);
  const prev = React.useRef(fsN(value) != null ? 0 : value);
  React.useEffect(() => {
    const to = fsN(value);
    if (to == null || fsCalm()) { setShown(value); prev.current = value; return; }
    const from = fsN(prev.current) || 0, t0 = performance.now(), T = 900;
    let id;
    const tick = (t) => {
      const f = Math.min(1, (t - t0) / T), e = 1 - Math.pow(1 - f, 3);
      setShown(from + (to - from) * e);
      if (f < 1) id = requestAnimationFrame(tick); else prev.current = to;
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value]);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt ? fmt(shown) : fsFmt(shown, digits)}</span>;
}

/* ── หน้าปัดครึ่งวง ── frac 0..1 · ค่าตัวเลขอยู่กลางหน้าปัด */
function FsGauge({ frac, value, unit, label, sub, color, size }) {
  const S = size || 150, sw = 11, r = S / 2 - sw, C = Math.PI * r;
  const f = frac == null || isNaN(frac) ? 0 : fsClamp(frac, 0, 1);
  const [shown, setShown] = React.useState(fsCalm() ? f : 0);
  React.useEffect(() => { const id = requestAnimationFrame(() => setShown(f)); return () => cancelAnimationFrame(id); }, [f]);
  const arc = "M" + sw + "," + (S / 2) + " A" + r + "," + r + " 0 0 1 " + (S - sw) + "," + (S / 2);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
      <div style={{ position: "relative", width: S, maxWidth: "100%", height: S / 2 + sw / 2 }}>
        <svg viewBox={"0 0 " + S + " " + (S / 2 + sw / 2)} style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }} aria-hidden="true">
          <path d={arc} fill="none" style={{ stroke: "var(--surface3)", strokeWidth: sw, strokeLinecap: "round" }} />
          {f > 0 && <path d={arc} fill="none" className="fs-tr" strokeDasharray={C * shown + " " + C}
            style={{ stroke: color || "var(--primary)", strokeWidth: sw, strokeLinecap: "round" }} />}
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, textAlign: "center", lineHeight: 1.1 }}>
          <span style={{ fontFamily: "var(--display)", fontSize: S >= 140 ? 23 : 19, fontWeight: 700, color: "var(--text-1)" }}>{value}</span>
          {unit && value !== "–" && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginLeft: 3 }}>{unit}</span>}
        </div>
      </div>
      {label && <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginTop: 6, textAlign: "center" }}>{label}</div>}
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "center" }}>{sub}</div>}
    </div>
  );
}

/* ── วงสัดส่วน ── parts [{ label, value, color }] · ช่องว่างระหว่างส่วน · ป้าย+% ข้างวงเสมอ (ไม่พึ่งสีอย่างเดียว) */
function FsDonut({ parts, center, centerSub, size, title, onPick, picked }) {
  const S = size || 132, sw = 16, r = (S - sw) / 2, C = 2 * Math.PI * r;
  const list = parts.filter((p) => p.value > 0);
  const sum = list.reduce((s, p) => s + p.value, 0);
  const [on, setOn] = React.useState(fsCalm());
  React.useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id); }, []);
  const gap = list.length > 1 ? Math.min(4, C * 0.012) : 0;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: S, height: S, flexShrink: 0 }}>
        <svg viewBox={"0 0 " + S + " " + S} width={S} height={S} style={{ display: "block", transform: "rotate(-90deg)" }} role="img" aria-label={title || ""}>
          <circle cx={S / 2} cy={S / 2} r={r} fill="none" style={{ stroke: "var(--surface3)", strokeWidth: sw }} />
          {sum > 0 && list.map((p) => {
            const len = (p.value / sum) * C, off = acc; acc += len;
            return <circle key={p.label} cx={S / 2} cy={S / 2} r={r} fill="none" className="fs-tr"
              strokeDasharray={(on ? Math.max(0.5, len - gap) : 0) + " " + C} strokeDashoffset={-off}
              style={{ stroke: p.color, strokeWidth: sw, opacity: picked && picked !== p.key ? 0.35 : 1 }} />;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", lineHeight: 1.15 }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: S >= 120 ? 22 : 17, fontWeight: 700, color: "var(--text-1)" }}>{center}</div>
            {centerSub && <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{centerSub}</div>}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: "1 1 120px" }}>
        {title && <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{title}</div>}
        {parts.map((p) => {
          const body = (
            <React.Fragment>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
              <span style={{ color: picked === p.key ? "var(--primary)" : "var(--text-2)", flex: 1, minWidth: 0, fontWeight: picked === p.key ? 800 : 500 }}>{p.label}</span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{sum > 0 ? Math.round((Math.max(0, p.value) / sum) * 100) + "%" : "–"}</span>
              {p.note && <span style={{ color: "var(--text-3)", fontSize: 11, minWidth: 54, textAlign: "right" }}>{p.note}</span>}
            </React.Fragment>
          );
          const st = { display: "flex", alignItems: "center", gap: 7, fontSize: 12, textAlign: "left" };
          return onPick ? (
            <button key={p.label} type="button" onClick={() => onPick(p.key)}
              style={Object.assign(st, { border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit" })}>{body}</button>
          ) : <div key={p.label} style={st}>{body}</div>;
        })}
      </div>
    </div>
  );
}

/* ================================================================
   ภาพสามมิติ (isometric) — แกน x ไปขวาล่าง · y ไปซ้ายล่าง · z ขึ้น
   ================================================================ */
const fsIso = (ox, oy) => (x, y, z) => [ox + (x - y) * 0.866, oy + (x + y) * 0.5 - (z || 0)];
const fsPts = (a) => a.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
const fsXY = (p) => p[0].toFixed(1) + "," + p[1].toFixed(1);
/* ช่วงเวลาของวันตามเวลาไทย: t 0 = 6 โมงเช้า · 1 = 6 โมงเย็น */
function fsDayPhase(ms) {
  const d = new Date((ms || Date.now()) + 7 * 3600e3);
  const hf = d.getUTCHours() + d.getUTCMinutes() / 60;
  const t = (hf - 6) / 12;
  const phase = t < -0.03 || t > 1.05 ? "night" : t < 0.1 || t > 0.9 ? "dusk" : "day";
  return { t, hf, phase };
}
const FS_SKY = { day: ["#6FB3EA", "#D6ECFB"], dusk: ["#6C87C9", "#FFC596"], night: ["#0A1430", "#26375F"] };
const FS_STARS = [[40, 30], [96, 62], [150, 22], [212, 48], [268, 18], [330, 40], [392, 24], [450, 58], [506, 20], [600, 44], [70, 104], [560, 96], [250, 84], [620, 120]];

/* ท้องฟ้า + ดวงอาทิตย์/ดวงจันทร์ + เมฆ — ภาพกว้าง 640 สูง H เส้นขอบฟ้าที่ hz */
function FsSky({ uid, ph, H, hz, calm, clouds }) {
  const sky = FS_SKY[ph.phase];
  const t = fsClamp(ph.t, 0, 1);
  const sx = 40 + t * 560, sy = hz - 8 - Math.sin(Math.PI * t) * (hz - 40);
  return (
    <g>
      <defs>
        <linearGradient id={uid + "sky"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <radialGradient id={uid + "sun"}><stop offset="0" stopColor="#FFF4C2" /><stop offset=".55" stopColor="#FFD25A" stopOpacity=".55" /><stop offset="1" stopColor="#FFD25A" stopOpacity="0" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="640" height={H} fill={"url(#" + uid + "sky)"} />
      {ph.phase === "night" ? (
        <g>
          {FS_STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.6} fill="#fff" className={calm ? "" : "fs-star"} style={{ animationDelay: (i * 0.37) % 2.8 + "s" }} />)}
          <circle cx="548" cy="52" r="15" fill="#F5F1DC" />
          <circle cx="555" cy="47" r="13" fill={sky[0]} />
        </g>
      ) : (
        <g>
          <circle cx={sx} cy={sy} r="44" fill={"url(#" + uid + "sun)"} />
          <g className={calm ? "" : "fs-rays"}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const a = (i * Math.PI) / 4;
              return <line key={i} x1={sx + Math.cos(a) * 21} y1={sy + Math.sin(a) * 21} x2={sx + Math.cos(a) * 29} y2={sy + Math.sin(a) * 29}
                style={{ stroke: ph.phase === "dusk" ? "#FF9C55" : "var(--fs-sun)", strokeWidth: 2.6, strokeLinecap: "round" }} />;
            })}
          </g>
          <circle cx={sx} cy={sy} r="16" style={{ fill: ph.phase === "dusk" ? "#FF9C55" : "var(--fs-sun)" }} />
          {clouds && (
            <g className={calm ? "" : "fs-cloud"} opacity=".9">
              <g transform="translate(120 52)"><ellipse cx="0" cy="0" rx="26" ry="10" fill="#fff" /><ellipse cx="14" cy="-7" rx="15" ry="11" fill="#fff" /><ellipse cx="-12" cy="-4" rx="11" ry="8" fill="#fff" /></g>
              <g transform="translate(470 76) scale(.8)"><ellipse cx="0" cy="0" rx="26" ry="10" fill="#fff" /><ellipse cx="14" cy="-7" rx="15" ry="11" fill="#fff" /><ellipse cx="-12" cy="-4" rx="11" ry="8" fill="#fff" /></g>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

/* อาคารสามมิติ + แผงบนหลังคา · inten 0..1 = แผงเรือง · night = หน้าต่างเปิดไฟ */
function FsIsoBuilding({ ox, oy, w, d, h, nc, nr, inten, night, calm, door }) {
  const P = fsIso(ox, oy);
  const face = (pts, fill) => <polygon points={fsPts(pts)} style={{ fill, stroke: "rgba(0,0,0,.08)", strokeWidth: 0.6 }} />;
  const win = night ? "#FFD27A" : "var(--fs-glass)";
  const wins = [];
  const nw = Math.max(2, Math.round(w / 26));
  const wz0 = h * 0.5, wz1 = Math.min(h - 6, h * 0.5 + 13);
  for (let i = 0; i < nw; i++) {
    const x0 = 10 + i * ((w - 20) / nw) + 3, x1 = x0 + (w - 20) / nw - 6;
    if (door && x0 < 44) continue;
    wins.push(<polygon key={"l" + i} points={fsPts([P(x0, d, wz0), P(x1, d, wz0), P(x1, d, wz1), P(x0, d, wz1)])} style={{ fill: win, opacity: night ? 0.9 : 0.85 }} />);
  }
  const nwr = Math.max(2, Math.round(d / 24));
  for (let i = 0; i < nwr; i++) {
    const y0 = 8 + i * ((d - 16) / nwr) + 3, y1 = y0 + (d - 16) / nwr - 6;
    wins.push(<polygon key={"r" + i} points={fsPts([P(w, y0, wz0), P(w, y1, wz0), P(w, y1, wz1), P(w, y0, wz1)])} style={{ fill: win, opacity: night ? 0.85 : 0.75 }} />);
  }
  /* แผง: เอียงขึ้นด้านหลังเล็กน้อย · มีเส้นแบ่งเซลล์ */
  const panels = [];
  const m = 9, gx = 3, gy = 4, pw = (w - 2 * m - (nc - 1) * gx) / nc, pd = (d - 2 * m - (nr - 1) * gy) / nr;
  for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
    const x0 = m + c * (pw + gx), y0 = m + r * (pd + gy), x1 = x0 + pw, y1 = y0 + pd;
    const q = [P(x0, y0, h + 6), P(x1, y0, h + 6), P(x1, y1, h + 1.5), P(x0, y1, h + 1.5)];
    panels.push(
      <g key={r + "-" + c}>
        <polygon points={fsPts(q)} style={{ fill: "var(--fs-panel)", stroke: "rgba(255,255,255,.35)", strokeWidth: 0.6 }} />
        {inten > 0.02 && <polygon points={fsPts(q)} className={calm ? "" : "fs-glow"}
          style={{ fill: "var(--fs-panel-hi)", opacity: 0.18 + inten * 0.72, animationDelay: ((r * nc + c) * 0.21) % 3.2 + "s" }} />}
        <line x1={fsXY(P((x0 + x1) / 2, y0, h + 6)).split(",")[0]} y1={fsXY(P((x0 + x1) / 2, y0, h + 6)).split(",")[1]}
          x2={fsXY(P((x0 + x1) / 2, y1, h + 1.5)).split(",")[0]} y2={fsXY(P((x0 + x1) / 2, y1, h + 1.5)).split(",")[1]}
          style={{ stroke: "rgba(255,255,255,.28)", strokeWidth: 0.6 }} />
      </g>
    );
  }
  return (
    <g>
      <polygon points={fsPts([P(-8, -8, 0), P(w + 8, -8, 0), P(w + 8, d + 8, 0), P(-8, d + 8, 0)])} style={{ fill: "rgba(0,0,0,.09)" }} />
      {face([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], "var(--fs-wall)")}
      {face([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], "var(--fs-wall2)")}
      {face([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], "var(--fs-roof)")}
      {wins}
      {door && <polygon points={fsPts([P(18, d, 0), P(38, d, 0), P(38, d, 24), P(18, d, 24)])} style={{ fill: night ? "#FFC85C" : "var(--fs-panel)", opacity: 0.8 }} />}
      {panels}
    </g>
  );
}

/* เสาไฟฟ้าแรงสูง (กริด) */
function FsPylon({ x, y, hgt }) {
  const H = hgt || 120, top = y - H;
  const st = { stroke: "var(--text-3)", strokeWidth: 1.6, fill: "none", strokeLinecap: "round" };
  const L = (a, b, c, e) => <line x1={a} y1={b} x2={c} y2={e} style={st} />;
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx="20" ry="5" style={{ fill: "rgba(0,0,0,.1)" }} />
      {L(x - 15, y, x - 4, top)}{L(x + 15, y, x + 4, top)}
      {L(x - 12, y - 25, x + 12, y - 25)}{L(x - 9, y - 55, x + 9, y - 55)}{L(x - 6, y - 85, x + 6, y - 85)}
      {L(x - 12, y - 25, x + 9, y - 55)}{L(x + 12, y - 25, x - 9, y - 55)}{L(x - 9, y - 55, x + 6, y - 85)}{L(x + 9, y - 55, x - 6, y - 85)}
      {L(x - 26, top + 12, x + 26, top + 12)}{L(x - 19, top + 28, x + 19, top + 28)}
      {L(x - 4, top, x + 4, top)}
      {[-24, 24, -17, 17].map((dx, i) => <line key={i} x1={x + dx} y1={top + (i < 2 ? 12 : 28)} x2={x + dx} y2={top + (i < 2 ? 19 : 35)} style={Object.assign({}, st, { strokeWidth: 2.4 })} />)}
    </g>
  );
}

/* ต้นไม้ */
const FsTree = ({ x, y, s }) => (
  <g transform={"translate(" + x + " " + y + ") scale(" + (s || 1) + ")"}>
    <ellipse cx="0" cy="1" rx="10" ry="3" style={{ fill: "rgba(0,0,0,.1)" }} />
    <rect x="-1.6" y="-12" width="3.2" height="13" rx="1" style={{ fill: "#8A6A4A" }} />
    <circle cx="0" cy="-20" r="11" style={{ fill: "var(--fs-tree)" }} />
    <circle cx="-5" cy="-16" r="7" style={{ fill: "var(--fs-tree)", opacity: 0.85 }} />
  </g>
);

/* เส้นทางพลังงาน + จุดวิ่ง · kw/cap กำหนดความเร็ว · reverse = วิ่งจากปลายมาต้น */
function FsFlowPath({ id, d, kw, cap, color, reverse, calm }) {
  const on = kw != null && Math.abs(kw) > 0.02;
  const rel = on ? (cap > 0 ? fsClamp(Math.abs(kw) / cap, 0, 1) : 0.5) : 0;
  const dur = 3.6 - 2.5 * Math.sqrt(rel);
  return (
    <g>
      <path id={id} d={d} fill="none" style={{ stroke: on ? color : "var(--text-3)", strokeWidth: 3.2, opacity: on ? 0.3 : 0.14, strokeLinecap: "round" }} />
      {on && calm && <path d={d} fill="none" className="fs-dash" style={{ stroke: color, strokeWidth: 2.2, strokeLinecap: "round" }} />}
      {on && !calm && [0, 1, 2, 3].map((i) => (
        <circle key={i} r="3.8" style={{ fill: color, stroke: "var(--surface)", strokeWidth: 1.4 }}>
          <animateMotion dur={dur.toFixed(2) + "s"} repeatCount="indefinite" begin={(-(i * dur) / 4).toFixed(2) + "s"}
            keyPoints={reverse ? "1;0" : "0;1"} keyTimes="0;1" calcMode="linear">
            <mpath xlinkHref={"#" + id} />
          </animateMotion>
        </circle>
      ))}
    </g>
  );
}

/* ป้ายลอยบนภาพ (ตำแหน่งเป็นพิกัดภาพ 640×300) · ไม่มี x = ป้ายธรรมดา (วางเป็นตารางใต้ภาพบนมือถือ) */
function FsSceneTag({ icon, title, value, sub, color, x, y, vw, vh, delay }) {
  const st = x == null ? {} : { position: "absolute", left: fsClamp((x / (vw || 640)) * 100, 11, 89) + "%", top: (y / (vh || 300)) * 100 + "%",
    transform: "translate(-50%,-50%)", animationDelay: (delay || 0) + "s" };
  return (
    <div className={x == null ? "fs-in" : "fs-tag"} style={Object.assign({ background: "var(--surface)", boxShadow: "var(--shadow-pop)", borderRadius: "var(--r-tile)",
      padding: "7px 11px", minWidth: 0, pointerEvents: "none" }, st)}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap" }}>
        {icon ? <Icon name={icon} size={12} color={color} /> : <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />}{title}
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 700, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", lineHeight: 1.25 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap" }}>{sub}</div>}
    </div>
  );
}

/* ── ภาพไซต์: อาคาร + แผง + กริด + แบต พร้อมการไหลของพลังงานตอนซิงก์ล่าสุด ── */
function FsScene({ em, site, compact, at }) {
  const uid = React.useRef("fss" + Math.random().toString(36).slice(2, 8)).current;
  const calm = fsCalm();
  const ph = fsDayPhase(Date.now());
  const cap = fsN(site.capacity_kw) || em.cap || null;
  const pv = em.pvKw, g = em.gridKw, bk = em.battKw;
  const inten = cap > 0 && pv > 0 ? fsClamp(pv / cap, 0, 1) : 0;
  const offline = +site.health_state === 1 || site.fs_status === "not_found_in_fusionsolar";
  const W = 150, D = 90, H = 56, ox = 300, oy = 150;
  const P = fsIso(ox, oy);
  const big = cap > 150;
  const roof = P(W / 2, D / 2, H + 5), door = P(28, D, 12), wire = P(W, 18, H - 8);
  const Pb = fsIso(112, 216), battTop = Pb(11, 8, 34);
  const pylon = { x: 568, y: 240 };
  const wireEnd = [pylon.x - 24, pylon.y - 120 + 19];
  const loadFromPv = em.loadKw != null && pv != null ? Math.max(0, Math.min(em.loadKw, pv - Math.max(0, g || 0) - Math.max(0, bk || 0))) : (pv > 0 ? pv - Math.max(0, g || 0) : null);
  const kw = (v) => (v == null ? "–" : fsFmt(Math.abs(v), Math.abs(v) >= 100 ? 0 : 1) + " kW");
  const gTitle = g == null ? "กริด" : g > 0.02 ? "ขายเข้ากริด" : g < -0.02 ? "ซื้อจากกริด" : "กริด (สมดุล)";
  const gColor = g > 0.02 ? "var(--fs-exp)" : g < -0.02 ? "var(--fs-imp)" : "var(--text-3)";
  const tags = [
    { key: "pv", icon: "sun", title: "โซลาร์ผลิต", value: kw(pv), sub: cap > 0 && pv != null ? Math.round(inten * 100) + "% ของ " + fsFmt(cap, 0) + " kWp" : em.hasInv ? null : "ไม่มีข้อมูลอินเวอร์เตอร์",
      color: "var(--fs-sun)", x: 196, y: 70 },
    { key: "load", icon: "building", title: "อาคารใช้ไฟ", value: kw(em.loadKw), sub: em.loadKw > 0.05 && loadFromPv != null ? "จากโซลาร์ " + Math.round(fsClamp(loadFromPv / em.loadKw, 0, 1) * 100) + "%" : em.meter ? null : "ไม่มีมิเตอร์",
      color: "var(--fs-self)", x: 168, y: 272 },
    { key: "grid", icon: "bolt", title: gTitle, value: kw(g), sub: em.meter ? null : "ไม่มีมิเตอร์", color: gColor, x: 560, y: 40 },
  ];
  if (em.batt) tags.push({ key: "bat", icon: "battery", title: bk > 0.02 ? "แบตกำลังชาร์จ" : bk < -0.02 ? "แบตกำลังจ่าย" : "แบตเตอรี่",
    value: em.soc != null ? em.soc + "%" : "–", sub: bk != null && Math.abs(bk) > 0.02 ? kw(bk) : "SOC", color: "var(--fs-bat)", x: 84, y: 150 });
  const soc = em.soc != null ? fsClamp(em.soc / 100, 0, 1) : 0;
  return (
    <div>
      <div style={{ position: "relative", borderRadius: "var(--r-tile)", overflow: "hidden", background: "var(--surface2)" }}>
        <svg viewBox="0 0 640 300" style={{ display: "block", width: "100%", height: "auto" }} role="img"
          aria-label={"ภาพไซต์: โซลาร์ " + kw(pv) + " · " + gTitle + " " + kw(g)}>
          <FsSky uid={uid} ph={ph} H={300} hz={196} calm={calm} clouds={!offline && ph.phase === "day"} />
          <defs>
            <linearGradient id={uid + "gr"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--fs-ground)" }} /><stop offset="1" style={{ stopColor: "var(--fs-ground2)" }} />
            </linearGradient>
          </defs>
          <rect x="0" y="194" width="640" height="106" fill={"url(#" + uid + "gr)"} />
          {/* แสงจากดวงอาทิตย์ลงแผง */}
          {ph.phase !== "night" && inten > 0.02 && !offline && [-30, 0, 30].map((dx, i) => {
            const t = fsClamp(ph.t, 0, 1), sx = 40 + t * 560, sy = 188 - Math.sin(Math.PI * t) * 156;
            return <line key={i} x1={sx} y1={sy} x2={roof[0] + dx} y2={roof[1] - 6} className={calm ? "" : "fs-dash"}
              style={{ stroke: "var(--fs-sun)", strokeWidth: 1.6, opacity: 0.25 + inten * 0.5, strokeDasharray: "3 7" }} />;
          })}
          <FsTree x={196} y={206} s={0.9} />
          <FsTree x={470} y={262} s={1.1} />
          <FsTree x={600} y={286} s={0.8} />
          <FsPylon x={pylon.x} y={pylon.y} hgt={120} />
          <FsIsoBuilding ox={ox} oy={oy} w={W} d={D} h={H} nc={big ? 7 : 5} nr={big ? 4 : 3} inten={offline ? 0 : inten} night={ph.phase === "night"} calm={calm} door />
          {em.batt && (
            <g>
              <polygon points={fsPts([Pb(0, 16, 0), Pb(22, 16, 0), Pb(22, 16, 34), Pb(0, 16, 34)])} style={{ fill: "var(--fs-wall)", stroke: "rgba(0,0,0,.1)", strokeWidth: 0.6 }} />
              <polygon points={fsPts([Pb(22, 0, 0), Pb(22, 16, 0), Pb(22, 16, 34), Pb(22, 0, 34)])} style={{ fill: "var(--fs-wall2)" }} />
              <polygon points={fsPts([Pb(0, 0, 34), Pb(22, 0, 34), Pb(22, 16, 34), Pb(0, 16, 34)])} style={{ fill: "var(--fs-roof)" }} />
              <polygon points={fsPts([Pb(4, 16, 4), Pb(18, 16, 4), Pb(18, 16, 4 + 24 * soc), Pb(4, 16, 4 + 24 * soc)])} style={{ fill: "var(--fs-bat)", opacity: 0.85 }} />
              <polygon points={fsPts([Pb(4, 16, 4), Pb(18, 16, 4), Pb(18, 16, 28), Pb(4, 16, 28)])} style={{ fill: "none", stroke: "var(--fs-bat)", strokeWidth: 1 }} />
            </g>
          )}
          {!offline && (
            <g>
              <FsFlowPath id={uid + "l"} d={"M" + fsXY(roof) + " Q" + (roof[0] - 70) + "," + (roof[1] + 6) + " " + fsXY(door)} kw={loadFromPv} cap={cap} color="var(--fs-self)" calm={calm} />
              {em.meter && <FsFlowPath id={uid + "g"} d={"M" + fsXY(wire) + " Q" + (wire[0] + 70) + "," + (wire[1] - 8) + " " + wireEnd[0] + "," + wireEnd[1]}
                kw={g} cap={cap} color={gColor} reverse={g < 0} calm={calm} />}
              {em.batt && (bk < -0.02
                ? <FsFlowPath id={uid + "b"} d={"M" + fsXY(battTop) + " Q" + (battTop[0] + 60) + "," + (battTop[1] + 40) + " " + fsXY(door)} kw={bk} cap={cap} color="var(--fs-bat)" calm={calm} />
                : <FsFlowPath id={uid + "b"} d={"M" + fsXY(roof) + " Q" + (roof[0] - 120) + "," + (roof[1] - 60) + " " + fsXY(battTop)} kw={bk} cap={cap} color="var(--fs-bat)" calm={calm} />)}
            </g>
          )}
          <rect x="0" y="0" width="640" height="300" style={{ fill: "#000", opacity: "var(--fs-dim)", pointerEvents: "none" }} />
        </svg>
        {!compact && tags.map((t, i) => <FsSceneTag key={t.key} {...t} delay={0.1 + i * 0.08} />)}
        <div style={{ position: "absolute", left: 10, bottom: 9, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {offline && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: "var(--r-pill)", background: "var(--surface)", color: "var(--tint-red-tx)", boxShadow: "var(--shadow-sm)" }}>ไม่ได้รับข้อมูล — ภาพแสดงค่าล่าสุด</span>}
          {at && <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: "var(--r-pill)", background: "var(--surface)", color: "var(--text-2)", boxShadow: "var(--shadow-sm)" }}>{at}</span>}
        </div>
      </div>
      {compact && (
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          {tags.map((t) => <FsSceneTag key={t.key} {...t} x={null} />)}
        </div>
      )}
    </div>
  );
}

/* ── ภาพรวมทุกไซต์: อาคารสามหลัง แผงเรืองตามกำลังผลิตรวม ── */
function FsFleetScene({ inten, height }) {
  const uid = React.useRef("fsf" + Math.random().toString(36).slice(2, 8)).current;
  const calm = fsCalm();
  const ph = fsDayPhase(Date.now());
  const night = ph.phase === "night";
  const I = fsClamp(inten || 0, 0, 1);
  return (
    <svg viewBox="0 0 640 300" preserveAspectRatio="xMidYMax slice" style={{ display: "block", width: "100%", height: height || "100%" }} aria-hidden="true">
      <FsSky uid={uid} ph={ph} H={300} hz={200} calm={calm} clouds={ph.phase === "day"} />
      <defs>
        <linearGradient id={uid + "gr"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--fs-ground)" }} /><stop offset="1" style={{ stopColor: "var(--fs-ground2)" }} />
        </linearGradient>
      </defs>
      <rect x="0" y="198" width="640" height="102" fill={"url(#" + uid + "gr)"} />
      <FsTree x={92} y={232} s={1} />
      <FsTree x={560} y={262} s={1.15} />
      <FsPylon x={606} y={236} hgt={112} />
      <FsIsoBuilding ox={250} oy={128} w={92} d={64} h={84} nc={4} nr={3} inten={I} night={night} calm={calm} />
      <FsIsoBuilding ox={410} oy={166} w={150} d={84} h={42} nc={7} nr={4} inten={I} night={night} calm={calm} door />
      <FsIsoBuilding ox={168} oy={210} w={80} d={56} h={30} nc={4} nr={2} inten={I} night={night} calm={calm} door />
      <rect x="0" y="0" width="640" height="300" style={{ fill: "#000", opacity: "var(--fs-dim)" }} />
    </svg>
  );
}

/* ================================================================
   ค่าดิบจากอุปกรณ์ — จัดเป็นหมวด
   ================================================================ */
const FS_KV_GROUPS = [
  { key: "state", th: "สถานะ · เวลาทำงาน", icon: "check", re: /^(inverter_state|run_state|meter_status|battery_status|ch_discharge_model|open_time|close_time)$/ },
  { key: "energy", th: "พลังงานสะสม", icon: "chart", re: /(_cap$|^radiant_total$)/ },
  { key: "ac", th: "ฝั่งไฟสลับ (กริด)", icon: "bolt", re: /^([abc]_u|ab_u|bc_u|ca_u|[abc]_i|meter_u|meter_i|elec_freq|grid_frequency|power_factor|active_power(_[abc])?|reactive_power|total_apparent_power)$/ },
  { key: "dc", th: "ฝั่งไฟตรง (แผง)", icon: "panel", re: /^(mppt_power|busbar_u|pv\d+_[ui])$/ },
  { key: "batt", th: "แบตเตอรี่", icon: "battery", re: /^(battery_soc|battery_soh|ch_discharge_power|max_charge_power|max_discharge_power)$/ },
  { key: "env", th: "อุณหภูมิ · ประสิทธิภาพ · สภาพแวดล้อม", icon: "sun", re: /^(temperature|efficiency|radiant_line|pv_temperature|wind_speed|wind_direction)$/ },
];
const fsKeyNum = (k) => { const m = /(\d+)/.exec(k); return m ? +m[1] : 0; };
function FsKvTile({ k, key2, meter }) {
  const lb = fsKpiLabel(key2, meter);
  const v = k[key2];
  return (
    <div title={key2} style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "7px 10px", minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lb ? lb[0] : key2}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {fsKpiValue(key2, v)}{lb && lb[1] && fsN(v) != null && !FS_ENUMS[key2] ? <span style={{ color: "var(--text-3)", fontWeight: 600 }}> {lb[1]}</span> : null}
      </div>
    </div>
  );
}
function FsKvGroups({ k, meter }) {
  const keys = Object.keys(k || {}).filter((x) => k[x] != null && k[x] !== "" && k[x] !== "N/A");
  if (!keys.length) return <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีค่าจากอุปกรณ์</div>;
  const by = {}, rest = [];
  keys.forEach((x) => { const g = FS_KV_GROUPS.find((G) => G.re.test(x)); if (g) (by[g.key] = by[g.key] || []).push(x); else rest.push(x); });
  const groups = FS_KV_GROUPS.filter((G) => by[G.key]).map((G) => Object.assign({}, G, { keys: by[G.key] }));
  if (rest.length) groups.push({ key: "etc", th: "อื่น ๆ", icon: "list", keys: rest });
  const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 6 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {groups.map((G) => {
        let list = G.keys.slice(), hidden = 0, strings = null;
        if (G.key === "energy") {
          list.sort((a, b) => (/^mppt_\d/.test(a) - /^mppt_\d/.test(b)) || fsKeyNum(a) - fsKeyNum(b));
          const z = list.filter((x) => /^mppt_\d+_cap$/.test(x) && !(+k[x] > 0)); hidden = z.length; list = list.filter((x) => z.indexOf(x) === -1);
        }
        if (G.key === "dc") {
          const all = fsStringsAll(k);
          strings = all.filter((s) => s.used);
          hidden = all.length - strings.length;
          list = list.filter((x) => !/^pv\d+_[ui]$/.test(x));
        }
        return (
          <div key={G.key}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 }}>
              <Icon name={G.icon} size={13} color="var(--text-3)" />{G.th}
              {hidden > 0 && <span style={{ fontWeight: 500, color: "var(--text-3)", fontSize: 11 }}>· ซ่อน {hidden} ช่องที่ไม่ได้ต่อ (ค่า 0)</span>}
            </div>
            {list.length > 0 && <div style={grid}>{list.map((x) => <FsKvTile key={x} k={k} key2={x} meter={meter} />)}</div>}
            {strings && strings.length > 0 && (
              <div style={{ marginTop: list.length ? 6 : 0, borderRadius: "var(--r-tile)", background: "var(--surface2)", overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, fontVariantNumeric: "tabular-nums" }}>
                  <thead><tr>{["สตริง", "แรงดัน V", "กระแส A", "กำลัง kW"].map((h, i) => (
                    <th key={h} style={{ padding: "6px 10px", textAlign: i ? "right" : "left", fontSize: 10.5, color: "var(--text-3)", fontWeight: 700, borderBottom: "1px solid var(--divider)" }}>{h}</th>))}</tr></thead>
                  <tbody>{strings.map((s) => (
                    <tr key={s.n}>
                      <td style={{ padding: "4px 10px", fontWeight: 700, color: "var(--text-1)" }}>PV{s.n}</td>
                      <td style={{ padding: "4px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-2)" }}>{fsFmt(s.u, 1)}</td>
                      <td style={{ padding: "4px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-2)" }}>{fsFmt(s.i, 2)}</td>
                      <td style={{ padding: "4px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-1)", fontWeight: 700 }}>{fsFmt(s.kw, 2)}</td>
                    </tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
/* สตริงทุกช่องที่ Huawei ส่งมา (รวมช่องว่าง) — used = มีแรงดันหรือกระแส */
function fsStringsAll(k) {
  return Object.keys(k || {}).map((x) => /^pv(\d+)_u$/.exec(x)).filter(Boolean).map((m) => {
    const u = fsN(k[m[0]]), i = fsN(k["pv" + m[1] + "_i"]);
    return { n: +m[1], u, i, kw: u != null && i != null ? (u * i) / 1000 : null, used: u > 5 || i > 0.05 };
  }).sort((a, b) => a.n - b.n);
}

/* ── สตริง PV แบบแผนที่ความร้อน — สีเข้ม = ผลิตมาก · ส้ม = กระแสต่ำกว่าสตริงอื่น ── */
function FsStringGrid({ strs }) {
  const maxKw = Math.max.apply(null, strs.map((s) => s.kw || 0).concat([0.001]));
  const tot = strs.reduce((s, x) => s + (x.kw || 0), 0);
  const weak = strs.filter((s) => s.weak).length;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>สตริง PV {strs.length} ชุด</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>รวม {fsFmt(tot, 2)} kW{weak ? " · กระแสต่ำ " + weak + " ชุด" : ""}</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, color: "var(--text-3)" }}>
          น้อย<span style={{ width: 52, height: 7, borderRadius: 4, background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 14%, var(--surface2)), var(--primary))" }} />มาก
          <span style={{ width: 9, height: 9, borderRadius: 3, background: "var(--tint-amber-bg)", boxShadow: "inset 0 0 0 1.5px var(--tint-amber-tx)", marginLeft: 6 }} />ต่ำผิดปกติ
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))", gap: 6 }}>
        {strs.map((s, i) => {
          const f = s.kw > 0 ? s.kw / maxKw : 0;
          const dark = f > 0.55;
          return (
            <div key={s.n} className="fs-in" title={"PV" + s.n + " · " + fsFmt(s.u, 0) + " V · " + fsFmt(s.i, 2) + " A · " + fsFmt(s.kw, 2) + " kW"}
              style={{ animationDelay: Math.min(i * 0.025, 0.6) + "s", borderRadius: "var(--r-tile)", padding: "7px 8px", minWidth: 0,
                background: s.weak ? "var(--tint-amber-bg)" : "color-mix(in srgb, var(--primary) " + Math.round(14 + f * 86) + "%, var(--surface2))",
                boxShadow: s.weak ? "inset 0 0 0 1.5px var(--tint-amber-tx)" : "none",
                color: s.weak ? "var(--tint-amber-tx)" : dark ? "#fff" : "var(--text-1)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85 }}>PV{s.n}</div>
              <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{fsFmt(s.kw, 2)}<span style={{ fontSize: 10, fontWeight: 600, marginLeft: 2 }}>kW</span></div>
              <div style={{ fontSize: 10, opacity: 0.8, fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{fsFmt(s.i, 1)}A · {fsFmt(s.u, 0)}V</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   Excel สรุปรายเดือน — xlsx-js-style (window.XLSX) · สไตล์ตามไฟล์ทะเบียน O&M (views-om.jsx)
   อ่านประวัติรายวันจาก fsKpiDay/{site} ทีละไซต์ (ช่วงวันของเดือนนั้น) และ fsKpiMonth/{site}/{เดือน}
   เดือนปัจจุบันใช้ month_kwh ของไซต์ (ล่าสุดกว่าประวัติ)
   ================================================================ */
const FS_XC = { brand: "1D854B", soft: "EAF6EF", alt: "F6FAF7", border: "CBD8D0", text: "16241D", sub: "5A6B62", warn: "B45309", warnBg: "FDEBD0", bad: "B91C1C", badBg: "FBE3E3" };
function fsXStyle(kind) {
  const thin = { style: "thin", color: { rgb: FS_XC.border } };
  const box = { top: thin, bottom: thin, left: thin, right: thin };
  const f = (o) => Object.assign({ name: "Tahoma", sz: 10, color: { rgb: FS_XC.text } }, o);
  return {
    title: { font: f({ sz: 15, bold: true, color: { rgb: FS_XC.brand } }) },
    sub: { font: f({ sz: 10, color: { rgb: FS_XC.sub } }) },
    head: { font: f({ bold: true, color: { rgb: "FFFFFF" } }), fill: { fgColor: { rgb: FS_XC.brand } }, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: box },
    label: { font: f({ bold: true }), fill: { fgColor: { rgb: FS_XC.soft } }, border: box },
    cell: { font: f(), border: box, alignment: { vertical: "center" } },
    alt: { font: f(), border: box, fill: { fgColor: { rgb: FS_XC.alt } }, alignment: { vertical: "center" } },
    total: { font: f({ bold: true }), border: box, fill: { fgColor: { rgb: FS_XC.soft } } },
    warn: { font: f({ bold: true, color: { rgb: FS_XC.warn } }), border: box, fill: { fgColor: { rgb: FS_XC.warnBg } } },
    bad: { font: f({ bold: true, color: { rgb: FS_XC.bad } }), border: box, fill: { fgColor: { rgb: FS_XC.badBg } } },
  }[kind];
}
/* rows: [{ cells, kind, fmt: {col: "#,##0.0"} , hpt }] → sheet ที่ใส่สไตล์แล้ว */
function fsXSheet(X, rows, cols, merges) {
  const ws = X.utils.aoa_to_sheet(rows.map((r) => r.cells));
  rows.forEach((r, R) => {
    r.cells.forEach((v, C) => {
      const ref = X.utils.encode_cell({ r: R, c: C });
      if (!ws[ref]) return;
      const kind = (r.cellKind && r.cellKind[C]) || r.kind;
      const st = fsXStyle(kind);
      if (st) ws[ref].s = Object.assign({}, st, typeof v === "number" && kind !== "head" ? { alignment: { horizontal: "right", vertical: "center" } } : {});
      const fmt = (r.fmt && r.fmt[C]) || (typeof v === "number" ? "#,##0.00" : null);
      if (fmt && typeof v === "number") { ws[ref].z = fmt; if (ws[ref].s) ws[ref].s.numFmt = fmt; }
    });
  });
  ws["!cols"] = cols.map((w) => ({ wch: w }));
  ws["!rows"] = rows.map((r) => (r.hpt ? { hpt: r.hpt } : {}));
  if (merges) ws["!merges"] = merges;
  return ws;
}
const fsMonthDays = (mon) => { const [y, m] = mon.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
const fsMonFullTH = (mon) => { const [y, m] = mon.split("-").map(Number); return ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"][m - 1] + " " + (y + 543); };
const fsFileSafe = (s) => String(s || "").replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40);
async function fsLoadMonth(sites, mon) {
  const DB = window.FBDB;
  const days = await Promise.all(sites.map((s) => DB.ref("fsKpiDay/" + s.id).orderByKey().startAt(mon + "-01").endAt(mon + "-31").once("value")
    .then((sn) => sn.val() || {}).catch(() => ({}))));
  const mons = await Promise.all(sites.map((s) => DB.ref("fsKpiMonth/" + s.id + "/" + mon).once("value").then((sn) => fsN(sn.val())).catch(() => null)));
  const cur = mon === fsBkk(Date.now()).mon;
  return sites.map((s, i) => {
    const byDay = {};
    Object.keys(days[i]).forEach((d) => { const v = fsN((days[i][d] || {}).kwh); if (v != null) byDay[+d.slice(8)] = v; });
    const sum = Object.keys(byDay).reduce((a, d) => a + byDay[d], 0);
    const kwh = cur && fsN(s.month_kwh) != null ? +s.month_kwh : mons[i] != null ? mons[i] : Object.keys(byDay).length ? sum : null;
    return { s, byDay, kwh, nDays: Object.keys(byDay).length };
  });
}
const FS_HEALTH_XTH = { 3: "ปกติ", 2: "มีปัญหา", 1: "ออฟไลน์" };
async function fsExportMonthXlsx(sites, mon) {
  const X = window.XLSX;
  if (!X || !window.FBDB) throw new Error("ไม่พบไลบรารี Excel หรือฐานข้อมูล (ลองโหลดหน้าใหม่)");
  const list = sites.filter((s) => s.fusionsolar_station_code);
  const data = await fsLoadMonth(list, mon);
  const nd = fsMonthDays(mon), cur = mon === fsBkk(Date.now()).mon;
  const dom = cur ? +fsBkk(Date.now()).day.slice(8) : nd;
  data.forEach((r) => { const cap = fsN(r.s.capacity_kw); r.y = cap > 0 && r.kwh != null ? r.kwh / cap : null; r.yd = r.y != null ? r.y / dom : null; });
  const med = fsMedian(data.filter((r) => +r.s.health_state === 3).map((r) => r.yd));
  const tot = { kw: 0, kwh: 0 }, hc = {};
  data.forEach((r) => { tot.kw += +r.s.capacity_kw || 0; tot.kwh += r.kwh || 0; const h = FS_HEALTH_XTH[r.s.health_state] || "ไม่ทราบ"; hc[h] = (hc[h] || 0) + 1; });
  const ranked = data.filter((r) => r.yd != null).sort((a, b) => b.yd - a.yd);
  const issued = new Date().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Bangkok" });

  /* แผ่น 1 สรุป */
  const S = [], sm = [];
  S.push({ cells: ["สรุปการผลิตไฟฟ้าโซลาร์ — " + fsMonFullTH(mon)], kind: "title", hpt: 26 }); sm.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
  S.push({ cells: ["flash+solar · ข้อมูลจาก Huawei FusionSolar · ออกเมื่อ " + issued + (cur ? " (เดือนนี้ยังไม่จบ — ถึงวันที่ " + dom + ")" : "")], kind: "sub" }); sm.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });
  S.push({ cells: [""], kind: "sub" });
  [["จำนวนไซต์", list.length, "#,##0"], ["กำลังติดตั้งรวม (kWp)", tot.kw, "#,##0.00"], ["ผลิตรวมทั้งเดือน (kWh)", tot.kwh, "#,##0.0"],
   ["ผลิตเฉลี่ยต่อ kWp (kWh/kWp)", tot.kw > 0 ? tot.kwh / tot.kw : null, "#,##0.00"],
   ["ผลิตเฉลี่ยต่อวันต่อ kWp (kWh/kWp/วัน)", tot.kw > 0 ? tot.kwh / tot.kw / dom : null, "#,##0.00"],
   ["ค่ากลางของไซต์ปกติ (kWh/kWp/วัน)", med, "#,##0.00"],
   ["ลด CO₂ ได้ (ตัน) — ค่าการปล่อยไฟฟ้าไทย " + FS_GRID_EF + " kg/kWh", (tot.kwh * FS_GRID_EF) / 1000, "#,##0.00"],
  ].forEach(([a, b, f]) => S.push({ cells: [a, b == null ? "–" : b], kind: "cell", cellKind: { 0: "label" }, fmt: { 1: f } }));
  S.push({ cells: ["สถานะไซต์ ณ ตอนออกเอกสาร", Object.keys(hc).map((k) => k + " " + hc[k]).join(" · ")], kind: "cell", cellKind: { 0: "label" } });
  S.push({ cells: [""], kind: "sub" });
  S.push({ cells: ["อันดับ", "ผลิตต่อ kWp สูงสุด", "kWh/kWp/วัน", "ผลิตทั้งเดือน kWh"], kind: "head", hpt: 20 });
  ranked.slice(0, 5).forEach((r, i) => S.push({ cells: [i + 1, r.s.name || r.s.id, r.yd, r.kwh], kind: i % 2 ? "alt" : "cell", fmt: { 0: "0", 3: "#,##0.0" } }));
  S.push({ cells: [""], kind: "sub" });
  S.push({ cells: ["อันดับ", "ผลิตต่อ kWp ต่ำสุด", "kWh/kWp/วัน", "% ของค่ากลาง"], kind: "head", hpt: 20 });
  ranked.slice(-5).reverse().forEach((r, i) => S.push({ cells: [i + 1, r.s.name || r.s.id, r.yd, med ? Math.round((r.yd / med) * 100) / 100 : "–"], kind: i % 2 ? "alt" : "cell",
    cellKind: med && r.yd < med * 0.6 ? { 3: "warn" } : null, fmt: { 0: "0", 3: "0%" } }));
  const ws1 = fsXSheet(X, S, [40, 42, 16, 18], sm);

  /* แผ่น 2 รายไซต์ */
  const head2 = ["ลำดับ", "ชื่อไซต์", "Station code", "kWp", "ผลิตทั้งเดือน kWh", "kWh/kWp", "เฉลี่ย kWh/วัน", "kWh/kWp/วัน", "% ของค่ากลาง", "วันที่มีข้อมูล", "สถานะ", "ลด CO₂ kg", "ผลิตสะสม kWh", "งานที่ผูก", "ที่อยู่"];
  const R2 = [{ cells: head2, kind: "head", hpt: 30 }];
  data.slice().sort((a, b) => String(a.s.name).localeCompare(String(b.s.name), "th")).forEach((r, i) => {
    const pct = med && r.yd != null ? r.yd / med : null;
    const hs = FS_HEALTH_XTH[r.s.health_state] || "ไม่ทราบ";
    R2.push({ cells: [i + 1, r.s.name || r.s.id, r.s.fusionsolar_station_code, fsN(r.s.capacity_kw), r.kwh, r.y, r.kwh != null ? r.kwh / dom : null, r.yd, pct,
      r.nDays, r.s.fs_status === "not_found_in_fusionsolar" ? "ไม่พบใน FusionSolar" : hs, r.kwh != null ? r.kwh * FS_GRID_EF : null, fsN(r.s.total_kwh),
      Object.keys(r.s.jobIds || {}).join(", "), r.s.address || ""].map((v) => (v == null ? "" : v)),
      kind: i % 2 ? "alt" : "cell", fmt: { 0: "0", 3: "#,##0.00", 4: "#,##0.0", 5: "#,##0.00", 6: "#,##0.0", 7: "#,##0.00", 8: "0%", 9: "0", 11: "#,##0", 12: "#,##0" },
      cellKind: Object.assign({}, pct != null && pct < 0.6 ? { 8: "warn" } : {}, hs === "ออฟไลน์" ? { 10: "bad" } : hs === "มีปัญหา" ? { 10: "warn" } : {}) });
  });
  R2.push({ cells: ["", "รวม " + data.length + " ไซต์", "", tot.kw, tot.kwh, tot.kw > 0 ? tot.kwh / tot.kw : "", tot.kwh / dom, tot.kw > 0 ? tot.kwh / tot.kw / dom : "", "", "", "", tot.kwh * FS_GRID_EF, "", "", ""],
    kind: "total", fmt: { 3: "#,##0.00", 4: "#,##0.0", 5: "#,##0.00", 6: "#,##0.0", 7: "#,##0.00", 11: "#,##0" } });
  const ws2 = fsXSheet(X, R2, [6, 34, 15, 9, 14, 10, 12, 12, 11, 10, 16, 11, 14, 16, 40]);
  ws2["!autofilter"] = { ref: X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R2.length - 2, c: head2.length - 1 } }) };
  ws2["!freeze"] = { xSplit: 2, ySplit: 1 };

  /* แผ่น 3 รายวัน (ไซต์ × วัน) */
  const dayCols = []; for (let d = 1; d <= nd; d++) dayCols.push(d);
  const R3 = [{ cells: ["ชื่อไซต์", "kWp"].concat(dayCols.map((d) => d + "")).concat(["รวม"]), kind: "head", hpt: 22 }];
  const colTot = dayCols.map(() => 0);
  data.slice().sort((a, b) => String(a.s.name).localeCompare(String(b.s.name), "th")).forEach((r, i) => {
    const row = [r.s.name || r.s.id, fsN(r.s.capacity_kw) == null ? "" : +r.s.capacity_kw];
    dayCols.forEach((d, j) => { const v = r.byDay[d]; row.push(v == null ? "" : v); if (v != null) colTot[j] += v; });
    row.push(r.nDays ? Object.keys(r.byDay).reduce((a, d) => a + r.byDay[d], 0) : "");
    const fmt = {}; for (let c = 1; c < row.length; c++) fmt[c] = c === 1 ? "#,##0.00" : "#,##0.0";
    R3.push({ cells: row, kind: i % 2 ? "alt" : "cell", fmt });
  });
  const tr = ["รวมทุกไซต์", ""].concat(colTot.map((v) => v || "")).concat([colTot.reduce((a, v) => a + v, 0)]);
  const tf = {}; for (let c = 2; c < tr.length; c++) tf[c] = "#,##0.0";
  R3.push({ cells: tr, kind: "total", fmt: tf });
  R3.push({ cells: ["หมายเหตุ: ผลิตรายวันจากประวัติที่ระบบซิงก์เก็บเอง (เริ่มนับวันที่ซิงก์ครั้งแรก) · ช่องว่าง = วันนั้นยังไม่มีข้อมูล · ยอดรวมรายวันอาจต่างจากยอดเดือนในแผ่นรายไซต์"], kind: "sub" });
  const ws3 = fsXSheet(X, R3, [34, 9].concat(dayCols.map(() => 8)).concat([12]));
  ws3["!freeze"] = { xSplit: 2, ySplit: 1 };

  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws1, "สรุป");
  X.utils.book_append_sheet(wb, ws2, "รายไซต์");
  X.utils.book_append_sheet(wb, ws3, "รายวัน");
  X.writeFile(wb, "สรุปผลิตไฟโซลาร์_" + mon + ".xlsx");
  return { sites: list.length, kwh: tot.kwh };
}

/* ไฟล์ของไซต์เดียว: รายวัน (พร้อมรายชั่วโมงสะสม) · 12 เดือนล่าสุด · รายการอุปกรณ์ */
async function fsExportSiteXlsx(site, devs, mon) {
  const X = window.XLSX;
  if (!X || !window.FBDB) throw new Error("ไม่พบไลบรารี Excel หรือฐานข้อมูล (ลองโหลดหน้าใหม่)");
  const DB = window.FBDB;
  const [dayVal, monVal] = await Promise.all([
    DB.ref("fsKpiDay/" + site.id).orderByKey().startAt(mon + "-01").endAt(mon + "-31").once("value").then((s) => s.val() || {}),
    DB.ref("fsKpiMonth/" + site.id).once("value").then((s) => s.val() || {}),
  ]);
  const cap = fsN(site.capacity_kw), nd = fsMonthDays(mon), cur = mon === fsBkk(Date.now()).mon;
  const S = [], sm = [];
  S.push({ cells: [(site.name || site.id) + " — " + fsMonFullTH(mon)], kind: "title", hpt: 26 }); sm.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
  S.push({ cells: [[site.fusionsolar_station_code, cap ? fsFmt(cap, 2) + " kWp" : "", site.address].filter(Boolean).join(" · ")], kind: "sub" }); sm.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
  S.push({ cells: [""], kind: "sub" });
  S.push({ cells: ["วันที่", "ผลิต kWh", "kWh/kWp", "ชั่วโมงแรกที่มีข้อมูล", "ชั่วโมงสุดท้าย", "หมายเหตุ"], kind: "head", hpt: 22 });
  let sum = 0, n = 0;
  for (let d = 1; d <= nd; d++) {
    const key = mon + "-" + String(d).padStart(2, "0");
    const rec = dayVal[key] || {};
    const v = fsN(rec.kwh), hs = Object.keys(rec.h || {}).sort();
    if (v != null) { sum += v; n++; }
    const today = cur && key === fsBkk(Date.now()).day;
    S.push({ cells: [fsDayTH(key), v == null ? "" : v, v != null && cap > 0 ? v / cap : "", hs[0] ? hs[0] + ":00" : "", hs.length ? hs[hs.length - 1] + ":00" : "", today ? "วันนี้ (ยังไม่จบ)" : v == null ? "ไม่มีข้อมูล" : ""],
      kind: d % 2 ? "cell" : "alt", fmt: { 1: "#,##0.0", 2: "#,##0.00" } });
  }
  const monK = cur && fsN(site.month_kwh) != null ? +site.month_kwh : fsN(monVal[mon]) != null ? +monVal[mon] : sum;
  S.push({ cells: ["รวม " + n + " วันที่มีข้อมูล", sum, cap > 0 ? sum / cap : "", "", "", "ยอดเดือนจาก FusionSolar " + fsFmt(monK, 1) + " kWh"], kind: "total", fmt: { 1: "#,##0.0", 2: "#,##0.00" } });
  const ws1 = fsXSheet(X, S, [16, 13, 11, 18, 14, 34], sm);

  const M = [{ cells: ["เดือน", "ผลิต kWh", "kWh/kWp", "ลด CO₂ kg"], kind: "head", hpt: 22 }];
  Object.keys(monVal).sort().slice(-24).forEach((k, i) => { const v = fsN(monVal[k]); M.push({ cells: [fsMonFullTH(k), v == null ? "" : v, v != null && cap > 0 ? v / cap : "", v != null ? v * FS_GRID_EF : ""], kind: i % 2 ? "alt" : "cell", fmt: { 1: "#,##0.0", 2: "#,##0.00", 3: "#,##0" } }); });
  const ws2 = fsXSheet(X, M, [20, 14, 11, 12]);

  const typeTH = window.fsDevTypeTH || ((t) => String(t));
  const Dv = [{ cells: ["ชื่ออุปกรณ์", "ประเภท", "รุ่น", "SN", "เวอร์ชันซอฟต์แวร์", "ผลิตสะสม kWh", "ค่าล่าสุดเมื่อ"], kind: "head", hpt: 22 }];
  (devs || []).forEach((d, i) => {
    const k = window.fsKpi ? window.fsKpi(d) : {};
    Dv.push({ cells: [d.dev_name || d.id, typeTH(d.dev_type_id), d.model || "", d.esn_code || "", d.software_version || "", fsN(k.total_cap) == null ? "" : +k.total_cap,
      d.last_kpi_at ? new Date(d.last_kpi_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }) : ""], kind: i % 2 ? "alt" : "cell", fmt: { 5: "#,##0.0" } });
  });
  const ws3 = fsXSheet(X, Dv, [28, 22, 22, 22, 18, 14, 20]);

  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws1, "รายวัน");
  X.utils.book_append_sheet(wb, ws2, "รายเดือน");
  X.utils.book_append_sheet(wb, ws3, "อุปกรณ์");
  X.writeFile(wb, "ผลิตไฟ_" + fsFileSafe(site.name || site.id) + "_" + mon + ".xlsx");
}

Object.assign(window, {
  fsCalm, FS_TREE_KG, FsCountUp, FsGauge, FsDonut, FsScene, FsFleetScene, FsKvGroups, FsStringGrid, fsStringsAll,
  fsExportMonthXlsx, fsExportSiteXlsx, fsMonFullTH,
});
