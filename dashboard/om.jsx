/* ============================================================
   flash+solar — งานบริการหลังการขาย (O&M)

   ระบบเดิมจบที่ขั้น "เสร็จสิ้น" พองานติดตั้งเสร็จแล้วไม่มีอะไรตามต่อ
   ไฟล์นี้คือทะเบียนไซต์ที่อยู่ในสัญญาบริการ: ระยะประกันแยกรายการ · รอบล้างแผง
   · ใบแจ้งซ่อม/เคลม · ใบรายงานเข้าบริการ

   ── คีย์ของไซต์ ──
   งานของเราใช้ job.id ตรง ๆ (= รหัสงาน SF-2437) จะได้ไม่ต้องมีตารางเชื่อม
   ไซต์ที่เราไม่ได้ติดตั้งเอง (รับดูแลต่อ) ใช้รหัสของเรา OMX-0001
   เก็บแยกจาก jobs/ เพราะ useJobStore ฟังทั้งต้นไม้ jobs และทุกหน้าถือมันอยู่
   ยัดข้อมูลบริการลงไปในใบงาน = ทุกหน้าจ่ายค่าโหลดฟรี ๆ
   และภาระประกันต้องอยู่ต่อแม้ใบงานจะถูกลบทิ้งไปแล้ว

   ── แยกของหนักออกจากของเบา (กฎเดียวกับรายงานประจำวัน) ──
     omSites/{siteId}                    = ทะเบียนไซต์ (เบา — หน้าภาพรวมอ่านทั้งก้อน)
     omCleanVisits/{siteId}/{visitId}    = นัด/ประวัติล้างแผง (เบา)
     omTickets/{ticketId}                = ใบแจ้งซ่อม (เบา · แบน ไม่ซ้อนใต้ไซต์
                                           เพราะหน้าหลักดูรวมทุกไซต์อยู่แล้ว)
     omVisits/{visitId}                  = ใบรายงานเข้าบริการ (เบา)
     omVisitPhotos/{visitId}/{id}        = รูป base64 (หนัก — โหลดเฉพาะใบที่เปิด)
     omTicketPhotos/{ticketId}/{id}      = รูปที่ลูกค้าส่งมา (หนัก)
     omVisitSigns/{visitId}/{slot}       = ลายเซ็น PNG (หนัก) slot = tech | cust
     userSigns/{userId}                  = ลายเซ็นประจำตัว ใช้ของเดิมร่วมกับรายงานประจำวัน

   ── ปีไทย ──
   ทุกฟังก์ชันคำนวณในไฟล์นี้รับ-คืนเป็น ค.ศ. (YYYY-MM-DD) เท่านั้น
   แปลงเป็น พ.ศ. ตอนแสดงผลด้วย drDateTH เท่านั้น ห้ามคำนวณด้วยปี พ.ศ. เด็ดขาด

   ตั้งชื่อ top-level ขึ้นต้นด้วย om/Om/OM เพราะทุกไฟล์โหลดเป็นสคริปต์ธรรมดา
   (ชื่อระดับบนสุดอยู่ scope เดียวกันหมด ชนเมื่อไหร่ = ทั้งเว็บพัง)
   ============================================================ */

/* ── โหมดทดสอบ ──
   ตั้ง localStorage.om_test_root = "_sandbox/" แล้วรีโหลด — ข้อมูลทุกอย่างของโมดูลนี้
   จะไปอยู่ใต้ _sandbox/ ไม่แตะข้อมูลจริง ใช้ตอนตรวจงานแล้วลบทิ้งทีเดียว
   ค่าปกติต้องเป็นค่าว่างเสมอ */
const OM_ROOT = (() => { try { return localStorage.getItem("om_test_root") || ""; } catch (e) { return ""; } })();
const _OMFB = () => !!window.FBDB;
const _omRef = (p) => window.FBDB.ref(OM_ROOT + p);

/* ── วันที่ ──
   ตัวช่วยพื้นฐาน (drISO/drToday/drAddDays/drDateTH/drShort/drPad2/drStamp) ใช้ของรายงานประจำวัน
   ไฟล์นี้เพิ่มแค่สองตัวที่ของเดิมไม่มี */

/* บวกเดือนแบบหนีบสิ้นเดือน — 31 ม.ค. + 1 เดือน = 28 ก.พ. ไม่ใช่ 3 มี.ค.
   ถ้าปล่อยให้ Date เลื่อนเอง รอบล้างแผงจะค่อย ๆ เพี้ยนไปทุกปี */
function omAddMonths(iso, n) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + (n || 0));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return window.drISO(d);
}

/* จำนวนวันจาก a ถึง b (บวก = b อยู่หลัง a) */
function omDiffDays(a, b) {
  if (!a || !b) return 0;
  const x = new Date(a + "T00:00:00").getTime();
  const y = new Date(b + "T00:00:00").getTime();
  if (isNaN(x) || isNaN(y)) return 0;
  return Math.round((y - x) / 86400000);
}

/* ── ค่าคงที่ ── */

/* ประกันตั้งต้น — ตรงกับข้อความในใบเสนอราคา (QUOTE_WARRANTY_DEF ใน sales.jsx)
   แต่เก็บเป็นข้อมูลจริง มีวันเริ่ม-วันหมด ไม่ใช่ตัวหนังสือลอย ๆ */
const OM_WARRANTY_DEF = [
  { kind: "install",  label: "งานติดตั้ง",        years: 5 },
  { kind: "panel",    label: "แผงโซลาร์เซลล์",     years: 15 },
  { kind: "inverter", label: "อินเวอร์เตอร์",      years: 5 },
];
const OM_WARRANTY_KIND = [
  { key: "install",  th: "งานติดตั้ง",       color: "#1B9B75" },
  { key: "panel",    th: "แผงโซลาร์เซลล์",    color: "#0A4D68" },
  { key: "inverter", th: "อินเวอร์เตอร์",     color: "#148080" },
  { key: "battery",  th: "แบตเตอรี่",         color: "#7C5CFC" },
  { key: "other",    th: "อื่น ๆ",            color: "#64748B" },
];
const OM_WARRANTY_KIND_BY = {};
OM_WARRANTY_KIND.forEach((k) => { OM_WARRANTY_KIND_BY[k.key] = k; });

/* เตือนล่วงหน้ากี่วันก่อนประกันหมด — 90 วันพอให้คุยเรื่องต่อสัญญาบริการทัน */
const OM_WARN_DAYS = 90;
/* รอบล้างแผงตั้งต้น และจำนวนครั้งที่ล้างฟรีตามสัญญามาตรฐาน */
const OM_CLEAN_EVERY = 6;
const OM_CLEAN_FREE = 3;
/* เตือนก่อนถึงรอบล้างกี่วัน */
const OM_CLEAN_SOON = 30;

const OM_WARRANTY_STATE = {
  active:  { key: "active",  th: "อยู่ในประกัน",    color: "#10B981" },
  soon:    { key: "soon",    th: "ใกล้หมดประกัน",   color: "#F59E0B" },
  expired: { key: "expired", th: "หมดประกันแล้ว",   color: "#EF4444" },
  none:    { key: "none",    th: "ยังไม่ระบุประกัน", color: "#94A3B8" },
};

/* ── ประกัน ── */

/* วันหมดประกัน = วันเริ่ม + อายุ แล้วถอยหนึ่งวัน
   (เริ่ม 1 ม.ค. 2569 ประกัน 5 ปี = คุ้มถึง 31 ธ.ค. 2573 ไม่ใช่ 1 ม.ค. 2574) */
function omWarrantyEnd(w) {
  if (!w || !w.start) return "";
  const mon = (Number(w.years) || 0) * 12 + (Number(w.months) || 0);
  if (!mon) return "";
  return window.drAddDays(omAddMonths(w.start, mon), -1);
}

