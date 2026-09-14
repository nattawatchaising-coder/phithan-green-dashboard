/* ============================================================
   flash+solar — ลงเวลาเข้า-ออกงาน และขอ OT (Attendance & Overtime)

   ก่อนหน้านี้ระบบไม่มีอะไรเกี่ยวกับเวลาทำงานเลยสักอย่าง ทุกอย่างอยู่ในแชทและกระดาษ
   ไฟล์นี้เป็นตรรกะล้วนกับ hooks — หน้าจอเดสก์ท็อปอยู่ที่ views-attend.jsx
   หน้าจอมือถืออยู่ใน liff-app.jsx

   ── กฎที่ไม่มีข้อยกเว้น: การลงเวลา "ห้ามบล็อก" ──
   จับพิกัดไม่ได้ · ปิดสิทธิ์ตำแหน่ง · อยู่ใต้ดินไม่มีสัญญาณ — ลงเวลาได้หมด
   ระบบเก็บไว้แค่ว่า "ใบนี้ไม่มีพิกัดเพราะอะไร" แล้วให้ออฟฟิศเห็นธงนั้น
   เหตุผล: ถ้าบล็อก ช่างจะเลิกใช้แล้วกลับไปแจ้งเวลาทางแชทเหมือนเดิม ระบบก็ตายทันที

   ── jobId บนใบลงเวลาคือ "คำบอกของช่าง" ไม่ใช่ข้อเท็จจริงที่ตรวจแล้ว ──
   ระบบนี้ยังไม่มีพิกัดไซต์ที่เชื่อถือได้ (job.gps เป็นค่าสุ่ม · หมุดบนปฏิทินปั้นจาก
   ชื่อจังหวัด + แฮชรหัสงาน) จึงเทียบระยะไม่ได้ และ **ห้ามสร้างอะไรที่บอกเป็นนัยว่าตรวจระยะได้**
   พิกัดที่เก็บทุกวันนี่แหละที่จะค่อย ๆ กลายเป็นพิกัดไซต์จริงในอนาคต

   ── โครงข้อมูล ──
     attend/{userId}/{YYYY-MM-DD}  ใบลงเวลาของคนหนึ่งในวันหนึ่ง (คีย์ซ้ำ = กดซ้ำไม่พัง)
     attendDay/{YYYY-MM-DD}/{userId}  ดัชนีเบา ให้ออฟฟิศเปิดแผ่นรายวันโดยไม่ลากประวัติทั้งบริษัท
     tmOt/{id}                     ใบขอ OT (แบน เหมือน ecClaims)
     config/workHours              เวลาทำงานมาตรฐาน

   ── ปีไทย ──
   ทุกฟังก์ชันรับ-คืนเป็น ค.ศ. (YYYY-MM-DD) เท่านั้น แปลงเป็น พ.ศ. ตอนแสดงผลด้วย drDateTH

   ตั้งชื่อ top-level ขึ้นต้นด้วย tm/Tm/TM เพราะทุกไฟล์โหลดเป็นสคริปต์ธรรมดา
   (ชื่อระดับบนสุดอยู่ scope เดียวกันหมด ชนเมื่อไหร่ = ทั้งเว็บพัง)
   ============================================================ */

/* ── โหมดทดสอบ ──
   รับสองทาง: localStorage.tm_test_root (เดสก์ท็อป) หรือ ?test=1 (ในแอป LINE ซึ่งตั้ง
   localStorage ไม่สะดวก) — ติดไปกับ URL จึงทำ LIFF app ตัวที่สองชี้ไปหน้าเดียวกันได้
   ค่าปกติต้องเป็นค่าว่างเสมอ */
const TM_ROOT = (() => {
  try {
    if (new URLSearchParams(location.search).get("test") === "1") return "_sandbox/";
    return localStorage.getItem("tm_test_root") || "";
  } catch (e) { return ""; }
})();
const _TMFB = () => !!window.FBDB;
const _tmRef = (p) => window.FBDB.ref(TM_ROOT + p);
const _tmRoot = () => window.FBDB.ref(TM_ROOT || "/");

/* ================================================================
   เวลา — ตรรกะล้วน ทดสอบได้โดยไม่ต้องมี Firebase
   ================================================================ */

/* "08:30" → 510 นาที · ค่าที่อ่านไม่ออกคืน null ไม่ใช่ 0 เพราะ 0 คือเที่ยงคืนจริง ๆ */
function tmHM(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(str || "").trim());
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
const tmHHMM = (mins) => {
  const n = Math.max(0, Math.round(+mins || 0)) % 1440;
  return window.drPad2(Math.floor(n / 60)) + ":" + window.drPad2(n % 60);
};
/* เวลาตอนนี้แบบ "เวลาบ้านเรา" — ห้ามใช้ UTC ตรงนี้ ช่างเข้างานหกโมงเช้าจะกลายเป็นวันก่อนหน้า */
const tmNowHM = () => { const d = new Date(); return window.drPad2(d.getHours()) + ":" + window.drPad2(d.getMinutes()); };

/* ช่วงเวลาข้ามเที่ยงคืนได้ — งานกลางคืนจบตีสองคือเรื่องปกติของงานติดตั้ง
   ปลาย < ต้น จึงแปลว่าข้ามวัน ไม่ใช่กรอกผิด */
function tmSpanMins(from, to) {
  const a = tmHM(from), b = tmHM(to);
  if (a == null || b == null) return 0;
  return b >= a ? b - a : b + 1440 - a;
}

/* ชั่วโมงอ่านคน — 450 → "7 ชม. 30 น." (ไม่ใช่ 7.5 ซึ่งอ่านผิดเป็นเจ็ดโมงครึ่งได้) */
function tmDur(mins) {
  const n = Math.max(0, Math.round(+mins || 0));
  const h = Math.floor(n / 60), m = n % 60;
  if (!n) return "—";
  return (h ? h + " ชม." : "") + (h && m ? " " : "") + (m ? m + " น." : "");
}

/* ── เวลาทำงานมาตรฐาน ──
   ที่นี่ไม่ได้เข้างานเวลาตายตัวแบบโรงงาน — เข้าได้ตั้งแต่ 08:30 ถึง 09:00
   แล้วนับไปอีก 8 ชม. ทำงาน + 1 ชม. พัก จากเวลาที่กดเข้าจริง
   จึงเก็บเป็น "ช่วงเข้างาน + จำนวนชั่วโมงที่ต้องทำ" ไม่ใช่ start/end ตายตัว

   days = วันในสัปดาห์ที่ถือเป็นวันทำงาน (0=อาทิตย์) · ตั้งต้นจันทร์-เสาร์ ตามที่ทีมนี้ทำจริง
   holidays = { "2026-12-10": "วันรัฐธรรมนูญ" } — วันหยุดพิเศษที่บริษัทประกาศเอง */
