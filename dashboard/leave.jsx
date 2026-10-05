/* ============================================================
   flash+solar — การลา (ใบลา · ยอดวันลารายคน)

   ตรรกะล้วนกับ hooks — หน้าเดสก์ท็อปอยู่ที่ views-leave.jsx (แท็บ "การลา" ในหน้าเวลาทำงาน)
   หน้ามือถืออยู่ที่ liff-leave.jsx (แท็บ "เวลา" → การลา ในแอป LINE)

   ── โครงข้อมูล ──
     config/leaveTypes            ประเภทการลา + ยอดวันลาตั้งต้นต่อปี (ไม่มี = LV_TYPES_DEFAULT)
     leaveQuota/{userId}/{YYYY}   ยอดวันลาเฉพาะคน {typeKey: วัน} — ไม่มีคีย์ = ใช้ยอดตั้งต้นของประเภท
     tmLeave/{id}                 ใบลา (แบน เหมือน tmOt)

   ── สถานะใบลาใช้ชุดเดียวกับใบ OT ── (TM_OT_STATUS · tmOtMove ใน attend.jsx)
   ร่าง → รออนุมัติ → อนุมัติ / ไม่อนุมัติ · ยกเลิกได้เองจนกว่าจะมีคนตัดสิน
   คนใช้เรียนรู้ครั้งเดียวใช้ได้ทั้งสองใบ

   ── นับวันลา ──
   นับเฉพาะวันทำงานตามตั้งค่าเวลาทำงาน (tmIsWorkday — ตัดเสาร์อาทิตย์/วันหยุดที่ตั้งไว้)
   ครึ่งวัน (เช้า/บ่าย) ได้เฉพาะใบที่ลาวันเดียว = 0.5 วัน
   ใบหนึ่งนับเข้าปีของวันเริ่มลา · ยอดคงเหลือ = ยอดวันลา − ใช้แล้ว (อนุมัติ) − รออนุมัติ

   คำนำหน้า lv / Lv / LV
   ============================================================ */

const _lvFB = () => !!window.FBDB;
/* ใบลาและยอดวันลาเป็นข้อมูลรายการ — ตามโหมดทดสอบของหน้าเวลาทำงาน (TM_ROOT) */
const _lvRef = (p) => window.FBDB.ref((window.TM_ROOT || "") + p);

/* ประเภทการลาตั้งต้น — days = ยอดต่อปี · null = ไม่จำกัด (ลาไม่รับค่าจ้าง)
   ลากิจ 3 วัน = ขั้นต่ำตามกฎหมายแรงงาน · ลาคลอดตั้งต้น 0 แล้วตั้งให้เฉพาะคนในตารางยอดวันลา
   adv = ต้องยื่นล่วงหน้ากี่วันก่อนวันเริ่มลา (ผู้ใช้ขอ) · 0 = ยื่นวันเดียวกันได้
   ลาป่วยเป็นประเภทเดียวที่ยื่นย้อนหลังได้ (ป่วยวางแผนล่วงหน้าไม่ได้) — back: true */
const LV_TYPES_DEFAULT = [
  { key: "sick",     th: "ลาป่วย",           days: 30,   color: "#EF4444", adv: 0, back: true },
  { key: "personal", th: "ลากิจ",            days: 3,    color: "#F59E0B", adv: 3 },
  { key: "vacation", th: "ลาพักร้อน",        days: 6,    color: "#0EA5E9", adv: 7 },
  { key: "maternity", th: "ลาคลอด",          days: 0,    color: "#EC4899", adv: 30 },
  { key: "unpaid",   th: "ลาไม่รับค่าจ้าง", days: null, color: "#64748B", adv: 3 },
];
const LV_ADV_DEF = { sick: 0, personal: 3, vacation: 7, maternity: 30, unpaid: 3 };

const LV_PART = [
  { key: "full", th: "ทั้งวัน" },
  { key: "am",   th: "ครึ่งเช้า" },
  { key: "pm",   th: "ครึ่งบ่าย" },
];
const lvPartTH = (k) => (LV_PART.find((p) => p.key === k) || LV_PART[0]).th;

