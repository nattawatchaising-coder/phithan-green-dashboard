/* ============================================================
   PHITHAN GREEN — รายงานประจำวันหน้างาน (Daily Report)

   ต้นแบบคือฟอร์ม Excel 5 หน้าของ WHA (ECTP-INSI-DAILYREPORT) ที่ต้องกรอกมือทั้งใบ
   รอบนี้ย้ายมาเป็นฟอร์มในระบบ กรอกจากมือถือหน้างานได้ แล้วออกเป็น PDF

   งานบ้านกรอกสั้น (งานวันนี้ · ทีม+อากาศ · รูป · ปัญหา)
   งานโครงการกรอกครบ (+ วัสดุ · เครื่องจักร · กำลังคน · ความปลอดภัย)

   เก็บสองที่แยกกันตั้งใจ:
     dailyReports/{jobId}/{date}  = ตัวรายงาน (เบา — หน้ารวมของหัวหน้าอ่านทั้งก้อนได้)
     dailyPhotos/{jobId}/{date}   = รูป base64 (หนัก — โหลดเฉพาะตอนเปิดใบนั้น)
   ถ้าเก็บรวมกัน หน้ารวมจะต้องลากรูปทุกใบของทุกงานมาด้วย

   ตั้งชื่อ top-level ขึ้นต้นด้วย dr/DR เพราะทุกไฟล์โหลดเป็นสคริปต์ธรรมดา
   (ชื่อระดับบนสุดอยู่ scope เดียวกันหมด ชนเมื่อไหร่ = ทั้งเว็บพัง)
   ============================================================ */

const _DRFB = () => !!window.FBDB;
const _drRef = (p) => window.FBDB.ref(p);

/* ── วันที่ ── */
const drPad2 = (n) => (n < 10 ? "0" : "") + n;
const drISO = (d) => d.getFullYear() + "-" + drPad2(d.getMonth() + 1) + "-" + drPad2(d.getDate());
const drToday = () => drISO(new Date());
const drAddDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + n);
  return drISO(d);
};
const DR_MON_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const DR_DAY_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
/* "เสาร์ 17 ส.ค. 2569" — ปี พ.ศ. เพราะเป็นเอกสารส่งลูกค้า */
function drDateTH(iso, withDay) {
  if (!iso) return "-";
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return "-";
  const body = d.getDate() + " " + DR_MON_TH[d.getMonth()] + " " + (d.getFullYear() + 543);
  return withDay ? DR_DAY_TH[d.getDay()] + " " + body : body;
}
const drShort = (iso) => {
  if (!iso) return "-";
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  return isNaN(d.getTime()) ? "-" : d.getDate() + " " + DR_MON_TH[d.getMonth()];
};

/* ── ตัวเลือกในฟอร์ม ── */
const DR_WEATHER = [
  { key: "clear",  th: "แดดจัด",     color: "#F59E0B" },
  { key: "cloudy", th: "เมฆมาก",     color: "#94A3B8" },
  { key: "rain",   th: "ฝนตก",       color: "#3B82F6" },
  { key: "storm",  th: "ฝนฟ้าคะนอง", color: "#7C5CFC" },
];
const drWeatherOf = (k) => DR_WEATHER.find((w) => w.key === k) || null;

const DR_STATUS = [
  { key: "draft",    th: "ร่าง",         color: "#94A3B8" },
  { key: "sent",     th: "รออนุมัติ",    color: "#F59E0B" },
  { key: "approved", th: "อนุมัติแล้ว",  color: "#10B981" },
];
const drStatusOf = (k) => DR_STATUS.find((s) => s.key === k) || DR_STATUS[0];

/* กำลังคน — ชุดเดียวกับหน้า Manpower ในเทมเพลต แปลไทยไว้ให้ช่างกรอกง่าย */
const DR_MANPOWER = [
  { key: "pm",     th: "ผู้จัดการโครงการ" },
  { key: "pe",     th: "วิศวกรโครงการ" },
  { key: "se",     th: "วิศวกรหน้างาน" },
  { key: "safety", th: "จป. / ความปลอดภัย" },
  { key: "qc",     th: "ควบคุมคุณภาพ (QC)" },
  { key: "fore",   th: "โฟร์แมน" },
  { key: "tech",   th: "ช่างเทคนิค" },
  { key: "labour", th: "กรรมกร" },
  { key: "store",  th: "สโตร์" },
  { key: "other",  th: "อื่น ๆ" },
];

