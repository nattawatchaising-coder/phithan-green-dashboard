/* ============================================================
   SolarFlow / PHITHAN GREEN — main app shell
   ============================================================ */

/* เมนูซ้าย — คุมด้วย "สิทธิ์" ไม่ใช่ชื่อตำแหน่ง เพราะคนหนึ่งคนถือได้หลายตำแหน่ง
   perm ว่าง = ทุกคนที่ล็อกอินเห็น · own = เห็นเมื่อบัญชีผูกกับพนักงานในระบบ (มีงานเป็นของตัวเอง) */
const NAV = [
  { key: "overview",   th: "ภาพรวม",         en: "Overview",      icon: "grid" },
  { key: "board",      th: "บอร์ดงาน",        en: "Workflow",      icon: "kanban" },
  { key: "table",      th: "ฐานข้อมูลงาน",     en: "Database",      icon: "table",    perm: "viewAll" },
  { key: "sales",      th: "บอร์ดขาย",         en: "Sales Board",   icon: "trend",    perm: "leads" },
  { key: "leads",      th: "ลูกค้าสำรวจ",      en: "Survey Leads",  icon: "user",     perm: "leads" },
  { key: "saleskpi",   th: "ยอดขาย",           en: "Sales KPI",     icon: "grid",     perm: "price" },
  // "สถานะสำรวจ" (SurveyView) ถอดออกจากเมนูแล้ว — การสำรวจย้ายไปอยู่กับ "ลูกค้าสำรวจ" ทั้งหมด
  // งานในฐานงานมาจากลูกค้าที่แปลงแล้ว (พกแบบสำรวจติดมาด้วย) · โค้ดหน้ายังอยู่ใน views-survey.jsx ถ้าอยากได้คืน
  { key: "dispatch",   th: "จัดตารางสำรวจ",    en: "Dispatch",      icon: "calendar", perm: "dispatch" },
  { key: "permit",     th: "ขออนุญาตการไฟฟ้า", en: "Permit",        icon: "shield",   perm: "permit" },
  { key: "myschedule", th: "ตารางงานของฉัน",   en: "My Schedule",   icon: "list",     own: true },
  { key: "calendar",   th: "ปฏิทินนัด",        en: "Calendar",      icon: "calendar" },
  { key: "stock",      th: "คลังสินค้า",       en: "Inventory",     icon: "box",      perm: "stock" },
  { key: "report",     th: "รายงานสรุป",       en: "Report",        icon: "file",     perm: "viewAll" },
];
/* คนที่ถือตำแหน่ง "ฝ่ายขออนุญาต" อย่างเดียว — บอร์ดขั้นงานติดตั้งไม่มีความหมายกับเขา
   (งานกองอยู่ขั้น "เสร็จสิ้น" หมด) บอร์ดงานของเขาจึงเป็นบอร์ดขออนุญาตแทน */
const isPermitOnly = (roles) => (roles || []).length > 0 && roles.every((r) => (ROLE_ALIAS[r] || r) === "permit");
/* เซลล์อย่างเดียวก็เหมือนกัน — บอร์ดขั้นติดตั้งเป็นงานของช่าง ไม่ใช่ของเขา
   งานของเขาคือลูกค้าที่ยังไม่ปิด บอร์ดงานของเขาจึงเป็นบอร์ดขายแทน */
const isSalesOnly = (roles) => (roles || []).length > 0 && roles.every((r) => (ROLE_ALIAS[r] || r) === "sales");

/* ── "ขั้นตอน" ของฝ่ายขออนุญาต ──
   ช่างเดินงานตามขั้นติดตั้ง (ออกแบบ→ถอดของ→ติดตั้ง→เสร็จสิ้น) แต่ฝ่ายขออนุญาตไม่ได้ทำงานตามแกนนั้น
   งานที่ "เสร็จสิ้น" ในสายตาช่าง คืองานที่เพิ่งเริ่มต้นในสายตาเขา — ชิปกรองและคอลัมน์ขั้นตอน
   ของบัญชีขออนุญาตจึงต้องเป็นขั้นของใบขออนุญาตแทน ไม่งั้นทุกงานจะกองอยู่ช่องเดียว */
const PERMIT_TODO = { key: "todo", th: "ยังไม่เริ่มเก็บข้อมูล", color: "#94A3B8", soft: "var(--surface2)" };
const permitStageKey = (j) => (j && j.permit && j.permit.status) || "todo";
const permitStageOf = (key) => (window.PERMIT_COLS || []).find((c) => c.key === key) || PERMIT_TODO;
const navForRole = (roles, techId) => NAV
  .filter((n) => (n.own ? !!techId : (!n.perm || can(roles, n.perm))))
  .filter((n) => !(isPermitOnly(roles) && n.key === "permit"))
  /* เซลล์อย่างเดียว: บอร์ดงาน = บอร์ดขายอยู่แล้ว จึงไม่ต้องมีเมนู "บอร์ดขาย" ซ้ำอีกอัน */
  .filter((n) => !(isSalesOnly(roles) && n.key === "sales"))
  .map((n) => (n.key === "board" && isPermitOnly(roles) ? Object.assign({}, n, { th: "บอร์ดขออนุญาต", en: "Permit Board", icon: "shield" }) : n))
  .map((n) => (n.key === "board" && isSalesOnly(roles) ? Object.assign({}, n, { th: "บอร์ดขาย", en: "Sales Board", icon: "trend" }) : n));

/* งานนี้เป็นของช่างที่กรองอยู่ไหม — "__none" คือกรองเอาเฉพาะงานที่ยังไม่ได้มอบหมายให้ใคร
   งานที่ผูกไว้กับช่างที่ถูกลบไปแล้ว (ไม่มีใน known) ให้นับเป็น "ยังไม่มอบหมาย" จะได้ไม่หายไปจากเมนู */
const techKey = (j, known) => (j.tech && (!known || known.has(j.tech)) ? j.tech : "__none");
const matchTech = (j, f, known) => techKey(j, known) === f;

const ACCENTS = {
  phithan: { primary: "#22A35B", dark: "#14663A", soft: "#E1F5E8", bright: "#35B76D" },
  emerald: { primary: "#10B981", dark: "#047857", soft: "#D6F5E6", bright: "#34D399" },
  amber:   { primary: "#F59E0B", dark: "#B45309", soft: "#FEF1D8", bright: "#FBBF24" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "light",
  "accent": "phithan",
  "density": "comfy",
  "sidebar": "full",
  "cardStyle": "soft"
}/*EDITMODE-END*/;

/* โหมดกราไฟต์: primary เป็นเขียวแบรนด์ที่สว่างพอสำหรับพื้นเทาเข้ม และยังรองรับตัวอักษรขาวบนปุ่ม
   ส่วน dark ใช้เป็นสีตัวอักษรบนพื้นมืด จึงต้องสว่างกว่า primary (กลับด้านกับโหมดปกติ)
   ต้องตั้งผ่าน JS เพราะตัวแปรพวกนี้ถูกเขียนเป็น inline style บน <html> (ชนะกฎใน CSS) */
const AURORA = { primary: "#28A85F", dark: "#4CD97B", soft: "rgba(40,168,95,.20)", bright: "#34C759" };

function applyTheme(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.mode);
  root.setAttribute("data-density", t.density);
  root.setAttribute("data-cardstyle", t.cardStyle);
  const aurora = t.mode === "aurora";
  const a = aurora ? AURORA : (ACCENTS[t.accent] || ACCENTS.phithan);
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--primary-dark", aurora ? a.dark : (t.mode === "dark" ? a.bright : a.dark));
  root.style.setProperty("--primary-soft", aurora ? a.soft : (t.mode === "dark" ? "rgba(53,183,109,.16)" : a.soft));
  root.style.setProperty("--primary-bright", a.bright);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", aurora ? "#131315" : "#22A35B");
}

/* ── responsive helper — uses matchMedia so it works even when resize events
   are suppressed (e.g. in preview/test environments) ── */
function useIsMobile(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}

function LoadingScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "transparent", gap: 18 }}>
      <img src="dashboard/assets/phithan-mark.png" alt="PHITHAN GREEN" style={{ height: 60, borderRadius: 14, padding: 8, background: "#fff", boxShadow: "0 4px 18px rgba(34,163,91,.18)" }} />
      <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "-.01em" }}>PHITHAN GREEN</div>
      <div style={{ display: "flex", gap: 7 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--primary)",
            animation: "pgBounce 1.1s " + (i * 0.2) + "s infinite ease-in-out alternate" }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>กำลังโหลดข้อมูล...</div>
      <style>{`@keyframes pgBounce { from { transform: translateY(0); opacity: .4; } to { transform: translateY(-10px); opacity: 1; } }`}</style>
    </div>
  );
}

