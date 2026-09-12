const PG_LANGS = [{
  id: "th",
  th: "ไทย",
  label: "ไทย",
  flag: "TH"
}, {
  id: "en",
  th: "อังกฤษ",
  label: "English",
  flag: "EN"
}, {
  id: "zh",
  th: "จีน",
  label: "中文",
  flag: "中"
}];
const PG_LANG_IX = {
  th: 0,
  en: 1,
  zh: 2
};
const pgLang = () => {
  try {
    const v = localStorage.getItem("pg-doc-lang");
    return PG_LANG_IX[v] != null ? v : "th";
  } catch (e) {
    return "th";
  }
};
const pgSetLang = id => {
  try {
    localStorage.setItem("pg-doc-lang", PG_LANG_IX[id] != null ? id : "th");
  } catch (e) {}
};
function pgT(dict, lang) {
  const i = PG_LANG_IX[lang] != null ? PG_LANG_IX[lang] : 0;
  return function (key) {
    const row = (dict || {})[key];
    if (!row) return key;
    if (typeof row === "string") return row;
    return row[i] || row[0] || key;
  };
}
const PG_MON = {
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  zh: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
};
function pgDate(iso, lang) {
  const s = String(iso || "");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s || "—";
  const y = +m[1],
    mo = +m[2] - 1,
    d = +m[3];
  if (lang === "en") return PG_MON.en[mo] + " " + d + ", " + y;
  if (lang === "zh") return y + "年" + (mo + 1) + "月" + d + "日";
  return d + " " + PG_MON.th[mo] + " " + (y + 543);
}
const pgToday = lang => pgDate(new Date().toISOString().slice(0, 10), lang);
const pgFontLink = lang => lang === "zh" ? '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">' : "";
const pgFontStack = lang => lang === "zh" ? "'Noto Sans SC','IBM Plex Sans Thai','Microsoft YaHei','PingFang SC',sans-serif" : "'IBM Plex Sans Thai','Sarabun','Noto Sans Thai','Segoe UI',sans-serif";
const PG_TAG_RE = /(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>)/i;
const PG_THAI = "฀-๿";
const PG_THAI_RE = /[฀-๿]/;
function pgRxEsc(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const PG_RULE_CACHE = new WeakMap();
function pgRules(dict) {
  if (PG_RULE_CACHE.has(dict)) return PG_RULE_CACHE.get(dict);
  const out = Object.keys(dict || {}).sort((a, b) => b.length - a.length).map(k => {
    const hasSlot = k.indexOf("{}") >= 0;
    let src = k.split("{}").map(pgRxEsc).join("([^<>\\n]{0,40}?)");
    if (PG_THAI_RE.test(k.charAt(k.length - 1))) src += "(?![" + PG_THAI + "])";
    if (PG_THAI_RE.test(k.charAt(0))) {
      try {
        return {
          re: new RegExp("(?<![" + PG_THAI + "])" + src, "g"),
          val: dict[k],
          slot: hasSlot
        };
      } catch (e) {}
    }
    return {
      re: new RegExp(src, "g"),
      val: dict[k],
      slot: hasSlot
    };
  });
  PG_RULE_CACHE.set(dict, out);
  return out;
}
function pgDocHTML(html, lang, dict) {
  const i = PG_LANG_IX[lang];
  if (!i) return html;
  const rules = pgRules(dict || {});
  return String(html).split(PG_TAG_RE).map((chunk, k) => {
    if (k % 2) return chunk;
    let s = chunk;
    rules.forEach(r => {
      s = s.replace(r.re, function () {
        const args = arguments;
        const row = r.val;
        const to = (typeof row === "string" ? row : row[i - 1]) || "";
        if (!to) return args[0];
        if (!r.slot) return to;
        let n = 0;
        return to.replace(/\{\}/g, () => args[++n] == null ? "" : args[n]);
      });
    });
    return s;
  }).join("");
}
function LangPick({
  value,
  onChange,
  label
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap"
    }
  }, label !== false && React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "var(--text-2)"
    }
  }, label || "ภาษาเอกสาร"), React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 5
    }
  }, PG_LANGS.map(L => {
    const on = value === L.id;
    return React.createElement("button", {
      key: L.id,
      type: "button",
      onClick: () => onChange(L.id),
      title: "ออกเอกสารเป็นภาษา" + L.th,
      style: {
        padding: "5px 13px",
        borderRadius: 99,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700,
        transition: "background .15s, border-color .15s",
        border: "1px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
        background: on ? "var(--primary-soft)" : "var(--surface)",
        color: on ? "var(--primary-dark)" : "var(--text-2)"
      }
    }, L.label);
  })));
}
Object.assign(window, {
  PG_LANGS,
  PG_LANG_IX,
  pgLang,
  pgSetLang,
  pgT,
  pgDate,
  pgToday,
  pgFontLink,
  pgFontStack,
  pgDocHTML,
  LangPick
});