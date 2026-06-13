/* ============================================================
   PHITHAN GREEN — จัดการราคาวัสดุ BOQ (รหัส + ราคา/หน่วย)
   + เพิ่มวัสดุเอง (Accessories) + เชื่อมคลังสินค้า
   แสดงแบบ inline panel (แท็บในหน้าคลังสินค้า)
   ============================================================ */

const PRICE_GROUP_TH = { all: "ทั้งหมด", "PV MODULE": "แผง", INVERTER: "อินเวอร์เตอร์", MOUNTING: "อุปกรณ์ mounting", CABLE: "สายไฟ", "RACE WAY": "ท่อร้อยสาย", GROUNDING: "กราวด์", ACCESSORIES: "Accessories" };
const PRICE_GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207", ACCESSORIES: "#EC4899" };

const CAT_TO_GROUP = { panel: "PV MODULE", inverter: "INVERTER", battery: "INVERTER", structure: "MOUNTING", wiring: "CABLE", accessory: "ACCESSORIES", other: "ACCESSORIES" };

function PricePanel({ priceStore, stock, q = "", grp = "all" }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const baseCat = React.useMemo(() => window.BOQ.catalog(), []);
  const catKeys = React.useMemo(() => new Set(baseCat.map((c) => c.name)), [baseCat]);
  const stockItems = (stock && stock.items) || [];
  const stockByName = React.useMemo(() => { const m = {}; stockItems.forEach((s) => { m[s.name] = s; }); return m; }, [stockItems]);

  // รายการวัสดุ = catalog (BOQ) + ของในคลังที่ไม่อยู่ใน catalog + ของเก่าใน boqPrices
  const cat = React.useMemo(() => {
    const seen = new Set(baseCat.map((c) => c.name));
    const extra = [];
    stockItems.forEach((s) => { if (s.name && !seen.has(s.name)) { seen.add(s.name); extra.push({ group: CAT_TO_GROUP[s.cat] || "ACCESSORIES", name: s.name, unit: s.unit || "", fromStock: true }); } });
    Object.keys(priceStore.priceMap).forEach((n) => { if (!seen.has(n)) { seen.add(n); extra.push({ group: priceStore.priceMap[n].group || "ACCESSORIES", name: n, unit: priceStore.priceMap[n].unit || "", custom: true }); } });
    return baseCat.concat(extra);
  }, [baseCat, stockItems, priceStore.priceMap]);

  // ค่าปัจจุบัน (คลังเป็นต้นทางหลัก, ตกไปที่ boqPrices ของเก่า)
  const curOf = (name) => { const s = stockByName[name]; if (s) return { code: s.sku || "", price: s.price != null ? s.price : "" }; const r = priceStore.priceMap[name] || {}; return { code: r.code || "", price: r.price != null ? r.price : "" }; };
  const [local, setLocal] = React.useState({}); // เฉพาะแถวที่แก้
  const valOf = (name) => local[name] || curOf(name);
  const set = (name, k, v) => setLocal((p) => Object.assign({}, p, { [name]: Object.assign({}, valOf(name), { [k]: v }) }));

  const filtered = cat.filter((c) => {
    if (grp !== "all" && c.group !== grp) return false;
    if (q) { const l = valOf(c.name); if (!((c.name + " " + (l.code || "")).toLowerCase().includes(q.toLowerCase()))) return false; }
    return true;
  });
  const isDirty = (c) => { if (!local[c.name]) return false; const r = curOf(c.name); const l = local[c.name]; return (l.code || "") !== (r.code || "") || (+l.price || 0) !== (+r.price || 0); };
  const dirtyCount = cat.filter(isDirty).length;
  const pricedCount = cat.filter((c) => +valOf(c.name).price > 0).length;
  const newItems = cat.filter((c) => !stockByName[c.name]);
  const newCount = newItems.length;

  // บันทึก → เขียนลง "คลังสินค้า" (ต้นทางเดียว); สร้าง record ใหม่ถ้ายังไม่มี + auto-gen รหัส
  const saveAll = () => {
    let maxId = 0;
    stockItems.forEach((it) => { const n = parseInt(String(it.id || "").replace(/\D/g, ""), 10); if (!isNaN(n) && n > maxId) maxId = n; });
    const usedCodes = stockItems.map((s) => s.sku).filter(Boolean);
    cat.forEach((c) => {
      if (!isDirty(c)) return;
      const l = local[c.name];
      const existing = stockByName[c.name];
      const catKey = existing ? existing.cat : (SF.BOQ_GROUP_TO_CAT[c.group] || "other");
      let code = String(l.code || "").trim();
      if (!code) code = (existing && existing.sku) || SF.genMatCode(catKey, stockItems, usedCodes);
      usedCodes.push(code);
      if (existing) {
        stock.upsertItem(Object.assign({}, existing, { sku: code, price: +l.price || 0, unit: existing.unit || c.unit || "" }));
      } else {
        maxId += 1;
        stock.upsertItem({ id: "IV-" + String(maxId).padStart(2, "0"), name: c.name, sku: code, cat: catKey, unit: c.unit || "", qty: 0, min: 0, loc: "", price: +l.price || 0 });
      }
    });
    setLocal({});
  };

  // เพิ่มทุกรายการที่ยังไม่มีในคลัง → สร้าง record (qty 0) + รหัสอัตโนมัติตามหมวด
  const addAllNew = () => {
    if (!newCount) return;
    if (!confirm("เพิ่ม " + newCount + " รายการที่ยังไม่มีในคลังสินค้า\n(จำนวน 0 · สร้างรหัสอัตโนมัติตามหมวด · ราคาที่กรอกไว้จะถูกบันทึกด้วย)")) return;
    let maxId = 0;
    stockItems.forEach((it) => { const n = parseInt(String(it.id || "").replace(/\D/g, ""), 10); if (!isNaN(n) && n > maxId) maxId = n; });
    const usedCodes = stockItems.map((s) => s.sku).filter(Boolean);
    newItems.forEach((c) => {
      const l = local[c.name] || {};
      const catKey = SF.BOQ_GROUP_TO_CAT[c.group] || "other";
      let code = String(l.code || "").trim();
      if (!code) code = SF.genMatCode(catKey, stockItems, usedCodes);
      usedCodes.push(code);
      maxId += 1;
      stock.upsertItem({ id: "IV-" + String(maxId).padStart(2, "0"), name: c.name, sku: code, cat: catKey, unit: c.unit || "", qty: 0, min: 0, loc: "", price: +l.price || 0 });
    });
    setLocal({});
  };

  const inStyle = Object.assign({}, inputStyle, { padding: "7px 9px", fontSize: 12.5 });
  const numStyle = Object.assign({}, inStyle, { textAlign: "right" });

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
      {/* toolbar: ตัวนับ (ค้นหา/หมวด/เพิ่มวัสดุ ย้ายไปอยู่บน header) */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)", fontSize: 11.5, color: "var(--text-3)" }}>ใส่ราคาแล้ว {pricedCount}/{cat.length} รายการ · บันทึกลงคลังสินค้า{dirtyCount > 0 && <span style={{ color: "#F59E0B", fontWeight: 700 }}> · ยังไม่บันทึก {dirtyCount}</span>}</div>

      {/* list */}
      <div style={{ padding: "8px 12px" }}>
        {filtered.map((c) => {
          const l = valOf(c.name);
          const dirty = isDirty(c);
          const inStock = !!stockByName[c.name];
          return (
            <div key={c.name} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 150px 110px 34px", gap: isMobile ? 8 : 10, alignItems: "center", padding: "7px 8px", borderRadius: 9, background: dirty ? "#FEF9EC" : "transparent", borderBottom: "1px solid var(--border)" }}>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: PRICE_GROUP_COLOR[c.group] || "var(--text-3)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  {inStock
                    ? <span title="มีในคลังสินค้า" style={{ fontSize: 9.5, fontWeight: 700, color: "#1d854b", background: "#22A35B16", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>คลัง</span>
                    : <span title="ยังไม่มีในคลัง — บันทึกแล้วจะสร้างให้" style={{ fontSize: 9.5, fontWeight: 700, color: "#92600B", background: "#F59E0B1f", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>ใหม่</span>}
                </div>
                <span style={{ fontSize: 10.5, color: "var(--text-3)", marginLeft: 12 }}>{(PRICE_GROUP_TH[c.group] || c.group)} · {c.unit || "-"}</span>
              </div>
              <input value={l.code} onChange={(e) => set(c.name, "code", e.target.value)} placeholder="รหัส (auto)" style={inStyle} />
              <input type="number" value={l.price} onChange={(e) => set(c.name, "price", e.target.value)} placeholder="0" style={numStyle} />
              {!isMobile && (c.custom && !inStock
                ? <button onClick={() => { if (confirm("ลบ \"" + c.name + "\" ?")) priceStore.removePrice(c.name); }} title="ลบ" style={{ height: 32, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                : <span />)}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)" }}>ไม่พบรายการ</div>}
      </div>

      {/* sticky save bar */}
      <div style={{ position: "sticky", bottom: 0, padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, fontSize: 11.5, color: "var(--text-3)" }}>{newCount > 0 ? <span>มี <b style={{ color: "#92600B" }}>{newCount}</b> รายการยังไม่อยู่ในคลัง</span> : (dirtyCount > 0 ? <span style={{ color: "#F59E0B", fontWeight: 700 }}>ยังไม่บันทึก {dirtyCount} รายการ</span> : "บันทึกครบแล้ว")}</div>
        {newCount > 0 && (
          <button onClick={addAllNew}
            style={{ flex: "0 0 auto", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--primary)", background: "var(--surface)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="plus" size={14} /> เพิ่มทั้งหมดลงคลัง ({newCount})
          </button>
        )}
        <button onClick={saveAll} disabled={dirtyCount === 0}
          style={{ flex: "0 0 auto", padding: "11px 26px", borderRadius: 11, border: "none", background: dirtyCount ? "var(--primary)" : "var(--surface3)", color: dirtyCount ? "#fff" : "var(--text-3)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: dirtyCount ? "pointer" : "default" }}>
          บันทึกราคา{dirtyCount > 0 ? " (" + dirtyCount + ")" : ""}
        </button>
      </div>
    </div>
  );
}

/* ── Popup เพิ่มวัสดุ (Accessories) — เปิดจากปุ่มบน header ── */
function AddPriceModal({ priceStore, stock, onClose }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const stockItems = (stock && stock.items) || [];
  const stockByName = React.useMemo(() => { const m = {}; stockItems.forEach((s) => { m[s.name] = s; }); return m; }, [stockItems]);
  const [nf, setNf] = React.useState({ name: "", code: "", price: "", unit: "", cat: "accessory" });
  const setNF = (k, v) => setNf((p) => { const n = Object.assign({}, p, { [k]: v }); if (k === "name" && stockByName[v]) { const s = stockByName[v]; n.code = s.sku || n.code; n.unit = s.unit || n.unit; n.cat = s.cat || n.cat; if (s.price != null && n.price === "") n.price = s.price; } return n; });
  const suggestCode = SF.genMatCode(nf.cat, stockItems);
  const save = () => {
    const name = (nf.name || "").trim();
    if (!name) { alert("กรอกชื่อวัสดุ"); return; }
    const code = String(nf.code || "").trim() || suggestCode;
    const existing = stockByName[name];
    if (existing) {
      stock.upsertItem(Object.assign({}, existing, { sku: code, price: +nf.price || 0, unit: nf.unit || existing.unit || "", cat: nf.cat || existing.cat }));
    } else {
      let maxId = 0;
      stockItems.forEach((it) => { const m = parseInt(String(it.id || "").replace(/\D/g, ""), 10); if (!isNaN(m) && m > maxId) maxId = m; });
      stock.upsertItem({ id: "IV-" + String(maxId + 1).padStart(2, "0"), name: name, sku: code, cat: nf.cat || "accessory", unit: nf.unit || "", qty: 0, min: 0, loc: "", price: +nf.price || 0 });
    }
    onClose();
  };
  const inStyle = Object.assign({}, inputStyle, { padding: "10px 12px", fontSize: 13.5 });
  const label = { fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 115, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(440px,100%)", maxHeight: isMobile ? "92dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>เพิ่มวัสดุ</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <datalist id="ap-stock-names">{stockItems.map((s) => <option key={s.id || s.name} value={s.name} />)}</datalist>
          <div>
            <label style={label}>ชื่อวัสดุ / เลือกจากคลัง</label>
            <input list="ap-stock-names" value={nf.name} onChange={(e) => setNF("name", e.target.value)} placeholder="พิมพ์ชื่อ หรือเลือกจากคลัง" style={inStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={label}>หมวดหมู่</label>
              <select value={nf.cat} onChange={(e) => setNF("cat", e.target.value)} style={inStyle}>
                {(SF.STOCK_CATS || []).map((c) => <option key={c.key} value={c.key}>{c.th}</option>)}
              </select>
            </div>
            <div><label style={label}>หน่วย</label><input value={nf.unit} onChange={(e) => setNF("unit", e.target.value)} placeholder="เช่น pcs" style={inStyle} /></div>
          </div>
          <div>
            <label style={label}>รหัสวัสดุ (mat code)</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={nf.code} onChange={(e) => setNF("code", e.target.value)} placeholder={suggestCode + " (อัตโนมัติ)"} style={Object.assign({}, inStyle, { flex: 1 })} />
              <button type="button" onClick={() => setNF("code", suggestCode)} style={{ flexShrink: 0, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>auto</button>
            </div>
          </div>
          <div><label style={label}>ราคา (บาท)</label><input type="number" value={nf.price} onChange={(e) => setNF("price", e.target.value)} placeholder="0" style={Object.assign({}, inStyle, { textAlign: "right" })} /></div>
        </div>
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={save} style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>เพิ่มลงคลัง</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PricePanel, AddPriceModal, PRICE_GROUP_TH, PRICE_GROUP_COLOR });
