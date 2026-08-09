/* ============================================================
   SolarFlow — Inventory / Stock view (built-in stock control)
   ============================================================ */

function lowState(it) {
  if (it.qty <= 0) return "out";
  if (it.qty <= it.min) return "low";
  return "ok";
}
const STOCK_COLORS = { out: "#EF4444", low: "#F59E0B", ok: "#22A35B" };

/* ── ของชนิดเดียวกันแต่คนละขนาด ──
   ในคลังยังเก็บแยกรายการเหมือนเดิม (คนละรหัส คนละราคา คนละสต็อก)
   แต่ตอนเปิดดูจะจับมารวมเป็นปุ่มเลือกขนาดให้ ไม่ต้องปิดแล้วไปหาตัวอื่น
   จับขนาดจากชื่อ: 20mm. · 1/2" · 25 มม. · 1x2.5 sq.mm · 2x4 */
const SIZE_RE = /(\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?|mm\.?|มม\.?)?)|(\d+[\s-]\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?))|(\d+(?:\.\d+)?\s*(?:mm\.?|มม\.?|"|″|นิ้ว))/i;
function sizeOfName(name) {
  const s = String(name || "");
  const m = s.match(SIZE_RE);
  if (!m) return null;
  return { size: m[0].trim().replace(/\s+/g, " "), base: s.slice(0, m.index) + "\u0000" + s.slice(m.index + m[0].length) };
}
/* คีย์กลุ่ม = หมวดหลัก + ยี่ห้อ + ชื่อที่ตัดขนาดออกแล้ว */
function sizeGroupKey(it) {
  const p = sizeOfName(it && it.name);
  if (!p) return null;
  return window.SF.mainCatOf(it.cat) + "|" + String(it.brand || "").trim().toLowerCase() + "|" + p.base.toLowerCase();
}
function sizeNum(txt) { const m = String(txt).match(/\d+(?:\.\d+)?/); return m ? +m[0] : 0; }
function sizeLabel(it) { return ((sizeOfName(it && it.name) || {}).size) || ""; }
/* ชื่อที่ตัดขนาดออก — ใช้โชว์บนการ์ดที่รวมหลายขนาดไว้ใบเดียว */
function baseLabel(name) {
  const p = sizeOfName(name);
  if (!p) return name;
  return p.base.replace("\u0000", "").replace(/\s{2,}/g, " ").replace(/\s+([)\]])/g, "$1").replace(/([([])\s+/g, "$1").trim();
}
/* สรุปกลุ่มขนาด: ช่วงราคา · ยอดคงเหลือรวม · สถานะ (หมดทุกขนาดถึงจะขึ้นหมดสต็อก) */
function groupSummary(list) {
  const prices = list.map((x) => +x.price || 0).filter((v) => v > 0);
  return {
    n: list.length,
    min: prices.length ? Math.min.apply(null, prices) : 0,
    max: prices.length ? Math.max.apply(null, prices) : 0,
    qty: list.reduce((s, x) => s + (+x.qty || 0), 0),
    st: list.every((x) => lowState(x) === "out") ? "out" : (list.some((x) => lowState(x) !== "ok") ? "low" : "ok"),
    sizes: list.map(sizeLabel).filter(Boolean),
  };
}

/* ประเภทการเคลื่อนไหวสต็อก: รับเข้า / เบิกออก / คืนของ */
const MOVE_TYPES = {
  in:     { key: "in",     label: "รับเข้า",  sym: "+", color: "var(--tint-ok-tx)", accent: "#22A35B", bg: "#22A35B16", title: "รับเข้าคลัง",      sub: "เพิ่มสต็อกจากการสั่งซื้อ" },
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
  const [sub, setSub] = React.useState("all");   // หมวดย่อยภายในหมวดหลักที่เลือก
  const [view, setView] = React.useState(() => localStorage.getItem("sf_stock_view") || "grid");   // grid = การ์ดมีรูป · table = ตาราง
  React.useEffect(() => { try { localStorage.setItem("sf_stock_view", view); } catch (e) {} }, [view]);
  // รูปสินค้าเก็บแยกโหนด โหลดเฉพาะตอนเปิดหน้านี้ ไม่ถ่วงหน้าอื่น
  /* ไม่ผูก dep array — setImgOn(true) ซ้ำ React ตัดทิ้งเองอยู่แล้ว
     กันกรณี stock ยังไม่พร้อมตอน mount แล้วไม่มีอะไรมาสั่งสมัครรับรูปอีกเลย */
  React.useEffect(() => { if (stock.enableImages) stock.enableImages(); });
  const imgs = stock.imgs || {};
  /* หน้าแรกของคลัง = การ์ดหมวดใหญ่ ๆ กดเข้าไปดูของข้างใน
     ของ 300+ ชิ้นเทมหน้าเดียวหาอะไรไม่เจอ — ค้นหา/เลือกหมวดแล้วค่อยลงรายการ */
  const [browse, setBrowse] = React.useState(true);
  // แถบกรองหมวด — เริ่มมาปิดไว้ก่อน (หน้าแรกมีการ์ดหมวดให้กดอยู่แล้ว) เปิดค้างไว้ได้ถ้าอยากใช้
  const [catOpen, setCatOpen] = React.useState(() => localStorage.getItem("sf_stock_catopen") === "1");
  const toggleCat = () => setCatOpen((v) => { localStorage.setItem("sf_stock_catopen", v ? "0" : "1"); return !v; });
  const [kpiFilter, setKpiFilter] = React.useState(null); // null | 'low' | 'in' | 'out'
  const [search, setSearch] = React.useState("");
  const [moveItem, setMoveItem] = React.useState(null); // {item, type}
  const [itemForm, setItemForm] = React.useState(null); // {item, isNew}
  const [detailItem, setDetailItem] = React.useState(null); // แถวที่กดเปิดดูรายละเอียด
  const [fillOpen, setFillOpen] = React.useState(false);   // หน้าต่างเติมยี่ห้อ/รุ่นจากชื่อ
  const [brand, setBrand] = React.useState("all");  // กรองยี่ห้อ
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
  // นับรวมของในหมวดย่อยเข้าหมวดหลักด้วย ตัวเลขบนชิปจึงตรงกับที่กดแล้วเห็น
  const catCount = React.useMemo(() => { const m = {}; items.forEach((it) => { const k = SF.mainCatOf(it.cat); m[k] = (m[k] || 0) + 1; }); return m; }, [items]);
  const subCount = React.useMemo(() => { const m = {}; items.forEach((it) => { if (SF.mainCatOf(it.cat) !== it.cat) m[it.cat] = (m[it.cat] || 0) + 1; }); return m; }, [items]);
  const subChips = (SF.STOCK_SUB_BY_CAT[cat] || []).filter((c) => sub === c.key || subCount[c.key]);
  /* กดค้นหา / กรองยี่ห้อ / กด KPI เมื่อไหร่ = ตั้งใจจะหาของ ข้ามหน้าเลือกหมวดไปเลย */
  const browsing = !isPrices && !isAmp && browse && !search.trim() && brand === "all" && !kpiFilter;
  const showCatHome = browsing && cat === "all";
  /* หมวดหลักที่มีหมวดย่อย → กดเข้าไปแล้วเจอหน้าเลือกหมวดย่อยอีกชั้นก่อนถึงรายการ */
  const showSubHome = browsing && cat !== "all" && sub === "all" && subChips.length > 0;
  const catLow = React.useMemo(() => {
    const m = {};
    items.forEach((it) => { if (lowState(it) !== "ok") { const k = SF.mainCatOf(it.cat); m[k] = (m[k] || 0) + 1; } });
    return m;
  }, [items]);
  /* ย้อนกลับทีละชั้น: หมวดย่อย → หมวดหลัก → หน้าเลือกหมวด */
  const goBack = () => {
    if (sub !== "all") { setSub("all"); setBrowse(true); return; }
    if (cat !== "all") { setCat("all"); setBrowse(true); return; }
    setBrowse(true); setKpiFilter(null); setSearch(""); setBrand("all");
  };
  const subLow = React.useMemo(() => {
    const m = {};
    items.forEach((it) => { if (lowState(it) !== "ok" && SF.mainCatOf(it.cat) !== it.cat) m[it.cat] = (m[it.cat] || 0) + 1; });
    return m;
  }, [items]);
  // เปลี่ยนหมวดหลัก / หมวดย่อยหายไป → รีเซ็ตตัวกรองย่อย ไม่ให้ค้างจนตารางว่างโดยไม่รู้สาเหตุ
  React.useEffect(() => { setSub("all"); }, [cat]);
  React.useEffect(() => { if (sub !== "all" && !subChips.some((c) => c.key === sub)) setSub("all"); }, [subChips.length]);
  /* ตัวเลือกยี่ห้อ/รุ่น — นับจากของที่ผ่านตัวกรอง "หมวด" แล้ว
     เลือกยี่ห้อก่อน แถวรุ่นถึงจะขึ้น เพราะรุ่นของคนละยี่ห้อไม่ควรปนกัน */
  const brandCount = React.useMemo(() => {
    const m = {};
    items.forEach((it) => {
      if (cat !== "all" && it.cat !== cat) return;
      const b = (it.brand || "").trim(); if (!b) return;
      m[b] = (m[b] || 0) + 1;
    });
    return m;
  }, [items, cat]);
  const brandList = React.useMemo(() => Object.keys(brandCount).sort((a, z) => a.localeCompare(z, "th")), [brandCount]);
  React.useEffect(() => { if (brand !== "all" && !brandCount[brand]) setBrand("all"); }, [brandCount]);
  const thisMonth = SF.TODAY.slice(0, 7);
  const inItemIds = new Set(stock.moves.filter((m) => m.type === "in" && m.date.startsWith(thisMonth)).map((m) => m.itemId));
  const outItemIds = new Set(stock.moves.filter((m) => m.type === "out" && m.date.startsWith(thisMonth)).map((m) => m.itemId));
  const inMonth = stock.moves.filter((m) => m.type === "in" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);
  const outMonth = stock.moves.filter((m) => m.type === "out" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);

  // ลำดับหมวด สำหรับจัดกลุ่มเวลาแสดงผล
  const catOrder = {}; SF.STOCK_CATS.forEach((c, i) => { catOrder[c.key] = i; });
  const filtered = items.filter((it) => {
    // เลือกหมวดหลัก = ได้ของในหมวดย่อยใต้มันด้วย · เลือกหมวดย่อย = เฉพาะหมวดย่อยนั้น
    if (cat !== "all" && it.cat !== cat && SF.mainCatOf(it.cat) !== cat) return false;
    if (sub !== "all" && it.cat !== sub) return false;
    if (brand !== "all" && (it.brand || "") !== brand) return false;
    if (search && !((it.name + it.sku + it.loc + (it.brand || "") + (it.model || "")).toLowerCase().includes(search.toLowerCase()))) return false;
    if (kpiFilter === "low" && lowState(it) === "ok") return false;
    if (kpiFilter === "in" && !inItemIds.has(it.id)) return false;
    if (kpiFilter === "out" && !outItemIds.has(it.id)) return false;
    return true;
  }).sort((a, b) => {
    // จัดกลุ่มตามหมวดก่อน แล้วเรียงตามชื่อ (ภาษาไทย) → ของชนิดเดียวกัน เช่น ท่อ/ข้อต่อ มาอยู่ติดกัน
    const ka = SF.mainCatOf(a.cat), kb = SF.mainCatOf(b.cat);
    const ca = catOrder[ka] != null ? catOrder[ka] : 99;
    const cb = catOrder[kb] != null ? catOrder[kb] : 99;
    if (ca !== cb) return ca - cb;
    // หมวดหลักเดียวกัน → เรียงตามหมวดย่อย ของกลุ่มเดียวกันจะได้อยู่ติดกัน
    if (a.cat !== b.cat) return String(a.cat).localeCompare(String(b.cat));
    return String(a.name || "").localeCompare(String(b.name || ""), "th", { numeric: true });
  });
  /* ของชนิดเดียวกันคนละขนาด — ใช้ทำปุ่มเลือกขนาดในหน้ารายละเอียด */
  const sizeGroups = React.useMemo(() => {
    const m = {};
    items.forEach((it) => { const k = sizeGroupKey(it); if (k) (m[k] = m[k] || []).push(it); });
    return m;
  }, [items]);
  /* รวมของชนิดเดียวกันหลายขนาดให้เหลือการ์ดใบเดียว — กดเข้าไปค่อยเลือกขนาด
     (รวมแค่ตอนแสดงผล ในคลังยังเป็นคนละรายการเหมือนเดิม) */
  const rowsOf = (list) => {
    const byKey = {};
    list.forEach((it) => { const k = sizeGroupKey(it); if (k) (byKey[k] = byKey[k] || []).push(it); });
    const seen = {}, out = [];
    list.forEach((it) => {
      const k = sizeGroupKey(it);
      const g = k ? byKey[k] : null;
      if (!g || g.length < 2) { out.push({ it: it, sizes: null }); return; }
      if (seen[k]) return;
      seen[k] = 1;
      const sorted = g.slice().sort((a, b) => sizeNum(sizeLabel(a)) - sizeNum(sizeLabel(b)) || sizeLabel(a).localeCompare(sizeLabel(b)));
      // เอาตัวที่มีรูปขึ้นเป็นหน้ากลุ่ม ถ้าไม่มีรูปเลยก็ใช้ขนาดเล็กสุด
      out.push({ it: sorted.find((x) => imgs[x.id]) || sorted[0], sizes: sorted });
    });
    return out;
  };
  /* "＋ เพิ่มขนาด" — เปิดฟอร์มใหม่ที่ก๊อปชื่อ/หมวด/ยี่ห้อ/หน่วย/ขั้นต่ำ/ที่จัดเก็บมาให้
     ชื่อต้องเหมือนเดิมเป๊ะ ๆ ยกเว้นตรงขนาด ระบบถึงจะรวมเป็นกลุ่มเดียวกัน */
  const addSizeFrom = (it) => {
    if (!it) return;
    const rec = Object.assign(stock.blankItem(), {
      name: it.name || "", cat: it.cat, brand: it.brand || "", unit: it.unit || "ชิ้น",
      min: +it.min || 0, loc: it.loc || "", desc: it.desc || "", qty: 0, price: 0, sku: "",
    });
    setDetailItem(null);
    setItemForm({ item: rec, isNew: true, sizeOf: it.name });
  };
  const variantsOf = (it) => {
    const k = sizeGroupKey(it);
    const list = (k && sizeGroups[k]) || [];
    if (list.length < 2) return [];
    return list.map((x) => ({ it: x, size: (sizeOfName(x.name) || {}).size || "" }))
      .sort((a, b) => sizeNum(a.size) - sizeNum(b.size) || a.size.localeCompare(b.size));
  };
  // ของที่อยู่ในหมวดหลักตรง ๆ (ไม่ได้ใส่หมวดย่อยไว้) — เอาไปต่อท้ายหน้าเลือกหมวดย่อย
  const directItems = showSubHome ? filtered.filter((it) => it.cat === cat) : [];

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
              <React.Fragment>
                {/* สลับมุมมอง — การ์ดมีรูปแบบแคตตาล็อก / ตารางแบบเดิมที่เห็นหลายรายการพร้อมกัน */}
                {!isMobile && (
                  <button className="btn-add" onClick={() => setView((v) => (v === "grid" ? "table" : "grid"))}
                    title={view === "grid" ? "สลับเป็นมุมมองตาราง" : "สลับเป็นมุมมองการ์ด (มีรูป)"}
                    style={{ background: "var(--surface2)", color: "var(--text-2)", border: "1px solid var(--border-strong)" }}>
                    <Icon name={view === "grid" ? "menu" : "grid"} size={16} color="var(--text-2)" />
                    <span>{view === "grid" ? "ตาราง" : "การ์ด"}</span>
                  </button>
                )}
                {/* เติมยี่ห้อ/รุ่นจากชื่อ — ของเดิมส่วนใหญ่เขียนยี่ห้อกับรุ่นไว้ในชื่ออยู่แล้ว
                    ให้ดูรายการที่จะเติมก่อน แล้วค่อยกดยืนยัน ไม่เขียนทับของที่กรอกไว้เอง */}
                <button className="btn-add" onClick={() => setFillOpen(true)}
                  style={{ background: "var(--surface2)", color: "var(--text-2)", border: "1px solid var(--border-strong)" }}>
                  <Icon name="sparkle" size={16} color="var(--text-2)" /><span>เติมยี่ห้อ/รุ่น</span>
                </button>
                <button className="btn-add" onClick={() => setItemForm({ item: stock.blankItem(), isNew: true })}>
                  <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มรายการ</span>
                </button>
              </React.Fragment>
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
            <div style={{ overflow: "hidden",
              maxHeight: catOpen ? (!isPrices && subChips.length ? 92 : 48) : 0,
              opacity: catOpen ? 1 : 0,
              marginTop: catOpen ? 8 : 0, transition: "max-height .24s ease, opacity .2s ease, margin-top .24s ease" }}>
              <div className="cat-chip-row" style={{ display: "flex", gap: 7, flexWrap: "nowrap", alignItems: "center", overflowX: "auto", paddingBottom: 4 }}>
                {isPrices ? (
                  <React.Fragment>
                    <CatChip active={priceGrp === "all"} onClick={() => setPriceGrp("all")} label="ทั้งหมด" color="var(--text-2)" />
                    {priceGroups.filter((g) => g !== "all").map((g) => <CatChip key={g} active={priceGrp === g} onClick={() => setPriceGrp(g)} label={PG_TH[g] || g} color={PG_COLOR[g] || "var(--text-2)"} />)}
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <CatChip active={cat === "all"} onClick={() => { setCat("all"); setBrowse(true); }} label="ทั้งหมด" color="var(--text-2)" count={items.length} />
                    {SF.STOCK_CATS.filter((c) => cat === c.key || catCount[c.key]).map((c) => <CatChip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} label={c.th} color={c.color} count={catCount[c.key] || 0} />)}
                  </React.Fragment>
                )}
              </div>
              {/* แถวหมวดย่อย — ขึ้นเฉพาะตอนเลือกหมวดหลักที่มีหมวดย่อยอยู่จริง */}
              {!isPrices && subChips.length > 0 && (
                <div className="cat-chip-row" style={{ display: "flex", gap: 6, flexWrap: "nowrap", alignItems: "center", overflowX: "auto", marginTop: 6, paddingLeft: 2, paddingBottom: 2 }}>
                  {/* กดชิปนี้ = อยากเห็นของทั้งหมวด ไม่ใช่กลับไปหน้าเลือกหมวดย่อย */}
                  <CatChip active={sub === "all"} onClick={() => { setSub("all"); setBrowse(false); }} label={"ทุกหมวดย่อย"} color="var(--text-2)" count={catCount[cat] || 0} />
                  {subChips.map((c) => <CatChip key={c.key} active={sub === c.key} onClick={() => setSub(c.key)} label={c.th} color={c.color} count={subCount[c.key] || 0} />)}
                </div>
              )}
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
        {!isMobile && (
        /* ใช้แผงตัวเลขชุดเดียวกับหน้าภาพรวม — ช่องที่กำลังกรองอยู่จะมีเส้นใต้เขียวคาดไว้ */
        <div style={{ marginBottom: 18 }}>
          <StatRail items={[
            { label: "รายการทั้งหมด", value: items.length, unit: "ชนิด", accent: "#3B82F6",
              sub: "ชนิดอุปกรณ์ในคลัง", active: kpiFilter === null, onClick: () => setKpiFilter(null) },
            { label: "ใกล้หมด / ต่ำกว่าขั้นต่ำ", value: lowCount, unit: "รายการ", accent: "#F59E0B", alert: lowCount > 0,
              sub: "ควรสั่งเพิ่ม", active: kpiFilter === "low", onClick: () => setKpiFilter((f) => (f === "low" ? null : "low")) },
            { label: "ความเคลื่อนไหวล่าสุด", value: stock.moves.length, unit: "รายการ", accent: "var(--primary)",
              sub: "แตะดูทั้งหมด", active: movesOpen, onClick: () => setMovesOpen(true) },
          ]} />
        </div>
        )}

        {/* ── เลือกยี่ห้อ ── วางติดกับรายการเลย เลื่อนมาดูของแล้วยังกดเปลี่ยนได้ ไม่ต้องเลื่อนกลับขึ้นหัวเพจ
            หน้าแรก (เลือกหมวด) ไม่ต้องขึ้น — ยี่ห้อทั้งคลังมี 14 ยี่ห้อ รกเปล่า ๆ กดเข้าหมวดก่อนค่อยโผล่ */}
        {brandList.length > 0 && !showCatHome && (
          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {isMobile ? (
              <Dropdown value={brand} onChange={setBrand}
                options={[{ value: "all", label: "ทุกยี่ห้อ" }].concat(brandList.map((b) => ({ value: b, label: b + " (" + brandCount[b] + ")" })))} />
            ) : (
              <div className="cat-chip-row" style={{ display: "flex", gap: 7, flexWrap: "nowrap", alignItems: "center", overflowX: "auto", paddingBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", whiteSpace: "nowrap", paddingRight: 2 }}>ยี่ห้อ</span>
                  <CatChip active={brand === "all"} onClick={() => setBrand("all")} label="ทุกยี่ห้อ" color="var(--text-2)" />
                {brandList.map((b) => <CatChip key={b} active={brand === b} onClick={() => setBrand(b)} label={b} color="#0EA5E9" count={brandCount[b]} />)}
              </div>
            )}
          </div>
        )}

        <div>
          {/* เส้นทางที่อยู่ + ปุ่มย้อนกลับ — เข้าไปดูของในหมวดแล้วต้องกลับออกมาได้เสมอ */}
          {!isPrices && !isAmp && !showCatHome && !showSubHome && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={goBack} title="ย้อนกลับ"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
                  background: "var(--surface2)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: "rotate(90deg)" }} />ย้อนกลับ
              </button>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                <span onClick={() => { setCat("all"); setSub("all"); setBrowse(true); }}
                  style={{ cursor: "pointer", fontWeight: 700, color: "var(--text-2)" }}>คลังทั้งหมด</span>
                {cat !== "all" && <span> › <span style={{ fontWeight: 700, color: sub === "all" ? "var(--text-1)" : "var(--text-2)", cursor: "pointer" }}
                  onClick={() => { setSub("all"); setBrowse(true); }}>{(SF.STOCK_CAT_BY[cat] || {}).th || ""}</span></span>}
                {sub !== "all" && <span> › <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{(SF.STOCK_CAT_BY[sub] || {}).th || ""}</span></span>}
                <span> · {filtered.length.toLocaleString()} รายการ</span>
              </span>
            </div>
          )}
          {/* stock list — เต็มความกว้าง (มือถือ: card list, เดสก์ท็อป: ตาราง) */}
          {showCatHome ? (
            <CatBrowser list={SF.STOCK_CATS.filter((c) => catCount[c.key])} count={catCount} low={catLow} imgs={imgs}
              title="เลือกหมวดที่ต้องการ"
              hint={SF.STOCK_CATS.filter((c) => catCount[c.key]).length + " หมวด · " + items.length.toLocaleString() + " รายการ"}
              onPick={(k) => setCat(k)} onAll={() => setBrowse(false)} onSetImage={(k, d) => stock.setImage("cat_" + k, d)} />
          ) : showSubHome ? (
            <React.Fragment>
              <CatBrowser list={subChips} count={subCount} low={subLow} imgs={imgs}
                title={(SF.STOCK_CAT_BY[cat] || {}).th || ""}
                hint={subChips.length + " หมวดย่อย · " + (catCount[cat] || 0).toLocaleString() + " รายการ"}
                allLabel="ดูทุกรายการในหมวดนี้"
                onPick={(k) => setSub(k)} onAll={() => setBrowse(false)} onBack={() => setCat("all")}
                onSetImage={(k, d) => stock.setImage("cat_" + k, d)} />
              {/* ของที่ยังไม่ได้จัดเข้าหมวดย่อย — ต่อท้ายหน้านี้เลย ไม่ต้องกดเข้าไปอีกชั้น */}
              {directItems.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>รายการในหมวดนี้</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่ได้อยู่ในหมวดย่อย · {directItems.length.toLocaleString()} รายการ</span>
                  </div>
                  {isMobile
                    ? <StockCardList rows={rowsOf(directItems)} imgs={imgs} onOpen={setDetailItem}
                        onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />
                    : <StockGrid rows={rowsOf(directItems)} imgs={imgs} lowState={lowState} onOpen={setDetailItem}
                        onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />}
                </div>
              )}
            </React.Fragment>
          ) : isMobile ? (
            <StockCardList rows={rowsOf(filtered)} imgs={imgs} onOpen={setDetailItem}
              onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />
          ) : view === "grid" ? (
            <StockGrid rows={rowsOf(filtered)} imgs={imgs} lowState={lowState} onOpen={setDetailItem}
              onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />
          ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {/* ไม่มีคอลัมน์ "หมวด" แล้ว เพราะกรองหมวดจากชิปด้านบนได้อยู่แล้ว
                        เอาที่ว่างมาใส่ราคาที่ต้องดูบ่อยกว่าแทน */}
                    {["รายการอุปกรณ์", "ราคา/หน่วย", "คงเหลือ", "ขั้นต่ำ", "ที่จัดเก็บ", "จัดการ"].map((h, i) => (
                      <th key={h} style={{ padding: "12px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
                        color: "var(--text-3)", textAlign: i === 1 ? "right" : (i >= 2 && i <= 3 ? "center" : "left"), whiteSpace: "nowrap", background: "var(--surface2)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => {
                    const c = SF.STOCK_CAT_BY[it.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
                    const st = lowState(it);
                    return (
                      /* กดที่แถวเพื่อเปิดรายละเอียด — รับ/เบิก/คืน อยู่ข้างในนั้น จะได้ไม่กดพลาดจากหน้าตาราง */
                      <tr key={it.id} onClick={() => setDetailItem(it)} title="กดเพื่อดูรายละเอียด · รับ / เบิก / คืน"
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer",
                          background: st === "out" ? "rgba(239,68,68,.07)" : "transparent" }}>
                        {/* ใต้ชื่อเอาแค่ "ยี่ห้อ" — ชื่อรุ่นมักเขียนอยู่ในชื่อรายการอยู่แล้ว ใส่ซ้ำก็อ่านซ้ำเปล่า ๆ
                            (รุ่นเต็ม ๆ ดูได้ในหน้ารายละเอียด และใช้กรองจากแถบด้านบนได้) */}
                        <td style={{ padding: "11px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <MatThumb src={imgs[it.id]} item={it} size={42} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{it.name}</div>
                              {(it.brand || "").trim() && <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginTop: 2 }}>{it.brand}</div>}
                              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{it.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "11px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700,
                            color: +it.price > 0 ? "var(--text-1)" : "var(--text-3)" }}>
                            {+it.price > 0 ? "\u0e3f" + (+it.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "\u2013"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 12px", textAlign: "center" }}>
                          <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: STOCK_COLORS[st] }}>{it.qty.toLocaleString()}</span>
                          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 3 }}>{it.unit}</span>
                          {st !== "ok" && <div style={{ fontSize: 10, fontWeight: 700, color: STOCK_COLORS[st] }}>{st === "out" ? "⚠ หมดสต็อก" : "⚠ ใกล้หมด"}</div>}
                        </td>
                        <td style={{ padding: "11px 12px", textAlign: "center", fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-2)" }}>{it.min.toLocaleString()}</td>
                        <td style={{ padding: "11px 12px", fontSize: 12.5, color: "var(--text-2)", whiteSpace: "nowrap" }}>{it.loc}</td>
                        {/* เหลือแค่ แก้ไข/ลบ — รับ/เบิก/คืน ย้ายไปอยู่ในหน้ารายละเอียด */}
                        <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
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
      {itemForm && <ItemModal initial={itemForm.item} isNew={itemForm.isNew} items={stock.items} onAddCat={stock.addCat} onRemoveCat={stock.removeCat}
        hint={itemForm.sizeOf ? "ก๊อปมาจาก “" + itemForm.sizeOf + "” — แก้เฉพาะตรงขนาด (ตัวอักษรอื่นต้องเหมือนเดิมเป๊ะ) ระบบจะรวมเป็นสินค้าเดียวกันให้เอง" : ""}
        img={imgs[itemForm.item.id]} onImage={(d) => stock.setImage(itemForm.item.id, d)}
        onSave={(rec) => { stock.upsertItem(rec); setItemForm(null); }} onClose={() => setItemForm(null)} />}
      {detailItem && <ItemDetailModal item={(stock.items || []).find((x) => x.id === detailItem.id) || detailItem} img={imgs[detailItem.id]}
        variants={variantsOf(detailItem)} onPickVariant={setDetailItem}
        loadDoc={stock.loadDoc} setDoc={stock.setDoc}
        onMove={(type) => { setMoveItem({ item: detailItem, type: type }); setDetailItem(null); }}
        onEdit={() => { setItemForm({ item: detailItem, isNew: false }); setDetailItem(null); }}
        onAddSize={() => { addSizeFrom(detailItem); }}
        onClose={() => setDetailItem(null)} />}
      {fillOpen && <FillVariantModal items={stock.items} onApply={(list) => { list.forEach((r) => stock.upsertItem(r)); setFillOpen(false); }} onClose={() => setFillOpen(false)} />}
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
function StockCardList({ rows, imgs, onOpen, onEdit, onRemove }) {
  const SF = window.SF;
  if (!rows || rows.length === 0) {
    return <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>ไม่พบรายการอุปกรณ์</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => {
        const it = r.it;
        const g = r.sizes && r.sizes.length > 1 ? groupSummary(r.sizes) : null;
        const c = SF.STOCK_CAT_BY[it.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
        const st = g ? g.st : lowState(it);
        return (
          <div key={it.id} style={{ background: st === "out" ? "rgba(239,68,68,.07)" : "var(--surface)",
            border: "1px solid " + (st === "out" ? "rgba(239,68,68,.22)" : "var(--border)"), borderRadius: 14, padding: 13,
            borderLeft: "3px solid " + STOCK_COLORS[st], boxShadow: "var(--shadow-sm)" }}>
            {/* หัว: ชื่อ + SKU + หมวด */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <MatThumb src={(imgs || {})[it.id]} item={it} size={46} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.25 }}>{g ? baseLabel(it.name) : it.name}</div>
                {(it.brand || "").trim() && <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginTop: 2 }}>{it.brand}</div>}
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{g ? g.sizes.join(" · ") : (it.sku || "—")}</div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: c.color,
                background: c.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color }} />{c.th}
              </span>
            </div>

            {/* คงเหลือ + ขั้นต่ำ + ที่จัดเก็บ */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: STOCK_COLORS[st], lineHeight: 1 }}>{(g ? g.qty : it.qty).toLocaleString()}</span>
                <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{it.unit}</span>
                {st !== "ok" && <span style={{ fontSize: 10, fontWeight: 700, color: STOCK_COLORS[st], marginLeft: 2 }}>{st === "out" ? "⚠ หมด" : "⚠ ใกล้หมด"}</span>}
              </span>
              {g
                ? <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{g.n} ขนาด</span>
                : <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ขั้นต่ำ <span style={{ fontFamily: "var(--mono)", color: "var(--text-2)" }}>{it.min.toLocaleString()}</span></span>}
              {!g && it.loc && <span style={{ fontSize: 11.5, color: "var(--text-3)" }}><Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {it.loc}</span>}
            </div>

            {/* ปุ่ม — รับ/เบิก/คืน อยู่ข้างในหน้ารายละเอียด กดเข้าไปก่อน */}
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 7 }}>
              <button onClick={() => onOpen(it)}
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: "var(--primary-soft)",
                  border: "none", color: "var(--primary-dark)", fontWeight: 700, fontSize: 12.5, padding: "9px 6px", borderRadius: 9,
                  cursor: "pointer", fontFamily: "inherit" }}>{g ? "เลือกขนาด · " + g.n + " ขนาด" : "ดูรายละเอียด · รับ/เบิก/คืน"}</button>
              {/* การ์ดรวมขนาดยังไม่รู้ว่าจะแก้/ลบตัวไหน — เข้าไปเลือกขนาดก่อน */}
              {!g && <button onClick={() => onEdit(it)} title="แก้ไข" aria-label="แก้ไข"
                style={{ flexShrink: 0, background: "#3B82F614", border: "none", color: "#3B82F6", width: 44, height: 36, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={16} /></button>}
              {!g && <button onClick={() => { if (confirm("ลบ \"" + it.name + "\" ?")) onRemove(it.id); }} title="ลบ" aria-label="ลบ"
                style={{ flexShrink: 0, background: "#EF444414", border: "none", color: "#EF4444", width: 44, height: 36, borderRadius: 9, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} /></button>}
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

function ItemModal({ initial, isNew, items, onSave, onClose, onAddCat, onRemoveCat, img, onImage, hint }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const suggestCode = SF.genMatCode(f.cat, items || []); // รหัสถัดไปตามหมวด

  /* หมวด — f.cat เก็บคีย์ที่ละเอียดที่สุด แยกกลับเป็นหลัก/ย่อยตอนแสดง */
  const mainCat = SF.mainCatOf(f.cat);
  const subCat = mainCat === f.cat ? "" : f.cat;
  const subList = SF.STOCK_SUB_BY_CAT[mainCat] || [];
  const isCustomCat = !!(SF.STOCK_CAT_BY[f.cat] || {}).custom;
  const [adding, setAdding] = React.useState(null);   // "main" | "sub" | null
  const [newCat, setNewCat] = React.useState("");
  const commitCat = () => {
    const th = newCat.trim();
    if (!th) { setAdding(null); return; }
    const k = onAddCat && onAddCat(th, adding === "sub" ? mainCat : "");
    if (k) set("cat", k);
    setAdding(null); setNewCat("");
  };
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
          {/* รูปสินค้า — บันทึกทันทีเมื่อเลือก (เก็บคนละโหนดกับตัวรายการ) */}
          {onImage && (
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="รูปสินค้า">
                <MatImagePicker src={img} item={f} onPick={(d) => onImage(d)} onClear={() => onImage("")} />
              </Field>
            </div>
          )}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="ชื่ออุปกรณ์" required><input style={inputStyle} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น แผงโซล่า Longi 550W" /></Field>
            {/* มาจากปุ่ม "เพิ่มขนาด" — ชื่อถูกก๊อปมาแล้ว เหลือแก้แค่ตัวเลขขนาด */}
            {hint && <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>{hint}</div>}
          </div>
          <Field label="รหัสวัสดุ (mat code)">
            <div style={{ display: "flex", gap: 6 }}>
              <input style={Object.assign({}, inputStyle, { flex: 1 })} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder={suggestCode + " (อัตโนมัติ)"} />
              <button type="button" onClick={() => set("sku", suggestCode)} title="สร้างรหัสอัตโนมัติตามหมวด"
                style={{ flexShrink: 0, padding: "0 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>auto</button>
            </div>
          </Field>
          {/* หมวดหลัก / หมวดย่อย — เก็บลง f.cat คีย์เดียว (หมวดย่อยถ้าเลือก ไม่งั้นหมวดหลัก)
              สร้างหมวดเองได้ทั้งสองชั้น ใช้ช่องพิมพ์ในหน้าเลย ไม่ใช้ prompt (เว็บแอปบล็อก) */}
          <Field label="หมวดหลัก">
            <select style={inputStyle} value={mainCat}
              onChange={(e) => {
                if (e.target.value === "__new") { setAdding("main"); return; }
                set("cat", e.target.value);
              }}>
              {SF.STOCK_CATS.map((c) => <option key={c.key} value={c.key}>{c.th}</option>)}
              {onAddCat && <option value="__new">+ เพิ่มหมวดหลักใหม่…</option>}
            </select>
          </Field>
          <Field label="หมวดย่อย">
            <select style={inputStyle} value={subCat}
              onChange={(e) => {
                if (e.target.value === "__new") { setAdding("sub"); return; }
                set("cat", e.target.value || mainCat);
              }}>
              <option value="">— ไม่ระบุ —</option>
              {subList.map((c) => <option key={c.key} value={c.key}>{c.th}</option>)}
              {onAddCat && <option value="__new">+ เพิ่มหมวดย่อยใหม่…</option>}
            </select>
          </Field>
          {adding && (
            <div style={{ gridColumn: "1 / -1", marginTop: -4, display: "flex", gap: 7, alignItems: "center" }}>
              <input autoFocus style={Object.assign({}, inputStyle, { flex: 1 })} value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitCat(); } if (e.key === "Escape") { setAdding(null); setNewCat(""); } }}
                placeholder={adding === "main" ? "ชื่อหมวดหลักใหม่" : 'ชื่อหมวดย่อยใหม่ (อยู่ใต้ "' + ((SF.STOCK_CAT_BY[mainCat] || {}).th || "") + '")'} />
              <button type="button" onClick={commitCat}
                style={{ flexShrink: 0, padding: "0 14px", height: 38, borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>เพิ่ม</button>
              <button type="button" onClick={() => { setAdding(null); setNewCat(""); }}
                style={{ flexShrink: 0, padding: "0 12px", height: 38, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          )}
          {isCustomCat && onRemoveCat && !adding && (
            <div style={{ gridColumn: "1 / -1", marginTop: -6 }}>
              <button type="button"
                onClick={() => { const c = SF.STOCK_CAT_BY[f.cat];
                  if (!confirm('ลบหมวด "' + c.th + '"?' + (c.parent ? "" : "\nหมวดย่อยใต้หมวดนี้จะถูกลบด้วย") + "\nของที่อยู่ในหมวดนี้จะไปแสดงเป็น “อื่นๆ”")) return;
                  onRemoveCat(f.cat); set("cat", c.parent || "other"); }}
                style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "#EF4444", textDecoration: "underline", textUnderlineOffset: 3 }}>
                ลบหมวด “{(SF.STOCK_CAT_BY[f.cat] || {}).th}” ที่สร้างเอง
              </button>
            </div>
          )}
          {/* ยี่ห้อ/รุ่น — ของชิ้นเดียวกันคนละยี่ห้อคนละรุ่น ราคาไม่เท่ากัน แยกเป็นคนละรายการได้ */}
          <Field label="ยี่ห้อ (Brand)"><input style={inputStyle} value={f.brand || ""} onChange={(e) => set("brand", e.target.value)} placeholder="THAI PP-R / SANWA" /></Field>
          <Field label="รุ่น (Model)"><input style={inputStyle} value={f.model || ""} onChange={(e) => set("model", e.target.value)} placeholder="D25 / CKT 20" /></Field>
          <Field label="จำนวนคงเหลือ"><input type="number" style={inputStyle} value={f.qty} onChange={(e) => set("qty", parseInt(e.target.value) || 0)} /></Field>
          <Field label="หน่วยนับ"><input style={inputStyle} value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="แผง / ตัว / ม้วน" /></Field>
          <Field label="ขั้นต่ำ (แจ้งเตือน)"><input type="number" style={inputStyle} value={f.min} onChange={(e) => set("min", parseInt(e.target.value) || 0)} /></Field>
          <Field label="ราคา/หน่วย (บาท)"><input type="number" style={inputStyle} value={f.price != null ? f.price : 0} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} placeholder="0" /></Field>
          <Field label="ที่จัดเก็บ"><input style={inputStyle} value={f.loc} onChange={(e) => set("loc", e.target.value)} placeholder="คลัง A-01" /></Field>
          {/* คำอธิบาย — ขึ้นในหน้ารายละเอียดสินค้า เอาไว้กันจำสเปคสำคัญผิด */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="คำอธิบายสินค้า">
              <textarea rows={3} style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.6 })}
                value={f.desc || ""} onChange={(e) => set("desc", e.target.value)}
                placeholder="เช่น ท่อ PP-R สำหรับน้ำร้อน ทนความดัน PN20 รับอุณหภูมิได้ถึง 95°C" />
            </Field>
          </div>
          {/* ชื่อเดิม — ใบถอดของจับคู่ราคาด้วยชื่อ เปลี่ยนชื่อที่นี่แล้วระบบเก็บชื่อเก่าไว้ให้เอง
              งาน BOQ ที่ทำไว้แล้วจึงยังหาราคาเจอ ลบทิ้งได้ถ้าไม่ใช้ */}
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="ชื่อเดิม / ชื่อพ้อง ที่ใบถอดของยังเรียกอยู่">
              <textarea rows={Math.max(2, (f.aka || []).length)} style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })}
                value={(f.aka || []).join("\n")}
                onChange={(e) => set("aka", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))}
                placeholder="บรรทัดละหนึ่งชื่อ — ปล่อยว่างได้ ระบบเติมให้เองเมื่อเปลี่ยนชื่อ" />
            </Field>
          </div>
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
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border-strong)", display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                <Field label="Voc (V)"><input type="number" style={inputStyle} value={f.voc != null ? f.voc : ""} onChange={(e) => set("voc", parseFloat(e.target.value) || 0)} placeholder="53.90" /></Field>
                <Field label="Isc (A)"><input type="number" style={inputStyle} value={f.isc != null ? f.isc : ""} onChange={(e) => set("isc", parseFloat(e.target.value) || 0)} placeholder="15.29" /></Field>
                <Field label="Vmp (V)"><input type="number" style={inputStyle} value={f.vmp != null ? f.vmp : ""} onChange={(e) => set("vmp", parseFloat(e.target.value) || 0)} placeholder="44.80" /></Field>
                <Field label="Imp (A)"><input type="number" style={inputStyle} value={f.imp != null ? f.imp : ""} onChange={(e) => set("imp", parseFloat(e.target.value) || 0)} placeholder="14.52" /></Field>
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border-strong)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>ค่าอุณหภูมิ &amp; การเสื่อม (ใช้คำนวณผลผลิตและเส้น I-V)</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                  <Field label="ค่าอุณหภูมิ Voc (%/°C)"><input type="number" step="0.001" style={inputStyle} value={f.tcVoc != null ? f.tcVoc : ""} onChange={(e) => set("tcVoc", parseFloat(e.target.value) || 0)} placeholder="-0.25" /></Field>
                  <Field label="ค่าอุณหภูมิ Isc (%/°C)"><input type="number" step="0.001" style={inputStyle} value={f.tcIsc != null ? f.tcIsc : ""} onChange={(e) => set("tcIsc", parseFloat(e.target.value) || 0)} placeholder="0.045" /></Field>
                  <Field label="ค่าอุณหภูมิ Pmax (%/°C)"><input type="number" step="0.001" style={inputStyle} value={f.tcPmax != null ? f.tcPmax : ""} onChange={(e) => set("tcPmax", parseFloat(e.target.value) || 0)} placeholder="-0.29" /></Field>
                  <Field label="NOCT / NMOT (°C)"><input type="number" step="0.1" style={inputStyle} value={f.noct != null ? f.noct : ""} onChange={(e) => set("noct", parseFloat(e.target.value) || 0)} placeholder="44" /></Field>
                  <Field label="เสื่อมปีแรก (%)"><input type="number" step="0.1" style={inputStyle} value={f.deg1 != null ? f.deg1 : ""} onChange={(e) => set("deg1", parseFloat(e.target.value) || 0)} placeholder="1" /></Field>
                  <Field label="เสื่อมปีถัดไป (%/ปี)"><input type="number" step="0.01" style={inputStyle} value={f.degY != null ? f.degY : ""} onChange={(e) => set("degY", parseFloat(e.target.value) || 0)} placeholder="0.4" /></Field>
                  <Field label="จำนวนเซลล์อนุกรม"><input type="number" style={inputStyle} value={f.cells != null ? f.cells : ""} onChange={(e) => set("cells", parseInt(e.target.value) || 0)} placeholder="72 / 144" /></Field>
                  <Field label="ฟิวส์สูงสุดของแผง (A)"><input type="number" style={inputStyle} value={f.fuseA != null ? f.fuseA : ""} onChange={(e) => set("fuseA", parseFloat(e.target.value) || 0)} placeholder="25 / 30" /></Field>
                  <Field label="ชนิดเซลล์">
                    <select style={inputStyle} value={f.halfCut === true ? "1" : f.halfCut === false ? "0" : ""}
                      onChange={(e) => set("halfCut", e.target.value === "" ? null : e.target.value === "1")}>
                      <option value="">— ให้ระบบเดาจากรุ่น —</option>
                      <option value="1">ครึ่งเซลล์ (half-cut)</option>
                      <option value="0">เซลล์เต็ม</option>
                    </select>
                  </Field>
                </div>
              </div>
              <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.55 }}>
                ความหนาเฟรม → เลือก MID/END CLAMP KIT (30/35mm) · ความกว้าง/ความยาว → คำนวณราง + ขนาดแผงในผัง 3 มิติ · Wp → ขนาดติดตั้ง (kW) · Voc/Isc/Vmp/Imp → การต่ออนุกรม String + สาย DC ·
                ค่าอุณหภูมิ Voc → Voc ตอนอากาศเย็น (ตัวกำหนดจำนวนแผงสูงสุดต่อสตริง) · Pmax + NOCT → กำลังที่หายไปตอนแผงร้อน · เสื่อมปีแรก/ปีถัดไป → ผลผลิตตลอดอายุและการคืนทุน · จำนวนเซลล์ + ชนิดเซลล์ → เส้น I-V และการคิดเงาบังผ่านไดโอดบายพาส · ไม่กรอก = ใช้ค่ากลางของอุตสาหกรรม
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
                <Field label="จำนวนช่อง MPPT"><input type="number" style={inputStyle} value={f.invInputs != null ? f.invInputs : ""} onChange={(e) => set("invInputs", parseInt(e.target.value) || 0)} placeholder="1 / 2 / 3" /></Field>
                <Field label="อินพุตต่อ 1 ช่อง MPPT"><input type="number" style={inputStyle} value={f.invStrPerMppt != null ? f.invStrPerMppt : ""} onChange={(e) => set("invStrPerMppt", parseInt(e.target.value) || 0)} placeholder="2" /></Field>
                <Field label="กระแสออก (A)"><input type="number" style={inputStyle} value={f.invOutA != null ? f.invOutA : ""} onChange={(e) => set("invOutA", parseFloat(e.target.value) || 0)} placeholder="25 / 16.9" /></Field>
              </div>
              {(f.invType === "string" || f.invType === "hybrid") && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border-strong)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>ช่วงแรงดัน DC / MPPT (สำหรับคำนวณ String)</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                    <Field label="MPPT ต่ำสุด (V)"><input type="number" style={inputStyle} value={f.mpptVmin != null ? f.mpptVmin : ""} onChange={(e) => set("mpptVmin", parseFloat(e.target.value) || 0)} placeholder="350" /></Field>
                    <Field label="MPPT สูงสุด (V)"><input type="number" style={inputStyle} value={f.mpptVmax != null ? f.mpptVmax : ""} onChange={(e) => set("mpptVmax", parseFloat(e.target.value) || 0)} placeholder="560" /></Field>
                    <Field label="แรงดัน DC สูงสุด (V)"><input type="number" style={inputStyle} value={f.maxVdc != null ? f.maxVdc : ""} onChange={(e) => set("maxVdc", parseFloat(e.target.value) || 0)} placeholder="600 / 1000" /></Field>
                    <Field label="แรงดันเริ่มทำงาน (V)"><input type="number" style={inputStyle} value={f.vStart != null ? f.vStart : ""} onChange={(e) => set("vStart", parseFloat(e.target.value) || 0)} placeholder="180 / 200" /></Field>
                    <Field label="แรงดันใช้งานที่ออกแบบไว้ (V)"><input type="number" style={inputStyle} value={f.vRated != null ? f.vRated : ""} onChange={(e) => set("vRated", parseFloat(e.target.value) || 0)} placeholder="600 / 720" /></Field>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", margin: "12px 0 8px" }}>พิกัดกระแสเข้า (ดาต้าชีตแยก 3 ค่า คนละความหมาย)</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                    <Field label="กระแสสูงสุดต่อ 1 อินพุต (A)"><input type="number" style={inputStyle} value={f.maxInA != null ? f.maxInA : ""} onChange={(e) => set("maxInA", parseFloat(e.target.value) || 0)} placeholder="23" /></Field>
                    <Field label="กระแสสูงสุดต่อ 1 MPPT (A)"><input type="number" style={inputStyle} value={f.maxMpptA != null ? f.maxMpptA : ""} onChange={(e) => set("maxMpptA", parseFloat(e.target.value) || 0)} placeholder="30 / 33" /></Field>
                    <Field label="กระแสลัดวงจรสูงสุด/MPPT (A)"><input type="number" style={inputStyle} value={f.maxIscA != null ? f.maxIscA : ""} onChange={(e) => set("maxIscA", parseFloat(e.target.value) || 0)} placeholder="40 / 44" /></Field>
                    <Field label="กำลัง AC สูงสุด (kW)"><input type="number" style={inputStyle} value={f.invMaxAcKw != null ? f.invMaxAcKw : ""} onChange={(e) => set("invMaxAcKw", parseFloat(e.target.value) || 0)} placeholder="55" /></Field>
                    <Field label="ประสิทธิภาพสูงสุด (%)"><input type="number" style={inputStyle} value={f.invEff != null ? f.invEff : ""} onChange={(e) => set("invEff", parseFloat(e.target.value) || 0)} placeholder="98.5" /></Field>
                    <Field label="ประสิทธิภาพยุโรป (%)"><input type="number" style={inputStyle} value={f.invEffEuro != null ? f.invEffEuro : ""} onChange={(e) => set("invEffEuro", parseFloat(e.target.value) || 0)} placeholder="98.2" /></Field>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.55 }}>
                    กระแส 3 ค่านี้ห้ามสลับกัน — <b>ต่ออินพุต</b> คุมสตริงเดี่ยว (Imp ของแผงต้องไม่เกิน) · <b>ต่อ MPPT</b> คุมทุกสตริงที่ขนานเข้าช่องเดียวกันรวมกัน (ตัวที่กำหนดว่าเสียบขนานได้กี่เส้นจริง) · <b>ลัดวงจร/MPPT</b> เทียบกับ Isc×1.25 · รุ่นที่ค่าไม่เท่ากันทุกช่อง (เช่น 30/33/33/30) ให้กรอกค่าน้อยสุดไว้ก่อน · ประสิทธิภาพยุโรปใช้คิดผลผลิต ส่วนค่าสูงสุดเป็นค่าโฆษณาบนดาต้าชีต
                  </div>
                </div>
              )}
              <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                ตั้งเป็น String/Hybrid → เลือกในหน้าถอด BOQ ได้ คิดจำนวนตัว = ปัดขึ้น(กำลังแผงรวม ÷ MAX PV ต่อตัว) · MAX PV = กำลังแผงสูงสุดที่ใส่ได้ · จำนวนช่อง MPPT × อินพุตต่อช่อง = สตริงที่เสียบได้ทั้งตัว (เช่น 2 ช่อง × 2 อินพุต = 4 สตริง · ไม่กรอกถือว่า 2 อินพุต/ช่อง) · กระแสออก (A) = ใช้คำนวณ RCBO และขนาดสาย AC จุด INVERTER-MCB_SOLAR / MCB_SOLAR-MDB (×1.25) · ช่วง MPPT/Voc แผง → คำนวณจำนวนแผงต่ออนุกรม + สาย DC
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
          {f.cat === "wiring" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
                <Icon name="power" size={14} color="var(--primary-dark)" /> หมวดสาย (ใช้จัดกลุ่มใน dropdown ถอด BOQ)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <Field label="หมวดสาย">
                  <select style={inputStyle} value={f.cableGroup || ""} onChange={(e) => set("cableGroup", e.target.value)}>
                    <option value="">— อัตโนมัติ (เดาจากชื่อ) —</option>
                    {(window.BOQ.CABLE_GROUPS || []).map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              </div>
              <div style={{ marginTop: 9, fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                เลือกหมวด → เวลาเลือกสายตอนถอด BOQ จะอยู่ใต้ชิปหมวดนี้ · เว้นว่าง = ระบบเดาจากชื่อ (CV-FD / VCT / THW / PV1-F / LAN)
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
  const nconds = BOQ.AMP_NCOND || [];
  const cores = BOQ.AMP_CORES || [];
  const def = BOQ.DEFAULT_AMPACITY || {};
  const ov = (ampStore && ampStore.overrides) || {};
  const [insKey, setInsKey] = React.useState((classes[0] && classes[0].key) || "pvc");
  const [methodKey, setMethodKey] = React.useState((methods[0] && methods[0].key) || "conduitAir");
  const colKey = (g, n, c) => g + "|" + n + "|" + c;
  const ovVal = (g, n, c, sz) => { try { const v = ov[insKey][methodKey][colKey(g, n, c)][sz]; return v > 0 ? v : undefined; } catch (e) { return undefined; } };
  /* ค่าเริ่มต้นของช่อง — วิธีที่ยังไม่มีตารางของตัวเอง ให้โชว์ค่าที่ "ยืม" มาจากวิธีฐาน
     (เช่น Wireway ยืมของเดินในท่อในอากาศ) เพราะเครื่องคำนวณก็ใช้ค่านั้นจริง ๆ ตอนเลือกขนาดสาย
     ถ้าไม่โชว์ ตารางจะขึ้น "—" ทั้งหน้า ทั้งที่หน้า BOQ คำนวณออกมาได้ปกติ */
  const baseKey = (BOQ.WIRE_METHOD_BASE || {})[methodKey];
  const rawDef = (m, g, n, c, sz) => { try { return def[insKey][m][colKey(g, n, c)][sz]; } catch (e) { return undefined; } };
  const defVal = (g, n, c, sz) => {
    const own = rawDef(methodKey, g, n, c, sz);
    if (own != null) return own;
    return baseKey ? rawDef(baseKey, g, n, c, sz) : undefined;
  };
  /* วิธีนี้มีตารางเป็นของตัวเองไหม — เช็คทั้งชุด ไม่ใช่ดูช่องเดียว
     (เดิมดูแค่ "g1|2|single" ของขนาดแรก พอวิธีที่ใช้กลุ่ม 7 อย่างเดียวมาถึงจะอ่านผิดว่ายืมมา) */
  const anyDef = (m) => { const t = (def[insKey] || {})[m] || {}; return Object.keys(t).some((c) => Object.keys(t[c] || {}).length > 0); };
  const methodMeta = methods.find((m) => m.key === methodKey) || {};
  const borrowed = !!(baseKey && !anyDef(methodKey) && anyDef(baseKey));
  const noTable = !anyDef(methodKey) && !borrowed;
  const methodTh = (k) => ((methods.find((m) => m.key === k) || {}).th || k);
  // โชว์เฉพาะกลุ่มที่วิธีนี้ใช้ได้จริง — ไม่งั้นได้คอลัมน์ว่าง 5 กลุ่มที่ไม่มีวันกรอก
  const groups = (BOQ.AMP_GROUPS || []).filter((g) => !methodMeta.groups || methodMeta.groups.indexOf(g.key) >= 0);
  const editedCount = React.useMemo(() => {
    let n = 0; Object.keys(ov).forEach((i) => Object.keys(ov[i] || {}).forEach((m) => Object.keys(ov[i][m] || {}).forEach((col) => Object.keys(ov[i][m][col] || {}).forEach((s) => { if (+ov[i][m][col][s] > 0) n++; })))); return n;
  }, [ov]);
  /* คอลัมน์ = กลุ่ม × จำนวนตัวนำ × แกนย่อย — "แกนย่อย" ไม่เท่ากันทุกกลุ่ม
     กลุ่ม 1,2,3,7 แยกแกนเดียว/หลายแกน · กลุ่ม 4 แยกแนวตั้ง/แนวราบ · กลุ่ม 5,6 รวมเป็นคอลัมน์เดียว */
  const groupCores = (g) => (BOQ.ampCoresFor ? BOQ.ampCoresFor(g.key) : cores);
  const leaf = [];
  groups.forEach((g) => { const cs = groupCores(g); nconds.forEach((n, ni) => cs.forEach((c, ci) => leaf.push({ g: g.key, n: n.key, c: c.key, cTh: c.th, first: ni === 0 && ci === 0 }))); });
  const cellStyle = { width: 58, height: 32, padding: "0 4px", textAlign: "center", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 12 };
  const thBase = { fontSize: 10.5, fontWeight: 700, color: "var(--text-2)", textAlign: "center", whiteSpace: "nowrap", background: "var(--surface2)", borderBottom: "1px solid var(--border)" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "12px 14px", background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)", borderRadius: 12, marginBottom: 14 }}>
        <Icon name="alert" size={16} color="var(--tint-amber-tx)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: "#92500C", lineHeight: 1.55 }}>
          ตารางพิกัดกระแส <strong>มาตรฐาน วสท.</strong> (ตัวนำทองแดง 0.6/1 kV) — แยกตาม <strong>กลุ่มการติดตั้ง × จำนวนตัวนำมีกระแส × แกนย่อย</strong>
          <br />แกนย่อยไม่เท่ากันทุกกลุ่ม: กลุ่ม 1,2,3,7 = <strong>แกนเดียว/หลายแกน</strong> · กลุ่ม 4 = <strong>แนวตั้ง/แนวราบ</strong> (แกนเดียวล้วน) · กลุ่ม 5,6 = <strong>รวมเป็นคอลัมน์เดียว</strong>
          <br />ปัจจุบันมีตารางจริง: <strong>PVC · เดินในท่อร้อยสายในอากาศ · กลุ่มที่ 1–2</strong> (ตารางที่ 5-20) · กลุ่มที่ 3–7 และ XLPE <strong>กรอกค่าได้ที่นี่</strong> · ค่าที่กรอกใช้กับทุกงาน · เว้นว่าง = ใช้ค่าเริ่มต้น (ตัวเลขจาง)
        </div>
      </div>

      {/* บอกที่มาของตัวเลขจางในตาราง — ยืมมาจากวิธีอื่น หรือยังไม่มีเลย */}
      {borrowed ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", background: "var(--tint-ok-bg)", border: "1px solid var(--tint-ok-bd)", borderRadius: 12, marginBottom: 14 }}>
          <Icon name="check" size={16} color="#22A35B" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--tint-ok-tx)", lineHeight: 1.55 }}>
            ตัวเลขจางในตารางนี้ <strong>ยืมมาจาก "{methodTh(baseKey)}"</strong> — {methodMeta.baseWhy || "วสท. ให้สองวิธีนี้ใช้ตารางพิกัดชุดเดียวกัน"}
            <br />เครื่องคำนวณ BOQ ใช้ค่าชุดนี้อยู่จริง · กรอกทับได้ถ้ามีตารางเฉพาะของรุ่นที่ใช้
          </div>
        </div>
      ) : noTable && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd2)", borderRadius: 12, marginBottom: 14 }}>
          <Icon name="alert" size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--tint-red-tx)", lineHeight: 1.55 }}>
            <strong>ยังไม่มีตารางของ "{methodMeta.th || methodKey}"</strong> — ช่อง "สายแนะนำ" ในหน้า BOQ จะขึ้น "—" จนกว่าจะกรอก
            <br />แต่ละวิธีระบายความร้อนไม่เท่ากัน <strong>เอาตัวเลขของวิธีอื่นมาใส่แทนไม่ได้</strong> — รางไม่มีฝารับกระแสได้มากกว่ารางมีฝา และมากกว่าเดินในท่อ
            <br />แนวทาง วสท.: พิกัดในรางเคเบิล ≈ <strong>65%</strong> ของพิกัดสายเดี่ยวเดินในอากาศ (สาย &lt; 300 mm²) และ <strong>75%</strong> สำหรับ 300 mm² ขึ้นไป — ต้องมีตารางสายเดี่ยวในอากาศเป็นฐานก่อน
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        {classes.map((c) => (
          <CatChip key={c.key} active={insKey === c.key} onClick={() => setInsKey(c.key)} label={c.th} color="#F59E0B" />
        ))}
        <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 3px" }} />
        <div style={{ minWidth: 300, maxWidth: 340, flex: "1 1 260px" }}>
          <Dropdown value={methodKey} onChange={setMethodKey} wrap options={methods.map((m) => ({ value: m.key, label: m.th, sub: m.sub }))} />
        </div>
        {/* รูปของวิธีเดินสายที่เลือก — หัวคอลัมน์มีรูปกลุ่มแล้ว แต่ "วิธี" คือตัวที่ตัดสินว่าใช้ตารางไหน ต้องเห็นด้วย */}
        {typeof WireArt === "function" && (() => {
          const mArt = ((methods.find((m) => m.key === methodKey) || {}).art);
          return mArt ? <WireArt art={mArt} key={methodKey} w={92} h={54} /> : null;
        })()}
        {editedCount > 0 && (
          <button onClick={() => { if (confirm("คืนค่าพิกัดกระแสที่แก้ไว้ทั้งหมด ?\n(ลบ " + editedCount + " ช่อง)")) ampStore.reset(); }}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, border: "1px solid var(--tint-red-bd2)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <Icon name="x" size={13} color="var(--tint-red-tx)" /> คืนค่าที่แก้ ({editedCount})
          </button>
        )}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={Object.assign({}, thBase, { padding: "8px 12px", textAlign: "left", position: "sticky", left: 0, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".03em" })}>ขนาด (mm²)</th>
                {groups.map((g) => (
                  /* มีรูปกำกับหัวคอลัมน์ด้วย — 7 กลุ่มจำจากชื่ออย่างเดียวไม่ไหว กรอกผิดคอลัมน์คือสายผิดทั้งงาน */
                  <th key={g.key} colSpan={nconds.length * groupCores(g).length} title={g.desc || ""} style={Object.assign({}, thBase, { padding: "7px 6px", borderLeft: "1px solid var(--border)" })}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      {typeof WireArt === "function" && <WireArt art={g.art} w={74} h={44} />}
                      <span>{g.th}</span>
                      {g.sub && <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-3)" }}>{g.sub}</span>}
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                {leaf.map((lf, idx) => (
                  <th key={idx} style={Object.assign({}, thBase, { padding: "6px 4px", fontSize: 10, fontWeight: 600, borderLeft: lf.first ? "1px solid var(--border)" : "none" })}>
                    <div style={{ color: "var(--primary-dark)" }}>{lf.n} ตัวนำ</div>
                    <div style={{ color: "var(--text-3)" }}>{lf.cTh}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((sz) => (
                <tr key={sz} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 12px", fontWeight: 700, fontSize: 13, color: "var(--text-1)", whiteSpace: "nowrap", background: "var(--surface)", position: "sticky", left: 0, fontFamily: "var(--mono)" }}>{sz}</td>
                  {leaf.map((lf, idx) => (
                    <td key={idx} style={{ padding: "4px 5px", textAlign: "center", borderLeft: lf.first ? "1px solid var(--border)" : "none" }}>
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
        หน่วยเป็นแอมแปร์ (A) · "แกนเดียว" = สาย 1C · "หลายแกน" = 2C ขึ้นไป · "แกนเดียว/หลายแกน" = กลุ่มนั้นใช้ตารางร่วมกัน · ระบบเลือกขนาดสายให้รับ <strong>กระแสใช้งาน × 1.25</strong> และเตือนเมื่อสายที่เลือกพิกัดต่ำกว่าที่ต้องการ
      </div>
    </div>
  );
}

/* ── ตัวอ่าน PDF ในหน้า ──
   วาดหน้ากระดาษลง canvas เอง (pdf.js) แทนที่จะฝัง <iframe>
   เพราะ viewer ในตัวเบราว์เซอร์บางตัว (เช่นแอปเดสก์ท็อป) ไม่ยอมแสดงในกรอบ
   โหลดไลบรารีตอนเปิดดูเอกสารครั้งแรกเท่านั้น ไม่ถ่วงตอนเปิดแอป */
let _pdfjsPromise = null;
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjsPromise) return _pdfjsPromise;
  const BASE = "https://unpkg.com/pdfjs-dist@3.11.174/build/";
  _pdfjsPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = BASE + "pdf.min.js";
    s.onload = () => {
      if (!window.pdfjsLib) { rej(new Error("no pdfjsLib")); return; }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "pdf.worker.min.js";
      res(window.pdfjsLib);
    };
    s.onerror = () => { _pdfjsPromise = null; rej(new Error("load fail")); };
    document.head.appendChild(s);
  });
  return _pdfjsPromise;
}
const PDF_MAX_PAGES = 12;
function PdfPreview({ data, onOpen }) {
  const wrap = React.useRef(null);
  const [state, setState] = React.useState("loading");   // loading | ok | error
  React.useEffect(() => {
    let dead = false;
    const el = wrap.current;
    if (!el || !data) return;
    el.innerHTML = "";
    setState("loading");
    loadPdfJs()
      .then((lib) => {
        const b64 = String(data).split(",")[1] || "";
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return lib.getDocument({ data: arr }).promise;
      })
      .then(async (pdf) => {
        const width = el.clientWidth || 800;
        for (let p = 1; p <= Math.min(pdf.numPages, PDF_MAX_PAGES); p++) {
          if (dead) return;
          const page = await pdf.getPage(p);
          const v1 = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: Math.min(3, (width / v1.width) * 1.6) });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width; canvas.height = vp.height;
          canvas.style.cssText = "width:100%;height:auto;display:block;border:1px solid var(--border);border-radius:12px;background:#fff;margin-bottom:10px";
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        }
        if (!dead) setState("ok");
      })
      .catch(() => { if (!dead) setState("error"); });
    return () => { dead = true; };
  }, [data]);
  return (
    <div>
      {state === "loading" && <div style={{ padding: 18, textAlign: "center", fontSize: 12.5, color: "var(--text-3)" }}>กำลังเปิดเอกสาร…</div>}
      {state === "error" && (
        <div style={{ padding: 14, borderRadius: 12, border: "1px dashed var(--border-strong)", background: "var(--surface2)",
          fontSize: 12.5, color: "var(--text-2)", textAlign: "center" }}>
          แสดงในหน้านี้ไม่ได้ (ต่ออินเทอร์เน็ตไม่ได้) — <span onClick={onOpen} style={{ color: "var(--primary-dark)", fontWeight: 700, cursor: "pointer" }}>กดเปิดเต็มจอแทน</span>
        </div>
      )}
      <div ref={wrap} />
    </div>
  );
}

/* ── รายละเอียดอุปกรณ์ 1 รายการ ──
   รับ / เบิก / คืน ย้ายมาอยู่ในนี้ ต้องกดเข้ามาก่อนถึงจะทำได้
   จากหน้าตารางเดิมปุ่มอยู่ติดกันในแถวแคบ ๆ กดพลาดข้ามรายการได้ง่าย */
function ItemDetailModal({ item, img, variants, loadDoc, setDoc, onMove, onEdit, onClose, onPickVariant, onAddSize }) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const c = SF.STOCK_CAT_BY[item.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
  const st = lowState(item);
  /* สเปคที่กรอกไว้จริงเท่านั้น — ช่องที่ว่างไม่ต้องขึ้นมาเกะหน้า */
  const SPEC_FIELDS = [
    { k: "wp", th: "กำลังไฟ (Wp)" }, { k: "voc", th: "Voc (V)" }, { k: "isc", th: "Isc (A)" },
    { k: "vmp", th: "Vmp (V)" }, { k: "imp", th: "Imp (A)" }, { k: "frame", th: "เฟรม (mm)" },
    { k: "width", th: "กว้าง (ม.)" }, { k: "length", th: "ยาว (ม.)" },
    { k: "tcVoc", th: "TC Voc (%/°C)" }, { k: "tcIsc", th: "TC Isc (%/°C)" }, { k: "tcPmax", th: "TC Pmax (%/°C)" },
    { k: "noct", th: "NOCT (°C)" }, { k: "maxPv", th: "PV สูงสุด (kW)" }, { k: "mppt", th: "MPPT" },
  ];
  const specs = SPEC_FIELDS.filter((f) => item[f.k] != null && item[f.k] !== "" && +item[f.k] !== 0);

  /* เอกสาร DATA SHEET — ดึงตอนเปิดหน้านี้ ไม่ได้โหลดมากับรายการทั้งคลัง */
  const [doc, setDocState] = React.useState(undefined);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);
  React.useEffect(() => {
    let dead = false;
    if (!item.doc) { setDocState(null); return; }
    if (loadDoc) loadDoc(item.id).then((d) => { if (!dead) setDocState(d); });
    return () => { dead = true; };
  }, [item.id, item.doc && item.doc.name]);
  /* แปลงเป็น blob URL ครั้งเดียว แล้วฝังให้ดูในหน้านี้เลย ไม่ต้องกดเปิดแท็บใหม่
     (คืน URL ทิ้งตอนปิด/เปลี่ยนไฟล์ ไม่ให้หน่วยความจำค้าง) */
  const [docUrl, setDocUrl] = React.useState("");
  React.useEffect(() => {
    if (!doc || !doc.data) { setDocUrl(""); return; }
    const url = window.dataUrlToBlobUrl(doc.data);
    setDocUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [doc && doc.data]);
  const isDocImg = !!(doc && /^image\//.test(doc.type || ""));
  const openDoc = () => { if (docUrl) window.open(docUrl, "_blank", "noopener"); };
  const pickDoc = (file) => {
    if (!file) return;
    setBusy(true);
    window.readFileAsDataURL(file).then((data) => {
      setDoc(item.id, { name: file.name, size: file.size, type: file.type || "application/pdf", data: data });
      setDocState({ name: file.name, size: file.size, type: file.type, data: data });
      setBusy(false);
    }).catch(() => { setBusy(false); alert("อ่านไฟล์ไม่สำเร็จ"); });
  };
  const kb = (n) => (n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

  /* ข้อมูลย่อย — อยู่ท้ายหน้า ไม่แย่งที่กับชื่อ/ราคา/คงเหลือ ที่เปิดเข้ามาดู */
  const mainCat = SF.STOCK_CAT_BY[SF.mainCatOf(item.cat)] || c;
  const info = [
    { k: "หน่วยนับ", v: item.unit || "—" },
    { k: "ขั้นต่ำแจ้งเตือน", v: (+item.min || 0).toLocaleString() + " " + (item.unit || ""), mono: true },
    { k: "ที่จัดเก็บ", v: item.loc || "—" },
    { k: "ชื่อเดิม / ชื่อพ้อง", v: (item.aka || []).join(" · ") || "—" },
  ];
  const priceTxt = +item.price > 0 ? (+item.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : null;
  const sectionLabel = { fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110,
      display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18,
        width: isMobile ? "100%" : "min(1280px,100%)", maxHeight: isMobile ? "94dvh" : "94vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}>

        {/* หัว — เหลือแค่ทางเดินของหมวด ชื่อสินค้าไปอยู่ตัวใหญ่ข้างใน */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ minWidth: 0, flex: 1, fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: mainCat.color, fontWeight: 700 }}>{mainCat.th}</span>
            {mainCat.key !== c.key ? <span> › {c.th}</span> : null}
          </span>
          <button onClick={onClose} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ padding: isMobile ? 16 : 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* สองคอลัมน์แบบหน้าสินค้า — ซ้ายรูปใหญ่ ขวาข้อมูล+ราคา+ปุ่ม */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,540px) minmax(0,1fr)", gap: isMobile ? 16 : 28 }}>
            <div>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden",
                aspectRatio: "1 / 1", display: "grid", placeItems: "center", padding: 16, position: "relative" }}>
                <MatThumb src={img} item={item} size={"100%"} radius={0} />
                {st !== "ok" && (
                  <span style={{ position: "absolute", top: 12, left: 12, fontSize: 11, fontWeight: 800, padding: "5px 11px", borderRadius: 99,
                    background: st === "out" ? "#EF4444" : "#F59E0B", color: "#fff" }}>{st === "out" ? "หมดสต็อก" : "ต่ำกว่าขั้นต่ำ"}</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              {(item.brand || "").trim() && (
                <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", padding: "4px 11px",
                  borderRadius: 6, background: mainCat.color + "18", color: mainCat.color }}>{item.brand}</span>
              )}
              <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 25, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, letterSpacing: "-.01em" }}>{item.name}</h2>
              {(item.model || "").trim() && (
                <div style={{ fontSize: 13.5, color: "var(--text-2)", fontWeight: 600 }}>รุ่น {item.model}</div>
              )}
              {(item.desc || "").trim() && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{item.desc}</p>
              )}
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-3)" }}>รหัสวัสดุ : {item.sku || "—"}</div>

              {/* เลือกขนาด — ของชนิดเดียวกันที่มีหลายขนาด กดสลับดูได้เลย
                  แต่ละขนาดยังเป็นคนละรายการในคลัง (คนละรหัส/ราคา/สต็อก) เหมือนเดิม */}
              {(variants || []).length > 1 && (
                <div>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 6 }}>
                    ขนาด <span style={{ color: "var(--text-3)", fontWeight: 600 }}>({variants.length} ขนาด)</span>
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {variants.map((v) => {
                      const on = v.it.id === item.id;
                      const vs = lowState(v.it);
                      return (
                        <button key={v.it.id} onClick={() => !on && onPickVariant && onPickVariant(v.it)}
                          title={v.it.name + (vs === "out" ? " · หมดสต็อก" : "")}
                          style={{ padding: "6px 13px", borderRadius: 9, cursor: on ? "default" : "pointer", fontFamily: "inherit",
                            fontSize: 12.5, fontWeight: 700, border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                            background: on ? "var(--primary)18" : "var(--surface)",
                            color: on ? "var(--primary-dark)" : (vs === "out" ? "var(--text-3)" : "var(--text-2)"),
                            textDecoration: vs === "out" ? "line-through" : "none" }}>
                          {v.size}
                        </button>
                      );
                    })}
                    {onAddSize && (
                      <button onClick={onAddSize} title="เพิ่มขนาดใหม่ให้ของชิ้นนี้"
                        style={{ padding: "6px 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                          border: "1px dashed var(--border-strong)", background: "var(--surface2)", color: "var(--text-3)" }}>＋ เพิ่มขนาด</button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: "var(--border)" }} />

              {/* ราคา + คงเหลือ — สองตัวเลขที่คนเปิดเข้ามาหา จึงใหญ่สุดในหน้า */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" }}>
                <span>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 2 }}>ราคาทุน/หน่วย</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, letterSpacing: "-.03em",
                    color: priceTxt ? "var(--primary-dark)" : "var(--text-3)" }}>
                    {priceTxt ? "฿" + priceTxt : "—"}
                  </span>
                  {priceTxt && <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 3 }}>/{item.unit}</span>}
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 2 }}>คงเหลือ</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 30, fontWeight: 700, letterSpacing: "-.03em", color: STOCK_COLORS[st] }}>
                    {(+item.qty || 0).toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 3 }}>{item.unit}</span>
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 9 }}>
                {["in", "out", "return"].map((k) => {
                  const mt = MOVE_TYPES[k];
                  return (
                    <button key={k} onClick={() => onMove(k)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "13px 8px", borderRadius: 12,
                        border: "1px solid " + mt.accent + "44", background: mt.bg, color: mt.color,
                        fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      <span style={{ fontSize: 19, lineHeight: 1 }}>{mt.sym}</span>
                      {mt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 1, background: "var(--border)",
                border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                {info.map((r) => (
                  <span key={r.k} style={{ background: "var(--surface)", padding: "9px 12px", display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>{r.k}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", textAlign: "right",
                      minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: r.mono ? "var(--mono)" : "inherit" }} title={String(r.v)}>{r.v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {specs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>สเปคอุปกรณ์</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {specs.map((f) => (
                  <div key={f.k} style={{ padding: "8px 10px", borderRadius: 10, background: "var(--surface2)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{f.th}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", marginTop: 2 }}>{item[f.k]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DATA SHEET — แนบไฟล์ PDF ของผู้ผลิต ไว้เปิดดูหน้างานได้เลย */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>DATA SHEET / เอกสาร</span>
            {doc && doc.data ? (
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: 12,
                background: "var(--surface2)", border: "1px solid var(--border)" }}>
                <span style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
                  background: "#EF444414", color: "#EF4444", fontSize: 10, fontWeight: 800 }}>PDF</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{kb(doc.size || 0)}</span>
                </span>
                <button onClick={openDoc} style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)",
                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>เปิดเต็มจอ</button>
                <button onClick={() => { if (confirm("ลบเอกสารนี้?")) { setDoc(item.id, null); setDocState(null); } }}
                  title="ลบ" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border-strong)",
                    background: "var(--surface)", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 12px", borderRadius: 12,
                  border: "1px dashed var(--border-strong)", background: "var(--surface2)", color: "var(--text-2)",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: busy ? "wait" : "pointer", width: "100%" }}>
                <Icon name="plus" size={14} color="var(--text-2)" />
                {busy ? "กำลังอัปโหลด…" : (item.doc ? "กำลังโหลดเอกสาร…" : "แนบ DATA SHEET (PDF)")}
              </button>
            )}
            {/* แสดงเอกสารในหน้านี้เลย — ไม่ต้องกดเปิดแท็บใหม่ */}
            {doc && doc.data && (isDocImg
              ? <img src={docUrl} alt={doc.name} style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", display: "block" }} />
              : <PdfPreview data={doc.data} onOpen={openDoc} />)}
            <input ref={fileRef} type="file" accept="application/pdf,image/*" style={{ display: "none" }}
              onChange={(e) => { pickDoc(e.target.files && e.target.files[0]); e.target.value = ""; }} />
          </div>
        </div>

        <div style={{ padding: "13px 22px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex",
          gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          {/* เพิ่มขนาดใหม่ให้ของชิ้นนี้ — ก๊อปชื่อ/หมวด/ยี่ห้อ/หน่วยไปให้แล้ว เหลือแก้ตัวเลขขนาดกับราคา */}
          {onAddSize && (
            <button onClick={onAddSize} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 11,
              marginRight: "auto", border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มขนาด
            </button>
          )}
          <button onClick={onEdit} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 11,
            border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit",
            fontSize: 13, fontWeight: 700, cursor: "pointer" }}><Icon name="settings" size={14} color="var(--text-2)" /> แก้ไขรายการ</button>
        </div>
      </div>
    </div>
  );
}

/* ── เติมยี่ห้อ/รุ่นจากชื่อวัสดุ ──
   ของเดิมในคลังส่วนใหญ่เขียนยี่ห้อกับรุ่นไว้ในชื่ออยู่แล้ว (เช่น "... THAI PP-R รุ่น D25 ...")
   ระบบอ่านออกมาให้ดูก่อนทั้งหมด ติ๊กเลือกได้ทีละรายการ แล้วค่อยกดบันทึก
   ของที่กรอกยี่ห้อ/รุ่นไว้เองแล้ว จะไม่ถูกแตะ · ของโหลที่ไม่มียี่ห้อจริง ๆ ก็ไม่ขึ้นในลิสต์ */
function FillVariantModal({ items, onApply, onClose }) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const rows = React.useMemo(() => (items || [])
    .filter((it) => !String(it.brand || "").trim() && !String(it.model || "").trim())
    .map((it) => ({ it: it, g: SF.guessVariant(it.name) }))
    .filter((r) => r.g && (r.g.brand || r.g.model)), [items]);
  const [off, setOff] = React.useState({});   // ติ๊กออก = ไม่เอารายการนั้น
  const on = (id) => !off[id];
  const toggle = (id) => setOff((p) => Object.assign({}, p, { [id]: !p[id] }));
  const picked = rows.filter((r) => on(r.it.id));
  const apply = () => onApply(picked.map((r) => Object.assign({}, r.it, { brand: r.g.brand, model: r.g.model })));
  const skipped = (items || []).length - rows.length;
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 120,
      display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18,
        width: isMobile ? "100%" : "min(720px,100%)", maxHeight: isMobile ? "92dvh" : "88vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>เติมยี่ห้อ/รุ่นจากชื่อวัสดุ</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>
            อ่านยี่ห้อกับรุ่นจากชื่อที่มีอยู่แล้ว — ดูให้ครบก่อนกดบันทึก อันไหนไม่ถูกติ๊กออกได้
            {skipped > 0 ? " · อีก " + skipped.toLocaleString() + " รายการไม่ขึ้นในลิสต์ เพราะกรอกไว้แล้ว หรือเป็นของโหลที่ไม่มียี่ห้อ" : ""}
          </div>
        </div>
        <div style={{ overflowY: "auto", padding: rows.length ? 0 : 20 }}>
          {rows.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>ไม่มีรายการที่อ่านยี่ห้อ/รุ่นจากชื่อได้ — กรอกเองได้ที่ปุ่มแก้ไขของแต่ละรายการ</div>
          ) : rows.map((r) => (
            <label key={r.it.id} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1.5fr) minmax(0,1fr)", gap: 10,
              alignItems: "center", padding: "9px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
              <input type="checkbox" checked={on(r.it.id)} onChange={() => toggle(r.it.id)} style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--text-1)", lineHeight: 1.35 }}>{r.it.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>{r.it.sku}</span>
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {r.g.brand && <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--primary-dark)", background: "var(--primary-soft)", borderRadius: 99, padding: "2px 9px" }}>{r.g.brand}</span>}
                {r.g.model && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 99, padding: "2px 9px" }}>{r.g.model}</span>}
              </span>
            </label>
          ))}
        </div>
        <div style={{ padding: "13px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex",
          gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>เลือกไว้ {picked.length} / {rows.length} รายการ</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "9px 15px", borderRadius: 11, border: "1px solid var(--border-strong)",
              background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
            <button disabled={!picked.length} onClick={apply}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 11, border: 0,
                background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                cursor: picked.length ? "pointer" : "default", opacity: picked.length ? 1 : .5 }}>
              <Icon name="check" size={15} color="#fff" /> บันทึก {picked.length} รายการ
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── รูปสินค้า ──
   ไม่มีรูป = แสดงกล่องสีของหมวด + ตัวอักษรแรกของชื่อ ให้ยังกวาดตาหาของเจอ ไม่ใช่ช่องว่างเปล่า */
