const FL_GRP_KEY = "pg-boardgroups";
const flReadCollapsed = () => {
  try {
    const v = JSON.parse(localStorage.getItem(FL_GRP_KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    return {};
  }
};
function FlCol({
  col,
  count,
  isOver,
  dimmed,
  sub,
  onDragOver,
  onDragLeave,
  onDrop,
  children
}) {
  return React.createElement("div", {
    onDragOver: onDragOver,
    onDragLeave: onDragLeave,
    onDrop: onDrop,
    style: {
      width: 262,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      borderRadius: 18,
      background: isOver ? col.soft : "var(--surface2)",
      border: "1px solid " + (isOver ? col.color : "var(--border)"),
      opacity: dimmed ? 0.5 : 1,
      transition: "background .15s, border-color .15s, opacity .15s"
    }
  }, React.createElement("div", {
    style: {
      padding: "12px 14px",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 1,
      background: isOver ? col.soft : "var(--surface2)",
      borderRadius: "17px 17px 0 0",
      transition: "background .15s"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 99,
      background: col.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: ".05em",
      color: "var(--text-2)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, col.th)), React.createElement("span", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "-.02em",
      color: count ? "var(--text-1)" : "var(--text-3)",
      fontVariantNumeric: "tabular-nums"
    }
  }, count)), sub && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 3,
      fontVariantNumeric: "tabular-nums"
    }
  }, sub)), React.createElement("div", {
    style: {
      padding: 11,
      display: "flex",
      flexDirection: "column",
      gap: 11,
      overflowY: "auto",
      flex: 1,
      minHeight: 80
    }
  }, children, count === 0 && React.createElement("div", {
    style: {
      padding: "20px 0",
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)",
      border: "1.5px dashed var(--border-strong)",
      borderRadius: 10
    }
  }, isOver ? "วางที่นี่" : "ว่าง")));
}
function FlGroup({
  g,
  count,
  collapsed,
  onToggle,
  children
}) {
  if (collapsed) {
    return React.createElement("button", {
      onClick: onToggle,
      title: "กางช่วง " + g.th,
      style: {
        width: 52,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "14px 0",
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "var(--surface2)",
        cursor: "pointer",
        fontFamily: "inherit"
      }
    }, React.createElement(Icon, {
      name: "chevronDown",
      size: 16,
      color: "var(--text-3)",
      style: {
        transform: "rotate(-90deg)"
      }
    }), React.createElement("span", {
      style: {
        fontFamily: "var(--display)",
        fontSize: 15,
        fontWeight: 700,
        color: "var(--text-1)",
        fontVariantNumeric: "tabular-nums"
      }
    }, count), React.createElement("span", {
      style: {
        writingMode: "vertical-rl",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".08em",
        color: "var(--text-2)",
        whiteSpace: "nowrap"
      }
    }, g.th), React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 99,
        background: g.color,
        marginTop: "auto"
      }
    }));
  }
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flexShrink: 0,
      minHeight: 0
    }
  }, React.createElement("div", {
    onClick: onToggle,
    title: "พับช่วง " + g.th,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "0 2px",
      cursor: "pointer"
    }
  }, React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 99,
      background: g.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: ".08em",
      color: "var(--text-2)"
    }
  }, g.th), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, count), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, g.hint), React.createElement("button", {
    onClick: onToggle,
    "aria-label": "พับช่วง " + g.th,
    style: {
      marginLeft: "auto",
      width: 26,
      height: 26,
      borderRadius: 8,
      border: "1px solid var(--border)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-3)",
    style: {
      transform: "rotate(90deg)"
    }
  }))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flex: 1,
      minHeight: 0
    }
  }, children));
}
function flGroups(role) {
  const out = [];
  const doc = window.can(role, "permit");
  if (window.can(role, "leads")) out.push({
    key: "sales",
    th: "ฝ่ายขาย",
    color: "#8B5CF6",
    kind: "lead",
    hint: "ลูกค้าที่ยังไม่เป็นงาน",
    cols: SALES_STAGES
  });
  out.push({
    key: "site",
    th: "หน้างาน",
    color: "var(--primary)",
    kind: "job",
    hint: doc ? "งานที่กำลังเดินอยู่" : "งานในฐานข้อมูล",
    cols: doc ? window.SF.STAGES.filter(s => s.key !== "done") : window.SF.STAGES
  });
  if (doc) out.push({
    key: "doc",
    th: "เอกสาร",
    color: "#0EA5E9",
    kind: "permit",
    hint: "ติดตั้งเสร็จแล้ว รอเดินเรื่องการไฟฟ้า",
    cols: PERMIT_COLS
  });
  return out;
}
const flSumValue = leadsArr => {
  const sum = leadsArr.reduce((s, l) => s + (+l.expValue || 0), 0);
  return sum > 0 ? "มูลค่ารวม ฿" + fmtBaht(sum) : null;
};
function FlowBoardView({
  jobs,
  leads,
  quotes,
  search,
  role,
  currentUser,
  onOpenJob,
  onOpenLead,
  onMoveStage,
  onPatchLead,
  onPatchPermit,
  onOpenReview
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const groups = React.useMemo(() => flGroups(role), [role]);
  const hasDoc = groups.some(g => g.key === "doc");
  const canMoveJob = window.can(role, "editJob");
  const [collapsed, setCollapsed] = React.useState(flReadCollapsed);
  const toggle = k => setCollapsed(c => {
    const next = Object.assign({}, c, {
      [k]: !c[k]
    });
    try {
      localStorage.setItem(FL_GRP_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  });
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);
  const clearDrag = () => {
    setDrag(null);
    setOver(null);
  };
  const leadPool = React.useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const arr = leads || [];
    if (!q) return arr;
    return arr.filter(l => ((l.name || "") + " " + (l.code || "") + " " + (l.province || "") + " " + (l.phone || "")).toLowerCase().includes(q));
  }, [leads, search]);
  const jobCols = React.useMemo(() => {
    const site = {},
      doc = {};
    (SF.STAGES || []).forEach(s => {
      site[s.key] = [];
    });
    PERMIT_COLS.forEach(c => {
      doc[c.key] = [];
    });
    (jobs || []).forEach(j => {
      if (hasDoc && j.stage === "done") {
        const pk = permitColOf(j);
        (doc[pk] || doc.todo).push(j);
        return;
      }
      if (site[j.stage]) site[j.stage].push(j);else site[(SF.STAGES[0] || {}).key].push(j);
    });
    Object.keys(site).forEach(k => site[k].sort(byInstallDate));
    Object.keys(doc).forEach(k => doc[k].sort((a, b) => String((b.permit || {}).submittedAt || (b.permit || {}).updatedAt || b.code || "").localeCompare(String((a.permit || {}).submittedAt || (a.permit || {}).updatedAt || a.code || ""))));
    return {
      site,
      doc
    };
  }, [jobs, hasDoc]);
  const leadCols = React.useMemo(() => {
    const m = {};
    SALES_STAGES.forEach(s => {
      m[s.key] = [];
    });
    leadPool.forEach(l => {
      const k = salesStageKey(l);
      (m[k] || (m[k] = [])).push(l);
    });
    Object.keys(m).forEach(k => m[k].sort((a, b) => {
      const la = sOverdue(a.nextFollow) ? 0 : 1,
        lb = sOverdue(b.nextFollow) ? 0 : 1;
      if (la !== lb) return la - lb;
      return String(a.nextFollow || "9999-99-99").localeCompare(String(b.nextFollow || "9999-99-99"));
    }));
    return m;
  }, [leadPool]);
  const cardsOf = (g, key) => (g.kind === "lead" ? leadCols[key] : g.kind === "permit" ? jobCols.doc[key] : jobCols.site[key]) || [];
  const canDrop = (g, key) => {
    if (!drag || drag.group !== g.key) return false;
    if (g.kind === "lead") return salesStageKey(drag.rec) !== key;
    if (g.kind === "job") return canMoveJob && drag.rec.stage !== key;
    const from = permitColOf(drag.rec);
    return from !== key && (PERMIT_MOVES[from] || []).indexOf(key) !== -1;
  };
  const doDrop = (g, key) => {
    const d = drag;
    clearDrag();
    if (!d || d.group !== g.key) return;
    const rec = d.rec;
    if (g.kind === "lead") {
      if (salesStageKey(rec) === key) return;
      if (key === "won") {
        window.askConfirm({
          title: "ปิดการขาย “" + (rec.name || "รายนี้") + "” ?",
          body: "ปิดแล้วให้กด “แปลงเป็นงานติดตั้ง” ที่หน้าลูกค้าสำรวจ เพื่อย้ายเข้าฐานข้อมูลงานพร้อมแบบสำรวจและรูป",
          ok: "ปิดการขาย",
          danger: false,
          icon: "check"
        }).then(ok => {
          if (ok) onPatchLead(rec.id, salesStagePatch(key));
        });
        return;
      }
      onPatchLead(rec.id, salesStagePatch(key));
      return;
    }
    if (g.kind === "job") {
      if (!canMoveJob || rec.stage === key) return;
      onMoveStage(rec.id, key);
      return;
    }
    const p = rec.permit || {};
    const from = permitColOf(rec);
    if (from === key || (PERMIT_MOVES[from] || []).indexOf(key) === -1) return;
    if (key === "rejected") {
      if (onOpenReview) onOpenReview(rec.id);
      return;
    }
    const back = PERMIT_BACK[from] === key;
    const extra = {
      byAdmin: currentUser && currentUser.name || "",
      adminId: currentUser && currentUser.id || null,
      statusAt: new Date().toISOString()
    };
    if (back) Object.assign(extra, PERMIT_BACK_CLEAR[key] || {});else {
      if (key === "filing") {
        extra.rejectReason = null;
        if (!p.filedDate) extra.filedDate = new Date().toISOString().slice(0, 10);
      }
      if (key === "approved") {
        if (!p.approvedDate) extra.approvedDate = new Date().toISOString().slice(0, 10);
      }
    }
    onPatchPermit(rec.id, Object.assign({
      status: key
    }, extra));
  };
  const startDrag = (e, rec, g) => {
    setDrag({
      id: rec.id,
      rec: rec,
      group: g.key
    });
    e.dataTransfer.effectAllowed = "move";
  };
  const renderCard = (g, rec) => {
    const dragging = !!drag && drag.id === rec.id && drag.group === g.key;
    if (g.kind === "lead") return React.createElement(SalesCard, {
      key: g.key + rec.id,
      lead: rec,
      quotes: quotes,
      onOpen: onOpenLead,
      dragging: dragging,
      onDragStart: (e, l) => startDrag(e, l, g)
    });
    if (g.kind === "permit") return React.createElement(PermitCard, {
      key: g.key + rec.id,
      job: rec,
      onOpen: onOpenJob,
      dragging: dragging,
      draggable: !!PERMIT_MOVES[permitColOf(rec)],
      onDragStart: (e, j) => startDrag(e, j, g)
    });
    return React.createElement(KanbanCard, {
      key: g.key + rec.id,
      job: rec,
      onOpen: onOpenJob,
      dragging: dragging,
      onDragStart: (e, j) => {
        if (canMoveJob) startDrag(e, j, g);
      }
    });
  };
  const groupCount = g => g.cols.reduce((s, c) => s + cardsOf(g, c.key).length, 0);
  if (isMobile) return React.createElement(FlowMobile, {
    groups: groups,
    cardsOf: cardsOf,
    renderCard: renderCard,
    collapsed: collapsed,
    onToggle: toggle,
    groupCount: groupCount
  });
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      flexShrink: 0
    }
  }, "\u0E25\u0E32\u0E01\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E02\u0E49\u0E32\u0E21\u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E20\u0E32\u0E22\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 \xB7 \u0E01\u0E14\u0E2B\u0E31\u0E27\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1E\u0E31\u0E1A\u0E40\u0E01\u0E47\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      overflowX: "auto",
      paddingBottom: 12,
      minHeight: 0,
      flex: 1,
      alignItems: "stretch"
    }
  }, groups.map(g => React.createElement(FlGroup, {
    key: g.key,
    g: g,
    count: groupCount(g),
    collapsed: !!collapsed[g.key],
    onToggle: () => toggle(g.key)
  }, g.cols.map(c => {
    const cards = cardsOf(g, c.key);
    const ok = canDrop(g, c.key);
    return React.createElement(FlCol, {
      key: c.key,
      col: c,
      count: cards.length,
      isOver: over === g.key + ":" + c.key && ok,
      dimmed: !!drag && !ok,
      sub: g.kind === "lead" ? flSumValue(cards) : null,
      onDragOver: e => {
        if (!ok) return;
        e.preventDefault();
        setOver(g.key + ":" + c.key);
      },
      onDragLeave: () => setOver(o => o === g.key + ":" + c.key ? null : o),
      onDrop: () => doDrop(g, c.key)
    }, cards.map(rec => renderCard(g, rec)));
  })))));
}
function FlowMobile({
  groups,
  cardsOf,
  renderCard,
  collapsed,
  onToggle,
  groupCount
}) {
  const [openCol, setOpenCol] = React.useState({});
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, groups.map(g => {
    const shut = !!collapsed[g.key];
    return React.createElement("div", {
      key: g.key,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 9
      }
    }, React.createElement("button", {
      onClick: () => onToggle(g.key),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--surface2)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        width: "100%"
      }
    }, React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 99,
        background: g.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 13.5,
        fontWeight: 800,
        color: "var(--text-1)"
      }
    }, g.th), React.createElement("span", {
      style: {
        fontFamily: "var(--mono)",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--text-3)"
      }
    }, groupCount(g)), React.createElement(Icon, {
      name: "chevronDown",
      size: 17,
      color: "var(--text-3)",
      style: {
        marginLeft: "auto",
        transform: shut ? "rotate(-90deg)" : "none",
        transition: "transform .18s"
      }
    })), !shut && g.cols.map(c => {
      const cards = cardsOf(g, c.key);
      const k = g.key + ":" + c.key;
      const isOpen = !!openCol[k];
      return React.createElement("div", {
        key: c.key,
        style: {
          borderRadius: 12,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          overflow: "hidden"
        }
      }, React.createElement("button", {
        onClick: () => setOpenCol(o => Object.assign({}, o, {
          [k]: !isOpen
        })),
        style: {
          width: "100%",
          padding: "11px 13px",
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          borderBottom: isOpen ? "1px solid var(--border)" : "none"
        }
      }, React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: 99,
          background: c.color,
          flexShrink: 0
        }
      }), React.createElement("span", {
        style: {
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-1)"
        }
      }, c.th), React.createElement("span", {
        style: {
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 9,
          flexShrink: 0
        }
      }, React.createElement("span", {
        style: {
          fontFamily: "var(--mono)",
          fontSize: 12,
          fontWeight: 600,
          color: c.fg || "var(--text-2)",
          background: c.soft || "var(--surface)",
          minWidth: 24,
          height: 24,
          borderRadius: 99,
          display: "grid",
          placeItems: "center",
          padding: "0 7px"
        }
      }, cards.length), React.createElement(Icon, {
        name: "chevronDown",
        size: 16,
        color: "var(--text-3)",
        style: {
          transform: isOpen ? "none" : "rotate(-90deg)",
          transition: "transform .18s"
        }
      }))), isOpen && React.createElement("div", {
        style: {
          padding: 11,
          display: "flex",
          flexDirection: "column",
          gap: 10
        }
      }, cards.map(rec => renderCard(g, rec)), cards.length === 0 && React.createElement("div", {
        style: {
          padding: "14px 0",
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-3)"
        }
      }, "\u0E27\u0E48\u0E32\u0E07")));
    }));
  }));
}
Object.assign(window, {
  FlowBoardView,
  FlCol,
  FlGroup,
  flGroups
});