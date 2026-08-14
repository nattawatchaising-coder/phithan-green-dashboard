/* ============================================================
   PHITHAN GREEN — Site Survey Module (สำรวจหน้างาน)
   ฟอร์มเก็บข้อมูลวิศวกรรมหน้างาน (mobile-first) — 5 ขั้นตอน
   เก็บข้อมูลไว้กับงาน: job.survey (ผ่าน store.patch) · ลูกค้าสำรวจ: lead.survey
   รูปถ่าย: เก็บ base64 ใน RTDB surveyPhotos/{targetId}/{key}
   ============================================================ */

// ── ตัวเลือก ──
const SURVEY_ROOF_TYPES = (window.BOQ && window.BOQ.ROOF_OPTIONS && window.BOQ.ROOF_OPTIONS.length)
  ? window.BOQ.ROOF_OPTIONS
  : ["เมทัลชีท", "กระเบื้องลอนคู่", "CPAC", "พื้นคอนกรีต (Slab)", "Shingle Roof", "อื่นๆ"];
const SURVEY_ROOF_COND = [
  { value: "good", label: "ดี (แข็งแรง)" },
  { value: "fair", label: "พอใช้" },
  { value: "poor", label: "ทรุดโทรม / ต้องเสริม" },
];
const SURVEY_SHADING_TAGS = ["ต้นไม้", "อาคารข้างเคียง", "เสาไฟ / สายไฟ", "ถังเก็บน้ำ", "ปล่องระบายอากาศ", "เสาอากาศ", "อื่นๆ"];
const SURVEY_INV_LOC = [
  { value: "indoor", label: "ในอาคาร (Indoor)" },
  { value: "outdoor", label: "นอกอาคาร (Outdoor)" },
];
const SURVEY_MDB_SPACE = [
  { value: "free", label: "มีช่องว่างเพียงพอ" },
  { value: "tight", label: "มีช่องว่างจำกัด" },
  { value: "full", label: "เต็ม / ต้องเพิ่มตู้" },
];
// ประเภทอาคารที่จะวางแผง (ขึ้นหัวข้อแรกของ "สภาพหลังคา" ในรายงาน)
const SURVEY_BUILDING = ["บ้านเดี่ยว", "บ้านแฝด", "ทาวน์เฮาส์", "อาคารพาณิชย์", "โรงงาน / โกดัง", "อื่นๆ"];
const SURVEY_PASS = [
  { value: "pass", label: "ผ่าน" },
  { value: "fix", label: "ต้องเสริม / แก้ไข" },
];
const SURVEY_BIRDNET = [
  { value: "yes", label: "ติดตั้ง" },
  { value: "no", label: "ไม่ติดตั้ง" },
];
const SURVEY_METER_AUTH = [
  { value: "MEA", label: "MEA (นครหลวง)" },
  { value: "PEA", label: "PEA (ภูมิภาค)" },
];
const SURVEY_YESNO = [{ value: "yes", label: "มี" }, { value: "no", label: "ไม่มี" }];
/* ระยะเดินสาย — เดิมเป็นตัวเลขก้อนเดียว "แผง→อินเวอร์เตอร์→MDB" ซึ่งเอาไปคิดสายไม่ได้
   เพราะแต่ละช่วงเป็นสายคนละชนิดคนละขนาด แยกกรอกทีละช่วงแล้วรวมยอดให้ */
const SURVEY_CABLE_LEGS = [
  { key: "cableDc",  th: "แผง → อินเวอร์เตอร์ (สาย DC)" },
  { key: "cableAc",  th: "อินเวอร์เตอร์ → ตู้ MDB (สาย AC)" },
  { key: "cableCt",  th: "CT / Meter → อินเวอร์เตอร์" },
  { key: "cableGnd", th: "สายกราวด์ → หลักดิน" },
];
const cableTotal = (s) => SURVEY_CABLE_LEGS.reduce((t, l) => t + (+((s || {})[l.key]) || 0), 0);
// หมวดหมู่รูปเพิ่มเติม — จัดกลุ่มในรายงานตามลำดับนี้
const SURVEY_PHOTO_CATS = ["หลังคา / โครงสร้าง", "ระบบไฟฟ้า / ตู้ MDB", "จุดติดตั้งอุปกรณ์", "สิ่งกีดขวาง / เงาบัง", "รูปอุปกรณ์ที่เสนอ", "อื่นๆ"];

// รายการรูปบังคับ (mandatory photo checklist) — ครบทุกช่อง = ผ่าน
const SURVEY_PHOTO_SLOTS = [
  { key: "meter",    label: "มิเตอร์ไฟฟ้า",            hint: "ให้เห็นเลขมิเตอร์และขนาดชัดเจน" },
  { key: "mdb",      label: "ภายในตู้ MDB (เปิดฝา)",   hint: "เห็นเมนเบรกเกอร์และช่องว่าง" },
  { key: "roof",     label: "ภาพรวมหลังคา",            hint: "มุมกว้างเห็นพื้นที่ติดตั้ง" },
  { key: "truss",    label: "โครงสร้าง / จันทันหลังคา", hint: "ดูความแข็งแรงของโครงสร้าง" },
  { key: "inverter", label: "จุดติดตั้งอินเวอร์เตอร์",  hint: "ตำแหน่งที่จะติดตั้งจริง" },
];
const SURVEY_SLOT_BY = Object.fromEntries(SURVEY_PHOTO_SLOTS.map((s) => [s.key, s]));
const isExtraShot = (k) => String(k || "").indexOf("x_") === 0;

