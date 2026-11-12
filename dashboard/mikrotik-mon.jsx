/* ============================================================
   ไซต์ MikroTik เฟส 3 — หน้า "MikroTik Monitoring": ตารางไซต์ → ไซต์ (แท็บ มิเตอร์ / บิลรายเดือนแบบใบแจ้งค่าไฟการไฟฟ้า)
   docs/mikrotik.md · ใช้ของจาก mikrotik.jsx (useMtSites mtCall mtIdent mtField mtErrBox) + mikrotik-status.jsx (useMtStatus mtState MtPill)
   + กราฟ window.FsTrendChart (fusionsolar-charts.jsx)

   ข้อมูล (agent บน VPS → /api/mikrotik/site?agent=1)
     mtStatus/{N}/meter/v          ค่าสดทุก 1 นาที
     mtMeter/{N}/h/{YYYYMMDD}/{HHMM} ราย 5 นาที (เวลาไทย · ข้อมูลแรก ๆ เป็นราย 15 นาที)
     mtMeter/{N}/d/{YYYYMMDD}      first/last ของวัน + kw_max
     mtBills/{N}/{YYYYMM}          บิลที่บันทึกแล้ว (เขียนผ่าน API bill-save เท่านั้น)
   หน้าเว็บไม่เขียนฐานเอง — ทุกการบันทึกผ่าน /api/mikrotik/site (ไม่ผูกระบบใบแจ้งหนี้ ผู้ใช้ไม่เอา 2026-11-11)
   ============================================================ */

const MT_REG_TH = { kwh_imp: "kWh Import (ไฟเข้า)", kwh_exp: "kWh Export (ไฟออก)", kwh_net: "kWh Net (สุทธิ)" };
const MT_MODEL_TH = { "leos-ipm310": "LEOS IPM310", "pm2200": "Schneider PM2200 (ผ่าน Waveshare) — ยังไม่ได้ลองเครื่องจริง", "none": "ไม่มีมิเตอร์" };
const MT_TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MT_TH_MON_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

/* วันที่ตามเวลาไทย → "YYYYMMDD" (ตรงกับ thSlot ใน api/_lib/mtagent.mjs) */
function mtThDay(ms) {
  const d = new Date((ms == null ? Date.now() : ms) + 7 * 3600e3);
  return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, "0") + String(d.getUTCDate()).padStart(2, "0");
}
const mtDayLabel = (k) => Number(k.slice(6, 8)) + " " + MT_TH_MON[Number(k.slice(4, 6)) - 1];
const mtNum = (v, d) => (v == null || !isFinite(v) ? "—" : Number(v).toLocaleString("th-TH", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d }));
const mtRegOf = (s) => (s && s.bill && s.bill.reg) || "kwh_imp";
const mtDayKwh = (d, reg) => (d && d.first && d.last && d.first[reg] != null && d.last[reg] != null ? Math.max(0, Math.abs(d.last[reg]) - Math.abs(d.first[reg])) : null);

/* อ่านโหนดเดียวแบบสด · path ว่าง = ไม่อ่าน */
function useMtRef(path) {
  const [val, setVal] = React.useState(undefined);
  React.useEffect(() => {
    setVal(undefined);
    if (!path || !window.FBDB) return;
    const ref = window.FBDB.ref(path);
    const h = ref.on("value", (s) => setVal(s.val()), () => setVal(null));
    return () => ref.off("value", h);
  }, [path]);
  return val;
}

const mtCard = { background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 };
function MtStat({ label, value, unit, sub }) {
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", padding: "12px 16px", minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--mono)", color: "var(--text-1)" }}>{value}<span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginLeft: 5 }}>{unit}</span></div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

/* ---------- ตารางรายชื่อไซต์ (แบบหน้า Monitoring ของ FusionSolar — ผู้ใช้ 2026-11-11 "ทำเป็นแถบแบบนี้แล้วค่อยกดเข้าไปดูไซต์เอง") ---------- */
const MT_TONE_DOT = { green: "var(--tint-ok-tx)", amber: "var(--tint-amber-tx)", red: "var(--tint-red-tx)", gray: "var(--text-3)" };
function MtMonRow({ s, st, now, i, onOpen }) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const k = window.mtState ? window.mtState(s, st, now) : { label: "", tone: "gray" };
  const m = st && st.meter, v = (m && m.v) || {};
  const reg = mtRegOf(s), today = mtThDay(now), mon = today.slice(0, 6);
  const dayKwh = mtDayKwh(days && days[today], reg);
  const monKeys = Object.keys(days || {}).filter((x) => x.slice(0, 6) === mon);
  const monKwh = monKeys.length ? monKeys.reduce((t, x) => t + (mtDayKwh(days[x], reg) || 0), 0) : null;
  const td = { padding: "11px 14px", verticalAlign: "middle", background: i % 2 ? "var(--fs-zebra)" : "transparent" };
  const nm = Object.assign({}, td, { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" });
  const meterBad = m && !(m.modbus && m.modbus.ok);
  return (
    <tr className="fs-row" onClick={onOpen} style={{ cursor: "pointer" }}>
      <td style={Object.assign({}, td, { maxWidth: 300 })}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mtCustOf(s).cust || s.name}</span>
          {meterBad && <span title={"มิเตอร์ไม่ตอบ" + (m.error ? " — " + m.error : "")} style={{ display: "flex" }}><Icon name="alert" size={13} color="var(--tint-amber-tx)" /></span>}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", marginTop: 1 }}>{mtIdent(s)} · {MT_MODEL_TH[s.meter_model || "leos-ipm310"].split(" (")[0].split(" —")[0]}</div>
      </td>
      <td style={Object.assign({}, td, { whiteSpace: "nowrap" })} title={k.why}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: MT_TONE_DOT[k.tone] }} />{k.label}
        </span>
      </td>
      <td style={Object.assign({}, nm, { fontWeight: 700 })}>{mtNum(v.kw, 1)}</td>
      <td style={Object.assign({}, nm, { fontWeight: 700 })}>{mtNum(dayKwh, 1)}</td>
      <td style={nm}>{mtNum(monKwh, 0)}</td>
      <td style={nm}>{mtNum(v[reg] != null ? v[reg] / 1000 : null, 2)}</td>
      <td style={Object.assign({}, td, { color: "var(--text-3)", whiteSpace: "nowrap", fontSize: 12 })}>{st && st.at ? (window.mtAgo ? window.mtAgo(now - Date.parse(st.at)) : new Date(st.at).toLocaleTimeString("th-TH")) : "—"}</td>
    </tr>
  );
}
function MtMonTable({ sites, status, now, onOpen }) {
  const cols = [["ไซต์"], ["สถานะ"], ["ตอนนี้", "kW", 1], ["วันนี้", "kWh", 1], ["เดือนนี้", "kWh", 1], ["เลขมิเตอร์", "MWh", 1], ["อัปเดต"]];
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
        <thead><tr>{cols.map(([t, u, num]) => (
          <th key={t} style={{ padding: "12px 14px 10px", textAlign: num ? "right" : "left", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", color: "var(--text-3)", boxShadow: "inset 0 -1px 0 var(--divider)" }}>
            {t}{u && <span style={{ fontWeight: 500, marginLeft: 4 }}>{u}</span>}</th>))}</tr></thead>
        <tbody>{sites.map((s, i) => <MtMonRow key={s.n} s={s} st={status && status[s.n]} now={now} i={i} onOpen={() => onOpen(s.n)} />)}</tbody>
      </table>
    </div>
  );
}

/* ---------- การ์ดไซต์ (ไม่ได้ใช้ในหน้าแล้ว — เก็บไว้เผื่อมือถือ) ---------- */
function MtMonCard({ s, st, now, picked, onPick }) {
  const today = useMtRef("mtMeter/" + s.n + "/d/" + mtThDay(now));
  const k = window.mtState ? window.mtState(s, st, now) : { label: "", tone: "gray" };
  const m = st && st.meter;
  const v = (m && m.v) || {};
  const reg = mtRegOf(s);
  const kwh = mtDayKwh(today, reg);
  return (
    <button type="button" onClick={onPick} style={Object.assign({}, mtCard, { textAlign: "left", cursor: "pointer", border: "none", fontFamily: "inherit",
      boxShadow: picked ? "0 0 0 2px var(--primary), var(--shadow-card)" : "var(--shadow-card)" })}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>{mtIdent(s)}</div>
        <div style={{ flex: 1 }} />
        {window.MtPill && <window.MtPill state={k} />}
      </div>
      {mtCustOf(s).cust && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: -4 }}>{mtCustOf(s).cust}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>กำลังไฟตอนนี้</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--mono)" }}>{mtNum(v.kw, 2)} <span style={{ fontSize: 11, color: "var(--text-3)" }}>kW</span></div></div>
        <div><div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>วันนี้</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--mono)" }}>{mtNum(kwh, 1)} <span style={{ fontSize: 11, color: "var(--text-3)" }}>kWh</span></div></div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
        {!m ? "ไม่ได้ตั้งมิเตอร์" : !m.modbus || !m.modbus.ok ? "มิเตอร์ไม่ตอบ" + (m.error ? " — " + m.error : "")
          : "V " + [v.v1, v.v2, v.v3].map((x) => mtNum(x, 0)).join(" / ") + " · A " + [v.i1, v.i2, v.i3].map((x) => mtNum(x, 1)).join(" / ")}
      </div>
    </button>
  );
}

