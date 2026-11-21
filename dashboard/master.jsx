/* ==================================================================
   Master Schedule ของงานโครงการ (prefix ms / Ms) — ผู้ใช้: "Master Schedule ของงานโครงการ มาใส่ในงานติดตั้ง"
   หน้าตายึดไฟล์ตัวอย่างที่ผู้ใช้ส่งมา (Simple Project Plan Template 2026):
   หัวสรุป จำนวนงาน/เสร็จ/กำลังทำ/ยังไม่เริ่ม + วง % รวม · เริ่ม/จบ/กี่วัน/เหลือกี่วัน
   ตาราง ID · งาน · ผู้รับผิดชอบ · เริ่ม · จบ · % · สถานะ + แกนต์รายวันหัวสัปดาห์ แถบเดียวระบาย % ทับ
   ดู docs/master-schedule.md

   ข้อมูล  masterSchedule/{jobId} = { rows: [...], updatedAt, byName }
   แถว    { id, th, head, owner, planStart, planEnd, pct, link }
          head = หัวข้อใหญ่ (ช่วงวัน/% คิดจากขั้นย่อยใต้มัน) · link "install" = หัวข้อ "งานติดตั้ง"
          ขั้นย่อยของงานติดตั้งไม่เก็บซ้ำ — ดึงสดจากตารางขั้นงานของรายงานประจำวัน (dailyPlan / ใบล่าสุด)
          ช่างอัปเดต % ที่รายงานประจำวันที่เดียว Master Schedule ขยับตาม
   ================================================================== */

/* แม่แบบตามไฟล์ EPC S-Curve ที่ผู้ใช้ส่งมา (Project Schedule Tissin Food 717.60 kWp · 17 พ.ย. 2026 "แผนงานติดตั้งเปลี่ยนเป็นตามที่เลยก็ได้")
   [หัวข้อ, [[งาน, % น้ำหนัก, วัน], …], link] · น้ำหนักรวมทั้งโครงการ 100 (A 10.5 · B 6 · C 35 · D 20 · E 28.5)
   หมวด D งานโยธา + E งานไฟฟ้า = ตารางขั้นงานของรายงานประจำวัน (DR_WHA_TREE ใน daily.jsx) ช่างอัปเดต % ที่นั่น */
const MS_TEMPLATE = [
  ["Permission Work — งานขออนุญาต", [
    ["ใบโอนสิทธิ์ (กนอ.01/3)", 1, 15], ["ขออนุญาตให้ใช้ที่ดินในนามผู้ลงทุน กนอ.01/1", 1, 15], ["ขออนุญาตดัดแปลงอาคาร กนอ.02/1", 1.5, 45],
    ["ขออนุญาตรับรองอาคาร กนอ.02/5", 1.5, 45], ["ขอแจ้งเริ่มประกอบอุตสาหกรรม กนอ.03/1", 1, 60], ["ขออนุญาตผลิตพลังงานควบคุม พ.ค.2", 1, 240],
    ["PEA: ยื่นเอกสารเพื่อรับพิจารณาในระบบ PPIM", 1, 45], ["PEA: จัดทำสัญญา 3 ฝ่าย", 0.5, 90], ["PEA: ตรวจสอบอุปกรณ์", 1, 30], ["PEA: First Sync", 1, 30]]],
  ["Engineering work for approval — งานวิศวกรรม", [
    ["Roof inspection and handover", 2, 30], ["Site Mobilization", 1, 5], ["Calculation", 0.5, 40], ["Material Specification", 0.5, 30], ["Electrical & Civil drawings", 2, 45]]],
  ["Procurement and Material delivery — จัดซื้อ & ส่งของ", [
    ["Mounting Structure", 5, 31], ["PV Module", 10, 60], ["Inverter", 5, 30], ["Walk way", 2, 30], ["MDB Solar", 1, 60],
    ["Cable tray and Perforated Tray", 2, 30], ["Lifeline and Safety line", 2, 30], ["PV cable", 4, 30], ["AC cable", 3, 30], ["Mechanical + Electrical material", 1, 60]]],
  ["งานติดตั้ง (Civil + Electrical)", null, "install"],
];
const MS_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const MS_DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
/* สถานะ — ชื่อ · ตัวอักษร · พื้น · สีแถบที่ระบาย % */
const MS_ST = {
  done:  { th: "เสร็จแล้ว",   tx: "var(--tint-ok-tx)",    bg: "var(--tint-ok-bg)",    bar: "var(--tint-ok-tx)" },
  doing: { th: "กำลังทำ",     tx: "var(--tint-amber-tx)", bg: "var(--tint-amber-bg)", bar: "var(--primary)" },
  late:  { th: "ล่าช้า",       tx: "var(--tint-red-tx)",   bg: "var(--tint-red-bg)",   bar: "var(--tint-red-tx)" },
  todo:  { th: "ยังไม่เริ่ม",  tx: "var(--text-2)",        bg: "var(--surface2)",      bar: "var(--primary)" },
  donelate: { th: "เสร็จช้า",  tx: "var(--tint-red-tx)",   bg: "var(--tint-red-bg)",   bar: "var(--tint-ok-tx)" },
};
/* ป้ายสถานะบอกจำนวนวัน (ผู้ใช้ 17 พ.ย. 2026 "ถ้างานไหนทำเสร็จไปก่อนแล้ว หรือทำช้ากว่ากำหนด จะต้องระบุยังไง")
   เสร็จ: เทียบวันเสร็จจริงกับวันจบแผน · ยังไม่เสร็จแต่เลยวันจบแผน: ล่าช้ากี่วันนับถึงวันนี้ */
function msStLabel(r) {
  if (r.st === "done") return r.var == null ? "เสร็จแล้ว" : r.var < 0 ? "เสร็จก่อน " + -r.var + " วัน" : "เสร็จตามกำหนด";
  if (r.st === "donelate") return "เสร็จช้า " + r.var + " วัน";
  if (r.st === "late") return "ล่าช้า " + r.lateBy + " วัน";
  return (MS_ST[r.st] || MS_ST.todo).th;
}
const MS_TRACK = "color-mix(in srgb, var(--primary) 20%, var(--surface2))";

let _msSeq = 0;
const msId = () => "r" + Date.now().toString(36) + (_msSeq++).toString(36);
const msRow = (th, head, link, w, dur) => ({ id: msId(), th: th || "", head: !!head, owner: "", planStart: "", planEnd: "", pct: 0, link: link || "",
  w: w == null ? "" : w, dur: dur || "" });
function msTemplate() {
  const out = [];
  MS_TEMPLATE.forEach(([h, subs, link]) => { out.push(msRow(h, true, link)); (subs || []).forEach((x) => out.push(msRow(x[0], false, "", x[1], x[2]))); });
  return out;
}
const msW = (v) => (v === "" || v == null || isNaN(+v) ? null : Math.max(0, +v));
/* เลขแบบไฟล์ตัวอย่าง: หัวข้อ A, B, C … งานย่อย A1, A2 … */
const msLetter = (n) => { let s = ""; n = Math.max(1, n); while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };

const msDay = (iso) => { if (!iso) return null; const t = Date.parse(String(iso).slice(0, 10) + "T00:00:00Z"); return isNaN(t) ? null : Math.round(t / 86400000); };
const msIso = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const msToday = () => (window.drToday ? window.drToday() : new Date().toISOString().slice(0, 10));
const msPct = (v) => Math.max(0, Math.min(100, Math.round(+v || 0)));
const msDur = (a, b) => { const x = msDay(a), y = msDay(b || a); return x != null && y != null ? Math.max(1, y - x + 1) : null; };
/* "12 พ.ย." · yr = ต่อท้ายปี พ.ศ. 2 หลัก */
function msTH(iso, yr) {
  const n = msDay(iso);
  if (n == null) return "";
  const d = new Date(n * 86400000);
  return d.getUTCDate() + " " + MS_MON[d.getUTCMonth()] + (yr ? " " + String(d.getUTCFullYear() + 543).slice(2) : "");
}
const msSpanTH = (a, b) => (!a && !b ? "" : a && b && a !== b ? msTH(a) + " – " + msTH(b, true) : msTH(a || b, true));

/* ── แกนเวลา: ช่วงวัน + หัวเดือน/สัปดาห์ (สัปดาห์ที่ 1 = สัปดาห์ที่โครงการเริ่ม นับจันทร์) ── */
function msAxis(C, today, pad) {
  const td = msDay(today);
  let lo = C.lo, hi = C.hi;
  if (lo == null) { lo = td; hi = td + 27; }
  if (td != null && td >= lo - 30 && td <= hi + 30) { lo = Math.min(lo, td); hi = Math.max(hi, td); }
  const mon0 = (d) => d - ((new Date(d * 86400000).getUTCDay() + 6) % 7);   // จันทร์ของสัปดาห์นั้น
  const p0 = C.lo != null ? C.lo : lo;
  lo = mon0(lo - (pad || 0)); hi = mon0(hi + (pad || 0)) + 6;                // ตัดขอบเต็มสัปดาห์ จ–อา
  const span = hi - lo + 1;
  const months = [];
  for (let d = lo; d <= hi; d++) {
    const x = new Date(d * 86400000);
    if (d === lo || x.getUTCDate() === 1) months.push({ d, th: MS_MON[x.getUTCMonth()] + " " + String(x.getUTCFullYear() + 543).slice(2) });
  }
  if (months.length > 1 && months[1].d - months[0].d < 8) months.shift();
  const weeks = [];
  const mg = [];   // กลุ่มเดือน (นับสัปดาห์ตามวันจันทร์ของสัปดาห์นั้น) · k = สัปดาห์ที่ 1,2,3… ในเดือน
  for (let d = lo; d <= hi; d += 7) {
    const x = new Date(d * 86400000), key = x.getUTCFullYear() * 12 + x.getUTCMonth();
    if (!mg.length || mg[mg.length - 1].key !== key) mg.push({ key, d, n: 0, th: MS_MON[x.getUTCMonth()] + (!mg.length || x.getUTCMonth() === 0 ? " " + String(x.getUTCFullYear() + 543).slice(2) : "") });
    const g = mg[mg.length - 1]; g.n++;
    weeks.push({ d, n: Math.floor((d - mon0(p0)) / 7) + 1, k: g.n });
  }
  return { lo, hi, span, td, months, mg, weeks, X: (d) => ((d - lo) / span) * 100, W: (a, b) => ((Math.max(a, b) - Math.min(a, b) + 1) / span) * 100 };
}

/* ── ขั้นย่อยของงานติดตั้งจากรายงานประจำวัน — หัวข้อใหญ่ของตารางขั้นงาน 1 แถว (ช่วงวัน/% รวมขั้นย่อย) ──
   ใช้ตารางของงาน (dailyPlan) เว้นแต่ใบล่าสุดแก้ใหม่กว่า (ช่างแก้ % จาก LINE ไม่ได้อัปเดตตารางของงาน — เหมือน drBlank) */
function msInstallSteps(daily) {
  if (!daily) return null;
  const plan = daily.plan, last = daily.dates && daily.dates[0] ? daily.byDate[daily.dates[0]] : null;
  let steps = plan && plan.steps && plan.steps.length ? plan.steps : null;
  if (last && last.steps && last.steps.length && (!steps || (last.updatedAt || "") > ((plan && plan.updatedAt) || ""))) steps = last.steps;
  return steps;
}
function msInstallRows(daily, owner) {
  return msInstallRowsOf(msInstallSteps(daily), owner);
}
/* หัวข้อของตารางขั้นงาน = หัวข้อใหญ่ใน Master Schedule (D งานโยธา · E งานไฟฟ้า) · ขั้นย่อย = งาน (น้ำหนัก w · วัน · %)
   (เดิม พ.ย. 2026 ยุบหัวข้อละแถวใต้ "งานติดตั้ง" — แม่แบบใหม่ตามไฟล์ S-Curve ให้ D/E เป็นหมวดเต็ม) */
function msInstallRowsOf(steps, owner) {
  if (!steps || !steps.length) return [];
  const list = window.drRenumber ? window.drRenumber(steps) : steps;
  const out = [];
  let hi = -1, k = 0;
  list.forEach((r) => {
    const base = { ro: true, link: "install", owner: owner || "", planStart: r.planStart || "", planEnd: r.planEnd || r.planStart || "", pct: msPct(r.pct), w: msW(r.w) == null ? "" : msW(r.w),
      actStart: r.actStart || "", actEnd: r.actEnd || "" };
    if (r.head !== false) { hi += 1; k = 0; out.push(Object.assign(base, { id: "dh" + hi, th: r.th || "", head: true })); }
    else { k += 1; out.push(Object.assign(base, { id: "ds" + hi + "_" + k, th: r.th || "", head: false })); }
  });
  return out;
}

