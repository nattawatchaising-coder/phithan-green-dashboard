/* ============================================================
   flash+solar — Site Survey list view (หน้ารวมงานสำรวจ)
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

/* เดินขั้นการขาย — เขียน status เดิมคู่ไปด้วยเสมอ (โค้ดเก่าหลายที่ยังอ่านช่องนั้นอยู่) */
function leadSetStage(leadStore, l, key) {
  leadStore.patch(l.id, (window.salesStagePatch || (() => ({})))(key));
}

function leadAddContact(leadStore, l, rec) {
  const stageKey = window.salesStageKey || ((x) => x.status || "open");
  const list = (l.contacts || []).concat([rec]);
  /* บันทึกการติดต่อแล้วถือว่าคุยกันแล้ว — ลูกค้าใหม่เลื่อนเป็น "ติดต่อแล้ว" ให้เอง
     ไม่งั้นบอร์ดจะค้างอยู่คอลัมน์แรกทั้งที่โทรไปหมดแล้ว */
  const patch = { contacts: list };
  if (stageKey(l) === "new") Object.assign(patch, (window.salesStagePatch || (() => ({})))("contact"));
  if (rec.nextFollow != null) patch.nextFollow = rec.nextFollow;
  leadStore.patch(l.id, patch);
}

/* ============================================================
   LEADS — หน้ารวม "ลูกค้าสำรวจ" (ยังไม่เป็นงาน)
   อยู่คนละฐานกับงานติดตั้ง · ตกลงติดตั้งเมื่อไหร่ค่อยกด "แปลงเป็นงาน"
   ============================================================ */