/* ---------- รายละเอียดไซต์: แท็บ "มิเตอร์" / "บิลรายเดือน" (บิลกดจากในไซต์เท่านั้น — ผู้ใช้ 2026-11-11) ---------- */
function MtMonDetail({ s, st, isAdmin, canEdit, onBack }) {
  const [tab, setTab] = React.useState("meter");
  const opts = [{ value: "meter", label: "มิเตอร์" }, { value: "bill", label: "บิลรายเดือน" }, { value: "info", label: "ข้อมูลไซต์" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="chevronLeft" size={14} />ทุกไซต์</button>
        <div style={{ fontWeight: 700 }}>{mtCustOf(s).cust || mtIdent(s)}</div>
        <div style={{ flex: 1 }} />
        {window.Segmented ? <window.Segmented value={tab} onChange={setTab} options={opts} />
          : opts.map((o) => <button key={o.value} className={tab === o.value ? "btn btn-pri" : "btn"} onClick={() => setTab(o.value)}>{o.label}</button>)}
      </div>
      {tab === "bill" ? <MtSiteBill s={s} st={st} isAdmin={isAdmin} canEdit={canEdit} />
        : tab === "info" ? <MtSiteInfo key={s.n} s={s} canEdit={canEdit} />
        : <MtMonMeter s={s} st={st} isAdmin={isAdmin} />}
    </div>
  );
}
function MtMonMeter({ s, st, isAdmin }) {
  const [day, setDay] = React.useState(mtThDay());
  const hist = useMtRef("mtMeter/" + s.n + "/h/" + day);
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const reg = mtRegOf(s);
  const v = (st && st.meter && st.meter.v) || {};
  const C = window.FsTrendChart;
  const dayBars = Object.keys(hist || {}).sort().map((hm) => {
    const r = hist[hm] || {};
    return { k: hm, t: Number(hm.slice(0, 2)) * 60 + Number(hm.slice(2)), value: r.kw != null ? Math.round(r.kw * 100) / 100 : null,
      label: hm.slice(0, 2) + ":" + hm.slice(2), tip: [hm.slice(0, 2) + ":" + hm.slice(2) + " น."] };
  });
  const month = day.slice(0, 6);
  const monBars = Object.keys(days || {}).filter((k) => k.slice(0, 6) === month).sort().map((k) => {
    const val = mtDayKwh(days[k], reg);
    return { k, label: String(Number(k.slice(6))), value: val != null ? Math.round(val * 10) / 10 : null, tip: [mtDayLabel(k)], partial: k === mtThDay() };
  });
  const monSum = monBars.reduce((t, b) => t + (b.value || 0), 0);
  const dayIso = day.slice(0, 4) + "-" + day.slice(4, 6) + "-" + day.slice(6);
  const row = (label, vals, unit, d) => (
    <tr><td style={{ fontSize: 12, color: "var(--text-3)", padding: "4px 10px 4px 0", whiteSpace: "nowrap" }}>{label}</td>
      {vals.map((x, i) => <td key={i} style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, padding: "4px 12px", textAlign: "right" }}>{mtNum(x, d)}</td>)}
      <td style={{ fontSize: 11, color: "var(--text-3)" }}>{unit}</td></tr>
  );
  return (
    <div style={mtCard}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--mono)" }}>{mtIdent(s)}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>{MT_MODEL_TH[s.meter_model || "leos-ipm310"]} · คิดผลิต/บิลจาก {MT_REG_TH[reg]}</div>
        <div style={{ flex: 1 }} />
        <input type="date" value={dayIso} max={(() => { const t = mtThDay(); return t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6); })()}
          onChange={(e) => e.target.value && setDay(e.target.value.replace(/-/g, ""))} style={Object.assign({}, mtField, { width: "auto", padding: "6px 10px", background: "var(--surface2)", boxShadow: "var(--shadow-inset)" })} />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700 }}>กำลังไฟ {mtDayLabel(day)} (ราย 5 นาที)</div>
      {C ? <C mode="time" t0={0} t1={1440} bars={dayBars.some((b) => b.value != null) ? dayBars : []} unit="kW" height={200}
        empty={hist === undefined ? "กำลังโหลด…" : "ยังไม่มีข้อมูลของวันนี้ — agent เก็บทุก 5 นาที"} /> : null}
      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>พลังงานรายวัน เดือน{MT_TH_MON_FULL[Number(month.slice(4)) - 1]}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>รวม {mtNum(monSum, 1)} kWh</div>
      </div>
      {C ? <C mode="bars" bars={monBars} unit="kWh" height={180} empty="ยังไม่มีข้อมูลรายวันของเดือนนี้" /> : null}
      <div style={{ fontSize: 12.5, fontWeight: 700 }}>ค่าสดจากมิเตอร์ {st && st.at ? <span style={{ fontWeight: 400, color: "var(--text-3)" }}>· {new Date(st.at).toLocaleTimeString("th-TH")}</span> : null}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <thead><tr><th /><th style={{ fontSize: 11, color: "var(--text-3)", padding: "0 12px" }}>L1</th><th style={{ fontSize: 11, color: "var(--text-3)", padding: "0 12px" }}>L2</th><th style={{ fontSize: 11, color: "var(--text-3)", padding: "0 12px" }}>L3</th><th /></tr></thead>
          <tbody>
            {row("แรงดัน", [v.v1, v.v2, v.v3], "V", 1)}
            {row("กระแส", [v.i1, v.i2, v.i3], "A", 2)}
            {row("กำลังไฟ", [v.kw1, v.kw2, v.kw3], "kW", 2)}
          </tbody>
        </table>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
        <MtSpec label="kW รวม" value={mtNum(v.kw, 2)} mono />
        <MtSpec label="PF" value={mtNum(v.pf, 2)} mono />
        <MtSpec label="ความถี่ (Hz)" value={mtNum(v.hz, 1)} mono />
        <MtSpec label="kWh Import" value={mtNum(v.kwh_imp, 1)} mono />
        <MtSpec label="kWh Export" value={mtNum(v.kwh_exp == null ? null : Math.abs(v.kwh_exp), 1)} mono />
        <MtSpec label="kWh Net" value={mtNum(v.kwh_net, 1)} mono />
      </div>
      {isAdmin && <MtMeterCfg s={s} />}
      <MtMeterReport s={s} days={days} month={month} reg={reg} />
    </div>
  );
}

