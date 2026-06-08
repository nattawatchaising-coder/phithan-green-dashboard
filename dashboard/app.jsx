/* ============================================================
   SolarFlow / PHITHAN GREEN — main app shell
   ============================================================ */

const NAV = [
  { key: "overview", th: "ภาพรวม",      en: "Overview",  icon: "grid" },
  { key: "board",    th: "บอร์ดงาน",     en: "Workflow",  icon: "kanban" },
  { key: "table",    th: "ฐานข้อมูลงาน",  en: "Database",  icon: "table" },
  { key: "calendar", th: "ปฏิทินนัด",     en: "Calendar",  icon: "calendar" },
  { key: "map",      th: "แผนที่งาน",     en: "Map",       icon: "map" },
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
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("overview");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState(null);
  const [quickFilter, setQuickFilter] = React.useState(null);
  const [delayedOnly, setDelayedOnly] = React.useState(false);
  const [role, setRole] = React.useState("admin");
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(null); // {job, isNew}
  const [techMgr, setTechMgr] = React.useState(false);
  const [brandMgr, setBrandMgr] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isMobile = useIsMobile(); // force App re-render when mobile↔desktop breakpoint changes

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
      if (role === "tech" && j.tech !== "t1") return false;
      return true;
    });
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, role]);

  const loading = store.loading || stock.loading;

  const closeSidebar = () => setSidebarOpen(false);
  const openJob = (j) => setSelected(j.id);
  const selectedJob = jobs.find((j) => j.id === selected) || null;

  const onSave = (rec) => { store.upsert(rec); setForm(null); };
  const onDelete = (j) => { if (confirm("ลบงาน \"" + j.name + "\" ?")) store.remove(j.id); };
  const goStage = (key) => { setStageFilter(key); setQuickFilter(null); setView("table"); };
  const goKpi = (key) => { setQuickFilter(key); setStageFilter(null); setTypeFilter("all"); setDelayedOnly(false); setView("table"); };

  const navTo = (v) => {
    setView(v);
    if (v !== "table") { setStageFilter(null); setQuickFilter(null); }
    closeSidebar();
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-root">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <Sidebar view={view} onNav={navTo} role={role} onRole={setRole} jobs={jobs} stock={stock} t={t}
        open={sidebarOpen} onClose={closeSidebar} />
      <main className="app-main">
        {view === "stock" ? (
          <StockView stock={stock} onResetAll={stock.resetStock} onMenuOpen={() => setSidebarOpen(true)} />
        ) : (
        <React.Fragment>
        <Header view={view} role={role} count={filtered.length} total={jobs.length}
          search={search} setSearch={setSearch}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          delayedOnly={delayedOnly} setDelayedOnly={setDelayedOnly}
          stageFilter={stageFilter} setStageFilter={setStageFilter}
          quickFilter={quickFilter} setQuickFilter={setQuickFilter}
          onAdd={() => setForm({ job: store.blank(), isNew: true })}
          onReset={store.resetDB}
          onMenuOpen={() => setSidebarOpen(true)} />

        <div className="app-content" style={view === "board" || view === "map" ? { display: "flex", flexDirection: "column", minHeight: 0 } : {}}>
          {view === "overview" && <OverviewView jobs={filtered} onOpen={openJob} onStage={goStage} onKpi={goKpi} />}
          {view === "board" && <KanbanView jobs={filtered} onOpen={openJob} onMoveStage={(id, s) => store.setStage(id, s)} />}
          {view === "table" && <TableView jobs={filtered} onOpen={openJob}
            onEdit={(j) => setForm({ job: store.raw.find((r) => r.id === j.id), isNew: false })}
            onDelete={onDelete} onSetMat={store.setMat} onSetStage={(id, s) => store.setStage(id, s)} />}
          {view === "calendar" && <CalendarView jobs={filtered} onOpen={openJob} />}
          {view === "map" && <MapView jobs={filtered} onOpen={openJob} />}
        </div>
        </React.Fragment>
        )}
      </main>

      <DetailDrawer job={selectedJob} onClose={() => setSelected(null)} onAdvance={(id) => store.advance(id)} onSetMat={store.setMat}
        onEdit={(id) => { setSelected(null); setForm({ job: store.raw.find((r) => r.id === id), isNew: false }); }} />
      {form && <JobForm initial={form.job} isNew={form.isNew} onSave={onSave} onClose={() => setForm(null)} onManageTechs={() => setTechMgr(true)} onManageBrands={() => setBrandMgr(true)} />}
      {techMgr && <TechManager store={techStore} onClose={() => setTechMgr(false)} />}
      {brandMgr && <BrandManager store={brandStore} onClose={() => setBrandMgr(false)} />}

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

function Sidebar({ view, onNav, role, onRole, jobs, stock, t, open, onClose }) {
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
        {!icons && <div className="role-label">มุมมองผู้ใช้</div>}
        <div className={"role-switch" + (icons ? " icons" : "")}>
          {ROLES.map((r) => (
            <button key={r.key} onClick={() => onRole(r.key)} className={"role-btn" + (role === r.key ? " active" : "")} title={r.th}>
              <Icon name={r.icon} size={16} color={role === r.key ? "#fff" : "var(--text-2)"} />
              {!icons && <span>{r.th}</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Header({ view, role, count, total, search, setSearch, typeFilter, setTypeFilter, delayedOnly, setDelayedOnly, stageFilter, setStageFilter, quickFilter, setQuickFilter, onAdd, onReset, onMenuOpen }) {
  const nav = NAV.find((n) => n.key === view);
  const QUICK_LABELS = { active: "กำลังดำเนินการ", delayed: "ล่าช้า", ready: "อุปกรณ์พร้อมติดตั้ง", battery: "มีแบตเตอรี่" };
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
          <button className="btn-add" onClick={onAdd}>
            <Icon name="plus" size={17} color="#fff" sw={2.4} /><span>เพิ่มงาน</span>
          </button>
        </div>
      </div>
      <div className="header-filters">
        <Segmented value={typeFilter} onChange={setTypeFilter}
          options={[{ value: "all", label: "ทั้งหมด" }, { value: "home", label: "งานบ้าน" }, { value: "project", label: "โครงการ" }]} />
        <button className={"delay-toggle" + (delayedOnly ? " on" : "")} onClick={() => setDelayedOnly((v) => !v)}>
          <Icon name="alert" size={15} color={delayedOnly ? "#fff" : "#EF4444"} />
          เฉพาะงานล่าช้า
        </button>
      </div>
    </header>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
