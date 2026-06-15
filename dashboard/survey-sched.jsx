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

  const [mode, setMode] = React.useState("day"); // day = บอร์ดรายวัน, all = ทุกนัด
  const allConflicts = React.useMemo(() => apptConflicts(appts || []), [appts]);
  const techById = React.useMemo(() => Object.fromEntries((techs || []).map((t) => [t.id, t])), [techs]);
  const scopeAppts = mode === "day" ? dayAppts : (appts || []);
  const summary = APPT_STATUS.map((s) => ({ s, n: scopeAppts.filter((a) => a.status === s.key).length })).filter((x) => x.n > 0);
  const conflictScope = mode === "day" ? conflicts : allConflicts;
  // โหมด "ทั้งหมด" — จัดกลุ่มทุกนัดตามวันที่ เรียงเวลา
  const allGroups = React.useMemo(() => {
    const m = {};
    (appts || []).forEach((a) => { const k = a.start ? _ymdLocal(a.start) : "ไม่ระบุวัน"; (m[k] = m[k] || []).push(a); });
    return Object.keys(m).sort().map((k) => ({ day: k, items: m[k].slice().sort((x, y) => new Date(x.start || 0) - new Date(y.start || 0)) }));
  }, [appts]);

  return (
    <React.Fragment>
      <SchedHeader icon="calendar" title="จัดตารางสำรวจ" onMenuOpen={onMenuOpen}
        sub={<span>{scopeAppts.length} นัด{mode === "day" ? " (วันนี้)" : " (ทั้งหมด)"} · {conflictScope.size > 0 ? <span style={{ color: "#EF4444", fontWeight: 700 }}>⚠ ซ้อนทับ {conflictScope.size / 2 | 0} คู่</span> : "ไม่มีเวลาซ้อนทับ"}</span>}
        right={<button onClick={() => setEdit(Object.assign(blankAppt(), { start: _composeISO(mode === "day" ? day : _ymdLocal(new Date()), "09:00"), end: _composeISO(mode === "day" ? day : _ymdLocal(new Date()), "11:00") }))} className="btn-add"><Icon name="plus" size={17} color="#fff" sw={2.4} /><span>นัดสำรวจ</span></button>} />
      <div className="app-content">
        {/* สลับมุมมอง รายวัน / ทั้งหมด */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <Segmented value={mode} onChange={setMode} options={[{ value: "day", label: "รายวัน", icon: "calendar" }, { value: "all", label: "ทั้งหมด", icon: "list" }]} />
          {mode === "day" && <React.Fragment>
            <button onClick={() => setDay((d) => _addDays(d, -1))} style={navBtn}><Icon name="chevronRight" size={16} color="var(--text-2)" style={{ transform: "scaleX(-1)" }} /></button>
            <button onClick={() => setDay(_ymdLocal(new Date()))} style={{ ...navBtn, width: "auto", padding: "0 14px", fontWeight: 700, fontSize: 13 }}>วันนี้</button>
            <button onClick={() => setDay((d) => _addDays(d, 1))} style={navBtn}><Icon name="chevronRight" size={16} color="var(--text-2)" /></button>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", marginLeft: 4 }}>{thDate(day, true)}</span>
          </React.Fragment>}
          <span style={{ flex: 1 }} />
          {summary.map(({ s, n }) => <span key={s.key} style={{ fontSize: 11.5, fontWeight: 700, color: s.color, background: s.color + "16", padding: "4px 10px", borderRadius: 99 }}>{s.th} {n}</span>)}
        </div>

        {mode === "all" ? (
          allGroups.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: 16 }}>
              ยังไม่มีนัดสำรวจในระบบ · กด “นัดสำรวจ” เพื่อจ่ายงานให้วิศวกร
            </div>
          ) : allGroups.map((g) => (
            <div key={g.day} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 9 }}>{g.day === "ไม่ระบุวัน" ? g.day : thDate(g.day, true)} ({g.items.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {g.items.map((a) => {
                  const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
                  const t = techById[a.engineerId];
                  const clash = allConflicts.has(a.id);
                  return (
                    <button key={a.id} onClick={() => setEdit(Object.assign({}, a))}
                      style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", padding: 13, borderRadius: 13,
                        background: "var(--surface)", border: "1px solid " + (clash ? "#EF4444" : "var(--border)"), boxShadow: clash ? "0 0 0 3px #EF444418" : "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{_hm(a.start)}–{_hm(a.end)}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: stt.color, background: stt.color + "16", padding: "2px 8px", borderRadius: 99 }}>{stt.th}</span>
                          <Icon name="chevronRight" size={14} color="var(--text-3)" />
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{a.jobName || "—"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{a.jobCode}{a.province ? " · " + a.province : ""}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)", marginTop: 1 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: (t && t.color) || "#94A3B8", flexShrink: 0 }} />
                        {t ? t.name : "ยังไม่มอบหมาย"}
                      </div>
                      {clash && <div style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444" }}>⚠ เวลาซ้อนทับกับนัดอื่นของวิศวกรคนนี้</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : dayAppts.length === 0 ? (
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
              <span style={{ width: 22, height: 22, borderRadius: 99, flexShrink: 0, display: "grid", placeItems: "center",
                background: reached ? "var(--primary)" : isNext ? "var(--surface)" : "var(--surface3)",
                border: isNext ? "2px solid var(--primary)" : "2px solid transparent", color: "#fff" }}>
                {reached ? <Icon name="check" size={12} color="#fff" sw={2.6} />
                  : isNext ? <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--primary)" }} />
                  : <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--text-3)" }} />}
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
                         : <div style={{ fontSize: 11.5, color: "#EF4444", marginTop: 6, fontWeight: 600 }}>ไม่พบงานที่ผูกไว้</div>)
                  : <button onClick={() => onStatus(a.id, s.key)} style={flowCta((APPT_STATUS_BY[s.key] || {}).color || "var(--primary)")}><Icon name={s.enterIcon} size={14} color="#fff" /> {s.enterCta}</button>
              )}
            </div>
          </div>
        );
      })}
      {a.status === "done" && job && <button onClick={() => onOpenSurvey(job, a)} style={{ width: "100%", marginTop: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--primary-dark)", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}><Icon name="check" size={14} color="var(--primary-dark)" /> ดู / แก้ไขแบบสำรวจ</button>}
    </div>
  );
}

