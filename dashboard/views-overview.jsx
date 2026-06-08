/* ============================================================
   SolarFlow — Overview view (KPIs, pipeline, alerts, schedule)
   ============================================================ */

function KpiCard({ label, value, unit, icon, accent, sub, alert, onClick }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div onClick={onClick}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(20,40,28,.12)"; e.currentTarget.style.borderColor = accent; const c = e.currentTarget.querySelector(".kpi-cta"); if (c) c.style.opacity = 1; } }}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = alert ? "0 0 0 3px #EF444411" : "var(--shadow-sm)"; e.currentTarget.style.borderColor = alert ? "#FCA5A5" : "var(--border)"; const c = e.currentTarget.querySelector(".kpi-cta"); if (c) c.style.opacity = 0; } }}
      style={{ background: "var(--surface)", border: "1px solid " + (alert ? "#FCA5A5" : "var(--border)"),
      borderRadius: mob ? 14 : 16, padding: mob ? 14 : 20, position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
      transition: "transform .14s, box-shadow .14s, border-color .14s",
      boxShadow: alert ? "0 0 0 3px #EF444411" : "var(--shadow-sm)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: mob ? 11 : 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: ".01em", whiteSpace: mob ? "normal" : "nowrap", lineHeight: 1.3 }}>{label}</span>
        <span style={{ width: mob ? 28 : 34, height: mob ? 28 : 34, borderRadius: mob ? 8 : 10, background: accent + "16", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name={icon} size={mob ? 15 : 17} color={accent} />
        </span>
      </div>
      <div style={{ marginTop: mob ? 10 : 14, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--display)", fontSize: mob ? 26 : 34, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: mob ? 12.5 : 14, fontWeight: 600, color: "var(--text-3)" }}>{unit}</span>}
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {sub && <span style={{ fontSize: mob ? 11 : 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>}
        {!mob && (
          <span className="kpi-cta" style={{ opacity: 0, transition: "opacity .14s", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
            ดูรายการ <Icon name="arrowRight" size={13} color={accent} />
          </span>
        )}
      </div>
    </div>
  );
}

function PipelinePanel({ jobs, onStage }) {
  const SF = window.SF;
  const counts = SF.STAGES.map((s) => jobs.filter((j) => j.stage === s.key).length);
  const max = Math.max(...counts, 1);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="trend" iconColor="var(--primary)" title="งานแยกตามขั้นตอน" sub="Pipeline · คลิกเพื่อกรอง" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
        {SF.STAGES.map((s, i) => (
          <button key={s.key} onClick={() => onStage(s.key)} style={{ display: "flex",
            alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left", width: "100%" }}>
            <span style={{ width: 104, flexShrink: 0, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.25 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }} />{s.th}
            </span>
            <span style={{ flex: 1, minWidth: 0, height: 22, background: "var(--surface3)", borderRadius: 7, overflow: "hidden", display: "block" }}>
              <span style={{ display: "block", height: "100%", width: Math.max((counts[i] / max) * 100, counts[i] ? 6 : 0) + "%",
                background: "linear-gradient(90deg," + s.color + "cc," + s.color + ")", borderRadius: 7, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
            </span>
            <span style={{ width: 28, flexShrink: 0, fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: counts[i] ? "var(--text-1)" : "var(--text-3)", textAlign: "right" }}>{counts[i]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelTitle({ icon, iconColor, title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={17} color={iconColor || "var(--text-2)"} />
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

function AlertsPanel({ jobs, onOpen }) {
  const problems = jobs.filter((j) => j.problem || j.delayed);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="alert" iconColor="#EF4444" title="งานที่ต้องดูแล" sub={problems.length + " งานติดปัญหา / ล่าช้า"} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, maxHeight: 280, overflowY: "auto" }}>
        {problems.length === 0 && <Empty text="ไม่มีงานติดปัญหา 🎉" />}
        {problems.map((j) => (
          <button key={j.id} onClick={() => onOpen(j)} style={{ display: "flex", gap: 11, padding: "11px 12px", textAlign: "left",
            background: "#FEF6F6", border: "1px solid #FBDADA", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            <span style={{ width: 4, alignSelf: "stretch", borderRadius: 99, background: "#EF4444", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto" }}>{j.name}</span>
                {j.delayed && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99 }}>ล่าช้า</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {j.problem || ("เลยกำหนดวันนัด " + thDate(j.deadline))}
              </div>
              <div style={{ marginTop: 6 }}><StageBadge stageKey={j.stage} size="sm" /></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SchedulePanel({ jobs, onOpen }) {
  const today = window.SF.TODAY;
  const upcoming = jobs.filter((j) => j.stage !== "done" && j.deadline >= today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 6);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="calendar" iconColor="var(--primary)" title="นัดติดตั้งที่ใกล้ถึง" sub="เรียงตามวันนัด" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
        {upcoming.map((j) => {
          const d = parseDate(j.deadline);
          return (
            <button key={j.id} onClick={() => onOpen(j)} style={{ display: "flex", gap: 13, alignItems: "center", padding: "9px 8px",
              background: "none", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              <div style={{ width: 46, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{window.TH_MONTHS[d.getMonth()]}</div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.province} · {j.kw} kW · {j.brand}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <StageBadge stageKey={j.stage} size="sm" />
                  {j.delayed && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444" }}>ล่าช้า</span>}
                </div>
              </div>
              <TechAvatar techId={j.tech} size={26} />
            </button>
          );
        })}
        {upcoming.length === 0 && <Empty text="ไม่มีนัดที่กำลังจะถึง" />}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ padding: "26px 0", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>{text}</div>;
}

function OverviewView({ jobs, onOpen, onStage, onKpi }) {
  const active = jobs.filter((j) => j.stage !== "done");
  const delayed = jobs.filter((j) => j.delayed);
  const ready = active.filter((j) => j.matReady);
  const totalKwh = jobs.filter((j) => j.battery).reduce((s, j) => s + (parseInt(j.batSize) || 0), 0);
  const done = jobs.filter((j) => j.stage === "done");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KpiCard label="งานกำลังดำเนินการ" value={active.length} unit="งาน" icon="list" accent="#3B82F6" sub={"เสร็จแล้ว " + done.length + " งาน"} onClick={() => onKpi("active")} />
        <KpiCard label="งานล่าช้ากว่ากำหนด" value={delayed.length} unit="งาน" icon="alert" accent="#EF4444" alert={delayed.length > 0} sub="เลยวันนัดติดตั้ง" onClick={() => onKpi("delayed")} />
        <KpiCard label="อุปกรณ์พร้อมติดตั้ง" value={ready.length} unit="งาน" icon="box" accent="var(--primary)" sub="วัสดุครบทุกรายการ" onClick={() => onKpi("ready")} />
        <KpiCard label="ความจุแบตเตอรี่รวม" value={totalKwh} unit="kWh" icon="battery" accent="#7C5CFC" sub="ระบบ ATMOCE" onClick={() => onKpi("battery")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        <PipelinePanel jobs={jobs} onStage={onStage} />
        <AlertsPanel jobs={jobs} onOpen={onOpen} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <SchedulePanel jobs={jobs} onOpen={onOpen} />
        <BrandPanel jobs={jobs} />
      </div>
    </div>
  );
}

function BrandPanel({ jobs }) {
  const SF = window.SF;
  const byBrand = SF.BRANDS.map((b) => ({ b, n: jobs.filter((j) => j.brand === b).length }));
  const total = jobs.length || 1;
  const byType = SF.TYPES.map((t) => ({ t, n: jobs.filter((j) => j.type === t.key).length }));
  const colors = { ATMOCE: "#7C5CFC", Huawei: "#EF4444" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="grid" title="สัดส่วนงาน" sub="แบรนด์ & ประเภท" />
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>แบรนด์อินเวอร์เตอร์</div>
        <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", gap: 2 }}>
          {byBrand.map(({ b, n }) => n > 0 && (
            <div key={b} style={{ width: (n / total * 100) + "%", background: colors[b] || "var(--primary)" }} title={b + " " + n} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
          {byBrand.map(({ b, n }) => (
            <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: colors[b] }} />{b}<strong style={{ color: "var(--text-1)" }}>{n}</strong>
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", marginBottom: 10 }}>ประเภทงาน</div>
        <div style={{ display: "flex", gap: 12 }}>
          {byType.map(({ t, n }) => (
            <div key={t.key} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, background: t.color + "12", border: "1px solid " + t.color + "26" }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: t.color, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 5, fontWeight: 500 }}>{t.th}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OverviewView, KpiCard, PanelTitle, Empty });
