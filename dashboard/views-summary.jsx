/* ============================================================
   flash+solar — สรุปรายงาน (Summary): ประจำวัน · ประจำสัปดาห์ · ประจำเดือน

   หัวหน้าถามทุกเย็นว่า "วันนี้สำรวจกี่บ้าน ติดตั้งกี่บ้าน เข้าบริการกี่บ้าน
   แล้วพรุ่งนี้มีนัดอะไรบ้าง" — คำตอบกระจายอยู่สี่หน้า (จัดตารางสำรวจ · บอร์ดงาน ·
   งานบริการ · รายงานประจำวัน) หน้านี้ดึงมารวมเป็นตัวเลขชุดเดียว แล้วแยกให้ดูได้ว่า
   เป็นงานบ้าน · Tesla · หรืองานโครงการ (ประเภทงานตาม SF.TYPES ตัวเดียวกับใบงาน)

   ── นิยามตัวเลข (นับเป็น "บ้าน" = ไซต์ไม่ซ้ำกันในช่วงที่ดู) ──
     สำรวจ   ทำแล้ว = นัดสำรวจที่ปิดสถานะ "สำรวจเสร็จ" (วันที่ปิดจริง completedAt)
             นัดหมาย = นัดสำรวจที่วันนัดอยู่ในช่วง (ไม่นับที่ยกเลิก/เลื่อนไปแล้ว)
     ติดตั้ง ทำแล้ว = ปิดงาน "เสร็จสิ้น" ในช่วง · หรือกำลังติดตั้งอยู่ในช่วงวันนัด ·
                      หรือมีรายงานประจำวันของวันนั้น (ลงหน้างานจริงแม้ยังไม่ปิดงาน)
             นัดหมาย = ช่วงวันนัดติดตั้ง (stageDates.install) คาบเกี่ยวกับช่วงที่ดู
     บริการ  ทำแล้ว = ใบรายงานเข้าบริการ · ใบแจ้งซ่อมที่ปิดงาน · นัดล้างแผงที่ล้างแล้ว
             นัดหมาย = ใบแจ้งซ่อมที่นัดวันเข้าแก้ไข · นัดล้างแผงที่จองคิวไว้

   อ่านจากตัวเก็บข้อมูลเดิมทั้งหมด ไม่มีโหนดใหม่ในฐานข้อมูล — ตัวเลขจึงตรงกับหน้าอื่นเสมอ
   ตั้งชื่อ top-level ขึ้นต้นด้วย ws/Ws/WS กันชนกับไฟล์อื่น (สคริปต์ธรรมดา scope เดียวกันหมด)
   ============================================================ */

const WS_KINDS = [
  { key: "survey",  th: "สำรวจ",  doneTh: "สำรวจแล้ว",  planTh: "นัดสำรวจ",  color: "#3B82F6", icon: "search" },
  { key: "install", th: "ติดตั้ง", doneTh: "ติดตั้งแล้ว", planTh: "นัดติดตั้ง", color: "#84CC16", icon: "bolt" },
  { key: "service", th: "บริการ",  doneTh: "บริการแล้ว",  planTh: "นัดบริการ",  color: "#F59E0B", icon: "wrench" },
];
const WS_PERIODS = [
  { key: "day",   th: "รายวัน",     title: "ประจำวัน" },
  { key: "week",  th: "รายสัปดาห์", title: "ประจำสัปดาห์" },
  { key: "month", th: "รายเดือน",   title: "ประจำเดือน" },
];
const WS_BUCKETS = [
  { key: "done", th: "ทำแล้ว",  color: "#10B981" },
  { key: "plan", th: "นัดหมาย", color: "#0EA5E9" },
];

/* ── วันที่ ── ทำเองในไฟล์ (ไม่พึ่งลำดับโหลดของไฟล์อื่น) · คำนวณเป็น ค.ศ. เสมอ แสดงเป็น พ.ศ. */
const WS_DAY_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const WS_DAY_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const WS_MON_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const WS_MON_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const wsPad = (n) => (n < 10 ? "0" : "") + n;
const wsISO = (d) => d.getFullYear() + "-" + wsPad(d.getMonth() + 1) + "-" + wsPad(d.getDate());
const wsParse = (iso) => new Date(String(iso).slice(0, 10) + "T00:00:00");
const wsToday = () => wsISO(new Date());
const wsAddDays = (iso, n) => { const d = wsParse(iso); d.setDate(d.getDate() + n); return wsISO(d); };
/* วันแบบเวลาบ้านเรา — ตราเวลา ISO เป็น UTC ถ้าตัดสิบตัวแรกตรง ๆ ของที่บันทึกหลังห้าโมงเย็นจะกลายเป็นวันก่อนหน้า
   ค่าที่เป็น YYYY-MM-DD อยู่แล้วคืนตามนั้น */
