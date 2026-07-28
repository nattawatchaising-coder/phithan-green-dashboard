/* ============================================================
   PHITHAN GREEN — รายงานออกแบบระบบ + ผลตรวจวัด + ผลตอบแทน (PDF)
   ------------------------------------------------------------
   สร้างเป็นหน้าเว็บเดี่ยว ๆ ในหน้าต่างใหม่แล้วสั่งพิมพ์ → "บันทึกเป็น PDF"
   ตั้งใจไม่พึ่งไลบรารีนอก เพราะรายงานต้องออกได้แม้เน็ตหน้างานไม่ดี
   ตัวเลขทุกตัวรับมาจากหน้าจอที่คำนวณไว้แล้ว ไม่คำนวณซ้ำ — รายงานกับหน้าจอจึงตรงกันเสมอ
   ============================================================ */
const RP_ESC = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rpN = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 0 : d }) : "—"; };

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
        '" stroke="#B45309" stroke-width="1.4" stroke-dasharray="4 3"/><text x="' + (X(roi.payback) + 5).toFixed(1) + '" y="' + (T + 10) +
        '" font-size="10" font-weight="700" fill="#B45309">คืนทุนปีที่ ' + roi.payback + "</text>" : "") +
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
function rpLayout(foot, assign) {
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
            const c = v <= 0.5 ? "#EDF1EF" : v < 15 ? "#FDE68A" : v < 40 ? "#F59E0B" : "#DC2626";
            return '<i style="background:' + c + '"></i>';
          }).join("") + "</span></td></tr>").join("") +
        "</table>" +
        '<p class="legend"><span style="float:left">' + ivHM(h0) + '</span><span style="float:right">' + ivHM(h1) + "</span>" +
        '<b style="color:#EDF1EF">■</b> ไม่มีเงา &nbsp; <b style="color:#FDE68A">■</b> บังบางส่วน &nbsp; ' +
        '<b style="color:#F59E0B">■</b> บังมาก &nbsp; <b style="color:#DC2626">■</b> บังเกือบหมด</p>'
      : "");
}