/* คีย์ประเภทเป็นคีย์ใน Firebase — ห้ามมี . $ # [ ] / */
const lvKeyOk = (k) => /^[A-Za-z0-9_-]{1,30}$/.test(String(k || ""));

function lvTypesNorm(v) {
  const arr = Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : null);
  const out = (arr || LV_TYPES_DEFAULT).filter((t) => t && lvKeyOk(t.key)).map((t) => ({
    key: t.key, th: String(t.th || t.key),
    days: t.days == null || t.days === "" ? null : Math.max(0, +t.days || 0),
    color: t.color || "#64748B",
    /* ค่าตั้งที่บันทึกไว้ก่อนมีช่องนี้ → ใช้ค่าตั้งต้นของคีย์นั้น (ประเภทที่เพิ่มเองไม่มี = 0) */
    adv: t.adv == null || t.adv === "" ? (LV_ADV_DEF[t.key] || 0) : Math.max(0, Math.round(+t.adv || 0)),
    back: t.back == null ? t.key === "sick" : !!t.back,
  }));
  return out.length ? out : LV_TYPES_DEFAULT.slice();
}
const lvTypeOf = (types, k) => (types || []).find((t) => t.key === k)
  || { key: k || "", th: k || "ไม่ระบุ", days: null, color: "#94A3B8" };

/* แสดงจำนวนวัน — 1.5 → "1.5 วัน" · 2 → "2 วัน" */
const lvDaysTH = (d) => (Math.round((+d || 0) * 10) / 10).toString() + " วัน";
const lvYearOf = (iso) => +String(iso || "").slice(0, 4) || +String(window.drToday()).slice(0, 4);

/* จำนวนวันลาของใบหนึ่ง — นับเฉพาะวันทำงาน */
function lvCountDays(from, to, part, cfg) {
  const a = String(from || ""), b = String(to || a);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a) || !/^\d{4}-\d{2}-\d{2}$/.test(b) || b < a) return 0;
  if (a === b && (part === "am" || part === "pm")) return window.tmIsWorkday(a, cfg) ? 0.5 : 0;
  let n = 0, d = a, guard = 0;
  while (d <= b && guard++ < 400) {
    if (window.tmIsWorkday(d, cfg)) n += 1;
    d = window.drAddDays(d, 1);
  }
  return n;
}

/* ช่วงวันที่ของใบ เป็นข้อความสั้น */
function lvRangeTH(r) {
  if (!r) return "";
  const a = window.drShort(r.from), b = window.drShort(r.to || r.from);
  const one = !r.to || r.to === r.from;
  return (one ? a : a + " – " + b) + (one && r.part && r.part !== "full" ? " (" + lvPartTH(r.part) + ")" : "");
}

/* ใบลาครอบวันนี้ไหม */
const lvCovers = (r, iso) => !!r && String(r.from) <= iso && iso <= String(r.to || r.from);

/* ── ยอดวันลาของคนหนึ่งในปีหนึ่ง ──
   quotaMap = leaveQuota ทั้งโหนด · rows = ใบลาทั้งหมด
   คืน [{type, quota (null = ไม่จำกัด), used, pending, left}] เรียงตามประเภท */
function lvQuotaOf(quotaMap, userId, year, t) {
  const mine = (((quotaMap || {})[userId] || {})[year]) || {};
  const v = mine[t.key];
  if (v === undefined || v === null || v === "") return t.days;
  return v === "inf" ? null : Math.max(0, +v || 0);
}
function lvBalance(rows, quotaMap, userId, year, types) {
  return (types || []).map((t) => {
    let used = 0, pending = 0;
    (rows || []).forEach((r) => {
      if (!r || r.userId !== userId || r.type !== t.key || lvYearOf(r.from) !== +year) return;
      if (r.status === "approved") used += +r.days || 0;
      else if (r.status === "sent") pending += +r.days || 0;
    });
    const quota = lvQuotaOf(quotaMap, userId, year, t);
    return { type: t, quota, used, pending, left: quota == null ? null : quota - used - pending };
  });
}