function wsDayOf(ts) {
  if (!ts) return "";
  const s = String(ts);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s.slice(0, 10) : wsISO(d);
}
function wsTimeOf(ts) {
  if (!ts) return "";
  const s = String(ts);
  if (/^\d{1,2}:\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : wsPad(d.getHours()) + ":" + wsPad(d.getMinutes());
}
const wsShort = (iso) => { const d = wsParse(iso); return isNaN(d.getTime()) ? "—" : d.getDate() + " " + WS_MON_TH[d.getMonth()]; };
const wsShortDay = (iso) => { const d = wsParse(iso); return isNaN(d.getTime()) ? "—" : WS_DAY_SHORT[d.getDay()] + " " + d.getDate() + " " + WS_MON_TH[d.getMonth()]; };

/* ช่วงวันของแต่ละมุมมอง — สัปดาห์เริ่มวันจันทร์ (ตารางงานช่างนับแบบนั้น) */
function wsRange(period, anchor) {
  const a = wsParse(anchor);
  if (period === "day") return { start: anchor, end: anchor };
  if (period === "week") {
    const dow = (a.getDay() + 6) % 7;
    const s = wsAddDays(anchor, -dow);
    return { start: s, end: wsAddDays(s, 6) };
  }
  return { start: wsISO(new Date(a.getFullYear(), a.getMonth(), 1)), end: wsISO(new Date(a.getFullYear(), a.getMonth() + 1, 0)) };
}
function wsShift(period, anchor, n) {
  if (period === "day") return wsAddDays(anchor, n);
  if (period === "week") return wsAddDays(anchor, 7 * n);
  const a = wsParse(anchor);
  return wsISO(new Date(a.getFullYear(), a.getMonth() + n, 1));
}
const wsOverlaps = (r, s, e) => !!s && s <= r.end && (e || s) >= r.start;
function wsRangeLabel(period, r) {
  const s = wsParse(r.start), e = wsParse(r.end);
  const yr = (d) => d.getFullYear() + 543;
  if (period === "day") return WS_DAY_TH[s.getDay()] + " " + s.getDate() + " " + WS_MON_TH[s.getMonth()] + " " + yr(s);
  if (period === "month") return WS_MON_FULL[s.getMonth()] + " " + yr(s);
  if (s.getMonth() === e.getMonth()) return s.getDate() + "–" + e.getDate() + " " + WS_MON_TH[s.getMonth()] + " " + yr(e);
  return s.getDate() + " " + WS_MON_TH[s.getMonth()] + " – " + e.getDate() + " " + WS_MON_TH[e.getMonth()] + " " + yr(e);
}
/* แถวย่อยของช่วง — สัปดาห์แตกเป็นรายวัน · เดือนแตกเป็นรายสัปดาห์ (จันทร์–อาทิตย์ ตัดขอบเดือน) */
function wsSubRanges(period, r) {
  if (period === "day") return [];
  const out = [];
  if (period === "week") {
    for (let d = r.start; d <= r.end; d = wsAddDays(d, 1)) out.push({ start: d, end: d, th: wsShortDay(d) });
    return out;
  }
  let s = r.start, i = 1;
  while (s <= r.end) {
    const dow = (wsParse(s).getDay() + 6) % 7;
    let e = wsAddDays(s, 6 - dow);
    if (e > r.end) e = r.end;
    out.push({ start: s, end: e, th: "สัปดาห์ " + i + " · " + wsShort(s) + (e !== s ? "–" + wsShort(e) : "") });
    s = wsAddDays(e, 1); i++;
  }
  return out;
}

/* ── ประเภทงาน ── ใช้ SF.TYPES ตัวเดียวกับใบงาน (งานบ้าน · Tesla · งานโครงการ)
   ค่าที่ไม่รู้จัก เช่น "biz" จากฟอร์มลูกค้ารุ่นเก่า = โครงการ · ว่าง = งานบ้าน */
const wsTypes = () => ((window.SF && window.SF.TYPES) || []);
function wsTypeOf(t) {
  if (!t) return "home";
  if (wsTypes().some((x) => x.key === t)) return t;
  return t === "biz" || t === "project" ? "project" : "home";
}
const wsTypeInfo = (k) => wsTypes().find((x) => x.key === k) || { key: k, th: k === "all" ? "รวม" : k, color: "var(--text-2)" };

/* ── รวมรายการจากทุกแหล่งให้เป็นรูปเดียวกัน ──
   item = { kind, bucket, targetId, type, day, dayEnd?, time, code, name, province, who, status:{th,color}, sub, note, job, prio }
   targetId = ไซต์/งาน/ลูกค้า ใช้ยุบให้เหลือ "หนึ่งบ้านหนึ่งแถว" · prio = แถวไหนชนะเมื่อบ้านเดียวมีหลายรายการ */
function wsBuildItems(src) {
  const SF = window.SF || {};
  const jobsById = {}; (src.jobs || []).forEach((j) => { if (j) jobsById[j.id] = j; });
  const leadsById = {}; (src.leads || []).forEach((l) => { if (l) leadsById[l.id] = l; });
  const sitesById = {}; (src.sites || []).forEach((s) => { if (s) sitesById[s.id] = s; });
  const techName = (id) => { const t = id && SF.TECH_BY_ID && SF.TECH_BY_ID[id]; return t ? (t.nick || t.name) : ""; };
  const out = [];

  /* ── สำรวจ ── */
  const ASB = window.APPT_STATUS_BY || {};
  (src.appts || []).forEach((a) => {
    if (!a || !a.start) return;
    const job = a.projectId ? jobsById[a.projectId] || null : null;
    const lead = a.leadId ? leadsById[a.leadId] || null : null;
    const tgt = job || lead;
    const st = ASB[a.status] || ASB.scheduled || { th: a.status || "", color: "#94A3B8" };
    const base = {
      kind: "survey", targetId: a.projectId || a.leadId || a.id, type: wsTypeOf(tgt ? tgt.type : ""),
      code: (tgt && tgt.code) || a.jobCode || "", name: (tgt && tgt.name) || a.jobName || "(ไม่ระบุชื่อ)",
      province: (tgt && tgt.province) || a.province || "", who: techName(a.engineerId),
      status: { th: st.th, color: st.color }, sub: lead && !job ? "ลูกค้าสำรวจ (ยังไม่เป็นงาน)" : "",
      note: a.notes || "", job: job, prio: 2,
    };
    if (a.status !== "canceled" && a.status !== "rescheduled")
      out.push(Object.assign({}, base, { bucket: "plan", key: "sa-p-" + a.id, day: wsDayOf(a.start), time: wsTimeOf(a.start) }));
    if (a.status === "done")
      out.push(Object.assign({}, base, { bucket: "done", key: "sa-d-" + a.id,
        day: wsDayOf(a.completedAt) || wsDayOf(a.start), time: wsTimeOf(a.completedAt) || wsTimeOf(a.start) }));
  });

  /* ── ติดตั้ง ── */
  (src.jobs || []).forEach((j) => {
    if (!j) return;
    const s = SF.installDate ? SF.installDate(j) : "";
    const e = s ? (SF.installEnd ? SF.installEnd(j) : s) : "";
    const reports = Object.keys((src.dailyAll || {})[j.id] || {}).sort();
    const base = { kind: "install", targetId: j.id, type: wsTypeOf(j.type), code: j.code || j.id, name: j.name || "(ไม่ระบุชื่อ)",
      province: j.province || "", who: techName(j.tech), job: j, reports: reports, note: j.problem || "", sub: "" };
    if (s) {
      const st = j.stage === "done" ? { th: "เสร็จสิ้นแล้ว", color: "#10B981" }
        : j.stage === "install" ? { th: "กำลังติดตั้ง", color: "#84CC16" }
        : j.delayed ? { th: "เลยวันนัด · ยังไม่เริ่ม", color: "#EF4444" }
        : { th: "รอถึงวันนัด", color: "#F59E0B" };
      out.push(Object.assign({}, base, { bucket: "plan", key: "j-p-" + j.id, day: s, dayEnd: e, time: "", status: st, prio: 2 }));
    }
    /* ปิดงานเมื่อไหร่ดูจากประวัติขั้น "เสร็จสิ้น" (มีเฉพาะแถวที่เดินถึงจริง) ถอยไปใช้วันเสร็จติดตั้งถ้าไม่มี */
    if (j.stage === "done") {
      const h = (j.hist || []).find((x) => x && x.key === "done" && x.status !== "pending" && (x.date || x.at));
      const dd = (h && (h.date || wsDayOf(h.at))) || e || "";
      if (dd) out.push(Object.assign({}, base, { bucket: "done", key: "j-d-" + j.id, day: dd, time: h ? wsTimeOf(h.at) : "",
        status: { th: "เสร็จสิ้น", color: "#10B981" }, prio: 3 }));
    } else if (j.stage === "install" && s) {
      out.push(Object.assign({}, base, { bucket: "done", key: "j-w-" + j.id, day: s, dayEnd: e, time: "",
        status: { th: "กำลังติดตั้ง", color: "#84CC16" }, prio: 2 }));
    }
    /* วันที่มีรายงานประจำวัน = ลงหน้างานจริง — ครอบเคสงานลากยาวเกินวันนัด หรือยังไม่ได้ตั้งวันนัดในระบบ */
    reports.forEach((d) => {
      out.push(Object.assign({}, base, { bucket: "done", key: "j-r-" + j.id + "-" + d, day: d, time: "",
        status: { th: "มีรายงานหน้างาน", color: "#84CC16" }, prio: 1 }));
    });
  });

  /* ── บริการหลังการขาย ── ไซต์ของเราใช้ id เดียวกับงาน จึงหยิบประเภทจากใบงานได้ตรง ๆ */
  const siteBase = (siteId, fallbackName) => {
    const site = sitesById[siteId] || {};
    const j = jobsById[site.jobId || siteId] || null;
    return { kind: "service", targetId: siteId || fallbackName || "?", type: wsTypeOf(j ? j.type : site.type),
      code: site.code || (j && j.code) || siteId || "", name: site.name || (j && j.name) || fallbackName || "(ไม่ระบุชื่อ)",
      province: site.province || (j && j.province) || "", who: techName(site.tech), job: j, note: "", sub: "" };
  };
  const TSB = window.OM_TICKET_STATUS_BY || {};
  const tkey = window.omTicketKey || ((k) => k);
  (src.tickets || []).forEach((t) => {
    if (!t) return;
    const k = tkey(t.status);
    const st = TSB[k] || { th: k || "", color: "#94A3B8" };
    const b = siteBase(t.siteId, t.siteName);
    b.who = t.assigneeName || techName(t.techId) || b.who;
    b.sub = "ใบแจ้งซ่อม " + (t.no || "") + (t.title ? " · " + t.title : "");
    if (t.apptDate && (k === "scheduled" || k === "closed"))
      out.push(Object.assign({}, b, { bucket: "plan", key: "t-p-" + t.id, day: t.apptDate, time: t.apptFrom || "",
        status: { th: st.th, color: st.color }, prio: 2 }));
    if (k === "closed" && t.closedAt)
      out.push(Object.assign({}, b, { bucket: "done", key: "t-d-" + t.id, day: wsDayOf(t.closedAt), time: wsTimeOf(t.closedAt),
        status: { th: "ปิดงานแล้ว", color: "#10B981" }, prio: 2 }));
  });
  const CSB = window.OM_CLEAN_STATUS || {};
  const cleanLive = window.omCleanLive || ((v) => !!v && v.status !== "canceled" && v.status !== "skipped");
  (src.cleanAll || []).forEach((v) => {
    if (!cleanLive(v)) return;
    const d = v.date || v.due;
    if (!d) return;
    const st = CSB[v.status] || CSB.planned || { th: v.status || "", color: "#94A3B8" };
    const b = siteBase(v.siteId);
    b.who = techName(v.techId) || b.who;
    b.sub = "ล้างแผง" + (v.free ? " (ครั้งฟรีตามสัญญา)" : "");
    out.push(Object.assign({}, b, { bucket: "plan", key: "c-p-" + v.id, day: d, time: v.timeFrom || "", status: { th: st.th, color: st.color }, prio: 1 }));
    if (v.status === "done")
      out.push(Object.assign({}, b, { bucket: "done", key: "c-d-" + v.id, day: wsDayOf(v.doneAt) || d, time: wsTimeOf(v.doneAt) || v.timeFrom || "",
        status: { th: "ล้างแล้ว", color: "#10B981" }, prio: 1 }));
  });
  const VKB = window.OM_VISIT_KIND_BY || {};
  const vst = window.omVisitStatusOf || (() => ({ th: "", color: "#94A3B8" }));
  (src.visits || []).forEach((v) => {
    if (!v || !v.date) return;
    const kind = VKB[v.kind] || { th: "เข้าบริการ" };
    const st = vst(v.status);
    const b = siteBase(v.siteId, v.siteName);
    b.who = techName(v.team) || v.byName || b.who;
    b.sub = "ใบรายงานเข้าบริการ " + (v.no || "");
    out.push(Object.assign({}, b, { bucket: "done", key: "v-d-" + v.id, day: v.date, time: v.timeIn || "",
      status: { th: kind.th + (st.th ? " · " + st.th : ""), color: st.color }, prio: 3 }));
  });
  return out;
}

/* เลือกรายการของ (ชนิดงาน × ทำแล้ว/นัดหมาย) ในช่วงและประเภทที่ดู แล้วยุบให้ "หนึ่งบ้านหนึ่งแถว"
   บ้านเดียวมีหลายรายการ (เช่น ปิดงานซ่อม + ใบรายงานเข้าบริการวันเดียวกัน) เก็บแถวที่ prio สูงสุด แล้วนับ n ไว้ */
function wsSelect(items, range, type, kind, bucket) {
  const hit = [];
  (items || []).forEach((it) => {
    if (it.kind !== kind || it.bucket !== bucket) return;
    if (type !== "all" && it.type !== type) return;
    if (!wsOverlaps(range, it.day, it.dayEnd)) return;
    hit.push(it);
  });
  hit.sort((a, b) => (b.prio || 0) - (a.prio || 0));
  const byT = new Map();
  hit.forEach((it) => {
    const k = it.targetId;
    if (!byT.has(k)) byT.set(k, Object.assign({}, it, { n: 1 }));
    else byT.get(k).n++;
  });
  const rows = Array.from(byT.values()).sort((a, b) => {
    const ka = a.day + " " + (a.time || "99:99"), kb = b.day + " " + (b.time || "99:99");
    return ka < kb ? -1 : ka > kb ? 1 : String(a.code).localeCompare(String(b.code));
  });
  return { rows, houses: rows.length, items: hit.length };
}
const wsCount = (items, range, type, kind, bucket) => wsSelect(items, range, type, kind, bucket).houses;

/* ── บรรทัดข้อความของหนึ่งแถว (ใช้ทั้งบนจอและในข้อความที่คัดลอกไปส่ง LINE) ── */
function wsWhen(it, range) {
  const multi = range.start !== range.end;
  const day = multi ? wsShort(it.day) + (it.dayEnd && it.dayEnd !== it.day && it.dayEnd > it.day ? "–" + wsShort(it.dayEnd) : "") : "";
  return [day, it.time].filter(Boolean).join(" ");
}
function wsRowText(it, range) {
  const parts = [];
  const when = wsWhen(it, range);
  if (when) parts.push(when);
  parts.push(((it.code ? it.code + " " : "") + it.name).trim() + " (" + wsTypeInfo(it.type).th + ")");
  if (it.province) parts.push(it.province);
  if (it.who) parts.push(it.who);
  if (it.sub) parts.push(it.sub);
  if (it.status && it.status.th) parts.push(it.status.th);
  const rep = it.reports ? it.reports.filter((d) => d >= range.start && d <= range.end).length : 0;
  if (rep) parts.push("รายงานหน้างาน " + rep + " วัน");
  if (it.n > 1) parts.push("×" + it.n + " รายการ");
  let line = parts.join(" · ");
  if (it.note) line += " ⚠ " + it.note;
  return line;
}
function wsFullText(items, period, range, type) {
  const P = WS_PERIODS.find((p) => p.key === period) || WS_PERIODS[0];
  const lines = ["📋 สรุปรายงาน" + P.title + " " + wsRangeLabel(period, range) + (type !== "all" ? " — " + wsTypeInfo(type).th : "")];
  WS_KINDS.forEach((k) => {
    lines.push("• " + k.doneTh + " " + wsCount(items, range, type, k.key, "done") + " บ้าน · " + k.planTh + " " + wsCount(items, range, type, k.key, "plan") + " บ้าน");
  });
  if (type === "all") {
    lines.push("");
    lines.push("แยกประเภท (ทำแล้ว/นัดหมาย)");
    wsTypes().forEach((t) => {
      lines.push("  " + t.th + ": " + WS_KINDS.map((k) => k.th + " " + wsCount(items, range, t.key, k.key, "done") + "/" + wsCount(items, range, t.key, k.key, "plan")).join(" · "));
    });
  }
  WS_KINDS.forEach((k) => {
    WS_BUCKETS.forEach((b) => {
      const sel = wsSelect(items, range, type, k.key, b.key);
      if (!sel.rows.length) return;
      lines.push("");
      lines.push("【 " + (b.key === "done" ? k.doneTh : k.planTh) + " (" + sel.houses + " บ้าน) 】");
      sel.rows.forEach((it) => lines.push("  • " + wsRowText(it, range)));
    });
  });
  return lines.join("\n");
}
function wsCopy(text, done) {
  const fallback = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      done && done(true);
    } catch (e) { done && done(false); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done && done(true), fallback);
  else fallback();
}
function wsDownload(text, name) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── ชิ้นส่วนหน้าจอ ── */
const WS_BTN = (extra) => Object.assign({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: "1px solid var(--border-strong)",
  background: "var(--surface2)", color: "var(--text-2)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
}, extra || {});