/* ── การ์ดนัดสำรวจ (พร้อม timeline เวิร์กโฟลว์) ── */
function ApptCard({ a, job, onStatus, onOpenSurvey }) {
  const stt = APPT_STATUS_BY[a.status] || APPT_STATUS_BY.scheduled;
  const idx = APPT_FLOW.findIndex((s) => s.key === a.status);
  const sv = job && window.surveyStatus ? window.surveyStatus(job) : null;
  const mapHref = job && job.map ? job.map : (a.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((a.address || "") + " " + (a.province || "")) : null);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid " + stt.color, borderRadius: 14, boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--mono)", fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>
            <Icon name="clock" size={14} color="var(--text-3)" />{thDate(_ymdLocal(a.start), true)} · {_hm(a.start)}–{_hm(a.end)}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#0EA5E9", background: "#0EA5E916", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>สำรวจหน้างาน</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>{a.jobName || (job && job.name) || "—"}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "flex-start", gap: 6 }}>
          <Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ flex: 1, minWidth: 0 }}>{a.address || "-"}{a.province ? ", " + a.province : ""}</span>
          {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, color: "var(--primary-dark)", fontWeight: 700, fontSize: 11.5, textDecoration: "none" }}><Icon name="map" size={12} color="var(--primary-dark)" /> นำทาง</a>}
        </div>
        {a.phone && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} color="var(--text-3)" /><a href={"tel:" + a.phone} style={{ color: "var(--primary-dark)", textDecoration: "none", fontWeight: 600 }}>{a.phone}</a></div>}
        {a.notes && <div style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 8, padding: "7px 10px" }}>📝 {a.notes}</div>}
        {a.status === "done" && sv && <div style={{ fontSize: 12, color: "var(--primary-dark)", fontWeight: 700 }}>แบบสำรวจ: {sv.label} · {sv.pct}%</div>}
      </div>
      <div style={{ borderTop: "1px solid var(--border)", padding: "13px 14px", background: "var(--surface2)" }}>
        {idx >= 0
          ? <ApptFlow a={a} job={job} onStatus={onStatus} onOpenSurvey={onOpenSurvey} />
          : <div style={{ fontSize: 12.5, fontWeight: 700, color: stt.color }}>{stt.th}</div>}
      </div>
    </div>
  );
}

// ป้ายกำกับขั้นงานที่กินหลายวัน (start..end)
const STAGE_KIND_TH = { start: "เริ่ม", end: "กำหนดเสร็จ", mid: "กำลังทำ" };

/* ── การ์ดงานในไปป์ไลน์ (ออกแบบ/ถอดของ/ติดตั้ง ฯลฯ) ที่มอบหมายให้คนนี้ ──
   stages = งานหลายขั้นที่นัดวันเดียวกันของงานนี้ (รวมในการ์ดเดียว)
   onAdvance(job) = กด "เสร็จขั้นนี้" → เลื่อนงานไปขั้นถัดไป (เฉพาะการ์ดที่มีขั้นปัจจุบัน) */