function omWarrantyState(w, today) {
  const t = today || window.drToday();
  const end = omWarrantyEnd(w);
  if (!end) return Object.assign({ end: "", days: 0 }, OM_WARRANTY_STATE.none);
  const days = omDiffDays(t, end);          /* เหลืออีกกี่วัน (ติดลบ = หมดแล้ว) */
  if (days < 0) return Object.assign({ end, days }, OM_WARRANTY_STATE.expired);
  if (days <= OM_WARN_DAYS) return Object.assign({ end, days }, OM_WARRANTY_STATE.soon);
  return Object.assign({ end, days }, OM_WARRANTY_STATE.active);
}

/* ข้อความ "เหลืออีก ..." แบบคนอ่านเข้าใจ — เกินปีบอกเป็นปี เหลือน้อยบอกเป็นวัน */
function omDaysTH(state) {
  if (!state || state.key === "none") return "—";
  const d = state.days;
  if (state.key === "expired") return "หมดแล้ว " + Math.abs(d) + " วัน";
  if (d >= 365) {
    const y = Math.floor(d / 365);
    const m = Math.floor((d - y * 365) / 30);
    return "เหลือ " + y + " ปี" + (m ? " " + m + " เดือน" : "");
  }
  if (d >= 60) return "เหลือ " + Math.floor(d / 30) + " เดือน";
  return "เหลือ " + d + " วัน";
}
const omWarrantyLeftTH = (w, today) => omDaysTH(omWarrantyState(w, today));

const omWarrantyList = (site) => {
  const w = (site || {}).warranties || {};
  return Object.keys(w).map((k) => Object.assign({ id: k }, w[k]))
    .sort((a, b) => String(a.label || "").localeCompare(String(b.label || ""), "th"));
};

/* สถานะรวมของไซต์ = อันที่แย่ที่สุด (หมดแล้ว > ใกล้หมด > ปกติ)
   ใช้ทำป้ายในรายการไซต์ ให้เห็นตั้งแต่ยังไม่เปิดเข้าไปดู */
function omSiteWarrantyState(site, today) {
  const list = omWarrantyList(site);
  if (!list.length) return Object.assign({ end: "", days: 0 }, OM_WARRANTY_STATE.none);
  const rank = { expired: 3, soon: 2, active: 1, none: 0 };
  let worst = null;
  list.forEach((w) => {
    const st = omWarrantyState(w, today);
    if (!worst || rank[st.key] > rank[worst.key]) worst = st;
  });
  return worst;
}

/* หมวดปัญหา → รายการประกันที่ควรอ้าง ใช้เดาว่าเคสนี้อยู่ในประกันหรือคิดเงิน
   (เดาให้เฉย ๆ คนตัดสินใจจริงยังกดเปลี่ยนได้เสมอ) */
const OM_CAT_TO_KIND = { inverter: "inverter", panel: "panel", mount: "install", wiring: "install", leak: "install" };
function omCoverOf(site, category, today) {
  const kind = OM_CAT_TO_KIND[category];
  if (!kind) return { cover: "unknown", wid: "", note: "" };
  const w = omWarrantyList(site).find((x) => x.kind === kind);
  if (!w) return { cover: "unknown", wid: "", note: "ไม่มีรายการประกัน " + (OM_WARRANTY_KIND_BY[kind] || {}).th };
  const st = omWarrantyState(w, today);
  if (st.key === "expired") return { cover: "charge", wid: w.id, note: (w.label || "") + " หมดประกันแล้วเมื่อ " + window.drShort(st.end) };
  if (st.key === "none") return { cover: "unknown", wid: w.id, note: "ยังไม่ได้ระบุวันเริ่มประกัน" };
  return { cover: "warranty", wid: w.id, note: (w.label || "") + " คุ้มครองถึง " + window.drShort(st.end) };
}

/* ── รอบล้างแผง ──
   ค่าตั้งต้นเขียนลงไซต์ตั้งแต่ขึ้นทะเบียน จะได้ไม่ต้องย้ายข้อมูลทีหลัง */
const omBlankClean = (comDate) => ({
  on: true, everyMon: OM_CLEAN_EVERY, freeCount: OM_CLEAN_FREE,
  firstDue: comDate ? omAddMonths(comDate, OM_CLEAN_EVERY) : "", price: null, note: "",
});

const OM_CLEAN_STATUS = {
  planned:  { key: "planned",  th: "ถึงรอบแล้ว",   color: "#F59E0B" },
  booked:   { key: "booked",   th: "จองคิวแล้ว",   color: "#0EA5E9" },
  done:     { key: "done",     th: "ล้างแล้ว",     color: "#10B981" },
  skipped:  { key: "skipped",  th: "ข้ามรอบนี้",   color: "#94A3B8" },
  canceled: { key: "canceled", th: "ยกเลิก",       color: "#94A3B8" },
};
const omCleanStatusOf = (k) => OM_CLEAN_STATUS[k] || OM_CLEAN_STATUS.planned;
/* นัดที่ยัง "มีชีวิต" — ยกเลิก/ข้ามแล้วไม่นับเป็นคิวค้าง */
const omCleanLive = (v) => !!v && v.status !== "canceled" && v.status !== "skipped";

const omCleanDone = (visits) => (visits || []).filter((v) => v && v.status === "done" && v.date).sort((a, b) => a.date < b.date ? -1 : 1);
const omLastClean = (visits) => { const d = omCleanDone(visits); return d.length ? d[d.length - 1].date : ""; };
/* โควตาล้างฟรี — นับเฉพาะครั้งที่ล้างเสร็จแล้วและติ๊กว่าเป็นครั้งฟรี */
const omFreeUsed = (visits) => omCleanDone(visits).filter((v) => v.free).length;
const omFreeLeft = (site, visits) => Math.max(0, (((site || {}).clean || {}).freeCount || 0) - omFreeUsed(visits));

/* คิวที่ยังไม่ปิด (จองไว้หรือถึงรอบแล้ว) — เอาอันที่ใกล้ที่สุด */
function omOpenVisit(visits) {
  const open = (visits || []).filter((v) => omCleanLive(v) && v.status !== "done");
  open.sort((a, b) => String(a.due || a.date || "") < String(b.due || b.date || "") ? -1 : 1);
  return open[0] || null;
}

/* ครบรอบครั้งถัดไปเมื่อไหร่
   มีคิวเปิดอยู่ → ใช้วันของคิวนั้น · เคยล้างแล้ว → ล้างล่าสุด + รอบ · ยังไม่เคย → วันครบรอบแรก */
function omNextCleanDue(site, visits) {
  const c = (site || {}).clean || {};
  if (!c.on) return "";
  const open = omOpenVisit(visits);
  if (open) return open.date || open.due || "";
  const last = omLastClean(visits);
  if (last) return omAddMonths(last, c.everyMon || OM_CLEAN_EVERY);
  return c.firstDue || (site.comDate ? omAddMonths(site.comDate, c.everyMon || OM_CLEAN_EVERY) : "");
}

/* สถานะรอบล้างของไซต์ — off / booked / overdue / due / soon / ok */
function omCleanState(site, visits, today) {
  const t = today || window.drToday();
  const c = (site || {}).clean || {};
  if (!c.on) return { key: "off", th: "ไม่อยู่ในรอบล้าง", color: "#94A3B8", due: "", days: 0 };
  const due = omNextCleanDue(site, visits);
  if (!due) return { key: "off", th: "ยังไม่ได้ตั้งรอบ", color: "#94A3B8", due: "", days: 0 };
  const days = omDiffDays(t, due);                       /* เหลืออีกกี่วัน (ติดลบ = เลยมาแล้ว) */
  const open = omOpenVisit(visits);
  if (open && open.status === "booked") return { key: "booked", th: "จองคิวแล้ว", color: "#0EA5E9", due, days };
  if (days < -7) return { key: "overdue", th: "เลยกำหนดล้าง", color: "#EF4444", due, days };
  if (days <= 0) return { key: "due", th: "ถึงรอบล้างแล้ว", color: "#F59E0B", due, days };
  if (days <= OM_CLEAN_SOON) return { key: "soon", th: "ใกล้ถึงรอบล้าง", color: "#F59E0B", due, days };
  return { key: "ok", th: "ยังไม่ถึงรอบ", color: "#10B981", due, days };
}

