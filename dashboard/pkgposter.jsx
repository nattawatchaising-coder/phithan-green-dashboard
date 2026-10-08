/* ══════════════════════════════════════════════════
   รูปแพ็คเกจขาย (โพสต์ขาย 1080×1350 · prefix pk/Pk)

   ปุ่ม "รูปแพ็คเกจ" บนหัวใบลูกค้า → ดึงสเปคจาก BOQ ของลูกค้า (แผง · อินเวอร์เตอร์ · เฟส · ราคาขาย)
   วาดลง canvas แล้วดาวน์โหลดเป็น PNG ได้ทันที
   - รูปสินค้า = รูปของรายการในคลัง (stockImg/{id}) · ไม่มี = รูปหมวด (cat_panel / cat_inverter)
   - โลโก้ยี่ห้อ = cat_brand_<ยี่ห้อ> → รูปหมวดย่อยที่เป็นยี่ห้อ (เช่น LONGI = cat_sub6) → ตัวหนังสือ
   - สวิตช์โลโก้บริษัท · เบอร์โทร/เว็บ (แยกกัน · เบอร์ปิดเป็นค่าเริ่ม) จำที่ localStorage
   - ราคา = มูลค่าที่คาด (lead.expValue) → ราคาขาย BOQ · ช่องส่วนลด (ไม่บันทึก) = ราคาเต็มขีดฆ่า (ราคา + ส่วนลด) + ป้าย "ลด ฿…"
   - รูปทั้งหมดเป็น dataURL/ไฟล์โดเมนเดียวกัน canvas จึงไม่ติด CORS ส่งออกได้
   ══════════════════════════════════════════════════ */

const PK_W = 1080, PK_H = 1350;
const PK_YIELD = 1400;   // หน่วย/kWp/ปี (ประมาณ)
const PK_RATE = 4.5;     // บาท/หน่วย
const PK_WTY_DEF = ["รับประกันงานติดตั้ง 5 ปี", "แผงโซลาร์ 15 ปี", "อินเวอร์เตอร์ 5 ปี", "ฟรีล้างแผง 3 ครั้ง", "สำรวจหน้างานฟรี", "รวมขออนุญาตการไฟฟ้า"];
const PK_TH = "'IBM Plex Sans Thai', sans-serif";
const PK_NUM = "'Outfit', 'IBM Plex Sans Thai', sans-serif";

const pkNorm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const pkNum = (v) => +String(v || "").replace(/[^\d.]/g, "") || 0;
const pkFmt = (n) => Math.round(n).toLocaleString("en-US");

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
  return { b: b, pItem: pItem, panelName: b.panelModel || "", n: n, wp: wp, kwp: kwp, invs: invs,
    phase: +b.phase || +((lead.survey || {}).phase) || 1, sell: sell, bat: +b.batteryKwh || 0,
    ok: !!(b.panelModel && n && (invs.length || b.microRatio)) };
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
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const i = (y * W + x) * 4;
      if (d[i + 3] > 20 && Math.min(d[i], d[i + 1], d[i + 2]) < 238) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return im;
    const w = x1 - x0 + 3, h = y1 - y0 + 3, o = document.createElement("canvas");
    o.width = w; o.height = h;
    const og = o.getContext("2d"); og.drawImage(im, Math.max(0, x0 - 1), Math.max(0, y0 - 1), w, h, 0, 0, w, h);
    /* พื้นขาวที่ยังติดอยู่ทำให้โปร่ง — วางบนการ์ดสีอ่อนแล้วไม่เป็นกล่องขาว */
    const od = og.getImageData(0, 0, w, h), p = od.data;
    for (let i = 0; i < p.length; i += 4) {
      const m = Math.min(p[i], p[i + 1], p[i + 2]);
      if (m > 246) p[i + 3] = 0; else if (m > 232) p[i + 3] = Math.round(p[i + 3] * (246 - m) / 14);
    }
    og.putImageData(od, 0, 0);
    return o;
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
async function pkAssets(sp) {
  const inv = sp.invs[0] && sp.invs[0].item;
  const [hero, mark, pPhoto, iPhoto, pLogo, iLogo] = await Promise.all([
    pkImg("dashboard/assets/pkg-house.jpg"),
    pkImg(typeof brandDocURL === "function" ? brandDocURL() : ""),
    pkFirstImg([sp.pItem && sp.pItem.id, "cat_panel"]),
    pkFirstImg([inv && inv.id, "cat_inverter"]),
    pkFirstImg(pkBrandKeys(sp.pItem)),
    pkFirstImg(pkBrandKeys(inv)),
  ]);
  return { hero: hero, mark: mark, pPhoto: pkTrim(pPhoto), iPhoto: pkTrim(iPhoto), pLogo: pkTrim(pLogo), iLogo: pkTrim(iLogo) };
}

