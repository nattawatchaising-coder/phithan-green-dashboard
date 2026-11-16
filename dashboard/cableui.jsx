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

const ccBif = (P) => !!P && (P.bifacial === true || (P.bifacial == null && /bifacial|BDV|BDB|HBD|DEG\d|JAM\d+D\d/i.test(String(P.model || ""))));

/* props: job, ver, st (แบบ 3D), strings (plan.strings), paths (wirePaths), foot (p3FootAll), panel (สเปคแผง), colorOf */
function CcDcCard({ job, ver, st, strings, paths, foot, panel, colorOf }) {
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

  const rows = React.useMemo(() => (strings || []).map((s) => {
    const e = est[s.id], ed = dcEdit[s.id] || {};
    const len = +ed.len > 0 ? +ed.len : e ? e.len : NaN;
    const r = CC ? CC.dcString({ n: s.n, len, ovr: ed.ovr }, mod, { kDC, ca: Ca, cg: Cg, vdLim, minSize, tempK: +R.pvWireTempK || 1 }) : {};
    return Object.assign(r, { id: s.id, addr: s.addr, est: e ? e.len : null, edited: +ed.len > 0, ovr: ed.ovr || "" });
  }), [strings, est, D.dc, mod.vmp, mod.imp, mod.isc, kDC, Ca, Cg, vdLim, minSize]); // eslint-disable-line

  const ok = rows.filter((r) => r.valid);
  const maxPct = ok.length ? Math.max.apply(null, ok.map((r) => r.pct || 0)) : 0;
  const bad = ok.filter((r) => !r.ok).length;
  const perPole = Math.round(ok.reduce((t, r) => t + r.len, 0));
  const sizes = {}; ok.forEach((r) => { if (isFinite(r.use)) sizes[r.use] = (sizes[r.use] || 0) + 1; });
  const missing = rows.length - ok.length;

  /* สรุปให้ BOQ — เขียนเมื่อเปลี่ยนจริง หน่วง 1.5 วิ (ระหว่างลากจัดสตริงจะได้ไม่ยิงถี่ · แบบเดียวกับ plan3dSldDesign) */
  const sumJs = JSON.stringify({ strings: ok.length, perPole, maxPct, sizes });
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const cur = D.sum ? JSON.stringify({ strings: D.sum.strings, perPole: D.sum.perPole, maxPct: D.sum.maxPct, sizes: D.sum.sizes }) : "";
    if (cur === sumJs) return;
    const t = setTimeout(() => store.patch({ sum: Object.assign(JSON.parse(sumJs), { at: new Date().toISOString() }) }), 1500);
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
        <span>Id = Isc {mod.isc} × {Math.round(kDC * 1000) / 1000} = <b>{Math.round(mod.isc * kDC * 100) / 100} A</b></span>
        <span>ขั้นต่ำ {minSize} mm² · เผื่อระยะ ×{spare}</span>
        <span style={{ flex: 1 }} />
        {nEdited > 0 && <button className="p3-lnk" onClick={resetAll}>คืนค่าที่แก้เอง ({nEdited})</button>}
      </div>

      <div className="su-scroll">
        <table className="su-tb">
          <thead><tr><th>สตริง</th><th>INV / MPPT</th><th>แผง</th><th>Vmp สตริง</th>
            <th title="ความยาวทางเดียว L ในสูตร VD = 2 × Imp × R90 × L">ระยะ L (ม.)</th><th>สาย PV1-F</th>
            <th title="พิกัดสาย × Ca × Cg × ตัวคูณอุณหภูมิ ต้อง ≥ Id">Iz (A)</th><th>VD (V)</th><th>%VD</th><th>ผล</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "var(--r-pill)", background: colorOf ? colorOf(r.id) : "var(--primary)" }} /><b>#{r.id}</b></span></td>
                <td style={{ whiteSpace: "nowrap" }}>{r.addr || "—"}</td>
                <td><b>{r.n}</b></td>
                <td>{isFinite(r.vStr) ? Math.round(r.vStr) + " V" : "—"}</td>
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
        {Object.keys(sizes).sort((a, b) => a - b).map((s) => <span key={s} className="p3-stat">{s} mm² <b>{sizes[s]}</b> สตริง</span>)}
        {missing > 0 && <span className="p3-stat" style={{ color: "var(--tint-amber-tx)" }}>ยังไม่มีระยะ <b>{missing}</b> สตริง</span>}
      </div>
      <span className="p3-note">
        ระยะ = (สาย + จากแผงแรก + สาย − จากแผงสุดท้าย ถึงจุดอินเวอร์เตอร์ที่ใกล้สุด เดินแนวฉาก + ลงจากหลังคา + สายข้ามแถว) ÷ 2 × เผื่อ {spare} ·
        VD = 2 × Imp × R90 × L · R90 = 1.275 × R20 (สาย PV class 5) · %VD เทียบ Vmp × จำนวนแผง · พิกัดสาย EN 50618 (เทียบ datasheet ผู้ผลิตสาย) ·
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

  const sumJs = JSON.stringify({ maxPct, bad, cables: ok.map((r) => ({ id: r.id, from: r.from, to: r.to, cable: r.cable, len: r.len, at: r.at, af: r.af, pe: r.pe, pct: r.pct })) });
  React.useEffect(() => {
    if (store.data === undefined || !ok.length || !job || !job.id) return;
    const s = D.sumAc ? JSON.stringify({ maxPct: D.sumAc.maxPct, bad: D.sumAc.bad, cables: D.sumAc.cables }) : "";
    if (s === sumJs) return;
    const t = setTimeout(() => store.patch({ sumAc: Object.assign(JSON.parse(sumJs), { at: new Date().toISOString() }) }), 1500);
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

Object.assign(window, { CcDcCard, CcAcCard, CcDd, CcNum, useCcStore });