function WsPill({ status }) {
  if (!status || !status.th) return null;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.color + "1A", padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>
      {status.th}
    </span>
  );
}

function WsRow({ it, range, onOpen }) {
  const click = it.job && onOpen ? () => onOpen(it.job) : null;
  const when = wsWhen(it, range);
  const rep = it.reports ? it.reports.filter((d) => d >= range.start && d <= range.end).length : 0;
  const meta = [it.province, it.who, it.sub].filter(Boolean).join(" · ");
  const T = wsTypeInfo(it.type);
  const Tag = click ? "button" : "div";
  return (
    <Tag onClick={click || undefined} title={click ? "เปิดใบงาน" : undefined}
      style={{ display: "flex", gap: 12, alignItems: "flex-start", width: "100%", textAlign: "left", padding: "10px 12px",
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontFamily: "inherit",
        cursor: click ? "pointer" : "default", color: "inherit" }}
      onMouseEnter={click ? (e) => { e.currentTarget.style.background = "var(--surface2)"; } : undefined}
      onMouseLeave={click ? (e) => { e.currentTarget.style.background = "var(--surface)"; } : undefined}>
      <span style={{ width: 3, alignSelf: "stretch", borderRadius: 99, background: T.color, flexShrink: 0 }} />
      <div style={{ width: 64, flexShrink: 0, fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600, color: when ? "var(--text-2)" : "var(--text-3)", lineHeight: 1.4, paddingTop: 1 }}>
        {when || "—"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {it.code && <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{it.code}</span>}
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: T.color, background: T.color + "1A", padding: "2px 7px", borderRadius: 6 }}>{T.th}</span>
          {it.n > 1 && <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", fontFamily: "var(--mono)" }}>×{it.n}</span>}
        </div>
        {(meta || rep > 0) && (
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3, lineHeight: 1.45 }}>
            {meta}{rep > 0 && <span style={{ color: "#84CC16", fontWeight: 700 }}>{meta ? " · " : ""}รายงานหน้างาน {rep} วัน</span>}
          </div>
        )}
        {it.note && <div style={{ fontSize: 12, color: "var(--tint-red-tx2)", marginTop: 3, lineHeight: 1.45 }}>⚠ {it.note}</div>}
      </div>
      <WsPill status={it.status} />
    </Tag>
  );
}

