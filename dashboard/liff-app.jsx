/* ============================================================
   flash+solar — หน้าจอในแอป LINE (LIFF) · คำนำหน้า ln / Ln

   เฟส 1 มีสองเรื่องเท่านั้น: ค้นหา/ดูข้อมูลงาน กับ แจ้งเตือนของฉัน
   ทั้งคู่ "อ่านอย่างเดียว" — ยังไม่มีหน้าไหนเขียนข้อมูลลงฐาน
   (ลงเวลา · OT · เบิกเงิน · รายงานประจำวัน อยู่เฟสถัดไป)

   หน้าจอชุดนี้ไม่ได้เขียนตรรกะสิทธิ์ใหม่เลย — ใช้ jobScopeOf/jobInScope/can
   ชุดเดียวกับเว็บเดสก์ท็อป ฉะนั้น "ช่างเห็นงานอะไรบ้าง" ตอบเหมือนกันทั้งสองที่เสมอ
   ============================================================ */

const LN_TAB = [
  { key: "jobs",  th: "งาน",       icon: "wrench" },
  { key: "bell",  th: "แจ้งเตือน", icon: "bell" },
  { key: "me",    th: "ฉัน",       icon: "user" },
];

/* ── แถบหัว ── */
function LnHead({ tab, setTab, unread }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--surface)", borderBottom: "1px solid var(--border)",
      paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px 9px" }}>
        {window.BrandLockup ? <window.BrandLockup size={19} /> : <b>flash+solar</b>}
      </div>
      <div style={{ display: "flex" }}>
        {LN_TAB.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, position: "relative", padding: "9px 0 11px", border: "none", background: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: on ? "var(--primary-dark)" : "var(--text-3)",
                boxShadow: on ? "inset 0 -2.5px 0 var(--primary)" : "none",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name={t.icon} size={15} color={on ? "var(--primary-dark)" : "var(--text-3)"} />
              {t.th}
              {t.key === "bell" && unread > 0 && (
                <span style={{ minWidth: 17, height: 17, padding: "0 5px", borderRadius: 99, background: "#D93025", color: "#fff",
                  fontSize: 10.5, fontWeight: 800, display: "inline-grid", placeItems: "center" }}>{unread}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── แถวงานหนึ่งใบ ── */
function LnJobRow({ job, onOpen }) {
  const st = (window.SF.STAGES || []).find((s) => s.key === job.stage) || {};
  return (
    <button onClick={() => onOpen(job)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 16px", border: "none",
        borderBottom: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{job.code}</span>
        <span style={{ padding: "2px 8px", borderRadius: 99, background: st.soft || "var(--surface3)", color: st.fg || "var(--text-2)",
          fontSize: 10.5, fontWeight: 800 }}>{st.th || job.stage}</span>
        {job.delayed && <span style={{ padding: "2px 8px", borderRadius: 99, background: "var(--tint-red-bg)", color: "var(--tint-red-tx)",
          fontSize: 10.5, fontWeight: 800 }}>ล่าช้า</span>}
      </div>
      <div style={{ marginTop: 4, fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>{job.name || "—"}</div>
      <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>
        {[job.province, job.kw ? job.kw + " kW" : "", job.brand].filter(Boolean).join(" · ")}
      </div>
    </button>
  );
}

/* ── แผ่นรายละเอียดงาน ──
   เบอร์โทรกับแผนที่เป็นลิงก์จริง เพราะสองอย่างนี้คือเหตุผลที่ช่างเปิดดูงานบนมือถือ */
function LnJobSheet({ job, techs, onClose }) {
  if (!job) return null;
  const tech = (techs || []).find((t) => t.id === job.tech);
  const rows = [
    ["ลูกค้า", job.name],
    ["ที่อยู่", job.address],
    ["จังหวัด", job.province],
    ["ประเภท", ((window.SF.TYPES || []).find((x) => x.key === job.type) || {}).th || job.type],
    ["ขนาดระบบ", job.kw ? job.kw + " kW" + (job.panels ? " · " + job.panels + " แผง" : "") : ""],
    ["ยี่ห้อ", job.brand],
    ["ช่างผู้รับผิดชอบ", tech ? tech.name : ""],
    ["วิศวกรผู้รับผิดชอบ", job.eeName],
    /* ชื่อฟิลด์มาจาก SF.deriveJob — startDate/deadline คือช่วงวันนัดติดตั้ง ไม่ใช่กำหนดส่งมอบ
       ใช้ drDateTH ไม่ใช่ drShort เพราะ drShort ตัดปีออก — บนมือถือคนดูเพื่อจะไปจริง ต้องเห็นปีด้วย */
    ["วันติดตั้ง", job.startDate
      ? (job.deadline && job.deadline !== job.startDate
          ? window.drShort(job.startDate) + " – " + window.drDateTH(job.deadline)
          : window.drDateTH(job.startDate))
      : ""],
  ].filter((r) => r[1]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,43,51,.42)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "88dvh", overflowY: "auto", background: "var(--surface)",
          borderRadius: "18px 18px 0 0", padding: "16px 18px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{job.code}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 12 }}>{job.name || "—"}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {job.phone && (
            <a href={"tel:" + String(job.phone).replace(/[^0-9+]/g, "")}
              style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 11, background: "var(--primary)", color: "#fff",
                fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>โทรหาลูกค้า</a>
          )}
          {job.map && (
            <a href={job.map} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, textAlign: "center", padding: "11px 0", borderRadius: 11, border: "1px solid var(--border-strong)",
                background: "var(--surface)", color: "var(--text-1)", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>เปิดแผนที่</a>
          )}
        </div>

        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ width: 116, flexShrink: 0, fontSize: 12, color: "var(--text-3)" }}>{k}</div>
            <div style={{ flex: 1, fontSize: 13.5, color: "var(--text-1)", fontWeight: 600, wordBreak: "break-word" }}>{v}</div>
          </div>
        ))}

        <button onClick={onClose}
          style={{ marginTop: 16, width: "100%", padding: "13px 0", borderRadius: 12, border: "1px solid var(--border-strong)",
            background: "var(--surface)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>ปิด</button>
      </div>
    </div>
  );
}