/* ── วาด ── */
function pkRR(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function pkContain(g, im, x, y, w, h, alignY) {
  if (!im) return;
  const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
  const s = Math.min(w / iw, h / ih), dw = iw * s, dh = ih * s;
  g.drawImage(im, x + (w - dw) / 2, y + (alignY === "top" ? 0 : (h - dh) / 2), dw, dh);
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

function pkDraw(cv, sp, A, o) {
  const g = cv.getContext("2d");
  cv.width = PK_W; cv.height = PK_H;
  g.imageSmoothingQuality = "high";
  const C = { ink: "#0F2B33", deep: "#0A4D68", leaf: "#1B9B75", green: "#22B36A", sun: "#FCD34D", mute: "#5B6B63", bg: "#EEF3F0" };

  g.fillStyle = C.bg; g.fillRect(0, 0, PK_W, PK_H);

  /* ── hero ── */
  const HH = 590;
  g.save(); g.beginPath(); g.rect(0, 0, PK_W, HH); g.clip();
  /* พื้นหลัง = บ้านติดแผงกลางวันฟ้าใส (assets/pkg-house.jpg) — มืดลงแค่ฝั่งซ้ายบนที่มีตัวหนังสือ ให้เห็นบ้านชัด */
  if (A.hero) pkCover(g, A.hero, 0, 0, PK_W, HH, .3); else { g.fillStyle = C.deep; g.fillRect(0, 0, PK_W, HH); }
  let gr = g.createLinearGradient(0, 0, PK_W * .72, 0);
  gr.addColorStop(0, "rgba(4,28,52,.72)"); gr.addColorStop(.55, "rgba(4,28,52,.38)"); gr.addColorStop(1, "rgba(4,28,52,0)");
  g.fillStyle = gr; g.fillRect(0, 0, PK_W, HH);
  gr = g.createLinearGradient(0, 0, 0, HH);
  gr.addColorStop(0, "rgba(4,28,52,.35)"); gr.addColorStop(.25, "rgba(4,28,52,0)"); gr.addColorStop(.7, "rgba(4,28,40,0)"); gr.addColorStop(1, "rgba(4,32,36,.55)");
  g.fillStyle = gr; g.fillRect(0, 0, PK_W, HH);
  g.restore();

  // แถวบน: โลโก้บริษัท (เปิด/ปิด) · ป้ายเฟส
  let y = 56;
  if (o.logo) {
    const lh = 70;
    if (A.mark) {
      const mw = lh * (A.mark.naturalWidth / A.mark.naturalHeight);
      g.save(); g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 12;
      g.drawImage(A.mark, 52, y, mw, lh); g.restore();
      g.textBaseline = "alphabetic"; g.textAlign = "left";
      let x = 52 + mw + 16;
      g.font = "700 44px " + PK_NUM; g.fillStyle = "#fff";
      g.fillText("flash", x, y + 44); x += g.measureText("flash").width;
      g.fillStyle = C.green; g.fillText("+", x, y + 44); x += g.measureText("+").width;
      g.fillStyle = "#fff"; g.fillText("solar", x, y + 44);
      g.font = "500 15px " + PK_NUM; g.fillStyle = "rgba(255,255,255,.7)";
      g.fillText("C L E A N   E N E R G Y", 52 + mw + 18, y + 68);
    }
  }
  // ป้ายเฟส มุมขวาบน
  const ph = "ระบบ " + sp.phase + " เฟส · ON-GRID";
  g.font = "700 26px " + PK_TH; const pw = g.measureText(ph).width + 44;
  pkRR(g, PK_W - 48 - pw, y + 8, pw, 54, 27); g.fillStyle = "rgba(255,255,255,.16)"; g.fill();
  g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,.35)"; g.stroke();
  g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText(ph, PK_W - 48 - pw / 2, y + 45); g.textAlign = "left";

  // หัวข้อ + ตัวเลขใหญ่
  y = 220;
  g.fillStyle = C.sun; g.font = "700 34px " + PK_TH; g.fillText(o.title || "แพ็คเกจโซลาร์รูฟท็อป", 52, y);
  g.fillStyle = C.sun; g.fillRect(52, y + 18, 70, 6);
  const big = String(sp.kwp);
  g.font = "800 200px " + PK_NUM; g.fillStyle = "#fff";
  g.save(); g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 24; g.fillText(big, 44, y + 210); g.restore();
  const bw = g.measureText(big).width;
  g.font = "700 72px " + PK_NUM; g.fillStyle = "#fff"; g.fillText("kWp", 44 + bw + 18, y + 210);
  const inv0 = sp.invs[0];
  const sub = "แผง " + sp.wp + "W × " + sp.n + " แผ่น" + (inv0 && inv0.kw ? "  ·  อินเวอร์เตอร์ " + inv0.kw + " kW" + (inv0.count > 1 ? " × " + inv0.count : "") : "")
    + (sp.bat ? "  ·  แบต " + sp.bat + " kWh" : "");
  pkFit(g, sub, "600", 32, PK_TH, PK_W - 104, 20); g.fillStyle = "rgba(255,255,255,.88)"; g.fillText(sub, 52, y + 268);

  /* ── การ์ดสินค้า ── */
  const cx = 48, cy = 520, cw = PK_W - 96, ch = 360;
  g.save(); g.shadowColor = "rgba(8,30,24,.28)"; g.shadowBlur = 50; g.shadowOffsetY = 18;
  pkRR(g, cx, cy, cw, ch, 36); g.fillStyle = "#fff"; g.fill(); g.restore();
  const half = cw / 2;
  const prod = (i, logo, brand, photo, model, kind, qty) => {
    const x = cx + i * half, mid = x + half / 2;
    // พื้นอ่อนหลังรูป
    pkRR(g, x + 24, cy + 24, half - 48, 214, 26);
    const pg = g.createLinearGradient(0, cy + 24, 0, cy + 238);
    pg.addColorStop(0, "#F3F7F5"); pg.addColorStop(1, "#E3ECE8"); g.fillStyle = pg; g.fill();
    // โลโก้ยี่ห้อ มุมซ้ายบนของพื้นรูป
    if (logo) {
      g.save(); pkRR(g, x + 40, cy + 40, 150, 50, 14); g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.08)"; g.shadowBlur = 10; g.fill(); g.restore();
      pkContain(g, logo, x + 50, cy + 47, 130, 36);
    } else if (brand) {
      g.font = "800 30px " + PK_NUM; g.fillStyle = C.deep; g.fillText(brand.toUpperCase(), x + 44, cy + 76);
    }
    if (photo) {
      g.save(); g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = 22; g.shadowOffsetY = 10;
      pkContain(g, photo, x + 96, cy + 52, half - 192, 172); g.restore();
    }
    g.fillStyle = C.mute; g.font = "600 22px " + PK_TH; g.textAlign = "center";
    g.fillText(kind, mid, cy + 278);
    pkFit(g, model, "700", 27, PK_TH, half - 56, 16); g.fillStyle = C.ink; g.fillText(model, mid, cy + 312);
    g.font = "700 22px " + PK_TH; const qw = g.measureText(qty).width + 36;
    pkRR(g, mid - qw / 2, cy + 324, qw, 36, 18); g.fillStyle = "#E3F5EC"; g.fill();
    g.fillStyle = C.leaf; g.fillText(qty, mid, cy + 349); g.textAlign = "left";
  };
  const pBrand = sp.pItem && sp.pItem.brand || "", iItem = inv0 && inv0.item, iBrand = iItem && iItem.brand || "";
  prod(0, A.pLogo, pBrand, A.pPhoto, (sp.pItem && sp.pItem.model) || pkSplitModel(sp.panelName, pBrand), "แผงโซลาร์เซลล์", sp.wp + " W × " + sp.n + " แผ่น");
  if (inv0) {
    const invTxt = sp.invs.map((v) => (v.kw ? v.kw + " kW" : "") + " × " + v.count).join(" + ");
    prod(1, A.iLogo, iBrand, A.iPhoto, (iItem && iItem.model) || pkSplitModel(inv0.name, iBrand), "อินเวอร์เตอร์", invTxt + " เครื่อง");
  } else {
    prod(1, null, "", A.iPhoto, "ไมโครอินเวอร์เตอร์", "อินเวอร์เตอร์", "ตามจำนวนแผง");
  }
  // วงกลม + ตรงกลาง
  g.save(); g.shadowColor = "rgba(27,155,117,.45)"; g.shadowBlur = 16;
  g.beginPath(); g.arc(cx + half, cy + 131, 30, 0, Math.PI * 2); g.fillStyle = C.leaf; g.fill(); g.restore();
  g.strokeStyle = "#fff"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath();
  g.moveTo(cx + half - 12, cy + 131); g.lineTo(cx + half + 12, cy + 131); g.moveTo(cx + half, cy + 119); g.lineTo(cx + half, cy + 143); g.stroke();

  /* ── ตัวเลขผลตอบแทน ── */
  const kwh = sp.kwp * PK_YIELD, save = kwh * PK_RATE;
  const tiles = [["ผลิตไฟ", "~" + pkFmt(kwh), "หน่วย/ปี", "#F59E0B"], ["ประหยัดค่าไฟ", "~฿" + pkFmt(save), "ต่อปี", C.leaf]];
  if (o.price && sp.sell && save) tiles.push(["คืนทุน", "~" + (Math.round(sp.sell / save * 10) / 10), "ปี", C.deep]);
  const ty = 898, th = 104, tg = 18, tw = (PK_W - 96 - tg * (tiles.length - 1)) / tiles.length;
  tiles.forEach((t, i) => {
    const x = 48 + i * (tw + tg);
    g.save(); g.shadowColor = "rgba(8,30,24,.10)"; g.shadowBlur = 18; g.shadowOffsetY = 6;
    pkRR(g, x, ty, tw, th, 24); g.fillStyle = "#fff"; g.fill(); g.restore();
    g.fillStyle = t[3]; pkRR(g, x + 22, ty + 22, 8, th - 44, 4); g.fill();
    g.fillStyle = C.mute; g.font = "600 22px " + PK_TH; g.fillText(t[0], x + 46, ty + 40);
    const vs = pkFit(g, t[1], "800", 46, PK_NUM, tw - 70 - 80, 26);
    g.fillStyle = C.ink; g.fillText(t[1], x + 46, ty + 86);
    const vw = g.measureText(t[1]).width;
    g.font = "600 21px " + PK_TH; g.fillStyle = C.mute; g.fillText(t[2], x + 46 + vw + 10, ty + 86);
    void vs;
  });

  /* ── แถบราคา ── */
  const py = 1022, phh = 116;
  g.save(); g.shadowColor = "rgba(10,77,104,.35)"; g.shadowBlur = 24; g.shadowOffsetY = 10;
  pkRR(g, 48, py, PK_W - 96, phh, 30);
  gr = g.createLinearGradient(48, 0, PK_W - 48, 0); gr.addColorStop(0, "#0A4D68"); gr.addColorStop(1, "#13896A");
  g.fillStyle = gr; g.fill(); g.restore();
  g.fillStyle = "#fff"; g.font = "700 32px " + PK_TH; g.fillText(o.price && sp.sell ? "ราคาแพ็คเกจ" : "ติดตั้งครบ จบในที่เดียว", 84, py + 52);
  g.fillStyle = "rgba(255,255,255,.75)"; g.font = "500 21px " + PK_TH; g.fillText("รวมติดตั้ง · ขออนุญาตการไฟฟ้า · ขนส่ง" + (o.price && sp.sell ? " · ยังไม่รวม VAT 7%" : ""), 84, py + 88);
  g.textAlign = "right";
  const disc = o.price && sp.sell ? Math.max(0, +o.disc || 0) : 0;
  if (o.price && sp.sell && disc) {
    // ราคาเต็มขีดฆ่า + ราคาหลังลด
    const full = "฿" + pkFmt(sp.sell + disc);
    g.fillStyle = "rgba(255,255,255,.72)"; g.font = "600 28px " + PK_NUM; g.fillText(full, PK_W - 84, py + 38);
    const fw = g.measureText(full).width;
    g.strokeStyle = "#FCA5A5"; g.lineWidth = 3; g.beginPath(); g.moveTo(PK_W - 84 - fw - 4, py + 29); g.lineTo(PK_W - 80, py + 29); g.stroke();
    g.fillStyle = C.sun; g.font = "800 64px " + PK_NUM; g.fillText("฿" + pkFmt(sp.sell), PK_W - 84, py + 100);
    // ป้ายลด เกาะขอบบนแถบราคา
    const tag = "ลด ฿" + pkFmt(disc);
    g.font = "800 26px " + PK_TH; const tw2 = g.measureText(tag).width + 40;
    g.save(); g.shadowColor = "rgba(185,28,28,.4)"; g.shadowBlur = 12; g.shadowOffsetY = 4;
    pkRR(g, PK_W - 84 - fw - 24 - tw2, py - 20, tw2, 46, 23); g.fillStyle = "#EF4444"; g.fill(); g.restore();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.fillText(tag, PK_W - 84 - fw - 24 - tw2 / 2, py + 12); g.textAlign = "right";
  } else if (o.price && sp.sell) {
    g.fillStyle = C.sun; g.font = "800 72px " + PK_NUM; g.fillText("฿" + pkFmt(sp.sell), PK_W - 84, py + 82);
  } else {
    g.fillStyle = C.sun; g.font = "700 40px " + PK_TH; g.fillText("สอบถามราคาพิเศษ", PK_W - 84, py + 72);
  }
  g.textAlign = "left";

  /* ── ชิปรับประกัน/จุดเด่น (ตัดบรรทัดอัตโนมัติ สูงสุด 2 แถว จัดกลาง) ── */
  const chips = (o.wty || []).filter(Boolean).slice(0, 8);
  g.font = "600 21px " + PK_TH;
  const rows = [[]]; let rw = 0; const maxW = PK_W - 96, gap = 10;
  chips.forEach((t) => {
    const w = g.measureText(t).width + 62;
    if (rw + w > maxW && rows[rows.length - 1].length) { if (rows.length === 2) return; rows.push([]); rw = 0; }
    rows[rows.length - 1].push([t, w]); rw += w + gap;
  });
  let cyy = 1156;
  rows.forEach((r) => {
    const tot = r.reduce((a, c) => a + c[1], 0) + gap * (r.length - 1);
    let x = (PK_W - tot) / 2;
    r.forEach((c) => {
      pkRR(g, x, cyy, c[1], 44, 22); g.fillStyle = "#fff"; g.fill();
      g.beginPath(); g.arc(x + 24, cyy + 22, 11, 0, Math.PI * 2); g.fillStyle = C.leaf; g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 18.5, cyy + 22); g.lineTo(x + 22.5, cyy + 26); g.lineTo(x + 29.5, cyy + 18); g.stroke();
      g.fillStyle = C.ink; g.fillText(c[0], x + 44, cyy + 30);
      x += c[1] + gap;
    });
    cyy += 52;
  });

  /* ── ท้าย ── */
  const fy = PK_H - 44;
  g.fillStyle = C.mute; g.font = "500 16px " + PK_TH; g.textAlign = "center";
  const note = "ผลผลิตประมาณจาก " + pkFmt(PK_YIELD) + " หน่วย/kWp/ปี · ค่าไฟ " + PK_RATE + " บาท/หน่วย · ขึ้นกับทิศ ความชัน และเงาของหลังคาจริง";
  if (o.contact) {
    g.fillText(note, PK_W / 2, fy - 4);
    g.fillStyle = C.deep; g.font = "700 26px " + PK_TH;
    const B = window.BRANDING || (typeof BRANDING !== "undefined" ? BRANDING : {});
    g.fillText("โทร " + (B.tel || "") + "   ·   " + (B.site || ""), PK_W / 2, fy + 32);
  } else {
    g.fillText(note, PK_W / 2, fy + 20);
  }
  g.textAlign = "left";
}

