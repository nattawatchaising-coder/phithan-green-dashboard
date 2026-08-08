/* ============================================================
   SolarFlow — Table view (the live database grid)
   Inline-editable material status & stage, edit / delete rows.
   ============================================================ */

const MAT_CYCLE = ["none", "waiting", "ready", "na"];

function MatCell({ status, onCycle }) {
  const m = window.SF.MAT_STATUS[status];
  return (
    <button onClick={onCycle} title="คลิกเพื่อเปลี่ยนสถานะ"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99,
        background: m.soft, color: m.fg, fontWeight: 700, fontSize: 11, border: "1px solid transparent",
        cursor: "pointer", fontFamily: "inherit", minWidth: 58, justifyContent: "center" }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: m.color, flexShrink: 0 }} />{m.th}
    </button>
  );
}

function TableView({ jobs, onOpen, onEdit, onDelete, onSetMat, onSetStage }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [sort, setSort] = React.useState({ key: "code", dir: 1 });
  const [tab, setTab] = React.useState("active"); // active | done | all — แยกงานที่เสร็จแล้วออก

  const counts = React.useMemo(() => ({
    active: jobs.filter((j) => j.stage !== "done").length,
    done:   jobs.filter((j) => j.stage === "done").length,
    all:    jobs.length,
  }), [jobs]);

  const sorted = React.useMemo(() => {
    const arr = jobs.filter((j) => tab === "all" ? true : tab === "done" ? j.stage === "done" : j.stage !== "done");
    arr.sort((a, b) => {
      let av, bv;
      if (sort.key === "stage") { av = a.stageIdx; bv = b.stageIdx; }
      else if (sort.key === "kw") { av = a.kw; bv = b.kw; }
      else if (sort.key === "deadline") { av = a.deadline; bv = b.deadline; }
      else { av = a[sort.key]; bv = b[sort.key]; }
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
    return arr;
  }, [jobs, sort, tab]);

  if (isMobile) return (
    <React.Fragment>
      <StatusTabs tab={tab} setTab={setTab} counts={counts} />
      <TableMobile jobs={sorted} sort={sort} setSort={setSort} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onSetStage={onSetStage} />
    </React.Fragment>
  );

  /* หัวตาราง — พื้นสีขาวเหมือนตัวตาราง คั่นด้วยเส้นผมเส้นเดียว
     คอลัมน์ที่เรียงอยู่จะเป็นสีเขียวพร้อมลูกศร ส่วนคอลัมน์อื่นขึ้นลูกศรจาง ๆ ตอนชี้ ให้รู้ว่ากดเรียงได้ */
  const th = (label, key, center) => {
    const active = key && sort.key === key;
    return (
      <th onClick={key ? () => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 })) : undefined}
        onMouseEnter={key ? (e) => { const c = e.currentTarget.querySelector("i"); if (c) c.style.opacity = active ? 1 : .45; } : undefined}
        onMouseLeave={key ? (e) => { const c = e.currentTarget.querySelector("i"); if (c) c.style.opacity = active ? 1 : 0; } : undefined}
        style={{ padding: "12px 14px", fontSize: 10, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase",
          color: active ? "var(--primary-dark)" : "var(--text-3)", textAlign: center ? "center" : "left", whiteSpace: "nowrap",
          cursor: key ? "pointer" : "default", userSelect: "none", background: "var(--surface)",
          position: "sticky", top: 0, zIndex: 2, boxShadow: "inset 0 -1px 0 var(--border)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: center ? "center" : "flex-start" }}>
          {label}
          {key && <i style={{ opacity: active ? 1 : 0, transition: "opacity .14s", display: "inline-flex",
            transform: active && sort.dir < 0 ? "rotate(180deg)" : "none" }}>
            <Icon name="chevronDown" size={11} color={active ? "var(--primary)" : "var(--text-3)"} sw={2.5} />
          </i>}
        </span>
      </th>
    );
  };

  return (
    <React.Fragment>
    <StatusTabs tab={tab} setTab={setTab} counts={counts} />
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
              {th("วันติดตั้ง", "deadline", true)}
              {th("จัดการ", null, true)}
            </tr>
          </thead>
          <tbody>
            {sorted.map((j) => (
              /* เดิมงานล่าช้าทาพื้นชมพูทั้งแถว — กวาดตาหายาก และสีตายตัวไม่เข้ากับโหมดกลางคืน
                 เปลี่ยนเป็นขีดแดงบาง ๆ ที่ต้นแถว เห็นชัดพอ ๆ กันแต่ไม่รบกวนการอ่านข้อมูล */
              <tr key={j.id} style={{ borderBottom: "1px solid var(--border)", background: "transparent", transition: "background .12s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                {/* customer */}
                <td style={{ padding: "12px 14px 12px 0", minWidth: 200 }}>
                  <span style={{ display: "flex", alignItems: "stretch", gap: 11 }}>
                    <span style={{ width: 3, borderRadius: "0 99px 99px 0", flexShrink: 0,
                      background: j.delayed ? "#D93025" : (j.problem ? "#F59E0B" : "transparent") }} />
                    <button onClick={() => onOpen(j)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.01em", lineHeight: 1.3 }}>{j.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "var(--mono)", letterSpacing: "-.01em" }}>{j.code}</span>
                        {j.province ? " · " + j.province : ""}{j.phone ? " · " + j.phone : ""}
                      </div>
                    </button>
                  </span>
                </td>
                {/* type */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}><TypeBadge type={j.type} /></td>
                {/* brand/spec */}
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{j.brand}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                    {j.battery ? <Icon name="battery" size={11} color="var(--primary-dark)" /> : null}
                    {j.battery ? j.batSize : "ไม่มีแบต"}{j.backup ? " · Backup" : ""}
                  </div>
                </td>
                {/* size — เดิมซ้อน 3 บรรทัด แถวเลยสูงเกินจำเป็น · ยุบเหลือเลขเด่น 1 ตัว + บรรทัดรองบรรทัดเดียว */}
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, letterSpacing: "-.03em",
                    fontVariantNumeric: "tabular-nums", color: "var(--text-1)" }}>{j.kw}<span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--text-3)", marginLeft: 2 }}>kW</span></div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", marginTop: 2 }}>{j.panels} แผง · {(j.phase || "1")} เฟส</div>
                </td>
                {/* material readiness — แถบความคืบหน้า + % (แก้รายชิ้นได้ใน drawer/ฟอร์ม) */}
                <td style={{ padding: "13px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ flex: 1, height: 7, borderRadius: 99, background: "var(--surface3)", overflow: "hidden", minWidth: 56 }}>
                      <span style={{ display: "block", height: "100%", width: j.matReadyPct + "%",
                        background: j.matReadyPct >= 100 ? "var(--primary)" : (j.matReadyPct > 0 ? "#F59E0B" : "transparent"),
                        borderRadius: 99, transition: "width .4s cubic-bezier(.2,.8,.2,1)" }} />
                    </span>
                    <span style={{ fontFamily: "var(--display)", fontSize: 12.5, fontWeight: 700, letterSpacing: "-.02em",
                      fontVariantNumeric: "tabular-nums", minWidth: 38, textAlign: "right",
                      color: j.matReady ? "var(--primary-dark)" : "var(--text-2)" }}>{j.matReadyPct}%</span>
                  </div>
                </td>
                {/* stage */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}>
                  <select value={j.stage} onChange={(e) => onSetStage(j.id, e.target.value)}
                    style={{ fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, color: stageOf(j.stage).fg,
                      background: stageOf(j.stage).soft, border: "1px solid transparent", borderRadius: 99,
                      padding: "5px 10px", cursor: "pointer", outline: "none" }}>
                    {SF.STAGES.map((s) => <option key={s.key} value={s.key}>{s.th}</option>)}
                  </select>
                </td>
                {/* deadline */}
                <td style={{ padding: "13px 14px", textAlign: "center" }}>
                  {/* "ปกติ" ไม่ได้บอกอะไรเพิ่ม — ตัดออก ให้ป้ายขึ้นเฉพาะตอนล่าช้าจริง จะได้สะดุดตา */}
                  {j.startDate ? (
                    <React.Fragment>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, letterSpacing: "-.01em",
                        color: j.delayed ? "#D93025" : "var(--text-2)" }}>{thDate(j.startDate, true)}{j.deadline && j.deadline !== j.startDate ? "–" + thDate(j.deadline, true) : ""}</div>
                      {j.delayed && <span style={{ display: "inline-block", marginTop: 3, fontSize: 9.5, fontWeight: 800, letterSpacing: ".02em",
                        color: "#D93025", background: "rgba(217,48,37,.11)", padding: "2px 7px", borderRadius: 99 }}>ล่าช้า</span>}
                    </React.Fragment>
                  ) : <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>ยังไม่นัด</span>}
                </td>
                {/* actions */}
                <td style={{ padding: "13px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                  <button onClick={() => onEdit(j)} title="แก้ไข" style={actionBtn("#3B82F6")} {...actionHover("#3B82F6")}><Icon name="settings" size={15} /></button>
                  <button onClick={() => onDelete(j)} title="ลบ" style={actionBtn("#EF4444")} {...actionHover("#EF4444")}><Icon name="x" size={15} /></button>
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
    </React.Fragment>
  );
}

/* ── แท็บแยกสถานะงาน: กำลังดำเนินการ / เสร็จแล้ว / ทั้งหมด ── */
function StatusTabs({ tab, setTab, counts }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  const opts = [
    { key: "active", label: "กำลังดำเนินการ", n: counts.active },
    { key: "done",   label: "เสร็จแล้ว",      n: counts.done },
    { key: "all",    label: "ทั้งหมด",        n: counts.all },
  ];
  return (
    <div style={{ display: "flex", gap: mob ? 6 : 8, marginBottom: 14, flexWrap: "nowrap" }}>
      {opts.map((o) => {
        const active = tab === o.key;
        return (
          <button key={o.key} onClick={() => setTab(o.key)}
            /* ชุดเดียวกับชิปกรองขั้นงานบนหัวหน้า: ไม่มีเส้นขอบ พื้นจาง ที่เลือกอยู่ค่อยเป็นเขียว */
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: mob ? 5 : 7,
              padding: mob ? "8px 8px" : "8px 15px", borderRadius: 99, flex: mob ? "1 1 0" : "0 0 auto", minWidth: 0,
              border: "1px solid " + (active ? "var(--primary)" : "transparent"),
              background: active ? "var(--primary-soft)" : "var(--surface2)",
              color: active ? "var(--primary-dark)" : "var(--text-2)", fontWeight: active ? 700 : 600,
              fontSize: mob ? 12 : 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              transition: "background .15s, color .15s" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>
            <span style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 800, letterSpacing: "-.02em",
              fontVariantNumeric: "tabular-nums", flexShrink: 0, opacity: active ? 1 : .5 }}>{o.n}</span>
          </button>
        );
      })}
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
    { key: "deadline", th: "วันติดตั้ง" },
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
            border: "1px solid " + (j.delayed ? "var(--tint-red-bd2)" : "var(--border)"), borderRadius: 14, padding: 13,
            borderLeft: "3px solid " + (j.delayed ? "var(--mark-danger)" : s.color), boxShadow: "var(--shadow-sm)" }}>
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
              <span style={{ color: "var(--text-3)" }}>· {(j.phase || "1")} เฟส</span>
              {j.battery && <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}>· 🔋 {j.batSize}</span>}
              {j.backup && <span style={{ color: "var(--primary-dark)", fontWeight: 600 }}>· Backup</span>}
            </div>

            {/* ตัวคั่น */}
            <div style={{ height: 1, background: "var(--border)", margin: "11px 0 10px" }} />

            {/* ท้าย: ขั้นตอน (select) + วัสดุ% + กำหนดเสร็จ */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <select value={j.stage} onChange={(e) => onSetStage(j.id, e.target.value)}
                style={{ fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: s.fg,
                  background: s.soft, border: "1px solid " + s.color + "33", borderRadius: 8,
                  padding: "6px 9px", cursor: "pointer", outline: "none" }}>
                {SF.STAGES.map((st) => <option key={st.key} value={st.key}>{st.th}</option>)}
              </select>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MatDots mat={j.mat} />
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", color: j.matReady ? "var(--primary-dark)" : "var(--text-3)" }}>{j.matReadyPct}%</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontFamily: "var(--mono)", fontWeight: 600,
                color: j.startDate ? (j.delayed ? "#EF4444" : "var(--text-2)") : "var(--text-3)" }}>
                <Icon name="calendar" size={12} color={j.startDate ? (j.delayed ? "#EF4444" : "var(--text-3)") : "var(--text-3)"} />
                {j.startDate ? thDate(j.startDate, true) + (j.deadline && j.deadline !== j.startDate ? "–" + thDate(j.deadline, true) : "") + (j.delayed ? " ⚠" : "") : "ยังไม่นัด"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ปุ่มจัดการ — เงียบไว้ก่อน (เทา) ค่อยติดสีตอนเอาเมาส์ชี้
   เดิมทาสีฟ้า/แดงทุกแถวตลอดเวลา ทำให้สายตาวิ่งไปที่ปุ่มแทนที่จะเป็นข้อมูลงาน */
function actionBtn(color) {
  return { background: "transparent", border: "1px solid var(--border)", color: "var(--text-3)", width: 30, height: 30, borderRadius: 9,
    cursor: "pointer", margin: "0 2px", display: "inline-grid", placeItems: "center", verticalAlign: "middle",
    transition: "background .13s, color .13s, border-color .13s" };
}
function actionHover(color) {
  return {
    onMouseEnter: (e) => { e.currentTarget.style.background = color + "16"; e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color + "44"; },
    onMouseLeave: (e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; },
  };
}

Object.assign(window, { TableView, TableMobile });