/* ความปลอดภัย — ตรงกับหน้า 5 ของเทมเพลต (JSA · ใบอนุญาตทำงาน · ความสะอาด) */
const DR_JSA = [
  { key: "low",     th: "ต่ำ",       range: "1–5",   color: "#10B981" },
  { key: "medium",  th: "ปานกลาง",  range: "6–9",   color: "#F59E0B" },
  { key: "high",    th: "สูง",       range: "10–16", color: "#F97316" },
  { key: "extreme", th: "สูงมาก",    range: "17–25", color: "#EF4444" },
];
const DR_CLEAN = [
  { key: "zone",  th: "เก็บพื้นที่ทำงาน" },
  { key: "trash", th: "เก็บขยะ" },
  { key: "equip", th: "ทำความสะอาดเครื่องมือ" },
  { key: "mat",   th: "จัดเก็บวัสดุ" },
  { key: "all",   th: "เก็บงานทั้งหมด" },
];

/* ── ชุดขั้นงานของงานโครงการ — 10 หัวข้อใหญ่ 30 หัวข้อย่อยตามเทมเพลต WHA ──
   เป็นแค่ "ค่าตั้งต้น" ของงานใหม่ · แต่ละงานแก้/เพิ่ม/ลบหัวข้อของตัวเองได้ */
const DR_WHA_TREE = [
  ["เตรียมความปลอดภัย & เข้าพื้นที่", ["งานความปลอดภัย — เตรียมพื้นที่ทำงาน", "ตั้งสโตร์วัสดุ & สำนักงานชั่วคราว", "ตั้งนั่งร้านสำหรับขนย้าย", "จัดพื้นที่ปลอดภัย & รายการอุปกรณ์", "ประสานไฟฟ้า/น้ำหน้างาน"]],
  ["เคลียร์พื้นที่", ["ปรับระดับพื้นดิน", "ทางเดินเท้า & ระบบสุขาภิบาล", "ระบบรางสายไฟ", "จัดพื้นที่สีเขียว"]],
  ["ห้องอินเวอร์เตอร์", ["ก่อสร้างห้อง", "แร็คซัพพอร์ต", "ติดตั้งอินเวอร์เตอร์"]],
  ["ติดตั้ง PV — งานโครงสร้าง", ["สำรวจหน้างาน", "ติดตั้งโครงสร้างรองรับ", "ติดตั้งแผงโซล่าเซลล์"]],
  ["เดินสาย — ฝั่ง DC", ["ระบบท่อร้อยสายใต้ดิน", "เดินสาย PV ตามไดอะแกรม", "สายกราวด์ฝั่ง DC"]],
  ["เดินสาย — ฝั่ง AC", ["ติดตั้งรางสายไฟ & wireway", "ประกอบตู้ AC-PD", "ตู้ MDB / ปรับบัสบาร์", "ต่อสาย 3 เฟส RST", "สายกราวด์ AC & ตอกแท่งกราวด์"]],
  ["ดับไฟเพื่อเชื่อมต่อ & ระบบป้องกัน", ["ติดตั้งหม้อแปลง", "ติดตั้งรีเลย์ป้องกัน & CT PT"]],
  ["ระบบสาธารณูปโภค", ["CCTV", "ติดตั้งระบบน้ำ", "สถานีตรวจอากาศ (Temp cell)"]],
  ["ระบบมอนิเตอร์", ["เดินสายสื่อสาร", "เชื่อมต่อระบบสื่อสาร"]],
  ["ส่งมอบงาน", ["Punch List เดินตรวจครั้งสุดท้าย", "สำรวจหลังก่อสร้าง", "เคลียร์ Punch List"]],
];
/* แผ่ต้นไม้เป็นแถวตาราง — หัวข้อใหญ่เลข "3" ลูกเป็น "3.1" เหมือนในเทมเพลต */
function drWhaSteps() {
  const out = [];
  DR_WHA_TREE.forEach((grp, i) => {
    out.push({ no: String(i + 1), th: grp[0], head: true, planStart: "", planEnd: "", actStart: "", actEnd: "", pct: 0 });
    grp[1].forEach((sub, k) => {
      out.push({ no: (i + 1) + "." + (k + 1), th: sub, head: false, planStart: "", planEnd: "", actStart: "", actEnd: "", pct: 0 });
    });
  });
  return out;
}

