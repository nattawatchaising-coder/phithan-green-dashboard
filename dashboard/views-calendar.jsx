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

/* งาน (ขั้น) ที่ active ในวัน k — กระจายทุกขั้นตามช่วง start..end + ติด kind/late
   ใช้ทั้งช่องปฏิทินเดือนและแถบรายวัน เพื่อให้งานหลายวันโผล่ครบทุกวันในช่วง */
function calTasksOn(jobs, k) {
  const SF = window.SF; const out = [];
  (jobs || []).forEach((j) => {
    const sd = j.stageDates || {};
    SF.STAGES.forEach((s) => {
      const v = sd[s.key]; if (!v) return;
      let start = ((typeof v === "object" ? (v.start || v.end || "") : v) || "").slice(0, 10);
      let end = ((typeof v === "object" ? (v.end || v.start || "") : v) || "").slice(0, 10);
      if (!start) return; if (!end || end < start) end = start;
      if (k < start || k > end) return;
      const kind = start === end ? "single" : (k === start ? "start" : (k === end ? "end" : "mid"));
      const late = (j.lateStages || []).some((ls) => ls.key === s.key);
      out.push({ job: j, stage: s, kind: kind, late: late });
    });
  });
  return out;
}
/* รวมงานของวันเดียวกันตาม "งาน" → [{ job, stages:[{...stage, kind}], late }] */
function calGroupByJob(tasks) {
  const m = {}; const order = [];
  (tasks || []).forEach((t) => {
    if (!m[t.job.id]) { m[t.job.id] = { job: t.job, stages: [], late: false }; order.push(t.job.id); }
    m[t.job.id].stages.push(Object.assign({}, t.stage, { kind: t.kind }));
    if (t.late) m[t.job.id].late = true;
  });
  return order.map((id) => m[id]);
}

function CalendarView({ jobs, onOpen, onAddOnDate, canAdd, onAdvance }) {
  const isMobile = useMobileCal();
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
  // งาน (ขั้น) ที่ active ในวันนั้น — กระจายทุกขั้นตามช่วง start..end → งานหลายวันโผล่ครบทุกวัน
  const tasksOn = (d) => calTasksOn(jobs, keyOf(d));
  const groupsOn = (d) => calGroupByJob(tasksOn(d));
  const todayKey = window.SF.TODAY;
  const shift = (delta) => { setSelDay(null); setYm((s) => { const n = new Date(s.y, s.m + delta, 1); return { y: n.getFullYear(), m: n.getMonth() }; }); };

  if (isMobile) {
    return (
      <MobileCalendar ym={ym} cells={cells} tasksOn={tasksOn} groupsOn={groupsOn} keyOf={keyOf} todayKey={todayKey}
        shift={shift} selDay={selDay} setSelDay={setSelDay} onOpen={onOpen} onAdvance={onAdvance} jobs={jobs} />
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
            const tasks = tasksOn(d);
            const hasDelayed = tasks.some((t) => t.late);
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
                  {tasks.slice(0, 4).map((t, k2) => {
                    const c = t.late ? "#EF4444" : t.stage.color;
                    const kindTxt = t.kind === "start" ? " · เริ่ม" : t.kind === "end" ? " · เสร็จ" : "";
                    return (
                      <span key={t.job.id + t.stage.key + k2} title={t.stage.th + kindTxt + " · " + t.job.name}
                        style={{ display: "flex", alignItems: "center", gap: 4, background: c + "1f", borderRadius: 6, padding: "2px 5px", overflow: "hidden" }}>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: c, flexShrink: 0 }} />
                        <span style={{ fontSize: 9.5, fontWeight: 600, color: t.late ? "#EF4444" : "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.job.name.replace("คุณ", "")}</span>
                      </span>
                    );
                  })}
                  {tasks.length > 4 && <span style={{ fontSize: 9, color: "var(--text-3)", paddingLeft: 1 }}>+{tasks.length - 4} งาน</span>}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* ── ขวา: แถบสรุปรายวัน (ใช้การ์ดสไตล์เดียวกับตารางงานของฉัน) ── */}
      <DaySidebar day={selDay} ym={ym} groups={selDay ? groupsOn(selDay) : []}
        todayKey={todayKey} keyOf={keyOf} onOpen={onOpen} onAdvance={onAdvance} canAdd={canAdd} onAddOnDate={onAddOnDate} />
    </div>
  );
}

