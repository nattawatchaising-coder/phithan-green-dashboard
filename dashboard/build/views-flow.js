function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
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
  return (React.createElement("div", {
      onDragOver: onDragOver,
      onDragLeave: onDragLeave,
      onDrop: onDrop,
      className: "bd-col",
      style: {
        width: 262,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: isOver ? col.soft : null,
        borderColor: isOver ? col.color : null,
        opacity: dimmed ? 0.5 : 1
      }
    }, React.createElement("div", {
      className: "hd"
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
        borderRadius: "var(--r-pill)",
        background: col.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
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
      className: "bd"
    }, children, count === 0 && React.createElement("div", {
      className: "empty"
    }, isOver ? "วางที่นี่" : "ว่าง")))
  );
}
function FlGroup({
  g,
  count,
  collapsed,
  onToggle,
  onAdd,
  addLabel,
  extra,
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
        borderRadius: "var(--r-card)",
        border: "none",
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
        fontSize: 12,
        fontWeight: 700,
        color: "var(--text-2)",
        whiteSpace: "nowrap"
      }
    }, g.th), React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: "var(--r-pill)",
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
  }, React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onToggle();
    },
    "aria-label": "พับช่วง " + g.th,
    style: {
      width: 27,
      height: 27,
      borderRadius: "var(--r-pill)",
      border: "none",
      background: "var(--surface)",
      boxShadow: "var(--shadow-sm)",
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
  })), React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "var(--r-pill)",
      background: g.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      fontSize: 12.5,
      fontWeight: 800,
      color: "var(--text-2)"
    }
  }, g.th), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-3)"
    }
  }, count), onAdd && React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onAdd();
    },
    title: ((addLabel || "ลูกค้าใหม่").indexOf("เพิ่ม") === 0 ? addLabel : "เพิ่ม" + (addLabel || "ลูกค้าใหม่")) + " ในช่วง " + g.th,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 24,
      padding: "0 10px",
      borderRadius: "var(--r-chip)",
      border: "1px solid color-mix(in srgb, " + g.color + " 33%, transparent)",
      background: "color-mix(in srgb, " + g.color + " 8%, transparent)",
      color: g.color,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      flexShrink: 0,
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 13,
    color: g.color,
    sw: 2.6
  }), " ", addLabel || "ลูกค้าใหม่"), extra, React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, g.hint)), React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      flex: 1,
      minHeight: 0
    }
  }, children));
}
function FlSalesDock({
  color,
  onNewLead,
  onPoster,
  trash,
  onRestore,
  onOpenAll,
  trashSt,
  trashDnD
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const capRef = React.useRef(null),
    boxRef = React.useRef(null),
    animRef = React.useRef(null);
  const capW = React.useRef(0);
  const [phW, setPhW] = React.useState(0);
  const n = trash ? trash.length : 0;
  const CAP_H = 30,
    PANEL_W = 340;
  const mountedRef = React.useRef(mounted);
  mountedRef.current = mounted;
  React.useLayoutEffect(() => {
    const cap = capRef.current;
    const measure = () => {
      if (cap && !mountedRef.current) {
        capW.current = cap.offsetWidth;
        setPhW(cap.offsetWidth);
      }
    };
    measure();
    if (!window.ResizeObserver || !cap) return;
    const ro = new ResizeObserver(measure);
    ro.observe(cap);
    return () => ro.disconnect();
  }, []);
  const shut = el => "inset(0px " + Math.max(0, el.offsetWidth - capW.current) + "px " + Math.max(0, el.offsetHeight - CAP_H) + "px 0px round 15px)";
  const OPEN_CLIP = "inset(0px 0px 0px 0px round 18px)";
  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el || !mounted || !el.animate) {
      if (!open && mounted) setMounted(false);
      return;
    }
    const running = animRef.current && animRef.current.playState === "running";
    const from = running ? getComputedStyle(el).clipPath : open ? shut(el) : OPEN_CLIP;
    if (animRef.current) animRef.current.cancel();
    const to = open ? OPEN_CLIP : shut(el);
    const an = el.animate([{
      clipPath: from
    }, {
      clipPath: to
    }], open ? {
      duration: 560,
      easing: "cubic-bezier(.22,1,.36,1)"
    } : {
      duration: 380,
      easing: "cubic-bezier(.4,0,.2,1)"
    });
    el.style.clipPath = to;
    animRef.current = an;
    if (!open) an.onfinish = () => {
      el.style.clipPath = "";
      setMounted(false);
    };
  }, [open, mounted]);
  React.useEffect(() => {
    if (!open) return;
    const away = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const esc = e => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  const toggle = () => {
    if (open) setOpen(false);else {
      setMounted(true);
      setOpen(true);
    }
  };
  const [hov, setHov] = React.useState(null);
  const [hiOn, setHiOn] = React.useState(false);
  const hiRef = React.useRef(null);
  const segRefs = React.useRef({});
  const sp = React.useRef({
    l: 0,
    r: 0,
    vl: 0,
    vr: 0,
    tl: 0,
    tr: 0,
    dir: 1,
    raf: 0,
    t: 0,
    shown: false
  });
  const target = hov || (open ? "trash" : null);
  const drawHi = () => {
    const s = sp.current,
      el = hiRef.current;
    if (!el) return;
    const w = Math.max(0, s.r - s.l),
      tw = s.tr - s.tl,
      st = tw > 0 ? Math.max(0, w / tw - 1) : 0;
    el.style.width = w + "px";
    el.style.transform = "translateX(" + s.l + "px) scaleY(" + Math.max(.84, 1 - st * .2) + ")";
  };
  const tickHi = now => {
    const s = sp.current;
    const dt = Math.min(1 / 30, s.t ? (now - s.t) / 1000 : 1 / 60);
    s.t = now;
    const H = [430, 36],
      S = [170, 20];
    const L = s.dir < 0 ? H : S,
      R = s.dir > 0 ? H : S;
    for (let i = 0; i < 2; i++) {
      const h = dt / 2;
      s.vl += (L[0] * (s.tl - s.l) - L[1] * s.vl) * h;
      s.l += s.vl * h;
      s.vr += (R[0] * (s.tr - s.r) - R[1] * s.vr) * h;
      s.r += s.vr * h;
    }
    if (Math.abs(s.tl - s.l) + Math.abs(s.tr - s.r) < .4 && Math.abs(s.vl) + Math.abs(s.vr) < 8) {
      s.l = s.tl;
      s.r = s.tr;
      s.vl = s.vr = 0;
      s.raf = 0;
      s.t = 0;
      drawHi();
      return;
    }
    drawHi();
    s.raf = requestAnimationFrame(tickHi);
  };
  const place = React.useCallback(() => {
    const el = target && segRefs.current[target],
      s = sp.current;
    if (!el) {
      s.shown = false;
      setHiOn(false);
      return;
    }
    const l = el.offsetLeft,
      r = l + el.offsetWidth;
    if (s.shown && s.tl === l && s.tr === r) return;
    s.tl = l;
    s.tr = r;
    const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!s.shown || still) {
      if (s.raf) cancelAnimationFrame(s.raf);
      Object.assign(s, {
        l: l,
        r: r,
        vl: 0,
        vr: 0,
        raf: 0,
        t: 0,
        shown: true
      });
      drawHi();
      setHiOn(true);
      return;
    }
    s.dir = Math.sign(l + r - (s.l + s.r)) || s.dir;
    if (!s.raf) s.raf = requestAnimationFrame(tickHi);
  }, [target]);
  React.useLayoutEffect(place, [place]);
  React.useEffect(() => () => {
    if (sp.current.raf) cancelAnimationFrame(sp.current.raf);
  }, []);
  React.useEffect(() => {
    const cap = capRef.current;
    if (!cap || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => place());
    ro.observe(cap);
    return () => ro.disconnect();
  }, [place]);
  const stop = e => e.stopPropagation();
  const seg = (key, icon, label, onClick, extra) => React.createElement("button", _extends({
    ref: el => {
      segRefs.current[key] = el;
    },
    className: "fl-seg",
    "data-on": key === "trash" && open ? "1" : null,
    "data-hi": target === key ? "1" : null,
    onMouseEnter: () => setHov(key),
    onClick: e => {
      stop(e);
      onClick();
    }
  }, extra || {}), React.createElement(Icon, {
    name: icon,
    size: 13,
    color: "currentColor",
    sw: 2.4
  }), React.createElement("span", {
    className: "fl-lbl"
  }, label));
  return React.createElement("div", {
    onClick: stop,
    className: "fl-dock-ph",
    "data-m": mounted ? "1" : null,
    style: {
      position: "relative",
      flexShrink: 0,
      height: CAP_H,
      width: phW || "auto"
    }
  }, React.createElement("div", {
    ref: boxRef,
    className: "fl-dock",
    "data-open": open ? "1" : null,
    style: {
      "--dock-c": color,
      width: mounted ? PANEL_W : "auto"
    }
  }, React.createElement("div", {
    ref: capRef,
    className: "fl-cap",
    onMouseLeave: () => setHov(null)
  }, React.createElement("span", {
    ref: hiRef,
    className: "fl-hi",
    style: {
      opacity: hiOn ? 1 : 0
    }
  }), onNewLead && seg("new", "plus", "ลูกค้าใหม่", () => {
    setOpen(false);
    onNewLead();
  }, {
    style: {
      color: color
    }
  }), onPoster && seg("poster", "image", "รูปสรุปแพ็คเกจ", () => {
    setOpen(false);
    onPoster();
  }), trash && seg("trash", "trash", React.createElement(React.Fragment, null, trashSt === "over" ? "ปล่อยเพื่อทิ้ง" : "ถังขยะ", n ? React.createElement("span", {
    className: "fl-n"
  }, n) : null), toggle, Object.assign({
    "data-st": trashSt,
    "data-trash": "1",
    title: trashSt ? "ปล่อยเพื่อย้ายลงถังขยะ" : "ถังขยะ — ลากการ์ดลูกค้ามาวางเพื่อทิ้ง · กดเพื่อดู/กู้คืน"
  }, trashDnD))), mounted && React.createElement("div", {
    className: "fl-body"
  }, React.createElement("div", {
    style: {
      padding: "4px 6px 8px"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 6px 8px"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, n ? n + " ราย · กู้คืนได้ตลอด" : ""), onOpenAll && n > 0 && React.createElement("button", {
    onClick: () => {
      setOpen(false);
      onOpenAll();
    },
    style: {
      border: "none",
      background: "none",
      color: "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      cursor: "pointer",
      padding: 0
    }
  }, "\u0E40\u0E1B\u0E34\u0E14\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 / \u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23")), n === 0 && React.createElement("div", {
    style: {
      padding: "18px 0 14px",
      textAlign: "center",
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, "\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30\u0E27\u0E48\u0E32\u0E07 \u2014 \u0E25\u0E32\u0E01\u0E01\u0E32\u0E23\u0E4C\u0E14\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E21\u0E32\u0E27\u0E32\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E38\u0E48\u0E21\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E17\u0E34\u0E49\u0E07"), React.createElement("div", {
    style: {
      maxHeight: 280,
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, (trash || []).map(l => React.createElement("div", {
    key: l.id,
    className: "fl-row"
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, l.name || "(ไม่มีชื่อ)"), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, l.code, l.deletedAt ? " · ลบ " + thDate(String(l.deletedAt).slice(0, 10), true) : "", l.deletedBy ? " โดย " + l.deletedBy : "")), onRestore && React.createElement("button", {
    onClick: () => onRestore(l.id),
    className: "fl-restore"
  }, "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19"))))))));
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
  if (!(window.isPermitOnly && window.isPermitOnly(role))) {
    out.push({
      key: "site",
      th: "หน้างาน",
      color: "var(--primary)",
      kind: "job",
      hint: doc ? "งานที่กำลังเดินอยู่" : "งานในฐานข้อมูล",
      cols: doc ? window.SF.STAGES.filter(s => s.key !== "done") : window.SF.STAGES
    });
  }
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
  stock,
  search,
  role,
  currentUser,
  onOpenJob,
  onOpenLead,
  onNewLead,
  onNewPermitJob,
  onNewJob,
  onMoveStage,
  onPatchJob,
  onPatchLead,
  onPatchPermit,
  onOpenReview,
  leadTrash,
  onOpenLeadTrash,
  onTrashLead,
  onRestoreLead
}) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const groups = React.useMemo(() => flGroups(role), [role]);
  const hasDoc = groups.some(g => g.key === "doc");
  const hasSales = groups.some(g => g.key === "sales");
  const canMoveJob = window.can(role, "editJob");
  const [collapsed, setCollapsed] = React.useState(flReadCollapsed);
  const [pkSum, setPkSum] = React.useState(false);
  const pkAdmin = window.usePgAdmin();
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
    setOverTrash(false);
  };
  const [overTrash, setOverTrash] = React.useState(false);
  const [trashFx, setTrashFx] = React.useState(false);
  const [undo, setUndo] = React.useState(null);
  const canTrash = !!(onTrashLead && drag && drag.kind === "lead");
  React.useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);
  const dropTrash = () => {
    const d = drag;
    clearDrag();
    if (!d || d.kind !== "lead" || !onTrashLead) return;
    const done = () => {
      onTrashLead(d.id);
      setTrashFx(true);
      setTimeout(() => setTrashFx(false), 480);
      setUndo({
        id: d.id,
        name: d.rec.name || d.rec.code || "ลูกค้า"
      });
    };
    const el = document.querySelector('.bd-card[data-lid="' + String(d.id).replace(/"/g, "") + '"]');
    const tb = document.querySelector('.fl-seg[data-trash]');
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !tb || !el.animate || still) {
      done();
      return;
    }
    const r = el.getBoundingClientRect(),
      t = tb.getBoundingClientRect();
    const fly = el.cloneNode(true);
    fly.removeAttribute("data-drag");
    Object.assign(fly.style, {
      position: "fixed",
      left: r.left + "px",
      top: r.top + "px",
      width: r.width + "px",
      height: r.height + "px",
      margin: "0",
      zIndex: "300",
      pointerEvents: "none",
      transition: "none",
      boxShadow: "var(--hov-sh-lg)"
    });
    document.body.appendChild(fly);
    el.style.visibility = "hidden";
    const dx = t.left + t.width / 2 - (r.left + r.width / 2),
      dy = t.top + t.height / 2 - (r.top + r.height / 2);
    const anim = fly.animate([{
      transform: "translate(0,0) scale(1) rotate(0deg)",
      opacity: 1
    }, {
      transform: "translate(" + dx * 0.45 + "px," + (dy * 0.45 - 46) + "px) scale(.5) rotate(-6deg)",
      opacity: 1,
      offset: 0.5
    }, {
      transform: "translate(" + dx + "px," + dy + "px) scale(.06) rotate(-12deg)",
      opacity: 0.35
    }], {
      duration: 640,
      easing: "cubic-bezier(.45,0,.25,1)",
      fill: "forwards"
    });
    const gap = parseFloat(getComputedStyle(el.parentNode).rowGap) || 0;
    const cs = getComputedStyle(el);
    el.style.overflow = "hidden";
    el.animate([{
      height: r.height + "px",
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      marginBottom: "0px"
    }, {
      height: "0px",
      paddingTop: "0px",
      paddingBottom: "0px",
      marginBottom: -gap + "px"
    }], {
      duration: 420,
      delay: 160,
      easing: "cubic-bezier(.4,0,.2,1)",
      fill: "forwards"
    });
    anim.onfinish = () => {
      fly.remove();
      done();
    };
  };
  const leadPool = React.useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    const arr = leads || [];
    if (!q) return arr;
    return arr.filter(l => ((l.name || "") + " " + (l.code || "") + " " + (l.province || "") + " " + (l.phone || "")).toLowerCase().includes(q));
  }, [leads, search]);
  const jobCols = React.useMemo(() => {
    const site = {},
      doc = {},
      pend = [];
    (SF.STAGES || []).forEach(s => {
      site[s.key] = [];
    });
    PERMIT_COLS.forEach(c => {
      doc[c.key] = [];
    });
    (jobs || []).forEach(j => {
      if (hasSales && j.pendingApproval && j.stage !== "done") {
        pend.push(j);
        return;
      }
      if (hasDoc && j.stage === "done") {
        const pk = permitColOf(j);
        (doc[pk] || doc.todo).push(j);
        return;
      }
      if (site[j.stage]) site[j.stage].push(j);else site[(SF.STAGES[0] || {}).key].push(j);
    });
    pend.sort(byInstallDate);
    Object.keys(site).forEach(k => site[k].sort(byInstallDate));
    Object.keys(doc).forEach(k => doc[k].sort((a, b) => String((b.permit || {}).submittedAt || (b.permit || {}).updatedAt || b.code || "").localeCompare(String((a.permit || {}).submittedAt || (a.permit || {}).updatedAt || a.code || ""))));
    return {
      site,
      doc,
      pend
    };
  }, [jobs, hasDoc, hasSales]);
  const leadByJob = React.useMemo(() => {
    const m = {};
    (leads || []).forEach(l => {
      if (l.jobId) m[l.jobId] = l;
    });
    return m;
  }, [leads]);
  const pendIds = React.useMemo(() => {
    const m = {};
    jobCols.pend.forEach(j => {
      m[j.id] = 1;
    });
    return m;
  }, [jobCols.pend]);
  const leadCols = React.useMemo(() => {
    const m = {};
    SALES_STAGES.forEach(s => {
      m[s.key] = [];
    });
    leadPool.forEach(l => {
      if (l.jobId && pendIds[l.jobId]) return;
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
  }, [leadPool, pendIds]);
  const cardsOf = (g, key) => (g.kind === "lead" ? key === "nego" ? (leadCols[key] || []).concat(jobCols.pend) : leadCols[key] : g.kind === "permit" ? jobCols.doc[key] : jobCols.site[key]) || [];
  const canDrop = (g, key) => {
    if (!drag) return false;
    if (drag.kind === "job") {
      if (!canMoveJob) return false;
      if (g.kind === "lead") return key === "nego" && !drag.rec.pendingApproval;
      if (g.kind === "job") return drag.rec.pendingApproval || drag.rec.stage !== key;
      return false;
    }
    if (drag.group !== g.key) return false;
    if (g.kind === "lead") return salesStageKey(drag.rec) !== key;
    const from = permitColOf(drag.rec);
    return from !== key && (PERMIT_MOVES[from] || []).indexOf(key) !== -1;
  };
  const doDrop = (g, key) => {
    const d = drag;
    clearDrag();
    if (!d) return;
    const rec = d.rec;
    if (d.kind === "job" && canMoveJob) {
      const lead = leadByJob[rec.id] || null;
      const syncLead = k => {
        if (lead && onPatchLead && salesStageKey(lead) !== k) onPatchLead(lead.id, salesStagePatch(k));
      };
      if (g.kind === "lead") {
        if (key !== "nego" || !onPatchJob) return;
        onPatchJob(rec.id, {
          pendingApproval: true
        });
        syncLead("nego");
        return;
      }
      if (g.kind !== "job") return;
      if (rec.pendingApproval) {
        if (onPatchJob) onPatchJob(rec.id, {
          pendingApproval: false
        });
        syncLead("won");
      }
      if (rec.stage !== key) onMoveStage(rec.id, key);
      return;
    }
    if (d.group !== g.key) return;
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
    const p = rec.permit || {};
    const from = permitColOf(rec);
    if (from === key || (PERMIT_MOVES[from] || []).indexOf(key) === -1) return;
    if (key === "rejected") {
      if (onOpenReview) onOpenReview(rec.id);
      return;
    }
    onPatchPermit(rec.id, permitMovePatch(from, key, p, currentUser));
  };
  const kindOf = (g, rec) => g.kind === "lead" && rec.pendingApproval ? "job" : g.kind;
  const startDrag = (e, rec, g) => {
    const kind = kindOf(g, rec);
    setDrag({
      id: rec.id,
      rec: rec,
      group: g.key,
      kind: kind
    });
    e.dataTransfer.effectAllowed = "move";
    if (kind === "lead" && e.dataTransfer.setDragImage) {
      const gh = document.createElement("div");
      gh.className = "fl-ghost";
      const sm = document.createElement("small");
      sm.textContent = rec.code || "";
      gh.appendChild(sm);
      gh.appendChild(document.createTextNode(rec.name || "(ไม่มีชื่อ)"));
      document.body.appendChild(gh);
      e.dataTransfer.setDragImage(gh, 18, 14);
      setTimeout(() => gh.remove(), 0);
    }
  };
  const renderCard = (g, rec) => {
    const dragging = !!drag && drag.id === rec.id && drag.group === g.key;
    if (g.kind === "lead" && !rec.pendingApproval) {
      const card = React.createElement(SalesCard, {
        key: g.key + rec.id,
        lead: rec,
        quotes: quotes,
        onOpen: onOpenLead,
        dragging: dragging && overTrash ? "trash" : dragging,
        onDragStart: (e, l) => startDrag(e, l, g)
      });
      return card;
    }
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
    onDragEnd: clearDrag,
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
    onToggle: () => toggle(g.key),
    onAdd: g.kind === "lead" ? null : g.kind === "permit" ? onNewPermitJob || null : g.kind === "job" ? onNewJob || null : null,
    addLabel: g.kind === "permit" ? "งานขออนุญาต" : g.kind === "job" ? "เพิ่มงาน" : "ลูกค้าใหม่",
    extra: g.kind === "lead" ? React.createElement(FlSalesDock, {
      color: g.color,
      onNewLead: onNewLead,
      onPoster: pkAdmin && window.PkPosterModal ? () => setPkSum(true) : null,
      trash: onOpenLeadTrash ? leadTrash || [] : null,
      onRestore: onRestoreLead,
      onOpenAll: onOpenLeadTrash,
      trashSt: trashFx ? "gulp" : canTrash ? overTrash ? "over" : "ready" : null,
      trashDnD: {
        onDragOver: e => {
          if (!canTrash) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!overTrash) setOverTrash(true);
        },
        onDragLeave: e => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOverTrash(false);
        },
        onDrop: e => {
          e.preventDefault();
          e.stopPropagation();
          dropTrash();
        }
      }
    }) : null
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
  })))), undo && React.createElement("div", {
    className: "fl-undo",
    role: "status"
  }, React.createElement(Icon, {
    name: "trash",
    size: 14,
    color: "#fff"
  }), React.createElement("span", null, "\u0E22\u0E49\u0E32\u0E22 \u201C", undo.name, "\u201D \u0E25\u0E07\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30\u0E41\u0E25\u0E49\u0E27"), onRestoreLead && React.createElement("button", {
    onClick: () => {
      onRestoreLead(undo.id);
      setUndo(null);
    },
    style: {
      border: "none",
      borderRadius: "var(--r-pill)",
      padding: "5px 12px",
      background: "rgba(255,255,255,.16)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E40\u0E25\u0E34\u0E01\u0E17\u0E33")), pkSum && pkAdmin && window.PkPosterModal && React.createElement(window.PkPosterModal, {
    leads: leads,
    stock: stock,
    quotes: quotes,
    onClose: () => setPkSum(false)
  }));
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
        borderRadius: "var(--r-tile)",
        boxShadow: "var(--shadow-sm)",
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
        borderRadius: "var(--r-pill)",
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
          borderRadius: "var(--r-tile)",
          background: "var(--surface2)",
          boxShadow: "var(--shadow-sm)",
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
          borderRadius: "var(--r-pill)",
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
          borderRadius: "var(--r-pill)",
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