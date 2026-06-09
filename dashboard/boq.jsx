/* ============================================================
   PHITHAN GREEN — BOQ Editor (ถอดวัสดุต่องาน)
   กรอกพารามิเตอร์ → คำนวณรายการวัสดุอัตโนมัติ → บันทึก / ดาวน์โหลด Excel
   ============================================================ */

function BOQEditor({ job, onClose, onSave }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [b, setB] = React.useState(() =>
    job && job.boq ? Object.assign(window.BOQ.blankBOQ(job), job.boq) : window.BOQ.blankBOQ(job));
  const [adv, setAdv] = React.useState(false);
  const set = (k, v) => setB((p) => Object.assign({}, p, { [k]: v }));
  const setSpare = (k, v) => setB((p) => Object.assign({}, p, { sparePct: Object.assign({}, p.sparePct, { [k]: v }) }));

  const setRow = (i, k, v) => setB((p) => { const rows = p.rows.slice(); rows[i] = Object.assign({}, rows[i], { [k]: v }); return Object.assign({}, p, { rows }); });
  const addRow = () => setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: 0, count: 1 }]) }));
  const delRow = (i) => setB((p) => Object.assign({}, p, { rows: p.rows.filter((_, j) => j !== i) }));

  const setCab = (i, k, v) => setB((p) => { const cs = p.cables.slice(); cs[i] = Object.assign({}, cs[i], { [k]: v }); return Object.assign({}, p, { cables: cs }); });
  const addCab = () => setB((p) => Object.assign({}, p, { cables: p.cables.concat([{ name: "", type: window.BOQ.CABLE_TYPES[0], length: 0 }]) }));
  const delCab = (i) => setB((p) => Object.assign({}, p, { cables: p.cables.filter((_, j) => j !== i) }));

  const result = window.BOQ.calcBOQ(b);

  const opt = (arr) => arr.map((x) => ({ value: x, label: typeof x === "string" ? x.trim() : x }));

  const GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", MOUNTING: "#F59E0B", CABLE: "#0EA5E9" };

  const exportXlsx = () => {
    if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
    const aoa = [];
    aoa.push(["บัญชีแสดงรายการปริมาณวัสดุ - Bill of Materials"]);
    aoa.push(["โครงการ", job ? job.name : "", "", "รหัสงาน", job ? job.code : ""]);
    aoa.push(["จำนวนแผง", (result.meta.panelCount || 0) + " แผง", "ขนาดติดตั้ง", (result.meta.kw || 0) + " kW", "วันที่", window.SF.TODAY]);
    aoa.push([]);
    aoa.push(["ลำดับ", "รายการ", "จำนวน", "หน่วย"]);
    let n = 0;
    result.groups.forEach((g) => {
      n += 1;
      aoa.push([n, g.group, "", ""]);
      g.items.forEach((it, k) => {
        aoa.push([n + "." + (k + 1), it.name, it.qty, it.unit]);
      });
    });
    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 8 }, { wch: 52 }, { wch: 10 }, { wch: 8 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "BOQ");
    const fn = "BOQ_" + (job ? job.code : "job") + ".xlsx";
    window.XLSX.writeFile(wb, fn);
  };

  const numStyle = Object.assign({}, inputStyle, { textAlign: "right" });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(720px,100%)", maxHeight: isMobile ? "96dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>ถอดวัสดุ BOQ {job && <span style={{ fontFamily: "var(--mono)", color: "var(--primary-dark)" }}>· {job.code}</span>}</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job ? job.name : "งาน"}</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        {/* body */}
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
          {/* ── ข้อมูลระบบ ── */}
          <Section title="ข้อมูลระบบ" icon="sun">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              <Field label="จำนวนแผง"><input type="number" style={numStyle} value={b.panels} onChange={(e) => set("panels", e.target.value)} /></Field>
              <Field label="ขนาดติดตั้ง (kW)">
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.kw.toLocaleString()}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>kW</span>
                </div>
              </Field>
              <Field label="ระบบไฟฟ้า"><Dropdown value={b.phase} onChange={(v) => set("phase", v)} options={[{ value: 1, label: "1 เฟส" }, { value: 3, label: "3 เฟส" }]} /></Field>
              <Field label="อัตราไมโคร"><Dropdown value={b.microRatio} onChange={(v) => set("microRatio", v)} options={[{ value: "1:1", label: "1:1 (1 แผง/ตัว)" }, { value: "2:1", label: "2:1 (2 แผง/ตัว)" }]} /></Field>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="รุ่นแผง"><Dropdown value={b.panelModel} onChange={(v) => set("panelModel", v)} options={opt(window.BOQ.PANELS.map((p) => p.model))} /></Field></div>
              <Field label="แบตเตอรี่ (kWh)"><input type="number" style={numStyle} value={b.batteryKwh} onChange={(e) => set("batteryKwh", e.target.value)} /></Field>
              <Field label="ระบบ Backup"><Dropdown value={b.backup} onChange={(v) => set("backup", v)} options={[{ value: true, label: "ติดตั้ง" }, { value: false, label: "ไม่ติดตั้ง" }]} /></Field>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="ประเภทหลังคา"><Dropdown value={b.roof} onChange={(v) => set("roof", v)} options={opt(window.BOQ.ROOF_OPTIONS)} /></Field></div>
            </div>
          </Section>

          {/* ── การจัดวางแผง ── */}
          <Section title="การจัดวางแผง (แถว)" icon="grid"
            right={<span style={{ fontSize: 11.5, fontWeight: 700, color: result.meta.valid ? "var(--primary-dark)" : "#EF4444" }}>
              {result.meta.valid ? "✓ " : "⚠ "}แผงจากแถว {result.meta.rowsSum} / คำนวณ {result.meta.panelCount}
            </span>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.rows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "center" }}>
                  <Field label={i === 0 ? "แผง/แถว" : ""}><input type="number" style={numStyle} value={r.panels} onChange={(e) => setRow(i, "panels", e.target.value)} /></Field>
                  <Field label={i === 0 ? "จำนวนแถว" : ""}><input type="number" style={numStyle} value={r.count} onChange={(e) => setRow(i, "count", e.target.value)} /></Field>
                  <button onClick={() => delRow(i)} title="ลบแถว" style={{ height: 40, marginTop: i === 0 ? 18 : 0, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={15} /></button>
                </div>
              ))}
              <button onClick={addRow} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มแถว</button>
            </div>

            <button onClick={() => setAdv((v) => !v)} style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าขั้นสูง (ราง / ระยะเผื่อ) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: adv ? "rotate(180deg)" : "none" }} />
            </button>
            {adv && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
                <Field label="ขนาดราง"><Dropdown value={b.railSize} onChange={(v) => set("railSize", v)} options={[{ value: 4.2, label: "4.2 ม." }, { value: 4.8, label: "4.8 ม." }]} /></Field>
                <Field label="เผื่อระหว่างแผง (ม.)"><input type="number" style={numStyle} value={b.gap} onChange={(e) => set("gap", e.target.value)} /></Field>
                <Field label="เผื่อหัวท้าย (ม.)"><input type="number" style={numStyle} value={b.endSpare} onChange={(e) => set("endSpare", e.target.value)} /></Field>
                <Field label="L-FEET/ราง"><input type="number" style={numStyle} value={b.lfeetPerRail} onChange={(e) => set("lfeetPerRail", e.target.value)} /></Field>
                <Field label="% เผื่อ RAIL"><input type="number" style={numStyle} value={b.sparePct.rail} onChange={(e) => setSpare("rail", e.target.value)} /></Field>
                <Field label="% เผื่อ JOINER"><input type="number" style={numStyle} value={b.sparePct.joiner} onChange={(e) => setSpare("joiner", e.target.value)} /></Field>
                <Field label="% เผื่อ MID"><input type="number" style={numStyle} value={b.sparePct.midClamp} onChange={(e) => setSpare("midClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ END"><input type="number" style={numStyle} value={b.sparePct.endClamp} onChange={(e) => setSpare("endClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ L-FEET"><input type="number" style={numStyle} value={b.sparePct.lfeet} onChange={(e) => setSpare("lfeet", e.target.value)} /></Field>
                <Field label="% เผื่อ GROUND LUG"><input type="number" style={numStyle} value={b.sparePct.ground} onChange={(e) => setSpare("ground", e.target.value)} /></Field>
              </div>
            )}
          </Section>

          {/* ── สายไฟ ── */}
          <Section title="สายไฟ" icon="power">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {b.cables.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 70px 36px" : "120px 1fr 90px 36px", gap: 8, alignItems: "center" }}>
                  {!isMobile && <input style={inputStyle} value={c.name} placeholder="ชื่อจุด" onChange={(e) => setCab(i, "name", e.target.value)} />}
                  <Dropdown value={c.type} onChange={(v) => setCab(i, "type", v)} options={opt(window.BOQ.CABLE_TYPES)} />
                  <input type="number" style={numStyle} value={c.length} placeholder="ม." onChange={(e) => setCab(i, "length", e.target.value)} />
                  <button onClick={() => delCab(i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                </div>
              ))}
              <button onClick={addCab} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มสาย</button>
            </div>
          </Section>

          {/* ── ผลลัพธ์ BOQ ── */}
          <Section title="รายการวัสดุที่ถอดได้" icon="box">
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {result.groups.map((g, gi) => (
                <div key={gi}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "var(--surface2)", borderTop: gi ? "1px solid var(--border)" : "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: GROUP_COLOR[g.group] || "var(--text-3)" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)", letterSpacing: ".03em" }}>{g.group}</span>
                  </div>
                  {g.items.length === 0 ? (
                    <div style={{ padding: "9px 14px", fontSize: 12, color: "var(--text-3)" }}>—</div>
                  ) : g.items.map((it, ii) => (
                    <div key={ii} style={{ display: "grid", gridTemplateColumns: "1fr 64px 48px", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>{(it.name || "").trim()}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", textAlign: "right" }}>{(Math.round(it.qty * 100) / 100).toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right" }}>{it.unit}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* footer */}
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          <button onClick={exportXlsx} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid #1d854b", background: "#22A35B14", color: "#1d854b", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="box" size={15} color="#1d854b" /> Excel</button>
          {onSave && <button onClick={() => onSave(b)} style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก BOQ</button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, right, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "var(--text-3)", textTransform: "uppercase" }}>
          <Icon name={icon} size={14} color="var(--text-2)" /> {title}
        </span>
        {right}
      </div>
      {children}
    </div>
  );
}

Object.assign(window, { BOQEditor });
