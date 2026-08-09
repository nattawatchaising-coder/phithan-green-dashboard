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
  const fields = [!!(s.gps && s.gps.lat), !!s.meterSize, !!s.phase, !!s.roofType, !!(s.roofPitch !== "" && s.roofPitch != null), !!s.mdbBrand, !!s.mainBreaker, !!s.inverterLoc];
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
    roofArea: "",
    roofAge: "",
    roofCondition: "",
    roofPitch: "",
    azimuth: "",
    structureOk: "",
    birdNet: "",
    shadingTags: [],
    shadingNote: "",
    mdbBrand: "",
    mdbSpace: "",
    mdbLoc: "",
    inverterLoc: "",
    cableRun: "",
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
const ANN_COLORS = ["#EF4444", "#22C55E", "#FACC15", "#FFFFFF", "#0EA5E9"];
function AnnOverlay({
  ann,
  aw,
  ah
}) {
  const list = ann || [];
  if (!list.length) return null;
  const W = aw || 1000,
    H = ah || 750;
  const unit = Math.max(W, H) / 100;
  return React.createElement("svg", {
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
    if (a.t === "a") {
      const x1 = a.x1 * W,
        y1 = a.y1 * H,
        x2 = a.x2 * W,
        y2 = a.y2 * H;
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const head = unit * 4.5;
      const p1x = x2 - head * Math.cos(ang - 0.42),
        p1y = y2 - head * Math.sin(ang - 0.42);
      const p2x = x2 - head * Math.cos(ang + 0.42),
        p2y = y2 - head * Math.sin(ang + 0.42);
      return React.createElement("g", {
        key: i
      }, React.createElement("line", {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        stroke: a.c,
        strokeWidth: unit * 1.3,
        strokeLinecap: "round"
      }), React.createElement("polygon", {
        points: x2 + "," + y2 + " " + p1x + "," + p1y + " " + p2x + "," + p2y,
        fill: a.c
      }));
    }
    const fs = (a.s || 0.05) * W;
    return React.createElement("text", {
      key: i,
      x: a.x * W,
      y: a.y * H,
      fill: a.c,
      fontSize: fs,
      fontWeight: "800",
      stroke: "rgba(0,0,0,.55)",
      strokeWidth: fs * 0.14,
      paintOrder: "stroke",
      style: {
        fontFamily: "var(--sans)"
      },
      dominantBaseline: "middle"
    }, a.v);
  }));
}
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
  const boxRef = React.useRef(null);
  const W = shot.aw || 1000,
    H = shot.ah || 750;
  const pt = e => {
    const r = boxRef.current.getBoundingClientRect();
    const t = e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0] || e;
    return {
      x: Math.min(1, Math.max(0, (t.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (t.clientY - r.top) / r.height))
    };
  };
  const down = e => {
    const p = pt(e);
    if (tool === "t") {
      const v = prompt("ข้อความที่จะเขียนบนรูป");
      if (v && v.trim()) setAnn(a => a.concat([{
        t: "t",
        x: p.x,
        y: p.y,
        v: v.trim(),
        c: color,
        s: 0.055
      }]));
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
    if (!drag) return;
    e.preventDefault();
    const p = pt(e);
    setDrag(d => Object.assign({}, d, {
      x2: p.x,
      y2: p.y
    }));
  };
  const up = () => {
    if (!drag) return;
    const far = Math.abs(drag.x2 - drag.x1) > 0.03 || Math.abs(drag.y2 - drag.y1) > 0.03;
    if (far) setAnn(a => a.concat([drag]));
    setDrag(null);
  };
  const btn = on => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "9px 13px",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 700,
    border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
    background: on ? "var(--primary-soft)" : "var(--surface)",
    color: on ? "var(--primary-dark)" : "var(--text-2)"
  });
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
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(860px,100%)",
      maxHeight: isMobile ? "96dvh" : "94vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, React.createElement("div", {
    style: {
      padding: "14px 18px",
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
      fontSize: 15.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1A\u0E19\u0E23\u0E39\u0E1B"), React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, tool === "a" ? "ลากนิ้วจากต้นทางไปปลายทาง = ลูกศร" : "แตะตำแหน่งที่จะวางข้อความ")), React.createElement("button", {
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
      overflow: "auto",
      padding: 14,
      background: "var(--surface2)",
      display: "grid",
      placeItems: "center"
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
      maxWidth: "100%",
      touchAction: "none",
      userSelect: "none",
      lineHeight: 0,
      borderRadius: 10,
      overflow: "hidden",
      border: "1px solid var(--border)"
    }
  }, React.createElement("img", {
    src: shot.dataUrl,
    alt: "",
    draggable: false,
    style: {
      display: "block",
      maxWidth: "100%",
      maxHeight: isMobile ? "56dvh" : "62vh",
      width: "auto"
    }
  }), React.createElement(AnnOverlay, {
    ann: drag ? ann.concat([drag]) : ann,
    aw: W,
    ah: H
  }))), React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, React.createElement("button", {
    onClick: () => setTool("a"),
    style: btn(tool === "a")
  }, "\u2197 \u0E25\u0E39\u0E01\u0E28\u0E23"), React.createElement("button", {
    onClick: () => setTool("t"),
    style: btn(tool === "t")
  }, "\u0E01 \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21"), React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 6,
      marginLeft: 2
    }
  }, ANN_COLORS.map(c => React.createElement("button", {
    key: c,
    onClick: () => setColor(c),
    "aria-label": "สี " + c,
    style: {
      width: 28,
      height: 28,
      borderRadius: 99,
      cursor: "pointer",
      background: c,
      border: color === c ? "3px solid var(--primary-dark)" : "1px solid var(--border-strong)"
    }
  }))), React.createElement("span", {
    style: {
      flex: 1
    }
  }), React.createElement("button", {
    onClick: () => setAnn(a => a.slice(0, -1)),
    disabled: !ann.length,
    style: Object.assign(btn(false), {
      opacity: ann.length ? 1 : .45
    })
  }, "\u0E40\u0E25\u0E34\u0E01\u0E17\u0E33"), React.createElement("button", {
    onClick: () => setAnn([]),
    disabled: !ann.length,
    style: Object.assign(btn(false), {
      opacity: ann.length ? 1 : .45
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
      borderRadius: 11,
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
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E17\u0E35\u0E48\u0E40\u0E02\u0E35\u0E22\u0E19"))));
}
function SurveyBlock({
  title,
  sub,
  children
}) {
  return React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 13
    }
  }, React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800,
      color: "var(--text-1)",
      letterSpacing: ".01em"
    }
  }, title), sub && React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, sub)), children);
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
      border: "1px solid " + (has ? "var(--primary)" : "var(--border-strong)"),
      borderRadius: 12,
      padding: 11,
      background: has ? "var(--primary-soft)" : "var(--surface2)",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 11,
      alignItems: "center"
    }
  }, React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 99,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: has ? "var(--primary)" : "var(--surface3)",
      color: has ? "#fff" : "var(--text-3)",
      fontSize: 12,
      fontWeight: 800
    }
  }, has ? n || React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "#fff",
    sw: 2.6
  }) : React.createElement(Icon, {
    name: "image",
    size: 14,
    color: "var(--text-3)"
  })), has && React.createElement("span", {
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
      width: 52,
      height: 52,
      borderRadius: 9,
      objectFit: "cover",
      cursor: "pointer",
      border: "1px solid var(--border)"
    }
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
      gap: 5,
      padding: "7px 12px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u2197 \u0E40\u0E02\u0E35\u0E22\u0E19\u0E25\u0E39\u0E01\u0E28\u0E23 / \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21", shot.ann && shot.ann.length ? " (" + shot.ann.length + ")" : ""), onMove && React.createElement(React.Fragment, null, React.createElement("button", {
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
  }, "\u2193"))), !req && React.createElement("input", {
    value: shot.title || "",
    onChange: e => onField("title", e.target.value),
    placeholder: "\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E23\u0E39\u0E1B \u0E40\u0E0A\u0E48\u0E19 \u0E20\u0E32\u0E1E\u0E08\u0E32\u0E01\u0E42\u0E14\u0E23\u0E19 \u0E1A\u0E34\u0E19\u0E40\u0E09\u0E35\u0E22\u0E07\u0E14\u0E49\u0E32\u0E19\u0E0B\u0E49\u0E32\u0E22",
    style: Object.assign({}, inputStyle, {
      fontSize: 13
    })
  }), React.createElement("input", {
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
  currentUser
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
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: ".05em",
    textTransform: "uppercase",
    color: "var(--text-3)"
  };
  const fld = (label, child, req) => React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
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
      padding: "16px 20px 12px",
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
      fontSize: 11.5,
      color: "var(--text-3)",
      fontWeight: 600
    }
  }, "\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19 \xB7 ", job ? job.code : ""), React.createElement("h2", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color: "var(--text-1)",
      margin: "2px 0 0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, job ? job.name : "")), React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0
    }
  }, React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 800,
      color: st.color
    }
  }, st.pct, "%"), React.createElement("button", {
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
  })))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 13
    }
  }, SURVEY_STEPS.map(s => {
    const active = s.n === step,
      done = s.n < step;
    return React.createElement("button", {
      key: s.n,
      onClick: () => setStep(s.n),
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        padding: 0
      }
    }, React.createElement("span", {
      style: {
        width: "100%",
        height: 4,
        borderRadius: 99,
        background: active || done ? "var(--primary)" : "var(--surface3)"
      }
    }), React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: isMobile ? 0 : 10.5,
        fontWeight: active ? 800 : 600,
        color: active ? "var(--primary-dark)" : "var(--text-3)"
      }
    }, React.createElement(Icon, {
      name: s.icon,
      size: 13,
      color: active ? "var(--primary-dark)" : "var(--text-3)"
    }), !isMobile && s.th));
  }))), React.createElement("div", {
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
  }))), fld("ระบบไฟฟ้า (เฟส)", React.createElement(Segmented, {
    value: f.phase,
    onChange: v => set("phase", v),
    options: [{
      value: "1",
      label: "1 เฟส"
    }, {
      value: "3",
      label: "3 เฟส"
    }]
  }), true), React.createElement("div", {
    style: two
  }, fld("ขนาดเมนเบรกเกอร์", React.createElement("input", {
    value: f.mainBreaker,
    onChange: e => set("mainBreaker", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 100A, 3P",
    style: inputStyle
  }), true), fld("สายเมนเดิม", React.createElement("input", {
    value: f.mainCable,
    onChange: e => set("mainCable", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 NYY 50 sq.mm",
    style: inputStyle
  }))))), step === 2 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
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
  }), true), React.createElement("div", {
    style: two
  }, fld("พื้นที่ใช้ได้ (ตร.ม.)", React.createElement("input", {
    type: "number",
    value: f.roofArea,
    onChange: e => set("roofArea", e.target.value),
    placeholder: "\u0E15\u0E23.\u0E21.",
    style: numStyle
  })), fld("อายุหลังคา (ปี)", React.createElement("input", {
    type: "number",
    value: f.roofAge,
    onChange: e => set("roofAge", e.target.value),
    placeholder: "\u0E1B\u0E35",
    style: numStyle
  }))), fld("สภาพหลังคา", React.createElement(Dropdown, {
    value: f.roofCondition,
    onChange: v => set("roofCondition", v),
    placeholder: "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014",
    options: SURVEY_ROOF_COND
  })), fld("โครงสร้างรับน้ำหนัก", React.createElement(Segmented, {
    value: f.structureOk,
    onChange: v => set("structureOk", v),
    options: SURVEY_PASS
  })), fld("ตาข่ายกันนก", React.createElement(Segmented, {
    value: f.birdNet,
    onChange: v => set("birdNet", v),
    options: SURVEY_BIRDNET
  }))), React.createElement(SurveyBlock, {
    title: "\uD83D\uDCD0 \u0E21\u0E38\u0E21\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32",
    sub: "\u0E04\u0E27\u0E32\u0E21\u0E25\u0E32\u0E14\u0E40\u0E2D\u0E35\u0E22\u0E07 \u0E41\u0E25\u0E30\u0E17\u0E34\u0E28\u0E2B\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E32 (Azimuth)"
  }, React.createElement("div", {
    style: two
  }, fld("ความลาดเอียง (องศา)", React.createElement("input", {
    type: "number",
    value: f.roofPitch,
    onChange: e => set("roofPitch", e.target.value),
    placeholder: "0\u201390\xB0",
    style: numStyle
  }), true), fld("ทิศหัน / Azimuth (องศา)", React.createElement("input", {
    type: "number",
    value: f.azimuth,
    onChange: e => set("azimuth", e.target.value),
    placeholder: "0=N 90=E 180=S",
    style: numStyle
  }))), React.createElement("div", {
    style: {
      fontSize: 10.5,
      color: "var(--text-3)"
    }
  }, "0\xB0 = \u0E17\u0E34\u0E28\u0E40\u0E2B\u0E19\u0E37\u0E2D \xB7 90\xB0 = \u0E17\u0E34\u0E28\u0E15\u0E30\u0E27\u0E31\u0E19\u0E2D\u0E2D\u0E01 \xB7 180\xB0 = \u0E17\u0E34\u0E28\u0E43\u0E15\u0E49 \xB7 270\xB0 = \u0E17\u0E34\u0E28\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01")), React.createElement(SurveyBlock, {
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
    title: "\uD83D\uDD0C \u0E15\u0E39\u0E49\u0E40\u0E21\u0E19\u0E44\u0E1F\u0E1F\u0E49\u0E32 (MDB)"
  }, fld("ยี่ห้อ / รุ่นตู้ MDB", React.createElement("input", {
    value: f.mdbBrand,
    onChange: e => set("mdbBrand", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Schneider, ABB, Haco",
    style: inputStyle
  }), true), fld("ตำแหน่งที่ตั้งตู้ MDB", React.createElement("input", {
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
  }), true), fld("ระยะเดินสายโดยประมาณ (เมตร)", React.createElement("input", {
    type: "number",
    value: f.cableRun,
    onChange: e => set("cableRun", e.target.value),
    placeholder: "\u0E23\u0E30\u0E22\u0E30\u0E08\u0E32\u0E01\u0E41\u0E1C\u0E07 \u2192 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C \u2192 MDB",
    style: numStyle
  })))), step === 4 && React.createElement(React.Fragment, null, React.createElement(SurveyBlock, {
    title: "\uD83E\uDDF0 \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E17\u0E35\u0E48\u0E40\u0E2A\u0E19\u0E2D",
    sub: "\u0E02\u0E36\u0E49\u0E19\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2B\u0E31\u0E27\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19 \u2014 \u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E44\u0E14\u0E49\u0E16\u0E49\u0E32\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E23\u0E38\u0E1B"
  }, fld("ขนาดระบบ (kW)", React.createElement("input", {
    value: f.sizeKw,
    onChange: e => set("sizeKw", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 6.7",
    style: inputStyle
  })), fld("Inverter", React.createElement("input", {
    value: f.invModel,
    onChange: e => set("invModel", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Solis S6-EH1P6K-L-PLUS \u2014 6kW Hybrid 1P",
    style: inputStyle
  })), fld("แผงโซลาร์", React.createElement("input", {
    value: f.panelModel,
    onChange: e => set("panelModel", e.target.value),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 Aiko (670W)",
    style: inputStyle
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
    sub: "\u0E16\u0E48\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C \xB7 \u0E41\u0E15\u0E30\u0E23\u0E39\u0E1B\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E02\u0E35\u0E22\u0E19\u0E25\u0E39\u0E01\u0E28\u0E23/\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21"
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
    sub: "\u0E16\u0E48\u0E32\u0E22\u0E01\u0E35\u0E48\u0E23\u0E39\u0E1B\u0E01\u0E47\u0E44\u0E14\u0E49 \xB7 \u0E15\u0E31\u0E49\u0E07\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E41\u0E25\u0E30\u0E04\u0E33\u0E1A\u0E23\u0E23\u0E22\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E41\u0E15\u0E48\u0E25\u0E30\u0E23\u0E39\u0E1B \u0E41\u0E25\u0E49\u0E27\u0E21\u0E31\u0E19\u0E08\u0E30\u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21\u0E19\u0E35\u0E49\u0E43\u0E19\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"
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
    onPick: addShot
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
  onPick
}) {
  const ref = React.useRef(null);
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
  }), React.createElement("button", {
    type: "button",
    onClick: () => ref.current && ref.current.click(),
    disabled: busy,
    style: {
      width: "100%",
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
    }
  }, React.createElement(Icon, {
    name: "plus",
    size: 16,
    color: "var(--primary-dark)",
    sw: 2.4
  }), " ", busy ? "กำลังเพิ่มรูป..." : "เพิ่มรูป"));
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
  SURVEY_BIRDNET
});