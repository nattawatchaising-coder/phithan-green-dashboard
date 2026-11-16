/* ==================================================================
   ตารางสาย DC ต่อสตริง (เฟส 2 · prefix Cc) — การ์ดในหน้าออกแบบระบบ ขั้น "การต่อสตริง"
   ดู docs/cable-calc.md · สูตรอยู่ใน cablecalc.jsx (window.CC) ไฟล์นี้มีแต่หน้าจอ + ที่เก็บ

   ข้อมูล  cableCalc/{jobId}/{เวอร์ชันแบบ} = {
             dc: { <สตริง>: { len?: ม. ที่แก้เอง, ovr?: mm² ที่บังคับ } },  ca, cg,   ← เฉพาะที่คนแก้
             sum: { strings, perPole ม., maxPct, sizes: { mm²: จำนวนสตริง }, at },  ← สรุปให้ BOQ อ่าน (เขียนเมื่อเปลี่ยน)
             updatedAt }
   ระยะที่ไม่ได้แก้ = ประมาณสดจากแบบ 3D ทุกครั้ง (CC.dcRoutes) — ย้ายแผง/จุดอินเวอร์เตอร์แล้วตัวเลขตามเอง
   ================================================================== */

function useCcStore(jobId, ver) {
  const key = jobId ? "cableCalc/" + jobId + "/" + String(ver || "1") : null;
  const [data, setData] = React.useState(undefined);
  React.useEffect(() => {
    if (!key || !window.FBDB) { setData(null); return; }
    const ref = window.FBDB.ref(key);
    const h = ref.on("value", (s) => setData(s.val() || null), () => setData(null));
    return () => ref.off("value", h);
  }, [key]);
  const patch = React.useCallback((p) => (key && window.FBDB ? window.FBDB.ref(key).update(Object.assign({ updatedAt: new Date().toISOString() }, p)) : Promise.resolve()), [key]);
  return { data, key, patch };
}

/* เทียบเนื้อหาแบบเรียงคีย์ (Firebase คืนคีย์เรียงใหม่ · ค่า null ถูกตัดทิ้ง) */
const ccCanon = (x) => (Array.isArray(x) ? "[" + x.map(ccCanon).join(",") + "]" : x && typeof x === "object"
  ? "{" + Object.keys(x).sort().filter((k) => x[k] != null && !(typeof x[k] === "number" && isNaN(x[k]))).map((k) => k + ":" + ccCanon(x[k])).join(",") + "}" : JSON.stringify(x));
/* ผลล่าสุดของการ์ด DC/AC ต่องาน+เวอร์ชัน — ปุ่มรายงานอ่านจากตรงนี้ (ไม่ต้องคำนวณซ้ำ ได้ตัวเลขเดียวกับจอ) */
const CC_LIVE = {};
const ccLiveOf = (job, ver) => { const k = ((job && job.id) || "") + "/" + String(ver || "1"); return (CC_LIVE[k] = CC_LIVE[k] || {}); };
const ccBif = (P) => !!P && (P.bifacial === true || (P.bifacial == null && /bifacial|BDV|BDB|HBD|DEG\d|JAM\d+D\d/i.test(String(P.model || ""))));