/* ── แถบสรุปรายวัน (เดสก์ท็อป) — ใช้การ์ดเดียวกับ "ตารางงานของฉัน" (JobTaskCard) ── */
function DaySidebar({ day, ym, groups, todayKey, keyOf, onOpen, onAdvance, canAdd, onAddOnDate }) {
  const list = groups || [];
  const isToday = day != null && keyOf(day) === todayKey;
  const dayKey = day != null ? keyOf(day) : "";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 12 }}>
      {day == null ? (
        <div style={{ padding: "48px 8px", textAlign: "center", color: "var(--text-3)" }}>
          <Icon name="calendar" size={26} color="var(--text-3)" />
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 8 }}>เลือกวันบนปฏิทิน</div>
          <div style={{ fontSize: 12, marginTop: 2 }}>เพื่อดูงานของวันนั้น</div>
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
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{list.length} งาน</div>
            </div>
            {canAdd && onAddOnDate && (
              <button onClick={() => onAddOnDate(dayKey)} title="เพิ่มงานวันนี้"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 9, padding: "8px 11px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <Icon name="plus" size={14} color="#fff" /> เพิ่มงาน
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11, maxHeight: "66vh", overflowY: "auto", margin: "0 -4px", padding: "0 4px" }}>
            {list.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "26px 0" }}>
                ยังไม่มีงานในวันนี้{canAdd && onAddOnDate ? " — กด “เพิ่มงาน”" : ""}
              </div>
            ) : list.map((g) => (
              <window.JobTaskCard key={g.job.id} job={g.job} stages={g.stages} day={dayKey} onOpen={onOpen} onAdvance={onAdvance} />
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ── Mobile calendar — ทั้งเดือนพอดีจอเดียว (ไม่ต้องเลื่อน)
   แตะวันที่มีงาน → bottom sheet แสดงรายการงานของวันนั้น ── */
function MobileCalendar({ ym, cells, tasksOn, groupsOn, keyOf, todayKey, shift, selDay, setSelDay, onOpen, onAdvance, jobs }) {
  const monthName = TH_MONTH_FULL[ym.m];
  const monthCount = jobs.filter((j) => j.deadline.startsWith(ym.y + "-" + String(ym.m + 1).padStart(2, "0"))).length;
  const selGroups = selDay ? groupsOn(selDay) : [];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
      padding: 14, boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 10 }}>
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
          const tasks = tasksOn(d);
          const has = tasks.length > 0;
          const isToday = keyOf(d) === todayKey;
          const isSel = d === selDay;
          const hasDelayed = tasks.some((t) => t.late);
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
              {/* จุดงานของวันนั้น (แดง=เลยกำหนด) */}
              {tasks.length > 0 && (
                <span style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "center", flexWrap: "wrap", maxWidth: "100%" }}>
                  {tasks.slice(0, 4).map((t, k) => (
                    <span key={k} style={{ width: 6, height: 6, borderRadius: 2, background: t.late ? "#EF4444" : t.stage.color, transform: "rotate(45deg)" }} />
                  ))}
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
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{selGroups.length} งาน</div>
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
              {selGroups.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "20px 0" }}>ไม่มีงานในวันนี้</div>
              )}
              {selGroups.map((g) => (
                <window.JobTaskCard key={g.job.id} job={g.job} stages={g.stages} day={keyOf(selDay)} onOpen={(jb) => { setSelDay(null); onOpen(jb); }} onAdvance={onAdvance} />
              ))}
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
