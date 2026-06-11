/* ============================================================
   SolarFlow — Inventory / Stock view (built-in stock control)
   ============================================================ */

function lowState(it) {
  if (it.qty <= 0) return "out";
  if (it.qty <= it.min) return "low";
  return "ok";
}
const STOCK_COLORS = { out: "#EF4444", low: "#F59E0B", ok: "#22A35B" };

/* ประเภทการเคลื่อนไหวสต็อก: รับเข้า / เบิกออก / คืนของ */
const MOVE_TYPES = {
  in:     { key: "in",     label: "รับเข้า",  sym: "+", color: "#1d854b", accent: "#22A35B", bg: "#22A35B16", title: "รับเข้าคลัง",      sub: "เพิ่มสต็อกจากการสั่งซื้อ" },
  out:    { key: "out",    label: "เบิกออก",  sym: "−", color: "#6645e0", accent: "#7C5CFC", bg: "#7C5CFC16", title: "เบิกออกหน้างาน",   sub: "เลือกงานที่นำไปใช้" },
  return: { key: "return", label: "คืนของ",  sym: "↩", color: "#0784b8", accent: "#0EA5E9", bg: "#0EA5E916", title: "คืนของเข้าคลัง",   sub: "คืนอุปกรณ์ที่เบิกจากงาน" },
};

