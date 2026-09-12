/* ============================================================
   flash+solar — ภาษาของ "เอกสารที่พิมพ์ออกไปให้คนอื่นอ่าน"
   ------------------------------------------------------------
   หน้าจอในระบบยังเป็นภาษาไทยอย่างเดียว — คนที่ใช้งานเป็นพนักงานเราทั้งหมด
   แต่เอกสารที่ออกจากระบบไปถึงมือลูกค้า (รายงานออกแบบ · ใบเสนอราคา ·
   ใบรายงานเข้าบริการ ฯลฯ) ต้องออกเป็นภาษาของคนอ่านได้

   วิธีใช้ในไฟล์เอกสาร:
     const T = window.pgT(MY_DICT, lang);
     T("title")                     → ข้อความตามภาษาที่เลือก
     window.pgDate(iso, lang)       → วันที่ (ไทยเป็น พ.ศ. · อังกฤษ/จีนเป็น ค.ศ.)

   พจนานุกรมเขียนเป็น { key: ["ไทย", "English", "中文"] } เรียงตาม PG_LANGS
   เขียนเป็นอาร์เรย์เพราะสามภาษาอยู่บรรทัดเดียวกัน เห็นพร้อมกันตอนแก้
   คำไหนแปลไม่ครบจะตกกลับเป็นภาษาไทย ไม่ใช่ขึ้นคีย์ดิบให้ลูกค้าเห็น
   ============================================================ */
const PG_LANGS = [
  { id: "th", th: "ไทย",     label: "ไทย",     flag: "TH" },
  { id: "en", th: "อังกฤษ",  label: "English", flag: "EN" },
  { id: "zh", th: "จีน",     label: "中文",     flag: "中" },
];
const PG_LANG_IX = { th: 0, en: 1, zh: 2 };

/* ภาษาที่เลือกไว้ล่าสุด — จำไว้ให้ทั้งระบบ ออกเอกสารให้ลูกค้าจีนติดกันสิบใบ
   จะได้ไม่ต้องกดเลือกใหม่ทุกใบ */
const pgLang = () => {
  try { const v = localStorage.getItem("pg-doc-lang"); return PG_LANG_IX[v] != null ? v : "th"; }
  catch (e) { return "th"; }
};
const pgSetLang = (id) => {
  try { localStorage.setItem("pg-doc-lang", PG_LANG_IX[id] != null ? id : "th"); } catch (e) { /* โหมดส่วนตัวเขียนไม่ได้ */ }
};

/* ตัวแปลของเอกสารหนึ่งใบ — คืนฟังก์ชัน T(key) ที่ปิดทับภาษาไว้แล้ว
   ค่าที่ไม่มีในพจนานุกรมคืนคีย์เดิม เพื่อให้เห็นตอนทดสอบว่าลืมแปลตรงไหน */
function pgT(dict, lang) {
  const i = PG_LANG_IX[lang] != null ? PG_LANG_IX[lang] : 0;
  return function (key) {
    const row = (dict || {})[key];
    if (!row) return key;
    if (typeof row === "string") return row;
    return row[i] || row[0] || key;
  };
}

/* ── วันที่ ──
   ไทยใช้ พ.ศ. (บวก 543) · อังกฤษกับจีนใช้ ค.ศ. — ปีพุทธศักราชในเอกสารภาษาอังกฤษ
   ทำให้ลูกค้าต่างชาติอ่านว่าเอกสารออกในอนาคตอีก 543 ปี
   คำนวณทุกอย่างเป็น ISO เสมอ แปลงตอนแสดงผลที่นี่ที่เดียว */
const PG_MON = {
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
};
function pgDate(iso, lang) {
  const s = String(iso || "");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s || "—";
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  if (lang === "en") return PG_MON.en[mo] + " " + d + ", " + y;
  if (lang === "zh") return y + "年" + (mo + 1) + "月" + d + "日";
  return d + " " + PG_MON.th[mo] + " " + (y + 543);
}
/* วันที่ของ "วันนี้" ในภาษานั้น — ใช้ตอนประทับวันที่ออกเอกสาร */
const pgToday = (lang) => pgDate(new Date().toISOString().slice(0, 10), lang);