/* ── เนื้องานติดตั้งของงานบ้าน ──
   ไม่ใช่ 5 ขั้นของบอร์ด (ออกแบบ/ถอดของ/นัดคิว/ติดตั้ง/เสร็จสิ้น) — นั่นเป็นสถานะเดินงาน
   ไม่ใช่สิ่งที่ช่างลงมือทำหน้างาน รายงานประจำวันต้องบอกว่าวันนี้ทำเนื้องานไหนไปกี่ %
   ชุดนี้เป็นค่าตั้งต้น แก้/เพิ่ม/ลบเองได้ เพราะบ้านแต่ละหลังไม่เหมือนกัน */
const DR_HOME_WORK = [
  "เตรียมพื้นที่ & ความปลอดภัย",
  "ติดตั้งโครงสร้าง / รางแผง",
  "ยกแผงขึ้นหลังคา & ยึดแผง",
  "เดินสาย DC & ท่อร้อยสาย",
  "ติดตั้งอินเวอร์เตอร์",
  "เดินสาย AC & ตู้ควบคุม",
  "ระบบกราวด์ & กันฟ้าผ่า",
  "ทดสอบระบบ & เก็บงานส่งมอบ",
];
function drHomeSteps() {
  return DR_HOME_WORK.map((th, i) => ({
    no: String(i + 1), th, head: true,
    planStart: "", planEnd: "", actStart: "", actEnd: "", pct: 0,
  }));
}

/* ใบที่เขียนไว้ก่อนเปลี่ยนหัวข้อ ยังถือชุด 5 ขั้นของบอร์ดอยู่
   ถ้ายังไม่ได้กรอกอะไรเลยก็สลับเป็นชุดเนื้องานให้ ไม่ต้องมานั่งกดคืนชุดมาตรฐานเอง
   (กรอกไปแล้วไม่แตะ ของที่ช่างพิมพ์ไว้ต้องไม่หาย) */
function drIsBoardSteps(steps) {
  const list = steps || [];
  const stages = (window.SF || {}).STAGES || [];
  if (!list.length || list.length !== stages.length) return false;
  /* วันในชุดเก่าระบบเติมให้เองจากประวัติการเลื่อนขั้น ไม่ใช่ของที่ช่างพิมพ์ จึงไม่นับ
     ดูแค่ % ซึ่งเป็นช่องเดียวที่ชุดเก่าให้แก้ได้ */
  if (list.some((r) => +r.pct > 0)) return false;
  return list.every((r, i) => r.th === stages[i].th);
}

/* งานบ้าน = ฟอร์มสั้น · งานโครงการ = ฟอร์มครบ (สลับเองได้ในฟอร์ม จึงจำค่าไว้ในเรคคอร์ด) */
const drModeOf = (job) => ((job || {}).type === "project" ? "project" : "home");

/* เลขเอกสาร — ระบบยังไม่มีช่องเลขสัญญาแบบ WHA จึงออกเลขของเราเอง
   PG-DR-{รหัสงาน}-{ครั้งที่} · ครั้งที่นับจากจำนวนรายงานที่มีอยู่ก่อนหน้าวันนี้ */
function drDocNo(job, date, allDates) {
  const code = String((job || {}).code || "JOB").replace(/^SF-/, "");
  const n = (allDates || []).filter((d) => d <= date).length || 1;
  return "PG-DR-" + code + "-" + drPad2(n);
}

