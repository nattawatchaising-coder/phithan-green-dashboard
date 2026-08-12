function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PLAN_LINE_KINDS = [{
  key: "dc",
  label: "สาย DC (PV)",
  color: "#EF4444",
  spare: 10
}, {
  key: "ac",
  label: "สาย AC",
  color: "#3B82F6",
  spare: 10
}, {
  key: "ground",
  label: "สายกราวด์",
  color: "var(--tint-green-tx)",
  spare: 10
}, {
  key: "lan",
  label: "สาย LAN",
  color: "#F59E0B",
  spare: 10
}, {
  key: "conduit",
  label: "ท่อร้อยสาย",
  color: "#7C5CFC",
  spare: 5
}];
const PLAN_LINE_BY = {};
PLAN_LINE_KINDS.forEach(k => {
  PLAN_LINE_BY[k.key] = k;
});
const PLAN_CONDUITS = [{
  key: "none",
  label: "เดินลอย/ไม่มีท่อ",
  short: "เดินลอย",
  spare: 5
}, {
  key: "imc",
  label: "ท่อ IMC",
  short: "IMC",
  spare: 5
}, {
  key: "upvc",
  label: "ท่อ uPVC",
  short: "uPVC",
  spare: 5
}, {
  key: "flex",
  label: "ท่ออ่อน (Flex)",
  short: "Flex",
  spare: 8
}, {
  key: "ceiling",
  label: "เดินใต้ฝ้า",
  short: "ใต้ฝ้า",
  spare: 5
}, {
  key: "buried",
  label: "ฝังดิน/ฝังผนัง",
  short: "ฝังดิน",
  spare: 8
}];
const PLAN_CONDUIT_BY = {};
PLAN_CONDUITS.forEach(c => {
  PLAN_CONDUIT_BY[c.key] = c;
});
const PLAN_WIRE_SQMM = [2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
const PLAN_WIRE_CORES = [1, 2, 3, 4, 5];
const PLAN_CONDUIT_SIZES = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"'];
const PLAN_MARKER_KINDS = [{
  key: "inverter",
  label: "อินเวอร์เตอร์",
  color: "#7C5CFC",
  icon: "bolt"
}, {
  key: "combiner",
  label: "Combiner",
  color: "#0EA5E9",
  icon: "box"
}, {
  key: "mdb",
  label: "ตู้ MDB",
  color: "#EF4444",
  icon: "grid"
}, {
  key: "meter",
  label: "มิเตอร์",
  color: "#F59E0B",
  icon: "pin"
}, {
  key: "ground",
  label: "จุดกราวด์",
  color: "#84CC16",
  icon: "pin"
}];
const PLAN_MARKER_BY = {};
PLAN_MARKER_KINDS.forEach(k => {
  PLAN_MARKER_BY[k.key] = k;
});
PLAN_MARKER_BY.array = {
  key: "array",
  label: "แผงโซลาร์",
  color: "var(--tint-green-tx)",
  icon: "panel"
};
PLAN_MARKER_BY.camera = {
  key: "camera",
  label: "จุดกล้อง",
  color: "#F59E0B",
  icon: "pin"
};
const PDF_DEFAULTS = {
  warranties: ["ฟรีล้างแผงโซลาร์เซลล์ 3 ครั้ง", "รับประกันงานติดตั้ง 5 ปี", "รับประกันอินเวอร์เตอร์ 5 ปี", "รับประกันแผงโซลาร์เซลล์ 15 ปี", "สำรวจหน้างานก่อนติดตั้งฟรี"],
  email: "solar@phithangreen.com",
  tel: "064-867-5020 (ฝ่ายวิศวกรรม)",
  logo: ""
};
const PLAN_PANEL_SHORT = 1.13;
const PLAN_PANEL_LONG = 2.28;
const PLAN_PANEL_GAP = 0.02;
const PLAN_PANEL_COLOR = "#1D4ED8";
const PLAN_MICRO_COLOR = "#0F172A";
const PLAN_MICRO_PANELS = 2;
const PLAN_WP_DEFAULT = 650;
const PLAN_LINK_COLORS = ["#06B6D4", "#EAB308", "#EC4899", "#22C55E", "#F97316", "#6366F1"];
const PLAN_AC_TRUNK_COLOR = "#2563EB";
const PLAN_AC_FEED_COLOR = "#7C3AED";
const PLAN_XPAGE_COLOR = "#DB2777";
function useSitePlan(jobId) {
  const KEY = "sf_siteplan_" + jobId;
  const [plan, setPlan] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId) {
      setPlan(null);
      setLoading(false);
      return;
    }
    if (window.FBDB) {
      const ref = window.FBDB.ref("surveyPlans/" + jobId);
      const h = ref.on("value", s => {
        setPlan(s.val() || null);
        setLoading(false);
      });
      return () => ref.off("value", h);
    }
    try {
      const v = localStorage.getItem(KEY);
      setPlan(v ? JSON.parse(v) : null);
    } catch (e) {
      setPlan(null);
    }
    setLoading(false);
  }, [jobId]);
  const save = React.useCallback(data => {
    if (!jobId) return;
    if (window.FBDB) window.FBDB.ref("surveyPlans/" + jobId).set(data);else {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) {}
      setPlan(data);
    }
  }, [jobId]);
  return {
    plan,
    loading,
    save
  };
}
let _planSeq = 0;
const _pid = p => (p || "x") + "-" + Date.now().toString(36) + "-" + _planSeq++;
function SitePlanEditor({
  job,
  onClose,
  currentUser
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const {
    plan,
    loading,
    save
  } = useSitePlan(job ? job.id : null);
  const stock = useStockStore();
  const panelModels = React.useMemo(() => (stock.items || []).filter(it => window.SF.mainCatOf(it.cat) === "panel"), [stock.items, stock.cats]);
  const [image, setImage] = React.useState(null);
  const [imgDim, setImgDim] = React.useState({
    w: 0,
    h: 0
  });
  const [mpp, setMpp] = React.useState(null);
  const [calib, setCalib] = React.useState(null);
  const [lines, setLines] = React.useState([]);
  const [markers, setMarkers] = React.useState([]);
  const [panels, setPanels] = React.useState([]);
  const [micros, setMicros] = React.useState([]);
  const [links, setLinks] = React.useState([]);
  const [notes, setNotes] = React.useState([]);
  const [pages, setPages] = React.useState([]);
  const [activePage, setActivePage] = React.useState(0);
  const pagesRef = React.useRef([]);
  React.useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  const [busy, setBusy] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const histRef = React.useRef([]);
  const snapRef = React.useRef(null);
  const restoringRef = React.useRef(false);
  const draggingRef = React.useRef(false);
  const movedRef = React.useRef(false);
  const [histLen, setHistLen] = React.useState(0);
  React.useEffect(() => {
    if (loading || loaded) return;
    if (plan) {
      let pgs;
      if (Array.isArray(plan.pages) && plan.pages.length) pgs = plan.pages.map((p, i) => pageFrom(p, "รูป " + (i + 1)));else pgs = [pageFrom(plan, "หลังคา")];
      pagesRef.current = pgs;
      setPages(pgs);
      setActivePage(0);
      applyPage(pgs[0]);
      if (plan.wp != null && +plan.wp > 0) setWp(+plan.wp);
      if (plan.isc != null && +plan.isc > 0) setPanelIsc(+plan.isc);
      if (plan.ac) {
        setAcKw(plan.ac.kw != null && plan.ac.kw !== 0 ? String(plan.ac.kw) : jobKw ? String(jobKw) : "");
        setAcPhase(plan.ac.phase === 3 ? 3 : 1);
        setInvType(plan.ac.inv === "string" ? "string" : "micro");
      }
    } else {
      const pg = pageFrom(null, "หลังคา");
      pagesRef.current = [pg];
      setPages([pg]);
      setActivePage(0);
    }
    setLoaded(true);
  }, [loading, plan, loaded]);
  const [tool, setTool] = React.useState(null);
  const [lineKind, setLineKind] = React.useState("dc");
  const [lineSize, setLineSize] = React.useState(0);
  const [lineCores, setLineCores] = React.useState(1);
  const [lineConduit, setLineConduit] = React.useState("none");
  const [lineConduitSize, setLineConduitSize] = React.useState("");
  const [markerKind, setMarkerKind] = React.useState("inverter");
  const [junctionTarget, setJunctionTarget] = React.useState("");
  const [draft, setDraft] = React.useState([]);
  const [calPts, setCalPts] = React.useState([]);
  const [calMetersInput, setCalMetersInput] = React.useState("");
  const [hideAnno, setHideAnno] = React.useState(false);
  const [panelOrient, setPanelOrient] = React.useState("port");
  const [panelSku, setPanelSku] = React.useState("");
  const [panelShort, setPanelShort] = React.useState(PLAN_PANEL_SHORT);
  const [panelLong, setPanelLong] = React.useState(PLAN_PANEL_LONG);
  const [panelRows, setPanelRows] = React.useState(2);
  const [panelCols, setPanelCols] = React.useState(4);
  const [panelRot, setPanelRot] = React.useState(0);
  const [microN, setMicroN] = React.useState(PLAN_MICRO_PANELS);
  const [wp, setWp] = React.useState(PLAN_WP_DEFAULT);
  const [panelIsc, setPanelIsc] = React.useState(0);
  const [linkColor, setLinkColor] = React.useState(PLAN_LINK_COLORS[0]);
  const [linkFrom, setLinkFrom] = React.useState(null);
  const [linkPts, setLinkPts] = React.useState([]);
  const [photoView, setPhotoView] = React.useState(null);
  const [photoIdx, setPhotoIdx] = React.useState(0);
  const [photoDraw, setPhotoDraw] = React.useState(false);
  const [penColor, setPenColor] = React.useState("#EF4444");
  const [penMode, setPenMode] = React.useState("free");
  const [strokes, setStrokes] = React.useState([]);
  const drawCanvasRef = React.useRef(null);
  const drawImgRef = React.useRef(null);
  const penDownRef = React.useRef(false);
  const curStrokeRef = React.useRef(null);
  const [lineEdit, setLineEdit] = React.useState(null);
  const [linkEdit, setLinkEdit] = React.useState(null);
  const [noteEdit, setNoteEdit] = React.useState(null);
  const [pairFrom, setPairFrom] = React.useState(null);
  const [snapStraight, setSnapStraight] = React.useState(true);
  const [showGrid, setShowGrid] = React.useState(false);
  const [yieldFactor, setYieldFactor] = React.useState(1400);
  const [copied, setCopied] = React.useState(false);
  const jobKw = job && (parseFloat(job.kw) || 0) || 0;
  const jobPhase = String(job && job.phase) === "3" ? 3 : 1;
  const [acKw, setAcKw] = React.useState(jobKw ? String(jobKw) : "");
  const [acPhase, setAcPhase] = React.useState(jobPhase);
  const [invType, setInvType] = React.useState("micro");
  const mark = () => setDirty(true);
  React.useEffect(() => {
    if (!loaded) return;
    if (draggingRef.current) return;
    if (restoringRef.current) {
      restoringRef.current = false;
      return;
    }
    const prev = snapRef.current;
    if (prev && prev.lines === lines && prev.markers === markers && prev.panels === panels && prev.micros === micros && prev.links === links && prev.notes === notes && (prev.draft === draft || (prev.draft || []).length === 0 && draft.length === 0)) return;
    const snap = {
      lines,
      markers,
      panels,
      micros,
      links,
      notes,
      draft
    };
    if (prev) {
      histRef.current.push(prev);
      if (histRef.current.length > 60) histRef.current.shift();
      setHistLen(histRef.current.length);
    }
    snapRef.current = snap;
  }, [lines, markers, panels, micros, links, notes, draft, loaded]);
  const undo = () => {
    if (!histRef.current.length) return;
    const prev = histRef.current.pop();
    restoringRef.current = true;
    setLines(prev.lines);
    setMarkers(prev.markers);
    setPanels(prev.panels);
    setMicros(prev.micros);
    setLinks(prev.links);
    setNotes(prev.notes || []);
    setDraft(prev.draft || []);
    snapRef.current = prev;
    setHistLen(histRef.current.length);
    setLinkFrom(null);
    setLinkPts([]);
    setPairFrom(null);
    mark();
  };
  const pageSnap = () => ({
    image,
    imgW: imgDim.w,
    imgH: imgDim.h,
    mpp,
    calib,
    lines,
    markers,
    panels,
    micros,
    links,
    notes
  });
  const pageFrom = (o, name) => ({
    id: o && o.id || _pid("pg"),
    name: o && o.name || name || "รูป",
    image: o && o.image || null,
    imgW: +(o && o.imgW) || 0,
    imgH: +(o && o.imgH) || 0,
    mpp: o && o.mpp != null ? +o.mpp : null,
    calib: o && o.calib || null,
    lines: o && Array.isArray(o.lines) ? o.lines : [],
    markers: o && Array.isArray(o.markers) ? o.markers : [],
    panels: o && Array.isArray(o.panels) ? o.panels : [],
    micros: o && Array.isArray(o.micros) ? o.micros : [],
    links: o && Array.isArray(o.links) ? o.links : [],
    notes: o && Array.isArray(o.notes) ? o.notes : []
  });
  const applyPage = p => {
    setImage(p.image || null);
    setImgDim({
      w: +p.imgW || 0,
      h: +p.imgH || 0
    });
    setMpp(p.mpp != null ? +p.mpp : null);
    setCalib(p.calib || null);
    setLines(p.lines || []);
    setMarkers(p.markers || []);
    setPanels(p.panels || []);
    setMicros(p.micros || []);
    setLinks(p.links || []);
    setNotes(p.notes || []);
  };
  const resetForPageSwitch = () => {
    setTool(null);
    setDraft([]);
    setCalPts([]);
    setLinkFrom(null);
    setLinkPts([]);
    setPairFrom(null);
    setPhotoView(null);
    setPhotoDraw(false);
    setStrokes([]);
    setLineEdit(null);
    setLinkEdit(null);
    setNoteEdit(null);
    histRef.current = [];
    snapRef.current = null;
    setHistLen(0);
  };
  const commitActive = () => {
    const arr = (pagesRef.current || []).map((p, i) => i === activePage ? Object.assign({}, p, pageSnap()) : p);
    pagesRef.current = arr;
    return arr;
  };
  const gotoPage = i => {
    if (i === activePage || i < 0 || i >= pagesRef.current.length) return;
    const arr = commitActive();
    setPages(arr);
    applyPage(arr[i]);
    setActivePage(i);
    resetForPageSwitch();
    mark();
  };
  const addPage = () => {
    const arr = commitActive();
    const np = pageFrom(null, "รูป " + (arr.length + 1));
    const next = arr.concat([np]);
    pagesRef.current = next;
    setPages(next);
    applyPage(np);
    setActivePage(next.length - 1);
    resetForPageSwitch();
    mark();
  };
  const deletePage = i => {
    if (pagesRef.current.length <= 1) return;
    if (!window.confirm("ลบหน้านี้และทุกอย่างในหน้า?")) return;
    const committed = commitActive();
    const next = committed.filter((_, j) => j !== i);
    pagesRef.current = next;
    const ni = i <= activePage ? Math.max(0, activePage - (i < activePage ? 1 : 0)) : activePage;
    const clamped = Math.min(ni, next.length - 1);
    setPages(next);
    applyPage(next[clamped]);
    setActivePage(clamped);
    resetForPageSwitch();
    mark();
  };
  const renamePage = i => {
    const cur = pagesRef.current[i];
    if (!cur) return;
    const nm = window.prompt("ชื่อหน้า:", cur.name || "");
    if (nm == null) return;
    const next = pagesRef.current.map((p, j) => j === i ? Object.assign({}, p, {
      name: nm.trim() || p.name
    }) : p);
    pagesRef.current = next;
    setPages(next);
    mark();
  };
  const countJunctions = () => {
    const seen = new Set();
    (pagesRef.current || []).forEach((pg, i) => {
      const list = i === activePage ? markers : pg.markers || [];
      list.forEach(m => {
        if (m.kind === "xpage" && m.jid) seen.add(m.jid);
      });
    });
    return seen.size;
  };
  const addJunction = (x, y) => {
    const arr0 = pagesRef.current || [];
    const activeId = (arr0[activePage] || {}).id;
    const target = junctionTarget || (arr0.find((p, i) => i !== activePage) || {}).id;
    if (!target || target === activeId) {
      alert("ต้องมีอย่างน้อย 2 รูป แล้วเลือกหน้าปลายทางก่อน (＋ เพิ่มรูป ด้านบน)");
      return;
    }
    const jid = _pid("jx"),
      n = countJunctions() + 1;
    const here = {
      id: _pid("m"),
      kind: "xpage",
      x,
      y,
      jid,
      n,
      toPage: target
    };
    const there = {
      id: _pid("m"),
      kind: "xpage",
      x: 0.5,
      y: 0.5,
      jid,
      n,
      toPage: activeId
    };
    const newActiveMarkers = markers.concat([here]);
    setMarkers(newActiveMarkers);
    const arr = arr0.map((p, i) => {
      if (i === activePage) return Object.assign({}, p, pageSnap(), {
        markers: newActiveMarkers
      });
      if (p.id === target) return Object.assign({}, p, {
        markers: (p.markers || []).concat([there])
      });
      return p;
    });
    pagesRef.current = arr;
    setPages(arr);
    mark();
  };
  React.useEffect(() => {
    if (tool !== "xpage") return;
    const others = pages.filter((p, i) => i !== activePage);
    if (others.length && (!junctionTarget || !others.some(p => p.id === junctionTarget))) setJunctionTarget(others[0].id);
  }, [tool, activePage, pages]);
  const imgRef = React.useRef(null);
  const svgRef = React.useRef(null);
  const [disp, setDisp] = React.useState({
    w: 0,
    h: 0
  });
  const measure = React.useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDisp({
      w: r.width,
      h: r.height
    });
  }, []);
  React.useEffect(() => {
    measure();
    const el = imgRef.current;
    if (!el) return;
    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener("resize", measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [image, measure]);
  const segNat = (a, b) => Math.hypot((a.x - b.x) * (imgDim.w || 1), (a.y - b.y) * (imgDim.h || 1));
  const lineNatLen = pts => {
    let s = 0;
    for (let i = 1; i < pts.length; i++) s += segNat(pts[i - 1], pts[i]);
    return s;
  };
  const lineMeters = ln => {
    if (ln.manualM != null && +ln.manualM > 0) return +ln.manualM;
    if (mpp && ln.pts.length >= 2) return lineNatLen(ln.pts) * mpp;
    return null;
  };
  const fmtM = m => m == null ? "—" : (Math.round(m * 10) / 10).toLocaleString() + " ม.";
  const lineSpecText = ln => {
    const kc = PLAN_LINE_BY[ln.kind] || {};
    const parts = [];
    const nm = (kc.label || "") + (+ln.size > 0 ? " " + (ln.cores > 1 ? ln.cores + "Cx" : "") + ln.size + " mm²" : "");
    if (nm.trim()) parts.push(nm.trim());
    if (ln.conduit && ln.conduit !== "none") {
      const cd = PLAN_CONDUIT_BY[ln.conduit] || {};
      parts.push("ท่อ " + (cd.short || ln.conduit) + (ln.conduitSize ? " " + ln.conduitSize : ""));
    }
    return parts.join(" · ");
  };
  const updateLine = (id, patch) => {
    setLines(arr => arr.map(l => l.id === id ? Object.assign({}, l, patch) : l));
    mark();
  };
  const updateLink = (id, patch) => {
    setLinks(arr => arr.map(l => l.id === id ? Object.assign({}, l, patch) : l));
    mark();
  };
  const linkTitle = lk => lk.feed ? "สาย AC เข้าตู้ (คอมบายเนอร์→MDB)" : lk.ac ? "สาย AC เมน (ไมโคร→คอมบายเนอร์)" : "สตริง DC (ไมโคร→ไมโคร)";
  const linkMeters = lk => {
    if (lk.manualM != null && +lk.manualM > 0) return +lk.manualM;
    const a = linkNodeById(lk.from),
      b = linkNodeById(lk.to);
    if (!a || !b || !mpp) return null;
    const seq = lk.pts && lk.pts.length ? [a].concat(lk.pts, [b]) : [a, b];
    return lineNatLen(seq) * mpp;
  };
  const linkSpecText = lk => {
    const parts = [];
    const base = lk.ac ? "CV-FD" : "PV";
    if (+lk.size > 0) parts.push(base + " " + (lk.cores > 1 ? lk.cores + "Cx" : "") + lk.size + " mm²");
    if (lk.conduit && lk.conduit !== "none") {
      const cd = PLAN_CONDUIT_BY[lk.conduit] || {};
      parts.push("ท่อ " + (cd.short || lk.conduit) + (lk.conduitSize ? " " + lk.conduitSize : ""));
    }
    return parts.join(" · ");
  };
  const lineMid = ln => ln.pts[Math.floor(ln.pts.length / 2)] || ln.pts[0] || {
    x: 0.5,
    y: 0.5
  };
  const lineLabelXY = ln => ln.labelPos || lineMid(ln);
  const linkMidXY = lk => {
    const a = linkNodeById(lk.from),
      b = linkNodeById(lk.to);
    if (!a || !b) return {
      x: 0.5,
      y: 0.5
    };
    const seq = lk.pts && lk.pts.length ? [a].concat(lk.pts, [b]) : [a, b];
    return seq[Math.floor(seq.length / 2)] || a;
  };
  const linkLabelXY = lk => lk.labelPos || linkMidXY(lk);
  const labelHitAt = f => {
    const fx = f.x * disp.w,
      fy = f.y * disp.h;
    const inBox = p => {
      const lx = p.x * disp.w,
        ly = p.y * disp.h;
      return Math.abs(fx - lx) <= p.halfW && fy >= ly - 28 && fy <= ly + 24;
    };
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i];
      const p = lineLabelXY(ln);
      const lbl = fmtM(lineMeters(ln)),
        lw = Math.max(30, lbl.length * 7.3 + 12);
      const spec = lineSpecText(ln),
        sw = spec ? Math.max(42, spec.length * 6.1 + 14) : 0;
      if (inBox({
        x: p.x,
        y: p.y,
        halfW: Math.max(lw, sw) / 2 + 4
      })) return {
        type: "lineLabel",
        id: ln.id
      };
    }
    for (let i = links.length - 1; i >= 0; i--) {
      const lk = links[i];
      if (!lk.ac && !linkSpecText(lk)) continue;
      const p = linkLabelXY(lk);
      const lbl = fmtM(linkMeters(lk)),
        lw = Math.max(30, lbl.length * 7.3 + 12);
      const spec = linkSpecText(lk),
        sw = spec ? Math.max(42, spec.length * 6.1 + 14) : 0;
      if (inBox({
        x: p.x,
        y: p.y,
        halfW: Math.max(lw, sw) / 2 + 4
      })) return {
        type: "linkLabel",
        id: lk.id
      };
    }
    return null;
  };
  const orthoPoints = (prev, x, y) => {
    const dxPx = Math.abs((x - prev.x) * disp.w),
      dyPx = Math.abs((y - prev.y) * disp.h);
    const corner = dxPx >= dyPx ? {
      x: x,
      y: prev.y
    } : {
      x: prev.x,
      y: y
    };
    const out = [];
    if (Math.abs(corner.x - prev.x) * disp.w > 0.5 || Math.abs(corner.y - prev.y) * disp.h > 0.5) out.push(corner);
    out.push({
      x: x,
      y: y
    });
    return out;
  };
  const onTap = e => {
    const el = imgRef.current;
    if (!el || !image) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width,
      y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    if (tool === "draw") {
      if (snapStraight && draft.length > 0) {
        const prev = draft[draft.length - 1];
        setDraft(p => p.concat(orthoPoints(prev, x, y)));
      } else setDraft(p => p.concat([{
        x: x,
        y: y
      }]));
    } else if (tool === "calib") {
      setCalPts(p => {
        const n = p.concat([{
          x,
          y
        }]);
        return n.length > 2 ? [{
          x,
          y
        }] : n;
      });
    } else if (tool === "marker") {
      if (markerKind === "panel") {
        if (!mpp) {
          alert("ตั้งมาตราส่วนก่อน แล้วแผงจะวางเท่าขนาดจริง");
          return;
        }
        const pw = panelOrient === "land" ? panelLong : panelShort;
        const ph = panelOrient === "land" ? panelShort : panelLong;
        setPanels(p => p.concat([{
          id: _pid("pnl"),
          x,
          y,
          cols: panelCols,
          rows: panelRows,
          pw,
          ph,
          rot: panelRot
        }]));
        mark();
      } else if (markerKind === "micro") {
        let nx = x,
          ny = y;
        if (snapStraight && micros.length > 0) {
          let best = -1,
            bestD = Infinity;
          micros.forEach((m, i) => {
            const d = Math.abs((m.y - y) * disp.h);
            if (d < bestD) {
              bestD = d;
              best = i;
            }
          });
          if (best >= 0 && bestD <= 26) ny = micros[best].y;
        }
        setMicros(p => p.concat([{
          id: _pid("iv"),
          x: nx,
          y: ny,
          n: Math.max(1, Math.round(microN) || 1)
        }]));
        mark();
      } else {
        setMarkers(p => p.concat([{
          id: _pid("m"),
          kind: markerKind,
          x,
          y
        }]));
        mark();
      }
    } else if (tool === "photo") {
      let best = -1,
        bd = 30;
      markers.forEach((m, i) => {
        const d = Math.hypot((m.x - x) * disp.w, (m.y - y) * disp.h);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best >= 0) {
        const m = markers[best];
        if (markerPhotos(m).length) {
          setPhotoIdx(0);
          setPhotoView(m.id);
        } else openMarkerPhotoPicker(m.id);
      } else {
        const id = _pid("m");
        setMarkers(p => p.concat([{
          id,
          kind: "camera",
          x,
          y
        }]));
        mark();
        openMarkerPhotoPicker(id);
      }
    } else if (tool === "xpage") {
      addJunction(x, y);
    } else if (tool === "connect") {
      const mi = nearestMicro(x, y, 34),
        ci = nearestCombiner(x, y, 30),
        di = nearestMdb(x, y, 30);
      const cands = [];
      if (mi >= 0) cands.push({
        type: "micro",
        id: micros[mi].id,
        node: micros[mi]
      });
      if (ci >= 0) cands.push({
        type: "combiner",
        id: markers[ci].id,
        node: markers[ci]
      });
      if (di >= 0) cands.push({
        type: "mdb",
        id: markers[di].id,
        node: markers[di]
      });
      cands.forEach(c => {
        c.d = Math.hypot((c.node.x - x) * disp.w, (c.node.y - y) * disp.h);
      });
      cands.sort((a, b) => a.d - b.d);
      const tgt = cands[0] || null;
      const src = linkFrom ? linkNodeById(linkFrom) : null;
      if (src && src.type === "micro" && !tgt) {
        for (let i = panels.length - 1; i >= 0; i--) {
          const cell = cellAt(panels[i], x, y);
          if (cell) {
            setPanels(arr => arr.map((p, j) => {
              if (j !== i) return p;
              const cm = Object.assign({}, getCells(p));
              if (cm[cell.idx] === linkFrom) delete cm[cell.idx];else cm[cell.idx] = linkFrom;
              return Object.assign({}, p, {
                ivCells: cm,
                iv: null
              });
            }));
            mark();
            return;
          }
        }
      }
      if (!tgt) {
        if (linkFrom) {
          const prev = linkPts.length ? linkPts[linkPts.length - 1] : src;
          if (snapStraight && prev) setLinkPts(p => p.concat(orthoPoints(prev, x, y)));else setLinkPts(p => p.concat([{
            x: x,
            y: y
          }]));
        } else setLinkFrom(null);
        return;
      }
      if (!linkFrom) {
        if (tgt.type === "micro" || tgt.type === "combiner") {
          setLinkFrom(tgt.id);
          setLinkPts([]);
        }
        return;
      }
      if (tgt.id === linkFrom) {
        setLinkFrom(null);
        setLinkPts([]);
        return;
      }
      if (src && src.type === "micro") {
        if (tgt.type === "combiner") {
          const dup = links.some(l => l.ac && (l.from === linkFrom && l.to === tgt.id || l.from === tgt.id && l.to === linkFrom));
          if (!dup) {
            setLinks(p => p.concat([{
              id: _pid("lk"),
              from: linkFrom,
              to: tgt.id,
              color: PLAN_AC_TRUNK_COLOR,
              ac: true,
              pts: linkPts.slice()
            }]));
            mark();
          }
          setLinkFrom(null);
          setLinkPts([]);
        } else if (tgt.type === "micro") {
          const dup = links.some(l => !l.ac && (l.from === linkFrom && l.to === tgt.id || l.from === tgt.id && l.to === linkFrom));
          if (!dup) {
            setLinks(p => p.concat([{
              id: _pid("lk"),
              from: linkFrom,
              to: tgt.id,
              color: linkColor,
              pts: linkPts.slice()
            }]));
            mark();
          }
          setLinkFrom(tgt.id);
          setLinkPts([]);
        }
        return;
      }
      if (src && src.type === "combiner" && tgt.type === "mdb") {
        const dup = links.some(l => l.ac && (l.from === linkFrom && l.to === tgt.id || l.from === tgt.id && l.to === linkFrom));
        if (!dup) {
          setLinks(p => p.concat([{
            id: _pid("lk"),
            from: linkFrom,
            to: tgt.id,
            color: PLAN_AC_FEED_COLOR,
            ac: true,
            feed: true,
            pts: linkPts.slice()
          }]));
          mark();
        }
        setLinkFrom(null);
        setLinkPts([]);
      }
    } else if (tool === "note") {
      const id = _pid("nt");
      setNotes(p => p.concat([{
        id,
        x,
        y,
        text: ""
      }]));
      mark();
      setNoteEdit(id);
    } else if (tool === "erase") {
      eraseAt(x, y);
    }
  };
  const panelGeom = pnl => {
    const dpm = disp.w / (imgDim.w || 1) / (mpp || 1);
    const gap = PLAN_PANEL_GAP * dpm;
    const cw = pnl.pw * dpm,
      ch = pnl.ph * dpm;
    const totalW = pnl.cols * cw + (pnl.cols - 1) * gap;
    const totalH = pnl.rows * ch + (pnl.rows - 1) * gap;
    const cx = pnl.x * disp.w,
      cy = pnl.y * disp.h;
    return {
      dpm,
      gap,
      cw,
      ch,
      totalW,
      totalH,
      cx,
      cy,
      x0: cx - totalW / 2,
      y0: cy - totalH / 2
    };
  };
  const getCells = pnl => {
    if (pnl.ivCells && typeof pnl.ivCells === "object") return pnl.ivCells;
    if (pnl.iv) {
      const o = {},
        n = pnl.rows * pnl.cols;
      for (let k = 0; k < n; k++) o[k] = pnl.iv;
      return o;
    }
    return {};
  };
  const cellAt = (pnl, x, y) => {
    const g = panelGeom(pnl);
    const rad = -(pnl.rot || 0) * Math.PI / 180;
    const dx = x * disp.w - g.cx,
      dy = y * disp.h - g.cy;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad),
      ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    if (Math.abs(lx) > g.totalW / 2 || Math.abs(ly) > g.totalH / 2) return null;
    const c = Math.min(pnl.cols - 1, Math.max(0, Math.floor((lx + g.totalW / 2) / (g.cw + g.gap))));
    const r = Math.min(pnl.rows - 1, Math.max(0, Math.floor((ly + g.totalH / 2) / (g.ch + g.gap))));
    return {
      r,
      c,
      idx: r * pnl.cols + c
    };
  };
  const cellCenterPx = (pnl, r, c) => {
    const g = panelGeom(pnl);
    const lx = -g.totalW / 2 + c * (g.cw + g.gap) + g.cw / 2;
    const ly = -g.totalH / 2 + r * (g.ch + g.gap) + g.ch / 2;
    const rad = (pnl.rot || 0) * Math.PI / 180;
    return {
      X: g.cx + lx * Math.cos(rad) - ly * Math.sin(rad),
      Y: g.cy + lx * Math.sin(rad) + ly * Math.cos(rad)
    };
  };
  const nearestMicro = (x, y, maxPx) => {
    let best = -1,
      bd = maxPx;
    micros.forEach((m, i) => {
      const d = Math.hypot((m.x - x) * disp.w, (m.y - y) * disp.h);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const nearestMarkerKind = (kind, x, y, maxPx) => {
    let best = -1,
      bd = maxPx;
    markers.forEach((m, i) => {
      if (m.kind !== kind) return;
      const d = Math.hypot((m.x - x) * disp.w, (m.y - y) * disp.h);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const nearestCombiner = (x, y, maxPx) => nearestMarkerKind("combiner", x, y, maxPx);
  const nearestMdb = (x, y, maxPx) => nearestMarkerKind("mdb", x, y, maxPx);
  const linkNodeById = id => {
    const mi = micros.find(m => m.id === id);
    if (mi) return {
      type: "micro",
      x: mi.x,
      y: mi.y
    };
    const mk = markers.find(m => m.id === id);
    if (mk) return {
      type: mk.kind,
      x: mk.x,
      y: mk.y
    };
    return null;
  };
  const noteBox = nt => {
    const rows = (nt.text || "").split("\n");
    const fs = 12.5;
    const maxLen = rows.reduce((m, r) => Math.max(m, (r || "").length), 4);
    const w = Math.max(46, maxLen * fs * 0.56 + 20);
    const h = rows.length * (fs + 5) + 12;
    const cx = nt.x * disp.w,
      cy = nt.y * disp.h;
    return {
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
      cx,
      cy,
      fs,
      rows
    };
  };
  const eraseAt = (x, y) => {
    const px = (fx, fy) => ({
      X: fx * disp.w,
      Y: fy * disp.h
    });
    const T = px(x, y);
    const mi = nearestMicro(x, y, 22);
    if (mi >= 0) {
      const id = micros[mi].id;
      setMicros(arr => arr.filter((_, j) => j !== mi));
      setLinks(arr => arr.filter(l => l.from !== id && l.to !== id));
      setPanels(arr => arr.map(p => {
        const cm = getCells(p);
        const out = {};
        let changed = p.iv === id;
        Object.keys(cm).forEach(k => {
          if (cm[k] === id) changed = true;else out[k] = cm[k];
        });
        return changed ? Object.assign({}, p, {
          ivCells: out,
          iv: null
        }) : p;
      }));
      mark();
      return;
    }
    let bestM = -1,
      bestMd = 20;
    markers.forEach((m, i) => {
      const p = px(m.x, m.y);
      const d = Math.hypot(p.X - T.X, p.Y - T.Y);
      if (d < bestMd) {
        bestMd = d;
        bestM = i;
      }
    });
    if (bestM >= 0) {
      const mk = markers[bestM],
        mid = mk.id;
      setMarkers(arr => arr.filter((_, i) => i !== bestM));
      setLinks(arr => arr.filter(l => l.from !== mid && l.to !== mid));
      if (mk.kind === "xpage" && mk.jid) {
        const arr = (pagesRef.current || []).map((p, i) => i === activePage ? p : Object.assign({}, p, {
          markers: (p.markers || []).filter(mm => mm.jid !== mk.jid)
        }));
        pagesRef.current = arr;
        setPages(arr);
      }
      mark();
      return;
    }
    for (let i = notes.length - 1; i >= 0; i--) {
      const nt = notes[i],
        g = noteBox(nt);
      if (T.X >= g.x && T.X <= g.x + g.w && T.Y >= g.y && T.Y <= g.y + g.h) {
        setNotes(arr => arr.filter((_, j) => j !== i));
        mark();
        return;
      }
    }
    let bestL = -1,
      bestLd = 12;
    lines.forEach((ln, i) => {
      for (let k = 1; k < ln.pts.length; k++) {
        const a = px(ln.pts[k - 1].x, ln.pts[k - 1].y),
          b = px(ln.pts[k].x, ln.pts[k].y);
        const d = distToSeg(T.X, T.Y, a.X, a.Y, b.X, b.Y);
        if (d < bestLd) {
          bestLd = d;
          bestL = i;
        }
      }
    });
    if (bestL >= 0) {
      setLines(arr => arr.filter((_, i) => i !== bestL));
      mark();
      return;
    }
    const microById = {};
    micros.forEach(m => {
      microById[m.id] = m;
    });
    markers.forEach(m => {
      if (m.kind === "combiner" || m.kind === "mdb") microById[m.id] = m;
    });
    let bestK = -1,
      bestKd = 10;
    links.forEach((lk, i) => {
      const a = microById[lk.from],
        b = microById[lk.to];
      if (!a || !b) return;
      const d = distToSeg(T.X, T.Y, a.x * disp.w, a.y * disp.h, b.x * disp.w, b.y * disp.h);
      if (d < bestKd) {
        bestKd = d;
        bestK = i;
      }
    });
    if (bestK >= 0) {
      setLinks(arr => arr.filter((_, i) => i !== bestK));
      mark();
      return;
    }
    for (let i = panels.length - 1; i >= 0; i--) {
      const g = panelGeom(panels[i]);
      const rad = -(panels[i].rot || 0) * Math.PI / 180;
      const dx = T.X - g.cx,
        dy = T.Y - g.cy;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (Math.abs(lx) <= g.totalW / 2 && Math.abs(ly) <= g.totalH / 2) {
        setPanels(arr => arr.filter((_, j) => j !== i));
        mark();
        return;
      }
    }
  };
  const finishLine = () => {
    if (draft.length >= 2) {
      setLines(p => p.concat([{
        id: _pid("l"),
        kind: lineKind,
        pts: draft,
        manualM: null,
        size: +lineSize || 0,
        cores: +lineCores || 1,
        conduit: lineConduit || "none",
        conduitSize: lineConduitSize || ""
      }]));
      mark();
    }
    setDraft([]);
  };
  const cancelDraft = () => setDraft([]);
  const dragRef = React.useRef(null);
  const evtFrac = e => {
    const el = imgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height
    };
  };
  const insidePanel = (pnl, x, y) => {
    const g = panelGeom(pnl);
    const rad = -(pnl.rot || 0) * Math.PI / 180;
    const dx = x * disp.w - g.cx,
      dy = y * disp.h - g.cy;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad),
      ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(lx) <= g.totalW / 2 && Math.abs(ly) <= g.totalH / 2;
  };
  const onDragStart = e => {
    if (tool !== "move" || !image) return;
    const f = evtFrac(e);
    if (!f) return;
    const lab = labelHitAt(f);
    let noteHit = null;
    for (let i = notes.length - 1; i >= 0; i--) {
      const g = noteBox(notes[i]),
        px = f.x * disp.w,
        py = f.y * disp.h;
      if (px >= g.x && px <= g.x + g.w && py >= g.y && py <= g.y + g.h) {
        noteHit = {
          type: "note",
          id: notes[i].id
        };
        break;
      }
    }
    if (lab) {
      dragRef.current = lab;
    } else if (noteHit) {
      dragRef.current = noteHit;
    } else {
      const mi = nearestMicro(f.x, f.y, 26);
      if (mi >= 0) {
        dragRef.current = {
          type: "micro",
          i: mi
        };
      } else {
        let hit = null;
        for (let i = panels.length - 1; i >= 0; i--) {
          if (insidePanel(panels[i], f.x, f.y)) {
            hit = {
              type: "panel",
              i
            };
            break;
          }
        }
        if (!hit) {
          let best = -1,
            bd = 22;
          markers.forEach((m, i) => {
            const d = Math.hypot((m.x - f.x) * disp.w, (m.y - f.y) * disp.h);
            if (d < bd) {
              bd = d;
              best = i;
            }
          });
          if (best >= 0) hit = {
            type: "marker",
            i: best
          };
        }
        dragRef.current = hit;
      }
    }
    if (dragRef.current) {
      draggingRef.current = true;
      movedRef.current = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  };
  const onDragMove = e => {
    const d = dragRef.current;
    if (!d) return;
    const f = evtFrac(e);
    if (!f) return;
    movedRef.current = true;
    const x = Math.min(1, Math.max(0, f.x)),
      y = Math.min(1, Math.max(0, f.y));
    if (d.type === "micro") setMicros(arr => arr.map((m, j) => j === d.i ? Object.assign({}, m, {
      x,
      y
    }) : m));else if (d.type === "panel") setPanels(arr => arr.map((p, j) => j === d.i ? Object.assign({}, p, {
      x,
      y
    }) : p));else if (d.type === "marker") setMarkers(arr => arr.map((m, j) => j === d.i ? Object.assign({}, m, {
      x,
      y
    }) : m));else if (d.type === "lineLabel") setLines(arr => arr.map(l => l.id === d.id ? Object.assign({}, l, {
      labelPos: {
        x,
        y
      }
    }) : l));else if (d.type === "linkLabel") setLinks(arr => arr.map(l => l.id === d.id ? Object.assign({}, l, {
      labelPos: {
        x,
        y
      }
    }) : l));else if (d.type === "note") setNotes(arr => arr.map(n => n.id === d.id ? Object.assign({}, n, {
      x,
      y
    }) : n));
  };
  const onDragEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    draggingRef.current = false;
    if (movedRef.current) {
      if (snapRef.current) {
        histRef.current.push(snapRef.current);
        if (histRef.current.length > 60) histRef.current.shift();
        setHistLen(histRef.current.length);
      }
      snapRef.current = {
        lines,
        markers,
        panels,
        micros,
        links,
        notes,
        draft
      };
      mark();
    }
    movedRef.current = false;
  };
  const fileRef = React.useRef(null);
  const pickImage = async file => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, 1400, 0.82);
      const dim = await new Promise(res => {
        const im = new Image();
        im.onload = () => res({
          w: im.naturalWidth,
          h: im.naturalHeight
        });
        im.onerror = () => res({
          w: 0,
          h: 0
        });
        im.src = dataUrl;
      });
      setImage(dataUrl);
      setImgDim(dim);
      setMpp(null);
      setCalib(null);
      setLines([]);
      setMarkers([]);
      setPanels([]);
      setMicros([]);
      setLinks([]);
      setNotes([]);
      setLinkFrom(null);
      setDraft([]);
      setCalPts([]);
      histRef.current = [];
      snapRef.current = null;
      setHistLen(0);
      mark();
    } catch (err) {
      alert("โหลดรูปไม่สำเร็จ: " + err.message);
    }
    setBusy(false);
  };
  const addFileRef = React.useRef(null);
  const addPageWithImage = async file => {
    if (!file) return;
    addPage();
    await pickImage(file);
  };
  const markerPhotoRef = React.useRef(null);
  const photoTargetRef = React.useRef(null);
  const markerPhotos = m => m && m.photos ? m.photos : m && m.photo ? [m.photo] : [];
  const openMarkerPhotoPicker = id => {
    photoTargetRef.current = id;
    if (markerPhotoRef.current) markerPhotoRef.current.click();
  };
  const attachMarkerPhoto = async file => {
    const id = photoTargetRef.current;
    if (!file || !id) return;
    const cur = markers.find(m => m.id === id);
    const newIdx = markerPhotos(cur).length;
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, 900, 0.6);
      setMarkers(arr => arr.map(m => {
        if (m.id !== id) return m;
        const nm = Object.assign({}, m, {
          photos: markerPhotos(m).concat([dataUrl])
        });
        delete nm.photo;
        return nm;
      }));
      mark();
      setPhotoView(id);
      setPhotoIdx(newIdx);
    } catch (err) {
      alert("โหลดรูปไม่สำเร็จ: " + err.message);
    }
    setBusy(false);
  };
  const removeMarkerPhotoAt = (id, idx) => {
    const cur = markers.find(m => m.id === id);
    const len = markerPhotos(cur).length;
    setMarkers(arr => arr.map(m => {
      if (m.id !== id) return m;
      const ps = markerPhotos(m).slice();
      ps.splice(idx, 1);
      const nm = Object.assign({}, m, {
        photos: ps
      });
      delete nm.photo;
      return nm;
    }));
    mark();
    if (len <= 1) setPhotoView(null);else setPhotoIdx(i => Math.max(0, i - (idx <= i ? 1 : 0)));
  };
  const drawPhotoItem = (ctx, s) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width || 3;
    if (s.type === "text") {
      const fs = s.size || 28;
      ctx.font = "700 " + fs + "px system-ui, -apple-system, sans-serif";
      ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(3, fs / 6);
      ctx.strokeStyle = "#fff";
      ctx.strokeText(s.text, s.x, s.y);
      ctx.fillText(s.text, s.x, s.y);
    } else if (s.type === "line") {
      ctx.beginPath();
      ctx.moveTo(s.a.x, s.a.y);
      ctx.lineTo(s.b.x, s.b.y);
      ctx.stroke();
    } else {
      if (!s.pts || !s.pts.length) return;
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
      if (s.pts.length === 1) ctx.lineTo(s.pts[0].x + 0.1, s.pts[0].y + 0.1);
      ctx.stroke();
    }
  };
  const redrawPhotoCanvas = preview => {
    const cv = drawCanvasRef.current,
      im = drawImgRef.current;
    if (!cv || !im) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(im, 0, 0, cv.width, cv.height);
    strokes.forEach(s => drawPhotoItem(ctx, s));
    if (preview) drawPhotoItem(ctx, preview);
  };
  React.useEffect(() => {
    if (!photoDraw || !photoView) return;
    const m = markers.find(mm => mm.id === photoView);
    const ps = markerPhotos(m);
    const src = ps[Math.min(photoIdx, ps.length - 1)];
    if (!src) return;
    const im = new Image();
    im.onload = () => {
      drawImgRef.current = im;
      const cv = drawCanvasRef.current;
      if (!cv) return;
      const maxW = 1400;
      let w = im.naturalWidth || 1000,
        h = im.naturalHeight || 1000;
      if (w > maxW) {
        h = h * maxW / w;
        w = maxW;
      }
      cv.width = Math.round(w);
      cv.height = Math.round(h);
      redrawPhotoCanvas();
    };
    im.src = src;
  }, [photoDraw, photoView, photoIdx]);
  React.useEffect(() => {
    if (photoDraw) redrawPhotoCanvas();
  }, [strokes, photoDraw]);
  const photoPenXY = e => {
    const cv = drawCanvasRef.current;
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (cv.width / r.width),
      y: (e.clientY - r.top) * (cv.height / r.height)
    };
  };
  const photoPenDown = e => {
    const cv = drawCanvasRef.current,
      p = photoPenXY(e);
    if (!cv || !p) return;
    const w = Math.max(3, cv.width / 260);
    if (penMode === "text") {
      const txt = window.prompt("พิมพ์ข้อความ / คอมเมนต์:", "");
      if (txt && txt.trim()) setStrokes(arr => arr.concat([{
        type: "text",
        color: penColor,
        x: p.x,
        y: p.y,
        size: Math.max(20, cv.width / 32),
        text: txt.trim()
      }]));
      return;
    }
    penDownRef.current = true;
    curStrokeRef.current = penMode === "line" ? {
      type: "line",
      color: penColor,
      width: w,
      a: p,
      b: p
    } : {
      type: "free",
      color: penColor,
      width: w,
      pts: [p]
    };
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (err) {}
  };
  const photoPenMove = e => {
    if (!penDownRef.current || !curStrokeRef.current) return;
    const cv = drawCanvasRef.current,
      p = photoPenXY(e);
    if (!cv || !p) return;
    const st = curStrokeRef.current;
    if (st.type === "line") {
      st.b = p;
      redrawPhotoCanvas(st);
      return;
    }
    st.pts.push(p);
    const ctx = cv.getContext("2d"),
      a = st.pts[st.pts.length - 2];
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };
  const photoPenUp = () => {
    if (!curStrokeRef.current) {
      penDownRef.current = false;
      return;
    }
    const st = curStrokeRef.current;
    curStrokeRef.current = null;
    penDownRef.current = false;
    setStrokes(arr => arr.concat([st]));
  };
  const openPhotoDraw = () => {
    setStrokes([]);
    setPhotoDraw(true);
  };
  const savePhotoDraw = () => {
    const cv = drawCanvasRef.current;
    if (!cv) return;
    const dataUrl = cv.toDataURL("image/jpeg", 0.85);
    const m = markers.find(mm => mm.id === photoView);
    const ps = markerPhotos(m);
    const idx = Math.min(photoIdx, ps.length - 1);
    setMarkers(arr => arr.map(mm => {
      if (mm.id !== photoView) return mm;
      const list = markerPhotos(mm).slice();
      list[idx] = dataUrl;
      const nm = Object.assign({}, mm, {
        photos: list
      });
      delete nm.photo;
      return nm;
    }));
    mark();
    setPhotoDraw(false);
    setStrokes([]);
  };
  const [exporting, setExporting] = React.useState(false);
  const [pdfInfo, setPdfInfo] = React.useState(() => {
    try {
      const s = localStorage.getItem("pgPdfInfo");
      if (s) return Object.assign({}, PDF_DEFAULTS, JSON.parse(s));
    } catch (e) {}
    return Object.assign({}, PDF_DEFAULTS);
  });
  const [pdfSettings, setPdfSettings] = React.useState(false);
  const pdfLogoRef = React.useRef(null);
  React.useEffect(() => {
    try {
      localStorage.setItem("pgPdfInfo", JSON.stringify(pdfInfo));
    } catch (e) {}
  }, [pdfInfo]);
  const attachPdfLogo = async file => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await resizeImageFile(file, 500, 0.85);
      setPdfInfo(p => Object.assign({}, p, {
        logo: url
      }));
    } catch (err) {
      alert("โหลดโลโก้ไม่สำเร็จ: " + err.message);
    }
    setBusy(false);
  };
  const loadImgAsync = src => new Promise(res => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
  const composeActivePlan = async () => {
    const svgEl = svgRef.current;
    if (!image || !svgEl) return null;
    const baseImg = await loadImgAsync(image);
    if (!baseImg) throw new Error("โหลดรูปพื้นไม่ได้");
    const natW = baseImg.naturalWidth || imgDim.w || disp.w || 1200,
      natH = baseImg.naturalHeight || imgDim.h || disp.h || 800;
    const maxW = 1800,
      sc = natW > maxW ? maxW / natW : 1,
      W = Math.round(natW * sc),
      H = Math.round(natH * sc);
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.drawImage(baseImg, 0, 0, W, H);
    const clone = svgEl.cloneNode(true);
    const oAll = svgEl.querySelectorAll("*"),
      cAll = clone.querySelectorAll("*");
    for (let i = 0; i < oAll.length; i++) {
      const st = getComputedStyle(oAll[i]);
      if (st.fill) cAll[i].setAttribute("fill", st.fill);
      if (st.stroke && st.stroke !== "none") cAll[i].setAttribute("stroke", st.stroke);
    }
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgImg = await loadImgAsync("data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone)));
    if (svgImg) ctx.drawImage(svgImg, 0, 0, W, H);
    return cv;
  };
  const deliverBlob = async (blob, fname, mode, type, shareText) => {
    if (mode === "share" && typeof navigator !== "undefined" && navigator.canShare) {
      const file = new File([blob], fname, {
        type
      });
      if (navigator.canShare({
        files: [file]
      })) {
        await navigator.share({
          files: [file],
          title: fname,
          text: shareText
        });
        return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const exportPlanImage = async mode => {
    if (!image) {
      alert("ยังไม่มีรูปผังในหน้านี้ให้ส่งออก");
      return;
    }
    setExporting(true);
    try {
      const plan = await composeActivePlan();
      if (!plan) throw new Error("สร้างรูปผังไม่ได้");
      const W = plan.width,
        headH = Math.max(56, Math.round(W * 0.07));
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = plan.height + headH;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#0F5132";
      ctx.fillRect(0, 0, W, headH);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      const pad = Math.round(W * 0.022),
        pageName = pages[activePage] && pages[activePage].name || "";
      ctx.font = "800 " + Math.round(headH * 0.34) + "px system-ui, sans-serif";
      ctx.fillText(job ? job.name : "ผังหน้างาน", pad, headH * 0.36);
      const scLbl = mpp ? "มาตราส่วน 1px≈" + Math.round(mpp * 10000) / 10000 + " ม." : "ยังไม่ตั้งมาตราส่วน";
      ctx.font = "600 " + Math.round(headH * 0.24) + "px system-ui, sans-serif";
      ctx.fillText("แบบติดตั้ง · " + (job ? job.code : "") + (pageName ? " · " + pageName : "") + " · " + scLbl + " · " + new Date().toLocaleDateString("th-TH"), pad, headH * 0.72);
      ctx.drawImage(plan, 0, headH, plan.width, plan.height);
      const fname = "แบบติดตั้ง_" + (job && job.code || "ผัง") + (pageName ? "_" + pageName : "") + ".jpg";
      const blob = await new Promise(res => cv.toBlob(res, "image/jpeg", 0.9));
      await deliverBlob(blob, fname, mode, "image/jpeg", (job ? job.name + " — " : "") + "แบบติดตั้งหน้างาน");
    } catch (err) {
      alert("ส่งออกไม่สำเร็จ: " + (err && err.message ? err.message : err));
    }
    setExporting(false);
  };
  const ensureJsPDF = () => new Promise((res, rej) => {
    if (window.jspdf && window.jspdf.jsPDF) return res(window.jspdf.jsPDF);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => window.jspdf && window.jspdf.jsPDF ? res(window.jspdf.jsPDF) : rej(new Error("โหลดไลบรารี PDF ไม่ได้"));
    s.onerror = () => rej(new Error("โหลดไลบรารี PDF ไม่ได้ (ต้องต่อเน็ต)"));
    document.head.appendChild(s);
  });
  const SW = 1600,
    SH = 900;
  const F = "system-ui, -apple-system, 'Segoe UI', 'Noto Sans Thai', 'Sarabun', sans-serif";
  const BG = "#0E4D33",
    BGD = "#0A3123",
    MINT = "#8FE3B8",
    SITE_URL = "www.phithangreen.com";
  const newSlide = bg => {
    const c = document.createElement("canvas");
    c.width = SW;
    c.height = SH;
    const x = c.getContext("2d");
    x.fillStyle = bg || "#ffffff";
    x.fillRect(0, 0, SW, SH);
    return {
      c,
      x
    };
  };
  const drawContain = (x, img, bx, by, bw, bh) => {
    if (!img) return;
    const iw = img.width || img.naturalWidth,
      ih = img.height || img.naturalHeight;
    if (!iw || !ih) return;
    const r = Math.min(bw / iw, bh / ih);
    const w = iw * r,
      h = ih * r;
    x.drawImage(img, bx + (bw - w) / 2, by + (bh - h) / 2, w, h);
  };
  const wrapTH = (x, text, maxW) => {
    const out = [];
    let cur = "";
    for (const ch of text || "") {
      const t = cur + ch;
      if (x.measureText(t).width > maxW && cur) {
        out.push(cur);
        cur = ch;
      } else cur = t;
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  };
  const foot = (x, dark) => {
    x.textBaseline = "alphabetic";
    x.textAlign = "right";
    x.fillStyle = dark ? "rgba(255,255,255,.72)" : "#9aa5a0";
    x.font = "600 20px " + F;
    x.fillText(SITE_URL, SW - 44, SH - 30);
    x.textAlign = "left";
    x.fillStyle = dark ? "rgba(255,255,255,.85)" : BG;
    x.font = "800 20px " + F;
    x.fillText("PHITHAN GREEN", 44, SH - 30);
  };
  const drawEmblem = (x, cx, cy, r) => {
    x.save();
    x.fillStyle = MINT;
    x.strokeStyle = MINT;
    x.lineWidth = Math.max(2, r * 0.14);
    x.lineCap = "round";
    x.beginPath();
    x.arc(cx, cy - r * 0.1, r * 0.42, 0, Math.PI * 2);
    x.fill();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * r * 0.62, cy - r * 0.1 + Math.sin(a) * r * 0.62);
      x.lineTo(cx + Math.cos(a) * r * 0.92, cy - r * 0.1 + Math.sin(a) * r * 0.92);
      x.stroke();
    }
    x.beginPath();
    x.moveTo(cx, cy + r * 0.5);
    x.quadraticCurveTo(cx + r * 0.55, cy + r * 0.5, cx + r * 0.55, cy + r * 1.05);
    x.quadraticCurveTo(cx, cy + r * 0.95, cx, cy + r * 0.5);
    x.fill();
    x.restore();
  };
  const pointLabel = m => m.kind === "xpage" ? "จุดต่อรูป #" + (m.n || "") : m.kind === "camera" ? "จุดกล้อง / ภาพหน้างาน" : (PLAN_MARKER_BY[m.kind] || {}).label || "จุดอุปกรณ์";
  const photoSlide = (tag, title, note, img) => {
    const {
      c,
      x
    } = newSlide(BGD);
    const barH = 172;
    x.textBaseline = "alphabetic";
    x.textAlign = "right";
    x.fillStyle = "rgba(255,255,255,.6)";
    x.font = "600 20px " + F;
    x.fillText(SITE_URL, SW - 44, 48);
    x.textAlign = "left";
    x.fillStyle = "rgba(255,255,255,.85)";
    x.font = "800 20px " + F;
    x.fillText("PHITHAN GREEN", 44, 48);
    drawContain(x, img, 56, 78, SW - 112, SH - 78 - barH - 18);
    x.fillStyle = BG;
    x.fillRect(0, SH - barH, SW, barH);
    x.textAlign = "left";
    if (tag) {
      x.fillStyle = MINT;
      x.font = "700 24px " + F;
      x.fillText(tag, 56, SH - barH + 46);
    }
    x.fillStyle = "#fff";
    x.font = "800 42px " + F;
    x.fillText(wrapTH(x, title, SW - 112)[0], 56, SH - barH + 98);
    if (note) {
      x.fillStyle = "rgba(255,255,255,.82)";
      x.font = "500 23px " + F;
      x.fillText(wrapTH(x, note, SW - 112)[0], 56, SH - barH + 140);
    }
    return c;
  };
  const sectionSlide = (title, sub) => {
    const {
      c,
      x
    } = newSlide(BG);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "rgba(255,255,255,.6)";
    x.font = "600 24px " + F;
    x.fillText(SITE_URL, SW / 2, 110);
    const lines = String(title).split("\n");
    x.fillStyle = "#fff";
    x.font = "800 62px " + F;
    lines.forEach((ln, i) => x.fillText(ln, SW / 2, SH / 2 - (lines.length - 1) * 40 + i * 80));
    if (sub) {
      x.fillStyle = MINT;
      x.font = "600 30px " + F;
      x.fillText(sub, SW / 2, SH / 2 + lines.length * 40 + 90);
    }
    x.textAlign = "left";
    return c;
  };
  const exportPlanPDF = async mode => {
    if (!image) {
      alert("ยังไม่มีรูปผังให้ทำ PDF");
      return;
    }
    setExporting(true);
    try {
      const JsPDF = await ensureJsPDF();
      commitActive();
      const activePlan = await composeActivePlan();
      const slides = [];
      const dateStr = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const logoImg = pdfInfo.logo ? await loadImgAsync(pdfInfo.logo) : null;
      const warr = (pdfInfo.warranties || []).map(s => (s || "").trim()).filter(Boolean);
      {
        const {
          c,
          x
        } = newSlide(BGD);
        x.textAlign = "center";
        x.textBaseline = "middle";
        if (logoImg) drawContain(x, logoImg, SW / 2 - 150, 70, 300, 150);else drawEmblem(x, SW / 2, 130, 46);
        x.fillStyle = "rgba(255,255,255,.6)";
        x.font = "600 22px " + F;
        x.fillText(SITE_URL, SW / 2, 258);
        x.fillStyle = "#fff";
        x.font = "800 86px " + F;
        x.fillText("S I T E   S U R V E Y", SW / 2, SH / 2 + 20);
        x.fillStyle = MINT;
        x.font = "700 38px " + F;
        x.fillText("P H I T H A N   G R E E N", SW / 2, SH / 2 + 100);
        x.fillStyle = "#fff";
        x.font = "700 30px " + F;
        x.fillText((job ? job.name + "  ·  " : "") + summary.kwp + " kWp", SW / 2, SH - 90);
        x.textAlign = "left";
        slides.push(c);
      }
      {
        const {
          c,
          x
        } = newSlide("#ffffff");
        x.fillStyle = BG;
        x.fillRect(0, 0, 560, SH);
        x.textAlign = "left";
        x.textBaseline = "alphabetic";
        const panelW = 560,
          nmMaxW = panelW - 96;
        let ly = 96;
        if (logoImg) {
          drawContain(x, logoImg, 48, ly, 200, 96);
          ly += 120;
        }
        let nmFs = 44;
        x.font = "800 " + nmFs + "px " + F;
        let nmLines = wrapTH(x, job ? job.name : "ลูกค้า", nmMaxW);
        while (nmLines.length > 2 && nmFs > 28) {
          nmFs -= 3;
          x.font = "800 " + nmFs + "px " + F;
          nmLines = wrapTH(x, job ? job.name : "ลูกค้า", nmMaxW);
        }
        ly += nmFs;
        x.fillStyle = "#fff";
        nmLines.slice(0, 2).forEach(ln => {
          x.fillText(ln, 48, ly);
          ly += nmFs + 6;
        });
        ly += 24;
        x.fillStyle = MINT;
        x.font = "800 66px " + F;
        x.fillText(summary.kwp + " kWp", 48, ly);
        ly += 40;
        x.fillStyle = "rgba(255,255,255,.85)";
        x.font = "500 24px " + F;
        x.fillText("กำลังการติดตั้ง (dc)", 48, ly);
        ly += 56;
        x.font = "500 23px " + F;
        if (job && job.code) {
          x.fillText("รหัสงาน: " + job.code, 48, ly);
          ly += 40;
        }
        x.fillText("วันที่: " + dateStr, 48, ly);
        const rx = 624;
        let ry = 150;
        x.fillStyle = BG;
        x.font = "800 34px " + F;
        x.fillText("การรับประกัน & บริการ", rx, ry);
        ry += 66;
        x.font = "500 30px " + F;
        warr.forEach(it => {
          x.fillStyle = BG;
          x.fillText("✓", rx, ry);
          x.fillStyle = "#1f2937";
          wrapTH(x, it, SW - rx - 90).forEach((ln, i) => {
            x.fillText(ln, rx + 42, ry + i * 40);
          });
          ry += 40 * Math.max(1, wrapTH(x, it, SW - rx - 90).length) + 18;
        });
        ry += 20;
        x.fillStyle = BG;
        x.font = "800 30px " + F;
        x.fillText("ติดต่อเพิ่มเติม", rx, ry);
        ry += 48;
        x.fillStyle = "#374151";
        x.font = "500 26px " + F;
        if (pdfInfo.email) {
          x.fillText("Email: " + pdfInfo.email, rx, ry);
          ry += 42;
        }
        if (pdfInfo.tel) {
          x.fillText("Tel: " + pdfInfo.tel, rx, ry);
        }
        foot(x, false);
        slides.push(c);
      }
      slides.push(sectionSlide("พื้นที่และรูปแบบ\nการติดตั้งโซลาร์เซลล์", ""));
      const pn = pages[activePage] && pages[activePage].name || "";
      slides.push(photoSlide("พื้นที่และรูปแบบการติดตั้ง", "ผังการติดตั้ง" + (pn ? " · " + pn : ""), (mpp ? "มาตราส่วน 1px ≈ " + Math.round(mpp * 10000) / 10000 + " ม.  ·  " : "") + "* อาจปรับเปลี่ยนตามหน้างาน", activePlan));
      const pgs = pagesRef.current || [];
      for (let pi = 0; pi < pgs.length; pi++) {
        if (pi === activePage) continue;
        const pg = pgs[pi];
        if (!pg.image) continue;
        const im = await loadImgAsync(pg.image);
        if (!im) continue;
        slides.push(photoSlide("พื้นที่และรูปแบบการติดตั้ง", "ผังหน้างาน · " + (pg.name || "รูป " + (pi + 1)), "เปิดหน้านี้ในแอปเพื่อดูเส้น/จุดแบบเต็ม", im));
      }
      const pts = [];
      pgs.forEach((pg, pi) => {
        (pg.markers || []).forEach(m => {
          const ps = markerPhotos(m);
          if (ps.length) pts.push({
            m,
            ps,
            pageName: pg.name || "รูป " + (pi + 1)
          });
        });
      });
      if (pts.length) slides.push(sectionSlide("การดำเนินงาน", "จุดติดตั้ง · แนวเดินสาย · หน้างานจริง"));
      for (let i = 0; i < pts.length; i++) {
        const {
          m,
          ps,
          pageName
        } = pts[i];
        for (let j = 0; j < ps.length; j++) {
          const im = await loadImgAsync(ps[j]);
          if (!im) continue;
          const sub = "หน้า: " + pageName + (ps.length > 1 ? "  ·  รูป " + (j + 1) + "/" + ps.length : "") + (m.kind === "xpage" && m.toPage ? "  ·  เชื่อมไป " + ((pgs.find(p => p.id === m.toPage) || {}).name || "อีกหน้า") : "") + "  ·  * อาจปรับเปลี่ยนตามหน้างาน";
          slides.push(photoSlide("การดำเนินงาน", pointLabel(m), sub, im));
        }
      }
      {
        const {
          c,
          x
        } = newSlide("#ffffff");
        x.fillStyle = BG;
        x.fillRect(0, 0, SW, 108);
        x.fillStyle = "#fff";
        x.textAlign = "left";
        x.textBaseline = "middle";
        x.font = "800 40px " + F;
        x.fillText("อุปกรณ์ของที่ใช้ในงาน · ประเมินเบื้องต้น", 48, 56);
        x.textBaseline = "alphabetic";
        let yy = 196;
        const row = (label, val) => {
          x.font = "600 30px " + F;
          x.fillStyle = "#374151";
          x.textAlign = "left";
          x.fillText("•  " + label, 70, yy);
          x.font = "800 30px " + F;
          x.fillStyle = BG;
          x.textAlign = "right";
          x.fillText(val, SW - 70, yy);
          x.textAlign = "left";
          yy += 56;
        };
        row("กำลังติดตั้งรวม", summary.kwp + " kWp");
        row("แผงโซลาร์" + (+wp > 0 ? " (" + wp + "W)" : ""), summary.panelTotal + " แผง · " + summary.panelBlocks + " บล็อก");
        row("ไมโครอินเวอร์เตอร์", summary.microCount + " ตัว (รับ " + summary.microPanels + " แผง)");
        (takeoff.cab || []).forEach(cb => row("สาย " + (cb.label || cb.name || ""), cb.meters != null ? cb.meters + " ม." : ""));
        (takeoff.conduit || []).forEach(cd => row("ท่อร้อยสาย " + (cd.label || ""), (cd.size ? cd.size + " · " : "") + cd.meters + " ม."));
        if (takeoff.estKwh) row("ประเมินผลิตไฟ", "≈ " + takeoff.estKwh.toLocaleString() + " kWh/ปี");
        x.fillStyle = "#9ca3af";
        x.font = "500 22px " + F;
        x.fillText("* ประเมินเบื้องต้นจากผังหน้างาน ใช้ประกอบการติดตั้ง — ยืนยันหน้างานอีกครั้ง", 70, yy + 18);
        foot(x, false);
        slides.push(c);
      }
      {
        const {
          c,
          x
        } = newSlide(BGD);
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillStyle = "#fff";
        x.font = "800 86px " + F;
        x.fillText("THANK YOU", SW / 2, SH / 2 - 16);
        x.fillStyle = "rgba(255,255,255,.7)";
        x.font = "600 28px " + F;
        x.fillText(SITE_URL, SW / 2, SH / 2 + 66);
        x.textAlign = "left";
        slides.push(c);
      }
      const pdf = new JsPDF({
        orientation: "landscape",
        unit: "px",
        format: [SW, SH],
        compress: true
      });
      slides.forEach((c, i) => {
        if (i) pdf.addPage([SW, SH], "landscape");
        pdf.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, SW, SH);
      });
      const fname = "SiteSurvey_" + (job && job.code || "plan") + ".pdf";
      await deliverBlob(pdf.output("blob"), fname, mode, "application/pdf", (job ? job.name + " — " : "") + "Site Survey (PDF)");
    } catch (err) {
      alert("สร้าง PDF ไม่สำเร็จ: " + (err && err.message ? err.message : err));
    }
    setExporting(false);
  };
  const doSave = () => {
    const pgs = commitActive();
    const p0 = pgs[0] || {};
    save({
      pages: pgs,
      image: p0.image || null,
      imgW: p0.imgW || 0,
      imgH: p0.imgH || 0,
      mpp: p0.mpp != null ? p0.mpp : null,
      calib: p0.calib || null,
      lines: p0.lines || [],
      markers: p0.markers || [],
      panels: p0.panels || [],
      micros: p0.micros || [],
      links: p0.links || [],
      notes: p0.notes || [],
      wp: +wp || PLAN_WP_DEFAULT,
      isc: +panelIsc || 0,
      ac: {
        kw: parseFloat(acKw) || 0,
        phase: acPhase,
        inv: invType
      },
      updatedAt: new Date().toISOString(),
      byName: currentUser && currentUser.name || ""
    });
    setDirty(false);
    onClose();
  };
  const summary = React.useMemo(() => {
    const live = {
      image,
      imgW: imgDim.w,
      imgH: imgDim.h,
      mpp,
      calib,
      lines,
      markers,
      panels,
      micros,
      links
    };
    const viewPages = pages.length ? pages.map((p, i) => i === activePage ? Object.assign({}, p, live) : p) : [live];
    const pgMeters = (ln, pg) => {
      if (ln.manualM != null && +ln.manualM > 0) return +ln.manualM;
      if (pg.mpp && ln.pts && ln.pts.length >= 2) {
        let s = 0;
        for (let i = 1; i < ln.pts.length; i++) {
          const a = ln.pts[i - 1],
            b = ln.pts[i];
          s += Math.hypot((a.x - b.x) * (pg.imgW || 1), (a.y - b.y) * (pg.imgH || 1));
        }
        return s * pg.mpp;
      }
      return null;
    };
    const cAcc = {};
    PLAN_LINE_KINDS.forEach(k => {
      cAcc[k.key] = {
        kind: k,
        count: 0,
        raw: 0,
        unknown: 0
      };
    });
    viewPages.forEach(pg => {
      (pg.lines || []).forEach(l => {
        const row = cAcc[l.kind];
        if (!row) return;
        row.count += 1;
        const m = pgMeters(l, pg);
        if (m == null) row.unknown += 1;else row.raw += m;
      });
    });
    let acTrunkM = 0,
      acTrunks = 0,
      acTrunkUnknown = 0;
    viewPages.forEach(pg => {
      const nodePt = {};
      (pg.micros || []).forEach(m => {
        nodePt[m.id] = m;
      });
      (pg.markers || []).forEach(m => {
        if (m.kind === "combiner" || m.kind === "mdb") nodePt[m.id] = m;
      });
      (pg.links || []).forEach(l => {
        if (!l.ac) return;
        acTrunks += 1;
        const a = nodePt[l.from],
          b = nodePt[l.to];
        if (a && b && pg.mpp) {
          const seq = l.pts && l.pts.length ? [a].concat(l.pts, [b]) : [a, b];
          let px = 0;
          for (let i = 1; i < seq.length; i++) px += Math.hypot((seq[i].x - seq[i - 1].x) * (pg.imgW || 1), (seq[i].y - seq[i - 1].y) * (pg.imgH || 1));
          acTrunkM += px * pg.mpp;
        } else acTrunkUnknown += 1;
      });
    });
    if (acTrunks > 0) {
      const r = cAcc.ac;
      r.count += acTrunks;
      r.raw += acTrunkM;
      r.unknown += acTrunkUnknown;
    }
    const cable = PLAN_LINE_KINDS.map(k => cAcc[k.key]).filter(c => c.count > 0).map(c => Object.assign(c, {
      withSpare: Math.ceil(c.raw * (1 + c.kind.spare / 100))
    }));
    const condAcc = {};
    viewPages.forEach(pg => {
      (pg.lines || []).forEach(l => {
        const ck = l.conduit || "none";
        if (ck === "none") return;
        const m = pgMeters(l, pg);
        if (m == null) return;
        const key = ck + "|" + (l.conduitSize || "");
        const row = condAcc[key] || {
          conduit: ck,
          size: l.conduitSize || "",
          raw: 0
        };
        row.raw += m;
        condAcc[key] = row;
      });
    });
    viewPages.forEach(pg => {
      const nodePt = {};
      (pg.micros || []).forEach(m => {
        nodePt[m.id] = m;
      });
      (pg.markers || []).forEach(m => {
        if (m.kind === "combiner" || m.kind === "mdb") nodePt[m.id] = m;
      });
      (pg.links || []).forEach(l => {
        const ck = l.conduit || "none";
        if (ck === "none") return;
        const a = nodePt[l.from],
          b = nodePt[l.to];
        let m = null;
        if (l.manualM != null && +l.manualM > 0) m = +l.manualM;else if (a && b && pg.mpp) {
          const seq = l.pts && l.pts.length ? [a].concat(l.pts, [b]) : [a, b];
          let px = 0;
          for (let i = 1; i < seq.length; i++) px += Math.hypot((seq[i].x - seq[i - 1].x) * (pg.imgW || 1), (seq[i].y - seq[i - 1].y) * (pg.imgH || 1));
          m = px * pg.mpp;
        }
        if (m == null) return;
        const key = ck + "|" + (l.conduitSize || "");
        const row = condAcc[key] || {
          conduit: ck,
          size: l.conduitSize || "",
          raw: 0
        };
        row.raw += m;
        condAcc[key] = row;
      });
    });
    const conduitGroups = Object.keys(condAcc).map(k => {
      const r = condAcc[k];
      const sp = (PLAN_CONDUIT_BY[r.conduit] || {}).spare || 5;
      return Object.assign(r, {
        withSpare: Math.ceil(r.raw * (1 + sp / 100))
      });
    }).sort((a, b) => b.raw - a.raw);
    const equip = PLAN_MARKER_KINDS.map(k => ({
      kind: k,
      count: viewPages.reduce((s, pg) => s + (pg.markers || []).filter(m => m.kind === k.key).length, 0)
    })).filter(e => e.count > 0);
    const allPanels = [];
    const allMicros = [];
    viewPages.forEach(pg => {
      (pg.panels || []).forEach(p => allPanels.push(p));
      (pg.micros || []).forEach(m => allMicros.push(m));
    });
    const panelTotal = allPanels.reduce((s, p) => s + p.rows * p.cols, 0);
    const panelBlocks = allPanels.length;
    const microCount = allMicros.length;
    const microPanels = allMicros.reduce((s, m) => s + Math.max(1, Math.round(m.n) || 1), 0);
    const kwp = Math.round(microPanels * (+wp || 0) / 1000 * 100) / 100;
    const pairedByIv = {};
    let pairedCells = 0;
    allPanels.forEach(p => {
      const cm = getCells(p);
      Object.keys(cm).forEach(k => {
        const iv = cm[k];
        if (iv) {
          pairedByIv[iv] = (pairedByIv[iv] || 0) + 1;
          pairedCells += 1;
        }
      });
    });
    const pairedMicros = allMicros.map((m, i) => ({
      id: m.id,
      label: "IV-" + (i + 1),
      modules: pairedByIv[m.id] || 0
    }));
    const unpairedPanels = Math.max(0, panelTotal - pairedCells);
    const anyPaired = pairedCells > 0;
    const stringLinks = viewPages.reduce((s, pg) => s + (pg.links || []).filter(l => !l.ac).length, 0);
    const hasCombiner = viewPages.some(pg => (pg.markers || []).some(m => m.kind === "combiner"));
    const needTrunk = microCount > 0 && acTrunks === 0;
    const jmap = {};
    viewPages.forEach(pg => {
      (pg.markers || []).forEach(m => {
        if (m.kind === "xpage" && m.jid) {
          const e = jmap[m.jid] || {
            n: m.n,
            pages: []
          };
          e.pages.push(pg.name || "รูป");
          jmap[m.jid] = e;
        }
      });
    });
    const junctions = Object.keys(jmap).map(k => ({
      jid: k,
      n: jmap[k].n || 0,
      pages: jmap[k].pages
    })).sort((a, b) => a.n - b.n);
    return {
      cable,
      conduitGroups,
      equip,
      panelTotal,
      panelBlocks,
      microCount,
      microPanels,
      kwp,
      pairedMicros,
      unpairedPanels,
      anyPaired,
      stringLinks,
      acTrunks,
      acTrunkM,
      hasCombiner,
      needTrunk,
      junctions,
      pageCount: viewPages.length
    };
  }, [pages, activePage, lines, markers, panels, micros, links, wp, mpp, calib, imgDim]);
  const acCalc = React.useMemo(() => {
    const manual = parseFloat(acKw) || 0;
    const autoKw = invType === "micro" ? summary.kwp : 0;
    const kw = manual > 0 ? manual : autoKw;
    const V = acPhase === 3 ? 400 : 230;
    const I = kw > 0 ? kw * 1000 / (acPhase === 3 ? Math.sqrt(3) * V : V) : 0;
    const need = I * 1.25;
    const size = kw > 0 && window.BOQ && window.BOQ.pickWireSize ? window.BOQ.pickWireSize(need, "xlpe", {
      method: "conduitAir",
      group: "g1",
      ncond: acPhase === 3 ? "3" : "2",
      core: "single"
    }) : "—";
    const mm = parseFloat(size);
    const cable = mm > 0 ? "CV-FD 1Cx" + mm + " sq.mm." : size;
    return {
      kw,
      V,
      amp: Math.round(I * 10) / 10,
      need: Math.round(need * 10) / 10,
      size,
      cable,
      auto: !(manual > 0) && autoKw > 0
    };
  }, [acKw, acPhase, invType, summary.kwp]);
  const dcCalc = React.useMemo(() => {
    const isc = +panelIsc || 0;
    const need = isc * 1.25;
    const size = isc > 0 && window.BOQ && window.BOQ.pickPvWireSize ? window.BOQ.pickPvWireSize(need) : "—";
    const mm = parseFloat(size);
    const cable = mm > 0 ? "PV1-F " + mm + " sq.mm." : size;
    return {
      isc,
      amp: Math.round(need * 100) / 100,
      size,
      cable
    };
  }, [panelIsc]);
  const suggestCombiner = React.useMemo(() => {
    if (!micros.length) return null;
    const W = disp.w || 1,
      H = disp.h || 1;
    let px = micros.reduce((s, m) => s + m.x, 0) / micros.length * W;
    let py = micros.reduce((s, m) => s + m.y, 0) / micros.length * H;
    for (let it = 0; it < 40; it++) {
      let sx = 0,
        sy = 0,
        sw = 0;
      micros.forEach(m => {
        const d = Math.hypot(m.x * W - px, m.y * H - py) || 1e-6,
          w = 1 / d;
        sx += m.x * W * w;
        sy += m.y * H * w;
        sw += w;
      });
      px = sx / sw;
      py = sy / sw;
    }
    let totM = null;
    if (mpp && imgDim.w) {
      totM = 0;
      micros.forEach(m => {
        totM += Math.hypot((m.x - px / W) * imgDim.w, (m.y - py / H) * imgDim.h) * mpp;
      });
    }
    return {
      x: px / W,
      y: py / H,
      totM
    };
  }, [micros, disp.w, disp.h, mpp, imgDim]);
  const combinerOnPage = markers.some(m => m.kind === "combiner");
  const showSuggest = tool === "marker" && markerKind === "combiner" && suggestCombiner && !combinerOnPage;
  const takeoff = React.useMemo(() => {
    const sizeOf = key => key === "dc" ? dcCalc.cable : key === "ac" ? acCalc.cable : key === "ground" ? "IEC01(THW) 1Cx6 sq.mm." : key === "lan" ? "LAN CAT6 UTP" : "";
    const bundle = [];
    const acMm = parseFloat(acCalc.size);
    if (acMm > 0) bundle.push({
      type: "CV FD 1C",
      size: acMm,
      qty: acPhase === 3 ? 4 : 2
    });
    bundle.push({
      type: "IEC01 (THW)",
      size: 6,
      qty: 1
    });
    const cp = window.BOQ && window.BOQ.calcConduitSize ? window.BOQ.calcConduitSize(bundle) : null;
    const conduitSize = cp && cp.imc ? cp.imc.label : "—";
    const eq = [];
    if (summary.panelTotal > 0) eq.push({
      label: "แผงโซลาร์" + (+wp > 0 ? " " + wp + "W" : ""),
      qty: summary.panelTotal,
      unit: "แผง"
    });
    if (summary.microCount > 0) eq.push({
      label: "ไมโครอินเวอร์เตอร์ (" + summary.microPanels + " แผง)",
      qty: summary.microCount,
      unit: "ตัว"
    });
    summary.equip.forEach(e => eq.push({
      label: e.kind.label,
      qty: e.count,
      unit: "จุด"
    }));
    const cab = summary.cable.map(c => ({
      key: c.kind.key,
      label: c.kind.label,
      color: c.kind.color,
      count: c.count,
      meters: c.withSpare,
      size: c.kind.key === "conduit" ? "IMC " + conduitSize : sizeOf(c.kind.key),
      unknown: c.unknown
    }));
    const conduit = (summary.conduitGroups || []).map(g => ({
      conduit: g.conduit,
      label: (PLAN_CONDUIT_BY[g.conduit] || {}).short || g.conduit,
      size: g.size || conduitSize,
      auto: !g.size,
      meters: g.withSpare
    }));
    return {
      eq,
      cab,
      conduit,
      conduitSize,
      kwp: summary.kwp,
      estKwh: Math.round(summary.kwp * (+yieldFactor || 0)),
      estKwhMo: Math.round(summary.kwp * (+yieldFactor || 0) / 12)
    };
  }, [summary, dcCalc, acCalc, acPhase, wp, yieldFactor]);
  const takeoffText = () => {
    const L = [];
    L.push("■ ถอดวัสดุจากผัง — " + (job ? (job.code || "") + " " + (job.name || "") : ""));
    L.push("ระบบ " + takeoff.kwp + " kWp · ประเมินผลิตไฟ ≈ " + takeoff.estKwh.toLocaleString() + " kWh/ปี (~" + takeoff.estKwhMo.toLocaleString() + " kWh/เดือน)");
    if (takeoff.eq.length) {
      L.push("");
      L.push("[อุปกรณ์]");
      takeoff.eq.forEach(e => L.push("• " + e.label + " — " + e.qty.toLocaleString() + " " + e.unit));
    }
    if (takeoff.cab.length) {
      L.push("");
      L.push("[สาย/ท่อ]");
      takeoff.cab.forEach(c => L.push("• " + c.label + (c.size ? " · " + c.size : "") + " — " + c.meters.toLocaleString() + " ม. (" + c.count + " เส้น)"));
    }
    if (takeoff.conduit.length) {
      L.push("");
      L.push("[ท่อร้อยสาย]");
      takeoff.conduit.forEach(c => L.push("• " + c.label + " " + c.size + (c.auto ? " (แนะนำ)" : "") + " — " + c.meters.toLocaleString() + " ม."));
    }
    return L.join("\n");
  };
  const doCopyTakeoff = () => {
    const t = takeoffText();
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(() => {
      window.prompt("คัดลอกข้อความนี้:", t);
    });else window.prompt("คัดลอกข้อความนี้:", t);
  };
  const PX = (fx, fy) => fx * disp.w + "," + fy * disp.h;
  const photoBadge = (cx, cy, id, count) => React.createElement("g", {
    onClick: e => {
      e.stopPropagation();
      setPhotoIdx(0);
      setPhotoView(id);
    },
    style: {
      cursor: "pointer",
      pointerEvents: hideAnno ? "none" : "auto"
    }
  }, React.createElement("circle", {
    cx: cx + 12,
    cy: cy - 11,
    r: 8.5,
    fill: "#111827",
    stroke: "#fff",
    strokeWidth: 1.6
  }), React.createElement("text", {
    x: cx + 12,
    y: cy - 7.5,
    fontSize: 9.5,
    textAnchor: "middle",
    style: {
      pointerEvents: "none"
    }
  }, "\uD83D\uDCF7"), count > 1 && React.createElement("g", {
    pointerEvents: "none"
  }, React.createElement("circle", {
    cx: cx + 19,
    cy: cy - 17,
    r: 6,
    fill: "#EF4444",
    stroke: "#fff",
    strokeWidth: 1.2
  }), React.createElement("text", {
    x: cx + 19,
    y: cy - 14,
    fontSize: 8,
    fontWeight: "800",
    fill: "#fff",
    textAnchor: "middle"
  }, count)));
  const toolBtn = (key, label, icon) => {
    const on = tool === key;
    return React.createElement("button", {
      onClick: () => {
        setTool(on ? null : key);
        setDraft([]);
        setCalPts([]);
        setLinkFrom(null);
        setLinkPts([]);
        setPairFrom(null);
      },
      title: label,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 13px",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        transition: "background .14s, color .14s, border-color .14s",
        border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
        background: on ? "var(--primary)" : "var(--surface)",
        color: on ? "#fff" : "var(--text-2)",
        boxShadow: on ? "0 2px 8px rgba(34,163,91,.28)" : "none"
      }
    }, React.createElement(Icon, {
      name: icon,
      size: 14,
      color: on ? "#fff" : "var(--text-3)"
    }), label);
  };
  const pInp = {
    width: 54,
    padding: "5px 7px",
    borderRadius: 7,
    border: "1px solid var(--border-strong)",
    background: "var(--surface2)",
    color: "var(--text-1)",
    fontFamily: "inherit",
    fontSize: 12,
    textAlign: "right"
  };
  const pBtn = {
    padding: "5px 9px",
    borderRadius: 7,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text-2)",
    fontFamily: "inherit",
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer"
  };
  const pSel = {
    flex: 1,
    minWidth: 0,
    padding: "5px 8px",
    borderRadius: 7,
    border: "1px solid var(--border-strong)",
    background: "var(--surface2)",
    color: "var(--text-1)",
    fontFamily: "inherit",
    fontSize: 12,
    cursor: "pointer"
  };
  const pSel2 = {
    padding: "5px 8px",
    borderRadius: 7,
    border: "1px solid var(--border-strong)",
    background: "var(--surface2)",
    color: "var(--text-1)",
    fontFamily: "inherit",
    fontSize: 12,
    cursor: "pointer"
  };
  const lblS = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 11.5,
    fontWeight: 700,
    color: "var(--text-2)"
  };
  const selPanelModel = panelModels.find(p => p.id === panelSku) || null;
  const applyPanelModel = id => {
    setPanelSku(id);
    const it = panelModels.find(p => p.id === id);
    if (!it) return;
    if (+it.width > 0) setPanelShort(+it.width);
    if (+it.length > 0) setPanelLong(+it.length);
    if (+it.wp > 0) setWp(+it.wp);
    if (+it.isc > 0) setPanelIsc(+it.isc);
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 120,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 18
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "18px 18px 0 0" : 18,
      width: isMobile ? "100%" : "min(920px,100%)",
      maxHeight: isMobile ? "97dvh" : "95vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.35)"
    }
  }, React.createElement("div", {
    style: {
      padding: "14px 18px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexShrink: 0
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E1C\u0E31\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 ", job ? job.code : ""), React.createElement("h2", {
    style: {
      fontSize: 16.5,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: "2px 0 0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job ? job.name : "")), React.createElement("button", {
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
      flex: 1,
      overflowY: "auto",
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      background: "var(--surface2)"
    }
  }, pages.length > 0 && React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      overflowX: "auto",
      paddingBottom: 2,
      flexShrink: 0
    }
  }, pages.map((p, i) => {
    const on = i === activePage;
    const hasImg = on ? !!image : !!p.image;
    return React.createElement("div", {
      key: p.id,
      onClick: () => gotoPage(i),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 9,
        cursor: "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-2)",
        fontSize: 12.5,
        fontWeight: 700
      }
    }, React.createElement(Icon, {
      name: hasImg ? "image" : "plus",
      size: 12,
      color: "currentColor"
    }), React.createElement("span", null, p.name || "รูป " + (i + 1)), on && React.createElement("span", {
      onClick: e => {
        e.stopPropagation();
        renamePage(i);
      },
      title: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E19\u0E49\u0E32",
      style: {
        opacity: 0.55,
        marginLeft: 1
      }
    }, "\u270E"), pages.length > 1 && React.createElement("span", {
      onClick: e => {
        e.stopPropagation();
        deletePage(i);
      },
      title: "\u0E25\u0E1A\u0E2B\u0E19\u0E49\u0E32",
      style: {
        opacity: 0.55,
        fontWeight: 900,
        fontSize: 14
      }
    }, "\xD7"));
  }), React.createElement("input", {
    ref: addFileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) addPageWithImage(f);
      e.target.value = "";
    }
  }), React.createElement("button", {
    onClick: () => busy ? null : addFileRef.current && addFileRef.current.click(),
    disabled: busy,
    title: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07 (\u0E01\u0E14\u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: busy ? "default" : "pointer",
      whiteSpace: "nowrap",
      flexShrink: 0,
      fontFamily: "inherit"
    }
  }, "\uFF0B ", busy ? "กำลังโหลด..." : "เพิ่มรูป"), React.createElement("button", {
    onClick: addPage,
    title: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E1B\u0E25\u0E48\u0E32 (\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E39\u0E1B)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      padding: "6px 0",
      borderRadius: 9,
      border: "1px dashed var(--border)",
      background: "var(--surface)",
      color: "var(--text-3)",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      flexShrink: 0,
      fontFamily: "inherit"
    }
  }, "\uFF0B")), !image ? React.createElement("div", {
    style: {
      border: "2px dashed var(--border-strong)",
      borderRadius: 14,
      padding: "38px 20px",
      textAlign: "center",
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 8
    }
  }, "\uD83D\uDDFA\uFE0F"), React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, "\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32 \u201C", pages[activePage] && pages[activePage].name || "หลังคา", "\u201D"), React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      marginTop: 4,
      marginBottom: 16
    }
  }, "\u0E16\u0E48\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32/\u0E1C\u0E31\u0E07\u0E1A\u0E49\u0E32\u0E19/\u0E08\u0E38\u0E14\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C \u0E41\u0E25\u0E49\u0E27\u0E27\u0E32\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E32\u0E22 + \u0E27\u0E32\u0E07\u0E08\u0E38\u0E14\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E17\u0E31\u0E1A\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \xB7 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2B\u0E25\u0E32\u0E22\u0E23\u0E39\u0E1B\u0E44\u0E14\u0E49\u0E08\u0E32\u0E01\u0E41\u0E17\u0E47\u0E1A\u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19"), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) pickImage(f);
      e.target.value = "";
    }
  }), React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "11px 20px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: busy ? "default" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 16,
    color: "#fff"
  }), busy ? "กำลังโหลด..." : "เลือกรูป")) : React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7,
      alignItems: "center"
    }
  }, toolBtn("calib", mpp ? "คาลิเบรตใหม่" : "ตั้งมาตราส่วน", "ruler"), toolBtn("draw", "วาดสาย", "pen"), toolBtn("marker", "วางอุปกรณ์", "pin"), toolBtn("photo", "รูปจุด", "camera"), toolBtn("connect", "เชื่อม/จับคู่", "link"), toolBtn("note", "คอมเมนต์", "message"), toolBtn("xpage", "ต่อรูป", "shuffle"), toolBtn("move", "ย้าย", "hand"), toolBtn("erase", "ลบ", "trash"), React.createElement("button", {
    onClick: undo,
    disabled: histLen === 0,
    title: "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1E\u0E34\u0E48\u0E07\u0E17\u0E33",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "8px 12px",
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      whiteSpace: "nowrap",
      cursor: histLen === 0 ? "not-allowed" : "pointer",
      opacity: histLen === 0 ? 0.45 : 1,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "undo",
    size: 14,
    color: "var(--text-3)"
  }), "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A", histLen > 0 ? " (" + histLen + ")" : ""), React.createElement("button", {
    onClick: () => setShowGrid(v => !v),
    title: "\u0E01\u0E23\u0E34\u0E14\u0E0A\u0E48\u0E27\u0E22\u0E08\u0E31\u0E14\u0E27\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      border: "1px solid " + (showGrid ? "var(--primary)" : "var(--border-strong)"),
      background: showGrid ? "var(--primary)" : "var(--surface)",
      color: showGrid ? "#fff" : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "gridDots",
    size: 14,
    color: showGrid ? "#fff" : "var(--text-3)"
  }), "\u0E01\u0E23\u0E34\u0E14"), React.createElement("button", {
    onClick: () => exportPlanImage("download"),
    disabled: exporting,
    title: "\u0E42\u0E2B\u0E25\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07 (\u0E23\u0E39\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 + \u0E40\u0E2A\u0E49\u0E19/\u0E08\u0E38\u0E14/\u0E1B\u0E49\u0E32\u0E22)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 10,
      cursor: exporting ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      opacity: exporting ? 0.6 : 1,
      border: "1px solid #0F5132",
      background: "#0F5132",
      color: "#fff"
    }
  }, React.createElement(Icon, {
    name: "download",
    size: 14,
    color: "#fff"
  }), exporting ? "กำลังทำ..." : "โหลดแบบติดตั้ง"), React.createElement("button", {
    onClick: () => exportPlanPDF(typeof navigator !== "undefined" && navigator.share ? "share" : "download"),
    disabled: exporting,
    title: "\u0E2A\u0E23\u0E49\u0E32\u0E07 PDF \u0E19\u0E33\u0E40\u0E2A\u0E19\u0E2D (\u0E1B\u0E01 + \u0E1C\u0E31\u0E07 + \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E41\u0E15\u0E48\u0E25\u0E30\u0E08\u0E38\u0E14 + \u0E2A\u0E23\u0E38\u0E1B)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 10,
      cursor: exporting ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      opacity: exporting ? 0.6 : 1,
      border: "1px solid var(--tint-red-tx)",
      background: "var(--tint-red-tx)",
      color: "#fff"
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 14,
    color: "#fff"
  }), exporting ? "กำลังทำ..." : "PDF นำเสนอ"), React.createElement("button", {
    onClick: () => setPdfSettings(true),
    title: "\u0E41\u0E01\u0E49\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19 / \u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D / \u0E42\u0E25\u0E42\u0E01\u0E49 \u0E1A\u0E19 PDF",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 11px",
      borderRadius: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "settings",
    size: 14,
    color: "var(--text-3)"
  }), "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 PDF"), typeof navigator !== "undefined" && navigator.share && React.createElement("button", {
    onClick: () => exportPlanImage("share"),
    disabled: exporting,
    title: "\u0E2A\u0E48\u0E07\u0E15\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E40\u0E2B\u0E21\u0E32 (LINE/\u0E41\u0E0A\u0E23\u0E4C)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 10,
      cursor: exporting ? "default" : "pointer",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      opacity: exporting ? 0.6 : 1,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)"
    }
  }, "\uD83D\uDCE4 \u0E2A\u0E48\u0E07\u0E15\u0E48\u0E2D"), React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 11.5,
      fontWeight: 700,
      color: mpp ? "var(--primary-dark)" : "#F59E0B"
    }
  }, mpp ? "มาตราส่วน: 1px ≈ " + Math.round(mpp * 10000) / 10000 + " ม." : "⚠ ยังไม่ตั้งมาตราส่วน")), tool === "draw" && React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center"
    }
  }, PLAN_LINE_KINDS.map(k => React.createElement("button", {
    key: k.key,
    onClick: () => setLineKind(k.key),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (lineKind === k.key ? k.color : "var(--border-strong)"),
      background: lineKind === k.key ? k.color + "18" : "var(--surface)",
      color: lineKind === k.key ? k.color : "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 12,
      height: 3,
      borderRadius: 2,
      background: k.color
    }
  }), k.label)), React.createElement("button", {
    onClick: () => setSnapStraight(v => !v),
    title: "\u0E25\u0E47\u0E2D\u0E01\u0E43\u0E2B\u0E49\u0E40\u0E2A\u0E49\u0E19\u0E15\u0E23\u0E07\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19/\u0E41\u0E19\u0E27\u0E15\u0E31\u0E49\u0E07 \u0E44\u0E21\u0E48\u0E40\u0E2D\u0E35\u0E22\u0E07",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (snapStraight ? "var(--primary)" : "var(--border-strong)"),
      background: snapStraight ? "var(--primary)18" : "var(--surface)",
      color: snapStraight ? "var(--primary)" : "var(--text-2)"
    }
  }, "\uD83D\uDCD0 \u0E41\u0E19\u0E27\u0E15\u0E23\u0E07 ", snapStraight ? "ON" : "OFF"), React.createElement("span", {
    style: {
      flex: 1
    }
  }), draft.length > 0 && React.createElement("button", {
    onClick: cancelDraft,
    style: {
      padding: "6px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: finishLine,
    disabled: draft.length < 2,
    style: {
      padding: "6px 13px",
      borderRadius: 9,
      border: "none",
      background: draft.length >= 2 ? "var(--primary)" : "var(--surface3)",
      color: draft.length >= 2 ? "#fff" : "var(--text-3)",
      fontSize: 12,
      fontWeight: 700,
      cursor: draft.length >= 2 ? "pointer" : "default",
      fontFamily: "inherit"
    }
  }, "\u0E08\u0E1A\u0E40\u0E2A\u0E49\u0E19 (", draft.length, ")")), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "8px 10px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 12
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, "\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22"), React.createElement("select", {
    value: lineCores,
    onChange: e => setLineCores(+e.target.value || 1),
    style: pSel2
  }, PLAN_WIRE_CORES.map(c => React.createElement("option", {
    key: c,
    value: c
  }, c, "C"))), React.createElement("select", {
    value: lineSize,
    onChange: e => setLineSize(+e.target.value || 0),
    style: pSel2
  }, React.createElement("option", {
    value: 0
  }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E04\u0E33\u0E19\u0E27\u0E13)"), PLAN_WIRE_SQMM.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s, " mm\xB2"))), React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: "var(--border)"
    }
  }), React.createElement("span", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, "\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19"), React.createElement("select", {
    value: lineConduit,
    onChange: e => setLineConduit(e.target.value),
    style: pSel2
  }, PLAN_CONDUITS.map(c => React.createElement("option", {
    key: c.key,
    value: c.key
  }, c.label))), lineConduit !== "none" && React.createElement("select", {
    value: lineConduitSize,
    onChange: e => setLineConduitSize(e.target.value),
    style: pSel2
  }, React.createElement("option", {
    value: ""
  }, "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E48\u0E2D: \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), PLAN_CONDUIT_SIZES.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))), React.createElement("span", {
    style: {
      width: "100%",
      color: "var(--text-3)",
      fontSize: 10.5
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E19\u0E35\u0E49\u0E08\u0E30\u0E15\u0E34\u0E14\u0E01\u0E31\u0E1A \u201C\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E35\u0E48\u0E27\u0E32\u0E14\u0E15\u0E48\u0E2D\u0E08\u0E32\u0E01\u0E19\u0E35\u0E49\u201D \xB7 \u0E40\u0E2A\u0E49\u0E19\u0E40\u0E01\u0E48\u0E32\u0E41\u0E01\u0E49\u0E44\u0E14\u0E49\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07 \xB7 \u201C\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u201D = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E23\u0E30\u0E1A\u0E1A\u0E04\u0E33\u0E19\u0E27\u0E13\u0E08\u0E32\u0E01\u0E01\u0E23\u0E30\u0E41\u0E2A"))), tool === "marker" && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, PLAN_MARKER_KINDS.map(k => React.createElement("button", {
    key: k.key,
    onClick: () => setMarkerKind(k.key),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (markerKind === k.key ? k.color : "var(--border-strong)"),
      background: markerKind === k.key ? k.color + "18" : "var(--surface)",
      color: markerKind === k.key ? k.color : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: k.icon,
    size: 13,
    color: k.color
  }), k.label)), [{
    key: "panel",
    label: "แผงโซลาร์",
    color: PLAN_PANEL_COLOR,
    icon: "panel"
  }, {
    key: "micro",
    label: "ไมโครฯ",
    color: PLAN_MICRO_COLOR,
    icon: "bolt"
  }].map(k => React.createElement("button", {
    key: k.key,
    onClick: () => setMarkerKind(k.key),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (markerKind === k.key ? k.color : "var(--border-strong)"),
      background: markerKind === k.key ? k.color + "18" : "var(--surface)",
      color: markerKind === k.key ? k.color : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: k.icon,
    size: 13,
    color: k.color
  }), k.label)), markerKind === "combiner" && React.createElement("div", {
    style: {
      width: "100%",
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      background: "#0EA5E90F",
      border: "1px solid #0EA5E940",
      borderRadius: 10,
      fontSize: 12,
      marginTop: 2
    }
  }, !micros.length ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\uD83D\uDCA1 \u0E27\u0E32\u0E07\u0E44\u0E21\u0E42\u0E04\u0E23\u0E2F (\uD83D\uDD0C) \u0E01\u0E48\u0E2D\u0E19 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E41\u0E19\u0E30\u0E19\u0E33\u0E08\u0E38\u0E14\u0E27\u0E32\u0E07\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E22\u0E23\u0E27\u0E21\u0E2A\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E2B\u0E49") : combinerOnPage ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u2713 \u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E21\u0E35\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E25\u0E32\u0E01\u0E22\u0E49\u0E32\u0E22 (\u270B) \u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E15\u0E30\u0E27\u0E32\u0E07\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E14\u0E49") : React.createElement(React.Fragment, null, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "#0369A1",
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 99,
      border: "2px dashed #0EA5E9"
    }
  }), " \u0E08\u0E38\u0E14\u0E41\u0E19\u0E30\u0E19\u0E33 (\u0E2A\u0E32\u0E22\u0E23\u0E27\u0E21\u0E2A\u0E31\u0E49\u0E19\u0E2A\u0E38\u0E14)", suggestCombiner && suggestCombiner.totM != null && React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 400
    }
  }, "\xB7 \u0E23\u0E27\u0E21 \u2248 ", fmtM(suggestCombiner.totM))), React.createElement("button", {
    onClick: () => {
      if (!suggestCombiner) return;
      setMarkers(p => p.concat([{
        id: _pid("m"),
        kind: "combiner",
        x: suggestCombiner.x,
        y: suggestCombiner.y
      }]));
      mark();
    },
    style: {
      padding: "6px 12px",
      borderRadius: 8,
      border: "none",
      background: "#0EA5E9",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\uD83D\uDCCD \u0E27\u0E32\u0E07\u0E17\u0E35\u0E48\u0E08\u0E38\u0E14\u0E41\u0E19\u0E30\u0E19\u0E33")))), tool === "xpage" && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 12
    }
  }, pages.length < 2 && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700,
      width: "100%"
    }
  }, "\u26A0 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 2 \u0E23\u0E39\u0E1B \u2014 \u0E01\u0E14 \uFF0B \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E39\u0E1B \u0E14\u0E49\u0E32\u0E19\u0E1A\u0E19\u0E01\u0E48\u0E2D\u0E19"), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-2)"
    }
  }, React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      transform: "rotate(45deg)",
      background: PLAN_XPAGE_COLOR,
      borderRadius: 2
    }
  }), " \u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E2B\u0E19\u0E49\u0E32", React.createElement("select", {
    value: junctionTarget,
    onChange: e => setJunctionTarget(e.target.value),
    style: pSel
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07 \u2014"), pages.map((p, i) => i === activePage ? null : React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name || "รูป " + (i + 1))))), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 10.5,
      width: "100%"
    }
  }, "\u0E41\u0E15\u0E30\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E41\u0E19\u0E27\u0E17\u0E48\u0E2D/\u0E2A\u0E32\u0E22\u0E27\u0E34\u0E48\u0E07\u0E2D\u0E2D\u0E01\u0E44\u0E1B\u0E2D\u0E35\u0E01\u0E23\u0E39\u0E1B \xB7 \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E1B\u0E31\u0E01\u0E2B\u0E21\u0E38\u0E14\u0E04\u0E39\u0E48 (\u0E40\u0E25\u0E02\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19) \u0E43\u0E2B\u0E49\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32 \u0E41\u0E25\u0E49\u0E27\u0E2A\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E1B\u0E25\u0E32\u0E01 \u270B \u0E08\u0E31\u0E14\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2B\u0E21\u0E38\u0E14\u0E1B\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07\u0E44\u0E14\u0E49")), tool === "marker" && markerKind === "panel" && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 12
    }
  }, !mpp && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontWeight: 700,
      width: "100%"
    }
  }, "\u26A0 \u0E15\u0E31\u0E49\u0E07\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19\u0E01\u0E48\u0E2D\u0E19 \u0E41\u0E1C\u0E07\u0E16\u0E36\u0E07\u0E08\u0E30\u0E40\u0E17\u0E48\u0E32\u0E02\u0E19\u0E32\u0E14\u0E08\u0E23\u0E34\u0E07"), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      width: "100%",
      color: "var(--text-2)"
    }
  }, "\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07", React.createElement("select", {
    value: panelSku,
    onChange: e => applyPanelModel(e.target.value),
    style: pSel
  }, React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07 \u2014"), panelModels.map(it => React.createElement("option", {
    key: it.id,
    value: it.id
  }, it.name, +it.wp > 0 ? " · " + it.wp + "W" : "", +it.width > 0 && +it.length > 0 ? " · " + it.width + "×" + it.length + "ม." : " · (ยังไม่ตั้งขนาด)")), panelModels.length === 0 && React.createElement("option", {
    value: "",
    disabled: true
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07"))), selPanelModel && !(+selPanelModel.width > 0 && +selPanelModel.length > 0) && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontSize: 10.5,
      width: "100%"
    }
  }, "\u26A0 \u0E23\u0E38\u0E48\u0E19\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E15\u0E31\u0E49\u0E07\u0E02\u0E19\u0E32\u0E14\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 \u2014 \u0E43\u0E2A\u0E48 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07/\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27 \u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32\u0E04\u0E25\u0E31\u0E07\u0E2A\u0E34\u0E19\u0E04\u0E49\u0E32 \u0E41\u0E25\u0E49\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E43\u0E2B\u0E21\u0E48"), React.createElement("div", {
    style: {
      display: "inline-flex",
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid var(--border-strong)"
    }
  }, [["port", "แนวตั้ง"], ["land", "แนวนอน"]].map(([v, l]) => React.createElement("button", {
    key: v,
    onClick: () => setPanelOrient(v),
    style: {
      padding: "6px 11px",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 11.5,
      fontWeight: 700,
      background: panelOrient === v ? PLAN_PANEL_COLOR : "var(--surface)",
      color: panelOrient === v ? "#fff" : "var(--text-2)"
    }
  }, l))), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--text-2)"
    }
  }, "\u0E41\u0E1C\u0E07", React.createElement("input", {
    type: "number",
    step: "0.01",
    value: panelShort,
    onChange: e => setPanelShort(+e.target.value || 0),
    style: pInp
  }), "\xD7", React.createElement("input", {
    type: "number",
    step: "0.01",
    value: panelLong,
    onChange: e => setPanelLong(+e.target.value || 0),
    style: pInp
  }), "\u0E21."), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--text-2)"
    }
  }, "\u0E41\u0E16\u0E27", React.createElement("input", {
    type: "number",
    value: panelRows,
    onChange: e => setPanelRows(Math.max(1, Math.round(+e.target.value || 1))),
    style: Object.assign({}, pInp, {
      width: 44
    })
  }), "\xD7 \u0E04\u0E2D\u0E25\u0E31\u0E21\u0E19\u0E4C", React.createElement("input", {
    type: "number",
    value: panelCols,
    onChange: e => setPanelCols(Math.max(1, Math.round(+e.target.value || 1))),
    style: Object.assign({}, pInp, {
      width: 44
    })
  })), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0E2B\u0E21\u0E38\u0E19"), React.createElement("button", {
    onClick: () => setPanelRot(r => r - 15),
    style: pBtn
  }, "\u221215\xB0"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      minWidth: 36,
      textAlign: "center"
    }
  }, (panelRot % 360 + 360) % 360, "\xB0"), React.createElement("button", {
    onClick: () => setPanelRot(r => r + 15),
    style: pBtn
  }, "+15\xB0"), React.createElement("button", {
    onClick: () => setPanelRot(0),
    style: pBtn
  }, "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15")), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 10.5,
      width: "100%"
    }
  }, "\u0E41\u0E15\u0E30\u0E23\u0E39\u0E1B\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E07\u0E1A\u0E25\u0E47\u0E2D\u0E01 ", panelRows, "\xD7", panelCols, " = ", React.createElement("b", null, panelRows * panelCols), " \u0E41\u0E1C\u0E07")), tool === "marker" && markerKind === "micro" && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 12
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--text-2)"
    }
  }, "\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E15\u0E31\u0E27", React.createElement("button", {
    onClick: () => setMicroN(n => Math.max(1, n - 1)),
    style: pBtn
  }, "\u2212"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      minWidth: 22,
      textAlign: "center"
    }
  }, microN), React.createElement("button", {
    onClick: () => setMicroN(n => n + 1),
    style: pBtn
  }, "+"), React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "\u0E41\u0E1C\u0E07")), React.createElement("button", {
    onClick: () => setSnapStraight(v => !v),
    title: "\u0E27\u0E32\u0E07\u0E44\u0E21\u0E42\u0E04\u0E23\u0E43\u0E2B\u0E49\u0E40\u0E23\u0E35\u0E22\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E16\u0E27\u0E15\u0E23\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "5px 11px",
      borderRadius: 99,
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      border: "1px solid " + (snapStraight ? "var(--primary)" : "var(--border-strong)"),
      background: snapStraight ? "var(--primary)18" : "var(--surface)",
      color: snapStraight ? "var(--primary)" : "var(--text-2)"
    }
  }, "\uD83D\uDCD0 \u0E40\u0E23\u0E35\u0E22\u0E07\u0E41\u0E16\u0E27 ", snapStraight ? "ON" : "OFF"), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 10.5,
      width: "100%"
    }
  }, "\u0E41\u0E15\u0E30\u0E23\u0E39\u0E1B\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E07\u0E44\u0E21\u0E42\u0E04\u0E23\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C (\u0E41\u0E15\u0E48\u0E25\u0E30\u0E15\u0E31\u0E27\u0E23\u0E31\u0E1A ", microN, " \u0E41\u0E1C\u0E07) \xB7 ", React.createElement("b", null, "\u0E40\u0E23\u0E35\u0E22\u0E07\u0E41\u0E16\u0E27 ON"), " = \u0E41\u0E15\u0E30\u0E43\u0E01\u0E25\u0E49\u0E41\u0E16\u0E27\u0E40\u0E14\u0E34\u0E21\u0E41\u0E25\u0E49\u0E27 snap \u0E43\u0E2B\u0E49\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E40\u0E2D\u0E07 \xB7 \u0E08\u0E32\u0E01\u0E19\u0E31\u0E49\u0E19\u0E43\u0E0A\u0E49 \uD83D\uDD17 \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E2A\u0E32\u0E22")), tool === "connect" && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      fontSize: 12
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, "\u0E2A\u0E35\u0E2A\u0E15\u0E23\u0E34\u0E07"), PLAN_LINK_COLORS.map(c => React.createElement("button", {
    key: c,
    onClick: () => setLinkColor(c),
    title: c,
    style: {
      width: 22,
      height: 22,
      borderRadius: 6,
      cursor: "pointer",
      background: c,
      border: linkColor === c ? "2px solid var(--text-1)" : "2px solid transparent",
      boxShadow: linkColor === c ? "0 0 0 1px #fff inset" : "none"
    }
  })), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      width: 22,
      height: 4,
      borderRadius: 2,
      background: PLAN_AC_TRUNK_COLOR
    }
  }), " AC \u0E40\u0E21\u0E19 (\u2192 \u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C)"), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      width: 22,
      height: 4,
      borderRadius: 2,
      background: PLAN_AC_FEED_COLOR
    }
  }), " AC \u0E40\u0E02\u0E49\u0E32\u0E15\u0E39\u0E49\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32 (\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C \u2192 MDB)"), linkFrom && React.createElement("button", {
    onClick: () => {
      setLinkFrom(null);
      setLinkPts([]);
    },
    style: pBtn
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01"), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 10.5,
      width: "100%"
    }
  }, micros.length < 1 ? "วางไมโครอินเวอร์เตอร์ก่อน (📍 วางอุปกรณ์ › ไมโครฯ)" : (() => {
    const s = linkFrom ? linkNodeById(linkFrom) : null;
    return s && s.type === "combiner" ? "แตะ ตู้ MDB (ตู้ไฟลูกค้า) = ลากสาย AC เข้าตู้ · แตะที่ว่างระหว่างทาง = หักมุม" : linkFrom ? "เลือกไมโครอยู่ → แตะ “แผ่นแผง” = จับคู่ (แตะซ้ำ = ยกเลิก) · แตะไมโครตัวถัดไป = ต่อสตริง · แตะ ตู้คอมบายเนอร์ = จบสาย AC เมน · แตะที่ว่าง = หักมุม" : "แตะไมโคร 1 ตัวก่อน แล้ว: แตะแผ่นแผง = จับคู่ · แตะไมโครอื่น = สตริง · แตะคอมบายเนอร์ = สาย AC เมน · (คอมบายเนอร์ → MDB = สายเข้าตู้ลูกค้า)";
  })()), !summary.hasCombiner && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontSize: 10.5,
      width: "100%"
    }
  }, "\u26A0 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C\u0E43\u0E19\u0E1C\u0E31\u0E07 \u2014 \u0E27\u0E32\u0E07\u0E14\u0E49\u0E27\u0E22 \uD83D\uDCCD \u0E27\u0E32\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u203A Combiner \u0E01\u0E48\u0E2D\u0E19 \u0E08\u0E36\u0E07\u0E08\u0E30\u0E15\u0E48\u0E2D\u0E2A\u0E32\u0E22 AC \u0E40\u0E21\u0E19\u0E44\u0E14\u0E49"), !markers.some(m => m.kind === "mdb") && React.createElement("span", {
    style: {
      color: "#F59E0B",
      fontSize: 10.5,
      width: "100%"
    }
  }, "\u26A0 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E39\u0E49 MDB (\u0E15\u0E39\u0E49\u0E44\u0E1F\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32) \u2014 \u0E27\u0E32\u0E07\u0E14\u0E49\u0E27\u0E22 \uD83D\uDCCD \u0E27\u0E32\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C \u203A \u0E15\u0E39\u0E49 MDB \u0E01\u0E48\u0E2D\u0E19 \u0E08\u0E36\u0E07\u0E08\u0E30\u0E25\u0E32\u0E01\u0E2A\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E15\u0E39\u0E49\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E44\u0E14\u0E49")), tool === "calib" && React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 10
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-2)"
    }
  }, calPts.length < 2 ? "แตะ 2 จุดบนสิ่งที่รู้ความยาวจริง (" + calPts.length + "/2)" : "ใส่ความยาวจริงของเส้นนี้:"), calPts.length === 2 && React.createElement(React.Fragment, null, React.createElement("input", {
    type: "number",
    value: calMetersInput,
    onChange: e => setCalMetersInput(e.target.value),
    placeholder: "\u0E40\u0E21\u0E15\u0E23",
    style: {
      width: 90,
      padding: "7px 10px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13
    }
  }), React.createElement("button", {
    onClick: () => {
      const m = parseFloat(calMetersInput);
      const nat = segNat(calPts[0], calPts[1]);
      if (m > 0 && nat > 0) {
        setMpp(m / nat);
        setCalib({
          a: calPts[0],
          b: calPts[1],
          meters: m
        });
        mark();
        setTool(null);
        setCalPts([]);
        setCalMetersInput("");
      }
    },
    disabled: !(parseFloat(calMetersInput) > 0),
    style: {
      padding: "7px 13px",
      borderRadius: 8,
      border: "none",
      background: parseFloat(calMetersInput) > 0 ? "var(--primary)" : "var(--surface3)",
      color: parseFloat(calMetersInput) > 0 ? "#fff" : "var(--text-3)",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32")), React.createElement("button", {
    onClick: () => {
      setCalPts([]);
      setCalMetersInput("");
    },
    style: {
      padding: "7px 11px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u0E25\u0E49\u0E32\u0E07")), React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0,
      lineHeight: 0,
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid var(--border)",
      cursor: tool === "move" ? "grab" : tool ? "crosshair" : "default",
      touchAction: tool === "move" ? "none" : "manipulation"
    },
    onClick: onTap,
    onPointerDown: onDragStart,
    onPointerMove: onDragMove,
    onPointerUp: onDragEnd,
    onPointerCancel: onDragEnd
  }, React.createElement("img", {
    ref: imgRef,
    src: image,
    onLoad: measure,
    alt: "\u0E1C\u0E31\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19",
    style: {
      display: "block",
      width: "100%",
      height: "auto",
      userSelect: "none"
    },
    draggable: false
  }), React.createElement("svg", {
    ref: svgRef,
    width: disp.w,
    height: disp.h,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      pointerEvents: "none",
      opacity: hideAnno ? 0 : 1,
      transition: "opacity .12s"
    }
  }, showGrid && disp.w > 0 && (() => {
    const step = mpp && imgDim.w ? disp.w / imgDim.w / mpp : disp.w / 12;
    if (!(step > 4)) return null;
    const vs = [],
      hs = [];
    for (let x = step; x < disp.w; x += step) vs.push(x);
    for (let y = step; y < disp.h; y += step) hs.push(y);
    return React.createElement("g", {
      pointerEvents: "none"
    }, vs.map((x, i) => React.createElement("line", {
      key: "gv" + i,
      x1: x,
      y1: 0,
      x2: x,
      y2: disp.h,
      stroke: "#0EA5E9",
      strokeWidth: 0.6,
      opacity: 0.28
    })), hs.map((y, i) => React.createElement("line", {
      key: "gh" + i,
      x1: 0,
      y1: y,
      x2: disp.w,
      y2: y,
      stroke: "#0EA5E9",
      strokeWidth: 0.6,
      opacity: 0.28
    })), mpp && React.createElement("text", {
      x: 4,
      y: 12,
      fontSize: 9,
      fill: "#0369A1",
      style: {
        paintOrder: "stroke",
        stroke: "#fff",
        strokeWidth: 2.5,
        strokeLinejoin: "round"
      }
    }, "\u0E01\u0E23\u0E34\u0E14 1 \u0E21."));
  })(), mpp && panels.map(pnl => {
    const g = panelGeom(pnl);
    const cm = getCells(pnl);
    const cells = [];
    for (let r = 0; r < pnl.rows; r++) for (let c = 0; c < pnl.cols; c++) {
      const iv = cm[r * pnl.cols + c];
      const mIdx = iv ? micros.findIndex(m => m.id === iv) : -1;
      const col = mIdx >= 0 ? PLAN_LINK_COLORS[mIdx % PLAN_LINK_COLORS.length] : PLAN_PANEL_COLOR;
      const cx = g.x0 + c * (g.cw + g.gap),
        cy = g.y0 + r * (g.ch + g.gap);
      cells.push(React.createElement("rect", {
        key: "c" + r + "_" + c,
        x: cx,
        y: cy,
        width: g.cw,
        height: g.ch,
        rx: 1.5,
        fill: col,
        fillOpacity: mIdx >= 0 ? 0.5 : 0.3,
        stroke: col,
        strokeWidth: mIdx >= 0 ? 1.6 : 1.1,
        strokeOpacity: 0.95
      }));
      if (mIdx >= 0 && g.cw > 16 && g.ch > 12) {
        cells.push(React.createElement("text", {
          key: "t" + r + "_" + c,
          x: cx + g.cw / 2,
          y: cy + g.ch / 2 + 3.2,
          fontSize: 8.5,
          fontWeight: "800",
          fill: "#fff",
          textAnchor: "middle",
          transform: "rotate(" + -(pnl.rot || 0) + " " + (cx + g.cw / 2) + " " + (cy + g.ch / 2) + ")",
          style: {
            paintOrder: "stroke",
            stroke: col,
            strokeWidth: 2.5,
            strokeLinejoin: "round"
          }
        }, mIdx + 1));
      }
    }
    return React.createElement("g", {
      key: pnl.id,
      transform: "rotate(" + (pnl.rot || 0) + " " + g.cx + " " + g.cy + ")"
    }, React.createElement("rect", {
      x: g.x0 - 1.5,
      y: g.y0 - 1.5,
      width: g.totalW + 3,
      height: g.totalH + 3,
      rx: 2.5,
      fill: "none",
      stroke: "#fff",
      strokeWidth: 2,
      strokeOpacity: 0.65
    }), cells, React.createElement("rect", {
      x: g.cx - 18,
      y: g.y0 - 16,
      width: 36,
      height: 13,
      rx: 6,
      fill: PLAN_PANEL_COLOR,
      opacity: 0.92
    }), React.createElement("text", {
      x: g.cx,
      y: g.y0 - 6,
      fontSize: 9.5,
      fontWeight: "800",
      fill: "#fff",
      textAnchor: "middle",
      transform: "rotate(" + -(pnl.rot || 0) + " " + g.cx + " " + (g.y0 - 9.5) + ")"
    }, pnl.rows * pnl.cols, " \u0E41\u0E1C\u0E07"));
  }), panels.map(pnl => {
    const cm = getCells(pnl);
    const segs = [];
    Object.keys(cm).forEach(k => {
      const mIdx = micros.findIndex(m => m.id === cm[k]);
      if (mIdx < 0) return;
      const idx = +k,
        r = Math.floor(idx / pnl.cols),
        c = idx % pnl.cols;
      const cc = cellCenterPx(pnl, r, c);
      const m = micros[mIdx],
        col = PLAN_LINK_COLORS[mIdx % PLAN_LINK_COLORS.length];
      segs.push(React.createElement("line", {
        key: pnl.id + "_" + k,
        x1: cc.X,
        y1: cc.Y,
        x2: m.x * disp.w,
        y2: m.y * disp.h,
        stroke: col,
        strokeWidth: 1.3,
        strokeDasharray: "2 3",
        strokeOpacity: 0.85
      }));
    });
    return segs.length ? React.createElement("g", {
      key: "pr" + pnl.id
    }, segs) : null;
  }), (() => {
    const by = {};
    micros.forEach(m => {
      by[m.id] = m;
    });
    markers.forEach(m => {
      if (m.kind === "combiner" || m.kind === "mdb") by[m.id] = m;
    });
    return links.map(lk => {
      const a = by[lk.from],
        b = by[lk.to];
      if (!a || !b) return null;
      const seq = lk.pts && lk.pts.length ? [a].concat(lk.pts, [b]) : [a, b];
      const ptsStr = seq.map(p => PX(p.x, p.y)).join(" ");
      const col = lk.color || (lk.ac ? PLAN_AC_TRUNK_COLOR : "#06B6D4");
      const mid = seq[Math.floor(seq.length / 2)] || a,
        lp = linkLabelXY(lk);
      const lx = lp.x * disp.w,
        ly = lp.y * disp.h;
      const spec = linkSpecText(lk);
      const sw = Math.max(42, spec.length * 6.1 + 14);
      const m = linkMeters(lk),
        dlbl = fmtM(m),
        dlw = Math.max(30, dlbl.length * 7.3 + 12);
      const inMove = tool === "move";
      return React.createElement("g", {
        key: lk.id,
        onClick: e => {
          if (tool === "erase" || tool === "connect" || inMove) return;
          e.stopPropagation();
          setLinkEdit(lk.id);
        },
        style: {
          cursor: inMove ? "move" : "pointer",
          pointerEvents: tool === "erase" || tool === "connect" || inMove || hideAnno ? "none" : "auto"
        }
      }, React.createElement("polyline", {
        points: ptsStr,
        fill: "none",
        stroke: "#000",
        strokeOpacity: 0,
        strokeWidth: 16,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        style: {
          pointerEvents: tool === "erase" || tool === "connect" || inMove || hideAnno ? "none" : "stroke"
        }
      }), React.createElement("polyline", {
        points: ptsStr,
        fill: "none",
        stroke: col,
        strokeWidth: lk.ac ? 3.6 : 3,
        strokeOpacity: lk.ac ? 0.95 : 0.9,
        strokeLinejoin: "round",
        strokeLinecap: "round",
        strokeDasharray: lk.ac ? undefined : "7 5"
      }), (lk.pts || []).map((p, i) => React.createElement("circle", {
        key: i,
        cx: p.x * disp.w,
        cy: p.y * disp.h,
        r: lk.ac ? 3 : 2.6,
        fill: col
      })), lk.labelPos && (lk.ac || spec) && React.createElement("line", {
        x1: mid.x * disp.w,
        y1: mid.y * disp.h,
        x2: lx,
        y2: ly,
        stroke: col,
        strokeWidth: 1,
        strokeDasharray: "2 3",
        opacity: 0.55
      }), lk.ac && React.createElement("g", null, React.createElement("rect", {
        x: lx - dlw / 2,
        y: ly - 25,
        width: dlw,
        height: 16,
        rx: 8,
        fill: "#fff",
        opacity: 0.82
      }), React.createElement("text", {
        x: lx,
        y: ly - 13,
        fontSize: 11,
        fontWeight: "800",
        fill: col,
        textAnchor: "middle",
        style: {
          pointerEvents: "none"
        }
      }, dlbl)), spec && React.createElement("g", null, React.createElement("rect", {
        x: lx - sw / 2,
        y: ly + 6,
        width: sw,
        height: 15,
        rx: 7,
        fill: col,
        opacity: 0.95
      }), React.createElement("text", {
        x: lx,
        y: ly + 16.5,
        fontSize: 9.5,
        fontWeight: "700",
        fill: "#fff",
        textAnchor: "middle",
        style: {
          pointerEvents: "none"
        }
      }, spec)));
    });
  })(), lines.map(ln => {
    const kc = (PLAN_LINE_BY[ln.kind] || {}).color || "#888";
    const mid = lineMid(ln),
      lp = lineLabelXY(ln);
    const m = lineMeters(ln);
    const lx = lp.x * disp.w,
      ly = lp.y * disp.h;
    const lbl = fmtM(m),
      lw = Math.max(30, lbl.length * 7.3 + 12);
    const spec = lineSpecText(ln);
    const hasSpec = +ln.size > 0 || ln.conduit && ln.conduit !== "none";
    const sw = Math.max(42, spec.length * 6.1 + 14);
    return React.createElement("g", {
      key: ln.id
    }, React.createElement("polyline", {
      points: ln.pts.map(p => PX(p.x, p.y)).join(" "),
      fill: "none",
      stroke: kc,
      strokeWidth: 3,
      strokeOpacity: 0.8,
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }), ln.pts.map((p, i) => React.createElement("circle", {
      key: i,
      cx: p.x * disp.w,
      cy: p.y * disp.h,
      r: 3,
      fill: kc,
      fillOpacity: 0.9
    })), ln.labelPos && React.createElement("line", {
      x1: mid.x * disp.w,
      y1: mid.y * disp.h,
      x2: lx,
      y2: ly,
      stroke: kc,
      strokeWidth: 1,
      strokeDasharray: "2 3",
      opacity: 0.55
    }), React.createElement("g", {
      onClick: e => {
        if (tool === "erase" || tool === "move") return;
        e.stopPropagation();
        setLineEdit(ln.id);
      },
      style: {
        cursor: tool === "move" ? "move" : "pointer",
        pointerEvents: tool === "erase" || tool === "move" || hideAnno ? "none" : "auto"
      }
    }, React.createElement("rect", {
      x: lx - lw / 2,
      y: ly - 25,
      width: lw,
      height: 16,
      rx: 8,
      fill: "#fff",
      opacity: 0.82
    }), React.createElement("text", {
      x: lx,
      y: ly - 13,
      fontSize: 11,
      fontWeight: "800",
      fill: kc,
      textAnchor: "middle",
      style: {
        pointerEvents: "none"
      }
    }, lbl), hasSpec && spec && React.createElement("g", null, React.createElement("rect", {
      x: lx - sw / 2,
      y: ly + 6,
      width: sw,
      height: 15,
      rx: 7,
      fill: kc,
      opacity: 0.95
    }), React.createElement("text", {
      x: lx,
      y: ly + 16.5,
      fontSize: 9.5,
      fontWeight: "700",
      fill: "#fff",
      textAnchor: "middle",
      style: {
        pointerEvents: "none"
      }
    }, spec))));
  }), draft.length > 0 && React.createElement("g", null, React.createElement("polyline", {
    points: draft.map(p => PX(p.x, p.y)).join(" "),
    fill: "none",
    stroke: (PLAN_LINE_BY[lineKind] || {}).color,
    strokeWidth: 2.5,
    strokeDasharray: "6 5"
  }), draft.map((p, i) => React.createElement("circle", {
    key: i,
    cx: p.x * disp.w,
    cy: p.y * disp.h,
    r: 4,
    fill: "#fff",
    stroke: (PLAN_LINE_BY[lineKind] || {}).color,
    strokeWidth: 2
  }))), tool === "connect" && linkFrom && linkPts.length > 0 && (() => {
    const src = linkNodeById(linkFrom);
    if (!src) return null;
    const col = src.type === "combiner" ? PLAN_AC_FEED_COLOR : PLAN_AC_TRUNK_COLOR;
    const seq = [src].concat(linkPts);
    return React.createElement("g", null, React.createElement("polyline", {
      points: seq.map(p => PX(p.x, p.y)).join(" "),
      fill: "none",
      stroke: col,
      strokeWidth: 2.6,
      strokeDasharray: "6 5",
      strokeLinejoin: "round"
    }), linkPts.map((p, i) => React.createElement("circle", {
      key: i,
      cx: p.x * disp.w,
      cy: p.y * disp.h,
      r: 4,
      fill: "#fff",
      stroke: col,
      strokeWidth: 2
    })));
  })(), calib && React.createElement("line", {
    x1: calib.a.x * disp.w,
    y1: calib.a.y * disp.h,
    x2: calib.b.x * disp.w,
    y2: calib.b.y * disp.h,
    stroke: "#111",
    strokeWidth: 2,
    strokeDasharray: "3 3",
    opacity: "0.5"
  }), calPts.map((p, i) => React.createElement("circle", {
    key: "c" + i,
    cx: p.x * disp.w,
    cy: p.y * disp.h,
    r: 5,
    fill: "#F59E0B",
    stroke: "#fff",
    strokeWidth: 2
  })), calPts.length === 2 && React.createElement("line", {
    x1: calPts[0].x * disp.w,
    y1: calPts[0].y * disp.h,
    x2: calPts[1].x * disp.w,
    y2: calPts[1].y * disp.h,
    stroke: "#F59E0B",
    strokeWidth: 2.5
  }), markers.map(m => {
    if (m.kind === "xpage") {
      const cx = m.x * disp.w,
        cy = m.y * disp.h;
      const tgt = pages.find(p => p.id === m.toPage);
      const ti = pages.findIndex(p => p.id === m.toPage);
      return React.createElement("g", {
        key: m.id,
        onClick: e => {
          if (tool === "erase" || tool === "move") return;
          if (ti >= 0) {
            e.stopPropagation();
            gotoPage(ti);
          }
        },
        style: {
          cursor: ti >= 0 ? "pointer" : "default",
          pointerEvents: ti >= 0 && tool !== "erase" && tool !== "move" && !hideAnno ? "auto" : "none"
        }
      }, React.createElement("path", {
        d: "M" + cx + " " + (cy - 12) + " L" + (cx + 12) + " " + cy + " L" + cx + " " + (cy + 12) + " L" + (cx - 12) + " " + cy + " Z",
        fill: PLAN_XPAGE_COLOR,
        stroke: "#fff",
        strokeWidth: 2.5
      }), React.createElement("text", {
        x: cx,
        y: cy + 3.6,
        fontSize: 11,
        fontWeight: "900",
        fill: "#fff",
        textAnchor: "middle",
        style: {
          pointerEvents: "none"
        }
      }, m.n), React.createElement("text", {
        x: cx,
        y: cy + 25,
        fontSize: 10,
        fontWeight: "800",
        fill: PLAN_XPAGE_COLOR,
        textAnchor: "middle",
        style: {
          paintOrder: "stroke",
          stroke: "#fff",
          strokeWidth: 3,
          strokeLinejoin: "round",
          pointerEvents: "none"
        }
      }, "→ ไป " + (tgt ? tgt.name : "อีกหน้า")), markerPhotos(m).length > 0 && photoBadge(cx, cy, m.id, markerPhotos(m).length));
    }
    if (m.kind === "camera") {
      const cx = m.x * disp.w,
        cy = m.y * disp.h,
        cnt = markerPhotos(m).length;
      const clickable = tool !== "erase" && tool !== "move" && !hideAnno;
      return React.createElement("g", {
        key: m.id,
        onClick: e => {
          if (!clickable) return;
          e.stopPropagation();
          if (cnt) {
            setPhotoIdx(0);
            setPhotoView(m.id);
          } else openMarkerPhotoPicker(m.id);
        },
        style: {
          cursor: clickable ? "pointer" : tool === "move" ? "move" : "default",
          pointerEvents: clickable ? "auto" : "none"
        }
      }, React.createElement("circle", {
        cx: cx,
        cy: cy,
        r: 13,
        fill: "#F59E0B",
        stroke: "#fff",
        strokeWidth: 2.5
      }), React.createElement("text", {
        x: cx,
        y: cy + 5,
        fontSize: 14,
        textAnchor: "middle",
        style: {
          pointerEvents: "none"
        }
      }, "\uD83D\uDCF7"), cnt > 0 && React.createElement("g", null, React.createElement("circle", {
        cx: cx + 11,
        cy: cy - 11,
        r: 7,
        fill: "#EF4444",
        stroke: "#fff",
        strokeWidth: 1.5
      }), React.createElement("text", {
        x: cx + 11,
        y: cy - 7.6,
        fontSize: 9,
        fontWeight: "800",
        fill: "#fff",
        textAnchor: "middle",
        style: {
          pointerEvents: "none"
        }
      }, cnt)));
    }
    const mk = PLAN_MARKER_BY[m.kind] || {};
    const cx = m.x * disp.w,
      cy = m.y * disp.h;
    return React.createElement("g", {
      key: m.id
    }, React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: 10,
      fill: mk.color || "#888",
      stroke: "#fff",
      strokeWidth: 2.5
    }), React.createElement("text", {
      x: cx,
      y: cy + 22,
      fontSize: 11,
      fontWeight: "700",
      fill: mk.color || "#555",
      textAnchor: "middle",
      style: {
        paintOrder: "stroke",
        stroke: "#fff",
        strokeWidth: 3,
        strokeLinejoin: "round"
      }
    }, mk.label), markerPhotos(m).length > 0 && photoBadge(cx, cy, m.id, markerPhotos(m).length));
  }), micros.map((m, i) => {
    const cx = m.x * disp.w,
      cy = m.y * disp.h;
    const sel = linkFrom === m.id || pairFrom === m.id;
    const ringCol = pairFrom === m.id ? PLAN_LINK_COLORS[i % PLAN_LINK_COLORS.length] : linkColor;
    return React.createElement("g", {
      key: m.id
    }, sel && React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: 17,
      fill: "none",
      stroke: ringCol,
      strokeWidth: 2.5,
      strokeDasharray: "4 3"
    }), React.createElement("rect", {
      x: cx - 11,
      y: cy - 8,
      width: 22,
      height: 16,
      rx: 3.5,
      fill: PLAN_MICRO_COLOR,
      stroke: "#fff",
      strokeWidth: 2
    }), React.createElement("path", {
      d: "M" + (cx - 3.5) + " " + (cy - 3.5) + " L" + (cx + 1) + " " + cy + " L" + (cx - 1) + " " + cy + " L" + (cx + 3.5) + " " + (cy + 3.5),
      fill: "none",
      stroke: "#FBBF24",
      strokeWidth: 1.6,
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }), React.createElement("circle", {
      cx: cx + 11,
      cy: cy - 8,
      r: 7,
      fill: PLAN_MICRO_COLOR,
      stroke: "#fff",
      strokeWidth: 1.5
    }), React.createElement("text", {
      x: cx + 11,
      y: cy - 4.7,
      fontSize: 9,
      fontWeight: "800",
      fill: "#FBBF24",
      textAnchor: "middle"
    }, m.n), React.createElement("text", {
      x: cx,
      y: cy + 21,
      fontSize: 10,
      fontWeight: "800",
      fill: PLAN_MICRO_COLOR,
      textAnchor: "middle",
      style: {
        paintOrder: "stroke",
        stroke: "#fff",
        strokeWidth: 3,
        strokeLinejoin: "round"
      }
    }, "IV-", i + 1));
  }), notes.map(nt => {
    const g = noteBox(nt);
    const empty = !(nt.text || "").trim();
    const canEdit = tool !== "erase" && tool !== "move" && !hideAnno;
    return React.createElement("g", {
      key: nt.id,
      onClick: e => {
        if (tool === "erase" || tool === "move") return;
        e.stopPropagation();
        setNoteEdit(nt.id);
      },
      style: {
        cursor: tool === "move" ? "move" : "pointer",
        pointerEvents: canEdit ? "auto" : "none"
      }
    }, React.createElement("rect", {
      x: g.x,
      y: g.y,
      width: g.w,
      height: g.h,
      rx: 7,
      fill: "var(--tint-amber-bg2)",
      stroke: "#F59E0B",
      strokeWidth: 1.4,
      opacity: 0.97
    }), React.createElement("rect", {
      x: g.x,
      y: g.y,
      width: 4,
      height: g.h,
      rx: 2,
      fill: "#F59E0B"
    }), empty ? React.createElement("text", {
      x: g.x + 10,
      y: g.y + 16,
      fontSize: g.fs,
      fontStyle: "italic",
      fill: "var(--tint-amber-tx)",
      style: {
        pointerEvents: "none"
      }
    }, "\u0E41\u0E15\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u2026") : g.rows.map((r, i) => React.createElement("text", {
      key: i,
      x: g.x + 10,
      y: g.y + 16 + i * (g.fs + 5),
      fontSize: g.fs,
      fontWeight: "600",
      fill: "#78350F",
      style: {
        pointerEvents: "none",
        whiteSpace: "pre"
      }
    }, r)));
  }), showSuggest && (() => {
    const cx = suggestCombiner.x * disp.w,
      cy = suggestCombiner.y * disp.h;
    return React.createElement("g", {
      key: "suggest-combiner",
      pointerEvents: "none"
    }, micros.map(m => React.createElement("line", {
      key: m.id,
      x1: cx,
      y1: cy,
      x2: m.x * disp.w,
      y2: m.y * disp.h,
      stroke: "#0EA5E9",
      strokeWidth: 1,
      strokeDasharray: "3 4",
      opacity: 0.5
    })), React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: 15,
      fill: "#0EA5E922",
      stroke: "#0EA5E9",
      strokeWidth: 2,
      strokeDasharray: "5 4"
    }), React.createElement("path", {
      d: "M" + cx + " " + (cy - 9) + " V" + (cy + 9) + " M" + (cx - 9) + " " + cy + " H" + (cx + 9),
      stroke: "#0EA5E9",
      strokeWidth: 1.6
    }), React.createElement("text", {
      x: cx,
      y: cy + 28,
      fontSize: 10,
      fontWeight: "800",
      fill: "#0369A1",
      textAnchor: "middle",
      style: {
        paintOrder: "stroke",
        stroke: "#fff",
        strokeWidth: 3,
        strokeLinejoin: "round"
      }
    }, "\u0E08\u0E38\u0E14\u0E41\u0E19\u0E30\u0E19\u0E33\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C"));
  })())), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, tool === "draw" ? "แตะเพิ่มจุดเส้น แล้วกด “จบเส้น” · เลือกขนาดสาย + ท่อ (IMC/uPVC/ใต้ฝ้า/ฝังดิน) ได้ในแถบด้านบน" + (snapStraight ? " · 📐 แนวตรง ON" : "") : tool === "marker" ? markerKind === "panel" ? "แตะรูปเพื่อวางบล็อกแผงตามขนาดจริง · ปรับแนว/จำนวน/มุมหมุนด้านบน · จุดที่แตะคือกึ่งกลางบล็อก" : markerKind === "micro" ? "แตะรูปเพื่อวางไมโครอินเวอร์เตอร์ · ตั้งจำนวนแผงต่อตัวด้านบน · จากนั้นใช้ 🔗 เชื่อม/จับคู่" : markerKind === "combiner" && micros.length ? "แตะวางตู้คอมบายเนอร์ · หรือกด “วางที่จุดแนะนำ” ให้ระบบเลือกจุดที่สายรวมสั้นสุดให้" : "แตะตำแหน่งเพื่อวางจุดอุปกรณ์ที่เลือก" : tool === "photo" ? "แตะที่ว่างตรงไหนก็ได้ → ปักจุดกล้อง 📷 แล้วเลือกรูปแนบทันที · หรือแตะจุดอุปกรณ์เดิม (ตู้ MDB/คอมบายเนอร์/จุดต่อ) เพื่อแนบรูป · แนบได้หลายรูปต่อจุด · จุดที่มีรูปมีเลขกำกับ แตะแล้วเด้งรูปขึ้นดู/วาดเขียนได้" : tool === "connect" ? "แตะไมโคร 1 ตัว → แตะแผ่นแผง = จับคู่ · แตะไมโครอื่น = สตริง · แตะคอมบายเนอร์ = สาย AC เมน (CV-FD) · คอมบายเนอร์ → MDB = สายเข้าตู้ลูกค้า · แตะที่ว่าง = “หักมุม”" + (snapStraight ? " · 📐 แนวตรง ON" : "") : tool === "note" ? "แตะตำแหน่งบนภาพเพื่อวางคอมเมนต์ แล้วพิมพ์ข้อความ · แตะคอมเมนต์เดิม = แก้ไข · ลากย้ายได้ในโหมด ✋ ย้าย" : tool === "xpage" ? "เลือกหน้าปลายทางด้านบน แล้วแตะจุดที่แนวท่อ/สายวิ่งข้ามไปอีกรูป · ปักหมุดคู่ให้ทั้งสองหน้า (เลขเดียวกัน) · แตะหมุดที่มีอยู่ = เด้งไปหน้าที่เชื่อม" : tool === "move" ? "ลากแผง / ไมโคร / จุดอุปกรณ์ / คอมเมนต์ · หรือ ลากป้ายข้อความ (ระยะ/ขนาดสาย) ไปวางตรงที่ไม่บังได้ (แตะค้างแล้วลาก)" : tool === "calib" ? "แตะ 2 จุดที่รู้ความยาวจริง (เช่น ขอบหลังคา) แล้วใส่เมตร" : tool === "erase" ? "แตะเส้น/จุด/แผง/ไมโคร/สาย/คอมเมนต์ที่ต้องการลบ" : "เลือกเครื่องมือด้านบนเพื่อเริ่มวาด · เปลี่ยนรูปได้ที่ปุ่มด้านล่าง"), React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 16
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 15,
    color: "var(--primary-dark)"
  }), " \u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E02\u0E2D\u0E07\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19"), summary.microCount > 0 && React.createElement("div", {
    style: {
      background: PLAN_MICRO_COLOR,
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 12,
      color: "#fff"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "baseline",
      gap: "2px 10px",
      fontSize: 13.5,
      fontWeight: 800
    }
  }, React.createElement("span", null, React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, summary.microCount), " \u0E44\u0E21\u0E42\u0E04\u0E23\u0E2F"), React.createElement("span", {
    style: {
      opacity: 0.5
    }
  }, "="), React.createElement("span", null, React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, summary.microPanels), " \u0E41\u0E1C\u0E07"), React.createElement("span", {
    style: {
      opacity: 0.5
    }
  }, "\xD7"), React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, React.createElement("input", {
    type: "number",
    value: wp,
    onChange: e => {
      setWp(+e.target.value || 0);
      mark();
    },
    style: {
      width: 58,
      padding: "3px 6px",
      borderRadius: 7,
      border: "1px solid rgba(255,255,255,.3)",
      background: "rgba(255,255,255,.12)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      textAlign: "right"
    }
  }), " Wp"), React.createElement("span", {
    style: {
      opacity: 0.5
    }
  }, "="), React.createElement("span", {
    style: {
      color: "#FBBF24"
    }
  }, React.createElement("span", {
    style: {
      fontSize: 18
    }
  }, summary.kwp), " kWp")), React.createElement("div", {
    style: {
      fontSize: 10.5,
      opacity: 0.65,
      marginTop: 4
    }
  }, "\u0E2A\u0E32\u0E22\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E2A\u0E15\u0E23\u0E34\u0E07 ", summary.stringLinks, " \u0E40\u0E2A\u0E49\u0E19 \xB7 \u0E2A\u0E32\u0E22 AC \u0E40\u0E21\u0E19\u0E40\u0E02\u0E49\u0E32\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C ", summary.acTrunks, " \u0E40\u0E2A\u0E49\u0E19", summary.acTrunkM > 0 ? " (" + fmtM(summary.acTrunkM) + ")" : "", " \xB7 \u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E1C\u0E07\u0E19\u0E31\u0E1A\u0E08\u0E32\u0E01 \u201C\u0E41\u0E1C\u0E07\u0E15\u0E48\u0E2D\u0E44\u0E21\u0E42\u0E04\u0E23\u201D \u0E41\u0E15\u0E48\u0E25\u0E30\u0E15\u0E31\u0E27"), summary.needTrunk && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#FCD34D",
      marginTop: 5,
      fontWeight: 700
    }
  }, "\u26A0 \u0E44\u0E21\u0E42\u0E04\u0E23\u0E15\u0E31\u0E27\u0E2A\u0E38\u0E14\u0E17\u0E49\u0E32\u0E22\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E48\u0E2D\u0E2A\u0E32\u0E22 AC \u0E40\u0E02\u0E49\u0E32\u0E15\u0E39\u0E49\u0E04\u0E2D\u0E21\u0E1A\u0E32\u0E22\u0E40\u0E19\u0E2D\u0E23\u0E4C \u2014 ", summary.hasCombiner ? "ใช้ 🔗 แตะไมโครตัวสุดท้าย → ตู้คอมบายเนอร์ (อยู่หน้าเดียวกัน)" : "วางตู้คอมบายเนอร์ (📍) — จะอยู่หน้านี้หรือเพิ่มหน้าใหม่ก็ได้ แล้วต่อด้วย 🔗")), summary.anyPaired && React.createElement("div", {
    style: {
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "10px 12px",
      marginBottom: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 8
    }
  }, "\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48\u0E41\u0E1C\u0E07 \u2194 \u0E44\u0E21\u0E42\u0E04\u0E23"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, summary.pairedMicros.filter(pm => pm.modules > 0).map((pm, i) => {
    const idx = summary.pairedMicros.indexOf(pm);
    const col = PLAN_LINK_COLORS[idx % PLAN_LINK_COLORS.length];
    return React.createElement("span", {
      key: pm.id,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 99,
        background: col + "1c",
        color: "var(--text-1)",
        fontSize: 12,
        fontWeight: 700
      }
    }, React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        background: col
      }
    }), pm.label, " ", React.createElement("b", null, pm.modules), " \u0E41\u0E1C\u0E07");
  })), summary.unpairedPanels > 0 && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#F59E0B",
      marginTop: 6
    }
  }, "\u26A0 \u0E22\u0E31\u0E07\u0E21\u0E35\u0E41\u0E1C\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48 ", summary.unpairedPanels, " \u0E41\u0E1C\u0E48\u0E19")), summary.cable.length === 0 && summary.equip.length === 0 && summary.panelTotal === 0 && summary.microCount === 0 && summary.junctions.length === 0 ? React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-3)",
      padding: "6px 0"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 \u2014 \u0E27\u0E32\u0E14\u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E32\u0E22\u0E41\u0E25\u0E30\u0E27\u0E32\u0E07\u0E08\u0E38\u0E14\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E2A\u0E23\u0E38\u0E1B") : React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, summary.cable.length > 0 && React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E23\u0E30\u0E22\u0E30\u0E2A\u0E32\u0E22 / \u0E17\u0E48\u0E2D (\u0E23\u0E27\u0E21\u0E40\u0E1C\u0E37\u0E48\u0E2D)", summary.pageCount > 1 ? " · รวมทุกหน้า (" + summary.pageCount + " รูป)" : ""), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, summary.cable.map(c => React.createElement("div", {
    key: c.kind.key,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      fontSize: 12.5
    }
  }, React.createElement("span", {
    style: {
      width: 12,
      height: 4,
      borderRadius: 2,
      background: c.kind.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      flex: 1,
      color: "var(--text-1)",
      fontWeight: 600
    }
  }, c.kind.label, " ", React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontWeight: 400
    }
  }, "\xB7 ", c.count, " \u0E40\u0E2A\u0E49\u0E19")), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, fmtM(c.raw)), React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--primary-dark)",
      fontWeight: 700,
      minWidth: 78,
      textAlign: "right"
    }
  }, "\u2192 \u0E2A\u0E31\u0E48\u0E07 ", c.withSpare.toLocaleString(), " \u0E21.")))), summary.cable.some(c => c.unknown > 0) && React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "#F59E0B",
      marginTop: 5
    }
  }, "\u26A0 \u0E1A\u0E32\u0E07\u0E40\u0E2A\u0E49\u0E19\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E23\u0E30\u0E22\u0E30 (\u0E15\u0E31\u0E49\u0E07\u0E21\u0E32\u0E15\u0E23\u0E32\u0E2A\u0E48\u0E27\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07)")), summary.cable.some(c => c.kind.key === "dc") && React.createElement("div", {
    style: {
      borderTop: "1px dashed var(--border)",
      paddingTop: 11
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 8,
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement(Icon, {
    name: "panel",
    size: 13,
    color: "#EF4444"
  }), " \u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E22 DC (PV) \xB7 PV1-F (\u0E1E\u0E34\u0E01\u0E31\u0E14 \u0E27\u0E2A\u0E17.)"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, "Isc \u0E41\u0E1C\u0E07"), React.createElement("input", {
    type: "number",
    step: "0.01",
    value: panelIsc || "",
    onChange: e => {
      setPanelIsc(+e.target.value || 0);
      mark();
    },
    placeholder: "A",
    style: {
      width: 72,
      padding: "6px 9px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12.5,
      textAlign: "right"
    }
  }), React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, "A")), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, dcCalc.isc > 0 ? React.createElement("span", null, "\u0E01\u0E23\u0E30\u0E41\u0E2A\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A = Isc \xD7 1.25 \u2248 ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, dcCalc.amp), " A \u2192 \u0E2A\u0E32\u0E22\u0E41\u0E19\u0E30\u0E19\u0E33 ", React.createElement("b", {
    style: {
      color: "var(--tint-red-tx)",
      fontSize: 14
    }
  }, dcCalc.cable), (() => {
    const dc = summary.cable.find(c => c.kind.key === "dc");
    return dc && dc.raw > 0 ? React.createElement("span", null, " \xB7 \u0E22\u0E32\u0E27 ", React.createElement("b", {
      style: {
        color: "var(--text-1)"
      }
    }, dc.withSpare.toLocaleString()), " \u0E21.") : null;
  })()) : React.createElement("span", {
    style: {
      color: "#F59E0B"
    }
  }, "\u0E43\u0E2A\u0E48\u0E04\u0E48\u0E32 Isc \u0E02\u0E2D\u0E07\u0E41\u0E1C\u0E07 (\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E38\u0E48\u0E19\u0E41\u0E1C\u0E07\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07\u0E17\u0E35\u0E48\u0E01\u0E23\u0E2D\u0E01 Isc \u0E44\u0E27\u0E49) \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E33\u0E19\u0E27\u0E13\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22 DC")), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, "* \u0E2A\u0E32\u0E22 PV1-F \u0E17\u0E2D\u0E07\u0E41\u0E14\u0E07 XLPO 90\xB0C \u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 6 mm\xB2 \u0E15\u0E32\u0E21 \u0E27\u0E2A\u0E17. (\u0E2A\u0E39\u0E15\u0E23/\u0E1E\u0E34\u0E01\u0E31\u0E14\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32 BOQ)")), summary.cable.some(c => c.kind.key === "ac") && React.createElement("div", {
    style: {
      borderTop: "1px dashed var(--border)",
      paddingTop: 11
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 8,
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement(Icon, {
    name: "bolt",
    size: 13,
    color: "#3B82F6"
  }), " \u0E04\u0E33\u0E19\u0E27\u0E13\u0E2A\u0E32\u0E22 AC \u0E40\u0E21\u0E19 \xB7 CV-FD (\u0E1E\u0E34\u0E01\u0E31\u0E14 \u0E27\u0E2A\u0E17.)"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-2)",
      fontWeight: 700
    }
  }, "\u0E0A\u0E19\u0E34\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), React.createElement("div", {
    style: {
      display: "inline-flex",
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid var(--border-strong)"
    }
  }, [["micro", "ไมโคร"], ["string", "สตริง"]].map(([v, l]) => React.createElement("button", {
    key: v,
    onClick: () => {
      setInvType(v);
      mark();
    },
    style: {
      padding: "6px 13px",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      background: invType === v ? "var(--primary)" : "var(--surface)",
      color: invType === v ? "#fff" : "var(--text-2)"
    }
  }, l)))), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5,
      marginTop: 8
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A"), React.createElement("input", {
    type: "number",
    value: acKw,
    onChange: e => {
      setAcKw(e.target.value);
      mark();
    },
    placeholder: invType === "micro" ? "auto " + summary.kwp : "kW",
    style: {
      width: 78,
      padding: "6px 9px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 12.5,
      textAlign: "right"
    }
  }), React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, "kW"), invType === "micro" && acCalc.auto && React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--primary-dark)",
      fontWeight: 700
    }
  }, "= \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07 ", summary.microPanels, " \u0E41\u0E1C\u0E07 (auto)"), React.createElement("div", {
    style: {
      display: "inline-flex",
      borderRadius: 8,
      overflow: "hidden",
      border: "1px solid var(--border-strong)"
    }
  }, [1, 3].map(p => React.createElement("button", {
    key: p,
    onClick: () => {
      setAcPhase(p);
      mark();
    },
    style: {
      padding: "6px 12px",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      background: acPhase === p ? "var(--primary)" : "var(--surface)",
      color: acPhase === p ? "#fff" : "var(--text-2)"
    }
  }, p, " \u0E40\u0E1F\u0E2A")))), React.createElement("div", {
    style: {
      marginTop: 9,
      fontSize: 12.5,
      color: "var(--text-2)",
      lineHeight: 1.7
    }
  }, "\u0E23\u0E30\u0E1A\u0E1A ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, acCalc.kw || 0), " kW \u2192 \u0E01\u0E23\u0E30\u0E41\u0E2A \u2248 ", React.createElement("b", {
    style: {
      color: "var(--text-1)"
    }
  }, acCalc.amp), " A ", React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, "(\xD71.25 = ", acCalc.need, " A)"), " \u2192 \u0E2A\u0E32\u0E22\u0E41\u0E19\u0E30\u0E19\u0E33 ", React.createElement("b", {
    style: {
      color: "var(--tint-ok-tx)",
      fontSize: 14
    }
  }, acCalc.cable), (() => {
    const ac = summary.cable.find(c => c.kind.key === "ac");
    return ac && ac.raw > 0 ? React.createElement("span", null, " \xB7 \u0E22\u0E32\u0E27 ", React.createElement("b", {
      style: {
        color: "var(--text-1)"
      }
    }, ac.withSpare.toLocaleString()), " \u0E21.") : null;
  })()), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 4
    }
  }, "* ", invType === "micro" ? "ไมโคร: คิด kW จากจำนวนแผง × Wp อัตโนมัติ (พิมพ์ทับได้)" : "สตริง: กรอก kW พิกัดอินเวอร์เตอร์", " \xB7 \u0E2A\u0E32\u0E22 CV-FD (XLPE 90\xB0C) \u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E17\u0E48\u0E2D\u0E43\u0E19\u0E2D\u0E32\u0E01\u0E32\u0E28 \u0E01\u0E25\u0E38\u0E48\u0E21 1 (\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A BOQ)")), (summary.equip.length > 0 || summary.panelTotal > 0) && React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E08\u0E38\u0E14\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, summary.panelTotal > 0 && React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 99,
      background: PLAN_PANEL_COLOR + "16",
      color: PLAN_PANEL_COLOR,
      fontSize: 12,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: "panel",
    size: 13,
    color: PLAN_PANEL_COLOR
  }), "\u0E41\u0E1C\u0E07\u0E42\u0E0B\u0E25\u0E32\u0E23\u0E4C ", React.createElement("b", null, summary.panelTotal), " \u0E41\u0E1C\u0E07 ", React.createElement("span", {
    style: {
      fontWeight: 400,
      color: "var(--text-3)"
    }
  }, "\xB7 ", summary.panelBlocks, " \u0E1A\u0E25\u0E47\u0E2D\u0E01")), summary.equip.map(e => React.createElement("span", {
    key: e.kind.key,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 99,
      background: e.kind.color + "16",
      color: e.kind.color,
      fontSize: 12,
      fontWeight: 700
    }
  }, React.createElement(Icon, {
    name: e.kind.icon,
    size: 13,
    color: e.kind.color
  }), e.kind.label, " ", React.createElement("b", null, e.count))))), summary.junctions.length > 0 && React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 6
    }
  }, "\u0E08\u0E38\u0E14\u0E15\u0E48\u0E2D\u0E23\u0E39\u0E1B"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, summary.junctions.map(j => React.createElement("span", {
    key: j.jid,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 11px",
      borderRadius: 99,
      background: PLAN_XPAGE_COLOR + "16",
      color: PLAN_XPAGE_COLOR,
      fontSize: 12,
      fontWeight: 700
    }
  }, React.createElement("span", {
    style: {
      display: "inline-grid",
      placeItems: "center",
      width: 16,
      height: 16,
      borderRadius: 99,
      background: PLAN_XPAGE_COLOR,
      color: "#fff",
      fontSize: 10
    }
  }, j.n), j.pages.join(" ↔ "))))), (takeoff.kwp > 0 || takeoff.eq.length > 0 || takeoff.cab.length > 0) && React.createElement("div", {
    style: {
      borderTop: "2px solid var(--border)",
      paddingTop: 13
    }
  }, takeoff.kwp > 0 && React.createElement("div", {
    style: {
      background: "linear-gradient(135deg,#0EA5E9,#1D4ED8)",
      borderRadius: 12,
      padding: "13px 15px",
      color: "#fff",
      marginBottom: 13
    }
  }, React.createElement("div", {
    style: {
      fontSize: 10.5,
      opacity: 0.85,
      fontWeight: 700,
      letterSpacing: ".08em",
      textTransform: "uppercase"
    }
  }, "\u0E2A\u0E23\u0E38\u0E1B\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E19\u0E33\u0E40\u0E2A\u0E19\u0E2D\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32"), React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "baseline",
      gap: "2px 16px",
      marginTop: 5
    }
  }, React.createElement("span", {
    style: {
      fontSize: 23,
      fontWeight: 800
    }
  }, takeoff.kwp, React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      marginLeft: 3
    }
  }, "kWp")), React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--tint-amber-bd)"
    }
  }, "\u2248 ", takeoff.estKwh.toLocaleString(), React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      marginLeft: 3
    }
  }, "kWh/\u0E1B\u0E35")), React.createElement("span", {
    style: {
      opacity: 0.85,
      fontSize: 12
    }
  }, "~", takeoff.estKwhMo.toLocaleString(), " kWh/\u0E40\u0E14\u0E37\u0E2D\u0E19")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      fontSize: 11,
      opacity: 0.92
    }
  }, "\u0E1C\u0E25\u0E34\u0E15\u0E44\u0E1F\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22", React.createElement("input", {
    type: "number",
    value: yieldFactor,
    onChange: e => setYieldFactor(+e.target.value || 0),
    style: {
      width: 58,
      padding: "3px 7px",
      borderRadius: 7,
      border: "1px solid rgba(255,255,255,.3)",
      background: "rgba(255,255,255,.14)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      textAlign: "right"
    }
  }), " kWh/kWp/\u0E1B\u0E35", React.createElement("span", {
    style: {
      opacity: 0.7
    }
  }, "\xB7 ", summary.panelTotal, " \u0E41\u0E1C\u0E07 \xB7 ", summary.microCount, " \u0E44\u0E21\u0E42\u0E04\u0E23\u0E2F"))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 8
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement(Icon, {
    name: "box",
    size: 13,
    color: "var(--primary-dark)"
  }), " \u0E16\u0E2D\u0E14\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E08\u0E32\u0E01\u0E1C\u0E31\u0E07 (BOQ)"), React.createElement("button", {
    onClick: doCopyTakeoff,
    style: {
      padding: "6px 12px",
      borderRadius: 8,
      border: "1px solid var(--border-strong)",
      background: copied ? "var(--tint-green-tx)" : "var(--surface)",
      color: copied ? "#fff" : "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap"
    }
  }, copied ? "✓ คัดลอกแล้ว" : "⧉ คัดลอกรายการ")), takeoff.eq.length > 0 && React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, takeoff.eq.map((e, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5,
      padding: "4px 0",
      borderBottom: "1px dashed var(--border)"
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      color: "var(--text-1)",
      fontWeight: 600
    }
  }, e.label), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, e.qty.toLocaleString()), React.createElement("span", {
    style: {
      color: "var(--text-3)",
      minWidth: 30
    }
  }, e.unit)))), takeoff.cab.length > 0 && React.createElement("div", null, takeoff.cab.map(c => React.createElement("div", {
    key: c.key,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5,
      padding: "5px 0",
      borderBottom: "1px dashed var(--border)"
    }
  }, React.createElement("span", {
    style: {
      width: 11,
      height: 4,
      borderRadius: 2,
      background: c.color,
      flexShrink: 0
    }
  }), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      color: "var(--text-1)",
      fontWeight: 600
    }
  }, c.label), c.size && React.createElement("span", {
    style: {
      color: "var(--primary-dark)",
      fontWeight: 700
    }
  }, " \xB7 ", c.size)), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 800,
      color: "var(--text-1)",
      whiteSpace: "nowrap"
    }
  }, c.meters.toLocaleString(), " \u0E21."))), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)",
      marginTop: 6
    }
  }, "* \u0E23\u0E30\u0E22\u0E30\u0E23\u0E27\u0E21\u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E49\u0E27 \xB7 \u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22/\u0E17\u0E48\u0E2D\u0E08\u0E32\u0E01\u0E1E\u0E34\u0E01\u0E31\u0E14 \u0E27\u0E2A\u0E17. (\u0E40\u0E2D\u0E19\u0E08\u0E34\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32 BOQ) \xB7 \u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E31\u0E48\u0E07\u0E02\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07")), takeoff.conduit.length > 0 && React.createElement("div", {
    style: {
      marginTop: 11
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 6,
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, "\uD83E\uDDF5 \u0E17\u0E48\u0E2D\u0E23\u0E49\u0E2D\u0E22\u0E2A\u0E32\u0E22 (\u0E41\u0E22\u0E01\u0E0A\u0E19\u0E34\u0E14/\u0E02\u0E19\u0E32\u0E14)"), takeoff.conduit.map((c, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12.5,
      padding: "5px 0",
      borderBottom: "1px dashed var(--border)"
    }
  }, React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: 99,
      background: "#7C5CFC18",
      color: "#7C5CFC",
      fontSize: 11,
      fontWeight: 700
    }
  }, c.label), React.createElement("span", {
    style: {
      color: "var(--text-1)",
      fontWeight: 700
    }
  }, c.size), c.auto && React.createElement("span", {
    style: {
      color: "var(--text-3)",
      fontSize: 10.5
    }
  }, "(\u0E41\u0E19\u0E30\u0E19\u0E33)")), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontWeight: 800,
      color: "var(--text-1)",
      whiteSpace: "nowrap"
    }
  }, c.meters.toLocaleString(), " \u0E21."))))))), lines.length > 0 && React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 12
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--text-3)",
      marginBottom: 8
    }
  }, "\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (", lines.length, ")"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, lines.map((ln, i) => {
    const kc = PLAN_LINE_BY[ln.kind] || {};
    const auto = mpp && ln.pts.length >= 2 ? lineNatLen(ln.pts) * mpp : null;
    const setLn = patch => {
      setLines(arr => arr.map((x, j) => j === i ? Object.assign({}, x, patch) : x));
      mark();
    };
    return React.createElement("div", {
      key: ln.id,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: "6px 0",
        borderBottom: i < lines.length - 1 ? "1px dashed var(--border)" : "none"
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9
      }
    }, React.createElement("span", {
      style: {
        width: 12,
        height: 4,
        borderRadius: 2,
        background: kc.color,
        flexShrink: 0
      }
    }), React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 12.5,
        color: "var(--text-1)",
        fontWeight: 600
      }
    }, kc.label, " ", React.createElement("span", {
      style: {
        color: "var(--text-3)",
        fontWeight: 400
      }
    }, "#", i + 1)), auto != null && React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)",
        fontFamily: "var(--mono)"
      }
    }, "\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49 ", Math.round(auto * 10) / 10), React.createElement("input", {
      type: "number",
      value: ln.manualM != null ? ln.manualM : "",
      placeholder: auto != null ? "แก้ ม." : "ใส่ ม.",
      onChange: e => {
        const v = e.target.value;
        setLn({
          manualM: v === "" ? null : +v
        });
      },
      style: {
        width: 74,
        padding: "6px 8px",
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface2)",
        color: "var(--text-1)",
        fontFamily: "inherit",
        fontSize: 12.5,
        textAlign: "right"
      }
    }), React.createElement("button", {
      onClick: () => {
        setLines(arr => arr.filter((_, j) => j !== i));
        mark();
      },
      title: "\u0E25\u0E1A\u0E40\u0E2A\u0E49\u0E19",
      style: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "none",
        background: "#EF444414",
        color: "#EF4444",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        flexShrink: 0
      }
    }, React.createElement(Icon, {
      name: "x",
      size: 13
    }))), React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        paddingLeft: 21
      }
    }, React.createElement("select", {
      value: ln.cores || 1,
      onChange: e => setLn({
        cores: +e.target.value || 1
      }),
      style: Object.assign({}, pSel2, {
        fontSize: 11.5,
        padding: "4px 6px"
      })
    }, PLAN_WIRE_CORES.map(c => React.createElement("option", {
      key: c,
      value: c
    }, c, "C"))), React.createElement("select", {
      value: ln.size || 0,
      onChange: e => setLn({
        size: +e.target.value || 0
      }),
      style: Object.assign({}, pSel2, {
        fontSize: 11.5,
        padding: "4px 6px"
      })
    }, React.createElement("option", {
      value: 0
    }, "\u0E2A\u0E32\u0E22: \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), PLAN_WIRE_SQMM.map(s => React.createElement("option", {
      key: s,
      value: s
    }, s, " mm\xB2"))), React.createElement("select", {
      value: ln.conduit || "none",
      onChange: e => setLn({
        conduit: e.target.value
      }),
      style: Object.assign({}, pSel2, {
        fontSize: 11.5,
        padding: "4px 6px"
      })
    }, PLAN_CONDUITS.map(c => React.createElement("option", {
      key: c.key,
      value: c.key
    }, c.label))), ln.conduit && ln.conduit !== "none" && React.createElement("select", {
      value: ln.conduitSize || "",
      onChange: e => setLn({
        conduitSize: e.target.value
      }),
      style: Object.assign({}, pSel2, {
        fontSize: 11.5,
        padding: "4px 6px"
      })
    }, React.createElement("option", {
      value: ""
    }, "\u0E17\u0E48\u0E2D: \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), PLAN_CONDUIT_SIZES.map(s => React.createElement("option", {
      key: s,
      value: s
    }, s)))));
  }))), React.createElement("div", null, React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) {
        if (lines.length || markers.length ? confirm("เปลี่ยนรูปจะล้างเส้น/จุดทั้งหมด ยืนยัน?") : true) pickImage(f);
      }
      e.target.value = "";
    }
  }), React.createElement("button", {
    onClick: () => fileRef.current && fileRef.current.click(),
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E39\u0E1B")))), React.createElement("input", {
    ref: markerPhotoRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) attachMarkerPhoto(f);
      e.target.value = "";
    }
  }), pdfSettings && (() => {
    const inp = {
      width: "100%",
      boxSizing: "border-box",
      padding: "9px 11px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface2)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13.5
    };
    return React.createElement("div", {
      onClick: () => setPdfSettings(false),
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,12,10,.55)",
        zIndex: 210,
        display: "grid",
        placeItems: "center",
        padding: 18
      }
    }, React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        background: "var(--surface)",
        borderRadius: 14,
        padding: 18,
        width: "min(440px,100%)",
        maxHeight: "88vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontSize: 17
      }
    }, "\u2699\uFE0F"), React.createElement("b", {
      style: {
        fontSize: 15,
        color: "var(--text-1)"
      }
    }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 PDF \u0E19\u0E33\u0E40\u0E2A\u0E19\u0E2D"), React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E19\u0E35\u0E49")), React.createElement("input", {
      ref: pdfLogoRef,
      type: "file",
      accept: "image/*",
      style: {
        display: "none"
      },
      onChange: e => {
        const f = e.target.files && e.target.files[0];
        if (f) attachPdfLogo(f);
        e.target.value = "";
      }
    }), React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12
      }
    }, React.createElement("div", {
      style: {
        width: 84,
        height: 60,
        borderRadius: 8,
        border: "1px dashed var(--border-strong)",
        background: pdfInfo.logo ? "#0A3123" : "var(--surface2)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        flexShrink: 0
      }
    }, pdfInfo.logo ? React.createElement("img", {
      src: pdfInfo.logo,
      alt: "logo",
      style: {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain"
      }
    }) : React.createElement("span", {
      style: {
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35")), React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, React.createElement("b", {
      style: {
        fontSize: 12.5,
        color: "var(--text-2)"
      }
    }, "\u0E42\u0E25\u0E42\u0E01\u0E49\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 (\u0E1A\u0E19\u0E1B\u0E01/\u0E2B\u0E31\u0E27\u0E2A\u0E44\u0E25\u0E14\u0E4C)"), React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, React.createElement("button", {
      onClick: () => busy ? null : pdfLogoRef.current && pdfLogoRef.current.click(),
      disabled: busy,
      style: {
        padding: "6px 11px",
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, busy ? "กำลังโหลด..." : pdfInfo.logo ? "เปลี่ยนรูป" : "＋ อัปโหลดโลโก้"), pdfInfo.logo && React.createElement("button", {
      onClick: () => setPdfInfo(p => Object.assign({}, p, {
        logo: ""
      })),
      style: {
        padding: "6px 11px",
        borderRadius: 8,
        border: "1px solid #EF444455",
        background: "#EF444414",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A")), React.createElement("span", {
      style: {
        fontSize: 10.5,
        color: "var(--text-3)"
      }
    }, "\u0E41\u0E19\u0E30\u0E19\u0E33\u0E42\u0E25\u0E42\u0E01\u0E49\u0E1E\u0E37\u0E49\u0E19\u0E42\u0E1B\u0E23\u0E48\u0E07 (PNG) \u0E2A\u0E35\u0E2D\u0E48\u0E2D\u0E19 \u0E08\u0E30\u0E40\u0E14\u0E48\u0E19\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E40\u0E02\u0E35\u0E22\u0E27"))), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19 & \u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23 (\u0E1A\u0E23\u0E23\u0E17\u0E31\u0E14\u0E25\u0E30 1 \u0E02\u0E49\u0E2D)", React.createElement("textarea", {
      value: (pdfInfo.warranties || []).join("\n"),
      onChange: e => setPdfInfo(p => Object.assign({}, p, {
        warranties: e.target.value.split("\n")
      })),
      rows: 6,
      style: Object.assign({}, inp, {
        resize: "vertical",
        lineHeight: 1.5
      })
    })), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D", React.createElement("input", {
      value: pdfInfo.email || "",
      onChange: e => setPdfInfo(p => Object.assign({}, p, {
        email: e.target.value
      })),
      style: inp
    })), React.createElement("label", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        fontSize: 12.5,
        fontWeight: 700,
        color: "var(--text-2)"
      }
    }, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23", React.createElement("input", {
      value: pdfInfo.tel || "",
      onChange: e => setPdfInfo(p => Object.assign({}, p, {
        tel: e.target.value
      })),
      style: inp
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 2
      }
    }, React.createElement("button", {
      onClick: () => {
        if (confirm("คืนค่ารับประกัน/ติดต่อ เป็นค่าเริ่มต้น? (โลโก้ไม่ถูกลบ)")) setPdfInfo(p => Object.assign({}, PDF_DEFAULTS, {
          logo: p.logo
        }));
      },
      style: {
        padding: "9px 13px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        color: "var(--text-2)",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19"), React.createElement("button", {
      onClick: () => setPdfSettings(false),
      style: {
        flex: 1,
        padding: "9px",
        borderRadius: 9,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E40\u0E2A\u0E23\u0E47\u0E08"))));
  })(), noteEdit && (() => {
    const nt = notes.find(n => n.id === noteEdit);
    if (!nt) return null;
    const close = () => {
      setNotes(arr => arr.filter(n => !(n.id === nt.id && !(n.text || "").trim())));
      mark();
      setNoteEdit(null);
    };
    return React.createElement("div", {
      onClick: close,
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,12,10,.55)",
        zIndex: 210,
        display: "grid",
        placeItems: "center",
        padding: 18
      }
    }, React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        background: "var(--surface)",
        borderRadius: 14,
        padding: 16,
        width: "min(340px,100%)",
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        fontSize: 16
      }
    }, "\uD83D\uDCAC"), React.createElement("b", {
      style: {
        fontSize: 14,
        color: "var(--text-1)"
      }
    }, "\u0E04\u0E2D\u0E21\u0E40\u0E21\u0E19\u0E15\u0E4C\u0E1A\u0E19\u0E20\u0E32\u0E1E")), React.createElement("textarea", {
      autoFocus: true,
      value: nt.text || "",
      onChange: e => {
        const v = e.target.value;
        setNotes(arr => arr.map(n => n.id === nt.id ? Object.assign({}, n, {
          text: v
        }) : n));
      },
      placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 \u0E40\u0E0A\u0E48\u0E19 \u0E08\u0E38\u0E14\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E08\u0E32\u0E30\u0E1C\u0E19\u0E31\u0E07 / \u0E23\u0E30\u0E27\u0E31\u0E07\u0E17\u0E48\u0E2D\u0E1B\u0E23\u0E30\u0E1B\u0E32 / \u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E48\u0E32\u0E07",
      rows: 4,
      style: {
        width: "100%",
        boxSizing: "border-box",
        padding: "9px 11px",
        borderRadius: 9,
        border: "1px solid var(--border-strong)",
        background: "var(--surface2)",
        color: "var(--text-1)",
        fontFamily: "inherit",
        fontSize: 13.5,
        lineHeight: 1.5,
        resize: "vertical"
      }
    }), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 2
      }
    }, React.createElement("button", {
      onClick: () => {
        setNotes(arr => arr.filter(n => n.id !== nt.id));
        mark();
        setNoteEdit(null);
      },
      style: {
        padding: "9px 14px",
        borderRadius: 9,
        border: "1px solid #EF444455",
        background: "#EF444414",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A"), React.createElement("button", {
      onClick: close,
      style: {
        flex: 1,
        padding: "9px",
        borderRadius: 9,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E40\u0E2A\u0E23\u0E47\u0E08"))));
  })(), lineEdit && (() => {
    const ln = lines.find(l => l.id === lineEdit);
    if (!ln) return null;
    const kc = PLAN_LINE_BY[ln.kind] || {};
    const auto = mpp && ln.pts.length >= 2 ? Math.round(lineNatLen(ln.pts) * mpp * 10) / 10 : null;
    const selS = Object.assign({}, pSel2, {
      fontSize: 12.5,
      padding: "7px 9px",
      width: "100%"
    });
    return React.createElement("div", {
      onClick: () => setLineEdit(null),
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,12,10,.55)",
        zIndex: 210,
        display: "grid",
        placeItems: "center",
        padding: 18
      }
    }, React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        background: "var(--surface)",
        borderRadius: 14,
        padding: 16,
        width: "min(320px,100%)",
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        width: 14,
        height: 5,
        borderRadius: 3,
        background: kc.color
      }
    }), React.createElement("b", {
      style: {
        fontSize: 14,
        color: "var(--text-1)"
      }
    }, "\u0E1B\u0E23\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E2A\u0E32\u0E22"), auto != null && React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49 ", auto, " \u0E21.")), React.createElement("label", {
      style: lblS
    }, "\u0E0A\u0E19\u0E34\u0E14\u0E2A\u0E32\u0E22", React.createElement("select", {
      value: ln.kind,
      onChange: e => updateLine(ln.id, {
        kind: e.target.value
      }),
      style: selS
    }, PLAN_LINE_KINDS.map(k => React.createElement("option", {
      key: k.key,
      value: k.key
    }, k.label)))), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, React.createElement("label", {
      style: Object.assign({}, lblS, {
        width: 88
      })
    }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E01\u0E19", React.createElement("select", {
      value: ln.cores || 1,
      onChange: e => updateLine(ln.id, {
        cores: +e.target.value || 1
      }),
      style: selS
    }, PLAN_WIRE_CORES.map(c => React.createElement("option", {
      key: c,
      value: c
    }, c, "C")))), React.createElement("label", {
      style: Object.assign({}, lblS, {
        flex: 1
      })
    }, "\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22", React.createElement("select", {
      value: ln.size || 0,
      onChange: e => updateLine(ln.id, {
        size: +e.target.value || 0
      }),
      style: selS
    }, React.createElement("option", {
      value: 0
    }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49)"), PLAN_WIRE_SQMM.map(s => React.createElement("option", {
      key: s,
      value: s
    }, s, " mm\xB2"))))), React.createElement("label", {
      style: lblS
    }, "\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E17\u0E48\u0E2D", React.createElement("select", {
      value: ln.conduit || "none",
      onChange: e => updateLine(ln.id, {
        conduit: e.target.value
      }),
      style: selS
    }, PLAN_CONDUITS.map(c => React.createElement("option", {
      key: c.key,
      value: c.key
    }, c.label)))), ln.conduit && ln.conduit !== "none" && React.createElement("label", {
      style: lblS
    }, "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E48\u0E2D", React.createElement("select", {
      value: ln.conduitSize || "",
      onChange: e => updateLine(ln.id, {
        conduitSize: e.target.value
      }),
      style: selS
    }, React.createElement("option", {
      value: ""
    }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49)"), PLAN_CONDUIT_SIZES.map(s => React.createElement("option", {
      key: s,
      value: s
    }, s)))), React.createElement("label", {
      style: lblS
    }, "\u0E23\u0E30\u0E22\u0E30 (\u0E21.) \u2014 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49", React.createElement("input", {
      type: "number",
      value: ln.manualM != null ? ln.manualM : "",
      placeholder: auto != null ? String(auto) : "ใส่ ม.",
      onChange: e => {
        const v = e.target.value;
        updateLine(ln.id, {
          manualM: v === "" ? null : +v
        });
      },
      style: Object.assign({}, selS, {
        textAlign: "right"
      })
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 2
      }
    }, React.createElement("button", {
      onClick: () => {
        setLines(arr => arr.filter(l => l.id !== ln.id));
        mark();
        setLineEdit(null);
      },
      style: {
        padding: "9px 14px",
        borderRadius: 9,
        border: "1px solid #EF444455",
        background: "#EF444414",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A\u0E40\u0E2A\u0E49\u0E19"), React.createElement("button", {
      onClick: () => setLineEdit(null),
      style: {
        flex: 1,
        padding: "9px",
        borderRadius: 9,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E40\u0E2A\u0E23\u0E47\u0E08"))));
  })(), linkEdit && (() => {
    const lk = links.find(l => l.id === linkEdit);
    if (!lk) return null;
    const col = lk.color || (lk.ac ? PLAN_AC_TRUNK_COLOR : "#06B6D4");
    const auto = linkMeters({
      id: lk.id,
      from: lk.from,
      to: lk.to,
      pts: lk.pts,
      ac: lk.ac
    });
    const autoR = auto != null ? Math.round(auto * 10) / 10 : null;
    const selS = Object.assign({}, pSel2, {
      fontSize: 12.5,
      padding: "7px 9px",
      width: "100%"
    });
    const base = lk.ac ? "CV-FD (สาย AC)" : "PV (สตริง DC)";
    return React.createElement("div", {
      onClick: () => setLinkEdit(null),
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,12,10,.55)",
        zIndex: 210,
        display: "grid",
        placeItems: "center",
        padding: 18
      }
    }, React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        background: "var(--surface)",
        borderRadius: 14,
        padding: 16,
        width: "min(320px,100%)",
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, React.createElement("span", {
      style: {
        width: 14,
        height: 5,
        borderRadius: 3,
        background: col
      }
    }), React.createElement("b", {
      style: {
        fontSize: 13.5,
        color: "var(--text-1)"
      }
    }, linkTitle(lk)), autoR != null && React.createElement("span", {
      style: {
        marginLeft: "auto",
        fontSize: 11.5,
        color: "var(--text-3)"
      }
    }, "\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49 ", autoR, " \u0E21.")), React.createElement("div", {
      style: {
        fontSize: 11,
        color: "var(--text-3)"
      }
    }, "\u0E0A\u0E19\u0E34\u0E14\u0E2A\u0E32\u0E22: ", base), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, React.createElement("label", {
      style: Object.assign({}, lblS, {
        width: 88
      })
    }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E41\u0E01\u0E19", React.createElement("select", {
      value: lk.cores || 1,
      onChange: e => updateLink(lk.id, {
        cores: +e.target.value || 1
      }),
      style: selS
    }, PLAN_WIRE_CORES.map(c => React.createElement("option", {
      key: c,
      value: c
    }, c, "C")))), React.createElement("label", {
      style: Object.assign({}, lblS, {
        flex: 1
      })
    }, "\u0E02\u0E19\u0E32\u0E14\u0E2A\u0E32\u0E22", React.createElement("select", {
      value: lk.size || 0,
      onChange: e => updateLink(lk.id, {
        size: +e.target.value || 0
      }),
      style: selS
    }, React.createElement("option", {
      value: 0
    }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49)"), PLAN_WIRE_SQMM.map(s => React.createElement("option", {
      key: s,
      value: s
    }, s, " mm\xB2"))))), React.createElement("label", {
      style: lblS
    }, "\u0E40\u0E14\u0E34\u0E19\u0E43\u0E19\u0E17\u0E48\u0E2D", React.createElement("select", {
      value: lk.conduit || "none",
      onChange: e => updateLink(lk.id, {
        conduit: e.target.value
      }),
      style: selS
    }, PLAN_CONDUITS.map(c => React.createElement("option", {
      key: c.key,
      value: c.key
    }, c.label)))), lk.conduit && lk.conduit !== "none" && React.createElement("label", {
      style: lblS
    }, "\u0E02\u0E19\u0E32\u0E14\u0E17\u0E48\u0E2D", React.createElement("select", {
      value: lk.conduitSize || "",
      onChange: e => updateLink(lk.id, {
        conduitSize: e.target.value
      }),
      style: selS
    }, React.createElement("option", {
      value: ""
    }, "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 (\u0E04\u0E34\u0E14\u0E43\u0E2B\u0E49)"), PLAN_CONDUIT_SIZES.map(s => React.createElement("option", {
      key: s,
      value: s
    }, s)))), React.createElement("label", {
      style: lblS
    }, "\u0E23\u0E30\u0E22\u0E30 (\u0E21.) \u2014 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E43\u0E0A\u0E49\u0E04\u0E48\u0E32\u0E17\u0E35\u0E48\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49", React.createElement("input", {
      type: "number",
      value: lk.manualM != null ? lk.manualM : "",
      placeholder: autoR != null ? String(autoR) : "ใส่ ม.",
      onChange: e => {
        const v = e.target.value;
        updateLink(lk.id, {
          manualM: v === "" ? null : +v
        });
      },
      style: Object.assign({}, selS, {
        textAlign: "right"
      })
    })), React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        marginTop: 2
      }
    }, React.createElement("button", {
      onClick: () => {
        setLinks(arr => arr.filter(l => l.id !== lk.id));
        mark();
        setLinkEdit(null);
      },
      style: {
        padding: "9px 14px",
        borderRadius: 9,
        border: "1px solid #EF444455",
        background: "#EF444414",
        color: "#EF4444",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A\u0E2A\u0E32\u0E22"), React.createElement("button", {
      onClick: () => setLinkEdit(null),
      style: {
        flex: 1,
        padding: "9px",
        borderRadius: 9,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E40\u0E2A\u0E23\u0E47\u0E08"))));
  })(), photoView && (() => {
    const m = markers.find(mm => mm.id === photoView);
    const ps = markerPhotos(m);
    if (!m || ps.length === 0) return null;
    const idx = Math.min(photoIdx, ps.length - 1);
    const title = m.kind === "xpage" ? "จุดต่อ " + (m.n || "") : (PLAN_MARKER_BY[m.kind] || {}).label || "จุดอุปกรณ์";
    const navBtn = {
      width: 42,
      height: 42,
      borderRadius: 99,
      border: "1px solid rgba(255,255,255,.35)",
      background: "rgba(0,0,0,.35)",
      color: "#fff",
      fontSize: 20,
      fontWeight: 800,
      cursor: "pointer",
      flexShrink: 0
    };
    return React.createElement("div", {
      onClick: () => {
        if (!photoDraw) setPhotoView(null);
      },
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(8,12,10,.9)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 16
      }
    }, React.createElement("div", {
      style: {
        color: "#fff",
        fontWeight: 800,
        fontSize: 15
      }
    }, "\uD83D\uDCF7 ", title, " ", photoDraw && React.createElement("span", {
      style: {
        opacity: 0.8,
        fontWeight: 700,
        fontSize: 13
      }
    }, "\xB7 \u270F\uFE0F \u0E27\u0E32\u0E14/\u0E40\u0E02\u0E35\u0E22\u0E19"), " ", !photoDraw && ps.length > 1 && React.createElement("span", {
      style: {
        opacity: 0.7,
        fontWeight: 600,
        fontSize: 13
      }
    }, "\xB7 ", idx + 1, "/", ps.length)), photoDraw ? React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        maxWidth: "100%"
      }
    }, React.createElement("canvas", {
      ref: drawCanvasRef,
      onPointerDown: photoPenDown,
      onPointerMove: photoPenMove,
      onPointerUp: photoPenUp,
      onPointerCancel: photoPenUp,
      style: {
        maxWidth: "84vw",
        maxHeight: "56vh",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        touchAction: "none",
        cursor: "crosshair",
        background: "#000"
      }
    })) : React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        maxWidth: "100%"
      }
    }, ps.length > 1 && React.createElement("button", {
      onClick: () => setPhotoIdx(i => (i - 1 + ps.length) % ps.length),
      style: navBtn
    }, "\u2039"), React.createElement("img", {
      src: ps[idx],
      alt: title,
      style: {
        maxWidth: "82vw",
        maxHeight: "64vh",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,.5)",
        objectFit: "contain"
      }
    }), ps.length > 1 && React.createElement("button", {
      onClick: () => setPhotoIdx(i => (i + 1) % ps.length),
      style: navBtn
    }, "\u203A")), !photoDraw && ps.length > 1 && React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        gap: 6,
        maxWidth: "90vw",
        overflowX: "auto",
        padding: "2px 0"
      }
    }, ps.map((p, i) => React.createElement("img", {
      key: i,
      src: p,
      onClick: () => setPhotoIdx(i),
      alt: "",
      style: {
        width: 46,
        height: 46,
        objectFit: "cover",
        borderRadius: 7,
        cursor: "pointer",
        flexShrink: 0,
        border: i === idx ? "2px solid var(--primary)" : "2px solid rgba(255,255,255,.25)"
      }
    }))), photoDraw ? React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center"
      }
    }, [["free", "✏️ ปากกา"], ["line", "📏 เส้นสายไฟ"], ["text", "🆎 ข้อความ"]].map(([mo, lb]) => React.createElement("button", {
      key: mo,
      onClick: () => setPenMode(mo),
      style: {
        padding: "8px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        border: penMode === mo ? "2px solid #fff" : "1px solid rgba(255,255,255,.35)",
        background: penMode === mo ? "var(--primary)" : "transparent",
        color: "#fff"
      }
    }, lb)), React.createElement("span", {
      style: {
        width: 1,
        height: 22,
        background: "rgba(255,255,255,.25)"
      }
    }), ["#EF4444", "#3B82F6", "#FACC15", "#22C55E", "#FFFFFF", "#111827"].map(c => React.createElement("button", {
      key: c,
      onClick: () => setPenColor(c),
      title: c,
      style: {
        width: 26,
        height: 26,
        borderRadius: 99,
        cursor: "pointer",
        background: c,
        border: penColor === c ? "3px solid #fff" : "2px solid rgba(255,255,255,.4)",
        boxShadow: penColor === c ? "0 0 0 2px var(--primary)" : "none"
      }
    })), React.createElement("span", {
      style: {
        width: 1,
        height: 22,
        background: "rgba(255,255,255,.25)"
      }
    }), React.createElement("button", {
      onClick: () => setStrokes(arr => arr.slice(0, -1)),
      disabled: !strokes.length,
      style: {
        padding: "9px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.35)",
        background: "transparent",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: strokes.length ? "pointer" : "default",
        opacity: strokes.length ? 1 : 0.4
      }
    }, "\u21A9 \u0E40\u0E25\u0E34\u0E01\u0E17\u0E33"), React.createElement("button", {
      onClick: () => setStrokes([]),
      disabled: !strokes.length,
      style: {
        padding: "9px 14px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.35)",
        background: "transparent",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: strokes.length ? "pointer" : "default",
        opacity: strokes.length ? 1 : 0.4
      }
    }, "\u0E25\u0E49\u0E32\u0E07"), React.createElement("button", {
      onClick: savePhotoDraw,
      style: {
        padding: "9px 16px",
        borderRadius: 10,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u2713 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E39\u0E1B"), React.createElement("button", {
      onClick: () => {
        setPhotoDraw(false);
        setStrokes([]);
      },
      style: {
        padding: "9px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.35)",
        background: "transparent",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")) : React.createElement("div", {
      onClick: e => e.stopPropagation(),
      style: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: "center"
      }
    }, React.createElement("button", {
      onClick: openPhotoDraw,
      style: {
        padding: "9px 16px",
        borderRadius: 10,
        border: "none",
        background: "#F59E0B",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u270F\uFE0F \u0E27\u0E32\u0E14/\u0E40\u0E02\u0E35\u0E22\u0E19"), React.createElement("button", {
      onClick: () => openMarkerPhotoPicker(m.id),
      disabled: busy,
      style: {
        padding: "9px 16px",
        borderRadius: 10,
        border: "none",
        background: "var(--primary)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: busy ? "default" : "pointer"
      }
    }, busy ? "กำลังโหลด..." : "＋ เพิ่มรูป"), React.createElement("button", {
      onClick: () => {
        if (confirm("ลบรูปนี้?")) removeMarkerPhotoAt(m.id, idx);
      },
      style: {
        padding: "9px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.35)",
        background: "transparent",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E25\u0E1A\u0E23\u0E39\u0E1B\u0E19\u0E35\u0E49"), React.createElement("button", {
      onClick: () => setPhotoView(null),
      style: {
        padding: "9px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,.35)",
        background: "transparent",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer"
      }
    }, "\u0E1B\u0E34\u0E14")));
  })(), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      padding: "12px 16px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      padding: "11px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"), (() => {
    const canSave = !!image || pages.some(p => p.image);
    return React.createElement("button", {
      onClick: doSave,
      disabled: !canSave,
      style: {
        flex: 1,
        padding: "11px",
        borderRadius: 11,
        border: "none",
        background: canSave ? "var(--primary)" : "var(--surface3)",
        color: canSave ? "#fff" : "var(--text-3)",
        fontWeight: 700,
        fontFamily: "inherit",
        fontSize: 14,
        cursor: canSave ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
      }
    }, React.createElement(Icon, {
      name: "check",
      size: 16,
      color: canSave ? "#fff" : "var(--text-3)",
      sw: 2.4
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E1C\u0E31\u0E07", dirty ? " *" : "");
  })())));
}
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
Object.assign(window, {
  SitePlanEditor,
  useSitePlan,
  PLAN_LINE_KINDS,
  PLAN_MARKER_KINDS
});