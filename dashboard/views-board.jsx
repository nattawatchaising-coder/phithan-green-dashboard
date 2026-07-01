/* ============================================================
   SolarFlow — Kanban board (drag cards across the 8 stages)
   ============================================================ */

// เรียงการ์ดในแต่ละคอลัมน์ตามวันติดตั้ง (ใครก่อนอยู่บน) · งานที่ยังไม่ระบุวันไว้ท้ายสุด
function byInstallDate(a, b) {
  return (a.startDate || "9999-99-99").localeCompare(b.startDate || "9999-99-99");
}

function KanbanCard({ job, onOpen, onDragStart, dragging }) {
  const s = stageOf(job.stage);
  return (
    <div draggable onDragStart={(e) => onDragStart(e, job)} onClick={() => onOpen(job)}
      style={{ background: "var(--surface)", border: "1px solid " + (job.problem ? "#FBD3D3" : "var(--border)"),
        borderRadius: 13, padding: 13, cursor: "grab", boxShadow: "var(--shadow-sm)", opacity: dragging ? 0.4 : 1,
        borderLeft: "3px solid " + (job.problem ? "#EF4444" : s.color), transition: "box-shadow .15s, transform .15s" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(8,20,14,.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7, gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{job.code}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {job.trello && (
            <a href={job.trello} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title="เปิดการ์ด Trello"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: "#fff",
                background: "#0079BF", padding: "3px 8px", borderRadius: 6, textDecoration: "none" }}>
              <Icon name="trello" size={11} color="#fff" /> Trello
            </a>
          )}
          <TypeBadge type={job.type} />
        </span>
      </div>
      {(job.hasDesign || job.hasBoq) && (
        <div style={{ display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
          {job.hasDesign && <DocChip job={job} kind="design" label="แบบ" color="#2563EB" soft="#2563EB14" />}
          {job.hasBoq && <DocChip job={job} kind="boq" label="BOQ" color="#0D9488" soft="#0D948814" />}
        </div>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.25, marginBottom: 2 }}>{job.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-3)", marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden" }}>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          <Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {job.province} · <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{job.brand}</span>
        </span>
        {job.birdnet && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, flexShrink: 0, fontSize: 10.5, fontWeight: 700,
            color: "#0D9488", background: "#0D948814", border: "1px solid #0D948844", padding: "2px 7px", borderRadius: 99 }}>
            <Icon name="net" size={10} color="#0D9488" />กันนก
          </span>
        )}
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
      <div style={{ display: "flex", gap: 6, marginBottom: 11, flexWrap: "wrap" }}>
        <Stat icon="bolt" text={job.kw + " kW"} />
        <Stat icon="panel" text={job.panels + " แผง"} />
        <Stat icon="power" text={(job.phase || "1") + " เฟส"} />
        {job.battery && <Stat icon="battery" text={job.batSize} accent />}
        {(job.brand || "").toUpperCase().includes("ATMOCE") && job.comboType === "assembled" && <Stat icon="box" text="ตู้ประกอบ" />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)", gap: 8, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <TechAvatar techId={job.tech} size={24} />
          {job.startDate
            ? <span style={{ fontSize: 11.5, fontWeight: 600, color: job.delayed ? "#EF4444" : "var(--text-2)" }}>{thDate(job.startDate)}</span>
            : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#B45309", background: "#FEF3C7", border: "1px solid #FCD34D", padding: "2px 7px", borderRadius: 99, whiteSpace: "nowrap" }}><Icon name="alert" size={10} color="#B45309" /> ยังไม่ระบุวันติดตั้ง</span>}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <MatDots mat={job.mat} />
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", color: job.matReady ? "var(--primary-dark)" : "var(--text-3)" }}>{job.matReadyPct}%</span>
        </span>
      </div>
      {job.stage === "install" && <DailyReportButton job={job} />}
    </div>
  );
}

function DocChip({ job, kind, label, color, soft }) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} title={"ดู" + label}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700,
          color: color, background: soft, border: "1px solid " + color + "44", padding: "2px 7px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit" }}>
        <Icon name="file" size={10} color={color} />{label}
      </button>
      {open && ReactDOM.createPortal(<DocViewer job={job} kind={kind} label={label} color={color} onClose={() => setOpen(false)} />, document.body)}
    </React.Fragment>
  );
}