/* ================================================================
   LnApp — ตัวแอปทั้งหมดของหน้า LIFF
   ================================================================ */
function LnApp() {
  const auth  = window.useAuthStore();
  const store = window.useJobStore();
  const techStore = window.useTechStore();
  const notif = window.useNotifStore();
  const roleCfg = window.useRoleConfig();

  const [tab, setTab]   = React.useState("jobs");
  const [q, setQ]       = React.useState("");
  const [open, setOpen] = React.useState(null);

  const me    = auth.current;
  const role  = React.useMemo(() => (me ? window.userRoles(me) : []), [me]);
  const scope = React.useMemo(() => window.jobScopeOf(role), [role, roleCfg.rev]);

  /* งานที่คนนี้เห็นได้ — เงื่อนไขเดียวกับเว็บ ไม่ทำชุดที่สอง */
  const mine = React.useMemo(() => {
    if (!me) return [];
    return (store.jobs || []).filter((j) => window.jobInScope(j, scope, me));
  }, [store.jobs, scope, me]);

  /* ค้นหา — ใช้ jobMatchQ (store.jsx) ตัวเดียวกับเว็บเดสก์ท็อป
     จะได้ไม่เป็นคนละพฤติกรรมเวลาเพิ่มช่องที่ค้นได้ */
  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const hit = mine.filter((j) => window.jobMatchQ(j, s));
    /* ยังไม่เสร็จขึ้นก่อน แล้วเรียงตามวันติดตั้งที่ใกล้ที่สุด — งานที่ต้องไปพรุ่งนี้ต้องอยู่บนสุด */
    return hit.slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0, bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return String(a.startDate || "9999").localeCompare(String(b.startDate || "9999"));
    });
  }, [mine, q]);

  /* แจ้งเตือนของฉัน — เงื่อนไขเดียวกับ myNotifs ใน app.jsx เป๊ะ */
  const myNotifs = React.useMemo(() => {
    if (!me) return [];
    const tid = me.techId;
    return (notif.notifs || []).filter((n) =>
      (tid && n.toTechId === tid) || (n.toUserId === me.id) || (n.toPerm && window.can(role, n.toPerm)));
  }, [notif.notifs, me, role]);
  const unread = myNotifs.filter((n) => !n.read).length;

  if (auth.loading || store.loading) return <window.LnSplash text="กำลังโหลดข้อมูล…" />;
  if (!me) return <window.LnSplash tone="bad" text="บัญชีนี้ถูกระงับหรือถูกลบไปแล้ว" sub="ติดต่อแอดมินของบริษัท" />;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <LnHead tab={tab} setTab={setTab} unread={unread} />

      {tab === "jobs" && (
        <React.Fragment>
          <div style={{ padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <input value={q} onChange={(e) => setQ(e.target.value)}
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              placeholder="ค้นหา ชื่อ · รหัสงาน · จังหวัด · เบอร์ · ที่อยู่"
              style={{ width: "100%", padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border-strong)",
                background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 15, outline: "none" }} />
            <div style={{ marginTop: 7, fontSize: 11.5, color: "var(--text-3)" }}>
              {scope.all ? "ทุกงานในระบบ" : "เฉพาะงานที่คุณรับผิดชอบ"} · {list.length} งาน
            </div>
          </div>
          {list.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
                {q ? "ไม่พบงานที่ตรงกับคำค้น" : "ยังไม่มีงานที่คุณรับผิดชอบ"}
              </div>
            : list.map((j) => <LnJobRow key={j.id} job={j} onOpen={setOpen} />)}
        </React.Fragment>
      )}

      {tab === "bell" && (
        myNotifs.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>ยังไม่มีแจ้งเตือน</div>
          : myNotifs.map((n) => (
              <div key={n.id} onClick={() => {
                  if (!n.read) notif.markRead(n.id);
                  const j = (store.jobs || []).find((x) => x.id === n.jobId);
                  if (j) { setOpen(j); setTab("jobs"); }
                }}
                style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer",
                  background: n.read ? "var(--surface)" : "var(--primary-soft)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{n.title || "แจ้งเตือน"}</div>
                {n.body && <div style={{ marginTop: 3, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{n.body}</div>}
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-3)" }}>
                  {n.at ? window.drShort(String(n.at).slice(0, 10)) + " " + String(n.at).slice(11, 16) : ""}
                </div>
              </div>
            ))
      )}

      {tab === "me" && (
        <div style={{ padding: 18 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-1)" }}>{me.name}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {role.map((r) => {
                const ri = window.ROLE_INFO[r] || {};
                return <span key={r} style={{ padding: "3px 10px", borderRadius: 99, background: (ri.color || "#888") + "18",
                  color: ri.color || "var(--text-2)", fontSize: 11.5, fontWeight: 700 }}>{ri.th || r}</span>;
              })}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-3)" }}>ชื่อผู้ใช้ {me.username || "—"}</div>
          </div>

          {window.LN_TEST && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "var(--tint-amber-bg)",
              border: "1px solid var(--tint-amber-bd)", color: "var(--tint-amber-tx)", fontSize: 12.5, fontWeight: 700, textAlign: "center" }}>
              โหมดทดสอบ — ข้อมูลที่บันทึกจะไม่เข้าระบบจริง
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
            ลงเวลาเข้า-ออกงาน · ขอ OT · เบิกเงิน · รายงานประจำวัน
            <br />กำลังทยอยเปิดใช้ในเฟสถัดไป
          </div>
        </div>
      )}

      <LnJobSheet job={open} techs={techStore.techs} onClose={() => setOpen(null)} />
    </div>
  );
}

Object.assign(window, { LnApp, LnJobRow, LnJobSheet, LnHead });
