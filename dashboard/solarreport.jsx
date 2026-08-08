/* ============================================================
   PHITHAN GREEN — รายงานออกแบบระบบ + ผลตรวจวัด + ผลตอบแทน (PDF)
   ------------------------------------------------------------
   สร้างเป็นหน้าเว็บเดี่ยว ๆ ในหน้าต่างใหม่แล้วสั่งพิมพ์ → "บันทึกเป็น PDF"
   ตั้งใจไม่พึ่งไลบรารีนอก เพราะรายงานต้องออกได้แม้เน็ตหน้างานไม่ดี
   ตัวเลขทุกตัวรับมาจากหน้าจอที่คำนวณไว้แล้ว ไม่คำนวณซ้ำ — รายงานกับหน้าจอจึงตรงกันเสมอ
   ============================================================ */
const RP_ESC = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rpN = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }) : "—"; };

/* โลโก้จริงของบริษัท — หน้าต่างรายงานเปิดจาก about:blank พาธสัมพัทธ์จึงใช้ไม่ได้ ต้องทำเป็น URL เต็ม */
const rpLogoURL = () => { try { return new URL("dashboard/assets/phithan-mark.png", location.href).href; } catch (e) { return ""; } };

/* ตารางแบบสั้น ๆ: rpTable([หัวคอลัมน์], [[แถว]], ตัวเลือก) */
function rpTable(head, rows, opt) {
  opt = opt || {};
  const th = head.map((h) => "<th" + (opt.right && opt.right.indexOf(h) >= 0 ? ' class="r"' : "") + ">" + RP_ESC(h) + "</th>").join("");
  const tb = rows.map((r) => "<tr>" + r.map((c, i) => {
    const cell = c && typeof c === "object" ? c : { v: c };
    return "<td" + (cell.cls ? ' class="' + cell.cls + '"' : "") + (cell.style ? ' style="' + cell.style + '"' : "") + ">" + (cell.html || RP_ESC(cell.v)) + "</td>";
  }).join("") + "</tr>").join("");
  return '<table class="t"><thead><tr>' + th + "</tr></thead><tbody>" + tb + "</tbody></table>";
}

const rpCard = (k, v, u, tone) =>
  '<div class="kpi' + (tone ? " " + tone : "") + '"><span class="k">' + RP_ESC(k) + '</span><span class="v">' + RP_ESC(v) +
  (u ? '<small>' + RP_ESC(u) + "</small>" : "") + "</span></div>";

/* กราฟแท่งรายเดือน */
function rpMonthly(data) {
  const W = 720, H = 150, B = 22, T = 14;
  const max = Math.max.apply(null, data.concat([1]));
  const bw = W / data.length * 0.62;
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    data.map((v, i) => {
      const x = W / data.length * i + (W / data.length - bw) / 2;
      const h = Math.max(1, v / max * (H - T - B));
      return '<rect x="' + x.toFixed(1) + '" y="' + (H - B - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="#22A35B"/>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - B - h - 4).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#5B6B63">' + Math.round(v / 100) / 10 + 'k</text>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="9" fill="#8A968F">' + SC_MON[i].replace(".", "") + "</text>";
    }).join("") + "</svg>";
}

/* กราฟกระแสเงินสดสะสม */
function rpCash(roi) {
  const W = 720, H = 165, T = 12, B = 20;
  const rows = roi.rows;
  const lo = Math.min(-roi.capex, 0), hi = Math.max(1, rows[rows.length - 1].cum);
  const X = (i) => i / rows.length * W;
  const Y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const bw = W / rows.length * 0.7;
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    '<line x1="0" y1="' + Y(0).toFixed(1) + '" x2="' + W + '" y2="' + Y(0).toFixed(1) + '" stroke="#C9D3CD" stroke-width="1"/>' +
    rows.map((r, i) => '<rect x="' + X(i).toFixed(1) + '" y="' + Math.min(Y(r.cum), Y(0)).toFixed(1) + '" width="' + bw.toFixed(1) +
      '" height="' + Math.max(1, Math.abs(Y(r.cum) - Y(0))).toFixed(1) + '" rx="1.5" fill="' + (r.cum >= 0 ? "#22A35B" : "#C9D3CD") + '"/>').join("") +
    (roi.payback != null && roi.payback <= rows.length
      ? '<line x1="' + X(roi.payback).toFixed(1) + '" y1="' + T + '" x2="' + X(roi.payback).toFixed(1) + '" y2="' + (H - B) +
        '" stroke="var(--tint-amber-tx)" stroke-width="1.4" stroke-dasharray="4 3"/><text x="' + (X(roi.payback) + 5).toFixed(1) + '" y="' + (T + 10) +
        '" font-size="10" font-weight="700" fill="var(--tint-amber-tx)">คืนทุนปีที่ ' + roi.payback + "</text>" : "") +
    rows.map((r, i) => (i % 5 === 4 || i === 0)
      ? '<text x="' + (X(i) + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9" fill="#8A968F">' + r.year + "</text>" : "").join("") +
    "</svg>";
}

/* เส้น I-V สำหรับรายงาน (ขาวดำอ่านง่าย พิมพ์แล้วไม่เละ) */
function rpIv(exp, stcRef, meas) {
  const W = 340, H = 190, L = 34, R = 10, T = 10, B = 22;
  if (!exp) return "";
  const vTop = Math.max(exp.voc, stcRef ? stcRef.voc : 0) * 1.06;
  const iTop = Math.max(exp.isc, stcRef ? stcRef.isc : 0) * 1.15;
  const X = (v) => L + v / vTop * (W - L - R);
  const Y = (i) => H - B - i / iTop * (H - T - B);
  const line = (c) => c.pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + Y(q.i).toFixed(1)).join(" ");
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#C9D3CD"/>' +
    '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" stroke="#C9D3CD"/>' +
    (stcRef ? '<path d="' + line(stcRef) + '" fill="none" stroke="#A8B4AE" stroke-width="1.1" stroke-dasharray="4 3"/>' : "") +
    '<path d="' + line(exp) + '" fill="none" stroke="#22A35B" stroke-width="1.9"/>' +
    '<circle cx="' + X(exp.vmp).toFixed(1) + '" cy="' + Y(exp.imp).toFixed(1) + '" r="3.2" fill="#fff" stroke="#22A35B" stroke-width="1.8"/>' +
    (meas && meas.voc ? '<circle cx="' + X(meas.voc).toFixed(1) + '" cy="' + Y(0).toFixed(1) + '" r="3.2" fill="#2563EB"/>' : "") +
    (meas && meas.isc ? '<circle cx="' + X(0).toFixed(1) + '" cy="' + Y(meas.isc).toFixed(1) + '" r="3.2" fill="#2563EB"/>' : "") +
    (meas && meas.vmp && meas.imp ? '<circle cx="' + X(meas.vmp).toFixed(1) + '" cy="' + Y(meas.imp).toFixed(1) + '" r="3.6" fill="#2563EB" stroke="#fff" stroke-width="1.2"/>' : "") +
    '<text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="8.5" fill="#8A968F">V</text>' +
    '<text x="' + (L - 4) + '" y="' + (T + 8) + '" text-anchor="end" font-size="8.5" fill="#8A968F">A</text>' +
    "</svg>";
}

/* ผังแผงมองจากด้านบน ระบายสีตามสตริง — ช่างใช้เดินตามผังนี้ที่หน้างานได้เลย */
function rpLayout(foot, assign, labels) {
  if (!foot || !foot.panels || !foot.panels.length) return "";
  const b = foot.bounds, pad = 1.2;
  const W = (b.maxX - b.minX) + pad * 2, H = (b.maxZ - b.minZ) + pad * 2;
  const vb = (b.minX - pad) + " " + (b.minZ - pad) + " " + Math.max(1, W) + " " + Math.max(1, H);
  const poly = (pts, fill, stroke, sw, dash) => '<polygon points="' + pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ") +
    '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
  return '<svg viewBox="' + vb + '" class="chart" style="max-height:300px" preserveAspectRatio="xMidYMid meet">' +
    foot.outlines.map((o) => poly(o.pts, "#F1F4F2", "#C9D3CD", 0.06)).join("") +
    foot.panels.map((p) => {
      const s = (assign || {})[p.uid] || 0;
      return poly(p.pts, s ? suColor(s) : "#E3E8E6", "#fff", 0.03, s ? null : "0.1 0.08");
    }).join("") +
    /* ป้ายเฟสบนแผงแต่ละใบ — ขอบดำบาง ๆ ให้อ่านออกทั้งบนสีอ่อนและสีเข้ม */
    (labels ? foot.panels.map((p) => {
      const t = labels[p.uid];
      if (!t) return "";
      const cx = p.pts.reduce((a, q) => a + q[0], 0) / p.pts.length;
      const cz = p.pts.reduce((a, q) => a + q[1], 0) / p.pts.length;
      return '<text x="' + cx.toFixed(2) + '" y="' + (cz + 0.16).toFixed(2) + '" text-anchor="middle" font-size="0.44" ' +
        'font-weight="700" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="0.05" paint-order="stroke">' + RP_ESC(t) + "</text>";
    }).join("") : "") +
    '<g transform="translate(' + (b.minX - pad + 0.7) + "," + (b.minZ - pad + 0.8) + ')">' +
    '<line x1="0" y1="0" x2="0" y2="1" stroke="#B3261E" stroke-width="0.08"/>' +
    '<text x="0" y="-0.15" font-size="0.55" font-weight="700" fill="#B3261E" text-anchor="middle">N</text></g></svg>';
}

/* กราฟความเข้มแสงตลอดวัน + แถบเงารายชั่วโมง (สำหรับรายงาน) */
function rpDayLight(sim, groups) {
  if (!sim || !sim.rows.length) return "";
  const W = 720, H = 210, L = 44, R = 12, T = 12, B = 26;
  const top = Math.max(200, sim.maxGhi, sim.maxPoa) * 1.1;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5), h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = (h) => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Y = (v) => H - B - v / top * (H - T - B);
  const net = (r) => { let s = 0, n = 0; (groups || []).forEach((g) => { const p = r.per[g.key]; if (p) { s += p.poaNet * g.count; n += g.count; } }); return n ? s / n : 0; };
  const path = (f) => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Y(f(r)).toFixed(1)).join(" ");
  const ticks = [];
  for (let h = Math.ceil(h0); h <= h1; h++) if (h % 2 === 0) ticks.push(h);
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    '<defs><pattern id="rpHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
    '<rect width="6" height="6" fill="rgba(71,85,105,.16)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#475569" stroke-width="2" opacity=".5"/></pattern></defs>' +
    [0, 0.25, 0.5, 0.75, 1].map((f) =>
      '<line x1="' + L + '" y1="' + Y(top * f).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(top * f).toFixed(1) +
      '" stroke="#E3E8E6" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (Y(top * f) + 3.5).toFixed(1) +
      '" text-anchor="end" font-size="8.5" fill="#8A968F">' + Math.round(top * f) + "</text>").join("") +
    '<path d="' + path((r) => r.poaAvg) + " " + sim.rows.slice().reverse().map((r) => "L" + X(r.h).toFixed(1) + " " + Y(net(r)).toFixed(1)).join(" ") +
    ' Z" fill="url(#rpHatch)"/>' +
    '<path d="' + path(net) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Y(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Y(0) +
    ' Z" fill="rgba(34,163,91,.18)"/>' +
    '<path d="' + path((r) => r.ghi) + '" fill="none" stroke="#A8B4AE" stroke-width="1.2" stroke-dasharray="5 4"/>' +
    '<path d="' + path(net) + '" fill="none" stroke="#22A35B" stroke-width="2"/>' +
    ticks.map((h) => '<text x="' + X(h).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + h + ":00</text>").join("") +
    '<text x="' + (L - 6) + '" y="' + (T - 2) + '" text-anchor="end" font-size="8" fill="#8A968F">W/m²</text></svg>' +
    '<p class="legend"><b style="color:#A8B4AE">┅</b> แสงบนพื้นราบ &nbsp;&nbsp; <b style="color:#22A35B">━</b> แสงบนหน้าแผงจริง (หลังหักเงา)' +
    (sim.shadeFrom != null ? ' &nbsp;&nbsp; <b style="color:#475569">▨</b> ส่วนที่เงาบังกินไป' : "") + "</p>" +
    /* แถบเงารายชั่วโมงรายกลุ่ม */
    (sim.shadeFrom != null
      ? '<table class="strip">' + (groups || []).map((g) =>
          "<tr><td>" + RP_ESC(g.roofName + (g.side ? " · " + g.side : "")) + "</td><td>" +
          '<span class="bar">' + sim.rows.map((r) => {
            const v = r.per[g.key] ? r.per[g.key].shade : 0;
            const c = v <= 0.5 ? "#EDF1EF" : v < 15 ? "var(--tint-amber-bd)" : v < 40 ? "#F59E0B" : "var(--tint-red-tx2)";
            return '<i style="background:' + c + '"></i>';
          }).join("") + "</span></td></tr>").join("") +
        "</table>" +
        '<p class="legend"><span style="float:left">' + ivHM(h0) + '</span><span style="float:right">' + ivHM(h1) + "</span>" +
        '<b style="color:#EDF1EF">■</b> ไม่มีเงา &nbsp; <b style="color:var(--tint-amber-bd)">■</b> บังบางส่วน &nbsp; ' +
        '<b style="color:#F59E0B">■</b> บังมาก &nbsp; <b style="color:var(--tint-red-tx2)">■</b> บังเกือบหมด</p>'
      : "");
}

/* ── กำลังไฟ (DC/AC) + อุณหภูมิเซลล์ ตลอดวัน ของเดือนหนึ่ง ──
   ใช้ cells ของเดือนนั้นจาก ivYearSim (ทุกครึ่งชั่วโมง) แกนซ้าย = kW · แกนขวา = °C */