/* ข้ามรอบไปกี่ครั้งแล้ว — เลยกำหนดมานานกว่าหนึ่งรอบเต็มถือว่าตกไปหนึ่งครั้ง
   ใช้บอกไซต์ที่ถูกลืมจริง ๆ แยกจากไซต์ที่แค่เลยกำหนดไม่กี่วัน */
function omCleanBacklog(site, visits, today) {
  const st = omCleanState(site, visits, today);
  if (st.key !== "overdue") return 0;
  const every = ((site || {}).clean || {}).everyMon || OM_CLEAN_EVERY;
  return Math.max(1, Math.floor(-st.days / Math.max(1, every * 30.4)) + 1);
}

/* รายการทั้งหมดที่จะขึ้นบนปฏิทินล้างแผง
   นัดจริงที่บันทึกไว้ + "วันครบรอบ" ของไซต์ที่ยังไม่มีใครจองคิว (virtual = true)
   วันครบรอบคำนวณสด ไม่เขียนลงฐานข้อมูล ไม่งั้นทุกไซต์จะมีใบนัดผีเต็มไปหมด
   ใบจะเกิดจริงตอนคนกดจองคิวเท่านั้น */
function omCleanAgenda(sites, bySite, today) {
  const t = today || window.drToday();
  const out = [];
  (sites || []).forEach((s) => {
    const vs = (bySite || {})[s.id] || [];
    vs.forEach((v) => {
      if (!omCleanLive(v)) return;
      const d = v.date || v.due;
      if (d) out.push({ site: s, visit: v, date: d, virtual: false, status: v.status || "booked" });
    });
    if (!(s.clean || {}).on) return;
    if (omOpenVisit(vs)) return;                 /* มีคิวเปิดอยู่แล้ว ไม่ต้องมีวันครบรอบซ้อน */
    const due = omNextCleanDue(s, vs);
    if (due) out.push({ site: s, visit: null, date: due, virtual: true, status: omDiffDays(t, due) <= 0 ? "planned" : "planned" });
  });
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}

/* ใบนัดล้างเปล่า — free เดาจากโควตาที่เหลือ คนกดเปลี่ยนได้ */
function omBlankCleanVisit(site, due, visits, user) {
  const now = new Date().toISOString();
  return {
    id: omNewId("OC"), siteId: site.id, due: due || "", date: due || "",
    timeFrom: "09:00", timeTo: "12:00", techId: site.tech || "", status: "booked",
    free: omFreeLeft(site, visits) > 0, charge: null, visitId: null,
    note: "", doneAt: null, doneBy: null,
    createdAt: now, createdBy: (user || {}).id || null, updatedAt: now,
  };
}

/* ── รหัสไซต์ ── */
const omIsExternal = (siteId) => /^OMX-/.test(String(siteId || ""));
function omNextExtId(sites) {
  let max = 0;
  (sites || []).forEach((s) => {
    const m = /^OMX-(\d+)$/.exec(String((s || {}).id || ""));
    if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
  });
  return "OMX-" + String(max + 1).padStart(4, "0");
}
const omNewId = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ── สร้างเรคคอร์ดไซต์ ── */

/* หาวันรับมอบงานจากใบงาน — ลองตามลำดับความน่าเชื่อถือ แล้วจำไว้ว่าได้มาจากไหน
   วันเริ่มประกันที่เดาผิด = คำสัญญาที่ให้ลูกค้าผิด จึงต้องบอกให้คนยืนยันเสมอ */
function omComDateOf(job) {
  const end = window.SF.installEnd ? window.SF.installEnd(job) : "";
  if (end) return { date: end, src: "install" };
  /* hist เก็บครบทุกขั้นเสมอ แถวที่ยังไม่ถึงก็มี — เอาเฉพาะขั้นปิดงานที่เดินถึงจริงแล้ว */
  const done = ((job || {}).hist || []).find((h) => h && h.key === "done" && h.date && h.status !== "pending");
  if (done) return { date: done.date, src: "done" };
  if ((job || {}).deadline) return { date: job.deadline, src: "deadline" };
  return { date: window.drToday(), src: "manual" };
}
const OM_COMSRC_TH = {
  install: "จากวันติดตั้งเสร็จ",
  done: "จากวันที่ปิดงาน",
  deadline: "จากกำหนดส่งมอบ",
  manual: "กรอกเอง",
};
/* วันรับมอบที่ไม่ได้มาจากวันติดตั้งจริง ถือว่ายังไม่ยืนยัน ต้องขึ้นป้ายเตือน */
const omComUnsure = (site) => !!site && site.comSrc !== "install" && site.comSrc !== "confirmed";

/* แก้วันติดตั้งเสร็จ แล้วเลื่อนวันเริ่มประกันตามไปด้วย
   ประกันเริ่มนับจากวันติดตั้งเสร็จเสมอ แถวไหนที่วันเริ่มยังเท่ากับวันเดิมของไซต์
   แปลว่ายังไม่เคยถูกแก้มือ ให้ตามไปด้วย · แถวที่ตั้งวันเองไว้แล้ว (เช่น แผงที่เปลี่ยนทีหลัง)
   ต้องไม่ถูกเขียนทับ ไม่งั้นการแก้วันเดียวจะลบสิ่งที่คนตั้งใจกรอกไว้ทั้งหมด
   รอบล้างแผงครั้งแรกก็ขยับตาม ถ้ายังไม่เคยตั้งเอง */
function omSetComDate(site, date, src) {
  const old = (site || {}).comDate || "";
  const out = { comDate: date, comSrc: src || "confirmed" };
  const w = Object.assign({}, (site || {}).warranties || {});
  Object.keys(w).forEach((k) => {
    if (!w[k].start || w[k].start === old) w[k] = Object.assign({}, w[k], { start: date });
  });
  out.warranties = w;
  const c = (site || {}).clean;
  if (c && (!c.firstDue || c.firstDue === omAddMonths(old, c.everyMon || 0))) {
    out.clean = Object.assign({}, c, { firstDue: omAddMonths(date, c.everyMon || 0) });
  }
  return out;
}

function omSeedWarranties(job, comDate) {
  const out = {};
  OM_WARRANTY_DEF.forEach((d) => {
    const id = omNewId("OW");
    out[id] = { id, kind: d.kind, label: "รับประกัน" + d.label, years: d.years, months: 0, start: comDate || "", note: "" };
  });
  /* มีแบตเตอรี่ค่อยเพิ่มแถวแบตให้ ไม่งั้นทุกไซต์จะมีแถวที่ไม่เกี่ยวข้องติดมา */
  if (job && job.battery) {
    const id = omNewId("OW");
    out[id] = { id, kind: "battery", label: "รับประกันแบตเตอรี่", years: 5, months: 0, start: comDate || "", note: "" };
  }
  return out;
}

function omSiteFromJob(job, user) {
  const c = omComDateOf(job);
  const now = new Date().toISOString();
  return {
    id: job.id, source: "job", jobId: job.id, code: job.code || job.id,
    name: job.name || "", phone: job.phone || "", address: job.address || "", province: job.province || "",
    type: job.type || "home", kw: job.kw == null ? null : job.kw, panels: job.panels == null ? null : job.panels,
    brand: job.brand || "", tech: job.tech || "",
    comDate: c.date, comSrc: c.src, active: true, note: "",
    warranties: omSeedWarranties(job, c.date),
    clean: omBlankClean(c.date),
    cleanSum: { lastDate: "", doneCount: 0 },
    createdAt: now, createdBy: (user || {}).id || null, createdByName: (user || {}).name || "", updatedAt: now,
  };
}

