function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PRICE_GROUP_TH = {
  all: "ทั้งหมด",
  "PV MODULE": "แผง",
  INVERTER: "อินเวอร์เตอร์",
  MOUNTING: "อุปกรณ์ mounting",
  CABLE: "สายไฟ",
  "RACE WAY": "ท่อร้อยสาย",
  GROUNDING: "กราวด์",
  ACCESSORIES: "Accessories",
  "LADDER (บันไดลิง)": "LADDER (บันไดลิง)",
  WALKWAY: "WALKWAY",
  "GUARD RAIL": "GUARD RAIL"
};
const PRICE_GROUP_COLOR = {
  "PV MODULE": "#22A35B",
  INVERTER: "#7C5CFC",
  MOUNTING: "#F59E0B",
  CABLE: "#0EA5E9",
  "RACE WAY": "#64748B",
  GROUNDING: "#A16207",
  ACCESSORIES: "#EC4899",
  "LADDER (บันไดลิง)": "#0D9488",
  WALKWAY: "#D97706",
  "GUARD RAIL": "#DB2777"
};
const CAT_TO_GROUP = {
  panel: "PV MODULE",
  inverter: "INVERTER",
  battery: "INVERTER",
  structure: "MOUNTING",
  steelwork: "LADDER (บันไดลิง)",
  wiring: "CABLE",
  conduit: "RACE WAY",
  grounding: "GROUNDING",
  accessory: "ACCESSORIES",
  other: "ACCESSORIES"
};
function PricePanel({
  priceStore,
  stock,
  q = "",
  grp = "all"
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const baseCat = React.useMemo(() => window.BOQ.catalog(), []);
  const catKeys = React.useMemo(() => new Set(baseCat.map(c => c.name)), [baseCat]);
  const stockItems = stock && stock.items || [];
  const stockByName = React.useMemo(() => {
    const m = {};
    stockItems.forEach(s => {
      m[s.name] = s;
    });
    return m;
  }, [stockItems]);
  const cat = React.useMemo(() => {
    const seen = new Set(baseCat.map(c => c.name));
    const extra = [];
    stockItems.forEach(s => {
      if (s.name && !seen.has(s.name)) {
        seen.add(s.name);
        extra.push({
          group: CAT_TO_GROUP[s.cat] || "ACCESSORIES",
          name: s.name,
          unit: s.unit || "",
          fromStock: true
        });
      }
    });
    Object.keys(priceStore.priceMap).forEach(n => {
      if (!seen.has(n)) {
        seen.add(n);
        extra.push({
          group: priceStore.priceMap[n].group || "ACCESSORIES",
          name: n,
          unit: priceStore.priceMap[n].unit || "",
          custom: true
        });
      }
    });
    return baseCat.concat(extra);
  }, [baseCat, stockItems, priceStore.priceMap]);
  const curOf = name => {
    const s = stockByName[name];
    if (s) return {
      code: s.sku || "",
      price: s.price != null ? s.price : ""
    };
    const r = priceStore.priceMap[name] || {};
    return {
      code: r.code || "",
      price: r.price != null ? r.price : ""
    };
  };
  const [local, setLocal] = React.useState({});
  const valOf = name => local[name] || curOf(name);
  const set = (name, k, v) => setLocal(p => Object.assign({}, p, {
    [name]: Object.assign({}, valOf(name), {
      [k]: v
    })
  }));
  const filtered = cat.filter(c => {
    if (grp !== "all" && c.group !== grp) return false;
    if (q) {
      const l = valOf(c.name);
      if (!(c.name + " " + (l.code || "")).toLowerCase().includes(q.toLowerCase())) return false;
    }
    return true;
  });
  const isDirty = c => {
    if (!local[c.name]) return false;
    const r = curOf(c.name);
    const l = local[c.name];
    return (l.code || "") !== (r.code || "") || (+l.price || 0) !== (+r.price || 0);
  };
  const dirtyCount = cat.filter(isDirty).length;
  const pricedCount = cat.filter(c => +valOf(c.name).price > 0).length;
  const newItems = cat.filter(c => !stockByName[c.name]);
  const newCount = newItems.length;
  const saveAll = () => {
    const ctx = window.newMatSaveCtx(stock);
    cat.forEach(c => {
      if (!isDirty(c)) return;
      const l = local[c.name];
      window.saveMatPrice(stock, {
        name: c.name,
        group: c.group,
        unit: c.unit,
        price: l.price,
        code: l.code
      }, ctx);
    });
    setLocal({});
  };
  const addAllNew = () => {
    if (!newCount) return;
    if (!confirm("เพิ่ม " + newCount + " รายการที่ยังไม่มีในคลังสินค้า\n(จำนวน 0 · สร้างรหัสอัตโนมัติตามหมวด · ราคาที่กรอกไว้จะถูกบันทึกด้วย)")) return;
    const ctx = window.newMatSaveCtx(stock);
    newItems.forEach(c => {
      const l = local[c.name] || {};
      window.saveMatPrice(stock, {
        name: c.name,
        group: c.group,
        unit: c.unit,
        price: l.price,
        code: l.code
      }, ctx);
    });
    setLocal({});
  };
  const inStyle = Object.assign({}, inputStyle, {
    padding: "7px 9px",
    fontSize: 12.5
  });
  const numStyle = Object.assign({}, inStyle, {
    textAlign: "right"
  });
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement("div", {
    style: {
      padding: "12px 16px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface2)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E43\u0E2A\u0E48\u0E23\u0E32\u0E04\u0E32\u0E41\u0E25\u0E49\u0E27 ", pricedCount, "/", cat.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E07\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32", dirtyCount > 0 && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700
    }
  }, " \xB7 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ", dirtyCount)), React.createElement("div", {
    style: {
      padding: "8px 12px"
    }
  }, filtered.map(c => {
    const l = valOf(c.name);
    const dirty = isDirty(c);
    const inStock = !!stockByName[c.name];
    return React.createElement("div", {
      key: c.name,
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 150px 110px 34px",
        gap: isMobile ? 8 : 10,
        alignItems: "center",
        padding: "7px 8px",
        borderRadius: 9,
        background: dirty ? "var(--tint-amber-bg)" : "transparent",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        gridColumn: isMobile ? "1 / -1" : "auto",
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 99,
        background: PRICE_GROUP_COLOR[c.group] || "var(--text-3)",
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "var(--text-1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, c.name), inStock ? React.createElement("span", {
      title: "\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32",
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        color: "var(--tint-ok-tx)",
        background: "#22A35B16",
        padding: "1px 6px",
        borderRadius: 99,
        flexShrink: 0
      }
    }, "\u0E04\u0E25\u0E31\u0E07") : React.createElement("span", {
      title: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 \u2014 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E49",
      style: {
        fontSize: 9.5,
        fontWeight: 700,
        color: "var(--tint-amber-tx)",
        background: "#F59E0B1f",
        padding: "1px 6px",
        borderRadius: 99,
        flexShrink: 0
      }
    }, "\u0E43\u0E2B\u0E21\u0E48")), React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)",
        marginLeft: 12
      }
    }, PRICE_GROUP_TH[c.group] || c.group, " \xB7 ", c.unit || "-")), React.createElement("input", {
      value: l.code,
      onChange: e => set(c.name, "code", e.target.value),
      placeholder: "\u0E23\u0E2B\u0E31\u0E2A (auto)",
      style: inStyle
    }), React.createElement("input", {
      type: "number",
      value: l.price,
      onChange: e => set(c.name, "price", e.target.value),
      placeholder: "0",
      style: numStyle
    }), !isMobile && (c.custom && !inStock ? React.createElement("button", {
      onClick: () => {
        if (confirm("ลบ \"" + c.name + "\" ?")) priceStore.removePrice(c.name);
      },
      title: "\u0E25\u0E1A",
      style: {
        height: 32,
        background: "#EF444414",
        border: "none",
        color: "#EF4444",
        borderRadius: 8,
        cursor: "pointer",
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 13
    })) : React.createElement("span", null)));
  }), filtered.length === 0 && React.createElement("div", {
    style: {
      padding: 30,
      textAlign: "center",
      color: "var(--text-3)"
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 0,
      padding: "12px 16px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, newCount > 0 ? React.createElement("span", null, "\u0E21\u0E35 ", React.createElement("b", {
    style: {
      color: "var(--tint-amber-tx)"
    }
  }, newCount), " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07") : dirtyCount > 0 ? React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 ", dirtyCount, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23") : "บันทึกครบแล้ว"), newCount > 0 && React.createElement("button", {
    onClick: addAllNew,
    style: {
      flex: "0 0 auto",
      padding: "11px 18px",
      borderRadius: 11,
      border: "1px solid var(--primary)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E25\u0E07\u0E04\u0E25\u0E31\u0E07 (", newCount, ")"), React.createElement("button", {
    onClick: saveAll,
    disabled: dirtyCount === 0,
    style: {
      flex: "0 0 auto",
      padding: "11px 26px",
      borderRadius: 11,
      border: "none",
      background: dirtyCount ? "var(--primary)" : "var(--surface3)",
      color: dirtyCount ? "#fff" : "var(--text-3)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: dirtyCount ? "pointer" : "default"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E04\u0E32", dirtyCount > 0 ? " (" + dirtyCount + ")" : "")));
}
function AddPriceModal({
  priceStore,
  stock,
  onClose
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const stockItems = stock && stock.items || [];
  const stockByName = React.useMemo(() => {
    const m = {};
    stockItems.forEach(s => {
      m[s.name] = s;
    });
    return m;
  }, [stockItems]);
  const [nf, setNf] = React.useState({
    name: "",
    code: "",
    price: "",
    unit: "",
    cat: "accessory"
  });
  const setNF = (k, v) => setNf(p => {
    const n = Object.assign({}, p, {
      [k]: v
    });
    if (k === "name" && stockByName[v]) {
      const s = stockByName[v];
      n.code = s.sku || n.code;
      n.unit = s.unit || n.unit;
      n.cat = s.cat || n.cat;
      if (s.price != null && n.price === "") n.price = s.price;
    }
    return n;
  });
  const suggestCode = SF.genMatCode(nf.cat, stockItems);
  const save = () => {
    const name = (nf.name || "").trim();
    if (!name) {
      alert("กรอกชื่อวัสดุ");
      return;
    }
    const code = String(nf.code || "").trim() || suggestCode;
    const existing = stockByName[name];
    if (existing) {
      stock.upsertItem(Object.assign({}, existing, {
        sku: code,
        price: +nf.price || 0,
        unit: nf.unit || existing.unit || "",
        cat: nf.cat || existing.cat
      }));
    } else {
      let maxId = 0;
      stockItems.forEach(it => {
        const m = parseInt(String(it.id || "").replace(/\D/g, ""), 10);
        if (!isNaN(m) && m > maxId) maxId = m;
      });
      stock.upsertItem({
        id: "IV-" + String(maxId + 1).padStart(2, "0"),
        name: name,
        sku: code,
        cat: nf.cat || "accessory",
        unit: nf.unit || "",
        qty: 0,
        min: 0,
        loc: "",
        price: +nf.price || 0
      });
    }
    onClose();
  };
  const inStyle = Object.assign({}, inputStyle, {
    padding: "10px 12px",
    fontSize: 13.5
  });
  const label = {
    fontSize: 11.5,
    fontWeight: 700,
    color: "var(--text-2)",
    marginBottom: 5,
    display: "block"
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.45)",
      backdropFilter: "blur(3px)",
      zIndex: 115,
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
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E27\u0E31\u0E2A\u0E14\u0E38"), React.createElement("button", {
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
    style: {
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflowY: "auto"
    }
  }, React.createElement("datalist", {
    id: "ap-stock-names"
  }, stockItems.map(s => React.createElement("option", {
    key: s.id || s.name,
    value: s.name
  }))), React.createElement("div", null, React.createElement("label", {
    style: label
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E2A\u0E14\u0E38 / \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"), React.createElement("input", {
    list: "ap-stock-names",
    value: nf.name,
    onChange: e => setNF("name", e.target.value),
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07",
    style: inStyle
  })), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, React.createElement("div", null, React.createElement("label", {
    style: label
  }, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), React.createElement("select", {
    value: nf.cat,
    onChange: e => setNF("cat", e.target.value),
    style: inStyle
  }, (SF.STOCK_CATS || []).map(c => [React.createElement("option", {
    key: c.key,
    value: c.key
  }, c.th)].concat(((SF.STOCK_SUB_BY_CAT || {})[c.key] || []).map(s2 => React.createElement("option", {
    key: s2.key,
    value: s2.key
  }, "  └ " + s2.th)))))), React.createElement("div", null, React.createElement("label", {
    style: label
  }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), React.createElement("input", {
    value: nf.unit,
    onChange: e => setNF("unit", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 pcs",
    style: inStyle
  }))), React.createElement("div", null, React.createElement("label", {
    style: label
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E27\u0E31\u0E2A\u0E14\u0E38 (mat code)"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, React.createElement("input", {
    value: nf.code,
    onChange: e => setNF("code", e.target.value),
    placeholder: suggestCode + " (อัตโนมัติ)",
    style: Object.assign({}, inStyle, {
      flex: 1
    })
  }), React.createElement("button", {
    type: "button",
    onClick: () => setNF("code", suggestCode),
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
      cursor: "pointer"
    }
  }, "auto"))), React.createElement("div", null, React.createElement("label", {
    style: label
  }, "\u0E23\u0E32\u0E04\u0E32 (\u0E1A\u0E32\u0E17)"), React.createElement("input", {
    type: "number",
    value: nf.price,
    onChange: e => setNF("price", e.target.value),
    placeholder: "0",
    style: Object.assign({}, inStyle, {
      textAlign: "right"
    })
  }))), React.createElement("div", {
    style: {
      padding: "12px 20px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      padding: "11px 16px",
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
    onClick: save,
    style: {
      flex: 1,
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
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E25\u0E07\u0E04\u0E25\u0E31\u0E07"))));
}
Object.assign(window, {
  PricePanel,
  AddPriceModal,
  PRICE_GROUP_TH,
  PRICE_GROUP_COLOR
});