/* ── ฟอนต์ ──
   IBM Plex Sans Thai ไม่มีตัวอักษรจีน ปล่อยไว้ตัวจีนจะกลายเป็นสี่เหลี่ยม
   โหลด Noto Sans SC เพิ่มเฉพาะตอนออกเอกสารภาษาจีน ไม่งั้นเอกสารไทยทุกใบ
   ต้องรอโหลดฟอนต์จีนหลายร้อย KB โดยไม่ได้ใช้ */
const pgFontLink = (lang) => (lang === "zh"
  ? '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">'
  : "");
const pgFontStack = (lang) => (lang === "zh"
  ? "'Noto Sans SC','IBM Plex Sans Thai','Microsoft YaHei','PingFang SC',sans-serif"
  : "'IBM Plex Sans Thai','Sarabun','Noto Sans Thai','Segoe UI',sans-serif");

/* ── แปลเอกสารทั้งใบ ──
   เอกสารพิมพ์ในระบบนี้สร้างด้วยการ "ต่อสตริง HTML" ยาวหลายร้อยบรรทัด
   ข้อความไทยแทรกอยู่กลางนิพจน์เต็มไปหมด — ถ้าไปห่อ T() ทีละจุดจะต้องรื้อ
   ทุกไฟล์ และพลาดตรงไหนก็รู้ตอนลูกค้าเปิดอ่านแล้ว

   จึงแปล "ตอนท้าย" แทน: ประกอบ HTML ภาษาไทยให้เสร็จเหมือนเดิมทุกอย่าง
   แล้วค่อยกวาดแทนคำตามพจนานุกรมก่อนแสดงผล ข้อดีคือ
   - ภาษาไทย (ค่าเริ่มต้น) คืนสตริงเดิมทันที ของเดิมไม่มีทางพัง
   - เพิ่มคำแปลทีหลังได้โดยไม่ต้องแตะโค้ดที่สร้างเอกสาร
   - คำที่ยังไม่ได้แปลตกเป็นภาษาไทย อ่านออก ไม่ใช่คีย์ดิบหรือช่องว่าง

   พจนานุกรมสองแบบ
   - คำตรง ๆ   "กำลังติดตั้ง": ["Installed capacity", "装机容量"]
   - มีตัวเลขคั่น ใช้ {} แทนที่ว่างของตัวเลข/ชื่อ แล้วอ้างกลับด้วย {}
       "รวม {} ปี": ["{} years total", "共 {} 年"]
     ({} จับได้ทุกอย่างที่ไม่ใช่แท็ก HTML และไม่ข้ามบรรทัด)

   ข้อควรระวัง: เรียงแทนคำยาวก่อนสั้นเสมอ ไม่งั้น "ผลผลิตปีแรก" จะโดน
   "ผลผลิต" กินไปก่อนแล้วเหลือเศษไทยห้อยท้ายคำอังกฤษ */