/* ---------- รายงานรายวัน / รายเดือน (ผู้ใช้ 2026-11-12 "meter มี daily report กับ monthly report เอามาแสดงได้ไหม")
   คิดจากเลขที่ agent เก็บเอง (mtMeter/N/d first/last/kw_max) — ตัวเลขเดียวกับในมิเตอร์ · ดาวน์โหลด CSV ได้ ---------- */
function MtMeterReport({ s, days, month, reg }) {
  const [mode, setMode] = React.useState("day");
  const D = days || {};
  const keys = Object.keys(D).sort();
  const val = (r) => (r && r[reg] != null ? Math.abs(r[reg]) : null);
  const dayRows = keys.filter((k) => k.slice(0, 6) === month).map((k) => {
    const d = D[k] || {};
    return { k, label: mtDayLabel(k) + " " + (Number(k.slice(0, 4)) + 543), first: val(d.first), last: val(d.last), kwh: mtDayKwh(d, reg), kwmax: d.kw_max };
  });
  const mons = {};
  keys.forEach((k) => {
    const m = k.slice(0, 6), d = D[k] || {}, e = mons[m] || (mons[m] = { k: m, days: 0, kwh: 0, kwmax: 0, first: null, last: null });
    const x = mtDayKwh(d, reg);
    e.days++; e.kwh += x || 0; e.kwmax = Math.max(e.kwmax, Number(d.kw_max) || 0);
    if (e.first == null) e.first = val(d.first);
    e.last = val(d.last) != null ? val(d.last) : e.last;
  });
  const monRows = Object.values(mons).sort((a, b) => (a.k < b.k ? 1 : -1)).map((e) => Object.assign(e, { label: mtMonTH(e.k.slice(0, 4) + "-" + e.k.slice(4)) }));
  const rows = mode === "day" ? dayRows : monRows;
  const total = rows.reduce((t, r) => t + (r.kwh || 0), 0);
  const csv = () => {
    const head = mode === "day" ? ["วันที่", "เลขต้นวัน kWh", "เลขท้ายวัน kWh", "พลังงาน kWh", "kW สูงสุด"] : ["เดือน", "วันที่มีข้อมูล", "เลขต้นเดือน kWh", "เลขล่าสุด kWh", "พลังงาน kWh", "kW สูงสุด"];
    const body = rows.map((r) => (mode === "day" ? [r.k.slice(0, 4) + "-" + r.k.slice(4, 6) + "-" + r.k.slice(6), r.first, r.last, r.kwh, r.kwmax]
      : [r.k.slice(0, 4) + "-" + r.k.slice(4), r.days, r.first, r.last, Math.round(r.kwh * 1000) / 1000, r.kwmax]).map((x) => (x == null ? "" : x)).join(","));
    mtDownload("\ufeff" + [head.join(",")].concat(body).join("\n"), "SITE" + mtPad(s.n) + "-" + (mode === "day" ? "daily-" + month : "monthly") + ".csv");
  };
  const th = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "right", padding: "6px 8px", whiteSpace: "nowrap" };
  const opts = [{ value: "day", label: "รายวัน" }, { value: "month", label: "รายเดือน" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>รายงาน{mode === "day" ? "รายวัน เดือน" + MT_TH_MON_FULL[Number(month.slice(4)) - 1] : "รายเดือน"}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>รวม {mtNum(total, 3)} kWh · {MT_REG_TH[reg]}</div>
        <div style={{ flex: 1 }} />
        {window.Segmented ? <window.Segmented value={mode} onChange={setMode} options={opts} /> : null}
        <button className="btn btn-sm" disabled={!rows.length} onClick={csv} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="download" size={13} />CSV</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={Object.assign({}, th, { textAlign: "left" })}>{mode === "day" ? "วันที่" : "เดือน"}</th>
            {mode === "month" && <th style={th}>วันที่มีข้อมูล</th>}
            <th style={th}>{mode === "day" ? "เลขต้นวัน" : "เลขต้นเดือน"} (kWh)</th><th style={th}>{mode === "day" ? "เลขท้ายวัน" : "เลขล่าสุด"} (kWh)</th>
            <th style={th}>พลังงาน (kWh)</th><th style={th}>kW สูงสุด</th>
          </tr></thead>
          <tbody>{rows.map((r, i) => {
            const td = { padding: "7px 8px", fontSize: 12.5, textAlign: "right", fontFamily: "var(--mono)", background: i % 2 ? "var(--fs-zebra)" : "transparent" };
            return (
              <tr key={r.k}>
                <td style={Object.assign({}, td, { textAlign: "left", fontFamily: "inherit", fontWeight: 600 })}>{r.label}</td>
                {mode === "month" && <td style={td}>{r.days}</td>}
                <td style={td}>{mtNum(r.first, 3)}</td><td style={td}>{mtNum(r.last, 3)}</td>
                <td style={Object.assign({}, td, { fontWeight: 700 })}>{mtNum(r.kwh, 3)}</td><td style={td}>{mtNum(r.kwmax, 2)}</td>
              </tr>
            ); })}</tbody>
        </table>
        {!rows.length && <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: 8 }}>{days === undefined ? "กำลังโหลด…" : "ยังไม่มีข้อมูล"}</div>}
      </div>
    </div>
  );
}

function MtMeterCfg({ s }) {
  const [model, setModel] = React.useState(s.meter_model || "leos-ipm310");
  const [unit, setUnit] = React.useState(String(s.meter_unit == null ? 1 : s.meter_unit));
  const [msg, setMsg] = React.useState("");
  const dirty = model !== (s.meter_model || "leos-ipm310") || unit !== String(s.meter_unit == null ? 1 : s.meter_unit);
  const save = async () => {
    setMsg("กำลังบันทึก…");
    try { await mtCall({ action: "meter-cfg", n: s.n, meter_model: model, meter_unit: Number(unit) }); setMsg("บันทึกแล้ว — agent ใช้ค่าใหม่ในรอบถัดไป"); }
    catch (e) { setMsg(String(e.message || e)); }
  };
  const fld = Object.assign({}, mtField, { width: "auto", padding: "7px 10px", background: "var(--surface2)", boxShadow: "var(--shadow-inset)" });
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingTop: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>มิเตอร์ที่ 10.10.{s.n}.20</span>
      <select value={model} onChange={(e) => setModel(e.target.value)} style={fld}>
        {Object.keys(MT_MODEL_TH).map((k) => <option key={k} value={k}>{MT_MODEL_TH[k]}</option>)}
      </select>
      <span style={{ fontSize: 12, color: "var(--text-3)" }} title="เลขประจำตัวมิเตอร์บนสาย Modbus — ตั้งไว้ที่ตัวมิเตอร์ (LEOS ค่าโรงงาน = 1) · ต่อมิเตอร์ตรง LAN ตัวเดียวใช้ 1 · ผ่าน Waveshare หลายตัวต้องไม่ซ้ำกัน">เลขเครื่อง Modbus (unit id)</span>
      <input value={unit} onChange={(e) => setUnit(e.target.value.replace(/\D/g, ""))} style={Object.assign({}, fld, { width: 60, textAlign: "right" })} />
      <button className="btn btn-sm" disabled={!dirty} onClick={save}>บันทึก</button>
      {msg && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{msg}</span>}
    </div>
  );
}

