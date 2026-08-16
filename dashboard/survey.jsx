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
    /* 3 ช่องนี้เก็บตั้งแต่ตอนสำรวจ เพราะเป็นของที่อยู่บนบิล/หน้างานอยู่แล้ว
       แล้วหน้า "ขออนุญาตการไฟฟ้า" จะดึงไปใช้ต่อ ช่างไม่ต้องกรอกซ้ำ */
    ca: "", meterNo: "", poleNo: "",            // เลขผู้ใช้ไฟฟ้า / เลขมิเตอร์ / เลขเสาไฟต้นที่รับไฟ
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

/* ── คลังรูปแปะ ──
   รูปอุปกรณ์ / ภาพตัดจากดาต้าชีต ที่ลงไว้ล่วงหน้าแล้วหยิบมาแปะทับรูปหน้างานได้ทุกงาน
   1 record = { name, cat, src, r (สูง/กว้าง), at, by } เก็บที่ annStickers */
const STICKER_CATS = ["อินเวอร์เตอร์", "แผงโซลาร์", "ตู้ไฟ / เบรกเกอร์", "อุปกรณ์ยึดจับ", "สายไฟ / ท่อ", "สัญลักษณ์", "อื่นๆ"];

function useStickerLib() {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    if (!window.FBDB) return;
    const ref = window.FBDB.ref("annStickers");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      setItems(Object.keys(v).map((k) => Object.assign({ id: k }, v[k]))
        .sort((a, b) => (a.cat || "").localeCompare(b.cat || "", "th") || (a.name || "").localeCompare(b.name || "", "th")));
    });
    return () => ref.off("value", h);
  }, []);
  const add = React.useCallback((rec) => {
    if (!window.FBDB) return Promise.reject(new Error("ยังไม่ได้เชื่อมต่อฐานข้อมูล"));
    const id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    return window.FBDB.ref("annStickers/" + id).set(Object.assign({ at: new Date().toISOString() }, rec));
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (window.FBDB) window.FBDB.ref("annStickers/" + id).update(fields);
  }, []);
  const remove = React.useCallback((id) => {
    if (window.FBDB) window.FBDB.ref("annStickers/" + id).remove();
  }, []);
  return { items, add, patch, remove };
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
const ANN_COLORS = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#0EA5E9", "#FFFFFF"];

/* วัดขนาดจริงของกรอบที่รูปแสดงอยู่ แล้วเอาไปทำ viewBox
   ของเดิมใช้ aw/ah ของไฟล์รูป — รูปเก่าที่ไม่มีค่านี้จะตกไปใช้ 1000x750 ทำให้ภาพ SVG
   ถูกยืดผิดสัดส่วน หัวลูกศรเลยเบี้ยว · วัดจากกรอบจริงแล้วไม่มีทางเบี้ยว */
function useBoxSize(ref, fallbackW, fallbackH) {
  const [sz, setSz] = React.useState(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => { const r = el.getBoundingClientRect(); if (r.width > 4 && r.height > 4) setSz({ w: r.width, h: r.height }); };
    read();
    const t = setTimeout(read, 120);          // รอรูปโหลดเสร็จอีกรอบ
    window.addEventListener("resize", read);
    return () => { clearTimeout(t); window.removeEventListener("resize", read); };
  }, [ref]);
  return sz || { w: fallbackW || 1000, h: fallbackH || 750 };
}

