/* ============================================================
   PHITHAN GREEN — รายงานสรุปสถานะงาน (Report)
   สร้างข้อความสรุปสถานะงานแต่ละงานในรูปแบบรายการ (สไตล์ Trello)
   พร้อมปุ่ม "คัดลอก/ดาวน์โหลด" เพื่อนำข้อความไปใช้รายงานต่อได้ทันที
   ============================================================ */

// ---- ฟอร์แมตช่วงวันติดตั้ง: "18-19 มิ.ย." / "30 มิ.ย.-2 ก.ค." / "18 มิ.ย." ----
function rpDateRange(s, e) {
  if (!s) return "ยังไม่นัดติดตั้ง";
  if (!e || e === s) return thDate(s);
  const d1 = parseDate(s), d2 = parseDate(e);
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear())
    return d1.getDate() + "-" + d2.getDate() + " " + TH_MONTHS[d2.getMonth()];
  return thDate(s) + " - " + thDate(e);
}

const RP_TYPE = (j) => (j.type === "project" ? "ติดตั้งงานโครงการ" : "ติดตั้งบ้าน");

// ---- บรรทัดหัวข้อของงาน ----
function rpHeader(j) {
  const parts = [
    rpDateRange(j.startDate, j.deadline),
    RP_TYPE(j),
    j.name || "(ไม่ระบุชื่อ)",
  ];
  if (j.phase) parts.push(j.phase + " เฟส");
  if (j.kw) parts.push(j.kw + " kWp.");
  if (j.brand) parts.push(j.brand);
  let head = parts.join(" ");
  const st = stageOf(j.stage);
  head += " — สถานะ: " + (st ? st.th : j.stage);
  if (j.delayed && j.lateStages && j.lateStages[0]) head += " ⚠ ล่าช้า " + j.lateStages[0].daysLate + " วัน";
  return head;
}

// ---- รายการรายละเอียด (bullets) ของงาน ----
function rpBullets(j) {
  const SF = window.SF;
  const b = [];
  // แบตเตอรี่ / Back Up
  if (j.battery) {
    let t = "ระบบแบตเตอรี่" + (j.batSize && j.batSize !== "ไม่มี" ? " " + j.batSize : "");
    if (j.backup) t += " + ระบบ Back Up";
    b.push(t);
  } else if (j.backup) {
    b.push("ระบบ Back Up");
  }
  // ออฟติไมเซอร์ / การต่อ
  if (j.connect && j.connect !== "-") b.push("ออฟติไมเซอร์ " + j.connect);
  // ตู้ Combiner (เฉพาะ ATMOCE)
  if ((j.brand || "").toUpperCase().includes("ATMOCE"))
    b.push("ตู้ Combiner: " + (j.comboType === "assembled" ? "ตู้ประกอบ" : "ตู้สำเร็จ"));
  // ตาข่ายกันนก
  if (j.birdnet) b.push("ติดตั้งตาข่ายกันนก");
  // สถานะวัสดุ
  const notReady = (SF.MATERIALS || []).filter((m) => { const s = j.mat[m.key]; return s === "waiting" || s === "none"; });
  if (j.matReady) b.push("วัสดุพร้อมติดตั้งครบแล้ว ✅");
  else if (notReady.length)
    b.push("รอวัสดุ: " + notReady.map((m) => m.th + (j.mat[m.key] === "waiting" ? " (รอของ)" : " (ยังไม่สั่ง)")).join(", "));
  // ช่าง / ทีมรับเหมา
  const tech = SF.TECH_BY_ID[j.tech];
  if (tech) b.push("ช่างผู้รับผิดชอบ: " + tech.name + (tech.role ? " (" + tech.role + ")" : ""));
  if (j.contractor) b.push("ทีมรับเหมา: " + j.contractor);
  // พื้นที่
  if (j.province) b.push("พื้นที่: " + j.province + (j.address ? " · " + j.address : ""));
  // ปัญหา / หมายเหตุ
  if (j.problem) b.push("⚠ ปัญหา: " + j.problem);
  if (j.note) b.push("หมายเหตุ: " + j.note);
  // ลิงก์
  if (j.trello) b.push(j.trello);
  else if (j.map) b.push(j.map);
  return b;
}