/* =================================================================
   บิลค่าไฟโซลาร์รายเดือน — แบบใบแจ้งค่าไฟของการไฟฟ้า (ผู้ใช้ 2026-11-11 "ไม่อยากทำเป็นใบแจ้งหนี้ อยากให้เหมือนเรียกเก็บแบบการไฟฟ้า
   ว่าจดยอดก่อนหลังเมื่อไหร่ คิดเป็นเงินเท่าไหร่" · "อยากแค่ให้อยู่ในส่วนนี้" = แสดงในแท็บบิลของไซต์ ไม่ผูกระบบใบแจ้งหนี้)
   จดครั้งก่อน = ค่าแรกของวันแรกที่มีข้อมูลในเดือน · จดครั้งนี้ = ค่าแรกของวันที่ 1 เดือนถัดไป (เดือนยังไม่จบ = ค่าสดตอนนี้)
   เลขมิเตอร์แก้ไม่ได้ แก้ได้แค่ราคาต่อหน่วย (ผู้ใช้ 2026-11-11) — ตอนบันทึกเซิร์ฟเวอร์อ่านเลขเองด้วยสูตรเดียวกัน (billReadings ใน api/_lib/mikrotik.mjs)
   ผู้ออกบิล = บริษัทของพาร์ทเนอร์เจ้าของไซต์ (mtPartners/{owner}/company) · ลูกค้า = ทะเบียนไซต์ (mtSites/N/info)
   ================================================================= */
function mtMonthKeys(ym) {   // "2026-11" → { pre: "202611", next: "202612" }
  const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return { pre: ym.replace("-", ""), next: ny + String(nm).padStart(2, "0") };
}
const mtAtOf = (dayKey, hm) => dayKey.slice(0, 4) + "-" + dayKey.slice(4, 6) + "-" + dayKey.slice(6) + " " + hm.slice(0, 2) + ":" + hm.slice(2);
function mtAtOfMs(ms) { const d = new Date(ms + 7 * 3600e3); return mtAtOf(mtThDay(ms), String(d.getUTCHours()).padStart(2, "0") + String(d.getUTCMinutes()).padStart(2, "0")); }
/* "2026-11-01 00:00" → "1 พ.ย. 2569 เวลา 00:00 น." */
function mtFmtAt(at) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/.exec(String(at || ""));
  if (!m) return "—";
  return Number(m[3]) + " " + MT_TH_MON[Number(m[2]) - 1] + " " + (Number(m[1]) + 543) + (m[4] ? " เวลา " + m[4] + ":" + m[5] + " น." : "");
}
const mtMonTH = (ym) => MT_TH_MON_FULL[Number(ym.slice(5, 7)) - 1] + " " + (Number(ym.slice(0, 4)) + 543);
function mtCustOf(s) {   // ทะเบียนไซต์ (info) · ไซต์เก่าที่ยังไม่ลงทะเบียนใช้ชื่อ/ที่อยู่จากตั้งค่าบิลเดิม
  const o = Object.assign({}, s.info || {});
  if (!o.cust) o.cust = (s.bill && s.bill.cust) || "";
  if (!o.addr) o.addr = (s.bill && s.bill.addr) || "";
  return o;
}

/* live = { v, at } ค่าสดจาก mtStatus — เดือนที่ยังไม่จบใช้เป็นเลขจดครั้งนี้ */
function mtBillAuto(days, ym, reg, live) {
  const { pre, next } = mtMonthKeys(ym);
  const keys = Object.keys(days || {}).sort();
  const inMon = keys.filter((k) => k.slice(0, 6) === pre && days[k] && days[k].first && days[k].first[reg] != null);
  const out = { start: null, end: null, start_at: "", end_at: "", warn: [], partial: false };
  if (!inMon.length) { out.warn.push("เดือนนี้ยังไม่มีข้อมูลมิเตอร์ (เริ่มเก็บเมื่อติดตั้ง agent)"); return out; }
  const k0 = inMon[0], f0 = days[k0].first;
  out.start = f0[reg]; out.start_at = mtAtOf(k0, f0.t);
  if (!k0.endsWith("01") || f0.t !== "0000") out.warn.push("เดือนแรกที่เก็บข้อมูล — จดครั้งก่อนเป็นค่าแรกที่มี ไม่ใช่ต้นเดือนพอดี");
  /* มิเตอร์ถูกรีเซ็ต (เลขกระโดดลง) → นับจาก 0 ตั้งแต่วันนั้น — สูตรเดียวกับ billReadings ฝั่งเซิร์ฟเวอร์ */
  const resetAt = (k) => { out.start = 0; out.start_at = k.length === 8 ? k.slice(0, 4) + "-" + k.slice(4, 6) + "-" + k.slice(6) : k; out.reset = true; };
  let prev = null;
  inMon.forEach((k) => {
    const f = days[k].first[reg], l = days[k].last && days[k].last[reg] != null ? days[k].last[reg] : f;
    if ((prev != null && f < prev - 0.5) || l < f - 0.5) resetAt(k);
    prev = l;
  });
  const k1 = next + "01";
  if (days[k1] && days[k1].first && days[k1].first[reg] != null) {
    out.end = days[k1].first[reg]; out.end_at = mtAtOf(k1, days[k1].first.t);
  } else if (live && live.v && live.v[reg] != null && mtThDay(live.at).slice(0, 6) === pre) {
    out.end = live.v[reg]; out.end_at = mtAtOfMs(live.at); out.partial = true;
    out.warn.push("เดือนยังไม่จบ — เป็นยอดถึงตอนนี้ ค่าเปลี่ยนตามมิเตอร์ (บันทึกบิลหลังวันที่ 1 เดือนหน้า)");
  } else {
    const kl = inMon[inMon.length - 1], l = days[kl].last || days[kl].first;
    out.end = l[reg]; out.end_at = mtAtOf(kl, l.t);
    out.warn.push("ยังไม่มีค่าวันที่ 1 เดือนถัดไป — จดครั้งนี้เป็นค่าล่าสุดที่เก็บได้");
  }
  if (out.end != null && out.end < out.start - 0.5) resetAt(out.end_at.slice(0, 10));
  if (out.reset) out.warn.push("มิเตอร์ถูกรีเซ็ตในเดือนนี้ — จดครั้งก่อนนับจาก 0 ตั้งแต่วันที่รีเซ็ต");
  return out;
}

