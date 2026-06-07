/* ============================================================
   SolarFlow — Inventory / Stock view (built-in stock control)
   ============================================================ */

function lowState(it) {
  if (it.qty <= 0) return "out";
  if (it.qty <= it.min) return "low";
  return "ok";
}
const STOCK_COLORS = { out: "#EF4444", low: "#F59E0B", ok: "#22A35B" };

function StockKpi({ label, value, unit, icon, accent, sub, active, onClick }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: active ? accent + "0e" : "var(--surface)",
        border: "1px solid " + (active || hov ? accent : "var(--border)"),
        borderRadius: 16, padding: 18,
        boxShadow: active ? "0 0 0 3px " + accent + "22" : hov ? "0 4px 12px rgba(0,0,0,.08)" : "var(--shadow-sm)",
        position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        transition: "transform .14s, border-color .14s, box-shadow .14s, background .14s" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap" }}>{label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: accent + "16", display: "grid", placeItems: "center" }}><Icon name={icon} size={16} color={accent} /></span>
      </div>
      <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>{unit}</span>}
      </div>
      {sub && <div style={{ marginTop: 7, fontSize: 11.5, color: "var(--text-3)" }}>{sub}</div>}
    </div>
  );
}

function StockView({ stock, onResetAll }) {
  const SF = window.SF;
  const [cat, setCat] = React.useState("all");
  const [kpiFilter, setKpiFilter] = React.useState(null); // null | 'low' | 'in' | 'out'
  const [search, setSearch] = React.useState("");
  const [moveItem, setMoveItem] = React.useState(null); // {item, type}
  const [itemForm, setItemForm] = React.useState(null); // {item, isNew}

  const items = stock.items;
  const lowCount = items.filter((it) => lowState(it) !== "ok").length;
  const thisMonth = SF.TODAY.slice(0, 7);
  const inItemIds = new Set(stock.moves.filter((m) => m.type === "in" && m.date.startsWith(thisMonth)).map((m) => m.itemId));
  const outItemIds = new Set(stock.moves.filter((m) => m.type === "out" && m.date.startsWith(thisMonth)).map((m) => m.itemId));
  const inMonth = stock.moves.filter((m) => m.type === "in" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);
  const outMonth = stock.moves.filter((m) => m.type === "out" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);

  const filtered = items.filter((it) => {
    if (cat !== "all" && it.cat !== cat) return false;
    if (search && !((it.name + it.sku + it.loc).toLowerCase().includes(search.toLowerCase()))) return false;
    if (kpiFilter === "low" && lowState(it) === "ok") return false;
    if (kpiFilter === "in" && !inItemIds.has(it.id)) return false;
    if (kpiFilter === "out" && !outItemIds.has(it.id)) return false;
    return true;
  });

  return (
    <React.Fragment>
      <header className="app-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">คลังสินค้า / สต็อก</h1>
            <p className="page-sub">อุปกรณ์ติดตั้ง <strong>{filtered.length}</strong> จาก {items.length} รายการ
              {kpiFilter && <span> · <span style={{ color: "#F59E0B", fontWeight: 700 }}>กรอง: {
                kpiFilter === "low" ? "ใกล้หมด" : kpiFilter === "in" ? "รับเข้าเดือนนี้" : "เบิกออกเดือนนี้"
              }</span> <button onClick={() => setKpiFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
              {!kpiFilter && lowCount > 0 && <span> · <span style={{ color: "#F59E0B", fontWeight: 700 }}>{lowCount} รายการใกล้หมด</span></span>}
            </p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Icon name="search" size={16} color="var(--text-3)" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาอุปกรณ์ / รหัส / ที่จัดเก็บ..." />
            </div>
            <button className="btn-add" onClick={() => setItemForm({ item: stock.blankItem(), isNew: true })}>
              <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มรายการ</span>
            </button>
          </div>
        </div>
        <div className="header-filters">
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            <CatChip active={cat === "all"} onClick={() => setCat("all")} label="ทั้งหมด" color="var(--text-2)" />
            {SF.STOCK_CATS.map((c) => <CatChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.th} color={c.color} />)}
          </div>
          <div style={{ flex: 1 }} />
          <button className="ghost-btn" onClick={onResetAll} title="คืนค่าสต็อกตัวอย่าง">
            <Icon name="history" size={15} color="var(--text-3)" /> รีเซ็ตสต็อก
          </button>
        </div>
      </header>

      <div className="app-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          <StockKpi label="รายการทั้งหมด" value={items.length} unit="ชนิด" icon="box" accent="#3B82F6" sub="ชนิดอุปกรณ์ในคลัง" active={kpiFilter===null} onClick={() => setKpiFilter(null)} />
          <StockKpi label="ใกล้หมด / ต่ำกว่าขั้นต่ำ" value={lowCount} unit="รายการ" icon="alert" accent="#F59E0B" sub="ควรสั่งเพิ่ม" active={kpiFilter==="low"} onClick={() => setKpiFilter(f => f==="low" ? null : "low")} />
          <StockKpi label="รับเข้าเดือนนี้" value={inMonth} unit="ชิ้น" icon="arrowRight" accent="#22A35B" sub={inItemIds.size + " รายการ"} active={kpiFilter==="in"} onClick={() => setKpiFilter(f => f==="in" ? null : "in")} />
          <StockKpi label="เบิกออกเดือนนี้" value={outMonth} unit="ชิ้น" icon="wrench" accent="#7C5CFC" sub={outItemIds.size + " รายการ"} active={kpiFilter==="out"} onClick={() => setKpiFilter(f => f==="out" ? null : "out")} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 18, alignItems: "start" }}>
          {/* stock table */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["รายการอุปกรณ์", "หมวด", "คงเหลือ", "ขั้นต่ำ", "ที่จัดเก็บ", "จัดการ"].map((h, i) => (
                      <th key={h} style={{ padding: "12px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
                        color: "var(--text-3)", textAlign: i >= 2 && i <= 3 ? "center" : "left", whiteSpace: "nowrap", background: "var(--surface2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => {
                    const c = SF.STOCK_CAT_BY[it.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
                    const st = lowState(it);
                    return (
                      <tr key={it.id} style={{ borderBottom: "1px solid var(--border)", background: st === "out" ? "#FEF6F6" : "transparent" }}>
                        <td style={{ padding: "11px 12px" }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{it.name}</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{it.sku}</div>
                        </td>
                        <td style={{ padding: "11px 12px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, color: c.color, background: c.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>
                            <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color }} />{c.th}
                          </span>
                        </td>
                        <td style={{ padding: "11px 12px", textAlign: "center" }}>
                          <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: STOCK_COLORS[st] }}>{it.qty.toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 3 }}>{it.unit}</span>
                          {st !== "ok" && <div style={{ fontSize: 10, fontWeight: 700, color: STOCK_COLORS[st] }}>{st === "out" ? "⚠ หมดสต็อก" : "⚠ ใกล้หมด"}</div>}
                        </td>
                        <td style={{ padding: "11px 12px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-2)" }}>{it.min.toLocaleString()}</td>
                        <td style={{ padding: "11px 12px", fontSize: 12.5, color: "var(--text-2)", whiteSpace: "nowrap" }}>{it.loc}</td>
                        <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                          <button onClick={() => setMoveItem({ item: it, type: "in" })} title="รับเข้า"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#22A35B16", border: "none", color: "#1d854b", fontWeight: 700, fontSize: 11.5, padding: "5px 9px", borderRadius: 8, cursor: "pointer", marginRight: 4, fontFamily: "inherit" }}>+ รับ</button>
                          <button onClick={() => setMoveItem({ item: it, type: "out" })} title="เบิกออก"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#7C5CFC16", border: "none", color: "#6645e0", fontWeight: 700, fontSize: 11.5, padding: "5px 9px", borderRadius: 8, cursor: "pointer", marginRight: 4, fontFamily: "inherit" }}>− เบิก</button>
                          <button onClick={() => setItemForm({ item: it, isNew: false })} title="แก้ไข" style={{ background: "#3B82F614", border: "none", color: "#3B82F6", width: 28, height: 28, borderRadius: 7, cursor: "pointer", verticalAlign: "middle" }}><Icon name="settings" size={14} /></button>
                          <button onClick={() => { if (confirm("ลบ \"" + it.name + "\" ?")) stock.removeItem(it.id); }} title="ลบ" style={{ background: "#EF444414", border: "none", color: "#EF4444", width: 28, height: 28, borderRadius: 7, cursor: "pointer", marginLeft: 4, verticalAlign: "middle" }}><Icon name="x" size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: 44, textAlign: "center", color: "var(--text-3)" }}>ไม่พบรายการอุปกรณ์</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* ledger */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <PanelTitle icon="history" title="ความเคลื่อนไหวล่าสุด" sub="รับเข้า / เบิกออก" />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
              {stock.moves.slice(0, 30).map((m) => {
                const it = items.find((x) => x.id === m.itemId);
                const isIn = m.type === "in";
                return (
                  <div key={m.id} style={{ display: "flex", gap: 11, padding: "10px 11px", border: "1px solid var(--border)", borderRadius: 11 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
                      background: isIn ? "#22A35B16" : "#7C5CFC16", color: isIn ? "#1d854b" : "#6645e0", fontWeight: 800, fontSize: 15 }}>{isIn ? "+" : "−"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it ? it.name : m.itemId}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                        {isIn ? "รับเข้า" : "เบิกออก"} <strong style={{ color: isIn ? "#1d854b" : "#6645e0" }}>{m.qty}</strong> · {thDate(m.date)} · <span style={{ fontFamily: "var(--mono)" }}>{m.ref}</span>
                      </div>
                      {m.note && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontStyle: "italic" }}>{m.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {moveItem && <MoveModal info={moveItem} onSave={(qty, ref, note) => { stock.move(moveItem.item.id, moveItem.type, qty, ref, note); setMoveItem(null); }} onClose={() => setMoveItem(null)} />}
      {itemForm && <ItemModal initial={itemForm.item} isNew={itemForm.isNew} onSave={(rec) => { stock.upsertItem(rec); setItemForm(null); }} onClose={() => setItemForm(null)} />}
    </React.Fragment>
  );
}

function CatChip({ active, onClick, label, color }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 99,
      border: "1px solid " + (active ? color : "var(--border-strong)"), background: active ? color + "16" : "var(--surface)",
      color: active ? color : "var(--text-2)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

function MoveModal({ info, onSave, onClose }) {
  const isIn = info.type === "in";
  const [qty, setQty] = React.useState("");
  const [ref, setRef] = React.useState("");
  const [note, setNote] = React.useState("");
  const accent = isIn ? "#22A35B" : "#7C5CFC";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 100, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 18, width: "min(440px,100%)", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", background: accent, color: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: .9 }}>{isIn ? "รับเข้าคลัง" : "เบิกออกหน้างาน"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{info.item.name}</div>
          <div style={{ fontSize: 12.5, opacity: .85, marginTop: 3 }}>คงเหลือปัจจุบัน {info.item.qty.toLocaleString()} {info.item.unit}</div>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label={"จำนวน (" + info.item.unit + ")"} required>
            <input type="number" autoFocus value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
          </Field>
          <Field label={isIn ? "อ้างอิง (เลข PO / ผู้ขาย)" : "อ้างอิงงาน (รหัสงาน)"}>
            <input value={ref} onChange={(e) => setRef(e.target.value)} style={inputStyle} placeholder={isIn ? "เช่น PO-2406" : "เช่น SF-2401"} />
          </Field>
          <Field label="หมายเหตุ">
            <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => { if (!(parseInt(qty) > 0)) { alert("กรุณากรอกจำนวน"); return; } onSave(qty, ref, note); }}
            style={{ padding: "10px 22px", borderRadius: 11, border: "none", background: accent, color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>
            {isIn ? "+ รับเข้า" : "− เบิกออก"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ initial, isNew, onSave, onClose }) {
  const SF = window.SF;
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 100, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 18, width: "min(560px,100%)", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มรายการอุปกรณ์" : "แก้ไขรายการ"}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="ชื่ออุปกรณ์" required><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น แผงโซล่า Longi 550W" /></Field></div>
          <Field label="รหัสสินค้า (SKU)"><input style={inputStyle} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="PNL-LR550" /></Field>
          <Field label="หมวดหมู่">
            <select style={inputStyle} value={f.cat} onChange={(e) => set("cat", e.target.value)}>
              {SF.STOCK_CATS.map((c) => <option key={c.key} value={c.key}>{c.th}</option>)}
            </select>
          </Field>
          <Field label="จำนวนคงเหลือ"><input type="number" style={inputStyle} value={f.qty} onChange={(e) => set("qty", parseInt(e.target.value) || 0)} /></Field>
          <Field label="หน่วยนับ"><input style={inputStyle} value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="แผง / ตัว / ม้วน" /></Field>
          <Field label="ขั้นต่ำ (แจ้งเตือน)"><input type="number" style={inputStyle} value={f.min} onChange={(e) => set("min", parseInt(e.target.value) || 0)} /></Field>
          <Field label="ที่จัดเก็บ"><input style={inputStyle} value={f.loc} onChange={(e) => set("loc", e.target.value)} placeholder="คลัง A-01" /></Field>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => { if (!f.name.trim()) { alert("กรุณากรอกชื่ออุปกรณ์"); return; } onSave(f); }}
            style={{ padding: "10px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StockView });