function LeadsView({ leadStore, appts, jobs, onMenuOpen, onOpenSurvey, onReport, onPlan3d, onConvert, canConvert,
                     users, currentUser, quotes, onOpenQuote, onOpenLead, headRight, focusId, onFocusDone, newAt }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [filter, setFilter] = React.useState("all");
  const [edit, setEdit] = React.useState(null);
  const [log, setLog] = React.useState(null);      // ลูกค้าที่กำลังบันทึกการติดต่อ
  /* สั่งเปิดฟอร์มลูกค้าใหม่มาจากหน้าอื่น (ปุ่มบนบอร์ดงาน / หน้ายอดขาย)
     ส่งมาเป็นเวลา ไม่ใช่ true/false เพราะกดซ้ำครั้งที่สองต้องเปิดได้อีก */
  React.useEffect(() => {
    if (newAt) setEdit({ lead: leadStore.blank(), isNew: true });
  }, [newAt]);
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
    if (l && onOpenLead) onOpenLead(l);
    if (onFocusDone) onFocusDone();
  }, [focusId, leads]);

  const FILTERS = [{ key: "all", th: "ทั้งหมด", color: "var(--text-2)" }].concat(STATUS.map((s) => ({ key: s.key, th: s.th, color: s.color })));

  const setStage = (l, key) => leadSetStage(leadStore, l, key);
  const addContact = (l, rec) => leadAddContact(leadStore, l, rec);

  /* ของที่ใบลูกค้าต้องใช้ — รวมเป็นก้อนเดียว แผงบนบอร์ดงานก็ประกอบก้อนนี้เหมือนกัน */
  const cardCtx = {
    leadStore, jobs, quotes, apptsOf, STATUS, STATUS_BY, stageKey,
    onOpenSurvey, onReport, onOpenQuote, onPlan3d, onConvert, canConvert,
    setEdit, setLog, setStage, onOpen: onOpenLead,
  };

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
            {shown.map((l) => <LeadCard key={l.id} l={l} ctx={cardCtx} />)}
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
  /* เจ้าของลูกค้าเลือกได้ทุกคนในระบบ ยกเว้นบัญชีแอดมินที่ไม่ได้ลงไปดูแลลูกค้าเอง
     (เดิมจำกัดไว้เฉพาะตำแหน่งเซลล์ แต่คนที่พาลูกค้าเข้ามาจริงมีทั้งช่าง วิศวกร และหัวหน้า)
     ต่อท้ายด้วยตำแหน่งไว้ให้แยกออกว่าใครเป็นใคร แต่เก็บลงใบเฉพาะชื่อ
     ถ้ารายนี้มีเจ้าของที่ถูกปิดบัญชีไปแล้ว ยังต้องเห็นชื่อเดิมในรายการ
     ไม่งั้นกดบันทึกทีเดียวเจ้าของจะหายไปเงียบ ๆ */
  const sellers = React.useMemo(() => {
    const arr = (users || [])
      .filter((u) => u.active !== false && !(window.hasRole && window.hasRole(window.userRoles(u), "admin")))
      .map((u) => {
        const name = u.name || u.username || "—";
        const r = (window.ROLE_INFO || {})[(window.userRoles(u) || [])[0]];
        return { id: u.id, name: name, label: r ? name + " · " + r.short : name };
      });
    if (initial.ownerId && !arr.some((x) => x.id === initial.ownerId)) {
      const old = initial.ownerName || "";
      arr.push({ id: initial.ownerId, name: old, label: old + " (ปิดบัญชีแล้ว)" });
    }
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
                  {sellers.map((u) => <option key={u.id} value={u.id}>{u.label || u.name}</option>)}
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

/* ── ใบลูกค้าหนึ่งราย ──
   แยกออกมาเป็นชิ้นเดียว เพราะใช้สองที่: หน้ารายชื่อลูกค้า และแผงที่เด้งจากบอร์ดงาน
   ctx = ของที่ใบนี้ต้องใช้ทั้งหมด (ฐานข้อมูล · งาน · ใบเสนอราคา · ปุ่มต่างๆ) */
function LeadCard({ l, ctx }) {
  const { jobs, quotes, apptsOf, STATUS_BY, STATUS, stageKey, onOpenQuote, onOpen } = ctx;

  const st = window.surveyStatus({ survey: l.survey });
  const sKey = stageKey(l);
  const sc = STATUS_BY[sKey] || STATUS[0] || { th: "—", color: "var(--text-3)" };
  const list = (apptsOf[l.id] || []).slice().sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
  const next = list.find((a) => a.status !== "canceled" && a.status !== "done") || list[list.length - 1];
  const job = l.jobId ? (jobs || []).find((j) => j.id === l.jobId) : null;

  const late = window.sOverdue && window.sOverdue(l.nextFollow) && sKey !== "won" && sKey !== "lost";
  return (
    /* กดที่การ์ด = เปิดใบเต็ม (ใบเดียวกับที่เด้งจากบอร์ดงาน) ปุ่มจัดการทั้งหมดอยู่ในใบนั้น
       เดิมการ์ดพกแถวปุ่มของตัวเองไว้ ทำให้ลูกค้ารายเดียวกันมีหน้าตาและชุดปุ่มคนละอย่างสองที่ */
    <div key={l.id} onClick={() => onOpen && onOpen(l)} title={onOpen ? "เปิดใบลูกค้า" : undefined}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid " + sc.color, borderRadius: 14, boxShadow: "var(--shadow-sm)", padding: 14, display: "flex", flexDirection: "column", gap: 9, cursor: onOpen ? "pointer" : "default" }}>
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
      {/* ใบเสนอราคาทุกฉบับของรายนี้ — ชุดเดียวกับที่ใบงานใช้
          เดิมเห็นแค่ใบล่าสุดใบเดียว เสนอไปหลายรอบแล้วดูไม่ออกว่าคุยกันอยู่ที่ฉบับไหน */}
      {/* กดใบเสนอราคาต้องได้ใบนั้น ไม่ใช่เด้งใบลูกค้าขึ้นมาทับ */}
      {onOpenQuote && window.SalesQuoteList && (
        <div onClick={(e) => e.stopPropagation()}>
          <window.SalesQuoteList lead={l} quotes={quotes} onOpenQuote={(q) => onOpenQuote(l, q)} />
        </div>
      )}
    </div>
  );
}

/* ── แถวปุ่มงานแบบเดียวกับในใบงาน (ไอคอน · หัวข้อ · บรรทัดรอง · ลูกศร) ── */
function LeadActionRow({ icon, color, title, sub, onClick }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
        background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, cursor: "pointer",
        fontFamily: "inherit", textAlign: "left" }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: color + "1c", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon name={icon} size={17} color={color} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)" }}>{sub}</span>
      </span>
      <Icon name="arrowRight" size={16} color="var(--text-3)" />
    </button>
  );
}

