function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SURVEY_ROOF_TYPES = window.BOQ && window.BOQ.ROOF_OPTIONS && window.BOQ.ROOF_OPTIONS.length ? window.BOQ.ROOF_OPTIONS : ["เมทัลชีท", "กระเบื้องลอนคู่", "CPAC", "พื้นคอนกรีต (Slab)", "Shingle Roof", "อื่นๆ"];
const SURVEY_ROOF_COND = [{
  value: "good",
  label: "ดี (แข็งแรง)"
}, {
  value: "fair",
  label: "พอใช้"
}, {
  value: "poor",
  label: "ทรุดโทรม / ต้องเสริม"
}];
const SURVEY_SHADING_TAGS = ["ต้นไม้", "อาคารข้างเคียง", "เสาไฟ / สายไฟ", "ถังเก็บน้ำ", "ปล่องระบายอากาศ", "เสาอากาศ", "อื่นๆ"];
const SURVEY_INV_LOC = [{
  value: "indoor",
  label: "ในอาคาร (Indoor)"
}, {
  value: "outdoor",
  label: "นอกอาคาร (Outdoor)"
}];
const SURVEY_MDB_SPACE = [{
  value: "free",
  label: "มีช่องว่างเพียงพอ"
}, {
  value: "tight",
  label: "มีช่องว่างจำกัด"
}, {
  value: "full",
  label: "เต็ม / ต้องเพิ่มตู้"
}];
const SURVEY_BUILDING = ["บ้านเดี่ยว", "บ้านแฝด", "ทาวน์เฮาส์", "อาคารพาณิชย์", "โรงงาน / โกดัง", "อื่นๆ"];
const SURVEY_PASS = [{
  value: "pass",
  label: "ผ่าน"
}, {
  value: "fix",
  label: "ต้องเสริม / แก้ไข"
}];
const SURVEY_BIRDNET = [{
  value: "yes",
  label: "ติดตั้ง"
}, {
  value: "no",
  label: "ไม่ติดตั้ง"
}];
const SURVEY_METER_AUTH = [{
  value: "MEA",
  label: "MEA (นครหลวง)"
}, {
  value: "PEA",
  label: "PEA (ภูมิภาค)"
}];
const SURVEY_YESNO = [{
  value: "yes",
  label: "มี"
}, {
  value: "no",
  label: "ไม่มี"
}];
const SURVEY_CABLE_LEGS = [{
  key: "cableDc",
  th: "แผง → อินเวอร์เตอร์ (สาย DC)"
}, {
  key: "cableAc",
  th: "อินเวอร์เตอร์ → ตู้ MDB (สาย AC)"
}, {
  key: "cableCt",
  th: "CT / Meter → อินเวอร์เตอร์"
}, {
  key: "cableGnd",
  th: "สายกราวด์ → หลักดิน"
}];
const cableTotal = s => SURVEY_CABLE_LEGS.reduce((t, l) => t + (+(s || {})[l.key] || 0), 0);
const SURVEY_PHOTO_CATS = ["หลังคา / โครงสร้าง", "ระบบไฟฟ้า / ตู้ MDB", "จุดติดตั้งอุปกรณ์", "สิ่งกีดขวาง / เงาบัง", "รูปอุปกรณ์ที่เสนอ", "อื่นๆ"];
const SURVEY_PHOTO_SLOTS = [{
  key: "meter",
  label: "มิเตอร์ไฟฟ้า",
  hint: "ให้เห็นเลขมิเตอร์และขนาดชัดเจน"
}, {
  key: "mdb",
  label: "ภายในตู้ MDB (เปิดฝา)",
  hint: "เห็นเมนเบรกเกอร์และช่องว่าง"
}, {
  key: "roof",
  label: "ภาพรวมหลังคา",
  hint: "มุมกว้างเห็นพื้นที่ติดตั้ง"
}, {
  key: "truss",
  label: "โครงสร้าง / จันทันหลังคา",
  hint: "ดูความแข็งแรงของโครงสร้าง"
}, {
  key: "inverter",
  label: "จุดติดตั้งอินเวอร์เตอร์",
  hint: "ตำแหน่งที่จะติดตั้งจริง"
}];
const SURVEY_SLOT_BY = Object.fromEntries(SURVEY_PHOTO_SLOTS.map(s => [s.key, s]));
const isExtraShot = k => String(k || "").indexOf("x_") === 0;
function surveyStatus(job) {
  const s = job && job.survey;
  if (s && s.skip) return {
    state: "skip",
    pct: 100,
    label: "ไม่ต้องสำรวจ",
    color: "var(--tint-green-tx)"
  };
  if (!s || !s.startedAt) return {
    state: "none",
    pct: 0,
    label: "ยังไม่สำรวจ",
    color: "#94A3B8"
  };
  const fields = [!!(s.gps && s.gps.lat), !!s.meterSize, !!s.phase, !!s.roofType, !!s.mdbBrand, !!s.mainBreaker, !!s.inverterLoc];
  const photos = s.photos || {};
  const checks = fields.concat(SURVEY_PHOTO_SLOTS.map(p => !!photos[p.key]));
  const done = checks.filter(Boolean).length;
  const pct = Math.round(done / checks.length * 100);
  if (pct >= 100) return {
    state: "done",
    pct: 100,
    label: "สำรวจครบ",
    color: "var(--tint-green-tx)"
  };
  return {
    state: "partial",
    pct,
    label: "สำรวจบางส่วน",
    color: "#F59E0B"
  };
}
function blankSurvey(job) {
  return {
    startedAt: "",
    updatedAt: "",
    completedAt: "",
    byName: "",
    gps: null,
    meterSize: "",
    meterAuth: "",
    phase: String(job && job.phase || "1") === "3" ? "3" : "1",
    mainBreaker: "",
    mainCable: "",
    buildingType: "",
    roofType: job && job.roof || "",
    roofCondition: "",
    structureOk: "",
    birdNet: "",
    shadingTags: [],
    shadingNote: "",
    mdbBrand: "",
    mdbSpace: "",
    mdbLoc: "",
    mdbSafety: "",
    mdbRccb: "",
    inverterLoc: "",
    cableDc: "",
    cableAc: "",
    cableCt: "",
    cableGnd: "",
    sizeKw: job && job.kw ? String(job.kw) : "",
    invModel: "",
    panelModel: "",
    monitoring: "",
    meterCt: "",
    specials: [],
    note: "",
    photos: {}
  };
}
function useSurveyPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setPhotos({});
      return;
    }
    const ref = window.FBDB.ref("surveyPhotos/" + jobId);
    const h = ref.on("value", s => {
      const v = s.val();
      setPhotos(v && typeof v === "object" ? v : {});
    });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user, extra) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).update(Object.assign({
      slot,
      dataUrl,
      by: user && user.id || null,
      byName: user && user.name || "-",
      at: new Date().toISOString()
    }, extra || {}));
  }, [jobId]);
  const patchPhoto = React.useCallback((slot, fields) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).update(fields);
  }, [jobId]);
  const removePhoto = React.useCallback(slot => {
    if (jobId && window.FBDB) window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return {
    photos,
    setPhoto,
    patchPhoto,
    removePhoto
  };
}
function sortedShots(photos) {
  const fixed = SURVEY_PHOTO_SLOTS.map(s => s.key);
  return Object.keys(photos || {}).filter(k => photos[k] && photos[k].dataUrl).map(k => Object.assign({
    key: k
  }, photos[k])).sort((a, b) => {
    const oa = a.order == null ? fixed.indexOf(a.key) >= 0 ? fixed.indexOf(a.key) : 900 : a.order;
    const ob = b.order == null ? fixed.indexOf(b.key) >= 0 ? fixed.indexOf(b.key) : 900 : b.order;
    return oa - ob || String(a.key).localeCompare(String(b.key));
  });
}
function shotTitle(shot) {
  if (shot.title) return shot.title;
  const s = SURVEY_SLOT_BY[shot.key];
  return s ? s.label : "รูปเพิ่มเติม";
}
const ANN_COLORS = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#0EA5E9", "#FFFFFF"];
function useBoxSize(ref, fallbackW, fallbackH) {
  const [sz, setSz] = React.useState(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 4 && r.height > 4) setSz({
        w: r.width,
        h: r.height
      });
    };
    read();
    const t = setTimeout(read, 120);
    window.addEventListener("resize", read);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", read);
    };
  }, [ref]);
  return sz || {
    w: fallbackW || 1000,
    h: fallbackH || 750
  };
}
function AnnOverlay({
  ann,
  aw,
  ah,
  edit
}) {
  const ref = React.useRef(null);
  const box = useBoxSize(ref, aw, ah);
  const list = ann || [];
  const W = box.w,
    H = box.h;
  const unit = Math.max(W, H) / 100;
  return React.createElement("svg", {
    ref: ref,
    viewBox: "0 0 " + W + " " + H,
    preserveAspectRatio: "none",
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none"
    }
  }, list.map((a, i) => {
    if (a.t === "i") {
      const w = (a.w || 0.35) * W,
        hh = w * (a.r || 0.75);
      return React.createElement("g", {
        key: i
      }, React.createElement("image", {
        href: a.src,
        x: a.x * W,
        y: a.y * H,
        width: w,
        height: hh,
        preserveAspectRatio: "none"
      }), React.createElement("rect", {
        x: a.x * W,
        y: a.y * H,
        width: w,
        height: hh,
        fill: "none",
        stroke: a.c || "#FFFFFF",
        strokeWidth: unit * 0.5,
        rx: unit * 0.8
      }), edit && React.createElement("circle", {
        cx: a.x * W + w,
        cy: a.y * H + hh,
        r: unit * 1.6,
        fill: "#fff",
        stroke: "var(--primary)",
        strokeWidth: unit * 0.5
      }));
    }
    if (a.t === "a") {
      const x1 = a.x1 * W,
        y1 = a.y1 * H,
        x2 = a.x2 * W,
        y2 = a.y2 * H;
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const lw = unit * 1.15;
      const head = lw * 3.4;
      const halfW = head * 0.46;
      const bx = x2 - head * Math.cos(ang),
        by = y2 - head * Math.sin(ang);
      const nx = -Math.sin(ang),
        ny = Math.cos(ang);
      const pts = [x2 + "," + y2, bx + halfW * nx + "," + (by + halfW * ny), bx - halfW * nx + "," + (by - halfW * ny)].join(" ");
      return React.createElement("g", {
        key: i
      }, React.createElement("line", {
        x1: x1,
        y1: y1,
        x2: bx,
        y2: by,
        stroke: a.c,
        strokeWidth: lw,
        strokeLinecap: "round"
      }), React.createElement("polygon", {
        points: pts,
        fill: a.c,
        strokeLinejoin: "round",
        stroke: a.c,
        strokeWidth: lw * 0.35
      }));
    }
    const fs = (a.s || 0.055) * W;
    return React.createElement("text", {
      key: i,
      x: a.x * W,
      y: a.y * H,
      fill: a.c,
      fontSize: fs,
      fontWeight: "800",
      stroke: "rgba(0,0,0,.55)",
      strokeWidth: fs * 0.16,
      paintOrder: "stroke",
      style: {
        fontFamily: "var(--sans)"
      },
      dominantBaseline: "middle"
    }, a.v);
  }));
}
const ANN_TOOLS = [{
  key: "a",
  th: "ลูกศร",
  glyph: "↗",
  hint: "ลากจากจุดที่ต้องการชี้ ไปยังปลายลูกศร"
}, {
  key: "t",
  th: "ข้อความ",
  glyph: "ก",
  hint: "แตะตำแหน่งบนรูป แล้วพิมพ์ข้อความได้เลย"
}, {
  key: "i",
  th: "แปะรูป",
  glyph: "🖼",
  hint: "ก๊อปรูป/ภาพตัดมา แล้วกดแปะ (หรือ Ctrl+V) แล้วลากวางได้"
}, {
  key: "m",
  th: "ย้าย",
  glyph: "✥",
  hint: "ลากรูปที่แปะไว้เพื่อย้าย · ลากมุมขวาล่างเพื่อย่อ-ขยาย"
}];
function AnnEditor({
  shot,
  onSave,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [tool, setTool] = React.useState("a");
  const [color, setColor] = React.useState("#EF4444");
  const [ann, setAnn] = React.useState(() => (shot.ann || []).slice());
  const [drag, setDrag] = React.useState(null);
  const [grab, setGrab] = React.useState(null);
  const [txt, setTxt] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const boxRef = React.useRef(null);
  const txtRef = React.useRef(null);
  const W = shot.aw || 1000,
    H = shot.ah || 750;
  const curTool = ANN_TOOLS.find(t => t.key === tool) || ANN_TOOLS[0];
  React.useEffect(() => {
    if (txt && txtRef.current) txtRef.current.focus();
  }, [txt && txt.at]);
  const pt = e => {
    const r = boxRef.current.getBoundingClientRect();
    const t = e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0] || e;
    return {
      x: Math.min(1, Math.max(0, (t.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (t.clientY - r.top) / r.height)),
      ar: r.width / r.height
    };
  };
  const hitImage = p => {
    for (let i = ann.length - 1; i >= 0; i--) {
      const a = ann[i];
      if (a.t !== "i") continue;
      const w = a.w || 0.35;
      const hh = w * (a.r || 0.75) * p.ar;
      if (p.x >= a.x && p.x <= a.x + w && p.y >= a.y && p.y <= a.y + hh) {
        const corner = p.x > a.x + w - 0.06 && p.y > a.y + hh - 0.06 * p.ar;
        return {
          i: i,
          mode: corner ? "size" : "move",
          dx: p.x - a.x,
          dy: p.y - a.y
        };
      }
    }
    return null;
  };
  const down = e => {
    if (txt) return;
    const p = pt(e);
    if (tool === "t") {
      setTxt({
        x: p.x,
        y: p.y,
        v: "",
        at: Date.now()
      });
      return;
    }
    if (tool === "m" || tool === "i") {
      const hit = hitImage(p);
      if (hit) {
        e.preventDefault();
        setGrab(hit);
      }
      return;
    }
    e.preventDefault();
    setDrag({
      t: "a",
      x1: p.x,
      y1: p.y,
      x2: p.x,
      y2: p.y,
      c: color
    });
  };
  const move = e => {
    if (grab) {
      e.preventDefault();
      const p = pt(e);
      setAnn(list => list.map((a, j) => {
        if (j !== grab.i) return a;
        if (grab.mode === "size") return Object.assign({}, a, {
          w: Math.min(1, Math.max(0.06, p.x - a.x))
        });
        return Object.assign({}, a, {
          x: Math.max(0, Math.min(1 - (a.w || 0.35), p.x - grab.dx)),
          y: Math.max(0, Math.min(1, p.y - grab.dy))
        });
      }));
      return;
    }
    if (!drag) return;
    e.preventDefault();
    const p = pt(e);
    setDrag(d => Object.assign({}, d, {
      x2: p.x,
      y2: p.y
    }));
  };
  const up = () => {
    if (grab) {
      setGrab(null);
      return;
    }
    if (!drag) return;
    const far = Math.abs(drag.x2 - drag.x1) > 0.03 || Math.abs(drag.y2 - drag.y1) > 0.03;
    if (far) setAnn(a => a.concat([drag]));
    setDrag(null);
  };
  const commitText = () => {
    const v = (txt.v || "").trim();
    if (v) setAnn(a => a.concat([{
      t: "t",
      x: txt.x,
      y: txt.y,
      v: v,
      c: color,
      s: 0.055
    }]));
    setTxt(null);
  };
  const addImage = async file => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, 900, 0.8);
      const dim = await new Promise(res => {
        const im = new Image();
        im.onload = () => res({
          w: im.naturalWidth,
          h: im.naturalHeight
        });
        im.onerror = () => res({
          w: 4,
          h: 3
        });
        im.src = dataUrl;
      });
      setAnn(a => a.concat([{
        t: "i",
        src: dataUrl,
        x: 0.28,
        y: 0.28,
        w: 0.4,
        r: dim.h / dim.w,
        c: color
      }]));
      setTool("m");
    } catch (err) {
      alert("แปะรูปไม่สำเร็จ: " + err.message);
    }
    setBusy(false);
  };
  const pasteImage = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) throw new Error("เบราว์เซอร์นี้อ่านคลิปบอร์ดไม่ได้ ลองกด Ctrl+V แทน");
      const list = await navigator.clipboard.read();
      for (const it of list) {
        const type = it.types.find(t => t.indexOf("image/") === 0);
        if (!type) continue;
        addImage(new File([await it.getType(type)], "paste.png", {
          type: type
        }));
        return;
      }
      alert("ในคลิปบอร์ดไม่มีรูปภาพ — ก๊อปรูปมาก่อนแล้วค่อยกดแปะ");
    } catch (err) {
      alert("แปะรูปไม่สำเร็จ: " + err.message);
    }
  };
  React.useEffect(() => {
    const onPaste = e => {
      const items = e.clipboardData && e.clipboardData.items || [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind !== "file" || items[i].type.indexOf("image/") !== 0) continue;
        const f = items[i].getAsFile();
        if (f) {
          e.preventDefault();
          addImage(f);
        }
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);
  const ghost = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    padding: "0 14px",
    borderRadius: 10,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    color: "var(--text-2)",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer"
  };
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.62)",
      backdropFilter: "blur(3px)",
      zIndex: 130,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }, React.createElement("div", {
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 20,
      width: isMobile ? "100%" : "min(880px,100%)",
      maxHeight: isMobile ? "96dvh" : "94vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 90px rgba(8,20,14,.4)"
    }
  }, React.createElement("div", {
    style: {
      padding: "13px 16px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "var(--text-1)",
      letterSpacing: "-.01em"
    }
  }, "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1A\u0E19\u0E23\u0E39\u0E1B"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, curTool.hint)), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
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
    size: 16
  }))), React.createElement("div", {
    style: {
      flex: 1,
      overflow: "auto",
      padding: 14,
      background: "var(--surface2)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement("div", {
    style: {
      position: "relative",
      maxWidth: "100%"
    }
  }, React.createElement("div", {
    ref: boxRef,
    onMouseDown: down,
    onMouseMove: move,
    onMouseUp: up,
    onMouseLeave: up,
    onTouchStart: down,
    onTouchMove: move,
    onTouchEnd: up,
    style: {
      position: "relative",
      touchAction: "none",
      userSelect: "none",
      lineHeight: 0,
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow: "0 6px 24px rgba(8,20,14,.14)",
      cursor: tool === "m" ? "move" : tool === "t" ? "text" : "crosshair"
    }
  }, React.createElement("img", {
    src: shot.dataUrl,
    alt: "",
    draggable: false,
    style: {
      display: "block",
      maxWidth: "100%",
      maxHeight: isMobile ? "52dvh" : "58vh",
      width: "auto"
    }
  }), React.createElement(AnnOverlay, {
    ann: drag ? ann.concat([drag]) : ann,
    aw: W,
    ah: H,
    edit: tool === "m" || tool === "i"
  })), txt && React.createElement("div", {
    style: {
      position: "absolute",
      left: txt.x * 100 + "%",
      top: txt.y * 100 + "%",
      transform: "translate(-6px,-50%)",
      zIndex: 3,
      display: "flex",
      gap: 6,
      alignItems: "center",
      background: "var(--surface)",
      border: "1px solid var(--primary)",
      borderRadius: 10,
      padding: 5,
      boxShadow: "0 8px 24px rgba(8,20,14,.25)"
    }
  }, React.createElement("input", {
    ref: txtRef,
    value: txt.v,
    onChange: e => setTxt(Object.assign({}, txt, {
      v: e.target.value
    })),
    onKeyDown: e => {
      if (e.key === "Enter") commitText();
      if (e.key === "Escape") setTxt(null);
    },
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u2026",
    style: {
      width: 168,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "inherit",
      fontSize: 13,
      color: "var(--text-1)"
    }
  }), React.createElement("button", {
    onClick: commitText,
    style: {
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      borderRadius: 8,
      height: 28,
      padding: "0 11px",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E43\u0E2A\u0E48"), React.createElement("button", {
    onClick: () => setTxt(null),
    style: {
      border: "none",
      background: "var(--surface3)",
      color: "var(--text-2)",
      borderRadius: 8,
      width: 28,
      height: 28,
      cursor: "pointer"
    }
  }, "\u2715")))), React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "inline-flex",
      background: "var(--surface3)",
      borderRadius: 11,
      padding: 3,
      gap: 2
    }
  }, ANN_TOOLS.map(t => {
    const on = t.key === tool;
    return React.createElement("button", {
      key: t.key,
      onClick: () => {
        setTool(t.key);
        if (t.key === "i") pasteImage();
      },
      title: t.hint,
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 32,
        padding: "0 11px",
        borderRadius: 9,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 700,
        whiteSpace: "nowrap",
        background: on ? "var(--surface)" : "transparent",
        color: on ? "var(--primary-dark)" : "var(--text-2)",
        boxShadow: on ? "0 1px 3px rgba(0,0,0,.1)" : "none",
        transition: "all .15s"
      }
    }, React.createElement("span", {
      style: {
        fontSize: 13
      }
    }, t.glyph), !isMobile && t.th);
  })), React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 5
    }
  }, ANN_COLORS.map(c => React.createElement("button", {
    key: c,
    onClick: () => setColor(c),
    "aria-label": "สี " + c,
    style: {
      width: 26,
      height: 26,
      borderRadius: 99,
      cursor: "pointer",
      background: c,
      transition: "transform .12s",
      transform: color === c ? "scale(1.14)" : "none",
      border: color === c ? "2.5px solid var(--primary-dark)" : "1px solid rgba(0,0,0,.18)"
    }
  }))), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    onClick: () => setAnn(a => a.slice(0, -1)),
    disabled: !ann.length || busy,
    style: Object.assign({}, ghost, {
      opacity: ann.length ? 1 : .4
    })
  }, "\u21B6 \u0E40\u0E25\u0E34\u0E01\u0E17\u0E33"), React.createElement("button", {
    onClick: () => setAnn([]),
    disabled: !ann.length,
    style: Object.assign({}, ghost, {
      opacity: ann.length ? 1 : .4
    })
  }, "\u0E25\u0E49\u0E32\u0E07")), React.createElement("div", {
    style: {
      padding: "12px 14px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 10
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "12px 18px",
      borderRadius: 12,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: () => onSave(ann),
    style: {
      flex: 1,
      padding: 12,
      borderRadius: 12,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(34,163,91,.3)"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E35\u0E48\u0E40\u0E02\u0E35\u0E22\u0E19"))));
}
function SurveyBlock({
  title,
  sub,
  children
}) {
  const m = /^(\S+)\s+([\s\S]+)$/.exec(String(title || ""));
  const glyph = m && !/[ก-๙A-Za-z0-9]/.test(m[1]) ? m[1] : "";
  const head = glyph ? m[2] : title;
  return React.createElement("section", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "15px 16px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      boxShadow: "0 1px 2px rgba(8,20,14,.04)"
    }
  }, React.createElement("header", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, glyph && React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 10,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--primary-soft)",
      fontSize: 15,
      lineHeight: 1
    }
  }, glyph), React.createElement("span", {
    style: {
      minWidth: 0,
      paddingTop: glyph ? 2 : 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)",
      letterSpacing: "-.005em"
    }
  }, head), sub && React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2,
      lineHeight: 1.45
    }
  }, sub))), children);
}
function SurveyToggle({
  label,
  hint,
  value,
  onChange,
  options
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "9px 12px",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 11
    }
  }, React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--text-1)",
      lineHeight: 1.35
    }
  }, label), hint && React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 1
    }
  }, hint)), React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, React.createElement(Segmented, {
    value: value,
    onChange: onChange,
    options: options
  })));
}
function SurveyShotCard({
  shot,
  slot,
  n,
  busy,
  onPick,
  onRemove,
  onAnn,
  onField,
  onMove,
  first,
  last
}) {
  const inputRef = React.useRef(null);
  const has = !!(shot && shot.dataUrl);
  const req = !!slot;
  const mini = {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid var(--border-strong)",
    background: "var(--surface)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    color: "var(--text-2)",
    fontSize: 13,
    fontWeight: 800,
    flexShrink: 0
  };
  return React.createElement("div", {
    style: {
      border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"),
      borderRadius: 13,
      padding: 11,
      borderLeft: "3px solid " + (has ? "var(--primary)" : "var(--surface3)"),
      background: has ? "var(--surface)" : "var(--surface2)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      transition: "border-color .2s"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 11,
      alignItems: "center"
    }
  }, has ? React.createElement("span", {
    style: {
      position: "relative",
      flexShrink: 0,
      lineHeight: 0
    }
  }, React.createElement("img", {
    src: shot.dataUrl,
    alt: "",
    onClick: () => onAnn && onAnn(),
    style: {
      width: 54,
      height: 54,
      borderRadius: 10,
      objectFit: "cover",
      cursor: "pointer",
      border: "1px solid var(--border)"
    }
  }), React.createElement("span", {
    style: {
      position: "absolute",
      top: -5,
      left: -5,
      width: 20,
      height: 20,
      borderRadius: 99,
      display: "grid",
      placeItems: "center",
      background: "var(--primary)",
      color: "#fff",
      fontSize: 10.5,
      fontWeight: 800,
      fontFamily: "var(--mono)",
      border: "2px solid var(--surface)"
    }
  }, n || "✓")) : React.createElement("span", {
    style: {
      width: 54,
      height: 54,
      borderRadius: 10,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: "var(--surface3)",
      border: "1px dashed var(--border-strong)"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 17,
    color: "var(--text-3)"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, req ? slot.label : shot && shot.title || "รูปเพิ่มเติม", req && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, req ? slot.hint : "ตั้งชื่อหัวข้อและคำบรรยายได้ด้านล่าง")), React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) onPick(f);
      e.target.value = "";
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => inputRef.current && inputRef.current.click(),
    disabled: busy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "7px 11px",
      borderRadius: 9,
      border: "none",
      background: has ? "var(--surface3)" : "var(--primary)",
      color: has ? "var(--text-2)" : "#fff",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: busy ? "default" : "pointer",
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "image",
    size: 13,
    color: has ? "var(--text-2)" : "#fff"
  }), busy ? "..." : has ? "ถ่ายใหม่" : "ถ่าย/อัปโหลด"), has && React.createElement("button", {
    type: "button",
    onClick: onRemove,
    title: "\u0E25\u0E1A\u0E23\u0E39\u0E1B",
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      border: "none",
      background: "#EF444414",
      color: "#EF4444",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 13
  })))), has && React.createElement(React.Fragment, null, React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("button", {
    type: "button",
    onClick: onAnn,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid " + (shot.ann && shot.ann.length ? "var(--primary)" : "var(--border-strong)"),
      background: shot.ann && shot.ann.length ? "var(--primary-soft)" : "var(--surface)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u2197 \u0E40\u0E02\u0E35\u0E22\u0E19 / \u0E41\u0E1B\u0E30\u0E23\u0E39\u0E1B\u0E17\u0E31\u0E1A", shot.ann && shot.ann.length ? React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 10.5,
      background: "var(--primary)",
      color: "#fff",
      borderRadius: 99,
      padding: "1px 6px"
    }
  }, shot.ann.length) : null), onMove && React.createElement(React.Fragment, null, React.createElement("button", {
    type: "button",
    onClick: () => onMove(-1),
    disabled: first,
    title: "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E02\u0E36\u0E49\u0E19",
    style: Object.assign({}, mini, {
      opacity: first ? .35 : 1
    })
  }, "\u2191"), React.createElement("button", {
    type: "button",
    onClick: () => onMove(1),
    disabled: last,
    title: "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E25\u0E07",
    style: Object.assign({}, mini, {
      opacity: last ? .35 : 1
    })
  }, "\u2193"))), !req && React.createElement(React.Fragment, null, React.createElement("input", {
    value: shot.title || "",
    onChange: e => onField("title", e.target.value),
    placeholder: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E23\u0E39\u0E1B \u0E40\u0E0A\u0E48\u0E19 \u0E20\u0E32\u0E1E\u0E08\u0E32\u0E01\u0E42\u0E14\u0E23\u0E19 \u0E1A\u0E34\u0E19\u0E40\u0E09\u0E35\u0E22\u0E07\u0E14\u0E49\u0E32\u0E19\u0E0B\u0E49\u0E32\u0E22",
    style: Object.assign({}, inputStyle, {
      fontSize: 13
    })
  }), React.createElement(Dropdown, {
    value: shot.cat || "",
    onChange: v => onField("cat", v),
    placeholder: "\u2014 \u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E23\u0E39\u0E1B (\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E01\u0E47\u0E44\u0E14\u0E49) \u2014",
    options: SURVEY_PHOTO_CATS.concat(shot.cat && SURVEY_PHOTO_CATS.indexOf(shot.cat) < 0 ? [shot.cat] : []).map(c => ({
      value: c,
      label: c
    })),
    wrap: true,
    addable: true,
    onAdd: () => {}
  })), React.createElement("input", {
    value: shot.caption || "",
    onChange: e => onField("caption", e.target.value),
    placeholder: "\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E43\u0E15\u0E49\u0E23\u0E39\u0E1B (\u0E44\u0E21\u0E48\u0E43\u0E2A\u0E48\u0E01\u0E47\u0E44\u0E14\u0E49)",
    style: Object.assign({}, inputStyle, {
      fontSize: 13
    })
  })));
}
const SURVEY_STEPS = [{
  n: 1,
  icon: "pin",
  th: "เช็คอิน & มิเตอร์"
}, {
  n: 2,
  icon: "box",
  th: "หลังคา"
}, {
  n: 3,
  icon: "bolt",
  th: "ไฟฟ้า & ตำแหน่ง"
}, {
  n: 4,
  icon: "file",
  th: "อุปกรณ์ & หมายเหตุ"
}, {
  n: 5,
  icon: "image",
  th: "รูปถ่าย"
}];
function SurveyWizard({
  job,
  onClose,
  onSave,
  onReport,
  currentUser,
  stock
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const [annKey, setAnnKey] = React.useState(null);
  const media = useSurveyPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => Object.assign(blankSurvey(job), job && job.survey || {}));
  const set = (k, v) => setF(p => Object.assign({}, p, {
    [k]: v
  }));
  const toggleTag = t => setF(p => {
    const cur = p.shadingTags || [];
    return Object.assign({}, p, {
      shadingTags: cur.includes(t) ? cur.filter(x => x !== t) : cur.concat([t])
    });
  });
  const stockItems = stock && stock.items || [];
  const modelOptions = (mainCat, cur) => {
    const SF = window.SF;
    const out = [];
    stockItems.forEach(s => {
      if (!s.name || !SF || SF.mainCatOf(s.cat) !== mainCat) return;
      const c = SF.STOCK_CAT_BY[s.cat];
      out.push({
        value: s.name,
        label: s.name,
        group: c && c.parent ? c.th : "อื่นๆ",
        sub: [s.brand, s.model].filter(Boolean).join(" · ")
      });
    });
    out.sort((a, b) => (a.group || "").localeCompare(b.group || "", "th") || a.label.localeCompare(b.label, "th"));
    const v = (cur || "").trim();
    if (v && !out.some(o => o.value === v)) out.push({
      value: v,
      label: v,
      group: "พิมพ์เอง"
    });
    return out;
  };
  const invOptions = React.useMemo(() => modelOptions("inverter", f.invModel), [stockItems, f.invModel]);
  const panelOptions = React.useMemo(() => modelOptions("panel", f.panelModel), [stockItems, f.panelModel]);
  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsErr("อุปกรณ์ไม่รองรับ GPS");
      return;
    }
    setGpsBusy(true);
    setGpsErr("");
    navigator.geolocation.getCurrentPosition(pos => {
      set("gps", {
        lat: +pos.coords.latitude.toFixed(6),
        lng: +pos.coords.longitude.toFixed(6),
        acc: Math.round(pos.coords.accuracy || 0),
        at: new Date().toISOString()
      });
      setGpsBusy(false);
    }, err => {
      setGpsErr(err.code === 1 ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" : "จับพิกัดไม่สำเร็จ ลองใหม่อีกครั้ง");
      setGpsBusy(false);
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  };
  const pickPhoto = async (slotKey, file, order) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      const dataUrl = await resizeImageFile(file, 1400, 0.74);
      const dim = await new Promise(res => {
        const im = new Image();
        im.onload = () => res({
          aw: im.naturalWidth,
          ah: im.naturalHeight
        });
        im.onerror = () => res({});
        im.src = dataUrl;
      });
      const extra = Object.assign({
        ann: null
      }, dim);
      if (order != null) extra.order = order;
      media.setPhoto(slotKey, dataUrl, currentUser, extra);
    } catch (err) {
      alert("เพิ่มรูปไม่สำเร็จ: " + err.message);
    }
    setBusySlot(null);
  };
  const shots = sortedShots(media.photos);
  const extras = shots.filter(s => isExtraShot(s.key));
  const addShot = file => {
    const key = "x_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const maxOrder = shots.reduce((m, s) => Math.max(m, s.order == null ? 0 : s.order), SURVEY_PHOTO_SLOTS.length);
    pickPhoto(key, file, maxOrder + 1);
  };
  React.useEffect(() => {
    if (step !== 5 || annKey) return;
    const onPaste = e => {
      const items = e.clipboardData && e.clipboardData.items || [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind !== "file" || items[i].type.indexOf("image/") !== 0) continue;
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          addShot(file);
        }
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [step, annKey, shots.length]);
  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) throw new Error("เบราว์เซอร์นี้อ่านคลิปบอร์ดไม่ได้ ลองกด Ctrl+V แทน");
      const list = await navigator.clipboard.read();
      for (const it of list) {
        const type = it.types.find(t => t.indexOf("image/") === 0);
        if (!type) continue;
        const blob = await it.getType(type);
        addShot(new File([blob], "paste.png", {
          type: type
        }));
        return;
      }
      alert("ในคลิปบอร์ดไม่มีรูปภาพ — ก๊อปรูปมาก่อนแล้วค่อยกดวาง");
    } catch (err) {
      alert("วางภาพไม่สำเร็จ: " + err.message);
    }
  };
  const moveShot = (key, dir) => {
    const arr = shots.slice();
    const i = arr.findIndex(s => s.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    arr.forEach((s, k) => media.patchPhoto(s.key, {
      order: k
    }));
  };
  function photoFlags() {
    const m = {};
    SURVEY_PHOTO_SLOTS.forEach(p => {
      if (media.photos[p.key]) m[p.key] = true;
    });
    return m;
  }
  const st = surveyStatus(Object.assign({}, job, {
    survey: Object.assign({}, f, {
      photos: photoFlags()
    })
  }));
  const save = thenReport => {
    const now = new Date().toISOString();
    const photos = photoFlags();
    const complete = surveyStatus(Object.assign({}, job, {
      survey: Object.assign({}, f, {
        startedAt: f.startedAt || now,
        photos
      })
    })).state === "done";
    const out = Object.assign({}, f, {
      photos,
      specials: (f.specials || []).filter(x => String(x || "").trim()),
      startedAt: f.startedAt || now,
      updatedAt: now,
      completedAt: complete ? f.completedAt || now : "",
      byName: currentUser && currentUser.name || f.byName || ""
    });
    if (onSave) onSave(out, thenReport === true);
  };
  const labelStyle = {
    fontSize: 11.5,
    fontWeight: 600,
    color: "var(--text-3)",
    lineHeight: 1.3
  };
  const fld = (label, child, req) => React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, React.createElement("label", {
    style: labelStyle
  }, label, req && React.createElement("span", {
    style: {
      color: "#EF4444"
    }
  }, " *")), child);
  const numStyle = Object.assign({}, inputStyle, {
    textAlign: "left"
  });
  const two = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 11
  };
  return React.createElement(React.Fragment, null, React.createElement("div", _extends({}, bdClose, {
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
      width: isMobile ? "100%" : "min(680px,100%)",
      maxHeight: isMobile ? "96dvh" : "94vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "15px 18px 13px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12
    }
  }, React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 11,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--primary-dark)",
      background: "var(--primary-soft)",
      padding: "2px 7px",
      borderRadius: 6
    }
  }, job ? job.code : ""), "\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"), React.createElement("h2", {
    style: {
      fontSize: 17.5,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: "4px 0 0",
      letterSpacing: "-.015em",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontFamily: "var(--display)"
    }
  }, job ? job.name : "")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      position: "relative",
      width: 38,
      height: 38,
      borderRadius: 99,
      display: "grid",
      placeItems: "center",
      background: "conic-gradient(" + st.color + " " + st.pct * 3.6 + "deg, var(--surface3) 0deg)"
    }
  }, React.createElement("span", {
    style: {
      position: "absolute",
      inset: 3.5,
      borderRadius: 99,
      background: "var(--surface)"
    }
  }), React.createElement("span", {
    style: {
      position: "relative",
      fontSize: 10.5,
      fontWeight: 800,
      color: st.color,
      fontFamily: "var(--mono)"
    }
  }, st.pct)), React.createElement("button", {
    onClick: onClose,
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
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
  })))), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 2,
      marginTop: 14
    }
  }, SURVEY_STEPS.map((s, i) => {
    const active = s.n === step,
      done = s.n < step;
    return React.createElement(React.Fragment, {
      key: s.n
    }, i > 0 && React.createElement("span", {
      style: {
        flex: 1,
        height: 2,
        borderRadius: 99,
        background: done || active ? "var(--primary)" : "var(--surface3)",
        transition: "background .2s"
      }
    }), React.createElement("button", {
      onClick: () => setStep(s.n),
      title: s.th,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: active ? "var(--primary-soft)" : "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: active && !isMobile ? "4px 11px 4px 4px" : 4,
        borderRadius: 99,
        flexShrink: 0
      }
    }, React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: 99,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        fontSize: 11.5,
        fontWeight: 800,
        fontFamily: "var(--mono)",
        transition: "all .2s",
        background: done ? "var(--primary)" : active ? "var(--primary)" : "var(--surface3)",
        color: done || active ? "#fff" : "var(--text-3)",
        boxShadow: active ? "0 0 0 3px var(--primary-soft)" : "none"
      }
    }, done ? React.createElement(Icon, {
      name: "check",
      size: 13,
      color: "#fff",
      sw: 2.8
    }) : s.n), active && !isMobile && React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "var(--primary-dark)",
        whiteSpace: "nowrap"
      }
    }, s.th)));
  })), isMobile && React.createElement("div", {
    style: {
      marginTop: 7,
      fontSize: 12,
      fontWeight: 700,
      color: "var(--primary-dark)"
    }
  }, (SURVEY_STEPS[step - 1] || {}).th)), React.createElement("div", {
    style: {
      overflowY: "auto",
      flex: 1,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 13,
      background: "var(--surface2)"
    }
  }, step === 1 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDCCD \u0E40\u0E0A\u0E47\u0E04\u0E2D\u0E34\u0E19 \u2014 \u0E1E\u0E34\u0E01\u0E31\u0E14 GPS",
    sub: "\u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19"
  }, React.createElement("button", {
    type: "button",
    onClick: captureGps,
    disabled: gpsBusy,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "11px 14px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: gpsBusy ? "default" : "pointer"
    }
  }, React.createElement(Icon, {
    name: "pin",
    size: 16,
    color: "#fff"
  }), gpsBusy ? "กำลังจับพิกัด..." : f.gps ? "จับพิกัดใหม่" : "จับพิกัด GPS ปัจจุบัน"), gpsErr && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      fontWeight: 600
    }
  }, "\u26A0 ", gpsErr), f.gps && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      padding: "10px 12px",
      background: "var(--surface2)",
      borderRadius: 10,
      border: "1px solid var(--border)"
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 12.5,
      color: "var(--text-1)"
    }
  }, f.gps.lat, ", ", f.gps.lng, f.gps.acc ? React.createElement("span", {
    style: {
      color: "var(--text-3)"
    }
  }, " \xB7 \xB1", f.gps.acc, "m") : null), React.createElement("a", {
    href: "https://www.google.com/maps?q=" + f.gps.lat + "," + f.gps.lng,
    target: "_blank",
    rel: "noreferrer",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      color: "var(--primary-dark)",
      fontSize: 12,
      fontWeight: 700,
      textDecoration: "none",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 13,
    color: "var(--primary-dark)"
  }), " \u0E14\u0E39\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48"))), React.createElement(SurveyBlock, {
    title: "\u26A1 \u0E21\u0E34\u0E40\u0E15\u0E2D\u0E23\u0E4C & \u0E40\u0E21\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E14\u0E34\u0E21"
  }, React.createElement("div", {
    style: two
  }, fld("ขนาดมิเตอร์ไฟฟ้า", React.createElement("input", {
    value: f.meterSize,
    onChange: e => set("meterSize", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 15(45)A",
    style: inputStyle
  }), true), fld("การไฟฟ้า", React.createElement(Dropdown, {
    value: f.meterAuth,
    onChange: v => set("meterAuth", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014",
    options: SURVEY_METER_AUTH
  }))), React.createElement(SurveyToggle, {
    label: "\u0E23\u0E30\u0E1A\u0E1A\u0E44\u0E1F\u0E1F\u0E49\u0E32",
    hint: "\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38",
    value: f.phase,
    onChange: v => set("phase", v),
    options: [{
      value: "1",
      label: "1 เฟส"
    }, {
      value: "3",
      label: "3 เฟส"
    }]
  }), fld("สายเมนเดิม", React.createElement("input", {
    value: f.mainCable,
    onChange: e => set("mainCable", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 NYY 50 sq.mm",
    style: inputStyle
  })))), step === 2 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83C\uDFE0 \u0E0A\u0E19\u0E34\u0E14 & \u0E2A\u0E20\u0E32\u0E1E\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32"
  }, fld("พื้นที่ที่จะวางแผงโซลาร์", React.createElement(Dropdown, {
    value: f.buildingType,
    onChange: v => set("buildingType", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E2D\u0E32\u0E04\u0E32\u0E23 \u2014",
    options: SURVEY_BUILDING.map(r => ({
      value: r,
      label: r
    }))
  })), fld("ประเภทหลังคา", React.createElement(Dropdown, {
    value: f.roofType,
    onChange: v => set("roofType", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 \u2014",
    options: SURVEY_ROOF_TYPES.map(r => ({
      value: r,
      label: r
    }))
  }), true), fld("สภาพหลังคา", React.createElement(Dropdown, {
    value: f.roofCondition,
    onChange: v => set("roofCondition", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014",
    options: SURVEY_ROOF_COND
  })), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement(SurveyToggle, {
    label: "\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E31\u0E1A\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01",
    value: f.structureOk,
    onChange: v => set("structureOk", v),
    options: SURVEY_PASS
  }), React.createElement(SurveyToggle, {
    label: "\u0E15\u0E32\u0E02\u0E48\u0E32\u0E22\u0E01\u0E31\u0E19\u0E19\u0E01",
    value: f.birdNet,
    onChange: v => set("birdNet", v),
    options: SURVEY_BIRDNET
  }))), React.createElement(SurveyBlock, {
    title: "\uD83C\uDF33 \u0E2A\u0E34\u0E48\u0E07\u0E01\u0E35\u0E14\u0E02\u0E27\u0E32\u0E07 / \u0E40\u0E07\u0E32\u0E1A\u0E31\u0E07",
    sub: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E32\u0E08\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E41\u0E2A\u0E07\u0E41\u0E14\u0E14"
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 7
    }
  }, SURVEY_SHADING_TAGS.map(t => {
    const on = (f.shadingTags || []).includes(t);
    return React.createElement("button", {
      key: t,
      type: "button",
      onClick: () => toggleTag(t),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: 600,
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, on && React.createElement(Icon, {
      name: "check",
      size: 12,
      color: "var(--primary-dark)",
      sw: 2.6
    }), t);
  })), React.createElement("textarea", {
    value: f.shadingNote,
    onChange: e => set("shadingNote", e.target.value),
    placeholder: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 \u0E40\u0E0A\u0E48\u0E19 \u0E15\u0E49\u0E19\u0E44\u0E21\u0E49\u0E2A\u0E39\u0E07 5 \u0E21. \u0E17\u0E32\u0E07\u0E17\u0E34\u0E28\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01 \u0E1A\u0E31\u0E07\u0E0A\u0E48\u0E27\u0E07\u0E1A\u0E48\u0E32\u0E22",
    rows: 2,
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.5
    })
  }))), step === 3 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83D\uDD0C \u0E15\u0E39\u0E49\u0E40\u0E21\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32 (MDB)",
    sub: "\u0E40\u0E1B\u0E34\u0E14\u0E1D\u0E32\u0E15\u0E39\u0E49\u0E41\u0E25\u0E49\u0E27\u0E14\u0E39\u0E02\u0E2D\u0E07\u0E02\u0E49\u0E32\u0E07\u0E43\u0E19\u0E44\u0E1B\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E01\u0E31\u0E19\u0E17\u0E35\u0E40\u0E14\u0E35\u0E22\u0E27"
  }, fld("ยี่ห้อ / รุ่นตู้ MDB", React.createElement("input", {
    value: f.mdbBrand,
    onChange: e => set("mdbBrand", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Schneider, ABB, Haco",
    style: inputStyle
  }), true), fld("ขนาดเมนเบรกเกอร์", React.createElement("input", {
    value: f.mainBreaker,
    onChange: e => set("mainBreaker", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 100A, 3P",
    style: inputStyle
  }), true), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, React.createElement(SurveyToggle, {
    label: "\u0E21\u0E35\u0E40\u0E0B\u0E1F\u0E15\u0E35\u0E49\u0E04\u0E31\u0E15",
    value: f.mdbSafety,
    onChange: v => set("mdbSafety", v),
    options: SURVEY_YESNO
  }), React.createElement(SurveyToggle, {
    label: "\u0E40\u0E21\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E19\u0E34\u0E14\u0E01\u0E31\u0E19\u0E14\u0E39\u0E14",
    hint: "RCD / RCCB",
    value: f.mdbRccb,
    onChange: v => set("mdbRccb", v),
    options: SURVEY_YESNO
  })), fld("ตำแหน่งที่ตั้งตู้ MDB", React.createElement("input", {
    value: f.mdbLoc,
    onChange: e => set("mdbLoc", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E02\u0E49\u0E32\u0E07\u0E1A\u0E31\u0E19\u0E44\u0E14 \u0E0A\u0E31\u0E49\u0E19 1 / \u0E42\u0E23\u0E07\u0E08\u0E2D\u0E14\u0E23\u0E16",
    style: inputStyle
  })), fld("ช่องว่างในตู้", React.createElement(Dropdown, {
    value: f.mdbSpace,
    onChange: v => set("mdbSpace", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014",
    options: SURVEY_MDB_SPACE
  }))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDD0B \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"
  }, fld("ตำแหน่งที่เสนอติดตั้ง", React.createElement(Segmented, {
    value: f.inverterLoc,
    onChange: v => set("inverterLoc", v),
    options: SURVEY_INV_LOC
  }), true)), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCCF \u0E23\u0E30\u0E22\u0E30\u0E40\u0E14\u0E34\u0E19\u0E2A\u0E32\u0E22 (\u0E40\u0E21\u0E15\u0E23)",
    sub: "\u0E27\u0E31\u0E14\u0E17\u0E35\u0E25\u0E30\u0E0A\u0E48\u0E27\u0E07 \u0E0A\u0E48\u0E27\u0E07\u0E44\u0E2B\u0E19\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E47\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E27\u0E49"
  }, React.createElement("div", {
    style: two
  }, SURVEY_CABLE_LEGS.map(l => React.createElement(React.Fragment, {
    key: l.key
  }, fld(l.th, React.createElement("input", {
    type: "number",
    value: f[l.key] || "",
    onChange: e => set(l.key, e.target.value),
    placeholder: "\u0E21.",
    style: numStyle
  }))))), React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 10
    }
  }, React.createElement("span", {
    style: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, "\u0E23\u0E27\u0E21\u0E17\u0E38\u0E01\u0E0A\u0E48\u0E27\u0E07"), React.createElement("span", {
    style: {
      fontFamily: "var(--mono)",
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--primary-dark)"
    }
  }, cableTotal(f), " \u0E21.")))), step === 4 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83E\uDDF0 \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E19\u0E2D",
    sub: "\u0E02\u0E36\u0E49\u0E19\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2B\u0E31\u0E27\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \u2014 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49\u0E16\u0E49\u0E32\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E38\u0E1B"
  }, fld("ขนาดระบบ (kW)", React.createElement("input", {
    value: f.sizeKw,
    onChange: e => set("sizeKw", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 6.7",
    style: inputStyle
  })), fld("Inverter", React.createElement(Dropdown, {
    value: f.invModel,
    onChange: v => set("invModel", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07 \u2014",
    options: invOptions,
    wrap: true,
    addable: true,
    onAdd: () => {}
  })), fld("แผงโซลาร์", React.createElement(Dropdown, {
    value: f.panelModel,
    onChange: v => set("panelModel", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07 \u2014",
    options: panelOptions,
    wrap: true,
    addable: true,
    onAdd: () => {}
  })), fld("Monitoring", React.createElement("input", {
    value: f.monitoring,
    onChange: e => set("monitoring", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Solis S2-WL-ST \u2014 WiFi Stick",
    style: inputStyle
  })), fld("Meter / CT", React.createElement("input", {
    value: f.meterCt,
    onChange: e => set("meterCt", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Solis SDM630MCT V2 5A",
    style: inputStyle
  }))), React.createElement(SurveyBlock, {
    title: "\u26A0\uFE0F \u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E40\u0E28\u0E29",
    sub: "\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E25\u0E39\u0E01\u0E04\u0E49\u0E32\u0E02\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E1E\u0E34\u0E40\u0E28\u0E29 / \u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E41\u0E01\u0E49\u0E40\u0E1E\u0E34\u0E48\u0E21"
  }, (f.specials || []).map((v, i) => React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("input", {
    value: v,
    onChange: e => set("specials", (f.specials || []).map((x, k) => k === i ? e.target.value : x)),
    placeholder: "ข้อ " + (i + 1) + " เช่น เปลี่ยนลูก CB10A ตำแหน่ง 13 เป็น CB30A",
    style: Object.assign({}, inputStyle, {
      flex: 1
    })
  }), React.createElement("button", {
    type: "button",
    onClick: () => set("specials", (f.specials || []).filter((x, k) => k !== i)),
    style: {
      width: 42,
      borderRadius: 10,
      border: "none",
      background: "#EF444414",
      color: "#EF4444",
      cursor: "pointer",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 14
  })))), React.createElement("button", {
    type: "button",
    onClick: () => set("specials", (f.specials || []).concat([""])),
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 13px",
      borderRadius: 10,
      border: "1px dashed var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--text-2)"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E49\u0E2D")), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCDD \u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
    sub: "\u0E02\u0E36\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E17\u0E49\u0E32\u0E22\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01\u0E02\u0E2D\u0E07\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"
  }, React.createElement("textarea", {
    value: f.note,
    onChange: e => set("note", e.target.value),
    rows: 4,
    placeholder: "เช่น\nPV 2STRING 25m. x2\nMAIN MCB100A x1 + ATS100 + ตู้ No.2",
    style: Object.assign({}, inputStyle, {
      resize: "vertical",
      lineHeight: 1.6
    })
  }))), step === 5 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "📷 รูปถ่ายบังคับ (" + SURVEY_PHOTO_SLOTS.length + " รูป)",
    sub: "\u0E16\u0E48\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C \xB7 \u0E41\u0E15\u0E30\u0E23\u0E39\u0E1B\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E02\u0E35\u0E22\u0E19\u0E25\u0E39\u0E01\u0E28\u0E23 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 \u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E1B\u0E30\u0E23\u0E39\u0E1B\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E17\u0E31\u0E1A"
  }, !window.FBDB && React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#EF4444",
      background: "var(--tint-red-bg)",
      border: "1px solid var(--tint-red-bd)",
      borderRadius: 9,
      padding: "9px 11px"
    }
  }, "\u26A0 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Firebase \u0E08\u0E36\u0E07\u0E08\u0E30\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E44\u0E14\u0E49"), React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, SURVEY_PHOTO_SLOTS.map(slot => {
    const shot = media.photos[slot.key] ? Object.assign({
      key: slot.key
    }, media.photos[slot.key]) : null;
    const idx = shots.findIndex(s => s.key === slot.key);
    return React.createElement(SurveyShotCard, {
      key: slot.key,
      slot: slot,
      shot: shot,
      busy: busySlot === slot.key,
      n: idx >= 0 ? idx + 1 : null,
      onPick: file => pickPhoto(slot.key, file),
      onRemove: () => {
        if (confirm("ลบรูปนี้?")) media.removePhoto(slot.key);
      },
      onAnn: () => setAnnKey(slot.key),
      onField: (k, v) => media.patchPhoto(slot.key, {
        [k]: v
      }),
      onMove: shot ? d => moveShot(slot.key, d) : null,
      first: idx <= 0,
      last: idx === shots.length - 1
    });
  }))), React.createElement(SurveyBlock, {
    title: "🖼️ รูปเพิ่มเติม (" + extras.length + " รูป)",
    sub: "\u0E16\u0E48\u0E32\u0E22\u0E01\u0E35\u0E48\u0E23\u0E39\u0E1B\u0E01\u0E47\u0E44\u0E14\u0E49 \xB7 \u0E04\u0E23\u0E2D\u0E1B\u0E23\u0E39\u0E1B\u0E21\u0E32\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 Ctrl+V \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22 \xB7 \u0E15\u0E31\u0E49\u0E07\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D/\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 \u0E41\u0E25\u0E49\u0E27\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E08\u0E30\u0E08\u0E31\u0E14\u0E01\u0E25\u0E38\u0E48\u0E21\u0E43\u0E2B\u0E49\u0E15\u0E32\u0E21\u0E19\u0E35\u0E49"
  }, React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, extras.map(shot => {
    const idx = shots.findIndex(s => s.key === shot.key);
    return React.createElement(SurveyShotCard, {
      key: shot.key,
      shot: shot,
      busy: busySlot === shot.key,
      n: idx + 1,
      onPick: file => pickPhoto(shot.key, file, shot.order),
      onRemove: () => {
        if (confirm("ลบรูปนี้?")) media.removePhoto(shot.key);
      },
      onAnn: () => setAnnKey(shot.key),
      onField: (k, v) => media.patchPhoto(shot.key, {
        [k]: v
      }),
      onMove: d => moveShot(shot.key, d),
      first: idx <= 0,
      last: idx === shots.length - 1
    });
  })), React.createElement(AddShotButton, {
    busy: busySlot && isExtraShot(busySlot),
    onPick: addShot,
    onPaste: pasteFromClipboard
  })))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "12px 16px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, step > 1 ? React.createElement("button", {
    onClick: () => setStep(s => s - 1),
    style: {
      flex: "0 0 auto",
      padding: "12px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    color: "var(--text-2)",
    style: {
      transform: "scaleX(-1)"
    }
  }), !isMobile && " ย้อนกลับ") : React.createElement("button", {
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      padding: "12px 18px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1B\u0E34\u0E14"), step < SURVEY_STEPS.length ? React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => save(false),
    style: {
      flex: "0 0 auto",
      padding: "12px 15px",
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), React.createElement("button", {
    onClick: () => setStep(s => s + 1),
    style: {
      flex: 1,
      padding: "12px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, "\u0E16\u0E31\u0E14\u0E44\u0E1B ", React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    color: "#fff"
  }))) : React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => save(true),
    style: {
      flex: "0 0 auto",
      padding: "12px 15px",
      borderRadius: 11,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 13.5,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, React.createElement(Icon, {
    name: "file",
    size: 15,
    color: "var(--primary-dark)"
  }), " \u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"), React.createElement("button", {
    onClick: () => save(false),
    style: {
      flex: 1,
      padding: "12px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6
    }
  }, React.createElement(Icon, {
    name: "check",
    size: 16,
    color: "#fff",
    sw: 2.4
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))))), annKey && media.photos[annKey] && React.createElement(AnnEditor, {
    shot: Object.assign({
      key: annKey
    }, media.photos[annKey]),
    onClose: () => setAnnKey(null),
    onSave: ann => {
      media.patchPhoto(annKey, {
        ann: ann.length ? ann : null
      });
      setAnnKey(null);
    }
  }));
}
function AddShotButton({
  busy,
  onPick,
  onPaste
}) {
  const ref = React.useRef(null);
  const btn = {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "13px",
    borderRadius: 11,
    border: "1px dashed var(--border-strong)",
    background: "var(--surface)",
    color: "var(--primary-dark)",
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: busy ? "default" : "pointer"
  };
  return React.createElement(React.Fragment, null, React.createElement("input", {
    ref: ref,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files && e.target.files[0];
      if (f) onPick(f);
      e.target.value = "";
    }
  }), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    type: "button",
    onClick: () => ref.current && ref.current.click(),
    disabled: busy,
    style: btn
  }, React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "var(--primary-dark)",
    sw: 2.4
  }), " ", busy ? "กำลังเพิ่มรูป..." : "เพิ่มรูป"), onPaste && React.createElement("button", {
    type: "button",
    onClick: onPaste,
    disabled: busy,
    style: Object.assign({}, btn, {
      flex: "0 0 auto",
      paddingLeft: 15,
      paddingRight: 15
    }),
    title: "\u0E27\u0E32\u0E07\u0E20\u0E32\u0E1E\u0E08\u0E32\u0E01\u0E04\u0E25\u0E34\u0E1B\u0E1A\u0E2D\u0E23\u0E4C\u0E14 (Ctrl+V)"
  }, "\uD83D\uDCCB \u0E27\u0E32\u0E07\u0E20\u0E32\u0E1E")));
}
Object.assign(window, {
  SurveyWizard,
  surveyStatus,
  blankSurvey,
  useSurveyPhotos,
  AnnOverlay,
  AnnEditor,
  sortedShots,
  shotTitle,
  isExtraShot,
  SURVEY_PHOTO_SLOTS,
  SURVEY_SLOT_BY,
  SURVEY_STEPS,
  SURVEY_ROOF_COND,
  SURVEY_MDB_SPACE,
  SURVEY_INV_LOC,
  SURVEY_PASS,
  SURVEY_BIRDNET,
  SURVEY_YESNO,
  SURVEY_CABLE_LEGS,
  cableTotal,
  SURVEY_PHOTO_CATS
});