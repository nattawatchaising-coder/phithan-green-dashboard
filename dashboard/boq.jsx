/* ============================================================
   PHITHAN GREEN — BOQ Editor (ถอดวัสดุต่องาน)
   กรอกพารามิเตอร์ → คำนวณรายการวัสดุอัตโนมัติ → บันทึก / ดาวน์โหลด Excel
   ============================================================ */

function BOQEditor({ job, onClose, onSave, priceMap, stock }) {
  const bdClose = window.useBackdropClose(onClose);
  const baht = (n) => (Math.round((+n || 0) * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [b, setB] = React.useState(() => {
    const base = job && job.boq ? Object.assign(window.BOQ.blankBOQ(job), job.boq) : window.BOQ.blankBOQ(job);
    // สเปคหลักดึงจากข้อมูลงานเสมอ (ฐานข้อมูลเป็นตัวตั้ง) — แบต/Backup/ออฟติไมเซอร์/จำนวนแผง
    if (job) {
      if (job.panels != null && job.panels !== "") base.panels = job.panels;
      base.batteryKwh = job.battery ? (parseFloat(job.batSize) || 0) : 0;
      base.backup = !!job.backup;
      base.hwOptimizer = !!(job.connect && job.connect !== "-" && job.connect !== "ไม่มี");
      // งานมี Backup → ตั้งระบบสำรองไฟของ Huawei ให้ (เริ่มที่ Backup Box เปลี่ยนเป็น SmartGuard ได้)
      if (job.backup && (!base.hwBackup || base.hwBackup === "none")) base.hwBackup = "backupbox";
      else if (!job.backup) base.hwBackup = "none";
    }
    return base;
  });
  const hasBattery = !!(job && job.battery);
  const hasBackup = !!(job && job.backup);
  const [adv, setAdv] = React.useState(false);
  const set = (k, v) => setB((p) => Object.assign({}, p, { [k]: v }));
  const setSpare = (k, v) => setB((p) => Object.assign({}, p, { sparePct: Object.assign({}, p.sparePct, { [k]: v }) }));

  const setRow = (i, k, v) => setB((p) => { const rows = p.rows.slice(); rows[i] = Object.assign({}, rows[i], { [k]: v }); return Object.assign({}, p, { rows }); });
  const addRow = () => setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: 0, count: 1 }]) }));
  const fillRemaining = (rem) => { if (rem > 0) setB((p) => Object.assign({}, p, { rows: p.rows.concat([{ panels: rem, count: 1 }]) })); };
  const delRow = (i) => setB((p) => Object.assign({}, p, { rows: p.rows.filter((_, j) => j !== i) }));

  const setCab = (i, k, v) => setB((p) => { const cs = p.cables.slice(); cs[i] = Object.assign({}, cs[i], { [k]: v }); return Object.assign({}, p, { cables: cs }); });
  const addCab = () => setB((p) => Object.assign({}, p, { cables: p.cables.concat([{ name: "", type: "", length: "" }]) }));
  const delCab = (i) => setB((p) => Object.assign({}, p, { cables: p.cables.filter((_, j) => j !== i) }));

  // ── ท่อร้อยสาย (RACE WAY) ──
  const cond = b.conduit || { imc: [], upvc: [], pullbox: [] };
  const setCond = (kind, i, k, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); const a = (c[kind] || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); c[kind] = a; return Object.assign({}, p, { conduit: c }); });
  const addCond = (kind, item) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c[kind] = (c[kind] || []).concat([item]); return Object.assign({}, p, { conduit: c }); });
  const delCond = (kind, i) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c[kind] = (c[kind] || []).filter((_, j) => j !== i); return Object.assign({}, p, { conduit: c }); });
  const setFlexSize = (size, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c.flex = Object.assign({}, c.flex, { [size]: v }); return Object.assign({}, p, { conduit: c }); });
  const setUpFlexSize = (size, v) => setB((p) => { const c = Object.assign({ imc: [], upvc: [], pullbox: [] }, p.conduit); c.upFlex = Object.assign({}, c.upFlex, { [size]: v }); return Object.assign({}, p, { conduit: c }); });
  const SPARE_DEF = { clamp: 10, bushing: 10, cchannel: 10, connector: 10, coupling: 10, upStraight: 10, upClamp: 10, upConnector: 10 };
  const setCSpare = (k, v) => setB((p) => Object.assign({}, p, { conduitSpare: Object.assign({}, SPARE_DEF, p.conduitSpare, { [k]: v }) }));
  const [advC, setAdvC] = React.useState(false);
  const [advU, setAdvU] = React.useState(false);
  const csp = Object.assign({}, SPARE_DEF, b.conduitSpare);

  const result = window.BOQ.calcBOQ(b);
  const priced = window.BOQ.applyPrices(result, priceMap || {});
  const remaining = result.meta.panelCount - result.meta.rowsSum; // >0 ขาด, <0 เกิน, 0 ครบ
  // อินเวอร์เตอร์ String/Hybrid ที่เลือก (Huawei = มี combiner box)
  const selInv = (window.BOQ.INVERTERS || []).find((x) => x.model === b.inverterModel);
  const isHuawei = !!(selInv && selInv.inputs > 0);
  // ── กรองรุ่นอินเวอร์เตอร์ตามแบรนด์ + เฟส ของงาน ──
  const jobBrand = (job && job.brand) || "";
  const jobPhaseNum = String(job && job.phase) === "3" ? 3 : 1;
  const brandInvs = (window.BOQ.INVERTERS || []).filter((x) =>
    (!jobBrand || x.model.toLowerCase().indexOf(jobBrand.toLowerCase()) >= 0) &&
    (!x.phase || x.phase === jobPhaseNum)   // เฉพาะรุ่นที่เฟสตรงกับงาน (รุ่นที่ไม่ระบุเฟส = แสดงทุกเฟส)
  );
  const showMicro = !jobBrand || /atmoce/i.test(jobBrand);   // ไมโคร ATMOCE เป็นของแบรนด์ ATMOCE
  const invOptions = (showMicro ? [{ value: "", label: "ไมโคร ATMOCE (ตามอัตรา)" }] : [])
    .concat(brandInvs.map((x) => ({ value: x.model, label: x.model + (x.kw ? " · " + x.kw + "kW" : "") })));
  // แบรนด์ที่ไม่มีไมโคร (เช่น Huawei) / เปลี่ยนเฟส แล้วรุ่นที่เลือกไม่ตรง → เลือกรุ่นแรกที่ตรงให้
  React.useEffect(() => {
    const inList = brandInvs.some((x) => x.model === b.inverterModel);
    if (!showMicro && !inList && brandInvs.length) set("inverterModel", brandInvs[0].model);
    else if (showMicro && b.inverterModel && !inList) set("inverterModel", "");
  }, [jobBrand, jobPhaseNum]); // eslint-disable-line
  const maxPvTotal = selInv ? (selInv.maxPv || 0) * result.meta.invCount : 0;
  const pvOver = isHuawei && maxPvTotal > 0 && result.meta.kw > maxPvTotal;

  // กันพลาด: ถ้าจำนวนแผงในแถวไม่ตรงกับจำนวนแผงรวม ให้ยืนยันก่อน
  const guardRun = (fn) => {
    if (remaining !== 0) {
      const msg = remaining > 0
        ? ("⚠ ยังวางแผงไม่ครบ — ขาดอีก " + remaining + " แผง (วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + ")\nปริมาณ Mounting จะไม่ครบ ต้องการดำเนินการต่อหรือไม่?")
        : ("⚠ วางแผงเกินจำนวน " + (-remaining) + " แผง (วางแล้ว " + result.meta.rowsSum + "/" + result.meta.panelCount + ")\nต้องการดำเนินการต่อหรือไม่?");
      if (!confirm(msg)) return;
    }
    fn();
  };

  const opt = (arr) => arr.map((x) => ({ value: x, label: typeof x === "string" ? x.trim() : x }));

  const GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", "COMBINER BOX": "#4F46E5", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207", ACCESSORIES: "#EC4899" };

  // ── Accessories: เพิ่มของ / ดึงจากราคาวัสดุ + คลังสินค้า ──
  const stockItems = (stock && stock.items) || [];
  const matInfo = React.useMemo(() => {
    const m = {};
    (window.BOQ.catalog() || []).forEach((c) => { m[c.name] = { unit: c.unit }; });
    stockItems.forEach((s) => { m[s.name] = { unit: s.unit || (m[s.name] && m[s.name].unit) || "", code: s.sku }; });
    Object.keys(priceMap || {}).forEach((n) => { m[n] = { unit: (priceMap[n].unit || (m[n] && m[n].unit) || ""), code: priceMap[n].code }; });
    return m;
  }, [priceMap, stockItems.length]);
  // จัดวัสดุเป็นหมวดสำหรับเลือกใน Accessories
  const accCat = React.useMemo(() => {
    const TH = { "PV MODULE": "แผง", INVERTER: "อินเวอร์เตอร์", MOUNTING: "อุปกรณ์ mounting", CABLE: "สายไฟ", "RACE WAY": "ท่อร้อยสาย", GROUNDING: "กราวด์", ACCESSORIES: "Accessories" };
    const cat = window.BOQ.catalog() || [];
    const catKeys = new Set(cat.map((c) => c.name));
    const byCat = {};
    const add = (c, n) => { if (!n) return; (byCat[c] = byCat[c] || new Set()).add(n); };
    cat.forEach((c) => add(TH[c.group] || c.group, c.name));
    Object.keys(priceMap || {}).forEach((n) => { if (!catKeys.has(n)) add(TH[priceMap[n].group || "ACCESSORIES"] || "Accessories", n); });
    stockItems.forEach((s) => add("คลังสินค้า", s.name));
    const order = ["Accessories", "คลังสินค้า", "อุปกรณ์ mounting", "สายไฟ", "ท่อร้อยสาย", "กราวด์", "แผง", "อินเวอร์เตอร์"];
    const cats = Object.keys(byCat).sort((a, z) => { const ia = order.indexOf(a), iz = order.indexOf(z); return (ia < 0 ? 99 : ia) - (iz < 0 ? 99 : iz); });
    const map = {}; cats.forEach((c) => { map[c] = [...byCat[c]].sort(); });
    return { cats, map };
  }, [priceMap, stockItems.length]);

  const accList = b.accessories || [];
  const setAcc = (i, k, v) => setB((p) => { const a = (p.accessories || []).slice(); a[i] = Object.assign({}, a[i], { [k]: v }); if (k === "name" && matInfo[v]) a[i].unit = matInfo[v].unit || a[i].unit; return Object.assign({}, p, { accessories: a }); });
  const setAccCat = (i, v) => setB((p) => { const a = (p.accessories || []).slice(); a[i] = Object.assign({}, a[i], { cat: v, name: "" }); return Object.assign({}, p, { accessories: a }); });
  const addAcc = () => setB((p) => Object.assign({}, p, { accessories: (p.accessories || []).concat([{ cat: "", name: "", qty: 1, unit: "" }]) }));
  const delAcc = (i) => setB((p) => Object.assign({}, p, { accessories: (p.accessories || []).filter((_, j) => j !== i) }));

  const ConduitList = ({ kind, label, sizes, valKey, unitText }) => (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 7 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(cond[kind] || []).map((x, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 78px 36px", gap: 8, alignItems: "center" }}>
            <Dropdown value={x.size} onChange={(v) => setCond(kind, i, "size", v)} options={opt(sizes)} placeholder="เลือกขนาด" />
            <input type="number" style={numStyle} value={x[valKey]} placeholder={unitText} onChange={(e) => setCond(kind, i, valKey, e.target.value)} />
            <button onClick={() => delCond(kind, i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
          </div>
        ))}
        <button onClick={() => addCond(kind, { size: sizes[0], [valKey]: 0 })} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--surface3)", color: "var(--text-2)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={13} color="var(--text-2)" /> เพิ่ม {label}</button>
      </div>
    </div>
  );

  const exportXlsx = () => {
    if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
    const aoa = [];
    aoa.push(["บัญชีแสดงรายการปริมาณวัสดุ - Bill of Materials"]);
    aoa.push(["โครงการ", job ? job.name : "", "", "รหัสงาน", job ? job.code : ""]);
    aoa.push(["จำนวนแผง", (result.meta.panelCount || 0) + " แผง", "ขนาดติดตั้ง", (result.meta.kw || 0) + " kW", "วันที่", window.SF.TODAY]);
    aoa.push([]);
    const hasPrice = priced.grandTotal > 0;
    aoa.push(["ลำดับ", "รหัส", "รายการ", "จำนวน", "หน่วย", "ราคา/หน่วย", "ราคารวม"]);
    let n = 0;
    priced.groups.forEach((g) => {
      n += 1;
      aoa.push([n, "", g.group, "", "", "", ""]);
      g.items.forEach((it, k) => {
        aoa.push([n + "." + (k + 1), it.code || "", it.name, it.qty, it.unit, it.price || "", it.total || ""]);
      });
    });
    if (hasPrice) { aoa.push([]); aoa.push(["", "", "", "", "", "ต้นทุนรวม", priced.grandTotal]); }
    const ws = window.XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 8 }, { wch: 16 }, { wch: 48 }, { wch: 9 }, { wch: 8 }, { wch: 11 }, { wch: 13 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "BOQ");
    const fn = "BOQ_" + (job ? job.code : "job") + ".xlsx";
    window.XLSX.writeFile(wb, fn);
  };

  const numStyle = Object.assign({}, inputStyle, { textAlign: "right" });

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
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
              <Field label="ระบบไฟฟ้า (ตามงาน)">
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                  <Icon name="lock" size={13} color="var(--text-3)" />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{String(b.phase) === "3" ? "3 เฟส" : "1 เฟส"}</span>
                </div>
              </Field>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label={"อินเวอร์เตอร์" + (jobBrand ? " · " + jobBrand : "")}><Dropdown value={b.inverterModel || ""} onChange={(v) => set("inverterModel", v)} options={invOptions} /></Field></div>
              {!b.inverterModel
                ? <Field label="อัตราไมโคร"><Dropdown value={b.microRatio} onChange={(v) => set("microRatio", v)} options={[{ value: "1:1", label: "1:1 (1 แผง/ตัว)" }, { value: "2:1", label: "2:1 (2 แผง/ตัว)" }]} /></Field>
                : <Field label="จำนวนอินเวอร์เตอร์"><div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}><span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.invCount}</span><span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ตัว</span></div></Field>}
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="รุ่นแผง"><Dropdown value={b.panelModel} onChange={(v) => set("panelModel", v)} options={opt(window.BOQ.PANELS.map((p) => p.model))} /></Field></div>
              {hasBattery && <Field label="แบตเตอรี่ (kWh)"><input type="number" style={numStyle} value={b.batteryKwh} onChange={(e) => set("batteryKwh", e.target.value)} /></Field>}
              {hasBackup && <Field label="ระบบ Backup"><Dropdown value={b.backup} onChange={(v) => set("backup", v)} options={[{ value: true, label: "ติดตั้ง" }, { value: false, label: "ไม่ติดตั้ง" }]} /></Field>}
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}><Field label="ประเภทหลังคา"><Dropdown value={b.roof} onChange={(v) => set("roof", v)} options={opt(window.BOQ.ROOF_OPTIONS)} /></Field></div>
            </div>
          </Section>

          {/* ── ระบบอินเวอร์เตอร์ Hybrid/On-grid (Huawei) ── */}
          {isHuawei && (
            <Section title={"ระบบ " + (selInv.type === "hybrid" ? "Hybrid" : "On-grid") + " (" + selInv.model + ")"} icon="bolt">
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
                <Field label="จำนวนอินเวอร์เตอร์">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: 4, background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--primary-dark)" }}>{result.meta.invCount}</span><span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ตัว</span>
                  </div>
                </Field>
                <Field label={"String ต่อตัว (สูงสุด " + selInv.inputs + ")"}>
                  <input type="number" style={numStyle} value={b.strings || selInv.inputs} min={1} max={selInv.inputs}
                    onChange={(e) => set("strings", Math.min(Math.max(parseInt(e.target.value) || 1, 1), selInv.inputs))} />
                </Field>
                <Field label="ระบบสำรองไฟ">
                  <Dropdown value={b.hwBackup || "none"} onChange={(v) => set("hwBackup", v)} options={[
                    { value: "none", label: "ไม่ติดตั้ง" },
                    { value: "smartguard", label: "SmartGuard" },
                    { value: "backupbox", label: "Backup Box" },
                  ]} />
                </Field>
                <Field label="Optimizer (1:1 ต่อแผง)"><Dropdown value={!!b.hwOptimizer} onChange={(v) => set("hwOptimizer", v)} options={[{ value: false, label: "ไม่ใช้" }, { value: true, label: "ใช้" }]} /></Field>
                <Field label="ตู้ไฟเพิ่ม (case by case)"><Dropdown value={!!b.hwExtraPanel} onChange={(v) => set("hwExtraPanel", v)} options={[{ value: false, label: "ไม่มี" }, { value: true, label: "มี" }]} /></Field>
              </div>
              {pvOver && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B91C1C" }}>
                  <Icon name="alert" size={15} color="#EF4444" /> กำลังแผง {result.meta.kw} kW เกิน MAX PV รวม {maxPvTotal} kW ({selInv.invCount || result.meta.invCount} ตัว × {selInv.maxPv} kW) — เพิ่มจำนวนอินเวอร์เตอร์หรือลดแผง
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                * Combiner Box + DC (Fuse/Holder/MCB/MC4) คิดตามจำนวน String · RCBO/SPD/Smart Meter/Backup เลือกตามเฟส ({selInv.phase === 3 ? "3" : "1"} เฟส) · RCBO ขนาดจากกระแสออก × 1.25
              </div>
            </Section>
          )}

          {/* ── การจัดวางแผง ── */}
          <Section title="การจัดวางแผง (แถว)" icon="grid"
            right={<span style={{ fontSize: 11.5, fontWeight: 700, color: remaining === 0 ? "var(--primary-dark)" : "#EF4444" }}>
              วางแล้ว {result.meta.rowsSum} / {result.meta.panelCount} แผง
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

            {/* สถานะวางแผงให้ครบ — กันพลาด */}
            {remaining === 0 ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "var(--primary-soft)", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "var(--primary-dark)" }}>
                <Icon name="check" size={15} color="var(--primary-dark)" sw={2.6} /> วางแผงครบตามจำนวนแล้ว ({result.meta.panelCount} แผง)
              </div>
            ) : remaining > 0 ? (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FBD3D3", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B91C1C" }}>
                <Icon name="alert" size={15} color="#EF4444" /> ยังขาดอีก {remaining} แผง
                <button onClick={() => fillRemaining(remaining)} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, padding: "6px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  <Icon name="plus" size={13} color="#fff" /> เพิ่มแถว {remaining} แผง
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", background: "#FEF9EC", border: "1px solid #FCE4B6", borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "#B45309" }}>
                <Icon name="alert" size={15} color="#F59E0B" /> วางเกินจำนวนแผง {-remaining} แผง — ตรวจสอบจำนวนแผง/แถว
              </div>
            )}

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
                  <Dropdown value={c.type} onChange={(v) => setCab(i, "type", v)} options={opt(window.BOQ.CABLE_TYPES)} placeholder="— เลือกสายไฟ —" />
                  <input type="number" style={numStyle} value={c.length} placeholder="ม." onChange={(e) => setCab(i, "length", e.target.value)} />
                  <button onClick={() => delCab(i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                </div>
              ))}
              <button onClick={addCab} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มสาย</button>
            </div>
          </Section>

          {/* ── ท่อร้อยสาย (RACE WAY) ── */}
          <Section title="ท่อร้อยสาย (RACE WAY)" icon="grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ConduitList kind="imc" label="ท่อ IMC (3m/ท่อน)" sizes={window.BOQ.IMC_SIZES} valKey="length" unitText="ม." />
              <ConduitList kind="upvc" label="ท่อ uPVC" sizes={window.BOQ.UPVC_SIZES} valKey="length" unitText="ม." />
              <ConduitList kind="pullbox" label="PULL BOX" sizes={window.BOQ.PULLBOX_SIZES} valKey="qty" unitText="ชิ้น" />
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
              * อุปกรณ์ IMC (แคล้มประกับ / บุชชิ่ง,ล็อกนัท / รางซี / คอนเนคเตอร์ / คุปปิ้ง) คำนวณอัตโนมัติจากความยาวท่อ + จำนวน PULL BOX
            </div>
            {/* ตั้งค่า IMC */}
            <button onClick={() => setAdvC((v) => !v)} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าอุปกรณ์ IMC (% เผื่อ / ท่ออ่อน) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: advC ? "rotate(180deg)" : "none" }} />
            </button>
            {advC && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <Field label="% เผื่อ แคล้มประกับ"><input type="number" style={numStyle} value={csp.clamp} onChange={(e) => setCSpare("clamp", e.target.value)} /></Field>
                <Field label="% เผื่อ บุชชิ่ง/ล็อกนัท"><input type="number" style={numStyle} value={csp.bushing} onChange={(e) => setCSpare("bushing", e.target.value)} /></Field>
                <Field label="% เผื่อ รางซี"><input type="number" style={numStyle} value={csp.cchannel} onChange={(e) => setCSpare("cchannel", e.target.value)} /></Field>
                <Field label="% เผื่อ คอนเนคเตอร์"><input type="number" style={numStyle} value={csp.connector} onChange={(e) => setCSpare("connector", e.target.value)} /></Field>
                <Field label="% เผื่อ คุปปิ้ง"><input type="number" style={numStyle} value={csp.coupling} onChange={(e) => setCSpare("coupling", e.target.value)} /></Field>
                {[...new Set((cond.imc || []).map((x) => (x.size || "").trim()).filter(Boolean))].map((sz) => (
                  <Field key={sz} label={"ท่ออ่อน IMC " + sz.replace(/^IMC\s*/i, "") + " (กล่อง)"}><input type="number" style={numStyle} value={(cond.flex || {})[sz] != null ? cond.flex[sz] : 1} onChange={(e) => setFlexSize(sz, e.target.value)} /></Field>
                ))}
              </div>
            )}

            {/* ตั้งค่า uPVC */}
            <button onClick={() => setAdvU((v) => !v)} style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--text-2)", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <Icon name="settings" size={13} color="var(--text-2)" /> ตั้งค่าอุปกรณ์ uPVC (% เผื่อ / ท่ออ่อน) <Icon name="chevronDown" size={14} color="var(--text-2)" style={{ transform: advU ? "rotate(180deg)" : "none" }} />
            </button>
            {advU && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--surface2)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                <Field label="% เผื่อ ข้อต่อตรง"><input type="number" style={numStyle} value={csp.upStraight} onChange={(e) => setCSpare("upStraight", e.target.value)} /></Field>
                <Field label="% เผื่อ แคลมป์ก้ามปู"><input type="number" style={numStyle} value={csp.upClamp} onChange={(e) => setCSpare("upClamp", e.target.value)} /></Field>
                <Field label="% เผื่อ คอนเน็ตเตอร์ uPVC"><input type="number" style={numStyle} value={csp.upConnector} onChange={(e) => setCSpare("upConnector", e.target.value)} /></Field>
                {[...new Set((cond.upvc || []).map((x) => (x.size || "").trim()).filter(Boolean))].map((sz) => (
                  <Field key={sz} label={"ท่ออ่อนขาว " + ((sz.match(/(\d+)\s*mm/) || [])[1] || "") + "mm (กล่อง)"}><input type="number" style={numStyle} value={(cond.upFlex || {})[sz] != null ? cond.upFlex[sz] : 1} onChange={(e) => setUpFlexSize(sz, e.target.value)} /></Field>
                ))}
              </div>
            )}
          </Section>

          {/* ── Accessories ── */}
          <Section title="Accessories (เพิ่มของ)" icon="box">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accList.map((a, i) => {
                const items = a.cat === "พิมพ์เอง" ? [] : (accCat.map[a.cat] || []);
                return (
                  <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 11, padding: 9, display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 36px", gap: 8, alignItems: "center" }}>
                      <Dropdown value={a.cat || ""} onChange={(v) => setAccCat(i, v)}
                        options={[{ value: "", label: "— เลือกหมวด —" }].concat(accCat.cats.map((c) => ({ value: c, label: c }))).concat([{ value: "พิมพ์เอง", label: "✎ พิมพ์เอง" }])} />
                      <button onClick={() => delAcc(i)} title="ลบ" style={{ height: 40, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 8, alignItems: "center" }}>
                      {a.cat === "พิมพ์เอง"
                        ? <input value={a.name} onChange={(e) => setAcc(i, "name", e.target.value)} placeholder="ชื่อวัสดุ" style={inputStyle} />
                        : <Dropdown value={a.name || ""} onChange={(v) => setAcc(i, "name", v)} disabled={!a.cat} options={[{ value: "", label: a.cat ? "— เลือกวัสดุ —" : "เลือกหมวดก่อน" }].concat(items.map((n) => ({ value: n, label: n })))} />}
                      <input type="number" style={numStyle} value={a.qty} placeholder="จำนวน" onChange={(e) => setAcc(i, "qty", e.target.value)} />
                    </div>
                  </div>
                );
              })}
              <button onClick={addAcc} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 5, background: "var(--primary-soft)", color: "var(--primary-dark)", border: "none", borderRadius: 9, padding: "8px 12px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}><Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มของ</button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* เลือกหมวด → เลือกวัสดุ (จากราคาวัสดุ + คลังสินค้า) หรือ "พิมพ์เอง" — ถ้ามีราคาในระบบจะคิดต้นทุนให้</div>
          </Section>

          {/* ── ผลลัพธ์ BOQ ── */}
          <Section title="รายการวัสดุที่ถอดได้" icon="box"
            right={priced.grandTotal > 0 ? <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--primary-dark)" }}>รวม ฿{baht(priced.grandTotal)}</span> : null}>
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {priced.groups.map((g, gi) => (
                <div key={gi}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "var(--surface2)", borderTop: gi ? "1px solid var(--border)" : "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: GROUP_COLOR[g.group] || "var(--text-3)" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-1)", letterSpacing: ".03em" }}>{g.group}</span>
                  </div>
                  {g.items.length === 0 ? (
                    <div style={{ padding: "9px 14px", fontSize: 12, color: "var(--text-3)" }}>—</div>
                  ) : g.items.map((it, ii) => (
                    <div key={ii} style={{ display: "grid", gridTemplateColumns: "1fr 56px 84px", gap: 8, padding: "9px 14px", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12.5, color: "var(--text-1)" }}>{(it.name || "").trim()}</span>
                        {it.code ? <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>{it.code}</span> : null}
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{(Math.round(it.qty * 100) / 100).toLocaleString()}</span>
                        <span style={{ display: "block", fontSize: 10, color: "var(--text-3)" }}>{it.unit}</span>
                      </span>
                      <span style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 700, color: it.total > 0 ? "var(--text-1)" : "var(--text-3)" }}>{it.total > 0 ? baht(it.total) : "–"}</span>
                        {it.price > 0 ? <span style={{ display: "block", fontSize: 9.5, color: "var(--text-3)" }}>@{baht(it.price)}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              {priced.grandTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: "var(--surface2)", borderTop: "2px solid var(--border-strong)" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>ต้นทุนรวม</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: "var(--primary-dark)" }}>฿{baht(priced.grandTotal)}</span>
                </div>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>* ราคาดึงจากเมนู "ราคาวัสดุ" — รายการที่ยังไม่ใส่ราคาจะขึ้น "–"</div>
          </Section>
        </div>

        {/* footer */}
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          <button onClick={() => guardRun(exportXlsx)} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid #1d854b", background: "#22A35B14", color: "#1d854b", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="box" size={15} color="#1d854b" /> Excel</button>
          {onSave && <button onClick={() => guardRun(() => onSave(b))} style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก BOQ</button>}
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
