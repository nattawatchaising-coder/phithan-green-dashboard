/* ============================================================
   SolarFlow — Table view (the live database grid)
   Inline-editable material status & stage, edit / delete rows.
   ============================================================ */

const MAT_CYCLE = ["none", "waiting", "ready", "na"];

function MatCell({ status, onCycle }) {
  const m = window.SF.MAT_STATUS[status];
  return (
    <button onClick={onCycle} title="คลิกเพื่อเปลี่ยนสถานะ"
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 7,
        background: m.soft, color: m.color, fontWeight: 600, fontSize: 11, border: "1px solid " + m.color + "33",
        cursor: "pointer", fontFamily: "inherit", minWidth: 58, justifyContent: "center" }}>
      <span style={{ fontSize: 10 }}>{m.icon}</span>{m.th}
    </button>
  );
}

function TableView({ jobs, onOpen, onEdit, onDelete, onSetMat, onSetStage }) {
  const SF = window.SF;
  const [sort, setSort] = React.useState({ key: "code", dir: 1 });
  const sorted = React.useMemo(() => {
    const arr = jobs.slice();
    arr.sort((a, b) => {
      let av, bv;
      if (sort.key === "stage") { av = a.stageIdx; bv = b.stageIdx; }
      else if (sort.key === "kw") { av = a.kw; bv = b.kw; }
      else if (sort.key === "deadline") { av = a.deadline; bv = b.deadline; }
      else { av = a[sort.key]; bv = b[sort.key]; }
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
    return arr;
  }, [jobs, sort]);

  const th = (label, key, center) => (
    <th onClick={key ? () => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 })) : undefined}
      style={{ padding: "12px 12px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase",
        color: "var(--text-3)", textAlign: center ? "center" : "left", whiteSpace: "nowrap", cursor: key ? "pointer" : "default",
        userSelect: "none", background: "var(--surface2)" }}>
      {label}{key && sort.key === key && <span style={{ color: "var(--primary)" }}> {sort.dir > 0 ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1280 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {th("ลูกค้า", "name")}
              {th("ประเภท", "type", true)}
              {th("แบรนด์ / สเปก", "brand")}
              {th("ขนาด", "kw", true)}
              {SF.MATERIALS.map((m) => (
                <th key={m.key} style={{ padding: "12px 8px", fontSize: 10, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase",
                  color: "var(--text-3)", textAlign: "center", whiteSpace: "nowrap", background: "var(--surface2)" }}>{m.th}</th>
              ))}
              {th("ขั้นตอน", "stage", true)}
              {th("กำหนดเสร็จ", "deadline", true)}
              {th("จัดการ", null, true)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((j) => (
              <tr key={j.id} style={{ borderBottom: "1px solid var(--border)", background: j.delayed ? "#FEF7F7" : "transparent" }}
                onMouseEnter={(e) => { if (!j.delayed) e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = j.delayed ? "#FEF7F7" : "transparent"; }}>
                {/* customer */}
                <td style={{ padding: "11px 12px", minWidth: 190 }}>
                  <button onClick={() => onOpen(j)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{j.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                      <span><Icon name="phone" size={10} style={{ verticalAlign: -1 }} /> {j.phone}</span>
                      <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}><Icon name="pin" size={10} style={{ verticalAlign: -1 }} /> {j.province}</span>
                    </div>
                  </button>
                </td>
                {/* type */}
                <td style={{ padding: "11px 12px", textAlign: "center" }}><TypeBadge type={j.type} /></td>
                {/* brand/spec */}
                <td style={{ padding: "11px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{j.brand}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{j.battery ? "🔋 " + j.batSize : "ไม่มีแบต"}{j.backup ? " · Backup" : ""}</div>
                </td>
                {/* size */}
                <td style={{ padding: "11px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{j.kw} kW</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{j.panels} แผง</div>
                </td>
                {/* materials */}
                {SF.MATERIALS.map((m) => (
                  <td key={m.key} style={{ padding: "11px 6px", textAlign: "center" }}>
                    <MatCell status={j.mat[m.key]} onCycle={() => {
                      const cur = MAT_CYCLE.indexOf(j.mat[m.key]);
                      onSetMat(j.id, m.key, MAT_CYCLE[(cur + 1) % MAT_CYCLE.length]);
                    }} />
                  </td>
                ))}
                {/* stage */}
                <td style={{ padding: "11px 12px", textAlign: "center" }}>
                  <select value={j.stage} onChange={(e) => onSetStage(j.id, e.target.value)}
                    style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, color: stageOf(j.stage).color,
                      background: stageOf(j.stage).soft, border: "1px solid " + stageOf(j.stage).color + "33", borderRadius: 8,
                      padding: "5px 8px", cursor: "pointer", outline: "none" }}>
                    {SF.STAGES.map((s) => <option key={s.key} value={s.key}>{s.th}</option>)}
                  </select>
                </td>
                {/* deadline */}
                <td style={{ padding: "11px 12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: j.delayed ? "#EF4444" : "var(--text-2)" }}>{thDate(j.deadline, true)}</div>
                  {j.delayed ? <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>⚠ ล่าช้า</span>
                    : <span style={{ fontSize: 10, fontWeight: 600, color: "var(--primary-dark)" }}>ปกติ</span>}
                </td>
                {/* actions */}
                <td style={{ padding: "11px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                  <button onClick={() => onEdit(j)} title="แก้ไข" style={actionBtn("#3B82F6")}><Icon name="settings" size={15} /></button>
                  <button onClick={() => onDelete(j)} title="ลบ" style={actionBtn("#EF4444")}><Icon name="x" size={15} /></button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={20} style={{ padding: 50, textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>ไม่พบข้อมูลงานที่ตรงกับการค้นหา</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function actionBtn(color) {
  return { background: color + "14", border: "none", color, width: 30, height: 30, borderRadius: 8,
    cursor: "pointer", margin: "0 2px", display: "inline-grid", placeItems: "center", verticalAlign: "middle" };
}

Object.assign(window, { TableView });