function rpDayPower(mo, acKw) {
  if (!mo || !mo.cells || !mo.cells.length) return "";
  const W = 720, H = 216, L = 46, R = 48, T = 30, B = 26;
  const h0 = Math.max(4.5, (mo.sunrise || 6) - 0.5), h1 = Math.min(20, (mo.sunset || 18.5) + 0.5);
  const cs = mo.cells.filter((c) => c.h >= h0 - 0.01 && c.h <= h1 + 0.01);
  if (cs.length < 2) return "";
  const pTop = Math.max(0.5, cs.reduce((a, c) => Math.max(a, c.dc || 0), 0)) * 1.14;
  const tTop = 90;
  const X = (h) => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Yp = (v) => H - B - v / pTop * (H - T - B);
  const Yt = (v) => H - B - v / tTop * (H - T - B);
  const path = (arr, f, Yf) => arr.map((c, i) => (i ? "L" : "M") + X(c.h).toFixed(1) + " " + Yf(f(c)).toFixed(1)).join(" ");
  /* ช่องนอกช่วงที่ดวงอาทิตย์ขึ้นไม่มีข้อมูล (tCell = 0) ถ้าลากเส้นผ่านจะได้ขาหักดิ่งลงศูนย์ที่หัวท้าย
     เส้นอุณหภูมิจึงวาดเฉพาะช่วงที่มีแดดจริง */
  const ts = cs.filter((c) => c.tCell > 0);
  const pk = cs.reduce((a, c) => (c.ac > a.ac ? c : a), cs[0]);
  const tk = (ts.length ? ts : cs).reduce((a, c) => (c.tCell > a.tCell ? c : a), (ts.length ? ts : cs)[0]);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    [0, 0.5, 1].map((f) =>
      '<line x1="' + L + '" y1="' + Yp(pTop * f).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Yp(pTop * f).toFixed(1) +
      '" stroke="#E3E8E6" stroke-width="1"/>' +
      '<text x="' + (L - 6) + '" y="' + (Yp(pTop * f) + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' +
      (Math.round(pTop * f * 10) / 10) + "</text>" +
      '<text x="' + (W - R + 6) + '" y="' + (Yt(tTop * f) + 3.5).toFixed(1) + '" font-size="8.5" font-weight="700" fill="#C4342B">' +
      Math.round(tTop * f) + "</text>").join("") +
    '<text x="' + (L - 6) + '" y="' + (T - 14) + '" text-anchor="end" font-size="8" font-weight="700" fill="#8A968F">kW</text>' +
    '<text x="' + (W - R + 6) + '" y="' + (T - 14) + '" font-size="8" font-weight="700" fill="#C4342B">°C</text>' +
    (acKw > 0 && acKw < pTop
      ? '<line x1="' + L + '" y1="' + Yp(acKw).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Yp(acKw).toFixed(1) +
        '" stroke="var(--tint-amber-tx)" stroke-width="1.2" stroke-dasharray="5 3"/><text x="' + (W - R - 2) + '" y="' + (Yp(acKw) - 4).toFixed(1) +
        '" text-anchor="end" font-size="8.5" font-weight="700" fill="var(--tint-amber-tx)">เพดานอินเวอร์เตอร์ ' + acKw + " kW</text>" : "") +
    '<path d="' + path(cs, (c) => c.dc, Yp) + " L" + X(cs[cs.length - 1].h).toFixed(1) + " " + Yp(0) + " L" + X(cs[0].h).toFixed(1) + " " + Yp(0) +
    ' Z" fill="rgba(34,163,91,.13)"/>' +
    '<path d="' + path(cs, (c) => c.dc, Yp) + '" fill="none" stroke="#22A35B" stroke-width="1.2" stroke-dasharray="4 3"/>' +
    '<path d="' + path(cs, (c) => c.ac, Yp) + '" fill="none" stroke="#0F7A43" stroke-width="2.1" stroke-linejoin="round"/>' +
    (ts.length > 1 ? '<path d="' + path(ts, (c) => c.tCell, Yt) + '" fill="none" stroke="#C4342B" stroke-width="1.5" stroke-linejoin="round"/>' : "") +
    '<circle cx="' + X(pk.h).toFixed(1) + '" cy="' + Yp(pk.ac).toFixed(1) + '" r="3.2" fill="#fff" stroke="#0F7A43" stroke-width="1.8"/>' +
    '<text x="' + clamp(X(pk.h), L + 36, W - R - 36).toFixed(1) + '" y="' + (Yp(pk.ac) - 7).toFixed(1) +
    '" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0F7A43">สูงสุด ' + (Math.round(pk.ac * 100) / 100) + " kW</text>" +
    '<circle cx="' + X(tk.h).toFixed(1) + '" cy="' + Yt(tk.tCell).toFixed(1) + '" r="3" fill="#fff" stroke="#C4342B" stroke-width="1.6"/>' +
    '<text x="' + clamp(X(tk.h), L + 32, W - R - 32).toFixed(1) + '" y="' + (Yt(tk.tCell) - 6).toFixed(1) +
    '" text-anchor="middle" font-size="9" font-weight="700" fill="#C4342B">ร้อนสุด ' + Math.round(tk.tCell) + "°C</text>" +
    [6, 8, 10, 12, 14, 16, 18].filter((h) => h >= h0 && h <= h1).map((h) =>
      '<text x="' + X(h).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + h + ":00</text>").join("") +
    "</svg>" +
    '<p class="legend"><b style="color:#0F7A43">━</b> กำลังไฟที่ออกจากอินเวอร์เตอร์ (AC) &nbsp;&nbsp; ' +
    '<b style="color:#22A35B">┅</b> กำลังไฟจากแผง (DC) &nbsp;&nbsp; <b style="color:#C4342B">━</b> อุณหภูมิเซลล์ (แกนขวา)</p>';
}

/* ── แผนที่ทั้งปี เดือน × ชั่วโมง ──
   mode "light" = แสงบนหน้าแผง · mode "shade" = โดนเงาบังกี่ % ณ ชั่วโมงนั้น */
function rpYearMap(year, mode) {
  if (!year || !year.months.length) return "";
  const colLight = (v) => {
    if (v <= 2) return "#EFF2F0";
    const t = Math.max(0, Math.min(1, v / Math.max(1, year.maxPoa)));
    const stops = [[219, 234, 254], [134, 211, 180], [74, 179, 122], [250, 204, 21], [245, 158, 11]];
    const f = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(f)), k = f - i;
    return "rgb(" + [0, 1, 2].map((j) => Math.round(stops[i][j] + (stops[i + 1][j] - stops[i][j]) * k)).join(",") + ")";
  };
  const colShade = (v, poa) => (poa <= 2 ? "#EFF2F0" : v <= 0.5 ? "#E8F5ED" : v < 15 ? "var(--tint-amber-bd)" : v < 40 ? "#F59E0B" : "var(--tint-red-tx2)");
  const hdr = year.hours.map((h) => '<i class="hh">' + (h % 2 === 0 ? h : "") + "</i>").join("");
  const rows = year.months.map((mo) => {
    const val = mode === "shade" ? mo.shadeLossPct + "%" : Math.round(mo.monthKwh / 100) / 10 + "k";
    const cls = mode === "shade" ? (mo.shadeLossPct >= 5 ? "bad" : mo.shadeLossPct > 0 ? "warn" : "") : "";
    return '<tr><td class="mo">' + RP_ESC(mo.label.replace(".", "")) + '</td><td><span class="hm">' +
      mo.cells.map((c) => '<i style="background:' + (mode === "shade" ? colShade(c.shade, c.poa) : colLight(c.poa)) + '"></i>').join("") +
      '</span></td><td class="mv ' + cls + '">' + val + "</td></tr>";
  }).join("");
  const legend = mode === "shade"
    ? '<b style="color:#E8F5ED">■</b> ไม่มีเงา &nbsp; <b style="color:var(--tint-amber-bd)">■</b> บังบางส่วน &nbsp; ' +
      '<b style="color:#F59E0B">■</b> บังมาก &nbsp; <b style="color:var(--tint-red-tx2)">■</b> บังเกือบหมด &nbsp;·&nbsp; ขวาสุด = เสียไปกี่ % ของเดือนนั้น'
    : 'อ่อน = แดดน้อย &nbsp; <b style="color:#4AB37A">■</b> ปานกลาง &nbsp; <b style="color:#F59E0B">■</b> แรงสุด ' +
      year.maxPoa + " W/m² &nbsp;·&nbsp; ขวาสุด = ผลผลิตทั้งเดือน (kWh)";
  return '<table class="ymap"><tr><td class="mo"></td><td><span class="hm hdr">' + hdr + '</span></td><td class="mv"></td></tr>' +
    rows + '</table><p class="legend">' + legend + "</p>";
}

/* ── เส้น I-V ของทุกสตริงในกราฟเดียว (แยกสีตามสตริง) ── */
function rpIvAll(curves, stcRef) {
  const list = (curves || []).filter((x) => x && x.curve);
  if (!list.length) return "";
  /* สูงกว่าปกติตั้งใจ — เส้น I-V หลายเส้นทับกันแถวหัวเข่า ต้องมีพื้นที่แนวตั้งพอถึงจะแยกออก
     และเผื่อที่ให้กรอบชื่อเส้นมุมขวาบนโดยไม่บีบกราฟ */
  const W = 720, H = 390, L = 48, R = 54, T = 18, B = 32;
  const mx = (f) => list.reduce((a, x) => Math.max(a, f(x.curve)), 0);
  const vTop = Math.max(mx((c) => c.voc), stcRef ? stcRef.voc : 0) * 1.07;
  const iTop = Math.max(mx((c) => c.isc), stcRef ? stcRef.isc : 0) * 1.16;
  const pTop = Math.max(mx((c) => c.pmax), stcRef ? stcRef.pmax : 0) * 1.16;
  const X = (v) => L + v / vTop * (W - L - R);
  const Yi = (i) => H - B - i / iTop * (H - T - B);
  const iv = (c) => c.pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + Yi(q.i).toFixed(1)).join(" ");
  const gI = 4, gV = 5;
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    Array.from({ length: gI + 1 }).map((_, k) => {
      const y = T + (H - T - B) * k / gI;
      return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) +
        '" stroke="#E3E8E6" stroke-width="1"/>' +
        '<text x="' + (L - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' +
        (Math.round(iTop * (1 - k / gI) * 10) / 10) + "</text>" +
        '<text x="' + (W - R + 7) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="8.5" font-weight="700" fill="var(--tint-amber-tx)">' +
        (() => { const p = pTop * (1 - k / gI); return p >= 1000 ? Math.round(p / 100) / 10 + "k" : Math.round(p); })() + "</text>";
    }).join("") +
    Array.from({ length: gV + 1 }).map((_, k) => {
      const v = vTop * k / gV;
      return (k ? '<line x1="' + X(v).toFixed(1) + '" y1="' + T + '" x2="' + X(v).toFixed(1) + '" y2="' + (H - B) +
        '" stroke="#EEF1F0" stroke-width="1"/>' : "") +
        '<text x="' + X(v).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + Math.round(v) + "</text>";
    }).join("") +
    '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#C9D3CD" stroke-width="1.1"/>' +
    '<text x="' + (L - 7) + '" y="' + (T - 5) + '" text-anchor="end" font-size="8" font-weight="700" fill="#8A968F">A</text>' +
    '<text x="' + (W - R + 7) + '" y="' + (T - 5) + '" font-size="8" font-weight="700" fill="var(--tint-amber-tx)">W</text>' +
    '<text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" font-size="8.5" fill="#8A968F">แรงดัน (V)</text>' +
    (stcRef ? '<path d="' + iv(stcRef) + '" fill="none" stroke="#A8B4AE" stroke-width="1.2" stroke-dasharray="5 4"/>' : "") +
    list.map((x) => '<path d="' + iv(x.curve) + '" fill="none" stroke="' + x.color + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="' + X(x.curve.vmp).toFixed(1) + '" cy="' + Yi(x.curve.imp).toFixed(1) + '" r="3.4" fill="#fff" stroke="' + x.color + '" stroke-width="1.9"/>').join("") +
    /* ── กรอบชื่อเส้น + กำลัง วางในกราฟมุมซ้ายล่าง ──
       ตัวเลขกำลังเคยเขียนลอยบนเส้น พอหลายเส้นค่าใกล้กันก็ทับกันจนอ่านไม่ออก
       มุมซ้ายล่าง (แรงดันต่ำ–กระแสต่ำ) เป็นที่ว่างเสมอสำหรับเส้น I-V เพราะช่วงแรงดันต่ำ
       กระแสยังอยู่ที่ Isc ด้านบนสุด — ปลอดภัยกว่ามุมขวาบนที่เส้นอ้างอิง STC พาดผ่าน */
    (() => {
      const rows = list.map((x) => ({ c: x.color, t: x.name, v: rpN(scNum(x.watt, x.curve.pmax)) + " W" }))
        .concat([{ c: null, t: "ที่มาตรฐาน STC (1000 W/m² · 25°C)", v: "" }]);
      const cols = rows.length > 10 ? 2 : 1;
      const per = Math.ceil(rows.length / cols);
      const rh = 12.5, cw = cols > 1 ? 176 : 196, pad = 7;
      const bw = cw * cols + pad, bh = per * rh + pad * 1.6;
      const bx = L + 58, by = H - B - bh - 14;
      return '<g><rect x="' + bx.toFixed(1) + '" y="' + by + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) +
        '" rx="6" fill="#fff" fill-opacity=".93" stroke="#D8E0DB" stroke-width="1"/>' +
        rows.map((r, i) => {
          const cx = bx + pad + Math.floor(i / per) * cw, cy = by + pad + (i % per) * rh + 7;
          return (r.c
            ? '<rect x="' + cx.toFixed(1) + '" y="' + (cy - 3.4).toFixed(1) + '" width="12" height="3" rx="1.5" fill="' + r.c + '"/>'
            : '<rect x="' + cx.toFixed(1) + '" y="' + (cy - 3.4).toFixed(1) + '" width="12" height="3" rx="1.5" fill="#A8B4AE" fill-opacity=".55"/>') +
            '<text x="' + (cx + 17).toFixed(1) + '" y="' + cy.toFixed(1) + '" font-size="8.5" font-weight="' + (r.c ? 700 : 600) +
            '" fill="' + (r.c ? "#3A4A43" : "#8A968F") + '">' + RP_ESC(r.t) + "</text>" +
            (r.v ? '<text x="' + (cx + cw - 12).toFixed(1) + '" y="' + cy.toFixed(1) +
              '" text-anchor="end" font-size="8.5" font-weight="800" fill="#16211D">' + RP_ESC(r.v) + "</text>" : "");
        }).join("") + "</g>";
    })() +
    "</svg>";
}

/* ── แผนภาพค่าสูญเสีย (Sankey) ──
   ลำน้ำสีเขียวไหลลง ความกว้าง = พลังงานที่ยังเหลือ · สายที่แยกออกข้างทาง = ที่เสียไปในด่านนั้น
   วาดแบบเดียวกับบนหน้าจอเป๊ะ ๆ ลูกค้าเปิดรายงานแล้วจะเห็นภาพเดียวกับที่ช่างเห็น */
function rpLossFlow(chain) {
  const rows = (chain || []).filter(Boolean);
  if (!rows.length) return "";
  const top = rows.reduce((a, r) => Math.max(a, r.kwh || 0), 1);
  const W = 700, X0 = 30, TW = 148, XL = 262, LX = 274;
  const HL = 46, HM = 40, TOP = 12;
  const cut = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
  const wOf = (v) => Math.max(0, Math.min(1, v / top)) * TW;
  const seg = [];
  let prev = rows[0].kwh, y = TOP;
  rows.forEach((r) => {
    const h = r.kind === "loss" || r.kind === "gain" ? HL : HM;
    seg.push({ r: r, y0: y, y1: y + h, wA: wOf(prev), wB: wOf(r.kwh) });
    prev = r.kwh; y += h;
  });
  const last = seg[seg.length - 1], H = last.y1 + 20;
  const trunk = "M" + X0 + " " + TOP + " L" + (X0 + seg[0].wA).toFixed(1) + " " + TOP + " " +
    seg.map((s) => {
      const yc = (s.y0 + s.y1) / 2;
      return "L" + (X0 + s.wA).toFixed(1) + " " + yc.toFixed(1) +
        " L" + (X0 + s.wB).toFixed(1) + " " + yc.toFixed(1) +
        " L" + (X0 + s.wB).toFixed(1) + " " + s.y1.toFixed(1);
    }).join(" ") +
    " L" + (X0 + last.wB / 2).toFixed(1) + " " + (last.y1 + 14).toFixed(1) +
    " L" + X0 + " " + last.y1.toFixed(1) + " Z";
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    '<defs><linearGradient id="rpFlowG" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#3ECF84"/><stop offset="55%" stop-color="#22A35B"/><stop offset="100%" stop-color="#0B6B3A"/></linearGradient></defs>' +
    '<path d="' + trunk + '" fill="url(#rpFlowG)"/>' +
    seg.map((s) => ((s.r.kind === "loss" || s.r.kind === "gain") && Math.abs(s.wA - s.wB) > 0.2
      ? '<line x1="' + X0 + '" y1="' + ((s.y0 + s.y1) / 2).toFixed(1) + '" x2="' + (X0 + Math.min(s.wA, s.wB)).toFixed(1) +
        '" y2="' + ((s.y0 + s.y1) / 2).toFixed(1) + '" stroke="#fff" stroke-width="1" stroke-opacity=".28"/>' : "")).join("") +
    seg.map((s) => {
      const R = s.r, yc = (s.y0 + s.y1) / 2;
      const heavy = R.kind === "loss" && R.pct >= 3, zero = R.kind === "loss" && R.loss <= 0;
      if (R.kind === "loss" || R.kind === "gain") {
        const gain = R.kind === "gain";
        const col = gain ? "#2563EB" : heavy ? "var(--tint-red-tx2)" : "#EFA53A";
        const th = Math.max(3.6, Math.abs(s.wA - s.wB));
        const inner = X0 + Math.min(s.wA, s.wB);
        const yA = (yc - th / 2).toFixed(1), yB = (yc + th / 2).toFixed(1);
        const HEAD = 9, FLARE = 3.4;
        const ribbon = zero ? "" : '<path d="' + (gain
          ? "M" + XL + " " + yA + " L" + (inner + HEAD).toFixed(1) + " " + yA +
            " L" + (inner + HEAD).toFixed(1) + " " + (yc - th / 2 - FLARE).toFixed(1) + " L" + inner.toFixed(1) + " " + yc.toFixed(1) +
            " L" + (inner + HEAD).toFixed(1) + " " + (yc + th / 2 + FLARE).toFixed(1) + " L" + (inner + HEAD).toFixed(1) + " " + yB + " L" + XL + " " + yB + " Z"
          : "M" + inner.toFixed(1) + " " + yA + " L" + (XL - HEAD) + " " + yA +
            " L" + (XL - HEAD) + " " + (yc - th / 2 - FLARE).toFixed(1) + " L" + XL + " " + yc.toFixed(1) +
            " L" + (XL - HEAD) + " " + (yc + th / 2 + FLARE).toFixed(1) + " L" + (XL - HEAD) + " " + yB + " L" + inner.toFixed(1) + " " + yB + " Z") +
          '" fill="' + col + '" fill-opacity="' + (gain ? 0.78 : heavy ? 0.92 : 0.85) + '"/>';
        return ribbon +
          (zero ? '<line x1="' + (X0 + s.wA).toFixed(1) + '" y1="' + yc.toFixed(1) + '" x2="' + XL + '" y2="' + yc.toFixed(1) +
            '" stroke="#D8E0DB" stroke-width="1" stroke-dasharray="2 4"/>' : "") +
          '<text x="' + LX + '" y="' + (yc - 9).toFixed(1) + '" font-size="10" font-weight="700" fill="' + (zero ? "#8A968F" : "#3A4A43") + '">' + RP_ESC(cut(R.label, 66)) + "</text>" +
          '<text x="' + LX + '" y="' + (yc + 3).toFixed(1) + '" font-size="9.5" font-weight="800" fill="' +
          (zero ? "#8A968F" : gain ? "#1D4ED8" : heavy ? "var(--tint-red-tx)" : "var(--tint-amber-tx)") + '">' +
          RP_ESC(gain ? "+" + R.pct + "%  ·  " + rpN(R.gain) + " kWh"
            : zero ? "ไม่เสียพลังงานในด่านนี้" : "−" + R.pct + "%  ·  " + rpN(R.loss) + " kWh") +
          (R.unit ? '<tspan fill="#8A968F" font-weight="700">' + RP_ESC("   → " + R.unit) + "</tspan>" : "") + "</text>" +
          (R.note ? '<text x="' + LX + '" y="' + (yc + 14).toFixed(1) + '" font-size="8.5" font-weight="600" fill="#8A968F">' + RP_ESC(cut(R.note, 70)) + "</text>" : "");
      }
      const big = R.kind === "end", first = R.kind === "start";
      const accent = big ? "#0F7A43" : first ? "var(--tint-amber-tx)" : "#C9D3CD";
      return '<line x1="' + X0 + '" y1="' + s.y1.toFixed(1) + '" x2="' + (XL + 4) + '" y2="' + s.y1.toFixed(1) +
        '" stroke="' + (big ? "#0F7A43" : "#D8E0DB") + '" stroke-width="' + (big ? 1.4 : 1) + '"' +
        (big ? ' stroke-opacity=".7"' : ' stroke-dasharray="3 4"') + "/>" +
        '<rect x="' + (LX - 9) + '" y="' + (s.y1 - 32).toFixed(1) + '" width="3" height="30" rx="1.5" fill="' + accent +
        '" fill-opacity="' + (big || first ? 1 : 0.5) + '"/>' +
        '<text x="' + LX + '" y="' + (s.y1 - 23).toFixed(1) + '" font-size="10.5" font-weight="800" fill="#16211D">' + RP_ESC(cut(R.label, 60)) + "</text>" +
        '<text x="' + LX + '" y="' + (s.y1 - 11).toFixed(1) + '" font-size="9.5" font-weight="800" fill="' +
        (big ? "#0F7A43" : first ? "var(--tint-amber-tx)" : "#3A4A43") + '">' + RP_ESC(rpN(R.kwh) + " kWh") +
        (R.unit ? '<tspan fill="#8A968F" font-weight="700">' + RP_ESC("   ·   " + R.unit) + "</tspan>" : "") +
        (big ? '<tspan fill="#0F7A43" font-weight="800">' + RP_ESC("   ·   PR " + R.pct + "%") + "</tspan>" : "") + "</text>" +
        (R.note ? '<text x="' + LX + '" y="' + (s.y1 - 1).toFixed(1) + '" font-size="8.5" font-weight="600" fill="#8A968F">' + RP_ESC(cut(R.note, 70)) + "</text>" : "");
    }).join("") +
    "</svg>";
}

