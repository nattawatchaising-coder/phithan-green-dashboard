/* ============================================================
   PHITHAN GREEN — จัดการราคาวัสดุ BOQ (รหัส + ราคา/หน่วย)
   + เพิ่มวัสดุเอง (Accessories) + เชื่อมคลังสินค้า
   แสดงแบบ inline panel (แท็บในหน้าคลังสินค้า)
   ============================================================ */

const PRICE_GROUP_TH = { all: "ทั้งหมด", "PV MODULE": "แผง", INVERTER: "อินเวอร์เตอร์", MOUNTING: "อุปกรณ์ mounting", CABLE: "สายไฟ", "RACE WAY": "ท่อร้อยสาย", GROUNDING: "กราวด์", ACCESSORIES: "Accessories" };
const PRICE_GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207", ACCESSORIES: "#EC4899" };

function PricePanel({ priceStore, stock }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const baseCat = React.useMemo(() => window.BOQ.catalog(), []);
  const catKeys = React.useMemo(() => new Set(baseCat.map((c) => c.name)), [baseCat]);
  const stockItems = (stock && stock.items) || [];
  const stockByName = React.useMemo(() => { const m = {}; stockItems.forEach((s) => { m[s.name] = s; }); return m; }, [stockItems]);

  // รวม: catalog + วัสดุที่เพิ่มเอง (อยู่ใน priceMap แต่ไม่อยู่ใน catalog)
  const custom = Object.keys(priceStore.priceMap).filter((n) => !catKeys.has(n))
    .map((n) => ({ group: priceStore.priceMap[n].group || "ACCESSORIES", name: n, unit: priceStore.priceMap[n].unit || "", custom: true }));
  const cat = baseCat.concat(custom);

  const [q, setQ] = React.useState("");
  const [grp, setGrp] = React.useState("all");
  const seeded = React.useRef(false);
  const initLocal = () => { const m = {}; cat.forEach((c) => { const r = priceStore.priceMap[c.name] || {}; m[c.name] = { code: r.code || "", price: r.price != null ? r.price : "" }; }); return m; };
  const [local, setLocal] = React.useState(initLocal);
  React.useEffect(() => {
    if (seeded.current) return;
    if (Object.keys(priceStore.priceMap).length === 0) return;
    setLocal(initLocal()); seeded.current = true;
  }, [priceStore.priceMap]);

  const set = (name, k, v) => setLocal((p) => Object.assign({}, p, { [name]: Object.assign({}, p[name], { [k]: v }) }));
  const groups = ["all"].concat([...new Set(cat.map((c) => c.group))]);
  if (!groups.includes("ACCESSORIES")) groups.push("ACCESSORIES"); // แสดงหมวด Accessories เสมอ

  // ── ฟอร์มเพิ่มวัสดุเอง ──
  const [nf, setNf] = React.useState({ name: "", code: "", price: "", unit: "" });
  const setNF = (k, v) => setNf((p) => { const n = Object.assign({}, p, { [k]: v }); if (k === "name" && stockByName[v]) { n.code = stockByName[v].sku || n.code; n.unit = stockByName[v].unit || n.unit; } return n; });
  const addItem = () => {
    const name = (nf.name || "").trim();
    if (!name) { alert("กรอกชื่อวัสดุ"); return; }
    priceStore.setPrice(name, nf.code, nf.price, nf.unit, "ACCESSORIES");
    setNf({ name: "", code: "", price: "", unit: "" });
  };

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
      {/* toolbar: นับ + ค้นหา + หมวด + เพิ่มวัสดุ */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
        <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 10 }}>ใส่ราคาแล้ว {pricedCount}/{cat.length} รายการ{dirtyCount > 0 && <span style={{ color: "#F59E0B", fontWeight: 700 }}> · ยังไม่บันทึก {dirtyCount}</span>}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-box" style={{ flex: 1, minWidth: 160 }}>
            <Icon name="search" size={15} color="var(--text-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / รหัส..." />
          </div>
          <div style={{ minWidth: 150 }}>
            <Dropdown value={grp} onChange={setGrp} options={groups.map((g) => ({ value: g, label: PRICE_GROUP_TH[g] || g }))} />
          </div>
        </div>
        {/* เพิ่มวัสดุเอง */}
        <datalist id="pm-stock-names">{stockItems.map((s) => <option key={s.id || s.name} value={s.name} />)}</datalist>
        <div style={{ marginTop: 10, padding: 10, background: "var(--surface)", borderRadius: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 130px 90px 64px", gap: 8, alignItems: "center" }}>
          <input list="pm-stock-names" value={nf.name} onChange={(e) => setNF("name", e.target.value)} placeholder="+ เพิ่มวัสดุ / เลือกจากคลัง" style={Object.assign({}, inStyle, isMobile ? { gridColumn: "1 / -1" } : {})} />
          <input value={nf.code} onChange={(e) => setNF("code", e.target.value)} placeholder="รหัส" style={inStyle} />
          <input type="number" value={nf.price} onChange={(e) => setNF("price", e.target.value)} placeholder="ราคา" style={numStyle} />
          <input value={nf.unit} onChange={(e) => setNF("unit", e.target.value)} placeholder="หน่วย" style={inStyle} />
          <button onClick={addItem} style={{ gridColumn: isMobile ? "1 / -1" : "auto", padding: "8px 12px", borderRadius: 9, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>+ เพิ่ม</button>
        </div>
      </div>

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

Object.assign(window, { PricePanel });
