/* ============================================================
   flash+solar — ภาพ/อนิเมชันของหน้า FusionSolar (docs/fusionsolar.md)
   โหลดหลัง fusionsolar-viz.jsx ก่อน fusionsolar.jsx · ไม่มีการเขียนฐานข้อมูลในไฟล์นี้

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
  el.textContent = ":root{--fs-sun:#E8930C;--fs-bat:#7C5CD6}[data-theme=\"aurora\"]{--fs-sun:#F6A623;--fs-bat:#9A80F0}"
    + "@keyframes fsDash{to{stroke-dashoffset:-24}}.fs-dash{stroke-dasharray:6 6;animation:fsDash 1s linear infinite}"
    + "@keyframes fsIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.fs-in{animation:fsIn .45s ease both}"
    + ".fs-tr{transition:stroke-dasharray .9s cubic-bezier(.2,.8,.2,1),width .6s ease}"
    + "@keyframes fsPing{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.4);opacity:0}}"
    + ".fs-pin{position:relative;display:block;border-radius:50%;box-shadow:0 0 0 2.5px var(--surface),0 2px 6px rgba(0,0,0,.3);cursor:pointer}"
    + ".fs-pin.live::after{content:'';position:absolute;inset:0;border-radius:50%;background:inherit;animation:fsPing 2s ease-out infinite}"
    + ".fs-card-hov{transition:transform .15s ease,box-shadow .15s ease}.fs-card-hov:hover{transform:translateY(-2px);box-shadow:var(--shadow-card)}"
    + "@media (prefers-reduced-motion: reduce){.fs-dash,.fs-in,.fs-pin.live::after{animation:none!important}"
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
  fsCalm, FS_TREE_KG, FsCountUp, FsGauge, FsDonut, FsKvGroups, FsStringGrid, fsStringsAll,
  fsExportMonthXlsx, fsExportSiteXlsx, fsMonFullTH,
});
