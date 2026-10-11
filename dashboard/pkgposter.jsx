/* ══════════════════════════════════════════════════
   รูปแพ็คเกจขาย (โพสต์ขาย 1080×1350 · prefix pk/Pk)

   รายอัน — ปุ่ม "รูปแพ็คเกจ" บนหัวใบลูกค้า → สเปคจาก BOQ ของลูกค้า (แผง · อินเวอร์เตอร์ · เฟส · ราคาขาย)
   สรุป   — ปุ่ม "รูปสรุปแพ็คเกจ" บนหัวช่วงฝ่ายขายของบอร์ด → ตารางหลายแพ็คเกจ (เช่น 3–20 kWp) ในรูปเดียว
   หน้าตา (ผู้ใช้ ต.ค. 2026 ให้ตัวอย่างโพสต์ FOX / LIB): พื้นรูปสว่าง ตัวหนังสือเข้ม · ราคาใหญ่ "xxx,000.-"
   ใต้ราคามีเม็ดยา "รวมติดตั้ง" · การ์ดสเปคกระจกขาว · แถบล่างสีเข้มมีไอคอนวงกลมของรับประกัน/จุดเด่น
   - รูปสินค้า = รูปของรายการในคลัง (stockImg/{id}) · ไม่มี = รูปหมวด (cat_panel / cat_inverter)
   - โลโก้ยี่ห้อ = cat_brand_<ยี่ห้อ> → รูปหมวดย่อยที่เป็นยี่ห้อ (เช่น LONGI = cat_sub6) → ตัวหนังสือ
   - ราคา = มูลค่าที่คาด (lead.expValue) → ราคาขาย BOQ · ส่วนลด (ไม่บันทึก) = ราคาเต็มขีดฆ่า + สติกเกอร์ดาวแฉก
   - รูปทั้งหมดเป็น dataURL/ไฟล์โดเมนเดียวกัน canvas จึงไม่ติด CORS ส่งออกได้
   ══════════════════════════════════════════════════ */

const PK_W = 1080, PK_H = 1350;
const PK_YIELD = 1400;   // หน่วย/kWp/ปี (ประมาณ)
const PK_RATE = 4.5;     // บาท/หน่วย
const PK_VAT = 0.07;
const PK_WTY_DEF = ["รับประกันงานติดตั้ง 5 ปี", "แผงโซลาร์ 15 ปี", "อินเวอร์เตอร์ 5 ปี", "ฟรีล้างแผง 3 ครั้ง", "สำรวจหน้างานฟรี", "รวมขออนุญาตการไฟฟ้า"];
/* ข้อมูลบริษัทบนรูป — แก้ในป๊อปแล้วกดบันทึก เก็บที่ RTDB config/pkPosterCo (ใช้ร่วมทุกเครื่อง) · ไม่มี = แบรนด์ของเรา */
const PK_B = (typeof BRANDING !== "undefined" && BRANDING) || window.BRANDING || {};
const PK_CO_DEF = { name: PK_B.name || "flash+solar", tag: PK_B.tagline || "CLEAN ENERGY", tel: PK_B.tel || "", line: "", site: PK_B.site || "", mark: "" };
const PK_CO_KEYS = ["name", "tag", "tel", "line", "site", "mark"];
const PK_CO_PATH = "config/pkPosterCo";
const PK_TX_PATH = "config/pkPosterText";   // {title, wty ข้อความบรรทัดละข้อ}
const PK_TITLE_DEF = "แพ็คเกจโซลาร์รูฟท็อป";
const PK_TH = "'IBM Plex Sans Thai', sans-serif";
const PK_NUM = "'Outfit', 'IBM Plex Sans Thai', sans-serif";
/* ธีมสี (ผู้ใช้ ต.ค. 2026) — พื้นสว่างแบบเดิมทุกธีม เปลี่ยนแค่ชุดสี · วาดทุกครั้งเรียก pkTheme(o.theme) ก่อน แล้วทุกฟังก์ชันอ่านสีจาก PK_C
   ink ตัวหนังสือหลัก · deep ตัวเลขใหญ่/หัวข้อ/พื้นทึบป้ายหัวข้อ · leaf สีเน้น (หน่วย ชิป HYBRID ประหยัด ป้ายแนะนำ) · price ราคา · solid2 ปลายไล่สีป้ายเขียว
   band แถบล่าง · lr/dr = rgb ของ leaf/deep ไว้ทำพื้นจาง (แถวแนะนำ ชิปเฟส) · ผู้ใช้ลองธีมมืด "เช้ามืด" แล้วไม่เอา */
function pkMkTheme(label, ink, deep, leaf, price, solid2, band, mute, lr, dr) {
  return { label: label, sw: "linear-gradient(135deg," + deep + " 45%," + leaf + " 46%)",
    ink: ink, deep: deep, leaf: leaf, price: price, green: solid2, sun: "#FCD34D", mute: mute, bg: "#F3F6F4", band: band, red: "#DC2626",
    fill: deep, solid: leaf, solid2: solid2, glass: "255,255,255", edge: "rgba(255,255,255,.95)",
    line: "rgba(15,43,51,.1)", alt: "rgba(15,43,51,.035)", recRow: "rgba(" + lr + ",.12)", chip1: "rgba(" + lr + ",.14)", chip3: "rgba(" + dr + ",.12)" };
}
const PK_THEMES = {
  green: pkMkTheme("เขียว", "#0F2B33", "#0A4D68", "#13896A", "#0B6E4F", "#22B36A", "#0B2533", "#5B6B63", "19,137,106", "10,77,104"),
  blue: pkMkTheme("น้ำเงิน", "#0F1B33", "#1E3A8A", "#2563EB", "#1D4ED8", "#3B82F6", "#0B1736", "#55607A", "37,99,235", "30,58,138"),
  orange: pkMkTheme("ส้ม", "#2B1A10", "#9A3412", "#EA580C", "#C2410C", "#F59E0B", "#2A140A", "#6B5A4E", "234,88,12", "154,52,18"),
  gold: pkMkTheme("กรมทอง", "#111827", "#0F2744", "#B7791F", "#A16207", "#D9A53A", "#0F1B2E", "#5F6673", "183,121,31", "15,39,68"),
};
const PK_C = Object.assign({}, PK_THEMES.green);
const pkTheme = (k) => Object.assign(PK_C, PK_THEMES[k] || PK_THEMES.green);
const PK_SUM_MAX = 8;    // แพ็คเกจในรูปสรุปได้สูงสุด (เกินนี้แถวเตี้ยจนอ่านไม่ออก)

const pkNorm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const pkNum = (v) => +String(v || "").replace(/[^\d.]/g, "") || 0;
const pkFmt = (n) => Math.round(n).toLocaleString("en-US");
/* ราคาบนรูป — ติ๊ก "บวก VAT 7%" = ×1.07 ปัดขึ้นหลักร้อย (ป้ายเปลี่ยนเป็น "รวม VAT และติดตั้ง") */
const pkPrice = (sell, o) => (o && o.vat ? Math.ceil(sell * (1 + PK_VAT) / 100) * 100 : sell);

function pkFind(items, name) {
  const k = pkNorm(name);
  if (!k) return null;
  return items.find((s) => pkNorm(s.name) === k) || items.find((s) => s.model && k.indexOf(pkNorm(s.model)) >= 0) || null;
}

/* ── สเปคจาก BOQ ── */
function pkSpec(lead, items) {
  const b = lead.boq || {};
  const pItem = pkFind(items, b.panelModel);
  const n = +b.panels || 0;
  const mW = /(\d{3})\s*w/i.exec(b.panelModel || "");
  const wp = (pItem && +pItem.wp) || (mW ? +mW[1] : 0);
  const invs = [[b.inverterModel, +b.invCount || 1], [b.inv2Model, +b.inv2Count || 0]]
    .filter((x) => x[0] && x[1] > 0)
    .map((x) => {
      const it = pkFind(items, x[0]);
      const mk = /(\d+(?:\.\d+)?)\s*k/i.exec(x[0]);
      return { name: x[0], item: it, count: x[1], kw: (it && +it.invKw) || (mk ? +mk[1] : 0) };
    });
  const kwp = Math.round(n * wp / 10) / 100;
  /* ราคาบนรูป = มูลค่าที่คาดของลูกค้า (ช่องในใบลูกค้า) · ว่าง = ราคาขายจาก BOQ */
  const sell = +lead.expValue || +((b.pricing || {}).sell) || 0;
  /* แบตรุ่นที่เลือก (batteryModel/Qty) + ตัวคุมแผง (optimizerModel) — แพ็คเกจ Huawei + แบต/Optimizer (ผู้ใช้ ต.ค. 2026) */
  const bat = +b.batteryKwh || 0, batItem = bat ? pkFind(items, b.batteryModel) : null;
  const optName = String(b.optimizerModel || "").trim(), optItem = optName ? pkFind(items, optName) : null;
  const optN = optName && window.BOQ && window.BOQ.optimizerQty ? window.BOQ.optimizerQty(optName, n) : optName ? n : 0;
  return { batItem: batItem, batQty: bat && b.batteryModel ? Math.max(1, Math.round(+b.batteryQty || 1)) : 0,
    optName: optName, optItem: optItem, opt: optN,
    b: b, pItem: pItem, panelName: b.panelModel || "", n: n, wp: wp, kwp: kwp, invs: invs,
    phase: +b.phase || +((lead.survey || {}).phase) || 1, sell: sell, bat: bat,
    /* ชนิดอินเวอร์เตอร์จากคลัง (invType) — Hybrid = ต่อแบตเพิ่มภายหลังได้ (ผู้ใช้ ต.ค. 2026 ให้บอกบนรูป) · ไม่รู้ = null ไม่เดา */
    hyb: invs.some((v) => v.item && v.item.invType === "hybrid") ? true : invs.length && invs.every((v) => v.item && v.item.invType) ? false : null,
    ok: !!(b.panelModel && n && (invs.length || b.microRatio)) };
}
/* ขนาดอินเวอร์เตอร์รวมเป็นข้อความ "5 kW" / "5 + 3 kW" · จำนวนเครื่องรวม */
function pkInvTxt(sp) {
  const kws = sp.invs.map((v) => v.kw).filter(Boolean);
  return { kw: kws.filter((k, j) => kws.indexOf(k) === j).join(" + "), n: sp.invs.reduce((s, v) => s + (+v.count || 0), 0) };
}

/* ── รูป ── */
const _pkImgP = {};
function pkImg(src) {
  if (!src) return Promise.resolve(null);
  if (_pkImgP[src]) return _pkImgP[src];
  return (_pkImgP[src] = new Promise((done) => {
    const im = new Image();
    im.onload = () => done(im);
    im.onerror = () => done(null);
    im.src = src;
  }));
}
const _pkStock = {};
function pkStockImg(key) {
  if (!key || !window.FBDB) return Promise.resolve("");
  if (_pkStock[key]) return _pkStock[key];
  return (_pkStock[key] = window.FBDB.ref("stockImg/" + key).once("value").then((s) => s.val() || "").catch(() => ""));
}
async function pkFirstImg(keys) {
  for (const k of keys) { const v = k && (await pkStockImg(k)); if (v) return pkImg(v); }
  return null;
}
/* ตัดพื้นขาวรอบรูปออก (โลโก้/รูปสินค้าพื้นขาว) ให้ขยายเต็มช่องได้ · รูปถ่ายเต็มกรอบคืนรูปเดิม */
function pkTrim(im) {
  if (!im) return null;
  try {
    const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement("canvas");
    c.width = W; c.height = H; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
    /* รูปที่ตัดพื้น+ครอปมาแล้ว (PNG มุมโปร่ง) ใช้ตามไฟล์เลย — ครอปด้วยเกณฑ์ < 238 ตัดฝาบนแบตขาวทิ้ง แล้ว flood กินต่อจนพัง (ผู้ใช้ ต.ค. 2026) */
    if (d[3] < 20 && d[d.length - 1] < 20) return im;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (d[i + 3] > 20 && Math.min(d[i], d[i + 1], d[i + 2]) < 238) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return im;
    const w = x1 - x0 + 3, h = y1 - y0 + 3, o = document.createElement("canvas");
    o.width = w; o.height = h;
    const og = o.getContext("2d"); og.drawImage(im, Math.max(0, x0 - 1), Math.max(0, y0 - 1), w, h, 0, 0, w, h);
    /* พื้นขาวที่ยังติดอยู่ทำให้โปร่ง — ไล่จากขอบรูปเข้าไปเฉพาะพื้นขาวที่ต่อกับขอบ (flood fill)
       ตัวสินค้าสีขาว (อินเวอร์เตอร์) จึงไม่โปร่งเป็นผีตามไปด้วย */
    const od = og.getImageData(0, 0, w, h), p = od.data, seen = new Uint8Array(w * h), st = [];
    /* รูปที่ตัดพื้นมาแล้ว (PNG มุมโปร่ง) ไม่ต้องไล่ซ้ำ — ขอบบนอินเวอร์เตอร์ขาว 248–254 เคยโดนกินจนแหว่ง (Growatt ต.ค. 2026) */
    if (p[3] < 20 && p[(w * h - 1) * 4 + 3] < 20) return o;
    /* ไล่เฉพาะขาวเกือบบริสุทธิ์ (> 248) — หน้าเครื่องสีขาวของอินเวอร์เตอร์อยู่ราว 237–246 เกณฑ์ต่ำกว่านี้ไหลเข้าหน้าเครื่องจนเป็นจุด ๆ */
    const light = (k) => Math.min(p[k * 4], p[k * 4 + 1], p[k * 4 + 2]) > 248 || p[k * 4 + 3] < 20;
    for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
    while (st.length) {
      const k = st.pop();
      if (seen[k] || !light(k)) continue;
      seen[k] = 1;
      const m = Math.min(p[k * 4], p[k * 4 + 1], p[k * 4 + 2]);
      p[k * 4 + 3] = m > 252 ? 0 : Math.round(p[k * 4 + 3] * (253 - m) / 5);
      const x = k % w;
      if (x > 0) st.push(k - 1); if (x < w - 1) st.push(k + 1);
      if (k >= w) st.push(k - w); if (k < w * (h - 1)) st.push(k + w);
    }
    og.putImageData(od, 0, 0);
    return o;
  } catch (e) { return im; }
}
/* โลโก้ยี่ห้อพื้นขาว → แปลงความขาวเป็นความโปร่งทั้งรูป (white-to-alpha) — ขอบตัวอักษรที่ผสมขาวไว้
   ไม่เหลือเป็นจุดขาว ๆ รอบโลโก้บนพื้นฟ้า (ผู้ใช้ ต.ค. 2026: "logo มันเป็นขอบจุดๆ") · ใช้กับโลโก้เท่านั้น
   (รูปสินค้าสีขาวจะโปร่งทั้งตัว) */
