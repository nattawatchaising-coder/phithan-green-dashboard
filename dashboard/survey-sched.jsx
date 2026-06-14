/* ============================================================
   PHITHAN GREEN — Survey Scheduling & Dispatch
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
  { key: "done",        th: "สำรวจเสร็จ",            color: "#16A34A", icon: "check" },
  { key: "rescheduled", th: "เลื่อนนัด",             color: "#0EA5E9", icon: "history" },
  { key: "canceled",    th: "ยกเลิก",                color: "#EF4444", icon: "x" },
];
const APPT_STATUS_BY = Object.fromEntries(APPT_STATUS.map((s) => [s.key, s]));

// ── helpers ──
function _ymdLocal(d) { const x = d instanceof Date ? d : new Date(d); const m = String(x.getMonth() + 1).padStart(2, "0"); const da = String(x.getDate()).padStart(2, "0"); return x.getFullYear() + "-" + m + "-" + da; }
function _hm(iso) { if (!iso) return "--:--"; const x = new Date(iso); return String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0"); }
function _addDays(ymd, n) { const x = new Date(ymd + "T00:00:00"); x.setDate(x.getDate() + n); return _ymdLocal(x); }
function _composeISO(ymd, hm) { if (!ymd || !hm) return ""; const d = new Date(ymd + "T" + hm); return isNaN(d.getTime()) ? "" : d.toISOString(); }

// คืน Set ของ appointment id ที่เวลาซ้อนทับกับนัดอื่นของ "วิศวกรคนเดียวกัน"
function apptConflicts(list) {
  const bad = new Set();
  const byEng = {};
  (list || []).forEach((a) => { if (a.status === "canceled" || !a.start || !a.end) return; (byEng[a.engineerId || "_"] = byEng[a.engineerId || "_"] || []).push(a); });
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
    projectId: "", jobName: "", jobCode: "", province: "", address: "", phone: "",
    engineerId: "", start: "", end: "", status: "scheduled", notes: "",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
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
function SchedHeader({ icon, title, sub, onMenuOpen, right }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <button className="hamburger" onClick={onMenuOpen} aria-label="เปิดเมนู"><Icon name="menu" size={18} color="var(--text-2)" /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{sub}</p>
        </div>
        <div className="header-actions">{right}</div>
      </div>
    </header>
  );
}

/* ============================================================
   DISPATCH — ปฏิทินจ่ายงานรายวิศวกร (office) + เตือนซ้อนทับ
   ============================================================ */