function omBlankSite(sites, user) {
  const today = window.drToday();
  const now = new Date().toISOString();
  const id = omNextExtId(sites);
  return {
    id, source: "external", jobId: null, code: id,
    name: "", phone: "", address: "", province: "",
    type: "home", kw: null, panels: null, brand: "", tech: "",
    comDate: today, comSrc: "manual", active: true, note: "",
    warranties: omSeedWarranties(null, today),
    clean: omBlankClean(today),
    cleanSum: { lastDate: "", doneCount: 0 },
    createdAt: now, createdBy: (user || {}).id || null, createdByName: (user || {}).name || "", updatedAt: now,
  };
}

/* งานที่ติดตั้งเสร็จแล้วแต่ยังไม่ได้ขึ้นทะเบียนบริการ — คำนวณสดทุกครั้งที่เปิดหน้า
   ตั้งใจไม่ไป hook ตอนเปลี่ยนขั้นงาน เพราะงานที่เสร็จไปก่อนมีฟีเจอร์นี้จะตกหล่นหมด
   และวันเริ่มประกันต้องให้คนยืนยันก่อนเสมอ */
function omEnrollable(jobs, sites) {
  const have = {};
  (sites || []).forEach((s) => { if (s && s.id) have[s.id] = 1; });
  return (jobs || []).filter((j) => j && j.stage === "done" && !have[j.id]);
}

/* ── สรุปภาพรวม ──
   bySite = ตารางนัดล้างแยกตามไซต์ (ไม่ส่งมาก็ได้ ช่องของล้างแผงจะเป็นศูนย์) */
function omRollup(sites, bySite, today) {
  const t = today || window.drToday();
  const out = { total: 0, active: 0, warnSoon: 0, warnExpired: 0, unsure: 0, kw: 0, kwSites: 0,
    cleanDue: 0, cleanOverdue: 0, cleanBooked: 0, freeLeft: 0 };
  (sites || []).forEach((s) => {
    out.total++;
    if (s.active) out.active++;
    if (omComUnsure(s)) out.unsure++;
    if (typeof s.kw === "number" && s.kw > 0) { out.kw += s.kw; out.kwSites++; }
    const st = omSiteWarrantyState(s, t);
    if (st.key === "soon") out.warnSoon++;
    else if (st.key === "expired") out.warnExpired++;
    const vs = (bySite || {})[s.id] || [];
    const cs = omCleanState(s, vs, t);
    if (cs.key === "overdue") out.cleanOverdue++;
    else if (cs.key === "due") out.cleanDue++;
    else if (cs.key === "booked") out.cleanBooked++;
    if ((s.clean || {}).on) out.freeLeft += omFreeLeft(s, vs);
  });
  return out;
}

/* ══════════════ ใบแจ้งซ่อม / เคลมประกัน ══════════════ */

const OM_TICKET_CAT = [
  { key: "inverter", th: "อินเวอร์เตอร์",       hint: "ไฟไม่เข้า · ขึ้นรหัสผิดพลาด" },
  { key: "panel",    th: "แผงโซลาร์เซลล์",      hint: "แผงแตก · ร้อนผิดปกติ" },
  { key: "mount",    th: "โครงสร้าง/ขาตั้ง",     hint: "หลวม · สนิม · เสียงดัง" },
  { key: "wiring",   th: "ระบบไฟ/สายไฟ",        hint: "เบรกเกอร์ทริป · สายชำรุด" },
  { key: "leak",     th: "หลังคารั่ว",           hint: "รั่วตรงจุดยึด" },
  { key: "app",      th: "แอป/การมอนิเตอร์",     hint: "ดูค่าไม่ได้ · ตัวเลขไม่ตรง" },
  { key: "perf",     th: "ไฟผลิตได้น้อยลง",      hint: "หน่วยตกจากเดิม" },
  { key: "other",    th: "อื่น ๆ",              hint: "" },
];
const OM_TICKET_CAT_BY = {};
OM_TICKET_CAT.forEach((c) => { OM_TICKET_CAT_BY[c.key] = c; });

const OM_SEVERITY = [
  { key: "down",   th: "ระบบดับทั้งหมด", color: "#EF4444" },
  { key: "high",   th: "เร่งด่วน",       color: "#F59E0B" },
  { key: "normal", th: "ปกติ",           color: "#0EA5E9" },
  { key: "low",    th: "ไม่เร่ง",         color: "#94A3B8" },
];
const OM_SEVERITY_BY = {};
OM_SEVERITY.forEach((s) => { OM_SEVERITY_BY[s.key] = s; });
/* ต้องปิดเคสภายในกี่วันนับจากวันที่ลูกค้าแจ้ง — เกินแล้วขึ้นป้ายเตือน */
const OM_SLA_DAYS = { down: 1, high: 3, normal: 7, low: 14 };

const OM_COVER = {
  warranty: { key: "warranty", th: "อยู่ในประกัน",   color: "#10B981" },
  charge:   { key: "charge",   th: "คิดค่าบริการ",   color: "#F59E0B" },
  goodwill: { key: "goodwill", th: "บริการให้ฟรี",   color: "#0EA5E9" },
  unknown:  { key: "unknown",  th: "ยังไม่ได้ตัดสิน", color: "#94A3B8" },
};
const omCoverTH = (k) => OM_COVER[k] || OM_COVER.unknown;

/* ── สถานะใบแจ้งซ่อม ──
   ประกาศเป็นตารางข้อมูล ไม่ใช่ if ซ้อน — เพิ่มสถานะทีหลังจะได้ไม่ต้องไล่แก้หลายที่
   และหน้าจอสร้างปุ่มจากตารางนี้โดยตรง ปุ่มที่ขึ้นจึงเป็นทางที่เดินได้จริงเสมอ */
/* next = ขั้นถัดไปของงาน · back = ย้อนกลับเพราะกดผิด · drop = ตีตกเรื่อง
   แยกกันเพราะปุ่มเดินหน้ากับปุ่มย้อนกลับไม่ใช่ทางเลือกที่เท่ากัน
   เดิมรวมอยู่ชุดเดียว ใบที่นัดวันแล้วจึงมีปุ่ม "รับเรื่องแล้ว" โผล่มาข้างปุ่มปิดงาน
   อ่านเหมือนยังไม่ได้รับเรื่อง ทั้งที่เดินเลยขั้นนั้นไปแล้ว */
const OM_TICKET_STATUS = [
  { key: "new",       th: "แจ้งเข้ามาใหม่", color: "#7C5CFC", next: ["accepted"],  back: [],           drop: ["rejected"] },
  { key: "accepted",  th: "รับเรื่องแล้ว",  color: "#0EA5E9", next: ["scheduled"], back: ["new"],      drop: ["rejected"] },
  { key: "scheduled", th: "นัดวันเข้าแก้ไข", color: "#F59E0B", next: ["closed"],    back: ["accepted"] },
  { key: "closed",    th: "ปิดงานแล้ว",    color: "#10B981", next: [] },
  { key: "rejected",  th: "ไม่รับเรื่อง",   color: "#94A3B8", next: ["new"] },
];
const OM_TICKET_STATUS_BY = {};
OM_TICKET_STATUS.forEach((s) => { OM_TICKET_STATUS_BY[s.key] = s; });
/* เคยมีขั้น "กำลังตรวจสอบ" กับ "กำลังทำหน้างาน" แล้วตัดออกเพราะซ้ำซ้อน
   ใบเก่าที่ค้างอยู่ในสองขั้นนั้นต้องอ่านได้ต่อ ไม่ใช่เด้งกลับไปเป็น "แจ้งเข้ามาใหม่" */
const OM_TICKET_LEGACY = { triage: "accepted", onsite: "scheduled" };
const omTicketKey = (k) => OM_TICKET_LEGACY[k] || k;
const omTicketStatusOf = (k) => OM_TICKET_STATUS_BY[omTicketKey(k)] || OM_TICKET_STATUS_BY.new;
const omTicketOpen = (t) => { const k = omTicketKey((t || {}).status); return !!t && k !== "closed" && k !== "rejected"; };

