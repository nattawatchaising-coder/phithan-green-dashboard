/* ============================================================
   ไซต์ MikroTik เฟส 3 — หน้า "MikroTik Monitoring" (ค่ามิเตอร์สด + กราฟ) และ "บิลค่าไฟโซลาร์" รายเดือน
   docs/mikrotik.md · ใช้ของจาก mikrotik.jsx (useMtSites mtCall mtIdent mtField mtErrBox) + mikrotik-status.jsx (useMtStatus mtState MtPill)
   + กราฟ window.FsTrendChart (fusionsolar-charts.jsx)

   ข้อมูล (agent บน VPS → /api/mikrotik/site?agent=1)
     mtStatus/{N}/meter/v          ค่าสดทุก 1 นาที
     mtMeter/{N}/h/{YYYYMMDD}/{HHMM} ราย 5 นาที (เวลาไทย · ข้อมูลแรก ๆ เป็นราย 15 นาที)
     mtMeter/{N}/d/{YYYYMMDD}      first/last ของวัน + kw_max
     mtBills/{N}/{YYYYMM}          บิลที่บันทึกแล้ว (เขียนผ่าน API bill-save เท่านั้น)
   หน้าเว็บเขียนเองแค่ร่างใบแจ้งหนี้ invoices/<id> (ระบบใบแจ้งหนี้เดิม invoice.jsx)
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
const mtDayKwh = (d, reg) => (d && d.first && d.last && d.first[reg] != null && d.last[reg] != null ? Math.max(0, d.last[reg] - d.first[reg]) : null);

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

/* ---------- การ์ดไซต์ในหน้า Monitoring ---------- */
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
      {s.bill && s.bill.cust && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: -4 }}>{s.bill.cust}</div>}
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

/* ---------- รายละเอียดไซต์: กราฟวัน/เดือน + ค่าสด + ตั้งค่ามิเตอร์ ---------- */
function MtMonDetail({ s, st, isAdmin }) {
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
        <MtSpec label="kWh Export" value={mtNum(v.kwh_exp, 1)} mono />
        <MtSpec label="kWh Net" value={mtNum(v.kwh_net, 1)} mono />
      </div>
      {isAdmin && <MtMeterCfg s={s} />}
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
      <span style={{ fontSize: 12, color: "var(--text-3)" }}>unit id</span>
      <input value={unit} onChange={(e) => setUnit(e.target.value.replace(/\D/g, ""))} style={Object.assign({}, fld, { width: 60, textAlign: "right" })} />
      <button className="btn btn-sm" disabled={!dirty} onClick={save}>บันทึก</button>
      {msg && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{msg}</span>}
    </div>
  );
}