function DispatchView({ appts, jobs, techs, store, onMenuOpen, onOpenJob }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [day, setDay] = React.useState(() => _ymdLocal(new Date()));
  const [edit, setEdit] = React.useState(null); // appointment ที่กำลังแก้ (หรือ object ใหม่)

  const dayAppts = React.useMemo(() => (appts || []).filter((a) => a.start && _ymdLocal(a.start) === day), [appts, day]);
  const conflicts = React.useMemo(() => apptConflicts(dayAppts), [dayAppts]);

  // คอลัมน์ = วิศวกรที่มีนัดวันนี้ + ช่อง "ยังไม่มอบหมาย"
  const columns = React.useMemo(() => {
    const engsWith = [...new Set(dayAppts.map((a) => a.engineerId).filter(Boolean))];
    const cols = (techs || []).filter((t) => engsWith.includes(t.id)).map((t) => ({ id: t.id, name: t.name, color: t.color || "#64748B" }));
    if (dayAppts.some((a) => !a.engineerId)) cols.push({ id: "", name: "ยังไม่มอบหมาย", color: "#94A3B8" });
    return cols;
  }, [dayAppts, techs]);

  const summary = APPT_STATUS.map((s) => ({ s, n: dayAppts.filter((a) => a.status === s.key).length })).filter((x) => x.n > 0);

  return (
    <React.Fragment>
      <SchedHeader icon="calendar" title="จัดตารางสำรวจ" onMenuOpen={onMenuOpen}
        sub={<span>{dayAppts.length} นัด · {conflicts.size > 0 ? <span style={{ color: "#EF4444", fontWeight: 700 }}>⚠ ซ้อนทับ {conflicts.size / 2 | 0} คู่</span> : "ไม่มีเวลาซ้อนทับ"}</span>}
        right={<button onClick={() => setEdit(Object.assign(blankAppt(), { start: _composeISO(day, "09:00"), end: _composeISO(day, "11:00") }))} className="btn-add"><Icon name="plus" size={17} color="#fff" sw={2.4} /><span>นัดสำรวจ</span></button>} />
      <div className="app-content">
        {/* ตัวเลือกวัน */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setDay((d) => _addDays(d, -1))} style={navBtn}><Icon name="chevronRight" size={16} color="var(--text-2)" style={{ transform: "scaleX(-1)" }} /></button>
          <button onClick={() => setDay(_ymdLocal(new Date()))} style={{ ...navBtn, width: "auto", padding: "0 14px", fontWeight: 700, fontSize: 13 }}>วันนี้</button>
          <button onClick={() => setDay((d) => _addDays(d, 1))} style={navBtn}><Icon name="chevronRight" size={16} color="var(--text-2)" /></button>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", marginLeft: 4 }}>{thDate(day, true)}</span>
          <span style={{ flex: 1 }} />
          {summary.map(({ s, n }) => <span key={s.key} style={{ fontSize: 11.5, fontWeight: 700, color: s.color, background: s.color + "16", padding: "4px 10px", borderRadius: 99 }}>{s.th} {n}</span>)}
        </div>

        {dayAppts.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: 16 }}>
            ยังไม่มีนัดสำรวจในวันนี้ · กด “นัดสำรวจ” เพื่อจ่ายงานให้วิศวกร
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
            {columns.map((col) => {
              const list = dayAppts.filter((a) => (a.engineerId || "") === col.id).sort((x, y) => new Date(x.start) - new Date(y.start));
              return (
                <div key={col.id || "none"} style={{ flex: "0 0 auto", width: isMobile ? 240 : 270, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: "var(--surface2)", borderRadius: 11, position: "sticky", top: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 99, background: col.color }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{list.length}</span>
                  </div>
                  {list.map((a) => {
                    const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
                    const clash = conflicts.has(a.id);
                    return (
                      <button key={a.id} onClick={() => setEdit(Object.assign({}, a))}
                        style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", padding: 11, borderRadius: 12,
                          background: "var(--surface)", border: "1px solid " + (clash ? "#EF4444" : "var(--border)"), boxShadow: clash ? "0 0 0 3px #EF444418" : "var(--shadow-sm)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{_hm(a.start)}–{_hm(a.end)}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: stt.color, background: stt.color + "16", padding: "2px 8px", borderRadius: 99 }}>{stt.th}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.jobName || "—"}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{a.jobCode}{a.province ? " · " + a.province : ""}</div>
                        {clash && <div style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444", marginTop: 5 }}>⚠ เวลาซ้อนทับกับนัดอื่น</div>}
                        {a.notes && <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 5, background: "var(--surface2)", borderRadius: 7, padding: "5px 8px" }}>📝 {a.notes}</div>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {edit && <SurveyApptModal initial={edit} jobs={jobs} techs={techs} appts={appts}
        onClose={() => setEdit(null)} onSave={(rec) => { store.upsert(rec); setEdit(null); }}
        onDelete={(id) => { if (confirm("ลบนัดสำรวจนี้?")) { store.remove(id); setEdit(null); } }} />}
    </React.Fragment>
  );
}
const navBtn = { width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 };

/* ── Modal สร้าง/แก้ไขนัดสำรวจ ── */
function SurveyApptModal({ initial, jobs, techs, appts, onClose, onSave, onDelete }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const isNew = !(appts || []).some((a) => a.id === initial.id);
  const [f, setF] = React.useState(() => Object.assign({}, initial,
    { _date: initial.start ? _ymdLocal(initial.start) : _ymdLocal(new Date()), _start: initial.start ? _hm(initial.start) : "09:00", _end: initial.end ? _hm(initial.end) : "11:00" }));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const pickJob = (id) => setF((p) => { const j = (jobs || []).find((x) => x.id === id) || {}; return Object.assign({}, p, { projectId: id, jobName: j.name || "", jobCode: j.code || "", province: j.province || "", address: j.address || "", phone: j.phone || "" }); });

  const startISO = _composeISO(f._date, f._start), endISO = _composeISO(f._date, f._end);
  // เตือนเวลาซ้อนทับกับนัดอื่นของวิศวกรคนเดียวกัน (ไม่นับนัดนี้เอง)
  const clash = React.useMemo(() => {
    if (!f.engineerId || !startISO || !endISO) return null;
    return (appts || []).find((a) => a.id !== f.id && a.engineerId === f.engineerId && a.status !== "canceled" && a.start && a.end &&
      new Date(startISO).getTime() < new Date(a.end).getTime() && new Date(a.start).getTime() < new Date(endISO).getTime());
  }, [f.engineerId, startISO, endISO, appts]);

  const submit = () => {
    if (!f.projectId) { alert("กรุณาเลือกงาน/โครงการ"); return; }
    if (!startISO || !endISO) { alert("กรุณาระบุวันและเวลา"); return; }
    if (new Date(endISO) <= new Date(startISO)) { alert("เวลาสิ้นสุดต้องหลังเวลาเริ่ม"); return; }
    const out = Object.assign({}, f, { start: startISO, end: endISO });
    delete out._date; delete out._start; delete out._end;
    onSave(out);
  };

  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 118, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(520px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>{isNew ? "นัดสำรวจใหม่" : "แก้ไขนัดสำรวจ"}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>งาน / โครงการ *</label>
            <Dropdown value={f.projectId} onChange={pickJob} placeholder="— เลือกงาน —"
              options={(jobs || []).map((j) => ({ value: j.id, label: j.name + " · " + j.code + (j.province ? " · " + j.province : "") }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>วิศวกรสำรวจ</label>
            <Dropdown value={f.engineerId} onChange={(v) => set("engineerId", v)} placeholder="— ยังไม่มอบหมาย —"
              options={[{ value: "", label: "— ยังไม่มอบหมาย —" }].concat((techs || []).map((t) => ({ value: t.id, label: t.name + (t.nick ? " (" + t.nick + ")" : "") })))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>วันที่</label>
            <input type="date" value={f._date} onChange={(e) => set("_date", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เวลาเริ่ม</label><input type="time" value={f._start} onChange={(e) => set("_start", e.target.value)} style={inputStyle} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เวลาสิ้นสุด</label><input type="time" value={f._end} onChange={(e) => set("_end", e.target.value)} style={inputStyle} /></div>
          </div>
          {clash && <div style={{ fontSize: 12, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 9, padding: "9px 11px", fontWeight: 600 }}>⚠ วิศวกรคนนี้มีนัดซ้อนทับช่วงเวลานี้ ({_hm(clash.start)}–{_hm(clash.end)} · {clash.jobName})</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>สถานะ</label>
            <Dropdown value={f.status} onChange={(v) => set("status", v)} options={APPT_STATUS.map((s) => ({ value: s.key, label: s.th }))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={lbl}>หมายเหตุการจ่ายงาน</label>
            <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder='เช่น "ลูกค้าสะดวกช่วงบ่ายเท่านั้น"' style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} />
          </div>
        </div>
        <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, alignItems: "center" }}>
          {!isNew && <button onClick={() => onDelete(f.id)} style={{ flex: "0 0 auto", width: 44, height: 44, borderRadius: 11, border: "1px solid #FECACA", background: "#FEF2F2", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name="x" size={16} /></button>}
          <button onClick={onClose} style={{ flex: "0 0 auto", padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>บันทึกนัดหมาย</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MY SCHEDULE — ตารางงานของวิศวกรสำรวจ (mobile) + ปุ่มเลื่อนสถานะ
   ============================================================ */
function MyScheduleView({ appts, jobs, me, onMenuOpen, onStatus, onOpenSurvey }) {
  const techId = me && me.techId;
  const jobsById = React.useMemo(() => Object.fromEntries((jobs || []).map((j) => [j.id, j])), [jobs]);
  const mine = React.useMemo(() => (appts || []).filter((a) => techId && a.engineerId === techId && a.status !== "canceled")
    .sort((x, y) => new Date(x.start) - new Date(y.start)), [appts, techId]);
  const today = _ymdLocal(new Date());
  const groups = [
    { key: "today", th: "วันนี้", items: mine.filter((a) => _ymdLocal(a.start) === today) },
    { key: "upcoming", th: "กำลังจะถึง", items: mine.filter((a) => _ymdLocal(a.start) > today) },
    { key: "past", th: "ผ่านมาแล้ว", items: mine.filter((a) => _ymdLocal(a.start) < today) },
  ].filter((g) => g.items.length);

  return (
    <React.Fragment>
      <SchedHeader icon="list" title="ตารางงานของฉัน" onMenuOpen={onMenuOpen}
        sub={techId ? mine.length + " นัดสำรวจที่ได้รับมอบหมาย" : "บัญชียังไม่ผูกกับวิศวกร — แจ้งแอดมิน"} />
      <div className="app-content">
        {!techId ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
            บัญชีของคุณยังไม่ได้ผูกกับข้อมูลวิศวกร · กรุณาให้แอดมินตั้งค่าในเมนูจัดการผู้ใช้งาน
          </div>
        ) : mine.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
            ยังไม่มีนัดสำรวจที่ได้รับมอบหมาย 🎉
          </div>
        ) : groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 9 }}>{g.th} ({g.items.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {g.items.map((a) => {
                const job = jobsById[a.projectId];
                const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
                const sv = job && window.surveyStatus ? window.surveyStatus(job) : null;
                const mapHref = job && job.map ? job.map : (a.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((a.address || "") + " " + (a.province || "")) : null);
                return (
                  <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
                    <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>
                          <Icon name="clock" size={14} color="var(--text-3)" />{thDate(_ymdLocal(a.start), true)} · {_hm(a.start)}–{_hm(a.end)}
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: stt.color, background: stt.color + "16", padding: "3px 9px", borderRadius: 99 }}>{stt.th}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>{a.jobName || (job && job.name) || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{a.address || "-"}{a.province ? ", " + a.province : ""}</span>
                      </div>
                      {a.phone && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} color="var(--text-3)" /><a href={"tel:" + a.phone} style={{ color: "var(--primary-dark)", textDecoration: "none", fontWeight: 600 }}>{a.phone}</a></div>}
                      {a.notes && <div style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 8, padding: "7px 10px" }}>📝 {a.notes}</div>}
                      {a.status === "done" && sv && <div style={{ fontSize: 12, color: "var(--primary-dark)", fontWeight: 700 }}>แบบสำรวจ: {sv.label} · {sv.pct}%</div>}
                    </div>
                    {/* แถบปุ่มเลื่อนสถานะ */}
                    <div style={{ display: "flex", gap: 8, padding: 12, paddingTop: 0 }}>
                      {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, textDecoration: "none" }}><Icon name="map" size={15} color="var(--text-2)" /> นำทาง</a>}
                      {a.status === "scheduled" && <button onClick={() => onStatus(a.id, "transit")} style={primaryBtn("#F59E0B")}><Icon name="map" size={15} color="#fff" /> เริ่มเดินทาง</button>}
                      {a.status === "transit" && <button onClick={() => onStatus(a.id, "progress")} style={primaryBtn("#8B5CF6")}><Icon name="pin" size={15} color="#fff" /> เช็คอิน · ถึงไซต์</button>}
                      {a.status === "progress" && job && <button onClick={() => onOpenSurvey(job, a)} style={primaryBtn("var(--primary)")}><Icon name="list" size={15} color="#fff" /> เปิดแบบสำรวจ</button>}
                      {a.status === "done" && job && <button onClick={() => onOpenSurvey(job, a)} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}><Icon name="check" size={15} color="var(--primary-dark)" /> ดู / แก้ไขแบบสำรวจ</button>}
                      {a.status === "progress" && !job && <span style={{ flex: 1, fontSize: 12, color: "#EF4444", alignSelf: "center", textAlign: "center" }}>ไม่พบงานที่ผูกไว้</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
function primaryBtn(bg) { return { flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px", borderRadius: 11, border: "none", background: bg, color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }; }

Object.assign(window, { useSurveyApptStore, DispatchView, MyScheduleView, SurveyApptModal, apptConflicts, blankAppt, APPT_STATUS, APPT_STATUS_BY });
