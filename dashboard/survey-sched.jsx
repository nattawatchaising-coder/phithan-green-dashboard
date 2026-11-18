/* ============================================================
   flash+solar — Survey Scheduling & Dispatch
   ระบบนัดหมาย/จ่ายงานสำรวจให้วิศวกรสำรวจ (Survey Engineer)
   - useSurveyApptStore : คอลเลกชัน surveyAppointments (RTDB)
   - DispatchView       : ปฏิทินจ่ายงานรายวิศวกร + เตือนเวลาซ้อนทับ (office)
   - MyScheduleView     : ตารางงานของวิศวกร + ปุ่มเลื่อนสถานะ → เปิด wizard (mobile)
   appointment.engineerId = techId · appointment.projectId = job.id
   ============================================================ */

// ── สถานะนัดหมาย (ตรงกับ enum: Scheduled/In-Transit/In-Progress/Completed/Rescheduled/Canceled) ──
const APPT_STATUS = [
  { key: "scheduled",   th: "นัดหมายแล้ว",          color: "#3B82F6", icon: "calendar" },
  { key: "transit",     th: "กำลังเดินทาง",          color: "#F59E0B", icon: "map" },
  { key: "progress",    th: "ถึงไซต์ / กำลังสำรวจ",  color: "#8B5CF6", icon: "pin" },
  { key: "done",        th: "สำรวจเสร็จ",            color: "var(--tint-green-tx)", icon: "check" },
  { key: "rescheduled", th: "เลื่อนนัด",             color: "#0EA5E9", icon: "history" },
  { key: "canceled",    th: "ยกเลิก",                color: "#EF4444", icon: "x" },
];
const APPT_STATUS_BY = Object.fromEntries(APPT_STATUS.map((s) => [s.key, s]));