const TM_WH_DEFAULT = {
  startEarly: "08:30",   // เข้างานได้ตั้งแต่
  startLate: "09:00",    // เข้าช้ากว่านี้ถือว่าสาย (ยังลงเวลาได้ ระบบแค่ติดธงไว้)
  workMins: 480,         // เวลาทำงานจริงต่อวัน
  lunchMins: 60,         // พัก — อยู่ที่ทำงานแต่ไม่นับเป็นเวลาทำงาน
  days: [1, 2, 3, 4, 5, 6],
  minOtMins: 30, roundMins: 30, holidays: {},
  /* วันตัดยอด OT — 0 = ใช้เดือนปฏิทิน (1 ถึงสิ้นเดือน)
     ตั้ง 25 = รอบหนึ่งคือ 26 ของเดือนก่อน ถึง 25 ของเดือนนี้ */
  cutoffDay: 0,
  /* ── ตัวคูณค่าแรงของ OT แต่ละประเภท ──
     ค่าตั้งต้นเป็นอัตราตามกฎหมายแรงงานไทย (พ.ร.บ.คุ้มครองแรงงาน ม.61-63)
       ล่วงเวลาวันทำงาน   1.5 เท่า
       ทำงานวันหยุด       2 เท่า  (ลูกจ้างรายวัน · ถ้าเป็นรายเดือนที่ได้ค่าจ้างวันหยุดอยู่แล้วให้ตั้ง 1)
       ล่วงเวลาในวันหยุด  3 เท่า
       งานกลางคืน        1.5 เท่า (กฎหมายไม่ได้กำหนดอัตรากลางคืนไว้ต่างหาก แต่ละที่ตกลงกันเอง)
     บริษัทตกลงกับพนักงานสูงกว่ากฎหมายได้ จึงต้องแก้ได้ทุกช่อง
     ระบบใช้ตัวคูณนี้คิดแค่ "ชั่วโมงคิดค่าแรง" ไม่ได้คิดเป็นเงิน เพราะอัตราค่าจ้างรายคนไม่ได้อยู่ในระบบนี้ */
  otRates: { ot: 1.5, holiday: 2, holidayOt: 3, night: 1.5 },
};
function tmWhNorm(cfg) {
  const c = Object.assign({}, TM_WH_DEFAULT, cfg || {});
  /* ค่าชุดเก่าเก็บเป็น start/end ตายตัว — ย้ายมาเป็นชุดใหม่ให้อัตโนมัติ
     ไม่ทำตรงนี้ = บริษัทที่ตั้งค่าไว้แล้วจะเด้งกลับไปใช้ค่าดีฟอลต์เงียบ ๆ */
  if (cfg && cfg.start && !cfg.startEarly) {
    if (tmHM(cfg.start) != null) c.startEarly = cfg.start;
    c.startLate = tmHHMM(tmHM(c.startEarly) + 30);
    const span = cfg.end ? tmSpanMins(cfg.start, cfg.end) : 0;
    if (span > 0) c.workMins = Math.max(0, span - Math.max(0, +cfg.lunchMins || 0));
  }
  c.days = Array.isArray(c.days) && c.days.length ? c.days.map(Number) : TM_WH_DEFAULT.days;
  c.lunchMins = Math.max(0, +c.lunchMins || 0);
  c.workMins = Math.max(0, +c.workMins || 0) || TM_WH_DEFAULT.workMins;
  c.minOtMins = Math.max(0, +c.minOtMins || 0);
  /* roundMins = 0 แปลว่าไม่ปัด — ต้องยอมให้ตั้งได้ ไม่งั้นหารด้วยศูนย์ */
  c.roundMins = Math.max(0, +c.roundMins || 0);
  c.holidays = c.holidays && typeof c.holidays === "object" ? c.holidays : {};
  /* เพดาน 28 ไม่ใช่ 31 — ตั้งวันที่ 30 แล้วรอบของกุมภาพันธ์จะไม่มีวันนั้นอยู่จริง
     ต้องไปเดาแทนผู้ใช้ว่าหมายถึงสิ้นเดือนหรือวันที่ 28 ซึ่งเดาผิดแล้วยอดเงินเดือนเพี้ยนเงียบ ๆ */
  c.cutoffDay = Math.min(28, Math.max(0, Math.round(+c.cutoffDay || 0)));
  /* ตัวคูณ: เติมให้ครบทุกประเภทเสมอ ประเภทที่เพิ่มทีหลังจะได้ไม่กลายเป็น 0 เงียบ ๆ
     (0 = ไม่คิดค่าแรงให้เลย ซึ่งไม่มีทางเป็นสิ่งที่ใครตั้งใจ แต่ยอมให้ตั้งได้ถ้าจงใจ) */
  const rr = c.otRates && typeof c.otRates === "object" ? c.otRates : {};
  const rates = {};
  TM_OT_KIND.forEach((k) => {
    const v = rr[k.key];
    rates[k.key] = v === 0 ? 0 : Math.min(10, Math.max(0, +v || TM_WH_DEFAULT.otRates[k.key] || 1));
  });
  c.otRates = rates;
  if (tmHM(c.startEarly) == null) c.startEarly = TM_WH_DEFAULT.startEarly;
  if (tmHM(c.startLate) == null || tmHM(c.startLate) < tmHM(c.startEarly)) c.startLate = c.startEarly;
  /* start/end เป็นค่า "อนุมาน" ของวันที่ยังไม่มีใบลงเวลา — ของวันที่มีใบจริงให้ใช้ tmDayWindow
     ยังคงชื่อเดิมไว้เพื่อให้โค้ดที่อ่าน cfg.start/cfg.end อยู่แล้วไม่พัง */
  c.start = c.startEarly;
  c.end = tmHHMM(tmHM(c.startEarly) + c.workMins + c.lunchMins);
  return c;
}
const tmIsHoliday = (dateISO, cfg) => !!tmWhNorm(cfg).holidays[String(dateISO || "").slice(0, 10)];

/* ══ รอบตัดยอด OT ══
   ฝ่ายบุคคลไม่ได้ปิดยอดวันสิ้นเดือนเสมอไป หลายที่ตัดวันที่ 25 เพื่อให้ทันรอบจ่ายเงินเดือน
   ถ้าระบบยึดเดือนปฏิทินอย่างเดียว OT ปลายเดือนจะตกไปอยู่คนละรอบกับที่เขาจ่ายจริง
   ทุกฟังก์ชันรับ-คืนเป็น ค.ศ. (YYYY-MM-DD) เสมอ · to อยู่ในรอบด้วย (รวมวันนั้น) */
const tmDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
/* เลื่อนเดือนด้วยเลขล้วนแล้วหนีบวันที่ให้อยู่ในเดือนนั้นจริง (m เกิน 12 หรือ ต่ำกว่า 1 ได้) */
function tmDayIn(y, m, d) {
  const t = y * 12 + (m - 1);
  const yy = Math.floor(t / 12), mm = (t % 12 + 12) % 12 + 1;
  return yy + "-" + window.drPad2(mm) + "-" + window.drPad2(Math.min(Math.max(1, d), tmDaysInMonth(yy, mm)));
}
/* วันถัดไป — ใช้ Date เพราะต้องข้ามสิ้นเดือน/สิ้นปีให้ถูก แต่สร้างแบบเวลาท้องถิ่น ไม่ใช่ UTC */
function tmNextDay(iso) {
  const s = String(iso || "").slice(0, 10);
  const d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) + 1);
  return d.getFullYear() + "-" + window.drPad2(d.getMonth() + 1) + "-" + window.drPad2(d.getDate());
}
function tmPrevDay(iso) {
  const s = String(iso || "").slice(0, 10);
  const d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10) - 1);
  return d.getFullYear() + "-" + window.drPad2(d.getMonth() + 1) + "-" + window.drPad2(d.getDate());
}

/* รอบที่ครอบวันที่ที่ให้มา → { from, to, key, cut } · key = เดือนที่รอบไปจบ ใช้เป็นชื่อรอบ */
function tmPeriodOf(dateISO, cfg) {
  const cut = tmWhNorm(cfg).cutoffDay;
  const iso = String(dateISO || window.drToday()).slice(0, 10);
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
  if (!y || !m || !d) return tmPeriodOf(window.drToday(), cfg);
  if (!cut) {
    const from = tmDayIn(y, m, 1);
    return { from: from, to: tmDayIn(y, m, 31), key: from.slice(0, 7), cut: 0 };
  }
  /* กดดูวันที่เลยวันตัดไปแล้ว = อยู่ในรอบที่จะไปจบเดือนหน้า */
  const em = m + (d <= cut ? 0 : 1);
  const to = tmDayIn(y, em, cut);
  /* ต้นรอบ = วันถัดจากวันตัดของรอบก่อน ไม่ใช่ "วันที่ cut+1" ตรง ๆ
     เพราะถ้าตัดวันที่ 28 เดือนกุมภาพันธ์จะไม่มีวันที่ 29 แล้วต้นรอบจะทับท้ายรอบก่อน */
  return { from: tmNextDay(tmDayIn(y, em - 1, cut)), to: to, key: to.slice(0, 7), cut: cut };
}
/* เลื่อนรอบไปข้างหน้า/ถอยหลังทีละรอบ — เดินผ่านวันจริง ไม่ใช่บวกเดือน จึงไม่มีรอบหายหรือซ้ำ */
function tmPeriodShift(p, n, cfg) {
  let cur = p || tmPeriodOf(window.drToday(), cfg);
  let k = Math.round(+n || 0);
  while (k > 0) { cur = tmPeriodOf(tmNextDay(cur.to), cfg); k -= 1; }
  while (k < 0) { cur = tmPeriodOf(tmPrevDay(cur.from), cfg); k += 1; }
  return cur;
}
const tmInPeriod = (dateISO, p) => {
  const s = String(dateISO || "").slice(0, 10);
  return !!p && !!s && s >= p.from && s <= p.to;
};
/* ชื่อรอบบนหน้าจอและบนกระดาษ — พ.ศ. ตอนแสดงเท่านั้น */
function tmPeriodTH(p) {
  if (!p) return "—";
  if (!p.cut) return tmYmTH(p.key);
  return window.drDateTH(p.from) + " – " + window.drDateTH(p.to);
}
function tmIsWorkday(dateISO, cfg) {
  const c = tmWhNorm(cfg);
  if (c.holidays[String(dateISO || "").slice(0, 10)]) return false;
  const d = new Date(String(dateISO || "").slice(0, 10) + "T00:00:00");
  if (isNaN(d.getTime())) return true;
  return c.days.indexOf(d.getDay()) >= 0;
}