function pkUnwhite(im) {
  if (!im) return null;
  try {
    const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, c = document.createElement("canvas");
    c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, w, h), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const a = Math.max(255 - p[i], 255 - p[i + 1], 255 - p[i + 2]) / 255;
      if (a < 0.02) { p[i + 3] = 0; continue; }
      for (let k = 0; k < 3; k++) p[i + k] = Math.round((p[i + k] - 255 * (1 - a)) / a);
      p[i + 3] = Math.round(p[i + 3] * a);
    }
    g.putImageData(d, 0, 0);
    return c;
  } catch (e) { return im; }
}
function pkBrandKeys(item) {
  if (!item) return [];
  const br = String(item.brand || "").trim(), lo = br.toLowerCase(), out = [];
  if (br) out.push("cat_brand_" + lo.replace(/[.#$\[\]\/\s]+/g, "_"));
  if (/^sub/.test(item.cat || "")) out.push("cat_" + item.cat);
  const subs = (window.SF && window.SF.STOCK_SUB_BY_CAT) || {};
  Object.keys(subs).forEach((k) => (subs[k] || []).forEach((c) => {
    if (c && c.th && lo && String(c.th).trim().toLowerCase() === lo) out.push("cat_" + c.key);
  }));
  return out;
}
/* รูปสินค้าประจำยี่ห้อสำหรับโพสต์ (ไฟล์ใน repo · ผู้ใช้ให้มา) — มาก่อนรูปในคลัง ไม่มี = รูปคลัง */
const PK_BRAND_PHOTO = { "inv:huawei": "dashboard/assets/pkg-inv-huawei.jpg", "inv:growatt": "dashboard/assets/pkg-inv-growatt.png", "panel:longi": "dashboard/assets/pkg-panel-longi.webp",
  /* แบต Huawei (ผู้ใช้ให้มา ต.ค. 2026): ก้อนเดียว = รูปรายอัน · ชุด 3 ขนาด = รูปสรุป — ตัดพื้นไว้ในไฟล์แล้ว (เครื่องขาวบนพื้นขาว) */
  "batt:huawei": "dashboard/assets/pkg-batt-huawei-1.png", "battset:huawei": "dashboard/assets/pkg-batt-huawei-3.png",
  /* Optimizer Huawei (ผู้ใช้ให้มา ต.ค. 2026): opt = รูปรายอัน · รูปสรุปใช้ทั้ง opt + opt2 */
  "opt:huawei": "dashboard/assets/pkg-opt-huawei.png", "opt2:huawei": "dashboard/assets/pkg-opt-huawei-2.png" };   // batt:<ยี่ห้อ> ไม่มีไฟล์ = รูปคลัง · battset ไม่มี = ใช้ batt
function pkBrandPhoto(item, kind) {
  const k = kind + ":" + String((item && item.brand) || "").trim().toLowerCase();
  return pkImg(PK_BRAND_PHOTO[k] || "");   // ไม่มีไฟล์ = null → รูปคลัง
}
async function pkAssets(sp) {
  const inv = sp && sp.invs[0] && sp.invs[0].item;
  const pItem = sp && sp.pItem;
  const bItem = sp && sp.bat ? sp.batItem : null;
  const oItem = sp && sp.opt ? sp.optItem : null;
  const [hero, mark, pPhoto, iPhoto, pLogo, iLogo, bPhoto, bSet, oPhoto, oPhoto2] = await Promise.all([
    pkImg("dashboard/assets/pkg-house-light.jpg"),   // บ้านสว่าง ฝั่งซ้ายเป็นฟ้าโล่ง (ผู้ใช้ให้มา ต.ค. 2026 · ของเดิม pkg-house.jpg)
    pkImg(typeof brandDocURL === "function" ? brandDocURL() : ""),
    pkBrandPhoto(pItem, "panel").then((im) => im || pkFirstImg([pItem && pItem.id, "cat_panel"])),
    pkBrandPhoto(inv, "inv").then((im) => im || pkFirstImg([inv && inv.id, "cat_inverter"])),
    pkFirstImg(pkBrandKeys(pItem)),
    pkFirstImg(pkBrandKeys(inv)),
    bItem ? pkBrandPhoto(bItem, "batt").then((im) => im || pkFirstImg([bItem.id])) : null,
    bItem ? pkBrandPhoto(bItem, "battset") : null,
    oItem ? pkBrandPhoto(oItem, "opt").then((im) => im || pkFirstImg([oItem.id])) : null,
    oItem ? pkBrandPhoto(oItem, "opt2") : null,
  ]);
  return { oPhoto: pkTrim(oPhoto), oPhoto2: pkTrim(oPhoto2), bPhoto: pkTrim(bPhoto), bSet: pkTrim(bSet || bPhoto), hero: hero, mark: mark, pPhoto: pkTrim(pPhoto), iPhoto: pkTrim(iPhoto), pLogo: pkUnwhite(pkTrim(pLogo)), iLogo: pkUnwhite(pkTrim(iLogo)) };
}

/* ── วาด: ตัวช่วย ── */
function pkRR(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/* วางรูปพอดีกรอบ — ax/ay = ชิดซ้าย/บน (0) กลาง (.5 ค่าเริ่ม) ขวา/ล่าง (1) */
function pkContain(g, im, x, y, w, h, ay, ax) {
  if (!im) return;
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  const s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
  const fy = ay === "top" ? 0 : ay == null ? .5 : ay, fx = ax == null ? .5 : ax;
  g.drawImage(im, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
}
/* ay = ตำแหน่งตัดแนวตั้ง 0 บนสุด · 0.5 กลาง · 1 ล่างสุด */
function pkCover(g, im, x, y, w, h, ay) {
  const iw = im.naturalWidth, ih = im.naturalHeight, s = Math.max(w / iw, h / ih);
  const sw = w / s, sh = h / s;
  g.drawImage(im, (iw - sw) / 2, (ih - sh) * (ay == null ? .5 : ay), sw, sh, x, y, w, h);
}
/* ตั้งฟอนต์ให้ข้อความพอดีความกว้าง (ลดทีละ 1px) */
function pkFit(g, txt, weight, size, fam, maxW, min) {
  let s = size;
  for (; s > (min || 12); s--) { g.font = weight + " " + s + "px " + fam; if (g.measureText(txt).width <= maxW) break; }
  return s;
}
function pkSplitModel(name, brand) {
  let s = String(name || "").replace(/\s+/g, " ").trim();
  if (brand && s.toLowerCase().indexOf(brand.toLowerCase() + " ") === 0) s = s.slice(brand.length + 1);
  return s;
}
/* ตัดข้อความเป็นบรรทัดตามความกว้าง — ภาษาไทยไม่มีเว้นวรรค ตัดตามคำด้วย Intl.Segmenter (ไม่มี = ตัดที่เว้นวรรค
   คำเดียวยาวเกินค่อยตัดทีละตัวอักษร) */
function pkWrap(g, txt, maxW, maxLines) {
  const str = String(txt || ""), lines = [];
  const words = typeof Intl !== "undefined" && Intl.Segmenter
    ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(str), (x) => x.segment)
    : str.split(/(\s+)/);
  // ตัวเลขติดหน่วยถัดไปเสมอ ("2 ปี" ไม่ให้ "ปี" ตกบรรทัดเดี่ยว ๆ)
  for (let i = 0; i < words.length - 2; i++) {
    if (/^\d[\d.,]*$/.test(words[i]) && !words[i + 1].trim()) words.splice(i, 3, words[i] + words[i + 1] + words[i + 2]);
  }
  let cur = "";
  const push = (w) => {
    if (!cur && !w.trim()) return;
    const t = cur + w;
    if (g.measureText(t).width <= maxW) { cur = t; return; }
    if (cur) { lines.push(cur.trim()); cur = ""; }
    if (!w.trim()) return;
    if (g.measureText(w).width <= maxW) { cur = w; return; }
    let part = "";
    Array.from(w).forEach((ch) => { if (g.measureText(part + ch).width > maxW && part) { lines.push(part); part = ""; } part += ch; });
    cur = part;
  };
  words.forEach(push);
  if (cur.trim()) lines.push(cur.trim());
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, "…"); }
  return lines;
}
/* วาดของขาว/สีอ่อนบนพื้นฟ้าสว่างให้ไม่กลืน (ผู้ใช้ ต.ค. 2026: อินเวอร์เตอร์ขาว · โลโก้มีส่วนขาว โดนพื้นกลบ)
   เงาฟุ้งใหญ่ (big) + วาดซ้ำด้วยเงาแคบเข้ม = เส้นขอบนุ่ม ๆ รอบตัว */
function pkLift(g, draw, big) {
  g.save();
  if (big) { pkShadow(g, "rgba(8,30,40,.38)", big, big * .45); draw(); }
  pkShadow(g, "rgba(8,30,40,.55)", 3, 0); draw();
  g.restore();
}
function pkShadow(g, c, blur, oy) { g.shadowColor = c; g.shadowBlur = blur; g.shadowOffsetX = 0; g.shadowOffsetY = oy || 0; }
/* การ์ดกระจกขาวบนพื้นรูป */
function pkGlass(g, x, y, w, h, r, a) {
  g.save(); pkShadow(g, "rgba(8,30,24,.16)", 30, 10);
  pkRR(g, x, y, w, h, r); g.fillStyle = "rgba(" + PK_C.glass + "," + (a || .9) + ")"; g.fill(); g.restore();
  g.save(); pkRR(g, x + 1, y + 1, w - 2, h - 2, r - 1); g.lineWidth = 2; g.strokeStyle = PK_C.edge; g.stroke(); g.restore();
}

/* พื้นหลังส่วนบน: รูปบ้าน · ฝั่งซ้ายสว่างให้ตัวหนังสือเข้มอ่านง่าย · ขอบล่างจางเข้าพื้น */
function pkHero(g, A, H, ay) {
  const C = PK_C;
  g.fillStyle = C.bg; g.fillRect(0, 0, PK_W, PK_H);
  g.save(); g.beginPath(); g.rect(0, 0, PK_W, H); g.clip();
  if (A.hero) pkCover(g, A.hero, 0, 0, PK_W, H, ay == null ? .35 : ay);
  else { const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, "#BFDDF2"); sk.addColorStop(1, "#EEF4F1"); g.fillStyle = sk; g.fillRect(0, 0, PK_W, H); }
  let gr = g.createLinearGradient(0, 0, PK_W * .8, 0);
  gr.addColorStop(0, "rgba(246,249,247,.97)"); gr.addColorStop(.48, "rgba(246,249,247,.86)"); gr.addColorStop(1, "rgba(246,249,247,0)");
  g.fillStyle = gr; g.fillRect(0, 0, PK_W, H);
  gr = g.createLinearGradient(0, H - 300, 0, H);
  gr.addColorStop(0, C.bg + "00"); gr.addColorStop(1, C.bg);
  g.fillStyle = gr; g.fillRect(0, H - 300, PK_W, 300);
  g.restore();
}
/* แถวบน: ซ้าย = โลโก้บริษัท (เปิด/ปิด) · ขวา = โลโก้ยี่ห้อแผง | อินเวอร์เตอร์ */
function pkTop(g, A, o, brands) {
  const C = PK_C, y = 50;
  if (o.logo) {
    const co = o.co || {}, mark = co.markIm || A.mark;
    const nm = co.name != null ? co.name : PK_CO_DEF.name, tag = co.tag != null ? co.tag : PK_CO_DEF.tag;
    const lh = 64, mw = mark ? Math.min(lh * ((mark.naturalWidth || mark.width) / (mark.naturalHeight || mark.height)), 230) : 0;
    let x = 52;
    g.textBaseline = "alphabetic"; g.textAlign = "left";
    if (mark) { const mx = x; pkLift(g, () => pkContain(g, mark, mx, y, mw, lh), 0); x += mw + 14; }
    const tx = x + 1;
    if (nm) {
      let fs = 40; g.font = "700 " + fs + "px " + PK_NUM;
      while (fs > 22 && g.measureText(nm).width > 400) { fs -= 2; g.font = "700 " + fs + "px " + PK_NUM; }
      const ny = tag ? y + 40 : y + 46;
      nm.split("+").forEach((part, i) => {   // เครื่องหมาย + ในชื่อเป็นสีเขียวแบบโลโก้
        if (i) { g.fillStyle = C.green; g.fillText("+", x, ny); x += g.measureText("+").width; }
        g.fillStyle = C.ink; g.fillText(part, x, ny); x += g.measureText(part).width;
      });
    }
    if (tag) {
      const t = /^[\x20-\x7e]*$/.test(tag) ? tag.toUpperCase().split("").join(" ") : tag;   // อังกฤษเว้นตัวอักษรแบบโลโก้
      g.font = "500 14px " + PK_NUM; g.fillStyle = C.mute; g.fillText(t, tx, nm ? y + 62 : y + 40);
    }
  }
  // โลโก้ยี่ห้อชิดขวา คั่นด้วยเส้นตั้ง (แบบ "amithan | FOX")
  let rx = PK_W - 52;
  const bl = brands.slice().reverse().map((b) => {
    if (b.logo) return { b: b, w: Math.min(190, 46 * (b.logo.naturalWidth || b.logo.width) / (b.logo.naturalHeight || b.logo.height)) };
    g.font = "800 30px " + PK_NUM; return { b: b, w: b.name ? g.measureText(b.name.toUpperCase()).width : 0 };
  });
  bl.forEach((x, i) => {
    const b = x.b, w = x.w;
    if (i) { g.fillStyle = "rgba(15,43,51,.25)"; g.fillRect(rx - 2, y + 8, 2, 50); rx -= 26; }
    if (b.logo) {
      pkContain(g, b.logo, rx - w, y + 10, w, 46, .5, 1); rx -= w + 26;
    } else if (b.name) {
      g.font = "800 30px " + PK_NUM; g.fillStyle = C.deep; g.textAlign = "right"; g.fillText(b.name.toUpperCase(), rx, y + 44); g.textAlign = "left";
      rx -= w + 26;
    }
  });
}
/* ป้ายหัวข้อ: กล่องสีเข้มตัวขาว + เส้นยาวต่อท้าย (แบบ "All-in-One ———") */
function pkTag(g, txt, y, lineTo) {
  const C = PK_C;
  g.font = "700 30px " + PK_TH; const w = g.measureText(txt).width + 40;
  pkRR(g, 52, y, w, 54, 10); g.fillStyle = C.fill; g.fill();
  g.fillStyle = "#fff"; g.textAlign = "left"; g.fillText(txt, 72, y + 38);
  if (lineTo > 52 + w + 40) {
    const lg = g.createLinearGradient(52 + w + 20, 0, lineTo, 0); lg.addColorStop(0, C.fill); lg.addColorStop(1, C.fill + "00");
    g.fillStyle = lg; g.fillRect(52 + w + 20, y + 26, lineTo - (52 + w + 20), 3);
  }
}
/* ไอคอนในวงกลม เดาจากคำ (แผง · อินเวอร์เตอร์ · ล้าง · ขออนุญาต · สำรวจ · ติดตั้ง · อื่น ๆ = โล่ติ๊กถูก) */
function pkIcon(g, txt, cx, cy, s) {
  g.save(); g.translate(cx, cy); g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round";
  const t = String(txt || "");
  g.beginPath();
  const drop = (x, y, r) => { g.moveTo(x, y - r * 1.5); g.bezierCurveTo(x + r * 1.1, y - r * .2, x + r, y + r, x, y + r); g.bezierCurveTo(x - r, y + r, x - r * 1.1, y - r * .2, x, y - r * 1.5); };
  if (/ล้าง|ทำความสะอาด/.test(t)) {
    // แผงเอียง + หยดน้ำสามหยด
    g.moveTo(-s * .75, s * .2); g.lineTo(s * .95, s * .2); g.lineTo(s * .7, s * .95); g.lineTo(-s, s * .95); g.closePath();
    g.moveTo(s * .07, s * .2); g.lineTo(-s * .15, s * .95); g.moveTo(-s * .87, s * .58); g.lineTo(s * .83, s * .58); g.stroke();
    g.beginPath(); drop(0, -s * .5, s * .32); drop(-s * .62, -s * .32, s * .2); drop(s * .62, -s * .32, s * .2); g.stroke();
  } else if (/แผง|panel/i.test(t)) {
    g.rect(-s, -s * .7, s * 2, s * 1.4);
    [-s / 3, s / 3].forEach((x) => { g.moveTo(x, -s * .7); g.lineTo(x, s * .7); });
    g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke();
  } else if (/อินเวอร์เตอร์|inverter|แบต/i.test(t)) {
    g.moveTo(s * .15, -s); g.lineTo(-s * .55, s * .1); g.lineTo(0, s * .1); g.lineTo(-s * .15, s); g.lineTo(s * .55, -s * .1); g.lineTo(0, -s * .1); g.closePath(); g.stroke();
  } else if (/อนุญาต|เอกสาร|การไฟฟ้า/.test(t)) {
    g.rect(-s * .7, -s, s * 1.4, s * 2); g.moveTo(-s * .38, -s * .4); g.lineTo(s * .38, -s * .4); g.moveTo(-s * .38, 0); g.lineTo(s * .38, 0); g.moveTo(-s * .38, s * .4); g.lineTo(s * .15, s * .4); g.stroke();
  } else if (/สำรวจ|ปรึกษา/.test(t)) {
    g.arc(-s * .15, -s * .15, s * .6, 0, Math.PI * 2); g.moveTo(s * .3, s * .3); g.lineTo(s * .9, s * .9); g.stroke();
  } else if (/ติดตั้ง|งาน/.test(t)) {
    g.moveTo(-s, -s * .05); g.lineTo(0, -s * .9); g.lineTo(s, -s * .05); g.moveTo(-s * .7, -s * .3); g.lineTo(-s * .7, s * .85); g.lineTo(s * .7, s * .85); g.lineTo(s * .7, -s * .3); g.stroke();
    g.beginPath(); g.moveTo(-s * .3, s * .3); g.lineTo(-s * .05, s * .55); g.lineTo(s * .35, s * .1); g.stroke();
  } else {
    g.moveTo(0, -s); g.lineTo(s * .85, -s * .6); g.lineTo(s * .85, 0); g.quadraticCurveTo(s * .8, s * .7, 0, s); g.quadraticCurveTo(-s * .8, s * .7, -s * .85, 0); g.lineTo(-s * .85, -s * .6); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(-s * .35, 0); g.lineTo(-s * .05, s * .3); g.lineTo(s * .4, -s * .25); g.stroke();
  }
  g.restore();
}
/* แถบล่างสีเข้ม: แท็บหัวข้อ + ไอคอนวงกลมของรับประกัน/จุดเด่น (สูงสุด 6) + หมายเหตุ/ติดต่อ */
function pkBand(g, o, y) {
  const C = PK_C;
  g.fillStyle = C.band; g.fillRect(0, y, PK_W, PK_H - y);
  // แท็บหัวข้อเกยขอบบน
  g.font = "700 28px " + PK_TH; const tt = "รับประกัน · บริการ", tw = g.measureText(tt).width + 96;
  g.save(); pkShadow(g, "rgba(0,0,0,.25)", 16, 6);
  g.beginPath(); g.moveTo(0, y - 30); g.lineTo(tw - 30, y - 30); g.arcTo(tw, y - 30, tw, y, 30); g.arcTo(tw, y + 30, tw - 30, y + 30, 30); g.lineTo(0, y + 30); g.closePath();
  const tg = g.createLinearGradient(0, 0, tw, 0); tg.addColorStop(0, C.solid); tg.addColorStop(1, C.solid2); g.fillStyle = tg; g.fill(); g.restore();
  g.fillStyle = "#fff"; g.textAlign = "left"; g.fillText(tt, 48, y + 10);

  const items = (o.wty || []).filter(Boolean).slice(0, 6), n = items.length;
  const top = y + 54, colW = (PK_W - 64) / Math.max(1, n);
  items.forEach((t, i) => {
    const cx = 32 + colW * i + colW / 2, cy = top + 40;
    if (i) { g.fillStyle = "rgba(255,255,255,.14)"; g.fillRect(32 + colW * i, top + 6, 1.5, 150); }
    g.beginPath(); g.arc(cx, cy, 36, 0, Math.PI * 2); g.lineWidth = 2.5; g.strokeStyle = "rgba(255,255,255,.85)"; g.stroke();
    pkIcon(g, t, cx, cy, 15);
    g.textAlign = "center"; g.fillStyle = "#fff"; g.font = "600 " + (n > 5 ? 18 : 20) + "px " + PK_TH;
    const lines = pkWrap(g, t, colW - 18, 3);
    lines.forEach((ln, j) => g.fillText(ln, cx, cy + 66 + j * 25));
  });
  // หมายเหตุ + ติดต่อ
  const co = Object.assign({}, PK_CO_DEF, o.co || {});
  const cl = [co.tel && "โทร " + co.tel, co.line && "LINE " + co.line, co.site].filter(Boolean).join("   ·   ");
  const note = "ผลผลิตประมาณจาก " + pkFmt(PK_YIELD) + " หน่วย/kWp/ปี · ค่าไฟ " + PK_RATE + " บาท/หน่วย · ขึ้นกับทิศ ความชัน และเงาของหลังคาจริง";
  g.textAlign = "center"; g.font = "500 15px " + PK_TH; g.fillStyle = "rgba(255,255,255,.5)";
  if (o.contact && cl) {
    g.fillText(note, PK_W / 2, PK_H - 62);
    pkFit(g, cl, "700", 28, PK_TH, PK_W - 96, 16); g.fillStyle = C.sun; g.fillText(cl, PK_W / 2, PK_H - 24);
  } else g.fillText(note, PK_W / 2, PK_H - 26);
  g.textAlign = "left";
}
/* สติกเกอร์ดาวแฉกแดง "ลดทันที" (ผู้ใช้ขอให้ส่วนลดเด่น) */
function pkStar(g, bx, by, disc, R) {
  R = R || 84; const r = R * .86, N = 18;
  g.save(); g.translate(bx, by); g.rotate(-0.21);
  g.beginPath();
  for (let i = 0; i < N * 2; i++) { const a = Math.PI * i / N, rr = i % 2 ? r : R; g[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
  g.closePath();
  g.save(); pkShadow(g, "rgba(127,29,29,.45)", 22, 8);
  const bg = g.createLinearGradient(0, -R, 0, R); bg.addColorStop(0, "#FB7185"); bg.addColorStop(.5, "#EF4444"); bg.addColorStop(1, "#B91C1C");
  g.fillStyle = bg; g.fill(); g.restore();
  g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.9)";
  g.beginPath(); g.arc(0, 0, r - 9, 0, Math.PI * 2); g.setLineDash([5, 6]); g.stroke(); g.setLineDash([]);
  g.textAlign = "center"; g.fillStyle = "#fff";
  g.font = "800 " + Math.round(R * .31) + "px " + PK_TH; g.fillText("ลดทันที", 0, -R * .17);
  const amt = "฿" + pkFmt(disc);
  pkFit(g, amt, "800", Math.round(R * .45), PK_NUM, (r - 22) * 2, 18);
  g.fillStyle = "#FDE68A"; g.fillText(amt, 0, R * .33);
  g.restore(); g.textAlign = "left";
}
const pkPriceNote = (o) => (o.vat ? "รวม VAT และติดตั้ง" : "รวมติดตั้ง · ยังไม่รวม VAT 7%");

/* ไอคอนแบตเตอรี่ + สายฟ้า (x,y = มุมซ้ายบน · k = ขนาดคูณ) */
function pkBatt(g, x, y, k, col) {
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.5 * k; g.lineJoin = "round";
  pkRR(g, x, y, 30 * k, 20 * k, 4 * k); g.stroke(); g.fillRect(x + 30 * k, y + 6 * k, 4 * k, 8 * k);
  g.beginPath(); g.moveTo(x + 17 * k, y + 3 * k); g.lineTo(x + 10 * k, y + 11 * k); g.lineTo(x + 15 * k, y + 11 * k); g.lineTo(x + 13 * k, y + 17 * k);
  g.lineTo(x + 20 * k, y + 9 * k); g.lineTo(x + 15 * k, y + 9 * k); g.closePath(); g.fill();
  g.restore();
}
/* ป้าย "รองรับแบตเตอรี่ในอนาคต" ใต้รูปอินเวอร์เตอร์ — เม็ดยาเขียวทึบ (ผู้ใช้ ต.ค. 2026 เลือกจาก 4 แบบ: ป้ายเขียวทึบ + ชิป HYBRID เส้นขอบ) */
function pkHybBadge(g) {
  const C = PK_C, bt = "รองรับแบตเตอรี่ในอนาคต";
  g.textAlign = "left"; g.font = "700 22px " + PK_TH;
  const bw = g.measureText(bt).width + 74, bx = PK_W - 40 - bw, by = 536;
  g.save(); pkShadow(g, "rgba(8,60,40,.35)", 16, 6); pkRR(g, bx, by, bw, 50, 25);
  const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, C.solid); gr.addColorStop(1, C.solid2); g.fillStyle = gr; g.fill(); g.restore();
  pkBatt(g, bx + 20, by + 15, 1, "#fff");
  g.fillStyle = "#fff"; g.font = "700 22px " + PK_TH; g.fillText(bt, bx + 62, by + 33);
}

/* ── รูปรายอัน ── */
function pkDraw(cv, sp, A, o) {
  const g = cv.getContext("2d"), C = PK_C;
  cv.width = PK_W; cv.height = PK_H;
  g.imageSmoothingQuality = "high"; g.textBaseline = "alphabetic";
  pkTheme(o.theme);
  pkHero(g, A, 1060, 0);   // รูปบ้านชิดบน — หลังคาติดแผงโผล่ใต้รูปสินค้า
  const inv0 = sp.invs[0], it = pkInvTxt(sp);
  const pBrand = (sp.pItem && sp.pItem.brand) || "", iItem = inv0 && inv0.item, iBrand = (iItem && iItem.brand) || "";
  pkTop(g, A, o, [{ logo: A.pLogo, name: pBrand }, { logo: inv0 ? A.iLogo : null, name: inv0 ? iBrand : "" }].filter((b) => b.logo || b.name));

  // รูปสินค้าลอยฝั่งขวา: แผงอยู่หลัง อินเวอร์เตอร์อยู่หน้า
  if (A.pPhoto) pkLift(g, () => pkContain(g, A.pPhoto, 672, 150, 210, 360, .5, .5), 34);
  if (A.oPhoto && sp.opt) pkLift(g, () => pkContain(g, A.oPhoto, 596, 300, 90, 230, 1, .5), 24);   // Optimizer ซ้ายสุด
  if (A.bPhoto && sp.bat) pkLift(g, () => pkContain(g, A.bPhoto, 676, 330, 150, 200, 1, .5), 34);   // แบตยืนหน้าแผง ข้างอินเวอร์เตอร์
  if (A.iPhoto) pkLift(g, () => pkContain(g, A.iPhoto, 826, 270, 210, 250, 1, .5), 34);
  /* Hybrid ยังไม่ติดแบต → ป้าย "รองรับแบตเตอรี่ในอนาคต" ข้างรูปอินเวอร์เตอร์ (ผู้ใช้ ต.ค. 2026: ย้ายออกจากบรรทัดใต้ kWp) */
  if (sp.hyb && !sp.bat) pkHybBadge(g);

  pkTag(g, o.title || PK_TITLE_DEF, 168, 640);
  // ขนาดระบบตัวใหญ่
  const big = String(sp.kwp);
  g.font = "800 168px " + PK_NUM; g.fillStyle = C.deep; g.fillText(big, 44, 372);
  const bw = g.measureText(big).width;
  g.font = "700 60px " + PK_NUM; g.fillText("kWp", 44 + bw + 14, 372);
  g.font = "700 30px " + PK_TH; g.fillStyle = C.leaf;
  const typTx = (sp.hyb ? "HYBRID" : "ON-GRID") + (sp.bat ? " + แบตเตอรี่" : "");
  if (sp.hyb != null) {
    // ชนิดเป็นชิปเส้นขอบต่อท้าย "ระบบ n เฟส"
    const pre = "ระบบ " + sp.phase + " เฟส"; g.fillText(pre, 52, 426);
    const px = 52 + g.measureText(pre).width + 16;
    g.font = "800 24px " + PK_NUM; const cw2 = g.measureText(typTx).width + 32;
    pkRR(g, px, 394, cw2, 42, 21);
    g.lineWidth = 2.5; g.strokeStyle = sp.hyb ? C.leaf : C.deep; g.stroke(); g.fillStyle = sp.hyb ? C.leaf : C.deep;
    g.textAlign = "center"; g.fillText(typTx, px + cw2 / 2, 424); g.textAlign = "left";
  } else {
    const sysTx = "ระบบ " + sp.phase + " เฟส · ON-GRID" + (sp.bat ? " + แบตเตอรี่" : "");
    pkFit(g, sysTx, "700", 30, PK_TH, 600, 18); g.fillText(sysTx, 52, 426);
  }

  // ราคา
  const sell = o.price && sp.sell ? pkPrice(sp.sell, o) : 0, disc = sell ? Math.max(0, +o.disc || 0) : 0;
  if (sell) {
    g.font = "700 34px " + PK_TH; g.fillStyle = C.ink; g.fillText("ราคาเพียง", 52, 500);
    if (disc) {
      const lw = g.measureText("ราคาเพียง").width, full = pkFmt(sell + disc) + ".-";
      g.font = "600 32px " + PK_NUM; g.fillStyle = C.mute; g.fillText(full, 52 + lw + 22, 500);
      const fw = g.measureText(full).width;
      g.strokeStyle = C.red; g.lineWidth = 4; g.beginPath(); g.moveTo(52 + lw + 18, 489); g.lineTo(52 + lw + 26 + fw, 489); g.stroke();
    }
    const ptxt = pkFmt(sell) + ".-";
    pkFit(g, ptxt, "800", 150, PK_NUM, 600, 70);
    g.save(); pkShadow(g, "rgba(11,110,79,.18)", 18, 6); g.fillStyle = C.price; g.fillText(ptxt, 44, 638); g.restore();
    if (disc) pkStar(g, Math.min(Math.max(44 + g.measureText(ptxt).width - 20, 470), 590), 452, disc, 72);   // ลอยเหนือท้ายราคา ไม่ทับตัวเลข
  } else {
    g.font = "800 72px " + PK_TH; g.fillStyle = C.price; g.fillText("สอบถามราคาพิเศษ", 48, 600);
  }
  // เม็ดยาใต้ราคา
  const pill = sell ? pkPriceNote(o) : "ติดตั้งครบ จบในที่เดียว";
  g.font = "700 28px " + PK_TH; const pw = g.measureText(pill).width + 64;
  g.save(); pkShadow(g, "rgba(10,77,104,.3)", 16, 6);
  pkRR(g, 52, 668, pw, 58, 29); const pg = g.createLinearGradient(52, 0, 52 + pw, 0); pg.addColorStop(0, C.fill); pg.addColorStop(1, C.solid);
  g.fillStyle = pg; g.fill(); g.restore();
  g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText(pill, 52 + pw / 2, 707); g.textAlign = "left";

  // การ์ดสเปค
  const cards = [{ k: "แผง " + (pBrand || "โซลาร์เซลล์"), m: (sp.pItem && sp.pItem.model) || pkSplitModel(sp.panelName, pBrand), v: sp.wp ? String(sp.wp) : "", u: "W", r: sp.n ? "× " + sp.n : "", ru: "แผง" }];
  if (inv0) cards.push({ tag: sp.hyb ? "HYBRID" : sp.hyb === false ? "ON-GRID" : "", k: "อินเวอร์เตอร์ " + iBrand, m: (iItem && iItem.model) || pkSplitModel(inv0.name, iBrand), v: it.kw, u: "kW", r: it.n > 1 ? "× " + it.n : "", ru: it.n > 1 ? "เครื่อง" : "" });
  else cards.push({ k: "อินเวอร์เตอร์", m: "ไมโครอินเวอร์เตอร์", v: "", u: "", r: "", ru: "" });
  const bB = (sp.batItem && sp.batItem.brand) || "", oB = (sp.optItem && sp.optItem.brand) || "";
  if (sp.bat) cards.push({ k: "แบตเตอรี่ " + bB, m: (sp.batItem && sp.batItem.model) || "", v: String(sp.bat), u: "kWh", r: sp.batQty > 1 ? "× " + sp.batQty : "", ru: sp.batQty > 1 ? "ก้อน" : "" });
  if (sp.opt) {
    const om = (sp.optItem && sp.optItem.model) || pkSplitModel(sp.optName, oB), ow = /(\d{3,4})\s*W/i.exec(om);
    cards.push({ k: "Optimizer " + oB, m: om, v: ow ? ow[1] : "", u: ow ? "W" : "", r: "× " + sp.opt, ru: "ตัว" });
  }
  const cy = 752, ch = 146, gap = 18, cw = (PK_W - 96 - gap * (cards.length - 1)) / cards.length;
  const many = cards.length > 3;   // 4 การ์ด (แบต + Optimizer) ช่องแคบ: ไม่มีป้าย HYBRID ในการ์ด (มีชิปใต้ kWp แล้ว) · ตัว × n เล็กลง
  cards.forEach((c, i) => {
    const x = 48 + i * (cw + gap);
    pkGlass(g, x, cy, cw, ch, 26);
    // ป้ายชนิดอินเวอร์เตอร์มุมขวาบน (Hybrid = เขียว ต่อแบตภายหลังได้ · On-grid = กรม)
    let tw = 0;
    if (c.tag && !many) {
      g.font = "800 16px " + PK_NUM; tw = g.measureText(c.tag).width + 22;
      pkRR(g, x + cw - 20 - tw, cy + 18, tw, 28, 14); g.fillStyle = c.tag === "HYBRID" ? C.solid : C.fill; g.fill();
      g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText(c.tag, x + cw - 20 - tw / 2, cy + 38); tw += 10;
    }
    g.textAlign = "left"; pkFit(g, c.k, "700", 22, PK_TH, cw - 48 - tw, 15); g.fillStyle = C.mute; g.fillText(c.k, x + 26, cy + 38);
    let rw = 0;
    if (c.r) {
      g.textAlign = "right"; g.font = "700 20px " + PK_TH; g.fillStyle = C.mute; const ruw = g.measureText(c.ru).width;
      g.fillText(c.ru, x + cw - 24, cy + 94);
      g.font = "800 " + (many ? 36 : 46) + "px " + PK_NUM; g.fillStyle = C.ink; g.fillText(c.r, x + cw - 30 - ruw, cy + 94);
      rw = g.measureText(c.r).width + ruw + 16; g.textAlign = "left";
    }
    if (c.v) {
      g.font = "700 26px " + PK_NUM; const uw = c.u ? g.measureText(c.u).width + 6 : 0;   // หน่วยต่อท้ายต้องไม่ชน "× n"
      pkFit(g, c.v, "800", 60, PK_NUM, cw - 54 - rw - uw, 30); g.fillStyle = C.deep; g.fillText(c.v, x + 24, cy + 96);
      const vw = g.measureText(c.v).width; g.font = "700 26px " + PK_NUM; g.fillStyle = C.leaf; g.fillText(c.u, x + 30 + vw, cy + 96);
      // รุ่นใต้ตัวเลข (ผู้ใช้ ต.ค. 2026 ให้ใส่รุ่นแผง/อินเวอร์เตอร์)
      if (c.m) { pkFit(g, c.m, "600", 20, PK_NUM, cw - 50, 12); g.fillStyle = C.mute; g.fillText(c.m, x + 26, cy + 128); }
    } else if (c.m) { pkFit(g, c.m, "700", 30, PK_TH, cw - 48 - rw, 16); g.fillStyle = C.ink; g.fillText(c.m, x + 26, cy + 98); }
  });

  // ผลตอบแทน — การ์ดกระจกแบ่ง 3 ช่อง
  const kwh = sp.kwp * PK_YIELD, saveY = kwh * PK_RATE;
  const ss = [["ผลิตไฟ", "~" + pkFmt(kwh), "หน่วย/ปี"], ["ประหยัดค่าไฟ", "~฿" + pkFmt(saveY / 12), "/เดือน"]];
  if (sell && saveY) ss.push(["คืนทุน", "~" + (Math.round(sell / saveY * 10) / 10), "ปี"]);
  const sy = 914, sh = 100;
  pkGlass(g, 48, sy, PK_W - 96, sh, 26);
  const sw = (PK_W - 96) / ss.length;
  ss.forEach((t, i) => {
    const x = 48 + sw * i;
    if (i) { g.fillStyle = C.line; g.fillRect(x, sy + 20, 2, sh - 40); }
    g.textAlign = "center"; g.font = "600 21px " + PK_TH; g.fillStyle = C.mute; g.fillText(t[0], x + sw / 2, sy + 38);
    g.font = "600 20px " + PK_TH; const uw = g.measureText(t[2]).width;
    pkFit(g, t[1], "800", 40, PK_NUM, sw - 50 - uw, 22); const vw = g.measureText(t[1]).width;
    const x0 = x + sw / 2 - (vw + uw + 8) / 2;
    g.textAlign = "left"; g.fillStyle = C.ink; g.fillText(t[1], x0, sy + 84);
    g.font = "600 20px " + PK_TH; g.fillStyle = C.mute; g.fillText(t[2], x0 + vw + 8, sy + 84);
  });

  pkBand(g, o, 1050);
}

/* ── รูปสรุปหลายแพ็คเกจ ── rows = [{ sp, disc, rec }] เรียงตามขนาดแล้ว */
function pkDrawSum(cv, rows, A, o) {
  const g = cv.getContext("2d"), C = PK_C;
  cv.width = PK_W; cv.height = PK_H;
  g.imageSmoothingQuality = "high"; g.textBaseline = "alphabetic";
  pkTheme(o.theme);
  pkHero(g, A, 560);
  const brand = (f) => { const v = rows.map(f).filter(Boolean); return v.length === rows.length && v.every((x) => x === v[0]) ? v[0] : ""; };
  const pBrand = brand((r) => r.sp.pItem && r.sp.pItem.brand);
  const iBrand = brand((r) => r.sp.invs[0] && r.sp.invs[0].item && r.sp.invs[0].item.brand);
  pkTop(g, A, o, [{ logo: pBrand ? A.pLogo : null, name: pBrand }, { logo: iBrand ? A.iLogo : null, name: iBrand }].filter((b) => b.logo || b.name));
  if (A.pPhoto) pkLift(g, () => pkContain(g, A.pPhoto, 700, 136, 180, 280, .5, .5), 30);   // ไม่ล้นลงตาราง (เริ่ม y 428)
  if (A.iPhoto) pkLift(g, () => pkContain(g, A.iPhoto, 836, 200, 200, 214, 1, .5), 30);
  // ทุกแถวมีแบต → รูปชุดแบตยืนหน้าแผง ข้างอินเวอร์เตอร์
  /* รูปสรุป: ใส่ของให้ครบ (ผู้ใช้ ต.ค. 2026 "จะได้อยู่เยอะ ๆ") — ชุดแบต + Optimizer ทั้ง 2 รูป */
  if (rows.every((r) => r.sp.opt)) {
    if (A.oPhoto2) pkLift(g, () => pkContain(g, A.oPhoto2, 1000, 250, 64, 164, 1, .5), 20);
    if (A.oPhoto) pkLift(g, () => pkContain(g, A.oPhoto, 608, 236, 70, 178, 1, .5), 20);
  }
  if (A.bSet && rows.every((r) => r.sp.bat)) pkLift(g, () => pkContain(g, A.bSet, 660, 236, 170, 178, 1, .5), 30);

  pkTag(g, o.title || PK_TITLE_DEF, 156, 680);
  const ks = rows.map((r) => r.sp.kwp), lo = Math.min.apply(null, ks), hi = Math.max.apply(null, ks);
  const big = rows.length > 1 && lo !== hi ? Math.floor(lo) + "–" + Math.floor(hi) : String(lo);   // ปัดลง: 20.8 → "20" (ผู้ใช้ ต.ค. 2026)
  g.font = "800 140px " + PK_NUM; g.fillStyle = C.deep; g.fillText(big, 44, 338);
  const bw = g.measureText(big).width; g.font = "700 54px " + PK_NUM; g.fillText("kWp", 44 + bw + 14, 338);
  const wps = rows.map((r) => r.sp.wp).filter((w, j, a) => w && a.indexOf(w) === j);
  const sub = [pBrand && wps.length === 1 ? "แผง " + pBrand + " " + wps[0] + "W" : "", iBrand ? "อินเวอร์เตอร์ " + iBrand + (rows.every((r) => r.sp.hyb) ? " Hybrid" : "") : "",
    rows.every((r) => r.sp.bat) ? "แบตเตอรี่" + (rows.every((r) => r.sp.bat === rows[0].sp.bat) ? " " + rows[0].sp.bat + " kWh" : "") + (rows.every((r) => r.sp.opt) ? " + Optimizer" : "") : ""].filter(Boolean).join(" · ") || "ติดตั้งครบ จบในที่เดียว";
  pkFit(g, sub, "700", 30, PK_TH, rows.every((r) => r.sp.opt) ? 520 : 620, 16); g.fillStyle = C.leaf; g.fillText(sub, 52, 392);   // มีรูป Optimizer ยืนที่ x 608 — ห้ามชน

  // ตารางแพ็คเกจ
  const tx = 48, ty = 428, tw = PK_W - 96, th = 574;
  pkGlass(g, tx, ty, tw, th, 30, .94);
  const col = { k: tx + 34, eq: tx + 300, sv: tx + 660, pr: tx + tw - 34 };
  /* ขอบขวาช่องประหยัด/เดือน — หลบราคาที่กว้างสุด (ราคาหลักแสน "฿435,000" เคยชิดติด "~฿10,920" ต.ค. 2026) */
  g.font = "800 36px " + PK_NUM;
  const prW = o.price ? Math.max(0, ...rows.map((r) => r.sp.sell ? g.measureText("฿" + pkFmt(pkPrice(r.sp.sell, o))).width : 0)) : 0;
  const svR = Math.min(col.sv + 120, col.pr - prW - 30);
  g.font = "700 19px " + PK_TH; g.fillStyle = C.mute; g.textAlign = "left";
  g.fillText("ขนาดระบบ", col.k, ty + 44); g.fillText("อุปกรณ์", col.eq, ty + 44);
  g.textAlign = "right"; g.fillText("ประหยัด/เดือน", svR, ty + 44); g.fillText(o.price ? "ราคา" : "", col.pr, ty + 44); g.textAlign = "left";
  g.fillStyle = C.line; g.fillRect(tx + 24, ty + 60, tw - 48, 2);
  const r0 = ty + 66, rH = Math.min(92, (th - 66 - 46) / Math.max(1, rows.length));
  /* ชิปเฟส / ชิป HYBRID ตรงกันเป็นคอลัมน์ (ผู้ใช้ ต.ค. 2026) — วัดความกว้างที่มากสุดของทุกแถวก่อน */
  const ks2 = Math.min(46, rH * .55), f2 = Math.min(19, rH * .3);
  const l2Of = (sp) => { const it = pkInvTxt(sp); return sp.invs.length ? "อินเวอร์เตอร์ " + it.kw + " kW" + (it.n > 1 ? " × " + it.n : "") : "ไมโครอินเวอร์เตอร์"; };
  let kMax = 0, l2Max = 0;
  rows.forEach((r) => {
    g.font = "800 " + ks2 + "px " + PK_NUM; let w = g.measureText(String(r.sp.kwp)).width + 6;
    g.font = "700 " + Math.round(ks2 * .45) + "px " + PK_NUM; w += g.measureText("kWp").width;
    kMax = Math.max(kMax, w);
    g.font = "500 " + f2 + "px " + PK_TH; l2Max = Math.max(l2Max, Math.min(250, g.measureText(l2Of(r.sp)).width));
  });
  rows.forEach((r, i) => {
    const sp = r.sp, y = r0 + i * rH, mid = y + rH / 2;
    if (r.rec) { pkRR(g, tx + 14, y + 3, tw - 28, rH - 6, 18); g.fillStyle = C.recRow; g.fill(); }
    else if (i % 2) { pkRR(g, tx + 14, y + 3, tw - 28, rH - 6, 18); g.fillStyle = C.alt; g.fill(); }
    // ขนาด + เฟส
    const kt = String(sp.kwp);
    g.font = "800 " + ks2 + "px " + PK_NUM; g.fillStyle = C.deep; g.fillText(kt, col.k, mid + ks2 * .36);
    const kw2 = g.measureText(kt).width; g.font = "700 " + Math.round(ks2 * .45) + "px " + PK_NUM; g.fillText("kWp", col.k + kw2 + 6, mid + ks2 * .36);
    const kx = col.k + kMax + 12;
    const pt = sp.phase + " เฟส", py = mid - 14; g.font = "700 16px " + PK_TH; const ptw = g.measureText(pt).width + 18;
    pkRR(g, kx, py, ptw, 28, 14); g.fillStyle = sp.phase === 3 ? C.chip3 : C.chip1; g.fill();
    g.fillStyle = sp.phase === 3 ? C.deep : C.leaf; g.fillText(pt, kx + 9, py + 20);
    // อุปกรณ์
    const l1 = "แผง " + sp.wp + "W × " + sp.n + (sp.bat ? " · แบต " + sp.bat + " kWh" : "") + (sp.opt ? " · Optimizer" : "");
    const l2 = l2Of(sp);
    // สองบรรทัดเสมอ (8 แถวก็ยังอ่านออก) · ชนิดอินเวอร์เตอร์เป็นชิปเส้นขอบท้ายบรรทัดสอง แบบเดียวกับรูปรายอัน
    const two = rH >= 50, f1 = two ? Math.min(23, rH * .36) : 20;
    if (two) {
      pkFit(g, l1, "700", f1, PK_TH, 330, 14); g.fillStyle = C.ink; g.fillText(l1, col.eq, mid - 3);
      pkFit(g, l2, "500", f2, PK_TH, 250, 13); g.fillStyle = C.mute; g.fillText(l2, col.eq, mid + f2 + 3);
      if (sp.hyb != null) {
        const tt = sp.hyb ? "HYBRID" : "ON-GRID", tx2 = col.eq + l2Max + 10;
        g.font = "800 13px " + PK_NUM; const ttw = g.measureText(tt).width + 16;
        pkRR(g, tx2, mid + f2 - 13, ttw, 21, 10.5); g.lineWidth = 1.8; g.strokeStyle = sp.hyb ? C.leaf : C.deep; g.stroke();
        g.fillStyle = sp.hyb ? C.leaf : C.deep; g.textAlign = "center"; g.fillText(tt, tx2 + ttw / 2, mid + f2 + 2); g.textAlign = "left";
      }
    } else { const l = l1 + " · " + l2 + (sp.hyb ? " · Hybrid" : ""); pkFit(g, l, "600", 20, PK_TH, 340, 12); g.fillStyle = C.ink; g.fillText(l, col.eq, mid + 7); }
    /* ป้าย "แนะนำ" อยู่ช่องว่างระหว่างอุปกรณ์กับประหยัด/เดือน กลางแถว (เดิมมุมซ้ายบน/ใต้ชิปเฟส ทับตัวเลข — ผู้ใช้ ต.ค. 2026) */
    g.font = "800 13px " + PK_NUM; let svL = col.eq + l2Max + 10 + g.measureText("ON-GRID").width + 16 + 14;  // ขอบซ้ายที่ช่องประหยัดใช้ได้
    if (r.rec) {
      const rx = svL + 2;
      g.font = "800 17px " + PK_TH; const rt = "แนะนำ", rtw = g.measureText(rt).width + 22;
      pkRR(g, rx, mid - 15, rtw, 30, 15); g.fillStyle = C.solid; g.fill(); g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText(rt, rx + rtw / 2, mid + 6); g.textAlign = "left";
      svL = rx + rtw + 12;
    }
    // ประหยัด
    const sv = "~฿" + pkFmt(sp.kwp * PK_YIELD * PK_RATE / 12);
    g.textAlign = "right"; pkFit(g, sv, "700", 25, PK_NUM, svR - svL, 17); g.fillStyle = C.leaf; g.fillText(sv, svR, mid + 9);
    // ราคา
    if (o.price) {
      const sell = sp.sell ? pkPrice(sp.sell, o) : 0, disc = sell ? Math.max(0, +r.disc || 0) : 0;
      if (!sell) { g.font = "700 24px " + PK_TH; g.fillStyle = C.mute; g.fillText("สอบถาม", col.pr, mid + 9); }
      else if (disc && rH >= 62) {
        g.font = "600 18px " + PK_NUM; g.fillStyle = C.mute; const ft = "฿" + pkFmt(sell + disc); g.fillText(ft, col.pr, mid - 14);
        const fw = g.measureText(ft).width; g.strokeStyle = C.red; g.lineWidth = 2.5; g.beginPath(); g.moveTo(col.pr - fw - 2, mid - 20); g.lineTo(col.pr + 2, mid - 20); g.stroke();
        g.font = "800 34px " + PK_NUM; g.fillStyle = C.red; g.fillText("฿" + pkFmt(sell), col.pr, mid + 22);
      } else {
        g.font = "800 " + Math.min(36, rH * .45) + "px " + PK_NUM; g.fillStyle = disc ? C.red : C.price; g.fillText("฿" + pkFmt(sell), col.pr, mid + 12);
      }
    }
    g.textAlign = "left";
  });
  // หมายเหตุใต้ตาราง
  g.textAlign = "center"; g.font = "600 19px " + PK_TH; g.fillStyle = C.mute;
  g.fillText((o.price ? "ราคารวมติดตั้ง · " : "") + "ขออนุญาตการไฟฟ้า · ขนส่ง", PK_W / 2, ty + th - 20);
  // เรื่อง VAT แยกออกมาชิดขวาใต้ตาราง ให้เห็นชัด (ผู้ใช้ ต.ค. 2026)
  if (o.price) { g.textAlign = "right"; g.font = "700 20px " + PK_TH; g.fillStyle = C.deep; g.fillText(o.vat ? "* ราคารวม VAT 7% แล้ว" : "* ราคายังไม่รวม VAT 7%", PK_W - 56, ty + th + 34); }
  g.textAlign = "left";

  pkBand(g, o, 1050);
}

/* ── รูป Add-on แบต + Optimizer (ผู้ใช้ ต.ค. 2026 ขอปุ่มทำเอง) ──
   ราคา = ทุนในคลัง ÷ (1 − กำไร%) ปัดขึ้นหลักพัน — ราคาคลังเปลี่ยน กดทำรูปใหม่ได้เลย
   ชื่อต้องตรงชื่อในคลังทุกตัวอักษร (เหมือน BOQ) */
const PK_ADD = { bat: "HUAWEI LUNA2000-7-E1", pm: "HUAWEI LUNA2000-10KW-C1 (Power Module)", opt: "Huawei Optimizer MERC-600W-PA0" };
const PK_ADD_OPT_DEF = [[5, 3.25], [8, 5.2], [16, 10.4], [24, 15.6], [32, 20.8]];   // [แผง, kWp] เมื่อยังไม่ได้เลือกแพ็คเกจ
function pkAddon(items, rows, mg, mgBig) {
  const bI = pkFind(items, PK_ADD.bat), pI = pkFind(items, PK_ADD.pm), oI = pkFind(items, PK_ADD.opt);
  const m = Math.min(90, Math.max(0, +mg || 0));
  const per = (window.BOQ && window.BOQ.RULES && +window.BOQ.RULES.battS1Per) || 3, kwh = (bI && +bI.kwh) || 7;
  const mb = Math.min(m, Math.max(0, mgBig == null || mgBig === "" ? m : +mgBig || 0));
  /* แบตก็ยิ่งติดเยอะยิ่งถูก (ผู้ใช้ ต.ค. 2026): กำไรไล่ m → mb ตาม 1–3 ก้อน · ราคาต่อ kWh ต้องลดลง (ไม่ต่ำกว่าทุน) */
  let prevB = Infinity;
  const bats = !bI ? [] : [1, 2, 3].map((q, i) => {
    const cost = q * (+bI.price || 0) + Math.ceil(q / per) * ((pI && +pI.price) || 0), mm = m - (m - mb) * i / 2;
    let p = Math.ceil(cost / (1 - mm / 100) / 1000) * 1000;
    while (p / q >= prevB && p - 1000 >= cost) p -= 1000;
    prevB = p / q;
    return { kwh: kwh * q, q: q, p: p };
  });
  // ขนาด Optimizer = จำนวนแผงของแพ็คเกจที่เลือก (ไม่ซ้ำ · สูงสุด 5 ช่อง)
  const seen = {}, ns = rows.map((r) => [r.sp.n, r.sp.kwp]).filter((x) => x[0] && !seen[x[0]] && (seen[x[0]] = 1)).sort((a, b) => a[0] - b[0]).slice(0, 5);
  const optQ = (n) => (window.BOQ && window.BOQ.optimizerQty ? window.BOQ.optimizerQty(PK_ADD.opt, n) : n);
  /* Optimizer ยิ่งติดเยอะยิ่งถูก (ผู้ใช้ ต.ค. 2026): กำไรไล่จาก mg (ขนาดเล็กสุด) ลงถึง mgBig (ใหญ่สุด) · ปัดขึ้นหลัก 500
     แล้วบังคับราคาต่อตัวต้องต่ำกว่าขนาดก่อนหน้า (ไม่ต่ำกว่าทุน) */
  const oc = (oI && +oI.price) || 0, sz = ns.length ? ns : PK_ADD_OPT_DEF;
  let prevU = Infinity;
  const opts = !oI ? [] : sz.map((x, i) => {
    const n = optQ(x[0]), mm = sz.length > 1 ? m - (m - mb) * i / (sz.length - 1) : m;
    let p = Math.ceil(n * oc / (1 - mm / 100) / 500) * 500;
    while (n && p / n >= prevU && p - 500 >= n * oc) p -= 500;
    prevU = n ? p / n : prevU;
    return { kwp: x[1], n: n, p: p, u: n ? p / n : 0 };
  });
  return { bI: bI, pI: pI, oI: oI, bats: bats, opts: opts, mg: m, mgBig: mb };
}
/* รับประกันบนรูป Add-on = แยกรายอุปกรณ์ (ผู้ใช้ ต.ค. 2026) — ปีจาก warY ในคลัง · งานติดตั้งเอาบรรทัดจากชุดหลัก */
function pkAddonWty(ad, wty) {
  const ins = String(wty || "").split("\n").map((x) => x.trim()).find((x) => /งานติดตั้ง/.test(x)) || "รับประกันงานติดตั้ง 2 ปี";
  const w = (it, nm) => it && +it.warY ? "รับประกัน" + nm + " " + it.warY + " ปี" : "";
  return [w(ad.bI, "แบตเตอรี่"), ad.pI && ad.bI && +ad.pI.warY !== +ad.bI.warY ? w(ad.pI, " Power Module") : "", w(ad.oI, " Optimizer"), ins].filter(Boolean).join("\n");
}
function pkDrawAddon(cv, A, o, ad) {
  const g = cv.getContext("2d"), C = PK_C;
  cv.width = PK_W; cv.height = PK_H;
  g.imageSmoothingQuality = "high"; g.textBaseline = "alphabetic";
  pkTheme(o.theme);
  pkHero(g, A, 560);
  const brand = (ad.bI && ad.bI.brand) || (ad.oI && ad.oI.brand) || "";
  pkTop(g, A, o, [{ logo: A.iLogo, name: brand }]);
  if (A.bSet) pkLift(g, () => pkContain(g, A.bSet, 690, 140, 230, 270, 1, .5), 30);
  if (A.oPhoto) pkLift(g, () => pkContain(g, A.oPhoto, 920, 170, 90, 240, 1, .5), 24);
  if (A.oPhoto2) pkLift(g, () => pkContain(g, A.oPhoto2, 610, 250, 64, 160, 1, .5), 20);
  pkTag(g, o.title || ("อัปเกรดแพ็คเกจ " + brand), 156, 560);
  const head = ad.bats.length ? "เพิ่มแบตเตอรี่" : "เพิ่ม Optimizer";
  pkFit(g, head, "800", 92, PK_TH, 560, 50); g.fillStyle = C.deep; g.fillText(head, 44, 300);
  if (ad.bats.length && ad.opts.length) { g.font = "800 52px " + PK_NUM; g.fillStyle = C.leaf; g.fillText("+ Optimizer", 52, 362); }
  const sub = "ต่อเพิ่มจากแพ็คเกจโซลาร์ " + brand + " Hybrid ได้ทุกขนาด";
  pkFit(g, sub, "600", 24, PK_TH, 540, 16); g.fillStyle = C.ink; g.fillText(sub, 52, 404);
  const pr = (p) => "+฿" + pkFmt(pkPrice(p, o));
  let y = 432;
  if (ad.bats.length) {
    const bm = String((ad.bI && ad.bI.model) || "").split("-")[0];
    pkGlass(g, 48, y, PK_W - 96, 270, 30, .94);
    g.font = "700 28px " + PK_TH; g.fillStyle = C.deep; g.fillText("แบตเตอรี่ " + brand + " " + bm, 80, y + 48);
    g.font = "600 20px " + PK_TH; g.fillStyle = C.mute; g.textAlign = "right";
    g.fillText("ก้อนละ " + ad.bats[0].kwh + " kWh" + (ad.pI ? " + Power Module" : "") + " · เก็บไฟไว้ใช้กลางคืน", PK_W - 80, y + 48); g.textAlign = "left";   // ไม่เขียน "สำรองไฟ" — แพ็คเกจไม่มีระบบสำรองไฟ (ผู้ใช้ ต.ค. 2026)
    const tw = (PK_W - 96 - 60 - 40) / 3;
    ad.bats.forEach((b, i) => {
      const x = 78 + i * (tw + 20), ty = y + 72;
      pkRR(g, x, ty, tw, 174, 22); g.fillStyle = i === 1 ? C.recRow : C.alt; g.fill();
      const kt = String(b.kwh); g.font = "800 64px " + PK_NUM; const kw = g.measureText(kt).width;
      g.font = "700 28px " + PK_NUM; const uw = g.measureText(" kWh").width, x0 = x + tw / 2 - (kw + uw) / 2;
      g.font = "800 64px " + PK_NUM; g.fillStyle = C.deep; g.fillText(kt, x0, o.price ? ty + 74 : ty + 96);
      g.font = "700 28px " + PK_NUM; g.fillStyle = C.leaf; g.fillText(" kWh", x0 + kw, o.price ? ty + 74 : ty + 96);
      g.textAlign = "center"; g.font = "600 20px " + PK_TH; g.fillStyle = C.mute; g.fillText(b.q + " ก้อน", x + tw / 2, o.price ? ty + 108 : ty + 136);
      if (o.price) { g.font = "800 38px " + PK_NUM; g.fillStyle = C.price; g.fillText(pr(b.p), x + tw / 2, ty + 154); }
      g.textAlign = "left";
    });
    y = 722;
  }
  if (ad.opts.length) {
    const om = String((ad.oI && ad.oI.model) || "").replace(/-PA\d*$/i, "");
    const k = ad.opts.length, ow = (PK_W - 96 - 60 - (k - 1) * 16) / k, top = ad.bats.length ? y : 470, h = 290;
    pkGlass(g, 48, top, PK_W - 96, h, 30, .94);
    g.font = "700 28px " + PK_TH; g.fillStyle = C.deep; g.fillText("Optimizer " + brand + " " + om + " (ใส่ทุกแผง)", 80, top + 48);
    const why = "ดูผลผลิตรายแผงในแอป · แผงโดนเงาบางแผงไม่ฉุดทั้งสตริง · ตัดไฟ DC ที่แผงได้เพื่อความปลอดภัย";
    pkFit(g, why, "600", 20, PK_TH, PK_W - 160, 14); g.fillStyle = C.mute; g.fillText(why, 80, top + 84);
    ad.opts.forEach((c, i) => {
      const x = 78 + i * (ow + 16), ty = top + 106;
      pkRR(g, x, ty, ow, 156, 20); g.fillStyle = C.alt; g.fill(); g.textAlign = "center";
      g.font = "800 44px " + PK_NUM; g.fillStyle = C.deep; g.fillText(String(c.kwp), x + ow / 2, ty + 56);
      g.font = "700 18px " + PK_NUM; g.fillStyle = C.leaf; g.fillText("kWp", x + ow / 2, ty + 80);
      g.font = "600 18px " + PK_TH; g.fillStyle = C.mute; g.fillText(c.n + " ตัว", x + ow / 2, ty + 106);   // ไม่โชว์ราคาต่อตัวบนรูป (ผู้ใช้ ต.ค. 2026) — ดูได้ที่แผงข้าง
      if (o.price) { pkFit(g, pr(c.p), "800", 30, PK_NUM, ow - 16, 18); g.fillStyle = C.price; g.fillText(pr(c.p), x + ow / 2, ty + 142); }
      g.textAlign = "left";
    });
    y = top + h;
  }
  if (o.price) { g.textAlign = "right"; g.font = "700 20px " + PK_TH; g.fillStyle = C.deep; g.fillText("* " + pkPriceNote(o), PK_W - 56, Math.min(y + 30, 1040)); g.textAlign = "left"; }
  pkBand(g, o, 1050);
}

async function pkFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all(["800 40px Outfit", "700 40px Outfit", "600 40px Outfit", "500 20px Outfit", "700 30px 'IBM Plex Sans Thai'", "600 30px 'IBM Plex Sans Thai'", "500 20px 'IBM Plex Sans Thai'", "800 30px 'IBM Plex Sans Thai'"]
      .map((f) => document.fonts.load(f, "กขค 0123 kWp")));
  } catch (e) { /* ใช้ฟอนต์สำรอง */ }
}

