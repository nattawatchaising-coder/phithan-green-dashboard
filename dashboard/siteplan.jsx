/* ============================================================
   PHITHAN GREEN — ผังหน้างาน (Site Plan)
   เครื่องมือวาดทับรูปหน้างาน: วัดระยะสาย · วางจุดอุปกรณ์ · ประเมินของเบื้องต้น
   - เก็บที่ surveyPlans/{jobId} (RTDB base64) · ไม่มี Firebase → localStorage
   - พิกัดทุกจุดเก็บเป็นสัดส่วน 0..1 ของรูป (สเกลตามจอได้)
   - วัดระยะ: คาลิเบรตเส้นอ้างอิง (px ธรรมชาติ → เมตร) และ/หรือ พิมพ์เอง/เส้น
   ============================================================ */

// ชนิดเส้น (สาย/ท่อ) — สี + %เผื่อ
const PLAN_LINE_KINDS = [
  { key: "dc",      label: "สาย DC (PV)", color: "#EF4444", spare: 10 },
  { key: "ac",      label: "สาย AC",      color: "#3B82F6", spare: 10 },
  { key: "ground",  label: "สายกราวด์",   color: "#16A34A", spare: 10 },
  { key: "lan",     label: "สาย LAN",     color: "#F59E0B", spare: 10 },
  { key: "conduit", label: "ท่อร้อยสาย",  color: "#7C5CFC", spare: 5 },
];
const PLAN_LINE_BY = {}; PLAN_LINE_KINDS.forEach((k) => { PLAN_LINE_BY[k.key] = k; });
// ชนิดการเดินสาย/ท่อ (ต่อเส้น) + ขนาดสายมาตรฐาน + ขนาดท่อ
const PLAN_CONDUITS = [
  { key: "none",    label: "เดินลอย/ไม่มีท่อ", short: "เดินลอย", spare: 5 },
  { key: "imc",     label: "ท่อ IMC",          short: "IMC",     spare: 5 },
  { key: "upvc",    label: "ท่อ uPVC",         short: "uPVC",    spare: 5 },
  { key: "flex",    label: "ท่ออ่อน (Flex)",   short: "Flex",    spare: 8 },
  { key: "ceiling", label: "เดินใต้ฝ้า",        short: "ใต้ฝ้า",   spare: 5 },
  { key: "buried",  label: "ฝังดิน/ฝังผนัง",    short: "ฝังดิน",   spare: 8 },
];
const PLAN_CONDUIT_BY = {}; PLAN_CONDUITS.forEach((c) => { PLAN_CONDUIT_BY[c.key] = c; });
const PLAN_WIRE_SQMM = [2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
const PLAN_WIRE_CORES = [1, 2, 3, 4, 5]; // จำนวนแกนสาย (1C/2C/3C/4C/5C)
const PLAN_CONDUIT_SIZES = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"'];

// ชนิดจุดอุปกรณ์ (แผงโซลาร์แยกไปเป็นบล็อกขนาดจริง — ดู PLAN_PANEL_*)
const PLAN_MARKER_KINDS = [
  { key: "inverter", label: "อินเวอร์เตอร์", color: "#7C5CFC", icon: "bolt" },
  { key: "combiner", label: "Combiner",     color: "#0EA5E9", icon: "box" },
  { key: "mdb",      label: "ตู้ MDB",       color: "#EF4444", icon: "grid" },
  { key: "meter",    label: "มิเตอร์",       color: "#F59E0B", icon: "pin" },
  { key: "ground",   label: "จุดกราวด์",     color: "#84CC16", icon: "pin" },
];
const PLAN_MARKER_BY = {}; PLAN_MARKER_KINDS.forEach((k) => { PLAN_MARKER_BY[k.key] = k; });
PLAN_MARKER_BY.array = { key: "array", label: "แผงโซลาร์", color: "#16A34A", icon: "panel" }; // legacy: จุดแผงแบบเก่า
PLAN_MARKER_BY.camera = { key: "camera", label: "จุดกล้อง", color: "#F59E0B", icon: "pin" };  // จุดแนบรูปวางได้อิสระ (ไม่นับเป็นอุปกรณ์)

// แผงโซลาร์ตามขนาดจริง — ค่าตั้งต้น (เมตร) ด้านสั้น × ด้านยาว, ช่องว่างระหว่างแผง
const PLAN_PANEL_SHORT = 1.13;   // ด้านสั้นของแผงมาตรฐาน (~1134 มม.)
const PLAN_PANEL_LONG  = 2.28;   // ด้านยาว (แผง 550–600W ~2278 มม.)
const PLAN_PANEL_GAP   = 0.02;   // ช่องว่างระหว่างแผง (เมตร)
const PLAN_PANEL_COLOR = "#1D4ED8";

// ไมโครอินเวอร์เตอร์ + สายเชื่อมสตริง
const PLAN_MICRO_COLOR = "#0F172A";
const PLAN_MICRO_PANELS = 2;                 // จำนวนแผงต่อไมโครเริ่มต้น
const PLAN_WP_DEFAULT = 650;                 // วัตต์ต่อแผงเริ่มต้น
const PLAN_LINK_COLORS = ["#06B6D4", "#EAB308", "#EC4899", "#22C55E", "#F97316", "#6366F1"]; // สีสตริง/สายเชื่อม
const PLAN_AC_TRUNK_COLOR = "#2563EB"; // สาย AC เมน (ไมโครตัวสุดท้าย → ตู้คอมบายเนอร์) — คิดขนาดเป็น CV-FD
const PLAN_AC_FEED_COLOR = "#7C3AED";  // สาย AC เข้าตู้ลูกค้า (ตู้คอมบายเนอร์ → ตู้ MDB) — คิดขนาดเป็น CV-FD
const PLAN_XPAGE_COLOR = "#DB2777";    // จุดต่อรูป (แนวท่อ/สายวิ่งข้ามไปอีกรูป) — ปักหมุดคู่ทั้งสองหน้า

// โหลด/บันทึกผังของงาน (RTDB หรือ localStorage)
function useSitePlan(jobId) {
  const KEY = "sf_siteplan_" + jobId;
  const [plan, setPlan] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!jobId) { setPlan(null); setLoading(false); return; }
    if (window.FBDB) {
      const ref = window.FBDB.ref("surveyPlans/" + jobId);
      const h = ref.on("value", (s) => { setPlan(s.val() || null); setLoading(false); });
      return () => ref.off("value", h);
    }
    try { const v = localStorage.getItem(KEY); setPlan(v ? JSON.parse(v) : null); } catch (e) { setPlan(null); }
    setLoading(false);
  }, [jobId]);
  const save = React.useCallback((data) => {
    if (!jobId) return;
    if (window.FBDB) window.FBDB.ref("surveyPlans/" + jobId).set(data);
    else { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} setPlan(data); }
  }, [jobId]);
  return { plan, loading, save };
}

let _planSeq = 0;
const _pid = (p) => (p || "x") + "-" + Date.now().toString(36) + "-" + (_planSeq++);