/* ปิดงานแล้วย้อนไม่ได้เอง ต้องให้หัวหน้าปลดล็อก — ใบที่ปิดไปแล้วคือเอกสารที่ลูกค้ารับทราบแล้ว */
function omTicketNext(t, role) {
  const cur = omTicketStatusOf((t || {}).status);
  return (cur.next || []).map((k) => OM_TICKET_STATUS_BY[k]);
}
/* ย้อนขั้น / ตีตกเรื่อง — เป็นการแก้ที่กดผิด ไม่ใช่ขั้นถัดไปของงาน หน้าจอจึงต้องแยกปุ่มให้เห็นต่างกัน
   ปิดงานแล้วย้อนเองไม่ได้ ต้องให้หัวหน้าเปิดกลับ — ใบที่ปิดไปแล้วคือเอกสารที่ลูกค้ารับทราบแล้ว */
function omTicketBack(t, role) {
  const cur = omTicketStatusOf((t || {}).status);
  const list = (cur.back || []).concat(cur.drop || []);
  if (cur.key === "closed" && omCanApprove(role)) list.push("scheduled");
  return list.map((k) => OM_TICKET_STATUS_BY[k]);
}
const omTicketCan = (from, to, role) =>
  omTicketNext({ status: from }, role).concat(omTicketBack({ status: from }, role)).some((s) => s.key === to);

/* เดินสถานะ = คืนเรคคอร์ดใหม่พร้อมต่อประวัติ ไม่เขียนฐานข้อมูลเอง (ให้ที่เรียกเป็นคนเขียน)
   จะได้ทดสอบตรรกะได้โดยไม่ต้องมี Firebase */
function omTicketMove(t, to, user, note) {
  if (!t) return null;
  const now = new Date().toISOString();
  const rec = Object.assign({}, t, { status: to, updatedAt: now });
  rec.hist = (t.hist || []).concat([{
    at: now, from: omTicketKey(t.status) || "new", to: to,
    by: (user || {}).id || null, byName: (user || {}).name || "", note: note || "",
  }]);
  if (to === "closed") { rec.closedAt = now; rec.closedBy = (user || {}).id || null; rec.closedByName = (user || {}).name || ""; }
  else if (omTicketKey(t.status) === "closed") { rec.closedAt = null; rec.closedBy = null; rec.closedByName = ""; }
  return rec;
}

/* เกินกำหนดปิดเคสหรือยัง — นับจากวันที่ลูกค้าแจ้ง ไม่ใช่วันที่เราเพิ่งมาเปิดอ่าน */
function omTicketOverdue(t, today) {
  if (!omTicketOpen(t)) return null;
  const t0 = (t.reportedAt || "").slice(0, 10);
  if (!t0) return null;
  const limit = OM_SLA_DAYS[t.severity] != null ? OM_SLA_DAYS[t.severity] : OM_SLA_DAYS.normal;
  const age = omDiffDays(t0, today || window.drToday());
  return age > limit ? { age, limit, over: age - limit } : null;
}

/* เลขใบแจ้งซ่อม OT-YYMM-NNN — เดือนละชุด อ่านแล้วรู้ทันทีว่าเรื่องนี้แจ้งเมื่อไหร่ */
function omTicketNo(tickets, date) {
  const d = date || window.drToday();
  const pre = "OT-" + d.slice(2, 4) + d.slice(5, 7) + "-";
  let max = 0;
  (tickets || []).forEach((t) => {
    const m = new RegExp("^" + pre + "(\\d+)$").exec(String((t || {}).no || ""));
    if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
  });
  return pre + String(max + 1).padStart(3, "0");
}

function omBlankTicket(site, tickets, user) {
  const today = window.drToday();
  const now = new Date().toISOString();
  return {
    id: omNewId("OT"), no: omTicketNo(tickets, today),
    siteId: site.id, siteCode: site.code || site.id, siteName: site.name || "",
    title: "", detail: "", category: "other", severity: "normal", source: "phone",
    reportedAt: now, status: "new",
    cover: "unknown", coverNote: "", coverWid: "", quoteAmt: null,
    /* ผู้รับผิดชอบเป็น "ผู้ใช้ในระบบ" ไม่ใช่เฉพาะช่าง — งานซ่อมบางเรื่องคนดูแลคือแอดมินหรือวิศวกร
       techId ยังเก็บไว้เพื่อความเข้ากันได้กับใบเก่า (เดิมเลือกได้แค่ช่าง) */
    assigneeId: null, assigneeName: "",
    techId: site.tech || "", apptDate: "", apptFrom: "", apptTo: "",
    closedAt: null, closedBy: null, closedByName: "", closeNote: "", result: "",
    hist: [{ at: now, from: "", to: "new", by: (user || {}).id || null, byName: (user || {}).name || "", note: "เปิดเรื่อง" }],
    createdAt: now, createdBy: (user || {}).id || null, createdByName: (user || {}).name || "", updatedAt: now,
  };
}

const OM_TICKET_SOURCE = [
  { key: "phone", th: "โทรแจ้ง" }, { key: "line", th: "LINE" },
  { key: "onsite", th: "เจอตอนเข้าไซต์" }, { key: "monitor", th: "ระบบมอนิเตอร์แจ้ง" },
];

function omTicketRollup(tickets, today) {
  const t = today || window.drToday();
  const out = { open: 0, overdue: 0, down: 0, closed: 0, newly: 0 };
  (tickets || []).forEach((x) => {
    if (!omTicketOpen(x)) { if (x.status === "closed") out.closed++; return; }
    out.open++;
    if (omTicketKey(x.status) === "new") out.newly++;
    if (x.severity === "down") out.down++;
    if (omTicketOverdue(x, t)) out.overdue++;
  });
  return out;
}

/* ── สิทธิ์ ──
   แบบเดียวกับรายงานประจำวัน: ช่างเขียน หัวหน้า/แอดมินอนุมัติ แอดมินลบ
   เอกสารที่อนุมัติแล้วล็อก ไม่งั้นใบที่ลูกค้าเซ็นไปแล้วถูกแก้ย้อนหลังได้ */
const omCanWrite = (role, rec) => {
  if (!window.can(role, "om")) return false;
  return !(rec && rec.status === "approved");
};
const omCanApprove = (role) => window.hasRole(role, "lead") || window.hasRole(role, "admin");
const omCanDelete = (role) => window.hasRole(role, "admin");

/* ── ตัวเก็บข้อมูลไซต์ ──
   อ่านทั้งต้นไม้ได้เพราะรูปกับลายเซ็นอยู่คนละโหนด (ดูหมายเหตุหัวไฟล์) */
function useOmSites() {
  const [sites, setSites] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_OMFB()) { setLoading(false); return; }
    const ref = _omRef("omSites");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      setSites(Object.keys(v).map((k) => Object.assign({ id: k }, v[k])));
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  const upsert = React.useCallback((rec) => {
    if (!rec || !rec.id || !_OMFB()) return;
    _omRef("omSites/" + rec.id).set(Object.assign({}, rec, { updatedAt: new Date().toISOString() }));
  }, []);

  const patch = React.useCallback((id, fields) => {
    if (!id || !_OMFB()) return;
    _omRef("omSites/" + id).update(Object.assign({}, fields, { updatedAt: new Date().toISOString() }));
  }, []);

  /* ลบทะเบียนไซต์ = ลบนัดล้างและรูป/ลายเซ็นที่ผูกกับไซต์นั้นด้วย
     ใบแจ้งซ่อมกับใบรายงานเป็นโหนดแบน เฟสถัดไปค่อยกวาดตอนลบ */
  const remove = React.useCallback((id) => {
    if (!id || !_OMFB()) return;
    _omRef("omSites/" + id).remove();
    _omRef("omCleanVisits/" + id).remove();
  }, []);

  return { sites, loading, upsert, patch, remove };
}

