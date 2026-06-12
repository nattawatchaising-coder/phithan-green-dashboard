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

function CalendarView({ jobs, onOpen }) {
  const isMobile = useMobileCal();
  const [ym, setYm] = React.useState({ y: 2026, m: 5 }); // June 2026 (0-indexed)
  const [selDay, setSelDay] = React.useState(null); // mobile: วันที่ถูกแตะ → แสดง bottom sheet
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
      window.SF.STAGES.forEach((s) => { if (sd[s.key] === k) out.push({ job: j, stage: s }); });
    });
    return out;
  };
  const todayKey = window.SF.TODAY;
  const shift = (delta) => { setSelDay(null); setYm((s) => { const n = new Date(s.y, s.m + delta, 1); return { y: n.getFullYear(), m: n.getMonth() }; }); };

  if (isMobile) {
    return (
      <MobileCalendar ym={ym} cells={cells} jobsOn={jobsOn} milestonesOn={milestonesOn} keyOf={keyOf} todayKey={todayKey}
        shift={shift} selDay={selDay} setSelDay={setSelDay} onOpen={onOpen} jobs={jobs} />
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
            {["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"][ym.m]} {ym.y + 543}
          </h2>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>· {jobs.filter((j) => j.deadline.startsWith(ym.y + "-" + String(ym.m + 1).padStart(2, "0"))).length} นัด</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          const list = jobsOn(d);
          const key = ym.y + "-" + String(ym.m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
          const isToday = key === todayKey;
          return (
            <div key={i} style={{ height: 116, borderRadius: 12, border: "1px solid " + (isToday ? "var(--primary)" : "var(--border)"),
              background: isToday ? "var(--primary-soft)" : "var(--surface2)", padding: 8, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
              <span onClick={() => list.length && setSelDay(d)} title={list.length ? "ดูงานทั้งหมดวันนี้" : undefined}
                style={{ fontSize: 12.5, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary-dark)" : "var(--text-2)", alignSelf: "flex-start", cursor: list.length ? "pointer" : "default" }}>{d}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: -8, marginRight: -8, overflow: "hidden" }}>
                {list.slice(0, 3).map((j) => {
                  const s = stageOf(j.stage);
                  const c = j.delayed ? "#EF4444" : s.color;
                  const sd = j.startDate || j.deadline;
                  const isStart = sd === key;
                  const isEnd = j.deadline === key;
                  const colIdx = i % 7;
                  const leftRound = isStart || colIdx === 0;   // ปลายซ้ายของแถบ (วันเริ่ม/ต้นสัปดาห์)
                  const rightRound = isEnd || colIdx === 6;     // ปลายขวา (วันเสร็จ/ปลายสัปดาห์)
                  return (
                    <button key={j.id} onClick={() => onOpen(j)} title={j.name + " · " + s.th}
                      style={{ height: 19, display: "flex", alignItems: "center", background: s.soft, border: "none",
                        borderLeft: leftRound ? "3px solid " + c : "none",
                        borderTopLeftRadius: leftRound ? 6 : 0, borderBottomLeftRadius: leftRound ? 6 : 0,
                        borderTopRightRadius: rightRound ? 6 : 0, borderBottomRightRadius: rightRound ? 6 : 0,
                        marginLeft: leftRound ? 4 : 0, marginRight: rightRound ? 4 : 0,
                        padding: leftRound ? "0 6px" : "0 6px 0 8px", cursor: "pointer", fontFamily: "inherit", overflow: "hidden", textAlign: "left" }}>
                      {leftRound && <span style={{ fontSize: 10, fontWeight: 700, color: j.delayed ? "#EF4444" : "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.delayed ? "⚠ " : ""}{j.name.replace("คุณ", "")}</span>}
                    </button>
                  );
                })}
                {list.length > 3 && (
                  <button onClick={() => setSelDay(d)}
                    style={{ fontSize: 10, fontWeight: 600, color: "var(--primary-dark)", paddingLeft: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                    +{list.length - 3} เพิ่ม
                  </button>
                )}
                {(() => {
                  const ms = milestonesOn(d);
                  if (!ms.length) return null;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 8, marginTop: 1 }}>
                      {ms.slice(0, 2).map((m) => (
                        <button key={m.job.id + m.stage.key} onClick={() => onOpen(m.job)} title={"เสร็จ" + m.stage.th + " · " + m.job.name}
                          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", overflow: "hidden" }}>
                          <span style={{ width: 12, height: 12, borderRadius: 99, background: m.stage.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={8} color="#fff" sw={3} /></span>
                          <span style={{ fontSize: 9.5, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.stage.th} · {m.job.name.replace("คุณ", "")}</span>
                        </button>
                      ))}
                      {ms.length > 2 && <button onClick={() => setSelDay(d)} style={{ fontSize: 9, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", paddingLeft: 1 }}>+{ms.length - 2} หมุด</button>}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      {selDay && <DayDetailModal day={selDay} ym={ym} jobs={jobsOn(selDay)} milestones={milestonesOn(selDay)} onOpen={(j) => { setSelDay(null); onOpen(j); }} onClose={() => setSelDay(null)} />}
    </div>
  );
}

/* ── หน้าต่างแสดงงานทั้งหมดในวันที่เลือก (เดสก์ท็อป) ── */
function DayDetailModal({ day, ym, jobs, milestones, onOpen, onClose }) {
  const monthName = TH_MONTH_FULL[ym.m];
  const ms = milestones || [];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.4)", backdropFilter: "blur(3px)", zIndex: 90, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: 18, width: "min(460px, 100%)", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{day} {monthName} {ym.y + 543}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>{jobs.length} งานนัดติดตั้ง</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
          {ms.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingBottom: 4, marginBottom: 2, borderBottom: jobs.length ? "1px dashed var(--border)" : "none" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>กำหนดเสร็จขั้นงาน</div>
              {ms.map((m) => (
                <button key={m.job.id + m.stage.key} onClick={() => onOpen(m.job)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", width: "100%", textAlign: "left", background: m.stage.soft, border: "1px solid " + m.stage.color + "55", borderRadius: 11, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 99, background: m.stage.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={13} color="#fff" sw={3} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.job.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: m.stage.color }}>เสร็จขั้น: {m.stage.th}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {jobs.length === 0 && ms.length === 0 && <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: "20px 0" }}>ไม่มีงานในวันนี้</div>}
          {jobs.map((j) => {
            const s = stageOf(j.stage);
            const c = j.delayed ? "#EF4444" : s.color;
            return (
              <button key={j.id} onClick={() => onOpen(j)}
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
    </div>
  );
}

/* ── Mobile calendar — ทั้งเดือนพอดีจอเดียว (ไม่ต้องเลื่อน)
   แตะวันที่มีงาน → bottom sheet แสดงรายการงานของวันนั้น ── */
function MobileCalendar({ ym, cells, jobsOn, milestonesOn, keyOf, todayKey, shift, selDay, setSelDay, onOpen, jobs }) {
  const monthName = TH_MONTH_FULL[ym.m];
  const monthCount = jobs.filter((j) => j.deadline.startsWith(ym.y + "-" + String(ym.m + 1).padStart(2, "0"))).length;
  const selList = selDay ? jobsOn(selDay) : [];
  const selMs = selDay ? milestonesOn(selDay) : [];

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
              {/* จุดบอกจำนวนงาน — สูงสุด 3 จุด แล้วโชว์ตัวเลข */}
              {list.length > 0 && (
                <span style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", justifyContent: "center", maxWidth: "100%" }}>
                  {list.slice(0, 3).map((j) => (
                    <span key={j.id} style={{ width: 5, height: 5, borderRadius: 99,
                      background: j.delayed ? "#EF4444" : stageOf(j.stage).color }} />
                  ))}
                  {list.length > 3 && (
                    <span style={{ fontSize: 8, fontWeight: 700, color: hasDelayed ? "#EF4444" : "var(--text-3)", lineHeight: 1 }}>+{list.length - 3}</span>
                  )}
                </span>
              )}
              {/* หมุดกำหนดเสร็จขั้นงาน */}
              {ms.length > 0 && (
                <span style={{ display: "flex", gap: 2, alignItems: "center", justifyContent: "center" }}>
                  {ms.slice(0, 3).map((m, k) => (
                    <span key={k} style={{ width: 6, height: 6, borderRadius: 2, background: m.stage.color, transform: "rotate(45deg)" }} />
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
                  {selMs.map((m) => (
                    <button key={m.job.id + m.stage.key} onClick={() => { setSelDay(null); onOpen(m.job); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", width: "100%", textAlign: "left", background: m.stage.soft, border: "1px solid " + m.stage.color + "55", borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 99, background: m.stage.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" size={13} color="#fff" sw={3} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.job.name}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: m.stage.color }}>เสร็จขั้น: {m.stage.th}</span>
                      </span>
                    </button>
                  ))}
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