function AnnOverlay({ ann, aw, ah, edit, sel, svgRef }) {
  const ref = React.useRef(null);
  const box = useBoxSize(ref, aw, ah);
  const list = ann || [];
  const W = box.w, H = box.h;
  const unit = Math.max(W, H) / 100;            // ความหนาเส้นอ้างอิงกับขนาดที่แสดงจริง
  const setRef = (el) => { ref.current = el; if (svgRef) svgRef.current = el; };
  /* จุดจับ — วงกลมเล็ก ๆ ไม่ให้บังรูป แต่วงใสรอบนอก (กับ HANDLE_PX ฝั่งตัวแก้ไข)
     ยังกว้างเท่าเดิม กดโดนง่ายเหมือนของใหญ่ */
  const dot = (cx, cy, k, fill, sc) => {
    const s = sc || 1;
    return (
      <g key={k}>
        <circle cx={cx} cy={cy} r={unit * 3.2 * s} fill="rgba(34,163,91,.16)" />
        <circle data-h={k} cx={cx} cy={cy} r={unit * 1.7 * s} fill={fill || "#fff"}
          stroke={fill ? "#fff" : "var(--primary)"} strokeWidth={unit * 0.5 * s} />
      </g>
    );
  };
  /* ก้านหมุน — ยื่นออกจากขอบบน ปลายก้านเป็นจุดสีเขียวทึบ ให้ต่างจากจุดย่อขยาย
     ถ้าของอยู่ชิดขอบบนจนก้านจะโผล่พ้นรูป (โดนตัดหาย กดไม่โดน) ให้สลับไปยื่นลงล่างแทน */
  const arm = (cx, topY, botY) => {
    const down = topY < unit * 8;
    const ty = down ? botY + unit * 6 : topY - unit * 6;
    return (
      <g key="rot">
        <line x1={cx} y1={down ? botY : topY} x2={cx} y2={ty} stroke="var(--primary)" strokeWidth={unit * 0.5} />
        {dot(cx, ty, "rot", "var(--primary)", 0.78)}
      </g>
    );
  };
  /* หมุดมองไม่เห็นที่มุมขวาบนของสิ่งที่เลือก — อยู่ในกลุ่มเดียวกัน จึงหมุน/ย้ายตามไปด้วย
     ตัวแก้ไขเอาตำแหน่งหมุดนี้ไปวางปุ่มถังขยะ ปุ่มจะเกาะมุมรูปจริงเสมอ ไม่ลอยหลุดตอนรูปถูกหมุน */
  const anchor = (x, y) => <circle data-del="" cx={x} cy={y} r={0.01} fill="none" />;
  const selRect = (x, y, w, h) => (
    <rect x={x} y={y} width={w} height={h} fill="none" stroke="var(--primary)"
      strokeWidth={unit * 0.55} strokeDasharray={unit * 1.6 + " " + unit} rx={unit} />
  );
  return (
    <svg ref={setRef} viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {list.map((a, i) => {
        const on = edit && sel === i;
        const rot = a.rot || 0;
        if (a.t === "i") {
          /* รูปที่แปะทับ (ภาพตัด / รูปอุปกรณ์) — w เป็นสัดส่วนความกว้าง, r = สูง/กว้างของรูปเดิม
             หมุนรอบจุดกึ่งกลางของตัวรูปเอง ย่อขยายก็ยึดจุดกึ่งกลางไว้ ศูนย์กลางจึงไม่ขยับ */
          const x = a.x * W, y = a.y * H, w = (a.w || 0.35) * W, hh = w * (a.r || 0.75);
          const cx = x + w / 2, cy = y + hh / 2;
          return (
            <g key={i} data-ai={i} transform={rot ? "rotate(" + rot + " " + cx + " " + cy + ")" : undefined}>
              <g data-body="">
                <image href={a.src} x={x} y={y} width={w} height={hh} preserveAspectRatio="none" />
                <rect x={x} y={y} width={w} height={hh} fill="none" stroke={a.c || "#FFFFFF"} strokeWidth={unit * 0.5} rx={unit * 0.8} />
              </g>
              {/* กรอบเลือก + จุดจับ โชว์เฉพาะตอนแก้ ไม่ติดไปในรายงาน */}
              {on && selRect(x - unit, y - unit, w + unit * 2, hh + unit * 2)}
              {on && arm(cx, y - unit, y + hh + unit)}
              {on && dot(x + w, y + hh, "size")}
              {on && anchor(x + w + unit, y - unit)}
            </g>
          );
        }
        if (a.t === "a" || a.t === "d") {
          const x1 = a.x1 * W, y1 = a.y1 * H, x2 = a.x2 * W, y2 = a.y2 * H;
          const lw = unit * (a.t === "d" ? 0.95 : 1.15);
          let bx = x2, by = y2, headEl = null;
          if (a.t === "a") {
            const ang = Math.atan2(y2 - y1, x2 - x1);
            const head = lw * 3.4;               // หัวลูกศรผูกกับความหนาเส้น จะได้ได้สัดส่วนเสมอ
            const halfW = head * 0.46;
            bx = x2 - head * Math.cos(ang); by = y2 - head * Math.sin(ang);            // โคนหัวลูกศร
            const nx = -Math.sin(ang), ny = Math.cos(ang);
            const pts = [x2 + "," + y2, (bx + halfW * nx) + "," + (by + halfW * ny), (bx - halfW * nx) + "," + (by - halfW * ny)].join(" ");
            headEl = <polygon points={pts} fill={a.c} strokeLinejoin="round" stroke={a.c} strokeWidth={lw * 0.35} />;
          }
          return (
            <g key={i} data-ai={i}>
              <g data-body="">
                {/* ลูกศร: เส้นหยุดที่โคนหัว ไม่ให้ปลายเส้นล้นออกมาเป็นก้อน · เส้นประ: ลากยาวสุดปลาย */}
                <line x1={x1} y1={y1} x2={bx} y2={by} stroke={a.c} strokeWidth={lw} strokeLinecap="round"
                  strokeDasharray={a.t === "d" ? unit * 2.6 + " " + unit * 1.9 : undefined} />
                {headEl}
              </g>
              {on && dot(x1, y1, "p1")}
              {on && dot(x2, y2, "p2")}
              {on && anchor(Math.max(x1, x2) + unit, Math.min(y1, y2) - unit)}
            </g>
          );
        }
        /* ข้อความ — หมุนรอบจุดเริ่มบรรทัด (จุดที่แตะวางไว้) จุดนี้อยู่กับที่เสมอ */
        const ax = a.x * W, ay = a.y * H;
        const fs = (a.s || 0.055) * W;
        const tw = fs * 0.62 * String(a.v || "").length;
        return (
          <g key={i} data-ai={i} transform={rot ? "rotate(" + rot + " " + ax + " " + ay + ")" : undefined}>
            <g data-body="">
              <text x={ax} y={ay} fill={a.c} fontSize={fs} fontWeight="800"
                stroke="rgba(0,0,0,.55)" strokeWidth={fs * 0.16} paintOrder="stroke"
                style={{ fontFamily: "var(--sans)" }} dominantBaseline="middle">{a.v}</text>
            </g>
            {on && selRect(ax - unit, ay - fs * 0.72, tw + unit * 2, fs * 1.44)}
            {on && arm(ax + tw / 2, ay - fs * 0.72, ay + fs * 0.72)}
            {on && dot(ax + tw + unit, ay + fs * 0.72, "size")}
            {on && anchor(ax + tw + unit * 2, ay - fs * 0.72 - unit)}
          </g>
        );
      })}
    </svg>
  );
}

/* ── คลังรูปแปะ: หน้าต่างเลือก/จัดการ ──
   ลงรูปไว้ล่วงหน้าครั้งเดียว แยกหมวดหมู่ แล้วทุกงานหยิบรูปเดิมมาแปะได้เลย ไม่ต้องก๊อปมาวางใหม่ทุกครั้ง */