/* ── ตัวเก็บนัดล้างแผง ──
   อ่านทั้งต้นไม้ทีเดียว (ปฏิทินต้องเห็นทุกไซต์พร้อมกัน) — เบา เพราะไม่มีรูปอยู่ในนี้
   คืนเป็น bySite เพื่อให้ฟังก์ชันคำนวณรอบของแต่ละไซต์หยิบไปใช้ได้ตรง ๆ */
function useOmCleanVisits() {
  const [bySite, setBySite] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_OMFB()) { setLoading(false); return; }
    const ref = _omRef("omCleanVisits");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const out = {};
      Object.keys(v).forEach((sid) => {
        const t = v[sid] || {};
        out[sid] = Object.keys(t).map((k) => Object.assign({ id: k, siteId: sid }, t[k]));
      });
      setBySite(out);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  const all = React.useMemo(() => {
    const out = [];
    Object.keys(bySite).forEach((k) => { (bySite[k] || []).forEach((v) => out.push(v)); });
    return out;
  }, [bySite]);

  const save = React.useCallback((v) => {
    if (!v || !v.id || !v.siteId || !_OMFB()) return;
    _omRef("omCleanVisits/" + v.siteId + "/" + v.id).set(Object.assign({}, v, { updatedAt: new Date().toISOString() }));
  }, []);
  const patch = React.useCallback((siteId, id, fields) => {
    if (!siteId || !id || !_OMFB()) return;
    _omRef("omCleanVisits/" + siteId + "/" + id).update(Object.assign({}, fields, { updatedAt: new Date().toISOString() }));
  }, []);
  const remove = React.useCallback((siteId, id) => {
    if (!siteId || !id || !_OMFB()) return;
    _omRef("omCleanVisits/" + siteId + "/" + id).remove();
  }, []);

  return { bySite, all, loading, save, patch, remove };
}

/* ── ตัวเก็บใบแจ้งซ่อม ──
   เก็บแบน omTickets/{id} ไม่ซ้อนใต้ไซต์ เพราะหน้าหลักดูรวมทุกไซต์เป็นหลัก
   อ่านทั้งต้นไม้ไหวถึงหลักพันใบเพราะรูปแยกไปอยู่ omTicketPhotos แล้ว
   เกินกว่านั้นค่อยเปลี่ยนเป็น query + แบ่งหน้า */
function useOmTickets() {
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_OMFB()) { setLoading(false); return; }
    const ref = _omRef("omTickets");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ id: k }, v[k]));
      arr.sort((a, b) => String(b.reportedAt || "").localeCompare(String(a.reportedAt || "")));
      setTickets(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  const save = React.useCallback((t) => {
    if (!t || !t.id || !_OMFB()) return;
    _omRef("omTickets/" + t.id).set(Object.assign({}, t, { updatedAt: new Date().toISOString() }));
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (!id || !_OMFB()) return;
    _omRef("omTickets/" + id).update(Object.assign({}, fields, { updatedAt: new Date().toISOString() }));
  }, []);
  /* ลบใบ = ลบรูปที่ลูกค้าส่งมาด้วย ไม่งั้นรูปจะค้างอยู่ในฐานข้อมูลโดยไม่มีใครอ้างถึง */
  const remove = React.useCallback((id) => {
    if (!id || !_OMFB()) return;
    _omRef("omTickets/" + id).remove();
    _omRef("omTicketPhotos/" + id).remove();
  }, []);

  return { tickets, loading, save, patch, remove };
}

/* รูปของใบแจ้งซ่อม — โหนดหนัก โหลดเฉพาะใบที่เปิดอยู่
   slot = "before" (สภาพตอนแจ้ง) หรือ "after" (หลังซ่อมเสร็จ) */
function useOmTicketPhotos(ticketId) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!ticketId || !_OMFB()) { setPhotos([]); return; }
    const ref = _omRef("omTicketPhotos/" + ticketId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [ticketId]);

  const add = React.useCallback((dataUrl, slot, user) => {
    if (!ticketId || !_OMFB()) return;
    const id = "OTP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _omRef("omTicketPhotos/" + ticketId + "/" + id).set({
      id, dataUrl, slot: slot || "before", cap: "", at: new Date().toISOString(),
      by: (user || {}).id || null, byName: (user || {}).name || "",
    });
  }, [ticketId]);
  const setCap = React.useCallback((id, cap) => {
    if (!ticketId || !_OMFB()) return;
    _omRef("omTicketPhotos/" + ticketId + "/" + id).update({ cap: cap || "" });
  }, [ticketId]);
  const remove = React.useCallback((id) => {
    if (!ticketId || !_OMFB()) return;
    _omRef("omTicketPhotos/" + ticketId + "/" + id).remove();
  }, [ticketId]);

  return { photos, add, setCap, remove };
}

/* ── ใบรายงานเข้าบริการ ──
   ใบเดียวใช้ได้ทั้งงานซ่อม งานล้างแผง และงานเข้าตรวจ — ต่างกันแค่หัวเรื่องกับช่องที่ต้องกรอก
   เพราะลูกค้าเซ็นรับงานแบบเดียวกันหมด ไม่มีเหตุผลให้มีเอกสารสามแบบ
   ผูกกลับไปที่ ticketId / cleanId เพื่อให้เปิดจากใบแจ้งซ่อมหรือจากนัดล้างก็เจอใบเดียวกัน */
const OM_VISIT_KIND = [
  { key: "repair",  th: "เข้าซ่อม",        color: "#F59E0B", icon: "wrench" },
  { key: "clean",   th: "ล้างแผง",         color: "#0EA5E9", icon: "panel" },
  { key: "inspect", th: "เข้าตรวจเช็กระบบ", color: "#7C5CFC", icon: "shield" },
];
const OM_VISIT_KIND_BY = {};
OM_VISIT_KIND.forEach((k) => { OM_VISIT_KIND_BY[k.key] = k; });

/* draft = ช่างยังกรอกอยู่ · sent = ส่งให้หัวหน้าตรวจ · approved = อนุมัติแล้ว ล็อกทั้งใบ */
const OM_VISIT_STATUS = {
  draft:    { key: "draft",    th: "ร่าง",        color: "#94A3B8" },
  sent:     { key: "sent",     th: "รอตรวจ",      color: "#F59E0B" },
  approved: { key: "approved", th: "อนุมัติแล้ว", color: "#10B981" },
};
const omVisitStatusOf = (k) => OM_VISIT_STATUS[k] || OM_VISIT_STATUS.draft;

/* เลขเอกสาร FS-SV-{รหัสไซต์}-{ครั้งที่} — นับเฉพาะใบของไซต์นั้น เรียงตามวันที่เข้า
   รูปแบบเดียวกับรายงานประจำวัน (drDocNo) เพื่อให้แฟ้มเอกสารของบริษัทเป็นชุดเดียวกัน */
function omVisitDocNo(site, visits, date) {
  const code = String((site || {}).code || (site || {}).id || "SITE").replace(/^SF-/, "");
  const d = date || window.drToday();
  const n = (visits || []).filter((v) => v && String(v.date || "") <= d).length || 1;
  return "FS-SV-" + code + "-" + window.drPad2(n);
}

function omBlankVisit(site, opts, user) {
  const o = opts || {};
  const today = window.drToday();
  const now = new Date().toISOString();
  return {
    id: omNewId("SV"), no: omVisitDocNo(site, o.siteVisits, o.date || today),
    siteId: site.id, siteCode: site.code || site.id, siteName: site.name || "",
    ticketId: o.ticketId || "", cleanId: o.cleanId || "", kind: o.kind || "repair",
    date: o.date || today, timeIn: "", timeOut: "", team: o.team || site.tech || "",
    /* ใบที่ออกจากใบแจ้งซ่อมรับของที่กรอกไว้แล้วมาเลย — ช่างไม่ต้องพิมพ์เรื่องเดียวกันสองรอบ */
    found: o.found || "", work: o.work || "", parts: [], result: o.result || "", advice: "", nextDue: "",
    cover: o.cover || "unknown", charge: o.charge == null ? null : +o.charge || null,
    status: "draft", byId: (user || {}).id || null, byName: (user || {}).name || "",
    sentAt: null, appId: null, appName: "", approvedAt: null,
    createdAt: now, updatedAt: now,
  };
}