/* ---------- พิมพ์บิลที่บันทึกแล้ว (หน้าต่างใหม่ → สั่งพิมพ์/บันทึก PDF) ---------- */
const mtEsc = (x) => String(x == null ? "" : x).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function mtBillPrint(bill, s, logo) {
  const w = window.open("", "_blank");
  if (!w) return;
  const iss = bill.issuer || {};
  const n2 = (v) => mtNum(v, 2), n3 = (v) => mtNum(v, 3);
  const ym = bill.month || "";
  const baht = window.ecBahtText ? window.ecBahtText(bill.total) : "";
  const logoOk = /^data:image\/(png|jpeg|webp);base64,/.test(String(logo || ""));
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + mtEsc(bill.no) + '</title><style>' +
    'body{font-family:"IBM Plex Sans Thai",Tahoma,sans-serif;color:#111;margin:0;padding:28px;font-size:13px}' +
    '.top{display:flex;gap:16px;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px}.top img{max-height:70px;max-width:160px}' +
    'h1{font-size:18px;margin:14px 0 2px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:7px 8px;border-bottom:1px solid #ddd;text-align:left}' +
    '.r{text-align:right;font-family:monospace;white-space:nowrap}.box{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.box div{background:#f5f5f5;padding:10px;border-radius:6px}' +
    '.tot td{font-size:16px;font-weight:800;border-bottom:2px solid #111}.muted{color:#666;font-size:11px}@page{size:A4;margin:14mm}</style></head><body>' +
    '<div class="top">' + (logoOk ? '<img src="' + logo + '">' : '') + '<div style="flex:1"><div style="font-size:16px;font-weight:800">' + mtEsc(iss.name || "") + '</div>' +
    '<div>' + mtEsc(iss.addr || "").replace(/\n/g, "<br>") + '</div>' +
    '<div>' + (iss.tax ? "เลขประจำตัวผู้เสียภาษี " + mtEsc(iss.tax) + (iss.branch ? " (" + mtEsc(iss.branch) + ")" : "") : "") + (iss.phone ? " · โทร " + mtEsc(iss.phone) : "") + '</div></div>' +
    '<div style="text-align:right">เลขที่<br><b style="font-family:monospace">' + mtEsc(bill.no) + '</b><br>วันที่ออก ' + mtEsc(new Date(bill.at).toLocaleDateString("th-TH", { dateStyle: "long" })) + '</div></div>' +
    '<h1>ใบแจ้งค่าไฟฟ้า ระบบโซลาร์เซลล์</h1><div>ประจำเดือน ' + mtEsc(mtMonTH(ym)) + '</div>' +
    '<div class="box"><div><div class="muted">ผู้ใช้ไฟ</div><b>' + mtEsc(bill.cust) + '</b><br>' + mtEsc(bill.addr).replace(/\n/g, "<br>") +
    (bill.cust_tax ? '<br>เลขประจำตัวผู้เสียภาษี ' + mtEsc(bill.cust_tax) + (bill.cust_branch ? " (" + mtEsc(bill.cust_branch) + ")" : "") : "") + '</div>' +
    '<div><div class="muted">สถานที่ติดตั้ง / มิเตอร์</div><b>' + mtEsc(bill.place || mtIdent(s)) + '</b>' + (bill.ca ? '<br>เลขที่ผู้ใช้ไฟ ' + mtEsc(bill.ca) : "") +
    (bill.meter_no ? '<br>เลขมิเตอร์ ' + mtEsc(bill.meter_no) : "") + '<br>' + mtEsc(MT_REG_TH[bill.reg] || "") + '</div></div>' +
    '<table><tr><th>การจดหน่วย</th><th>วันที่ / เวลาที่จด</th><th class="r">เลขอ่านมิเตอร์ (kWh)</th></tr>' +
    '<tr><td>จดครั้งก่อน</td><td>' + mtEsc(mtFmtAt(bill.start_at)) + '</td><td class="r">' + n3(bill.start) + '</td></tr>' +
    '<tr><td>จดครั้งนี้</td><td>' + mtEsc(mtFmtAt(bill.end_at)) + '</td><td class="r">' + n3(bill.end) + '</td></tr>' +
    '<tr><td colspan="2"><b>หน่วยที่ใช้</b></td><td class="r"><b>' + n3(bill.kwh) + '</b></td></tr></table>' +
    '<table><tr><td>ค่าพลังงานไฟฟ้า ' + n2(bill.kwh) + ' หน่วย × ' + mtNum(bill.rate, 4) + ' บาท/หน่วย</td><td class="r">' + n2(bill.amount) + '</td></tr>' +
    '<tr><td>ภาษีมูลค่าเพิ่ม ' + (bill.vat_rate ? bill.vat_rate + "%" : "(ไม่คิด)") + '</td><td class="r">' + n2(bill.vat) + '</td></tr>' +
    '<tr class="tot"><td>รวมเงินที่ต้องชำระ' + (baht ? '<div style="font-size:12px;font-weight:600">(' + mtEsc(baht) + ')</div>' : "") + '</td><td class="r">' + n2(bill.total) + ' บาท</td></tr></table>' +
    '<p class="muted">เลขมิเตอร์อ่านอัตโนมัติจากมิเตอร์ของระบบ · ออกบิลโดย ' + mtEsc(bill.by) + '</p>' +
    '<script>setTimeout(function(){print()},300)<\/script></body></html>');
  w.document.close();
}