// ── สถานะการสำรวจของงาน (ใช้ในลิสต์/ป้าย) ──
// หมายเหตุ: ช่องที่นับความครบยังเป็นชุดเดิม — ช่องที่เพิ่มมาทีหลังเป็นตัวเลือก
// ถ้าเอามานับด้วย งานที่สำรวจครบไปแล้วจะกลายเป็น "ไม่ครบ" ย้อนหลังทั้งหมด
function surveyStatus(job) {
  const s = job && job.survey;
  if (s && s.skip) return { state: "skip", pct: 100, label: "ไม่ต้องสำรวจ", color: "var(--tint-green-tx)" };
  if (!s || !s.startedAt) return { state: "none", pct: 0, label: "ยังไม่สำรวจ", color: "#94A3B8" };
  const fields = [
    !!(s.gps && s.gps.lat), !!s.meterSize, !!s.phase,                      // ขั้น 1
    !!s.roofType,                                                          // ขั้น 2
    !!s.mdbBrand, !!s.mainBreaker, !!s.inverterLoc,                        // ขั้น 3
  ];
  const photos = s.photos || {};
  const checks = fields.concat(SURVEY_PHOTO_SLOTS.map((p) => !!photos[p.key]));
  const done = checks.filter(Boolean).length;
  const pct = Math.round((done / checks.length) * 100);
  if (pct >= 100) return { state: "done", pct: 100, label: "สำรวจครบ", color: "var(--tint-green-tx)" };
  return { state: "partial", pct, label: "สำรวจบางส่วน", color: "#F59E0B" };
}

// ── ค่าเริ่มต้นของแบบสำรวจ (ดึงค่าที่งานมีอยู่แล้วมาตั้งต้น) ──
function blankSurvey(job) {
  return {
    startedAt: "", updatedAt: "", completedAt: "", byName: "",
    gps: null,                                  // { lat, lng, at }
    meterSize: "",
    meterAuth: "",                              // MEA / PEA
    phase: String((job && job.phase) || "1") === "3" ? "3" : "1",
    mainBreaker: "", mainCable: "",             // เมนเบรกเกอร์เดิม / สายเมนเดิม
    buildingType: "",                           // พื้นที่ที่จะวางแผง (บ้านเดี่ยว ฯลฯ)
    roofType: (job && job.roof) || "",
    roofCondition: "",
    structureOk: "",                            // โครงสร้างรับน้ำหนัก ผ่าน/ต้องเสริม
    birdNet: "",                                // ตาข่ายกันนก
    shadingTags: [], shadingNote: "",
    mdbBrand: "", mdbSpace: "", mdbLoc: "",     // ตู้ MDB — ยี่ห้อ / ช่องว่าง / ตำแหน่งที่ตั้ง
    mdbSafety: "", mdbRccb: "",                 // เซฟตี้คัตในตู้ / เมนเป็นชนิดกันดูด RCD-RCCB
    inverterLoc: "",
    cableDc: "", cableAc: "", cableCt: "", cableGnd: "",   // ระยะเดินสายแยกช่วง
    sizeKw: (job && job.kw) ? String(job.kw) : "",
    invModel: "", panelModel: "", monitoring: "", meterCt: "",
    specials: [],                               // ความต้องการพิเศษของลูกค้า (ข้อความหลายข้อ)
    note: "",                                   // หมายเหตุท้ายรายงาน
    photos: {},                                 // { slot: true } — แฟลกไว้แสดงสถานะโดยไม่ต้องโหลดรูป
  };
}

/* ── โหลด/บันทึกรูปสำรวจ (base64 ใน RTDB) ──
   1 record = 1 รูป: { slot, dataUrl, title, caption, order, ann, aw, ah, by, byName, at }
   ann = ลูกศร/ข้อความที่เขียนทับรูป เก็บเป็นพิกัดสัดส่วน 0–1 (ไม่แตะรูปต้นฉบับ แก้ซ้ำได้เรื่อยๆ) */
function useSurveyPhotos(jobId) {
  const [photos, setPhotos] = React.useState({});
  React.useEffect(() => {
    if (!jobId || !window.FBDB) { setPhotos({}); return; }
    const ref = window.FBDB.ref("surveyPhotos/" + jobId);
    const h = ref.on("value", (s) => { const v = s.val(); setPhotos(v && typeof v === "object" ? v : {}); });
    return () => ref.off("value", h);
  }, [jobId]);
  const setPhoto = React.useCallback((slot, dataUrl, user, extra) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).update(Object.assign({
      slot, dataUrl, by: (user && user.id) || null, byName: (user && user.name) || "-", at: new Date().toISOString(),
    }, extra || {}));
  }, [jobId]);
  const patchPhoto = React.useCallback((slot, fields) => {
    if (!jobId || !window.FBDB) return;
    window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).update(fields);
  }, [jobId]);
  const removePhoto = React.useCallback((slot) => {
    if (jobId && window.FBDB) window.FBDB.ref("surveyPhotos/" + jobId + "/" + slot).remove();
  }, [jobId]);
  return { photos, setPhoto, patchPhoto, removePhoto };
}

/* เรียงรูปสำหรับแสดง/ออกรายงาน — ตาม order แล้วค่อยตามลำดับช่องบังคับ */
function sortedShots(photos) {
  const fixed = SURVEY_PHOTO_SLOTS.map((s) => s.key);
  return Object.keys(photos || {})
    .filter((k) => photos[k] && photos[k].dataUrl)
    .map((k) => Object.assign({ key: k }, photos[k]))
    .sort((a, b) => {
      const oa = a.order == null ? (fixed.indexOf(a.key) >= 0 ? fixed.indexOf(a.key) : 900) : a.order;
      const ob = b.order == null ? (fixed.indexOf(b.key) >= 0 ? fixed.indexOf(b.key) : 900) : b.order;
      return oa - ob || String(a.key).localeCompare(String(b.key));
    });
}
// ชื่อหัวข้อรูปที่จะขึ้นในรายงาน
function shotTitle(shot) {
  if (shot.title) return shot.title;
  const s = SURVEY_SLOT_BY[shot.key];
  return s ? s.label : "รูปเพิ่มเติม";
}

/* ============================================================
   ANNOTATION — ลูกศร / ข้อความ ที่เขียนทับรูป
   พิกัดเก็บเป็นสัดส่วน 0–1 ของรูป · วาดด้วย SVG viewBox เท่าขนาดรูปจริง
   จึงคมทุกขนาดหน้าจอ ไม่บิดเบี้ยว และพิมพ์ลงรายงานได้ตรง
   ============================================================ */
