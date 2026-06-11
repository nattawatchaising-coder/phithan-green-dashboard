/* ============================================================
   PHITHAN GREEN — จัดการราคาวัสดุ BOQ (รหัส + ราคา/หน่วย)
   + เพิ่มวัสดุเอง (Accessories) + เชื่อมคลังสินค้า
   แสดงแบบ inline panel (แท็บในหน้าคลังสินค้า)
   ============================================================ */

const PRICE_GROUP_TH = { all: "ทั้งหมด", "PV MODULE": "แผง", INVERTER: "อินเวอร์เตอร์", MOUNTING: "อุปกรณ์ mounting", CABLE: "สายไฟ", "RACE WAY": "ท่อร้อยสาย", GROUNDING: "กราวด์", ACCESSORIES: "Accessories" };
const PRICE_GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207", ACCESSORIES: "#EC4899" };

function PricePanel({ priceStore, stock, q = "", grp = "all" }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const baseCat = React.useMemo(() => window.BOQ.catalog(), []);
  const catKeys = React.useMemo(() => new Set(baseCat.map((c) => c.name)), [baseCat]);
  const stockItems = (stock && stock.items) || [];
  const stockByName = React.useMemo(() => { const m = {}; stockItems.forEach((s) => { m[s.name] = s; }); return m; }, [stockItems]);

  // รวม: catalog + วัสดุที่เพิ่มเอง (อยู่ใน priceMap แต่ไม่อยู่ใน catalog)
  const custom = Object.keys(priceStore.priceMap).filter((n) => !catKeys.has(n))
    .map((n) => ({ group: priceStore.priceMap[n].group || "ACCESSORIES", name: n, unit: priceStore.priceMap[n].unit || "", custom: true }));
  const cat = baseCat.concat(custom);

  const seeded = React.useRef(false);
  const initLocal = () => { const m = {}; cat.forEach((c) => { const r = priceStore.priceMap[c.name] || {}; m[c.name] = { code: r.code || "", price: r.price != null ? r.price : "" }; }); return m; };
  const [local, setLocal] = React.useState(initLocal);
  React.useEffect(() => {
    if (seeded.current) return;
    if (Object.keys(priceStore.priceMap).length === 0) return;
    setLocal(initLocal()); seeded.current = true;
  }, [priceStore.priceMap]);

  const set = (name, k, v) => setLocal((p) => Object.assign({}, p, { [name]: Object.assign({}, p[name], { [k]: v }) }));

  const filtered = cat.filter((c) => {
    if (grp !== "all" && c.group !== grp) return false;
    if (q) { const l = local[c.name] || {}; if (!((c.name + " " + (l.code || "")).toLowerCase().includes(q.toLowerCase()))) return false; }
    return true;
  });
  const isDirty = (c) => { const r = priceStore.priceMap[c.name] || {}; const l = local[c.name] || {}; return (l.code || "") !== (r.code || "") || (+l.price || 0) !== (+r.price || 0); };
  const dirtyCount = cat.filter(isDirty).length;
  const pricedCount = cat.filter((c) => { const l = local[c.name] || {}; return +l.price > 0; }).length;
  const saveAll = () => { cat.forEach((c) => { if (isDirty(c)) { const l = local[c.name] || {}; priceStore.setPrice(c.name, l.code, l.price, c.unit, c.custom ? "ACCESSORIES" : ""); } }); };

  const inStyle = Object.assign({}, inputStyle, { padding: "7px 9px", fontSize: 12.5 });
  const numStyle = Object.assign({}, inStyle, { textAlign: "right" });

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
      {/* toolbar: ตัวนับ (ค้นหา/หมวด/เพิ่มวัสดุ ย้ายไปอยู่บน header) */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)", fontSize: 11.5, color: "var(--text-3)" }}>ใส่ราคาแล้ว {pricedCount}/{cat.length} รายการ{dirtyCount > 0 && <span style={{ color: "#F59E0B", fontWeight: 700 }}> · ยังไม่บันทึก {dirtyCount}</span>}</div>

      {/* list */}
      <div style={{ padding: "8px 12px" }}>
        {filtered.map((c) => {
          const l = local[c.name] || { code: "", price: "" };
          const dirty = isDirty(c);
          return (
            <div key={c.name} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 150px 110px 34px", gap: isMobile ? 8 : 10, alignItems: "center", padding: "7px 8px", borderRadius: 9, background: dirty ? "#FEF9EC" : "transparent", borderBottom: "1px solid var(--border)" }}>
              <div style={{ gridColumn: isMobile ? "1 / -1" : "auto", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: PRICE_GROUP_COLOR[c.group] || "var(--text-3)", flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  {stockByName[c.name] && <span title="มีในคลังสินค้า" style={{ fontSize: 9.5, fontWeight: 700, color: "#1d854b", background: "#22A35B16", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>คลัง</span>}
                </div>
                <span style={{ fontSize: 10.5, color: "var(--text-3)", marginLeft: 12 }}>{(PRICE_GROUP_TH[c.group] || c.group)} · {c.unit || "-"}</span>
              </div>
              <input value={l.code} onChange={(e) => set(c.name, "code", e.target.value)} placeholder="รหัส" style={inStyle} />
              <input type="number" value={l.price} onChange={(e) => set(c.name, "price", e.target.value)} placeholder="0" style={numStyle} />
              {!isMobile && (c.custom
                ? <button onClick={() => { if (confirm("ลบ \"" + c.name + "\" ?")) priceStore.removePrice(c.name); }} title="ลบ" style={{ height: 32, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 8, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                : <span />)}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)" }}>ไม่พบรายการ</div>}
      </div>

      {/* sticky save bar */}
      <div style={{ position: "sticky", bottom: 0, padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, fontSize: 11.5, color: "var(--text-3)" }}>{dirtyCount > 0 ? <span style={{ color: "#F59E0B", fontWeight: 700 }}>ยังไม่บันทึก {dirtyCount} รายการ</span> : "บันทึกครบแล้ว"}</div>
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
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const stockItems = (stock && stock.items) || [];
  const stockByName = React.useMemo(() => { const m = {}; stockItems.forEach((s) => { m[s.name] = s; }); return m; }, [stockItems]);
  const [nf, setNf] = React.useState({ name: "", code: "", price: "", unit: "" });
  const setNF = (k, v) => setNf((p) => { const n = Object.assign({}, p, { [k]: v }); if (k === "name" && stockByName[v]) { n.code = stockByName[v].sku || n.code; n.unit = stockByName[v].unit || n.unit; } return n; });
  const save = () => {
    const name = (nf.name || "").trim();
    if (!name) { alert("กรอกชื่อวัสดุ"); return; }
    priceStore.setPrice(name, nf.code, nf.price, nf.unit, "ACCESSORIES");
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
            <div><label style={label}>รหัส</label><input value={nf.code} onChange={(e) => setNF("code", e.target.value)} placeholder="รหัส" style={inStyle} /></div>
            <div><label style={label}>หน่วย</label><input value={nf.unit} onChange={(e) => setNF("unit", e.target.value)} placeholder="เช่น pcs" style={inStyle} /></div>
          </div>
          <div><label style={label}>ราคา (บาท)</label><input type="number" value={nf.price} onChange={(e) => setNF("price", e.target.value)} placeholder="0" style={Object.assign({}, inStyle, { textAlign: "right" })} /></div>
        </div>
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={save} style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>เพิ่มวัสดุ</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PricePanel, AddPriceModal, PRICE_GROUP_TH, PRICE_GROUP_COLOR });