/* ---------- ใบแจ้งค่าไฟของเดือนเดียว ---------- */
function MtBillSheet({ s, st, ym, canEdit, onCfg }) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const saved = useMtRef("mtBills/" + s.n + "/" + ym.replace("-", ""));
  const owner = useMtRef(s.owner ? "mtPartners/" + s.owner : "");
  const reg = mtRegOf(s);
  const b = s.bill || {};
  const live = st && st.meter && st.meter.modbus && st.meter.modbus.ok && st.meter.v ? { v: st.meter.v, at: Date.parse(st.at) } : null;
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg, live), [days, ym, reg, live && live.v[reg], live && live.at]);
  const [recalc, setRecalc] = React.useState(false);
  const [rateIn, setRateIn] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  /* บิลที่บันทึกแล้ว = ค่าทางการ (ไม่เปลี่ยนตามมิเตอร์) · ยังไม่บันทึก/กดคำนวณใหม่ = คำนวณจากมิเตอร์ */
  const useSaved = saved && !recalc;
  const src = useSaved ? saved : auto;
  const start = src.start == null ? null : Number(src.start), end = src.end == null ? null : Number(src.end);
  const rate = useSaved ? Number(saved.rate) : rateIn != null && rateIn !== "" ? Number(rateIn) : b.rate != null ? Number(b.rate) : null;
  const vatRate = useSaved ? Number(saved.vat_rate || 0) : b.vat === false ? 0 : 7;
  const ok = start != null && end != null && isFinite(start) && isFinite(end) && end >= start;
  const kwh = ok ? Math.round((end - start) * 1000) / 1000 : null;
  const amount = ok && rate != null && isFinite(rate) ? Math.round(kwh * rate * 100) / 100 : null;
  const vat = amount != null ? Math.round(amount * vatRate) / 100 : null;
  const total = amount != null ? Math.round((amount + vat) * 100) / 100 : null;
  const company = (owner && owner.company) || {};
  const iss = useSaved ? saved.issuer || null : s.owner ? Object.assign({ name: owner && owner.name }, company) : null;
  const logo = iss && s.owner && (!useSaved || !saved.issuer || saved.issuer.pid === s.owner) ? company.logo : "";
  const ci = useSaved ? { cust: saved.cust, addr: saved.addr, tax: saved.cust_tax, branch: saved.cust_branch, place: saved.place, ca: saved.ca, meter_no: saved.meter_no } : mtCustOf(s);
  const save = async () => {
    setBusy(true); setErr("");
    try {
      await mtCall({ action: "bill-save", n: s.n, month: ym, rate });
      setRecalc(false); setRateIn(null);
    } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const L = { fontSize: 12, color: "var(--text-3)", padding: "7px 10px" };
  const V = { fontSize: 13.5, fontFamily: "var(--mono)", textAlign: "right", padding: "7px 10px", whiteSpace: "nowrap" };
  const box = { background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "10px 12px" };
  const baht = window.ecBahtText && total != null ? window.ecBahtText(total) : "";
  const hist = saved && saved.hist ? Object.keys(saved.hist).sort().reverse().map((k) => saved.hist[k]) : [];
  return (
    <div style={Object.assign({}, mtCard, { gap: 12 })}>
      {/* ผู้ออกบิล (บริษัทพาร์ทเนอร์เจ้าของไซต์) */}
      {iss && (iss.name || logo) && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 10, borderBottom: "1px solid var(--line, rgba(0,0,0,.08))" }}>
          {logo && <img src={logo} alt="" style={{ maxHeight: 52, maxWidth: 130, objectFit: "contain" }} />}
          <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>{iss.name}</div>
            {iss.addr && <div style={{ whiteSpace: "pre-line" }}>{iss.addr}</div>}
            {(iss.tax || iss.phone) && <div>{iss.tax ? "เลขประจำตัวผู้เสียภาษี " + iss.tax + (iss.branch ? " (" + iss.branch + ")" : "") : ""}{iss.phone ? " · โทร " + iss.phone : ""}</div>}
          </div>
        </div>
      )}
      {/* หัวใบ */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>ใบแจ้งค่าไฟฟ้า ระบบโซลาร์เซลล์</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>ประจำเดือน {mtMonTH(ym)}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right", fontSize: 12 }}>
          <div style={{ color: "var(--text-3)" }}>เลขที่</div>
          <div style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{(saved && saved.no) || "SITE" + mtPad(s.n) + "-" + ym.replace("-", "")}</div>
          {saved ? <div style={{ color: "var(--tint-ok-tx)", fontWeight: 700, marginTop: 2 }}>ออกบิลแล้ว {new Date(saved.at).toLocaleDateString("th-TH")}</div>
            : <div style={{ color: "var(--tint-amber-tx)", fontWeight: 700, marginTop: 2 }}>ยังไม่ออกบิล</div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        <div style={box}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>ผู้ใช้ไฟ</div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{ci.cust || <span style={{ color: "var(--tint-amber-tx)" }}>ยังไม่ลงทะเบียนลูกค้า (แท็บข้อมูลไซต์)</span>}</div>
          {ci.addr && <div style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "pre-line" }}>{ci.addr}</div>}
          {ci.tax && <div style={{ fontSize: 12, color: "var(--text-2)" }}>เลขประจำตัวผู้เสียภาษี {ci.tax}{ci.branch ? " (" + ci.branch + ")" : ""}</div>}
        </div>
        <div style={box}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>สถานที่ติดตั้ง / มิเตอร์</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{ci.place || <span style={{ fontFamily: "var(--mono)" }}>{mtIdent(s)}</span>}</div>
          {(ci.ca || ci.meter_no) && <div style={{ fontSize: 12, color: "var(--text-2)" }}>{ci.ca ? "เลขที่ผู้ใช้ไฟ " + ci.ca : ""}{ci.ca && ci.meter_no ? " · " : ""}{ci.meter_no ? "เลขมิเตอร์ " + ci.meter_no : ""}</div>}
          <div style={{ fontSize: 12, color: "var(--text-2)" }}>{MT_MODEL_TH[s.meter_model || "leos-ipm310"].split(" (")[0].split(" —")[0]} · {MT_REG_TH[reg]}</div>
        </div>
      </div>

      {/* ตารางจดหน่วย — เลขจากมิเตอร์ แก้ไม่ได้ */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>
          <th style={Object.assign({}, L, { textAlign: "left", fontWeight: 700 })}>การจดหน่วย</th>
          <th style={Object.assign({}, L, { textAlign: "left", fontWeight: 700 })}>วันที่ / เวลาที่จด</th>
          <th style={Object.assign({}, L, { textAlign: "right", fontWeight: 700 })}>เลขอ่านมิเตอร์ (kWh)</th>
        </tr></thead>
        <tbody>
          <tr style={{ background: "var(--fs-zebra)" }}>
            <td style={Object.assign({}, L, { color: "var(--text-1)" })}>จดครั้งก่อน</td>
            <td style={Object.assign({}, L, { color: "var(--text-1)" })}>{mtFmtAt(src.start_at)}</td>
            <td style={V}>{mtNum(start, 3)}</td>
          </tr>
          <tr>
            <td style={Object.assign({}, L, { color: "var(--text-1)" })}>จดครั้งนี้</td>
            <td style={Object.assign({}, L, { color: "var(--text-1)" })}>{mtFmtAt(src.end_at)}{(useSaved ? saved.partial : auto.partial) ? " (ค่าสด)" : ""}</td>
            <td style={V}>{mtNum(end, 3)}</td>
          </tr>
          <tr style={{ background: "var(--fs-zebra)" }}>
            <td style={Object.assign({}, L, { color: "var(--text-1)", fontWeight: 700 })} colSpan={2}>หน่วยที่ใช้ (ครั้งนี้ − ครั้งก่อน)</td>
            <td style={Object.assign({}, V, { fontWeight: 800 })}>{mtNum(kwh, 3)}</td>
          </tr>
        </tbody>
      </table>

      {/* ค่าไฟ — แก้ได้แค่ราคาต่อหน่วย */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={Object.assign({}, L, { color: "var(--text-1)" })}>
              ค่าพลังงานไฟฟ้า {mtNum(kwh, 2)} หน่วย ×{" "}
              {!useSaved && canEdit
                ? <input value={rateIn != null ? rateIn : rate == null ? "" : String(rate)} placeholder="ราคา" onChange={(e) => setRateIn(e.target.value.replace(/[^\d.]/g, ""))}
                    style={Object.assign({}, mtField, { width: 90, padding: "5px 8px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, background: "var(--surface2)", boxShadow: "var(--shadow-inset)" })} />
                : rate == null ? "—" : mtNum(rate, 4)}{" "}บาท/หน่วย
            </td>
            <td style={V}>{mtNum(amount, 2)}</td>
          </tr>
          <tr>
            <td style={Object.assign({}, L, { color: "var(--text-1)" })}>ภาษีมูลค่าเพิ่ม {vatRate ? vatRate + "%" : "(ไม่คิด)"}</td>
            <td style={V}>{mtNum(vat, 2)}</td>
          </tr>
          <tr style={{ background: "var(--primary-soft)" }}>
            <td style={{ padding: "11px 10px", fontSize: 14, fontWeight: 800, color: "var(--primary-dark)" }}>
              รวมเงินที่ต้องชำระ{baht && <div style={{ fontSize: 11.5, fontWeight: 600 }}>({baht})</div>}
            </td>
            <td style={Object.assign({}, V, { fontSize: 20, fontWeight: 800, color: "var(--primary-dark)" })}>{mtNum(total, 2)} <span style={{ fontSize: 12 }}>บาท</span></td>
          </tr>
        </tbody>
      </table>

      {!useSaved && auto.warn.map((w, i) => <div key={i} style={{ fontSize: 11.5, color: "var(--tint-amber-tx)" }}>{w}</div>)}
      {!useSaved && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>เลขมิเตอร์อ่านอัตโนมัติ แก้ไม่ได้ · แก้ได้เฉพาะราคาต่อหน่วย</div>}
      {useSaved && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>ออกบิลโดย <b>{saved.by}</b>{saved.by_kind === "partner" ? " (พาร์ทเนอร์)" : ""} · {mtWhen(saved.at)} · เลขในใบนี้คือค่าที่บันทึกไว้ ไม่เปลี่ยนตามมิเตอร์</div>}
      {hist.length > 0 && (
        <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
          ฉบับก่อนหน้า (ถูกออกทับ): {hist.map((h, i) => <span key={i}>{i ? " · " : ""}{mtWhen(h.at)} โดย {h.by} = {mtNum(h.total, 2)} บาท</span>)}
        </div>
      )}
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {canEdit && <button className="btn btn-sm btn-soft" onClick={onCfg}>ตั้งค่าบิล</button>}
        {useSaved && <button className="btn btn-sm" onClick={() => mtBillPrint(saved, s, logo)}>พิมพ์ / PDF</button>}
        {canEdit && useSaved && <button className="btn btn-sm" onClick={() => setRecalc(true)}>คำนวณใหม่</button>}
        {canEdit && recalc && <button className="btn btn-sm" onClick={() => { setRecalc(false); setRateIn(null); }}>ยกเลิก</button>}
        {canEdit && !useSaved && <button className="btn btn-sm btn-pri" disabled={!ok || rate == null || !isFinite(rate) || busy} onClick={save}>{busy ? "กำลังบันทึก…" : saved ? "ออกบิลทับ" : "ออกบิล"}</button>}
      </div>
    </div>
  );
}

/* ตั้งค่าบิล: ราคาต่อหน่วย + VAT · ช่องที่จดของมิเตอร์แก้ได้เฉพาะแอดมิน */
function MtBillCfg({ s, isAdmin, onClose }) {
  const b = s.bill || {};
  const [rate, setRate] = React.useState(b.rate == null ? "" : String(b.rate));
  const [reg, setReg] = React.useState(b.reg || "kwh_imp");
  const [vat, setVat] = React.useState(b.vat !== false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    setBusy(true); setErr("");
    try { await mtCall(Object.assign({ action: "bill-cfg", n: s.n, rate: Number(rate), vat }, isAdmin ? { reg } : {})); onClose(); } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const fld = Object.assign({}, mtField, { background: "var(--surface2)", boxShadow: "var(--shadow-inset)" });
  return (
    <div style={mtCard}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>ตั้งค่าบิล {mtIdent(s)}</div>
      <div style={{ display: "grid", gridTemplateColumns: isAdmin ? "140px 1fr" : "160px", gap: 10 }}>
        <div><div style={mtLbl}>ราคา (บาท/หน่วย)</div><input value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} style={Object.assign({}, fld, { textAlign: "right", fontFamily: "var(--mono)" })} /></div>
        {isAdmin && <div><div style={mtLbl}>จดหน่วยจากช่องไหนของมิเตอร์</div>
          <select value={reg} onChange={(e) => setReg(e.target.value)} style={fld}>{Object.keys(MT_REG_TH).map((k) => <option key={k} value={k}>{MT_REG_TH[k]}</option>)}</select></div>}
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}><input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} /> คิดภาษีมูลค่าเพิ่ม 7%</label>
      {isAdmin && <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>มิเตอร์วัดไฟโซลาร์จ่ายเข้าโรงงาน ปกติใช้ Import · ถ้าเลขไม่เดินทั้งที่ผลิตอยู่ ให้ลอง Export (ขึ้นกับทิศการต่อ CT)</div>}
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose} disabled={busy}>ยกเลิก</button>
        <button className="btn btn-pri" onClick={save} disabled={busy || rate === ""}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
      </div>
    </div>
  );
}

