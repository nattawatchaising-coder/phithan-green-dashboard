/* ============================================================
   SolarFlow — ภาพรวมสำหรับหัวหน้า (LeadOverview)

   ภาพรวมเดิมตอบได้แค่ "ตอนนี้มีงานอยู่เท่าไร" ซึ่งพอสำหรับช่างที่ดูงานตัวเอง
   แต่หัวหน้าต้องตอบให้ได้ว่า ใครว่างใครล้น · งานไหนเงียบหาย · ขั้นไหนเป็นคอขวด ·
   เอกสารค้างตรงไหน · เดือนนี้ทำได้เท่าไร  — ข้อมูลมีครบอยู่แล้ว แค่ไม่เคยเอามารวมให้ดู

   ทุกแผงในนี้ "อ่านอย่างเดียว + กดเพื่อเจาะ" ไม่มีการแก้ข้อมูลจากหน้านี้
   ตั้งชื่อ top-level ขึ้นต้นด้วย lo/Lo เพราะไฟล์ทั้งหมดโหลดเป็นสคริปต์ธรรมดา
   (ชื่อระดับบนสุดอยู่ใน scope เดียวกันหมด ชนกันเมื่อไหร่ = ทั้งเว็บพัง)
   ============================================================ */

const loPad2 = (n) => (n < 10 ? "0" : "") + n;
const loISO = (d) => d.getFullYear() + "-" + loPad2(d.getMonth() + 1) + "-" + loPad2(d.getDate());
const loAddDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return loISO(d); };

/* ค้างอยู่ขั้นนี้มากี่วัน — อ่านจากเวลาที่งาน "เข้าขั้น" ครั้งแรก (hist[i].at ที่ store บันทึกไว้)
   งานเก่าที่ไม่เคยเดินขั้นผ่านระบบจะไม่มีทั้ง at และ date → คืน null เพื่อให้แสดงว่า "ไม่ทราบ"
   ไม่ใช่ 0 วัน (0 วันแปลว่าเพิ่งขยับ ซึ่งตรงข้ามกับความจริง) */