/* ── ช่องตัวเลขในกล่องสเปกที่พิมพ์ทับได้ในใบเลย ──
   เดิมจะแก้ "ขนาดที่คาด" ตัวเดียวต้องเปิดฟอร์มแก้ไขทั้งใบ แล้วกดบันทึก แล้วปิด
   พิมพ์แล้วเก็บไว้ในช่องก่อน ค่อยบันทึกตอนออกจากช่องหรือกด Enter —
   ถ้าบันทึกทุกตัวอักษร คนที่พิมพ์ "15.6" จะถูกบันทึกไล่เป็น 1 · 15 · 15.6 */
function LeadSpecNum({ label, value, unit, mono, accent, onSave, disabled }) {
  const [txt, setTxt] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const has = value != null && value !== "" && +value > 0;
  if (disabled) return <SpecItem label={label} value={has ? value + " " + unit : "—"} mono={mono} accent={accent && has} />;
  const commit = () => {
    setTyping(false);
    const n = parseFloat(String(txt).replace(/[^0-9.]/g, ""));
    const out = isFinite(n) && n > 0 ? n : "";
    if (String(out) !== String(value == null ? "" : value)) onSave(out);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
        <input value={typing ? txt : (has ? String(value) : "")} inputMode="decimal" placeholder="—"
          onFocus={() => { setTxt(has ? String(value) : ""); setTyping(true); }}
          onChange={(e) => setTxt(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          style={{ flex: 1, minWidth: 0, padding: "5px 8px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--surface2)", color: accent ? "var(--primary-dark)" : "var(--text-1)",
            fontFamily: mono ? "var(--mono)" : "inherit", fontSize: 14, fontWeight: 600, outline: "none" }} />
        <span style={{ fontSize: 10.5, color: "var(--text-3)", whiteSpace: "nowrap", flexShrink: 0 }}>{unit}</span>
      </span>
    </div>
  );
}

/* เฟสมีสองค่า กดเลือกเร็วกว่าพิมพ์ · ที่ยังไม่มีใครระบุไม่ติ๊กอะไรไว้ จะได้ไม่เข้าใจผิดว่ารู้แล้ว */
function LeadSpecPhase({ label, lead, onSave, disabled }) {
  const known = !!(lead.phase || (lead.survey && lead.survey.phase));
  const cur = known ? window.SF.phaseOf(lead) : 0;
  if (disabled) return <SpecItem label={label} value={cur ? cur + " เฟส" : "—"} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{label}</span>
      <span style={{ display: "inline-flex", gap: 4, padding: 3, borderRadius: 9, background: "var(--surface2)",
        border: "1px solid var(--border)", alignSelf: "flex-start" }}>
        {["1", "3"].map((k) => {
          const on = cur === +k;
          return (
            <button key={k} type="button" onClick={() => onSave(k)}
              style={{ padding: "4px 11px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 12.5, fontWeight: 700,
                background: on ? "var(--surface)" : "transparent", color: on ? "var(--primary-dark)" : "var(--text-3)",
                boxShadow: on ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>{k} เฟส</button>
          );
        })}
      </span>
    </div>
  );
}

/* ── ใบลูกค้าแบบเต็มหน้า — วางโครงเดียวกับใบงานในฐานข้อมูล ──
   เซลล์ต้องเห็นของชุดเดียวกับที่เปิดใบงานแล้วเห็น: ข้อมูลติดต่อ · สเปกที่เสนอ · ใบเสนอราคาทุกฉบับ
   · แบบสำรวจ · ผังแผง 3D · ประวัติการติดต่อ
   ตัดของที่เป็นของงานติดตั้งจริงออกทั้งหมด — เบิกเงินหน้างาน · ใบตรวจสอบงาน · ขออนุญาตการไฟฟ้า
   · สถานะวัสดุ · อุปกรณ์ที่เบิก/คืน · ลำดับขั้นการทำงาน
   ลูกค้าที่ยังไม่ปิดการขายไม่มีของพวกนี้ ใส่ไปก็เป็นช่องว่างที่กดแล้วไม่มีอะไร
   (ใบย่อในหน้ารายชื่อยังเป็น LeadCard เหมือนเดิม — รายชื่อยาว ๆ ต้องอ่านเร็ว ไม่ใช่อ่านครบ) */
function LeadDetail({ l, ctx }) {
  const { leadStore, jobs, quotes, apptsOf, STATUS, STATUS_BY, stageKey, currentUser, stock, priceMap,
          canManage, canDesign, onSaveBoq,
          onOpenSurvey, onReport, onOpenQuote, onPlan3d, onConvert, canConvert, setEdit, setLog, setStage } = ctx;
  const [ask, setAsk] = React.useState(null);   // { kind: "del" | "conv" }
  const [designOpen, setDesignOpen] = React.useState(false);
  const [boqOpen, setBoqOpen] = React.useState(false);
  const [delC, setDelC] = React.useState(null);   // บันทึกการติดต่อที่กำลังจะลบ (ถามยืนยันก่อน)

  const st = window.surveyStatus({ survey: l.survey });
  const sKey = stageKey(l);
  const sc = STATUS_BY[sKey] || STATUS[0] || { th: "—", color: "var(--text-3)" };
  const list = (apptsOf[l.id] || []).slice().sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));
  const next = list.find((a) => a.status !== "canceled" && a.status !== "done") || list[list.length - 1];
  const job = l.jobId ? (jobs || []).find((j) => j.id === l.jobId) : null;
  const late = window.sOverdue && window.sOverdue(l.nextFollow) && sKey !== "won" && sKey !== "lost";
  /* ── ร่างงานสำหรับหน้าออกแบบ / ถอด BOQ / ไฟล์แนบ ──
     แปลงเป็นงานแล้วให้ใช้ใบงานจริง เพราะแบบกับไฟล์ย้ายไปอยู่ใต้เลขงานตั้งแต่ตอนแปลงแล้ว
     ถ้าเปิดด้วยเลขลูกค้าจะได้ของเปล่าทั้งที่ทำไว้แล้ว */
  const asJob = job || (window.leadAsJob ? window.leadAsJob(l) : null);
  const media = window.useJobMedia ? window.useJobMedia(asJob ? asJob.id : null) : null;
  /* ประวัติการติดต่อเรียงครั้งล่าสุดไว้บน — เปิดมาต้องเห็นว่าคุยอะไรไปล่าสุดก่อน */
  const contacts = (l.contacts || []).slice().reverse();
  const lastC = contacts[0] || null;
  const wayOf = (k) => (window.CONTACT_WAYS || []).find((x) => x.key === k) || { th: "ติดต่อ", icon: "list" };
  /* ลบบันทึกที่จดผิด/จดซ้ำ — ชี้ด้วย id เสมอ
     จอเรียงครั้งล่าสุดไว้บน ถ้าลบตามลำดับที่เห็นจะไปโดนคนละรายการกับที่กด
     (บันทึกเก่าก่อนมี id ค่อยถอยไปนับตำแหน่งแบบกลับด้าน) */
  /* ข้ามขั้นตอนสำรวจ — ลูกค้าบางรายส่งแบบ/รูปมาให้ครบแล้ว หรือเคยไปดูหน้างานมาก่อน
     ไม่ต้องบังคับให้กรอกแบบสำรวจทั้งชุดเพื่อให้ % ขึ้นครบ
     ใช้ธง survey.skip ตัวเดียวกับหน้าคิวสำรวจ กดที่ไหนก็เห็นตรงกันทั้งสองหน้า */
  const toggleSurveySkip = () => {
    const cur = l.survey || {};
    leadStore.patch(l.id, { survey: Object.assign({}, cur, {
      skip: !cur.skip,
      skippedAt: !cur.skip ? new Date().toISOString() : null,
      skipBy: !cur.skip ? ((currentUser && currentUser.name) || "") : null,
    }) });
  };
  /* เฟสที่ใช้จริงอ่านจากแบบสำรวจก่อนค่าในใบ (ดู SF.phaseOf) — ถ้าแก้ที่นี่แล้วไม่แก้ในแบบสำรวจด้วย
     ของเดิมในแบบสำรวจจะทับทันที กลายเป็นกดแล้วตัวเลขไม่ขยับ */
  const setLeadPhase = (v) => {
    const f = { phase: v };
    const cur = l.survey || {};
    if (cur.phase && String(cur.phase) !== String(v)) f.survey = Object.assign({}, cur, { phase: v });
    leadStore.patch(l.id, f);
  };
  const removeContact = (c, shownIdx) => {
    const all = (l.contacts || []).slice();
    const i = c.id ? all.findIndex((x) => x.id === c.id) : all.length - 1 - shownIdx;
    if (i < 0) { setDelC(null); return; }
    all.splice(i, 1);
    leadStore.patch(l.id, { contacts: all });
    setDelC(null);
  };

  const card = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 10 };
  const capt = { fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--text-3)", textTransform: "uppercase",
    marginBottom: 12, display: "flex", alignItems: "center", gap: 6 };

  return (
    <React.Fragment>
      {/* ขั้นการขาย + ความคืบหน้าแบบสำรวจ — แทนที่แถบลำดับขั้นงานของใบงาน */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 800, color: sc.color,
          background: sc.color + "16", padding: "5px 12px", borderRadius: 99, flexShrink: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: sc.color }} />{sc.th}
        </span>
        <span style={{ flex: 1, minWidth: 90, height: 6, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", width: st.pct + "%", background: st.color, borderRadius: 99 }} />
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color, whiteSpace: "nowrap" }}>{st.label} {st.pct}%</span>
      </div>

      {/* ข้อมูลติดต่อ — ตารางเดียวกับหัวใบงาน */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
        <InfoRow label="เบอร์โทร">{l.phone || "—"}</InfoRow>
        <InfoRow label="ติดตามครั้งถัดไป">
          {l.nextFollow
            ? <span style={{ color: late ? "#EF4444" : "var(--text-1)", fontWeight: late ? 700 : 500 }}>
                {thDate(l.nextFollow, true)}{late ? " · เลยแล้ว" : ""}</span>
            : "—"}
        </InfoRow>
        <div style={{ gridColumn: "1 / -1" }}>
          {/* ที่อยู่ว่าง ๆ บางใบกรอกเป็นขีดไว้ — อย่าเอามาต่อกับจังหวัดจนกลายเป็น "-, กรุงเทพฯ" */}
          <InfoRow label="ที่อยู่ / พิกัด">
            {[l.address, l.province].filter((x) => x && String(x).trim() !== "-" && String(x).trim() !== "—").join(", ") || "—"}
          </InfoRow>
        </div>
        <InfoRow label="เซลล์เจ้าของราย">{l.ownerName || "—"}</InfoRow>
        <InfoRow label="ที่มาของลูกค้า">{(l.source && window.LEAD_SOURCE_TH ? window.LEAD_SOURCE_TH(l.source) : "") || "—"}</InfoRow>
        <InfoRow label="ประเภทงาน">{l.type === "biz" ? "โรงงาน / ธุรกิจ" : "บ้าน"}</InfoRow>
        <InfoRow label="นัดสำรวจ">
          {next ? (next.start ? thDate(next.start.slice(0, 10), true) : "-") + (list.length > 1 ? " · ทั้งหมด " + list.length + " นัด" : "") : "ยังไม่มีนัด"}
        </InfoRow>
        {job && (
          <div style={{ gridColumn: "1 / -1" }}>
            <InfoRow label="แปลงเป็นงานติดตั้งแล้ว">
              <span style={{ color: "var(--tint-green-tx)", fontWeight: 700 }}>{job.code} · {job.name}</span>
            </InfoRow>
          </div>
        )}
        {l.note && (
          <div style={{ gridColumn: "1 / -1" }}>
            <InfoRow label="หมายเหตุ">{l.note}</InfoRow>
          </div>
        )}
      </div>

      {/* สเปกที่เสนอลูกค้า — ของจริงยังไม่มี มีแต่ที่คาดไว้ ต้องเขียนให้ชัดว่าเป็นค่าคาด
          แก้ได้ในใบเลย เพราะเป็นตัวเลขที่ขยับตลอดระหว่างคุยกับลูกค้า
          ไม่ควรต้องเปิดฟอร์มทั้งใบเพื่อแก้ช่องเดียวทุกครั้ง */}
      <div style={card}>
        <div style={capt}><Icon name="sun" size={14} color="var(--primary)" /> สเปกที่เสนอลูกค้า</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <LeadSpecNum label="ขนาดที่คาด" value={l.expKwp} unit="kWp" mono
            onSave={(v) => leadStore.patch(l.id, { expKwp: v })} />
          <LeadSpecNum label="มูลค่าที่คาด" value={l.expValue} unit="บาท" accent
            onSave={(v) => leadStore.patch(l.id, { expValue: v })} />
          <LeadSpecPhase label="ระบบไฟฟ้า" lead={l} onSave={setLeadPhase} />
        </div>
      </div>

      {/* ใบเสนอราคาทุกฉบับ — ชุดเดียวกับในใบงาน */}
      {onOpenQuote && window.SalesQuoteList && (
        <window.SalesQuoteList lead={l} quotes={quotes} onOpenQuote={(q) => onOpenQuote(l, q)} card />
      )}

      {/* ปุ่มงานของเซลล์ */}
      <LeadActionRow icon="phone" color="var(--primary)" title="บันทึกการติดต่อ"
        sub={lastC ? "ล่าสุด " + wayOf(lastC.how).th + " " + thDateTime(lastC.at) + " · ติดต่อไปแล้ว " + contacts.length + " ครั้ง" : "ยังไม่เคยบันทึกการติดต่อ"}
        onClick={() => setLog(l)} />
      {onOpenSurvey && (
        <LeadActionRow icon="list" color={st.color} title="สำรวจหน้างาน (Site Survey)"
          sub={st.state === "skip" ? "ข้ามขั้นตอนสำรวจไว้" + (l.survey && l.survey.skipBy ? " โดย " + l.survey.skipBy : "") + " · แตะเพื่อกรอกแบบสำรวจ"
            : st.state === "none" ? "ยังไม่ได้สำรวจ · แตะเพื่อเริ่ม" : st.label + " · " + st.pct + "% · แตะเพื่อแก้ไข"}
          onClick={() => onOpenSurvey(window.leadAsJob(l))} />
      )}
      {/* ข้ามขั้นตอนสำรวจ — วางไว้ใต้แถวสำรวจ ไม่ซ้อนปุ่มในปุ่ม กดพลาดตอนจะเปิดแบบสำรวจไม่ได้
          ที่ข้ามไว้แล้วกดกลับเข้าคิวได้ ข้อมูลที่กรอกไว้ยังอยู่ครบ ไม่ได้ลบทิ้ง */}
      {onOpenSurvey && canManage !== false && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, marginBottom: 10 }}>
          <button onClick={toggleSurveySkip}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              borderRadius: 9, padding: "5px 11px",
              color: st.state === "skip" ? "var(--text-2)" : "var(--tint-green-tx)",
              background: st.state === "skip" ? "var(--surface2)" : "rgba(22,163,74,.08)",
              border: "1px solid " + (st.state === "skip" ? "var(--border-strong)" : "rgba(22,163,74,.27)") }}>
            <Icon name={st.state === "skip" ? "history" : "check"} size={12}
              color={st.state === "skip" ? "var(--text-2)" : "var(--tint-green-tx)"} sw={2.4} />
            {st.state === "skip" ? "เอากลับเข้าคิวสำรวจ" : "ข้ามขั้นตอนสำรวจ · ไม่ต้องสำรวจ"}
          </button>
        </div>
      )}
      {/* ที่ข้ามไว้ยังไม่มีข้อมูลสำรวจ รายงานจะออกมาเป็นใบเปล่า — ให้ขึ้นเฉพาะใบที่เริ่มกรอกแล้ว */}
      {onReport && st.state !== "none" && l.survey && l.survey.startedAt && (
        <button onClick={() => onReport(window.leadAsJob(l))}
          style={{ width: "100%", marginBottom: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 14px", background: "var(--primary-soft)", border: "1px solid var(--primary)", borderRadius: 11,
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--primary-dark)" }}>
          <Icon name="file" size={15} color="var(--primary-dark)" /> ดูรายงานผลสำรวจ · บันทึก PDF
        </button>
      )}
      {/* แบบที่ปั้นไว้ตอนยังเป็นลูกค้าจะตามไปกับงานเองตอนกดแปลง จึงเปิดด้วยเลขงานถ้าแปลงแล้ว */}
      {onPlan3d && (
        <LeadActionRow icon="panel" color="#4F46E5" title="วางแผง 3D"
          sub="ปั้นผังหลังคาไปคุยกับลูกค้า · ดึงจำนวนแผงเข้าใบเสนอราคาได้"
          onClick={() => onPlan3d(job || window.leadAsJob(l))} />
      )}
      {/* ── ของที่ต้องใช้ตั้งแต่ตอนเสนอราคา ──
         งานโครงการต้องคำนวณระบบกับถอดของให้เสร็จก่อน ถึงจะรู้ราคาไปเสนอลูกค้าได้
         เดิมต้องกดแปลงเป็นงานก่อนถึงจะเข้าถึงสามอย่างนี้ ซึ่งทำให้ฐานข้อมูลงานมีงานที่ยังไม่ได้ขาย */}
      {asJob && window.SolarDesignHost && canDesign !== false && (
        <LeadActionRow icon="bolt" color="#B45309" title="ออกแบบระบบ + ผลผลิต"
          sub="ต่อสตริง · ตรวจ I-V · ผลผลิต 25 ปี · คืนทุน — ใช้ผังแผงที่ปั้นไว้"
          onClick={() => setDesignOpen(true)} />
      )}
      {asJob && window.BOQEditor && (
        <LeadActionRow icon="box" color="var(--primary-dark)" title="ถอดวัสดุ BOQ"
          sub={(job ? job.boq : l.boq) ? "มีรายการแล้ว · แตะเพื่อแก้ไข / ดาวน์โหลด" : "คำนวณปริมาณวัสดุเพื่อคิดราคาไปเสนอ"}
          onClick={() => setBoqOpen(true)} />
      )}
      {/* ไฟล์แบบ / BOQ ที่แนบไว้ — ไฟล์ตามไปกับงานเองตอนกดแปลงเป็นงาน (moveJobFiles) */}
      {media && window.JobFiles && (
        <window.JobFiles media={media} currentUser={currentUser} canManage={canManage !== false} />
      )}

      {/* ประวัติการติดต่อทั้งหมด */}
      {contacts.length > 0 && (
        <div style={card}>
          <div style={capt}><Icon name="message" size={14} color="var(--text-3)" /> ประวัติการติดต่อ ({contacts.length})</div>
          {contacts.slice(0, 8).map((c, i) => {
            const w = wayOf(c.how);
            const asking = delC != null && delC === (c.id || "i" + i);
            return (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "8px 0",
                borderTop: i ? "1px solid var(--border)" : "none" }}>
                <Icon name={w.icon} size={14} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--text-2)" }}>
                  <b style={{ color: "var(--text-1)" }}>{w.th}</b> {thDateTime(c.at)}{c.byName ? " · " + c.byName : ""}
                  {c.note ? <span style={{ display: "block", color: "var(--text-3)", lineHeight: 1.5 }}>{c.note}</span> : null}
                </span>
                {/* ลบได้เฉพาะคนที่แก้ใบลูกค้าได้ · ถามยืนยันก่อนเสมอ ประวัติที่ลบแล้วเอากลับไม่ได้ */}
                {canManage !== false && (asking ? (
                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <button onClick={() => removeContact(c, i)}
                      style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", background: "#EF4444", border: "none",
                        borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>ลบเลย</button>
                    <button onClick={() => setDelC(null)}
                      style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", background: "var(--surface)",
                        border: "1px solid var(--border-strong)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit" }}>ยกเลิก</button>
                  </span>
                ) : (
                  <button onClick={() => setDelC(c.id || "i" + i)} title="ลบบันทึกนี้"
                    style={{ width: 26, height: 26, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)",
                      cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, color: "var(--text-3)" }}>
                    <Icon name="trash" size={13} />
                  </button>
                ))}
              </div>
            );
          })}
          {contacts.length > 8 && (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", paddingTop: 8 }}>· และก่อนหน้านี้อีก {contacts.length - 8} ครั้ง</div>
          )}
        </div>
      )}

      {/* แถบปุ่มล่าง — ค้างอยู่ก้นใบเหมือนใบงาน จะได้กดได้โดยไม่ต้องเลื่อนกลับลงมา */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--border)",
        padding: "12px 0 14px", marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {ask ? (
          <React.Fragment>
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
          </React.Fragment>
        ) : (
          <React.Fragment>
            <button onClick={() => setEdit({ lead: Object.assign({}, l), isNew: false })} style={leadBtn("var(--text-2)")}>
              <Icon name="settings" size={14} color="var(--text-2)" /> แก้ไขข้อมูล
            </button>
            {sKey !== "lost" && sKey !== "won" && <button onClick={() => setStage(l, "lost")} style={leadBtn("var(--text-2)")}>ไม่ติดตั้ง</button>}
            {sKey === "lost" && <button onClick={() => setStage(l, "nego")} style={leadBtn("var(--text-2)")}>กลับมาไล่ต่อ</button>}
            <button onClick={() => setAsk({ kind: "del" })} style={leadBtn("#EF4444")}>ลบ</button>
            {canConvert && sKey !== "won" && (
              <button onClick={() => setAsk({ kind: "conv" })} style={Object.assign({}, leadBtn("var(--tint-green-tx)", true), { marginLeft: "auto" })}>
                <Icon name="check" size={14} color="#fff" sw={2.4} /> แปลงเป็นงานติดตั้ง
              </button>
            )}
          </React.Fragment>
        )}
      </div>

      {designOpen && asJob && window.SolarDesignHost && (
        <window.SolarDesignHost job={asJob} onClose={() => setDesignOpen(false)} />
      )}
      {boqOpen && asJob && window.BOQEditor && (
        <window.BOQEditor job={asJob} priceMap={priceMap} stock={stock} onClose={() => setBoqOpen(false)}
          onSave={onSaveBoq ? (boq) => { onSaveBoq(asJob, boq); setBoqOpen(false); } : null} />
      )}
    </React.Fragment>
  );
}

