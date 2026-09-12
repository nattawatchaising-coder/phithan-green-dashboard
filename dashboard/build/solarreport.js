const RP_ESC = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
})[c]);
const rpN = (v, d) => {
  const n = parseFloat(v);
  return isFinite(n) ? n.toLocaleString("en-US", {
    minimumFractionDigits: d || 0,
    maximumFractionDigits: d == null ? 0 : d
  }) : "—";
};
const rpLogoURL = () => {
  try {
    return new URL("dashboard/assets/flash-mark.png", location.href).href;
  } catch (e) {
    return "";
  }
};
function rpTable(head, rows, opt) {
  opt = opt || {};
  const th = head.map(h => "<th" + (opt.right && opt.right.indexOf(h) >= 0 ? ' class="r"' : "") + ">" + RP_ESC(h) + "</th>").join("");
  const tb = rows.map(r => "<tr>" + r.map((c, i) => {
    const cell = c && typeof c === "object" ? c : {
      v: c
    };
    return "<td" + (cell.cls ? ' class="' + cell.cls + '"' : "") + (cell.style ? ' style="' + cell.style + '"' : "") + ">" + (cell.html || RP_ESC(cell.v)) + "</td>";
  }).join("") + "</tr>").join("");
  return '<table class="t"><thead><tr>' + th + "</tr></thead><tbody>" + tb + "</tbody></table>";
}
const rpCard = (k, v, u, tone) => '<div class="kpi' + (tone ? " " + tone : "") + '"><span class="k">' + RP_ESC(k) + '</span><span class="v">' + RP_ESC(v) + (u ? '<small>' + RP_ESC(u) + "</small>" : "") + "</span></div>";
function rpMonthly(data) {
  const W = 720,
    H = 150,
    B = 22,
    T = 14;
  const max = Math.max.apply(null, data.concat([1]));
  const bw = W / data.length * 0.62;
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + data.map((v, i) => {
    const x = W / data.length * i + (W / data.length - bw) / 2;
    const h = Math.max(1, v / max * (H - T - B));
    return '<rect x="' + x.toFixed(1) + '" y="' + (H - B - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="#1B9B75"/>' + '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - B - h - 4).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#5B6B63">' + Math.round(v / 100) / 10 + 'k</text>' + '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="9" fill="#8A968F">' + SC_MON[i].replace(".", "") + "</text>";
  }).join("") + "</svg>";
}
function rpCash(roi) {
  const W = 720,
    H = 165,
    T = 12,
    B = 20;
  const rows = roi.rows;
  const lo = Math.min(-roi.capex, 0),
    hi = Math.max(1, rows[rows.length - 1].cum);
  const X = i => i / rows.length * W;
  const Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const bw = W / rows.length * 0.7;
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + '<line x1="0" y1="' + Y(0).toFixed(1) + '" x2="' + W + '" y2="' + Y(0).toFixed(1) + '" stroke="#C9D3CD" stroke-width="1"/>' + rows.map((r, i) => '<rect x="' + X(i).toFixed(1) + '" y="' + Math.min(Y(r.cum), Y(0)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, Math.abs(Y(r.cum) - Y(0))).toFixed(1) + '" rx="1.5" fill="' + (r.cum >= 0 ? "#1B9B75" : "#C9D3CD") + '"/>').join("") + (roi.payback != null && roi.payback <= rows.length ? '<line x1="' + X(roi.payback).toFixed(1) + '" y1="' + T + '" x2="' + X(roi.payback).toFixed(1) + '" y2="' + (H - B) + '" stroke="#B45309" stroke-width="1.4" stroke-dasharray="4 3"/><text x="' + (X(roi.payback) + 5).toFixed(1) + '" y="' + (T + 10) + '" font-size="10" font-weight="700" fill="#B45309">คืนทุนปีที่ ' + roi.payback + "</text>" : "") + rows.map((r, i) => i % 5 === 4 || i === 0 ? '<text x="' + (X(i) + bw / 2).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="9" fill="#8A968F">' + r.year + "</text>" : "").join("") + "</svg>";
}
function rpIv(exp, stcRef, meas) {
  const W = 340,
    H = 190,
    L = 34,
    R = 10,
    T = 10,
    B = 22;
  if (!exp) return "";
  const vTop = Math.max(exp.voc, stcRef ? stcRef.voc : 0) * 1.06;
  const iTop = Math.max(exp.isc, stcRef ? stcRef.isc : 0) * 1.15;
  const X = v => L + v / vTop * (W - L - R);
  const Y = i => H - B - i / iTop * (H - T - B);
  const line = c => c.pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + Y(q.i).toFixed(1)).join(" ");
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#C9D3CD"/>' + '<line x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '" stroke="#C9D3CD"/>' + (stcRef ? '<path d="' + line(stcRef) + '" fill="none" stroke="#A8B4AE" stroke-width="1.1" stroke-dasharray="4 3"/>' : "") + '<path d="' + line(exp) + '" fill="none" stroke="#1B9B75" stroke-width="1.9"/>' + '<circle cx="' + X(exp.vmp).toFixed(1) + '" cy="' + Y(exp.imp).toFixed(1) + '" r="3.2" fill="#fff" stroke="#1B9B75" stroke-width="1.8"/>' + (meas && meas.voc ? '<circle cx="' + X(meas.voc).toFixed(1) + '" cy="' + Y(0).toFixed(1) + '" r="3.2" fill="#2563EB"/>' : "") + (meas && meas.isc ? '<circle cx="' + X(0).toFixed(1) + '" cy="' + Y(meas.isc).toFixed(1) + '" r="3.2" fill="#2563EB"/>' : "") + (meas && meas.vmp && meas.imp ? '<circle cx="' + X(meas.vmp).toFixed(1) + '" cy="' + Y(meas.imp).toFixed(1) + '" r="3.6" fill="#2563EB" stroke="#fff" stroke-width="1.2"/>' : "") + '<text x="' + (W - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="8.5" fill="#8A968F">V</text>' + '<text x="' + (L - 4) + '" y="' + (T + 8) + '" text-anchor="end" font-size="8.5" fill="#8A968F">A</text>' + "</svg>";
}
function rpLayout(foot, assign, labels) {
  if (!foot || !foot.panels || !foot.panels.length) return "";
  const b = foot.bounds,
    pad = 1.2;
  const W = b.maxX - b.minX + pad * 2,
    H = b.maxZ - b.minZ + pad * 2;
  const vb = b.minX - pad + " " + (b.minZ - pad) + " " + Math.max(1, W) + " " + Math.max(1, H);
  const poly = (pts, fill, stroke, sw, dash) => '<polygon points="' + pts.map(p => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ") + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : "") + "/>";
  return '<svg viewBox="' + vb + '" class="chart" style="max-height:300px" preserveAspectRatio="xMidYMid meet">' + foot.outlines.map(o => poly(o.pts, "#F1F4F2", "#C9D3CD", 0.06)).join("") + foot.panels.map(p => {
    const s = (assign || {})[p.uid] || 0;
    return poly(p.pts, s ? suColor(s) : "#E3E8E6", "#fff", 0.03, s ? null : "0.1 0.08");
  }).join("") + (labels ? foot.panels.map(p => {
    const t = labels[p.uid];
    if (!t) return "";
    const cx = p.pts.reduce((a, q) => a + q[0], 0) / p.pts.length;
    const cz = p.pts.reduce((a, q) => a + q[1], 0) / p.pts.length;
    return '<text x="' + cx.toFixed(2) + '" y="' + (cz + 0.16).toFixed(2) + '" text-anchor="middle" font-size="0.44" ' + 'font-weight="700" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="0.05" paint-order="stroke">' + RP_ESC(t) + "</text>";
  }).join("") : "") + '<g transform="translate(' + (b.minX - pad + 0.7) + "," + (b.minZ - pad + 0.8) + ')">' + '<line x1="0" y1="0" x2="0" y2="1" stroke="#B3261E" stroke-width="0.08"/>' + '<text x="0" y="-0.15" font-size="0.55" font-weight="700" fill="#B3261E" text-anchor="middle">N</text></g></svg>';
}
function rpDayLight(sim, groups) {
  if (!sim || !sim.rows.length) return "";
  const W = 720,
    H = 210,
    L = 44,
    R = 12,
    T = 12,
    B = 26;
  const top = Math.max(200, sim.maxGhi, sim.maxPoa) * 1.1;
  const h0 = Math.max(4.5, (sim.sunrise || 6) - 0.5),
    h1 = Math.min(20, (sim.sunset || 18.5) + 0.5);
  const X = h => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Y = v => H - B - v / top * (H - T - B);
  const net = r => {
    let s = 0,
      n = 0;
    (groups || []).forEach(g => {
      const p = r.per[g.key];
      if (p) {
        s += p.poaNet * g.count;
        n += g.count;
      }
    });
    return n ? s / n : 0;
  };
  const path = f => sim.rows.map((r, i) => (i ? "L" : "M") + X(r.h).toFixed(1) + " " + Y(f(r)).toFixed(1)).join(" ");
  const ticks = [];
  for (let h = Math.ceil(h0); h <= h1; h++) if (h % 2 === 0) ticks.push(h);
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + '<defs><pattern id="rpHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' + '<rect width="6" height="6" fill="rgba(71,85,105,.16)"/><line x1="0" y1="0" x2="0" y2="6" stroke="#475569" stroke-width="2" opacity=".5"/></pattern></defs>' + [0, 0.25, 0.5, 0.75, 1].map(f => '<line x1="' + L + '" y1="' + Y(top * f).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(top * f).toFixed(1) + '" stroke="#E3E8E6" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (Y(top * f) + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" fill="#8A968F">' + Math.round(top * f) + "</text>").join("") + '<path d="' + path(r => r.poaAvg) + " " + sim.rows.slice().reverse().map(r => "L" + X(r.h).toFixed(1) + " " + Y(net(r)).toFixed(1)).join(" ") + ' Z" fill="url(#rpHatch)"/>' + '<path d="' + path(net) + " L" + X(sim.rows[sim.rows.length - 1].h).toFixed(1) + " " + Y(0) + " L" + X(sim.rows[0].h).toFixed(1) + " " + Y(0) + ' Z" fill="rgba(27,155,117,.18)"/>' + '<path d="' + path(r => r.ghi) + '" fill="none" stroke="#A8B4AE" stroke-width="1.2" stroke-dasharray="5 4"/>' + '<path d="' + path(net) + '" fill="none" stroke="#1B9B75" stroke-width="2"/>' + ticks.map(h => '<text x="' + X(h).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + h + ":00</text>").join("") + '<text x="' + (L - 6) + '" y="' + (T - 2) + '" text-anchor="end" font-size="8" fill="#8A968F">W/m²</text></svg>' + '<p class="legend"><b style="color:#A8B4AE">┅</b> แสงบนพื้นราบ &nbsp;&nbsp; <b style="color:#1B9B75">━</b> แสงบนหน้าแผงจริง (หลังหักเงา)' + (sim.shadeFrom != null ? ' &nbsp;&nbsp; <b style="color:#475569">▨</b> ส่วนที่เงาบังกินไป' : "") + "</p>" + (sim.shadeFrom != null ? '<table class="strip">' + (groups || []).map(g => "<tr><td>" + RP_ESC(g.roofName + (g.side ? " · " + g.side : "")) + "</td><td>" + '<span class="bar">' + sim.rows.map(r => {
    const v = r.per[g.key] ? r.per[g.key].shade : 0;
    const c = v <= 0.5 ? "#EDF1EF" : v < 15 ? "#FDE68A" : v < 40 ? "#F59E0B" : "#DC2626";
    return '<i style="background:' + c + '"></i>';
  }).join("") + "</span></td></tr>").join("") + "</table>" + '<p class="legend"><span style="float:left">' + ivHM(h0) + '</span><span style="float:right">' + ivHM(h1) + "</span>" + '<b style="color:#EDF1EF">■</b> ไม่มีเงา &nbsp; <b style="color:#FDE68A">■</b> บังบางส่วน &nbsp; ' + '<b style="color:#F59E0B">■</b> บังมาก &nbsp; <b style="color:#DC2626">■</b> บังเกือบหมด</p>' : "");
}
function rpDayPower(mo, acKw) {
  if (!mo || !mo.cells || !mo.cells.length) return "";
  const W = 720,
    H = 216,
    L = 46,
    R = 48,
    T = 30,
    B = 26;
  const h0 = Math.max(4.5, (mo.sunrise || 6) - 0.5),
    h1 = Math.min(20, (mo.sunset || 18.5) + 0.5);
  const cs = mo.cells.filter(c => c.h >= h0 - 0.01 && c.h <= h1 + 0.01);
  if (cs.length < 2) return "";
  const pTop = Math.max(0.5, cs.reduce((a, c) => Math.max(a, c.dc || 0), 0)) * 1.14;
  const tTop = 90;
  const X = h => L + (h - h0) / Math.max(0.5, h1 - h0) * (W - L - R);
  const Yp = v => H - B - v / pTop * (H - T - B);
  const Yt = v => H - B - v / tTop * (H - T - B);
  const path = (arr, f, Yf) => arr.map((c, i) => (i ? "L" : "M") + X(c.h).toFixed(1) + " " + Yf(f(c)).toFixed(1)).join(" ");
  const ts = cs.filter(c => c.tCell > 0);
  const pk = cs.reduce((a, c) => c.ac > a.ac ? c : a, cs[0]);
  const tk = (ts.length ? ts : cs).reduce((a, c) => c.tCell > a.tCell ? c : a, (ts.length ? ts : cs)[0]);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + [0, 0.5, 1].map(f => '<line x1="' + L + '" y1="' + Yp(pTop * f).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Yp(pTop * f).toFixed(1) + '" stroke="#E3E8E6" stroke-width="1"/>' + '<text x="' + (L - 6) + '" y="' + (Yp(pTop * f) + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + Math.round(pTop * f * 10) / 10 + "</text>" + '<text x="' + (W - R + 6) + '" y="' + (Yt(tTop * f) + 3.5).toFixed(1) + '" font-size="8.5" font-weight="700" fill="#C4342B">' + Math.round(tTop * f) + "</text>").join("") + '<text x="' + (L - 6) + '" y="' + (T - 14) + '" text-anchor="end" font-size="8" font-weight="700" fill="#8A968F">kW</text>' + '<text x="' + (W - R + 6) + '" y="' + (T - 14) + '" font-size="8" font-weight="700" fill="#C4342B">°C</text>' + (acKw > 0 && acKw < pTop ? '<line x1="' + L + '" y1="' + Yp(acKw).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Yp(acKw).toFixed(1) + '" stroke="#B45309" stroke-width="1.2" stroke-dasharray="5 3"/><text x="' + (W - R - 2) + '" y="' + (Yp(acKw) - 4).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#B45309">เพดานอินเวอร์เตอร์ ' + acKw + " kW</text>" : "") + '<path d="' + path(cs, c => c.dc, Yp) + " L" + X(cs[cs.length - 1].h).toFixed(1) + " " + Yp(0) + " L" + X(cs[0].h).toFixed(1) + " " + Yp(0) + ' Z" fill="rgba(27,155,117,.13)"/>' + '<path d="' + path(cs, c => c.dc, Yp) + '" fill="none" stroke="#1B9B75" stroke-width="1.2" stroke-dasharray="4 3"/>' + '<path d="' + path(cs, c => c.ac, Yp) + '" fill="none" stroke="#148080" stroke-width="2.1" stroke-linejoin="round"/>' + (ts.length > 1 ? '<path d="' + path(ts, c => c.tCell, Yt) + '" fill="none" stroke="#C4342B" stroke-width="1.5" stroke-linejoin="round"/>' : "") + '<circle cx="' + X(pk.h).toFixed(1) + '" cy="' + Yp(pk.ac).toFixed(1) + '" r="3.2" fill="#fff" stroke="#148080" stroke-width="1.8"/>' + '<text x="' + clamp(X(pk.h), L + 36, W - R - 36).toFixed(1) + '" y="' + (Yp(pk.ac) - 7).toFixed(1) + '" text-anchor="middle" font-size="9.5" font-weight="700" fill="#148080">สูงสุด ' + Math.round(pk.ac * 100) / 100 + " kW</text>" + '<circle cx="' + X(tk.h).toFixed(1) + '" cy="' + Yt(tk.tCell).toFixed(1) + '" r="3" fill="#fff" stroke="#C4342B" stroke-width="1.6"/>' + '<text x="' + clamp(X(tk.h), L + 32, W - R - 32).toFixed(1) + '" y="' + (Yt(tk.tCell) - 6).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#C4342B">ร้อนสุด ' + Math.round(tk.tCell) + "°C</text>" + [6, 8, 10, 12, 14, 16, 18].filter(h => h >= h0 && h <= h1).map(h => '<text x="' + X(h).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + h + ":00</text>").join("") + "</svg>" + '<p class="legend"><b style="color:#148080">━</b> กำลังไฟที่ออกจากอินเวอร์เตอร์ (AC) &nbsp;&nbsp; ' + '<b style="color:#1B9B75">┅</b> กำลังไฟจากแผง (DC) &nbsp;&nbsp; <b style="color:#C4342B">━</b> อุณหภูมิเซลล์ (แกนขวา)</p>';
}
function rpYearMap(year, mode) {
  if (!year || !year.months.length) return "";
  const colLight = v => {
    if (v <= 2) return "#EFF2F0";
    const t = Math.max(0, Math.min(1, v / Math.max(1, year.maxPoa)));
    const stops = [[219, 234, 254], [134, 211, 180], [74, 179, 122], [250, 204, 21], [245, 158, 11]];
    const f = t * (stops.length - 1),
      i = Math.min(stops.length - 2, Math.floor(f)),
      k = f - i;
    return "rgb(" + [0, 1, 2].map(j => Math.round(stops[i][j] + (stops[i + 1][j] - stops[i][j]) * k)).join(",") + ")";
  };
  const colShade = (v, poa) => poa <= 2 ? "#EFF2F0" : v <= 0.5 ? "#E8F5ED" : v < 15 ? "#FDE68A" : v < 40 ? "#F59E0B" : "#DC2626";
  const hdr = year.hours.map(h => '<i class="hh">' + (h % 2 === 0 ? h : "") + "</i>").join("");
  const rows = year.months.map(mo => {
    const val = mode === "shade" ? mo.shadeLossPct + "%" : Math.round(mo.monthKwh / 100) / 10 + "k";
    const cls = mode === "shade" ? mo.shadeLossPct >= 5 ? "bad" : mo.shadeLossPct > 0 ? "warn" : "" : "";
    return '<tr><td class="mo">' + RP_ESC(mo.label.replace(".", "")) + '</td><td><span class="hm">' + mo.cells.map(c => '<i style="background:' + (mode === "shade" ? colShade(c.shade, c.poa) : colLight(c.poa)) + '"></i>').join("") + '</span></td><td class="mv ' + cls + '">' + val + "</td></tr>";
  }).join("");
  const legend = mode === "shade" ? '<b style="color:#E8F5ED">■</b> ไม่มีเงา &nbsp; <b style="color:#FDE68A">■</b> บังบางส่วน &nbsp; ' + '<b style="color:#F59E0B">■</b> บังมาก &nbsp; <b style="color:#DC2626">■</b> บังเกือบหมด &nbsp;·&nbsp; ขวาสุด = เสียไปกี่ % ของเดือนนั้น' : 'อ่อน = แดดน้อย &nbsp; <b style="color:#4AB37A">■</b> ปานกลาง &nbsp; <b style="color:#F59E0B">■</b> แรงสุด ' + year.maxPoa + " W/m² &nbsp;·&nbsp; ขวาสุด = ผลผลิตทั้งเดือน (kWh)";
  return '<table class="ymap"><tr><td class="mo"></td><td><span class="hm hdr">' + hdr + '</span></td><td class="mv"></td></tr>' + rows + '</table><p class="legend">' + legend + "</p>";
}
function rpIvAll(curves, stcRef) {
  const list = (curves || []).filter(x => x && x.curve);
  if (!list.length) return "";
  const W = 720,
    H = 390,
    L = 48,
    R = 54,
    T = 18,
    B = 32;
  const mx = f => list.reduce((a, x) => Math.max(a, f(x.curve)), 0);
  const vTop = Math.max(mx(c => c.voc), stcRef ? stcRef.voc : 0) * 1.07;
  const iTop = Math.max(mx(c => c.isc), stcRef ? stcRef.isc : 0) * 1.16;
  const pTop = Math.max(mx(c => c.pmax), stcRef ? stcRef.pmax : 0) * 1.16;
  const X = v => L + v / vTop * (W - L - R);
  const Yi = i => H - B - i / iTop * (H - T - B);
  const iv = c => c.pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + Yi(q.i).toFixed(1)).join(" ");
  const gI = 4,
    gV = 5;
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + Array.from({
    length: gI + 1
  }).map((_, k) => {
    const y = T + (H - T - B) * k / gI;
    return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="#E3E8E6" stroke-width="1"/>' + '<text x="' + (L - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + Math.round(iTop * (1 - k / gI) * 10) / 10 + "</text>" + '<text x="' + (W - R + 7) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="8.5" font-weight="700" fill="#B45309">' + (() => {
      const p = pTop * (1 - k / gI);
      return p >= 1000 ? Math.round(p / 100) / 10 + "k" : Math.round(p);
    })() + "</text>";
  }).join("") + Array.from({
    length: gV + 1
  }).map((_, k) => {
    const v = vTop * k / gV;
    return (k ? '<line x1="' + X(v).toFixed(1) + '" y1="' + T + '" x2="' + X(v).toFixed(1) + '" y2="' + (H - B) + '" stroke="#EEF1F0" stroke-width="1"/>' : "") + '<text x="' + X(v).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + Math.round(v) + "</text>";
  }).join("") + '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#C9D3CD" stroke-width="1.1"/>' + '<text x="' + (L - 7) + '" y="' + (T - 5) + '" text-anchor="end" font-size="8" font-weight="700" fill="#8A968F">A</text>' + '<text x="' + (W - R + 7) + '" y="' + (T - 5) + '" font-size="8" font-weight="700" fill="#B45309">W</text>' + '<text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" font-size="8.5" fill="#8A968F">แรงดัน (V)</text>' + (stcRef ? '<path d="' + iv(stcRef) + '" fill="none" stroke="#A8B4AE" stroke-width="1.2" stroke-dasharray="5 4"/>' : "") + list.map(x => '<path d="' + iv(x.curve) + '" fill="none" stroke="' + x.color + '" stroke-width="2" stroke-linejoin="round"/>' + '<circle cx="' + X(x.curve.vmp).toFixed(1) + '" cy="' + Yi(x.curve.imp).toFixed(1) + '" r="3.4" fill="#fff" stroke="' + x.color + '" stroke-width="1.9"/>').join("") + (() => {
    const rows = list.map(x => ({
      c: x.color,
      t: x.name,
      v: rpN(scNum(x.watt, x.curve.pmax)) + " W"
    })).concat([{
      c: null,
      t: "ที่มาตรฐาน STC (1000 W/m² · 25°C)",
      v: ""
    }]);
    const cols = rows.length > 10 ? 2 : 1;
    const per = Math.ceil(rows.length / cols);
    const rh = 12.5,
      cw = cols > 1 ? 176 : 196,
      pad = 7;
    const bw = cw * cols + pad,
      bh = per * rh + pad * 1.6;
    const bx = L + 58,
      by = H - B - bh - 14;
    return '<g><rect x="' + bx.toFixed(1) + '" y="' + by + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="6" fill="#fff" fill-opacity=".93" stroke="#D8E0DB" stroke-width="1"/>' + rows.map((r, i) => {
      const cx = bx + pad + Math.floor(i / per) * cw,
        cy = by + pad + i % per * rh + 7;
      return (r.c ? '<rect x="' + cx.toFixed(1) + '" y="' + (cy - 3.4).toFixed(1) + '" width="12" height="3" rx="1.5" fill="' + r.c + '"/>' : '<rect x="' + cx.toFixed(1) + '" y="' + (cy - 3.4).toFixed(1) + '" width="12" height="3" rx="1.5" fill="#A8B4AE" fill-opacity=".55"/>') + '<text x="' + (cx + 17).toFixed(1) + '" y="' + cy.toFixed(1) + '" font-size="8.5" font-weight="' + (r.c ? 700 : 600) + '" fill="' + (r.c ? "#3A4A43" : "#8A968F") + '">' + RP_ESC(r.t) + "</text>" + (r.v ? '<text x="' + (cx + cw - 12).toFixed(1) + '" y="' + cy.toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="800" fill="#16211D">' + RP_ESC(r.v) + "</text>" : "");
    }).join("") + "</g>";
  })() + "</svg>";
}
function rpLossFlow(chain) {
  const rows = (chain || []).filter(Boolean);
  if (!rows.length) return "";
  const top = rows.reduce((a, r) => Math.max(a, r.kwh || 0), 1);
  const W = 700,
    X0 = 30,
    TW = 148,
    XL = 262,
    LX = 274;
  const HL = 46,
    HM = 40,
    TOP = 12;
  const cut = (s, n) => s && s.length > n ? s.slice(0, n - 1) + "…" : s || "";
  const wOf = v => Math.max(0, Math.min(1, v / top)) * TW;
  const seg = [];
  let prev = rows[0].kwh,
    y = TOP;
  rows.forEach(r => {
    const h = r.kind === "loss" || r.kind === "gain" ? HL : HM;
    seg.push({
      r: r,
      y0: y,
      y1: y + h,
      wA: wOf(prev),
      wB: wOf(r.kwh)
    });
    prev = r.kwh;
    y += h;
  });
  const last = seg[seg.length - 1],
    H = last.y1 + 20;
  const trunk = "M" + X0 + " " + TOP + " L" + (X0 + seg[0].wA).toFixed(1) + " " + TOP + " " + seg.map(s => {
    const yc = (s.y0 + s.y1) / 2;
    return "L" + (X0 + s.wA).toFixed(1) + " " + yc.toFixed(1) + " L" + (X0 + s.wB).toFixed(1) + " " + yc.toFixed(1) + " L" + (X0 + s.wB).toFixed(1) + " " + s.y1.toFixed(1);
  }).join(" ") + " L" + (X0 + last.wB / 2).toFixed(1) + " " + (last.y1 + 14).toFixed(1) + " L" + X0 + " " + last.y1.toFixed(1) + " Z";
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + '<defs><linearGradient id="rpFlowG" x1="0" y1="0" x2="0" y2="1">' + '<stop offset="0%" stop-color="#3ECF84"/><stop offset="55%" stop-color="#1B9B75"/><stop offset="100%" stop-color="#0B6B3A"/></linearGradient></defs>' + '<path d="' + trunk + '" fill="url(#rpFlowG)"/>' + seg.map(s => (s.r.kind === "loss" || s.r.kind === "gain") && Math.abs(s.wA - s.wB) > 0.2 ? '<line x1="' + X0 + '" y1="' + ((s.y0 + s.y1) / 2).toFixed(1) + '" x2="' + (X0 + Math.min(s.wA, s.wB)).toFixed(1) + '" y2="' + ((s.y0 + s.y1) / 2).toFixed(1) + '" stroke="#fff" stroke-width="1" stroke-opacity=".28"/>' : "").join("") + seg.map(s => {
    const R = s.r,
      yc = (s.y0 + s.y1) / 2;
    const heavy = R.kind === "loss" && R.pct >= 3,
      zero = R.kind === "loss" && R.loss <= 0;
    if (R.kind === "loss" || R.kind === "gain") {
      const gain = R.kind === "gain";
      const col = gain ? "#2563EB" : heavy ? "#DC2626" : "#EFA53A";
      const th = Math.max(3.6, Math.abs(s.wA - s.wB));
      const inner = X0 + Math.min(s.wA, s.wB);
      const yA = (yc - th / 2).toFixed(1),
        yB = (yc + th / 2).toFixed(1);
      const HEAD = 9,
        FLARE = 3.4;
      const ribbon = zero ? "" : '<path d="' + (gain ? "M" + XL + " " + yA + " L" + (inner + HEAD).toFixed(1) + " " + yA + " L" + (inner + HEAD).toFixed(1) + " " + (yc - th / 2 - FLARE).toFixed(1) + " L" + inner.toFixed(1) + " " + yc.toFixed(1) + " L" + (inner + HEAD).toFixed(1) + " " + (yc + th / 2 + FLARE).toFixed(1) + " L" + (inner + HEAD).toFixed(1) + " " + yB + " L" + XL + " " + yB + " Z" : "M" + inner.toFixed(1) + " " + yA + " L" + (XL - HEAD) + " " + yA + " L" + (XL - HEAD) + " " + (yc - th / 2 - FLARE).toFixed(1) + " L" + XL + " " + yc.toFixed(1) + " L" + (XL - HEAD) + " " + (yc + th / 2 + FLARE).toFixed(1) + " L" + (XL - HEAD) + " " + yB + " L" + inner.toFixed(1) + " " + yB + " Z") + '" fill="' + col + '" fill-opacity="' + (gain ? 0.78 : heavy ? 0.92 : 0.85) + '"/>';
      return ribbon + (zero ? '<line x1="' + (X0 + s.wA).toFixed(1) + '" y1="' + yc.toFixed(1) + '" x2="' + XL + '" y2="' + yc.toFixed(1) + '" stroke="#D8E0DB" stroke-width="1" stroke-dasharray="2 4"/>' : "") + '<text x="' + LX + '" y="' + (yc - 9).toFixed(1) + '" font-size="10" font-weight="700" fill="' + (zero ? "#8A968F" : "#3A4A43") + '">' + RP_ESC(cut(R.label, 66)) + "</text>" + '<text x="' + LX + '" y="' + (yc + 3).toFixed(1) + '" font-size="9.5" font-weight="800" fill="' + (zero ? "#8A968F" : gain ? "#1D4ED8" : heavy ? "#B91C1C" : "#B45309") + '">' + RP_ESC(gain ? "+" + R.pct + "%  ·  " + rpN(R.gain) + " kWh" : zero ? "ไม่เสียพลังงานในด่านนี้" : "−" + R.pct + "%  ·  " + rpN(R.loss) + " kWh") + (R.unit ? '<tspan fill="#8A968F" font-weight="700">' + RP_ESC("   → " + R.unit) + "</tspan>" : "") + "</text>" + (R.note ? '<text x="' + LX + '" y="' + (yc + 14).toFixed(1) + '" font-size="8.5" font-weight="600" fill="#8A968F">' + RP_ESC(cut(R.note, 70)) + "</text>" : "");
    }
    const big = R.kind === "end",
      first = R.kind === "start";
    const accent = big ? "#148080" : first ? "#B45309" : "#C9D3CD";
    return '<line x1="' + X0 + '" y1="' + s.y1.toFixed(1) + '" x2="' + (XL + 4) + '" y2="' + s.y1.toFixed(1) + '" stroke="' + (big ? "#148080" : "#D8E0DB") + '" stroke-width="' + (big ? 1.4 : 1) + '"' + (big ? ' stroke-opacity=".7"' : ' stroke-dasharray="3 4"') + "/>" + '<rect x="' + (LX - 9) + '" y="' + (s.y1 - 32).toFixed(1) + '" width="3" height="30" rx="1.5" fill="' + accent + '" fill-opacity="' + (big || first ? 1 : 0.5) + '"/>' + '<text x="' + LX + '" y="' + (s.y1 - 23).toFixed(1) + '" font-size="10.5" font-weight="800" fill="#16211D">' + RP_ESC(cut(R.label, 60)) + "</text>" + '<text x="' + LX + '" y="' + (s.y1 - 11).toFixed(1) + '" font-size="9.5" font-weight="800" fill="' + (big ? "#148080" : first ? "#B45309" : "#3A4A43") + '">' + RP_ESC(rpN(R.kwh) + " kWh") + (R.unit ? '<tspan fill="#8A968F" font-weight="700">' + RP_ESC("   ·   " + R.unit) + "</tspan>" : "") + (big ? '<tspan fill="#148080" font-weight="800">' + RP_ESC("   ·   PR " + R.pct + "%") + "</tspan>" : "") + "</text>" + (R.note ? '<text x="' + LX + '" y="' + (s.y1 - 1).toFixed(1) + '" font-size="8.5" font-weight="600" fill="#8A968F">' + RP_ESC(cut(R.note, 70)) + "</text>" : "");
  }).join("") + "</svg>";
}
const RP_ISO = [{
  at: 0.40,
  c: "#B91C1C",
  o: 0.85,
  lb: "40%+"
}, {
  at: 0.20,
  c: "#DC2626",
  o: 0.60,
  lb: "20–40%"
}, {
  at: 0.10,
  c: "#F59E0B",
  o: 0.62,
  lb: "10–20%"
}, {
  at: 0.05,
  c: "#F59E0B",
  o: 0.40,
  lb: "5–10%"
}, {
  at: 0.01,
  c: "#F59E0B",
  o: 0.22,
  lb: "1–5%"
}];
function rpSunPath(path, iso) {
  if (!path || !path.paths || !path.paths.length) return "";
  const W = 700,
    H = 350,
    L = 42,
    R = 16,
    T = 16,
    B = 30;
  const X = az => L + az / 360 * (W - L - R);
  const Y = alt => H - B - Math.max(0, Math.min(90, alt)) / 90 * (H - T - B);
  const line = pts => pts.map((q, k) => (k ? "L" : "M") + X(q.az).toFixed(1) + " " + Y(q.alt).toFixed(1)).join(" ");
  const cw = iso ? Math.abs(X(iso.azStep) - X(0)) : 0;
  const ch = iso ? Math.abs(Y(0) - Y(iso.altStep)) : 0;
  const compass = [[0, "เหนือ"], [45, "ตอ.เฉียงเหนือ"], [90, "ตะวันออก"], [135, "ตอ.เฉียงใต้"], [180, "ใต้"], [225, "ตต.เฉียงใต้"], [270, "ตะวันตก"], [315, "ตต.เฉียงเหนือ"], [360, "เหนือ"]];
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + '<rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" rx="6" fill="#F6F8F7"/>' + (iso ? iso.cells.map(c => {
    const b = RP_ISO.filter(x => c.f >= x.at)[0];
    if (!b) return "";
    return '<rect x="' + (X(c.az) - cw / 2).toFixed(1) + '" y="' + (Y(c.alt) - ch / 2).toFixed(1) + '" width="' + (cw + 0.6).toFixed(1) + '" height="' + (ch + 0.6).toFixed(1) + '" fill="' + b.c + '" opacity="' + b.o + '"/>';
  }).join("") : "") + Array.from({
    length: 7
  }).map((_, k) => {
    const alt = k * 15;
    return '<line x1="' + L + '" y1="' + Y(alt).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(alt).toFixed(1) + '" stroke="#E3E8E6" stroke-width="1"/>' + '<text x="' + (L - 6) + '" y="' + (Y(alt) + 3.4).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + alt + "°</text>";
  }).join("") + compass.map(c => (c[0] > 0 && c[0] < 360 ? '<line x1="' + X(c[0]).toFixed(1) + '" y1="' + T + '" x2="' + X(c[0]).toFixed(1) + '" y2="' + (H - B) + '" stroke="#EEF1F0" stroke-width="1"/>' : "") + '<text x="' + X(c[0]).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="' + (c[0] === 0 ? "start" : c[0] === 360 ? "end" : "middle") + '" font-size="8.5" font-weight="' + (c[0] === 180 ? 800 : 700) + '" fill="' + (c[0] === 180 ? "#3A4A43" : "#8A968F") + '">' + RP_ESC(c[1]) + "</text>").join("") + path.hours.map(hr => hr.segs.map(sg => '<path d="' + line(sg) + '" fill="none" stroke="#8A968F" stroke-width="1" stroke-dasharray="2 3" opacity=".55"/>').join("") + '<text x="' + X(hr.pts[0].az).toFixed(1) + '" y="' + (Y(hr.pts[0].alt) - 5).toFixed(1) + '" text-anchor="middle" font-size="8" font-weight="800" fill="#8A968F">' + hr.h + "</text>").join("") + path.paths.map((p, i) => {
    const main = i === 0 || i === path.paths.length - 1 || i === 3;
    return p.segs.map(sg => '<path d="' + line(sg) + '" fill="none" stroke="#B45309" stroke-width="' + (main ? 1.9 : 1.2) + '" opacity="' + (main ? 0.95 : 0.6) + '" stroke-linecap="round"/>').join("");
  }).join("") + [path.paths[0], path.paths[path.paths.length - 1]].map((p, i) => p && p.peak ? '<text x="' + Math.max(L + 36, Math.min(W - R - 36, X(p.peak.az))).toFixed(1) + '" y="' + (Y(p.peak.alt) + (i ? 13 : -7)).toFixed(1) + '" text-anchor="middle" font-size="8.5" font-weight="800" fill="#B45309">' + RP_ESC(p.label) + "</text>" : "").join("") + "</svg>" + (iso ? '<p class="note"><b>ระดับสีของเงาบัง</b> — ' + RP_ISO.slice().reverse().map(b => b.lb).join(" · ") + " (เข้มขึ้น = โดนบังหนักขึ้น) · เส้นทางเดินเส้นไหนวิ่งผ่านพื้นที่สี แปลว่าเดือนนั้นเวลานั้นแผงโดนเงาบังแน่นอน</p>" : "");
}
const RP_GRAMP = ["#0B5F35", "#15803D", "#1B9B75", "#6FC48F", "#B3DEC4"];
const RP_TRAMP = ["#1D4ED8", "#148080", "#D97706", "#DC2626"];
function rpIvFamily(curves, mode) {
  const list = (curves || []).filter(Boolean);
  if (!list.length) return "";
  const ramp = mode === "temp" ? RP_TRAMP : RP_GRAMP;
  const colOf = i => ramp[Math.min(i, ramp.length - 1)];
  const W = 700,
    H = 360,
    L = 48,
    R = 54,
    T = 18,
    B = 32;
  const vTop = list.reduce((a, c) => Math.max(a, c.voc), 0) * 1.08;
  const iTop = list.reduce((a, c) => Math.max(a, c.isc), 0) * 1.14;
  const pTop = list.reduce((a, c) => Math.max(a, c.pmax), 0) * 1.14;
  const X = v => L + v / vTop * (W - L - R);
  const Yi = i => H - B - i / iTop * (H - T - B);
  const Yp = p => H - B - p / pTop * (H - T - B);
  const pathOf = (c, fy, fv) => c.pts.map((q, k) => (k ? "L" : "M") + X(q.v).toFixed(1) + " " + fy(fv(q)).toFixed(1)).join(" ");
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + Array.from({
    length: 5
  }).map((_, k) => {
    const y = T + (H - T - B) * k / 4,
      p = pTop * (1 - k / 4);
    return '<line x1="' + L + '" y1="' + y.toFixed(1) + '" x2="' + (W - R) + '" y2="' + y.toFixed(1) + '" stroke="#E3E8E6" stroke-width="1"/>' + '<text x="' + (L - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + Math.round(iTop * (1 - k / 4) * 10) / 10 + "</text>" + '<text x="' + (W - R + 7) + '" y="' + (y + 3.5).toFixed(1) + '" font-size="8.5" font-weight="700" fill="#B45309">' + (p >= 1000 ? Math.round(p / 100) / 10 + "k" : Math.round(p)) + "</text>";
  }).join("") + Array.from({
    length: 6
  }).map((_, k) => {
    const v = vTop * k / 5;
    return (k ? '<line x1="' + X(v).toFixed(1) + '" y1="' + T + '" x2="' + X(v).toFixed(1) + '" y2="' + (H - B) + '" stroke="#EEF1F0" stroke-width="1"/>' : "") + '<text x="' + X(v).toFixed(1) + '" y="' + (H - B + 13) + '" text-anchor="middle" font-size="8.5" fill="#8A968F">' + Math.round(v) + "</text>";
  }).join("") + '<line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (H - B) + '" stroke="#C9D3CD" stroke-width="1.1"/>' + '<text x="' + (L - 7) + '" y="' + (T - 5) + '" text-anchor="end" font-size="8" font-weight="700" fill="#8A968F">A</text>' + '<text x="' + (W - R + 7) + '" y="' + (T - 5) + '" font-size="8" font-weight="700" fill="#B45309">W</text>' + '<text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" font-size="8.5" fill="#8A968F">แรงดัน (V)</text>' + '<path d="' + list.map((c, k) => (k ? "L" : "M") + X(c.vmp).toFixed(1) + " " + Yi(c.imp).toFixed(1)).join(" ") + '" fill="none" stroke="#A8B4AE" stroke-width="1" stroke-dasharray="2 4"/>' + list.map((c, i) => '<path d="' + pathOf(c, Yp, q => q.p) + '" fill="none" stroke="' + colOf(i) + '" stroke-width="1.3" stroke-dasharray="4 3" opacity=".7"/>' + '<path d="' + pathOf(c, Yi, q => q.i) + '" fill="none" stroke="' + colOf(i) + '" stroke-width="2" stroke-linejoin="round"/>' + '<circle cx="' + X(c.vmp).toFixed(1) + '" cy="' + Yi(c.imp).toFixed(1) + '" r="3.4" fill="#fff" stroke="' + colOf(i) + '" stroke-width="1.9"/>').join("") + (() => {
    const rh = 12.5,
      cw = 214,
      pad = 8;
    const bh = list.length * rh + pad * 2 + 12,
      bx = L + 24,
      by = H - B - bh - 12;
    return '<g><rect x="' + bx + '" y="' + by.toFixed(1) + '" width="' + (cw + pad) + '" height="' + bh.toFixed(1) + '" rx="6" fill="#fff" fill-opacity=".94" stroke="#D8E0DB" stroke-width="1"/>' + '<text x="' + (bx + pad) + '" y="' + (by + pad + 8).toFixed(1) + '" font-size="8" font-weight="800" fill="#8A968F">' + RP_ESC(mode === "temp" ? "อุณหภูมิเซลล์" : "ความเข้มแสง") + "</text>" + list.map((c, i) => {
      const cy = by + pad + 20 + i * rh + 3;
      return '<rect x="' + (bx + pad) + '" y="' + (cy - 3.4).toFixed(1) + '" width="13" height="3" rx="1.5" fill="' + colOf(i) + '"/>' + '<text x="' + (bx + pad + 19) + '" y="' + cy.toFixed(1) + '" font-size="8.5" font-weight="700" fill="#3A4A43">' + RP_ESC(c.label) + "</text>" + '<text x="' + (bx + pad + 94) + '" y="' + cy.toFixed(1) + '" font-size="8.5" font-weight="700" fill="#8A968F">' + RP_ESC(Math.round(c.vmp) + " V · " + Math.round(c.imp * 10) / 10 + " A") + "</text>" + '<text x="' + (bx + cw - 4) + '" y="' + cy.toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="800" fill="#16211D">' + RP_ESC(c.pmax >= 1000 ? Math.round(c.pmax / 10) / 100 + " kW" : Math.round(c.pmax) + " W") + "</text>";
    }).join("") + "</g>";
  })() + "</svg>";
}
const RP_FLOW = {
  direct: {
    c: "#1B9B75",
    label: "ใช้ตรง ๆ ตอนนั้น"
  },
  chg: {
    c: "#2563EB",
    label: "เก็บเข้าแบต"
  },
  dis: {
    c: "#6366F1",
    label: "จ่ายออกจากแบต"
  },
  exp: {
    c: "#EFA53A",
    label: "ขายคืนการไฟฟ้า"
  },
  curt: {
    c: "#DC2626",
    label: "ตัดทิ้ง (ห้ามไหลย้อน)"
  },
  imp: {
    c: "#94A3B8",
    label: "ซื้อจากการไฟฟ้า"
  }
};
function rpFlowDay(rows, mode, on) {
  if (!rows || !rows.length) return "";
  const keys = mode === "load" ? ["direct", "dis", "imp"] : ["direct", "chg", "exp", "curt"];
  const W = 720,
    H = 158,
    L = 34,
    R = on && mode === "pv" ? 34 : 10,
    T = 12,
    B = 18;
  const top = Math.max(0.02, rows.reduce((a, r) => Math.max(a, keys.reduce((s, k) => s + (r[k] || 0), 0)), 0));
  const X = h => L + (h + 0.5) / 24 * (W - L - R);
  const bw = (W - L - R) / 24 * 0.76;
  const Y = v => T + (1 - v / top) * (H - T - B);
  let out = "";
  [0, 0.5, 1].forEach(f => {
    out += '<line x1="' + L + '" y1="' + Y(top * f).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(top * f).toFixed(1) + '" stroke="#E4EAE7" stroke-width="1"/><text x="' + (L - 4) + '" y="' + (Y(top * f) + 3).toFixed(1) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">' + scR(top * f, 2) + "</text>";
  });
  rows.forEach(r => {
    let acc = 0;
    keys.forEach(k => {
      const v = r[k] || 0;
      if (v <= 0) return;
      const y0 = Y(acc + v),
        hh = Math.max(0.6, Y(acc) - Y(acc + v));
      acc += v;
      out += '<rect x="' + (X(r.h) - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + RP_FLOW[k].c + '" opacity="' + (k === "curt" ? ".85" : ".92") + '"/>';
    });
  });
  if (on && mode === "pv") {
    out += '<polyline points="' + rows.map(r => X(r.h).toFixed(1) + "," + (T + (1 - Math.max(0, Math.min(100, r.soc)) / 100) * (H - T - B)).toFixed(1)).join(" ") + '" fill="none" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="5 3" opacity=".6"/>' + '<text x="' + (W - R + 4) + '" y="' + (T + 4) + '" font-size="8.5" font-weight="700" fill="#8A968F">100%</text>' + '<text x="' + (W - R + 4) + '" y="' + (H - B + 3) + '" font-size="8.5" font-weight="700" fill="#8A968F">0%</text>';
  }
  [0, 3, 6, 9, 12, 15, 18, 21].forEach(h => {
    out += '<text x="' + X(h).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#8A968F">' + h + "</text>";
  });
  out += '<text x="' + (W - R) + '" y="' + (H - 5) + '" text-anchor="end" font-size="8" font-weight="800" fill="#8A968F">น.</text>' + '<text x="2" y="' + (T - 3) + '" font-size="8.5" font-weight="800" fill="#8A968F">kWh</text>';
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + out + "</svg>";
}
const rpFlowLegend = (keys, soc) => '<div class="lgd">' + keys.map(k => '<span><i style="background:' + RP_FLOW[k].c + '"></i>' + RP_ESC(RP_FLOW[k].label) + "</span>").join("") + (soc ? '<span><i class="dash"></i>ระดับไฟในแบต (0–100%)</span>' : "") + "</div>";
function rpPxx(px, mode) {
  if (!px) return "";
  const rows = mode === "one" ? px.one : px.avg;
  const sig = (mode === "one" ? px.sigma1 : px.sigmaN) / 100;
  const W = 720,
    H = 176,
    L = 10,
    R = 10,
    T = 16,
    B = 32;
  const p50 = px.p50 || 1,
    lo = p50 * (1 - 3.2 * sig),
    hi = p50 * (1 + 3.2 * sig);
  const X = v => L + (v - lo) / Math.max(1e-9, hi - lo) * (W - L - R);
  const Y = f => T + (1 - f) * (H - T - B);
  const pts = [];
  for (let i = 0; i < 121; i++) {
    const v = lo + (hi - lo) * i / 120,
      t = (v - p50) / Math.max(1e-9, p50 * sig);
    pts.push({
      x: X(v),
      y: Y(Math.exp(-0.5 * t * t)),
      v
    });
  }
  const p90 = (rows.find(r => r.p === 90) || rows[0]).kwh;
  const under = pts.filter(p => p.v <= p90);
  const fill = under.length ? '<path d="M' + under[0].x.toFixed(1) + " " + Y(0).toFixed(1) + " L" + under.map(p => p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" L") + " L" + under[under.length - 1].x.toFixed(1) + " " + Y(0).toFixed(1) + ' Z" fill="#B45309" opacity=".16"/>' : "";
  const mark = (v, p, c) => '<line x1="' + X(v).toFixed(1) + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(v).toFixed(1) + '" y2="' + Y(Math.exp(-0.5 * Math.pow((v - p50) / (p50 * sig), 2))).toFixed(1) + '" stroke="' + c + '" stroke-width="1.6"' + (p === 90 ? ' stroke-dasharray="4 3"' : "") + "/>" + '<text x="' + X(v).toFixed(1) + '" y="' + (T - 5) + '" text-anchor="middle" font-size="10" font-weight="800" fill="' + c + '">P' + p + "</text>" + '<text x="' + X(v).toFixed(1) + '" y="' + (H - 17) + '" text-anchor="middle" font-size="10" font-weight="800" fill="' + c + '">' + rpN(v) + "</text>";
  return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart">' + '<line x1="' + L + '" y1="' + Y(0).toFixed(1) + '" x2="' + (W - R) + '" y2="' + Y(0).toFixed(1) + '" stroke="#D8E0DC" stroke-width="1.2"/>' + fill + '<polyline points="' + pts.map(p => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ") + '" fill="none" stroke="#0B5F35" stroke-width="2"/>' + mark(p50, 50, "#0B5F35") + mark(p90, 90, "#B45309") + '<text x="' + X(p90).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="8.5" font-weight="800" fill="#B45309">โอกาสตกลงมาต่ำกว่านี้ 10%</text>' + '<text x="' + L + '" y="' + (H - 4) + '" font-size="8.5" font-weight="700" fill="#8A968F">แย่กว่าที่คิด</text>' + '<text x="' + (W - R) + '" y="' + (H - 4) + '" text-anchor="end" font-size="8.5" font-weight="700" fill="#8A968F">ดีกว่าที่คิด</text>' + "</svg>";
}
const RP_SECTIONS = [{
  key: "cover",
  label: "หน้าปก",
  note: "โลโก้ · ตัวเลขเด่น · ภาพ 3 มิติ"
}, {
  key: "summary",
  label: "สรุปผลการออกแบบ",
  note: "การ์ดตัวเลขสำคัญทั้งหมดในหน้าเดียว"
}, {
  key: "equip",
  label: "อุปกรณ์ที่ใช้",
  note: "สเปคแผง/อินเวอร์เตอร์ · ผืนหลังคาและทิศทาง"
}, {
  key: "wiring",
  label: "การต่อสตริง / ไมโคร",
  note: "ตารางการต่อ · ข้อควรแก้",
  subs: [{
    key: "layout",
    label: "ผังแผงมองจากด้านบน",
    note: "สีเดียวกัน = สตริง/ไมโครเดียวกัน"
  }]
}, {
  key: "iv",
  label: "แสง เงา และเส้น I-V",
  subs: [{
    key: "ivDay",
    label: "กำลังไฟ + อุณหภูมิเซลล์ตลอดวัน",
    note: "เดือนที่ผลิตได้สูงสุด"
  }, {
    key: "ivYear",
    label: "แสง/เงาทั้งปี 12 เดือน",
    note: "แผนที่ความร้อน + ตารางสรุป"
  }, {
    key: "ivSun",
    label: "เส้นทางเดินดวงอาทิตย์ & แผนที่เงาบัง",
    note: "ทิศ × มุมสูง — เห็นว่าโดนบังเดือนไหน เวลาไหน"
  }, {
    key: "ivFam",
    label: "เส้น P-V & I-V ที่แสง/อุณหภูมิต่าง ๆ",
    note: "แบบเดียวกับกราฟบนดาต้าชีตแผง"
  }, {
    key: "ivAll",
    label: "ค่าที่ควรวัดได้ทุกสตริง/ไมโคร",
    note: "ตารางพกไปเทียบกับเครื่องวัดที่หน้างาน"
  }, {
    key: "ivMeas",
    label: "ผลตรวจวัดหน้างาน",
    note: "เทียบค่าที่วัดได้กับที่ควรได้"
  }]
}, {
  key: "prod",
  label: "ผลผลิตที่คาดการณ์",
  subs: [{
    key: "shade",
    label: "เงาบังทั้งปีจากโมเดล 3 มิติ"
  }, {
    key: "loss",
    label: "แผนภาพค่าสูญเสียของระบบ",
    note: "ไล่จากแสงที่ได้ลงมาถึงไฟ AC ทีละด่าน"
  }, {
    key: "pxx",
    label: "ความมั่นใจของผลผลิต (P50/P90)",
    note: "ตัวเลขที่ธนาคารและผู้ลงทุนขอดู"
  }]
}, {
  key: "env",
  label: "ผลกระทบต่อสิ่งแวดล้อม",
  note: "คาร์บอนที่ลดได้ · ค่าเทียบเท่า · คืนทุนทางคาร์บอน"
}, {
  key: "load",
  label: "การใช้ไฟ · แบตเตอรี่ · ห้ามไหลย้อน",
  note: "จำลองทีละชั่วโมงทั้งปี — ผลิตแล้วได้ใช้เองกี่ %",
  subs: [{
    key: "loadDay",
    label: "กราฟไฟทั้งวัน",
    note: "ไฟที่ผลิตได้ไปไหน + ไฟที่ใช้มาจากไหน"
  }, {
    key: "loadMon",
    label: "ตารางรายเดือน"
  }, {
    key: "battSpec",
    label: "สเปคแบตเตอรี่ที่ใช้คิด"
  }]
}, {
  key: "roi",
  label: "ผลตอบแทนการลงทุน",
  note: "คืนทุน · IRR · กระแสเงินสด"
}];
function rpPickAll() {
  const o = {};
  RP_SECTIONS.forEach(s => {
    o[s.key] = true;
    (s.subs || []).forEach(b => {
      o[b.key] = true;
    });
  });
  return o;
}
const RP_I18N = {
  "รายงานระบบโซลาร์": ["Solar PV System Report", "太阳能系统报告"],
  "รายงานการออกแบบและวิเคราะห์ระบบ": ["SYSTEM DESIGN & ANALYSIS REPORT", "系统设计与分析报告"],
  "ระบบผลิตไฟฟ้า<br>พลังงานแสงอาทิตย์บนหลังคา": ["Rooftop Solar<br>Power System", "屋顶太阳能<br>发电系统"],
  "ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์": ["Solar Power Systems", "太阳能发电系统"],
  "ผลิตได้ปีละราว": ["Approx. annual yield", "年发电量约"],
  "คืนทุนใน {} ปี": ["payback in {} years", "{} 年回本"],
  "ผังการติดตั้งจำลอง 3 มิติ — ทุกตัวเลขในรายงานนี้อ้างอิงจากโมเดลนี้": ["3D installation model — every figure in this report is derived from this model", "三维安装模型 — 本报告所有数据均基于此模型"],
  "ผังการติดตั้ง 3 มิติ": ["3D installation layout", "三维安装布置图"],
  "ลูกค้า": ["Client", "客户"],
  "สถานที่ติดตั้ง": ["Site", "安装地点"],
  "วันที่ออกรายงาน": ["Report date", "报告日期"],
  "สรุปผลการออกแบบ": ["Design Summary", "设计总结"],
  "อุปกรณ์และการจัดวาง": ["Equipment & Layout", "设备与布置"],
  "การต่อสตริงและตรวจสเปคไฟฟ้า": ["String Configuration & Electrical Check", "组串配置与电气校验"],
  "ผังแผงบนหลังคา": ["Rooftop Panel Layout", "屋顶组件布置"],
  "แสง เงา และผลตรวจวัด I-V": ["Irradiance, Shading & I-V Measurements", "辐照、阴影与 I-V 实测"],
  "ผลผลิตที่คาดการณ์": ["Projected Yield", "预计发电量"],
  "ผลกระทบต่อสิ่งแวดล้อม": ["Environmental Impact", "环境效益"],
  "การใช้ไฟ แบตเตอรี่ และการขายคืน": ["Consumption, Battery & Export", "用电、储能与上网"],
  "ผลตอบแทนการลงทุน": ["Return on Investment", "投资回报"],
  "กำลังติดตั้ง": ["Installed capacity", "装机容量"],
  "อินเวอร์เตอร์": ["Inverter", "逆变器"],
  "ผลผลิตปีแรก": ["First-year yield", "首年发电量"],
  "ต่อกำลังติดตั้ง": ["Specific yield", "单位发电量"],
  "kWh/kWp/ปี": ["kWh/kWp/yr", "kWh/kWp/年"],
  "รวม {} ปี": ["{}-year total", "{} 年合计"],
  "คืนทุนภายใน": ["Payback period", "投资回收期"],
  "ผลตอบแทน IRR": ["IRR", "内部收益率 IRR"],
  "% ต่อปี": ["% p.a.", "% /年"],
  "สเปคแผง (STC)": ["Module specification (STC)", "组件参数（STC）"],
  "สเปคอินเวอร์เตอร์": ["Inverter specification", "逆变器参数"],
  "สเปคไมโครอินเวอร์เตอร์": ["Microinverter specification", "微型逆变器参数"],
  "ค่า": ["Value", "数值"],
  "รุ่น": ["Model", "型号"],
  "กำลังสูงสุด Pmax": ["Max power Pmax", "最大功率 Pmax"],
  "แรงดันวงจรเปิด Voc": ["Open-circuit voltage Voc", "开路电压 Voc"],
  "กระแสลัดวงจร Isc": ["Short-circuit current Isc", "短路电流 Isc"],
  "แรงดันทำงาน Vmp": ["Operating voltage Vmp", "工作电压 Vmp"],
  "กระแสทำงาน Imp": ["Operating current Imp", "工作电流 Imp"],
  "ค่าอุณหภูมิ Voc": ["Temp. coefficient Voc", "温度系数 Voc"],
  "ค่าอุณหภูมิ Pmax": ["Temp. coefficient Pmax", "温度系数 Pmax"],
  "เสื่อมปีแรก / ปีถัดไป": ["Degradation year 1 / thereafter", "首年/逐年衰减"],
  "อัตราส่วน": ["Ratio", "配比"],
  "แผง {} : ไมโคร 1 · MPPT {} ช่องอิสระ": ["{} modules : 1 micro · {} independent MPPT", "{} 块组件 : 1 台微逆 · {} 路独立 MPPT"],
  "แผงต่อ 1 ช่อง MPPT": ["Modules per MPPT input", "每路 MPPT 组件数"],
  "กำลัง AC ต่อตัว": ["AC power per unit", "单台交流功率"],
  "แรงดัน DC สูงสุด": ["Max DC voltage", "最大直流电压"],
  "ช่วง MPPT": ["MPPT range", "MPPT 范围"],
  "กระแสทำงาน/ลัดวงจร สูงสุดต่อช่อง": ["Max operating / short-circuit current per input", "每路最大工作/短路电流"],
  "ช่วงกำลังแผงที่รองรับ": ["Supported module power range", "支持组件功率范围"],
  "จำนวนที่ใช้": ["Quantity used", "使用数量"],
  "กำลัง AC รวม": ["Total AC power", "交流总功率"],
  "DC/AC ต่อตัว": ["DC/AC ratio per unit", "单台容配比"],
  "ประสิทธิภาพ": ["Efficiency", "转换效率"],
  "จำนวน": ["Quantity", "数量"],
  "กระแสทำงานสูงสุด/MPPT": ["Max operating current / MPPT", "每路 MPPT 最大工作电流"],
  "กระแสลัดวงจรสูงสุด/MPPT": ["Max short-circuit current / MPPT", "每路 MPPT 最大短路电流"],
  "จำนวนช่อง MPPT": ["MPPT inputs", "MPPT 路数"],
  "ยังไม่ได้เลือก": ["Not selected", "尚未选择"],
  "ไม่ระบุ": ["Not specified", "未标注"],
  "ผืนหลังคา / กลุ่ม": ["Roof plane / group", "屋面 / 分组"],
  "ผืนหลังคา": ["Roof plane", "屋面"],
  "มุมเอียง": ["Tilt", "倾角"],
  "ทิศ": ["Azimuth", "方位角"],
  "จำนวนแผง": ["Modules", "组件数"],
  "กำลัง kWp": ["Capacity kWp", "容量 kWp"],
  "กลุ่มทิศทาง": ["Orientation group", "朝向分组"],
  "แผง": ["Modules", "组件"],
  "ไมโคร": ["Micros", "微逆"],
  "ช่อง MPPT": ["MPPT inputs", "MPPT 路数"],
  "หมายเหตุ": ["Note", "备注"],
  "เหลือแผงเดี่ยว 1 แผง": ["1 module left over", "余 1 块组件"],
  "ลงตัวพอดี": ["Exact fit", "正好配满"],
  "ตรวจสเปคไฟฟ้าต่อ 1 ช่อง MPPT ({} แผง)": ["Electrical check per MPPT input ({} modules)", "每路 MPPT 电气校验（{} 块组件）"],
  "ได้": ["Actual", "实际值"],
  "พิกัด": ["Limit", "限值"],
  "ผล": ["Result", "结果"],
  "ผลตรวจ": ["Check", "校验结果"],
  "Voc ตอนอากาศเย็น": ["Voc at low ambient temp.", "低温时 Voc"],
  "Voc ตอนเย็น": ["Voc when cold", "低温 Voc"],
  "Vmp ตอนแผงร้อน": ["Vmp at high module temp.", "高温时 Vmp"],
  "Vmp ตอนอากาศเย็น": ["Vmp at low ambient temp.", "低温时 Vmp"],
  "ผ่าน · ": ["Pass · ", "合格 · "],
  "ไม่ผ่าน": ["Fail", "不合格"],
  "ผ่าน": ["Pass", "合格"],
  "กระแสลัดวงจร Isc×1.25": ["Short-circuit current Isc×1.25", "短路电流 Isc×1.25"],
  "สตริง": ["String", "组串"],
  "ขั้วที่เสียบ (INV / MPPT / ช่อง)": ["Connection (INV / MPPT / input)", "接入位置（逆变器 / MPPT / 路）"],
  "ช่วงแรงดันทำงาน": ["Operating voltage range", "工作电压范围"],
  "ไม่มีขั้วเหลือ": ["No input available", "无可用接口"],
  "การแบ่งเฟส (ระบบ 3 เฟส)": ["Phase distribution (3-phase system)", "相序分配（三相系统）"],
  "เฟส": ["Phase", "相"],
  "กำลัง AC": ["AC power", "交流功率"],
  "กระแส": ["Current", "电流"],
  "วงจรย่อย": ["Branch circuits", "支路"],
  "เฟสสมดุลดี — เฟสที่หนักกับเบาต่างกัน {} ตัว ({}% ของกำลัง) อยู่ในเกณฑ์ {}%": ["Phases well balanced — heaviest and lightest differ by {} units ({}% of power), within the {}% tolerance", "三相平衡良好 — 最重与最轻相差 {} 台（占功率 {}%），在 {}% 容差内"],
  "<b>เฟสไม่สมดุล</b> — ต่างกัน {}% ({} ตัว) เกินเกณฑ์ {}% ควรเกลี่ยใหม่ก่อนติดตั้ง": ["<b>Phases unbalanced</b> — {}% apart ({} units), exceeding the {}% tolerance; redistribute before installation", "<b>三相不平衡</b> — 相差 {}%（{} 台），超过 {}% 容差，安装前应重新分配"],
  "กำลังไฟและอุณหภูมิเซลล์ตลอดวัน — ": ["Power output and cell temperature through the day — ", "全天功率与电池片温度 — "],
  "กำลังไฟ + อุณหภูมิเซลล์ตลอดวัน": ["Power output + cell temperature through the day", "全天功率与电池片温度"],
  " (เดือนที่ผลิตได้สูงสุดใน 12 เดือน)": [" (highest-yielding month of the year)", "（全年发电量最高的月份）"],
  "เดือนที่ผลิตได้สูงสุด": ["Highest-yielding month", "发电量最高月份"],
  "ช่วงเวลา": ["Time", "时段"],
  "พระอาทิตย์ขึ้น – ตก": ["Sunrise – sunset", "日出 – 日落"],
  " น.": [" hrs", " 时"],
  "แสงแรงที่สุดบนหน้าแผง": ["Peak irradiance on module plane", "组件面峰值辐照"],
  "กำลังไฟสูงสุดของระบบ": ["System peak power", "系统峰值功率"],
  " (อินเวอร์เตอร์ตัดยอด {} ชม./วัน)": [" (inverter clipping {} hrs/day)", "（逆变器限功率 {} 小时/天）"],
  "อุณหภูมิเซลล์สูงสุด": ["Peak cell temperature", "电池片最高温度"],
  "ผลผลิตทั้งวัน": ["Daily yield", "当日发电量"],
  "ผลผลิตทั้งเดือน": ["Monthly yield", "当月发电量"],
  "ช่วงที่มีเงาบัง": ["Shaded period", "遮挡时段"],
  "ไม่มีเงาบังตลอดวัน": ["No shading all day", "全天无遮挡"],
  "อุณหภูมิเซลล์": ["Cell temperature", "电池片温度"],
  "ความเข้มแสง": ["Irradiance", "辐照强度"],
  "แสงที่ได้ทั้งปี — เดือน × ชั่วโมง": ["Annual irradiance — month × hour", "全年辐照 — 月 × 时"],
  "เงาบังทั้งปี — เดือน × ชั่วโมง": ["Annual shading — month × hour", "全年遮挡 — 月 × 时"],
  "สรุปทั้งปี 12 เดือน": ["12-month summary", "全年 12 个月汇总"],
  "แสง/เงาทั้งปี 12 เดือน": ["Irradiance / shading over 12 months", "全年 12 个月辐照与遮挡"],
  "แผนที่ความร้อน + ตารางสรุป": ["Heat map + summary table", "热力图与汇总表"],
  "เดือน": ["Month", "月份"],
  "แดดขึ้น–ตก": ["Sunrise–sunset", "日出–日落"],
  "แดดแรงสุด": ["Peak irradiance", "峰值辐照"],
  "กำลังสูงสุด": ["Peak power", "峰值功率"],
  "ผลิต/วัน": ["Yield/day", "日发电量"],
  "ผลิต/เดือน": ["Yield/month", "月发电量"],
  "เงาบัง": ["Shading", "遮挡"],
  "ช่วงที่โดนบัง": ["Shaded period", "遮挡时段"],
  "ไม่มีเงา": ["None", "无"],
  " · เดือนที่โดนหนักสุดคือ ": [" · worst-affected month: ", " · 遮挡最严重的月份："],
  "ค่าที่ควรวัดได้ของทุกไมโคร ณ {} น.": ["Expected measured values for every microinverter at {}", "各微逆在 {} 的预期实测值"],
  "ค่าที่ควรวัดได้ของทุกสตริง ณ {} น.": ["Expected measured values for every string at {}", "各组串在 {} 的预期实测值"],
  "ค่าที่ควรวัดได้ทุกสตริง/ไมโคร": ["Expected values for every string / microinverter", "各组串/微逆的预期实测值"],
  "ตารางพกไปเทียบกับเครื่องวัดที่หน้างาน": ["Take this table on site and compare with your meter", "现场可携表对照实测"],
  "ผลตรวจวัดหน้างาน": ["On-site measurements", "现场实测结果"],
  "ผลตรวจวัดเทียบกับค่าที่ควรได้": ["Measured vs. expected", "实测值与预期值对比"],
  "เทียบค่าที่วัดได้กับที่ควรได้": ["Measured vs. expected values", "实测值与预期值对比"],
  "ต่อช่อง": ["Per input", "每路"],
  "แสง W/m²": ["Irradiance W/m²", "辐照 W/m²"],
  "เซลล์ °C": ["Cell °C", "电池片 °C"],
  "Pmax/ช่อง": ["Pmax/input", "每路 Pmax"],
  "รวมทั้งตัว": ["Unit total", "整台合计"],
  "สภาพอากาศตอนตรวจวัด": ["Conditions at time of measurement", "实测时的环境条件"],
  "วัน–เวลา": ["Date–time", "日期时间"],
  " (ระบบเลือกช่วงที่เหมาะจะวัดให้)": [" (system-selected measurement window)", "（系统自动选择的适宜测量时段）"],
  "ความเข้มแสงบนพื้นราบ": ["Horizontal irradiance", "水平面辐照"],
  " (วัดจริง)": [" (measured)", "（实测）"],
  " (ประมาณจากแบบจำลอง)": [" (modelled estimate)", "（模型估算）"],
  "แสงบนหน้าแผง (POA)": ["Plane-of-array irradiance (POA)", "组件面辐照（POA）"],
  " · หักเงาบัง ": [" · less shading ", " · 扣除遮挡 "],
  "มุมตกกระทบ / ผ่านผิวกระจก": ["Incidence angle / glass transmission", "入射角 / 玻璃透过率"],
  "อุณหภูมิอากาศ / ลม": ["Ambient temperature / wind", "环境温度 / 风速"],
  "วิธียึดแผง": ["Mounting type", "安装方式"],
  "อุณหภูมิหลังแผง / เซลล์": ["Back-of-module / cell temperature", "组件背板 / 电池片温度"],
  " °C (ร้อนกว่าอากาศ +": [" °C (above ambient +", " °C（高于环境 +"],
  "อายุระบบ ณ วันที่วัด": ["System age at measurement", "测量时系统已运行"],
  "หน่วย": ["Unit", "单元"],
  "Pmax วัดได้→STC": ["Measured Pmax → STC", "实测 Pmax → STC"],
  "ควรได้ที่ STC": ["Expected at STC", "STC 预期值"],
  "ได้กี่ %": ["% of expected", "达标率 %"],
  "<br><i>ทำต่อ: ": ["<br><i>Action: ", "<br><i>后续处理："],
  "ทุกหน่วยที่ตรวจวัดผ่านเกณฑ์ ไม่พบความผิดปกติ": ["All measured units passed; no anomalies found", "所有实测单元均合格，未发现异常"],
  "เทียบ STC": ["vs. STC", "对比 STC"],
  "เทียบที่ 25 °C": ["vs. 25 °C", "对比 25 °C"],
  "เส้นทางเดินดวงอาทิตย์ตลอดปี และทิศทางแสงที่ทำให้แผงโดนบัง": ["Annual sun path and the directions from which shading occurs", "全年太阳轨迹与造成遮挡的方位"],
  "เส้นทางเดินดวงอาทิตย์ & แผนที่เงาบัง": ["Sun path & shading map", "太阳轨迹与遮挡图"],
  "ทิศ × มุมสูง — เห็นว่าโดนบังเดือนไหน เวลาไหน": ["Azimuth × elevation — shows which months and hours are shaded", "方位角 × 高度角 — 显示哪些月份与时段被遮挡"],
  " ทิศทาง ผ่านโมเดล 3 มิติของหน้างานจริง": [" directions, traced through the 3D model of the actual site", " 个方位，基于现场三维模型计算"],
  "เส้น P-V &amp; I-V ที่ความเข้มแสงต่าง ๆ (ต่อ 1 แผง · เซลล์ 25 °C)": ["P-V &amp; I-V curves at various irradiance levels (per module · cell 25 °C)", "不同辐照下的 P-V 与 I-V 曲线（单块组件 · 电池片 25 °C）"],
  "เส้น P-V &amp; I-V ที่อุณหภูมิเซลล์ต่าง ๆ (ทั้งสตริง · แสง 1000 W/m²)": ["P-V &amp; I-V curves at various cell temperatures (full string · 1000 W/m²)", "不同电池片温度下的 P-V 与 I-V 曲线（整串 · 1000 W/m²）"],
  "เส้น P-V & I-V ที่แสง/อุณหภูมิต่าง ๆ": ["P-V & I-V curves at various irradiance / temperature", "不同辐照与温度下的 P-V 与 I-V 曲线"],
  "แบบเดียวกับกราฟบนดาต้าชีตแผง": ["Same format as the module datasheet curves", "与组件数据表曲线相同"],
  "ที่มาตรฐาน STC (1000 W/m² · 25°C)": ["at STC (1000 W/m² · 25 °C)", "标准测试条件 STC（1000 W/m² · 25°C）"],
  "เงาบังตลอดทั้งปี (คำนวณจากโมเดล 3 มิติ)": ["Annual shading (computed from the 3D model)", "全年遮挡（基于三维模型计算）"],
  "เงาบังทั้งปีจากโมเดล 3 มิติ": ["Annual shading from the 3D model", "基于三维模型的全年遮挡"],
  "ที่มาของการสูญเสียจากเงา": ["Source of shading loss", "遮挡损失来源"],
  "ทั้งปี": ["Annual", "全年"],
  "เงาบังตามพื้นที่จริง": ["Geometric shading", "几何遮挡"],
  "ผลจากการฉุดกำลังทั้งสตริง": ["String mismatch effect", "组串失配影响"],
  "แผงที่โดนเงาหนักที่สุด": ["Most heavily shaded modules", "遮挡最严重的组件"],
  "ตำแหน่งแผง": ["Module position", "组件位置"],
  "เงาบังทั้งปี": ["Annual shading", "全年遮挡"],
  "ไม่มีแผงใบไหนโดนเงาบังเกิน 3% ต่อปี": ["No module is shaded more than 3% annually", "无组件全年遮挡超过 3%"],
  "แผนภาพค่าสูญเสียของระบบ — จากแสงที่ได้ ถึงไฟที่ส่งออกจริง": ["System loss diagram — from incident irradiance to delivered AC energy", "系统损失图 — 从入射辐照到实际输出"],
  "แผนภาพค่าสูญเสียของระบบ": ["System loss diagram", "系统损失图"],
  "ไล่จากแสงที่ได้ลงมาถึงไฟ AC ทีละด่าน": ["Step by step from irradiance down to AC output", "逐级从辐照追踪到交流输出"],
  "ไม่เสียพลังงานในด่านนี้": ["No loss at this stage", "此环节无损失"],
  "ความมั่นใจของผลผลิต (P50/P90)": ["Yield confidence (P50/P90)", "发电量置信度（P50/P90）"],
  "ตัวเลขที่ธนาคารและผู้ลงทุนขอดู": ["The figures banks and investors ask for", "银行与投资方所需数据"],
  "ค่ากลาง — โอกาสได้มากกว่านี้ครึ่งหนึ่ง": ["Median — 50% chance of exceeding this", "中位值 — 有一半概率高于此值"],
  "มั่นใจ {}% ว่าผลผลิตจะไม่ต่ำกว่านี้": ["{}% confidence the yield will not fall below this", "{}% 置信度不低于此值"],
  "ที่มาของความไม่แน่นอน": ["Sources of uncertainty", "不确定性来源"],
  "<b>รวมทั้งหมด (รากที่สองของผลบวกกำลังสอง)</b>": ["<b>Combined (root sum of squares)</b>", "<b>合计（方和根）</b>"],
  "kWh/ปี": ["kWh/yr", "kWh/年"],
  "คาร์บอนที่ลดได้ · ค่าเทียบเท่า · คืนทุนทางคาร์บอน": ["Carbon avoided · equivalents · carbon payback", "减碳量 · 等效换算 · 碳回收期"],
  "ลดคาร์บอนได้ปีละ": ["Carbon avoided per year", "年减碳量"],
  "เท่ากับปลูกไม้ยืนต้น": ["Equivalent to planting trees", "相当于植树"],
  "คืนทุนทางคาร์บอน": ["Carbon payback", "碳回收期"],
  "ปริมาณคาร์บอนที่ลดได้ เทียบเท่ากับ": ["Carbon avoided is equivalent to", "减碳量相当于"],
  "ต่อปี": ["per year", "每年"],
  "ก๊าซเรือนกระจกที่ไม่ถูกปล่อย": ["Greenhouse gas avoided", "避免排放的温室气体"],
  "การปลูกไม้ยืนต้น (ดูดซับ 9.5 kgCO₂/ต้น/ปี)": ["Trees planted (9.5 kgCO₂ absorbed/tree/year)", "植树（每棵每年吸收 9.5 kgCO₂）"],
  "การไม่ขับรถยนต์นั่งส่วนบุคคล (0.12 kgCO₂/กม.)": ["Car travel avoided (0.12 kgCO₂/km)", "减少小汽车行驶（0.12 kgCO₂/公里）"],
  "น้ำมันเบนซินที่ไม่ถูกเผา (2.31 kgCO₂/ลิตร)": ["Petrol not burned (2.31 kgCO₂/litre)", "未燃烧的汽油（2.31 kgCO₂/升）"],
  "ไฟฟ้าที่ครัวเรือนไทยใช้ทั้งปี (~200 หน่วย/เดือน)": ["Annual electricity use of a Thai household (~200 units/month)", "泰国家庭全年用电（约 200 度/月）"],
  " หลัง": [" households", " 户"],
  " กม.": [" km", " 公里"],
  " ลิตร": [" litres", " 升"],
  "รวมคาร์บอนที่ใช้ผลิต ขนส่ง และติดตั้ง": ["Includes carbon from manufacturing, transport and installation", "含制造、运输与安装的碳排放"],
  "ระยะเวลาคืนทุนทางคาร์บอน": ["Carbon payback period", "碳回收期"],
  "ตลอดอายุระบบลดได้กี่เท่าของที่ใช้สร้าง": ["Lifetime carbon avoided vs. carbon invested", "全生命周期减碳量与投入碳排之比"],
  " เท่า": ["×", " 倍"],
  " ต้น": [" trees", " 棵"],
  "จำลองทีละชั่วโมงทั้งปี — ผลิตแล้วได้ใช้เองกี่ %": ["Hour-by-hour annual simulation — how much is self-consumed", "全年逐小时模拟 — 自用比例"],
  "การใช้ไฟ · แบตเตอรี่ · ห้ามไหลย้อน": ["Consumption · battery · zero export", "用电 · 储能 · 防逆流"],
  "กราฟไฟทั้งวัน": ["Daily energy flow", "全天能量流"],
  "ไฟที่ผลิตได้ไปไหน + ไฟที่ใช้มาจากไหน": ["Where generation goes and where consumption comes from", "发电去向与用电来源"],
  "ห้ามไหลย้อนเด็ดขาด (zero export)": ["Strict zero export", "严格防逆流（零上网）"],
  "ปล่อยออกได้ไม่เกิน ": ["Export limited to ", "上网功率不超过 "],
  "ขายคืนได้ไม่จำกัด": ["Unlimited export", "上网不受限"],
  "ผลิตแล้วได้ใช้เอง": ["Self-consumption", "自用率"],
  "ไฟที่ใช้มาจากโซลาร์": ["Load covered by solar", "太阳能供电占比"],
  "ยังต้องซื้อไฟ": ["Still purchased from grid", "仍需外购电量"],
  "ตัดทิ้งเพราะห้ามไหลย้อน": ["Curtailed by export limit", "因防逆流被削减"],
  "แบตใช้ไปปีละ": ["Battery cycles per year", "电池年循环次数"],
  "รอบ": ["cycles", "次"],
  "สมมติฐานการใช้ไฟของลูกค้า": ["Client consumption assumptions", "客户用电假设"],
  "ลักษณะการใช้ไฟ": ["Load profile", "用电曲线"],
  "ใช้ไฟทั้งปี": ["Annual consumption", "全年用电量"],
  "เงื่อนไขฝั่งการไฟฟ้า": ["Utility conditions", "电网侧条件"],
  "แบตเตอรี่": ["Battery", "储能电池"],
  "ไม่มีในระบบนี้": ["Not included in this system", "本系统未配置"],
  "ไฟที่ผลิตได้ในวันเฉลี่ยเดือน{} ถูกเอาไปทำอะไร": ["Where generation goes on an average day in {}", "{}平均日发电量的去向"],
  "ไฟที่ลูกค้าใช้ในวันเดียวกัน มาจากไหน": ["Where the client's consumption comes from on the same day", "同日客户用电的来源"],
  "สรุปรายเดือน (kWh)": ["Monthly summary (kWh)", "月度汇总（kWh）"],
  "ตารางรายเดือน": ["Monthly table", "月度表"],
  "ผลิตได้": ["Generated", "发电量"],
  "ลูกค้าใช้ไฟ": ["Consumed", "用电量"],
  "ใช้ตรง ๆ ตอนนั้น": ["Used directly", "即时自用"],
  "ใช้ตรง ๆ": ["Direct use", "直接自用"],
  "เก็บเข้าแบต": ["Charged to battery", "充入电池"],
  "จ่ายออกจากแบต": ["Discharged from battery", "电池放电"],
  "จากแบต": ["From battery", "来自电池"],
  "ขายคืนการไฟฟ้า": ["Exported to grid", "上网售电"],
  "ขายคืน": ["Exported", "上网"],
  "ตัดทิ้ง (ห้ามไหลย้อน)": ["Curtailed (zero export)", "削减（防逆流）"],
  "ตัดทิ้ง": ["Curtailed", "削减"],
  "ซื้อจากการไฟฟ้า": ["Purchased from grid", "外购电量"],
  "ใช้เอง %": ["Self-use %", "自用率 %"],
  "สเปคแบตเตอรี่ที่ใช้ในการคำนวณ": ["Battery specification used in the calculation", "计算所采用的电池参数"],
  "สเปคแบตเตอรี่ที่ใช้คิด": ["Battery specification used", "所采用的电池参数"],
  "รายการ": ["Item", "项目"],
  "ที่มา / ความหมาย": ["Source / meaning", "来源 / 说明"],
  "ชนิดเซลล์": ["Cell chemistry", "电芯类型"],
  "กำหนดอายุ รอบการใช้งาน และ DoD ที่ปลอดภัย": ["Determines lifetime, cycle count and safe depth of discharge", "决定寿命、循环次数与安全放电深度"],
  "ความจุตามป้าย": ["Nameplate capacity", "标称容量"],
  "ตัวเลขบนดาต้าชีตของผู้ผลิต": ["Manufacturer datasheet figure", "厂家数据表数值"],
  "ลึกกว่านี้แบตเสื่อมเร็ว": ["Discharging deeper shortens battery life", "放电更深会加速衰减"],
  "กันไว้เผื่อไฟดับ": ["Reserved for outage backup", "预留停电备用"],
  "ส่วนนี้ไม่ถูกใช้ลดค่าไฟ": ["This portion is not used to offset the bill", "此部分不用于节省电费"],
  "ส่วนที่ใช้ลดค่าไฟได้จริง": ["Usable for bill savings", "可用于节省电费的部分"],
  "ความจุใช้งาน หักที่กันไว้สำรอง": ["Usable capacity less the reserve", "可用容量扣除备用"],
  "กำลังชาร์จ / จ่ายสูงสุด": ["Max charge / discharge power", "最大充放电功率"],
  "เอาค่าที่น้อยกว่าระหว่างตัวแบตกับอินเวอร์เตอร์ไฮบริด": ["Lesser of the battery and the hybrid inverter", "取电池与混合逆变器中的较小值"],
  "ประสิทธิภาพไป-กลับ": ["Round-trip efficiency", "往返效率"],
  "ไฟหายไปในการเก็บ-จ่ายปีละ ": ["Energy lost in charge/discharge per year: ", "年充放电损耗："],
  "แบตกินไฟเองต่อวัน": ["Self-consumption per day", "每日自耗电"],
  " % ของความจุ": ["% of capacity", "% 容量"],
  "BMS พัดลม และวงจรสแตนด์บาย": ["BMS, fans and standby circuits", "BMS、风扇与待机电路"],
  "จำนวนรอบจนหมดอายุ": ["Cycle life", "循环寿命"],
  " รอบ/ปี": [" cycles/yr", " 次/年"],
  "ใช้จริงจากการจำลอง ": ["From simulation: ", "模拟结果："],
  "อายุปฏิทิน": ["Calendar life", "日历寿命"],
  "เสื่อมตามเวลาแม้ไม่ค่อยได้ใช้": ["Degrades over time even when lightly used", "即使少用也会随时间衰减"],
  "อายุที่ประเมินได้": ["Estimated service life", "预计使用寿命"],
  "หมดรอบก่อนหมดอายุปฏิทิน": ["Cycle-limited", "循环次数先到寿"],
  "หมดอายุปฏิทินก่อนใช้ครบรอบ": ["Calendar-limited", "日历寿命先到"],
  "ความจุคงเหลือตอนหมดอายุ": ["Remaining capacity at end of life", "寿命终止时剩余容量"],
  "เกณฑ์สิ้นอายุการใช้งานตามมาตรฐาน": ["Standard end-of-life threshold", "行业标准的寿命终止判据"],
  "ราคาแบตที่ใช้คิด": ["Battery price used", "计算所用电池价格"],
  "กรอกเป็นยอดรวมทั้งชุด": ["Entered as a total for the whole pack", "按整套总价录入"],
  " บาท/kWh": [" THB/kWh", " 泰铢/kWh"],
  " บาท": [" THB", " 泰铢"],
  "คืนทุน · IRR · กระแสเงินสด": ["Payback · IRR · cash flow", "回收期 · IRR · 现金流"],
  "พันบาท": ["THB thousand", "千泰铢"],
  "ต้นทุนไฟที่ผลิตเอง": ["Levelised cost of energy", "自发电度电成本"],
  "บาท/หน่วย": ["THB/unit", "泰铢/度"],
  "กำไรสุทธิ ": ["Net profit ", "净收益 "],
  "ผลผลิต kWh": ["Yield kWh", "发电量 kWh"],
  "เหลือ %": ["Remaining %", "剩余 %"],
  "ประหยัดค่าไฟ": ["Bill savings", "节省电费"],
  "ค่าดูแล": ["O&M cost", "运维费用"],
  "สุทธิ": ["Net", "净额"],
  "สะสม": ["Cumulative", "累计"],
  "คืนทุน {} ปี": ["payback {} years", "回收期 {} 年"],
  "ผังแผงมองจากด้านบน (สีเดียวกัน = ": ["Top-down module layout (same colour = ", "组件俯视布置图（同色 = "],
  "ผังแผงมองจากด้านบน": ["Top-down module layout", "组件俯视布置图"],
  "สีเดียวกัน = สตริง/ไมโครเดียวกัน": ["Same colour = same string / microinverter", "同色 = 同一组串/微逆"],
  "ไมโครตัวเดียวกัน": ["same microinverter", "同一台微逆"],
  "สตริงเดียวกัน": ["same string", "同一组串"],
  "การต่อไมโครอินเวอร์เตอร์": ["Microinverter configuration", "微型逆变器接线"],
  "การต่อสตริงและช่อง MPPT": ["String and MPPT configuration", "组串与 MPPT 接线"],
  "ตารางการต่อ · ข้อควรแก้": ["Configuration table · items to address", "接线表 · 待处理事项"],
  "อุปกรณ์ที่ใช้": ["Equipment used", "所用设备"],
  "สเปคแผง/อินเวอร์เตอร์ · ผืนหลังคาและทิศทาง": ["Module / inverter specs · roof planes and orientation", "组件与逆变器参数 · 屋面与朝向"],
  "การ์ดตัวเลขสำคัญทั้งหมดในหน้าเดียว": ["All key figures on one page", "关键数据一页汇总"],
  "หน้าปก": ["Cover page", "封面"],
  "โลโก้ · ตัวเลขเด่น · ภาพ 3 มิติ": ["Logo · headline figure · 3D view", "标志 · 核心数据 · 三维视图"],
  " กลุ่มทิศทาง": [" orientation groups", " 个朝向分组"],
  "ไม่พบข้อควรแก้ในการออกแบบ": ["No design issues found", "设计未发现问题"],
  "ตอ.เฉียงเหนือ": ["NE", "东北"],
  "ตอ.เฉียงใต้": ["SE", "东南"],
  "ตต.เฉียงใต้": ["SW", "西南"],
  "ตต.เฉียงเหนือ": ["NW", "西北"],
  "ตะวันออก": ["East", "东"],
  "ตะวันตก": ["West", "西"],
  "เหนือ": ["North", "北"],
  "ใต้": ["South", "南"],
  "ม.ค.": ["Jan", "1月"],
  "ก.พ.": ["Feb", "2月"],
  "มี.ค.": ["Mar", "3月"],
  "เม.ย.": ["Apr", "4月"],
  "พ.ค.": ["May", "5月"],
  "มิ.ย.": ["Jun", "6月"],
  "ก.ค.": ["Jul", "7月"],
  "ส.ค.": ["Aug", "8月"],
  "ก.ย.": ["Sep", "9月"],
  "ต.ค.": ["Oct", "10月"],
  "พ.ย.": ["Nov", "11月"],
  "ธ.ค.": ["Dec", "12月"],
  "<b>หมายเหตุการใช้งานตัวเลขในรายงานนี้</b>": ["<b>Notes on the figures in this report</b>", "<b>本报告数据使用说明</b>"],
  "ผู้ออกแบบ / ผู้ตรวจวัด": ["Designer / test engineer", "设计 / 测试工程师"],
  "ผู้รับมอบงาน": ["Accepted by", "验收方"],
  "วันที่": ["Date", "日期"],
  " ปี": [" years", " 年"],
  " ใบ": [" modules", " 块"],
  " ตัว": [" units", " 台"],
  " ช่อง": [" inputs", " 路"],
  " วงจร": [" circuits", " 条"],
  " แผง": [" modules", " 块"],
  " วงจรย่อย AC": [" AC branch circuits", " 条交流支路"],
  "ตัวเลขทั้งหมดมาจากการจำลองตำแหน่งดวงอาทิตย์จริงที่พิกัดของงานนี้ ร่วมกับโมเดล 3 มิติของอาคาร รายละเอียดวิธีคิดและสมมติฐานอยู่ในหัวข้อถัดไปทั้งหมด": ["All figures come from simulating the real sun position at this site's coordinates together with a 3D model of the building. Methods and assumptions are detailed in the sections that follow.", "所有数据均基于本项目所在坐标的真实太阳位置模拟与建筑三维模型计算，计算方法与假设条件详见后续章节。"],
  "ผืนหลังคาและทิศทางแผง": ["Roof planes and module orientation", "屋面与组件朝向"],
  "หลังคา {} · เอียง {}° Azimuth {}°": ["Roof {} · tilt {}° · azimuth {}°", "屋面 {} · 倾角 {}° · 方位角 {}°"],
  "หลังคา ": ["Roof ", "屋面 "],
  "เอียง ": ["tilt ", "倾角 "],
  "ไมโครติดตั้งใต้แผงและแปลงเป็นไฟ AC ตรงจุดนั้นเลย · รุ่นนี้ให้ MPPT {} ช่องอิสระต่อแผง {} ใบ = 1 ช่องต่อ {} แผง จึงตรวจแรงดัน/กระแสด้วยเกณฑ์เดียวกับสตริงอินเวอร์เตอร์ โดยมองว่า 1 ช่อง MPPT คือ 1 สตริงสั้น ๆ · ": ["Microinverters mount under the modules and convert to AC right there · this model gives {} independent MPPT inputs per {} modules = 1 input per {} module, so voltage and current are checked against the same criteria as a string inverter, treating one MPPT input as a short string · ", "微型逆变器安装于组件背面，就地转换为交流电 · 本型号每 {} 块组件提供 {} 路独立 MPPT = 每 {} 块组件 1 路，因此电压与电流按与组串逆变器相同的标准校验，将 1 路 MPPT 视为一个短组串 · "],
  "แผงทุกใบหาจุดทำงานของตัวเอง เงาบังใบไหนกำลังตกเฉพาะใบนั้น ไม่ฉุดใบข้างเคียง ค่าสูญเสีย “แผงไม่เท่ากัน” จึงตั้งไว้ที่ 0.3% แทน 2% ของระบบสตริง": ["every module finds its own operating point, so a shaded module loses power alone without dragging its neighbours down; mismatch loss is therefore set to 0.3% instead of the 2% used for string systems", "每块组件独立寻找工作点，被遮挡的组件只影响自身、不拖累相邻组件，因此失配损失按 0.3% 计算，而非组串系统的 2%"],
  "ช่องนี้มีแผงมากกว่า 1 ใบต่ออนุกรมกัน จึงยังฉุดกันได้ภายในช่องเดียวกัน": ["this input has more than one module in series, so modules can still drag each other down within the same input", "该路串联了一块以上组件，因此同一路内仍会相互影响"],
  "ไมโครแทบทุกรุ่นเป็นอุปกรณ์ 1 เฟส เมื่อใช้กับระบบ 3 เฟสจึงต้องกระจายตัวลงแต่ละเฟสให้กำลังใกล้เคียงกัน ไม่งั้นเฟสที่หนักกว่าจะแรงดันตกและกระแสในสายนิวทรัลสูงเกินจำเป็น · ดูว่าตัวไหนลงเฟสอะไรได้ที่ตารางใต้ผังแผง": ["Almost all microinverters are single-phase devices. On a three-phase system they must be spread across the phases with roughly equal power, otherwise the heavier phase suffers voltage drop and excessive neutral current. The table below the layout shows which unit goes on which phase.", "绝大多数微型逆变器为单相设备。用于三相系统时必须将各相功率分配均衡，否则重载相会出现电压跌落且中性线电流过大。各台所属相序见布置图下方表格。"],
  "ตัวหนังสือบนแผง = Phase · ทิศเหนืออยู่บน": ["letter on module = phase · north is up", "组件上的字母 = 相序 · 上方为北"],
  "ตัวหนังสือบนแผง = ": ["letter on module = ", "组件上的字母 = "],
  "ทิศเหนืออยู่บน": ["north is up", "上方为北"],
  "ช่างเดินตามผังนี้ได้เลย — แผงสีเดียวกันเสียบเข้าไมโครตัวเดียวกัน และตัวหนังสือบนแผงบอกเฟสที่ต้องต่อ": ["Installers can work directly from this layout — modules of the same colour connect to the same microinverter, and the letter on each module gives the phase to wire it to.", "施工人员可直接依此图作业 — 同色组件接入同一台微逆，组件上的字母表示应接入的相序。"],
  "ตัวที่ ": ["Unit ", "第 "],
  "ปกติ": ["Normal", "正常"],
  "ข้อควรแก้": ["Items to address", "待处理事项"],
  "จำลองทั้งวัน · ": ["full-day simulation · ", "全天模拟 · "],
  "สูงสุด ": ["peak ", "峰值 "],
  "ร้อนสุด ": ["max ", "最高 "],
  "กำลังไฟที่ออกจากอินเวอร์เตอร์ (AC)": ["Inverter AC output", "逆变器交流输出"],
  "กำลังไฟจากแผง (DC) สูงกว่ากำลังที่ออกจากอินเวอร์เตอร์ (AC) เสมอ เพราะมีการสูญเสียในสายและตัวอินเวอร์เตอร์ · อุณหภูมิเซลล์คำนวณจากแบบจำลองความร้อนตามวิธียึดแผงจริง ยิ่งร้อนกำลังยิ่งตกตามสัมประสิทธิ์ของแผง ({} %/°C) จึงเห็นกำลังไฟยอดแบนช่วงบ่ายแม้แดดยังแรง": ["DC power from the modules is always higher than the AC power leaving the inverter because of cable and inverter losses · cell temperature is computed with a thermal model matching the actual mounting method; the hotter the modules, the more power drops according to the module coefficient ({} %/°C), which is why the afternoon peak flattens even while irradiance is still strong", "组件直流功率始终高于逆变器交流输出，差额为线缆与逆变器损耗 · 电池片温度按实际安装方式的热模型计算，温度越高功率按组件温度系数（{} %/°C）下降越多，因此午后即使辐照仍强，功率曲线也会趋平"],
  "กำลังไฟจากแผง (DC)": ["Module DC power", "组件直流功率"],
  " (แกนขวา)": [" (right axis)", "（右轴）"],
  " · เสียไป ": [" · loss ", " · 损失 "],
  "อ่อน = แดดน้อย": ["light = low irradiance", "浅色 = 辐照低"],
  "ปานกลาง": ["medium", "中等"],
  "แรงสุด {} W/m²": ["peak {} W/m²", "峰值 {} W/m²"],
  " ขวาสุด = ": [" far right = ", " 最右列 = "],
  "บังบางส่วน": ["partial shading", "部分遮挡"],
  "บังมาก": ["heavy shading", "遮挡严重"],
  "บังเกือบหมด": ["almost fully shaded", "几乎全遮挡"],
  "เสียไปกี่ % ของเดือนนั้น": ["% lost that month", "该月损失百分比"],
  "คิดจากวันตัวแทนของแต่ละเดือน (วันที่ 15) คูณจำนวนวันในเดือน — ใช้ดูแนวโน้มรายเดือนและช่วงเวลาที่เงามา ส่วนตัวเลขผลผลิตทางการอยู่ในหัวข้อถัดไป ซึ่งเดินครบทุกวันของปี · เงาบังทั้งปีเฉลี่ย {}%": ["Based on a representative day of each month (the 15th) multiplied by the days in that month — use it to read monthly trends and when shading arrives. The formal yield figures in the next section step through every day of the year · average annual shading {}%", "以每月代表日（15 日）乘以当月天数计算 — 用于观察月度趋势与遮挡时段；正式发电量数据见下一章节，按全年逐日计算 · 全年平均遮挡 {}%"],
  "ระดับสีของเงาบัง": ["Shading colour scale", "遮挡色阶"],
  " (เข้มขึ้น = โดนบังหนักขึ้น) · เส้นทางเดินเส้นไหนวิ่งผ่านพื้นที่สี แปลว่าเดือนนั้นเวลานั้นแผงโดนเงาบังแน่นอน": [" (darker = more heavily shaded) · wherever a sun-path line crosses a coloured area, the modules are definitely shaded at that month and hour", "（颜色越深遮挡越重）· 太阳轨迹线穿过彩色区域处，即表示该月该时段组件确实被遮挡"],
  "แกนนอนคือทิศที่ดวงอาทิตย์อยู่ (0° เหนือ · 90° ตะวันออก · 180° ใต้ · 270° ตะวันตก) แกนตั้งคือมุมสูงเหนือขอบฟ้า · เส้นโค้งสีส้ม 7 เส้นคือเส้นทางเดินของดวงอาทิตย์ในวันตัวแทนแต่ละช่วงของปี เส้นประคือเวลา · ที่ละติจูดของประเทศไทย ฤดูร้อนดวงอาทิตย์อ้อมไปทางทิศเหนือ เส้นทางเดินจึงข้ามขอบซ้าย–ขวาของกราฟ": ["The horizontal axis is the sun's azimuth (0° N · 90° E · 180° S · 270° W) and the vertical axis its elevation above the horizon · the seven orange curves are the sun's path on representative days through the year; dashed lines mark the hours · at Thailand's latitude the summer sun swings north, so the paths cross the left and right edges of the chart", "横轴为太阳方位角（0° 北 · 90° 东 · 180° 南 · 270° 西），纵轴为地平线以上高度角 · 七条橙色曲线为全年代表日的太阳轨迹，虚线表示时刻 · 在泰国纬度，夏季太阳偏北，因此轨迹会越过图表左右边缘"],
  " · แผนที่เงาคิดจากการยิงลำแสงไปทั่วท้องฟ้า {} ทิศทาง ผ่านโมเดล 3 มิติของหน้างานจริง": [" · the shading map is traced by casting rays across the whole sky in {} directions through a 3D model of the actual site", " · 遮挡图通过向全天空 {} 个方向投射光线、穿过现场三维模型计算得出"],
  "แรงดัน (V)": ["Voltage (V)", "电压 (V)"],
  "แสงลดลงครึ่งหนึ่ง กระแสลดลงครึ่งหนึ่งตาม แต่แรงดันวงจรเปิดแทบไม่เปลี่ยน (ตกแบบลอการิทึม) — นี่คือเหตุผลที่วันเมฆครึ้มระบบยังจ่ายไฟได้และอินเวอร์เตอร์ยังทำงานในช่วง MPPT · เทียบกับกราฟบนดาต้าชีตของแผงรุ่นนี้ได้ตรง ๆ": ["Halve the irradiance and the current halves with it, but open-circuit voltage barely moves (it falls logarithmically) — which is why the system keeps delivering power on overcast days and the inverter stays within its MPPT range · these curves can be compared directly with the datasheet of this module.", "辐照减半时电流随之减半，而开路电压几乎不变（按对数下降）— 这正是阴天系统仍能发电、逆变器仍工作在 MPPT 范围内的原因 · 本图可直接与该组件数据表曲线对照。"],
  "ความร้อนกินแรงดัน ไม่ได้กินกระแส — เส้นเลื่อนเข้าหาแกนซ้ายแต่ความสูงเกือบไม่เปลี่ยน · จึงต้องตรวจ Voc ตอนเช้าที่อากาศเย็นที่สุด (แรงดันสูงสุด ห้ามเกินพิกัดอินเวอร์เตอร์) และเป็นเหตุผลที่บ่ายแดดแรงแต่ได้ไฟน้อยกว่าที่คาด": ["Heat costs voltage, not current — the curves shift towards the left axis while their height barely changes · this is why Voc must be checked at the coldest morning conditions (highest voltage, which must not exceed the inverter rating), and why a hot bright afternoon yields less power than expected.", "高温损失的是电压而非电流 — 曲线向左轴移动而高度几乎不变 · 因此必须按清晨最低温工况校验 Voc（此时电压最高，不得超过逆变器额定值），这也是午后烈日下发电量低于预期的原因。"],
  "ค่าที่ควรวัดได้จริงที่หน้างาน ณ สภาพอากาศเวลานี้ (ไม่ใช่ค่าบนดาต้าชีต) — พกตารางนี้ไปเทียบกับเครื่องวัดได้เลย ถ้าวัดได้ต่างจากนี้เกิน 5% ค่อยไล่หาสาเหตุ · เส้นประคือเส้นที่สภาวะมาตรฐาน STC ไว้เทียบว่าอากาศจริงกินกำลังไปเท่าไหร่": ["These are the values that should actually be measured on site under the present conditions (not datasheet values) — take the table along and compare with your meter; investigate only if a reading differs by more than 5% · the dashed curve is the STC reference, showing how much the real weather costs", "此为当前环境条件下现场应实测的数值（非数据表值）— 可携本表与仪表对照，偏差超过 5% 再排查原因 · 虚线为 STC 标准曲线，用于对比实际气象条件造成的功率损失"],
  " · ไมโคร 1 ตัวรับแผงหลายใบ แต่แยกเป็นช่อง MPPT อิสระ ค่าไฟฟ้าในตารางจึงเป็นของ 1 ช่อง (ตรงกับที่เครื่องวัดอ่านได้ตอนวัดทีละเส้น) ส่วน “รวมทั้งตัว” คือทุกช่องบวกกัน · แต่ละเส้นคิดจากเงาที่ตกบนแผงของตัวนั้นเอง ตัวที่โดนบังจึงต่ำลงคนเดียว": [" · one microinverter takes several modules but splits them into independent MPPT inputs, so the electrical values in the table are per input (matching what the meter reads when measuring one at a time), while “Unit total” is the sum of all inputs · each row accounts for the shading falling on its own modules, so a shaded unit drops on its own", " · 一台微逆接入多块组件但分为独立 MPPT 路，因此表中电气数值为每路数值（与逐路测量时仪表读数一致），“整台合计”为各路之和 · 每行按其自身组件所受遮挡计算，被遮挡的单元会单独降低"],
  " ในปีแรก": [" in year 1", " （首年）"],
  "รวมที่เสียจริง": ["Total actual loss", "实际损失合计"],
  "แผงกลุ่มนี้ถ้าย้ายตำแหน่งไม่ได้ ควรแยกไปสตริงของตัวเองหรือใช้ออปติไมเซอร์ ไม่งั้นจะฉุดกำลังทั้งสตริงลงมาตามใบที่โดนบัง": ["If these modules cannot be relocated, put them on their own string or fit optimisers; otherwise they will drag the whole string down to the level of the shaded module.", "若这些组件无法移位，应单独成串或加装优化器，否则会将整串功率拖低至被遮挡组件的水平。"],
  "ผลผลิตรายเดือน ปีแรก (kWh)": ["Monthly yield, year 1 (kWh)", "首年月度发电量（kWh）"],
  "คำนวณจากตำแหน่งดวงอาทิตย์จริงทุก 30 นาทีตลอดปี ฉายลงระนาบเอียงจริงของแต่ละกลุ่มแผง หักอุณหภูมิเซลล์รายเดือน ค่าสูญเสียระบบรวม {}% เงาบังรายกลุ่มจากโมเดล 3 มิติ (เฉลี่ย {}%) ประสิทธิภาพอินเวอร์เตอร์ {}%": ["Computed from the real sun position every 30 minutes through the year, projected onto each group's actual tilted plane, with monthly cell temperature, total system losses of {}%, per-group shading from the 3D model (average {}%) and inverter efficiency of {}%.", "按全年每 30 分钟的真实太阳位置计算，投影至各分组的实际倾斜面，计入逐月电池片温度、系统总损失 {}%、基于三维模型的分组遮挡（平均 {}%）与逆变器效率 {}%。"],
  "แสงอาทิตย์บนพื้นราบทั้งปี": ["Annual horizontal irradiation", "全年水平面辐照量"],
  "ค่าของหน้างานที่พิกัดนี้ ไม่ขึ้นกับการออกแบบ — เป็นเพดานที่ระบบทำได้": ["A property of the site at these coordinates, independent of the design — the ceiling for any system here", "该坐标场地的固有条件，与设计无关 — 是系统可达的上限"],
  "มุมเอียงและทิศของหลังคา": ["Roof tilt and orientation", "屋面倾角与朝向"],
  "เอียงเฉลี่ย {}° · แสงที่ตกบนหน้าแผงจริง (ลำแสงตรง + ฟุ้งจากฟ้า + สะท้": ["average tilt {}° · irradiance actually reaching the module plane (direct + sky diffuse + reflec", "平均倾角 {}° · 实际入射到组件面的辐照（直射 + 天空散射 + 反"],
  "การสะท้อนที่ผิวกระจกตามมุมตกกระทบ (IAM)": ["Glass surface reflection by incidence angle (IAM)", "玻璃表面入射角反射损失（IAM）"],
  "แดดเฉียงตอนเช้า/เย็นสะท้อนออกจากหน้าแผงมากกว่าแดดตั้งฉาก": ["Low morning and evening sun reflects off the glass more than perpendicular sun", "清晨与傍晚的斜射阳光比垂直入射反射更多"],
  "พลังงานนามของแผงที่ประสิทธิภาพ STC": ["Nominal module energy at STC efficiency", "按 STC 效率计的组件标称能量"],
  " · พื้นที่รับแสง ": [" · aperture area ", " · 受光面积 "],
  "อุณหภูมิเซลล์สูงกว่า 25 °C": ["Cell temperature above 25 °C", "电池片温度高于 25 °C"],
  "แบบจำลอง Sandia · ยึดชิดหลังคา · ลม {} m/s": ["Sandia model · close roof mount · wind {} m/s", "Sandia 模型 · 贴屋面安装 · 风速 {} m/s"],
  " (คำนวณจากโมเดล 3 มิติ)": [" (computed from the 3D model)", "（基于三维模型计算）"],
  "ยิงลำแสงจริงจากแผงทุกใบ รวมผลไดโอดบายพาสฉุดทั้งสตริงแล้ว": ["Ray-traced from every module, including bypass-diode effects on the whole string", "对每块组件进行光线追踪，并计入旁路二极管对整串的影响"],
  "ฝุ่น/คราบบนหน้าแผง": ["Soiling on the module surface", "组件表面积灰"],
  "แผงไม่เท่ากัน (mismatch)": ["Module mismatch", "组件失配"],
  "แผงต่ออนุกรมกัน กระแสไหลได้เท่าใบที่อ่อนที่สุด": ["Modules in series carry only as much current as the weakest one", "串联组件的电流受限于最弱的一块"],
  "สูญเสียในสาย DC": ["DC cable loss", "直流线损"],
  "ระบบหยุด/ซ่อมบำรุง": ["Downtime / maintenance", "停机与检修"],
  "พลังงาน DC ที่เข้าอินเวอร์เตอร์": ["DC energy into the inverter", "进入逆变器的直流电量"],
  "การแปลง DC → AC ในอินเวอร์เตอร์": ["DC → AC conversion in the inverter", "逆变器直流转交流"],
  "อินเวอร์เตอร์รับไม่หมด ถูกตัดยอด (clipping)": ["Inverter clipping", "逆变器限功率（削峰）"],
  " · ตัดที่ ": [" · clipped at ", " · 限制于 "],
  "พลังงาน AC ที่ส่งออกจากระบบ": ["AC energy delivered by the system", "系统输出的交流电量"],
  "ลำน้ำสีเขียวคือพลังงานที่ยังเหลืออยู่ ความกว้างแปรตามปริมาณจริง · สายที่แยกออกข้างทางคือที่เสียไปในแต่ละด่าน · ทุกตัวเลขมาจากการเดินเวลาชุดเดียวกับที่คำนวณผลผลิตข้างต้น บรรทัดสุดท้ายจึงเท่ากับผลผลิตปีแรกพอดี · Performance Ratio {}% คือบรรทัดสุดท้ายหารบรรทัดแรก เป็นตัวเลขมาตรฐานที่ใช้เทียบคุณภาพงานติดตั้งข้ามโครงการโดยไม่ต้องสนใจว่าหน้างานไหนแดดแรงกว่ากัน": ["The green stream is the energy still remaining, its width proportional to the actual quantity · the branches leaving it are what is lost at each stage · every figure comes from the same time-series used for the yield above, so the final line matches the first-year yield exactly · Performance Ratio {}% is the last line divided by the first — the standard figure for comparing installation quality across projects regardless of how sunny each site is.", "绿色主流为剩余能量，宽度与实际数值成比例 · 旁支为各环节的损失 · 所有数据均来自与上文发电量相同的时序计算，因此末行与首年发电量完全一致 · 系统效率 PR {}% 为末行除以首行，是跨项目比较安装质量的标准指标，不受各场地辐照差异影响。"],
  "ผลผลิตนี้มั่นใจได้แค่ไหน — P50 / P90": ["How confident is this yield — P50 / P90", "发电量置信度 — P50 / P90"],
  "โอกาสตกลงมาต่ำกว่านี้ 10%": ["10% chance of falling below this", "低于此值的概率为 10%"],
  "แย่กว่าที่คิด": ["Worse than expected", "低于预期"],
  "ดีกว่าที่คิด": ["Better than expected", "高于预期"],
  "ระดับความมั่นใจ": ["Confidence level", "置信水平"],
  "ผลผลิต (kWh/ปี)": ["Yield (kWh/yr)", "发电量（kWh/年）"],
  "%/ปี": ["%/yr", "%/年"],
  "ตลอด {} ปี": ["over {} years", "{} 年内"],
  " ตอน ": [" at ", " 于 "],
  "บาท/kWh": ["THB/kWh", "泰铢/kWh"],
  "บาท": ["THB", "泰铢"],
  "ต้น": ["trees", "棵"],
  "ปี": ["years", "年"],
  "% ของค่ากลาง": ["% of median", "占中位值 %"],
  "ความหมาย": ["Meaning", "含义"],
  "แสงแต่ละปีไม่เท่ากัน": ["Year-to-year irradiance variability", "年际辐照波动"],
  "ความคลาดของแบบจำลอง": ["Model uncertainty", "模型误差"],
  "ฝุ่น/คราบและรอบการล้าง": ["Soiling and cleaning interval", "积灰与清洗周期"],
  "ระบบหยุดโดยไม่ได้วางแผน": ["Unplanned downtime", "非计划停机"],
  "ค่าเสื่อมจริงของแผง": ["Actual module degradation", "组件实际衰减"],
  "ตัวเลขผลผลิตทุกหัวข้อในรายงานนี้เป็นค่ากลาง (P50) — มีโอกาสครึ่งหนึ่งที่ปีจริงจะได้น้อยกว่านั้น ธนาคารและผู้ลงทุนจึงนิยมดู P90 = {} ซึ่งเป็นระดับที่มั่นใจได้ 90% ว่าทำได้ไม่ต่ำกว่านี้ · คิดแบบ “ค่าเฉลี่ยตลอด {}” ความแปรปรวนของแสงเฉลี่ยกันเองไปแล้ว ตัวเลขจึงแคบกว่าการมองปีเดียว": ["Every yield figure in this report is the median (P50) — there is a 50% chance an actual year falls below it. Banks and investors therefore look at P90 = {}, the level that can be met with 90% confidence · computed as an average over {}, so year-to-year irradiance variability partly cancels out and the range is narrower than for a single year.", "本报告所有发电量均为中位值（P50）— 实际年份有一半概率低于该值。银行与投资方通常参考 P90 = {}，即有 90% 把握不低于的水平 · 按{}平均计算，年际辐照波动已相互抵消，因此区间比单一年份更窄。"],
  "ตลอดอายุ {} ผลิตได้รวม {} · เฉลี่ยปีละ {} · ปีสุดท้ายเหลือ {} ของกำลังเดิม (ดูรายปีพร้อมตัวเงินได้ที่หัวข้อผลตอบแทนการลงทุน)": ["Over {} the system produces {} in total · averaging {} per year · in the final year {} of the original output remains (year-by-year figures with cash values appear in the Return on Investment section)", "在 {} 内系统累计发电 {} · 年均 {} · 末年剩余原始出力的 {}（逐年数据与现金流见“投资回报”章节）"],
  "ลดคาร์บอน {} tCO₂e ตลอด {}": ["{} tCO₂e avoided over {}", "{} 年内减碳 {} tCO₂e"],
  "คาร์บอนที่ใช้สร้างระบบ (embodied carbon)": ["Embodied carbon of the system", "系统内含碳（制造阶段）"],
  "คาร์บอนต่อกำลังติดตั้ง 1 kWp": ["Carbon per kWp installed", "每 kWp 装机碳排放"],
  "คำนวณจากไฟฟ้าที่ระบบนี้ผลิตได้จริงตามผลจำลองในรายงานฉบับนี้ คูณด้วยค่าการปล่อยก๊าซเรือนกระจกของไฟฟ้าจากระบบสายส่งไทย {} kgCO₂e ต่อหน่วย (อ้างอิงองค์การบริหารจัดการก๊าซเรือนกระจก) · ค่าคาร์บอนที่ใช้สร้างระบบเป็นค่ากลางของแผงผลึกเดี่ยวรุ่นปัจจุบัน ใช้ประเมินว่าระบบเริ่มเป็นบวกต่อสิ่งแวดล้อมเมื่อไหร่": ["Based on the electricity this system actually generates per the simulation in this report, multiplied by the emission factor of the Thai grid, {} kgCO₂e per unit (per the Thailand Greenhouse Gas Management Organization) · embodied carbon is a median value for current monocrystalline modules, used to estimate when the system turns net positive for the environment.", "基于本报告模拟得出的该系统实际发电量，乘以泰国电网排放因子 {} kgCO₂e/度（依据泰国温室气体管理组织）计算 · 内含碳采用当前单晶组件的中位值，用于评估系统何时对环境产生净正效益。"],
  "ตรวจแรงดันครบทั้งสองด้าน: ตอนอากาศเย็น {}°C แรงดันวงจรเปิดต้องไม่เกินพิกัดอินเวอร์เตอร์ · ตอนแผงร้อน {}°C แรงดันทำงานต้องไม่หลุดต่ำกว่าช่วง MPPT · DC/AC = ": ["Voltage verified at both extremes: at a cold {}°C the open-circuit voltage must stay within the inverter rating · at a hot panel {}°C the operating voltage must not drop below the MPPT window · DC/AC = ", "两端极限电压均已校核：低温 {}°C 时开路电压不得超过逆变器额定值 · 组件高温 {}°C 时工作电压不得低于 MPPT 区间 · DC/AC = "],
  "ตัวเลข “ใช้เอง {}%” นี้ไม่ได้ตั้งขึ้นเอง แต่มาจากการจำลองเทียบชั่วโมงต่อชั่วโมงตลอดทั้งปี และถูกนำไปใช้คิดผลตอบแทนในหัวข้อถัดไปโดยตรง — หน่วยที่ใช้เองมีมูลค่าเท่าค่าไฟเต็ม ส่วนที่ขายคืนได้ราคาต่ำกว่า": ["The “{}% self-consumed” figure is not a typed-in setting: it comes from an hour-by-hour simulation across the whole year and feeds the return calculation in the next section directly — every self-consumed unit is worth the full retail tariff, while exported units earn less", "“自用 {}%” 并非人工设定，而是全年逐小时模拟的结果，并直接用于下一章节的收益计算 —— 自用电量按全额电价计值，上网电量单价较低"],
  " และหน่วยที่ถูกตัดทิ้งไม่มีมูลค่าเลย": [", and curtailed units are worth nothing at all", "，而被削减的电量没有任何价值"],
  "เงินลงทุน": ["Investment", "投资额"],
  "คืนทุนปีที่ {}": ["Payback in year {}", "第 {} 年回本"],
  "สมมติฐาน: ค่าไฟ {} บาท/หน่วย ปรับขึ้นปีละ {}% · ": ["Assumptions: tariff {} THB/unit rising {}% per year · ", "假设条件：电价 {} 泰铢/度，每年上涨 {}% · "],
  "ใช้ไฟเอง {}% และขายคืน {}% (มาจากการจำลองชั่วโมงต่อชั่วโมงในหัวข้อการใช้ไฟ ไม่ใช่ค่าที่ตั้งเอง)": ["self-consumption {}% and export {}% (from the hour-by-hour simulation in the consumption section, not a typed-in figure)", "自用 {}%，上网 {}%（来自用电章节的逐小时模拟，非人工设定）"],
  "ใช้ไฟเอง {}% ส่วนที่เหลือ": ["self-consumption {}%, the remainder exported", "自用 {}%，其余上网"],
  " ขายคืนหน่วยละ {} บาท · ค่าดูแลรักษาปีละ {}% ของค่าติดตั้ง · อัตราคิดลด {}%": [" at {} THB per unit · O&M {}% of installed cost per year · discount rate {}%", "，电价每度 {} 泰铢 · 运维费为安装成本的 {}%/年 · 折现率 {}%"],
  " · คิดที่ผลผลิตค่ากลาง P50": [" · based on median (P50) yield", " · 按中位值 P50 发电量计算"],
  " · คิดที่ระดับความมั่นใจ P90 คือใช้ผลผลิตต่ำกว่าค่ากลาง ": [" · based on P90 confidence, i.e. yield below the median by ", " · 按 P90 置信度计算，即发电量低于中位值 "],
  " · เผื่อเปลี่ยนอินเวอร์เตอร์ปีที่ ": [" · inverter replacement allowed for in year ", " · 计入第 "],
  " เป็นเงิน ": [" costing ", " 年更换逆变器，费用 "],
  " · เงินลงทุนแยกเป็นโซลาร์ ": [" · investment split: solar ", " · 投资构成：光伏 "],
  " และแบตเตอรี่ ": [" and battery ", "，储能 "],
  " ซึ่งเผื่อเปลี่ยนใหม่ทุก ": [", replaced every ", "，每 "],
  "— ผลผลิตคำนวณจากแบบจำลองท้องฟ้าและสถิติอากาศรายเดือนของประเทศไทย ผลจริงขึ้นกับสภาพอากาศแต่ละปี เงาที่เปลี่ยนไปตามฤดู และการบำรุงรักษา · ผลตรวจวัด I-V เป็นค่าที่ชดเชยกลับสู่สภาวะมาตรฐานแล้ว ความแม่นยำขึ้นกับความแม่นของเครื่องวัดความเข้มแสงและอุณหภูมิหน้างาน · ตัวเลขผลตอบแทนเป็นการประมาณการตามสมมติฐานที่ระบุไว้ ไม่ใช่การรับประกันผลตอบแทน": ["— Yield is computed from a sky model and monthly Thai weather statistics. Actual results depend on each year's weather, seasonal changes in shading, and maintenance · I-V measurements are corrected back to standard test conditions; their accuracy depends on the accuracy of the on-site irradiance and temperature instruments · Financial figures are projections based on the stated assumptions and are not a guarantee of return.", "— 发电量基于天空模型与泰国月度气象统计计算，实际结果取决于各年天气、季节性遮挡变化与维护情况 · I-V 实测值已修正至标准测试条件，其准确度取决于现场辐照与温度仪表的精度 · 财务数据为依据所述假设的预测值，不构成收益保证。"],
  "มค.": ["Jan", "1月"],
  "กพ.": ["Feb", "2月"],
  "มีค.": ["Mar", "3月"],
  "เมย.": ["Apr", "4月"],
  "พค.": ["May", "5月"],
  "มิย.": ["Jun", "6月"],
  "กค.": ["Jul", "7月"],
  "สค.": ["Aug", "8月"],
  "กย.": ["Sep", "9月"],
  "ตค.": ["Oct", "10月"],
  "พย.": ["Nov", "11月"],
  "ธค.": ["Dec", "12月"]
};
function suReportHTML(D) {
  const job = D.job || {},
    S = D.sys || {},
    panel = D.panel || {},
    inv = D.inv || {};
  const E = D.energy,
    L = D.life,
    roi = D.roi,
    R = D.roiCfg || {};
  const P = Object.assign(rpPickAll(), D.pick || {});
  const lang = D.lang || "th";
  const today = window.pgDate ? window.pgToday(lang) : new Date().toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const sec = (n, title, body, sub) => '<section class="sec"><h2><span class="no">' + n + "</span>" + RP_ESC(title) + (sub ? '<small>' + RP_ESC(sub) + "</small>" : "") + "</h2>" + body + "</section>";
  const kpis = [rpCard("กำลังติดตั้ง", E ? rpN(E.dcKw, 2) : "—", "kWp"), rpCard("อินเวอร์เตอร์", rpN(D.acKw, 1), "kW"), rpCard("ผลผลิตปีแรก", L ? rpN(L.rows[0].kwh) : E ? rpN(E.annual) : "—", "kWh"), rpCard("ต่อกำลังติดตั้ง", E ? rpN(E.perKwp) : "—", "kWh/kWp/ปี"), rpCard("Performance Ratio", E ? E.pr : "—", "%"), rpCard("รวม " + (S.years || 15) + " ปี", L ? rpN(Math.round(L.total / 1000)) : "—", "MWh"), roi ? rpCard("คืนทุนภายใน", roi.payback ? roi.payback : "> " + roi.years, "ปี", "hi") : "", roi ? rpCard("ผลตอบแทน IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี", "hi") : ""].join("");
  const specTbl = '<div class="two">' + "<div>" + rpTable(["สเปคแผง (STC)", "ค่า"], [["รุ่น", panel.model || "—"], ["กำลังสูงสุด Pmax", rpN(panel.wp) + " W"], ["แรงดันวงจรเปิด Voc", rpN(panel.voc, 2) + " V"], ["กระแสลัดวงจร Isc", rpN(panel.isc, 2) + " A"], ["แรงดันทำงาน Vmp", rpN(panel.vmp, 2) + " V"], ["กระแสทำงาน Imp", rpN(panel.imp, 2) + " A"], ["ค่าอุณหภูมิ Voc", scNum(panel.tcVoc, -0.25) + " %/°C"], ["ค่าอุณหภูมิ Pmax", scNum(panel.tcPmax, -0.29) + " %/°C"], ["NOCT / NMOT", rpN(panel.noct, 0) + " °C"], ["เสื่อมปีแรก / ปีถัดไป", scNum(panel.deg1, 1) + " % / " + scNum(panel.degY, 0.4) + " %/ปี"]]) + "</div><div>" + (D.isMicro ? rpTable(["สเปคไมโครอินเวอร์เตอร์", "ค่า"], D.microSel ? [["รุ่น", D.microSel.model || "—"], ["อัตราส่วน", "แผง " + D.microSel.per + " : ไมโคร 1 · MPPT " + D.microSel.nMppt + " ช่องอิสระ"], ["แผงต่อ 1 ช่อง MPPT", D.microSel.nSeries + " ใบ"], ["กำลัง AC ต่อตัว", rpN(D.microSel.acW) + " W"], ["แรงดัน DC สูงสุด", rpN(D.microSel.spec.maxVdc) + " V"], ["ช่วง MPPT", rpN(D.microSel.spec.mpptVmin) + " – " + rpN(D.microSel.spec.mpptVmax) + " V"], ["กระแสทำงาน/ลัดวงจร สูงสุดต่อช่อง", rpN(D.microSel.spec.maxInA, 1) + " A / " + rpN(D.microSel.spec.maxIscA, 1) + " A"], ["ช่วงกำลังแผงที่รองรับ", D.microSel.spec.wpMin || D.microSel.spec.wpMax ? rpN(D.microSel.spec.wpMin) + " – " + rpN(D.microSel.spec.wpMax) + " W" : "ไม่ระบุ"], ["จำนวนที่ใช้", rpN(D.microSel.units) + " ตัว" + (D.microSel.branches ? " · " + D.microSel.branches + " วงจรย่อย AC" : "")], ["กำลัง AC รวม", rpN(D.microSel.acKw, 2) + " kW · กระแส " + rpN(D.microSel.acAmpTotal, 1) + " A"], ["DC/AC ต่อตัว", D.microSel.dcAc], ["ประสิทธิภาพ", rpN(D.microSel.eff, 1) + " %"]] : [["—", "ยังไม่ได้เลือก"]]) : rpTable(["สเปคอินเวอร์เตอร์", "ค่า"], [["รุ่น", inv.model || "—"], ["จำนวน", rpN(S.invCount || 1) + " ตัว"], ["กำลัง AC ต่อตัว", rpN(inv.kw, 1) + " kW"], ["ช่วง MPPT", rpN(inv.mpptVmin) + " – " + rpN(inv.mpptVmax) + " V"], ["แรงดัน DC สูงสุด", rpN(inv.maxVdc) + " V"], ["กระแสทำงานสูงสุด/MPPT", rpN(inv.maxInA, 1) + " A"], ["กระแสลัดวงจรสูงสุด/MPPT", inv.maxIscA ? rpN(inv.maxIscA, 1) + " A" : "ไม่ระบุ"], ["จำนวนช่อง MPPT", rpN(inv.inputs) + " ช่อง"], ["ประสิทธิภาพ", scNum(inv.eff, 97.5) + " %"]])) + "</div></div>";
  const groupTbl = rpTable(["ผืนหลังคา / กลุ่ม", "มุมเอียง", "ทิศ", "จำนวนแผง", "กำลัง kWp"], (D.groups || []).map(g => [g.roofName + (g.side ? " · " + g.side : ""), g.tilt + "°", g.az + "°", g.count, rpN(g.count * scNum(panel.wp) / 1000, 2)]));
  const wiring = D.isMicro ? rpTable(["กลุ่มทิศทาง", "แผง", "ไมโคร", "ช่อง MPPT", "หมายเหตุ"], (D.groups || []).map(g => {
    const per = D.microSel ? D.microSel.per : 1,
      u = Math.ceil(g.count / per);
    return [g.label, g.count, u + " ตัว", u * (D.microSel ? D.microSel.nMppt : 1) + " ช่อง", per > 1 && g.count % per ? "เหลือแผงเดี่ยว 1 แผง" : "ลงตัวพอดี"];
  })) + (D.microSel ? rpTable(["ตรวจสเปคไฟฟ้าต่อ 1 ช่อง MPPT (" + D.microSel.nSeries + " แผง)", "ได้", "พิกัด", "ผล"], D.microSel.chk.checks.map(c => [c.k === "voc" ? "Voc ตอนอากาศเย็น" : c.k === "hot" ? "Vmp ตอนแผงร้อน" : "Vmp ตอนอากาศเย็น", scR(c.v, 1) + " V", (c.k === "hot" ? "≥ " : "≤ ") + c.lim + " V", {
    v: c.ok ? "ผ่าน" : "ไม่ผ่าน",
    cls: c.ok ? "ok" : "bad"
  }]).concat([["กระแสทำงาน Imp", D.microSel.cur.opA + " A", D.microSel.cur.limOp ? "≤ " + D.microSel.cur.limOp + " A" : "ไม่ระบุ", {
    v: !D.microSel.cur.limOp ? "—" : D.microSel.cur.opA <= D.microSel.cur.limOp ? "ผ่าน" : "ไม่ผ่าน",
    cls: !D.microSel.cur.limOp ? "" : D.microSel.cur.opA <= D.microSel.cur.limOp ? "ok" : "bad"
  }], ["กระแสลัดวงจร Isc×1.25", D.microSel.cur.scA + " A", D.microSel.cur.limSc ? "≤ " + D.microSel.cur.limSc + " A" : "ไม่ระบุ", {
    v: !D.microSel.cur.limSc ? "—" : D.microSel.cur.scA <= D.microSel.cur.limSc ? "ผ่าน" : "ไม่ผ่าน",
    cls: !D.microSel.cur.limSc ? "" : D.microSel.cur.scA <= D.microSel.cur.limSc ? "ok" : "bad"
  }]])) : "") : D.plan ? rpTable(["สตริง", "แผง", "กลุ่มทิศทาง", "ขั้วที่เสียบ (INV / MPPT / ช่อง)", "Voc ตอนเย็น", "ช่วงแรงดันทำงาน", "ผลตรวจ"], D.plan.strings.map(s => ["#" + s.id, s.n, s.label, s.pin == null ? "ไม่มีขั้วเหลือ" : s.addr || "", s.chk.vocCold + " V", s.chk.vmpHot + " – " + s.chk.vmpCold + " V", {
    v: s.chk.ok ? "ผ่าน · " + s.chk.band : "ไม่ผ่าน",
    cls: s.chk.ok ? "ok" : "bad"
  }])) : "";
  const phaseSec = D.isMicro && D.phases === 3 && (D.phaseBins || []).length ? "<h3>การแบ่งเฟส (ระบบ 3 เฟส)</h3>" + rpTable(["เฟส", "ไมโคร", "แผง", "กำลัง AC", "กระแส", "วงจรย่อย"], D.phaseBins.map(b => [b.label, b.count + " ตัว", b.panels, rpN(b.acKw, 2) + " kW", rpN(b.amps, 1) + " A", b.branches ? b.branches + " วงจร" : "—"])) + (D.phaseBal ? '<p class="' + (D.phaseBal.ok ? "ok-box" : "note") + '">' + (D.phaseBal.ok ? "เฟสสมดุลดี — เฟสที่หนักกับเบาต่างกัน " + D.phaseBal.spread + " ตัว (" + D.phaseBal.pct + "% ของกำลัง) อยู่ในเกณฑ์ " + D.phaseBal.tol + "%" : "<b>เฟสไม่สมดุล</b> — ต่างกัน " + D.phaseBal.pct + "% (" + D.phaseBal.spread + " ตัว) เกินเกณฑ์ " + D.phaseBal.tol + "% ควรเกลี่ยใหม่ก่อนติดตั้ง") + "</p>" : "") + '<p class="note">ไมโครแทบทุกรุ่นเป็นอุปกรณ์ 1 เฟส เมื่อใช้กับระบบ 3 เฟสจึงต้องกระจายตัวลงแต่ละเฟสให้กำลังใกล้เคียงกัน ' + "ไม่งั้นเฟสที่หนักกว่าจะแรงดันตกและกระแสในสายนิวทรัลสูงเกินจำเป็น · ดูว่าตัวไหนลงเฟสอะไรได้ที่ตารางใต้ผังแผง</p>" : "";
  const microNote = D.isMicro && D.microSel ? '<p class="note">ไมโครติดตั้งใต้แผงและแปลงเป็นไฟ AC ตรงจุดนั้นเลย · รุ่นนี้ให้ MPPT ' + D.microSel.nMppt + " ช่องอิสระต่อแผง " + D.microSel.per + " ใบ = 1 ช่องต่อ " + D.microSel.nSeries + " แผง " + "จึงตรวจแรงดัน/กระแสด้วยเกณฑ์เดียวกับสตริงอินเวอร์เตอร์ โดยมองว่า 1 ช่อง MPPT คือ 1 สตริงสั้น ๆ · " + (D.microSel.nSeries <= 1 ? "แผงทุกใบหาจุดทำงานของตัวเอง เงาบังใบไหนกำลังตกเฉพาะใบนั้น ไม่ฉุดใบข้างเคียง " + "ค่าสูญเสีย “แผงไม่เท่ากัน” จึงตั้งไว้ที่ 0.3% แทน 2% ของระบบสตริง" : "ช่องนี้มีแผงมากกว่า 1 ใบต่ออนุกรมกัน จึงยังฉุดกันได้ภายในช่องเดียวกัน") + "</p>" : "";
  const wiringNote = D.plan ? '<p class="note">ตรวจแรงดันครบทั้งสองด้าน: ตอนอากาศเย็น ' + scNum((S.env || {}).tMin, 15) + "°C แรงดันวงจรเปิดต้องไม่เกินพิกัดอินเวอร์เตอร์ · " + "ตอนแผงร้อน " + scNum((S.env || {}).tCellHot, 65) + "°C แรงดันทำงานต้องไม่หลุดต่ำกว่าช่วง MPPT · DC/AC = " + D.plan.dcAc + "</p>" : "";
  const rows = D.ivDone || [];
  const sim = D.sim;
  const Y = D.year;
  const best = Y && Y.bestMonth && P.ivDay ? Y.bestMonth : null;
  const daySec = best ? "<h3>กำลังไฟและอุณหภูมิเซลล์ตลอดวัน — " + RP_ESC(best.label) + " (เดือนที่ผลิตได้สูงสุดใน 12 เดือน)</h3>" + rpDayPower(best, D.acKw) + rpTable(["ช่วงเวลา", "ค่า"], [["พระอาทิตย์ขึ้น – ตก", ivHM(best.sunrise) + " – " + ivHM(best.sunset) + " น."], ["แสงแรงที่สุดบนหน้าแผง", best.maxPoa + " W/m²"], ["กำลังไฟสูงสุดของระบบ", scR(best.peakAc, 2) + " kW ตอน " + ivHM(best.peakAt) + " น." + (best.clipHours > 0 ? " (อินเวอร์เตอร์ตัดยอด " + best.clipHours + " ชม./วัน)" : "")], ["อุณหภูมิเซลล์สูงสุด", Math.round(best.cells.reduce((a, c) => Math.max(a, c.tCell || 0), 0)) + " °C"], ["ผลผลิตทั้งวัน", rpN(best.dayKwh, 1) + " kWh"], ["ผลผลิตทั้งเดือน", rpN(best.monthKwh) + " kWh"], ["ช่วงที่มีเงาบัง", best.shadeFrom != null ? ivHM(best.shadeFrom) + " – " + ivHM(best.shadeTo) + " น. · เสียไป " + best.shadeLossPct + "%" : "ไม่มีเงาบังตลอดวัน"]]) + '<p class="note">กำลังไฟจากแผง (DC) สูงกว่ากำลังที่ออกจากอินเวอร์เตอร์ (AC) เสมอ เพราะมีการสูญเสียในสายและตัวอินเวอร์เตอร์ · ' + "อุณหภูมิเซลล์คำนวณจากแบบจำลองความร้อนตามวิธียึดแผงจริง ยิ่งร้อนกำลังยิ่งตกตามสัมประสิทธิ์ของแผง (" + scNum(panel.tcPmax, -0.29) + " %/°C) จึงเห็นกำลังไฟยอดแบนช่วงบ่ายแม้แดดยังแรง</p>" : "";
  const yearSec = Y && P.ivYear ? "<h3>แสงที่ได้ทั้งปี — เดือน × ชั่วโมง</h3>" + rpYearMap(Y, "light") + "<h3>เงาบังทั้งปี — เดือน × ชั่วโมง</h3>" + rpYearMap(Y, "shade") + "<h3>สรุปทั้งปี 12 เดือน</h3>" + rpTable(["เดือน", "แดดขึ้น–ตก", "แดดแรงสุด", "กำลังสูงสุด", "ผลิต/วัน", "ผลิต/เดือน", "เงาบัง", "ช่วงที่โดนบัง"], Y.months.map(mo => [mo.label, ivHM(mo.sunrise) + "–" + ivHM(mo.sunset), mo.maxPoa + " W/m²", scR(mo.peakAc, 2) + " kW", scR(mo.dayKwh, 1) + " kWh", rpN(mo.monthKwh) + " kWh", {
    v: mo.shadeLossPct + " %",
    cls: mo.shadeLossPct >= 5 ? "bad" : mo.shadeLossPct > 0 ? "warn" : "ok"
  }, mo.shadeFrom != null ? ivHM(mo.shadeFrom) + "–" + ivHM(mo.shadeTo) + " น." : "ไม่มีเงา"])) + '<p class="note">คิดจากวันตัวแทนของแต่ละเดือน (วันที่ 15) คูณจำนวนวันในเดือน — ใช้ดูแนวโน้มรายเดือนและช่วงเวลาที่เงามา ' + "ส่วนตัวเลขผลผลิตทางการอยู่ในหัวข้อถัดไป ซึ่งเดินครบทุกวันของปี · เงาบังทั้งปีเฉลี่ย " + Y.shadeLossPct + "%" + (Y.worstMonth && Y.worstMonth.shadeLossPct > 0 ? " · เดือนที่โดนหนักสุดคือ " + Y.worstMonth.label + " (" + Y.worstMonth.shadeLossPct + "%)" : "") + "</p>" : "";
  const ivCurves = (D.ivRows || []).map((r, i) => {
    if (!(r.a && r.a.exp)) return null;
    const ch = Math.max(1, Math.round((r.u.count || 1) / Math.max(1, r.u.n)));
    return {
      id: r.u.id,
      name: r.u.name,
      curve: r.a.exp,
      watt: r.a.exp.pmax * (D.isMicro ? ch : 1),
      color: typeof suColor === "function" ? suColor(r.u.sid || i + 1) : "#1B9B75"
    };
  }).filter(Boolean);
  const ivMain = (D.ivRows || [])[0];
  const ivAllSec = ivCurves.length && P.ivAll ? "<h3>ค่าที่ควรวัดได้ของทุก" + (D.isMicro ? "ไมโคร" : "สตริง") + " ณ " + ivHM(D.simHour) + " น.</h3>" + rpTable([D.isMicro ? "ไมโคร" : "สตริง", "แผง"].concat(D.isMicro ? ["ต่อช่อง"] : []).concat(["แสง W/m²", "เซลล์ °C", "Voc", "Isc", "Vmp", "Imp", D.isMicro ? "Pmax/ช่อง" : "Pmax"]).concat(D.isMicro ? ["รวมทั้งตัว"] : []), (D.ivRows || []).filter(r => r.a && r.a.exp).map((r, i) => {
    const ch = Math.max(1, Math.round((r.u.count || 1) / Math.max(1, r.u.n)));
    return [{
      html: '<span class="dot" style="background:' + (typeof suColor === "function" ? suColor(r.u.sid || i + 1) : "#1B9B75") + '"></span><b>' + RP_ESC(r.u.name) + "</b>"
    }].concat(D.isMicro ? [r.u.count || r.u.n, r.u.n + " ใบ"] : [r.u.n]).concat([r.a.cond.g, scR(r.a.cond.tc, 0), scR(r.a.exp.voc, 1), scR(r.a.exp.isc, 2), scR(r.a.exp.vmp, 1), scR(r.a.exp.imp, 2), {
      html: "<b>" + rpN(r.a.exp.pmax) + "</b> W"
    }]).concat(D.isMicro ? [{
      html: "<b>" + rpN(r.a.exp.pmax * ch) + "</b> W"
    }] : []);
  })) + '<p class="note">ค่าที่ควรวัดได้จริงที่หน้างาน ณ สภาพอากาศเวลานี้ (ไม่ใช่ค่าบนดาต้าชีต) — พกตารางนี้ไปเทียบกับเครื่องวัดได้เลย ' + "ถ้าวัดได้ต่างจากนี้เกิน 5% ค่อยไล่หาสาเหตุ · เส้นประคือเส้นที่สภาวะมาตรฐาน STC ไว้เทียบว่าอากาศจริงกินกำลังไปเท่าไหร่" + (D.isMicro ? " · ไมโคร 1 ตัวรับแผงหลายใบ แต่แยกเป็นช่อง MPPT อิสระ ค่าไฟฟ้าในตารางจึงเป็นของ 1 ช่อง (ตรงกับที่เครื่องวัดอ่านได้ตอนวัดทีละเส้น) ส่วน “รวมทั้งตัว” คือทุกช่องบวกกัน · แต่ละเส้นคิดจากเงาที่ตกบนแผงของตัวนั้นเอง ตัวที่โดนบังจึงต่ำลงคนเดียว" : "") + "</p>" : "";
  let ivSec = "";
  if (rows.length && P.ivMeas) {
    const first = rows[0];
    const condTbl = rpTable(["สภาพอากาศตอนตรวจวัด", "ค่า"], [["วัน–เวลา", D.siteDate + " เวลา " + ivHM(D.simHour) + " น." + (D.site.hour == null ? " (ระบบเลือกช่วงที่เหมาะจะวัดให้)" : "")], ["ความเข้มแสงบนพื้นราบ", first.irr.ghi + " W/m²" + (first.irr.measured ? " (วัดจริง)" : " (ประมาณจากแบบจำลอง)")], ["แสงบนหน้าแผง (POA)", first.irr.poaNet + " W/m²" + (first.irr.shadeLoss ? " · หักเงาบัง " + first.irr.shadeLoss + " W/m²" : "")], ["มุมตกกระทบ / ผ่านผิวกระจก", first.irr.aoi + "° / " + scR(first.irr.iam * 100, 1) + "%"], ["อุณหภูมิอากาศ / ลม", first.temp.tAmb + " °C / " + first.temp.wind + " m/s"], ["วิธียึดแผง", first.temp.label], ["อุณหภูมิหลังแผง / เซลล์", first.temp.tBack + " °C / " + first.temp.tCell + " °C (ร้อนกว่าอากาศ +" + first.temp.rise + " °C)"], ["อายุระบบ ณ วันที่วัด", scNum(D.site.age, 0) + " ปี"]]);
    const resTbl = rpTable(["หน่วย", "แผง", "แสง W/m²", "เซลล์ °C", "Pmax วัดได้→STC", "ควรได้ที่ STC", "ได้กี่ %"], rows.map(r => [r.u.name, r.u.n, r.a.cond.g, scR(r.a.cond.tc, 0), rpN(r.a.stc.pmax) + " W", rpN(r.a.expStc.pmax) + " W", {
      v: r.a.ratio + " %",
      cls: r.a.ratio >= 95 ? "ok" : r.a.ratio >= 85 ? "warn" : "bad"
    }]));
    const findings = rows.flatMap(r => (r.a.findings || []).filter(f => f.sev !== "good").map(f => '<li class="' + f.sev + '"><b>' + RP_ESC(r.u.name + " — " + f.t) + "</b><br>" + RP_ESC(f.why) + (f.do ? "<br><i>ทำต่อ: " + RP_ESC(f.do) + "</i>" : "") + "</li>"));
    const outl = (D.ivOutliers || []).map(o => '<li class="warn"><b>' + RP_ESC(o.name) + " ได้ " + o.ratio + "% ต่ำกว่าค่ากลางของระบบ (" + o.med + "%)</b><br>เข้าข่ายไม่สมดุลระหว่างสตริง ควรหาสาเหตุก่อนส่งมอบ</li>");
    const curves = rows.slice(0, 4).map(r => '<div class="ivbox"><div class="ivh">' + RP_ESC(r.u.name) + ' <b>' + r.a.ratio + '%</b></div>' + rpIv(r.a.exp, r.a.expStc, {
      voc: scNum(r.m.voc),
      isc: scNum(r.m.isc),
      vmp: scNum(r.m.vmp),
      imp: scNum(r.m.imp)
    }) + "</div>").join("");
    ivSec = condTbl + '<p class="note">อุณหภูมิเซลล์คำนวณจากแบบจำลองความร้อน (Sandia) ตามวิธียึดแผงจริง — แผงยึดชิดหลังคาระบายความร้อนไม่ออก ' + "จึงร้อนกว่าอากาศได้มาก และกำลังจะตกตามสัมประสิทธิ์อุณหภูมิของแผง (" + scNum(panel.tcPmax, -0.29) + " %/°C)</p>" + resTbl + '<p class="note">ค่าที่วัดได้ถูกชดเชยกลับไปที่สภาวะมาตรฐาน STC (1000 W/m², เซลล์ 25 °C) ด้วยสมการแนวเดียวกับ IEC 60891 วิธีที่ 1 ' + "จึงเทียบกับดาต้าชีตได้ตรง ๆ · เกณฑ์ตรวจรับทั่วไปยอมรับที่ ≥ 95%</p>" + (curves ? '<div class="ivgrid">' + curves + "</div>" : "") + (findings.length || outl.length ? '<h3>ข้อสังเกตและสิ่งที่ต้องแก้</h3><ul class="find">' + findings.join("") + outl.join("") + "</ul>" : '<p class="ok-box">ทุกหน่วยที่ตรวจวัดผ่านเกณฑ์ ไม่พบความผิดปกติ</p>');
  } else {
    ivSec = "";
  }
  const sunSec = !(P.ivSun && D.sunPath) ? "" : "<h3>เส้นทางเดินดวงอาทิตย์ตลอดปี และทิศทางแสงที่ทำให้แผงโดนบัง</h3>" + rpSunPath(D.sunPath, D.isoShade) + '<p class="note">แกนนอนคือทิศที่ดวงอาทิตย์อยู่ (0° เหนือ · 90° ตะวันออก · 180° ใต้ · 270° ตะวันตก) แกนตั้งคือมุมสูงเหนือขอบฟ้า · ' + "เส้นโค้งสีส้ม 7 เส้นคือเส้นทางเดินของดวงอาทิตย์ในวันตัวแทนแต่ละช่วงของปี เส้นประคือเวลา · " + "ที่ละติจูดของประเทศไทย ฤดูร้อนดวงอาทิตย์อ้อมไปทางทิศเหนือ เส้นทางเดินจึงข้ามขอบซ้าย–ขวาของกราฟ" + (D.isoShade ? " · แผนที่เงาคิดจากการยิงลำแสงไปทั่วท้องฟ้า " + D.isoShade.cells.length + " ทิศทาง ผ่านโมเดล 3 มิติของหน้างานจริง" : "") + "</p>";
  const famSec = !(P.ivFam && (D.ivFamG || []).length) ? "" : "<h3>เส้น P-V &amp; I-V ที่ความเข้มแสงต่าง ๆ (ต่อ 1 แผง · เซลล์ 25 °C)</h3>" + rpIvFamily(D.ivFamG, "irr") + rpTable(["ความเข้มแสง", "Voc", "Isc", "Vmp", "Imp", "Pmax", "Fill Factor", "เทียบ STC"], D.ivFamG.map(c => [c.label, c.voc + " V", c.isc + " A", c.vmp + " V", c.imp + " A", {
    v: c.pmax + " W",
    cls: "ok"
  }, c.ff + " %", D.ivFamG[0].pmax > 0 ? scR(c.pmax / D.ivFamG[0].pmax * 100, 1) + " %" : "—"])) + '<p class="note">แสงลดลงครึ่งหนึ่ง กระแสลดลงครึ่งหนึ่งตาม แต่แรงดันวงจรเปิดแทบไม่เปลี่ยน (ตกแบบลอการิทึม) — ' + "นี่คือเหตุผลที่วันเมฆครึ้มระบบยังจ่ายไฟได้และอินเวอร์เตอร์ยังทำงานในช่วง MPPT · เทียบกับกราฟบนดาต้าชีตของแผงรุ่นนี้ได้ตรง ๆ</p>" + (!(D.ivFamT || []).length ? "" : "<h3>เส้น P-V &amp; I-V ที่อุณหภูมิเซลล์ต่าง ๆ (ทั้งสตริง · แสง 1000 W/m²)</h3>" + rpIvFamily(D.ivFamT, "temp") + rpTable(["อุณหภูมิเซลล์", "Voc", "Isc", "Vmp", "Imp", "Pmax", "เทียบที่ 25 °C"], D.ivFamT.map(c => [c.label, c.voc + " V", c.isc + " A", c.vmp + " V", c.imp + " A", {
    v: c.pmax >= 1000 ? scR(c.pmax / 1000, 2) + " kW" : c.pmax + " W",
    cls: "ok"
  }, D.ivFamT[0].pmax > 0 ? scR(c.pmax / D.ivFamT[0].pmax * 100, 1) + " %" : "—"])) + '<p class="note">ความร้อนกินแรงดัน ไม่ได้กินกระแส — เส้นเลื่อนเข้าหาแกนซ้ายแต่ความสูงเกือบไม่เปลี่ยน · ' + "จึงต้องตรวจ Voc ตอนเช้าที่อากาศเย็นที่สุด (แรงดันสูงสุด ห้ามเกินพิกัดอินเวอร์เตอร์) และเป็นเหตุผลที่บ่ายแดดแรงแต่ได้ไฟน้อยกว่าที่คาด</p>");
  ivSec = daySec + yearSec + sunSec + famSec + ivAllSec + (ivSec ? "<h3>ผลตรวจวัดเทียบกับค่าที่ควรได้</h3>" + ivSec : "");
  let shadeSec = "";
  const sh = P.shade ? D.shade3d : null;
  if (sh) {
    shadeSec = "<h3>เงาบังตลอดทั้งปี (คำนวณจากโมเดล 3 มิติ)</h3>" + rpTable(["ที่มาของการสูญเสียจากเงา", "ทั้งปี"], [["เงาบังตามพื้นที่จริง", sh.geoOnly + " %"], ["ผลจากการฉุดกำลังทั้งสตริง", {
      v: "+" + sh.elecExtra + " %",
      cls: "warn"
    }], ["รวมที่เสียจริง", {
      v: sh.overall + " %",
      cls: sh.overall >= 5 ? "bad" : "ok"
    }]]) + ((sh.worst || []).length ? "<h3>แผงที่โดนเงาหนักที่สุด</h3>" + rpTable(["ผืนหลังคา", "ตำแหน่งแผง", "เงาบังทั้งปี"], sh.worst.map(w => [w.roofName, w.key, {
      v: w.pct + " %",
      cls: w.pct >= 15 ? "bad" : "warn"
    }])) + '<p class="note">แผงกลุ่มนี้ถ้าย้ายตำแหน่งไม่ได้ ควรแยกไปสตริงของตัวเองหรือใช้ออปติไมเซอร์ ไม่งั้นจะฉุดกำลังทั้งสตริงลงมาตามใบที่โดนบัง</p>' : '<p class="ok-box">ไม่มีแผงใบไหนโดนเงาบังเกิน 3% ต่อปี</p>');
  }
  let prodSec = shadeSec;
  if (E && L) {
    prodSec += "<h3>ผลผลิตรายเดือน ปีแรก (kWh)</h3>" + rpMonthly(E.monthly) + rpTable(["กลุ่มทิศทาง", "มุมเอียง", "ทิศ", "แผง", "kWp", "เงาบัง", "kWh/kWp", "kWh/ปี"], E.perGroup.map(g => [g.roofName + (g.side ? " · " + g.side : ""), g.tilt + "°", g.az + "°", g.count, g.kwp, (g.shade || 0) + " %", rpN(g.kwhPerKwp), rpN(g.kwh)])) + '<p class="note">คำนวณจากตำแหน่งดวงอาทิตย์จริงทุก 30 นาทีตลอดปี ฉายลงระนาบเอียงจริงของแต่ละกลุ่มแผง ' + "หักอุณหภูมิเซลล์รายเดือน ค่าสูญเสียระบบรวม " + E.dcLoss + "% " + (E.shadeMode === "model" ? "เงาบังรายกลุ่มจากโมเดล 3 มิติ (เฉลี่ย " + E.shadeLoss + "%) " : "เงาบัง " + E.shadeLoss + "% (กรอกมือ) ") + "ประสิทธิภาพอินเวอร์เตอร์ " + E.eff + "%" + (E.clipLoss > 0.2 ? " และการตัดยอดที่ขนาด AC จริง " + E.clipLoss + "% (" + rpN(E.clipKwh) + " kWh/ปี)" : "") + "</p>" + (P.loss && (E.chain || []).length ? "<h3>แผนภาพค่าสูญเสียของระบบ — จากแสงที่ได้ ถึงไฟที่ส่งออกจริง</h3>" + rpLossFlow(E.chain) + '<p class="note">ลำน้ำสีเขียวคือพลังงานที่ยังเหลืออยู่ ความกว้างแปรตามปริมาณจริง · สายที่แยกออกข้างทางคือที่เสียไปในแต่ละด่าน · ' + "ทุกตัวเลขมาจากการเดินเวลาชุดเดียวกับที่คำนวณผลผลิตข้างต้น บรรทัดสุดท้ายจึงเท่ากับผลผลิตปีแรกพอดี · " + "Performance Ratio " + E.pr + "% คือบรรทัดสุดท้ายหารบรรทัดแรก เป็นตัวเลขมาตรฐานที่ใช้เทียบคุณภาพงานติดตั้งข้ามโครงการโดยไม่ต้องสนใจว่าหน้างานไหนแดดแรงกว่ากัน</p>" : "") + (P.pxx && D.px ? "<h3>ผลผลิตนี้มั่นใจได้แค่ไหน — P50 / P90</h3>" + rpPxx(D.px, D.pxMode || "avg") + rpTable(["ระดับความมั่นใจ", "ผลผลิต (kWh/ปี)", "% ของค่ากลาง", "ความหมาย"], (D.pxMode === "one" ? D.px.one : D.px.avg).map(r => ["P" + r.p, {
      v: rpN(r.kwh),
      cls: r.p === 90 ? "ok" : ""
    }, r.pct + " %", r.p === 50 ? "ค่ากลาง — โอกาสได้มากกว่านี้ครึ่งหนึ่ง" : "มั่นใจ " + r.p + "% ว่าผลผลิตจะไม่ต่ำกว่านี้"])) + rpTable(["ที่มาของความไม่แน่นอน", "± % (1σ)"], D.px.parts.map(p => [p.label, p.v + " %"]).concat([[{
      html: "<b>รวมทั้งหมด (รากที่สองของผลบวกกำลังสอง)</b>"
    }, {
      v: (D.pxMode === "one" ? D.px.sigma1 : D.px.sigmaN) + " %",
      cls: "ok"
    }]])) + '<p class="note">ตัวเลขผลผลิตทุกหัวข้อในรายงานนี้เป็นค่ากลาง (P50) — มีโอกาสครึ่งหนึ่งที่ปีจริงจะได้น้อยกว่านั้น ' + "ธนาคารและผู้ลงทุนจึงนิยมดู P90 = " + rpN(D.pxMode === "one" ? D.px.p90one : D.px.p90avg) + " kWh/ปี " + "ซึ่งเป็นระดับที่มั่นใจได้ 90% ว่าทำได้ไม่ต่ำกว่านี้ · " + (D.pxMode === "one" ? "คิดแบบ “ปีใดปีหนึ่ง” จึงเผื่อความแปรปรวนของแสงเต็มจำนวน" : "คิดแบบ “ค่าเฉลี่ยตลอด " + D.px.years + " ปี” ความแปรปรวนของแสงเฉลี่ยกันเองไปแล้ว ตัวเลขจึงแคบกว่าการมองปีเดียว") + "</p>" : "") + '<p class="note">ตลอดอายุ ' + L.years + " ปี ผลิตได้รวม " + rpN(L.total) + " kWh · เฉลี่ยปีละ " + rpN(L.avg) + " kWh · ปีสุดท้ายเหลือ " + L.lastPct + "% ของกำลังเดิม (ดูรายปีพร้อมตัวเงินได้ที่หัวข้อผลตอบแทนการลงทุน)</p>";
  }
  const EV = D.env;
  const envSec = !EV ? "" : '<div class="kpis">' + rpCard("ลดคาร์บอนได้ปีละ", EV.co2YearT, "tCO₂e", "hi") + rpCard("ตลอด " + EV.years + " ปี", EV.co2LifeT, "tCO₂e", "hi") + rpCard("เท่ากับปลูกไม้ยืนต้น", rpN(EV.trees), "ต้น") + rpCard("คืนทุนทางคาร์บอน", EV.carbonPayback == null ? "—" : EV.carbonPayback, "ปี") + "</div>" + rpTable(["ปริมาณคาร์บอนที่ลดได้ เทียบเท่ากับ", "ต่อปี", "ตลอด " + EV.years + " ปี"], [["ก๊าซเรือนกระจกที่ไม่ถูกปล่อย", {
    v: rpN(EV.co2Year) + " kgCO₂e",
    cls: "ok"
  }, {
    v: rpN(EV.co2Life) + " kgCO₂e",
    cls: "ok"
  }], ["การปลูกไม้ยืนต้น (ดูดซับ 9.5 kgCO₂/ต้น/ปี)", rpN(EV.trees) + " ต้น", rpN(EV.treesLife) + " ต้น"], ["การไม่ขับรถยนต์นั่งส่วนบุคคล (0.12 kgCO₂/กม.)", rpN(EV.carKm) + " กม.", rpN(EV.carKm * EV.years) + " กม."], ["น้ำมันเบนซินที่ไม่ถูกเผา (2.31 kgCO₂/ลิตร)", rpN(EV.petrol) + " ลิตร", rpN(EV.petrol * EV.years) + " ลิตร"], ["ไฟฟ้าที่ครัวเรือนไทยใช้ทั้งปี (~200 หน่วย/เดือน)", EV.homes + " หลัง", "—"]]) + rpTable(["คาร์บอนที่ใช้สร้างระบบ (embodied carbon)", "ค่า"], [["กำลังติดตั้ง", (E ? E.dcKw : "—") + " kWp"], ["คาร์บอนต่อกำลังติดตั้ง 1 kWp", scNum(EV.embod) && E && E.dcKw ? Math.round(EV.embod / E.dcKw) + " kgCO₂e" : "—"], ["รวมคาร์บอนที่ใช้ผลิต ขนส่ง และติดตั้ง", EV.embodT + " tCO₂e"], ["ระยะเวลาคืนทุนทางคาร์บอน", {
    v: EV.carbonPayback == null ? "—" : EV.carbonPayback + " ปี",
    cls: "ok"
  }], ["ตลอดอายุระบบลดได้กี่เท่าของที่ใช้สร้าง", {
    v: EV.ratio == null ? "—" : EV.ratio + " เท่า",
    cls: "ok"
  }]]) + '<p class="note">คำนวณจากไฟฟ้าที่ระบบนี้ผลิตได้จริงตามผลจำลองในรายงานฉบับนี้ คูณด้วยค่าการปล่อยก๊าซเรือนกระจกของไฟฟ้าจากระบบสายส่งไทย ' + EV.ef + " kgCO₂e ต่อหน่วย (อ้างอิงองค์การบริหารจัดการก๊าซเรือนกระจก) · " + "ค่าคาร์บอนที่ใช้สร้างระบบเป็นค่ากลางของแผงผลึกเดี่ยวรุ่นปัจจุบัน ใช้ประเมินว่าระบบเริ่มเป็นบวกต่อสิ่งแวดล้อมเมื่อไหร่</p>";
  const DS = D.dis,
    PF = D.prof,
    BT = D.battS,
    GC = D.gridCfg || {};
  const gridLabel = GC.mode === "zero" ? "ห้ามไหลย้อนเด็ดขาด (zero export)" : GC.mode === "limit" ? "ปล่อยออกได้ไม่เกิน " + scNum(GC.expLimitKw) + " kW" : "ขายคืนได้ไม่จำกัด";
  const flowM = DS ? DS.curt > 0 ? DS.months.slice().sort((a, b) => b.curt - a.curt)[0].m : DS.months.slice().sort((a, b) => b.pv - a.pv)[0].m : 0;
  const loadSec = !DS ? "" : '<div class="kpis">' + rpCard("ผลิตแล้วได้ใช้เอง", DS.selfPct, "%", "hi") + rpCard("ไฟที่ใช้มาจากโซลาร์", DS.suffPct, "%", "hi") + rpCard("ขายคืนการไฟฟ้า", rpN(DS.exp), "kWh/ปี") + rpCard("ยังต้องซื้อไฟ", rpN(DS.imp), "kWh/ปี") + (DS.curt > 0 ? rpCard("ตัดทิ้งเพราะห้ามไหลย้อน", rpN(DS.curt), "kWh/ปี") : "") + (DS.on ? rpCard("แบตใช้ไปปีละ", rpN(DS.cycles), "รอบ") : "") + "</div>" + rpTable(["สมมติฐานการใช้ไฟของลูกค้า", "ค่า"], [["ลักษณะการใช้ไฟ", PF ? PF.label : "—"], ["ใช้ไฟทั้งปี", PF ? rpN(PF.annual) + " kWh (เฉลี่ยวันละ " + PF.perDay + " kWh)" : "—"], ["เงื่อนไขฝั่งการไฟฟ้า", {
    v: gridLabel,
    cls: GC.mode === "sell" ? "ok" : ""
  }], ["แบตเตอรี่", DS.on && BT ? BT.cap + " kWh (ใช้ได้จริง " + BT.usable + " kWh) · ชาร์จ/จ่าย " + scNum(BT.pKw) + " kW" : "ไม่มีในระบบนี้"]]) + (P.loadDay ? "<h3>ไฟที่ผลิตได้ในวันเฉลี่ยเดือน" + SC_MON[flowM].replace(".", "") + " ถูกเอาไปทำอะไร</h3>" + rpFlowDay(DS.dayRows[flowM], "pv", DS.on) + rpFlowLegend(["direct", "chg", "exp", "curt"], DS.on) + "<h3>ไฟที่ลูกค้าใช้ในวันเดียวกัน มาจากไหน</h3>" + rpFlowDay(DS.dayRows[flowM], "load", DS.on) + rpFlowLegend(["direct", "dis", "imp"], false) + '<p class="note">จำลองทีละชั่วโมงตลอดทั้ง 12 เดือน โดยเทียบไฟที่ระบบผลิตได้กับรูปการใช้ไฟของลูกค้าในเวลาเดียวกัน ' + "ลำดับการจ่ายคือ ใช้เองก่อน → เก็บเข้าแบต → ที่เหลือขายคืนหรือตัดทิ้งตามเงื่อนไขการไฟฟ้า</p>" : "") + (P.loadMon ? "<h3>สรุปรายเดือน (kWh)</h3>" + rpTable(["เดือน", "ผลิตได้", "ลูกค้าใช้ไฟ", "ใช้ตรง ๆ"].concat(DS.on ? ["จากแบต"] : []).concat(["ขายคืน"]).concat(DS.curt > 0 ? ["ตัดทิ้ง"] : []).concat(["ซื้อจากการไฟฟ้า", "ใช้เอง %"]), DS.months.map(mo => [mo.label, rpN(mo.pv), rpN(mo.load), rpN(mo.direct)].concat(DS.on ? [rpN(mo.dis)] : []).concat([rpN(mo.exp)]).concat(DS.curt > 0 ? [{
    v: rpN(mo.curt),
    cls: mo.curt > 0 ? "bad" : ""
  }] : []).concat([rpN(mo.imp), {
    v: mo.selfPct + " %",
    cls: "ok"
  }]))) : "") + (P.battSpec && DS.on && BT ? "<h3>สเปคแบตเตอรี่ที่ใช้ในการคำนวณ</h3>" + rpTable(["รายการ", "ค่า", "ที่มา / ความหมาย"], [["ชนิดเซลล์", (SC_CHEM[BT.chem] || {}).label || BT.chem, "กำหนดอายุ รอบการใช้งาน และ DoD ที่ปลอดภัย"], ["ความจุตามป้าย", BT.cap + " kWh", "ตัวเลขบนดาต้าชีตของผู้ผลิต"], ["ใช้ได้จริง (DoD " + scNum(BT.dod) + "%)", {
    v: BT.usable + " kWh",
    cls: "ok"
  }, "ลึกกว่านี้แบตเสื่อมเร็ว"], ["กันไว้เผื่อไฟดับ", BT.reserve + " kWh (" + scNum(BT.reservePct) + "% ของความจุใช้งาน)", "ส่วนนี้ไม่ถูกใช้ลดค่าไฟ"], ["ส่วนที่ใช้ลดค่าไฟได้จริง", {
    v: BT.work + " kWh",
    cls: "ok"
  }, "ความจุใช้งาน หักที่กันไว้สำรอง"], ["กำลังชาร์จ / จ่ายสูงสุด", scNum(BT.pKw) + " kW", "เอาค่าที่น้อยกว่าระหว่างตัวแบตกับอินเวอร์เตอร์ไฮบริด"], ["ประสิทธิภาพไป-กลับ", scNum(BT.rte) + " %", "ไฟหายไปในการเก็บ-จ่ายปีละ " + rpN(DS.battLoss) + " kWh"], ["แบตกินไฟเองต่อวัน", scNum(BT.standby) + " % ของความจุ", "BMS พัดลม และวงจรสแตนด์บาย"], ["จำนวนรอบจนหมดอายุ", rpN(BT.cycles) + " รอบ", "ใช้จริงจากการจำลอง " + rpN(DS.cycles) + " รอบ/ปี"], ["อายุปฏิทิน", scNum(BT.calYears) + " ปี", "เสื่อมตามเวลาแม้ไม่ค่อยได้ใช้"], ["อายุที่ประเมินได้", {
    v: DS.battLife == null ? "—" : DS.battLife + " ปี",
    cls: "ok"
  }, DS.byCycle != null && DS.byCycle < scNum(BT.calYears) ? "หมดรอบก่อนหมดอายุปฏิทิน" : "หมดอายุปฏิทินก่อนใช้ครบรอบ"], ["ความจุคงเหลือตอนหมดอายุ", scNum(BT.eol) + " %", "เกณฑ์สิ้นอายุการใช้งานตามมาตรฐาน"], ["ราคาแบตที่ใช้คิด", rpN(BT.capex) + " บาท", BT.costMode === "lump" ? "กรอกเป็นยอดรวมทั้งชุด" : scNum(BT.cost) + " บาท/kWh"]]) + '<p class="note">รายการที่ต้องตรวจเพิ่มก่อนสั่งซื้อแต่ไม่ได้นำมาคิดเป็นตัวเงินในรายงานนี้: แรงดันระบบ (48V หรือ High-Voltage) ต้องตรงกับอินเวอร์เตอร์ไฮบริดที่เลือก · ' + "กระแสชาร์จ/จ่ายสูงสุดต่อโมดูล · ช่วงอุณหภูมิใช้งานและความจำเป็นในการระบายอากาศ · ระดับการป้องกันของตู้ (IP) · " + "มาตรฐานความปลอดภัย (IEC 62619 / IEC 62933 / มอก.) · เงื่อนไขและอายุการรับประกันของผู้ผลิต</p>" : "") + '<p class="note">ตัวเลข “ใช้เอง ' + DS.selfPct + '%” นี้ไม่ได้ตั้งขึ้นเอง แต่มาจากการจำลองเทียบชั่วโมงต่อชั่วโมงตลอดทั้งปี ' + "และถูกนำไปใช้คิดผลตอบแทนในหัวข้อถัดไปโดยตรง — หน่วยที่ใช้เองมีมูลค่าเท่าค่าไฟเต็ม ส่วนที่ขายคืนได้ราคาต่ำกว่า" + (DS.curt > 0 ? " และหน่วยที่ถูกตัดทิ้งไม่มีมูลค่าเลย" : "") + "</p>";
  let roiSec = "";
  if (roi) {
    roiSec = '<div class="kpis">' + rpCard("เงินลงทุน", rpN(roi.capex), "บาท") + rpCard("คืนทุนภายใน", roi.payback ? roi.payback : "> " + roi.years, "ปี") + rpCard("IRR", roi.irr == null ? "—" : roi.irr, "% ต่อปี") + rpCard("NPV", rpN(Math.round(roi.npv / 1000)), "พันบาท") + rpCard("ต้นทุนไฟที่ผลิตเอง", roi.lcoe, "บาท/หน่วย") + rpCard("กำไรสุทธิ " + roi.years + " ปี", rpN(Math.round(roi.netTotal / 1000)), "พันบาท") + "</div>" + rpCash(roi) + rpTable(["ปี", "ผลผลิต kWh", "เหลือ %", "ประหยัดค่าไฟ", "ขายคืน", "ค่าดูแล", "สุทธิ", "สะสม"], roi.rows.map(r => [r.year, rpN(r.kwh), r.keep, rpN(r.save), rpN(r.sell), rpN(r.om + r.rep), rpN(r.net), {
      v: rpN(r.cum),
      cls: r.cum >= 0 ? "ok" : ""
    }])) + '<p class="note">สมมติฐาน: ค่าไฟ ' + R.tariff + " บาท/หน่วย ปรับขึ้นปีละ " + R.escal + "% · " + (roi.split ? "ใช้ไฟเอง " + scR((roi.split.direct + roi.split.dis) * 100, 1) + "% และขายคืน " + scR(roi.split.exp * 100, 1) + "% (มาจากการจำลองชั่วโมงต่อชั่วโมงในหัวข้อการใช้ไฟ ไม่ใช่ค่าที่ตั้งเอง)" : "ใช้ไฟเอง " + R.selfUse + "% ส่วนที่เหลือ") + " ขายคืนหน่วยละ " + R.exportRate + " บาท · ค่าดูแลรักษาปีละ " + R.om + "% ของค่าติดตั้ง · อัตราคิดลด " + R.discount + "%" + (scNum(R.invRepCost) ? " · เผื่อเปลี่ยนอินเวอร์เตอร์ปีที่ " + R.invRepYear + " เป็นเงิน " + rpN(R.invRepCost) + " บาท" : "") + (roi.battCapex > 0 ? " · เงินลงทุนแยกเป็นโซลาร์ " + rpN(roi.pvCapex) + " บาท และแบตเตอรี่ " + rpN(roi.battCapex) + " บาท ซึ่งเผื่อเปลี่ยนใหม่ทุก " + (D.dis && D.dis.battLife ? Math.round(D.dis.battLife) : "—") + " ปี" : "") + (roi.kYield < 1 ? " · คิดที่ระดับความมั่นใจ P90 คือใช้ผลผลิตต่ำกว่าค่ากลาง " + scR((1 - roi.kYield) * 100, 1) + "%" : " · คิดที่ผลผลิตค่ากลาง P50") + "</p>";
  }
  const warnList = (D.warns || []).length ? '<ul class="find">' + D.warns.map(w => '<li class="warn">' + RP_ESC(w) + "</li>").join("") + "</ul>" : '<p class="ok-box">ไม่พบข้อควรแก้ในการออกแบบ</p>';
  const secs = [];
  const addSec = (on, title, body, sub) => {
    if (on && body) secs.push(sec(secs.length + 1, title, body, sub));
  };
  const cover = !P.cover ? "" : '<header class="cover">' + '<div class="cv-bar">' + '<div class="brand"><img class="mark" src="' + RP_ESC(rpLogoURL()) + '" alt="' + window.BRANDING.name + '">' + '<div><b style="font-family:Outfit,sans-serif;letter-spacing:-.02em">flash<span style="color:#22B36A">+</span>solar</b>' + "<span>ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์</span></div></div>" + '<span class="cv-tag">' + RP_ESC(job.code || "—") + "</span>" + "</div>" + '<div class="cv-mid">' + '<p class="cv-kick">รายงานการออกแบบและวิเคราะห์ระบบ</p>' + "<h1>ระบบผลิตไฟฟ้า<br>พลังงานแสงอาทิตย์บนหลังคา</h1>" + '<div class="cv-big"><b>' + (E ? rpN(E.dcKw, 2) : "—") + "</b><i>kWp</i>" + "<span>ผลิตได้ปีละราว " + (L ? rpN(L.rows[0].kwh) : "—") + " kWh" + (roi && roi.payback ? " · คืนทุนใน " + roi.payback + " ปี" : "") + "</span></div>" + "</div>" + (D.snapImg ? '<figure class="cv-shot"><img src="' + D.snapImg + '" alt="ผังการติดตั้ง 3 มิติ">' + "<figcaption>ผังการติดตั้งจำลอง 3 มิติ — ทุกตัวเลขในรายงานนี้อ้างอิงจากโมเดลนี้</figcaption></figure>" : "") + '<div class="cv-meta">' + "<span><i>ลูกค้า</i>" + RP_ESC(job.name || "—") + "</span>" + "<span><i>สถานที่ติดตั้ง</i>" + RP_ESC([job.address, job.province].filter(Boolean).join(" ") || "—") + "</span>" + "<span><i>วันที่ออกรายงาน</i>" + RP_ESC(today) + "</span>" + "</div>" + "</header>";
  const summary = !P.summary ? "" : '<section class="sec sum"><h2><span class="no">✦</span>สรุปผลการออกแบบ<small>' + RP_ESC(job.code || "") + "</small></h2>" + '<div class="kpis">' + kpis + "</div>" + '<p class="note">ตัวเลขทั้งหมดมาจากการจำลองตำแหน่งดวงอาทิตย์จริงที่พิกัดของงานนี้ ร่วมกับโมเดล 3 มิติของอาคาร ' + "รายละเอียดวิธีคิดและสมมติฐานอยู่ในหัวข้อถัดไปทั้งหมด</p></section>";
  addSec(P.equip, "อุปกรณ์ที่ใช้", specTbl + "<h3>ผืนหลังคาและทิศทางแผง</h3>" + groupTbl, D.totalPanels + " แผง · " + (D.groups || []).length + " กลุ่มทิศทาง");
  addSec(P.wiring, D.isMicro ? "การต่อไมโครอินเวอร์เตอร์" : "การต่อสตริงและช่อง MPPT", wiring + microNote + phaseSec + wiringNote + (P.layout ? "<h3>ผังแผงมองจากด้านบน (สีเดียวกัน = " + (D.isMicro ? "ไมโครตัวเดียวกัน" : "สตริงเดียวกัน") + (D.isMicro && D.phases === 3 ? " · ตัวหนังสือบนแผง = เฟส" : "") + " · ทิศเหนืออยู่บน)</h3>" + rpLayout(D.foot, D.assign, D.uidPhase) : "") + (D.isMicro && (D.microUnits || []).length ? rpTable(["ไมโคร", "แผง", "กลุ่มทิศทาง"].concat(D.phases === 3 ? ["เฟส"] : []).concat(["หมายเหตุ"]), D.microUnits.map(u => [{
    html: '<span class="dot" style="background:' + (typeof suColor === "function" ? suColor(u.id) : "#1B9B75") + '"></span><b>ตัวที่ ' + u.id + "</b>"
  }, u.n, u.gLabel].concat(D.phases === 3 ? [{
    v: (D.uidPhase || {})[(u.uids || [])[0]] || "—",
    cls: "ok"
  }] : []).concat([{
    v: u.mixed ? "คร่อมกลุ่มทิศทาง" : u.over ? "ใส่แผงเกินพิกัด" : "ปกติ",
    cls: u.mixed || u.over ? "bad" : "ok"
  }]))) + '<p class="note">ช่างเดินตามผังนี้ได้เลย — แผงสีเดียวกันเสียบเข้าไมโครตัวเดียวกัน' + (D.phases === 3 ? " และตัวหนังสือบนแผงบอกเฟสที่ต้องต่อ" : "") + "</p>" : "") + "<h3>ข้อควรแก้</h3>" + warnList);
  addSec(P.iv, "แสง เงา และผลตรวจวัด I-V", ivSec, rows.length && P.ivMeas ? rows.length + " หน่วย · เฉลี่ย " + D.ivAvg + "% ของที่ควรได้" : sim ? "จำลองทั้งวัน · " + rpN(sim.dayKwh, 1) + " kWh" : "");
  addSec(P.prod, "ผลผลิตที่คาดการณ์", prodSec, L ? rpN(L.rows[0].kwh) + " kWh ในปีแรก" : "");
  addSec(P.env, "ผลกระทบต่อสิ่งแวดล้อม", envSec, EV ? "ลดคาร์บอน " + EV.co2LifeT + " tCO₂e ตลอด " + EV.years + " ปี" : "");
  addSec(P.load, "การใช้ไฟ แบตเตอรี่ และการขายคืน", loadSec, DS ? "ผลิตแล้วได้ใช้เอง " + DS.selfPct + "%" + (DS.on ? " · แบต " + (D.battS ? D.battS.cap : "") + " kWh" : "") : "");
  addSec(P.roi, "ผลตอบแทนการลงทุน", roiSec, roi && roi.payback ? "คืนทุน " + roi.payback + " ปี" : "");
  const fontStack = window.pgFontStack ? window.pgFontStack(lang) : "'IBM Plex Sans Thai',sans-serif";
  const doc = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' + "<title>รายงานระบบโซลาร์ " + RP_ESC(job.code || "") + "</title>" + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' + '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">' + (window.pgFontLink ? window.pgFontLink(lang) : "") + "<style>" + RP_CSS + " body{font-family:" + fontStack + "}</style></head><body>" + cover + summary + secs.join("") + '<footer class="foot">' + "<p><b>หมายเหตุการใช้งานตัวเลขในรายงานนี้</b> — ผลผลิตคำนวณจากแบบจำลองท้องฟ้าและสถิติอากาศรายเดือนของประเทศไทย " + "ผลจริงขึ้นกับสภาพอากาศแต่ละปี เงาที่เปลี่ยนไปตามฤดู และการบำรุงรักษา · " + "ผลตรวจวัด I-V เป็นค่าที่ชดเชยกลับสู่สภาวะมาตรฐานแล้ว ความแม่นยำขึ้นกับความแม่นของเครื่องวัดความเข้มแสงและอุณหภูมิหน้างาน · " + "ตัวเลขผลตอบแทนเป็นการประมาณการตามสมมติฐานที่ระบุไว้ ไม่ใช่การรับประกันผลตอบแทน</p>" + "<p class='sig'>ผู้ออกแบบ / ผู้ตรวจวัด _______________________&nbsp;&nbsp;&nbsp;&nbsp; วันที่ ____________&nbsp;&nbsp;&nbsp;&nbsp; " + "ผู้รับมอบงาน _______________________&nbsp;&nbsp;&nbsp;&nbsp; วันที่ ____________</p>" + "</footer></body></html>";
  return window.pgDocHTML ? window.pgDocHTML(doc, lang, RP_I18N) : doc;
}
const RP_CSS = `
/* ตาข่ายกันตก — กราฟบางตัวยืมชุดสีมาจากหน้าจอ (เช่น SU_SCOLOR ของ solarui) ซึ่งเขียนเป็น var(--…)
   เอกสารนี้ไม่ได้โหลดธีมของแอป ถ้าไม่ประกาศไว้ตรงนี้สีพวกนั้นจะกลายเป็นสีดำ · ใช้ค่าชุดธีมสว่างเสมอ (รายงานเป็นกระดาษขาว) */
:root{
  --tint-red-tx:#B91C1C; --tint-red-tx2:#DC2626;
  --tint-amber-bd:#FDE68A; --tint-amber-tx:#B45309; --tint-amber-tx2:#92400E;
  --tint-green-tx:#15803D; --tint-green-bd:#BBF7D0;
  --primary:#1B9B75; --primary-dark:#148080; --primary-soft:#E6F5EC;
  --text-1:#16211D; --text-2:#3A4A43; --text-3:#8A968F;
  --bg:#F4F6F5; --surface:#fff; --surface2:#F7FAF8; --surface3:#EDF1EF;
  --border:#E3E9E6; --border-strong:#D8E0DB; --ln:#E3E9E6;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
}
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
  background:linear-gradient(90deg,#34C77B 0%,#1B9B75 45%,#0A3B29 100%)}
.cover>*{position:relative}
.cv-bar{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.16)}
.brand{display:flex;align-items:center;gap:11px}
.brand .mark{width:36px;height:36px;object-fit:contain;display:block;background:#fff;border-radius:9px;padding:4px}
/* ชื่อแบรนด์ต้องอยู่บรรทัดเดียว — เครื่องหมาย + ห่อด้วย <span> เพื่อให้เป็นสีเขียว
   กฎ .brand span เดิมจับ span ตัวนั้นด้วย จึงดัน + เป็นบล็อก แล้วหักเป็น flash / + / solar สามบรรทัด
   ต้องเจาะจงเฉพาะบรรทัดคำโปรยที่เป็นลูกตรงของ div และกัน nowrap ไว้อีกชั้น */
.brand b{display:block;font-size:13.5px;font-weight:700;letter-spacing:.03em;white-space:nowrap}
.brand b span{display:inline}
.brand>div>span{display:block;font-size:9.5px;color:rgba(255,255,255,.6);white-space:nowrap}
.brand>div{min-width:0}
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
h2 .no{width:20px;height:20px;border-radius:99px;background:#1B9B75;color:#fff;display:grid;place-items:center;font-size:10.5px;font-weight:700}
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
.ok-box{font-size:10.5px;font-weight:600;color:#12794A;background:#F0F9F4;border-left:3px solid #1B9B75;border-radius:8px;padding:8px 11px;margin-top:6px}
.foot{font-size:9.5px;color:#6C7A74;line-height:1.7}
.foot .sig{margin-top:22px;padding-top:14px;border-top:1px solid #E3E8E6;font-size:10.5px;color:#16211D}
@media print{
  body{background:#fff;font-size:10.5px}
  .sec,.foot{max-width:none;margin:0;padding:0 0 10px;page-break-after:auto}
  .sec{padding-top:10px}
  /* หน้าปกสีเขียวกินเต็มแผ่น ไม่มีขอบขาว — ตั้งขอบกระดาษเป็น 0 เฉพาะหน้าปก ด้วย @page ที่ตั้งชื่อไว้
     (หน้าอื่นยังมีขอบ 14/13 มม. ตามเดิม) แล้วให้ตัวหน้าปกสูงเท่ากระดาษ A4 เป๊ะ
     ไม่ใช้ margin ติดลบดันสีเขียวออกนอกขอบ เพราะทำให้หน้ากว้างเกินและเบราว์เซอร์แถมหน้าว่างมา
     297mm เต็ม ๆ จะโดนปัดเศษจนล้นไปอีกหน้า เลยหย่อนไว้นิดหนึ่ง */
  @page cover{margin:0}
  .cover{page:cover;max-width:none;min-height:0;width:100%;height:296.6mm;margin:0;
    padding:19mm 17mm 14mm;page-break-after:always;break-after:page}
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
function suPrintReport(D) {
  const html = suReportHTML(D);
  const w = window.open("", "_blank");
  if (!w) {
    alert("เบราว์เซอร์บล็อกหน้าต่างใหม่ไว้ — อนุญาต pop-up ของเว็บนี้แล้วกดออกรายงานอีกครั้ง");
    return null;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  const go = () => {
    try {
      w.focus();
      w.print();
    } catch (e) {}
  };
  const imgsReady = () => {
    const imgs = Array.prototype.slice.call(w.document.images || []);
    const left = imgs.filter(im => !im.complete);
    if (!left.length) return Promise.resolve();
    return Promise.all(left.map(im => new Promise(res => {
      im.addEventListener("load", res);
      im.addEventListener("error", res);
    })));
  };
  const fonts = w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve();
  Promise.race([Promise.all([fonts, imgsReady()]), new Promise(res => setTimeout(res, 6000))]).then(() => setTimeout(go, 250));
  return w;
}
function SuReportView({
  html,
  title,
  onClose
}) {
  const ref = React.useRef(null);
  const [ready, setReady] = React.useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 760;
  const onLoad = () => {
    const w = ref.current && ref.current.contentWindow;
    if (!w) {
      setReady(true);
      return;
    }
    const imgs = Array.prototype.slice.call(w.document.images || []).filter(im => !im.complete);
    const wait = imgs.length ? Promise.all(imgs.map(im => new Promise(res => {
      im.addEventListener("load", res);
      im.addEventListener("error", res);
    }))) : Promise.resolve();
    const fonts = w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([fonts, wait]), new Promise(res => setTimeout(res, 6000))]).then(() => setReady(true));
  };
  const doPrint = () => {
    const w = ref.current && ref.current.contentWindow;
    if (!w) return;
    try {
      w.focus();
      w.print();
    } catch (e) {
      alert("สั่งพิมพ์ไม่สำเร็จ: " + e.message);
    }
  };
  return React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 260,
      background: "rgba(8,20,14,.62)",
      display: "flex",
      flexDirection: "column"
    }
  }, React.createElement("div", {
    style: {
      display: "flex",
      gap: 9,
      alignItems: "center",
      padding: "11px 14px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0
    }
  }, React.createElement("button", {
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14",
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      border: "1px solid var(--border-strong)",
      background: "var(--surface)",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      color: "var(--text-2)",
      fontSize: 16,
      lineHeight: 1,
      flexShrink: 0
    }
  }, "\u2715"), React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: "var(--text-1)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, title || "รายงานออกแบบระบบ"), React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, ready ? "กดปุ่มแล้วเลือก “บันทึกเป็น PDF”" : "กำลังจัดหน้ารายงาน…")), React.createElement("button", {
    onClick: doPrint,
    disabled: !ready,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      padding: "11px 16px",
      borderRadius: 11,
      border: "none",
      background: ready ? "var(--primary)" : "var(--surface3)",
      color: ready ? "#fff" : "var(--text-3)",
      fontFamily: "inherit",
      fontSize: 13.5,
      fontWeight: 700,
      cursor: ready ? "pointer" : "default",
      flexShrink: 0
    }
  }, React.createElement(P3Icon, {
    name: "doc",
    size: 16
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 PDF")), React.createElement("iframe", {
    ref: ref,
    srcDoc: html,
    onLoad: onLoad,
    title: "report",
    style: {
      flex: 1,
      width: "100%",
      border: "none",
      background: "#fff",
      display: "block",
      padding: isMobile ? 0 : undefined
    }
  }));
}
Object.assign(window, {
  SuReportView,
  suReportHTML,
  suPrintReport,
  RP_SECTIONS,
  rpPickAll,
  rpTable,
  rpMonthly,
  rpCash,
  rpIv,
  rpDayPower,
  rpYearMap,
  rpIvAll,
  rpLossFlow,
  rpSunPath,
  rpIvFamily,
  rpFlowDay,
  rpPxx,
  RP_FLOW,
  RP_CSS
});