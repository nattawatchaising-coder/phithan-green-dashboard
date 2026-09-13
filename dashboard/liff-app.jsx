/* ============================================================
   flash+solar — หน้าจอในแอป LINE (LIFF) · คำนำหน้า ln / Ln

   เฟส 1: ค้นหา/ดูข้อมูลงาน · แจ้งเตือนของฉัน (อ่านอย่างเดียว)
   เฟส 2: ลงเวลาเข้า-ออกพร้อมพิกัด · ขอ OT  ← หน้าจอชุดแรกที่เขียนข้อมูลลงฐานจริง
   (เบิกเงิน · รายงานประจำวัน อยู่เฟสถัดไป)

   ⚠ ปุ่มลงเวลา **ห้ามปฏิเสธ** ไม่ว่าจะจับพิกัดได้หรือไม่ — ดูเหตุผลที่หัวไฟล์ attend.jsx

   หน้าจอชุดนี้ไม่ได้เขียนตรรกะสิทธิ์ใหม่เลย — ใช้ jobScopeOf/jobInScope/can
   ชุดเดียวกับเว็บเดสก์ท็อป ฉะนั้น "ช่างเห็นงานอะไรบ้าง" ตอบเหมือนกันทั้งสองที่เสมอ
   ============================================================ */

/* หกแท็บบนจอ 360px ได้ช่องละ 60px — ตัวหนังสือจึงต้องสั้นกว่าเดิม
   "เบิกเงิน"/"แจ้งเตือน" ยาวเกินจนตัดกลางคำ ใช้คำสั้นคู่กับไอคอนแทน */
const LN_TAB = [
  { key: "jobs",  th: "งาน",     icon: "wrench" },
  { key: "time",  th: "เวลา",    icon: "clock" },
  { key: "daily", th: "รายงาน",  icon: "pen" },
  { key: "ec",    th: "เบิก",    icon: "wallet" },
  { key: "bell",  th: "เตือน",   icon: "bell" },
  { key: "me",    th: "ฉัน",     icon: "user" },
];

/* ปุ่มบนเมนูล่างของ LINE ส่ง ?tab= ติดมากับ URL ของหน้า LIFF
   (LIFF ต่อ query ที่ผู้ใช้กดเข้ากับ endpoint ให้เอง)
   ช่างกด "ลงเวลา" แล้วต้องเจอหน้าลงเวลา ไม่ใช่มาเจอหน้างานแล้วต้องหาแท็บเอง
   ค่าที่ไม่รู้จัก = กลับไปหน้าแรก ไม่ใช่หน้าขาว */
const LN_START = (() => {
  let t = "";
  try { t = new URLSearchParams(window.location.search).get("tab") || ""; } catch (e) { t = ""; }
  if (t === "ot") return { tab: "time", ot: true };
  return { tab: LN_TAB.some((x) => x.key === t) ? t : "jobs", ot: false };
})();

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
            /* ไอคอนบน ตัวหนังสือล่าง — ห้าแท็บเรียงบรรทัดเดียวล้นจอ 360px ซึ่งเป็นจอที่ช่างใช้จริง */
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, position: "relative", padding: "8px 0 9px", border: "none", background: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, color: on ? "var(--primary-dark)" : "var(--text-3)",
                boxShadow: on ? "inset 0 -2.5px 0 var(--primary)" : "none",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <span style={{ position: "relative", lineHeight: 0 }}>
                <Icon name={t.icon} size={18} color={on ? "var(--primary-dark)" : "var(--text-3)"} />
                {t.key === "bell" && unread > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -11, minWidth: 16, height: 16, padding: "0 4px",
                    borderRadius: 99, background: "#D93025", color: "#fff", fontSize: 10, fontWeight: 800,
                    display: "inline-grid", placeItems: "center" }}>{unread}</span>
                )}
              </span>
              {t.th}
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
   ลงเวลา + ขอ OT (เฟส 2) — หน้าจอชุดแรกที่เขียนข้อมูลลงฐานจริงจากมือถือ
   ================================================================ */

const LN_BTN = { width: "100%", padding: "16px 18px", borderRadius: 15, border: "none",
  fontFamily: "inherit", fontSize: 16, fontWeight: 800, cursor: "pointer" };
const LN_FIELD = { width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border-strong)",
  background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16, outline: "none" };

