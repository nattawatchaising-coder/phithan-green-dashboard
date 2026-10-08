/* ============================================================
   SolarFlow — Inventory / Stock view (built-in stock control)
   ============================================================ */

function lowState(it) {
  if (it.qty <= 0) return "out";
  if (it.qty <= it.min) return "low";
  return "ok";
}
const STOCK_COLORS = { out: "#EF4444", low: "#F59E0B", ok: "#1B9B75" };

/* ── ของชนิดเดียวกันแต่คนละขนาด ──
   ในคลังยังเก็บแยกรายการเหมือนเดิม (คนละรหัส คนละราคา คนละสต็อก)
   แต่ตอนเปิดดูจะจับมารวมเป็นปุ่มเลือกขนาดให้ ไม่ต้องปิดแล้วไปหาตัวอื่น
   จับขนาดจากชื่อ: 20mm. · 1/2" · 25 มม. · 1x2.5 sq.mm · 2x4 · แอมป์เบรกเกอร์ 25A / 16AT (ไม่จับ 30mA · 36kA · 100AF) */
const SIZE_RE = /(\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?|mm\.?|มม\.?)?)|(\d+[\s-]\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?))|(\d+(?:\.\d+)?\s*(?:mm\.?|มม\.?|"|″|นิ้ว))|(\b\d+(?:\.\d+)?AT?\b)/i;
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
  in:     { key: "in",     label: "รับเข้า",  sym: "+", color: "var(--tint-ok-tx)", accent: "#1B9B75", bg: "#1B9B7516", title: "รับเข้าคลัง",      sub: "เพิ่มสต็อกจากการสั่งซื้อ" },
  out:    { key: "out",    label: "เบิกออก",  sym: "−", color: "#6645e0", accent: "#7C5CFC", bg: "#7C5CFC16", title: "เบิกออกหน้างาน",   sub: "เลือกงานที่นำไปใช้" },
  return: { key: "return", label: "คืนของ",  sym: "↩", color: "#0784b8", accent: "#0EA5E9", bg: "#0EA5E916", title: "คืนของเข้าคลัง",   sub: "คืนอุปกรณ์ที่เบิกจากงาน" },
};

function StockKpi({ label, value, unit, icon, accent, sub, active, onClick }) {
  const [hov, setHov] = React.useState(false);
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: active ? accent + "0e" : "var(--surface)",
        border: "none",
        borderRadius: mob ? 14 : 16, padding: mob ? 14 : 18,
        boxShadow: active ? "inset 0 0 0 1px " + accent + ", 0 0 0 3px " + accent + "22" : hov ? "inset 0 0 0 1px " + accent + ", 0 4px 12px rgba(0,0,0,.08)" : "var(--shadow-sm)",
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

function StockView({ stock, onResetAll, onMenuOpen, currentUser, jobs, priceStore, ampStore, condStore, omStore, rulesStore, canManagePrices }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const byName = (currentUser && currentUser.name) || "-";
  const [tab, setTab] = React.useState("stock"); // "stock" | "prices" | "rules"
  const isPrices = tab === "prices" && canManagePrices;
  /* แท็บ "ตั้งค่าคำนวณ BOQ" รวมพิกัดสาย · ท่อ/รางไฟ · O&M และเงื่อนไขที่เคยฝังในโค้ด ไว้หน้าเดียว
     isAmp/isCond/isOm คงชื่อเดิมไว้ซ่อนตัวกรองหมวด/ปุ่มบนหัวจอ (ทั้งสามเป็นจริงพร้อมกันเมื่ออยู่แท็บนี้) */
  const isRules = tab === "rules" && canManagePrices;
  const isAmp = isRules, isCond = isRules, isOm = isRules;
  const [cat, setCat] = React.useState("all");
  const [sub, setSub] = React.useState("all");   // หมวดย่อยภายในหมวดหลักที่เลือก
  const [grp, setGrp] = React.useState("all");   // กลุ่มหมวดย่อย (DC / AC) ใต้หมวดหลัก — ช่อง grp ของหมวดย่อยใน stockCats
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
  const [series, setSeries] = React.useState("all");  // กลุ่มรุ่นใต้ยี่ห้อ (it.series เช่น CVS / EZC100H)
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
    if (series !== "all" && !search.trim() && !kpiFilter) { setSeries("all"); setBrowse(true); return; }
    if (brand !== "all" && !search.trim() && !kpiFilter) { setBrand("all"); setBrowse(true); return; }
    if (sub !== "all") { setSub("all"); setBrowse(true); return; }
    if (grp !== "all") { setGrp("all"); setBrowse(true); return; }
    if (cat !== "all") { setCat("all"); setBrowse(true); return; }
    setBrowse(true); setKpiFilter(null); setSearch(""); setBrand("all");
  };
  const subLow = React.useMemo(() => {
    const m = {};
    items.forEach((it) => { if (lowState(it) !== "ok" && SF.mainCatOf(it.cat) !== it.cat) m[it.cat] = (m[it.cat] || 0) + 1; });
    return m;
  }, [items]);
  // เปลี่ยนหมวดหลัก / หมวดย่อยหายไป → รีเซ็ตตัวกรองย่อย ไม่ให้ค้างจนตารางว่างโดยไม่รู้สาเหตุ
  React.useEffect(() => { setSub("all"); setGrp("all"); }, [cat]);
  React.useEffect(() => { setSeries("all"); }, [cat, sub, brand]);
  React.useEffect(() => { if (sub !== "all" && !subChips.some((c) => c.key === sub)) setSub("all"); }, [subChips.length]);
  /* ตัวเลือกยี่ห้อ/รุ่น — นับจากของที่ผ่านตัวกรอง "หมวด" แล้ว
     เลือกยี่ห้อก่อน แถวรุ่นถึงจะขึ้น เพราะรุ่นของคนละยี่ห้อไม่ควรปนกัน */
  const brandCount = React.useMemo(() => {
    const m = {};
    items.forEach((it) => {
      if (cat !== "all" && it.cat !== cat && SF.mainCatOf(it.cat) !== cat) return;
      if (sub !== "all" && it.cat !== sub) return;
      const b = it.brand || ""; if (!b.trim()) return;
      m[b] = (m[b] || 0) + 1;
    });
    return m;
  }, [items, cat, sub]);
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
    if (grp !== "all" && sub === "all" && stockGrpOf(it.cat) !== grp) return false;
    if (brand !== "all" && (it.brand || "") !== brand) return false;
    if (series !== "all" && (it.series || "") !== series) return false;
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
      warY: +it.warY || 0, warPerfY: +it.warPerfY || 0, warNote: it.warNote || "",
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
  /* หน้าเลือกหมวดย่อย: หมวดย่อยที่ติดกลุ่ม (grp เช่น DC / AC) ยุบเป็นการ์ดกลุ่มเดียว กดแล้วเจอหมวดย่อยในกลุ่ม
     หมวดย่อยที่ไม่มีกลุ่ม (ตู้ไฟ · รอลบ) ขึ้นเป็นการ์ดตามเดิม ต่อท้ายการ์ดกลุ่ม */
  const subHome = React.useMemo(() => {
    if (grp !== "all") return { list: subChips.filter((c) => (c.grp || "") === grp), count: subCount, low: subLow };
    const gl = [], rest = [], count = Object.assign({}, subCount), low = Object.assign({}, subLow);
    subChips.forEach((c) => {
      const g = c.grp || "";
      if (!g) { rest.push(c); return; }
      const k = "grp_" + cat + "_" + g;
      if (!gl.some((x) => x.key === k)) {
        const d = STOCK_GRPS[g] || { th: g, color: "#0891B2" };
        gl.push({ key: k, th: d.th, color: d.color, icon: "bolt", grpOf: g });
        count[k] = 0; low[k] = 0;
      }
      count[k] += subCount[c.key] || 0; low[k] += subLow[c.key] || 0;
    });
    return { list: gl.concat(rest), count: count, low: low };
  }, [grp, cat, subChips, subCount, subLow]);
  // ของที่อยู่ในหมวดหลักตรง ๆ (ไม่ได้ใส่หมวดย่อยไว้) — เอาไปต่อท้ายหน้าเลือกหมวดย่อย
  const directItems = showSubHome ? filtered.filter((it) => it.cat === cat) : [];
  /* ชั้นยี่ห้อ — ใต้หมวดย่อย (หรือหมวดหลักที่ไม่มีหมวดย่อย) ที่มีของ ≥ 2 ยี่ห้อ ขึ้นการ์ดยี่ห้อก่อนถึงรายการ
     เหมือนหน้าเลือกหมวด · ไม่ใช่หมวดชั้นที่ 3 ในข้อมูล (ระบบรู้จักหมวดแค่ หลัก › ย่อย) คิดจากช่องยี่ห้อของสินค้า
     ของที่ไม่ระบุยี่ห้อต่อท้ายหน้าเป็นรายการ */
  const brandHome = React.useMemo(() => {
    if (!browsing || cat === "all" || showSubHome) return null;
    const m = {}, low = {}, none = [];
    filtered.forEach((it) => {
      const b = it.brand || "";
      if (!b.trim()) { none.push(it); return; }
      m[b] = (m[b] || 0) + 1;
      if (lowState(it) !== "ok") low[b] = (low[b] || 0) + 1;
    });
    const keys = Object.keys(m).sort((a, z) => a.localeCompare(z, "th"));
    /* ยี่ห้อเดียวก็ขึ้นการ์ดยี่ห้อ ถ้าของในหมวดมีกลุ่มรุ่น (หมวด › ยี่ห้อ › กลุ่มรุ่น ตามที่ผู้ใช้จัด) */
    if (keys.length < 2 && !(keys.length === 1 && filtered.some((it) => (it.series || "").trim()))) return null;
    // รูปการ์ดยี่ห้อ: ตั้งเองที่ cat_brand_<ยี่ห้อ> · ไม่มี = รูปหมวดที่ชื่อตรงกับยี่ห้อ (เช่นหมวดย่อย HUAWEI ใต้อินเวอร์เตอร์)
    const catByName = {};
    SF.STOCK_CATS.concat(Object.keys(SF.STOCK_SUB_BY_CAT || {}).reduce((a, k) => a.concat(SF.STOCK_SUB_BY_CAT[k] || []), []))
      .forEach((c) => { if (c && c.th && imgs["cat_" + c.key]) catByName[String(c.th).trim().toLowerCase()] = imgs["cat_" + c.key]; });
    const list = keys.map((b) => {
      const k = "brand_" + b.trim().toLowerCase().replace(/[.#$\[\]\/\s]+/g, "_");
      return { key: b, th: b, color: "#0EA5E9", icon: "box", imgKey: k, img: imgs["cat_" + k] || catByName[b.trim().toLowerCase()] || "" };
    });
    return { list: list, count: m, low: low, none: none };
  }, [browsing, cat, showSubHome, filtered, imgs]);

  /* ชั้นกลุ่มรุ่น — เลือกยี่ห้อแล้ว ของมีช่อง series (เช่น MCCB › SCHNEIDER › CVS / EZC100H) ขึ้นการ์ดกลุ่มรุ่นก่อนถึงรายการ
     รูปการ์ดตั้งที่ cat_series_<ยี่ห้อ>_<กลุ่ม> · ของที่ไม่ระบุกลุ่มต่อท้ายหน้า */
  const seriesHome = React.useMemo(() => {
    if (isPrices || isAmp || !browse || search.trim() || kpiFilter || brand === "all" || series !== "all") return null;
    const m = {}, low = {}, none = [];
    filtered.forEach((it) => {
      const s = (it.series || "").trim();
      if (!s) { none.push(it); return; }
      m[s] = (m[s] || 0) + 1;
      if (lowState(it) !== "ok") low[s] = (low[s] || 0) + 1;
    });
    const keys = Object.keys(m).sort((a, z) => a.localeCompare(z, "th", { numeric: true }));
    if (!keys.length) return null;
    const list = keys.map((s) => {
      const k = ("series_" + brand + "_" + s).trim().toLowerCase().replace(/[.#$\[\]\/\s]+/g, "_");
      const first = filtered.find((it) => (it.series || "").trim() === s && imgs[it.id]);
      return { key: s, th: s, color: "#0EA5E9", icon: "box", imgKey: k, img: imgs["cat_" + k] || (first ? imgs[first.id] : "") };
    });
    return { list: list, count: m, low: low, none: none };
  }, [isPrices, isAmp, browse, search, kpiFilter, brand, series, filtered, imgs]);

  /* แถวแท็บกับหมวด — อยู่ในเนื้อหา ไม่ใช่ในหัวจอ
     หัวจอเก็บแค่ชื่อหน้ากับเครื่องมือของหน้า ส่วนตัวกรองอยู่ติดกับของที่มันกรอง
     ก้อนนี้ขึ้นเป็นแถวแรกของทุกแท็บ จึงสร้างที่เดียวแล้วส่งไปวาง ไม่ใช่ก๊อบสี่ชุด */
  const filterBar = (
    <div className="content-filters">
          {/* แถวเดียว: แท็บ (ซ้าย) + ปุ่มย่อ/ขยายหมวด (ขวา) */}
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
            {canManagePrices && (
              <React.Fragment>
                <CatChip active={tab === "stock"} onClick={() => setTab("stock")} label="สต็อก" color="#3B82F6" />
                <CatChip active={tab === "prices"} onClick={() => setTab("prices")} label="ราคา BOQ" color="#EC4899" />
                <CatChip active={tab === "rules"} onClick={() => setTab("rules")} label="ตั้งค่าคำนวณ BOQ" color="#F59E0B" />
              </React.Fragment>
            )}
            {/* แท็บสต็อกเลือกหมวดจากการ์ด + เส้นทาง (ย้อนกลับ › หมวด) แล้ว — แถบชิปหมวด/หมวดย่อยเอาออก (ผู้ใช้ ต.ค. 2026) เหลือแค่แท็บราคา BOQ */}
            {!isMobile && isPrices && !isAmp && !isCond && !isOm && (
              <button onClick={toggleCat} title={catOpen ? "ซ่อนตัวกรองหมวด" : "แสดงตัวกรองหมวด"}
                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: "var(--r-pill)",
                  background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)",
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
          {isMobile && !isPrices && !isAmp && !isCond && !isOm && <div style={{ marginTop: 10 }}><CatDropdown cat={cat} setCat={setCat} items={items} cats={SF.STOCK_CATS} /></div>}
          {isMobile && isPrices && <div style={{ marginTop: 10 }}><Dropdown value={priceGrp} onChange={setPriceGrp} options={priceGroups.map((g) => ({ value: g, label: g === "all" ? "ทั้งหมด" : (PG_TH[g] || g) }))} /></div>}
          {/* เดสก์ท็อป: ชิปหมวด — ย่อ/ขยายแบบลื่น (max-height + opacity) */}
          {!isMobile && isPrices && !isAmp && !isCond && !isOm && (
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
  );

  /* สลับมุมมอง การ์ด/ตาราง — อยู่ข้างปุ่ม "ดูทุกรายการ" (หน้าเลือกหมวด) และท้ายแถวเส้นทาง (หน้ารายการ) · ผู้ใช้ ต.ค. 2026 ย้ายลงมาจากหัวจอ
     กดจากหน้าเลือกหมวด = เปิดดูทุกรายการในมุมมองนั้นเลย */
  const viewBtn = (fromBrowse) => isMobile ? null : (
    <button onClick={() => { setView((v) => (v === "grid" ? "table" : "grid")); if (fromBrowse) setBrowse(false); }}
      title={view === "grid" ? "สลับเป็นมุมมองตาราง" : "สลับเป็นมุมมองการ์ด (มีรูป)"}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--r-chip)", border: "none",
        background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
      <Icon name={view === "grid" ? "menu" : "grid"} size={14} color="var(--text-2)" />{view === "grid" ? "ตาราง" : "การ์ด"}
    </button>
  );

  /* หมวด "รอลบ" — ลบทั้งหมวดทีเดียว (ผู้ใช้ ต.ค. 2026: ของที่ย้ายมารอลบมีเป็นร้อย ลบทีละชิ้นไม่ไหว) · ยืนยันก่อนเสมอ · ลบตามตัวกรองที่เห็นอยู่ */
  const delBtn = sub !== "all" && /รอลบ/.test((SF.STOCK_CAT_BY[sub] || {}).th || "") && filtered.length > 0 ? (
    <button onClick={() => {
      const ids = filtered.map((it) => it.id);
      window.askConfirm({ title: "ลบ " + ids.length + " รายการออกจากคลังถาวร?", body: "ทุกรายการในหมวด " + ((SF.STOCK_CAT_BY[sub] || {}).th || "") + (brand !== "all" ? " ยี่ห้อ " + brand : "") + " · ลบแล้วกู้คืนไม่ได้", ok: "ลบทั้งหมด", danger: true })
        .then((ok) => { if (ok) ids.forEach((id) => stock.removeItem(id)); });
    }} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--r-chip)", border: "none",
      background: "var(--tint-red-bg)", color: "var(--tint-red-tx2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
      <Icon name="x" size={14} />ลบทั้งหมด {filtered.length} รายการ
    </button>
  ) : null;

  return (
    <React.Fragment>
      {/* ชิดล่างเท่าหัวจอหน้าอื่น — เมื่อก่อนแถบตัวกรองเคยอยู่ในนี้ มันออกระยะห่างล่างให้เอง
          พอย้ายแถบออกไป หัวจอหน้านี้เตี้ยกว่าหน้าอื่น 18px จึงต้องใส่คืน */}
      <header className="app-header" style={{ paddingBottom: isMobile ? 12 : 18 }}>
        <div className="header-top">
          <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู">
            <Icon name="menu" size={18} color="var(--text-2)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="page-title">{isRules ? "ตั้งค่าคำนวณ BOQ" : isPrices ? "ราคาวัสดุ (BOQ)" : "คลังสินค้า / สต็อก"}</h1>
            {isRules ? (
              <p className="page-sub">เงื่อนไขและตารางที่ใบ BOQ ใช้คิดอุปกรณ์ ราคา และค่าบริการ — ตั้งครั้งเดียวใช้ทั้งบริษัท</p>
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
          {!isAmp && !isOm && (
          <div className="header-actions">
            <div className="search-box">
              <Icon name="search" size={16} color="var(--text-3)" />
              {isPrices
                ? <input value={priceQ} onChange={(e) => setPriceQ(e.target.value)} placeholder="ค้นหา" />
                : <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา" />}
            </div>
            {isPrices ? (
              <button className="btn-add" onClick={() => setAddPriceOpen(true)}>
                <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มวัสดุ</span>
              </button>
            ) : (
              <React.Fragment>
                {/* เติมยี่ห้อ/รุ่นจากชื่อ — ของเดิมส่วนใหญ่เขียนยี่ห้อกับรุ่นไว้ในชื่ออยู่แล้ว
                    ให้ดูรายการที่จะเติมก่อน แล้วค่อยกดยืนยัน ไม่เขียนทับของที่กรอกไว้เอง */}
                <button className="btn-add" onClick={() => setFillOpen(true)}
                  style={{ background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", border: "none" }}>
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
      </header>

      {isRules ? (
        <div className="app-content">
          {filterBar}
          <BoqRulesPage ampStore={ampStore} condStore={condStore} omStore={omStore} rulesStore={rulesStore} isMobile={isMobile} stock={stock} />
        </div>
      ) : isPrices ? (
        <div className="app-content">
          {filterBar}
          <PricePanel priceStore={priceStore} stock={stock} q={priceQ} grp={priceGrp} />
        </div>
      ) : (
      <div className="app-content">
        {filterBar}
        {showCatHome && <BrandMarquee items={items} imgs={imgs} onPick={setBrand} />}

        {/* ── เลือกยี่ห้อ ── วางติดกับรายการเลย เลื่อนมาดูของแล้วยังกดเปลี่ยนได้ ไม่ต้องเลื่อนกลับขึ้นหัวเพจ
            หน้าแรก (เลือกหมวด) ไม่ต้องขึ้น — ยี่ห้อทั้งคลังมี 14 ยี่ห้อ รกเปล่า ๆ กดเข้าหมวดก่อนค่อยโผล่ */}
        {/* แท็บสต็อกเลือกยี่ห้อจากการ์ดยี่ห้อแล้ว — แถบชิปยี่ห้อเอาออก (ผู้ใช้ ต.ค. 2026) */}
        {brandList.length > 0 && !showCatHome && isPrices && (
          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {isMobile ? (
              <Dropdown value={brand} onChange={setBrand}
                options={[{ value: "all", label: "ทุกยี่ห้อ" }].concat(brandList.map((b) => ({ value: b, label: b + " (" + brandCount[b] + ")" })))} />
            ) : (
              <div className="cat-chip-row" style={{ display: "flex", gap: 7, flexWrap: "nowrap", alignItems: "center", overflowX: "auto", paddingBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-3)", whiteSpace: "nowrap", paddingRight: 2 }}>ยี่ห้อ</span>
                  <CatChip active={brand === "all"} onClick={() => setBrand("all")} label="ทุกยี่ห้อ" color="var(--text-2)" />
                {brandList.map((b) => <CatChip key={b} active={brand === b} onClick={() => setBrand(b)} label={b} color="#0EA5E9" count={brandCount[b]} />)}
              </div>
            )}
          </div>
        )}

        <div>
          {/* เส้นทางที่อยู่ + ปุ่มย้อนกลับ — เข้าไปดูของในหมวดแล้วต้องกลับออกมาได้เสมอ */}
          {!isPrices && !isAmp && !showCatHome && !showSubHome && !brandHome && !seriesHome && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
              <button onClick={goBack} title="ย้อนกลับ"
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)",
                  background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: "rotate(90deg)" }} />ย้อนกลับ
              </button>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                <span onClick={() => { setCat("all"); setSub("all"); setBrowse(true); }}
                  style={{ cursor: "pointer", fontWeight: 700, color: "var(--text-2)" }}>คลังทั้งหมด</span>
                {cat !== "all" && <span> › <span style={{ fontWeight: 700, color: sub === "all" && grp === "all" ? "var(--text-1)" : "var(--text-2)", cursor: "pointer" }}
                  onClick={() => { setSub("all"); setGrp("all"); setBrowse(true); }}>{(SF.STOCK_CAT_BY[cat] || {}).th || ""}</span></span>}
                {grp !== "all" && <span> › <span style={{ fontWeight: 700, color: sub === "all" ? "var(--text-1)" : "var(--text-2)", cursor: "pointer" }}
                  onClick={() => { setSub("all"); setBrowse(true); }}>{(STOCK_GRPS[grp] || {}).th || grp}</span></span>}
                {sub !== "all" && <span> › <span style={{ fontWeight: 700, color: brand === "all" ? "var(--text-1)" : "var(--text-2)", cursor: "pointer" }}
                  onClick={() => { setBrand("all"); setBrowse(true); }}>{(SF.STOCK_CAT_BY[sub] || {}).th || ""}</span></span>}
                {brand !== "all" && <span> › <span style={{ fontWeight: 700, color: series === "all" ? "var(--text-1)" : "var(--text-2)", cursor: "pointer" }}
                  onClick={() => { setSeries("all"); setBrowse(true); }}>{brand}</span></span>}
                {series !== "all" && <span> › <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{series}</span></span>}
                <span> · {filtered.length.toLocaleString()} รายการ</span>
              </span>
              <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>{delBtn}{viewBtn(false)}</span>
            </div>
          )}
          {/* stock list — เต็มความกว้าง (มือถือ: card list, เดสก์ท็อป: ตาราง) */}
          {showCatHome ? (
            <CatBrowser list={SF.STOCK_CATS.filter((c) => catCount[c.key])} count={catCount} low={catLow} imgs={imgs}
              title="เลือกหมวดที่ต้องการ"
              hint={SF.STOCK_CATS.filter((c) => catCount[c.key]).length + " หมวด · " + items.length.toLocaleString() + " รายการ"}
              onPick={(k) => setCat(k)} onAll={() => setBrowse(false)} tools={<React.Fragment>{delBtn}{viewBtn(true)}</React.Fragment>} onSetImage={(k, d) => stock.setImage("cat_" + k, d)} />
          ) : showSubHome ? (
            <React.Fragment>
              <CatBrowser list={subHome.list} count={subHome.count} low={subHome.low} imgs={imgs}
                title={((SF.STOCK_CAT_BY[cat] || {}).th || "") + (grp !== "all" ? " › " + ((STOCK_GRPS[grp] || {}).th || grp) : "")}
                hint={subHome.list.length + (grp !== "all" ? " หมวดย่อย · " + filtered.length.toLocaleString() : " หมวด · " + (catCount[cat] || 0).toLocaleString()) + " รายการ"}
                allLabel={grp !== "all" ? "ดูทุกรายการในกลุ่มนี้" : "ดูทุกรายการในหมวดนี้"}
                onPick={(k) => { const x = subHome.list.find((y) => y.key === k); if (x && x.grpOf) setGrp(x.grpOf); else setSub(k); }}
                onAll={() => setBrowse(false)} tools={<React.Fragment>{delBtn}{viewBtn(true)}</React.Fragment>} onBack={() => (grp !== "all" ? setGrp("all") : setCat("all"))}
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
          ) : seriesHome ? (
            <React.Fragment>
              <CatBrowser list={seriesHome.list} count={seriesHome.count} low={seriesHome.low}
                imgs={seriesHome.list.reduce((m, b) => { m["cat_" + b.key] = b.img; return m; }, {})}
                title={brand}
                hint={seriesHome.list.length + " กลุ่มรุ่น · " + filtered.length.toLocaleString() + " รายการ"}
                allLabel="ดูทุกรายการของยี่ห้อนี้"
                onPick={(s) => setSeries(s)} onAll={() => setBrowse(false)} tools={<React.Fragment>{delBtn}{viewBtn(true)}</React.Fragment>} onBack={goBack}
                onSetImage={(s, d) => { const x = seriesHome.list.find((y) => y.key === s); if (x) stock.setImage("cat_" + x.imgKey, d); }} />
              {seriesHome.none.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ไม่ระบุกลุ่มรุ่น</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{seriesHome.none.length.toLocaleString()} รายการ</span>
                  </div>
                  {isMobile
                    ? <StockCardList rows={rowsOf(seriesHome.none)} imgs={imgs} onOpen={setDetailItem}
                        onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />
                    : <StockGrid rows={rowsOf(seriesHome.none)} imgs={imgs} lowState={lowState} onOpen={setDetailItem}
                        onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />}
                </div>
              )}
            </React.Fragment>
          ) : brandHome ? (
            <React.Fragment>
              <CatBrowser list={brandHome.list} count={brandHome.count} low={brandHome.low}
                imgs={brandHome.list.reduce((m, b) => { m["cat_" + b.key] = b.img; return m; }, {})}
                title={(SF.STOCK_CAT_BY[sub !== "all" ? sub : cat] || {}).th || ""}
                hint={brandHome.list.length + " ยี่ห้อ · " + filtered.length.toLocaleString() + " รายการ"}
                allLabel="ดูทุกรายการในหมวดนี้"
                onPick={(b) => setBrand(b)} onAll={() => setBrowse(false)} tools={<React.Fragment>{delBtn}{viewBtn(true)}</React.Fragment>} onBack={goBack}
                onSetImage={(b, d) => { const x = brandHome.list.find((y) => y.key === b); if (x) stock.setImage("cat_" + x.imgKey, d); }} />
              {brandHome.none.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>ไม่ระบุยี่ห้อ</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{brandHome.none.length.toLocaleString()} รายการ</span>
                  </div>
                  {isMobile
                    ? <StockCardList rows={rowsOf(brandHome.none)} imgs={imgs} onOpen={setDetailItem}
                        onEdit={(it) => setItemForm({ item: it, isNew: false })} onRemove={stock.removeItem} />
                    : <StockGrid rows={rowsOf(brandHome.none)} imgs={imgs} lowState={lowState} onOpen={setDetailItem}
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
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--divider)" }}>
                    {/* ไม่มีคอลัมน์ "หมวด" แล้ว เพราะกรองหมวดจากชิปด้านบนได้อยู่แล้ว
                        เอาที่ว่างมาใส่ราคาที่ต้องดูบ่อยกว่าแทน */}
                    {["รายการอุปกรณ์", "ราคา/หน่วย", "คงเหลือ", "ขั้นต่ำ", "ที่จัดเก็บ", "จัดการ"].map((h, i) => (
                      <th key={h} style={{ padding: "12px 12px", fontSize: 10.5, fontWeight: 700,
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
                        style={{ borderBottom: "1px solid var(--divider)", cursor: "pointer",
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
                          <button onClick={() => setItemForm({ item: it, isNew: false })} title="แก้ไข" style={{ background: "#3B82F614", border: "none", color: "#3B82F6", width: 28, height: 28, borderRadius: "var(--r-chip)", cursor: "pointer", verticalAlign: "middle" }}><Icon name="settings" size={14} /></button>
                          <button onClick={() => { askConfirm({ title: "ลบ “" + it.name + "” ออกจากคลัง?" }).then((ok) => { if (ok) stock.removeItem(it.id); }); }} title="ลบ" style={{ background: "var(--tint-red-bg)", border: "none", color: "var(--tint-red-tx2)", width: 28, height: 28, borderRadius: "var(--r-chip)", cursor: "pointer", marginLeft: 4, verticalAlign: "middle" }}><Icon name="x" size={14} /></button>
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
        items={stock.items || []} imgs={imgs} onOpen={setDetailItem}
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
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(680px,100%)", maxHeight: isMobile ? "92dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="history" size={17} color="var(--text-2)" />
              <div>
                <h2 style={{ fontSize: 15.5, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>ความเคลื่อนไหวคลังสินค้า</h2>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>รับเข้า / เบิกออก / คืนของ · ทั้งหมด {all.length} รายการ</div>
              </div>
            </div>
            <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: "var(--r-chip)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
          </div>
          <div className="search-box" style={{ marginTop: 12 }}>
            <Icon name="search" size={15} color="var(--text-3)" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา" />
          </div>
        </div>
        <div style={{ flex: 1, padding: 16, paddingBottom: isMobile ? "calc(16px + env(safe-area-inset-bottom,0px))" : 16, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
          {list.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--text-3)" }}>{all.length === 0 ? "ยังไม่มีความเคลื่อนไหว" : "ไม่พบรายการ"}</div>}
          {list.map((m) => {
            const it = (items || []).find((x) => x.id === m.itemId);
            const mt = MOVE_TYPES[m.type] || MOVE_TYPES.out;
            const job = m.jobId && (jobs || []).find((j) => j.id === m.jobId);
            return (
              <div key={m.id} style={{ display: "flex", gap: 11, padding: "10px 11px", background: "var(--surface2)", borderRadius: "var(--r-tile)" }}>
                <span style={{ width: 30, height: 30, borderRadius: "var(--r-chip)", flexShrink: 0, display: "grid", placeItems: "center", background: mt.bg, color: mt.color, fontWeight: 800, fontSize: 15 }}>{mt.sym}</span>
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
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: mob ? "5px 11px" : "6px 13px", borderRadius: "var(--r-pill)",
      border: "none", background: active ? color + "16" : "var(--surface)", boxShadow: active ? "inset 0 0 0 1px " + color : "var(--shadow-sm)",
      color: active ? color : "var(--text-2)", fontSize: mob ? 11.5 : 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
      {label}
      {count != null && <span style={{ fontSize: mob ? 10 : 10.5, fontWeight: 700, lineHeight: 1.5, color: active ? color : "var(--text-3)",
        background: active ? color + "22" : "var(--surface3)", borderRadius: "var(--r-pill)", padding: "0 6px", minWidth: 17, textAlign: "center" }}>{count}</span>}
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
            border: "none", borderRadius: "var(--r-tile)", padding: 13,
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
                background: c.color + "16", padding: "3px 9px", borderRadius: "var(--r-pill)", whiteSpace: "nowrap", flexShrink: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", background: c.color }} />{c.th}
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
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 7 }}>
              <button onClick={() => onOpen(it)}
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, background: "var(--primary-soft)",
                  border: "none", color: "var(--primary-dark)", fontWeight: 700, fontSize: 12.5, padding: "9px 6px", borderRadius: "var(--r-chip)",
                  cursor: "pointer", fontFamily: "inherit" }}>{g ? "เลือกขนาด · " + g.n + " ขนาด" : "ดูรายละเอียด · รับ/เบิก/คืน"}</button>
              {/* การ์ดรวมขนาดยังไม่รู้ว่าจะแก้/ลบตัวไหน — เข้าไปเลือกขนาดก่อน */}
              {!g && <button onClick={() => onEdit(it)} title="แก้ไข" aria-label="แก้ไข"
                style={{ flexShrink: 0, background: "#3B82F614", border: "none", color: "#3B82F6", width: 44, height: 36, borderRadius: "var(--r-chip)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={16} /></button>}
              {!g && <button onClick={() => { askConfirm({ title: "ลบ “" + it.name + "” ออกจากคลัง?" }).then((ok) => { if (ok) onRemove(it.id); }); }} title="ลบ" aria-label="ลบ"
                style={{ flexShrink: 0, background: "var(--tint-red-bg)", border: "none", color: "var(--tint-red-tx2)", width: 44, height: 36, borderRadius: "var(--r-chip)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} /></button>}
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
          color: "var(--text-1)", background: "var(--surface)", border: "none", boxShadow: open ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
          borderRadius: "var(--r-tile)", padding: "10px 13px", outline: "none", cursor: "pointer" }}>
        <span style={{ width: 9, height: 9, borderRadius: "var(--r-pill)", background: cur.color, flexShrink: 0 }} />
        <span>{cur.th}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", background: "var(--surface3)", padding: "1px 7px", borderRadius: "var(--r-pill)" }}>{countOf(cur.key)}</span>
        <Icon name="chevronDown" size={16} color="var(--text-3)" style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 61, background: "var(--bg)",
            borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-pop)", maxHeight: "58dvh", overflowY: "auto", padding: 6 }}>
            {list.map((c) => {
              const active = c.key === cat;
              return (
                <button key={c.key} onClick={() => { setCat(c.key); setOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 11px", borderRadius: "var(--r-chip)", border: "none",
                    background: active ? "var(--primary-soft)" : "transparent", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "var(--r-pill)", background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? "var(--primary-dark)" : "var(--text-1)" }}>{c.th}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: active ? "var(--primary-dark)" : "var(--text-3)",
                    background: active ? "var(--surface)" : "var(--surface3)", padding: "1px 7px", borderRadius: "var(--r-pill)" }}>{countOf(c.key)}</span>
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
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(440px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", fontSize: 13.5, color: "var(--text-1)" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)", fontSize: 12.5, color: "var(--text-2)" }}>
            <Icon name="user" size={14} color="var(--text-3)" />
            ผู้ทำรายการ: <strong style={{ color: "var(--text-1)" }}>{byName || "-"}</strong>
          </div>
        </div>
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: "var(--r-tile)", border: "none", background: accent, color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>
            {mt.sym} {mt.label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ตารางจับคู่ตัวคุมแผง ↔ อินเวอร์เตอร์ ──
   หนึ่งแถว = อินเวอร์เตอร์หนึ่งรุ่น พร้อมข้อจำกัดของสตริงตามคู่มือ
     min/max = จำนวนตัวคุมต่อสตริง ต่ำสุด/สูงสุด · maxW = กำลัง DC สูงสุดต่อสตริง
   เก็บเป็นอาเรย์ในตัวของใช้เอง ไม่ต้องมีตารางแยก เพราะข้อมูลชุดนี้เป็นของอุปกรณ์ตัวนั้นโดยตรง */
function StkOptPairs({ pairs, invNames, onChange, isMobile }) {
  const list = Array.isArray(pairs) ? pairs : [];
  const setRow = (i, patch) => onChange(list.map((r, j) => (j === i ? Object.assign({}, r, patch) : r)));
  const add = () => onChange(list.concat([{ inv: "", min: 0, max: 0, maxW: 0 }]));
  const del = (i) => onChange(list.filter((r, j) => j !== i));
  const cell = Object.assign({}, inputStyle, { padding: "7px 9px", fontSize: 12 });

  return (
    <div style={{ marginTop: 11, borderTop: "1px dashed var(--border-strong)", paddingTop: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>ใช้คู่กับอินเวอร์เตอร์รุ่นไหนได้บ้าง</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>ความยาวสตริงตามคู่มือ · แต่ละรุ่นไม่เท่ากัน</span>
        <button type="button" onClick={add} style={{ marginLeft: "auto", padding: "6px 11px", borderRadius: "var(--r-chip)",
          background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--primary-dark)",
          fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>+ เพิ่มรุ่น</button>
      </div>
      {!list.length ? (
        <div style={{ fontSize: 11.5, color: "var(--text-3)", padding: "10px 0" }}>
          ยังไม่ได้จับคู่กับรุ่นไหน — ตอนออกแบบระบบจะไม่มีข้อจำกัดความยาวสตริงให้ตรวจ
        </div>
      ) : list.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2.2fr .8fr .8fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <select style={cell} value={r.inv || ""} onChange={(e) => setRow(i, { inv: e.target.value })}>
            <option value="">— เลือกรุ่นอินเวอร์เตอร์ —</option>
            {(invNames || []).map((n) => <option key={n} value={n}>{n}</option>)}
            {r.inv && (invNames || []).indexOf(r.inv) < 0 && <option value={r.inv}>{r.inv} (ไม่มีในคลังแล้ว)</option>}
          </select>
          <input type="number" style={cell} value={r.min || ""} placeholder="ต่ำสุด" onChange={(e) => setRow(i, { min: parseInt(e.target.value) || 0 })} />
          <input type="number" style={cell} value={r.max || ""} placeholder="สูงสุด" onChange={(e) => setRow(i, { max: parseInt(e.target.value) || 0 })} />
          <input type="number" style={cell} value={r.maxW || ""} placeholder="W/สตริง" onChange={(e) => setRow(i, { maxW: parseInt(e.target.value) || 0 })} />
          <button type="button" onClick={() => del(i)} title="ลบแถวนี้"
            style={{ width: 32, height: 32, borderRadius: "var(--r-chip)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)",
              cursor: "pointer", display: "grid", placeItems: "center" }}>
            <Icon name="trash" size={13} color="#EF4444" />
          </button>
        </div>
      ))}
      {!!list.length && (
        <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
          ต่ำสุด/สูงสุด = จำนวน<b>ตัวคุม</b>ต่อสตริง (ไม่ใช่จำนวนแผง) · W/สตริง = กำลัง DC สูงสุดต่อสตริงตามคู่มือ
        </div>
      )}
    </div>
  );
}

/* ── อุปกรณ์เสริมที่ใช้คู่กัน (มิเตอร์ · ดองเกิล · แบต · กล่องสำรองไฟ ฯลฯ) ──
   เก็บเป็น accIds = [id ในคลัง] บนตัวอินเวอร์เตอร์ — อ้างด้วย id ไม่ใช่ชื่อ เปลี่ยนชื่อสินค้าแล้วไม่หลุด
   ตัวเลือกไม่รวมอินเวอร์เตอร์ตัวอื่น (ของที่มี invKw) · ยี่ห้อเดียวกันขึ้นก่อน */
function StkAccPick({ ids, self, items, onChange }) {
  const SF = window.SF;
  const list = Array.isArray(ids) ? ids : [];
  const byId = {}; (items || []).forEach((x) => { if (x && x.id) byId[x.id] = x; });
  const lo = (x) => String(x || "").toLowerCase().trim();
  const br = lo(self.brand);
  const cand = (items || []).filter((x) => x && x.id && x.name && x.id !== self.id && !(+x.invKw > 0) && list.indexOf(x.id) < 0);
  const same = br ? cand.filter((x) => lo(x.brand) === br || lo(x.name).indexOf(br) !== -1) : [];
  const rest = cand.filter((x) => same.indexOf(x) < 0);
  const nm = (a) => a.slice().sort((x, z) => String(x.name).localeCompare(String(z.name), "th"));
  const catTh = (x) => { const c = SF.STOCK_CAT_BY && SF.STOCK_CAT_BY[x.cat]; return c ? c.th : ""; };
  return (
    <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
        <Icon name="link" size={14} color="var(--primary-dark)" /> อุปกรณ์เสริมที่ใช้คู่กัน
        <span style={{ fontWeight: 400, color: "var(--text-3)" }}>· {list.length} รายการ</span>
      </div>
      {list.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 9 }}>
          {list.map((id) => {
            const x = byId[id];
            return (
              <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 6px 5px 10px", borderRadius: "var(--r-chip)",
                background: "var(--surface)", boxShadow: "var(--shadow-sm)", fontSize: 11.5, fontWeight: 600, color: x ? "var(--text-1)" : "var(--text-3)" }}>
                {x ? x.name : id + " (ไม่มีในคลังแล้ว)"}
                <button type="button" title="เอาออก" onClick={() => onChange(list.filter((k) => k !== id))}
                  style={{ width: 20, height: 20, borderRadius: 99, border: "none", background: "var(--surface2)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icon name="x" size={11} color="var(--text-3)" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <select style={inputStyle} value="" onChange={(e) => { if (e.target.value) onChange(list.concat([e.target.value])); }}>
        <option value="">+ เพิ่มอุปกรณ์เสริมจากคลัง…</option>
        {same.length > 0 && (
          <optgroup label={"ยี่ห้อ " + self.brand}>
            {nm(same).map((x) => <option key={x.id} value={x.id}>{x.name}{catTh(x) ? " · " + catTh(x) : ""}</option>)}
          </optgroup>
        )}
        <optgroup label={same.length ? "ยี่ห้ออื่น" : "ทั้งคลัง"}>
          {nm(rest).map((x) => <option key={x.id} value={x.id}>{x.name}{catTh(x) ? " · " + catTh(x) : ""}</option>)}
        </optgroup>
      </select>
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
  /* รายชื่ออินเวอร์เตอร์ในคลัง — ใช้เป็นตัวเลือกตอนจับคู่กับตัวคุมแผง
     ต้องเลือกจากรุ่นที่มีอยู่จริง ไม่ใช่พิมพ์เอง ไม่งั้นชื่อไม่ตรงแล้วจับคู่ไม่ติดตอนออกแบบ */
  const invNames = (items || []).filter((x) => SF.mainCatOf(x.cat) === "inverter" && x.name).map((x) => x.name);

  /* หมวด — f.cat เก็บคีย์ที่ละเอียดที่สุด แยกกลับเป็นหลัก/ย่อยตอนแสดง
     ช่องสเปค (แผง/อินเวอร์เตอร์/อุปกรณ์ไฟฟ้า/สาย) ต้องดูจาก mainCat ไม่ใช่ f.cat
     ไม่งั้นของที่ย้ายเข้าหมวดย่อยจะไม่มีช่องให้กรอก Voc/Isc/Vmp/Imp อีกเลย */
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
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(560px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{isNew ? "เพิ่มรายการอุปกรณ์" : "แก้ไขรายการ"}</h2>
          <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: "var(--r-chip)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
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
                style={{ flexShrink: 0, padding: "0 12px", borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-sm)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>auto</button>
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
                style={{ flexShrink: 0, padding: "0 14px", height: 38, borderRadius: "var(--r-tile)", border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>เพิ่ม</button>
              <button type="button" onClick={() => { setAdding(null); setNewCat(""); }}
                style={{ flexShrink: 0, padding: "0 12px", height: 38, borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-sm)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>ยกเลิก</button>
            </div>
          )}
          {isCustomCat && onRemoveCat && !adding && (
            <div style={{ gridColumn: "1 / -1", marginTop: -6 }}>
              <button type="button"
                onClick={() => { const c = SF.STOCK_CAT_BY[f.cat];
                  askConfirm({ title: "ลบหมวด “" + c.th + "” ?", ok: "ลบหมวด",
                    body: (c.parent ? "" : "หมวดย่อยใต้หมวดนี้จะถูกลบด้วย\n") + "ของที่อยู่ในหมวดนี้จะไปแสดงเป็น “อื่นๆ”",
                  }).then((ok) => { if (!ok) return; onRemoveCat(f.cat); set("cat", c.parent || "other"); }); }}
                style={{ border: 0, background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: "var(--tint-red-tx2)", textDecoration: "underline", textUnderlineOffset: 3 }}>
                ลบหมวด “{(SF.STOCK_CAT_BY[f.cat] || {}).th}” ที่สร้างเอง
              </button>
            </div>
          )}
          {/* ยี่ห้อ/รุ่น — ของชิ้นเดียวกันคนละยี่ห้อคนละรุ่น ราคาไม่เท่ากัน แยกเป็นคนละรายการได้ */}
          <Field label="ยี่ห้อ (Brand)"><input style={inputStyle} value={f.brand || ""} onChange={(e) => set("brand", e.target.value)} placeholder="THAI PP-R / SANWA" /></Field>
          <Field label="รุ่น (Model)"><input style={inputStyle} value={f.model || ""} onChange={(e) => set("model", e.target.value)} placeholder="D25 / CKT 20" /></Field>
          <Field label="กลุ่มรุ่น (ซีรีส์)"><input style={inputStyle} value={f.series || ""} onChange={(e) => set("series", e.target.value)} placeholder="CVS / EZC100H — ใช้จัดการ์ดใต้ยี่ห้อ" /></Field>
          <Field label="จำนวนคงเหลือ"><input type="number" style={inputStyle} value={f.qty} onChange={(e) => set("qty", parseInt(e.target.value) || 0)} /></Field>
          <Field label="หน่วยนับ"><input style={inputStyle} value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="แผง / ตัว / ม้วน" /></Field>
          <Field label="ขั้นต่ำ (แจ้งเตือน)"><input type="number" style={inputStyle} value={f.min} onChange={(e) => set("min", parseInt(e.target.value) || 0)} /></Field>
          <Field label="ราคา/หน่วย (บาท)"><input type="number" style={inputStyle} value={f.price != null ? f.price : 0} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} placeholder="0" /></Field>
          <Field label="ที่จัดเก็บ"><input style={inputStyle} value={f.loc} onChange={(e) => set("loc", e.target.value)} placeholder="คลัง A-01" /></Field>
          {/* การรับประกันของผู้ผลิต — ใช้ตอบลูกค้า/ตั้งประกันในงาน O&M · แผงแยกประกันวัสดุกับประสิทธิภาพ */}
          <Field label="รับประกันสินค้า (ปี)"><input type="number" step="0.5" style={inputStyle} value={f.warY || ""} onChange={(e) => set("warY", parseFloat(e.target.value) || 0)} placeholder={mainCat === "panel" ? "12 / 15" : "5 / 10"} /></Field>
          {mainCat === "panel" && (
            <Field label="รับประกันประสิทธิภาพ (ปี)"><input type="number" style={inputStyle} value={f.warPerfY || ""} onChange={(e) => set("warPerfY", parseFloat(e.target.value) || 0)} placeholder="25 / 30" /></Field>
          )}
          <div style={{ gridColumn: mainCat === "panel" ? "1 / -1" : "auto" }}>
            <Field label="เงื่อนไขการรับประกัน"><input style={inputStyle} value={f.warNote || ""} onChange={(e) => set("warNote", e.target.value)} placeholder="เช่น ขยายเป็น 10 ปีเมื่อลงทะเบียน · เคลมผ่านตัวแทน" /></Field>
          </div>
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
          {mainCat === "panel" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
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
                  <Field label="แผงสองหน้า (Bifacial)">
                    <select style={inputStyle} value={f.bifacial === true ? "1" : f.bifacial === false ? "0" : ""}
                      onChange={(e) => set("bifacial", e.target.value === "" ? null : e.target.value === "1")}>
                      <option value="">ดูจากชื่อรุ่น</option><option value="1">สองหน้า</option><option value="0">หน้าเดียว</option>
                    </select></Field>
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
          {/* ── Smart Module Controller / Optimizer ──
              สเปคฝั่งเข้าไว้ตรวจว่าครอบแผงที่ใช้ไหม · ฝั่งออกไว้คิดว่าต่อได้กี่ตัวต่อสตริง
              แรงดันตอนปิดคือตัวเลขความปลอดภัยที่ลูกค้าโรงงานมักถามถึง จึงต้องเก็บไว้ด้วย */}
          {SF.isOptimizerCat(f.cat) && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 10 }}>
                <Icon name="bolt" size={14} color="#0891B2" /> สเปคตัวคุมแผง (กรอกจากดาต้าชีต)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 12 }}>
                <Field label="กำลังแผงสูงสุด (W)"><input type="number" style={inputStyle} value={f.optW != null ? f.optW : ""} onChange={(e) => set("optW", parseFloat(e.target.value) || 0)} placeholder="1100" /></Field>
                <Field label="แรงดันเข้าสูงสุด (V)"><input type="number" style={inputStyle} value={f.optVinMax != null ? f.optVinMax : ""} onChange={(e) => set("optVinMax", parseFloat(e.target.value) || 0)} placeholder="125" /></Field>
                <Field label="Isc สูงสุด (A)"><input type="number" style={inputStyle} value={f.optIscMax != null ? f.optIscMax : ""} onChange={(e) => set("optIscMax", parseFloat(e.target.value) || 0)} placeholder="20" /></Field>
                <Field label="MPPT ต่ำสุด (V)"><input type="number" style={inputStyle} value={f.optMpptMin != null ? f.optMpptMin : ""} onChange={(e) => set("optMpptMin", parseFloat(e.target.value) || 0)} placeholder="12.5" /></Field>
                <Field label="MPPT สูงสุด (V)"><input type="number" style={inputStyle} value={f.optMpptMax != null ? f.optMpptMax : ""} onChange={(e) => set("optMpptMax", parseFloat(e.target.value) || 0)} placeholder="105" /></Field>
                <Field label="แผงต่อ 1 ตัว"><input type="number" style={inputStyle} value={f.optPerPanel != null ? f.optPerPanel : ""} onChange={(e) => set("optPerPanel", parseInt(e.target.value) || 0)} placeholder="1" /></Field>
                <Field label="แรงดันออกสูงสุด (V)"><input type="number" style={inputStyle} value={f.optVoutMax != null ? f.optVoutMax : ""} onChange={(e) => set("optVoutMax", parseFloat(e.target.value) || 0)} placeholder="80" /></Field>
                <Field label="กระแสออกสูงสุด (A)"><input type="number" style={inputStyle} value={f.optIoutMax != null ? f.optIoutMax : ""} onChange={(e) => set("optIoutMax", parseFloat(e.target.value) || 0)} placeholder="22" /></Field>
                <Field label="ประสิทธิภาพ (%)"><input type="number" style={inputStyle} value={f.optEff != null ? f.optEff : ""} onChange={(e) => set("optEff", parseFloat(e.target.value) || 0)} placeholder="99.5" /></Field>
                <Field label="แรงดันตอนสั่งปิด (V/ตัว)"><input type="number" style={inputStyle} value={f.optVoff != null ? f.optVoff : ""} onChange={(e) => set("optVoff", parseFloat(e.target.value) || 0)} placeholder="1" /></Field>
                <Field label="ตัวคุมต่อสตริง ต่ำสุด"><input type="number" style={inputStyle} value={f.optMinPerStr != null ? f.optMinPerStr : ""} onChange={(e) => set("optMinPerStr", parseInt(e.target.value) || 0)} placeholder="จากคู่มือ" /></Field>
                <Field label="ตัวคุมต่อสตริง สูงสุด"><input type="number" style={inputStyle} value={f.optMaxPerStr != null ? f.optMaxPerStr : ""} onChange={(e) => set("optMaxPerStr", parseInt(e.target.value) || 0)} placeholder="จากคู่มือ" /></Field>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 9, lineHeight: 1.7 }}>
                แรงดันตอนสั่งปิด × จำนวนตัวในสตริง = แรงดันที่เหลือบนสายตอนกดหยุดฉุกเฉิน —
                ตัวเลขนี้คือเหตุผลด้านความปลอดภัยที่โรงงานหลายแห่งบังคับให้ติด
              </div>

              {/* ── ตารางจับคู่กับอินเวอร์เตอร์ ──
                  คู่มือผู้ผลิตกำหนดความยาวสตริงไว้ "ต่ออินเวอร์เตอร์แต่ละรุ่น" ไม่ใช่ค่าเดียวทั้งยี่ห้อ
                  (เช่น SUN2000-30~40KTL-M3 ได้ 8-25 ตัว แต่ SUN2000-50KTL-M3 ได้ 8-20 ตัว)
                  จึงต้องเก็บเป็นตาราง ไม่ใช่ช่องเดียว ไม่งั้นจะตรวจผิดทันทีที่เปลี่ยนรุ่นอินเวอร์เตอร์ */}
              <StkOptPairs pairs={f.optPairs} invNames={invNames} onChange={(v) => set("optPairs", v)} isMobile={isMobile} />
            </div>
          )}
          {mainCat === "inverter" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
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
              {/* ขนาดตัวเครื่อง — ห้องอุปกรณ์ 3D (eroom.jsx) วาดตามนี้ · ไม่กรอก = ประมาณจาก kW */}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border-strong)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>ขนาดตัวเครื่อง (ใช้วาดห้องอุปกรณ์ 3D · ดูจากดาต้าชีต)</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
                  <Field label="กว้าง (มม.)"><input type="number" style={inputStyle} value={f.invDimW || ""} onChange={(e) => set("invDimW", parseFloat(e.target.value) || 0)} placeholder="640" /></Field>
                  <Field label="สูง (มม.)"><input type="number" style={inputStyle} value={f.invDimH || ""} onChange={(e) => set("invDimH", parseFloat(e.target.value) || 0)} placeholder="530" /></Field>
                  <Field label="ลึก (มม.)"><input type="number" style={inputStyle} value={f.invDimD || ""} onChange={(e) => set("invDimD", parseFloat(e.target.value) || 0)} placeholder="270" /></Field>
                  <Field label="การติดตั้ง">
                    <select style={inputStyle} value={f.invMount || ""} onChange={(e) => set("invMount", e.target.value)}>
                      <option value="">ติดผนัง / ราง</option>
                      <option value="floor">ตั้งพื้น (ตู้)</option>
                    </select>
                  </Field>
                </div>
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
          {((mainCat === "inverter" && +f.invKw > 0) || f.elecType === "MCCB") && (
            <StkAccPick ids={f.accIds} self={f} items={items} onChange={(v) => set("accIds", v)} />
          )}
          {mainCat === "electrical" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
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
          {mainCat === "wiring" && (
            <div style={{ gridColumn: "1 / -1", marginTop: 2, padding: 14, background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
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
        <div style={{ padding: "14px 22px", paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14, borderTop: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: isMobile ? "0 0 auto" : "none", padding: "11px 18px", borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submitItem}
            style={{ flex: isMobile ? 1 : "none", padding: "11px 22px", borderRadius: "var(--r-tile)", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

/* ── ตัวแก้ตารางพิกัดกระแสสายไฟ (วสท.) — ฉนวน × วิธีเดินสาย × [กลุ่ม·จำนวนตัวนำ·แกน] × ขนาด ── */
/* ══════════════════════════════════════════════════
   ค่าตั้งต้นอุปกรณ์ท่อร้อยสายของบริษัท — ตั้งครั้งเดียว ใบ BOQ ใหม่ทุกใบเริ่มจากค่านี้
   แก้รายใบได้ตามปกติในหน้าถอดวัสดุ

   ⚠ ใบที่ถอดไว้แล้วไม่ขยับตามค่าที่แก้ที่นี่ (BOQ.mergeBOQ ให้ของที่บันทึกไว้ชนะ)
     ตั้งใจให้เป็นแบบนั้น — ใบเสนอราคาที่ส่งลูกค้าไปแล้วเปลี่ยนจำนวนเองไม่ได้
   ══════════════════════════════════════════════════ */
/* อุปกรณ์ IMC ไม่มีตารางของตัวเองแล้ว — ทั้งกฎและ % เผื่อ อยู่ในตารางกฎตารางเดียว
   แถว IMC ที่เหลือไว้ที่นี่ใช้นับว่า "ตั้งค่าไว้กี่รายการ" ของปุ่มคืนค่าตั้งต้นเท่านั้น */
const COND_DEF_ROWS = [
  { grp: "IMC", key: "clamp", th: "แคล้มประกับ" },
  { grp: "IMC", key: "bushing", th: "บุชชิ่ง/ล็อกนัท" },
  { grp: "IMC", key: "cchannel", th: "รางซี" },
  { grp: "IMC", key: "connector", th: "คอนเนคเตอร์" },
  { grp: "IMC", key: "coupling", th: "คุปปิ้ง" },
  { grp: "uPVC", key: "upStraight", th: "ข้อต่อตรง", auto: "จำนวนท่อน + 4" },
  { grp: "uPVC", key: "upClamp", th: "แคลมป์ก้ามปู", auto: "ทุก 60 ซม." },
  { grp: "uPVC", key: "upConnector", th: "คอนเน็ตเตอร์ uPVC", auto: "8 + แบต/สำรอง + 3 ต่อ PULL BOX uPVC" },
];

function ConduitDefaultsEditor({ condStore }) {
  const FIX = (window.BOQ || {}).CONDUIT_SPARE_FIXED || {};
  const RULE_ROWS = (window.BOQ || {}).IMC_RULE || [];
  const saved = (condStore && condStore.val) || { rule: {}, per: {}, spare: {} };

  /* ── กดแก้ไข → กรอก → กดบันทึก ──
     เดิมพิมพ์ปุ๊บเขียนขึ้น Firebase ปั๊บ ซึ่งแปลว่าเลขที่พิมพ์ค้างไว้ครึ่งทาง (เช่น "0." ของ 0.25)
     กลายเป็นค่าตั้งต้นของบริษัทไปแล้ว และกดผิดแล้วกลับไม่ได้
     ตอนนี้แก้ในร่างในเครื่องก่อน กดบันทึกจึงเขียนจริง กดยกเลิกคือทิ้งร่างทั้งก้อน
     draft ไม่ใช่ null = กำลังอยู่ในโหมดแก้ไข ไม่ต้องมีสเตตบอกโหมดอีกตัว */
  const [draft, setDraft] = React.useState(null);
  const edit = !!draft;
  const view = draft || saved;
  const rule = view.rule || {}, per = view.per || {}, spare = view.spare || {};
  const set = (kind, k, v) => setDraft((p) => {
    const d = p || { rule: {}, per: {}, spare: {} };
    const o = Object.assign({}, d[kind]);
    if (v === "" || v === null || v === undefined) delete o[k]; else o[k] = String(v);
    const next = Object.assign({}, d); next[kind] = o; return next;
  });
  const startEdit = () => setDraft({
    rule: Object.assign({}, saved.rule), per: Object.assign({}, saved.per), spare: Object.assign({}, saved.spare) });
  /* บันทึกทีละช่องที่เปลี่ยนจริง ไม่เขียนทั้งก้อน — ช่องที่คนอื่นแก้ไว้ระหว่างเราเปิดค้างจะได้ไม่ถูกลบ */
  const nDirty = ["rule", "per", "spare"].reduce((sum, kind) => {
    const a = saved[kind] || {}, b = (draft || {})[kind] || {};
    return sum + Object.keys(Object.assign({}, a, b))
      .filter((k) => String(a[k] != null ? a[k] : "") !== String(b[k] != null ? b[k] : "")).length;
  }, 0);
  const save = () => {
    if (!draft || !condStore) { setDraft(null); return; }
    ["rule", "per", "spare"].forEach((kind) => {
      const a = saved[kind] || {}, b = draft[kind] || {};
      Object.keys(Object.assign({}, a, b)).forEach((k) => {
        const av = String(a[k] != null ? a[k] : ""), bv = String(b[k] != null ? b[k] : "");
        if (av !== bv) condStore.setCell(kind, k, bv);
      });
    });
    setDraft(null);
  };
  const cancel = () => {
    if (!nDirty) { setDraft(null); return; }
    window.askConfirm({ title: "ทิ้งที่แก้ไว้?", body: "ค่าที่แก้ไว้ " + nDirty + " ช่อง จะไม่ถูกบันทึก", ok: "ทิ้ง", danger: true })
      .then((ok) => { if (ok) setDraft(null); });
  };

  const nEdited = COND_DEF_ROWS.filter((r) => (saved.per || {})[r.key] != null || (saved.spare || {})[r.key] != null).length
    + ((saved.spare || {}).tray != null && (saved.spare || {}).tray !== "" ? 1 : 0)
    + RULE_ROWS.filter((r) => (saved.rule || {})[r.key] != null && (saved.rule || {})[r.key] !== "").length;
  const cell = { padding: "7px 9px", borderBottom: "1px solid var(--divider)", fontSize: 12.5 };
  const numBase = { background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-1)",
    fontFamily: "inherit", fontSize: 13, padding: "7px 9px", borderRadius: "var(--r-chip)", outline: "none", width: "100%", textAlign: "right" };
  /* ตอนยังไม่กดแก้ไข ช่องกรอกต้องดูเหมือน "ค่าที่ตั้งไว้" ไม่ใช่ช่องที่กดแล้วไม่มีอะไรเกิดขึ้น */
  const num = edit ? numBase : Object.assign({}, numBase, { background: "transparent", borderColor: "transparent", color: "var(--text-2)" });
  const btn = (on) => ({ padding: "7px 14px", borderRadius: "var(--r-tile)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    border: "none", background: on ? "var(--primary)" : "var(--surface2)", color: on ? "#fff" : "var(--text-2)",
    boxShadow: on ? "none" : "var(--shadow-sm)" });
  const bar = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {edit ? (
        <React.Fragment>
          <button onClick={save} style={btn(true)}>บันทึก{nDirty ? " (" + nDirty + ")" : ""}</button>
          <button onClick={cancel} style={btn(false)}>ยกเลิก</button>
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
            {nDirty ? "แก้ไว้ " + nDirty + " ช่อง ยังไม่ได้บันทึก" : "กำลังแก้ไข"}</span>
        </React.Fragment>
      ) : (
        <button onClick={startEdit} style={btn(false)}>แก้ไข</button>
      )}
    </div>
  );

  /* ตารางนี้เหลือไว้ให้ uPVC อย่างเดียว — อุปกรณ์ IMC ย้ายไปอยู่ในตารางกฎหมดแล้ว */
  const row = (r, i) => {
    const on = per[r.key] != null && per[r.key] !== "";
    return (
      <tr key={r.key} style={{ background: i % 2 ? "var(--surface2)" : "transparent" }}>
        <td style={Object.assign({}, cell, { fontWeight: 600 })}>{r.th}
          <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>
            {on ? "แทนกฎอัตโนมัติ" : "คิดจาก " + r.auto}</div>
        </td>
        <td style={Object.assign({}, cell, { width: 120 })}>
          <input type="number" min={0} step="any" placeholder="อัตโนมัติ" style={num} disabled={!edit}
            value={on ? per[r.key] : ""} onChange={(e) => set("per", r.key, e.target.value)} />
        </td>
        <td style={Object.assign({}, cell, { width: 100 })}>
          <input type="number" placeholder={String(FIX[r.key] != null ? FIX[r.key] : 10)} style={num} disabled={!edit}
            value={spare[r.key] != null ? spare[r.key] : ""} onChange={(e) => set("spare", r.key, e.target.value)} />
        </td>
      </tr>
    );
  };

  /* ตารางกฎ — ของ IMC เท่านั้น อุปกรณ์ uPVC ยังเป็นสูตรตายตัวอยู่ ยังไม่มีใครขอให้แก้
     % เผื่อ อยู่ในตารางเดียวกับกฎ จะได้เห็นพร้อมกันว่าอุปกรณ์ตัวหนึ่งคิดยังไงและเผื่อเท่าไร
     อุปกรณ์ที่มีหลายกฎ (รางซี · คุปปิ้ง) รวมช่อง % เผื่อ เป็นช่องเดียวด้วย rowSpan
     เพราะ % เผื่อ เป็นของ "อุปกรณ์" ไม่ใช่ของ "กฎ" — สองช่องให้กรอกจะกลายเป็นคำถามว่าอันไหนจริง */
  const accSpan = {};
  RULE_ROWS.forEach((r) => { accSpan[r.acc] = (accSpan[r.acc] || 0) + 1; });
  const ruleTable = (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", overflow: "hidden" }}>
      <div style={{ padding: "9px 11px", fontSize: 12.5, fontWeight: 700, background: "var(--surface2)" }}>
        กฎคิดจำนวนอุปกรณ์ ท่อ IMC
        <span style={{ fontWeight: 500, color: "var(--text-3)", marginLeft: 6 }}>
          เว้นว่าง = ใช้ค่าตั้งต้นของระบบ · ใบที่ถอดไว้แล้วไม่ขยับตาม
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "right" }}>
            <th style={Object.assign({}, cell, { textAlign: "left", fontWeight: 700 })}>กฎ</th>
            <th style={Object.assign({}, cell, { fontWeight: 700 })}>ค่า</th>
            <th style={Object.assign({}, cell, { fontWeight: 700, textAlign: "left" })}>หน่วย</th>
            <th style={Object.assign({}, cell, { fontWeight: 700 })}>% เผื่อ</th>
          </tr>
        </thead>
        <tbody>
          {RULE_ROWS.map((r, i) => {
            const first = i === 0 || RULE_ROWS[i - 1].acc !== r.acc;   // แถวแรกของอุปกรณ์ตัวนี้
            return (
              <tr key={r.key} style={{ background: i % 2 ? "var(--surface2)" : "transparent" }}>
                <td style={Object.assign({}, cell, { fontWeight: 600 })}>{r.th}
                  <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>ค่าตั้งต้น {r.def} {r.unit}</div>
                </td>
                <td style={Object.assign({}, cell, { width: 120 })}>
                  <input type="number" min={r.min != null ? r.min : 0} step="any" placeholder={String(r.def)} style={num} disabled={!edit}
                    value={rule[r.key] != null ? rule[r.key] : ""} onChange={(e) => set("rule", r.key, e.target.value)} />
                </td>
                <td style={Object.assign({}, cell, { width: 76, fontSize: 11, color: "var(--text-3)" })}>{r.unit}</td>
                {first && (
                  <td rowSpan={accSpan[r.acc]} style={Object.assign({}, cell, { width: 100, verticalAlign: "middle" })}>
                    <input type="number" placeholder={String(FIX[r.acc] != null ? FIX[r.acc] : 10)} style={num} disabled={!edit}
                      value={spare[r.acc] != null ? spare[r.acc] : ""} onChange={(e) => set("spare", r.acc, e.target.value)} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const table = (grp) => (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", overflow: "hidden" }}>
      <div style={{ padding: "9px 11px", fontSize: 12.5, fontWeight: 700, background: "var(--surface2)" }}>ท่อ {grp}</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "right" }}>
            <th style={Object.assign({}, cell, { textAlign: "left", fontWeight: 700 })}>อุปกรณ์</th>
            <th style={Object.assign({}, cell, { fontWeight: 700 })}>ชิ้น/ท่อน</th>
            <th style={Object.assign({}, cell, { fontWeight: 700 })}>% เผื่อ</th>
          </tr>
        </thead>
        <tbody>{COND_DEF_ROWS.filter((r) => r.grp === grp).map(row)}</tbody>
      </table>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 820 }}>
      {/* คำอธิบายย้ายไปอยู่บนหัวตารางแล้ว — กติกาที่ต้องอ่านควรอยู่ติดกับช่องที่ต้องกรอก ไม่ใช่ย่อหน้าที่ทุกคนเลื่อนผ่าน */}
      {bar}
      {ruleTable}
      {table("uPVC")}
      {/* รางไฟ — % เผื่อเดียวคุมของประกอบทั้งหมด (ชุดข้อต่อ ขาล็อก ตัวยึด) · เก็บที่ conduitDefaults/spare/tray */}
      <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", overflow: "hidden" }}>
        <div style={{ padding: "9px 11px", fontSize: 12.5, fontWeight: 700, background: "var(--surface2)" }}>รางไฟ (Wireway / Ladder / Perforated)</div>
        <div style={{ padding: "10px 11px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 110px", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.55 }}>
            ตัวราง = ปัดขึ้นตามความยาว/ท่อน · ชุดข้อต่อ = ทุกรอยต่อ +2 · ขาล็อกรางไฟ = ทุก 1.5 ม. · ตัวยึด 2 ตัว/ขา
            <br />รางที่กด “ยึดบน Rail” = T-BOLT KIT 2 ชุด/ขา + Rail รองใต้ขา 1 ชิ้น/ขา (ยาวกว่ารางข้างละ 10 ซม.) ถอดเป็นท่อนเต็มตามที่ตัดแบ่งได้ · ไม่กด = พุ๊กเหล็ก 2 ตัว/ขา
            <br />รางที่กด “ชุบ HDG” ถอดเป็นของชุบแยกบรรทัด (ตัวราง · ข้อต่อ · ขาล็อก) — พุ๊ก สกรู T-BOLT และ Rail ใช้ของมาตรฐานร่วมกับงานอื่น
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10.5, color: "var(--text-3)", fontWeight: 700 }}>
            % เผื่อ อุปกรณ์ประกอบ
            <input type="number" disabled={!edit} style={num} placeholder="10"
              value={spare.tray != null ? spare.tray : ""} onChange={(e) => set("spare", "tray", e.target.value)} />
          </label>
        </div>
      </div>
      <div>
        <button onClick={() => {
          window.askConfirm({ title: "คืนค่าตั้งต้นอุปกรณ์ท่อร้อยสาย?", body: "ค่าที่ตั้งไว้ " + nEdited + " รายการ จะกลับไปใช้กฎ ค่าอัตโนมัติ และ % เผื่อเดิมของระบบ", ok: "คืนค่าตั้งต้น" })
            .then((ok) => { if (ok && condStore) condStore.reset(); });
        }} disabled={!nEdited || edit}
          style={{ padding: "8px 14px", borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)",
            color: nEdited ? "var(--text-2)" : "var(--text-3)", fontSize: 12.5, fontWeight: 600, cursor: nEdited ? "pointer" : "default", fontFamily: "inherit" }}>
          คืนค่าตั้งต้นทั้งหมด{nEdited ? " (" + nEdited + ")" : ""}
        </button>
      </div>
    </div>
  );
}

/* ── ตารางราคาล้างแผง / งาน O&M ตามขนาดระบบ ──
   ตารางละการ์ด กดแก้ไข → แก้ในร่าง → บันทึกทั้งตาราง (ท่าเดียวกับ ConduitDefaultsEditor)
   ราคาในตาราง = ราคาที่ขนาดนั้นพอดี · ระหว่างแถวเฉลี่ยตามสัดส่วน (omTierPrice) · ใหญ่กว่าแถวสุดท้าย = เรตต่อ kWp ของแถวสุดท้าย
   มีช่องลองคิดราคาตามขนาดระบบไว้ข้างบน จะได้เห็นทันทีว่าใบ BOQ จะได้เท่าไร */
const OM_TIER_KINDS = [
  { key: "clean", th: "ราคาล้างแผง", unit: "฿/ครั้ง", color: "#0EA5E9", defKey: "OM_CLEAN_DEF", curKey: "OM_CLEAN_TIERS" },
  { key: "svc", th: "งาน O&M ตรวจ/บำรุงรักษาระบบ", unit: "฿/ปี", color: "#10B981", defKey: "OM_SVC_DEF", curKey: "OM_SVC_TIERS" },
];
function OmTierTable({ kind, saved, onSave }) {
  const BOQ = window.BOQ || {};
  const def = BOQ[kind.defKey] || [];
  const cur = (BOQ.omTierNorm && BOQ.omTierNorm(saved)) || def;
  const custom = !!(BOQ.omTierNorm && BOQ.omTierNorm(saved));
  const [draft, setDraft] = React.useState(null);
  const rows = draft || cur.map((r) => [String(r[0]), String(r[1])]);
  const edit = !!draft;
  const setCell = (i, j, v) => setDraft((p) => p.map((r, k) => (k === i ? (j ? [r[0], v] : [v, r[1]]) : r)));
  const save = () => {
    const n = BOQ.omTierNorm ? BOQ.omTierNorm(draft) : null;
    if (!n) { window.askConfirm({ title: "ตารางว่าง", body: "ต้องมีอย่างน้อยหนึ่งแถวที่กรอกขนาดและราคา", ok: "ตกลง", danger: false }); return; }
    onSave(n); setDraft(null);
  };
  const cell = { padding: "7px 10px", borderBottom: "1px solid var(--divider)", fontSize: 12.5 };
  const inp = { background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-1)", border: "none",
    fontFamily: "inherit", fontSize: 13, padding: "6px 9px", borderRadius: "var(--r-chip)", outline: "none", width: "100%", textAlign: "right" };
  const btn = (on) => ({ padding: "6px 13px", borderRadius: "var(--r-tile)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer",
    border: "none", background: on ? "var(--primary)" : "var(--surface2)", color: on ? "#fff" : "var(--text-2)", boxShadow: on ? "none" : "var(--shadow-sm)" });
  const last = cur[cur.length - 1];
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, background: "var(--surface2)", flexWrap: "wrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: "var(--r-pill)", background: kind.color }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{kind.th}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{kind.unit}{custom ? " · แก้จากค่าตั้งต้นแล้ว" : ""}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {edit ? (
            <React.Fragment>
              <button onClick={save} style={btn(true)}>บันทึก</button>
              <button onClick={() => setDraft(null)} style={btn(false)}>ยกเลิก</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button onClick={() => setDraft(cur.map((r) => [String(r[0]), String(r[1])]))} style={btn(false)}>แก้ไข</button>
              {custom && <button style={btn(false)} onClick={() => window.askConfirm({ title: "คืนค่าตั้งต้น " + kind.th + "?", ok: "คืนค่าตั้งต้น" })
                .then((ok) => { if (ok) onSave(null); })}>คืนค่าตั้งต้น</button>}
            </React.Fragment>
          )}
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "right" }}>
            <th style={Object.assign({}, cell, { textAlign: "left", fontWeight: 700 })}>ขนาดระบบ</th>
            <th style={Object.assign({}, cell, { fontWeight: 700 })}>ราคา ({kind.unit})</th>
            <th style={Object.assign({}, cell, { fontWeight: 700 })}>เฉลี่ย ฿/kWp</th>
            {edit && <th style={cell} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const prev = i ? +rows[i - 1][0] : 0;
            const rate = +r[0] > 0 ? Math.round(+r[1] / +r[0]) : 0;
            return (
              <tr key={i} style={{ background: i % 2 ? "var(--surface2)" : "transparent" }}>
                <td style={Object.assign({}, cell, { fontWeight: 600 })}>
                  {edit ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>ไม่เกิน
                      <input type="number" min={0} step="any" style={Object.assign({}, inp, { width: 90 })} value={r[0]} onChange={(e) => setCell(i, 0, e.target.value)} /> kWp</span>
                  ) : (
                    <span>{prev ? "" : "ไม่เกิน "}{(+r[0]).toLocaleString()} kWp</span>
                  )}
                </td>
                <td style={Object.assign({}, cell, { width: 140, textAlign: "right" })}>
                  {edit ? <input type="number" min={0} step="any" style={inp} value={r[1]} onChange={(e) => setCell(i, 1, e.target.value)} />
                    : <b style={{ fontSize: 13.5 }}>฿{(+r[1]).toLocaleString()}</b>}
                </td>
                <td style={Object.assign({}, cell, { width: 100, textAlign: "right", color: "var(--text-3)" })}>{rate ? rate.toLocaleString() : "—"}</td>
                {edit && <td style={Object.assign({}, cell, { width: 40 })}>
                  <button onClick={() => setDraft((p) => p.filter((x, k) => k !== i))} title="ลบแถว"
                    style={{ background: "var(--tint-red-bg)", border: "none", color: "var(--tint-red-tx2)", width: 26, height: 26, borderRadius: "var(--r-chip)", cursor: "pointer" }}>✕</button>
                </td>}
              </tr>
            );
          })}
          {!edit && last && (
            <tr>
              <td colSpan={3} style={Object.assign({}, cell, { fontSize: 11.5, color: "var(--text-3)", borderBottom: "none" })}>
                ขนาดที่อยู่ระหว่างสองแถวคิดเฉลี่ยตามสัดส่วน{cur.length > 1 && (() => { const a = cur[cur.length - 2], b = last, m = Math.round((+a[0] + +b[0]) / 2); return " (เช่น " + m.toLocaleString() + " kWp = ฿" + (window.BOQ.omTierPrice(cur, m)).toLocaleString() + ")"; })()} · เกิน {(+last[0]).toLocaleString()} kWp = kWp × ฿{(Math.round(last[1] / last[0] * 100) / 100).toLocaleString()} · ปัดขึ้นทีละ ฿{((window.BOQ.RULES || {}).omRound || 100).toLocaleString()} (ตั้งในหัวข้อ เผื่อ · กำไร · O&amp;M)
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {edit && (
        <div style={{ padding: "8px 12px" }}>
          <button onClick={() => setDraft((p) => p.concat([["", ""]]))} style={btn(false)}>＋ เพิ่มแถว</button>
        </div>
      )}
    </div>
  );
}
function OmTierEditor({ omStore }) {
  const BOQ = window.BOQ || {};
  const val = (omStore && omStore.val) || {};
  const [kw, setKw] = React.useState("10");
  const k = +kw || 0;
  const clean = BOQ.omTierPrice ? BOQ.omTierPrice(BOQ.OM_CLEAN_TIERS || [], k) : 0;
  const svc = BOQ.omTierPrice ? BOQ.omTierPrice(BOQ.OM_SVC_TIERS || [], k) : 0;
  const yr = ((BOQ.RULES || {}).omPerYear || 1) * clean + svc;
  const box = (label, v, hi) => (
    <div style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "9px 12px", minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: hi ? "var(--primary-dark)" : "var(--text-1)" }}>฿{v.toLocaleString()}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 820 }}>
      <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>ลองคิดราคา</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>ระบบ
            <input type="number" min={0} step="any" value={kw} onChange={(e) => setKw(e.target.value)}
              style={{ width: 100, background: "var(--surface2)", boxShadow: "var(--shadow-sm)", border: "none", borderRadius: "var(--r-chip)", padding: "6px 9px", fontFamily: "inherit", fontSize: 13, textAlign: "right", color: "var(--text-1)", outline: "none" }} /> kWp</span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>ค่าฐาน: แถม {(BOQ.RULES || {}).omYears} ปี · ล้างแผงปีละ {(BOQ.RULES || {}).omPerYear} ครั้ง (แก้ในหัวข้อ เผื่อ · กำไร · O&amp;M)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {box("ล้างแผง / ครั้ง", clean)}
          {box("งาน O&M / ปี", svc)}
          {box("ต่อปี (ลูกค้าต่อเอง)", yr, true)}
          {box("รวมในราคาติดตั้ง " + ((BOQ.RULES || {}).omYears || 2) + " ปี", yr * ((BOQ.RULES || {}).omYears || 2), true)}
        </div>
      </div>
      {OM_TIER_KINDS.map((kd) => (
        <OmTierTable key={kd.key} kind={kd} saved={val[kd.key]} onSave={(rows) => omStore && omStore.save(kd.key, rows)} />
      ))}
    </div>
  );
}

/* ── ตั้งค่าคำนวณ BOQ: หน้ารวมทุกเงื่อนไขที่ใบ BOQ ใช้ ──
   ซ้าย = หัวข้อ (มือถือเป็นดรอปดาวน์) · ขวา = ตัวแก้ของหัวข้อนั้น
   สามหัวข้อแรกเป็นตัวแก้เดิม (ตารางพิกัดสาย · อุปกรณ์ท่อ · ราคา O&M) ที่เหลือมาจาก BOQ.RULE_SECS/RULE_DEFS
   ตัวเลขที่เคยฝังอยู่ในสูตร — เพิ่มเงื่อนไขใหม่ = เพิ่มแถวใน RULE_DEFS แล้วอ่าน RULES.<key> ในสูตร หน้านี้ขึ้นช่องให้เอง */
const BR_FIXED_SECS = [
  { k: "amp", grp: "ตาราง", th: "พิกัดสาย วสท.", sub: "ตารางพิกัดกระแสตามฉนวน × วิธีเดินสาย × ขนาด" },
  { k: "cond", grp: "ตาราง", th: "อุปกรณ์ท่อ / รางไฟ", sub: "กฎคิดจำนวนอุปกรณ์ IMC/uPVC · % เผื่อ" },
  { k: "om", grp: "ตาราง", th: "ราคา O&M · ล้างแผง", sub: "ตารางราคาตามขนาดระบบ (kWp)" },
];
/* ชื่อรายการที่ BOQ จะสร้างจาก "ของที่มีขาย" ทุกขนาด (ชื่อต้องตรงกับที่ boq.jsx ตั้งทุกตัวอักษร ราคาถึงดึงจากคลังได้)
   คิดจากทั้งชุดงานบ้านและงานโครงการ · MCCB ตามตาราง AF ↔ AT (AT ซ้ำหลายเฟรม = เฟรมเล็กสุด) · ACB ไม่อยู่ในนี้ */
function brStockNeeds() {
  const B = window.BOQ || {}, T = B.RULES_T || {}, H = T.home || {}, P = T.proj || {};
  const out = [], seen = {};
  const add = (name, spec) => { if (!seen[name]) { seen[name] = 1; out.push(Object.assign({ name: name }, spec)); } };
  const both = (k) => [].concat(H[k] || [], P[k] || []);   // ชุดที่มีขายของทั้งสองประเภทงาน (ชื่อซ้ำ add กันเอง)
  both("dcFuse").forEach((p) => { p.a.forEach((a) => add("DC FUSE " + a + "A " + p.v + "VDC", { elecType: "Fuse", amp: a }));
    if (p.h) add("DC FUSE HOLDER " + p.h, { elecType: "Fuse holder" }); });
  [["dcSpd2", "dc2"], ["dcSpd12", "dc12"], ["acSpd2", "ac2"], ["acSpd12", "ac12"]].forEach(([k, kind]) =>
    both(k).forEach((r) => r.a.forEach((a) => add(B.spdName(kind, { v: r.v, p: r.p, a: a }), { elecType: "SPD", poles: r.p }))));
  (H.dcMcb || []).forEach((p) => p.a.forEach((a) => add("DC MCB " + a + "A " + (p.p || "2P") + " " + p.v + "VDC", { elecType: "MCB", poles: p.p || "2P", amp: a })));
  /* งานบ้าน MCB + RCCB (ชื่อตรงกับ brkPickHome ใน boq.jsx) */
  (H.mcbHome2P || []).forEach((a) => add("MCB 2P " + a + "A", { elecType: "MCB", poles: "2P", amp: a }));
  (H.mcbHome3P || []).forEach((a) => add("MCB 3P " + a + "A", { elecType: "MCB", poles: "3P", amp: a }));
  (H.rccb2P || []).forEach((a) => add("RCCB " + a + "A 2P " + (H.rcboMa || 100) + "mA", { elecType: "RCBO", poles: "2P", amp: a }));
  (H.rccb4P || []).forEach((a) => add("RCCB " + a + "A 4P " + (H.rcboMa || 100) + "mA", { elecType: "RCBO", poles: "4P", amp: a }));
  /* MCCB สองตาราง — เมน (ต่อท้าย TM-D · ตัว ≥ gfLsigAt ใช้ LSIG) · อินเวอร์เตอร์ · AT ซ้ำหลายเฟรม = เฟรมเล็กสุด */
  [["mccbMain", "main"], ["mccbInv", "inv"]].forEach(([k, w]) => (P[k] || []).forEach((r) => r.a.forEach((a) => {
    if ((P[k] || []).find((q) => q.a.indexOf(a) >= 0) === r) add(B.mccbName(a, w, w === "main" && a >= (P.gfLsigAt || 1000)), { elecType: "MCCB", poles: "3P", amp: a }); })));
  (P.ctR || []).forEach((r) => add("CT " + r + "/5A", {}));
  (P.zctD || []).forEach((d) => add("ZCT Φ" + d + "mm", {}));
  return out;
}

/* แถบบนหน้าตั้งค่า: ของที่มีขายที่ยังไม่มีในคลัง → ปุ่มเพิ่มทีเดียว (ราคา 0 ไม่มียี่ห้อ/รุ่น ไปกรอกต่อในคลัง) */
function BrStockGap({ stock }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const items = (stock && stock.items) || [];
  const mk = (window.BOQ && window.BOQ.matKey) || ((x) => String(x || "").trim());
  const have = {};
  // ชื่อพ้อง (aka) นับว่ามีแล้ว — ราคาใน BOQ ก็จับคู่ชื่อพ้องเหมือนกัน (เช่น MCB 3P 6A → ABB SH203 3P 6A)
  items.forEach((s) => { if (s.name) have[mk(s.name)] = 1; (s.aka || []).forEach((n) => { if (n) have[mk(n)] = 1; }); });
  const miss = brStockNeeds().filter((x) => !have[mk(x.name)]);
  if (!stock || !stock.upsertItem || !miss.length) return null;
  const addAll = () => {
    const SF = window.SF || {};
    window.askConfirm({ title: "เพิ่ม " + miss.length + " รายการลงคลัง?", body: "หมวดอุปกรณ์ไฟฟ้า · ราคา 0 · ไม่มียี่ห้อ/รุ่น — ไปกรอกราคาและแยกรุ่นต่อในหน้าคลัง", ok: "เพิ่มลงคลัง", icon: "plus" })
      .then((ok) => {
        if (!ok) return;
        setBusy(true);
        let maxId = 0;
        items.forEach((it) => { const n = parseInt(String(it.id || "").replace(/\D/g, ""), 10); if (!isNaN(n) && n > maxId) maxId = n; });
        const used = items.map((s) => s.sku).filter(Boolean);
        miss.forEach((x) => {
          maxId += 1;
          const sku = SF.genMatCode ? SF.genMatCode("electrical", items, used) : "";
          used.push(sku);
          const rec = { id: "IV-" + String(maxId).padStart(2, "0"), name: x.name, sku: sku, cat: "electrical", unit: "ตัว", qty: 0, min: 0, loc: "", price: 0 };
          if (x.elecType) rec.elecType = x.elecType;
          if (x.poles) rec.poles = x.poles;
          if (x.amp) rec.amp = x.amp;
          stock.upsertItem(rec);
        });
        setBusy(false); setOpen(false);
      });
  };
  return (
    <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: "var(--r-card)", background: "var(--tint-amber-bg, #FFF7E6)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Icon name="box" size={16} color="var(--tint-amber-tx)" />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--tint-amber-tx)" }}>ของที่มีขาย {miss.length} รายการยังไม่มีในคลัง</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>BOQ จะเลือกได้แต่ไม่มีราคา</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm btn-soft" onClick={() => setOpen(!open)}>{open ? "ซ่อนรายการ" : "ดูรายการ"}</button>
        <button className="btn btn-sm btn-primary" disabled={busy} onClick={addAll}><Icon name="plus" size={13} color="#fff" /> เพิ่มลงคลังทั้งหมด</button>
      </div>
      {open && <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {miss.map((x) => <span key={x.name} style={{ fontSize: 11.5, padding: "3px 9px", borderRadius: "var(--r-pill)", background: "var(--surface)", color: "var(--text-2)" }}>{x.name}</span>)}
      </div>}
    </div>
  );
}

function BoqRulesPage({ ampStore, condStore, omStore, rulesStore, isMobile, stock }) {
  const BOQ = window.BOQ || {};
  const secs = (BOQ.RULE_SECS || []).concat(BR_FIXED_SECS);
  const [sec, setSec] = React.useState(() => { try { return localStorage.getItem("br_sec") || "dcBoard"; } catch (e) { return "board"; } });
  const pick = (k) => { setSec(k); try { localStorage.setItem("br_sec", k); } catch (e) {} };
  /* 3 แท็บ: ใช้ร่วม (ค่าเดียวทั้งสองประเภท) · งานบ้าน · งานโครงการ (เฉพาะข้อที่ต่างกันจริง — ruleOnly ใน boq.js) */
  const [type, setTypeS] = React.useState(() => { try { const t = localStorage.getItem("br_type"); return t === "home" || t === "proj" ? t : "all"; } catch (e) { return "all"; } });
  const setType = (t) => { setTypeS(t); try { localStorage.setItem("br_type", t); } catch (e) {} };
  const saved = (rulesStore && rulesStore.val) || {};
  const nSet = (k) => (BOQ.RULE_DEFS || []).filter((d) => d.sec === k && brRuleOn(d, type) && brChanged(d, saved, type)).length;
  /* แท็บงานบ้าน/งานโครงการ โชว์เฉพาะหัวข้อที่มีข้อเฉพาะประเภทนั้น · ตารางคงที่ (พิกัดสาย ฯลฯ) อยู่แท็บใช้ร่วม */
  const nRows = (k) => (BOQ.RULE_DEFS || []).filter((d) => d.sec === k && brRuleOn(d, type)).length;
  const secsT = secs.filter((x) => (BR_FIXED_SECS.some((f) => f.k === x.k) ? type === "all" : nRows(x.k) > 0));
  const cur = secsT.find((x) => x.k === sec) || secsT[0];
  const typeBar = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: "var(--r-pill)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)" }}>
        {[["all", "ใช้ร่วม", "link"], ["home", "งานบ้าน", "home"], ["proj", "งานโครงการ", "building"]].map(([k, th, ic]) => (
          <button key={k} onClick={() => setType(k)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 700, borderRadius: "var(--r-pill)",
              background: type === k ? "var(--surface)" : "transparent", boxShadow: type === k ? "var(--shadow-sm)" : "none",
              color: type === k ? "var(--primary-dark)" : "var(--text-3)" }}>
            <Icon name={ic} size={14} color={type === k ? "var(--primary-dark)" : "var(--text-3)"} /> {th}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{type === "all" ? "ค่าที่ใช้เหมือนกันทั้งงานบ้านและงานโครงการ" : "เฉพาะข้อที่" + (type === "home" ? "งานบ้าน" : "งานโครงการ") + "ต่างออกไป · ข้ออื่นใช้ค่าในแท็บใช้ร่วม"}</span>
    </div>
  );
  const body = cur.k === "amp" ? <AmpacityEditor ampStore={ampStore} />
    : cur.k === "cond" ? <ConduitDefaultsEditor condStore={condStore} />
    : cur.k === "om" ? <OmTierEditor omStore={omStore} />
    : <BoqRuleSec key={type + cur.k} sec={cur} rulesStore={rulesStore} type={type} />;
  const fixed = cur.k === "amp" || cur.k === "cond" || cur.k === "om";
  if (isMobile) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <BrStockGap stock={stock} />
      {!fixed && typeBar}
      <Dropdown value={cur.k} onChange={pick} options={secsT.map((x) => ({ value: x.k, group: x.grp, label: x.th + (nSet(x.k) ? " · แก้แล้ว " + nSet(x.k) : "") }))} />
      {body}
    </div>
  );
  return (
    <div>
    <BrStockGap stock={stock} />
    {typeBar}
    <div style={{ display: "grid", gridTemplateColumns: "250px minmax(0,1fr)", gap: 18, alignItems: "start" }}>
      <nav style={{ position: "sticky", top: 12, background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
        {secsT.map((x, i) => {
          const on = x.k === cur.k, n = nSet(x.k);
          return (
            <React.Fragment key={x.k}>
              {x.grp && (i === 0 || secsT[i - 1].grp !== x.grp) && <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", padding: (i ? "10px" : "4px") + " 10px 4px" }}>{x.grp}</div>}
              <button onClick={() => pick(x.k)}
                style={{ textAlign: "left", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "9px 11px", borderRadius: "var(--r-tile)",
                  background: on ? "var(--primary-soft)" : "transparent", color: on ? "var(--primary-dark)" : "var(--text-1)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{x.th}</span>
                  {n > 0 && <span title="ค่าที่แก้จากค่าตั้งต้น" style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 7px", borderRadius: "var(--r-pill)", background: "var(--tint-amber-bg)", color: "var(--tint-amber-tx)" }}>{n}</span>}
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>{x.sub}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>
      <div style={{ minWidth: 0 }}>
        {fixed && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 10 }}>ตารางนี้ใช้ร่วมกันทั้งงานบ้านและงานโครงการ</div>}
        {body}
      </div>
    </div>
    </div>
  );
}

/* แถวนี้โชว์ในแท็บประเภทงานนี้ไหม · ค่าที่ใช้จริงต่างจากค่าตั้งต้นไหม · เก็บที่คีย์ไหน */
const brRuleOn = (d, type) => { const o = window.BOQ.ruleOnly(d); return type === "all" ? !o : o === type; };
const brChanged = (d, saved, type) => {
  const B = window.BOQ, raw = B.ruleRaw(saved, d, type);
  if (raw == null || raw === "") return false;
  return B.ruleTxt(d, B.ruleVal(d, raw)) !== B.ruleTxt(d, d.def);
};
/* แถวรายการของที่มีขาย (ขนาด/แรงดัน/อัตราส่วนที่มีจริง) — ขึ้นก่อนเงื่อนไขในแต่ละหัวข้อ */
const brStockRow = (d) => d.type === "nums" || d.type === "pairs" || !!d.stock;
const BR_TYPE_G = { "ทุกงาน": 1, "งานบ้าน": 1, "งานโครงการ": 1 };
const brPath = (d) => d.key;
/* แถวใช้ร่วมมีค่าเดียว — บันทึก/คืนค่าแล้วล้างค่าที่เคยตั้งแยก home/proj ทิ้งด้วย ไม่งั้นค้างเป็นค่าสำรอง */
const brShared = (d) => !window.BOQ.ruleOnly(d);
const brClearSplit = (rulesStore, d) => ["home", "proj"].forEach((t) => {
  const o = ((rulesStore.val || {})[t] || {})[d.key];
  if (o != null && o !== "") rulesStore.setCell(t + "/" + d.key, "");
});

/* ชิปรายการตัวเลข/คำ — แตะ × เอาออก · พิมพ์ในช่อง "+ เพิ่ม" แล้ว Enter (ใส่หลายค่าคั่นจุลภาคได้) · ตัวสุดท้ายเอาออกไม่ได้ */
function BrChips({ list, unit, onChange, disabled, words }) {
  const [t, setT] = React.useState("");
  const add = () => {
    const vs = t.split(/[,\s]+/).map((x) => (words ? x.trim() : +x)).filter((x) => (words ? x : isFinite(x) && x > 0));
    setT("");
    if (vs.length) onChange(list.concat(vs));
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {list.map((x, i) => (
        <span key={x + "|" + i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 6px 5px 10px", borderRadius: "var(--r-chip)",
          background: "var(--surface)", boxShadow: "var(--shadow-sm)", fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>
          {x}{unit ? <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)" }}>{unit}</span> : null}
          <button type="button" disabled={disabled || list.length < 2} onClick={() => onChange(list.filter((_, j) => j !== i))} title="เอาออก"
            style={{ border: "none", background: "transparent", padding: "0 2px", cursor: disabled || list.length < 2 ? "default" : "pointer",
              color: "var(--text-3)", opacity: disabled || list.length < 2 ? 0.3 : 1, display: "inline-flex" }}>
            <Icon name="x" size={12} color="var(--text-3)" />
          </button>
        </span>
      ))}
      {!disabled && (
        <input value={t} onChange={(e) => setT(e.target.value)} onBlur={add} placeholder="+ เพิ่ม"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          style={{ width: 76, border: "none", outline: "none", fontFamily: "inherit", fontSize: 12.5, padding: "6px 9px", borderRadius: "var(--r-chip)",
            background: "var(--surface2)", boxShadow: "var(--shadow-inset)", color: "var(--text-1)" }} />
      )}
    </div>
  );
}

/* ของที่มีขายแบบเลือกค่าเดียว (def.stock = ตัวเลือก) เช่น รุ่นกระแสรั่ว RCBO — ปุ่มแบ่งช่อง + กรอกค่าอื่นเองได้ */
function BrPick({ d, value, onChange, disabled }) {
  const opts = d.stock.indexOf(value) >= 0 || !(value > 0) || d.labels ? d.stock : d.stock.concat([value]).sort((x, y) => x - y);
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, padding: 4, borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)" }}>
      {opts.map((x) => {
        const on = x === value;
        return (
          <button key={x} type="button" disabled={disabled} onClick={() => onChange(x)}
            style={{ border: "none", fontFamily: "inherit", cursor: disabled ? "default" : "pointer", padding: "6px 14px", borderRadius: "var(--r-chip)",
              fontSize: 13, fontWeight: on ? 800 : 600, fontVariantNumeric: "tabular-nums",
              background: on ? "var(--surface)" : "transparent", boxShadow: on ? "var(--shadow-sm)" : "none", color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
            {d.labels && d.labels[x] != null ? d.labels[x] : <>{x}<span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", marginLeft: 2 }}>{d.unit}</span></>}
          </button>
        );
      })}
    </div>
  );
}

/* ของที่ขายเป็นคู่ แรงดัน ↔ ขนาด A — แถวละแรงดัน ชิปขนาดที่มีของแรงดันนั้น */
function BrPairs({ list, d, onChange, disabled }) {
  const [nv, setNv] = React.useState("");
  const [np, setNp] = React.useState(d.poleDef || "");
  const sortL = (L) => L.sort((x, y) => x.v - y.v || String(x.p || "").localeCompare(String(y.p || "")));
  const same = (p, v, pole) => p.v === v && (!d.poles || p.p === pole);
  const addV = () => {
    const v = +String(nv).replace(/[^\d.]/g, ""); setNv("");
    if (!(v > 0) || list.some((p) => same(p, v, np))) return;
    const last = list[list.length - 1];
    onChange(sortL(list.concat([Object.assign({ v: v }, d.poles ? { p: np } : {}, { a: last ? last.a.slice() : [10] })])));
  };
  /* เปลี่ยนขั้วของแถว — ชนกับแถวที่มีอยู่ = รวมขนาดเข้าแถวนั้น */
  const setPole = (i, pole) => {
    const r = list[i], hit = list.findIndex((q, j) => j !== i && same(q, r.v, pole));
    if (hit < 0) { onChange(sortL(list.map((q, j) => (j === i ? Object.assign({}, q, { p: pole }) : q)))); return; }
    onChange(sortL(list.filter((_, j) => j !== i).map((q) => (same(q, r.v, pole) ? Object.assign({}, q, { a: Array.from(new Set(q.a.concat(r.a))).sort((x, y) => x - y) }) : q))));
  };
  const poleSel = (val, on, w) => (
    <select value={val} disabled={disabled} onChange={(e) => on(e.target.value)} title="จำนวนขั้ว"
      style={{ width: w, border: "none", outline: "none", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "4px 6px", borderRadius: "var(--r-chip)",
        background: "var(--surface)", boxShadow: "var(--shadow-sm)", color: "var(--text-1)", cursor: disabled ? "default" : "pointer" }}>
      {d.poles.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );
  /* ตารางกล่องเดียว (DESIGN.md "ตารางเรียบกล่องเดียว") หัวคอลัมน์ · แถวละแรงดัน แบ่งด้วย --divider · แถวเพิ่มอยู่ท้ายตาราง
     มือถือ (≤ 860px) ยุบเป็นแผ่นต่อแถว ป้ายคอลัมน์อยู่เหนือค่า */
  const [narrow, setNarrow] = React.useState(() => window.matchMedia && window.matchMedia("(max-width: 860px)").matches);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia("(max-width: 860px)"), h = () => setNarrow(m.matches);
    m.addEventListener ? m.addEventListener("change", h) : m.addListener(h);
    return () => (m.removeEventListener ? m.removeEventListener("change", h) : m.removeListener(h));
  }, []);
  const cols = ["104px"].concat(d.poles ? ["86px"] : [], ["minmax(0,1fr)"], d.holder ? ["150px"] : [], ["30px"]).join(" ");
  const head = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: 0.2 };
  const lab = (t) => (narrow ? <div style={Object.assign({}, head, { marginBottom: 4 })}>{t}</div> : null);
  const rowSt = (i) => (narrow
    ? { display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderTop: i ? "1px solid var(--divider)" : "none" }
    : { display: "grid", gridTemplateColumns: cols, gap: 12, alignItems: "center", padding: "9px 14px", borderTop: "1px solid var(--divider)" });
  const sizeTh = "ขนาดที่มีขาย (" + d.unitA + ")";
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", overflow: "hidden" }}>
      {!narrow && (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "8px 14px", background: "var(--surface2)" }}>
          <span style={head}>{d.vName || "แรงดัน"} ({d.unit})</span>
          {d.poles && <span style={head}>ขั้ว</span>}
          <span style={head}>{sizeTh}</span>
          {d.holder && <span style={head}>{d.holder}</span>}
          <span />
        </div>
      )}
      {list.map((p, i) => (
        <div key={p.v + "|" + (p.p || "")} style={rowSt(i)}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 800, color: "var(--primary-dark)", fontVariantNumeric: "tabular-nums" }}>{p.v.toLocaleString()}</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{d.unit}</span>
            {narrow && d.poles && <span style={{ marginLeft: 8 }}>{poleSel(p.p || d.poleDef, (v) => setPole(i, v), 74)}</span>}
            {narrow && !disabled && list.length > 1 && (
              <button type="button" title={"เอา" + (d.vName || "แรงดัน") + " " + p.v + " ออก"} onClick={() => onChange(list.filter((_, j) => j !== i))}
                style={{ marginLeft: "auto", border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "inline-flex" }}>
                <Icon name="trash" size={14} color="var(--text-3)" />
              </button>
            )}
          </div>
          {!narrow && d.poles && <div>{poleSel(p.p || d.poleDef, (v) => setPole(i, v), 74)}</div>}
          <div>{lab(sizeTh)}
            <BrChips list={p.a} unit={d.unitA.split(" ")[0]} disabled={disabled}
              onChange={(a) => onChange(list.map((q, j) => (j === i ? Object.assign({}, q, { a: a }) : q)))} />
          </div>
          {d.holder && (
            <div>{lab(d.holder)}
              <input value={p.h || ""} disabled={disabled} placeholder={d.holderPh || "รุ่น เช่น SRD-30"}
                onChange={(e) => { const h = e.target.value.replace(/[\[\]:;]/g, ""); onChange(list.map((q, j) => (j === i ? Object.assign({}, q, { h: h }) : q))); }}
                style={{ width: "100%", boxSizing: "border-box", border: "none", outline: "none", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, padding: "7px 10px", borderRadius: "var(--r-chip)",
                  background: "var(--surface2)", boxShadow: "var(--shadow-inset)", color: "var(--text-1)" }} />
            </div>
          )}
          {!narrow && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {!disabled && list.length > 1 && (
                <button type="button" title={"เอา" + (d.vName || "แรงดัน") + " " + p.v + " ออก"} onClick={() => onChange(list.filter((_, j) => j !== i))}
                  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: 8 }}>
                  <Icon name="trash" size={14} color="var(--text-3)" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!disabled && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "9px 14px", borderTop: "1px solid var(--divider)", background: "var(--surface2)" }}>
          <input value={nv} onChange={(e) => setNv(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addV(); } }}
            placeholder={(d.vName || "แรงดัน") + "ใหม่ (" + d.unit + ")"} inputMode="decimal"
            style={{ width: 150, border: "none", outline: "none", fontFamily: "inherit", fontSize: 12.5, padding: "7px 10px", borderRadius: "var(--r-chip)",
              background: "var(--surface)", boxShadow: "var(--shadow-inset)", color: "var(--text-1)" }} />
          {d.poles && poleSel(np, setNp, 74)}
          <button type="button" className="btn btn-sm" onClick={addV} disabled={!nv}><Icon name="plus" size={12} /> {d.poles ? "เพิ่มรุ่น" : "เพิ่ม" + (d.vName || "แรงดัน")}</button>
        </div>
      )}
    </div>
  );
}

/* หัวข้อหนึ่งของ RULE_DEFS — แก้ได้ในที่เลย (ไม่ต้องกดแก้ไขก่อน) · ที่แก้ค้างไว้ขึ้นแถบบันทึกติดล่าง · บันทึกเฉพาะช่องที่เปลี่ยน
   ของที่มีขาย = ชิป (pairs = ตารางแรงดัน ↔ ขนาด) · เงื่อนไข = ช่องตัวเลขมีหน่วยในหลุม + ปุ่มคืนค่าตั้งต้นรายแถว */
function BoqRuleSec({ sec, rulesStore, type }) {
  const BOQ = window.BOQ || {};
  const defs = (BOQ.RULE_DEFS || []).filter((d) => d.sec === sec.k && brRuleOn(d, type));
  const stockRows = defs.filter(brStockRow), condRows = defs.filter((d) => !brStockRow(d));
  const all = (rulesStore && rulesStore.val) || {};
  /* ค่าที่ใช้กับประเภทงานนี้ เรียงเป็น {key: ข้อความ} — แถวใช้ร่วมที่ยังไม่ตั้งแยก = ค่าก่อนแยก (boqRules/<key>) */
  const saved = {};
  defs.forEach((d) => { const r = BOQ.ruleRaw(all, d, type); if (r != null && r !== "") saved[d.key] = r; });
  const [draft, setDraft] = React.useState(null);
  React.useEffect(() => { setDraft(null); }, [sec.k]);
  const view = draft || saved;
  const ro = !rulesStore;
  const txt = (d) => BOQ.ruleTxt(d, d.def);
  const str = (o, k) => (o[k] != null ? String(o[k]) : "");
  const dirty = defs.filter((d) => str(saved, d.key) !== str(view, d.key));
  const nEdited = defs.filter((d) => brChanged(d, all, type)).length;
  const set = (k, v) => setDraft((p) => { const n = Object.assign({}, p || saved); if (v === "") delete n[k]; else n[k] = v; return n; });
  const cur = (d) => BOQ.ruleVal(d, str(view, d.key));
  const isDef = (d) => BOQ.ruleTxt(d, cur(d)) === txt(d);
  const save = () => { dirty.forEach((d) => { rulesStore.setCell(brPath(d, type), str(view, d.key).trim()); if (brShared(d)) brClearSplit(rulesStore, d); }); setDraft(null); };
  /* คืนค่าตั้งต้นทีละกลุ่ม: rows = ทั้งหัวข้อ / ของที่มีขาย / เงื่อนไข · nm = ชื่อกลุ่มบนกล่องยืนยัน */
  const resetAll = (rows, nm) => { rows = rows || defs; const n = rows.filter((d) => brChanged(d, all, type)).length;
    return window.askConfirm({ title: "คืนค่าตั้งต้น · " + (nm || sec.th) + "?", body: "ค่าที่ตั้งไว้ " + n + " ช่อง จะกลับไปใช้ค่าตั้งต้นของระบบ", ok: "คืนค่าตั้งต้น", danger: true })
    .then((ok) => { if (ok) { setDraft((p) => { if (!p) return null; const q = Object.assign({}, p); rows.forEach((d) => { delete q[d.key]; if (saved[d.key] != null) q[d.key] = saved[d.key]; });
      return defs.some((d) => str(saved, d.key) !== str(q, d.key)) ? q : null; }); rows.forEach((d) => {
      if (!brChanged(d, all, type)) return;
      /* แถวใช้ร่วมที่ค่าก่อนแยก (boqRules/<key>) ยังตั้งอยู่ — ลบคีย์ของประเภทนี้ไม่พอ ต้องเขียนค่าตั้งต้นทับ */
      if (brShared(d)) { const lg = (d.legacy || []).concat(d.legacyV ? [d.legacyV] : []).some((k) => all[k] != null && all[k] !== "");
        rulesStore.setCell(d.key, lg ? txt(d) : ""); brClearSplit(rulesStore, d); return; }
      const flat = !BOQ.ruleOnly(d) && ((all[d.key] != null && all[d.key] !== "") || (d.legacy || []).some((k) => all[k] != null && all[k] !== ""));
      rulesStore.setCell(brPath(d, type), flat ? txt(d) : "");
    }); } }); };
  /* ค่าที่กรอกแล้วระบบไม่รับ (ติดลบ เกินช่วง ไม่ใช่ตัวเลข) จะถูกใช้เป็นค่าตั้งต้น — บอกไว้ตรงช่อง */
  const bad = (d) => { const v = str(view, d.key).trim(); return !!v && !d.type && BOQ.ruleVal(d, v) === d.def && +v !== d.def; };
  const card = { background: "var(--surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--r-card)", padding: "14px 16px" };
  const blockHd = (ic, t, s, rows) => {
    const n = rows ? rows.filter((d) => brChanged(d, all, type)).length : 0;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: "var(--r-chip)", background: "var(--primary-soft)", display: "grid", placeItems: "center", flex: "none" }}>
          <Icon name={ic} size={14} color="var(--primary-dark)" /></span>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{t}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)", flex: 1, minWidth: 0 }}>{s}</span>
        {n > 0 && !ro && <button className="btn btn-sm" onClick={() => resetAll(rows, sec.th + " · " + t)}><Icon name="undo" size={12} /> คืนค่าตั้งต้น ({n})</button>}
      </div>
    );
  };
  const resetBtn = (d) => !isDef(d) && !ro && (
    <button type="button" title={"คืนค่าตั้งต้น " + txt(d)} onClick={() => set(d.key, d.type ? txt(d) : String(d.def))}
      style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, display: "inline-flex", borderRadius: "var(--r-chip)" }}>
      <Icon name="undo" size={13} color="var(--text-3)" />
    </button>
  );
  const changedDot = (d) => !isDef(d) && <span title="ต่างจากค่าตั้งต้น" style={{ width: 6, height: 6, borderRadius: 99, background: "var(--tint-amber-tx)", flex: "none" }} />;
  /* หัวย่อยที่บอกประเภทงาน (ทุกงาน/งานบ้าน/งานโครงการ) ไม่โชว์ — แท็บบนสุดแยกประเภทให้แล้ว */
  const gOf = (x) => (x && x.g && !BR_TYPE_G[x.g] ? x.g : null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 860, paddingBottom: dirty.length ? 64 : 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{sec.th}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{sec.sub}</div>
        </div>
        {nEdited > 0 && !ro && <button className="btn btn-sm" onClick={() => resetAll()}><Icon name="undo" size={12} /> คืนค่าตั้งต้นทั้งหัวข้อ ({nEdited})</button>}
      </div>

      {stockRows.length > 0 && (
        <div style={card}>
          {blockHd("box", "ของที่มีขาย", "ระบบเลือกได้เฉพาะขนาดในนี้ · " + (stockRows.some(brShared) ? "ใช้ร่วมกันทั้งงานบ้านและงานโครงการ" : "เฉพาะ" + (type === "home" ? "งานบ้าน" : "งานโครงการ")), stockRows)}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stockRows.map((d, i) => (
              <div key={d.key} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--divider)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{d.th}</span>
                  {d.type === "pairs" && <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {d.poles ? "แถวละแรงดัน + จำนวนขั้ว" : "แถวละ" + (d.vName || "แรงดัน")} ชิป = {d.unitA} ที่มีของรุ่นนั้น</span>}
                  {changedDot(d)}<span style={{ flex: 1 }} />{resetBtn(d)}
                </div>
                {d.stock && !d.type
                  ? <BrPick d={d} value={+(str(view, d.key) || d.def)} disabled={ro} onChange={(x) => set(d.key, String(x))} />
                  : d.type === "pairs"
                  ? <BrPairs list={cur(d)} d={d} disabled={ro} onChange={(L) => set(d.key, BOQ.ruleTxt(d, L))} />
                  : <BrChips list={cur(d)} unit={d.unit} words={d.type === "words"} disabled={ro}
                      onChange={(L) => set(d.key, BOQ.ruleTxt(d, BOQ.ruleVal(d, L.join(", "))))} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {condRows.length > 0 && (
        <div style={card}>
          {blockHd("settings", "เงื่อนไขการเลือก", stockRows.length ? "ใช้เลือกจากของที่มีขายด้านบน" : "", condRows)}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {condRows.map((d, i) => {
              const head = gOf(d) && (i === 0 || gOf(condRows[i - 1]) !== gOf(d));
              const v = str(view, d.key);
              return (
                <React.Fragment key={d.key}>
                  {head && <div style={{ padding: i ? "16px 0 4px" : "0 0 4px", fontSize: 11.5, fontWeight: 700, color: "var(--primary-dark)" }}>{d.g}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "9px 0", borderTop: head ? "none" : i ? "1px solid var(--divider)" : "none" }}>
                    <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{d.th}{changedDot(d)}</div>
                      <div style={{ fontSize: 11, color: bad(d) ? "var(--tint-red-tx)" : "var(--text-3)", marginTop: 2 }}>
                        {bad(d) ? "ค่านี้ใช้ไม่ได้ — ระบบใช้ค่าตั้งต้น " : "ค่าตั้งต้น "}{txt(d)}{d.type ? "" : " " + d.unit}</div>
                    </div>
                    {d.type ? (
                      <textarea rows={1} disabled={ro} value={v || txt(d)} onChange={(e) => set(d.key, e.target.value)}
                        style={{ flex: "1 1 300px", boxSizing: "border-box", border: "none", outline: "none", fontFamily: "inherit", fontSize: 13, padding: "8px 10px",
                          borderRadius: "var(--r-chip)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", color: "var(--text-1)", resize: "vertical" }} />
                    ) : (
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, width: 168, boxSizing: "border-box", padding: "0 10px 0 0",
                        borderRadius: "var(--r-chip)", background: "var(--surface2)", boxShadow: bad(d) ? "var(--shadow-inset), 0 0 0 1.5px var(--tint-red-tx)" : "var(--shadow-inset)" }}>
                        <input type="number" step="any" disabled={ro} value={v !== "" ? v : String(d.def)} onChange={(e) => set(d.key, e.target.value)}
                          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700,
                            padding: "8px 4px 8px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-1)" }} />
                        <span style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis" }}>{d.unit}</span>
                      </label>
                    )}
                    <span style={{ width: 24, display: "inline-flex", justifyContent: "center" }}>{resetBtn(d)}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
        รายการที่ระบบคิดให้อัตโนมัติ (ตู้ไฟ · สายไฟ · รางไฟ · ทางเดิน · ของจากแบบ 3D) คิดใหม่ตามค่านี้เมื่อเปิดใบ BOQ ·
        ค่าขออนุญาต/วิศวกร และ % เผื่อ/กำไร ที่ใบกรอกไว้เองแล้วไม่ขยับตาม
      </div>

      {dirty.length > 0 && (
        <div style={{ position: "sticky", bottom: 12, zIndex: 5, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px",
          borderRadius: "var(--r-card)", background: "var(--surface)", boxShadow: "var(--shadow-pop)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--tint-amber-tx)" }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", flex: 1, minWidth: 0 }}>แก้ไว้ {dirty.length} ช่อง ยังไม่ได้บันทึก
            <span style={{ fontWeight: 500, color: "var(--text-3)" }}> · {dirty.map((d) => d.th).slice(0, 3).join(" · ")}{dirty.length > 3 ? " …" : ""}</span></span>
          <button className="btn btn-sm" onClick={() => setDraft(null)}>ยกเลิก</button>
          <button className="btn btn-sm btn-pri" onClick={save}>บันทึก</button>
        </div>
      )}
    </div>
  );
}

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
    // นับเฉพาะช่องที่ต่างจากค่าตั้งต้นในโค้ด — ค่าที่ฝังเป็นค่าตั้งต้นแล้วไม่ถือว่า "แก้"
    const dv = (i, m, col, s) => { try { return def[i][m][col][s]; } catch (e) { return undefined; } };
    let n = 0; Object.keys(ov).forEach((i) => Object.keys(ov[i] || {}).forEach((m) => Object.keys(ov[i][m] || {}).forEach((col) => Object.keys(ov[i][m][col] || {}).forEach((s) => { const v = +ov[i][m][col][s]; if (v > 0 && v !== dv(i, m, col, s)) n++; })))); return n;
  }, [ov, def]);
  /* คอลัมน์ = กลุ่ม × จำนวนตัวนำ × แกนย่อย — "แกนย่อย" ไม่เท่ากันทุกกลุ่ม
     กลุ่ม 1,2,3,7 แยกแกนเดียว/หลายแกน · กลุ่ม 4 แยกแนวตั้ง/แนวราบ · กลุ่ม 5,6 รวมเป็นคอลัมน์เดียว */
  const groupCores = (g) => (BOQ.ampCoresFor ? BOQ.ampCoresFor(g.key) : cores);
  const leaf = [];
  groups.forEach((g) => { const cs = groupCores(g); nconds.forEach((n, ni) => cs.forEach((c, ci) => leaf.push({ g: g.key, n: n.key, c: c.key, cTh: c.th, first: ni === 0 && ci === 0 }))); });
  const cellStyle = { width: 58, height: 32, padding: "0 4px", textAlign: "center", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)", background: "var(--surface)", color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 12 };
  const thBase = { fontSize: 10.5, fontWeight: 700, color: "var(--text-2)", textAlign: "center", whiteSpace: "nowrap", background: "var(--surface2)", borderBottom: "1px solid var(--divider)" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "12px 14px", background: "var(--tint-amber-bg)", border: "1px solid var(--tint-amber-bd)", borderRadius: "var(--r-tile)", marginBottom: 14 }}>
        <Icon name="alert" size={16} color="var(--tint-amber-tx)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12, color: "#92500C", lineHeight: 1.55 }}>
          ตารางพิกัดกระแส <strong>มาตรฐาน วสท.</strong> (ตัวนำทองแดง 0.6/1 kV) — แยกตาม <strong>กลุ่มการติดตั้ง × จำนวนตัวนำมีกระแส × แกนย่อย</strong>
          <br />แกนย่อยไม่เท่ากันทุกกลุ่ม: กลุ่ม 1,2,3,7 = <strong>แกนเดียว/หลายแกน</strong> · กลุ่ม 4 = <strong>แนวตั้ง/แนวราบ</strong> (แกนเดียวล้วน) · กลุ่ม 5,6 = <strong>รวมเป็นคอลัมน์เดียว</strong>
          <br />มีตารางครบแล้ว: <strong>PVC และ XLPE · ทุกวิธีเดินสาย · กลุ่มที่ 1–7</strong> (ตัวเลขจาง = ค่าตั้งต้นในระบบ) · ต้องการแก้ช่องไหน พิมพ์ทับได้เลย ค่าที่พิมพ์ใช้กับทุกงาน · ลบออก = กลับไปใช้ค่าตั้งต้น
        </div>
      </div>

      {/* บอกที่มาของตัวเลขจางในตาราง — ยืมมาจากวิธีอื่น หรือยังไม่มีเลย */}
      {borrowed ? (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", background: "var(--tint-ok-bg)", border: "1px solid var(--tint-ok-bd)", borderRadius: "var(--r-tile)", marginBottom: 14 }}>
          <Icon name="check" size={16} color="#1B9B75" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "var(--tint-ok-tx)", lineHeight: 1.55 }}>
            ตัวเลขจางในตารางนี้ <strong>ยืมมาจาก "{methodTh(baseKey)}"</strong> — {methodMeta.baseWhy || "วสท. ให้สองวิธีนี้ใช้ตารางพิกัดชุดเดียวกัน"}
            <br />เครื่องคำนวณ BOQ ใช้ค่าชุดนี้อยู่จริง · กรอกทับได้ถ้ามีตารางเฉพาะของรุ่นที่ใช้
          </div>
        </div>
      ) : noTable && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 14px", background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd2)", borderRadius: "var(--r-tile)", marginBottom: 14 }}>
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
          <button onClick={() => { askConfirm({ title: "คืนค่าพิกัดกระแสที่แก้ไว้ทั้งหมด?", body: "ค่าที่แก้เองไว้ " + editedCount + " ช่อง จะกลับไปเป็นค่าตั้งต้น", ok: "คืนค่าตั้งต้น" }).then((ok) => { if (ok) ampStore.reset(); }); }}
            style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: "var(--r-pill)", border: "1px solid var(--tint-red-bd2)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            <Icon name="x" size={13} color="var(--tint-red-tx)" /> คืนค่าที่แก้ ({editedCount})
          </button>
        )}
      </div>

      <div style={{ background: "var(--surface)", borderRadius: "var(--r-card)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                <th rowSpan={2} style={Object.assign({}, thBase, { padding: "8px 12px", textAlign: "left", position: "sticky", left: 0, color: "var(--text-3)" })}>ขนาด (mm²)</th>
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
                <tr key={sz} style={{ borderBottom: "1px solid var(--divider)" }}>
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
        <div style={{ padding: 14, borderRadius: "var(--r-tile)", border: "1px dashed var(--border-strong)", background: "var(--surface2)",
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
/* ลิงก์ในคำอธิบาย (ดาต้าชีตผู้ผลิต ฯลฯ) — URL ยาวเป็นพรืดอ่านไม่ออก แสดงเป็นชื่อโดเมนกดเปิดแท็บใหม่ */
function stkLinkify(t) {
  return String(t || "").split(/(https?:\/\/[^\s]+)/g).map((x, i) => {
    if (!/^https?:\/\//.test(x)) return x;
    let host = x; try { host = new URL(x).hostname.replace(/^www\./, ""); } catch (e) {}
    return <a key={i} href={x} target="_blank" rel="noopener noreferrer"
      style={{ color: "var(--primary-dark)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>{/\.pdf(\?|$)/i.test(x) ? "เปิดไฟล์ PDF" : host} ↗</a>;
  });
}
/* ช่องอุปกรณ์ที่ผูกกัน — แตะ = เปิดรายละเอียดของชิ้นนั้น */
function StkLinkTiles({ title, list, imgs, onOpen }) {
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-3)" }}>{title}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8 }}>
        {list.map((x) => (
          <button key={x.id} type="button" onClick={() => onOpen && onOpen(x)}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: 7, borderRadius: "var(--r-tile)", border: "none", textAlign: "left",
              background: "var(--surface)", boxShadow: "var(--shadow-sm)", cursor: onOpen ? "pointer" : "default", fontFamily: "inherit" }}>
            <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: "var(--r-chip)", overflow: "hidden", background: "#fff",
              display: "grid", placeItems: "center" }}>
              {imgs && imgs[x.id] ? <img src={imgs[x.id]} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <Icon name="box" size={16} color="var(--text-3)" />}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.35,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{x.name}</span>
              <span style={{ display: "block", fontSize: 10.5, color: "var(--text-3)", marginTop: 1 }}>
                {+x.price > 0 ? "฿" + Number(x.price).toLocaleString("th-TH") : "ยังไม่มีราคา"}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemDetailModal({ item, img, variants, loadDoc, setDoc, onMove, onEdit, onClose, onPickVariant, onAddSize, items, imgs, onOpen }) {
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
    /* ตัวคุมแผง (Smart Module Controller) */
    { k: "optW", th: "กำลังแผงสูงสุด (W)" }, { k: "optVinMax", th: "แรงดันเข้าสูงสุด (V)" },
    { k: "optMpptMin", th: "MPPT ต่ำสุด (V)" }, { k: "optMpptMax", th: "MPPT สูงสุด (V)" },
    { k: "optIscMax", th: "Isc สูงสุด (A)" }, { k: "optVoutMax", th: "แรงดันออกสูงสุด (V)" },
    { k: "optIoutMax", th: "กระแสออกสูงสุด (A)" }, { k: "optEff", th: "ประสิทธิภาพ (%)" },
    { k: "optVoff", th: "แรงดันตอนสั่งปิด (V/ตัว)" }, { k: "optPerPanel", th: "แผงต่อ 1 ตัว" },
    { k: "optMinPerStr", th: "ตัวคุมต่อสตริง ต่ำสุด" }, { k: "optMaxPerStr", th: "ตัวคุมต่อสตริง สูงสุด" },
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
  const warTxt = [+item.warY > 0 ? "รับประกัน " + (+item.warY) + " ปี" : "",
    +item.warPerfY > 0 ? "ประสิทธิภาพ " + (+item.warPerfY) + " ปี" : ""].filter(Boolean).join(" · ");
  const priceTxt = +item.price > 0 ? (+item.price).toLocaleString(undefined, { maximumFractionDigits: 2 }) : null;
  const sectionLabel = { fontSize: 10.5, fontWeight: 800, color: "var(--text-3)" };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 110,
      display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18,
        width: isMobile ? "100%" : "min(1280px,100%)", maxHeight: isMobile ? "94dvh" : "94vh", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.45)" }}>

        {/* หัว — เหลือแค่ทางเดินของหมวด ชื่อสินค้าไปอยู่ตัวใหญ่ข้างใน */}
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", flexShrink: 0,
          display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ minWidth: 0, flex: 1, fontSize: 12, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: mainCat.color, fontWeight: 700 }}>{mainCat.th}</span>
            {mainCat.key !== c.key ? <span> › {c.th}</span> : null}
          </span>
          <button className="x-close" onClick={onClose} style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)",
            background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ padding: isMobile ? 16 : 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* สองคอลัมน์แบบหน้าสินค้า — ซ้ายรูปใหญ่ ขวาข้อมูล+ราคา+ปุ่ม */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,540px) minmax(0,1fr)", gap: isMobile ? 16 : 28 }}>
            <div>
              <div style={{ background: "var(--surface2)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", overflow: "hidden",
                aspectRatio: "1 / 1", display: "grid", placeItems: "center", padding: 16, position: "relative" }}>
                <MatThumb src={img} item={item} size={"100%"} radius={0} />
                {st !== "ok" && (
                  <span style={{ position: "absolute", top: 12, left: 12, fontSize: 11, fontWeight: 800, padding: "5px 11px", borderRadius: "var(--r-pill)",
                    background: st === "out" ? "#EF4444" : "#F59E0B", color: "#fff" }}>{st === "out" ? "หมดสต็อก" : "ต่ำกว่าขั้นต่ำ"}</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              {(item.brand || "").trim() && (
                <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 800, letterSpacing: ".04em", padding: "4px 11px",
                  borderRadius: "var(--r-chip)", background: mainCat.color + "18", color: mainCat.color }}>{item.brand}</span>
              )}
              <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 25, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, letterSpacing: "-.01em" }}>{item.name}</h2>
              {(item.model || "").trim() && (
                <div style={{ fontSize: 13.5, color: "var(--text-2)", fontWeight: 600 }}>รุ่น {item.model}</div>
              )}
              {warTxt && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, alignSelf: "flex-start", padding: "7px 12px", borderRadius: "var(--r-tile)",
                  background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                  <Icon name="shield" size={15} color="var(--primary-dark)" />
                  <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    <b style={{ color: "var(--primary-dark)" }}>{warTxt}</b>
                    {(item.warNote || "").trim() && <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>{item.warNote}</span>}
                  </span>
                </div>
              )}
              {(item.desc || "").trim() && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{stkLinkify(item.desc)}</p>
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
                          style={{ padding: "6px 13px", borderRadius: "var(--r-chip)", cursor: on ? "default" : "pointer", fontFamily: "inherit",
                            fontSize: 12.5, fontWeight: 700, border: "none", boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "none",
                            background: on ? "var(--primary)18" : "var(--surface)",
                            color: on ? "var(--primary-dark)" : (vs === "out" ? "var(--text-3)" : "var(--text-2)"),
                            textDecoration: vs === "out" ? "line-through" : "none" }}>
                          {v.size}
                        </button>
                      );
                    })}
                    {onAddSize && (
                      <button onClick={onAddSize} title="เพิ่มขนาดใหม่ให้ของชิ้นนี้"
                        style={{ padding: "6px 12px", borderRadius: "var(--r-chip)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                          border: "1px dashed var(--border-strong)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-3)" }}>＋ เพิ่มขนาด</button>
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
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "13px 8px", borderRadius: "var(--r-tile)",
                        border: "none", background: mt.bg, color: mt.color,
                        fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      <span style={{ fontSize: 19, lineHeight: 1 }}>{mt.sym}</span>
                      {mt.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 1, background: "var(--border)",
                borderRadius: "var(--r-tile)", overflow: "hidden" }}>
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
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-3)" }}>สเปคอุปกรณ์</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                {specs.map((f) => (
                  <div key={f.k} style={{ padding: "8px 10px", borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>{f.th}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", marginTop: 2 }}>{item[f.k]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* อุปกรณ์เสริมที่ใช้คู่กัน · กลับด้าน = อุปกรณ์เสริมชิ้นนี้ใช้กับอินเวอร์เตอร์รุ่นไหน */}
          <StkLinkTiles title="อุปกรณ์เสริมที่ใช้คู่กัน" imgs={imgs} onOpen={onOpen}
            list={(item.accIds || []).map((id) => (items || []).find((x) => x && x.id === id)).filter(Boolean)} />
          {(() => { const L = (items || []).filter((x) => x && Array.isArray(x.accIds) && x.accIds.indexOf(item.id) !== -1);
            /* อุปกรณ์เสริม MCCB (คอยล์/สวิตช์ช่วย) ก็ผูกด้วย accIds บนตัว MCCB เหมือนอินเวอร์เตอร์ */
            const mc = L.length && L.every((x) => x.elecType === "MCCB");
            return <StkLinkTiles title={mc ? "ใช้กับ MCCB รุ่น" : "ใช้คู่กับอินเวอร์เตอร์"} imgs={imgs} onOpen={onOpen} list={L} />; })()}

          {/* DATA SHEET — แนบไฟล์ PDF ของผู้ผลิต ไว้เปิดดูหน้างานได้เลย */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-3)" }}>DATA SHEET / เอกสาร</span>
            {doc && doc.data ? (
              <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", borderRadius: "var(--r-tile)",
                background: "var(--surface2)", boxShadow: "var(--shadow-sm)" }}>
                <span style={{ width: 38, height: 38, borderRadius: "var(--r-chip)", flexShrink: 0, display: "grid", placeItems: "center",
                  background: "var(--tint-red-bg)", color: "var(--tint-red-tx2)", fontSize: 10, fontWeight: 800 }}>PDF</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{kb(doc.size || 0)}</span>
                </span>
                <button onClick={openDoc} style={{ flexShrink: 0, padding: "7px 13px", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)",
                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>เปิดเต็มจอ</button>
                <button onClick={() => { askConfirm({ title: "ลบเอกสารนี้?", body: "DATA SHEET ที่แนบไว้กับรายการนี้จะหายไป", ok: "ลบเอกสาร" }).then((ok) => { if (ok) { setDoc(item.id, null); setDocState(null); } }); }}
                  title="ลบ" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)",
                    background: "var(--surface)", color: "var(--tint-red-tx2)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={14} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 12px", borderRadius: "var(--r-tile)",
                  border: "1px dashed var(--border-strong)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)",
                  fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: busy ? "wait" : "pointer", width: "100%" }}>
                <Icon name="plus" size={14} color="var(--text-2)" />
                {/* รูป JPG/PNG จะถูกเอาไปต่อท้ายเป็นหน้าใน "รายงานผลสำรวจ" ให้อัตโนมัติ เมื่อเสนอรุ่นนี้ */}
                {busy ? "กำลังอัปโหลด…" : (item.doc ? "กำลังโหลดเอกสาร…" : "แนบ DATA SHEET (PDF หรือรูป)")}
              </button>
            )}
            {/* แสดงเอกสารในหน้านี้เลย — ไม่ต้องกดเปิดแท็บใหม่ */}
            {doc && doc.data && (isDocImg
              ? <img src={docUrl} alt={doc.name} style={{ width: "100%", borderRadius: "var(--r-tile)", display: "block" }} />
              : <PdfPreview data={doc.data} onOpen={openDoc} />)}
            <input ref={fileRef} type="file" accept="application/pdf,image/*" style={{ display: "none" }}
              onChange={(e) => { pickDoc(e.target.files && e.target.files[0]); e.target.value = ""; }} />
          </div>
        </div>

        <div style={{ padding: "13px 22px", borderTop: "1px solid var(--divider)", background: "var(--surface)", display: "flex",
          gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          {/* เพิ่มขนาดใหม่ให้ของชิ้นนี้ — ก๊อปชื่อ/หมวด/ยี่ห้อ/หน่วยไปให้แล้ว เหลือแก้ตัวเลขขนาดกับราคา */}
          {onAddSize && (
            <button onClick={onAddSize} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: "var(--r-tile)",
              marginRight: "auto", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--primary-dark)",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Icon name="plus" size={14} color="var(--primary-dark)" /> เพิ่มขนาด
            </button>
          )}
          <button onClick={onEdit} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: "var(--r-tile)",
            background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontFamily: "inherit",
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
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", flexShrink: 0 }}>
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
              alignItems: "center", padding: "9px 20px", borderBottom: "1px solid var(--divider)", cursor: "pointer" }}>
              <input type="checkbox" checked={on(r.it.id)} onChange={() => toggle(r.it.id)} style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 12.5, color: "var(--text-1)", lineHeight: 1.35 }}>{r.it.name}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>{r.it.sku}</span>
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {r.g.brand && <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--primary-dark)", background: "var(--primary-soft)", borderRadius: "var(--r-pill)", padding: "2px 9px" }}>{r.g.brand}</span>}
                {r.g.model && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-pill)", padding: "2px 9px" }}>{r.g.model}</span>}
              </span>
            </label>
          ))}
        </div>
        <div style={{ padding: "13px 20px", borderTop: "1px solid var(--divider)", background: "var(--surface)", display: "flex",
          gap: 8, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>เลือกไว้ {picked.length} / {rows.length} รายการ</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "9px 15px", borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-sm)",
              background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
            <button disabled={!picked.length} onClick={apply}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: "var(--r-tile)", border: 0,
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
    boxShadow: "var(--shadow-sm)" };
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
const STK_INV_TYPE = { hybrid: "Hybrid", string: "On-grid", micro: "Micro" };
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
            style={{ background: "var(--surface)", borderRadius: "var(--r-tile)", overflow: "hidden",
              cursor: "pointer", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ position: "relative", background: "var(--surface2)", aspectRatio: "1 / 1", display: "grid", placeItems: "center", padding: 10 }}>
              <MatThumb src={imgs[it.id]} item={it} size={"100%"} radius={0} />
              {st !== "ok" && (
                <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: "var(--r-pill)",
                  background: st === "out" ? "#EF4444" : "#F59E0B", color: "#fff" }}>{st === "out" ? "หมดสต็อก" : "ต่ำกว่าขั้นต่ำ"}</span>
              )}
              {g && (
                <span style={{ position: "absolute", top: 8, right: 8, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: "var(--r-pill)",
                  background: "var(--surface)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)" }}>{g.n} ขนาด</span>
              )}
            </div>
            <div style={{ padding: "10px 11px 11px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              {(it.brand || "").trim() && <div style={{ fontSize: 10.5, fontWeight: 800, color: c.color || "var(--text-2)", letterSpacing: ".03em" }}>{it.brand}</div>}
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.35,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g ? baseLabel(it.name) : it.name}</div>
              {/* อินเวอร์เตอร์: ชนิด + เฟส — สองอย่างที่ต้องรู้ก่อนเลือกรุ่น ไม่ต้องกดเข้าไปดู */}
              {window.SF.mainCatOf(it.cat) === "inverter" && (it.invType || +it.invPhase > 0) && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[STK_INV_TYPE[it.invType], +it.invPhase > 0 ? it.invPhase + " เฟส" : ""].filter(Boolean).map((t) => (
                    <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: "var(--r-chip)",
                      background: t === "Hybrid" ? "#F59E0B1c" : "var(--surface2)", color: t === "Hybrid" ? "#B45309" : "var(--text-2)" }}>{t}</span>
                  ))}
                </div>
              )}
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
                <div style={{ marginTop: 7, height: 28, borderRadius: "var(--r-chip)", background: "var(--primary-soft)", color: "var(--primary-dark)",
                  fontSize: 11.5, fontWeight: 700, display: "grid", placeItems: "center" }}>เลือกขนาด</div>
              ) : (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 5, marginTop: 7 }}>
                  <button onClick={() => onEdit(it)} title="แก้ไข" style={{ flex: 1, height: 28, background: "#3B82F614", border: "none", color: "#3B82F6", borderRadius: "var(--r-chip)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="settings" size={13} /></button>
                  <button onClick={() => { askConfirm({ title: "ลบ “" + it.name + "” ออกจากคลัง?" }).then((ok) => { if (ok) onRemove(it.id); }); }} title="ลบ" style={{ width: 32, height: 28, background: "var(--tint-red-bg)", border: "none", color: "var(--tint-red-tx2)", borderRadius: "var(--r-chip)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>
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
            style={{ padding: "7px 13px", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)",
              color: "var(--text-1)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "กำลังย่อรูป…" : (src ? "เปลี่ยนรูป" : "เลือกรูป")}
          </button>
          {src && (
            <button type="button" onClick={onClear}
              style={{ padding: "7px 11px", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)", background: "var(--surface2)", boxShadow: "var(--shadow-sm)",
                color: "var(--tint-red-tx2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบรูป</button>
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
  /* ปุ่มนี้นั่งอยู่บนการ์ดหมวดซึ่งเป็นสีขาว — พื้นขาวล้วนบนพื้นขาวมองไม่เห็น
     พื้นจางกว่านิดหนึ่งบวกเงาซ้อนชั้น (วงแหวน 1px อยู่ในชั้นแรก) จึงอ่านออกมาเป็นปุ่มกดได้ */
  const btn = { padding: "3px 9px", borderRadius: "var(--r-pill)", background: "var(--surface2)",
    boxShadow: "var(--shadow-sm)",
    fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, cursor: busy ? "wait" : "pointer", color: "var(--text-2)" };
  return (
    <div onClick={() => onPick(c.key)}
      style={{ position: "relative", background: "var(--surface)", borderRadius: "var(--r-tile)",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: 14, boxShadow: "var(--shadow-sm)" }}>
      <span style={{ width: 76, height: 76, borderRadius: "var(--r-tile)", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center",
        background: img ? "var(--surface2)" : c.color + "16", border: "none", boxShadow: img ? "none" : "inset 0 0 0 1px " + c.color + "33" }}>
        {img
          ? <img src={img} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
          : <Icon name={c.icon || "box"} size={30} color={c.color} />}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3 }}>{c.th}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
          {(n || 0).toLocaleString()} รายการ
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
/* แถบยี่ห้อเลื่อนวนบนหน้าแรกของคลัง — แตะยี่ห้อ = ดูของยี่ห้อนั้นทุกหมวด
   รูปยี่ห้อ = รูปที่ตั้งไว้บนการ์ดยี่ห้อ (cat_brand_<ยี่ห้อ>) หรือรูปหมวดย่อยที่ชื่อตรงกัน ไม่มี = ตัวหนังสือ
   รายการซ้ำสองชุดแล้วเลื่อนครึ่งความยาว ภาพจึงวนต่อเนื่องไม่กระตุก · ชี้เมาส์ = หยุด */
// ยี่ห้อที่ไม่มีรูป = พื้นไล่สีอ่อน สีตามชื่อยี่ห้อ (คงที่ทุกครั้ง) ไม่ให้ช่องขาวเรียงกันจืด ๆ
const bmTint = (b) => {
  let h = 0; for (let i = 0; i < b.length; i++) h = (h * 31 + b.charCodeAt(i)) % 360;
  return { width: "100%", height: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, hsl(" + h + " 70% 94%), hsl(" + ((h + 40) % 360) + " 65% 84%))", color: "hsl(" + h + " 55% 28%)" };
};
/* รูปยี่ห้อส่วนมากเป็นโลโก้เล็ก ๆ กลางพื้นขาวสี่เหลี่ยมจัตุรัส — ตัดพื้นขาวรอบโลโก้ออกก่อน แล้วขยายให้เต็มช่อง
   (object-fit cover ตรง ๆ ตัดโลโก้ทรงกว้างขาด) · รูปที่ไม่มีพื้นขาว (รูปถ่าย) = เต็มช่องแบบ cover */
const _bmTrim = {};
function bmTrim(src) {
  if (_bmTrim[src]) return _bmTrim[src];
  return (_bmTrim[src] = new Promise((done) => {
    const im = new Image();
    im.onload = () => {
      try {
        const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement("canvas");
        c.width = W; c.height = H; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
          const i = (y * W + x) * 4;
          if (d[i + 3] > 20 && Math.min(d[i], d[i + 1], d[i + 2]) < 235) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 < 0 || ((x1 - x0) > W * 0.9 && (y1 - y0) > H * 0.9)) return done({ src: src, cover: true });
        const w = x1 - x0 + 3, h = y1 - y0 + 3, o = document.createElement("canvas");
        o.width = w; o.height = h; o.getContext("2d").drawImage(im, x0 - 1, y0 - 1, w, h, 0, 0, w, h);
        done({ src: o.toDataURL("image/png"), cover: false });
      } catch (e) { done({ src: src, cover: true }); }
    };
    im.onerror = () => done({ src: src, cover: true });
    im.src = src;
  }));
}
function BmImg({ src, alt }) {
  const [t, setT] = React.useState(null);
  React.useEffect(() => { let on = true; bmTrim(src).then((r) => { if (on) setT(r); }); return () => { on = false; }; }, [src]);
  if (!t) return null;
  return t.cover
    ? <img src={t.src} alt={alt} />
    : <span className="bm-logo"><img src={t.src} alt={alt} /></span>;
}
function BrandMarquee({ items, imgs, onPick }) {
  const list = React.useMemo(() => {
    const m = {};
    items.forEach((it) => { const b = (it.brand || "").trim(); if (b) m[b] = (m[b] || 0) + 1; });
    const byName = {};
    SF.STOCK_CATS.concat(Object.keys(SF.STOCK_SUB_BY_CAT || {}).reduce((a, k) => a.concat(SF.STOCK_SUB_BY_CAT[k] || []), []))
      .forEach((c) => { if (c && c.th && imgs["cat_" + c.key]) byName[String(c.th).trim().toLowerCase()] = imgs["cat_" + c.key]; });
    return Object.keys(m).sort((a, z) => m[z] - m[a] || a.localeCompare(z)).map((b) => {
      const k = "brand_" + b.toLowerCase().replace(/[.#$\[\]\/\s]+/g, "_");
      return { b: b, n: m[b], img: imgs["cat_" + k] || byName[b.toLowerCase()] || "" };
    }).filter((x) => x.img);   // แถบเลื่อนโชว์เฉพาะยี่ห้อที่มีโลโก้ (ผู้ใช้ ต.ค. 2026 — ตัวหนังสือล้วนไม่สวย)
  }, [items, imgs]);
  if (!list.length) return null;
  const one = (x, i, dup) => (
    <button key={(dup ? "d" : "") + x.b} type="button" className="bm-item" tabIndex={dup ? -1 : 0} aria-hidden={dup || undefined}
      title={x.b + " · " + x.n + " รายการ"} onClick={() => onPick(x.b)}>
      {x.img
        ? <BmImg src={x.img} alt={x.b} />
        : <span className="bm-word" style={bmTint(x.b)}>{x.b}</span>}
    </button>
  );
  return (
    <div className="bm-wrap" style={{ marginBottom: 18 }}>
      <div className="bm-track" style={{ animationDuration: Math.max(20, list.length * 3.2) + "s" }}>
        {list.map((x, i) => one(x, i, false))}
        {list.map((x, i) => one(x, i, true))}
      </div>
    </div>
  );
}

/* กลุ่มของหมวดย่อย — ตั้งที่ stockCats/<หมวดย่อย>.grp (ผู้ใช้ ต.ค. 2026: อุปกรณ์ไฟฟ้าแยกฝั่ง DC / AC ก่อน แล้วค่อยเป็นชนิดอุปกรณ์) */
const STOCK_GRPS = {
  DC: { th: "อุปกรณ์ DC", color: "#DC2626" },
  AC: { th: "อุปกรณ์ AC", color: "#2563EB" },
};
const stockGrpOf = (k) => ((SF.STOCK_CAT_BY[k] || {}).grp || "");

function CatBrowser({ list, count, low, imgs, title, hint, allLabel, onPick, onAll, onBack, onSetImage, tools }) {
  const shown = list || [];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        {onBack && (
          <button onClick={onBack} title="กลับไปหน้าหมวดหลัก"
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)",
              background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: "rotate(90deg)" }} />ย้อนกลับ
          </button>
        )}
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{title}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{hint}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>{tools}</span>
        <button onClick={onAll} style={{ padding: "7px 14px", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)",
          background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
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

Object.assign(window, { StockView, BoqRulesPage });