async function pkFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all(["800 40px Outfit", "700 40px Outfit", "500 20px Outfit", "700 30px 'IBM Plex Sans Thai'", "600 30px 'IBM Plex Sans Thai'", "500 20px 'IBM Plex Sans Thai'"]
      .map((f) => document.fonts.load(f, "กขค 0123 kWp")));
  } catch (e) { /* ใช้ฟอนต์สำรอง */ }
}

const PK_LS = "pk_poster_opt";
function pkLoadOpt() {
  try { return JSON.parse(localStorage.getItem(PK_LS) || "{}") || {}; } catch (e) { return {}; }
}

/* ── ป๊อปตัวอย่าง + ตัวเลือก + ดาวน์โหลด ── */
function PkPosterModal({ lead, stock, quotes, onClose }) {
  const items = (stock && stock.items) || [];
  const sp = React.useMemo(() => pkSpec(lead, items), [lead, items]);
  const q = React.useMemo(() => {
    const list = (typeof quotesOfLead === "function" ? quotesOfLead(quotes || [], lead) : []);
    return list.find((x) => (x.warranties || []).length) || null;
  }, [quotes, lead]);
  const saved = React.useMemo(pkLoadOpt, []);
  const [logo, setLogo] = React.useState(saved.logo !== false);
  const [price, setPrice] = React.useState(saved.price !== false);
  const [contact, setContact] = React.useState(saved.contact === true);
  const [title, setTitle] = React.useState("แพ็คเกจโซลาร์รูฟท็อป");
  const [disc, setDisc] = React.useState("");
  const [wty, setWty] = React.useState(() => ((q && q.warranties) || PK_WTY_DEF).join("\n"));
  const [A, setA] = React.useState(null);
  const cv = React.useRef(null);

  React.useEffect(() => {
    try { localStorage.setItem(PK_LS, JSON.stringify({ logo: logo, price: price, contact: contact })); } catch (e) { /* โหมดส่วนตัว */ }
  }, [logo, price, contact]);
  React.useEffect(() => {
    let live = true;
    Promise.all([pkAssets(sp), pkFonts()]).then((r) => { if (live) setA(r[0]); });
    return () => { live = false; };
  }, [sp]);
  React.useEffect(() => {
    if (A && cv.current) pkDraw(cv.current, sp, A, { logo: logo, contact: contact, price: price, disc: pkNum(disc) || 0, title: title, wty: wty.split("\n").map((s) => s.trim()) });
  }, [A, sp, logo, contact, price, disc, title, wty]);

  const download = () => {
    if (!cv.current) return;
    const a = document.createElement("a");
    a.download = "แพ็คเกจ " + sp.kwp + " kWp " + (lead.code || "") + ".png";
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
  const isMobile = window.innerWidth < 760;

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(8,20,14,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)", borderRadius: isMobile ? 0 : "var(--r-card)", boxShadow: "var(--shadow-sheet)",
        width: isMobile ? "100%" : "min(980px,100%)", height: isMobile ? "100%" : "min(860px,94vh)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "var(--surface)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          <div style={{ flex: 1, fontSize: 14.5, fontWeight: 800, color: "var(--text-1)" }}>รูปแพ็คเกจ · {lead.name || lead.code}</div>
          <button className="x-close" onClick={onClose} aria-label="ปิด" style={{ width: 32, height: 32, borderRadius: "var(--r-pill)", border: "none", background: "var(--surface2)", boxShadow: "var(--shadow-sm)", color: "var(--text-2)", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        {!sp.ok ? (
          <div style={{ padding: 30, color: "var(--text-2)", fontSize: 14 }}>ยังทำรูปไม่ได้ — BOQ ของลูกค้านี้ยังไม่มีรุ่นแผง จำนวนแผง หรืออินเวอร์เตอร์</div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: isMobile ? "auto" : "hidden" }}>
            <div style={{ flex: 1, minHeight: isMobile ? 420 : 0, padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!A && <div style={{ color: "var(--text-3)", fontSize: 13 }}>กำลังเตรียมรูป…</div>}
              <canvas ref={cv} style={{ display: A ? "block" : "none", maxWidth: "100%", maxHeight: "100%", aspectRatio: "1080 / 1350", height: isMobile ? "auto" : "100%", borderRadius: 14, boxShadow: "var(--shadow-card)" }} />
            </div>
            <div style={{ width: isMobile ? "auto" : 290, flexShrink: 0, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {sw(logo, setLogo, "โลโก้บริษัท")}
                {sw(contact, setContact, "เบอร์โทร · เว็บไซต์")}
                {sw(price, setPrice, "แสดงราคา")}
                {price && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>ราคา ฿{pkFmt(sp.sell)} {+lead.expValue ? "(มูลค่าที่คาด)" : "(ราคาขาย BOQ)"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", whiteSpace: "nowrap" }}>ส่วนลด</span>
                      <input inputMode="decimal" placeholder="0" value={disc} onChange={(e) => setDisc(e.target.value)} style={well} />
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>บาท</span>
                    </div>
                    {pkNum(disc) > 0 && <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>รูปโชว์ราคาเต็ม ฿{pkFmt(sp.sell + (pkNum(disc)))} ขีดฆ่า</div>}
                  </div>
                )}
              </div>
              <div style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)", borderRadius: "var(--r-card)", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>หัวข้อ</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={well} />
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginTop: 4 }}>จุดเด่น (บรรทัดละข้อ)</div>
                <textarea value={wty} onChange={(e) => setWty(e.target.value)} rows={6} style={Object.assign({}, well, { resize: "vertical", lineHeight: 1.5 })} />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.5 }}>
                รูปสินค้าและโลโก้ยี่ห้อดึงจากรูปในคลังสินค้า{!sp.pItem ? " · ไม่พบรุ่นแผงนี้ในคลัง" : ""}
              </div>
              <button className="btn btn-pri" disabled={!A} onClick={download} style={{ marginTop: "auto", padding: "12px 15px" }}>ดาวน์โหลด PNG</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { PkPosterModal, pkSpec, pkDraw });