/* ---------- แท็บบิลของไซต์: เลือกเดือน + ใบแจ้งค่าไฟ + ประวัติบิล (ใครออก เมื่อไหร่) ---------- */
function MtSiteBill({ s, st, isAdmin, canEdit }) {
  const cur = (() => { const t = mtThDay(); return t.slice(0, 4) + "-" + t.slice(4, 6); })();
  const prev = (() => { const d = new Date(Date.now() + 7 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); })();
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const bills = useMtRef("mtBills/" + s.n);
  const [ym, setYm] = React.useState(null);
  const [cfg, setCfg] = React.useState(false);
  /* เดือนเริ่มต้น: เดือนก่อนถ้ามีข้อมูล (ออกบิลต้นเดือน) ไม่งั้นเดือนนี้ (ยอดถึงตอนนี้) */
  React.useEffect(() => {
    if (ym || days === undefined) return;
    setYm(Object.keys(days || {}).some((k) => k.slice(0, 6) === prev.replace("-", "")) ? prev : cur);
  }, [days]);
  const past = Object.keys(bills || {}).sort().reverse();
  const th = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "left", padding: "6px 8px", whiteSpace: "nowrap" };
  const [delErr, setDelErr] = React.useState("");
  const delBill = async (k, b) => {
    const ok = await window.askConfirm({ title: "ลบบิล " + (b.no || k) + "?",
      body: mtMonTH(k.slice(0, 4) + "-" + k.slice(4)) + " · " + mtNum(b.total != null ? b.total : b.amount, 2) + " บาท · ออกโดย " + (b.by || "—") + " — บิลจะหายจากหน้าเว็บ (ระบบเก็บสำเนาไว้หลังบ้าน)",
      ok: "ลบบิล", danger: true, icon: "trash" });
    if (!ok) return;
    setDelErr("");
    try { await mtCall({ action: "bill-del", n: s.n, month: k.slice(0, 4) + "-" + k.slice(4) }); } catch (e) { setDelErr(String(e.message || e)); }
  };
  if (!ym) return <div style={mtCard}><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด…</div></div>;
  return (
    <React.Fragment>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}>เดือน</div>
        <input type="month" value={ym} max={cur} onChange={(e) => e.target.value && setYm(e.target.value)}
          style={Object.assign({}, mtField, { width: "auto", padding: "6px 10px", background: "var(--surface)", boxShadow: "var(--shadow-sm)" })} />
      </div>
      {cfg && <MtBillCfg s={s} isAdmin={isAdmin} onClose={() => setCfg(false)} />}
      <MtBillSheet key={ym} s={s} st={st} ym={ym} canEdit={canEdit} onCfg={() => setCfg(true)} />
      {past.length > 0 && (
        <div style={mtCard}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>บิลที่ออกแล้ว</div>
          {delErr && <div style={mtErrBox}>{delErr}</div>}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>เดือน</th><th style={th}>เลขที่</th><th style={th}>จดครั้งก่อน</th><th style={th}>จดครั้งนี้</th>
                <th style={Object.assign({}, th, { textAlign: "right" })}>หน่วย</th><th style={Object.assign({}, th, { textAlign: "right" })}>รวมเงิน (บาท)</th>
                <th style={th}>ออกบิลโดย</th>{isAdmin && <th style={th} />}</tr></thead>
              <tbody>{past.map((k, i) => {
                const b = bills[k] || {}; const td = { padding: "8px", fontSize: 12.5, background: i % 2 ? "var(--fs-zebra)" : "transparent" };
                const nm = Object.assign({}, td, { textAlign: "right", fontFamily: "var(--mono)" });
                const nh = b.hist ? Object.keys(b.hist).length : 0;
                return (
                  <tr key={k} className="fs-row" onClick={() => setYm(k.slice(0, 4) + "-" + k.slice(4))} style={{ cursor: "pointer" }}>
                    <td style={Object.assign({}, td, { fontWeight: 700 })}>{mtMonTH(k.slice(0, 4) + "-" + k.slice(4))}</td>
                    <td style={Object.assign({}, td, { fontFamily: "var(--mono)" })}>{b.no}</td>
                    <td style={td}>{mtFmtAt(b.start_at).replace(/ เวลา.*/, "")} · {mtNum(b.start, 1)}</td>
                    <td style={td}>{mtFmtAt(b.end_at).replace(/ เวลา.*/, "")} · {mtNum(b.end, 1)}</td>
                    <td style={nm}>{mtNum(b.kwh, 2)}</td>
                    <td style={Object.assign({}, nm, { fontWeight: 700 })}>{mtNum(b.total != null ? b.total : b.amount, 2)}</td>
                    <td style={Object.assign({}, td, { whiteSpace: "nowrap" })}>{b.by || "—"} <span style={{ color: "var(--text-3)", fontSize: 11 }}>{mtWhen(b.at)}{nh ? " · ออกทับ " + nh + " ครั้ง" : ""}</span></td>
                    {isAdmin && <td style={td}><button className="btn btn-sm" title="ลบบิลนี้" onClick={(e) => { e.stopPropagation(); delBill(k, b); }} style={{ color: "var(--tint-red-tx)" }}><Icon name="trash" size={13} /></button></td>}
                  </tr>
                ); })}</tbody>
            </table>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

/* ---------- ทะเบียนไซต์: ข้อมูลลูกค้า/สถานที่ที่ขึ้นบนบิล (แอดมิน หรือพาร์ทเนอร์เจ้าของไซต์) ---------- */
const MT_INFO_FIELDS = [
  ["cust", "ชื่อลูกค้า (ผู้ใช้ไฟ)", "เช่น บริษัท ไทยสตีล จำกัด", 2], ["tax", "เลขประจำตัวผู้เสียภาษีลูกค้า", "13 หลัก", 1], ["branch", "สาขา", "สำนักงานใหญ่ / 00001", 1],
  ["addr", "ที่อยู่ลูกค้า (ขึ้นบนบิล)", "", 2, true], ["place", "สถานที่ติดตั้ง", "เช่น หลังคาโรงงาน 2 นิคมอมตะซิตี้", 2],
  ["contact", "ผู้ติดต่อ", "", 1], ["phone", "โทร", "", 1], ["ca", "เลขที่ผู้ใช้ไฟ (การไฟฟ้า)", "", 1], ["meter_no", "เลขมิเตอร์ (S/N)", "", 1],
  ["kwp", "ขนาดระบบ (kWp)", "", 1], ["cod", "วันเริ่มจ่ายไฟ", "", 1, false, "date"], ["note", "หมายเหตุ", "", 2, true],
];
function MtSiteInfo({ s, canEdit }) {
  const [f, setF] = React.useState(() => { const c = mtCustOf(s); const o = {}; MT_INFO_FIELDS.forEach(([k]) => { o[k] = c[k] == null ? "" : String(c[k]); }); return o; });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const save = async () => {
    setBusy(true); setErr(""); setMsg("");
    try { await mtCall({ action: "site-info", n: s.n, info: f }); setMsg("บันทึกแล้ว"); } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const fld = Object.assign({}, mtField, { background: "var(--surface2)", boxShadow: "var(--shadow-inset)" });
  return (
    <div style={mtCard}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>ทะเบียนไซต์</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>ข้อมูลลูกค้าและสถานที่ที่ขึ้นบนบิล · {mtIdent(s)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        {MT_INFO_FIELDS.map(([k, label, ph, span, multi, type]) => (
          <div key={k} style={{ gridColumn: span === 2 ? "1 / -1" : undefined }}>
            <div style={mtLbl}>{label}</div>
            {multi ? <textarea rows={2} disabled={!canEdit} value={f[k]} placeholder={ph} onChange={(e) => setF(Object.assign({}, f, { [k]: e.target.value }))} style={Object.assign({}, fld, { resize: "vertical" })} />
              : <input type={type || "text"} disabled={!canEdit} value={f[k]} placeholder={ph} onChange={(e) => setF(Object.assign({}, f, { [k]: k === "kwp" ? e.target.value.replace(/[^\d.]/g, "") : e.target.value }))} style={fld} />}
          </div>
        ))}
      </div>
      {s.info && s.info.by && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>แก้ล่าสุดโดย {s.info.by} · {mtWhen(s.info.at)}</div>}
      {err && <div style={mtErrBox}>{err}</div>}
      {canEdit && (
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
          {msg && <span style={{ fontSize: 12.5, color: "var(--tint-ok-tx)", fontWeight: 700 }}>{msg}</span>}
          <button className="btn btn-pri" disabled={busy} onClick={save}>{busy ? "กำลังบันทึก…" : "บันทึกทะเบียนไซต์"}</button>
        </div>
      )}
    </div>
  );
}

/* ---------- หน้า MikroTik Monitoring: ตารางทุกไซต์ → กดแถว = รายละเอียดไซต์ (มิเตอร์ / บิล / ข้อมูลไซต์) ----------
   partner = บัญชีพาร์ทเนอร์ (mtPartners/{uid}) → เห็นแค่ไซต์ของตัวเอง อ่านทีละไซต์ (กฎไม่ให้อ่านทั้งโหนด) · ไม่มีเครื่องมือแอดมิน */
function MtMonView({ role, currentUser, partner }) {
  const isAdmin = !partner && (window.hasRole ? window.hasRole(role, "admin") : false);
  const all = partner ? null : useMtSites();
  const allStatus = partner ? null : (window.useMtStatus ? window.useMtStatus() : null);
  const mine = partner ? window.useMtPartnerData(partner) : null;
  const { list, loading } = partner ? mine : all;
  const status = partner ? mine.status : allStatus;
  const now = useMtNowMon();
  const [pick, setPick] = React.useState(null);
  const [admin, setAdmin] = React.useState(false);
  const sites = list.filter((s) => s.meter_model !== "none" || (status && status[s.n]));
  const sel = pick == null ? null : sites.find((s) => s.n === pick);
  const canEdit = (s) => isAdmin || !!(partner && s.owner === partner.id);
  if (sel) return <MtMonDetail key={sel.n} s={sel} st={status && status[sel.n]} isAdmin={isAdmin} canEdit={canEdit(sel)} onBack={() => setPick(null)} />;
  if (admin && window.MtPartnerAdmin) return <window.MtPartnerAdmin sites={list} onBack={() => setAdmin(false)} />;
  const online = list.filter((s) => window.mtState && window.mtState(s, status && status[s.n], now).tone === "green").length;
  const kwNow = list.reduce((t, s) => { const v = status && status[s.n] && status[s.n].meter && status[s.n].meter.v; return t + (v && v.kw > 0 ? v.kw : 0); }, 0);
  const ag = status && status._agent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <MtStat label="ไซต์ออนไลน์" value={online + "/" + list.length} unit="ไซต์" />
        <MtStat label="กำลังไฟรวมตอนนี้" value={mtNum(kwNow, 1)} unit="kW" sub="รวมทุกมิเตอร์" />
        {!partner && <MtStat label="agent บน VPS" value={ag ? (now - Date.parse(ag.at || ag.seen) < 5 * 60e3 ? "ปกติ" : "เงียบ") : "—"} unit=""
          sub={ag ? "ติดต่อล่าสุด " + new Date(ag.at || ag.seen).toLocaleTimeString("th-TH") : "ยังไม่ได้ติดตั้ง"} />}
      </div>
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-soft" onClick={() => setAdmin(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="user" size={14} />บัญชีพาร์ทเนอร์ / มอบไซต์</button>
        </div>
      )}
      {loading ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>กำลังโหลด…</div>
        : !sites.length ? <div style={mtCard}><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{partner ? "ยังไม่มีไซต์ที่มอบให้บัญชีนี้ — ติดต่อแอดมิน" : "ยังไม่มีไซต์ — เพิ่มที่ ตั้งค่า → ไซต์ MikroTik"}</div></div>
        : (
          <MtMonTable sites={sites} status={status} now={now} onOpen={setPick} />
        )}
    </div>
  );
}
function useMtNowMon() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30e3); return () => clearInterval(t); }, []);
  return now;
}

window.MtMonView = MtMonView;
window.mtBillAuto = mtBillAuto;
window.MtSiteInfo = MtSiteInfo;