/* ---------- หน้า MikroTik Monitoring ---------- */
/* หน้าเดียว: แท็บ "มิเตอร์" กับ "บิลรายเดือน" (ผู้ใช้ 2026-11-11 "ให้อยู่หน้านี้หน้าเดียวเลย" — เดิมบิลแยกไปเมนูเอกสารงวดงาน) */
function MtMonView({ role, currentUser }) {
  const [tab, setTab] = React.useState(() => { try { return localStorage.getItem("mtmon.tab") || "mon"; } catch (e) { return "mon"; } });
  const pickTab = (t) => { setTab(t); try { localStorage.setItem("mtmon.tab", t); } catch (e) { /* ไม่มีที่เก็บ */ } };
  const opts = [{ value: "mon", label: "มิเตอร์ · สถานะ" }, { value: "bill", label: "บิลรายเดือน" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>{window.Segmented ? <window.Segmented value={tab} onChange={pickTab} options={opts} />
        : opts.map((o) => <button key={o.value} className={tab === o.value ? "btn btn-pri" : "btn"} onClick={() => pickTab(o.value)} style={{ marginRight: 6 }}>{o.label}</button>)}</div>
      {tab === "bill" ? <MtBillView role={role} currentUser={currentUser} /> : <MtMonPanel role={role} />}
    </div>
  );
}
function MtMonPanel({ role }) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const { list, loading } = useMtSites();
  const status = window.useMtStatus ? window.useMtStatus() : null;
  const now = useMtNowMon();
  const [pick, setPick] = React.useState(null);
  const sites = list.filter((s) => s.meter_model !== "none" || (status && status[s.n]));
  const sel = sites.find((s) => s.n === pick) || sites[0];
  const online = list.filter((s) => window.mtState && window.mtState(s, status && status[s.n], now).tone === "green").length;
  const kwNow = list.reduce((t, s) => { const v = status && status[s.n] && status[s.n].meter && status[s.n].meter.v; return t + (v && v.kw > 0 ? v.kw : 0); }, 0);
  const ag = status && status._agent;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <MtStat label="ไซต์ออนไลน์" value={online + "/" + list.length} unit="ไซต์" />
        <MtStat label="กำลังไฟรวมตอนนี้" value={mtNum(kwNow, 1)} unit="kW" sub="รวมทุกมิเตอร์" />
        <MtStat label="agent บน VPS" value={ag ? (now - Date.parse(ag.at || ag.seen) < 5 * 60e3 ? "ปกติ" : "เงียบ") : "—"} unit=""
          sub={ag ? "ติดต่อล่าสุด " + new Date(ag.at || ag.seen).toLocaleTimeString("th-TH") : "ยังไม่ได้ติดตั้ง"} />
      </div>
      {loading ? <div style={{ padding: 18, color: "var(--text-3)", fontSize: 12.5 }}>กำลังโหลด…</div>
        : !sites.length ? <div style={mtCard}><div style={{ fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีไซต์ — เพิ่มที่ ตั้งค่า → ไซต์ MikroTik</div></div>
        : (
          <React.Fragment>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {sites.map((s) => <MtMonCard key={s.n} s={s} st={status && status[s.n]} now={now} picked={sel && sel.n === s.n} onPick={() => setPick(s.n)} />)}
            </div>
            {sel && <MtMonDetail key={sel.n} s={sel} st={status && status[sel.n]} isAdmin={isAdmin} />}
          </React.Fragment>
        )}
    </div>
  );
}
function useMtNowMon() {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30e3); return () => clearInterval(t); }, []);
  return now;
}

/* =================================================================
   บิลค่าไฟโซลาร์รายเดือน
   เลขเริ่ม = ค่าแรกของวันที่ 1 ของเดือน · เลขสิ้นสุด = ค่าแรกของวันที่ 1 เดือนถัดไป (ยังไม่ถึง = ค่าล่าสุด)
   ข้อมูลขาด/มิเตอร์เปลี่ยน → พิมพ์เลขเองได้ (เก็บที่มาไว้ในบิล) · เงิน = kWh × บาท/kWh (VAT คิดตอนออกใบแจ้งหนี้)
   ================================================================= */
function mtMonthKeys(ym) {   // "2026-11" → { pre: "202611", next: "202612" }
  const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7));
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
  return { pre: ym.replace("-", ""), next: ny + String(nm).padStart(2, "0") };
}
function mtBillAuto(days, ym, reg) {
  const { pre, next } = mtMonthKeys(ym);
  const keys = Object.keys(days || {}).sort();
  const inMon = keys.filter((k) => k.slice(0, 6) === pre && days[k] && days[k].first && days[k].first[reg] != null);
  const out = { start: null, end: null, start_src: "", end_src: "", warn: [] };
  if (!inMon.length) { out.warn.push("ไม่มีข้อมูลมิเตอร์ในเดือนนี้"); return out; }
  const k0 = inMon[0], f0 = days[k0].first;
  out.start = f0[reg]; out.start_src = mtDayLabel(k0) + " " + f0.t.slice(0, 2) + ":" + f0.t.slice(2);
  if (!k0.endsWith("01") || f0.t !== "0000") out.warn.push("ข้อมูลเริ่ม " + out.start_src + " (ไม่ใช่ต้นเดือนพอดี)");
  const k1 = next + "01";
  if (days[k1] && days[k1].first && days[k1].first[reg] != null) {
    out.end = days[k1].first[reg]; out.end_src = mtDayLabel(k1) + " " + days[k1].first.t.slice(0, 2) + ":" + days[k1].first.t.slice(2);
  } else {
    const kl = inMon[inMon.length - 1], l = days[kl].last || days[kl].first;
    out.end = l[reg]; out.end_src = mtDayLabel(kl) + " " + l.t.slice(0, 2) + ":" + l.t.slice(2) + " (ล่าสุด)";
    out.warn.push("ยังไม่จบเดือน/ยังไม่มีค่าวันที่ 1 เดือนถัดไป — เลขสิ้นสุดเป็นค่าล่าสุด");
  }
  return out;
}