/* ── ปุ่มลงเวลา ──
   ปุ่มเดียวที่เปลี่ยนความหมายตามสถานะของวันนี้ ไม่ใช่สองปุ่มวางข้างกัน
   ช่างกดตอนรีบและมือเปื้อน — สองปุ่มคือเวลาที่ผิดแล้วเจ้าตัวแก้เองไม่ได้ */
function LnClock({ me, cfg, jobs }) {
  const at = window.useAttend(me ? me.id : null, 14);
  const writer = window.useAttendWriter(me, cfg);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [jobId, setJobId] = React.useState("");

  const today = at.today;
  const open = window.tmOpen(today);
  const worked = window.tmWorkedMins(today, cfg);

  React.useEffect(() => {
    if (today && today.jobId) setJobId(today.jobId);
  }, [today && today.jobId]);

  const go = async () => {
    if (busy) return;
    setBusy(true); setMsg(null);
    const j = (jobs || []).find((x) => x.id === jobId);
    const res = await writer.punch(open ? "out" : "in", {
      src: "liff", jobId: j ? j.id : null, jobCode: j ? j.code : "",
    });
    setBusy(false);
    if (!res.ok) { setMsg({ bad: true, text: res.why }); return; }
    const p = res.punch || {};
    setMsg({ bad: false, text: (open ? "ลงเวลาออกงาน " : "ลงเวลาเข้างาน ") + p.hm
      + (p.err ? " · ไม่ได้พิกัด บันทึกไว้แล้วว่าไม่มี" : " · บันทึกพิกัดแล้ว") });
  };

  return (
    <div style={{ padding: 18 }}>
      <div style={{ padding: "18px 16px", borderRadius: 17, background: "var(--surface)",
        border: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 700 }}>{window.drDateTH(window.drToday())}</div>
        <div style={{ marginTop: 9, display: "flex", justifyContent: "center", gap: 26 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>เข้างาน</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800,
              color: today && today.in ? "var(--text-1)" : "var(--text-3)" }}>
              {(today && today.in && today.in.hm) || "--:--"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>ออกงาน</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800,
              color: today && today.out ? "var(--text-1)" : "var(--text-3)" }}>
              {(today && today.out && today.out.hm) || "--:--"}
            </div>
          </div>
        </div>
        {worked > 0 && <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--text-2)" }}>ทำงานแล้ว {window.tmDur(worked)}</div>}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>วันนี้ไปงานไหน (ไม่บังคับ)</div>
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={LN_FIELD}>
          <option value="">— ไม่ระบุ —</option>
          {(jobs || []).slice(0, 80).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
        </select>
      </div>

      <button onClick={go} disabled={busy}
        style={Object.assign({}, LN_BTN, { marginTop: 14,
          background: busy ? "var(--surface3)" : open ? "#EF4444" : "var(--primary)",
          color: busy ? "var(--text-3)" : "#fff" })}>
        {busy ? "กำลังบันทึก…" : open ? "ลงเวลาออกงาน" : "ลงเวลาเข้างาน"}
      </button>

      {msg && (
        <div style={{ marginTop: 11, padding: "11px 13px", borderRadius: 12, fontSize: 13, fontWeight: 700, textAlign: "center",
          background: msg.bad ? "var(--tint-amber-bg)" : "var(--primary-soft)",
          color: msg.bad ? "var(--tint-amber-tx)" : "var(--primary-dark)" }}>{msg.text}</div>
      )}

      {/* ข้อความนี้ไม่ใช่คำโฆษณา — ช่างต้องรู้ล่วงหน้าว่าระบบเก็บพิกัด
          และต้องไม่เข้าใจผิดว่าระบบตรวจว่าอยู่หน้างานจริงหรือไม่ (ยังไม่มีพิกัดไซต์ที่เชื่อถือได้) */}
      <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
        ระบบขอพิกัดตอนกด — ถ้าไม่ได้ ก็ลงเวลาให้ตามปกติแล้วบันทึกไว้ว่าไม่มีพิกัด
        <br />งานที่เลือกเป็นข้อมูลที่คุณแจ้งเอง ระบบไม่ได้ตรวจระยะทาง
      </div>

      {(at.rows || []).length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-1)", marginBottom: 7 }}>ย้อนหลัง</div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
            {(at.rows || []).slice(0, 10).map((r) => (
              <div key={r.date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px",
                borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12.5, color: "var(--text-2)", minWidth: 84 }}>{window.drShort(r.date)}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                  {(r.in && r.in.hm) || "—"} → {(r.out && r.out.hm) || "—"}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--text-3)" }}>
                  {window.tmDur(window.tmWorkedMins(r, cfg))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ใบขอ OT บนมือถือ ──
   ฟอร์มสั้นที่สุดที่ยังมีความหมาย: วัน · ตั้งแต่-ถึง · เหตุผล
   ประเภท (ปกติ/วันหยุด/กลางคืน) เดาให้จากวันและเวลา ไม่ถาม —
   ช่างไม่ควรต้องจำว่าระเบียบบริษัทนับ "กลางคืน" เริ่มกี่โมง */
function LnOtForm({ me, users, cfg, jobs, otStore, onClose }) {
  const [f, setF] = React.useState(() => window.tmOtBlank(me, users, otStore.rows, null, cfg));
  const [sending, setSending] = React.useState(false);

  const set = (k, v) => setF((p) => {
    const n = Object.assign({}, p, { [k]: v });
    if (k === "date" || k === "from") n.kind = window.tmOtKindGuess(n.date, n.from, cfg);
    return n;
  });

  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg);
  const ready = mins > 0 && !!f.reason.trim();

  const send = () => {
    if (!ready || sending) return;
    setSending(true);
    const j = (jobs || []).find((x) => x.id === f.jobId);
    const rec = window.tmOtMove(Object.assign({}, f, { mins, jobCode: j ? j.code : "" }), "sent", me, "");
    otStore.save(rec);
    const when = window.drShort(rec.date) + " " + rec.from + "-" + rec.to;
    /* เตือนคนอนุมัติ — ถ้าโปรไฟล์ไม่ได้ตั้งผู้อนุมัติไว้ ส่งเข้ากองกลางแทน
       (กฎเดียวกับหน้าเดสก์ท็อป ใบต้องไม่ค้างเงียบรอคนที่ไม่มีอยู่จริง) */
    if (rec.approverId) {
      window.tmNotify({ toUserId: rec.approverId, title: "ขออนุมัติ OT · " + rec.no,
        body: rec.userName + " · " + when + " · " + window.tmDur(rec.mins) });
    } else {
      window.tmNotify({ toPerm: "otApprove", title: "ขออนุมัติ OT · " + rec.no,
        body: rec.userName + " · " + when + " · " + window.tmDur(rec.mins) });
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)", overflow: "auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", gap: 10,
        padding: "13px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        paddingTop: "calc(13px + env(safe-area-inset-top, 0px))" }}>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4, lineHeight: 0 }}>
          <Icon name="x" size={20} color="var(--text-2)" />
        </button>
        <b style={{ fontSize: 15.5, color: "var(--text-1)" }}>ขอทำงานล่วงเวลา</b>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--text-3)" }}>{f.no}</span>
      </div>

      <div style={{ padding: 18, display: "grid", gap: 13 }}>
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>วันที่</span>
          <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} style={LN_FIELD} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตั้งแต่</span>
            <input type="time" value={f.from} onChange={(e) => set("from", e.target.value)} style={LN_FIELD} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ถึง</span>
            <input type="time" value={f.to} onChange={(e) => set("to", e.target.value)} style={LN_FIELD} />
          </label>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: 13, background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>นับเป็น OT</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800,
              color: mins ? "var(--primary-dark)" : "var(--text-3)" }}>{window.tmDur(mins)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            {window.tmOtKindOf(f.kind).th}
            {window.tmIsWorkday(f.date, cfg) ? " · ตัดช่วงที่ทับเวลางานปกติออกแล้ว" : " · นอกวันทำงาน นับทั้งช่วง"}
          </div>
        </div>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>งานที่เกี่ยวข้อง (ไม่บังคับ)</span>
          <select value={f.jobId || ""} onChange={(e) => set("jobId", e.target.value || null)} style={LN_FIELD}>
            <option value="">— ไม่ระบุ —</option>
            {(jobs || []).slice(0, 80).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
        </label>

        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เหตุผล</span>
          <textarea rows={3} value={f.reason} onChange={(e) => set("reason", e.target.value)}
            placeholder="เช่น ต้องปิดงานให้ทันก่อนการไฟฟ้าเข้าตรวจพรุ่งนี้เช้า"
            style={Object.assign({}, LN_FIELD, { resize: "vertical", lineHeight: 1.6 })} />
        </label>

        <button onClick={send} disabled={!ready || sending}
          style={Object.assign({}, LN_BTN, {
            background: ready && !sending ? "var(--primary)" : "var(--surface3)",
            color: ready && !sending ? "#fff" : "var(--text-3)" })}>
          {sending ? "กำลังส่ง…" : "ส่งขออนุมัติ"}
        </button>

        {mins <= 0 && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.7 }}>
            ช่วงเวลานี้ยังไม่นับเป็น OT — ต้องอยู่นอกเวลางานปกติ และนานพอตามที่บริษัทตั้งไว้
          </div>
        )}
        {mins > 0 && !f.reason.trim() && (
          <div style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", lineHeight: 1.7 }}>
            ต้องกรอกเหตุผล — คนอนุมัติตัดสินจากบรรทัดนี้บรรทัดเดียว
          </div>
        )}
      </div>
    </div>
  );
}

