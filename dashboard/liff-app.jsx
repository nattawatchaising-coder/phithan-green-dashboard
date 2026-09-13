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
  /* งานซ่อมแยกแท็บ ไม่ใช่ปนอยู่ในรายการงานติดตั้ง — มันคนละเรื่องกันจริง ๆ
     งานติดตั้งคือใบงานที่มีวันนัดและขั้นตอน ส่วนงานซ่อมคือเรื่องที่ลูกค้าแจ้งเข้ามา
     มีนาฬิกา SLA ของตัวเอง ปนกันแล้วงานซ่อมที่เลยกำหนดจะจมอยู่กลางรายการ */
  { key: "fix",   th: "ซ่อม",    icon: "alert" },
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
/* ── ไฟล์แนบของงาน (แบบ · BOQ) ──
   ไฟล์ถูกแนบไว้จากเว็บอยู่แล้ว (jobFiles/{jobId} เก็บ base64) ที่ขาดคือทางเปิดบนมือถือ
   ช่างที่ยืนอยู่หน้างานต้องเปิดแบบดูได้ ไม่ใช่โทรกลับมาให้ออฟฟิศส่งไลน์ให้

   ⚠ ไม่ subscribe jobFiles ตรง ๆ เพราะโหนดนั้นมี base64 ของทุกไฟล์อยู่ข้างใน
     เปิดใบงานทีก็จะดูดมาทั้งก้อนบน 4G — อ่าน jobFileFlags (บูลีนสองตัว) ก่อน
     แล้วค่อยโหลดไฟล์จริงตอนกด */