function omVisitRollup(visits) {
  const out = { total: 0, draft: 0, sent: 0, approved: 0 };
  (visits || []).forEach((v) => { out.total++; out[v.status === "sent" ? "sent" : v.status === "approved" ? "approved" : "draft"]++; });
  return out;
}

/* ── ตัวเก็บใบรายงานเข้าบริการ ── */
function useOmVisits() {
  const [visits, setVisits] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_OMFB()) { setLoading(false); return; }
    const ref = _omRef("omVisits");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ id: k }, v[k]));
      arr.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      setVisits(arr);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  const bySite = React.useMemo(() => {
    const m = {};
    visits.forEach((v) => { (m[v.siteId] = m[v.siteId] || []).push(v); });
    return m;
  }, [visits]);

  const save = React.useCallback((v) => {
    if (!v || !v.id || !_OMFB()) return;
    _omRef("omVisits/" + v.id).set(Object.assign({}, v, { updatedAt: new Date().toISOString() }));
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (!id || !_OMFB()) return;
    _omRef("omVisits/" + id).update(Object.assign({}, fields, { updatedAt: new Date().toISOString() }));
  }, []);
  /* ลบใบ = ลบรูปกับลายเซ็นด้วย ไม่งั้นของหนักค้างอยู่โดยไม่มีใครอ้างถึง */
  const remove = React.useCallback((id) => {
    if (!id || !_OMFB()) return;
    _omRef("omVisits/" + id).remove();
    _omRef("omVisitPhotos/" + id).remove();
    _omRef("omVisitSigns/" + id).remove();
  }, []);

  return { visits, bySite, loading, save, patch, remove };
}

/* รูปของใบรายงาน — โหนดหนัก โหลดเฉพาะใบที่เปิดอยู่ · slot = "before" | "after" */
function useOmVisitPhotos(visitId) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!visitId || !_OMFB()) { setPhotos([]); return; }
    const ref = _omRef("omVisitPhotos/" + visitId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [visitId]);

  const add = React.useCallback((dataUrl, slot, user) => {
    if (!visitId || !_OMFB()) return;
    const id = "SVP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _omRef("omVisitPhotos/" + visitId + "/" + id).set({
      id, dataUrl, slot: slot || "before", cap: "", at: new Date().toISOString(),
      by: (user || {}).id || null, byName: (user || {}).name || "",
    });
  }, [visitId]);
  const setCap = React.useCallback((id, cap) => {
    if (!visitId || !_OMFB()) return;
    _omRef("omVisitPhotos/" + visitId + "/" + id).update({ cap: cap || "" });
  }, [visitId]);
  const remove = React.useCallback((id) => {
    if (!visitId || !_OMFB()) return;
    _omRef("omVisitPhotos/" + visitId + "/" + id).remove();
  }, [visitId]);

  return { photos, add, setCap, remove };
}

/* ลายเซ็นของใบรายงาน — slot "tech" (ช่างผู้ให้บริการ) · "cust" (ลูกค้าผู้รับบริการ)
   โครงเดียวกับ useDailySigns ทุกประการ ลายเซ็นประจำตัวใช้ userSigns/ ร่วมกัน (useDrMySign) */
function useOmVisitSigns(visitId) {
  const [signs, setSigns] = React.useState({});
  React.useEffect(() => {
    if (!visitId || !_OMFB()) { setSigns({}); return; }
    const ref = _omRef("omVisitSigns/" + visitId);
    const h = ref.on("value", (s) => setSigns(s.val() || {}));
    return () => ref.off("value", h);
  }, [visitId]);

  const sign = React.useCallback((slot, img, user, name) => {
    if (!visitId || !_OMFB() || !img) return;
    _omRef("omVisitSigns/" + visitId + "/" + slot).set(Object.assign({ img,
      by: (user || {}).id || null, name: name || (user || {}).name || "" }, window.drStamp()));
  }, [visitId]);
  const clear = React.useCallback((slot) => {
    if (!visitId || !_OMFB()) return;
    _omRef("omVisitSigns/" + visitId + "/" + slot).remove();
  }, [visitId]);

  return { signs, sign, clear };
}

/* ลายเซ็นประจำตัวของผู้ใช้ — โหนดเดียวกับรายงานประจำวัน (userSigns/{userId})
   เซ็นเก็บไว้ครั้งเดียวแล้วใช้ได้ทุกใบ ทั้งรายงานประจำวันและใบรายงานเข้าบริการ
   ที่ต้องมีตัวนี้แทนการเรียก useDrMySign ตรง ๆ เพราะของรายงานประจำวันไม่ผ่าน OM_ROOT
   ตอนทดสอบในโหมด _sandbox/ จะเผลอเขียนทับลายเซ็นจริงของคนคนนั้น */
function useOmMySign(userId) {
  const [sign, setSign] = React.useState(null);
  React.useEffect(() => {
    if (!userId || !_OMFB()) { setSign(null); return; }
    const ref = _omRef("userSigns/" + userId);
    const h = ref.on("value", (s) => setSign(s.val() || null));
    return () => ref.off("value", h);
  }, [userId]);

  const save = React.useCallback((img) => {
    if (!userId || !_OMFB() || !img) return;
    _omRef("userSigns/" + userId).set(Object.assign({ img }, window.drStamp()));
  }, [userId]);

  return { sign, save };
}

/* ส่งแจ้งเตือนแบบเก็บเป็นเรคคอร์ด (เปิดเคสใหม่ · มอบหมายช่าง · ส่งใบรายงานให้ตรวจ)
   เขียนลง notifications/{id} รูปแบบเดียวกับ addNotif (auth.jsx) แต่ผ่าน _omRef
   เพราะโมดูลนี้ทดสอบใต้ _sandbox/ — ถ้าเรียก addNotif ตรง ๆ ทุกครั้งที่ทดสอบจะเด้งหาคนจริง
   ไม่ใช้เป็น hook เพราะต้องยิงจากตรงกลางการกดปุ่ม ไม่ใช่ตอนเรนเดอร์ */
function omNotify(n) {
  if (!_OMFB() || !n) return;
  const id = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  _omRef("notifications/" + id).set(Object.assign({ id, read: false, at: new Date().toISOString(), type: "om", event: "om" }, n));
  /* ส่งต่อเข้า LINE — ข้ามในโหมดทดสอบ (ดูเหตุผลเดียวกันที่ ecNotify ใน expense.jsx)

     ── push: false ──
     ใบที่ยังไม่มีเจ้าของ (toPerm เฉย ๆ ไม่มี toUserId) จะเด้งหาทุกคนที่มีสิทธิ์นั้น
     ซึ่งสำหรับสิทธิ์ om แปลว่าช่างทุกคน ทั้งที่ยังไม่รู้เลยว่าเป็นงานของใคร
     ⇒ ใบพวกนี้ตั้ง push: false ไว้ = เก็บเป็นเรคคอร์ดให้ขึ้นกระดิ่งในเว็บและใน LIFF
        เหมือนเดิมทุกอย่าง แต่ไม่ยิงเข้า LINE ของใคร รอจนมอบหมายแล้วค่อยเด้งเข้าคนเดียว
     ค่า push ติดไปกับเรคคอร์ดด้วย ไม่ได้กันแค่ตรงนี้ เพราะ /api/line/push ยิงซ้ำจากที่อื่น
     ได้ (cron · เรียกมือ) แล้วจะข้ามการตัดสินใจตรงนี้ไปเลย */
  if (!OM_ROOT && n.push !== false && window.lnPush) window.lnPush(id);
}