/* วันจากวันนี้ถึงวันเริ่มลา (ปฏิทิน) — ลบ = ย้อนหลัง */
function lvLeadDays(from, today) {
  const a = Date.parse(String(today || window.drToday()) + "T00:00:00Z"), b = Date.parse(String(from) + "T00:00:00Z");
  return isNaN(a) || isNaN(b) ? 0 : Math.round((b - a) / 864e5);
}
/* ข้อความกติกาการยื่นล่วงหน้าของประเภทหนึ่ง */
function lvAdvTH(t) {
  if (!t) return "";
  const a = +t.adv || 0;
  return (a ? "ต้องยื่นล่วงหน้าอย่างน้อย " + a + " วัน" : "ยื่นวันเดียวกันได้") + (t.back ? " · ยื่นย้อนหลังได้" : "");
}

/* ── ใบนี้ส่งได้ไหม ── คืน ข้อความที่บอกว่าทำไมส่งไม่ได้ · "" = ส่งได้ */
function lvSendWhy(f, bal) {
  if (!f) return "";
  if (!f.type) return "เลือกประเภทการลา";
  if (!f.from) return "เลือกวันที่ลา";
  if ((f.to || f.from) < f.from) return "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
  if (!(+f.days > 0)) return "ช่วงนี้ไม่มีวันทำงาน — ไม่ต้องลา";
  if (!String(f.reason || "").trim()) return "กรอกเหตุผลการลา";
  const b = (bal || []).find((x) => x.type.key === f.type);
  /* ต้องลาล่วงหน้า — นับตอนกดส่ง เทียบวันนี้กับวันเริ่มลา */
  if (b) {
    const lead = lvLeadDays(f.from);
    const adv = +b.type.adv || 0;
    if (lead < 0 && !b.type.back) return b.type.th + " ยื่นย้อนหลังไม่ได้ — " + lvAdvTH(b.type);
    if (lead >= 0 && lead < adv) return b.type.th + " ต้องยื่นล่วงหน้าอย่างน้อย " + adv + " วัน — ลาได้เร็วสุดวันที่ "
      + window.drShort(window.drAddDays(window.drToday(), adv));
  }
  if (b && b.quota != null) {
    /* ใบที่กำลังแก้อยู่อาจนับเป็น pending ไปแล้ว (เอากลับมาแก้) — หักออกก่อนเทียบ */
    const self = f.status === "sent" ? +f.days || 0 : 0;
    const room = b.quota - b.used - b.pending + self;
    if (+f.days > room) return "เกินยอดวันลา " + b.type.th + " — เหลือ " + lvDaysTH(Math.max(0, room))
      + " (ส่วนที่เกินใช้ลาไม่รับค่าจ้าง)";
  }
  return "";
}

/* ── สิทธิ์ ── (คีย์ห้ามมีจุด — ดูหมายเหตุใน attend.jsx) */
const lvCanLeave   = (role) => window.can(role, "leave");
const lvCanApprove = (role) => window.can(role, "leaveApprove");
/* แก้ยอดวันลาของทุกคน = คนที่ดูเวลาของทุกคนได้ และอนุมัติใบลาได้ (แอดมิน · หัวหน้า · HR) */
const lvCanQuota   = (role) => window.can(role, "attendAll") && window.can(role, "leaveApprove");

function lvApproveCheck(rec, user, role) {
  if (!rec || !user) return { ok: false, why: "" };
  if (!lvCanApprove(role)) return { ok: false, why: "ไม่มีสิทธิ์อนุมัติใบลา" };
  if (rec.userId && rec.userId === user.id) return { ok: false, why: "อนุมัติใบลาของตัวเองไม่ได้ — ต้องให้คนอื่นอนุมัติ" };
  if (rec.approverId && rec.approverId !== user.id && !window.hasRole(role, "admin")) {
    return { ok: false, why: "ใบนี้ส่งถึง " + (rec.approverName || "คนอื่น") + " โดยตรง" };
  }
  return { ok: true, why: "" };
}

