/* ============================================================
   PHITHAN GREEN — Site Survey list view (หน้ารวมงานสำรวจ)
   แสดงงานพร้อมสถานะการสำรวจ + เปิด wizard สำรวจหน้างาน
   ============================================================ */

function SurveyView({ jobs, role, onOpen, onToggleSkip }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("all"); // all | none | partial | done | skip

  const withStatus = React.useMemo(
    () => jobs.map((j) => ({ job: j, st: window.surveyStatus(j) })),
    [jobs]
  );
  const counts = React.useMemo(() => {
    const c = { all: withStatus.length, none: 0, partial: 0, done: 0, skip: 0 };
    withStatus.forEach((x) => { c[x.st.state] = (c[x.st.state] || 0) + 1; });
    return c;
  }, [withStatus]);

  const shown = React.useMemo(() => {
    const arr = filter === "all" ? withStatus.slice() : withStatus.filter((x) => x.st.state === filter);
    // ยังไม่สำรวจ → บางส่วน → ครบ → ไม่ต้องสำรวจ (งานที่ต้องทำขึ้นก่อน)
    const order = { none: 0, partial: 1, done: 2, skip: 3 };
    arr.sort((a, b) => (order[a.st.state] - order[b.st.state]) || (a.job.name || "").localeCompare(b.job.name || ""));
    return arr;
  }, [withStatus, filter]);

  const FILTERS = [
    { key: "all", label: "ทั้งหมด", color: "var(--text-2)" },
    { key: "none", label: "ยังไม่สำรวจ", color: "#94A3B8" },
    { key: "partial", label: "สำรวจบางส่วน", color: "#F59E0B" },
    { key: "done", label: "สำรวจครบ", color: "#16A34A" },
    { key: "skip", label: "ไม่ต้องสำรวจ", color: "#64748B" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* สรุป + ตัวกรองสถานะ */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
        {FILTERS.map((ff) => {
          const active = filter === ff.key;
          return (
            <button key={ff.key} onClick={() => setFilter(ff.key)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "6px 12px" : "7px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
                border: "1px solid " + (active ? ff.color : "var(--border-strong)"),
                background: active ? ff.color + "16" : "var(--surface)", color: active ? ff.color : "var(--text-2)" }}>
              {ff.key !== "all" && <span style={{ width: 7, height: 7, borderRadius: 99, background: ff.color }} />}
              {ff.label}
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", opacity: active ? 1 : .6 }}>{counts[ff.key] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* รายการงาน */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
            ไม่มีงานในสถานะนี้
          </div>
        )}
        {shown.map(({ job, st }) => {
          const isSkip = st.state === "skip";
          const toggleSkip = (e) => { e.stopPropagation(); onToggleSkip && onToggleSkip(job); };
          return (
          <div key={job.id} role="button" tabIndex={0} onClick={() => onOpen(job)}
            style={{ display: "flex", alignItems: "center", gap: 13, padding: 14, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-sm)", opacity: isSkip ? 0.72 : 1 }}>
            {/* สถานะวงกลม */}
            <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "grid", placeItems: "center", background: st.color + "1c", color: st.color }}>
              {st.state === "done" ? <Icon name="check" size={20} color={st.color} sw={2.4} />
                : isSkip ? <Icon name="check" size={19} color={st.color} sw={2.2} />
                : st.state === "partial" ? <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--mono)" }}>{st.pct}%</span>
                : <Icon name="pin" size={18} color={st.color} />}
            </span>
            {/* ข้อมูลงาน */}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>
                {job.code} · {job.province || "-"}{job.brand ? " · " + job.brand : ""}
              </span>
              {/* progress bar */}
              <span style={{ display: "block", marginTop: 7, height: 5, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: st.pct + "%", background: st.color, borderRadius: 99, transition: "width .3s" }} />
              </span>
            </span>
            {/* ป้ายสถานะ + action */}
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: st.color, background: st.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{st.label}</span>
              {!isSkip && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--primary-dark)" }}>
                  {st.state === "none" ? "เริ่มสำรวจ" : "แก้ไข"} <Icon name="chevronRight" size={14} color="var(--primary-dark)" />
                </span>
              )}
              {onToggleSkip && (isSkip
                ? <button onClick={toggleSkip} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--text-2)", background: "var(--surface2)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    <Icon name="history" size={12} color="var(--text-2)" /> เข้าคิวสำรวจ
                  </button>
                : <button onClick={toggleSkip} title="ทำเครื่องหมายว่าสำรวจแล้ว/ไม่ต้องสำรวจ" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#16A34A", background: "#16A34A14", border: "1px solid #16A34A44", borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    <Icon name="check" size={12} color="#16A34A" sw={2.6} /> ไม่ต้องสำรวจ
                  </button>
              )}
            </span>
          </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { SurveyView });