/* ── แท็บ "เวลา" = ลงเวลา + ใบ OT ของฉัน ── */
function LnTimeTab({ me, users, role, jobs, startOt }) {
  const wh = window.useWorkHours();
  const otStore = window.useOtClaims();
  /* เปิดฟอร์มทันทีเมื่อมาจากปุ่ม "ขอ OT" บนเมนูล่าง — แต่ยังต้องผ่านสิทธิ์
     ลิงก์ไม่ใช่ใบอนุญาต ใครก็พิมพ์ ?tab=ot เองได้ */
  const [form, setForm] = React.useState(!!startOt && window.tmCanOt(role));

  /* กรองที่ชั้นข้อมูล ไม่ใช่แค่ซ่อนบนหน้าจอ — ใบ OT ของคนอื่นไม่ใช่เรื่องของคนนี้ */
  const myOt = React.useMemo(
    () => (otStore.rows || []).filter((r) => r && r.userId === (me || {}).id),
    [otStore.rows, me]);

  return (
    <React.Fragment>
      {window.tmCanAttend(role)
        ? <LnClock me={me} cfg={wh.cfg} jobs={jobs} />
        : <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
            บัญชีนี้ยังไม่ได้เปิดสิทธิ์ลงเวลา
          </div>}

      {window.tmCanOt(role) && (
        <div style={{ padding: "0 18px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <b style={{ fontSize: 13, color: "var(--text-1)" }}>ใบขอ OT ของฉัน</b>
            <button onClick={() => setForm(true)}
              style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 10, border: "none",
                background: "var(--primary)", color: "#fff", fontFamily: "inherit", fontSize: 12.5,
                fontWeight: 800, cursor: "pointer" }}>+ ขอ OT</button>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden", background: "var(--surface)" }}>
            {myOt.length === 0
              ? <div style={{ padding: 22, textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>ยังไม่มีใบขอ OT</div>
              : myOt.slice(0, 15).map((r) => {
                  const st = window.tmOtStatusOf(r.status);
                  return (
                    <div key={r.id} style={{ padding: "11px 13px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                          {window.drShort(r.date)} · {r.from}-{r.to}
                        </span>
                        <span style={{ padding: "2px 8px", borderRadius: 99, background: st.color + "1A",
                          color: st.color, fontSize: 10.5, fontWeight: 800 }}>{st.th}</span>
                        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 800,
                          color: "var(--text-1)" }}>{window.tmDur(r.mins)}</span>
                      </div>
                      {r.reason && <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)" }}>{r.reason}</div>}
                      {r.decidedNote && <div style={{ marginTop: 3, fontSize: 11.5, color: st.color }}>“{r.decidedNote}”</div>}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {form && <LnOtForm me={me} users={users} cfg={wh.cfg} jobs={jobs} otStore={otStore} onClose={() => setForm(false)} />}
    </React.Fragment>
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

  const [tab, setTab]   = React.useState(LN_START.tab);
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

      {tab === "time" && <LnTimeTab me={me} users={auth.users} role={role} jobs={mine} startOt={LN_START.ot} />}

      {tab === "daily" && <window.LnDailyTab me={me} role={role} jobs={mine} notify={notif.addNotif} />}

      {tab === "ec" && <window.LnEcTab me={me} users={auth.users} role={role} jobs={mine} />}

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

        </div>
      )}

      <LnJobSheet job={open} techs={techStore.techs} onClose={() => setOpen(null)} />
    </div>
  );
}

Object.assign(window, { LnApp, LnJobRow, LnJobSheet, LnHead, LnClock, LnOtForm, LnTimeTab });