/* ── สิทธิ์ ──
   ช่างเขียน หัวหน้า/แอดมินอนุมัติ · อนุมัติแล้วล็อกทั้งใบ ไม่งั้นเอกสารที่เซ็นไปแล้วถูกแก้ย้อนหลังได้ */
const drCanApprove = (role) => window.hasRole(role, "lead") || window.hasRole(role, "admin");
const drCanEdit = (role, rec) => {
  if (!window.can(role, "editJob")) return false;
  return !(rec && rec.status === "approved");
};

/* ใบเปล่าของวันหนึ่ง — เปิดฟอร์มวันที่ยังไม่เคยเขียนจะได้ไม่ต้องเช็ค null ทุกช่อง */
function drBlank(job, date, user, prev) {
  const mode = drModeOf(job);
  return {
    date, jobId: (job || {}).id || "", mode,
    work: "", pct: typeof (job || {}).progressPct === "number" ? job.progressPct : 0,
    /* ขั้นงานคัดลอกมาจากใบเมื่อวาน ช่างจะได้ไม่ต้องกรอกใหม่ทุกวัน */
    steps: prev && prev.steps && prev.steps.length ? prev.steps : (mode === "project" ? drWhaSteps() : drHomeSteps(job)),
    team: "", weatherAm: "", weatherPm: "",
    problem: "", nextDay: "",
    materials: [], machines: [], manpower: [], certs: [],
    jsa: "", permitCold: "", permitHot: "", clean: {},
    status: "draft",
    byId: (user || {}).id || null, byName: (user || {}).name || "",
    createdAt: new Date().toISOString(),
  };
}

/* ── ใบเก่าจากรายงานประจำวันรุ่นแรก ──
   รุ่นแรกเก็บที่โหนดเดียวกันแต่คนละชื่อช่อง (done / issues / plan / crew)
   ถ้าไม่แปลงชื่อให้ ใบที่ช่างเคยเขียนไว้จริงจะเปิดมาเป็นหน้าว่าง แล้วโดนเซฟทับหาย
   ดูที่ status เป็นตัวแยกรุ่น — ใบรุ่นใหม่มี status เสมอตั้งแต่ drBlank */
function drNorm(rec) {
  if (!rec || typeof rec !== "object" || rec.status) return rec;
  return Object.assign({}, rec, {
    work: rec.work || rec.done || "",
    problem: rec.problem || rec.issues || "",
    nextDay: rec.nextDay || rec.plan || "",
    team: rec.team || rec.crew || "",
    pct: rec.pct == null ? "" : rec.pct,
    status: "draft",
    legacy: true,
  });
}
function drNormTree(byDate) {
  const out = {};
  Object.keys(byDate || {}).forEach((d) => { out[d] = drNorm(byDate[d]); });
  return out;
}

/* ── ตัวเก็บข้อมูลของงานหนึ่ง ──
   โหลดเฉพาะตอนเปิดใบงาน เหมือน useJobMedia — ไม่ให้หน้ารายการงานช้า */
function useDailyReports(jobId) {
  const [byDate, setByDate] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!jobId || !_DRFB()) { setByDate({}); return; }
    setLoading(true);
    const ref = _drRef("dailyReports/" + jobId);
    const h = ref.on("value", (s) => {
      const v = s.val();
      setByDate(v && typeof v === "object" ? drNormTree(v) : {});
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [jobId]);

  const dates = React.useMemo(() => Object.keys(byDate).sort().reverse(), [byDate]);

  const save = React.useCallback((date, rec) => {
    if (!jobId || !_DRFB() || !date) return;
    _drRef("dailyReports/" + jobId + "/" + date).set(Object.assign({}, rec, { jobId, date, updatedAt: new Date().toISOString() }));
  }, [jobId]);

  const patch = React.useCallback((date, fields) => {
    if (!jobId || !_DRFB() || !date) return;
    _drRef("dailyReports/" + jobId + "/" + date).update(Object.assign({}, fields, { updatedAt: new Date().toISOString() }));
  }, [jobId]);

  const remove = React.useCallback((date) => {
    if (!jobId || !_DRFB() || !date) return;
    _drRef("dailyReports/" + jobId + "/" + date).remove();
    _drRef("dailyPhotos/" + jobId + "/" + date).remove();
  }, [jobId]);

  return { byDate, dates, loading, save, patch, remove };
}

