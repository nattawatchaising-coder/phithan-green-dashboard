function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const NAV = [{
  key: "overview",
  th: "ภาพรวม",
  en: "Overview",
  icon: "grid"
}, {
  key: "board",
  th: "บอร์ดงาน",
  en: "Workflow",
  icon: "kanban"
}, {
  key: "table",
  th: "ฐานข้อมูลงาน",
  en: "Database",
  icon: "table",
  perm: "viewAll"
}, {
  key: "leads",
  th: "ลูกค้าสำรวจ",
  en: "Survey Leads",
  icon: "user",
  perm: "leads"
}, {
  key: "dispatch",
  th: "จัดตารางสำรวจ",
  en: "Dispatch",
  icon: "calendar",
  perm: "dispatch"
}, {
  key: "permit",
  th: "ขออนุญาตการไฟฟ้า",
  en: "Permit",
  icon: "shield",
  perm: "permit"
}, {
  key: "myschedule",
  th: "ตารางงานของฉัน",
  en: "My Schedule",
  icon: "list",
  own: true
}, {
  key: "calendar",
  th: "ปฏิทินนัด",
  en: "Calendar",
  icon: "calendar"
}, {
  key: "stock",
  th: "คลังสินค้า",
  en: "Inventory",
  icon: "box",
  perm: "stock"
}, {
  key: "report",
  th: "รายงานสรุป",
  en: "Report",
  icon: "file",
  perm: "viewAll"
}];
const isPermitOnly = roles => (roles || []).length > 0 && roles.every(r => (ROLE_ALIAS[r] || r) === "permit");
const navForRole = (roles, techId) => NAV.filter(n => n.own ? !!techId : !n.perm || can(roles, n.perm)).filter(n => !(isPermitOnly(roles) && n.key === "permit")).map(n => n.key === "board" && isPermitOnly(roles) ? Object.assign({}, n, {
  th: "บอร์ดขออนุญาต",
  en: "Permit Board",
  icon: "shield"
}) : n);
const techKey = (j, known) => j.tech && (!known || known.has(j.tech)) ? j.tech : "__none";
const matchTech = (j, f, known) => techKey(j, known) === f;
const ACCENTS = {
  phithan: {
    primary: "#22A35B",
    dark: "#14663A",
    soft: "#E1F5E8",
    bright: "#35B76D"
  },
  emerald: {
    primary: "#10B981",
    dark: "#047857",
    soft: "#D6F5E6",
    bright: "#34D399"
  },
  amber: {
    primary: "#F59E0B",
    dark: "#B45309",
    soft: "#FEF1D8",
    bright: "#FBBF24"
  }
};
const TWEAK_DEFAULTS = {
  "mode": "light",
  "accent": "phithan",
  "density": "comfy",
  "sidebar": "full",
  "cardStyle": "soft"
};
const AURORA = {
  primary: "#28A85F",
  dark: "#4CD97B",
  soft: "rgba(40,168,95,.20)",
  bright: "#34C759"
};
function applyTheme(t) {
  const root = document.documentElement;
  root.setAttribute("data-theme", t.mode);
  root.setAttribute("data-density", t.density);
  root.setAttribute("data-cardstyle", t.cardStyle);
  const aurora = t.mode === "aurora";
  const a = aurora ? AURORA : ACCENTS[t.accent] || ACCENTS.phithan;
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--primary-dark", aurora ? a.dark : t.mode === "dark" ? a.bright : a.dark);
  root.style.setProperty("--primary-soft", aurora ? a.soft : t.mode === "dark" ? "rgba(53,183,109,.16)" : a.soft);
  root.style.setProperty("--primary-bright", a.bright);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", aurora ? "#131315" : "#22A35B");
}
function useIsMobile(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = e => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}
function LoadingScreen() {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "transparent",
      gap: 18
    }
  }, React.createElement("img", {
    src: "dashboard/assets/phithan-mark.png",
    alt: "PHITHAN GREEN",
    style: {
      height: 60,
      borderRadius: 14,
      padding: 8,
      background: "#fff",
      boxShadow: "0 4px 18px rgba(34,163,91,.18)"
    }
  }), React.createElement("div", {
    style: {
      fontFamily: "var(--display)",
      fontSize: 22,
      fontWeight: 800,
      color: "var(--primary-dark)",
      letterSpacing: "-.01em"
    }
  }, "PHITHAN GREEN"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7
    }
  }, [0, 1, 2].map(i => React.createElement("div", {
    key: i,
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--primary)",
      animation: "pgBounce 1.1s " + i * 0.2 + "s infinite ease-in-out alternate"
    }
  }))), React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-3)"
    }
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25..."), React.createElement("style", null, `@keyframes pgBounce { from { transform: translateY(0); opacity: .4; } to { transform: translateY(-10px); opacity: 1; } }`));
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
  const leadStore = useSurveyLeadStore();
  const fileFlags = useJobFileFlags();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = React.useState("overview");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [stageFilter, setStageFilter] = React.useState(null);
  const [quickFilter, setQuickFilter] = React.useState(null);
  const [techFilter, setTechFilter] = React.useState(null);
  const [delayedOnly, setDelayedOnly] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [form, setForm] = React.useState(null);
  const [surveyJob, setSurveyJob] = React.useState(null);
  const [surveyAppt, setSurveyAppt] = React.useState(null);
  const [reportJob, setReportJob] = React.useState(null);
  const [techMgr, setTechMgr] = React.useState(false);
  const [brandMgr, setBrandMgr] = React.useState(false);
  const [userMgr, setUserMgr] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [briefingOpen, setBriefingOpen] = React.useState(false);
  const [mapOpen, setMapOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [aurora, setAurora] = React.useState(() => {
    const s = localStorage.getItem("pg-aurora");
    return s == null ? TWEAK_DEFAULTS.mode === "aurora" : s === "1";
  });
  const toggleAurora = React.useCallback(() => setAurora(d => {
    const n = !d;
    localStorage.setItem("pg-aurora", n ? "1" : "0");
    return n;
  }), []);
  const [collapsed, setCollapsed] = React.useState(() => {
    const s = localStorage.getItem("pg-sidebar");
    return s == null ? TWEAK_DEFAULTS.sidebar === "icons" : s === "1";
  });
  const toggleCollapsed = React.useCallback(() => setCollapsed(c => {
    const n = !c;
    localStorage.setItem("pg-sidebar", n ? "1" : "0");
    return n;
  }), []);
  const isMobile = useIsMobile();
  const role = React.useMemo(() => auth.current ? userRoles(auth.current) : [], [auth.current]);
  const techId = auth.current ? auth.current.techId : null;
  const roleCfg = useRoleConfig();
  const scope = React.useMemo(() => jobScopeOf(role), [role, roleCfg.rev]);
  const inScope = React.useCallback(j => !auth.current || jobInScope(j, scope, auth.current), [scope, auth.current]);
  const ownOnly = !!auth.current && !scope.all;
  React.useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);
  React.useEffect(() => {
    if (!auth.current) return;
    const allowed = navForRole(role, techId).map(n => n.key);
    if (!allowed.includes(view)) setView(allowed[0] || "overview");
  }, [auth.current, role, techId]);
  React.useEffect(() => {
    applyTheme(Object.assign({}, t, {
      mode: aurora ? "aurora" : "light"
    }));
  }, [t, aurora]);
  const jobs = React.useMemo(() => store.jobs.map(j => {
    const f = fileFlags[j.id] || {};
    return {
      ...j,
      hasDesign: !!f.design,
      hasBoq: !!f.boq
    };
  }), [store.jobs, fileFlags]);
  const techIds = React.useMemo(() => new Set((techStore.techs || []).map(x => x.id)), [techStore.techs]);
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(j => {
      if (q && !(j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && j.type !== typeFilter) return false;
      if (stageFilter && j.stage !== stageFilter) return false;
      if (delayedOnly && !j.delayed) return false;
      if (quickFilter === "active" && j.stage === "done") return false;
      if (quickFilter === "delayed" && !j.delayed) return false;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return false;
      if (quickFilter === "battery" && !j.battery) return false;
      if (techFilter && !matchTech(j, techFilter, techIds)) return false;
      if (!inScope(j)) return false;
      return true;
    });
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, techFilter, techIds, inScope]);
  const techCounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = {};
    let all = 0;
    jobs.forEach(j => {
      if (q && !(j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q)) return;
      if (typeFilter !== "all" && j.type !== typeFilter) return;
      if (stageFilter && j.stage !== stageFilter) return;
      if (delayedOnly && !j.delayed) return;
      if (quickFilter === "active" && j.stage === "done") return;
      if (quickFilter === "delayed" && !j.delayed) return;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return;
      if (quickFilter === "battery" && !j.battery) return;
      if (!inScope(j)) return;
      const k = techKey(j, techIds);
      c[k] = (c[k] || 0) + 1;
      all++;
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, stageFilter, delayedOnly, quickFilter, techIds, inScope]);
  const stageCounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const c = {};
    let all = 0;
    jobs.forEach(j => {
      if (q && !(j.name + j.code + j.province + j.phone + j.brand).toLowerCase().includes(q)) return;
      if (typeFilter !== "all" && j.type !== typeFilter) return;
      if (delayedOnly && !j.delayed) return;
      if (quickFilter === "active" && j.stage === "done") return;
      if (quickFilter === "delayed" && !j.delayed) return;
      if (quickFilter === "ready" && !(j.matReady && j.stage !== "done")) return;
      if (quickFilter === "battery" && !j.battery) return;
      if (techFilter && !matchTech(j, techFilter, techIds)) return;
      if (!inScope(j)) return;
      c[j.stage] = (c[j.stage] || 0) + 1;
      all++;
    });
    c.__all = all;
    return c;
  }, [jobs, search, typeFilter, delayedOnly, quickFilter, techFilter, techIds, inScope]);
  const lateAlerts = React.useMemo(() => {
    const mine = jobs.filter(inScope);
    const out = [];
    mine.forEach(j => (j.lateStages || []).forEach(ls => out.push({
      jobId: j.id,
      jobName: j.name,
      stage: ls
    })));
    return out.sort((a, b) => b.stage.daysLate - a.stage.daysLate);
  }, [jobs, inScope]);
  const todayTasks = React.useMemo(() => {
    const mine = jobs.filter(inScope);
    const today = window.SF.TODAY;
    const inst = window.SF.STAGES.find(s => s.key === "install");
    const out = [];
    mine.forEach(j => {
      if (j.stage === "done") return;
      const s0 = j.startDate,
        e0 = j.deadline || j.startDate;
      if (!s0 || today < s0 || today > e0) return;
      let kind;
      if (s0 === e0) kind = "both";else if (today === s0) kind = "start";else if (today === e0) kind = "end";else kind = "progress";
      out.push({
        job: j,
        stage: inst,
        kind
      });
    });
    return out;
  }, [jobs, inScope]);
  const myScheduleItems = React.useMemo(() => {
    const all = window.buildMySchedItems ? window.buildMySchedItems(apptStore.appts, jobs, techId) : [];
    const today = window.SF.TODAY;
    const byJob = {};
    const out = [];
    all.forEach(it => {
      if (it.type === "job") {
        const id = it.job.id,
          c = ((it.stages || [])[0] || {}).color;
        if (!byJob[id]) {
          byJob[id] = {
            type: "job",
            key: "j-" + id,
            job: it.job,
            start: it.day,
            end: it.dayEnd || it.day,
            ts: it.ts,
            color: c
          };
          out.push(byJob[id]);
        }
      } else {
        out.push({
          type: "survey",
          key: it.key,
          a: it.a,
          start: it.day,
          end: it.day,
          ts: it.ts
        });
      }
    });
    return out.filter(it => it.end && it.end >= today).sort((a, b) => (a.start || "").localeCompare(b.start || "") || a.ts - b.ts).slice(0, 3);
  }, [apptStore.appts, jobs, techId]);
  const loading = store.loading || stock.loading || auth.loading;
  React.useEffect(() => {
    if (loading || !auth.current) return;
    const today = window.SF.TODAY;
    if (localStorage.getItem("sf_briefing_seen") === today) return;
    if (lateAlerts.length === 0 && todayTasks.length === 0) return;
    setBriefingOpen(true);
  }, [loading, auth.current, lateAlerts.length, todayTasks.length]);
  const effPriceMap = React.useMemo(() => {
    const mk = window.BOQ ? window.BOQ.matKey : x => x;
    const m = {};
    Object.keys(priceStore.priceMap).forEach(n => {
      m[mk(n)] = priceStore.priceMap[n];
    });
    const put = (k, v, alias) => {
      const cur = m[k];
      if (cur && cur.variants) {
        if (!cur.variants.some(x => x.id === v.id)) cur.variants.push(v);
      } else if (!alias || !cur) m[k] = Object.assign({}, v, {
        variants: [v]
      });
    };
    const mats = (stock.items || []).filter(s => s.name);
    mats.forEach(s => {
      const v = {
        id: s.id,
        sku: s.sku || "",
        code: s.sku || "",
        price: +s.price || 0,
        unit: s.unit || "",
        brand: s.brand || "",
        model: s.model || "",
        label: window.SF.matVariantLabel(s)
      };
      put(mk(s.name), v, false);
    });
    mats.forEach(s => {
      if (!(s.aka || []).length) return;
      const v = {
        id: s.id,
        sku: s.sku || "",
        code: s.sku || "",
        price: +s.price || 0,
        unit: s.unit || "",
        brand: s.brand || "",
        model: s.model || "",
        label: window.SF.matVariantLabel(s)
      };
      s.aka.forEach(n => {
        if (n) put(mk(n), v, true);
      });
    });
    return m;
  }, [stock.items, priceStore.priceMap]);
  React.useEffect(() => {
    if (!window.BOQ) return;
    const inCat = (s, k) => window.SF.mainCatOf(s.cat) === k;
    const subTh = s => {
      const c = window.SF.STOCK_CAT_BY[s.cat];
      return c && c.parent ? c.th : "";
    };
    if (window.BOQ.setPanels) window.BOQ.setPanels((stock.items || []).filter(s => inCat(s, "panel") && s.name).map(s => ({
      model: s.name,
      group: subTh(s),
      wp: s.wp,
      frame: s.frame,
      width: s.width,
      length: s.length,
      voc: s.voc,
      isc: s.isc,
      vmp: s.vmp,
      imp: s.imp,
      tcVoc: s.tcVoc,
      tcIsc: s.tcIsc,
      tcPmax: s.tcPmax,
      noct: s.noct,
      deg1: s.deg1,
      degY: s.degY,
      cells: s.cells,
      fuseA: s.fuseA,
      halfCut: s.halfCut
    })));
    if (window.BOQ.setInverters) window.BOQ.setInverters((stock.items || []).filter(s => inCat(s, "inverter") && s.name).map(s => ({
      model: s.name,
      type: s.invType,
      kw: s.invKw,
      phase: s.invPhase,
      inputs: s.invInputs,
      maxPv: s.invMaxPv,
      outA: s.invOutA,
      mpptVmin: s.mpptVmin,
      mpptVmax: s.mpptVmax,
      maxVdc: s.maxVdc,
      maxInA: s.maxInA,
      maxIscA: s.maxIscA,
      maxMpptA: s.maxMpptA,
      strPerMppt: s.invStrPerMppt,
      eff: s.invEff,
      effEuro: s.invEffEuro,
      vStart: s.vStart,
      vRated: s.vRated,
      maxAcKw: s.invMaxAcKw
    })));
  }, [stock.items, stock.cats]);
  React.useEffect(() => {
    if (window.BOQ && window.BOQ.setAmpacity) window.BOQ.setAmpacity(ampStore.overrides || {});
  }, [ampStore.overrides]);
  const closeSidebar = () => setSidebarOpen(false);
  const openJob = j => setSelected(j.id);
  const openSurvey = (j, appt) => {
    setSurveyJob(j);
    setSurveyAppt(appt || null);
  };
  const convertLead = lead => {
    if (!can(role, "addJob")) {
      alert("คุณไม่มีสิทธิ์สร้างงาน");
      return;
    }
    const rec = Object.assign(store.blank(), {
      name: lead.name || "",
      phone: lead.phone || "",
      address: lead.address || "",
      type: lead.type || "home",
      note: lead.note || ""
    });
    if (auth.current) {
      rec.createdBy = auth.current.id;
      rec.createdByName = auth.current.name || "";
    }
    if (lead.province) rec.province = lead.province;
    if (lead.phase) rec.phase = lead.phase;
    if (lead.roof) rec.roof = lead.roof;
    if (lead.survey) rec.survey = lead.survey;
    store.upsert(rec);
    if (window.moveSurveyPhotos) window.moveSurveyPhotos(lead.id, rec.id);
    leadStore.patch(lead.id, {
      status: "won",
      jobId: rec.id
    });
    (apptStore.appts || []).forEach(a => {
      if (a.leadId === lead.id) apptStore.upsert(Object.assign({}, a, {
        projectId: rec.id,
        jobCode: rec.code
      }));
    });
    setView(listView());
    setSelected(rec.id);
  };
  const selectedJob = jobs.find(j => j.id === selected) || null;
  const permitOnly = isPermitOnly(role);
  const permitHead = React.useMemo(() => {
    let sent = 0,
      filing = 0,
      todo = 0;
    jobs.forEach(j => {
      const st = j.permit && j.permit.status;
      if (st === "sent") sent++;else if (st === "filing") filing++;else if (!st && j.stage === "done") todo++;
    });
    return "รอรับงาน " + sent + " · กำลังยื่น " + filing + " · ยังไม่เริ่มเก็บข้อมูล " + todo;
  }, [jobs]);
  const permitPage = view === "permit" || permitOnly && view === "board";
  const permitView = React.createElement(PermitQueueView, {
    jobs: jobs,
    search: search,
    currentUser: auth.current,
    onOpenJob: id => {
      setView(listView());
      setSelected(id);
    },
    onPatchPermit: (id, fields) => {
      const j = store.raw.find(r => r.id === id) || {};
      const cur = j.permit || {};
      store.patch(id, {
        permit: Object.assign({}, cur, fields)
      });
      if (fields.status === "rejected" && cur.submittedTechId) {
        notif.addNotif({
          toTechId: cur.submittedTechId,
          type: "permit",
          jobId: id,
          jobName: j.name,
          title: "ข้อมูลขออนุญาตถูกตีกลับ ต้องแก้ไข",
          body: (j.code || "") + " · " + (fields.rejectReason || "ต้องแก้ไขข้อมูล")
        });
      }
    }
  });
  const onSave = rec => {
    const prev = store.raw.find(r => r.id === rec.id);
    if (!prev && !rec.createdBy && auth.current) {
      rec.createdBy = auth.current.id;
      rec.createdByName = auth.current.name || "";
    }
    store.upsert(rec);
    if (rec.tech && (!prev || prev.tech !== rec.tech)) {
      notif.addNotif({
        toTechId: rec.tech,
        type: "assign",
        jobId: rec.id,
        jobName: rec.name,
        title: "ได้รับมอบหมายงานใหม่",
        body: (rec.name || "งาน") + " · " + (rec.province || "") + " · " + (rec.kw || "") + " kW"
      });
    }
    setForm(null);
  };
  const [permitJob, setPermitJob] = React.useState(null);
  const [delAsk, setDelAsk] = React.useState(null);
  const [trashOpen, setTrashOpen] = React.useState(false);
  const onDelete = j => {
    if (!can(role, "delJob")) {
      alert("คุณไม่มีสิทธิ์ลบงาน");
      return;
    }
    setDelAsk(j);
  };
  const navItems = React.useMemo(() => navForRole(role, techId), [role, techId]);
  const listView = () => navItems.some(n => n.key === "table") ? "table" : "board";
  const goStage = key => {
    setStageFilter(key);
    setQuickFilter(null);
    setView(listView());
  };
  const goKpi = key => {
    setQuickFilter(key);
    setStageFilter(null);
    setTypeFilter("all");
    setDelayedOnly(false);
    setView(listView());
  };
  const navTo = v => {
    setView(v);
    if (v !== "table") {
      setStageFilter(null);
      setQuickFilter(null);
    }
    closeSidebar();
  };
  if (loading) return React.createElement(LoadingScreen, null);
  if (!auth.current) return React.createElement(LoginScreen, {
    authStore: auth
  });
  const myNotifs = notif.notifs.filter(n => techId && n.toTechId === techId || n.toPerm && can(role, n.toPerm));
  const unread = myNotifs.filter(n => !n.read).length;
  const bellCount = unread + lateAlerts.length;
  const openFromNotif = n => {
    if (n.id) notif.markRead(n.id);
    setNotifOpen(false);
    if (n.jobId) {
      setView(listView());
      setSelected(n.jobId);
    }
  };
  return React.createElement("div", {
    className: "app-root"
  }, sidebarOpen && React.createElement("div", {
    className: "sidebar-overlay",
    onClick: closeSidebar
  }), React.createElement(Sidebar, {
    view: view,
    onNav: navTo,
    role: role,
    techId: techId,
    jobs: jobs,
    stock: stock,
    t: t,
    open: sidebarOpen,
    onClose: closeSidebar,
    aurora: aurora,
    onToggleAurora: toggleAurora,
    collapsed: collapsed,
    onToggleCollapsed: toggleCollapsed,
    currentUser: auth.current,
    onLogout: auth.logout,
    canManageUsers: can(role, "manageUsers"),
    onManageUsers: () => {
      setUserMgr(true);
      closeSidebar();
    }
  }), React.createElement("main", {
    className: "app-main"
  }, view === "stock" ? React.createElement(StockView, {
    stock: stock,
    onMenuOpen: () => setSidebarOpen(true),
    currentUser: auth.current,
    jobs: jobs,
    priceStore: priceStore,
    ampStore: ampStore,
    canManagePrices: can(role, "price")
  }) : view === "dispatch" ? React.createElement(DispatchView, {
    appts: apptStore.appts,
    jobs: jobs,
    techs: techStore.techs,
    store: apptStore,
    leadStore: leadStore,
    onMenuOpen: () => setSidebarOpen(true),
    onOpenJob: openJob
  }) : view === "leads" ? React.createElement(LeadsView, {
    leadStore: leadStore,
    appts: apptStore.appts,
    jobs: jobs,
    onMenuOpen: () => setSidebarOpen(true),
    onOpenSurvey: can(role, "doSurvey") || can(role, "dispatch") ? pseudo => openSurvey(pseudo) : null,
    onReport: pseudo => setReportJob(pseudo),
    onConvert: convertLead,
    canConvert: can(role, "addJob")
  }) : view === "myschedule" ? React.createElement(MyScheduleView, {
    appts: apptStore.appts,
    jobs: jobs,
    leads: leadStore.leads,
    me: auth.current,
    onMenuOpen: () => setSidebarOpen(true),
    onStatus: (id, s) => apptStore.setStatus(id, s),
    onOpenSurvey: (j, appt) => openSurvey(j, appt),
    onOpen: openJob,
    onAdvance: j => store.advance(j.id)
  }) : React.createElement(React.Fragment, null, React.createElement(Header, {
    view: view,
    navList: navItems,
    plain: permitPage,
    subtitle: permitPage ? permitHead : null,
    ownOnly: ownOnly,
    count: filtered.length,
    total: jobs.length,
    search: search,
    setSearch: setSearch,
    typeFilter: typeFilter,
    setTypeFilter: setTypeFilter,
    delayedOnly: delayedOnly,
    setDelayedOnly: setDelayedOnly,
    stageFilter: stageFilter,
    setStageFilter: setStageFilter,
    stageCounts: stageCounts,
    quickFilter: quickFilter,
    setQuickFilter: setQuickFilter,
    techFilter: techFilter,
    setTechFilter: setTechFilter,
    techCounts: techCounts,
    techs: techStore.techs,
    onAdd: () => setForm({
      job: store.blank(),
      isNew: true
    }),
    canAdd: can(role, "addJob"),
    onMap: () => setMapOpen(true),
    showBell: true,
    unread: bellCount,
    notifItems: myNotifs,
    lateAlerts: lateAlerts,
    notifOpen: notifOpen,
    onBell: () => setNotifOpen(v => !v),
    onCloseNotif: () => setNotifOpen(false),
    onOpenNotif: openFromNotif,
    onMarkAll: () => myNotifs.forEach(n => {
      if (!n.read) notif.markRead(n.id);
    }),
    onMenuOpen: () => setSidebarOpen(true)
  }), React.createElement("div", {
    className: "app-content",
    style: view === "board" ? {
      display: "flex",
      flexDirection: "column",
      minHeight: 0
    } : {}
  }, view === "overview" && React.createElement(OverviewView, {
    jobs: filtered,
    schedule: myScheduleItems,
    onOpen: openJob,
    onStage: goStage,
    onKpi: goKpi,
    stock: stock
  }), view === "board" && (permitOnly ? permitView : React.createElement(KanbanView, {
    jobs: filtered,
    onOpen: openJob,
    onMoveStage: (id, s) => store.setStage(id, s)
  })), view === "table" && React.createElement(TableView, {
    jobs: filtered,
    onOpen: openJob,
    onEdit: j => setForm({
      job: store.raw.find(r => r.id === j.id),
      isNew: false
    }),
    onDelete: onDelete,
    onSetMat: store.setMat,
    onSetStage: (id, s) => store.setStage(id, s),
    trashCount: can(role, "delJob") ? store.trash.length : 0,
    onOpenTrash: can(role, "delJob") ? () => setTrashOpen(true) : null
  }), view === "permit" && permitView, view === "report" && React.createElement(ReportView, {
    jobs: filtered,
    onOpen: openJob
  }), view === "survey" && React.createElement(SurveyView, {
    jobs: filtered,
    role: role,
    onOpen: openSurvey,
    onToggleSkip: can(role, "doSurvey") || can(role, "dispatch") || can(role, "editJob") ? j => {
      const cur = j.survey || {};
      store.patch(j.id, {
        survey: Object.assign({}, cur, {
          skip: !cur.skip,
          skippedAt: !cur.skip ? new Date().toISOString() : null
        })
      });
    } : null
  }), view === "calendar" && React.createElement(CalendarView, {
    jobs: filtered,
    onOpen: openJob,
    canAdd: can(role, "addJob"),
    onAdvance: can(role, "editJob") ? j => store.advance(j.id) : null,
    onAddOnDate: key => setForm({
      job: Object.assign(store.blank(), {
        startDate: key,
        deadline: key
      }),
      isNew: true
    })
  })))), React.createElement(DetailDrawer, {
    job: selectedJob,
    onClose: () => setSelected(null),
    onAdvance: id => store.advance(id),
    onSetMat: store.setMat,
    currentUser: auth.current,
    canManage: can(role, "delJob"),
    canDesign: can(role, "design"),
    stock: stock,
    onSaveBOQ: (id, boq) => store.patch(id, {
      boq
    }),
    onSurvey: can(role, "doSurvey") || can(role, "dispatch") ? () => openSurvey(selectedJob) : null,
    onSurveyReport: () => setReportJob(selectedJob),
    onPermit: can(role, "editJob") ? () => setPermitJob(selectedJob) : null,
    priceMap: can(role, "price") ? effPriceMap : null,
    onEdit: id => {
      setSelected(null);
      setForm({
        job: store.raw.find(r => r.id === id),
        isNew: false
      });
    }
  }), permitJob && React.createElement(PermitWizard, {
    job: permitJob,
    currentUser: auth.current,
    stock: stock,
    onClose: () => setPermitJob(null),
    onSave: permit => store.patch(permitJob.id, {
      permit
    }),
    onSubmit: permit => notif.addNotif({
      toPerm: "permit",
      type: "permit",
      jobId: permitJob.id,
      jobName: permitJob.name,
      title: "ข้อมูลขออนุญาตพร้อมยื่นแล้ว",
      body: (permitJob.code || "") + " · " + (permitJob.name || "") + " · " + (permit.auth || "") + " · " + (permit.kwp || "") + " kWp"
    })
  }), surveyJob && React.createElement(SurveyWizard, {
    job: surveyJob,
    currentUser: auth.current,
    stock: stock,
    onClose: () => {
      setSurveyJob(null);
      setSurveyAppt(null);
    },
    onSave: (survey, thenReport) => {
      const s = surveyAppt ? Object.assign({}, survey, {
        appointmentId: surveyAppt.id
      }) : survey;
      if (surveyJob.__lead) leadStore.patch(surveyJob.id, {
        survey: s
      });else store.patch(surveyJob.id, {
        survey: s
      });
      if (surveyAppt) apptStore.setStatus(surveyAppt.id, "done");
      if (thenReport) setReportJob(Object.assign({}, surveyJob, {
        survey: s
      }));
      setSurveyJob(null);
      setSurveyAppt(null);
    }
  }), reportJob && React.createElement(SurveyReportHost, {
    job: reportJob,
    stock: stock,
    onClose: () => setReportJob(null)
  }), form && React.createElement(JobForm, {
    initial: form.job,
    isNew: form.isNew,
    jobs: jobs,
    onSave: onSave,
    onClose: () => setForm(null),
    onManageTechs: () => setTechMgr(true),
    onManageBrands: () => setBrandMgr(true)
  }), techMgr && React.createElement(TechManager, {
    store: techStore,
    onClose: () => setTechMgr(false)
  }), brandMgr && React.createElement(BrandManager, {
    store: brandStore,
    onClose: () => setBrandMgr(false)
  }), userMgr && can(role, "manageUsers") && React.createElement(UserManager, {
    authStore: auth,
    roleCfg: roleCfg,
    onClose: () => setUserMgr(false)
  }), briefingOpen && React.createElement(DailyBriefing, {
    lateAlerts: lateAlerts,
    todayTasks: todayTasks,
    onOpen: jobId => {
      localStorage.setItem("sf_briefing_seen", window.SF.TODAY);
      setBriefingOpen(false);
      setView(listView());
      setSelected(jobId);
    },
    onClose: () => {
      localStorage.setItem("sf_briefing_seen", window.SF.TODAY);
      setBriefingOpen(false);
    }
  }), delAsk && React.createElement(DeleteJobAsk, {
    job: delAsk,
    onClose: () => setDelAsk(null),
    onConfirm: () => {
      store.remove(delAsk.id, auth.current ? auth.current.name : "");
      setSelected(s => s === delAsk.id ? null : s);
      setDelAsk(null);
    }
  }), trashOpen && React.createElement(TrashModal, {
    trash: store.trash,
    me: auth.current,
    onClose: () => setTrashOpen(false),
    onRestore: id => store.restore(id),
    onPurge: id => store.purge(id)
  }), mapOpen && React.createElement(MapModal, {
    jobs: filtered,
    onOpen: j => {
      setMapOpen(false);
      openJob(j);
    },
    onClose: () => setMapOpen(false)
  }), React.createElement(TweaksPanel, null, React.createElement(TweakSection, {
    label: "\u0E18\u0E35\u0E21 / Theme"
  }), React.createElement(TweakRadio, {
    label: "\u0E42\u0E2B\u0E21\u0E14",
    value: t.mode,
    options: ["light", "aurora"],
    onChange: v => setTweak("mode", v)
  }), React.createElement(TweakSelect, {
    label: "\u0E42\u0E17\u0E19\u0E2A\u0E35\u0E2B\u0E25\u0E31\u0E01",
    value: t.accent,
    options: [{
      value: "phithan",
      label: "PHITHAN Green"
    }, {
      value: "emerald",
      label: "Emerald"
    }, {
      value: "amber",
      label: "Command Amber"
    }],
    onChange: v => setTweak("accent", v)
  }), React.createElement(TweakSection, {
    label: "\u0E40\u0E25\u0E22\u0E4C\u0E40\u0E2D\u0E32\u0E15\u0E4C / Layout"
  }), React.createElement(TweakRadio, {
    label: "\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E19\u0E32\u0E41\u0E19\u0E48\u0E19",
    value: t.density,
    options: ["comfy", "compact"],
    onChange: v => setTweak("density", v)
  }), React.createElement(TweakRadio, {
    label: "\u0E41\u0E16\u0E1A\u0E40\u0E21\u0E19\u0E39",
    value: t.sidebar,
    options: ["full", "icons"],
    onChange: v => setTweak("sidebar", v)
  }), React.createElement(TweakRadio, {
    label: "\u0E2A\u0E44\u0E15\u0E25\u0E4C\u0E01\u0E32\u0E23\u0E4C\u0E14",
    value: t.cardStyle,
    options: ["soft", "flat"],
    onChange: v => setTweak("cardStyle", v)
  })));
}
function Sidebar({
  view,
  onNav,
  role,
  techId,
  jobs,
  stock,
  t,
  open,
  onClose,
  aurora,
  onToggleAurora,
  collapsed,
  onToggleCollapsed,
  currentUser,
  onLogout,
  canManageUsers,
  onManageUsers
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const icons = !isMobile && collapsed;
  const delayed = jobs.filter(j => j.delayed).length;
  const lowStock = stock.items.filter(it => it.qty <= it.min).length;
  const sidebarStyle = isMobile ? {
    transform: open ? "translateX(0)" : "translateX(-100%)",
    boxShadow: open ? "6px 0 36px rgba(0,0,0,.22)" : "none"
  } : {
    position: "relative"
  };
  return React.createElement("aside", {
    className: "sidebar",
    "data-mode": icons ? "icons" : "full",
    style: sidebarStyle
  }, !isMobile && React.createElement("button", {
    onClick: onToggleCollapsed,
    title: collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู",
    "aria-label": "\u0E22\u0E48\u0E2D/\u0E02\u0E22\u0E32\u0E22\u0E41\u0E16\u0E1A\u0E40\u0E21\u0E19\u0E39",
    style: {
      position: "absolute",
      top: "50%",
      right: -13,
      transform: "translateY(-50%)",
      width: 26,
      height: 26,
      borderRadius: 99,
      border: "2px solid var(--bg)",
      background: "var(--primary)",
      color: "#fff",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      boxShadow: "0 2px 8px rgba(20,40,28,.18)",
      zIndex: 5,
      padding: 0
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = "var(--primary-dark)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = "var(--primary)";
    }
  }, React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    color: "#fff",
    style: {
      transform: collapsed ? "none" : "rotate(180deg)",
      transition: "transform .18s"
    }
  })), React.createElement("div", {
    className: "sidebar-brand"
  }, React.createElement("img", {
    src: "dashboard/assets/phithan-mark.png",
    alt: "PHITHAN GREEN",
    className: "brand-mark"
  }), !icons && React.createElement("div", null, React.createElement("div", {
    className: "brand-name"
  }, "PHITHAN GREEN"), React.createElement("div", {
    className: "brand-sub"
  }, "\u0E23\u0E30\u0E1A\u0E1A\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07")), React.createElement("button", {
    className: "sidebar-close-btn",
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39",
    "aria-label": "\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39"
  }, React.createElement(Icon, {
    name: "x",
    size: 15,
    color: "var(--text-2)"
  }))), React.createElement("nav", {
    className: "sidebar-nav"
  }, navForRole(role, techId).map(n => {
    const active = view === n.key;
    return React.createElement("button", {
      key: n.key,
      onClick: () => onNav(n.key),
      className: "nav-item" + (active ? " active" : ""),
      title: n.th,
      style: n.key === "report" ? {
        marginTop: "auto"
      } : undefined
    }, React.createElement(Icon, {
      name: n.icon,
      size: 19,
      color: active ? "var(--primary-dark)" : "var(--text-2)"
    }), !icons && React.createElement("span", null, n.th), !icons && n.key === "overview" && delayed > 0 && React.createElement("span", {
      className: "nav-badge"
    }, delayed), !icons && n.key === "stock" && lowStock > 0 && React.createElement("span", {
      className: "nav-badge warn"
    }, lowStock));
  })), React.createElement("div", {
    className: "sidebar-foot"
  }, canManageUsers && React.createElement("button", {
    onClick: onManageUsers,
    className: "nav-item",
    title: "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19",
    style: {
      width: "100%"
    }
  }, React.createElement(Icon, {
    name: "users",
    size: 19,
    color: "var(--text-2)"
  }), !icons && React.createElement("span", null, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19")), currentUser && React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: icons ? 0 : "4px 2px 10px",
      justifyContent: icons ? "center" : "flex-start"
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 99,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: (ROLE_INFO[userRoles(currentUser)[0]] || ROLE_INFO.tech).color,
      color: "#fff",
      fontWeight: 700,
      fontSize: 14
    }
  }, (currentUser.name || "?").slice(0, 1)), !icons && React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, currentUser.name), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, userRoles(currentUser).map(r => (ROLE_INFO[r] || ROLE_INFO.tech).short).join(" · ")))), React.createElement("button", {
    onClick: onToggleAurora,
    className: "nav-item",
    title: aurora ? "กลับสู่โหมดปกติ" : "เปิดโหมดกราไฟต์",
    style: {
      width: "100%",
      color: aurora ? "var(--primary-dark)" : "var(--text-2)"
    }
  }, React.createElement(Icon, {
    name: "moon",
    size: 18,
    color: aurora ? "var(--primary-dark)" : "var(--text-2)"
  }), !icons && React.createElement("span", null, "\u0E42\u0E2B\u0E21\u0E14\u0E01\u0E23\u0E32\u0E44\u0E1F\u0E15\u0E4C"), !icons && aurora && React.createElement("span", {
    style: {
      marginLeft: "auto",
      width: 7,
      height: 7,
      borderRadius: 99,
      flexShrink: 0,
      background: "var(--primary-bright)"
    }
  })), React.createElement("button", {
    onClick: onLogout,
    className: "nav-item",
    title: "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A",
    style: {
      width: "100%",
      color: "#EF4444"
    }
  }, React.createElement(Icon, {
    name: "history",
    size: 18,
    color: "#EF4444",
    style: {
      transform: "scaleX(-1)"
    }
  }), !icons && React.createElement("span", {
    style: {
      color: "#EF4444",
      fontWeight: 600
    }
  }, "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A"))));
}
function TechFilter({
  value,
  onChange,
  techs,
  counts,
  nameOf
}) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  React.useEffect(() => {
    if (!open) return;
    const off = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const esc = e => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const cur = value ? (techs || []).find(t => t.id === value) : null;
  const on = !!value;
  const none = counts && counts.__none || 0;
  const pick = v => {
    onChange(v);
    setOpen(false);
  };
  const row = active => ({
    display: "flex",
    alignItems: "center",
    gap: 9,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    background: active ? "var(--primary-soft)" : "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: active ? 700 : 500,
    color: active ? "var(--primary-dark)" : "var(--text-1)",
    textAlign: "left"
  });
  const tally = n => ({
    marginLeft: "auto",
    fontFamily: "var(--display)",
    fontSize: 11.5,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-.02em",
    color: "var(--text-3)",
    opacity: n ? 1 : .5
  });
  const bead = (bg, txt) => React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: 99,
      background: bg,
      color: "#fff",
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      fontSize: 9.5,
      fontWeight: 700
    }
  }, txt);
  return React.createElement("span", {
    ref: wrapRef,
    style: {
      position: "relative",
      display: "inline-flex"
    }
  }, React.createElement("button", {
    onClick: () => setOpen(v => !v),
    title: "\u0E01\u0E23\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E0A\u0E48\u0E32\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: isMobile ? "5px 10px" : "6px 13px",
      borderRadius: 99,
      border: "1px solid " + (on ? cur ? cur.color : "var(--primary)" : "var(--border-strong)"),
      background: on ? (cur ? cur.color : "#22A35B") + "16" : "var(--surface)",
      color: on ? cur ? cur.color : "var(--primary-dark)" : "var(--text-2)",
      fontSize: isMobile ? 11.5 : 12.5,
      fontWeight: on ? 700 : 600,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "wrench",
    size: 14,
    color: on ? cur ? cur.color : "var(--primary-dark)" : "var(--text-2)"
  }), "\u0E0A\u0E48\u0E32\u0E07", on ? ": " + nameOf(value) : "", React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-3)",
    style: {
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  })), open && React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      zIndex: 40,
      width: 244,
      maxHeight: 340,
      overflowY: "auto",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 6,
      boxShadow: "0 14px 40px rgba(8,20,14,.18)"
    }
  }, React.createElement("button", {
    style: row(!value),
    onClick: () => pick(null)
  }, bead("var(--surface3)", ""), React.createElement("span", null, "\u0E0A\u0E48\u0E32\u0E07\u0E17\u0E38\u0E01\u0E04\u0E19"), React.createElement("span", {
    style: tally(1)
  }, counts && counts.__all || 0)), (techs || []).map(t => {
    const n = counts && counts[t.id] || 0;
    const active = value === t.id;
    return React.createElement("button", {
      key: t.id,
      style: Object.assign(row(active), n ? {} : {
        opacity: .55
      }),
      onClick: () => pick(active ? null : t.id)
    }, bead(t.color, (t.nick || t.name || "?").slice(0, 2)), React.createElement("span", {
      style: {
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, t.name || t.nick), React.createElement("span", {
      style: tally(n)
    }, n));
  }), none > 0 && React.createElement("button", {
    style: Object.assign(row(value === "__none"), {
      borderTop: "1px solid var(--border)",
      borderRadius: 0,
      marginTop: 4,
      paddingTop: 10
    }),
    onClick: () => pick(value === "__none" ? null : "__none")
  }, bead("var(--surface3)", "?"), React.createElement("span", {
    style: {
      color: "var(--text-2)"
    }
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E2D\u0E1A\u0E2B\u0E21\u0E32\u0E22"), React.createElement("span", {
    style: tally(none)
  }, none))));
}
function Header({
  view,
  navList,
  plain,
  subtitle,
  ownOnly,
  count,
  total,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  delayedOnly,
  setDelayedOnly,
  stageFilter,
  setStageFilter,
  stageCounts,
  quickFilter,
  setQuickFilter,
  techFilter,
  setTechFilter,
  techCounts,
  techs,
  onAdd,
  canAdd,
  onMap,
  showBell,
  unread,
  notifItems,
  lateAlerts,
  notifOpen,
  onBell,
  onCloseNotif,
  onOpenNotif,
  onMarkAll,
  onMenuOpen
}) {
  const nav = navList.find(n => n.key === view) || NAV.find(n => n.key === view);
  const QUICK_LABELS = {
    active: "กำลังดำเนินการ",
    delayed: "ล่าช้า",
    ready: "อุปกรณ์พร้อมติดตั้ง",
    battery: "มีแบตเตอรี่"
  };
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [stageOpen, setStageOpen] = React.useState(() => localStorage.getItem("sf_stage_filteropen") !== "0");
  const toggleStage = () => setStageOpen(v => {
    localStorage.setItem("sf_stage_filteropen", v ? "0" : "1");
    return !v;
  });
  const showStageBar = view !== "overview" && !isMobile && !plain;
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchRef = React.useRef(null);
  React.useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);
  const showTechFilter = !ownOnly && setTechFilter;
  const techName = id => {
    if (id === "__none") return "ยังไม่มอบหมาย";
    const t = (techs || []).find(x => x.id === id);
    return t ? t.nick || t.name : "—";
  };
  return React.createElement("header", {
    className: "app-header",
    style: isMobile ? {
      paddingBottom: 12
    } : undefined
  }, React.createElement("div", {
    className: "header-top"
  }, React.createElement("button", {
    className: "hamburger",
    onClick: onMenuOpen,
    "aria-label": "\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E21\u0E19\u0E39"
  }, React.createElement(Icon, {
    name: "menu",
    size: 18,
    color: "var(--text-2)"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("h1", {
    className: "page-title"
  }, nav.th), React.createElement("p", {
    className: "page-sub"
  }, subtitle || React.createElement(React.Fragment, null, "\u0E41\u0E2A\u0E14\u0E07 ", React.createElement("strong", null, count), " \u0E08\u0E32\u0E01 ", total, " \u0E07\u0E32\u0E19", ownOnly && " · เฉพาะงานของคุณ"), stageFilter && React.createElement("span", null, " \xB7 \u0E01\u0E23\u0E2D\u0E07: ", stageOf(stageFilter).th, " ", React.createElement("button", {
    onClick: () => setStageFilter(null),
    className: "clear-chip"
  }, "\u0E25\u0E49\u0E32\u0E07 \u2715")), quickFilter && React.createElement("span", null, " \xB7 \u0E01\u0E23\u0E2D\u0E07: ", QUICK_LABELS[quickFilter], " ", React.createElement("button", {
    onClick: () => setQuickFilter(null),
    className: "clear-chip"
  }, "\u0E25\u0E49\u0E32\u0E07 \u2715")), techFilter && React.createElement("span", null, " \xB7 \u0E0A\u0E48\u0E32\u0E07: ", techName(techFilter), " ", React.createElement("button", {
    onClick: () => setTechFilter(null),
    className: "clear-chip"
  }, "\u0E25\u0E49\u0E32\u0E07 \u2715")))), React.createElement("div", {
    className: "header-actions"
  }, isMobile && !searchOpen ? React.createElement("button", {
    onClick: () => setSearchOpen(true),
    title: "\u0E04\u0E49\u0E19\u0E2B\u0E32",
    "aria-label": "\u0E04\u0E49\u0E19\u0E2B\u0E32",
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "search",
    size: 18,
    color: "#fff"
  })) : React.createElement("div", {
    className: "search-box",
    style: isMobile ? {
      maxWidth: "none",
      flex: 1
    } : undefined
  }, React.createElement(Icon, {
    name: "search",
    size: 16,
    color: "var(--text-3)"
  }), React.createElement("input", {
    ref: searchRef,
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32...",
    onBlur: () => {
      if (isMobile && !search.trim()) setSearchOpen(false);
    }
  }), isMobile && React.createElement("button", {
    onMouseDown: e => e.preventDefault(),
    onClick: () => {
      setSearch("");
      setSearchOpen(false);
    },
    title: "\u0E1B\u0E34\u0E14\u0E04\u0E49\u0E19\u0E2B\u0E32",
    "aria-label": "\u0E1B\u0E34\u0E14\u0E04\u0E49\u0E19\u0E2B\u0E32",
    style: {
      flexShrink: 0,
      width: 22,
      height: 22,
      borderRadius: 7,
      border: "none",
      background: "var(--surface3)",
      color: "var(--text-3)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 14,
    color: "var(--text-3)"
  }))), onMap && !(isMobile && searchOpen) && React.createElement("button", {
    onClick: onMap,
    title: "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19",
    "aria-label": "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19",
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 18,
    color: "var(--text-2)"
  })), showBell && !(isMobile && searchOpen) && React.createElement("div", {
    style: {
      position: "relative",
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onBell,
    "aria-label": "\u0E01\u0E32\u0E23\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19",
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      position: "relative"
    }
  }, React.createElement(Icon, {
    name: "bell",
    size: 18,
    color: "var(--text-2)"
  }), unread > 0 && React.createElement("span", {
    style: {
      position: "absolute",
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 99,
      background: "#EF4444",
      color: "#fff",
      fontSize: 10.5,
      fontWeight: 700,
      display: "grid",
      placeItems: "center",
      border: "2px solid var(--bg)"
    }
  }, unread)), notifOpen && React.createElement(NotifPanel, {
    items: notifItems,
    lateAlerts: lateAlerts,
    onClose: onCloseNotif,
    onOpenJob: onOpenNotif,
    onMarkAll: onMarkAll
  })), canAdd && !(isMobile && searchOpen) && React.createElement("button", {
    className: "btn-add",
    onClick: onAdd
  }, React.createElement(Icon, {
    name: "plus",
    size: 17,
    color: "#fff",
    sw: 2.4
  }), React.createElement("span", null, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E07\u0E32\u0E19")))), !plain && (!isMobile || showTechFilter) && React.createElement("div", {
    className: "header-filters"
  }, !isMobile && React.createElement(Segmented, {
    value: typeFilter,
    onChange: setTypeFilter,
    options: [{
      value: "all",
      label: "ทั้งหมด"
    }, {
      value: "home",
      label: "งานบ้าน"
    }, {
      value: "project",
      label: "โครงการ"
    }]
  }), !isMobile && React.createElement("button", {
    className: "delay-toggle" + (delayedOnly ? " on" : ""),
    onClick: () => setDelayedOnly(v => !v)
  }, React.createElement(Icon, {
    name: "alert",
    size: 15,
    color: delayedOnly ? "#fff" : "#EF4444"
  }), "\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E07\u0E32\u0E19\u0E25\u0E48\u0E32\u0E0A\u0E49\u0E32"), showTechFilter && React.createElement(TechFilter, {
    value: techFilter,
    onChange: setTechFilter,
    techs: techs,
    counts: techCounts,
    nameOf: techName
  }), showStageBar && React.createElement("button", {
    onClick: toggleStage,
    title: stageOpen ? "ซ่อนตัวกรองขั้นงาน" : "แสดงตัวกรองขั้นงาน",
    style: {
      marginLeft: "auto",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: isMobile ? "5px 10px" : "6px 13px",
      borderRadius: 99,
      border: "1px solid " + (stageFilter ? stageOf(stageFilter).color : "var(--border-strong)"),
      background: stageFilter ? stageOf(stageFilter).color + "16" : "var(--surface)",
      color: stageFilter ? stageOf(stageFilter).color : "var(--text-2)",
      fontSize: isMobile ? 11.5 : 12.5,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap"
    }
  }, React.createElement(Icon, {
    name: "filter",
    size: 14,
    color: stageFilter ? stageOf(stageFilter).color : "var(--text-2)"
  }), "\u0E02\u0E31\u0E49\u0E19\u0E07\u0E32\u0E19", stageFilter ? ": " + stageOf(stageFilter).th : "", React.createElement(Icon, {
    name: "chevronDown",
    size: 14,
    color: "var(--text-3)",
    style: {
      transform: stageOpen ? "rotate(180deg)" : "none",
      transition: "transform .18s"
    }
  }))), showStageBar && React.createElement("div", {
    style: {
      overflow: "hidden",
      maxHeight: stageOpen ? 180 : 0,
      opacity: stageOpen ? 1 : 0,
      paddingBottom: stageOpen ? isMobile ? 10 : 14 : 0,
      transition: "max-height .24s ease, opacity .2s ease, padding-bottom .24s ease"
    }
  }, React.createElement("div", {
    className: "cat-chip-row",
    style: {
      display: "flex",
      alignItems: "center",
      gap: isMobile ? 5 : 7,
      flexWrap: "nowrap",
      overflowX: "auto",
      overflowY: "hidden",
      paddingBottom: 2
    }
  }, (() => {
    const SF = window.SF;
    const chip = (active, color) => ({
      display: "inline-flex",
      alignItems: "center",
      gap: isMobile ? 5 : 7,
      padding: isMobile ? "5px 10px" : "6px 13px",
      borderRadius: 99,
      border: "1px solid " + (active ? color || "var(--primary)" : "transparent"),
      background: active ? color ? color + "18" : "var(--primary-soft)" : "var(--surface2)",
      color: active ? color || "var(--primary-dark)" : "var(--text-2)",
      fontFamily: "inherit",
      fontSize: isMobile ? 11.5 : 12.5,
      fontWeight: active ? 700 : 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
      flexShrink: 0,
      transition: "background .15s, color .15s"
    });
    const num = active => ({
      fontSize: 11.5,
      fontWeight: 800,
      opacity: active ? 1 : .55,
      fontFamily: "var(--display)",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-.02em"
    });
    return React.createElement(React.Fragment, null, React.createElement("button", {
      style: chip(!stageFilter),
      onClick: () => setStageFilter(null)
    }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ", React.createElement("span", {
      style: num(!stageFilter)
    }, stageCounts && stageCounts.__all || 0)), SF.STAGES.map(s => {
      const active = stageFilter === s.key;
      const n = stageCounts && stageCounts[s.key] || 0;
      return React.createElement("button", {
        key: s.key,
        style: Object.assign(chip(active, s.color), n === 0 && !active ? {
          opacity: .5
        } : {}),
        onClick: () => setStageFilter(active ? null : s.key)
      }, React.createElement("span", {
        style: {
          width: isMobile ? 6 : 7,
          height: isMobile ? 6 : 7,
          borderRadius: 99,
          background: s.color,
          flexShrink: 0
        }
      }), s.th, " ", React.createElement("span", {
        style: num(active)
      }, n));
    }));
  })())));
}
function DailyBriefing({
  lateAlerts,
  todayTasks,
  onOpen,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.SF.TODAY;
  const Row = ({
    jobId,
    color,
    danger,
    title,
    sub
  }) => React.createElement("button", {
    onClick: () => onOpen(jobId),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "11px 12px",
      width: "100%",
      textAlign: "left",
      background: danger ? "var(--tint-red-bg)" : "var(--surface)",
      border: "1px solid " + (danger ? "var(--tint-red-bd)" : "var(--border)"),
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 9,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      background: color,
      color: "#fff"
    }
  }, React.createElement(Icon, {
    name: danger ? "alert" : "wrench",
    size: 16,
    color: "#fff"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title), React.createElement("span", {
    style: {
      display: "block",
      fontSize: 11.5,
      color: danger ? "var(--tint-red-tx)" : "var(--text-2)",
      marginTop: 1
    }
  }, sub)), React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    color: "var(--text-3)",
    style: {
      flexShrink: 0
    }
  }));
  return React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 120,
      display: "grid",
      placeItems: isMobile ? "end center" : "center",
      padding: isMobile ? 0 : 20
    }
  }, React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? "20px 20px 0 0" : 18,
      width: isMobile ? "100%" : "min(480px,100%)",
      maxHeight: isMobile ? "90dvh" : "88vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "18px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "bell",
    size: 19,
    color: "var(--primary-dark)"
  })), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E2A\u0E23\u0E38\u0E1B\u0E07\u0E32\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, thDate(today, true)))), React.createElement("button", {
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
  }))), React.createElement("div", {
    style: {
      overflowY: "auto",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, lateAlerts.length > 0 && React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "#EF4444",
      padding: "2px 2px"
    }
  }, "\u26A0 \u0E40\u0E25\u0E22\u0E01\u0E33\u0E2B\u0E19\u0E14 (", lateAlerts.length, ")"), lateAlerts.map((a, i) => React.createElement(Row, {
    key: "l" + i,
    jobId: a.jobId,
    color: "#EF4444",
    danger: true,
    title: a.jobName,
    sub: 'ขั้น "' + a.stage.th + '" เลยกำหนด ' + a.stage.daysLate + " วัน"
  })), todayTasks.length > 0 && React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: ".05em",
      textTransform: "uppercase",
      color: "var(--primary-dark)",
      padding: "6px 2px 2px"
    }
  }, "\uD83D\uDCCD \u0E01\u0E33\u0E2B\u0E19\u0E14\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 (", todayTasks.length, ")"), todayTasks.map((e, i) => React.createElement(Row, {
    key: "t" + i,
    jobId: e.job.id,
    color: e.stage.color,
    title: e.job.name,
    sub: {
      start: "เริ่ม",
      progress: "กำลังดำเนินการ",
      end: "ส่งมอบ/เสร็จ",
      both: "เริ่ม–เสร็จ"
    }[e.kind] + " · " + e.stage.th
  }))), React.createElement("div", {
    style: {
      padding: "12px 20px",
      paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12,
      borderTop: "1px solid var(--border)",
      background: "var(--surface)"
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      width: "100%",
      padding: "12px",
      borderRadius: 11,
      border: "none",
      background: "var(--primary)",
      color: "#fff",
      fontWeight: 700,
      fontFamily: "inherit",
      fontSize: 14,
      cursor: "pointer"
    }
  }, "\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A"))));
}
function DeleteJobAsk({
  job,
  onConfirm,
  onClose
}) {
  const bdClose = window.useBackdropClose(onClose);
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 125,
      display: "grid",
      placeItems: "center",
      padding: 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      width: "min(420px, 100%)",
      padding: 20,
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--tint-red-bg)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 18,
    color: "#EF4444"
  })), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 800,
      color: "var(--text-1)"
    }
  }, "\u0E22\u0E49\u0E32\u0E22\u0E07\u0E32\u0E19\u0E19\u0E35\u0E49\u0E40\u0E02\u0E49\u0E32\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30?"), React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-2)",
      marginTop: 4,
      lineHeight: 1.55
    }
  }, React.createElement("b", null, job.code), " \xB7 ", job.name || "(ไม่มีชื่อ)", React.createElement("br", null), "\u0E07\u0E32\u0E19\u0E08\u0E30\u0E2B\u0E32\u0E22\u0E08\u0E32\u0E01\u0E17\u0E38\u0E01\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D \u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49\u0E17\u0E35\u0E48 \u201C\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30\u201D \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E07\u0E32\u0E19"))), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      marginTop: 18
    }
  }, React.createElement("button", {
    onClick: onClose,
    style: {
      padding: "10px 16px",
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "var(--text-2)",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), React.createElement("button", {
    onClick: onConfirm,
    style: {
      padding: "10px 16px",
      borderRadius: 10,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E22\u0E49\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30"))));
}
function TrashModal({
  trash,
  me,
  onRestore,
  onPurge,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const isAdmin = !!me && hasRole(userRoles(me), "admin");
  const [ask, setAsk] = React.useState(null);
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState("");
  const doPurge = id => {
    if (!isAdmin) {
      setErr("เฉพาะแอดมินเท่านั้นที่ลบถาวรได้");
      return;
    }
    if (String(me.pin) !== String(pw)) {
      setErr("รหัสผ่านไม่ถูกต้อง");
      return;
    }
    onPurge(id);
    setAsk(null);
    setPw("");
    setErr("");
  };
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 125,
      display: "grid",
      placeItems: isMobile ? "stretch" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? 0 : 18,
      width: isMobile ? "100%" : "min(640px, 100%)",
      maxHeight: isMobile ? "100%" : "84vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "15px 18px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: "var(--tint-red-bg)",
      display: "grid",
      placeItems: "center",
      flexShrink: 0
    }
  }, React.createElement(Icon, {
    name: "trash",
    size: 17,
    color: "#EF4444"
  })), React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, React.createElement("h2", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30"), React.createElement("span", {
    style: {
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, trash.length, " \u0E07\u0E32\u0E19 \xB7 \u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E14\u0E49\u0E15\u0E25\u0E2D\u0E14 \xB7 \u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19"))), React.createElement("button", {
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
      minHeight: 0,
      overflowY: "auto",
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 9
    }
  }, trash.length === 0 && React.createElement("div", {
    style: {
      padding: 40,
      textAlign: "center",
      color: "var(--text-3)",
      fontSize: 13.5
    }
  }, "\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30\u0E27\u0E48\u0E32\u0E07 \u2014 \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A"), trash.map(j => React.createElement("div", {
    key: j.id,
    style: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 12
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 150
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: "var(--text-1)"
    }
  }, j.name || "(ไม่มีชื่อ)"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)",
      marginTop: 2
    }
  }, j.code, j.province ? " · " + j.province : "", j.kw ? " · " + j.kw + " kW" : "", j.deletedAt ? " · ลบเมื่อ " + thDate(String(j.deletedAt).slice(0, 10), true) : "", j.deletedBy ? " โดย " + j.deletedBy : "")), React.createElement("button", {
    onClick: () => onRestore(j.id),
    style: {
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--primary)",
      background: "var(--primary-soft)",
      color: "var(--primary-dark)",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19"), isAdmin && ask !== j.id && React.createElement("button", {
    onClick: () => {
      setAsk(j.id);
      setPw("");
      setErr("");
    },
    style: {
      padding: "8px 13px",
      borderRadius: 9,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      color: "#EF4444",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23")), ask === j.id && React.createElement("div", {
    style: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px dashed var(--border)"
    }
  }, React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--tint-red-tx)",
      fontWeight: 700,
      marginBottom: 7
    }
  }, "\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23\u0E41\u0E25\u0E49\u0E27\u0E01\u0E39\u0E49\u0E04\u0E37\u0E19\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 \u2014 \u0E43\u0E2A\u0E48\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E02\u0E2D\u0E07 ", me && me.name ? me.name : "บัญชีนี้", " \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19"), React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      flexWrap: "wrap"
    }
  }, React.createElement("input", {
    type: "password",
    value: pw,
    autoFocus: true,
    autoComplete: "off",
    onChange: e => {
      setPw(e.target.value);
      setErr("");
    },
    onKeyDown: e => {
      if (e.key === "Enter") doPurge(j.id);
    },
    placeholder: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    style: {
      flex: 1,
      minWidth: 130,
      background: "var(--surface2)",
      border: "1px solid var(--border-strong)",
      color: "var(--text-1)",
      fontFamily: "inherit",
      fontSize: 13,
      padding: "8px 10px",
      borderRadius: 9,
      outline: "none"
    }
  }), React.createElement("button", {
    onClick: () => doPurge(j.id),
    style: {
      padding: "8px 14px",
      borderRadius: 9,
      border: "none",
      background: "#EF4444",
      color: "#fff",
      fontFamily: "inherit",
      fontSize: 12.5,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, "\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23"), React.createElement("button", {
    onClick: () => {
      setAsk(null);
      setPw("");
      setErr("");
    },
    style: {
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
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), err && React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 11.5,
      fontWeight: 700,
      color: "#EF4444"
    }
  }, err))))), !isAdmin && trash.length > 0 && React.createElement("div", {
    style: {
      padding: "10px 16px",
      borderTop: "1px solid var(--border)",
      background: "var(--surface)",
      fontSize: 11.5,
      color: "var(--text-3)"
    }
  }, "\u0E25\u0E1A\u0E16\u0E32\u0E27\u0E23\u0E44\u0E14\u0E49\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19 \u2014 \u0E07\u0E32\u0E19\u0E43\u0E19\u0E16\u0E31\u0E07\u0E02\u0E22\u0E30\u0E08\u0E30\u0E2D\u0E22\u0E39\u0E48\u0E15\u0E23\u0E07\u0E19\u0E35\u0E49\u0E08\u0E19\u0E01\u0E27\u0E48\u0E32\u0E41\u0E2D\u0E14\u0E21\u0E34\u0E19\u0E08\u0E30\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23")));
}
function MapModal({
  jobs,
  onOpen,
  onClose
}) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  return React.createElement("div", _extends({}, bdClose, {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(8,20,14,.5)",
      backdropFilter: "blur(3px)",
      zIndex: 95,
      display: "grid",
      placeItems: isMobile ? "stretch" : "center",
      padding: isMobile ? 0 : 20
    }
  }), React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: "var(--bg)",
      borderRadius: isMobile ? 0 : 20,
      width: isMobile ? "100%" : "min(1120px, 100%)",
      height: isMobile ? "100%" : "88vh",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(8,20,14,.3)"
    }
  }, React.createElement("div", {
    style: {
      padding: "16px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--primary-soft)",
      display: "grid",
      placeItems: "center"
    }
  }, React.createElement(Icon, {
    name: "map",
    size: 19,
    color: "var(--primary-dark)"
  })), React.createElement("div", null, React.createElement("h2", {
    style: {
      fontSize: 16.5,
      fontWeight: 700,
      color: "var(--text-1)",
      margin: 0
    }
  }, "\u0E41\u0E1C\u0E19\u0E17\u0E35\u0E48\u0E07\u0E32\u0E19\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07"), React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)"
    }
  }, jobs.length, " \u0E07\u0E32\u0E19 \xB7 \u0E04\u0E25\u0E34\u0E01\u0E2B\u0E21\u0E38\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"))), React.createElement("button", {
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
  }))), React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: isMobile ? "auto" : "hidden",
      padding: isMobile ? 14 : 18,
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement(MapView, {
    jobs: jobs,
    onOpen: onOpen
  }))));
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));