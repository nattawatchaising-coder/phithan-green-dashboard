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
                  <select className="p3-inp" style={{ padding: "5px 7px", fontSize: 11.5 }} value={r.ovr}
                    onChange={(e) => setRow(r.id, "ovr", e.target.value === "" ? "" : +e.target.value)}>
                    <option value="">{isFinite(r.auto) ? "อัตโนมัติ · " + r.auto + " mm²" : "อัตโนมัติ · —"}</option>
                    {CC.PV.filter((p) => p.s >= 2.5 && p.s <= 16).map((p) => <option key={p.s} value={p.s}>{p.s} mm²</option>)}
                  </select>
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

Object.assign(window, { CcDcCard, useCcStore });