function App() {
  const store = useJobStore();
  const stock = useStockStore();
  const techStore = useTechStore();
  const brandStore = useBrandStore();
  const auth = useAuthStore();
  const notif = useNotifStore();
  const priceStore = usePriceStore();
  const ampStore = useAmpacityStore();
  const apptStore = useSurveyApptStore();
  const leadStore = useSurveyLeadStore();   // ลูกค้าที่ขอให้ไปสำรวจ — แยกจากฐานข้อมูลงาน
  const quoteStore = useQuoteStore();       // ใบเสนอราคา — แขวนได้ทั้งกับลูกค้าสำรวจและกับงาน
  const fileFlags = useJobFileFlags();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("overview");
  /* ชุดข้อมูลขออนุญาตที่เปิดอยู่ — อยู่ระดับแอป จะได้เปิดได้ทั้งจากบอร์ดและจากในใบงาน */
  const [permitReview, setPermitReview] = React.useState(null);
  /* ใบเสนอราคาที่เปิดอยู่ — เหตุผลเดียวกัน เปิดได้ทั้งจากหน้าลูกค้าสำรวจและจากในใบงาน */
  const [quoteOpen, setQuoteOpen] = React.useState(null);   // { quote, jobId }
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState(null);
  const [quickFilter, setQuickFilter] = React.useState(null);
  const [techFilter, setTechFilter] = React.useState(null);   // id ช่างผู้รับผิดชอบ · "__none" = ยังไม่มอบหมาย
  const [delayedOnly, setDelayedOnly] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(null); // {job, isNew}
  const [surveyJob, setSurveyJob] = React.useState(null); // งานที่กำลังเปิด wizard สำรวจหน้างาน
  const [surveyAppt, setSurveyAppt] = React.useState(null); // นัดหมายที่เปิด wizard มา (ถ้ามี) — ใช้ลิงก์ + ปิดสถานะ
  const [reportJob, setReportJob] = React.useState(null);   // งาน/ลูกค้าที่กำลังเปิดรายงานผลสำรวจ
  const [techMgr, setTechMgr] = React.useState(false);
  const [brandMgr, setBrandMgr] = React.useState(false);
  const [userMgr, setUserMgr] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [briefingOpen, setBriefingOpen] = React.useState(false); // สรุปงานวันนี้ (เปิดครั้งแรกของวัน)
  const [mapOpen, setMapOpen] = React.useState(false); // แผนที่งาน (popup จากปุ่มใน header)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  // โหมดออโรรา — สกินพิเศษ สลับเองได้ · จำค่าใน localStorage (ใช้ได้บนเว็บจริง ไม่พึ่ง edit-mode)
  const [aurora, setAurora] = React.useState(() => {
    const s = localStorage.getItem("pg-aurora");
    return s == null ? (TWEAK_DEFAULTS.mode === "aurora") : s === "1";
  });
  const toggleAurora = React.useCallback(() => setAurora((d) => { const n = !d; localStorage.setItem("pg-aurora", n ? "1" : "0"); return n; }), []);
  // ย่อ/ขยายแถบเมนูด้านข้าง (เดสก์ท็อป) — จำค่าใน localStorage
  const [collapsed, setCollapsed] = React.useState(() => {
    const s = localStorage.getItem("pg-sidebar");
    return s == null ? (TWEAK_DEFAULTS.sidebar === "icons") : s === "1";
  });
  const toggleCollapsed = React.useCallback(() => setCollapsed((c) => { const n = !c; localStorage.setItem("pg-sidebar", n ? "1" : "0"); return n; }), []);
  const isMobile = useIsMobile(); // force App re-render when mobile↔desktop breakpoint changes

  /* สิทธิ์/ตัวตนของผู้ใช้ที่ล็อกอินอยู่ — role เป็น "รายการตำแหน่ง" เพราะคนหนึ่งคนถือได้หลายตำแหน่ง
     can(role, ...) รับได้ทั้งรายการและตำแหน่งเดียว จึงเรียกเหมือนเดิมได้ทุกที่ */
  const role   = React.useMemo(() => (auth.current ? userRoles(auth.current) : []), [auth.current]);
  /* บัญชีขออนุญาตกรอง/เรียงด้วยขั้นของใบขออนุญาต ที่เหลือใช้ขั้นติดตั้งตามเดิม */
  const stageKeyOf = React.useCallback((j) => (isPermitOnly(role) ? permitStageKey(j) : j.stage), [role]);
  const techId = auth.current ? auth.current.techId : null;
  /* ขอบเขตงานที่เห็น — ตั้งได้เองในหน้า "สิทธิ์ตำแหน่ง" (ทุกงาน / งานที่รับผิดชอบ / งานที่ตัวเองเปิด / เฉพาะบางขั้น)
     roleCfg.rev ต้องอยู่ใน deps ด้วย เพราะ PERMS/ROLE_SCOPE เป็นตารางกลางที่ถูกเขียนทับเมื่อมีคนแก้สิทธิ์ */
  const roleCfg = useRoleConfig();
  const scope   = React.useMemo(() => jobScopeOf(role), [role, roleCfg.rev]);
  const inScope = React.useCallback((j) => !auth.current || jobInScope(j, scope, auth.current), [scope, auth.current]);
  const ownOnly = !!auth.current && !scope.all;

  // Auto-close sidebar when resizing to desktop
  React.useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  // เมื่อล็อกอิน/เปลี่ยนสิทธิ์ — ถ้าหน้าปัจจุบันไม่อยู่ในสิทธิ์ ให้ไปหน้าเริ่มต้นตาม role
  React.useEffect(() => {
    if (!auth.current) return;
    const allowed = navForRole(role, techId).map((n) => n.key);
    if (!allowed.includes(view)) setView(allowed[0] || "overview");
  }, [auth.current, role, techId]);

  React.useEffect(() => { applyTheme(Object.assign({}, t, { mode: aurora ? "aurora" : "light" })); }, [t, aurora]);

  const jobs = React.useMemo(() => store.jobs.map((j) => {
    const f = fileFlags[j.id] || {};
    return { ...j, hasDesign: !!f.design, hasBoq: !!f.boq };
  }), [store.jobs, fileFlags]);
  /* รายชื่อ id ช่างที่ยังมีอยู่จริง — ใช้เช็คว่างานผูกกับช่างที่ถูกลบไปแล้วหรือเปล่า */
  const techIds = React.useMemo(() => new Set((techStore.techs || []).map((x) => x.id)), [techStore.techs]);
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (q && !((j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q))) return false;
      if (typeFilter !== "all" && j.type !== typeFilter) return false;
      if (stageFilter && stageKeyOf(j) !== stageFilter) return false;
      if (delayedOnly && !j.delayed) return false;
      if (quickFilter === "active" && j.stage === "done") return false;
      if (quickFilter === "delayed" && !j.delayed) return false;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return false;
      if (quickFilter === "battery" && !j.battery) return false;
      if (techFilter && !matchTech(j, techFilter, techIds)) return false;
      if (!inScope(j)) return false; // ขอบเขตงานตามตำแหน่ง
      return true;
    });
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, techFilter, techIds, inScope, stageKeyOf]);

  /* นับงานต่อช่าง สำหรับเมนูกรอง "ช่างผู้รับผิดชอบ" — ใช้ฟิลเตอร์อื่นทั้งหมดยกเว้น techFilter เอง
     จะได้เห็นว่าภายใต้เงื่อนไขที่กรองอยู่ ช่างแต่ละคนมีงานกี่งาน */
  const techCounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = {}; let all = 0;
    jobs.forEach((j) => {
      if (q && !((j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q))) return;
      if (typeFilter !== "all" && j.type !== typeFilter) return;
      if (stageFilter && stageKeyOf(j) !== stageFilter) return;
      if (delayedOnly && !j.delayed) return;
      if (quickFilter === "active" && j.stage === "done") return;
      if (quickFilter === "delayed" && !j.delayed) return;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return;
      if (quickFilter === "battery" && !j.battery) return;
      if (!inScope(j)) return;
      const k = techKey(j, techIds);
      c[k] = (c[k] || 0) + 1; all++;
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, techIds, inScope, stageKeyOf]);

  // นับงานต่อขั้น (Flow) สำหรับชิปกรอง — ใช้ฟิลเตอร์อื่นทั้งหมดยกเว้น stageFilter เอง
  const stageCounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = {}; let all = 0;
    jobs.forEach((j) => {
      if (q && !((j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q))) return;
      if (typeFilter !== "all" && j.type !== typeFilter) return;
      if (delayedOnly && !j.delayed) return;
      if (quickFilter === "active" && j.stage === "done") return;
      if (quickFilter === "delayed" && !j.delayed) return;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return;
      if (quickFilter === "battery" && !j.battery) return;
      if (techFilter && !matchTech(j, techFilter, techIds)) return;
      if (!inScope(j)) return;
      { const k = stageKeyOf(j); c[k] = (c[k] || 0) + 1; all++; }
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, delayedOnly, quickFilter, techFilter, techIds, inScope, stageKeyOf]);

  // แจ้งเตือนงานล่าช้าตามขั้น (Flow) — คำนวณสด: tech เห็นเฉพาะงานตัวเอง, admin/manager เห็นทุกงาน
  const lateAlerts = React.useMemo(() => {
    const mine = jobs.filter(inScope);
    const out = [];
    mine.forEach((j) => (j.lateStages || []).forEach((ls) => out.push({ jobId: j.id, jobName: j.name, stage: ls })));
    return out.sort((a, b) => b.stage.daysLate - a.stage.daysLate);
  }, [jobs, inScope]);

  // งานติดตั้งวันนี้ (ตารางงาน) — today อยู่ในช่วงวันนัดติดตั้ง [startDate..deadline]
  // ใช้ "ช่วงวันนัดติดตั้ง" เป็นตารางงานเดียว (ไม่ใช้ stageDates รายขั้นอื่นซึ่งเป็นแค่สถานะ)
  const todayTasks = React.useMemo(() => {
    const mine = jobs.filter(inScope);
    const today = window.SF.TODAY;
    const inst = window.SF.STAGES.find((s) => s.key === "install");
    const out = [];
    mine.forEach((j) => {
      if (j.stage === "done") return;
      const s0 = j.startDate, e0 = j.deadline || j.startDate;
      if (!s0 || today < s0 || today > e0) return;
      let kind;
      if (s0 === e0) kind = "both";
      else if (today === s0) kind = "start";
      else if (today === e0) kind = "end";
      else kind = "progress";
      out.push({ job: j, stage: inst, kind });
    });
    return out;
  }, [jobs, inScope]);

  // ตารางงานของฉัน (วันนี้ + กำลังจะถึง) — นัดสำรวจ + งานติดตั้งของคนที่ล็อกอิน → โชว์บนหน้าภาพรวม
  // ยุบงานโปรเจคเดียวกันให้เหลือแถวเดียว (เก็บช่วงวัน start–end) · เอาแค่ 3 แถวแรก
  const myScheduleItems = React.useMemo(() => {
    const all = window.buildMySchedItems ? window.buildMySchedItems(apptStore.appts, jobs, techId) : [];
    const today = window.SF.TODAY;
    const byJob = {}; const out = [];
    all.forEach((it) => {
      if (it.type === "job") {
        const id = it.job.id, c = ((it.stages || [])[0] || {}).color;
        if (!byJob[id]) { byJob[id] = { type: "job", key: "j-" + id, job: it.job, start: it.day, end: it.dayEnd || it.day, ts: it.ts, color: c }; out.push(byJob[id]); }
      } else {
        out.push({ type: "survey", key: it.key, a: it.a, start: it.day, end: it.day, ts: it.ts });
      }
    });
    return out
      .filter((it) => it.end && it.end >= today)              // ยังไม่จบ (วันนี้เป็นต้นไป)
      .sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.ts - b.ts)
      .slice(0, 3);                                            // เอาแค่ 3 แถว
  }, [apptStore.appts, jobs, techId]);

  const loading = store.loading || stock.loading || auth.loading;

  // เปิดสรุปงานวันนี้ครั้งแรกของวัน (ถ้ามีงานเลยกำหนด หรือมีกำหนดวันนี้)
  React.useEffect(() => {
    if (loading || !auth.current) return;
    const today = window.SF.TODAY;
    if (localStorage.getItem("sf_briefing_seen") === today) return;
    if (lateAlerts.length === 0 && todayTasks.length === 0) return;
    setBriefingOpen(true);
  }, [loading, auth.current, lateAlerts.length, todayTasks.length]);

  // ราคารวมสำหรับ BOQ — คลังสินค้าเป็นต้นทางเดียว (ชนะ); boqPrices เป็น fallback ของเก่า
  /* ของชิ้นเดียวกันอาจมีหลายยี่ห้อ/หลายรุ่น ราคาไม่เท่ากัน — เก็บทุกตัวไว้ใน variants
     ตัวที่อยู่ระดับบน (code/price/unit) คือตัวที่ใช้เป็นค่าตั้งต้น (ตัวแรกในคลัง)
     ใบถอดของเลือกเองได้ว่าจะใช้ตัวไหน เก็บไว้ที่ b.pick */
  const effPriceMap = React.useMemo(() => {
    const mk = window.BOQ ? window.BOQ.matKey : (x) => x;
    const m = {};
    Object.keys(priceStore.priceMap).forEach((n) => { m[mk(n)] = priceStore.priceMap[n]; }); // legacy ก่อน
    const put = (k, v, alias) => {
      const cur = m[k];
      if (cur && cur.variants) { if (!cur.variants.some((x) => x.id === v.id)) cur.variants.push(v); }
      // ชื่อจริงชนะเสมอ — ชื่อเก่า (alias) เข้าได้เฉพาะช่องที่ยังว่าง จะได้ไม่ไปทับของที่มีชื่อนั้นอยู่จริง
      else if (!alias || !cur) m[k] = Object.assign({}, v, { variants: [v] });
    };
    const mats = (stock.items || []).filter((s) => s.name);
    mats.forEach((s) => {                                                                   // คลังทับ
      const v = { id: s.id, sku: s.sku || "", code: s.sku || "", price: +s.price || 0, unit: s.unit || "",
        brand: s.brand || "", model: s.model || "", label: window.SF.matVariantLabel(s) };
      put(mk(s.name), v, false);
    });
    /* ชื่อเก่า/ชื่อพ้อง (aka) — เปลี่ยนชื่อของในคลังแล้ว ใบถอดของที่ทำไว้ยังหาราคาเจอ
       ทำรอบสองแยก เพื่อให้ชื่อจริงของทุกตัวถูกจองก่อน */
    mats.forEach((s) => {
      if (!(s.aka || []).length) return;
      const v = { id: s.id, sku: s.sku || "", code: s.sku || "", price: +s.price || 0, unit: s.unit || "",
        brand: s.brand || "", model: s.model || "", label: window.SF.matVariantLabel(s) };
      s.aka.forEach((n) => { if (n) put(mk(n), v, true); });
    });
    return m;
  }, [stock.items, priceStore.priceMap]);

  // ลงทะเบียนสเปคแผง + อินเวอร์เตอร์จากคลังสินค้า → ให้ตัวคำนวณ BOQ ใช้
  React.useEffect(() => {
    if (!window.BOQ) return;
    /* ของที่อยู่ในหมวดย่อย (เช่น แผง › AIKO) เก็บคีย์หมวดย่อยไว้ในช่อง cat
       จึงต้องแปลงกลับเป็นหมวดหลักก่อนกรอง ไม่งั้นแผงในหมวดย่อยจะหายไปจากดรอปดาวน์ทั้งหมด */
    const inCat = (s, k) => window.SF.mainCatOf(s.cat) === k;
    /* ชื่อหมวดย่อยที่ของชิ้นนั้นอยู่ (เช่น แผง › AIKO) — เอาไปจัดกลุ่มในดรอปดาวน์เลือกรุ่น
       ของที่อยู่หมวดหลักเฉย ๆ คืนค่าว่าง แล้วดรอปดาวน์จะเอาไปกองรวมกันท้ายสุด */
    const subTh = (s) => { const c = window.SF.STOCK_CAT_BY[s.cat]; return c && c.parent ? c.th : ""; };
    if (window.BOQ.setPanels) window.BOQ.setPanels((stock.items || []).filter((s) => inCat(s, "panel") && s.name)
      .map((s) => ({ model: s.name, group: subTh(s), wp: s.wp, frame: s.frame, width: s.width, length: s.length,
        voc: s.voc, isc: s.isc, vmp: s.vmp, imp: s.imp,
        tcVoc: s.tcVoc, tcIsc: s.tcIsc, tcPmax: s.tcPmax, noct: s.noct,
        deg1: s.deg1, degY: s.degY, cells: s.cells, fuseA: s.fuseA, halfCut: s.halfCut })));
    if (window.BOQ.setInverters) window.BOQ.setInverters((stock.items || []).filter((s) => inCat(s, "inverter") && s.name)
      .map((s) => ({ model: s.name, type: s.invType, kw: s.invKw, phase: s.invPhase, inputs: s.invInputs, maxPv: s.invMaxPv, outA: s.invOutA, mpptVmin: s.mpptVmin, mpptVmax: s.mpptVmax, maxVdc: s.maxVdc, maxInA: s.maxInA, maxIscA: s.maxIscA, maxMpptA: s.maxMpptA,
        strPerMppt: s.invStrPerMppt, eff: s.invEff, effEuro: s.invEffEuro,
        vStart: s.vStart, vRated: s.vRated, maxAcKw: s.invMaxAcKw })));
    /* ต้องผูกกับ stock.cats ด้วย — ถ้ารายชื่อหมวดย่อยมาถึงทีหลังรายการของ mainCatOf() จะยังแปลงคีย์ไม่ออก */
  }, [stock.items, stock.cats]);

  // ลงทะเบียนค่าพิกัดกระแสสายไฟที่แก้จากเล่ม วสท. (ทับค่าเริ่มต้น) → ให้ตัวคำนวณ BOQ ใช้
  React.useEffect(() => {
    if (window.BOQ && window.BOQ.setAmpacity) window.BOQ.setAmpacity(ampStore.overrides || {});
  }, [ampStore.overrides]);

  const closeSidebar = () => setSidebarOpen(false);
  const openJob = (j) => setSelected(j.id);
  const openSurvey = (j, appt) => { setSurveyJob(j); setSurveyAppt(appt || null); };

  /* ลูกค้าสำรวจ → งานติดตั้งจริง (กดตอนลูกค้าตกลงเท่านั้น — ฐานข้อมูลงานจึงมีแต่งานที่เกิดจริง)
     ย้ายทั้งแบบสำรวจและรูป checklist ไปกับงานใหม่ แล้วผูกนัดสำรวจเดิมเข้ากับงาน */
  const convertLead = (lead) => {
    if (!can(role, "addJob")) { alert("คุณไม่มีสิทธิ์สร้างงาน"); return; }
    const rec = Object.assign(store.blank(), {
      name: lead.name || "", phone: lead.phone || "", address: lead.address || "",
      type: lead.type || "home", note: lead.note || "",
    });
    if (auth.current) { rec.createdBy = auth.current.id; rec.createdByName = auth.current.name || ""; }
    if (lead.province) rec.province = lead.province;
    if (lead.phase) rec.phase = lead.phase;
    if (lead.roof) rec.roof = lead.roof;
    if (lead.survey) rec.survey = lead.survey;
    /* ของที่เซลล์กรอกไว้ต้องเดินทางไปกับงานด้วย ไม่งั้นวิศวกรต้องถามซ้ำทั้งหมด
       ขนาดที่คาดเป็นตัวตั้งต้นของงาน (แก้ทีหลังได้) · เจ้าของลูกค้าติดไปเป็นเซลล์ประจำงาน */
    if (+lead.expKwp > 0) rec.kw = +lead.expKwp;
    if (lead.ownerId) { rec.salesId = lead.ownerId; rec.salesName = lead.ownerName || ""; }
    store.upsert(rec);
    if (window.moveSurveyPhotos) window.moveSurveyPhotos(lead.id, rec.id);
    leadStore.patch(lead.id, Object.assign({ jobId: rec.id }, window.salesStagePatch ? window.salesStagePatch("won") : { status: "won" }));
    /* ใบเสนอราคาที่ลูกค้าตกลงแล้วต้องตามมาที่งาน ไม่งั้นเปิดใบงานแล้วไม่รู้ว่าขายไปเท่าไร */
    (quoteStore.quotes || []).forEach((q) => {
      if (q.leadId === lead.id) quoteStore.patch(q.id, { jobId: rec.id, refCode: rec.code });
    });
    (apptStore.appts || []).forEach((a) => {
      if (a.leadId === lead.id) apptStore.upsert(Object.assign({}, a, { projectId: rec.id, jobCode: rec.code }));
    });
    setView(listView()); setSelected(rec.id);
  };

  /* เปิดใบเสนอราคา — ไม่มีใบเดิมก็สร้างใบใหม่จากข้อมูลลูกค้า/งานที่มีอยู่ให้เลย
     เซลล์จะได้ไม่ต้องพิมพ์ชื่อ-ที่อยู่ซ้ำ ซึ่งเป็นจุดที่พิมพ์ผิดบ่อยที่สุดบนเอกสารที่ส่งออกไปข้างนอก */
  /* target = ที่มาของสเปก (ผลสำรวจ + สเปกในใบงาน) ส่งต่อให้ QuoteEditor ใช้ปุ่ม "ดึงรุ่นอุปกรณ์" ได้
     ใบเก่าที่ทำไว้ก่อนสำรวจจะได้อัปเดตรุ่นแผง/อินเวอร์เตอร์ตามของจริงทีหลัง */
  const leadQuoteTarget = (lead) => ({
    kind: "lead", id: lead.id, code: lead.code, name: lead.name, phone: lead.phone,
    address: lead.address, province: lead.province, kwp: +lead.expKwp || 0,
    ownerId: lead.ownerId, ownerName: lead.ownerName,
    survey: lead.survey || null, phase: lead.phase, roof: lead.roof,
  });
  const jobQuoteTarget = (job) => ({
    kind: "job", id: job.id, code: job.code, name: job.name, phone: job.phone,
    address: job.address, province: job.province, kwp: +job.kw || 0,
    ownerId: job.salesId, ownerName: job.salesName,
    survey: job.survey || null, panels: +job.panels || 0, phase: job.phase, roof: job.roof,
    battery: job.battery, batSize: job.batSize, backup: job.backup,
  });
  const openQuoteForLead = (lead, existing) => {
    const t = leadQuoteTarget(lead);
    if (existing) { setQuoteOpen({ quote: existing, jobId: lead.jobId || "", target: t }); return; }
    setQuoteOpen({ jobId: lead.jobId || "", target: t, quote: quoteStore.blank(t, auth.current) });
  };
  const openQuoteForJob = (job, existing) => {
    const t = jobQuoteTarget(job);
    if (existing) { setQuoteOpen({ quote: existing, jobId: job.id, target: t }); return; }
    setQuoteOpen({ jobId: job.id, target: t, quote: quoteStore.blank(t, auth.current) });
  };
  const selectedJob = jobs.find((j) => j.id === selected) || null;

  /* คนที่ถือตำแหน่ง "ฝ่ายขออนุญาต" อย่างเดียว — บอร์ดขั้นงานติดตั้งไม่มีความหมายกับเขา
     (งานทุกใบจะกองอยู่ขั้น "เสร็จสิ้น" หมด) จึงให้เมนูบอร์ดงานแสดงบอร์ดขออนุญาตแทน */
  const permitOnly = isPermitOnly(role);
  /* หัวหน้าขออนุญาต: บอกจำนวนที่ต้องลงมือ ไม่ใช่จำนวนงานติดตั้งทั้งระบบซึ่งไม่เกี่ยวกับเขา */
  const permitHead = React.useMemo(() => {
    let sent = 0, filing = 0, todo = 0;
    jobs.forEach((j) => {
      const st = j.permit && j.permit.status;
      if (st === "sent") sent++;
      else if (st === "filing") filing++;
      else if (!st && j.stage === "done") todo++;
    });
    return "รอรับงาน " + sent + " · กำลังยื่น " + filing + " · ยังไม่เริ่มเก็บข้อมูล " + todo;
  }, [jobs]);
  const permitPage = view === "permit" || (permitOnly && view === "board");
  const salesPage  = view === "sales"  || (isSalesOnly(role) && view === "board");

  const patchPermit = (id, fields) => {
    const j = store.raw.find((r) => r.id === id) || {};
    const cur = j.permit || {};
    store.patch(id, { permit: Object.assign({}, cur, fields) });
    /* ตีกลับแล้วต้องเด้งกลับหาช่างคนที่ส่งมา ไม่งั้นงานค้างจนกว่าเขาจะบังเอิญเปิดดูเอง */
    /* งานเก่าที่ไม่ได้บันทึกคนส่ง ให้เด้งหาช่างที่รับผิดชอบงานแทน ไม่งั้นไม่มีใครรู้ว่าถูกตีกลับ */
    const backTo = cur.submittedTechId || j.tech || null;
    if (fields.status === "rejected" && backTo) {
      notif.addNotif({
        toTechId: backTo, type: "permit", jobId: id, jobName: j.name,
        title: "ข้อมูลขออนุญาตถูกตีกลับ ต้องแก้ไข",
        body: (j.code || "") + " · " + (fields.rejectReason || "ต้องแก้ไขข้อมูล"),
      });
    }
  };

  const permitView = (
    <PermitQueueView jobs={jobs} search={search} stock={stock} currentUser={auth.current}
      /* กดการ์ด = เปิดใบงานทับบอร์ดไว้เลย ไม่ต้องสลับหน้า จะได้ปิดแล้วกลับมาที่เดิม */
      onOpenJob={(id) => setSelected(id)}
      onOpenReview={(id) => setPermitReview(id)}
      onPatchPermit={patchPermit} />
  );

  const salesOnly = isSalesOnly(role);
  const salesBoard = (
    <SalesBoardView leads={leadStore.leads} quotes={quoteStore.quotes} search={search} currentUser={auth.current}
      /* กดการ์ด = เปิดหน้าลูกค้าสำรวจ ซึ่งเป็นที่เดียวที่ทำอะไรกับลูกค้ารายนั้นได้ครบ */
      onOpenLead={() => setView("leads")}
      onPatchLead={(id, fields) => leadStore.patch(id, fields)} />
  );
  const salesHead = React.useMemo(() => {
    const L = leadStore.leads || [];
    let live = 0, late = 0;
    L.forEach((l) => {
      const k = window.salesStageKey ? window.salesStageKey(l) : (l.status || "open");
      if (k === "won" || k === "lost") return;
      live++;
      if (window.sOverdue && window.sOverdue(l.nextFollow)) late++;
    });
    return "ยังไล่อยู่ " + live + " ราย · เลยวันติดตาม " + late + " ราย";
  }, [leadStore.leads]);

  const onSave = (rec) => {
    const prev = store.raw.find((r) => r.id === rec.id);
    /* ประทับคนเปิดงานไว้ตอนบันทึกครั้งแรก — ขอบเขต "เฉพาะงานที่ตัวเองเปิด" ใช้ค่านี้ */
    if (!prev && !rec.createdBy && auth.current) { rec.createdBy = auth.current.id; rec.createdByName = auth.current.name || ""; }
    store.upsert(rec);
    // แจ้งเตือนช่างเมื่อถูกมอบหมายงาน (ช่างเปลี่ยน หรือเป็นงานใหม่ที่ระบุช่าง)
    if (rec.tech && (!prev || prev.tech !== rec.tech)) {
      notif.addNotif({
        toTechId: rec.tech, type: "assign", jobId: rec.id, jobName: rec.name,
        title: "ได้รับมอบหมายงานใหม่",
        body: (rec.name || "งาน") + " · " + (rec.province || "") + " · " + (rec.kw || "") + " kW",
      });
    }
    setForm(null);
  };
  /* ลบงาน = ย้ายเข้าถังขยะก่อน กู้คืนได้ · ถามยืนยันในหน้าเอง ไม่ใช้ confirm() ของเบราว์เซอร์
     (ถ้าผู้ใช้เคยติ๊ก "ไม่ให้หน้านี้สร้างกล่องข้อความอีก" confirm จะคืน false ทันที = กดลบแล้วเงียบ) */
  const [permitJob, setPermitJob] = React.useState(null);   // งานที่กำลังเปิดแบบเก็บข้อมูลขออนุญาต
  const [delAsk, setDelAsk] = React.useState(null);   // งานที่กำลังถามว่าจะย้ายเข้าถังขยะไหม
  const [trashOpen, setTrashOpen] = React.useState(false);
  const onDelete = (j) => {
    if (!can(role, "delJob")) { alert("คุณไม่มีสิทธิ์ลบงาน"); return; }
    setDelAsk(j);
  };
  // หน้ารายการงานที่ใช้เจาะดู — table เฉพาะ admin, role อื่นใช้บอร์ดงานแทน
  const navItems = React.useMemo(() => navForRole(role, techId), [role, techId]);
  const listView = () => (navItems.some((n) => n.key === "table") ? "table" : "board");
  const goStage = (key) => { setStageFilter(key); setQuickFilter(null); setView(listView()); };
  const goKpi = (key) => { setQuickFilter(key); setStageFilter(null); setTypeFilter("all"); setDelayedOnly(false); setView(listView()); };

  const navTo = (v) => {
    setView(v);
    if (v !== "table") { setStageFilter(null); setQuickFilter(null); }
    closeSidebar();
  };

  if (loading) return <LoadingScreen />;
  if (!auth.current) return <LoginScreen authStore={auth} />;

  // แจ้งเตือนของช่างคนนี้ (admin/manager ไม่มี techId → ไม่มีกระดิ่งส่วนตัว)
  /* แจ้งเตือนของฉัน = ที่จ่าหน้าถึงตัวเรา + ที่จ่าหน้าถึง "คนที่มีสิทธิ์นี้" (เช่น งานขออนุญาตส่งถึงทุกคนในฝ่าย) */
  const myNotifs = notif.notifs.filter((n) => (techId && n.toTechId === techId) || (n.toPerm && can(role, n.toPerm)));
  const unread   = myNotifs.filter((n) => !n.read).length;
  const bellCount = unread + lateAlerts.length;
  const openFromNotif = (n) => {
    if (n.id) notif.markRead(n.id);
    setNotifOpen(false);
    if (n.jobId) { setView(listView()); setSelected(n.jobId); }
  };

  return (
    <div className="app-root">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <Sidebar view={view} onNav={navTo} role={role} techId={techId} jobs={jobs} stock={stock} t={t}
        open={sidebarOpen} onClose={closeSidebar} aurora={aurora} onToggleAurora={toggleAurora}
        collapsed={collapsed} onToggleCollapsed={toggleCollapsed}
        currentUser={auth.current} onLogout={auth.logout}
        canManageUsers={can(role, "manageUsers")} onManageUsers={() => { setUserMgr(true); closeSidebar(); }} />
      <main className="app-main">
        {view === "stock" ? (
          <StockView stock={stock} onMenuOpen={() => setSidebarOpen(true)} currentUser={auth.current} jobs={jobs}
            priceStore={priceStore} ampStore={ampStore} canManagePrices={can(role, "price")} />
        ) : view === "dispatch" ? (
          <DispatchView appts={apptStore.appts} jobs={jobs} techs={techStore.techs} store={apptStore} leadStore={leadStore}
            onMenuOpen={() => setSidebarOpen(true)} onOpenJob={openJob} />
        ) : view === "leads" ? (
          <LeadsView leadStore={leadStore} appts={apptStore.appts} jobs={jobs}
            users={auth.users} currentUser={auth.current} quotes={quoteStore.quotes}
            onMenuOpen={() => setSidebarOpen(true)}
            onOpenSurvey={(can(role, "doSurvey") || can(role, "dispatch")) ? (pseudo) => openSurvey(pseudo) : null}
            onReport={(pseudo) => setReportJob(pseudo)}
            onOpenQuote={can(role, "price") ? openQuoteForLead : null}
            onConvert={convertLead} canConvert={can(role, "addJob")} />
        ) : view === "saleskpi" ? (
          <SalesKpiView leads={leadStore.leads} quotes={quoteStore.quotes} users={auth.users} currentUser={auth.current}
            onMenuOpen={() => setSidebarOpen(true)} />
        ) : view === "myschedule" ? (
          <MyScheduleView appts={apptStore.appts} jobs={jobs} leads={leadStore.leads} me={auth.current}
            onMenuOpen={() => setSidebarOpen(true)}
            onStatus={(id, s) => apptStore.setStatus(id, s)}
            onOpenSurvey={(j, appt) => openSurvey(j, appt)}
            onOpen={openJob}
            onAdvance={(j) => store.advance(j.id)} />
        ) : (
        <React.Fragment>
        <Header view={view} navList={navItems} plain={permitPage || salesPage} subtitle={permitPage ? permitHead : salesPage ? salesHead : null} ownOnly={ownOnly} count={filtered.length} total={jobs.length}
          search={search} setSearch={setSearch}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          delayedOnly={delayedOnly} setDelayedOnly={setDelayedOnly}
          stageFilter={stageFilter} setStageFilter={setStageFilter} stageCounts={stageCounts} stageMode={permitOnly ? "permit" : "job"}
          quickFilter={quickFilter} setQuickFilter={setQuickFilter}
          techFilter={techFilter} setTechFilter={setTechFilter} techCounts={techCounts} techs={techStore.techs}
          onAdd={() => setForm({ job: store.blank(), isNew: true })}
          canAdd={can(role, "addJob")}
          onMap={() => setMapOpen(true)}
          showBell={true} unread={bellCount} notifItems={myNotifs} lateAlerts={lateAlerts}
          notifOpen={notifOpen} onBell={() => setNotifOpen((v) => !v)} onCloseNotif={() => setNotifOpen(false)}
          onOpenNotif={openFromNotif} onMarkAll={() => myNotifs.forEach((n) => { if (!n.read) notif.markRead(n.id); })}
          onMenuOpen={() => setSidebarOpen(true)} />

        <div className="app-content" style={(view === "board" || view === "sales") ? { display: "flex", flexDirection: "column", minHeight: 0 } : {}}>
          {view === "overview" && <OverviewView jobs={filtered} schedule={myScheduleItems} onOpen={openJob} onStage={goStage} onKpi={goKpi} stock={stock} />}
          {view === "board" && (permitOnly ? permitView : salesOnly ? salesBoard : <KanbanView jobs={filtered} onOpen={openJob} onMoveStage={(id, s) => store.setStage(id, s)} />)}
          {view === "sales" && salesBoard}
          {view === "table" && <TableView jobs={filtered} onOpen={openJob}
            onEdit={(j) => setForm({ job: store.raw.find((r) => r.id === j.id), isNew: false })}
            onDelete={onDelete} onSetMat={store.setMat} onSetStage={(id, s) => store.setStage(id, s)}
            permitMode={permitOnly}
            trashCount={can(role, "delJob") ? store.trash.length : 0} onOpenTrash={can(role, "delJob") ? () => setTrashOpen(true) : null} />}
          {view === "permit" && permitView}
          {view === "report" && <ReportView jobs={filtered} onOpen={openJob} />}
          {view === "survey" && <SurveyView jobs={filtered} role={role} onOpen={openSurvey}
            onToggleSkip={(can(role, "doSurvey") || can(role, "dispatch") || can(role, "editJob")) ? (j) => {
              const cur = j.survey || {};
              store.patch(j.id, { survey: Object.assign({}, cur, { skip: !cur.skip, skippedAt: !cur.skip ? new Date().toISOString() : null }) });
            } : null} />}
          {view === "calendar" && <CalendarView jobs={filtered} onOpen={openJob}
            canAdd={can(role, "addJob")} onAdvance={can(role, "editJob") ? (j) => store.advance(j.id) : null}
            onAddOnDate={(key) => setForm({ job: Object.assign(store.blank(), { startDate: key, deadline: key }), isNew: true })} />}
        </div>
        </React.Fragment>
        )}
      </main>

      <DetailDrawer job={selectedJob} onClose={() => setSelected(null)} onAdvance={(id) => store.advance(id)} onSetMat={store.setMat}
        currentUser={auth.current} canManage={can(role, "delJob")} canDesign={can(role, "design")} stock={stock}
        onSaveBOQ={(id, boq) => store.patch(id, { boq })}
        onSurvey={(can(role, "doSurvey") || can(role, "dispatch")) ? () => openSurvey(selectedJob) : null}
        onSurveyReport={() => setReportJob(selectedJob)}
        onPermit={can(role, "editJob") && !permitOnly ? () => setPermitJob(selectedJob) : null}
        permitMode={permitOnly}
        onOpenReview={permitOnly && selectedJob ? () => setPermitReview(selectedJob.id) : null}
        salesMode={salesOnly} quotes={quoteStore.quotes}
        onOpenQuote={can(role, "price") && selectedJob ? (q) => openQuoteForJob(selectedJob, q) : null}
        priceMap={can(role, "price") ? effPriceMap : null}
        onEdit={(id) => { setSelected(null); setForm({ job: store.raw.find((r) => r.id === id), isNew: false }); }} />
      {/* ใบเสนอราคา — เปิดทับได้ทั้งจากหน้าลูกค้าสำรวจและจากในใบงาน */}
      {quoteOpen && (
        <QuoteEditor quote={quoteOpen.quote} currentUser={auth.current} target={quoteOpen.target}
          job={quoteOpen.jobId ? jobs.find((x) => x.id === quoteOpen.jobId) : null}
          onClose={() => setQuoteOpen(null)}
          onSave={(q) => {
            quoteStore.upsert(q);
            /* ส่งใบเสนอราคาแล้วให้ลูกค้าเลื่อนขั้นเองอัตโนมัติ — เซลล์ไม่ต้องมาลากการ์ดซ้ำ
               ลูกค้าตกลง = ปิดการขาย (ยังต้องกด "แปลงเป็นงาน" เองอยู่ดี งานถึงจะเข้าฐาน) */
            const l = q.leadId ? (leadStore.leads || []).find((x) => x.id === q.leadId) : null;
            if (l && window.salesStagePatch) {
              const cur = window.salesStageKey(l);
              const to = q.status === "accepted" ? "won"
                : q.status === "rejected" ? "lost"
                : (q.status === "sent" && (cur === "new" || cur === "contact" || cur === "survey")) ? "quoted" : null;
              if (to && to !== cur) leadStore.patch(l.id, window.salesStagePatch(to));
            }
            setQuoteOpen(null);
          }}
          onDelete={() => { quoteStore.remove(quoteOpen.quote.id); setQuoteOpen(null); }} />
      )}
      {/* ชุดข้อมูลขออนุญาต — เปิดทับได้ทั้งจากบอร์ดและจากในใบงาน */}
      {permitReview && (() => {
        const rj = jobs.find((x) => x.id === permitReview);
        if (!rj) return null;
        return <PermitReview job={rj} currentUser={auth.current} stock={stock}
          onClose={() => setPermitReview(null)}
          onOpenJob={() => { setPermitReview(null); setSelected(rj.id); }}
          onPatch={(fields) => patchPermit(rj.id, fields)} />;
      })()}
      {permitJob && <PermitWizard job={permitJob} currentUser={auth.current} stock={stock}
        onClose={() => setPermitJob(null)}
        onSave={(permit) => store.patch(permitJob.id, { permit })}
        onSubmit={(permit) => notif.addNotif({
          toPerm: "permit", type: "permit", jobId: permitJob.id, jobName: permitJob.name,
          title: "ข้อมูลขออนุญาตพร้อมยื่นแล้ว",
          body: (permitJob.code || "") + " · " + (permitJob.name || "") + " · " + (permit.auth || "") + " · " + (permit.kwp || "") + " kWp",
        })} />}
      {surveyJob && <SurveyWizard job={surveyJob} currentUser={auth.current} stock={stock}
        onClose={() => { setSurveyJob(null); setSurveyAppt(null); }}
        onSave={(survey, thenReport) => {
          const s = surveyAppt ? Object.assign({}, survey, { appointmentId: surveyAppt.id }) : survey;
          // งานสำรวจของ "ลูกค้าสำรวจ" เก็บไว้ที่ตัวลูกค้า ไม่แตะฐานข้อมูลงาน
          if (surveyJob.__lead) leadStore.patch(surveyJob.id, { survey: s });
          else store.patch(surveyJob.id, { survey: s });
          if (surveyAppt) apptStore.setStatus(surveyAppt.id, "done"); // เสร็จแบบสำรวจ → ปิดนัด
          // เปิดรายงานด้วยข้อมูลที่เพิ่งบันทึก (store ยังไม่เด้งกลับมาตอนนี้)
          if (thenReport) setReportJob(Object.assign({}, surveyJob, { survey: s }));
          setSurveyJob(null); setSurveyAppt(null);
        }} />}
      {reportJob && <SurveyReportHost job={reportJob} stock={stock} onClose={() => setReportJob(null)} />}
      {form && <JobForm initial={form.job} isNew={form.isNew} jobs={jobs} onSave={onSave} onClose={() => setForm(null)} onManageTechs={() => setTechMgr(true)} onManageBrands={() => setBrandMgr(true)} />}
      {techMgr && <TechManager store={techStore} onClose={() => setTechMgr(false)} />}
      {brandMgr && <BrandManager store={brandStore} onClose={() => setBrandMgr(false)} />}
      {userMgr && can(role, "manageUsers") && <UserManager authStore={auth} roleCfg={roleCfg} onClose={() => setUserMgr(false)} />}
      {briefingOpen && <DailyBriefing lateAlerts={lateAlerts} todayTasks={todayTasks}
        onOpen={(jobId) => { localStorage.setItem("sf_briefing_seen", window.SF.TODAY); setBriefingOpen(false); setView(listView()); setSelected(jobId); }}
        onClose={() => { localStorage.setItem("sf_briefing_seen", window.SF.TODAY); setBriefingOpen(false); }} />}
      {delAsk && <DeleteJobAsk job={delAsk} onClose={() => setDelAsk(null)}
        onConfirm={() => { store.remove(delAsk.id, auth.current ? auth.current.name : ""); setSelected((s) => s === delAsk.id ? null : s); setDelAsk(null); }} />}
      {trashOpen && <TrashModal trash={store.trash} me={auth.current} onClose={() => setTrashOpen(false)}
        onRestore={(id) => store.restore(id)} onPurge={(id) => store.purge(id)} />}
      {mapOpen && <MapModal jobs={filtered} onOpen={(j) => { setMapOpen(false); openJob(j); }} onClose={() => setMapOpen(false)} />}

      <TweaksPanel>
        <TweakSection label="ธีม / Theme" />
        <TweakRadio label="โหมด" value={t.mode} options={["light", "aurora"]} onChange={(v) => setTweak("mode", v)} />
        <TweakSelect label="โทนสีหลัก" value={t.accent}
          options={[{ value: "phithan", label: "PHITHAN Green" }, { value: "emerald", label: "Emerald" }, { value: "amber", label: "Command Amber" }]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="เลย์เอาต์ / Layout" />
        <TweakRadio label="ความหนาแน่น" value={t.density} options={["comfy", "compact"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="แถบเมนู" value={t.sidebar} options={["full", "icons"]} onChange={(v) => setTweak("sidebar", v)} />
        <TweakRadio label="สไตล์การ์ด" value={t.cardStyle} options={["soft", "flat"]} onChange={(v) => setTweak("cardStyle", v)} />
      </TweaksPanel>

      {/* กล่องยืนยันกลางของแอป — ทุกที่ที่เรียก askConfirm() มาโผล่ที่ตัวนี้ */}
      <ConfirmHost />
    </div>
  );
}

function Sidebar({ view, onNav, role, techId, jobs, stock, t, open, onClose, aurora, onToggleAurora, collapsed, onToggleCollapsed, currentUser, onLogout, canManageUsers, onManageUsers }) {
  // Read media query synchronously every render — avoids stale state when
  // the preview or device loads at one size then displays at another.
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  // โหมดไอคอน = ผู้ใช้ย่อแถบเอง (เฉพาะเดสก์ท็อป — มือถือใช้ drawer เต็มเสมอ)
  const icons = !isMobile && collapsed;
  const delayed = jobs.filter((j) => j.delayed).length;
  const lowStock = stock.items.filter((it) => it.qty <= it.min).length;
  // On mobile: slide in/out via transform; on desktop: no inline style → always visible in flex flow
  const sidebarStyle = isMobile
    ? { transform: open ? "translateX(0)" : "translateX(-100%)",
        boxShadow: open ? "6px 0 36px rgba(0,0,0,.22)" : "none" }
    : { position: "relative" };
  return (
    <aside className="sidebar" data-mode={icons ? "icons" : "full"}
      style={sidebarStyle}>
      {/* ปุ่มย่อ/ขยาย — ลอยที่ขอบขวาของแถบ (เฉพาะเดสก์ท็อป) */}
      {!isMobile && (
        <button onClick={onToggleCollapsed} title={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"} aria-label="ย่อ/ขยายแถบเมนู"
          style={{ position: "absolute", top: "50%", right: -13, transform: "translateY(-50%)", width: 26, height: 26, borderRadius: 99,
            border: "2px solid var(--bg)", background: "var(--primary)", color: "#fff",
            cursor: "pointer", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(20,40,28,.18)", zIndex: 5, padding: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--primary-dark)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--primary)"; }}>
          <Icon name="chevronRight" size={15} color="#fff" style={{ transform: collapsed ? "none" : "rotate(180deg)", transition: "transform .18s" }} />
        </button>
      )}
      <div className="sidebar-brand">
        <img src="dashboard/assets/phithan-mark.png" alt="PHITHAN GREEN" className="brand-mark" />
        {!icons && (
          <div>
            <div className="brand-name">PHITHAN GREEN</div>
            <div className="brand-sub">ระบบติดตามงานติดตั้ง</div>
          </div>
        )}
        <button className="sidebar-close-btn" onClick={onClose} title="ปิดเมนู" aria-label="ปิดเมนู">
          <Icon name="x" size={15} color="var(--text-2)" />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navForRole(role, techId).map((n) => {
          const active = view === n.key;
          return (
            <button key={n.key} onClick={() => onNav(n.key)} className={"nav-item" + (active ? " active" : "")} title={n.th}
              style={n.key === "report" ? { marginTop: "auto" } : undefined}>
              <Icon name={n.icon} size={19} color={active ? "var(--primary-dark)" : "var(--text-2)"} />
              {!icons && <span>{n.th}</span>}
              {!icons && n.key === "overview" && delayed > 0 && (
                <span className="nav-badge">{delayed}</span>
              )}
              {!icons && n.key === "stock" && lowStock > 0 && (
                <span className="nav-badge warn">{lowStock}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        {/* เมนูจัดการผู้ใช้ — เฉพาะแอดมิน (แยกจากเมนูงาน) */}
        {canManageUsers && (
          <button onClick={onManageUsers} className="nav-item" title="จัดการผู้ใช้งาน" style={{ width: "100%" }}>
            <Icon name="users" size={19} color="var(--text-2)" />
            {!icons && <span>จัดการผู้ใช้งาน</span>}
          </button>
        )}
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: icons ? 0 : "4px 2px 10px", justifyContent: icons ? "center" : "flex-start" }}>
            <span style={{ width: 36, height: 36, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
              background: (ROLE_INFO[userRoles(currentUser)[0]] || ROLE_INFO.tech).color, color: "#fff", fontWeight: 700, fontSize: 14 }}>
              {(currentUser.name || "?").slice(0, 1)}
            </span>
            {!icons && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{userRoles(currentUser).map((r) => (ROLE_INFO[r] || ROLE_INFO.tech).short).join(" · ")}</div>
              </div>
            )}
          </div>
        )}
        {/* โหมดกราไฟต์ — สกินโทนเทาเข้ม (จำค่าไว้) · จุดเขียวด้านขวาบอกว่าเปิดอยู่ */}
        <button onClick={onToggleAurora} className="nav-item" title={aurora ? "กลับสู่โหมดปกติ" : "เปิดโหมดกราไฟต์"}
          style={{ width: "100%", color: aurora ? "var(--primary-dark)" : "var(--text-2)" }}>
          <Icon name="moon" size={18} color={aurora ? "var(--primary-dark)" : "var(--text-2)"} />
          {!icons && <span>โหมดกราไฟต์</span>}
          {!icons && aurora && (
            <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: 99, flexShrink: 0,
              background: "var(--primary-bright)" }} />
          )}
        </button>
        <button onClick={onLogout} className="nav-item" title="ออกจากระบบ"
          style={{ width: "100%", color: "#EF4444" }}>
          <Icon name="history" size={18} color="#EF4444" style={{ transform: "scaleX(-1)" }} />
          {!icons && <span style={{ color: "#EF4444", fontWeight: 600 }}>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}

/* ── ตัวกรอง "ช่างผู้รับผิดชอบ" ──
   ปุ่มเม็ดยาแบบเดียวกับตัวกรองขั้นงาน กดแล้วกางรายชื่อช่างพร้อมจำนวนงานของแต่ละคน
   ตัวเลขคิดจากฟิลเตอร์อื่นที่เปิดอยู่ทั้งหมด จะได้รู้ว่า "ในสิ่งที่ดูอยู่ตอนนี้" ใครมีกี่งาน */
function TechFilter({ value, onChange, techs, counts, nameOf }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  React.useEffect(() => {
    if (!open) return;
    const off = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);

  const cur = value ? (techs || []).find((t) => t.id === value) : null;
  const on = !!value;
  const none = (counts && counts.__none) || 0;
  const pick = (v) => { onChange(v); setOpen(false); };

  const row = (active) => ({
    display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "8px 10px", borderRadius: 10,
    border: "none", background: active ? "var(--primary-soft)" : "transparent", cursor: "pointer",
    fontFamily: "inherit", fontSize: 12.5, fontWeight: active ? 700 : 500,
    color: active ? "var(--primary-dark)" : "var(--text-1)", textAlign: "left",
  });
  const tally = (n) => ({ marginLeft: "auto", fontFamily: "var(--display)", fontSize: 11.5, fontWeight: 800,
    fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", color: "var(--text-3)", opacity: n ? 1 : .5 });
  const bead = (bg, txt) => (
    <span style={{ width: 22, height: 22, borderRadius: 99, background: bg, color: "#fff", flexShrink: 0,
      display: "grid", placeItems: "center", fontSize: 9.5, fontWeight: 700 }}>{txt}</span>
  );

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={() => setOpen((v) => !v)} title="กรองตามช่างผู้รับผิดชอบ"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "5px 10px" : "6px 13px", borderRadius: 99,
          border: "1px solid " + (on ? (cur ? cur.color : "var(--primary)") : "var(--border-strong)"),
          background: on ? ((cur ? cur.color : "#22A35B") + "16") : "var(--surface)",
          color: on ? (cur ? cur.color : "var(--primary-dark)") : "var(--text-2)",
          fontSize: isMobile ? 11.5 : 12.5, fontWeight: on ? 700 : 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        <Icon name="wrench" size={14} color={on ? (cur ? cur.color : "var(--primary-dark)") : "var(--text-2)"} />
        ช่าง{on ? ": " + nameOf(value) : ""}
        <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 40, width: 244, maxHeight: 340, overflowY: "auto",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 6,
          boxShadow: "0 14px 40px rgba(8,20,14,.18)" }}>
          <button style={row(!value)} onClick={() => pick(null)}>
            {bead("var(--surface3)", "")}<span>ช่างทุกคน</span>
            <span style={tally(1)}>{(counts && counts.__all) || 0}</span>
          </button>
          {(techs || []).map((t) => {
            const n = (counts && counts[t.id]) || 0;
            const active = value === t.id;
            return (
              <button key={t.id} style={Object.assign(row(active), n ? {} : { opacity: .55 })} onClick={() => pick(active ? null : t.id)}>
                {bead(t.color, (t.nick || t.name || "?").slice(0, 2))}
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name || t.nick}</span>
                <span style={tally(n)}>{n}</span>
              </button>
            );
          })}
          {none > 0 && (
            <button style={Object.assign(row(value === "__none"), { borderTop: "1px solid var(--border)", borderRadius: 0, marginTop: 4, paddingTop: 10 })}
              onClick={() => pick(value === "__none" ? null : "__none")}>
              {bead("var(--surface3)", "?")}<span style={{ color: "var(--text-2)" }}>ยังไม่มอบหมาย</span>
              <span style={tally(none)}>{none}</span>
            </button>
          )}
        </div>
      )}
    </span>
  );
}