/* ── แถวที่ใช้แสดงจริง: แทรกขั้นย่อยของงานติดตั้ง + คิดหัวข้อจากขั้นย่อย + น้ำหนักตามจำนวนวันแผน ── */
/* cap = วันที่ (ประมาณ % ย้อนหลังสำหรับ S-Curve): งานนอกตารางขั้นงานไม่รู้ % ณ วันนั้น ใช้ min(% ตอนนี้, % ตามแผน ณ วันนั้น) */
function msCompute(rows, inst, job, today, cap) {
  const out = [];
  (rows || []).forEach((r) => {
    if (r.head && r.link === "install") {
      if (inst.length) { inst.forEach((x) => out.push(Object.assign({}, x))); return; }
      const sd = ((job && job.stageDates) || {}).install;
      const own = Object.assign({}, r);
      if (!own.planStart && sd) {
        if (typeof sd === "object") { own.planStart = sd.start || sd.end || ""; own.planEnd = sd.end || sd.start || ""; }
        else own.planStart = own.planEnd = String(sd).slice(0, 10);
      }
      out.push(own);
    } else out.push(Object.assign({}, r));
  });
  const td = msDay(today);
  if (cap) {
    const cd = msDay(cap);
    out.forEach((r) => {
      if (r.link === "install") return;
      const a = msDay(r.planStart), b = msDay(r.planEnd || r.planStart);
      const plan = a == null ? 0 : cd < a ? 0 : cd >= b ? 100 : ((cd - a + 1) / (b - a + 1)) * 100;
      r.pct = Math.min(msPct(r.pct), Math.round(plan));
    });
  }
  /* น้ำหนัก: มีช่อง % Weight (ไฟล์ S-Curve) ใช้ตามนั้น · ไม่มีเลย = ตามจำนวนวันแผนแบบเดิม
     มีบ้างไม่มีบ้าง (เช่นตารางขั้นงานเก่าไม่มีน้ำหนัก) = แบ่งส่วนที่เหลือจาก 100 ให้ตัวที่ไม่มีตามจำนวนวัน */
  const isLeaf = (r, i) => !r.head || !(i + 1 < out.length && !out[i + 1].head);
  const lv = out.filter(isLeaf);
  const days = (r) => msDur(r.planStart, r.planEnd) || 1;
  const hasW = lv.some((r) => msW(r.w) > 0);
  const known = lv.reduce((t, r) => t + (msW(r.w) || 0), 0);
  const miss = lv.filter((r) => msW(r.w) == null), missD = miss.reduce((t, r) => t + days(r), 0);
  const rest = Math.max(0, 100 - known);
  lv.forEach((r) => { r.wt = !hasW ? days(r) : msW(r.w) != null ? msW(r.w) : missD ? (rest * days(r)) / missD : 0; });
  const leafW = (r) => r.wt || 0;
  const status = (r) => {
    const p = msPct(r.pct), pe = msDay(r.planEnd || r.planStart);
    r.var = null; r.lateBy = null;
    if (p >= 100) { const ae = msDay(r.actEnd); if (ae != null && pe != null) r.var = ae - pe; return r.var > 0 ? "donelate" : "done"; }
    if (pe != null && td != null && pe < td) { r.lateBy = td - pe; return "late"; }
    return p > 0 ? "doing" : "todo";
  };
  let no = 0, sub = 0;
  for (let i = 0; i < out.length; i++) {
    const r = out[i];
    if (r.head) { no += 1; sub = 0; r.no = msLetter(no); } else { sub += 1; r.no = (no ? msLetter(no) : "") + sub; }
    if (!r.head) continue;
    const kids = [];
    for (let j = i + 1; j < out.length && !out[j].head; j++) kids.push(out[j]);
    r.kids = kids.length;
    if (!kids.length) continue;
    const ps = kids.map((k) => k.planStart).filter(Boolean).sort(), pe = kids.map((k) => k.planEnd || k.planStart).filter(Boolean).sort();
    if (ps.length) r.planStart = ps[0];
    if (pe.length) r.planEnd = pe[pe.length - 1];
    const W = kids.reduce((t, k) => t + leafW(k), 0);
    r.wt = W;
    r.pct = Math.round(kids.reduce((t, k) => t + leafW(k) * msPct(k.pct), 0) / (W || 1));
    /* วันจริงของหัวข้อ = เริ่มจริงแรกสุด · เสร็จจริงล่าสุด (เมื่องานย่อยเสร็จครบ) */
    const as = kids.map((k) => k.actStart).filter(Boolean).sort(), ae = kids.map((k) => k.actEnd).filter(Boolean).sort();
    r.actStart = as[0] || "";
    r.actEnd = kids.every((k) => msPct(k.pct) >= 100) && ae.length ? ae[ae.length - 1] : "";
    const own = [...new Set(kids.map((k) => k.owner).filter(Boolean))];
    if (!r.owner && own.length === 1) r.owner = own[0];
  }
  out.forEach((r) => { r.st = status(r); });
  const leaves = out.filter((r) => !r.head || !r.kids);
  const W = leaves.reduce((t, r) => t + leafW(r), 0);
  const pct = leaves.length ? Math.round(leaves.reduce((t, r) => t + leafW(r) * msPct(r.pct), 0) / (W || 1)) : 0;
  /* % น้ำหนักต่อทั้งโครงการ (รวม 100) — ใช้ในตาราง/Excel/S-Curve */
  out.forEach((r) => { r.wp = W ? (100 * (r.wt || 0)) / W : 0; });
  let lo = Infinity, hi = -Infinity;
  out.forEach((r) => [r.planStart, r.planEnd].forEach((v) => { const n = msDay(v); if (n != null) { lo = Math.min(lo, n); hi = Math.max(hi, n); } }));
  const cnt = { done: 0, doing: 0, late: 0, todo: 0, donelate: 0 };
  leaves.forEach((r) => { cnt[r.st] += 1; });
  cnt.done += cnt.donelate;   // ช่อง "เสร็จแล้ว" นับรวมที่เสร็จช้า
  return { rows: out, pct, lo: isFinite(lo) ? lo : null, hi: isFinite(hi) ? hi : null, late: cnt.late, cnt, leaves: leaves.length, weighted: hasW };
}

/* ── S-Curve รายสัปดาห์ (จันทร์–อาทิตย์ เริ่มสัปดาห์ที่โครงการเริ่ม) ──
   แผน: น้ำหนัก % ของแต่ละงานกระจายเท่า ๆ กันทุกวันในช่วงแผน → สะสม · งานที่ยังไม่ใส่วันไม่อยู่ในเส้นแผน
   จริง: ภาพรวม % ที่จดไว้รายวัน (masterScheduleHist) ค่าสุดท้ายภายในสัปดาห์นั้น · ก่อนเริ่มจดใช้ค่าประมาณจากรายงานประจำวัน (est)
   สัปดาห์ที่ยังไม่ถึงไม่มีค่าจริง */
function msCurve(C, today, hist, est) {
  if (C.lo == null) return null;
  const mon0 = (d) => d - ((new Date(d * 86400000).getUTCDay() + 6) % 7);
  const lo = mon0(C.lo), hi = mon0(C.hi) + 6, td = msDay(today);
  const inc = new Float64Array(hi - lo + 1);
  C.rows.forEach((r) => {
    if (r.head && r.kids) return;
    const a = msDay(r.planStart), b = msDay(r.planEnd || r.planStart);
    if (a == null || !r.wp) return;
    const n = b - a + 1;
    for (let d = a; d <= b; d++) inc[d - lo] += r.wp / n;
  });
  const pts = [];
  Object.keys(est || {}).forEach((k) => pts.push([msDay(k), est[k], 1]));
  const first = Object.keys(hist || {}).sort()[0];
  const f0 = first ? msDay(first) : Infinity;
  for (let i = pts.length - 1; i >= 0; i--) if (pts[i][0] >= f0) pts.splice(i, 1);
  Object.keys(hist || {}).forEach((k) => { const v = +hist[k]; if (!isNaN(v)) pts.push([msDay(k), v, 0]); });
  pts.sort((x, y) => x[0] - y[0]);
  const weeks = [];
  let acc = 0;
  for (let w = lo, i = 1; w <= hi; w += 7, i++) {
    let p = 0;
    for (let d = w; d < w + 7; d++) p += inc[d - lo] || 0;
    acc += p;
    let act = null, isEst = false;
    if (td == null || w <= td) {
      const end = Math.min(w + 6, td == null ? w + 6 : td);
      for (let j = 0; j < pts.length && pts[j][0] <= end; j++) { act = pts[j][1]; isEst = !!pts[j][2]; }
      if (act == null && w + 6 < (pts.length ? pts[0][0] : -Infinity)) act = 0;
    }
    weeks.push({ d: w, n: i, plan: p, planAcc: Math.min(100, acc), act, est: isEst });
  }
  const tdW = td == null ? null : weeks.find((w) => td >= w.d && td <= w.d + 6) || null;
  return { weeks, lo, hi, td, planNow: tdW ? tdW.planAcc : td != null && td > hi ? 100 : 0 };
}

/* ── กราฟ S-Curve เป็นสตริง SVG — P = สี { plan, act, grid, text, today, bar } ── */
function msCurveSVG(cv, W, H, P) {
  if (!cv || !cv.weeks.length) return "";
  const L = 44, R = 14, T = 16, B = 40, w = W - L - R, h = H - T - B, n = cv.weeks.length;
  const X = (i) => L + (n === 1 ? w / 2 : (i * w) / (n - 1)), Y = (v) => T + h - (Math.max(0, Math.min(100, v)) / 100) * h;
  let g = "";
  for (let v = 0; v <= 100; v += 20) g += '<line x1="' + L + '" x2="' + (L + w) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + P.grid + '" stroke-width="1"/>' +
    '<text x="' + (L - 6) + '" y="' + (Y(v) + 3.5) + '" text-anchor="end" font-size="10" fill="' + P.text + '">' + v + "%</text>";
  const bw = Math.max(2, Math.min(18, (w / n) * 0.55)), mx = Math.max(1, ...cv.weeks.map((x) => x.plan));
  cv.weeks.forEach((x, i) => { if (x.plan > 0) { const bh = (x.plan / Math.max(mx, 10)) * h * 0.35; g += '<rect x="' + (X(i) - bw / 2) + '" y="' + (T + h - bh) + '" width="' + bw + '" height="' + bh + '" fill="' + P.bar + '" rx="1.5"/>'; } });
  const step = Math.max(1, Math.ceil(n / 16));
  cv.weeks.forEach((x, i) => {
    if (i % step && i !== n - 1) return;
    const dt = new Date(x.d * 86400000);
    g += '<text x="' + X(i) + '" y="' + (T + h + 14) + '" text-anchor="middle" font-size="9.5" fill="' + P.text + '">W' + x.n + "</text>" +
      '<text x="' + X(i) + '" y="' + (T + h + 26) + '" text-anchor="middle" font-size="8.5" fill="' + P.text + '" opacity=".75">' + dt.getUTCDate() + " " + MS_MON[dt.getUTCMonth()] + "</text>";
  });
  if (cv.td != null && cv.td >= cv.lo && cv.td <= cv.hi) {
    const tx = L + ((cv.td - cv.lo) / Math.max(1, cv.weeks[n - 1].d + 6 - cv.lo)) * w;
    g += '<line x1="' + tx + '" x2="' + tx + '" y1="' + T + '" y2="' + (T + h) + '" stroke="' + P.today + '" stroke-width="1.5" stroke-dasharray="4 3"/>' +
      '<text x="' + (tx + 4) + '" y="' + (T + 10) + '" font-size="9.5" fill="' + P.today + '" font-weight="700">วันนี้</text>';
  }
  g += '<polyline fill="none" stroke="' + P.plan + '" stroke-width="2.4" stroke-linejoin="round" points="' + cv.weeks.map((x, i) => X(i).toFixed(1) + "," + Y(x.planAcc).toFixed(1)).join(" ") + '"/>';
  const act = cv.weeks.map((x, i) => (x.act == null ? null : [X(i), Y(x.act), x.est]));
  let seg = [];
  const flush = () => { if (seg.length > 1) g += '<polyline fill="none" stroke="' + P.act + '" stroke-width="2.4" stroke-linejoin="round" points="' + seg.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ") + '"/>'; seg = []; };
  act.forEach((p) => { if (p) seg.push(p); else flush(); });
  flush();
  act.forEach((p) => { if (p) g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="' + (p[2] ? "#fff" : P.act) + '" stroke="' + P.act + '" stroke-width="1.5"/>'; });
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="100%" style="display:block;font-family:inherit">' + g + "</svg>";
}
const MS_CV_LIGHT = { plan: "#1B9B75", act: "#2563EB", grid: "#E3E9E5", text: "#5A6B62", today: "#DC2626", bar: "#CFEDE2" };
const MS_CV_UI = { plan: "var(--primary)", act: "#3B82F6", grid: "var(--divider)", text: "var(--text-3)", today: "var(--tint-red-tx)", bar: "color-mix(in srgb, var(--primary) 22%, transparent)" };

function MsSCurve({ cv, C, narrow }) {
  if (!cv) return null;
  const now = cv.weeks.filter((x) => x.act != null).slice(-1)[0];
  const diff = now ? Math.round((now.act - cv.planNow) * 10) / 10 : null;
  const box = (lab, v, tx) => (
    <div style={{ background: "var(--surface2)", borderRadius: "var(--r-tile)", padding: "7px 11px", minWidth: 96 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{lab}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 800, color: tx || "var(--text-1)" }}>{v}</div>
    </div>
  );
  return (
    <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: narrow ? "10px 10px" : "12px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <b style={{ fontSize: 13.5, color: "var(--text-1)" }}>S-Curve</b>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>% สะสมรายสัปดาห์ · แผนจากน้ำหนัก × ช่วงวันแผน · จริงจากภาพรวมที่จดไว้รายวัน</span>
        <span style={{ flex: 1 }} />
        {box("แผน ณ วันนี้", Math.round(cv.planNow * 10) / 10 + "%")}
        {box("ทำได้จริง", C.pct + "%")}
        {diff != null && box("ต่างจากแผน", (diff > 0 ? "+" : "") + diff + "%", diff < 0 ? "var(--tint-red-tx)" : "var(--tint-ok-tx)")}
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: narrow ? 520 : 0 }} dangerouslySetInnerHTML={{ __html: msCurveSVG(cv, 1000, narrow ? 300 : 260, MS_CV_UI) }} />
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
        <span><span style={{ display: "inline-block", width: 18, height: 3, background: "var(--primary)", verticalAlign: "middle", marginRight: 5 }} />แผนสะสม</span>
        <span><span style={{ display: "inline-block", width: 18, height: 3, background: "#3B82F6", verticalAlign: "middle", marginRight: 5 }} />ทำได้จริงสะสม</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, border: "1.5px solid #3B82F6", verticalAlign: "middle", marginRight: 5 }} />ประมาณจากรายงานประจำวัน (ก่อนเริ่มจด)</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "color-mix(in srgb, var(--primary) 22%, transparent)", verticalAlign: "middle", marginRight: 5 }} />แผนรายสัปดาห์</span>
      </div>
    </div>
  );
}

/* ── ส่งออก Excel: ชีต Master Schedule (แบบไฟล์ EPC S-Curve) + ชีต S-Curve มีกราฟเส้นของ Excel จริง ──
   xlsx-js-style เขียนกราฟไม่ได้ → เขียนสมุดก่อน แล้วเปิด zip (XLSX.CFB) เติม drawing + chart เอง */
