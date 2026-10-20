/* ============================================================
   flash+solar — หน้าเดสก์ท็อปของ "เวลาทำงาน" (ลงเวลา + OT)

   สี่แท็บ: วันนี้ · คำขอ OT · ลา · สรุปเดือน · ออกเอกสาร · ตั้งค่า (ดู docs/attend-leave.md)
   ตรรกะทั้งหมดอยู่ที่ attend.jsx ไฟล์นี้เป็นหน้าจอล้วน

   ── สิ่งที่หน้านี้ต้องพูดให้ชัด ไม่ใช่ซ่อน ──
   1. งานที่ช่างระบุบนใบลงเวลาเป็น "คำบอก" ไม่ใช่สิ่งที่ระบบตรวจสอบ
   2. ใบที่ไม่มีพิกัดต้องเห็นเป็นธง ไม่ใช่ช่องว่างที่ดูเหมือนไม่มีอะไรผิด
   คนอ่านแผ่นเวลาต้องรู้ว่าตัวเลขตรงหน้าเชื่อได้แค่ไหน ไม่งั้นจะเอาไปตัดสินคนผิด ๆ

   คำนำหน้า tm / Tm / TM
   ============================================================ */

const TM_IN = { padding: "9px 11px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--text-1)", fontFamily: "inherit", fontSize: 13, outline: "none" };
/* สำหรับช่องที่อยู่ในตารางหลายคอลัมน์ — ต้องกว้างเต็มรางของตัวเอง ไม่ใช่กว้างตามความกว้างในตัวของ input
   (TM_IN เปล่า ๆ ยังใช้กับปุ่มและช่องในแถว flex ที่ควรกว้างตามเนื้อ จึงแยกเป็นคนละตัว) */
const TM_IN_W = Object.assign({}, TM_IN, { width: "100%" });
const TM_LB = { display: "grid", gap: 4, minWidth: 0 };
/* หัวคอลัมน์ปฏิทิน เรียงตาม getDay() ของ JS คือเริ่มวันอาทิตย์ */
const TM_WD_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
/* วันในสัปดาห์ของวันที่รูปแบบ YYYY-MM-DD — ประกอบเป็นเวลาท้องถิ่นเที่ยงวัน
   ไม่ใช่ new Date("2026-09-01") ที่ JS อ่านเป็น UTC แล้วเพี้ยนไปหนึ่งวันในโซนเรา */
function tmWdOf(d) {
  const s = String(d || "");
  return new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12).getDay();
}

function TmPill({ s, size }) {
  const st = window.tmOtStatusOf(s);
  return <span style={{ padding: size === "sm" ? "2px 8px" : "3px 10px", borderRadius: "var(--r-pill)", background: st.color + "1A",
    color: st.color, fontSize: size === "sm" ? 10.5 : 11.5, fontWeight: 800, whiteSpace: "nowrap" }}>{st.th}</span>;
}

function TmStat({ label, value, unit, color, hint, on, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      style={{ flex: "1 1 180px", minWidth: 165, textAlign: "left", padding: "12px 14px", borderRadius: "var(--r-tile)",
        border: "none", boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)", background: on ? "var(--primary-soft)" : "var(--surface)",
        cursor: onClick ? "pointer" : "default", fontFamily: "inherit" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{label}</div>
      <div style={{ marginTop: 3, display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color: color || "var(--text-1)" }}>{value}</span>
        {unit && <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 700 }}>{unit}</span>}
      </div>
      {hint && <div style={{ marginTop: 3, fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>{hint}</div>}
    </button>
  );
}

/* ออกไฟล์ Excel — ตารางคน × วัน แบบใบลงเวลากระดาษ ที่ฝ่ายบัญชีอ่านออกโดยไม่ต้องอธิบาย
   + แท็บรายละเอียดแยกรายคน คนละแท็บ (ดู tmPersonSheet ข้างล่าง)

   เป็น async เพราะต้องลงไปอ่าน attend/{uid}/{date} ฉบับเต็มก่อน —
   ดัชนี attendDay ที่หน้าจอใช้เก็บแค่ธง "มีพิกัดไหม" ไม่ได้เก็บตัวเลขพิกัดจริง */
async function tmExportMonthXlsx(rows, days, ym, otRows, users, cfg) {
  if (!window.XLSX) { alert("ไม่พบไลบรารี Excel (ลองโหลดหน้าใหม่)"); return; }
  if (!rows || !rows.length) { alert("เดือนนี้ยังไม่มีข้อมูลให้ออกไฟล์"); return; }
  const X = window.XLSX;
  const FONT = "Tahoma";
  const C = { brand: "1D854B", brandDk: "12603A", brandSoft: "EAF6EF", white: "FFFFFF",
    border: "CBD8D0", text: "16241D", sub: "5A6B62", alt: "F4FAF6", warn: "FDECEA", warnTx: "B42318" };
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const H = (m) => (!m ? "" : Math.round((m / 60) * 100) / 100);

  const cols = ["ชื่อ"].concat(days.map((d) => +d.slice(8)))
    .concat(["วันที่ลงเวลา", "ชั่วโมงรวม", "OT อนุมัติแล้ว", "ลืมกดออก", "ไม่มีพิกัด"]);
  const lastC = cols.length - 1;
  const aoa = [], merges = [], meta = [], rowsH = []; let R = 0;
  const push = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const full = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

  push(["สรุปเวลาทำงานรายเดือน · " + window.tmYmTH(ym)], "title", 30); full(R - 1);
  push(["flash+solar · ตัวเลขจากใบลงเวลาที่พนักงานปั๊มเอง ยังไม่ใช่ยอดจ่าย"], "subtitle", 20); full(R - 1);
  push([], "spacer", 6);
  push(cols, "head", 26);

  let alt = false;
  rows.forEach((r) => {
    const line = [r.name].concat(days.map((d) => (r.byDay[d] ? H(r.byDay[d].mins) : "")))
      .concat([r.days || "", H(r.mins), H(r.otMins), r.noOut || "", r.noGps || ""]);
    push(line, alt ? "itemAlt" : "item", 19);
    alt = !alt;
  });

  const sum = (k) => rows.reduce((a, r) => a + (+r[k] || 0), 0);
  push(["รวมทั้งสิ้น"].concat(days.map(() => ""))
    .concat([sum("days"), H(sum("mins")), H(sum("otMins")), sum("noOut") || "", sum("noGps") || ""]), "total", 24);
  merges.push({ s: { r: R - 1, c: 1 }, e: { r: R - 1, c: days.length } });
  push([], "spacer", 8);
  push(["ช่องว่าง = ไม่มีใบลงเวลาในวันนั้น · ใบที่ลืมกดออกงานชั่วโมงเป็นศูนย์ ระบบไม่เดาเวลาเลิกงานให้"], "foot", 18);
  full(R - 1);

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 22 }].concat(days.map(() => ({ wch: 5.2 })))
    .concat([{ wch: 12 }, { wch: 11 }, { wch: 13 }, { wch: 10 }, { wch: 10 }]);
  ws["!rows"] = rowsH;
  /* ตรึงชื่อคนกับหัวตารางไว้ ตารางกว้างสามสิบกว่าคอลัมน์ เลื่อนไปกลางเดือนแล้วจะไม่รู้ว่าแถวไหนของใคร */
  ws["!freeze"] = { xSplit: 1, ySplit: 4 };
  ws["!autofilter"] = null;

  const styleCell = (r, c) => {
    const t = meta[r]; if (t === "spacer") return null;
    const s = { font: { name: FONT, sz: 10.5, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (t === "title") { s.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "subtitle") { s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "head") { s.font = { name: FONT, sz: 10, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s.alignment = { horizontal: c === 0 ? "left" : "center", vertical: "center", wrapText: true }; s.border = boxAll; }
    else if (t === "total") { s.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s.fill = { patternType: "solid", fgColor: { rgb: C.brandDk } }; s.alignment = { horizontal: c === 0 ? "left" : "center", vertical: "center" }; s.border = boxAll; if (c > days.length + 1) s.numFmt = "#,##0.00"; }   /* ข้ามช่องจำนวนวัน — วันต้องเป็นจำนวนเต็ม ไม่ใช่ 24.00 วัน */
    else if (t === "foot") { s.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
    else if (t === "item" || t === "itemAlt") {
      if (t === "itemAlt") s.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s.border = boxAll;
      if (c === 0) { s.alignment = { horizontal: "left", vertical: "center" }; s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.text } }; }
      else { s.alignment = { horizontal: "center", vertical: "center" }; if (c !== lastC - 1 && c !== lastC && c !== days.length + 1) s.numFmt = "0.00"; }
      if (c === lastC - 1 && aoa[r][c]) { s.fill = { patternType: "solid", fgColor: { rgb: C.warn } }; s.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.warnTx } }; }
    }
    return s;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const st = styleCell(r, c);
      if (!st) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = st;
    }
  }
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "เวลาทำงาน");

  /* ── แผ่น OT แยกรายคน ──
     รวมทุกคนไว้แผ่นเดียวแล้วให้หัวหน้าเซ็นท้ายแผ่น = เซ็นทีเดียวครอบคนที่ไม่ได้อ่าน
     แยกคนละแผ่นแล้วพิมพ์ออกมาจะได้คนละใบ เซ็นได้ทีละคน และแจกให้เจ้าตัวเก็บได้
     เอาเฉพาะใบที่ส่งแล้ว (รออนุมัติ/อนุมัติแล้ว) — ใบร่างยังไม่ใช่คำขอ ใบที่ถูกปัดตกไม่ต้องเซ็น */
  /* ── แท็บรายละเอียดรายคน ──
     รวมทุกคนไว้แผ่นเดียวแล้วให้หัวหน้าเซ็นท้ายแผ่น = เซ็นทีเดียวครอบคนที่ไม่ได้อ่าน
     แยกคนละแท็บแล้วพิมพ์ออกมาจะได้คนละใบ เซ็นได้ทีละคน และแจกให้เจ้าตัวเก็บได้
     ใบ OT เอาเฉพาะที่ส่งแล้ว (รออนุมัติ/อนุมัติแล้ว) — ใบร่างยังไม่ใช่คำขอ ใบที่ถูกปัดตกไม่ต้องเซ็น */
  const otMine = {};
  (otRows || []).forEach((o) => {
    if (!o || !o.userId) return;
    if (window.tmYm(o.date) !== ym) return;
    if (o.status !== "sent" && o.status !== "approved") return;
    (otMine[o.userId] || (otMine[o.userId] = [])).push(o);
  });

  /* คนที่ต้องมีแท็บ = มีวันลงเวลา หรือมีใบ OT — คนที่ทั้งเดือนไม่มีอะไรเลยยังอยู่ในแผ่นสรุป
     (เป็นแถวศูนย์ ซึ่งต้องเห็น) แต่ไม่ต้องมีแท็บเปล่า ๆ ให้ไล่หา */
  const want = rows.filter((r) => (r.days > 0) || (otMine[r.userId] || []).length);
  /* อ่านใบเต็มของทุกคนพร้อมกันครั้งเดียว ไม่ใช่ทีละคนตอนสร้างแผ่น
     คนสิบห้าคน = สิบห้าคำขอที่วิ่งขนานกัน ไม่ใช่สิบห้ารอบที่ต่อคิวกัน */
  let detail = {};
  try { detail = await window.tmFetchMonthDetail(want.map((r) => r.userId), ym); }
  catch (e) { detail = {}; }   /* อ่านไม่ได้ก็ยังออกไฟล์ได้ แค่ช่องพิกัดจะว่าง ดีกว่าไม่ได้ไฟล์เลย */

  /* เรียงคนตามลำดับเดียวกับแผ่นสรุป เพื่อให้แท็บล่างของ Excel ไล่ตามตารางข้างบน */
  /* จองชื่อแผ่นสรุปไว้ก่อน — คนที่บังเอิญชื่อซ้ำกับแผ่นสรุปจะทำให้ Excel ปฏิเสธทั้งไฟล์ ไม่ใช่แค่แท็บเดียว */
  const used = { "เวลาทำงาน": 1 };
  want.forEach((r) => {
    const list = (otMine[r.userId] || []).slice();
    list.sort((a2, b2) => String(a2.date + a2.from).localeCompare(String(b2.date + b2.from)));
    X.utils.book_append_sheet(wb, tmPersonSheet(X, r, list, detail[r.userId] || {}, days, ym, cfg, FONT, C),
      tmSheetName(r.name, used));
  });

  X.writeFile(wb, "สรุปเวลาทำงาน_" + ym + ".xlsx");
}

/* ชื่อแผ่นของ Excel: ห้ามเกิน 31 ตัว ห้ามมี : \\ / ? * [ ] และห้ามซ้ำกัน
   ถ้าซ้ำหรือยาวเกิน Excel จะไม่เปิดไฟล์เลย ไม่ใช่แค่เพี้ยน */
function tmSheetName(raw, used) {
  let n = String(raw || "พนักงาน").replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "พนักงาน";
  if (used[n]) { let i = 2; while (used[n.slice(0, 28) + " " + i]) i += 1; n = n.slice(0, 28) + " " + i; }
  used[n] = 1;
  return n;
}

const TM_DOW_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/* ── แท็บรายละเอียดของคนหนึ่งคน หนึ่งเดือน ──
   ต้องตอบคำถามที่ออฟฟิศถามย้อนหลังให้ครบในแผ่นเดียว:
   วันไหนมาบ้าง · เข้า-ออกกี่โมง · ตอนปั๊มอยู่ตรงไหน · วันไหนขอ OT และขอทำอะไร
   "ปฏิบัติหน้าที่" คือเหตุผลที่เจ้าตัวกรอกไว้ตอนขอ ไม่ใช่ช่องที่ออฟฟิศมาเติมทีหลัง */