/* ── เส้นทางเดินดวงอาทิตย์ + แผนที่เงาบัง ── */
const RP_ISO = [
  { at: 0.40, c: "var(--tint-red-tx)", o: 0.85, lb: "40%+" },
  { at: 0.20, c: "var(--tint-red-tx2)", o: 0.60, lb: "20–40%" },
  { at: 0.10, c: "#F59E0B", o: 0.62, lb: "10–20%" },
  { at: 0.05, c: "#F59E0B", o: 0.40, lb: "5–10%" },
  { at: 0.01, c: "#F59E0B", o: 0.22, lb: "1–5%" },
];
function rpSunPath(path, iso) {
  if (!path || !path.paths || !path.paths.length) return "";
  const W = 700, H = 350, L = 42, R = 16, T = 16, B = 30;
  const X = (az) => L + az / 360 * (W - L - R);
  const Y = (alt) => H - B - Math.max(0, Math.min(90, alt)) / 90 * (H - T - B);
  const line = (pts) => pts.map((q, k) => (k ? "L" : "M") + X(q.az).toFixed(1) + " " + Y(q.alt).toFixed(1)).join(" ");
  const cw = iso ? Math.abs(X(iso.azStep) - X(0)) : 0;
  const ch = iso ? Math.abs(Y(0) - Y(iso.altStep)) : 0;
  const compass = [[0, "เหนือ"], [45, "ตอ.เฉียงเหนือ"], [90, "ตะวันออก"], [135, "ตอ.เฉียงใต้"], [180, "ใต้"],
    [225, "ตต.เฉียงใต้"], [270, "ตะวันตก"], [315, "ตต.เฉียงเหนือ"], [360, "เหนือ"]];
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    '<rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" rx="6" fill="#F6F8F7"/>' +
    (iso ? iso.cells.map((c) => {
      const b = RP_ISO.filter((x) => c.f >= x.at)[0];
      if (!b) return "";
      return '<rect x="' + (X(c.az) - cw / 2).toFixed(1) + '" y="' + (Y(c.alt) - ch / 2).toFixed(1) +
        '" width="' + (cw + 0.6).toFixed(1) + '" height="' + (ch + 0.6).toFixed(1) + '" fill="' + b.c + '" opacity="' + b.o + '"/>';
    }).join("") : "") +
    Array.from({ length: 7 }).map((_, k) => {
      const alt = k * 15;
      return '<line x1="' + L + '" y1="' + Y(alt).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(alt).toFixed(1) +
        '" stroke="#E3E8E6" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (Y(alt) + 3.4).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + alt + "°</text>";
    }).join("") +
    compass.map((c) => (c[0] > 0 && c[0] < 360
      ? '<line x1="' + X(c[0]).toFixed(1) + '" y1="' + T + '" x2="' + X(c[0]).toFixed(1) + '" y2="' + (H - B) + '" stroke="#EEF1F0" stroke-width="1"/>' : "") +
      '<text x="' + X(c[0]).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="' + (c[0] === 0 ? "start" : c[0] === 360 ? "end" : "middle") +
      '" font-size="8.5" font-weight="' + (c[0] === 180 ? 800 : 700) + '" fill="' + (c[0] === 180 ? "#3A4A43" : "#8A968F") + '">' + RP_ESC(c[1]) + "</text>").join("") +
    path.hours.map((hr) => hr.segs.map((sg) => '<path d="' + line(sg) + '" fill="none" stroke="#8A968F" stroke-width="1" stroke-dasharray="2 3" opacity=".55"/>').join("") +
      '<text x="' + X(hr.pts[0].az).toFixed(1) + '" y="' + (Y(hr.pts[0].alt) - 5).toFixed(1) +
      '" text-anchor="middle" font-size="8" font-weight="800" fill="#8A968F">' + hr.h + "</text>").join("") +
    path.paths.map((p, i) => {
      const main = i === 0 || i === path.paths.length - 1 || i === 3;
      return p.segs.map((sg) => '<path d="' + line(sg) + '" fill="none" stroke="var(--tint-amber-tx)" stroke-width="' + (main ? 1.9 : 1.2) +
        '" opacity="' + (main ? 0.95 : 0.6) + '" stroke-linecap="round"/>').join("");
    }).join("") +
    [path.paths[0], path.paths[path.paths.length - 1]].map((p, i) => (p && p.peak
      ? '<text x="' + Math.max(L + 36, Math.min(W - R - 36, X(p.peak.az))).toFixed(1) + '" y="' + (Y(p.peak.alt) + (i ? 13 : -7)).toFixed(1) +
        '" text-anchor="middle" font-size="8.5" font-weight="800" fill="var(--tint-amber-tx)">' + RP_ESC(p.label) + "</text>" : "")).join("") +
    "</svg>" +
    (iso ? '<p class="note"><b>ระดับสีของเงาบัง</b> — ' +
      RP_ISO.slice().reverse().map((b) => b.lb).join(" · ") +
      " (เข้มขึ้น = โดนบังหนักขึ้น) · เส้นทางเดินเส้นไหนวิ่งผ่านพื้นที่สี แปลว่าเดือนนั้นเวลานั้นแผงโดนเงาบังแน่นอน</p>" : "");
}

