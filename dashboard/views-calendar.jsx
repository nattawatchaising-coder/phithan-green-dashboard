/* ============================================================
   SolarFlow — Calendar (appointments) + Map (job locations)
   ============================================================ */

/* responsive helper — matchMedia-based so it re-renders on breakpoint change
   even when resize events are suppressed (preview/test environments) */
function useMobileCal(bp = 860) {
  const mq = React.useMemo(() => window.matchMedia(`(max-width: ${bp}px)`), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => {
    const fn = (e) => setM(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [mq]);
  return m;
}

const TH_MONTH_FULL = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

/* สลับมุมมอง Agenda ↔ เดือน */
function CalToggle({ calView, setCalView }) {
  const opt = (key, label, icon) => (
    <button onClick={() => setCalView(key)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 99,
      border: "1px solid " + (calView === key ? "var(--primary)" : "var(--border-strong)"),
      background: calView === key ? "var(--primary-soft)" : "var(--surface)", color: calView === key ? "var(--primary-dark)" : "var(--text-2)",
      fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      <Icon name={icon} size={14} color={calView === key ? "var(--primary-dark)" : "var(--text-3)"} />{label}
    </button>
  );
  return <div style={{ display: "flex", gap: 7 }}>{opt("agenda", "วันนี้", "list")}{opt("month", "เดือน", "calendar")}</div>;
}

/* helper: บวกวันแบบ string YYYY-MM-DD */
function addDaysKey(k, n) { const d = new Date(k + "T00:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

/* การ์ดรายการใน Agenda */
function AgendaItem({ job, color, danger, title, sub, onOpen }) {
  return (
    <button onClick={() => onOpen(job)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", width: "100%", textAlign: "left",
      background: danger ? "#FEF2F2" : "var(--surface)", border: "1px solid " + (danger ? "#FECACA" : "var(--border)"), borderRadius: 13, cursor: "pointer", fontFamily: "inherit" }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: color, color: "#fff" }}>
        <Icon name={danger ? "alert" : "wrench"} size={18} color="#fff" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</span>
        <span style={{ display: "block", fontSize: 12, color: danger ? "#B91C1C" : "var(--text-2)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        {sub && <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{sub}</span>}
      </span>
      <Icon name="chevronRight" size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
    </button>
  );
}

/* มุมมอง Agenda — เลยกำหนด / วันนี้ / 7 วันข้างหน้า */
function AgendaView({ jobs, onOpen, calView, setCalView }) {
  const SF = window.SF;
  const todayKey = SF.TODAY;
  const in7 = addDaysKey(todayKey, 7);
  const techName = (id) => { const t = (SF.TECH_BY_ID || {})[id]; return t ? (t.name || t.nick || "") : ""; };
  const KIND_TH = { start: "เริ่ม", progress: "กำลังดำเนินการ", end: "ส่งมอบ/เสร็จ", both: "เริ่ม–เสร็จ" };
  const stageLabel = (s, kind) => KIND_TH[kind] + " · " + s.th;

  const overdue = [];
  jobs.forEach((j) => (j.lateStages || []).forEach((ls) => overdue.push({ job: j, stage: ls })));
  overdue.sort((a, b) => b.stage.daysLate - a.stage.daysLate);

  // วันนี้ = ขั้นที่ today อยู่ในช่วง [เริ่ม..เสร็จ] (งานหลายวันจะขึ้นทุกวันที่กำลังทำ)
  const todayEv = [];
  // 7 วันข้างหน้า = event เริ่ม/เสร็จ ที่จะถึง
  const upcoming = [];
  jobs.forEach((j) => {
    const sd = j.stageDates || {};
    SF.STAGES.forEach((s) => {
      const v = sd[s.key]; if (!v) return;
      const st = typeof v === "object" ? (v.start || "") : "";
      const en = typeof v === "object" ? (v.end || "") : v;
      const s0 = st || en, e0 = en || st;
      const sameDay = st && en && st === en; // เริ่ม–เสร็จ วันเดียวกัน → รวมเป็นรายการเดียว
      if (s0 && todayKey >= s0 && todayKey <= e0) {
        let kind;
        if (sameDay) kind = "both";
        else if (s0 !== e0 && todayKey > s0 && todayKey < e0) kind = "progress";
        else if (todayKey === e0 && en) kind = "end";
        else kind = "start";
        todayEv.push({ job: j, stage: s, kind });
      }
      if (sameDay) {
        if (st > todayKey && st <= in7) upcoming.push({ job: j, stage: s, kind: "both", date: st });
      } else {
        if (st && st > todayKey && st <= in7) upcoming.push({ job: j, stage: s, kind: "start", date: st });
        if (en && en > todayKey && en <= in7) upcoming.push({ job: j, stage: s, kind: "end", date: en });
      }
    });
  });
  todayEv.sort((a, b) => a.job.name.localeCompare(b.job.name));
  upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.job.name.localeCompare(b.job.name));
  const empty = overdue.length === 0 && todayEv.length === 0 && upcoming.length === 0;

  const SectionHead = ({ icon, color, label, count }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 2px 2px" }}>
      <Icon name={icon} size={15} color={color} />
      <span style={{ fontSize: 13, fontWeight: 800, color: color }}>{label}</span>
      <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>({count})</span>
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>งานที่ต้องทำ</h2>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>วันนี้ {thDate(todayKey, true)}</span>
        </div>
        <CalToggle calView={calView} setCalView={setCalView} />
      </div>

      {empty && (
        <div style={{ padding: "44px 0", textAlign: "center", color: "var(--text-3)" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🎉</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>วันนี้ไม่มีงานค้าง / ตามกำหนดทุกอย่าง</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {overdue.length > 0 && <SectionHead icon="alert" color="#EF4444" label="เลยกำหนด" count={overdue.length} />}
        {overdue.map((o, i) => (
          <AgendaItem key={"od" + i} job={o.job} color="#EF4444" danger title={'ขั้น "' + o.stage.th + '" เลยกำหนด ' + o.stage.daysLate + " วัน"}
            sub={"กำหนดเสร็จ " + thDate(o.stage.end, true) + (techName(o.job.tech) ? " · ช่าง " + techName(o.job.tech) : "")} onOpen={onOpen} />
        ))}

        {todayEv.length > 0 && <SectionHead icon="pin" color="var(--primary-dark)" label="วันนี้" count={todayEv.length} />}
        {todayEv.map((e, i) => (
          <AgendaItem key={"td" + i} job={e.job} color={e.stage.color} title={stageLabel(e.stage, e.kind)}
            sub={(techName(e.job.tech) ? "ช่าง " + techName(e.job.tech) + " · " : "") + e.job.province + " · " + e.job.kw + " kW"} onOpen={onOpen} />
        ))}

        {upcoming.length > 0 && <SectionHead icon="calendar" color="var(--text-2)" label="7 วันข้างหน้า" count={upcoming.length} />}
        {upcoming.map((e, i) => (
          <AgendaItem key={"up" + i} job={e.job} color={e.stage.color} title={stageLabel(e.stage, e.kind)}
            sub={thDate(e.date, true) + (techName(e.job.tech) ? " · ช่าง " + techName(e.job.tech) : "")} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function CalendarView({ jobs, onOpen, onAddOnDate, canAdd }) {
  const isMobile = useMobileCal();
  const [calView, setCalView] = React.useState("agenda"); // "agenda" | "month"
  const [ym, setYm] = React.useState({ y: 2026, m: 5 }); // June 2026 (0-indexed)
  // วันที่เลือก — เดสก์ท็อปแสดงในแถบข้าง, มือถือแสดง bottom sheet. ตั้งต้น = วันนี้ ถ้าอยู่ในเดือนนี้
  const [selDay, setSelDay] = React.useState(() => {
    const t = new Date(window.SF.TODAY + "T00:00:00");
    return (t.getFullYear() === 2026 && t.getMonth() === 5) ? t.getDate() : null;
  });
  const first = new Date(ym.y, ym.m, 1);
  const startDow = first.getDay();
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const keyOf = (d) => ym.y + "-" + String(ym.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  // งานหลายวัน: ปรากฏทุกวันในช่วง [startDate..deadline] (เรียงให้ lane คงที่ข้ามวัน)
  const jobsOn = (d) => {
    const k = keyOf(d);
    return jobs.filter((j) => ((j.startDate || j.deadline) <= k && k <= j.deadline))
      .sort((a, b) => ((a.startDate || a.deadline).localeCompare(b.startDate || b.deadline)) || (a.id > b.id ? 1 : -1));
  };
  // หมุดกำหนดการเสร็จของแต่ละขั้น (stageDates) ที่ตรงกับวันนั้น
  const milestonesOn = (d) => {
    const k = keyOf(d);
    const out = [];
    jobs.forEach((j) => {
      const sd = j.stageDates || {};
      window.SF.STAGES.forEach((s) => {
        const v = sd[s.key];
        const end = v ? (typeof v === "object" ? v.end : v) : null; // วันเสร็จของขั้น
        if (end === k) out.push({ job: j, stage: s });
      });
    });
    return out;
  };
  const todayKey = window.SF.TODAY;
  const shift = (delta) => { setSelDay(null); setYm((s) => { const n = new Date(s.y, s.m + delta, 1); return { y: n.getFullYear(), m: n.getMonth() }; }); };

  if (calView === "agenda") {
    return <AgendaView jobs={jobs} onOpen={onOpen} calView={calView} setCalView={setCalView} />;
  }

  if (isMobile) {
    return (
      <MobileCalendar ym={ym} cells={cells} jobsOn={jobsOn} milestonesOn={milestonesOn} keyOf={keyOf} todayKey={todayKey}
        shift={shift} selDay={selDay} setSelDay={setSelDay} onOpen={onOpen} jobs={jobs} calView={calView} setCalView={setCalView} />
    );
  }

  const monthKey = ym.y + "-" + String(ym.m + 1).padStart(2, "0");
  const monthCount = jobs.filter((j) => j.deadline.startsWith(monthKey)).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 372px", gap: 18, alignItems: "start" }}>
      {/* ── ซ้าย: ปฏิทินเดือน ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>{TH_MONTH_FULL[ym.m]} {ym.y + 543}</h2>
            <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>· {monthCount} นัด</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <CalToggle calView={calView} setCalView={setCalView} />
            <NavBtn dir="prev" onClick={() => shift(-1)} />
            <NavBtn dir="next" onClick={() => shift(1)} />
          </div>
        </div>
        <FlowLegend />
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "0 -4px", padding: "0 4px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, minWidth: 490 }}>
          {window.TH_DAYS.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)", paddingBottom: 4 }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const key = keyOf(d);
            const isToday = key === todayKey;
            const isSel = d === selDay;
            const ms = milestonesOn(d);
            const list = jobsOn(d);
            const hasDelayed = list.some((j) => j.delayed) || ms.some((m) => (m.job.lateStages || []).some((ls) => ls.key === m.stage.key));
            return (
              <button key={i} onClick={() => setSelDay(d)} title="เลือกวันเพื่อดูรายละเอียด"
                style={{ height: 116, borderRadius: 12, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
                  border: isSel ? "2px solid var(--primary)" : "1px solid " + (isToday ? "var(--primary)" : "var(--border)"),
                  background: isSel || isToday ? "var(--primary-soft)" : "var(--surface2)", padding: 8,
                  display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "stretch" }}>
                  <span style={{ fontSize: 12.5, fontWeight: isToday || isSel ? 800 : 600, color: isToday || isSel ? "var(--primary-dark)" : "var(--text-2)" }}>{d}</span>
                  {hasDelayed && <span style={{ width: 6, height: 6, borderRadius: 99, background: "#EF4444", marginLeft: "auto" }} />}
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
                  {ms.slice(0, 4).map((m) => {
                    const lt = (m.job.lateStages || []).some((ls) => ls.key === m.stage.key);
                    const mc = lt ? "#EF4444" : m.stage.color;
                    return (
                      <span key={m.job.id + m.stage.key} title={(lt ? "เลยกำหนด " : "เสร็จ") + m.stage.th + " · " + m.job.name}
                        style={{ display: "flex", alignItems: "center", gap: 4, background: (lt ? "#EF4444" : m.stage.color) + "1f", borderRadius: 6, padding: "2px 5px", overflow: "hidden" }}>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: mc, flexShrink: 0 }} />
                        <span style={{ fontSize: 9.5, fontWeight: 600, color: lt ? "#EF4444" : "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.job.name.replace("คุณ", "")}</span>
                      </span>
                    );
                  })}
                  {ms.length > 4 && <span style={{ fontSize: 9, color: "var(--text-3)", paddingLeft: 1 }}>+{ms.length - 4} หมุด</span>}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* ── ขวา: แถบสรุปรายวัน ── */}
      <DaySidebar day={selDay} ym={ym} jobs={selDay ? jobsOn(selDay) : []} milestones={selDay ? milestonesOn(selDay) : []}
        todayKey={todayKey} keyOf={keyOf} onOpen={onOpen} canAdd={canAdd} onAddOnDate={onAddOnDate} />
    </div>
  );
}

/* ── แถบสรุปรายวัน (เดสก์ท็อป) — เลือกวันจากปฏิทินแล้วแสดงรายการนัด + เพิ่ม/แก้ ── */
function DaySidebar({ day, ym, jobs, milestones, todayKey, keyOf, onOpen, canAdd, onAddOnDate }) {
  const ms = milestones || [];
  const list = jobs || [];
  const isToday = day != null && keyOf(day) === todayKey;
  const total = list.length + ms.length;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 12 }}>
      {day == null ? (
        <div style={{ padding: "48px 8px", textAlign: "center", color: "var(--text-3)" }}>
          <Icon name="calendar" size={26} color="var(--text-3)" />
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>เลือกวันบนปฏิทิน</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>เพื่อดูรายละเอียดนัดของวันนั้น</div>
        </div>
      ) : (
        <React.Fragment>
          {/* header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{day} {TH_MONTH_FULL[ym.m]} {ym.y + 543}</div>
                {isToday && <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 7px", borderRadius: 99 }}>วันนี้</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{total} รายการ</div>
            </div>
            {canAdd && onAddOnDate && (
              <button onClick={() => onAddOnDate(keyOf(day))} title="เพิ่มนัดวันนี้"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <Icon name="plus" size={14} color="#fff" /> เพิ่มนัด
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: "62vh", overflowY: "auto", margin: "0 -4px", padding: "0 4px" }}>
            {total === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "26px 0" }}>
                ยังไม่มีนัดในวันนี้{canAdd && onAddOnDate ? " — กด “เพิ่มนัด”" : ""}
              </div>
            )}

            {ms.length > 0 && (
              <React.Fragment>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>กำหนดเสร็จขั้นงาน</div>
                {ms.map((m) => {
                  const lt = (m.job.lateStages || []).find((ls) => ls.key === m.stage.key);
                  const mc = lt ? "#EF4444" : m.stage.color;
                  return (
                    <button key={m.job.id + m.stage.key} onClick={() => onOpen(m.job)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", width: "100%", textAlign: "left", background: lt ? "#FEF2F2" : m.stage.soft, border: "1px solid " + (lt ? "#FECACA" : m.stage.color + "55"), borderRadius: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 99, background: mc, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={lt ? "alert" : "check"} size={13} color="#fff" sw={3} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.job.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: mc }}>{lt ? "เลยกำหนด " + lt.daysLate + " วัน · " : "เสร็จขั้น: "}{m.stage.th}</span>
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            )}

            {list.length > 0 && (
              <React.Fragment>
                {ms.length > 0 && <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)", marginTop: 2 }}>นัดติดตั้ง</div>}
                {list.map((j) => {
                  const s = stageOf(j.stage);
                  const c = j.delayed ? "#EF4444" : s.color;
                  return (
                    <button key={j.id} onClick={() => onOpen(j)}
                      style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", width: "100%", textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ width: 4, alignSelf: "stretch", borderRadius: 99, background: c, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</span>
                          {j.delayed && <span style={{ fontSize: 9.5, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>⚠ ล่าช้า</span>}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--text-3)" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 99, background: c }} />
                            <span style={{ fontWeight: 600, color: c }}>{s.th}</span>
                          </span>
                          <span>· {j.kw} kW</span>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>· {j.province}</span>
                        </span>
                      </span>
                      <Icon name="chevronRight" size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
                    </button>
                  );
                })}
              </React.Fragment>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ── Mobile calendar — ทั้งเดือนพอดีจอเดียว (ไม่ต้องเลื่อน)
   แตะวันที่มีงาน → bottom sheet แสดงรายการงานของวันนั้น ── */
function MobileCalendar({ ym, cells, jobsOn, milestonesOn, keyOf, todayKey, shift, selDay, setSelDay, onOpen, jobs, calView, setCalView }) {
  const monthName = TH_MONTH_FULL[ym.m];
  const monthCount = jobs.filter((j) => j.deadline.startsWith(ym.y + "-" + String(ym.m + 1).padStart(2, "0"))).length;
  const selList = selDay ? jobsOn(selDay) : [];
  const selMs = selDay ? milestonesOn(selDay) : [];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
      padding: 14, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* toggle Agenda/เดือน */}
      <div style={{ display: "flex", justifyContent: "center" }}><CalToggle calView={calView} setCalView={setCalView} /></div>
      {/* เดือน + ปุ่มเลื่อนเดือน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", margin: 0, whiteSpace: "nowrap" }}>{monthName} {ym.y + 543}</h2>
          <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{monthCount} นัดในเดือนนี้</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <NavBtn dir="prev" onClick={() => shift(-1)} />
          <NavBtn dir="next" onClick={() => shift(1)} />
        </div>
      </div>

      {/* หัวคอลัมน์วัน */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {window.TH_DAYS.map((d, i) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700,
            color: i === 0 || i === 6 ? "#EF4444aa" : "var(--text-3)" }}>{d}</div>
        ))}
      </div>

      {/* ตารางวัน — compact, ทั้งเดือนพอดีจอ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const list = jobsOn(d);
          const ms = milestonesOn(d);
          const has = list.length > 0 || ms.length > 0;
          const isToday = keyOf(d) === todayKey;
          const isSel = d === selDay;
          const hasDelayed = list.some((j) => j.delayed);
          const border = isSel ? "2px solid var(--primary)" : "1px solid " + (isToday ? "var(--primary)" : "var(--border)");
          return (
            <button key={i} onClick={() => has ? setSelDay(isSel ? null : d) : setSelDay(null)}
              disabled={!has}
              style={{ minHeight: 50, borderRadius: 9, border, fontFamily: "inherit",
                background: isSel ? "var(--primary-soft)" : isToday ? "var(--primary-soft)" : "var(--surface2)",
                cursor: has ? "pointer" : "default", padding: "5px 0 4px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 3 }}>
              <span style={{ fontSize: 12.5, fontWeight: isToday || isSel ? 800 : 600,
                color: isToday || isSel ? "var(--primary-dark)" : "var(--text-2)", lineHeight: 1 }}>{d}</span>
              {/* หมุดกำหนดเสร็จขั้นงาน (แดง=เลยกำหนด) */}
              {ms.length > 0 && (
                <span style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "center", flexWrap: "wrap", maxWidth: "100%" }}>
                  {ms.slice(0, 4).map((m, k) => {
                    const lt = (m.job.lateStages || []).some((ls) => ls.key === m.stage.key);
                    return <span key={k} style={{ width: 6, height: 6, borderRadius: 2, background: lt ? "#EF4444" : m.stage.color, transform: "rotate(45deg)" }} />;
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* คำอธิบายสั้น */}
      <div style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "center" }}>แตะวันที่มีงานเพื่อดูรายละเอียด</div>

      {/* bottom sheet — รายการงานของวันที่เลือก */}
      {selDay && (
        <React.Fragment>
          <div onClick={() => setSelDay(null)} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.34)",
            backdropFilter: "blur(2px)", zIndex: 88 }} />
          <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 89,
            background: "var(--bg)", borderTopLeftRadius: 20, borderTopRightRadius: 20,
            boxShadow: "0 -10px 40px rgba(8,20,14,.22)", maxHeight: "62dvh", display: "flex", flexDirection: "column",
            animation: "sheetUp .26s cubic-bezier(.3,.9,.3,1)" }}>
            {/* handle */}
            <div style={{ padding: "10px 0 4px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ width: 38, height: 4, borderRadius: 99, background: "var(--border-strong)" }} />
            </div>
            {/* header */}
            <div style={{ padding: "6px 20px 12px", borderBottom: "1px solid var(--border)", display: "flex",
              justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{selDay} {TH_MONTH_FULL[ym.m]} {ym.y + 543}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{selList.length} งานนัดติดตั้ง</div>
              </div>
              <button onClick={() => setSelDay(null)} style={{ width: 34, height: 34, borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer",
                display: "grid", placeItems: "center", color: "var(--text-2)" }}>
                <Icon name="x" size={17} />
              </button>
            </div>
            {/* list */}
            <div style={{ overflowY: "auto", padding: "12px 16px",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", gap: 9 }}>
              {selMs.length > 0 && (
                <React.Fragment>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>กำหนดเสร็จขั้นงาน</div>
                  {selMs.map((m) => {
                    const lt = (m.job.lateStages || []).find((ls) => ls.key === m.stage.key);
                    const mc = lt ? "#EF4444" : m.stage.color;
                    return (
                      <button key={m.job.id + m.stage.key} onClick={() => { setSelDay(null); onOpen(m.job); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%", textAlign: "left", background: lt ? "#FEF2F2" : m.stage.soft, border: "1px solid " + (lt ? "#FECACA" : m.stage.color + "55"), borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                        <span style={{ width: 22, height: 22, borderRadius: 99, background: mc, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={lt ? "alert" : "check"} size={13} color="#fff" sw={3} /></span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.job.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: mc }}>{lt ? "เลยกำหนด " + lt.daysLate + " วัน · " : "เสร็จขั้น: "}{m.stage.th}</span>
                        </span>
                      </button>
                    );
                  })}
                </React.Fragment>
              )}
              {selList.length === 0 && selMs.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "20px 0" }}>ไม่มีงานในวันนี้</div>
              )}
              {selList.map((j) => {
                const s = stageOf(j.stage);
                const c = j.delayed ? "#EF4444" : s.color;
                return (
                  <button key={j.id} onClick={() => { setSelDay(null); onOpen(j); }}
                    style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", width: "100%", textAlign: "left",
                      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ width: 4, alignSelf: "stretch", borderRadius: 99, background: c, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</span>
                        {j.delayed && <span style={{ fontSize: 9.5, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>⚠ ล่าช้า</span>}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--text-3)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 99, background: c }} />
                          <span style={{ fontWeight: 600, color: c }}>{s.th}</span>
                        </span>
                        <span>· {j.kw} kW</span>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>· {j.province}</span>
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function FlowLegend() {
  const SF = window.SF;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, padding: "10px 14px", background: "var(--surface2)", borderRadius: 12, border: "1px solid var(--border)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6, letterSpacing: ".03em" }}>
        <Icon name="flow" size={14} color="var(--primary)" /> Flow การทำงาน:
      </span>
      {SF.STAGES.map((s, i) => (
        <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} />{i + 1}. {s.th}
        </span>
      ))}
    </div>
  );
}

function NavBtn({ dir, onClick }) {
  return (    <button onClick={onClick} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)",
      cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
      <Icon name="chevronRight" size={17} style={{ transform: dir === "prev" ? "rotate(180deg)" : "none" }} />
    </button>
  );
}

function MapView({ jobs, onOpen }) {
  const isMobile = useMobileCal();
  const mapDiv = React.useRef(null);
  const mapObj = React.useRef(null);
  const layer = React.useRef(null);
  const LATLNG = window.SF.PROVINCE_LATLNG;

  const byProvince = React.useMemo(() => {
    const m = {};
    jobs.forEach((j) => { (m[j.province] = m[j.province] || []).push(j); });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [jobs]);

  const latlngOf = React.useCallback((j) => {
    const base = LATLNG[j.province] || [13.7, 100.6];
    const seed = parseInt((j.code || "").replace(/\D/g, ""), 10) || 0;
    const dlat = (((seed % 7) - 3) * 0.018);
    const dlng = ((((seed * 3) % 7) - 3) * 0.018);
    return [base[0] + dlat, base[1] + dlng];
  }, [LATLNG]);

  const [openProv, setOpenProv] = React.useState(null);
  const flyToProv = React.useCallback((prov) => {
    const ll = LATLNG[prov];
    if (ll && mapObj.current) mapObj.current.flyTo(ll, 10, { duration: 0.7 });
  }, [LATLNG]);
  const focusJob = React.useCallback((j) => {
    if (mapObj.current) mapObj.current.flyTo(latlngOf(j), 12, { duration: 0.7 });
    onOpen(j);
  }, [latlngOf, onOpen]);

  // init the map once
  React.useEffect(() => {
    if (!window.L || mapObj.current || !mapDiv.current) return;
    const map = window.L.map(mapDiv.current, { scrollWheelZoom: true, zoomControl: true }).setView([14.2, 100.6], 6);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layer.current = window.L.layerGroup().addTo(map);
    mapObj.current = map;
    setTimeout(() => map.invalidateSize(), 250);
    return () => { map.remove(); mapObj.current = null; layer.current = null; };
  }, []);

  // (re)draw markers when jobs change
  React.useEffect(() => {
    const map = mapObj.current;
    if (!map || !layer.current) return;
    layer.current.clearLayers();
    const pts = [];
    jobs.forEach((j) => {
      const ll = latlngOf(j);
      pts.push(ll);
      const color = j.problem ? "#EF4444" : stageOf(j.stage).color;
      const marker = window.L.circleMarker(ll, { radius: 9, color: "#fff", weight: 2.5, fillColor: color, fillOpacity: 1 });
      marker.bindTooltip(j.name + " · " + j.kw + "kW · " + stageOf(j.stage).th, { direction: "top", offset: [0, -6] });
      marker.on("click", () => onOpen(j));
      marker.addTo(layer.current);
    });
    if (pts.length) { try { map.fitBounds(pts, { padding: [50, 50], maxZoom: 11 }); } catch (e) {} }
    setTimeout(() => map.invalidateSize(), 120);
  }, [jobs, latlngOf, onOpen]);

  // breakpoint เปลี่ยน (เดสก์ท็อป↔มือถือ) → map สูงเปลี่ยน ต้อง recalc ขนาด
  React.useEffect(() => {
    if (mapObj.current) setTimeout(() => mapObj.current.invalidateSize(), 220);
  }, [isMobile]);

  return (
    <div style={isMobile
      ? { display: "flex", flexDirection: "column", gap: 14 }
      : { display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 18, flex: 1, minHeight: 0 }}>
      {/* real map */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
        <PanelTitle icon="map" iconColor="var(--primary)" title="แผนที่ตำแหน่งงานติดตั้ง" sub="แผนที่จริง · เลื่อน/ซูมได้ · คลิกหมุดเพื่อดูงาน" />
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", margin: "12px 0 4px" }}>
          {window.SF.STAGES.map((s) => (
            <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color, border: "1.5px solid #fff", boxShadow: "0 0 0 1px " + s.color }} />{s.th}
            </span>
          ))}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#EF4444" }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: "#EF4444" }} /> ติดปัญหา
          </span>
        </div>
        <div ref={mapDiv} style={{ flex: isMobile ? "none" : 1, height: isMobile ? 320 : "auto",
          minHeight: isMobile ? 320 : 460, borderRadius: 14, overflow: "hidden", marginTop: 10, border: "1px solid var(--border)", zIndex: 0 }} />
      </div>
      {/* province list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", minHeight: isMobile ? "auto" : 0 }}>
        <PanelTitle icon="pin" title="งานแยกตามจังหวัด" sub={"แตะจังหวัดเพื่อโฟกัสบนแผนที่ · " + byProvince.length + " จังหวัด"} />
        <div style={isMobile
          ? { marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }
          : { marginTop: 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1, minHeight: 0 }}>
          {byProvince.map(([prov, list]) => {
            const open = openProv === prov;
            const problems = list.filter((j) => j.problem || j.delayed).length;
            return (
              <div key={prov} style={{ border: "1px solid " + (open ? "var(--primary)" : "var(--border)"), borderRadius: 12, overflow: "hidden", transition: "border-color .15s", flexShrink: 0 }}>
                <button onClick={() => { setOpenProv(open ? null : prov); flyToProv(prov); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, padding: "11px 13px",
                    background: open ? "var(--primary-soft)" : "var(--surface2)", border: "none", cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                    <Icon name="chevronRight" size={15} color="var(--text-3)" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: open ? "var(--primary-dark)" : "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{prov}</span>
                    {problems > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>{problems}⚠</span>}
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--text-2)", flexShrink: 0, whiteSpace: "nowrap" }}>{list.length} งาน</span>
                </button>
                {open && (
                  <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 3, borderTop: "1px solid var(--border)" }}>
                    {list.map((j) => (
                      <button key={j.id} onClick={() => focusJob(j)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 8px",
                        background: "none", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: j.problem ? "#EF4444" : stageOf(j.stage).color, flexShrink: 0 }} />
                        <span style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</span>
                          <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{stageOf(j.stage).th}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)", flexShrink: 0 }}>{j.kw}kW</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CalendarView, MapView });
