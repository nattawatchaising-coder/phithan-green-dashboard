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
function LeadsView({ leadStore, appts, jobs, onMenuOpen, onOpenSurvey, onReport, onConvert, canConvert,
                     users, currentUser, quotes, onOpenQuote, headRight, focusId, onFocusDone }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("all");
  const [edit, setEdit] = React.useState(null);
  const [log, setLog] = React.useState(null);      // ลูกค้าที่กำลังบันทึกการติดต่อ
  const leads = leadStore.leads || [];
  /* ตัวกรองเปลี่ยนเป็น "ขั้นการขาย" — สถานะเดิม 3 อันบอกได้แค่จบแล้วหรือยัง
     ไม่ได้บอกว่าค้างตรงไหน ซึ่งเป็นสิ่งเดียวที่เซลล์ต้องรู้ตอนเปิดหน้านี้ */
  const STATUS = window.SALES_STAGES || [];
  const STATUS_BY = window.SALES_BY || {};
  const stageKey = window.salesStageKey || ((l) => l.status || "open");

  const apptsOf = React.useMemo(() => {
    const m = {};
    (appts || []).forEach((a) => { if (a.leadId) (m[a.leadId] = m[a.leadId] || []).push(a); });
    return m;
  }, [appts]);
  const counts = React.useMemo(() => {
    const c = { all: leads.length };
    leads.forEach((l) => { const k = stageKey(l); c[k] = (c[k] || 0) + 1; });
    return c;
  }, [leads, stageKey]);
  const shown = React.useMemo(() => {
    const arr = filter === "all" ? leads.slice() : leads.filter((l) => stageKey(l) === filter);
    return arr.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [leads, filter, stageKey]);

  /* ถูกเจาะมาจากภาพรวมงานขาย — เปิดใบลูกค้ารายนั้นให้เลย แล้วเคลียร์ทันที
     ไม่งั้นปิดใบแล้วมันเด้งกลับมาเปิดซ้ำทุกครั้งที่หน้านี้เรนเดอร์ใหม่ */
  React.useEffect(() => {
    if (!focusId) return;
    const l = leads.find((x) => x.id === focusId);
    if (l) setEdit({ lead: l, isNew: false });
    if (onFocusDone) onFocusDone();
  }, [focusId, leads]);

  const FILTERS = [{ key: "all", th: "ทั้งหมด", color: "var(--text-2)" }].concat(STATUS.map((s) => ({ key: s.key, th: s.th, color: s.color })));

  /* เดินขั้นการขาย — เขียน status เดิมคู่ไปด้วยเสมอ (โค้ดเก่าหลายที่ยังอ่านช่องนั้นอยู่) */
  const setStage = (l, key) => leadStore.patch(l.id, (window.salesStagePatch || (() => ({})))(key));
  const addContact = (l, rec) => {
    const list = (l.contacts || []).concat([rec]);
    /* บันทึกการติดต่อแล้วถือว่าคุยกันแล้ว — ลูกค้าใหม่เลื่อนเป็น "ติดต่อแล้ว" ให้เอง
       ไม่งั้นบอร์ดจะค้างอยู่คอลัมน์แรกทั้งที่โทรไปหมดแล้ว */
    const patch = { contacts: list };
    if (stageKey(l) === "new") Object.assign(patch, (window.salesStagePatch || (() => ({})))("contact"));
    if (rec.nextFollow != null) patch.nextFollow = rec.nextFollow;
    leadStore.patch(l.id, patch);
  };

  /* ยืนยันในหน้าเลย ไม่ใช้ confirm() ของเบราว์เซอร์ —
     ถ้าผู้ใช้เคยติ๊ก "ไม่ให้หน้านี้สร้างกล่องข้อความอีก" หรือเปิดจากแอปที่ฝังเว็บไว้
     confirm จะคืนค่า false ทันทีโดยไม่ขึ้นกล่องอะไรเลย = กดปุ่มแล้วเงียบ ทำงานไม่ได้ */
  const [ask, setAsk] = React.useState(null);   // { id, kind: "del" | "conv" }

  return (
    <React.Fragment>
      <window.SchedHeader title="งานขาย" onMenuOpen={onMenuOpen}
        sub={leads.length + " ราย · " + ((counts.new || 0) + (counts.contact || 0) + (counts.survey || 0) + (counts.quoted || 0) + (counts.nego || 0)) +
          " ยังไล่อยู่ · " + (counts.won || 0) + " ปิดการขายแล้ว · " +
          leads.filter((l) => window.sOverdue && window.sOverdue(l.nextFollow) && stageKey(l) !== "won" && stageKey(l) !== "lost").length + " เลยวันติดตาม"}
        right={<React.Fragment>
          {headRight}
          <button onClick={() => setEdit({ lead: leadStore.blank(), isNew: true })} className="btn-add"><Icon name="plus" size={17} color="#fff" sw={2.4} /><span>ลูกค้าใหม่</span></button>
        </React.Fragment>} />
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
              const sKey = stageKey(l);
              const sc = STATUS_BY[sKey] || STATUS[0] || { th: "—", color: "var(--text-3)" };
              const list = (apptsOf[l.id] || []).slice().sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
              const next = list.find((a) => a.status !== "canceled" && a.status !== "done") || list[list.length - 1];
              const job = l.jobId ? (jobs || []).find((j) => j.id === l.jobId) : null;
              const lq = (window.quotesFor ? window.quotesFor(quotes, "lead", l.id) : [])[0];
              const late = window.sOverdue && window.sOverdue(l.nextFollow) && sKey !== "won" && sKey !== "lost";
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
                  {/* แถวข้อมูลของเซลล์ — เจ้าของราย · วันติดตาม · มูลค่าที่คาด · ใบเสนอราคา */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 10.5 }}>
                    {l.ownerName && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--surface2)", color: "var(--text-2)", fontWeight: 700, padding: "3px 9px", borderRadius: 99 }}><Icon name="user" size={11} color="var(--text-3)" />{l.ownerName}</span>}
                    {l.nextFollow && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 700, padding: "3px 9px", borderRadius: 99,
                      background: late ? "var(--tint-red-bg2)" : "var(--surface2)", color: late ? "#EF4444" : "var(--text-2)" }}>
                      <Icon name="clock" size={11} color={late ? "#EF4444" : "var(--text-3)"} />ติดตาม {thDate(l.nextFollow, true)}{late ? " · เลยแล้ว" : ""}</span>}
                    {+l.expKwp > 0 && <span style={{ background: "var(--surface2)", color: "var(--text-2)", fontWeight: 700, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--mono)" }}>{l.expKwp} kWp</span>}
                    {+l.expValue > 0 && <span style={{ background: "var(--primary-soft)", color: "var(--primary-dark)", fontWeight: 800, padding: "3px 9px", borderRadius: 99 }}>฿{fmtBaht(+l.expValue)}</span>}
                    {l.source && window.LEAD_SOURCE_TH && <span style={{ background: "var(--surface2)", color: "var(--text-3)", fontWeight: 700, padding: "3px 9px", borderRadius: 99 }}>{window.LEAD_SOURCE_TH(l.source)}</span>}
                    {lq && (() => { const qs = (window.QUOTE_STATUS_BY || {})[lq.status] || { th: lq.status, color: "var(--text-3)" }; return (
                      <span style={{ background: qs.color + "16", color: qs.color, fontWeight: 800, padding: "3px 9px", borderRadius: 99, fontFamily: "var(--mono)" }}>{lq.no} · {qs.th}</span>
                    ); })()}
                  </div>
                  {l.address && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", gap: 6 }}><Icon name="pin" size={13} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ flex: 1, minWidth: 0 }}>{l.address}</span></div>}
                  {next && <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={13} color="var(--text-3)" />นัดสำรวจ {next.start ? thDate(next.start.slice(0, 10), true) : "-"}{list.length > 1 ? " · ทั้งหมด " + list.length + " นัด" : ""}</div>}
                  {l.note && <div style={{ fontSize: 12, color: "var(--text-2)", background: "var(--surface2)", borderRadius: 8, padding: "7px 10px" }}>📝 {l.note}</div>}
                  {/* ติดต่อครั้งล่าสุด — เห็นทันทีว่าคุยอะไรไปแล้ว ไม่ต้องเปิดเข้าไปอ่าน */}
                  {(l.contacts || []).length > 0 && (() => {
                    const c = l.contacts[l.contacts.length - 1];
                    const w = (window.CONTACT_WAYS || []).find((x) => x.key === c.how) || { th: "ติดต่อ", icon: "list" };
                    return (
                      <div style={{ fontSize: 11.5, color: "var(--text-2)", display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <Icon name={w.icon} size={13} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <b style={{ color: "var(--text-1)" }}>{w.th}</b> {thDateTime(c.at)}{c.byName ? " · " + c.byName : ""}
                          {c.note ? <span style={{ display: "block", color: "var(--text-3)" }}>{c.note}</span> : null}
                          {l.contacts.length > 1 ? <span style={{ color: "var(--text-3)" }}>ติดต่อไปแล้ว {l.contacts.length} ครั้ง</span> : null}
                        </span>
                      </div>
                    );
                  })()}
                  {/* ความคืบหน้าแบบสำรวจ */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: st.pct + "%", background: st.color, borderRadius: 99 }} />
                    </span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>{st.label} {st.pct}%</span>
                  </div>
                  {job && <div style={{ fontSize: 11.5, color: "var(--tint-green-tx)", fontWeight: 700 }}>เป็นงาน {job.code} · {job.name} แล้ว</div>}
                  {/* ปุ่มจัดการ — ถ้ากำลังถามยืนยันอยู่ ให้แถบยืนยันมาแทนที่แถวปุ่มไปเลย จะได้ไม่กดพลาดปุ่มอื่น */}
                  {ask && ask.id === l.id ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <span style={{ flex: 1, minWidth: 140, fontSize: 12, fontWeight: 700, lineHeight: 1.5,
                        color: ask.kind === "del" ? "#EF4444" : "var(--tint-green-tx)" }}>
                        {ask.kind === "del"
                          ? "ลบ “" + (l.name || "รายนี้") + "” ? แบบสำรวจและรูปของรายนี้จะถูกลบด้วย"
                          : "ย้าย “" + (l.name || "รายนี้") + "” เข้าฐานข้อมูลงานติดตั้ง? แบบสำรวจและรูปถ่ายจะถูกย้ายไปกับงานใหม่ด้วย"}
                      </span>
                      {ask.kind === "del"
                        ? <button onClick={() => { leadStore.remove(l.id); setAsk(null); }} style={leadBtn("#EF4444", true)}>ลบเลย</button>
                        : <button onClick={() => { setAsk(null); onConvert(l); }} style={leadBtn("var(--tint-green-tx)", true)}><Icon name="check" size={14} color="#fff" sw={2.4} /> ย้ายเลย</button>}
                      <button onClick={() => setAsk(null)} style={leadBtn("var(--text-2)")}>ยกเลิก</button>
                    </div>
                  ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    <button onClick={() => setLog(l)} style={leadBtn("var(--primary)", true)}><Icon name="phone" size={14} color="#fff" /> บันทึกการติดต่อ</button>
                    {onOpenQuote && <button onClick={() => onOpenQuote(l, lq || null)} style={leadBtn("#EC4899")}><Icon name="file" size={14} color="#EC4899" /> {lq ? "ใบเสนอราคา " + lq.no : "ทำใบเสนอราคา"}</button>}
                    {onOpenSurvey && <button onClick={() => onOpenSurvey(window.leadAsJob(l))} style={leadBtn("var(--text-2)")}><Icon name="list" size={14} color="var(--text-2)" /> {st.state === "none" ? "เริ่มแบบสำรวจ" : "ดู / แก้แบบสำรวจ"}</button>}
                    {onReport && st.state !== "none" && <button onClick={() => onReport(window.leadAsJob(l))} style={leadBtn("var(--primary-dark)")}><Icon name="file" size={14} color="var(--primary-dark)" /> รายงาน · PDF</button>}
                    {canConvert && sKey !== "won" && <button onClick={() => setAsk({ id: l.id, kind: "conv" })} style={leadBtn("var(--tint-green-tx)", true)}><Icon name="check" size={14} color="#fff" sw={2.4} /> แปลงเป็นงานติดตั้ง</button>}
                    {sKey !== "lost" && sKey !== "won" && <button onClick={() => setStage(l, "lost")} style={leadBtn("var(--text-2)")}>ไม่ติดตั้ง</button>}
                    {sKey === "lost" && <button onClick={() => setStage(l, "nego")} style={leadBtn("var(--text-2)")}>กลับมาไล่ต่อ</button>}
                    <button onClick={() => setEdit({ lead: Object.assign({}, l), isNew: false })} style={leadBtn("var(--text-2)")}>แก้ไข</button>
                    <button onClick={() => setAsk({ id: l.id, kind: "del" })} style={leadBtn("#EF4444")}>ลบ</button>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {edit && <LeadModal initial={edit.lead} isNew={edit.isNew} users={users} onClose={() => setEdit(null)}
        onSave={(rec) => { leadStore.upsert(rec); setEdit(null); }} />}
      {log && <ContactLogModal lead={log} currentUser={currentUser} onClose={() => setLog(null)}
        onSave={(rec) => { addContact(log, rec); setLog(null); }} />}
    </React.Fragment>
  );
}

/* ── บันทึกการติดต่อ ──
   เซลล์คุยกับลูกค้าหลายรายต่อวัน ถ้าไม่จดว่าคุยอะไรไป รอบหน้าจะถามซ้ำ
   และเมื่อเปลี่ยนมือคนดูแล คนใหม่จะเริ่มจากศูนย์ — ตั้งวันติดตามครั้งถัดไปในหน้าเดียวกันเลย */
function ContactLogModal({ lead, currentUser, onClose, onSave }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const WAYS = window.CONTACT_WAYS || [{ key: "call", th: "โทร" }];
  const [how, setHow] = React.useState("call");
  const [note, setNote] = React.useState("");
  const [next, setNext] = React.useState(lead.nextFollow || "");
  const lbl = { fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" };
  const submit = () => onSave({
    id: "c-" + Date.now().toString(36), at: new Date().toISOString(),
    by: (currentUser && currentUser.id) || "", byName: (currentUser && currentUser.name) || "",
    how: how, note: note.trim(), nextFollow: next || "",
  });
  return (
    <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 118, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(480px,100%)", maxHeight: isMobile ? "94dvh" : "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", margin: 0 }}>บันทึกการติดต่อ</h2>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{lead.name || "(ไม่ระบุชื่อ)"} · {lead.code}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={lbl}>ติดต่อทางไหน</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {WAYS.map((w) => {
                const on = how === w.key;
                return (
                  <button key={w.key} onClick={() => setHow(w.key)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                      fontSize: 12.5, fontWeight: 700, border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                      background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
                    <Icon name={w.icon} size={13} color={on ? "var(--primary-dark)" : "var(--text-2)"} />{w.th}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>คุยอะไรไว้</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} autoFocus
              placeholder='เช่น "ขอเวลาคิด 1 อาทิตย์ ติดเรื่องงบ" หรือ "ขอใบเสนอราคา 10 kW เพิ่ม"'
              style={Object.assign({}, inputStyle, { resize: "vertical", lineHeight: 1.5 })} /></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ติดตามครั้งถัดไป</label>
            <input type="date" value={next} onChange={(e) => setNext(e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>เลยวันแล้วการ์ดจะขึ้นแดงและถูกดันขึ้นบนสุดในบอร์ดขาย</div>
          </div>
        </div>
        <div style={{ padding: "12px 18px", paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom,0px))" : 12, borderTop: "1px solid var(--border)", background: "var(--surface)", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "12px 18px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={submit} style={{ flex: 1, padding: 12, borderRadius: 11, border: "none", background: "var(--primary)", color: "#fff", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}
function leadBtn(color, solid) {
  return { display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700,
    border: solid ? "none" : "1px solid var(--border-strong)", background: solid ? color : "var(--surface)", color: solid ? "#fff" : color };
}

/* ── ฟอร์มลูกค้าสำรวจ ── */
function LeadModal({ initial, isNew, users, onClose, onSave }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [f, setF] = React.useState(() => Object.assign({}, initial));
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  /* เจ้าของลูกค้าเลือกได้เฉพาะคนที่ถือตำแหน่งเซลล์ · ถ้ารายนี้มีเจ้าของที่ถูกถอดตำแหน่งไปแล้ว
     ยังต้องเห็นชื่อเดิมในรายการ ไม่งั้นกดบันทึกทีเดียวเจ้าของจะหายไปเงียบ ๆ */
  const sellers = React.useMemo(() => {
    const arr = (users || []).filter((u) => u.active !== false && window.hasRole && window.hasRole(window.userRoles(u), "sales"))
      .map((u) => ({ id: u.id, name: u.name || u.username || "—" }));
    if (initial.ownerId && !arr.some((x) => x.id === initial.ownerId)) arr.push({ id: initial.ownerId, name: (initial.ownerName || "") + " (ไม่ใช่เซลล์แล้ว)" });
    return arr;
  }, [users, initial.ownerId, initial.ownerName]);
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
          {/* ── ข้อมูลของฝ่ายขาย ── */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".05em", color: "var(--primary-dark)" }}>ข้อมูลฝ่ายขาย</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>เจ้าของลูกค้า</label>
                <select value={f.ownerId || ""} style={inputStyle}
                  onChange={(e) => { const u = (sellers || []).find((x) => x.id === e.target.value); setF((p) => Object.assign({}, p, { ownerId: e.target.value, ownerName: u ? u.name : "" })); }}>
                  <option value="">— ยังไม่มีเจ้าของ —</option>
                  {sellers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ติดตามครั้งถัดไป</label>
                <input type="date" value={f.nextFollow || ""} onChange={(e) => set("nextFollow", e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 11 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ที่มา</label>
                <select value={f.source || ""} onChange={(e) => set("source", e.target.value)} style={inputStyle}>
                  <option value="">— ไม่ระบุ —</option>
                  {(window.LEAD_SOURCES || []).map((s) => <option key={s.key} value={s.key}>{s.th}</option>)}
                </select></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>ขนาดที่คาด (kWp)</label>
                <input type="number" value={f.expKwp != null ? f.expKwp : ""} onChange={(e) => set("expKwp", e.target.value === "" ? "" : +e.target.value)} placeholder="เช่น 10" style={inputStyle} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}><label style={lbl}>มูลค่าที่คาด (บาท)</label>
                <input type="number" value={f.expValue != null ? f.expValue : ""} onChange={(e) => set("expValue", e.target.value === "" ? "" : +e.target.value)} placeholder="เช่น 350000" style={inputStyle} /></div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>มูลค่าที่คาดใช้คิด “ยังไล่อยู่” ในหน้ายอดขาย ตอนที่ยังไม่มีใบเสนอราคาจริง</div>
          </div>
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

Object.assign(window, { SurveyView, LeadsView, LeadModal, ContactLogModal });