/* ── ช่วง "เวลางานปกติ" ของวันหนึ่ง — คิดจากเวลาที่กดเข้าจริง ──
   กดเข้าก่อน 08:30 ไม่ทำให้เลิกเร็วขึ้น ไม่งั้นจะมีคนมาตีห้าเพื่อกลับบ่ายสอง
   กดเข้าหลัง 09:00 เลื่อนเวลาเลิกออกไปตามจริง เพราะหน้าที่คือ "ทำให้ครบ 8 ชม."
   ไม่ใช่ "อยู่ถึงห้าโมง" — มาสายแล้วได้กลับเวลาเดิมเท่ากับทำงานน้อยกว่าคนอื่นฟรี ๆ
   วันที่ยังไม่มีใบลงเวลา (เช่นคนกรอกใบ OT ล่วงหน้า) ใช้ช่วงอนุมานจากค่าตั้ง */
function tmDayWindow(rec, cfg) {
  const c = tmWhNorm(cfg);
  const lo = tmHM(c.startEarly), hi = tmHM(c.startLate);
  const inHM = rec && rec.in && rec.in.hm ? tmHM(rec.in.hm) : null;
  const base = inHM == null ? lo : Math.max(inHM, lo);
  const end = base + c.workMins + c.lunchMins;
  return {
    startMins: base, endMins: end,
    start: tmHHMM(base), end: tmHHMM(end),
    inMins: inHM, late: inHM != null && inHM > hi,
    lateMins: inHM != null && inHM > hi ? inHM - hi : 0,
    cfg: c,
  };
}

/* ── ประเภทของ OT ──
   แยกประเภทเพราะอัตราค่าตอบแทนต่างกันตามกฎหมายแรงงาน แต่ **ไฟล์นี้ไม่คิดเงิน**
   ตั้งใจ: อัตราค่าแรงของแต่ละคนไม่ได้อยู่ในระบบนี้ และการเดาแทนฝ่ายบุคคลอันตรายกว่าไม่บอกเลย
   ระบบนี้ตอบแค่ "ใครทำนอกเวลากี่นาที เมื่อไหร่ ที่ไหน และใครอนุมัติ" */
const TM_OT_KIND = [
  { key: "ot",      th: "ล่วงเวลาวันทำงาน", color: "#F59E0B", hint: "ทำต่อหลังเลิกงาน หรือมาก่อนเวลา" },
  { key: "holiday", th: "ทำงานวันหยุด",     color: "#EF4444", hint: "เสาร์-อาทิตย์ หรือวันหยุดที่บริษัทประกาศ" },
  /* กฎหมายแยกสองอัตราในวันหยุด — ช่วงเท่าเวลางานปกติอัตราหนึ่ง ส่วนที่เกินไปอีกอัตราหนึ่ง
     ระบบเดาให้ไม่ได้ เพราะวันหยุดไม่มี "เวลางานปกติ" ให้เทียบ ผู้ขอเลือกเองเมื่อทำเกินวันปกติ */
  { key: "holidayOt", th: "ล่วงเวลาในวันหยุด", color: "#B91C1C", hint: "วันหยุดที่ทำเกินชั่วโมงงานปกติไปอีก" },
  { key: "night",   th: "งานกลางคืน",       color: "#6366F1", hint: "งานที่ต้องทำหลังพระอาทิตย์ตกถึงเช้า" },
];
const TM_OT_KIND_BY = {}; TM_OT_KIND.forEach((k) => { TM_OT_KIND_BY[k.key] = k; });
const tmOtKindOf = (k) => TM_OT_KIND_BY[k] || TM_OT_KIND_BY.ot;

/* ── ตัวคูณค่าแรงของใบหนึ่ง ──
   ใบเก่าที่เก็บ rate ติดตัวไว้แล้วให้ยึดของตัวเอง ไม่ใช่ค่าตั้งปัจจุบัน
   (แอดมินปรับอัตราวันนี้ ต้องไม่ย้อนไปเปลี่ยนใบที่หัวหน้าเซ็นไปแล้วเมื่อเดือนก่อน) */
function tmOtRate(recOrKind, cfg) {
  if (recOrKind && typeof recOrKind === "object" && recOrKind.rate != null && +recOrKind.rate >= 0) return +recOrKind.rate;
  const key = recOrKind && typeof recOrKind === "object" ? recOrKind.kind : recOrKind;
  const r = tmWhNorm(cfg).otRates[tmOtKindOf(key).key];
  return r == null ? 1 : r;
}
/* นาทีคิดค่าแรง = นาทีจริง × ตัวคูณ — ฝ่ายบุคคลเอาไปคูณอัตราต่อชั่วโมงของคนนั้นได้เลย
   ระบบไม่คูณเป็นเงินให้ เพราะค่าจ้างรายคนไม่ได้อยู่ในระบบนี้ (ดูหมายเหตุที่ TM_OT_KIND) */
const tmOtPayMins = (rec, cfg) => Math.round((+((rec || {}).mins) || 0) * tmOtRate(rec, cfg));
const tmRateTH = (r) => (Math.round((+r || 0) * 100) / 100).toString().replace(/\.00$/, "") + " เท่า";

/* เดาประเภทให้จากวันที่ — เดาเฉย ๆ ช่างแก้ทับได้เสมอ */
function tmOtKindGuess(dateISO, from, cfg) {
  if (!tmIsWorkday(dateISO, cfg)) return "holiday";
  const a = tmHM(from);
  if (a != null && (a >= 20 * 60 || a < 5 * 60)) return "night";
  return "ot";
}

/* ── นาที OT = เวลาที่อยู่ "นอก" เวลางานมาตรฐาน ──
   วันหยุด/วันไม่ทำงาน = นับทั้งช่วง · วันทำงาน = ตัดส่วนที่ทับเวลางานออก
   ปัดลงเป็นช่วงละ roundMins แล้วตัดทิ้งถ้าไม่ถึง minOtMins
   ปัด "ลง" ตั้งใจ — ปัดขึ้นทำให้บริษัทจ่ายเกินจริงทุกใบ และคนจะเริ่มยืดเวลาให้ถึงขั้นถัดไป */
function tmOtMinutes(dateISO, from, to, cfg, win) {
  const c = tmWhNorm(cfg);
  const span = tmSpanMins(from, to);
  if (span <= 0) return 0;

  let outside = span;
  if (tmIsWorkday(dateISO, c)) {
    /* win = ช่วงเวลางานจริงของวันนั้นจาก tmDayWindow — ส่งมาเมื่อมีใบลงเวลาให้อ้างอิง
       ไม่ส่งมาก็ถอยไปใช้ช่วงอนุมานจากค่าตั้ง (คนกรอกใบล่วงหน้าก่อนถึงวันนั้น) */
    const ws = win && win.startMins != null ? win.startMins : tmHM(c.start);
    const we = win && win.endMins != null ? win.endMins : tmHM(c.end);
    const a = tmHM(from);
    /* คิดบนแกนนาทีที่ยืดข้ามเที่ยงคืนได้ แล้วหาส่วนที่ทับกับเวลางานของวันนั้น */
    const s = a, e = a + span;
    const lo = Math.max(s, ws), hi = Math.min(e, we);
    outside = span - Math.max(0, hi - lo);
  }
  if (c.roundMins > 0) outside = Math.floor(outside / c.roundMins) * c.roundMins;
  return outside >= c.minOtMins ? outside : 0;
}