function MtBillRow({ s, ym, isAdmin, onCfg, user }) {
  const days = useMtRef("mtMeter/" + s.n + "/d");
  const saved = useMtRef("mtBills/" + s.n + "/" + ym.replace("-", ""));
  const reg = mtRegOf(s);
  const auto = React.useMemo(() => mtBillAuto(days, ym, reg), [days, ym, reg]);
  const [ov, setOv] = React.useState({});   // ค่าที่พิมพ์เอง { start, end, rate }
  React.useEffect(() => setOv({}), [ym]);
  const [busy, setBusy] = React.useState("");
  const [err, setErr] = React.useState("");
  const val = (k, def) => (ov[k] != null ? ov[k] : def);
  const start = Number(val("start", saved ? saved.start : auto.start));
  const end = Number(val("end", saved ? saved.end : auto.end));
  const rate = Number(val("rate", saved ? saved.rate : s.bill ? s.bill.rate : ""));
  const ok = isFinite(start) && isFinite(end) && end >= start && rate >= 0 && val("start", saved ? saved.start : auto.start) != null;
  const kwh = ok ? Math.round((end - start) * 1000) / 1000 : null;
  const amount = ok && isFinite(rate) ? Math.round(kwh * rate * 100) / 100 : null;
  const payload = (extra) => Object.assign({ action: "bill-save", n: s.n, month: ym, start, end, rate, reg,
    start_src: ov.start != null ? "พิมพ์เอง" : saved ? saved.start_src : auto.start_src,
    end_src: ov.end != null ? "พิมพ์เอง" : saved ? saved.end_src : auto.end_src,
    cust: (s.bill && s.bill.cust) || "", invoice_id: saved ? saved.invoice_id : "" }, extra || {});
  const save = async () => {
    setBusy("save"); setErr("");
    try { await mtCall(payload()); setOv({}); } catch (e) { setErr(String(e.message || e)); }
    setBusy("");
  };
  const invoice = async () => {
    const ok2 = await window.askConfirm({ title: "สร้างร่างใบแจ้งหนี้ " + mtIdent(s) + "?",
      body: "ค่าไฟโซลาร์ " + MT_TH_MON_FULL[Number(ym.slice(5)) - 1] + " " + (Number(ym.slice(0, 4)) + 543) + "\n" + mtNum(kwh, 2) + " kWh × " + rate + " บาท = " + mtNum(amount, 2) + " บาท (ก่อน VAT)\nร่างไปอยู่ที่ เอกสารงวดงาน → ใบแจ้งหนี้ ตรวจลูกค้า/ที่อยู่แล้วกดออกใบที่นั่น",
      ok: "สร้างร่าง", icon: "file" });
    if (!ok2) return;
    setBusy("inv"); setErr("");
    try {
      if (!window.ivBlank || !window.FBDB) throw new Error("ระบบใบแจ้งหนี้ยังไม่โหลด");
      const root = window.DR_ROOT || "";
      const cfg = (await window.FBDB.ref(root + "invoiceCfg").once("value")).val() || {};
      const issuers = window.ivIssuers ? window.ivIssuers(cfg) : [];
      const iss = issuers[0] || (window.ivCompanyIssuer && window.ivCompanyIssuer());
      const inv = window.ivBlank(iss, user);
      const monTxt = MT_TH_MON_FULL[Number(ym.slice(5)) - 1] + " " + (Number(ym.slice(0, 4)) + 543);
      inv.cust = Object.assign({}, inv.cust, { name: (s.bill && s.bill.cust) || mtIdent(s) });
      inv.ref = mtIdent(s) + " " + ym;
      inv.items = [Object.assign(inv.items[0], { t: "ค่าไฟฟ้าจากระบบโซลาร์ เดือน" + monTxt,
        d: "มิเตอร์ " + MT_REG_TH[reg] + " เลขเริ่ม " + mtNum(start, 2) + " – เลขสิ้นสุด " + mtNum(end, 2), qty: kwh, unit: "kWh", price: rate })];
      inv.note = "ไซต์ " + mtIdent(s);
      await window.FBDB.ref(root + "invoices/" + inv.id).set(inv);
      await mtCall(payload({ invoice_id: inv.id }));
      setOv({});
    } catch (e) { setErr(String(e.message || e)); }
    setBusy("");
  };
  const cell = { padding: "9px 8px", fontSize: 12.5, verticalAlign: "top" };
  const inp = (k, v, w) => (
    <input value={ov[k] != null ? ov[k] : v == null ? "" : String(v)} disabled={!isAdmin} onChange={(e) => setOv(Object.assign({}, ov, { [k]: e.target.value.replace(/[^\d.]/g, "") }))}
      style={Object.assign({}, mtField, { width: w || 110, padding: "6px 8px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 12.5, background: "var(--surface2)", boxShadow: "var(--shadow-inset)" })} />
  );
  return (
    <tr>
      <td style={cell}>
        <div style={{ fontFamily: "var(--mono)", fontWeight: 700 }}>{mtIdent(s)}</div>
        <div style={{ fontSize: 11.5, color: "var(--text-2)" }}>{(s.bill && s.bill.cust) || <span style={{ color: "var(--tint-amber-tx)" }}>ยังไม่ตั้งชื่อลูกค้า</span>}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{MT_REG_TH[reg]}</div>
        {isAdmin && <button className="btn btn-sm btn-soft" style={{ marginTop: 4 }} onClick={() => onCfg(s)}>ตั้งค่าบิล</button>}
      </td>
      <td style={cell}>{inp("start", saved ? saved.start : auto.start)}<div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>{ov.start != null ? "พิมพ์เอง" : saved ? saved.start_src : auto.start_src}</div></td>
      <td style={cell}>{inp("end", saved ? saved.end : auto.end)}<div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 3 }}>{ov.end != null ? "พิมพ์เอง" : saved ? saved.end_src : auto.end_src}</div></td>
      <td style={Object.assign({}, cell, { fontFamily: "var(--mono)", fontWeight: 700, textAlign: "right" })}>{mtNum(kwh, 2)}</td>
      <td style={cell}>{inp("rate", saved ? saved.rate : s.bill ? s.bill.rate : null, 70)}</td>
      <td style={Object.assign({}, cell, { fontFamily: "var(--mono)", fontWeight: 800, textAlign: "right", fontSize: 14 })}>{mtNum(amount, 2)}</td>
      <td style={Object.assign({}, cell, { minWidth: 190 })}>
        {saved && <div style={{ fontSize: 11, color: "var(--tint-ok-tx)", fontWeight: 700 }}>บันทึกแล้ว · {saved.by} {new Date(saved.at).toLocaleDateString("th-TH")}</div>}
        {saved && saved.invoice_id && <div style={{ fontSize: 11, color: "var(--text-3)" }}>มีร่าง/ใบแจ้งหนี้แล้ว (เอกสารงวดงาน → ใบแจ้งหนี้)</div>}
        {!saved && auto.warn.map((w, i) => <div key={i} style={{ fontSize: 11, color: "var(--tint-amber-tx)" }}>{w}</div>)}
        {isAdmin && (
          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            <button className="btn btn-sm" disabled={!ok || !!busy} onClick={save}>{busy === "save" ? "กำลังบันทึก…" : saved ? "บันทึกทับ" : "บันทึกบิล"}</button>
            {!(saved && saved.invoice_id) && <button className="btn btn-sm btn-pri" disabled={!ok || !(rate > 0) || !!busy} onClick={invoice}>{busy === "inv" ? "กำลังสร้าง…" : "สร้างร่างใบแจ้งหนี้"}</button>}
          </div>
        )}
        {err && <div style={Object.assign({}, mtErrBox, { marginTop: 5, fontSize: 11.5 })}>{err}</div>}
      </td>
    </tr>
  );
}

function MtBillCfg({ s, onClose }) {
  const b = s.bill || {};
  const [cust, setCust] = React.useState(b.cust || "");
  const [rate, setRate] = React.useState(b.rate == null ? "" : String(b.rate));
  const [reg, setReg] = React.useState(b.reg || "kwh_imp");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    setBusy(true); setErr("");
    try { await mtCall({ action: "bill-cfg", n: s.n, cust, rate: Number(rate), reg }); onClose(); } catch (e) { setErr(String(e.message || e)); }
    setBusy(false);
  };
  const fld = Object.assign({}, mtField, { background: "var(--surface2)", boxShadow: "var(--shadow-inset)" });
  return (
    <div style={mtCard}>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>ตั้งค่าบิล {mtIdent(s)}</div>
      <div><div style={mtLbl}>ชื่อลูกค้า (ใช้ในใบแจ้งหนี้)</div><input value={cust} onChange={(e) => setCust(e.target.value)} style={fld} placeholder="เช่น บริษัท ไทยสตีล จำกัด" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
        <div><div style={mtLbl}>ราคา (บาท/kWh)</div><input value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} style={Object.assign({}, fld, { textAlign: "right", fontFamily: "var(--mono)" })} /></div>
        <div><div style={mtLbl}>คิดเงินจากช่องไหนของมิเตอร์</div>
          <select value={reg} onChange={(e) => setReg(e.target.value)} style={fld}>{Object.keys(MT_REG_TH).map((k) => <option key={k} value={k}>{MT_REG_TH[k]}</option>)}</select></div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>มิเตอร์ที่วัดไฟโซลาร์จ่ายเข้าโรงงาน ปกติใช้ Import · ถ้าค่าเดินถอยหลังหรือเป็น 0 ทั้งที่ผลิตอยู่ ให้ลอง Export (ขึ้นกับทิศการต่อ CT)</div>
      {err && <div style={mtErrBox}>{err}</div>}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose} disabled={busy}>ยกเลิก</button>
        <button className="btn btn-pri" onClick={save} disabled={busy || rate === ""}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
      </div>
    </div>
  );
}