const MS_XROW = 15;   // ความสูงแถวงานในไฟล์ Excel (pt)
const MS_XPCT = '0.00"%"';   // ช่องสัปดาห์ใน Excel โชว์เป็น % (ค่าในเซลล์ยังเป็นตัวเลข เช่น 1.25 → 1.25%)
function msExportXlsx(job, C, cv, today) {
  const X = window.XLSX;
  if (!X || !X.CFB) { window.askConfirm && window.askConfirm({ title: "ส่งออก Excel ไม่ได้", body: "ไลบรารี Excel ยังโหลดไม่เสร็จ ลองใหม่อีกครั้ง", ok: "ตกลง" }); return; }
  const serial = (iso) => { const d = msDay(iso); return d == null ? null : d + 25569; };
  const bd = { top: { style: "thin", color: { rgb: "D5DDD8" } }, bottom: { style: "thin", color: { rgb: "D5DDD8" } }, left: { style: "thin", color: { rgb: "D5DDD8" } }, right: { style: "thin", color: { rgb: "D5DDD8" } } };
  const font = (o) => Object.assign({ name: "Tahoma", sz: 10 }, o || {});
  const sty = (o) => Object.assign({ font: font(), border: bd, alignment: { vertical: "center" } }, o || {});
  const HDR = sty({ font: font({ bold: true, color: { rgb: "FFFFFF" } }), fill: { fgColor: { rgb: "1B5E4A" } }, alignment: { horizontal: "center", vertical: "center", wrapText: true } });
  const HEAD = sty({ font: font({ bold: true }), fill: { fgColor: { rgb: "E6F2EC" } } });
  const weeks = cv ? cv.weeks : [];
  const wl = msWkLab(weeks);   // หัวสัปดาห์ W1-W4/5 นับใหม่ทุกเดือน (ตรงกับแกนต์)
  const ws = {}, merges = [];
  const put = (r, c, v, st, t, z) => { const a = X.utils.encode_cell({ r, c }); ws[a] = { v: v == null ? "" : v, t: t || (typeof v === "number" ? "n" : "s"), s: st }; if (z) ws[a].z = z; };
  const name = [job.code, job.name].filter(Boolean).join(" · ");
  put(0, 0, "MASTER SCHEDULE — EPC S-Curve", sty({ font: font({ bold: true, sz: 16 }), border: {} }));
  put(1, 0, "โครงการ: " + name + (job.kw ? " · " + job.kw + " kWp" : ""), sty({ font: font({ sz: 11 }), border: {} }));
  put(2, 0, "ข้อมูล ณ " + msTH(today, true) + " · ทำได้จริง " + C.pct + "% · แผน ณ วันนี้ " + (cv ? Math.round(cv.planNow * 10) / 10 : 0) + "%", sty({ border: {} }));
  const H0 = 4, W0 = 10;   // แถวหัวตาราง · คอลัมน์สัปดาห์แรก (คอลัมน์ 9 = ป้าย Plan/Actual)
  /* Start/Finish คู่เดียว ใต้หัว Duration — แถว Plan = วันตามแผน · แถว Actual = วันทำจริง (แบบไฟล์ S-Curve ทั่วไป) */
  ["No", "Item", "% Weight", "Day", null, null, "ผลต่าง (วัน)", "% Progress", "สถานะ", ""].forEach((t, c) => { if (t == null) return; put(H0, c, t, HDR); put(H0 + 1, c, "", HDR); merges.push({ s: { r: H0, c }, e: { r: H0 + 1, c } }); });
  put(H0, 4, "Duration", HDR); put(H0, 5, "", HDR); merges.push({ s: { r: H0, c: 4 }, e: { r: H0, c: 5 } });
  put(H0 + 1, 4, "Start", HDR); put(H0 + 1, 5, "Finish", HDR);
  let mStart = 0;
  weeks.forEach((w, i) => {
    const dt = new Date(w.d * 86400000);
    put(H0 + 1, W0 + i, "W" + wl[i].k, HDR, "s");   // W1-W4/5 นับใหม่ทุกเดือน (ผู้ใช้เลือกแบบนี้แทนช่วงวันที่)
    const m = MS_MON[dt.getUTCMonth()] + " " + String(dt.getUTCFullYear() + 543).slice(2);
    const prev = i ? new Date(weeks[i - 1].d * 86400000) : null;
    if (!prev || prev.getUTCMonth() !== dt.getUTCMonth()) {
      if (i) merges.push({ s: { r: H0, c: W0 + mStart }, e: { r: H0, c: W0 + i - 1 } });
      mStart = i;
      put(H0, W0 + i, m, HDR);
    } else put(H0, W0 + i, "", HDR);
  });
  if (weeks.length) merges.push({ s: { r: H0, c: W0 + mStart }, e: { r: H0, c: W0 + weeks.length - 1 } });
  let r = H0 + 2;
  const r0data = r;
  const td = msDay(today);
  const PLAN_F = "BFE6D6", ACT_F = "C7DBFB", HEAD_F = "9FD6C1";   // เขียว = แผน · ฟ้า = ทำจริง (สีเดียวกับเส้นกราฟ)
  const wkCell = (rr, i, v, fill) => put(rr, W0 + i, v === "" || v == null || Math.abs(v) < 0.005 ? "" : Math.round(v * 100) / 100,
    sty({ font: font({ sz: 8 }), alignment: { horizontal: "center" }, fill: fill ? { fgColor: { rgb: fill } } : undefined }), v === "" || v == null || Math.abs(v) < 0.005 ? "s" : "n", MS_XPCT);
  C.rows.forEach((row) => {
    const head = row.head && row.kids, st = head ? HEAD : sty();
    const two = !head;   // งานย่อย = 2 แถว Plan / Actual · หัวข้อใหญ่ = แถวเดียว (แถบช่วงแผน)
    const left = (c, v, s2, t, z) => { put(r, c, v, s2, t, z); if (two) { put(r + 1, c, "", s2); merges.push({ s: { r, c }, e: { r: r + 1, c } }); } };
    left(0, row.no, st);
    left(1, (head ? "" : "   ") + row.th, st);
    left(2, Math.round((row.wp || 0) * 100) / 100, Object.assign({}, st, { alignment: { horizontal: "right", vertical: "center" } }), "n", "0.00");
    const du = msDur(row.planStart, row.planEnd);
    left(3, du || "", Object.assign({}, st, { alignment: { horizontal: "right", vertical: "center" } }));
    const a = serial(row.planStart), b = serial(row.planEnd || row.planStart);
    const c = serial(row.actStart), e = serial(row.actEnd);
    const dput = (rr, cc, v) => put(rr, cc, v == null ? "" : v, Object.assign({}, st, { alignment: { horizontal: "center", vertical: "center" } }), v == null ? "s" : "n", "d/m/yyyy");
    dput(r, 4, a); dput(r, 5, b);
    if (two) { dput(r + 1, 4, c); dput(r + 1, 5, e); }
    const dv = row.var != null ? row.var : row.lateBy != null ? row.lateBy : null;
    left(6, dv == null ? "" : dv, Object.assign({}, st, { alignment: { horizontal: "right", vertical: "center" }, font: font({ bold: !!head, color: { rgb: dv > 0 ? "B91C1C" : dv < 0 ? "15803D" : "15211A" } }) }), dv == null ? "s" : "n", "+0;-0;0");
    left(7, msPct(row.pct) / 100, Object.assign({}, st, { alignment: { horizontal: "right", vertical: "center" } }), "n", "0%");
    left(8, msStLabel(row), Object.assign({}, st, { font: font({ bold: !!head, color: { rgb: row.st === "late" || row.st === "donelate" ? "B91C1C" : row.st === "done" ? "15803D" : "15211A" } }) }));
    const ps = msDay(row.planStart), pe = msDay(row.planEnd || row.planStart);
    const as = msDay(row.actStart), ae = msDay(row.actEnd) != null ? msDay(row.actEnd) : as != null && td != null ? Math.max(as, td) : null;
    const pctT = msPct(row.pct);
    if (head) {
      put(r, 9, "", st);
      weeks.forEach((w, i) => wkCell(r, i, "", ps != null && Math.min(pe, w.d + 6) >= Math.max(ps, w.d) ? HEAD_F : null));
      r++;
      return;
    }
    put(r, 9, "Plan", sty({ font: font({ sz: 9, bold: true }), alignment: { horizontal: "center" }, fill: { fgColor: { rgb: PLAN_F } } }));
    put(r + 1, 9, "Actual", sty({ font: font({ sz: 9, bold: true }), alignment: { horizontal: "center" }, fill: { fgColor: { rgb: ACT_F } } }));
    weeks.forEach((w, i) => {
      /* ช่องสัปดาห์ = % ของงานนั้นเอง (รวมทั้งแถวแผน = 100%) — % ของทั้งโครงการ = ค่านี้ × % Weight (ดูแถวสรุปด้านล่าง) (ผู้ใช้สั่ง)
         แผน: สัดส่วนวันแผนที่ตกในสัปดาห์ */
      const inP = ps != null && Math.min(pe, w.d + 6) >= Math.max(ps, w.d);
      wkCell(r, i, inP ? (100 * (Math.min(pe, w.d + 6) - Math.max(ps, w.d) + 1)) / (pe - ps + 1) : "", inP ? PLAN_F : null);
      /* ทำจริง: %คืบหน้าของงาน กระจายตามวันในช่วงทำจริง — ไม่มีประวัติรายสัปดาห์รายงาน จึงเป็นค่าประมาณ */
      const inA = as != null && ae != null && Math.min(ae, w.d + 6) >= Math.max(as, w.d);
      wkCell(r + 1, i, inA && pctT ? (pctT * (Math.min(ae, w.d + 6) - Math.max(as, w.d) + 1)) / (ae - as + 1) : "", inA ? ACT_F : null);
    });
    r += 2;
  });
  const r1data = r - 1;
  const sumRow = (label, val, z, rgb) => {
    put(r, 0, label, sty({ font: font({ bold: true }), fill: { fgColor: { rgb } } }));
    for (let c = 1; c < W0; c++) put(r, c, "", sty({ fill: { fgColor: { rgb } } }));
    merges.push({ s: { r, c: 0 }, e: { r, c: W0 - 1 } });
    weeks.forEach((w, i) => { const v = val(w); put(r, W0 + i, v == null ? "" : Math.round(v * 100) / 100, sty({ font: font({ sz: 8, bold: true }), alignment: { horizontal: "center" }, fill: { fgColor: { rgb } } }), v == null ? "s" : "n", z); });
    r++;
  };
  r++;
  sumRow("ESTIMATED WEEKLY IN % — แผนรายสัปดาห์", (w) => w.plan, MS_XPCT, "F3F6F4");
  sumRow("ESTIMATED PERCENTAGE ACCUMULATE — แผนสะสม", (w) => w.planAcc, MS_XPCT, "E6F2EC");
  sumRow("ACTUAL PERCENT PROJECT COMPLETED ACCUMULATE — ทำได้จริงสะสม", (w) => w.act, MS_XPCT, "E3ECFB");
  sumRow("DIFF. PERCENTAGE ACCUMULATE — ต่างจากแผน", (w) => (w.act == null ? null : w.act - w.planAcc), MS_XPCT, "FBEDE3");
  /* ตำนานสีช่องสัปดาห์ */
  put(r + 1, 1, "ช่องสัปดาห์ = % ของงานนั้น (แถว Plan รวม = 100%) · % ของทั้งโครงการ = ค่านี้ × % Weight (แถวสรุปด้านล่าง) · แถว Plan (เขียว) = แผน · แถว Actual (ฟ้า) = ทำได้จริง (ประมาณ: %คืบหน้า กระจายตามวันที่ทำจริง) · เส้นบนแกนต์ = S-Curve สะสม (เขียว แผน / ฟ้า จริง) · ผลต่าง (วัน): + ช้า / − เร็วกว่าแผน", sty({ font: font({ sz: 9, color: { rgb: "5A6B62" } }), border: {} }));
  r += 1;
  ws["!ref"] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r, c: Math.max(W0 + weeks.length - 1, 12) } });
  ws["!merges"] = merges;
  ws["!rows"] = []; for (let i = r0data; i <= r1data; i++) ws["!rows"][i] = { hpt: MS_XROW };   // สูงเท่ากันทุกแถว → ป้าย % บนเส้น S-Curve วางตรงจุด
  ws["!cols"] = [{ wch: 6 }, { wch: 46 }, { wch: 9 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 9 }, { wch: 17 }, { wch: 7 }].concat(weeks.map(() => ({ wch: 7 })));
  ws["!freeze"] = { xSplit: W0, ySplit: H0 + 2 };
  ws["!views"] = [{ state: "frozen", xSplit: W0, ySplit: H0 + 2 }];

  /* ชีต S-Curve: ตาราง + กราฟ */
  const cs = {};
  const cput = (rr, c, v, st, t, z) => { const a = X.utils.encode_cell({ r: rr, c }); cs[a] = { v: v == null ? "" : v, t: t || (typeof v === "number" ? "n" : "s"), s: st }; if (z) cs[a].z = z; };
  cput(0, 0, "S-Curve — " + name, sty({ font: font({ bold: true, sz: 13 }), border: {} }));
  ["สัปดาห์", "เริ่มสัปดาห์", "แผนรายสัปดาห์ %", "แผนสะสม %", "จริงสะสม %", "ต่างจากแผน %"].forEach((t, c) => cput(1, c, t, HDR));
  weeks.forEach((w, i) => {
    cput(2 + i, 0, wl[i].lab, sty());
    cput(2 + i, 1, w.d + 25569, sty(), "n", "d/m/yyyy");
    cput(2 + i, 2, Math.round(w.plan * 100) / 100, sty(), "n", "0.00");
    cput(2 + i, 3, Math.round(w.planAcc * 100) / 100, sty(), "n", "0.00");
    /* สัปดาห์ที่ยังไม่ถึง: ไม่สร้างเซลล์เลย — เซลล์ข้อความว่าง Excel วาดเป็น 0 (กราฟดิ่งลงพื้น) */
    if (w.act != null) cput(2 + i, 4, Math.round(w.act * 100) / 100, sty(), "n", "0.00");
    if (w.act != null) cput(2 + i, 5, Math.round((w.act - w.planAcc) * 100) / 100, sty(), "n", "0.00");
  });
  const last = 2 + Math.max(0, weeks.length - 1);
  cs["!ref"] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: last, c: 5 } });
  cs["!cols"] = [{ wch: 9 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 13 }];
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "Master Schedule");
  X.utils.book_append_sheet(wb, cs, "S-Curve");
  const buf = X.write(wb, { type: "array", bookType: "xlsx" });
  let out = buf;
  if (weeks.length) {
    try { out = msAddChart(X.CFB, new Uint8Array(buf), weeks, last + 1, { x: W0, y: H0 + 2 }, r1data >= r0data ? { c0: W0, r0: r0data, r1: r1data, rowEmu: MS_XROW * 12700, colEmu: Math.round((7 * 7 + 5) * 9525) } : null); } catch (e) { console.warn("S-Curve chart", e); }
  }
  const fn = (window.rpFileName ? window.rpFileName(job, "MS") : "Master Schedule " + (job.code || "")) + ".xlsx";
  const url = URL.createObjectURL(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a"); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
/* ป้ายสัปดาห์แบบนับในเดือน (ตามวันจันทร์ของสัปดาห์): k = 1,2,3… · lab = "พ.ย. W1" */
function msWkLab(weeks) {
  let key = null, k = 0;
  return weeks.map((w) => {
    const x = new Date(w.d * 86400000), kk = x.getUTCFullYear() * 12 + x.getUTCMonth();
    k = kk === key ? k + 1 : 1; key = kk;
    return { k, lab: MS_MON[x.getUTCMonth()] + " W" + k };
  });
}
/* เติมกราฟเส้น S-Curve ลงชีตที่ 2 (sheet2.xml) — rows = แถวข้อมูลสุดท้าย (1-based) */
function msAddChart(CFB, bytes, weeks, lastRow, freeze, ov) {
  const z = CFB.read(bytes, { type: "array" });
  const enc = (t) => new TextEncoder().encode(t), dec = (u) => new TextDecoder().decode(u);
  const get = (p) => { const e = CFB.find(z, p); return e ? dec(e.content) : null; };
  const set = (p, t) => { const e = CFB.find(z, p); if (e) e.content = enc(t); else CFB.utils.cfb_add(z, p, enc(t)); };
  const xe = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const N = weeks.length, r0 = 3, r1 = lastRow;
  const cat = "<c:cat><c:strRef><c:f>'S-Curve'!$A$" + r0 + ":$A$" + r1 + "</c:f><c:strCache><c:ptCount val=\"" + N + "\"/>" +
    msWkLab(weeks).map((w, i) => '<c:pt idx="' + i + '"><c:v>' + xe(w.lab) + "</c:v></c:pt>").join("") + "</c:strCache></c:strRef></c:cat>";
  const ser = (idx, col, title, rgb, vals, dash) => "<c:ser><c:idx val=\"" + idx + "\"/><c:order val=\"" + idx + "\"/><c:tx><c:v>" + xe(title) + "</c:v></c:tx>" +
    '<c:spPr><a:ln w="28575" cap="rnd"><a:solidFill><a:srgbClr val="' + rgb + '"/></a:solidFill>' + (dash ? '<a:prstDash val="dash"/>' : "") + '<a:round/></a:ln></c:spPr>' +
    (idx ? '<c:marker><c:symbol val="circle"/><c:size val="5"/><c:spPr><a:solidFill><a:srgbClr val="' + rgb + '"/></a:solidFill></c:spPr></c:marker>' : '<c:marker><c:symbol val="none"/></c:marker>') +
    cat + "<c:val><c:numRef><c:f>'S-Curve'!$" + col + "$" + r0 + ":$" + col + "$" + r1 + "</c:f><c:numCache><c:formatCode>0.00</c:formatCode><c:ptCount val=\"" + N + "\"/>" +
    vals.map((v, i) => (v == null ? "" : '<c:pt idx="' + i + '"><c:v>' + (Math.round(v * 100) / 100) + "</c:v></c:pt>")).join("") + '</c:numCache></c:numRef></c:val><c:smooth val="0"/></c:ser>';
  const chart = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<c:roundedCorners val="0"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr lang="th-TH" sz="1400" b="1"/><a:t>EPC S-Curve</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>' +
    '<c:autoTitleDeleted val="0"/><c:plotArea><c:layout/><c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>' +
    ser(0, "D", "แผนสะสม (Plan)", "1B9B75", weeks.map((w) => w.planAcc)) + ser(1, "E", "ทำได้จริงสะสม (Actual)", "2563EB", weeks.map((w) => w.act)) +
    '<c:marker val="1"/><c:axId val="50010001"/><c:axId val="50010002"/></c:lineChart>' +
    '<c:catAx><c:axId val="50010001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50010002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>' +
    '<c:valAx><c:axId val="50010002"/><c:scaling><c:orientation val="minMax"/><c:max val="100"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln><a:solidFill><a:srgbClr val="E3E9E5"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="0&quot;%&quot;" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50010001"/><c:crosses val="autoZero"/><c:crossBetween val="between"/><c:majorUnit val="20"/></c:valAx>' +
    '</c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>';
  const drawing = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
    '<xdr:twoCellAnchor><xdr:from><xdr:col>7</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>' +
    '<xdr:to><xdr:col>22</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>28</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>' +
    '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="S-Curve"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>' +
    '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">' +
    '<c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/>' +
    '</a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
  set("/xl/charts/chart1.xml", chart);
  set("/xl/drawings/drawing1.xml", drawing);
  set("/xl/drawings/_rels/drawing1.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/></Relationships>');
  const relP = "/xl/worksheets/_rels/sheet2.xml.rels";
  let rel = get(relP);
  const drRel = '<Relationship Id="rIdMsDr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>';
  rel = rel ? rel.replace("</Relationships>", drRel + "</Relationships>")
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + drRel + "</Relationships>";
  set(relP, rel);
  let sh = get("/xl/worksheets/sheet2.xml");
  if (!/xmlns:r=/.test(sh)) sh = sh.replace("<worksheet ", '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
  sh = sh.replace("</worksheet>", '<drawing r:id="rIdMsDr1"/></worksheet>');
  set("/xl/worksheets/sheet2.xml", sh);
  /* เส้น S-Curve ทับบนแกนต์ในชีตแรก — วาดเป็น "เส้นอิสระ" (freeform ไม่มีพื้น) แทนกราฟ Excel:
     กราฟ Excel กินคลิกทั้งกรอบ กดแก้ช่องด้านหลังไม่ได้ (ผู้ใช้แจ้ง) · เส้นไม่มีพื้นรับคลิกเฉพาะตัวเส้น ช่องรอบ ๆ กดแก้ได้ปกติ
     กรอบเส้นวางตรงช่องสัปดาห์ (คอลัมน์ ov.c0 … +N · แถวงานแรก … สุดท้าย) จุดของสัปดาห์อยู่กลางคอลัมน์ · ค่าเป็นภาพนิ่ง ณ ตอนส่งออก */
  if (ov) {
    const PW = N * 1000, PH = 10000, nR = ov.r1 - ov.r0 + 1, ROW = ov.rowEmu, COL = ov.colEmu;
    const px = (i) => i * 1000 + 500, py = (v) => Math.round(((100 - Math.max(0, Math.min(100, v))) / 100) * PH);
    const from = '<xdr:from><xdr:col>' + ov.c0 + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + ov.r0 + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>' +
      '<xdr:to><xdr:col>' + (ov.c0 + N) + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + (ov.r1 + 1) + '</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>';
    let sid = 10;
    const line = (name, vals, rgb) => {
      let path = "", open = false;
      vals.forEach((v, i) => {
        if (v == null) { open = false; return; }
        path += (open ? "<a:lnTo>" : "<a:moveTo>") + '<a:pt x="' + px(i) + '" y="' + py(v) + '"/>' + (open ? "</a:lnTo>" : "</a:moveTo>");
        open = true;
      });
      if (!path) return "";
      return '<xdr:twoCellAnchor editAs="twoCell">' + from + '<xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="' + sid++ + '" name="' + xe(name) + '"/><xdr:cNvSpPr/></xdr:nvSpPr>' +
        '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></a:xfrm><a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst/><a:rect l="0" t="0" r="r" b="b"/>' +
        '<a:pathLst><a:path w="' + PW + '" h="' + PH + '" fill="none">' + path + '</a:path></a:pathLst></a:custGeom><a:noFill/>' +
        '<a:ln w="28575" cap="rnd"><a:solidFill><a:srgbClr val="' + rgb + '"/></a:solidFill><a:round/></a:ln></xdr:spPr></xdr:sp><xdr:clientData/></xdr:twoCellAnchor>';
    };
    /* ป้าย % บนเส้นแผน (กล่องเล็กเหนือจุด) — สัปดาห์เยอะเกิน 40 ป้ายจะทับกัน เลยไม่ใส่ */
    const label = (i, v) => {
      const y = ov.r0 * 1 + ((100 - Math.max(0, Math.min(100, v))) / 100) * nR - 0.95;   // เป็นหน่วยแถว · ยกขึ้นเหนือจุดเกือบ 1 แถว
      const row = Math.max(ov.r0, Math.floor(y)), off = Math.max(0, Math.round((y - row) * ROW));
      return '<xdr:oneCellAnchor><xdr:from><xdr:col>' + (ov.c0 + i) + '</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>' + row + '</xdr:row><xdr:rowOff>' + off + '</xdr:rowOff></xdr:from>' +
        '<xdr:ext cx="' + COL + '" cy="' + Math.round(ROW * 0.8) + '"/><xdr:sp macro="" textlink=""><xdr:nvSpPr><xdr:cNvPr id="' + sid++ + '" name="ป้ายแผน ' + (i + 1) + '"/><xdr:cNvSpPr txBox="1"/></xdr:nvSpPr>' +
        '<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + COL + '" cy="' + Math.round(ROW * 0.8) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></xdr:spPr>' +
        '<xdr:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" anchor="b"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:r><a:rPr lang="en-US" sz="700" b="1"><a:solidFill><a:srgbClr val="1B5E4A"/></a:solidFill></a:rPr>' +
        '<a:t>' + (Math.round(v * 100) / 100).toFixed(2) + '%</a:t></a:r></a:p></xdr:txBody></xdr:sp><xdr:clientData/></xdr:oneCellAnchor>';
    };
    const drawing2 = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
      line("S-Curve แผนสะสม", weeks.map((w) => w.planAcc), "1B9B75") + line("S-Curve ทำได้จริงสะสม", weeks.map((w) => w.act), "2563EB") +
      (N <= 40 ? weeks.map((w, i) => label(i, w.planAcc)).join("") : "") + "</xdr:wsDr>";
    set("/xl/drawings/drawing2.xml", drawing2);
    const relP1 = "/xl/worksheets/_rels/sheet1.xml.rels";
    let rel1 = get(relP1);
    const drRel1 = '<Relationship Id="rIdMsDr2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing2.xml"/>';
    rel1 = rel1 ? rel1.replace("</Relationships>", drRel1 + "</Relationships>")
      : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + drRel1 + "</Relationships>";
    set(relP1, rel1);
    let s1d = get("/xl/worksheets/sheet1.xml");
    if (!/xmlns:r=/.test(s1d)) s1d = s1d.replace("<worksheet ", '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ');
    s1d = s1d.replace("</worksheet>", '<drawing r:id="rIdMsDr2"/></worksheet>');
    set("/xl/worksheets/sheet1.xml", s1d);
  }
  /* ตรึงแนว (Freeze Panes) ชีตแรก: คอลัมน์ No…สถานะ + หัวตาราง 2 แถว — xlsx-js-style ไม่เขียน !freeze ให้ เลยเขียน sheetViews เอง */
  let s1 = get("/xl/worksheets/sheet1.xml");
  if (s1 && freeze) {
    const tl = String.fromCharCode(65 + freeze.x) + (freeze.y + 1);
    const sv = '<sheetViews><sheetView workbookViewId="0"><pane xSplit="' + freeze.x + '" ySplit="' + freeze.y + '" topLeftCell="' + tl + '" activePane="bottomRight" state="frozen"/><selection pane="topRight"/><selection pane="bottomLeft"/><selection pane="bottomRight" activeCell="' + tl + '" sqref="' + tl + '"/></sheetView></sheetViews>';
    const svRe = /<sheetViews[\s\S]*?<\/sheetViews>|<sheetViews\/>/;
    if (svRe.test(s1)) s1 = s1.replace(svRe, sv);
    else s1 = s1.replace(/<sheetFormatPr|<cols>|<sheetData/, (m) => sv + m);
    set("/xl/worksheets/sheet1.xml", s1);
  }
  let ct = get("/[Content_Types].xml");
  ct = ct.replace("</Types>", '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' +
    '<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>' +
    (ov ? '<Override PartName="/xl/drawings/drawing2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' : "") + "</Types>");
  set("/[Content_Types].xml", ct);
  return CFB.write(z, { fileType: "zip", type: "array" });
}

/* จอแคบ — ฟังการเปลี่ยนขนาด (หมุนจอ/ลากหน้าต่าง) แบบ useIsMobile ของ app.jsx ที่โหลดทีหลังไฟล์นี้ */
function useMsNarrow(bp) {
  const mq = React.useMemo(() => window.matchMedia("(max-width: " + bp + "px)"), [bp]);
  const [m, setM] = React.useState(mq.matches);
  React.useEffect(() => { const fn = (e) => setM(e.matches); mq.addEventListener("change", fn); return () => mq.removeEventListener("change", fn); }, [mq]);
  return m;
}

/* ── ตัวเก็บ masterSchedule/{jobId} ── */
function useMasterSchedule(jobId) {
  const [data, setData] = React.useState(undefined);   // undefined = กำลังโหลด · null = ยังไม่เคยทำ
  React.useEffect(() => {
    if (!jobId || !window.FBDB) { setData(null); return; }
    const ref = window.FBDB.ref("masterSchedule/" + jobId);
    const h = ref.on("value", (s) => { const v = s.val(); setData(v && Array.isArray(v.rows) ? v : null); }, () => setData(null));
    return () => ref.off("value", h);
  }, [jobId]);
  const save = React.useCallback((rows, user) => {
    if (!jobId || !window.FBDB) return Promise.resolve();
    const clean = (rows || []).filter((r) => !r.ro).map((r) => ({
      id: r.id || msId(), th: String(r.th || ""), head: !!r.head, link: r.link || "", owner: String(r.owner || ""),
      planStart: r.planStart || "", planEnd: r.planEnd || "", pct: msPct(r.pct), actStart: r.actStart || "", actEnd: r.actEnd || "",
      w: msW(r.w) == null ? "" : msW(r.w), dur: Math.max(0, Math.round(+r.dur || 0)) || "",
    }));
    return window.FBDB.ref("masterSchedule/" + jobId).set({ rows: clean, updatedAt: new Date().toISOString(), byName: (user && user.name) || "" });
  }, [jobId]);
  return { data, rows: data && data.rows ? data.rows : null, loading: data === undefined, save };
}

/* ── ภาพรวม % รายวันสำหรับเส้น "จริง" ของ S-Curve — masterScheduleHist/{jobId}/{YYYY-MM-DD} = % ──
   (ผู้ใช้เลือก 17 พ.ย. 2026 "เก็บภาพรวมรายวันอัตโนมัติ") จดเมื่อมีคนเปิดใบงาน/แผนแล้ว % วันนี้ไม่ตรงกับที่จดไว้ */
function useMsHist(jobId) {
  const [h, setH] = React.useState(undefined);
  React.useEffect(() => {
    if (!jobId || !window.FBDB) { setH(null); return; }
    const ref = window.FBDB.ref("masterScheduleHist/" + jobId);
    const fn = ref.on("value", (x) => setH(x.val() || {}), () => setH(null));
    return () => ref.off("value", fn);
  }, [jobId]);
  return h;
}
/* ค่าประมาณย้อนหลังจากรายงานประจำวัน (ก่อนเริ่มจด) — ขั้นงานติดตั้งใช้ตารางของใบวันนั้น งานอื่น min(% ตอนนี้, % ตามแผน) */
function msEstHist(rows, daily, job, crew) {
  const out = {};
  if (!daily || !daily.byDate) return out;
  Object.keys(daily.byDate).forEach((d) => {
    const rec = daily.byDate[d];
    if (!rec || !rec.steps || !rec.steps.length) return;
    out[d] = msCompute(rows, msInstallRowsOf(rec.steps, crew), job, d, d).pct;
  });
  return out;
}

/* ข้อมูลกลางของหน้าต่าง/การ์ด — แผน + ขั้นงานติดตั้งจากรายงานประจำวัน */
function useMsData(job) {
  const ms = useMasterSchedule(job ? job.id : null);
  const daily = window.useDailyReports ? window.useDailyReports(job ? job.id : null) : null;
  const crew = (job && (job.contractor || "")) || "ทีมติดตั้ง";
  const inst = React.useMemo(() => msInstallRows(daily, crew), [daily && daily.plan, daily && daily.byDate, crew]);
  return { ms, inst, daily, crew };
}

/* ── วง % รวม (โดนัท) ── */
function MsRing({ pct, size }) {
  const s = size || 64, r = s / 2 - 5, c = 2 * Math.PI * r;
  return (
    <svg width={s} height={s} viewBox={"0 0 " + s + " " + s} style={{ flexShrink: 0 }}>
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={MS_TRACK} strokeWidth="7" />
      {pct > 0 && <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={(c * pct) / 100 + " " + c} transform={"rotate(-90 " + s / 2 + " " + s / 2 + ")"} />}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fontFamily: "var(--mono)", fontSize: s * 0.24, fontWeight: 800, fill: "var(--text-1)" }}>{pct}%</text>
    </svg>
  );
}

/* ── หัวสรุปแบบไฟล์ตัวอย่าง: จำนวนงาน · เสร็จ · กำลังทำ · ยังไม่เริ่ม · (ล่าช้า) + วง % + เริ่ม/จบ/วัน ── */
function MsSummary({ C, today, narrow }) {
  const td = msDay(today);
  const days = C.lo != null ? C.hi - C.lo + 1 : null;
  const left = C.hi != null && td != null ? C.hi - td : null;
  const tile = (lab, val, tx, bg) => (
    <div key={lab} style={{ flex: "1 1 0", minWidth: narrow ? 70 : 92, background: bg || "var(--surface)", boxShadow: bg ? "none" : "var(--shadow-sm)",
      borderRadius: "var(--r-tile)", padding: narrow ? "8px 10px" : "10px 13px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: tx || "var(--text-3)", whiteSpace: "nowrap" }}>{lab}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: narrow ? 18 : 22, fontWeight: 800, color: tx || "var(--text-1)", marginTop: 2 }}>{val}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)",
        padding: narrow ? "8px 12px" : "10px 16px", flex: narrow ? "1 1 100%" : "0 0 auto" }}>
        <MsRing pct={C.pct} size={narrow ? 56 : 64} />
        <div style={{ fontSize: 12, lineHeight: 1.7, color: "var(--text-2)" }}>
          <div><span style={{ color: "var(--text-3)" }}>เริ่ม</span> <b>{C.lo != null ? msTH(msIso(C.lo), true) : "—"}</b>
            <span style={{ color: "var(--text-3)", marginLeft: 10 }}>จบ</span> <b>{C.hi != null ? msTH(msIso(C.hi), true) : "—"}</b></div>
          <div>{days != null ? "รวม " + days + " วัน" : "ยังไม่ใส่วันแผน"}
            {left != null && <b style={{ marginLeft: 10, color: left < 0 && C.pct < 100 ? "var(--tint-red-tx)" : "var(--text-1)" }}>
              {C.pct >= 100 ? "เสร็จแล้ว" : left > 0 ? "เหลือ " + left + " วัน" : left === 0 ? "ครบกำหนดวันนี้" : "เลยกำหนด " + -left + " วัน"}</b>}
          </div>
        </div>
      </div>
      {tile("งานทั้งหมด", C.leaves)}
      {tile("เสร็จแล้ว", C.cnt.done, "var(--tint-ok-tx)", "var(--tint-ok-bg)")}
      {tile("กำลังทำ", C.cnt.doing, "var(--tint-amber-tx)", "var(--tint-amber-bg)")}
      {tile("ยังไม่เริ่ม", C.cnt.todo)}
      {C.cnt.late > 0 && tile("ล่าช้า", C.cnt.late, "var(--tint-red-tx)", "var(--tint-red-bg)")}
    </div>
  );
}

const MsPill = ({ st, small, label }) => {
  const s = MS_ST[st] || MS_ST.todo;
  return <span style={{ display: "inline-block", fontSize: small ? 10 : 10.5, fontWeight: 700, color: s.tx, background: s.bg, padding: small ? "2px 7px" : "3px 9px",
    borderRadius: "var(--r-pill)", whiteSpace: "nowrap" }}>{label || s.th}</span>;
};

/* ── กราฟแกนต์ — แถบเดียวต่องาน (ช่วงแผน) ระบายทับตาม % แบบไฟล์ตัวอย่าง · ตารางซ้ายค้างไว้ เลื่อนแนวนอนได้ ──
   compact = การ์ดในใบงาน (หัวข้อใหญ่อย่างเดียว ไม่เลื่อน) */
/* คอลัมน์ซ้ายที่ล็อกตอนเลื่อน ต้องพื้นทึบ — ธีมกระจก --surface โปร่งแสง แกนต์จะเห็นทะลุ → ซ้อนสีบนพื้น --bg */
const msSolid = (c) => "linear-gradient(" + c + "," + c + ") var(--bg)";
function MsGantt({ C, today, compact, narrow, mid, wcol }) {
  if (C.lo == null) {
    return <div style={{ padding: "18px 4px", fontSize: 12.5, color: "var(--text-3)" }}>ยังไม่มีวันในแผน — กด "แก้แผนงาน" แล้วใส่วันเริ่ม/จบ</div>;
  }
  const A = msAxis(C, today, compact ? 0 : 1);
  const rows = compact ? C.rows.filter((r) => r.head) : C.rows;
  const pxDay = compact ? 0 : A.span <= 49 ? 24 : A.span <= 120 ? 12 : 5;
  const dayHead = pxDay >= 20;
  const full = !compact && !narrow;          // มีคอลัมน์ ID · แถบ % · สถานะ
  const dates = full && !mid;                // จอกว้างพอค่อยโชว์คอลัมน์เริ่ม/จบ (จอกลางดูจากแกนต์แทน)
  /* คอลัมน์ซ้าย: ID · งาน(+ผู้รับผิดชอบ) · เริ่ม · จบ · % · สถานะ (จอกลางตัดเริ่ม/จบ · จอแคบเหลือ งาน + %) */
  const wc = !!wcol && !compact && !narrow;      // คอลัมน์ % น้ำหนัก (แผนแบบไฟล์ S-Curve)
  const cols = compact ? (narrow ? "1fr 34px" : "1fr 38px") : narrow ? "1fr 40px" : (mid ? "38px minmax(150px,1fr)" : "38px minmax(180px,1fr) 62px 62px") + (wc ? " 44px" : "") + " 74px 104px";
  const labW = (compact ? (narrow ? 124 : 150) : narrow ? 168 : mid ? 426 : 586) + (wc ? 50 : 0);
  const rh = compact ? 20 : 34;
  const headH = compact ? 16 : dayHead ? 46 : 30;
  const showToday = A.td != null && A.td >= A.lo && A.td <= A.hi;
  const weekend = [];
  if (pxDay >= 5) for (let d = A.lo; d <= A.hi; d++) { const w = new Date(d * 86400000).getUTCDay(); if (w === 0) weekend.push(d); }
  const thS = { fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", whiteSpace: "nowrap" };
  return (
    <div style={{ overflowX: compact ? "hidden" : "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ display: "grid", gridTemplateColumns: labW + "px 1fr", minWidth: compact ? 0 : labW + A.span * pxDay }}>
        {/* หัวตาราง */}
        <div style={{ position: "sticky", left: 0, zIndex: 3, background: msSolid("var(--surface)"), height: headH, display: "grid", gridTemplateColumns: cols,
          alignItems: "end", gap: 6, paddingBottom: 4, paddingRight: 8, borderBottom: compact ? "none" : "1px solid var(--divider)" }}>
          {!compact && (narrow ? <><span style={thS}>งาน</span><span style={Object.assign({}, thS, { textAlign: "right" })}>%</span></>
            : <><span style={thS}>ID</span><span style={thS}>งาน</span>{dates && <span style={thS}>เริ่ม</span>}{dates && <span style={thS}>จบ</span>}{wc && <span style={Object.assign({}, thS, { textAlign: "right" })} title="% น้ำหนักต่อทั้งโครงการ">น้ำหนัก</span>}<span style={thS}>ความคืบหน้า</span><span style={thS}>สถานะ</span></>)}
        </div>
        <div style={{ position: "relative", height: headH, borderBottom: compact ? "none" : "1px solid var(--divider)" }}>
          {compact ? A.months.map((m) => (
            <span key={"m" + m.d} style={{ position: "absolute", left: A.X(m.d) + "%", top: 0, fontSize: compact ? 9.5 : 10.5, fontWeight: 800, color: "var(--text-2)",
              paddingLeft: 3, borderLeft: m.d !== A.lo ? "1px solid var(--divider)" : "none", whiteSpace: "nowrap", height: compact ? "100%" : 15 }}>{m.th}</span>
          ))
            : A.mg.map((g, i) => (
            <span key={"m" + g.d} style={{ position: "absolute", left: A.X(g.d) + "%", width: A.W(g.d, g.d + 7 * g.n - 1) + "%", top: 0, height: 15, fontSize: 10.5, fontWeight: 800, color: "var(--text-2)",
              paddingLeft: 3, borderLeft: i ? "1px solid var(--divider)" : "none", whiteSpace: "nowrap", overflow: "hidden", boxSizing: "border-box" }}>{g.th}</span>
          ))}
          {!compact && A.weeks.map((w) => (
            <span key={"w" + w.d} style={{ position: "absolute", left: A.X(w.d) + "%", width: A.W(w.d, w.d + 6) + "%", top: 15, height: 14, fontSize: 9.5, fontWeight: 700,
              color: "var(--text-3)", paddingLeft: 3, borderLeft: "1px solid var(--divider)", whiteSpace: "nowrap", overflow: "hidden", boxSizing: "border-box" }}>
              {"W" + w.k}</span>
          ))}
          {dayHead && Array.from({ length: A.span }, (_, i) => {
            const d = A.lo + i, x = new Date(d * 86400000), wd = x.getUTCDay();
            return (
              <span key={"d" + d} style={{ position: "absolute", left: A.X(d) + "%", width: A.W(d, d) + "%", top: 29, height: 16, textAlign: "center", lineHeight: 1,
                fontSize: 9, color: d === A.td ? "var(--tint-red-tx)" : wd === 0 ? "var(--text-3)" : "var(--text-2)", fontWeight: d === A.td ? 800 : 500 }}>
                <span style={{ display: "block", fontSize: 8, opacity: 0.75 }}>{MS_DOW[wd]}</span>{x.getUTCDate()}</span>
            );
          })}
        </div>
        {rows.map((r, i) => {
          const ps = msDay(r.planStart), pe = msDay(r.planEnd || r.planStart);
          const st = MS_ST[r.st] || MS_ST.todo;
          const sub = !r.head;
          const line = r.head && i && !compact ? "1px solid var(--divider)" : "none";
          const p = msPct(r.pct);
          return (
            <React.Fragment key={r.id + "-" + i}>
              <div style={{ position: "sticky", left: 0, zIndex: 2, background: msSolid(r.head && !compact ? "color-mix(in srgb, var(--surface2) 70%, var(--surface))" : "var(--surface)"),
                height: rh, display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: 6, paddingRight: 8, borderTop: line, minWidth: 0 }}>
                {full && <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)", paddingLeft: 4 }}>{r.no}</span>}
                <span style={{ minWidth: 0, paddingLeft: sub && !compact && narrow ? 10 : sub && full ? 12 : 0 }}>
                  <span style={{ display: "block", fontSize: compact ? 11.5 : sub ? 12 : 12.5, fontWeight: r.head ? 800 : 500, color: "var(--text-1)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.th}>{r.th || "—"}</span>
                </span>
                {dates && <span style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{msTH(r.planStart)}</span>}
                {dates && <span style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{msTH(r.planEnd || r.planStart)}</span>}
                {wc && <span style={{ fontSize: 10.5, color: "var(--text-3)", textAlign: "right", fontFamily: "var(--mono)", fontWeight: r.head ? 700 : 400 }}>{r.wp ? Math.round(r.wp * 10) / 10 : ""}</span>}
                {full ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ flex: 1, height: 6, borderRadius: 3, background: MS_TRACK, overflow: "hidden" }}><span style={{ display: "block", width: p + "%", height: "100%", background: st.bar }} /></span>
                    <span style={{ width: 30, textAlign: "right", fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 700, color: "var(--text-1)" }}>{p}%</span>
                  </span>
                ) : (
                  <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: compact ? 10.5 : 11.5, fontWeight: 700, color: r.st === "late" ? st.tx : "var(--text-1)" }}>{p}%</span>
                )}
                {full && <span><MsPill st={r.st} label={msStLabel(r)} small /></span>}
              </div>
              <div style={{ position: "relative", height: rh, borderTop: line, background: r.head && !compact ? "color-mix(in srgb, var(--surface2) 45%, transparent)" : "transparent" }}>
                {!compact && weekend.map((d) => <span key={d} style={{ position: "absolute", left: A.X(d) + "%", width: A.W(d, d) + "%", top: 0, bottom: 0, background: "color-mix(in srgb, var(--text-3) 7%, transparent)" }} />)}
                {!compact && A.weeks.map((w) => <span key={"g" + w.d} style={{ position: "absolute", left: A.X(w.d) + "%", top: 0, bottom: 0, width: 1, background: "var(--divider)" }} />)}
                {/* แถบจริง (บาง ใต้แถบแผน): เริ่มจริง → เสร็จจริง (ยังไม่เสร็จ = ถึงวันนี้) · เลยวันจบแผน = แดง */}
                {!compact && (() => {
                  const as = msDay(r.actStart), ae0 = msDay(r.actEnd), ae = ae0 != null ? ae0 : as != null && A.td != null ? Math.max(as, A.td) : null;
                  if (as == null || ae == null) return null;
                  const lt = pe != null && ae > pe;
                  return <div title={"ทำจริง " + msSpanTH(r.actStart, r.actEnd || "") + (r.actEnd ? "" : " (ยังทำอยู่)")}
                    style={{ position: "absolute", left: A.X(as) + "%", width: A.W(as, ae) + "%", top: rh / 2 + 5, height: 5, borderRadius: 3,
                      background: lt ? "var(--tint-red-tx)" : "var(--tint-ok-tx)", opacity: r.actEnd ? 1 : 0.6 }} />;
                })()}
                {ps != null && (
                  <div title={r.th + " · แผน " + msSpanTH(r.planStart, r.planEnd) + " · " + p + "%"}
                    style={{ position: "absolute", left: A.X(ps) + "%", width: A.W(ps, pe) + "%", top: compact ? rh / 2 - 4 : rh / 2 - (r.head ? 9 : 10), height: compact ? 8 : r.head ? 10 : 12,
                      borderRadius: compact ? 3 : 4, background: MS_TRACK, overflow: "hidden", boxShadow: r.st === "late" && !compact ? "inset 0 0 0 1px var(--tint-red-tx)" : "none" }}>
                    <div style={{ width: p + "%", height: "100%", background: st.bar, opacity: r.head ? 0.85 : 1 }} />
                  </div>
                )}
                {showToday && <span style={{ position: "absolute", left: A.X(A.td + 0.5) + "%", top: 0, bottom: 0, width: 1.5, background: "var(--tint-red-tx)", zIndex: 1 }} />}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ── ตัวแก้แผน — แถวละแผ่นบาง · หัวข้อใหญ่ไม่มีช่องวัน (คิดจากขั้นย่อย) · ขั้นงานติดตั้งดูอย่างเดียว ──
   ใส่ "วัน" แล้ววันจบคิดให้ (เริ่ม + วัน − 1) · ใส่วันจบเอง ช่องวันคิดตาม */
function MsEditor({ rows, setRows, inst, narrow, owners, instSteps, onInstEdit, setInstSteps, today }) {
  const set = (i, k, v) => setRows((L) => L.map((r, j) => {
    if (j !== i) return r;
    const up = { [k]: v };
    if (k === "pct") {
      up.pct = v === "" ? "" : msPct(v);
      /* เติมวันจริงให้เอง (แก้ทับได้) — เหมือนตารางขั้นงานรายวัน · ลดจาก 100 = ยังไม่เสร็จ ล้างวันเสร็จ */
      const n = msPct(v);
      if (n > 0 && !r.actStart && today) up.actStart = today;
      if (n >= 100 && !r.actEnd && today) up.actEnd = today;
      if (n < 100 && r.actEnd) up.actEnd = "";
    }
    if (k === "w") up.w = v === "" ? "" : String(v).replace(/[^0-9.]/g, "").slice(0, 5);
    if (k === "planStart" && v && !r.planEnd) up.planEnd = +r.dur > 0 ? msIso(msDay(v) + Math.round(+r.dur) - 1) : v;   // แม่แบบมีจำนวนวันมาให้
    if (k === "planStart" && v && r.planEnd && r.planStart) { const d = msDur(r.planStart, r.planEnd); up.planEnd = msIso(msDay(v) + d - 1); }   // เลื่อนทั้งก้อน คงจำนวนวัน
    if (k === "planStart" || k === "planEnd") up._dur = undefined;
    /* ช่อง "วัน" เก็บข้อความที่พิมพ์ไว้ใน _dur (ลบให้ว่างแล้วพิมพ์ใหม่ได้) · บันทึกไม่เก็บ _dur */
    if (k === "dur") { delete up.dur; up._dur = v; const n = Math.max(1, Math.round(+v || 0)); if (r.planStart && v !== "") up.planEnd = msIso(msDay(r.planStart) + n - 1); }
    return Object.assign({}, r, up);
  }));
  const move = (i, d) => setRows((L) => { const a = L.slice(), j = i + d; if (j < 0 || j >= a.length) return L; const t = a[i]; a[i] = a[j]; a[j] = t; return a; });
  const del = (i) => setRows((L) => L.filter((_, j) => j !== i));
  const addSub = (i) => setRows((L) => { let j = i + 1; while (j < L.length && !L[j].head) j++; const a = L.slice(); a.splice(j, 0, msRow("", false)); return a; });
  const inp = { padding: "7px 9px", fontSize: 12.5, border: "none", borderRadius: "var(--r-tile)", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
  const dIn = Object.assign({}, inp, { fontFamily: "var(--mono)", fontSize: 12 });
  const cols = narrow ? "1fr 1fr" : "minmax(170px,1.4fr) 128px 128px 54px 128px 128px 58px 58px 88px";
  const wSum = rows.filter((r) => !r.head || (r.link === "install" && !inst.length)).reduce((t, r) => t + (msW(r.w) || 0), 0)
    + inst.filter((r) => !r.head).reduce((t, r) => t + (msW(r.w) || 0), 0);
  const lab = (t) => narrow ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{t}</span> : null;
  const iconBtn = (ic, fn, title, danger, dis) => (
    <button onClick={fn} title={title} aria-label={title} disabled={dis} style={{ width: 26, height: 26, border: "none", borderRadius: 8, background: "transparent", cursor: dis ? "default" : "pointer",
      display: "grid", placeItems: "center", color: danger ? "var(--tint-red-tx)" : "var(--text-3)", opacity: dis ? 0.35 : 1, padding: 0, fontSize: 10 }}>
      {ic === "up" ? "▲" : ic === "down" ? "▼" : <Icon name={ic} size={14} />}
    </button>
  );
  const fieldW = (n) => (narrow ? { gridColumn: "span " + n } : null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <datalist id="ms-owners">{owners.map((o) => <option key={o} value={o} />)}</datalist>
      {!narrow && (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, padding: "0 12px", fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>
          <span>งาน</span><span>เริ่ม (แผน)</span><span>จบ (แผน)</span><span>วัน</span>
          <span title="ใส่ % แล้วเติมให้เอง แก้ได้">เริ่มจริง</span><span title="ใส่ 100% แล้วเติมให้เอง แก้ได้">เสร็จจริง</span>
          <span title="% น้ำหนักต่อทั้งโครงการ (รวม 100)">น้ำหนัก</span><span>%</span><span />
        </div>
      )}
      <div style={{ fontSize: 11.5, color: Math.abs(wSum - 100) < 0.01 || !wSum ? "var(--text-3)" : "var(--tint-amber-tx)", padding: "0 12px" }}>
        น้ำหนักรวม <b style={{ fontFamily: "var(--mono)" }}>{Math.round(wSum * 100) / 100}%</b>{wSum && Math.abs(wSum - 100) >= 0.01 ? " — ควรรวมได้ 100 (S-Curve คิดเทียบผลรวมจริง)" : ""}
        {!wSum ? " — ยังไม่ใส่น้ำหนัก ระบบถ่วงตามจำนวนวัน" : ""}
      </div>
      {rows.map((r, i) => {
        const isInst = r.head && r.link === "install";
        const leaf = !r.head || (isInst && !inst.length);
        return (
          <React.Fragment key={r.id}>
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: "var(--r-tile)",
              background: "var(--surface)", boxShadow: "var(--shadow-sm)", marginTop: r.head && i ? 8 : 0, marginLeft: r.head || narrow ? 0 : 18 }}>
              <input value={r.th} onChange={(e) => set(i, "th", e.target.value)} placeholder={r.head ? "หัวข้อใหญ่" : "ชื่องาน"}
                style={Object.assign({}, inp, { fontWeight: r.head ? 800 : 500 }, fieldW(2))} />
              {leaf ? (
                <React.Fragment>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("เริ่ม")}
                    <input type="date" value={r.planStart || ""} onChange={(e) => set(i, "planStart", e.target.value)} style={dIn} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("จบ")}
                    <input type="date" value={r.planEnd || ""} min={r.planStart || undefined} onChange={(e) => set(i, "planEnd", e.target.value)} style={dIn} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("วัน")}
                    <input type="number" min={1} value={r._dur != null ? r._dur : msDur(r.planStart, r.planEnd) || ""} disabled={!r.planStart}
                      onChange={(e) => set(i, "dur", e.target.value)} onBlur={() => set(i, "_dur", undefined)}
                      style={Object.assign({}, inp, { textAlign: "right", fontFamily: "var(--mono)" })} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("เริ่มจริง")}
                    <input type="date" value={r.actStart || ""} onChange={(e) => set(i, "actStart", e.target.value)} style={dIn} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("เสร็จจริง")}
                    <input type="date" value={r.actEnd || ""} min={r.actStart || undefined} onChange={(e) => set(i, "actEnd", e.target.value)} style={dIn} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("น้ำหนัก %")}
                    <input inputMode="decimal" value={r.w == null ? "" : r.w} onChange={(e) => set(i, "w", e.target.value)} placeholder="—"
                      style={Object.assign({}, inp, { textAlign: "right", fontFamily: "var(--mono)" })} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>{lab("ทำไปแล้ว %")}
                    <input type="number" min={0} max={100} step={5} value={r.pct === "" ? "" : r.pct} onChange={(e) => set(i, "pct", e.target.value)}
                      style={Object.assign({}, inp, { textAlign: "right", fontFamily: "var(--mono)" })} /></label>
                </React.Fragment>
              ) : (
                <span style={Object.assign({ gridColumn: narrow ? "span 2" : "2 / span 7", fontSize: 11.5, color: "var(--text-3)" })}>
                  {isInst ? "ขั้นย่อยใช้ตารางขั้นงานชุดเดียวกับรายงานประจำวัน — แก้ได้ที่ปุ่ม \"แก้ขั้นงานติดตั้ง\" ด้านล่าง" : "ช่วงวันและ % คิดจากงานย่อยใต้หัวข้อนี้"}
                </span>
              )}
              <span style={Object.assign({ display: "flex", gap: 2, justifyContent: "flex-end" }, fieldW(2))}>
                {r.head && !isInst && iconBtn("plus", () => addSub(i), "เพิ่มงานย่อย")}
                {iconBtn("up", () => move(i, -1), "เลื่อนขึ้น", false, i === 0)}
                {iconBtn("down", () => move(i, 1), "เลื่อนลง", false, i === rows.length - 1)}
                {iconBtn("trash", () => del(i), "ลบแถว", true)}
              </span>
            </div>
            {isInst && window.DrStepTable && (instSteps ? (
              <div style={{ marginLeft: narrow ? 0 : 18, padding: narrow ? 8 : 12, borderRadius: "var(--r-tile)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <b style={{ fontSize: 12.5, color: "var(--text-1)" }}>ขั้นงานติดตั้ง</b>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>ชุดเดียวกับตารางขั้นงานในรายงานประจำวัน · บันทึกพร้อมแผนนี้</span>
                </div>
                <window.DrStepTable steps={instSteps} editable plan dates rename today={today}
                  onReset={window.drWhaSteps} onChange={(v) => setInstSteps(v)} />
                {/* น้ำหนัก % ของขั้นย่อย (ต่อทั้งโครงการ) — ตารางขั้นงานรายวันไม่มีช่องนี้สำหรับงานโครงการ */}
                <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>น้ำหนัก % ต่อทั้งโครงการ (ขั้นย่อย)</div>
                <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: "4px 14px", marginTop: 4 }}>
                  {instSteps.map((r, k) => r.head === false && (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-2)" }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.th || "—"}</span>
                      <input inputMode="decimal" value={r.w == null ? "" : r.w} placeholder="—"
                        onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, "").slice(0, 5); setInstSteps(instSteps.map((x, j) => (j === k ? Object.assign({}, x, { w: v }) : x))); }}
                        style={Object.assign({}, inp, { width: 64, textAlign: "right", fontFamily: "var(--mono)", padding: "5px 7px" })} />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <button type="button" onClick={onInstEdit}
                style={{ marginLeft: narrow ? 0 : 18, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: "var(--r-tile)",
                  border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, background: "var(--primary-soft)", color: "var(--primary-dark)", boxShadow: "var(--shadow-sm)" }}>
                <Icon name="pen" size={13} /> แก้ขั้นงานติดตั้ง{inst.length ? "" : " (ยังไม่มี — เริ่มจากชุดมาตรฐาน)"}
              </button>
            ))}
            {isInst && !instSteps && inst.map((x) => (
              <div key={x.id} style={{ display: "grid", gridTemplateColumns: narrow ? "1fr auto" : "minmax(160px,1fr) 1fr 56px 64px", gap: 8, alignItems: "center",
                padding: "6px 12px", marginLeft: narrow ? 0 : x.head ? 18 : 32, borderRadius: "var(--r-tile)", background: "var(--surface2)", fontSize: 12,
                color: "var(--text-2)", fontWeight: x.head ? 800 : 400 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.th}</span>
                {!narrow && <span style={{ color: "var(--text-3)", fontSize: 11.5, fontWeight: 400 }}>{x.head ? "" : msSpanTH(x.planStart, x.planEnd) || "ยังไม่ใส่วันแผน"}</span>}
                {!narrow && <span style={{ textAlign: "right", fontFamily: "var(--mono)", color: "var(--text-3)" }}>{!x.head && msW(x.w) != null ? msW(x.w) + "%" : ""}</span>}
                <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700 }}>{x.head ? "" : x.pct + "%"}</span>
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── เอกสารพิมพ์ A3 แนวนอน — แบบไฟล์ตัวอย่าง: หัวสรุป + ตาราง + แกนต์รายวัน (HTML ล้วน ไม่พึ่ง CSS ของแอป) ── */
function msPrintHTML(job, C, today, cv) {
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const A = msAxis(C, today, 0);
  const X = (d) => A.X(d).toFixed(3), W = (a, b) => A.W(a, b).toFixed(3);
  const daily = A.span <= 84;   // ≤ 12 สัปดาห์ = หัวรายวัน · ยาวกว่านั้นเหลือหัวสัปดาห์
  let grid = A.weeks.map((w) => '<i class="wk" style="left:' + X(w.d) + '%"></i>').join("");
  if (daily) for (let d = A.lo; d <= A.hi; d++) if (new Date(d * 86400000).getUTCDay() === 0) grid += '<i class="we" style="left:' + X(d) + "%;width:" + W(d, d) + '%"></i>';
  if (A.td != null && A.td >= A.lo && A.td <= A.hi) grid += '<i class="td" style="left:' + X(A.td + 0.5) + '%"></i>';
  const stCls = { done: "done", doing: "doing", late: "late", todo: "todo", donelate: "late" };
  const body = C.rows.map((r) => {
    const ps = msDay(r.planStart), pe = msDay(r.planEnd || r.planStart), p = msPct(r.pct);
    let bar = ps != null ? '<b class="bar ' + (r.head ? "h " : "") + stCls[r.st] + '" style="left:' + X(ps) + "%;width:" + W(ps, pe) + '%"><s style="width:' + p + '%"></s></b>' : "";
    const as = msDay(r.actStart), ae0 = msDay(r.actEnd), ae = ae0 != null ? ae0 : as != null && A.td != null ? Math.max(as, A.td) : null;
    if (as != null && ae != null) bar += '<b class="ab' + (pe != null && ae > pe ? " lt" : "") + (ae0 == null ? " op" : "") + '" style="left:' + X(as) + "%;width:" + W(as, ae) + '%"></b>';
    const actTx = as == null ? "" : msTH(r.actStart) + " – " + (ae0 != null ? msTH(r.actEnd) : "…");
    return '<tr class="' + (r.head ? "h" : "s") + '"><td class="n">' + esc(r.no) + '</td><td class="t">' + esc(r.th) + '</td><td class="d">' + esc(msTH(r.planStart, true)) + '</td><td class="d">' + esc(msTH(r.planEnd || r.planStart, true)) +
      '</td><td class="u">' + (msDur(r.planStart, r.planEnd) || "") + '</td><td class="w">' + (r.wp ? (Math.round(r.wp * 10) / 10) : "") + '</td><td class="p"><span class="pb"><span class="' + stCls[r.st] + '" style="width:' + p + '%"></span></span>' + p +
      '%</td><td class="ac">' + esc(actTx) + '</td><td class="st"><span class="pill ' + (r.st === "done" ? "done" : stCls[r.st]) + '">' + esc(msStLabel(r)) + '</span></td><td class="g"><div class="gc">' + grid + bar + "</div></td></tr>";
  }).join("");
  const wpx = 800 / Math.max(1, A.weeks.length), wide = wpx >= 17;   // ช่องสัปดาห์แคบ → ใส่แค่เลข 1 2 3 4 (A3 แนวนอน กราฟกว้างราว 800px) · กว้างพอ → W1 W2
  let hd = '<div class="gc mh">' + A.mg.map((g, i) => '<span style="left:' + X(g.d) + "%;width:" + W(g.d, g.d + 7 * g.n - 1) + '%"' + (i ? ' class="b"' : "") + ">" + g.th + "</span>").join("") + "</div>" +
    '<div class="gc wh">' + A.weeks.map((w) => '<span style="left:' + X(w.d) + "%;width:" + W(w.d, w.d + 6) + '%">' + (wide ? "W" : "") + w.k + "</span>").join("") + "</div>";
  if (daily) {
    let dd = "";
    for (let d = A.lo; d <= A.hi; d++) {
      const x = new Date(d * 86400000);
      dd += '<span class="' + (x.getUTCDay() === 0 ? "su" : "") + (d === A.td ? " tdh" : "") + '" style="left:' + X(d) + "%;width:" + W(d, d) + '%"><em>' + MS_DOW[x.getUTCDay()] + "</em>" + x.getUTCDate() + "</span>";
    }
    hd += '<div class="gc dh">' + dd + "</div>";
  }
  const head = '<tr><th class="n">ID</th><th class="t">รายการงาน</th><th class="d">เริ่ม</th><th class="d">จบ</th><th class="u">วัน</th><th class="w">%W</th>' +
    '<th class="p">ความคืบหน้า</th><th class="ac">ทำจริง</th><th class="st">สถานะ</th><th class="g">' + hd + "</th></tr>";
  const title = window.rpFileName ? window.rpFileName(job, "MS") : "Master Schedule " + (job.code || "");
  const td = msDay(today), days = C.lo != null ? C.hi - C.lo + 1 : null, left = C.hi != null && td != null ? C.hi - td : null;
  const leftTx = left == null ? "—" : C.pct >= 100 ? "เสร็จแล้ว" : left > 0 ? "เหลือ " + left + " วัน" : left === 0 ? "ครบกำหนดวันนี้" : "เลยกำหนด " + -left + " วัน";
  const R = 34, Cc = 2 * Math.PI * R;
  const ring = '<svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="' + R + '" fill="none" stroke="#D5EEE5" stroke-width="10"/>' + (C.pct > 0 ?
    '<circle cx="46" cy="46" r="' + R + '" fill="none" stroke="#1B9B75" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + ((Cc * C.pct) / 100).toFixed(2) + " " + Cc.toFixed(2) +
    '" transform="rotate(-90 46 46)"/>' : "") + '<text x="46" y="46" dominant-baseline="central" text-anchor="middle" font-size="20" font-weight="800" fill="#15211A" font-family="monospace">' + C.pct + "%</text></svg>";
  const kpi = (lab, v, cls) => '<div class="k ' + (cls || "") + '"><span>' + lab + "</span><b>" + v + "</b></div>";
  const info = [["โครงการ", [job.code, job.name].filter(Boolean).join(" · ")], ["ขนาดระบบ", job.kw ? job.kw + " kWp" : ""], ["สถานที่", [job.address, job.province].filter(Boolean).join(" ")],
    ["ผู้ดูแลโครงการ", job.eeName || ""], ["ลูกค้า", job.customer || job.customerName || ""]].filter((x) => x[1]);
  const css = "@page{size:A3 landscape;margin:9mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}" +
    "body{margin:0;font-family:'IBM Plex Sans Thai',sans-serif;color:#15211A;font-size:10.5px;background:#fff;min-width:1500px}" +
    ".hd{display:flex;gap:14px;align-items:stretch;margin-bottom:10px}.ttl{flex:1.2;min-width:0;border-left:5px solid #1B9B75;padding:2px 0 2px 12px}" +
    ".ttl h1{margin:0;font-size:24px;letter-spacing:.03em}.ttl .sub{color:#4A5A51;font-size:12px;margin-top:2px}.ttl table{margin-top:6px;border-collapse:collapse}" +
    ".ttl td{padding:1px 10px 1px 0;font-size:11px;white-space:nowrap;border:0;height:auto}.ttl td:first-child{color:#7A8A81}" +
    ".ks{display:flex;gap:8px;align-items:stretch}.k{min-width:86px;border-radius:8px;background:#F3F6F4;padding:8px 12px;display:flex;flex-direction:column;justify-content:center}" +
    ".k span{font-size:10px;font-weight:700;color:#5A6B62}.k b{font-size:24px;font-family:monospace;margin-top:2px}.k.ok{background:#E3F4EC}.k.ok b,.k.ok span{color:#15803D}" +
    ".k.am{background:#FDF1DC}.k.am b,.k.am span{color:#935F07}.k.rd{background:#FDE6E6}.k.rd b,.k.rd span{color:#B91C1C}" +
    ".rg{display:flex;align-items:center;gap:10px;border-radius:8px;background:#F3F6F4;padding:4px 14px 4px 6px}.rg .ri{font-size:11px;line-height:1.75;color:#4A5A51}.rg .ri b{color:#15211A}" +
    "table.t1{width:100%;border-collapse:collapse;table-layout:fixed}" +
    "table.t1 th{font-size:10px;color:#fff;background:#1B5E4A;font-weight:700;text-align:left;padding:0 5px;height:22px;vertical-align:middle}" +
    "table.t1 th.g{padding:0;background:#24745C;vertical-align:top}" +
    "table.t1 td{padding:0 5px;height:20px;border-bottom:1px solid #E6ECE8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:middle}" +
    "tr.h td{font-weight:800;background:#EEF4F0;height:22px}tr.s td.t{padding-left:14px}" +
    ".n{width:36px}td.n{font-family:monospace;color:#7A8A81}.t{width:220px}.o{width:110px}td.o{color:#4A5A51}.d{width:66px}.u{width:30px;text-align:right}.w{width:40px;text-align:right}.p{width:84px}.ac{width:96px}td.ac{color:#4A5A51;font-size:9.5px}.st{width:92px}" +
    "td.p{font-family:monospace;font-size:9.5px}.pb{display:inline-block;width:42px;height:6px;border-radius:3px;background:#D5EEE5;margin-right:5px;vertical-align:middle;overflow:hidden}" +
    ".pb span{display:block;height:100%;background:#1B9B75}.pb span.done{background:#15803D}.pb span.late{background:#DC2626}" +
    ".pill{display:inline-block;padding:1px 7px;border-radius:9px;font-size:9px;font-weight:700;background:#ECEFED;color:#4A5A51}" +
    ".pill.done{background:#DDF3E8;color:#15803D}.pill.doing{background:#FCE9C6;color:#935F07}.pill.late{background:#FDE0E0;color:#B91C1C}" +
    "td.g{padding:0}.gc{position:relative;height:20px}tr.h .gc{height:22px}" +
    ".mh{height:17px}.mh span{position:absolute;top:2px;padding-left:3px;overflow:hidden;font-size:10px;font-weight:800;color:#fff;white-space:nowrap}.mh span.b{border-left:1px solid rgba(255,255,255,.5)}" +
    ".wh{height:16px;background:#2F8A6D}.wh span{position:absolute;top:0;height:16px;line-height:16px;text-align:center;font-size:8.5px;font-weight:700;color:#fff;border-left:1px solid rgba(255,255,255,.35);white-space:nowrap;overflow:hidden}" +
    ".dh{height:24px;background:#fff}.dh span{position:absolute;top:2px;text-align:center;font-size:9px;line-height:1.05;color:#15211A;font-weight:600}.dh span em{display:block;font-style:normal;font-size:7.5px;color:#7A8A81}" +
    ".dh span.su{color:#9AA8A0}.dh span.tdh{color:#DC2626;font-weight:800}" +
    "i.wk{position:absolute;top:0;bottom:0;width:1px;background:#DCE5E0}i.we{position:absolute;top:0;bottom:0;background:#F4F6F5}i.td{position:absolute;top:0;bottom:0;width:1.5px;background:#DC2626;z-index:2}" +
    "b.bar{position:absolute;top:2px;height:10px;border-radius:3px;background:#C9E9DD;overflow:hidden;z-index:1}tr.h b.bar{top:3px;height:9px}b.ab{position:absolute;top:14px;height:4px;border-radius:2px;background:#15803D;z-index:1}tr.h b.ab{top:15px}b.ab.lt{background:#DC2626}b.ab.op{opacity:.55}" +
    "b.bar s{display:block;height:100%;background:#1B9B75}b.bar.done s{background:#15803D}b.bar.late{box-shadow:inset 0 0 0 1px #DC2626}b.bar.late s{background:#DC2626}" +
    ".lg{display:flex;gap:16px;margin-top:8px;font-size:10px;color:#4A5A51;align-items:center}.lg i{display:inline-block;width:18px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle}" +
    ".sc{break-before:page;page-break-before:always;padding-top:4px}.sch{display:flex;align-items:baseline;gap:14px;margin-bottom:6px}.sch b{font-size:18px}.sch span{font-size:11px;color:#5A6B62}" +
    ".sch .scv{margin-left:auto;font-size:12px;color:#15211A}.sch .scv+.scv{margin-left:0}.sch .scv b{font-size:14px;font-family:monospace}" +
    /* จอ: เลื่อนแนวนอนแล้วคอลัมน์ ID…สถานะ ล็อกอยู่ (ซ้าย = ผลรวมความกว้างคอลัมน์ก่อนหน้า ตาม .n .t .d … ด้านบน) · หัวตารางล็อกบน · ตอนพิมพ์ไม่ใช้ */
    "@media screen{table.t1 tr>:nth-child(-n+9){position:sticky;z-index:3;background:#fff}table.t1 tr.h>td:nth-child(-n+9){background:#EEF4F0}table.t1 thead th{position:sticky;top:0;z-index:5}table.t1 thead th:nth-child(-n+9){z-index:6;background:#1B5E4A}table.t1 tr>:nth-child(1){left:0px}table.t1 tr>:nth-child(2){left:36px}table.t1 tr>:nth-child(3){left:256px}table.t1 tr>:nth-child(4){left:322px}table.t1 tr>:nth-child(5){left:388px}table.t1 tr>:nth-child(6){left:418px}table.t1 tr>:nth-child(7){left:458px}table.t1 tr>:nth-child(8){left:542px}table.t1 tr>:nth-child(9){left:638px}table.t1 tr>:nth-child(9){box-shadow:3px 0 4px -2px rgba(0,0,0,.18)}}";
  return '<!doctype html><html lang="th"><head><meta charset="utf-8"><title>' + esc(title) + "</title>" +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700;800&display=swap" rel="stylesheet"><style>' + css + "</style></head><body>" +
    '<div class="hd"><div class="ttl"><h1>MASTER SCHEDULE</h1><div class="sub">แผนงานหลักโครงการ · ณ วันที่ ' + esc(msTH(today, true)) + "</div><table>" +
    info.map((x) => "<tr><td>" + esc(x[0]) + "</td><td><b>" + esc(x[1]) + "</b></td></tr>").join("") + "</table></div>" +
    '<div class="rg">' + ring + '<div class="ri">เริ่ม <b>' + esc(C.lo != null ? msTH(msIso(C.lo), true) : "—") + "</b><br>จบ <b>" + esc(C.hi != null ? msTH(msIso(C.hi), true) : "—") +
    "</b><br>รวม <b>" + (days || "—") + " วัน</b><br><b" + (left != null && left < 0 && C.pct < 100 ? ' style="color:#B91C1C"' : "") + ">" + esc(leftTx) + "</b></div></div>" +
    '<div class="ks">' + kpi("งานทั้งหมด", C.leaves) + kpi("เสร็จแล้ว", C.cnt.done, "ok") + kpi("กำลังทำ", C.cnt.doing, "am") + kpi("ยังไม่เริ่ม", C.cnt.todo) +
    (C.cnt.late ? kpi("ล่าช้า", C.cnt.late, "rd") : "") + "</div></div>" +
    '<table class="t1"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>" +
    '<div class="lg"><span><i style="background:#C9E9DD"></i>ช่วงแผน</span><span><i style="background:#1B9B75"></i>ทำไปแล้ว (ระบายตาม %)</span>' +
    '<span><i style="background:#15803D"></i>เสร็จ</span><span><i style="background:#DC2626"></i>ล่าช้า</span><span><i style="background:#15803D;height:4px"></i>ทำจริง (แดง = เลยกำหนด)</span><span><i style="background:#DC2626;width:2px"></i>วันนี้</span>' +
    '<span style="margin-left:auto">ออกเอกสาร ' + esc(msTH(msToday(), true)) + "</span></div>" +
    (cv ? '<div class="sc"><div class="sch"><b>EPC S-Curve</b><span>% สะสมรายสัปดาห์ · แผนจากน้ำหนักงาน × ช่วงวันแผน · จริงจากภาพรวมที่จดไว้รายวัน</span>' +
      '<span class="scv">แผน ณ วันนี้ <b>' + (Math.round(cv.planNow * 10) / 10) + '%</b></span><span class="scv">ทำได้จริง <b>' + C.pct + "%</b></span></div>" +
      msCurveSVG(cv, 1500, 420, MS_CV_LIGHT) +
      '<div class="lg"><span><i style="background:#1B9B75;height:3px"></i>แผนสะสม</span><span><i style="background:#2563EB;height:3px"></i>ทำได้จริงสะสม</span>' +
      '<span><i style="background:#CFEDE2"></i>แผนรายสัปดาห์</span><span><i style="background:#fff;border:1.5px solid #2563EB;width:8px;border-radius:4px"></i>ประมาณจากรายงานประจำวัน</span></div></div>' : "") +
    "</body></html>";
}

/* ── หน้าต่าง Master Schedule ── */
function MsModal({ job, canEdit, currentUser, onClose }) {
  const { ms, inst: inst0, daily, crew } = useMsData(job);
  const today = msToday();
  /* แก้ขั้นงานติดตั้งได้จากที่นี่ (ผู้ใช้ 17 พ.ย. 2026 "ถ้าไม่ต้องไปอยู่ที่ดำเนินการ จะแก้ไขได้ไหม เพราะบางทีเราทำแผนก่อนเข้าติดตั้งจริง")
     เดิมต้องแก้ที่ตารางขั้นงานในรายงานประจำวัน ซึ่งงานยังไม่ถึงขั้นติดตั้งเข้าไม่ถึง · บันทึกลง dailyPlan/{jobId} ที่เดียวกัน (รายงานวันแรกเริ่มจากชุดนี้)
     instEdit = ขั้นงานที่กำลังแก้ · null = ไม่ได้แตะ */
  const [instEdit, setInstEdit] = React.useState(null);
  const inst = React.useMemo(() => (instEdit ? msInstallRowsOf(instEdit, crew) : inst0), [instEdit, inst0, crew]);
  const instBase = () => {
    const st = msInstallSteps(daily);
    return (st && st.length ? st : window.drWhaSteps ? window.drWhaSteps() : []).map((r) => Object.assign({}, r));
  };
  const narrow = useMsNarrow(860), mid = useMsNarrow(1180);
  const [edit, setEdit] = React.useState(null);           // แถวที่กำลังแก้ (ยังไม่บันทึก) · null = ดูกราฟ
  const [busy, setBusy] = React.useState(false);
  const [print, setPrint] = React.useState(null);
  const base = React.useMemo(() => ms.rows || msTemplate(), [ms.rows]);
  const C = React.useMemo(() => msCompute(edit || base, inst, job, today), [edit, base, inst, job, today]);
  const hist = useMsHist(job && job.id);
  const est = React.useMemo(() => msEstHist(edit || base, daily, job, crew), [edit, base, daily && daily.byDate, job, crew]);
  const cv = React.useMemo(() => msCurve(C, today, hist, est), [C, today, hist, est]);
  const bd = window.useBackdropClose ? window.useBackdropClose(() => { if (!edit) onClose(); }) : {};
  const dirty = (edit && JSON.stringify(edit) !== JSON.stringify(base)) || !!instEdit;
  const owners = React.useMemo(() => {
    const tech = job.tech && window.SF && window.SF.TECH_BY_ID && window.SF.TECH_BY_ID[job.tech];
    const fromRows = (edit || base).map((r) => r.owner);
    return [...new Set([job.eeName, job.salesName, tech && tech.name, job.contractor, "ทีมติดตั้ง", "ฝ่ายขาย", "ฝ่ายออกแบบ", "ฝ่ายจัดซื้อ", "ลูกค้า", "การไฟฟ้า"].concat(fromRows)
      .filter((x) => x && String(x).trim()))];
  }, [job, edit, base]);

  const doSave = () => {
    setBusy(true);
    if (instEdit && daily && daily.savePlan) daily.savePlan((daily.plan && daily.plan.mode) || "project", instEdit);
    Promise.resolve(ms.save(edit, currentUser)).then(() => { setBusy(false); setEdit(null); setInstEdit(null); },
      (e) => { setBusy(false); window.askConfirm({ title: "บันทึกไม่สำเร็จ", body: String((e && e.message) || e), ok: "ตกลง" }); });
  };
  const cancel = () => {
    if (!dirty) { setEdit(null); setInstEdit(null); return; }
    window.askConfirm({ title: "ทิ้งที่แก้ไว้?", body: "แผนงานที่แก้ยังไม่ได้บันทึก", ok: "ทิ้ง", danger: true }).then((ok) => { if (ok) { setEdit(null); setInstEdit(null); } });
  };
  const reset = () => window.askConfirm({ title: "เริ่มจากแม่แบบใหม่?", body: "หัวข้อ วันที่ และผู้รับผิดชอบที่แก้ไว้จะถูกแทนด้วยแม่แบบมาตรฐาน (ยังไม่บันทึกจนกว่าจะกดบันทึก)", ok: "ใช้แม่แบบ", danger: true })
    .then((ok) => { if (ok) setEdit(msTemplate()); });

  const btn = (solid, soft) => ({ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 15px", borderRadius: "var(--r-tile)", border: "none", cursor: "pointer",
    fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: solid ? "var(--primary)" : soft ? "var(--primary-soft)" : "var(--surface2)",
    color: solid ? "#fff" : soft ? "var(--primary-dark)" : "var(--text-1)", boxShadow: solid ? "var(--shadow-btn)" : "var(--shadow-sm)" });
  return (
    <div {...bd} style={{ position: "fixed", inset: 0, background: "rgba(8,20,14,.45)", backdropFilter: "blur(3px)", zIndex: 115,
      display: "grid", placeItems: narrow ? "end center" : "center", padding: narrow ? 0 : 20 }}>
      <div style={{ width: narrow ? "100%" : "min(1400px, 100%)", height: narrow ? "94%" : "min(900px, 100%)", background: "var(--bg)", borderRadius: narrow ? "var(--r-card) var(--r-card) 0 0" : "var(--r-card)",
        boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* หัว */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: narrow ? "14px 15px" : "16px 20px", background: "var(--surface)", boxShadow: "0 6px 18px -12px rgba(8,20,14,.25)", zIndex: 3 }}>
          <span style={{ width: 36, height: 36, borderRadius: "var(--r-tile)", background: "var(--primary-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="calendar" size={18} color="var(--primary)" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)" }}>Master Schedule{edit ? " · แก้แผนงาน" : ""}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {[job.code, job.name].filter(Boolean).join(" · ")}{ms.data && ms.data.updatedAt ? " · แก้ล่าสุด " + msTH(ms.data.updatedAt.slice(0, 10), true) + (ms.data.byName ? " โดย " + ms.data.byName : "") : ""}
            </div>
          </div>
          <button className="x-close" onClick={() => (edit ? cancel() : onClose())} title="ปิด" aria-label="ปิด"
            style={{ width: 34, height: 34, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="x" size={16} /></button>
        </div>
        {/* เนื้อ */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: narrow ? 12 : 18 }}>
          {ms.loading ? <div style={{ padding: 20, color: "var(--text-3)", fontSize: 13 }}>กำลังโหลด…</div> : (
            <React.Fragment>
              <MsSummary C={C} today={today} narrow={narrow} />
              {edit ? (
                <MsEditor rows={edit} setRows={setEdit} inst={inst} narrow={narrow} owners={owners}
                  instSteps={instEdit} onInstEdit={() => setInstEdit(instBase())} setInstSteps={setInstEdit} today={today} />
              ) : (
                <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: narrow ? "10px 10px" : "12px 14px" }}>
                  {!ms.rows && <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>ยังไม่ได้ทำแผน — นี่คือแม่แบบมาตรฐาน กด "แก้แผนงาน" เพื่อใส่ผู้รับผิดชอบ วันเริ่ม/จบ แล้วบันทึก</div>}
                  <MsGantt C={C} today={today} narrow={narrow} mid={mid} wcol={C.weighted} />
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "var(--text-3)", marginTop: 10 }}>
                    {[["ช่วงแผน", MS_TRACK], ["ทำไปแล้ว (ระบายตาม %)", "var(--primary)"], ["เสร็จ", "var(--tint-ok-tx)"], ["ล่าช้า", "var(--tint-red-tx)"], ["ทำจริง (แถบบางใต้แผน · แดง = เลยกำหนด)", "var(--tint-ok-tx)"]].map(([t, c]) => (
                      <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 8, borderRadius: 2, background: c }} />{t}</span>
                    ))}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 2, height: 11, background: "var(--tint-red-tx)" }} />วันนี้</span>
                  </div>
                </div>
              )}
              {!edit && <MsSCurve cv={cv} C={C} narrow={narrow} />}
            </React.Fragment>
          )}
        </div>
        {/* ท้าย */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: narrow ? "11px 12px calc(11px + env(safe-area-inset-bottom))" : "12px 20px",
          background: "var(--surface)", boxShadow: "0 -6px 18px -12px rgba(8,20,14,.25)" }}>
          {edit ? (
            <React.Fragment>
              <button style={btn()} onClick={() => setEdit((L) => L.concat([msRow("", true)]))}><Icon name="plus" size={14} /> หัวข้อใหญ่</button>
              <button style={Object.assign(btn(), { color: "var(--tint-red-tx)" })} onClick={reset}>คืนแม่แบบ</button>
              <span style={{ flex: 1 }} />
              <button style={btn()} onClick={cancel}>ยกเลิก</button>
              <button style={btn(true)} onClick={doSave} disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button style={btn()} onClick={() => setPrint(msPrintHTML(job, C, today, cv))}><Icon name="file" size={14} /> ดู / ออก PDF</button>
              <button style={btn()} onClick={() => msExportXlsx(job, C, cv, today)} title="Master Schedule + ชีต S-Curve พร้อมกราฟ"><Icon name="download" size={14} /> Excel</button>
              <span style={{ flex: 1 }} />
              {canEdit && <button style={btn(false, true)} onClick={() => setEdit(base.map((r) => Object.assign({}, r)))} disabled={ms.loading}><Icon name="pen" size={14} /> แก้แผนงาน</button>}
            </React.Fragment>
          )}
        </div>
      </div>
      {print && window.SuReportView && <window.SuReportView html={print} title="Master Schedule" onClose={() => setPrint(null)} />}
    </div>
  );
}