function loDaysInStage(job) {
  const h = (job && job.hist) || [];
  const cur = h.find((x) => x && x.key === job.stage);
  const v = cur && (cur.at || cur.date);
  if (!v) return null;
  const s = String(v);
  const d = new Date(s.length === 10 ? s + "T00:00:00" : s);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

/* วันที่ปิดงาน — ใช้เวลาที่เข้าขั้น "เสร็จงาน" เป็นหลัก ไม่มีก็ถอยไปใช้วันสิ้นสุดการติดตั้ง */
function loDoneAt(job) {
  const h = (job && job.hist) || [];
  const d = h.find((x) => x && x.key === "done");
  const v = d && (d.date || d.at);
  if (v) return String(v).slice(0, 10);
  const SF = window.SF;
  return (SF.installEnd && SF.installEnd(job)) || (SF.installDate && SF.installDate(job)) || "";
}

/* ไล่วันในช่วงติดตั้งของงานหนึ่ง — ใช้ทั้งคิว 14 วันและการหาคิวชนของช่าง
   ช่วงติดตั้งอ่านจาก stageDates.install เท่านั้น (deadline ไม่ใช่วันนัดติดตั้ง) */
function loSpanDays(job) {
  const SF = window.SF;
  const s = (SF.installDate && SF.installDate(job)) || "";
  if (!s) return [];
  const e = (SF.installEnd && SF.installEnd(job)) || s;
  if (e < s) return [s];                       // ข้อมูลกลับหัว — เอาแค่วันเริ่ม ดีกว่าวนไม่จบ
  const out = []; let cur = s; let guard = 0;
  while (cur <= e && guard < 400) { out.push(cur); cur = loAddDays(cur, 1); guard += 1; }
  return out;
}

const loMedian = (arr) => {
  if (!arr.length) return null;
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};

/* ── คิวติดตั้ง 14 วันข้างหน้า ─────────────────────────────────
   หัวหน้าดูตรงนี้เพื่อรู้ว่าสัปดาห์นี้ออกกี่ทีม และมีวันไหนที่ช่างคนเดียวถูกลงสองงาน */
function LoQueuePanel({ jobs, onOpen }) {
  const SF = window.SF;
  const today = SF.TODAY;
  const last = loAddDays(today, 13);
  const days = React.useMemo(() => {
    const map = {};
    (jobs || []).forEach((j) => {
      if (j.stage === "done") return;
      loSpanDays(j).forEach((d) => { if (d >= today && d <= last) (map[d] || (map[d] = [])).push(j); });
    });
    return Object.keys(map).sort().map((d) => {
      const list = map[d];
      const byTech = {};
      list.forEach((j) => { if (j.tech) byTech[j.tech] = (byTech[j.tech] || 0) + 1; });
      const clash = Object.keys(byTech).filter((t) => byTech[t] > 1);
      return { d, list, clash };
    });
  }, [jobs, today, last]);

  const clashDays = days.filter((x) => x.clash.length).length;
  const total = React.useMemo(() => {
    const s = new Set();
    days.forEach((x) => x.list.forEach((j) => s.add(j.id)));
    return s.size;
  }, [days]);

  return (
    <div className="pnl" style={clashDays ? { borderLeft: "3px solid #D93025" } : null}>
      <PanelTitle title="คิวติดตั้ง 14 วันข้างหน้า"
        sub={total ? (total + " งาน" + (clashDays ? " · มี " + clashDays + " วันที่ช่างชนคิว" : " · ไม่มีคิวชน")) : "ยังไม่มีงานลงคิวในช่วงนี้"} />
      {days.length === 0 ? <Empty text="ไม่มีงานติดตั้งในสองสัปดาห์ข้างหน้า" /> : (
        <div style={{ maxHeight: 420, overflowY: "auto", marginTop: 4 }}>
          {days.map((day) => {
            const dt = parseDate(day.d);
            const isToday = day.d === today;
            return (
              <div key={day.d} style={{ display: "flex", gap: 14, padding: "12px 2px", borderTop: "1px solid var(--border)" }}>
                <div style={{ width: 54, flexShrink: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 650, color: isToday ? "var(--primary-dark)" : "var(--text-3)" }}>
                    {window.TH_DAYS[dt.getDay()]}
                  </div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 21, fontWeight: 700, lineHeight: 1.05,
                    color: isToday ? "var(--primary-dark)" : "var(--text-1)" }}>{dt.getDate()}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{window.TH_MONTHS[dt.getMonth()]}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {day.list.map((j) => {
                    const bad = j.tech && day.clash.indexOf(j.tech) >= 0;
                    return (
                      <button key={j.id} onClick={() => onOpen(j)} style={{ display: "flex", alignItems: "center", gap: 10,
                        padding: "7px 10px", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                        background: "var(--surface)", border: "1px solid " + (bad ? "#FCA5A5" : "var(--border)"), borderRadius: 10 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface)"}>
                        <TechAvatar techId={j.tech} size={24} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 650, color: "var(--text-1)",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</span>
                          <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)", marginTop: 2,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {[j.province, j.kw ? j.kw + " kW" : "", j.tech ? "" : "ยังไม่มอบหมายช่าง"].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        {bad && <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: "#D93025",
                          background: "rgba(217,48,37,.11)", padding: "3px 8px", borderRadius: 99 }}>ช่างชนคิว</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>
        * “ช่างชนคิว” = ช่างคนเดียวถูกลงไว้สองงานขึ้นไปในวันเดียวกัน — งานที่ยังไม่มอบหมายช่างไม่นับ
      </div>
    </div>
  );
}

/* ── ภาระงานต่อช่าง ───────────────────────────────────────────
   โชว์ช่างที่งานเป็นศูนย์ด้วย เพราะคำถามของหัวหน้าคือ "ใครว่าง" พอ ๆ กับ "ใครล้น" */
function LoTechLoadPanel({ jobs, techs, onTech }) {
  const SF = window.SF;
  const today = SF.TODAY, soonMax = loAddDays(today, 7);
  const rows = React.useMemo(() => {
    const list = (techs && techs.length ? techs : (SF.TECHS || []));
    const base = list.map((t) => ({ id: t.id, name: t.name || t.nick || "—", color: t.color || "var(--primary)", n: 0, soon: 0, late: 0, kw: 0 }));
    const byId = {}; base.forEach((r) => { byId[r.id] = r; });
    const none = { id: "__none", name: "ยังไม่มอบหมายช่าง", color: "var(--text-3)", n: 0, soon: 0, late: 0, kw: 0 };
    (jobs || []).forEach((j) => {
      if (j.stage === "done") return;
      const r = (j.tech && byId[j.tech]) || none;
      r.n += 1; r.kw += (+j.kw || 0);
      if (j.delayed) r.late += 1;
      const s = SF.installDate ? SF.installDate(j) : "";
      if (s && s >= today && s <= soonMax) r.soon += 1;
    });
    const out = base.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    if (none.n) out.unshift(none);   // งานไม่มีเจ้าภาพต้องเห็นก่อน ไม่ใช่ตกท้ายตาราง
    return out;
  }, [jobs, techs, today, soonMax]);
  const max = Math.max.apply(null, rows.map((r) => r.n).concat([1]));
  const live = rows.reduce((s, r) => s + r.n, 0);

  return (
    <div className="pnl">
      <PanelTitle title="ภาระงานต่อช่าง" sub={"งานที่ยังไม่เสร็จ " + live + " งาน · คลิกเพื่อดูงานของช่างคนนั้น"} />
      {rows.length === 0 ? <Empty text="ยังไม่มีรายชื่อช่างในระบบ" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, maxHeight: 340, overflowY: "auto" }}>
          {rows.map((r) => (
            <button key={r.id} onClick={() => onTech && onTech(r.id)} style={{ display: "flex", alignItems: "center", gap: 10,
              background: "none", border: "none", padding: "2px 0", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
              <span style={{ width: 108, flexShrink: 0, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5,
                fontWeight: 650, color: "var(--text-1)", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: r.color, flexShrink: 0 }} />{r.name}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", height: 10, background: "var(--surface3)", borderRadius: 99, overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", width: Math.max((r.n / max) * 100, r.n ? 5 : 0) + "%",
                    background: r.late ? "#D93025" : r.color, borderRadius: 99, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
                </span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                  {r.n === 0 ? "ว่าง — ยังไม่มีงานค้าง" : [
                    "ติดตั้งใน 7 วัน " + r.soon + " งาน",
                    r.late ? "ล่าช้า " + r.late + " งาน" : "",
                    r.kw ? Math.round(r.kw * 10) / 10 + " kW" : "",
                  ].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span style={{ width: 30, flexShrink: 0, textAlign: "right", fontFamily: "var(--display)", fontSize: 15,
                fontWeight: 700, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums",
                color: r.n ? "var(--text-1)" : "var(--text-3)" }}>{r.n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── งานค้างไม่ขยับ ───────────────────────────────────────────
   งานที่ไม่ได้ล่าช้า (ยังไม่ถึงวันนัด) แต่ค้างอยู่ขั้นเดิมมานาน คือกองที่เงียบหายไปเฉย ๆ
   ซึ่งไม่มีตัวเลือนไหนในระบบเดิมจับได้เลย */
function LoStalePanel({ jobs, onOpen }) {
  const SF = window.SF;
  const rows = React.useMemo(() => {
    const known = [], unknown = [];
    (jobs || []).forEach((j) => {
      if (j.stage === "done") return;
      const d = loDaysInStage(j);
      if (d == null) unknown.push({ job: j, days: null });
      else if (d >= 7) known.push({ job: j, days: d });
    });
    known.sort((a, b) => b.days - a.days);
    return { list: known.concat(unknown).slice(0, 10), known: known.length, unknown: unknown.length };
  }, [jobs]);
  const list = rows.list;
  const sub = rows.known
    ? ("ค้างขั้นเดิมเกิน 7 วัน " + rows.known + " งาน" + (rows.unknown ? " · ไม่รู้ระยะเวลาอีก " + rows.unknown + " งาน" : ""))
    : (rows.unknown ? (rows.unknown + " งานที่ไม่เคยเดินขั้นผ่านระบบ จึงไม่รู้ว่าค้างมานานแค่ไหน") : "ทุกงานขยับภายใน 7 วัน");

  return (
    <div className="pnl">
      <PanelTitle title="งานค้างไม่ขยับ" sub={sub} />
      {list.length === 0 ? <Empty text="ไม่มีงานที่ค้างขั้นเดิมนานผิดปกติ" /> : (
        <div className="rows" style={{ maxHeight: 330, overflowY: "auto" }}>
          {list.map((r) => {
            const j = r.job;
            const st = (SF.STAGES || []).find((x) => x.key === j.stage) || { th: j.stage, color: "var(--text-3)" };
            const col = r.days == null ? "var(--text-3)" : (r.days >= 14 ? "#D93025" : (r.days >= 7 ? "#F59E0B" : st.color));
            return (
              <button key={j.id} onClick={() => onOpen(j)}>
                <span className="mk" style={{ background: col }} />
                <span className="bd">
                  <span className="nm">{j.name}</span>
                  <span className="mt">{[j.code, st.th, j.tech ? null : "ยังไม่มอบหมายช่าง"].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="when" style={r.days != null && r.days >= 14 ? { color: "#D93025" } : null}>
                  <b>ค้างขั้นนี้</b>{r.days == null ? "ไม่ทราบ" : r.days + " วัน"}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>
        * นับจากเวลาที่งานเข้าขั้นปัจจุบัน — งานเก่าที่ไม่เคยเดินขั้นผ่านระบบจะขึ้นว่า “ไม่ทราบ”
      </div>
    </div>
  );
}

/* ── คอขวดตามขั้น ─────────────────────────────────────────────
   จำนวนงานอย่างเดียวไม่พอ ขั้นที่มี 5 งานแต่ค้างกันคนละเดือนหนักกว่าขั้นที่มี 10 งานที่เพิ่งเข้า
   จึงเอาค่ากลางของ "จำนวนวันที่ค้าง" มาคู่กันเสมอ */
function LoBottleneckPanel({ jobs, onStage }) {
  const SF = window.SF;
  const rows = React.useMemo(() => (SF.STAGES || []).filter((s) => s.key !== "done").map((s) => {
    const list = (jobs || []).filter((j) => j.stage === s.key);
    const ds = list.map(loDaysInStage).filter((x) => x != null);
    return { s, n: list.length, med: loMedian(ds) };
  }), [jobs]);
  /* แท่งวัดด้วย "จำนวนวันที่ค้าง" ให้ตรงกับตัวหนังสือใต้แท่งและหัวข้อของแผง
     ก่อนหน้านี้แท่งยาวตามจำนวนงาน อ่านแล้วขัดกันเอง — ขั้นที่ค้าง 2 วันแท่งยาวกว่าขั้นที่ค้าง 13 วัน
     จำนวนงานยังอ่านได้จากตัวเลขทางขวาของแถวอยู่แล้ว */
  const max = Math.max.apply(null, rows.map((r) => r.med || 0).concat([1]));
  const worst = rows.reduce((a, b) => ((b.med || 0) > (a.med || 0) ? b : a), rows[0] || { s: { th: "" }, med: null });

  return (
    <div className="pnl">
      <PanelTitle title="คอขวดตามขั้น"
        sub={worst && worst.med ? ("ค้างนานสุดที่ขั้น “" + worst.s.th + "” ราว " + worst.med + " วัน") : "คลิกที่ขั้นเพื่อดูรายการงาน"} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {rows.map((r) => (
          <button key={r.s.key} onClick={() => onStage && onStage(r.s.key)} style={{ display: "flex", alignItems: "center", gap: 10,
            background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%" }}>
            <span style={{ width: 104, flexShrink: 0, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5,
              fontWeight: 650, color: "var(--text-1)", lineHeight: 1.25 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: r.s.color, flexShrink: 0 }} />{r.s.th}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", height: 10, background: "var(--surface3)", borderRadius: 99, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: Math.max(((r.med || 0) / max) * 100, r.n ? 5 : 0) + "%",
                  background: r.s.color, borderRadius: 99, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
              </span>
              <span style={{ display: "block", fontSize: 11, marginTop: 4,
                color: r.med != null && r.med >= 14 ? "#D93025" : "var(--text-3)" }}>
                {r.n === 0 ? "ไม่มีงานค้างขั้นนี้" : (r.med == null ? "ไม่ทราบระยะเวลาที่ค้าง" : "ค้างมาแล้วราว " + r.med + " วัน (ค่ากลาง)")}
              </span>
            </span>
            <span style={{ width: 30, flexShrink: 0, textAlign: "right", fontFamily: "var(--display)", fontSize: 15,
              fontWeight: 700, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums",
              color: r.n ? "var(--text-1)" : "var(--text-3)" }}>{r.n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── ขออนุญาตการไฟฟ้า ────────────────────────────────────────
   งานติดตั้งเสร็จแล้วแต่เอกสารยังไม่เดิน = เงินที่ยังเก็บไม่ได้ ต้องเห็นแยกจากงานหน้างาน */
function LoPermitPanel({ jobs, onGoPermit }) {
  const n = React.useMemo(() => {
    const c = { todo: 0, draft: 0, sent: 0, filing: 0, rejected: 0, approved: 0 };
    (jobs || []).forEach((j) => {
      const st = j.permit && j.permit.status;
      if (!st) { if (j.stage === "done") c.todo += 1; return; }
      if (c[st] != null) c[st] += 1;
    });
    return c;
  }, [jobs]);
  const rows = [
    { k: "todo", th: "ติดตั้งเสร็จแต่ยังไม่เริ่มเก็บข้อมูล", v: n.todo, color: "#D93025" },
    { k: "draft", th: "กำลังเก็บข้อมูลหน้างาน", v: n.draft, color: "#94A3B8" },
    { k: "sent", th: "รอฝ่ายขออนุญาตรับงาน", v: n.sent, color: "#F59E0B" },
    { k: "filing", th: "ยื่นการไฟฟ้าแล้ว", v: n.filing, color: "#0EA5E9" },
    { k: "rejected", th: "ถูกตีกลับ ต้องแก้", v: n.rejected, color: "#D93025" },
    { k: "approved", th: "การไฟฟ้าอนุมัติ", v: n.approved, color: "var(--primary)" },
  ];
  const stuck = n.todo + n.rejected;
  return (
    <div className="pnl" style={stuck ? { borderLeft: "3px solid #F59E0B" } : null}>
      <PanelTitle title="ขออนุญาตการไฟฟ้า" sub={stuck ? (stuck + " งานที่ต้องผลัก") : "ไม่มีใบค้างที่ฝั่งเรา"} />
      <div className="rows">
        {rows.map((r) => (
          <button key={r.k} onClick={() => onGoPermit && onGoPermit()}>
            <span className="mk" style={{ background: r.color }} />
            <span className="bd"><span className="nm" style={{ fontWeight: 600, fontSize: 12.5 }}>{r.th}</span></span>
            <span className="when" style={r.v && (r.k === "todo" || r.k === "rejected") ? { color: "#D93025" } : null}>
              <b>งาน</b>{r.v}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── สรุปงานขาย ──────────────────────────────────────────────
   หัวหน้าดูแค่ยอดรวมพอ รายละเอียดรายลูกค้าเป็นหน้าที่ของเซลล์ (หน้างานขาย/ยอดขาย) */
function LoSalesPanel({ leads, quotes, onGoSales }) {
  const month = window.SF.TODAY.slice(0, 7);
  const n = React.useMemo(() => {
    const L = leads || [], Q = quotes || [];
    let live = 0, late = 0, wonM = 0, pipe = 0, sale = 0, waiting = 0;
    L.forEach((l) => {
      const k = window.salesStageKey ? window.salesStageKey(l) : (l.status || "new");
      if (k === "won") { if (window.sMonthKey && window.sMonthKey(l.updatedAt) === month) wonM += 1; return; }
      if (k === "lost") return;
      live += 1; pipe += (+l.expValue || 0);
      if (window.sOverdue && window.sOverdue(l.nextFollow)) late += 1;
    });
    Q.forEach((q) => {
      if (q.status === "sent") waiting += 1;
      if (q.status === "accepted" && window.sMonthKey && window.sMonthKey(q.decidedAt || q.updatedAt) === month && window.quoteTotals)
        sale += window.quoteTotals(q).grand;
    });
    return { live, late, wonM, pipe, sale, waiting };
  }, [leads, quotes, month]);

  const rows = [
    { th: "ปิดการขายเดือนนี้", v: n.wonM + " ราย", sub: n.sale ? "฿" + fmtBaht(Math.round(n.sale)) : "ยังไม่มีใบที่ลูกค้าตกลง", color: "var(--primary)" },
    { th: "ลูกค้าที่ยังไล่อยู่", v: n.live + " ราย", sub: n.pipe ? "มูลค่าที่คาดไว้ ฿" + fmtBaht(Math.round(n.pipe)) : "ยังไม่ได้ใส่มูลค่าที่คาด", color: "#0EA5E9" },
    { th: "เลยวันติดตาม", v: n.late + " ราย", sub: n.late ? "เซลล์ต้องโทรก่อนใคร" : "ตามทันทุกราย", color: n.late ? "#D93025" : "var(--text-3)" },
    { th: "ใบเสนอราคารอลูกค้าตอบ", v: n.waiting + " ใบ", sub: "ส่งไปแล้วยังไม่ตัดสิน", color: "#EC4899" },
  ];
  /* ยังไม่มีลูกค้าและใบเสนอราคาในระบบเลย — โชว์ 0 สี่บรรทัดเหมือนพัง บอกไปตรง ๆ ดีกว่า */
  const empty = !(leads || []).length && !(quotes || []).length;
  return (
    <div className="pnl">
      <PanelTitle title="สรุปงานขาย" sub={empty ? "ยังไม่มีข้อมูล" : "เดือน " + window.TH_MONTHS[parseDate(window.SF.TODAY).getMonth()]} />
      {empty && (
        <div style={{ padding: "18px 2px", fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.7 }}>
          ยังไม่มีลูกค้าและใบเสนอราคาในระบบ<br />
          <span style={{ fontSize: 11.5 }}>เริ่มบันทึกที่หน้า “งานขาย” แล้วตัวเลขตรงนี้จะขึ้นเอง</span>
        </div>
      )}
      <div className="rows" style={{ display: empty ? "none" : undefined }}>
        {rows.map((r) => (
          <button key={r.th} onClick={() => onGoSales && onGoSales()}>
            <span className="mk" style={{ background: r.color }} />
            <span className="bd">
              <span className="nm" style={{ fontWeight: 600, fontSize: 12.5 }}>{r.th}</span>
              <span className="mt">{r.sub}</span>
            </span>
            <span className="when">{r.v}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── ผลงานเดือนนี้ ───────────────────────────────────────────── */
function LoMonthPanel({ jobs }) {
  const today = window.SF.TODAY;
  const month = today.slice(0, 7);
  const prevMonth = React.useMemo(() => {
    const d = parseDate(today); d.setDate(1); d.setMonth(d.getMonth() - 1);
    return loISO(d).slice(0, 7);
  }, [today]);
  const n = React.useMemo(() => {
    let cur = 0, curKw = 0, prev = 0, prevKw = 0;
    (jobs || []).forEach((j) => {
      if (j.stage !== "done") return;
      const m = loDoneAt(j).slice(0, 7);
      if (m === month) { cur += 1; curKw += (+j.kw || 0); }
      else if (m === prevMonth) { prev += 1; prevKw += (+j.kw || 0); }
    });
    return { cur, curKw, prev, prevKw };
  }, [jobs, month, prevMonth]);

  /* เดือนก่อนเป็นศูนย์ = เทียบเป็นเปอร์เซ็นต์ไม่ได้ ต้องพูดตรง ๆ ว่าไม่มีฐานให้เทียบ */
  const pct = n.prev > 0 ? Math.round(((n.cur - n.prev) / n.prev) * 100) : null;
  const M = window.TH_MONTHS[parseDate(today).getMonth()];
  return (
    <div className="pnl">
      <PanelTitle title="ผลงานเดือนนี้" sub={"งานที่ปิดจบในเดือน " + M} />
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, lineHeight: 1,
            letterSpacing: "-.035em", color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{n.cur}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-3)" }}>งาน</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--text-2)" }}>
          รวม <b>{Math.round(n.curKw * 10) / 10}</b> kW
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--text-3)" }}>
          {pct == null
            ? "เดือนก่อนไม่มีงานปิดจบ จึงยังเทียบไม่ได้"
            : (<React.Fragment>
                เดือนก่อน <b style={{ color: "var(--text-2)" }}>{n.prev}</b> งาน ({Math.round(n.prevKw * 10) / 10} kW) ·{" "}
                <span style={{ color: pct >= 0 ? "var(--primary-dark)" : "#D93025", fontWeight: 700 }}>
                  {pct >= 0 ? "+" : ""}{pct}%
                </span>
              </React.Fragment>)}
        </div>
      </div>
    </div>
  );
}

function LeadOverview({ jobs, leads, quotes, stock, techs, onOpen, onStage, onKpi, onTech, onGoPermit, onGoSales }) {
  const SF = window.SF;
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const J = jobs || [];
  const active = J.filter((j) => j.stage !== "done");
  const delayed = J.filter((j) => j.delayed);
  const problem = active.filter((j) => j.problem);
  const noInstall = active.filter((j) => !(SF.installDate && SF.installDate(j)));

  /* จำนวนงานที่ของไม่พอ — ใช้เกณฑ์เดียวกับแผงด้านล่างเป๊ะ ๆ (ติดตั้งภายใน 14 วันและช่วงยังไม่ผ่าน)
     ไม่งั้นตัวเลขบนหัวกับรายการข้างล่างจะไม่ตรงกัน แล้วไม่มีใครเชื่อทั้งคู่ */
  const shortCount = React.useMemo(() => {
    const items = (stock && stock.items) || [], moves = (stock && stock.moves) || [];
    if (!items.length) return 0;
    const today = SF.TODAY, max = loAddDays(today, 14);
    return active.filter((j) => {
      const s = SF.installDate ? SF.installDate(j) : "";
      if (!s) return false;
      const e = (SF.installEnd && SF.installEnd(j)) || s;
      if (!(e >= today && s <= max)) return false;
      return window.jobStockShortages ? window.jobStockShortages(j, items, moves).length > 0 : false;
    }).length;
  }, [jobs, stock]);

  const col = (spec) => ({ display: "grid", gridTemplateColumns: isMobile ? "1fr" : spec, gap: 18 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!isMobile && (
        <StatRail cols={4} items={[
          { label: "ล่าช้ากว่ากำหนด", value: delayed.length, unit: "งาน", accent: "var(--text-3)", alert: delayed.length > 0,
            sub: delayed.length ? "เลยวันนัดติดตั้งแล้ว" : "ไม่มีงานเลยกำหนด", onClick: () => onKpi("delayed") },
          { label: "ติดปัญหาหน้างาน", value: problem.length, unit: "งาน", accent: "#F59E0B", alert: problem.length > 0,
            sub: problem.length ? "มีบันทึกปัญหาค้างอยู่" : "ไม่มีงานติดปัญหา", onClick: () => onKpi("problem") },
          { label: "ยังไม่นัดวันติดตั้ง", value: noInstall.length, unit: "งาน", accent: "#0EA5E9",
            sub: <React.Fragment>จาก <b>{active.length}</b> งานที่ค้าง</React.Fragment>, onClick: () => onKpi("noinstall") },
          { label: "ของไม่พอ", value: shortCount, unit: "งาน", accent: "#EC4899",
            sub: shortCount ? "ต้องสั่งเพิ่มก่อนออกหน้างาน" : "ของครบทุกงานที่ใกล้ติดตั้ง" },
        ]} />
      )}

      <MaterialShortagePanel jobs={J} stock={stock} onOpen={onOpen} />

      <LoQueuePanel jobs={J} onOpen={onOpen} />

      <div style={col("1.15fr 1fr")}>
        <LoTechLoadPanel jobs={J} techs={techs} onTech={onTech} />
        <AlertsPanel jobs={J} onOpen={onOpen} />
      </div>

      <div style={col("1fr 1fr")}>
        <LoStalePanel jobs={J} onOpen={onOpen} />
        <LoBottleneckPanel jobs={J} onStage={onStage} />
      </div>

      <div style={col("1fr 1fr 1fr")}>
        <LoPermitPanel jobs={J} onGoPermit={onGoPermit} />
        <LoSalesPanel leads={leads} quotes={quotes} onGoSales={onGoSales} />
        <LoMonthPanel jobs={J} />
      </div>
    </div>
  );
}

Object.assign(window, { LeadOverview, loDaysInStage, loDoneAt, loSpanDays });
