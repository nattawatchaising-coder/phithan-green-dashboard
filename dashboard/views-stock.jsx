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

function StockView({ stock, onResetAll, onMenuOpen, currentUser, jobs, priceStore, ampStore, canManagePrices }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const byName = (currentUser && currentUser.name) || "-";
  const [tab, setTab] = React.useState("stock"); // "stock" | "prices" | "amp"
  const isPrices = tab === "prices" && canManagePrices;
  const isAmp = tab === "amp" && canManagePrices;
  const [cat, setCat] = React.useState("all");
  const [catOpen, setCatOpen] = React.useState(() => localStorage.getItem("sf_stock_catopen") !== "0"); // ย่อ/ขยายแถบกรองหมวด
  const toggleCat = () => setCatOpen((v) => { localStorage.setItem("sf_stock_catopen", v ? "0" : "1"); return !v; });
  const [kpiFilter, setKpiFilter] = React.useState(null); // null | 'low' | 'in' | 'out'
  const [search, setSearch] = React.useState("");
  const [moveItem, setMoveItem] = React.useState(null); // {item, type}
  const [itemForm, setItemForm] = React.useState(null); // {item, isNew}
  const [movesOpen, setMovesOpen] = React.useState(false); // popup ความเคลื่อนไหว
  // ── แท็บราคา BOQ: ค้นหา + กรองกลุ่ม (ยกขึ้นมาไว้บน header เหมือนหน้าสต็อก) ──
  const [priceQ, setPriceQ] = React.useState("");
  const [priceGrp, setPriceGrp] = React.useState("all");
  const [addPriceOpen, setAddPriceOpen] = React.useState(false);
  const priceGroups = React.useMemo(() => {
    try {
      const gs = ["all"].concat([...new Set(window.BOQ.catalog().map((c) => c.group))]);
      if (!gs.includes("ACCESSORIES")) gs.push("ACCESSORIES");
      return gs;
    } catch (e) { return ["all"]; }
  }, []);
  const PG_TH = window.PRICE_GROUP_TH || {};
  const PG_COLOR = window.PRICE_GROUP_COLOR || {};

  const items = stock.items;
  const lowCount = items.filter((it) => lowState(it) !== "ok").length;
  // จำนวนรายการต่อหมวด — ใช้แสดงตัวเลข + ซ่อนหมวดที่ว่างในแถบชิป (ลดความรก)
  const catCount = React.useMemo(() => { const m = {}; items.forEach((it) => { m[it.cat] = (m[it.cat] || 0) + 1; }); return m; }, [items]);
  const thisMonth = SF.TODAY.slice(0, 7);
  const inItemIds = new Set(stock.moves.filter((m) => m.type === "in" && m.date.startsWith(thisMonth)).map((m) => m.itemId));
  const outItemIds = new Set(stock.moves.filter((m) => m.type === "out" && m.date.startsWith(thisMonth)).map((m) => m.itemId));
  const inMonth = stock.moves.filter((m) => m.type === "in" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);
  const outMonth = stock.moves.filter((m) => m.type === "out" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);

  // ลำดับหมวด สำหรับจัดกลุ่มเวลาแสดงผล
  const catOrder = {}; SF.STOCK_CATS.forEach((c, i) => { catOrder[c.key] = i; });
  const filtered = items.filter((it) => {
    if (cat !== "all" && it.cat !== cat) return false;
    if (search && !((it.name + it.sku + it.loc).toLowerCase().includes(search.toLowerCase()))) return false;
    if (kpiFilter === "low" && lowState(it) === "ok") return false;
    if (kpiFilter === "in" && !inItemIds.has(it.id)) return false;
    if (kpiFilter === "out" && !outItemIds.has(it.id)) return false;
    return true;
  }).sort((a, b) => {
    // จัดกลุ่มตามหมวดก่อน แล้วเรียงตามชื่อ (ภาษาไทย) → ของชนิดเดียวกัน เช่น ท่อ/ข้อต่อ มาอยู่ติดกัน
    const ca = catOrder[a.cat] != null ? catOrder[a.cat] : 99;
    const cb = catOrder[b.cat] != null ? catOrder[b.cat] : 99;
    if (ca !== cb) return ca - cb;
    return String(a.name || "").localeCompare(String(b.name || ""), "th", { numeric: true });
  });

  return (
    <React.Fragment>
      <header className="app-header">
        <div className="header-top">
          <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู">
            <Icon name="menu" size={18} color="var(--text-2)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="page-title">{isAmp ? "พิกัดกระแสสายไฟ (วสท.)" : isPrices ? "ราคาวัสดุ (BOQ)" : "คลังสินค้า / สต็อก"}</h1>
            {isAmp ? (
              <p className="page-sub">ตารางพิกัดกระแส วสท. — แยกตามฉนวน × วิธีเดินสาย × ขนาด (ใช้คำนวณ/เตือนขนาดสายใน BOQ)</p>
            ) : isPrices ? (
              <p className="page-sub">รหัส / ราคา / หน่วย สำหรับคำนวณต้นทุน BOQ</p>
            ) : (
            <p className="page-sub">อุปกรณ์ติดตั้ง <strong>{filtered.length}</strong> จาก {items.length} รายการ
              {kpiFilter && <span> · <span style={{ color: "#F59E0B", fontWeight: 700 }}>กรอง: {
                kpiFilter === "low" ? "ใกล้หมด" : kpiFilter === "in" ? "รับเข้าเดือนนี้" : "เบิกออกเดือนนี้"
              }</span> <button onClick={() => setKpiFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
              {!kpiFilter && lowCount > 0 && <span> · <span style={{ color: "#F59E0B", fontWeight: 700 }}>{lowCount} รายการใกล้หมด</span></span>}
            </p>
            )}
          </div>
          {!isAmp && (
          <div className="header-actions">
            <div className="search-box">
              <Icon name="search" size={16} color="var(--text-3)" />
              {isPrices
                ? <input value={priceQ} onChange={(e) => setPriceQ(e.target.value)} placeholder="ค้นหาชื่อ / รหัส..." />
                : <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาอุปกรณ์ / รหัส / ที่จัดเก็บ..." />}
            </div>
            {isPrices ? (
              <button className="btn-add" onClick={() => setAddPriceOpen(true)}>
                <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มวัสดุ</span>
              </button>
            ) : (
              <button className="btn-add" onClick={() => setItemForm({ item: stock.blankItem(), isNew: true })}>
                <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มรายการ</span>
              </button>
            )}
          </div>
          )}
        </div>
        <div className="header-filters">
          {/* แถวเดียว: แท็บ (ซ้าย) + ปุ่มย่อ/ขยายหมวด (ขวา) */}
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            {canManagePrices && (
              <React.Fragment>
                <CatChip active={tab === "stock"} onClick={() => setTab("stock")} label="สต็อก" color="#3B82F6" />
                <CatChip active={tab === "prices"} onClick={() => setTab("prices")} label="ราคา BOQ" color="#EC4899" />
                <CatChip active={tab === "amp"} onClick={() => setTab("amp")} label="พิกัดสาย วสท." color="#F59E0B" />
              </React.Fragment>
            )}
            {!isMobile && !isAmp && (
              <button onClick={toggleCat} title={catOpen ? "ซ่อนตัวกรองหมวด" : "แสดงตัวกรองหมวด"}
                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 99,
                  border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
                  fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                <Icon name="filter" size={14} color="var(--text-2)" />
                หมวดหมู่{isPrices
                  ? (priceGrp !== "all" ? ": " + (PG_TH[priceGrp] || priceGrp) : "")
                  : (cat !== "all" ? ": " + ((SF.STOCK_CAT_BY[cat] || {}).th || "") : "")}
                <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: catOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
              </button>
            )}
          </div>
          {/* มือถือ: dropdown หมวด */}
          {isMobile && !isPrices && !isAmp && <div style={{ marginTop: 10 }}><CatDropdown cat={cat} setCat={setCat} items={items} cats={SF.STOCK_CATS} /></div>}
          {isMobile && isPrices && <div style={{ marginTop: 10 }}><Dropdown value={priceGrp} onChange={setPriceGrp} options={priceGroups.map((g) => ({ value: g, label: g === "all" ? "ทั้งหมด" : (PG_TH[g] || g) }))} /></div>}
          {/* เดสก์ท็อป: ชิปหมวด — ย่อ/ขยายแบบลื่น (max-height + opacity) */}
          {!isMobile && !isAmp && (
            <div style={{ overflow: "hidden", maxHeight: catOpen ? 48 : 0, opacity: catOpen ? 1 : 0,
              marginTop: catOpen ? 8 : 0, transition: "max-height .24s ease, opacity .2s ease, margin-top .24s ease" }}>
              <div className="cat-chip-row" style={{ display: "flex", gap: 7, flexWrap: "nowrap", alignItems: "center", overflowX: "auto", paddingBottom: 4 }}>
                {isPrices ? (
                  <React.Fragment>
                    <CatChip active={priceGrp === "all"} onClick={() => setPriceGrp("all")} label="ทั้งหมด" color="var(--text-2)" />
                    {priceGroups.filter((g) => g !== "all").map((g) => <CatChip key={g} active={priceGrp === g} onClick={() => setPriceGrp(g)} label={PG_TH[g] || g} color={PG_COLOR[g] || "var(--text-2)"} />)}
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <CatChip active={cat === "all"} onClick={() => setCat("all")} label="ทั้งหมด" color="var(--text-2)" count={items.length} />
                    {SF.STOCK_CATS.filter((c) => cat === c.key || catCount[c.key]).map((c) => <CatChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.th} color={c.color} count={catCount[c.key] || 0} />)}
                  </React.Fragment>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {isAmp ? (
        <div className="app-content">
          <AmpacityEditor ampStore={ampStore} />
        </div>
      ) : isPrices ? (
        <div className="app-content">
          <PricePanel priceStore={priceStore} stock={stock} q={priceQ} grp={priceGrp} />
        </div>
      ) : (
      <div className="app-content">
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
          <StockKpi label="รายการทั้งหมด" value={items.length} unit="ชนิด" icon="box" accent="#3B82F6" sub="ชนิดอุปกรณ์ในคลัง" active={kpiFilter===null} onClick={() => setKpiFilter(null)} />
          <StockKpi label="ใกล้หมด / ต่ำกว่าขั้นต่ำ" value={lowCount} unit="รายการ" icon="alert" accent="#F59E0B" sub="ควรสั่งเพิ่ม" active={kpiFilter==="low"} onClick={() => setKpiFilter(f => f==="low" ? null : "low")} />
          <StockKpi label="ความเคลื่อนไหวล่าสุด" value={stock.moves.length} unit="รายการ" icon="history" accent="#0EA5E9" sub="แตะดูทั้งหมด" active={movesOpen} onClick={() => setMovesOpen(true)} />
        </div>

        <div>
          {/* stock list — เต็มความกว้าง (มือถือ: card list, เดสก์ท็อป: ตาราง) */}
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
        </div>
      </div>
      )}

      {moveItem && <MoveModal info={moveItem} byName={byName} jobs={jobs || []} onSave={(qty, ref, note, jobId) => { stock.move(moveItem.item.id, moveItem.type, qty, ref, note, byName, jobId); setMoveItem(null); }} onClose={() => setMoveItem(null)} />}
      {itemForm && <ItemModal initial={itemForm.item} isNew={itemForm.isNew} items={stock.items} onSave={(rec) => { stock.upsertItem(rec); setItemForm(null); }} onClose={() => setItemForm(null)} />}
      {movesOpen && <MovesModal moves={stock.moves} items={items} jobs={jobs || []} onClose={() => setMovesOpen(false)} />}
      {addPriceOpen && <AddPriceModal priceStore={priceStore} stock={stock} onClose={() => setAddPriceOpen(false)} />}
    </React.Fragment>
  );
}

/* ── Popup ความเคลื่อนไหว — แสดงทั้งหมดแบบวิวเต็ม ── */
function MovesModal({ moves, items, jobs, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [q, setQ] = React.useState("");
  const all = moves || [];
  const list = all.filter((m) => {
    if (!q) return true;
    const it = (items || []).find((x) => x.id === m.itemId);
    const job = m.jobId && (jobs || []).find((j) => j.id === m.jobId);
    const hay = ((it ? it.name : m.itemId) + " " + (m.ref || "") + " " + (m.by || "") + " " + (job ? job.name : "")).toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(680px,100%)", maxHeight: isMobile ? "92dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="history" size={17} color="var(--text-2)" />
              <div>
                <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>ความเคลื่อนไหวคลังสินค้า</h2>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>รับเข้า / เบิกออก / คืนของ · ทั้งหมด {all.length} รายการ</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
          </div>
          <div className="search-box" style={{ marginTop: 12 }}>
            <Icon name="search" size={15} color="var(--text-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาอุปกรณ์ / เลขที่ / งาน / ผู้ทำรายการ..." />
          </div>
        </div>
        <div style={{ flex: 1, padding: 16, paddingBottom: isMobile ? "calc(16px + env(safe-area-inset-bottom,0px))" : 16, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          {list.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)" }}>{all.length === 0 ? "ยังไม่มีความเคลื่อนไหว" : "ไม่พบรายการ"}</div>}
          {list.map((m) => {
            const it = (items || []).find((x) => x.id === m.itemId);
            const mt = MOVE_TYPES[m.type] || MOVE_TYPES.out;
            const job = m.jobId && (jobs || []).find((j) => j.id === m.jobId);
            return (
              <div key={m.id} style={{ display: "flex", gap: 11, padding: "10px 11px", border: "1px solid var(--border)", borderRadius: 11 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: mt.bg, color: mt.color, fontWeight: 800, fontSize: 15 }}>{mt.sym}</span>
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
  );
}

function CatChip({ active, onClick, label, color, count }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: mob ? "5px 11px" : "6px 13px", borderRadius: 99,
      border: "1px solid " + (active ? color : "var(--border-strong)"), background: active ? color + "16" : "var(--surface)",
      color: active ? color : "var(--text-2)", fontSize: mob ? 11.5 : 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
      {label}
      {count != null && <span style={{ fontSize: mob ? 10 : 10.5, fontWeight: 700, lineHeight: 1.5, color: active ? color : "var(--text-3)",
        background: active ? color + "22" : "var(--surface3)", borderRadius: 99, padding: "0 6px", minWidth: 17, textAlign: "center" }}>{count}</span>}
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
  const bdClose = window.useBackdropClose(onClose);
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
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 100, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
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

function ItemModal({ initial, isNew, items, onSave, onClose }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const suggestCode = SF.genMatCode(f.cat, items || []); // รหัสถัดไปตามหมวด
  const submitItem = () => {
    if (!f.name.trim()) { alert("กรุณากรอกชื่ออุปกรณ์"); return; }
    const rec = Object.assign({}, f);
    if (!String(rec.sku || "").trim()) rec.sku = suggestCode; // เว้นว่าง → สร้างรหัสอัตโนมัติ
    onSave(rec);
  };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 100, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(560px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มรายการอุปกรณ์" : "แก้ไขรายการ"}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, overflowY: "auto" }}>
          <div style={{ gridColumn: "1 / -1" }}><Field label="ชื่ออุปกรณ์" required><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น แผงโซล่า Longi 550W" /></Field></div>
          <Field label="รหัสวัสดุ (mat code)">
            <div style={{ display: "flex", gap: 6 }}>
              <input style={Object.assign({}, inputStyle, { flex: 1 })} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder={suggestCode + " (อัตโนมัติ)"} />
              <button type="button" onClick={() => set("sku", suggestCode)} title="สร้างรหัสอัตโนมัติตามหมวด"
                style={{ flexShrink: 0, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>auto</button>
            </div>
          </Field>
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
          {f.cat === "panel" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
                <Icon name="panel" size={14} color="var(--primary-dark)" /> สเปคแผง (ใช้ช่วยถอด BOQ)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                <Field label="กำลังไฟ (Wp)"><input type="number" style={inputStyle} value={f.wp != null ? f.wp : ""} onChange={(e) => set("wp", parseFloat(e.target.value) || 0)} placeholder="650" /></Field>
                <Field label="ความหนาเฟรม (mm)"><input type="number" style={inputStyle} value={f.frame != null ? f.frame : ""} onChange={(e) => set("frame", parseFloat(e.target.value) || 0)} placeholder="30 / 35" /></Field>
                <Field label="ความกว้าง (ม.)"><input type="number" style={inputStyle} value={f.width != null ? f.width : ""} onChange={(e) => set("width", parseFloat(e.target.value) || 0)} placeholder="1.134" /></Field>
                <Field label="ความยาว (ม.)"><input type="number" style={inputStyle} value={f.length != null ? f.length : ""} onChange={(e) => set("length", parseFloat(e.target.value) || 0)} placeholder="2.382" /></Field>
              </div>
              <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                ความหนาเฟรม → เลือก MID/END CLAMP KIT (30/35mm) · ความกว้าง → คำนวณความยาว/จำนวนราง · Wp → คำนวณขนาดติดตั้ง (kW)
              </div>
            </div>
          )}
          {f.cat === "inverter" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
                <Icon name="bolt" size={14} color="var(--primary-dark)" /> สเปคอินเวอร์เตอร์ (ใช้ช่วยถอด BOQ)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
                <Field label="ประเภท">
                  <select style={inputStyle} value={f.invType || ""} onChange={(e) => set("invType", e.target.value)}>
                    <option value="">— ไม่ระบุ (อุปกรณ์) —</option>
                    <option value="micro">ไมโคร (Micro)</option>
                    <option value="string">String inverter</option>
                    <option value="hybrid">Hybrid (string + แบต)</option>
                  </select>
                </Field>
                <Field label="kW ต่อตัว"><input type="number" style={inputStyle} value={f.invKw != null ? f.invKw : ""} onChange={(e) => set("invKw", parseFloat(e.target.value) || 0)} placeholder="5 / 10" /></Field>
                <Field label="เฟส">
                  <select style={inputStyle} value={f.invPhase != null ? f.invPhase : ""} onChange={(e) => set("invPhase", e.target.value === "" ? "" : (parseInt(e.target.value) || 0))}>
                    <option value="">ไม่ระบุ</option>
                    <option value="1">1 เฟส</option>
                    <option value="3">3 เฟส</option>
                  </select>
                </Field>
                <Field label="MAX PV (kW)"><input type="number" style={inputStyle} value={f.invMaxPv != null ? f.invMaxPv : ""} onChange={(e) => set("invMaxPv", parseFloat(e.target.value) || 0)} placeholder="7.5 / 15" /></Field>
                <Field label="String สูงสุด"><input type="number" style={inputStyle} value={f.invInputs != null ? f.invInputs : ""} onChange={(e) => set("invInputs", parseInt(e.target.value) || 0)} placeholder="1 / 2 / 3" /></Field>
                <Field label="กระแสออก (A)"><input type="number" style={inputStyle} value={f.invOutA != null ? f.invOutA : ""} onChange={(e) => set("invOutA", parseFloat(e.target.value) || 0)} placeholder="25 / 16.9" /></Field>
              </div>
              <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                ตั้งเป็น String/Hybrid → เลือกในหน้าถอด BOQ ได้ คิดจำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) · MAX PV = กำลังแผงสูงสุดที่ใส่ได้ · String สูงสุด = จำนวน input Combiner Box · กระแสออก = ใช้คำนวณ RCBO
              </div>
            </div>
          )}
          {f.cat === "electrical" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
                <Icon name="bolt" size={14} color="#4F46E5" /> สเปคอุปกรณ์ไฟฟ้า (เบรกเกอร์ / ป้องกัน)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
                <Field label="ประเภท">
                  <select style={inputStyle} value={f.elecType || ""} onChange={(e) => set("elecType", e.target.value)}>
                    <option value="">— ไม่ระบุ —</option>
                    <option value="RCBO">RCBO</option>
                    <option value="MCB">MCB</option>
                    <option value="MCCB">MCCB</option>
                    <option value="Fuse">Fuse</option>
                    <option value="Fuse Holder">Fuse Holder</option>
                    <option value="SPD">SPD</option>
                    <option value="Busbar">บัสบาร์</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </Field>
                <Field label="ขั้ว (Pole)">
                  <select style={inputStyle} value={f.poles || ""} onChange={(e) => set("poles", e.target.value)}>
                    <option value="">— ไม่ระบุ —</option>
                    <option value="1P">1P</option>
                    <option value="2P">2P</option>
                    <option value="3P">3P</option>
                    <option value="3P+N">3P+N</option>
                    <option value="4P">4P</option>
                  </select>
                </Field>
                <Field label="พิกัดกระแส (A)"><input type="number" style={inputStyle} value={f.amp != null ? f.amp : ""} onChange={(e) => set("amp", parseFloat(e.target.value) || 0)} placeholder="16 / 32 / 63" /></Field>
              </div>
              <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                ระบุประเภท + ขั้ว + แอมป์ → ใช้ช่วยเลือกอุปกรณ์ตอนถอด BOQ (เช่น RCBO เลือกขนาดจาก Max output current × 1.25)
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submitItem}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

/* ── ตัวแก้ตารางพิกัดกระแสสายไฟ (วสท.) — ฉนวน × วิธีเดินสาย × [กลุ่ม·จำนวนตัวนำ·แกน] × ขนาด ── */
function AmpacityEditor({ ampStore }) {
  const BOQ = window.BOQ || {};
  const sizes = BOQ.WIRE_SIZES || [];
  const classes = BOQ.INS_CLASSES || [];
  const methods = BOQ.WIRE_METHODS || [];
  const groups = BOQ.AMP_GROUPS || [];
  const nconds = BOQ.AMP_NCOND || [];
  const cores = BOQ.AMP_CORES || [];
  const def = BOQ.DEFAULT_AMPACITY || {};
  const ov = (ampStore && ampStore.overrides) || {};
  const [insKey, setInsKey] = React.useState((classes[0] && classes[0].key) || "pvc");
  const [methodKey, setMethodKey] = React.useState((methods[0] && methods[0].key) || "conduitAir");
  const colKey = (g, n, c) => g + "|" + n + "|" + c;
  const ovVal = (g, n, c, sz) => { try { const v = ov[insKey][methodKey][colKey(g, n, c)][sz]; return v > 0 ? v : undefined; } catch (e) { return undefined; } };
  const defVal = (g, n, c, sz) => { try { return def[insKey][methodKey][colKey(g, n, c)][sz]; } catch (e) { return undefined; } };
  const editedCount = React.useMemo(() => {
    let n = 0; Object.keys(ov).forEach((i) => Object.keys(ov[i] || {}).forEach((m) => Object.keys(ov[i][m] || {}).forEach((col) => Object.keys(ov[i][m][col] || {}).forEach((s) => { if (+ov[i][m][col][s] > 0) n++; })))); return n;
  }, [ov]);
  // คอลัมน์ 8 ช่อง: กลุ่ม × จำนวนตัวนำ × แกน
  const leaf = [];
  groups.forEach((g) => nconds.forEach((n) => cores.forEach((c) => leaf.push({ g: g.key, n: n.key, c: c.key, cTh: c.th }))));
  const cellStyle = { width: 58, height: 32, padding: "0 4px", textAlign: "center", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 12 };
  const thBase = { fontSize: 10.5, fontWeight: 700, color: "var(--text-2)", textAlign: "center", whiteSpace: "nowrap", background: "var(--surface2)", borderBottom: "1px solid var(--border)" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "12px 14px", background: "#FEF9EC", border: "1px solid #FCE4B6", borderRadius: 12, marginBottom: 14 }}>
        <Icon name="alert" size={16} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: "#92500C", lineHeight: 1.55 }}>
          ตารางพิกัดกระแส <strong>มาตรฐาน วสท.</strong> (ตัวนำทองแดง 0.6/1 kV) — แยกตาม <strong>กลุ่มการติดตั้ง × จำนวนตัวนำมีกระแส × แกนเดียว/หลายแกน</strong>
          <br />ปัจจุบันมีตารางจริง: <strong>PVC · เดินในท่อร้อยสายในอากาศ</strong> · ฉนวน/วิธีอื่น (เช่น XLPE) <strong>กรอกค่าได้ที่นี่</strong> · ค่าที่กรอกใช้กับทุกงาน · เว้นว่าง = ใช้ค่าเริ่มต้น (ตัวเลขจาง)
        </div>
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {classes.map((c) => (
          <CatChip key={c.key} active={insKey === c.key} onClick={() => setInsKey(c.key)} label={c.th} color="#F59E0B" />
        ))}
        <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 3px" }} />
        <div style={{ minWidth: 220 }}>
          <Dropdown value={methodKey} onChange={setMethodKey} options={methods.map((m) => ({ value: m.key, label: m.th }))} />
        </div>
        {editedCount > 0 && (
          <button onClick={() => { if (confirm("คืนค่าพิกัดกระแสที่แก้ไว้ทั้งหมด ?\n(ลบ " + editedCount + " ช่อง)")) ampStore.reset(); }}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, border: "1px solid #FBD3D3", background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <Icon name="x" size={13} color="#B91C1C" /> คืนค่าที่แก้ ({editedCount})
          </button>
        )}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={Object.assign({}, thBase, { padding: "8px 12px", textAlign: "left", position: "sticky", left: 0, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".03em" })}>ขนาด (mm²)</th>
                {groups.map((g) => (
                  <th key={g.key} colSpan={nconds.length * cores.length} style={Object.assign({}, thBase, { padding: "8px 6px", borderLeft: "1px solid var(--border)" })}>{g.th}</th>
                ))}
              </tr>
              <tr>
                {groups.map((g) => nconds.map((n) => cores.map((c, ci) => (
                  <th key={g.key + n.key + c.key} style={Object.assign({}, thBase, { padding: "6px 4px", fontSize: 10, fontWeight: 600, borderLeft: ci === 0 && c === cores[0] ? "1px solid var(--border)" : "none" })}>
                    <div style={{ color: "var(--primary-dark)" }}>{n.key} ตัวนำ</div>
                    <div style={{ color: "var(--text-3)" }}>{c.th}</div>
                  </th>
                ))))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((sz) => (
                <tr key={sz} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 12px", fontWeight: 700, fontSize: 13, color: "var(--text-1)", whiteSpace: "nowrap", background: "var(--surface)", position: "sticky", left: 0, fontFamily: "var(--mono)" }}>{sz}</td>
                  {leaf.map((lf, idx) => (
                    <td key={idx} style={{ padding: "4px 5px", textAlign: "center", borderLeft: (idx % (nconds.length * cores.length)) === 0 ? "1px solid var(--border)" : "none" }}>
                      <input type="number" min="0" style={cellStyle}
                        value={ovVal(lf.g, lf.n, lf.c, sz) != null ? ovVal(lf.g, lf.n, lf.c, sz) : ""}
                        placeholder={defVal(lf.g, lf.n, lf.c, sz) != null ? String(defVal(lf.g, lf.n, lf.c, sz)) : "—"}
                        onChange={(e) => ampStore.setCell(insKey, methodKey, lf.g, lf.n, lf.c, sz, e.target.value)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        หน่วยเป็นแอมแปร์ (A) · "แกนเดียว" = สาย 1C · "หลายแกน" = 2C ขึ้นไป · ระบบเลือกขนาดสายให้รับ <strong>กระแสใช้งาน × 1.25</strong> และเตือนเมื่อสายที่เลือกพิกัดต่ำกว่าที่ต้องการ
      </div>
    </div>
  );
}

Object.assign(window, { StockView });
