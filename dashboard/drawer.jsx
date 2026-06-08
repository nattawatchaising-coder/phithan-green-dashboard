/* ============================================================
   SolarFlow — Detail Drawer (flow timeline + full customer info)
   ============================================================ */

function FlowTimeline({ job }) {
  const SF = window.SF;
  return (
    <div style={{ position: "relative", paddingLeft: 4 }}>
      {job.timeline.map((step, i) => {
        const s = SF.STAGES[i];
        const isDone = step.status === "done";
        const isCurrent = step.status === "current";
        const isLast = i === job.timeline.length - 1;
        const dotColor = step.blocked ? "#EF4444" : (isDone || isCurrent) ? s.color : "var(--surface3)";
        return (
          <div key={step.key} style={{ display: "flex", gap: 14, position: "relative" }}>
            {/* connector + dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0,
                background: (isDone || isCurrent) && !step.blocked ? s.color : step.blocked ? "#FDE2E2" : "var(--surface3)",
                border: isCurrent ? "2px solid " + (step.blocked ? "#EF4444" : s.color) : "2px solid transparent",
                color: "#fff", display: "grid", placeItems: "center",
                boxShadow: isCurrent ? "0 0 0 4px " + (step.blocked ? "#EF444422" : s.color + "22") : "none" }}>
                {isDone ? <Icon name="check" size={14} color="#fff" sw={2.5} />
                  : step.blocked ? <Icon name="alert" size={13} color="#EF4444" />
                  : isCurrent ? <span style={{ width: 8, height: 8, borderRadius: 99, background: "#fff" }} />
                  : <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--text-3)" }} />}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: 26,
                background: isDone ? s.color : "var(--border)", marginTop: 2, marginBottom: 2 }} />}
            </div>
            {/* content */}
            <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1, marginTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 600,
                  color: isDone || isCurrent ? "var(--text-1)" : "var(--text-3)" }}>{s.th}</span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{s.en}</span>
                {isCurrent && !step.blocked && <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color,
                  background: s.soft, padding: "2px 8px", borderRadius: 99 }}>ขั้นปัจจุบัน</span>}
                {step.blocked && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444",
                  background: "#FDE2E2", padding: "2px 8px", borderRadius: 99 }}>⚠ ติดปัญหา</span>}
              </div>
              {(step.at || step.date) && (isDone || isCurrent) && (
                // เวลาจริงที่กดเลื่อนเข้า stage นี้ (วัน + เวลา)
                <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="check" size={12} color={s.color} sw={2.5} />
                  {step.at ? thDateTime(step.at) : thDate(step.date, true)}
                </div>
              )}
              {step.blocked && job.problem && (
                <div style={{ marginTop: 8, padding: "10px 12px", background: "#FEF2F2", border: "1px solid #FECACA",
                  borderRadius: 10, fontSize: 12.5, color: "#B91C1C", lineHeight: 1.5 }}>{job.problem}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em", color: "var(--text-3)", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>{children}</span>
    </div>
  );
}