function tmPersonSheet(X, person, list, recs, days, ym, cfg, FONT, C) {
  const thin = { style: "thin", color: { rgb: C.border } };
  const boxAll = { top: thin, bottom: thin, left: thin, right: thin };
  const H = (m) => (!m ? 0 : Math.round((m / 60) * 100) / 100);
  const name = person.name || person.userId;
  const office = window.tmWhNorm(cfg).office;
  const lastC = 12;   /* สิบสามคอลัมน์ ใช้ร่วมกันทั้งตารางรายวันและตาราง OT เพื่อให้ความกว้างคงที่ */

  const aoa = [], merges = [], meta = [], rowsH = [], links = {}; let R = 0;
  const push = (cells, type, hpt) => { aoa.push(cells); meta[R] = type; if (hpt) rowsH[R] = { hpt: hpt }; R += 1; };
  const full = (r) => merges.push({ s: { r: r, c: 0 }, e: { r: r, c: lastC } });

  /* ── หัวใบ ── */
  push(["ใบลงเวลาและการทำงานล่วงเวลา รายบุคคล"], "title", 30); full(R - 1);
  push([name + " · " + window.tmYmTH(ym)], "subtitle", 22); full(R - 1);
  push([], "spacer", 6);

  /* OT รายวัน — ใช้ทั้งในตารางรายวันและยอดรวม จึงรวมไว้ก่อนครั้งเดียว */
  const otByDay = {};
  list.forEach((o) => { (otByDay[o.date] || (otByDay[o.date] = [])).push(o); });

  let otApproved = 0, otWaiting = 0, payApproved = 0;
  list.forEach((o) => {
    const m = +o.mins || 0;
    if (o.status === "approved") { otApproved += m; payApproved += window.tmOtPayMins(o, cfg); }
    else otWaiting += m;
  });

  push(["วันที่ลงเวลา", person.days || 0, "ชั่วโมงรวม", H(person.mins), "OT อนุมัติแล้ว", H(otApproved),
        "ชม.คิดค่าแรง", H(payApproved), "ลืมกดออกงาน", person.noOut || 0, "ไม่มีพิกัด", person.noGps || 0, ""], "kv", 21);
  push([], "spacer", 8);

  /* ── ตารางรายวัน ── */
  push(["รายวัน — เวลาเข้า-ออก และตำแหน่งตอนปั๊ม"], "sec", 22); full(R - 1);
  push(["วันที่", "วัน", "เข้า", "ออก", "รวม (ชม.)", "ที่ทำงาน", "งานที่แจ้ง",
        "พิกัดตอนเข้า", "พิกัดตอนออก", "ห่างจากออฟฟิศ", "แผนที่", "OT วันนี้ (ชม.)", "OT ประเภท / เรื่องที่ทำ"], "head", 28);

  const dayStart = R;
  let alt = false, shown = 0;
  (days || []).forEach((d) => {
    const rec = recs[d] || null;
    const idx = person.byDay ? person.byDay[d] : null;
    const ots = otByDay[d] || [];
    /* แถวมีได้สองเหตุ: มีใบลงเวลา หรือมีใบ OT ของวันนั้น
       วันที่ไม่มีทั้งสองอย่างไม่ต้องขึ้นแถว ไม่งั้นแผ่นจะยาวสามสิบแถวที่ว่างเปล่ายี่สิบแถว */
    if (!rec && !idx && !ots.length) return;
    shown += 1;
    const IN = (rec && rec.in) || null, OUT = (rec && rec.out) || null;
    const otMins = ots.reduce((a2, o) => a2 + (+o.mins || 0), 0);
    const otTxt = ots.map((o) => window.tmOtKindOf(o.kind).th
      + (o.reason ? " — " + o.reason : "")
      + (o.status === "approved" ? "" : " (" + window.tmOtStatusOf(o.status).th + ")")).join(" · ");
    const place = (idx && idx.place) || (rec && ((rec.in && rec.in.place) || rec.place)) || "";
    const hm = (x, k) => (x && x.hm) || (idx && idx[k]) || "";
    push([window.drDateTH(d), TM_DOW_TH[new Date(d + "T00:00:00").getDay()],
      hm(IN, "in"), hm(OUT, "out"),
      /* วันที่ขึ้นแถวเพราะมีใบ OT อย่างเดียว ต้องปล่อยช่องชั่วโมงว่าง ไม่ใช่ 0.00
         ช่องว่าง = ไม่มีใบลงเวลา · 0.00 = มีใบแต่ลืมกดออกงาน สองอย่างนี้ห้ามอ่านเหมือนกัน */
      (rec || idx) ? H(rec ? window.tmWorkedMins(rec, cfg) : (idx && idx.mins) || 0) : "",
      place ? window.tmPlaceOf(place).th : "",
      (rec && rec.jobCode) || (idx && idx.jobCode) || "",
      window.tmGpsTH(IN), window.tmGpsTH(OUT), window.tmDistTH(window.tmOfficeDist(IN, cfg)),
      window.tmGpsUrl(IN) ? "เปิดแผนที่" : "", otMins ? H(otMins) : "", otTxt], alt ? "itemAlt" : "item", 19);
    if (window.tmGpsUrl(IN)) links[(R - 1) + ":10"] = window.tmGpsUrl(IN);
    alt = !alt;
  });
  if (!shown) { push(["เดือนนี้ไม่มีใบลงเวลาเลย"], "muted", 20); full(R - 1); }
  else {
    push(["รวมทั้งเดือน", "", "", "", H(person.mins), "", "", "", "", "", "", H(otApproved), "ชั่วโมง OT ที่อนุมัติแล้ว"], "total", 24);
    merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });
    merges.push({ s: { r: R - 1, c: 5 }, e: { r: R - 1, c: 10 } });
  }

  push([], "spacer", 10);

  /* ── ตารางใบ OT ── */
  push(["ใบขออนุมัติทำงานล่วงเวลา (OT) ในเดือนนี้"], "sec", 22); full(R - 1);
  push(["ลำดับ", "วันที่", "ตั้งแต่", "ถึง", "รวม (ชม.)", "ประเภท", "อัตรา", "ชม.คิดค่าแรง",
        "งาน", "ปฏิบัติหน้าที่", "สถานะในระบบ", "ผู้อนุมัติในระบบ", ""], "head", 28);

  const otStart = R;
  if (!list.length) { push(["เดือนนี้ไม่มีใบ OT ที่ส่งขออนุมัติ"], "muted", 20); full(R - 1); }
  alt = false;
  list.forEach((o, i) => {
    const mins = +o.mins || 0;
    const rt = window.tmOtRate(o, cfg);
    push([i + 1, window.drDateTH(o.date), o.from || "", o.to || "", H(mins),
      window.tmOtKindOf(o.kind).th, o.parts && o.parts.length ? window.tmOtPartsTH(o.parts) : rt, H(window.tmOtPayMins(o, cfg)), o.jobCode || "—", o.reason || "",
      window.tmOtStatusOf(o.status).th, o.approverName || "—", ""], alt ? "itemAlt2" : "item2", 19);
    alt = !alt;
  });

  if (list.length) {
    push(["รวมที่อนุมัติแล้วในระบบ", "", "", "", H(otApproved), "ชั่วโมง", "", H(payApproved), "ชม.คิดค่าแรง", "", "", "", ""], "total2", 24);
    merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });
    merges.push({ s: { r: R - 1, c: 8 }, e: { r: R - 1, c: lastC } });
    /* ยอดที่ยังรออนุมัติต้องแยกบรรทัด ไม่ใช่บวกรวมกับยอดที่อนุมัติแล้ว
       ไม่งั้นแผ่นนี้จะกลายเป็นยอดจ่ายที่ยังไม่มีใครอนุมัติ */
    push(["ยังรออนุมัติในระบบ", "", "", "", H(otWaiting), "ชั่วโมง", "", "", "ต้องกดอนุมัติในระบบก่อนจึงจะนับเป็นยอดจ่าย", "", "", "", ""],
      otWaiting ? "warnRow" : "muted2", 22);
    merges.push({ s: { r: R - 1, c: 0 }, e: { r: R - 1, c: 3 } });
    merges.push({ s: { r: R - 1, c: 8 }, e: { r: R - 1, c: lastC } });
  }

  /* ── ช่องเซ็น ── สามช่องเท่ากับใบ A4 ที่พิมพ์จากหน้าจอ เพื่อให้สองทางออกเป็นเอกสารเดียวกัน */
  push([], "spacer", 14);
  const sign3 = (r) => {
    merges.push({ s: { r: r, c: 0 }, e: { r: r, c: 3 } });
    merges.push({ s: { r: r, c: 4 }, e: { r: r, c: 7 } });
    merges.push({ s: { r: r, c: 8 }, e: { r: r, c: lastC } });
  };
  push(["ลงชื่อผู้ปฏิบัติงาน ....................................", "", "", "",
        "ลงชื่อหัวหน้างานผู้อนุมัติ ....................................", "", "", "",
        "ลงชื่อฝ่ายบุคคล / ผู้ตรวจสอบ ....................................", "", "", "", ""], "sign", 34);
  sign3(R - 1);
  push(["(" + name + ")", "", "", "",
        "(....................................)  วันที่ ......./......./.......", "", "", "",
        "(....................................)  วันที่ ......./......./.......", "", "", "", ""], "signSub", 22);
  sign3(R - 1);

  push([], "spacer", 8);
  push(["พิกัดคือตำแหน่งของ “เครื่องที่กดปั๊ม” ตอนกด ไม่ใช่การยืนยันว่าอยู่ที่ไซต์นั้นจริง — ระบบยังไม่มีพิกัดไซต์ให้เทียบระยะ"], "foot", 16); full(R - 1);
  push(["ช่องพิกัดที่ว่างหรือขึ้นเหตุผล แปลว่าจับพิกัดไม่ได้ตอนนั้น ระบบไม่เคยบล็อกการลงเวลาด้วยเหตุนี้"], "foot", 16); full(R - 1);
  /* บอกจุดอ้างอิงไว้บนแผ่นด้วย — กระดาษที่พิมพ์ออกไปแล้วต้องอ่านเข้าใจโดยไม่ต้องเปิดระบบ
     และถ้าออฟฟิศย้ายที่ ใบเก่ากับใบใหม่จะอ้างคนละจุด ต้องดูออกจากตัวเลขบนแผ่น */
  push([office.lat != null
    ? "ระยะวัดจากพิกัดออฟฟิศที่ตั้งไว้ " + (office.name ? office.name + " " : "")
      + (+office.lat).toFixed(6) + ", " + (+office.lng).toFixed(6) + " (รัศมีที่ถือว่าถึงออฟฟิศ " + office.radius + " ม.)"
    : "ยังไม่ได้ตั้งพิกัดออฟฟิศในระบบ ช่อง “ห่างจากออฟฟิศ” จึงว่างทั้งคอลัมน์"], "foot", 16); full(R - 1);
  push(["เวลาในใบ OT เป็นเวลาที่ผู้ขอกรอกเอง ไม่ใช่เวลาที่ระบบจับได้ — เทียบกับตารางรายวันข้างบนได้"], "foot", 16); full(R - 1);
  push(["การเซ็นบนกระดาษไม่ได้เปลี่ยนสถานะในระบบ ใบที่ยังรออนุมัติต้องกดอนุมัติในระบบด้วย"], "foot", 16); full(R - 1);

  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = [{ wch: 14 }, { wch: 5 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 11 }, { wch: 13 },
    { wch: 19 }, { wch: 19 }, { wch: 14 }, { wch: 11 }, { wch: 13 }, { wch: 40 }];
  ws["!rows"] = rowsH;
  /* ตรึงหัวตารางรายวันไว้ — แผ่นเดียวมีทั้งเดือนบวกใบ OT เลื่อนลงไปแล้วจะไม่รู้ว่าคอลัมน์ไหนคืออะไร */
  ws["!freeze"] = { xSplit: 1, ySplit: dayStart };

  const styleCell = (r, c) => {
    const t = meta[r]; if (t === "spacer") return null;
    const s2 = { font: { name: FONT, sz: 10.5, color: { rgb: C.text } }, alignment: { vertical: "center" } };
    if (t === "title") { s2.font = { name: FONT, sz: 15, bold: true, color: { rgb: C.white } }; s2.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s2.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "subtitle") { s2.font = { name: FONT, sz: 12, bold: true, color: { rgb: C.brandDk } }; s2.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s2.alignment = { horizontal: "center", vertical: "center" }; }
    else if (t === "sec") { s2.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.brandDk } }; s2.alignment = { horizontal: "left", vertical: "center" }; }
    else if (t === "kv") {
      s2.border = boxAll;
      /* ช่องคู่: เลขคี่คือค่า เลขคู่คือป้าย — ป้ายต้องจางกว่าค่า ไม่งั้นตาไปหาผิดตัว */
      if (c % 2 === 0) { s2.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; s2.fill = { patternType: "solid", fgColor: { rgb: C.brandSoft } }; s2.alignment = { horizontal: "right", vertical: "center" }; }
      else { s2.font = { name: FONT, sz: 11.5, bold: true, color: { rgb: C.text } }; s2.alignment = { horizontal: "center", vertical: "center" }; if (c === 3 || c === 5 || c === 7) s2.numFmt = "0.00"; }
    }
    else if (t === "head") { s2.font = { name: FONT, sz: 10, bold: true, color: { rgb: C.white } }; s2.fill = { patternType: "solid", fgColor: { rgb: C.brand } }; s2.alignment = { horizontal: "center", vertical: "center", wrapText: true }; s2.border = boxAll; }
    else if (t === "total" || t === "total2") { s2.font = { name: FONT, sz: 11, bold: true, color: { rgb: C.white } }; s2.fill = { patternType: "solid", fgColor: { rgb: C.brandDk } }; s2.alignment = { horizontal: c <= 3 ? "left" : "center", vertical: "center" }; s2.border = boxAll; if (c === 4 || (t === "total" && c === 11) || (t === "total2" && c === 7)) s2.numFmt = "0.00"; }
    else if (t === "warnRow") { s2.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.warnTx } }; s2.fill = { patternType: "solid", fgColor: { rgb: C.warn } }; s2.alignment = { horizontal: c <= 3 ? "left" : "center", vertical: "center" }; s2.border = boxAll; if (c === 4) s2.numFmt = "0.00"; }
    else if (t === "muted" || t === "muted2") { s2.font = { name: FONT, sz: 10.5, color: { rgb: C.sub } }; s2.alignment = { horizontal: c <= 3 ? "left" : "center", vertical: "center" }; if (t === "muted2") s2.border = boxAll; if (t === "muted2" && c === 4) s2.numFmt = "0.00"; }
    else if (t === "sign") { s2.font = { name: FONT, sz: 11, color: { rgb: C.text } }; s2.alignment = { horizontal: "left", vertical: "bottom" }; }
    else if (t === "signSub") { s2.font = { name: FONT, sz: 10, color: { rgb: C.sub } }; s2.alignment = { horizontal: "left", vertical: "top" }; }
    else if (t === "foot") { s2.font = { name: FONT, sz: 9.5, color: { rgb: C.sub } }; }
    else if (t === "item" || t === "itemAlt" || t === "item2" || t === "itemAlt2") {
      const two = t === "item2" || t === "itemAlt2";
      if (t === "itemAlt" || t === "itemAlt2") s2.fill = { patternType: "solid", fgColor: { rgb: C.alt } };
      s2.border = boxAll;
      /* ช่องข้อความยาวต้องตัดบรรทัดในช่อง ไม่ใช่ล้นทับช่องข้าง ๆ ตอนพิมพ์ */
      const wrapCol = two ? 9 : 12;
      if (c === wrapCol) s2.alignment = { horizontal: "left", vertical: "center", wrapText: true };
      else if (c === 0 || (!two && (c === 6 || c === 7 || c === 8)) || (two && c === 8)) s2.alignment = { horizontal: "left", vertical: "center" };
      else { s2.alignment = { horizontal: "center", vertical: "center" }; }
      if (c === 4) s2.numFmt = "0.00";
      if (two && c === 7) s2.numFmt = "0.00";
      if (two && c === 6) s2.numFmt = '0.##" เท่า"';
      if (!two && c === 11 && aoa[r][c]) { s2.numFmt = "0.00"; s2.font = { name: FONT, sz: 10.5, bold: true, color: { rgb: C.brandDk } }; }
      /* พิกัดเป็นตัวเลขยาว ต้องเป็นฟอนต์เดียวกันทุกแถวถึงจะไล่สายตาลงมาเทียบกันได้ */
      if (!two && (c === 7 || c === 8 || c === 9)) s2.font = { name: "Consolas", sz: 9.5, color: { rgb: C.sub } };
    }
    return s2;
  };
  const range = X.utils.decode_range(ws["!ref"]);
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const ref = X.utils.encode_cell({ r: r, c: c }); const st = styleCell(r, c);
      if (!st) continue; if (!ws[ref]) ws[ref] = { t: "s", v: "" }; ws[ref].s = st;
    }
  }
  /* ลิงก์แผนที่ — ใส่หลังลงสไตล์ ไม่งั้นสีลิงก์จะถูกสไตล์ของแถวทับจนดูไม่ออกว่ากดได้ */
  Object.keys(links).forEach((k) => {
    const rc = k.split(":");
    const ref = X.utils.encode_cell({ r: +rc[0], c: +rc[1] });
    if (!ws[ref]) return;
    ws[ref].l = { Target: links[k], Tooltip: "เปิดตำแหน่งนี้ใน Google Maps" };
    ws[ref].s = Object.assign({}, ws[ref].s, {
      font: { name: FONT, sz: 10, bold: true, underline: true, color: { rgb: "1155CC" } } });
  });
  return ws;
}

