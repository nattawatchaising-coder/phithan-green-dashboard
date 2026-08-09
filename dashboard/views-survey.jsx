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
    { key: "done", label: "สำรวจครบ", color: "var(--tint-green-tx)" },
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
                : <button onClick={toggleSkip} title="ทำเครื่องหมายว่าสำรวจแล้ว/ไม่ต้องสำรวจ" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--tint-green-tx)", background: "rgba(22,163,74,.08)", border: "1px solid rgba(22,163,74,.27)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    <Icon name="check" size={12} color="var(--tint-green-tx)" sw={2.6} /> ไม่ต้องสำรวจ
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

/* ============================================================
   LEADS — หน้ารวม "ลูกค้าสำรวจ" (ยังไม่เป็นงาน)
   อยู่คนละฐานกับงานติดตั้ง · ตกลงติดตั้งเมื่อไหร่ค่อยกด "แปลงเป็นงาน"
   ============================================================ */
function LeadsView({ leadStore, appts, jobs, onMenuOpen, onOpenSurvey, onConvert, canConvert }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("open");
  const [edit, setEdit] = React.useState(null);
  const leads = leadStore.leads || [];
  const STATUS = window.LEAD_STATUS || [];
  const STATUS_BY = window.LEAD_STATUS_BY || {};

  const apptsOf = React.useMemo(() => {
    const m = {};
    (appts || []).forEach((a) => { if (a.leadId) (m[a.leadId] = m[a.leadId] || []).push(a); });
    return m;
  }, [appts]);
  const counts = React.useMemo(() => {
    const c = { all: leads.length };
    leads.forEach((l) => { const k = l.status || "open"; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [leads]);
  const shown = React.useMemo(() => {
    const arr = filter === "all" ? leads.slice() : leads.filter((l) => (l.status || "open") === filter);
    return arr.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [leads, filter]);

  const FILTERS = [{ key: "all", th: "ทั้งหมด", color: "var(--text-2)" }].concat(STATUS.map((s) => ({ key: s.key, th: s.th, color: s.color })));

  const convert = (l) => {
    if (!confirm("ย้าย “" + l.name + "” เข้าฐานข้อมูลงานติดตั้ง?\nแบบสำรวจและรูปถ่ายจะถูกย้ายไปกับงานใหม่ด้วย")) return;
    onConvert(l);
  };

  return (
    <React.Fragment>
      <window.SchedHeader title="ลูกค้าสำรวจ" onMenuOpen={onMenuOpen}
        sub={leads.length + " ราย · " + (counts.open || 0) + " รอตัดสินใจ · " + (counts.won || 0) + " เป็นงานแล้ว · ยังไม่นับเป็นงานในฐานข้อมูล"}
        right={<button onClick={() => setEdit({ lead: leadStore.blank(), isNew: true })} className="btn-add"><Icon name="plus" size={17} color="#fff" sw={2.4} /><span>ลูกค้าใหม่</span></button>} />
      <div className="app-content">
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
          {FILTERS.map((ff) => {
            const active = filter === ff.key;
            return (
              <button key={ff.key} onClick={() => setFilter(ff.key)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isMobile ? "6px 12px" : "7px 14px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
                  border: "1px solid " + (active ? ff.color : "var(--border-strong)"),
                  background: active ? ff.color + "16" : "var(--surface)", color: active ? ff.color : "var(--text-2)" }}>
                {ff.key !== "all" && <span style={{ width: 7, height: 7, borderRadius: 99, background: ff.color }} />}
                {ff.th}
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)", opacity: active ? 1 : .6 }}>{counts[ff.key] || 0}</span>
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <div style={{ padding: 44, textAlign: "center", color: "var(--text-3)", fontSize: 14, background: "var(--surface)", border: "1px dashed var(--border-strong)", borderRadius: 16 }}>
            ยังไม่มีลูกค้าสำรวจในสถานะนี้ · กด “ลูกค้าใหม่” หรือสร้างจากหน้า “จัดตารางสำรวจ”
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {shown.map((l) => {
              const st = window.surveyStatus({ survey: l.survey });
              const sc = STATUS_BY[l.status || "open"] || STATUS_BY.open;
              const list = (apptsOf[l.id] || []).slice().sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
              const next = list.find((a) => a.status !== "canceled" && a.status !== "done") || list[list.length - 1];
              const job = l.jobId ? (jobs || []).find((j) => j.id === l.jobId) : null;
              return (
                <div key={l.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid " + sc.color, borderRadius: 14, boxShadow: "var(--shadow-sm)", padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name || "(ไม่ระบุชื่อ)"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                        {l.code}{l.province ? " · " + l.province : ""}{l.phone ? " · " + l.phone : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: sc.color, background: sc.color + "16", padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>{sc.th}</span>
                  </div>
                  {l.address && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", gap: 6 }}><Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ flex: 1, minWidth: 0 }}>{l.address}</span></div>}
                  {next && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={13} color="var(--text-3)" />นัดสำรวจ {next.start ? thDate(next.start.slice(0, 10), true) : "-"}{list.length > 1 ? " · ทั้งหมด " + list.length + " นัด" : ""}</div>}
                  {l.note && <div style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 8, padding: "7px 10px" }}>📝 {l.note}</div>}
                  {/* ความคืบหน้าแบบสำรวจ */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: st.pct + "%", background: st.color, borderRadius: 99 }} />
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>{st.label} {st.pct}%</span>
                  </div>
                  {job && <div style={{ fontSize: 11.5, color: "var(--tint-green-tx)", fontWeight: 700 }}>เป็นงาน {job.code} · {job.name} แล้ว</div>}
                  {/* ปุ่มจัดการ */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    {onOpenSurvey && <button onClick={() => onOpenSurvey(window.leadAsJob(l))} style={leadBtn("var(--primary)", true)}><Icon name="list" size={14} color="#fff" /> {st.state === "none" ? "เริ่มแบบสำรวจ" : "ดู / แก้แบบสำรวจ"}</button>}
                    {canConvert && (l.status || "open") !== "won" && <button onClick={() => convert(l)} style={leadBtn("var(--tint-green-tx)", true)}><Icon name="check" size={14} color="#fff" sw={2.4} /> แปลงเป็นงานติดตั้ง</button>}
                    {(l.status || "open") === "open" && <button onClick={() => leadStore.patch(l.id, { status: "lost" })} style={leadBtn("var(--text-2)")}>ไม่ติดตั้ง</button>}
                    {(l.status || "open") === "lost" && <button onClick={() => leadStore.patch(l.id, { status: "open" })} style={leadBtn("var(--text-2)")}>กลับมารอตัดสินใจ</button>}
                    <button onClick={() => setEdit({ lead: Object.assign({}, l), isNew: false })} style={leadBtn("var(--text-2)")}>แก้ไข</button>
                    <button onClick={() => { if (confirm("ลบลูกค้าสำรวจ “" + l.name + "” ?\nแบบสำรวจและรูปของรายนี้จะถูกลบด้วย")) leadStore.remove(l.id); }} style={leadBtn("#EF4444")}>ลบ</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {edit && <LeadModal initial={edit.lead} isNew={edit.isNew} onClose={() => setEdit(null)}
        onSave={(rec) => { leadStore.upsert(rec); setEdit(null); }} />}
    </React.Fragment>
  );
}
function leadBtn(color, solid) {
  return { display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
    border: solid ? "none" : "1px solid var(--border-strong)", background: solid ? color : "var(--surface)", color: solid ? "#fff" : color };
}

/* ── ฟอร์มลูกค้าสำรวจ ── */
function LeadModal({ initial, isNew, onClose, onSave }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const submit = () => { if (!String(f.name || "").trim()) { alert("กรุณากรอกชื่อลูกค้า"); return; } onSave(Object.assign({}, f, { name: f.name.trim() })); };
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 118, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(520px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>{isNew ? "ลูกค้าสำรวจใหม่" : "แก้ไขลูกค้าสำรวจ"}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>เก็บแยกจากฐานข้อมูลงาน — ยังไม่ถูกนับเป็นงานติดตั้งจนกว่าจะกด “แปลงเป็นงาน”</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ชื่อลูกค้า *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="เช่น คุณสมชาย ใจดี" style={inputStyle} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เบอร์โทร</label><input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="08x-xxx-xxxx" style={inputStyle} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>จังหวัด</label><input value={f.province} onChange={(e) => set("province", e.target.value)} placeholder="เช่น ชลบุรี" style={inputStyle} /></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ที่อยู่หน้างาน</label><input value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="บ้านเลขที่ / ถนน / ตำบล" style={inputStyle} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ประเภท</label>
            <Segmented value={f.type || "home"} onChange={(v) => set("type", v)} options={[{ value: "home", label: "บ้าน" }, { value: "biz", label: "โรงงาน / ธุรกิจ" }]} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>หมายเหตุ</label>
            <textarea value={f.note} onChange={(e) => set("note", e.target.value)} rows={2} placeholder='เช่น "สนใจ 5 kW ขอใบเสนอราคาก่อน"' style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} /></div>
        </div>
        <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SurveyView, LeadsView, LeadModal });