function WsList({ title, color, sel, range, onOpen }) {
  return (
    <div className="pnl" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: color, flexShrink: 0, alignSelf: "center" }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{title}</span>
        <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: sel.houses ? "var(--text-1)" : "var(--text-3)", letterSpacing: "-.02em" }}>{sel.houses}</span>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>บ้าน{sel.items > sel.houses ? " · " + sel.items + " รายการ" : ""}</span>
      </div>
      {sel.rows.length === 0
        ? <div style={{ padding: "14px 0 6px", fontSize: 12.5, color: "var(--text-3)", textAlign: "center" }}>ไม่มีรายการ</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{sel.rows.map((it) => <WsRow key={it.key} it={it} range={range} onOpen={onOpen} />)}</div>}
    </div>
  );
}

/* ตารางตัวเลข "รวม + แยกประเภท" — แถว = ชนิดงาน × ทำแล้ว/นัดหมาย · คอลัมน์ = รวม · งานบ้าน · Tesla · โครงการ */
function WsMatrix({ items, range, type, onType }) {
  const cols = [{ key: "all", th: "รวม", color: "var(--primary)" }].concat(wsTypes());
  return (
    <div className="pnl" style={{ padding: 0, overflow: "hidden" }}>
      <div className="pnl-hd" style={{ padding: "14px 18px 10px" }}>
        <span className="t">รวม · แยกประเภทงาน</span>
        <span className="s">นับเป็นบ้าน (ไซต์ไม่ซ้ำ) · กดหัวคอลัมน์เพื่อกรองรายละเอียดด้านล่าง</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="ws-table">
          <thead>
            <tr>
              <th />
              {cols.map((c) => (
                <th key={c.key} className={type === c.key ? "hi" : ""} onClick={() => onType(c.key)} style={{ cursor: "pointer" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: c.color }} />{c.th}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WS_KINDS.map((k) => WS_BUCKETS.map((b, bi) => (
              <tr key={k.key + b.key}>
                <td style={{ fontWeight: bi ? 500 : 700, color: bi ? "var(--text-2)" : "var(--text-1)", paddingLeft: 18 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: bi ? "transparent" : k.color, flexShrink: 0 }} />
                    {bi ? k.planTh : k.doneTh}
                  </span>
                </td>
                {cols.map((c) => {
                  const n = wsCount(items, range, c.key, k.key, b.key);
                  return <td key={c.key} className={"num" + (n ? "" : " zero") + (type === c.key ? " hi" : "")}>{n}</td>;
                })}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ตารางย่อยตามวัน (มุมมองสัปดาห์) / ตามสัปดาห์ (มุมมองเดือน) */
function WsBreakdown({ items, period, range, type }) {
  const subs = wsSubRanges(period, range);
  if (!subs.length) return null;
  const today = wsToday();
  return (
    <div className="pnl" style={{ padding: 0, overflow: "hidden" }}>
      <div className="pnl-hd" style={{ padding: "14px 18px 10px" }}>
        <span className="t">{period === "week" ? "รายวันในสัปดาห์" : "รายสัปดาห์ในเดือน"}</span>
        <span className="s">{type === "all" ? "ทุกประเภท" : wsTypeInfo(type).th} · ทำแล้ว / นัดหมาย</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="ws-table">
          <thead>
            <tr>
              <th />
              {WS_KINDS.map((k) => (
                <th key={k.key} colSpan={2}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: k.color }} />{k.th}</span>
                </th>
              ))}
            </tr>
            <tr>
              <th />
              {WS_KINDS.map((k) => WS_BUCKETS.map((b) => <th key={k.key + b.key} style={{ fontWeight: 600, color: "var(--text-3)", paddingTop: 0 }}>{b.th}</th>))}
            </tr>
          </thead>
          <tbody>
            {subs.map((r) => {
              const isToday = today >= r.start && today <= r.end;
              return (
                <tr key={r.start} style={isToday ? { background: "var(--primary-soft)" } : undefined}>
                  <td style={{ paddingLeft: 18, fontWeight: isToday ? 800 : 600, color: isToday ? "var(--primary-dark)" : "var(--text-1)" }}>{r.th}{isToday ? " · วันนี้" : ""}</td>
                  {WS_KINDS.map((k) => WS_BUCKETS.map((b) => {
                    const n = wsCount(items, r, type, k.key, b.key);
                    return <td key={k.key + b.key} className={"num" + (n ? "" : " zero")}>{n}</td>;
                  }))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const wsNoStore = () => ({});

function SummaryView({ jobs, appts, leads, onOpen }) {
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  const [period, setPeriodRaw] = React.useState(() => {
    try { const v = localStorage.getItem("pg-ws-period"); return WS_PERIODS.some((p) => p.key === v) ? v : "day"; } catch (e) { return "day"; }
  });
  const setPeriod = (p) => { try { localStorage.setItem("pg-ws-period", p); } catch (e) { /* โหมดส่วนตัว */ } setPeriodRaw(p); };
  const [anchor, setAnchor] = React.useState(wsToday);
  const [type, setType] = React.useState("all");
  const [copied, setCopied] = React.useState(false);
  const [showText, setShowText] = React.useState(false);

  /* แหล่งข้อมูลบริการและรายงานประจำวัน — เปิดฟังเฉพาะตอนอยู่หน้านี้ (hook ถอดตัวเองตอนออกจากหน้า)
     ไม่ผ่าน useOmAlerts ของแอป เพราะตัวนั้นเปิดเฉพาะคนที่มีสิทธิ์งานบริการ แต่หัวหน้าที่ดูสรุปต้องเห็นตัวเลขบริการเสมอ */
  const omSites  = (window.useOmSites || wsNoStore)();
  const omClean  = (window.useOmCleanVisits || wsNoStore)();
  const omTicket = (window.useOmTickets || wsNoStore)();
  const omVisit  = (window.useOmVisits || wsNoStore)();
  const daily    = (window.useDailyAll || wsNoStore)();

  const items = React.useMemo(() => wsBuildItems({
    jobs: jobs, appts: appts, leads: leads,
    sites: omSites.sites || [], cleanAll: omClean.all || [], tickets: omTicket.tickets || [], visits: omVisit.visits || [],
    dailyAll: daily.all || {},
  }), [jobs, appts, leads, omSites.sites, omClean.all, omTicket.tickets, omVisit.visits, daily.all]);

  const range = React.useMemo(() => wsRange(period, anchor), [period, anchor]);
  const P = WS_PERIODS.find((p) => p.key === period) || WS_PERIODS[0];
  const isCurrent = wsToday() >= range.start && wsToday() <= range.end;
  const fullText = React.useMemo(() => wsFullText(items, period, range, type), [items, period, range, type]);
  const copyAll = () => wsCopy(fullText, (ok) => { if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); } });

  const navBtn = (extra) => Object.assign({ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)",
    cursor: "pointer", display: "grid", placeItems: "center", color: "var(--text-2)", flexShrink: 0 }, extra || {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── แถบเลือกช่วง ── */}
      <div className="pnl" style={{ padding: isMobile ? 14 : "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Segmented value={period} onChange={setPeriod} options={WS_PERIODS.map((p) => ({ value: p.key, label: p.th }))} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setAnchor(wsShift(period, anchor, -1))} title="ช่วงก่อนหน้า" aria-label="ช่วงก่อนหน้า" style={navBtn()}>
              <Icon name="chevronRight" size={16} color="var(--text-2)" style={{ transform: "rotate(180deg)" }} />
            </button>
            <button onClick={() => setAnchor(wsShift(period, anchor, 1))} title="ช่วงถัดไป" aria-label="ช่วงถัดไป" style={navBtn()}>
              <Icon name="chevronRight" size={16} color="var(--text-2)" />
            </button>
            {!isCurrent && (
              <button onClick={() => setAnchor(wsToday())} style={WS_BTN({ padding: "7px 11px", background: "var(--primary-soft)", color: "var(--primary-dark)", border: "1px solid var(--primary)" })}>
                กลับมาวันนี้
              </button>
            )}
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)" }}>
            ไปที่วัน
            <input type="date" value={anchor} onChange={(e) => { if (e.target.value) setAnchor(e.target.value); }}
              style={{ padding: "6px 9px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 12.5 }} />
          </label>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowText((v) => !v)} style={WS_BTN()}>
              <Icon name="eye" size={15} color="var(--text-2)" /> {showText ? "ซ่อนข้อความ" : "ดูข้อความ"}
            </button>
            {!isMobile && (
              <button onClick={() => wsDownload(fullText, "สรุปรายงาน-" + range.start + (range.end !== range.start ? "_" + range.end : "") + ".txt")} style={WS_BTN()}>
                <Icon name="download" size={15} color="var(--text-2)" /> .txt
              </button>
            )}
            <button onClick={copyAll} style={WS_BTN({ background: copied ? "var(--primary-dark)" : "var(--primary)", color: "#fff", border: "none" })}>
              <Icon name={copied ? "check" : "file"} size={15} color="#fff" /> {copied ? "คัดลอกแล้ว ✓" : "คัดลอกส่ง LINE"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--text-3)" }}>สรุปรายงาน{P.title}</span>
          <span style={{ fontFamily: "var(--display)", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.02em" }}>{wsRangeLabel(period, range)}</span>
          {isCurrent && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--primary-dark)", background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 99 }}>{period === "day" ? "วันนี้" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้"}</span>}
        </div>
        {/* ชิปประเภทงาน — กรองตัวเลขใหญ่กับรายละเอียด (ตารางแยกประเภทแสดงทุกคอลัมน์เสมอ) */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {[{ key: "all", th: "รวมทุกประเภท", color: "var(--primary)" }].concat(wsTypes()).map((t) => {
            const on = type === t.key;
            return (
              <button key={t.key} onClick={() => setType(t.key)}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 13px", borderRadius: 99, fontFamily: "inherit",
                  border: "1px solid " + (on ? t.color : "transparent"), background: on ? t.color + "18" : "var(--surface2)",
                  color: on ? t.color : "var(--text-2)", fontSize: 12.5, fontWeight: on ? 800 : 600, cursor: "pointer" }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: t.color }} />{t.th}
              </button>
            );
          })}
        </div>
      </div>

      {showText && (
        <textarea readOnly value={fullText} onFocus={(e) => e.target.select()}
          style={{ width: "100%", minHeight: 240, padding: 14, borderRadius: 12, border: "1px solid var(--border-strong)", boxSizing: "border-box",
            background: "var(--surface2)", color: "var(--text-1)", fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.6, resize: "vertical", outline: "none" }} />
      )}

      {/* ── ตัวเลขใหญ่: สามชนิดงาน × ทำแล้ว/นัดหมาย ── */}
      <div className="ws-kinds">
        {WS_KINDS.map((k) => (
          <div key={k.key} className="pnl" style={{ padding: isMobile ? 14 : 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 28, height: 28, borderRadius: 9, background: k.color + "1A", display: "grid", placeItems: "center" }}>
                <Icon name={k.icon} size={15} color={k.color} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{k.th}</span>
              <span style={{ fontSize: 11.5, color: "var(--text-3)", marginLeft: "auto" }}>{type === "all" ? "ทุกประเภท" : wsTypeInfo(type).th}</span>
            </div>
            <div style={{ display: "flex", gap: 0, marginTop: 14 }}>
              {WS_BUCKETS.map((b, i) => {
                const n = wsCount(items, range, type, k.key, b.key);
                return (
                  <div key={b.key} style={{ flex: 1, minWidth: 0, padding: i ? "0 0 0 16px" : "0 16px 0 0", borderLeft: i ? "1px solid var(--border)" : "none" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 650, color: "var(--text-2)" }}>{b.key === "done" ? k.doneTh : k.planTh}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
                      <span style={{ fontFamily: "var(--display)", fontSize: isMobile ? 30 : 36, fontWeight: 700, lineHeight: 1, letterSpacing: "-.035em",
                        fontVariantNumeric: "tabular-nums", color: n ? "var(--text-1)" : "var(--text-3)" }}>{n}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>บ้าน</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <WsMatrix items={items} range={range} type={type} onType={setType} />
      <WsBreakdown items={items} period={period} range={range} type={type} />

      {/* ── รายละเอียดว่างานไหนบ้าง ── */}
      {WS_KINDS.map((k) => (
        <div key={k.key} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px", marginTop: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: 99, background: k.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".03em", color: k.color }}>{k.th}</span>
            <span style={{ flex: 1, height: 1, background: "var(--border)", marginLeft: 4 }} />
          </div>
          <div className="ws-lists">
            {WS_BUCKETS.map((b) => (
              <WsList key={b.key} title={b.key === "done" ? k.doneTh : k.planTh} color={b.color}
                sel={wsSelect(items, range, type, k.key, b.key)} range={range} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { SummaryView, wsBuildItems, wsSelect, wsCount, wsRange, wsShift, wsSubRanges, wsRangeLabel, wsFullText, wsTypeOf, WS_KINDS, WS_PERIODS });