/* ── ชุดเส้น I-V & P-V แบบดาต้าชีต ── */
const RP_GRAMP = ["#0B5F35", "#15803D", "#22A35B", "#6FC48F", "#B3DEC4"];
const RP_TRAMP = ["#1D4ED8", "#0F7A43", "#D97706", "var(--tint-red-tx2)"];
function rpIvFamily(curves, mode) {
  const list = (curves || []).filter(Boolean);
  if (!list.length) return "";
  const ramp = mode === "temp" ? RP_TRAMP : RP_GRAMP;
  const colOf = (i) => ramp[Math.min(i, ramp.length - 1)];
  const W = 700, H = 360, L = 48, R = 54, T = 18, B = 32;
  const vTop = list.reduce((a, c) => Math.max(a, c.voc), 0) * 1.08;
  const iTop = list.reduce((a, c) => Math.max(a, c.isc), 0) * 1.14;
  const pTop = list.reduce((a, c) => Math.max(a, c.pmax), 0) * 1.14;
  const X = (v) => L + v / vTop * (W - L - R);
  const Yi = (i) => H - B - i / iTop * (H - T - B);
  const Yp = (p) => H - B - p / pTop * (H - T - B);
  const pathOf = (c, fy, fv) => c.pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    Array.from({ length: 5 }).map((_, k) => {
      const y = T + (H - T - B) * k / 4, p = pTop * (1 - k / 4);
      return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="#E3E8E6" stroke-width="1"/>' +
        '<text x="' + (L - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' +
        (Math.round(iTop * (1 - k / 4) * 10) / 10) + "</text>" +
        '<text x="' + (W - R + 7) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="8.5" font-weight="700" fill="var(--tint-amber-tx)">' +
        (p >= 1000 ? Math.round(p / 100) / 10 + "k" : Math.round(p)) + "</text>";
    }).join("") +
    Array.from({ length: 6 }).map((_, k) => {
      const v = vTop * k / 5;
      return (k ? '<line x1="' + X(v).toFixed(1) + '" y1="' + T + '" x2="' + X(v).toFixed(1) + '" y2="' + (H - B) + '" stroke="#EEF1F0" stroke-width="1"/>' : "") +
        '<text x="' + X(v).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + Math.round(v) + "</text>";
    }).join("") +
    '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#C9D3CD" stroke-width="1.1"/>' +
    '<text x="' + (L - 7) + '" y="' + (T - 5) + '" text-anchor="end" font-size="8" font-weight="700" fill="#8A968F">A</text>' +
    '<text x="' + (W - R + 7) + '" y="' + (T - 5) + '" font-size="8" font-weight="700" fill="var(--tint-amber-tx)">W</text>' +
    '<text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" font-size="8.5" fill="#8A968F">แรงดัน (V)</text>' +
    '<path d="' + list.map((c, k) => (k ? "L" : "M") + X(c.vmp).toFixed(1) + " " + Yi(c.imp).toFixed(1)).join(" ") +
    '" fill="none" stroke="#A8B4AE" stroke-width="1" stroke-dasharray="2 4"/>' +
    list.map((c, i) => '<path d="' + pathOf(c, Yp, (q) => q.p) + '" fill="none" stroke="' + colOf(i) + '" stroke-width="1.3" stroke-dasharray="4 3" opacity=".7"/>' +
      '<path d="' + pathOf(c, Yi, (q) => q.i) + '" fill="none" stroke="' + colOf(i) + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="' + X(c.vmp).toFixed(1) + '" cy="' + Yi(c.imp).toFixed(1) + '" r="3.4" fill="#fff" stroke="' + colOf(i) + '" stroke-width="1.9"/>').join("") +
    (() => {
      const rh = 12.5, cw = 214, pad = 8;
      const bh = list.length * rh + pad * 2 + 12, bx = L + 24, by = H - B - bh - 12;
      return '<g><rect x="' + bx + '" y="' + by.toFixed(1) + '" width="' + (cw + pad) + '" height="' + bh.toFixed(1) +
        '" rx="6" fill="#fff" fill-opacity=".94" stroke="#D8E0DB" stroke-width="1"/>' +
        '<text x="' + (bx + pad) + '" y="' + (by + pad + 8).toFixed(1) + '" font-size="8" font-weight="800" fill="#8A968F">' +
        RP_ESC(mode === "temp" ? "อุณหภูมิเซลล์" : "ความเข้มแสง") + "</text>" +
        list.map((c, i) => {
          const cy = by + pad + 20 + i * rh + 3;
          return '<rect x="' + (bx + pad) + '" y="' + (cy - 3.4).toFixed(1) + '" width="13" height="3" rx="1.5" fill="' + colOf(i) + '"/>' +
            '<text x="' + (bx + pad + 19) + '" y="' + cy.toFixed(1) + '" font-size="8.5" font-weight="700" fill="#3A4A43">' + RP_ESC(c.label) + "</text>" +
            '<text x="' + (bx + pad + 94) + '" y="' + cy.toFixed(1) + '" font-size="8.5" font-weight="700" fill="#8A968F">' +
            RP_ESC(Math.round(c.vmp) + " V · " + (Math.round(c.imp * 10) / 10) + " A") + "</text>" +
            '<text x="' + (bx + cw - 4) + '" y="' + cy.toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="800" fill="#16211D">' +
            RP_ESC(c.pmax >= 1000 ? Math.round(c.pmax / 10) / 100 + " kW" : Math.round(c.pmax) + " W") + "</text>";
        }).join("") + "</g>";
    })() +
    "</svg>";
}

/* ── สารบัญของรายงาน — ใช้ทั้งตอนประกอบไฟล์และตอนให้ผู้ใช้ติ๊กเลือกก่อนออกรายงาน ──
   หัวข้อไหนไม่ติ๊ก = ไม่ออกไปเลย และเลขหัวข้อจะไล่ใหม่ให้เองไม่ให้ขาดตอน */
/* ── ไฟทั้งวันไหลไปไหน (แท่งซ้อน 24 ชั่วโมง) ──
   ใช้ตรรกะเดียวกับ SuFlowDay บนหน้าจอเป๊ะ ๆ เพื่อให้รายงานกับหน้าจอไม่มีทางขัดกัน */
const RP_FLOW = {
  direct: { c: "#22A35B", label: "ใช้ตรง ๆ ตอนนั้น" },
  chg: { c: "#2563EB", label: "เก็บเข้าแบต" },
  dis: { c: "#6366F1", label: "จ่ายออกจากแบต" },
  exp: { c: "#EFA53A", label: "ขายคืนการไฟฟ้า" },
  curt: { c: "var(--tint-red-tx2)", label: "ตัดทิ้ง (ห้ามไหลย้อน)" },
  imp: { c: "#94A3B8", label: "ซื้อจากการไฟฟ้า" },
};
function rpFlowDay(rows, mode, on) {
  if (!rows || !rows.length) return "";
  const keys = mode === "load" ? ["direct", "dis", "imp"] : ["direct", "chg", "exp", "curt"];
  const W = 720, H = 158, L = 34, R = on && mode === "pv" ? 34 : 10, T = 12, B = 18;
  const top = Math.max(0.02, rows.reduce((a, r) => Math.max(a, keys.reduce((s, k) => s + (r[k] || 0), 0)), 0));
  const X = (h) => L + (h + 0.5) / 24 * (W - L - R);
  const bw = (W - L - R) / 24 * 0.76;
  const Y = (v) => T + (1 - v / top) * (H - T - B);
  let out = "";
  [0, 0.5, 1].forEach((f) => {
    out += '<line x1="' + L + '" y1="' + Y(top * f).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(top * f).toFixed(1) +
      '" stroke="#E4EAE7" stroke-width="1"/><text x="' + (L - 4) + '" y="' + (Y(top * f) + 3).toFixed(1) +
      '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + scR(top * f, 2) + "</text>";
  });
  rows.forEach((r) => {
    let acc = 0;
    keys.forEach((k) => {
      const v = r[k] || 0; if (v <= 0) return;
      const y0 = Y(acc + v), hh = Math.max(0.6, Y(acc) - Y(acc + v)); acc += v;
      out += '<rect x="' + (X(r.h) - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) +
        '" height="' + hh.toFixed(1) + '" fill="' + RP_FLOW[k].c + '" opacity="' + (k === "curt" ? ".85" : ".92") + '"/>';
    });
  });
  if (on && mode === "pv") {
    out += '<polyline points="' + rows.map((r) => X(r.h).toFixed(1) + "," + (T + (1 - Math.max(0, Math.min(100, r.soc)) / 100) * (H - T - B)).toFixed(1)).join(" ") +
      '" fill="none" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="5 3" opacity=".6"/>' +
      '<text x="' + (W - R + 4) + '" y="' + (T + 4) + '" font-size="8.5" font-weight="700" fill="#8A968F">100%</text>' +
      '<text x="' + (W - R + 4) + '" y="' + (H - B + 3) + '" font-size="8.5" font-weight="700" fill="#8A968F">0%</text>';
  }
  [0, 3, 6, 9, 12, 15, 18, 21].forEach((h) => {
    out += '<text x="' + X(h).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#8A968F">' + h + "</text>";
  });
  out += '<text x="' + (W - R) + '" y="' + (H - 5) + '" text-anchor="end" font-size="8" font-weight="800" fill="#8A968F">น.</text>' +
    '<text x="2" y="' + (T - 3) + '" font-size="8.5" font-weight="800" fill="#8A968F">kWh</text>';
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + out + "</svg>";
}
const rpFlowLegend = (keys, soc) => '<div class="lgd">' +
  keys.map((k) => '<span><i style="background:' + RP_FLOW[k].c + '"></i>' + RP_ESC(RP_FLOW[k].label) + "</span>").join("") +
  (soc ? '<span><i class="dash"></i>ระดับไฟในแบต (0–100%)</span>' : "") + "</div>";

/* ── ระฆังคว่ำของผลผลิต: P50 อยู่กลาง แรเงาส่วนที่ต่ำกว่า P90 ── */
function rpPxx(px, mode) {
  if (!px) return "";
  const rows = mode === "one" ? px.one : px.avg;
  const sig = (mode === "one" ? px.sigma1 : px.sigmaN) / 100;
  const W = 720, H = 176, L = 10, R = 10, T = 16, B = 32;
  const p50 = px.p50 || 1, lo = p50 * (1 - 3.2 * sig), hi = p50 * (1 + 3.2 * sig);
  const X = (v) => L + (v - lo) / Math.max(1e-9, hi - lo) * (W - L - R);
  const Y = (f) => T + (1 - f) * (H - T - B);
  const pts = [];
  for (let i = 0; i < 121; i++) {
    const v = lo + (hi - lo) * i / 120, t = (v - p50) / Math.max(1e-9, p50 * sig);
    pts.push({ x: X(v), y: Y(Math.exp(-0.5 * t * t)), v });
  }
  const p90 = (rows.find((r) => r.p === 90) || rows[0]).kwh;
  const under = pts.filter((p) => p.v <= p90);
  const fill = under.length
    ? '<path d="M' + under[0].x.toFixed(1) + " " + Y(0).toFixed(1) + " L" +
      under.map((p) => p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" L") + " L" +
      under[under.length - 1].x.toFixed(1) + " " + Y(0).toFixed(1) + ' Z" fill="var(--tint-amber-tx)" opacity=".16"/>' : "";
  const mark = (v, p, c) => '<line x1="' + X(v).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(v).toFixed(1) +
    '" y2="' + Y(Math.exp(-0.5 * Math.pow((v - p50) / (p50 * sig), 2))).toFixed(1) + '" stroke="' + c +
    '" stroke-width="1.6"' + (p === 90 ? ' stroke-dasharray="4 3"' : "") + "/>" +
    '<text x="' + X(v).toFixed(1) + '" y="' + (T - 5) + '" text-anchor="middle" font-size="10" font-weight="800" fill="' + c + '">P' + p + "</text>" +
    '<text x="' + X(v).toFixed(1) + '" y="' + (H - 17) + '" text-anchor="middle" font-size="10" font-weight="800" fill="' + c + '">' + rpN(v) + "</text>";
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' +
    '<line x1="' + L + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(0).toFixed(1) + '" stroke="#D8E0DC" stroke-width="1.2"/>' +
    fill + '<polyline points="' + pts.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ") + '" fill="none" stroke="#0B5F35" stroke-width="2"/>' +
    mark(p50, 50, "#0B5F35") + mark(p90, 90, "var(--tint-amber-tx)") +
    '<text x="' + X(p90).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="8.5" font-weight="800" fill="var(--tint-amber-tx)">โอกาสตกลงมาต่ำกว่านี้ 10%</text>' +
    '<text x="' + L + '" y="' + (H - 4) + '" font-size="8.5" font-weight="700" fill="#8A968F">แย่กว่าที่คิด</text>' +
    '<text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">ดีกว่าที่คิด</text>' +
    "</svg>";
}

const RP_SECTIONS = [
  { key: "cover", label: "หน้าปก", note: "โลโก้ · ตัวเลขเด่น · ภาพ 3 มิติ" },
  { key: "summary", label: "สรุปผลการออกแบบ", note: "การ์ดตัวเลขสำคัญทั้งหมดในหน้าเดียว" },
  { key: "equip", label: "อุปกรณ์ที่ใช้", note: "สเปคแผง/อินเวอร์เตอร์ · ผืนหลังคาและทิศทาง" },
  { key: "wiring", label: "การต่อสตริง / ไมโคร", note: "ตารางการต่อ · ข้อควรแก้",
    subs: [{ key: "layout", label: "ผังแผงมองจากด้านบน", note: "สีเดียวกัน = สตริง/ไมโครเดียวกัน" }] },
  { key: "iv", label: "แสง เงา และเส้น I-V", subs: [
    { key: "ivDay", label: "กำลังไฟ + อุณหภูมิเซลล์ตลอดวัน", note: "เดือนที่ผลิตได้สูงสุด" },
    { key: "ivYear", label: "แสง/เงาทั้งปี 12 เดือน", note: "แผนที่ความร้อน + ตารางสรุป" },
    { key: "ivSun", label: "เส้นทางเดินดวงอาทิตย์ & แผนที่เงาบัง", note: "ทิศ × มุมสูง — เห็นว่าโดนบังเดือนไหน เวลาไหน" },
    { key: "ivFam", label: "เส้น P-V & I-V ที่แสง/อุณหภูมิต่าง ๆ", note: "แบบเดียวกับกราฟบนดาต้าชีตแผง" },
    { key: "ivAll", label: "ค่าที่ควรวัดได้ทุกสตริง/ไมโคร", note: "ตารางพกไปเทียบกับเครื่องวัดที่หน้างาน" },
    { key: "ivMeas", label: "ผลตรวจวัดหน้างาน", note: "เทียบค่าที่วัดได้กับที่ควรได้" }] },
  { key: "prod", label: "ผลผลิตที่คาดการณ์", subs: [
    { key: "shade", label: "เงาบังทั้งปีจากโมเดล 3 มิติ" },
    { key: "loss", label: "แผนภาพค่าสูญเสียของระบบ", note: "ไล่จากแสงที่ได้ลงมาถึงไฟ AC ทีละด่าน" },
    { key: "pxx", label: "ความมั่นใจของผลผลิต (P50/P90)", note: "ตัวเลขที่ธนาคารและผู้ลงทุนขอดู" }] },
  { key: "env", label: "ผลกระทบต่อสิ่งแวดล้อม", note: "คาร์บอนที่ลดได้ · ค่าเทียบเท่า · คืนทุนทางคาร์บอน" },
  { key: "load", label: "การใช้ไฟ · แบตเตอรี่ · ห้ามไหลย้อน", note: "จำลองทีละชั่วโมงทั้งปี — ผลิตแล้วได้ใช้เองกี่ %", subs: [
    { key: "loadDay", label: "กราฟไฟทั้งวัน", note: "ไฟที่ผลิตได้ไปไหน + ไฟที่ใช้มาจากไหน" },
    { key: "loadMon", label: "ตารางรายเดือน" },
    { key: "battSpec", label: "สเปคแบตเตอรี่ที่ใช้คิด" }] },
  { key: "roi", label: "ผลตอบแทนการลงทุน", note: "คืนทุน · IRR · กระแสเงินสด" },
];
/* ค่าเริ่มต้น = เอาทุกหัวข้อ */
function rpPickAll() {
  const o = {};
  RP_SECTIONS.forEach((s) => { o[s.key] = true; (s.subs || []).forEach((b) => { o[b.key] = true; }); });
  return o;
}

/* ── ประกอบเนื้อรายงาน ── */
function suReportHTML(D) {
  const job = D.job || {}, S = D.sys || {}, panel = D.panel || {}, inv = D.inv || {};
  const E = D.energy, L = D.life, roi = D.roi, R = D.roiCfg || {};
  const P = Object.assign(rpPickAll(), D.pick || {});
  const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
  const sec = (n, title, body, sub) =>
    '<section class="sec"><h2><span class="no">' + n + "</span>" + RP_ESC(title) +
    (sub ? '<small>' + RP_ESC(sub) + "</small>" : "") + "</h2>" + body + "</section>";

  /* 1 · สรุป */
  const kpis = [
    rpCard("กำลังติดตั้ง", E ? rpN(E.dcKw, 2) : "—", "kWp"),
    rpCard("อินเวอร์เตอร์", rpN(D.acKw, 1), "kW"),
    /* ปีแรกต้องหักค่าเสื่อมปีแรกแล้ว ให้ตรงกับแถบสรุปบนหน้าจอ (E.annual คือกำลังเต็มก่อนเสื่อม) */
    rpCard("ผลผลิตปีแรก", L ? rpN(L.rows[0].kwh) : (E ? rpN(E.annual) : "—"), "kWh"),
    rpCard("ต่อกำลังติดตั้ง", E ? rpN(E.perKwp) : "—", "kWh/kWp/ปี"),
    rpCard("Performance Ratio", E ? E.pr : "—", "%"),
    rpCard("รวม " + (S.years || 15) + " ปี", L ? rpN(Math.round(L.total / 1000)) : "—", "MWh"),
    roi ? rpCard("คืนทุนภายใน", roi.payback ? roi.payback : "> " + roi.years, "ปี", "hi") : "",
    roi ? rpCard("ผลตอบแทน IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี", "hi") : "",
  ].join("");

  /* 2 · อุปกรณ์ */
  const specTbl =
    '<div class="two">' +
    "<div>" + rpTable(["สเปคแผง (STC)", "ค่า"], [
      ["รุ่น", panel.model || "—"],
      ["กำลังสูงสุด Pmax", rpN(panel.wp) + " W"],
      ["แรงดันวงจรเปิด Voc", rpN(panel.voc, 2) + " V"],
      ["กระแสลัดวงจร Isc", rpN(panel.isc, 2) + " A"],
      ["แรงดันทำงาน Vmp", rpN(panel.vmp, 2) + " V"],
      ["กระแสทำงาน Imp", rpN(panel.imp, 2) + " A"],
      ["ค่าอุณหภูมิ Voc", scNum(panel.tcVoc, -0.25) + " %/°C"],
      ["ค่าอุณหภูมิ Pmax", scNum(panel.tcPmax, -0.29) + " %/°C"],
      ["NOCT / NMOT", rpN(panel.noct, 0) + " °C"],
      ["เสื่อมปีแรก / ปีถัดไป", scNum(panel.deg1, 1) + " % / " + scNum(panel.degY, 0.4) + " %/ปี"],
    ]) + "</div><div>" +
    (D.isMicro
      ? rpTable(["สเปคไมโครอินเวอร์เตอร์", "ค่า"], D.microSel ? [
          ["รุ่น", D.microSel.model || "—"],
          ["อัตราส่วน", "แผง " + D.microSel.per + " : ไมโคร 1 · MPPT " + D.microSel.nMppt + " ช่องอิสระ"],
          ["แผงต่อ 1 ช่อง MPPT", D.microSel.nSeries + " ใบ"],
          ["กำลัง AC ต่อตัว", rpN(D.microSel.acW) + " W"],
          ["แรงดัน DC สูงสุด", rpN(D.microSel.spec.maxVdc) + " V"],
          ["ช่วง MPPT", rpN(D.microSel.spec.mpptVmin) + " – " + rpN(D.microSel.spec.mpptVmax) + " V"],
          ["กระแสทำงาน/ลัดวงจร สูงสุดต่อช่อง", rpN(D.microSel.spec.maxInA, 1) + " A / " + rpN(D.microSel.spec.maxIscA, 1) + " A"],
          ["ช่วงกำลังแผงที่รองรับ", D.microSel.spec.wpMin || D.microSel.spec.wpMax
            ? rpN(D.microSel.spec.wpMin) + " – " + rpN(D.microSel.spec.wpMax) + " W" : "ไม่ระบุ"],
          ["จำนวนที่ใช้", rpN(D.microSel.units) + " ตัว" + (D.microSel.branches ? " · " + D.microSel.branches + " วงจรย่อย AC" : "")],
          ["กำลัง AC รวม", rpN(D.microSel.acKw, 2) + " kW · กระแส " + rpN(D.microSel.acAmpTotal, 1) + " A"],
          ["DC/AC ต่อตัว", D.microSel.dcAc],
          ["ประสิทธิภาพ", rpN(D.microSel.eff, 1) + " %"],
        ] : [["—", "ยังไม่ได้เลือก"]])
      : rpTable(["สเปคอินเวอร์เตอร์", "ค่า"], [
          ["รุ่น", inv.model || "—"],
          ["จำนวน", rpN(S.invCount || 1) + " ตัว"],
          ["กำลัง AC ต่อตัว", rpN(inv.kw, 1) + " kW"],
          ["ช่วง MPPT", rpN(inv.mpptVmin) + " – " + rpN(inv.mpptVmax) + " V"],
          ["แรงดัน DC สูงสุด", rpN(inv.maxVdc) + " V"],
          ["กระแสทำงานสูงสุด/MPPT", rpN(inv.maxInA, 1) + " A"],
          ["กระแสลัดวงจรสูงสุด/MPPT", inv.maxIscA ? rpN(inv.maxIscA, 1) + " A" : "ไม่ระบุ"],
          ["จำนวนช่อง MPPT", rpN(inv.inputs) + " ช่อง"],
          ["ประสิทธิภาพ", scNum(inv.eff, 97.5) + " %"],
        ])) + "</div></div>";

  const groupTbl = rpTable(["ผืนหลังคา / กลุ่ม", "มุมเอียง", "ทิศ", "จำนวนแผง", "กำลัง kWp"],
    (D.groups || []).map((g) => [g.roofName + (g.side ? " · " + g.side : ""), g.tilt + "°", g.az + "°", g.count,
      rpN(g.count * scNum(panel.wp) / 1000, 2)]));

  /* 3 · การต่อ */
  const wiring = D.isMicro
    ? rpTable(["กลุ่มทิศทาง", "แผง", "ไมโคร", "ช่อง MPPT", "หมายเหตุ"], (D.groups || []).map((g) => {
        const per = D.microSel ? D.microSel.per : 1, u = Math.ceil(g.count / per);
        return [g.label, g.count, u + " ตัว", u * (D.microSel ? D.microSel.nMppt : 1) + " ช่อง",
          per > 1 && g.count % per ? "เหลือแผงเดี่ยว 1 แผง" : "ลงตัวพอดี"];
      })) +
      (D.microSel ? rpTable(["ตรวจสเปคไฟฟ้าต่อ 1 ช่อง MPPT (" + D.microSel.nSeries + " แผง)", "ได้", "พิกัด", "ผล"],
        D.microSel.chk.checks.map((c) => [
          c.k === "voc" ? "Voc ตอนอากาศเย็น" : c.k === "hot" ? "Vmp ตอนแผงร้อน" : "Vmp ตอนอากาศเย็น",
          scR(c.v, 1) + " V", (c.k === "hot" ? "≥ " : "≤ ") + c.lim + " V",
          { v: c.ok ? "ผ่าน" : "ไม่ผ่าน", cls: c.ok ? "ok" : "bad" }]).concat([
          ["กระแสทำงาน Imp", D.microSel.cur.opA + " A", D.microSel.cur.limOp ? "≤ " + D.microSel.cur.limOp + " A" : "ไม่ระบุ",
            { v: !D.microSel.cur.limOp ? "—" : D.microSel.cur.opA <= D.microSel.cur.limOp ? "ผ่าน" : "ไม่ผ่าน",
              cls: !D.microSel.cur.limOp ? "" : D.microSel.cur.opA <= D.microSel.cur.limOp ? "ok" : "bad" }],
          ["กระแสลัดวงจร Isc×1.25", D.microSel.cur.scA + " A", D.microSel.cur.limSc ? "≤ " + D.microSel.cur.limSc + " A" : "ไม่ระบุ",
            { v: !D.microSel.cur.limSc ? "—" : D.microSel.cur.scA <= D.microSel.cur.limSc ? "ผ่าน" : "ไม่ผ่าน",
              cls: !D.microSel.cur.limSc ? "" : D.microSel.cur.scA <= D.microSel.cur.limSc ? "ok" : "bad" }],
        ])) : "")
    : (D.plan ? rpTable(["สตริง", "แผง", "กลุ่มทิศทาง", "ขั้วที่เสียบ (INV / MPPT / ช่อง)", "Voc ตอนเย็น", "ช่วงแรงดันทำงาน", "ผลตรวจ"],
        D.plan.strings.map((s) => [
          "#" + s.id, s.n, s.label,
          s.pin == null ? "ไม่มีขั้วเหลือ" : (s.addr || ""),
          s.chk.vocCold + " V", s.chk.vmpHot + " – " + s.chk.vmpCold + " V",
          { v: s.chk.ok ? "ผ่าน · " + s.chk.band : "ไม่ผ่าน", cls: s.chk.ok ? "ok" : "bad" },
        ])) : "");
  /* ── ไมโครในระบบ 3 เฟส: ไมโครเป็นอุปกรณ์ 1 เฟส ต้องกระจายลง L1/L2/L3 ── */
  const phaseSec = D.isMicro && D.phases === 3 && (D.phaseBins || []).length
    ? "<h3>การแบ่งเฟส (ระบบ 3 เฟส)</h3>" +
      rpTable(["เฟส", "ไมโคร", "แผง", "กำลัง AC", "กระแส", "วงจรย่อย"],
        D.phaseBins.map((b) => [b.label, b.count + " ตัว", b.panels, rpN(b.acKw, 2) + " kW",
          rpN(b.amps, 1) + " A", b.branches ? b.branches + " วงจร" : "—"])) +
      (D.phaseBal
        ? '<p class="' + (D.phaseBal.ok ? "ok-box" : "note") + '">' +
          (D.phaseBal.ok
            ? "เฟสสมดุลดี — เฟสที่หนักกับเบาต่างกัน " + D.phaseBal.spread + " ตัว (" + D.phaseBal.pct + "% ของกำลัง) อยู่ในเกณฑ์ " + D.phaseBal.tol + "%"
            : "<b>เฟสไม่สมดุล</b> — ต่างกัน " + D.phaseBal.pct + "% (" + D.phaseBal.spread + " ตัว) เกินเกณฑ์ " + D.phaseBal.tol + "% ควรเกลี่ยใหม่ก่อนติดตั้ง") +
          "</p>" : "") +
      /* เรียงตามหมายเลขตัวก่อนค่อยแปลงเป็นแถว — เรียงหลังแปลงแล้วจะไปจับเลขในโค้ดสีมาปนกัน */
      '<p class="note">ไมโครแทบทุกรุ่นเป็นอุปกรณ์ 1 เฟส เมื่อใช้กับระบบ 3 เฟสจึงต้องกระจายตัวลงแต่ละเฟสให้กำลังใกล้เคียงกัน ' +
      "ไม่งั้นเฟสที่หนักกว่าจะแรงดันตกและกระแสในสายนิวทรัลสูงเกินจำเป็น · ดูว่าตัวไหนลงเฟสอะไรได้ที่ตารางใต้ผังแผง</p>"
    : "";
  const microNote = D.isMicro && D.microSel
    ? '<p class="note">ไมโครติดตั้งใต้แผงและแปลงเป็นไฟ AC ตรงจุดนั้นเลย · รุ่นนี้ให้ MPPT ' + D.microSel.nMppt +
      " ช่องอิสระต่อแผง " + D.microSel.per + " ใบ = 1 ช่องต่อ " + D.microSel.nSeries + " แผง " +
      "จึงตรวจแรงดัน/กระแสด้วยเกณฑ์เดียวกับสตริงอินเวอร์เตอร์ โดยมองว่า 1 ช่อง MPPT คือ 1 สตริงสั้น ๆ · " +
      (D.microSel.nSeries <= 1
        ? "แผงทุกใบหาจุดทำงานของตัวเอง เงาบังใบไหนกำลังตกเฉพาะใบนั้น ไม่ฉุดใบข้างเคียง " +
          "ค่าสูญเสีย “แผงไม่เท่ากัน” จึงตั้งไว้ที่ 0.3% แทน 2% ของระบบสตริง"
        : "ช่องนี้มีแผงมากกว่า 1 ใบต่ออนุกรมกัน จึงยังฉุดกันได้ภายในช่องเดียวกัน") + "</p>"
    : "";
  const wiringNote = D.plan
    ? '<p class="note">ตรวจแรงดันครบทั้งสองด้าน: ตอนอากาศเย็น ' + scNum((S.env || {}).tMin, 15) + "°C แรงดันวงจรเปิดต้องไม่เกินพิกัดอินเวอร์เตอร์ · " +
      "ตอนแผงร้อน " + scNum((S.env || {}).tCellHot, 65) + "°C แรงดันทำงานต้องไม่หลุดต่ำกว่าช่วง MPPT · DC/AC = " + D.plan.dcAc + "</p>"
    : "";

  /* 4 · ผลตรวจวัด */
  const rows = D.ivDone || [];
  /* จำลองทั้งวันของวันที่ตรวจวัด — ให้เห็นว่าแสง/เงา/กำลังไฟวันนั้นเป็นยังไงตลอดวัน */
  const sim = D.sim;
  const Y = D.year;
  /* วันตัวแทนของรายงาน = เดือนที่ผลิตได้สูงสุดใน 12 เดือน (แสงดีที่สุด เห็นศักยภาพเต็มของระบบ) */
  const best = Y && Y.bestMonth && P.ivDay ? Y.bestMonth : null;
  const daySec = best
    ? "<h3>กำลังไฟและอุณหภูมิเซลล์ตลอดวัน — " + RP_ESC(best.label) + " (เดือนที่ผลิตได้สูงสุดใน 12 เดือน)</h3>" +
      rpDayPower(best, D.acKw) +
      rpTable(["ช่วงเวลา", "ค่า"], [
        ["พระอาทิตย์ขึ้น – ตก", ivHM(best.sunrise) + " – " + ivHM(best.sunset) + " น."],
        ["แสงแรงที่สุดบนหน้าแผง", best.maxPoa + " W/m²"],
        ["กำลังไฟสูงสุดของระบบ", scR(best.peakAc, 2) + " kW ตอน " + ivHM(best.peakAt) + " น." +
          (best.clipHours > 0 ? " (อินเวอร์เตอร์ตัดยอด " + best.clipHours + " ชม./วัน)" : "")],
        ["อุณหภูมิเซลล์สูงสุด", Math.round(best.cells.reduce((a, c) => Math.max(a, c.tCell || 0), 0)) + " °C"],
        ["ผลผลิตทั้งวัน", rpN(best.dayKwh, 1) + " kWh"],
        ["ผลผลิตทั้งเดือน", rpN(best.monthKwh) + " kWh"],
        ["ช่วงที่มีเงาบัง", best.shadeFrom != null
          ? ivHM(best.shadeFrom) + " – " + ivHM(best.shadeTo) + " น. · เสียไป " + best.shadeLossPct + "%" : "ไม่มีเงาบังตลอดวัน"],
      ]) +
      '<p class="note">กำลังไฟจากแผง (DC) สูงกว่ากำลังที่ออกจากอินเวอร์เตอร์ (AC) เสมอ เพราะมีการสูญเสียในสายและตัวอินเวอร์เตอร์ · ' +
      "อุณหภูมิเซลล์คำนวณจากแบบจำลองความร้อนตามวิธียึดแผงจริง ยิ่งร้อนกำลังยิ่งตกตามสัมประสิทธิ์ของแผง (" +
      scNum(panel.tcPmax, -0.29) + " %/°C) จึงเห็นกำลังไฟยอดแบนช่วงบ่ายแม้แดดยังแรง</p>"
    : "";
  /* ทั้ง 12 เดือน — ทั้งแผนที่ความร้อนและตาราง */
  const yearSec = Y && P.ivYear
    ? "<h3>แสงที่ได้ทั้งปี — เดือน × ชั่วโมง</h3>" + rpYearMap(Y, "light") +
      "<h3>เงาบังทั้งปี — เดือน × ชั่วโมง</h3>" + rpYearMap(Y, "shade") +
      "<h3>สรุปทั้งปี 12 เดือน</h3>" +
      rpTable(["เดือน", "แดดขึ้น–ตก", "แดดแรงสุด", "กำลังสูงสุด", "ผลิต/วัน", "ผลิต/เดือน", "เงาบัง", "ช่วงที่โดนบัง"],
        Y.months.map((mo) => [mo.label, ivHM(mo.sunrise) + "–" + ivHM(mo.sunset), mo.maxPoa + " W/m²",
          scR(mo.peakAc, 2) + " kW", scR(mo.dayKwh, 1) + " kWh", rpN(mo.monthKwh) + " kWh",
          { v: mo.shadeLossPct + " %", cls: mo.shadeLossPct >= 5 ? "bad" : mo.shadeLossPct > 0 ? "warn" : "ok" },
          mo.shadeFrom != null ? ivHM(mo.shadeFrom) + "–" + ivHM(mo.shadeTo) + " น." : "ไม่มีเงา"])) +
      '<p class="note">คิดจากวันตัวแทนของแต่ละเดือน (วันที่ 15) คูณจำนวนวันในเดือน — ใช้ดูแนวโน้มรายเดือนและช่วงเวลาที่เงามา ' +
      "ส่วนตัวเลขผลผลิตทางการอยู่ในหัวข้อถัดไป ซึ่งเดินครบทุกวันของปี · เงาบังทั้งปีเฉลี่ย " + Y.shadeLossPct + "%" +
      (Y.worstMonth && Y.worstMonth.shadeLossPct > 0 ? " · เดือนที่โดนหนักสุดคือ " + Y.worstMonth.label + " (" + Y.worstMonth.shadeLossPct + "%)" : "") + "</p>"
    : "";
  /* เส้น I-V ที่ควรได้ของทุกสตริง ณ เวลาที่เลือก */
  /* watt = กำลัง "รวมทั้งตัว" (ทุกช่อง MPPT บวกกัน) — ตัวเลขที่ช่างสนใจจริง ไม่ใช่ของช่องเดียว */
  const ivCurves = (D.ivRows || []).map((r, i) => {
    if (!(r.a && r.a.exp)) return null;
    const ch = Math.max(1, Math.round((r.u.count || 1) / Math.max(1, r.u.n)));
    return { id: r.u.id, name: r.u.name, curve: r.a.exp, watt: r.a.exp.pmax * (D.isMicro ? ch : 1),
      color: (typeof suColor === "function" ? suColor(r.u.sid || i + 1) : "#22A35B") };
  }).filter(Boolean);
  const ivMain = (D.ivRows || [])[0];
  const ivAllSec = ivCurves.length && P.ivAll
    /* กราฟรวมทุกสตริงถูกยกเลิกไปแล้ว (เส้นทับกันจนอ่านยาก และซ้ำกับกราฟ P-V & I-V ด้านบน)
       เหลือเฉพาะตารางค่าที่ควรวัดได้ ซึ่งเป็นสิ่งที่กราฟนั้นบอกไม่ได้ — ตรงกับที่แสดงบนหน้าจอ */
    ? "<h3>ค่าที่ควรวัดได้ของทุก" + (D.isMicro ? "ไมโคร" : "สตริง") + " ณ " + ivHM(D.simHour) + " น.</h3>" +
      rpTable([D.isMicro ? "ไมโคร" : "สตริง", "แผง"].concat(D.isMicro ? ["ต่อช่อง"] : [])
        .concat(["แสง W/m²", "เซลล์ °C", "Voc", "Isc", "Vmp", "Imp", D.isMicro ? "Pmax/ช่อง" : "Pmax"])
        .concat(D.isMicro ? ["รวมทั้งตัว"] : []),
        (D.ivRows || []).filter((r) => r.a && r.a.exp).map((r, i) => {
          /* ไมโคร 1 ตัวมีหลายช่อง MPPT แยกอิสระ — ค่าไฟฟ้าเป็นของ 1 ช่อง กำลังรวมคือทุกช่องบวกกัน */
          const ch = Math.max(1, Math.round((r.u.count || 1) / Math.max(1, r.u.n)));
          return [{ html: '<span class="dot" style="background:' + (typeof suColor === "function" ? suColor(r.u.sid || i + 1) : "#22A35B") + '"></span><b>' + RP_ESC(r.u.name) + "</b>" }]
            .concat(D.isMicro ? [r.u.count || r.u.n, r.u.n + " ใบ"] : [r.u.n])
            .concat([r.a.cond.g, scR(r.a.cond.tc, 0),
              scR(r.a.exp.voc, 1), scR(r.a.exp.isc, 2), scR(r.a.exp.vmp, 1), scR(r.a.exp.imp, 2),
              { html: "<b>" + rpN(r.a.exp.pmax) + "</b> W" }])
            .concat(D.isMicro ? [{ html: "<b>" + rpN(r.a.exp.pmax * ch) + "</b> W" }] : []);
        })) +
      '<p class="note">ค่าที่ควรวัดได้จริงที่หน้างาน ณ สภาพอากาศเวลานี้ (ไม่ใช่ค่าบนดาต้าชีต) — พกตารางนี้ไปเทียบกับเครื่องวัดได้เลย ' +
      "ถ้าวัดได้ต่างจากนี้เกิน 5% ค่อยไล่หาสาเหตุ · เส้นประคือเส้นที่สภาวะมาตรฐาน STC ไว้เทียบว่าอากาศจริงกินกำลังไปเท่าไหร่" + (D.isMicro ? " · ไมโคร 1 ตัวรับแผงหลายใบ แต่แยกเป็นช่อง MPPT อิสระ ค่าไฟฟ้าในตารางจึงเป็นของ 1 ช่อง (ตรงกับที่เครื่องวัดอ่านได้ตอนวัดทีละเส้น) ส่วน “รวมทั้งตัว” คือทุกช่องบวกกัน · แต่ละเส้นคิดจากเงาที่ตกบนแผงของตัวนั้นเอง ตัวที่โดนบังจึงต่ำลงคนเดียว" : "") + "</p>"
    : "";
  let ivSec = "";
  if (rows.length && P.ivMeas) {
    const first = rows[0];
    const condTbl = rpTable(["สภาพอากาศตอนตรวจวัด", "ค่า"], [
      ["วัน–เวลา", D.siteDate + " เวลา " + ivHM(D.simHour) + " น." + (D.site.hour == null ? " (ระบบเลือกช่วงที่เหมาะจะวัดให้)" : "")],
      ["ความเข้มแสงบนพื้นราบ", first.irr.ghi + " W/m²" + (first.irr.measured ? " (วัดจริง)" : " (ประมาณจากแบบจำลอง)")],
      ["แสงบนหน้าแผง (POA)", first.irr.poaNet + " W/m²" + (first.irr.shadeLoss ? " · หักเงาบัง " + first.irr.shadeLoss + " W/m²" : "")],
      ["มุมตกกระทบ / ผ่านผิวกระจก", first.irr.aoi + "° / " + scR(first.irr.iam * 100, 1) + "%"],
      ["อุณหภูมิอากาศ / ลม", first.temp.tAmb + " °C / " + first.temp.wind + " m/s"],
      ["วิธียึดแผง", first.temp.label],
      ["อุณหภูมิหลังแผง / เซลล์", first.temp.tBack + " °C / " + first.temp.tCell + " °C (ร้อนกว่าอากาศ +" + first.temp.rise + " °C)"],
      ["อายุระบบ ณ วันที่วัด", scNum(D.site.age, 0) + " ปี"],
    ]);
    const resTbl = rpTable(["หน่วย", "แผง", "แสง W/m²", "เซลล์ °C", "Pmax วัดได้→STC", "ควรได้ที่ STC", "ได้กี่ %"],
      rows.map((r) => [r.u.name, r.u.n, r.a.cond.g, scR(r.a.cond.tc, 0),
        rpN(r.a.stc.pmax) + " W", rpN(r.a.expStc.pmax) + " W",
        { v: r.a.ratio + " %", cls: r.a.ratio >= 95 ? "ok" : r.a.ratio >= 85 ? "warn" : "bad" }]));
    const findings = rows.flatMap((r) => (r.a.findings || []).filter((f) => f.sev !== "good")
      .map((f) => '<li class="' + f.sev + '"><b>' + RP_ESC(r.u.name + " — " + f.t) + "</b><br>" + RP_ESC(f.why) +
        (f.do ? "<br><i>ทำต่อ: " + RP_ESC(f.do) + "</i>" : "") + "</li>"));
    const outl = (D.ivOutliers || []).map((o) => '<li class="warn"><b>' + RP_ESC(o.name) + " ได้ " + o.ratio + "% ต่ำกว่าค่ากลางของระบบ (" + o.med + "%)</b><br>เข้าข่ายไม่สมดุลระหว่างสตริง ควรหาสาเหตุก่อนส่งมอบ</li>");
    const curves = rows.slice(0, 4).map((r) =>
      '<div class="ivbox"><div class="ivh">' + RP_ESC(r.u.name) + ' <b>' + r.a.ratio + '%</b></div>' +
      rpIv(r.a.exp, r.a.expStc, { voc: scNum(r.m.voc), isc: scNum(r.m.isc), vmp: scNum(r.m.vmp), imp: scNum(r.m.imp) }) + "</div>").join("");
    ivSec = condTbl + '<p class="note">อุณหภูมิเซลล์คำนวณจากแบบจำลองความร้อน (Sandia) ตามวิธียึดแผงจริง — แผงยึดชิดหลังคาระบายความร้อนไม่ออก ' +
      "จึงร้อนกว่าอากาศได้มาก และกำลังจะตกตามสัมประสิทธิ์อุณหภูมิของแผง (" + scNum(panel.tcPmax, -0.29) + " %/°C)</p>" +
      resTbl +
      '<p class="note">ค่าที่วัดได้ถูกชดเชยกลับไปที่สภาวะมาตรฐาน STC (1000 W/m², เซลล์ 25 °C) ด้วยสมการแนวเดียวกับ IEC 60891 วิธีที่ 1 ' +
      "จึงเทียบกับดาต้าชีตได้ตรง ๆ · เกณฑ์ตรวจรับทั่วไปยอมรับที่ ≥ 95%</p>" +
      (curves ? '<div class="ivgrid">' + curves + "</div>" : "") +
      (findings.length || outl.length ? '<h3>ข้อสังเกตและสิ่งที่ต้องแก้</h3><ul class="find">' + findings.join("") + outl.join("") + "</ul>"
        : '<p class="ok-box">ทุกหน่วยที่ตรวจวัดผ่านเกณฑ์ ไม่พบความผิดปกติ</p>');
  } else {
    ivSec = "";
  }
  /* เส้นทางเดินดวงอาทิตย์ + แผนที่เงา — ทิศทางแสงตัดสินเงาทั้งหมด ไม่ขึ้นกับวันที่ */
  const sunSec = !(P.ivSun && D.sunPath) ? "" :
    "<h3>เส้นทางเดินดวงอาทิตย์ตลอดปี และทิศทางแสงที่ทำให้แผงโดนบัง</h3>" +
    rpSunPath(D.sunPath, D.isoShade) +
    '<p class="note">แกนนอนคือทิศที่ดวงอาทิตย์อยู่ (0° เหนือ · 90° ตะวันออก · 180° ใต้ · 270° ตะวันตก) แกนตั้งคือมุมสูงเหนือขอบฟ้า · ' +
    "เส้นโค้งสีส้ม 7 เส้นคือเส้นทางเดินของดวงอาทิตย์ในวันตัวแทนแต่ละช่วงของปี เส้นประคือเวลา · " +
    "ที่ละติจูดของประเทศไทย ฤดูร้อนดวงอาทิตย์อ้อมไปทางทิศเหนือ เส้นทางเดินจึงข้ามขอบซ้าย–ขวาของกราฟ" +
    (D.isoShade ? " · แผนที่เงาคิดจากการยิงลำแสงไปทั่วท้องฟ้า " + D.isoShade.cells.length + " ทิศทาง ผ่านโมเดล 3 มิติของหน้างานจริง" : "") + "</p>";
  /* ชุดเส้น I-V / P-V แบบดาต้าชีต */
  const famSec = !(P.ivFam && (D.ivFamG || []).length) ? "" :
    "<h3>เส้น P-V &amp; I-V ที่ความเข้มแสงต่าง ๆ (ต่อ 1 แผง · เซลล์ 25 °C)</h3>" +
    rpIvFamily(D.ivFamG, "irr") +
    rpTable(["ความเข้มแสง", "Voc", "Isc", "Vmp", "Imp", "Pmax", "Fill Factor", "เทียบ STC"],
      D.ivFamG.map((c) => [c.label, c.voc + " V", c.isc + " A", c.vmp + " V", c.imp + " A",
        { v: c.pmax + " W", cls: "ok" }, c.ff + " %",
        D.ivFamG[0].pmax > 0 ? scR(c.pmax / D.ivFamG[0].pmax * 100, 1) + " %" : "—"])) +
    '<p class="note">แสงลดลงครึ่งหนึ่ง กระแสลดลงครึ่งหนึ่งตาม แต่แรงดันวงจรเปิดแทบไม่เปลี่ยน (ตกแบบลอการิทึม) — ' +
    "นี่คือเหตุผลที่วันเมฆครึ้มระบบยังจ่ายไฟได้และอินเวอร์เตอร์ยังทำงานในช่วง MPPT · เทียบกับกราฟบนดาต้าชีตของแผงรุ่นนี้ได้ตรง ๆ</p>" +
    (!(D.ivFamT || []).length ? "" :
      "<h3>เส้น P-V &amp; I-V ที่อุณหภูมิเซลล์ต่าง ๆ (ทั้งสตริง · แสง 1000 W/m²)</h3>" +
      rpIvFamily(D.ivFamT, "temp") +
      rpTable(["อุณหภูมิเซลล์", "Voc", "Isc", "Vmp", "Imp", "Pmax", "เทียบที่ 25 °C"],
        D.ivFamT.map((c) => [c.label, c.voc + " V", c.isc + " A", c.vmp + " V", c.imp + " A",
          { v: (c.pmax >= 1000 ? scR(c.pmax / 1000, 2) + " kW" : c.pmax + " W"), cls: "ok" },
          D.ivFamT[0].pmax > 0 ? scR(c.pmax / D.ivFamT[0].pmax * 100, 1) + " %" : "—"])) +
      '<p class="note">ความร้อนกินแรงดัน ไม่ได้กินกระแส — เส้นเลื่อนเข้าหาแกนซ้ายแต่ความสูงเกือบไม่เปลี่ยน · ' +
      "จึงต้องตรวจ Voc ตอนเช้าที่อากาศเย็นที่สุด (แรงดันสูงสุด ห้ามเกินพิกัดอินเวอร์เตอร์) และเป็นเหตุผลที่บ่ายแดดแรงแต่ได้ไฟน้อยกว่าที่คาด</p>");
  ivSec = daySec + yearSec + sunSec + famSec + ivAllSec + (ivSec ? "<h3>ผลตรวจวัดเทียบกับค่าที่ควรได้</h3>" + ivSec : "");

  /* 5 · ผลผลิต (มีส่วนเงาบังนำหน้า ถ้าคำนวณจากโมเดล 3 มิติไว้) */
  let shadeSec = "";
  const sh = P.shade ? D.shade3d : null;
  if (sh) {
    shadeSec = "<h3>เงาบังตลอดทั้งปี (คำนวณจากโมเดล 3 มิติ)</h3>" +
      rpTable(["ที่มาของการสูญเสียจากเงา", "ทั้งปี"], [
        ["เงาบังตามพื้นที่จริง", sh.geoOnly + " %"],
        ["ผลจากการฉุดกำลังทั้งสตริง", { v: "+" + sh.elecExtra + " %", cls: "warn" }],
        ["รวมที่เสียจริง", { v: sh.overall + " %", cls: sh.overall >= 5 ? "bad" : "ok" }],
      ]) +
      ((sh.worst || []).length
        ? "<h3>แผงที่โดนเงาหนักที่สุด</h3>" +
          rpTable(["ผืนหลังคา", "ตำแหน่งแผง", "เงาบังทั้งปี"], sh.worst.map((w) => [w.roofName, w.key, { v: w.pct + " %", cls: w.pct >= 15 ? "bad" : "warn" }])) +
          '<p class="note">แผงกลุ่มนี้ถ้าย้ายตำแหน่งไม่ได้ ควรแยกไปสตริงของตัวเองหรือใช้ออปติไมเซอร์ ไม่งั้นจะฉุดกำลังทั้งสตริงลงมาตามใบที่โดนบัง</p>'
        : '<p class="ok-box">ไม่มีแผงใบไหนโดนเงาบังเกิน 3% ต่อปี</p>');
  }
  let prodSec = shadeSec;
  if (E && L) {
    prodSec += "<h3>ผลผลิตรายเดือน ปีแรก (kWh)</h3>" + rpMonthly(E.monthly) +
      rpTable(["กลุ่มทิศทาง", "มุมเอียง", "ทิศ", "แผง", "kWp", "เงาบัง", "kWh/kWp", "kWh/ปี"],
        E.perGroup.map((g) => [g.roofName + (g.side ? " · " + g.side : ""), g.tilt + "°", g.az + "°", g.count, g.kwp,
          (g.shade || 0) + " %", rpN(g.kwhPerKwp), rpN(g.kwh)])) +
      '<p class="note">คำนวณจากตำแหน่งดวงอาทิตย์จริงทุก 30 นาทีตลอดปี ฉายลงระนาบเอียงจริงของแต่ละกลุ่มแผง ' +
      "หักอุณหภูมิเซลล์รายเดือน ค่าสูญเสียระบบรวม " + E.dcLoss + "% " +
      (E.shadeMode === "model" ? "เงาบังรายกลุ่มจากโมเดล 3 มิติ (เฉลี่ย " + E.shadeLoss + "%) " : "เงาบัง " + E.shadeLoss + "% (กรอกมือ) ") +
      "ประสิทธิภาพอินเวอร์เตอร์ " + E.eff + "%" +
      (E.clipLoss > 0.2 ? " และการตัดยอดที่ขนาด AC จริง " + E.clipLoss + "% (" + rpN(E.clipKwh) + " kWh/ปี)" : "") + "</p>" +
      (P.loss && (E.chain || []).length
        ? "<h3>แผนภาพค่าสูญเสียของระบบ — จากแสงที่ได้ ถึงไฟที่ส่งออกจริง</h3>" +
          rpLossFlow(E.chain) +
          '<p class="note">ลำน้ำสีเขียวคือพลังงานที่ยังเหลืออยู่ ความกว้างแปรตามปริมาณจริง · สายที่แยกออกข้างทางคือที่เสียไปในแต่ละด่าน · ' +
          "ทุกตัวเลขมาจากการเดินเวลาชุดเดียวกับที่คำนวณผลผลิตข้างต้น บรรทัดสุดท้ายจึงเท่ากับผลผลิตปีแรกพอดี · " +
          "Performance Ratio " + E.pr + "% คือบรรทัดสุดท้ายหารบรรทัดแรก เป็นตัวเลขมาตรฐานที่ใช้เทียบคุณภาพงานติดตั้งข้ามโครงการโดยไม่ต้องสนใจว่าหน้างานไหนแดดแรงกว่ากัน</p>"
        : "") +
      (P.pxx && D.px
        ? "<h3>ผลผลิตนี้มั่นใจได้แค่ไหน — P50 / P90</h3>" + rpPxx(D.px, D.pxMode || "avg") +
          rpTable(["ระดับความมั่นใจ", "ผลผลิต (kWh/ปี)", "% ของค่ากลาง", "ความหมาย"],
            (D.pxMode === "one" ? D.px.one : D.px.avg).map((r) => [
              "P" + r.p, { v: rpN(r.kwh), cls: r.p === 90 ? "ok" : "" }, r.pct + " %",
              r.p === 50 ? "ค่ากลาง — โอกาสได้มากกว่านี้ครึ่งหนึ่ง" : "มั่นใจ " + r.p + "% ว่าผลผลิตจะไม่ต่ำกว่านี้"])) +
          rpTable(["ที่มาของความไม่แน่นอน", "± % (1σ)"],
            D.px.parts.map((p) => [p.label, p.v + " %"])
              .concat([[{ html: "<b>รวมทั้งหมด (รากที่สองของผลบวกกำลังสอง)</b>" },
                { v: (D.pxMode === "one" ? D.px.sigma1 : D.px.sigmaN) + " %", cls: "ok" }]])) +
          '<p class="note">ตัวเลขผลผลิตทุกหัวข้อในรายงานนี้เป็นค่ากลาง (P50) — มีโอกาสครึ่งหนึ่งที่ปีจริงจะได้น้อยกว่านั้น ' +
          "ธนาคารและผู้ลงทุนจึงนิยมดู P90 = " + rpN(D.pxMode === "one" ? D.px.p90one : D.px.p90avg) + " kWh/ปี " +
          "ซึ่งเป็นระดับที่มั่นใจได้ 90% ว่าทำได้ไม่ต่ำกว่านี้ · " +
          (D.pxMode === "one" ? "คิดแบบ “ปีใดปีหนึ่ง” จึงเผื่อความแปรปรวนของแสงเต็มจำนวน"
            : "คิดแบบ “ค่าเฉลี่ยตลอด " + D.px.years + " ปี” ความแปรปรวนของแสงเฉลี่ยกันเองไปแล้ว ตัวเลขจึงแคบกว่าการมองปีเดียว") + "</p>"
        : "") +
      /* ตารางรายปีไม่ต้องมีตรงนี้ — หัวข้อผลตอบแทนมีคอลัมน์ ปี/ผลผลิต/เหลือ% อยู่แล้วพร้อมตัวเงิน
         เหลือไว้บรรทัดเดียวพอ เพราะยอดรวมตลอดอายุเป็นตัวเลขที่อ้างถึงบ่อย */
      '<p class="note">ตลอดอายุ ' + L.years + " ปี ผลิตได้รวม " + rpN(L.total) + " kWh · เฉลี่ยปีละ " + rpN(L.avg) +
      " kWh · ปีสุดท้ายเหลือ " + L.lastPct + "% ของกำลังเดิม (ดูรายปีพร้อมตัวเงินได้ที่หัวข้อผลตอบแทนการลงทุน)</p>";
  }

  /* 6 · สิ่งแวดล้อม */
  const EV = D.env;
  const envSec = !EV ? "" :
    '<div class="kpis">' +
    rpCard("ลดคาร์บอนได้ปีละ", EV.co2YearT, "tCO₂e", "hi") +
    rpCard("ตลอด " + EV.years + " ปี", EV.co2LifeT, "tCO₂e", "hi") +
    rpCard("เท่ากับปลูกไม้ยืนต้น", rpN(EV.trees), "ต้น") +
    rpCard("คืนทุนทางคาร์บอน", EV.carbonPayback == null ? "—" : EV.carbonPayback, "ปี") +
    "</div>" +
    rpTable(["ปริมาณคาร์บอนที่ลดได้ เทียบเท่ากับ", "ต่อปี", "ตลอด " + EV.years + " ปี"], [
      ["ก๊าซเรือนกระจกที่ไม่ถูกปล่อย", { v: rpN(EV.co2Year) + " kgCO₂e", cls: "ok" }, { v: rpN(EV.co2Life) + " kgCO₂e", cls: "ok" }],
      ["การปลูกไม้ยืนต้น (ดูดซับ 9.5 kgCO₂/ต้น/ปี)", rpN(EV.trees) + " ต้น", rpN(EV.treesLife) + " ต้น"],
      ["การไม่ขับรถยนต์นั่งส่วนบุคคล (0.12 kgCO₂/กม.)", rpN(EV.carKm) + " กม.", rpN(EV.carKm * EV.years) + " กม."],
      ["น้ำมันเบนซินที่ไม่ถูกเผา (2.31 kgCO₂/ลิตร)", rpN(EV.petrol) + " ลิตร", rpN(EV.petrol * EV.years) + " ลิตร"],
      ["ไฟฟ้าที่ครัวเรือนไทยใช้ทั้งปี (~200 หน่วย/เดือน)", EV.homes + " หลัง", "—"],
    ]) +
    rpTable(["คาร์บอนที่ใช้สร้างระบบ (embodied carbon)", "ค่า"], [
      ["กำลังติดตั้ง", (E ? E.dcKw : "—") + " kWp"],
      ["คาร์บอนต่อกำลังติดตั้ง 1 kWp", scNum(EV.embod) && E && E.dcKw ? Math.round(EV.embod / E.dcKw) + " kgCO₂e" : "—"],
      ["รวมคาร์บอนที่ใช้ผลิต ขนส่ง และติดตั้ง", EV.embodT + " tCO₂e"],
      ["ระยะเวลาคืนทุนทางคาร์บอน", { v: (EV.carbonPayback == null ? "—" : EV.carbonPayback + " ปี"), cls: "ok" }],
      ["ตลอดอายุระบบลดได้กี่เท่าของที่ใช้สร้าง", { v: (EV.ratio == null ? "—" : EV.ratio + " เท่า"), cls: "ok" }],
    ]) +
    '<p class="note">คำนวณจากไฟฟ้าที่ระบบนี้ผลิตได้จริงตามผลจำลองในรายงานฉบับนี้ คูณด้วยค่าการปล่อยก๊าซเรือนกระจกของไฟฟ้าจากระบบสายส่งไทย ' +
    EV.ef + " kgCO₂e ต่อหน่วย (อ้างอิงองค์การบริหารจัดการก๊าซเรือนกระจก) · " +
    "ค่าคาร์บอนที่ใช้สร้างระบบเป็นค่ากลางของแผงผลึกเดี่ยวรุ่นปัจจุบัน ใช้ประเมินว่าระบบเริ่มเป็นบวกต่อสิ่งแวดล้อมเมื่อไหร่</p>";

  /* 7 · การใช้ไฟ · แบตเตอรี่ · ห้ามไหลย้อน */
  const DS = D.dis, PF = D.prof, BT = D.battS, GC = D.gridCfg || {};
  const gridLabel = GC.mode === "zero" ? "ห้ามไหลย้อนเด็ดขาด (zero export)"
    : GC.mode === "limit" ? "ปล่อยออกได้ไม่เกิน " + scNum(GC.expLimitKw) + " kW" : "ขายคืนได้ไม่จำกัด";
  /* เดือนตัวแทนของกราฟรายวัน = เดือนที่ต้องตัดไฟทิ้งมากที่สุด (ถ้าไม่มี ใช้เดือนที่ผลิตได้เยอะสุด)
     เพราะเป็นเดือนที่เห็นปัญหาชัดที่สุด ลูกค้าจะได้เห็นว่าเงินหายไปตรงไหน */
  const flowM = DS ? (DS.curt > 0
    ? DS.months.slice().sort((a, b) => b.curt - a.curt)[0].m
    : DS.months.slice().sort((a, b) => b.pv - a.pv)[0].m) : 0;
  const loadSec = !DS ? "" :
    '<div class="kpis">' +
    rpCard("ผลิตแล้วได้ใช้เอง", DS.selfPct, "%", "hi") +
    rpCard("ไฟที่ใช้มาจากโซลาร์", DS.suffPct, "%", "hi") +
    rpCard("ขายคืนการไฟฟ้า", rpN(DS.exp), "kWh/ปี") +
    rpCard("ยังต้องซื้อไฟ", rpN(DS.imp), "kWh/ปี") +
    (DS.curt > 0 ? rpCard("ตัดทิ้งเพราะห้ามไหลย้อน", rpN(DS.curt), "kWh/ปี") : "") +
    (DS.on ? rpCard("แบตใช้ไปปีละ", rpN(DS.cycles), "รอบ") : "") +
    "</div>" +
    rpTable(["สมมติฐานการใช้ไฟของลูกค้า", "ค่า"], [
      ["ลักษณะการใช้ไฟ", PF ? PF.label : "—"],
      ["ใช้ไฟทั้งปี", PF ? rpN(PF.annual) + " kWh (เฉลี่ยวันละ " + PF.perDay + " kWh)" : "—"],
      ["เงื่อนไขฝั่งการไฟฟ้า", { v: gridLabel, cls: GC.mode === "sell" ? "ok" : "" }],
      ["แบตเตอรี่", DS.on && BT ? BT.cap + " kWh (ใช้ได้จริง " + BT.usable + " kWh) · ชาร์จ/จ่าย " + scNum(BT.pKw) + " kW" : "ไม่มีในระบบนี้"],
    ]) +
    (P.loadDay
      ? "<h3>ไฟที่ผลิตได้ในวันเฉลี่ยเดือน" + SC_MON[flowM].replace(".", "") + " ถูกเอาไปทำอะไร</h3>" +
        rpFlowDay(DS.dayRows[flowM], "pv", DS.on) + rpFlowLegend(["direct", "chg", "exp", "curt"], DS.on) +
        "<h3>ไฟที่ลูกค้าใช้ในวันเดียวกัน มาจากไหน</h3>" +
        rpFlowDay(DS.dayRows[flowM], "load", DS.on) + rpFlowLegend(["direct", "dis", "imp"], false) +
        '<p class="note">จำลองทีละชั่วโมงตลอดทั้ง 12 เดือน โดยเทียบไฟที่ระบบผลิตได้กับรูปการใช้ไฟของลูกค้าในเวลาเดียวกัน ' +
        "ลำดับการจ่ายคือ ใช้เองก่อน → เก็บเข้าแบต → ที่เหลือขายคืนหรือตัดทิ้งตามเงื่อนไขการไฟฟ้า</p>"
      : "") +
    (P.loadMon
      ? "<h3>สรุปรายเดือน (kWh)</h3>" +
        rpTable(["เดือน", "ผลิตได้", "ลูกค้าใช้ไฟ", "ใช้ตรง ๆ"].concat(DS.on ? ["จากแบต"] : [])
          .concat(["ขายคืน"]).concat(DS.curt > 0 ? ["ตัดทิ้ง"] : []).concat(["ซื้อจากการไฟฟ้า", "ใช้เอง %"]),
          DS.months.map((mo) => [mo.label, rpN(mo.pv), rpN(mo.load), rpN(mo.direct)]
            .concat(DS.on ? [rpN(mo.dis)] : []).concat([rpN(mo.exp)])
            .concat(DS.curt > 0 ? [{ v: rpN(mo.curt), cls: mo.curt > 0 ? "bad" : "" }] : [])
            .concat([rpN(mo.imp), { v: mo.selfPct + " %", cls: "ok" }])))
      : "") +
    (P.battSpec && DS.on && BT
      ? "<h3>สเปคแบตเตอรี่ที่ใช้ในการคำนวณ</h3>" +
        rpTable(["รายการ", "ค่า", "ที่มา / ความหมาย"], [
          ["ชนิดเซลล์", (SC_CHEM[BT.chem] || {}).label || BT.chem, "กำหนดอายุ รอบการใช้งาน และ DoD ที่ปลอดภัย"],
          ["ความจุตามป้าย", BT.cap + " kWh", "ตัวเลขบนดาต้าชีตของผู้ผลิต"],
          ["ใช้ได้จริง (DoD " + scNum(BT.dod) + "%)", { v: BT.usable + " kWh", cls: "ok" }, "ลึกกว่านี้แบตเสื่อมเร็ว"],
          ["กันไว้เผื่อไฟดับ", BT.reserve + " kWh (" + scNum(BT.reservePct) + "% ของความจุใช้งาน)", "ส่วนนี้ไม่ถูกใช้ลดค่าไฟ"],
          ["ส่วนที่ใช้ลดค่าไฟได้จริง", { v: BT.work + " kWh", cls: "ok" }, "ความจุใช้งาน หักที่กันไว้สำรอง"],
          ["กำลังชาร์จ / จ่ายสูงสุด", scNum(BT.pKw) + " kW", "เอาค่าที่น้อยกว่าระหว่างตัวแบตกับอินเวอร์เตอร์ไฮบริด"],
          ["ประสิทธิภาพไป-กลับ", scNum(BT.rte) + " %", "ไฟหายไปในการเก็บ-จ่ายปีละ " + rpN(DS.battLoss) + " kWh"],
          ["แบตกินไฟเองต่อวัน", scNum(BT.standby) + " % ของความจุ", "BMS พัดลม และวงจรสแตนด์บาย"],
          ["จำนวนรอบจนหมดอายุ", rpN(BT.cycles) + " รอบ", "ใช้จริงจากการจำลอง " + rpN(DS.cycles) + " รอบ/ปี"],
          ["อายุปฏิทิน", scNum(BT.calYears) + " ปี", "เสื่อมตามเวลาแม้ไม่ค่อยได้ใช้"],
          ["อายุที่ประเมินได้", { v: (DS.battLife == null ? "—" : DS.battLife + " ปี"), cls: "ok" },
            DS.byCycle != null && DS.byCycle < scNum(BT.calYears) ? "หมดรอบก่อนหมดอายุปฏิทิน" : "หมดอายุปฏิทินก่อนใช้ครบรอบ"],
          ["ความจุคงเหลือตอนหมดอายุ", scNum(BT.eol) + " %", "เกณฑ์สิ้นอายุการใช้งานตามมาตรฐาน"],
          ["ราคาแบตที่ใช้คิด", rpN(BT.capex) + " บาท", BT.costMode === "lump" ? "กรอกเป็นยอดรวมทั้งชุด" : scNum(BT.cost) + " บาท/kWh"],
        ]) +
        '<p class="note">รายการที่ต้องตรวจเพิ่มก่อนสั่งซื้อแต่ไม่ได้นำมาคิดเป็นตัวเงินในรายงานนี้: แรงดันระบบ (48V หรือ High-Voltage) ต้องตรงกับอินเวอร์เตอร์ไฮบริดที่เลือก · ' +
        "กระแสชาร์จ/จ่ายสูงสุดต่อโมดูล · ช่วงอุณหภูมิใช้งานและความจำเป็นในการระบายอากาศ · ระดับการป้องกันของตู้ (IP) · " +
        "มาตรฐานความปลอดภัย (IEC 62619 / IEC 62933 / มอก.) · เงื่อนไขและอายุการรับประกันของผู้ผลิต</p>"
      : "") +
    '<p class="note">ตัวเลข “ใช้เอง ' + DS.selfPct + '%” นี้ไม่ได้ตั้งขึ้นเอง แต่มาจากการจำลองเทียบชั่วโมงต่อชั่วโมงตลอดทั้งปี ' +
    "และถูกนำไปใช้คิดผลตอบแทนในหัวข้อถัดไปโดยตรง — หน่วยที่ใช้เองมีมูลค่าเท่าค่าไฟเต็ม ส่วนที่ขายคืนได้ราคาต่ำกว่า" +
    (DS.curt > 0 ? " และหน่วยที่ถูกตัดทิ้งไม่มีมูลค่าเลย" : "") + "</p>";

  /* 8 · ROI */
  let roiSec = "";
  if (roi) {
    roiSec =
      '<div class="kpis">' +
      rpCard("เงินลงทุน", rpN(roi.capex), "บาท") +
      rpCard("คืนทุนภายใน", roi.payback ? roi.payback : "> " + roi.years, "ปี") +
      rpCard("IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี") +
      rpCard("NPV", rpN(Math.round(roi.npv / 1000)), "พันบาท") +
      rpCard("ต้นทุนไฟที่ผลิตเอง", roi.lcoe, "บาท/หน่วย") +
      rpCard("กำไรสุทธิ " + roi.years + " ปี", rpN(Math.round(roi.netTotal / 1000)), "พันบาท") +
      "</div>" + rpCash(roi) +
      rpTable(["ปี", "ผลผลิต kWh", "เหลือ %", "ประหยัดค่าไฟ", "ขายคืน", "ค่าดูแล", "สุทธิ", "สะสม"],
        roi.rows.map((r) => [r.year, rpN(r.kwh), r.keep, rpN(r.save), rpN(r.sell), rpN(r.om + r.rep), rpN(r.net),
          { v: rpN(r.cum), cls: r.cum >= 0 ? "ok" : "" }])) +
      '<p class="note">สมมติฐาน: ค่าไฟ ' + R.tariff + " บาท/หน่วย ปรับขึ้นปีละ " + R.escal + "% · " +
      (roi.split
        ? "ใช้ไฟเอง " + scR((roi.split.direct + roi.split.dis) * 100, 1) + "% และขายคืน " + scR(roi.split.exp * 100, 1) +
          "% (มาจากการจำลองชั่วโมงต่อชั่วโมงในหัวข้อการใช้ไฟ ไม่ใช่ค่าที่ตั้งเอง)"
        : "ใช้ไฟเอง " + R.selfUse + "% ส่วนที่เหลือ") +
      " ขายคืนหน่วยละ " + R.exportRate + " บาท · ค่าดูแลรักษาปีละ " + R.om + "% ของค่าติดตั้ง · อัตราคิดลด " + R.discount + "%" +
      (scNum(R.invRepCost) ? " · เผื่อเปลี่ยนอินเวอร์เตอร์ปีที่ " + R.invRepYear + " เป็นเงิน " + rpN(R.invRepCost) + " บาท" : "") +
      (roi.battCapex > 0
        ? " · เงินลงทุนแยกเป็นโซลาร์ " + rpN(roi.pvCapex) + " บาท และแบตเตอรี่ " + rpN(roi.battCapex) +
          " บาท ซึ่งเผื่อเปลี่ยนใหม่ทุก " + (D.dis && D.dis.battLife ? Math.round(D.dis.battLife) : "—") + " ปี"
        : "") +
      (roi.kYield < 1
        ? " · คิดที่ระดับความมั่นใจ P90 คือใช้ผลผลิตต่ำกว่าค่ากลาง " + scR((1 - roi.kYield) * 100, 1) + "%"
        : " · คิดที่ผลผลิตค่ากลาง P50") + "</p>";
  }

  const warnList = (D.warns || []).length
    ? '<ul class="find">' + D.warns.map((w) => '<li class="warn">' + RP_ESC(w) + "</li>").join("") + "</ul>"
    : '<p class="ok-box">ไม่พบข้อควรแก้ในการออกแบบ</p>';

  /* ── เรียงหัวข้อตามที่ติ๊กเลือกไว้ แล้วค่อยแจกเลข ── */
  const secs = [];
  const addSec = (on, title, body, sub) => { if (on && body) secs.push(sec(secs.length + 1, title, body, sub)); };

  const cover = !P.cover ? "" :
    /* ── หน้าปก: เต็มหน้า A4 หนึ่งหน้า ── */
    '<header class="cover">' +
      '<div class="cv-bar">' +
        '<div class="brand"><img class="mark" src="' + RP_ESC(rpLogoURL()) + '" alt="PHITHAN GREEN">' +
        "<div><b>PHITHAN GREEN</b><span>ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์</span></div></div>" +
        '<span class="cv-tag">' + RP_ESC(job.code || "—") + "</span>" +
      "</div>" +
      '<div class="cv-mid">' +
        '<p class="cv-kick">รายงานการออกแบบและวิเคราะห์ระบบ</p>' +
        "<h1>ระบบผลิตไฟฟ้า<br>พลังงานแสงอาทิตย์บนหลังคา</h1>" +
        '<div class="cv-big"><b>' + (E ? rpN(E.dcKw, 2) : "—") + "</b><i>kWp</i>" +
        "<span>ผลิตได้ปีละราว " + (L ? rpN(L.rows[0].kwh) : "—") + " kWh" +
        (roi && roi.payback ? " · คืนทุนใน " + roi.payback + " ปี" : "") + "</span></div>" +
      "</div>" +
      (D.snapImg ? '<figure class="cv-shot"><img src="' + D.snapImg + '" alt="ผังการติดตั้ง 3 มิติ">' +
        "<figcaption>ผังการติดตั้งจำลอง 3 มิติ — ทุกตัวเลขในรายงานนี้อ้างอิงจากโมเดลนี้</figcaption></figure>" : "") +
      '<div class="cv-meta">' +
        "<span><i>ลูกค้า</i>" + RP_ESC(job.name || "—") + "</span>" +
        "<span><i>สถานที่ติดตั้ง</i>" + RP_ESC([job.address, job.province].filter(Boolean).join(" ") || "—") + "</span>" +
        "<span><i>วันที่ออกรายงาน</i>" + RP_ESC(today) + "</span>" +
      "</div>" +
    "</header>";

  /* ── สรุปผู้บริหาร: ตัวเลขสำคัญทั้งหมดในหน้าเดียว ── */
  const summary = !P.summary ? "" :
    '<section class="sec sum"><h2><span class="no">✦</span>สรุปผลการออกแบบ<small>' +
      RP_ESC(job.code || "") + "</small></h2>" +
      '<div class="kpis">' + kpis + "</div>" +
      '<p class="note">ตัวเลขทั้งหมดมาจากการจำลองตำแหน่งดวงอาทิตย์จริงที่พิกัดของงานนี้ ร่วมกับโมเดล 3 มิติของอาคาร ' +
      "รายละเอียดวิธีคิดและสมมติฐานอยู่ในหัวข้อถัดไปทั้งหมด</p></section>";

  addSec(P.equip, "อุปกรณ์ที่ใช้", specTbl + "<h3>ผืนหลังคาและทิศทางแผง</h3>" + groupTbl,
      D.totalPanels + " แผง · " + (D.groups || []).length + " กลุ่มทิศทาง");
  addSec(P.wiring, D.isMicro ? "การต่อไมโครอินเวอร์เตอร์" : "การต่อสตริงและช่อง MPPT",
      wiring + microNote + phaseSec + wiringNote +
      (P.layout
        ? "<h3>ผังแผงมองจากด้านบน (สีเดียวกัน = " + (D.isMicro ? "ไมโครตัวเดียวกัน" : "สตริงเดียวกัน") +
          (D.isMicro && D.phases === 3 ? " · ตัวหนังสือบนแผง = เฟส" : "") + " · ทิศเหนืออยู่บน)</h3>" +
          rpLayout(D.foot, D.assign, D.uidPhase)
        : "") +
      (D.isMicro && (D.microUnits || []).length
        ? rpTable(["ไมโคร", "แผง", "กลุ่มทิศทาง"].concat(D.phases === 3 ? ["เฟส"] : []).concat(["หมายเหตุ"]),
            D.microUnits.map((u) => [
              { html: '<span class="dot" style="background:' + (typeof suColor === "function" ? suColor(u.id) : "#22A35B") + '"></span><b>ตัวที่ ' + u.id + "</b>" },
              u.n, u.gLabel]
              .concat(D.phases === 3 ? [{ v: (((D.uidPhase || {})[(u.uids || [])[0]]) || "—"), cls: "ok" }] : [])
              .concat([{ v: u.mixed ? "คร่อมกลุ่มทิศทาง" : u.over ? "ใส่แผงเกินพิกัด" : "ปกติ",
                cls: u.mixed || u.over ? "bad" : "ok" }]))) +
          '<p class="note">ช่างเดินตามผังนี้ได้เลย — แผงสีเดียวกันเสียบเข้าไมโครตัวเดียวกัน' +
          (D.phases === 3 ? " และตัวหนังสือบนแผงบอกเฟสที่ต้องต่อ" : "") + "</p>"
        : "") +
      "<h3>ข้อควรแก้</h3>" + warnList);
  addSec(P.iv, "แสง เงา และผลตรวจวัด I-V", ivSec,
      rows.length && P.ivMeas ? rows.length + " หน่วย · เฉลี่ย " + D.ivAvg + "% ของที่ควรได้"
        : (sim ? "จำลองทั้งวัน · " + rpN(sim.dayKwh, 1) + " kWh" : ""));
  addSec(P.prod, "ผลผลิตที่คาดการณ์", prodSec, L ? rpN(L.rows[0].kwh) + " kWh ในปีแรก" : "");
  addSec(P.env, "ผลกระทบต่อสิ่งแวดล้อม", envSec, EV ? "ลดคาร์บอน " + EV.co2LifeT + " tCO₂e ตลอด " + EV.years + " ปี" : "");
  addSec(P.load, "การใช้ไฟ แบตเตอรี่ และการขายคืน", loadSec,
      DS ? "ผลิตแล้วได้ใช้เอง " + DS.selfPct + "%" + (DS.on ? " · แบต " + (D.battS ? D.battS.cap : "") + " kWh" : "") : "");
  addSec(P.roi, "ผลตอบแทนการลงทุน", roiSec, roi && roi.payback ? "คืนทุน " + roi.payback + " ปี" : "");

  return '<!doctype html><html lang="th"><head><meta charset="utf-8">' +
    "<title>รายงานระบบโซลาร์ " + RP_ESC(job.code || "") + "</title>" +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    "<style>" + RP_CSS + "</style></head><body>" +
    cover + summary + secs.join("") +
    '<footer class="foot">' +
      "<p><b>หมายเหตุการใช้งานตัวเลขในรายงานนี้</b> — ผลผลิตคำนวณจากแบบจำลองท้องฟ้าและสถิติอากาศรายเดือนของประเทศไทย " +
      "ผลจริงขึ้นกับสภาพอากาศแต่ละปี เงาที่เปลี่ยนไปตามฤดู และการบำรุงรักษา · " +
      "ผลตรวจวัด I-V เป็นค่าที่ชดเชยกลับสู่สภาวะมาตรฐานแล้ว ความแม่นยำขึ้นกับความแม่นของเครื่องวัดความเข้มแสงและอุณหภูมิหน้างาน · " +
      "ตัวเลขผลตอบแทนเป็นการประมาณการตามสมมติฐานที่ระบุไว้ ไม่ใช่การรับประกันผลตอบแทน</p>" +
      "<p class='sig'>ผู้ออกแบบ / ผู้ตรวจวัด _______________________&nbsp;&nbsp;&nbsp;&nbsp; วันที่ ____________&nbsp;&nbsp;&nbsp;&nbsp; " +
      "ผู้รับมอบงาน _______________________&nbsp;&nbsp;&nbsp;&nbsp; วันที่ ____________</p>" +
    "</footer></body></html>";
}

const RP_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans Thai','Sarabun','Noto Sans Thai','Segoe UI',sans-serif;color:#16211D;background:#F4F6F5;
  font-size:11.5px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sec,.foot{background:#fff;max-width:820px;margin:0 auto 14px;padding:24px 30px}

/* ── หน้าปก: เขียวเข้มเต็มหน้า ตัวเลขเด่นตัวเดียว แล้วค่อยเป็นภาพจริง ── */
.cover{max-width:820px;margin:0 auto 14px;background:#0A3B29;color:#fff;position:relative;overflow:hidden;
  min-height:1010px;display:flex;flex-direction:column;padding:34px 38px 30px}
.cover::before{content:"";position:absolute;right:-190px;top:-210px;width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(52,199,123,.34),rgba(52,199,123,0) 68%)}
.cover::after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;
  background:linear-gradient(90deg,#34C77B 0%,#22A35B 45%,#0A3B29 100%)}
.cover>*{position:relative}
.cv-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.16)}
.brand{display:flex;align-items:center;gap:11px}
.brand .mark{width:36px;height:36px;object-fit:contain;display:block;background:#fff;border-radius:9px;padding:4px}
.brand b{display:block;font-size:13.5px;font-weight:700;letter-spacing:.03em}
.brand span{display:block;font-size:9.5px;color:rgba(255,255,255,.6)}
.cv-tag{font-size:10px;font-weight:700;letter-spacing:.12em;padding:5px 12px;border-radius:99px;
  border:1px solid rgba(255,255,255,.28);color:rgba(255,255,255,.85)}
.cv-mid{padding:52px 0 30px}
.cv-kick{font-size:10.5px;font-weight:600;letter-spacing:.18em;color:#63D89B;margin-bottom:14px}
h1{font-size:33px;font-weight:700;letter-spacing:-.6px;line-height:1.28}
.cv-big{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-top:34px;
  padding-top:22px;border-top:1px solid rgba(255,255,255,.16)}
.cv-big b{font-size:60px;font-weight:700;line-height:1;letter-spacing:-2.5px}
.cv-big i{font-style:normal;font-size:16px;font-weight:600;color:#63D89B}
.cv-big span{flex:1 0 100%;font-size:12px;font-weight:500;color:rgba(255,255,255,.72);margin-top:8px}
/* รูป 3 มิติเป็นพระเอกของหน้าปก — ใหญ่เต็มพื้นที่ที่เหลือ
   contain ไม่ใช่ cover เพราะต้องเห็นหลังคาทั้งหลัง ไม่ใช่ถูกครอบตัดจนดูไม่ออกว่าเป็นบ้านหลังไหน
   กรอบกว้างเท่ารูปพอดี ไม่ทิ้งแถบว่างสองข้าง (ภาพจาก 3D เป็นสัดส่วนอะไรก็ได้) */
.cv-shot{margin:26px 0 0;display:flex;flex-direction:column;flex:1;min-height:0}
/* รูปกินพื้นที่ที่เหลือของหน้าปกทั้งหมด (flex:1 บนตัว img เอง — height:100% ใช้ไม่ได้ในคอลัมน์ flex
   เพราะโดน flex-shrink หดจนเล็ก) ส่วน contain ทำให้เห็นบ้านทั้งหลังไม่ถูกครอบตัด */
.cv-shot img{flex:1;min-height:0;width:100%;object-fit:contain;display:block;padding:10px;
  border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14)}
.cv-shot figcaption{font-size:9px;color:rgba(255,255,255,.5);margin-top:9px;text-align:center}
.cv-meta{display:grid;grid-template-columns:1fr 1.6fr 1fr;gap:14px;margin-top:24px;
  padding-top:16px;border-top:1px solid rgba(255,255,255,.16)}
.cv-meta span{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:600;line-height:1.5}
.cv-meta i{font-style:normal;font-size:8.5px;font-weight:600;color:#63D89B;letter-spacing:.14em;text-transform:uppercase}

.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.kpi{border:1px solid #E3E8E6;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.kpi.hi{background:#F0F9F4;border-color:#BFE3CE}
.kpi .k{font-size:9.5px;font-weight:600;color:#7A8781}
.kpi .v{font-size:17px;font-weight:700;letter-spacing:-.3px}
.kpi .v small{font-size:9.5px;font-weight:600;color:#8A968F;margin-left:3px}
/* ตัดหน้าให้สวยตอนพิมพ์: ห้ามหัวข้ออยู่ท้ายหน้าโดด ๆ · ห้ามแถวตารางถูกผ่ากลาง · หัวตารางซ้ำทุกหน้า */
h2,h3{break-after:avoid;page-break-after:avoid}
.kpis,.ivbox,.two,.note,.ok-box,ul.find li,.legend,table.ymap{break-inside:avoid;page-break-inside:avoid}
table.t tr{break-inside:avoid;page-break-inside:avoid}
table.t thead{display:table-header-group}
/* กราฟกับคำอธิบายใต้กราฟต้องอยู่หน้าเดียวกัน ไม่ให้เส้นกราฟค้างท้ายหน้าแล้วคำอธิบายไปหน้าใหม่ */
.chart{break-inside:avoid;page-break-inside:avoid;break-after:avoid;page-break-after:avoid}
h2{font-size:14.5px;font-weight:700;display:flex;align-items:center;gap:9px;padding-bottom:9px;margin-bottom:13px;border-bottom:2px solid #16211D}
h2 .no{width:20px;height:20px;border-radius:99px;background:#22A35B;color:#fff;display:grid;place-items:center;font-size:10.5px;font-weight:700}
h2 small{margin-left:auto;font-size:10px;font-weight:600;color:#7A8781}
h3{font-size:11.5px;font-weight:700;margin:15px 0 7px;color:#3A4A43}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
table.t{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:4px}
table.t th{text-align:left;font-size:9px;font-weight:700;color:#7A8781;text-transform:uppercase;letter-spacing:.04em;
  padding:0 7px 5px;border-bottom:1px solid #C9D3CD;white-space:nowrap}
table.t td{padding:4.5px 7px;border-bottom:1px solid #EEF1F0;font-variant-numeric:tabular-nums;vertical-align:top}
table.t tbody tr:nth-child(even){background:#FAFBFB}
td.ok{color:#12794A;font-weight:700}
td.warn{color:#A35A08;font-weight:700}
td.bad{color:#B3261E;font-weight:700}
.note{font-size:9.5px;line-height:1.65;color:#6C7A74;margin-top:7px;padding-left:9px;border-left:2px solid #E3E8E6}
.chart{width:100%;display:block;margin:6px 0 10px}
.legend{font-size:9px;color:#6C7A74;margin:-4px 0 10px;overflow:hidden}
.lgd{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:center;font-size:9px;color:#3A4A43;margin:-4px 0 10px}
.lgd span{display:inline-flex;align-items:center;gap:5px;font-weight:600}
.lgd i{width:9px;height:9px;border-radius:2px;flex:0 0 auto}
.lgd i.dash{width:14px;height:0;border-radius:0;border-top:1.5px dashed #0F172A;opacity:.6}
table.strip{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:2px}
table.strip td{padding:2px 6px 2px 0;vertical-align:middle}
table.strip td:first-child{width:150px;color:#3A4A43;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{display:flex;height:12px;border-radius:4px;overflow:hidden}
.bar i{flex:1;display:block}
td .dot{display:inline-block;width:7px;height:7px;border-radius:99px;margin-right:6px;vertical-align:middle}
/* แผนที่ทั้งปี: เดือน × ชั่วโมง */
table.ymap{width:100%;border-collapse:collapse;margin:6px 0 2px}
table.ymap td{padding:1.5px 0;vertical-align:middle;border:0}
table.ymap td.mo{width:30px;font-size:9px;font-weight:700;color:#6C7A74;text-align:right;padding-right:7px;white-space:nowrap}
table.ymap td.mv{width:44px;font-size:9px;font-weight:700;color:#3A4A43;text-align:right;padding-left:7px;white-space:nowrap}
table.ymap td.mv.warn{color:#A35A08}
table.ymap td.mv.bad{color:#B3261E}
.hm{display:flex;gap:.6px;height:12px;border-radius:3px;overflow:hidden}
.hm i{flex:1;display:block}
.hm.hdr{height:11px;background:none;gap:.6px}
.hm.hdr i{font-size:7.5px;font-style:normal;font-weight:700;color:#8A968F;text-align:center;line-height:11px}
/* กรอบรายชื่อเส้น + กำลัง — แทนตัวเลขลอยบนกราฟที่ทับกันเวลามีหลายเส้น */
.ivlegend{display:flex;flex-wrap:wrap;gap:4px 14px;border:1px solid #E3E8E6;border-radius:9px;
  padding:8px 11px;margin:2px 0 8px;font-size:9.5px;break-inside:avoid;page-break-inside:avoid}
.ivlegend span{display:flex;align-items:center;gap:5px;font-weight:650;color:#3A4A43;white-space:nowrap}
.ivlegend i{width:12px;height:3px;border-radius:2px;display:block;flex:0 0 auto}
.ivlegend i.dash{background:repeating-linear-gradient(90deg,#A8B4AE 0 4px,transparent 4px 7px)}
.ivlegend b{font-weight:800;color:#16211D;font-variant-numeric:tabular-nums}
.ivlegend .stc{color:#8A968F;font-weight:600}
.ivgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px}
.ivbox{border:1px solid #E3E8E6;border-radius:9px;padding:8px 10px}
.ivh{font-size:10.5px;font-weight:700;margin-bottom:2px}
.ivh b{color:#12794A}
ul.find{list-style:none;display:flex;flex-direction:column;gap:7px;margin-top:6px}
ul.find li{font-size:10.5px;line-height:1.6;padding:8px 11px;border-radius:8px;border-left:3px solid}
ul.find li.warn{background:#FDF7EC;border-color:#D9911F}
ul.find li.bad{background:#FCF0EF;border-color:#B3261E}
ul.find li i{color:#6C7A74}
.ok-box{font-size:10.5px;font-weight:600;color:#12794A;background:#F0F9F4;border-left:3px solid #22A35B;border-radius:8px;padding:8px 11px;margin-top:6px}
.foot{font-size:9.5px;color:#6C7A74;line-height:1.7}
.foot .sig{margin-top:22px;padding-top:14px;border-top:1px solid #E3E8E6;font-size:10.5px;color:#16211D}
@media print{
  body{background:#fff;font-size:10.5px}
  .sec,.foot{max-width:none;margin:0;padding:0 0 10px;page-break-after:auto}
  .sec{padding-top:10px}
  /* หน้าปกกินเต็มหนึ่งหน้า A4 พอดี แล้วขึ้นหน้าใหม่เสมอ
     ไม่ใช้ margin ติดลบดันสีเขียวออกนอกขอบกระดาษ เพราะทำให้หน้ากว้างเกินและเบราว์เซอร์แถมหน้าว่างมา */
  .cover{max-width:none;min-height:auto;height:265mm;margin:0;padding:15mm 14mm 11mm;
    page-break-after:always;break-after:page}
  /* บีบช่องว่างส่วนหัวปกลงให้มากที่สุด แล้วยกพื้นที่ที่เหลือทั้งหมดไปให้รูป 3 มิติ
     (ผู้ใช้ต้องการรูปใหญ่เต็มหน้าปก ไม่ใช่รูปเล็ก ๆ กลางหน้า) */
  .cover .cv-mid{padding:22px 0 8px}
  .cover h1{font-size:26px}
  .cover .cv-kick{margin-bottom:10px}
  .cover .cv-big{margin-top:16px;padding-top:12px}
  .cover .cv-big b{font-size:44px}
  .cover .cv-big span{margin-top:5px}
  .cover .cv-shot{margin-top:10px}
  .cover .cv-shot img{max-height:none;min-height:0}
  .cover .cv-meta{margin-top:12px;padding-top:11px}
  /* หัวข้อใหญ่แต่ละหัวข้อขึ้นหน้าใหม่ — อ่านเป็นบท ๆ ไม่มีหัวข้อค้างท้ายหน้า */
  .sec{page-break-before:always;break-before:page}
  .sec.sum{page-break-before:avoid;break-before:auto}
  .foot{page-break-before:always;break-before:page}
  @page{size:A4;margin:14mm 13mm}
}
`;

/* เปิดหน้าต่างใหม่ → ใส่รายงาน → เรียกกล่องพิมพ์ (เลือก "บันทึกเป็น PDF" ได้เลย) */
function suPrintReport(D) {
  const html = suReportHTML(D);
  const w = window.open("", "_blank");
  if (!w) { alert("เบราว์เซอร์บล็อกหน้าต่างใหม่ไว้ — อนุญาต pop-up ของเว็บนี้แล้วกดออกรายงานอีกครั้ง"); return null; }
  w.document.open();
  w.document.write(html);
  w.document.close();
  /* รอให้ฟอนต์ + รูป (โลโก้/ภาพ 3 มิติ) โหลดเสร็จก่อนค่อยเรียกกล่องพิมพ์
     ไม่งั้นตัวอักษรไทยจะเลื่อน หรือได้ PDF ที่ช่องรูปว่างเปล่า */
  const go = () => { try { w.focus(); w.print(); } catch (e) {} };
  const imgsReady = () => {
    const imgs = Array.prototype.slice.call(w.document.images || []);
    const left = imgs.filter((im) => !im.complete);
    if (!left.length) return Promise.resolve();
    return Promise.all(left.map((im) => new Promise((res) => {
      im.addEventListener("load", res); im.addEventListener("error", res);
    })));
  };
  const fonts = w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve();
  Promise.race([
    Promise.all([fonts, imgsReady()]),
    new Promise((res) => setTimeout(res, 6000)),   // กันค้างถ้ารูปโหลดไม่ขึ้น
  ]).then(() => setTimeout(go, 250));
  return w;
}

Object.assign(window, { suReportHTML, suPrintReport, RP_SECTIONS, rpPickAll, rpTable, rpMonthly, rpCash, rpIv,
  rpDayPower, rpYearMap, rpIvAll, rpLossFlow, rpSunPath, rpIvFamily, rpFlowDay, rpPxx, RP_FLOW, RP_CSS });