/* ================================================================
   ใบลงเวลา
   ================================================================ */

/* ชั่วโมงทำงานของใบหนึ่ง — หักพักกลางวันเฉพาะช่วงที่คร่อมมันจริง ๆ
   คนที่เข้าบ่ายโมงเลิกห้าโมงไม่ควรโดนหักข้าวเที่ยง ซึ่งเป็นบั๊กคลาสสิกของระบบลงเวลา */
function tmWorkedMins(rec, cfg, nowHM) {
  const c = tmWhNorm(cfg);
  const spans = [];
  /* nowHM = "นับกะที่ยังไม่ปิดถึงเวลานี้" — หน้าจอมือถือส่งเวลาปัจจุบันเข้ามาเพื่อเดินตัวเลขสด
     ไม่ส่งมาก็นับเฉพาะกะที่ปิดแล้ว ซึ่งเป็นพฤติกรรมเดิมของทุกที่ที่เรียกอยู่ */
  const push = (s) => {
    if (!s || !s.in || !s.in.hm) return;
    const b = (s.out && s.out.hm) || nowHM || null;
    if (b) spans.push([s.in.hm, b]);
  };
  push(rec);
  (rec && Array.isArray(rec.extra) ? rec.extra : []).forEach(push);
  let total = 0;
  spans.forEach(([a, b]) => {
    let m = tmSpanMins(a, b);
    /* พักกลางวันสมมติว่าอยู่กลางช่วงเวลางาน — หักเมื่อช่วงนั้นกินเวลาเกิน 6 ชม.
       ซึ่งแปลว่าคร่อมเที่ยงแน่ ๆ ไม่ว่าจะเริ่มกี่โมง */
    if (c.lunchMins > 0 && m > 360) m -= c.lunchMins;
    total += Math.max(0, m);
  });
  return total;
}

/* วันนี้ยังไม่ได้กดออกหรือเปล่า
   ⚠ ต้องดู extra ด้วย ไม่ใช่แค่ rec.in/rec.out — เดิมดูแค่คู่แรก ปุ่มบนมือถือจึงค้าง
   อยู่ที่ "ลงเวลาเข้างาน" ทั้งที่มีกะเปิดค้างอยู่ กดอีกทีก็เปิดกะใหม่ซ้อนไปเรื่อย ๆ
   จนชั่วโมงรวมบวมเป็นห้าสิบแปดชั่วโมงในวันเดียว */
const tmOpen = (rec) => {
  if (!rec || !rec.in || !rec.in.hm) return false;
  const ex = Array.isArray(rec.extra) ? rec.extra : [];
  if (ex.some((x) => x && x.in && x.in.hm && !(x.out && x.out.hm))) return true;
  return !(rec.out && rec.out.hm);
};

/* เวลาปั๊มล่าสุดของใบ — กะเพิ่มมาทีหลังเสมอ จึงดูกะสุดท้ายก่อน */
function tmLastHM(rec, nowHM) {
  if (!rec || !rec.in || !rec.in.hm) return "";
  const ex = Array.isArray(rec.extra) ? rec.extra : [];
  const last = ex.length ? ex[ex.length - 1] : null;
  if (last && last.in && last.in.hm) return (last.out && last.out.hm) || nowHM || "";
  return (rec.out && rec.out.hm) || nowHM || "";
}

/* ── OT ที่ "ทำไปแล้วจริง" ของวันนั้น ตามใบลงเวลา ──
   คืนเป็นช่วงเวลา ไม่ใช่แค่จำนวนนาที เพราะฟอร์มขอ OT ต้องเอาไปล็อกไม่ให้ขอเกินที่ทำจริง
   ระบบ **ไม่เปิดใบให้เอง** — ทำเกินเวลาแล้วจะขอหรือไม่ขอเป็นสิทธิ์ของเจ้าตัว
   lo/hi = ขอบนอกสุดที่ยอมให้กรอก (เวลาเข้าจริง ถึง เวลาปั๊มล่าสุด) */
function tmOtEarned(rec, cfg, nowHM) {
  const c = tmWhNorm(cfg);
  const none = { has: false, mins: 0, before: 0, after: 0, from: "", to: "", lo: "", hi: "", date: "" };
  if (!rec || !rec.in || !rec.in.hm) return none;
  const endHM = tmLastHM(rec, nowHM);
  if (!endHM) return none;

  const w = tmDayWindow(rec, cfg);
  const inM = w.inMins;
  const outAbs = inM + tmSpanMins(rec.in.hm, endHM);   /* แกนนาทีที่ยืดข้ามเที่ยงคืนได้ */
  const round = (m) => (c.roundMins > 0 ? Math.floor(Math.max(0, m) / c.roundMins) * c.roundMins : Math.max(0, m));
  const keep = (m) => (m >= c.minOtMins ? m : 0);
  const base = { has: true, lo: rec.in.hm, hi: tmHHMM(outAbs), date: rec.date || "" };

  /* วันหยุด/วันไม่ทำงาน — อยู่ที่ทำงานนาทีไหนก็เป็น OT นาทีนั้น ไม่มีช่วงงานปกติให้ตัดออก */
  if (!tmIsWorkday(rec.date, c)) {
    const all = keep(round(outAbs - inM));
    return Object.assign(base, { mins: all, before: 0, after: all, from: rec.in.hm, to: tmHHMM(outAbs) });
  }

  const before = keep(round(w.startMins - inM));   /* มาก่อนเวลาเปิดงาน */
  const after = keep(round(outAbs - w.endMins));   /* อยู่ต่อหลังเวลาเลิก */
  /* เสนอช่วงที่ยาวกว่าเป็นค่าตั้งต้นของฟอร์ม — เกือบทั้งหมดคือช่วงหลังเลิกงาน
     อีกช่วงยังกรอกเองได้ ตราบใดที่ยังอยู่ใน lo–hi และไม่ทับเวลางานปกติ */
  const useAfter = after >= before;
  return Object.assign(base, {
    mins: useAfter ? after : before, before: before, after: after,
    from: useAfter ? w.end : rec.in.hm,
    to: useAfter ? tmHHMM(outAbs) : w.start,
  });
}

/* ช่วงที่กรอกอยู่ในเวลาที่ "อยู่ที่ทำงานจริง" หรือเปล่า
   ใบของวันอื่นไม่ล็อก — ออฟฟิศต้องแก้ใบย้อนหลังได้ และเราไม่มีใบลงเวลาวันนั้นอยู่ในมือ */
function tmOtInLimit(date, from, to, lim) {
  if (!lim || !lim.has || !lim.date || date !== lim.date) return true;
  const lo = tmHM(lim.lo), hi = tmHM(lim.lo) + tmSpanMins(lim.lo, lim.hi);
  const a = tmHM(from);
  if (a == null || lo == null) return false;
  const s = a < lo ? a + 1440 : a;
  return s >= lo && s + tmSpanMins(from, to) <= hi;
}

function tmAttendBlank(user, dateISO) {
  return {
    id: (user || {}).id + "_" + dateISO,
    userId: (user || {}).id || null, userName: (user || {}).name || "",
    techId: (user || {}).techId || null,
    date: dateISO, in: null, out: null, extra: [],
    jobId: null, jobCode: "", note: "", mins: 0,
    src: "web", hist: [], updatedAt: new Date().toISOString(),
  };
}

/* ปั๊มเวลาหนึ่งครั้ง — พิกัดเป็นของแถม ไม่ใช่เงื่อนไข
   gps ที่ส่งเข้ามาคือผลจาก window.captureGps() ซึ่งคืน { err, msg } เมื่อจับไม่ได้ */
