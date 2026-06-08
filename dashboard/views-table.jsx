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
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
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

  if (isMobile) return <TableMobile jobs={sorted} sort={sort} setSort={setSort} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onSetStage={onSetStage} />;

  const th = (label, key, center) => {
    const active = key && sort.key === key;
    return (
      <th onClick={key ? () => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 })) : undefined}
        style={{ padding: "13px 14px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase",
          color: active ? "var(--primary-dark)" : "var(--text-3)", textAlign: center ? "center" : "left", whiteSpace: "nowrap",
          cursor: key ? "pointer" : "default", userSelect: "none", background: "var(--surface2)",
          position: "sticky", top: 0, zIndex: 2, borderBottom: "1px solid var(--border-strong)" }}>
        {label}{active && <span style={{ color: "var(--primary)" }}> {sort.dir > 0 ? "↑" : "↓"}</span>}
      </th>
    );
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {th("ลูกค้า", "name")}
              {th("ประเภท", "type", true)}
              {th("แบรนด์ / สเปก", "brand")}
              {th("ขนาด", "kw", true)}
              {th("ความพร้อมวัสดุ", "matReadyPct", true)}
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
                <td style={{ padding: "13px 14px", minWidth: 190 }}>
                  <button onClick={() => onOpen(j)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{j.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                      <span><Icon name="phone" size={10} style={{ verticalAlign: -1 }} /> {j.phone}</span>
                      <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}><Icon name="pin" size={10} style={{ verticalAlign: -1 }} /> {j.province}</span>
                    </div>
                  </button>
                </td>
                {/* type */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}><TypeBadge type={j.type} /></td>
                {/* brand/spec */}
                <td style={{ padding: "13px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{j.brand}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{j.battery ? "🔋 " + j.batSize : "ไม่มีแบต"}{j.backup ? " · Backup" : ""}</div>
                </td>
                {/* size */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{j.kw} kW</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{j.panels} แผง</div>
                </td>
                {/* material readiness — แถบความคืบหน้า + % (แก้รายชิ้นได้ใน drawer/ฟอร์ม) */}
                <td style={{ padding: "13px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ flex: 1, height: 7, borderRadius: 99, background: "var(--surface3)", overflow: "hidden", minWidth: 56 }}>
                      <span style={{ display: "block", height: "100%", width: j.matReadyPct + "%",
                        background: j.matReadyPct >= 100 ? "var(--primary)" : (j.matReadyPct > 0 ? "#F59E0B" : "transparent"),
                        borderRadius: 99, transition: "width .4s cubic-bezier(.2,.8,.2,1)" }} />
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)", minWidth: 36, textAlign: "right",
                      color: j.matReady ? "var(--primary-dark)" : "var(--text-2)" }}>{j.matReadyPct}%</span>
                  </div>
                </td>
                {/* stage */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}>
                  <select value={j.stage} onChange={(e) => onSetStage(j.id, e.target.value)}
                    style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 600, color: stageOf(j.stage).color,
                      background: stageOf(j.stage).soft, border: "1px solid " + stageOf(j.stage).color + "33", borderRadius: 8,
                      padding: "5px 8px", cursor: "pointer", outline: "none" }}>
                    {SF.STAGES.map((s) => <option key={s.key} value={s.key}>{s.th}</option>)}
                  </select>
                </td>
                {/* deadline */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: j.delayed ? "#EF4444" : "var(--text-2)" }}>{thDate(j.deadline, true)}</div>
                  {j.delayed ? <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>⚠ ล่าช้า</span>
                    : <span style={{ fontSize: 10, fontWeight: 600, color: "var(--primary-dark)" }}>ปกติ</span>}
                </td>
                {/* actions */}
                <td style={{ padding: "13px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
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

/* ── Mobile database — card list แทนตาราง 13 คอลัมน์ ── */
function TableMobile({ jobs, sort, setSort, onOpen, onEdit, onDelete, onSetStage }) {
  const SF = window.SF;
  const SORTS = [
    { key: "code", th: "รหัสงาน" },
    { key: "name", th: "ชื่อลูกค้า" },
    { key: "stage", th: "ขั้นตอน" },
    { key: "kw", th: "ขนาด (kW)" },
    { key: "deadline", th: "กำหนดเสร็จ" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* แถบเรียงลำดับ */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px 0" }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", flexShrink: 0 }}>เรียงตาม</span>
        <select value={sort.key} onChange={(e) => setSort((s) => ({ key: e.target.value, dir: s.dir }))}
          style={{ flex: 1, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: "var(--text-1)",
            background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 9, padding: "7px 10px", outline: "none" }}>
          {SORTS.map((o) => <option key={o.key} value={o.key}>{o.th}</option>)}
        </select>
        <button onClick={() => setSort((s) => ({ key: s.key, dir: -s.dir }))} title="สลับทิศ"
          style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 9, border: "1px solid var(--border-strong)",
            background: "var(--surface)", cursor: "pointer", color: "var(--text-2)", fontWeight: 700, fontSize: 15 }}>
          {sort.dir > 0 ? "↑" : "↓"}
        </button>
      </div>

      {jobs.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>ไม่พบข้อมูลงานที่ตรงกับการค้นหา</div>
      )}

      {jobs.map((j) => {
        const s = stageOf(j.stage);
        return (
          <div key={j.id} style={{ background: j.delayed ? "#FEF7F7" : "var(--surface)",
            border: "1px solid " + (j.delayed ? "#FBD3D3" : "var(--border)"), borderRadius: 14, padding: 13,
            borderLeft: "3px solid " + (j.delayed ? "#EF4444" : s.color), boxShadow: "var(--shadow-sm)" }}>
            {/* หัว: รหัส + ประเภท + ปุ่มจัดการ */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <button onClick={() => onOpen(j)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{j.code}</span>
                  <TypeBadge type={j.type} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.25 }}>{j.name}</div>
              </button>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => onEdit(j)} title="แก้ไข" style={actionBtn("#3B82F6")}><Icon name="settings" size={15} /></button>
                <button onClick={() => onDelete(j)} title="ลบ" style={actionBtn("#EF4444")}><Icon name="x" size={15} /></button>
              </div>
            </div>

            {/* ติดต่อ */}
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span><Icon name="phone" size={11} style={{ verticalAlign: -1 }} /> {j.phone}</span>
              <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}><Icon name="pin" size={11} style={{ verticalAlign: -1 }} /> {j.province}</span>
            </div>

            {/* สเปก */}
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{j.brand}</span>
              <span style={{ color: "var(--text-3)" }}>·</span>
              <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>{j.kw} kW</span>
              <span style={{ color: "var(--text-3)" }}>· {j.panels} แผง</span>
              {j.battery && <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}>· 🔋 {j.batSize}</span>}
              {j.backup && <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}>· Backup</span>}
            </div>

            {/* ตัวคั่น */}
            <div style={{ height: 1, background: "var(--border)", margin: "11px 0 10px" }} />

            {/* ท้าย: ขั้นตอน (select) + วัสดุ% + กำหนดเสร็จ */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <select value={j.stage} onChange={(e) => onSetStage(j.id, e.target.value)}
                style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: s.color,
                  background: s.soft, border: "1px solid " + s.color + "33", borderRadius: 8,
                  padding: "6px 9px", cursor: "pointer", outline: "none" }}>
                {SF.STAGES.map((st) => <option key={st.key} value={st.key}>{st.th}</option>)}
              </select>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MatDots mat={j.mat} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", color: j.matReady ? "var(--primary-dark)" : "var(--text-3)" }}>{j.matReadyPct}%</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontFamily: "var(--mono)", fontWeight: 600,
                color: j.delayed ? "#EF4444" : "var(--text-2)" }}>
                <Icon name="calendar" size={12} color={j.delayed ? "#EF4444" : "var(--text-3)"} />
                {thDate(j.deadline, true)}{j.delayed && " ⚠"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function actionBtn(color) {
  return { background: color + "14", border: "none", color, width: 30, height: 30, borderRadius: 8,
    cursor: "pointer", margin: "0 2px", display: "inline-grid", placeItems: "center", verticalAlign: "middle" };
}

Object.assign(window, { TableView, TableMobile });