// ── helpers ──
function _ymdLocal(d) { const x = d instanceof Date ? d : new Date(d); const m = String(x.getMonth() + 1).padStart(2, "0"); const da = String(x.getDate()).padStart(2, "0"); return x.getFullYear() + "-" + m + "-" + da; }
function _hm(iso) { if (!iso) return "--:--"; const x = new Date(iso); return String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0"); }
function _addDays(ymd, n) { const x = new Date(ymd + "T00:00:00"); x.setDate(x.getDate() + n); return _ymdLocal(x); }
function _composeISO(ymd, hm) { if (!ymd || !hm) return ""; const d = new Date(ymd + "T" + hm); return isNaN(d.getTime()) ? "" : d.toISOString(); }

/* วิศวกรของนัด — ไปสำรวจได้หลายคน (engineerIds) · นัดเก่ามีแค่ engineerId คนเดียว
   engineerId ยังเก็บเป็นคนแรกเสมอ ให้โค้ด/รายงานเก่าที่อ่านช่องนี้ยังทำงาน */
function apptEngs(a) {
  if (!a) return [];
  const l = Array.isArray(a.engineerIds) ? a.engineerIds.filter(Boolean) : [];
  return l.length ? l : (a.engineerId ? [a.engineerId] : []);
}

// คืน Set ของ appointment id ที่เวลาซ้อนทับกับนัดอื่นของ "วิศวกรคนเดียวกัน"
function apptConflicts(list) {
  const bad = new Set();
  const byEng = {};
  (list || []).forEach((a) => { if (a.status === "canceled" || !a.start || !a.end) return; const es = apptEngs(a); (es.length ? es : ["_"]).forEach((e) => { (byEng[e] = byEng[e] || []).push(a); }); });
  Object.values(byEng).forEach((arr) => {
    const s = arr.slice().sort((x, y) => new Date(x.start) - new Date(y.start));
    for (let i = 1; i < s.length; i++) {
      if (new Date(s[i].start).getTime() < new Date(s[i - 1].end).getTime()) { bad.add(s[i].id); bad.add(s[i - 1].id); }
    }
  });
  return bad;
}

function blankAppt() {
  return {
    id: "SA-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    projectId: "", leadId: "", jobName: "", jobCode: "", province: "", address: "", phone: "",
    engineerId: "", engineerIds: [], start: "", end: "", status: "scheduled", notes: "",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

/* ============================================================
   LEADS — ลูกค้าที่ขอให้ไปสำรวจ (ยังไม่เป็นงาน)
   คนที่ให้ไปสำรวจส่วนใหญ่ยังไม่ตัดสินใจติดตั้งกับเรา ถ้าสร้างเป็น "งาน" ทุกราย
   ฐานข้อมูลงานจะบวมด้วยงานที่ไม่เกิดจริง — จึงเก็บแยกที่โหนด surveyLeads
   ตกลงติดตั้งเมื่อไหร่ค่อยกด "แปลงเป็นงาน" ย้ายเข้า jobs พร้อมแบบสำรวจ+รูป
   ============================================================ */
const LEAD_STATUS = [
  { key: "open", th: "รอตัดสินใจ", color: "#0EA5E9" },
  { key: "won",  th: "เป็นงานแล้ว", color: "var(--tint-green-tx)" },
  { key: "lost", th: "ไม่ติดตั้ง",  color: "#94A3B8" },
];
const LEAD_STATUS_BY = Object.fromEntries(LEAD_STATUS.map((s) => [s.key, s]));
const SF_LEAD_KEY = "solarflow_leads_v1";

function blankLead(leads) {
  let max = 0;
  (leads || []).forEach((l) => { const n = parseInt(String(l.code || "").replace(/\D/g, ""), 10); if (!isNaN(n) && n > max) max = n; });
  const now = new Date().toISOString();
  return {
    // id ไม่ซ้ำกับใครตลอดกาล (code เป็นเลขที่ให้คนอ่าน) — รูปสำรวจผูกกับ id ถ้าใช้เลขวนซ้ำรูปเก่าจะโผล่ผิดราย
    id: "LD-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    code: "LD-" + String(max + 1).padStart(3, "0"),
    name: "", phone: "", address: "", province: "", map: "", type: "home", phase: "", roof: "",   // phase ว่าง = ยังไม่ทราบ (ฟอร์มเลือก 1 / 3 / ไม่ทราบ · ที่อื่นคิดเป็น 1 เฟสเหมือนเดิม)
    note: "", status: "open", jobId: "", survey: null,
    /* ── ช่องของฝ่ายขาย ──
       sstage = ขั้นการขาย (ดู SALES_STAGES) แยกจาก status เดิมซึ่งบอกแค่จบแล้วหรือยัง
       ownerId/ownerName = เซลล์เจ้าของราย · ไม่มีเจ้าของ = ไม่มีใครตามต่อ
       nextFollow = วันติดตามครั้งถัดไป (เลยวันแล้วบอร์ดขายจะขึ้นแดงและดันขึ้นบนสุด)
       expKwp/expValue = ขนาดและมูลค่าที่คาด ใช้คิด pipeline ตอนยังไม่มีใบเสนอราคา
       contacts = ประวัติการติดต่อ {id, at, by, byName, how, note} */
    sstage: "new", ownerId: "", ownerName: "", nextFollow: "",
    expKwp: "", expValue: "", source: "", contacts: [],
    createdAt: now, updatedAt: now,
  };
}

// lead → รูปงานปลอมสำหรับ SurveyWizard/การ์ด (ใช้ id/code/name/survey เหมือนงานจริง)
/* ลูกค้าสำรวจในร่างของ "งาน" — หน้าสำรวจ · แบบ 3 มิติ · ออกแบบระบบ · ถอด BOQ ใช้ร่างเดียวกันหมด
   ขนาดที่คาดของเซลล์ใช้เป็น kW ตั้งต้น (ยังไม่มีตัวเลขจากวิศวกร) เพื่อให้ถอด BOQ ได้ตั้งแต่ยังไม่ปิดการขาย
   __lead = ธงบอกว่านี่ไม่ใช่งานจริงในฐานข้อมูล — ใครที่ต้องบันทึกค่ากลับจะได้รู้ว่าต้องเขียนลงตารางลูกค้า */
function leadAsJob(l) {
  if (!l) return null;
  return { __lead: true, id: l.id, code: l.code, name: l.name, phone: l.phone, address: l.address,
    province: l.province, type: l.type || "home", phase: l.phase || "1", roof: l.roof || "", map: l.map || "",
    kw: +l.expKwp || 0, panels: +l.expPanels || 0, brand: l.brand || "", boq: l.boq || null,
    survey: l.survey || null };
}

function useSurveyLeadStore() {
  const [leads, setLeads] = React.useState(_FB() ? null : () => _lsGet(SF_LEAD_KEY, []));
  const ref = React.useRef(leads);
  React.useEffect(() => { ref.current = leads; }, [leads]);
  React.useEffect(() => {
    if (!_FB()) return;
    const r = _fbr("surveyLeads");
    const h = r.on("value", (snap) => setLeads(_snap2arr(snap) || []), () => setLeads([]));
    return () => r.off("value", h);
  }, []);
  React.useEffect(() => { if (!_FB() && leads !== null) _lsSet(SF_LEAD_KEY, leads); }, [leads]);

  const upsert = React.useCallback((rec) => {
    const r = Object.assign({}, rec, { updatedAt: new Date().toISOString() });
    if (_FB()) _fbSet("surveyLeads/" + r.id, r);
    else setLeads((p) => { const a = p || []; const i = a.findIndex((x) => x.id === r.id); if (i === -1) return a.concat([r]); const c = a.slice(); c[i] = Object.assign({}, a[i], r); return c; });
    return r;
  }, []);
  const patch = React.useCallback((id, fields) => {
    const f = Object.assign({}, fields, { updatedAt: new Date().toISOString() });
    if (_FB()) _fbUpd("surveyLeads/" + id, f);
    else setLeads((p) => (p || []).map((x) => x.id === id ? Object.assign({}, x, f) : x));
  }, []);
  /* ลำดับการ์ดในคอลัมน์บอร์ดที่ผู้ใช้ลากจัดเอง (ผู้ใช้: "เลื่อนจัดลำดับงานเองได้ไหม" ต.ค. 2026) — ranks = { id: ลำดับ }
     เขียนทีเดียวหลายราย (multi-path) ไม่แตะ updatedAt — แค่จัดที่บนบอร์ด ไม่ใช่แก้ข้อมูลลูกค้า */
  const rank = React.useCallback((ranks) => {
    const ids = Object.keys(ranks || {});
    if (!ids.length) return;
    if (_FB()) { const u = {}; ids.forEach((id) => { u[id + "/boardRank"] = ranks[id]; }); _fbUpd("surveyLeads", u); }
    else setLeads((p) => (p || []).map((x) => ranks[x.id] != null ? Object.assign({}, x, { boardRank: ranks[x.id] }) : x));
  }, []);
  /* ลบ = ย้ายเข้าถังขยะ (ติดธง deleted แบบเดียวกับงาน) — แบบสำรวจ/รูป/ใบเสนอราคายังอยู่ครบ กู้คืนได้ (ผู้ใช้สั่ง ต.ค. 2026)
     by = ชื่อคนที่กดลบ ไว้ดูย้อนหลังในถังขยะ */
  const remove = React.useCallback((id, by) => {
    const f = { deleted: true, deletedAt: new Date().toISOString(), deletedBy: by || "" };
    if (_FB()) _fbUpd("surveyLeads/" + id, f);
    else setLeads((p) => (p || []).map((x) => x.id === id ? Object.assign({}, x, f) : x));
  }, []);
  const restore = React.useCallback((id) => {
    if (_FB()) _fbUpd("surveyLeads/" + id, { deleted: null, deletedAt: null, deletedBy: null });
    else setLeads((p) => (p || []).map((x) => x.id === id ? Object.assign({}, x, { deleted: false }) : x));
  }, []);
  /* ลบถาวร — ออกจากฐานจริงพร้อมรูปสำรวจ กู้คืนไม่ได้ (ถังขยะกั้นด้วยแอดมิน + รหัสผ่านก่อนเรียกตัวนี้) */
  const purge = React.useCallback((id) => {
    if (_FB()) { _fbRem("surveyLeads/" + id); _fbRem("surveyPhotos/" + id); }
    else setLeads((p) => (p || []).filter((x) => x.id !== id));
  }, []);

  /* ลูกค้าเฉพาะแอดมิน (adminOnly) — คนที่ไม่ใช่แอดมินไม่เห็น · blankLead ยังนับเลขจากทั้งหมด (รวมในถังขยะ รหัสไม่ซ้ำ)
     ลูกค้าในถังขยะไม่ขึ้นที่ไหนเลย และนับเป็น hidden ด้วย — ใบเสนอราคา/นัดของรายนั้นหายตามจนกว่าจะกู้คืน */
  const admin = window.usePgAdmin();
  const seen = (l) => admin || !l.adminOnly;
  const vis = React.useMemo(() => (leads || []).filter((l) => !l.deleted && seen(l)), [leads, admin]);
  const hidden = React.useMemo(() => new Set((leads || []).filter((l) => l.deleted || !seen(l)).map((l) => l.id)), [leads, admin]);
  const trash = React.useMemo(() => (leads || []).filter((l) => l.deleted && seen(l))
    .sort((a, b) => String(b.deletedAt || "").localeCompare(String(a.deletedAt || ""))), [leads, admin]);
  return { leads: vis, hidden, trash, upsert, patch, rank, remove, restore, purge, blank: () => Object.assign(blankLead(ref.current || []), window.pgAdminFlag()) };
}

/* ย้ายรูป checklist จากลูกค้าสำรวจ → งานจริง (คนละคีย์ใน surveyPhotos) */
function moveSurveyPhotos(fromId, toId) {
  if (!window.FBDB || !fromId || !toId || fromId === toId) return Promise.resolve();
  return window.FBDB.ref("surveyPhotos/" + fromId).once("value").then((s) => {
    const v = s.val();
    if (!v) return null;
    return window.FBDB.ref("surveyPhotos/" + toId).set(v).then(() => window.FBDB.ref("surveyPhotos/" + fromId).remove());
  }).catch(() => null);
}

const SF_APPT_KEY = "solarflow_appts_v1";

function useSurveyApptStore() {
  const [appts, setAppts] = React.useState(_FB() ? null : () => _lsGet(SF_APPT_KEY, []));
  const [loading, setLoading] = React.useState(_FB());
  React.useEffect(() => {
    if (!_FB()) { setLoading(false); return; }
    const ref = _fbr("surveyAppointments");
    const h = ref.on("value", (snap) => { setAppts(_snap2arr(snap) || []); setLoading(false); }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  React.useEffect(() => { if (!_FB() && appts !== null) _lsSet(SF_APPT_KEY, appts); }, [appts]);

  const upsert = React.useCallback((rec) => {
    const r = Object.assign({}, rec, { updatedAt: new Date().toISOString() });
    if (_FB()) { _fbSet("surveyAppointments/" + r.id, r); }
    else setAppts((prev) => { const a = prev || []; const i = a.findIndex((x) => x.id === r.id); if (i === -1) return a.concat([r]); const c = a.slice(); c[i] = Object.assign({}, a[i], r); return c; });
  }, []);
  const remove = React.useCallback((id) => {
    if (_FB()) { _fbRem("surveyAppointments/" + id); }
    else setAppts((prev) => (prev || []).filter((x) => x.id !== id));
  }, []);
  const setStatus = React.useCallback((id, status) => {
    const now = new Date().toISOString();
    const stamp = ({ transit: { transitAt: now }, progress: { arrivedAt: now }, done: { completedAt: now } })[status] || {};
    const fields = Object.assign({ status, updatedAt: now }, stamp);
    if (_FB()) { _fbUpd("surveyAppointments/" + id, fields); }
    else setAppts((prev) => (prev || []).map((x) => x.id === id ? Object.assign({}, x, fields) : x));
  }, []);

  return { appts: appts || [], loading, upsert, remove, setStatus };
}

/* ── หัวเพจร่วม (สไตล์เดียวกับหน้า stock) ── */
/* เครื่องมือบนหัวจอ — อ่านจากบริบทที่ App วางไว้ ไม่มีก็ไม่แสดงอะไร (เช่นหน้า LIFF) */
function SchedHdrTools() {
  const ctx = React.useContext(window.HdrCtx);
  if (!ctx || !window.HeaderTools) return null;
  return <window.HeaderTools {...ctx} />;
}

function SchedHeader({ icon, title, sub, onMenuOpen, right }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  /* ระยะขอบล่างต้องเท่ากับหัวจอหลัก (Header ใน app.jsx) ไม่งั้นหน้าที่ใช้หัวจอตัวนี้
     (ยอดขาย · จัดตารางสำรวจ) จะเตี้ยกว่าหน้าอื่น 18px และเส้นขอบล่างชิดตัวหนังสือ */
  return (
    <header className="app-header" style={{ paddingBottom: isMobile ? 12 : 18 }}>
      <div className="header-top">
        <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู"><Icon name="menu" size={18} color="var(--text-2)" /></button>
        {/* จอใหญ่ชื่อหน้ากินเท่าที่ตัวมันกว้าง ที่เหลือเป็นของแถบตัวกรอง — ท่าเดียวกับ Header ใน app.jsx */}
        {/* ไม่มีบรรทัดรอง = กลุ่มนี้เตี้ยกว่าชิปผู้ใช้ข้าง ๆ ต้องจัดกึ่งกลางเอง ไม่งั้นชื่อหน้าจะลอยอยู่ขอบบน */}
        {/* พื้นขั้นต่ำของก้อนชื่อหน้า — .header-filters.in-top ตั้ง flex-shrink ไว้ต่ำมาก (.15)
            ชื่อหน้าจึงรับการหดไว้เกือบทั้งหมด ปล่อยไว้จะหดจนหายไปทั้งคำตอนจอแคบ
            ตั้งพื้นไว้แล้วเหลืออย่างน้อยสองสามคำแรก ที่เหลือให้แถบตัวกรองเลื่อนแนวนอนเอา ซึ่งมันทำได้อยู่แล้ว */}
        <div style={{ flex: isMobile ? 1 : "0 1 auto", minWidth: isMobile ? 0 : 108, alignSelf: sub ? undefined : "center" }}>
          {/* มุมที่กำลังดู (ปฏิทิน/นัดสำรวจ/ของฉัน) อยู่เป็นเมนูย่อยในแถบเมนูซ้าย ไม่ใช่บนหัวจอ */}
          <h1 className="page-title">{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
        {!isMobile && <window.HdrSlot />}
        {/* ชุดเครื่องมือขวามือเดียวกันกับหัวจอหลัก — หน้าที่ใช้หัวจอตัวนี้เคยไม่มีเลย
            คนที่อยู่หน้ายอดขายจึงต้องย้อนกลับหน้าอื่นก่อนถึงจะกดกระดิ่งหรือสลับธีมได้ */}
        <div className="header-actions">
          {right}
          <SchedHdrTools />
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   DISPATCH — ปฏิทินจ่ายงานรายวิศวกร (office) + เตือนซ้อนทับ
   ============================================================ */
function DispatchView({ appts, jobs, techs, store, leadStore, onMenuOpen, onOpenJob, onNotify }) {
  const leads = (leadStore && leadStore.leads) || [];
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [edit, setEdit] = React.useState(null); // appointment ที่กำลังแก้ (หรือ object ใหม่)

  const [mode, setMode] = React.useState("month"); // month = ปฏิทินเดือน (กดวัน = เด้งรายการวันนั้น), all = ทุกนัด
  const [pop, setPop] = React.useState(null); // วันที่กดในปฏิทิน (YYYY-MM-DD) → หน้าต่างรายการนัดวันนั้น
  const [mon, setMon] = React.useState(() => _ymdLocal(new Date()).slice(0, 7)); // "YYYY-MM"
  const monAppts = React.useMemo(() => (appts || []).filter((a) => a.start && _ymdLocal(a.start).slice(0, 7) === mon), [appts, mon]);
  const allConflicts = React.useMemo(() => apptConflicts(appts || []), [appts]);
  const techById = React.useMemo(() => Object.fromEntries((techs || []).map((t) => [t.id, t])), [techs]);
  const scopeAppts = mode === "month" ? monAppts : (appts || []);
  const summary = APPT_STATUS.map((s) => ({ s, n: scopeAppts.filter((a) => a.status === s.key).length })).filter((x) => x.n > 0);
  const conflictScope = allConflicts;
  // โหมด "ทั้งหมด" — จัดกลุ่มทุกนัดตามวันที่ เรียงเวลา
  const allGroups = React.useMemo(() => {
    const m = {};
    (appts || []).forEach((a) => { const k = a.start ? _ymdLocal(a.start) : "ไม่ระบุวัน"; (m[k] = m[k] || []).push(a); });
    return Object.keys(m).sort().map((k) => ({ day: k, items: m[k].slice().sort((x, y) => new Date(x.start || 0) - new Date(y.start || 0)) }));
  }, [appts]);

  return (
    <React.Fragment>
      {/* ชื่อหน้าเป็นชื่อเมนูแม่ ไม่ใช่ชื่อแท็บ — สลับแท็บแล้วหัวจอไม่ควรเปลี่ยนชื่อทั้งอัน
          คนอ่านจะได้รู้ว่ายังอยู่เมนูเดิม แค่คนละมุม (ท่าเดียวกับหน้างานขาย บอร์ด/รายการ)
          ว่าอยู่มุมไหนดูที่แท็บ ส่วนบรรทัดรองยังบอกรายละเอียดของมุมนั้นเหมือนเดิม */}
      <SchedHeader icon="calendar" title="ตารางงาน" onMenuOpen={onMenuOpen}
        sub={<span>{scopeAppts.length} นัด{mode === "month" ? " (เดือนนี้)" : " (ทั้งหมด)"} · {conflictScope.size > 0 ? <span style={{ color: "var(--tint-red-tx2)", fontWeight: 700 }}>⚠ ซ้อนทับ {conflictScope.size / 2 | 0} คู่</span> : "ไม่มีเวลาซ้อนทับ"}</span>}
        right={<button onClick={() => setEdit(Object.assign(blankAppt(), { start: _composeISO(_ymdLocal(new Date()), "09:00"), end: _composeISO(_ymdLocal(new Date()), "11:00") }))} className="btn-add"><Icon name="plus" size={17} color="#fff" sw={2.4} /><span>นัดสำรวจ</span></button>} />
      <div className="app-content">
        {/* สลับมุมมอง รายวัน / ทั้งหมด */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Segmented value={mode} onChange={setMode} options={[{ value: "month", label: "ปฏิทิน", icon: "calendar" }, { value: "all", label: "ทั้งหมด", icon: "list" }]} />
          {mode === "month" && <React.Fragment>
            <button onClick={() => setMon((m) => _addMonths(m, -1))} style={navBtn}><Icon name="chevronRight" size={16} color="var(--text-2)" style={{ transform: "scaleX(-1)" }} /></button>
            <button onClick={() => setMon(_ymdLocal(new Date()).slice(0, 7))} style={{ ...navBtn, width: "auto", padding: "0 14px", fontWeight: 700, fontSize: 13 }}>เดือนนี้</button>
            <button onClick={() => setMon((m) => _addMonths(m, 1))} style={navBtn}><Icon name="chevronRight" size={16} color="var(--text-2)" /></button>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", marginLeft: 4 }}>{_thMonth(mon)}</span>
          </React.Fragment>}
          <span style={{ flex: 1 }} />
          {summary.map(({ s, n }) => <span key={s.key} style={{ fontSize: 11.5, fontWeight: 700, color: s.color, background: s.color + "16", padding: "4px 10px", borderRadius: "var(--r-pill)" }}>{s.th} {n}</span>)}
        </div>

        {mode === "month" ? (
          <SurveyMonthCal mon={mon} appts={monAppts} techById={techById} conflicts={allConflicts} isMobile={isMobile}
            onPickDay={(d) => setPop(d)} onOpen={(a) => setEdit(Object.assign({}, a))} />
        ) : (
          allGroups.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-tile)" }}>
              ยังไม่มีนัดสำรวจในระบบ · กด “นัดสำรวจ” เพื่อจ่ายงานให้วิศวกร
            </div>
          ) : allGroups.map((g) => (
            <div key={g.day} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-3)", marginBottom: 9 }}>{g.day === "ไม่ระบุวัน" ? g.day : thDate(g.day, true)} ({g.items.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.items.map((a) => {
                  const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
                  const ts = apptEngs(a).map((id) => techById[id]).filter(Boolean);
                  const t = ts[0];
                  const clash = allConflicts.has(a.id);
                  return (
                    <button key={a.id} onClick={() => setEdit(Object.assign({}, a))}
                      style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", padding: 13, borderRadius: "var(--r-tile)",
                        background: "var(--surface)", border: "none", boxShadow: clash ? "inset 0 0 0 1px var(--mark-danger), 0 0 0 3px var(--tint-red-bg)" : "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{_hm(a.start)}–{_hm(a.end)}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: stt.color, background: stt.color + "16", padding: "2px 8px", borderRadius: "var(--r-pill)" }}>{stt.th}</span>
                          <Icon name="chevronRight" size={14} color="var(--text-3)" />
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{a.jobName || "—"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{a.jobCode}{a.province ? " · " + a.province : ""}{a.leadId ? <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#0EA5E9", background: "#0EA5E916", padding: "2px 7px", borderRadius: "var(--r-pill)" }}>ลูกค้าสำรวจ</span> : null}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)", marginTop: 1 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "var(--r-pill)", background: (t && t.color) || "#94A3B8", flexShrink: 0 }} />
                        {t ? ts.map((x) => x.name).join(", ") : "ยังไม่มอบหมาย"}
                      </div>
                      {clash && <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tint-red-tx2)" }}>⚠ เวลาซ้อนทับกับนัดอื่นของวิศวกรคนนี้</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      {pop && <SurveyDayPop day={pop} appts={(appts || []).filter((a) => a.start && _ymdLocal(a.start) === pop)} techById={techById} conflicts={allConflicts} isMobile={isMobile}
        onClose={() => setPop(null)} onOpen={(a) => setEdit(Object.assign({}, a))}
        onAdd={() => setEdit(Object.assign(blankAppt(), { start: _composeISO(pop, "09:00"), end: _composeISO(pop, "11:00") }))} />}
      {edit && <SurveyApptModal initial={edit} jobs={jobs} techs={techs} appts={appts}
        leads={leads} blankLead={leadStore && leadStore.blank}
        onClose={() => setEdit(null)}
        onSave={(rec, newLead) => { const prev = (appts || []).find((a) => a.id === rec.id) || null; if (newLead && leadStore) leadStore.upsert(newLead); store.upsert(rec); if (onNotify) onNotify(rec, prev); setEdit(null); }}
        onDelete={(id) => { askConfirm({ title: "ลบนัดสำรวจนี้?", ok: "ลบนัด" }).then((ok) => { if (ok) { store.remove(id); setEdit(null); } }); }} />}
    </React.Fragment>
  );
}
/* ลูกค้าฝ่ายขายที่ยังเปิดอยู่ = ไม่ถูกลบ · ยังไม่ปิดการขาย (won) · ยังไม่ "ไม่ติดตั้ง" (lost) · ยังไม่แปลงเป็นงาน */
function salesOpenLead(l) {
  if (!l || l.deleted || l.jobId) return false;
  const k = window.salesStageKey ? window.salesStageKey(l) : (l.sstage || l.status || "open");
  return k !== "won" && k !== "lost" && l.status !== "won" && l.status !== "lost";
}
function _addMonths(ym, n) { const [y, m] = ym.split("-").map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
const _TH_MON = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
function _thMonth(ym) { const [y, m] = ym.split("-").map(Number); return _TH_MON[m - 1] + " " + (y + 543); }

/* หน้าต่างรายการนัดของวันที่กดในปฏิทิน — กดนัดเปิดแก้ไข · ปุ่มเพิ่มนัดวันนั้น */
function SurveyDayPop({ day, appts, techById, conflicts, isMobile, onClose, onOpen, onAdd }) {
  const bdClose = window.useBackdropClose(onClose);
  const list = (appts || []).slice().sort((x, y) => new Date(x.start) - new Date(y.start));
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 117, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(460px,100%)", maxHeight: isMobile ? "88dvh" : "84vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "14px 18px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, boxShadow: "var(--shadow-sm)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{thDate(day, true)}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{list.length ? list.length + " นัดสำรวจ" : "ยังไม่มีนัดสำรวจ"}</div>
          </div>
          <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
          {list.length === 0 && <div style={{ padding: 26, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>วันนั้นยังว่าง · กดปุ่มด้านล่างเพื่อนัดสำรวจ</div>}
          {list.map((a) => {
            const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
            const ts = apptEngs(a).map((id) => techById[id]).filter(Boolean);
            const clash = conflicts.has(a.id);
            return (
              <button key={a.id} onClick={() => onOpen(a)}
                style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", padding: 12, borderRadius: "var(--r-tile)", border: "none", background: "var(--surface)",
                  boxShadow: clash ? "inset 0 0 0 1px var(--mark-danger), 0 0 0 3px var(--tint-red-bg)" : "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{_hm(a.start)}–{_hm(a.end)}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: stt.color, background: stt.color + "16", padding: "2px 8px", borderRadius: "var(--r-pill)" }}>{stt.th}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{a.jobName || "—"}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{a.jobCode}{a.province ? " · " + a.province : ""}{a.phone ? " · " + a.phone : ""}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 1 }}>
                  {ts.length ? ts.map((t) => <span key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-2)", background: "var(--surface2)", padding: "2px 8px", borderRadius: "var(--r-pill)" }}><span style={{ width: 7, height: 7, borderRadius: 4, background: t.color || "#94A3B8" }} />{t.name}</span>)
                    : <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ยังไม่มอบหมาย</span>}
                </div>
                {clash && <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tint-red-tx2)" }}>⚠ เวลาซ้อนทับกับนัดอื่นของวิศวกร</div>}
                {a.notes && <div style={{ fontSize: 11, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 7, padding: "5px 8px" }}>📝 {a.notes}</div>}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "12px 14px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, background: "var(--surface)" }}>
          <button onClick={onAdd} style={{ width: "100%", padding: 12, borderRadius: "var(--r-chip)", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="plus" size={16} color="#fff" sw={2.4} />เพิ่มนัดสำรวจวันนั้น
          </button>
        </div>
      </div>
    </div>
  );
}

/* ปฏิทินเดือน — ดูว่าวันไหนมีนัดสำรวจ · กดวัน = เด้งรายการนัดวันนั้น · กดนัด = แก้ไข */
function SurveyMonthCal({ mon, appts, techById, conflicts, isMobile, onPickDay, onOpen }) {
  const [y, m] = mon.split("-").map(Number);
  const first = new Date(y, m - 1, 1), nDays = new Date(y, m, 0).getDate();
  const lead = first.getDay(); // 0 = อาทิตย์
  const today = _ymdLocal(new Date());
  const byDay = {};
  (appts || []).forEach((a) => { const k = _ymdLocal(a.start); (byDay[k] = byDay[k] || []).push(a); });
  Object.values(byDay).forEach((l) => l.sort((x, z) => new Date(x.start) - new Date(z.start)));
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= nDays; d++) cells.push(mon + "-" + String(d).padStart(2, "0"));
  while (cells.length % 7) cells.push(null);
  const maxShow = isMobile ? 0 : 3;
  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-sm)", padding: isMobile ? 8 : 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: isMobile ? 4 : 6 }}>
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "var(--tint-red-tx2)" : "var(--text-3)", padding: "2px 0 4px" }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={"e" + i} />;
          const list = byDay[d] || [];
          const live = list.filter((a) => a.status !== "canceled");
          const isToday = d === today;
          const clash = list.some((a) => conflicts.has(a.id));
          return (
            <div key={d} onClick={() => onPickDay(d)} role="button"
              style={{ minHeight: isMobile ? 54 : 104, borderRadius: "var(--r-chip)", padding: isMobile ? "5px 4px" : "6px 7px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, minWidth: 0,
                background: live.length ? "var(--primary-soft)" : "var(--surface2)", boxShadow: isToday ? "inset 0 0 0 2px var(--primary)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: isToday ? "var(--primary)" : (i % 7 === 0 ? "var(--tint-red-tx2)" : "var(--text-1)") }}>{+d.slice(8)}</span>
                {live.length > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: clash ? "var(--mark-danger)" : "var(--primary)", borderRadius: "var(--r-pill)", padding: "1px 6px", fontFamily: "var(--mono)" }}>{live.length}</span>}
              </div>
              {list.slice(0, maxShow).map((a) => {
                const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
                const t = techById[apptEngs(a)[0]];
                return (
                  <div key={a.id} onClick={(e) => { e.stopPropagation(); onOpen(a); }} title={_hm(a.start) + " " + (a.jobName || "")}
                    style={{ fontSize: 10.5, lineHeight: 1.3, background: "var(--surface)", borderRadius: 5, padding: "2px 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      borderLeft: "3px solid " + ((t && t.color) || "#94A3B8"), color: a.status === "canceled" ? "var(--text-3)" : "var(--text-1)", textDecoration: a.status === "canceled" ? "line-through" : "none" }}>
                    <b style={{ fontFamily: "var(--mono)", color: stt.color }}>{_hm(a.start)}</b> {a.jobName || "—"}
                  </div>
                );
              })}
              {list.length > maxShow && maxShow > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)" }}>+{list.length - maxShow} นัด</div>}
              {isMobile && live.length > 0 && <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>{live.slice(0, 4).map((a) => <span key={a.id} style={{ width: 6, height: 6, borderRadius: 3, background: ((techById[apptEngs(a)[0]] || {}).color) || "var(--primary)" }} />)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const navBtn = { width: 36, height: 36, borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 };

/* ── Modal สร้าง/แก้ไขนัดสำรวจ ──
   onSave(appt, newLead) — newLead != null เมื่อผู้ใช้กรอกลูกค้าใหม่ (ยังไม่มีในระบบ) */
function SurveyApptModal({ initial, jobs, techs, appts, leads, blankLead, onClose, onSave, onDelete }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const isNew = !(appts || []).some((a) => a.id === initial.id);
  const [f, setF] = React.useState(() => Object.assign({}, initial,
    { engineerIds: apptEngs(initial), _date: initial.start ? _ymdLocal(initial.start) : _ymdLocal(new Date()), _start: initial.start ? _hm(initial.start) : "09:00", _end: initial.end ? _hm(initial.end) : "11:00" }));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  /* สำรวจให้ใคร: "lead" = ลูกค้าในระบบ (ลูกค้าฝ่ายขายที่ยังไม่ปิดการขายและยังไม่ "ไม่ติดตั้ง")
     "new" = ลูกค้าใหม่กรอกเอง · "job" = เฉพาะนัดเก่าที่ผูกกับงานติดตั้งไว้แล้ว (ไม่มีให้เลือกใหม่) */
  const [target, setTarget] = React.useState(() => (initial.projectId ? "job" : initial.leadId ? "lead" : (leads || []).some(salesOpenLead) ? "lead" : "new"));
  // "" = ลูกค้าใหม่ (กรอกเอง) · ค่าอื่น = เลือกจากลูกค้าสำรวจที่มีอยู่
  const [nl, setNl] = React.useState(() => ({ name: "", phone: "", address: "", province: "" }));
  const setN = (k, v) => setNl((p) => Object.assign({}, p, { [k]: v }));
  const newLead = target === "new";
  const toggleEng = (id) => setF((p) => { const cur = apptEngs(p); const nx = cur.includes(id) ? cur.filter((x) => x !== id) : cur.concat(id); return Object.assign({}, p, { engineerIds: nx, engineerId: nx[0] || "" }); });
  const leadOpts = (leads || []).filter((l) => salesOpenLead(l) || l.id === f.leadId);

  const pickJob = (id) => setF((p) => { const j = (jobs || []).find((x) => x.id === id) || {}; return Object.assign({}, p, { projectId: id, leadId: "", jobName: j.name || "", jobCode: j.code || "", province: j.province || "", address: j.address || "", phone: j.phone || "" }); });
  const pickLead = (id) => setF((p) => { const l = (leads || []).find((x) => x.id === id) || {}; return Object.assign({}, p, { leadId: id, projectId: "", jobName: l.name || "", jobCode: l.code || "", province: l.province || "", address: l.address || "", phone: l.phone || "" }); });
  const switchTarget = (v) => { setTarget(v); setF((p) => Object.assign({}, p, { leadId: "", projectId: "", jobName: "", jobCode: "", province: "", address: "", phone: "" })); };

  const startISO = _composeISO(f._date, f._start), endISO = _composeISO(f._date, f._end);
  // เตือนเวลาซ้อนทับกับนัดอื่นของวิศวกรคนเดียวกัน (ไม่นับนัดนี้เอง) · ไปหลายคนเช็กทุกคน
  const myEngs = apptEngs(f);
  const clash = React.useMemo(() => {
    if (!myEngs.length || !startISO || !endISO) return null;
    let hit = null;
    (appts || []).some((a) => {
      if (a.id === f.id || a.status === "canceled" || !a.start || !a.end) return false;
      if (!(new Date(startISO).getTime() < new Date(a.end).getTime() && new Date(a.start).getTime() < new Date(endISO).getTime())) return false;
      const who = apptEngs(a).find((e) => myEngs.includes(e));
      if (who) hit = Object.assign({}, a, { _who: who });
      return !!who;
    });
    return hit;
  }, [myEngs.join(","), startISO, endISO, appts]);

  const submit = () => {
    let lead = null;
    if (target === "job") {
      if (!f.projectId) { alert("กรุณาเลือกงาน/โครงการ"); return; }
    } else if (target === "lead") {
      if (!f.leadId) { alert("กรุณาเลือกลูกค้า"); return; }
    } else if (newLead) {
      if (!nl.name.trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; }
      lead = Object.assign(blankLead ? blankLead() : {}, { name: nl.name.trim(), phone: nl.phone.trim(), address: nl.address.trim(), province: nl.province.trim() });
    }
    if (!startISO || !endISO) { alert("กรุณาระบุวันและเวลา"); return; }
    if (new Date(endISO) <= new Date(startISO)) { alert("เวลาสิ้นสุดต้องหลังเวลาเริ่ม"); return; }
    const eng = apptEngs(f);
    const out = Object.assign({}, f, { start: startISO, end: endISO, engineerIds: eng, engineerId: eng[0] || "" });
    if (lead) Object.assign(out, { leadId: lead.id, projectId: "", jobName: lead.name, jobCode: lead.code, province: lead.province, address: lead.address, phone: lead.phone });
    delete out._date; delete out._start; delete out._end;
    onSave(out, lead);
  };

  const lbl = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, bottom: "var(--kb, 0px)", background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 118, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(520px,100%)", maxHeight: isMobile ? "calc(94dvh - var(--kb, 0px))" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-modal)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>{isNew ? "นัดสำรวจใหม่" : "แก้ไขนัดสำรวจ"}</h2>
          <button className="x-close" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* สำรวจให้ใคร — ลูกค้าที่ยังไม่เป็นงาน (ไม่ไปบวมฐานข้อมูลงาน) หรืองานที่รับแล้ว */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>สำรวจให้ใคร</label>
            {target === "job" ? (
              <div style={{ fontSize: 12.5, color: "var(--text-2)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", borderRadius: "var(--r-chip)", padding: "10px 12px" }}>
                งานติดตั้ง: <b style={{ color: "var(--text-1)" }}>{f.jobName || "—"}</b> · {f.jobCode}{f.province ? " · " + f.province : ""}
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>นัดเก่าที่ผูกกับงานในระบบ · นัดใหม่เลือกได้เฉพาะลูกค้าฝ่ายขาย</div>
              </div>
            ) : <Segmented value={target} onChange={switchTarget}
              options={[{ value: "lead", label: "ลูกค้าในระบบ" }, { value: "new", label: "ลูกค้าใหม่" }]} />}
          </div>
          {target === "job" ? null : (
            <React.Fragment>
              {target === "lead" && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={lbl}>ลูกค้า (ฝ่ายขาย · ยังไม่ปิดการขาย) *</label>
                <Dropdown value={f.leadId} onChange={pickLead} placeholder={leadOpts.length ? "— เลือกลูกค้า —" : "— ไม่มีลูกค้าที่ยังเปิดอยู่ —"}
                  options={leadOpts.map((l) => ({ value: l.id, label: l.name + " · " + l.code + (l.province ? " · " + l.province : "") + (window.salesStageOf && window.salesStageKey ? " · " + window.salesStageOf(window.salesStageKey(l)).th : "") }))} />
              </div>}
              {newLead && (
                <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 13, borderRadius: "var(--r-chip)", background: "var(--surface2)", border: "1px dashed var(--border-strong)" }}>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>บันทึกเป็น “ลูกค้าสำรวจ” ยังไม่นับเป็นงาน · ถ้าตกลงติดตั้งค่อยกดแปลงเป็นงานทีหลัง</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ชื่อลูกค้า *</label><input value={nl.name} onChange={(e) => setN("name", e.target.value)} placeholder="เช่น คุณสมชาย ใจดี" style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เบอร์โทร</label><input value={nl.phone} onChange={(e) => setN("phone", e.target.value)} placeholder="08x-xxx-xxxx" style={inputStyle} /></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>จังหวัด</label><input value={nl.province} onChange={(e) => setN("province", e.target.value)} placeholder="เช่น ชลบุรี" style={inputStyle} /></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ที่อยู่หน้างาน</label><input value={nl.address} onChange={(e) => setN("address", e.target.value)} placeholder="บ้านเลขที่ / ถนน / ตำบล" style={inputStyle} /></div>
                </div>
              )}
            </React.Fragment>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>วิศวกรสำรวจ <span style={{ fontWeight: 600 }}>· เลือกได้หลายคน{myEngs.length ? " (" + myEngs.length + " คน)" : ""}</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {(techs || []).map((t) => {
                const on = myEngs.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => toggleEng(t.id)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: "var(--r-pill)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
                      background: on ? "var(--primary)" : "var(--surface2)", color: on ? "#fff" : "var(--text-2)", boxShadow: on ? "var(--shadow-sm)" : "var(--shadow-inset)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "var(--r-pill)", background: on ? "#fff" : (t.color || "#94A3B8") }} />
                    {t.name}{t.nick ? " (" + t.nick + ")" : ""}
                  </button>
                );
              })}
              {!(techs || []).length && <span style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่มีรายชื่อวิศวกร</span>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>วันที่</label>
            <input type="date" value={f._date} onChange={(e) => set("_date", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เวลาเริ่ม</label><window.PgTime value={f._start} onChange={(t) => set("_start", t)} style={inputStyle} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เวลาสิ้นสุด</label><window.PgTime value={f._end} onChange={(t) => set("_end", t)} style={inputStyle} /></div>
          </div>
          {clash && <div style={{ fontSize: 12, color: "var(--tint-red-tx)", background: "var(--tint-red-bg)", border: "1px solid var(--tint-red-bd)", borderRadius: 9, padding: "9px 11px", fontWeight: 600 }}>⚠ {((techs || []).find((t) => t.id === clash._who) || {}).name || "วิศวกร"} มีนัดซ้อนทับช่วงเวลานี้ ({_hm(clash.start)}–{_hm(clash.end)} · {clash.jobName})</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>สถานะ</label>
            <Dropdown value={f.status} onChange={(v) => set("status", v)} options={APPT_STATUS.map((s) => ({ value: s.key, label: s.th }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>หมายเหตุการจ่ายงาน</label>
            <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder='เช่น "ลูกค้าสะดวกช่วงบ่ายเท่านั้น"' style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
          </div>
        </div>
        <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--divider)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "center" }}>
          {!isNew && <button onClick={() => onDelete(f.id)} style={{ flex: "0 0 auto", width: 44, height: 44, borderRadius: "var(--r-chip)", border: "1px solid var(--tint-red-bd)", background: "var(--tint-red-bg)", color: "var(--tint-red-tx2)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} /></button>}
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit} style={{ flex: 1, padding: "12px", borderRadius: "var(--r-chip)", border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>บันทึกนัดหมาย</button>
        </div>
      </div>
    </div>
  );
}

/* ── เวิร์กโฟลว์งานสำรวจ (ขั้นตอนเชิงเส้นที่วิศวกรเดินผ่าน) ──
   นัดหมาย → ออกเดินทาง → เช็คอินถึงไซต์ → ทำแบบสำรวจ(เสร็จ)
   stamp = ฟิลด์เวลาที่ store.setStatus บันทึกไว้ตอนกดเลื่อนสถานะ */
const APPT_FLOW = [
  { key: "scheduled", th: "รับงาน / นัดหมาย", stamp: null },
  { key: "transit",   th: "ออกเดินทาง",       stamp: "transitAt",   enterCta: "เริ่มเดินทาง",      enterIcon: "map" },
  { key: "progress",  th: "เช็คอิน · ถึงไซต์", stamp: "arrivedAt",   enterCta: "เช็คอิน · ถึงไซต์",  enterIcon: "pin" },
  { key: "done",      th: "ทำแบบสำรวจเสร็จ",   stamp: "completedAt", enterCta: "เปิดแบบสำรวจ",       enterIcon: "list" },
];
function flowCta(bg) { return { marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10, border: "none", background: bg, color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }; }

// timeline ขั้นตอนงานสำรวจในการ์ด — ติ๊กถูกขั้นที่เสร็จ + เวลาจริง, ขั้นถัดไปกดเลื่อนได้
function ApptFlow({ a, job, onStatus, onOpenSurvey }) {
  const idx = APPT_FLOW.findIndex((s) => s.key === a.status); // -1 ถ้ายกเลิก/เลื่อนนัด
  return (
    <div style={{ paddingLeft: 2 }}>
      {APPT_FLOW.map((s, i) => {
        const reached = i <= idx;                 // ผ่าน/อยู่ขั้นนี้แล้ว
        const isNext = i === idx + 1;             // ขั้นถัดไปที่ต้องทำ
        const last = i === APPT_FLOW.length - 1;
        const time = s.stamp && a[s.stamp] ? _hm(a[s.stamp]) : (i === 0 && a.start ? _hm(a.start) : "");
        return (
          <div key={s.key} style={{ display: "flex", gap: 11 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 22, height: 22, borderRadius: "var(--r-pill)", flexShrink: 0, display: "grid", placeItems: "center",
                background: reached ? "var(--primary)" : isNext ? "var(--surface)" : "var(--surface3)",
                border: "none", boxShadow: isNext ? "inset 0 0 0 2px var(--primary)" : "none", color: "#fff" }}>
                {reached ? <Icon name="check" size={12} color="#fff" sw={2.6} />
                  : isNext ? <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", background: "var(--primary)" }} />
                  : <span style={{ width: 6, height: 6, borderRadius: "var(--r-pill)", background: "var(--text-3)" }} />}
              </span>
              {!last && <span style={{ width: 2, flex: 1, minHeight: 18, background: i < idx ? "var(--primary)" : "var(--border)", margin: "2px 0" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: reached || isNext ? 700 : 600, color: reached || isNext ? "var(--text-1)" : "var(--text-3)" }}>{s.th}</span>
                {time && <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{time}</span>}
              </div>
              {/* ปุ่มเลื่อน — แสดงบน "ขั้นถัดไป" ที่ต้องทำ (กดเพื่อเข้าสู่ขั้นนั้น) */}
              {isNext && (
                s.key === "done"
                  ? (job ? <button onClick={() => onOpenSurvey(job, a)} style={flowCta("var(--primary)")}><Icon name={s.enterIcon} size={14} color="#fff" /> {s.enterCta}</button>
                         : <div style={{ fontSize: 11.5, color: "var(--tint-red-tx2)", marginTop: 6, fontWeight: 600 }}>ไม่พบงานที่ผูกไว้</div>)
                  : <button onClick={() => onStatus(a.id, s.key)} style={flowCta((APPT_STATUS_BY[s.key] || {}).color || "var(--primary)")}><Icon name={s.enterIcon} size={14} color="#fff" /> {s.enterCta}</button>
              )}
            </div>
          </div>
        );
      })}
      {a.status === "done" && job && <button onClick={() => onOpenSurvey(job, a)} style={{ width: "100%", marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}><Icon name="check" size={14} color="var(--primary-dark)" /> ดู / แก้ไขแบบสำรวจ</button>}
    </div>
  );
}

/* ── การ์ดนัดสำรวจ (พร้อม timeline เวิร์กโฟลว์) ── */
/* การ์ดนัดสำรวจ — ภาษาเดียวกับการ์ดงานติดตั้ง (JobTaskCard): ป้ายสถานะ · ชื่อ · วันเวลา · แถบขั้นจุด+เส้น · ที่อยู่ · ปุ่มใหญ่ขั้นถัดไป
   (ผู้ใช้สั่ง 2026-11-18 "ปรับการ์ดให้ดูสวยขึ้น" ให้เข้าชุดกับหน้าปฏิทิน) */
function ApptCard({ a, job, onStatus, onOpenSurvey }) {
  const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
  const idx = APPT_FLOW.findIndex((s) => s.key === a.status);
  const next = idx >= 0 ? APPT_FLOW[idx + 1] : null;
  const sv = job && window.surveyStatus ? window.surveyStatus(job) : null;
  const mapHref = job && job.map ? job.map : (a.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((a.address || "") + " " + (a.province || "")) : null);
  const C = "#0EA5E9";
  const SHORT = { scheduled: "นัดหมาย", transit: "เดินทาง", progress: "ถึงไซต์", done: "สำรวจเสร็จ" };
  const go = (e) => {
    e.stopPropagation();
    if (!next) return;
    if (next.key === "done") { if (job) onOpenSurvey(job, a); }
    else onStatus(a.id, next.key);
  };
  const nextColor = next ? (next.key === "done" ? "var(--primary)" : ((APPT_STATUS_BY[next.key] || {}).color || C)) : C;
  return (
    <div style={{ background: "var(--surface)", borderLeft: "4px solid " + C, borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-sm)", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: "var(--r-pill)", background: C + "16", color: C, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
          <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", background: C }} />นัดสำรวจ
          <span style={{ fontWeight: 600, opacity: .75 }}>· {stt.th}</span>
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap", paddingTop: 3 }}>{a.leadId ? "ลูกค้าใหม่" : "งานในระบบ"}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.jobName || (job && job.name) || "—"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)" }}>
        <Icon name="clock" size={13} color="var(--text-3)" />{a.start ? thDate(_ymdLocal(a.start), true) : "ไม่ระบุวัน"}
        {a.start && <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--mono)" }}>{_hm(a.start)}–{_hm(a.end)}</span>}
      </div>
      {idx >= 0 ? (
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: 2, marginBottom: 2 }}>
          {APPT_FLOW.map((st, i) => {
            const passed = i < idx, current = i === idx, filled = passed || current;
            const isLast = i === APPT_FLOW.length - 1;
            const t = st.stamp && a[st.stamp] ? _hm(a[st.stamp]) : (i === 0 && a.start ? _hm(a.start) : "");
            return (
              <div key={st.key} title={st.th + (t ? " " + t : "")} style={{ flex: isLast ? "0 0 auto" : "1 1 0", display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", alignSelf: "stretch" }}>
                  <span style={{ width: current ? 13 : 9, height: current ? 13 : 9, borderRadius: "var(--r-pill)", flexShrink: 0,
                    background: filled ? C : "var(--surface)", border: current ? "2px solid " + C : (passed ? "none" : "1.5px solid var(--border-strong)"),
                    boxShadow: current ? "0 0 0 3px " + C + "33" : "none", display: "grid", placeItems: "center" }}>
                    {passed && <Icon name="check" size={6} color="#fff" sw={3.5} />}
                  </span>
                  {!isLast && <span style={{ flex: 1, height: 2, margin: "0 2px", background: i < idx ? C : "var(--border)" }} />}
                </div>
                <span style={{ marginTop: 3, fontSize: 8.5, fontWeight: current ? 800 : 500, color: current ? C : (passed ? "var(--text-2)" : "var(--text-3)"), lineHeight: 1.15, whiteSpace: "nowrap" }}>{SHORT[st.key] || st.th}{t && filled ? " " + t : ""}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12, fontWeight: 700, color: stt.color, background: stt.color + "14", borderRadius: 8, padding: "6px 10px" }}>{stt.th}</div>
      )}
      <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={(a.address || "") + (a.province ? ", " + a.province : "")}>{a.address || "-"}{a.province ? ", " + a.province : ""}</span>
        {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, color: "var(--primary-dark)", fontWeight: 700, fontSize: 11.5, textDecoration: "none" }}><Icon name="map" size={12} color="var(--primary-dark)" /> นำทาง</a>}
      </div>
      {a.phone && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} color="var(--text-3)" /><a href={"tel:" + a.phone} style={{ color: "var(--primary-dark)", textDecoration: "none", fontWeight: 600 }}>{a.phone}</a></div>}
      {a.notes && <div style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px" }}>📝 {a.notes}</div>}
      {a.status === "done" && sv && <div style={{ fontSize: 12, color: "var(--primary-dark)", fontWeight: 700 }}>แบบสำรวจ: {sv.label} · {sv.pct}%</div>}
      {next && (next.key !== "done" || job) && (
        <button onClick={go} style={{ marginTop: 4, width: "100%", padding: "11px 12px", borderRadius: "var(--r-chip)", border: "none", background: nextColor, color: "#fff", fontWeight: 800, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "var(--shadow-sm)" }}>
          <Icon name={next.enterIcon} size={15} color="#fff" /> {next.enterCta}
        </button>
      )}
      {next && next.key === "done" && !job && <div style={{ fontSize: 11.5, color: "var(--tint-red-tx2)", fontWeight: 600 }}>ไม่พบงาน/ลูกค้าที่ผูกไว้</div>}
      {a.status === "done" && job && (
        <button onClick={(e) => { e.stopPropagation(); onOpenSurvey(job, a); }} style={{ marginTop: 4, width: "100%", padding: "10px 12px", borderRadius: "var(--r-chip)", border: "none", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Icon name="list" size={14} color="var(--primary-dark)" /> เปิดแบบสำรวจ
        </button>
      )}
    </div>
  );
}

// ป้ายกำกับขั้นงานที่กินหลายวัน (start..end)
const STAGE_KIND_TH = { start: "เริ่ม", end: "กำหนดเสร็จ", mid: "กำลังทำ" };

/* ── การ์ดงานในไปป์ไลน์ (ออกแบบ/ถอดของ/ติดตั้ง ฯลฯ) ที่มอบหมายให้คนนี้ ──
   stages = งานหลายขั้นที่นัดวันเดียวกันของงานนี้ (รวมในการ์ดเดียว)
   onAdvance(job) = กด "เสร็จขั้นนี้" → เลื่อนงานไปขั้นถัดไป (เฉพาะการ์ดที่มีขั้นปัจจุบัน) */
function JobTaskCard({ job, stages, day, dayEnd, onOpen, onAdvance }) {
  const SF = window.SF;
  const list = (stages && stages.length) ? stages : [{ th: job.stage, en: "", color: "#64748B" }];
  const color = list[0].color || "#64748B";
  const mapHref = job.map ? job.map : (job.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((job.address || "") + " " + (job.province || "")) : null);
  const dateStr = day ? (dayEnd && dayEnd !== day ? thDate(day, true) + " – " + thDate(dayEnd, true) : thDate(day, true)) : "ไม่ระบุวัน";
  // ปุ่ม "เสร็จขั้นนี้" — แสดงเฉพาะการ์ดที่มีขั้นปัจจุบันของงาน (กดแล้วเลื่อนไปขั้นถัดไป)
  const curIdx = (SF.STAGES || []).findIndex((s) => s.key === job.stage);
  const curStage = (SF.STAGES || [])[curIdx];
  const nextStage = (SF.STAGES || [])[curIdx + 1];
  const canAdvance = !!(onAdvance && curStage && nextStage && job.stage !== "done" && list.some((s) => s.key === curStage.key));
  // ขั้นทำงานทั่วไป = อัปเดตสถานะได้อิสระ · เฉพาะขั้น "ติดตั้ง" ผูกกับวันนัดติดตั้ง
  const isInstall = !!(canAdvance && curStage.key === "install");
  const _instS = isInstall && SF.installDate ? SF.installDate(job) : "";       // วันเริ่มติดตั้ง
  const _instE = isInstall && SF.installEnd ? SF.installEnd(job) : _instS;      // วันเสร็จติดตั้ง
  const _today = SF.TODAY;
  const advNoDate = isInstall && !_instS;                      // อยู่ขั้นติดตั้งแต่ยังไม่กำหนดวัน → ล็อก
  const advEarly = isInstall && _instS && _today < _instS;     // ยังไม่ถึงวันเริ่มติดตั้ง → ล็อก
  const advOverdue = isInstall && _instE && _today > _instE;   // เลยวันเสร็จติดตั้ง
  const daysLate = advOverdue ? Math.max(1, Math.round((new Date(_today + "T00:00:00") - new Date(_instE + "T00:00:00")) / 86400000)) : 0;
  const doAdvance = (e) => {
    e.stopPropagation();
    askConfirm({ title: "เลื่อนไปขั้น “" + nextStage.th + "” ?", body: "ขั้น “" + curStage.th + "” เสร็จแล้ว",
      ok: "เลื่อนขั้น", danger: false, icon: "check" }).then((ok) => { if (ok) onAdvance(job); });
  };
  return (
    <div role="button" tabIndex={0} onClick={() => onOpen && onOpen(job)} style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid " + color, borderRadius: "var(--r-tile)", boxShadow: "var(--shadow-sm)", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
          {list.map((s) => (
            <span key={(s.key || s.th) + (s.kind || "")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: "var(--r-pill)", background: (s.color || "#64748B") + "16", color: s.color || "#64748B", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", background: s.color || "#64748B" }} />{s.th}
              {s.kind && STAGE_KIND_TH[s.kind] && <span style={{ fontWeight: 600, opacity: .7 }}>· {STAGE_KIND_TH[s.kind]}</span>}
            </span>
          ))}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: "var(--primary-dark)", flexShrink: 0 }}>เปิดงาน <Icon name="chevronRight" size={14} color="var(--primary-dark)" /></span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)" }}>
        <Icon name="clock" size={13} color="var(--text-3)" />{dateStr}{list.length > 1 ? " · " + list.length + " งาน" : ""}
        {typeof job.progressPct === "number" && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{job.progressPct}%</span>}
      </div>
      {/* งานที่ติดตั้งยาวหลายวัน — บอกว่าทำมากี่วันแล้วและเหลืออีกกี่วัน
          ช่วงวันอย่างเดียวไม่พอ คนอ่านต้องนับเองทุกครั้งว่าวันนี้อยู่ตรงไหนของช่วง
          (อ้างผ่าน window ตอนเรนเดอร์ จะได้ไม่ต้องผูกลำดับโหลดกับ views-board) */}
      {window.InstallSpanBar && <window.InstallSpanBar job={job} />}
      {/* แถบสถานะ จุด+เส้น — บอกว่างานเดินมาถึงขั้นไหนแล้ว */}
      {(() => {
        const STAGES = SF.STAGES || [];
        const ci = Math.max(0, STAGES.findIndex((s) => s.key === job.stage));
        const SHORT = { design: "ออกแบบ", takeoff: "ถอดของ", queue: "นัดคิว", install: "ติดตั้ง", done: "เสร็จ" };
        // ใช้ flexbox (ไม่ใช้ grid-template-columns) เพราะ CSS มือถือบังคับ grid ใน .app-content ให้เหลือ 1 คอลัมน์
        return (
          <div style={{ display: "flex", alignItems: "flex-start", marginTop: 2, marginBottom: 2 }}>
            {STAGES.map((s, i) => {
              const passed = i < ci, current = i === ci, filled = passed || current;
              const isLast = i === STAGES.length - 1;
              return (
                <div key={s.key} title={s.th} style={{ flex: isLast ? "0 0 auto" : "1 1 0", display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", alignSelf: "stretch" }}>
                    <span style={{ width: current ? 13 : 9, height: current ? 13 : 9, borderRadius: "var(--r-pill)", flexShrink: 0,
                      background: filled ? s.color : "var(--surface)", border: current ? "2px solid " + s.color : (passed ? "none" : "1.5px solid var(--border-strong)"),
                      boxShadow: current ? "0 0 0 3px " + s.color + "33" : "none", display: "grid", placeItems: "center" }}>
                      {passed && <Icon name="check" size={6} color="#fff" sw={3.5} />}
                    </span>
                    {!isLast && <span style={{ flex: 1, height: 2, margin: "0 2px", background: i < ci ? s.color : "var(--border)" }} />}
                  </div>
                  <span style={{ marginTop: 3, fontSize: 8.5, fontWeight: current ? 800 : 500, color: current ? s.color : (passed ? "var(--text-2)" : "var(--text-3)"), lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{SHORT[s.key] || s.th}</span>
                </div>
              );
            })}
          </div>
        );
      })()}
      <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.address || "-"}{job.province ? ", " + job.province : ""}</span>
        {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, color: "var(--primary-dark)", fontWeight: 700, fontSize: 11.5, textDecoration: "none" }}><Icon name="map" size={12} color="var(--primary-dark)" /> นำทาง</a>}
      </div>
      {canAdvance && ((advNoDate || advEarly) ? (
        <div style={{ marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: "var(--r-chip)", background: "var(--surface3)", color: "var(--text-3)", fontWeight: 700, fontSize: 12.5 }}>
          <Icon name="lock" size={13} color="var(--text-3)" /> {advNoDate ? "ยังไม่กำหนดวันนัดติดตั้ง" : "ติดตั้งวันที่ " + thDate(_instS, true) + (_instE && _instE !== _instS ? "–" + thDate(_instE, true) : "")}
        </div>
      ) : (
        <button onClick={doAdvance} style={{ marginTop: 2, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: "var(--r-chip)", border: "none", background: advOverdue ? "var(--tint-red-tx2)" : (curStage.color || "var(--primary)"), color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
          <Icon name={advOverdue ? "alert" : "check"} size={15} color="#fff" sw={2.5} /> {advOverdue ? "เลยกำหนด " + daysLate + " วัน · " : ""}เสร็จ “{curStage.th}” → {nextStage.th}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   MY SCHEDULE — งานทั้งหมดของฉัน (mobile): นัดสำรวจ + งานในไปป์ไลน์
   รวม "งานที่ต้องทำ" (ออกแบบ/ถอดของ/ติดตั้ง) ที่มอบหมายให้คนนี้ ไว้ที่เดียว
   ============================================================ */
// สร้างรายการ "ตารางงานของฉัน" = นัดสำรวจ (engineerId===คนนี้) + งานติดตั้งที่นัดวันแล้ว (tech===คนนี้, ยังไม่เสร็จ)
// กระจายงานติดตั้งครบทุกวันในช่วงนัดติดตั้ง · เรียงตามเวลา · ใช้ร่วมกับพาเนลหน้าภาพรวม
// allEe = วิศวกรที่ไม่ได้ผูกกับพนักงาน → เห็นนัดสำรวจของวิศวกรทุกคน (ไม่มีงานติดตั้งของตัวเอง)
function buildMySchedItems(appts, jobs, techId, allEe) {
  if (!techId && !allEe) return [];
  const SF = window.SF;
  const out = [];
  const todayY = _ymdLocal(new Date());
  (appts || []).forEach((a) => {
    if ((techId ? !apptEngs(a).includes(techId) : false) || a.status === "canceled") return;
    const day = a.start ? _ymdLocal(a.start) : "";
    /* นัดที่ปิดจบไปแล้ว (สำรวจเสร็จ / เลื่อนไปนัดใหม่) ไม่ใช่งานค้าง — เดิมค้างอยู่ในช่อง
       "เลยกำหนด / ผ่านมา" ตลอดไป ทำให้ตารางงานดูเหมือนมีงานค้างทั้งที่ทำเสร็จแล้ว
       ยังโชว์ในวันของมันเอง เพื่อให้เห็นว่าวันนี้ทำอะไรไปแล้วบ้าง + กดกลับเข้าแบบสำรวจได้ */
    if ((a.status === "done" || a.status === "rescheduled") && day !== todayY) return;
    out.push({ type: "survey", key: "a-" + a.id, a: a, day: day, ts: a.start ? new Date(a.start).getTime() : 0 });
  });
  (jobs || []).forEach((j) => {
    if (!techId || j.tech !== techId || j.stage === "done") return;
    const STAGES = SF.STAGES || [];
    const cur = Math.max(0, STAGES.findIndex((s) => s.key === j.stage));
    const curStage = STAGES[cur] || { key: j.stage, th: j.stage, en: "", color: "#64748B" };
    // แสดงเฉพาะงานที่ "มีวันนัดติดตั้งแล้ว" = วันที่ต้องไปจริง · งานเดียวการ์ดเดียว (ช่วงวันติดตั้ง)
    const s = SF.installDate ? SF.installDate(j) : "";
    if (!s) return;
    const e = SF.installEnd ? SF.installEnd(j) : s;
    out.push({ type: "job", key: "j-" + j.id, job: j, day: s, dayEnd: e, stages: [Object.assign({}, curStage)], ts: new Date(s + "T00:00:00").getTime() });
  });
  return out.sort((x, y) => x.ts - y.ts);
}

function MyScheduleView({ appts, jobs, leads, me, onMenuOpen, onStatus, onOpenSurvey, onOpen, onAdvance }) {
  const techId = me && me.techId;
  const allEe = !techId && !!me && window.hasRole(window.userRoles(me), "ee");
  const jobsById = React.useMemo(() => Object.fromEntries((jobs || []).map((j) => [j.id, j])), [jobs]);
  const leadsById = React.useMemo(() => Object.fromEntries((leads || []).map((l) => [l.id, l])), [leads]);
  // นัดสำรวจอาจผูกกับ "ลูกค้าสำรวจ" (ยังไม่เป็นงาน) — แปลงเป็นรูปงานให้ wizard ใช้ได้เหมือนกัน
  const targetOf = (a) => a.leadId ? leadAsJob(leadsById[a.leadId]) : jobsById[a.projectId];

  // รวมรายการ: นัดสำรวจ + งานติดตั้งที่นัดวันแล้ว (ตรรกะร่วมใน buildMySchedItems)
  const items = React.useMemo(() => buildMySchedItems(appts, jobs, techId, allEe), [appts, jobs, techId, allEe]);

  const todayY = _ymdLocal(new Date());
  const grp = (it) => {
    if (!it.day) return "nodate";
    const end = it.dayEnd || it.day;
    if (end < todayY) return "past";          // จบทั้งช่วงแล้ว
    if (it.day > todayY) return "upcoming";   // ยังไม่เริ่ม
    return "today";                            // กำลังอยู่ในช่วง (คร่อมวันนี้)
  };
  const groups = [
    { key: "past", th: "เลยกำหนด / ผ่านมา", items: items.filter((it) => grp(it) === "past") },
    { key: "today", th: "วันนี้", items: items.filter((it) => grp(it) === "today") },
    { key: "upcoming", th: "กำลังจะถึง", items: items.filter((it) => grp(it) === "upcoming") },
    { key: "nodate", th: "ไม่ระบุวันที่", items: items.filter((it) => grp(it) === "nodate") },
  ].filter((g) => g.items.length);

  const nAppt = items.filter((i) => i.type === "survey").length;
  const nJob = items.filter((i) => i.type === "job").length;
  const sub = !techId && !allEe ? "บัญชียังไม่ผูกกับพนักงาน — แจ้งแอดมิน"
    : (allEe ? "นัดสำรวจของวิศวกรทุกคน · " : "") + (items.length ? [nJob ? nJob + " งานติดตั้งที่นัดแล้ว" : null, nAppt ? nAppt + " นัดสำรวจ" : null].filter(Boolean).join(" · ") : "ยังไม่มีงานที่นัดวันแล้ว");

  /* ปฏิทินของฉัน (ผู้ใช้สั่ง 2026-11-18 "ขอมีปฏิทินด้วย แต่ยังคงมีการ์ดงาน") — ซ้ายปฏิทินเดือน ขวาการ์ดของวันที่เลือก
     งานติดตั้งกินทุกวันในช่วงนัด · นัดสำรวจอยู่วันเดียว */
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [pick, setPick] = React.useState(todayY);
  const [mon, setMon] = React.useState(todayY.slice(0, 7));
  const onDay = (it, d) => it.day && it.day <= d && d <= (it.dayEnd || it.day);
  const dayItems = items.filter((it) => onDay(it, pick));
  const lateItems = pick === todayY ? items.filter((it) => grp(it) === "past") : [];
  const noDate = items.filter((it) => !it.day);
  const itColor = (it) => it.type === "survey" ? "#0EA5E9" : ((it.stages || [])[0] || {}).color || "var(--primary)";
  const itName = (it) => it.type === "survey" ? (it.a.jobName || "สำรวจ") : (it.job.name || it.job.code || "งาน");

  const renderCard = (it) => it.type === "survey"
    ? <ApptCard key={it.key} a={it.a} job={targetOf(it.a)} onStatus={onStatus} onOpenSurvey={onOpenSurvey} />
    : <JobTaskCard key={it.key} job={it.job} stages={it.stages} day={it.day} dayEnd={it.dayEnd} onOpen={onOpen} onAdvance={onAdvance} />;

  return (
    <React.Fragment>
      <SchedHeader icon="list" title="ตารางงาน" onMenuOpen={onMenuOpen} sub={sub} />
      <div className="app-content">
        {!techId && !allEe ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "none", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)" }}>
            บัญชีของคุณยังไม่ได้ผูกกับข้อมูลพนักงาน · กรุณาให้แอดมินตั้งค่าในเมนูจัดการผู้ใช้งาน
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 44, textAlign: "center", color: "var(--text-3)", background: "var(--surface)", border: "none", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ไม่มีงานในความรับผิดชอบตอนนี้</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 372px", gap: 18, alignItems: "start" }}>
            <MyMonthCal mon={mon} setMon={setMon} pick={pick} setPick={setPick} today={todayY} isMobile={isMobile}
              itemsOf={(d) => items.filter((it) => onDay(it, d))} colorOf={itColor} nameOf={itName} />
            <div className="pnl" style={{ display: "flex", flexDirection: "column", gap: 14, position: isMobile ? "static" : "sticky", top: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{+pick.slice(8)} {_TH_MON[+pick.slice(5, 7) - 1]} {+pick.slice(0, 4) + 543}</span>
                  {pick === todayY && <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 7px", borderRadius: "var(--r-pill)" }}>วันนี้</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{dayItems.length} งาน</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, maxHeight: isMobile ? "none" : "66vh", overflowY: isMobile ? "visible" : "auto", margin: "0 -4px", padding: "0 4px" }}>
                {dayItems.length === 0 && <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "26px 0" }}>ยังไม่มีงานในวันนี้</div>}
                {dayItems.map(renderCard)}
                {lateItems.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--tint-red-tx2)", marginTop: 6 }}>เลยกำหนด / ยังค้าง ({lateItems.length})</div>}
                {lateItems.map(renderCard)}
                {noDate.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-3)", marginTop: 6 }}>ไม่ระบุวันที่ ({noDate.length})</div>}
                {noDate.map(renderCard)}
              </div>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

/* ปฏิทินเดือนของ "ตารางงานของฉัน" — แต่ละวันโชว์ชื่องานสั้น ๆ ตามสี (ฟ้า = นัดสำรวจ · สีขั้น = งานติดตั้ง) */
function MyMonthCal({ mon, setMon, pick, setPick, today, isMobile, itemsOf, colorOf, nameOf }) {
  const [y, m] = mon.split("-").map(Number);
  const nDays = new Date(y, m, 0).getDate(), lead = new Date(y, m - 1, 1).getDay();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= nDays; d++) cells.push(mon + "-" + String(d).padStart(2, "0"));
  while (cells.length % 7) cells.push(null);
  const maxShow = isMobile ? 0 : 4;
  let monthCount = 0;
  for (let d = 1; d <= nDays; d++) monthCount += itemsOf(mon + "-" + String(d).padStart(2, "0")).filter((it) => it.type === "survey").length;
  const nb = { width: 34, height: 34, borderRadius: "var(--r-chip)", border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" };
  return (
    <div className="pnl">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{_thMonth(mon)}</h2>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>· {monthCount} นัดสำรวจ</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => setMon(_addMonths(mon, -1))} style={nb}><Icon name="chevronRight" size={17} style={{ transform: "rotate(180deg)" }} /></button>
          <button onClick={() => { setMon(today.slice(0, 7)); setPick(today); }} style={{ ...nb, width: "auto", padding: "0 12px", fontWeight: 700, fontSize: 12.5, fontFamily: "inherit" }}>วันนี้</button>
          <button onClick={() => setMon(_addMonths(mon, 1))} style={nb}><Icon name="chevronRight" size={17} /></button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, padding: "10px 14px", background: "var(--surface2)", borderRadius: "var(--r-chip)", boxShadow: "var(--shadow-sm)", flexWrap: "wrap", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
        <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Icon name="list" size={14} color="var(--primary)" /> งานของฉัน:</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#0EA5E9" }} />นัดสำรวจ</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#84CC16" }} />งานติดตั้ง (สีตามขั้น)</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 4 }}>
        {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((w, i) => (
          <div key={w} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)", paddingBottom: 4 }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={"e" + i} />;
          const list = itemsOf(d);
          const on = d === pick, isToday = d === today, past = d < today;
          return (
            <button key={d} onClick={() => setPick(d)} title="เลือกวันเพื่อดูรายละเอียด"
              style={{ height: isMobile ? 54 : 116, borderRadius: "var(--r-chip)", textAlign: "left", fontFamily: "inherit", cursor: "pointer", border: "none",
                boxShadow: on ? "inset 0 0 0 2px var(--primary)" : isToday ? "inset 0 0 0 1px var(--primary)" : "none",
                background: on || isToday ? "var(--primary-soft)" : "var(--surface2)", padding: isMobile ? 5 : 8,
                display: "flex", flexDirection: "column", gap: 4, overflow: "hidden", minWidth: 0 }}>
              <span style={{ fontSize: 12.5, fontWeight: on || isToday ? 800 : 600, color: on || isToday ? "var(--primary-dark)" : "var(--text-2)" }}>{+d.slice(8)}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, overflow: "hidden", alignSelf: "stretch" }}>
                {list.slice(0, maxShow).map((it) => {
                  const c = colorOf(it);
                  return (
                    <span key={it.key} title={nameOf(it)} style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 6, padding: "2px 5px", overflow: "hidden",
                      background: past ? "var(--surface3)" : (String(c).startsWith("#") ? c + "1f" : "var(--primary-soft)"), opacity: past ? 0.75 : 1 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "var(--r-pill)", flexShrink: 0, background: past ? "var(--text-3)" : c }} />
                      <span style={{ fontSize: 9.5, fontWeight: it.type === "survey" ? 700 : 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: past ? "var(--text-3)" : "var(--text-2)" }}>
                        {it.type === "survey" && it.a && it.a.start ? _hm(it.a.start) + " " : ""}{String(nameOf(it)).replace("คุณ", "")}
                      </span>
                    </span>
                  );
                })}
                {maxShow > 0 && list.length > maxShow && <span style={{ fontSize: 9, color: "var(--text-3)", paddingLeft: 1 }}>+{list.length - maxShow} งาน</span>}
                {isMobile && list.length > 0 && <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>{list.slice(0, 4).map((it) => <span key={it.key} style={{ width: 6, height: 6, borderRadius: 3, background: colorOf(it) }} />)}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { apptEngs, salesOpenLead, useSurveyApptStore, DispatchView, MyScheduleView, SurveyApptModal, ApptCard, JobTaskCard, ApptFlow, apptConflicts, blankAppt, buildMySchedItems, APPT_STATUS, APPT_STATUS_BY, APPT_FLOW,
  useSurveyLeadStore, blankLead, leadAsJob, moveSurveyPhotos, LEAD_STATUS, LEAD_STATUS_BY, SchedHeader });