/* ปุ่มเดินสถานะที่คนนี้กดได้ — กติกาเดียวกับ tmOtNext */
function lvNext(rec, role, user) {
  const cur = window.tmOtStatusOf((rec || {}).status);
  const mine = rec && user && rec.userId === user.id;
  const appr = lvApproveCheck(rec, user, role).ok;
  return (cur.next || []).filter((k) => {
    if (k === "sent")      return mine;
    if (k === "approved")  return appr;
    if (k === "rejected")  return appr;
    if (k === "cancelled") return mine;
    if (k === "draft")     return mine || appr;
    return false;
  }).map((k) => window.tmOtStatusOf(k));
}
/* เดินสถานะ = คืนใบใหม่ ไม่เขียนฐานข้อมูล (ใช้ tmOtMove ตัวเดียวกับใบ OT) */
const lvMove = (rec, to, user, note) => window.tmOtMove(rec, to, user, note);

/* เลขที่ใบ — LV-6810-03 (พ.ศ. สองหลัก + เดือน + ลำดับในเดือน) */
function lvDocNo(list, dateISO) {
  const d = String(dateISO || window.drToday());
  const ym = String(+d.slice(0, 4) + 543).slice(2) + d.slice(5, 7);
  const n = (list || []).filter((r) => r && String(r.no || "").indexOf("LV-" + ym) === 0).length + 1;
  return "LV-" + ym + "-" + window.drPad2(n);
}

function lvApprovers(users, forUser) {
  const skip = (forUser || {}).id || null;
  return (users || [])
    .filter((u) => u && u.id && u.active !== false && u.id !== skip && window.can(window.userRoles(u), "leaveApprove"))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th"));
}
function lvPickApprover(user, users) {
  const all = lvApprovers(users, user);
  const mine = ((user || {}).approverId && all.find((u) => u.id === user.approverId)) || null;
  if (mine) return mine;
  return all.length === 1 ? all[0] : null;
}

function lvBlank(user, users, list, cfg) {
  const date = window.drToday();
  const ap = lvPickApprover(user, users);
  return {
    id: "LV-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    no: lvDocNo(list, date),
    userId: (user || {}).id || null, userName: (user || {}).name || "",
    type: "", from: date, to: date, part: "full", days: lvCountDays(date, date, "full", cfg), reason: "",
    approverId: (ap || {}).id || null, approverName: (ap || {}).name || "",
    status: "draft", createdAt: new Date().toISOString(), hist: [],
  };
}

/* คนที่ไม่มีสิทธิ์อนุมัติ/ดูของทุกคน เห็นเฉพาะใบลาของตัวเอง — กรองที่ชั้นข้อมูล */
function lvVisible(list, user, role) {
  if (lvCanApprove(role) || window.can(role, "attendAll")) return list || [];
  const uid = (user || {}).id || null;
  return (list || []).filter((r) => r && r.userId === uid);
}

/* ใบลาที่อนุมัติแล้วของวันหนึ่ง {userId: ใบ} — แผ่นเวลารายวันใช้บอกว่าคนที่ไม่ลงเวลา "ลา" อยู่ */
function lvOnDay(list, iso) {
  const out = {};
  (list || []).forEach((r) => { if (r && r.status === "approved" && lvCovers(r, iso)) out[r.userId] = r; });
  return out;
}

/* ข้อความแจ้งเตือนของการเดินสถานะ — ใช้ทั้งเว็บและไลน์ ข้อความจะได้ตรงกัน */
function lvNotifyMove(prev, next, actor, types) {
  if (!next || !window.tmNotify) return;
  const t = lvTypeOf(types, next.type);
  const what = t.th + " " + lvRangeTH(next) + " · " + lvDaysTH(next.days);
  const by = (actor || {}).name || "";
  const send = (n) => window.tmNotify(Object.assign({ type: "leave", event: "leave" }, n));
  const to = next.status;
  if (to === "sent") {
    const head = { title: "ขออนุมัติการลา · " + next.no, body: (next.userName || "") + " · " + what
      + (next.reason ? " · " + next.reason : "") };
    send(next.approverId ? Object.assign({ toUserId: next.approverId }, head) : Object.assign({ toPerm: "leaveApprove" }, head));
  } else if ((to === "approved" || to === "rejected") && next.userId !== (actor || {}).id) {
    send({ toUserId: next.userId, title: (to === "approved" ? "อนุมัติการลาแล้ว · " : "ไม่อนุมัติการลา · ") + next.no,
      body: what + " · โดย " + by + (next.decidedNote ? " · " + next.decidedNote : "") });
  } else if (to === "draft" && prev && prev.status === "sent" && next.userId !== (actor || {}).id) {
    send({ toUserId: next.userId, title: "ตีกลับใบลา · " + next.no, body: what + " · แก้แล้วส่งใหม่ได้ · โดย " + by });
  } else if (to === "cancelled" && prev && prev.status === "sent" && next.approverId) {
    send({ toUserId: next.approverId, title: "ยกเลิกใบลา · " + next.no, body: (next.userName || "") + " · " + what + " · ไม่ต้องพิจารณาแล้ว" });
  }
}