/* ── ประกอบเนื้อรายงาน ── */
function suReportHTML(D) {
  const job = D.job || {}, S = D.sys || {}, panel = D.panel || {}, inv = D.inv || {};
  const E = D.energy, L = D.life, roi = D.roi, R = D.roiCfg || {};
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
      ? rpTable(["ไมโครอินเวอร์เตอร์", "ค่า"], D.microSel ? [
          ["รุ่น", D.microSel.model || "—"],
          ["อัตราส่วน", "แผง " + D.microSel.per + " : ไมโคร 1"],
          ["กำลัง AC ต่อตัว", rpN(D.microSel.acW) + " W"],
          ["จำนวนที่ใช้", rpN(D.microSel.units) + " ตัว"],
          ["กำลัง AC รวม", rpN(D.microSel.acKw, 2) + " kW"],
          ["DC/AC ต่อตัว", D.microSel.dcAc],
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
    ? rpTable(["กลุ่ม", "แผง", "ไมโคร", "หมายเหตุ"], (D.groups || []).map((g) => {
        const per = D.microSel ? D.microSel.per : 1, u = Math.ceil(g.count / per);
        return [g.label, g.count, u + " ตัว", per > 1 && g.count % per ? "เหลือแผงเดี่ยว 1 แผง" : "ลงตัวพอดี"];
      }))
    : (D.plan ? rpTable(["สตริง", "แผง", "กลุ่มทิศทาง", "ช่อง MPPT", "Voc ตอนเย็น", "ช่วงแรงดันทำงาน", "ผลตรวจ"],
        D.plan.strings.map((s) => [
          "#" + s.id, s.n, s.label,
          s.mppt == null ? "ไม่มีช่องเหลือ" : "อินฯ " + (s.inv + 1) + " / ช่อง " + (s.mppt % Math.max(1, scNum(inv.inputs, 2)) + 1),
          s.chk.vocCold + " V", s.chk.vmpHot + " – " + s.chk.vmpCold + " V",
          { v: s.chk.ok ? "ผ่าน · " + s.chk.band : "ไม่ผ่าน", cls: s.chk.ok ? "ok" : "bad" },
        ])) : "");
  const wiringNote = D.plan
    ? '<p class="note">ตรวจแรงดันครบทั้งสองด้าน: ตอนอากาศเย็น ' + scNum((S.env || {}).tMin, 15) + "°C แรงดันวงจรเปิดต้องไม่เกินพิกัดอินเวอร์เตอร์ · " +
      "ตอนแผงร้อน " + scNum((S.env || {}).tCellHot, 65) + "°C แรงดันทำงานต้องไม่หลุดต่ำกว่าช่วง MPPT · DC/AC = " + D.plan.dcAc + "</p>"
    : "";

  /* 4 · ผลตรวจวัด */
  const rows = D.ivDone || [];
  /* จำลองทั้งวันของวันที่ตรวจวัด — ให้เห็นว่าแสง/เงา/กำลังไฟวันนั้นเป็นยังไงตลอดวัน */
  const sim = D.sim;
  const daySec = sim
    ? "<h3>แสงและเงาตลอดวันที่ " + RP_ESC(new Date(D.siteDate + "T12:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })) + "</h3>" +
      rpDayLight(sim, D.groups) +
      rpTable(["ช่วงเวลา", "ค่า"], [
        ["พระอาทิตย์ขึ้น – ตก", ivHM(sim.sunrise) + " – " + ivHM(sim.sunset) + " น."],
        ["แสงแรงที่สุดบนหน้าแผง", sim.maxPoa + " W/m² ตอน " + ivHM(sim.peak ? sim.peak.h : null) + " น."],
        ["กำลังไฟสูงสุดของระบบ", (sim.peak ? scR(sim.peak.ac, 2) : 0) + " kW" + (sim.clipHours > 0 ? " (อินเวอร์เตอร์ตัดยอด " + sim.clipHours + " ชม.)" : "")],
        ["ผลผลิตทั้งวัน", rpN(sim.dayKwh, 1) + " kWh"],
        ["ช่วงที่มีเงาบัง", sim.shadeFrom != null ? ivHM(sim.shadeFrom) + " – " + ivHM(sim.shadeTo) + " น. · เสียไป " + sim.shadeLossKwh + " kWh (" + sim.shadeLossPct + "%)" : "ไม่มีเงาบังตลอดวัน"],
        ["เวลาที่ระบบแนะนำให้ตรวจวัด", ivHM(sim.bestHour) + " น. (แดดแรงที่สุดเท่าที่ไม่มีเงาบัง)"],
        ["เวลาที่ใช้เทียบค่าในรายงานนี้", ivHM(D.simHour) + " น." + (D.site.hour == null ? " (ระบบเลือกให้)" : " (เลือกเอง)")],
      ]) +
      '<p class="note">จำลองทุก 15 นาทีจากตำแหน่งดวงอาทิตย์จริงที่พิกัดของงานนี้ · เงาได้จากการยิงลำแสงจากแผงทุกใบ (' + sim.panels +
      " ใบ × 5 จุด) ไปหาดวงอาทิตย์ แล้วตรวจการชนกับตัวอาคาร/ผิวหลังคา " + sim.buildings + " ชิ้น สิ่งบดบังที่สำรวจไว้ " + sim.obstacles +
      " ชิ้น และแผงที่บังกันเอง</p>"
    : "";
  /* ทั้ง 12 เดือน */
  const Y = D.year;
  const yearSec = Y
    ? "<h3>สรุปทั้งปี 12 เดือน</h3>" +
      rpTable(["เดือน", "แดดขึ้น–ตก", "แดดแรงสุด", "กำลังสูงสุด", "ผลิต/วัน", "ผลิต/เดือน", "เงาบัง", "ช่วงที่โดนบัง"],
        Y.months.map((mo) => [mo.label, ivHM(mo.sunrise) + "–" + ivHM(mo.sunset), mo.maxPoa + " W/m²",
          scR(mo.peakAc, 2) + " kW", scR(mo.dayKwh, 1) + " kWh", rpN(mo.monthKwh) + " kWh",
          { v: mo.shadeLossPct + " %", cls: mo.shadeLossPct >= 5 ? "bad" : mo.shadeLossPct > 0 ? "warn" : "ok" },
          mo.shadeFrom != null ? ivHM(mo.shadeFrom) + "–" + ivHM(mo.shadeTo) + " น." : "ไม่มีเงา"])) +
      '<p class="note">คิดจากวันตัวแทนของแต่ละเดือน (วันที่ 15) คูณจำนวนวันในเดือน — ใช้ดูแนวโน้มรายเดือนและช่วงเวลาที่เงามา ' +
      "ส่วนตัวเลขผลผลิตทางการอยู่ในหัวข้อถัดไป ซึ่งเดินครบทุกวันของปี · เงาบังทั้งปีเฉลี่ย " + Y.shadeLossPct + "%" +
      (Y.worstMonth && Y.worstMonth.shadeLossPct > 0 ? " · เดือนที่โดนหนักสุดคือ " + Y.worstMonth.label + " (" + Y.worstMonth.shadeLossPct + "%)" : "") + "</p>"
    : "";
  let ivSec = "";
  if (rows.length) {
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
  ivSec = daySec + yearSec + (ivSec ? "<h3>ผลตรวจวัดเทียบกับค่าที่ควรได้</h3>" + ivSec : "");

  /* 5 · ผลผลิต (มีส่วนเงาบังนำหน้า ถ้าคำนวณจากโมเดล 3 มิติไว้) */
  let shadeSec = "";
  const sh = D.shade3d;
  if (sh) {
    shadeSec = "<h3>เงาบังตลอดทั้งปี (คำนวณจากโมเดล 3 มิติ)</h3>" +
      rpTable(["กลุ่มทิศทาง", "แผง", "เงาบังทั้งปี"],
        (D.groups || []).map((g) => {
          const v = scNum(sh.byGroup[g.key], 0);
          return [g.label, g.count, { v: v + " %", cls: v >= 8 ? "bad" : v >= 3 ? "warn" : "ok" }];
        }).concat([[{ v: "รวมทั้งระบบ", cls: "" }, D.totalPanels, { v: sh.overall + " %", cls: sh.overall >= 5 ? "warn" : "ok" }]])) +
      rpTable(["ที่มาของการสูญเสียจากเงา", "ทั้งปี"], [
        ["เงาบังตามพื้นที่จริง (เชิงเรขาคณิต)", sh.geoOnly + " %"],
        ["ผลจากการฉุดกำลังทั้งสตริง (ไดโอดบายพาสตัดท่อนทิ้ง)", { v: "+" + sh.elecExtra + " %", cls: "warn" }],
        ["รวมที่เสียจริง", { v: sh.overall + " %", cls: sh.overall >= 5 ? "bad" : "ok" }],
      ]) +
      '<p class="note">วิธีคำนวณ: ยิงลำแสงจากหน้าแผงทุกใบ (' + sh.panels + " ใบ × 5 จุด) ไปหาดวงอาทิตย์ ทุกชั่วโมงตลอด 12 เดือน " +
      "แล้วตรวจว่าชนตัวอาคาร/ผิวหลังคา " + (sh.buildings || 0) + " ชิ้น สิ่งบดบังที่สำรวจไว้ " + sh.obstacles + " ชิ้น หรือแผงที่บังกันเองหรือไม่ " +
      "ถ่วงน้ำหนักด้วยพลังงานลำแสงตรงที่ตกบนระนาบแผงจริง · นับเฉพาะลำแสงตรง แสงฟุ้งจากท้องฟ้ายังเข้าถึงแผงได้</p>" +
      '<p class="note"><b>ทำไมเสียมากกว่าพื้นที่ที่โดนบัง</b> — แผงในสตริงต่ออนุกรมกัน กระแสไหลได้เท่ากับแผงที่แย่ที่สุด ' +
      "แผงจึงมีไดโอดบายพาส (" + (D.sys && D.sys.elec && D.sys.elec.diodes ? D.sys.elec.diodes : 3) + " ตัวต่อแผง) คอยลัดท่อนที่โดนบังทิ้งทั้งท่อน " +
      "เงาแค่แตะมุมแผงเดียวจึงตัดกำลังไปทั้งท่อน ไม่ได้เสียตามสัดส่วนพื้นที่ · " +
      "คิดตามแนวทาง PVsyst แบบ “according to module strings” แล้วปรับด้วยสัดส่วนผลทางไฟฟ้า " +
      (D.sys && D.sys.elec && D.sys.elec.kElec != null ? D.sys.elec.kElec : 80) + "%</p>" +
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
      "<h3>ผลผลิตตลอดอายุ " + L.years + " ปี</h3>" +
      rpTable(["ปี", "ผลผลิต (kWh)", "เหลือ % ของปีแรก"], L.rows.map((r) => [r.year, rpN(r.kwh), r.factor + " %"])) +
      '<p class="note">รวมทั้งหมด ' + rpN(L.total) + " kWh · เฉลี่ยปีละ " + rpN(L.avg) + " kWh · ปีสุดท้ายเหลือ " + L.lastPct + "% ของกำลังเดิม</p>";
  }

  /* 6 · ROI */
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
      '<p class="note">สมมติฐาน: ค่าไฟ ' + R.tariff + " บาท/หน่วย ปรับขึ้นปีละ " + R.escal + "% · ใช้ไฟเอง " + R.selfUse +
      "% ส่วนที่เหลือขายคืนหน่วยละ " + R.exportRate + " บาท · ค่าดูแลรักษาปีละ " + R.om + "% ของค่าติดตั้ง · อัตราคิดลด " + R.discount + "%" +
      (scNum(R.invRepCost) ? " · เผื่อเปลี่ยนอินเวอร์เตอร์ปีที่ " + R.invRepYear + " เป็นเงิน " + rpN(R.invRepCost) + " บาท" : "") + "</p>";
  }

  const warnList = (D.warns || []).length
    ? '<ul class="find">' + D.warns.map((w) => '<li class="warn">' + RP_ESC(w) + "</li>").join("") + "</ul>"
    : '<p class="ok-box">ไม่พบข้อควรแก้ในการออกแบบ</p>';

  return '<!doctype html><html lang="th"><head><meta charset="utf-8">' +
    "<title>รายงานระบบโซลาร์ " + RP_ESC(job.code || "") + "</title>" +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">' +
    "<style>" + RP_CSS + "</style></head><body>" +
    '<header class="cover">' +
      '<div class="brand"><span class="logo">PG</span><div><b>PHITHAN GREEN</b><span>ระบบผลิตไฟฟ้าพลังงานแสงอาทิตย์</span></div></div>' +
      "<h1>รายงานออกแบบระบบ · ผลตรวจวัด · ผลตอบแทนการลงทุน</h1>" +
      '<div class="meta">' +
        "<span><i>ลูกค้า</i>" + RP_ESC(job.name || "—") + "</span>" +
        "<span><i>รหัสงาน</i>" + RP_ESC(job.code || "—") + "</span>" +
        "<span><i>สถานที่ติดตั้ง</i>" + RP_ESC([job.address, job.province].filter(Boolean).join(" ") || "—") + "</span>" +
        "<span><i>วันที่ออกรายงาน</i>" + RP_ESC(today) + "</span>" +
      "</div>" +
      '<div class="kpis">' + kpis + "</div>" +
    "</header>" +
    (D.snapImg ? '<figure class="shot"><img src="' + D.snapImg + '" alt="ผังการติดตั้ง 3 มิติ">' +
      "<figcaption>ผังการติดตั้งจำลอง 3 มิติ — มุมเอียง ทิศทาง และตำแหน่งแผงทุกใบในรายงานนี้อ้างอิงจากโมเดลนี้</figcaption></figure>" : "") +
    sec(1, "อุปกรณ์ที่ใช้", specTbl + "<h3>ผืนหลังคาและทิศทางแผง</h3>" + groupTbl,
      D.totalPanels + " แผง · " + (D.groups || []).length + " กลุ่มทิศทาง") +
    sec(2, D.isMicro ? "การต่อไมโครอินเวอร์เตอร์" : "การต่อสตริงและช่อง MPPT",
      wiring + wiringNote +
      (D.isMicro ? "" : "<h3>ผังแผงมองจากด้านบน (สีเดียวกัน = สตริงเดียวกัน · ทิศเหนืออยู่บน)</h3>" + rpLayout(D.foot, D.assign)) +
      "<h3>ข้อควรแก้</h3>" + warnList) +
    sec(3, "แสง เงา และผลตรวจวัด I-V", ivSec,
      rows.length ? rows.length + " หน่วย · เฉลี่ย " + D.ivAvg + "% ของที่ควรได้"
        : (sim ? "จำลองทั้งวัน · " + rpN(sim.dayKwh, 1) + " kWh" : "")) +
    sec(4, "ผลผลิตที่คาดการณ์", prodSec, L ? rpN(L.rows[0].kwh) + " kWh ในปีแรก" : "") +
    sec(5, "ผลตอบแทนการลงทุน", roiSec, roi && roi.payback ? "คืนทุน " + roi.payback + " ปี" : "") +
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
.cover,.sec,.foot{background:#fff;max-width:820px;margin:0 auto 14px;padding:24px 30px}
.cover{padding-top:30px;border-top:5px solid #22A35B}
.brand{display:flex;align-items:center;gap:11px;margin-bottom:20px}
.logo{width:36px;height:36px;border-radius:9px;background:#22A35B;color:#fff;display:grid;place-items:center;font-weight:700;font-size:14px;letter-spacing:.04em}
.brand b{display:block;font-size:14px;font-weight:700;letter-spacing:.01em}
.brand span{display:block;font-size:10px;color:#7A8781}
h1{font-size:21px;font-weight:700;letter-spacing:-.2px;line-height:1.35;margin-bottom:16px}
.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:13px 0;border-top:1px solid #E3E8E6;border-bottom:1px solid #E3E8E6;margin-bottom:16px}
.meta span{display:flex;flex-direction:column;gap:2px;font-size:11.5px;font-weight:600}
.meta i{font-style:normal;font-size:9px;font-weight:600;color:#8A968F;letter-spacing:.08em;text-transform:uppercase}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.kpi{border:1px solid #E3E8E6;border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:2px}
.kpi.hi{background:#F0F9F4;border-color:#BFE3CE}
.kpi .k{font-size:9.5px;font-weight:600;color:#7A8781}
.kpi .v{font-size:17px;font-weight:700;letter-spacing:-.3px}
.kpi .v small{font-size:9.5px;font-weight:600;color:#8A968F;margin-left:3px}
.shot{background:#fff;max-width:820px;margin:0 auto 14px;padding:18px 30px 20px}
.shot img{width:100%;max-height:330px;object-fit:contain;display:block;border:1px solid #E3E8E6;border-radius:10px;background:#F4F6F5}
.shot figcaption{font-size:9.5px;color:#6C7A74;margin-top:8px;text-align:center}
/* ตัดหน้าให้สวยตอนพิมพ์: ห้ามหัวข้ออยู่ท้ายหน้าโดด ๆ · ห้ามแถวตารางถูกผ่ากลาง · หัวตารางซ้ำทุกหน้า */
h2,h3{break-after:avoid;page-break-after:avoid}
.kpis,.ivbox,.two,.note,.ok-box,ul.find li,.shot{break-inside:avoid;page-break-inside:avoid}
table.t tr{break-inside:avoid;page-break-inside:avoid}
table.t thead{display:table-header-group}
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
table.strip{width:100%;border-collapse:collapse;font-size:9.5px;margin-bottom:2px}
table.strip td{padding:2px 6px 2px 0;vertical-align:middle}
table.strip td:first-child{width:150px;color:#3A4A43;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bar{display:flex;height:12px;border-radius:4px;overflow:hidden}
.bar i{flex:1;display:block}
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
  .cover,.sec,.foot,.shot{max-width:none;margin:0;padding:0 0 12px;page-break-after:auto}
  .shot img{max-height:250px}
  .sec{padding-top:12px}
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
  /* รอให้ฟอนต์/กราฟวาดเสร็จก่อนค่อยเรียกกล่องพิมพ์ ไม่งั้นตัวอักษรไทยจะเลื่อน */
  const go = () => { try { w.focus(); w.print(); } catch (e) {} };
  if (w.document.fonts && w.document.fonts.ready) w.document.fonts.ready.then(() => setTimeout(go, 250));
  else setTimeout(go, 700);
  return w;
}

Object.assign(window, { suReportHTML, suPrintReport, rpTable, rpMonthly, rpCash, rpIv, RP_CSS });