/* ที่ลงเวลา — ช่างส่วนใหญ่อยู่หน้างาน แต่คนที่เข้าออฟฟิศทั้งวันก็ต้องลงเวลาเหมือนกัน
   เก็บเป็นคำบอกของคนกด เหมือน jobId — ระบบยังไม่มีพิกัดออฟฟิศให้เทียบ */
const TM_PLACE = [
  { key: "site",   th: "หน้างาน", icon: "wrench" },
  { key: "office", th: "ออฟฟิศ",  icon: "box" },
];
const tmPlaceOf = (k) => TM_PLACE.find((p) => p.key === k) || TM_PLACE[0];

function tmPunch(gps, src, place) {
  const d = new Date();
  const p = {
    at: d.toISOString(),
    hm: window.drPad2(d.getHours()) + ":" + window.drPad2(d.getMinutes()),
    src: src || "web",
    place: tmPlaceOf(place).key,
  };
  if (gps && !gps.err) { p.lat = gps.lat; p.lng = gps.lng; p.acc = gps.acc || 0; }
  /* เก็บเหตุผลไว้ด้วยว่าทำไมไม่มีพิกัด — ใบที่ไม่มีพิกัด "เฉย ๆ" กับใบที่ผู้ใช้ปฏิเสธสิทธิ์
     เป็นคนละเรื่องกันโดยสิ้นเชิงตอนออฟฟิศมาตรวจย้อนหลัง */
  else if (gps && gps.err) { p.err = gps.err; }
  return p;
}

/* ดัชนีเบาสำหรับแผ่นรายวัน — ตั้งใจเก็บซ้ำ เพราะหน้ารวมต้องไม่ลาก attend ทั้งต้นไม้มาอ่าน */
const tmDayIndex = (rec, cfg) => ({
  userId: rec.userId, name: rec.userName || "", techId: rec.techId || null,
  in: (rec.in && rec.in.hm) || "", out: (rec.out && rec.out.hm) || "",
  mins: tmWorkedMins(rec, cfg),
  gps: !!(rec.in && rec.in.lat), jobCode: rec.jobCode || "",
  place: (rec.in && rec.in.place) || rec.place || "",
});

/* ================================================================
   ใบขอ OT — ลอกโครงสถานะจาก EC_STATUS (expense.jsx) ตั้งใจให้เหมือนกัน
   คนใช้เรียนรู้ครั้งเดียวใช้ได้สองที่ และโค้ดที่เดินสถานะมีรูปแบบเดียว
   ================================================================ */
const TM_OT_STATUS = [
  { key: "draft",     th: "ร่าง",        color: "#94A3B8", next: ["sent", "cancelled"] },
  /* sent → draft คือ "ตีกลับให้แก้" ของคนอนุมัติ และ "เอากลับมาแก้" ของเจ้าของใบ
     ต้องมีทางนี้ ไม่งั้นใบที่กรอกเวลาผิดนิดเดียวต้องถูกปัดตกเป็น "ไม่อนุมัติ"
     ซึ่งอ่านย้อนหลังแล้วเหมือนคนนั้นถูกปฏิเสธ ทั้งที่แค่พิมพ์ผิด */
  { key: "sent",      th: "รออนุมัติ",   color: "#F59E0B", next: ["approved", "rejected", "draft", "cancelled"] },
  { key: "approved",  th: "อนุมัติแล้ว", color: "#10B981", next: [] },
  { key: "rejected",  th: "ไม่อนุมัติ",  color: "#EF4444", next: ["draft"] },
  { key: "cancelled", th: "ยกเลิกแล้ว",  color: "#64748B", next: ["draft"] },
];
const TM_OT_STATUS_BY = {}; TM_OT_STATUS.forEach((s) => { TM_OT_STATUS_BY[s.key] = s; });
const tmOtStatusOf = (k) => TM_OT_STATUS_BY[k] || TM_OT_STATUS_BY.draft;
const tmOtOpen = (r) => { const k = ((r || {}).status) || "draft"; return k === "draft" || k === "sent"; };

/* ── สิทธิ์ ──
   ⚠ คีย์สิทธิ์ห้ามมีจุด — มันถูกเก็บเป็นคีย์ใน Firebase (rolePerms/{role}/perms/{key})
     และ RTDB ไม่ยอมรับ . $ # [ ] / ในชื่อคีย์ ถ้าใช้ "attend.use" การบันทึกหน้าสิทธิ์จะล้มทั้งหน้า */
const tmCanAttend    = (role) => window.can(role, "attend");
const tmCanAttendAll = (role) => window.can(role, "attendAll");
const tmCanOt        = (role) => window.can(role, "ot");
const tmCanOtApprove = (role) => window.can(role, "otApprove");

/* ใช้สายอนุมัติเดิม (user.approverId) ไม่สร้างชุดที่สอง —
   ถ้าแยกกัน วันที่หัวหน้าลาออกจะต้องไล่แก้สองที่ และจะมีที่หนึ่งถูกลืมเสมอ */
function tmOtApproveCheck(rec, user, role) {
  if (!rec || !user) return { ok: false, why: "" };
  if (!tmCanOtApprove(role)) return { ok: false, why: "ไม่มีสิทธิ์อนุมัติใบ OT" };
  if (rec.userId && rec.userId === user.id) return { ok: false, why: "อนุมัติใบของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ" };
  if (rec.approverId && rec.approverId !== user.id && !window.hasRole(role, "admin")) {
    return { ok: false, why: "ใบนี้ส่งถึง " + (rec.approverName || "คนอื่น") + " โดยตรง" };
  }
  /* ไม่มีเพดานเหมือนใบเบิกเงิน เพราะนี่คือชั่วโมง ไม่ใช่จำนวนเงิน
     คนอนุมัติชั่วโมงคือคนที่รู้ว่างานนั้นจำเป็นต้องทำจริงไหม ซึ่งไม่เกี่ยวกับวงเงิน */
  return { ok: true, why: "" };
}

function tmOtNext(rec, role, user) {
  const cur = tmOtStatusOf((rec || {}).status);
  const mine = rec && user && rec.userId === user.id;
  const appr = tmOtApproveCheck(rec, user, role).ok;
  return (cur.next || []).filter((k) => {
    if (k === "sent")      return mine;
    if (k === "approved")  return appr;
    if (k === "rejected")  return appr;
    /* ยกเลิกเป็นสิทธิ์ของเจ้าของใบเท่านั้น — คนอนุมัติที่ไม่เห็นด้วยต้องตีกลับหรือไม่อนุมัติ
       ซึ่งทิ้งร่องรอยว่าใครตัดสิน ต่างจากยกเลิกที่แปลว่า "เจ้าตัวไม่ขอแล้ว" */
    if (k === "cancelled") return mine;
    if (k === "draft")     return mine || appr;
    return false;
  }).map((k) => TM_OT_STATUS_BY[k]);
}

/* เดินสถานะ = คืนเรคคอร์ดใหม่พร้อมต่อประวัติ ไม่เขียนฐานข้อมูลเอง
   (ให้ที่เรียกเป็นคนเขียน จะได้ทดสอบตรรกะได้โดยไม่ต้องมี Firebase) */
function tmOtMove(rec, to, user, note) {
  if (!rec) return null;
  const now = new Date().toISOString();
  const out = Object.assign({}, rec, { status: to, updatedAt: now });
  const txt = (note && typeof note === "object" ? note.text : note) || "";
  out.hist = (rec.hist || []).concat([{
    at: now, from: rec.status || "draft", to: to,
    by: (user || {}).id || null, byName: (user || {}).name || "", note: txt,
  }]);
  if (to === "sent") out.sentAt = now;
  if (to === "cancelled") {
    out.cancelledAt = now;
    out.cancelNote = txt;
  }
  if (to === "approved" || to === "rejected") {
    out.decidedAt = now; out.decidedNote = txt;
    out.decidedById = (user || {}).id || null; out.decidedByName = (user || {}).name || "";
  }
  /* ตีกลับมาแก้ = ล้างผลตัดสินเดิมทิ้ง ไม่งั้นใบจะโชว์ว่า "ไม่อนุมัติโดย X" ทั้งที่ยังเป็นร่างอยู่
     (กฎเดียวกับ ecMove — ถ้าลืมข้อนี้ ใบที่เดินวนรอบสองจะอ่านไม่รู้เรื่อง) */
  if (to === "draft") {
    out.decidedAt = null; out.decidedNote = ""; out.decidedById = null; out.decidedByName = "";
    out.cancelledAt = null; out.cancelNote = "";
  }
  return out;
}