function MatThumb({ src, item, size, radius }) {
  const SF = window.SF;
  const s = size || 44;
  const c = (SF.STOCK_CAT_BY[(item || {}).cat] || {}).color || "#94A3B8";
  const box = { width: s, height: s, borderRadius: radius != null ? radius : 9, flexShrink: 0,
    overflow: "hidden", display: "grid", placeItems: "center", background: "var(--surface2)",
    border: "1px solid var(--border)" };
  if (src) return <span style={box}><img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} /></span>;
  const ch = String((item || {}).name || "?").trim().charAt(0).toUpperCase();
  return (
    <span style={Object.assign({}, box, { background: c + "14", borderColor: c + "33" })}>
      {/* size อาจส่งมาเป็น "100%" (กรอบยืดเต็มพื้นที่) — คิดขนาดตัวอักษรไม่ได้ ใช้ค่ากลางแทน */}
      <span style={{ fontSize: typeof s === "number" ? Math.round(s * 0.36) : 34, fontWeight: 800, color: c }}>{ch}</span>
    </span>
  );
}

/* ── มุมมองการ์ด (เดสก์ท็อป) ── หน้าตาแบบแคตตาล็อกร้านวัสดุ: รูป · ยี่ห้อ · ชื่อ · รหัส · ราคา */
function StockGrid({ rows, imgs, onOpen, onEdit, onRemove, lowState }) {
  const SF = window.SF;
  const baht = (v) => "฿" + (+v).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
      {(rows || []).map((r) => {
        const it = r.it;
        const g = r.sizes && r.sizes.length > 1 ? groupSummary(r.sizes) : null;
        const st = g ? g.st : lowState(it);
        const c = SF.STOCK_CAT_BY[it.cat] || {};
        return (
          <div key={it.id} onClick={() => onOpen(it)} title={g ? "กดเพื่อเลือกขนาด" : "กดเพื่อดูรายละเอียด · รับ / เบิก / คืน"}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden",
              cursor: "pointer", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ position: "relative", background: "var(--surface2)", aspectRatio: "1 / 1", display: "grid", placeItems: "center", padding: 10 }}>
              <MatThumb src={imgs[it.id]} item={it} size={"100%"} radius={0} />
              {st !== "ok" && (
                <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
                  background: st === "out" ? "#EF4444" : "#F59E0B", color: "#fff" }}>{st === "out" ? "หมดสต็อก" : "ต่ำกว่าขั้นต่ำ"}</span>
              )}
              {g && (
                <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
                  background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text-2)" }}>{g.n} ขนาด</span>
              )}
            </div>
            <div style={{ padding: "10px 11px 11px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              {(it.brand || "").trim() && <div style={{ fontSize: 10.5, fontWeight: 800, color: c.color || "var(--text-2)", letterSpacing: ".03em" }}>{it.brand}</div>}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.35,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g ? baseLabel(it.name) : it.name}</div>
              {/* กลุ่มขนาด: โชว์ขนาดที่มีแทนรหัสวัสดุ (แต่ละขนาดคนละรหัสอยู่แล้ว) */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {g ? g.sizes.join(" · ") : it.sku}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 7, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 800,
                  color: (g ? g.max : +it.price) > 0 ? "var(--text-1)" : "var(--text-3)" }}>
                  {g
                    ? (g.max > 0 ? (g.min === g.max ? baht(g.min) : baht(g.min) + "–" + (+g.max).toLocaleString(undefined, { maximumFractionDigits: 2 })) : "–")
                    : (+it.price > 0 ? baht(it.price) : "–")}
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)" }}>{it.unit ? "/" + it.unit : ""}</span>
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                  color: st === "out" ? "#EF4444" : (st === "low" ? "#F59E0B" : "var(--text-2)") }}>
                  เหลือ {(g ? g.qty : +it.qty || 0).toLocaleString()}
                </span>
              </div>
              {/* การ์ดรวมขนาดไม่มีปุ่มแก้ไข/ลบ — ต้องเลือกขนาดก่อนถึงจะรู้ว่าจะแก้ตัวไหน */}
              {g ? (
                <div style={{ marginTop: 7, height: 28, borderRadius: 7, background: "var(--primary-soft)", color: "var(--primary-dark)",
                  fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center" }}>เลือกขนาด</div>
              ) : (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 5, marginTop: 7 }}>
                  <button onClick={() => onEdit(it)} title="แก้ไข" style={{ flex: 1, height: 28, background: "#3B82F614", border: "none", color: "#3B82F6", borderRadius: 7, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={13} /></button>
                  <button onClick={() => { if (confirm('ลบ "' + it.name + '" ?')) onRemove(it.id); }} title="ลบ" style={{ width: 32, height: 28, background: "#EF444414", border: "none", color: "#EF4444", borderRadius: 7, cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ช่องใส่รูปสินค้า — ย่อเหลือ 600px ก่อนเก็บ ไม่ให้ฐานข้อมูลบวม */
function MatImagePicker({ src, item, onPick, onClear }) {
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef(null);
  const take = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    setBusy(true);
    window.resizeImageFile(file, 600, 0.72).then((d) => { onPick(d); setBusy(false); })
      .catch(() => { setBusy(false); alert("อ่านไฟล์รูปไม่สำเร็จ"); });
  };
  /* วางรูปจากคลิปบอร์ด — ก๊อปรูปจากเว็บผู้ขายมาแปะได้เลย ไม่ต้องเซฟไฟล์ก่อน
     ดักที่ระดับ document ตอนหน้าต่างนี้เปิดอยู่ จะได้ไม่ต้องคลิกให้ถูกช่องก่อน */
  React.useEffect(() => {
    const onPaste = (e) => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < items.length; i++) {
        if (/^image\//.test(items[i].type)) { const f = items[i].getAsFile(); if (f) { e.preventDefault(); take(f); return; } }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <MatThumb src={src} item={item} size={72} />
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => ref.current && ref.current.click()}
            style={{ padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)",
              color: "var(--text-1)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "กำลังย่อรูป…" : (src ? "เปลี่ยนรูป" : "เลือกรูป")}
          </button>
          {src && (
            <button type="button" onClick={onClear}
              style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)",
                color: "#EF4444", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบรูป</button>
          )}
        </div>
        <span style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.45 }}>
          ย่อให้เหลือ 600px อัตโนมัติ — วางรูปจากคลิปบอร์ดในช่องนี้ก็ได้
        </span>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { take(e.target.files && e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
}

/* ── การ์ดหมวด ──
   รูปประจำหมวดเลือกใส่เอง (เก็บที่ stockImg/cat_<key> เหมือนรูปสินค้า)
   ยังไม่ใส่ก็ขึ้นไอคอนประจำหมวดไปก่อน */
function CatCard({ c, n, lowN, img, onPick, onImage }) {
  const ref = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const take = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    setBusy(true);
    window.resizeImageFile(file, 600, 0.72).then((d) => { onImage(d); setBusy(false); })
      .catch(() => { setBusy(false); alert("อ่านไฟล์รูปไม่สำเร็จ"); });
  };
  const btn = { padding: "3px 9px", borderRadius: 99, border: "1px solid var(--border-strong)", background: "var(--surface)",
    fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, cursor: busy ? "wait" : "pointer", color: "var(--text-2)" };
  return (
    <div onClick={() => onPick(c.key)}
      style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: 14, boxShadow: "var(--shadow-sm)" }}>
      <span style={{ width: 76, height: 76, borderRadius: 12, flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center",
        background: img ? "var(--surface2)" : c.color + "16", border: "1px solid " + (img ? "var(--border)" : c.color + "33") }}>
        {img
          ? <img src={img} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          : <Icon name={c.icon || "box"} size={30} color={c.color} />}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3 }}>{c.th}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
          {(n || 0).toLocaleString()} รายการ
          {lowN ? <span style={{ color: "#EF4444", fontWeight: 700 }}>{" · ของขาด " + lowN}</span> : null}
        </span>
        {/* ปุ่มรูป — กดแล้วไม่เข้าไปในหมวด (stopPropagation) */}
        <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 5, marginTop: 7 }}>
          <button type="button" disabled={busy} style={btn} onClick={() => ref.current && ref.current.click()}>
            {busy ? "กำลังย่อรูป…" : (img ? "เปลี่ยนรูป" : "ใส่รูป")}
          </button>
          {img && <button type="button" style={Object.assign({}, btn, { color: "#EF4444" })} onClick={() => onImage("")}>ลบรูป</button>}
        </span>
      </span>
      <Icon name="chevronDown" size={16} color="var(--text-3)" style={{ transform: "rotate(-90deg)", flexShrink: 0 }} />
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { take(e.target.files && e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
}

/* ── หน้าเลือกหมวด ──
   ใช้ทั้งชั้นหมวดหลัก และชั้นหมวดย่อย (กดหมวดหลักที่มีหมวดย่อย → เจอหน้านี้อีกที) */
function CatBrowser({ list, count, low, imgs, title, hint, allLabel, onPick, onAll, onBack, onSetImage }) {
  const shown = list || [];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        {onBack && (
          <button onClick={onBack} title="กลับไปหน้าหมวดหลัก"
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
              background: "var(--surface2)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: "rotate(90deg)" }} />ย้อนกลับ
          </button>
        )}
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{title}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{hint}</span>
        <button onClick={onAll} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 9, border: "1px solid var(--border-strong)",
          background: "var(--surface2)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          {allLabel || "ดูทุกรายการ"}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
        {shown.map((c) => (
          <CatCard key={c.key} c={c} n={count[c.key]} lowN={low[c.key]} img={imgs["cat_" + c.key]}
            onPick={onPick} onImage={(d) => onSetImage(c.key, d)} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { StockView });