/* ══════════════ เตือนสด (ไม่เก็บลงฐานข้อมูล) ══════════════
   เลยรอบล้าง · ประกันใกล้หมด/หมดแล้ว · ใบแจ้งซ่อมเกิน SLA
   คำนวณใหม่ทุกครั้งที่ข้อมูลเปลี่ยน แบบเดียวกับ lateAlerts ของงานล่าช้า (app.jsx)
   ไม่เขียนเป็นเรคคอร์ดแจ้งเตือน เพราะสถานะพวกนี้ "หายเองได้" พอมีคนไปจัดการ
   ถ้าเก็บไว้จะกลายเป็นแจ้งเตือนซากที่กดอ่านแล้วก็ยังผิดอยู่ดี */
function omSiteAlerts(sites, bySite, tickets, today) {
  const t = today || window.drToday();
  const out = [];
  const siteBy = {};
  (sites || []).forEach((s) => { if (s && s.id) siteBy[s.id] = s; });

  (sites || []).forEach((s) => {
    if (!s || s.active === false) return;
    const vs = (bySite || {})[s.id] || [];
    const cs = omCleanState(s, vs, t);
    if (cs.key === "overdue") {
      const back = omCleanBacklog(s, vs, t);
      out.push({ key: "clean-" + s.id, kind: "clean", color: "#EF4444", icon: "panel", rank: 2,
        siteId: s.id, title: s.name || s.code || "",
        body: "เลยรอบล้างแผงมา " + (-cs.days) + " วัน" + (back > 1 ? " (ข้ามไปแล้ว " + back + " รอบ)" : ""),
        foot: "ครบรอบ " + window.drShort(cs.due), days: -cs.days });
    } else if (cs.key === "due") {
      out.push({ key: "clean-" + s.id, kind: "clean", color: "#F59E0B", icon: "panel", rank: 4,
        siteId: s.id, title: s.name || s.code || "", body: "ถึงรอบล้างแผงแล้ว ยังไม่มีใครจองคิว",
        foot: "ครบรอบ " + window.drShort(cs.due), days: -cs.days });
    }
    omWarrantyList(s).forEach((w) => {
      const st = omWarrantyState(w, t);
      if (st.key === "soon") {
        out.push({ key: "warn-" + s.id + "-" + w.id, kind: "warranty", color: "#F59E0B", icon: "shield", rank: 3,
          siteId: s.id, title: s.name || s.code || "",
          body: (w.label || "ประกัน") + " ใกล้หมด เหลืออีก " + st.days + " วัน",
          foot: "หมดประกัน " + window.drShort(st.end), days: st.days });
      }
    });
  });

  (tickets || []).forEach((x) => {
    if (!omTicketOpen(x)) return;
    const ov = omTicketOverdue(x, t);
    if (!ov) return;
    const sv = (OM_SEVERITY_BY[x.severity] || {});
    out.push({ key: "tick-" + x.id, kind: "ticket", color: "#EF4444", icon: "wrench", rank: 1,
      siteId: x.siteId, ticketId: x.id, title: (x.siteName || x.siteCode || "") + " · " + (x.title || ""),
      body: "ใบแจ้งซ่อม " + (x.no || x.id) + " เกินกำหนดแก้ไข " + ov.over + " วัน" + (sv.th ? " (" + sv.th + ")" : ""),
      foot: "แจ้งเมื่อ " + window.drShort((x.reportedAt || "").slice(0, 10)), days: ov.over });
  });

  /* หนักสุดขึ้นก่อน · ชนิดเดียวกันเรียงตามความสาหัส (เลยกำหนดมานานสุด / เหลือเวลาน้อยสุด) */
  return out.sort((a, b) => a.rank - b.rank
    || (a.kind === "warranty" ? a.days - b.days : b.days - a.days));
}

/* ตัวฟังข้อมูลสำหรับ "กระดิ่ง" บนหัวหน้าจอ — เปิดเฉพาะคนที่มีสิทธิ์ om
   ฟังเฉพาะโหนดเบาสามอัน (ไม่มีรูป/ลายเซ็น) เลยถูกพอที่จะเปิดค้างไว้ทั้งแอป
   คืน sites/bySite/tickets ออกไปด้วย ปุ่มในลิ้นชักใบงานจะได้ไม่ต้องฟังซ้ำอีกรอบ */
function useOmAlerts(on) {
  const [sites, setSites] = React.useState([]);
  const [visits, setVisits] = React.useState([]);
  const [tickets, setTickets] = React.useState([]);

  React.useEffect(() => {
    if (!on || !_OMFB()) { setSites([]); setVisits([]); setTickets([]); return; }
    const rs = _omRef("omSites"), rv = _omRef("omCleanVisits"), rt = _omRef("omTickets");
    const toList = (val) => Object.keys(val || {}).map((k) => Object.assign({ id: k }, val[k]));
    const hs = rs.on("value", (s) => setSites(toList(s.val())));
    const ht = rt.on("value", (s) => setTickets(toList(s.val())));
    const hv = rv.on("value", (s) => {
      const val = s.val() || {}; const out = [];
      Object.keys(val).forEach((sid) => Object.keys(val[sid] || {}).forEach((vid) => {
        out.push(Object.assign({ id: vid, siteId: sid }, val[sid][vid]));
      }));
      setVisits(out);
    });
    return () => { rs.off("value", hs); rv.off("value", hv); rt.off("value", ht); };
  }, [on]);

  const bySite = React.useMemo(() => {
    const m = {};
    visits.forEach((v) => { (m[v.siteId] || (m[v.siteId] = [])).push(v); });
    return m;
  }, [visits]);

  const alerts = React.useMemo(() => omSiteAlerts(sites, bySite, tickets), [sites, bySite, tickets]);
  return { alerts, sites, bySite, tickets };
}

Object.assign(window, {
  useOmMySign, omNotify, omSiteAlerts, useOmAlerts,
  OM_VISIT_KIND, OM_VISIT_KIND_BY, OM_VISIT_STATUS, omVisitStatusOf,
  omVisitDocNo, omBlankVisit, omVisitRollup,
  useOmVisits, useOmVisitPhotos, useOmVisitSigns,
});

Object.assign(window, {
  OM_TICKET_CAT, OM_TICKET_CAT_BY, OM_SEVERITY, OM_SEVERITY_BY, OM_SLA_DAYS, OM_COVER,
  OM_TICKET_STATUS, OM_TICKET_STATUS_BY, OM_TICKET_SOURCE,
  omCoverTH, omTicketStatusOf, omTicketOpen, omTicketNext, omTicketBack, omTicketCan, omTicketMove,
  omTicketKey, omTicketOverdue, omTicketNo, omBlankTicket, omTicketRollup,
  useOmTickets, useOmTicketPhotos,
});

Object.assign(window, {
  OM_ROOT, OM_WARRANTY_DEF, OM_WARRANTY_KIND, OM_WARRANTY_KIND_BY, OM_WARRANTY_STATE,
  OM_WARN_DAYS, OM_CLEAN_EVERY, OM_CLEAN_FREE, OM_CLEAN_SOON, OM_COMSRC_TH, OM_CLEAN_STATUS,
  omAddMonths, omDiffDays,
  omWarrantyEnd, omWarrantyState, omDaysTH, omWarrantyLeftTH, omWarrantyList, omSiteWarrantyState, omCoverOf,
  omBlankClean, omCleanStatusOf, omCleanLive, omCleanDone, omLastClean, omFreeUsed, omFreeLeft,
  omOpenVisit, omNextCleanDue, omCleanState, omCleanBacklog, omBlankCleanVisit, omCleanAgenda,
  omIsExternal, omNextExtId, omNewId,
  omComDateOf, omComUnsure, omSetComDate, omSeedWarranties, omSiteFromJob, omBlankSite, omEnrollable, omRollup,
  omCanWrite, omCanApprove, omCanDelete, useOmSites, useOmCleanVisits,
});