/* เลขที่ใบ — OT-6809-0007 (ปี พ.ศ. สองหลัก + เดือน + ลำดับในเดือนนั้น) */
function tmOtDocNo(list, dateISO) {
  const d = String(dateISO || window.drToday());
  const be = String(+d.slice(0, 4) + 543).slice(2);
  const ym = be + d.slice(5, 7);
  const n = (list || []).filter((r) => r && String(r.no || "").indexOf("OT-" + ym) === 0).length + 1;
  return "OT-" + ym + "-" + window.drPad2(n);
}

/* ── ใครกดอนุมัติใบ OT ได้บ้าง ──
   เอาไว้ให้เลือกตอนเปิดใบ ไม่ใช่ปล่อยให้ใบลอยอยู่ในกองกลาง
   ใบที่ไม่มีชื่อคนอนุมัติ = ทุกคนคิดว่าเป็นหน้าที่คนอื่น แล้วใบก็ค้างจนเจ้าตัวลืม
   ตัดตัวเองออกเสมอ เพราะ tmOtApproveCheck ห้ามอนุมัติใบตัวเองอยู่แล้ว */
function tmOtApprovers(users, forUser) {
  const skip = (forUser || {}).id || null;
  return (users || [])
    .filter((u) => u && u.id && u.active !== false && u.id !== skip
      && window.can(window.userRoles(u), "otApprove"))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
}

/* คนอนุมัติตั้งต้นของใบใหม่ — ใช้สายอนุมัติในโปรไฟล์ก่อน
   ถ้าคนนั้นไม่มีสิทธิ์อนุมัติ OT (หรือไม่ได้ตั้งไว้) แล้วทั้งบริษัทมีคนอนุมัติได้คนเดียว
   ก็เลือกให้เลย — ไม่มีอะไรให้ตัดสินใจ แต่ยังแก้ได้ถ้าอยากส่งให้คนอื่น */
function tmOtPickApprover(user, users) {
  const all = tmOtApprovers(users, user);
  const mine = ((user || {}).approverId && all.find((u) => u.id === user.approverId)) || null;
  if (mine) return mine;
  return all.length === 1 ? all[0] : null;
}

function tmOtBlank(user, users, list, job, cfg) {
  const now = new Date().toISOString();
  const date = window.drToday();
  const approver = tmOtPickApprover(user, users);
  return {
    id: "OT-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: tmOtDocNo(list, date),
    userId: (user || {}).id || null, userName: (user || {}).name || "",
    techId: (user || {}).techId || null,
    jobId: (job || {}).id || null, jobCode: (job || {}).code || "",
    date, from: "17:00", to: "20:00", mins: 0,
    kind: tmOtKindGuess(date, "17:00", cfg), reason: "",
    /* ถ่ายตัวคูณ ณ วันที่เปิดใบติดไว้ในใบ — อัตราที่หัวหน้าเซ็นอนุมัติต้องไม่เปลี่ยนย้อนหลัง
       ตอนเปลี่ยนประเภทในฟอร์ม ตัวคูณจะถูกเขียนทับให้ตรงกับประเภทใหม่ (ดู TmOtModal) */
    rate: tmOtRate(tmOtKindGuess(date, "17:00", cfg), cfg),
    /* ชื่อคนอนุมัติถ่ายสำเนาไว้ตอนเปิดใบ เพื่อให้ใบเก่ายังอ่านออกแม้บัญชีนั้นถูกลบทีหลัง */
    approverId: (approver || {}).id || null, approverName: (approver || {}).name || "",
    status: "draft", createdAt: now, hist: [],
  };
}

/* ── ชื่อคนบนหน้าจอ ──
   ใบลงเวลาและใบ OT ถ่ายสำเนาชื่อไว้ตอนสร้าง (attendDay ช่อง name · tmOt ช่อง userName)
   สำเนานั้นมีไว้ให้ใบเก่ายังอ่านออกแม้บัญชีถูกลบ — แต่มัน **ไม่ตามการเปลี่ยนชื่อ**
   แก้ชื่อในหน้าผู้ใช้แล้ว ตารางเวลายังขึ้นชื่อเดิมค้างอยู่ ดูเหมือนเป็นคนละคน

   เวลาแสดงผลจึงต้องถามทะเบียนผู้ใช้ก่อนเสมอ แล้วค่อยตกมาที่สำเนาในใบ
   (ไม่ไล่แก้ข้อมูลเก่าในฐาน เพราะสำเนานั้นถูกของมันแล้ว — มันคือชื่อ ณ วันที่ปั๊ม
    และเอกสารที่เซ็นไปแล้วต้องคงชื่อตอนเซ็นไว้ ห้ามให้ย้อนหลังเปลี่ยนตาม) */
function tmNameOf(users, id, fallback) {
  if (!id) return fallback || "";
  const u = (users || []).find((x) => x && x.id === id);
  return (u && u.name) || fallback || id;
}

/* ── ขอบเขตการมองเห็น ──
   คนที่ไม่มีสิทธิ์อนุมัติเห็นเฉพาะใบของตัวเอง — กรองที่ชั้นข้อมูล ไม่ใช่ซ่อนปุ่มบนหน้าจอ
   (กฎเดียวกับ ecVisible — เวลาทำงานของคนอื่นเป็นข้อมูลส่วนบุคคล) */
function tmOtVisible(list, user, role) {
  if (tmCanOtApprove(role) || tmCanAttendAll(role)) return list || [];
  const uid = (user || {}).id || null;
  return (list || []).filter((r) => r && r.userId === uid);
}

function tmOtRollup(list, user, role) {
  const r = { total: 0, draft: 0, sent: 0, approved: 0, rejected: 0, cancelled: 0,
    waitingMine: 0, minsApproved: 0, mineOpen: 0 };
  (list || []).forEach((x) => {
    if (!x) return;
    r.total += 1;
    const k = x.status || "draft";
    if (r[k] != null) r[k] += 1;
    if (k === "sent" && tmOtApproveCheck(x, user, role).ok) r.waitingMine += 1;
    if (k === "approved") r.minsApproved += Math.max(0, +x.mins || 0);
    if (user && x.userId === user.id && tmOtOpen(x)) r.mineOpen += 1;
  });
  return r;
}

/* ================================================================
   hooks
   ================================================================ */

/* ใบลงเวลาของ "คนเดียว" — หน้ามือถือกับการ์ดในโปรไฟล์ใช้ตัวนี้
   ฟังเฉพาะใต้ userId ของตัวเอง ไม่ใช่ทั้ง attend/ ซึ่งจะโตขึ้นทุกวันไม่มีเพดาน */
function useAttend(userId, days) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const n = Math.max(1, +days || 45);

  React.useEffect(() => {
    if (!userId || !_TMFB()) { setRows([]); setLoading(false); return; }
    const ref = _tmRef("attend/" + userId).orderByKey().limitToLast(n);
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ date: k }, v[k]));
      arr.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      setRows(arr); setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [userId, n]);

  return { rows, loading, today: rows.find((r) => r.date === window.drToday()) || null };
}

/* แผ่นเวลารายวันของทั้งบริษัท — อ่านจากดัชนีเบา ไม่ใช่ต้นไม้ใบเต็ม */
function useAttendDay(dateISO) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!dateISO || !_TMFB()) { setRows([]); setLoading(false); return; }
    const ref = _tmRef("attendDay/" + dateISO);
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ userId: k }, v[k]));
      arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
      setRows(arr); setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [dateISO]);
  return { rows, loading };
}

