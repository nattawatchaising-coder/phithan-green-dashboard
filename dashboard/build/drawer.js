function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function FlowTimeline({
  job
}) {
  const SF = window.SF;
  return React.createElement("div", {
    style: {
      position: "relative",
      paddingLeft: 4
    }
  }, job.timeline.map((step, i) => {
    const s = SF.STAGES[i];
    const isDone = step.status === "done";
    const isCurrent = step.status === "current";
    const isLast = i === job.timeline.length - 1;
    const dotColor = step.blocked ? "#EF4444" : isDone || isCurrent ? s.color : "var(--surface3)";
    return React.createElement("div", {
      key: step.key,
      style: {
        display: "flex",
        gap: 14,
        position: "relative"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }
    }, React.createElement("div", {
      style: {
        width: 26,
        height: 26,
        borderRadius: 99,
        flexShrink: 0,
        background: (isDone || isCurrent) && !step.blocked ? s.color : step.blocked ? "var(--tint-red-bg2)" : "var(--surface3)",
        border: isCurrent ? "2px solid " + (step.blocked ? "#EF4444" : s.color) : "2px solid transparent",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        boxShadow: isCurrent ? "0 0 0 4px " + (step.blocked ? "#EF444422" : s.color + "22") : "none"
      }
    }, isDone ? React.createElement(Icon, {
      name: "check",
      size: 14,
      color: "#fff",
      sw: 2.5
    }) : step.blocked ? React.createElement(Icon, {
      name: "alert",
      size: 13,
      color: "#EF4444"
    }) : isCurrent ? React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 99,
        background: "#fff"
      }
    }) : React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: "var(--text-3)"
      }
    })), !isLast && React.createElement("div", {
      style: {
        width: 2,
        flex: 1,
        minHeight: 26,
        background: isDone ? s.color : "var(--border)",
        marginTop: 2,
        marginBottom: 2
      }
    })), React.createElement("div", {
      style: {
        paddingBottom: isLast ? 0 : 18,
        flex: 1,
        marginTop: 2
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: isCurrent ? 700 : 600,
        color: isDone || isCurrent ? "var(--text-1)" : "var(--text-3)"
      }
    }, s.th), React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        fontFamily: "var(--mono)"
      }
    }, s.en), isCurrent && !step.blocked && React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: s.fg,
        background: s.soft,
        padding: "2px 8px",
        borderRadius: 99
      }
    }, "\u0E02\u0E31\u0E49\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), step.blocked && React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--tint-red-tx)",
        background: "var(--tint-red-bg2)",
        padding: "2px 8px",
        borderRadius: 99
      }
    }, "\u26A0 \u0E15\u0E34\u0E14\u0E1B\u0E31\u0E0D\u0E2B\u0E32")), (step.at || step.date) && (isDone || isCurrent) && React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-2)",
        marginTop: 3,
        display: "flex",
        alignItems: "center",
        gap: 5
      }
    }, React.createElement(Icon, {
      name: "check",
      size: 12,
      color: s.color,
      sw: 2.5
    }), step.at ? thDateTime(step.at) : thDate(step.date, true)), (() => {
      if (s.key !== "install") return null;
      const st = SF.installDate ? SF.installDate(job) : "";
      const en = SF.installEnd ? SF.installEnd(job) : st;
      if (!st) return null;
      const late = (job.lateStages || []).find(ls => ls.key === "install");
      return React.createElement("div", {
        style: {
          fontSize: 11.5,
          color: late ? "#EF4444" : "var(--text-3)",
          marginTop: 3,
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexWrap: "wrap"
        }
      }, React.createElement(Icon, {
        name: late ? "alert" : "calendar",
        size: 11,
        color: late ? "#EF4444" : "var(--text-3)"
      }), React.createElement("span", null, "\u0E19\u0E31\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 ", thDate(st, true), en && en !== st ? "–" + thDate(en, true) : ""), late && React.createElement("span", {
        style: {
          fontWeight: 700,
          color: "#EF4444",
          background: "var(--tint-red-bg2)",
          padding: "1px 6px",
          borderRadius: 99
        }
      }, "\u0E40\u0E25\u0E22\u0E01\u0E33\u0E2B\u0E19\u0E14 ", late.daysLate, " \u0E27\u0E31\u0E19"));
    })(), step.blocked && job.problem && React.createElement("div", {
      style: {
        marginTop: 8,
        padding: "10px 12px",
        background: "var(--tint-red-bg)",
        border: "1px solid var(--tint-red-bd)",
        borderRadius: 10,
        fontSize: 12.5,
        color: "var(--tint-red-tx)",
        lineHeight: 1.5
      }
    }, job.problem)));
  }));
}
function InfoRow({
  label,
  children
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: ".06em",
      color: "var(--text-3)",
      textTransform: "uppercase"
    }
  }, label), React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 500,
      color: "var(--text-1)",
      overflowWrap: "anywhere",
      wordBreak: "break-word"
    }
  }, children));
}
function JobMaterialUsage({
  job,
  stock,
  currentUser
}) {
  const [retRow, setRetRow] = React.useState(null);
  const [shopOpen, setShopOpen] = React.useState(false);
  if (!stock || !job) return null;
  const moves = (stock.moves || []).filter(m => m.jobId === job.id && (m.type === "out" || m.type === "return"));
  const byItem = {};
  moves.forEach(m => {
    const g = byItem[m.itemId] || (byItem[m.itemId] = {
      itemId: m.itemId,
      out: 0,
      ret: 0
    });
    if (m.type === "out") g.out += m.qty;else g.ret += m.qty;
  });
  const rows = Object.keys(byItem).map(id => {
    const g = byItem[id];
    const it = (stock.items || []).find(x => x.id === id);
    return {
      item: it,
      name: it ? it.name : id,
      unit: it ? it.unit : "",
      out: g.out,
      ret: g.ret,
      net: g.out - g.ret
    };
  }).sort((a, b) => b.net - a.net || b.out - a.out);
  const byName = currentUser && currentUser.name || "-";
  const Cell = ({
    children,
    color,
    head,
    left
  }) => React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: head ? 10 : 13,
      fontWeight: 700,
      color: color || "var(--text-1)",
      textAlign: left ? "left" : "right",
      letterSpacing: head ? ".04em" : 0,
      textTransform: head ? "uppercase" : "none"
    }
  }, children);
  return React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E1A\u0E34\u0E01 / \u0E04\u0E37\u0E19", rows.length > 0 && React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 0,
      textTransform: "none",
      color: "var(--text-3)",
      marginLeft: 2
    }
  }, "\xB7 ", rows.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), React.createElement("button", {
    onClick: () => setShopOpen(true),
    style: {
      width: "100%",
      marginBottom: rows.length ? 12 : 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "11px 14px",
      background: "#7C5CFC14",
      border: "1px dashed #7C5CFC66",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      color: "#6645e0",
      fontWeight: 700,
      fontSize: 13.5
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 16,
    color: "#6645e0"
  }), " \u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49"), rows.length > 0 && React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 42px 42px 64px",
      gap: 8,
      padding: "9px 14px",
      background: "var(--surface2)",
      borderBottom: "1px solid var(--border)"
    }
  }, React.createElement(Cell, {
    head: true,
    left: true,
    color: "var(--text-3)"
  }, "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C"), React.createElement(Cell, {
    head: true,
    color: "#6645e0"
  }, "\u0E40\u0E1A\u0E34\u0E01"), React.createElement(Cell, {
    head: true,
    color: "#0784b8"
  }, "\u0E04\u0E37\u0E19"), React.createElement("span", null)), rows.map((r, i) => {
    const cancelled = r.out > 0 && r.net <= 0;
    return React.createElement("div", {
      key: i,
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 42px 42px 64px",
        gap: 8,
        padding: "10px 14px",
        borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
        alignItems: "center",
        opacity: cancelled ? .6 : 1
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 500,
        color: "var(--text-1)",
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textDecoration: cancelled ? "line-through" : "none"
      }
    }, r.name), React.createElement(Cell, {
      color: "#6645e0"
    }, r.out), React.createElement(Cell, {
      color: r.ret ? "#0784b8" : "var(--text-3)"
    }, r.ret || "–"), cancelled ? React.createElement("span", {
      style: {
        justifySelf: "end",
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--text-3)",
        background: "var(--surface2)",
        padding: "4px 8px",
        borderRadius: 8,
        whiteSpace: "nowrap"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01") : React.createElement("button", {
      onClick: () => r.item && setRetRow(r),
      disabled: !r.item,
      title: "คืนของเข้าคลัง (สูงสุด " + r.net + ")",
      style: {
        justifySelf: "end",
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: r.item ? "#0EA5E916" : "var(--surface2)",
        border: "none",
        color: r.item ? "#0784b8" : "var(--text-3)",
        fontWeight: 700,
        fontSize: 11.5,
        padding: "5px 9px",
        borderRadius: 8,
        cursor: r.item ? "pointer" : "default",
        fontFamily: "inherit",
        whiteSpace: "nowrap"
      }
    }, "\u21A9 \u0E04\u0E37\u0E19"));
  })), retRow && React.createElement(MoveModal, {
    info: {
      item: retRow.item,
      type: "return"
    },
    byName: byName,
    lockedJob: job,
    maxQty: retRow.net,
    onSave: (qty, ref, note, jobId) => {
      stock.move(retRow.item.id, "return", qty, ref, note, byName, jobId);
      setRetRow(null);
    },
    onClose: () => setRetRow(null)
  }), shopOpen && React.createElement(StockShopModal, {
    stock: stock,
    job: job,
    byName: byName,
    onClose: () => setShopOpen(false)
  }));
}
const _matNorm = s => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
function StockShopModal({
  stock,
  job,
  byName,
  onClose
}) {
  const SF = window.SF;
  const bdClose = window.useBackdropClose(onClose);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const allItems = stock.items || [];
  const stockByName = React.useMemo(() => {
    const m = {};
    allItems.forEach(it => {
      m[_matNorm(it.name)] = it;
      if (it.sku) m["#" + _matNorm(it.sku)] = it;
    });
    return m;
  }, [allItems]);
  const boqLines = React.useMemo(() => {
    if (!job || !job.boq || !window.BOQ) return [];
    const b = Object.assign(window.BOQ.blankBOQ(job), job.boq);
    let res;
    try {
      res = window.BOQ.calcBOQ(b);
    } catch (e) {
      return [];
    }
    const agg = {};
    (res.groups || []).forEach(g => (g.items || []).forEach(it => {
      const key = window.BOQ.matKey(it.name);
      const qty = Math.round(+it.qty || 0);
      if (!key || qty <= 0) return;
      const k = _matNorm(key);
      if (agg[k]) agg[k].qty += qty;else agg[k] = {
        name: key,
        qty,
        unit: it.unit,
        group: g.group,
        stockItem: stockByName[k] || null
      };
    }));
    return Object.values(agg);
  }, [job, stockByName]);
  const boqStockIds = React.useMemo(() => new Set(boqLines.filter(l => l.stockItem).map(l => l.stockItem.id)), [boqLines]);
  const [cart, setCart] = React.useState({});
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (prefilled.current || boqLines.length === 0) return;
    prefilled.current = true;
    const init = {};
    boqLines.forEach(l => {
      if (l.stockItem) {
        const q = Math.min(l.qty, l.stockItem.qty);
        if (q > 0) init[l.stockItem.id] = q;
      }
    });
    setCart(init);
  }, [boqLines]);
  const setQty = (id, v, max) => setCart(p => {
    const n = Math.max(0, Math.min(Math.floor(+v || 0), max));
    const c = Object.assign({}, p);
    if (n > 0) c[id] = n;else delete c[id];
    return c;
  });
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("all");
  const extraItems = allItems.filter(it => {
    if (boqStockIds.has(it.id)) return false;
    if (cat !== "all" && it.cat !== cat && SF.mainCatOf(it.cat) !== cat) return false;
    if (q && !_matNorm(it.name + " " + (it.sku || "")).includes(_matNorm(q))) return false;
    return true;
  });
  const extraCats = React.useMemo(() => {
    const present = new Set(allItems.filter(it => !boqStockIds.has(it.id)).map(it => SF.mainCatOf(it.cat)));
    return (SF.STOCK_CATS || []).filter(c => present.has(c.key));
  }, [allItems, boqStockIds]);
  const cartIds = Object.keys(cart);
  const totalQty = cartIds.reduce((s, id) => s + cart[id], 0);
  const confirm = () => {
    if (!cartIds.length) return;
    cartIds.forEach(id => stock.move(id, "out", cart[id], job.code, "", byName, job.id));
    onClose();
  };
  const Stepper = ({
    it,
    sub
  }) => {
    const inCart = cart[it.id] || 0;
    const max = it.qty;
    const out = max <= 0;
    return React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 8px",
        borderBottom: "1px solid var(--border)"
      }
    }, React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-1)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, it.name), React.createElement("div", {
      style: {
        fontSize: 11,
        color: out ? "#EF4444" : "var(--text-3)",
        marginTop: 1
      }
    }, sub)), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0
      }
    }, React.createElement("button", {
      onClick: () => setQty(it.id, inCart - 1, max),
      disabled: !inCart,
      style: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontSize: 17,
        fontWeight: 700,
        cursor: inCart ? "pointer" : "default",
        lineHeight: 1
      }
    }, "\u2212"), React.createElement("input", {
      type: "number",
      value: inCart || "",
      placeholder: "0",
      onChange: e => setQty(it.id, e.target.value, max),
      style: {
        width: 46,
        textAlign: "center",
        padding: "6px 4px",
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface2)",
        color: "var(--text-1)",
        fontFamily: "inherit",
        fontSize: 13
      }
    }), React.createElement("button", {
      onClick: () => setQty(it.id, inCart + 1, max),
      disabled: out || inCart >= max,
      style: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "none",
        background: out || inCart >= max ? "var(--surface3)" : "var(--primary)",
        color: out || inCart >= max ? "var(--text-3)" : "#fff",
        fontSize: 17,
        fontWeight: 700,
        cursor: out || inCart >= max ? "default" : "pointer",
        lineHeight: 1
      }
    }, "+")));
  };
  const SectionHead = ({
    children
  }) => React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      padding: "12px 8px 6px",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, children);
  const boqMissing = boqLines.filter(l => !l.stockItem);
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
      width: isMobile ? "100%" : "min(580px,100%)",
      maxHeight: isMobile ? "94dvh" : "90vh",
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
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E40\u0E1A\u0E34\u0E01\u0E02\u0E2D\u0E07\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 ", job.code), React.createElement("h2", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: "2px 0 0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, job.name)), React.createElement("button", {
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
  })))), React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: "4px 12px 8px"
    }
  }, boqLines.length > 0 && React.createElement(React.Fragment, null, React.createElement(SectionHead, null, React.createElement(Icon, {
    name: "list",
    size: 13,
    color: "var(--primary)"
  }), " \u0E15\u0E32\u0E21 BOQ \u0E02\u0E2D\u0E07\u0E07\u0E32\u0E19 ", React.createElement("span", {
    style: {
      fontWeight: 500,
      letterSpacing: 0,
      textTransform: "none",
      color: "var(--text-3)"
    }
  }, "\xB7 \u0E40\u0E15\u0E34\u0E21\u0E08\u0E33\u0E19\u0E27\u0E19\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E41\u0E01\u0E49\u0E44\u0E14\u0E49")), boqLines.filter(l => l.stockItem).map(l => {
    const it = l.stockItem;
    const short = l.qty > it.qty;
    return React.createElement(Stepper, {
      key: "b" + it.id,
      it: it,
      sub: React.createElement("span", null, "BOQ ", React.createElement("b", {
        style: {
          color: "var(--text-2)"
        }
      }, l.qty), " ", l.unit, " \xB7 ", it.qty <= 0 ? React.createElement("span", {
        style: {
          color: "#EF4444"
        }
      }, "\u0E2B\u0E21\u0E14\u0E2A\u0E15\u0E47\u0E2D\u0E01") : React.createElement("span", null, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D ", it.qty.toLocaleString(), " ", it.unit), it.sku ? " · " + it.sku : "", short && it.qty > 0 ? React.createElement("span", {
        style: {
          color: "#F59E0B"
        }
      }, " \xB7 \u0E44\u0E21\u0E48\u0E1E\u0E2D\u0E15\u0E32\u0E21 BOQ") : "")
    });
  }), boqMissing.length > 0 && React.createElement("div", {
    style: {
      margin: "8px 8px 0",
      padding: "10px 12px",
      background: "var(--tint-amber-bg)",
      border: "1px dashed var(--tint-amber-bd)",
      borderRadius: 10,
      fontSize: 11.5,
      color: "var(--tint-amber-tx)",
      lineHeight: 1.55
    }
  }, React.createElement("b", null, boqMissing.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19 BOQ \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07"), " \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E27\u0E31\u0E2A\u0E14\u0E38 + \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32 \u201C\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32\u201D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E1A\u0E34\u0E01\u0E44\u0E14\u0E49:", React.createElement("div", {
    style: {
      marginTop: 4,
      color: "#7a5208"
    }
  }, boqMissing.slice(0, 6).map(l => l.name).join(" · "), boqMissing.length > 6 ? " …" : ""))), React.createElement(SectionHead, null, React.createElement(Icon, {
    name: "box",
    size: 13,
    color: "var(--text-2)"
  }), " \u0E40\u0E1A\u0E34\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      padding: "2px 8px 8px",
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("div", {
    className: "search-box",
    style: {
      flex: 1,
      minWidth: 160
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 15,
    color: "var(--text-3)"
  }), React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C / \u0E23\u0E2B\u0E31\u0E2A..."
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: "0 8px 6px",
      flexWrap: "wrap"
    }
  }, React.createElement(CatChip, {
    active: cat === "all",
    onClick: () => setCat("all"),
    label: "\u0E17\u0E38\u0E01\u0E2B\u0E21\u0E27\u0E14",
    color: "var(--text-2)"
  }), extraCats.map(c => React.createElement(CatChip, {
    key: c.key,
    active: cat === c.key,
    onClick: () => setCat(c.key),
    label: c.th,
    color: c.color
  }))), extraItems.map(it => React.createElement(Stepper, {
    key: "x" + it.id,
    it: it,
    sub: React.createElement("span", null, it.qty <= 0 ? React.createElement("span", {
      style: {
        color: "#EF4444"
      }
    }, "\u0E2B\u0E21\u0E14\u0E2A\u0E15\u0E47\u0E2D\u0E01") : "คงเหลือ " + it.qty.toLocaleString() + " " + it.unit, it.sku ? " · " + it.sku : "")
  })), extraItems.length === 0 && React.createElement("div", {
    style: {
      padding: 24,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 12.5
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E2D\u0E37\u0E48\u0E19\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07")), React.createElement("div", {
    style: {
      padding: "12px 20px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10,
      flexShrink: 0
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
  }, "\u0E1B\u0E34\u0E14"), React.createElement("button", {
    onClick: confirm,
    disabled: !cartIds.length,
    style: {
      flex: 1,
      padding: "11px 22px",
      borderRadius: 11,
      border: "none",
      background: cartIds.length ? "var(--primary)" : "var(--surface3)",
      color: cartIds.length ? "#fff" : "var(--text-3)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: cartIds.length ? "pointer" : "default"
    }
  }, "\u0E40\u0E1A\u0E34\u0E01\u0E40\u0E02\u0E49\u0E32\u0E07\u0E32\u0E19", cartIds.length ? " (" + cartIds.length + " รายการ · " + totalQty + " ชิ้น)" : ""))));
}
function DetailDrawer({
  job,
  onClose,
  onAdvance,
  onSetMat,
  onEdit,
  currentUser,
  canManage,
  canDesign,
  stock,
  onSaveBOQ,
  onSurvey,
  onSurveyReport,
  priceMap
}) {
  const SF = window.SF;
  const open = !!job;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const media = useJobMedia(job ? job.id : null);
  const [boqOpen, setBoqOpen] = React.useState(false);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [plan3dOpen, setPlan3dOpen] = React.useState(false);
  const [designOpen, setDesignOpen] = React.useState(false);
  React.useEffect(() => {
    setBoqOpen(false);
    setPlanOpen(false);
    setPlan3dOpen(false);
    setDesignOpen(false);
  }, [job ? job.id : null]);
  const [advancing, setAdvancing] = React.useState(false);
  React.useEffect(() => {
    setAdvancing(false);
  }, [job ? job.stage : null]);
  const handleAdvance = () => {
    if (advancing) return;
    setAdvancing(true);
    onAdvance(job.id);
    setTimeout(() => setAdvancing(false), 6000);
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.34)",
      backdropFilter: "blur(2px)",
      opacity: open ? 1 : 0,
      pointerEvents: open ? "auto" : "none",
      transition: "opacity .3s",
      zIndex: 80
    }
  }), React.createElement("aside", {
    className: "drawer-panel",
    style: {
      position: "fixed",
      top: 0,
      right: 0,
      width: "min(540px, 94vw)",
      height: "100dvh",
      maxHeight: "100dvh",
      background: "var(--bg)",
      boxShadow: "-20px 0 60px rgba(8,20,14,.18)",
      zIndex: 90,
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform .34s cubic-bezier(.3,.9,.3,1)",
      display: "flex",
      flexDirection: "column"
    }
  }, job && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      padding: isMobile ? "15px 16px" : "20px 24px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--primary-dark)",
      background: "var(--primary-soft)",
      padding: "2px 8px",
      borderRadius: 6
    }
  }, job.code), React.createElement(TypeBadge, {
    type: job.type
  }), job.delayed && React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#EF4444",
      background: "var(--tint-red-bg2)",
      padding: "2px 8px",
      borderRadius: 6
    }
  }, "\u26A0 \u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32")), React.createElement("h2", {
    style: {
      fontSize: isMobile ? 17 : 20,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0,
      lineHeight: 1.25
    }
  }, job.name)), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
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
    size: 18
  }))), React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, React.createElement(StageBadge, {
    stageKey: job.stage
  }), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement(ProgressBar, {
    pct: job.progressPct,
    color: stageOf(job.stage).color
  })), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--text-2)"
    }
  }, job.progressPct, "%"))), React.createElement("div", {
    style: {
      overflowY: "auto",
      flex: 1,
      padding: isMobile ? "16px 15px" : "22px 24px"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: isMobile ? 12 : 16,
      marginBottom: isMobile ? 18 : 24
    }
  }, React.createElement(InfoRow, {
    label: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23"
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "phone",
    size: 13,
    color: "var(--text-3)"
  }), job.phone)), React.createElement(InfoRow, {
    label: "\u0E27\u0E31\u0E19\u0E19\u0E31\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, (() => {
    const v = job.stageDates && job.stageDates.install;
    const d = v ? typeof v === "object" ? v.start || v.end : v : job.deadline;
    return thDate(d, true);
  })()), React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(InfoRow, {
    label: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 / \u0E1E\u0E34\u0E01\u0E31\u0E14"
  }, job.address, ", ", job.province, "  ", React.createElement("a", {
    href: job.map,
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: "var(--primary-dark)",
      textDecoration: "none",
      fontWeight: 600,
      fontSize: 12,
      marginLeft: 4
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 12,
    style: {
      verticalAlign: -1
    }
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"))), React.createElement(InfoRow, {
    label: "\u0E0A\u0E48\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"
  }, React.createElement(TechAvatar, {
    techId: job.tech,
    size: 24,
    showName: true
  })), React.createElement(InfoRow, {
    label: "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E07\u0E32\u0E19"
  }, job.type === "home" ? "งานบ้าน" : "งานโครงการ"), React.createElement(InfoRow, {
    label: "\u0E17\u0E35\u0E21\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32"
  }, job.contractor ? job.contractor : React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2014")), React.createElement(InfoRow, {
    label: "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"
  }, job.laborCost ? Number(job.laborCost).toLocaleString() + " บาท" : React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2014")), job.trello && React.createElement("div", {
    style: {
      gridColumn: "1 / -1"
    }
  }, React.createElement(InfoRow, {
    label: "\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E07\u0E32\u0E19 Trello"
  }, React.createElement("a", {
    href: job.trello,
    target: "_blank",
    rel: "noreferrer",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#fff",
      background: "#0079BF",
      padding: "6px 12px",
      borderRadius: 9,
      textDecoration: "none",
      fontWeight: 700,
      fontSize: 12.5
    }
  }, React.createElement(Icon, {
    name: "trello",
    size: 14,
    color: "#fff"
  }), " \u0E40\u0E1B\u0E34\u0E14\u0E01\u0E32\u0E23\u0E4C\u0E14 Trello ", React.createElement(Icon, {
    name: "arrowRight",
    size: 13,
    color: "#fff"
  }))))), React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: isMobile ? 15 : 18,
      marginBottom: isMobile ? 18 : 22
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "sun",
    size: 14,
    color: "var(--primary)"
  }), " \u0E2A\u0E40\u0E1B\u0E01\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
      gap: isMobile ? 14 : 16
    }
  }, React.createElement(SpecItem, {
    label: "\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C",
    value: job.brand
  }), React.createElement(SpecItem, {
    label: "\u0E02\u0E19\u0E32\u0E14\u0E23\u0E30\u0E1A\u0E1A",
    value: job.kw + " kW",
    mono: true
  }), React.createElement(SpecItem, {
    label: "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07",
    value: job.panels + " แผง",
    mono: true
  }), React.createElement(SpecItem, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32",
    value: (job.phase || "1") + " เฟส"
  }), React.createElement(SpecItem, {
    label: "\u0E41\u0E1A\u0E15\u0E40\u0E15\u0E2D\u0E23\u0E35\u0E48",
    value: job.battery ? job.batSize : "ไม่มี",
    accent: job.battery
  }), React.createElement(SpecItem, {
    label: "\u0E23\u0E30\u0E1A\u0E1A / \u0E2D\u0E2D\u0E1F\u0E15\u0E34\u0E44\u0E21\u0E40\u0E0B\u0E2D\u0E23\u0E4C",
    value: job.connect
  }), React.createElement(SpecItem, {
    label: "\u0E23\u0E30\u0E1A\u0E1A Backup",
    value: job.backup ? "Backup ✓" : "ไม่มี",
    accent: job.backup
  }), (job.brand || "").toUpperCase().includes("ATMOCE") && React.createElement(SpecItem, {
    label: "\u0E15\u0E39\u0E49 Combiner",
    value: job.comboType === "assembled" ? "ตู้ประกอบ" : "ตู้สำเร็จ"
  }))), onSurvey && (() => {
    const ss = window.surveyStatus ? window.surveyStatus(job) : {
      state: "none",
      pct: 0,
      label: "ยังไม่สำรวจ",
      color: "var(--text-3)"
    };
    return React.createElement(React.Fragment, null, React.createElement("button", {
      onClick: onSurvey,
      style: {
        width: "100%",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        background: ss.color + "1c",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: "list",
      size: 17,
      color: ss.color
    })), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)"
      }
    }, "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 (Site Survey)"), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, ss.state === "none" ? "ยังไม่ได้สำรวจ · แตะเพื่อเริ่ม" : ss.label + " · " + ss.pct + "% · แตะเพื่อแก้ไข")), React.createElement(Icon, {
      name: "arrowRight",
      size: 16,
      color: "var(--text-3)"
    })), onSurveyReport && ss.state !== "none" && React.createElement("button", {
      onClick: onSurveyReport,
      style: {
        width: "100%",
        marginBottom: 10,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "10px 14px",
        background: "var(--primary-soft)",
        border: "1px solid var(--primary)",
        borderRadius: 11,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        color: "var(--primary-dark)"
      }
    }, React.createElement(Icon, {
      name: "file",
      size: 15,
      color: "var(--primary-dark)"
    }), " \u0E14\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1C\u0E25\u0E2A\u0E33\u0E23\u0E27\u0E08 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"));
  })(), false && window.SitePlanEditor && React.createElement("button", {
    onClick: () => setPlanOpen(true),
    style: {
      width: "100%",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: "#0EA5E91c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 17,
    color: "#0784b8"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E1C\u0E31\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 (\u0E27\u0E32\u0E14 + \u0E27\u0E31\u0E14\u0E23\u0E30\u0E22\u0E30)"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E32\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E32\u0E22 \xB7 \u0E27\u0E32\u0E07\u0E08\u0E38\u0E14\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \xB7 \u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19")), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), window.Plan3DEditor && canDesign && React.createElement("button", {
    onClick: () => setPlan3dOpen(true),
    style: {
      width: "100%",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: "#6366F11c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "panel",
    size: 17,
    color: "#4F46E5"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07 3D (\u0E42\u0E21\u0E40\u0E14\u0E25\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 + \u0E40\u0E07\u0E32\u0E41\u0E14\u0E14)"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E1B\u0E31\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32\u0E15\u0E32\u0E21\u0E23\u0E39\u0E1B\u0E42\u0E14\u0E23\u0E19 \xB7 \u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07 \xB7 \u0E08\u0E33\u0E25\u0E2D\u0E07\u0E40\u0E07\u0E32\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C")), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), window.SolarDesignHost && React.createElement("button", {
    onClick: () => setDesignOpen(true),
    style: {
      width: "100%",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: "#F59E0B1c",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "bolt",
    size: 17,
    color: "#B45309"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A + \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E15\u0E48\u0E2D\u0E2A\u0E15\u0E23\u0E34\u0E07 \xB7 \u0E15\u0E23\u0E27\u0E08 I-V \xB7 \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 25 \u0E1B\u0E35 \xB7 \u0E04\u0E37\u0E19\u0E17\u0E38\u0E19 \u2014 \u0E40\u0E02\u0E49\u0E32\u0E15\u0E23\u0E07 \u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E2D\u0E08\u0E2D 3 \u0E21\u0E34\u0E15\u0E34")), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), React.createElement("button", {
    onClick: () => setBoqOpen(true),
    style: {
      width: "100%",
      marginBottom: 22,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border-strong)",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 17,
    color: "var(--primary-dark)"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38 BOQ"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, job.boq ? "มีรายการแล้ว · แตะเพื่อแก้ไข / ดาวน์โหลด" : "คำนวณปริมาณวัสดุของงานนี้")), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E2A\u0E16\u0E32\u0E19\u0E30\u0E27\u0E31\u0E2A\u0E14\u0E38", React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 0,
      textTransform: "none",
      color: "var(--text-3)",
      marginLeft: 2
    }
  }, "\xB7 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02")), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      width: 54,
      height: 6,
      borderRadius: 99,
      background: "var(--surface3)",
      overflow: "hidden",
      display: "block"
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: job.matReadyPct + "%",
      borderRadius: 99,
      background: job.matReady ? "var(--primary)" : "#F59E0B",
      transition: "width .4s cubic-bezier(.2,.8,.2,1)"
    }
  })), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "-.02em",
      fontVariantNumeric: "tabular-nums",
      color: job.matReady ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, job.matReadyPct, "%"))), React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gap: 0,
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, SF.MATERIALS.filter(m => {
    if (m.key === "battery" && !job.battery) return false;
    if (m.key === "backup" && !job.backup) return false;
    return true;
  }).map((m, i) => {
    const MAT_CYCLE = ["none", "waiting", "ready", "na"];
    const cycle = () => {
      const cur = MAT_CYCLE.indexOf(job.mat[m.key]);
      onSetMat(job.id, m.key, MAT_CYCLE[(cur + 1) % MAT_CYCLE.length]);
    };
    return React.createElement("button", {
      key: m.key,
      onClick: cycle,
      title: "\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30",
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: "transparent",
        border: 0,
        boxShadow: "inset 0 -1px 0 var(--border)" + (!isMobile && i % 2 === 0 ? ", inset -1px 0 0 var(--border)" : ""),
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background .13s"
      },
      onMouseEnter: e => e.currentTarget.style.background = "var(--surface2)",
      onMouseLeave: e => e.currentTarget.style.background = "transparent"
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "var(--text-1)",
        fontWeight: 600
      }
    }, m.th), React.createElement(MatChip, {
      status: job.mat[m.key]
    }));
  }))), React.createElement(JobMaterialUsage, {
    job: job,
    stock: stock,
    currentUser: currentUser
  }), React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".08em",
      color: "var(--text-3)",
      textTransform: "uppercase",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "flow",
    size: 14,
    color: "var(--text-2)"
  }), " Flow \u0E01\u0E32\u0E23\u0E17\u0E33\u0E07\u0E32\u0E19"), React.createElement(FlowTimeline, {
    job: job
  })), React.createElement(JobFiles, {
    media: media,
    currentUser: currentUser,
    canManage: canManage
  }), React.createElement(JobPhotos, {
    media: media,
    currentUser: currentUser,
    canManage: canManage
  }), React.createElement(JobComments, {
    media: media,
    currentUser: currentUser,
    canManage: canManage
  }), job.note && React.createElement("div", {
    style: {
      padding: "12px 14px",
      background: "var(--surface2)",
      border: "1px dashed var(--border-strong)",
      borderRadius: 10,
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.55
    }
  }, React.createElement("strong", {
    style: {
      color: "var(--text-1)"
    }
  }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38:"), " ", job.note)), React.createElement("div", {
    style: {
      padding: isMobile ? "12px 16px" : "14px 24px",
      paddingBottom: "calc(" + (isMobile ? 12 : 14) + "px + env(safe-area-inset-bottom, 0px))",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: isMobile ? 8 : 10,
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14",
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      flex: "0 0 auto",
      padding: isMobile ? 0 : "11px 16px",
      width: isMobile ? 42 : "auto",
      height: isMobile ? 42 : "auto",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, isMobile ? React.createElement(Icon, {
    name: "x",
    size: 18,
    color: "var(--text-2)"
  }) : "ปิด"), React.createElement("button", {
    onClick: () => onEdit(job.id),
    title: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "aria-label": "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    style: {
      flex: "0 0 auto",
      padding: isMobile ? 0 : "11px 16px",
      width: isMobile ? 42 : "auto",
      height: isMobile ? 42 : "auto",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-1)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: isMobile ? 17 : 15,
    color: "var(--text-2)"
  }), !isMobile && " แก้ไขข้อมูล"), job.stage !== "done" && React.createElement("button", {
    onClick: handleAdvance,
    disabled: advancing,
    style: {
      flex: 1,
      minWidth: 0,
      padding: isMobile ? "11px 14px" : "11px 16px",
      height: isMobile ? 42 : "auto",
      borderRadius: 11,
      border: "none",
      background: advancing ? "var(--primary-dark)" : "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: isMobile ? 13 : 13.5,
      cursor: advancing ? "default" : "pointer",
      opacity: advancing ? 0.82 : 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      transition: "background .15s, opacity .15s"
    }
  }, advancing ? "กำลังบันทึก..." : React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E02\u0E31\u0E49\u0E19 \"", SF.STAGES[Math.min(job.stageIdx + 1, SF.STAGES.length - 1)].th, "\""), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "#fff",
    style: {
      flexShrink: 0
    }
  })))))), boqOpen && job && React.createElement(BOQEditor, {
    job: job,
    onClose: () => setBoqOpen(false),
    priceMap: priceMap,
    stock: stock,
    onSave: onSaveBOQ ? boq => {
      onSaveBOQ(job.id, boq);
      setBoqOpen(false);
    } : null
  }), planOpen && job && window.SitePlanEditor && React.createElement(window.SitePlanEditor, {
    job: job,
    currentUser: currentUser,
    onClose: () => setPlanOpen(false)
  }), plan3dOpen && job && window.Plan3DEditor && React.createElement(window.Plan3DEditor, {
    job: job,
    currentUser: currentUser,
    onClose: () => setPlan3dOpen(false)
  }), designOpen && job && window.SolarDesignHost && React.createElement(window.SolarDesignHost, {
    job: job,
    onClose: () => setDesignOpen(false)
  }));
}
function SpecItem({
  label,
  value,
  mono,
  accent
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, label), React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      fontFamily: mono ? "var(--mono)" : "inherit",
      color: accent ? "var(--primary-dark)" : "var(--text-1)"
    }
  }, value));
}
Object.assign(window, {
  DetailDrawer,
  FlowTimeline
});