/* ── การ์ดในใบงาน (แท็บภาพรวม · เฉพาะงานโครงการ) — แกนต์ย่อหัวข้อใหญ่ + % รวม กดเปิดเต็ม ── */
function MsCard({ job, canEdit, currentUser }) {
  const { ms, inst } = useMsData(job);
  const [open, setOpen] = React.useState(false);
  const today = msToday();
  const narrow = useMsNarrow(560);
  const hist = useMsHist(job && job.id);
  const C = msCompute(ms.rows || msTemplate(), inst, job, today);
  /* จด % รวมของวันนี้ (เส้นจริงของ S-Curve) — เฉพาะงานที่ทำแผนแล้ว · เปลี่ยนเมื่อไม่ตรงกับที่จดไว้ (กันเขียนซ้ำทุกครั้งที่เรนเดอร์) */
  React.useEffect(() => {
    if (!job || !job.id || !ms.rows || hist === undefined || hist === null || !window.FBDB) return;
    if (hist[today] === C.pct) return;
    window.FBDB.ref("masterScheduleHist/" + job.id + "/" + today).set(C.pct);
  }, [job && job.id, !!ms.rows, hist, today, C.pct]);
  if (!job) return null;
  const sub = !ms.rows ? "ยังไม่ได้ทำแผน — กดเพื่อเริ่มจากแม่แบบ"
    : [C.lo != null ? msSpanTH(msIso(C.lo), msIso(C.hi)) : "ยังไม่ใส่วันแผน", C.cnt.done + "/" + C.leaves + " งานเสร็จ", C.late ? "ล่าช้า " + C.late : ""].filter(Boolean).join(" · ");
  return (
    <React.Fragment>
      <div role="button" tabIndex={0} onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.key === "Enter") setOpen(true); }}
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-tile)", padding: narrow ? "11px 13px" : "13px 16px",
          marginBottom: narrow ? 14 : 16, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 18, height: 20, flexShrink: 0, display: "grid", placeItems: "center" }}><Icon name="calendar" size={15} color="var(--primary)" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>Master Schedule</span>
            <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: C.late ? "var(--tint-red-tx)" : "var(--text-1)", marginTop: 2 }}>{sub}</span>
          </span>
          {ms.rows && <MsRing pct={C.pct} size={44} />}
          <Icon name="arrowRight" size={16} color="var(--text-3)" />
        </div>
      </div>
      {/* portal ไป body — ลิ้นชักใบงานมี transform ทำให้ position:fixed ข้างในติดกรอบลิ้นชัก */}
      {open && ReactDOM.createPortal(<MsModal job={job} canEdit={canEdit} currentUser={currentUser} onClose={() => setOpen(false)} />, document.body)}
    </React.Fragment>
  );
}

Object.assign(window, { MsCard, MsModal, useMasterSchedule, msStLabel, msCompute, msInstallRows, msTemplate, msPrintHTML, msCurve, msCurveSVG, msExportXlsx });