/* เขียนใบลงเวลา — คืนฟังก์ชันปั๊มเข้า/ออก ที่ **ไม่เคยปฏิเสธเพราะไม่มีพิกัด** */
function useAttendWriter(user, cfg) {
  const uid = (user || {}).id || null;

  const punch = React.useCallback(async (which, opt) => {
    if (!uid || !_TMFB()) return { ok: false, why: "ยังเชื่อมต่อฐานข้อมูลไม่ได้" };
    const o = opt || {};
    const date = window.drToday();
    const gps = o.skipGps ? { err: "skipped" } : await window.captureGps();
    const p = tmPunch(gps, o.src || "web", o.place);

    const snap = await _tmRef("attend/" + uid + "/" + date).once("value").catch(() => null);
    const cur = (snap && snap.val()) || tmAttendBlank(user, date);
    const rec = Object.assign({}, tmAttendBlank(user, date), cur);

    if (which === "in") {
      /* หนึ่งวัน = เข้าครั้งเดียว ออกครั้งเดียว
         เดิมกดเข้าซ้ำหลังปิดวันแล้วจะเปิด "กะที่สอง" ให้ ซึ่งการ์ดลงเวลาไม่แสดงเลย
         คนกดจึงไม่เห็นว่ามีอะไรเกิดขึ้น กดซ้ำอีก แล้วชั่วโมงรวมก็บวมขึ้นเงียบ ๆ
         กดออกผิดเวลาให้ใช้ redo ทับ ไม่ใช่เปิดกะใหม่ */
      if (tmOpen(rec)) return { ok: false, why: "ลงเวลาเข้างานไปแล้วเมื่อ " + rec.in.hm, rec };
      if (rec.in && rec.in.hm) return { ok: false, why: "วันนี้ลงเวลาครบแล้ว " + rec.in.hm + " – " + ((rec.out && rec.out.hm) || "?") + " · ถ้ากดออกผิดเวลา ใช้ปุ่มกดออกงานใหม่", rec };
      rec.in = p;
    } else {
      const ex = rec.extra || [];
      /* กะที่เปิดค้างมาจากใบเก่าก่อนเลิกใช้ระบบกะเพิ่ม — ปิดให้หมดในครั้งเดียว
         ปิดทีละกะแปลว่าคนกดต้องกดเท่าจำนวนกะที่ตัวเองไม่รู้ว่ามี */
      let closed = false;
      ex.forEach((x, i) => {
        if (x && x.in && x.in.hm && !(x.out && x.out.hm)) { ex[i] = Object.assign({}, x, { out: p }); closed = true; }
      });
      if (closed) { /* ปิดครบแล้ว */ }
      else if (rec.in && rec.in.hm && !(rec.out && rec.out.hm)) rec.out = p;
      else if (rec.in && rec.in.hm && o.redo) {
        /* กดออกงานผิดเวลา — เขียนทับครั้งล่าสุด ไม่ใช่เปิดกะใหม่
           ต่างจากเวลาเข้างานตรงที่แก้ไม่ได้เด็ดขาด — เวลาออกกดพลาดได้ง่ายกว่าเยอะ
           เพราะคนกดตอนจะกลับ และกดไปแล้วก็เห็นทันทีว่าผิด แต่แก้เองไม่ได้ */
        const lastIdx = ex.map((x, i) => (x && x.in && x.in.hm ? i : -1)).filter((i) => i >= 0).pop();
        const inHM = lastIdx >= 0 ? ex[lastIdx].in.hm : rec.in.hm;
        if (tmSpanMins(inHM, p.hm) <= 0) return { ok: false, why: "เวลาออกงานต้องอยู่หลังเวลาเข้างาน " + inHM, rec };
        /* เก็บค่าเก่าไว้ในปั๊มใหม่ เป็นร่องรอยว่าเคยกดออกไว้กี่โมง แล้วมาแก้ทีหลัง */
        const prev = lastIdx >= 0 ? ex[lastIdx].out : rec.out;
        const fix = Object.assign({}, p, { redoOf: (prev && prev.hm) || "" });
        if (lastIdx >= 0) ex[lastIdx] = Object.assign({}, ex[lastIdx], { out: fix });
        else rec.out = fix;
      }
      else return { ok: false, why: "ยังไม่ได้ลงเวลาเข้างานของวันนี้", rec };
      rec.extra = ex;
    }

    if (o.jobId !== undefined) { rec.jobId = o.jobId || null; rec.jobCode = o.jobCode || ""; }
    if (o.place !== undefined) rec.place = tmPlaceOf(o.place).key;
    if (o.note !== undefined) rec.note = o.note || "";
    rec.src = o.src || rec.src || "web";
    rec.mins = tmWorkedMins(rec, cfg);
    rec.updatedAt = new Date().toISOString();
    rec.hist = (rec.hist || []).concat([{ at: rec.updatedAt, what: which === "out" && o.redo ? "out-fix" : which, hm: p.hm, gps: !p.err }]);

    /* เขียนใบกับดัชนีในคำสั่งเดียว — ถ้าแยกสองคำสั่งแล้วเน็ตหลุดกลางทาง
       แผ่นรายวันของออฟฟิศจะไม่ตรงกับใบจริง โดยไม่มีใครรู้ */
    const patch = {};
    patch["attend/" + uid + "/" + date] = rec;
    patch["attendDay/" + date + "/" + uid] = tmDayIndex(rec, cfg);
    await _tmRoot().update(patch);
    return { ok: true, rec, punch: p };
  }, [uid, user, cfg]);

  return { punch };
}

/* ── ลบใบลงเวลาทั้งใบ (สำหรับแอดมิน) ──
   ช่างแก้เวลาของตัวเองไม่ได้โดยตั้งใจ เพราะใบลงเวลาคือหลักฐานค่าแรง —
   กดผิดเวลาจึงต้องมีคนที่เห็นทั้งบริษัทเป็นคนลบให้

   ⚙ ลบทั้งใบจริงและดัชนีในคำสั่งเดียว ถ้าแยกสองคำสั่งแล้วเน็ตหลุดกลางทาง
     แผ่นรายวันของออฟฟิศจะไม่ตรงกับใบจริง โดยไม่มีใครรู้
   เก็บสำเนาใบที่ลบไว้ที่ attendVoid — การลบข้อมูลค่าแรงต้องมีร่องรอยเสมอ
   ว่าใครลบของใครตอนไหน ไม่งั้นข้อโต้เถียงเรื่องชั่วโมงตอนสิ้นเดือนจะไม่มีทางพิสูจน์ */
function useAttendAdmin(actor) {
  const removeDay = React.useCallback(async (userId, date) => {
    if (!userId || !date) return { ok: false, why: "ข้อมูลไม่ครบ" };
    if (!_TMFB()) return { ok: false, why: "ยังเชื่อมต่อฐานข้อมูลไม่ได้" };
    const snap = await _tmRef("attend/" + userId + "/" + date).once("value").catch(() => null);
    const old = (snap && snap.val()) || null;
    const patch = {};
    patch["attend/" + userId + "/" + date] = null;
    patch["attendDay/" + date + "/" + userId] = null;
    patch["attendVoid/" + date + "/" + userId] = {
      at: new Date().toISOString(),
      byId: (actor || {}).id || null, byName: (actor || {}).name || "",
      rec: old,
    };
    await _tmRoot().update(patch);
    return { ok: true, rec: old };
  }, [actor]);

  return { removeDay };
}

/* ใบ OT — แบน อ่านทั้งต้นไม้ได้ (ใบละไม่กี่ร้อยไบต์ ไม่มีรูป) */
function useOtClaims() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!_TMFB()) { setLoading(false); return; }
    const ref = _tmRef("tmOt");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ id: k }, v[k]));
      arr.sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))
        || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setRows(arr); setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);

  const save = React.useCallback((r) => {
    if (!r || !r.id || !_TMFB()) return;
    _tmRef("tmOt/" + r.id).set(Object.assign({}, r, { updatedAt: new Date().toISOString() }));
  }, []);
  const patch = React.useCallback((id, fields) => {
    if (!id || !_TMFB()) return;
    _tmRef("tmOt/" + id).update(Object.assign({}, fields, { updatedAt: new Date().toISOString() }));
  }, []);
  const remove = React.useCallback((id) => {
    if (!id || !_TMFB()) return;
    _tmRef("tmOt/" + id).remove();
  }, []);

  return { rows, loading, save, patch, remove };
}