function DetailDrawer({ job, onClose, onAdvance, onSetMat, onEdit }) {
  const SF = window.SF;
  const open = !!job;

  /* loading state — กดปุ่มแล้วแสดง "กำลังบันทึก..." ทันที
     reset เมื่อ Firebase confirm แล้ว (job.stage เปลี่ยน) */
  const [advancing, setAdvancing] = React.useState(false);
  React.useEffect(() => { setAdvancing(false); }, [job ? job.stage : null]);

  const handleAdvance = () => {
    if (advancing) return;
    setAdvancing(true);
    onAdvance(job.id);
    // safety reset: ถ้า Firebase ไม่ตอบใน 6s ให้ปลดล็อกปุ่ม
    setTimeout(() => setAdvancing(false), 6000);
  };
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.34)",
        backdropFilter: "blur(2px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity .3s", zIndex: 80 }} />
      <aside style={{ position: "fixed", top: 0, right: 0, width: "min(540px, 94vw)",
        height: "100dvh", maxHeight: "100dvh",
        background: "var(--bg)", boxShadow: "-20px 0 60px rgba(8,20,14,.18)", zIndex: 90,
        transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform .34s cubic-bezier(.3,.9,.3,1)",
        display: "flex", flexDirection: "column" }}>
        {job && (
          <React.Fragment>
            {/* header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--primary-dark)",
                      background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 6 }}>{job.code}</span>
                    <TypeBadge type={job.type} />
                    {job.delayed && <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", background: "#FDE2E2", padding: "2px 8px", borderRadius: 6 }}>⚠ ล่าช้า</span>}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", margin: 0, lineHeight: 1.2 }}>{job.name}</h2>
                </div>
                <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
                  background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}>
                  <Icon name="x" size={18} />
                </button>
              </div>
              {/* progress */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <StageBadge stageKey={job.stage} />
                <div style={{ flex: 1 }}><ProgressBar pct={job.progressPct} color={stageOf(job.stage).color} /></div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>{job.progressPct}%</span>
              </div>
            </div>

            {/* body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "22px 24px" }}>
              {/* customer info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <InfoRow label="เบอร์โทร">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={13} color="var(--text-3)" />{job.phone}</span>
                </InfoRow>
                <InfoRow label="วันนัดติดตั้ง">{thDate(job.deadline, true)}</InfoRow>
                <div style={{ gridColumn: "1 / -1" }}>
                  <InfoRow label="ที่อยู่ / พิกัด">
                    {job.address}, {job.province}{"  "}
                    <a href={job.map} target="_blank" rel="noreferrer" style={{ color: "var(--primary-dark)", textDecoration: "none", fontWeight: 600, fontSize: 12, marginLeft: 4 }}>
                      <Icon name="pin" size={12} style={{ verticalAlign: -1 }} /> เปิดแผนที่
                    </a>
                  </InfoRow>
                </div>
                <InfoRow label="ช่างผู้รับผิดชอบ"><TechAvatar techId={job.tech} size={24} showName /></InfoRow>
                <InfoRow label="ประเภทงาน">{job.type === "home" ? "งานบ้าน" : "งานโครงการ"}</InfoRow>
              </div>

              {/* spec card */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="sun" size={14} color="var(--primary)" /> สเปกระบบ
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  <SpecItem label="แบรนด์" value={job.brand} />
                  <SpecItem label="ขนาดระบบ" value={job.kw + " kW"} mono />
                  <SpecItem label="จำนวนแผง" value={job.panels + " แผง"} mono />
                  <SpecItem label="แบตเตอรี่" value={job.battery ? job.batSize : "ไม่มี"} accent={job.battery} />
                  <SpecItem label="ระบบ / ออฟติไมเซอร์" value={job.connect} />
                  <SpecItem label="ระบบ Backup" value={job.backup ? "Backup ✓" : "ไม่มี"} accent={job.backup} />
                </div>
              </div>

              {/* material checklist */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="box" size={14} color="var(--text-2)" /> สถานะวัสดุ
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0, textTransform: "none", color: "var(--text-3)", marginLeft: 2 }}>· แตะเพื่อแก้ไข</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: job.matReady ? "var(--primary-dark)" : "var(--text-2)" }}>
                    พร้อม {job.matReadyPct}%
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SF.MATERIALS.filter((m) => {
                    if (m.key === "battery" && !job.battery) return false;
                    if (m.key === "backup" && !job.backup) return false;
                    return true;
                  }).map((m) => {
                    const MAT_CYCLE = ["none", "waiting", "ready", "na"];
                    const cycle = () => {
                      const cur = MAT_CYCLE.indexOf(job.mat[m.key]);
                      onSetMat(job.id, m.key, MAT_CYCLE[(cur + 1) % MAT_CYCLE.length]);
                    };
                    return (
                      <button key={m.key} onClick={cycle} title="คลิกเพื่อเปลี่ยนสถานะ"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                        padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "border-color .15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--border-strong)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
                        <span style={{ fontSize: 12.5, color: "var(--text-1)", fontWeight: 500 }}>{m.th}</span>
                        <MatChip status={job.mat[m.key]} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* flow timeline */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="flow" size={14} color="var(--text-2)" /> Flow การทำงาน
                </div>
                <FlowTimeline job={job} />
              </div>

              {job.note && (
                <div style={{ padding: "12px 14px", background: "var(--surface2)", border: "1px dashed var(--border-strong)", borderRadius: 10, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                  <strong style={{ color: "var(--text-1)" }}>หมายเหตุ:</strong> {job.note}
                </div>
              )}
            </div>

            {/* footer action — เผื่อ safe-area ด้านล่าง กันแถบเบราว์เซอร์มือถือบังปุ่ม */}
            <div style={{ padding: "14px 24px", paddingBottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
              borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10, flexShrink: 0 }}>
              <button onClick={onClose} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)",
                background: "var(--surface)", color: "var(--text-2)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
              <button onClick={() => onEdit(job.id)} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)",
                background: "var(--surface)", color: "var(--text-1)", fontWeight: 600, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Icon name="settings" size={15} color="var(--text-2)" /> แก้ไขข้อมูล
              </button>
              {job.stage !== "done" && (
                <button onClick={handleAdvance} disabled={advancing}
                  style={{ flex: 1, padding: "11px 16px", borderRadius: 11, border: "none",
                    background: advancing ? "var(--primary-dark)" : "var(--primary)",
                    color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5,
                    cursor: advancing ? "default" : "pointer", opacity: advancing ? 0.82 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "background .15s, opacity .15s" }}>
                  {advancing
                    ? "กำลังบันทึก..."
                    : <React.Fragment>เลื่อนขั้น "{SF.STAGES[Math.min(job.stageIdx + 1, SF.STAGES.length - 1)].th}" <Icon name="arrowRight" size={16} color="#fff" /></React.Fragment>
                  }
                </button>
              )}
            </div>
          </React.Fragment>
        )}
      </aside>
    </React.Fragment>
  );
}

function SpecItem({ label, value, mono, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: mono ? "var(--mono)" : "inherit",
        color: accent ? "var(--primary-dark)" : "var(--text-1)" }}>{value}</span>
    </div>
  );
}

Object.assign(window, { DetailDrawer, FlowTimeline });