const ANN_COLORS = ["#EF4444", "#22C55E", "#FACC15", "#FFFFFF", "#0EA5E9"];

function AnnOverlay({ ann, aw, ah }) {
  const list = ann || [];
  if (!list.length) return null;
  const W = aw || 1000, H = ah || 750;
  const unit = Math.max(W, H) / 100;            // ความหนาเส้นอ้างอิงกับขนาดรูป
  return (
    <svg viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {list.map((a, i) => {
        if (a.t === "a") {
          const x1 = a.x1 * W, y1 = a.y1 * H, x2 = a.x2 * W, y2 = a.y2 * H;
          const ang = Math.atan2(y2 - y1, x2 - x1);
          const head = unit * 4.5;
          const p1x = x2 - head * Math.cos(ang - 0.42), p1y = y2 - head * Math.sin(ang - 0.42);
          const p2x = x2 - head * Math.cos(ang + 0.42), p2y = y2 - head * Math.sin(ang + 0.42);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={a.c} strokeWidth={unit * 1.3} strokeLinecap="round" />
              <polygon points={x2 + "," + y2 + " " + p1x + "," + p1y + " " + p2x + "," + p2y} fill={a.c} />
            </g>
          );
        }
        const fs = (a.s || 0.05) * W;
        return (
          <text key={i} x={a.x * W} y={a.y * H} fill={a.c} fontSize={fs} fontWeight="800"
            stroke="rgba(0,0,0,.55)" strokeWidth={fs * 0.14} paintOrder="stroke"
            style={{ fontFamily: "var(--sans)" }} dominantBaseline="middle">{a.v}</text>
        );
      })}
    </svg>
  );
}

/* ตัวเขียนบนรูป — จิ้มลากบนมือถือได้เลย */
function AnnEditor({ shot, onSave, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [tool, setTool] = React.useState("a");        // a = ลูกศร · t = ข้อความ
  const [color, setColor] = React.useState("#EF4444");
  const [ann, setAnn] = React.useState(() => (shot.ann || []).slice());
  const [drag, setDrag] = React.useState(null);       // ลูกศรที่กำลังลาก
  const boxRef = React.useRef(null);
  const W = shot.aw || 1000, H = shot.ah || 750;

  // แปลงตำแหน่งนิ้ว/เมาส์ → สัดส่วน 0–1 ของรูป
  const pt = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return { x: Math.min(1, Math.max(0, (t.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (t.clientY - r.top) / r.height)) };
  };
  const down = (e) => {
    const p = pt(e);
    if (tool === "t") {
      const v = prompt("ข้อความที่จะเขียนบนรูป");
      if (v && v.trim()) setAnn((a) => a.concat([{ t: "t", x: p.x, y: p.y, v: v.trim(), c: color, s: 0.055 }]));
      return;
    }
    e.preventDefault();
    setDrag({ t: "a", x1: p.x, y1: p.y, x2: p.x, y2: p.y, c: color });
  };
  const move = (e) => { if (!drag) return; e.preventDefault(); const p = pt(e); setDrag((d) => Object.assign({}, d, { x2: p.x, y2: p.y })); };
  const up = () => {
    if (!drag) return;
    const far = Math.abs(drag.x2 - drag.x1) > 0.03 || Math.abs(drag.y2 - drag.y1) > 0.03;
    if (far) setAnn((a) => a.concat([drag]));
    setDrag(null);
  };

  const btn = (on) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 13px", borderRadius: 10, cursor: "pointer",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
    background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.62)", backdropFilter: "blur(3px)", zIndex: 130, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(860px,100%)", maxHeight: isMobile ? "96dvh" : "94vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text-1)" }}>เขียนบนรูป</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{tool === "a" ? "ลากนิ้วจากต้นทางไปปลายทาง = ลูกศร" : "แตะตำแหน่งที่จะวางข้อความ"}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 14, background: "var(--surface2)", display: "grid", placeItems: "center" }}>
          <div ref={boxRef} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
            onTouchStart={down} onTouchMove={move} onTouchEnd={up}
            style={{ position: "relative", maxWidth: "100%", touchAction: "none", userSelect: "none", lineHeight: 0, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={shot.dataUrl} alt="" draggable={false} style={{ display: "block", maxWidth: "100%", maxHeight: isMobile ? "56dvh" : "62vh", width: "auto" }} />
            <AnnOverlay ann={drag ? ann.concat([drag]) : ann} aw={W} ah={H} />
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setTool("a")} style={btn(tool === "a")}>↗ ลูกศร</button>
          <button onClick={() => setTool("t")} style={btn(tool === "t")}>ก ข้อความ</button>
          <span style={{ display: "inline-flex", gap: 6, marginLeft: 2 }}>
            {ANN_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label={"สี " + c}
                style={{ width: 28, height: 28, borderRadius: 99, cursor: "pointer", background: c, border: color === c ? "3px solid var(--primary-dark)" : "1px solid var(--border-strong)" }} />
            ))}
          </span>
          <span style={{ flex: 1 }} />
          <button onClick={() => setAnn((a) => a.slice(0, -1))} disabled={!ann.length} style={Object.assign(btn(false), { opacity: ann.length ? 1 : .45 })}>เลิกทำ</button>
          <button onClick={() => setAnn([])} disabled={!ann.length} style={Object.assign(btn(false), { opacity: ann.length ? 1 : .45 })}>ล้าง</button>
        </div>
        <div style={{ padding: "12px 14px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => onSave(ann)} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>บันทึกที่เขียน</button>
        </div>
      </div>
    </div>
  );
}