// ---- ข้อความล้วนของงานเดียว ----
function rpJobText(j) {
  return rpHeader(j) + "\n" + rpBullets(j).map((x) => "  • " + x).join("\n");
}

// ---- ข้อความล้วนของทั้งรายงาน (แยกเป็นหมวดตาม sections) ----
function rpFullText(sections) {
  const total = sections.reduce((n, s) => n + s.jobs.length, 0);
  const head = "สรุปสถานะงานติดตั้ง — " + thDate(window.SF.TODAY, true) + " (" + total + " งาน)";
  const body = sections.filter((s) => s.jobs.length).map((s) =>
    "【 " + s.title + " (" + s.jobs.length + ") 】\n\n" + s.jobs.map(rpJobText).join("\n\n")
  ).join("\n\n");
  return head + "\n\n" + body;
}

// ---- คัดลอกข้อความลงคลิปบอร์ด (มี fallback) ----
function rpCopy(text, done) {
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      done && done(true);
    } catch (e) { done && done(false); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done && done(true), fallback);
  } else fallback();
}

// ---- ดาวน์โหลดเป็นไฟล์ .txt ----
function rpDownload(text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "รายงานสถานะงาน-" + window.SF.TODAY + ".txt";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const RP_LINK = (s) => /^https?:\/\//.test(s);

// ---- บล็อกแสดงผลงานเดียว (สไตล์การ์ดรายงาน) ----
function ReportBlock({ job, onOpen }) {
  const [copied, setCopied] = React.useState(false);
  const st = stageOf(job.stage);
  const bullets = rpBullets(job);
  const copy = () => rpCopy(rpJobText(job), (ok) => { if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500); } });
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
      padding: "14px 16px", boxShadow: "var(--shadow-sm)", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: st ? st.color : "var(--text-3)", marginTop: 7, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.45 }}>
            {rpHeader(job)}
          </div>
          <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {bullets.map((x, i) => (
              <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                <span style={{ color: "var(--text-3)", flexShrink: 0 }}>•</span>
                {RP_LINK(x)
                  ? <a href={x} target="_blank" rel="noopener noreferrer" style={{ color: "#3B82F6", wordBreak: "break-all", textDecoration: "none" }}>{x}</a>
                  : <span style={{ color: x.startsWith("⚠") ? "#DC2626" : "var(--text-2)" }}>{x}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={copy} title="คัดลอกงานนี้"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 9,
              border: "1px solid " + (copied ? "var(--primary)" : "var(--border-strong)"),
              background: copied ? "var(--primary-soft)" : "var(--surface2)",
              color: copied ? "var(--primary-dark)" : "var(--text-2)", fontSize: 11.5, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            <Icon name={copied ? "check" : "file"} size={13} color={copied ? "var(--primary-dark)" : "var(--text-2)"} />
            {copied ? "คัดลอกแล้ว" : "คัดลอก"}
          </button>
          {onOpen && (
            <button onClick={() => onOpen(job)} title="เปิดรายละเอียดงาน"
              style={{ width: 30, height: 30, borderRadius: 9, border: "1px solid var(--border-strong)",
                background: "var(--surface2)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
              <Icon name="arrowRight" size={15} color="var(--text-2)" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportView({ jobs, onOpen }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [copiedAll, setCopiedAll] = React.useState(false);
  const [showText, setShowText] = React.useState(false);
  const [hideDone, setHideDone] = React.useState(false);

  // เรียงตามวันนัดติดตั้ง (เร็วสุดก่อน) — งานที่ยังไม่นัดอยู่ท้ายสุด
  const sortFn = (a, b) => {
    const sa = a.startDate || "9999", sb = b.startDate || "9999";
    if (sa !== sb) return sa < sb ? -1 : 1;
    return (a.code || "").localeCompare(b.code || "");
  };
  // แยกงานที่กำลังดำเนินการ ออกจากงานที่เสร็จสิ้นแล้ว
  const active = React.useMemo(() => jobs.filter((j) => j.stage !== "done").slice().sort(sortFn), [jobs]);
  const done = React.useMemo(() => jobs.filter((j) => j.stage === "done").slice().sort(sortFn), [jobs]);

  // หมวดที่จะแสดง/คัดลอก (ซ่อนงานเสร็จสิ้นได้)
  const sections = React.useMemo(() => {
    const s = [{ title: "กำลังดำเนินการ", key: "active", color: "var(--primary)", jobs: active }];
    if (!hideDone) s.push({ title: "เสร็จสิ้นแล้ว", key: "done", color: stageOf("done").color, jobs: done });
    return s;
  }, [active, done, hideDone]);

  const fullText = React.useMemo(() => rpFullText(sections), [sections]);
  const copyAll = () => rpCopy(fullText, (ok) => { if (ok) { setCopiedAll(true); setTimeout(() => setCopiedAll(false), 1800); } });

  if (!jobs.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-3)" }}>
        <Icon name="file" size={40} color="var(--text-3)" />
        <div style={{ marginTop: 12, fontSize: 14 }}>ไม่มีงานตามเงื่อนไขที่กรองไว้</div>
      </div>
    );
  }

  const btn = (extra) => Object.assign({
    display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11,
    fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", border: "none",
  }, extra);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* แถบเครื่องมือ — ปุ่ม output */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: isMobile ? 14 : "16px 18px",
        boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>รายงานสรุปสถานะงาน</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 2 }}>
            กำลังดำเนินการ {active.length} · เสร็จสิ้น {done.length} · {thDate(window.SF.TODAY, true)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setHideDone((v) => !v)}
            style={btn({ background: hideDone ? "var(--primary-soft)" : "var(--surface2)",
              color: hideDone ? "var(--primary-dark)" : "var(--text-2)",
              border: "1px solid " + (hideDone ? "var(--primary)" : "var(--border-strong)") })}>
            <Icon name={hideDone ? "eyeOff" : "check"} size={16} color={hideDone ? "var(--primary-dark)" : "var(--text-2)"} />
            {hideDone ? "ซ่อนงานเสร็จสิ้นอยู่" : "ซ่อนงานเสร็จสิ้น"}
          </button>
          <button onClick={() => setShowText((v) => !v)}
            style={btn({ background: "var(--surface2)", color: "var(--text-2)", border: "1px solid var(--border-strong)" })}>
            <Icon name="eye" size={16} color="var(--text-2)" /> {showText ? "ซ่อนข้อความ" : "ดูข้อความล้วน"}
          </button>
          <button onClick={() => rpDownload(fullText)}
            style={btn({ background: "var(--surface2)", color: "var(--text-2)", border: "1px solid var(--border-strong)" })}>
            <Icon name="download" size={16} color="var(--text-2)" /> ดาวน์โหลด .txt
          </button>
          <button onClick={copyAll}
            style={btn({ background: copiedAll ? "var(--primary-dark)" : "var(--primary)", color: "#fff", boxShadow: "0 2px 8px rgba(34,163,91,.25)" })}>
            <Icon name={copiedAll ? "check" : "file"} size={16} color="#fff" /> {copiedAll ? "คัดลอกทั้งหมดแล้ว ✓" : "คัดลอกข้อความทั้งหมด"}
          </button>
        </div>
      </div>

      {/* กล่องข้อความล้วน — สำหรับเลือก/คัดลอกเอง */}
      {showText && (
        <textarea readOnly value={fullText} onFocus={(e) => e.target.select()}
          style={{ width: "100%", minHeight: 240, padding: 14, borderRadius: 12, border: "1px solid var(--border-strong)",
            background: "var(--surface2)", color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6,
            resize: "vertical", outline: "none" }} />
      )}

      {/* การ์ดรายงาน — แยกเป็นหมวด กำลังดำเนินการ / เสร็จสิ้น */}
      {sections.filter((s) => s.jobs.length).map((s) => (
        <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px", marginTop: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".03em", color: s.color }}>{s.title}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{s.jobs.length}</span>
            <span style={{ flex: 1, height: 1, background: "var(--border)", marginLeft: 4 }} />
          </div>
          {s.jobs.map((j) => <ReportBlock key={j.id} job={j} onOpen={onOpen} />)}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Daily Report — รายงานประจำวันของงานขั้น "ดำเนินการติดตั้ง"
   - ข้อมูลระบบดึงอัตโนมัติจากงาน + ช่องกรอกรายวัน (เก็บ dailyReports/{jobId}/{date})
   - ปุ่มคัดลอกเป็นข้อความสวยๆ เอาไปวางใน LINE / Trello / อีเมลได้
   ============================================================ */
function buildDailyText(job, dateStr, d) {
  const SF = window.SF;
  const L = [];
  L.push("📋 รายงานติดตั้งโซลาร์เซลล์ — " + thDate(dateStr, true));
  L.push("PHITHAN GREEN");
  L.push("━━━━━━━━━━━━━━━━━");
  L.push("🏠 " + (job.name || "(ไม่ระบุชื่อ)") + " · " + (job.code || job.id));
  L.push("📍 " + (job.province || "-") + (job.brand ? " · " + job.brand : ""));
  const spec = [job.kw + " kW", job.panels + " แผง", (job.phase || "1") + " เฟส"];
  if (job.battery && job.batSize && job.batSize !== "ไม่มี") spec.push("🔋 " + job.batSize);
  if (job.backup) spec.push("Back Up");
  L.push("⚡ " + spec.join(" · "));
  L.push("🗓️ ช่วงติดตั้ง: " + rpDateRange(job.startDate, job.deadline));
  const tech = SF.TECH_BY_ID[job.tech];
  const crew = (d.crew || "").trim() || (tech ? tech.name : "");
  if (crew) L.push("👷 ทีมช่าง: " + crew);
  L.push("");
  if (d.pct !== "" && d.pct != null) L.push("📈 ความคืบหน้า: " + d.pct + "%");
  const blk = (emoji, title, txt) => {
    const lines = String(txt || "").split("\n").map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return;
    L.push(emoji + " " + title);
    lines.forEach((x) => L.push("• " + x));
  };
  blk("✅", "งานวันนี้", d.done);
  blk("⚠️", "ปัญหา/อุปสรรค", d.issues);
  blk("➡️", "แผนพรุ่งนี้", d.plan);
  L.push("");
  L.push("📦 ความพร้อมวัสดุ: " + (job.matReadyPct != null ? job.matReadyPct + "%" : "-"));
  return L.join("\n");
}

function DailyReport({ job, onClose }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const today = window.SF.TODAY;
  const jid = job.id || job.code;
  const [date, setDate] = React.useState(today);
  const [entries, setEntries] = React.useState({});
  const [form, setForm] = React.useState({ pct: "", done: "", issues: "", plan: "", crew: "" });
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const dirty = React.useRef(false);

  const populate = (e) => { e = e || {}; setForm({ pct: e.pct != null ? e.pct : "", done: e.done || "", issues: e.issues || "", plan: e.plan || "", crew: e.crew || "" }); dirty.current = false; };

  React.useEffect(() => {
    if (!window.FBDB) return;
    const r = window.FBDB.ref("dailyReports/" + jid);
    const h = r.on("value", (s) => setEntries(s.val() || {}));
    return () => r.off("value", h);
  }, [jid]);

  // โหลดข้อมูลของวันที่เลือกเข้าฟอร์ม (เปลี่ยนวัน = โหลดใหม่เสมอ)
  React.useEffect(() => { populate(entries[date]); /* eslint-disable-next-line */ }, [date]);
  // เมื่อ snapshot มาถึงและยังไม่แก้ → sync เข้าฟอร์ม (กันทับสิ่งที่กำลังพิมพ์)
  React.useEffect(() => { if (!dirty.current) populate(entries[date]); /* eslint-disable-next-line */ }, [entries]);

  const set = (k, v) => { dirty.current = true; setSaved(false); setForm((f) => Object.assign({}, f, { [k]: v })); };

  const text = buildDailyText(job, date, form);

  const save = () => {
    if (!window.FBDB) return;
    const rec = { date, pct: form.pct === "" ? null : +form.pct, done: form.done || "", issues: form.issues || "", plan: form.plan || "", crew: form.crew || "", savedAt: new Date().toISOString() };
    window.FBDB.ref("dailyReports/" + jid + "/" + date).set(rec);
    dirty.current = false; setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  const copy = () => rpCopy(text, (ok) => { if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1600); } });

  const tech = window.SF.TECH_BY_ID[job.tech];
  const pct = form.pct === "" ? null : Math.max(0, Math.min(100, +form.pct || 0));
  const savedDates = Object.keys(entries).sort().reverse();

  const taStyle = { width: "100%", minHeight: 64, padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.5, resize: "vertical", outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" };

  const specChips = [];
  specChips.push({ icon: "bolt", t: job.kw + " kW" });
  specChips.push({ icon: "panel", t: job.panels + " แผง" });
  specChips.push({ icon: "power", t: (job.phase || "1") + " เฟส" });
  if (job.battery && job.batSize && job.batSize !== "ไม่มี") specChips.push({ icon: "battery", t: job.batSize });
  if (job.backup) specChips.push({ icon: "shield", t: "Back Up" });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 130, display: "grid", placeItems: isMobile ? "end center" : "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? "20px 20px 0 0" : 18, width: isMobile ? "100%" : "min(680px,100%)", maxHeight: isMobile ? "96dvh" : "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(8,20,14,.3)" }}>
        {/* header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "var(--surface)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--primary-dark)" }}>รายงานประจำวัน · ติดตั้ง</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.name} <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>· {job.code}</span></div>
          </div>
          <button onClick={onClose} title="ปิด" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }}><Icon name="x" size={16} color="var(--text-2)" /></button>
        </div>

        {/* body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* วันที่ */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--text-2)" }}><Icon name="calendar" size={14} color="var(--primary)" /> วันที่รายงาน</span>
            <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)}
              style={{ padding: "8px 11px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, outline: "none" }} />
            {entries[date] && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "3px 9px", borderRadius: 99 }}>มีบันทึกแล้ว</span>}
            {savedDates.length > 0 && <span style={{ fontSize: 11, color: "var(--text-3)" }}>บันทึกไว้ {savedDates.length} วัน</span>}
          </div>

          {/* ข้อมูลระบบ (อัตโนมัติ) */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 13, background: "var(--surface2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "var(--text-2)", marginBottom: 8 }}>
              <Icon name="pin" size={13} color="var(--text-3)" /> {job.province || "-"} · <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{job.brand}</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {specChips.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--text-2)", background: "var(--surface)", border: "1px solid var(--border)", padding: "3px 8px", borderRadius: 7 }}>
                  <Icon name={c.icon} size={11} color="var(--text-3)" />{c.t}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--text-3)" }}>
              <span><Icon name="calendar" size={11} color="var(--text-3)" style={{ verticalAlign: -1 }} /> ช่วงติดตั้ง: <b style={{ color: "var(--text-2)" }}>{rpDateRange(job.startDate, job.deadline)}</b></span>
              {tech && <span><Icon name="user" size={11} color="var(--text-3)" style={{ verticalAlign: -1 }} /> ช่าง: <b style={{ color: "var(--text-2)" }}>{tech.name}</b></span>}
              <span><Icon name="box" size={11} color="var(--text-3)" style={{ verticalAlign: -1 }} /> วัสดุพร้อม: <b style={{ color: "var(--text-2)" }}>{job.matReadyPct}%</b></span>
            </div>
          </div>

          {/* ฟอร์มกรอกรายวัน */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "120px 1fr", gap: 12, alignItems: "start" }}>
              <div>
                <label style={lbl}>ความคืบหน้า (%)</label>
                <input type="number" min="0" max="100" value={form.pct} onChange={(e) => set("pct", e.target.value)} placeholder="เช่น 70"
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, outline: "none", textAlign: "right", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={lbl}>ทีมช่างวันนี้</label>
                <input value={form.crew} onChange={(e) => set("crew", e.target.value)} placeholder={tech ? tech.name : "ชื่อทีม/ช่าง"}
                  style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13.5, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div><label style={lbl}>✅ งานที่ทำวันนี้ (บรรทัดละ 1 รายการ)</label><textarea value={form.done} onChange={(e) => set("done", e.target.value)} placeholder={"เช่น\nมุงโครงสร้าง + วางแผง 12 แผง\nเดินสาย DC ครบ"} style={taStyle} /></div>
            <div><label style={lbl}>⚠️ ปัญหา / อุปสรรค</label><textarea value={form.issues} onChange={(e) => set("issues", e.target.value)} placeholder="เช่น ฝนตกช่วงบ่าย หยุดงาน 1 ชม." style={Object.assign({}, taStyle, { minHeight: 48 })} /></div>
            <div><label style={lbl}>➡️ แผนงานพรุ่งนี้</label><textarea value={form.plan} onChange={(e) => set("plan", e.target.value)} placeholder="เช่น ต่อ Combiner + ทดสอบระบบ" style={Object.assign({}, taStyle, { minHeight: 48 })} /></div>
          </div>

          {/* พรีวิวสวยๆ */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 8 }}>ตัวอย่างรายงาน</div>
            <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", color: "#fff", padding: "13px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: .9, letterSpacing: ".05em" }}>PHITHAN GREEN · รายงานติดตั้ง</div>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{thDate(date, true)}</div>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, background: "var(--surface)" }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>🏠 {job.name} <span style={{ fontWeight: 600, color: "var(--text-3)", fontSize: 12 }}>· {job.code}</span></div>
                {pct != null && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}><span>ความคืบหน้า</span><span style={{ color: "var(--primary-dark)" }}>{pct}%</span></div>
                    <div style={{ height: 8, borderRadius: 99, background: "var(--surface3)", overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg, var(--primary), var(--primary-dark))", borderRadius: 99 }} /></div>
                  </div>
                )}
                <DRBlock emoji="✅" title="งานวันนี้" txt={form.done} color="var(--primary-dark)" />
                <DRBlock emoji="⚠️" title="ปัญหา / อุปสรรค" txt={form.issues} color="#B45309" />
                <DRBlock emoji="➡️" title="แผนพรุ่งนี้" txt={form.plan} color="#2563EB" />
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 9, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-3)" }}>
                  <span>👷 {(form.crew || "").trim() || (tech ? tech.name : "-")}</span>
                  <span>📦 วัสดุพร้อม {job.matReadyPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--surface)" }}>
          <button onClick={onClose} style={{ padding: "11px 16px", borderRadius: 11, border: "1px solid var(--border-strong)", background: "var(--surface2)", color: "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer" }}>ปิด</button>
          <button onClick={save} style={{ padding: "11px 16px", borderRadius: 11, border: "1px solid " + (saved ? "var(--primary)" : "var(--border-strong)"), background: saved ? "var(--primary-soft)" : "var(--surface2)", color: saved ? "var(--primary-dark)" : "var(--text-2)", fontWeight: 700, fontFamily: "inherit", fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name={saved ? "check" : "download"} size={15} color={saved ? "var(--primary-dark)" : "var(--text-2)"} /> {saved ? "บันทึกแล้ว" : "บันทึก"}
          </button>
          <button onClick={copy} style={{ flex: 1, padding: "11px 16px", borderRadius: 11, border: "none", background: copied ? "var(--primary-dark)" : "var(--primary)", color: "#fff", fontWeight: 800, fontFamily: "inherit", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 2px 8px rgba(34,163,91,.25)" }}>
            <Icon name={copied ? "check" : "file"} size={16} color="#fff" /> {copied ? "คัดลอกแล้ว ✓" : "คัดลอกข้อความ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DRBlock({ emoji, title, txt, color }) {
  const lines = String(txt || "").split("\n").map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: color || "var(--text-2)", marginBottom: 3 }}>{emoji} {title}</div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {lines.map((x, i) => <li key={i} style={{ display: "flex", gap: 7, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}><span style={{ color: "var(--text-3)", flexShrink: 0 }}>•</span>{x}</li>)}
      </ul>
    </div>
  );
}

// ปุ่มเปิดรายงานประจำวันบนการ์ด (เฉพาะงานขั้นดำเนินการติดตั้ง)
function DailyReportButton({ job }) {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} title="รายงานประจำวัน"
        style={{ marginTop: 10, width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "8px 12px", borderRadius: 9, border: "1px dashed var(--primary)", background: "var(--primary-soft)",
          color: "var(--primary-dark)", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
        <Icon name="file" size={13} color="var(--primary-dark)" /> รายงานวันนี้
      </button>
      {open && ReactDOM.createPortal(<DailyReport job={job} onClose={() => setOpen(false)} />, document.body)}
    </React.Fragment>
  );
}
