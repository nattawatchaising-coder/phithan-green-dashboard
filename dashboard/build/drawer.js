function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const useDrInspections = window.useJobInspections || (() => ({
  list: [],
  loading: false,
  save: () => {},
  create: () => null,
  remove: () => {}
}));
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
        borderRadius: "var(--r-pill)",
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
        borderRadius: "var(--r-pill)",
        background: "#fff"
      }
    }) : React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: "var(--r-pill)",
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
        borderRadius: "var(--r-pill)"
      }
    }, "\u0E02\u0E31\u0E49\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), step.blocked && React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--tint-red-tx)",
        background: "var(--tint-red-bg2)",
        padding: "2px 8px",
        borderRadius: "var(--r-pill)"
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
          color: "var(--tint-red-tx2)",
          background: "var(--tint-red-bg2)",
          padding: "1px 6px",
          borderRadius: "var(--r-pill)"
        }
      }, "\u0E40\u0E25\u0E22\u0E01\u0E33\u0E2B\u0E19\u0E14 ", late.daysLate, " \u0E27\u0E31\u0E19"));
    })(), step.blocked && job.problem && React.createElement("div", {
      style: {
        marginTop: 8,
        padding: "10px 12px",
        background: "var(--tint-red-bg)",
        border: "1px solid var(--tint-red-bd)",
        borderRadius: "var(--r-tile)",
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
      fontSize: 11,
      fontWeight: 600,
      color: "var(--text-3)"
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
const DR_STAGE_SHORT = {
  design: "ออกแบบ",
  takeoff: "ถอดของ",
  queue: "นัดคิว",
  install: "ติดตั้ง",
  done: "เสร็จสิ้น"
};
function DrStageSteps({
  job
}) {
  const SF = window.SF;
  const idx = job.stageIdx != null ? job.stageIdx : SF.STAGE_INDEX[job.stage] || 0;
  const cur = SF.STAGES[idx] || SF.STAGES[0];
  const blocked = !!job.problem && job.stage !== "done";
  const c = blocked ? "#EF4444" : cur.color;
  return React.createElement("div", {
    role: "img",
    "aria-label": "ขั้นตอนงาน: " + cur.th + " (ขั้นที่ " + (idx + 1) + " จาก " + SF.STAGES.length + ")",
    title: cur.th + (blocked ? " · ติดปัญหา" : ""),
    style: {
      display: "flex",
      gap: 5
    }
  }, SF.STAGES.map((s, i) => {
    const now = i === idx;
    const done = i < idx;
    return React.createElement("span", {
      key: s.key,
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        height: 5,
        borderRadius: "var(--r-pill)",
        background: done || now ? c : "var(--surface3)",
        opacity: done ? .5 : 1
      }
    }), React.createElement("span", {
      style: {
        display: "block",
        marginTop: 5,
        fontSize: 11,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        fontWeight: now ? 800 : 600,
        color: now ? blocked ? "var(--tint-red-tx)" : s.fg : "var(--text-3)"
      }
    }, DR_STAGE_SHORT[s.key] || s.th));
  }));
}
function DrLine({
  icon,
  muted,
  children
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: "6px 0"
    }
  }, React.createElement("span", {
    style: {
      width: 18,
      height: 20,
      flexShrink: 0,
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: icon,
    size: 15,
    color: "var(--text-3)"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontSize: 13.5,
      fontWeight: 500,
      lineHeight: 1.5,
      color: muted ? "var(--text-3)" : "var(--text-1)",
      overflowWrap: "anywhere"
    }
  }, children));
}
function DrPair({
  label,
  children
}) {
  return React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      marginRight: 16,
      maxWidth: "100%"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: "var(--text-3)",
      whiteSpace: "nowrap"
    }
  }, label), React.createElement("span", {
    style: {
      minWidth: 0
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
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
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
      borderRadius: "var(--r-tile)",
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
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 42px 42px 64px",
      gap: 8,
      padding: "9px 14px",
      background: "var(--surface2)",
      borderBottom: "1px solid var(--divider)"
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
        borderRadius: "var(--r-chip)",
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
        borderRadius: "var(--r-chip)",
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
    const b = window.BOQ.mergeBOQ(job);
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
        borderBottom: "1px solid var(--divider)"
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
        borderRadius: "var(--r-chip)",
        boxShadow: "var(--shadow-sm)",
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
        borderRadius: "var(--r-chip)",
        boxShadow: "var(--shadow-sm)",
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
        borderRadius: "var(--r-chip)",
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
      bottom: "var(--kb, 0px)",
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
      maxHeight: isMobile ? "calc(94dvh - var(--kb, 0px))" : "90vh",
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
  }, React.createElement(AdminOnlyMark, {
    rec: job
  }), job.name)), React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    style: {
      width: 32,
      height: 32,
      borderRadius: "var(--r-chip)",
      boxShadow: "var(--shadow-sm)",
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
          color: "var(--tint-red-tx2)"
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
      borderRadius: "var(--r-tile)",
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
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32"
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
        color: "var(--tint-red-tx2)"
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
      borderTop: "1px solid var(--divider)",
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
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-sm)",
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
      borderRadius: "var(--r-tile)",
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
function PermitJobSummary({
  job,
  onOpenReview
}) {
  const p = job.permit || null;
  const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
  const FLOW = window.PERMIT_FLOW || [];
  const idx = window.permitFlowIdx ? window.permitFlowIdx(job) : -1;
  const rejected = !!(p && p.status === "rejected");
  const color = pst ? pst.color : "#94A3B8";
  const missing = React.useMemo(() => {
    if (!p || !window.permitMissing) return [];
    try {
      return window.permitMissing(p, null).filter(m => m.kind === "field");
    } catch (e) {
      return [];
    }
  }, [p]);
  const blockers = [];
  if (rejected) blockers.push({
    tone: "bad",
    th: "ตีกลับให้ช่างแก้",
    detail: (p.rejectReason || "ไม่ได้ระบุเหตุผล") + (p.byAdmin ? " · โดย " + p.byAdmin : "")
  });
  if (!p || !p.status) blockers.push({
    tone: "warn",
    th: "ช่างยังไม่ได้เริ่มเก็บข้อมูลขออนุญาต",
    detail: "ยังไม่มีชุดข้อมูลให้ยื่น"
  });else if (p.status === "draft") blockers.push({
    tone: "warn",
    th: "ช่างยังเก็บข้อมูลไม่ครบ",
    detail: "ยังไม่ได้กดส่งให้ฝ่ายขออนุญาต"
  });
  if (missing.length) blockers.push({
    tone: "warn",
    th: "ข้อมูลยังขาด " + missing.length + " ช่อง",
    detail: missing.slice(0, 6).map(m => m.th).join(" · ") + (missing.length > 6 ? " …" : "")
  });
  if (!job.hasDesign) blockers.push({
    tone: "warn",
    th: "ยังไม่มีไฟล์แบบแนบกับงาน",
    detail: "SLD อยู่ในไฟล์แบบ ถ้าไม่มีจะยื่นไม่ได้"
  });
  if (job.problem) blockers.push({
    tone: "warn",
    th: "ปัญหาหน้างานที่ช่างบันทึกไว้",
    detail: String(job.problem)
  });
  const TONE = {
    bad: {
      bg: "var(--tint-red-bg)",
      bd: "var(--tint-red-bd)",
      tx: "var(--tint-red-tx)"
    },
    warn: {
      bg: "var(--tint-amber-bg)",
      bd: "#F59E0B55",
      tx: "#B45309"
    }
  };
  const Line = ({
    label,
    value
  }) => React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      padding: "7px 0",
      boxShadow: "inset 0 -1px 0 var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, label), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-1)",
      textAlign: "right",
      wordBreak: "break-word"
    }
  }, value || "—"));
  const s = job.survey || {};
  const filing = [["การไฟฟ้า", p && p.auth || s.meterAuth], ["สาขา / เขต", p && p.branch || s.branch], ["เลขที่ผู้ใช้ไฟ (CA)", p && p.ca || s.ca], ["หมายเลขมิเตอร์", p && p.meterNo || s.meterNo], ["ขนาดมิเตอร์", p && p.meterSize || s.meterSize], ["เสาไฟต้นที่", p && p.poleNo || s.poleNo], ["ระบบไฟฟ้า", (p && p.phase || s.phase || job.phase || "1") + " เฟส"], ["เมนเบรกเกอร์", p && p.mainAT ? p.mainAT + " AT / " + (p.mainAF || "—") + " AF" : s.mainBreaker], ["กำลังติดตั้ง", (p && p.kwp ? p.kwp : job.kw) + " kWp" + (p && p.kwac ? " · " + p.kwac + " kW AC" : "")], ["แผง", p && p.panelModel || s.panelModel ? (p && p.panelModel || s.panelModel) + " × " + (p && p.panelQty || job.panels || "—") : ""], ["อินเวอร์เตอร์", p && (p.invs || []).length ? p.invs.map(iv => iv.model || "—").join(" · ") : s.invModel || ""]];
  return React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderLeft: "3px solid " + color,
      borderRadius: "var(--r-tile)",
      padding: 16,
      marginBottom: 14
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginBottom: 12
    }
  }, React.createElement(Icon, {
    name: "shield",
    size: 16,
    color: color
  }), React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: color
    }
  }, pst ? pst.th : "ยังไม่เริ่มเก็บข้อมูล"), p && p.auth && React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\xB7 ", p.auth, p.branch ? " " + p.branch : "")), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, FLOW.map((st, i) => {
    const done = i < idx,
      now = i === idx;
    const c = rejected && now ? "#EF4444" : done || now ? "var(--primary)" : "var(--border-strong)";
    return React.createElement("span", {
      key: st.key,
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        height: 4,
        borderRadius: "var(--r-pill)",
        background: c,
        opacity: done ? .55 : 1
      }
    }), React.createElement("span", {
      style: {
        display: "block",
        marginTop: 5,
        fontSize: 9.5,
        lineHeight: 1.3,
        fontWeight: now ? 800 : 600,
        color: now ? rejected ? "#EF4444" : "var(--primary-dark)" : "var(--text-3)"
      }
    }, st.th));
  })), (() => {
    if (!p) return null;
    const filed = p.status === "filing" || p.status === "approved";
    const done = p.status === "approved";
    const bits = [];
    if (p.reqNo && filed) bits.push(React.createElement("span", {
      key: "r"
    }, "\u0E04\u0E33\u0E23\u0E49\u0E2D\u0E07 ", React.createElement("b", {
      style: {
        fontFamily: "var(--mono)"
      }
    }, p.reqNo)));
    if (p.filedDate && filed) bits.push(React.createElement("span", {
      key: "f"
    }, "\u0E22\u0E37\u0E48\u0E19 ", thDate(p.filedDate, true)));
    if (p.inspectDate && filed) bits.push(React.createElement("span", {
      key: "i"
    }, "\u0E19\u0E31\u0E14\u0E15\u0E23\u0E27\u0E08 ", thDate(p.inspectDate, true)));
    if (p.approvedDate && done) bits.push(React.createElement("span", {
      key: "a",
      style: {
        color: "var(--primary-dark)",
        fontWeight: 700
      }
    }, "\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34 ", thDate(p.approvedDate, true)));
    if (!bits.length) return null;
    return React.createElement("div", {
      style: {
        marginTop: 12,
        fontSize: 11.5,
        color: "var(--text-2)",
        display: "flex",
        gap: 12,
        flexWrap: "wrap"
      }
    }, bits);
  })()), onOpenReview && React.createElement("button", {
    onClick: onOpenReview,
    style: {
      width: "100%",
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "12px 14px",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    className: "ic-chip",
    style: {
      background: "#14B8A61c"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 17,
    color: "#14B8A6"
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
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E14\u0E39\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25/\u0E23\u0E39\u0E1B/\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E31\u0E49\u0E07\u0E0A\u0E38\u0E14 \xB7 \u0E40\u0E14\u0E34\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E30 \xB7 \u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A \xB7 \u0E2D\u0E2D\u0E01 PDF")), React.createElement(Icon, {
    name: "arrowRight",
    size: 16,
    color: "var(--text-3)"
  })), React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 9
    }
  }, "\u0E15\u0E34\u0E14\u0E2D\u0E30\u0E44\u0E23\u0E2D\u0E22\u0E39\u0E48"), blockers.length === 0 ? React.createElement("div", {
    style: {
      padding: "11px 13px",
      borderRadius: "var(--r-tile)",
      background: "var(--primary-soft)",
      border: "1px solid var(--primary)",
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, "\u0E44\u0E21\u0E48\u0E15\u0E34\u0E14\u0E2D\u0E30\u0E44\u0E23 \xB7 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E25\u0E30\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E1A\u0E1A\u0E04\u0E23\u0E1A\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E22\u0E37\u0E48\u0E19") : blockers.map((b, i) => {
    const t = TONE[b.tone];
    return React.createElement("div", {
      key: i,
      style: {
        marginBottom: 7,
        padding: "10px 12px",
        borderRadius: "var(--r-tile)",
        background: t.bg,
        border: "none"
      }
    }, React.createElement("div", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: t.tx
      }
    }, b.th), React.createElement("div", {
      style: {
        fontSize: 12,
        color: t.tx,
        marginTop: 3,
        lineHeight: 1.55
      }
    }, b.detail));
  })), React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 9
    }
  }, "\u0E44\u0E1F\u0E25\u0E4C\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E41\u0E19\u0E1A\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19"), window.PermitJobFiles ? React.createElement(window.PermitJobFiles, {
    jobId: job.id
  }) : null), React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      padding: 16,
      marginBottom: 18
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E23\u0E2D\u0E01\u0E43\u0E1A\u0E04\u0E33\u0E02\u0E2D"), filing.map(([label, value]) => React.createElement(Line, {
    key: label,
    label: label,
    value: value
  }))));
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
  onPermit,
  onDaily,
  onOm,
  omSite,
  omVisits,
  omTickets,
  onExpense,
  ecSum,
  priceMap,
  permitMode,
  onOpenReview,
  salesMode,
  quotes,
  leads,
  onOpenQuote,
  onBilling,
  onSaveBills,
  billRO,
  billRole,
  onHandover
}) {
  const SF = window.SF;
  const roMode = permitMode || salesMode;
  const open = !!job;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const media = useJobMedia(job ? job.id : null);
  const dvs = window.useDesignVersions({
    job,
    activeBoq: job && job.boq || null,
    currentUser,
    patchActive: onSaveBOQ && job ? b => onSaveBOQ(job.id, b) : null,
    BoqEditor: BOQEditor,
    editorProps: {
      priceMap,
      stock
    },
    P3Entry: window.Plan3DEntry,
    ro: !onSaveBOQ
  });
  const [planOpen, setPlanOpen] = React.useState(false);
  const [tab, setTabRaw] = React.useState("ov");
  const bodyRef = React.useRef(null);
  const setTab = k => {
    setTabRaw(k);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  };
  React.useEffect(() => {
    setTabRaw("ov");
  }, [job ? job.id : null]);
  const [irOpen, setIrOpen] = React.useState(false);
  const inspections = useDrInspections(job ? job.id : null);
  const [specOpen, setSpecOpen] = React.useState(false);
  const [histOpen, setHistOpen] = React.useState(false);
  const [matPick, setMatPick] = React.useState(null);
  React.useEffect(() => {
    setPlanOpen(false);
    setIrOpen(false);
    setSpecOpen(false);
    setHistOpen(false);
    setMatPick(null);
  }, [job ? job.id : null]);
  const [advancing, setAdvancing] = React.useState(false);
  React.useEffect(() => {
    setAdvancing(false);
  }, [job ? job.stage : null]);
  const handleAdvance = () => {
    if (advancing) return;
    const next = SF.STAGES[Math.min(job.stageIdx + 1, SF.STAGES.length - 1)];
    const id = job.id;
    const body = [job.code + " · " + job.name, next.key === "done" && job.problem ? "ปัญหาหน้างานที่บันทึกไว้จะถูกล้างออก" : "", "กดพลาดย้อนได้ด้วยการลากการ์ดบนบอร์ดกลับขั้นเดิม"].filter(Boolean).join("\n");
    window.askConfirm({
      title: "เลื่อนงานไปขั้น \"" + next.th + "\"?",
      body,
      ok: "เลื่อนขั้น",
      danger: false,
      icon: "arrowRight"
    }).then(ok => {
      if (!ok) return;
      setAdvancing(true);
      onAdvance(id);
      setTimeout(() => setAdvancing(false), 6000);
    });
  };
  const TABS = !job ? [] : [{
    k: "ov",
    th: "ภาพรวม",
    ic: "grid"
  }, (onDaily || onExpense || onSurvey || onHandover || onPermit || onOm && window.OmJobButton || window.InspectionListModal && !roMode) && {
    k: "site",
    th: "หน้างาน",
    ic: "wrench",
    alert: (job.permit || {}).status === "rejected" ? "ขออนุญาตถูกตีกลับ" : job.stage === "done" && job.pmHandover && +job.pmHandover.pct < 100 ? "ส่งมอบยังไม่ครบ" : ""
  }, !roMode && {
    k: "dm",
    th: "แบบ & วัสดุ",
    ic: "panel",
    n: job.matReadyPct != null ? job.matReadyPct + "%" : null
  }, (!roMode || onBilling && window.BlJobCard) && {
    k: "docs",
    th: "เอกสาร",
    ic: "file"
  }, {
    k: "chat",
    th: "รูป & คุย",
    ic: "camera",
    n: (media.photos || []).length || null
  }].filter(Boolean);
  const tabNow = TABS.some(t => t.k === tab) ? tab : "ov";
  const alerts = [];
  if (job) {
    if (job.problem && job.stage !== "done") alerts.push({
      tone: "bad",
      icon: "alert",
      th: "ปัญหาหน้างาน",
      tx: String(job.problem)
    });
    const lateInst = (job.lateStages || []).find(ls => ls.key === "install");
    if (lateInst) alerts.push({
      tone: "bad",
      icon: "clock",
      th: "ติดตั้งเลยกำหนด " + lateInst.daysLate + " วัน",
      tx: ""
    });
    const siteTab = TABS.find(t => t.k === "site");
    if (siteTab && siteTab.alert) alerts.push({
      tone: "bad",
      icon: "shield",
      th: siteTab.alert,
      tx: "แตะเพื่อดูในแท็บหน้างาน",
      go: "site"
    });
    if (!job.eeName && job.stage !== "done" && !roMode) alerts.push({
      tone: "warn",
      icon: "user",
      th: "ยังไม่ระบุวิศวกรผู้รับผิดชอบ",
      tx: "รายงานประจำวันที่ช่างส่งจะไม่มีใครอนุมัติ" + (onEdit ? " · ระบุได้ที่ แก้ไขข้อมูล" : "")
    });
    if (job.note) alerts.push({
      tone: "note",
      icon: "message",
      th: "หมายเหตุ",
      tx: String(job.note)
    });
  }
  const ALERT_TONE = {
    bad: {
      bg: "var(--tint-red-bg)",
      tx: "var(--tint-red-tx)",
      ic: "#EF4444"
    },
    warn: {
      bg: "var(--tint-amber-bg)",
      tx: "var(--tint-amber-tx)",
      ic: "#F59E0B"
    },
    note: {
      bg: "var(--surface)",
      tx: "var(--text-2)",
      ic: "var(--text-3)",
      sh: "var(--shadow-sm)"
    }
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
      transition: "opacity .45s ease",
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
      transition: open ? "transform .56s cubic-bezier(.22,1,.36,1)" : "transform .38s cubic-bezier(.4,0,.2,1)",
      display: "flex",
      flexDirection: "column"
    }
  }, job && React.createElement(React.Fragment, null, !isMobile && React.createElement("div", {
    className: "jd-stabs",
    role: "tablist",
    "aria-orientation": "vertical"
  }, TABS.map((t, i) => React.createElement("button", {
    key: t.k,
    role: "tab",
    "aria-selected": tabNow === t.k,
    className: "jd-stab" + (tabNow === t.k ? " on" : ""),
    style: {
      zIndex: tabNow === t.k ? 10 : TABS.length - i
    },
    onClick: () => setTab(t.k),
    title: t.alert || t.th
  }, React.createElement("span", {
    className: "jd-stab-tx"
  }, t.th, t.n ? React.createElement("span", {
    className: "ld-tab-n"
  }, t.n) : null, t.alert ? React.createElement("span", {
    className: "ld-tab-dot"
  }) : null)))), React.createElement("div", {
    style: {
      padding: isMobile ? "15px 16px 10px" : "20px 24px",
      borderBottom: isMobile ? "none" : "1px solid var(--divider)",
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
      color: "var(--tint-red-tx2)",
      background: "var(--tint-red-bg2)",
      padding: "2px 8px",
      borderRadius: 6
    }
  }, "\u26A0 \u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32"), React.createElement(AdminHideBtn, {
    rec: job,
    path: "jobs/" + job.id
  })), React.createElement("h2", {
    style: {
      fontSize: isMobile ? 17 : 20,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0,
      lineHeight: 1.25
    }
  }, React.createElement(AdminOnlyMark, {
    rec: job
  }), job.name)), React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14",
    "aria-label": "\u0E1B\u0E34\u0E14",
    style: {
      width: 36,
      height: 36,
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-sm)",
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
  }))), (() => {
    const tel = job.phone ? String(job.phone).split(/[,/|]| หรือ /)[0].replace(/[^0-9+]/g, "") : "";
    const addr = [job.address, job.province].filter(Boolean).join(" ");
    const mapUrl = job.map || (addr ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr) : "");
    if (!tel && !mapUrl && !job.drive) return null;
    return React.createElement("div", {
      className: "jd-quick"
    }, tel && React.createElement("a", {
      className: "btn btn-sm",
      href: "tel:" + tel,
      title: "โทร " + job.phone
    }, React.createElement(Icon, {
      name: "phone",
      size: 14,
      color: "var(--primary)"
    }), isMobile ? "โทร" : React.createElement("span", {
      className: "jd-quick-tx"
    }, job.phone)), mapUrl && React.createElement("a", {
      className: "btn btn-sm",
      href: mapUrl,
      target: "_blank",
      rel: "noreferrer",
      title: "\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"
    }, React.createElement(Icon, {
      name: "pin",
      size: 14,
      color: "var(--primary)"
    }), "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"), job.drive && React.createElement("a", {
      className: "btn btn-sm",
      href: job.drive,
      target: "_blank",
      rel: "noreferrer",
      title: "\u0E40\u0E1B\u0E34\u0E14\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E07\u0E32\u0E19 Google Drive"
    }, React.createElement(Icon, {
      name: "folder",
      size: 14,
      color: "var(--primary)"
    }), "Drive"));
  })(), React.createElement("div", {
    style: {
      marginTop: 14,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, permitMode ? (() => {
    const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
    const n = (window.PERMIT_FLOW || []).length || 4;
    const idx = window.permitFlowIdx ? window.permitFlowIdx(job) : -1;
    const pct = idx < 0 ? 0 : Math.round((idx + 1) / n * 100);
    const c = pst ? pst.color : "#94A3B8";
    return React.createElement(React.Fragment, null, React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: c,
        background: c + "16",
        border: "none",
        borderRadius: "var(--r-pill)",
        padding: "4px 11px",
        whiteSpace: "nowrap"
      }
    }, pst ? pst.th : "ยังไม่เริ่มเก็บข้อมูล"), React.createElement("div", {
      style: {
        flex: 1
      }
    }, React.createElement(ProgressBar, {
      pct: pct,
      color: c
    })), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--text-2)"
      }
    }, pct, "%"));
  })() : React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement(DrStageSteps, {
    job: job
  })))), isMobile && React.createElement("div", {
    style: {
      background: "var(--surface)",
      paddingLeft: 10,
      flexShrink: 0
    }
  }, React.createElement("div", {
    className: "ld-tabs jd-mtabs",
    role: "tablist"
  }, TABS.map((t, i) => React.createElement("button", {
    key: t.k,
    role: "tab",
    "aria-selected": tabNow === t.k,
    className: "ld-tab" + (tabNow === t.k ? " on" : ""),
    style: {
      zIndex: tabNow === t.k ? 10 : TABS.length - i
    },
    onClick: () => setTab(t.k)
  }, t.th, t.n ? React.createElement("span", {
    className: "ld-tab-n"
  }, t.n) : null, t.alert ? React.createElement("span", {
    className: "ld-tab-dot",
    title: t.alert
  }) : null)))), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      position: "relative",
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement("div", {
    ref: bodyRef,
    style: {
      overflowY: "auto",
      flex: 1,
      padding: isMobile ? "16px 15px" : "22px 24px"
    }
  }, tabNow === "ov" && React.createElement(React.Fragment, null, alerts.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: isMobile ? 14 : 16
    }
  }, alerts.map((a, i) => {
    const t = ALERT_TONE[a.tone];
    const Tag = a.go ? "button" : "div";
    return React.createElement(Tag, {
      key: i,
      onClick: a.go ? () => setTab(a.go) : undefined,
      style: {
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: "var(--r-tile)",
        border: "none",
        background: t.bg,
        boxShadow: t.sh || "none",
        textAlign: "left",
        fontFamily: "inherit",
        width: "100%",
        cursor: a.go ? "pointer" : "default"
      }
    }, React.createElement("span", {
      style: {
        width: 18,
        height: 20,
        flexShrink: 0,
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: a.icon,
      size: 15,
      color: t.ic
    })), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 12.5,
        fontWeight: 800,
        color: a.tone === "note" ? "var(--text-1)" : t.tx
      }
    }, a.th), a.tx && React.createElement("span", {
      style: {
        display: "block",
        fontSize: 12.5,
        color: t.tx,
        marginTop: 2,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere"
      }
    }, a.tx)), a.go && React.createElement(Icon, {
      name: "arrowRight",
      size: 15,
      color: t.tx,
      style: {
        flexShrink: 0,
        marginTop: 2
      }
    }));
  })), (() => {
    const v = job.stageDates && job.stageDates.install;
    const st = v ? typeof v === "object" ? v.start || v.end : v : job.deadline;
    const en = v && typeof v === "object" ? v.end : null;
    const addr = [job.address, job.province].filter(Boolean).join(", ");
    const tech = job.tech && window.SF.TECH_BY_ID && window.SF.TECH_BY_ID[job.tech];
    const people = [tech && React.createElement(DrPair, {
      key: "t",
      label: "\u0E0A\u0E48\u0E32\u0E07"
    }, React.createElement(TechAvatar, {
      techId: job.tech,
      size: 22,
      showName: true
    })), job.eeName && React.createElement(DrPair, {
      key: "e",
      label: "\u0E27\u0E34\u0E28\u0E27\u0E01\u0E23"
    }, React.createElement("span", null, job.eeName, job.eeIsTech && React.createElement("span", {
      style: {
        marginLeft: 6,
        fontSize: 10.5,
        fontWeight: 700,
        color: "var(--primary-dark)",
        background: "var(--primary-soft)",
        borderRadius: "var(--r-pill)",
        padding: "2px 8px",
        whiteSpace: "nowrap"
      }
    }, "\u0E25\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E40\u0E2D\u0E07\u0E14\u0E49\u0E27\u0E22"))), job.salesName && React.createElement(DrPair, {
      key: "s",
      label: "\u0E40\u0E0B\u0E25\u0E25\u0E4C"
    }, job.salesName)].filter(Boolean);
    const crew = roMode ? [] : [job.contractor && React.createElement(DrPair, {
      key: "c",
      label: "\u0E17\u0E35\u0E21\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32"
    }, job.contractor), job.laborCost ? React.createElement(DrPair, {
      key: "l",
      label: "\u0E04\u0E48\u0E32\u0E41\u0E23\u0E07"
    }, Number(job.laborCost).toLocaleString(), " \u0E1A\u0E32\u0E17") : null].filter(Boolean);
    return React.createElement("div", {
      style: {
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        borderRadius: "var(--r-tile)",
        padding: isMobile ? "10px 13px" : "12px 16px",
        marginBottom: isMobile ? 14 : 16
      }
    }, React.createElement(DrLine, {
      icon: "calendar",
      muted: !st
    }, st ? React.createElement(React.Fragment, null, React.createElement("span", {
      style: {
        color: "var(--text-3)",
        fontSize: 12,
        fontWeight: 600,
        marginRight: 6
      }
    }, "\u0E19\u0E31\u0E14\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"), thDate(st, true), en && en !== st ? " – " + thDate(en, true) : "") : "ยังไม่นัดวันติดตั้ง"), addr && React.createElement(DrLine, {
      icon: "pin"
    }, addr), people.length > 0 && React.createElement(DrLine, {
      icon: "users"
    }, React.createElement("span", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        rowGap: 4
      }
    }, people)), crew.length > 0 && React.createElement(DrLine, {
      icon: "wrench"
    }, React.createElement("span", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        rowGap: 4
      }
    }, crew)));
  })(), permitMode && React.createElement(PermitJobSummary, {
    job: job,
    onOpenReview: onOpenReview
  }), salesMode && window.SalesJobSummary && React.createElement(window.SalesJobSummary, {
    job: job,
    quotes: quotes,
    leads: leads,
    onOpenQuote: onOpenQuote
  }), (() => {
    const line = [job.brand, job.kw != null && job.kw !== "" ? job.kw + " kW" : "", job.panels ? job.panels + " แผง" : "", window.SF.phaseOf(job) + " เฟส", job.battery ? "แบต " + (job.batSize || "") : "", job.backup ? "Backup" : ""].filter(Boolean).join(" · ");
    return React.createElement("div", {
      style: {
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        borderRadius: "var(--r-tile)",
        marginBottom: isMobile ? 14 : 16,
        overflow: "hidden"
      }
    }, React.createElement("button", {
      onClick: () => setSpecOpen(o => !o),
      "aria-expanded": specOpen,
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: isMobile ? "12px 13px" : "13px 16px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        width: 18,
        height: 20,
        flexShrink: 0,
        display: "grid",
        placeItems: "center"
      }
    }, React.createElement(Icon, {
      name: "sun",
      size: 15,
      color: "var(--primary)"
    })), React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11.5,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, "\u0E2A\u0E40\u0E1B\u0E01\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("span", {
      style: {
        display: "block",
        fontSize: 13.5,
        fontWeight: 700,
        color: "var(--text-1)",
        marginTop: 2,
        overflowWrap: "anywhere"
      }
    }, line || "ยังไม่ระบุ")), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 12,
        fontWeight: 700,
        color: "var(--primary)",
        whiteSpace: "nowrap"
      }
    }, specOpen ? "ย่อ" : "ดูทั้งหมด", React.createElement(Icon, {
      name: "chevronDown",
      size: 14,
      color: "var(--primary)",
      style: {
        transform: specOpen ? "rotate(180deg)" : "none",
        transition: "transform .18s"
      }
    }))), specOpen && React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
        gap: isMobile ? 14 : 16,
        padding: isMobile ? "4px 13px 14px 41px" : "4px 16px 16px 44px"
      }
    }, React.createElement(SpecItem, {
      label: "\u0E41\u0E1A\u0E23\u0E19\u0E14\u0E4C",
      value: job.brand
    }), React.createElement(SpecItem, {
      label: "\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07",
      value: job.panelModel || "ยังไม่ระบุ"
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
      value: window.SF.phaseOf(job) + " เฟส"
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
    })));
  })(), !salesMode && onOpenQuote && window.SalesQuoteList && React.createElement(window.SalesQuoteList, {
    job: job,
    quotes: quotes,
    leads: leads,
    onOpenQuote: onOpenQuote,
    card: true
  })), tabNow === "site" && (() => {
    const surveyRow = onSurvey && (() => {
      const ss = window.surveyStatus ? window.surveyStatus(job) : {
        state: "none",
        pct: 0,
        label: "ยังไม่สำรวจ",
        color: "var(--text-3)"
      };
      return React.createElement("div", {
        key: "survey",
        className: "act-row",
        role: "button",
        tabIndex: 0,
        onClick: onSurvey,
        onKeyDown: e => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSurvey();
          }
        }
      }, React.createElement("span", {
        className: "ic-chip",
        style: {
          background: String(ss.color).indexOf("var(") === 0 ? "color-mix(in srgb, " + ss.color + " 12%, transparent)" : ss.color + "1c"
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
      }, ss.state === "none" ? "ยังไม่ได้สำรวจ · แตะเพื่อเริ่ม" : ss.label + " · " + ss.pct + "% · แตะเพื่อแก้ไข")), onSurveyReport && ss.state !== "none" && React.createElement("button", {
        className: "btn btn-sm btn-soft",
        onClick: e => {
          e.stopPropagation();
          onSurveyReport();
        },
        title: "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1C\u0E25\u0E2A\u0E33\u0E23\u0E27\u0E08 \xB7 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF"
      }, React.createElement(Icon, {
        name: "file",
        size: 13,
        color: "var(--primary-dark)"
      }), " PDF"), React.createElement(Icon, {
        name: "arrowRight",
        size: 16,
        color: "var(--text-3)"
      }));
    })();
    const planRow = false && window.SitePlanEditor && React.createElement("button", {
      key: "plan",
      onClick: () => setPlanOpen(true),
      className: "act-row"
    }, React.createElement("span", {
      className: "ic-chip",
      style: {
        background: "#0EA5E91c"
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
    }));
    const irRow = window.InspectionListModal && !roMode && (() => {
      const st = window.irJobSummary ? window.irJobSummary(inspections.list) : null;
      return React.createElement("button", {
        key: "ir",
        onClick: () => setIrOpen(true),
        className: "act-row"
      }, React.createElement("span", {
        className: "ic-chip",
        style: {
          background: "#0EA5E91c"
        }
      }, React.createElement(Icon, {
        name: "clipboard",
        size: 17,
        color: "#0284C7"
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
      }, "\u0E43\u0E1A\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E07\u0E32\u0E19 (Inspection Report)"), React.createElement("span", {
        style: {
          display: "block",
          fontSize: 11.5,
          color: st ? st.color : "var(--text-3)",
          fontWeight: st && st.bold ? 700 : 400
        }
      }, st ? st.label : "แตะเพื่อสร้าง")), React.createElement(Icon, {
        name: "arrowRight",
        size: 16,
        color: "var(--text-3)"
      }));
    })();
    const handoverRow = onHandover && (() => {
      const hs = window.pmCardStatus ? window.pmCardStatus(job) : null;
      return React.createElement("button", {
        key: "handover",
        onClick: onHandover,
        className: "act-row"
      }, React.createElement("span", {
        className: "ic-chip",
        style: {
          background: "#16A34A1c"
        }
      }, React.createElement(Icon, {
        name: "check",
        size: 17,
        color: "#16A34A"
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
      }, "\u0E2A\u0E48\u0E07\u0E21\u0E2D\u0E1A\u0E23\u0E30\u0E1A\u0E1A (Commissioning & Handover)"), React.createElement("span", {
        style: {
          display: "block",
          fontSize: 11.5,
          color: hs ? hs.color : "var(--text-3)",
          fontWeight: hs && hs.bold ? 700 : 400
        }
      }, hs ? hs.label : "แตะเพื่อเปิดสมุดส่งมอบ")), React.createElement(Icon, {
        name: "arrowRight",
        size: 16,
        color: "var(--text-3)"
      }));
    })();
    const permitRow = onPermit && (() => {
      const pm = job.permit || null;
      const pst = window.permitStatusOf ? window.permitStatusOf(job) : null;
      const FLOW = window.PERMIT_FLOW || [];
      const idx = window.permitFlowIdx ? window.permitFlowIdx(job) : -1;
      const rejected = !!(pm && pm.status === "rejected");
      const pc = pst ? pst.color : "#14B8A6";
      return React.createElement("div", {
        key: "permit",
        className: "jd-pcard",
        style: {
          marginBottom: 9,
          background: "var(--surface)",
          borderRadius: "var(--r-tile)",
          overflow: "hidden",
          boxShadow: rejected ? "inset 0 0 0 1px var(--tint-red-bd), var(--shadow-sm)" : "var(--shadow-sm)"
        }
      }, React.createElement("button", {
        onClick: onPermit,
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left"
        }
      }, React.createElement("span", {
        className: "ic-chip",
        style: {
          background: pc + "1c"
        }
      }, React.createElement(Icon, {
        name: "shield",
        size: 17,
        color: pc
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
      }, "\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32"), React.createElement("span", {
        style: {
          display: "block",
          fontSize: 11.5,
          color: pst ? pst.color : "var(--text-3)",
          fontWeight: pst ? 700 : 400
        }
      }, pst ? pst.th + (pm && pm.auth ? " · " + pm.auth : "") : "ยังไม่ได้เริ่มเก็บ · แตะเพื่อเริ่ม")), React.createElement(Icon, {
        name: "arrowRight",
        size: 16,
        color: "var(--text-3)"
      })), idx >= 0 && React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          padding: "0 16px 13px"
        }
      }, FLOW.map((st, i) => {
        const done = i < idx,
          now = i === idx;
        const c = rejected && now ? "#EF4444" : done || now ? "var(--primary)" : "var(--border-strong)";
        return React.createElement("span", {
          key: st.key,
          style: {
            flex: 1,
            minWidth: 0
          }
        }, React.createElement("span", {
          style: {
            display: "block",
            height: 4,
            borderRadius: "var(--r-pill)",
            background: c,
            opacity: done ? .55 : 1
          }
        }), React.createElement("span", {
          style: {
            display: "block",
            marginTop: 5,
            fontSize: 10.5,
            lineHeight: 1.3,
            fontWeight: now ? 800 : 600,
            color: now ? rejected ? "#EF4444" : "var(--primary-dark)" : "var(--text-3)"
          }
        }, st.th));
      })), rejected && React.createElement("div", {
        style: {
          margin: "0 12px 12px",
          padding: "10px 12px",
          borderRadius: "var(--r-tile)",
          background: "var(--tint-red-bg)"
        }
      }, React.createElement("div", {
        style: {
          fontSize: 12,
          fontWeight: 800,
          color: "var(--tint-red-tx)"
        }
      }, "\u21A9 \u0E1D\u0E48\u0E32\u0E22\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E15\u0E35\u0E01\u0E25\u0E31\u0E1A \u0E15\u0E49\u0E2D\u0E07\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E21\u0E48"), React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--tint-red-tx)",
          marginTop: 4,
          lineHeight: 1.55
        }
      }, pm.rejectReason || "ไม่ได้ระบุเหตุผล — สอบถามฝ่ายขออนุญาต"), (pm.byAdmin || pm.statusAt) && React.createElement("div", {
        style: {
          fontSize: 11,
          color: "var(--tint-red-tx)",
          opacity: .8,
          marginTop: 4
        }
      }, pm.byAdmin ? "โดย " + pm.byAdmin : "", pm.statusAt ? " · " + thDate(String(pm.statusAt).slice(0, 10), true) : ""), React.createElement("button", {
        onClick: onPermit,
        style: {
          marginTop: 9,
          padding: "8px 14px",
          borderRadius: "var(--r-chip)",
          border: "none",
          background: "#EF4444",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer"
        }
      }, "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E49\u0E27\u0E2A\u0E48\u0E07\u0E43\u0E2B\u0E21\u0E48")), pm && pm.status === "approved" && React.createElement("div", {
        style: {
          margin: "0 12px 12px",
          padding: "9px 12px",
          borderRadius: "var(--r-tile)",
          background: "var(--primary-soft)",
          fontSize: 11.5,
          color: "var(--primary-dark)",
          fontWeight: 700
        }
      }, "\u2714 \u0E01\u0E32\u0E23\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E41\u0E25\u0E49\u0E27", pm.approvedDate ? " · " + thDate(pm.approvedDate, true) : "", pm.reqNo ? " · คำร้อง " + pm.reqNo : ""));
    })();
    const groups = [{
      k: "pre",
      th: "ก่อนติดตั้ง",
      items: [surveyRow, planRow]
    }, {
      k: "mid",
      th: "ระหว่างติดตั้ง",
      items: [onDaily && React.createElement(DailyJobButton, {
        key: "daily",
        job: job,
        onOpen: onDaily
      }), onExpense && window.EcJobButton && React.createElement(window.EcJobButton, {
        key: "ec",
        job: job,
        sum: ecSum,
        onOpen: onExpense
      }), irRow]
    }, {
      k: "post",
      th: "หลังติดตั้ง",
      items: [handoverRow, permitRow, onOm && (job.stage === "done" || omSite) && window.OmJobButton && React.createElement(window.OmJobButton, {
        key: "om",
        job: job,
        site: omSite,
        visits: omVisits,
        tickets: omTickets,
        onOpen: onOm
      })]
    }].map(g => Object.assign({}, g, {
      items: g.items.filter(Boolean)
    })).filter(g => g.items.length);
    return groups.map((g, gi) => React.createElement("div", {
      key: g.k,
      style: {
        marginBottom: gi < groups.length - 1 ? 16 : 4
      }
    }, React.createElement("div", {
      className: "jd-sec"
    }, g.th), g.items));
  })(), tabNow === "dm" && !roMode && React.createElement(React.Fragment, null, window.Plan3DEntry && React.createElement(window.DvVerCard, {
    kind: "p3",
    dvs: dvs,
    icon: "panel",
    color: "#4F46E5",
    canNew: true,
    title: "\u0E41\u0E1A\u0E1A 3D \xB7 \u0E27\u0E32\u0E07\u0E41\u0E1C\u0E07",
    sub: "\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 \xB7 \u0E41\u0E1C\u0E07 \xB7 \u0E40\u0E07\u0E32\u0E41\u0E14\u0E14 \xB7 \u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A"
  }, window.ErRoomCard && window.hasRole(window.userRoles(currentUser), "admin") && React.createElement(window.ErRoomCard, {
    inline: true,
    job: job,
    p3List: dvs.p3List,
    canEdit: true
  })), React.createElement(window.DvVerCard, {
    kind: "boq",
    dvs: dvs,
    icon: "box",
    color: "var(--primary-dark)",
    canNew: !!onSaveBOQ,
    title: "\u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38 BOQ",
    sub: "\u0E43\u0E1A\u0E25\u0E30\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E41\u0E1A\u0E1A 3D"
  }), React.createElement("div", {
    style: {
      marginTop: 18,
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
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)",
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
      fontSize: 11,
      fontWeight: 500,
      color: "var(--text-3)",
      marginLeft: 2
    }
  }, "\xB7 \u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30")), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8
    }
  }, React.createElement("span", {
    className: "mbar",
    style: {
      width: 54,
      height: 6,
      "--fill": job.matReady ? "var(--primary)" : "#F59E0B"
    }
  }, React.createElement("i", {
    style: {
      width: job.matReadyPct + "%"
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
      alignItems: "start",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden",
      background: "var(--surface)"
    }
  }, SF.MATERIALS.filter(m => {
    if (m.key === "battery" && !job.battery) return false;
    if (m.key === "backup" && !job.backup) return false;
    return true;
  }).map((m, i) => {
    const cur = job.mat[m.key];
    const open = matPick === m.key;
    return React.createElement("div", {
      key: m.key,
      style: {
        alignSelf: "stretch",
        background: open ? "var(--surface2)" : "transparent",
        boxShadow: "inset 0 -1px 0 var(--border)" + (!isMobile && i % 2 === 0 ? ", inset -1px 0 0 var(--border)" : "")
      }
    }, React.createElement("button", {
      onClick: () => setMatPick(open ? null : m.key),
      "aria-expanded": open,
      title: "\u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E16\u0E32\u0E19\u0E30",
      className: "jd-matrow",
      style: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        background: "transparent",
        border: 0,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "var(--text-1)",
        fontWeight: 600
      }
    }, m.th), React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4
      }
    }, React.createElement(MatChip, {
      status: cur
    }), React.createElement(Icon, {
      name: "chevronDown",
      size: 13,
      color: "var(--text-3)",
      style: {
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform .18s"
      }
    }))), open && React.createElement("div", {
      role: "group",
      "aria-label": "สถานะ " + m.th,
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "0 12px 11px"
      }
    }, ["none", "waiting", "ready", "na"].map(st => {
      const on = (SF.MAT_STATUS[cur] ? cur : "none") === st;
      return React.createElement("button", {
        key: st,
        "aria-pressed": on,
        onClick: () => {
          if (st !== cur) onSetMat(job.id, m.key, st);
          setMatPick(null);
        },
        style: {
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          borderRadius: "var(--r-pill)",
          boxShadow: on ? "0 0 0 2px var(--primary)" : "none"
        }
      }, React.createElement(MatChip, {
        status: st
      }));
    })));
  }))), React.createElement(JobMaterialUsage, {
    job: job,
    stock: stock,
    currentUser: currentUser
  })), tabNow === "docs" && onBilling && window.BlJobCard && React.createElement(window.BlJobCard, {
    job: job,
    quotes: quotes,
    leads: leads,
    role: billRole || [],
    currentUser: currentUser,
    readOnly: billRO,
    onOpen: onBilling,
    onSaveBills: onSaveBills
  }), tabNow === "ov" && !roMode && React.createElement("div", {
    style: {
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-tile)",
      overflow: "hidden",
      marginBottom: 8
    }
  }, React.createElement("button", {
    onClick: () => setHistOpen(o => !o),
    "aria-expanded": histOpen,
    style: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: isMobile ? "12px 13px" : "13px 16px",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, React.createElement("span", {
    style: {
      width: 18,
      height: 20,
      flexShrink: 0,
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "history",
    size: 15,
    color: "var(--text-3)"
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
  }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19"), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E27\u0E31\u0E19\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E41\u0E15\u0E48\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19")), React.createElement(Icon, {
    name: "chevronDown",
    size: 15,
    color: "var(--text-3)",
    style: {
      transform: histOpen ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  })), histOpen && React.createElement("div", {
    style: {
      padding: isMobile ? "4px 13px 16px" : "4px 16px 18px"
    }
  }, React.createElement(FlowTimeline, {
    job: job
  }))), tabNow === "docs" && !roMode && React.createElement(JobFiles, {
    media: media,
    currentUser: currentUser,
    canManage: canManage
  }), tabNow === "chat" && React.createElement(React.Fragment, null, React.createElement(JobPhotos, {
    media: media,
    currentUser: currentUser,
    canManage: canManage,
    readOnly: roMode
  }), React.createElement(JobComments, {
    media: media,
    currentUser: currentUser,
    canManage: canManage
  })))), React.createElement("div", {
    style: {
      padding: isMobile ? "12px 16px" : "14px 24px",
      paddingBottom: "calc(" + (isMobile ? 12 : 14) + "px + env(safe-area-inset-bottom, 0px))",
      borderTop: "1px solid var(--divider)",
      background: "var(--surface)",
      display: "flex",
      gap: isMobile ? 8 : 10,
      flexShrink: 0
    }
  }, !salesMode && onEdit && React.createElement("button", {
    onClick: () => onEdit(job.id),
    title: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "aria-label": "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    style: {
      flex: !roMode && job.stage !== "done" ? "0 0 auto" : permitMode ? "0 0 auto" : 1,
      padding: isMobile ? "0 14px" : "11px 16px",
      height: isMobile ? 42 : "auto",
      borderRadius: "var(--r-tile)",
      boxShadow: "var(--shadow-sm)",
      background: "var(--surface)",
      color: "var(--text-1)",
      fontWeight: 600,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      whiteSpace: "nowrap",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 15,
    color: "var(--text-2)"
  }), isMobile ? "แก้ไข" : "แก้ไขข้อมูล"), permitMode && React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      color: "var(--text-3)",
      textAlign: "center",
      lineHeight: 1.4
    }
  }, "\u0E41\u0E01\u0E49\u0E2A\u0E16\u0E32\u0E19\u0E30\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E02\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15"), salesMode && React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      color: "var(--text-3)",
      textAlign: "center",
      lineHeight: 1.4
    }
  }, "\u0E14\u0E39\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \xB7 \u0E44\u0E27\u0E49\u0E15\u0E2D\u0E1A\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E27\u0E48\u0E32\u0E07\u0E32\u0E19\u0E16\u0E36\u0E07\u0E44\u0E2B\u0E19\u0E41\u0E25\u0E49\u0E27"), !roMode && job.stage !== "done" && React.createElement("button", {
    onClick: handleAdvance,
    disabled: advancing,
    style: {
      flex: 1,
      minWidth: 0,
      padding: isMobile ? "11px 14px" : "11px 16px",
      height: isMobile ? 42 : "auto",
      borderRadius: "var(--r-tile)",
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
  })))))), job && dvs.ui, planOpen && job && window.SitePlanEditor && React.createElement(window.SitePlanEditor, {
    job: job,
    currentUser: currentUser,
    onClose: () => setPlanOpen(false)
  }), irOpen && job && window.InspectionListModal && React.createElement(window.InspectionListModal, {
    job: job,
    currentUser: currentUser,
    onClose: () => setIrOpen(false)
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