/* ดูไฟล์ PDF (แบบ / BOQ) จากการ์ดได้เลย — โหลด media เฉพาะตอนเปิด
   มือถือบางตัว iframe PDF ไม่เรนเดอร์ → มีปุ่ม เปิดเต็มจอ/ดาวน์โหลด เป็นทางสำรอง */
function DocViewer({ job, kind, label, color, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const media = useJobMedia(job.id);
  const files = (media.files || []).filter((f) => f.kind === kind);
  const [idx, setIdx] = React.useState(0);
  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setSlow(true), 5000); return () => clearTimeout(t); }, []);
  const cur = files[idx] || files[0];
  const blobUrl = React.useMemo(() => { try { return cur ? dataUrlToBlobUrl(cur.dataUrl) : null; } catch (e) { return null; } }, [cur && cur.id]);
  React.useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);
  const download = () => { if (!blobUrl) return; const a = document.createElement("a"); a.href = blobUrl; a.download = cur.name || (label + ".pdf"); document.body.appendChild(a); a.click(); a.remove(); };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.5)", backdropFilter: "blur(3px)", zIndex: 130, display: "grid", placeItems: isMobile ? "stretch" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : 16, width: isMobile ? "100%" : "min(900px,96vw)", height: isMobile ? "100%" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: color + "16", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="file" size={16} color={color} /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: color, letterSpacing: ".04em" }}>{label} · {job.code}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cur ? cur.name : "กำลังโหลด…"}</div>
          </div>
          {blobUrl && <button onClick={() => window.open(blobUrl, "_blank", "noopener")} title="เปิดเต็มจอ"
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="link" size={16} color="var(--text-2)" /></button>}
          {blobUrl && <button onClick={download} title="ดาวน์โหลด"
            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="download" size={16} color="var(--text-2)" /></button>}
          <button onClick={onClose} title="ปิด" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        {/* แท็บไฟล์ (กรณีแนบหลายไฟล์) */}
        {files.length > 1 && (
          <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "var(--surface)", overflowX: "auto", flexShrink: 0 }}>
            {files.map((f, i) => (
              <button key={f.id} onClick={() => setIdx(i)} style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                border: "1px solid " + (i === idx ? color : "var(--border-strong)"), background: i === idx ? color + "14" : "var(--surface)", color: i === idx ? color : "var(--text-2)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</button>
            ))}
          </div>
        )}
        {/* เนื้อหา */}
        <div style={{ flex: 1, minHeight: 0, background: "var(--surface2)", display: "grid" }}>
          {blobUrl
            ? <iframe key={cur.id} src={blobUrl} title={cur.name} style={{ width: "100%", height: "100%", border: "none" }} />
            : <div style={{ placeSelf: "center", textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: 24 }}>
                {slow ? <React.Fragment><Icon name="alert" size={22} color="var(--text-3)" /><div style={{ marginTop: 8 }}>ไม่พบไฟล์ {label} (อาจถูกลบไปแล้ว)</div></React.Fragment>
                      : <React.Fragment><div style={{ width: 26, height: 26, border: "3px solid var(--border)", borderTopColor: color, borderRadius: "50%", margin: "0 auto 10px", animation: "spin .8s linear infinite" }} />กำลังโหลดไฟล์…</React.Fragment>}
              </div>}
        </div>
        {isMobile && blobUrl && (
          <div style={{ padding: "10px 14px calc(10px + env(safe-area-inset-bottom,0px))", borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
            <button onClick={() => window.open(blobUrl, "_blank", "noopener")} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: color, color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Icon name="link" size={16} color="#fff" /> เปิดเต็มจอ</button>
            <button onClick={download} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="download" size={16} color="var(--text-2)" /></button>
          </div>
        )}
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
        const col = jobs.filter((j) => j.stage === s.key).sort(byInstallDate);
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
        const col = jobs.filter((j) => j.stage === s.key).sort(byInstallDate);
        // ค่าเริ่มต้น: พับทุกขั้น (เห็นจำนวน+⚠ เพื่อสแกนง่าย) แล้วค่อยกดเปิดทีละขั้น
        const isOpen = collapsed[s.key] !== undefined ? !collapsed[s.key] : false;
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
