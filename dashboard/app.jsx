/* ============================================================
   SolarFlow / PHITHAN GREEN — main app shell
   ============================================================ */

const NAV = [
  { key: "overview", th: "ภาพรวม",      en: "Overview",  icon: "grid" },
  { key: "board",    th: "บอร์ดงาน",     en: "Workflow",  icon: "kanban" },
  { key: "table",    th: "ฐานข้อมูลงาน",  en: "Database",  icon: "table" },
  { key: "calendar", th: "ปฏิทินนัด",     en: "Calendar",  icon: "calendar" },
  { key: "stock",    th: "คลังสินค้า",    en: "Inventory", icon: "box" },
];

const ROLES = [
  { key: "admin",   th: "แอดมิน / ออฟฟิศ", icon: "users" },
  { key: "manager", th: "ผู้จัดการ",        icon: "user" },
  { key: "tech",    th: "ช่างติดตั้ง",      icon: "wrench" },
];

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

function applyTheme(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.mode);
  root.setAttribute("data-density", t.density);
  root.setAttribute("data-cardstyle", t.cardStyle);
  const a = ACCENTS[t.accent] || ACCENTS.phithan;
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--primary-dark", t.mode === "dark" ? a.bright : a.dark);
  root.style.setProperty("--primary-soft", t.mode === "dark" ? "rgba(53,183,109,.16)" : a.soft);
  root.style.setProperty("--primary-bright", a.bright);
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
      height: "100vh", background: "var(--bg)", gap: 18 }}>
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
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("overview");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState(null);
  const [quickFilter, setQuickFilter] = React.useState(null);
  const [delayedOnly, setDelayedOnly] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(null); // {job, isNew}
  const [techMgr, setTechMgr] = React.useState(false);
  const [brandMgr, setBrandMgr] = React.useState(false);
  const [userMgr, setUserMgr] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [briefingOpen, setBriefingOpen] = React.useState(false); // สรุปงานวันนี้ (เปิดครั้งแรกของวัน)
  const [mapOpen, setMapOpen] = React.useState(false); // แผนที่งาน (popup จากปุ่มใน header)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isMobile = useIsMobile(); // force App re-render when mobile↔desktop breakpoint changes

  // สิทธิ์/ตัวตนของผู้ใช้ที่ล็อกอินอยู่ (null ถ้ายังไม่ล็อกอิน)
  const role   = auth.current ? auth.current.role : null;
  const techId = auth.current ? auth.current.techId : null;

  // Auto-close sidebar when resizing to desktop
  React.useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  React.useEffect(() => { applyTheme(t); }, [t]);

  const jobs = store.jobs;
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (q && !((j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q))) return false;
      if (typeFilter !== "all" && j.type !== typeFilter) return false;
      if (stageFilter && j.stage !== stageFilter) return false;
      if (delayedOnly && !j.delayed) return false;
      if (quickFilter === "active" && j.stage === "done") return false;
      if (quickFilter === "delayed" && !j.delayed) return false;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return false;
      if (quickFilter === "battery" && !j.battery) return false;
      if (role === "tech" && j.tech !== techId) return false; // ช่างเห็นเฉพาะงานตัวเอง
      return true;
    });
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, role, techId]);

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
      if (role === "tech" && j.tech !== techId) return;
      c[j.stage] = (c[j.stage] || 0) + 1; all++;
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, delayedOnly, quickFilter, role, techId]);

  // แจ้งเตือนงานล่าช้าตามขั้น (Flow) — คำนวณสด: tech เห็นเฉพาะงานตัวเอง, admin/manager เห็นทุกงาน
  const lateAlerts = React.useMemo(() => {
    const scope = role === "tech" ? jobs.filter((j) => j.tech === techId) : jobs;
    const out = [];
    scope.forEach((j) => (j.lateStages || []).forEach((ls) => out.push({ jobId: j.id, jobName: j.name, stage: ls })));
    return out.sort((a, b) => b.stage.daysLate - a.stage.daysLate);
  }, [jobs, role, techId]);

  // งานที่ต้องทำวันนี้ — today อยู่ในช่วง [เริ่ม..เสร็จ] (งานหลายวันขึ้นทุกวันที่กำลังทำ)
  const todayTasks = React.useMemo(() => {
    const scope = role === "tech" ? jobs.filter((j) => j.tech === techId) : jobs;
    const today = window.SF.TODAY;
    const out = [];
    scope.forEach((j) => {
      const sd = j.stageDates || {};
      window.SF.STAGES.forEach((s) => {
        const v = sd[s.key]; if (!v) return;
        const st = typeof v === "object" ? (v.start || "") : "";
        const en = typeof v === "object" ? (v.end || "") : v;
        const s0 = st || en, e0 = en || st;
        if (!s0 || today < s0 || today > e0) return;
        const sameDay = st && en && st === en;
        let kind;
        if (sameDay) kind = "both";
        else if (s0 !== e0 && today > s0 && today < e0) kind = "progress";
        else if (today === e0 && en) kind = "end";
        else kind = "start";
        out.push({ job: j, stage: s, kind });
      });
    });
    return out;
  }, [jobs, role, techId]);

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
  const effPriceMap = React.useMemo(() => {
    const mk = window.BOQ ? window.BOQ.matKey : (x) => x;
    const m = {};
    Object.keys(priceStore.priceMap).forEach((n) => { m[mk(n)] = priceStore.priceMap[n]; }); // legacy ก่อน
    (stock.items || []).forEach((s) => { if (s.name) m[mk(s.name)] = { code: s.sku || "", price: +s.price || 0, unit: s.unit || "" }; }); // คลังทับ
    return m;
  }, [stock.items, priceStore.priceMap]);

  // ลงทะเบียนสเปคแผง + อินเวอร์เตอร์จากคลังสินค้า → ให้ตัวคำนวณ BOQ ใช้
  React.useEffect(() => {
    if (!window.BOQ) return;
    if (window.BOQ.setPanels) window.BOQ.setPanels((stock.items || []).filter((s) => s.cat === "panel" && s.name)
      .map((s) => ({ model: s.name, wp: s.wp, frame: s.frame, width: s.width })));
    if (window.BOQ.setInverters) window.BOQ.setInverters((stock.items || []).filter((s) => s.cat === "inverter" && s.name)
      .map((s) => ({ model: s.name, type: s.invType, kw: s.invKw, phase: s.invPhase })));
  }, [stock.items]);

  const closeSidebar = () => setSidebarOpen(false);
  const openJob = (j) => setSelected(j.id);
  const selectedJob = jobs.find((j) => j.id === selected) || null;

  const onSave = (rec) => {
    const prev = store.raw.find((r) => r.id === rec.id);
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
  const onDelete = (j) => {
    if (!can(role, "delJob")) { alert("คุณไม่มีสิทธิ์ลบงาน"); return; }
    if (confirm("ลบงาน \"" + j.name + "\" ?")) store.remove(j.id);
  };
  const goStage = (key) => { setStageFilter(key); setQuickFilter(null); setView("table"); };
  const goKpi = (key) => { setQuickFilter(key); setStageFilter(null); setTypeFilter("all"); setDelayedOnly(false); setView("table"); };

  const navTo = (v) => {
    setView(v);
    if (v !== "table") { setStageFilter(null); setQuickFilter(null); }
    closeSidebar();
  };

  if (loading) return <LoadingScreen />;
  if (!auth.current) return <LoginScreen authStore={auth} />;

  // แจ้งเตือนของช่างคนนี้ (admin/manager ไม่มี techId → ไม่มีกระดิ่งส่วนตัว)
  const myNotifs = techId ? notif.notifs.filter((n) => n.toTechId === techId) : [];
  const unread   = myNotifs.filter((n) => !n.read).length;
  const bellCount = unread + lateAlerts.length;
  const openFromNotif = (n) => {
    if (n.id) notif.markRead(n.id);
    setNotifOpen(false);
    if (n.jobId) { setView("table"); setSelected(n.jobId); }
  };

  return (
    <div className="app-root">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <Sidebar view={view} onNav={navTo} role={role} jobs={jobs} stock={stock} t={t}
        open={sidebarOpen} onClose={closeSidebar}
        currentUser={auth.current} onLogout={auth.logout}
        canManageUsers={can(role, "manageUsers")} onManageUsers={() => { setUserMgr(true); closeSidebar(); }} />
      <main className="app-main">
        {view === "stock" ? (
          <StockView stock={stock} onMenuOpen={() => setSidebarOpen(true)} currentUser={auth.current} jobs={jobs}
            priceStore={priceStore} canManagePrices={can(role, "delJob")} />
        ) : (
        <React.Fragment>
        <Header view={view} role={role} count={filtered.length} total={jobs.length}
          search={search} setSearch={setSearch}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          delayedOnly={delayedOnly} setDelayedOnly={setDelayedOnly}
          stageFilter={stageFilter} setStageFilter={setStageFilter} stageCounts={stageCounts}
          quickFilter={quickFilter} setQuickFilter={setQuickFilter}
          onAdd={() => setForm({ job: store.blank(), isNew: true })}
          canAdd={can(role, "addJob")}
          onMap={() => setMapOpen(true)}
          showBell={true} unread={bellCount} notifItems={myNotifs} lateAlerts={lateAlerts}
          notifOpen={notifOpen} onBell={() => setNotifOpen((v) => !v)} onCloseNotif={() => setNotifOpen(false)}
          onOpenNotif={openFromNotif} onMarkAll={() => notif.markAllRead(techId)}
          onMenuOpen={() => setSidebarOpen(true)} />

        <div className="app-content" style={view === "board" ? { display: "flex", flexDirection: "column", minHeight: 0 } : {}}>
          {view === "overview" && <OverviewView jobs={filtered} todayTasks={todayTasks} onOpen={openJob} onStage={goStage} onKpi={goKpi} />}
          {view === "board" && <KanbanView jobs={filtered} onOpen={openJob} onMoveStage={(id, s) => store.setStage(id, s)} />}
          {view === "table" && <TableView jobs={filtered} onOpen={openJob}
            onEdit={(j) => setForm({ job: store.raw.find((r) => r.id === j.id), isNew: false })}
            onDelete={onDelete} onSetMat={store.setMat} onSetStage={(id, s) => store.setStage(id, s)} />}
          {view === "calendar" && <CalendarView jobs={filtered} onOpen={openJob} />}
        </div>
        </React.Fragment>
        )}
      </main>

      <DetailDrawer job={selectedJob} onClose={() => setSelected(null)} onAdvance={(id) => store.advance(id)} onSetMat={store.setMat}
        currentUser={auth.current} canManage={can(role, "delJob")} stock={stock}
        onSaveBOQ={(id, boq) => store.patch(id, { boq })}
        priceMap={can(role, "delJob") ? effPriceMap : null}
        onEdit={(id) => { setSelected(null); setForm({ job: store.raw.find((r) => r.id === id), isNew: false }); }} />
      {form && <JobForm initial={form.job} isNew={form.isNew} onSave={onSave} onClose={() => setForm(null)} onManageTechs={() => setTechMgr(true)} onManageBrands={() => setBrandMgr(true)} />}
      {techMgr && <TechManager store={techStore} onClose={() => setTechMgr(false)} />}
      {brandMgr && <BrandManager store={brandStore} onClose={() => setBrandMgr(false)} />}
      {userMgr && can(role, "manageUsers") && <UserManager authStore={auth} onClose={() => setUserMgr(false)} />}
      {briefingOpen && <DailyBriefing lateAlerts={lateAlerts} todayTasks={todayTasks}
        onOpen={(jobId) => { localStorage.setItem("sf_briefing_seen", window.SF.TODAY); setBriefingOpen(false); setView("table"); setSelected(jobId); }}
        onClose={() => { localStorage.setItem("sf_briefing_seen", window.SF.TODAY); setBriefingOpen(false); }} />}
      {mapOpen && <MapModal jobs={filtered} onOpen={(j) => { setMapOpen(false); openJob(j); }} onClose={() => setMapOpen(false)} />}

      <TweaksPanel>
        <TweakSection label="ธีม / Theme" />
        <TweakRadio label="โหมด" value={t.mode} options={["light", "dark"]} onChange={(v) => setTweak("mode", v)} />
        <TweakSelect label="โทนสีหลัก" value={t.accent}
          options={[{ value: "phithan", label: "PHITHAN Green" }, { value: "emerald", label: "Emerald" }, { value: "amber", label: "Command Amber" }]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="เลย์เอาต์ / Layout" />
        <TweakRadio label="ความหนาแน่น" value={t.density} options={["comfy", "compact"]} onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="แถบเมนู" value={t.sidebar} options={["full", "icons"]} onChange={(v) => setTweak("sidebar", v)} />
        <TweakRadio label="สไตล์การ์ด" value={t.cardStyle} options={["soft", "flat"]} onChange={(v) => setTweak("cardStyle", v)} />
      </TweaksPanel>
    </div>
  );
}

function Sidebar({ view, onNav, role, jobs, stock, t, open, onClose, currentUser, onLogout, canManageUsers, onManageUsers }) {
  const icons = t.sidebar === "icons";
  // Read media query synchronously every render — avoids stale state when
  // the preview or device loads at one size then displays at another.
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const delayed = jobs.filter((j) => j.delayed).length;
  const lowStock = stock.items.filter((it) => it.qty <= it.min).length;
  // On mobile: slide in/out via transform; on desktop: no inline style → always visible in flex flow
  const sidebarStyle = isMobile
    ? { transform: open ? "translateX(0)" : "translateX(-100%)",
        boxShadow: open ? "6px 0 36px rgba(0,0,0,.22)" : "none" }
    : {};
  return (
    <aside className="sidebar" data-mode={icons ? "icons" : "full"}
      style={sidebarStyle}>
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
        {NAV.map((n) => {
          const active = view === n.key;
          return (
            <button key={n.key} onClick={() => onNav(n.key)} className={"nav-item" + (active ? " active" : "")} title={n.th}>
              <Icon name={n.icon} size={19} color={active ? "var(--primary-dark)" : "var(--text-2)"} />
              {!icons && <span>{n.th}</span>}
              {!icons && n.key === "overview" && delayed > 0 && (
                <span className="nav-badge">{delayed}</span>
              )}
              {!icons && n.key === "stock" && lowStock > 0 && (
                <span className="nav-badge" style={{ background: "#F59E0B" }}>{lowStock}</span>
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
              background: (ROLE_INFO[currentUser.role] || ROLE_INFO.tech).color, color: "#fff", fontWeight: 700, fontSize: 14 }}>
              {(currentUser.name || "?").slice(0, 1)}
            </span>
            {!icons && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{(ROLE_INFO[currentUser.role] || ROLE_INFO.tech).th}</div>
              </div>
            )}
          </div>
        )}
        <button onClick={onLogout} className="nav-item" title="ออกจากระบบ"
          style={{ width: "100%", color: "#EF4444" }}>
          <Icon name="history" size={18} color="#EF4444" style={{ transform: "scaleX(-1)" }} />
          {!icons && <span style={{ color: "#EF4444", fontWeight: 600 }}>ออกจากระบบ</span>}
        </button>
      </div>
    </aside>
  );
}

function Header({ view, role, count, total, search, setSearch, typeFilter, setTypeFilter, delayedOnly, setDelayedOnly, stageFilter, setStageFilter, stageCounts, quickFilter, setQuickFilter, onAdd, canAdd, onMap, showBell, unread, notifItems, lateAlerts, notifOpen, onBell, onCloseNotif, onOpenNotif, onMarkAll, onMenuOpen }) {
  const nav = NAV.find((n) => n.key === view);
  const QUICK_LABELS = { active: "กำลังดำเนินการ", delayed: "ล่าช้า", ready: "อุปกรณ์พร้อมติดตั้ง", battery: "มีแบตเตอรี่" };
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [stageOpen, setStageOpen] = React.useState(() => localStorage.getItem("sf_stage_filteropen") !== "0");
  const toggleStage = () => setStageOpen((v) => { localStorage.setItem("sf_stage_filteropen", v ? "0" : "1"); return !v; });
  return (
    <header className="app-header">
      <div className="header-top">
        <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู">
          <Icon name="menu" size={18} color="var(--text-2)" />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title">{nav.th}</h1>
          <p className="page-sub">
            แสดง <strong>{count}</strong> จาก {total} งาน
            {role === "tech" && " · เฉพาะงานของคุณ"}
            {stageFilter && <span> · กรอง: {stageOf(stageFilter).th} <button onClick={() => setStageFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
            {quickFilter && <span> · กรอง: {QUICK_LABELS[quickFilter]} <button onClick={() => setQuickFilter(null)} className="clear-chip">ล้าง ✕</button></span>}
          </p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Icon name="search" size={16} color="var(--text-3)" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหา..." />
          </div>
          {onMap && (
            <button onClick={onMap} title="แผนที่งาน" aria-label="แผนที่งาน"
              style={{ width: 40, height: 40, borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
              <Icon name="map" size={18} color="var(--text-2)" />
            </button>
          )}
          {showBell && (
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
          {canAdd && (
            <button className="btn-add" onClick={onAdd}>
              <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มงาน</span>
            </button>
          )}
        </div>
      </div>
      <div className="header-filters">
        <Segmented value={typeFilter} onChange={setTypeFilter}
          options={[{ value: "all", label: "ทั้งหมด" }, { value: "home", label: "งานบ้าน" }, { value: "project", label: "โครงการ" }]} />
        <button className={"delay-toggle" + (delayedOnly ? " on" : "")} onClick={() => setDelayedOnly((v) => !v)}>
          <Icon name="alert" size={15} color={delayedOnly ? "#fff" : "#EF4444"} />
          เฉพาะงานล่าช้า
        </button>
        {/* ปุ่มย่อ/ขยายแถบกรองขั้นงาน — สไตล์เดียวกับ "หมวดหมู่" ฝั่งคลัง (ไม่แสดงบนหน้าภาพรวม) */}
        {view !== "overview" && (
        <button onClick={toggleStage} title={stageOpen ? "ซ่อนตัวกรองขั้นงาน" : "แสดงตัวกรองขั้นงาน"}
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 99,
            border: "1px solid " + (stageFilter ? stageOf(stageFilter).color : "var(--border-strong)"),
            background: stageFilter ? stageOf(stageFilter).color + "16" : "var(--surface)",
            color: stageFilter ? stageOf(stageFilter).color : "var(--text-2)",
            fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          <Icon name="filter" size={14} color={stageFilter ? stageOf(stageFilter).color : "var(--text-2)"} />
          ขั้นงาน{stageFilter ? ": " + stageOf(stageFilter).th : ""}
          <Icon name="chevronDown" size={14} color="var(--text-3)" style={{ transform: stageOpen ? "rotate(180deg)" : "none", transition: "transform .18s" }} />
        </button>
        )}
      </div>
      {/* ชิปกรองขั้นงาน — ย่อ/ขยายแบบลื่น (max-height + opacity); ซ่อนบนหน้าภาพรวม */}
      {view !== "overview" && (
      <div style={{ overflow: "hidden", maxHeight: stageOpen ? 180 : 0, opacity: stageOpen ? 1 : 0,
        paddingBottom: stageOpen ? 14 : 0, transition: "max-height .24s ease, opacity .2s ease, padding-bottom .24s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          {(() => {
            const SF = window.SF;
            const chip = (active, color) => ({
              display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "5px 11px" : "6px 13px", borderRadius: 99,
              border: "1px solid " + (active ? (color || "var(--primary)") : "var(--border-strong)"),
              background: active ? (color ? color + "16" : "var(--primary-soft)") : "var(--surface)",
              color: active ? (color || "var(--primary-dark)") : "var(--text-2)",
              fontFamily: "inherit", fontSize: isMobile ? 11.5 : 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            });
            const num = (active) => ({ fontSize: 11, fontWeight: 700, opacity: active ? 1 : .6, fontFamily: "var(--mono)" });
            return (
              <React.Fragment>
                <button style={chip(!stageFilter)} onClick={() => setStageFilter(null)}>
                  ทั้งหมด <span style={num(!stageFilter)}>{(stageCounts && stageCounts.__all) || 0}</span>
                </button>
                {SF.STAGES.map((s) => {
                  const active = stageFilter === s.key;
                  const n = (stageCounts && stageCounts[s.key]) || 0;
                  return (
                    <button key={s.key} style={Object.assign(chip(active, s.color), n === 0 && !active ? { opacity: .5 } : {})}
                      onClick={() => setStageFilter(active ? null : s.key)}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: s.color, flexShrink: 0 }} />
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
      background: danger ? "#FEF2F2" : "var(--surface)", border: "1px solid " + (danger ? "#FECACA" : "var(--border)"), borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: color, color: "#fff" }}><Icon name={danger ? "alert" : "wrench"} size={16} color="#fff" /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: danger ? "#B91C1C" : "var(--text-2)", marginTop: 1 }}>{sub}</span>
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