/* props: job, ver, st (แบบ 3D), strings (plan.strings), paths (wirePaths), foot (p3FootAll), panel (สเปคแผง), colorOf */
/* opt = ตัวคุมแผง (optimizer) ของงาน { model, per, vOutMax, iOutMax, vOff, mpptMax } · null = สตริงธรรมดา */
function CcDcCard({ job, ver, st, strings, paths, foot, panel, colorOf, invs, opt }) {
  const CC = window.CC, B = window.BOQ || {}, R = B.RULES || {};
  const store = useCcStore(job && job.id, ver);
  const D = store.data || {};
  const dcEdit = D.dc || {};
  const [draft, setDraft] = React.useState({});   // ช่องที่กำลังพิมพ์ (ยังไม่ออกจากช่อง)

  /* จุดอินเวอร์เตอร์ในแบบ 3D + ความสูงแผงต่อใบ */
  const stations = React.useMemo(() => ((st && st.obstacles) || []).filter((o) => o && o.p3sType === "invst")
    .map((o) => ({ id: o.id, x: +o.x || 0, z: +o.z || 0, y: +o.y || 0 })), [st]);
  const yOf = React.useMemo(() => { const m = {}; ((foot && foot.panels) || []).forEach((q) => { m[q.uid] = +q.cy || 0; }); return m; }, [foot]);
  const jump = React.useMemo(() => {
    let L = 0; const q = ((foot && foot.panels) || [])[0];
    if (q) for (let i = 0; i < q.pts.length; i++) { const a = q.pts[i], b = q.pts[(i + 1) % q.pts.length]; L = Math.max(L, Math.hypot(b[0] - a[0], b[1] - a[1])); }
    return (L || 2.4) * 1.25;   // เกณฑ์เดียวกับเส้นเดินสายในผัง (suRouteFix)
  }, [foot]);
  const spare = +R.pvSpare > 0 ? +R.pvSpare : 1.2;
  const est = React.useMemo(() => (CC ? CC.dcRoutes((paths || []).map((p) => ({ id: p.id, pts: p.pts, ys: (p.uids || []).map((u) => yOf[u] || 0) })), stations, { jump, spare }) : {}),
    [paths, stations, yOf, jump, spare]);

  const vdLim = +R.vdDc > 0 ? +R.vdDc : 3, minSize = +R.pvWireMin > 0 ? +R.pvWireMin : 4;
  const kDC = (+R.pvWireK || 1.25) * (ccBif(panel) ? (+R.bifacialK || 1.1) : 1);
  const Ca = +D.ca > 0 ? +D.ca : 1, Cg = +D.cg > 0 ? +D.cg : 1;
  const mod = { vmp: +panel.vmp || 0, imp: +panel.imp || 0, isc: +panel.isc || 0 };
  const optC = opt ? { per: +opt.per || 1, vOutMax: +opt.vOutMax || 0, iOutMax: +opt.iOutMax || 0, mpptMax: +opt.mpptMax || 0 } : null;
  const optKey = optC ? [optC.per, optC.vOutMax, optC.iOutMax, optC.mpptMax].join() : "";

  const rows = React.useMemo(() => (strings || []).map((s) => {
    const e = est[s.id], ed = dcEdit[s.id] || {};
    const len = +ed.len > 0 ? +ed.len : e ? e.len : NaN;
    const r = CC ? CC.dcString({ n: s.n, len, ovr: ed.ovr }, mod, { kDC, ca: Ca, cg: Cg, vdLim, minSize, tempK: +R.pvWireTempK || 1, opt: optC }) : {};
    return Object.assign(r, { id: s.id, addr: s.addr, est: e ? e.len : null, edited: +ed.len > 0, ovr: ed.ovr || "" });
  }), [strings, est, D.dc, mod.vmp, mod.imp, mod.isc, kDC, Ca, Cg, vdLim, minSize, optKey]); // eslint-disable-line

  const ok = rows.filter((r) => r.valid);
  const maxPct = ok.length ? Math.max.apply(null, ok.map((r) => r.pct || 0)) : 0;
  const bad = ok.filter((r) => !r.ok).length;
  const perPole = Math.round(ok.reduce((t, r) => t + r.len, 0));
  const sizes = {}, bySid = {};
  ok.forEach((r) => { if (isFinite(r.use)) { sizes["mm" + r.use] = (sizes["mm" + r.use] || 0) + 1; bySid["s" + r.id] = r.use; } });
  const missing = rows.length - ok.length;

  /* สรุปให้ BOQ — เขียนเมื่อเปลี่ยนจริง หน่วง 1.5 วิ (ระหว่างลากจัดสตริงจะได้ไม่ยิงถี่ · แบบเดียวกับ plan3dSldDesign) */
  const sumObj = { strings: ok.length, perPole, maxPct, sizes, bySid }, sumJs = ccCanon(sumObj);
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const cur = D.sum ? ccCanon({ strings: D.sum.strings, perPole: D.sum.perPole, maxPct: D.sum.maxPct, sizes: D.sum.sizes, bySid: D.sum.bySid }) : "";
    if (cur === sumJs) return;
    const t = setTimeout(() => store.patch({ sum: Object.assign({}, sumObj, { at: new Date().toISOString() }) }), 1500);
    return () => clearTimeout(t);
  }, [sumJs, store.data === undefined]); // eslint-disable-line

  const setRow = (id, k, v) => {
    const cur = Object.assign({}, dcEdit[id] || {});
    if (v === "" || v == null) delete cur[k]; else cur[k] = v;
    store.patch({ ["dc/" + id]: Object.keys(cur).length ? cur : null });
  };
  const commitLen = (id) => {
    const v = draft[id];
    setDraft((d) => { const n = Object.assign({}, d); delete n[id]; return n; });
    if (v == null) return;
    const x = Math.round(+v * 10) / 10;
    const e = est[id];
    setRow(id, "len", x > 0 && !(e && x === e.len) ? x : "");   // ใส่เท่าค่าประมาณ = ไม่ต้องจำ
  };
  const resetAll = () => window.askConfirm({ title: "คืนระยะสายที่แก้เองทั้งหมด?", body: "ทุกสตริงกลับไปใช้ระยะที่ระบบประมาณจากแบบ 3D และขนาดสายอัตโนมัติ", ok: "คืนค่า", danger: true })
    .then((y) => { if (y) store.patch({ dc: null }); });

  /* ให้ปุ่มรายงานคำนวณหยิบผลชุดเดียวกับที่โชว์ */
  ccLiveOf(job, ver).dc = { rows, kDC, Ca, Cg, vdLim, minSize, spare, mod, panel, invs: invs || [], tMin: +R.tMin || 15, bif: ccBif(panel), stations: stations.length, opt: opt || null };
  if (!CC || !strings || !strings.length) return null;
  const nEdited = Object.keys(dcEdit).length;
  const pct = (v) => (isFinite(v) ? v.toFixed(2) + "%" : "—");
  const inp = { padding: "5px 7px", fontSize: 11.5, width: 66, textAlign: "right", fontFamily: "inherit" };
  return (
    <div className="p3-card">
      <span className="p3-eb"><P3Icon name="bolt" size={13} />สาย DC ต่อสตริง · แรงดันตก<span className="ln" />
        <span style={{ fontWeight: 600, color: bad ? "var(--tint-red-tx)" : undefined }}>
          {ok.length ? "สูงสุด " + pct(maxPct) + " · เกณฑ์ ≤ " + vdLim + "%" + (bad ? " · ไม่ผ่าน " + bad + " สตริง" : " · ผ่านทุกสตริง") : "ยังไม่มีระยะสาย"}
        </span></span>

      {!stations.length && (
        <div className="su-alert info"><P3Icon name="bulb" size={14} />
          <span>ยังไม่มี <b>จุดอินเวอร์เตอร์</b> ในแบบ 3D — วางที่ขั้น "สิ่งบดบัง" (อุปกรณ์ไฟฟ้า › จุดอินเวอร์เตอร์) ระบบจะประมาณระยะสายให้ทุกสตริง หรือกรอกระยะเองในตาราง</span></div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: 11.5, color: "var(--text-2)" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="ตัวคูณอุณหภูมิแวดล้อม (ตาราง 5-43 ฐาน 40°C) · พิกัดสาย PV อ้างอิงอากาศ 60°C อยู่แล้ว โดยทั่วไปใช้ 1">
          Ca <input className="p3-inp" type="number" step="0.01" min="0.3" max="1.3" defaultValue={Ca} key={"ca" + Ca} style={inp}
            onBlur={(e) => { const v = +e.target.value; store.patch({ ca: v > 0 && v !== 1 ? v : null }); }} /></label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }} title="ตัวคูณจัดกลุ่ม — หลายสตริงในท่อ/รางเดียวกันระบายความร้อนแย่ลง (ตาราง 5-40 หรือ datasheet สาย) · เส้นเดียว = 1">
          Cg <input className="p3-inp" type="number" step="0.01" min="0.2" max="1" defaultValue={Cg} key={"cg" + Cg} style={inp}
            onBlur={(e) => { const v = +e.target.value; store.patch({ cg: v > 0 && v !== 1 ? v : null }); }} /></label>
        {optC && optC.iOutMax > 0
          ? <span title="ตัวคุมแผงจำกัดกระแสออก — เลือกพิกัดสายจากกระแสออกสูงสุดของตัวคุม">มีตัวคุมแผง {opt.model || ""} · Id = Iout {optC.iOutMax} × {Math.round(kDC * 1000) / 1000} = <b>{Math.round(optC.iOutMax * kDC * 100) / 100} A</b></span>
          : <span>Id = Isc {mod.isc} × {Math.round(kDC * 1000) / 1000} = <b>{Math.round(mod.isc * kDC * 100) / 100} A</b></span>}
        <span>ขั้นต่ำ {minSize} mm² · เผื่อระยะ ×{spare}</span>
        <span style={{ flex: 1 }} />
        {nEdited > 0 && <button className="p3-lnk" onClick={resetAll}>คืนค่าที่แก้เอง ({nEdited})</button>}
        <CcReportBtn job={job} ver={ver} />
      </div>

      <div className="su-scroll">
        <table className="su-tb">
          <thead><tr><th>สตริง</th><th>INV / MPPT</th><th>แผง</th><th title={optC ? "ตัวคุมแผงกดแรงดันสตริงให้ไม่เกินช่วง MPPT ของอินเวอร์เตอร์ → กระแสสูงขึ้นตาม (ไม่เกิน Iout ของตัวคุม)" : "Vmp × จำนวนแผง · กระแส = Imp"}>{optC ? "V / I ใช้งาน" : "Vmp สตริง"}</th>
            <th title="ความยาวทางเดียว L ในสูตร VD = 2 × Imp × R90 × L">ระยะ L (ม.)</th><th>สาย PV1-F</th>
            <th title="พิกัดสาย × Ca × Cg × ตัวคูณอุณหภูมิ ต้อง ≥ Id">Iz (A)</th><th>VD (V)</th><th>%VD</th><th>ผล</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "var(--r-pill)", background: colorOf ? colorOf(r.id) : "var(--primary)" }} /><b>#{r.id}</b></span></td>
                <td style={{ whiteSpace: "nowrap" }}>{r.addr || "—"}</td>
                <td><b>{r.n}</b></td>
                <td style={{ whiteSpace: "nowrap" }}>{isFinite(r.vStr) ? Math.round(r.vStr) + " V" : "—"}{optC && isFinite(r.iOp) ? " · " + r.iOp + " A" : ""}</td>
                <td>
                  <input className="p3-inp" type="number" step="0.5" min="0" style={Object.assign({}, inp, { fontWeight: r.edited ? 800 : 500, color: r.edited ? "var(--acd)" : undefined })}
                    value={draft[r.id] != null ? draft[r.id] : isFinite(r.len) ? r.len : ""}
                    placeholder={r.est != null ? String(r.est) : "กรอก"}
                    title={r.edited ? "แก้เอง · ระบบประมาณได้ " + (r.est != null ? r.est + " ม." : "—") + " (ลบให้ว่างเพื่อใช้ค่าประมาณ)" : r.est != null ? "ประมาณจากแบบ 3D" : "ยังไม่มีจุดอินเวอร์เตอร์ — กรอกเอง"}
                    onChange={(e) => setDraft((d) => Object.assign({}, d, { [r.id]: e.target.value }))}
                    onBlur={() => commitLen(r.id)} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
                  {r.edited && <span style={{ marginLeft: 4, fontSize: 9.5, fontWeight: 800, color: "var(--acd)" }}>แก้เอง</span>}
                </td>
                <td>
                  <CcDd value={r.ovr} style={{ width: 130 }} onChange={(v) => setRow(r.id, "ovr", v === "" ? "" : +v)}
                    options={[{ value: "", label: isFinite(r.auto) ? "อัตโนมัติ · " + r.auto + " mm²" : "อัตโนมัติ · —" }]
                      .concat(CC.PV.filter((p) => p.s >= 2.5 && p.s <= 16).map((p) => ({ value: String(p.s), label: p.s + " mm²" })))} />
                </td>
                <td style={{ color: r.valid && !r.ampOk ? "var(--tint-red-tx)" : undefined }}>{isFinite(r.iz) ? r.iz : "—"}</td>
                <td>{isFinite(r.vd) ? r.vd : "—"}</td>
                <td><b style={{ color: r.valid && !r.vdOk ? "var(--tint-red-tx)" : undefined }}>{pct(r.pct)}</b></td>
                <td>{!r.valid ? <span style={{ color: "var(--text-3)" }}>รอระยะ</span>
                  : r.ok ? <span style={{ color: "var(--tint-ok-tx)", fontWeight: 800 }}>ผ่าน</span>
                  : <span style={{ color: "var(--tint-red-tx)", fontWeight: 800 }} title={[!r.ampOk && "พิกัดกระแสไม่พอ", !r.vdOk && "แรงดันตกเกินเกณฑ์", !r.minOk && "เล็กกว่าขั้นต่ำ"].filter(Boolean).join(" · ")}>ไม่ผ่าน</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid var(--ln)", paddingTop: 9 }}>
        <span className="p3-stat">สาย PV ต่อขั้ว <b>{perPole.toLocaleString()}</b> ม.</span>
        <span className="p3-stat">แดง + ดำ <b>{(perPole * 2).toLocaleString()}</b> ม.</span>
        {Object.keys(sizes).sort((a, b) => a.slice(2) - b.slice(2)).map((s) => <span key={s} className="p3-stat">{s.slice(2)} mm² <b>{sizes[s]}</b> สตริง</span>)}
        {missing > 0 && <span className="p3-stat" style={{ color: "var(--tint-amber-tx)" }}>ยังไม่มีระยะ <b>{missing}</b> สตริง</span>}
      </div>
      <span className="p3-note">
        ระยะ = (สาย + จากแผงแรก + สาย − จากแผงสุดท้าย ถึงจุดอินเวอร์เตอร์ที่ใกล้สุด เดินแนวฉาก + ลงจากหลังคา + สายข้ามแถว) ÷ 2 × เผื่อ {spare} ·
        {optC ? "มีตัวคุมแผง: V ใช้งาน = ต่ำสุดของ (Vmp × แผง, ตัวคุม × Vout สูงสุด, MPPT สูงสุดของอินเวอร์เตอร์) · I = กำลังสตริง ÷ V (ไม่เกิน Iout) · VD = 2 × I × R90 × L · %VD เทียบ V ใช้งาน ·"
          : "VD = 2 × Imp × R90 × L · %VD เทียบ Vmp × จำนวนแผง ·"} R90 = 1.275 × R20 (สาย PV class 5) · พิกัดสาย EN 50618 (เทียบ datasheet ผู้ผลิตสาย) ·
        ความยาวรวมส่งให้ BOQ ใช้ได้ (หน้า BOQ › สายไฟ PV)
      </span>
    </div>
  );
}