const PK_LS = "pk_poster_opt";
const PK_SUM_LS = "pk_sum_sel";   // รูปสรุป: id ลูกค้าที่เลือกไว้ (จำในเครื่อง)
function pkLoadOpt(k) {
  try { return JSON.parse(localStorage.getItem(k || PK_LS) || "{}") || {}; } catch (e) { return {}; }
}
/* ลูกค้าที่เป็น "แพ็คเกจ" — ชื่อมีรุ่นอินเวอร์เตอร์ของ BOQ อยู่ (เช่น "Huawei SUN2000-5K-LB0") ใช้เป็นค่าเลือกเริ่มต้นของรูปสรุป */
const pkIsPkg = (l) => { const m = pkNorm(l.boq && l.boq.inverterModel); return !!m && pkNorm(l.name).indexOf(m) >= 0; };

/* ── ป๊อปตัวอย่าง + ตัวเลือก + ดาวน์โหลด ──
   lead = รูปรายอัน · leads = รูปสรุป (เลือกแพ็คเกจจากลูกค้าที่ BOQ ครบ) */
function PkPosterModal({ lead, leads, stock, quotes, onClose }) {
  const items = (stock && stock.items) || [];
  const sum = !lead && !!leads;
  const sp = React.useMemo(() => (lead ? pkSpec(lead, items) : null), [lead, items]);
  // รูปสรุป: ตัวเลือก = ลูกค้าที่ BOQ ครบ เรียงตามขนาด → เฟส
  const cands = React.useMemo(() => (!sum ? [] : (leads || []).filter((l) => l && !l.trashFrom && l.boq && l.boq.panelModel)
    .map((l) => ({ l: l, sp: pkSpec(l, items) })).filter((c) => c.sp.ok && c.sp.kwp > 0)
    .sort((a, b) => a.sp.kwp - b.sp.kwp || a.sp.phase - b.sp.phase || String(a.l.code || "").localeCompare(String(b.l.code || "")))), [sum, leads, items]);
  const [sel, setSel] = React.useState(() => {
    const sv = pkLoadOpt(PK_SUM_LS);
    return sv && sv.ids ? sv.ids : null;   // null = ยังไม่เคยเลือก → ใช้ลูกค้าแพ็คเกจ
  });
  const selIds = React.useMemo(() => {
    if (!sum) return [];
    const have = cands.map((c) => c.l.id);
    const base = sel ? sel.filter((id) => have.indexOf(id) >= 0) : cands.filter((c) => pkIsPkg(c.l)).map((c) => c.l.id);
    return (base.length || sel ? base : have).slice(0, PK_SUM_MAX);
  }, [sum, sel, cands]);
  const [row, setRow] = React.useState({});   // { [leadId]: { disc, rec } } ไม่บันทึก
  const setR = (id, k, v) => setRow((p) => Object.assign({}, p, { [id]: Object.assign({}, p[id], { [k]: v }) }));
  const toggleSel = (id) => {
    const on = selIds.indexOf(id) >= 0;
    if (!on && selIds.length >= PK_SUM_MAX) return;
    const next = on ? selIds.filter((x) => x !== id) : selIds.concat(id);
    setSel(next);
    try { localStorage.setItem(PK_SUM_LS, JSON.stringify({ ids: next })); } catch (e) { /* โหมดส่วนตัว */ }
  };
  const sumRows = React.useMemo(() => cands.filter((c) => selIds.indexOf(c.l.id) >= 0)
    .map((c) => ({ sp: c.sp, disc: pkNum((row[c.l.id] || {}).disc), rec: !!(row[c.l.id] || {}).rec })), [cands, selIds, row]);
  /* โหมดรูป Add-on แบต + Optimizer — อยู่ในป๊อปรูปสรุป (ขนาด Optimizer ตามแพ็คเกจที่เลือก) */
  const [kind, setKind] = React.useState("sum");
  const addon = sum && kind === "addon";
  const [mg, setMg] = React.useState("15");
  const [mgBig, setMgBig] = React.useState("8");   // กำไร Optimizer ขนาดใหญ่สุด (ติดเยอะถูกลง)
  const ad = React.useMemo(() => (addon ? pkAddon(items, sumRows, pkNum(mg), pkNum(mgBig)) : null), [addon, items, sumRows, mg, mgBig]);
  const addSp = React.useMemo(() => (!ad ? null : { invs: [{ item: items.find((x) => /huawei/i.test(x.brand || "") && x.invType === "hybrid") || null }],
    pItem: null, bat: ad.bI ? 1 : 0, batItem: ad.bI, opt: ad.oI ? 1 : 0, optItem: ad.oI }), [ad && ad.bI, ad && ad.oI, items]);
  const assetSp = addon ? addSp : sum ? (sumRows[0] && sumRows[0].sp) : sp;

  const q = React.useMemo(() => {
    const list = (lead && typeof quotesOfLead === "function" ? quotesOfLead(quotes || [], lead) : []);
    return list.find((x) => (x.warranties || []).length) || null;
  }, [quotes, lead]);
  const saved = React.useMemo(() => pkLoadOpt(), []);
  const [logo, setLogo] = React.useState(saved.logo !== false);
  const [price, setPrice] = React.useState(saved.price !== false);
  const [contact, setContact] = React.useState(saved.contact === true);
  const [vat, setVat] = React.useState(saved.vat === true);
  const [theme, setTheme] = React.useState(PK_THEMES[saved.theme] ? saved.theme : "green");
  const [title, setTitle] = React.useState(PK_TITLE_DEF);
  const [disc, setDisc] = React.useState("");
  const [wty, setWty] = React.useState(() => ((q && q.warranties) || PK_WTY_DEF).join("\n"));
  const [wtyAdd, setWtyAdd] = React.useState("");   // รับประกันรูป Add-on ("" = ตามคลังอัตโนมัติ)
  const [A, setA] = React.useState(null);
  const [coSaved, setCoSaved] = React.useState(null);  // ค่าที่บันทึกไว้ใน RTDB (null = ยังโหลดไม่เสร็จ)
  const [co, setCo] = React.useState(PK_CO_DEF);
  const [coBusy, setCoBusy] = React.useState(false);
  const [markIm, setMarkIm] = React.useState(null);
  const [coOpen, setCoOpen] = React.useState(false);
  const cv = React.useRef(null);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.FBDB) { setCoSaved(PK_CO_DEF); return; }
    const r = window.FBDB.ref(PK_CO_PATH);
    const fn = (s) => {
      const v = Object.assign({}, PK_CO_DEF, s.val() || {});
      setCoSaved(v); setCo(v);
    };
    r.once("value", fn);
    // หัวข้อ/จุดเด่นที่บันทึกไว้ (ใช้ร่วมทุกลูกค้า · ไม่มี = จุดเด่นจากใบเสนอราคา)
    window.FBDB.ref(PK_TX_PATH).once("value", (s) => {
      const v = s.val();
      if (v) { setTxSaved({ title: v.title || "", wty: v.wty || "", wtyAdd: v.wtyAdd || "" }); if (v.title) setTitle(v.title); if (v.wty) setWty(v.wty); if (v.wtyAdd) setWtyAdd(v.wtyAdd); }
      else setTxSaved({ title: "", wty: "", wtyAdd: "" });
    });
  }, []);
  const [txSaved, setTxSaved] = React.useState(null);
  const [txBusy, setTxBusy] = React.useState(false);
  const txDiff = !!txSaved && (title !== (txSaved.title || PK_TITLE_DEF) || (txSaved.wty ? wty !== txSaved.wty : true) || wtyAdd !== (txSaved.wtyAdd || ""));
  const saveTx = () => {
    if (!window.FBDB) return;
    const v = { title: title, wty: wty, wtyAdd: wtyAdd };
    setTxBusy(true);
    window.FBDB.ref(PK_TX_PATH).set(v).then(() => { setTxSaved(v); setTxBusy(false); },
      (e) => { setTxBusy(false); alert("บันทึกไม่สำเร็จ: " + (e && e.message || e)); });
  };
  React.useEffect(() => {
    let live = true;
    if (co.mark) pkImg(co.mark).then((im) => { if (live) setMarkIm(im); }); else setMarkIm(null);
    return () => { live = false; };
  }, [co.mark]);
  const setC = (k, v) => setCo((c) => Object.assign({}, c, { [k]: v }));
  const coDiff = !!coSaved && PK_CO_KEYS.some((k) => (co[k] || "") !== (coSaved[k] || ""));
  const coCustom = PK_CO_KEYS.some((k) => (co[k] || "") !== (PK_CO_DEF[k] || ""));
  const saveCo = () => {
    if (!window.FBDB) return;
    const v = {}; PK_CO_KEYS.forEach((k) => { v[k] = co[k] || ""; });
    setCoBusy(true);
    window.FBDB.ref(PK_CO_PATH).set(v).then(() => { setCoSaved(Object.assign({}, v)); setCoBusy(false); },
      (e) => { setCoBusy(false); alert("บันทึกไม่สำเร็จ: " + (e && e.message || e)); });
  };
  // โลโก้ที่อัปโหลด: ย่อสูงไม่เกิน 240 px เก็บเป็น PNG
  const pickMark = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => pkImg(rd.result).then((im) => {
      if (!im) return;
      const s = Math.min(1, 240 / im.naturalHeight, 600 / im.naturalWidth);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * s)); c.height = Math.max(1, Math.round(im.naturalHeight * s));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      setC("mark", c.toDataURL("image/png"));
    });
    rd.readAsDataURL(f);
  };

  React.useEffect(() => {
    try { localStorage.setItem(PK_LS, JSON.stringify({ logo: logo, price: price, contact: contact, vat: vat, theme: theme })); } catch (e) { /* โหมดส่วนตัว */ }
  }, [logo, price, contact, vat, theme]);
  const assetKey = assetSp ? [assetSp.pItem && assetSp.pItem.id, assetSp.invs[0] && assetSp.invs[0].item && assetSp.invs[0].item.id, addon ? "add" : ""].join("|") : "";
  React.useEffect(() => {
    let live = true;
    Promise.all([pkAssets(assetSp), pkFonts()]).then((r) => { if (live) setA(r[0]); });
    return () => { live = false; };
  }, [assetKey]);
  React.useEffect(() => {
    if (!A || !cv.current) return;
    const o = { theme: theme, logo: logo, contact: contact, price: price, vat: vat, disc: pkNum(disc) || 0, title: title, wty: (addon && ad ? wtyAdd || pkAddonWty(ad, wty) : wty).split("\n").map((s) => s.trim()),
      co: Object.assign({}, co, { markIm: co.mark ? markIm : null }) };
    if (addon) { if (ad && (ad.bats.length || ad.opts.length)) pkDrawAddon(cv.current, A, Object.assign(o, { title: "" }), ad); }
    else if (sum) { if (sumRows.length) pkDrawSum(cv.current, sumRows, A, o); }
    else pkDraw(cv.current, sp, A, o);
  }, [A, sp, sumRows, ad, theme, logo, contact, price, vat, disc, title, wty, wtyAdd, co, markIm]);

  const download = () => {
    if (!cv.current) return;
    const a = document.createElement("a");
    if (addon) a.download = "Add-on แบต + Optimizer " + (((ad.bI || ad.oI) || {}).brand || "") + ".png";
    else if (sum) {
      const ks = sumRows.map((r) => r.sp.kwp);
      a.download = "แพ็คเกจสรุป " + Math.min.apply(null, ks) + "-" + Math.max.apply(null, ks) + " kWp.png";
    } else a.download = "แพ็คเกจ " + sp.kwp + " kWp " + (lead.code || "") + ".png";
    a.href = cv.current.toDataURL("image/png");
    a.click();
  };
  const sw = (on, set, label) => (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
      {label}
      <span onClick={(e) => { e.preventDefault(); set(!on); }} role="switch" aria-checked={on}
        style={{ width: 42, height: 24, borderRadius: 12, background: on ? "var(--primary)" : "var(--surface2)", boxShadow: on ? "none" : "var(--shadow-inset)", position: "relative", flexShrink: 0, transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: 9, background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left .15s" }} />
      </span>
    </label>
  );
  const well = { width: "100%", boxSizing: "border-box", border: "none", background: "var(--surface2)", boxShadow: "var(--shadow-inset)",
    borderRadius: "var(--r-tile)", padding: "9px 11px", fontFamily: "inherit", fontSize: 13, color: "var(--text-1)", outline: "none" };
  const card = { background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", padding: 14, display: "flex", flexDirection: "column", gap: 8 };
  const isMobile = window.innerWidth < 760;
  const ready = addon ? !!ad && (ad.bats.length > 0 || ad.opts.length > 0) : sum ? sumRows.length > 0 : sp.ok;

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8,20,14,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : "var(--r-card)", boxShadow: "var(--shadow-sheet)",
        width: isMobile ? "100%" : "min(1020px,100%)", height: isMobile ? "100%" : "min(880px,94vh)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "var(--surface)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>{sum ? "รูปสรุปแพ็คเกจ" : "รูปแพ็คเกจ · " + (lead.name || lead.code)}</div>
          {sum && (
            <div style={{ display: "flex", gap: 3, padding: 3, borderRadius: 14, background: "var(--surface2)", boxShadow: "var(--shadow-inset)" }}>
              {[["sum", "สรุปแพ็คเกจ"], ["addon", "Add-on แบต + Optimizer"]].map((t) => (
                <button key={t[0]} type="button" onClick={() => setKind(t[0])}
                  style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: "var(--r-pill)", whiteSpace: "nowrap",
                    background: kind === t[0] ? "var(--surface)" : "transparent", color: kind === t[0] ? "var(--text-1)" : "var(--text-3)", boxShadow: kind === t[0] ? "var(--shadow-sm)" : "none" }}>{t[1]}</button>
              ))}
            </div>
          )}
          <button className="x-close" onClick={onClose} aria-label="ปิด" style={{ width: 32, height: 32, borderRadius: "var(--r-pill)", border: "none", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        {!sum && !sp.ok ? (
          <div style={{ padding: 30, color: "var(--text-2)", fontSize: 14 }}>ยังทำรูปไม่ได้ — BOQ ของลูกค้านี้ยังไม่มีรุ่นแผง จำนวนแผง หรืออินเวอร์เตอร์</div>
        ) : sum && !cands.length ? (
          <div style={{ padding: 30, color: "var(--text-2)", fontSize: 14 }}>ยังไม่มีลูกค้าที่ BOQ ครบ (รุ่นแผง · จำนวนแผง · อินเวอร์เตอร์) ให้ทำรูปสรุป</div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: isMobile ? "auto" : "hidden" }}>
            <div style={{ flex: 1, minHeight: isMobile ? 420 : 0, padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {(!A || !ready) && <div style={{ color: "var(--text-3)", fontSize: 13 }}>{!ready ? (addon ? "ไม่พบแบต/Optimizer ในคลัง (" + PK_ADD.bat + " · " + PK_ADD.opt + ")" : "เลือกแพ็คเกจอย่างน้อย 1 รายการ") : "กำลังเตรียมรูป…"}</div>}
              <canvas ref={cv} style={{ display: A && ready ? "block" : "none", maxWidth: "100%", maxHeight: "100%", aspectRatio: "1080 / 1350", height: isMobile ? "auto" : "100%", borderRadius: 14, boxShadow: "var(--shadow-card)" }} />
            </div>
            <div style={{ width: isMobile ? "auto" : 310, flexShrink: 0, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              {addon && ad && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>ราคา Add-on</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", whiteSpace: "nowrap" }}>กำไร ขนาดเล็กสุด</span>
                    <input inputMode="decimal" value={mg} onChange={(e) => setMg(e.target.value)} style={well} />
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", whiteSpace: "nowrap" }}>กำไร ขนาดใหญ่สุด</span>
                    <input inputMode="decimal" value={mgBig} onChange={(e) => setMgBig(e.target.value)} style={well} />
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>%</span>
                  </div>
                  {ad.bats.map((b) => <div key={"b" + b.q} style={{ display: "flex", fontSize: 12.5, color: "var(--text-2)" }}><span style={{ flex: 1 }}>แบต {b.kwh} kWh ({b.q} ก้อน · ก้อนละ ฿{pkFmt(b.p / b.q)})</span><b style={{ color: "var(--text-1)" }}>+฿{pkFmt(b.p)}</b></div>)}
                  {ad.opts.map((c) => <div key={"o" + c.n} style={{ display: "flex", fontSize: 12.5, color: "var(--text-2)" }}><span style={{ flex: 1 }}>Optimizer {c.kwp} kWp ({c.n} ตัว · ตัวละ ฿{pkFmt(c.u)})</span><b style={{ color: "var(--text-1)" }}>+฿{pkFmt(c.p)}</b></div>)}
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45 }}>ราคา = ทุนในคลัง ÷ (1 − กำไร%) ปัดขึ้น (แบตหลักพัน · Optimizer หลัก 500) · กำไรไล่ลงจากขนาดเล็กสุดถึงใหญ่สุดทั้งแบตและ Optimizer ติดเยอะยิ่งถูก · แบตรวม Power Module · ขนาด Optimizer ตามแพ็คเกจที่เลือกด้านล่าง (สูงสุด 5 ขนาด) · ยังไม่รวมค่าแรงติดตั้งแบต</div>
                </div>
              )}
              {sum && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>แพ็คเกจในรูป <span style={{ fontWeight: 600, color: "var(--text-3)", fontSize: 11.5 }}>เลือกได้ {PK_SUM_MAX} · {selIds.length} ที่เลือก</span></div>
                  {cands.map((c) => {
                    const on = selIds.indexOf(c.l.id) >= 0, r = row[c.l.id] || {};
                    return (
                      <div key={c.l.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 10px", borderRadius: "var(--r-tile)",
                        background: on ? "var(--surface2)" : "transparent", boxShadow: on ? "var(--shadow-sm)" : "none" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <input type="checkbox" checked={on} onChange={() => toggleSel(c.l.id)} style={{ accentColor: "var(--primary)", width: 15, height: 15, flexShrink: 0 }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "var(--text-1)" }}>{c.sp.kwp} kWp · {c.sp.phase} เฟส{c.sp.sell ? " · ฿" + pkFmt(c.sp.sell) : ""}</span>
                            <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.l.code} · {c.l.name}</span>
                          </span>
                        </label>
                        {on && !addon && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input inputMode="decimal" placeholder="ส่วนลด ฿" value={r.disc || ""} onChange={(e) => setR(c.l.id, "disc", e.target.value)}
                              style={Object.assign({}, well, { padding: "6px 9px", fontSize: 12 })} />
                            <button type="button" onClick={() => setR(c.l.id, "rec", !r.rec)}
                              style={{ flexShrink: 0, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11.5, fontWeight: 700, padding: "6px 10px", borderRadius: "var(--r-pill)",
                                background: r.rec ? "var(--primary-soft)" : "var(--surface)", color: r.rec ? "var(--primary-dark)" : "var(--text-3)",
                                boxShadow: r.rec ? "inset 0 0 0 1px var(--primary)" : "var(--shadow-sm)" }}>{r.rec ? "✓ " : ""}แนะนำ</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45 }}>ราคา = มูลค่าที่คาดของลูกค้า (ว่าง = ราคาขาย BOQ) · ส่วนลด/แนะนำ ไม่บันทึก</div>
                </div>
              )}
              <div style={Object.assign({}, card, { gap: 12 })}>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>ธีมสี</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, padding: 3, borderRadius: 14, background: "var(--surface2)", boxShadow: "var(--shadow-inset)" }}>
                    {Object.keys(PK_THEMES).map((k) => (
                      <button key={k} type="button" onClick={() => setTheme(k)}
                        style={{ display: "flex", alignItems: "center", gap: 6, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: "var(--r-pill)",
                          background: theme === k ? "var(--surface)" : "transparent", color: theme === k ? "var(--text-1)" : "var(--text-3)", boxShadow: theme === k ? "var(--shadow-sm)" : "none" }}>
                        <span style={{ width: 12, height: 12, borderRadius: 6, background: PK_THEMES[k].sw, flexShrink: 0 }} />{PK_THEMES[k].label}
                      </button>
                    ))}
                  </div>
                </div>
                {sw(logo, setLogo, "โลโก้บริษัท")}
                {sw(contact, setContact, "ข้อมูลติดต่อ")}
                {sw(price, setPrice, "แสดงราคา")}
                {price && sw(vat, setVat, "บวก VAT 7% ในราคา")}
                {price && !sum && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>ราคา ฿{pkFmt(pkPrice(sp.sell, { vat: vat }))} {+lead.expValue ? "(มูลค่าที่คาด" : "(ราคาขาย BOQ"}{vat ? " + VAT)" : ")"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", whiteSpace: "nowrap" }}>ส่วนลด</span>
                      <input inputMode="decimal" placeholder="0" value={disc} onChange={(e) => setDisc(e.target.value)} style={well} />
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>บาท</span>
                    </div>
                    {pkNum(disc) > 0 && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>รูปโชว์ราคาเต็ม ฿{pkFmt(pkPrice(sp.sell, { vat: vat }) + (pkNum(disc)))} ขีดฆ่า</div>}
                  </div>
                )}
              </div>
              <div style={card}>
                <button type="button" onClick={() => setCoOpen(!coOpen)}
                  style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>ข้อมูลบริษัท · ติดต่อ</span>
                  {coDiff && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warning, #B45309)" }}>ยังไม่บันทึก</span>}
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{coOpen ? "▲" : "▼"}</span>
                </button>
                {coOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 52, height: 52, borderRadius: "var(--r-tile)", background: "var(--surface2)", boxShadow: "var(--shadow-inset)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(co.mark || (A && A.mark)) && <img src={co.mark || A.mark.src} alt="" style={{ maxWidth: 44, maxHeight: 44 }} />}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                        <button type="button" className="btn btn-soft" onClick={() => fileRef.current && fileRef.current.click()} style={{ padding: "5px 10px", fontSize: 12 }}>เปลี่ยนรูปโลโก้</button>
                        {co.mark && <button type="button" onClick={() => setC("mark", "")} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 11.5, color: "var(--text-3)", fontFamily: "inherit" }}>ใช้โลโก้เดิม</button>}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={pickMark} style={{ display: "none" }} />
                    </div>
                    {[["name", "ชื่อบริษัท", "ใส่ + ได้ (เป็นสีเขียว)"], ["tag", "บรรทัดรอง", "เช่น CLEAN ENERGY"], ["tel", "เบอร์โทร", ""], ["line", "LINE", "เช่น @flashplussolar"], ["site", "เว็บไซต์", ""]].map((f) => (
                      <label key={f[0]} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)" }}>{f[1]}</span>
                        <input value={co[f[0]] || ""} placeholder={f[2]} onChange={(e) => setC(f[0], e.target.value)} style={well} />
                      </label>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                      <button type="button" className="btn btn-pri" disabled={!coDiff || coBusy} onClick={saveCo} style={{ padding: "7px 14px", fontSize: 12.5 }}>
                        {coBusy ? "กำลังบันทึก…" : coDiff ? "บันทึก" : "บันทึกแล้ว"}
                      </button>
                      {coCustom && <button type="button" onClick={() => setCo(Object.assign({}, PK_CO_DEF))}
                        style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--text-3)", fontFamily: "inherit" }}>คืนค่าบริษัทเดิม</button>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45 }}>บันทึกแล้วใช้ทุกเครื่อง · ชื่อ/โลโก้ขึ้นเมื่อเปิด "โลโก้บริษัท" · เบอร์/LINE/เว็บขึ้นเมื่อเปิด "ข้อมูลติดต่อ"</div>
                  </div>
                )}
              </div>
              <div style={card}>
                {!addon && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>หัวข้อ</div>}
                {!addon && <input value={title} onChange={(e) => setTitle(e.target.value)} style={well} />}
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginTop: 4 }}>รับประกัน · บริการ (บรรทัดละข้อ · ขึ้นในรูป 6 ข้อแรก)</div>
                <textarea value={addon && ad ? wtyAdd || pkAddonWty(ad, wty) : wty} onChange={(e) => (addon ? setWtyAdd : setWty)(e.target.value)} rows={6} style={Object.assign({}, well, { resize: "vertical", lineHeight: 1.5 })} />
                {addon && <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45 }}>รูป Add-on ใช้ชุดรับประกันแยกจากรูปแพ็คเกจ — ปีของแบต/Optimizer ดึงจากคลัง{wtyAdd ? "" : " (ยังไม่ได้แก้)"}{wtyAdd && <button type="button" onClick={() => setWtyAdd("")} style={{ border: "none", background: "none", padding: "0 0 0 6px", cursor: "pointer", fontSize: 11.5, color: "var(--primary-dark)", fontFamily: "inherit" }}>คืนค่าตามคลัง</button>}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                  <button type="button" className="btn btn-pri" disabled={!txDiff || txBusy} onClick={saveTx} style={{ padding: "7px 14px", fontSize: 12.5 }}>
                    {txBusy ? "กำลังบันทึก…" : txDiff ? "บันทึกหัวข้อ · จุดเด่น" : "บันทึกแล้ว"}
                  </button>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45 }}>บันทึกแล้วใช้กับรูปของทุกลูกค้า · ทุกเครื่อง · ไอคอนเลือกเองจากคำ (แผง · อินเวอร์เตอร์ · ติดตั้ง · ล้าง · ขออนุญาต · สำรวจ)</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                รูปสินค้าและโลโก้ยี่ห้อดึงจากรูปในคลังสินค้า{!sum && !sp.pItem ? " · ไม่พบรุ่นแผงนี้ในคลัง" : ""}
              </div>
              <button className="btn btn-pri" disabled={!A || !ready} onClick={download} style={{ marginTop: "auto", padding: "12px 15px" }}>ดาวน์โหลด PNG</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { PkPosterModal, pkSpec, pkDraw, pkDrawSum });
