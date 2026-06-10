/* ============================================================
   PHITHAN GREEN — จัดการราคาวัสดุ BOQ (รหัส + ราคา/หน่วย)
   ============================================================ */

function PriceManager({ priceStore, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const cat = React.useMemo(() => window.BOQ.catalog(), []);
  const [q, setQ] = React.useState("");
  const [grp, setGrp] = React.useState("all");
  const seeded = React.useRef(false);
  const [local, setLocal] = React.useState(() => {
    const m = {}; cat.forEach((c) => { const r = priceStore.priceMap[c.name] || {}; m[c.name] = { code: r.code || "", price: r.price != null ? r.price : "" }; }); return m;
  });
  // เติมค่าจาก Firebase เมื่อโหลดเสร็จครั้งแรก
  React.useEffect(() => {
    if (seeded.current) return;
    if (Object.keys(priceStore.priceMap).length === 0) return;
    const m = {}; cat.forEach((c) => { const r = priceStore.priceMap[c.name] || {}; m[c.name] = { code: r.code || "", price: r.price != null ? r.price : "" }; });
    setLocal(m); seeded.current = true;
  }, [priceStore.priceMap]);

  const set = (name, k, v) => setLocal((p) => Object.assign({}, p, { [name]: Object.assign({}, p[name], { [k]: v }) }));
  const groups = ["all"].concat([...new Set(cat.map((c) => c.group))]);
  const GROUP_TH = { all: "ทั้งหมด", "PV MODULE": "แผง", INVERTER: "อินเวอร์เตอร์", MOUNTING: "ชุดยึด", CABLE: "สายไฟ", "RACE WAY": "ท่อร้อยสาย", GROUNDING: "กราวด์" };

  const filtered = cat.filter((c) => {
    if (grp !== "all" && c.group !== grp) return false;
    if (q) { const l = local[c.name] || {}; if (!((c.name + " " + (l.code || "")).toLowerCase().includes(q.toLowerCase()))) return false; }
    return true;
  });
  const isDirty = (c) => { const r = priceStore.priceMap[c.name] || {}; const l = local[c.name] || {}; return (l.code || "") !== (r.code || "") || (+l.price || 0) !== (+r.price || 0); };
  const dirtyCount = cat.filter(isDirty).length;
  const pricedCount = cat.filter((c) => { const l = local[c.name] || {}; return +l.price > 0; }).length;

  const saveAll = () => { cat.forEach((c) => { if (isDirty(c)) { const l = local[c.name] || {}; priceStore.setPrice(c.name, l.code, l.price, c.unit); } }); };

  const inStyle = Object.assign({}, inputStyle, { padding: "7px 9px", fontSize: 12.5 });
  const numStyle = Object.assign({}, inStyle, { textAlign: "right" });
  const GROUP_COLOR = { "PV MODULE": "#22A35B", INVERTER: "#7C5CFC", MOUNTING: "#F59E0B", CABLE: "#0EA5E9", "RACE WAY": "#64748B", GROUNDING: "#A16207" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 105, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(760px,100%)", maxHeight: isMobile ? "96dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>ราคาวัสดุ (BOQ)</h2>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>ใส่ราคาแล้ว {pricedCount}/{cat.length} รายการ{dirtyCount > 0 && <span style={{ color: "#F59E0B", fontWeight: 700 }}> · ยังไม่บันทึก {dirtyCount}</span>}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="search-box" style={{ flex: 1, minWidth: 160 }}>
              <Icon name="search" size={15} color="var(--text-3)" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อ / รหัส..." />
            </div>
            <div style={{ minWidth: 150 }}>
              <Dropdown value={grp} onChange={setGrp} options={groups.map((g) => ({ value: g, label: GROUP_TH[g] || g }))} />
            </div>
          </div>
        </div>

        {/* list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {/* header row (desktop) */}
          {!isMobile && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px", gap: 10, padding: "6px 8px", position: "sticky", top: 0, background: "var(--bg)", zIndex: 1 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>รายการวัสดุ</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>รหัส (Code)</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em", textAlign: "right" }}>ราคา/หน่วย</span>
            </div>
          )}
          {filtered.map((c) => {
            const l = local[c.name] || { code: "", price: "" };
            const dirty = isDirty(c);
            return (
              <div key={c.name} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 150px 120px", gap: isMobile ? 8 : 10, alignItems: "center", padding: "7px 8px", borderRadius: 9, background: dirty ? "#FEF9EC" : "transparent", borderBottom: "1px solid var(--border)" }}>
                <div style={{ gridColumn: isMobile ? "1 / -1" : "auto", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: GROUP_COLOR[c.group] || "var(--text-3)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: 10.5, color: "var(--text-3)", marginLeft: 12 }}>{(GROUP_TH[c.group] || c.group)} · {c.unit}</span>
                </div>
                <input value={l.code} onChange={(e) => set(c.name, "code", e.target.value)} placeholder="รหัส" style={inStyle} />
                <input type="number" value={l.price} onChange={(e) => set(c.name, "price", e.target.value)} placeholder="0" style={numStyle} />
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)" }}>ไม่พบรายการ</div>}
        </div>

        {/* footer */}
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          <button onClick={saveAll} disabled={dirtyCount === 0}
            style={{ flex: 1, padding: "11px 22px", borderRadius: 11, border: "none", background: dirtyCount ? "var(--primary)" : "var(--surface3)", color: dirtyCount ? "#fff" : "var(--text-3)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: dirtyCount ? "pointer" : "default" }}>
            บันทึกราคา{dirtyCount > 0 ? " (" + dirtyCount + ")" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PriceManager });