function StickerPicker({ onPick, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const lib = useStickerLib();
  const [cat, setCat] = React.useState("");        // "" = ทั้งหมด
  const [manage, setManage] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const fileRef = React.useRef(null);

  const cats = React.useMemo(() => {
    const seen = STICKER_CATS.slice();
    lib.items.forEach((s) => { if (s.cat && seen.indexOf(s.cat) < 0) seen.push(s.cat); });
    return seen;
  }, [lib.items]);
  const shown = lib.items.filter((s) => !cat || (s.cat || "อื่นๆ") === cat);

  // เพิ่มรูปเข้าคลัง — ลงหมวดที่กำลังกรองอยู่ให้เลย จะได้ไม่ต้องมาเลือกซ้ำ
  const addFiles = async (files) => {
    const arr = Array.prototype.slice.call(files || []);
    for (const file of arr) {
      if (file.type.indexOf("image/") !== 0) continue;
      setBusy(file.name);
      try {
        const src = await resizeImageFile(file, 700, 0.78);
        const dim = await new Promise((res) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res({ w: 4, h: 3 }); im.src = src; });
        await lib.add({ name: file.name.replace(/\.[^.]+$/, "").slice(0, 60) || "รูปแปะ", cat: cat || "อื่นๆ", src: src, r: dim.h / dim.w });
      } catch (err) { alert("เพิ่มรูปเข้าคลังไม่สำเร็จ: " + err.message); }
      setBusy("");
    }
  };
  // วางจากคลิปบอร์ดเข้าคลังได้ด้วย (ครอปรูปจากดาต้าชีตมาแล้วเก็บไว้ใช้ซ้ำ)
  React.useEffect(() => {
    const onPaste = (e) => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind !== "file" || items[i].type.indexOf("image/") !== 0) continue;
        const f = items[i].getAsFile();
        if (f) { e.preventDefault(); addFiles([f]); }
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [cat]);

  const chip = (on) => ({ padding: "6px 12px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"), background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.55)", backdropFilter: "blur(3px)", zIndex: 140, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20, width: isMobile ? "100%" : "min(720px,100%)", maxHeight: isMobile ? "92dvh" : "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 90px rgba(8,20,14,.4)" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>คลังรูปแปะ</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>กดรูปเพื่อแปะลงบนรูปหน้างาน · ลงรูปไว้ครั้งเดียวใช้ได้ทุกงาน</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button onClick={() => setManage((m) => !m)}
              style={{ height: 32, padding: "0 12px", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                border: "1px solid " + (manage ? "var(--primary)" : "var(--border-strong)"), background: manage ? "var(--primary-soft)" : "var(--surface)", color: manage ? "var(--primary-dark)" : "var(--text-2)" }}>
              {manage ? "เสร็จแล้ว" : "จัดการ"}
            </button>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 6, overflowX: "auto" }}>
          <button onClick={() => setCat("")} style={chip(!cat)}>ทั้งหมด <span style={{ fontFamily: "var(--mono)", opacity: .7 }}>{lib.items.length}</span></button>
          {cats.map((c) => {
            const n = lib.items.filter((s) => (s.cat || "อื่นๆ") === c).length;
            return <button key={c} onClick={() => setCat(c)} style={chip(cat === c)}>{c} <span style={{ fontFamily: "var(--mono)", opacity: .7 }}>{n}</span></button>;
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14, background: "var(--surface2)" }}>
          {!window.FBDB && <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 10 }}>⚠ ต้องเชื่อมต่อฐานข้อมูลก่อนจึงจะเก็บรูปเข้าคลังได้</div>}
          {!shown.length && <div style={{ padding: "28px 10px", textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>
            ยังไม่มีรูปในหมวดนี้ — กด “เพิ่มรูปเข้าคลัง” ด้านล่าง หรือก๊อปรูปมาแล้วกด Ctrl+V ได้เลย
          </div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(" + (isMobile ? 104 : 128) + "px,1fr))", gap: 10 }}>
            {shown.map((s) => (
              <div key={s.id} style={{ position: "relative", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <button onClick={() => !manage && onPick(s)} disabled={manage}
                  style={{ border: "none", background: "var(--surface3)", borderRadius: 9, padding: 0, height: 76, cursor: manage ? "default" : "pointer", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  <img src={s.src} alt={s.name} style={{ maxWidth: "100%", maxHeight: 76, objectFit: "contain" }} />
                </button>
                {manage ? (
                  <React.Fragment>
                    <input value={s.name || ""} onChange={(e) => lib.patch(s.id, { name: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border)", borderRadius: 7, padding: "4px 7px", fontFamily: "inherit", fontSize: 11.5, background: "var(--surface2)", color: "var(--text-1)" }} />
                    <select value={s.cat || "อื่นๆ"} onChange={(e) => lib.patch(s.id, { cat: e.target.value })}
                      style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--border)", borderRadius: 7, padding: "4px 5px", fontFamily: "inherit", fontSize: 11, background: "var(--surface2)", color: "var(--text-2)" }}>
                      {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => { if (confirm("ลบ “" + (s.name || "รูปนี้") + "” ออกจากคลัง?")) lib.remove(s.id); }}
                      style={{ border: "none", background: "#EF444414", color: "#EF4444", borderRadius: 8, padding: "5px 0", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>🗑 ลบออกจากคลัง</button>
                  </React.Fragment>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 14px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "center" }}>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <button onClick={() => fileRef.current && fileRef.current.click()} disabled={!!busy}
            style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: busy ? "default" : "pointer" }}>
            {busy ? "กำลังเพิ่ม " + busy + "…" : "เพิ่มรูปเข้าคลัง" + (cat ? " › " + cat : "")}
          </button>
        </div>
      </div>
    </div>
  );
}

const ANN_TOOLS = [
  { key: "s", th: "เลือก",   glyph: "✥", hint: "แตะสิ่งที่เขียนไว้เพื่อเลือก · ลากเพื่อย้าย · จุดขาวมุมล่างขวาย่อ-ขยาย · จุดเขียวด้านบนหมุน · ถังขยะลบ" },
  { key: "a", th: "ลูกศร",   glyph: "↗", hint: "ลากจากจุดที่ต้องการชี้ ไปยังปลายลูกศร" },
  { key: "d", th: "เส้นประ", glyph: "╌", hint: "ลากเพื่อตีเส้นประ ใช้บอกแนวเดินสาย / ขอบเขตพื้นที่" },
  { key: "t", th: "ข้อความ", glyph: "ก", hint: "แตะตำแหน่งบนรูป แล้วพิมพ์ข้อความได้เลย" },
  { key: "i", th: "แปะรูป",  glyph: "🖼", hint: "เลือกรูปอุปกรณ์จากคลังมาแปะทับ แล้วลากย้าย/ย่อขยาย/หมุนได้" },
];
const HANDLE_PX = 26;      // รัศมีที่ถือว่าจับโดนจุดจับ (นิ้วอ้วนกว่าเมาส์มาก เผื่อไว้เยอะ ๆ)

/* ตัวเขียนบนรูป — จิ้มลากบนมือถือได้เลย */
function AnnEditor({ shot, onSave, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [tool, setTool] = React.useState("s");        // s เลือก · a ลูกศร · t ข้อความ · i แปะรูป
  const [color, setColor] = React.useState("#EF4444");
  const [ann, setAnn] = React.useState(() => (shot.ann || []).slice());
  const [sel, setSel] = React.useState(null);         // index ของสิ่งที่เลือกอยู่
  const [drag, setDrag] = React.useState(null);       // ลูกศรที่กำลังลากวาดใหม่
  const [grab, setGrab] = React.useState(null);       // สิ่งที่กำลังย้าย/ย่อขยาย
  const [txt, setTxt] = React.useState(null);         // { x, y, v } กล่องพิมพ์ข้อความที่เปิดค้างอยู่
  const [selBox, setSelBox] = React.useState(null);   // กรอบของสิ่งที่เลือก (พิกเซลในกรอบรูป) ไว้วางปุ่มถังขยะ
  const [picker, setPicker] = React.useState(false);
  const boxRef = React.useRef(null);
  const txtRef = React.useRef(null);
  const svgRef = React.useRef(null);
  const W = shot.aw || 1000, H = shot.ah || 750;
  const curTool = ANN_TOOLS.find((t) => t.key === tool) || ANN_TOOLS[0];

  React.useEffect(() => { if (txt && txtRef.current) txtRef.current.focus(); }, [txt && txt.at]);
  React.useEffect(() => { if (sel != null && sel >= ann.length) setSel(null); }, [ann.length]);

  /* วัดกรอบของสิ่งที่เลือกจาก DOM จริง — ข้อความไทยกว้างเท่าไรเดาไม่ได้ ต้องถาม getBBox
     เอาไปวางปุ่มถังขยะให้ลอยอยู่มุมขวาบนของสิ่งนั้นพอดี */
  React.useLayoutEffect(() => {
    if (sel == null || !svgRef.current || !boxRef.current) { setSelBox(null); return; }
    const g = svgRef.current.querySelector('[data-ai="' + sel + '"]');
    const el = g && g.querySelector("[data-del]");
    if (!el) { setSelBox(null); return; }
    /* อ่านตำแหน่งหมุดมุมขวาบนจากที่มันอยู่บนจอจริง — หมุดหมุนไปพร้อมรูป
       ถ้าไปวัดจากกรอบสี่เหลี่ยมแนวตรง พอรูปถูกหมุน ปุ่มจะไปลอยอยู่กลางอากาศ ไม่เกาะรูป */
    const b = el.getBoundingClientRect(), r = boxRef.current.getBoundingClientRect();
    setSelBox({ x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top });
  }, [sel, ann]);

  // แปลงตำแหน่งนิ้ว/เมาส์ → สัดส่วน 0–1 ของรูป + พิกเซลในกรอบ (พิกเซล = หน่วยใน viewBox พอดี)
  const pt = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    const px = t.clientX - r.left, py = t.clientY - r.top;
    return { x: Math.min(1, Math.max(0, px / r.width)), y: Math.min(1, Math.max(0, py / r.height)), px: px, py: py, bw: r.width, bh: r.height };
  };
  const isLine = (a) => a && (a.t === "a" || a.t === "d");
  // ตัวรูป/ตัวอักษรจริง ๆ ไม่รวมกรอบเลือกกับจุดจับ — ใช้วัดขนาดให้ตรงกับที่ตาเห็น
  const bodyOf = (i) => {
    const g = svgRef.current && svgRef.current.querySelector('[data-ai="' + i + '"]');
    return g ? (g.querySelector("[data-body]") || g) : null;
  };
  /* จุดที่ของสิ่งนั้นหมุนรอบ — รูปหมุนรอบกลางตัว ข้อความหมุนรอบจุดเริ่มบรรทัด
     ทั้งสองจุดคำนวณตรง ๆ ได้ ไม่ต้องพึ่งกรอบที่วัดจาก DOM จึงไม่เพี้ยนระหว่างลาก */
  const rotCenter = (a, p) => {
    if (a.t !== "i") return { x: a.x * p.bw, y: a.y * p.bh };
    const w = (a.w || 0.35) * p.bw;
    return { x: a.x * p.bw + w / 2, y: a.y * p.bh + w * (a.r || 0.75) / 2 };
  };
  // หมุนตำแหน่งนิ้วย้อนกลับ เพื่อเทียบกับกรอบตอนยังไม่หมุน (getBBox ให้ค่าก่อนหมุนเสมอ)
  const unrot = (a, p) => {
    const deg = a.rot || 0;
    if (!deg) return { x: p.px, y: p.py };
    const c = rotCenter(a, p), th = -deg * Math.PI / 180;
    const dx = p.px - c.x, dy = p.py - c.y;
    return { x: c.x + dx * Math.cos(th) - dy * Math.sin(th), y: c.y + dx * Math.sin(th) + dy * Math.cos(th) };
  };
  /* จุดจับของสิ่งที่เลือก — อ่านตำแหน่งจากวงกลมที่วาดไว้จริง ๆ ในภาพ
     ตาเห็นจุดตรงไหน กดตรงนั้นก็โดน แม้สิ่งนั้นจะถูกหมุนไปแล้ว */
  const handlesOf = (i) => {
    const g = svgRef.current && svgRef.current.querySelector('[data-ai="' + i + '"]');
    if (!g || !boxRef.current) return [];
    const r = boxRef.current.getBoundingClientRect();
    return Array.prototype.map.call(g.querySelectorAll("[data-h]"), (el) => {
      const b = el.getBoundingClientRect();
      return { k: el.getAttribute("data-h"), x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top };
    });
  };
  /* หาว่าจิ้มโดนอันไหน — ไล่จากใบบนสุดลงมา
     รูป/ข้อความวัดจากกรอบจริงใน SVG · เส้นวัดระยะห่างจากตัวเส้น (กรอบสี่เหลี่ยมของเส้นเฉียงมันกว้างเกินจริง) */
  const hitAt = (p) => {
    for (let i = ann.length - 1; i >= 0; i--) {
      const a = ann[i];
      if (isLine(a)) {
        const x1 = a.x1 * p.bw, y1 = a.y1 * p.bh, x2 = a.x2 * p.bw, y2 = a.y2 * p.bh;
        const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((p.px - x1) * dx + (p.py - y1) * dy) / len2));
        const d = Math.hypot(p.px - (x1 + t * dx), p.py - (y1 + t * dy));
        if (d <= 14) return i;
        continue;
      }
      const el = bodyOf(i);
      if (!el) continue;
      const b = el.getBBox(), q = unrot(a, p);
      if (q.x >= b.x - 4 && q.x <= b.x + b.width + 4 && q.y >= b.y - 4 && q.y <= b.y + b.height + 4) return i;
    }
    return null;
  };

  const down = (e) => {
    if (txt) return;
    const p = pt(e);
    if (tool === "t") { setTxt({ x: p.x, y: p.y, v: "", at: Date.now() }); return; }
    if (tool === "a" || tool === "d") { e.preventDefault(); setSel(null); setDrag({ t: tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y, c: color }); return; }
    // โหมดเลือก — จับจุดจับของอันที่เลือกอยู่ก่อน (เอาจุดที่ใกล้ที่สุด) แล้วค่อยดูว่าจิ้มโดนอันไหน
    if (sel != null) {
      let h = null, best = HANDLE_PX;
      handlesOf(sel).forEach((g) => {
        const d = Math.hypot(p.px - g.x, p.py - g.y);
        if (d <= best) { best = d; h = g; }
      });
      if (h) {
        e.preventDefault();
        const a = ann[sel];
        const el = bodyOf(sel);
        const b = el ? el.getBBox() : { width: 1 };
        const c = rotCenter(a, p);
        setGrab({
          i: sel, mode: h.k, w0: b.width || 1, s0: a.s || 0.055, cx: c.x, cy: c.y,
          a0: Math.atan2(p.py - c.y, p.px - c.x) * 180 / Math.PI - (a.rot || 0),
        });
        return;
      }
    }
    const hit = hitAt(p);
    setSel(hit);
    if (hit == null) return;
    e.preventDefault();
    const a = ann[hit];
    setGrab(isLine(a)
      ? { i: hit, mode: "moveLine", dx: p.x - a.x1, dy: p.y - a.y1, span: { x: a.x2 - a.x1, y: a.y2 - a.y1 } }
      : { i: hit, mode: "move", dx: p.x - a.x, dy: p.y - a.y });
  };
  const move = (e) => {
    if (grab) {
      e.preventDefault();
      const p = pt(e);
      setAnn((list) => list.map((a, j) => {
        if (j !== grab.i) return a;
        if (grab.mode === "rot") {
          // หมุนตามนิ้ว · ใกล้แนวตรง (0/90/180/270) ให้ดูดเข้าองศาพอดี จะได้วางตรงง่าย ๆ
          let d = Math.atan2(p.py - grab.cy, p.px - grab.cx) * 180 / Math.PI - grab.a0;
          d = ((d % 360) + 360) % 360;
          const snap = [0, 90, 180, 270, 360].find((s) => Math.abs(d - s) <= 4);
          return Object.assign({}, a, { rot: snap == null ? Math.round(d * 10) / 10 : snap % 360 });
        }
        if (grab.mode === "size") {
          const q = unrot(a, p);
          if (a.t === "i") {
            // รูป = เปลี่ยนความกว้าง (สูงตามสัดส่วนเดิม) โดยตรึงจุดกึ่งกลางไว้ ตอนหมุนอยู่จะได้ไม่ดีดหนี
            const halfW = Math.max(p.bw * 0.025, Math.abs(q.x - grab.cx));
            const w = Math.min(1.4, halfW * 2 / p.bw), hh = w * p.bw * (a.r || 0.75);
            return Object.assign({}, a, { w: w, x: (grab.cx - halfW) / p.bw, y: (grab.cy - hh / 2) / p.bh });
          }
          const f = Math.max(0.25, (q.x - grab.cx) / (grab.w0 || 1));      // ข้อความ = ขยายขนาดตัวอักษรตามที่ลาก
          return Object.assign({}, a, { s: Math.min(0.4, Math.max(0.02, grab.s0 * f)) });
        }
        if (grab.mode === "p1") return Object.assign({}, a, { x1: p.x, y1: p.y });
        if (grab.mode === "p2") return Object.assign({}, a, { x2: p.x, y2: p.y });
        if (grab.mode === "moveLine") {
          const nx = p.x - grab.dx, ny = p.y - grab.dy;
          return Object.assign({}, a, { x1: nx, y1: ny, x2: nx + grab.span.x, y2: ny + grab.span.y });
        }
        return Object.assign({}, a, { x: Math.max(0, Math.min(1, p.x - grab.dx)), y: Math.max(0, Math.min(1, p.y - grab.dy)) });
      }));
      return;
    }
    if (!drag) return;
    e.preventDefault();
    const p = pt(e);
    setDrag((d) => Object.assign({}, d, { x2: p.x, y2: p.y }));
  };
  const up = () => {
    if (grab) { setGrab(null); return; }
    if (!drag) return;
    const far = Math.abs(drag.x2 - drag.x1) > 0.03 || Math.abs(drag.y2 - drag.y1) > 0.03;
    if (far) { setAnn((a) => a.concat([drag])); setSel(ann.length); setTool("s"); }
    setDrag(null);
  };

  const commitText = () => {
    const v = (txt.v || "").trim();
    if (v) { setAnn((a) => a.concat([{ t: "t", x: txt.x, y: txt.y, v: v, c: color, s: 0.055 }])); setSel(ann.length); setTool("s"); }
    setTxt(null);
  };
  const removeSel = () => { if (sel == null) return; setAnn((a) => a.filter((x, j) => j !== sel)); setSel(null); };
  // เปลี่ยนสีของอันที่เลือกอยู่ไปด้วย จะได้ไม่ต้องลบแล้วเขียนใหม่
  const pickColor = (c) => {
    setColor(c);
    if (sel != null) setAnn((a) => a.map((x, j) => j === sel ? Object.assign({}, x, { c: c }) : x));
  };

  /* แปะรูปจากคลังลงบนรูปหน้างาน — เก็บ dataUrl ไว้ในตัว annotation เลย
     รูปในคลังถูกลบทีหลังก็ไม่กระทบรูปที่แปะไปแล้ว และติดไปถึงตอนออกรายงาน */
  const useSticker = (s) => {
    setAnn((a) => a.concat([{ t: "i", src: s.src, x: 0.28, y: 0.28, w: 0.36, r: s.r || 0.75, c: color }]));
    setSel(ann.length);
    setTool("s");            // แปะแล้วเข้าโหมดเลือกทันที ลากวาง/ย่อขยาย/ลบต่อได้เลย
    setPicker(false);
  };

  const ghost = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 38, padding: "0 14px", borderRadius: 10,
    border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.62)", backdropFilter: "blur(3px)", zIndex: 130, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 20, width: isMobile ? "100%" : "min(880px,100%)", maxHeight: isMobile ? "96dvh" : "94vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 90px rgba(8,20,14,.4)" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.01em" }}>เขียนบนรูป</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{curTool.hint}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 14, background: "var(--surface2)", display: "grid", placeItems: "center" }}>
          <div style={{ position: "relative", maxWidth: "100%" }}>
            <div ref={boxRef} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
              onTouchStart={down} onTouchMove={move} onTouchEnd={up}
              style={{ position: "relative", touchAction: "none", userSelect: "none", lineHeight: 0, borderRadius: 12, overflow: "hidden",
                border: "1px solid var(--border)", boxShadow: "0 6px 24px rgba(8,20,14,.14)",
                cursor: tool === "s" ? (sel == null ? "default" : "move") : tool === "t" ? "text" : "crosshair" }}>
              <img src={shot.dataUrl} alt="" draggable={false} style={{ display: "block", maxWidth: "100%", maxHeight: isMobile ? "52dvh" : "58vh", width: "auto" }} />
              <AnnOverlay ann={drag ? ann.concat([drag]) : ann} aw={W} ah={H} edit sel={sel} svgRef={svgRef} />
            </div>
            {/* ปุ่มลบของสิ่งที่เลือก — ลอยมุมขวาบนของมันเอง กดลบได้ทันทีทั้งลูกศร ข้อความ และรูปที่แปะ */}
            {sel != null && selBox && !txt && (
              <button onClick={removeSel} title="ลบสิ่งที่เลือก"
                style={{ position: "absolute", left: selBox.x, top: selBox.y, transform: "translate(-40%,-60%)", zIndex: 4,
                  width: 30, height: 30, borderRadius: 99, border: "2px solid var(--surface)", background: "#EF4444", color: "#fff",
                  cursor: "pointer", display: "grid", placeItems: "center", fontSize: 13, boxShadow: "0 3px 10px rgba(0,0,0,.3)" }}>🗑</button>
            )}
            {/* กล่องพิมพ์ข้อความ — วางตรงจุดที่แตะ (ของเดิมใช้ prompt() ซึ่งเว็บแอปบล็อก เลยพิมพ์ไม่ได้เลย) */}
            {txt && (
              <div style={{ position: "absolute", left: (txt.x * 100) + "%", top: (txt.y * 100) + "%", transform: "translate(-6px,-50%)", zIndex: 3, display: "flex", gap: 6, alignItems: "center", background: "var(--surface)", border: "1px solid var(--primary)", borderRadius: 10, padding: 5, boxShadow: "0 8px 24px rgba(8,20,14,.25)" }}>
                <input ref={txtRef} value={txt.v} onChange={(e) => setTxt(Object.assign({}, txt, { v: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") commitText(); if (e.key === "Escape") setTxt(null); }}
                  placeholder="พิมพ์ข้อความ…" style={{ width: 168, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--text-1)" }} />
                <button onClick={commitText} style={{ border: "none", background: "var(--primary)", color: "#fff", borderRadius: 8, height: 28, padding: "0 11px", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>ใส่</button>
                <button onClick={() => setTxt(null)} style={{ border: "none", background: "var(--surface3)", color: "var(--text-2)", borderRadius: 8, width: 28, height: 28, cursor: "pointer" }}>✕</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* เครื่องมือ — กลุ่มเดียวแบบ segmented ปุ่มเท่ากันหมด ไม่ยาวลากยาวเหมือนของเดิม */}
          <div style={{ display: "inline-flex", background: "var(--surface3)", borderRadius: 11, padding: 3, gap: 2 }}>
            {ANN_TOOLS.map((t) => {
              const on = t.key === tool;
              return (
                <button key={t.key} onClick={() => { if (t.key === "i") { setPicker(true); return; } setTool(t.key); if (t.key !== "s") setSel(null); }} title={t.hint}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 32, padding: "0 11px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
                    background: on ? "var(--surface)" : "transparent", color: on ? "var(--primary-dark)" : "var(--text-2)",
                    boxShadow: on ? "0 1px 3px rgba(0,0,0,.1)" : "none", transition: "all .15s" }}>
                  <span style={{ fontSize: 13 }}>{t.glyph}</span>{!isMobile && t.th}
                </button>
              );
            })}
          </div>
          <span style={{ display: "inline-flex", gap: 5 }}>
            {ANN_COLORS.map((c) => (
              <button key={c} onClick={() => pickColor(c)} aria-label={"สี " + c}
                style={{ width: 26, height: 26, borderRadius: 99, cursor: "pointer", background: c, transition: "transform .12s",
                  transform: color === c ? "scale(1.14)" : "none",
                  border: color === c ? "2.5px solid var(--primary-dark)" : "1px solid rgba(0,0,0,.18)" }} />
            ))}
          </span>
          <span style={{ flex: 1 }} />
          {sel != null && <button onClick={removeSel} style={Object.assign({}, ghost, { borderColor: "#EF4444", color: "#EF4444" })}>🗑 ลบที่เลือก</button>}
          <button onClick={() => { setAnn((a) => a.slice(0, -1)); setSel(null); }} disabled={!ann.length} style={Object.assign({}, ghost, { opacity: ann.length ? 1 : .4 })}>↶ เลิกทำ</button>
          <button onClick={() => { setAnn([]); setSel(null); }} disabled={!ann.length} style={Object.assign({}, ghost, { opacity: ann.length ? 1 : .4 })}>ล้าง</button>
        </div>
        <div style={{ padding: "12px 14px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => onSave(ann)} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(34,163,91,.3)" }}>บันทึกที่เขียน</button>
        </div>
      </div>
      {picker && <StickerPicker onPick={useSticker} onClose={() => setPicker(false)} />}
    </div>
  );
}

/* ── หัวข้อย่อยในฟอร์ม ──
   สัญลักษณ์นำหน้าชื่อหัวข้อจะถูกดึงออกมาใส่ในวงกลมสีอ่อนด้านซ้าย
   ตัวหัวข้อจะได้เหลือแต่ตัวหนังสือ อ่านง่าย ไม่ใช่อีโมจิลอยปนกับข้อความ */
function SurveyBlock({ title, sub, children }) {
  const m = /^(\S+)\s+([\s\S]+)$/.exec(String(title || ""));
  const glyph = m && !/[ก-๙A-Za-z0-9]/.test(m[1]) ? m[1] : "";
  const head = glyph ? m[2] : title;
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "15px 16px 16px", display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 2px rgba(8,20,14,.04)" }}>
      <header style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {glyph && <span style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--primary-soft)", fontSize: 15, lineHeight: 1 }}>{glyph}</span>}
        <span style={{ minWidth: 0, paddingTop: glyph ? 2 : 0 }}>
          <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.005em" }}>{head}</span>
          {sub && <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)", marginTop: 2, lineHeight: 1.45 }}>{sub}</span>}
        </span>
      </header>
      {children}
    </section>
  );
}

/* คำถามตอบสั้น ๆ (มี/ไม่มี, ผ่าน/ไม่ผ่าน) — ชื่อคำถามซ้าย ปุ่มชิดขวา
   ของเดิมเอา Segmented ไปวางใต้ป้ายในช่องกริดครึ่งจอ ป้ายยาว ๆ เลยตัดบรรทัด
   แล้วปุ่มไปลอยอยู่ล่างสุดดูยาวผิดรูป · แบบแถวนี้กว้างเท่าไรก็ไม่เพี้ยน */
function SurveyToggle({ label, hint, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 11 }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.35 }}>{label}</span>
        {hint && <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{hint}</span>}
      </span>
      <span style={{ flexShrink: 0 }}><Segmented value={value} onChange={onChange} options={options} /></span>
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
    <div style={{ border: "1px solid " + (has ? "var(--border)" : "var(--border-strong)"), borderRadius: 13, padding: 11,
      borderLeft: "3px solid " + (has ? "var(--primary)" : "var(--surface3)"),
      background: has ? "var(--surface)" : "var(--surface2)", display: "flex", flexDirection: "column", gap: 10, transition: "border-color .2s" }}>
      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
        {has ? (
          /* มีรูปแล้ว — โชว์รูปย่อพร้อมเลขลำดับมุมบนซ้าย แตะเพื่อเขียนทับได้ทันที */
          <span style={{ position: "relative", flexShrink: 0, lineHeight: 0 }}>
            <img src={shot.dataUrl} alt="" onClick={() => onAnn && onAnn()} style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", cursor: "pointer", border: "1px solid var(--border)" }} />
            <span style={{ position: "absolute", top: -5, left: -5, width: 20, height: 20, borderRadius: 99, display: "grid", placeItems: "center",
              background: "var(--primary)", color: "#fff", fontSize: 10.5, fontWeight: 800, fontFamily: "var(--mono)", border: "2px solid var(--surface)" }}>{n || "✓"}</span>
          </span>
        ) : (
          <span style={{ width: 54, height: 54, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center",
            background: "var(--surface3)", border: "1px dashed var(--border-strong)" }}>
            <Icon name="image" size={17} color="var(--text-3)" />
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
            <button type="button" onClick={onAnn} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 9,
              border: "1px solid " + (shot.ann && shot.ann.length ? "var(--primary)" : "var(--border-strong)"),
              background: shot.ann && shot.ann.length ? "var(--primary-soft)" : "var(--surface)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ↗ เขียน / แปะรูปทับ
              {shot.ann && shot.ann.length ? <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, background: "var(--primary)", color: "#fff", borderRadius: 99, padding: "1px 6px" }}>{shot.ann.length}</span> : null}
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
    // ตอนเปิดหน้าต่างเขียนทับรูปอยู่ ปล่อยให้ที่นั่นรับ Ctrl+V ไปแปะ "ในรูป" แทน
    // ไม่งั้นวางทีเดียวจะได้ทั้งรูปใหม่และรูปแปะทับพร้อมกัน
    if (step !== 5 || annKey) return;
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
  }, [step, annKey, shots.length]);

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

  /* ป้ายชื่อช่อง — ตัวหนังสือปกติ ไม่บังคับตัวพิมพ์ใหญ่/ไม่ถ่างตัวอักษร
     ภาษาไทยถ่างตัวอักษรแล้วอ่านยาก และดูเป็นแดชบอร์ดสำเร็จรูปมากกว่าเอกสารงานจริง */
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", lineHeight: 1.3 };
  const fld = (label, child, req) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        <div style={{ padding: "15px 18px 13px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 700, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 7px", borderRadius: 6 }}>{job ? job.code : ""}</span>
                แบบสำรวจหน้างาน
              </div>
              <h2 style={{ fontSize: 17.5, fontWeight: 800, color: "var(--text-1)", margin: "4px 0 0", letterSpacing: "-.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "var(--display)" }}>{job ? job.name : ""}</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
              {/* วงแหวนบอกความคืบหน้า — เห็นทีเดียวว่ากรอกไปกี่ % แล้ว */}
              <span style={{ position: "relative", width: 38, height: 38, borderRadius: 99, display: "grid", placeItems: "center",
                background: "conic-gradient(" + st.color + " " + (st.pct * 3.6) + "deg, var(--surface3) 0deg)" }}>
                <span style={{ position: "absolute", inset: 3.5, borderRadius: 99, background: "var(--surface)" }} />
                <span style={{ position: "relative", fontSize: 10.5, fontWeight: 800, color: st.color, fontFamily: "var(--mono)" }}>{st.pct}</span>
              </span>
              <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
            </div>
          </div>
          {/* ขั้นตอน — เลขขั้นในวงกลม ขั้นที่ผ่านแล้วขึ้นเครื่องหมายถูก กดข้ามไปขั้นไหนก็ได้ */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 14 }}>
            {SURVEY_STEPS.map((s, i) => {
              const active = s.n === step, done = s.n < step;
              return (
                <React.Fragment key={s.n}>
                  {i > 0 && <span style={{ flex: 1, height: 2, borderRadius: 99, background: done || active ? "var(--primary)" : "var(--surface3)", transition: "background .2s" }} />}
                  <button onClick={() => setStep(s.n)} title={s.th}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: active ? "var(--primary-soft)" : "transparent", border: "none", cursor: "pointer",
                      fontFamily: "inherit", padding: active && !isMobile ? "4px 11px 4px 4px" : 4, borderRadius: 99, flexShrink: 0 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 99, display: "grid", placeItems: "center", flexShrink: 0,
                      fontSize: 11.5, fontWeight: 800, fontFamily: "var(--mono)", transition: "all .2s",
                      background: done ? "var(--primary)" : active ? "var(--primary)" : "var(--surface3)",
                      color: done || active ? "#fff" : "var(--text-3)",
                      boxShadow: active ? "0 0 0 3px var(--primary-soft)" : "none" }}>
                      {done ? <Icon name="check" size={13} color="#fff" sw={2.8} /> : s.n}
                    </span>
                    {active && !isMobile && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary-dark)", whiteSpace: "nowrap" }}>{s.th}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          {isMobile && <div style={{ marginTop: 7, fontSize: 12, fontWeight: 700, color: "var(--primary-dark)" }}>{(SURVEY_STEPS[step - 1] || {}).th}</div>}
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
              <SurveyBlock title="⚡ มิเตอร์ & เมนไฟฟ้าเดิม" sub="ลอกจากบิลค่าไฟและตัวมิเตอร์ให้ตรงเป๊ะ — หน้าขออนุญาตการไฟฟ้าจะดึงชุดนี้ไปใช้ต่อ">
                <div style={two}>
                  {fld("ขนาดมิเตอร์ไฟฟ้า", <input value={f.meterSize} onChange={(e) => set("meterSize", e.target.value)} placeholder="เช่น 15(45)A" style={inputStyle} />, true)}
                  {fld("การไฟฟ้า", <Dropdown value={f.meterAuth} onChange={(v) => set("meterAuth", v)} placeholder="— เลือก —" options={SURVEY_METER_AUTH} />)}
                  {fld("หมายเลขผู้ใช้ไฟฟ้า (CA)", <input inputMode="numeric" value={f.ca} onChange={(e) => set("ca", e.target.value)} placeholder="เลข 12 หลักบนบิลค่าไฟ" style={inputStyle} />)}
                  {fld("หมายเลขมิเตอร์", <input value={f.meterNo} onChange={(e) => set("meterNo", e.target.value)} placeholder="ตัวเลขบนหน้าปัดมิเตอร์" style={inputStyle} />)}
                </div>
                {fld("หมายเลขเสาไฟต้นที่รับไฟ", <input value={f.poleNo} onChange={(e) => set("poleNo", e.target.value)} placeholder="อ่านจากป้ายบนเสา เช่น 5FA-01-234" style={inputStyle} />)}
                <SurveyToggle label="ระบบไฟฟ้า" hint="จำเป็นต้องระบุ" value={f.phase} onChange={(v) => set("phase", v)} options={[{ value: "1", label: "1 เฟส" }, { value: "3", label: "3 เฟส" }]} />
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <SurveyToggle label="โครงสร้างรับน้ำหนัก" value={f.structureOk} onChange={(v) => set("structureOk", v)} options={SURVEY_PASS} />
                  <SurveyToggle label="ตาข่ายกันนก" value={f.birdNet} onChange={(v) => set("birdNet", v)} options={SURVEY_BIRDNET} />
                </div>
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
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <SurveyToggle label="มีเซฟตี้คัต" value={f.mdbSafety} onChange={(v) => set("mdbSafety", v)} options={SURVEY_YESNO} />
                  <SurveyToggle label="เมนเป็นชนิดกันดูด" hint="RCD / RCCB" value={f.mdbRccb} onChange={(v) => set("mdbRccb", v)} options={SURVEY_YESNO} />
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
              <SurveyBlock title={"📷 รูปถ่ายบังคับ (" + SURVEY_PHOTO_SLOTS.length + " รูป)"} sub="ถ่ายให้ครบเพื่อให้การสำรวจสมบูรณ์ · แตะรูปเพื่อเขียนลูกศร ข้อความ หรือแปะรูปอุปกรณ์ทับ">
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
              <SurveyBlock title={"🖼️ รูปเพิ่มเติม (" + extras.length + " รูป)"} sub="ถ่ายกี่รูปก็ได้ · ครอปรูปมาแล้วกด Ctrl+V เพิ่มเป็นรูปใหม่ได้เลย · ตั้งหัวข้อ/หมวดหมู่ แล้วรายงานจะจัดกลุ่มให้ตามนี้">
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
  useStickerLib, StickerPicker, STICKER_CATS,
  sortedShots, shotTitle, isExtraShot,
  SURVEY_PHOTO_SLOTS, SURVEY_SLOT_BY, SURVEY_STEPS, SURVEY_ROOF_COND, SURVEY_MDB_SPACE, SURVEY_INV_LOC, SURVEY_PASS, SURVEY_BIRDNET,
  SURVEY_YESNO, SURVEY_CABLE_LEGS, cableTotal, SURVEY_PHOTO_CATS,
});