/* ================================================================
   hooks
   ================================================================ */
function useLeaves() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!_lvFB()) { setLoading(false); return; }
    const ref = _lvRef("tmLeave");
    const h = ref.on("value", (s) => {
      const v = s.val() || {};
      const arr = Object.keys(v).map((k) => Object.assign({ id: k }, v[k]));
      arr.sort((a, b) => String(b.from || "").localeCompare(String(a.from || ""))
        || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
      setRows(arr); setLoading(false);
    }, () => setLoading(false));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback((r) => {
    if (!r || !r.id || !_lvFB()) return;
    _lvRef("tmLeave/" + r.id).set(Object.assign({}, r, { updatedAt: new Date().toISOString() }));
  }, []);
  const remove = React.useCallback((id) => {
    if (!id || !_lvFB()) return;
    _lvRef("tmLeave/" + id).remove();
  }, []);
  return { rows, loading, save, remove };
}

/* ประเภทการลา — ค่าตั้งของบริษัท ไม่ใส่ TM_ROOT (เหมือน config/workHours) */
function useLeaveTypes() {
  const [types, setTypes] = React.useState(LV_TYPES_DEFAULT);
  React.useEffect(() => {
    if (!_lvFB()) return;
    const ref = window.FBDB.ref("config/leaveTypes");
    const h = ref.on("value", (s) => setTypes(lvTypesNorm(s.val())));
    return () => ref.off("value", h);
  }, []);
  const save = React.useCallback((next) => {
    if (!_lvFB()) return;
    window.FBDB.ref("config/leaveTypes").set(lvTypesNorm(next));
  }, []);
  return { types, save };
}

/* ยอดวันลารายคน — ทั้งโหนดเล็กมาก (คน × ปี × ประเภท) อ่านทั้งก้อนได้ */
function useLeaveQuota() {
  const [map, setMap] = React.useState({});
  React.useEffect(() => {
    if (!_lvFB()) return;
    const ref = _lvRef("leaveQuota");
    const h = ref.on("value", (s) => setMap(s.val() || {}));
    return () => ref.off("value", h);
  }, []);
  /* val = ตัวเลข · "inf" = ไม่จำกัด · null/"" = กลับไปใช้ยอดตั้งต้นของประเภท */
  const set = React.useCallback((userId, year, typeKey, val) => {
    if (!_lvFB() || !userId || !year || !lvKeyOk(typeKey)) return;
    const ref = _lvRef("leaveQuota/" + userId + "/" + year + "/" + typeKey);
    if (val === null || val === undefined || val === "") ref.remove();
    else ref.set(val === "inf" ? "inf" : Math.max(0, Math.round((+val || 0) * 2) / 2));
  }, []);
  return { map, set };
}

Object.assign(window, {
  LV_TYPES_DEFAULT, LV_PART, lvPartTH, lvTypesNorm, lvTypeOf, lvDaysTH, lvYearOf,
  lvCountDays, lvRangeTH, lvCovers, lvLeadDays, lvAdvTH, lvQuotaOf, lvBalance, lvSendWhy,
  lvCanLeave, lvCanApprove, lvCanQuota, lvApproveCheck, lvNext, lvMove, lvDocNo,
  lvApprovers, lvPickApprover, lvBlank, lvVisible, lvOnDay, lvNotifyMove,
  useLeaves, useLeaveTypes, useLeaveQuota,
});