function JobTaskCard({ job, stages, day, onOpen, onAdvance }) {
  const SF = window.SF;
  const list = (stages && stages.length) ? stages : [{ th: job.stage, en: "", color: "#64748B" }];
  const color = list[0].color || "#64748B";
  const mapHref = job.map ? job.map : (job.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent((job.address || "") + " " + (job.province || "")) : null);
  const dateStr = day ? thDate(day, true) : "ไม่ระบุวัน";
  // ปุ่ม "เสร็จขั้นนี้" — แสดงเฉพาะการ์ดที่มีขั้นปัจจุบันของงาน (กดแล้วเลื่อนไปขั้นถัดไป)
  const curIdx = (SF.STAGES || []).findIndex((s) => s.key === job.stage);
  const curStage = (SF.STAGES || [])[curIdx];
  const nextStage = (SF.STAGES || [])[curIdx + 1];
  const canAdvance = !!(onAdvance && curStage && nextStage && job.stage !== "done" && list.some((s) => s.key === curStage.key));
  // ผูกการกดเสร็จกับวันที่กำหนดของขั้นปัจจุบัน — กันกดข้ามก่อนถึงวันเริ่ม
  let _cs = "", _ce = "";
  if (canAdvance) {
    const v = job.stageDates && job.stageDates[curStage.key];
    if (v) {
      if (typeof v === "object") { _cs = (v.start || v.end || "").slice(0, 10); _ce = (v.end || v.start || "").slice(0, 10); }
      else { _cs = String(v).slice(0, 10); _ce = _cs; }
    }
    if (!_ce) _ce = _cs;
  }
  const _today = window.SF.TODAY;
  const advEarly = canAdvance && _cs && _today < _cs;          // ยังไม่ถึงวันเริ่ม → ล็อก
  const advOverdue = canAdvance && _ce && _today > _ce;        // เลยกำหนดเสร็จ
  const daysLate = advOverdue ? Math.max(1, Math.round((new Date(_today + "T00:00:00") - new Date(_ce + "T00:00:00")) / 86400000)) : 0;
  const doAdvance = (e) => { e.stopPropagation(); if (confirm("ขั้น \"" + curStage.th + "\" เสร็จแล้ว เลื่อนไป \"" + nextStage.th + "\" ?")) onAdvance(job); };
  return (
    <div role="button" tabIndex={0} onClick={() => onOpen && onOpen(job)} style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid " + color, borderRadius: 14, boxShadow: "var(--shadow-sm)", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
          {list.map((s) => (
            <span key={(s.key || s.th) + (s.kind || "")} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 99, background: (s.color || "#64748B") + "16", color: s.color || "#64748B", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: s.color || "#64748B" }} />{s.th}
              {s.kind && STAGE_KIND_TH[s.kind] && <span style={{ fontWeight: 600, opacity: .7 }}>· {STAGE_KIND_TH[s.kind]}</span>}
            </span>
          ))}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11.5, fontWeight: 700, color: "var(--primary-dark)", flexShrink: 0 }}>เปิดงาน <Icon name="chevronRight" size={14} color="var(--primary-dark)" /></span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>{job.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)" }}>
        <Icon name="clock" size={13} color="var(--text-3)" />{dateStr}{list.length > 1 ? " · " + list.length + " งาน" : ""}
        {typeof job.progressPct === "number" && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{job.progressPct}%</span>}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "flex-start", gap: 6 }}>
        <Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ flex: 1, minWidth: 0 }}>{job.address || "-"}{job.province ? ", " + job.province : ""}</span>
        {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, color: "var(--primary-dark)", fontWeight: 700, fontSize: 11.5, textDecoration: "none" }}><Icon name="map" size={12} color="var(--primary-dark)" /> นำทาง</a>}
      </div>
      {canAdvance && (advEarly ? (
        <div style={{ marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 10, background: "var(--surface3)", color: "var(--text-3)", fontWeight: 700, fontSize: 12.5 }}>
          <Icon name="lock" size={13} color="var(--text-3)" /> เริ่ม “{curStage.th}” ได้ {thDate(_cs, true)}
        </div>
      ) : (
        <button onClick={doAdvance} style={{ marginTop: 2, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, border: "none", background: advOverdue ? "#DC2626" : (curStage.color || "var(--primary)"), color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
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
function MyScheduleView({ appts, jobs, me, onMenuOpen, onStatus, onOpenSurvey, onOpen, onAdvance }) {
  const techId = me && me.techId;
  const SF = window.SF;
  const jobsById = React.useMemo(() => Object.fromEntries((jobs || []).map((j) => [j.id, j])), [jobs]);

  // รวมรายการ: นัดสำรวจ (engineerId===คนนี้) + งานในไปป์ไลน์ (tech===คนนี้, ยังไม่เสร็จ)
  const items = React.useMemo(() => {
    if (!techId) return [];
    const out = [];
    (appts || []).forEach((a) => {
      if (a.engineerId === techId && a.status !== "canceled")
        out.push({ type: "survey", key: "a-" + a.id, a: a, day: a.start ? _ymdLocal(a.start) : "", ts: a.start ? new Date(a.start).getTime() : 0 });
    });
    (jobs || []).forEach((j) => {
      if (j.tech !== techId || j.stage === "done") return;
      const STAGES = SF.STAGES || [];
      const cur = Math.max(0, STAGES.findIndex((s) => s.key === j.stage));
      const curStage = STAGES[cur] || { key: j.stage, th: j.stage, en: "", color: "#64748B" };
      // กระจายแต่ละขั้น (ที่ยังไม่ผ่าน) ลงทุกวันในช่วง start..end + ติดป้าย kind
      const byDay = {};
      STAGES.forEach((s, i) => {
        if (i < cur) return;                                  // ขั้นที่ทำผ่านแล้ว ไม่โชว์
        const v = j.stageDates && j.stageDates[s.key];
        if (!v) return;
        let start = ((typeof v === "object" ? (v.start || v.end || "") : v) || "").slice(0, 10);
        let end = ((typeof v === "object" ? (v.end || v.start || "") : v) || "").slice(0, 10);
        if (!start) return;
        if (!end || end < start) end = start;
        let day = start, g = 0;
        while (g < 60) {
          const kind = start === end ? "single" : (day === start ? "start" : (day === end ? "end" : "mid"));
          (byDay[day] = byDay[day] || []).push(Object.assign({}, s, { kind: kind }));
          if (day === end) break;
          day = _addDays(day, 1); g++;
        }
      });
      const days = Object.keys(byDay);
      if (!days.length) {                                     // ไม่มีขั้นที่ลงวันไว้ → การ์ดเดียวตามกำหนดส่ง
        const anchor = (j.startDate || j.deadline || "").slice(0, 10);
        out.push({ type: "job", key: "j-" + j.id + "-x", job: j, day: anchor, stages: [Object.assign({}, curStage, { kind: "single" })], ts: anchor ? new Date(anchor + "T00:00:00").getTime() : 0 });
        return;
      }
      days.forEach((day) => {
        out.push({ type: "job", key: "j-" + j.id + "-" + day, job: j, day: day, stages: byDay[day], ts: new Date(day + "T00:00:00").getTime() });
      });
    });
    return out.sort((x, y) => x.ts - y.ts);
  }, [appts, jobs, techId]);

  const todayY = _ymdLocal(new Date());
  const groups = [
    { key: "past", th: "เลยกำหนด / ผ่านมา", items: items.filter((it) => it.day && it.day < todayY) },
    { key: "today", th: "วันนี้", items: items.filter((it) => it.day === todayY) },
    { key: "upcoming", th: "กำลังจะถึง", items: items.filter((it) => it.day && it.day > todayY) },
    { key: "nodate", th: "ไม่ระบุวันที่", items: items.filter((it) => !it.day) },
  ].filter((g) => g.items.length);

  const nAppt = items.filter((i) => i.type === "survey").length;
  const nJob = items.filter((i) => i.type === "job").length;
  const sub = !techId ? "บัญชียังไม่ผูกกับพนักงาน — แจ้งแอดมิน"
    : (items.length ? [nJob ? nJob + " งานในไปป์ไลน์" : null, nAppt ? nAppt + " นัดสำรวจ" : null].filter(Boolean).join(" · ") : "ไม่มีงานในความรับผิดชอบ");

  const renderCard = (it) => it.type === "survey"
    ? <ApptCard key={it.key} a={it.a} job={jobsById[it.a.projectId]} onStatus={onStatus} onOpenSurvey={onOpenSurvey} />
    : <JobTaskCard key={it.key} job={it.job} stages={it.stages} day={it.day} onOpen={onOpen} onAdvance={onAdvance} />;

  return (
    <React.Fragment>
      <SchedHeader icon="list" title="ตารางงานของฉัน" onMenuOpen={onMenuOpen} sub={sub} />
      <div className="app-content">
        {!techId ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
            บัญชีของคุณยังไม่ได้ผูกกับข้อมูลพนักงาน · กรุณาให้แอดมินตั้งค่าในเมนูจัดการผู้ใช้งาน
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: 44, textAlign: "center", color: "var(--text-3)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ไม่มีงานในความรับผิดชอบตอนนี้</div>
          </div>
        ) : groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 9 }}>{g.th} ({g.items.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {g.items.map(renderCard)}
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { useSurveyApptStore, DispatchView, MyScheduleView, SurveyApptModal, ApptCard, JobTaskCard, ApptFlow, apptConflicts, blankAppt, APPT_STATUS, APPT_STATUS_BY, APPT_FLOW });