function LnJobFiles({ jobId }) {
  const flags = window.useJobFileFlag(jobId);
  const [busy, setBusy] = React.useState("");
  const [got, setGot] = React.useState(null);      /* {kind,url,name,size} ที่โหลดมาแล้ว */
  const [err, setErr] = React.useState("");

  React.useEffect(() => { setGot(null); setErr(""); setBusy(""); }, [jobId]);

  const kinds = [{ key: "design", th: "แบบติดตั้ง" }, { key: "boq", th: "ใบ BOQ" }];
  const have = kinds.filter((k) => flags && flags[k.key]);

  const grab = async (kind, th) => {
    setBusy(kind); setErr(""); setGot(null);
    const f = await window.loadJobFileOnce(jobId, kind);
    setBusy("");
    if (!f) return setErr("เปิด" + th + "ไม่สำเร็จ — ไฟล์อาจถูกลบไปแล้ว");
    setGot(Object.assign({ kind: kind, th: th }, f));
    /* ลองเปิดให้เลย ถ้าแอปบล็อกก็ยังมีปุ่มให้กดเองอยู่ข้างล่าง ไม่ใช่ทางตัน */
    try { window.open(f.url, "_blank", "noopener"); } catch (e) { /* ปล่อยให้กดเอง */ }
  };

  if (flags === null) return null;                 /* ยังอ่านไม่เสร็จ — อย่าเพิ่งโชว์ว่าไม่มีไฟล์ */

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-3)", marginBottom: 8 }}>ไฟล์แนบ</div>

      {have.length === 0
        ? <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
            งานนี้ยังไม่มีแบบหรือ BOQ แนบไว้ — แนบได้จากใบงานบนเว็บ
          </div>
        : <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {have.map((k) => (
              <button key={k.key} onClick={() => grab(k.key, k.th)} disabled={!!busy}
                style={{ flex: 1, minWidth: 140, padding: "12px 14px", borderRadius: 11,
                  border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>
                {busy === k.key ? "กำลังโหลด…" : "เปิด" + k.th + " (PDF)"}
              </button>
            ))}
          </div>}

      {err && <div style={{ marginTop: 9, fontSize: 12.5, color: "#EF4444", fontWeight: 700 }}>{err}</div>}

      {got && (
        <div style={{ marginTop: 10, padding: "11px 13px", borderRadius: 12, background: "var(--surface2)",
          border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", wordBreak: "break-all" }}>{got.name}</div>
          <div style={{ marginTop: 2, fontSize: 11.5, color: "var(--text-3)" }}>
            {got.size ? (got.size / 1048576).toFixed(1) + " MB" : ""} · โหลดเสร็จแล้ว
          </div>
          {/* ลิงก์ที่ผู้ใช้กดเอง ไม่ใช่ window.open จากสคริปต์ —
              WebView ของแอป LINE บล็อกการเปิดหน้าต่างด้วยสคริปต์บ่อย แต่ปล่อยให้กดลิงก์ผ่าน */}
          <a href={got.url} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", marginTop: 9, padding: "12px 0", borderRadius: 11, background: "var(--primary)",
              color: "#fff", fontWeight: 800, fontSize: 13.5, textAlign: "center", textDecoration: "none" }}>
            เปิด{got.th}
          </a>
          <div style={{ marginTop: 7, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            ถ้าไฟล์ไม่ขึ้น ให้กด ⋯ มุมขวาบนของไลน์ แล้วเลือก “เปิดในเบราว์เซอร์”
          </div>
        </div>
      )}
    </div>
  );
}

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

        <LnJobFiles jobId={job.id} />

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
function LnClock({ me, cfg, jobs, onAskOt }) {
  const at = window.useAttend(me ? me.id : null, 14);
  const writer = window.useAttendWriter(me, cfg);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [jobId, setJobId] = React.useState("");
  const [place, setPlace] = React.useState("site");
  /* งานบ้านกับงานโครงการปนกันอยู่ในช่องเดียว ช่างหนึ่งคนมักทำอย่างเดียวทั้งสัปดาห์
     กรองก่อนแล้วรายการสั้นลงจนหาด้วยตาได้ — บนมือถือกลางแดดที่ไซต์ รายการยาวเลื่อนหายากกว่าที่คิด */
  const [jobType, setJobType] = React.useState("all");

  /* นาฬิกาเดินเอง — ตัวเลข "ทำงานแล้วกี่ชั่วโมง" ต้องขยับโดยไม่ต้องปิดเปิดแอป
     ยี่สิบวินาทีพอ ตัวเลขแสดงเป็นนาทีอยู่แล้ว ถี่กว่านี้คือกินแบตเปล่า */
  const [nowHM, setNowHM] = React.useState(window.tmNowHM);
  React.useEffect(() => {
    const t = setInterval(() => setNowHM(window.tmNowHM()), 20000);
    return () => clearInterval(t);
  }, []);

  const today = at.today;
  const open = window.tmOpen(today);
  const worked = window.tmWorkedMins(today, cfg, open ? nowHM : null);
  const win = window.tmDayWindow(today, cfg);
  /* OT คิดจาก "เวลาที่กดจริง" เท่านั้น — ไม่ส่ง nowHM เข้าไปโดยตั้งใจ
     กะที่ยังไม่กดออกจึงยังไม่มีตัวเลข OT เพราะตัวเลขที่เดินตามเวลาจริงบอกอะไรไม่ได้
     ลืมกดออกค้างไว้แล้วกลับบ้าน เลขก็จะวิ่งขึ้นเรื่อย ๆ จนกลายเป็นตัวเลขที่ไม่มีความหมาย */
  const earned = window.tmOtEarned(today, cfg);
  const left = Math.max(0, window.tmWhNorm(cfg).workMins - worked);
  /* ปิดวันแล้ว = กดเข้าไปแล้วและกดออกไปแล้ว เหลืออย่างเดียวที่ทำได้คือแก้เวลาออก
     ไม่โชว์ปุ่มเข้างานค้างไว้ให้กด เพราะกดแล้วได้แต่ข้อความปฏิเสธ ซึ่งอ่านเหมือนระบบพัง */
  const closed = !open && !!(today && today.in && today.in.hm);
  const shifts = (today && Array.isArray(today.extra) ? today.extra : [])
    .filter((x) => x && x.in && x.in.hm);
  const jobPick = React.useMemo(
    () => (jobs || []).filter((j) => jobType === "all" || j.type === jobType).slice(0, 80),
    [jobs, jobType]);

  React.useEffect(() => {
    if (today && today.jobId) setJobId(today.jobId);
    if (today && today.place) setPlace(today.place);
  }, [today && today.jobId, today && today.place]);

  const go = async (redo) => {
    if (busy) return;
    setBusy(true); setMsg(null);
    const j = place === "office" ? null : (jobs || []).find((x) => x.id === jobId);
    const which = redo ? "out" : open ? "out" : "in";
    const res = await writer.punch(which, {
      src: "liff", place: place, jobId: j ? j.id : null, jobCode: j ? j.code : "", redo: !!redo,
    });
    setBusy(false);
    if (!res.ok) { setMsg({ bad: true, text: res.why }); return; }
    const p = res.punch || {};
    const head = redo ? "แก้เวลาออกงานเป็น " : open ? "ลงเวลาออกงาน " : "ลงเวลาเข้างาน ";
    setMsg({ bad: false, text: head + p.hm
      + (p.redoOf ? " (จากเดิม " + p.redoOf + ")" : "")
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
        {/* ── ทำงานแล้วกี่ชั่วโมง ──
            คำถามที่ช่างเปิดแอปมาถามบ่อยที่สุดคือ "เลิกได้กี่โมง" ไม่ใช่ "เข้ามากี่โมง"
            เวลาเลิกไม่ตายตัว เพราะนับ 8 ชม. + พัก 1 ชม. จากเวลาที่กดเข้าจริง */}
        {today && today.in && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 30, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.1 }}>
              {window.tmDur(worked)}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-3)" }}>
              {open ? "ทำงานแล้ว · กำลังนับอยู่" : "ทำงานทั้งวัน"}
            </div>
            <div style={{ marginTop: 7, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.7 }}>
              {open && left > 0
                ? <React.Fragment>ครบ {window.tmDur(window.tmWhNorm(cfg).workMins)} เวลา <b>{win.end}</b> · เหลืออีก {window.tmDur(left)}</React.Fragment>
                : <React.Fragment>ครบเวลางานปกติแล้วตั้งแต่ <b>{win.end}</b></React.Fragment>}
            </div>
            {/* OT ขึ้นตอนกดออกงาน ไม่ใช่ตอนนาฬิกาเดินเลยเวลาเลิก — ต้องบอกไว้
                ไม่งั้นช่างจะรอดูการ์ด OT ที่ไม่มีวันขึ้น แล้วคิดว่าระบบไม่นับ OT ให้ */}
            {open && left === 0 && (
              <div style={{ marginTop: 5, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.6 }}>
                เลยเวลางานปกติมาแล้ว · กดออกงานก่อน แล้วค่อยขอ OT ตามเวลาที่กดจริง
              </div>
            )}
            {/* ใบเก่าที่มีกะซ้อน — การ์ดนี้เคยโชว์แค่คู่แรก ชั่วโมงรวมจึงไม่ตรงกับตัวเลขข้างบน
                โดยไม่มีอะไรบอก ระบบไม่เปิดกะใหม่แล้ว แต่ของเดิมต้องมองเห็นได้ */}
            {shifts.length > 0 && (
              <div style={{ marginTop: 7, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
                มีช่วงเวลาซ้อนในใบนี้อีก {shifts.length} ช่วง ·{" "}
                <span style={{ fontFamily: "var(--mono)" }}>
                  {shifts.map((x) => x.in.hm + "–" + ((x.out && x.out.hm) || "?")).join(", ")}
                </span>
                {" "}— รวมอยู่ในชั่วโมงข้างบนแล้ว ถ้าไม่ถูกต้องแจ้งออฟฟิศ
              </div>
            )}
            {win.late && (
              <div style={{ marginTop: 5, fontSize: 11.5, color: "#F59E0B", fontWeight: 700 }}>
                เข้างานหลัง {window.tmWhNorm(cfg).startLate} · สาย {window.tmDur(win.lateMins)} — เวลาเลิกเลื่อนตามจริง
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ทำเกินเวลาแล้ว ──
          ระบบไม่เปิดใบให้เอง ตั้งใจ — ทำเกินนิดหน่อยแล้วไม่ขอเป็นเรื่องปกติ
          ถ้าเปิดใบให้อัตโนมัติ คนอนุมัติจะเจอใบสามสิบใบทุกเช้าและเลิกอ่านทั้งกอง */}
      {earned.mins > 0 && (
        <div style={{ marginTop: 12, padding: "13px 15px", borderRadius: 14,
          background: "var(--tint-amber-bg)", border: "1px solid #F59E0B44" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--tint-amber-tx)" }}>ทำเกินเวลางานแล้ว</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 19, fontWeight: 800, color: "var(--tint-amber-tx)" }}>
              {window.tmDur(earned.mins)}
            </span>
          </div>
          <div style={{ marginTop: 3, fontFamily: "var(--mono)", fontSize: 12, color: "var(--tint-amber-tx)", opacity: .85 }}>
            {earned.from} – {earned.to}
          </div>
          {onAskOt && (
            /* ส่งช่วงเวลางานของวันนี้ไปด้วย — ฟอร์มต้องใช้ตัดส่วนที่ทับเวลางานปกติ
               และมีแต่ที่นี่ที่ถือใบลงเวลาอยู่ในมือ */
            <button onClick={() => onAskOt(Object.assign({}, earned, { win: win }))}
              style={{ marginTop: 10, width: "100%", padding: "12px 14px", borderRadius: 12, border: "none",
                background: "#F59E0B", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              ขอ OT ช่วงนี้
            </button>
          )}
          <div style={{ marginTop: 7, fontSize: 11, color: "var(--tint-amber-tx)", opacity: .8, lineHeight: 1.6 }}>
            จะขอหรือไม่ขอก็ได้ ระบบไม่เปิดใบให้เอง — ขอได้เฉพาะช่วงที่ทำเกินจริงตามเวลาที่ลงไว้
          </div>
        </div>
      )}

      {/* ── ลงเวลาที่ไหน ──
          ไม่ใช่ทุกคนอยู่หน้างาน คนที่เข้าออฟฟิศทั้งวันก็ต้องลงเวลา
          เลือกออฟฟิศแล้วไม่ต้องถามว่าไปงานไหน — ถามไปก็ไม่มีคำตอบที่ถูก */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>ลงเวลาที่ไหน</div>
        <div style={{ display: "flex", gap: 9 }}>
          {window.TM_PLACE.map((p) => (
            <button key={p.key} onClick={() => setPlace(p.key)}
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "13px 10px", borderRadius: 13, cursor: "pointer", fontFamily: "inherit",
                fontSize: 14, fontWeight: 800,
                border: "1px solid " + (place === p.key ? "var(--primary)" : "var(--border-strong)"),
                background: place === p.key ? "var(--primary-soft)" : "var(--surface)",
                color: place === p.key ? "var(--primary-dark)" : "var(--text-2)" }}>
              <Icon name={p.icon} size={16} color={place === p.key ? "var(--primary-dark)" : "var(--text-3)"} />
              {p.th}
            </button>
          ))}
        </div>
      </div>

      {place !== "office" && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>วันนี้ไปงานไหน (ไม่บังคับ)</div>
          {/* ชิปประเภทงาน — ตัดรายการใน select ให้สั้นลงก่อนหา
              ไม่ได้กรองใบลงเวลา — เลือกงานไหนก็บันทึกงานนั้น ชิปนี้แค่ช่วยหา */}
          <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
            {[{ key: "all", th: "ทั้งหมด" }].concat(window.SF.TYPES).map((t) => (
              <button key={t.key} onClick={() => {
                setJobType(t.key);
                /* งานที่เลือกค้างไว้หลุดจากรายการแล้วต้องล้าง ไม่งั้นจะค้างอยู่แบบมองไม่เห็น */
                const cur = (jobs || []).find((x) => x.id === jobId);
                if (cur && t.key !== "all" && cur.type !== t.key) setJobId("");
              }}
                style={{ flex: 1, padding: "8px 6px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 800,
                  border: "1px solid " + (jobType === t.key ? "var(--primary)" : "var(--border-strong)"),
                  background: jobType === t.key ? "var(--primary-soft)" : "var(--surface)",
                  color: jobType === t.key ? "var(--primary-dark)" : "var(--text-2)" }}>
                {t.th}
              </button>
            ))}
          </div>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} style={LN_FIELD}>
            <option value="">— ไม่ระบุ —</option>
            {jobPick.map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
          </select>
          {jobPick.length === 0 && (
            <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-3)" }}>ไม่มีงานประเภทนี้ในมือ — ลงเวลาโดยไม่ระบุงานก็ได้</div>
          )}
        </div>
      )}

      {!closed && (
        <button onClick={() => go(false)} disabled={busy}
          style={Object.assign({}, LN_BTN, { marginTop: 14,
            background: busy ? "var(--surface3)" : open ? "#EF4444" : "var(--primary)",
            color: busy ? "var(--text-3)" : "#fff" })}>
          {busy ? "กำลังบันทึก…" : open ? "ลงเวลาออกงาน" : "ลงเวลาเข้างาน"}
        </button>
      )}

      {/* ── กดออกงานทับ ──
          กดออกเร็วไปเพราะนึกว่าจะกลับแล้วไม่ได้กลับ เป็นเรื่องที่เกิดทุกวัน
          กดเข้าใหม่จะกลายเป็นกะที่สอง ซึ่งไม่ใช่สิ่งที่เกิดขึ้นจริง — ต้องเขียนทับเวลาเดิม */}
      {closed && (
        <React.Fragment>
          <button onClick={() => go(true)} disabled={busy}
            style={Object.assign({}, LN_BTN, { marginTop: 14,
              background: busy ? "var(--surface3)" : "var(--surface)",
              color: busy ? "var(--text-3)" : "var(--text-1)",
              border: "1px solid var(--border-strong)" })}>
            {busy ? "กำลังบันทึก…" : "กดออกงานใหม่ · ทับเวลาเดิม"}
          </button>
          <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7, textAlign: "center" }}>
            วันนี้ลงเวลาครบแล้ว · กดออกเร็วไปกดทับได้เลย ไม่เปิดรอบใหม่
            <br />เวลาเข้างานแก้ไม่ได้ ต้องแจ้งออฟฟิศ
          </div>
        </React.Fragment>
      )}

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
function LnOtForm({ me, users, cfg, jobs, otStore, limit, onClose }) {
  /* limit = ช่วงที่ทำเกินจริงจากใบลงเวลาวันนี้ (tmOtEarned) — ส่งมาเมื่อกดจากการ์ดลงเวลา
     มาทางนี้แล้ววันที่ล็อกและเวลาถูกตรึงอยู่ในช่วงที่อยู่ที่ทำงานจริง
     เปิดฟอร์มเปล่าจากปุ่ม "+ ขอ OT" ยังกรอกอิสระได้เหมือนเดิม */
  const locked = !!(limit && limit.has && limit.mins > 0);
  const [f, setF] = React.useState(() => {
    const b = window.tmOtBlank(me, users, otStore.rows, null, cfg);
    if (!locked) return b;
    return Object.assign(b, { date: limit.date || b.date, from: limit.from, to: limit.to,
      kind: window.tmOtKindGuess(limit.date || b.date, limit.from, cfg) });
  });
  const [sending, setSending] = React.useState(false);

  const set = (k, v) => setF((p) => {
    const n = Object.assign({}, p, { [k]: v });
    if (k === "date" || k === "from") n.kind = window.tmOtKindGuess(n.date, n.from, cfg);
    return n;
  });

  /* ตัดช่วงที่ทับเวลางานปกติออกโดยอิงเวลาเข้างานจริงของวันนี้ ไม่ใช่เวลามาตรฐาน
     เข้า 09:30 ก็ต้องเลิก 18:30 — ใช้เวลามาตรฐานจะนับ 17:30-18:30 เป็น OT ทั้งที่ยังไม่ครบ 8 ชม. */
  const win = locked && f.date === limit.date ? limit.win : null;
  const mins = window.tmOtMinutes(f.date, f.from, f.to, cfg, win);
  const inLimit = window.tmOtInLimit(f.date, f.from, f.to, limit);
  const approvers = React.useMemo(() => window.tmOtApprovers(users, me), [users, me]);
  const ready = mins > 0 && inLimit && !!f.reason.trim();

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
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--bg)", overflowY: "auto", overflowX: "hidden" }}>
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
          <input type="date" value={f.date} disabled={locked} onChange={(e) => set("date", e.target.value)} style={LN_FIELD} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 11 }}>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตั้งแต่</span>
            <input type="time" value={f.from} min={locked ? limit.lo : undefined} max={locked ? limit.hi : undefined}
              onChange={(e) => set("from", e.target.value)} style={LN_FIELD} />
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ถึง</span>
            <input type="time" value={f.to} min={locked ? limit.lo : undefined} max={locked ? limit.hi : undefined}
              onChange={(e) => set("to", e.target.value)} style={LN_FIELD} />
          </label>
        </div>

        {/* min/max ของ input[type=time] เป็นแค่คำแนะนำ เบราว์เซอร์ไม่ได้กันทุกตัว
            ตัวที่กันจริงคือ tmOtInLimit ที่ปิดปุ่มส่ง — บรรทัดนี้บอกว่าทำไมถึงกด */}
        {locked && (
          <div style={{ padding: "10px 13px", borderRadius: 12, fontSize: 11.5, lineHeight: 1.7,
            background: inLimit ? "var(--surface2)" : "var(--tint-amber-bg)",
            color: inLimit ? "var(--text-3)" : "var(--tint-amber-tx)" }}>
            {inLimit
              ? "ขอได้เฉพาะช่วงที่อยู่ที่ทำงานจริงวันนี้ — ลงเวลา " + limit.lo + " ถึง " + limit.hi
              : "ช่วงนี้อยู่นอกเวลาที่ลงไว้ (" + limit.lo + " – " + limit.hi + ") ขอไม่ได้"}
          </div>
        )}

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

        {/* ── ส่งให้ใครอนุมัติ ──
            เดิมใบไปตามสายอนุมัติในโปรไฟล์ ซึ่งหลายคนยังไม่ได้ตั้ง ใบจึงเข้ากองกลาง
            แล้วก็ค้างเพราะไม่มีใครรู้สึกว่าเป็นหน้าที่ตัวเอง — ถามตรงนี้ให้จบ */}
        <label style={{ display: "grid", gap: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ส่งให้ใครอนุมัติ</span>
          <select value={f.approverId || ""}
            onChange={(e) => {
              const u = approvers.find((x) => x.id === e.target.value);
              setF((p) => Object.assign({}, p, { approverId: u ? u.id : null, approverName: u ? u.name : "" }));
            }} style={LN_FIELD}>
            <option value="">— ใครก็ได้ที่มีสิทธิ์ —</option>
            {approvers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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
            {win ? " (วันนี้เวลางานปกติจบ " + win.end + " เพราะเข้างาน " + limit.lo + ")" : ""}
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
  /* ช่วงที่ทำเกินจริงของวันนี้ — มีค่าเมื่อเปิดฟอร์มจากปุ่มบนการ์ดลงเวลา
     ต้องล้างทุกครั้งที่ปิดฟอร์ม ไม่งั้นกด "+ ขอ OT" ครั้งถัดไปจะยังโดนล็อกอยู่ */
  const [limit, setLimit] = React.useState(null);
  const closeForm = () => { setForm(false); setLimit(null); };

  const cancelOt = (r) => {
    const next = window.tmOtMove(r, "cancelled", me, "");
    if (!next) return;
    otStore.save(next);
    /* ใบที่ส่งไปแล้ว — คนอนุมัติต้องรู้ว่าไม่ต้องรออีก ใบที่ยังเป็นร่างไม่มีใครรอ ไม่ต้องเตือน */
    if (r.status === "sent" && r.approverId) {
      window.tmNotify({ toUserId: r.approverId, title: "ยกเลิกใบขอ OT · " + r.no,
        body: r.userName + " · " + window.drShort(r.date) + " " + r.from + "-" + r.to + " · ไม่ต้องพิจารณาแล้ว" });
    }
  };

  /* กรองที่ชั้นข้อมูล ไม่ใช่แค่ซ่อนบนหน้าจอ — ใบ OT ของคนอื่นไม่ใช่เรื่องของคนนี้ */
  const myOt = React.useMemo(
    () => (otStore.rows || []).filter((r) => r && r.userId === (me || {}).id),
    [otStore.rows, me]);

  return (
    <React.Fragment>
      {window.tmCanAttend(role)
        ? <LnClock me={me} cfg={wh.cfg} jobs={jobs}
            onAskOt={window.tmCanOt(role) ? ((lim) => { setLimit(lim); setForm(true); }) : null} />
        : <div style={{ padding: 34, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>
            บัญชีนี้ยังไม่ได้เปิดสิทธิ์ลงเวลา
          </div>}

      {window.tmCanOt(role) && (
        <div style={{ padding: "0 18px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <b style={{ fontSize: 13, color: "var(--text-1)" }}>ใบขอ OT ของฉัน</b>
            <button onClick={() => { setLimit(null); setForm(true); }}
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
                      {r.approverName && <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)" }}>ส่งถึง {r.approverName}</div>}
                      {r.reason && <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--text-3)" }}>{r.reason}</div>}
                      {r.decidedNote && <div style={{ marginTop: 3, fontSize: 11.5, color: st.color }}>“{r.decidedNote}”</div>}
                      {/* ยกเลิกได้เองตราบใดที่ยังไม่มีใครตัดสิน — ใบที่อนุมัติแล้วแตะไม่ได้
                          ยกเลิกไม่ใช่การลบ ใบยังอยู่ให้ตรวจย้อนหลังว่าเคยขอแล้วถอน */}
                      {window.tmOtOpen(r) && (
                        <button onClick={() => cancelOt(r)}
                          style={{ marginTop: 7, padding: "7px 13px", borderRadius: 9,
                            border: "1px solid var(--border-strong)", background: "var(--surface)",
                            color: "#EF4444", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          ยกเลิกใบนี้
                        </button>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {form && <LnOtForm me={me} users={users} cfg={wh.cfg} jobs={jobs} otStore={otStore}
        limit={limit} onClose={closeForm} />}
    </React.Fragment>
  );
}

/* ชื่อ LnChips ถูกใช้ไปแล้วใน liff-ec.js ซึ่งโหลดก่อนไฟล์นี้ — สคริปต์ชุดนี้ใช้ขอบเขตร่วมกัน
   ตั้งชื่อซ้ำ = ตัวหลังทับตัวหน้าเงียบ ๆ แล้วฟอร์มใบเบิกจะเพี้ยนโดยไม่มี error */
/* ── ปุ่มกรองทรงเม็ดยา ── ใช้ซ้ำทั้งแท็บงานและแท็บซ่อม */
function LnPick({ items, value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {items.map((it) => {
        const on = value === it.key;
        return (
          <button key={it.key} onClick={() => onPick(it.key)}
            style={{ padding: "7px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
              fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
              border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
              background: on ? "var(--primary-soft)" : "var(--surface2)",
              color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
            {it.th}{it.n != null ? " " + it.n : ""}
          </button>
        );
      })}
    </div>
  );
}

/* ── แท็บงานซ่อม ──
   อ่านใบแจ้งซ่อมจาก omTickets ชุดเดียวกับหน้า O&M บนเดสก์ท็อป และเดินสถานะ
   ด้วย omTicketNext/omTicketMove ตัวเดียวกัน — ไม่มีตรรกะสถานะชุดที่สองในไฟล์นี้

   เปิดใบใหม่ยังต้องทำจากเดสก์ท็อป เพราะการเปิดใบต้องเลือกไซต์ในสัญญาบริการ
   และตัดสินเรื่องประกัน/ค่าใช้จ่าย ซึ่งไม่ใช่สิ่งที่ทำบนจอ 360px ตอนอยู่หน้างาน */
function LnFixTab({ me, role }) {
  const store = window.useOmTickets ? window.useOmTickets() : { tickets: [], loading: false, save: null };
  const [filter, setFilter] = React.useState("open");
  const [open, setOpen] = React.useState(null);
  const today = window.drToday();

  const canAll = window.can(role, "om");
  const uid = (me || {}).id || null;
  const tid = (me || {}).techId || null;

  /* ใบที่ "เป็นของคนนี้" — ผู้รับผิดชอบที่เลือกไว้ หรือช่างที่ผูกกับไซต์
     คนที่มีสิทธิ์ O&M เห็นได้ทั้งหมด แต่ตั้งต้นที่ใบของตัวเองเสมอ */
  const visible = React.useMemo(() => {
    const all = store.tickets || [];
    if (filter === "all" && canAll) return all;
    return all.filter((t) => t && ((uid && t.assigneeId === uid) || (tid && t.techId === tid)));
  }, [store.tickets, filter, canAll, uid, tid]);

  const list = React.useMemo(() => {
    if (filter === "done") return visible.filter((t) => !window.omTicketOpen(t));
    if (filter === "open") return visible.filter((t) => window.omTicketOpen(t));
    return visible;
  }, [visible, filter]);

  const mineOpen = (store.tickets || []).filter((t) =>
    window.omTicketOpen(t) && ((uid && t.assigneeId === uid) || (tid && t.techId === tid))).length;

  const chips = [{ key: "open", th: "ที่ต้องทำ", n: mineOpen }, { key: "done", th: "ปิดแล้ว" }];
  if (canAll) chips.push({ key: "all", th: "ทั้งบริษัท" });

  /* ปิดงาน = ต้องเขียนว่าแก้อะไรไป ไม่ใช่กดปิดเฉย ๆ
     ใบที่ปิดโดยไม่มีผลการแก้ไข ตอนลูกค้าโทรมาถามซ้ำอีกสามเดือนจะไม่มีใครตอบได้
     สถานะอื่นไม่บังคับ เพราะยังไม่จบเรื่อง เขียนตอนปิดทีเดียวพอ */
  const move = (t, to, note) => {
    const next = window.omTicketMove(t, to, me, note || "");
    if (!next || !store.save) return;
    if (to === "closed") next.result = note || "";
    store.save(next);
    setOpen(next);
  };

  if (store.loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>กำลังโหลด…</div>;

  return (
    <React.Fragment>
      <div style={{ padding: "12px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <LnPick items={chips} value={filter} onPick={setFilter} />
        <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)" }}>
          {filter === "all" ? "ใบแจ้งซ่อมทั้งบริษัท" : "เฉพาะใบที่คุณรับผิดชอบ"} · {list.length} ใบ
        </div>
      </div>

      {list.length === 0
        ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5, lineHeight: 1.7 }}>
            {filter === "done" ? "ยังไม่มีใบที่ปิดแล้ว" : "ไม่มีใบแจ้งซ่อมที่ค้างอยู่"}
            <br /><span style={{ fontSize: 12 }}>ใบแจ้งซ่อมเปิดจากหน้า O&amp;M บนเว็บ แล้วจะมาโผล่ที่นี่เมื่อระบุผู้รับผิดชอบเป็นคุณ</span>
          </div>
        : list.map((t) => {
            const st = window.omTicketStatusOf(t.status);
            const sev = window.OM_SEVERITY_BY[t.severity] || {};
            const late = window.omTicketOverdue(t, today);
            return (
              <div key={t.id} onClick={() => setOpen(t)}
                style={{ padding: "13px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{t.no || t.id}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 99, background: st.color + "1A", color: st.color,
                    fontSize: 10.5, fontWeight: 800 }}>{st.th}</span>
                  {late && <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 800, color: "#EF4444" }}>เลย {late.over} วัน</span>}
                </div>
                <div style={{ marginTop: 4, fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>{t.title || "ไม่ได้ระบุอาการ"}</div>
                <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
                  {t.siteName || t.siteCode || "—"}
                  {sev.th ? " · " + sev.th : ""}
                  {t.apptDate ? " · นัด " + window.drShort(t.apptDate) : ""}
                </div>
              </div>
            );
          })}

      {open && <LnFixSheet t={open} role={role} onMove={move} onClose={() => setOpen(null)} />}
    </React.Fragment>
  );
}

/* ── แผ่นรายละเอียดใบแจ้งซ่อม ── */
function LnFixSheet({ t, role, onMove, onClose }) {
  const [closing, setClosing] = React.useState(false);
  const [note, setNote] = React.useState("");
  /* ปิดงานสำเร็จแล้วต้องพับฟอร์มเอง — ปุ่ม "ปิดงานนี้" ที่ยังค้างอยู่อ่านเหมือนว่ายังไม่สำเร็จ */
  React.useEffect(() => { setClosing(false); setNote(""); }, [t.id, t.status]);
  const st = window.omTicketStatusOf(t.status);
  const sev = window.OM_SEVERITY_BY[t.severity] || {};
  const cat = window.OM_TICKET_CAT_BY[t.category] || {};
  const nexts = window.omTicketNext(t, role);
  const rows = [
    ["ไซต์", t.siteName || t.siteCode],
    ["อาการ", t.detail],
    ["ประเภท", cat.th],
    ["ความเร่งด่วน", sev.th],
    ["ความคุ้มครอง", window.omCoverTH(t.cover).th],
    ["ผู้รับผิดชอบ", t.assigneeName],
    ["วันนัด", t.apptDate ? window.drDateTH(t.apptDate) + (t.apptFrom ? " " + t.apptFrom + "-" + t.apptTo : "") : ""],
    ["แจ้งเมื่อ", t.reportedAt ? window.drDateTH(String(t.reportedAt).slice(0, 10)) : ""],
    ["ผลการแก้ไข", t.result],
  ].filter((r) => r[1]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15,43,51,.42)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "88dvh", overflowY: "auto", overflowX: "hidden", background: "var(--surface)",
          borderRadius: "18px 18px 0 0", padding: "16px 18px", paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--border-strong)", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-3)" }}>{t.no || t.id}</span>
          <span style={{ padding: "2px 9px", borderRadius: 99, background: st.color + "1A", color: st.color, fontSize: 11, fontWeight: 800 }}>{st.th}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", margin: "4px 0 12px" }}>{t.title || "ไม่ได้ระบุอาการ"}</div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 13, overflow: "hidden" }}>
          {rows.map((r, i) => (
            <div key={r[0]} style={{ display: "flex", gap: 10, padding: "10px 13px",
              borderTop: i ? "1px solid var(--border)" : "none", background: i % 2 ? "var(--surface2)" : "var(--surface)" }}>
              <div style={{ flex: "0 0 104px", fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{r[0]}</div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--text-1)", lineHeight: 1.6, wordBreak: "break-word" }}>{r[1]}</div>
            </div>
          ))}
        </div>

        {/* ปุ่มสร้างจากตารางสถานะ ปุ่มที่ขึ้นจึงเป็นทางที่เดินได้จริงเสมอ
            ปิดงานจากหน้างานได้เลย ไม่ต้องรอกลับออฟฟิศ — แต่หมายเหตุ/รูปยังทำที่เว็บ */}
        {closing ? (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-3)" }}>แก้ไขอะไรไปบ้าง</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="เช่น เปลี่ยนเบรกเกอร์ DC ตัวที่ไหม้ · รีเซ็ตอินเวอร์เตอร์แล้วจ่ายไฟปกติ"
              style={{ width: "100%", padding: "12px 13px", borderRadius: 12, border: "1px solid var(--border-strong)",
                background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 16,
                outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setClosing(false)}
                style={{ flex: 1, padding: "12px 14px", borderRadius: 11, border: "1px solid var(--border-strong)",
                  background: "var(--surface)", color: "var(--text-2)", fontFamily: "inherit", fontSize: 13.5,
                  fontWeight: 700, cursor: "pointer" }}>ย้อนกลับ</button>
              <button onClick={() => onMove(t, "closed", note.trim())} disabled={!note.trim()}
                style={{ flex: 2, padding: "12px 14px", borderRadius: 11, border: "none",
                  background: note.trim() ? "var(--primary)" : "var(--border-strong)", color: "#fff",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: note.trim() ? "pointer" : "default" }}>
                ปิดงานนี้
              </button>
            </div>
            {!note.trim() && <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
              ต้องเขียนผลการแก้ไขก่อนถึงจะปิดได้ — ใบที่ปิดแล้วคือเอกสารที่ลูกค้ารับทราบ
            </div>}
          </div>
        ) : nexts.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {nexts.map((n) => (
              <button key={n.key} onClick={() => (n.key === "closed" ? setClosing(true) : onMove(t, n.key))}
                style={{ flex: 1, minWidth: 120, padding: "12px 14px", borderRadius: 11, border: "none",
                  background: n.key === "closed" ? "var(--primary)" : n.color, color: "#fff",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
                {n.th}
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose}
          style={{ marginTop: 10, width: "100%", padding: "12px 14px", borderRadius: 11,
            border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-2)",
            fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>ปิด</button>
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

  const [tab, setTab]   = React.useState(LN_START.tab);
  const [q, setQ]       = React.useState("");
  const [open, setOpen] = React.useState(null);
  const [jobType, setJobType] = React.useState("all");
  /* คนที่เห็นทั้งบริษัท (แอดมิน/หัวหน้า/ขาย) ตั้งต้นที่ "ของฉัน"
     เพราะเปิดในไลน์คือกำลังจะไปทำงาน ไม่ใช่กำลังนั่งตรวจงานคนอื่น
     คนที่สิทธิ์แคบอยู่แล้วไม่เห็นปุ่มนี้ — มันจะเป็นปุ่มที่กดแล้วไม่มีอะไรเปลี่ยน */
  const [onlyMine, setOnlyMine] = React.useState(true);

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
    let base = mine;
    if (scope.all && onlyMine) base = base.filter((j) => window.jobIsMine(j, me));
    if (jobType !== "all") base = base.filter((j) => j.type === jobType);
    const hit = base.filter((j) => window.jobMatchQ(j, s));
    /* ยังไม่เสร็จขึ้นก่อน แล้วเรียงตามวันติดตั้งที่ใกล้ที่สุด — งานที่ต้องไปพรุ่งนี้ต้องอยู่บนสุด */
    return hit.slice().sort((a, b) => {
      const ad = a.stage === "done" ? 1 : 0, bd = b.stage === "done" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return String(a.startDate || "9999").localeCompare(String(b.startDate || "9999"));
    });
  }, [mine, q, jobType, onlyMine, scope.all, me]);

  /* งานที่เอาไว้ "ลงมือทำกับมัน" — ลงเวลา · เขียนรายงาน · เบิกเงิน
     ต่างจากรายการในแท็บงานที่ไว้ค้นหาข้อมูล ตรงที่
     · ตัดงานที่ติดตั้งเสร็จแล้วออก — ไม่มีใครไปลงเวลาหรือเขียนรายงานให้งานที่ปิดไปแล้ว
       และงานเก่าที่ค้างอยู่ในลิสต์คือโอกาสกดผิดใบ ซึ่งรู้ตัวอีกทีตอนสิ้นเดือน
     · ยึดของตัวเองเสมอ ไม่ขึ้นกับปุ่ม "ทั้งบริษัท" ที่ใช้ตอนไล่ดูงานแทนคนอื่น */
  const work = React.useMemo(() => {
    if (!me) return [];
    return mine.filter((j) => j.stage !== "done" && window.jobIsMine(j, me));
  }, [mine, me]);

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
            {/* แยกงานติดตั้งตามประเภท — งานบ้านกับงานโครงการทำกันคนละแบบ
                ของที่ต้องเตรียมและคนที่ต้องคุยด้วยคนละชุด ปนกันแล้วไล่หายาก */}
            <div style={{ marginTop: 9 }}>
              <LnPick items={[{ key: "all", th: "ทั้งหมด" }].concat(
                  (window.SF.TYPES || []).map((t) => ({ key: t.key, th: t.th })))}
                value={jobType} onPick={setJobType} />
            </div>

            {scope.all && (
              <div style={{ marginTop: 7 }}>
                <LnPick items={[{ key: "mine", th: "ของฉัน" }, { key: "all", th: "ทั้งบริษัท" }]}
                  value={onlyMine ? "mine" : "all"} onPick={(k) => setOnlyMine(k === "mine")} />
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-3)" }}>
              {(!scope.all || onlyMine) ? "เฉพาะงานที่คุณรับผิดชอบ" : "ทุกงานในระบบ"} · {list.length} งาน
            </div>
          </div>
          {list.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13.5, lineHeight: 1.7 }}>
                {q ? "ไม่พบงานที่ตรงกับคำค้น"
                  : jobType !== "all" ? "ไม่มีงานประเภทนี้ที่คุณรับผิดชอบ"
                  : "ยังไม่มีงานที่คุณรับผิดชอบ"}
                {/* หน้าว่างเพราะยังไม่มีใครถูกระบุเป็นผู้รับผิดชอบ อ่านเหมือนระบบพัง
                    ต้องบอกให้ชัดว่าต้องไปแก้ที่ใบงาน ไม่ใช่ที่หน้านี้ */}
                {!q && jobType === "all" && !scope.all && (
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    งานจะขึ้นที่นี่เมื่อออฟฟิศระบุคุณเป็นช่างหรือวิศวกรผู้รับผิดชอบในใบงาน
                  </div>
                )}
              </div>
            : list.map((j) => <LnJobRow key={j.id} job={j} onOpen={setOpen} />)}
        </React.Fragment>
      )}

      {tab === "fix" && <LnFixTab me={me} role={role} />}

      {tab === "time" && <LnTimeTab me={me} users={auth.users} role={role} jobs={work} startOt={LN_START.ot} />}

      {tab === "daily" && <window.LnDailyTab me={me} role={role} jobs={work} notify={notif.addNotif} />}

      {tab === "ec" && <window.LnEcTab me={me} users={auth.users} role={role} jobs={work} />}

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

Object.assign(window, { LnApp, LnJobRow, LnJobSheet, LnJobFiles, LnHead, LnClock, LnOtForm, LnTimeTab, LnFixTab, LnFixSheet, LnPick });