function StockKpi({ label, value, unit, icon, accent, sub, active, onClick }) {
  const [hov, setHov] = React.useState(false);
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: active ? accent + "0e" : "var(--surface)",
        border: "1px solid " + (active || hov ? accent : "var(--border)"),
        borderRadius: mob ? 14 : 16, padding: mob ? 14 : 18,
        boxShadow: active ? "0 0 0 3px " + accent + "22" : hov ? "0 4px 12px rgba(0,0,0,.08)" : "var(--shadow-sm)",
        position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
        transform: hov && onClick ? "translateY(-2px)" : "none",
        transition: "transform .14s, border-color .14s, box-shadow .14s, background .14s" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: mob ? 11 : 12, fontWeight: 600, color: "var(--text-2)", whiteSpace: mob ? "normal" : "nowrap", lineHeight: 1.3 }}>{label}</span>
        <span style={{ width: mob ? 28 : 32, height: mob ? 28 : 32, borderRadius: mob ? 8 : 9, background: accent + "16", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={icon} size={mob ? 15 : 16} color={accent} /></span>
      </div>
      <div style={{ marginTop: mob ? 10 : 12, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--display)", fontSize: mob ? 24 : 30, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: mob ? 12 : 13, fontWeight: 600, color: "var(--text-3)" }}>{unit}</span>}
      </div>
      {sub && <div style={{ marginTop: 7, fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </div>
  );
}

function StockView({ stock, onResetAll, onMenuOpen, currentUser, jobs }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const byName = (currentUser && currentUser.name) || "-";
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
          <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู">
            <Icon name="menu" size={18} color="var(--text-2)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
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
          {isMobile ? (
            // มือถือ: custom dropdown — จุดสีประจำหมวด + จำนวน + ไฮไลต์หมวดที่เลือก
            <CatDropdown cat={cat} setCat={setCat} items={items} cats={SF.STOCK_CATS} />
          ) : (
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              <CatChip active={cat === "all"} onClick={() => setCat("all")} label="ทั้งหมด" color="var(--text-2)" />
              {SF.STOCK_CATS.map((c) => <CatChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.th} color={c.color} />)}
            </div>
          )}
        </div>
      </header>

      <div className="app-content">
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          <StockKpi label="รายการทั้งหมด" value={items.length} unit="ชนิด" icon="box" accent="#3B82F6" sub="ชนิดอุปกรณ์ในคลัง" active={kpiFilter===null} onClick={() => setKpiFilter(null)} />
          <StockKpi label="ใกล้หมด / ต่ำกว่าขั้นต่ำ" value={lowCount} unit="รายการ" icon="alert" accent="#F59E0B" sub="ควรสั่งเพิ่ม" active={kpiFilter==="low"} onClick={() => setKpiFilter(f => f==="low" ? null : "low")} />
          <StockKpi label="รับเข้าเดือนนี้" value={inMonth} unit="ชิ้น" icon="arrowRight" accent="#22A35B" sub={inItemIds.size + " รายการ"} active={kpiFilter==="in"} onClick={() => setKpiFilter(f => f==="in" ? null : "in")} />
          <StockKpi label="เบิกออกเดือนนี้" value={outMonth} unit="ชิ้น" icon="wrench" accent="#7C5CFC" sub={outItemIds.size + " รายการ"} active={kpiFilter==="out"} onClick={() => setKpiFilter(f => f==="out" ? null : "out")} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 18, alignItems: "start" }}>
          {/* stock list — มือถือ: card list, เดสก์ท็อป: ตาราง */}
          {isMobile ? (
            <StockCardList items={filtered} onMove={setMoveItem}
              onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />
          ) : (
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
                          <button onClick={() => setMoveItem({ item: it, type: "return" })} title="คืนของ"
                            style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "#0EA5E916", border: "none", color: "#0784b8", fontWeight: 700, fontSize: 11.5, padding: "5px 9px", borderRadius: 8, cursor: "pointer", marginRight: 4, fontFamily: "inherit" }}>↩ คืน</button>
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
          )}

          {/* ledger */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, boxShadow: "var(--shadow-sm)" }}>
            <PanelTitle icon="history" title="ความเคลื่อนไหวล่าสุด" sub="รับเข้า / เบิกออก" />
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
              {stock.moves.slice(0, 30).map((m) => {
                const it = items.find((x) => x.id === m.itemId);
                const mt = MOVE_TYPES[m.type] || MOVE_TYPES.out;
                const job = m.jobId && (jobs || []).find((j) => j.id === m.jobId);
                return (
                  <div key={m.id} style={{ display: "flex", gap: 11, padding: "10px 11px", border: "1px solid var(--border)", borderRadius: 11 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center",
                      background: mt.bg, color: mt.color, fontWeight: 800, fontSize: 15 }}>{mt.sym}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it ? it.name : m.itemId}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                        {mt.label} <strong style={{ color: mt.color }}>{m.qty}</strong> · {thDate(m.date)} · <span style={{ fontFamily: "var(--mono)" }}>{m.ref}</span>
                      </div>
                      {job && <div style={{ fontSize: 11, color: mt.color, marginTop: 2, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}><Icon name="wrench" size={10} color={mt.color} /> {job.name}</div>}
                      {m.by && m.by !== "-" && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}><Icon name="user" size={10} color="var(--text-3)" /> โดย {m.by}</div>}
                      {m.note && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, fontStyle: "italic" }}>{m.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {moveItem && <MoveModal info={moveItem} byName={byName} jobs={jobs || []} onSave={(qty, ref, note, jobId) => { stock.move(moveItem.item.id, moveItem.type, qty, ref, note, byName, jobId); setMoveItem(null); }} onClose={() => setMoveItem(null)} />}
      {itemForm && <ItemModal initial={itemForm.item} isNew={itemForm.isNew} onSave={(rec) => { stock.upsertItem(rec); setItemForm(null); }} onClose={() => setItemForm(null)} />}
    </React.Fragment>
  );
}

function CatChip({ active, onClick, label, color }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: mob ? "5px 11px" : "6px 13px", borderRadius: 99,
      border: "1px solid " + (active ? color : "var(--border-strong)"), background: active ? color + "16" : "var(--surface)",
      color: active ? color : "var(--text-2)", fontSize: mob ? 11.5 : 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
      {label}
    </button>
  );
}

