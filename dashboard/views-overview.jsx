/* ============================================================
   SolarFlow — Overview view (KPIs, pipeline, alerts, schedule)
   ============================================================ */

function KpiCard({ label, value, unit, icon, accent, sub, alert, onClick }) {
  const mob = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div onClick={onClick}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(20,40,28,.12)"; e.currentTarget.style.borderColor = accent; const c = e.currentTarget.querySelector(".kpi-cta"); if (c) c.style.opacity = 1; } }}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = alert ? "0 0 0 3px #EF444411" : "var(--shadow-sm)"; e.currentTarget.style.borderColor = alert ? "#FCA5A5" : "var(--border)"; const c = e.currentTarget.querySelector(".kpi-cta"); if (c) c.style.opacity = 0; } }}
      style={{ background: "var(--surface)", border: "1px solid " + (alert ? "#FCA5A5" : "var(--border)"),
      borderRadius: mob ? 14 : 16, padding: mob ? 14 : 20, position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default",
      transition: "transform .14s, box-shadow .14s, border-color .14s",
      boxShadow: alert ? "0 0 0 3px #EF444411" : "var(--shadow-sm)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: mob ? 11 : 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: ".01em", whiteSpace: "normal", lineHeight: 1.3, minWidth: 0 }}>{label}</span>
        <span style={{ width: mob ? 28 : 34, height: mob ? 28 : 34, borderRadius: mob ? 8 : 10, background: accent + "16", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name={icon} size={mob ? 15 : 17} color={accent} />
        </span>
      </div>
      <div style={{ marginTop: mob ? 10 : 14, display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--display)", fontSize: mob ? 26 : 34, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: mob ? 12.5 : 14, fontWeight: 600, color: "var(--text-3)" }}>{unit}</span>}
      </div>
      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {sub && <span style={{ fontSize: mob ? 11 : 12, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>}
        {!mob && (
          <span className="kpi-cta" style={{ opacity: 0, transition: "opacity .14s", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>
            ดูรายการ <Icon name="arrowRight" size={13} color={accent} />
          </span>
        )}
      </div>
    </div>
  );
}

function PipelinePanel({ jobs, onStage }) {
  const SF = window.SF;
  const counts = SF.STAGES.map((s) => jobs.filter((j) => j.stage === s.key).length);
  const max = Math.max(...counts, 1);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="trend" iconColor="var(--primary)" title="งานแยกตามขั้นตอน" sub="Pipeline · คลิกเพื่อกรอง" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
        {SF.STAGES.map((s, i) => (
          <button key={s.key} onClick={() => onStage(s.key)} style={{ display: "flex",
            alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textAlign: "left", width: "100%" }}>
            <span style={{ width: 104, flexShrink: 0, display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.25 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }} />{s.th}
            </span>
            <span style={{ flex: 1, minWidth: 0, height: 22, background: "var(--surface3)", borderRadius: 7, overflow: "hidden", display: "block" }}>
              <span style={{ display: "block", height: "100%", width: Math.max((counts[i] / max) * 100, counts[i] ? 6 : 0) + "%",
                background: "linear-gradient(90deg," + s.color + "cc," + s.color + ")", borderRadius: 7, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
            </span>
            <span style={{ width: 28, flexShrink: 0, fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, color: counts[i] ? "var(--text-1)" : "var(--text-3)", textAlign: "right" }}>{counts[i]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelTitle({ icon, iconColor, title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={17} color={iconColor || "var(--text-2)"} />
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap" }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

function AlertsPanel({ jobs, onOpen }) {
  const problems = jobs.filter((j) => j.problem || j.delayed);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="alert" iconColor="#EF4444" title="งานที่ต้องดูแล" sub={problems.length + " งานติดปัญหา / ล่าช้า"} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, maxHeight: 280, overflowY: "auto" }}>
        {problems.length === 0 && <Empty text="ไม่มีงานติดปัญหา 🎉" />}
        {problems.map((j) => (
          <button key={j.id} onClick={() => onOpen(j)} style={{ display: "flex", gap: 11, padding: "11px 12px", textAlign: "left",
            background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.22)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            <span style={{ width: 4, alignSelf: "stretch", borderRadius: 99, background: "#EF4444", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto" }}>{j.name}</span>
                {j.delayed && <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444", background: "rgba(239,68,68,.16)", padding: "1px 6px", borderRadius: 99 }}>ล่าช้า</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {j.problem || ("เลยกำหนดวันนัด " + thDate(j.deadline))}
              </div>
              <div style={{ marginTop: 6 }}><StageBadge stageKey={j.stage} size="sm" /></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SchedulePanel({ jobs, onOpen }) {
  const today = window.SF.TODAY;
  const upcoming = jobs.filter((j) => j.stage !== "done" && j.deadline >= today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 6);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="calendar" iconColor="var(--primary)" title="นัดติดตั้งที่ใกล้ถึง" sub="เรียงตามวันนัด" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 14 }}>
        {upcoming.map((j) => {
          const d = parseDate(j.deadline);
          return (
            <button key={j.id} onClick={() => onOpen(j)} style={{ display: "flex", gap: 13, alignItems: "center", padding: "9px 8px",
              background: "none", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              <div style={{ width: 46, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", lineHeight: 1 }}>{d.getDate()}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600 }}>{window.TH_MONTHS[d.getMonth()]}</div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.province} · {j.kw} kW · {j.brand}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <StageBadge stageKey={j.stage} size="sm" />
                  {j.delayed && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#EF4444" }}>ล่าช้า</span>}
                </div>
              </div>
              <TechAvatar techId={j.tech} size={26} />
            </button>
          );
        })}
        {upcoming.length === 0 && <Empty text="ไม่มีนัดที่กำลังจะถึง" />}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ padding: "26px 0", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>{text}</div>;
}

/* ตารางงานของฉัน (วันนี้ + กำลังจะถึง) — นัดสำรวจ + งานติดตั้งของคนที่ล็อกอิน · โปรเจคเดียวกันยุบเป็นแถวเดียว (ช่วงวัน) */
function _schedTime(iso) { try { const d = new Date(iso); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); } catch (e) { return ""; } }
// ช่วงวันแบบสั้น: วันเดียว "25 มิ.ย." · ช่วงเดือนเดียว "25–26 มิ.ย." · ข้ามเดือน "29 มิ.ย.–3 ก.ค."
function _schedRange(start, end) {
  const M = window.TH_MONTHS, d1 = parseDate(start), d2 = parseDate(end);
  if (!end || start === end) return d1.getDate() + " " + M[d1.getMonth()];
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear())
    return d1.getDate() + "–" + d2.getDate() + " " + M[d1.getMonth()];
  return d1.getDate() + " " + M[d1.getMonth()] + "–" + d2.getDate() + " " + M[d2.getMonth()];
}

function MySchedRow({ it, onOpen }) {
  const isSurvey = it.type === "survey";
  const color = isSurvey ? "#7C5CFC" : (it.color || "var(--primary)");
  const title = isSurvey ? (it.a.jobName || it.a.jobCode || "นัดสำรวจ") : it.job.name;
  const range = _schedRange(it.start, it.end);
  const sub = isSurvey
    ? ("นัดสำรวจ" + (it.a.province ? " · " + it.a.province : "") + (_schedTime(it.a.start) ? " · " + _schedTime(it.a.start) : ""))
    : ("ติดตั้ง · " + (it.job.province || "-") + " · " + it.job.kw + " kW");
  const click = isSurvey ? () => { if (it.a.projectId) onOpen({ id: it.a.projectId }); } : () => onOpen(it.job);
  return (
    <button onClick={click} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 13px", textAlign: "left",
      background: color + "0d", border: "1px solid " + color + "33", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: color, color: "#fff" }}>
        <Icon name={isSurvey ? "search" : "pin"} size={15} color="#fff" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--text-2)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
      </span>
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: color, background: color + "14", padding: "4px 10px", borderRadius: 99, whiteSpace: "nowrap" }}>{range}</span>
    </button>
  );
}

function MySchedulePanel({ items, onOpen }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="calendar" iconColor="var(--primary)" title="ตารางงานของฉัน" sub={thDate(window.SF.TODAY, true) + " · งานที่ใกล้ถึง"} />
      {items.length === 0 ? <Empty text="ไม่มีงานในตารางของคุณตอนนี้ 🎉" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          {items.map((it) => <MySchedRow key={it.key} it={it} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

/* ── เตือนของไม่พอ "ก่อนวันติดตั้ง" — เทียบ BOQ ของงาน (หักที่เบิกไปแล้ว) กับสต็อกคงเหลือ ── */
const _shortNorm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
function _addDaysISO(iso, n) {
  const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
// คืนรายการวัสดุที่ "ยังต้องเบิกเพิ่ม แต่คลังไม่พอ" ของงานนี้ (จับคู่คลังด้วยชื่อ · หัก out-return ของงาน)
function jobStockShortages(job, stockItems, moves) {
  if (!job || !window.BOQ) return [];
  let res;
  try { res = window.BOQ.calcBOQ(Object.assign(window.BOQ.blankBOQ(job), job.boq || {})); }
  catch (e) { return []; }
  const byName = {};
  (stockItems || []).forEach((it) => { if (it.name) byName[_shortNorm(it.name)] = it; });
  // รวมความต้องการตาม BOQ (เฉพาะรายการที่มีในคลัง)
  const need = {};
  (res.groups || []).forEach((g) => (g.items || []).forEach((it) => {
    const key = window.BOQ.matKey(it.name); const qty = Math.round(+it.qty || 0);
    if (!key || qty <= 0) return;
    const k = _shortNorm(key); const s = byName[k]; if (!s) return;
    if (need[k]) need[k].qty += qty; else need[k] = { item: s, name: s.name, unit: it.unit || s.unit, qty, group: g.group };
  }));
  // หักที่เบิกไปแล้วสำหรับงานนี้ (out − return)
  const done = {};
  (moves || []).forEach((m) => {
    if (m.jobId !== job.id) return;
    done[m.itemId] = (done[m.itemId] || 0) + (m.type === "out" ? m.qty : (m.type === "return" ? -m.qty : 0));
  });
  const out = [];
  Object.keys(need).forEach((k) => {
    const n = need[k]; const already = Math.max(0, done[n.item.id] || 0);
    const remain = n.qty - already; if (remain <= 0) return;      // เบิกครบแล้ว
    const have = +n.item.qty || 0; const short = remain - have;
    if (short > 0) out.push({ name: n.name, code: n.item.sku || "", unit: n.unit, group: n.group || "อื่นๆ", need: remain, have, short });
  });
  return out.sort((a, b) => b.short - a.short);
}

/* ── ดาวน์โหลด "รายการที่ต้องสั่งเพิ่ม" ของงานเป็นไฟล์ Excel — แยกตามหมวด (สไตล์เดียวกับ BOQ) ── */
const SHORTAGE_GROUP_ORDER = ["PV MODULE", "INVERTER", "COMBINER BOX", "MOUNTING", "CABLE", "RACE WAY", "GROUNDING", "LADDER (บันไดลิง)", "WALKWAY", "GUARD RAIL", "ACCESSORIES"];
function exportShortageXlsx(job, rows) {
  if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
  const X = window.XLSX;
  const C = { brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF", group: "D6EBDF", alt: "F4FAF6",
    white: "FFFFFF", border: "CBD8D0", text: "16241D", sub: "5A6B62", shortTx: "B45309", shortBg: "FDEBD0" };
  const FONT = "Tahoma";
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const cols = ["ลำดับ", "รหัส", "รายการวัสดุ", "ต้องใช้ (BOQ)", "คงเหลือ", "ต้องสั่งเพิ่ม", "หน่วย"];
  const lastC = cols.length - 1;
  const colW = [{ wch: 7 }, { wch: 15 }, { wch: 50 }, { wch: 13 }, { wch: 11 }, { wch: 14 }, { wch: 9 }];
  const aoa = [], merges = [], meta = [], rowsH = []; let R = 0;
  const pushRow = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const fullMerge = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });
  const inst = window.SF.installDate ? window.SF.installDate(job) : "";

  pushRow(["รายการวัสดุที่ต้องสั่งเพิ่ม (ของไม่พอ)"], "title", 30); fullMerge(R - 1);
  pushRow(["PHITHAN GREEN · ระบบติดตามงานติดตั้งโซลาร์เซลล์"], "subtitle", 20); fullMerge(R - 1);
  pushRow([], "spacer", 6);
  const info = [
    ["โครงการ", job ? (job.name || "") : ""],
    ["รหัสงาน", job ? (job.code || "") : ""],
    ["วันติดตั้ง", inst || "-"],
    ["วันที่ออกเอกสาร", window.SF.TODAY || ""],
  ];
  info.forEach((row) => {
    const cells = [row[0]]; for (let i = 1; i <= lastC; i++) cells.push(i === 1 ? row[1] : "");
    pushRow(cells, "info", 19); merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: lastC } });
  });
  pushRow([], "spacer", 8);
  pushRow(cols, "head", 22);

  // จัดกลุ่มตามหมวด (เรียงหมวดตามลำดับ BOQ · ในหมวดเรียงของขาดมากก่อน)
  const byGroup = {};
  (rows || []).forEach((it) => { const g = it.group || "อื่นๆ"; (byGroup[g] || (byGroup[g] = [])).push(it); });
  const groups = Object.keys(byGroup).sort((a, b) => {
    const ia = SHORTAGE_GROUP_ORDER.indexOf(a), ib = SHORTAGE_GROUP_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  let n = 0;
  groups.forEach((g) => {
    n += 1;
    const grow = ["ลำดับที่ " + n, ""]; for (let i = 2; i <= lastC; i++) grow.push(i === 2 ? g : "");
    pushRow(grow, "group", 20); merges.push({ s: { r: R - 1, c: 2 }, e: { r: R - 1, c: lastC } });
    byGroup[g].forEach((it, k) => {
      pushRow([n + "." + (k + 1), it.code || "", it.name || "", +it.need || 0, +it.have || 0, +it.short || 0, it.unit || ""], k % 2 === 0 ? "item" : "itemAlt");
    });
  });

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges; ws["!cols"] = colW; ws["!rows"] = rowsH;
  const qtyFmt = '#,##0.##';
  const styleCell = (r, c) => {
    const t = meta[r]; if (t === "spacer") return null;
    const s = { font: { name: FONT, sz: 11, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (t === "title") { s.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "subtitle") { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "info") { if (c === 0) { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.sub } }; s.alignment = { horizontal: "right", vertical: "center" }; } else { s.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; s.alignment = { horizontal: "left", vertical: "center" }; } s.border = { bottom: thin }; }
    else if (t === "head") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: c === 2 ? "left" : "center", vertical: "center", wrapText: true }; s.border = boxAll; }
    else if (t === "group") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.group } }; s.alignment = { horizontal: c < 2 ? "center" : "left", vertical: "center" }; s.border = boxAll; }
    else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s.border = boxAll;
      if (c === 0) s.alignment = { horizontal: "center", vertical: "center" };
      else if (c === 1) { s.alignment = { horizontal: "center", vertical: "center" }; s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
      else if (c === 2) s.alignment = { horizontal: "left", vertical: "center", wrapText: true };
      else if (c === 5) { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = qtyFmt; s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.shortTx } }; s.fill = { patternType: "solid", fgColor: { rgb: C.shortBg } }; }
      else if (c === 6) s.alignment = { horizontal: "center", vertical: "center" };
      else { s.alignment = { horizontal: "right", vertical: "center" }; s.numFmt = qtyFmt; }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const s = styleCell(r, c);
      if (!s) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = s;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "สั่งซื้อ");
  X.writeFile(wb, "สั่งซื้อ_" + (job ? job.code : "job") + ".xlsx");
}

function MaterialShortagePanel({ jobs, stock, onOpen }) {
  const SF = window.SF;
  const today = SF.TODAY;
  const SOON_DAYS = 14;   // เตือนงานที่จะติดตั้งภายใน 14 วัน (หรือถึงกำหนดแล้วแต่ยังไม่เสร็จ)
  const stockItems = (stock && stock.items) || [];
  const moves = (stock && stock.moves) || [];
  const rows = React.useMemo(() => {
    const soonMax = _addDaysISO(today, SOON_DAYS);
    const cand = jobs.filter((j) => {
      if (j.stage === "done") return false;
      const s = SF.installDate ? SF.installDate(j) : "";
      if (!s) return false;
      const e = SF.installEnd ? SF.installEnd(j) : s;
      return e >= today && s <= soonMax;   // ช่วงติดตั้งยังไม่ผ่าน & เริ่มภายในหน้าต่างที่กำหนด
    });
    return cand.map((j) => ({ job: j, start: SF.installDate(j), short: jobStockShortages(j, stockItems, moves) }))
      .filter((r) => r.short.length > 0)
      .sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  }, [jobs, stockItems, moves]);

  if (rows.length === 0) return null;   // ของครบทุกงาน → ไม่แสดง (ลดความรก)
  const AMBER = "#F59E0B";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid " + AMBER + "55", borderRadius: 16, padding: 22, boxShadow: "0 0 0 3px " + AMBER + "12" }}>
      <PanelTitle icon="alert" iconColor={AMBER} title="ของไม่พอ ก่อนวันติดตั้ง"
        sub={rows.length + " งานที่ของขาด — ควรสั่งเพิ่มก่อนออกหน้างาน"} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16, maxHeight: 340, overflowY: "auto" }}>
        {rows.map((r) => {
          const d = parseDate(r.start);
          const dateStr = r.start ? (d.getDate() + " " + window.TH_MONTHS[d.getMonth()]) : "ไม่ระบุวัน";
          const dueSoon = r.start && r.start <= _addDaysISO(today, 3);
          return (
            <div key={r.job.id} role="button" tabIndex={0} onClick={() => onOpen(r.job)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r.job); } }}
              style={{ display: "flex", gap: 11, padding: "11px 12px", textAlign: "left", alignItems: "flex-start",
              background: AMBER + "12", border: "1px solid " + AMBER + "44", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
              <span style={{ width: 4, alignSelf: "stretch", borderRadius: 99, background: AMBER, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "0 1 auto" }}>{r.job.name}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: dueSoon ? "#EF4444" : AMBER, background: (dueSoon ? "#EF4444" : AMBER) + "1f", padding: "1px 7px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
                    ติดตั้ง {dateStr}
                  </span>
                </div>
                <div style={{ marginTop: 6 }}><StageBadge stageKey={r.job.stage} size="sm" /></div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); exportShortageXlsx(r.job, r.short); }}
                title="ดาวน์โหลดรายการสั่งซื้อ (Excel · แยกหมวด)" aria-label="ดาวน์โหลดรายการสั่งซื้อ"
                style={{ flexShrink: 0, alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 11px",
                  background: "#1d854b14", border: "1px solid #1d854b44", borderRadius: 9, color: "#1d854b",
                  fontWeight: 700, fontSize: 11.5, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
                <Icon name="download" size={14} color="#1d854b" /> ไฟล์
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>* เทียบ BOQ ที่ถอดได้กับคลัง (หักของที่เบิกเข้างานแล้ว) — เปิดงานเพื่อดู/เบิกของ · ปุ่ม “ไฟล์” = ดาวน์โหลดรายการสั่งซื้อ Excel (แยกหมวด)</div>
    </div>
  );
}

function OverviewView({ jobs, schedule, onOpen, onStage, onKpi, stock }) {
  const active = jobs.filter((j) => j.stage !== "done");
  const delayed = jobs.filter((j) => j.delayed);
  const ready = active.filter((j) => j.matReady);
  const totalKwh = jobs.filter((j) => j.battery).reduce((s, j) => s + (parseInt(j.batSize) || 0), 0);
  const done = jobs.filter((j) => j.stage === "done");
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!isMobile && (
      <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <KpiCard label="งานกำลังดำเนินการ" value={active.length} unit="งาน" icon="list" accent="#3B82F6" sub={"เสร็จแล้ว " + done.length + " งาน"} onClick={() => onKpi("active")} />
        <KpiCard label="งานล่าช้ากว่ากำหนด" value={delayed.length} unit="งาน" icon="alert" accent="#EF4444" alert={delayed.length > 0} sub="เลยวันนัดติดตั้ง" onClick={() => onKpi("delayed")} />
        <KpiCard label="อุปกรณ์พร้อมติดตั้ง" value={ready.length} unit="งาน" icon="box" accent="var(--primary)" sub="วัสดุครบทุกรายการ" onClick={() => onKpi("ready")} />
      </div>
      )}

      <MySchedulePanel items={schedule || []} onOpen={onOpen} />

      <MaterialShortagePanel jobs={jobs} stock={stock} onOpen={onOpen} />

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        <PipelinePanel jobs={jobs} onStage={onStage} />
        <AlertsPanel jobs={jobs} onOpen={onOpen} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <SchedulePanel jobs={jobs} onOpen={onOpen} />
        <BrandPanel jobs={jobs} />
      </div>
    </div>
  );
}

function BrandPanel({ jobs }) {
  const SF = window.SF;
  const byBrand = SF.BRANDS.map((b) => ({ b, n: jobs.filter((j) => j.brand === b).length }));
  const total = jobs.length || 1;
  const byType = SF.TYPES.map((t) => ({ t, n: jobs.filter((j) => j.type === t.key).length }));
  const colors = { ATMOCE: "#7C5CFC", Huawei: "#EF4444" };
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "var(--shadow-sm)" }}>
      <PanelTitle icon="grid" title="สัดส่วนงาน" sub="แบรนด์ & ประเภท" />
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>แบรนด์อินเวอร์เตอร์</div>
        <div style={{ display: "flex", height: 14, borderRadius: 99, overflow: "hidden", gap: 2 }}>
          {byBrand.map(({ b, n }) => n > 0 && (
            <div key={b} style={{ width: (n / total * 100) + "%", background: colors[b] || "var(--primary)" }} title={b + " " + n} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
          {byBrand.map(({ b, n }) => (
            <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: colors[b] }} />{b}<strong style={{ color: "var(--text-1)" }}>{n}</strong>
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)", marginBottom: 10 }}>ประเภทงาน</div>
        <div style={{ display: "flex", gap: 12 }}>
          {byType.map(({ t, n }) => (
            <div key={t.key} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, background: t.color + "12", border: "1px solid " + t.color + "26" }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: t.color, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 5, fontWeight: 500 }}>{t.th}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OverviewView, KpiCard, PanelTitle, Empty });
