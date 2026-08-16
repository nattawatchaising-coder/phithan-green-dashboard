function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function lowState(it) {
  if (it.qty <= 0) return "out";
  if (it.qty <= it.min) return "low";
  return "ok";
}
const STOCK_COLORS = {
  out: "#EF4444",
  low: "#F59E0B",
  ok: "#22A35B"
};
const SIZE_RE = /(\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?|mm\.?|มม\.?)?)|(\d+[\s-]\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?))|(\d+(?:\.\d+)?\s*(?:mm\.?|มม\.?|"|″|นิ้ว))/i;
function sizeOfName(name) {
  const s = String(name || "");
  const m = s.match(SIZE_RE);
  if (!m) return null;
  return {
    size: m[0].trim().replace(/\s+/g, " "),
    base: s.slice(0, m.index) + "\u0000" + s.slice(m.index + m[0].length)
  };
}
function sizeGroupKey(it) {
  const p = sizeOfName(it && it.name);
  if (!p) return null;
  return window.SF.mainCatOf(it.cat) + "|" + String(it.brand || "").trim().toLowerCase() + "|" + p.base.toLowerCase();
}
function sizeNum(txt) {
  const m = String(txt).match(/\d+(?:\.\d+)?/);
  return m ? +m[0] : 0;
}
function sizeLabel(it) {
  return (sizeOfName(it && it.name) || {}).size || "";
}
function baseLabel(name) {
  const p = sizeOfName(name);
  if (!p) return name;
  return p.base.replace("\u0000", "").replace(/\s{2,}/g, " ").replace(/\s+([)\]])/g, "$1").replace(/([([])\s+/g, "$1").trim();
}
function groupSummary(list) {
  const prices = list.map(x => +x.price || 0).filter(v => v > 0);
  return {
    n: list.length,
    min: prices.length ? Math.min.apply(null, prices) : 0,
    max: prices.length ? Math.max.apply(null, prices) : 0,
    qty: list.reduce((s, x) => s + (+x.qty || 0), 0),
    st: list.every(x => lowState(x) === "out") ? "out" : list.some(x => lowState(x) !== "ok") ? "low" : "ok",
    sizes: list.map(sizeLabel).filter(Boolean)
  };
}
const MOVE_TYPES = {
  in: {
    key: "in",
    label: "รับเข้า",
    sym: "+",
    color: "var(--tint-ok-tx)",
    accent: "#22A35B",
    bg: "#22A35B16",
    title: "รับเข้าคลัง",
    sub: "เพิ่มสต็อกจากการสั่งซื้อ"
  },
  out: {
    key: "out",
    label: "เบิกออก",
    sym: "−",
    color: "#6645e0",
    accent: "#7C5CFC",
    bg: "#7C5CFC16",
    title: "เบิกออกหน้างาน",
    sub: "เลือกงานที่นำไปใช้"
  },
  return: {
    key: "return",
    label: "คืนของ",
    sym: "↩",
    color: "#0784b8",
    accent: "#0EA5E9",
    bg: "#0EA5E916",
    title: "คืนของเข้าคลัง",
    sub: "คืนอุปกรณ์ที่เบิกจากงาน"
  }
};
function StockKpi({
  label,
  value,
  unit,
  icon,
  accent,
  sub,
  active,
  onClick
}) {
  const [hov, setHov] = React.useState(false);
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      background: active ? accent + "0e" : "var(--surface)",
      border: "1px solid " + (active || hov ? accent : "var(--border)"),
      borderRadius: mob ? 14 : 16,
      padding: mob ? 14 : 18,
      boxShadow: active ? "0 0 0 3px " + accent + "22" : hov ? "0 4px 12px rgba(0,0,0,.08)" : "var(--shadow-sm)",
      position: "relative",
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      transform: hov && onClick ? "translateY(-2px)" : "none",
      transition: "transform .14s, border-color .14s, box-shadow .14s, background .14s"
    }
  }, React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      background: accent
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: mob ? 11 : 12,
      fontWeight: 600,
      color: "var(--text-2)",
      whiteSpace: mob ? "normal" : "nowrap",
      lineHeight: 1.3
    }
  }, label), React.createElement("span", {
    style: {
      width: mob ? 28 : 32,
      height: mob ? 28 : 32,
      borderRadius: mob ? 8 : 9,
      background: accent + "16",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: icon,
    size: mob ? 15 : 16,
    color: accent
  }))), React.createElement("div", {
    style: {
      marginTop: mob ? 10 : 12,
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: mob ? 24 : 30,
      fontWeight: 700,
      color: "var(--text-1)",
      lineHeight: 1
    }
  }, value), unit && React.createElement("span", {
    style: {
      fontSize: mob ? 12 : 13,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, unit)), sub && React.createElement("div", {
    style: {
      marginTop: 7,
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, sub));
}
function StockView({
  stock,
  onResetAll,
  onMenuOpen,
  currentUser,
  jobs,
  priceStore,
  ampStore,
  canManagePrices
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const byName = currentUser && currentUser.name || "-";
  const [tab, setTab] = React.useState("stock");
  const isPrices = tab === "prices" && canManagePrices;
  const isAmp = tab === "amp" && canManagePrices;
  const [cat, setCat] = React.useState("all");
  const [sub, setSub] = React.useState("all");
  const [view, setView] = React.useState(() => localStorage.getItem("sf_stock_view") || "grid");
  React.useEffect(() => {
    try {
      localStorage.setItem("sf_stock_view", view);
    } catch (e) {}
  }, [view]);
  React.useEffect(() => {
    if (stock.enableImages) stock.enableImages();
  });
  const imgs = stock.imgs || {};
  const [browse, setBrowse] = React.useState(true);
  const [catOpen, setCatOpen] = React.useState(() => localStorage.getItem("sf_stock_catopen") === "1");
  const toggleCat = () => setCatOpen(v => {
    localStorage.setItem("sf_stock_catopen", v ? "0" : "1");
    return !v;
  });
  const [kpiFilter, setKpiFilter] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [moveItem, setMoveItem] = React.useState(null);
  const [itemForm, setItemForm] = React.useState(null);
  const [detailItem, setDetailItem] = React.useState(null);
  const [fillOpen, setFillOpen] = React.useState(false);
  const [brand, setBrand] = React.useState("all");
  const [movesOpen, setMovesOpen] = React.useState(false);
  const [priceQ, setPriceQ] = React.useState("");
  const [priceGrp, setPriceGrp] = React.useState("all");
  const [addPriceOpen, setAddPriceOpen] = React.useState(false);
  const priceGroups = React.useMemo(() => {
    try {
      const gs = ["all"].concat([...new Set(window.BOQ.catalog().map(c => c.group))]);
      if (!gs.includes("ACCESSORIES")) gs.push("ACCESSORIES");
      return gs;
    } catch (e) {
      return ["all"];
    }
  }, []);
  const PG_TH = window.PRICE_GROUP_TH || {};
  const PG_COLOR = window.PRICE_GROUP_COLOR || {};
  const items = stock.items;
  const lowCount = items.filter(it => lowState(it) !== "ok").length;
  const catCount = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      const k = SF.mainCatOf(it.cat);
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  }, [items]);
  const subCount = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      if (SF.mainCatOf(it.cat) !== it.cat) m[it.cat] = (m[it.cat] || 0) + 1;
    });
    return m;
  }, [items]);
  const subChips = (SF.STOCK_SUB_BY_CAT[cat] || []).filter(c => sub === c.key || subCount[c.key]);
  const browsing = !isPrices && !isAmp && browse && !search.trim() && brand === "all" && !kpiFilter;
  const showCatHome = browsing && cat === "all";
  const showSubHome = browsing && cat !== "all" && sub === "all" && subChips.length > 0;
  const catLow = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      if (lowState(it) !== "ok") {
        const k = SF.mainCatOf(it.cat);
        m[k] = (m[k] || 0) + 1;
      }
    });
    return m;
  }, [items]);
  const goBack = () => {
    if (sub !== "all") {
      setSub("all");
      setBrowse(true);
      return;
    }
    if (cat !== "all") {
      setCat("all");
      setBrowse(true);
      return;
    }
    setBrowse(true);
    setKpiFilter(null);
    setSearch("");
    setBrand("all");
  };
  const subLow = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      if (lowState(it) !== "ok" && SF.mainCatOf(it.cat) !== it.cat) m[it.cat] = (m[it.cat] || 0) + 1;
    });
    return m;
  }, [items]);
  React.useEffect(() => {
    setSub("all");
  }, [cat]);
  React.useEffect(() => {
    if (sub !== "all" && !subChips.some(c => c.key === sub)) setSub("all");
  }, [subChips.length]);
  const brandCount = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      if (cat !== "all" && it.cat !== cat) return;
      const b = (it.brand || "").trim();
      if (!b) return;
      m[b] = (m[b] || 0) + 1;
    });
    return m;
  }, [items, cat]);
  const brandList = React.useMemo(() => Object.keys(brandCount).sort((a, z) => a.localeCompare(z, "th")), [brandCount]);
  React.useEffect(() => {
    if (brand !== "all" && !brandCount[brand]) setBrand("all");
  }, [brandCount]);
  const thisMonth = SF.TODAY.slice(0, 7);
  const inItemIds = new Set(stock.moves.filter(m => m.type === "in" && m.date.startsWith(thisMonth)).map(m => m.itemId));
  const outItemIds = new Set(stock.moves.filter(m => m.type === "out" && m.date.startsWith(thisMonth)).map(m => m.itemId));
  const inMonth = stock.moves.filter(m => m.type === "in" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);
  const outMonth = stock.moves.filter(m => m.type === "out" && m.date.startsWith(thisMonth)).reduce((s, m) => s + m.qty, 0);
  const catOrder = {};
  SF.STOCK_CATS.forEach((c, i) => {
    catOrder[c.key] = i;
  });
  const filtered = items.filter(it => {
    if (cat !== "all" && it.cat !== cat && SF.mainCatOf(it.cat) !== cat) return false;
    if (sub !== "all" && it.cat !== sub) return false;
    if (brand !== "all" && (it.brand || "") !== brand) return false;
    if (search && !(it.name + it.sku + it.loc + (it.brand || "") + (it.model || "")).toLowerCase().includes(search.toLowerCase())) return false;
    if (kpiFilter === "low" && lowState(it) === "ok") return false;
    if (kpiFilter === "in" && !inItemIds.has(it.id)) return false;
    if (kpiFilter === "out" && !outItemIds.has(it.id)) return false;
    return true;
  }).sort((a, b) => {
    const ka = SF.mainCatOf(a.cat),
      kb = SF.mainCatOf(b.cat);
    const ca = catOrder[ka] != null ? catOrder[ka] : 99;
    const cb = catOrder[kb] != null ? catOrder[kb] : 99;
    if (ca !== cb) return ca - cb;
    if (a.cat !== b.cat) return String(a.cat).localeCompare(String(b.cat));
    return String(a.name || "").localeCompare(String(b.name || ""), "th", {
      numeric: true
    });
  });
  const sizeGroups = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      const k = sizeGroupKey(it);
      if (k) (m[k] = m[k] || []).push(it);
    });
    return m;
  }, [items]);
  const rowsOf = list => {
    const byKey = {};
    list.forEach(it => {
      const k = sizeGroupKey(it);
      if (k) (byKey[k] = byKey[k] || []).push(it);
    });
    const seen = {},
      out = [];
    list.forEach(it => {
      const k = sizeGroupKey(it);
      const g = k ? byKey[k] : null;
      if (!g || g.length < 2) {
        out.push({
          it: it,
          sizes: null
        });
        return;
      }
      if (seen[k]) return;
      seen[k] = 1;
      const sorted = g.slice().sort((a, b) => sizeNum(sizeLabel(a)) - sizeNum(sizeLabel(b)) || sizeLabel(a).localeCompare(sizeLabel(b)));
      out.push({
        it: sorted.find(x => imgs[x.id]) || sorted[0],
        sizes: sorted
      });
    });
    return out;
  };
  const addSizeFrom = it => {
    if (!it) return;
    const rec = Object.assign(stock.blankItem(), {
      name: it.name || "",
      cat: it.cat,
      brand: it.brand || "",
      unit: it.unit || "ชิ้น",
      min: +it.min || 0,
      loc: it.loc || "",
      desc: it.desc || "",
      qty: 0,
      price: 0,
      sku: ""
    });
    setDetailItem(null);
    setItemForm({
      item: rec,
      isNew: true,
      sizeOf: it.name
    });
  };
  const variantsOf = it => {
    const k = sizeGroupKey(it);
    const list = k && sizeGroups[k] || [];
    if (list.length < 2) return [];
    return list.map(x => ({
      it: x,
      size: (sizeOfName(x.name) || {}).size || ""
    })).sort((a, b) => sizeNum(a.size) - sizeNum(b.size) || a.size.localeCompare(b.size));
  };
  const directItems = showSubHome ? filtered.filter(it => it.cat === cat) : [];
  return React.createElement(React.Fragment, null, React.createElement("header", {
    className: "app-header"
  }, React.createElement("div", {
    className: "header-top"
  }, React.createElement("button", {
    className: "hamburger",
    onClick: onMenuOpen,
    "aria-label": "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39"
  }, React.createElement(Icon, {
    name: "menu",
    size: 18,
    color: "var(--text-2)"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("h1", {
    className: "page-title"
  }, isAmp ? "พิกัดกระแสสายไฟ (วสท.)" : isPrices ? "ราคาวัสดุ (BOQ)" : "คลังสินค้า / สต็อก"), isAmp ? React.createElement("p", {
    className: "page-sub"
  }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A \u0E27\u0E2A\u0E17. \u2014 \u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E09\u0E19\u0E27\u0E19 \xD7 \u0E27\u0E34\u0E18\u0E35\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22 \xD7 \u0E02\u0E19\u0E32\u0E14 (\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13/\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E43\u0E19 BOQ)") : isPrices ? React.createElement("p", {
    className: "page-sub"
  }, "\u0E23\u0E2B\u0E31\u0E2A / \u0E23\u0E32\u0E04\u0E32 / \u0E2B\u0E19\u0E48\u0E27\u0E22 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E33\u0E19\u0E27\u0E13\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19 BOQ") : React.createElement("p", {
    className: "page-sub"
  }, "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 ", React.createElement("strong", null, filtered.length), " \u0E08\u0E32\u0E01 ", items.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", kpiFilter && React.createElement("span", null, " \xB7 ", React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700
    }
  }, "\u0E01\u0E23\u0E2D\u0E07: ", kpiFilter === "low" ? "ใกล้หมด" : kpiFilter === "in" ? "รับเข้าเดือนนี้" : "เบิกออกเดือนนี้"), " ", React.createElement("button", {
    onClick: () => setKpiFilter(null),
    className: "clear-chip"
  }, "\u0E25\u0E49\u0E32\u0E07 \u2715")), !kpiFilter && lowCount > 0 && React.createElement("span", null, " \xB7 ", React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700
    }
  }, lowCount, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14")))), !isAmp && React.createElement("div", {
    className: "header-actions"
  }, React.createElement("div", {
    className: "search-box"
  }, React.createElement(Icon, {
    name: "search",
    size: 16,
    color: "var(--text-3)"
  }), isPrices ? React.createElement("input", {
    value: priceQ,
    onChange: e => setPriceQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D / \u0E23\u0E2B\u0E31\u0E2A..."
  }) : React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C / \u0E23\u0E2B\u0E31\u0E2A / \u0E17\u0E35\u0E48\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A..."
  })), isPrices ? React.createElement("button", {
    className: "btn-add",
    onClick: () => setAddPriceOpen(true)
  }, React.createElement(Icon, {
    name: "plus",
    size: 17,
    color: "#fff",
    sw: 2.4
  }), React.createElement("span", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E27\u0E31\u0E2A\u0E14\u0E38")) : React.createElement(React.Fragment, null, !isMobile && React.createElement("button", {
    className: "btn-add",
    onClick: () => setView(v => v === "grid" ? "table" : "grid"),
    title: view === "grid" ? "สลับเป็นมุมมองตาราง" : "สลับเป็นมุมมองการ์ด (มีรูป)",
    style: {
      background: "var(--surface2)",
      color: "var(--text-2)",
      border: "1px solid var(--border-strong)"
    }
  }, React.createElement(Icon, {
    name: view === "grid" ? "menu" : "grid",
    size: 16,
    color: "var(--text-2)"
  }), React.createElement("span", null, view === "grid" ? "ตาราง" : "การ์ด")), React.createElement("button", {
    className: "btn-add",
    onClick: () => setFillOpen(true),
    style: {
      background: "var(--surface2)",
      color: "var(--text-2)",
      border: "1px solid var(--border-strong)"
    }
  }, React.createElement(Icon, {
    name: "sparkle",
    size: 16,
    color: "var(--text-2)"
  }), React.createElement("span", null, "\u0E40\u0E15\u0E34\u0E21\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D/\u0E23\u0E38\u0E48\u0E19")), React.createElement("button", {
    className: "btn-add",
    onClick: () => setItemForm({
      item: stock.blankItem(),
      isNew: true
    })
  }, React.createElement(Icon, {
    name: "plus",
    size: 17,
    color: "#fff",
    sw: 2.4
  }), React.createElement("span", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))))), React.createElement("div", {
    className: "header-filters"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, canManagePrices && React.createElement(React.Fragment, null, React.createElement(CatChip, {
    active: tab === "stock",
    onClick: () => setTab("stock"),
    label: "\u0E2A\u0E15\u0E47\u0E2D\u0E01",
    color: "#3B82F6"
  }), React.createElement(CatChip, {
    active: tab === "prices",
    onClick: () => setTab("prices"),
    label: "\u0E23\u0E32\u0E04\u0E32 BOQ",
    color: "#EC4899"
  }), React.createElement(CatChip, {
    active: tab === "amp",
    onClick: () => setTab("amp"),
    label: "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22 \u0E27\u0E2A\u0E17.",
    color: "#F59E0B"
  })), !isMobile && !isAmp && React.createElement("button", {
    onClick: toggleCat,
    title: catOpen ? "ซ่อนตัวกรองหมวด" : "แสดงตัวกรองหมวด",
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 13px",
      borderRadius: 99,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "filter",
    size: 14,
    color: "var(--text-2)"
  }), "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48", isPrices ? priceGrp !== "all" ? ": " + (PG_TH[priceGrp] || priceGrp) : "" : cat !== "all" ? ": " + ((SF.STOCK_CAT_BY[cat] || {}).th || "") : "", React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-3)",
    style: {
      transform: catOpen ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  }))), isMobile && !isPrices && !isAmp && React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, React.createElement(CatDropdown, {
    cat: cat,
    setCat: setCat,
    items: items,
    cats: SF.STOCK_CATS
  })), isMobile && isPrices && React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, React.createElement(Dropdown, {
    value: priceGrp,
    onChange: setPriceGrp,
    options: priceGroups.map(g => ({
      value: g,
      label: g === "all" ? "ทั้งหมด" : PG_TH[g] || g
    }))
  })), !isMobile && !isAmp && React.createElement("div", {
    style: {
      overflow: "hidden",
      maxHeight: catOpen ? !isPrices && subChips.length ? 92 : 48 : 0,
      opacity: catOpen ? 1 : 0,
      marginTop: catOpen ? 8 : 0,
      transition: "max-height .24s ease, opacity .2s ease, margin-top .24s ease"
    }
  }, React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "nowrap",
      alignItems: "center",
      overflowX: "auto",
      paddingBottom: 4
    }
  }, isPrices ? React.createElement(React.Fragment, null, React.createElement(CatChip, {
    active: priceGrp === "all",
    onClick: () => setPriceGrp("all"),
    label: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    color: "var(--text-2)"
  }), priceGroups.filter(g => g !== "all").map(g => React.createElement(CatChip, {
    key: g,
    active: priceGrp === g,
    onClick: () => setPriceGrp(g),
    label: PG_TH[g] || g,
    color: PG_COLOR[g] || "var(--text-2)"
  }))) : React.createElement(React.Fragment, null, React.createElement(CatChip, {
    active: cat === "all",
    onClick: () => {
      setCat("all");
      setBrowse(true);
    },
    label: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
    color: "var(--text-2)",
    count: items.length
  }), SF.STOCK_CATS.filter(c => cat === c.key || catCount[c.key]).map(c => React.createElement(CatChip, {
    key: c.key,
    active: cat === c.key,
    onClick: () => setCat(c.key),
    label: c.th,
    color: c.color,
    count: catCount[c.key] || 0
  })))), !isPrices && subChips.length > 0 && React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "nowrap",
      alignItems: "center",
      overflowX: "auto",
      marginTop: 6,
      paddingLeft: 2,
      paddingBottom: 2
    }
  }, React.createElement(CatChip, {
    active: sub === "all",
    onClick: () => {
      setSub("all");
      setBrowse(false);
    },
    label: "ทุกหมวดย่อย",
    color: "var(--text-2)",
    count: catCount[cat] || 0
  }), subChips.map(c => React.createElement(CatChip, {
    key: c.key,
    active: sub === c.key,
    onClick: () => setSub(c.key),
    label: c.th,
    color: c.color,
    count: subCount[c.key] || 0
  })))))), isAmp ? React.createElement("div", {
    className: "app-content"
  }, React.createElement(AmpacityEditor, {
    ampStore: ampStore
  })) : isPrices ? React.createElement("div", {
    className: "app-content"
  }, React.createElement(PricePanel, {
    priceStore: priceStore,
    stock: stock,
    q: priceQ,
    grp: priceGrp
  })) : React.createElement("div", {
    className: "app-content"
  }, !isMobile && React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, React.createElement(StatRail, {
    items: [{
      label: "รายการทั้งหมด",
      value: items.length,
      unit: "ชนิด",
      accent: "#3B82F6",
      sub: "ชนิดอุปกรณ์ในคลัง",
      active: kpiFilter === null,
      onClick: () => setKpiFilter(null)
    }, {
      label: "ใกล้หมด / ต่ำกว่าขั้นต่ำ",
      value: lowCount,
      unit: "รายการ",
      accent: "#F59E0B",
      alert: lowCount > 0,
      sub: "ควรสั่งเพิ่ม",
      active: kpiFilter === "low",
      onClick: () => setKpiFilter(f => f === "low" ? null : "low")
    }, {
      label: "ความเคลื่อนไหวล่าสุด",
      value: stock.moves.length,
      unit: "รายการ",
      accent: "var(--primary)",
      sub: "แตะดูทั้งหมด",
      active: movesOpen,
      onClick: () => setMovesOpen(true)
    }]
  })), brandList.length > 0 && !showCatHome && React.createElement("div", {
    style: {
      marginBottom: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, isMobile ? React.createElement(Dropdown, {
    value: brand,
    onChange: setBrand,
    options: [{
      value: "all",
      label: "ทุกยี่ห้อ"
    }].concat(brandList.map(b => ({
      value: b,
      label: b + " (" + brandCount[b] + ")"
    })))
  }) : React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "nowrap",
      alignItems: "center",
      overflowX: "auto",
      paddingBottom: 2
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      paddingRight: 2
    }
  }, "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D"), React.createElement(CatChip, {
    active: brand === "all",
    onClick: () => setBrand("all"),
    label: "\u0E17\u0E38\u0E01\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D",
    color: "var(--text-2)"
  }), brandList.map(b => React.createElement(CatChip, {
    key: b,
    active: brand === b,
    onClick: () => setBrand(b),
    label: b,
    color: "#0EA5E9",
    count: brandCount[b]
  })))), React.createElement("div", null, !isPrices && !isAmp && !showCatHome && !showSubHome && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    onClick: goBack,
    title: "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-3)",
    style: {
      transform: "rotate(90deg)"
    }
  }), "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, React.createElement("span", {
    onClick: () => {
      setCat("all");
      setSub("all");
      setBrowse(true);
    },
    style: {
      cursor: "pointer",
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E04\u0E25\u0E31\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), cat !== "all" && React.createElement("span", null, " \u203A ", React.createElement("span", {
    style: {
      fontWeight: 700,
      color: sub === "all" ? "var(--text-1)" : "var(--text-2)",
      cursor: "pointer"
    },
    onClick: () => {
      setSub("all");
      setBrowse(true);
    }
  }, (SF.STOCK_CAT_BY[cat] || {}).th || "")), sub !== "all" && React.createElement("span", null, " \u203A ", React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, (SF.STOCK_CAT_BY[sub] || {}).th || "")), React.createElement("span", null, " \xB7 ", filtered.length.toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))), showCatHome ? React.createElement(CatBrowser, {
    list: SF.STOCK_CATS.filter(c => catCount[c.key]),
    count: catCount,
    low: catLow,
    imgs: imgs,
    title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23",
    hint: SF.STOCK_CATS.filter(c => catCount[c.key]).length + " หมวด · " + items.length.toLocaleString() + " รายการ",
    onPick: k => setCat(k),
    onAll: () => setBrowse(false),
    onSetImage: (k, d) => stock.setImage("cat_" + k, d)
  }) : showSubHome ? React.createElement(React.Fragment, null, React.createElement(CatBrowser, {
    list: subChips,
    count: subCount,
    low: subLow,
    imgs: imgs,
    title: (SF.STOCK_CAT_BY[cat] || {}).th || "",
    hint: subChips.length + " หมวดย่อย · " + (catCount[cat] || 0).toLocaleString() + " รายการ",
    allLabel: "\u0E14\u0E39\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E19\u0E35\u0E49",
    onPick: k => setSub(k),
    onAll: () => setBrowse(false),
    onBack: () => setCat("all"),
    onSetImage: (k, d) => stock.setImage("cat_" + k, d)
  }), directItems.length > 0 && React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 9,
      marginBottom: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E19\u0E35\u0E49"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E22\u0E48\u0E2D\u0E22 \xB7 ", directItems.length.toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), isMobile ? React.createElement(StockCardList, {
    rows: rowsOf(directItems),
    imgs: imgs,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }) : React.createElement(StockGrid, {
    rows: rowsOf(directItems),
    imgs: imgs,
    lowState: lowState,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }))) : isMobile ? React.createElement(StockCardList, {
    rows: rowsOf(filtered),
    imgs: imgs,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }) : view === "grid" ? React.createElement(StockGrid, {
    rows: rowsOf(filtered),
    imgs: imgs,
    lowState: lowState,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }) : React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: 640
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      borderBottom: "1px solid var(--border)"
    }
  }, ["รายการอุปกรณ์", "ราคา/หน่วย", "คงเหลือ", "ขั้นต่ำ", "ที่จัดเก็บ", "จัดการ"].map((h, i) => React.createElement("th", {
    key: h,
    style: {
      padding: "12px 12px",
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".04em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      textAlign: i === 1 ? "right" : i >= 2 && i <= 3 ? "center" : "left",
      whiteSpace: "nowrap",
      background: "var(--surface2)"
    }
  }, h)))), React.createElement("tbody", null, filtered.map(it => {
    const c = SF.STOCK_CAT_BY[it.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
    const st = lowState(it);
    return React.createElement("tr", {
      key: it.id,
      onClick: () => setDetailItem(it),
      title: "\u0E01\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 \xB7 \u0E23\u0E31\u0E1A / \u0E40\u0E1A\u0E34\u0E01 / \u0E04\u0E37\u0E19",
      style: {
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: st === "out" ? "rgba(239,68,68,.07)" : "transparent"
      }
    }, React.createElement("td", {
      style: {
        padding: "11px 12px"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11
      }
    }, React.createElement(MatThumb, {
      src: imgs[it.id],
      item: it,
      size: 42
    }), React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 600,
        color: "var(--text-1)"
      }
    }, it.name), (it.brand || "").trim() && React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        marginTop: 2
      }
    }, it.brand), React.createElement("div", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 1
      }
    }, it.sku)))), React.createElement("td", {
      style: {
        padding: "11px 12px",
        textAlign: "right",
        whiteSpace: "nowrap"
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13,
        fontWeight: 700,
        color: +it.price > 0 ? "var(--text-1)" : "var(--text-3)"
      }
    }, +it.price > 0 ? "\u0e3f" + (+it.price).toLocaleString(undefined, {
      maximumFractionDigits: 2
    }) : "\u2013")), React.createElement("td", {
      style: {
        padding: "11px 12px",
        textAlign: "center"
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 18,
        fontWeight: 700,
        color: STOCK_COLORS[st]
      }
    }, it.qty.toLocaleString()), React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        marginLeft: 3
      }
    }, it.unit), st !== "ok" && React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: STOCK_COLORS[st]
      }
    }, st === "out" ? "⚠ หมดสต็อก" : "⚠ ใกล้หมด")), React.createElement("td", {
      style: {
        padding: "11px 12px",
        textAlign: "center",
        fontFamily: "var(--mono)",
        fontSize: 12.5,
        color: "var(--text-2)"
      }
    }, it.min.toLocaleString()), React.createElement("td", {
      style: {
        padding: "11px 12px",
        fontSize: 12.5,
        color: "var(--text-2)",
        whiteSpace: "nowrap"
      }
    }, it.loc), React.createElement("td", {
      style: {
        padding: "11px 12px",
        whiteSpace: "nowrap"
      },
      onClick: e => e.stopPropagation()
    }, React.createElement("button", {
      onClick: () => setItemForm({
        item: it,
        isNew: false
      }),
      title: "\u0E41\u0E01\u0E49\u0E44\u0E02",
      style: {
        background: "#3B82F614",
        border: "none",
        color: "#3B82F6",
        width: 28,
        height: 28,
        borderRadius: 7,
        cursor: "pointer",
        verticalAlign: "middle"
      }
    }, React.createElement(Icon, {
      name: "settings",
      size: 14
    })), React.createElement("button", {
      onClick: () => {
        askConfirm({
          title: "ลบ “" + it.name + "” ออกจากคลัง?"
        }).then(ok => {
          if (ok) stock.removeItem(it.id);
        });
      },
      title: "\u0E25\u0E1A",
      style: {
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        width: 28,
        height: 28,
        borderRadius: 7,
        cursor: "pointer",
        marginLeft: 4,
        verticalAlign: "middle"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 14
    }))));
  }), filtered.length === 0 && React.createElement("tr", null, React.createElement("td", {
    colSpan: 6,
    style: {
      padding: 44,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C")))))))), moveItem && React.createElement(MoveModal, {
    info: moveItem,
    byName: byName,
    jobs: jobs || [],
    onSave: (qty, ref, note, jobId) => {
      stock.move(moveItem.item.id, moveItem.type, qty, ref, note, byName, jobId);
      setMoveItem(null);
    },
    onClose: () => setMoveItem(null)
  }), itemForm && React.createElement(ItemModal, {
    initial: itemForm.item,
    isNew: itemForm.isNew,
    items: stock.items,
    onAddCat: stock.addCat,
    onRemoveCat: stock.removeCat,
    hint: itemForm.sizeOf ? "ก๊อปมาจาก “" + itemForm.sizeOf + "” — แก้เฉพาะตรงขนาด (ตัวอักษรอื่นต้องเหมือนเดิมเป๊ะ) ระบบจะรวมเป็นสินค้าเดียวกันให้เอง" : "",
    img: imgs[itemForm.item.id],
    onImage: d => stock.setImage(itemForm.item.id, d),
    onSave: rec => {
      stock.upsertItem(rec);
      setItemForm(null);
    },
    onClose: () => setItemForm(null)
  }), detailItem && React.createElement(ItemDetailModal, {
    item: (stock.items || []).find(x => x.id === detailItem.id) || detailItem,
    img: imgs[detailItem.id],
    variants: variantsOf(detailItem),
    onPickVariant: setDetailItem,
    loadDoc: stock.loadDoc,
    setDoc: stock.setDoc,
    onMove: type => {
      setMoveItem({
        item: detailItem,
        type: type
      });
      setDetailItem(null);
    },
    onEdit: () => {
      setItemForm({
        item: detailItem,
        isNew: false
      });
      setDetailItem(null);
    },
    onAddSize: () => {
      addSizeFrom(detailItem);
    },
    onClose: () => setDetailItem(null)
  }), fillOpen && React.createElement(FillVariantModal, {
    items: stock.items,
    onApply: list => {
      list.forEach(r => stock.upsertItem(r));
      setFillOpen(false);
    },
    onClose: () => setFillOpen(false)
  }), movesOpen && React.createElement(MovesModal, {
    moves: stock.moves,
    items: items,
    jobs: jobs || [],
    onClose: () => setMovesOpen(false)
  }), addPriceOpen && React.createElement(AddPriceModal, {
    priceStore: priceStore,
    stock: stock,
    onClose: () => setAddPriceOpen(false)
  }));
}
function MovesModal({
  moves,
  items,
  jobs,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [q, setQ] = React.useState("");
  const all = moves || [];
  const list = all.filter(m => {
    if (!q) return true;
    const it = (items || []).find(x => x.id === m.itemId);
    const job = m.jobId && (jobs || []).find(j => j.id === m.jobId);
    const hay = ((it ? it.name : m.itemId) + " " + (m.ref || "") + " " + (m.by || "") + " " + (job ? job.name : "")).toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 110,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(680px,100%)",
      maxHeight: isMobile ? "92dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement(Icon, {
    name: "history",
    size: 17,
    color: "var(--text-2)"
  }), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 15.5,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, "\u0E23\u0E31\u0E1A\u0E40\u0E02\u0E49\u0E32 / \u0E40\u0E1A\u0E34\u0E01\u0E2D\u0E2D\u0E01 / \u0E04\u0E37\u0E19\u0E02\u0E2D\u0E07 \xB7 \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ", all.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    className: "search-box",
    style: {
      marginTop: 12
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C / \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 / \u0E07\u0E32\u0E19 / \u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23..."
  }))), React.createElement("div", {
    style: {
      flex: 1,
      padding: 16,
      paddingBottom: isMobile ? "calc(16px + env(safe-area-inset-bottom,0px))" : 16,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      overflowY: "auto"
    }
  }, list.length === 0 && React.createElement("div", {
    style: {
      padding: 30,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, all.length === 0 ? "ยังไม่มีความเคลื่อนไหว" : "ไม่พบรายการ"), list.map(m => {
    const it = (items || []).find(x => x.id === m.itemId);
    const mt = MOVE_TYPES[m.type] || MOVE_TYPES.out;
    const job = m.jobId && (jobs || []).find(j => j.id === m.jobId);
    return React.createElement("div", {
      key: m.id,
      style: {
        display: "flex",
        gap: 11,
        padding: "10px 11px",
        border: "1px solid var(--border)",
        borderRadius: 11
      }
    }, React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 8,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: mt.bg,
        color: mt.color,
        fontWeight: 800,
        fontSize: 15
      }
    }, mt.sym), React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-1)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, it ? it.name : m.itemId), React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 2
      }
    }, mt.label, " ", React.createElement("strong", {
      style: {
        color: mt.color
      }
    }, m.qty), " \xB7 ", thDate(m.date), " \xB7 ", React.createElement("span", {
      style: {
        fontFamily: "var(--mono)"
      }
    }, m.ref)), job && React.createElement("div", {
      style: {
        fontSize: 11,
        color: mt.color,
        marginTop: 2,
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontWeight: 600
      }
    }, React.createElement(Icon, {
      name: "wrench",
      size: 10,
      color: mt.color
    }), " ", job.name), m.by && m.by !== "-" && React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 2,
        display: "flex",
        alignItems: "center",
        gap: 4
      }
    }, React.createElement(Icon, {
      name: "user",
      size: 10,
      color: "var(--text-3)"
    }), " \u0E42\u0E14\u0E22 ", m.by), m.note && React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 2,
        fontStyle: "italic"
      }
    }, m.note)));
  }))));
}
function CatChip({
  active,
  onClick,
  label,
  color,
  count
}) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return React.createElement("button", {
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: mob ? "5px 11px" : "6px 13px",
      borderRadius: 99,
      border: "1px solid " + (active ? color : "var(--border-strong)"),
      background: active ? color + "16" : "var(--surface)",
      color: active ? color : "var(--text-2)",
      fontSize: mob ? 11.5 : 12.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
      flexShrink: 0
    }
  }, label, count != null && React.createElement("span", {
    style: {
      fontSize: mob ? 10 : 10.5,
      fontWeight: 700,
      lineHeight: 1.5,
      color: active ? color : "var(--text-3)",
      background: active ? color + "22" : "var(--surface3)",
      borderRadius: 99,
      padding: "0 6px",
      minWidth: 17,
      textAlign: "center"
    }
  }, count));
}
function StockCardList({
  rows,
  imgs,
  onOpen,
  onEdit,
  onRemove
}) {
  const SF = window.SF;
  if (!rows || rows.length === 0) {
    return React.createElement("div", {
      style: {
        padding: 40,
        textAlign: "center",
        color: "var(--text-3)",
        fontSize: 14
      }
    }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C");
  }
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, rows.map(r => {
    const it = r.it;
    const g = r.sizes && r.sizes.length > 1 ? groupSummary(r.sizes) : null;
    const c = SF.STOCK_CAT_BY[it.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
    const st = g ? g.st : lowState(it);
    return React.createElement("div", {
      key: it.id,
      style: {
        background: st === "out" ? "rgba(239,68,68,.07)" : "var(--surface)",
        border: "1px solid " + (st === "out" ? "rgba(239,68,68,.22)" : "var(--border)"),
        borderRadius: 14,
        padding: 13,
        borderLeft: "3px solid " + STOCK_COLORS[st],
        boxShadow: "var(--shadow-sm)"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8
      }
    }, React.createElement(MatThumb, {
      src: (imgs || {})[it.id],
      item: it,
      size: 46
    }), React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 700,
        color: "var(--text-1)",
        lineHeight: 1.25
      }
    }, g ? baseLabel(it.name) : it.name), (it.brand || "").trim() && React.createElement("div", {
      style: {
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-2)",
        marginTop: 2
      }
    }, it.brand), React.createElement("div", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 2
      }
    }, g ? g.sizes.join(" · ") : it.sku || "—")), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color: c.color,
        background: c.color + "16",
        padding: "3px 9px",
        borderRadius: 99,
        whiteSpace: "nowrap",
        flexShrink: 0
      }
    }, React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: c.color
      }
    }), c.th)), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        marginTop: 10,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "baseline",
        gap: 4
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 22,
        fontWeight: 700,
        color: STOCK_COLORS[st],
        lineHeight: 1
      }
    }, (g ? g.qty : it.qty).toLocaleString()), React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, it.unit), st !== "ok" && React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: STOCK_COLORS[st],
        marginLeft: 2
      }
    }, st === "out" ? "⚠ หมด" : "⚠ ใกล้หมด")), g ? React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, g.n, " \u0E02\u0E19\u0E32\u0E14") : React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 ", React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        color: "var(--text-2)"
      }
    }, it.min.toLocaleString())), !g && it.loc && React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: "pin",
      size: 11,
      style: {
        verticalAlign: -1
      }
    }), " ", it.loc)), React.createElement("div", {
      style: {
        marginTop: 12,
        paddingTop: 11,
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 7
      }
    }, React.createElement("button", {
      onClick: () => onOpen(it),
      style: {
        flex: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        background: "var(--primary-soft)",
        border: "none",
        color: "var(--primary-dark)",
        fontWeight: 700,
        fontSize: 12.5,
        padding: "9px 6px",
        borderRadius: 9,
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, g ? "เลือกขนาด · " + g.n + " ขนาด" : "ดูรายละเอียด · รับ/เบิก/คืน"), !g && React.createElement("button", {
      onClick: () => onEdit(it),
      title: "\u0E41\u0E01\u0E49\u0E44\u0E02",
      "aria-label": "\u0E41\u0E01\u0E49\u0E44\u0E02",
      style: {
        flexShrink: 0,
        background: "#3B82F614",
        border: "none",
        color: "#3B82F6",
        width: 44,
        height: 36,
        borderRadius: 9,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "settings",
      size: 16
    })), !g && React.createElement("button", {
      onClick: () => {
        askConfirm({
          title: "ลบ “" + it.name + "” ออกจากคลัง?"
        }).then(ok => {
          if (ok) onRemove(it.id);
        });
      },
      title: "\u0E25\u0E1A",
      "aria-label": "\u0E25\u0E1A",
      style: {
        flexShrink: 0,
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        width: 44,
        height: 36,
        borderRadius: 9,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 16
    }))));
  }));
}
function CatDropdown({
  cat,
  setCat,
  items,
  cats
}) {
  const [open, setOpen] = React.useState(false);
  const all = {
    key: "all",
    th: "ทุกหมวดหมู่",
    color: "var(--text-3)"
  };
  const list = [all].concat(cats);
  const cur = list.find(c => c.key === cat) || all;
  const countOf = k => k === "all" ? items.length : items.filter(it => it.cat === k).length;
  return React.createElement("div", {
    style: {
      position: "relative",
      width: "100%"
    }
  }, React.createElement("button", {
    onClick: () => setOpen(v => !v),
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 9,
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--text-1)",
      background: "var(--surface)",
      border: "1px solid " + (open ? "var(--primary)" : "var(--border-strong)"),
      borderRadius: 10,
      padding: "10px 13px",
      outline: "none",
      cursor: "pointer"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 99,
      background: cur.color,
      flexShrink: 0
    }
  }), React.createElement("span", null, cur.th), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      background: "var(--surface3)",
      padding: "1px 7px",
      borderRadius: 99
    }
  }, countOf(cur.key)), React.createElement(Icon, {
    name: "chevronDown",
    size: 16,
    color: "var(--text-3)",
    style: {
      marginLeft: "auto",
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  })), open && React.createElement(React.Fragment, null, React.createElement("div", {
    onClick: () => setOpen(false),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 60
    }
  }), React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      right: 0,
      zIndex: 61,
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      boxShadow: "0 14px 40px rgba(8,20,14,.2)",
      maxHeight: "58dvh",
      overflowY: "auto",
      padding: 6
    }
  }, list.map(c => {
    const active = c.key === cat;
    return React.createElement("button", {
      key: c.key,
      onClick: () => {
        setCat(c.key);
        setOpen(false);
      },
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "11px 11px",
        borderRadius: 9,
        border: "none",
        background: active ? "var(--primary-soft)" : "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 99,
        background: c.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: active ? 700 : 500,
        color: active ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, c.th), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 11.5,
        fontWeight: 700,
        color: active ? "var(--primary-dark)" : "var(--text-3)",
        background: active ? "var(--surface)" : "var(--surface3)",
        padding: "1px 7px",
        borderRadius: 99
      }
    }, countOf(c.key)), active && React.createElement(Icon, {
      name: "check",
      size: 15,
      color: "var(--primary)",
      sw: 2.6
    }));
  }))));
}
function MoveModal({
  info,
  onSave,
  onClose,
  byName,
  jobs,
  lockedJob,
  maxQty
}) {
  const mt = MOVE_TYPES[info.type] || MOVE_TYPES.out;
  const isIn = info.type === "in";
  const linkJob = !isIn;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [qty, setQty] = React.useState("");
  const [ref, setRef] = React.useState("");
  const [note, setNote] = React.useState("");
  const [jobId, setJobId] = React.useState(lockedJob ? lockedJob.id : "");
  const accent = mt.accent;
  const jobOpts = React.useMemo(() => {
    const list = (jobs || []).slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0,
        bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return (b.deadline || "").localeCompare(a.deadline || "");
    });
    return [{
      value: "",
      label: "— ไม่ระบุงาน —"
    }].concat(list.map(j => ({
      value: j.id,
      label: j.code + " · " + j.name + (j.stage === "done" ? " (เสร็จแล้ว)" : "")
    })));
  }, [jobs]);
  const submit = () => {
    if (!(parseInt(qty) > 0)) {
      alert("กรุณากรอกจำนวน");
      return;
    }
    if (maxQty != null && parseInt(qty) > maxQty) {
      alert("คืนได้ไม่เกิน " + maxQty + " " + info.item.unit);
      return;
    }
    const job = linkJob && (lockedJob || (jobs || []).find(j => j.id === jobId));
    const finalRef = linkJob ? job ? job.code : ref || "-" : ref || "-";
    onSave(qty, finalRef, note, linkJob ? jobId : "");
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.4)",
      backdropFilter: "blur(3px)",
      zIndex: 100,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(440px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 22px",
      background: accent,
      color: "#fff",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      opacity: .9
    }
  }, mt.title), React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      marginTop: 2
    }
  }, info.item.name), React.createElement("div", {
    style: {
      fontSize: 12.5,
      opacity: .85,
      marginTop: 3
    }
  }, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19 ", info.item.qty.toLocaleString(), " ", info.item.unit)), React.createElement("div", {
    style: {
      padding: 22,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflowY: "auto"
    }
  }, React.createElement(Field, {
    label: "จำนวน (" + info.item.unit + ")" + (maxQty != null ? " · คืนได้ไม่เกิน " + maxQty : ""),
    required: true
  }, React.createElement("input", {
    type: "number",
    autoFocus: true,
    max: maxQty != null ? maxQty : undefined,
    value: qty,
    onChange: e => setQty(e.target.value),
    style: inputStyle,
    placeholder: "0"
  })), linkJob ? React.createElement(Field, {
    label: info.type === "return" ? "งานที่คืนของ" : "งานที่นำไปใช้"
  }, lockedJob ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 13.5,
      color: "var(--text-1)"
    }
  }, React.createElement(Icon, {
    name: "wrench",
    size: 14,
    color: accent
  }), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: accent
    }
  }, lockedJob.code), React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, lockedJob.name)) : React.createElement(Dropdown, {
    value: jobId,
    onChange: setJobId,
    options: jobOpts,
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E07\u0E32\u0E19 \u2014"
  })) : React.createElement(Field, {
    label: "\u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07 (\u0E40\u0E25\u0E02 PO / \u0E1C\u0E39\u0E49\u0E02\u0E32\u0E22)"
  }, React.createElement("input", {
    value: ref,
    onChange: e => setRef(e.target.value),
    style: inputStyle,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 PO-2406"
  })), React.createElement(Field, {
    label: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"
  }, React.createElement("input", {
    value: note,
    onChange: e => setNote(e.target.value),
    style: inputStyle
  })), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 10,
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "user",
    size: 14,
    color: "var(--text-3)"
  }), "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23: ", React.createElement("strong", {
    style: {
      color: "var(--text-1)"
    }
  }, byName || "-"))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      flex: isMobile ? "0 0 auto" : "none",
      padding: "11px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: submit,
    style: {
      flex: isMobile ? 1 : "none",
      padding: "11px 22px",
      borderRadius: 11,
      border: "none",
      background: accent,
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, mt.sym, " ", mt.label))));
}
function ItemModal({
  initial,
  isNew,
  items,
  onSave,
  onClose,
  onAddCat,
  onRemoveCat,
  img,
  onImage,
  hint
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const suggestCode = SF.genMatCode(f.cat, items || []);
  const mainCat = SF.mainCatOf(f.cat);
  const subCat = mainCat === f.cat ? "" : f.cat;
  const subList = SF.STOCK_SUB_BY_CAT[mainCat] || [];
  const isCustomCat = !!(SF.STOCK_CAT_BY[f.cat] || {}).custom;
  const [adding, setAdding] = React.useState(null);
  const [newCat, setNewCat] = React.useState("");
  const commitCat = () => {
    const th = newCat.trim();
    if (!th) {
      setAdding(null);
      return;
    }
    const k = onAddCat && onAddCat(th, adding === "sub" ? mainCat : "");
    if (k) set("cat", k);
    setAdding(null);
    setNewCat("");
  };
  const submitItem = () => {
    if (!f.name.trim()) {
      alert("กรุณากรอกชื่ออุปกรณ์");
      return;
    }
    const rec = Object.assign({}, f);
    if (!String(rec.sku || "").trim()) rec.sku = suggestCode;
    onSave(rec);
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.4)",
      backdropFilter: "blur(3px)",
      zIndex: 100,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(560px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, isNew ? "เพิ่มรายการอุปกรณ์" : "แก้ไขรายการ"), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    style: {
      padding: 22,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 14,
      overflowY: "auto"
    }
  }, onImage && React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(Field, {
    label: "\u0E23\u0E39\u0E1B\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"
  }, React.createElement(MatImagePicker, {
    src: img,
    item: f,
    onPick: d => onImage(d),
    onClear: () => onImage("")
  }))), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C",
    required: true
  }, React.createElement("input", {
    style: inputStyle,
    value: f.name,
    onChange: e => set("name", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E41\u0E1C\u0E07\u0E42\u0E0B\u0E25\u0E48\u0E32 Longi 550W"
  })), hint && React.createElement("div", {
    style: {
      marginTop: 5,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, hint)), React.createElement(Field, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E38 (mat code)"
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, React.createElement("input", {
    style: Object.assign({}, inputStyle, {
      flex: 1
    }),
    value: f.sku,
    onChange: e => set("sku", e.target.value),
    placeholder: suggestCode + " (อัตโนมัติ)"
  }), React.createElement("button", {
    type: "button",
    onClick: () => set("sku", suggestCode),
    title: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E15\u0E32\u0E21\u0E2B\u0E21\u0E27\u0E14",
    style: {
      flexShrink: 0,
      padding: "0 12px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, "auto"))), React.createElement(Field, {
    label: "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E25\u0E31\u0E01"
  }, React.createElement("select", {
    style: inputStyle,
    value: mainCat,
    onChange: e => {
      if (e.target.value === "__new") {
        setAdding("main");
        return;
      }
      set("cat", e.target.value);
    }
  }, SF.STOCK_CATS.map(c => React.createElement("option", {
    key: c.key,
    value: c.key
  }, c.th)), onAddCat && React.createElement("option", {
    value: "__new"
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E25\u0E31\u0E01\u0E43\u0E2B\u0E21\u0E48\u2026"))), React.createElement(Field, {
    label: "\u0E2B\u0E21\u0E27\u0E14\u0E22\u0E48\u0E2D\u0E22"
  }, React.createElement("select", {
    style: inputStyle,
    value: subCat,
    onChange: e => {
      if (e.target.value === "__new") {
        setAdding("sub");
        return;
      }
      set("cat", e.target.value || mainCat);
    }
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), subList.map(c => React.createElement("option", {
    key: c.key,
    value: c.key
  }, c.th)), onAddCat && React.createElement("option", {
    value: "__new"
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E21\u0E27\u0E14\u0E22\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E21\u0E48\u2026"))), adding && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: -4,
      display: "flex",
      gap: 7,
      alignItems: "center"
    }
  }, React.createElement("input", {
    autoFocus: true,
    style: Object.assign({}, inputStyle, {
      flex: 1
    }),
    value: newCat,
    onChange: e => setNewCat(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitCat();
      }
      if (e.key === "Escape") {
        setAdding(null);
        setNewCat("");
      }
    },
    placeholder: adding === "main" ? "ชื่อหมวดหลักใหม่" : 'ชื่อหมวดย่อยใหม่ (อยู่ใต้ "' + ((SF.STOCK_CAT_BY[mainCat] || {}).th || "") + '")'
  }), React.createElement("button", {
    type: "button",
    onClick: commitCat,
    style: {
      flexShrink: 0,
      padding: "0 14px",
      height: 38,
      borderRadius: 10,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21"), React.createElement("button", {
    type: "button",
    onClick: () => {
      setAdding(null);
      setNewCat("");
    },
    style: {
      flexShrink: 0,
      padding: "0 12px",
      height: 38,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), isCustomCat && onRemoveCat && !adding && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: -6
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => {
      const c = SF.STOCK_CAT_BY[f.cat];
      askConfirm({
        title: "ลบหมวด “" + c.th + "” ?",
        ok: "ลบหมวด",
        body: (c.parent ? "" : "หมวดย่อยใต้หมวดนี้จะถูกลบด้วย\n") + "ของที่อยู่ในหมวดนี้จะไปแสดงเป็น “อื่นๆ”"
      }).then(ok => {
        if (!ok) return;
        onRemoveCat(f.cat);
        set("cat", c.parent || "other");
      });
    },
    style: {
      border: 0,
      background: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      color: "#EF4444",
      textDecoration: "underline",
      textUnderlineOffset: 3
    }
  }, "\u0E25\u0E1A\u0E2B\u0E21\u0E27\u0E14 \u201C", (SF.STOCK_CAT_BY[f.cat] || {}).th, "\u201D \u0E17\u0E35\u0E48\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E2D\u0E07")), React.createElement(Field, {
    label: "\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D (Brand)"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.brand || "",
    onChange: e => set("brand", e.target.value),
    placeholder: "THAI PP-R / SANWA"
  })), React.createElement(Field, {
    label: "\u0E23\u0E38\u0E48\u0E19 (Model)"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.model || "",
    onChange: e => set("model", e.target.value),
    placeholder: "D25 / CKT 20"
  })), React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.qty,
    onChange: e => set("qty", parseInt(e.target.value) || 0)
  })), React.createElement(Field, {
    label: "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E19\u0E31\u0E1A"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.unit,
    onChange: e => set("unit", e.target.value),
    placeholder: "\u0E41\u0E1C\u0E07 / \u0E15\u0E31\u0E27 / \u0E21\u0E49\u0E27\u0E19"
  })), React.createElement(Field, {
    label: "\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 (\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.min,
    onChange: e => set("min", parseInt(e.target.value) || 0)
  })), React.createElement(Field, {
    label: "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22 (\u0E1A\u0E32\u0E17)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.price != null ? f.price : 0,
    onChange: e => set("price", parseFloat(e.target.value) || 0),
    placeholder: "0"
  })), React.createElement(Field, {
    label: "\u0E17\u0E35\u0E48\u0E08\u0E31\u0E14\u0E40\u0E01\u0E47\u0E1A"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.loc,
    onChange: e => set("loc", e.target.value),
    placeholder: "\u0E04\u0E25\u0E31\u0E07 A-01"
  })), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(Field, {
    label: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32"
  }, React.createElement("textarea", {
    rows: 3,
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.6
    }),
    value: f.desc || "",
    onChange: e => set("desc", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E17\u0E48\u0E2D PP-R \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E23\u0E49\u0E2D\u0E19 \u0E17\u0E19\u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19 PN20 \u0E23\u0E31\u0E1A\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34\u0E44\u0E14\u0E49\u0E16\u0E36\u0E07 95\xB0C"
  }))), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(Field, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E14\u0E34\u0E21 / \u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E49\u0E2D\u0E07 \u0E17\u0E35\u0E48\u0E43\u0E1A\u0E16\u0E2D\u0E14\u0E02\u0E2D\u0E07\u0E22\u0E31\u0E07\u0E40\u0E23\u0E35\u0E22\u0E01\u0E2D\u0E22\u0E39\u0E48"
  }, React.createElement("textarea", {
    rows: Math.max(2, (f.aka || []).length),
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.5
    }),
    value: (f.aka || []).join("\n"),
    onChange: e => set("aka", e.target.value.split("\n").map(x => x.trim()).filter(Boolean)),
    placeholder: "\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E25\u0E30\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E0A\u0E37\u0E48\u0E2D \u2014 \u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E15\u0E34\u0E21\u0E43\u0E2B\u0E49\u0E40\u0E2D\u0E07\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D"
  }))), mainCat === "panel" && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 10
    }
  }, React.createElement(Icon, {
    name: "panel",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E2A\u0E40\u0E1B\u0E04\u0E41\u0E1C\u0E07 (\u0E43\u0E0A\u0E49\u0E0A\u0E48\u0E27\u0E22\u0E16\u0E2D\u0E14 BOQ)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E44\u0E1F (Wp)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.wp != null ? f.wp : "",
    onChange: e => set("wp", parseFloat(e.target.value) || 0),
    placeholder: "650"
  })), React.createElement(Field, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E40\u0E1F\u0E23\u0E21 (mm)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.frame != null ? f.frame : "",
    onChange: e => set("frame", parseFloat(e.target.value) || 0),
    placeholder: "30 / 35"
  })), React.createElement(Field, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07 (\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.width != null ? f.width : "",
    onChange: e => set("width", parseFloat(e.target.value) || 0),
    placeholder: "1.134"
  })), React.createElement(Field, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27 (\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.length != null ? f.length : "",
    onChange: e => set("length", parseFloat(e.target.value) || 0),
    placeholder: "2.382"
  }))), React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px dashed var(--border-strong)",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "Voc (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.voc != null ? f.voc : "",
    onChange: e => set("voc", parseFloat(e.target.value) || 0),
    placeholder: "53.90"
  })), React.createElement(Field, {
    label: "Isc (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.isc != null ? f.isc : "",
    onChange: e => set("isc", parseFloat(e.target.value) || 0),
    placeholder: "15.29"
  })), React.createElement(Field, {
    label: "Vmp (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.vmp != null ? f.vmp : "",
    onChange: e => set("vmp", parseFloat(e.target.value) || 0),
    placeholder: "44.80"
  })), React.createElement(Field, {
    label: "Imp (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.imp != null ? f.imp : "",
    onChange: e => set("imp", parseFloat(e.target.value) || 0),
    placeholder: "14.52"
  }))), React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px dashed var(--border-strong)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 8
    }
  }, "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 & \u0E01\u0E32\u0E23\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21 (\u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E41\u0E25\u0E30\u0E40\u0E2A\u0E49\u0E19 I-V)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Voc (%/\xB0C)"
  }, React.createElement("input", {
    type: "number",
    step: "0.001",
    style: inputStyle,
    value: f.tcVoc != null ? f.tcVoc : "",
    onChange: e => set("tcVoc", parseFloat(e.target.value) || 0),
    placeholder: "-0.25"
  })), React.createElement(Field, {
    label: "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Isc (%/\xB0C)"
  }, React.createElement("input", {
    type: "number",
    step: "0.001",
    style: inputStyle,
    value: f.tcIsc != null ? f.tcIsc : "",
    onChange: e => set("tcIsc", parseFloat(e.target.value) || 0),
    placeholder: "0.045"
  })), React.createElement(Field, {
    label: "\u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Pmax (%/\xB0C)"
  }, React.createElement("input", {
    type: "number",
    step: "0.001",
    style: inputStyle,
    value: f.tcPmax != null ? f.tcPmax : "",
    onChange: e => set("tcPmax", parseFloat(e.target.value) || 0),
    placeholder: "-0.29"
  })), React.createElement(Field, {
    label: "NOCT / NMOT (\xB0C)"
  }, React.createElement("input", {
    type: "number",
    step: "0.1",
    style: inputStyle,
    value: f.noct != null ? f.noct : "",
    onChange: e => set("noct", parseFloat(e.target.value) || 0),
    placeholder: "44"
  })), React.createElement(Field, {
    label: "\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E1B\u0E35\u0E41\u0E23\u0E01 (%)"
  }, React.createElement("input", {
    type: "number",
    step: "0.1",
    style: inputStyle,
    value: f.deg1 != null ? f.deg1 : "",
    onChange: e => set("deg1", parseFloat(e.target.value) || 0),
    placeholder: "1"
  })), React.createElement(Field, {
    label: "\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E1B\u0E35\u0E16\u0E31\u0E14\u0E44\u0E1B (%/\u0E1B\u0E35)"
  }, React.createElement("input", {
    type: "number",
    step: "0.01",
    style: inputStyle,
    value: f.degY != null ? f.degY : "",
    onChange: e => set("degY", parseFloat(e.target.value) || 0),
    placeholder: "0.4"
  })), React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.cells != null ? f.cells : "",
    onChange: e => set("cells", parseInt(e.target.value) || 0),
    placeholder: "72 / 144"
  })), React.createElement(Field, {
    label: "\u0E1F\u0E34\u0E27\u0E2A\u0E4C\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07 (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.fuseA != null ? f.fuseA : "",
    onChange: e => set("fuseA", parseFloat(e.target.value) || 0),
    placeholder: "25 / 30"
  })), React.createElement(Field, {
    label: "\u0E0A\u0E19\u0E34\u0E14\u0E40\u0E0B\u0E25\u0E25\u0E4C"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.halfCut === true ? "1" : f.halfCut === false ? "0" : "",
    onChange: e => set("halfCut", e.target.value === "" ? null : e.target.value === "1")
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E14\u0E32\u0E08\u0E32\u0E01\u0E23\u0E38\u0E48\u0E19 \u2014"), React.createElement("option", {
    value: "1"
  }, "\u0E04\u0E23\u0E36\u0E48\u0E07\u0E40\u0E0B\u0E25\u0E25\u0E4C (half-cut)"), React.createElement("option", {
    value: "0"
  }, "\u0E40\u0E0B\u0E25\u0E25\u0E4C\u0E40\u0E15\u0E47\u0E21"))))), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.55
    }
  }, "\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E40\u0E1F\u0E23\u0E21 \u2192 \u0E40\u0E25\u0E37\u0E2D\u0E01 MID/END CLAMP KIT (30/35mm) \xB7 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07/\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27 \u2192 \u0E04\u0E33\u0E19\u0E27\u0E13\u0E23\u0E32\u0E07 + \u0E02\u0E19\u0E32\u0E14\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34 \xB7 Wp \u2192 \u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 (kW) \xB7 Voc/Isc/Vmp/Imp \u2192 \u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 String + \u0E2A\u0E32\u0E22 DC \xB7 \u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Voc \u2192 Voc \u0E15\u0E2D\u0E19\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E22\u0E47\u0E19 (\u0E15\u0E31\u0E27\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07) \xB7 Pmax + NOCT \u2192 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E15\u0E2D\u0E19\u0E41\u0E1C\u0E07\u0E23\u0E49\u0E2D\u0E19 \xB7 \u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E1B\u0E35\u0E41\u0E23\u0E01/\u0E1B\u0E35\u0E16\u0E31\u0E14\u0E44\u0E1B \u2192 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E15\u0E25\u0E2D\u0E14\u0E2D\u0E32\u0E22\u0E38\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19 \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E0B\u0E25\u0E25\u0E4C + \u0E0A\u0E19\u0E34\u0E14\u0E40\u0E0B\u0E25\u0E25\u0E4C \u2192 \u0E40\u0E2A\u0E49\u0E19 I-V \u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E04\u0E34\u0E14\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E14\u0E42\u0E2D\u0E14\u0E1A\u0E32\u0E22\u0E1E\u0E32\u0E2A \xB7 \u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E01\u0E25\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E2D\u0E38\u0E15\u0E2A\u0E32\u0E2B\u0E01\u0E23\u0E23\u0E21")), mainCat === "inverter" && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 10
    }
  }, React.createElement(Icon, {
    name: "bolt",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E2A\u0E40\u0E1B\u0E04\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C (\u0E43\u0E0A\u0E49\u0E0A\u0E48\u0E27\u0E22\u0E16\u0E2D\u0E14 BOQ)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.invType || "",
    onChange: e => set("invType", e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 (\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C) \u2014"), React.createElement("option", {
    value: "micro"
  }, "\u0E44\u0E21\u0E42\u0E04\u0E23 (Micro)"), React.createElement("option", {
    value: "string"
  }, "String inverter"), React.createElement("option", {
    value: "hybrid"
  }, "Hybrid (string + \u0E41\u0E1A\u0E15)"))), React.createElement(Field, {
    label: "kW \u0E15\u0E48\u0E2D\u0E15\u0E31\u0E27"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invKw != null ? f.invKw : "",
    onChange: e => set("invKw", parseFloat(e.target.value) || 0),
    placeholder: "5 / 10"
  })), React.createElement(Field, {
    label: "\u0E40\u0E1F\u0E2A"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.invPhase != null ? f.invPhase : "",
    onChange: e => set("invPhase", e.target.value === "" ? "" : parseInt(e.target.value) || 0)
  }, React.createElement("option", {
    value: ""
  }, "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38"), React.createElement("option", {
    value: "1"
  }, "1 \u0E40\u0E1F\u0E2A"), React.createElement("option", {
    value: "3"
  }, "3 \u0E40\u0E1F\u0E2A"))), React.createElement(Field, {
    label: "MAX PV (kW)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invMaxPv != null ? f.invMaxPv : "",
    onChange: e => set("invMaxPv", parseFloat(e.target.value) || 0),
    placeholder: "7.5 / 15"
  })), React.createElement(Field, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E48\u0E2D\u0E07 MPPT"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invInputs != null ? f.invInputs : "",
    onChange: e => set("invInputs", parseInt(e.target.value) || 0),
    placeholder: "1 / 2 / 3"
  })), React.createElement(Field, {
    label: "\u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15\u0E15\u0E48\u0E2D 1 \u0E0A\u0E48\u0E2D\u0E07 MPPT"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invStrPerMppt != null ? f.invStrPerMppt : "",
    onChange: e => set("invStrPerMppt", parseInt(e.target.value) || 0),
    placeholder: "2"
  })), React.createElement(Field, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01 (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invOutA != null ? f.invOutA : "",
    onChange: e => set("invOutA", parseFloat(e.target.value) || 0),
    placeholder: "25 / 16.9"
  }))), (f.invType === "string" || f.invType === "hybrid") && React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px dashed var(--border-strong)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 8
    }
  }, "\u0E0A\u0E48\u0E27\u0E07\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 DC / MPPT (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E33\u0E19\u0E27\u0E13 String)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "MPPT \u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.mpptVmin != null ? f.mpptVmin : "",
    onChange: e => set("mpptVmin", parseFloat(e.target.value) || 0),
    placeholder: "350"
  })), React.createElement(Field, {
    label: "MPPT \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.mpptVmax != null ? f.mpptVmax : "",
    onChange: e => set("mpptVmax", parseFloat(e.target.value) || 0),
    placeholder: "560"
  })), React.createElement(Field, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19 DC \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.maxVdc != null ? f.maxVdc : "",
    onChange: e => set("maxVdc", parseFloat(e.target.value) || 0),
    placeholder: "600 / 1000"
  })), React.createElement(Field, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E17\u0E33\u0E07\u0E32\u0E19 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.vStart != null ? f.vStart : "",
    onChange: e => set("vStart", parseFloat(e.target.value) || 0),
    placeholder: "180 / 200"
  })), React.createElement(Field, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E44\u0E27\u0E49 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.vRated != null ? f.vRated : "",
    onChange: e => set("vRated", parseFloat(e.target.value) || 0),
    placeholder: "600 / 720"
  }))), React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-2)",
      margin: "12px 0 8px"
    }
  }, "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E40\u0E02\u0E49\u0E32 (\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15\u0E41\u0E22\u0E01 3 \u0E04\u0E48\u0E32 \u0E04\u0E19\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D 1 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15 (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.maxInA != null ? f.maxInA : "",
    onChange: e => set("maxInA", parseFloat(e.target.value) || 0),
    placeholder: "23"
  })), React.createElement(Field, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D 1 MPPT (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.maxMpptA != null ? f.maxMpptA : "",
    onChange: e => set("maxMpptA", parseFloat(e.target.value) || 0),
    placeholder: "30 / 33"
  })), React.createElement(Field, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14/MPPT (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.maxIscA != null ? f.maxIscA : "",
    onChange: e => set("maxIscA", parseFloat(e.target.value) || 0),
    placeholder: "40 / 44"
  })), React.createElement(Field, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07 AC \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (kW)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invMaxAcKw != null ? f.invMaxAcKw : "",
    onChange: e => set("invMaxAcKw", parseFloat(e.target.value) || 0),
    placeholder: "55"
  })), React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (%)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invEff != null ? f.invEff : "",
    onChange: e => set("invEff", parseFloat(e.target.value) || 0),
    placeholder: "98.5"
  })), React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E\u0E22\u0E38\u0E42\u0E23\u0E1B (%)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invEffEuro != null ? f.invEffEuro : "",
    onChange: e => set("invEffEuro", parseFloat(e.target.value) || 0),
    placeholder: "98.2"
  }))), React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.55
    }
  }, "\u0E01\u0E23\u0E30\u0E41\u0E2A 3 \u0E04\u0E48\u0E32\u0E19\u0E35\u0E49\u0E2B\u0E49\u0E32\u0E21\u0E2A\u0E25\u0E31\u0E1A\u0E01\u0E31\u0E19 \u2014 ", React.createElement("b", null, "\u0E15\u0E48\u0E2D\u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15"), " \u0E04\u0E38\u0E21\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27 (Imp \u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19) \xB7 ", React.createElement("b", null, "\u0E15\u0E48\u0E2D MPPT"), " \u0E04\u0E38\u0E21\u0E17\u0E38\u0E01\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E02\u0E19\u0E32\u0E19\u0E40\u0E02\u0E49\u0E32\u0E0A\u0E48\u0E2D\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19 (\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E48\u0E32\u0E40\u0E2A\u0E35\u0E22\u0E1A\u0E02\u0E19\u0E32\u0E19\u0E44\u0E14\u0E49\u0E01\u0E35\u0E48\u0E40\u0E2A\u0E49\u0E19\u0E08\u0E23\u0E34\u0E07) \xB7 ", React.createElement("b", null, "\u0E25\u0E31\u0E14\u0E27\u0E07\u0E08\u0E23/MPPT"), " \u0E40\u0E17\u0E35\u0E22\u0E1A\u0E01\u0E31\u0E1A Isc\xD71.25 \xB7 \u0E23\u0E38\u0E48\u0E19\u0E17\u0E35\u0E48\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E17\u0E38\u0E01\u0E0A\u0E48\u0E2D\u0E07 (\u0E40\u0E0A\u0E48\u0E19 30/33/33/30) \u0E43\u0E2B\u0E49\u0E01\u0E23\u0E2D\u0E01\u0E04\u0E48\u0E32\u0E19\u0E49\u0E2D\u0E22\u0E2A\u0E38\u0E14\u0E44\u0E27\u0E49\u0E01\u0E48\u0E2D\u0E19 \xB7 \u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E\u0E22\u0E38\u0E42\u0E23\u0E1B\u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 \u0E2A\u0E48\u0E27\u0E19\u0E04\u0E48\u0E32\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E42\u0E06\u0E29\u0E13\u0E32\u0E1A\u0E19\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15")), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E19 String/Hybrid \u2192 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E16\u0E2D\u0E14 BOQ \u0E44\u0E14\u0E49 \u0E04\u0E34\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27 = \u0E1B\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19(\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E23\u0E27\u0E21 \xF7 MAX PV \u0E15\u0E48\u0E2D\u0E15\u0E31\u0E27) \xB7 MAX PV = \u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E43\u0E2A\u0E48\u0E44\u0E14\u0E49 \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E48\u0E2D\u0E07 MPPT \xD7 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15\u0E15\u0E48\u0E2D\u0E0A\u0E48\u0E2D\u0E07 = \u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E35\u0E22\u0E1A\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E15\u0E31\u0E27 (\u0E40\u0E0A\u0E48\u0E19 2 \u0E0A\u0E48\u0E2D\u0E07 \xD7 2 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15 = 4 \u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 \u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32 2 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15/\u0E0A\u0E48\u0E2D\u0E07) \xB7 \u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01 (A) = \u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13 RCBO \u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22 AC \u0E08\u0E38\u0E14 INVERTER-MCB_SOLAR / MCB_SOLAR-MDB (\xD71.25) \xB7 \u0E0A\u0E48\u0E27\u0E07 MPPT/Voc \u0E41\u0E1C\u0E07 \u2192 \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 + \u0E2A\u0E32\u0E22 DC")), mainCat === "electrical" && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 10
    }
  }, React.createElement(Icon, {
    name: "bolt",
    size: 14,
    color: "#4F46E5"
  }), " \u0E2A\u0E40\u0E1B\u0E04\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E44\u0E1F\u0E1F\u0E49\u0E32 (\u0E40\u0E1A\u0E23\u0E01\u0E40\u0E01\u0E2D\u0E23\u0E4C / \u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.elecType || "",
    onChange: e => set("elecType", e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), React.createElement("option", {
    value: "RCBO"
  }, "RCBO"), React.createElement("option", {
    value: "MCB"
  }, "MCB"), React.createElement("option", {
    value: "MCCB"
  }, "MCCB"), React.createElement("option", {
    value: "Fuse"
  }, "Fuse"), React.createElement("option", {
    value: "Fuse Holder"
  }, "Fuse Holder"), React.createElement("option", {
    value: "SPD"
  }, "SPD"), React.createElement("option", {
    value: "Busbar"
  }, "\u0E1A\u0E31\u0E2A\u0E1A\u0E32\u0E23\u0E4C"), React.createElement("option", {
    value: "Other"
  }, "\u0E2D\u0E37\u0E48\u0E19\u0E46"))), React.createElement(Field, {
    label: "\u0E02\u0E31\u0E49\u0E27 (Pole)"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.poles || "",
    onChange: e => set("poles", e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38 \u2014"), React.createElement("option", {
    value: "1P"
  }, "1P"), React.createElement("option", {
    value: "2P"
  }, "2P"), React.createElement("option", {
    value: "3P"
  }, "3P"), React.createElement("option", {
    value: "3P+N"
  }, "3P+N"), React.createElement("option", {
    value: "4P"
  }, "4P"))), React.createElement(Field, {
    label: "\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.amp != null ? f.amp : "",
    onChange: e => set("amp", parseFloat(e.target.value) || 0),
    placeholder: "16 / 32 / 63"
  }))), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E23\u0E30\u0E1A\u0E38\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 + \u0E02\u0E31\u0E49\u0E27 + \u0E41\u0E2D\u0E21\u0E1B\u0E4C \u2192 \u0E43\u0E0A\u0E49\u0E0A\u0E48\u0E27\u0E22\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E15\u0E2D\u0E19\u0E16\u0E2D\u0E14 BOQ (\u0E40\u0E0A\u0E48\u0E19 RCBO \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E19\u0E32\u0E14\u0E08\u0E32\u0E01 Max output current \xD7 1.25)")), mainCat === "wiring" && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 10
    }
  }, React.createElement(Icon, {
    name: "power",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E2B\u0E21\u0E27\u0E14\u0E2A\u0E32\u0E22 (\u0E43\u0E0A\u0E49\u0E08\u0E31\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21\u0E43\u0E19 dropdown \u0E16\u0E2D\u0E14 BOQ)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E2B\u0E21\u0E27\u0E14\u0E2A\u0E32\u0E22"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.cableGroup || "",
    onChange: e => set("cableGroup", e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E40\u0E14\u0E32\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D) \u2014"), (window.BOQ.CABLE_GROUPS || []).map(g => React.createElement("option", {
    key: g,
    value: g
  }, g))))), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.5
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14 \u2192 \u0E40\u0E27\u0E25\u0E32\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E32\u0E22\u0E15\u0E2D\u0E19\u0E16\u0E2D\u0E14 BOQ \u0E08\u0E30\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E15\u0E49\u0E0A\u0E34\u0E1B\u0E2B\u0E21\u0E27\u0E14\u0E19\u0E35\u0E49 \xB7 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E14\u0E32\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D (CV-FD / VCT / THW / PV1-F / LAN)"))), React.createElement("div", {
    style: {
      padding: "14px 22px",
      paddingBottom: isMobile ? "calc(14px + env(safe-area-inset-bottom, 0px))" : 14,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      flex: isMobile ? "0 0 auto" : "none",
      padding: "11px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: submitItem,
    style: {
      flex: isMobile ? 1 : "none",
      padding: "11px 22px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))));
}
function AmpacityEditor({
  ampStore
}) {
  const BOQ = window.BOQ || {};
  const sizes = BOQ.WIRE_SIZES || [];
  const classes = BOQ.INS_CLASSES || [];
  const methods = BOQ.WIRE_METHODS || [];
  const nconds = BOQ.AMP_NCOND || [];
  const cores = BOQ.AMP_CORES || [];
  const def = BOQ.DEFAULT_AMPACITY || {};
  const ov = ampStore && ampStore.overrides || {};
  const [insKey, setInsKey] = React.useState(classes[0] && classes[0].key || "pvc");
  const [methodKey, setMethodKey] = React.useState(methods[0] && methods[0].key || "conduitAir");
  const colKey = (g, n, c) => g + "|" + n + "|" + c;
  const ovVal = (g, n, c, sz) => {
    try {
      const v = ov[insKey][methodKey][colKey(g, n, c)][sz];
      return v > 0 ? v : undefined;
    } catch (e) {
      return undefined;
    }
  };
  const baseKey = (BOQ.WIRE_METHOD_BASE || {})[methodKey];
  const rawDef = (m, g, n, c, sz) => {
    try {
      return def[insKey][m][colKey(g, n, c)][sz];
    } catch (e) {
      return undefined;
    }
  };
  const defVal = (g, n, c, sz) => {
    const own = rawDef(methodKey, g, n, c, sz);
    if (own != null) return own;
    return baseKey ? rawDef(baseKey, g, n, c, sz) : undefined;
  };
  const anyDef = m => {
    const t = (def[insKey] || {})[m] || {};
    return Object.keys(t).some(c => Object.keys(t[c] || {}).length > 0);
  };
  const methodMeta = methods.find(m => m.key === methodKey) || {};
  const borrowed = !!(baseKey && !anyDef(methodKey) && anyDef(baseKey));
  const noTable = !anyDef(methodKey) && !borrowed;
  const methodTh = k => (methods.find(m => m.key === k) || {}).th || k;
  const groups = (BOQ.AMP_GROUPS || []).filter(g => !methodMeta.groups || methodMeta.groups.indexOf(g.key) >= 0);
  const editedCount = React.useMemo(() => {
    let n = 0;
    Object.keys(ov).forEach(i => Object.keys(ov[i] || {}).forEach(m => Object.keys(ov[i][m] || {}).forEach(col => Object.keys(ov[i][m][col] || {}).forEach(s => {
      if (+ov[i][m][col][s] > 0) n++;
    }))));
    return n;
  }, [ov]);
  const groupCores = g => BOQ.ampCoresFor ? BOQ.ampCoresFor(g.key) : cores;
  const leaf = [];
  groups.forEach(g => {
    const cs = groupCores(g);
    nconds.forEach((n, ni) => cs.forEach((c, ci) => leaf.push({
      g: g.key,
      n: n.key,
      c: c.key,
      cTh: c.th,
      first: ni === 0 && ci === 0
    })));
  });
  const cellStyle = {
    width: 58,
    height: 32,
    padding: "0 4px",
    textAlign: "center",
    borderRadius: 8,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text-1)",
    fontFamily: "var(--mono)",
    fontSize: 12
  };
  const thBase = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-2)",
    textAlign: "center",
    whiteSpace: "nowrap",
    background: "var(--surface2)",
    borderBottom: "1px solid var(--border)"
  };
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      padding: "12px 14px",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      borderRadius: 12,
      marginBottom: 14
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 16,
    color: "var(--tint-amber-tx)",
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#92500C",
      lineHeight: 1.55
    }
  }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A ", React.createElement("strong", null, "\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 \u0E27\u0E2A\u0E17."), " (\u0E15\u0E31\u0E27\u0E19\u0E33\u0E17\u0E2D\u0E07\u0E41\u0E14\u0E07 0.6/1 kV) \u2014 \u0E41\u0E22\u0E01\u0E15\u0E32\u0E21 ", React.createElement("strong", null, "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 \xD7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27\u0E19\u0E33\u0E21\u0E35\u0E01\u0E23\u0E30\u0E41\u0E2A \xD7 \u0E41\u0E01\u0E19\u0E22\u0E48\u0E2D\u0E22"), React.createElement("br", null), "\u0E41\u0E01\u0E19\u0E22\u0E48\u0E2D\u0E22\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E17\u0E38\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21: \u0E01\u0E25\u0E38\u0E48\u0E21 1,2,3,7 = ", React.createElement("strong", null, "\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27/\u0E2B\u0E25\u0E32\u0E22\u0E41\u0E01\u0E19"), " \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21 4 = ", React.createElement("strong", null, "\u0E41\u0E19\u0E27\u0E15\u0E31\u0E49\u0E07/\u0E41\u0E19\u0E27\u0E23\u0E32\u0E1A"), " (\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E25\u0E49\u0E27\u0E19) \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21 5,6 = ", React.createElement("strong", null, "\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27"), React.createElement("br", null), "\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07\u0E08\u0E23\u0E34\u0E07: ", React.createElement("strong", null, "PVC \xB7 \u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E17\u0E48\u0E2D\u0E23\u0E49\u0E2D\u0E22\u0E2A\u0E32\u0E22\u0E43\u0E19\u0E2D\u0E32\u0E01\u0E32\u0E28 \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48 1\u20132"), " (\u0E15\u0E32\u0E23\u0E32\u0E07\u0E17\u0E35\u0E48 5-20) \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48 3\u20137 \u0E41\u0E25\u0E30 XLPE ", React.createElement("strong", null, "\u0E01\u0E23\u0E2D\u0E01\u0E04\u0E48\u0E32\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48"), " \xB7 \u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E17\u0E38\u0E01\u0E07\u0E32\u0E19 \xB7 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 (\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E08\u0E32\u0E07)")), borrowed ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      padding: "11px 14px",
      background: "var(--tint-ok-bg)",
      border: "1px solid var(--tint-ok-bd)",
      borderRadius: 12,
      marginBottom: 14
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#22A35B",
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-ok-tx)",
      lineHeight: 1.55
    }
  }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E08\u0E32\u0E07\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E19\u0E35\u0E49 ", React.createElement("strong", null, "\u0E22\u0E37\u0E21\u0E21\u0E32\u0E08\u0E32\u0E01 \"", methodTh(baseKey), "\""), " \u2014 ", methodMeta.baseWhy || "วสท. ให้สองวิธีนี้ใช้ตารางพิกัดชุดเดียวกัน", React.createElement("br", null), "\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13 BOQ \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E0A\u0E38\u0E14\u0E19\u0E35\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E08\u0E23\u0E34\u0E07 \xB7 \u0E01\u0E23\u0E2D\u0E01\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E16\u0E49\u0E32\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E02\u0E2D\u0E07\u0E23\u0E38\u0E48\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49")) : noTable && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      padding: "11px 14px",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd2)",
      borderRadius: 12,
      marginBottom: 14
    }
  }, React.createElement(Icon, {
    name: "alert",
    size: 16,
    color: "#EF4444",
    style: {
      flexShrink: 0,
      marginTop: 1
    }
  }), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--tint-red-tx)",
      lineHeight: 1.55
    }
  }, React.createElement("strong", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07\u0E02\u0E2D\u0E07 \"", methodMeta.th || methodKey, "\""), " \u2014 \u0E0A\u0E48\u0E2D\u0E07 \"\u0E2A\u0E32\u0E22\u0E41\u0E19\u0E30\u0E19\u0E33\" \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32 BOQ \u0E08\u0E30\u0E02\u0E36\u0E49\u0E19 \"\u2014\" \u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E08\u0E30\u0E01\u0E23\u0E2D\u0E01", React.createElement("br", null), "\u0E41\u0E15\u0E48\u0E25\u0E30\u0E27\u0E34\u0E18\u0E35\u0E23\u0E30\u0E1A\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E23\u0E49\u0E2D\u0E19\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19 ", React.createElement("strong", null, "\u0E40\u0E2D\u0E32\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E02\u0E2D\u0E07\u0E27\u0E34\u0E18\u0E35\u0E2D\u0E37\u0E48\u0E19\u0E21\u0E32\u0E43\u0E2A\u0E48\u0E41\u0E17\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49"), " \u2014 \u0E23\u0E32\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1D\u0E32\u0E23\u0E31\u0E1A\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E44\u0E14\u0E49\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E23\u0E32\u0E07\u0E21\u0E35\u0E1D\u0E32 \u0E41\u0E25\u0E30\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E17\u0E48\u0E2D", React.createElement("br", null), "\u0E41\u0E19\u0E27\u0E17\u0E32\u0E07 \u0E27\u0E2A\u0E17.: \u0E1E\u0E34\u0E01\u0E31\u0E14\u0E43\u0E19\u0E23\u0E32\u0E07\u0E40\u0E04\u0E40\u0E1A\u0E34\u0E25 \u2248 ", React.createElement("strong", null, "65%"), " \u0E02\u0E2D\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E2A\u0E32\u0E22\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E2D\u0E32\u0E01\u0E32\u0E28 (\u0E2A\u0E32\u0E22 < 300 mm\xB2) \u0E41\u0E25\u0E30 ", React.createElement("strong", null, "75%"), " \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A 300 mm\xB2 \u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B \u2014 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E32\u0E22\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27\u0E43\u0E19\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E1B\u0E47\u0E19\u0E10\u0E32\u0E19\u0E01\u0E48\u0E2D\u0E19")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginBottom: 12,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, classes.map(c => React.createElement(CatChip, {
    key: c.key,
    active: insKey === c.key,
    onClick: () => setInsKey(c.key),
    label: c.th,
    color: "#F59E0B"
  })), React.createElement("div", {
    style: {
      width: 1,
      height: 22,
      background: "var(--border)",
      margin: "0 3px"
    }
  }), React.createElement("div", {
    style: {
      minWidth: 300,
      maxWidth: 340,
      flex: "1 1 260px"
    }
  }, React.createElement(Dropdown, {
    value: methodKey,
    onChange: setMethodKey,
    wrap: true,
    options: methods.map(m => ({
      value: m.key,
      label: m.th,
      sub: m.sub
    }))
  })), typeof WireArt === "function" && (() => {
    const mArt = (methods.find(m => m.key === methodKey) || {}).art;
    return mArt ? React.createElement(WireArt, {
      art: mArt,
      key: methodKey,
      w: 92,
      h: 54
    }) : null;
  })(), editedCount > 0 && React.createElement("button", {
    onClick: () => {
      askConfirm({
        title: "คืนค่าพิกัดกระแสที่แก้ไว้ทั้งหมด?",
        body: "ค่าที่แก้เองไว้ " + editedCount + " ช่อง จะกลับไปเป็นค่าตั้งต้น",
        ok: "คืนค่าตั้งต้น"
      }).then(ok => {
        if (ok) ampStore.reset();
      });
    },
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "6px 12px",
      borderRadius: 99,
      border: "1px solid var(--tint-red-bd2)",
      background: "var(--tint-red-bg)",
      color: "var(--tint-red-tx)",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 13,
    color: "var(--tint-red-tx)"
  }), " \u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49 (", editedCount, ")")), React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      overflowX: "auto"
    }
  }, React.createElement("table", {
    style: {
      borderCollapse: "collapse",
      minWidth: 760
    }
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", {
    rowSpan: 2,
    style: Object.assign({}, thBase, {
      padding: "8px 12px",
      textAlign: "left",
      position: "sticky",
      left: 0,
      color: "var(--text-3)",
      textTransform: "uppercase",
      letterSpacing: ".03em"
    })
  }, "\u0E02\u0E19\u0E32\u0E14 (mm\xB2)"), groups.map(g => React.createElement("th", {
    key: g.key,
    colSpan: nconds.length * groupCores(g).length,
    title: g.desc || "",
    style: Object.assign({}, thBase, {
      padding: "7px 6px",
      borderLeft: "1px solid var(--border)"
    })
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2
    }
  }, typeof WireArt === "function" && React.createElement(WireArt, {
    art: g.art,
    w: 74,
    h: 44
  }), React.createElement("span", null, g.th), g.sub && React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, g.sub))))), React.createElement("tr", null, leaf.map((lf, idx) => React.createElement("th", {
    key: idx,
    style: Object.assign({}, thBase, {
      padding: "6px 4px",
      fontSize: 10,
      fontWeight: 600,
      borderLeft: lf.first ? "1px solid var(--border)" : "none"
    })
  }, React.createElement("div", {
    style: {
      color: "var(--primary-dark)"
    }
  }, lf.n, " \u0E15\u0E31\u0E27\u0E19\u0E33"), React.createElement("div", {
    style: {
      color: "var(--text-3)"
    }
  }, lf.cTh))))), React.createElement("tbody", null, sizes.map(sz => React.createElement("tr", {
    key: sz,
    style: {
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement("td", {
    style: {
      padding: "6px 12px",
      fontWeight: 700,
      fontSize: 13,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      background: "var(--surface)",
      position: "sticky",
      left: 0,
      fontFamily: "var(--mono)"
    }
  }, sz), leaf.map((lf, idx) => React.createElement("td", {
    key: idx,
    style: {
      padding: "4px 5px",
      textAlign: "center",
      borderLeft: lf.first ? "1px solid var(--border)" : "none"
    }
  }, React.createElement("input", {
    type: "number",
    min: "0",
    style: cellStyle,
    value: ovVal(lf.g, lf.n, lf.c, sz) != null ? ovVal(lf.g, lf.n, lf.c, sz) : "",
    placeholder: defVal(lf.g, lf.n, lf.c, sz) != null ? String(defVal(lf.g, lf.n, lf.c, sz)) : "—",
    onChange: e => ampStore.setCell(insKey, methodKey, lf.g, lf.n, lf.c, sz, e.target.value)
  }))))))))), React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E2D\u0E21\u0E41\u0E1B\u0E23\u0E4C (A) \xB7 \"\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\" = \u0E2A\u0E32\u0E22 1C \xB7 \"\u0E2B\u0E25\u0E32\u0E22\u0E41\u0E01\u0E19\" = 2C \u0E02\u0E36\u0E49\u0E19\u0E44\u0E1B \xB7 \"\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27/\u0E2B\u0E25\u0E32\u0E22\u0E41\u0E01\u0E19\" = \u0E01\u0E25\u0E38\u0E48\u0E21\u0E19\u0E31\u0E49\u0E19\u0E43\u0E0A\u0E49\u0E15\u0E32\u0E23\u0E32\u0E07\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \xB7 \u0E23\u0E30\u0E1A\u0E1A\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E1A ", React.createElement("strong", null, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 \xD7 1.25"), " \u0E41\u0E25\u0E30\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E22\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23"));
}
let _pdfjsPromise = null;
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjsPromise) return _pdfjsPromise;
  const BASE = "https://unpkg.com/pdfjs-dist@3.11.174/build/";
  _pdfjsPromise = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = BASE + "pdf.min.js";
    s.onload = () => {
      if (!window.pdfjsLib) {
        rej(new Error("no pdfjsLib"));
        return;
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "pdf.worker.min.js";
      res(window.pdfjsLib);
    };
    s.onerror = () => {
      _pdfjsPromise = null;
      rej(new Error("load fail"));
    };
    document.head.appendChild(s);
  });
  return _pdfjsPromise;
}
const PDF_MAX_PAGES = 12;
function PdfPreview({
  data,
  onOpen
}) {
  const wrap = React.useRef(null);
  const [state, setState] = React.useState("loading");
  React.useEffect(() => {
    let dead = false;
    const el = wrap.current;
    if (!el || !data) return;
    el.innerHTML = "";
    setState("loading");
    loadPdfJs().then(lib => {
      const b64 = String(data).split(",")[1] || "";
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return lib.getDocument({
        data: arr
      }).promise;
    }).then(async pdf => {
      const width = el.clientWidth || 800;
      for (let p = 1; p <= Math.min(pdf.numPages, PDF_MAX_PAGES); p++) {
        if (dead) return;
        const page = await pdf.getPage(p);
        const v1 = page.getViewport({
          scale: 1
        });
        const vp = page.getViewport({
          scale: Math.min(3, width / v1.width * 1.6)
        });
        const canvas = document.createElement("canvas");
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.cssText = "width:100%;height:auto;display:block;border:1px solid var(--border);border-radius:12px;background:#fff;margin-bottom:10px";
        el.appendChild(canvas);
        await page.render({
          canvasContext: canvas.getContext("2d"),
          viewport: vp
        }).promise;
      }
      if (!dead) setState("ok");
    }).catch(() => {
      if (!dead) setState("error");
    });
    return () => {
      dead = true;
    };
  }, [data]);
  return React.createElement("div", null, state === "loading" && React.createElement("div", {
    style: {
      padding: 18,
      textAlign: "center",
      fontSize: 12.5,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u2026"), state === "error" && React.createElement("div", {
    style: {
      padding: 14,
      borderRadius: 12,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      fontSize: 12.5,
      color: "var(--text-2)",
      textAlign: "center"
    }
  }, "\u0E41\u0E2A\u0E14\u0E07\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 (\u0E15\u0E48\u0E2D\u0E2D\u0E34\u0E19\u0E40\u0E17\u0E2D\u0E23\u0E4C\u0E40\u0E19\u0E47\u0E15\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49) \u2014 ", React.createElement("span", {
    onClick: onOpen,
    style: {
      color: "var(--primary-dark)",
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E01\u0E14\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E15\u0E47\u0E21\u0E08\u0E2D\u0E41\u0E17\u0E19")), React.createElement("div", {
    ref: wrap
  }));
}
function ItemDetailModal({
  item,
  img,
  variants,
  loadDoc,
  setDoc,
  onMove,
  onEdit,
  onClose,
  onPickVariant,
  onAddSize
}) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const c = SF.STOCK_CAT_BY[item.cat] || SF.STOCK_CATS[SF.STOCK_CATS.length - 1];
  const st = lowState(item);
  const SPEC_FIELDS = [{
    k: "wp",
    th: "กำลังไฟ (Wp)"
  }, {
    k: "voc",
    th: "Voc (V)"
  }, {
    k: "isc",
    th: "Isc (A)"
  }, {
    k: "vmp",
    th: "Vmp (V)"
  }, {
    k: "imp",
    th: "Imp (A)"
  }, {
    k: "frame",
    th: "เฟรม (mm)"
  }, {
    k: "width",
    th: "กว้าง (ม.)"
  }, {
    k: "length",
    th: "ยาว (ม.)"
  }, {
    k: "tcVoc",
    th: "TC Voc (%/°C)"
  }, {
    k: "tcIsc",
    th: "TC Isc (%/°C)"
  }, {
    k: "tcPmax",
    th: "TC Pmax (%/°C)"
  }, {
    k: "noct",
    th: "NOCT (°C)"
  }, {
    k: "maxPv",
    th: "PV สูงสุด (kW)"
  }, {
    k: "mppt",
    th: "MPPT"
  }];
  const specs = SPEC_FIELDS.filter(f => item[f.k] != null && item[f.k] !== "" && +item[f.k] !== 0);
  const [doc, setDocState] = React.useState(undefined);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef(null);
  React.useEffect(() => {
    let dead = false;
    if (!item.doc) {
      setDocState(null);
      return;
    }
    if (loadDoc) loadDoc(item.id).then(d => {
      if (!dead) setDocState(d);
    });
    return () => {
      dead = true;
    };
  }, [item.id, item.doc && item.doc.name]);
  const [docUrl, setDocUrl] = React.useState("");
  React.useEffect(() => {
    if (!doc || !doc.data) {
      setDocUrl("");
      return;
    }
    const url = window.dataUrlToBlobUrl(doc.data);
    setDocUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [doc && doc.data]);
  const isDocImg = !!(doc && /^image\//.test(doc.type || ""));
  const openDoc = () => {
    if (docUrl) window.open(docUrl, "_blank", "noopener");
  };
  const pickDoc = file => {
    if (!file) return;
    setBusy(true);
    window.readFileAsDataURL(file).then(data => {
      setDoc(item.id, {
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        data: data
      });
      setDocState({
        name: file.name,
        size: file.size,
        type: file.type,
        data: data
      });
      setBusy(false);
    }).catch(() => {
      setBusy(false);
      alert("อ่านไฟล์ไม่สำเร็จ");
    });
  };
  const kb = n => n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const mainCat = SF.STOCK_CAT_BY[SF.mainCatOf(item.cat)] || c;
  const info = [{
    k: "หน่วยนับ",
    v: item.unit || "—"
  }, {
    k: "ขั้นต่ำแจ้งเตือน",
    v: (+item.min || 0).toLocaleString() + " " + (item.unit || ""),
    mono: true
  }, {
    k: "ที่จัดเก็บ",
    v: item.loc || "—"
  }, {
    k: "ชื่อเดิม / ชื่อพ้อง",
    v: (item.aka || []).join(" · ") || "—"
  }];
  const priceTxt = +item.price > 0 ? (+item.price).toLocaleString(undefined, {
    maximumFractionDigits: 2
  }) : null;
  const sectionLabel = {
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 110,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(1280px,100%)",
      maxHeight: isMobile ? "94dvh" : "94vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,.45)"
    }
  }, React.createElement("div", {
    style: {
      padding: "12px 18px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("span", {
    style: {
      minWidth: 0,
      flex: 1,
      fontSize: 12,
      color: "var(--text-3)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, React.createElement("span", {
    style: {
      color: mainCat.color,
      fontWeight: 700
    }
  }, mainCat.th), mainCat.key !== c.key ? React.createElement("span", null, " \u203A ", c.th) : null), React.createElement("button", {
    onClick: onClose,
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 16
  }))), React.createElement("div", {
    style: {
      padding: isMobile ? 16 : 22,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 18
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0,540px) minmax(0,1fr)",
      gap: isMobile ? 16 : 28
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
      aspectRatio: "1 / 1",
      display: "grid",
      placeItems: "center",
      padding: 16,
      position: "relative"
    }
  }, React.createElement(MatThumb, {
    src: img,
    item: item,
    size: "100%",
    radius: 0
  }), st !== "ok" && React.createElement("span", {
    style: {
      position: "absolute",
      top: 12,
      left: 12,
      fontSize: 11,
      fontWeight: 800,
      padding: "5px 11px",
      borderRadius: 99,
      background: st === "out" ? "#EF4444" : "#F59E0B",
      color: "#fff"
    }
  }, st === "out" ? "หมดสต็อก" : "ต่ำกว่าขั้นต่ำ"))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0
    }
  }, (item.brand || "").trim() && React.createElement("span", {
    style: {
      alignSelf: "flex-start",
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".04em",
      padding: "4px 11px",
      borderRadius: 6,
      background: mainCat.color + "18",
      color: mainCat.color
    }
  }, item.brand), React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: isMobile ? 20 : 25,
      fontWeight: 700,
      color: "var(--text-1)",
      lineHeight: 1.3,
      letterSpacing: "-.01em"
    }
  }, item.name), (item.model || "").trim() && React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-2)",
      fontWeight: 600
    }
  }, "\u0E23\u0E38\u0E48\u0E19 ", item.model), (item.desc || "").trim() && React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.7,
      whiteSpace: "pre-wrap"
    }
  }, item.desc), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E38 : ", item.sku || "—"), (variants || []).length > 1 && React.createElement("div", null, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--text-2)",
      marginBottom: 6
    }
  }, "\u0E02\u0E19\u0E32\u0E14 ", React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "(", variants.length, " \u0E02\u0E19\u0E32\u0E14)")), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, variants.map(v => {
    const on = v.it.id === item.id;
    const vs = lowState(v.it);
    return React.createElement("button", {
      key: v.it.id,
      onClick: () => !on && onPickVariant && onPickVariant(v.it),
      title: v.it.name + (vs === "out" ? " · หมดสต็อก" : ""),
      style: {
        padding: "6px 13px",
        borderRadius: 9,
        cursor: on ? "default" : "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary)18" : "var(--surface)",
        color: on ? "var(--primary-dark)" : vs === "out" ? "var(--text-3)" : "var(--text-2)",
        textDecoration: vs === "out" ? "line-through" : "none"
      }
    }, v.size);
  }), onAddSize && React.createElement("button", {
    onClick: onAddSize,
    title: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E19\u0E32\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E02\u0E2D\u0E07\u0E0A\u0E34\u0E49\u0E19\u0E19\u0E35\u0E49",
    style: {
      padding: "6px 12px",
      borderRadius: 9,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-3)"
    }
  }, "\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E19\u0E32\u0E14"))), React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border)"
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 22,
      flexWrap: "wrap"
    }
  }, React.createElement("span", null, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 2
    }
  }, "\u0E23\u0E32\u0E04\u0E32\u0E17\u0E38\u0E19/\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: "-.03em",
      color: priceTxt ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, priceTxt ? "฿" + priceTxt : "—"), priceTxt && React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, "/", item.unit)), React.createElement("span", null, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 2
    }
  }, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D"), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: "-.03em",
      color: STOCK_COLORS[st]
    }
  }, (+item.qty || 0).toLocaleString()), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginLeft: 3
    }
  }, item.unit))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
      gap: 9
    }
  }, ["in", "out", "return"].map(k => {
    const mt = MOVE_TYPES[k];
    return React.createElement("button", {
      key: k,
      onClick: () => onMove(k),
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "13px 8px",
        borderRadius: 12,
        border: "1px solid " + mt.accent + "44",
        background: mt.bg,
        color: mt.color,
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 19,
        lineHeight: 1
      }
    }, mt.sym), mt.label);
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 1,
      background: "var(--border)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden"
    }
  }, info.map(r => React.createElement("span", {
    key: r.k,
    style: {
      background: "var(--surface)",
      padding: "9px 12px",
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, r.k), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      textAlign: "right",
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontFamily: r.mono ? "var(--mono)" : "inherit"
    },
    title: String(r.v)
  }, r.v)))))), specs.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "\u0E2A\u0E40\u0E1B\u0E04\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
      gap: 8
    }
  }, specs.map(f => React.createElement("div", {
    key: f.k,
    style: {
      padding: "8px 10px",
      borderRadius: 10,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, f.th), React.createElement("div", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)",
      marginTop: 2
    }
  }, item[f.k]))))), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)"
    }
  }, "DATA SHEET / \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), doc && doc.data ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "11px 13px",
      borderRadius: 12,
      background: "var(--surface2)",
      border: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 9,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "#EF444414",
      color: "#EF4444",
      fontSize: 10,
      fontWeight: 800
    }
  }, "PDF"), React.createElement("span", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-1)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, doc.name), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, kb(doc.size || 0))), React.createElement("button", {
    onClick: openDoc,
    style: {
      flexShrink: 0,
      padding: "7px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E15\u0E47\u0E21\u0E08\u0E2D"), React.createElement("button", {
    onClick: () => {
      askConfirm({
        title: "ลบเอกสารนี้?",
        body: "DATA SHEET ที่แนบไว้กับรายการนี้จะหายไป",
        ok: "ลบเอกสาร"
      }).then(ok => {
        if (ok) {
          setDoc(item.id, null);
          setDocState(null);
        }
      });
    },
    title: "\u0E25\u0E1A",
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 14
  }))) : React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    disabled: busy,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: "14px 12px",
      borderRadius: 12,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: busy ? "wait" : "pointer",
      width: "100%"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--text-2)"
  }), busy ? "กำลังอัปโหลด…" : item.doc ? "กำลังโหลดเอกสาร…" : "แนบ DATA SHEET (PDF หรือรูป)"), doc && doc.data && (isDocImg ? React.createElement("img", {
    src: docUrl,
    alt: doc.name,
    style: {
      width: "100%",
      borderRadius: 12,
      border: "1px solid var(--border)",
      display: "block"
    }
  }) : React.createElement(PdfPreview, {
    data: doc.data,
    onOpen: openDoc
  })), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "application/pdf,image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      pickDoc(e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  }))), React.createElement("div", {
    style: {
      padding: "13px 22px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      flexShrink: 0
    }
  }, onAddSize && React.createElement("button", {
    onClick: onAddSize,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 15px",
      borderRadius: 11,
      marginRight: "auto",
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E19\u0E32\u0E14"), React.createElement("button", {
    onClick: onEdit,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))));
}
function FillVariantModal({
  items,
  onApply,
  onClose
}) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const rows = React.useMemo(() => (items || []).filter(it => !String(it.brand || "").trim() && !String(it.model || "").trim()).map(it => ({
    it: it,
    g: SF.guessVariant(it.name)
  })).filter(r => r.g && (r.g.brand || r.g.model)), [items]);
  const [off, setOff] = React.useState({});
  const on = id => !off[id];
  const toggle = id => setOff(p => Object.assign({}, p, {
    [id]: !p[id]
  }));
  const picked = rows.filter(r => on(r.it.id));
  const apply = () => onApply(picked.map(r => Object.assign({}, r.it, {
    brand: r.g.brand,
    model: r.g.model
  })));
  const skipped = (items || []).length - rows.length;
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 120,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(720px,100%)",
      maxHeight: isMobile ? "92dvh" : "88vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,.45)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E40\u0E15\u0E34\u0E21\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D/\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E2A\u0E14\u0E38"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 4,
      lineHeight: 1.5
    }
  }, "\u0E2D\u0E48\u0E32\u0E19\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D\u0E01\u0E31\u0E1A\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E14\u0E39\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E01\u0E14\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u0E2D\u0E31\u0E19\u0E44\u0E2B\u0E19\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E34\u0E4A\u0E01\u0E2D\u0E2D\u0E01\u0E44\u0E14\u0E49", skipped > 0 ? " · อีก " + skipped.toLocaleString() + " รายการไม่ขึ้นในลิสต์ เพราะกรอกไว้แล้ว หรือเป็นของโหลที่ไม่มียี่ห้อ" : "")), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: rows.length ? 0 : 20
    }
  }, rows.length === 0 ? React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-2)"
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E2D\u0E48\u0E32\u0E19\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D/\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E44\u0E14\u0E49 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E21\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E25\u0E30\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23") : rows.map(r => React.createElement("label", {
    key: r.it.id,
    style: {
      display: "grid",
      gridTemplateColumns: "26px minmax(0,1.5fr) minmax(0,1fr)",
      gap: 10,
      alignItems: "center",
      padding: "9px 20px",
      borderBottom: "1px solid var(--border)",
      cursor: "pointer"
    }
  }, React.createElement("input", {
    type: "checkbox",
    checked: on(r.it.id),
    onChange: () => toggle(r.it.id),
    style: {
      width: 16,
      height: 16,
      accentColor: "var(--primary)"
    }
  }), React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      color: "var(--text-1)",
      lineHeight: 1.35
    }
  }, r.it.name), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, r.it.sku)), React.createElement("span", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, r.g.brand && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 800,
      color: "var(--primary-dark)",
      background: "var(--primary-soft)",
      borderRadius: 99,
      padding: "2px 9px"
    }
  }, r.g.brand), r.g.model && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 99,
      padding: "2px 9px"
    }
  }, r.g.model))))), React.createElement("div", {
    style: {
      padding: "13px 20px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E27\u0E49 ", picked.length, " / ", rows.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "9px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    disabled: !picked.length,
    onClick: apply,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 16px",
      borderRadius: 11,
      border: 0,
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: picked.length ? "pointer" : "default",
      opacity: picked.length ? 1 : .5
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff"
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ", picked.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")))));
}
function MatThumb({
  src,
  item,
  size,
  radius
}) {
  const SF = window.SF;
  const s = size || 44;
  const c = (SF.STOCK_CAT_BY[(item || {}).cat] || {}).color || "#94A3B8";
  const box = {
    width: s,
    height: s,
    borderRadius: radius != null ? radius : 9,
    flexShrink: 0,
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    background: "var(--surface2)",
    border: "1px solid var(--border)"
  };
  if (src) return React.createElement("span", {
    style: box
  }, React.createElement("img", {
    src: src,
    alt: "",
    loading: "lazy",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      display: "block"
    }
  }));
  const ch = String((item || {}).name || "?").trim().charAt(0).toUpperCase();
  return React.createElement("span", {
    style: Object.assign({}, box, {
      background: c + "14",
      borderColor: c + "33"
    })
  }, React.createElement("span", {
    style: {
      fontSize: typeof s === "number" ? Math.round(s * 0.36) : 34,
      fontWeight: 800,
      color: c
    }
  }, ch));
}
function StockGrid({
  rows,
  imgs,
  onOpen,
  onEdit,
  onRemove,
  lowState
}) {
  const SF = window.SF;
  const baht = v => "฿" + (+v).toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  return React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
      gap: 12
    }
  }, (rows || []).map(r => {
    const it = r.it;
    const g = r.sizes && r.sizes.length > 1 ? groupSummary(r.sizes) : null;
    const st = g ? g.st : lowState(it);
    const c = SF.STOCK_CAT_BY[it.cat] || {};
    return React.createElement("div", {
      key: it.id,
      onClick: () => onOpen(it),
      title: g ? "กดเพื่อเลือกขนาด" : "กดเพื่อดูรายละเอียด · รับ / เบิก / คืน",
      style: {
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-sm)"
      }
    }, React.createElement("div", {
      style: {
        position: "relative",
        background: "var(--surface2)",
        aspectRatio: "1 / 1",
        display: "grid",
        placeItems: "center",
        padding: 10
      }
    }, React.createElement(MatThumb, {
      src: imgs[it.id],
      item: it,
      size: "100%",
      radius: 0
    }), st !== "ok" && React.createElement("span", {
      style: {
        position: "absolute",
        top: 8,
        left: 8,
        fontSize: 10,
        fontWeight: 800,
        padding: "3px 8px",
        borderRadius: 99,
        background: st === "out" ? "#EF4444" : "#F59E0B",
        color: "#fff"
      }
    }, st === "out" ? "หมดสต็อก" : "ต่ำกว่าขั้นต่ำ"), g && React.createElement("span", {
      style: {
        position: "absolute",
        top: 8,
        right: 8,
        fontSize: 10,
        fontWeight: 800,
        padding: "3px 8px",
        borderRadius: 99,
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        color: "var(--text-2)"
      }
    }, g.n, " \u0E02\u0E19\u0E32\u0E14")), React.createElement("div", {
      style: {
        padding: "10px 11px 11px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        flex: 1
      }
    }, (it.brand || "").trim() && React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 800,
        color: c.color || "var(--text-2)",
        letterSpacing: ".03em"
      }
    }, it.brand), React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-1)",
        lineHeight: 1.35,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }
    }, g ? baseLabel(it.name) : it.name), React.createElement("div", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 10.5,
        color: "var(--text-3)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, g ? g.sizes.join(" · ") : it.sku), React.createElement("div", {
      style: {
        marginTop: "auto",
        paddingTop: 7,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 6
      }
    }, React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 14,
        fontWeight: 800,
        color: (g ? g.max : +it.price) > 0 ? "var(--text-1)" : "var(--text-3)"
      }
    }, g ? g.max > 0 ? g.min === g.max ? baht(g.min) : baht(g.min) + "–" + (+g.max).toLocaleString(undefined, {
      maximumFractionDigits: 2
    }) : "–" : +it.price > 0 ? baht(it.price) : "–", React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: 600,
        color: "var(--text-3)"
      }
    }, it.unit ? "/" + it.unit : "")), React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: st === "out" ? "#EF4444" : st === "low" ? "#F59E0B" : "var(--text-2)"
      }
    }, "\u0E40\u0E2B\u0E25\u0E37\u0E2D ", (g ? g.qty : +it.qty || 0).toLocaleString())), g ? React.createElement("div", {
      style: {
        marginTop: 7,
        height: 28,
        borderRadius: 7,
        background: "var(--primary-soft)",
        color: "var(--primary-dark)",
        fontSize: 11.5,
        fontWeight: 700,
        display: "grid",
        placeItems: "center"
      }
    }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E19\u0E32\u0E14") : React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        gap: 5,
        marginTop: 7
      }
    }, React.createElement("button", {
      onClick: () => onEdit(it),
      title: "\u0E41\u0E01\u0E49\u0E44\u0E02",
      style: {
        flex: 1,
        height: 28,
        background: "#3B82F614",
        border: "none",
        color: "#3B82F6",
        borderRadius: 7,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "settings",
      size: 13
    })), React.createElement("button", {
      onClick: () => {
        askConfirm({
          title: "ลบ “" + it.name + "” ออกจากคลัง?"
        }).then(ok => {
          if (ok) onRemove(it.id);
        });
      },
      title: "\u0E25\u0E1A",
      style: {
        width: 32,
        height: 28,
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        borderRadius: 7,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 13
    })))));
  }));
}
function MatImagePicker({
  src,
  item,
  onPick,
  onClear
}) {
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef(null);
  const take = file => {
    if (!file || !/^image\//.test(file.type)) return;
    setBusy(true);
    window.resizeImageFile(file, 600, 0.72).then(d => {
      onPick(d);
      setBusy(false);
    }).catch(() => {
      setBusy(false);
      alert("อ่านไฟล์รูปไม่สำเร็จ");
    });
  };
  React.useEffect(() => {
    const onPaste = e => {
      const items = e.clipboardData && e.clipboardData.items || [];
      for (let i = 0; i < items.length; i++) {
        if (/^image\//.test(items[i].type)) {
          const f = items[i].getAsFile();
          if (f) {
            e.preventDefault();
            take(f);
            return;
          }
        }
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);
  return React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, React.createElement(MatThumb, {
    src: src,
    item: item,
    size: 72
  }), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, React.createElement("button", {
    type: "button",
    disabled: busy,
    onClick: () => ref.current && ref.current.click(),
    style: {
      padding: "7px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: busy ? "wait" : "pointer"
    }
  }, busy ? "กำลังย่อรูป…" : src ? "เปลี่ยนรูป" : "เลือกรูป"), src && React.createElement("button", {
    type: "button",
    onClick: onClear,
    style: {
      padding: "7px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "#EF4444",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A\u0E23\u0E39\u0E1B")), React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      lineHeight: 1.45
    }
  }, "\u0E22\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E2B\u0E25\u0E37\u0E2D 600px \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u2014 \u0E27\u0E32\u0E07\u0E23\u0E39\u0E1B\u0E08\u0E32\u0E01\u0E04\u0E25\u0E34\u0E1B\u0E1A\u0E2D\u0E23\u0E4C\u0E14\u0E43\u0E19\u0E0A\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49\u0E01\u0E47\u0E44\u0E14\u0E49")), React.createElement("input", {
    ref: ref,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      take(e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  }));
}
function CatCard({
  c,
  n,
  lowN,
  img,
  onPick,
  onImage
}) {
  const ref = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const take = file => {
    if (!file || !/^image\//.test(file.type)) return;
    setBusy(true);
    window.resizeImageFile(file, 600, 0.72).then(d => {
      onImage(d);
      setBusy(false);
    }).catch(() => {
      setBusy(false);
      alert("อ่านไฟล์รูปไม่สำเร็จ");
    });
  };
  const btn = {
    padding: "3px 9px",
    borderRadius: 99,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    fontFamily: "inherit",
    fontSize: 10.5,
    fontWeight: 700,
    cursor: busy ? "wait" : "pointer",
    color: "var(--text-2)"
  };
  return React.createElement("div", {
    onClick: () => onPick(c.key),
    style: {
      position: "relative",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 13,
      padding: 14,
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("span", {
    style: {
      width: 76,
      height: 76,
      borderRadius: 12,
      flexShrink: 0,
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      background: img ? "var(--surface2)" : c.color + "16",
      border: "1px solid " + (img ? "var(--border)" : c.color + "33")
    }
  }, img ? React.createElement("img", {
    src: img,
    alt: "",
    loading: "lazy",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      display: "block"
    }
  }) : React.createElement(Icon, {
    name: c.icon || "box",
    size: 30,
    color: c.color
  })), React.createElement("span", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)",
      lineHeight: 1.3
    }
  }, c.th), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 3
    }
  }, (n || 0).toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", lowN ? React.createElement("span", {
    style: {
      color: "#EF4444",
      fontWeight: 700
    }
  }, " · ของขาด " + lowN) : null), React.createElement("span", {
    onClick: e => e.stopPropagation(),
    style: {
      display: "flex",
      gap: 5,
      marginTop: 7
    }
  }, React.createElement("button", {
    type: "button",
    disabled: busy,
    style: btn,
    onClick: () => ref.current && ref.current.click()
  }, busy ? "กำลังย่อรูป…" : img ? "เปลี่ยนรูป" : "ใส่รูป"), img && React.createElement("button", {
    type: "button",
    style: Object.assign({}, btn, {
      color: "#EF4444"
    }),
    onClick: () => onImage("")
  }, "\u0E25\u0E1A\u0E23\u0E39\u0E1B"))), React.createElement(Icon, {
    name: "chevronDown",
    size: 16,
    color: "var(--text-3)",
    style: {
      transform: "rotate(-90deg)",
      flexShrink: 0
    }
  }), React.createElement("input", {
    ref: ref,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onClick: e => e.stopPropagation(),
    onChange: e => {
      take(e.target.files && e.target.files[0]);
      e.target.value = "";
    }
  }));
}
function CatBrowser({
  list,
  count,
  low,
  imgs,
  title,
  hint,
  allLabel,
  onPick,
  onAll,
  onBack,
  onSetImage
}) {
  const shown = list || [];
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
      flexWrap: "wrap"
    }
  }, onBack && React.createElement("button", {
    onClick: onBack,
    title: "\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E25\u0E31\u0E01",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-3)",
    style: {
      transform: "rotate(90deg)"
    }
  }), "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, title), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, hint), React.createElement("button", {
    onClick: onAll,
    style: {
      marginLeft: "auto",
      padding: "7px 14px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, allLabel || "ดูทุกรายการ")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
      gap: 14
    }
  }, shown.map(c => React.createElement(CatCard, {
    key: c.key,
    c: c,
    n: count[c.key],
    lowN: low[c.key],
    img: imgs["cat_" + c.key],
    onPick: onPick,
    onImage: d => onSetImage(c.key, d)
  }))));
}
Object.assign(window, {
  StockView
});