/* ── แผงลูกค้าที่เด้งจากบอร์ดงาน ──
   กดการ์ดขายบนบอร์ดแล้วได้ใบเต็มทันที ไม่ต้องเด้งออกไปหน้ารายชื่อลูกค้าแล้วหาใหม่
   ข้างในเป็นใบเต็มแบบเดียวกับใบงาน (LeadDetail) ปุ่มครบเหมือนใบย่อในหน้ารายชื่อ */
function LeadDrawer({ lead, leadStore, appts, jobs, quotes, users, currentUser, stock, priceMap,
                      canManage, canDesign, onSaveBoq, onClose,
                      onOpenSurvey, onReport, onOpenQuote, onPlan3d, onConvert, canConvert }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const bdClose = window.useBackdropClose(onClose);
  const [edit, setEdit] = React.useState(null);
  const [log, setLog] = React.useState(null);

  /* ปิดด้วยปุ่ม Esc — มือยังอยู่บนคีย์บอร์ดตอนไล่ดูทีละราย */
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !edit && !log) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, edit, log]);

  if (!lead) return null;

  const stageKey = window.salesStageKey || ((l) => l.status || "open");
  const apptsOf = {};
  (appts || []).forEach((a) => { if (a.leadId === lead.id) (apptsOf[a.leadId] = apptsOf[a.leadId] || []).push(a); });

  const ctx = {
    leadStore, jobs, quotes, apptsOf, currentUser, stock, priceMap, canManage, canDesign, onSaveBoq,
    STATUS: window.SALES_STAGES || [], STATUS_BY: window.SALES_BY || {}, stageKey,
    onOpenSurvey, onReport, onOpenQuote, onPlan3d, onConvert, canConvert,
    setEdit, setLog, setStage: (l, key) => leadSetStage(leadStore, l, key),
  };

  return (
    <React.Fragment>
      <div {...bdClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 116,
        display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18,
          width: isMobile ? "100%" : "min(680px,100%)", maxHeight: isMobile ? "94dvh" : "90vh",
          display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name || "(ไม่ระบุชื่อ)"}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{lead.code}</div>
            </div>
            <button onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)", cursor: "pointer", fontFamily: "inherit", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: "14px 16px 0", overflowY: "auto" }}>
            <LeadDetail l={lead} ctx={ctx} />
          </div>
        </div>
      </div>
      {edit && <LeadModal initial={edit.lead} isNew={edit.isNew} users={users} onClose={() => setEdit(null)}
        onSave={(rec) => { leadStore.upsert(rec); setEdit(null); }} />}
      {log && <ContactLogModal lead={log} currentUser={currentUser} onClose={() => setLog(null)}
        onSave={(rec) => { leadAddContact(leadStore, log, rec); setLog(null); }} />}
    </React.Fragment>
  );
}

Object.assign(window, { SurveyView, LeadsView, LeadCard, LeadDetail, LeadDrawer, LeadModal, ContactLogModal, LeadSpecNum, LeadSpecPhase });