// ── หัวข้อย่อยในฟอร์ม ──
function SurveyBlock({ title, sub, children }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 13 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", letterSpacing: ".01em" }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

/* ── การ์ดรูป 1 ใบ (ใช้ได้ทั้งช่องบังคับและรูปเพิ่มเติม) ── */
function SurveyShotCard({ shot, slot, n, busy, onPick, onRemove, onAnn, onField, onMove, first, last }) {
  const inputRef = React.useRef(null);
  const has = !!(shot && shot.dataUrl);
  const req = !!slot;
  const mini = { width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", fontSize: 13, fontWeight: 800, flexShrink: 0 };
  return (
    <div style={{ border: "1px solid " + (has ? "var(--primary)" : "var(--border-strong)"), borderRadius: 12, padding: 11,
      background: has ? "var(--primary-soft)" : "var(--surface2)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
        <span style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
          background: has ? "var(--primary)" : "var(--surface3)", color: has ? "#fff" : "var(--text-3)", fontSize: 12, fontWeight: 800 }}>
          {has ? (n || <Icon name="check" size={15} color="#fff" sw={2.6} />) : <Icon name="image" size={14} color="var(--text-3)" />}
        </span>
        {has && (
          <span style={{ position: "relative", flexShrink: 0, lineHeight: 0 }}>
            <img src={shot.dataUrl} alt="" onClick={() => onAnn && onAnn()} style={{ width: 52, height: 52, borderRadius: 9, objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" }} />
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{req ? slot.label : (shot && shot.title) || "รูปเพิ่มเติม"}{req && <span style={{ color: "#EF4444" }}> *</span>}</span>
          <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>{req ? slot.hint : "ตั้งชื่อหัวข้อและคำบรรยายได้ด้านล่าง"}</span>
        </span>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onPick(f); e.target.value = ""; }} />
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 9, border: "none",
              background: has ? "var(--surface3)" : "var(--primary)", color: has ? "var(--text-2)" : "#fff",
              fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer", whiteSpace: "nowrap" }}>
            <Icon name="image" size={13} color={has ? "var(--text-2)" : "#fff"} />{busy ? "..." : has ? "ถ่ายใหม่" : "ถ่าย/อัปโหลด"}
          </button>
          {has && <button type="button" onClick={onRemove} title="ลบรูป"
            style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "#EF444414", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={13} /></button>}
        </div>
      </div>
      {has && (
        <React.Fragment>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={onAnn} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ↗ เขียนลูกศร / ข้อความ{shot.ann && shot.ann.length ? " (" + shot.ann.length + ")" : ""}
            </button>
            {onMove && <React.Fragment>
              <button type="button" onClick={() => onMove(-1)} disabled={first} title="เลื่อนขึ้น" style={Object.assign({}, mini, { opacity: first ? .35 : 1 })}>↑</button>
              <button type="button" onClick={() => onMove(1)} disabled={last} title="เลื่อนลง" style={Object.assign({}, mini, { opacity: last ? .35 : 1 })}>↓</button>
            </React.Fragment>}
          </div>
          {!req && (
            <React.Fragment>
              <input value={shot.title || ""} onChange={(e) => onField("title", e.target.value)} placeholder="หัวข้อรูป เช่น ภาพจากโดรน บินเฉียงด้านซ้าย" style={Object.assign({}, inputStyle, { fontSize: 13 })} />
              {/* หมวดหมู่ — รายงานจะจัดกลุ่มรูปตามนี้ ไม่ใส่ก็ไปกองรวมกันท้ายสุด */}
              <Dropdown value={shot.cat || ""} onChange={(v) => onField("cat", v)} placeholder="— หมวดหมู่รูป (ไม่ใส่ก็ได้) —"
                options={SURVEY_PHOTO_CATS.concat(shot.cat && SURVEY_PHOTO_CATS.indexOf(shot.cat) < 0 ? [shot.cat] : []).map((c) => ({ value: c, label: c }))}
                wrap addable onAdd={() => {}} />
            </React.Fragment>
          )}
          <input value={shot.caption || ""} onChange={(e) => onField("caption", e.target.value)} placeholder="คำบรรยายใต้รูป (ไม่ใส่ก็ได้)" style={Object.assign({}, inputStyle, { fontSize: 13 })} />
        </React.Fragment>
      )}
    </div>
  );
}

// ── ตัวช่วยกรอบ step (เลขขั้น + ชื่อ) ──
const SURVEY_STEPS = [
  { n: 1, icon: "pin",   th: "เช็คอิน & มิเตอร์" },
  { n: 2, icon: "box",   th: "หลังคา" },
  { n: 3, icon: "bolt",  th: "ไฟฟ้า & ตำแหน่ง" },
  { n: 4, icon: "file",  th: "อุปกรณ์ & หมายเหตุ" },
  { n: 5, icon: "image", th: "รูปถ่าย" },
];

function SurveyWizard({ job, onClose, onSave, onReport, currentUser, stock }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [step, setStep] = React.useState(1);
  const [busySlot, setBusySlot] = React.useState(null);
  const [gpsBusy, setGpsBusy] = React.useState(false);
  const [gpsErr, setGpsErr] = React.useState("");
  const [annKey, setAnnKey] = React.useState(null);   // รูปที่กำลังเขียนทับ
  const media = useSurveyPhotos(job ? job.id : null);
  const [f, setF] = React.useState(() => Object.assign(blankSurvey(job), (job && job.survey) || {}));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const toggleTag = (t) => setF((p) => {
    const cur = p.shadingTags || [];
    return Object.assign({}, p, { shadingTags: cur.includes(t) ? cur.filter((x) => x !== t) : cur.concat([t]) });
  });

  /* รุ่นอินเวอร์เตอร์ / แผง ดึงจากคลังสินค้า แบ่งกลุ่มตามหมวดย่อย (เช่น แผง › AIKO)
     รุ่นที่พิมพ์เองไว้แต่เดิม (หรือรุ่นที่ยังไม่ได้ลงคลัง) ต่อท้ายไว้ ไม่ให้ค่าที่กรอกไว้แล้วหาย */
  const stockItems = (stock && stock.items) || [];
  const modelOptions = (mainCat, cur) => {
    const SF = window.SF;
    const out = [];
    stockItems.forEach((s) => {
      if (!s.name || !SF || SF.mainCatOf(s.cat) !== mainCat) return;
      const c = SF.STOCK_CAT_BY[s.cat];
      out.push({ value: s.name, label: s.name, group: (c && c.parent) ? c.th : "อื่นๆ",
        sub: [s.brand, s.model].filter(Boolean).join(" · ") });
    });
    out.sort((a, b) => (a.group || "").localeCompare(b.group || "", "th") || a.label.localeCompare(b.label, "th"));
    const v = (cur || "").trim();
    if (v && !out.some((o) => o.value === v)) out.push({ value: v, label: v, group: "พิมพ์เอง" });
    return out;
  };
  const invOptions = React.useMemo(() => modelOptions("inverter", f.invModel), [stockItems, f.invModel]);
  const panelOptions = React.useMemo(() => modelOptions("panel", f.panelModel), [stockItems, f.panelModel]);

  // จับพิกัด GPS ปัจจุบัน
  const captureGps = () => {
    if (!navigator.geolocation) { setGpsErr("อุปกรณ์ไม่รองรับ GPS"); return; }
    setGpsBusy(true); setGpsErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("gps", { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6), acc: Math.round(pos.coords.accuracy || 0), at: new Date().toISOString() });
        setGpsBusy(false);
      },
      (err) => { setGpsErr(err.code === 1 ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง" : "จับพิกัดไม่สำเร็จ ลองใหม่อีกครั้ง"); setGpsBusy(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // เลือก/ถ่ายรูป — เก็บขนาดจริงไว้ด้วย เพื่อให้ลูกศรที่เขียนทับวางตรงตำแหน่งเสมอ
  const pickPhoto = async (slotKey, file, order) => {
    if (!file) return;
    setBusySlot(slotKey);
    try {
      const dataUrl = await resizeImageFile(file, 1400, 0.74);
      const dim = await new Promise((res) => { const im = new Image(); im.onload = () => res({ aw: im.naturalWidth, ah: im.naturalHeight }); im.onerror = () => res({}); im.src = dataUrl; });
      const extra = Object.assign({ ann: null }, dim);
      if (order != null) extra.order = order;
      media.setPhoto(slotKey, dataUrl, currentUser, extra);
    } catch (err) { alert("เพิ่มรูปไม่สำเร็จ: " + err.message); }
    setBusySlot(null);
  };

  const shots = sortedShots(media.photos);
  const extras = shots.filter((s) => isExtraShot(s.key));
  const addShot = (file) => {
    const key = "x_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const maxOrder = shots.reduce((m, s) => Math.max(m, s.order == null ? 0 : s.order), SURVEY_PHOTO_SLOTS.length);
    pickPhoto(key, file, maxOrder + 1);
  };
  /* วางภาพจากคลิปบอร์ด — ช่างมักครอปรูปอุปกรณ์/ภาพตัดจาก PDF หรือกดปุ่มจับภาพหน้าจอมา
     แล้วอยากแปะเข้ารายงานเลย ไม่ต้องเซฟเป็นไฟล์ก่อน · ทำงานเฉพาะตอนอยู่ขั้นรูปถ่าย */
  React.useEffect(() => {
    if (step !== 5) return;
    const onPaste = (e) => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind !== "file" || items[i].type.indexOf("image/") !== 0) continue;
        const file = items[i].getAsFile();
        if (file) { e.preventDefault(); addShot(file); }
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [step, shots.length]);

  // ปุ่มวางภาพ (สำหรับมือถือ/เครื่องที่กด Ctrl+V ไม่ได้) — อ่านรูปจากคลิปบอร์ดตรง ๆ
  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) throw new Error("เบราว์เซอร์นี้อ่านคลิปบอร์ดไม่ได้ ลองกด Ctrl+V แทน");
      const list = await navigator.clipboard.read();
      for (const it of list) {
        const type = it.types.find((t) => t.indexOf("image/") === 0);
        if (!type) continue;
        const blob = await it.getType(type);
        addShot(new File([blob], "paste.png", { type: type }));
        return;
      }
      alert("ในคลิปบอร์ดไม่มีรูปภาพ — ก๊อปรูปมาก่อนแล้วค่อยกดวาง");
    } catch (err) { alert("วางภาพไม่สำเร็จ: " + err.message); }
  };

  // สลับลำดับกับใบข้างเคียง (ทั้งลิสต์รวมช่องบังคับ) — เขียน order ให้ทุกใบครั้งเดียว กันค่าว่าง
  const moveShot = (key, dir) => {
    const arr = shots.slice();
    const i = arr.findIndex((s) => s.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    arr.forEach((s, k) => media.patchPhoto(s.key, { order: k }));
  };

  function photoFlags() { const m = {}; SURVEY_PHOTO_SLOTS.forEach((p) => { if (media.photos[p.key]) m[p.key] = true; }); return m; }
  const st = surveyStatus(Object.assign({}, job, { survey: Object.assign({}, f, { photos: photoFlags() }) }));

  const save = (thenReport) => {
    const now = new Date().toISOString();
    const photos = photoFlags();
    const complete = surveyStatus(Object.assign({}, job, { survey: Object.assign({}, f, { startedAt: f.startedAt || now, photos }) })).state === "done";
    const out = Object.assign({}, f, {
      photos,
      specials: (f.specials || []).filter((x) => String(x || "").trim()),
      startedAt: f.startedAt || now,
      updatedAt: now,
      completedAt: complete ? (f.completedAt || now) : "",
      byName: (currentUser && currentUser.name) || f.byName || "",
    });
    if (onSave) onSave(out, thenReport === true);
  };

  const labelStyle = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const fld = (label, child, req) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={labelStyle}>{label}{req && <span style={{ color: "#EF4444" }}> *</span>}</label>
      {child}
    </div>
  );
  const numStyle = Object.assign({}, inputStyle, { textAlign: "left" });
  const two = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 };

  return (
    <React.Fragment>
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 115, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(680px,100%)", maxHeight: isMobile ? "96dvh" : "94vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>สำรวจหน้างาน · {job ? job.code : ""}</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job ? job.name : ""}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: st.color }}>{st.pct}%</span>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
            </div>
          </div>
          {/* step indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 13 }}>
            {SURVEY_STEPS.map((s) => {
              const active = s.n === step, done = s.n < step;
              return (
                <button key={s.n} onClick={() => setStep(s.n)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                  <span style={{ width: "100%", height: 4, borderRadius: 99, background: active || done ? "var(--primary)" : "var(--surface3)" }} />
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: isMobile ? 0 : 10.5, fontWeight: active ? 800 : 600, color: active ? "var(--primary-dark)" : "var(--text-3)" }}>
                    <Icon name={s.icon} size={13} color={active ? "var(--primary-dark)" : "var(--text-3)"} />{!isMobile && s.th}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* body */}
        <div style={{ overflowY: "auto", flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 13, background: "var(--surface2)" }}>
          {step === 1 && (
            <React.Fragment>
              <SurveyBlock title="📍 เช็คอิน — พิกัด GPS" sub="กดปุ่มเพื่อบันทึกตำแหน่งปัจจุบันของหน้างาน">
                <button type="button" onClick={captureGps} disabled={gpsBusy}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 11, border: "none",
                    background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: gpsBusy ? "default" : "pointer" }}>
                  <Icon name="pin" size={16} color="#fff" />{gpsBusy ? "กำลังจับพิกัด..." : f.gps ? "จับพิกัดใหม่" : "จับพิกัด GPS ปัจจุบัน"}
                </button>
                {gpsErr && <div style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>⚠ {gpsErr}</div>}
                {f.gps && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", background: "var(--surface2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--text-1)" }}>
                      {f.gps.lat}, {f.gps.lng}{f.gps.acc ? <span style={{ color: "var(--text-3)" }}> · ±{f.gps.acc}m</span> : null}
                    </span>
                    <a href={"https://www.google.com/maps?q=" + f.gps.lat + "," + f.gps.lng} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary-dark)", fontSize: 12, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                      <Icon name="map" size={13} color="var(--primary-dark)" /> ดูแผนที่
                    </a>
                  </div>
                )}
              </SurveyBlock>
              <SurveyBlock title="⚡ มิเตอร์ & เมนไฟฟ้าเดิม">
                <div style={two}>
                  {fld("ขนาดมิเตอร์ไฟฟ้า", <input value={f.meterSize} onChange={(e) => set("meterSize", e.target.value)} placeholder="เช่น 15(45)A" style={inputStyle} />, true)}
                  {fld("การไฟฟ้า", <Dropdown value={f.meterAuth} onChange={(v) => set("meterAuth", v)} placeholder="— เลือก —" options={SURVEY_METER_AUTH} />)}
                </div>
                {fld("ระบบไฟฟ้า (เฟส)", <Segmented value={f.phase} onChange={(v) => set("phase", v)} options={[{ value: "1", label: "1 เฟส" }, { value: "3", label: "3 เฟส" }]} />, true)}
                {/* เมนเบรกเกอร์อยู่ในตู้ MDB จึงย้ายไปกรอกพร้อมกันตอนเปิดฝาตู้ (ขั้น "ไฟฟ้า & ตำแหน่ง") */}
                {fld("สายเมนเดิม", <input value={f.mainCable} onChange={(e) => set("mainCable", e.target.value)} placeholder="เช่น NYY 50 sq.mm" style={inputStyle} />)}
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 2 && (
            <React.Fragment>
              <SurveyBlock title="🏠 ชนิด & สภาพหลังคา">
                {fld("พื้นที่ที่จะวางแผงโซลาร์", <Dropdown value={f.buildingType} onChange={(v) => set("buildingType", v)} placeholder="— เลือกประเภทอาคาร —" options={SURVEY_BUILDING.map((r) => ({ value: r, label: r }))} />)}
                {fld("ประเภทหลังคา", <Dropdown value={f.roofType} onChange={(v) => set("roofType", v)} placeholder="— เลือกประเภท —" options={SURVEY_ROOF_TYPES.map((r) => ({ value: r, label: r }))} />, true)}
                {fld("สภาพหลังคา", <Dropdown value={f.roofCondition} onChange={(v) => set("roofCondition", v)} placeholder="— เลือก —" options={SURVEY_ROOF_COND} />)}
                {fld("โครงสร้างรับน้ำหนัก", <Segmented value={f.structureOk} onChange={(v) => set("structureOk", v)} options={SURVEY_PASS} />)}
                {fld("ตาข่ายกันนก", <Segmented value={f.birdNet} onChange={(v) => set("birdNet", v)} options={SURVEY_BIRDNET} />)}
              </SurveyBlock>
              <SurveyBlock title="🌳 สิ่งกีดขวาง / เงาบัง" sub="เลือกสิ่งที่อาจบดบังแสงแดด">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {SURVEY_SHADING_TAGS.map((t) => {
                    const on = (f.shadingTags || []).includes(t);
                    return (
                      <button key={t} type="button" onClick={() => toggleTag(t)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 600,
                          border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"), background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
                        {on && <Icon name="check" size={12} color="var(--primary-dark)" sw={2.6} />}{t}
                      </button>
                    );
                  })}
                </div>
                <textarea value={f.shadingNote} onChange={(e) => set("shadingNote", e.target.value)} placeholder="รายละเอียดเพิ่มเติม เช่น ต้นไม้สูง 5 ม. ทางทิศตะวันตก บังช่วงบ่าย"
                  rows={2} style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 3 && (
            <React.Fragment>
              <SurveyBlock title="🔌 ตู้เมนไฟฟ้า (MDB)" sub="เปิดฝาตู้แล้วดูของข้างในไปพร้อมกันทีเดียว">
                {fld("ยี่ห้อ / รุ่นตู้ MDB", <input value={f.mdbBrand} onChange={(e) => set("mdbBrand", e.target.value)} placeholder="เช่น Schneider, ABB, Haco" style={inputStyle} />, true)}
                {/* เมนเบรกเกอร์อยู่ในตู้นี้ ย้ายมาจากขั้นมิเตอร์ จะได้กรอกตอนเปิดฝาตู้รอบเดียว */}
                {fld("ขนาดเมนเบรกเกอร์", <input value={f.mainBreaker} onChange={(e) => set("mainBreaker", e.target.value)} placeholder="เช่น 100A, 3P" style={inputStyle} />, true)}
                <div style={two}>
                  {fld("มีเซฟตี้คัต", <Segmented value={f.mdbSafety} onChange={(v) => set("mdbSafety", v)} options={SURVEY_YESNO} />)}
                  {fld("เมนเป็นชนิดกันดูด (RCD / RCCB)", <Segmented value={f.mdbRccb} onChange={(v) => set("mdbRccb", v)} options={SURVEY_YESNO} />)}
                </div>
                {fld("ตำแหน่งที่ตั้งตู้ MDB", <input value={f.mdbLoc} onChange={(e) => set("mdbLoc", e.target.value)} placeholder="เช่น ข้างบันได ชั้น 1 / โรงจอดรถ" style={inputStyle} />)}
                {fld("ช่องว่างในตู้", <Dropdown value={f.mdbSpace} onChange={(v) => set("mdbSpace", v)} placeholder="— เลือก —" options={SURVEY_MDB_SPACE} />)}
              </SurveyBlock>
              <SurveyBlock title="🔋 ตำแหน่งติดตั้งอินเวอร์เตอร์">
                {fld("ตำแหน่งที่เสนอติดตั้ง", <Segmented value={f.inverterLoc} onChange={(v) => set("inverterLoc", v)} options={SURVEY_INV_LOC} />, true)}
              </SurveyBlock>
              {/* ระยะเดินสายแยกเป็นช่วง — แต่ละช่วงเป็นสายคนละชนิด เอาไปคิดของได้ตรงกว่ายอดรวมก้อนเดียว */}
              <SurveyBlock title="📏 ระยะเดินสาย (เมตร)" sub="วัดทีละช่วง ช่วงไหนไม่มีก็เว้นว่างไว้">
                <div style={two}>
                  {SURVEY_CABLE_LEGS.map((l) => (
                    <React.Fragment key={l.key}>
                      {fld(l.th, <input type="number" value={f[l.key] || ""} onChange={(e) => set(l.key, e.target.value)} placeholder="ม." style={numStyle} />)}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>รวมทุกช่วง</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--primary-dark)" }}>{cableTotal(f)} ม.</span>
                </div>
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 4 && (
            <React.Fragment>
              <SurveyBlock title="🧰 อุปกรณ์ที่เสนอ" sub="ขึ้นในตารางหัวรายงาน — เว้นว่างได้ถ้ายังไม่สรุป">
                {fld("ขนาดระบบ (kW)", <input value={f.sizeKw} onChange={(e) => set("sizeKw", e.target.value)} placeholder="เช่น 6.7" style={inputStyle} />)}
                {/* เลือกรุ่นจากคลังของเรา จะได้ชื่อรุ่นตรงกับที่ตั้งราคาไว้ + ดึง DATA SHEET ไปแนบท้ายรายงานได้
                   ยังพิมพ์เองได้ถ้าเสนอรุ่นที่ยังไม่มีในคลัง */}
                {fld("Inverter", <Dropdown value={f.invModel} onChange={(v) => set("invModel", v)} placeholder="— เลือกจากคลัง —" options={invOptions} wrap addable onAdd={() => {}} />)}
                {fld("แผงโซลาร์", <Dropdown value={f.panelModel} onChange={(v) => set("panelModel", v)} placeholder="— เลือกจากคลัง —" options={panelOptions} wrap addable onAdd={() => {}} />)}
                {fld("Monitoring", <input value={f.monitoring} onChange={(e) => set("monitoring", e.target.value)} placeholder="เช่น Solis S2-WL-ST — WiFi Stick" style={inputStyle} />)}
                {fld("Meter / CT", <input value={f.meterCt} onChange={(e) => set("meterCt", e.target.value)} placeholder="เช่น Solis SDM630MCT V2 5A" style={inputStyle} />)}
              </SurveyBlock>
              <SurveyBlock title="⚠️ ความต้องการพิเศษ" sub="สิ่งที่ลูกค้าขอเป็นพิเศษ / งานที่ต้องแก้เพิ่ม">
                {(f.specials || []).map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <input value={v} onChange={(e) => set("specials", (f.specials || []).map((x, k) => k === i ? e.target.value : x))}
                      placeholder={"ข้อ " + (i + 1) + " เช่น เปลี่ยนลูก CB10A ตำแหน่ง 13 เป็น CB30A"} style={Object.assign({}, inputStyle, { flex: 1 })} />
                    <button type="button" onClick={() => set("specials", (f.specials || []).filter((x, k) => k !== i))}
                      style={{ width: 42, borderRadius: 10, border: "none", background: "#EF444414", color: "#EF4444", cursor: "pointer", flexShrink: 0 }}><Icon name="x" size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => set("specials", (f.specials || []).concat([""]))}
                  style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <Icon name="plus" size={14} color="var(--text-2)" /> เพิ่มข้อ
                </button>
              </SurveyBlock>
              <SurveyBlock title="📝 หมายเหตุ" sub="ขึ้นเป็นกล่องท้ายหน้าแรกของรายงาน">
                <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={4}
                  placeholder={"เช่น\nPV 2STRING 25m. x2\nMAIN MCB100A x1 + ATS100 + ตู้ No.2"}
                  style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.6 })} />
              </SurveyBlock>
            </React.Fragment>
          )}

          {step === 5 && (
            <React.Fragment>
              <SurveyBlock title={"📷 รูปถ่ายบังคับ (" + SURVEY_PHOTO_SLOTS.length + " รูป)"} sub="ถ่ายให้ครบเพื่อให้การสำรวจสมบูรณ์ · แตะรูปเพื่อเขียนลูกศร/ข้อความ">
                {!window.FBDB && <div style={{ fontSize: 12, color: "#EF4444", background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)", borderRadius: 9, padding: "9px 11px" }}>⚠ ต้องเชื่อมต่อ Firebase จึงจะอัปโหลดรูปได้</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {SURVEY_PHOTO_SLOTS.map((slot) => {
                    const shot = media.photos[slot.key] ? Object.assign({ key: slot.key }, media.photos[slot.key]) : null;
                    const idx = shots.findIndex((s) => s.key === slot.key);
                    return (
                      <SurveyShotCard key={slot.key} slot={slot} shot={shot} busy={busySlot === slot.key}
                        n={idx >= 0 ? idx + 1 : null}
                        onPick={(file) => pickPhoto(slot.key, file)}
                        onRemove={() => { if (confirm("ลบรูปนี้?")) media.removePhoto(slot.key); }}
                        onAnn={() => setAnnKey(slot.key)}
                        onField={(k, v) => media.patchPhoto(slot.key, { [k]: v })}
                        onMove={shot ? ((d) => moveShot(slot.key, d)) : null}
                        first={idx <= 0} last={idx === shots.length - 1} />
                    );
                  })}
                </div>
              </SurveyBlock>
              <SurveyBlock title={"🖼️ รูปเพิ่มเติม (" + extras.length + " รูป)"} sub="ถ่ายกี่รูปก็ได้ · ครอปรูปมาแล้วกด Ctrl+V แปะได้เลย · ตั้งหัวข้อ/หมวดหมู่ แล้วรายงานจะจัดกลุ่มให้ตามนี้">
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {extras.map((shot) => {
                    const idx = shots.findIndex((s) => s.key === shot.key);
                    return (
                      <SurveyShotCard key={shot.key} shot={shot} busy={busySlot === shot.key} n={idx + 1}
                        onPick={(file) => pickPhoto(shot.key, file, shot.order)}
                        onRemove={() => { if (confirm("ลบรูปนี้?")) media.removePhoto(shot.key); }}
                        onAnn={() => setAnnKey(shot.key)}
                        onField={(k, v) => media.patchPhoto(shot.key, { [k]: v })}
                        onMove={(d) => moveShot(shot.key, d)}
                        first={idx <= 0} last={idx === shots.length - 1} />
                    );
                  })}
                </div>
                <AddShotButton busy={busySlot && isExtraShot(busySlot)} onPick={addShot} onPaste={pasteFromClipboard} />
              </SurveyBlock>
            </React.Fragment>
          )}
        </div>

        {/* footer */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          {step > 1
            ? <button onClick={() => setStep((s) => s - 1)} style={{ flex: "0 0 auto", padding: "12px 15px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="chevronRight" size={15} color="var(--text-2)" style={{ transform: "scaleX(-1)" }} />{!isMobile && " ย้อนกลับ"}</button>
            : <button onClick={onClose} style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>}
          {step < SURVEY_STEPS.length
            ? <React.Fragment>
                <button onClick={() => save(false)} style={{ flex: "0 0 auto", padding: "12px 15px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>บันทึก</button>
                <button onClick={() => setStep((s) => s + 1)} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>ถัดไป <Icon name="chevronRight" size={16} color="#fff" /></button>
              </React.Fragment>
            : <React.Fragment>
                <button onClick={() => save(true)} style={{ flex: "0 0 auto", padding: "12px 15px", borderRadius: 11, border: "1px solid var(--primary)", background: "var(--primary-soft)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="file" size={15} color="var(--primary-dark)" /> ออกรายงาน</button>
                <button onClick={() => save(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="check" size={16} color="#fff" sw={2.4} /> บันทึก</button>
              </React.Fragment>}
        </div>
      </div>
    </div>
    {annKey && media.photos[annKey] && (
      <AnnEditor shot={Object.assign({ key: annKey }, media.photos[annKey])}
        onClose={() => setAnnKey(null)}
        onSave={(ann) => { media.patchPhoto(annKey, { ann: ann.length ? ann : null }); setAnnKey(null); }} />
    )}
    </React.Fragment>
  );
}

/* ปุ่มเพิ่มรูป — แยกออกมาเพราะต้องมี input file ของตัวเอง */
function AddShotButton({ busy, onPick, onPaste }) {
  const ref = React.useRef(null);
  const btn = { flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px", borderRadius: 11,
    border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: busy ? "default" : "pointer" };
  return (
    <React.Fragment>
      <input ref={ref} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onPick(f); e.target.value = ""; }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => ref.current && ref.current.click()} disabled={busy} style={btn}>
          <Icon name="plus" size={16} color="var(--primary-dark)" sw={2.4} /> {busy ? "กำลังเพิ่มรูป..." : "เพิ่มรูป"}
        </button>
        {/* ครอปรูปอุปกรณ์/ภาพตัดมาแล้วแปะได้เลย ไม่ต้องเซฟเป็นไฟล์ก่อน (กด Ctrl+V ก็ได้) */}
        {onPaste && (
          <button type="button" onClick={onPaste} disabled={busy} style={Object.assign({}, btn, { flex: "0 0 auto", paddingLeft: 15, paddingRight: 15 })} title="วางภาพจากคลิปบอร์ด (Ctrl+V)">
            📋 วางภาพ
          </button>
        )}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, {
  SurveyWizard, surveyStatus, blankSurvey, useSurveyPhotos, AnnOverlay, AnnEditor,
  sortedShots, shotTitle, isExtraShot,
  SURVEY_PHOTO_SLOTS, SURVEY_SLOT_BY, SURVEY_STEPS, SURVEY_ROOF_COND, SURVEY_MDB_SPACE, SURVEY_INV_LOC, SURVEY_PASS, SURVEY_BIRDNET,
  SURVEY_YESNO, SURVEY_CABLE_LEGS, cableTotal, SURVEY_PHOTO_CATS,
});
