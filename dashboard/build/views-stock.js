function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function lowState(it) {
  if (it.qty <= 0) return "out";
  if (it.qty <= it.min) return "low";
  return "ok";
}
const STOCK_COLORS = {
  out: "#EF4444",
  low: "#F59E0B",
  ok: "#1B9B75"
};
const SIZE_RE = /(\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?|mm\.?|มม\.?)?)|(\d+[\s-]\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+\/\d+\s*(?:"|″|นิ้ว))|(\d+(?:\.\d+)?\s*(?:sq\.?\s*mm\.?|ตร\.?\s*มม\.?))|(\d+(?:\.\d+)?\s*(?:mm\.?|มม\.?|"|″|นิ้ว))|(\b\d+(?:\.\d+)?AT?\b)/i;
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
    accent: "#1B9B75",
    bg: "#1B9B7516",
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
      border: "none",
      borderRadius: mob ? 14 : 16,
      padding: mob ? 14 : 18,
      boxShadow: active ? "inset 0 0 0 1px " + accent + ", 0 0 0 3px " + accent + "22" : hov ? "inset 0 0 0 1px " + accent + ", 0 4px 12px rgba(0,0,0,.08)" : "var(--shadow-sm)",
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
  condStore,
  omStore,
  rulesStore,
  canManagePrices
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const byName = currentUser && currentUser.name || "-";
  const [tab, setTab] = React.useState("stock");
  const isPrices = tab === "prices" && canManagePrices;
  const isRules = tab === "rules" && canManagePrices;
  const isAmp = isRules,
    isCond = isRules,
    isOm = isRules;
  const [cat, setCat] = React.useState("all");
  const [sub, setSub] = React.useState("all");
  const [grp, setGrp] = React.useState("all");
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
  const [series, setSeries] = React.useState("all");
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
    if (series !== "all" && !search.trim() && !kpiFilter) {
      setSeries("all");
      setBrowse(true);
      return;
    }
    if (brand !== "all" && !search.trim() && !kpiFilter) {
      setBrand("all");
      setBrowse(true);
      return;
    }
    if (sub !== "all") {
      setSub("all");
      setBrowse(true);
      return;
    }
    if (grp !== "all") {
      setGrp("all");
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
    setGrp("all");
  }, [cat]);
  React.useEffect(() => {
    setSeries("all");
  }, [cat, sub, brand]);
  React.useEffect(() => {
    if (sub !== "all" && !subChips.some(c => c.key === sub)) setSub("all");
  }, [subChips.length]);
  const brandCount = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      if (cat !== "all" && it.cat !== cat && SF.mainCatOf(it.cat) !== cat) return;
      if (sub !== "all" && it.cat !== sub) return;
      const b = it.brand || "";
      if (!b.trim()) return;
      m[b] = (m[b] || 0) + 1;
    });
    return m;
  }, [items, cat, sub]);
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
    if (grp !== "all" && sub === "all" && stockGrpOf(it.cat) !== grp) return false;
    if (brand !== "all" && (it.brand || "") !== brand) return false;
    if (series !== "all" && (it.series || "") !== series) return false;
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
      sku: "",
      warY: +it.warY || 0,
      warPerfY: +it.warPerfY || 0,
      warNote: it.warNote || ""
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
  const subHome = React.useMemo(() => {
    if (grp !== "all") return {
      list: subChips.filter(c => (c.grp || "") === grp),
      count: subCount,
      low: subLow
    };
    const gl = [],
      rest = [],
      count = Object.assign({}, subCount),
      low = Object.assign({}, subLow);
    subChips.forEach(c => {
      const g = c.grp || "";
      if (!g) {
        rest.push(c);
        return;
      }
      const k = "grp_" + cat + "_" + g;
      if (!gl.some(x => x.key === k)) {
        const d = STOCK_GRPS[g] || {
          th: g,
          color: "#0891B2"
        };
        gl.push({
          key: k,
          th: d.th,
          color: d.color,
          icon: "bolt",
          grpOf: g
        });
        count[k] = 0;
        low[k] = 0;
      }
      count[k] += subCount[c.key] || 0;
      low[k] += subLow[c.key] || 0;
    });
    return {
      list: gl.concat(rest),
      count: count,
      low: low
    };
  }, [grp, cat, subChips, subCount, subLow]);
  const directItems = showSubHome ? filtered.filter(it => it.cat === cat) : [];
  const brandHome = React.useMemo(() => {
    if (!browsing || cat === "all" || showSubHome) return null;
    const m = {},
      low = {},
      none = [];
    filtered.forEach(it => {
      const b = it.brand || "";
      if (!b.trim()) {
        none.push(it);
        return;
      }
      m[b] = (m[b] || 0) + 1;
      if (lowState(it) !== "ok") low[b] = (low[b] || 0) + 1;
    });
    const keys = Object.keys(m).sort((a, z) => a.localeCompare(z, "th"));
    if (keys.length < 2 && !(keys.length === 1 && filtered.some(it => (it.series || "").trim()))) return null;
    const catByName = {};
    SF.STOCK_CATS.concat(Object.keys(SF.STOCK_SUB_BY_CAT || {}).reduce((a, k) => a.concat(SF.STOCK_SUB_BY_CAT[k] || []), [])).forEach(c => {
      if (c && c.th && imgs["cat_" + c.key]) catByName[String(c.th).trim().toLowerCase()] = imgs["cat_" + c.key];
    });
    const list = keys.map(b => {
      const k = "brand_" + b.trim().toLowerCase().replace(/[.#$\[\]\/\s]+/g, "_");
      return {
        key: b,
        th: b,
        color: "#0EA5E9",
        icon: "box",
        imgKey: k,
        img: imgs["cat_" + k] || catByName[b.trim().toLowerCase()] || ""
      };
    });
    return {
      list: list,
      count: m,
      low: low,
      none: none
    };
  }, [browsing, cat, showSubHome, filtered, imgs]);
  const seriesHome = React.useMemo(() => {
    if (isPrices || isAmp || !browse || search.trim() || kpiFilter || brand === "all" || series !== "all") return null;
    const m = {},
      low = {},
      none = [];
    filtered.forEach(it => {
      const s = (it.series || "").trim();
      if (!s) {
        none.push(it);
        return;
      }
      m[s] = (m[s] || 0) + 1;
      if (lowState(it) !== "ok") low[s] = (low[s] || 0) + 1;
    });
    const keys = Object.keys(m).sort((a, z) => a.localeCompare(z, "th", {
      numeric: true
    }));
    if (!keys.length) return null;
    const list = keys.map(s => {
      const k = ("series_" + brand + "_" + s).trim().toLowerCase().replace(/[.#$\[\]\/\s]+/g, "_");
      const first = filtered.find(it => (it.series || "").trim() === s && imgs[it.id]);
      return {
        key: s,
        th: s,
        color: "#0EA5E9",
        icon: "box",
        imgKey: k,
        img: imgs["cat_" + k] || (first ? imgs[first.id] : "")
      };
    });
    return {
      list: list,
      count: m,
      low: low,
      none: none
    };
  }, [isPrices, isAmp, browse, search, kpiFilter, brand, series, filtered, imgs]);
  const filterBar = React.createElement("div", {
    className: "content-filters"
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
    active: tab === "rules",
    onClick: () => setTab("rules"),
    label: "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E04\u0E33\u0E19\u0E27\u0E13 BOQ",
    color: "#F59E0B"
  })), !isMobile && isPrices && !isAmp && !isCond && !isOm && React.createElement("button", {
    onClick: toggleCat,
    title: catOpen ? "ซ่อนตัวกรองหมวด" : "แสดงตัวกรองหมวด",
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 13px",
      borderRadius: "var(--r-pill)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
  }))), isMobile && !isPrices && !isAmp && !isCond && !isOm && React.createElement("div", {
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
  })), !isMobile && isPrices && !isAmp && !isCond && !isOm && React.createElement("div", {
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
  })))));
  const viewBtn = fromBrowse => isMobile ? null : React.createElement("button", {
    onClick: () => {
      setView(v => v === "grid" ? "table" : "grid");
      if (fromBrowse) setBrowse(false);
    },
    title: view === "grid" ? "สลับเป็นมุมมองตาราง" : "สลับเป็นมุมมองการ์ด (มีรูป)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 14px",
      borderRadius: "var(--r-chip)",
      border: "none",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: view === "grid" ? "menu" : "grid",
    size: 14,
    color: "var(--text-2)"
  }), view === "grid" ? "ตาราง" : "การ์ด");
  return React.createElement(React.Fragment, null, React.createElement("header", {
    className: "app-header",
    style: {
      paddingBottom: isMobile ? 12 : 18
    }
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
  }, isRules ? "ตั้งค่าคำนวณ BOQ" : isPrices ? "ราคาวัสดุ (BOQ)" : "คลังสินค้า / สต็อก"), isRules ? React.createElement("p", {
    className: "page-sub"
  }, "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E41\u0E25\u0E30\u0E15\u0E32\u0E23\u0E32\u0E07\u0E17\u0E35\u0E48\u0E43\u0E1A BOQ \u0E43\u0E0A\u0E49\u0E04\u0E34\u0E14\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u0E23\u0E32\u0E04\u0E32 \u0E41\u0E25\u0E30\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 \u2014 \u0E15\u0E31\u0E49\u0E07\u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E43\u0E0A\u0E49\u0E17\u0E31\u0E49\u0E07\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17") : isPrices ? React.createElement("p", {
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
  }, lowCount, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14")))), !isAmp && !isOm && React.createElement("div", {
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
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32"
  }) : React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32"
  })), isPrices ? React.createElement("button", {
    className: "btn-add",
    onClick: () => setAddPriceOpen(true)
  }, React.createElement(Icon, {
    name: "plus",
    size: 17,
    color: "#fff",
    sw: 2.4
  }), React.createElement("span", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E27\u0E31\u0E2A\u0E14\u0E38")) : React.createElement(React.Fragment, null, React.createElement("button", {
    className: "btn-add",
    onClick: () => setFillOpen(true),
    style: {
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      color: "var(--text-2)",
      border: "none"
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
  }), React.createElement("span", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")))))), isRules ? React.createElement("div", {
    className: "app-content"
  }, filterBar, React.createElement(BoqRulesPage, {
    ampStore: ampStore,
    condStore: condStore,
    omStore: omStore,
    rulesStore: rulesStore,
    isMobile: isMobile,
    stock: stock
  })) : isPrices ? React.createElement("div", {
    className: "app-content"
  }, filterBar, React.createElement(PricePanel, {
    priceStore: priceStore,
    stock: stock,
    q: priceQ,
    grp: priceGrp
  })) : React.createElement("div", {
    className: "app-content"
  }, filterBar, showCatHome && React.createElement(BrandMarquee, {
    items: items,
    imgs: imgs,
    onPick: setBrand
  }), brandList.length > 0 && !showCatHome && React.createElement("div", {
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
  })))), React.createElement("div", null, !isPrices && !isAmp && !showCatHome && !showSubHome && !brandHome && !seriesHome && React.createElement("div", {
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
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      color: sub === "all" && grp === "all" ? "var(--text-1)" : "var(--text-2)",
      cursor: "pointer"
    },
    onClick: () => {
      setSub("all");
      setGrp("all");
      setBrowse(true);
    }
  }, (SF.STOCK_CAT_BY[cat] || {}).th || "")), grp !== "all" && React.createElement("span", null, " \u203A ", React.createElement("span", {
    style: {
      fontWeight: 700,
      color: sub === "all" ? "var(--text-1)" : "var(--text-2)",
      cursor: "pointer"
    },
    onClick: () => {
      setSub("all");
      setBrowse(true);
    }
  }, (STOCK_GRPS[grp] || {}).th || grp)), sub !== "all" && React.createElement("span", null, " \u203A ", React.createElement("span", {
    style: {
      fontWeight: 700,
      color: brand === "all" ? "var(--text-1)" : "var(--text-2)",
      cursor: "pointer"
    },
    onClick: () => {
      setBrand("all");
      setBrowse(true);
    }
  }, (SF.STOCK_CAT_BY[sub] || {}).th || "")), brand !== "all" && React.createElement("span", null, " \u203A ", React.createElement("span", {
    style: {
      fontWeight: 700,
      color: series === "all" ? "var(--text-1)" : "var(--text-2)",
      cursor: "pointer"
    },
    onClick: () => {
      setSeries("all");
      setBrowse(true);
    }
  }, brand)), series !== "all" && React.createElement("span", null, " \u203A ", React.createElement("span", {
    style: {
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, series)), React.createElement("span", null, " \xB7 ", filtered.length.toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, viewBtn(false))), showCatHome ? React.createElement(CatBrowser, {
    list: SF.STOCK_CATS.filter(c => catCount[c.key]),
    count: catCount,
    low: catLow,
    imgs: imgs,
    title: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E21\u0E27\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23",
    hint: SF.STOCK_CATS.filter(c => catCount[c.key]).length + " หมวด · " + items.length.toLocaleString() + " รายการ",
    onPick: k => setCat(k),
    onAll: () => setBrowse(false),
    tools: viewBtn(true),
    onSetImage: (k, d) => stock.setImage("cat_" + k, d)
  }) : showSubHome ? React.createElement(React.Fragment, null, React.createElement(CatBrowser, {
    list: subHome.list,
    count: subHome.count,
    low: subHome.low,
    imgs: imgs,
    title: ((SF.STOCK_CAT_BY[cat] || {}).th || "") + (grp !== "all" ? " › " + ((STOCK_GRPS[grp] || {}).th || grp) : ""),
    hint: subHome.list.length + (grp !== "all" ? " หมวดย่อย · " + filtered.length.toLocaleString() : " หมวด · " + (catCount[cat] || 0).toLocaleString()) + " รายการ",
    allLabel: grp !== "all" ? "ดูทุกรายการในกลุ่มนี้" : "ดูทุกรายการในหมวดนี้",
    onPick: k => {
      const x = subHome.list.find(y => y.key === k);
      if (x && x.grpOf) setGrp(x.grpOf);else setSub(k);
    },
    onAll: () => setBrowse(false),
    tools: viewBtn(true),
    onBack: () => grp !== "all" ? setGrp("all") : setCat("all"),
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
  }))) : seriesHome ? React.createElement(React.Fragment, null, React.createElement(CatBrowser, {
    list: seriesHome.list,
    count: seriesHome.count,
    low: seriesHome.low,
    imgs: seriesHome.list.reduce((m, b) => {
      m["cat_" + b.key] = b.img;
      return m;
    }, {}),
    title: brand,
    hint: seriesHome.list.length + " กลุ่มรุ่น · " + filtered.length.toLocaleString() + " รายการ",
    allLabel: "\u0E14\u0E39\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D\u0E19\u0E35\u0E49",
    onPick: s => setSeries(s),
    onAll: () => setBrowse(false),
    tools: viewBtn(true),
    onBack: goBack,
    onSetImage: (s, d) => {
      const x = seriesHome.list.find(y => y.key === s);
      if (x) stock.setImage("cat_" + x.imgKey, d);
    }
  }), seriesHome.none.length > 0 && React.createElement("div", {
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
  }, "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E01\u0E25\u0E38\u0E48\u0E21\u0E23\u0E38\u0E48\u0E19"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, seriesHome.none.length.toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), isMobile ? React.createElement(StockCardList, {
    rows: rowsOf(seriesHome.none),
    imgs: imgs,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }) : React.createElement(StockGrid, {
    rows: rowsOf(seriesHome.none),
    imgs: imgs,
    lowState: lowState,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }))) : brandHome ? React.createElement(React.Fragment, null, React.createElement(CatBrowser, {
    list: brandHome.list,
    count: brandHome.count,
    low: brandHome.low,
    imgs: brandHome.list.reduce((m, b) => {
      m["cat_" + b.key] = b.img;
      return m;
    }, {}),
    title: (SF.STOCK_CAT_BY[sub !== "all" ? sub : cat] || {}).th || "",
    hint: brandHome.list.length + " ยี่ห้อ · " + filtered.length.toLocaleString() + " รายการ",
    allLabel: "\u0E14\u0E39\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E19\u0E35\u0E49",
    onPick: b => setBrand(b),
    onAll: () => setBrowse(false),
    tools: viewBtn(true),
    onBack: goBack,
    onSetImage: (b, d) => {
      const x = brandHome.list.find(y => y.key === b);
      if (x) stock.setImage("cat_" + x.imgKey, d);
    }
  }), brandHome.none.length > 0 && React.createElement("div", {
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
  }, "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, brandHome.none.length.toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), isMobile ? React.createElement(StockCardList, {
    rows: rowsOf(brandHome.none),
    imgs: imgs,
    onOpen: setDetailItem,
    onEdit: it => setItemForm({
      item: it,
      isNew: false
    }),
    onRemove: stock.removeItem
  }) : React.createElement(StockGrid, {
    rows: rowsOf(brandHome.none),
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
      borderRadius: "var(--r-card)",
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
      borderBottom: "1px solid var(--divider)"
    }
  }, ["รายการอุปกรณ์", "ราคา/หน่วย", "คงเหลือ", "ขั้นต่ำ", "ที่จัดเก็บ", "จัดการ"].map((h, i) => React.createElement("th", {
    key: h,
    style: {
      padding: "12px 12px",
      fontSize: 10.5,
      fontWeight: 700,
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
        borderBottom: "1px solid var(--divider)",
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
        borderRadius: "var(--r-chip)",
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
        background: "var(--tint-red-bg)",
        border: "none",
        color: "var(--tint-red-tx2)",
        width: 28,
        height: 28,
        borderRadius: "var(--r-chip)",
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
    items: stock.items || [],
    imgs: imgs,
    onOpen: setDetailItem,
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
      boxShadow: "var(--shadow-modal)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--divider)",
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
    className: "x-close",
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32"
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
        background: "var(--surface2)",
        borderRadius: "var(--r-tile)"
      }
    }, React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: "var(--r-chip)",
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
      borderRadius: "var(--r-pill)",
      border: "none",
      background: active ? color + "16" : "var(--surface)",
      boxShadow: active ? "inset 0 0 0 1px " + color : "var(--shadow-sm)",
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
      borderRadius: "var(--r-pill)",
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
        border: "none",
        borderRadius: "var(--r-tile)",
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
        borderRadius: "var(--r-pill)",
        whiteSpace: "nowrap",
        flexShrink: 0
      }
    }, React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: "var(--r-pill)",
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
        borderTop: "1px solid var(--divider)",
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
        borderRadius: "var(--r-chip)",
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
        borderRadius: "var(--r-chip)",
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
        background: "var(--tint-red-bg)",
        border: "none",
        color: "var(--tint-red-tx2)",
        width: 44,
        height: 36,
        borderRadius: "var(--r-chip)",
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
      border: "none",
      boxShadow: open ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: "10px 13px",
      outline: "none",
      cursor: "pointer"
    }
  }, React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: "var(--r-pill)",
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
      borderRadius: "var(--r-pill)"
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
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-pop)",
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
        borderRadius: "var(--r-chip)",
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
        borderRadius: "var(--r-pill)",
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
        borderRadius: "var(--r-pill)"
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
      boxShadow: "var(--shadow-modal)"
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
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
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
      borderRadius: "var(--r-tile)",
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
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
function StkOptPairs({
  pairs,
  invNames,
  onChange,
  isMobile
}) {
  const list = Array.isArray(pairs) ? pairs : [];
  const setRow = (i, patch) => onChange(list.map((r, j) => j === i ? Object.assign({}, r, patch) : r));
  const add = () => onChange(list.concat([{
    inv: "",
    min: 0,
    max: 0,
    maxW: 0
  }]));
  const del = i => onChange(list.filter((r, j) => j !== i));
  const cell = Object.assign({}, inputStyle, {
    padding: "7px 9px",
    fontSize: 12
  });
  return React.createElement("div", {
    style: {
      marginTop: 11,
      borderTop: "1px dashed var(--border-strong)",
      paddingTop: 11
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E43\u0E0A\u0E49\u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E23\u0E38\u0E48\u0E19\u0E44\u0E2B\u0E19\u0E44\u0E14\u0E49\u0E1A\u0E49\u0E32\u0E07"), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D \xB7 \u0E41\u0E15\u0E48\u0E25\u0E30\u0E23\u0E38\u0E48\u0E19\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19"), React.createElement("button", {
    type: "button",
    onClick: add,
    style: {
      marginLeft: "auto",
      padding: "6px 11px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E38\u0E48\u0E19")), !list.length ? React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      padding: "10px 0"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48\u0E01\u0E31\u0E1A\u0E23\u0E38\u0E48\u0E19\u0E44\u0E2B\u0E19 \u2014 \u0E15\u0E2D\u0E19\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E27\u0E08") : list.map((r, i) => React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "2.2fr .8fr .8fr 1fr auto",
      gap: 8,
      marginBottom: 8,
      alignItems: "center"
    }
  }, React.createElement("select", {
    style: cell,
    value: r.inv || "",
    onChange: e => setRow(i, {
      inv: e.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2014"), (invNames || []).map(n => React.createElement("option", {
    key: n,
    value: n
  }, n)), r.inv && (invNames || []).indexOf(r.inv) < 0 && React.createElement("option", {
    value: r.inv
  }, r.inv, " (\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E41\u0E25\u0E49\u0E27)")), React.createElement("input", {
    type: "number",
    style: cell,
    value: r.min || "",
    placeholder: "\u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14",
    onChange: e => setRow(i, {
      min: parseInt(e.target.value) || 0
    })
  }), React.createElement("input", {
    type: "number",
    style: cell,
    value: r.max || "",
    placeholder: "\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    onChange: e => setRow(i, {
      max: parseInt(e.target.value) || 0
    })
  }), React.createElement("input", {
    type: "number",
    style: cell,
    value: r.maxW || "",
    placeholder: "W/\u0E2A\u0E15\u0E23\u0E34\u0E07",
    onChange: e => setRow(i, {
      maxW: parseInt(e.target.value) || 0
    })
  }), React.createElement("button", {
    type: "button",
    onClick: () => del(i),
    title: "\u0E25\u0E1A\u0E41\u0E16\u0E27\u0E19\u0E35\u0E49",
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 13,
    color: "#EF4444"
  })))), !!list.length && React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      lineHeight: 1.7
    }
  }, "\u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14/\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 = \u0E08\u0E33\u0E19\u0E27\u0E19", React.createElement("b", null, "\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21"), "\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 (\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07) \xB7 W/\u0E2A\u0E15\u0E23\u0E34\u0E07 = \u0E01\u0E33\u0E25\u0E31\u0E07 DC \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07\u0E15\u0E32\u0E21\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D"));
}
function StkAccPick({
  ids,
  self,
  items,
  onChange
}) {
  const SF = window.SF;
  const list = Array.isArray(ids) ? ids : [];
  const byId = {};
  (items || []).forEach(x => {
    if (x && x.id) byId[x.id] = x;
  });
  const lo = x => String(x || "").toLowerCase().trim();
  const br = lo(self.brand);
  const cand = (items || []).filter(x => x && x.id && x.name && x.id !== self.id && !(+x.invKw > 0) && list.indexOf(x.id) < 0);
  const same = br ? cand.filter(x => lo(x.brand) === br || lo(x.name).indexOf(br) !== -1) : [];
  const rest = cand.filter(x => same.indexOf(x) < 0);
  const nm = a => a.slice().sort((x, z) => String(x.name).localeCompare(String(z.name), "th"));
  const catTh = x => {
    const c = SF.STOCK_CAT_BY && SF.STOCK_CAT_BY[x.cat];
    return c ? c.th : "";
  };
  return React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: "var(--r-tile)"
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
    name: "link",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E04\u0E39\u0E48\u0E01\u0E31\u0E19", React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "\xB7 ", list.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), list.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 9
    }
  }, list.map(id => {
    const x = byId[id];
    return React.createElement("span", {
      key: id,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 6px 5px 10px",
        borderRadius: "var(--r-chip)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        fontSize: 11.5,
        fontWeight: 600,
        color: x ? "var(--text-1)" : "var(--text-3)"
      }
    }, x ? x.name : id + " (ไม่มีในคลังแล้ว)", React.createElement("button", {
      type: "button",
      title: "\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01",
      onClick: () => onChange(list.filter(k => k !== id)),
      style: {
        width: 20,
        height: 20,
        borderRadius: 99,
        border: "none",
        background: "var(--surface2)",
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 11,
      color: "var(--text-3)"
    })));
  })), React.createElement("select", {
    style: inputStyle,
    value: "",
    onChange: e => {
      if (e.target.value) onChange(list.concat([e.target.value]));
    }
  }, React.createElement("option", {
    value: ""
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07\u2026"), same.length > 0 && React.createElement("optgroup", {
    label: "ยี่ห้อ " + self.brand
  }, nm(same).map(x => React.createElement("option", {
    key: x.id,
    value: x.id
  }, x.name, catTh(x) ? " · " + catTh(x) : ""))), React.createElement("optgroup", {
    label: same.length ? "ยี่ห้ออื่น" : "ทั้งคลัง"
  }, nm(rest).map(x => React.createElement("option", {
    key: x.id,
    value: x.id
  }, x.name, catTh(x) ? " · " + catTh(x) : "")))));
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
  const invNames = (items || []).filter(x => SF.mainCatOf(x.cat) === "inverter" && x.name).map(x => x.name);
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
      boxShadow: "var(--shadow-modal)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 22px",
      borderBottom: "1px solid var(--divider)",
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
    className: "x-close",
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      color: "var(--tint-red-tx2)",
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
    label: "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E23\u0E38\u0E48\u0E19 (\u0E0B\u0E35\u0E23\u0E35\u0E2A\u0E4C)"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.series || "",
    onChange: e => set("series", e.target.value),
    placeholder: "CVS / EZC100H \u2014 \u0E43\u0E0A\u0E49\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E43\u0E15\u0E49\u0E22\u0E35\u0E48\u0E2B\u0E49\u0E2D"
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
  })), React.createElement(Field, {
    label: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 (\u0E1B\u0E35)"
  }, React.createElement("input", {
    type: "number",
    step: "0.5",
    style: inputStyle,
    value: f.warY || "",
    onChange: e => set("warY", parseFloat(e.target.value) || 0),
    placeholder: mainCat === "panel" ? "12 / 15" : "5 / 10"
  })), mainCat === "panel" && React.createElement(Field, {
    label: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E (\u0E1B\u0E35)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.warPerfY || "",
    onChange: e => set("warPerfY", parseFloat(e.target.value) || 0),
    placeholder: "25 / 30"
  })), React.createElement("div", {
    style: {
      gridColumn: mainCat === "panel" ? "1 / -1" : "auto"
    }
  }, React.createElement(Field, {
    label: "\u0E40\u0E07\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E02\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19"
  }, React.createElement("input", {
    style: inputStyle,
    value: f.warNote || "",
    onChange: e => set("warNote", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E02\u0E22\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19 10 \u0E1B\u0E35\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19 \xB7 \u0E40\u0E04\u0E25\u0E21\u0E1C\u0E48\u0E32\u0E19\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19"
  }))), React.createElement("div", {
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
      borderRadius: "var(--r-tile)"
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
    label: "\u0E41\u0E1C\u0E07\u0E2A\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32 (Bifacial)"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.bifacial === true ? "1" : f.bifacial === false ? "0" : "",
    onChange: e => set("bifacial", e.target.value === "" ? null : e.target.value === "1")
  }, React.createElement("option", {
    value: ""
  }, "\u0E14\u0E39\u0E08\u0E32\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E38\u0E48\u0E19"), React.createElement("option", {
    value: "1"
  }, "\u0E2A\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32"), React.createElement("option", {
    value: "0"
  }, "\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E14\u0E35\u0E22\u0E27"))), React.createElement(Field, {
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
  }, "\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E40\u0E1F\u0E23\u0E21 \u2192 \u0E40\u0E25\u0E37\u0E2D\u0E01 MID/END CLAMP KIT (30/35mm) \xB7 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07/\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27 \u2192 \u0E04\u0E33\u0E19\u0E27\u0E13\u0E23\u0E32\u0E07 + \u0E02\u0E19\u0E32\u0E14\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E1C\u0E31\u0E07 3 \u0E21\u0E34\u0E15\u0E34 \xB7 Wp \u2192 \u0E02\u0E19\u0E32\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 (kW) \xB7 Voc/Isc/Vmp/Imp \u2192 \u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 String + \u0E2A\u0E32\u0E22 DC \xB7 \u0E04\u0E48\u0E32\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 Voc \u2192 Voc \u0E15\u0E2D\u0E19\u0E2D\u0E32\u0E01\u0E32\u0E28\u0E40\u0E22\u0E47\u0E19 (\u0E15\u0E31\u0E27\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07) \xB7 Pmax + NOCT \u2192 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E15\u0E2D\u0E19\u0E41\u0E1C\u0E07\u0E23\u0E49\u0E2D\u0E19 \xB7 \u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E1B\u0E35\u0E41\u0E23\u0E01/\u0E1B\u0E35\u0E16\u0E31\u0E14\u0E44\u0E1B \u2192 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E15\u0E25\u0E2D\u0E14\u0E2D\u0E32\u0E22\u0E38\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E04\u0E37\u0E19\u0E17\u0E38\u0E19 \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E0B\u0E25\u0E25\u0E4C + \u0E0A\u0E19\u0E34\u0E14\u0E40\u0E0B\u0E25\u0E25\u0E4C \u2192 \u0E40\u0E2A\u0E49\u0E19 I-V \u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E04\u0E34\u0E14\u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E14\u0E42\u0E2D\u0E14\u0E1A\u0E32\u0E22\u0E1E\u0E32\u0E2A \xB7 \u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E01\u0E25\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E2D\u0E38\u0E15\u0E2A\u0E32\u0E2B\u0E01\u0E23\u0E23\u0E21")), SF.isOptimizerCat(f.cat) && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: "var(--r-tile)"
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
    color: "#0891B2"
  }), " \u0E2A\u0E40\u0E1B\u0E04\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21\u0E41\u0E1C\u0E07 (\u0E01\u0E23\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (W)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optW != null ? f.optW : "",
    onChange: e => set("optW", parseFloat(e.target.value) || 0),
    placeholder: "1100"
  })), React.createElement(Field, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optVinMax != null ? f.optVinMax : "",
    onChange: e => set("optVinMax", parseFloat(e.target.value) || 0),
    placeholder: "125"
  })), React.createElement(Field, {
    label: "Isc \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optIscMax != null ? f.optIscMax : "",
    onChange: e => set("optIscMax", parseFloat(e.target.value) || 0),
    placeholder: "20"
  })), React.createElement(Field, {
    label: "MPPT \u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optMpptMin != null ? f.optMpptMin : "",
    onChange: e => set("optMpptMin", parseFloat(e.target.value) || 0),
    placeholder: "12.5"
  })), React.createElement(Field, {
    label: "MPPT \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optMpptMax != null ? f.optMpptMax : "",
    onChange: e => set("optMpptMax", parseFloat(e.target.value) || 0),
    placeholder: "105"
  })), React.createElement(Field, {
    label: "\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D 1 \u0E15\u0E31\u0E27"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optPerPanel != null ? f.optPerPanel : "",
    onChange: e => set("optPerPanel", parseInt(e.target.value) || 0),
    placeholder: "1"
  })), React.createElement(Field, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (V)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optVoutMax != null ? f.optVoutMax : "",
    onChange: e => set("optVoutMax", parseFloat(e.target.value) || 0),
    placeholder: "80"
  })), React.createElement(Field, {
    label: "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14 (A)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optIoutMax != null ? f.optIoutMax : "",
    onChange: e => set("optIoutMax", parseFloat(e.target.value) || 0),
    placeholder: "22"
  })), React.createElement(Field, {
    label: "\u0E1B\u0E23\u0E30\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E20\u0E32\u0E1E (%)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optEff != null ? f.optEff : "",
    onChange: e => set("optEff", parseFloat(e.target.value) || 0),
    placeholder: "99.5"
  })), React.createElement(Field, {
    label: "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E2D\u0E19\u0E2A\u0E31\u0E48\u0E07\u0E1B\u0E34\u0E14 (V/\u0E15\u0E31\u0E27)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optVoff != null ? f.optVoff : "",
    onChange: e => set("optVoff", parseFloat(e.target.value) || 0),
    placeholder: "1"
  })), React.createElement(Field, {
    label: "\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 \u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optMinPerStr != null ? f.optMinPerStr : "",
    onChange: e => set("optMinPerStr", parseInt(e.target.value) || 0),
    placeholder: "\u0E08\u0E32\u0E01\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D"
  })), React.createElement(Field, {
    label: "\u0E15\u0E31\u0E27\u0E04\u0E38\u0E21\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.optMaxPerStr != null ? f.optMaxPerStr : "",
    onChange: e => set("optMaxPerStr", parseInt(e.target.value) || 0),
    placeholder: "\u0E08\u0E32\u0E01\u0E04\u0E39\u0E48\u0E21\u0E37\u0E2D"
  }))), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 9,
      lineHeight: 1.7
    }
  }, "\u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E15\u0E2D\u0E19\u0E2A\u0E31\u0E48\u0E07\u0E1B\u0E34\u0E14 \xD7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27\u0E43\u0E19\u0E2A\u0E15\u0E23\u0E34\u0E07 = \u0E41\u0E23\u0E07\u0E14\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E1A\u0E19\u0E2A\u0E32\u0E22\u0E15\u0E2D\u0E19\u0E01\u0E14\u0E2B\u0E22\u0E38\u0E14\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19 \u2014 \u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E19\u0E35\u0E49\u0E04\u0E37\u0E2D\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E14\u0E49\u0E32\u0E19\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E17\u0E35\u0E48\u0E42\u0E23\u0E07\u0E07\u0E32\u0E19\u0E2B\u0E25\u0E32\u0E22\u0E41\u0E2B\u0E48\u0E07\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E15\u0E34\u0E14"), React.createElement(StkOptPairs, {
    pairs: f.optPairs,
    invNames: invNames,
    onChange: v => set("optPairs", v),
    isMobile: isMobile
  })), mainCat === "inverter" && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: "var(--r-tile)"
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
  }, "\u0E02\u0E19\u0E32\u0E14\u0E15\u0E31\u0E27\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07 (\u0E43\u0E0A\u0E49\u0E27\u0E32\u0E14\u0E2B\u0E49\u0E2D\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C 3D \xB7 \u0E14\u0E39\u0E08\u0E32\u0E01\u0E14\u0E32\u0E15\u0E49\u0E32\u0E0A\u0E35\u0E15)"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
      gap: 12
    }
  }, React.createElement(Field, {
    label: "\u0E01\u0E27\u0E49\u0E32\u0E07 (\u0E21\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invDimW || "",
    onChange: e => set("invDimW", parseFloat(e.target.value) || 0),
    placeholder: "640"
  })), React.createElement(Field, {
    label: "\u0E2A\u0E39\u0E07 (\u0E21\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invDimH || "",
    onChange: e => set("invDimH", parseFloat(e.target.value) || 0),
    placeholder: "530"
  })), React.createElement(Field, {
    label: "\u0E25\u0E36\u0E01 (\u0E21\u0E21.)"
  }, React.createElement("input", {
    type: "number",
    style: inputStyle,
    value: f.invDimD || "",
    onChange: e => set("invDimD", parseFloat(e.target.value) || 0),
    placeholder: "270"
  })), React.createElement(Field, {
    label: "\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, React.createElement("select", {
    style: inputStyle,
    value: f.invMount || "",
    onChange: e => set("invMount", e.target.value)
  }, React.createElement("option", {
    value: ""
  }, "\u0E15\u0E34\u0E14\u0E1C\u0E19\u0E31\u0E07 / \u0E23\u0E32\u0E07"), React.createElement("option", {
    value: "floor"
  }, "\u0E15\u0E31\u0E49\u0E07\u0E1E\u0E37\u0E49\u0E19 (\u0E15\u0E39\u0E49)"))))), (f.invType === "string" || f.invType === "hybrid") && React.createElement("div", {
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
  }, "\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E19 String/Hybrid \u2192 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E16\u0E2D\u0E14 BOQ \u0E44\u0E14\u0E49 \u0E04\u0E34\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27 = \u0E1B\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19(\u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E23\u0E27\u0E21 \xF7 MAX PV \u0E15\u0E48\u0E2D\u0E15\u0E31\u0E27) \xB7 MAX PV = \u0E01\u0E33\u0E25\u0E31\u0E07\u0E41\u0E1C\u0E07\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E17\u0E35\u0E48\u0E43\u0E2A\u0E48\u0E44\u0E14\u0E49 \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E0A\u0E48\u0E2D\u0E07 MPPT \xD7 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15\u0E15\u0E48\u0E2D\u0E0A\u0E48\u0E2D\u0E07 = \u0E2A\u0E15\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E35\u0E22\u0E1A\u0E44\u0E14\u0E49\u0E17\u0E31\u0E49\u0E07\u0E15\u0E31\u0E27 (\u0E40\u0E0A\u0E48\u0E19 2 \u0E0A\u0E48\u0E2D\u0E07 \xD7 2 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15 = 4 \u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 \u0E44\u0E21\u0E48\u0E01\u0E23\u0E2D\u0E01\u0E16\u0E37\u0E2D\u0E27\u0E48\u0E32 2 \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15/\u0E0A\u0E48\u0E2D\u0E07) \xB7 \u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01 (A) = \u0E43\u0E0A\u0E49\u0E04\u0E33\u0E19\u0E27\u0E13 RCBO \u0E41\u0E25\u0E30\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22 AC \u0E08\u0E38\u0E14 INVERTER-MCB_SOLAR / MCB_SOLAR-MDB (\xD71.25) \xB7 \u0E0A\u0E48\u0E27\u0E07 MPPT/Voc \u0E41\u0E1C\u0E07 \u2192 \u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E01\u0E23\u0E21 + \u0E2A\u0E32\u0E22 DC")), (mainCat === "inverter" && +f.invKw > 0 || f.elecType === "MCCB") && React.createElement(StkAccPick, {
    ids: f.accIds,
    self: f,
    items: items,
    onChange: v => set("accIds", v)
  }), mainCat === "electrical" && React.createElement("div", {
    style: {
      gridColumn: "1 / -1",
      marginTop: 2,
      padding: 14,
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: "var(--r-tile)"
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
      borderRadius: "var(--r-tile)"
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
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
const COND_DEF_ROWS = [{
  grp: "IMC",
  key: "clamp",
  th: "แคล้มประกับ"
}, {
  grp: "IMC",
  key: "bushing",
  th: "บุชชิ่ง/ล็อกนัท"
}, {
  grp: "IMC",
  key: "cchannel",
  th: "รางซี"
}, {
  grp: "IMC",
  key: "connector",
  th: "คอนเนคเตอร์"
}, {
  grp: "IMC",
  key: "coupling",
  th: "คุปปิ้ง"
}, {
  grp: "uPVC",
  key: "upStraight",
  th: "ข้อต่อตรง",
  auto: "จำนวนท่อน + 4"
}, {
  grp: "uPVC",
  key: "upClamp",
  th: "แคลมป์ก้ามปู",
  auto: "ทุก 60 ซม."
}, {
  grp: "uPVC",
  key: "upConnector",
  th: "คอนเน็ตเตอร์ uPVC",
  auto: "8 + แบต/สำรอง + 3 ต่อ PULL BOX uPVC"
}];
function ConduitDefaultsEditor({
  condStore
}) {
  const FIX = (window.BOQ || {}).CONDUIT_SPARE_FIXED || {};
  const RULE_ROWS = (window.BOQ || {}).IMC_RULE || [];
  const saved = condStore && condStore.val || {
    rule: {},
    per: {},
    spare: {}
  };
  const [draft, setDraft] = React.useState(null);
  const edit = !!draft;
  const view = draft || saved;
  const rule = view.rule || {},
    per = view.per || {},
    spare = view.spare || {};
  const set = (kind, k, v) => setDraft(p => {
    const d = p || {
      rule: {},
      per: {},
      spare: {}
    };
    const o = Object.assign({}, d[kind]);
    if (v === "" || v === null || v === undefined) delete o[k];else o[k] = String(v);
    const next = Object.assign({}, d);
    next[kind] = o;
    return next;
  });
  const startEdit = () => setDraft({
    rule: Object.assign({}, saved.rule),
    per: Object.assign({}, saved.per),
    spare: Object.assign({}, saved.spare)
  });
  const nDirty = ["rule", "per", "spare"].reduce((sum, kind) => {
    const a = saved[kind] || {},
      b = (draft || {})[kind] || {};
    return sum + Object.keys(Object.assign({}, a, b)).filter(k => String(a[k] != null ? a[k] : "") !== String(b[k] != null ? b[k] : "")).length;
  }, 0);
  const save = () => {
    if (!draft || !condStore) {
      setDraft(null);
      return;
    }
    ["rule", "per", "spare"].forEach(kind => {
      const a = saved[kind] || {},
        b = draft[kind] || {};
      Object.keys(Object.assign({}, a, b)).forEach(k => {
        const av = String(a[k] != null ? a[k] : ""),
          bv = String(b[k] != null ? b[k] : "");
        if (av !== bv) condStore.setCell(kind, k, bv);
      });
    });
    setDraft(null);
  };
  const cancel = () => {
    if (!nDirty) {
      setDraft(null);
      return;
    }
    window.askConfirm({
      title: "ทิ้งที่แก้ไว้?",
      body: "ค่าที่แก้ไว้ " + nDirty + " ช่อง จะไม่ถูกบันทึก",
      ok: "ทิ้ง",
      danger: true
    }).then(ok => {
      if (ok) setDraft(null);
    });
  };
  const nEdited = COND_DEF_ROWS.filter(r => (saved.per || {})[r.key] != null || (saved.spare || {})[r.key] != null).length + ((saved.spare || {}).tray != null && (saved.spare || {}).tray !== "" ? 1 : 0) + RULE_ROWS.filter(r => (saved.rule || {})[r.key] != null && (saved.rule || {})[r.key] !== "").length;
  const cell = {
    padding: "7px 9px",
    borderBottom: "1px solid var(--divider)",
    fontSize: 12.5
  };
  const numBase = {
    background: "var(--surface2)",
    boxShadow: "var(--shadow-sm)",
    color: "var(--text-1)",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "7px 9px",
    borderRadius: "var(--r-chip)",
    outline: "none",
    width: "100%",
    textAlign: "right"
  };
  const num = edit ? numBase : Object.assign({}, numBase, {
    background: "transparent",
    borderColor: "transparent",
    color: "var(--text-2)"
  });
  const btn = on => ({
    padding: "7px 14px",
    borderRadius: "var(--r-tile)",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    background: on ? "var(--primary)" : "var(--surface2)",
    color: on ? "#fff" : "var(--text-2)",
    boxShadow: on ? "none" : "var(--shadow-sm)"
  });
  const bar = React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, edit ? React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: save,
    style: btn(true)
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01", nDirty ? " (" + nDirty + ")" : ""), React.createElement("button", {
    onClick: cancel,
    style: btn(false)
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, nDirty ? "แก้ไว้ " + nDirty + " ช่อง ยังไม่ได้บันทึก" : "กำลังแก้ไข")) : React.createElement("button", {
    onClick: startEdit,
    style: btn(false)
  }, "\u0E41\u0E01\u0E49\u0E44\u0E02"));
  const row = (r, i) => {
    const on = per[r.key] != null && per[r.key] !== "";
    return React.createElement("tr", {
      key: r.key,
      style: {
        background: i % 2 ? "var(--surface2)" : "transparent"
      }
    }, React.createElement("td", {
      style: Object.assign({}, cell, {
        fontWeight: 600
      })
    }, r.th, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginTop: 2
      }
    }, on ? "แทนกฎอัตโนมัติ" : "คิดจาก " + r.auto)), React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 120
      })
    }, React.createElement("input", {
      type: "number",
      min: 0,
      step: "any",
      placeholder: "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
      style: num,
      disabled: !edit,
      value: on ? per[r.key] : "",
      onChange: e => set("per", r.key, e.target.value)
    })), React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 100
      })
    }, React.createElement("input", {
      type: "number",
      placeholder: String(FIX[r.key] != null ? FIX[r.key] : 10),
      style: num,
      disabled: !edit,
      value: spare[r.key] != null ? spare[r.key] : "",
      onChange: e => set("spare", r.key, e.target.value)
    })));
  };
  const accSpan = {};
  RULE_ROWS.forEach(r => {
    accSpan[r.acc] = (accSpan[r.acc] || 0) + 1;
  });
  const ruleTable = React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: "9px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      background: "var(--surface2)"
    }
  }, "\u0E01\u0E0E\u0E04\u0E34\u0E14\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u0E17\u0E48\u0E2D IMC", React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "var(--text-3)",
      marginLeft: 6
    }
  }, "\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A \xB7 \u0E43\u0E1A\u0E17\u0E35\u0E48\u0E16\u0E2D\u0E14\u0E44\u0E27\u0E49\u0E41\u0E25\u0E49\u0E27\u0E44\u0E21\u0E48\u0E02\u0E22\u0E31\u0E1A\u0E15\u0E32\u0E21")), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      textAlign: "right"
    }
  }, React.createElement("th", {
    style: Object.assign({}, cell, {
      textAlign: "left",
      fontWeight: 700
    })
  }, "\u0E01\u0E0E"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700
    })
  }, "\u0E04\u0E48\u0E32"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700,
      textAlign: "left"
    })
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700
    })
  }, "% \u0E40\u0E1C\u0E37\u0E48\u0E2D"))), React.createElement("tbody", null, RULE_ROWS.map((r, i) => {
    const first = i === 0 || RULE_ROWS[i - 1].acc !== r.acc;
    return React.createElement("tr", {
      key: r.key,
      style: {
        background: i % 2 ? "var(--surface2)" : "transparent"
      }
    }, React.createElement("td", {
      style: Object.assign({}, cell, {
        fontWeight: 600
      })
    }, r.th, React.createElement("div", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginTop: 2
      }
    }, "\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19 ", r.def, " ", r.unit)), React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 120
      })
    }, React.createElement("input", {
      type: "number",
      min: r.min != null ? r.min : 0,
      step: "any",
      placeholder: String(r.def),
      style: num,
      disabled: !edit,
      value: rule[r.key] != null ? rule[r.key] : "",
      onChange: e => set("rule", r.key, e.target.value)
    })), React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 76,
        fontSize: 11,
        color: "var(--text-3)"
      })
    }, r.unit), first && React.createElement("td", {
      rowSpan: accSpan[r.acc],
      style: Object.assign({}, cell, {
        width: 100,
        verticalAlign: "middle"
      })
    }, React.createElement("input", {
      type: "number",
      placeholder: String(FIX[r.acc] != null ? FIX[r.acc] : 10),
      style: num,
      disabled: !edit,
      value: spare[r.acc] != null ? spare[r.acc] : "",
      onChange: e => set("spare", r.acc, e.target.value)
    })));
  }))));
  const table = grp => React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: "9px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      background: "var(--surface2)"
    }
  }, "\u0E17\u0E48\u0E2D ", grp), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      textAlign: "right"
    }
  }, React.createElement("th", {
    style: Object.assign({}, cell, {
      textAlign: "left",
      fontWeight: 700
    })
  }, "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700
    })
  }, "\u0E0A\u0E34\u0E49\u0E19/\u0E17\u0E48\u0E2D\u0E19"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700
    })
  }, "% \u0E40\u0E1C\u0E37\u0E48\u0E2D"))), React.createElement("tbody", null, COND_DEF_ROWS.filter(r => r.grp === grp).map(row))));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      maxWidth: 820
    }
  }, bar, ruleTable, table("uPVC"), React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: "9px 11px",
      fontSize: 12.5,
      fontWeight: 700,
      background: "var(--surface2)"
    }
  }, "\u0E23\u0E32\u0E07\u0E44\u0E1F (Wireway / Ladder / Perforated)"), React.createElement("div", {
    style: {
      padding: "10px 11px",
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 110px",
      gap: 12,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.55
    }
  }, "\u0E15\u0E31\u0E27\u0E23\u0E32\u0E07 = \u0E1B\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19\u0E15\u0E32\u0E21\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27/\u0E17\u0E48\u0E2D\u0E19 \xB7 \u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E15\u0E48\u0E2D = \u0E17\u0E38\u0E01\u0E23\u0E2D\u0E22\u0E15\u0E48\u0E2D +2 \xB7 \u0E02\u0E32\u0E25\u0E47\u0E2D\u0E01\u0E23\u0E32\u0E07\u0E44\u0E1F = \u0E17\u0E38\u0E01 1.5 \u0E21. \xB7 \u0E15\u0E31\u0E27\u0E22\u0E36\u0E14 2 \u0E15\u0E31\u0E27/\u0E02\u0E32", React.createElement("br", null), "\u0E23\u0E32\u0E07\u0E17\u0E35\u0E48\u0E01\u0E14 \u201C\u0E22\u0E36\u0E14\u0E1A\u0E19 Rail\u201D = T-BOLT KIT 2 \u0E0A\u0E38\u0E14/\u0E02\u0E32 + Rail \u0E23\u0E2D\u0E07\u0E43\u0E15\u0E49\u0E02\u0E32 1 \u0E0A\u0E34\u0E49\u0E19/\u0E02\u0E32 (\u0E22\u0E32\u0E27\u0E01\u0E27\u0E48\u0E32\u0E23\u0E32\u0E07\u0E02\u0E49\u0E32\u0E07\u0E25\u0E30 10 \u0E0B\u0E21.) \u0E16\u0E2D\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E48\u0E2D\u0E19\u0E40\u0E15\u0E47\u0E21\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48\u0E15\u0E31\u0E14\u0E41\u0E1A\u0E48\u0E07\u0E44\u0E14\u0E49 \xB7 \u0E44\u0E21\u0E48\u0E01\u0E14 = \u0E1E\u0E38\u0E4A\u0E01\u0E40\u0E2B\u0E25\u0E47\u0E01 2 \u0E15\u0E31\u0E27/\u0E02\u0E32", React.createElement("br", null), "\u0E23\u0E32\u0E07\u0E17\u0E35\u0E48\u0E01\u0E14 \u201C\u0E0A\u0E38\u0E1A HDG\u201D \u0E16\u0E2D\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E0A\u0E38\u0E1A\u0E41\u0E22\u0E01\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14 (\u0E15\u0E31\u0E27\u0E23\u0E32\u0E07 \xB7 \u0E02\u0E49\u0E2D\u0E15\u0E48\u0E2D \xB7 \u0E02\u0E32\u0E25\u0E47\u0E2D\u0E01) \u2014 \u0E1E\u0E38\u0E4A\u0E01 \u0E2A\u0E01\u0E23\u0E39 T-BOLT \u0E41\u0E25\u0E30 Rail \u0E43\u0E0A\u0E49\u0E02\u0E2D\u0E07\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E2D\u0E37\u0E48\u0E19"), React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      fontSize: 10.5,
      color: "var(--text-3)",
      fontWeight: 700
    }
  }, "% \u0E40\u0E1C\u0E37\u0E48\u0E2D \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A", React.createElement("input", {
    type: "number",
    disabled: !edit,
    style: num,
    placeholder: "10",
    value: spare.tray != null ? spare.tray : "",
    onChange: e => set("spare", "tray", e.target.value)
  })))), React.createElement("div", null, React.createElement("button", {
    onClick: () => {
      window.askConfirm({
        title: "คืนค่าตั้งต้นอุปกรณ์ท่อร้อยสาย?",
        body: "ค่าที่ตั้งไว้ " + nEdited + " รายการ จะกลับไปใช้กฎ ค่าอัตโนมัติ และ % เผื่อเดิมของระบบ",
        ok: "คืนค่าตั้งต้น"
      }).then(ok => {
        if (ok && condStore) condStore.reset();
      });
    },
    disabled: !nEdited || edit,
    style: {
      padding: "8px 14px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      color: nEdited ? "var(--text-2)" : "var(--text-3)",
      fontSize: 12.5,
      fontWeight: 600,
      cursor: nEdited ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", nEdited ? " (" + nEdited + ")" : "")));
}
const OM_TIER_KINDS = [{
  key: "clean",
  th: "ราคาล้างแผง",
  unit: "฿/ครั้ง",
  color: "#0EA5E9",
  defKey: "OM_CLEAN_DEF",
  curKey: "OM_CLEAN_TIERS"
}, {
  key: "svc",
  th: "งาน O&M ตรวจ/บำรุงรักษาระบบ",
  unit: "฿/ปี",
  color: "#10B981",
  defKey: "OM_SVC_DEF",
  curKey: "OM_SVC_TIERS"
}];
function OmTierTable({
  kind,
  saved,
  onSave
}) {
  const BOQ = window.BOQ || {};
  const def = BOQ[kind.defKey] || [];
  const cur = BOQ.omTierNorm && BOQ.omTierNorm(saved) || def;
  const custom = !!(BOQ.omTierNorm && BOQ.omTierNorm(saved));
  const [draft, setDraft] = React.useState(null);
  const rows = draft || cur.map(r => [String(r[0]), String(r[1])]);
  const edit = !!draft;
  const setCell = (i, j, v) => setDraft(p => p.map((r, k) => k === i ? j ? [r[0], v] : [v, r[1]] : r));
  const save = () => {
    const n = BOQ.omTierNorm ? BOQ.omTierNorm(draft) : null;
    if (!n) {
      window.askConfirm({
        title: "ตารางว่าง",
        body: "ต้องมีอย่างน้อยหนึ่งแถวที่กรอกขนาดและราคา",
        ok: "ตกลง",
        danger: false
      });
      return;
    }
    onSave(n);
    setDraft(null);
  };
  const cell = {
    padding: "7px 10px",
    borderBottom: "1px solid var(--divider)",
    fontSize: 12.5
  };
  const inp = {
    background: "var(--surface2)",
    boxShadow: "var(--shadow-sm)",
    color: "var(--text-1)",
    border: "none",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "6px 9px",
    borderRadius: "var(--r-chip)",
    outline: "none",
    width: "100%",
    textAlign: "right"
  };
  const btn = on => ({
    padding: "6px 13px",
    borderRadius: "var(--r-tile)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    background: on ? "var(--primary)" : "var(--surface2)",
    color: on ? "#fff" : "var(--text-2)",
    boxShadow: on ? "none" : "var(--shadow-sm)"
  });
  const last = cur[cur.length - 1];
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--surface2)",
      flexWrap: "wrap"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "var(--r-pill)",
      background: kind.color
    }
  }), React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, kind.th), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, kind.unit, custom ? " · แก้จากค่าตั้งต้นแล้ว" : ""), React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 6
    }
  }, edit ? React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: save,
    style: btn(true)
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), React.createElement("button", {
    onClick: () => setDraft(null),
    style: btn(false)
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setDraft(cur.map(r => [String(r[0]), String(r[1])])),
    style: btn(false)
  }, "\u0E41\u0E01\u0E49\u0E44\u0E02"), custom && React.createElement("button", {
    style: btn(false),
    onClick: () => window.askConfirm({
      title: "คืนค่าตั้งต้น " + kind.th + "?",
      ok: "คืนค่าตั้งต้น"
    }).then(ok => {
      if (ok) onSave(null);
    })
  }, "\u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19")))), React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, React.createElement("thead", null, React.createElement("tr", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      textAlign: "right"
    }
  }, React.createElement("th", {
    style: Object.assign({}, cell, {
      textAlign: "left",
      fontWeight: 700
    })
  }, "\u0E02\u0E19\u0E32\u0E14\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700
    })
  }, "\u0E23\u0E32\u0E04\u0E32 (", kind.unit, ")"), React.createElement("th", {
    style: Object.assign({}, cell, {
      fontWeight: 700
    })
  }, "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 \u0E3F/kWp"), edit && React.createElement("th", {
    style: cell
  }))), React.createElement("tbody", null, rows.map((r, i) => {
    const prev = i ? +rows[i - 1][0] : 0;
    const rate = +r[0] > 0 ? Math.round(+r[1] / +r[0]) : 0;
    return React.createElement("tr", {
      key: i,
      style: {
        background: i % 2 ? "var(--surface2)" : "transparent"
      }
    }, React.createElement("td", {
      style: Object.assign({}, cell, {
        fontWeight: 600
      })
    }, edit ? React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19", React.createElement("input", {
      type: "number",
      min: 0,
      step: "any",
      style: Object.assign({}, inp, {
        width: 90
      }),
      value: r[0],
      onChange: e => setCell(i, 0, e.target.value)
    }), " kWp") : React.createElement("span", null, prev ? "" : "ไม่เกิน ", (+r[0]).toLocaleString(), " kWp")), React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 140,
        textAlign: "right"
      })
    }, edit ? React.createElement("input", {
      type: "number",
      min: 0,
      step: "any",
      style: inp,
      value: r[1],
      onChange: e => setCell(i, 1, e.target.value)
    }) : React.createElement("b", {
      style: {
        fontSize: 13.5
      }
    }, "\u0E3F", (+r[1]).toLocaleString())), React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 100,
        textAlign: "right",
        color: "var(--text-3)"
      })
    }, rate ? rate.toLocaleString() : "—"), edit && React.createElement("td", {
      style: Object.assign({}, cell, {
        width: 40
      })
    }, React.createElement("button", {
      onClick: () => setDraft(p => p.filter((x, k) => k !== i)),
      title: "\u0E25\u0E1A\u0E41\u0E16\u0E27",
      style: {
        background: "var(--tint-red-bg)",
        border: "none",
        color: "var(--tint-red-tx2)",
        width: 26,
        height: 26,
        borderRadius: "var(--r-chip)",
        cursor: "pointer"
      }
    }, "\u2715")));
  }), !edit && last && React.createElement("tr", null, React.createElement("td", {
    colSpan: 3,
    style: Object.assign({}, cell, {
      fontSize: 11.5,
      color: "var(--text-3)",
      borderBottom: "none"
    })
  }, "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E2A\u0E2D\u0E07\u0E41\u0E16\u0E27\u0E04\u0E34\u0E14\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E15\u0E32\u0E21\u0E2A\u0E31\u0E14\u0E2A\u0E48\u0E27\u0E19", cur.length > 1 && (() => {
    const a = cur[cur.length - 2],
      b = last,
      m = Math.round((+a[0] + +b[0]) / 2);
    return " (เช่น " + m.toLocaleString() + " kWp = ฿" + window.BOQ.omTierPrice(cur, m).toLocaleString() + ")";
  })(), " \xB7 \u0E40\u0E01\u0E34\u0E19 ", (+last[0]).toLocaleString(), " kWp = kWp \xD7 \u0E3F", (Math.round(last[1] / last[0] * 100) / 100).toLocaleString(), " \xB7 \u0E1B\u0E31\u0E14\u0E02\u0E36\u0E49\u0E19\u0E17\u0E35\u0E25\u0E30 \u0E3F", ((window.BOQ.RULES || {}).omRound || 100).toLocaleString(), " (\u0E15\u0E31\u0E49\u0E07\u0E43\u0E19\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D \u0E40\u0E1C\u0E37\u0E48\u0E2D \xB7 \u0E01\u0E33\u0E44\u0E23 \xB7 O&M)")))), edit && React.createElement("div", {
    style: {
      padding: "8px 12px"
    }
  }, React.createElement("button", {
    onClick: () => setDraft(p => p.concat([["", ""]])),
    style: btn(false)
  }, "\uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E41\u0E16\u0E27")));
}
function OmTierEditor({
  omStore
}) {
  const BOQ = window.BOQ || {};
  const val = omStore && omStore.val || {};
  const [kw, setKw] = React.useState("10");
  const k = +kw || 0;
  const clean = BOQ.omTierPrice ? BOQ.omTierPrice(BOQ.OM_CLEAN_TIERS || [], k) : 0;
  const svc = BOQ.omTierPrice ? BOQ.omTierPrice(BOQ.OM_SVC_TIERS || [], k) : 0;
  const yr = ((BOQ.RULES || {}).omPerYear || 1) * clean + svc;
  const box = (label, v, hi) => React.createElement("div", {
    style: {
      background: "var(--surface2)",
      borderRadius: "var(--r-tile)",
      padding: "9px 12px",
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, label), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 18,
      fontWeight: 700,
      color: hi ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, "\u0E3F", v.toLocaleString()));
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      maxWidth: 820
    }
  }, React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 10
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, "\u0E25\u0E2D\u0E07\u0E04\u0E34\u0E14\u0E23\u0E32\u0E04\u0E32"), React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12.5,
      color: "var(--text-2)"
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A", React.createElement("input", {
    type: "number",
    min: 0,
    step: "any",
    value: kw,
    onChange: e => setKw(e.target.value),
    style: {
      width: 100,
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      border: "none",
      borderRadius: "var(--r-chip)",
      padding: "6px 9px",
      fontFamily: "inherit",
      fontSize: 13,
      textAlign: "right",
      color: "var(--text-1)",
      outline: "none"
    }
  }), " kWp"), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\u0E04\u0E48\u0E32\u0E10\u0E32\u0E19: \u0E41\u0E16\u0E21 ", (BOQ.RULES || {}).omYears, " \u0E1B\u0E35 \xB7 \u0E25\u0E49\u0E32\u0E07\u0E41\u0E1C\u0E07\u0E1B\u0E35\u0E25\u0E30 ", (BOQ.RULES || {}).omPerYear, " \u0E04\u0E23\u0E31\u0E49\u0E07 (\u0E41\u0E01\u0E49\u0E43\u0E19\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D \u0E40\u0E1C\u0E37\u0E48\u0E2D \xB7 \u0E01\u0E33\u0E44\u0E23 \xB7 O&M)")), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 8
    }
  }, box("ล้างแผง / ครั้ง", clean), box("งาน O&M / ปี", svc), box("ต่อปี (ลูกค้าต่อเอง)", yr, true), box("รวมในราคาติดตั้ง " + ((BOQ.RULES || {}).omYears || 2) + " ปี", yr * ((BOQ.RULES || {}).omYears || 2), true))), OM_TIER_KINDS.map(kd => React.createElement(OmTierTable, {
    key: kd.key,
    kind: kd,
    saved: val[kd.key],
    onSave: rows => omStore && omStore.save(kd.key, rows)
  })));
}
const BR_FIXED_SECS = [{
  k: "amp",
  grp: "ตาราง",
  th: "พิกัดสาย วสท.",
  sub: "ตารางพิกัดกระแสตามฉนวน × วิธีเดินสาย × ขนาด"
}, {
  k: "cond",
  grp: "ตาราง",
  th: "อุปกรณ์ท่อ / รางไฟ",
  sub: "กฎคิดจำนวนอุปกรณ์ IMC/uPVC · % เผื่อ"
}, {
  k: "om",
  grp: "ตาราง",
  th: "ราคา O&M · ล้างแผง",
  sub: "ตารางราคาตามขนาดระบบ (kWp)"
}];
function brStockNeeds() {
  const B = window.BOQ || {},
    T = B.RULES_T || {},
    H = T.home || {},
    P = T.proj || {};
  const out = [],
    seen = {};
  const add = (name, spec) => {
    if (!seen[name]) {
      seen[name] = 1;
      out.push(Object.assign({
        name: name
      }, spec));
    }
  };
  const both = k => [].concat(H[k] || [], P[k] || []);
  both("dcFuse").forEach(p => {
    p.a.forEach(a => add("DC FUSE " + a + "A " + p.v + "VDC", {
      elecType: "Fuse",
      amp: a
    }));
    if (p.h) add("DC FUSE HOLDER " + p.h, {
      elecType: "Fuse holder"
    });
  });
  [["dcSpd2", "dc2"], ["dcSpd12", "dc12"], ["acSpd2", "ac2"], ["acSpd12", "ac12"]].forEach(([k, kind]) => both(k).forEach(r => r.a.forEach(a => add(B.spdName(kind, {
    v: r.v,
    p: r.p,
    a: a
  }), {
    elecType: "SPD",
    poles: r.p
  }))));
  (H.dcMcb || []).forEach(p => p.a.forEach(a => add("DC MCB " + a + "A " + (p.p || "2P") + " " + p.v + "VDC", {
    elecType: "MCB",
    poles: p.p || "2P",
    amp: a
  })));
  (H.mcbHome2P || []).forEach(a => add("MCB 2P " + a + "A", {
    elecType: "MCB",
    poles: "2P",
    amp: a
  }));
  (H.mcbHome3P || []).forEach(a => add("MCB 3P " + a + "A", {
    elecType: "MCB",
    poles: "3P",
    amp: a
  }));
  (H.rccb2P || []).forEach(a => add("RCCB " + a + "A 2P " + (H.rcboMa || 100) + "mA", {
    elecType: "RCBO",
    poles: "2P",
    amp: a
  }));
  (H.rccb4P || []).forEach(a => add("RCCB " + a + "A 4P " + (H.rcboMa || 100) + "mA", {
    elecType: "RCBO",
    poles: "4P",
    amp: a
  }));
  [["mccbMain", "main"], ["mccbInv", "inv"]].forEach(([k, w]) => (P[k] || []).forEach(r => r.a.forEach(a => {
    if ((P[k] || []).find(q => q.a.indexOf(a) >= 0) === r) add(B.mccbName(a, w, w === "main" && a >= (P.gfLsigAt || 1000)), {
      elecType: "MCCB",
      poles: "3P",
      amp: a
    });
  })));
  (P.ctR || []).forEach(r => add("CT " + r + "/5A", {}));
  (P.zctD || []).forEach(d => add("ZCT Φ" + d + "mm", {}));
  return out;
}
function BrStockGap({
  stock
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const items = stock && stock.items || [];
  const mk = window.BOQ && window.BOQ.matKey || (x => String(x || "").trim());
  const have = {};
  items.forEach(s => {
    if (s.name) have[mk(s.name)] = 1;
    (s.aka || []).forEach(n => {
      if (n) have[mk(n)] = 1;
    });
  });
  const miss = brStockNeeds().filter(x => !have[mk(x.name)]);
  if (!stock || !stock.upsertItem || !miss.length) return null;
  const addAll = () => {
    const SF = window.SF || {};
    window.askConfirm({
      title: "เพิ่ม " + miss.length + " รายการลงคลัง?",
      body: "หมวดอุปกรณ์ไฟฟ้า · ราคา 0 · ไม่มียี่ห้อ/รุ่น — ไปกรอกราคาและแยกรุ่นต่อในหน้าคลัง",
      ok: "เพิ่มลงคลัง",
      icon: "plus"
    }).then(ok => {
      if (!ok) return;
      setBusy(true);
      let maxId = 0;
      items.forEach(it => {
        const n = parseInt(String(it.id || "").replace(/\D/g, ""), 10);
        if (!isNaN(n) && n > maxId) maxId = n;
      });
      const used = items.map(s => s.sku).filter(Boolean);
      miss.forEach(x => {
        maxId += 1;
        const sku = SF.genMatCode ? SF.genMatCode("electrical", items, used) : "";
        used.push(sku);
        const rec = {
          id: "IV-" + String(maxId).padStart(2, "0"),
          name: x.name,
          sku: sku,
          cat: "electrical",
          unit: "ตัว",
          qty: 0,
          min: 0,
          loc: "",
          price: 0
        };
        if (x.elecType) rec.elecType = x.elecType;
        if (x.poles) rec.poles = x.poles;
        if (x.amp) rec.amp = x.amp;
        stock.upsertItem(rec);
      });
      setBusy(false);
      setOpen(false);
    });
  };
  return React.createElement("div", {
    style: {
      marginBottom: 14,
      padding: "10px 14px",
      borderRadius: "var(--r-card)",
      background: "var(--tint-amber-bg, #FFF7E6)",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 16,
    color: "var(--tint-amber-tx)"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--tint-amber-tx)"
    }
  }, "\u0E02\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E02\u0E32\u0E22 ", miss.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "BOQ \u0E08\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E14\u0E49\u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E04\u0E32"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    className: "btn btn-sm btn-soft",
    onClick: () => setOpen(!open)
  }, open ? "ซ่อนรายการ" : "ดูรายการ"), React.createElement("button", {
    className: "btn btn-sm btn-primary",
    disabled: busy,
    onClick: addAll
  }, React.createElement(Icon, {
    name: "plus",
    size: 13,
    color: "#fff"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E04\u0E25\u0E31\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), open && React.createElement("div", {
    style: {
      marginTop: 8,
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, miss.map(x => React.createElement("span", {
    key: x.name,
    style: {
      fontSize: 11.5,
      padding: "3px 9px",
      borderRadius: "var(--r-pill)",
      background: "var(--surface)",
      color: "var(--text-2)"
    }
  }, x.name))));
}
function BoqRulesPage({
  ampStore,
  condStore,
  omStore,
  rulesStore,
  isMobile,
  stock
}) {
  const BOQ = window.BOQ || {};
  const secs = (BOQ.RULE_SECS || []).concat(BR_FIXED_SECS);
  const [sec, setSec] = React.useState(() => {
    try {
      return localStorage.getItem("br_sec") || "dcBoard";
    } catch (e) {
      return "board";
    }
  });
  const pick = k => {
    setSec(k);
    try {
      localStorage.setItem("br_sec", k);
    } catch (e) {}
  };
  const [type, setTypeS] = React.useState(() => {
    try {
      const t = localStorage.getItem("br_type");
      return t === "home" || t === "proj" ? t : "all";
    } catch (e) {
      return "all";
    }
  });
  const setType = t => {
    setTypeS(t);
    try {
      localStorage.setItem("br_type", t);
    } catch (e) {}
  };
  const saved = rulesStore && rulesStore.val || {};
  const nSet = k => (BOQ.RULE_DEFS || []).filter(d => d.sec === k && brRuleOn(d, type) && brChanged(d, saved, type)).length;
  const nRows = k => (BOQ.RULE_DEFS || []).filter(d => d.sec === k && brRuleOn(d, type)).length;
  const secsT = secs.filter(x => BR_FIXED_SECS.some(f => f.k === x.k) ? type === "all" : nRows(x.k) > 0);
  const cur = secsT.find(x => x.k === sec) || secsT[0];
  const typeBar = React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      display: "inline-flex",
      gap: 4,
      padding: 4,
      borderRadius: "var(--r-pill)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    }
  }, [["all", "ใช้ร่วม", "link"], ["home", "งานบ้าน", "home"], ["proj", "งานโครงการ", "building"]].map(([k, th, ic]) => React.createElement("button", {
    key: k,
    onClick: () => setType(k),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 16px",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      borderRadius: "var(--r-pill)",
      background: type === k ? "var(--surface)" : "transparent",
      boxShadow: type === k ? "var(--shadow-sm)" : "none",
      color: type === k ? "var(--primary-dark)" : "var(--text-3)"
    }
  }, React.createElement(Icon, {
    name: ic,
    size: 14,
    color: type === k ? "var(--primary-dark)" : "var(--text-3)"
  }), " ", th))), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, type === "all" ? "ค่าที่ใช้เหมือนกันทั้งงานบ้านและงานโครงการ" : "เฉพาะข้อที่" + (type === "home" ? "งานบ้าน" : "งานโครงการ") + "ต่างออกไป · ข้ออื่นใช้ค่าในแท็บใช้ร่วม"));
  const body = cur.k === "amp" ? React.createElement(AmpacityEditor, {
    ampStore: ampStore
  }) : cur.k === "cond" ? React.createElement(ConduitDefaultsEditor, {
    condStore: condStore
  }) : cur.k === "om" ? React.createElement(OmTierEditor, {
    omStore: omStore
  }) : React.createElement(BoqRuleSec, {
    key: type + cur.k,
    sec: cur,
    rulesStore: rulesStore,
    type: type
  });
  const fixed = cur.k === "amp" || cur.k === "cond" || cur.k === "om";
  if (isMobile) return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement(BrStockGap, {
    stock: stock
  }), !fixed && typeBar, React.createElement(Dropdown, {
    value: cur.k,
    onChange: pick,
    options: secsT.map(x => ({
      value: x.k,
      group: x.grp,
      label: x.th + (nSet(x.k) ? " · แก้แล้ว " + nSet(x.k) : "")
    }))
  }), body);
  return React.createElement("div", null, React.createElement(BrStockGap, {
    stock: stock
  }), typeBar, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "250px minmax(0,1fr)",
      gap: 18,
      alignItems: "start"
    }
  }, React.createElement("nav", {
    style: {
      position: "sticky",
      top: 12,
      background: "var(--surface)",
      boxShadow: "var(--shadow-card)",
      borderRadius: "var(--r-card)",
      padding: 8,
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, secsT.map((x, i) => {
    const on = x.k === cur.k,
      n = nSet(x.k);
    return React.createElement(React.Fragment, {
      key: x.k
    }, x.grp && (i === 0 || secsT[i - 1].grp !== x.grp) && React.createElement("div", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-3)",
        padding: (i ? "10px" : "4px") + " 10px 4px"
      }
    }, x.grp), React.createElement("button", {
      onClick: () => pick(x.k),
      style: {
        textAlign: "left",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: "9px 11px",
        borderRadius: "var(--r-tile)",
        background: on ? "var(--primary-soft)" : "transparent",
        color: on ? "var(--primary-dark)" : "var(--text-1)"
      }
    }, React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 700
      }
    }, React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, x.th), n > 0 && React.createElement("span", {
      title: "\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E41\u0E01\u0E49\u0E08\u0E32\u0E01\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19",
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        padding: "1px 7px",
        borderRadius: "var(--r-pill)",
        background: "var(--tint-amber-bg)",
        color: "var(--tint-amber-tx)"
      }
    }, n)), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "var(--text-3)",
        marginTop: 2,
        lineHeight: 1.4
      }
    }, x.sub)));
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, fixed && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginBottom: 10
    }
  }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19\u0E17\u0E31\u0E49\u0E07\u0E07\u0E32\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E41\u0E25\u0E30\u0E07\u0E32\u0E19\u0E42\u0E04\u0E23\u0E07\u0E01\u0E32\u0E23"), body)));
}
const brRuleOn = (d, type) => {
  const o = window.BOQ.ruleOnly(d);
  return type === "all" ? !o : o === type;
};
const brChanged = (d, saved, type) => {
  const B = window.BOQ,
    raw = B.ruleRaw(saved, d, type);
  if (raw == null || raw === "") return false;
  return B.ruleTxt(d, B.ruleVal(d, raw)) !== B.ruleTxt(d, d.def);
};
const brStockRow = d => d.type === "nums" || d.type === "pairs" || !!d.stock;
const BR_TYPE_G = {
  "ทุกงาน": 1,
  "งานบ้าน": 1,
  "งานโครงการ": 1
};
const brPath = d => d.key;
const brShared = d => !window.BOQ.ruleOnly(d);
const brClearSplit = (rulesStore, d) => ["home", "proj"].forEach(t => {
  const o = ((rulesStore.val || {})[t] || {})[d.key];
  if (o != null && o !== "") rulesStore.setCell(t + "/" + d.key, "");
});
function BrChips({
  list,
  unit,
  onChange,
  disabled,
  words
}) {
  const [t, setT] = React.useState("");
  const add = () => {
    const vs = t.split(/[,\s]+/).map(x => words ? x.trim() : +x).filter(x => words ? x : isFinite(x) && x > 0);
    setT("");
    if (vs.length) onChange(list.concat(vs));
  };
  return React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center"
    }
  }, list.map((x, i) => React.createElement("span", {
    key: x + "|" + i,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "5px 6px 5px 10px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      fontVariantNumeric: "tabular-nums"
    }
  }, x, unit ? React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      color: "var(--text-3)"
    }
  }, unit) : null, React.createElement("button", {
    type: "button",
    disabled: disabled || list.length < 2,
    onClick: () => onChange(list.filter((_, j) => j !== i)),
    title: "\u0E40\u0E2D\u0E32\u0E2D\u0E2D\u0E01",
    style: {
      border: "none",
      background: "transparent",
      padding: "0 2px",
      cursor: disabled || list.length < 2 ? "default" : "pointer",
      color: "var(--text-3)",
      opacity: disabled || list.length < 2 ? 0.3 : 1,
      display: "inline-flex"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 12,
    color: "var(--text-3)"
  })))), !disabled && React.createElement("input", {
    value: t,
    onChange: e => setT(e.target.value),
    onBlur: add,
    placeholder: "+ \u0E40\u0E1E\u0E34\u0E48\u0E21",
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        add();
      }
    },
    style: {
      width: 76,
      border: "none",
      outline: "none",
      fontFamily: "inherit",
      fontSize: 12.5,
      padding: "6px 9px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      color: "var(--text-1)"
    }
  }));
}
function BrPick({
  d,
  value,
  onChange,
  disabled
}) {
  const opts = d.stock.indexOf(value) >= 0 || !(value > 0) || d.labels ? d.stock : d.stock.concat([value]).sort((x, y) => x - y);
  return React.createElement("div", {
    style: {
      display: "inline-flex",
      flexWrap: "wrap",
      gap: 4,
      padding: 4,
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)"
    }
  }, opts.map(x => {
    const on = x === value;
    return React.createElement("button", {
      key: x,
      type: "button",
      disabled: disabled,
      onClick: () => onChange(x),
      style: {
        border: "none",
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        padding: "6px 14px",
        borderRadius: "var(--r-chip)",
        fontSize: 13,
        fontWeight: on ? 800 : 600,
        fontVariantNumeric: "tabular-nums",
        background: on ? "var(--surface)" : "transparent",
        boxShadow: on ? "var(--shadow-sm)" : "none",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, d.labels && d.labels[x] != null ? d.labels[x] : React.createElement(React.Fragment, null, x, React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 600,
        color: "var(--text-3)",
        marginLeft: 2
      }
    }, d.unit)));
  }));
}
function BrPairs({
  list,
  d,
  onChange,
  disabled
}) {
  const [nv, setNv] = React.useState("");
  const [np, setNp] = React.useState(d.poleDef || "");
  const sortL = L => L.sort((x, y) => x.v - y.v || String(x.p || "").localeCompare(String(y.p || "")));
  const same = (p, v, pole) => p.v === v && (!d.poles || p.p === pole);
  const addV = () => {
    const v = +String(nv).replace(/[^\d.]/g, "");
    setNv("");
    if (!(v > 0) || list.some(p => same(p, v, np))) return;
    const last = list[list.length - 1];
    onChange(sortL(list.concat([Object.assign({
      v: v
    }, d.poles ? {
      p: np
    } : {}, {
      a: last ? last.a.slice() : [10]
    })])));
  };
  const setPole = (i, pole) => {
    const r = list[i],
      hit = list.findIndex((q, j) => j !== i && same(q, r.v, pole));
    if (hit < 0) {
      onChange(sortL(list.map((q, j) => j === i ? Object.assign({}, q, {
        p: pole
      }) : q)));
      return;
    }
    onChange(sortL(list.filter((_, j) => j !== i).map(q => same(q, r.v, pole) ? Object.assign({}, q, {
      a: Array.from(new Set(q.a.concat(r.a))).sort((x, y) => x - y)
    }) : q)));
  };
  const poleSel = (val, on, w) => React.createElement("select", {
    value: val,
    disabled: disabled,
    onChange: e => on(e.target.value),
    title: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E02\u0E31\u0E49\u0E27",
    style: {
      width: w,
      border: "none",
      outline: "none",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      padding: "4px 6px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      color: "var(--text-1)",
      cursor: disabled ? "default" : "pointer"
    }
  }, d.poles.map(p => React.createElement("option", {
    key: p,
    value: p
  }, p)));
  const [narrow, setNarrow] = React.useState(() => window.matchMedia && window.matchMedia("(max-width: 860px)").matches);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia("(max-width: 860px)"),
      h = () => setNarrow(m.matches);
    m.addEventListener ? m.addEventListener("change", h) : m.addListener(h);
    return () => m.removeEventListener ? m.removeEventListener("change", h) : m.removeListener(h);
  }, []);
  const cols = ["104px"].concat(d.poles ? ["86px"] : [], ["minmax(0,1fr)"], d.holder ? ["150px"] : [], ["30px"]).join(" ");
  const head = {
    fontSize: 10.5,
    fontWeight: 700,
    color: "var(--text-3)",
    letterSpacing: 0.2
  };
  const lab = t => narrow ? React.createElement("div", {
    style: Object.assign({}, head, {
      marginBottom: 4
    })
  }, t) : null;
  const rowSt = i => narrow ? {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "10px 12px",
    borderTop: i ? "1px solid var(--divider)" : "none"
  } : {
    display: "grid",
    gridTemplateColumns: cols,
    gap: 12,
    alignItems: "center",
    padding: "9px 14px",
    borderTop: "1px solid var(--divider)"
  };
  const sizeTh = "ขนาดที่มีขาย (" + d.unitA + ")";
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden"
    }
  }, !narrow && React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: cols,
      gap: 12,
      padding: "8px 14px",
      background: "var(--surface2)"
    }
  }, React.createElement("span", {
    style: head
  }, d.vName || "แรงดัน", " (", d.unit, ")"), d.poles && React.createElement("span", {
    style: head
  }, "\u0E02\u0E31\u0E49\u0E27"), React.createElement("span", {
    style: head
  }, sizeTh), d.holder && React.createElement("span", {
    style: head
  }, d.holder), React.createElement("span", null)), list.map((p, i) => React.createElement("div", {
    key: p.v + "|" + (p.p || ""),
    style: rowSt(i)
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 17,
      fontWeight: 800,
      color: "var(--primary-dark)",
      fontVariantNumeric: "tabular-nums"
    }
  }, p.v.toLocaleString()), React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, d.unit), narrow && d.poles && React.createElement("span", {
    style: {
      marginLeft: 8
    }
  }, poleSel(p.p || d.poleDef, v => setPole(i, v), 74)), narrow && !disabled && list.length > 1 && React.createElement("button", {
    type: "button",
    title: "เอา" + (d.vName || "แรงดัน") + " " + p.v + " ออก",
    onClick: () => onChange(list.filter((_, j) => j !== i)),
    style: {
      marginLeft: "auto",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 4,
      display: "inline-flex"
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "var(--text-3)"
  }))), !narrow && d.poles && React.createElement("div", null, poleSel(p.p || d.poleDef, v => setPole(i, v), 74)), React.createElement("div", null, lab(sizeTh), React.createElement(BrChips, {
    list: p.a,
    unit: d.unitA.split(" ")[0],
    disabled: disabled,
    onChange: a => onChange(list.map((q, j) => j === i ? Object.assign({}, q, {
      a: a
    }) : q))
  })), d.holder && React.createElement("div", null, lab(d.holder), React.createElement("input", {
    value: p.h || "",
    disabled: disabled,
    placeholder: d.holderPh || "รุ่น เช่น SRD-30",
    onChange: e => {
      const h = e.target.value.replace(/[\[\]:;]/g, "");
      onChange(list.map((q, j) => j === i ? Object.assign({}, q, {
        h: h
      }) : q));
    },
    style: {
      width: "100%",
      boxSizing: "border-box",
      border: "none",
      outline: "none",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      padding: "7px 10px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-inset)",
      color: "var(--text-1)"
    }
  })), !narrow && React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, !disabled && list.length > 1 && React.createElement("button", {
    type: "button",
    title: "เอา" + (d.vName || "แรงดัน") + " " + p.v + " ออก",
    onClick: () => onChange(list.filter((_, j) => j !== i)),
    style: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 4,
      display: "inline-flex",
      borderRadius: 8
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "var(--text-3)"
  }))))), !disabled && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      padding: "9px 14px",
      borderTop: "1px solid var(--divider)",
      background: "var(--surface2)"
    }
  }, React.createElement("input", {
    value: nv,
    onChange: e => setNv(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") {
        e.preventDefault();
        addV();
      }
    },
    placeholder: (d.vName || "แรงดัน") + "ใหม่ (" + d.unit + ")",
    inputMode: "decimal",
    style: {
      width: 150,
      border: "none",
      outline: "none",
      fontFamily: "inherit",
      fontSize: 12.5,
      padding: "7px 10px",
      borderRadius: "var(--r-chip)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-inset)",
      color: "var(--text-1)"
    }
  }), d.poles && poleSel(np, setNp, 74), React.createElement("button", {
    type: "button",
    className: "btn btn-sm",
    onClick: addV,
    disabled: !nv
  }, React.createElement(Icon, {
    name: "plus",
    size: 12
  }), " ", d.poles ? "เพิ่มรุ่น" : "เพิ่ม" + (d.vName || "แรงดัน"))));
}
function BoqRuleSec({
  sec,
  rulesStore,
  type
}) {
  const BOQ = window.BOQ || {};
  const defs = (BOQ.RULE_DEFS || []).filter(d => d.sec === sec.k && brRuleOn(d, type));
  const stockRows = defs.filter(brStockRow),
    condRows = defs.filter(d => !brStockRow(d));
  const all = rulesStore && rulesStore.val || {};
  const saved = {};
  defs.forEach(d => {
    const r = BOQ.ruleRaw(all, d, type);
    if (r != null && r !== "") saved[d.key] = r;
  });
  const [draft, setDraft] = React.useState(null);
  React.useEffect(() => {
    setDraft(null);
  }, [sec.k]);
  const view = draft || saved;
  const ro = !rulesStore;
  const txt = d => BOQ.ruleTxt(d, d.def);
  const str = (o, k) => o[k] != null ? String(o[k]) : "";
  const dirty = defs.filter(d => str(saved, d.key) !== str(view, d.key));
  const nEdited = defs.filter(d => brChanged(d, all, type)).length;
  const set = (k, v) => setDraft(p => {
    const n = Object.assign({}, p || saved);
    if (v === "") delete n[k];else n[k] = v;
    return n;
  });
  const cur = d => BOQ.ruleVal(d, str(view, d.key));
  const isDef = d => BOQ.ruleTxt(d, cur(d)) === txt(d);
  const save = () => {
    dirty.forEach(d => {
      rulesStore.setCell(brPath(d, type), str(view, d.key).trim());
      if (brShared(d)) brClearSplit(rulesStore, d);
    });
    setDraft(null);
  };
  const resetAll = (rows, nm) => {
    rows = rows || defs;
    const n = rows.filter(d => brChanged(d, all, type)).length;
    return window.askConfirm({
      title: "คืนค่าตั้งต้น · " + (nm || sec.th) + "?",
      body: "ค่าที่ตั้งไว้ " + n + " ช่อง จะกลับไปใช้ค่าตั้งต้นของระบบ",
      ok: "คืนค่าตั้งต้น",
      danger: true
    }).then(ok => {
      if (ok) {
        setDraft(p => {
          if (!p) return null;
          const q = Object.assign({}, p);
          rows.forEach(d => {
            delete q[d.key];
            if (saved[d.key] != null) q[d.key] = saved[d.key];
          });
          return defs.some(d => str(saved, d.key) !== str(q, d.key)) ? q : null;
        });
        rows.forEach(d => {
          if (!brChanged(d, all, type)) return;
          if (brShared(d)) {
            const lg = (d.legacy || []).concat(d.legacyV ? [d.legacyV] : []).some(k => all[k] != null && all[k] !== "");
            rulesStore.setCell(d.key, lg ? txt(d) : "");
            brClearSplit(rulesStore, d);
            return;
          }
          const flat = !BOQ.ruleOnly(d) && (all[d.key] != null && all[d.key] !== "" || (d.legacy || []).some(k => all[k] != null && all[k] !== ""));
          rulesStore.setCell(brPath(d, type), flat ? txt(d) : "");
        });
      }
    });
  };
  const bad = d => {
    const v = str(view, d.key).trim();
    return !!v && !d.type && BOQ.ruleVal(d, v) === d.def && +v !== d.def;
  };
  const card = {
    background: "var(--surface)",
    boxShadow: "var(--shadow-card)",
    borderRadius: "var(--r-card)",
    padding: "14px 16px"
  };
  const blockHd = (ic, t, s, rows) => {
    const n = rows ? rows.filter(d => brChanged(d, all, type)).length : 0;
    return React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10
      }
    }, React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: "var(--r-chip)",
        background: "var(--primary-soft)",
        display: "grid",
        placeItems: "center",
        flex: "none"
      }
    }, React.createElement(Icon, {
      name: ic,
      size: 14,
      color: "var(--primary-dark)"
    })), React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 700
      }
    }, t), React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        flex: 1,
        minWidth: 0
      }
    }, s), n > 0 && !ro && React.createElement("button", {
      className: "btn btn-sm",
      onClick: () => resetAll(rows, sec.th + " · " + t)
    }, React.createElement(Icon, {
      name: "undo",
      size: 12
    }), " \u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19 (", n, ")"));
  };
  const resetBtn = d => !isDef(d) && !ro && React.createElement("button", {
    type: "button",
    title: "คืนค่าตั้งต้น " + txt(d),
    onClick: () => set(d.key, d.type ? txt(d) : String(d.def)),
    style: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 4,
      display: "inline-flex",
      borderRadius: "var(--r-chip)"
    }
  }, React.createElement(Icon, {
    name: "undo",
    size: 13,
    color: "var(--text-3)"
  }));
  const changedDot = d => !isDef(d) && React.createElement("span", {
    title: "\u0E15\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19",
    style: {
      width: 6,
      height: 6,
      borderRadius: 99,
      background: "var(--tint-amber-tx)",
      flex: "none"
    }
  });
  const gOf = x => x && x.g && !BR_TYPE_G[x.g] ? x.g : null;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      maxWidth: 860,
      paddingBottom: dirty.length ? 64 : 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, sec.th), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, sec.sub)), nEdited > 0 && !ro && React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => resetAll()
  }, React.createElement(Icon, {
    name: "undo",
    size: 12
  }), " \u0E04\u0E37\u0E19\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D (", nEdited, ")")), stockRows.length > 0 && React.createElement("div", {
    style: card
  }, blockHd("box", "ของที่มีขาย", "ระบบเลือกได้เฉพาะขนาดในนี้ · " + (stockRows.some(brShared) ? "ใช้ร่วมกันทั้งงานบ้านและงานโครงการ" : "เฉพาะ" + (type === "home" ? "งานบ้าน" : "งานโครงการ")), stockRows), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, stockRows.map((d, i) => React.createElement("div", {
    key: d.key,
    style: {
      padding: "12px 0",
      borderTop: i ? "1px solid var(--divider)" : "none"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, d.th), d.type === "pairs" && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, "\xB7 ", d.poles ? "แถวละแรงดัน + จำนวนขั้ว" : "แถวละ" + (d.vName || "แรงดัน"), " \u0E0A\u0E34\u0E1B = ", d.unitA, " \u0E17\u0E35\u0E48\u0E21\u0E35\u0E02\u0E2D\u0E07\u0E23\u0E38\u0E48\u0E19\u0E19\u0E31\u0E49\u0E19"), changedDot(d), React.createElement("span", {
    style: {
      flex: 1
    }
  }), resetBtn(d)), d.stock && !d.type ? React.createElement(BrPick, {
    d: d,
    value: +(str(view, d.key) || d.def),
    disabled: ro,
    onChange: x => set(d.key, String(x))
  }) : d.type === "pairs" ? React.createElement(BrPairs, {
    list: cur(d),
    d: d,
    disabled: ro,
    onChange: L => set(d.key, BOQ.ruleTxt(d, L))
  }) : React.createElement(BrChips, {
    list: cur(d),
    unit: d.unit,
    words: d.type === "words",
    disabled: ro,
    onChange: L => set(d.key, BOQ.ruleTxt(d, BOQ.ruleVal(d, L.join(", "))))
  }))))), condRows.length > 0 && React.createElement("div", {
    style: card
  }, blockHd("settings", "เงื่อนไขการเลือก", stockRows.length ? "ใช้เลือกจากของที่มีขายด้านบน" : "", condRows), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, condRows.map((d, i) => {
    const head = gOf(d) && (i === 0 || gOf(condRows[i - 1]) !== gOf(d));
    const v = str(view, d.key);
    return React.createElement(React.Fragment, {
      key: d.key
    }, head && React.createElement("div", {
      style: {
        padding: i ? "16px 0 4px" : "0 0 4px",
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--primary-dark)"
      }
    }, d.g), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "9px 0",
        borderTop: head ? "none" : i ? "1px solid var(--divider)" : "none"
      }
    }, React.createElement("div", {
      style: {
        flex: "1 1 260px",
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-1)"
      }
    }, d.th, changedDot(d)), React.createElement("div", {
      style: {
        fontSize: 11,
        color: bad(d) ? "var(--tint-red-tx)" : "var(--text-3)",
        marginTop: 2
      }
    }, bad(d) ? "ค่านี้ใช้ไม่ได้ — ระบบใช้ค่าตั้งต้น " : "ค่าตั้งต้น ", txt(d), d.type ? "" : " " + d.unit)), d.type ? React.createElement("textarea", {
      rows: 1,
      disabled: ro,
      value: v || txt(d),
      onChange: e => set(d.key, e.target.value),
      style: {
        flex: "1 1 300px",
        boxSizing: "border-box",
        border: "none",
        outline: "none",
        fontFamily: "inherit",
        fontSize: 13,
        padding: "8px 10px",
        borderRadius: "var(--r-chip)",
        background: "var(--surface2)",
        boxShadow: "var(--shadow-inset)",
        color: "var(--text-1)",
        resize: "vertical"
      }
    }) : React.createElement("label", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        width: 168,
        boxSizing: "border-box",
        padding: "0 10px 0 0",
        borderRadius: "var(--r-chip)",
        background: "var(--surface2)",
        boxShadow: bad(d) ? "var(--shadow-inset), 0 0 0 1.5px var(--tint-red-tx)" : "var(--shadow-inset)"
      }
    }, React.createElement("input", {
      type: "number",
      step: "any",
      disabled: ro,
      value: v !== "" ? v : String(d.def),
      onChange: e => set(d.key, e.target.value),
      style: {
        flex: 1,
        minWidth: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        fontFamily: "inherit",
        fontSize: 13.5,
        fontWeight: 700,
        padding: "8px 4px 8px 10px",
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
        color: "var(--text-1)"
      }
    }), React.createElement("span", {
      style: {
        fontSize: 11.5,
        color: "var(--text-3)",
        whiteSpace: "nowrap",
        maxWidth: 70,
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, d.unit)), React.createElement("span", {
      style: {
        width: 24,
        display: "inline-flex",
        justifyContent: "center"
      }
    }, resetBtn(d))));
  }))), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      lineHeight: 1.6
    }
  }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E15\u0E39\u0E49\u0E44\u0E1F \xB7 \u0E2A\u0E32\u0E22\u0E44\u0E1F \xB7 \u0E23\u0E32\u0E07\u0E44\u0E1F \xB7 \u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19 \xB7 \u0E02\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E1A 3D) \u0E04\u0E34\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E15\u0E32\u0E21\u0E04\u0E48\u0E32\u0E19\u0E35\u0E49\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E1A BOQ \xB7 \u0E04\u0E48\u0E32\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15/\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23 \u0E41\u0E25\u0E30 % \u0E40\u0E1C\u0E37\u0E48\u0E2D/\u0E01\u0E33\u0E44\u0E23 \u0E17\u0E35\u0E48\u0E43\u0E1A\u0E01\u0E23\u0E2D\u0E01\u0E44\u0E27\u0E49\u0E40\u0E2D\u0E07\u0E41\u0E25\u0E49\u0E27\u0E44\u0E21\u0E48\u0E02\u0E22\u0E31\u0E1A\u0E15\u0E32\u0E21"), dirty.length > 0 && React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 12,
      zIndex: 5,
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
      padding: "10px 14px",
      borderRadius: "var(--r-card)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-pop)"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: "var(--tint-amber-tx)"
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      flex: 1,
      minWidth: 0
    }
  }, "\u0E41\u0E01\u0E49\u0E44\u0E27\u0E49 ", dirty.length, " \u0E0A\u0E48\u0E2D\u0E07 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01", React.createElement("span", {
    style: {
      fontWeight: 500,
      color: "var(--text-3)"
    }
  }, " \xB7 ", dirty.map(d => d.th).slice(0, 3).join(" · "), dirty.length > 3 ? " …" : "")), React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => setDraft(null)
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    className: "btn btn-sm btn-pri",
    onClick: save
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")));
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
    const dv = (i, m, col, s) => {
      try {
        return def[i][m][col][s];
      } catch (e) {
        return undefined;
      }
    };
    let n = 0;
    Object.keys(ov).forEach(i => Object.keys(ov[i] || {}).forEach(m => Object.keys(ov[i][m] || {}).forEach(col => Object.keys(ov[i][m][col] || {}).forEach(s => {
      const v = +ov[i][m][col][s];
      if (v > 0 && v !== dv(i, m, col, s)) n++;
    }))));
    return n;
  }, [ov, def]);
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
    borderRadius: "var(--r-chip)",
    boxShadow: "var(--shadow-sm)",
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
    borderBottom: "1px solid var(--divider)"
  };
  return React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      padding: "12px 14px",
      background: "var(--tint-amber-bg)",
      border: "1px solid var(--tint-amber-bd)",
      borderRadius: "var(--r-tile)",
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
  }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E01\u0E23\u0E30\u0E41\u0E2A ", React.createElement("strong", null, "\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 \u0E27\u0E2A\u0E17."), " (\u0E15\u0E31\u0E27\u0E19\u0E33\u0E17\u0E2D\u0E07\u0E41\u0E14\u0E07 0.6/1 kV) \u2014 \u0E41\u0E22\u0E01\u0E15\u0E32\u0E21 ", React.createElement("strong", null, "\u0E01\u0E25\u0E38\u0E48\u0E21\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 \xD7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E15\u0E31\u0E27\u0E19\u0E33\u0E21\u0E35\u0E01\u0E23\u0E30\u0E41\u0E2A \xD7 \u0E41\u0E01\u0E19\u0E22\u0E48\u0E2D\u0E22"), React.createElement("br", null), "\u0E41\u0E01\u0E19\u0E22\u0E48\u0E2D\u0E22\u0E44\u0E21\u0E48\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E19\u0E17\u0E38\u0E01\u0E01\u0E25\u0E38\u0E48\u0E21: \u0E01\u0E25\u0E38\u0E48\u0E21 1,2,3,7 = ", React.createElement("strong", null, "\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27/\u0E2B\u0E25\u0E32\u0E22\u0E41\u0E01\u0E19"), " \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21 4 = ", React.createElement("strong", null, "\u0E41\u0E19\u0E27\u0E15\u0E31\u0E49\u0E07/\u0E41\u0E19\u0E27\u0E23\u0E32\u0E1A"), " (\u0E41\u0E01\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E25\u0E49\u0E27\u0E19) \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21 5,6 = ", React.createElement("strong", null, "\u0E23\u0E27\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27"), React.createElement("br", null), "\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07\u0E04\u0E23\u0E1A\u0E41\u0E25\u0E49\u0E27: ", React.createElement("strong", null, "PVC \u0E41\u0E25\u0E30 XLPE \xB7 \u0E17\u0E38\u0E01\u0E27\u0E34\u0E18\u0E35\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22 \xB7 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E17\u0E35\u0E48 1\u20137"), " (\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E08\u0E32\u0E07 = \u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A) \xB7 \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E0A\u0E48\u0E2D\u0E07\u0E44\u0E2B\u0E19 \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E0A\u0E49\u0E01\u0E31\u0E1A\u0E17\u0E38\u0E01\u0E07\u0E32\u0E19 \xB7 \u0E25\u0E1A\u0E2D\u0E2D\u0E01 = \u0E01\u0E25\u0E31\u0E1A\u0E44\u0E1B\u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E15\u0E49\u0E19")), borrowed ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 9,
      padding: "11px 14px",
      background: "var(--tint-ok-bg)",
      border: "1px solid var(--tint-ok-bd)",
      borderRadius: "var(--r-tile)",
      marginBottom: 14
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#1B9B75",
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
      borderRadius: "var(--r-tile)",
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
      borderRadius: "var(--r-pill)",
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
      borderRadius: "var(--r-card)",
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
      color: "var(--text-3)"
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
      borderBottom: "1px solid var(--divider)"
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
      borderRadius: "var(--r-tile)",
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
function stkLinkify(t) {
  return String(t || "").split(/(https?:\/\/[^\s]+)/g).map((x, i) => {
    if (!/^https?:\/\//.test(x)) return x;
    let host = x;
    try {
      host = new URL(x).hostname.replace(/^www\./, "");
    } catch (e) {}
    return React.createElement("a", {
      key: i,
      href: x,
      target: "_blank",
      rel: "noopener noreferrer",
      style: {
        color: "var(--primary-dark)",
        fontWeight: 700,
        textDecoration: "underline",
        textUnderlineOffset: 3
      }
    }, /\.pdf(\?|$)/i.test(x) ? "เปิดไฟล์ PDF" : host, " \u2197");
  });
}
function StkLinkTiles({
  title,
  list,
  imgs,
  onOpen
}) {
  if (!list.length) return null;
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      color: "var(--text-3)"
    }
  }, title), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
      gap: 8
    }
  }, list.map(x => React.createElement("button", {
    key: x.id,
    type: "button",
    onClick: () => onOpen && onOpen(x),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: 7,
      borderRadius: "var(--r-tile)",
      border: "none",
      textAlign: "left",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      cursor: onOpen ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: "var(--r-chip)",
      overflow: "hidden",
      background: "#fff",
      display: "grid",
      placeItems: "center"
    }
  }, imgs && imgs[x.id] ? React.createElement("img", {
    src: imgs[x.id],
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "contain"
    }
  }) : React.createElement(Icon, {
    name: "box",
    size: 16,
    color: "var(--text-3)"
  })), React.createElement("span", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-1)",
      lineHeight: 1.35,
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical"
    }
  }, x.name), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, +x.price > 0 ? "฿" + Number(x.price).toLocaleString("th-TH") : "ยังไม่มีราคา"))))));
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
  onAddSize,
  items,
  imgs,
  onOpen
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
  }, {
    k: "optW",
    th: "กำลังแผงสูงสุด (W)"
  }, {
    k: "optVinMax",
    th: "แรงดันเข้าสูงสุด (V)"
  }, {
    k: "optMpptMin",
    th: "MPPT ต่ำสุด (V)"
  }, {
    k: "optMpptMax",
    th: "MPPT สูงสุด (V)"
  }, {
    k: "optIscMax",
    th: "Isc สูงสุด (A)"
  }, {
    k: "optVoutMax",
    th: "แรงดันออกสูงสุด (V)"
  }, {
    k: "optIoutMax",
    th: "กระแสออกสูงสุด (A)"
  }, {
    k: "optEff",
    th: "ประสิทธิภาพ (%)"
  }, {
    k: "optVoff",
    th: "แรงดันตอนสั่งปิด (V/ตัว)"
  }, {
    k: "optPerPanel",
    th: "แผงต่อ 1 ตัว"
  }, {
    k: "optMinPerStr",
    th: "ตัวคุมต่อสตริง ต่ำสุด"
  }, {
    k: "optMaxPerStr",
    th: "ตัวคุมต่อสตริง สูงสุด"
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
  const warTxt = [+item.warY > 0 ? "รับประกัน " + +item.warY + " ปี" : "", +item.warPerfY > 0 ? "ประสิทธิภาพ " + +item.warPerfY + " ปี" : ""].filter(Boolean).join(" · ");
  const priceTxt = +item.price > 0 ? (+item.price).toLocaleString(undefined, {
    maximumFractionDigits: 2
  }) : null;
  const sectionLabel = {
    fontSize: 10.5,
    fontWeight: 800,
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
      borderBottom: "1px solid var(--divider)",
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
    className: "x-close",
    onClick: onClose,
    style: {
      flexShrink: 0,
      width: 32,
      height: 32,
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
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
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
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
      borderRadius: "var(--r-pill)",
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
      borderRadius: "var(--r-chip)",
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
  }, "\u0E23\u0E38\u0E48\u0E19 ", item.model), warTxt && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      alignSelf: "flex-start",
      padding: "7px 12px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement(Icon, {
    name: "shield",
    size: 15,
    color: "var(--primary-dark)"
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      lineHeight: 1.5
    }
  }, React.createElement("b", {
    style: {
      color: "var(--primary-dark)"
    }
  }, warTxt), (item.warNote || "").trim() && React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, item.warNote))), (item.desc || "").trim() && React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 13,
      color: "var(--text-2)",
      lineHeight: 1.7,
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere"
    }
  }, stkLinkify(item.desc)), React.createElement("div", {
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
        borderRadius: "var(--r-chip)",
        cursor: on ? "default" : "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        border: "none",
        boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "none",
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
      borderRadius: "var(--r-chip)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
        borderRadius: "var(--r-tile)",
        border: "none",
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
      borderRadius: "var(--r-tile)",
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
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)"
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
  }, item[f.k]))))), React.createElement(StkLinkTiles, {
    title: "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E04\u0E39\u0E48\u0E01\u0E31\u0E19",
    imgs: imgs,
    onOpen: onOpen,
    list: (item.accIds || []).map(id => (items || []).find(x => x && x.id === id)).filter(Boolean)
  }), (() => {
    const L = (items || []).filter(x => x && Array.isArray(x.accIds) && x.accIds.indexOf(item.id) !== -1);
    const mc = L.length && L.every(x => x.elecType === "MCCB");
    return React.createElement(StkLinkTiles, {
      title: mc ? "ใช้กับ MCCB รุ่น" : "ใช้คู่กับอินเวอร์เตอร์",
      imgs: imgs,
      onOpen: onOpen,
      list: L
    });
  })(), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      color: "var(--text-3)"
    }
  }, "DATA SHEET / \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23"), doc && doc.data ? React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "11px 13px",
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: "var(--r-chip)",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--tint-red-bg)",
      color: "var(--tint-red-tx2)",
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
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--tint-red-tx2)",
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
      borderRadius: "var(--r-tile)",
      border: "1px dashed var(--border-strong)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-tile)",
      marginRight: "auto",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderBottom: "1px solid var(--divider)",
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
      borderBottom: "1px solid var(--divider)",
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
      borderRadius: "var(--r-pill)",
      padding: "2px 9px"
    }
  }, r.g.brand), r.g.model && React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-pill)",
      padding: "2px 9px"
    }
  }, r.g.model))))), React.createElement("div", {
    style: {
      padding: "13px 20px",
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
    boxShadow: "var(--shadow-sm)"
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
const STK_INV_TYPE = {
  hybrid: "Hybrid",
  string: "On-grid",
  micro: "Micro"
};
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
        borderRadius: "var(--r-tile)",
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
        borderRadius: "var(--r-pill)",
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
        borderRadius: "var(--r-pill)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
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
    }, g ? baseLabel(it.name) : it.name), window.SF.mainCatOf(it.cat) === "inverter" && (it.invType || +it.invPhase > 0) && React.createElement("div", {
      style: {
        display: "flex",
        gap: 4,
        flexWrap: "wrap"
      }
    }, [STK_INV_TYPE[it.invType], +it.invPhase > 0 ? it.invPhase + " เฟส" : ""].filter(Boolean).map(t => React.createElement("span", {
      key: t,
      style: {
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: "var(--r-chip)",
        background: t === "Hybrid" ? "#F59E0B1c" : "var(--surface2)",
        color: t === "Hybrid" ? "#B45309" : "var(--text-2)"
      }
    }, t))), React.createElement("div", {
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
        borderRadius: "var(--r-chip)",
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
        borderRadius: "var(--r-chip)",
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
        background: "var(--tint-red-bg)",
        border: "none",
        color: "var(--tint-red-tx2)",
        borderRadius: "var(--r-chip)",
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
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
      color: "var(--tint-red-tx2)",
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
    borderRadius: "var(--r-pill)",
    background: "var(--surface2)",
    boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
      borderRadius: "var(--r-tile)",
      flexShrink: 0,
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      background: img ? "var(--surface2)" : c.color + "16",
      border: "none",
      boxShadow: img ? "none" : "inset 0 0 0 1px " + c.color + "33"
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
  }, (n || 0).toLocaleString(), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), React.createElement("span", {
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
const bmTint = b => {
  let h = 0;
  for (let i = 0; i < b.length; i++) h = (h * 31 + b.charCodeAt(i)) % 360;
  return {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, hsl(" + h + " 70% 94%), hsl(" + (h + 40) % 360 + " 65% 84%))",
    color: "hsl(" + h + " 55% 28%)"
  };
};
const _bmTrim = {};
function bmTrim(src) {
  if (_bmTrim[src]) return _bmTrim[src];
  return _bmTrim[src] = new Promise(done => {
    const im = new Image();
    im.onload = () => {
      try {
        const W = im.naturalWidth,
          H = im.naturalHeight,
          c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const g = c.getContext("2d");
        g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, W, H).data;
        let x0 = W,
          y0 = H,
          x1 = -1,
          y1 = -1;
        for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
          const i = (y * W + x) * 4;
          if (d[i + 3] > 20 && Math.min(d[i], d[i + 1], d[i + 2]) < 235) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
        if (x1 < 0 || x1 - x0 > W * 0.9 && y1 - y0 > H * 0.9) return done({
          src: src,
          cover: true
        });
        const w = x1 - x0 + 3,
          h = y1 - y0 + 3,
          o = document.createElement("canvas");
        o.width = w;
        o.height = h;
        o.getContext("2d").drawImage(im, x0 - 1, y0 - 1, w, h, 0, 0, w, h);
        done({
          src: o.toDataURL("image/png"),
          cover: false
        });
      } catch (e) {
        done({
          src: src,
          cover: true
        });
      }
    };
    im.onerror = () => done({
      src: src,
      cover: true
    });
    im.src = src;
  });
}
function BmImg({
  src,
  alt
}) {
  const [t, setT] = React.useState(null);
  React.useEffect(() => {
    let on = true;
    bmTrim(src).then(r => {
      if (on) setT(r);
    });
    return () => {
      on = false;
    };
  }, [src]);
  if (!t) return null;
  return t.cover ? React.createElement("img", {
    src: t.src,
    alt: alt
  }) : React.createElement("span", {
    className: "bm-logo"
  }, React.createElement("img", {
    src: t.src,
    alt: alt
  }));
}
function BrandMarquee({
  items,
  imgs,
  onPick
}) {
  const list = React.useMemo(() => {
    const m = {};
    items.forEach(it => {
      const b = (it.brand || "").trim();
      if (b) m[b] = (m[b] || 0) + 1;
    });
    const byName = {};
    SF.STOCK_CATS.concat(Object.keys(SF.STOCK_SUB_BY_CAT || {}).reduce((a, k) => a.concat(SF.STOCK_SUB_BY_CAT[k] || []), [])).forEach(c => {
      if (c && c.th && imgs["cat_" + c.key]) byName[String(c.th).trim().toLowerCase()] = imgs["cat_" + c.key];
    });
    return Object.keys(m).sort((a, z) => m[z] - m[a] || a.localeCompare(z)).map(b => {
      const k = "brand_" + b.toLowerCase().replace(/[.#$\[\]\/\s]+/g, "_");
      return {
        b: b,
        n: m[b],
        img: imgs["cat_" + k] || byName[b.toLowerCase()] || ""
      };
    }).filter(x => x.img);
  }, [items, imgs]);
  if (!list.length) return null;
  const one = (x, i, dup) => React.createElement("button", {
    key: (dup ? "d" : "") + x.b,
    type: "button",
    className: "bm-item",
    tabIndex: dup ? -1 : 0,
    "aria-hidden": dup || undefined,
    title: x.b + " · " + x.n + " รายการ",
    onClick: () => onPick(x.b)
  }, x.img ? React.createElement(BmImg, {
    src: x.img,
    alt: x.b
  }) : React.createElement("span", {
    className: "bm-word",
    style: bmTint(x.b)
  }, x.b));
  return React.createElement("div", {
    className: "bm-wrap",
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    className: "bm-track",
    style: {
      animationDuration: Math.max(20, list.length * 3.2) + "s"
    }
  }, list.map((x, i) => one(x, i, false)), list.map((x, i) => one(x, i, true))));
}
const STOCK_GRPS = {
  DC: {
    th: "อุปกรณ์ DC",
    color: "#DC2626"
  },
  AC: {
    th: "อุปกรณ์ AC",
    color: "#2563EB"
  }
};
const stockGrpOf = k => (SF.STOCK_CAT_BY[k] || {}).grp || "";
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
  onSetImage,
  tools
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
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
  }, hint), React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, tools), React.createElement("button", {
    onClick: onAll,
    style: {
      padding: "7px 14px",
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface2)",
      boxShadow: "var(--shadow-sm)",
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
  StockView,
  BoqRulesPage
});