/* ── Mobile stock — card list แทนตาราง ── */
function StockCardList({ items, onMove, onEdit, onRemove }) {
  const SF = window.SF;
  if (items.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>ไม่พบรายการอุปกรณ์</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it) => {
        const c = SF.STOCK_CAT_BY[it.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
        const st = lowState(it);
        return (
          <div key={it.id} style={{ background: st === "out" ? "#FEF6F6" : "var(--surface)",
            border: "1px solid " + (st === "out" ? "#FBD3D3" : "var(--border)"), borderRadius: 14, padding: 13,
            borderLeft: "3px solid " + STOCK_COLORS[st], boxShadow: "var(--shadow-sm)" }}>
            {/* หัว: ชื่อ + SKU + หมวด */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.25 }}>{it.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{it.sku || "—"}</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: c.color,
                background: c.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color }} />{c.th}
              </span>
            </div>

            {/* คงเหลือ + ขั้นต่ำ + ที่จัดเก็บ */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: STOCK_COLORS[st], lineHeight: 1 }}>{it.qty.toLocaleString()}</span>
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{it.unit}</span>
                {st !== "ok" && <span style={{ fontSize: 10, fontWeight: 700, color: STOCK_COLORS[st], marginLeft: 2 }}>{st === "out" ? "⚠ หมด" : "⚠ ใกล้หมด"}</span>}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ขั้นต่ำ <span style={{ fontFamily: "var(--mono)", color: "var(--text-2)" }}>{it.min.toLocaleString()}</span></span>
              {it.loc && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}><Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {it.loc}</span>}
            </div>

            {/* ปุ่ม */}
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <button onClick={() => onMove({ item: it, type: "in" })}
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3, background: "#22A35B16", border: "none",
                    color: "#1d854b", fontWeight: 700, fontSize: 12.5, padding: "9px 6px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>+ รับ</button>
                <button onClick={() => onMove({ item: it, type: "out" })}
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3, background: "#7C5CFC16", border: "none",
                    color: "#6645e0", fontWeight: 700, fontSize: 12.5, padding: "9px 6px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>− เบิก</button>
                <button onClick={() => onMove({ item: it, type: "return" })}
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 3, background: "#0EA5E916", border: "none",
                    color: "#0784b8", fontWeight: 700, fontSize: 12.5, padding: "9px 6px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit" }}>↩ คืน</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <button onClick={() => onEdit(it)} title="แก้ไข" aria-label="แก้ไข"
                  style={{ flex: 1, background: "#3B82F614", border: "none", color: "#3B82F6", height: 36, borderRadius: 9, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600, fontSize: 12.5, fontFamily: "inherit" }}><Icon name="settings" size={15} /> แก้ไข</button>
                <button onClick={() => { if (confirm("ลบ \"" + it.name + "\" ?")) onRemove(it.id); }} title="ลบ" aria-label="ลบ"
                  style={{ flexShrink: 0, background: "#EF444414", border: "none", color: "#EF4444", width: 44, height: 36, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── dropdown เลือกหมวดหมู่ (มือถือ) — ออกแบบเอง ปรับสไตล์ได้ ── */
function CatDropdown({ cat, setCat, items, cats }) {
  const [open, setOpen] = React.useState(false);
  const all = { key: "all", th: "ทุกหมวดหมู่", color: "var(--text-3)" };
  const list = [all].concat(cats);
  const cur = list.find((c) => c.key === cat) || all;
  const countOf = (k) => k === "all" ? items.length : items.filter((it) => it.cat === k).length;
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600,
          color: "var(--text-1)", background: "var(--surface)", border: "1px solid " + (open ? "var(--primary)" : "var(--border-strong)"),
          borderRadius: 10, padding: "10px 13px", outline: "none", cursor: "pointer" }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, background: cur.color, flexShrink: 0 }} />
        <span>{cur.th}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", background: "var(--surface3)", padding: "1px 7px", borderRadius: 99 }}>{countOf(cur.key)}</span>
        <Icon name="chevronDown" size={16} color="var(--text-3)" style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 61, background: "var(--bg)",
            border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 14px 40px rgba(8,20,14,.2)", maxHeight: "58dvh", overflowY: "auto", padding: 6 }}>
            {list.map((c) => {
              const active = c.key === cat;
              return (
                <button key={c.key} onClick={() => { setCat(c.key); setOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 11px", borderRadius: 9, border: "none",
                    background: active ? "var(--primary-soft)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? "var(--primary-dark)" : "var(--text-1)" }}>{c.th}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: active ? "var(--primary-dark)" : "var(--text-3)",
                    background: active ? "var(--surface)" : "var(--surface3)", padding: "1px 7px", borderRadius: 99 }}>{countOf(c.key)}</span>
                  {active && <Icon name="check" size={15} color="var(--primary)" sw={2.6} />}
                </button>
              );
            })}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function MoveModal({ info, onSave, onClose, byName, jobs, lockedJob, maxQty }) {
  const mt = MOVE_TYPES[info.type] || MOVE_TYPES.out;
  const isIn = info.type === "in";
  const linkJob = !isIn; // เบิกออก / คืนของ ผูกกับงาน
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [qty, setQty] = React.useState("");
  const [ref, setRef] = React.useState("");
  const [note, setNote] = React.useState("");
  const [jobId, setJobId] = React.useState(lockedJob ? lockedJob.id : "");
  const accent = mt.accent;

  // งานที่ยังไม่เสร็จขึ้นก่อน, เรียงตามวันนัด
  const jobOpts = React.useMemo(() => {
    const list = (jobs || []).slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0, bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return (b.deadline || "").localeCompare(a.deadline || "");
    });
    return [{ value: "", label: "— ไม่ระบุงาน —" }].concat(
      list.map((j) => ({ value: j.id, label: j.code + " · " + j.name + (j.stage === "done" ? " (เสร็จแล้ว)" : "") }))
    );
  }, [jobs]);

  const submit = () => {
    if (!(parseInt(qty) > 0)) { alert("กรุณากรอกจำนวน"); return; }
    if (maxQty != null && parseInt(qty) > maxQty) { alert("คืนได้ไม่เกิน " + maxQty + " " + info.item.unit); return; }
    // ref: งานที่เลือก → ใช้รหัสงาน; รับเข้า → ใช้ค่าที่กรอก (PO)
    const job = linkJob && (lockedJob || (jobs || []).find((j) => j.id === jobId));
    const finalRef = linkJob ? (job ? job.code : (ref || "-")) : (ref || "-");
    onSave(qty, finalRef, note, linkJob ? jobId : "");
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 100, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(440px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", background: accent, color: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: .9 }}>{mt.title}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{info.item.name}</div>
          <div style={{ fontSize: 12.5, opacity: .85, marginTop: 3 }}>คงเหลือปัจจุบัน {info.item.qty.toLocaleString()} {info.item.unit}</div>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <Field label={"จำนวน (" + info.item.unit + ")" + (maxQty != null ? " · คืนได้ไม่เกิน " + maxQty : "")} required>
            <input type="number" autoFocus max={maxQty != null ? maxQty : undefined} value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} placeholder="0" />
          </Field>
          {linkJob ? (
            <Field label={info.type === "return" ? "งานที่คืนของ" : "งานที่นำไปใช้"}>
              {lockedJob ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13.5, color: "var(--text-1)" }}>
                  <Icon name="wrench" size={14} color={accent} />
                  <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: accent }}>{lockedJob.code}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lockedJob.name}</span>
                </div>
              ) : (
                <Dropdown value={jobId} onChange={setJobId} options={jobOpts} placeholder="— เลือกงาน —" />
              )}
            </Field>
          ) : (
            <Field label="อ้างอิง (เลข PO / ผู้ขาย)">
              <input value={ref} onChange={(e) => setRef(e.target.value)} style={inputStyle} placeholder="เช่น PO-2406" />
            </Field>
          )}
          <Field label="หมายเหตุ">
            <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 10, fontSize: 12.5, color: "var(--text-2)" }}>
            <Icon name="user" size={14} color="var(--text-3)" />
            ผู้ทำรายการ: <strong style={{ color: "var(--text-1)" }}>{byName || "-"}</strong>
          </div>
        </div>
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: 11, border: "none", background: accent, color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>
            {mt.sym} {mt.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemModal({ initial, isNew, onSave, onClose }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 100, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(560px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มรายการอุปกรณ์" : "แก้ไขรายการ"}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, overflowY: "auto" }}>
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
          <Field label="ราคา/หน่วย (บาท)"><input type="number" style={inputStyle} value={f.price != null ? f.price : 0} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} placeholder="0" /></Field>
          <Field label="ที่จัดเก็บ"><input style={inputStyle} value={f.loc} onChange={(e) => set("loc", e.target.value)} placeholder="คลัง A-01" /></Field>
        </div>
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => { if (!f.name.trim()) { alert("กรุณากรอกชื่ออุปกรณ์"); return; } onSave(f); }}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StockView });