/* รูปของรายงานวันหนึ่ง — แยกโหนดจากตัวรายงาน (ดูหมายเหตุหัวไฟล์) */
function useDailyPhotos(jobId, date) {
  const [photos, setPhotos] = React.useState([]);
  React.useEffect(() => {
    if (!jobId || !date || !_DRFB()) { setPhotos([]); return; }
    const ref = _drRef("dailyPhotos/" + jobId + "/" + date);
    const h = ref.on("value", (s) => {
      const v = s.val();
      const arr = v && typeof v === "object" ? Object.values(v) : [];
      arr.sort((a, b) => String(a.at || "").localeCompare(String(b.at || "")));
      setPhotos(arr);
    });
    return () => ref.off("value", h);
  }, [jobId, date]);

  const add = React.useCallback((dataUrl, user) => {
    if (!jobId || !date || !_DRFB()) return;
    const id = "DP-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    _drRef("dailyPhotos/" + jobId + "/" + date + "/" + id).set({
      id, dataUrl, cap: "", at: new Date().toISOString(),
      by: (user || {}).id || null, byName: (user || {}).name || "",
    });
  }, [jobId, date]);

  const setCap = React.useCallback((id, cap) => {
    if (!jobId || !date || !_DRFB()) return;
    _drRef("dailyPhotos/" + jobId + "/" + date + "/" + id).update({ cap: cap || "" });
  }, [jobId, date]);

  const remove = React.useCallback((id) => {
    if (!jobId || !date || !_DRFB()) return;
    _drRef("dailyPhotos/" + jobId + "/" + date + "/" + id).remove();
  }, [jobId, date]);

  return { photos, add, setCap, remove };
}

/* ── รายงานของ "ทุกงาน" สำหรับหน้ารวมของหัวหน้า ──
   อ่านทั้งต้นไม้ได้เพราะรูปไม่ได้อยู่ในนี้ — เรคคอร์ดหนึ่งใบเป็นข้อความล้วน */
function useDailyAll() {
  const [all, setAll] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_DRFB()) { setLoading(false); return; }
    const ref = _drRef("dailyReports");
    const h = ref.on("value", (s) => {
      const v = s.val();
      const out = {};
      Object.keys(v && typeof v === "object" ? v : {}).forEach((jid) => { out[jid] = drNormTree(v[jid]); });
      setAll(out);
      setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  return { all, loading };
}

/* ความคืบหน้าเทียบกับใบก่อนหน้า — ตัวเลขที่เทมเพลตเดิมไม่มี แต่เป็นสิ่งที่หัวหน้าอยากรู้ที่สุด */
function drPrevOf(byDate, date) {
  const before = Object.keys(byDate || {}).filter((d) => d < date).sort();
  return before.length ? byDate[before[before.length - 1]] : null;
}

/* สรุปสั้น ๆ ว่าวันนี้งานไหนส่งแล้ว/ยังไม่ส่ง — ใช้ทั้งในปุ่มใบงานและหน้ารวม */
function drDayState(byDate, date) {
  const rec = (byDate || {})[date];
  if (!rec) return { key: "none", th: "ยังไม่เขียน", color: "#94A3B8" };
  return Object.assign({ key: rec.status || "draft" }, drStatusOf(rec.status));
}

Object.assign(window, {
  useDailyReports, useDailyPhotos, useDailyAll, drNorm,
  drToday, drISO, drAddDays, drDateTH, drShort, drPad2,
  DR_WEATHER, drWeatherOf, DR_STATUS, drStatusOf, DR_MANPOWER, DR_JSA, DR_CLEAN,
  drWhaSteps, drHomeSteps, drIsBoardSteps, drModeOf, drDocNo, drBlank,
  drCanApprove, drCanEdit, drPrevOf, drDayState,
});