/* ── ใบ OT หนึ่งใบ ── */
function TmOtModal({ rec, cfg, jobs, users, role, currentUser, onSave, onMove, onDelete, onClose }) {
  const [f, setF] = React.useState(rec);
  /* งานที่ช่างพิมพ์เองในไลน์ (ไม่มีในระบบ) เก็บใน jobCode ไม่มี jobId — ดรอปดาวน์หาไม่เจอเลยขึ้น "ไม่ระบุงาน"
     ทั้งที่ใบมีงานระบุอยู่ (ผู้ใช้ทัก ต.ค. 2026 OT-6910-05/06) → โหมดพิมพ์ แสดงข้อความนั้นตรง ๆ */
  const [jobTxt, setJobTxt] = React.useState(() => !!(rec.jobCode && !(jobs || []).some((j) => j.id === rec.jobId)));
  React.useEffect(() => { setF(rec); }, [rec && rec.id]);
  const box = window.useBackdropClose ? window.useBackdropClose(onClose) : {};
  const isAdmin = window.usePgAdmin ? window.usePgAdmin() : false;
  if (!f) return null;

  const mine = currentUser && f.userId === currentUser.id;
  const editable = mine && (f.status === "draft");
  const set = (k, v) => setF((p) => {
    let next = Object.assign({}, p, { [k]: v });
    /* เปลี่ยนประเภทแล้วตัวคูณต้องตามไปด้วย — ใบที่ยังเป็นร่างยังไม่มีใครเซ็น จึงยึดอัตราปัจจุบัน
       (ใบที่ส่งไปแล้วแก้ไม่ได้อยู่แล้ว อัตราที่ถ่ายไว้ตอนนั้นจึงถูกตรึงไปเอง) */
    if (k === "kind") next.rate = window.tmOtRate(v, cfg);
    /* วิธีคิดใหม่ (tmOtFill): นับทั้งช่วงที่กรอก · วันหยุดแยก ×1.5 / ×2 */
    if (next.status === "draft") next = window.tmOtFill(next, cfg);
    return next;
  });
  /* ใบที่ส่งแล้ว/อนุมัติแล้ว ยึดยอดที่ถ่ายไว้ในใบ — ไม่คิดใหม่ตอนกดอนุมัติ (ใบเก่าคิดแบบเดิม) */
  /* ร่าง/รออนุมัติ คิดใหม่ตามวิธีใหม่ (ผู้ใช้สั่ง) — อนุมัติแล้วบันทึกค่าใหม่ลงใบ · ตัดสินแล้วไม่แตะ */
  const pend = f.status === "draft" || f.status === "sent";
  const cur = pend ? window.tmOtFill(f, cfg) : f;
  const mins = pend ? cur.mins : (+f.mins || 0);
  const rate = window.tmOtRate(cur, cfg);
  const span = window.tmSpanMins(f.from, f.to);
  const nexts = window.tmOtNext(f, role, currentUser);
  const why = window.tmOtApproveCheck(f, currentUser, role).why;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(15,23,42,.45)", display: "grid", placeItems: "center", padding: 18 }} {...box}>
      <div style={{ width: "min(620px,100%)", maxHeight: "90vh", overflow: "auto", background: "var(--bg)",
        border: "none", boxShadow: "var(--shadow-sm)", borderRadius: 17, padding: 20 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>{f.no}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-1)" }}>{window.tmNameOf(users, f.userId, f.userName)}</div>
          </div>
          <TmPill s={f.status} />
          <button className="x-close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <Icon name="x" size={18} color="var(--text-3)" />
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>วันที่</span>
            <input type="date" value={f.date} disabled={!editable} onChange={(e) => set("date", e.target.value)} style={TM_IN_W} />
          </label>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตั้งแต่</span>
            <window.PgTime value={f.from} disabled={!editable} onChange={(t) => set("from", t)} style={TM_IN_W} />
          </label>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ถึง</span>
            <window.PgTime value={f.to} disabled={!editable} onChange={(t) => set("to", t)} style={TM_IN_W} />
          </label>
          <label style={TM_LB}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ประเภท</span>
            <select value={f.kind} disabled={!editable} onChange={(e) => set("kind", e.target.value)} style={TM_IN_W}>
              {window.TM_OT_KIND.map((k) => <option key={k.key} value={k.key}>{k.th}</option>)}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: "var(--r-chip)", background: "var(--surface2)", border: "none", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>นับเป็น OT</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800,
              color: mins ? "var(--primary-dark)" : "var(--text-3)" }}>{window.tmDur(mins)}</span>
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>จากช่วงที่กรอกทั้งหมด {window.tmDur(span)}</span>
          </div>
          {/* ชั่วโมงคิดค่าแรง = นาทีจริง × ตัวคูณของประเภทนั้น — ตัวเลขที่ฝ่ายบุคคลเอาไปใช้ต่อ */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>คิดค่าแรง</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>
              {cur.parts && cur.parts.length ? window.tmOtPartsTH(cur.parts) : window.tmRateTH(rate)}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>
              = {(Math.round((window.tmOtPayMins(Object.assign({}, cur, { mins: mins }), cfg) / 60) * 100) / 100).toFixed(2)} ชม.คิดค่าแรง
            </span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
            {window.tmIsWorkday(f.date, cfg)
              ? "วันทำงาน — นับตามช่วงที่กรอกทั้งช่วง"
              : "วันหยุด — " + window.tmDur(window.tmWhNorm(cfg).workMins) + " แรก (หักพัก " + window.tmDur(window.tmWhNorm(cfg).lunchMins) + ") ×" + window.tmWhNorm(cfg).otRates.holiday + " · เกินจากนั้น ×" + window.tmWhNorm(cfg).otRates.holidayOt}
            {window.tmWhNorm(cfg).roundMins > 0 ? " · ปัดลงทีละ " + window.tmWhNorm(cfg).roundMins + " นาที" : ""}
            {window.tmWhNorm(cfg).minOtMins > 0 ? " · ไม่ถึง " + window.tmWhNorm(cfg).minOtMins + " นาทีไม่นับ" : ""}
          </div>
        </div>

        <label style={{ marginTop: 12, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>งานที่เกี่ยวข้อง</span>
          {jobTxt
            ? <div style={{ display: "flex", gap: 8 }}>
                <input value={f.jobCode || ""} disabled={!editable} maxLength={80} placeholder="ทำงานอะไร เช่น สำรวจลูกค้าใหม่"
                  onChange={(e) => setF((p) => Object.assign({}, p, { jobId: null, jobCode: e.target.value }))}
                  style={Object.assign({}, TM_IN, { flex: 1, minWidth: 0 })} />
                {editable
                  ? <button type="button" onClick={() => { setJobTxt(false); setF((p) => Object.assign({}, p, { jobId: null, jobCode: "" })); }}
                      style={Object.assign({}, TM_IN, { cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" })}>☰ รายการ</button>
                  : <span style={{ alignSelf: "center", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>ช่างพิมพ์เอง</span>}
              </div>
            : <select value={f.jobId || ""} disabled={!editable}
                onChange={(e) => {
                  if (e.target.value === "__txt") { setJobTxt(true); setF((p) => Object.assign({}, p, { jobId: null, jobCode: "" })); return; }
                  const j = (jobs || []).find((x) => x.id === e.target.value);
                  setF((p) => Object.assign({}, p, { jobId: j ? j.id : null, jobCode: j ? j.code : "" }));
                }} style={TM_IN}>
                <option value="">— ไม่ระบุงาน —</option>
                {(jobs || []).map((j) => <option key={j.id} value={j.id}>{j.code} · {j.name}</option>)}
                <option value="__txt">✎ พิมพ์เอง (งานที่ไม่มีในระบบ)</option>
              </select>}
        </label>

        <label style={{ marginTop: 10, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เหตุผลที่ต้องทำนอกเวลา</span>
          <textarea value={f.reason || ""} disabled={!editable} rows={3}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="เช่น ต้องปิดงานให้ทันก่อนการไฟฟ้าเข้าตรวจพรุ่งนี้เช้า"
            style={Object.assign({}, TM_IN, { resize: "vertical", lineHeight: 1.6 })} />
        </label>

        {/* ── คนอนุมัติ ──
            ต้องเลือกก่อนส่ง ไม่ใช่ปล่อยเข้ากองกลาง — ใบที่ไม่มีชื่อใครกำกับ
            ทุกคนคิดว่าเป็นหน้าที่คนอื่น แล้วก็ค้างจนเจ้าของใบลืมไปเอง */}
        <label style={{ marginTop: 10, display: "grid", gap: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ส่งให้ใครอนุมัติ</span>
          {editable ? (
            <select value={f.approverId || ""}
              onChange={(e) => {
                const u = (users || []).find((x) => x.id === e.target.value);
                setF((p) => Object.assign({}, p, { approverId: u ? u.id : null, approverName: u ? u.name : "" }));
              }} style={TM_IN}>
              <option value="">— ยังไม่เลือก (เข้ากองกลาง) —</option>
              {window.tmOtApprovers(users, { id: f.userId }).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          ) : (
            <span style={{ fontSize: 12.5, color: f.approverName ? "var(--text-1)" : "#F59E0B", fontWeight: 700 }}>
              {f.approverName || "ไม่ได้ระบุคนอนุมัติ — ใบนี้อยู่ในกองกลาง"}
            </span>
          )}
        </label>
        {editable && !f.approverId && (
          <div style={{ marginTop: 4, fontSize: 11, color: "#F59E0B", lineHeight: 1.6 }}>
            ส่งได้โดยไม่เลือก แต่ใบจะเข้ากองกลางให้ใครก็ได้ที่มีสิทธิ์หยิบ — ระบุชื่อไว้ใบจะไม่ค้าง
          </div>
        )}
        {f.cancelledAt && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: "var(--r-chip)", background: "var(--surface2)",
            fontSize: 12, color: "var(--text-2)" }}>
            ยกเลิกโดยเจ้าของใบ · {window.drShort(String(f.cancelledAt).slice(0, 10))}
          </div>
        )}
        {f.decidedAt && (
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: "var(--r-chip)", background: "var(--surface2)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
            {window.tmOtStatusOf(f.status).th} โดย {f.decidedByName || "-"} · {window.drShort(String(f.decidedAt).slice(0, 10))}
            {f.decidedNote ? <div style={{ marginTop: 3 }}>“{f.decidedNote}”</div> : null}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {editable && (
            <button onClick={() => { onSave(cur); onClose(); }}
              style={{ padding: "9px 16px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)", background: "var(--surface)",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>บันทึกร่าง</button>
          )}
          {nexts.map((s) => {
            /* "ตีกลับ" กับ "เอากลับมาแก้" เป็นการเดินสถานะเดียวกัน (→ draft) แต่คนละเรื่องกัน
               สำหรับคนอ่าน — คำบนปุ่มจึงต้องเปลี่ยนตามว่าใครกด ไม่ใช่ตามชื่อสถานะ */
            const soft = s.key === "cancelled" || (s.key === "draft" && f.status === "sent" && !mine);
            const label = s.key === "sent" ? "ส่งขออนุมัติ"
              : s.key === "approved" ? "อนุมัติ"
              : s.key === "rejected" ? "ไม่อนุมัติ"
              : s.key === "cancelled" ? "ยกเลิกใบนี้"
              : mine ? "เอากลับมาแก้" : "ตีกลับให้แก้";
            return (
              <button key={s.key} onClick={() => { onMove(cur, s.key); onClose(); }}
                style={{ padding: "9px 16px", borderRadius: "var(--r-chip)", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12.5, fontWeight: 800,
                  border: soft ? "1px solid var(--border-strong)" : "none",
                  background: soft ? "var(--surface)" : s.color, color: soft ? s.color : "#fff" }}>
                {label}
              </button>
            );
          })}
          {f.status === "sent" && !mine && why && (
            <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>{why}</span>
          )}
          {/* เจ้าของลบร่างตัวเองได้ · แอดมินลบได้ทุกสถานะ (ใบซ้ำ/ใบผิด) — ลบแล้วกู้ไม่ได้ จึงต้องยืนยันก่อน */}
          {((mine && f.status === "draft") || isAdmin) && onDelete && (
            <button onClick={async () => {
              const ok = await window.askConfirm({ title: "ลบใบ " + (f.no || "OT") + " ?", body: "ลบแล้วกู้คืนไม่ได้", ok: "ลบใบนี้", danger: true });
              if (ok) { onDelete(f.id); onClose(); }
            }}
              style={{ marginLeft: "auto", padding: "9px 14px", borderRadius: "var(--r-chip)", border: "1px solid var(--border-strong)",
                background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, color: "var(--tint-red-tx2)" }}>ลบใบนี้</button>
          )}
        </div>
      </div>
    </div>
  );
}

function TmOtRow({ rec, users, onOpen }) {
  const k = window.tmOtKindOf(rec.kind);
  return (
    <button onClick={() => onOpen(rec)}
      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", border: "none",
        borderBottom: "1px solid var(--divider)", background: "var(--surface)", cursor: "pointer", fontFamily: "inherit" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>{rec.no}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-1)" }}>{window.tmNameOf(users, rec.userId, rec.userName)}</span>
        <span style={{ padding: "2px 8px", borderRadius: "var(--r-pill)", background: k.color + "1A", color: k.color, fontSize: 10.5, fontWeight: 800 }}>{k.th}</span>
        <TmPill s={rec.status} size="sm" />
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>{window.tmDur(rec.mins)}</span>
      </div>
      <div style={{ marginTop: 3, fontSize: 12, color: "var(--text-3)" }}>
        {window.drDateTH(rec.date)} · {rec.from}-{rec.to}{rec.jobCode ? " · " + rec.jobCode : ""}
        {rec.reason ? " · " + rec.reason : ""}
      </div>
    </button>
  );
}

/* ── ตั้งค่าเวลาทำงาน ── */
/* ── ตั้งพิกัดออฟฟิศ ──
   จุดประสงค์เดียว: ให้แผ่นเวลาบอกได้ว่าคนที่กด "ออฟฟิศ" ตอนนั้นอยู่ห่างออฟฟิศเท่าไร
   ตั้งใจไม่ทำให้บล็อกการลงเวลา — ดูเหตุผลที่ TM_WH_DEFAULT.office */
function TmOfficeCfg({ office, onChange }) {
  const o = office || {};
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const set = (k, v) => onChange(Object.assign({}, o, { [k]: v }));
  const has = o.lat != null && o.lng != null && o.lat !== "" && o.lng !== "";

  /* ปุ่มนี้ต้องยืนอยู่ที่ออฟฟิศตอนกดถึงจะได้ค่าที่ถูก — เขียนบอกไว้ใต้ปุ่ม
     ไม่งั้นแอดมินกดจากบ้านแล้วพิกัด "ออฟฟิศ" จะกลายเป็นบ้านแอดมินเงียบ ๆ */
  const useHere = async () => {
    setBusy(true); setErr("");
    const g = await window.captureGps();
    setBusy(false);
    if (!g || g.err) { setErr(g && g.msg ? g.msg : "จับพิกัดไม่สำเร็จ"); return; }
    onChange(Object.assign({}, o, { lat: g.lat, lng: g.lng }));
  };

  const numIn = (k, ph) => (
    <input type="number" step="0.000001" value={o[k] == null ? "" : o[k]} placeholder={ph}
      onChange={(e) => set(k, e.target.value === "" ? null : +e.target.value)} style={TM_IN_W} />
  );

  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>พิกัดออฟฟิศ</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ชื่อที่เรียก</span>
          <input value={o.name || ""} placeholder="เช่น ออฟฟิศใหญ่" maxLength={60}
            onChange={(e) => set("name", e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ละติจูด (lat)</span>
          {numIn("lat", "13.736717")}
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ลองจิจูด (lng)</span>
          {numIn("lng", "100.523186")}
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>รัศมีที่ถือว่าถึงออฟฟิศ (ม.)</span>
          <input type="number" min={20} max={5000} step={10} value={o.radius == null ? 150 : o.radius}
            onChange={(e) => set("radius", +e.target.value)} style={TM_IN_W} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 9 }}>
        <button onClick={useHere} disabled={busy}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9,
            border: "none", boxShadow: "var(--shadow-sm)", background: "var(--surface)", color: "var(--text-1)",
            cursor: busy ? "default" : "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 800 }}>
          <Icon name="pin" size={13} /> {busy ? "กำลังจับพิกัด…" : "ใช้ตำแหน่งที่ยืนอยู่ตอนนี้"}
        </button>
        {has && (
          <a href={window.tmGpsUrl(o)} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)" }}>เปิดดูในแผนที่ ↗</a>
        )}
        {has && (
          <button onClick={() => onChange(Object.assign({}, o, { lat: null, lng: null }))}
            style={{ padding: "7px 12px", borderRadius: 9, border: "none", boxShadow: "var(--shadow-sm)",
              background: "var(--surface)", color: "var(--tint-red-tx2)", cursor: "pointer", fontFamily: "inherit",
              fontSize: 11.5, fontWeight: 700 }}>ล้างพิกัด</button>
        )}
        {err && <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--tint-red-tx2)" }}>{err}</span>}
      </div>

      {/* ── สวิตช์ล็อกพิกัด ──
          เปิดแล้วเปลี่ยนพฤติกรรมของทั้งบริษัท จึงต้องเห็นชัดว่าตอนนี้เปิดหรือปิด
          และต้องตั้งพิกัดก่อน ไม่งั้นจะล็อกเทียบกับ "ไม่มีที่ไหน" แล้วทุกคนกดเข้างานไม่ได้ */}
      <div style={{ marginTop: 11, padding: "11px 13px", borderRadius: "var(--r-chip)",
        border: "none", boxShadow: o.lock ? "inset 0 0 0 1px #F59E0B66" : "var(--shadow-sm)",
        background: o.lock ? "rgba(245,158,11,.07)" : "var(--surface)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
          <button onClick={() => has && set("lock", !o.lock)} disabled={!has}
            aria-pressed={!!o.lock}
            title={has ? "" : "ตั้งพิกัดออฟฟิศก่อนถึงจะเปิดล็อกได้"}
            style={{ position: "relative", width: 52, height: 30, borderRadius: "var(--r-pill)", flexShrink: 0,
              border: "none", boxShadow: o.lock ? "inset 0 0 0 1px #F59E0B" : "var(--shadow-sm)",
              background: !has ? "var(--surface2)" : o.lock ? "#F59E0B" : "var(--surface2)",
              cursor: has ? "pointer" : "not-allowed", padding: 0 }}>
            <span style={{ position: "absolute", top: 3, left: o.lock ? 25 : 3, width: 22, height: 22, borderRadius: "var(--r-pill)",
              background: "#fff", boxShadow: "0 1px 3px rgba(8,20,14,.3)", transition: "left .15s" }} />
          </button>
          <span style={{ flex: 1, minWidth: 180 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>
              ล็อกพิกัดตอนลงเวลาเข้างาน {o.lock ? "· เปิดอยู่" : "· ปิดอยู่"}
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>
              {!has ? "ตั้งพิกัดออฟฟิศก่อนถึงจะเปิดได้"
                : o.lock ? "กดเข้างานได้เฉพาะตอนอยู่ในรัศมี " + (o.radius == null ? 150 : o.radius) + " ม. จากพิกัดนี้"
                : "กดเข้างานได้จากทุกที่ ระบบบันทึกระยะห่างไว้ให้ดูเฉย ๆ"}
            </span>
          </span>
        </div>
        {o.lock && (
          <div style={{ marginTop: 9, fontSize: 11.5, color: "var(--tint-amber-tx)", lineHeight: 1.75 }}>
            <b>เปิดแล้วต้องรู้ไว้</b> — GPS ในอาคารคลาดเคลื่อนได้เป็นร้อยเมตร คนที่มาทำงานจริงอาจกดเข้างานไม่ได้
            ถ้าเจอบ่อยให้เพิ่มรัศมีแทนการปิดทิ้ง · คนที่ไม่ให้สิทธิ์ตำแหน่งจะกดเข้างานไม่ได้เลย
            <br />การ<b>กดออกงานไม่เคยถูกล็อก</b> — คนที่ออกจากออฟฟิศไปแล้วต้องปิดกะได้เสมอ ไม่งั้นจะเหลือกะค้างให้ตามแก้
          </div>
        )}
      </div>

      <div style={{ marginTop: 9, padding: "11px 13px", borderRadius: "var(--r-chip)", background: "var(--surface2)",
        border: "none", boxShadow: "var(--shadow-sm)", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.8 }}>
        {has
          ? <span>ตั้งไว้ที่ <b style={{ fontFamily: "var(--mono)" }}>{(+o.lat).toFixed(6)}, {(+o.lng).toFixed(6)}</b>
              {" "}· ปั๊มที่อยู่ในรัศมี <b>{o.radius == null ? 150 : o.radius} ม.</b> จะขึ้นว่า “ถึงออฟฟิศ”</span>
          : <b style={{ color: "var(--tint-amber-tx)" }}>ยังไม่ได้ตั้งพิกัดออฟฟิศ — แผ่นเวลาจะไม่แสดงระยะห่าง</b>}
        <br /><span style={{ color: "var(--text-3)" }}>
          กดปุ่ม “ใช้ตำแหน่งที่ยืนอยู่ตอนนี้” ได้เฉพาะตอนที่ยืนอยู่ที่ออฟฟิศจริง —
          กดจากที่บ้านแล้วพิกัดออฟฟิศจะกลายเป็นบ้าน โดยที่ไม่มีอะไรเตือน
          <br />ปกติระยะที่แสดงเป็นข้อมูลให้คนอ่านตัดสินเอง ระบบไม่บล็อกการลงเวลาเพราะอยู่ไกล
          จะบล็อกก็ต่อเมื่อเปิด <b>ล็อกพิกัด</b> ในกล่องข้างล่างเท่านั้น
          <br />ใช้กับคนที่กด “ออฟฟิศ” เท่านั้น · งานหน้าไซต์เทียบระยะไม่ได้ เพราะระบบยังไม่มีพิกัดไซต์ที่เชื่อถือได้
        </span>
      </div>
    </div>
  );
}

/* วันหยุดตามประเพณีที่วันที่ตายตัว (ผู้ใช้สั่ง ต.ค. 2026: "เพิ่มวันหยุดตามปกติให้หน่อย")
   วันพระ (มาฆะ วิสาขะ อาสาฬหะ เข้าพรรษา) ขยับตามจันทรคติทุกปี — ไม่เดา ให้แอดมินเพิ่มเองตามประกาศ
   ตรงกับวันหยุดประจำสัปดาห์ของบริษัท → ชดเชยวันทำงานถัดไป (พ.ร.บ.คุ้มครองแรงงาน ม.29) */
const TM_TH_HOLIDAYS = [["01-01", "วันขึ้นปีใหม่"], ["04-06", "วันจักรี"], ["04-13", "วันสงกรานต์"], ["04-14", "วันสงกรานต์"],
  ["04-15", "วันสงกรานต์"], ["05-01", "วันแรงงานแห่งชาติ"], ["05-04", "วันฉัตรมงคล"], ["06-03", "วันเฉลิมพระชนมพรรษาพระราชินี"],
  ["07-28", "วันเฉลิมพระชนมพรรษา ร.10"], ["08-12", "วันแม่แห่งชาติ"], ["10-13", "วันคล้ายวันสวรรคต ร.9"],
  ["10-23", "วันปิยมหาราช"], ["12-05", "วันพ่อแห่งชาติ"], ["12-10", "วันรัฐธรรมนูญ"], ["12-31", "วันสิ้นปี"]];
function tmThHolidays(y, f) {
  const out = {}, have = Object.assign({}, f.holidays || {});
  const work = (d) => (f.days || []).indexOf(tmWdOf(d)) >= 0;
  TM_TH_HOLIDAYS.forEach(([md, th]) => {
    const d = y + "-" + md;
    if (have[d] || out[d]) return;   // มีอยู่แล้ว (รวมชดเชยของมัน) — ไม่ทับชื่อที่แอดมินตั้งเอง
    out[d] = th;
    if (!work(d)) {   // ตรงวันหยุดประจำสัปดาห์ → วันทำงานถัดไปที่ยังไม่ใช่วันหยุด
      let n = window.drAddDays(d, 1);
      while (!work(n) || have[n] || out[n] || TM_TH_HOLIDAYS.some(([m]) => y + "-" + m === n)) n = window.drAddDays(n, 1);
      out[n] = "ชดเชย" + th;
    }
  });
  return out;
}

function TmWorkHours({ cfg, onSave }) {
  const [f, setF] = React.useState(window.tmWhNorm(cfg));
  React.useEffect(() => { setF(window.tmWhNorm(cfg)); }, [cfg]);
  const [hDate, setHDate] = React.useState("");
  const [hName, setHName] = React.useState("");
  const set = (k, v) => setF((p) => Object.assign({}, p, { [k]: v }));
  const DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  /* กดบันทึกแล้วต้องเห็นว่าบันทึกแล้ว (ผู้ใช้ทัก ต.ค. 2026 "มันนิ่ง ๆ") — busy → ok 2.5 วิ / err ค้างจนกดใหม่ */
  const [sv, setSv] = React.useState("");
  const svT = React.useRef(0);
  React.useEffect(() => () => clearTimeout(svT.current), []);
  const doSave = () => {
    if (sv === "busy") return;
    setSv("busy"); clearTimeout(svT.current);
    Promise.resolve(onSave(f)).then(() => {
      setSv("ok"); svT.current = setTimeout(() => setSv(""), 2500);
    }, (e) => { console.error(e); setSv("err"); });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เข้างานได้ตั้งแต่</span>
          <window.PgTime value={f.startEarly} onChange={(t) => set("startEarly", t)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ทำงานวันละ (นาที)</span>
          <input type="number" min={0} step={30} value={f.workMins} onChange={(e) => set("workMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>พักกลางวัน (นาที)</span>
          <input type="number" min={0} value={f.lunchMins} onChange={(e) => set("lunchMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>OT ขั้นต่ำที่นับ (นาที)</span>
          <input type="number" min={0} value={f.minOtMins} onChange={(e) => set("minOtMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ปัดเศษ OT ทีละ (นาที)</span>
          <input type="number" min={0} value={f.roundMins} onChange={(e) => set("roundMins", +e.target.value)} style={TM_IN_W} />
        </label>
        <label style={TM_LB}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ตัดยอด OT ทุกวันที่</span>
          <input type="number" min={0} max={28} value={f.cutoffDay} onChange={(e) => set("cutoffDay", +e.target.value)} style={TM_IN_W} />
        </label>
      </div>

      {/* วันตัดยอดเป็นค่าที่กรอกแล้วนึกภาพไม่ออกที่สุดในหน้านี้ — โชว์รอบปัจจุบันจริงให้ดูเลย */}
      <div style={{ padding: "11px 13px", borderRadius: "var(--r-chip)", background: "var(--surface2)",
        border: "none", boxShadow: "var(--shadow-sm)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.8 }}>
        รอบตัดยอดตอนนี้ <b>{window.tmPeriodTH(window.tmPeriodOf(window.drToday(), f))}</b>
        <br /><span style={{ color: "var(--text-3)" }}>
          {window.tmWhNorm(f).cutoffDay
            ? "ใบ OT ของวันที่ " + window.tmWhNorm(f).cutoffDay + " นับเข้ารอบนี้ · วันที่ " +
              (window.tmWhNorm(f).cutoffDay + 1) + " เป็นต้นไปนับเข้ารอบถัดไป"
            : "ใส่ 0 = ใช้เดือนปฏิทิน (วันที่ 1 ถึงสิ้นเดือน) · ถ้าฝ่ายบุคคลปิดยอดวันที่ 25 ให้ใส่ 25"}
          <br />ตั้งได้ไม่เกินวันที่ 28 เพราะเดือนกุมภาพันธ์ไม่มีวันที่ 29-31 ทุกปี รอบจะหายไปเงียบ ๆ
        </span>
      </div>

      {/* ตัวอย่างจริงสองเคส — ค่าตั้งชุดนี้อ่านจากช่องเปล่า ๆ แล้วนึกภาพไม่ออกว่าแปลว่าอะไร */}
      <div style={{ padding: "11px 13px", borderRadius: "var(--r-chip)", background: "var(--surface2)",
        border: "none", boxShadow: "var(--shadow-sm)", fontSize: 12, color: "var(--text-2)", lineHeight: 1.8 }}>
        เข้า {f.startEarly} → เลิก <b>{window.tmWhNorm(f).end}</b>
        <span style={{ color: "var(--text-3)" }}> (ทำงาน {window.tmDur(f.workMins)} + พัก {window.tmDur(f.lunchMins)})</span>
        <br />เข้า 10:00 → เลิก <b>{window.tmDayWindow({ in: { hm: "10:00" } }, f).end}</b>
        <br /><span style={{ color: "var(--text-3)" }}>
          ไม่มีสาย — เข้ากี่โมงก็ได้ ขอแค่อยู่ครบ {window.tmDur((+f.workMins || 0) + (+f.lunchMins || 0))} (รวมพัก) · กดเข้าก่อน {f.startEarly} นับจาก {f.startEarly}
          · กดออกก่อนครบ ขึ้น "ไม่ครบ" ในแผ่นรายวัน
        </span>
      </div>

      {/* ── พิกัดออฟฟิศ ──
          อยู่คนละบล็อกกับเวลาเพราะตอบคนละคำถาม: ตรงนี้คือ "ที่ไหน" ไม่ใช่ "กี่โมง" */}
      <TmOfficeCfg office={f.office} onChange={(o) => set("office", o)} />

      {/* ── ตัวคูณค่าแรง OT ──
          แยกเป็นบล็อกของตัวเอง ไม่ปนกับช่องเวลา เพราะคนละเรื่องกัน:
          ช่องข้างบนตอบว่า "นับเป็น OT กี่นาที" ส่วนตรงนี้ตอบว่า "นาทีนั้นคิดค่าแรงกี่เท่า" */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>อัตราค่าแรง OT (ตัวคูณ)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
          {window.TM_OT_KIND.map((k) => (
            <label key={k.key} style={TM_LB}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: k.color }}>{k.th}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input type="number" min={0} max={10} step={0.5}
                  value={(f.otRates || {})[k.key] != null ? (f.otRates || {})[k.key] : ""}
                  onChange={(e) => set("otRates", Object.assign({}, f.otRates, { [k.key]: e.target.value === "" ? "" : +e.target.value }))}
                  style={Object.assign({}, TM_IN, { width: 88 })} />
                <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 700 }}>เท่า</span>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--text-3)", lineHeight: 1.5 }}>{k.hint}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 9, padding: "11px 13px", borderRadius: "var(--r-chip)", background: "var(--surface2)",
          border: "none", boxShadow: "var(--shadow-sm)", fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.8 }}>
          ค่าตั้งต้นเป็นอัตราตามกฎหมายแรงงานไทย (พ.ร.บ.คุ้มครองแรงงาน ม.61-63) —
          ล่วงเวลาวันทำงาน 1.5 เท่า · ทำงานวันหยุด 2 เท่า · ล่วงเวลาในวันหยุด 3 เท่า
          <br /><span style={{ color: "var(--text-3)" }}>
            “ทำงานวันหยุด” ตั้ง 2 เท่าไว้สำหรับลูกจ้างรายวัน — ถ้าเป็นลูกจ้างรายเดือนที่ได้ค่าจ้างวันหยุดอยู่แล้ว
            กฎหมายให้จ่ายเพิ่มอีก 1 เท่า ให้ตั้งเป็น 1 · “งานกลางคืน” กฎหมายไม่ได้กำหนดอัตราไว้ต่างหาก แต่ละที่ตกลงกันเอง
            <br />บริษัทจ่ายสูงกว่ากฎหมายได้ แต่ต่ำกว่าไม่ได้ — ระบบไม่ได้กันไว้ให้ ตั้งเท่าไหร่ก็ได้ตามที่ตกลงกันจริง
            <br /><b>ระบบคิดให้แค่ “ชั่วโมงคิดค่าแรง” (นาทีจริง × ตัวคูณ) ไม่ได้คิดเป็นเงิน</b>
            เพราะอัตราค่าจ้างรายคนไม่ได้อยู่ในระบบนี้ — ฝ่ายบุคคลเอาตัวเลขนี้ไปคูณอัตราของแต่ละคนต่อ
            <br />แก้อัตราที่นี่ไม่ย้อนไปเปลี่ยนใบเก่า ใบแต่ละใบถ่ายตัวคูณ ณ วันที่เปิดใบติดตัวไว้แล้ว
          </span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>วันทำงานประจำสัปดาห์</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DAYS.map((d, i) => {
            const on = f.days.indexOf(i) >= 0;
            return (
              <button key={i} onClick={() => set("days", on ? f.days.filter((x) => x !== i) : f.days.concat([i]).sort())}
                style={{ width: 46, padding: "8px 0", borderRadius: "var(--r-chip)", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800,
                  border: "none", boxShadow: on ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)",
                  background: on ? "var(--primary-soft)" : "var(--surface)", color: on ? "var(--primary-dark)" : "var(--text-3)" }}>{d}</button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", marginBottom: 6 }}>วันหยุดที่บริษัทประกาศ</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 8 }}>
          <input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} style={TM_IN} />
          <input value={hName} onChange={(e) => setHName(e.target.value)} placeholder="ชื่อวันหยุด" style={Object.assign({}, TM_IN, { flex: 1, minWidth: 160 })} />
          <button disabled={!hDate}
            onClick={() => { set("holidays", Object.assign({}, f.holidays, { [hDate]: hName || "วันหยุด" })); setHDate(""); setHName(""); }}
            style={{ padding: "9px 15px", borderRadius: "var(--r-chip)", border: "none", background: hDate ? "var(--primary)" : "var(--surface3)",
              color: hDate ? "#fff" : "var(--text-3)", cursor: hDate ? "pointer" : "default", fontFamily: "inherit", fontSize: 12.5, fontWeight: 800 }}>เพิ่ม</button>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
          {[new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => {
            const add = tmThHolidays(y, f), n = Object.keys(add).length;
            return (
              <button key={y} className="btn btn-soft btn-sm" disabled={!n} onClick={() => set("holidays", Object.assign({}, f.holidays, add))}
                title={n ? Object.keys(add).sort().map((d) => window.drDateTH(d) + " " + add[d]).join(" · ") : "เพิ่มครบแล้ว"}>
                <Icon name="plus" size={13} sw={2.2} /> วันหยุดตามประเพณี ปี {y + 543}{n ? " (" + n + " วัน)" : " ✓"}
              </button>
            );
          })}
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>วันพระ (มาฆะ · วิสาขะ · อาสาฬหะ · เข้าพรรษา) เปลี่ยนทุกปี เพิ่มเองตามประกาศ · กดแล้วอย่าลืมกดบันทึก</span>
        </div>
        {Object.keys(f.holidays || {}).sort().map((d) => (
          <div key={d} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", borderBottom: "1px solid var(--divider)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)", minWidth: 118 }}>{TM_WD_TH[tmWdOf(d)]} {window.drDateTH(d)}</span>
            <span style={{ fontSize: 12.5, color: "var(--text-1)" }}>{f.holidays[d]}</span>
            <button onClick={() => { const h = Object.assign({}, f.holidays); delete h[d]; set("holidays", h); }}
              style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "var(--tint-red-tx2)", fontFamily: "inherit", fontSize: 12, fontWeight: 700 }}>ลบ</button>
          </div>
        ))}
        {Object.keys(f.holidays || {}).length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)" }}>ยังไม่ได้ประกาศวันหยุดพิเศษ</div>}
      </div>

      <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7 }}>
        วันตัดยอดใช้แบ่งรอบในแท็บ “สรุปเดือน” และบนใบ OT ที่พิมพ์ออกไป ไม่ได้เปลี่ยนตัวใบที่เปิดไปแล้ว
        <br />ค่าพวกนี้ใช้คำนวณว่า “ช่วงเวลาที่ขอมานับเป็น OT กี่นาที” เท่านั้น
        ระบบไม่คิดค่าตอบแทนให้ เพราะอัตราค่าแรงรายคนไม่ได้อยู่ในระบบนี้ — การเดาแทนฝ่ายบุคคลอันตรายกว่าไม่บอกเลย
        <br />การแก้ค่าที่นี่ไม่ย้อนไปเปลี่ยนใบเก่า ใบที่อนุมัติไปแล้วเก็บจำนวนนาทีไว้ในตัวใบของมันเอง
      </div>

      <div>
        <button onClick={doSave} disabled={sv === "busy"}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: "var(--r-chip)", border: "none",
            background: sv === "ok" ? "var(--primary-dark)" : "var(--primary)", color: "#fff", transition: "background .2s",
            cursor: sv === "busy" ? "wait" : "pointer", opacity: sv === "busy" ? 0.7 : 1, fontFamily: "inherit", fontSize: 13, fontWeight: 800 }}>
          {sv === "ok" && <Icon name="check" size={14} sw={2.6} />}
          {sv === "busy" ? "กำลังบันทึก…" : sv === "ok" ? "บันทึกแล้ว" : "บันทึกเวลาทำงาน"}</button>
        {sv === "err" && <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 700, color: "var(--tint-red-tx2)" }}>บันทึกไม่สำเร็จ — ลองใหม่อีกครั้ง</span>}
      </div>
    </div>
  );
}

/* ============================================================
   หน้า "เวลาทำงาน" — หน้าตาชุดใหม่ (ผู้ใช้สั่ง ต.ค. 2026 สองรอบ:
   รอบแรก "กดแล้วงง ซับซ้อน เอกสารออกหลายจุด" → ยุบ 8 แท็บเหลือ 4
   รอบสอง "แค่ยุบแต่ไม่ได้แก้หน้าตา ช่วยออกแบบให้" → ชุดนี้)
   หลักของหน้าตา:
   - แถบบนสุด (TmHero) ตอบสองคำถามแรกที่คนเปิดหน้านี้: ฉันลงเวลาหรือยัง · วันนี้ทีมมากันกี่คน
   - แท็บเป็นสวิตช์แบบหลุม (TmSeg) ไม่ใช่ชิปเรียงกัน
   - วันนี้ = เส้นเวลา (TmTimeline) แต่ละคนเป็นแถบเข้า→ออกบนแกนชั่วโมง เห็นคนสาย/ลืมออก/ทำเกินด้วยตา
   - คำขอ = การ์ดต่อใบ (TmReqCard) ไอคอนสีตามชนิด อนุมัติได้จากการ์ดเลย
   - สรุปเดือน = ตัวเลขใหญ่แถวเดียว + การ์ดต่อคนพร้อมแถบสีรายวันทั้งเดือน (heatmap)
   CSS คำนำหน้า .tmv- (TM_CSS) · การ์ดใหญ่ใส่ boxShadow --shadow-card แบบ inline ให้ธีมกระจกจับ blur ได้
   ============================================================ */
const TM_CSS = `
.tmv{display:flex;flex-direction:column;gap:16px;min-height:0}
.tmv-card{background:var(--surface);border:1px solid var(--card-bd);border-radius:var(--r-card);padding:18px 20px}
.tmv-hero{display:flex;flex-wrap:wrap;justify-content:space-between;gap:18px 28px;align-items:center;padding:20px 24px}
.tmv-hero-me{display:flex;align-items:center;gap:16px;min-width:0;flex:1 1 300px}
.tmv-hero-ic{width:54px;height:54px;border-radius:var(--r-tile);display:grid;place-items:center;flex-shrink:0}
.tmv-k{font-size:12px;font-weight:700;color:var(--text-3)}
.tmv-big{font-family:var(--display);font-size:30px;font-weight:700;line-height:1.2;color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}
.tmv-big small{font-size:16px;font-weight:600;color:var(--text-3);margin:0 4px}
.tmv-hero-r{display:flex;align-items:center;gap:16px 24px;flex-wrap:wrap;justify-content:flex-end;flex:0 1 auto}
.tmv-team{display:grid;gap:8px;width:310px;max-width:100%}
.tmv-stack{display:flex;gap:2px;height:9px;border-radius:var(--r-pill);overflow:hidden;background:var(--surface3)}
.tmv-stack i{display:block;height:100%}
.tmv-leg{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:11.5px;font-weight:700;color:var(--text-3)}
.tmv-leg span{display:inline-flex;align-items:center;gap:5px}
.tmv-leg b{font-family:var(--display);font-size:17px;font-weight:700;color:var(--text-1)}
.tmv-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.tmv-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:var(--r-pill);font-size:11px;font-weight:700;white-space:nowrap}
.tmv-seg{display:flex;gap:3px;padding:4px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:var(--shadow-inset);width:fit-content;max-width:100%;overflow-x:auto;scrollbar-width:none}
.tmv-seg::-webkit-scrollbar{display:none}
.tmv-seg>button{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border:none;border-radius:var(--r-pill);background:transparent;color:var(--text-3);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0}
.tmv-seg>button:hover{color:var(--text-1)}
.tmv-seg>button.on{background:var(--surface);color:var(--text-1);box-shadow:var(--shadow-sm)}
.tmv-seg.sm>button{padding:6px 13px;font-size:12px}
.tmv-badge{min-width:19px;padding:1px 6px;border-radius:var(--r-pill);background:var(--tint-amber-bg2);color:var(--tint-amber-tx);font-family:var(--mono);font-size:10.5px;font-weight:800;text-align:center}
.tmv-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.tmv-pick{position:relative;margin-left:auto}
.tmv-pick-pop{position:absolute;right:0;top:calc(100% + 6px);z-index:40;width:280px;max-height:360px;overflow:auto;padding:6px;border-radius:var(--r-tile);background:var(--bg);box-shadow:var(--shadow-card),0 18px 40px -14px rgba(15,43,51,.25)}
.tmv-pick-t{font-size:11px;font-weight:700;color:var(--text-3);padding:6px 8px 4px}
.tmv-pick-i{display:flex;align-items:center;gap:10px;width:100%;border:none;background:transparent;padding:7px 8px;border-radius:var(--r-chip);cursor:pointer;font-family:inherit;text-align:left;color:var(--text-1)}
.tmv-pick-i:hover{background:var(--surface2)}
.tmv-pick-i .n{flex:1;min-width:0;font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tmv-pick-i .s{font-size:11px;font-weight:600;color:var(--tint-amber-tx);font-family:var(--mono)}
.tmv-pick-i .s.on{color:var(--text-3)}
.tmv-hd{display:flex;align-items:baseline;gap:6px 10px;flex-wrap:wrap;margin-bottom:12px}
.tmv-hd .t{font-size:14px;font-weight:700;color:var(--text-1)}
.tmv-hd .s{font-size:11.5px;color:var(--text-3)}
.tmv-hd .r{margin-left:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.tmv-ib{width:34px;height:34px;display:grid;place-items:center;border:none;border-radius:var(--r-chip);background:var(--surface2);box-shadow:var(--shadow-sm);color:var(--text-2);cursor:pointer;flex-shrink:0;padding:0}
.tmv-ib:hover{background:var(--surface3);color:var(--text-1)}
.tmv-ib.dngr{color:var(--tint-red-tx2)}
.tmv-ib.xs{width:30px;height:30px}
.tmv-date{font-family:var(--display);font-size:19px;font-weight:700;color:var(--text-1);padding:0 6px;white-space:nowrap;display:inline-block;box-sizing:border-box;min-width:210px;text-align:center}
.tmv-sw{display:inline-block;width:16px;height:8px;border-radius:var(--r-pill)}
.tmv-tl-row{display:grid;grid-template-columns:230px minmax(0,1fr) 112px 72px;grid-template-areas:"who trk tim act";align-items:center;column-gap:16px;padding:9px 0;border-top:1px solid var(--divider)}
.tmv-tl-row.axis{border-top:none;padding:0 0 2px}
.tmv-who{grid-area:who;display:flex;align-items:center;gap:10px;min-width:0}
.tmv-who-n{font-size:13.5px;font-weight:700;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmv-who-s{font-size:11px;color:var(--text-3);display:flex;gap:4px 8px;align-items:center;flex-wrap:wrap;margin-top:1px}
.tmv-trk{grid-area:trk;position:relative;height:26px;border-radius:8px;background:var(--surface2);overflow:visible}
.tmv-axis{grid-area:trk;position:relative;height:16px}
.tmv-axis span{position:absolute;top:0;transform:translateX(-50%);font-family:var(--mono);font-size:10px;font-weight:600;color:var(--text-3)}
.tmv-band{position:absolute;top:0;bottom:0;background:var(--primary-soft)}
.tmv-tick{position:absolute;top:0;bottom:0;width:1px;background:var(--divider)}
.tmv-span{position:absolute;top:6px;bottom:6px;border-radius:var(--r-pill);background:var(--primary);min-width:8px}
.tmv-span.live{background:repeating-linear-gradient(-45deg,var(--primary) 0 5px,var(--primary-bright) 5px 10px)}
.tmv-span.forgot{background:var(--tint-red-tx2)}
.tmv-now{position:absolute;top:-4px;bottom:-4px;width:2px;margin-left:-1px;border-radius:2px;background:var(--tint-red-tx2)}
.tmv-tim{grid-area:tim;text-align:right;line-height:1.35}
.tmv-tim b{display:block;font-family:var(--mono);font-size:12.5px;font-weight:700;color:var(--text-1);white-space:nowrap}
.tmv-tim span{font-size:11px;color:var(--text-3);white-space:nowrap}
.tmv-act{grid-area:act;display:flex;gap:6px;justify-content:flex-end}
.tmv-empty{display:grid;justify-items:center;gap:8px;padding:30px 12px;text-align:center;font-size:13px;color:var(--text-3)}
.tmv-empty i{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:var(--surface2)}
.tmv-people{display:flex;flex-wrap:wrap;gap:8px}
.tmv-person{display:inline-flex;align-items:center;gap:8px;padding:4px 5px 4px 4px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:var(--shadow-sm);font-size:12.5px;font-weight:700;color:var(--text-1)}
.tmv-person>span:last-child:not(.tmv-av){padding-right:8px}
.tmv-person .x{padding:4px 10px;border:none;border-radius:var(--r-pill);background:var(--primary-soft);color:var(--primary-dark);font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer}
.tmv-list{display:grid;gap:9px}
.tmv-grp{display:flex;align-items:baseline;gap:8px;margin:10px 4px 0;font-size:13px;font-weight:700;color:var(--text-1)}
.tmv-grp:first-child{margin-top:0}
.tmv-grp span{font-size:11.5px;font-weight:600;color:var(--text-3)}
.tmv-req{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:0 14px;align-items:center;padding:13px 16px;border-radius:var(--r-tile);background:var(--surface);box-shadow:var(--shadow-sm);cursor:pointer;transition:transform .15s,box-shadow .15s;outline:none}
.tmv-req:hover,.tmv-req:focus-visible{transform:translateY(-2px);box-shadow:var(--hov-sh)}
.tmv-req:active{transform:translateY(0)}
.tmv-req-ic{width:44px;height:44px;border-radius:var(--r-tile);display:grid;place-items:center}
.tmv-req-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14px;font-weight:700;color:var(--text-1)}
.tmv-req-s{margin-top:3px;font-size:12px;color:var(--text-2);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.tmv-req-r{font-size:11.5px;color:var(--text-3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmv-req-amt{display:grid;gap:6px;justify-items:end}
.tmv-req-amt b{font-family:var(--display);font-size:20px;font-weight:700;color:var(--text-1);white-space:nowrap}
.tmv-no{font-family:var(--mono);font-size:10.5px;font-weight:600;color:var(--text-3)}
.tmv-search{display:flex;align-items:center;gap:8px;padding:0 14px;height:40px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:var(--shadow-inset);flex:1 1 220px;max-width:300px}
.tmv-search input{flex:1;min-width:0;border:none !important;background:transparent !important;box-shadow:none !important;outline:none;font-family:inherit;font-size:13px;color:var(--text-1);padding:0}
.tmv-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));padding:8px 4px}
.tmv-stat{padding:8px 20px;border-left:1px solid var(--divider)}
.tmv-stat:first-child{border-left:none}
.tmv-stat .l{font-size:11.5px;font-weight:700;color:var(--text-3)}
.tmv-stat .v{font-family:var(--display);font-size:28px;font-weight:700;line-height:1.25;color:var(--text-1);font-variant-numeric:tabular-nums;white-space:nowrap}
.tmv-stat .v small{font-family:var(--sans);font-size:12px;font-weight:600;color:var(--text-3);margin-left:5px}
.tmv-pp{border-radius:var(--r-tile);background:var(--surface);box-shadow:var(--shadow-sm)}
.tmv-pp.dim{opacity:.6}
.tmv-pp-row{display:grid;grid-template-columns:210px minmax(0,1fr) 170px auto;grid-template-areas:"who heat ot act";align-items:center;gap:10px 20px;padding:13px 16px}
.tmv-heat{grid-area:heat;min-width:0;max-width:560px}
.tmv-heat-g{display:grid;gap:3px;grid-template-columns:repeat(var(--hd,31),minmax(0,1fr))}
.tmv-heat-g i{display:block;height:24px;border-radius:5px;background:color-mix(in srgb,var(--text-3) 20%,transparent)}
.tmv-heat-g i.off{background:color-mix(in srgb,var(--st-design-fg) 34%,transparent)}
.tmv-heat-g i.offw{box-shadow:inset 0 -4px 0 var(--st-design-fg)}
.tmv-heat-g i.forgot{background:var(--tint-red-tx2)}
.tmv-heat-g i.fut{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--text-3) 45%,transparent)}
.tmv-heat-g i.off.fut{background:color-mix(in srgb,var(--st-design-fg) 16%,transparent);box-shadow:none}
.tmv-heat-g i.today{position:relative}
.tmv-heat-g i.today::after{content:"";position:absolute;left:50%;bottom:-7px;width:5px;height:5px;margin-left:-2.5px;border-radius:99px;background:var(--text-1)}
.tmv-heat-ax{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9.5px;color:var(--text-3);margin-top:8px}
.tmv-ot{grid-area:ot;display:grid;gap:3px;font-size:11.5px;color:var(--text-3)}
.tmv-ot b{font-family:var(--display);font-size:16px;font-weight:700;color:var(--text-1);margin-right:3px}
.tmv-pp-act{grid-area:act;display:flex;gap:6px;align-items:center;justify-content:flex-end}
.tmv-pp-more{padding:2px 16px 16px}
.tmv-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;max-width:760px}
.tmv-cal .h{text-align:center;font-size:10.5px;font-weight:700;color:var(--text-3)}
.tmv-cal .d{position:relative;min-width:0;min-height:58px;padding:7px 9px;border-radius:var(--r-chip);background:var(--surface2)}
.tmv-cal .d.on{background:var(--surface);box-shadow:var(--shadow-sm)}
.tmv-cal .d.bad{box-shadow:inset 0 0 0 1px var(--tint-red-bd)}
.tmv-cal .d.off{opacity:.45}
.tmv-cal .d.off.hl{opacity:1}
.tmv-cal .d.pk.off:hover .lab{visibility:hidden}
.tmv-cal .lab{font-size:10.5px;font-weight:700;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmv-cal .d.pk{cursor:pointer;transition:transform .12s,box-shadow .12s,opacity .12s}
.tmv-cal .d.pk:hover{opacity:1;transform:translateY(-2px);box-shadow:var(--hov-sh)}
/* ป้าย "+ ลงแทน" ลอยทับมุมล่าง ไม่ดันความสูงช่อง — เดิมเป็นบรรทัดใหม่ แถวทั้งแถวสูงขึ้น หน้าขยับทั้งหน้าตอนชี้ (ผู้ใช้ทัก ต.ค. 2026) */
.tmv-cal .d.pk.off:hover::after{content:"+ ลงแทน";position:absolute;left:9px;bottom:7px;font-size:10.5px;font-weight:700;color:var(--primary-dark)}
/* แคบ (กว้างของพื้นที่หน้า < 860 ไม่ใช่กว้างจอ — แถบเมนูข้างกินที่ไปแล้ว) ดู useTmNarrow */
.tmv.nw .tmv-hero{padding:16px}
.tmv.nw .tmv-hero-r{justify-content:flex-end;flex:1 1 100%}
.tmv.nw .tmv-team{width:auto;flex:1 1 220px}
.tmv.nw .tmv-big{font-size:26px}
.tmv.nw .tmv-card{padding:14px}
.tmv.nw .tmv-tl-row{grid-template-columns:minmax(0,1fr) auto auto;grid-template-areas:"who tim act" "trk trk trk";row-gap:8px}
.tmv.nw .tmv-tl-row.axis{display:none}
.tmv.nw .tmv-pp-row{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"who act" "heat heat" "ot ot"}
.tmv.nw .tmv-heat{max-width:none}
.tmv-idle{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:12px 16px;border-radius:var(--r-tile);background:var(--surface);box-shadow:var(--shadow-sm);font-size:12.5px;color:var(--text-2)}
.tmv-idle b{font-size:12px;color:var(--text-3);font-weight:700}
.tmv.nw .tmv-ot{grid-auto-flow:column;justify-content:start;gap:14px}
.tmv.nw .tmv-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
.tmv.nw .tmv-stat{padding:8px 12px}
.tmv.nw .tmv-stat:nth-child(odd){border-left:none}
.tmv.nw .tmv-req{grid-template-columns:40px minmax(0,1fr) auto;gap:0 12px;padding:12px 13px}
.tmv.nw .tmv-req-ic{width:40px;height:40px}
.tmv.nw .tmv-req-amt b{font-size:17px}
.tmv.nw .tmv-search{max-width:none}
.tmv-seg .sh{display:none}
/* มือถือ (<520 วัดจากกล่องจริง) — ผู้ใช้สั่ง ต.ค. 2026: แท็บล้นจอ · หัวบนกินที่ · แถวเลือกวันกระจัดกระจาย */
.tmv.xs .tmv-seg{width:100%;box-sizing:border-box}
.tmv.xs .tmv-seg>button{flex:1 1 0;justify-content:center;padding:9px 4px;gap:5px;font-size:12.5px}
.tmv.xs .tmv-seg>button svg{display:none}
.tmv.xs .tmv-seg .lg{display:none}
.tmv.xs .tmv-seg .sh{display:inline}
.tmv.xs .tmv-hero{padding:14px 16px;gap:12px}
.tmv.xs .tmv-hero-ic{width:40px;height:40px;align-self:flex-start}
.tmv.xs .tmv-hero-ic svg{width:20px;height:20px}
.tmv.xs .tmv-hero-me{gap:12px;flex-basis:100%}
.tmv.xs .tmv-big{font-size:23px}
.tmv.xs .tmv-hero-r{gap:12px}
.tmv.xs .tmv-team{flex:1 1 100%}
.tmv.xs .tmv-hero-r>.btn{flex:1 1 100%;justify-content:center}
.tmv.xs .tmv-bar{gap:8px}
.tmv.xs .tmv-date{flex:1 1 calc(100% - 100px);min-width:0;font-size:17px}
.tmv.xs .tmv-bar>input{flex:1 1 120px;min-width:0}
.tmv.xs .tmv-bar-off{display:none}
.tmv.xs .tmv-pick{margin-left:0}
@media (prefers-reduced-motion:reduce){.tmv-req:hover,.tmv-req:focus-visible{transform:none}}`;

const tmMinOf = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || "")); return m ? +m[1] * 60 + +m[2] : null; };
const tmHrs = (m) => (!m ? "0" : (Math.round((m / 60) * 10) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 }));

/* การ์ดใหญ่บนพื้นหน้า — เงา inline เพื่อให้กฎ backdrop-filter ของธีมกระจกจับได้ */
function TmCard({ children, className, style }) {
  return <div className={"tmv-card" + (className ? " " + className : "")} style={Object.assign({ boxShadow: "var(--shadow-card)" }, style)}>{children}</div>;
}

/* รูปโปรไฟล์ หรือวงกลมอักษรแรก — สีวงกลมเลือกจากรหัสผู้ใช้ จึงเป็นสีเดิมของคนนั้นทุกหน้า */
const TM_AV_K = ["takeoff", "design", "install", "done", "queue"];
function TmAvatar({ uid, name, size }) {
  const s = size || 32;
  const img = window.useUserAvatar ? window.useUserAvatar(uid).avatar : null;
  const k = TM_AV_K[Array.from(String(uid || name || "")).reduce((a, c) => a + c.charCodeAt(0), 0) % TM_AV_K.length];
  const ini = (String(name || "?").replace(/^(นาย|นางสาว|นาง|คุณ)\s*/, "").replace(/^[เแโใไ]/, "").trim().charAt(0) || "?").toUpperCase();
  return img
    ? <img className="tmv-av" src={img} alt="" style={{ width: s, height: s, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <span className="tmv-av" style={{ width: s, height: s, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center",
        background: "var(--st-" + k + "-soft)", color: "var(--st-" + k + "-fg)", fontSize: Math.round(s * 0.42), fontWeight: 700 }}>{ini}</span>;
}

/* สวิตช์แบบหลุม — ตัวที่เลือกนูนขึ้นมา */
function TmSeg({ items, value, onChange, sm }) {
  return (
    <div className={"tmv-seg" + (sm ? " sm" : "")} role="tablist">
      {items.map((it) => (
        <button key={it.k} role="tab" aria-selected={value === it.k} className={value === it.k ? "on" : ""} onClick={() => onChange(it.k)}>
          {it.ic && <Icon name={it.ic} size={sm ? 13 : 15} color={value === it.k ? "var(--primary)" : "currentColor"} />}
          {it.sh ? <React.Fragment><span className="lg">{it.th}</span><span className="sh">{it.sh}</span></React.Fragment> : it.th}
          {it.n > 0 && <span className="tmv-badge">{it.n}</span>}
        </button>
      ))}
    </div>
  );
}

/* คำอธิบายยาว ๆ พับไว้ — ยังอ่านได้เมื่ออยากรู้ แต่ไม่กินจอทุกครั้ง */
function TmHelp({ children }) {
  return (
    <details style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.7, padding: "0 4px" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700, color: "var(--text-2)", width: "fit-content" }}>อ่านวิธีคิด / หมายเหตุ</summary>
      <div style={{ marginTop: 6 }}>{children}</div>
    </details>
  );
}

/* ตัวเลขสั้นบรรทัดเดียว (ของชุดก่อน — ยังเก็บไว้ให้หน้าอื่นเรียกได้) */
function TmFacts({ items }) {
  return (
    <div className="tmv-leg">
      {items.filter(Boolean).map((it, i) => <span key={i} title={it.hint || ""}>{it.label} <b style={{ color: it.color || undefined }}>{it.value}</b> {it.unit}</span>)}
    </div>
  );
}

/* ใครมา/ไม่มา/ลา ของวันหนึ่ง — ใช้ทั้งแถบบนสุดและแท็บวันนี้ */
function useTmDayStatus(date, cfg, users) {
  const lvRows = window.useLeaves().rows;
  const lvTypes = window.useLeaveTypes().types;
  const onLeave = React.useMemo(() => window.lvOnDay(lvRows, date), [lvRows, date]);
  const day = window.useAttendDay(date);
  const workday = window.tmIsWorkday(date, cfg);
  /* บัญชีระบบ ADMIN ไม่ใช่คนทำงาน (ผู้ใช้สั่ง) — ใบที่ปั๊มไว้ไม่ขึ้นในแผ่นเวลา */
  const rows = React.useMemo(() => (day.rows || []).filter((r) => !window.tmIsSysAcct({ id: r.userId })), [day.rows]);
  /* คนที่ "ควรจะมา" แต่ไม่มีใบเลย — สำคัญกว่าคนที่มาแล้ว เพราะช่องว่างมองไม่เห็นด้วยตา */
  const missing = React.useMemo(() => {
    if (!workday) return [];
    const have = {}; rows.forEach((r) => { have[r.userId] = 1; });
    return (users || []).filter((u) => u && u.active !== false && !window.tmIsSysAcct(u) && window.can(window.userRoles(u), "attend") && !have[u.id] && !onLeave[u.id]);
  }, [rows, users, workday, onLeave]);
  const leaving = (users || []).filter((u) => u && onLeave[u.id] && !rows.some((r) => r.userId === u.id));
  return { rows, loading: day.loading, missing, leaving, onLeave, lvTypes, workday };
}

/* พื้นที่หน้าแคบไหม — วัดกล่องจริง ไม่ใช่กว้างจอ (จอ 1100 ที่มีแถบเมนูข้างเหลือที่จริงไม่ถึง 860)
   ไม่ใช้ container query เพราะกล่องที่เป็น container อาจกลายเป็นกรอบของโมดัล position:fixed ข้างใน */
function useTmNarrow() {
  /* callback ref — กล่องอาจโผล่ทีหลัง (หน้าโหลดก่อน) useRef + effect ครั้งเดียวจะพลาดไม่ได้วัดเลย */
  const [el, ref] = React.useState(null);
  const [w, setW] = React.useState(1000);
  React.useEffect(() => {
    if (!el) return;
    setW(el.clientWidth);   // วัดทันทีหนึ่งครั้ง ไม่รอ ResizeObserver (บางที่ยิงช้า/ไม่ยิงตอนหน้าไม่ได้แสดง)
    if (!window.ResizeObserver) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [w < 860, ref, w < 520];   // nw = จอแคบ · xs = มือถือ
}

/* นาฬิกาเดินทุกนาที — ให้แถบของคนที่ยังทำงานอยู่ยืดตามเวลาจริง */
function useTmNow(on) {
  const [, setT] = React.useState(0);
  React.useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setT((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, [on]);
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/* ช่วงแกนเวลา — ครอบเวลางานปกติและทุกแถบ ปัดเป็นชั่วโมงเต็มแล้วเผื่อข้างละชั่วโมง */
function tmTlRange(items, cfg, nowM) {
  const w = window.tmDayWindow(null, cfg);
  let lo = w.startMins, hi = w.endMins;
  items.forEach((it) => {
    if (it.a != null) lo = Math.min(lo, it.a);
    if (it.b != null) hi = Math.max(hi, it.b);
    if (it.live && nowM != null) hi = Math.max(hi, nowM);
  });
  lo = Math.max(0, Math.floor(lo / 60) * 60 - 60);
  hi = Math.min(30 * 60, Math.ceil(hi / 60) * 60 + 60);
  return { lo, hi, band: [w.startMins, w.endMins] };
}

/* เส้นเวลา — แถวละคน (หรือแถวละวัน) แถบเขียว = ทำงาน · ลาย = ยังไม่ออก · แดง = ลืมกดออก · พื้นจาง = เวลางานปกติ */
function TmTimeline({ items, range, nowM, band }) {
  const lo = range.lo, hi = range.hi, span = Math.max(1, hi - lo);
  const pct = (m) => Math.max(0, Math.min(100, ((m - lo) / span) * 100));
  const step = span > 12 * 60 ? 120 : 60;
  const ticks = [];
  for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) ticks.push(m);
  const lab = (m) => String(Math.floor(m / 60) % 24).padStart(2, "0");
  return (
    <div>
      <div className="tmv-tl-row axis">
        <div className="tmv-axis">{ticks.map((m) => <span key={m} style={{ left: pct(m) + "%" }}>{lab(m)}</span>)}</div>
      </div>
      {items.map((it) => (
        <div key={it.key} className="tmv-tl-row">
          <div className="tmv-who">{it.who}</div>
          <div className="tmv-trk" title={it.title || ""}>
            {band && <i className="tmv-band" style={{ left: pct(band[0]) + "%", width: Math.max(0, pct(band[1]) - pct(band[0])) + "%" }} />}
            {ticks.map((m) => <i key={m} className="tmv-tick" style={{ left: pct(m) + "%" }} />)}
            {it.trk}
            {it.a != null && (
              <i className={"tmv-span" + (it.live ? " live" : it.forgot ? " forgot" : "")}
                style={{ left: pct(it.a) + "%", width: it.b != null ? Math.max(0, pct(it.b) - pct(it.a)) + "%" : 8 }} />
            )}
            {it.now && nowM != null && nowM > lo && nowM < hi && <i className="tmv-now" style={{ left: pct(nowM) + "%" }} />}
          </div>
          <div className="tmv-tim">{it.tim}</div>
          <div className="tmv-act">{it.act}</div>
        </div>
      ))}
    </div>
  );
}

function TmLegend({ items }) {
  return (
    <span className="tmv-leg" style={{ fontWeight: 600, fontSize: 11 }}>
      {items.map(([bg, th, sh]) => <span key={th}><i className="tmv-sw" style={{ background: bg, boxShadow: sh || undefined }} />{th}</span>)}
    </span>
  );
}
const TM_LEG = [["var(--primary-soft)", "เวลางานปกติ"], ["var(--primary)", "ทำงาน"],
  ["repeating-linear-gradient(-45deg,var(--primary) 0 3px,var(--primary-bright) 3px 6px)", "ยังไม่ออก"], ["var(--tint-red-tx2)", "ลืมกดออก"]];

function TmEmpty({ icon, tone, children }) {
  return <div className="tmv-empty"><i style={tone ? { background: "var(--st-design-soft)" } : undefined}><Icon name={icon || "clock"} size={22} color={tone || "var(--text-3)"} /></i>{children}</div>;
}

/* วันหยุด → ข้อความที่โชว์ "วันหยุด · วันปิยมหาราช" / "วันหยุด · วันเสาร์" · วันทำงาน = ""
   (ผู้ใช้สั่ง ต.ค. 2026: วันหยุดต้องระบุให้เห็น) — สีม่วง --st-design ตรงกับช่องวันหยุดในแถบสีรายวัน */
const TM_WD_FULL = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
function tmOffTH(d, cfg) {
  if (window.tmIsWorkday(d, cfg)) return "";
  const n = window.tmWhNorm(cfg).holidays[String(d || "").slice(0, 10)];
  return "วันหยุด · " + (n || TM_WD_FULL[tmWdOf(d)]);
}
const TM_OFF_PILL = { background: "var(--st-design-soft)", color: "var(--st-design-fg)" };

/* ── แถบบนสุด ── */
function TmHero({ me, cfg, users, canAll, otMonthMins, canOt, onNewOt }) {
  const t = me.today;
  const inHM = t && t.in && t.in.hm, outHM = t && t.out && t.out.hm;
  const offTH = tmOffTH(window.drToday(), cfg);
  const state = !inHM ? (offTH ? "off" : "none") : outHM ? "done" : "live";
  const ST = {
    off: { th: offTH, bg: TM_OFF_PILL.background, fg: TM_OFF_PILL.color, ic: "calendar" },
    none: { th: "ยังไม่ได้ลงเวลา", bg: "var(--tint-amber-bg2)", fg: "var(--tint-amber-tx)", ic: "clock" },
    live: { th: "กำลังทำงาน", bg: "var(--primary-soft)", fg: "var(--primary-dark)", ic: "clock" },
    done: { th: "ออกงานแล้ว", bg: "var(--surface2)", fg: "var(--text-2)", ic: "check" },
  }[state];
  return (
    <TmCard className="tmv-hero">
      <div className="tmv-hero-me">
        <div className="tmv-hero-ic" style={{ background: ST.bg }}><Icon name={ST.ic} size={26} color={ST.fg} sw={2} /></div>
        <div style={{ minWidth: 0 }}>
          <div className="tmv-k">วันนี้ของฉัน · {window.drDateTH(window.drToday(), true)}</div>
          <div className="tmv-big">
            {inHM ? <React.Fragment>{inHM}<small>→</small>{outHM || <small style={{ margin: 0 }}>ยังไม่ออก</small>}</React.Fragment>
              : <span style={{ fontSize: 21, color: state === "off" ? "var(--st-design-fg)" : "var(--text-2)" }}>{state === "off" ? "วันนี้วันหยุด" : "ยังไม่ได้ลงเวลา"}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 3 }}>
            <span className="tmv-pill" style={{ background: ST.bg, color: ST.fg }}>{ST.th}</span>
            {offTH && state !== "off" && <span className="tmv-pill" style={TM_OFF_PILL}>{offTH}</span>}
            <span className="tmv-k" style={{ fontWeight: 600 }}>
              {state === "off" ? "ถ้ามาทำงานให้ลงเวลาตามปกติ" : state === "none" ? "ลงเวลาจากแอปในไลน์" : state === "done" ? "ทำงาน " + window.tmDur(window.tmWorkedMins(t, cfg)) : "เข้างานแล้ว"}
            </span>
            <span className="tmv-k" style={{ fontWeight: 600 }}>· OT อนุมัติเดือนนี้ <b style={{ color: "var(--text-1)" }}>{otMonthMins ? window.tmDur(otMonthMins) : "—"}</b></span>
          </div>
        </div>
      </div>
      <div className="tmv-hero-r">
        {canAll && <TmTeamToday cfg={cfg} users={users} />}
        <button className="btn btn-pri" onClick={onNewOt} disabled={!canOt}>
          <Icon name="plus" size={15} color="#fff" sw={2.2} /> เปิดใบ OT
        </button>
      </div>
    </TmCard>
  );
}

/* ทีมวันนี้ — แถบสีแบ่งสัดส่วน ทำงานอยู่ / ออกแล้ว / ลา / ยังไม่ลง */
function TmTeamToday({ cfg, users }) {
  const st = useTmDayStatus(window.drToday(), cfg, users);
  const live = st.rows.filter((r) => r.in && !r.out).length;
  const out = st.rows.filter((r) => r.out).length;
  const seg = [
    [live, "var(--primary)", "ทำงานอยู่"],
    [out, "var(--st-takeoff-fg)", "ออกแล้ว"],
    [st.leaving.length, "var(--st-design-fg)", "ลา"],
    [st.missing.length, "var(--st-queue-fg)", "ยังไม่ลง"],
  ];
  const tot = seg.reduce((a, s) => a + s[0], 0);
  return (
    <div className="tmv-team">
      <div className="tmv-k">ทีมวันนี้ · ลงเวลาแล้ว {st.rows.length}{tot ? " จาก " + (tot - st.leaving.length) : ""} คน</div>
      <div className="tmv-stack">
        {seg.filter((s) => s[0] > 0).map((s) => <i key={s[2]} style={{ flex: s[0], background: s[1] }} />)}
      </div>
      <div className="tmv-leg">
        {seg.filter((s) => s[0] > 0 || s[2] === "ทำงานอยู่").map((s) => (
          <span key={s[2]}><i className="tmv-dot" style={{ background: s[1] }} /><b>{s[0]}</b>{s[2]}</span>
        ))}
      </div>
    </div>
  );
}

/* ── แท็บวันนี้ (คนที่ดูได้ทุกคน) ── */
/* หน้าต่างแอดมินแก้เวลา / ลงเวลาแทน — ใช้ทั้งแท็บวันนี้ และกดช่องในปฏิทินรายวันของแท็บสรุปเดือน (ผู้ใช้สั่ง ต.ค. 2026)
   เก็บเวลาเดิม + ชื่อคนแก้ไว้ในใบ (admin.setTimes) · ไม่มีช่องเหตุผลแล้ว (ผู้ใช้สั่ง ต.ค. 2026) */
function tmEdOf(users, cfg, uid, nm, date, inHM, outHM) {
  const u = (users || []).find((x) => x && x.id === uid) || { id: uid, name: nm };
  const c = window.tmWhNorm(cfg);
  return { user: u, date: date, inHM: inHM || c.startEarly, outHM: outHM != null ? outHM : c.end, isNew: !inHM };
}
function TmTimeEdit({ ed, cfg, currentUser, onClose, onSaved }) {
  const admin = window.useAttendAdmin(currentUser);
  const [inHM, setIn] = React.useState(ed.inHM);
  const [outHM, setOut] = React.useState(ed.outHM);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const save = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    const res = await admin.setTimes(ed.user, ed.date, inHM, outHM, "", cfg).catch((e) => ({ ok: false, why: String(e && e.message || e) }));
    if (!res.ok) { setBusy(false); setErr(res.why); return; }
    onSaved(inHM + " – " + (outHM || "ยังไม่ออก"));
  };
  const offTH = tmOffTH(ed.date, cfg);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(15,23,42,.45)", display: "grid", placeItems: "center", padding: 18 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div style={{ width: "min(420px,100%)", background: "var(--bg)", boxShadow: "var(--shadow-modal)", borderRadius: "var(--r-card)", padding: 20, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TmAvatar uid={ed.user.id} name={ed.user.name} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)" }}>{ed.user.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>{ed.isNew ? "ลงเวลาแทน" : "แก้เวลาลงงาน"} · {window.drDateTH(ed.date, true)}</div>
          </div>
          {offTH && <span className="tmv-pill" style={Object.assign({ marginLeft: "auto" }, TM_OFF_PILL)}>{offTH}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", gap: 9, alignItems: "end" }}>
          <label style={TM_LB}><span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>เข้างาน</span>
            <window.PgTime value={inHM} ariaLabel="เข้างาน" onChange={setIn} style={TM_IN_W} /></label>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-3)", paddingBottom: 10 }}>ถึง</span>
          <label style={TM_LB}><span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)" }}>ออกงาน (ว่าง = ยังไม่ออก)</span>
            <window.PgTime value={outHM} ariaLabel="ออกงาน" onChange={setOut} style={TM_IN_W} /></label>
        </div>
        {err && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tint-red-tx2)" }}>{err}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn" disabled={busy} onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-pri" disabled={busy || !inHM} onClick={save}>{busy ? "กำลังบันทึก…" : "บันทึกเวลา"}</button>
        </div>
      </div>
    </div>
  );
}

/* ปุ่ม "+ ลงเวลาแทน" + รายชื่อแบบป๊อปอัป (แทน <select> เดิม — ผู้ใช้: ดรอปดาวน์ไม่สวย) */
function TmPickPerson({ users, rows, onPick }) {
  const [open, setOpen] = React.useState(false);
  const box = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <div ref={box} className="tmv-pick">
      <button className="btn btn-soft" onClick={() => setOpen(!open)}>
        <Icon name="plus" size={14} sw={2.2} /> ลงเวลาแทน <Icon name="chevronDown" size={14} />
      </button>
      {open && (
        <div className="tmv-pick-pop">
          <div className="tmv-pick-t">เลือกคนที่จะลงเวลาให้</div>
          {users.map((u) => {
            const r = rows.find((x) => x.userId === u.id);
            return (
              <button key={u.id} className="tmv-pick-i" onClick={() => { setOpen(false); onPick(u); }}>
                <TmAvatar uid={u.id} name={u.name} size={28} />
                <span className="n">{u.name}</span>
                <span className={"s" + (r ? " on" : "")}>{r ? (r.in || "") + (r.out ? "–" + r.out : " · ยังไม่ออก") : "ยังไม่ลง"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TmDaySheet({ date, setDate, cfg, users, currentUser }) {
  const st = useTmDayStatus(date, cfg, users);
  const admin = window.useAttendAdmin(currentUser);
  /* ข้อความผลลัพธ์ของการลบ — ลบแล้วแถวหายไปเฉย ๆ อ่านเหมือนกดพลาดแล้วจอเพี้ยน */
  const [msg, setMsg] = React.useState("");
  const today = window.drToday();
  const isToday = date === today;
  const nowM = useTmNow(isToday);

  /* ชื่อจากทะเบียนผู้ใช้ ไม่ใช่ชื่อที่ถ่ายสำเนาไว้ในใบตอนปั๊มเวลา — ดู tmNameOf */
  const nameOf = (r) => window.tmNameOf(users, r.userId, r.name);

  /* พิกัด — สี่สภาพที่ต้องแยกให้ขาด: ไม่มีพิกัด · ใบเก่าไม่มีตัวเลข · ยังไม่ตั้งพิกัดออฟฟิศ · บอกระยะได้
     ระยะเป็นข้อมูลให้คนอ่านตัดสิน ไม่ได้แปลว่าใบนั้นใช้ไม่ได้ */
  const gpsCell = (r) => {
    /* แอดมินแก้/ลงเวลาแทน — ไม่เตือนไม่มีพิกัด (ผู้ใช้ 2026-10-16) */
    if (!r.gps && r.fix) return null;
    /* แอดมินลงแทน = พิกัดออฟฟิศ — โชว์เขียว "ถึงออฟฟิศ" เหมือนคนอื่น (ผู้ใช้สั่ง) แยกได้จาก title */
    if (r.geoBy === "admin") return <a href={window.tmGpsUrl(r)} target="_blank" rel="noreferrer" title="พิกัดออฟฟิศ — แอดมินลงเวลาแทน"
      style={{ fontWeight: 700, textDecoration: "none", color: "var(--tint-ok-tx)" }}>ถึงออฟฟิศ</a>;
    if (!r.gps) return <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}>ไม่มีพิกัด</span>;
    const ok = <span style={{ color: "var(--tint-ok-tx)", fontWeight: 700 }}>มีพิกัด</span>;
    if (r.lat == null || r.lng == null) return ok;
    const d = window.tmOfficeDist(r, cfg);
    const link = (kid) => (
      <a href={window.tmGpsUrl(r)} target="_blank" rel="noreferrer" title={"พิกัดตอนเข้างาน " + window.tmGpsTH(r)}
        style={{ fontWeight: 700, textDecoration: "none" }}>{kid}</a>
    );
    if (d == null) return link(ok);
    const near = d <= window.tmWhNorm(cfg).office.radius;
    const office = r.place === "office";
    /* คนที่กด "ออฟฟิศ" แต่อยู่นอกรัศมี คือเรื่องเดียวที่ควรสะดุดตา */
    const color = !office ? "var(--text-3)" : near ? "var(--tint-ok-tx)" : "var(--tint-red-tx2)";
    return link(<span style={{ color: color }}>{office ? (near ? "ถึงออฟฟิศ" : "ห่างออฟฟิศ " + window.tmDistTH(d)) : "ห่างออฟฟิศ " + window.tmDistTH(d)}</span>);
  };

  const del = async (r) => {
    const ok = await window.askConfirm({
      title: "ลบใบลงเวลาของ " + nameOf(r) + "?",
      body: window.drDateTH(date, true) + " · " + (r.in || "—") + " – " + (r.out || "—") +
        " · " + window.tmDur(r.mins) + "\nลบแล้วคนคนนี้กดลงเวลาของวันนี้ใหม่ได้ตั้งแต่ต้น",
      ok: "ลบใบนี้", danger: true, icon: "trash",
    });
    if (!ok) return;
    const res = await admin.removeDay(r.userId, date);
    setMsg(res.ok ? "ลบใบลงเวลาของ " + nameOf(r) + " แล้ว" : "ลบไม่สำเร็จ — " + res.why);
  };
  /* แอดมินแก้เวลา / ลงเวลาแทนคนลืมลง — เก็บเวลาเดิม + ชื่อคนแก้ไว้ในใบ */
  const isAdmin = window.usePgAdmin();
  const [ed, setEd] = React.useState(null);   // { user, date, inHM, outHM } → TmTimeEdit
  const openEd = (uid, nm, inHM, outHM) => setEd(tmEdOf(users, cfg, uid, nm, date, inHM, outHM));
  const workday = st.workday;
  const offTH = tmOffTH(date, cfg);

  const rows = st.rows.slice().sort((a, b) => String(a.in || "99").localeCompare(String(b.in || "99")));
  const totalMins = rows.reduce((a, r) => a + (+r.mins || 0), 0);
  const items = rows.map((r) => {
    const a = tmMinOf(r.in);
    let b = tmMinOf(r.out);
    if (a != null && b != null && b < a) b += 1440;   // OT ข้ามเที่ยงคืน
    const live = !!(isToday && r.in && !r.out);
    const forgot = !!(!isToday && r.in && !r.out);
    if (live) b = Math.max(nowM, a + 5);
    const late = !!(workday && window.tmIsShort(r.in, r.out, r.mins, cfg));   // ไม่ครบเวลา (ไม่มีสายแล้ว)
    /* คนที่กด "ออฟฟิศ" ไม่มีรหัสงานให้แสดง — ช่องว่างเปล่า ๆ อ่านเหมือนลืมกรอก */
    const job = r.place === "office" || (r.fix && !r.jobCode) ? "ออฟฟิศ" : (r.jobCode || "");
    const nm = nameOf(r);
    return {
      key: r.userId, a: a, b: forgot ? null : b, live: live, forgot: forgot, now: isToday,
      title: nm + " · " + (r.in || "—") + " – " + (r.out || (live ? "ยังไม่ออก" : "ลืมกดออก")),
      who: <React.Fragment>
        <TmAvatar uid={r.userId} name={nm} />
        <div style={{ minWidth: 0 }}>
          <div className="tmv-who-n">{nm}</div>
          <div className="tmv-who-s">
            {job && <span style={{ fontFamily: job === "ออฟฟิศ" ? "inherit" : "var(--mono)" }}>{job}</span>}
            {gpsCell(r)}
          </div>
        </div>
      </React.Fragment>,
      tim: <React.Fragment>
        <b>{r.in || "—"} – {r.out || "…"}</b>
        <span style={{ fontWeight: forgot || live || late ? 700 : 500,
          color: forgot ? "var(--tint-red-tx2)" : late ? "var(--tint-amber-tx)" : live ? "var(--primary-dark)" : undefined }}>
          {forgot ? "ลืมกดออก" : live ? "กำลังทำงาน" : window.tmDur(r.mins)}{late ? " · ไม่ครบ" : ""}
        </span>
      </React.Fragment>,
      act: <React.Fragment>
        {isAdmin && <button className="tmv-ib xs" title="แก้เวลาเข้า-ออก" onClick={() => openEd(r.userId, nm, r.in, r.out || "")}><Icon name="pen" size={14} /></button>}
        {/* ลบทั้งใบ — ให้เจ้าตัวกดใหม่จะได้พิกัดกับเวลาจริงติดมาด้วย */}
        <button className="tmv-ib xs dngr" title="ลบใบลงเวลา" onClick={() => del(r)}><Icon name="trash" size={14} /></button>
      </React.Fragment>,
    };
  });
  const range = tmTlRange(items, cfg, isToday ? nowM : null);
  const stillIn = items.filter((x) => x.live).length;
  const forgotN = items.filter((x) => x.forgot).length;
  const attendUsers = (users || []).filter((u) => u && u.active !== false && !window.tmIsSysAcct(u) && window.can(window.userRoles(u), "attend"));

  return (
    <div className="tmv" style={{ gap: 14 }}>
      <div className="tmv-bar">
        <button className="tmv-ib" title="วันก่อนหน้า" onClick={() => setDate(window.drAddDays(date, -1))}><Icon name="chevronLeft" size={16} /></button>
        <span className="tmv-date">{window.drDateTH(date, true)}</span>
        <button className="tmv-ib" title="วันถัดไป" onClick={() => setDate(window.drAddDays(date, 1))}><Icon name="chevronRight" size={16} /></button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value || today)} title="เลือกวัน"
          style={Object.assign({}, TM_IN, { padding: "7px 10px", fontSize: 12.5 })} />
        {!isToday && <button className="btn btn-sm" onClick={() => setDate(today)}>กลับมาวันนี้</button>}
        {offTH && <span className="tmv-pill tmv-bar-off" style={TM_OFF_PILL}><Icon name="calendar" size={12} color="var(--st-design-fg)" sw={2.2} /> {offTH}</span>}
        {/* ลงเวลาแทนคนที่ไม่อยู่ในรายการ (เช่น วันหยุดที่ไม่มีแถว "ยังไม่ลงเวลา") */}
        {isAdmin && (
          <TmPickPerson users={attendUsers} rows={rows} onPick={(u) => {
            const r = rows.find((x) => x.userId === u.id); openEd(u.id, u.name, r ? r.in : "", r ? r.out || "" : null); }} />
        )}
      </div>

      {(st.missing.length > 0 || st.leaving.length > 0) && (
        <TmCard>
          {st.missing.length > 0 && (
            <div>
              <div className="tmv-hd" style={{ marginBottom: 10 }}>
                <span className="t">ยังไม่ลงเวลา</span>
                <span className="tmv-badge" style={{ alignSelf: "center" }}>{st.missing.length}</span>
                <span className="s">ทักถามก่อน{isAdmin ? " หรือกดลงเวลาแทน" : ""}</span>
              </div>
              <div className="tmv-people">
                {st.missing.map((u) => (
                  <span key={u.id} className="tmv-person">
                    <TmAvatar uid={u.id} name={u.name} size={26} />
                    <span style={{ paddingRight: isAdmin ? 0 : 8 }}>{u.name}</span>
                    {isAdmin && <button className="x" onClick={() => openEd(u.id, u.name, "", null)}>ลงแทน</button>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {st.leaving.length > 0 && (
            <div style={{ marginTop: st.missing.length ? 16 : 0 }}>
              <div className="tmv-hd" style={{ marginBottom: 10 }}><span className="t">ลาวันนี้</span><span className="s">{st.leaving.length} คน</span></div>
              <div className="tmv-people">
                {st.leaving.map((u) => {
                  const lr = st.onLeave[u.id], lt = window.lvTypeOf(st.lvTypes, lr.type);
                  return (
                    <span key={u.id} className="tmv-person" title={lr.no + " · " + window.lvRangeTH(lr)}>
                      <TmAvatar uid={u.id} name={u.name} size={26} />
                      {u.name}
                      <span className="tmv-pill" style={{ background: lt.color + "1A", color: lt.color }}>{lt.th}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </TmCard>
      )}

      <TmCard>
        <div className="tmv-hd">
          <span className="t">เข้า-ออกงาน</span>
          <span className="s">{rows.length} คน · รวม {window.tmDur(totalMins)}
            {stillIn ? " · ยังทำงานอยู่ " + stillIn : ""}{forgotN ? " · ลืมกดออก " + forgotN : ""}</span>
          {offTH && <span className="tmv-pill" style={TM_OFF_PILL}>{offTH}</span>}
          <span className="r"><TmLegend items={TM_LEG} /></span>
        </div>
        {st.loading ? <TmEmpty>กำลังโหลด…</TmEmpty>
          : rows.length === 0 ? (offTH
            ? <TmEmpty icon="calendar" tone="var(--st-design-fg)"><b style={{ fontSize: 14, color: "var(--st-design-fg)" }}>{offTH}</b><span style={{ fontSize: 11.5 }}>ไม่มีใครมาทำงาน — ถ้ามีคนมาทำงานวันหยุดจะขึ้นที่นี่</span></TmEmpty>
            : <TmEmpty>ยังไม่มีใครลงเวลาในวันนี้<br /><span style={{ fontSize: 11.5 }}>ช่างลงเวลาเข้า-ออกจากแอปในไลน์</span></TmEmpty>)
          : <TmTimeline items={items} range={range} nowM={isToday ? nowM : null} band={workday ? range.band : null} />}
      </TmCard>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", padding: "0 4px" }}>{msg}</div>}

      {ed && <TmTimeEdit ed={ed} cfg={cfg} currentUser={currentUser} onClose={() => setEd(null)}
        onSaved={(t) => { setMsg("แก้เวลาของ " + (ed.user.name || "") + " แล้ว · " + t); setEd(null); }} />}

    </div>
  );
}

/* เวลาของตัวเอง — สำหรับคนที่ไม่มีสิทธิ์ดูของทุกคน (ทุกคนต้องตรวจเวลาตัวเองย้อนหลังได้) */
function TmMyDays({ rows, cfg }) {
  const today = window.drToday();
  const nowM = useTmNow(true);
  const items = (rows || []).map((r) => {
    const inHM = r.in && r.in.hm, outHM = r.out && r.out.hm;
    const a = tmMinOf(inHM);
    let b = tmMinOf(outHM);
    if (a != null && b != null && b < a) b += 1440;
    const live = !!(r.date === today && inHM && !outHM);
    const forgot = !!(r.date !== today && inHM && !outHM);
    if (live) b = Math.max(nowM, a + 5);
    const wd = TM_WD_TH[tmWdOf(r.date)];
    const offTH = tmOffTH(r.date, cfg);
    return {
      key: r.date, a: a, b: forgot ? null : b, live: live, forgot: forgot, now: r.date === today,
      who: <React.Fragment>
        <span style={{ width: 38, height: 38, borderRadius: "var(--r-chip)", background: offTH ? "var(--st-design-soft)" : "var(--surface2)", display: "grid", placeItems: "center", flexShrink: 0, lineHeight: 1.05 }}>
          <span style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontSize: 9.5, fontWeight: 700, color: offTH ? "var(--st-design-fg)" : "var(--text-3)" }}>{wd}</span>
            <span style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: offTH ? "var(--st-design-fg)" : "var(--text-1)" }}>{+String(r.date).slice(8)}</span>
          </span>
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="tmv-who-n">{window.drDateTH(r.date)}</div>
          <div className="tmv-who-s">
            {offTH ? <span style={{ color: "var(--st-design-fg)", fontWeight: 700 }}>{offTH}</span> : null}
            {r.jobCode ? <span style={{ fontFamily: "var(--mono)" }}>{r.jobCode}</span> : null}
            {!(r.in && r.in.lat) && <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}>ไม่มีพิกัด</span>}
          </div>
        </div>
      </React.Fragment>,
      tim: <React.Fragment>
        <b>{inHM || "—"} – {outHM || "…"}</b>
        <span style={{ fontWeight: forgot || live ? 700 : 500, color: forgot ? "var(--tint-red-tx2)" : live ? "var(--primary-dark)" : undefined }}>
          {forgot ? "ลืมกดออก" : live ? "กำลังทำงาน" : window.tmDur(window.tmWorkedMins(r, cfg))}</span>
      </React.Fragment>,
    };
  });
  const range = tmTlRange(items, cfg, nowM);
  return (
    <TmCard>
      <div className="tmv-hd">
        <span className="t">เวลาของฉัน</span><span className="s">ย้อนหลัง 30 วัน</span>
        <span className="r"><TmLegend items={TM_LEG} /></span>
      </div>
      {items.length === 0
        ? <TmEmpty>ยังไม่มีประวัติการลงเวลา<br /><span style={{ fontSize: 11.5 }}>ลงเวลาได้จากแอปในไลน์</span></TmEmpty>
        : <TmTimeline items={items} range={range} nowM={nowM} band={range.band} />}
    </TmCard>
  );
}

/* ── การ์ดคำขอหนึ่งใบ (OT หรือ ลา) ── */
function TmReqCard({ x, users, lvTypes, onOpen, onApprove }) {
  const r = x.r;
  const nm = window.tmNameOf(users, r.userId, r.userName);
  let color, icon, title, amt, line;
  if (x.t === "ot") {
    const k = window.tmOtKindOf(r.kind);
    color = k.color; icon = "clock"; title = "OT · " + k.th; amt = window.tmDur(r.mins);
    line = window.drDateTH(r.date) + " · " + (r.from || "") + "–" + (r.to || "") + (r.jobCode ? " · " + r.jobCode : "");
  } else {
    const lt = window.lvTypeOf(lvTypes, r.type);
    color = lt.color; icon = "calendar"; title = lt.th; amt = window.lvDaysTH(r.days);
    line = window.lvRangeTH(r);
  }
  return (
    <div className="tmv-req" role="button" tabIndex={0} onClick={() => onOpen(x)}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(x); }}>
      <div className="tmv-req-ic" style={{ background: color + "1A" }}><Icon name={icon} size={20} color={color} sw={2} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="tmv-req-t">{title}<TmPill s={r.status} size="sm" /><span className="tmv-no">{r.no}</span></div>
        <div className="tmv-req-s">
          <TmAvatar uid={r.userId} name={nm} size={20} />
          <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{nm}</span>
          <span style={{ color: "var(--text-3)" }}>·</span>
          <span>{line}</span>
        </div>
        {r.reason && String(r.reason).trim() !== "-" ? <div className="tmv-req-r">{r.reason}</div> : null}
      </div>
      <div className="tmv-req-amt">
        <b>{amt}</b>
        {onApprove && (
          <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); onApprove(x); }}>
            <Icon name="check" size={13} sw={2.4} /> อนุมัติ
          </button>
        )}
      </div>
    </div>
  );
}

/* ── แท็บคำขอ ── ใบ OT กับใบลารวมเป็นรายการเดียว แบ่งรายเดือน */
function TmRequests({ users, role, currentUser, otVisible, lv, lvTypes, lvQuota, onOpenOt, onOpenLv, otWaiting, lvWaiting, onApprove }) {
  const uid = (currentUser || {}).id || null;
  const canApprove = window.tmCanOtApprove(role) || window.lvCanApprove(role);
  const canAll = canApprove || window.tmCanAttendAll(role);
  const [scope, setScope] = React.useState(() => (otWaiting.length + lvWaiting.length > 0 ? "inbox" : "mine"));
  const [kind, setKind] = React.useState("all");
  const [q, setQ] = React.useState("");

  const lvVis = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role), [lv.rows, currentUser, role]);
  const year = +String(window.drToday()).slice(0, 4);
  const myBal = React.useMemo(() => window.lvBalance(lv.rows, lvQuota.map, uid, year, lvTypes)
    .filter((b) => b.quota !== 0 || b.used || b.pending), [lv.rows, lvQuota.map, uid, year, lvTypes]);

  const list = React.useMemo(() => {
    const pickOt = scope === "inbox" ? otWaiting : scope === "mine" ? otVisible.filter((r) => r.userId === uid) : otVisible;
    const pickLv = scope === "inbox" ? lvWaiting : scope === "mine" ? lvVis.filter((r) => r.userId === uid) : lvVis;
    let out = [];
    if (kind !== "lv") out = out.concat(pickOt.map((r) => ({ t: "ot", d: r.date, r: r })));
    if (kind !== "ot") out = out.concat(pickLv.map((r) => ({ t: "lv", d: r.from, r: r })));
    const kw = q.trim().toLowerCase();
    if (kw) out = out.filter((x) => (x.t === "ot"
      ? [x.r.no, x.r.userName, x.r.jobCode, x.r.reason, window.tmOtKindOf(x.r.kind).th]
      : [x.r.no, x.r.userName, x.r.reason, window.lvTypeOf(lvTypes, x.r.type).th])
      .some((v) => String(v || "").toLowerCase().includes(kw)));
    out.sort((a, b) => String(b.d || "").localeCompare(String(a.d || "")) || String(b.r.createdAt || "").localeCompare(String(a.r.createdAt || "")));
    return out;
  }, [scope, kind, q, otVisible, otWaiting, lvVis, lvWaiting, uid, lvTypes]);

  const SC = (canApprove ? [{ k: "inbox", th: "รอฉันอนุมัติ", n: otWaiting.length + lvWaiting.length }] : [])
    .concat([{ k: "mine", th: "ของฉัน" }])
    .concat(canAll ? [{ k: "all", th: "ทั้งหมด" }] : []);

  /* แบ่งหัวรายเดือน — list เรียงใหม่→เก่าแล้ว */
  const groups = [];
  list.forEach((x) => {
    const ym = String(x.d || "").slice(0, 7);
    const g = groups[groups.length - 1];
    if (g && g.ym === ym) g.items.push(x); else groups.push({ ym: ym, items: [x] });
  });

  return (
    <div className="tmv" style={{ gap: 14 }}>
      <div className="tmv-bar" style={{ gap: 10 }}>
        <TmSeg items={SC} value={scope} onChange={setScope} />
        <TmSeg sm items={[{ k: "all", th: "ทุกชนิด" }, { k: "ot", th: "OT", ic: "clock" }, { k: "lv", th: "ลา", ic: "calendar" }]} value={kind} onChange={setKind} />
        <label className="tmv-search" style={{ marginLeft: "auto" }}>
          <Icon name="search" size={15} color="var(--text-3)" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา ชื่อ · เลขที่ · เหตุผล" />
        </label>
      </div>

      {scope === "mine" && kind !== "ot" && myBal.length > 0 && (
        <div className="tmv-bar" style={{ gap: 8, padding: "0 4px" }}>
          <span className="tmv-k">วันลาคงเหลือ ปี {year + 543}</span>
          {myBal.map((b) => (
            <span key={b.type.key} className="tmv-pill" style={{ background: b.type.color + "1A", color: b.type.color, padding: "5px 12px", fontSize: 12 }}>
              {b.type.th}
              <b style={{ fontFamily: "var(--display)", fontSize: 15, color: b.left != null && b.left <= 0 ? "var(--tint-red-tx2)" : "var(--text-1)" }}>
                {b.left == null ? "∞" : Math.round(b.left * 10) / 10}</b>
              <span style={{ color: "var(--text-3)", fontWeight: 600 }}>{b.quota == null ? "ไม่จำกัด" : "/ " + Math.round(b.quota * 10) / 10 + " วัน"}</span>
            </span>
          ))}
        </div>
      )}

      {list.length === 0
        ? <TmCard><TmEmpty icon={scope === "inbox" ? "check" : "list"}>
            {scope === "inbox" ? "ไม่มีคำขอรอคุณอนุมัติ — เคลียร์หมดแล้ว" : "ยังไม่มีคำขอ"}
          </TmEmpty></TmCard>
        : (
          <div className="tmv-list">
            {groups.map((g) => (
              <React.Fragment key={g.ym || "none"}>
                <div className="tmv-grp">{g.ym ? window.tmYmTH(g.ym) : "ไม่ระบุวันที่"}<span>{g.items.length} ใบ</span></div>
                {g.items.map((x) => (
                  <TmReqCard key={x.t + x.r.id} x={x} users={users} lvTypes={lvTypes}
                    onOpen={(y) => (y.t === "ot" ? onOpenOt(y.r.id) : onOpenLv(y.r.id))}
                    onApprove={scope === "inbox" ? onApprove : null} />
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      <div style={{ fontSize: 11.5, color: "var(--text-3)", padding: "0 4px" }}>ช่างเปิดใบ OT และยื่นใบลาจากแอปในไลน์ — กดการ์ดเพื่อเปิดใบ ดูรายละเอียด แก้ หรือไม่อนุมัติ</div>
    </div>
  );
}

/* ปฏิทินรายวันของคนหนึ่งคนในเดือน — เจ็ดคอลัมน์ต่อสัปดาห์ */
/* วันหยุด (ประจำสัปดาห์ + บริษัทประกาศ) ตัวม่วงพร้อมชื่อ · วันลา (ใบรออนุมัติ/อนุมัติแล้ว) สีของประเภทลา — ผู้ใช้สั่ง ต.ค. 2026 */
function TmDayGrid({ days, byDay, onPick, cfg, leaves, lvTypes }) {
  const today = window.drToday();
  const lvOf = (d) => window.lvCovers && window.tmIsWorkday(d, cfg) ? (leaves || []).find((r) => window.lvCovers(r, d)) || null : null;
  return (
    <div className="tmv-cal">
      {TM_WD_TH.map((w) => <div key={w} className="h">{w}</div>)}
      {Array.from({ length: tmWdOf(days[0]) }, (_, i) => <div key={"pad" + i} />)}
      {days.map((d) => {
        const x = byDay[d];
        const open = x && x.in && !x.out;
        const hol = cfg && !window.tmIsWorkday(d, cfg) ? (window.tmWhNorm(cfg).holidays[d] || "วันหยุด") : "";
        const lv = lvOf(d), lt = lv && window.lvTypeOf ? window.lvTypeOf(lvTypes, lv.type) : null;
        const lab = lt
          ? <div className="lab" style={{ color: lt.color }} title={lt.th + " · " + (lv.no || "") + " · " + window.tmOtStatusOf(lv.status).th}>
              {lt.th}{lv.part && lv.part !== "full" && window.lvPartTH ? " (" + window.lvPartTH(lv.part) + ")" : ""}{lv.status !== "approved" ? " ·รอ" : ""}</div>
          : hol ? <div className="lab" style={{ color: "var(--st-design-fg)" }} title={hol}>{hol}</div> : null;
        return (
          <div key={d} className={"d" + (x ? " on" : " off") + (open ? " bad" : "") + (onPick && d <= today ? " pk" : "") + (lab && !x ? " hl" : "")}
            style={hol && !x ? { background: "var(--st-design-soft)" } : undefined}
            title={onPick && d <= today ? (x ? "กดเพื่อแก้เวลา" : "กดเพื่อลงเวลาแทน") + " · " + window.drDateTH(d) : window.drDateTH(d)}
            onClick={onPick && d <= today ? () => onPick(d, x) : undefined}>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 700 }}>{+d.slice(8)}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: open ? "var(--tint-red-tx2)" : "var(--text-1)" }}>
              {x ? (x.in || "—") + "–" + (x.out || "?") : "—"}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{x ? window.tmDur(x.mins) : ""}</div>
            {lab}
          </div>
        );
      })}
    </div>
  );
}

/* แถบสีรายวันทั้งเดือน — เขียวเข้มตามชั่วโมงที่ทำ · แดง = ลืมกดออก · ม่วง = วันหยุด · เทา = วันทำงานที่ไม่มีใบ
   (ผู้ใช้สั่ง ต.ค. 2026: ช่องว่างจางมองไม่เห็น + วันหยุดต้องมีสีของตัวเอง) — ทำงานวันหยุด = เขียวมีขีดม่วงล่าง */
const TM_HEAT_LEG = [["color-mix(in srgb, var(--primary) 100%, transparent)", "ทำงาน (จาง = ไม่ครบ)"],
  ["color-mix(in srgb, var(--text-3) 20%, transparent)", "ไม่มีใบ"],
  ["transparent", "ยังไม่ถึง", "inset 0 0 0 1px color-mix(in srgb, var(--text-3) 45%, transparent)"],
  ["color-mix(in srgb, var(--st-design-fg) 34%, transparent)", "วันหยุด"], ["var(--tint-red-tx2)", "ลืมกดออก"]];
function TmHeat({ days, byDay, cfg }) {
  const wh = window.tmWhNorm(cfg);
  const full = wh.workMins || 480;
  const offTH = (d) => wh.holidays[d] ? "วันหยุด " + wh.holidays[d] : "วันหยุด";
  const today = window.drToday();
  return (
    <div className="tmv-heat">
      {/* จำนวนคอลัมน์ส่งเป็นตัวแปร CSS ไม่ใช่ gridTemplateColumns ตรง ๆ — index.html มีกฎจอแคบ [style*="grid-template-columns"] → 1fr !important
          ทำให้ช่องรายวันเรียงลงเป็นแท่งยาวทีละวัน (ผู้ใช้ทัก ต.ค. 2026) */}
      <div className="tmv-heat-g" style={{ "--hd": days.length }}>
        {days.map((d) => {
          const x = byDay[d];
          const off = !window.tmIsWorkday(d, cfg);
          const tag = off ? " · " + offTH(d) : "";
          /* วันที่ยังไม่ถึง = ช่องโปร่งมีกรอบ ไม่ใช่เทาแบบ "ไม่มีใบ" (เดิมดูเหมือนขาดงานครึ่งเดือนหลัง — ผู้ใช้สั่ง ต.ค. 2026)
             วันนี้ = มีจุดใต้ช่อง (.today) */
          const fut = d > today, td = d === today ? " today" : "";
          if (!x || !x.in) return <i key={d} className={(off ? "off" : "") + (fut ? " fut" : "") + td}
            title={window.drDateTH(d) + (off ? tag : fut ? " · ยังไม่ถึง" : " · ไม่มีใบ")} />;
          if (!x.out) return <i key={d} className={"forgot" + td} title={window.drDateTH(d) + tag + " · " + x.in + " – ลืมกดออก"} />;
          const p = Math.round(35 + 65 * Math.min(1, (+x.mins || 0) / full));
          return <i key={d} className={(off ? "offw" : "") + td} title={window.drDateTH(d) + tag + " · " + x.in + "–" + x.out + " · " + window.tmDur(x.mins)}
            style={{ background: "color-mix(in srgb, var(--primary) " + p + "%, var(--surface2))" }} />;
        })}
      </div>
      <div className="tmv-heat-ax"><span>1</span><span>{Math.ceil(days.length / 2)}</span><span>{days.length}</span></div>
    </div>
  );
}

/* ── แท็บสรุปเดือน ── จุดออกเอกสารจุดเดียว: Excel ทั้งเดือน (ปุ่มบน) · ใบ OT ให้หัวหน้าเซ็น (ปุ่มบนการ์ดแต่ละคน)
   เวลาเข้า-ออกนับตามเดือนปฏิทิน · OT นับตามรอบตัดยอดที่จบในเดือนนี้ (ไม่ตั้งวันตัด = เดือนเดียวกัน) */
const tmPpIdle = (r) => !(r.a && r.a.days) && !(r.o && r.o.rows.length);
function TmMonthAll({ cfg, users, jobs, otRows, byName, canAll, currentUser }) {
  const lvRows = window.useLeaves ? window.useLeaves().rows : [];
  const lvTypes = window.useLeaveTypes ? window.useLeaveTypes().types : [];
  const isAdmin = window.usePgAdmin();
  const [ed, setEd] = React.useState(null);
  const [msg, setMsg] = React.useState("");
  const [ym, setYm] = React.useState(window.tmYmNow);
  const { byDate, loading } = window.useAttendMonth(canAll ? ym : null);
  const [pick, setPick] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [onlyApproved, setOnlyApproved] = React.useState(false);
  const [paper, setPaper] = React.useState(null);

  const days = React.useMemo(() => window.tmMonthDays(ym), [ym]);
  const cut = window.tmWhNorm(cfg).cutoffDay;
  const period = React.useMemo(() => window.tmPeriodOf(cut ? days[Math.min(cut, days.length) - 1] : days[0], cfg), [days, cfg, cut]);

  const att = React.useMemo(() => (canAll ? window.tmMonthRollup(byDate, users, cfg, otRows, ym) : []),
    [canAll, byDate, users, cfg, otRows, ym]);
  const otPeople = React.useMemo(() => {
    const src = (otRows || []).filter((r) => window.tmInPeriod(r && r.date, period) && (!onlyApproved || r.status === "approved"));
    return window.tmOtByPerson(src, users, cfg);
  }, [otRows, period, onlyApproved, users, cfg]);

  /* การ์ดเดียวต่อคน: ลงเวลา (ถ้ามีสิทธิ์ดู) + OT */
  const rows = React.useMemo(() => {
    const map = {}, order = [];
    const get = (id, name) => { const k = id || "name:" + name; if (!map[k]) { map[k] = { key: k, id: id, name: name, a: null, o: null }; order.push(k); } return map[k]; };
    att.forEach((a) => { get(a.userId, a.name).a = a; });
    otPeople.forEach((g) => { const r = get(g.id, g.name); r.o = g; if (!r.name) r.name = g.name; });
    const has = (r) => (r.a && r.a.days) || (r.o && r.o.rows.length) ? 1 : 0;
    return order.map((k) => map[k]).sort((x, y) => has(y) - has(x) || String(x.name).localeCompare(String(y.name), "th"));
  }, [att, otPeople]);

  const tot = rows.reduce((t, r) => ({
    days: t.days + (r.a ? r.a.days : 0), mins: t.mins + (r.a ? r.a.mins : 0), noOut: t.noOut + (r.a ? r.a.noOut : 0),
    otOk: t.otOk + (r.o ? r.o.minsApproved : 0), pay: t.pay + (r.o ? r.o.payApproved : 0), wait: t.wait + (r.o ? r.o.minsWaiting : 0),
  }), { days: 0, mins: 0, noOut: 0, otOk: 0, pay: 0, wait: 0 });

  const stat = (l, v, u, color) => (
    <div className="tmv-stat"><div className="l">{l}</div><div className="v" style={{ color: color || undefined }}>{v}<small>{u}</small></div></div>
  );

  return (
    <div className="tmv" style={{ gap: 14 }}>
      <div className="tmv-bar">
        <button className="tmv-ib" title="เดือนก่อน" onClick={() => setYm(window.tmYmShift(ym, -1))}><Icon name="chevronLeft" size={16} /></button>
        <span className="tmv-date" style={{ minWidth: 130, textAlign: "center" }}>{window.tmYmTH(ym)}</span>
        <button className="tmv-ib" title="เดือนถัดไป" onClick={() => setYm(window.tmYmShift(ym, 1))}><Icon name="chevronRight" size={16} /></button>
        {ym !== window.tmYmNow() && <button className="btn btn-sm" onClick={() => setYm(window.tmYmNow())}>เดือนนี้</button>}
        {cut ? <span className="tmv-k" style={{ fontWeight: 600 }}>OT รอบ {window.tmPeriodTH(period)}</span> : null}
        {canAll && (
          <button className="btn btn-pri" style={{ marginLeft: "auto" }} disabled={busy} onClick={async () => {
            if (busy) return;
            setBusy(true);
            try { await tmExportMonthXlsx(att, days, ym, otRows, users, cfg); }
            finally { setBusy(false); }
          }}>
            <Icon name="download" size={15} color="#fff" sw={2} /> {busy ? "กำลังเตรียมไฟล์…" : "ออก Excel ทั้งเดือน"}
          </button>
        )}
      </div>

      <TmCard className="tmv-stats" style={{ padding: "8px 4px" }}>
        {canAll && stat("ชั่วโมงทำงานรวม", tmHrs(tot.mins), "ชม. · " + tot.days + " วัน-คน")}
        {stat("OT อนุมัติแล้ว", tmHrs(tot.otOk), "ชม.")}
        {stat("ชม.คิดค่าแรง OT", tmHrs(tot.pay), "ชม.", "var(--primary-dark)")}
        {tot.wait > 0 ? stat("OT รออนุมัติ", tmHrs(tot.wait), "ชม.", "var(--tint-amber-tx)") : null}
        {canAll && stat("ลืมกดออก", tot.noOut, "ใบ", tot.noOut ? "var(--tint-red-tx2)" : undefined)}
      </TmCard>

      {canAll && rows.length > 0 && <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 4px" }}><TmLegend items={TM_HEAT_LEG} /></div>}

      {canAll && loading ? <TmCard><TmEmpty>กำลังโหลด…</TmEmpty></TmCard>
        : rows.length === 0 ? <TmCard><TmEmpty icon="calendar">ไม่มีข้อมูลเดือนนี้</TmEmpty></TmCard>
        : (
          <div className="tmv-list">
            {rows.filter((r) => !tmPpIdle(r)).map((r) => {
              const a = r.a, o = r.o;
              const empty = false;
              return (
                <div key={r.key} className={"tmv-pp" + (empty ? " dim" : "")}>
                  <div className="tmv-pp-row">
                    <div className="tmv-who">
                      <TmAvatar uid={r.id} name={r.name} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <div className="tmv-who-n">{r.name}</div>
                        <div className="tmv-who-s">
                          {canAll && (a && a.days ? <span>มา {a.days} วัน · {tmHrs(a.mins)} ชม.</span> : <span>ไม่มีใบลงเวลา</span>)}
                          {a && a.noOut ? <span style={{ color: "var(--tint-red-tx2)", fontWeight: 700 }}>ลืมออก {a.noOut}</span> : null}
                        </div>
                      </div>
                    </div>
                    {canAll && a ? <TmHeat days={days} byDay={a.byDay} cfg={cfg} /> : <div style={{ gridArea: "heat" }} />}
                    {/* ไม่มี OT = ไม่ต้องเขียนบอก (เดิมขึ้น "ไม่มี OT" ทุกการ์ดจนรก — ผู้ใช้สั่ง ต.ค. 2026) */}
                    {o && (o.minsApproved || o.minsWaiting) ? (
                      <div className="tmv-ot">
                        <span><b>{tmHrs(o.minsApproved)}</b>ชม. OT อนุมัติ</span>
                        <span><b style={{ color: "var(--primary-dark)" }}>{tmHrs(o.payApproved)}</b>ชม.คิดค่าแรง</span>
                        {o.minsWaiting ? <span style={{ color: "var(--tint-amber-tx)", fontWeight: 700 }}>รออนุมัติ {tmHrs(o.minsWaiting)} ชม.</span> : null}
                      </div>
                    ) : null}
                    <div className="tmv-pp-act">
                      {o && o.rows.length > 0 && (
                        <button className="btn btn-soft btn-sm" onClick={() => setPaper(o)} title="ใบสรุป OT ของคนนี้ ให้หัวหน้าเซ็น">
                          <Icon name="file" size={13} /> ใบ OT
                        </button>
                      )}
                      {canAll && a && a.days > 0 && (
                        <button className="tmv-ib xs" title={pick === r.key ? "ซ่อนรายวัน" : "ดูรายวัน"} onClick={() => setPick(pick === r.key ? null : r.key)}>
                          <Icon name="chevronDown" size={15} style={{ transform: pick === r.key ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
                        </button>
                      )}
                    </div>
                  </div>
                  {pick === r.key && a && <div className="tmv-pp-more">
                    <TmDayGrid days={days} byDay={a.byDay} cfg={cfg} lvTypes={lvTypes}
                      leaves={r.id ? (lvRows || []).filter((q) => q && q.userId === r.id && (q.status === "sent" || q.status === "approved")) : null}
                      onPick={isAdmin && r.id ? (d, x) => setEd(tmEdOf(users, cfg, r.id, r.name, d, x && x.in, x && x.in ? x.out || "" : null)) : null} />
                    {isAdmin && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 8 }}>กดช่องวันเพื่อแก้เวลา หรือลงเวลาแทนวันที่ไม่มีใบ</div>}
                  </div>}
                </div>
              );
            })}
            {/* คนที่ไม่มีใบลงเวลาและไม่มี OT ทั้งเดือน — แถวเดียว ไม่ต้องกินที่การ์ดละคน (ผู้ใช้สั่ง ต.ค. 2026) */}
            {rows.some(tmPpIdle) && (
              <div className="tmv-idle">
                <b>ยังไม่ได้ลงเวลาเดือนนี้ ({rows.filter(tmPpIdle).length})</b>
                {rows.filter(tmPpIdle).map((r) => (
                  <span key={r.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <TmAvatar uid={r.id} name={r.name} size={22} />{r.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "var(--text-2)", cursor: "pointer", width: "fit-content", padding: "0 4px" }}>
        <input type="checkbox" checked={onlyApproved} onChange={(e) => setOnlyApproved(e.target.checked)} style={{ width: 15, height: 15 }} />
        ใบ OT ที่พิมพ์ — เอาเฉพาะใบที่อนุมัติแล้ว
      </label>


      {msg && <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", padding: "0 4px" }}>{msg}</div>}
      {ed && <TmTimeEdit ed={ed} cfg={cfg} currentUser={currentUser} onClose={() => setEd(null)}
        onSaved={(t) => { setMsg("ลงเวลาของ " + (ed.user.name || "") + " " + window.drDateTH(ed.date) + " แล้ว · " + t); setEd(null); }} />}

      {paper && window.TmOtPaper && (
        <window.TmOtPaper person={paper} period={period} rows={paper.rows} jobs={jobs} users={users}
          cfg={cfg} byName={byName} onClose={() => setPaper(null)} />
      )}
    </div>
  );
}

/* ── แท็บตั้งค่า ── เวลาทำงาน/วันหยุด/อัตรา OT · ประเภทการลา · ยอดวันลารายคน */
function TmSettings({ wh, users, role, lv, lvTp, lvQuota }) {
  const canWh = window.can(role, "manageUsers");
  const canQuota = window.lvCanQuota(role);
  const SUBS = [].concat(canWh ? [{ k: "wh", th: "เวลาทำงาน · วันหยุด · อัตรา OT", sh: "เวลางาน", ic: "clock" }] : [])
    .concat(canWh ? [{ k: "types", th: "ประเภทการลา", sh: "ประเภทลา", ic: "list" }] : [])
    .concat(canQuota ? [{ k: "quota", th: "ยอดวันลารายคน", sh: "ยอดวันลา", ic: "users" }] : []);
  const [sub, setSub] = React.useState(SUBS.length ? SUBS[0].k : "");
  const [year, setYear] = React.useState(+String(window.drToday()).slice(0, 4));
  return (
    <div className="tmv" style={{ gap: 14 }}>
      <div className="tmv-bar">
        <TmSeg sm items={SUBS} value={sub} onChange={setSub} />
        {sub === "quota" && (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <button className="tmv-ib" onClick={() => setYear(year - 1)}><Icon name="chevronLeft" size={16} /></button>
            <span className="tmv-date" style={{ fontSize: 16 }}>ปี {year + 543}</span>
            <button className="tmv-ib" onClick={() => setYear(year + 1)}><Icon name="chevronRight" size={16} /></button>
          </span>
        )}
      </div>
      {sub === "wh" && <TmWorkHours cfg={wh.cfg} onSave={wh.save} />}
      {sub === "types" && window.LvTypesEditor && <window.LvTypesEditor types={lvTp.types} onSave={lvTp.save} />}
      {sub === "quota" && window.LvQuotaTable && <window.LvQuotaTable users={(users || []).filter((u) => !window.tmIsSysAcct(u))}
        types={lvTp.types} rows={lv.rows} quota={lvQuota} year={year} />}
    </div>
  );
}

/* ── หน้าหลัก ── */
function AttendView({ jobs, users, role, currentUser }) {
  const wh = window.useWorkHours();
  const ot = window.useOtClaims(wh.cfg);
  const lv = window.useLeaves();
  const lvTp = window.useLeaveTypes();
  const lvQuota = window.useLeaveQuota();
  const lvTypes = lvTp.types;
  const [tab, setTab] = React.useState("day");
  const [date, setDate] = React.useState(window.drToday());
  const [open, setOpen] = React.useState(null);
  const [openLv, setOpenLv] = React.useState(null);

  const canAll = window.tmCanAttendAll(role);
  const uid = (currentUser || {}).id || null;

  const visible = React.useMemo(() => window.tmOtVisible(ot.rows, currentUser, role), [ot.rows, currentUser, role]);
  const otWaiting = React.useMemo(() => visible.filter((r) => r.status === "sent" && window.tmOtApproveCheck(r, currentUser, role).ok),
    [visible, currentUser, role]);
  const lvWaiting = React.useMemo(() => window.lvVisible(lv.rows, currentUser, role)
    .filter((r) => r.status === "sent" && window.lvApproveCheck(r, currentUser, role).ok), [lv.rows, currentUser, role]);
  const me = window.useAttend(uid, 30);
  const ymNow = window.tmYmNow();
  const myOtMonth = visible.filter((r) => r.userId === uid && r.status === "approved" && String(r.date || "").slice(0, 7) === ymNow)
    .reduce((a, r) => a + (+r.mins || 0), 0);

  const openNew = () => {
    const rec = window.tmOtBlank(currentUser, users, ot.rows, null, wh.cfg);
    ot.save(rec); setOpen(rec.id); setTab("req");
  };

  const move = (rec, to) => {
    const next = window.tmOtMove(rec, to, currentUser, "");
    if (!next) return;
    ot.save(next);
    const when = window.drDateTH(next.date) + " " + next.from + "-" + next.to;
    if (to === "sent" && next.approverId) {
      window.tmNotify({ toUserId: next.approverId, title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins) });
    } else if (to === "sent") {
      /* ไม่ได้ตั้งผู้อนุมัติไว้ในโปรไฟล์ — ส่งเข้ากองกลาง ใครมีสิทธิ์ก็หยิบได้
         ดีกว่าใบค้างเงียบรอคนที่ไม่มีอยู่จริง */
      window.tmNotify({ toPerm: "otApprove", title: "ขออนุมัติ OT · " + next.no,
        body: next.userName + " · " + when + " · " + window.tmDur(next.mins) });
    } else if (to === "approved" || to === "rejected") {
      window.tmNotify({ toUserId: next.userId, title: (to === "approved" ? "อนุมัติ OT แล้ว · " : "ไม่อนุมัติ OT · ") + next.no,
        body: when + " · " + window.tmDur(next.mins) + " · โดย " + ((currentUser || {}).name || "") });
    } else if (to === "draft" && rec.status === "sent" && next.userId !== uid) {
      /* คนอนุมัติตีกลับ — เจ้าของใบต้องรู้ ไม่งั้นใบจะกลับไปเป็นร่างเงียบ ๆ แล้วไม่มีใครส่งอีก */
      window.tmNotify({ toUserId: next.userId, title: "ตีกลับใบ OT · " + next.no,
        body: when + " · แก้แล้วส่งใหม่ได้ · โดย " + ((currentUser || {}).name || "") });
    } else if (to === "cancelled" && rec.status === "sent" && next.approverId) {
      /* ยกเลิกใบที่ส่งไปแล้ว — คนอนุมัติต้องรู้ว่าไม่ต้องรออีก */
      window.tmNotify({ toUserId: next.approverId, title: "ยกเลิกใบขอ OT · " + next.no,
        body: next.userName + " · " + when + " · ไม่ต้องพิจารณาแล้ว" });
    }
  };
  const moveLv = (rec, to, note) => {
    const next = window.lvMove(Object.assign({}, rec, { days: window.lvCountDays(rec.from, rec.to, rec.part, wh.cfg) }), to, currentUser, note || "");
    if (!next) return;
    lv.save(next);
    window.lvNotifyMove(rec, next, currentUser, lvTypes);
  };

  /* อนุมัติจากการ์ดเลย (ผู้ใช้: กดไปมาหลายชั้น) — ยังถามยืนยันหนึ่งครั้ง · ไม่อนุมัติ/ตีกลับยังต้องเปิดใบ เพราะควรใส่เหตุผล */
  const approve = async (x) => {
    const r = x.r;
    const nm = window.tmNameOf(users, r.userId, r.userName);
    if (x.t === "ot") {
      const ok = await window.askConfirm({ title: "อนุมัติ OT " + (r.no || "") + " ?",
        body: nm + " · " + window.drDateTH(r.date) + " " + r.from + "–" + r.to + " · " + window.tmDur(r.mins) + (r.reason ? "\n" + r.reason : ""),
        ok: "อนุมัติ", icon: "check" });
      if (ok) move(window.tmOtFill(r, wh.cfg), "approved");
    } else {
      const lt = window.lvTypeOf(lvTypes, r.type);
      const b = window.lvBalance(lv.rows, lvQuota.map, r.userId, window.lvYearOf(r.from), lvTypes).find((y) => y.type.key === r.type);
      const ok = await window.askConfirm({ title: "อนุมัติ" + lt.th + " " + (r.no || "") + " ?",
        body: nm + " · " + window.lvRangeTH(r) + " · " + window.lvDaysTH(r.days) +
          (b && b.left != null ? "\nคงเหลือหลังอนุมัติ " + Math.round(b.left * 10) / 10 + " วัน" : "") + (r.reason ? "\n" + r.reason : ""),
        ok: "อนุมัติ", icon: "check" });
      if (ok) moveLv(r, "approved", "");
    }
  };

  const canSet = window.can(role, "manageUsers") || window.lvCanQuota(role);
  const TABS = [{ k: "day", th: canAll ? "วันนี้" : "เวลาของฉัน", ic: "clock" },
    { k: "req", th: "คำขอ OT · ลา", sh: "คำขอ", ic: "list", n: otWaiting.length + lvWaiting.length },
    { k: "month", th: "สรุปเดือน", ic: "chart" }]
    .concat(canSet ? [{ k: "cfg", th: "ตั้งค่า", ic: "settings" }] : []);

  const cur = (ot.rows || []).find((r) => r.id === open) || null;
  const curLv = (lv.rows || []).find((r) => r.id === openLv) || null;
  const jobSorted = React.useMemo(() => (jobs || []).slice()
    .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""))), [jobs]);

  const [narrow, rootRef, phone] = useTmNarrow();

  return (
    <div className={"tmv" + (narrow ? " nw" : "") + (phone ? " xs" : "")} ref={rootRef}>
      <style>{TM_CSS}</style>
      <TmHero me={me} cfg={wh.cfg} users={users} canAll={canAll} otMonthMins={myOtMonth}
        canOt={window.tmCanOt(role)} onNewOt={openNew} />

      <TmSeg items={TABS} value={tab} onChange={setTab} />

      {tab === "day" && (canAll
        ? <TmDaySheet date={date} setDate={setDate} cfg={wh.cfg} users={users} currentUser={currentUser} />
        : <TmMyDays rows={me.rows} cfg={wh.cfg} />)}

      {tab === "req" && <TmRequests users={users} role={role} currentUser={currentUser}
        otVisible={visible} lv={lv} lvTypes={lvTypes} lvQuota={lvQuota}
        otWaiting={otWaiting} lvWaiting={lvWaiting} onOpenOt={setOpen} onOpenLv={setOpenLv} onApprove={approve} />}

      {tab === "month" && <TmMonthAll cfg={wh.cfg} users={users} jobs={jobSorted} otRows={canAll ? ot.rows : visible}
        byName={(currentUser || {}).name || ""} canAll={canAll} currentUser={currentUser} />}

      {tab === "cfg" && canSet && <TmSettings wh={wh} users={users} role={role} lv={lv} lvTp={lvTp} lvQuota={lvQuota} />}

      {cur && <TmOtModal rec={cur} cfg={wh.cfg} jobs={jobSorted} users={users} role={role} currentUser={currentUser}
        onSave={ot.save} onMove={move} onDelete={ot.remove} onClose={() => setOpen(null)} />}
      {curLv && window.LvModal && <window.LvModal rec={curLv} cfg={wh.cfg} types={lvTypes} users={users} rows={lv.rows} quota={lvQuota.map} role={role}
        currentUser={currentUser} onSave={lv.save} onMove={moveLv} onDelete={lv.remove} onClose={() => setOpenLv(null)} />}
    </div>
  );
}

Object.assign(window, { TM_IN, TM_IN_W, TM_LB, TM_WD_TH, tmWdOf, AttendView, TmDaySheet, TmMonthAll, TmRequests, TmSettings, TmDayGrid,
  TmMyDays, TmOtModal, TmOtRow, TmWorkHours, TmFacts, TmHelp, TmHero, TmTeamToday, TmTimeline, TmAvatar, TmSeg, TmCard, TmReqCard, TmHeat, tmOffTH, TmTimeEdit, TmPickPerson,
  useTmDayStatus, tmExportMonthXlsx, tmPersonSheet, tmSheetName,
  TmStat, TmPill });