/* เวลาทำงานมาตรฐาน — ไม่ใส่ TM_ROOT เพราะเป็นค่าตั้งของบริษัท ไม่ใช่ข้อมูลรายการ
   โหมดทดสอบต้องเห็นเวลาทำงานชุดเดียวกับของจริง ไม่งั้นตัวเลข OT ที่ทดสอบจะไม่มีความหมาย */
function useWorkHours() {
  const [cfg, setCfg] = React.useState(TM_WH_DEFAULT);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_TMFB()) { setLoading(false); return; }
    const ref = window.FBDB.ref("config/workHours");
    const h = ref.on("value", (s) => { setCfg(tmWhNorm(s.val())); setLoading(false); }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback((next) => {
    if (!_TMFB()) return;
    window.FBDB.ref("config/workHours").set(tmWhNorm(next));
  }, []);
  return { cfg, loading, save };
}

/* แจ้งเตือน — เขียนลง notifications/ ของจริงเสมอ (ไม่ใส่ TM_ROOT)
   แล้วส่งต่อเข้า LINE · ข้ามการส่งในโหมดทดสอบ ไม่งั้นใบทดสอบจะเด้งเข้ามือถือคนจริง */
function tmNotify(n) {
  if (!_TMFB() || !n) return;
  const id = "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  window.FBDB.ref("notifications/" + id).set(Object.assign({
    id, read: false, at: new Date().toISOString(), type: "ot", event: "ot",
  }, n));
  if (!TM_ROOT && window.lnPush) window.lnPush(id);
}

/* ================================================================
   สรุปรายเดือน — ฝั่งออฟฟิศเอาไปคิดค่าแรง
   อ่านจาก attendDay ซึ่งเป็นดัชนีเบา ไม่ใช่ attend ทั้งต้นไม้ เพราะใบเต็ม
   มีพิกัดติดทุกครั้งที่ปั๊ม สามสิบคนคูณสามสิบวันคือข้อมูลหลายเมกะไบต์ต่อการเปิดหน้าหนึ่งครั้ง
   ================================================================ */
const TM_MONTH_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

const tmYm = (iso) => String(iso || "").slice(0, 7);
const tmYmNow = () => tmYm(window.drToday());

/* เลื่อนเดือนด้วยเลขล้วน ไม่ผ่าน Date — เดือนที่มี 31 วันกับโซนเวลาทำให้ setMonth เพี้ยนได้ */
function tmYmShift(ym, n) {
  const y = +String(ym || "").slice(0, 4), m = +String(ym || "").slice(5, 7);
  if (!y || !m) return tmYmNow();
  const t = y * 12 + (m - 1) + (+n || 0);
  return Math.floor(t / 12) + "-" + window.drPad2((t % 12) + 1);
}

/* ชื่อเดือนเป็น พ.ศ. — บวก 543 ตอนแสดงเท่านั้น ค่าที่เก็บเป็น ค.ศ. เสมอ */
function tmYmTH(ym) {
  const y = +String(ym || "").slice(0, 4), m = +String(ym || "").slice(5, 7);
  if (!y || !m) return "—";
  return (TM_MONTH_TH[m - 1] || "") + " " + (y + 543);
}

function tmMonthDays(ym) {
  const y = +String(ym || "").slice(0, 4), m = +String(ym || "").slice(5, 7);
  if (!y || !m) return [];
  const last = new Date(y, m, 0).getDate();
  const out = [];
  for (let d = 1; d <= last; d++) out.push(ym + "-" + window.drPad2(d));
  return out;
}

function useAttendMonth(ym) {
  const [byDate, setByDate] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!ym || !_TMFB()) { setByDate({}); setLoading(false); return; }
    /* คีย์เป็น "YYYY-MM-DD" เรียงตามตัวอักษรได้ตรงกับเรียงตามเวลา ช่วงจึงตัดด้วย startAt/endAt ได้ */
    const ref = _tmRef("attendDay").orderByKey().startAt(ym + "-00").endAt(ym + "-99");
    const h = ref.on("value", (s) => { setByDate(s.val() || {}); setLoading(false); }, () => setLoading(false));
    return () => ref.off("value", h);
  }, [ym]);
  return { byDate, loading };
}

/* รวมยอดรายคน — ฟังก์ชันล้วน ทดสอบได้โดยไม่ต้องมีฐานข้อมูล
   otRows คือใบ OT ทั้งหมดที่หน้าเห็นอยู่แล้ว นับเฉพาะใบที่อนุมัติแล้วและอยู่ในเดือนนั้น */
function tmMonthRollup(byDate, users, cfg, otRows, ym) {
  const map = {};
  const touch = (id, name) => {
    const u = map[id] || (map[id] = { userId: id, name: "", days: 0, mins: 0, noOut: 0, noGps: 0, otMins: 0, byDay: {} });
    if (name && !u.name) u.name = name;
    return u;
  };
  tmMonthDays(ym).forEach((d) => {
    const row = (byDate || {})[d] || {};
    Object.keys(row).forEach((uid) => {
      const r = row[uid] || {};
      const u = touch(uid, r.name);
      u.byDay[d] = r;
      if (r.in) u.days += 1;
      u.mins += +r.mins || 0;
      if (r.in && !r.out) u.noOut += 1;
      if (r.in && !r.gps) u.noGps += 1;
    });
  });
  (otRows || []).forEach((o) => {
    if (!o || o.status !== "approved" || tmYm(o.date) !== ym) return;
    touch(o.userId, o.userName).otMins += +o.mins || 0;
  });
  /* คนที่มีสิทธิ์ลงเวลาแต่ทั้งเดือนไม่มีใบเลย ต้องขึ้นเป็นแถวศูนย์
     ศูนย์ที่มองเห็นกับแถวที่หายไปเป็นคนละเรื่องกันตอนคิดค่าแรง */
  (users || []).forEach((u) => {
    if (!u || u.active === false || !u.id) return;
    if (!window.can(window.userRoles(u), "attend")) return;
    touch(u.id, u.name);
  });
  /* ทับด้วยชื่อปัจจุบันจากทะเบียน — map ข้างบนเก็บชื่อจากใบใบแรกที่เจอ ซึ่งอาจเป็นชื่อเก่า */
  Object.keys(map).forEach((k) => { map[k].name = tmNameOf(users, k, map[k].name); });
  const rows = Object.keys(map).map((k) => map[k]);
  rows.forEach((r) => { if (!r.name) r.name = r.userId; });
  rows.sort((a, b) => String(a.name).localeCompare(String(b.name), "th"));
  return rows;
}

Object.assign(window, { tmNameOf,
  tmNotify,
  TM_ROOT, TM_WH_DEFAULT, TM_OT_KIND, TM_OT_STATUS, TM_PLACE,
  tmHM, tmHHMM, tmNowHM, tmSpanMins, tmDur, tmWhNorm, tmIsHoliday, tmIsWorkday,
  tmOtKindOf, tmOtKindGuess, tmOtMinutes, tmDayWindow, tmOtEarned, tmOtInLimit, tmLastHM,
  tmOtRate, tmOtPayMins, tmRateTH,
  tmWorkedMins, tmOpen, tmAttendBlank, tmPunch, tmDayIndex, tmPlaceOf,
  tmOtStatusOf, tmOtOpen, tmCanAttend, tmCanAttendAll, tmCanOt, tmCanOtApprove,
  tmOtApproveCheck, tmOtNext, tmOtMove, tmOtDocNo, tmOtBlank, tmOtVisible, tmOtRollup,
  tmOtApprovers, tmOtPickApprover,
  useAttend, useAttendDay, useAttendWriter, useAttendAdmin, useOtClaims, useWorkHours, useAttendMonth,
  tmYm, tmYmNow, tmYmShift, tmYmTH, tmMonthDays, tmMonthRollup, TM_MONTH_TH,
  tmDaysInMonth, tmDayIn, tmNextDay, tmPrevDay, tmPeriodOf, tmPeriodShift, tmInPeriod, tmPeriodTH,
});