function Header({ view, navList, plain, subtitle, ownOnly, count, total, search, setSearch, typeFilter, setTypeFilter, delayedOnly, setDelayedOnly, stageFilter, setStageFilter, stageCounts, stageMode, quickFilter, setQuickFilter, techFilter, setTechFilter, techCounts, techs, onAdd, canAdd, onMap, showBell, unread, notifItems, lateAlerts, notifOpen, onBell, onCloseNotif, onOpenNotif, onMarkAll, onMenuOpen }) {
  const nav = navList.find((n) => n.key === view) || NAV.find((n) => n.key === view);
  const QUICK_LABELS = { active: "กำลังดำเนินการ", delayed: "ล่าช้า", ready: "อุปกรณ์พร้อมติดตั้ง", battery: "มีแบตเตอรี่" };
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [stageOpen, setStageOpen] = React.useState(() => localStorage.getItem("sf_stage_filteropen") !== "0");
  const toggleStage = () => setStageOpen((v) => { localStorage.setItem("sf_stage_filteropen", v ? "0" : "1"); return !v; });
  // มือถือ: ซ่อนแถบกรองขั้นงาน (ปุ่ม + ชิป) ทุกหน้า เพื่อประหยัดพื้นที่หัว
  /* หน้าขออนุญาตไม่ใช้ตัวกรองขั้นงานติดตั้ง — งานที่เข้ามาถึงหน้านี้คืองานที่ติดตั้งเสร็จหมดแล้ว */
  const showStageBar = view !== "overview" && !isMobile && !plain;
  /* บัญชีขออนุญาตกรองด้วยขั้นของใบขออนุญาต — ป้าย/สี/รายชื่อขั้น ต้องสลับตามโหมดทั้งชุด */
  const pMode = stageMode === "permit";
  const stList = pMode ? (window.PERMIT_COLS || []) : window.SF.STAGES;
  const stInfo = (k) => (pMode ? permitStageOf(k) : stageOf(k));
  const stLabel = pMode ? "ขั้นขออนุญาต" : "ขั้นงาน";
  // มือถือ: ช่องค้นหายุบเป็นปุ่มสีเขียว กดแล้วค่อยขยายเป็นช่องพิมพ์ (ประหยัดพื้นที่หัว)
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchRef = React.useRef(null);
  React.useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);
  /* กรองตามช่างผู้รับผิดชอบ — ช่างที่ล็อกอินเองเห็นแต่งานตัวเองอยู่แล้ว จึงไม่ต้องมีตัวกรองนี้ */
  const showTechFilter = !ownOnly && setTechFilter;
  const techName = (id) => {
    if (id === "__none") return "ยังไม่มอบหมาย";
    const t = (techs || []).find((x) => x.id === id);
    return t ? (t.nick || t.name) : "—";
  };
  return (
    <header className="app-header" style={isMobile ? { paddingBottom: 12 } : undefined}>
      <div className="header-top">
        <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู">
          <Icon name="menu" size={18} color="var(--text-2)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title">{nav.th}</h1>
          <p className="page-sub">
            {subtitle || <React.Fragment>แสดง <strong>{count}</strong> จาก {total} งาน{ownOnly && " · เฉพาะงานของคุณ"}</React.Fragment>}
            {stageFilter && <span> · กรอง: {stInfo(stageFilter).th} <button onClick={() => setStageFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
            {quickFilter && <span> · กรอง: {QUICK_LABELS[quickFilter]} <button onClick={() => setQuickFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
            {techFilter && <span> · ช่าง: {techName(techFilter)} <button onClick={() => setTechFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
          </p>
        </div>
        <div className="header-actions">
          {isMobile && !searchOpen ? (
            <button onClick={() => setSearchOpen(true)} title="ค้นหา" aria-label="ค้นหา"
              style={{ width: 40, height: 40, borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff",
                cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Icon name="search" size={18} color="#fff" />
            </button>
          ) : (
            <div className="search-box" style={isMobile ? { maxWidth: "none", flex: 1 } : undefined}>
              <Icon name="search" size={16} color="var(--text-3)" />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..."
                onBlur={() => { if (isMobile && !search.trim()) setSearchOpen(false); }} />
              {isMobile && (
                <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setSearch(""); setSearchOpen(false); }} title="ปิดค้นหา" aria-label="ปิดค้นหา"
                  style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, border: "none", background: "var(--surface3)", color: "var(--text-3)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Icon name="x" size={14} color="var(--text-3)" />
                </button>
              )}
            </div>
          )}
          {onMap && !(isMobile && searchOpen) && (
            <button onClick={onMap} title="แผนที่งาน" aria-label="แผนที่งาน"
              style={{ width: 40, height: 40, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
              <Icon name="map" size={18} color="var(--text-2)" />
            </button>
          )}
          {showBell && !(isMobile && searchOpen) && (
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button onClick={onBell} aria-label="การแจ้งเตือน"
                style={{ width: 40, height: 40, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)",
                  cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", position: "relative" }}>
                <Icon name="bell" size={18} color="var(--text-2)" />
                {unread > 0 && (
                  <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 99,
                    background: "#EF4444", color: "#fff", fontSize: 10.5, fontWeight: 700, display: "grid", placeItems: "center", border: "2px solid var(--bg)" }}>{unread}</span>
                )}
              </button>
              {notifOpen && <NotifPanel items={notifItems} lateAlerts={lateAlerts} onClose={onCloseNotif} onOpenJob={onOpenNotif} onMarkAll={onMarkAll} />}
            </div>
          )}
          {canAdd && !(isMobile && searchOpen) && (
            <button className="btn-add" onClick={onAdd}>
              <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มงาน</span>
            </button>
          )}
        </div>
      </div>
      {/* มือถือ: เหลือไว้แค่ตัวกรองช่าง (ตัวอื่นซ่อนเพื่อประหยัดพื้นที่หัวเหมือนเดิม) */}
      {!plain && (!isMobile || showTechFilter) && (
      <div className="header-filters">
        {!isMobile && <Segmented value={typeFilter} onChange={setTypeFilter}
          options={[{ value: "all", label: "ทั้งหมด" }, { value: "home", label: "งานบ้าน" }, { value: "project", label: "โครงการ" }]} />}
        {!isMobile && (
        <button className={"delay-toggle" + (delayedOnly ? " on" : "")} onClick={() => setDelayedOnly((v) => !v)}>
          <Icon name="alert" size={15} color={delayedOnly ? "#fff" : "#EF4444"} />
          เฉพาะงานล่าช้า
        </button>
        )}
        {showTechFilter && <TechFilter value={techFilter} onChange={setTechFilter} techs={techs} counts={techCounts} nameOf={techName} />}
        {/* ปุ่มย่อ/ขยายแถบกรองขั้นงาน — สไตล์เดียวกับ "หมวดหมู่" ฝั่งคลัง (ไม่แสดงบนหน้าภาพรวม / มือถือหน้าบอร์ด) */}
        {showStageBar && (
        <button onClick={toggleStage} title={stageOpen ? "ซ่อนตัวกรองขั้นงาน" : "แสดงตัวกรองขั้นงาน"}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "5px 10px" : "6px 13px", borderRadius: 99,
            border: "1px solid " + (stageFilter ? stInfo(stageFilter).color : "var(--border-strong)"),
            background: stageFilter ? stInfo(stageFilter).color + "16" : "var(--surface)",
            color: stageFilter ? stInfo(stageFilter).color : "var(--text-2)",
            fontSize: isMobile ? 11.5 : 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          <Icon name="filter" size={14} color={stageFilter ? stInfo(stageFilter).color : "var(--text-2)"} />
          {stLabel}{stageFilter ? ": " + stInfo(stageFilter).th : ""}
          <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: stageOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
        </button>
        )}
      </div>
      )}
      {/* ชิปกรองขั้นงาน — ย่อ/ขยายแบบลื่น (max-height + opacity); ซ่อนบนหน้าภาพรวม / มือถือหน้าบอร์ด */}
      {showStageBar && (
      <div style={{ overflow: "hidden", maxHeight: stageOpen ? 180 : 0, opacity: stageOpen ? 1 : 0,
        paddingBottom: stageOpen ? (isMobile ? 10 : 14) : 0, transition: "max-height .24s ease, opacity .2s ease, padding-bottom .24s ease" }}>
        <div className="cat-chip-row" style={{ display: "flex", alignItems: "center", gap: isMobile ? 5 : 7, flexWrap: "nowrap", overflowX: "auto", overflowY: "hidden", paddingBottom: 2 }}>
          {(() => {
            /* ชิปกรองขั้นงาน — ปกติไม่มีเส้นขอบ ใช้พื้นจางพอให้รู้ว่ากดได้
               ที่เลือกอยู่ค่อยได้สีของขั้นงานนั้นเต็ม ๆ (สีมีความหมายเฉพาะตอนถูกเลือก) */
            const chip = (active, color) => ({
              display: "inline-flex", alignItems: "center", gap: isMobile ? 5 : 7, padding: isMobile ? "5px 10px" : "6px 13px", borderRadius: 99,
              border: "1px solid " + (active ? (color || "var(--primary)") : "transparent"),
              background: active ? (color ? color + "18" : "var(--primary-soft)") : "var(--surface2)",
              color: active ? (color || "var(--primary-dark)") : "var(--text-2)",
              fontFamily: "inherit", fontSize: isMobile ? 11.5 : 12.5, fontWeight: active ? 700 : 600,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "background .15s, color .15s",
            });
            const num = (active) => ({ fontSize: 11.5, fontWeight: 800, opacity: active ? 1 : .55,
              fontFamily: "var(--display)", fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" });
            return (
              <React.Fragment>
                <button style={chip(!stageFilter)} onClick={() => setStageFilter(null)}>
                  ทั้งหมด <span style={num(!stageFilter)}>{(stageCounts && stageCounts.__all) || 0}</span>
                </button>
                {stList.map((s) => {
                  const active = stageFilter === s.key;
                  const n = (stageCounts && stageCounts[s.key]) || 0;
                  return (
                    <button key={s.key} style={Object.assign(chip(active, s.color), n === 0 && !active ? { opacity: .5 } : {})}
                      onClick={() => setStageFilter(active ? null : s.key)}>
                      <span style={{ width: isMobile ? 6 : 7, height: isMobile ? 6 : 7, borderRadius: 99, background: s.color, flexShrink: 0 }} />
                      {s.th} <span style={num(active)}>{n}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })()}
        </div>
      </div>
      )}
    </header>
  );
}

/* สรุปงานวันนี้ — เด้งครั้งแรกของวัน */
function DailyBriefing({ lateAlerts, todayTasks, onOpen, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.SF.TODAY;
  const Row = ({ jobId, color, danger, title, sub }) => (
    <button onClick={() => onOpen(jobId)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", width: "100%", textAlign: "left",
      background: danger ? "var(--tint-red-bg)" : "var(--surface)", border: "1px solid " + (danger ? "var(--tint-red-bd)" : "var(--border)"), borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: color, color: "#fff" }}><Icon name={danger ? "alert" : "wrench"} size={16} color="#fff" /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: danger ? "var(--tint-red-tx)" : "var(--text-2)", marginTop: 1 }}>{sub}</span>
      </span>
      <Icon name="chevronRight" size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
    </button>
  );
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)", zIndex: 120, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(480px,100%)", maxHeight: isMobile ? "90dvh" : "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="bell" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>สรุปงานวันนี้</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{thDate(today, true)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {lateAlerts.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "#EF4444", padding: "2px 2px" }}>⚠ เลยกำหนด ({lateAlerts.length})</div>}
          {lateAlerts.map((a, i) => (
            <Row key={"l" + i} jobId={a.jobId} color="#EF4444" danger title={a.jobName} sub={'ขั้น "' + a.stage.th + '" เลยกำหนด ' + a.stage.daysLate + " วัน"} />
          ))}
          {todayTasks.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--primary-dark)", padding: "6px 2px 2px" }}>📍 กำหนดวันนี้ ({todayTasks.length})</div>}
          {todayTasks.map((e, i) => (
            <Row key={"t" + i} jobId={e.job.id} color={e.stage.color} title={e.job.name} sub={({ start: "เริ่ม", progress: "กำลังดำเนินการ", end: "ส่งมอบ/เสร็จ", both: "เริ่ม–เสร็จ" }[e.kind]) + " · " + e.stage.th} />
          ))}
        </div>
        <div style={{ padding: "12px 20px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "12px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>รับทราบ</button>
        </div>
      </div>
    </div>
  );
}

/* แผนที่งาน — popup เต็มจอ เปิดจากปุ่มใน header */
/* ============================================================
   DeleteJobAsk — ถามก่อนย้ายงานเข้าถังขยะ
   ------------------------------------------------------------
   ไม่ใช้ confirm() ของเบราว์เซอร์ เพราะถ้าถูกบล็อกกล่องข้อความไว้ มันจะคืน false เงียบ ๆ
   ปุ่มยืนยันต้องกดสองจังหวะ (ค้างไว้ที่ปุ่มแดง) ไม่ได้ — จึงวางปุ่มยกเลิกไว้ก่อน กันมือลั่น
   ============================================================ */
function DeleteJobAsk({ job, onConfirm, onClose }) {
  const bdClose = window.useBackdropClose(onClose);
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 125, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, width: "min(420px, 100%)", padding: 20, boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--tint-red-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="trash" size={18} color="#EF4444" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text-1)" }}>ย้ายงานนี้เข้าถังขยะ?</div>
            <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4, lineHeight: 1.55 }}>
              <b>{job.code}</b> · {job.name || "(ไม่มีชื่อ)"}<br />
              งานจะหายจากทุกหน้าจอ แต่ยังกู้คืนได้ที่ “ถังขยะ” ในหน้าฐานข้อมูลงาน
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ padding: "10px 16px", borderRadius: 10, border: "none",
            background: "#EF4444", color: "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>ย้ายเข้าถังขยะ</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TrashModal — ถังขยะงานติดตั้ง: กู้คืน หรือลบถาวร
   ------------------------------------------------------------
   ลบถาวรต้องเป็นแอดมิน + ใส่รหัสผ่านของบัญชีที่ล็อกอินอยู่ซ้ำอีกครั้ง
   (กันเผลอกด และกันคนที่มาใช้เครื่องต่อจากคนอื่นลบทิ้ง)
   ============================================================ */
function TrashModal({ trash, me, onRestore, onPurge, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const isAdmin = !!me && hasRole(userRoles(me), "admin");
  const [ask, setAsk] = React.useState(null);   // id ที่กำลังจะลบถาวร
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState("");

  const doPurge = (id) => {
    if (!isAdmin) { setErr("เฉพาะแอดมินเท่านั้นที่ลบถาวรได้"); return; }
    if (String(me.pin) !== String(pw)) { setErr("รหัสผ่านไม่ถูกต้อง"); return; }
    onPurge(id); setAsk(null); setPw(""); setErr("");
  };

  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 125, display: "grid", placeItems: isMobile ? "stretch" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : 18,
        width: isMobile ? "100%" : "min(640px, 100%)", maxHeight: isMobile ? "100%" : "84vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--tint-red-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="trash" size={17} color="#EF4444" /></span>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>ถังขยะ</h2>
              <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{trash.length} งาน · กู้คืนได้ตลอด · ลบถาวรต้องใส่รหัสผ่าน</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
          {trash.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ถังขยะว่าง — ยังไม่มีงานที่ถูกลบ</div>
          )}
          {trash.map((j) => (
            <div key={j.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{j.name || "(ไม่มีชื่อ)"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {j.code}{j.province ? " · " + j.province : ""}{j.kw ? " · " + j.kw + " kW" : ""}
                    {j.deletedAt ? " · ลบเมื่อ " + thDate(String(j.deletedAt).slice(0, 10), true) : ""}
                    {j.deletedBy ? " โดย " + j.deletedBy : ""}
                  </div>
                </div>
                <button onClick={() => onRestore(j.id)} style={{ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--primary)",
                  background: "var(--primary-soft)", color: "var(--primary-dark)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>กู้คืน</button>
                {isAdmin && ask !== j.id && (
                  <button onClick={() => { setAsk(j.id); setPw(""); setErr(""); }} style={{ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)",
                    background: "var(--surface)", color: "#EF4444", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบถาวร</button>
                )}
              </div>
              {ask === j.id && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                  <div style={{ fontSize: 11.5, color: "var(--tint-red-tx)", fontWeight: 700, marginBottom: 7 }}>
                    ลบถาวรแล้วกู้คืนไม่ได้ — ใส่รหัสผ่านของ {me && me.name ? me.name : "บัญชีนี้"} เพื่อยืนยัน
                  </div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <input type="password" value={pw} autoFocus autoComplete="off"
                      onChange={(e) => { setPw(e.target.value); setErr(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") doPurge(j.id); }}
                      placeholder="รหัสผ่าน"
                      style={{ flex: 1, minWidth: 130, background: "var(--surface2)", border: "1px solid var(--border-strong)", color: "var(--text-1)",
                        fontFamily: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 9, outline: "none" }} />
                    <button onClick={() => doPurge(j.id)} style={{ padding: "8px 14px", borderRadius: 9, border: "none",
                      background: "#EF4444", color: "#fff", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ลบถาวร</button>
                    <button onClick={() => { setAsk(null); setPw(""); setErr(""); }} style={{ padding: "8px 13px", borderRadius: 9, border: "1px solid var(--border-strong)",
                      background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>ยกเลิก</button>
                  </div>
                  {err && <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: "#EF4444" }}>{err}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
        {!isAdmin && trash.length > 0 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)", fontSize: 11.5, color: "var(--text-3)" }}>
            ลบถาวรได้เฉพาะแอดมิน — งานในถังขยะจะอยู่ตรงนี้จนกว่าแอดมินจะจัดการ
          </div>
        )}
      </div>
    </div>
  );
}

function MapModal({ jobs, onOpen, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)",
      zIndex: 95, display: "grid", placeItems: isMobile ? "stretch" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : 20,
        width: isMobile ? "100%" : "min(1120px, 100%)", height: isMobile ? "100%" : "88vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: "var(--primary-soft)", display: "grid", placeItems: "center" }}><Icon name="map" size={19} color="var(--primary-dark)" /></span>
            <div>
              <h2 style={{ fontSize: 16.5, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>แผนที่งานติดตั้ง</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{jobs.length} งาน · คลิกหมุดเพื่อดูรายละเอียด</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: isMobile ? "auto" : "hidden", padding: isMobile ? 14 : 18, display: "flex", flexDirection: "column" }}>
          <MapView jobs={jobs} onOpen={onOpen} />
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