function SitePlanEditor({ job, onClose, currentUser }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const { plan, loading, save } = useSitePlan(job ? job.id : null);
  // รุ่นแผงจากคลัง (หมวด panel) — ใช้ขนาด/Wp มาวางแผง (แก้ขนาดที่หน้าคลัง)
  const stock = useStockStore();
  const panelModels = React.useMemo(
    () => (stock.items || []).filter((it) => it.cat === "panel"),
    [stock.items]
  );

  // ── working state ──
  const [image, setImage] = React.useState(null);       // dataUrl
  const [imgDim, setImgDim] = React.useState({ w: 0, h: 0 }); // natural px ของรูปที่เก็บ
  const [mpp, setMpp] = React.useState(null);           // เมตร/พิกเซลธรรมชาติ (คาลิเบรต)
  const [calib, setCalib] = React.useState(null);       // { a:{x,y}, b:{x,y}, meters }
  const [lines, setLines] = React.useState([]);         // [{id,kind,pts:[{x,y}],manualM}]
  const [markers, setMarkers] = React.useState([]);     // [{id,kind,x,y}]
  const [panels, setPanels] = React.useState([]);       // [{id,x,y,cols,rows,pw,ph,rot}] แผงตามขนาดจริง (x,y=จุดกลาง fraction; pw,ph=เมตร)
  const [micros, setMicros] = React.useState([]);       // [{id,x,y,n}] ไมโครอินเวอร์เตอร์ (n=จำนวนแผงที่รับ)
  const [links, setLinks] = React.useState([]);         // [{id,from,to,color}] สายเชื่อมระหว่างไมโคร (อ้าง id)
  const [notes, setNotes] = React.useState([]);         // [{id,x,y,text}] คอมเมนต์/โน้ตบนภาพ (x,y=จุดกลาง fraction)
  // ── หลายหน้า/แท็บ: แต่ละหน้าคือรูป + คาลิเบรตของตัวเอง (เช่น หลังคา / จุดคอมบายเนอร์) ──
  // pages เก็บทุกหน้า · หน้าที่กำลังแก้ (activePage) ใช้ working state ด้านบนเป็นตัวจริง ↔ ซิงก์เข้า pages ตอนสลับ/บันทึก
  const [pages, setPages] = React.useState([]);
  const [activePage, setActivePage] = React.useState(0);
  const pagesRef = React.useRef([]);
  React.useEffect(() => { pagesRef.current = pages; }, [pages]);
  const [busy, setBusy] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  // ── ประวัติย้อนกลับ (undo) ──
  const histRef = React.useRef([]);                 // สแนปช็อตก่อนหน้า
  const snapRef = React.useRef(null);               // สถานะที่บันทึกไว้ล่าสุด
  const restoringRef = React.useRef(false);         // กำลัง undo อยู่ (กันบันทึกซ้ำ)
  const draggingRef = React.useRef(false);          // กำลังลากย้าย (ไม่บันทึกทีละสเต็ป)
  const movedRef = React.useRef(false);             // ลากแล้วมีการขยับจริงไหม
  const [histLen, setHistLen] = React.useState(0);  // จำนวนสเต็ปที่ย้อนได้ (สำหรับปุ่ม)

  // โหลดค่าจาก DB ครั้งแรก
  React.useEffect(() => {
    if (loading || loaded) return;
    if (plan) {
      // รองรับทั้งรูปแบบใหม่ (plan.pages) และเก่า (รูปเดียวที่ระดับบนสุด)
      let pgs;
      if (Array.isArray(plan.pages) && plan.pages.length) pgs = plan.pages.map((p, i) => pageFrom(p, "รูป " + (i + 1)));
      else pgs = [pageFrom(plan, "หลังคา")];
      pagesRef.current = pgs;
      setPages(pgs); setActivePage(0); applyPage(pgs[0]);
      if (plan.wp != null && +plan.wp > 0) setWp(+plan.wp);
      if (plan.isc != null && +plan.isc > 0) setPanelIsc(+plan.isc);
      if (plan.ac) { setAcKw(plan.ac.kw != null && plan.ac.kw !== 0 ? String(plan.ac.kw) : (jobKw ? String(jobKw) : "")); setAcPhase(plan.ac.phase === 3 ? 3 : 1); setInvType(plan.ac.inv === "string" ? "string" : "micro"); }
    } else {
      const pg = pageFrom(null, "หลังคา");
      pagesRef.current = [pg]; setPages([pg]); setActivePage(0);
    }
    setLoaded(true);
  }, [loading, plan, loaded]);

  // เครื่องมือ: null | "calib" | "draw" | "marker" | "erase"
  const [tool, setTool] = React.useState(null);
  const [lineKind, setLineKind] = React.useState("dc");
  const [lineSize, setLineSize] = React.useState(0);            // ขนาดสาย mm² (0 = อัตโนมัติ)
  const [lineCores, setLineCores] = React.useState(1);          // จำนวนแกนสาย (1C/2C/…)
  const [lineConduit, setLineConduit] = React.useState("none"); // ชนิดท่อ/การเดิน (ต่อเส้น)
  const [lineConduitSize, setLineConduitSize] = React.useState(""); // ขนาดท่อ ("" = อัตโนมัติ)
  const [markerKind, setMarkerKind] = React.useState("inverter");
  const [junctionTarget, setJunctionTarget] = React.useState(""); // id หน้าปลายทางของจุดต่อรูป
  const [draft, setDraft] = React.useState([]);         // จุดเส้นที่กำลังวาด (fractions)
  const [calPts, setCalPts] = React.useState([]);       // จุดคาลิเบรต (สูงสุด 2)
  const [calMetersInput, setCalMetersInput] = React.useState("");
  const [hideAnno, setHideAnno] = React.useState(false); // แอบดูรูปดิบ ซ่อนเส้น/ป้ายชั่วคราว
  // ── ตั้งค่าแผงโซลาร์ (ก่อนวาง) ──
  const [panelOrient, setPanelOrient] = React.useState("port"); // port=แนวตั้ง | land=แนวนอน
  const [panelSku, setPanelSku] = React.useState("");           // id รุ่นแผงที่เลือกจากคลัง
  const [panelShort, setPanelShort] = React.useState(PLAN_PANEL_SHORT);
  const [panelLong, setPanelLong] = React.useState(PLAN_PANEL_LONG);
  const [panelRows, setPanelRows] = React.useState(2);
  const [panelCols, setPanelCols] = React.useState(4);
  const [panelRot, setPanelRot] = React.useState(0);
  // ── ไมโครอินเวอร์เตอร์ + เชื่อมสาย ──
  const [microN, setMicroN] = React.useState(PLAN_MICRO_PANELS); // จำนวนแผงต่อไมโคร (ก่อนวาง)
  const [wp, setWp] = React.useState(PLAN_WP_DEFAULT);           // วัตต์ต่อแผง (คิด kWp)
  const [panelIsc, setPanelIsc] = React.useState(0);            // Isc แผง (A) — ใช้คิดสาย DC PV1-F เหมือน BOQ
  const [linkColor, setLinkColor] = React.useState(PLAN_LINK_COLORS[0]); // สีสตริงปัจจุบัน
  const [linkFrom, setLinkFrom] = React.useState(null);         // id ไมโครตัวแรกที่เลือกในโหมดเชื่อม
  const [linkPts, setLinkPts] = React.useState([]);             // จุดหักมุมระหว่างต้นทาง→ปลายทาง ในโหมดเชื่อม
  const [photoView, setPhotoView] = React.useState(null);       // id จุดอุปกรณ์ที่กำลังเปิดดูรูปถ่ายจริง (lightbox)
  const [photoIdx, setPhotoIdx] = React.useState(0);            // รูปที่กำลังดูในแกลเลอรีของจุดนั้น
  const [photoDraw, setPhotoDraw] = React.useState(false);      // กำลังวาด/เขียนทับรูปที่เปิดดูอยู่
  const [penColor, setPenColor] = React.useState("#EF4444");    // สีปากกาวาดบนรูป
  const [penMode, setPenMode] = React.useState("free");         // โหมดวาดบนรูป: free (ปากกา) · line (เส้นสายไฟ) · text (คอมเมนต์)
  const [strokes, setStrokes] = React.useState([]);             // เส้นที่วาดบนรูป (canvas px)
  const drawCanvasRef = React.useRef(null);
  const drawImgRef = React.useRef(null);                        // รูปต้นฉบับที่โหลดไว้วาดทับ
  const penDownRef = React.useRef(false);
  const curStrokeRef = React.useRef(null);
  const [lineEdit, setLineEdit] = React.useState(null);         // id เส้นที่กำลังปรับแต่ง (ขนาดสาย/ท่อ) จากบนภาพ
  const [linkEdit, setLinkEdit] = React.useState(null);         // id สายเชื่อม (ไมโคร/คอมบายเนอร์/MDB) ที่กำลังปรับแต่ง
  const [noteEdit, setNoteEdit] = React.useState(null);         // id คอมเมนต์บนภาพที่กำลังพิมพ์แก้ไข
  const [pairFrom, setPairFrom] = React.useState(null);         // id ไมโครที่เลือกไว้ในโหมดจับคู่แผง
  const [snapStraight, setSnapStraight] = React.useState(true); // AUTO: วาดสายล็อกแนวนอน/ตั้ง + วางไมโครเรียงแถว
  const [showGrid, setShowGrid] = React.useState(false);        // กริดช่วยจัดวาง
  const [yieldFactor, setYieldFactor] = React.useState(1400);   // kWh ต่อ kWp ต่อปี (ประเมินผลิตไฟ)
  const [copied, setCopied] = React.useState(false);            // สถานะคัดลอกใบถอดของ

  // ── วงจร AC: ดึง kW/เฟส จากงาน → คำนวณกระแส → แนะนำขนาดสาย (พิกัด วสท. เดียวกับ BOQ) ──
  const jobKw = (job && (parseFloat(job.kw) || 0)) || 0;
  const jobPhase = String(job && job.phase) === "3" ? 3 : 1;
  const [acKw, setAcKw] = React.useState(jobKw ? String(jobKw) : "");
  const [acPhase, setAcPhase] = React.useState(jobPhase);
  const [invType, setInvType] = React.useState("micro"); // ชนิดอินเวอร์เตอร์: micro (คิดตามจำนวนแผง) | string (คิดตามพิกัดอินเวอร์เตอร์)

  const mark = () => setDirty(true);

  // ── บันทึกประวัติทุกครั้งที่สิ่งที่วาดเปลี่ยน (ยกเว้นระหว่างลาก / กำลัง undo) ──
  React.useEffect(() => {
    if (!loaded) return;
    if (draggingRef.current) return;               // ระหว่างลากย้าย เก็บเป็นสเต็ปเดียวตอนปล่อย
    if (restoringRef.current) { restoringRef.current = false; return; }
    const prev = snapRef.current;
    // ข้ามการเปลี่ยนที่ไม่มีผลจริง (เช่นสลับเครื่องมือที่ setDraft([]) ref ใหม่แต่ว่างเหมือนเดิม)
    if (prev && prev.lines === lines && prev.markers === markers && prev.panels === panels &&
        prev.micros === micros && prev.links === links && prev.notes === notes &&
        (prev.draft === draft || ((prev.draft || []).length === 0 && draft.length === 0))) return;
    const snap = { lines, markers, panels, micros, links, notes, draft };
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
    setLines(prev.lines); setMarkers(prev.markers); setPanels(prev.panels);
    setMicros(prev.micros); setLinks(prev.links); setNotes(prev.notes || []); setDraft(prev.draft || []);
    snapRef.current = prev;
    setHistLen(histRef.current.length);
    setLinkFrom(null); setLinkPts([]); setPairFrom(null);
    mark();
  };

  // ── หลายหน้า/แท็บ ──
  // สแนปช็อตหน้าที่กำลังแก้ (working state → page payload)
  const pageSnap = () => ({ image, imgW: imgDim.w, imgH: imgDim.h, mpp, calib, lines, markers, panels, micros, links, notes });
  // แปลง object (รูปแบบเก่า / หน้า) → page ที่มี id/name ครบ
  const pageFrom = (o, name) => ({
    id: (o && o.id) || _pid("pg"), name: (o && o.name) || name || "รูป",
    image: (o && o.image) || null, imgW: +(o && o.imgW) || 0, imgH: +(o && o.imgH) || 0,
    mpp: o && o.mpp != null ? +o.mpp : null, calib: (o && o.calib) || null,
    lines: (o && Array.isArray(o.lines)) ? o.lines : [], markers: (o && Array.isArray(o.markers)) ? o.markers : [],
    panels: (o && Array.isArray(o.panels)) ? o.panels : [], micros: (o && Array.isArray(o.micros)) ? o.micros : [],
    links: (o && Array.isArray(o.links)) ? o.links : [], notes: (o && Array.isArray(o.notes)) ? o.notes : [],
  });
  // เอาข้อมูลของหน้าใส่ working state
  const applyPage = (p) => {
    setImage(p.image || null); setImgDim({ w: +p.imgW || 0, h: +p.imgH || 0 });
    setMpp(p.mpp != null ? +p.mpp : null); setCalib(p.calib || null);
    setLines(p.lines || []); setMarkers(p.markers || []); setPanels(p.panels || []);
    setMicros(p.micros || []); setLinks(p.links || []); setNotes(p.notes || []);
  };
  // เคลียร์เครื่องมือ/ประวัติ ตอนเปลี่ยนหน้า
  const resetForPageSwitch = () => {
    setTool(null); setDraft([]); setCalPts([]); setLinkFrom(null); setLinkPts([]); setPairFrom(null); setPhotoView(null); setPhotoDraw(false); setStrokes([]); setLineEdit(null); setLinkEdit(null); setNoteEdit(null);
    histRef.current = []; snapRef.current = null; setHistLen(0);
  };
  // เขียน working state กลับเข้า pages[activePage] แล้วคืน array ใหม่
  const commitActive = () => {
    const arr = (pagesRef.current || []).map((p, i) => (i === activePage ? Object.assign({}, p, pageSnap()) : p));
    pagesRef.current = arr; return arr;
  };
  const gotoPage = (i) => {
    if (i === activePage || i < 0 || i >= pagesRef.current.length) return;
    const arr = commitActive(); setPages(arr);
    applyPage(arr[i]); setActivePage(i); resetForPageSwitch(); mark();
  };
  const addPage = () => {
    const arr = commitActive();
    const np = pageFrom(null, "รูป " + (arr.length + 1));
    const next = arr.concat([np]); pagesRef.current = next; setPages(next);
    applyPage(np); setActivePage(next.length - 1); resetForPageSwitch(); mark();
  };
  const deletePage = (i) => {
    if (pagesRef.current.length <= 1) return;
    if (!window.confirm("ลบหน้านี้และทุกอย่างในหน้า?")) return;
    const committed = commitActive();
    const next = committed.filter((_, j) => j !== i); pagesRef.current = next;
    const ni = i <= activePage ? Math.max(0, activePage - (i < activePage ? 1 : 0)) : activePage;
    const clamped = Math.min(ni, next.length - 1);
    setPages(next); applyPage(next[clamped]); setActivePage(clamped); resetForPageSwitch(); mark();
  };
  const renamePage = (i) => {
    const cur = pagesRef.current[i]; if (!cur) return;
    const nm = window.prompt("ชื่อหน้า:", cur.name || "");
    if (nm == null) return;
    const next = pagesRef.current.map((p, j) => (j === i ? Object.assign({}, p, { name: nm.trim() || p.name }) : p));
    pagesRef.current = next; setPages(next); mark();
  };
  // นับจุดต่อรูป (jid ไม่ซ้ำ) ทุกหน้า
  const countJunctions = () => {
    const seen = new Set();
    (pagesRef.current || []).forEach((pg, i) => {
      const list = i === activePage ? markers : (pg.markers || []);
      list.forEach((m) => { if (m.kind === "xpage" && m.jid) seen.add(m.jid); });
    });
    return seen.size;
  };
  // ปักหมุด "จุดต่อรูป" คู่กันทั้งหน้านี้ + หน้าปลายทาง (เลขเดียวกัน)
  const addJunction = (x, y) => {
    const arr0 = pagesRef.current || [];
    const activeId = (arr0[activePage] || {}).id;
    const target = junctionTarget || (arr0.find((p, i) => i !== activePage) || {}).id;
    if (!target || target === activeId) { alert("ต้องมีอย่างน้อย 2 รูป แล้วเลือกหน้าปลายทางก่อน (＋ เพิ่มรูป ด้านบน)"); return; }
    const jid = _pid("jx"), n = countJunctions() + 1;
    const here = { id: _pid("m"), kind: "xpage", x, y, jid, n, toPage: target };
    const there = { id: _pid("m"), kind: "xpage", x: 0.5, y: 0.5, jid, n, toPage: activeId };
    const newActiveMarkers = markers.concat([here]);
    setMarkers(newActiveMarkers);
    const arr = arr0.map((p, i) => {
      if (i === activePage) return Object.assign({}, p, pageSnap(), { markers: newActiveMarkers });
      if (p.id === target) return Object.assign({}, p, { markers: (p.markers || []).concat([there]) });
      return p;
    });
    pagesRef.current = arr; setPages(arr); mark();
  };
  // เข้าโหมด "ต่อรูป" → เลือกหน้าปลายทางเริ่มต้นให้ (หน้าอื่นหน้าแรก)
  React.useEffect(() => {
    if (tool !== "xpage") return;
    const others = pages.filter((p, i) => i !== activePage);
    if (others.length && (!junctionTarget || !others.some((p) => p.id === junctionTarget))) setJunctionTarget(others[0].id);
  }, [tool, activePage, pages]);

  // ── วัดขนาดที่แสดงจริงของรูป ──
  const imgRef = React.useRef(null);
  const [disp, setDisp] = React.useState({ w: 0, h: 0 });
  const measure = React.useCallback(() => {
    const el = imgRef.current; if (!el) return;
    const r = el.getBoundingClientRect(); setDisp({ w: r.width, h: r.height });
  }, []);
  React.useEffect(() => {
    measure();
    const el = imgRef.current; if (!el) return;
    let ro; if (window.ResizeObserver) { ro = new ResizeObserver(measure); ro.observe(el); }
    window.addEventListener("resize", measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [image, measure]);

  // ── helpers ──
  const segNat = (a, b) => Math.hypot((a.x - b.x) * (imgDim.w || 1), (a.y - b.y) * (imgDim.h || 1));
  const lineNatLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += segNat(pts[i - 1], pts[i]); return s; };
  // เมตรของเส้น: พิมพ์เอง > คำนวณจากสเกล > null
  const lineMeters = (ln) => {
    if (ln.manualM != null && +ln.manualM > 0) return +ln.manualM;
    if (mpp && ln.pts.length >= 2) return lineNatLen(ln.pts) * mpp;
    return null;
  };
  const fmtM = (m) => (m == null ? "—" : (Math.round(m * 10) / 10).toLocaleString() + " ม.");
  // ข้อความสรุปสเปกสายบนภาพ: ชนิด + ขนาด + ท่อที่เดิน
  const lineSpecText = (ln) => {
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
  const updateLine = (id, patch) => { setLines((arr) => arr.map((l) => (l.id === id ? Object.assign({}, l, patch) : l))); mark(); };
  const updateLink = (id, patch) => { setLinks((arr) => arr.map((l) => (l.id === id ? Object.assign({}, l, patch) : l))); mark(); };
  // สายเชื่อม: ชื่อ / ระยะ / สเปกบนภาพ
  const linkTitle = (lk) => lk.feed ? "สาย AC เข้าตู้ (คอมบายเนอร์→MDB)" : lk.ac ? "สาย AC เมน (ไมโคร→คอมบายเนอร์)" : "สตริง DC (ไมโคร→ไมโคร)";
  const linkMeters = (lk) => {
    if (lk.manualM != null && +lk.manualM > 0) return +lk.manualM;
    const a = linkNodeById(lk.from), b = linkNodeById(lk.to); if (!a || !b || !mpp) return null;
    const seq = (lk.pts && lk.pts.length) ? [a].concat(lk.pts, [b]) : [a, b];
    return lineNatLen(seq) * mpp;
  };
  const linkSpecText = (lk) => {
    const parts = [];
    const base = lk.ac ? "CV-FD" : "PV";
    if (+lk.size > 0) parts.push(base + " " + (lk.cores > 1 ? lk.cores + "Cx" : "") + lk.size + " mm²");
    if (lk.conduit && lk.conduit !== "none") { const cd = PLAN_CONDUIT_BY[lk.conduit] || {}; parts.push("ท่อ " + (cd.short || lk.conduit) + (lk.conduitSize ? " " + lk.conduitSize : "")); }
    return parts.join(" · ");
  };
  // ตำแหน่งป้ายข้อความ (ลากย้ายได้) — ค่าเริ่มต้น = กึ่งกลางเส้น
  const lineMid = (ln) => ln.pts[Math.floor(ln.pts.length / 2)] || ln.pts[0] || { x: 0.5, y: 0.5 };
  const lineLabelXY = (ln) => ln.labelPos || lineMid(ln);
  const linkMidXY = (lk) => {
    const a = linkNodeById(lk.from), b = linkNodeById(lk.to); if (!a || !b) return { x: 0.5, y: 0.5 };
    const seq = (lk.pts && lk.pts.length) ? [a].concat(lk.pts, [b]) : [a, b];
    return seq[Math.floor(seq.length / 2)] || a;
  };
  const linkLabelXY = (lk) => lk.labelPos || linkMidXY(lk);
  // หา "ป้าย" ที่จุดแตะ (fraction) เพื่อลากย้าย — คืน id หรือ null
  const labelHitAt = (f) => {
    const fx = f.x * disp.w, fy = f.y * disp.h;
    const inBox = (p) => { const lx = p.x * disp.w, ly = p.y * disp.h; return Math.abs(fx - lx) <= p.halfW && fy >= ly - 28 && fy <= ly + 24; };
    for (let i = lines.length - 1; i >= 0; i--) {
      const ln = lines[i]; const p = lineLabelXY(ln);
      const lbl = fmtM(lineMeters(ln)), lw = Math.max(30, lbl.length * 7.3 + 12);
      const spec = lineSpecText(ln), sw = spec ? Math.max(42, spec.length * 6.1 + 14) : 0;
      if (inBox({ x: p.x, y: p.y, halfW: Math.max(lw, sw) / 2 + 4 })) return { type: "lineLabel", id: ln.id };
    }
    for (let i = links.length - 1; i >= 0; i--) {
      const lk = links[i]; if (!lk.ac && !linkSpecText(lk)) continue; const p = linkLabelXY(lk);
      const lbl = fmtM(linkMeters(lk)), lw = Math.max(30, lbl.length * 7.3 + 12);
      const spec = linkSpecText(lk), sw = spec ? Math.max(42, spec.length * 6.1 + 14) : 0;
      if (inBox({ x: p.x, y: p.y, halfW: Math.max(lw, sw) / 2 + 4 })) return { type: "linkLabel", id: lk.id };
    }
    return null;
  };
  // มุมฉากอัตโนมัติ: จาก prev → จุดที่แตะ ให้เดินแกนที่ยาวกว่าก่อน แล้วเลี้ยวไปหาจุดจริง
  // → ได้ทั้งแนวราบ + แนวดิ่งในแตะเดียว (คืนจุดที่ต้องเพิ่ม: [มุม, จุดจริง] หรือ [จุดจริง])
  const orthoPoints = (prev, x, y) => {
    const dxPx = Math.abs((x - prev.x) * disp.w), dyPx = Math.abs((y - prev.y) * disp.h);
    const corner = dxPx >= dyPx ? { x: x, y: prev.y } : { x: prev.x, y: y };
    const out = [];
    if (Math.abs(corner.x - prev.x) * disp.w > 0.5 || Math.abs(corner.y - prev.y) * disp.h > 0.5) out.push(corner);
    out.push({ x: x, y: y });
    return out;
  };

  // ── รับพิกัดจากการแตะ (fraction) ──
  const onTap = (e) => {
    const el = imgRef.current; if (!el || !image) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    if (tool === "draw") {
      if (snapStraight && draft.length > 0) {                 // AUTO: หักมุมฉากให้ถึงจุดจริง (แนวราบ+แนวดิ่ง)
        const prev = draft[draft.length - 1];
        setDraft((p) => p.concat(orthoPoints(prev, x, y)));
      } else setDraft((p) => p.concat([{ x: x, y: y }]));
    }
    else if (tool === "calib") {
      setCalPts((p) => { const n = p.concat([{ x, y }]); return n.length > 2 ? [{ x, y }] : n; });
    }
    else if (tool === "marker") {
      // "วางอุปกรณ์" รวม แผงโซลาร์ + ไมโครฯ ไว้ในเครื่องมือเดียว (เลือกชนิดจากชิปด้านบน)
      if (markerKind === "panel") {
        if (!mpp) { alert("ตั้งมาตราส่วนก่อน แล้วแผงจะวางเท่าขนาดจริง"); return; }
        const pw = panelOrient === "land" ? panelLong : panelShort;
        const ph = panelOrient === "land" ? panelShort : panelLong;
        setPanels((p) => p.concat([{ id: _pid("pnl"), x, y, cols: panelCols, rows: panelRows, pw, ph, rot: panelRot }])); mark();
      } else if (markerKind === "micro") {
        let nx = x, ny = y;
        if (snapStraight && micros.length > 0) {              // AUTO: snap เข้าแถวไมโครที่ใกล้ที่สุด
          let best = -1, bestD = Infinity;
          micros.forEach((m, i) => { const d = Math.abs((m.y - y) * disp.h); if (d < bestD) { bestD = d; best = i; } });
          if (best >= 0 && bestD <= 26) ny = micros[best].y;  // อยู่ในระยะ ≤26px → จัดให้อยู่แถวเดียวกัน
        }
        setMicros((p) => p.concat([{ id: _pid("iv"), x: nx, y: ny, n: Math.max(1, Math.round(microN) || 1) }])); mark();
      } else {
        setMarkers((p) => p.concat([{ id: _pid("m"), kind: markerKind, x, y }])); mark();
      }
    }
    else if (tool === "photo") {
      // แตะใกล้จุดเดิม → เปิด/แนบรูปของจุดนั้น · แตะที่ว่าง → ปัก "จุดกล้อง" ใหม่ตรงนั้นแล้วแนบรูปเลย
      let best = -1, bd = 30;
      markers.forEach((m, i) => { const d = Math.hypot((m.x - x) * disp.w, (m.y - y) * disp.h); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) {
        const m = markers[best];
        if (markerPhotos(m).length) { setPhotoIdx(0); setPhotoView(m.id); } else openMarkerPhotoPicker(m.id);
      } else {
        const id = _pid("m");
        setMarkers((p) => p.concat([{ id, kind: "camera", x, y }])); mark();
        openMarkerPhotoPicker(id);                            // เปิดเลือกรูปให้ทันที
      }
    }
    else if (tool === "xpage") { addJunction(x, y); }
    else if (tool === "connect") {
      // โหนดที่แตะได้: ไมโคร (สตริง) · ตู้คอมบายเนอร์ (ปลายสาย AC เมน / ต้นสายเข้าตู้ลูกค้า) · ตู้ MDB (ปลายสายเข้าตู้ลูกค้า)
      const mi = nearestMicro(x, y, 34), ci = nearestCombiner(x, y, 30), di = nearestMdb(x, y, 30);
      const cands = [];
      if (mi >= 0) cands.push({ type: "micro", id: micros[mi].id, node: micros[mi] });
      if (ci >= 0) cands.push({ type: "combiner", id: markers[ci].id, node: markers[ci] });
      if (di >= 0) cands.push({ type: "mdb", id: markers[di].id, node: markers[di] });
      cands.forEach((c) => { c.d = Math.hypot((c.node.x - x) * disp.w, (c.node.y - y) * disp.h); });
      cands.sort((a, b) => a.d - b.d);
      const tgt = cands[0] || null;
      const src = linkFrom ? linkNodeById(linkFrom) : null;

      // เลือกไมโครไว้แล้ว + แตะบน "แผ่นแผง" (ไม่โดนโหนดอื่น) = จับคู่แผงอัตโนมัติ (แตะซ้ำ = ยกเลิก · จับได้หลายแผ่น)
      if (src && src.type === "micro" && !tgt) {
        for (let i = panels.length - 1; i >= 0; i--) {
          const cell = cellAt(panels[i], x, y);
          if (cell) {
            setPanels((arr) => arr.map((p, j) => {
              if (j !== i) return p;
              const cm = Object.assign({}, getCells(p));
              if (cm[cell.idx] === linkFrom) delete cm[cell.idx]; else cm[cell.idx] = linkFrom;
              return Object.assign({}, p, { ivCells: cm, iv: null });
            }));
            mark(); return;
          }
        }
      }

      if (!tgt) {                                   // แตะที่ว่าง (ไม่โดนโหนด/ไม่โดนแผง)
        if (linkFrom) {                             // เลือกต้นทางแล้ว → เพิ่ม "จุดหักมุม" ให้เดินสายอ้อมได้
          const prev = linkPts.length ? linkPts[linkPts.length - 1] : src;
          if (snapStraight && prev) setLinkPts((p) => p.concat(orthoPoints(prev, x, y))); // 📐 หักมุมฉากให้ถึงจุดจริง
          else setLinkPts((p) => p.concat([{ x: x, y: y }]));
        } else setLinkFrom(null);
        return;
      }
      if (!linkFrom) {                              // ยังไม่มีต้นทาง → เริ่มต้นได้จากไมโคร (สตริง) หรือตู้คอมบายเนอร์ (สายเข้าตู้ลูกค้า)
        if (tgt.type === "micro" || tgt.type === "combiner") { setLinkFrom(tgt.id); setLinkPts([]); }
        return;
      }
      if (tgt.id === linkFrom) { setLinkFrom(null); setLinkPts([]); return; } // แตะตัวเดิม = ยกเลิก

      if (src && src.type === "micro") {
        if (tgt.type === "combiner") {              // ไมโครตัวสุดท้าย → ตู้คอมบายเนอร์ = สาย AC เมน
          const dup = links.some((l) => l.ac && ((l.from === linkFrom && l.to === tgt.id) || (l.from === tgt.id && l.to === linkFrom)));
          if (!dup) { setLinks((p) => p.concat([{ id: _pid("lk"), from: linkFrom, to: tgt.id, color: PLAN_AC_TRUNK_COLOR, ac: true, pts: linkPts.slice() }])); mark(); }
          setLinkFrom(null); setLinkPts([]);
        } else if (tgt.type === "micro") {          // ไมโคร → ไมโคร = สตริง DC
          const dup = links.some((l) => !l.ac && ((l.from === linkFrom && l.to === tgt.id) || (l.from === tgt.id && l.to === linkFrom)));
          if (!dup) { setLinks((p) => p.concat([{ id: _pid("lk"), from: linkFrom, to: tgt.id, color: linkColor, pts: linkPts.slice() }])); mark(); }
          setLinkFrom(tgt.id); setLinkPts([]);      // ต่อเป็นสตริงต่อเนื่องได้เลย
        }
        return;                                     // ไมโคร → MDB ไม่อนุญาต (ต้องผ่านตู้คอมบายเนอร์)
      }
      if (src && src.type === "combiner" && tgt.type === "mdb") { // ตู้คอมบายเนอร์ → ตู้ MDB = สาย AC เข้าตู้ลูกค้า
        const dup = links.some((l) => l.ac && ((l.from === linkFrom && l.to === tgt.id) || (l.from === tgt.id && l.to === linkFrom)));
        if (!dup) { setLinks((p) => p.concat([{ id: _pid("lk"), from: linkFrom, to: tgt.id, color: PLAN_AC_FEED_COLOR, ac: true, feed: true, pts: linkPts.slice() }])); mark(); }
        setLinkFrom(null); setLinkPts([]);
      }
    }
    else if (tool === "note") {
      const id = _pid("nt");
      setNotes((p) => p.concat([{ id, x, y, text: "" }])); mark();
      setNoteEdit(id);                                   // เปิดกล่องพิมพ์ทันที
    }
    else if (tool === "erase") { eraseAt(x, y); }
  };

  // เรขาคณิตของบล็อกแผง (หน่วย px บนจอ)
  const panelGeom = (pnl) => {
    const dpm = (disp.w / (imgDim.w || 1)) / (mpp || 1); // px บนจอ ต่อ 1 เมตร
    const gap = PLAN_PANEL_GAP * dpm;
    const cw = pnl.pw * dpm, ch = pnl.ph * dpm;
    const totalW = pnl.cols * cw + (pnl.cols - 1) * gap;
    const totalH = pnl.rows * ch + (pnl.rows - 1) * gap;
    const cx = pnl.x * disp.w, cy = pnl.y * disp.h;
    return { dpm, gap, cw, ch, totalW, totalH, cx, cy, x0: cx - totalW / 2, y0: cy - totalH / 2 };
  };

  // การจับคู่ราย "แผ่น" ในบล็อก: pnl.ivCells = { [cellIdx]: microId } (cellIdx = r*cols + c)
  // รองรับข้อมูลเก่าที่จับคู่ทั้งบล็อก (pnl.iv) → แปลงเป็นทุกช่องชั่วคราว
  const getCells = (pnl) => {
    if (pnl.ivCells && typeof pnl.ivCells === "object") return pnl.ivCells;
    if (pnl.iv) { const o = {}, n = pnl.rows * pnl.cols; for (let k = 0; k < n; k++) o[k] = pnl.iv; return o; }
    return {};
  };
  // แตะ (fraction) ตกในแผ่นไหนของบล็อก → { r, c, idx } หรือ null
  const cellAt = (pnl, x, y) => {
    const g = panelGeom(pnl);
    const rad = -(pnl.rot || 0) * Math.PI / 180;
    const dx = x * disp.w - g.cx, dy = y * disp.h - g.cy;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    if (Math.abs(lx) > g.totalW / 2 || Math.abs(ly) > g.totalH / 2) return null;
    const c = Math.min(pnl.cols - 1, Math.max(0, Math.floor((lx + g.totalW / 2) / (g.cw + g.gap))));
    const r = Math.min(pnl.rows - 1, Math.max(0, Math.floor((ly + g.totalH / 2) / (g.ch + g.gap))));
    return { r, c, idx: r * pnl.cols + c };
  };
  // จุดกลางของแผ่น (r,c) เป็น px บนจอ (คิดการหมุนของบล็อก) — สำหรับลากเส้นจับคู่
  const cellCenterPx = (pnl, r, c) => {
    const g = panelGeom(pnl);
    const lx = -g.totalW / 2 + c * (g.cw + g.gap) + g.cw / 2;
    const ly = -g.totalH / 2 + r * (g.ch + g.gap) + g.ch / 2;
    const rad = (pnl.rot || 0) * Math.PI / 180;
    return { X: g.cx + lx * Math.cos(rad) - ly * Math.sin(rad), Y: g.cy + lx * Math.sin(rad) + ly * Math.cos(rad) };
  };

  // ไมโครที่ใกล้จุด (fraction) ที่สุด ภายในระยะ maxPx (คืน index หรือ -1)
  const nearestMicro = (x, y, maxPx) => {
    let best = -1, bd = maxPx;
    micros.forEach((m, i) => { const d = Math.hypot((m.x - x) * disp.w, (m.y - y) * disp.h); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  // จุด marker ชนิดที่กำหนด ที่ใกล้จุดที่สุด ภายในระยะ maxPx (คืน index ใน markers หรือ -1)
  const nearestMarkerKind = (kind, x, y, maxPx) => {
    let best = -1, bd = maxPx;
    markers.forEach((m, i) => { if (m.kind !== kind) return; const d = Math.hypot((m.x - x) * disp.w, (m.y - y) * disp.h); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  const nearestCombiner = (x, y, maxPx) => nearestMarkerKind("combiner", x, y, maxPx);
  const nearestMdb = (x, y, maxPx) => nearestMarkerKind("mdb", x, y, maxPx);
  // ข้อมูลโหนดจาก id (ไมโคร / ตู้คอมบายเนอร์ / ตู้ MDB) — ใช้ตอนลากสายเชื่อม
  const linkNodeById = (id) => {
    const mi = micros.find((m) => m.id === id); if (mi) return { type: "micro", x: mi.x, y: mi.y };
    const mk = markers.find((m) => m.id === id); if (mk) return { type: mk.kind, x: mk.x, y: mk.y };
    return null;
  };

  // กล่องคอมเมนต์บนภาพ (px บนจอ) — ใช้ทั้งวาด/ลบ/ลากย้าย ให้ขนาดตรงกัน
  const noteBox = (nt) => {
    const rows = (nt.text || "").split("\n");
    const fs = 12.5;
    const maxLen = rows.reduce((m, r) => Math.max(m, (r || "").length), 4);
    const w = Math.max(46, maxLen * fs * 0.56 + 20);
    const h = rows.length * (fs + 5) + 12;
    const cx = nt.x * disp.w, cy = nt.y * disp.h;
    return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, fs, rows };
  };

  const eraseAt = (x, y) => {
    // ไมโคร (≤ 22px) → marker (≤ 20px) → เส้น (≤ 12px) → สายเชื่อม (≤ 10px) → บล็อกแผง (ในกรอบ)
    const px = (fx, fy) => ({ X: fx * disp.w, Y: fy * disp.h });
    const T = px(x, y);
    const mi = nearestMicro(x, y, 22);
    if (mi >= 0) {
      const id = micros[mi].id;
      setMicros((arr) => arr.filter((_, j) => j !== mi));
      setLinks((arr) => arr.filter((l) => l.from !== id && l.to !== id));
      setPanels((arr) => arr.map((p) => {
        const cm = getCells(p); const out = {}; let changed = p.iv === id;
        Object.keys(cm).forEach((k) => { if (cm[k] === id) changed = true; else out[k] = cm[k]; });
        return changed ? Object.assign({}, p, { ivCells: out, iv: null }) : p;
      }));
      mark(); return;
    }
    let bestM = -1, bestMd = 20;
    markers.forEach((m, i) => { const p = px(m.x, m.y); const d = Math.hypot(p.X - T.X, p.Y - T.Y); if (d < bestMd) { bestMd = d; bestM = i; } });
    if (bestM >= 0) {
      const mk = markers[bestM], mid = mk.id;
      setMarkers((arr) => arr.filter((_, i) => i !== bestM));
      setLinks((arr) => arr.filter((l) => l.from !== mid && l.to !== mid));
      if (mk.kind === "xpage" && mk.jid) { // ลบหมุดคู่ในหน้าอื่นด้วย
        const arr = (pagesRef.current || []).map((p, i) => (i === activePage ? p : Object.assign({}, p, { markers: (p.markers || []).filter((mm) => mm.jid !== mk.jid) })));
        pagesRef.current = arr; setPages(arr);
      }
      mark(); return;
    }
    // คอมเมนต์/โน้ต (แตะในกล่อง) — ให้ความสำคัญก่อนเส้น
    for (let i = notes.length - 1; i >= 0; i--) {
      const nt = notes[i], g = noteBox(nt);
      if (T.X >= g.x && T.X <= g.x + g.w && T.Y >= g.y && T.Y <= g.y + g.h) {
        setNotes((arr) => arr.filter((_, j) => j !== i)); mark(); return;
      }
    }
    let bestL = -1, bestLd = 12;
    lines.forEach((ln, i) => {
      for (let k = 1; k < ln.pts.length; k++) {
        const a = px(ln.pts[k - 1].x, ln.pts[k - 1].y), b = px(ln.pts[k].x, ln.pts[k].y);
        const d = distToSeg(T.X, T.Y, a.X, a.Y, b.X, b.Y);
        if (d < bestLd) { bestLd = d; bestL = i; }
      }
    });
    if (bestL >= 0) { setLines((arr) => arr.filter((_, i) => i !== bestL)); mark(); return; }
    // สายเชื่อมไมโคร/สาย AC เมน (≤ 10px)
    const microById = {}; micros.forEach((m) => { microById[m.id] = m; }); markers.forEach((m) => { if (m.kind === "combiner" || m.kind === "mdb") microById[m.id] = m; });
    let bestK = -1, bestKd = 10;
    links.forEach((lk, i) => {
      const a = microById[lk.from], b = microById[lk.to]; if (!a || !b) return;
      const d = distToSeg(T.X, T.Y, a.x * disp.w, a.y * disp.h, b.x * disp.w, b.y * disp.h);
      if (d < bestKd) { bestKd = d; bestK = i; }
    });
    if (bestK >= 0) { setLinks((arr) => arr.filter((_, i) => i !== bestK)); mark(); return; }
    // บล็อกแผง: หมุนจุดแตะกลับเข้าเฟรมของบล็อก แล้วเช็คว่าอยู่ในกรอบ
    for (let i = panels.length - 1; i >= 0; i--) {
      const g = panelGeom(panels[i]);
      const rad = -(panels[i].rot || 0) * Math.PI / 180;
      const dx = T.X - g.cx, dy = T.Y - g.cy;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (Math.abs(lx) <= g.totalW / 2 && Math.abs(ly) <= g.totalH / 2) {
        setPanels((arr) => arr.filter((_, j) => j !== i)); mark(); return;
      }
    }
  };

  const finishLine = () => {
    if (draft.length >= 2) { setLines((p) => p.concat([{ id: _pid("l"), kind: lineKind, pts: draft, manualM: null, size: +lineSize || 0, cores: +lineCores || 1, conduit: lineConduit || "none", conduitSize: lineConduitSize || "" }])); mark(); }
    setDraft([]);
  };
  const cancelDraft = () => setDraft([]);

  // ── ลากย้าย (แผง / ไมโคร / จุดอุปกรณ์) ──
  const dragRef = React.useRef(null);
  const evtFrac = (e) => {
    const el = imgRef.current; if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const insidePanel = (pnl, x, y) => {
    const g = panelGeom(pnl);
    const rad = -(pnl.rot || 0) * Math.PI / 180;
    const dx = x * disp.w - g.cx, dy = y * disp.h - g.cy;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(lx) <= g.totalW / 2 && Math.abs(ly) <= g.totalH / 2;
  };
  const onDragStart = (e) => {
    if (tool !== "move" || !image) return;
    const f = evtFrac(e); if (!f) return;
    // ป้ายข้อความก่อน (ระยะ/สเปกสาย) → ไมโคร → แผง → marker
    const lab = labelHitAt(f);
    // คอมเมนต์บนภาพ (แตะในกล่อง) ลากย้ายได้
    let noteHit = null;
    for (let i = notes.length - 1; i >= 0; i--) {
      const g = noteBox(notes[i]), px = f.x * disp.w, py = f.y * disp.h;
      if (px >= g.x && px <= g.x + g.w && py >= g.y && py <= g.y + g.h) { noteHit = { type: "note", id: notes[i].id }; break; }
    }
    if (lab) { dragRef.current = lab; }
    else if (noteHit) { dragRef.current = noteHit; }
    else {
    const mi = nearestMicro(f.x, f.y, 26);
    if (mi >= 0) { dragRef.current = { type: "micro", i: mi }; }
    else {
      let hit = null;
      for (let i = panels.length - 1; i >= 0; i--) { if (insidePanel(panels[i], f.x, f.y)) { hit = { type: "panel", i }; break; } }
      if (!hit) {
        let best = -1, bd = 22;
        markers.forEach((m, i) => { const d = Math.hypot((m.x - f.x) * disp.w, (m.y - f.y) * disp.h); if (d < bd) { bd = d; best = i; } });
        if (best >= 0) hit = { type: "marker", i: best };
      }
      dragRef.current = hit;
    }
    }
    if (dragRef.current) { draggingRef.current = true; movedRef.current = false; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} }
  };
  const onDragMove = (e) => {
    const d = dragRef.current; if (!d) return;
    const f = evtFrac(e); if (!f) return;
    movedRef.current = true;
    const x = Math.min(1, Math.max(0, f.x)), y = Math.min(1, Math.max(0, f.y));
    if (d.type === "micro") setMicros((arr) => arr.map((m, j) => (j === d.i ? Object.assign({}, m, { x, y }) : m)));
    else if (d.type === "panel") setPanels((arr) => arr.map((p, j) => (j === d.i ? Object.assign({}, p, { x, y }) : p)));
    else if (d.type === "marker") setMarkers((arr) => arr.map((m, j) => (j === d.i ? Object.assign({}, m, { x, y }) : m)));
    else if (d.type === "lineLabel") setLines((arr) => arr.map((l) => (l.id === d.id ? Object.assign({}, l, { labelPos: { x, y } }) : l)));
    else if (d.type === "linkLabel") setLinks((arr) => arr.map((l) => (l.id === d.id ? Object.assign({}, l, { labelPos: { x, y } }) : l)));
    else if (d.type === "note") setNotes((arr) => arr.map((n) => (n.id === d.id ? Object.assign({}, n, { x, y }) : n)));
  };
  const onDragEnd = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    draggingRef.current = false;
    if (movedRef.current) {
      // การลากหนึ่งครั้ง = ประวัติ undo หนึ่งสเต็ป (บันทึกสถานะก่อนลาก แล้วตั้ง baseline ใหม่)
      if (snapRef.current) {
        histRef.current.push(snapRef.current);
        if (histRef.current.length > 60) histRef.current.shift();
        setHistLen(histRef.current.length);
      }
      snapRef.current = { lines, markers, panels, micros, links, notes, draft };
      mark();
    }
    movedRef.current = false;
  };

  // ── อัปโหลดรูป ──
  const fileRef = React.useRef(null);
  const pickImage = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, 1400, 0.82);
      // อ่านขนาดธรรมชาติของรูปที่ย่อแล้ว
      const dim = await new Promise((res) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res({ w: 0, h: 0 }); im.src = dataUrl; });
      setImage(dataUrl); setImgDim(dim);
      setMpp(null); setCalib(null); setLines([]); setMarkers([]); setPanels([]); setMicros([]); setLinks([]); setNotes([]); setLinkFrom(null); setDraft([]); setCalPts([]);
      histRef.current = []; snapRef.current = null; setHistLen(0); mark(); // เริ่มประวัติใหม่กับรูปใหม่
    } catch (err) { alert("โหลดรูปไม่สำเร็จ: " + err.message); }
    setBusy(false);
  };
  // ＋ เพิ่มรูป: สร้างหน้าใหม่ + ใส่รูปหน้างานจริงที่เลือกลงไปทันที (กดครั้งเดียวจบ)
  const addFileRef = React.useRef(null);
  const addPageWithImage = async (file) => {
    if (!file) return;
    addPage();               // สร้างหน้าใหม่ (ว่าง) แล้วสลับไปหน้านั้น
    await pickImage(file);    // ใส่รูปที่แนบลงหน้าที่เพิ่งเพิ่ม
  };
  // แนบรูปถ่ายจริงให้ "จุดอุปกรณ์" (ตู้ MDB/คอมบายเนอร์/จุดต่อ ฯลฯ) — กดจุดแล้วเด้งรูปขึ้นมาดู
  const markerPhotoRef = React.useRef(null);
  const photoTargetRef = React.useRef(null);
  const markerPhotos = (m) => (m && m.photos) ? m.photos : (m && m.photo ? [m.photo] : []); // รองรับข้อมูลเก่า (photo เดี่ยว)
  const openMarkerPhotoPicker = (id) => { photoTargetRef.current = id; if (markerPhotoRef.current) markerPhotoRef.current.click(); };
  const attachMarkerPhoto = async (file) => {
    const id = photoTargetRef.current; if (!file || !id) return;
    const cur = markers.find((m) => m.id === id);
    const newIdx = markerPhotos(cur).length;         // รูปใหม่ต่อท้าย = index สุดท้าย
    setBusy(true);
    try {
      const dataUrl = await resizeImageFile(file, 900, 0.6);   // ย่อเล็กลง (ไฟล์เบา) เพราะเก็บได้หลายรูป
      setMarkers((arr) => arr.map((m) => {
        if (m.id !== id) return m;
        const nm = Object.assign({}, m, { photos: markerPhotos(m).concat([dataUrl]) }); delete nm.photo; return nm;
      }));
      mark(); setPhotoView(id); setPhotoIdx(newIdx);   // เปิดดูรูปที่เพิ่งแนบทันที
    } catch (err) { alert("โหลดรูปไม่สำเร็จ: " + err.message); }
    setBusy(false);
  };
  const removeMarkerPhotoAt = (id, idx) => {
    const cur = markers.find((m) => m.id === id); const len = markerPhotos(cur).length;
    setMarkers((arr) => arr.map((m) => {
      if (m.id !== id) return m;
      const ps = markerPhotos(m).slice(); ps.splice(idx, 1);
      const nm = Object.assign({}, m, { photos: ps }); delete nm.photo; return nm;
    }));
    mark();
    if (len <= 1) setPhotoView(null); else setPhotoIdx((i) => Math.max(0, i - (idx <= i ? 1 : 0)));
  };

  // ── วาด/เขียนทับรูปจุด (freehand บน canvas → เซฟกลับเป็นรูปใหม่) ──
  const drawPhotoItem = (ctx, s) => {
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width || 3;
    if (s.type === "text") {
      const fs = s.size || 28;
      ctx.font = "700 " + fs + "px system-ui, -apple-system, sans-serif"; ctx.textBaseline = "middle";
      ctx.lineWidth = Math.max(3, fs / 6); ctx.strokeStyle = "#fff"; ctx.strokeText(s.text, s.x, s.y); // ขอบขาวให้อ่านง่าย
      ctx.fillText(s.text, s.x, s.y);
    } else if (s.type === "line") {
      ctx.beginPath(); ctx.moveTo(s.a.x, s.a.y); ctx.lineTo(s.b.x, s.b.y); ctx.stroke();
    } else {
      if (!s.pts || !s.pts.length) return;
      ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y);
      if (s.pts.length === 1) ctx.lineTo(s.pts[0].x + 0.1, s.pts[0].y + 0.1);
      ctx.stroke();
    }
  };
  const redrawPhotoCanvas = (preview) => {
    const cv = drawCanvasRef.current, im = drawImgRef.current;
    if (!cv || !im) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(im, 0, 0, cv.width, cv.height);
    strokes.forEach((s) => drawPhotoItem(ctx, s));
    if (preview) drawPhotoItem(ctx, preview);
  };
  // โหลดรูปที่กำลังดูเข้า canvas เมื่อเข้าโหมดวาด / เปลี่ยนรูป
  React.useEffect(() => {
    if (!photoDraw || !photoView) return;
    const m = markers.find((mm) => mm.id === photoView);
    const ps = markerPhotos(m); const src = ps[Math.min(photoIdx, ps.length - 1)];
    if (!src) return;
    const im = new Image();
    im.onload = () => {
      drawImgRef.current = im;
      const cv = drawCanvasRef.current; if (!cv) return;
      const maxW = 1400; let w = im.naturalWidth || 1000, h = im.naturalHeight || 1000;
      if (w > maxW) { h = h * maxW / w; w = maxW; }
      cv.width = Math.round(w); cv.height = Math.round(h);
      redrawPhotoCanvas();
    };
    im.src = src;
  }, [photoDraw, photoView, photoIdx]);
  React.useEffect(() => { if (photoDraw) redrawPhotoCanvas(); }, [strokes, photoDraw]);
  const photoPenXY = (e) => {
    const cv = drawCanvasRef.current; if (!cv) return null;
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };
  const photoPenDown = (e) => {
    const cv = drawCanvasRef.current, p = photoPenXY(e); if (!cv || !p) return;
    const w = Math.max(3, cv.width / 260);
    if (penMode === "text") {                                 // แตะ = พิมพ์ข้อความวางตรงนั้น
      const txt = window.prompt("พิมพ์ข้อความ / คอมเมนต์:", "");
      if (txt && txt.trim()) setStrokes((arr) => arr.concat([{ type: "text", color: penColor, x: p.x, y: p.y, size: Math.max(20, cv.width / 32), text: txt.trim() }]));
      return;
    }
    penDownRef.current = true;
    curStrokeRef.current = penMode === "line" ? { type: "line", color: penColor, width: w, a: p, b: p } : { type: "free", color: penColor, width: w, pts: [p] };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  };
  const photoPenMove = (e) => {
    if (!penDownRef.current || !curStrokeRef.current) return;
    const cv = drawCanvasRef.current, p = photoPenXY(e); if (!cv || !p) return;
    const st = curStrokeRef.current;
    if (st.type === "line") { st.b = p; redrawPhotoCanvas(st); return; }  // เส้นตรง: พรีวิวสด
    st.pts.push(p);
    const ctx = cv.getContext("2d"), a = st.pts[st.pts.length - 2];   // ปากกา: ลากทีละท่อน (ลื่น ไม่ต้องวาดใหม่ทั้งรูป)
    ctx.strokeStyle = st.color; ctx.lineWidth = st.width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const photoPenUp = () => {
    if (!curStrokeRef.current) { penDownRef.current = false; return; }
    const st = curStrokeRef.current; curStrokeRef.current = null; penDownRef.current = false;
    setStrokes((arr) => arr.concat([st]));
  };
  const openPhotoDraw = () => { setStrokes([]); setPhotoDraw(true); };
  const savePhotoDraw = () => {
    const cv = drawCanvasRef.current; if (!cv) return;
    const dataUrl = cv.toDataURL("image/jpeg", 0.85);
    const m = markers.find((mm) => mm.id === photoView); const ps = markerPhotos(m);
    const idx = Math.min(photoIdx, ps.length - 1);
    setMarkers((arr) => arr.map((mm) => {
      if (mm.id !== photoView) return mm;
      const list = markerPhotos(mm).slice(); list[idx] = dataUrl;
      const nm = Object.assign({}, mm, { photos: list }); delete nm.photo; return nm;
    }));
    mark(); setPhotoDraw(false); setStrokes([]);
  };

  const doSave = () => {
    const pgs = commitActive();           // เขียนหน้าที่กำลังแก้กลับเข้า array ก่อน
    const p0 = pgs[0] || {};
    save({
      pages: pgs,
      // มิเรอร์หน้าแรกไว้ที่ระดับบนสุด เผื่อโค้ด/ตัวอ่านเก่า
      image: p0.image || null, imgW: p0.imgW || 0, imgH: p0.imgH || 0, mpp: p0.mpp != null ? p0.mpp : null, calib: p0.calib || null,
      lines: p0.lines || [], markers: p0.markers || [], panels: p0.panels || [], micros: p0.micros || [], links: p0.links || [], notes: p0.notes || [],
      wp: +wp || PLAN_WP_DEFAULT, isc: +panelIsc || 0, ac: { kw: parseFloat(acKw) || 0, phase: acPhase, inv: invType },
      updatedAt: new Date().toISOString(), byName: (currentUser && currentUser.name) || "",
    });
    setDirty(false);
    onClose();
  };

  // ── สรุปของเบื้องต้น (รวมทุกหน้า — แต่ละหน้าใช้สเกลของตัวเอง) ──
  const summary = React.useMemo(() => {
    const live = { image, imgW: imgDim.w, imgH: imgDim.h, mpp, calib, lines, markers, panels, micros, links };
    const viewPages = pages.length ? pages.map((p, i) => (i === activePage ? Object.assign({}, p, live) : p)) : [live];
    // ระยะสายของเส้นในหน้านั้น (พิมพ์เอง > สเกลของหน้านั้น)
    const pgMeters = (ln, pg) => {
      if (ln.manualM != null && +ln.manualM > 0) return +ln.manualM;
      if (pg.mpp && ln.pts && ln.pts.length >= 2) {
        let s = 0; for (let i = 1; i < ln.pts.length; i++) { const a = ln.pts[i - 1], b = ln.pts[i]; s += Math.hypot((a.x - b.x) * (pg.imgW || 1), (a.y - b.y) * (pg.imgH || 1)); }
        return s * pg.mpp;
      }
      return null;
    };
    const cAcc = {}; PLAN_LINE_KINDS.forEach((k) => { cAcc[k.key] = { kind: k, count: 0, raw: 0, unknown: 0 }; });
    viewPages.forEach((pg) => { (pg.lines || []).forEach((l) => { const row = cAcc[l.kind]; if (!row) return; row.count += 1; const m = pgMeters(l, pg); if (m == null) row.unknown += 1; else row.raw += m; }); });
    // สาย AC เมน (ac links) รวมทุกหน้า → รวมเข้าแถว "สาย AC"
    let acTrunkM = 0, acTrunks = 0, acTrunkUnknown = 0;
    viewPages.forEach((pg) => {
      const nodePt = {}; (pg.micros || []).forEach((m) => { nodePt[m.id] = m; }); (pg.markers || []).forEach((m) => { if (m.kind === "combiner" || m.kind === "mdb") nodePt[m.id] = m; });
      (pg.links || []).forEach((l) => {
        if (!l.ac) return; acTrunks += 1;
        const a = nodePt[l.from], b = nodePt[l.to];
        if (a && b && pg.mpp) {
          const seq = (l.pts && l.pts.length) ? [a].concat(l.pts, [b]) : [a, b];
          let px = 0; for (let i = 1; i < seq.length; i++) px += Math.hypot((seq[i].x - seq[i - 1].x) * (pg.imgW || 1), (seq[i].y - seq[i - 1].y) * (pg.imgH || 1));
          acTrunkM += px * pg.mpp;
        } else acTrunkUnknown += 1;
      });
    });
    if (acTrunks > 0) { const r = cAcc.ac; r.count += acTrunks; r.raw += acTrunkM; r.unknown += acTrunkUnknown; }
    const cable = PLAN_LINE_KINDS.map((k) => cAcc[k.key]).filter((c) => c.count > 0).map((c) => Object.assign(c, { withSpare: Math.ceil(c.raw * (1 + c.kind.spare / 100)) }));
    // จัดกลุ่มท่อร้อยสายตามชนิด+ขนาด (จากที่ระบุต่อเส้น) — รวมระยะ + เผื่อ
    const condAcc = {};
    viewPages.forEach((pg) => { (pg.lines || []).forEach((l) => {
      const ck = l.conduit || "none"; if (ck === "none") return;
      const m = pgMeters(l, pg); if (m == null) return;
      const key = ck + "|" + (l.conduitSize || "");
      const row = condAcc[key] || { conduit: ck, size: l.conduitSize || "", raw: 0 };
      row.raw += m; condAcc[key] = row;
    }); });
    // ท่อของ "สายเชื่อม" (ไมโคร↔คอมบายเนอร์↔MDB) ที่ระบุท่อไว้ → รวมเข้ากลุ่มท่อด้วย
    viewPages.forEach((pg) => {
      const nodePt = {}; (pg.micros || []).forEach((m) => { nodePt[m.id] = m; }); (pg.markers || []).forEach((m) => { if (m.kind === "combiner" || m.kind === "mdb") nodePt[m.id] = m; });
      (pg.links || []).forEach((l) => {
        const ck = l.conduit || "none"; if (ck === "none") return;
        const a = nodePt[l.from], b = nodePt[l.to];
        let m = null;
        if (l.manualM != null && +l.manualM > 0) m = +l.manualM;
        else if (a && b && pg.mpp) { const seq = (l.pts && l.pts.length) ? [a].concat(l.pts, [b]) : [a, b]; let px = 0; for (let i = 1; i < seq.length; i++) px += Math.hypot((seq[i].x - seq[i - 1].x) * (pg.imgW || 1), (seq[i].y - seq[i - 1].y) * (pg.imgH || 1)); m = px * pg.mpp; }
        if (m == null) return;
        const key = ck + "|" + (l.conduitSize || "");
        const row = condAcc[key] || { conduit: ck, size: l.conduitSize || "", raw: 0 };
        row.raw += m; condAcc[key] = row;
      });
    });
    const conduitGroups = Object.keys(condAcc).map((k) => { const r = condAcc[k]; const sp = (PLAN_CONDUIT_BY[r.conduit] || {}).spare || 5; return Object.assign(r, { withSpare: Math.ceil(r.raw * (1 + sp / 100)) }); }).sort((a, b) => b.raw - a.raw);
    const equip = PLAN_MARKER_KINDS.map((k) => ({ kind: k, count: viewPages.reduce((s, pg) => s + (pg.markers || []).filter((m) => m.kind === k.key).length, 0) })).filter((e) => e.count > 0);
    const allPanels = []; const allMicros = [];
    viewPages.forEach((pg) => { (pg.panels || []).forEach((p) => allPanels.push(p)); (pg.micros || []).forEach((m) => allMicros.push(m)); });
    const panelTotal = allPanels.reduce((s, p) => s + (p.rows * p.cols), 0);
    const panelBlocks = allPanels.length;
    const microCount = allMicros.length;
    const microPanels = allMicros.reduce((s, m) => s + (Math.max(1, Math.round(m.n) || 1)), 0);
    const kwp = Math.round((microPanels * (+wp || 0)) / 1000 * 100) / 100;
    // จับคู่แผง↔ไมโคร: นับ "รายแผ่น" ที่จับคู่แล้วต่อไมโคร (id ตรงกันข้ามหน้าไม่มี เพราะจับคู่ในหน้าเดียวกัน)
    const pairedByIv = {}; let pairedCells = 0;
    allPanels.forEach((p) => { const cm = getCells(p); Object.keys(cm).forEach((k) => { const iv = cm[k]; if (iv) { pairedByIv[iv] = (pairedByIv[iv] || 0) + 1; pairedCells += 1; } }); });
    const pairedMicros = allMicros.map((m, i) => ({ id: m.id, label: "IV-" + (i + 1), modules: pairedByIv[m.id] || 0 }));
    const unpairedPanels = Math.max(0, panelTotal - pairedCells);
    const anyPaired = pairedCells > 0;
    const stringLinks = viewPages.reduce((s, pg) => s + (pg.links || []).filter((l) => !l.ac).length, 0);
    const hasCombiner = viewPages.some((pg) => (pg.markers || []).some((m) => m.kind === "combiner"));
    const needTrunk = microCount > 0 && acTrunks === 0; // มีไมโครแต่ยังไม่ต่อสาย AC เข้าคอมบายเนอร์ (หน้าไหนก็ได้)
    // จุดต่อรูป: จับกลุ่มตาม jid → มีอยู่หน้าไหนบ้าง
    const jmap = {};
    viewPages.forEach((pg) => { (pg.markers || []).forEach((m) => { if (m.kind === "xpage" && m.jid) { const e = jmap[m.jid] || { n: m.n, pages: [] }; e.pages.push(pg.name || "รูป"); jmap[m.jid] = e; } }); });
    const junctions = Object.keys(jmap).map((k) => ({ jid: k, n: jmap[k].n || 0, pages: jmap[k].pages })).sort((a, b) => a.n - b.n);
    return { cable, conduitGroups, equip, panelTotal, panelBlocks, microCount, microPanels, kwp, pairedMicros, unpairedPanels, anyPaired, stringLinks, acTrunks, acTrunkM, hasCombiner, needTrunk, junctions, pageCount: viewPages.length };
  }, [pages, activePage, lines, markers, panels, micros, links, wp, mpp, calib, imgDim]);

  // ── คำนวณสาย AC เมน (ไมโครตัวสุดท้าย → คอมบายเนอร์) — สาย CV-FD (XLPE 90°C) พิกัด วสท. ──
  const acCalc = React.useMemo(() => {
    const manual = parseFloat(acKw) || 0;
    // ไมโคร = คิดตามจำนวนแผง (kWp ของผัง) อัตโนมัติ · สตริง = คิดตามพิกัดอินเวอร์เตอร์ (กรอกเอง)
    const autoKw = invType === "micro" ? summary.kwp : 0;
    const kw = manual > 0 ? manual : autoKw;
    const V = acPhase === 3 ? 400 : 230;
    const I = kw > 0 ? (kw * 1000) / (acPhase === 3 ? Math.sqrt(3) * V : V) : 0;
    const need = I * 1.25;   // โหลดต่อเนื่อง × 1.25 ตามมาตรฐาน
    // CV-FD = ฉนวน XLPE 90°C → pickWireSize ด้วย insClass "xlpe"
    const size = (kw > 0 && window.BOQ && window.BOQ.pickWireSize)
      ? window.BOQ.pickWireSize(need, "xlpe", { method: "conduitAir", group: "g1", ncond: acPhase === 3 ? "3" : "2", core: "single" })
      : "—";
    const mm = parseFloat(size); // ดึงตัวเลข sq.mm จาก "X mm²"
    const cable = mm > 0 ? "CV-FD 1Cx" + mm + " sq.mm." : size; // ชื่อสายมาตรฐานในคลัง/BOQ
    return { kw, V, amp: Math.round(I * 10) / 10, need: Math.round(need * 10) / 10, size, cable, auto: !(manual > 0) && autoKw > 0 };
  }, [acKw, acPhase, invType, summary.kwp]);

  // ── คำนวณสาย DC (แผง → ไมโคร/สตริง) — PV1-F พิกัดเดียวกับ BOQ: กระแส = Isc × 1.25 ──
  const dcCalc = React.useMemo(() => {
    const isc = +panelIsc || 0;
    const need = isc * 1.25;   // ป้องกันกระแสเกินตามมาตรฐาน (เท่ากับ BOQ)
    const size = (isc > 0 && window.BOQ && window.BOQ.pickPvWireSize) ? window.BOQ.pickPvWireSize(need) : "—";
    const mm = parseFloat(size);
    const cable = mm > 0 ? "PV1-F " + mm + " sq.mm." : size;
    return { isc, amp: Math.round(need * 100) / 100, size, cable };
  }, [panelIsc]);

  // ── แนะนำจุดวางตู้คอมบายเนอร์: geometric median ของไมโครในหน้านี้ (สายรวมสั้นสุด) ──
  const suggestCombiner = React.useMemo(() => {
    if (!micros.length) return null;
    const W = disp.w || 1, H = disp.h || 1;
    let px = micros.reduce((s, m) => s + m.x, 0) / micros.length * W;
    let py = micros.reduce((s, m) => s + m.y, 0) / micros.length * H;
    for (let it = 0; it < 40; it++) {                    // Weiszfeld — ลู่เข้าหาจุดที่ผลรวมระยะน้อยสุด
      let sx = 0, sy = 0, sw = 0;
      micros.forEach((m) => {
        const d = Math.hypot(m.x * W - px, m.y * H - py) || 1e-6, w = 1 / d;
        sx += m.x * W * w; sy += m.y * H * w; sw += w;
      });
      px = sx / sw; py = sy / sw;
    }
    // ระยะรวมจากจุดนี้ไปทุกไมโคร (เมตร ถ้ามีมาตราส่วน)
    let totM = null;
    if (mpp && imgDim.w) { totM = 0; micros.forEach((m) => { totM += Math.hypot((m.x - px / W) * imgDim.w, (m.y - py / H) * imgDim.h) * mpp; }); }
    return { x: px / W, y: py / H, totM };
  }, [micros, disp.w, disp.h, mpp, imgDim]);
  const combinerOnPage = markers.some((m) => m.kind === "combiner");
  const showSuggest = tool === "marker" && markerKind === "combiner" && suggestCombiner && !combinerOnPage;

  // ── ถอดวัสดุจากผัง (BOQ) — รวมอุปกรณ์ + สาย (ขนาดแนะนำ) + ท่อ (ขนาดแนะนำ) ──
  const takeoff = React.useMemo(() => {
    const sizeOf = (key) => key === "dc" ? dcCalc.cable
      : key === "ac" ? acCalc.cable
      : key === "ground" ? "IEC01(THW) 1Cx6 sq.mm."
      : key === "lan" ? "LAN CAT6 UTP" : "";
    // แนะนำขนาดท่อ (IMC) จากมัดสายเมน AC + กราวด์ที่เดินในท่อ — fill ≤ 40% (เอนจิน BOQ)
    const bundle = [];
    const acMm = parseFloat(acCalc.size); if (acMm > 0) bundle.push({ type: "CV FD 1C", size: acMm, qty: acPhase === 3 ? 4 : 2 });
    bundle.push({ type: "IEC01 (THW)", size: 6, qty: 1 });
    const cp = (window.BOQ && window.BOQ.calcConduitSize) ? window.BOQ.calcConduitSize(bundle) : null;
    const conduitSize = cp && cp.imc ? cp.imc.label : "—";
    // อุปกรณ์
    const eq = [];
    if (summary.panelTotal > 0) eq.push({ label: "แผงโซลาร์" + (+wp > 0 ? " " + wp + "W" : ""), qty: summary.panelTotal, unit: "แผง" });
    if (summary.microCount > 0) eq.push({ label: "ไมโครอินเวอร์เตอร์ (" + summary.microPanels + " แผง)", qty: summary.microCount, unit: "ตัว" });
    summary.equip.forEach((e) => eq.push({ label: e.kind.label, qty: e.count, unit: "จุด" }));
    // สาย
    const cab = summary.cable.map((c) => ({ key: c.kind.key, label: c.kind.label, color: c.kind.color, count: c.count, meters: c.withSpare, size: c.kind.key === "conduit" ? "IMC " + conduitSize : sizeOf(c.kind.key), unknown: c.unknown }));
    // ท่อร้อยสาย แยกชนิด/ขนาด (จากที่ระบุต่อเส้น) — ขนาด "อัตโนมัติ" ใช้ค่าแนะนำจากมัดเมน
    const conduit = (summary.conduitGroups || []).map((g) => ({ conduit: g.conduit, label: (PLAN_CONDUIT_BY[g.conduit] || {}).short || g.conduit, size: g.size || conduitSize, auto: !g.size, meters: g.withSpare }));
    return { eq, cab, conduit, conduitSize, kwp: summary.kwp, estKwh: Math.round(summary.kwp * (+yieldFactor || 0)), estKwhMo: Math.round(summary.kwp * (+yieldFactor || 0) / 12) };
  }, [summary, dcCalc, acCalc, acPhase, wp, yieldFactor]);

  // สร้างข้อความใบถอดของ (คัดลอกไปใบเสนอราคา/แชต)
  const takeoffText = () => {
    const L = [];
    L.push("■ ถอดวัสดุจากผัง — " + (job ? (job.code || "") + " " + (job.name || "") : ""));
    L.push("ระบบ " + takeoff.kwp + " kWp · ประเมินผลิตไฟ ≈ " + takeoff.estKwh.toLocaleString() + " kWh/ปี (~" + takeoff.estKwhMo.toLocaleString() + " kWh/เดือน)");
    if (takeoff.eq.length) { L.push(""); L.push("[อุปกรณ์]"); takeoff.eq.forEach((e) => L.push("• " + e.label + " — " + e.qty.toLocaleString() + " " + e.unit)); }
    if (takeoff.cab.length) { L.push(""); L.push("[สาย/ท่อ]"); takeoff.cab.forEach((c) => L.push("• " + c.label + (c.size ? " · " + c.size : "") + " — " + c.meters.toLocaleString() + " ม. (" + c.count + " เส้น)")); }
    if (takeoff.conduit.length) { L.push(""); L.push("[ท่อร้อยสาย]"); takeoff.conduit.forEach((c) => L.push("• " + c.label + " " + c.size + (c.auto ? " (แนะนำ)" : "") + " — " + c.meters.toLocaleString() + " ม.")); }
    return L.join("\n");
  };
  const doCopyTakeoff = () => {
    const t = takeoffText();
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(() => { window.prompt("คัดลอกข้อความนี้:", t); });
    else window.prompt("คัดลอกข้อความนี้:", t);
  };

  // ── render helpers ──
  const PX = (fx, fy) => (fx * disp.w) + "," + (fy * disp.h);
  // ป้าย 📷 มุมจุดอุปกรณ์ที่มีรูปแนบ — แตะเพื่อเด้งรูปขึ้นดู (โชว์จำนวนรูปถ้ามีหลายรูป)
  const photoBadge = (cx, cy, id, count) => (
    <g onClick={(e) => { e.stopPropagation(); setPhotoIdx(0); setPhotoView(id); }} style={{ cursor: "pointer", pointerEvents: hideAnno ? "none" : "auto" }}>
      <circle cx={cx + 12} cy={cy - 11} r={8.5} fill="#111827" stroke="#fff" strokeWidth={1.6} />
      <text x={cx + 12} y={cy - 7.5} fontSize={9.5} textAnchor="middle" style={{ pointerEvents: "none" }}>📷</text>
      {count > 1 && <g pointerEvents="none"><circle cx={cx + 19} cy={cy - 17} r={6} fill="#EF4444" stroke="#fff" strokeWidth={1.2} /><text x={cx + 19} y={cy - 14} fontSize={8} fontWeight="800" fill="#fff" textAnchor="middle">{count}</text></g>}
    </g>
  );

  const toolBtn = (key, label, emoji) => {
    const on = tool === key;
    return (
      <button onClick={() => { setTool(on ? null : key); setDraft([]); setCalPts([]); setLinkFrom(null); setLinkPts([]); setPairFrom(null); }}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
          fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
          border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
          background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
        <span style={{ fontSize: 14 }}>{emoji}</span>{label}
      </button>
    );
  };

  // สไตล์ช่องกรอก/ปุ่มเล็กในแถบตั้งค่าแผง
  const pInp = { width: 54, padding: "5px 7px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12, textAlign: "right" };
  const pBtn = { padding: "5px 9px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, cursor: "pointer" };
  const pSel = { flex: 1, minWidth: 0, padding: "5px 8px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12, cursor: "pointer" };
  const pSel2 = { padding: "5px 8px", borderRadius: 7, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12, cursor: "pointer" };
  const lblS = { display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" };
  // เลือกรุ่นแผงจากคลัง → ดึงขนาด (กว้าง×ยาว) + Wp มาตั้งค่าให้อัตโนมัติ
  const selPanelModel = panelModels.find((p) => p.id === panelSku) || null;
  const applyPanelModel = (id) => {
    setPanelSku(id);
    const it = panelModels.find((p) => p.id === id);
    if (!it) return;
    if (+it.width > 0) setPanelShort(+it.width);
    if (+it.length > 0) setPanelLong(+it.length);
    if (+it.wp > 0) setWp(+it.wp);
    if (+it.isc > 0) setPanelIsc(+it.isc);
  };

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)", zIndex: 120, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 18 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "18px 18px 0 0" : 18, width: isMobile ? "100%" : "min(920px,100%)", maxHeight: isMobile ? "97dvh" : "95vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.35)" }}>
        {/* header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>ผังหน้างาน · {job ? job.code : ""}</div>
            <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job ? job.name : ""}</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12, background: "var(--surface2)" }}>
          {/* ── แท็บหน้า (หลายรูป · แต่ละหน้าคาลิเบรตของตัวเอง) ── */}
          {pages.length > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", paddingBottom: 2, flexShrink: 0 }}>
              {pages.map((p, i) => {
                const on = i === activePage;
                const hasImg = on ? !!image : !!p.image;
                return (
                  <div key={p.id} onClick={() => gotoPage(i)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 9, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"), background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)", fontSize: 12.5, fontWeight: 700 }}>
                    <span style={{ fontSize: 12 }}>{hasImg ? "🖼️" : "➕"}</span>
                    <span>{p.name || ("รูป " + (i + 1))}</span>
                    {on && <span onClick={(e) => { e.stopPropagation(); renamePage(i); }} title="เปลี่ยนชื่อหน้า" style={{ opacity: 0.55, marginLeft: 1 }}>✎</span>}
                    {pages.length > 1 && <span onClick={(e) => { e.stopPropagation(); deletePage(i); }} title="ลบหน้า" style={{ opacity: 0.55, fontWeight: 900, fontSize: 14 }}>×</span>}
                  </div>
                );
              })}
              <input ref={addFileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) addPageWithImage(f); e.target.value = ""; }} />
              <button onClick={() => (busy ? null : addFileRef.current && addFileRef.current.click())} disabled={busy} title="เพิ่มรูปหน้างานจริง (กดแล้วเลือกรูปได้เลย)" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: 9, border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontSize: 12.5, fontWeight: 700, cursor: busy ? "default" : "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "inherit" }}>＋ {busy ? "กำลังโหลด..." : "เพิ่มรูป"}</button>
              <button onClick={addPage} title="เพิ่มหน้าเปล่า (ไม่มีรูป)" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, padding: "6px 0", borderRadius: 9, border: "1px dashed var(--border)", background: "var(--surface)", color: "var(--text-3)", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>＋</button>
            </div>
          )}
          {!image ? (
            /* ── ยังไม่มีรูป ── */
            <div style={{ border: "2px dashed var(--border-strong)", borderRadius: 14, padding: "38px 20px", textAlign: "center", background: "var(--surface)" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>อัปโหลดรูปหน้า “{(pages[activePage] && pages[activePage].name) || "หลังคา"}”</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, marginBottom: 16 }}>ถ่ายรูปหลังคา/ผังบ้าน/จุดคอมบายเนอร์ แล้ววาดเส้นสาย + วางจุดอุปกรณ์ทับได้เลย · เพิ่มหลายรูปได้จากแท็บด้านบน</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) pickImage(f); e.target.value = ""; }} />
              <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                <Icon name="image" size={16} color="#fff" />{busy ? "กำลังโหลด..." : "เลือกรูป"}
              </button>
            </div>
          ) : (
            <React.Fragment>
              {/* ── แถบเครื่องมือ ── */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                {toolBtn("calib", mpp ? "คาลิเบรตใหม่" : "ตั้งมาตราส่วน", "📏")}
                {toolBtn("draw", "วาดสาย", "✏️")}
                {toolBtn("marker", "วางอุปกรณ์", "📍")}
                {toolBtn("photo", "รูปจุด", "📷")}
                {toolBtn("connect", "เชื่อม/จับคู่", "🔗")}
                {toolBtn("note", "คอมเมนต์", "💬")}
                {toolBtn("xpage", "ต่อรูป", "🔀")}
                {toolBtn("move", "ย้าย", "✋")}
                {toolBtn("erase", "ลบ", "🗑️")}
                <button onClick={undo} disabled={histLen === 0} title="ย้อนกลับสิ่งที่เพิ่งทำ"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
                    cursor: histLen === 0 ? "not-allowed" : "pointer", opacity: histLen === 0 ? 0.45 : 1,
                    border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)" }}>
                  <span style={{ fontSize: 14 }}>↩</span>ย้อนกลับ{histLen > 0 ? " (" + histLen + ")" : ""}
                </button>
                <button onClick={() => setShowGrid((v) => !v)} title="กริดช่วยจัดวางให้ตรง"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                    border: "1px solid " + (showGrid ? "var(--primary)" : "var(--border-strong)"), background: showGrid ? "var(--primary)" : "var(--surface)", color: showGrid ? "#fff" : "var(--text-2)" }}>
                  ▦ กริด
                </button>
                <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: mpp ? "var(--primary-dark)" : "#F59E0B" }}>
                  {mpp ? "มาตราส่วน: 1px ≈ " + (Math.round(mpp * 10000) / 10000) + " ม." : "⚠ ยังไม่ตั้งมาตราส่วน"}
                </span>
              </div>

              {/* ── ตัวเลือกชนิด (ตามเครื่องมือ) ── */}
              {tool === "draw" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  {PLAN_LINE_KINDS.map((k) => (
                    <button key={k.key} onClick={() => setLineKind(k.key)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                        border: "1px solid " + (lineKind === k.key ? k.color : "var(--border-strong)"), background: lineKind === k.key ? k.color + "18" : "var(--surface)", color: lineKind === k.key ? k.color : "var(--text-2)" }}>
                      <span style={{ width: 12, height: 3, borderRadius: 2, background: k.color }} />{k.label}
                    </button>
                  ))}
                  <button onClick={() => setSnapStraight((v) => !v)} title="ล็อกให้เส้นตรงแนวนอน/แนวตั้ง ไม่เอียง"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                      border: "1px solid " + (snapStraight ? "var(--primary)" : "var(--border-strong)"), background: snapStraight ? "var(--primary)18" : "var(--surface)", color: snapStraight ? "var(--primary)" : "var(--text-2)" }}>
                    📐 แนวตรง {snapStraight ? "ON" : "OFF"}
                  </button>
                  <span style={{ flex: 1 }} />
                  {draft.length > 0 && <button onClick={cancelDraft} style={{ padding: "6px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ยกเลิก</button>}
                  <button onClick={finishLine} disabled={draft.length < 2}
                    style={{ padding: "6px 13px", borderRadius: 9, border: "none", background: draft.length >= 2 ? "var(--primary)" : "var(--surface3)", color: draft.length >= 2 ? "#fff" : "var(--text-3)", fontSize: 12, fontWeight: 700, cursor: draft.length >= 2 ? "pointer" : "default", fontFamily: "inherit" }}>จบเส้น ({draft.length})</button>
                </div>
                {/* แถว 2: ขนาดสาย + ท่อร้อยสาย (ติดกับเส้นที่วาดต่อจากนี้) */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}>
                  <span style={{ color: "var(--text-2)", fontWeight: 700 }}>ขนาดสาย</span>
                  <select value={lineCores} onChange={(e) => setLineCores(+e.target.value || 1)} style={pSel2}>
                    {PLAN_WIRE_CORES.map((c) => <option key={c} value={c}>{c}C</option>)}
                  </select>
                  <select value={lineSize} onChange={(e) => setLineSize(+e.target.value || 0)} style={pSel2}>
                    <option value={0}>อัตโนมัติ (คำนวณ)</option>
                    {PLAN_WIRE_SQMM.map((s) => <option key={s} value={s}>{s} mm²</option>)}
                  </select>
                  <span style={{ width: 1, height: 20, background: "var(--border)" }} />
                  <span style={{ color: "var(--text-2)", fontWeight: 700 }}>เดินใน</span>
                  <select value={lineConduit} onChange={(e) => setLineConduit(e.target.value)} style={pSel2}>
                    {PLAN_CONDUITS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  {lineConduit !== "none" && (
                    <select value={lineConduitSize} onChange={(e) => setLineConduitSize(e.target.value)} style={pSel2}>
                      <option value="">ขนาดท่อ: อัตโนมัติ</option>
                      {PLAN_CONDUIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <span style={{ width: "100%", color: "var(--text-3)", fontSize: 10.5 }}>ตั้งค่านี้จะติดกับ “เส้นที่วาดต่อจากนี้” · เส้นเก่าแก้ได้ในรายการด้านล่าง · “อัตโนมัติ” = ใช้ค่าที่ระบบคำนวณจากกระแส</span>
                </div>
                </div>
              )}
              {tool === "marker" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PLAN_MARKER_KINDS.map((k) => (
                    <button key={k.key} onClick={() => setMarkerKind(k.key)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                        border: "1px solid " + (markerKind === k.key ? k.color : "var(--border-strong)"), background: markerKind === k.key ? k.color + "18" : "var(--surface)", color: markerKind === k.key ? k.color : "var(--text-2)" }}>
                      <Icon name={k.icon} size={13} color={k.color} />{k.label}
                    </button>
                  ))}
                  {[{ key: "panel", label: "แผงโซลาร์", color: PLAN_PANEL_COLOR, icon: "panel" },
                    { key: "micro", label: "ไมโครฯ", color: PLAN_MICRO_COLOR, icon: "bolt" }].map((k) => (
                    <button key={k.key} onClick={() => setMarkerKind(k.key)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                        border: "1px solid " + (markerKind === k.key ? k.color : "var(--border-strong)"), background: markerKind === k.key ? k.color + "18" : "var(--surface)", color: markerKind === k.key ? k.color : "var(--text-2)" }}>
                      <Icon name={k.icon} size={13} color={k.color} />{k.label}
                    </button>
                  ))}
                  {markerKind === "combiner" && (
                    <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "9px 12px", background: "#0EA5E90F", border: "1px solid #0EA5E940", borderRadius: 10, fontSize: 12, marginTop: 2 }}>
                      {!micros.length ? (
                        <span style={{ color: "var(--text-3)" }}>💡 วางไมโครฯ (🔌) ก่อน ระบบจะแนะนำจุดวางคอมบายเนอร์ที่สายรวมสั้นที่สุดให้</span>
                      ) : combinerOnPage ? (
                        <span style={{ color: "var(--text-3)" }}>✓ หน้านี้มีตู้คอมบายเนอร์แล้ว — ลากย้าย (✋) หรือแตะวางเพิ่มได้</span>
                      ) : (
                        <React.Fragment>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#0369A1", fontWeight: 700 }}>
                            <span style={{ width: 12, height: 12, borderRadius: 99, border: "2px dashed #0EA5E9" }} /> จุดแนะนำ (สายรวมสั้นสุด)
                            {suggestCombiner && suggestCombiner.totM != null && <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· รวม ≈ {fmtM(suggestCombiner.totM)}</span>}
                          </span>
                          <button onClick={() => { if (!suggestCombiner) return; setMarkers((p) => p.concat([{ id: _pid("m"), kind: "combiner", x: suggestCombiner.x, y: suggestCombiner.y }])); mark(); }}
                            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#0EA5E9", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            📍 วางที่จุดแนะนำ
                          </button>
                        </React.Fragment>
                      )}
                    </div>
                  )}
                </div>
              )}
              {tool === "xpage" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}>
                  {pages.length < 2 && <span style={{ color: "#F59E0B", fontWeight: 700, width: "100%" }}>⚠ ต้องมีอย่างน้อย 2 รูป — กด ＋ เพิ่มรูป ด้านบนก่อน</span>}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-2)" }}>
                    <span style={{ width: 12, height: 12, transform: "rotate(45deg)", background: PLAN_XPAGE_COLOR, borderRadius: 2 }} /> ต่อไปยังหน้า
                    <select value={junctionTarget} onChange={(e) => setJunctionTarget(e.target.value)} style={pSel}>
                      <option value="">— เลือกหน้าปลายทาง —</option>
                      {pages.map((p, i) => (i === activePage ? null : <option key={p.id} value={p.id}>{p.name || ("รูป " + (i + 1))}</option>))}
                    </select>
                  </span>
                  <span style={{ color: "var(--text-3)", fontSize: 10.5, width: "100%" }}>แตะจุดที่แนวท่อ/สายวิ่งออกไปอีกรูป · ระบบจะปักหมุดคู่ (เลขเดียวกัน) ให้ทั้งสองหน้า แล้วสลับหน้าไปลาก ✋ จัดตำแหน่งหมุดปลายทางได้</span>
                </div>
              )}
              {tool === "marker" && markerKind === "panel" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}>
                  {!mpp && <span style={{ color: "#F59E0B", fontWeight: 700, width: "100%" }}>⚠ ตั้งมาตราส่วนก่อน แผงถึงจะเท่าขนาดจริง</span>}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "100%", color: "var(--text-2)" }}>รุ่นแผง
                    <select value={panelSku} onChange={(e) => applyPanelModel(e.target.value)} style={pSel}>
                      <option value="">— เลือกรุ่นจากคลัง —</option>
                      {panelModels.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name}{+it.wp > 0 ? " · " + it.wp + "W" : ""}{+it.width > 0 && +it.length > 0 ? " · " + it.width + "×" + it.length + "ม." : " · (ยังไม่ตั้งขนาด)"}
                        </option>
                      ))}
                      {panelModels.length === 0 && <option value="" disabled>ไม่มีรุ่นแผงในคลัง</option>}
                    </select>
                  </span>
                  {selPanelModel && !(+selPanelModel.width > 0 && +selPanelModel.length > 0) && (
                    <span style={{ color: "#F59E0B", fontSize: 10.5, width: "100%" }}>⚠ รุ่นนี้ยังไม่ตั้งขนาดในคลัง — ใส่ ความกว้าง/ความยาว ที่หน้าคลังสินค้า แล้วเลือกใหม่</span>
                  )}
                  <div style={{ display: "inline-flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
                    {[["port", "แนวตั้ง"], ["land", "แนวนอน"]].map(([v, l]) => (
                      <button key={v} onClick={() => setPanelOrient(v)}
                        style={{ padding: "6px 11px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, background: panelOrient === v ? PLAN_PANEL_COLOR : "var(--surface)", color: panelOrient === v ? "#fff" : "var(--text-2)" }}>{l}</button>
                    ))}
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-2)" }}>แผง
                    <input type="number" step="0.01" value={panelShort} onChange={(e) => setPanelShort(+e.target.value || 0)} style={pInp} />×
                    <input type="number" step="0.01" value={panelLong} onChange={(e) => setPanelLong(+e.target.value || 0)} style={pInp} />ม.
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-2)" }}>แถว
                    <input type="number" value={panelRows} onChange={(e) => setPanelRows(Math.max(1, Math.round(+e.target.value || 1)))} style={Object.assign({}, pInp, { width: 44 })} />× คอลัมน์
                    <input type="number" value={panelCols} onChange={(e) => setPanelCols(Math.max(1, Math.round(+e.target.value || 1)))} style={Object.assign({}, pInp, { width: 44 })} />
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "var(--text-2)" }}>หมุน</span>
                    <button onClick={() => setPanelRot((r) => r - 15)} style={pBtn}>−15°</button>
                    <span style={{ fontFamily: "var(--mono)", fontWeight: 700, minWidth: 36, textAlign: "center" }}>{(((panelRot % 360) + 360) % 360)}°</span>
                    <button onClick={() => setPanelRot((r) => r + 15)} style={pBtn}>+15°</button>
                    <button onClick={() => setPanelRot(0)} style={pBtn}>รีเซ็ต</button>
                  </span>
                  <span style={{ color: "var(--text-3)", fontSize: 10.5, width: "100%" }}>แตะรูปเพื่อวางบล็อก {panelRows}×{panelCols} = <b>{panelRows * panelCols}</b> แผง</span>
                </div>
              )}
              {tool === "marker" && markerKind === "micro" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-2)" }}>แผงต่อตัว
                    <button onClick={() => setMicroN((n) => Math.max(1, n - 1))} style={pBtn}>−</button>
                    <span style={{ fontFamily: "var(--mono)", fontWeight: 700, minWidth: 22, textAlign: "center" }}>{microN}</span>
                    <button onClick={() => setMicroN((n) => n + 1)} style={pBtn}>+</button>
                    <span style={{ color: "var(--text-3)" }}>แผง</span>
                  </span>
                  <button onClick={() => setSnapStraight((v) => !v)} title="วางไมโครให้เรียงเป็นแถวตรงเดียวกันอัตโนมัติ"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                      border: "1px solid " + (snapStraight ? "var(--primary)" : "var(--border-strong)"), background: snapStraight ? "var(--primary)18" : "var(--surface)", color: snapStraight ? "var(--primary)" : "var(--text-2)" }}>
                    📐 เรียงแถว {snapStraight ? "ON" : "OFF"}
                  </button>
                  <span style={{ color: "var(--text-3)", fontSize: 10.5, width: "100%" }}>แตะรูปเพื่อวางไมโครอินเวอร์เตอร์ (แต่ละตัวรับ {microN} แผง) · <b>เรียงแถว ON</b> = แตะใกล้แถวเดิมแล้ว snap ให้ตรงกันเอง · จากนั้นใช้ 🔗 เชื่อมสาย</span>
                </div>
              )}
              {tool === "connect" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}>
                  <span style={{ color: "var(--text-2)", fontWeight: 700 }}>สีสตริง</span>
                  {PLAN_LINK_COLORS.map((c) => (
                    <button key={c} onClick={() => setLinkColor(c)} title={c}
                      style={{ width: 22, height: 22, borderRadius: 6, cursor: "pointer", background: c, border: linkColor === c ? "2px solid var(--text-1)" : "2px solid transparent", boxShadow: linkColor === c ? "0 0 0 1px #fff inset" : "none" }} />
                  ))}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-2)", fontWeight: 700 }}>
                    <span style={{ width: 22, height: 4, borderRadius: 2, background: PLAN_AC_TRUNK_COLOR }} /> AC เมน (→ คอมบายเนอร์)
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--text-2)", fontWeight: 700 }}>
                    <span style={{ width: 22, height: 4, borderRadius: 2, background: PLAN_AC_FEED_COLOR }} /> AC เข้าตู้ลูกค้า (คอมบายเนอร์ → MDB)
                  </span>
                  {linkFrom && <button onClick={() => { setLinkFrom(null); setLinkPts([]); }} style={pBtn}>ยกเลิกที่เลือก</button>}
                  <span style={{ color: "var(--text-3)", fontSize: 10.5, width: "100%" }}>
                    {micros.length < 1 ? "วางไมโครอินเวอร์เตอร์ก่อน (📍 วางอุปกรณ์ › ไมโครฯ)"
                      : (() => { const s = linkFrom ? linkNodeById(linkFrom) : null;
                          return s && s.type === "combiner" ? "แตะ ตู้ MDB (ตู้ไฟลูกค้า) = ลากสาย AC เข้าตู้ · แตะที่ว่างระหว่างทาง = หักมุม"
                            : linkFrom ? "เลือกไมโครอยู่ → แตะ “แผ่นแผง” = จับคู่ (แตะซ้ำ = ยกเลิก) · แตะไมโครตัวถัดไป = ต่อสตริง · แตะ ตู้คอมบายเนอร์ = จบสาย AC เมน · แตะที่ว่าง = หักมุม"
                            : "แตะไมโคร 1 ตัวก่อน แล้ว: แตะแผ่นแผง = จับคู่ · แตะไมโครอื่น = สตริง · แตะคอมบายเนอร์ = สาย AC เมน · (คอมบายเนอร์ → MDB = สายเข้าตู้ลูกค้า)"; })()}
                  </span>
                  {!summary.hasCombiner && <span style={{ color: "#F59E0B", fontSize: 10.5, width: "100%" }}>⚠ ยังไม่มีตู้คอมบายเนอร์ในผัง — วางด้วย 📍 วางอุปกรณ์ › Combiner ก่อน จึงจะต่อสาย AC เมนได้</span>}
                  {!markers.some((m) => m.kind === "mdb") && <span style={{ color: "#F59E0B", fontSize: 10.5, width: "100%" }}>⚠ ยังไม่มีตู้ MDB (ตู้ไฟลูกค้า) — วางด้วย 📍 วางอุปกรณ์ › ตู้ MDB ก่อน จึงจะลากสายเข้าตู้ลูกค้าได้</span>}
                </div>
              )}
              {tool === "calib" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{calPts.length < 2 ? "แตะ 2 จุดบนสิ่งที่รู้ความยาวจริง (" + calPts.length + "/2)" : "ใส่ความยาวจริงของเส้นนี้:"}</span>
                  {calPts.length === 2 && (
                    <React.Fragment>
                      <input type="number" value={calMetersInput} onChange={(e) => setCalMetersInput(e.target.value)} placeholder="เมตร"
                        style={{ width: 90, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13 }} />
                      <button onClick={() => {
                        const m = parseFloat(calMetersInput);
                        const nat = segNat(calPts[0], calPts[1]);
                        if (m > 0 && nat > 0) { setMpp(m / nat); setCalib({ a: calPts[0], b: calPts[1], meters: m }); mark(); setTool(null); setCalPts([]); setCalMetersInput(""); }
                      }} disabled={!(parseFloat(calMetersInput) > 0)}
                        style={{ padding: "7px 13px", borderRadius: 8, border: "none", background: parseFloat(calMetersInput) > 0 ? "var(--primary)" : "var(--surface3)", color: parseFloat(calMetersInput) > 0 ? "#fff" : "var(--text-3)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ตั้งค่า</button>
                    </React.Fragment>
                  )}
                  <button onClick={() => { setCalPts([]); setCalMetersInput(""); }} style={{ padding: "7px 11px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ล้าง</button>
                </div>
              )}

              {/* ── ภาพ + overlay ── */}
              <div style={{ position: "relative", flexShrink: 0, lineHeight: 0, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", cursor: tool === "move" ? "grab" : tool ? "crosshair" : "default", touchAction: tool === "move" ? "none" : "manipulation" }}
                onClick={onTap} onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
                <img ref={imgRef} src={image} onLoad={measure} alt="ผังหน้างาน" style={{ display: "block", width: "100%", height: "auto", userSelect: "none" }} draggable={false} />
                <svg width={disp.w} height={disp.h} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", opacity: hideAnno ? 0 : 1, transition: "opacity .12s" }}>
                  {/* ── กริดช่วยจัดวาง (ทุก 1 ม. ถ้ามีมาตราส่วน · ไม่งั้นแบ่ง 12 ช่อง) ── */}
                  {showGrid && disp.w > 0 && (() => {
                    const step = (mpp && imgDim.w) ? (disp.w / imgDim.w) / mpp : disp.w / 12; // px ต่อ 1 ม.
                    if (!(step > 4)) return null;
                    const vs = [], hs = [];
                    for (let x = step; x < disp.w; x += step) vs.push(x);
                    for (let y = step; y < disp.h; y += step) hs.push(y);
                    return (
                      <g pointerEvents="none">
                        {vs.map((x, i) => <line key={"gv" + i} x1={x} y1={0} x2={x} y2={disp.h} stroke="#0EA5E9" strokeWidth={0.6} opacity={0.28} />)}
                        {hs.map((y, i) => <line key={"gh" + i} x1={0} y1={y} x2={disp.w} y2={y} stroke="#0EA5E9" strokeWidth={0.6} opacity={0.28} />)}
                        {mpp && <text x={4} y={12} fontSize={9} fill="#0369A1" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 2.5, strokeLinejoin: "round" }}>กริด 1 ม.</text>}
                      </g>
                    );
                  })()}
                  {/* ── แผงโซลาร์ตามขนาดจริง (วาดใต้เส้น/จุด) ── */}
                  {mpp && panels.map((pnl) => {
                    const g = panelGeom(pnl);
                    const cm = getCells(pnl);
                    const cells = [];
                    for (let r = 0; r < pnl.rows; r++) for (let c = 0; c < pnl.cols; c++) {
                      const iv = cm[r * pnl.cols + c];
                      const mIdx = iv ? micros.findIndex((m) => m.id === iv) : -1;
                      const col = mIdx >= 0 ? PLAN_LINK_COLORS[mIdx % PLAN_LINK_COLORS.length] : PLAN_PANEL_COLOR;
                      const cx = g.x0 + c * (g.cw + g.gap), cy = g.y0 + r * (g.ch + g.gap);
                      cells.push(<rect key={"c" + r + "_" + c} x={cx} y={cy} width={g.cw} height={g.ch} rx={1.5}
                        fill={col} fillOpacity={mIdx >= 0 ? 0.5 : 0.3} stroke={col} strokeWidth={mIdx >= 0 ? 1.6 : 1.1} strokeOpacity={0.95} />);
                      if (mIdx >= 0 && g.cw > 16 && g.ch > 12) {
                        cells.push(<text key={"t" + r + "_" + c} x={cx + g.cw / 2} y={cy + g.ch / 2 + 3.2} fontSize={8.5} fontWeight="800" fill="#fff" textAnchor="middle"
                          transform={"rotate(" + (-(pnl.rot || 0)) + " " + (cx + g.cw / 2) + " " + (cy + g.ch / 2) + ")"}
                          style={{ paintOrder: "stroke", stroke: col, strokeWidth: 2.5, strokeLinejoin: "round" }}>{mIdx + 1}</text>);
                      }
                    }
                    return (
                      <g key={pnl.id} transform={"rotate(" + (pnl.rot || 0) + " " + g.cx + " " + g.cy + ")"}>
                        <rect x={g.x0 - 1.5} y={g.y0 - 1.5} width={g.totalW + 3} height={g.totalH + 3} rx={2.5} fill="none" stroke="#fff" strokeWidth={2} strokeOpacity={0.65} />
                        {cells}
                        <rect x={g.cx - 18} y={g.y0 - 16} width={36} height={13} rx={6} fill={PLAN_PANEL_COLOR} opacity={0.92} />
                        <text x={g.cx} y={g.y0 - 6} fontSize={9.5} fontWeight="800" fill="#fff" textAnchor="middle" transform={"rotate(" + (-(pnl.rot || 0)) + " " + g.cx + " " + (g.y0 - 9.5) + ")"}>{pnl.rows * pnl.cols} แผง</text>
                      </g>
                    );
                  })}
                  {/* ── เส้นจับคู่แผ่น ↔ ไมโคร (สีตามไมโคร) จากจุดกลางแต่ละแผ่นไปยังไมโคร ── */}
                  {panels.map((pnl) => {
                    const cm = getCells(pnl);
                    const segs = [];
                    Object.keys(cm).forEach((k) => {
                      const mIdx = micros.findIndex((m) => m.id === cm[k]);
                      if (mIdx < 0) return;
                      const idx = +k, r = Math.floor(idx / pnl.cols), c = idx % pnl.cols;
                      const cc = cellCenterPx(pnl, r, c);
                      const m = micros[mIdx], col = PLAN_LINK_COLORS[mIdx % PLAN_LINK_COLORS.length];
                      segs.push(<line key={pnl.id + "_" + k} x1={cc.X} y1={cc.Y} x2={m.x * disp.w} y2={m.y * disp.h}
                        stroke={col} strokeWidth={1.3} strokeDasharray="2 3" strokeOpacity={0.85} />);
                    });
                    return segs.length ? <g key={"pr" + pnl.id}>{segs}</g> : null;
                  })}
                  {/* ── สายเชื่อมไมโคร (สตริง) + สาย AC เมนเข้าคอมบายเนอร์ ── */}
                  {(() => {
                    const by = {}; micros.forEach((m) => { by[m.id] = m; }); markers.forEach((m) => { if (m.kind === "combiner" || m.kind === "mdb") by[m.id] = m; });
                    return links.map((lk) => {
                      const a = by[lk.from], b = by[lk.to]; if (!a || !b) return null;
                      const seq = (lk.pts && lk.pts.length) ? [a].concat(lk.pts, [b]) : [a, b];
                      const ptsStr = seq.map((p) => PX(p.x, p.y)).join(" ");
                      const col = lk.color || (lk.ac ? PLAN_AC_TRUNK_COLOR : "#06B6D4");
                      const mid = seq[Math.floor(seq.length / 2)] || a, lp = linkLabelXY(lk);
                      const lx = lp.x * disp.w, ly = lp.y * disp.h;
                      const spec = linkSpecText(lk);
                      const sw = Math.max(42, spec.length * 6.1 + 14);
                      const m = linkMeters(lk), dlbl = fmtM(m), dlw = Math.max(30, dlbl.length * 7.3 + 12);
                      const inMove = tool === "move";
                      return (
                        <g key={lk.id} onClick={(e) => { if (tool === "erase" || tool === "connect" || inMove) return; e.stopPropagation(); setLinkEdit(lk.id); }} style={{ cursor: inMove ? "move" : "pointer", pointerEvents: (tool === "erase" || tool === "connect" || inMove || hideAnno) ? "none" : "auto" }}>
                          <polyline points={ptsStr} fill="none" stroke="#000" strokeOpacity={0} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" style={{ pointerEvents: (tool === "erase" || tool === "connect" || inMove || hideAnno) ? "none" : "stroke" }} />
                          <polyline points={ptsStr} fill="none" stroke={col} strokeWidth={lk.ac ? 3.6 : 3} strokeOpacity={lk.ac ? 0.95 : 0.9} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={lk.ac ? undefined : "7 5"} />
                          {(lk.pts || []).map((p, i) => <circle key={i} cx={p.x * disp.w} cy={p.y * disp.h} r={lk.ac ? 3 : 2.6} fill={col} />)}
                          {lk.labelPos && (lk.ac || spec) && <line x1={mid.x * disp.w} y1={mid.y * disp.h} x2={lx} y2={ly} stroke={col} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />}
                          {lk.ac && (<g><rect x={lx - dlw / 2} y={ly - 25} width={dlw} height={16} rx={8} fill="#fff" opacity={0.82} /><text x={lx} y={ly - 13} fontSize={11} fontWeight="800" fill={col} textAnchor="middle" style={{ pointerEvents: "none" }}>{dlbl}</text></g>)}
                          {spec && (<g><rect x={lx - sw / 2} y={ly + 6} width={sw} height={15} rx={7} fill={col} opacity={0.95} /><text x={lx} y={ly + 16.5} fontSize={9.5} fontWeight="700" fill="#fff" textAnchor="middle" style={{ pointerEvents: "none" }}>{spec}</text></g>)}
                        </g>
                      );
                    });
                  })()}
                  {/* เส้นที่วาดแล้ว */}
                  {lines.map((ln) => {
                    const kc = (PLAN_LINE_BY[ln.kind] || {}).color || "#888";
                    const mid = lineMid(ln), lp = lineLabelXY(ln);
                    const m = lineMeters(ln);
                    const lx = lp.x * disp.w, ly = lp.y * disp.h;
                    const lbl = fmtM(m), lw = Math.max(30, lbl.length * 7.3 + 12);
                    const spec = lineSpecText(ln);
                    const hasSpec = (+ln.size > 0) || (ln.conduit && ln.conduit !== "none");
                    const sw = Math.max(42, spec.length * 6.1 + 14);
                    return (
                      <g key={ln.id}>
                        {/* เส้นโปร่งแสง เห็นรูปด้านล่างทะลุ ไม่บังจุดที่วาดตาม */}
                        <polyline points={ln.pts.map((p) => PX(p.x, p.y)).join(" ")} fill="none" stroke={kc} strokeWidth={3} strokeOpacity={0.8} strokeLinejoin="round" strokeLinecap="round" />
                        {ln.pts.map((p, i) => <circle key={i} cx={p.x * disp.w} cy={p.y * disp.h} r={3} fill={kc} fillOpacity={0.9} />)}
                        {ln.labelPos && <line x1={mid.x * disp.w} y1={mid.y * disp.h} x2={lx} y2={ly} stroke={kc} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />}
                        {/* ป้าย = แตะเพื่อปรับแต่ง (โหมดย้าย: ลากย้ายตำแหน่งป้าย) */}
                        <g onClick={(e) => { if (tool === "erase" || tool === "move") return; e.stopPropagation(); setLineEdit(ln.id); }} style={{ cursor: tool === "move" ? "move" : "pointer", pointerEvents: (tool === "erase" || tool === "move" || hideAnno) ? "none" : "auto" }}>
                          <rect x={lx - lw / 2} y={ly - 25} width={lw} height={16} rx={8} fill="#fff" opacity={0.82} />
                          <text x={lx} y={ly - 13} fontSize={11} fontWeight="800" fill={kc} textAnchor="middle" style={{ pointerEvents: "none" }}>{lbl}</text>
                          {hasSpec && spec && (
                            <g>
                              <rect x={lx - sw / 2} y={ly + 6} width={sw} height={15} rx={7} fill={kc} opacity={0.95} />
                              <text x={lx} y={ly + 16.5} fontSize={9.5} fontWeight="700" fill="#fff" textAnchor="middle" style={{ pointerEvents: "none" }}>{spec}</text>
                            </g>
                          )}
                        </g>
                      </g>
                    );
                  })}
                  {/* เส้นกำลังวาด */}
                  {draft.length > 0 && (
                    <g>
                      <polyline points={draft.map((p) => PX(p.x, p.y)).join(" ")} fill="none" stroke={(PLAN_LINE_BY[lineKind] || {}).color} strokeWidth={2.5} strokeDasharray="6 5" />
                      {draft.map((p, i) => <circle key={i} cx={p.x * disp.w} cy={p.y * disp.h} r={4} fill="#fff" stroke={(PLAN_LINE_BY[lineKind] || {}).color} strokeWidth={2} />)}
                    </g>
                  )}
                  {/* เส้นเชื่อมที่กำลังลาก (มีจุดหักมุม) */}
                  {tool === "connect" && linkFrom && linkPts.length > 0 && (() => {
                    const src = linkNodeById(linkFrom); if (!src) return null;
                    const col = src.type === "combiner" ? PLAN_AC_FEED_COLOR : PLAN_AC_TRUNK_COLOR;
                    const seq = [src].concat(linkPts);
                    return (
                      <g>
                        <polyline points={seq.map((p) => PX(p.x, p.y)).join(" ")} fill="none" stroke={col} strokeWidth={2.6} strokeDasharray="6 5" strokeLinejoin="round" />
                        {linkPts.map((p, i) => <circle key={i} cx={p.x * disp.w} cy={p.y * disp.h} r={4} fill="#fff" stroke={col} strokeWidth={2} />)}
                      </g>
                    );
                  })()}
                  {/* คาลิเบรต */}
                  {calib && <line x1={calib.a.x * disp.w} y1={calib.a.y * disp.h} x2={calib.b.x * disp.w} y2={calib.b.y * disp.h} stroke="#111" strokeWidth={2} strokeDasharray="3 3" opacity="0.5" />}
                  {calPts.map((p, i) => <circle key={"c" + i} cx={p.x * disp.w} cy={p.y * disp.h} r={5} fill="#F59E0B" stroke="#fff" strokeWidth={2} />)}
                  {calPts.length === 2 && <line x1={calPts[0].x * disp.w} y1={calPts[0].y * disp.h} x2={calPts[1].x * disp.w} y2={calPts[1].y * disp.h} stroke="#F59E0B" strokeWidth={2.5} />}
                  {/* จุดอุปกรณ์ + จุดต่อรูป */}
                  {markers.map((m) => {
                    if (m.kind === "xpage") {
                      const cx = m.x * disp.w, cy = m.y * disp.h;
                      const tgt = pages.find((p) => p.id === m.toPage);
                      const ti = pages.findIndex((p) => p.id === m.toPage);
                      return (
                        <g key={m.id} onClick={(e) => { if (tool === "erase" || tool === "move") return; if (ti >= 0) { e.stopPropagation(); gotoPage(ti); } }} style={{ cursor: ti >= 0 ? "pointer" : "default", pointerEvents: (ti >= 0 && tool !== "erase" && tool !== "move" && !hideAnno) ? "auto" : "none" }}>
                          <path d={"M" + cx + " " + (cy - 12) + " L" + (cx + 12) + " " + cy + " L" + cx + " " + (cy + 12) + " L" + (cx - 12) + " " + cy + " Z"} fill={PLAN_XPAGE_COLOR} stroke="#fff" strokeWidth={2.5} />
                          <text x={cx} y={cy + 3.6} fontSize={11} fontWeight="900" fill="#fff" textAnchor="middle" style={{ pointerEvents: "none" }}>{m.n}</text>
                          <text x={cx} y={cy + 25} fontSize={10} fontWeight="800" fill={PLAN_XPAGE_COLOR} textAnchor="middle" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3, strokeLinejoin: "round", pointerEvents: "none" }}>{"→ ไป " + (tgt ? tgt.name : "อีกหน้า")}</text>
                          {markerPhotos(m).length > 0 && photoBadge(cx, cy, m.id, markerPhotos(m).length)}
                        </g>
                      );
                    }
                    if (m.kind === "camera") {
                      const cx = m.x * disp.w, cy = m.y * disp.h, cnt = markerPhotos(m).length;
                      const clickable = tool !== "erase" && tool !== "move" && !hideAnno;
                      return (
                        <g key={m.id} onClick={(e) => { if (!clickable) return; e.stopPropagation(); if (cnt) { setPhotoIdx(0); setPhotoView(m.id); } else openMarkerPhotoPicker(m.id); }}
                          style={{ cursor: clickable ? "pointer" : (tool === "move" ? "move" : "default"), pointerEvents: clickable ? "auto" : "none" }}>
                          <circle cx={cx} cy={cy} r={13} fill="#F59E0B" stroke="#fff" strokeWidth={2.5} />
                          <text x={cx} y={cy + 5} fontSize={14} textAnchor="middle" style={{ pointerEvents: "none" }}>📷</text>
                          {cnt > 0 && <g><circle cx={cx + 11} cy={cy - 11} r={7} fill="#EF4444" stroke="#fff" strokeWidth={1.5} /><text x={cx + 11} y={cy - 7.6} fontSize={9} fontWeight="800" fill="#fff" textAnchor="middle" style={{ pointerEvents: "none" }}>{cnt}</text></g>}
                        </g>
                      );
                    }
                    const mk = PLAN_MARKER_BY[m.kind] || {};
                    const cx = m.x * disp.w, cy = m.y * disp.h;
                    return (
                      <g key={m.id}>
                        <circle cx={cx} cy={cy} r={10} fill={mk.color || "#888"} stroke="#fff" strokeWidth={2.5} />
                        <text x={cx} y={cy + 22} fontSize={11} fontWeight="700" fill={mk.color || "#555"} textAnchor="middle"
                          style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3, strokeLinejoin: "round" }}>{mk.label}</text>
                        {markerPhotos(m).length > 0 && photoBadge(cx, cy, m.id, markerPhotos(m).length)}
                      </g>
                    );
                  })}
                  {/* ── ไมโครอินเวอร์เตอร์ (วาดบนสุด) ── */}
                  {micros.map((m, i) => {
                    const cx = m.x * disp.w, cy = m.y * disp.h;
                    const sel = linkFrom === m.id || pairFrom === m.id;
                    const ringCol = pairFrom === m.id ? PLAN_LINK_COLORS[i % PLAN_LINK_COLORS.length] : linkColor;
                    return (
                      <g key={m.id}>
                        {sel && <circle cx={cx} cy={cy} r={17} fill="none" stroke={ringCol} strokeWidth={2.5} strokeDasharray="4 3" />}
                        <rect x={cx - 11} y={cy - 8} width={22} height={16} rx={3.5} fill={PLAN_MICRO_COLOR} stroke="#fff" strokeWidth={2} />
                        <path d={"M" + (cx - 3.5) + " " + (cy - 3.5) + " L" + (cx + 1) + " " + cy + " L" + (cx - 1) + " " + cy + " L" + (cx + 3.5) + " " + (cy + 3.5)} fill="none" stroke="#FBBF24" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
                        <circle cx={cx + 11} cy={cy - 8} r={7} fill={PLAN_MICRO_COLOR} stroke="#fff" strokeWidth={1.5} />
                        <text x={cx + 11} y={cy - 4.7} fontSize={9} fontWeight="800" fill="#FBBF24" textAnchor="middle">{m.n}</text>
                        <text x={cx} y={cy + 21} fontSize={10} fontWeight="800" fill={PLAN_MICRO_COLOR} textAnchor="middle"
                          style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3, strokeLinejoin: "round" }}>IV-{i + 1}</text>
                      </g>
                    );
                  })}
                  {/* ── คอมเมนต์/โน้ตบนภาพ (บนสุด · แตะเพื่อแก้ไข · ลากย้ายในโหมด ✋) ── */}
                  {notes.map((nt) => {
                    const g = noteBox(nt);
                    const empty = !(nt.text || "").trim();
                    const canEdit = tool !== "erase" && tool !== "move" && !hideAnno;
                    return (
                      <g key={nt.id} onClick={(e) => { if (tool === "erase" || tool === "move") return; e.stopPropagation(); setNoteEdit(nt.id); }}
                        style={{ cursor: tool === "move" ? "move" : "pointer", pointerEvents: canEdit ? "auto" : "none" }}>
                        <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={7} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1.4} opacity={0.97} />
                        <rect x={g.x} y={g.y} width={4} height={g.h} rx={2} fill="#F59E0B" />
                        {empty
                          ? <text x={g.x + 10} y={g.y + 16} fontSize={g.fs} fontStyle="italic" fill="#B45309" style={{ pointerEvents: "none" }}>แตะเพื่อพิมพ์…</text>
                          : g.rows.map((r, i) => <text key={i} x={g.x + 10} y={g.y + 16 + i * (g.fs + 5)} fontSize={g.fs} fontWeight="600" fill="#78350F" style={{ pointerEvents: "none", whiteSpace: "pre" }}>{r}</text>)}
                      </g>
                    );
                  })}
                  {showSuggest && (() => {
                    const cx = suggestCombiner.x * disp.w, cy = suggestCombiner.y * disp.h;
                    return (
                      <g key="suggest-combiner" pointerEvents="none">
                        {micros.map((m) => <line key={m.id} x1={cx} y1={cy} x2={m.x * disp.w} y2={m.y * disp.h} stroke="#0EA5E9" strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />)}
                        <circle cx={cx} cy={cy} r={15} fill="#0EA5E922" stroke="#0EA5E9" strokeWidth={2} strokeDasharray="5 4" />
                        <path d={"M" + cx + " " + (cy - 9) + " V" + (cy + 9) + " M" + (cx - 9) + " " + cy + " H" + (cx + 9)} stroke="#0EA5E9" strokeWidth={1.6} />
                        <text x={cx} y={cy + 28} fontSize={10} fontWeight="800" fill="#0369A1" textAnchor="middle"
                          style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3, strokeLinejoin: "round" }}>จุดแนะนำคอมบายเนอร์</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                {tool === "draw" ? ("แตะเพิ่มจุดเส้น แล้วกด “จบเส้น” · เลือกขนาดสาย + ท่อ (IMC/uPVC/ใต้ฝ้า/ฝังดิน) ได้ในแถบด้านบน" + (snapStraight ? " · 📐 แนวตรง ON" : ""))
                  : tool === "marker" ? (markerKind === "panel" ? "แตะรูปเพื่อวางบล็อกแผงตามขนาดจริง · ปรับแนว/จำนวน/มุมหมุนด้านบน · จุดที่แตะคือกึ่งกลางบล็อก"
                    : markerKind === "micro" ? "แตะรูปเพื่อวางไมโครอินเวอร์เตอร์ · ตั้งจำนวนแผงต่อตัวด้านบน · จากนั้นใช้ 🔗 เชื่อม/จับคู่"
                    : markerKind === "combiner" && micros.length ? "แตะวางตู้คอมบายเนอร์ · หรือกด “วางที่จุดแนะนำ” ให้ระบบเลือกจุดที่สายรวมสั้นสุดให้"
                    : "แตะตำแหน่งเพื่อวางจุดอุปกรณ์ที่เลือก")
                  : tool === "photo" ? "แตะที่ว่างตรงไหนก็ได้ → ปักจุดกล้อง 📷 แล้วเลือกรูปแนบทันที · หรือแตะจุดอุปกรณ์เดิม (ตู้ MDB/คอมบายเนอร์/จุดต่อ) เพื่อแนบรูป · แนบได้หลายรูปต่อจุด · จุดที่มีรูปมีเลขกำกับ แตะแล้วเด้งรูปขึ้นดู/วาดเขียนได้"
                  : tool === "connect" ? ("แตะไมโคร 1 ตัว → แตะแผ่นแผง = จับคู่ · แตะไมโครอื่น = สตริง · แตะคอมบายเนอร์ = สาย AC เมน (CV-FD) · คอมบายเนอร์ → MDB = สายเข้าตู้ลูกค้า · แตะที่ว่าง = “หักมุม”" + (snapStraight ? " · 📐 แนวตรง ON" : ""))
                  : tool === "note" ? "แตะตำแหน่งบนภาพเพื่อวางคอมเมนต์ แล้วพิมพ์ข้อความ · แตะคอมเมนต์เดิม = แก้ไข · ลากย้ายได้ในโหมด ✋ ย้าย"
                  : tool === "xpage" ? "เลือกหน้าปลายทางด้านบน แล้วแตะจุดที่แนวท่อ/สายวิ่งข้ามไปอีกรูป · ปักหมุดคู่ให้ทั้งสองหน้า (เลขเดียวกัน) · แตะหมุดที่มีอยู่ = เด้งไปหน้าที่เชื่อม"
                  : tool === "move" ? "ลากแผง / ไมโคร / จุดอุปกรณ์ / คอมเมนต์ · หรือ ลากป้ายข้อความ (ระยะ/ขนาดสาย) ไปวางตรงที่ไม่บังได้ (แตะค้างแล้วลาก)"
                  : tool === "calib" ? "แตะ 2 จุดที่รู้ความยาวจริง (เช่น ขอบหลังคา) แล้วใส่เมตร"
                  : tool === "erase" ? "แตะเส้น/จุด/แผง/ไมโคร/สาย/คอมเมนต์ที่ต้องการลบ"
                  : "เลือกเครื่องมือด้านบนเพื่อเริ่มวาด · เปลี่ยนรูปได้ที่ปุ่มด้านล่าง"}
              </div>

              {/* ── สรุปของเบื้องต้น ── */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
                  <Icon name="box" size={15} color="var(--primary-dark)" /> ประเมินของเบื้องต้น
                </div>
                {summary.microCount > 0 && (
                  <div style={{ background: PLAN_MICRO_COLOR, borderRadius: 12, padding: "12px 14px", marginBottom: 12, color: "#fff" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px", fontSize: 13.5, fontWeight: 800 }}>
                      <span><span style={{ fontSize: 18 }}>{summary.microCount}</span> ไมโครฯ</span>
                      <span style={{ opacity: 0.5 }}>=</span>
                      <span><span style={{ fontSize: 18 }}>{summary.microPanels}</span> แผง</span>
                      <span style={{ opacity: 0.5 }}>×</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <input type="number" value={wp} onChange={(e) => { setWp(+e.target.value || 0); mark(); }}
                          style={{ width: 58, padding: "3px 6px", borderRadius: 7, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.12)", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, textAlign: "right" }} /> Wp
                      </span>
                      <span style={{ opacity: 0.5 }}>=</span>
                      <span style={{ color: "#FBBF24" }}><span style={{ fontSize: 18 }}>{summary.kwp}</span> kWp</span>
                    </div>
                    <div style={{ fontSize: 10.5, opacity: 0.65, marginTop: 4 }}>สายเชื่อมสตริง {summary.stringLinks} เส้น · สาย AC เมนเข้าคอมบายเนอร์ {summary.acTrunks} เส้น{summary.acTrunkM > 0 ? " (" + fmtM(summary.acTrunkM) + ")" : ""} · จำนวนแผงนับจาก “แผงต่อไมโคร” แต่ละตัว</div>
                    {summary.needTrunk && (
                      <div style={{ fontSize: 10.5, color: "#FCD34D", marginTop: 5, fontWeight: 700 }}>
                        ⚠ ไมโครตัวสุดท้ายยังไม่ได้ต่อสาย AC เข้าตู้คอมบายเนอร์ — {summary.hasCombiner ? "ใช้ 🔗 แตะไมโครตัวสุดท้าย → ตู้คอมบายเนอร์ (อยู่หน้าเดียวกัน)" : "วางตู้คอมบายเนอร์ (📍) — จะอยู่หน้านี้หรือเพิ่มหน้าใหม่ก็ได้ แล้วต่อด้วย 🔗"}
                      </div>
                    )}
                  </div>
                )}
                {summary.anyPaired && (
                  <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>จับคู่แผง ↔ ไมโคร</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {summary.pairedMicros.filter((pm) => pm.modules > 0).map((pm, i) => {
                        const idx = summary.pairedMicros.indexOf(pm);
                        const col = PLAN_LINK_COLORS[idx % PLAN_LINK_COLORS.length];
                        return (
                          <span key={pm.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: col + "1c", color: "var(--text-1)", fontSize: 12, fontWeight: 700 }}>
                            <span style={{ width: 10, height: 10, borderRadius: 3, background: col }} />{pm.label} <b>{pm.modules}</b> แผง
                          </span>
                        );
                      })}
                    </div>
                    {summary.unpairedPanels > 0 && <div style={{ fontSize: 10.5, color: "#F59E0B", marginTop: 6 }}>⚠ ยังมีแผงที่ยังไม่จับคู่ {summary.unpairedPanels} แผ่น</div>}
                  </div>
                )}
                {summary.cable.length === 0 && summary.equip.length === 0 && summary.panelTotal === 0 && summary.microCount === 0 && summary.junctions.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", padding: "6px 0" }}>ยังไม่มีข้อมูล — วาดเส้นสายและวางจุดอุปกรณ์เพื่อดูสรุป</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {summary.cable.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>ระยะสาย / ท่อ (รวมเผื่อ){summary.pageCount > 1 ? " · รวมทุกหน้า (" + summary.pageCount + " รูป)" : ""}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {summary.cable.map((c) => (
                            <div key={c.kind.key} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
                              <span style={{ width: 12, height: 4, borderRadius: 2, background: c.kind.color, flexShrink: 0 }} />
                              <span style={{ flex: 1, color: "var(--text-1)", fontWeight: 600 }}>{c.kind.label} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· {c.count} เส้น</span></span>
                              <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: "var(--text-1)" }}>{fmtM(c.raw)}</span>
                              <span style={{ fontSize: 11, color: "var(--primary-dark)", fontWeight: 700, minWidth: 78, textAlign: "right" }}>→ สั่ง {c.withSpare.toLocaleString()} ม.</span>
                            </div>
                          ))}
                        </div>
                        {summary.cable.some((c) => c.unknown > 0) && <div style={{ fontSize: 10.5, color: "#F59E0B", marginTop: 5 }}>⚠ บางเส้นยังไม่รู้ระยะ (ตั้งมาตราส่วน หรือพิมพ์ความยาวในรายการด้านล่าง)</div>}
                      </div>
                    )}
                    {summary.cable.some((c) => c.kind.key === "dc") && (
                      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 11 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon name="panel" size={13} color="#EF4444" /> คำนวณสาย DC (PV) · PV1-F (พิกัด วสท.)
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                          <span style={{ color: "var(--text-2)" }}>Isc แผง</span>
                          <input type="number" step="0.01" value={panelIsc || ""} onChange={(e) => { setPanelIsc(+e.target.value || 0); mark(); }} placeholder="A"
                            style={{ width: 72, padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12.5, textAlign: "right" }} />
                          <span style={{ color: "var(--text-2)" }}>A</span>
                        </div>
                        <div style={{ marginTop: 9, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7 }}>
                          {dcCalc.isc > 0 ? (
                            <span>กระแสออกแบบ = Isc × 1.25 ≈ <b style={{ color: "var(--text-1)" }}>{dcCalc.amp}</b> A → สายแนะนำ <b style={{ color: "#b91c1c", fontSize: 14 }}>{dcCalc.cable}</b>
                              {(() => { const dc = summary.cable.find((c) => c.kind.key === "dc"); return dc && dc.raw > 0 ? <span> · ยาว <b style={{ color: "var(--text-1)" }}>{dc.withSpare.toLocaleString()}</b> ม.</span> : null; })()}
                            </span>
                          ) : <span style={{ color: "#F59E0B" }}>ใส่ค่า Isc ของแผง (หรือเลือกรุ่นแผงจากคลังที่กรอก Isc ไว้) เพื่อคำนวณขนาดสาย DC</span>}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>* สาย PV1-F ทองแดง XLPO 90°C ขั้นต่ำ 6 mm² ตาม วสท. (สูตร/พิกัดเดียวกับหน้า BOQ)</div>
                      </div>
                    )}
                    {summary.cable.some((c) => c.kind.key === "ac") && (
                      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 11 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                          <Icon name="bolt" size={13} color="#3B82F6" /> คำนวณสาย AC เมน · CV-FD (พิกัด วสท.)
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                          <span style={{ color: "var(--text-2)", fontWeight: 700 }}>ชนิดอินเวอร์เตอร์</span>
                          <div style={{ display: "inline-flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
                            {[["micro", "ไมโคร"], ["string", "สตริง"]].map(([v, l]) => (
                              <button key={v} onClick={() => { setInvType(v); mark(); }}
                                style={{ padding: "6px 13px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                                  background: invType === v ? "var(--primary)" : "var(--surface)", color: invType === v ? "#fff" : "var(--text-2)" }}>{l}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12.5, marginTop: 8 }}>
                          <span style={{ color: "var(--text-2)" }}>ระบบ</span>
                          <input type="number" value={acKw} onChange={(e) => { setAcKw(e.target.value); mark(); }} placeholder={invType === "micro" ? "auto " + summary.kwp : "kW"}
                            style={{ width: 78, padding: "6px 9px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12.5, textAlign: "right" }} />
                          <span style={{ color: "var(--text-2)" }}>kW</span>
                          {invType === "micro" && acCalc.auto && <span style={{ fontSize: 11, color: "var(--primary-dark)", fontWeight: 700 }}>= จากแผง {summary.microPanels} แผง (auto)</span>}
                          <div style={{ display: "inline-flex", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-strong)" }}>
                            {[1, 3].map((p) => (
                              <button key={p} onClick={() => { setAcPhase(p); mark(); }}
                                style={{ padding: "6px 12px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                                  background: acPhase === p ? "var(--primary)" : "var(--surface)", color: acPhase === p ? "#fff" : "var(--text-2)" }}>{p} เฟส</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginTop: 9, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7 }}>
                          ระบบ <b style={{ color: "var(--text-1)" }}>{acCalc.kw || 0}</b> kW → กระแส ≈ <b style={{ color: "var(--text-1)" }}>{acCalc.amp}</b> A <span style={{ color: "var(--text-3)" }}>(×1.25 = {acCalc.need} A)</span> → สายแนะนำ <b style={{ color: "#1d854b", fontSize: 14 }}>{acCalc.cable}</b>
                          {(() => { const ac = summary.cable.find((c) => c.kind.key === "ac"); return ac && ac.raw > 0 ? <span> · ยาว <b style={{ color: "var(--text-1)" }}>{ac.withSpare.toLocaleString()}</b> ม.</span> : null; })()}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 4 }}>* {invType === "micro" ? "ไมโคร: คิด kW จากจำนวนแผง × Wp อัตโนมัติ (พิมพ์ทับได้)" : "สตริง: กรอก kW พิกัดอินเวอร์เตอร์"} · สาย CV-FD (XLPE 90°C) เดินในท่อในอากาศ กลุ่ม 1 (เดียวกับ BOQ)</div>
                      </div>
                    )}
                    {(summary.equip.length > 0 || summary.panelTotal > 0) && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>จุดอุปกรณ์</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {summary.panelTotal > 0 && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, background: PLAN_PANEL_COLOR + "16", color: PLAN_PANEL_COLOR, fontSize: 12, fontWeight: 700 }}>
                              <Icon name="panel" size={13} color={PLAN_PANEL_COLOR} />แผงโซลาร์ <b>{summary.panelTotal}</b> แผง <span style={{ fontWeight: 400, color: "var(--text-3)" }}>· {summary.panelBlocks} บล็อก</span>
                            </span>
                          )}
                          {summary.equip.map((e) => (
                            <span key={e.kind.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, background: e.kind.color + "16", color: e.kind.color, fontSize: 12, fontWeight: 700 }}>
                              <Icon name={e.kind.icon} size={13} color={e.kind.color} />{e.kind.label} <b>{e.count}</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {summary.junctions.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>จุดต่อรูป</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {summary.junctions.map((j) => (
                            <span key={j.jid} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 99, background: PLAN_XPAGE_COLOR + "16", color: PLAN_XPAGE_COLOR, fontSize: 12, fontWeight: 700 }}>
                              <span style={{ display: "inline-grid", placeItems: "center", width: 16, height: 16, borderRadius: 99, background: PLAN_XPAGE_COLOR, color: "#fff", fontSize: 10 }}>{j.n}</span>
                              {j.pages.join(" ↔ ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── โหมดนำเสนอลูกค้า + ถอดวัสดุจากผัง (BOQ) ── */}
                    {(takeoff.kwp > 0 || takeoff.eq.length > 0 || takeoff.cab.length > 0) && (
                      <div style={{ borderTop: "2px solid var(--border)", paddingTop: 13 }}>
                        {takeoff.kwp > 0 && (
                          <div style={{ background: "linear-gradient(135deg,#0EA5E9,#1D4ED8)", borderRadius: 12, padding: "13px 15px", color: "#fff", marginBottom: 13 }}>
                            <div style={{ fontSize: 10.5, opacity: 0.85, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>สรุปสำหรับนำเสนอลูกค้า</div>
                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 16px", marginTop: 5 }}>
                              <span style={{ fontSize: 23, fontWeight: 800 }}>{takeoff.kwp}<span style={{ fontSize: 13, fontWeight: 700, marginLeft: 3 }}>kWp</span></span>
                              <span style={{ fontSize: 17, fontWeight: 800, color: "#FDE68A" }}>≈ {takeoff.estKwh.toLocaleString()}<span style={{ fontSize: 11.5, fontWeight: 700, marginLeft: 3 }}>kWh/ปี</span></span>
                              <span style={{ opacity: 0.85, fontSize: 12 }}>~{takeoff.estKwhMo.toLocaleString()} kWh/เดือน</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11, opacity: 0.92 }}>ผลิตไฟเฉลี่ย
                              <input type="number" value={yieldFactor} onChange={(e) => setYieldFactor(+e.target.value || 0)}
                                style={{ width: 58, padding: "3px 7px", borderRadius: 7, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.14)", color: "#fff", fontFamily: "inherit", fontSize: 12, fontWeight: 700, textAlign: "right" }} /> kWh/kWp/ปี
                              <span style={{ opacity: 0.7 }}>· {summary.panelTotal} แผง · {summary.microCount} ไมโครฯ</span>
                            </div>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
                            <Icon name="box" size={13} color="var(--primary-dark)" /> ถอดวัสดุจากผัง (BOQ)
                          </div>
                          <button onClick={doCopyTakeoff}
                            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", background: copied ? "#16A34A" : "var(--surface)", color: copied ? "#fff" : "var(--text-2)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {copied ? "✓ คัดลอกแล้ว" : "⧉ คัดลอกรายการ"}
                          </button>
                        </div>
                        {takeoff.eq.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            {takeoff.eq.map((e, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "4px 0", borderBottom: "1px dashed var(--border)" }}>
                                <span style={{ flex: 1, color: "var(--text-1)", fontWeight: 600 }}>{e.label}</span>
                                <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: "var(--text-1)" }}>{e.qty.toLocaleString()}</span>
                                <span style={{ color: "var(--text-3)", minWidth: 30 }}>{e.unit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {takeoff.cab.length > 0 && (
                          <div>
                            {takeoff.cab.map((c) => (
                              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "5px 0", borderBottom: "1px dashed var(--border)" }}>
                                <span style={{ width: 11, height: 4, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{c.label}</span>
                                  {c.size && <span style={{ color: "var(--primary-dark)", fontWeight: 700 }}> · {c.size}</span>}
                                </span>
                                <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap" }}>{c.meters.toLocaleString()} ม.</span>
                              </div>
                            ))}
                            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 6 }}>* ระยะรวมเผื่อแล้ว · ขนาดสาย/ท่อจากพิกัด วสท. (เอนจินเดียวกับหน้า BOQ) · ตรวจสอบก่อนสั่งของจริงทุกครั้ง</div>
                          </div>
                        )}
                        {takeoff.conduit.length > 0 && (
                          <div style={{ marginTop: 11 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>🧵 ท่อร้อยสาย (แยกชนิด/ขนาด)</div>
                            {takeoff.conduit.map((c, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "5px 0", borderBottom: "1px dashed var(--border)" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                                  <span style={{ padding: "2px 8px", borderRadius: 99, background: "#7C5CFC18", color: "#7C5CFC", fontSize: 11, fontWeight: 700 }}>{c.label}</span>
                                  <span style={{ color: "var(--text-1)", fontWeight: 700 }}>{c.size}</span>
                                  {c.auto && <span style={{ color: "var(--text-3)", fontSize: 10.5 }}>(แนะนำ)</span>}
                                </span>
                                <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap" }}>{c.meters.toLocaleString()} ม.</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── รายการเส้น (แก้ระยะเอง / ลบ) ── */}
              {lines.length > 0 && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>เส้นทั้งหมด ({lines.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {lines.map((ln, i) => {
                      const kc = PLAN_LINE_BY[ln.kind] || {};
                      const auto = mpp && ln.pts.length >= 2 ? lineNatLen(ln.pts) * mpp : null;
                      const setLn = (patch) => { setLines((arr) => arr.map((x, j) => j === i ? Object.assign({}, x, patch) : x)); mark(); };
                      return (
                        <div key={ln.id} style={{ display: "flex", flexDirection: "column", gap: 5, padding: "6px 0", borderBottom: i < lines.length - 1 ? "1px dashed var(--border)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ width: 12, height: 4, borderRadius: 2, background: kc.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-1)", fontWeight: 600 }}>{kc.label} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>#{i + 1}</span></span>
                            {auto != null && <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>วัดได้ {Math.round(auto * 10) / 10}</span>}
                            <input type="number" value={ln.manualM != null ? ln.manualM : ""} placeholder={auto != null ? "แก้ ม." : "ใส่ ม."}
                              onChange={(e) => { const v = e.target.value; setLn({ manualM: v === "" ? null : +v }); }}
                              style={{ width: 74, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12.5, textAlign: "right" }} />
                            <button onClick={() => { setLines((arr) => arr.filter((_, j) => j !== i)); mark(); }} title="ลบเส้น"
                              style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#EF444414", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="x" size={13} /></button>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, paddingLeft: 21 }}>
                            <select value={ln.cores || 1} onChange={(e) => setLn({ cores: +e.target.value || 1 })} style={Object.assign({}, pSel2, { fontSize: 11.5, padding: "4px 6px" })}>
                              {PLAN_WIRE_CORES.map((c) => <option key={c} value={c}>{c}C</option>)}
                            </select>
                            <select value={ln.size || 0} onChange={(e) => setLn({ size: +e.target.value || 0 })} style={Object.assign({}, pSel2, { fontSize: 11.5, padding: "4px 6px" })}>
                              <option value={0}>สาย: อัตโนมัติ</option>
                              {PLAN_WIRE_SQMM.map((s) => <option key={s} value={s}>{s} mm²</option>)}
                            </select>
                            <select value={ln.conduit || "none"} onChange={(e) => setLn({ conduit: e.target.value })} style={Object.assign({}, pSel2, { fontSize: 11.5, padding: "4px 6px" })}>
                              {PLAN_CONDUITS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                            </select>
                            {(ln.conduit && ln.conduit !== "none") && (
                              <select value={ln.conduitSize || ""} onChange={(e) => setLn({ conduitSize: e.target.value })} style={Object.assign({}, pSel2, { fontSize: 11.5, padding: "4px 6px" })}>
                                <option value="">ท่อ: อัตโนมัติ</option>
                                {PLAN_CONDUIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* เปลี่ยนรูป */}
              <div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) { if (lines.length || markers.length ? confirm("เปลี่ยนรูปจะล้างเส้น/จุดทั้งหมด ยืนยัน?") : true) pickImage(f); } e.target.value = ""; }} />
                <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                  <Icon name="image" size={14} color="var(--text-2)" /> เปลี่ยนรูป
                </button>
              </div>
            </React.Fragment>
          )}
        </div>

        {/* input แนบรูปถ่ายจริงให้จุดอุปกรณ์ */}
        <input ref={markerPhotoRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) attachMarkerPhoto(f); e.target.value = ""; }} />
        {/* popover ปรับแต่งสาย (แตะป้ายบนภาพ) */}
        {noteEdit && (() => {
          const nt = notes.find((n) => n.id === noteEdit); if (!nt) return null;
          // ปิดกล่อง: ถ้าไม่ได้พิมพ์อะไร (ว่าง) ให้ลบโน้ตนั้นทิ้ง
          const close = () => { setNotes((arr) => arr.filter((n) => !(n.id === nt.id && !(n.text || "").trim()))); mark(); setNoteEdit(null); };
          return (
            <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(8,12,10,.55)", zIndex: 210, display: "grid", placeItems: "center", padding: 18 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, padding: 16, width: "min(340px,100%)", boxShadow: "0 20px 60px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>💬</span>
                  <b style={{ fontSize: 14, color: "var(--text-1)" }}>คอมเมนต์บนภาพ</b>
                </div>
                <textarea autoFocus value={nt.text || ""}
                  onChange={(e) => { const v = e.target.value; setNotes((arr) => arr.map((n) => (n.id === nt.id ? Object.assign({}, n, { text: v }) : n))); }}
                  placeholder="พิมพ์ข้อความ เช่น จุดนี้ต้องเจาะผนัง / ระวังท่อประปา / เดินสายเลี่ยงหน้าต่าง"
                  rows={4} style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.5, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <button onClick={() => { setNotes((arr) => arr.filter((n) => n.id !== nt.id)); mark(); setNoteEdit(null); }} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #EF444455", background: "#EF444414", color: "#EF4444", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบ</button>
                  <button onClick={close} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>เสร็จ</button>
                </div>
              </div>
            </div>
          );
        })()}
        {lineEdit && (() => {
          const ln = lines.find((l) => l.id === lineEdit); if (!ln) return null;
          const kc = PLAN_LINE_BY[ln.kind] || {};
          const auto = mpp && ln.pts.length >= 2 ? Math.round(lineNatLen(ln.pts) * mpp * 10) / 10 : null;
          const selS = Object.assign({}, pSel2, { fontSize: 12.5, padding: "7px 9px", width: "100%" });
          return (
            <div onClick={() => setLineEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(8,12,10,.55)", zIndex: 210, display: "grid", placeItems: "center", padding: 18 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, padding: 16, width: "min(320px,100%)", boxShadow: "0 20px 60px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 5, borderRadius: 3, background: kc.color }} />
                  <b style={{ fontSize: 14, color: "var(--text-1)" }}>ปรับแต่งสาย</b>
                  {auto != null && <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>วัดได้ {auto} ม.</span>}
                </div>
                <label style={lblS}>ชนิดสาย
                  <select value={ln.kind} onChange={(e) => updateLine(ln.id, { kind: e.target.value })} style={selS}>
                    {PLAN_LINE_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
                  </select>
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={Object.assign({}, lblS, { width: 88 })}>จำนวนแกน
                    <select value={ln.cores || 1} onChange={(e) => updateLine(ln.id, { cores: +e.target.value || 1 })} style={selS}>
                      {PLAN_WIRE_CORES.map((c) => <option key={c} value={c}>{c}C</option>)}
                    </select>
                  </label>
                  <label style={Object.assign({}, lblS, { flex: 1 })}>ขนาดสาย
                    <select value={ln.size || 0} onChange={(e) => updateLine(ln.id, { size: +e.target.value || 0 })} style={selS}>
                      <option value={0}>อัตโนมัติ (คิดให้)</option>
                      {PLAN_WIRE_SQMM.map((s) => <option key={s} value={s}>{s} mm²</option>)}
                    </select>
                  </label>
                </div>
                <label style={lblS}>เดินในท่อ
                  <select value={ln.conduit || "none"} onChange={(e) => updateLine(ln.id, { conduit: e.target.value })} style={selS}>
                    {PLAN_CONDUITS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </label>
                {ln.conduit && ln.conduit !== "none" && (
                  <label style={lblS}>ขนาดท่อ
                    <select value={ln.conduitSize || ""} onChange={(e) => updateLine(ln.id, { conduitSize: e.target.value })} style={selS}>
                      <option value="">อัตโนมัติ (คิดให้)</option>
                      {PLAN_CONDUIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                )}
                <label style={lblS}>ระยะ (ม.) — เว้นว่าง = ใช้ค่าที่วัดได้
                  <input type="number" value={ln.manualM != null ? ln.manualM : ""} placeholder={auto != null ? String(auto) : "ใส่ ม."}
                    onChange={(e) => { const v = e.target.value; updateLine(ln.id, { manualM: v === "" ? null : +v }); }}
                    style={Object.assign({}, selS, { textAlign: "right" })} />
                </label>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <button onClick={() => { setLines((arr) => arr.filter((l) => l.id !== ln.id)); mark(); setLineEdit(null); }} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #EF444455", background: "#EF444414", color: "#EF4444", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบเส้น</button>
                  <button onClick={() => setLineEdit(null)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>เสร็จ</button>
                </div>
              </div>
            </div>
          );
        })()}
        {/* popover ปรับแต่งสายเชื่อม (แตะสายไมโคร/คอมบายเนอร์/MDB บนภาพ) */}
        {linkEdit && (() => {
          const lk = links.find((l) => l.id === linkEdit); if (!lk) return null;
          const col = lk.color || (lk.ac ? PLAN_AC_TRUNK_COLOR : "#06B6D4");
          const auto = linkMeters({ id: lk.id, from: lk.from, to: lk.to, pts: lk.pts, ac: lk.ac });
          const autoR = auto != null ? Math.round(auto * 10) / 10 : null;
          const selS = Object.assign({}, pSel2, { fontSize: 12.5, padding: "7px 9px", width: "100%" });
          const base = lk.ac ? "CV-FD (สาย AC)" : "PV (สตริง DC)";
          return (
            <div onClick={() => setLinkEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(8,12,10,.55)", zIndex: 210, display: "grid", placeItems: "center", padding: 18 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 14, padding: 16, width: "min(320px,100%)", boxShadow: "0 20px 60px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 5, borderRadius: 3, background: col }} />
                  <b style={{ fontSize: 13.5, color: "var(--text-1)" }}>{linkTitle(lk)}</b>
                  {autoR != null && <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>วัดได้ {autoR} ม.</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>ชนิดสาย: {base}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={Object.assign({}, lblS, { width: 88 })}>จำนวนแกน
                    <select value={lk.cores || 1} onChange={(e) => updateLink(lk.id, { cores: +e.target.value || 1 })} style={selS}>
                      {PLAN_WIRE_CORES.map((c) => <option key={c} value={c}>{c}C</option>)}
                    </select>
                  </label>
                  <label style={Object.assign({}, lblS, { flex: 1 })}>ขนาดสาย
                    <select value={lk.size || 0} onChange={(e) => updateLink(lk.id, { size: +e.target.value || 0 })} style={selS}>
                      <option value={0}>อัตโนมัติ (คิดให้)</option>
                      {PLAN_WIRE_SQMM.map((s) => <option key={s} value={s}>{s} mm²</option>)}
                    </select>
                  </label>
                </div>
                <label style={lblS}>เดินในท่อ
                  <select value={lk.conduit || "none"} onChange={(e) => updateLink(lk.id, { conduit: e.target.value })} style={selS}>
                    {PLAN_CONDUITS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </label>
                {lk.conduit && lk.conduit !== "none" && (
                  <label style={lblS}>ขนาดท่อ
                    <select value={lk.conduitSize || ""} onChange={(e) => updateLink(lk.id, { conduitSize: e.target.value })} style={selS}>
                      <option value="">อัตโนมัติ (คิดให้)</option>
                      {PLAN_CONDUIT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                )}
                <label style={lblS}>ระยะ (ม.) — เว้นว่าง = ใช้ค่าที่วัดได้
                  <input type="number" value={lk.manualM != null ? lk.manualM : ""} placeholder={autoR != null ? String(autoR) : "ใส่ ม."}
                    onChange={(e) => { const v = e.target.value; updateLink(lk.id, { manualM: v === "" ? null : +v }); }}
                    style={Object.assign({}, selS, { textAlign: "right" })} />
                </label>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <button onClick={() => { setLinks((arr) => arr.filter((l) => l.id !== lk.id)); mark(); setLinkEdit(null); }} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #EF444455", background: "#EF444414", color: "#EF4444", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบสาย</button>
                  <button onClick={() => setLinkEdit(null)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>เสร็จ</button>
                </div>
              </div>
            </div>
          );
        })()}
        {/* lightbox: เด้งรูปจุดอุปกรณ์ขึ้นมาดูเต็มจอ (แกลเลอรีหลายรูป) */}
        {photoView && (() => {
          const m = markers.find((mm) => mm.id === photoView);
          const ps = markerPhotos(m); if (!m || ps.length === 0) return null;
          const idx = Math.min(photoIdx, ps.length - 1);
          const title = m.kind === "xpage" ? ("จุดต่อ " + (m.n || "")) : ((PLAN_MARKER_BY[m.kind] || {}).label || "จุดอุปกรณ์");
          const navBtn = { width: 42, height: 42, borderRadius: 99, border: "1px solid rgba(255,255,255,.35)", background: "rgba(0,0,0,.35)", color: "#fff", fontSize: 20, fontWeight: 800, cursor: "pointer", flexShrink: 0 };
          return (
            <div onClick={() => { if (!photoDraw) setPhotoView(null); }} style={{ position: "fixed", inset: 0, background: "rgba(8,12,10,.9)", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16 }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>📷 {title} {photoDraw && <span style={{ opacity: 0.8, fontWeight: 700, fontSize: 13 }}>· ✏️ วาด/เขียน</span>} {!photoDraw && ps.length > 1 && <span style={{ opacity: 0.7, fontWeight: 600, fontSize: 13 }}>· {idx + 1}/{ps.length}</span>}</div>
              {photoDraw ? (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "100%" }}>
                  <canvas ref={drawCanvasRef} onPointerDown={photoPenDown} onPointerMove={photoPenMove} onPointerUp={photoPenUp} onPointerCancel={photoPenUp}
                    style={{ maxWidth: "84vw", maxHeight: "56vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,.5)", touchAction: "none", cursor: "crosshair", background: "#000" }} />
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "100%" }}>
                  {ps.length > 1 && <button onClick={() => setPhotoIdx((i) => (i - 1 + ps.length) % ps.length)} style={navBtn}>‹</button>}
                  <img src={ps[idx]} alt={title} style={{ maxWidth: "82vw", maxHeight: "64vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,.5)", objectFit: "contain" }} />
                  {ps.length > 1 && <button onClick={() => setPhotoIdx((i) => (i + 1) % ps.length)} style={navBtn}>›</button>}
                </div>
              )}
              {!photoDraw && ps.length > 1 && (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 6, maxWidth: "90vw", overflowX: "auto", padding: "2px 0" }}>
                  {ps.map((p, i) => (
                    <img key={i} src={p} onClick={() => setPhotoIdx(i)} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 7, cursor: "pointer", flexShrink: 0, border: i === idx ? "2px solid var(--primary)" : "2px solid rgba(255,255,255,.25)" }} />
                  ))}
                </div>
              )}
              {photoDraw ? (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
                  {[["free", "✏️ ปากกา"], ["line", "📏 เส้นสายไฟ"], ["text", "🆎 ข้อความ"]].map(([mo, lb]) => (
                    <button key={mo} onClick={() => setPenMode(mo)}
                      style={{ padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, border: penMode === mo ? "2px solid #fff" : "1px solid rgba(255,255,255,.35)", background: penMode === mo ? "var(--primary)" : "transparent", color: "#fff" }}>{lb}</button>
                  ))}
                  <span style={{ width: 1, height: 22, background: "rgba(255,255,255,.25)" }} />
                  {["#EF4444", "#3B82F6", "#FACC15", "#22C55E", "#FFFFFF", "#111827"].map((c) => (
                    <button key={c} onClick={() => setPenColor(c)} title={c}
                      style={{ width: 26, height: 26, borderRadius: 99, cursor: "pointer", background: c, border: penColor === c ? "3px solid #fff" : "2px solid rgba(255,255,255,.4)", boxShadow: penColor === c ? "0 0 0 2px var(--primary)" : "none" }} />
                  ))}
                  <span style={{ width: 1, height: 22, background: "rgba(255,255,255,.25)" }} />
                  <button onClick={() => setStrokes((arr) => arr.slice(0, -1))} disabled={!strokes.length} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: strokes.length ? "pointer" : "default", opacity: strokes.length ? 1 : 0.4 }}>↩ เลิกทำ</button>
                  <button onClick={() => setStrokes([])} disabled={!strokes.length} style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: strokes.length ? "pointer" : "default", opacity: strokes.length ? 1 : 0.4 }}>ล้าง</button>
                  <button onClick={savePhotoDraw} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ บันทึกรูป</button>
                  <button onClick={() => { setPhotoDraw(false); setStrokes([]); }} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={openPhotoDraw} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#F59E0B", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✏️ วาด/เขียน</button>
                  <button onClick={() => openMarkerPhotoPicker(m.id)} disabled={busy} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>{busy ? "กำลังโหลด..." : "＋ เพิ่มรูป"}</button>
                  <button onClick={() => { if (confirm("ลบรูปนี้?")) removeMarkerPhotoAt(m.id, idx); }} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ลบรูปนี้</button>
                  <button onClick={() => setPhotoView(null)} style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,.35)", background: "transparent", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ปิด</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* footer */}
        <div style={{ display: "flex", gap: 10, padding: "12px 16px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          {(() => { const canSave = !!image || pages.some((p) => p.image); return (
          <button onClick={doSave} disabled={!canSave}
            style={{ flex: 1, padding: "11px", borderRadius: 11, border: "none", background: canSave ? "var(--primary)" : "var(--surface3)", color: canSave ? "#fff" : "var(--text-3)", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: canSave ? "pointer" : "default", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="check" size={16} color={canSave ? "#fff" : "var(--text-3)"} sw={2.4} /> บันทึกผัง{dirty ? " *" : ""}
          </button>
          ); })()}
        </div>
      </div>
    </div>
  );
}

// ระยะจากจุดถึงเซกเมนต์ (px)
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay; const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / l2; t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

Object.assign(window, { SitePlanEditor, useSitePlan, PLAN_LINE_KINDS, PLAN_MARKER_KINDS });