const PG_TAG_RE = /(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>)/i;
const PG_THAI = "฀-๿";
const PG_THAI_RE = /[฀-๿]/;
function pgRxEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/* คอมไพล์พจนานุกรมเป็นรายการกฎเรียงยาว→สั้น (จำผลไว้ ไม่คอมไพล์ใหม่ทุกครั้งที่ออกเอกสาร) */
const PG_RULE_CACHE = new WeakMap();
function pgRules(dict) {
  if (PG_RULE_CACHE.has(dict)) return PG_RULE_CACHE.get(dict);
  const out = Object.keys(dict || {})
    .sort((a, b) => b.length - a.length)
    .map((k) => {
      const hasSlot = k.indexOf("{}") >= 0;
      /* {} = ตัวเลขหรือชื่อที่โค้ดเสียบเข้ามา — ห้ามข้ามแท็กหรือขึ้นบรรทัดใหม่
         ไม่งั้นจะกวาดกินข้อความคนละย่อหน้าไปด้วย */
      let src = k.split("{}").map(pgRxEsc).join("([^<>\\n]{0,40}?)");
      /* กันแทนคำกลางคำ — " ตัว" ต้องไม่ไปกินหัวของ " ตัวเลข" จนเหลือเศษไทยห้อยท้าย
         ขอบเขตคือ "ตัวอักษรไทยติดกัน" ไม่ใช่ช่องว่าง เพราะภาษาไทยไม่เว้นวรรคระหว่างคำ */
      if (PG_THAI_RE.test(k.charAt(k.length - 1))) src += "(?![" + PG_THAI + "])";
      if (PG_THAI_RE.test(k.charAt(0))) {
        /* lookbehind ใช้ได้ในเบราว์เซอร์ปัจจุบันทั้งหมด แต่กันเหนียวไว้ — พังแล้วยังแปลได้ แค่เสี่ยงกินหัวคำ */
        try { return { re: new RegExp("(?<![" + PG_THAI + "])" + src, "g"), val: dict[k], slot: hasSlot }; }
        catch (e) { /* เบราว์เซอร์เก่าไม่รู้จัก lookbehind */ }
      }
      return { re: new RegExp(src, "g"), val: dict[k], slot: hasSlot };
    });
  PG_RULE_CACHE.set(dict, out);
  return out;
}

function pgDocHTML(html, lang, dict) {
  const i = PG_LANG_IX[lang];
  if (!i) return html;                       /* ไทย (0) หรือภาษาที่ไม่รู้จัก — ไม่แตะ */
  const rules = pgRules(dict || {});
  /* ข้าม <style> กับ <script> — ในนั้นมีคอมเมนต์ไทยที่ไม่มีใครเห็น และการแทนคำ
     ในโค้ดมีแต่จะทำเอกสารพัง */
  return String(html).split(PG_TAG_RE).map((chunk, k) => {
    if (k % 2) return chunk;                 /* ท่อนที่ตรงกับ <style>/<script> */
    let s = chunk;
    rules.forEach((r) => {
      s = s.replace(r.re, function () {
        const args = arguments;
        const row = r.val;
        const to = (typeof row === "string" ? row : row[i - 1]) || "";
        if (!to) return args[0];             /* ไม่มีคำแปลภาษานี้ — คงภาษาไทยไว้ */
        if (!r.slot) return to;
        let n = 0;
        return to.replace(/\{\}/g, () => args[++n] == null ? "" : args[n]);
      });
    });
    return s;
  }).join("");
}

/* ── ปุ่มเลือกภาษา ──
   วางไว้ในหน้าตั้งค่าก่อนกดออกเอกสาร ไม่ใช่ในตัวเอกสาร
   เอกสารหนึ่งใบมีภาษาเดียว — ปนสองภาษาในใบเดียวอ่านยากกว่าออกสองใบ */
function LangPick({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {label !== false && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{label || "ภาษาเอกสาร"}</span>
      )}
      <span style={{ display: "inline-flex", gap: 5 }}>
        {PG_LANGS.map((L) => {
          const on = value === L.id;
          return (
            <button key={L.id} type="button" onClick={() => onChange(L.id)} title={"ออกเอกสารเป็นภาษา" + L.th}
              style={{ padding: "5px 13px", borderRadius: 99, cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 700, transition: "background .15s, border-color .15s",
                border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
                background: on ? "var(--primary-soft)" : "var(--surface)",
                color: on ? "var(--primary-dark)" : "var(--text-2)" }}>
              {L.label}
            </button>
          );
        })}
      </span>
    </div>
  );
}

Object.assign(window, { PG_LANGS, PG_LANG_IX, pgLang, pgSetLang, pgT, pgDate, pgToday, pgFontLink, pgFontStack, pgDocHTML, LangPick });