/* ดรอปดาวน์ของแอป (หน้าออกแบบระบบไม่ใช้ select ธรรมดา — ผู้ใช้ว่าไม่สวย) · ค่าเป็นสตริงเสมอ */
const ccDdStyle = { fontSize: 11.5, fontWeight: 600, padding: "5px 8px", borderRadius: 8, boxShadow: "var(--shadow-inset)", minWidth: 0 };
function CcDd({ value, options, onChange, style }) {
  const Dd = window.Dropdown;
  const v = String(value == null ? "" : value);
  if (Dd) return <Dd value={v} options={options} onChange={onChange} style={Object.assign({}, ccDdStyle, style)} />;
  return (
    <select className="p3-inp" style={Object.assign({}, ccDdStyle, style)} value={v} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ช่องตัวเลขที่บันทึกตอนออกจากช่อง (พิมพ์ไม่ยิงฐานข้อมูลทุกตัวอักษร) · ว่าง = ลบค่าที่แก้ */
function CcNum({ value, placeholder, onCommit, width, bold, title, step }) {
  const [d, setD] = React.useState(null);
  return (
    <input className="p3-inp" type="number" step={step || "any"} min="0" title={title}
      style={{ padding: "5px 7px", fontSize: 11.5, width: width || 62, textAlign: "right", fontFamily: "inherit", fontWeight: bold ? 800 : 500, color: bold ? "var(--acd)" : undefined }}
      value={d != null ? d : value != null && isFinite(value) ? value : ""} placeholder={placeholder}
      onChange={(e) => setD(e.target.value)}
      onBlur={() => { if (d == null) return; const x = d; setD(null); onCommit(x === "" ? null : +x); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
  );
}

const CC_ARR = [{ value: "Trefoil", label: "สามเหลี่ยม (Trefoil)" }, { value: "Flat", label: "แนวราบชิดกัน" }, { value: "Spaced", label: "แนวราบเว้นระยะ" }];

/* ── สาย AC (เฟส 3) — อินเวอร์เตอร์ → ตู้ย่อย SMDB → MDB + หม้อแปลง ──
   props: job, ver, st (แบบ 3D), invs [{ model, n, phase, outA, kw }]
   ที่เก็บ cableCalc/{jobId}/{เวอร์ชันแบบ}/ac = { ta, cgm, arr, rows: { <i1 | f:SMDB-1>: { to, len, n, ovr, ct } }, xf: { kva, hv, lv, z } }
   สรุป sumAc (แยกจาก sum ของฝั่ง DC จะได้ไม่เขียนทับกัน) */
function CcAcCard({ job, ver, st, invs }) {
  const CC = window.CC, R = ((window.BOQ || {}).RULES) || {};
  const store = useCcStore(job && job.id, ver);
  const D = store.data || {}, A = D.ac || {}, E = A.rows || {};
  const vdLim = +R.vdAc > 0 ? +R.vdAc : 3;
  const ta = +A.ta > 0 ? +A.ta : 40, cgm = A.cgm || "L-2D", arr = A.arr || "Trefoil";
  const obs = (st && st.obstacles) || [];
  const hasMdb = !!obs.find((o) => o && o.p3sType === "mdb");
  const hasXfObj = !!obs.find((o) => o && o.p3sType === "xfmr");

  /* ระยะประมาณจากแบบ 3D: จุดอินเวอร์เตอร์ → ตู้ MDB แนวฉาก × 1.1 + ขึ้นลงตู้ 2 ม. · ตู้ย่อยติดข้างอินเวอร์เตอร์ = 5 ม. */
  const est = React.useMemo(() => {
    const ivs = obs.filter((o) => o && o.p3sType === "invst"), mdb = obs.find((o) => o && o.p3sType === "mdb");
    if (!mdb || !ivs.length) return { inv: 5 };
    const d = Math.min.apply(null, ivs.map((o) => Math.abs((+o.x || 0) - (+mdb.x || 0)) + Math.abs((+o.z || 0) - (+mdb.z || 0))));
    return { inv: 5, feed: Math.ceil(d * 1.1 + 2) };
  }, [st]); // eslint-disable-line

  const plan = React.useMemo(() => (CC && CC.acPlan ? CC.acPlan(invs, { edits: E, ta, cgm, arr, vdLim, est }) : { rows: [], boards: [] }),
    [JSON.stringify(invs), JSON.stringify(E), ta, cgm, arr, vdLim, est]); // eslint-disable-line
  const rows = plan.rows, ok = rows.filter((r) => r.valid);
  const maxPct = ok.length ? Math.max.apply(null, ok.map((r) => r.pctTotal || 0)) : 0;
  const bad = ok.filter((r) => !r.ok).length;
  const xf = A.xf || null, xr = xf && CC && +xf.kva > 0 ? CC.xfmr(+xf.kva, +xf.hv || 22000, +xf.lv || 400, +xf.z || 6) : null;

  /* cables = ขนาดสายจริงให้ SLD (ผ่าน plan3dSldDesign.cc) + รายงาน · ct/use/n/sys ไว้ให้ SLD จัดรูปชื่อสายเอง */
  const sumObj = { maxPct, bad, cables: ok.map((r) => ({ id: r.id, from: r.from, to: r.to, cable: r.cable, len: r.len, at: r.at, af: r.af, pe: r.pe, pct: r.pct,
    ct: r.ct, use: r.use, n: r.n, sys: r.sys })) }, sumJs = ccCanon(sumObj);
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const s = D.sumAc ? ccCanon({ maxPct: D.sumAc.maxPct, bad: D.sumAc.bad, cables: D.sumAc.cables }) : "";
    if (s === sumJs) return;
    const t = setTimeout(() => store.patch({ sumAc: Object.assign({}, sumObj, { at: new Date().toISOString() }) }), 1500);
    return () => clearTimeout(t);
  }, [sumJs, store.data === undefined]); // eslint-disable-line

  const setA = (k, v) => store.patch({ ["ac/" + k]: v === "" || v == null ? null : v });
  const setRow = (id, k, v) => {
    const cur = Object.assign({}, E[id] || {});
    if (v === "" || v == null) delete cur[k]; else cur[k] = v;
    store.patch({ ["ac/rows/" + id]: Object.keys(cur).length ? cur : null });
  };
  const resetAll = () => window.askConfirm({ title: "คืนค่าสาย AC ที่แก้เองทั้งหมด?", body: "ปลายทาง ระยะ ขนาดสาย ชุดขนาน ทุกวงจรกลับไปใช้ค่าที่ระบบคิดให้", ok: "คืนค่า", danger: true })
    .then((y) => { if (y) store.patch({ "ac/rows": null }); });

  ccLiveOf(job, ver).ac = { rows, ta, cgm, arr, vdLim, xf, xr, ca: CC.ca(ta) };
  if (!CC || !CC.acPlan || !rows.length) return null;
  const nEdited = Object.keys(E).length;
  const boardOpts = ["MDB", "SMDB-1", "SMDB-2", "SMDB-3"].map((b) => ({ value: b, label: b }));
  const sizeOpts = (r) => [{ value: "", label: isFinite(r.auto) ? "อัตโนมัติ · " + r.auto : "อัตโนมัติ · —" }]
    .concat(CC.SIZES.filter((s) => s >= 2.5).map((s) => ({ value: String(s), label: s + " mm²" })));
  const cgOpts = Object.keys(CC.CG).map((k) => ({ value: k, label: k + " · " + CC.CG[k].th }));
  const red = { color: "var(--tint-red-tx)" };
  const pct = (v) => (isFinite(v) ? v.toFixed(2) + "%" : "—");
  const lab = { display: "inline-flex", alignItems: "center", gap: 6 };
  return (
    <div className="p3-card">
      <span className="p3-eb"><P3Icon name="bolt" size={13} />สาย AC · อินเวอร์เตอร์ → ตู้ → MDB<span className="ln" />
        <span style={{ fontWeight: 600, color: bad ? "var(--tint-red-tx)" : undefined }}>
          {ok.length ? "แรงดันตกถึง MDB สูงสุด " + pct(maxPct) + " · เกณฑ์ ≤ " + vdLim + "%" + (bad ? " · ไม่ผ่าน " + bad + " วงจร" : " · ผ่านทุกวงจร") : "ยังไม่มีระยะสาย"}
        </span></span>

      {!hasMdb && (
        <div className="su-alert info"><P3Icon name="bulb" size={14} />
          <span>ยังไม่มี <b>ตู้ MDB</b> ในแบบ 3D — วางที่ขั้น "สิ่งบดบัง" › อุปกรณ์ไฟฟ้า (คู่กับจุดอินเวอร์เตอร์) ระบบจะประมาณระยะสายเมนให้ หรือกรอกระยะเองในตาราง</span></div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: 11.5, color: "var(--text-2)" }}>
        <label style={lab} title="อุณหภูมิแวดล้อมที่เดินสาย → ตัวคูณ Ca ตาราง 5-43 (ฐาน 40°C)">อุณหภูมิ
          <CcNum value={ta} width={52} onCommit={(v) => setA("ta", v > 0 && v !== 40 ? v : null)} />°C · Ca {CC.ca(ta)}</label>
        <label style={lab} title="ตัวคูณจัดกลุ่ม Cg ตาราง 5-40 (สายแกนเดียวบนราง) · จำนวนวงจรในรางนับจากอินเวอร์เตอร์ที่เข้าตู้เดียวกัน">รางสาย
          <CcDd value={cgm} options={cgOpts} onChange={(v) => setA("cgm", v === "L-2D" ? null : v)} style={{ width: 250 }} /></label>
        <label style={lab} title="การจัดวางสายแกนเดียว → คอลัมน์ mV/A/m ตาราง ฐ.3">จัดวาง
          <CcDd value={arr} options={CC_ARR} onChange={(v) => setA("arr", v === "Trefoil" ? null : v)} style={{ width: 170 }} /></label>
        <span style={{ flex: 1 }} />
        {nEdited > 0 && <button className="p3-lnk" onClick={resetAll}>คืนค่าที่แก้เอง ({nEdited})</button>}
        <CcReportBtn job={job} ver={ver} />
      </div>

      <div className="su-scroll">
        <table className="su-tb">
          <thead><tr><th>วงจร</th><th>ปลายทาง</th><th title="กระแสออกสูงสุด · อินเวอร์เตอร์ × 1.25 เลือกเบรกเกอร์ · สายเมนตู้ย่อย × 1">Imax (A)</th><th>CB AT/AF</th>
            <th title="ความยาวทางเดียว (ม.)">ระยะ (ม.)</th><th title="จำนวนชุดเดินขนาน">ชุด</th><th>แกน</th><th>ขนาด mm²</th>
            <th title="It = AT ÷ (Ca × Cg × ชุด) · Iz = พิกัดตาราง 5-33 × Ca × Cg × ชุด ต้อง ≥ AT">It / Iz</th><th title="mV/A/m ตาราง ฐ.3/ฐ.4">mV/A/m</th>
            <th>%VD</th><th title="รวมทางเดินถึง MDB (อินเวอร์เตอร์ + สายเมนตู้ย่อย)">ถึง MDB</th><th title="สายดินตาราง 4-2 (mm²)">PE</th><th>สาย</th><th>ผล</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const e = E[r.id] || {};
              return (
                <tr key={r.id} style={r.kind === "feed" ? { background: "var(--surface2)" } : undefined}>
                  <td style={{ whiteSpace: "nowrap" }}><b>{r.label}</b>{r.model ? <div style={{ fontSize: 10, color: "var(--text-3)" }}>{r.model}</div> : null}</td>
                  <td>{r.kind === "inv" ? <CcDd value={r.to} options={boardOpts} onChange={(v) => setRow(r.id, "to", v)} style={{ width: 96 }} /> : "MDB"}</td>
                  <td>{isFinite(r.imax) ? Math.round(r.imax * 10) / 10 : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{isFinite(r.at) ? r.at + "/" + r.af : "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <CcNum value={r.edited ? r.len : null} placeholder={r.est != null ? String(r.est) : "กรอก"} bold={r.edited}
                      title={r.edited ? "แก้เอง · ประมาณได้ " + (r.est != null ? r.est + " ม." : "—") + " (ลบให้ว่างเพื่อใช้ค่าประมาณ)" : r.est != null ? "ประมาณจากแบบ 3D" : "กรอกระยะ"}
                      onCommit={(v) => setRow(r.id, "len", v > 0 && v !== r.est ? v : null)} />
                  </td>
                  <td><CcNum value={+e.n > 1 ? +e.n : null} placeholder="1" width={42} step="1" onCommit={(v) => setRow(r.id, "n", v > 1 ? Math.round(v) : null)} /></td>
                  <td><CcDd value={r.ct} options={[{ value: "1C", label: "แกนเดียว" }, { value: "MC", label: "หลายแกน" }]} onChange={(v) => setRow(r.id, "ct", v)} style={{ width: 96 }} /></td>
                  <td><CcDd value={e.ovr != null ? String(e.ovr) : ""} options={sizeOpts(r)} onChange={(v) => setRow(r.id, "ovr", v === "" ? null : +v)} style={{ width: 124 }} /></td>
                  <td style={{ whiteSpace: "nowrap", color: r.valid && !r.ampOk ? "var(--tint-red-tx)" : undefined }}>{isFinite(r.it) ? Math.round(r.it) : "—"} / {isFinite(r.iz) ? Math.round(r.iz) : "—"}</td>
                  <td>{r.mv != null ? r.mv : "—"}</td>
                  <td><b style={r.valid && !r.vdOk ? red : undefined}>{pct(r.pct)}</b></td>
                  <td style={r.valid && r.pctTotal > vdLim ? red : undefined}>{pct(r.pctTotal)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{isFinite(r.pe) ? r.pe : "—"}</td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{r.cable || "—"}</td>
                  <td>{!r.valid ? <span style={{ color: "var(--text-3)" }}>รอระยะ</span>
                    : r.ok ? <span style={{ color: "var(--tint-ok-tx)", fontWeight: 800 }}>ผ่าน</span>
                    : <span style={{ color: "var(--tint-red-tx)", fontWeight: 800 }} title={[!r.ampOk && "พิกัดกระแสไม่พอ", !r.vdOk && "แรงดันตกเกินเกณฑ์", !r.peOk && "สายดินเล็กกว่าตาราง 4-2"].filter(Boolean).join(" · ")}>ไม่ผ่าน</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* หม้อแปลง — โชว์เมื่อแบบ 3D มีหม้อแปลง หรือเคยกรอกไว้ */}
      {hasXfObj || xf ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", fontSize: 11.5, color: "var(--text-2)" }}>
          <b style={{ color: "var(--text)" }}>หม้อแปลง</b>
          <label style={lab}>kVA <CcNum value={xf && +xf.kva} placeholder="เช่น 1000" width={74} onCommit={(v) => setA("xf/kva", v)} /></label>
          <label style={lab}>HV <CcNum value={xf && +xf.hv} placeholder="22000" width={70} onCommit={(v) => setA("xf/hv", v)} />V</label>
          <label style={lab}>LV <CcNum value={xf && +xf.lv} placeholder="400" width={56} onCommit={(v) => setA("xf/lv", v)} />V</label>
          <label style={lab}>%Z <CcNum value={xf && +xf.z} placeholder="6" width={48} onCommit={(v) => setA("xf/z", v)} /></label>
          {xr && <>
            <span className="p3-stat">In HV <b>{xr.inHv}</b> A</span>
            <span className="p3-stat">In LV <b>{xr.inLv.toLocaleString()}</b> A</span>
            <span className="p3-stat">Ib HV ×1.25 <b>{xr.ibHv}</b> A</span>
            <span className="p3-stat" title="กระแสลัดวงจรด้าน LV = In LV × 100 ÷ %Z · ใช้เช็กค่า Icu ของเบรกเกอร์">Isc LV <b>{xr.iscLv}</b> kA</span>
          </>}
        </div>
      ) : (
        <div><button className="p3-lnk" onClick={() => setA("xf/z", 6)}>+ คำนวณหม้อแปลง</button></div>
      )}

      <span className="p3-note">
        CB = ขั้นแรกที่ ≥ Imax × 1.25 (สายเมนตู้ย่อย × 1) · It = AT ÷ (Ca × Cg × ชุด) · พิกัดตาราง 5-33 กลุ่ม 7 (XLPE 90°C บนราง) ·
        แรงดันตก = mV/A/m (ฐ.3/ฐ.4) × Imax ÷ ชุด × ระยะ ÷ 1000 · PE ตาราง 4-2 · ระยะประมาณ = จุดอินเวอร์เตอร์ → ตู้ MDB แนวฉาก × 1.1 + 2 ม. · ตู้ย่อยข้างอินเวอร์เตอร์ 5 ม.
      </span>
    </div>
  );
}

/* ==================================================================
   รายงานคำนวณสาย (เฟส 4) — A4 แยกไฟล์ของตัวเอง (ผู้ใช้ 16 พ.ย. 2026: ไม่ใส่ในเล่ม PDF รวม)
   ชื่อไฟล์ CC_รหัส_ชื่องาน_วันที่ (rpFileName) · เปิดใน SuReportView แล้ว "บันทึก PDF"
   ใช้ผลชุดเดียวกับที่การ์ดโชว์ (CC_LIVE) — ตัวเลขในรายงานจึงตรงกับจอเสมอ
   ================================================================== */
const ccEsc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ccF = (v, d) => (isFinite(v) && v !== null && v !== "" ? (+v).toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d }) : "—");
function ccThDate(d) {
  const M = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return d.getDate() + " " + M[d.getMonth()] + " " + (d.getFullYear() + 543);
}

function ccReportHTML(job, ver, L) {
  job = job || {};
  const B = window.BRANDING || {}, dc = L.dc || null, ac = L.ac || null, now = new Date();
  const title = window.rpFileName ? window.rpFileName(job, "CC") : "CC " + (job.code || "");
  let logo = ""; try { logo = new URL(B.docMark || "dashboard/assets/flashplussolar-mark.png", location.href).href; } catch (e) { logo = ""; }
  const ok = (b) => (b ? '<b class="ok">ผ่าน</b>' : '<b class="ng">ไม่ผ่าน</b>');
  const tbl = (head, rows, cls) => '<table class="t ' + (cls || "") + '"><thead><tr>' + head.map((h) => "<th>" + h + "</th>").join("") + "</tr></thead><tbody>" +
    rows.map((r) => "<tr" + (r.cls ? ' class="' + r.cls + '"' : "") + ">" + (r.c || r).map((c) => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
  const kv = (rows) => '<table class="kv">' + rows.filter((x) => x && x[1] !== "" && x[1] != null).map((x) => "<tr><td>" + x[0] + "</td><td>" + x[1] + "</td></tr>").join("") + "</table>";
  const sec = (no, t) => '<h2><span>' + no + "</span>" + t + "</h2>";
  let n = 0, body = "";

  /* 1. ข้อมูลโครงการ + เกณฑ์ */
  body += sec(++n, "ข้อมูลโครงการและเกณฑ์ออกแบบ");
  body += '<div class="two">' + kv([
    ["โครงการ", ccEsc([job.code, job.name].filter(Boolean).join(" · "))],
    ["สถานที่", ccEsc([job.address, job.province].filter(Boolean).join(" "))],
    ["ขนาดระบบ", job.kw ? ccF(job.kw) + " kWp" : ""],
    ["แบบ 3D เวอร์ชัน", ccEsc(String(ver || "1"))],
  ]) + kv([
    ["มาตรฐานอ้างอิง", "วสท. 022001-22 (มาตรฐานการติดตั้งทางไฟฟ้าฯ พ.ศ. 2564) · IEC 62548 · EN 50618 (สาย PV)"],
    ["แรงดันตกสาย DC", dc ? "≤ " + dc.vdLim + "% ต่อสตริง" : ""],
    ["แรงดันตกสาย AC", ac ? "≤ " + ac.vdLim + "% ต่อวงจร" : ""],
    ["สาย DC ขนาดเล็กสุด", dc ? dc.minSize + " mm² (PV1-F / H1Z2Z2-K)" : ""],
  ]) + "</div>";

  /* 2. ฝั่ง DC */
  if (dc && dc.rows && dc.rows.length) {
    const P = dc.panel || {}, m = dc.mod || {};
    const ns = Array.from(new Set(dc.rows.map((r) => r.n).filter((x) => x > 0))).sort((a, b) => b - a);
    const tc = +P.tcVoc < 0 ? +P.tcVoc : -0.25;
    const vmaxInv = Math.min.apply(null, (dc.invs || []).map((x) => +x.maxVdc).filter((x) => x > 0).concat([Infinity]));
    const O = dc.opt;
    if (O) {
      /* มีตัวคุมแผง: แรงดันสตริงถูกตัวคุมจำกัดไว้ จึงไม่ใช้ Voc × แผง ตรวจจำนวนตัวคุมต่อสตริง + แรงดันตอนสั่งปิดแทน (เหมือน scOptStringCheck) */
      body += sec(++n, "ตัวคุมแผง (Optimizer) ต่อสตริง");
      body += '<p class="f">' + ccEsc(O.model || "ตัวคุมแผง") + " · " + (+O.per || 1) + " แผง/ตัว · Vout สูงสุด " + ccF(O.vOutMax, 0) + " V · Iout สูงสุด " + ccF(O.iOutMax, 1) + " A" +
        (+O.vOff > 0 ? " · แรงดันตอนสั่งปิด " + O.vOff + " V/ตัว" : "") + " — แรงดันสตริงถูกตัวคุมจำกัดให้อยู่ในช่วงของอินเวอร์เตอร์ จึงไม่คิด Voc × จำนวนแผง</p>";
      body += tbl(["แผงต่อสตริง", "ตัวคุม (ตัว)", "ช่วงที่คู่มือกำหนด", "แรงดันตอนสั่งปิด (V)", "แรงดันสูงสุดอินเวอร์เตอร์ (V)", "ผล"], ns.map((k) => {
        const u = Math.ceil(k / Math.max(1, +O.per || 1)), off = u * (+O.vOff || 0);
        const inR = (!(+O.minPerStr > 0) || u >= +O.minPerStr) && (!(+O.maxPerStr > 0) || u <= +O.maxPerStr);
        const okOff = !(isFinite(vmaxInv) && off > vmaxInv);
        return [k, u, (+O.minPerStr > 0 ? O.minPerStr : "—") + " – " + (+O.maxPerStr > 0 ? O.maxPerStr : "—"), +O.vOff > 0 ? ccF(off, 1) : "—",
          isFinite(vmaxInv) ? ccF(vmaxInv, 0) : "—", ok(inR && okOff)];
      }));
    } else {
      body += sec(++n, "แรงดันวงจรเปิดสูงสุดของสตริง (Voc ที่อุณหภูมิต่ำสุด)");
      body += '<p class="f">Voc,max = จำนวนแผง × Voc × [1 + (β/100) × (Tmin − 25)] · β = ' + tc + " %/°C · Tmin = " + dc.tMin + " °C</p>";
      body += tbl(["แผงต่อสตริง", "Voc แผง (V)", "Voc,max สตริง (V)", "แรงดันสูงสุดอินเวอร์เตอร์ (V)", "ผล"], ns.map((k) => {
        const v = window.CC.vocMax(k, +P.voc, tc, dc.tMin);
        return [k, ccF(P.voc, 2), ccF(v, 1), isFinite(vmaxInv) ? ccF(vmaxInv, 0) : "—", isFinite(vmaxInv) ? ok(v <= vmaxInv) : "—"];
      }));
    }
    body += sec(++n, "สายไฟ DC ต่อสตริง (แผง → อินเวอร์เตอร์)");
    body += kv([
      ["แผง", ccEsc(P.model || "") + " · Vmp " + ccF(m.vmp, 2) + " V · Imp " + ccF(m.imp, 2) + " A · Isc " + ccF(m.isc, 2) + " A" + (dc.bif ? " · สองหน้า" : "")],
      ["กระแสออกแบบ", O && +O.iOutMax > 0 ? "Id = Iout ตัวคุม × " + ccF(dc.kDC, 3) + " = " + ccF(O.iOutMax * dc.kDC, 2) + " A"
        : "Id = Isc × " + ccF(dc.kDC, 3) + " = " + ccF(m.isc * dc.kDC, 2) + " A" + (dc.bif ? " (รวมตัวคูณแผงสองหน้า)" : "")],
      ["ตัวคูณ", "Ca = " + dc.Ca + " · Cg = " + dc.Cg],
      ["ระยะสาย", dc.stations ? "ประมาณจากแบบ 3D (แผงแรก/แผงสุดท้าย → จุดอินเวอร์เตอร์ แนวฉาก + ลงหลังคา + สายข้ามแถว) ÷ 2 × เผื่อ " + dc.spare + " · ช่องที่มี * = แก้ตามหน้างาน" : "กรอกตามหน้างาน"],
    ]);
    body += '<p class="f">R90 = R20 × (1 + 0.00393 × 70) ≈ 1.275 × R20 · ' + (O
      ? "V ใช้งาน = ต่ำสุดของ (Vmp × แผง, ตัวคุม × Vout สูงสุด, MPPT สูงสุดอินเวอร์เตอร์ " + ccF(O.mpptMax, 0) + " V) · I = Vmp × Imp × แผง ÷ V ใช้งาน (ไม่เกิน Iout) · VD = 2 × I × R90 × L ÷ 1000 · %VD = VD ÷ V ใช้งาน × 100"
      : "VD = 2 × Imp × R90 × L ÷ 1000 · %VD = VD ÷ (Vmp × จำนวนแผง) × 100") + " · Iz = พิกัดสาย × Ca × Cg ≥ Id</p>";
    body += tbl(["สตริง", "INV / MPPT", "แผง", O ? "V / I ใช้งาน" : "Vmp สตริง (V)", "L (ม.)", "สาย (mm²)", "R90 (Ω/km)", "Iz (A)", "VD (V)", "%VD", "ผล"], dc.rows.map((r) => [
      "#" + r.id, ccEsc(r.addr || "—"), r.n, O ? ccF(r.vStr, 0) + " V · " + ccF(r.iOp, 2) + " A" : ccF(r.vStr, 0), isFinite(r.len) ? ccF(r.len, 1) + (r.edited ? "*" : "") : "—", isFinite(r.use) ? r.use : "—",
      ccF(r.r90, 3), ccF(r.iz, 1), ccF(r.vd, 2), isFinite(r.pct) ? ccF(r.pct, 2) + "%" : "—", r.valid ? ok(r.ok) : "รอระยะ"]), "sm");
    const v = dc.rows.filter((r) => r.valid), per = Math.round(v.reduce((t, r) => t + r.len, 0));
    body += '<p class="sum">สรุป: ' + v.length + " สตริง · %VD สูงสุด <b>" + ccF(Math.max.apply(null, v.map((r) => r.pct).concat([0])), 2) + "%</b> · ความยาวสายต่อขั้ว " + ccF(per, 0) +
      " ม. (แดง + ดำ " + ccF(per * 2, 0) + " ม.)" + (v.some((r) => !r.ok) ? ' · <b class="ng">มีสตริงไม่ผ่าน</b>' : "") + "</p>";
  }

  /* 3. ฝั่ง AC */
  if (ac && ac.rows && ac.rows.length) {
    const cgTh = (window.CC.CG[ac.cgm] || {}).th || ac.cgm;
    body += sec(++n, "สายไฟ AC (อินเวอร์เตอร์ → ตู้ย่อย → MDB)");
    body += kv([
      ["สภาพการเดินสาย", "สาย XLPE 90°C (CV) บนราง · " + ccEsc(cgTh) + " · จัดวาง " + ({ Trefoil: "สามเหลี่ยม", Flat: "แนวราบชิดกัน", Spaced: "แนวราบเว้นระยะ" }[ac.arr] || ac.arr)],
      ["อุณหภูมิแวดล้อม", ac.ta + " °C → Ca = " + ac.ca + " (ตาราง 5-43)"],
    ]);
    body += '<p class="f">AT = ขั้นแรกที่ ≥ Imax × 1.25 (สายเมนตู้ย่อย × 1) · It = AT ÷ (Ca × Cg × ชุด) · Iz = พิกัดตาราง 5-33 × Ca × Cg × ชุด ≥ AT · VD = mV/A/m (ตาราง ฐ.3/ฐ.4) × (Imax ÷ ชุด) × L ÷ 1000 · สายดิน (PE) ตาราง 4-2</p>';
    body += tbl(["วงจร", "Imax (A)", "AT/AF", "Cg", "It (A)", "สาย", "Iz (A)", "L (ม.)", "mV/A/m", "%VD", "ถึง MDB", "PE (mm²)", "ผล"], ac.rows.map((r) => ({ cls: r.kind === "feed" ? "fd" : "", c: [
      ccEsc(r.from + " → " + r.to), ccF(r.imax, 1), isFinite(r.at) ? r.at + "/" + r.af : "—", ccF(r.cg, 2), ccF(r.it, 1), ccEsc(r.cable || "—"), ccF(r.iz, 1),
      isFinite(r.len) ? ccF(r.len, 1) + (r.edited ? "*" : "") : "—", r.mv != null ? r.mv : "—", isFinite(r.pct) ? ccF(r.pct, 2) + "%" : "—",
      isFinite(r.pctTotal) ? ccF(r.pctTotal, 2) + "%" : "—", ccF(r.pe, 0), r.valid ? ok(r.ok) : "รอระยะ"] })), "sm");
    if (ac.xr) {
      const x = ac.xf || {};
      body += sec(++n, "หม้อแปลง");
      body += '<p class="f">In = kVA × 1000 ÷ (√3 × V) · Isc(LV) = In(LV) × 100 ÷ %Z</p>';
      body += tbl(["ขนาด (kVA)", "HV / LV (V)", "%Z", "In HV (A)", "Ib HV × 1.25 (A)", "In LV (A)", "Isc LV (kA)"],
        [[ccF(x.kva, 0), ccF(+x.hv || 22000, 0) + " / " + ccF(+x.lv || 400, 0), ccF(+x.z || 6, 1), ccF(ac.xr.inHv, 2), ccF(ac.xr.ibHv, 2), ccF(ac.xr.inLv, 2), ccF(ac.xr.iscLv, 2)]]);
    }
  }

  const sign = (t) => '<div class="sg"><div class="ln"></div><div>(' + "&nbsp;".repeat(46) + ')</div><b>' + t + '</b><div class="lic">เลขทะเบียนใบอนุญาต ................................</div><div>วันที่ ........../........../..........</div></div>';
  const css = "@page{size:A4 portrait;margin:12mm 11mm 14mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    "body{margin:0;font-family:'IBM Plex Sans Thai',sans-serif;color:#15211A;font-size:10px;background:#fff}" +
    ".hd{display:flex;align-items:center;gap:12px;border-bottom:2.5px solid #1B9B75;padding-bottom:8px;margin-bottom:6px}.hd img{height:38px}" +
    ".hd .t{flex:1}.hd h1{margin:0;font-size:17px;letter-spacing:.01em}.hd .e{font-size:10px;color:#4A5A51;letter-spacing:.06em}.hd .r{text-align:right;font-size:9.5px;color:#4A5A51;line-height:1.5}" +
    "h2{font-size:12px;margin:14px 0 6px;display:flex;align-items:center;gap:7px;break-after:avoid}h2 span{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:5px;background:#1B9B75;color:#fff;font-size:10.5px}" +
    ".two{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}table.kv{border-collapse:collapse;margin-bottom:3px}table.kv td{padding:2px 10px 2px 0;vertical-align:top;font-size:10px}table.kv td:first-child{color:#6A7A71;white-space:nowrap}" +
    "p.f{margin:5px 0 6px;padding:5px 9px;background:#F3F6F4;border-radius:6px;font-size:9.5px;color:#334139;line-height:1.55}" +
    "table.t{width:100%;border-collapse:collapse;margin:3px 0}table.t th{background:#1B5E4A;color:#fff;font-weight:700;font-size:9px;padding:4px 4px;text-align:center}" +
    "table.t td{padding:3px 4px;border-bottom:1px solid #E1E8E4;text-align:center;font-variant-numeric:tabular-nums;font-size:9.5px}table.t tr{break-inside:avoid}" +
    "table.sm td,table.sm th{font-size:8.6px;padding:3px 3px}tr.fd td{background:#EEF4F0;font-weight:700}" +
    "b.ok{color:#15803D}b.ng{color:#B91C1C}p.sum{margin:5px 0 0;font-size:10px}" +
    ".sgs{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px;break-inside:avoid}.sg{text-align:center;font-size:9.5px;line-height:1.75}.sg .ln{border-bottom:1px dotted #333;height:34px;margin:0 8px 4px}.sg b{font-size:10.5px}.sg .lic{color:#4A5A51}" +
    ".ft{margin-top:14px;font-size:8.5px;color:#7A8A81;display:flex;justify-content:space-between;border-top:1px solid #E1E8E4;padding-top:5px}";
  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + ccEsc(title) + "</title>" +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet"><style>' + css + "</style></head><body>" +
    '<div class="hd">' + (logo ? '<img src="' + ccEsc(logo) + '" alt="">' : "") + '<div class="t"><h1>รายการคำนวณขนาดสายไฟฟ้าและแรงดันตก</h1><div class="e">CABLE SIZING &amp; VOLTAGE DROP CALCULATION</div></div>' +
    '<div class="r">' + ccEsc(B.legalTH || B.legal || "") + "<br>เอกสาร " + ccEsc(title) + "<br>วันที่ " + ccThDate(now) + "</div></div>" +
    body +
    '<div class="sgs">' + sign("ผู้คำนวณ") + sign("ผู้ตรวจสอบ") + sign("ผู้อนุมัติ (วิศวกรไฟฟ้า)") + "</div>" +
    '<div class="ft"><span>* = ระยะที่แก้ตามหน้างาน · ตัวเลขจากหน้าออกแบบระบบ ณ วันที่ออกเอกสาร</span><span>' + ccEsc(B.legal || "") + "</span></div></body></html>";
}

/* ปุ่มเปิดรายงาน — มีทั้งในการ์ด DC และ AC (รายงานเดียวกัน รวมทั้งสองฝั่ง) */
function CcReportBtn({ job, ver }) {
  const [html, setHtml] = React.useState(null);
  const open = () => setHtml(ccReportHTML(job, ver, ccLiveOf(job, ver)));
  return (
    <>
      <button className="p3-lnk" onClick={open} title="รายงานคำนวณสาย DC + AC แยกไฟล์ A4 พร้อมช่องลงนาม" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--acd)" }}>
        <P3Icon name="doc" size={13} />รายงานคำนวณสาย (PDF)</button>
      {html && window.SuReportView && ReactDOM.createPortal(
        <window.SuReportView html={html} title="รายการคำนวณขนาดสายไฟฟ้าและแรงดันตก" onClose={() => setHtml(null)} />, document.body)}
    </>
  );
}

Object.assign(window, { CcDcCard, CcAcCard, CcDd, CcNum, CcReportBtn, useCcStore, ccReportHTML });