function MtBillView({ role, currentUser }) {
  const isAdmin = window.hasRole ? window.hasRole(role, "admin") : false;
  const { list, loading } = useMtSites();
  const prev = (() => { const d = new Date(Date.now() + 7 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - 1); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); })();
  const [ym, setYm] = React.useState(prev);
  const [cfg, setCfg] = React.useState(null);
  const sites = list.filter((s) => s.meter_model !== "none");
  const th = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textAlign: "left", padding: "6px 8px", whiteSpace: "nowrap" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={mtCard}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>บิลค่าไฟโซลาร์รายเดือน</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>เลขมิเตอร์ต้นเดือน → ต้นเดือนถัดไป × ราคาต่อหน่วย · ราคายังไม่รวม VAT</div>
          <div style={{ flex: 1 }} />
          <input type="month" value={ym} onChange={(e) => e.target.value && setYm(e.target.value)}
            style={Object.assign({}, mtField, { width: "auto", padding: "6px 10px", background: "var(--surface2)", boxShadow: "var(--shadow-inset)" })} />
        </div>
        {!isAdmin && <div style={{ fontSize: 12, color: "var(--text-3)" }}>บันทึกบิล/ออกใบแจ้งหนี้ได้เฉพาะแอดมิน</div>}
      </div>
      {cfg && <MtBillCfg s={cfg} onClose={() => setCfg(null)} />}
      <div style={mtCard}>
        {loading ? <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>กำลังโหลด…</div>
          : !sites.length ? <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีไซต์ที่มีมิเตอร์</div>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>ไซต์ / ลูกค้า</th><th style={th}>เลขเริ่ม</th><th style={th}>เลขสิ้นสุด</th><th style={Object.assign({}, th, { textAlign: "right" })}>kWh</th>
                  <th style={th}>บาท/kWh</th><th style={Object.assign({}, th, { textAlign: "right" })}>ยอดเงิน (บาท)</th><th style={th}>สถานะ</th></tr></thead>
                <tbody>{sites.map((s) => <MtBillRow key={s.n + ym} s={s} ym={ym} isAdmin={isAdmin} onCfg={(x) => setCfg(x)} user={currentUser} />)}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

window.MtMonView = MtMonView;
window.MtBillView = MtBillView;
window.mtBillAuto = mtBillAuto;
