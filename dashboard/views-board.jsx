/* ============================================================
   SolarFlow — Kanban board (drag cards across the 8 stages)
   ============================================================ */

function KanbanCard({ job, onOpen, onDragStart, dragging }) {
  const s = stageOf(job.stage);
  return (
    <div draggable onDragStart={(e) => onDragStart(e, job)} onClick={() => onOpen(job)}
      style={{ background: "var(--surface)", border: "1px solid " + (job.problem ? "#FBD3D3" : "var(--border)"),
        borderRadius: 13, padding: 13, cursor: "grab", boxShadow: "var(--shadow-sm)", opacity: dragging ? 0.4 : 1,
        borderLeft: "3px solid " + (job.problem ? "#EF4444" : s.color), transition: "box-shadow .15s, transform .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(8,20,14,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{job.code}</span>
        <TypeBadge type={job.type} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.25, marginBottom: 2 }}>{job.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-3)", marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          <Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {job.province} · <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{job.brand}</span>
        </span>
        {job.backup && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, fontSize: 10.5, fontWeight: 700,
            color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 7px", borderRadius: 99 }}>
            <Icon name="shield" size={10} color="var(--primary-dark)" />Backup
          </span>
        )}
      </div>
      {job.problem && (
        <div style={{ fontSize: 11, color: "#B91C1C", background: "#FEF2F2", borderRadius: 8, padding: "6px 8px", marginBottom: 10, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          ⚠ {job.problem}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
        <Stat icon="bolt" text={job.kw + " kW"} />
        <Stat icon="panel" text={job.panels + " แผง"} />
        {job.battery && <Stat icon="battery" text={job.batSize} accent />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <TechAvatar techId={job.tech} size={24} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: job.delayed ? "#EF4444" : "var(--text-2)" }}>{thDate(job.deadline)}</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MatDots mat={job.mat} />
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", color: job.matReady ? "var(--primary-dark)" : "var(--text-3)" }}>{job.matReadyPct}%</span>
        </span>
      </div>
    </div>
  );
}

function Stat({ icon, text, accent }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
      color: accent ? "var(--primary-dark)" : "var(--text-2)", background: accent ? "var(--primary-soft)" : "var(--surface2)",
      padding: "3px 7px", borderRadius: 7 }}>
      <Icon name={icon} size={11} color={accent ? "var(--primary-dark)" : "var(--text-3)"} />{text}
    </span>
  );
}

function KanbanView({ jobs, onOpen, onMoveStage }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [drag, setDrag] = React.useState(null);
  const [over, setOver] = React.useState(null);

  const onDragStart = (e, job) => { setDrag(job.id); e.dataTransfer.effectAllowed = "move"; };
  const onDrop = (stageKey) => { if (drag) onMoveStage(drag, stageKey); setDrag(null); setOver(null); };

  if (isMobile) return <KanbanMobile jobs={jobs} onOpen={onOpen} />;

  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, minHeight: 0, flex: 1 }}>
      {SF.STAGES.map((s) => {
        const col = jobs.filter((j) => j.stage === s.key);
        const isOver = over === s.key;
        return (
          <div key={s.key}
            onDragOver={(e) => { e.preventDefault(); setOver(s.key); }}
            onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
            onDrop={() => onDrop(s.key)}
            style={{ width: 264, flexShrink: 0, display: "flex", flexDirection: "column", borderRadius: 14,
              background: isOver ? s.soft : "var(--surface2)", border: "1px solid " + (isOver ? s.color : "var(--border)"),
              transition: "background .15s, border-color .15s" }}>
            <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid var(--border)", position: "sticky", top: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{s.th}</span>
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: s.color,
                background: s.soft, minWidth: 22, height: 22, borderRadius: 99, display: "grid", placeItems: "center", padding: "0 6px" }}>{col.length}</span>
            </div>
            <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 11, overflowY: "auto", flex: 1, minHeight: 80 }}>
              {col.map((j) => <KanbanCard key={j.id} job={j} onOpen={onOpen} onDragStart={onDragStart} dragging={drag === j.id} />)}
              {col.length === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)", border: "1.5px dashed var(--border-strong)", borderRadius: 10 }}>
                  {isOver ? "วางที่นี่" : "ว่าง"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile board — accordion แนวตั้ง แตะหัวขั้นเพื่อพับ/ขยาย ── */
function KanbanMobile({ jobs, onOpen }) {
  const SF = window.SF;
  const [collapsed, setCollapsed] = React.useState({}); // stageKey -> true=พับ
  const noop = () => {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {SF.STAGES.map((s) => {
        const col = jobs.filter((j) => j.stage === s.key);
        // ค่าเริ่มต้น: ขั้นที่มีงานให้ขยาย, ขั้นว่างพับ
        const isOpen = collapsed[s.key] !== undefined ? !collapsed[s.key] : col.length > 0;
        const problems = col.filter((j) => j.problem || j.delayed).length;
        return (
          <div key={s.key} style={{ borderRadius: 14, background: "var(--surface2)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <button onClick={() => setCollapsed((c) => ({ ...c, [s.key]: isOpen }))}
              style={{ width: "100%", padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                borderBottom: isOpen ? "1px solid var(--border)" : "none" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{s.th}</span>
                {problems > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "1px 6px", borderRadius: 99, flexShrink: 0 }}>{problems}⚠</span>}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: s.color, background: s.soft,
                  minWidth: 24, height: 24, borderRadius: 99, display: "grid", placeItems: "center", padding: "0 7px" }}>{col.length}</span>
                <Icon name="chevronDown" size={17} color="var(--text-3)"
                  style={{ transform: isOpen ? "none" : "rotate(-90deg)", transition: "transform .18s" }} />
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.map((j) => <KanbanCard key={j.id} job={j} onOpen={onOpen} onDragStart={noop} dragging={false} />)}
                {col.length === 0 && (
                  <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>ไม่มีงานในขั้นนี้</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { KanbanView, KanbanCard, KanbanMobile });
