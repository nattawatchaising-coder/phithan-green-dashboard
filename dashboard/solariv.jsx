/* ============================================================
   PHITHAN GREEN — I-V Curve · ชดเชยสภาพอากาศ · ROI
   ------------------------------------------------------------
   ต่อยอดจาก solarcalc.jsx (ใช้ scSunPos / scDiffuseFrac / สเปคแผงชุดเดียวกัน)
   ไฟล์นี้ตอบ 3 คำถามที่หน้างานถามจริง:
     1) เส้น I-V ที่ "ควรจะเป็น" ของสตริงนี้ ณ สภาพอากาศตอนวัด เป็นยังไง
     2) ที่วัดมาได้จริง เทียบกับที่ควรได้ ขาดไปเพราะอะไร (เงา/ฝุ่น/หน้าสัมผัส/แผงเสีย)
     3) ระบบนี้คืนทุนกี่ปี คุ้มไหม

   ทุกฟังก์ชันเป็น pure — ไม่แตะ DOM/state ทดสอบแยกได้
   ============================================================ */
const IV_Q = 1.602176634e-19;     // ประจุอิเล็กตรอน (C)
const IV_K = 1.380649e-23;        // ค่าคงที่โบลต์ซมันน์ (J/K)
const IV_T0 = 298.15;             // 25 °C ในหน่วยเคลวิน

/* ค่ากลางที่ดาต้าชีตมีแต่คลังสินค้ายังไม่ได้เก็บ */
const IV_PANEL_EXTRA = { tcIsc: 0.045 };   // %/°C — Isc เพิ่มตามอุณหภูมิ (บวก ต่างจาก Voc/Pmax)

/* ── ความร้อนสะสมหลังแผง (โมเดล Sandia) ──
   แผงที่ยึดชิดหลังคาระบายความร้อนไม่ออก จะร้อนกว่าอากาศได้ถึง 30 °C ตอนเที่ยง
   ส่วนแบบยกสูงมีลมผ่านหลังแผง ร้อนกว่าอากาศราว 20 °C
   Tหลังแผง = G·exp(a + b·ลม) + Tอากาศ   ·   Tเซลล์ = Tหลังแผง + G/1000·dT */
/* ตารางเดียวกับที่ตัวคิดผลผลิตรายปีใช้ (solarcalc) — อุณหภูมิเซลล์ต้องมาจากสูตรเดียวกันทั้งระบบ
   ไม่งั้นตัวเลขบนหน้าจอกับในรายงานจะขัดกันเอง */
const IV_MOUNT = window.SC_MOUNT || {
  close:  { a: -2.98, b: -0.0471, dT: 1, label: "ยึดชิดหลังคา", note: "ระบายอากาศหลังแผงได้น้อย ความร้อนสะสมสูงสุด" },
  rack:   { a: -3.56, b: -0.0750, dT: 3, label: "ยกสูงจากหลังคา", note: "มีช่องลมผ่านหลังแผง ระบายความร้อนได้ดีกว่า" },
  ground: { a: -3.58, b: -0.1130, dT: 3, label: "ขาตั้งบนพื้น/โล่ง", note: "ลมผ่านได้รอบตัว เย็นที่สุด" },
};

/* ── จำนวนเซลล์อนุกรมในแผง — ดาต้าชีตไม่ค่อยระบุตรง ๆ เดาจาก Voc ──
   เซลล์ซิลิคอนสมัยใหม่ Voc ต่อเซลล์ ≈ 0.74–0.76 V (แผง half-cut นับเฉพาะที่ต่ออนุกรม) */
function ivCells(panel) {
  const c = scNum(panel && panel.cells);
  if (c >= 12) return Math.round(c);
  return Math.max(12, Math.round(scNum(panel && panel.voc, 40) / 0.75));
}

const ivExp = (x) => Math.exp(Math.min(500, x));

/* ── แก้สมการไดโอดหาค่ากระแสที่แรงดันหนึ่ง (นิวตัน–ราฟสัน) ──
   I = Iph − I0·(e^((V+I·Rs)/aVt) − 1) − (V+I·Rs)/Rsh */
function ivSolveI(p, V, seed) {
  let I = seed == null ? p.Iph : seed;
  for (let k = 0; k < 60; k++) {
    const e = ivExp((V + I * p.Rs) / p.aVt);
    const f = p.Iph - p.I0 * (e - 1) - (V + I * p.Rs) / p.Rsh - I;
    const df = -p.I0 * e * p.Rs / p.aVt - p.Rs / p.Rsh - 1;
    if (!isFinite(df) || df === 0) break;
    const d = f / df;
    I -= d;
    if (!isFinite(I)) return 0;
    if (Math.abs(d) < 1e-10) break;
  }
  return I;
}

/* แรงดันวงจรเปิด (I = 0) */
function ivVocOf(p) {
  let V = p.aVt * Math.log(Math.max(1e-12, p.Iph / p.I0 + 1));
  for (let k = 0; k < 60; k++) {
    const e = ivExp(V / p.aVt);
    const f = p.Iph - p.I0 * (e - 1) - V / p.Rsh;
    const df = -p.I0 * e / p.aVt - 1 / p.Rsh;
    const d = f / df;
    V -= d;
    if (!isFinite(V)) return 0;
    if (Math.abs(d) < 1e-9) break;
  }
  return Math.max(0, V);
}

/* จุดจ่ายกำลังสูงสุด — กวาดหยาบแล้วค่อยละเอียดรอบจุดที่ดีที่สุด */
function ivMppOf(p, Voc) {
  let bV = 0, bI = 0, bP = -1, seed = p.Iph;
  const scan = (lo, hi, n) => {
    for (let i = 0; i <= n; i++) {
      const V = lo + (hi - lo) * i / n;
      const I = ivSolveI(p, V, seed);
      seed = I;
      const P = V * I;
      if (P > bP) { bP = P; bV = V; bI = I; }
    }
  };
  scan(Voc * 0.55, Voc * 0.99, 45);
  const w = Voc * 0.01;
  scan(Math.max(0, bV - w), bV + w, 20);
  return { vmp: bV, imp: bI, pmax: bP };
}

/* ── ถอดพารามิเตอร์ไดโอดจากตัวเลข 4 ตัวในดาต้าชีต (วิธี Villalva) ──
   ไล่หา Rs ที่ทำให้กำลังสูงสุดของโมเดล = Vmp×Imp ในดาต้าชีตพอดี
   คืน { Iph, I0, Rs, Rsh, a, Ns } — a คือค่าอุดมคติของไดโอด (คุมความ "ป้าน" ของหัวเข่า) */
function ivExtract(panel) {
  const Isc = scNum(panel.isc), Voc = scNum(panel.voc), Vmp = scNum(panel.vmp), Imp = scNum(panel.imp);
  if (!(Isc > 0 && Voc > 0 && Vmp > 0 && Imp > 0 && Vmp < Voc && Imp < Isc)) return null;
  const Ns = ivCells(panel), Pm = Vmp * Imp;
  const a0 = 1.15;
  const aVt = a0 * Ns * IV_K * IV_T0 / IV_Q;
  const I0 = Isc / (ivExp(Voc / aVt) - 1);
  /* Rsh คำนวณย้อนจากเงื่อนไข "โมเดลต้องผ่านจุด (Vmp, Imp)" — สูตรของ Villalva */
  const build = (Rs) => {
    const den = Vmp * Isc - Vmp * I0 * ivExp((Vmp + Imp * Rs) / aVt) + Vmp * I0 - Pm;
    const Rsh = Vmp * (Vmp + Imp * Rs) / den;
    if (!(Rsh > 0) || !isFinite(Rsh)) return null;
    const Iph = (Rsh + Rs) / Rsh * Isc;
    return { Iph, I0, Rs, Rsh, aVt, a: a0, Ns };
  };
  /* Pmax ของโมเดลลดลงเมื่อ Rs โต → ใช้แบ่งครึ่งช่วงหาได้ */
  let lo = 0, hi = 1.2, ans = build(0);
  for (let it = 0; it < 42; it++) {
    const mid = (lo + hi) / 2;
    const p = build(mid);
    if (!p) { hi = mid; continue; }
    const v = ivMppOf(p, ivVocOf(p));
    if (v.pmax > Pm) { lo = mid; ans = p; } else { hi = mid; ans = p; }
    if (Math.abs(v.pmax - Pm) / Pm < 1e-5) { ans = p; break; }
  }
  return ans;
}

/* ── ย้ายพารามิเตอร์ไปที่สภาพอากาศอื่น (ความเข้มแสง G, อุณหภูมิเซลล์ Tc) ──
   ka = ตัวคูณค่าอุดมคติ ใช้ตอนปรับให้ Fill Factor ตรงกับสัมประสิทธิ์อุณหภูมิในดาต้าชีต */
function ivAt(par, panel, G, Tc, ka) {
  const g = Math.max(1, scNum(G, 1000)) / 1000, dT = scNum(Tc, 25) - 25;
  const Ki = scNum(panel.tcIsc, IV_PANEL_EXTRA.tcIsc) / 100 * scNum(panel.isc);   // A/°C
  const Kv = scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc) / 100 * scNum(panel.voc);   // V/°C
  const aVt = (par.a * (ka || 1)) * par.Ns * IV_K * (scNum(Tc, 25) + 273.15) / IV_Q;
  const I0 = (scNum(panel.isc) + Ki * dT) / (ivExp((scNum(panel.voc) + Kv * dT) / aVt) - 1);
  return { Iph: (par.Iph + Ki * dT) * g, I0, Rs: par.Rs, Rsh: par.Rsh / g, aVt, a: par.a * (ka || 1), Ns: par.Ns };
}

/* ── เส้น I-V ของ "1 แผง" ที่สภาพอากาศหนึ่ง ──
   จุดยึด 3 จุด (Isc, Voc, Pmax) มาจากสมการแปลงค่าดาต้าชีตตรง ๆ — ตรวจสอบย้อนได้
   ส่วน "รูปทรง" ของเส้นมาจากโมเดลไดโอด แล้วปรับค่าอุดมคติจน Fill Factor ตรงกัน
   ทำแบบนี้เพื่อให้ตัวเลขบนกราฟกับตัวเลขที่ใช้คำนวณผลผลิตเป็นชุดเดียวกันเสมอ */
function ivModule(par, panel, G, Tc) {
  const g = Math.max(1, scNum(G, 1000)) / 1000, dT = scNum(Tc, 25) - 25;
  const nVt = par.a * par.Ns * IV_K * (scNum(Tc, 25) + 273.15) / IV_Q;
  const IscT = scNum(panel.isc) * g * (1 + scNum(panel.tcIsc, IV_PANEL_EXTRA.tcIsc) / 100 * dT);
  /* Voc ตกตามลอการิทึมของความเข้มแสงด้วย ไม่ใช่ตกตามอุณหภูมิอย่างเดียว */
  const VocT = Math.max(1, scNum(panel.voc) * (1 + scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc) / 100 * dT) + nVt * Math.log(g));
  const PmaxT = scNum(panel.wp) * g * (1 + scNum(panel.tcPmax, SC_PANEL_EXTRA.tcPmax) / 100 * dT);
  const ffT = PmaxT / (VocT * IscT);
  /* หา ka ที่ทำให้ Fill Factor ของโมเดลเท่ากับเป้า (a มาก = เข่าป้าน = FF ต่ำ) */
  let lo = 0.45, hi = 2.6, best = null;
  for (let it = 0; it < 26; it++) {
    const mid = (lo + hi) / 2;
    const p = ivAt(par, panel, G, Tc, mid);
    const voc = ivVocOf(p), isc = ivSolveI(p, 0, p.Iph), m = ivMppOf(p, voc);
    const ff = voc * isc > 0 ? m.pmax / (voc * isc) : 0;
    best = { p, voc, isc, m, ff };
    if (ff > ffT) lo = mid; else hi = mid;
    if (Math.abs(ff - ffT) < 1e-5) break;
  }
  if (!best) return null;
  /* ยืด/หดแกนให้ผ่านจุดยึดทั้งสาม */
  const kV = VocT / (best.voc || 1), kI = IscT / (best.isc || 1);
  const pts = [];
  let seed = best.p.Iph;
  const N = 90;
  for (let i = 0; i <= N; i++) {
    /* ถี่ตรงหัวเข่า (ช่วงท้าย) เพราะเป็นที่ที่รูปทรงเปลี่ยนเร็วที่สุด */
    const t = i / N, V = best.voc * (1 - Math.pow(1 - t, 1.7));
    const I = Math.max(0, ivSolveI(best.p, V, seed));
    seed = I;
    pts.push({ v: scR(V * kV, 3), i: scR(I * kI, 4), p: scR(V * kV * I * kI, 2) });
  }
  return { pts, isc: IscT, voc: VocT, vmp: best.m.vmp * kV, imp: best.m.imp * kI, pmax: PmaxT,
    ff: ffT, g: scNum(G, 1000), tc: scNum(Tc, 25) };
}

/* ── ชุดเส้น I-V / P-V หลายเส้นในกราฟเดียว ──
   โหมด "แสง"    = ตรึงอุณหภูมิเซลล์ไว้ แล้วไล่ความเข้มแสง — เห็นว่ากระแสแปรตามแสงเกือบเป็นเส้นตรง
   โหมด "ร้อน"   = ตรึงความเข้มแสงไว้ แล้วไล่อุณหภูมิ — เห็นว่าแรงดันคือตัวที่ความร้อนกิน
   นี่คือกราฟคู่มาตรฐานบนดาต้าชีตแผงทุกรุ่น เอาไว้เทียบว่าแผงที่หน้างานยังตรงสเปคอยู่ไหม */
const IV_GLEVELS = [1000, 800, 600, 400, 200];
const IV_TLEVELS = [25, 40, 55, 70];
function ivFamily(par, panel, o) {
  o = o || {};
  if (!par || !panel || !panel.voc) return [];
  const ns = Math.max(1, Math.round(scNum(o.nSeries, 1))), np = Math.max(1, Math.round(scNum(o.nPar, 1)));
  const kD = o.derate == null ? 1 : o.derate;
  const temp = o.mode === "temp";
  const list = temp
    ? (o.temps || IV_TLEVELS).map((t) => ({ g: scNum(o.g, 1000), tc: t }))
    : (o.levels || IV_GLEVELS).map((g) => ({ g, tc: scNum(o.tc, 25) }));
  return list.map((c) => {
    const s = ivString(par, panel, c.g, c.tc, ns, np, kD);
    if (!s) return null;
    return Object.assign(s, { key: temp ? "t" + c.tc : "g" + c.g,
      label: temp ? scR(c.tc, 0) + " °C" : c.g + " W/m²" });
  }).filter(Boolean);
}

/* เส้น I-V ของทั้งสตริง = แรงดันคูณจำนวนแผงอนุกรม · กระแสคูณจำนวนสตริงขนาน */
function ivString(par, panel, G, Tc, nSeries, nPar, derate) {
  const m = ivModule(par, panel, G, Tc);
  if (!m) return null;
  const ns = Math.max(1, Math.round(nSeries || 1)), np = Math.max(1, Math.round(nPar || 1));
  const kD = derate == null ? 1 : derate;                 // เผื่อค่าเสื่อมตามอายุ
  return {
    nSeries: ns, nPar: np, g: m.g, tc: m.tc,
    pts: m.pts.map((q) => ({ v: scR(q.v * ns, 2), i: scR(q.i * np * kD, 3), p: scR(q.p * ns * np * kD, 1) })),
    isc: scR(m.isc * np * kD, 2), voc: scR(m.voc * ns, 1),
    vmp: scR(m.vmp * ns, 1), imp: scR(m.imp * np * kD, 2),
    pmax: scR(m.pmax * ns * np * kD, 1), ff: scR(m.ff * 100, 1),
  };
}

/* ============================================================
   ชดเชยสภาพอากาศ — จากวัน/เวลา/พิกัด/มุมหลังคา → แสงที่ตกบนหน้าแผงจริง
   ============================================================ */
/* มุมตกกระทบยิ่งเฉียง แสงยิ่งสะท้อนออกจากกระจกหน้าแผง (ASHRAE incidence angle modifier) */
function ivIam(cosAoi, b0) {
  if (cosAoi <= 0.02) return 0;
  return Math.max(0, 1 - scNum(b0, 0.05) * (1 / cosAoi - 1));
}

function ivDayOfYear(dateStr) {
  const d = dateStr ? new Date(dateStr + "T12:00:00") : new Date();
  if (isNaN(d.getTime())) return 180;
  return Math.round((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

/* ── ปริมาณแสงบนหน้าแผง ณ วัน/เวลา/มุมเอียงหนึ่ง ──
   o = { lat, lng, date, hour, tilt, az, ghi (วัดได้จริง ถ้ามี), albedo, shade (%) }
   ถ้าไม่ได้วัด GHI ระบบใช้แบบจำลองท้องฟ้าใส × สัดส่วนเมฆรายเดือนแทน แล้วบอกไว้ว่าเป็นค่าประมาณ */
function ivIrradiance(o) {
  o = o || {};
  const doy = ivDayOfYear(o.date), hour = scNum(o.hour, 12);
  const mIdx = Math.max(0, Math.min(11, new Date((o.date || "2026-01-01") + "T12:00:00").getMonth() || 0));
  const sun = scSunPos(o.lat, o.lng, doy, hour);
  const sa = Math.sin(sun.alt * SC_DEG);
  if (sun.alt <= 1) {
    return { sun, alt: scR(sun.alt, 1), az: scR(sun.az, 1), ghi: 0, dni: 0, dhi: 0, poa: 0,
      beam: 0, diff: 0, refl: 0, aoi: 90, cosAoi: 0, iam: 0, kt: 0, poaNet: 0, shadeLoss: 0,
      measured: false, night: true };
  }
  const ghiClear = 1098 * sa * ivExp(-0.057 / sa);
  const measured = scNum(o.ghi) > 0;
  const ghi = measured ? scNum(o.ghi) : ghiClear * SC_KC[mIdx];
  const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * doy / 365)) * sa;
  const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
  const dhi = ghi * scDiffuseFrac(kt);
  const dni = Math.max(0, (ghi - dhi) / sa);
  const bT = scNum(o.tilt, 0) * SC_DEG, cosB = Math.cos(bT), sinB = Math.sin(bT);
  const cosAoi = Math.max(0, cosB * sa + sinB * Math.cos(sun.alt * SC_DEG) * Math.cos((sun.az - scNum(o.az, 180)) * SC_DEG));
  const iam = ivIam(cosAoi, o.b0);
  const beam = dni * cosAoi * iam;                            // ลำแสงตรง (หักการสะท้อนที่ผิวกระจก)
  const diff = dhi * (1 + cosB) / 2;                          // แสงฟุ้งจากท้องฟ้า
  const refl = ghi * scNum(o.albedo, SC_ENV.albedo) * (1 - cosB) / 2;   // แสงสะท้อนจากพื้น
  const poa = beam + diff + refl;
  const shade = scClamp(scNum(o.shade, 0) / 100, 0, 1);
  /* เงาบังลำแสงตรงเป็นหลัก แสงฟุ้ง/สะท้อนยังเข้าได้บางส่วน → หักแบบถ่วงน้ำหนัก */
  const poaNet = Math.max(0, poa - shade * (beam + diff * 0.35));
  return {
    sun, alt: scR(sun.alt, 1), az: scR(sun.az, 1), doy, month: mIdx,
    ghi: scR(ghi, 0), ghiClear: scR(ghiClear, 0), dni: scR(dni, 0), dhi: scR(dhi, 0), kt: scR(kt, 2),
    aoi: scR(Math.acos(scClamp(cosAoi, 0, 1)) / SC_DEG, 1), cosAoi: scR(cosAoi, 3), iam: scR(iam, 3),
    beam: scR(beam, 0), diff: scR(diff, 0), refl: scR(refl, 0),
    poa: scR(poa, 0), poaNet: scR(poaNet, 0), shadeLoss: scR(poa - poaNet, 0),
    tiltGain: ghi > 0 ? scR(poa / ghi, 3) : 0, measured, night: false,
  };
}

/* ── อุณหภูมิหน้าแผง ──
   คืนทั้งอุณหภูมิหลังแผงและอุณหภูมิเซลล์ พร้อม "ร้อนกว่าอากาศกี่องศา" ให้เห็นตรง ๆ */
function ivCellTemp(poa, tAmb, wind, mount) {
  const M = IV_MOUNT[mount] || IV_MOUNT.close;
  const G = Math.max(0, scNum(poa, 0)), Ta = scNum(tAmb, 32), ws = Math.max(0, scNum(wind, 1));
  const tBack = G * Math.exp(M.a + M.b * ws) + Ta;
  const tCell = tBack + G / 1000 * M.dT;
  return { tBack: scR(tBack, 1), tCell: scR(tCell, 1), rise: scR(tCell - Ta, 1),
    tAmb: scR(Ta, 1), wind: ws, mount: M, label: M.label };
}

/* ── ค่าที่ "ควรจะวัดได้" ณ สภาพอากาศตอนนั้น (รวมค่าเสื่อมตามอายุระบบ) ── */
function ivExpect(panel, par, cond, nSeries, nPar, ageYears) {
  const yr = Math.max(0, scNum(ageYears, 0));
  const d1 = scNum(panel.deg1, SC_PANEL_EXTRA.deg1) / 100, dy = scNum(panel.degY, SC_PANEL_EXTRA.degY) / 100;
  const derate = yr <= 0 ? 1 : (1 - d1) * Math.pow(1 - dy, Math.max(0, yr - 1));
  const s = ivString(par, panel, cond.g, cond.tc, nSeries, nPar, derate);
  if (s) { s.derate = scR(derate * 100, 1); s.ageYears = yr; }
  return s;
}

/* ── แปลงค่าที่วัดได้ → สภาวะมาตรฐาน STC (1000 W/m², เซลล์ 25 °C) ──
   ทำให้เทียบกับดาต้าชีตได้ตรง ๆ ไม่ว่าจะไปวัดตอนแดดเท่าไหร่
     Isc,stc  = Isc,วัด × (1000/G) ÷ (1 + αIsc·ΔT)
     Voc,stc  = (Voc,วัด − n·Ns·Vt·ln(G/1000)) ÷ (1 + βVoc·ΔT)
     Pmax,stc = Pmax,วัด × (1000/G) ÷ (1 + γPmax·ΔT)
   (แนวเดียวกับ IEC 60891 วิธีที่ 1 · ΔT = อุณหภูมิเซลล์ตอนวัด − 25) */
function ivToStc(meas, panel, par, nSeries) {
  const G = scNum(meas.g), Tc = scNum(meas.tmod, 25), dT = Tc - 25;
  if (!(G > 0)) return null;
  const kG = 1000 / G, ns = Math.max(1, Math.round(nSeries || 1));
  const fI = 1 + scNum(panel.tcIsc, IV_PANEL_EXTRA.tcIsc) / 100 * dT;
  const fV = 1 + scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc) / 100 * dT;
  const fP = 1 + scNum(panel.tcPmax, SC_PANEL_EXTRA.tcPmax) / 100 * dT;
  const nVt = par ? par.a * par.Ns * IV_K * (Tc + 273.15) / IV_Q * ns : 0;
  const isc = scNum(meas.isc), voc = scNum(meas.voc), vmp = scNum(meas.vmp), imp = scNum(meas.imp);
  const pm = scNum(meas.pmax) || (vmp * imp);
  const out = {};
  if (isc) out.isc = scR(isc * kG / fI, 2);
  if (voc) out.voc = scR((voc - nVt * Math.log(G / 1000)) / fV, 1);
  if (pm) out.pmax = scR(pm * kG / fP, 1);
  if (vmp) out.vmp = scR((vmp - nVt * Math.log(G / 1000)) / fV, 1);
  if (imp) out.imp = scR(imp * kG / fI, 2);
  if (out.voc && out.isc && out.pmax) out.ff = scR(out.pmax / (out.voc * out.isc) * 100, 1);
  out.dT = scR(dT, 1); out.kG = scR(kG, 3);
  return out;
}

/* ── วินิจฉัยจากอัตราส่วนที่ได้เทียบกับที่ควรได้ ──
   หลักการอ่านเส้น I-V: กระแสตกทั้งเส้น = แสงหาย (เงา/ฝุ่น)
                        แรงดันตกเป็นชั้น  = แผง/ไดโอดบายพาสมีปัญหา
                        เข่าเส้นโค้งกลม   = ความต้านทานอนุกรมสูง (หน้าสัมผัส/สายเล็ก) */
function ivDiagnose(stc, exp, panel, nSeries) {
  const F = [];
  if (!stc || !exp) return F;
  const ns = Math.max(1, Math.round(nSeries || 1));
  const rP = exp.pmax ? stc.pmax / exp.pmax : 0;
  const rV = exp.voc && stc.voc ? stc.voc / exp.voc : 0;
  const rI = exp.isc && stc.isc ? stc.isc / exp.isc : 0;
  const ffE = exp.ff || 0, ffM = stc.ff || 0;
  const rF = ffE && ffM ? ffM / ffE : 0;
  const pct = (r) => scR((r - 1) * 100, 1);

  if (rV && rV < 0.97) {
    const vMod = scNum(panel.voc) || 1;
    const miss = Math.round((exp.voc - stc.voc) / (exp.voc / ns));
    F.push({ k: "voc", sev: rV < 0.9 ? "bad" : "warn",
      t: "แรงดันวงจรเปิดต่ำกว่าที่ควรได้ " + Math.abs(pct(rV)) + "%",
      why: miss >= 1
        ? "หายไปประมาณ " + miss + " แผง (" + scR(miss * vMod, 0) + " V) — เท่ากับมีแผงหลุดวงจร ต่อขาดไป หรือไดโอดบายพาสลัดวงจรอยู่"
        : "อาจนับจำนวนแผงในสตริงคลาดเคลื่อน หรือมีจุดต่อหลวมบางจุด",
      do: "ไล่วัดแรงดันทีละแผงจากหัวสตริง หาจุดที่แรงดันหายไป" });
  } else if (rV > 1.03) {
    F.push({ k: "voc", sev: "warn", t: "แรงดันวงจรเปิดสูงกว่าที่ควรได้ " + pct(rV) + "%",
      why: "จำนวนแผงในสตริงจริงอาจมากกว่าที่บันทึกไว้ หรืออุณหภูมิแผงที่กรอกสูงเกินจริง",
      do: "นับจำนวนแผงในสตริงซ้ำ และวัดอุณหภูมิหลังแผงด้วยเทอร์โมมิเตอร์อินฟราเรด" });
  }

  if (rI && rI < 0.95) {
    F.push({ k: "isc", sev: rI < 0.85 ? "bad" : "warn",
      t: "กระแสลัดวงจรต่ำกว่าที่ควรได้ " + Math.abs(pct(rI)) + "%",
      why: "กระแสตกทั้งเส้นแปลว่าแสงที่เข้าถึงเซลล์น้อยลง — เงาบัง ฝุ่น/คราบบนกระจก หรือค่าความเข้มแสงที่วัดสูงกว่าที่แผงได้จริง",
      do: "ดูเงาที่หน้างานเวลาวัด · เช็ดหน้าแผงแล้ววัดซ้ำ · วาง pyranometer ให้เอียงเท่าแผงจริง ไม่ใช่วางราบ" });
  }

  if (rF && rF < 0.95) {
    F.push({ k: "ff", sev: rF < 0.88 ? "bad" : "warn",
      t: "Fill Factor ต่ำกว่าที่ควรได้ " + Math.abs(pct(rF)) + "% (เข่าเส้นโค้งกลม)",
      why: "ความต้านทานอนุกรมสูงผิดปกติ — หัวต่อ MC4 ไม่แน่น/ออกไซด์ สายยาวเกินหรือเล็กเกิน หรือแผงในสตริงกำลังไม่เท่ากัน",
      do: "ไล่จับอุณหภูมิหัวต่อด้วยกล้องความร้อนตอนแดดจัด · ขันย้ำหัว MC4 ใหม่ · ทวนขนาดสาย DC เทียบระยะจริง" });
  }

  if (rP) {
    if (rP >= 0.95) F.push({ k: "ok", sev: "good", t: "กำลังที่วัดได้ " + scR(rP * 100, 1) + "% ของที่ควรได้",
      why: "อยู่ในเกณฑ์ปกติของการตรวจรับงาน (ทั่วไปยอมรับที่ ≥ 95% หลังชดเชยสภาพอากาศแล้ว)", do: "" });
    else F.push({ k: "pmax", sev: rP < 0.85 ? "bad" : "warn",
      t: "กำลังที่วัดได้เหลือ " + scR(rP * 100, 1) + "% ของที่ควรได้",
      why: "ขาดไป " + scR((exp.pmax - stc.pmax), 0) + " W จากที่ควรได้ " + scR(exp.pmax, 0) + " W",
      do: rV < 0.97 ? "แก้เรื่องแรงดันก่อน แล้ววัดซ้ำ" : rI < 0.95 ? "แก้เรื่องเงา/ความสะอาดก่อน แล้ววัดซ้ำ" : "ตรวจหัวต่อและสายในสตริงนี้" });
  }
  return F;
}

/* ตรวจ 1 สตริงครบวงจร: สภาพอากาศ → ที่ควรได้ → แปลงค่าที่วัดกลับเป็น STC → วินิจฉัย */
function ivAssess(o) {
  const panel = o.panel, par = o.par, meas = o.meas || {};
  if (!par) return null;
  const irr = o.irr;
  const gUsed = scNum(meas.g) || (irr ? irr.poaNet : 1000);
  const tUsed = meas.tmod != null && meas.tmod !== "" ? scNum(meas.tmod) : (o.temp ? o.temp.tCell : 45);
  const cond = { g: gUsed, tc: tUsed };
  const exp = ivExpect(panel, par, cond, o.nSeries, o.nPar, o.ageYears);
  const expStc = ivExpect(panel, par, { g: 1000, tc: 25 }, o.nSeries, o.nPar, o.ageYears);
  const has = scNum(meas.voc) > 0 || scNum(meas.isc) > 0 || scNum(meas.pmax) > 0;
  const stc = has ? ivToStc(Object.assign({}, meas, { g: gUsed, tmod: tUsed }), panel, par, o.nSeries) : null;
  const findings = stc ? ivDiagnose(stc, expStc, panel, o.nSeries) : [];
  const ratio = stc && expStc && expStc.pmax ? scR(stc.pmax / expStc.pmax * 100, 1) : null;
  return { cond, exp, expStc, stc, findings, ratio, hasMeas: has,
    gSource: scNum(meas.g) > 0 ? "meas" : "model", tSource: meas.tmod != null && meas.tmod !== "" ? "meas" : "model" };
}

/* ============================================================
   เงาบังจริงจากโมเดล 3 มิติ
   ------------------------------------------------------------
   ยิงลำแสงจากหน้าแผงไปหาดวงอาทิตย์ ถ้าชนอะไรระหว่างทาง = จุดนั้นโดนบัง
   ตัวบดบังที่นับ: สิ่งบดบังที่วางไว้ในผัง (ตึก/ถังน้ำ = กล่อง · ต้นไม้ = ทรงกลม)
                   และ "แผงด้วยกันเอง" — แถวหน้าบังแถวหลังตอนแดดเอียง
   ไม่นับตัวหลังคาเป็นก้อนทึบ เพราะจะบังแผงของตัวเองผิด ๆ
   (ถ้ามีอาคารข้างเคียงบัง ให้วางเป็น "สิ่งบดบัง" ในโหมด 3 มิติ ระบบจะคิดให้ครบ)
   ============================================================ */
const ivDot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

/* ลำแสงชนทรงกลมไหม (ต้นไม้) */
function ivHitSphere(o, d, c, r) {
  const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
  const b = ox * d.x + oy * d.y + oz * d.z;
  const cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - cc;
  if (disc < 0) return false;
  return -b + Math.sqrt(disc) > 1e-3;
}
/* ลำแสงชนกล่องไหม (ตึก/ถังน้ำ) — วิธีแบ่งช่วงตามแกน */
function ivHitBox(o, d, lo, hi) {
  let tmin = 1e-3, tmax = 1e9;
  const ax = ["x", "y", "z"];
  for (let i = 0; i < 3; i++) {
    const k = ax[i];
    if (Math.abs(d[k]) < 1e-9) { if (o[k] < lo[k] || o[k] > hi[k]) return false; continue; }
    let t1 = (lo[k] - o[k]) / d[k], t2 = (hi[k] - o[k]) / d[k];
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    if (t1 > tmin) tmin = t1;
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return false;
  }
  return true;
}
/* ลำแสงชนแผ่นสี่เหลี่ยม (แผงอีกใบ) ไหม */
function ivHitQuad(o, d, q) {
  const dn = ivDot(d, q.n);
  if (Math.abs(dn) < 1e-9) return false;
  const t = ((q.c.x - o.x) * q.n.x + (q.c.y - o.y) * q.n.y + (q.c.z - o.z) * q.n.z) / dn;
  if (t < 1e-3) return false;
  const px = o.x + d.x * t - q.c.x, py = o.y + d.y * t - q.c.y, pz = o.z + d.z * t - q.c.z;
  const au = (px * q.u.x + py * q.u.y + pz * q.u.z) / q.uu;
  if (au < -1 || au > 1) return false;
  const av = (px * q.v.x + py * q.v.y + pz * q.v.z) / q.vv;
  return av >= -1 && av <= 1;
}

/* ลำแสงชนสามเหลี่ยมไหม (ผิวหลังคา — ซอยเป็นสามเหลี่ยม) — Möller–Trumbore */
function ivHitTri(o, d, a, e1, e2) {
  const px = d.y * e2.z - d.z * e2.y, py = d.z * e2.x - d.x * e2.z, pz = d.x * e2.y - d.y * e2.x;
  const det = e1.x * px + e1.y * py + e1.z * pz;
  if (det > -1e-9 && det < 1e-9) return false;
  const inv = 1 / det;
  const tx = o.x - a.x, ty = o.y - a.y, tz = o.z - a.z;
  const u = (tx * px + ty * py + tz * pz) * inv;
  if (u < 0 || u > 1) return false;
  const qx = ty * e1.z - tz * e1.y, qy = tz * e1.x - tx * e1.z, qz = tx * e1.y - ty * e1.x;
  const v = (d.x * qx + d.y * qy + d.z * qz) * inv;
  if (v < 0 || u + v > 1) return false;
  return (e2.x * qx + e2.y * qy + e2.z * qz) * inv > 1e-3;
}
/* จุดอยู่ในรูปหลายเหลี่ยม (มองจากบน) ไหม */
function ivInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
/* กรอบนอกนูน (convex hull) ของกลุ่มจุดมองจากบน — ใช้ทำหน้าตัดก้อนตึก */
function ivHull2D(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (arr) => {
    const h = [];
    for (let i = 0; i < arr.length; i++) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], arr[i]) <= 0) h.pop();
      h.push(arr[i]);
    }
    h.pop();
    return h;
  };
  return half(p).concat(half(p.slice().reverse()));
}
const ivSegHit = (a, b, c, d) => {
  const s = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = s(c, d, a), d2 = s(c, d, b), d3 = s(a, b, c), d4 = s(a, b, d);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
};
/* ลำแสงชน "ก้อนตัวอาคาร" ไหม — แท่งตั้งฉากพื้น หน้าตัดเป็นรูปหลายเหลี่ยม สูง 0..top */
function ivHitWall(o, d, poly, top) {
  let t0 = 1e-3, t1 = 400;
  if (Math.abs(d.y) < 1e-9) { if (o.y < 0 || o.y > top) return false; }
  else {
    let a = -o.y / d.y, b = (top - o.y) / d.y;
    if (a > b) { const s = a; a = b; b = s; }
    if (a > t0) t0 = a;
    if (b < t1) t1 = b;
    if (t0 > t1) return false;
  }
  const p0 = [o.x + d.x * t0, o.z + d.z * t0], p1 = [o.x + d.x * t1, o.z + d.z * t1];
  if (ivInPoly(p0[0], p0[1], poly) || ivInPoly(p1[0], p1[1], poly)) return true;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    if (ivSegHit(p0, p1, poly[j], poly[i])) return true;
  }
  return false;
}

/* เตรียมรูปทรงทั้งฉากครั้งเดียว แล้วใช้ซ้ำทุกช่วงเวลา */
function ivGeom(st) {
  const foot = (typeof p3FootAll === "function" ? p3FootAll(st) : { panels: [], outlines: [] });
  const panels = (foot.panels || []).filter((p) => p.u && p.v && p.n);
  const blockers = [];
  /* ── ตัวอาคาร: ผิวหลังคาแต่ละผืน + ก้อนตึกใต้ชายคา ──
     ผิวหลังคาที่แผงตั้งอยู่จะถูกข้าม (ไม่งั้นแผงจะบังตัวเอง) แต่ผืนอื่น/อีกด้านของจั่วบังได้ตามจริง
     ส่วนก้อนตึกใต้ชายคาไม่ต้องข้าม เพราะแผงอยู่สูงกว่าชายคาเสมอ */
  (st.roofs || []).forEach((roof) => {
    if (typeof p3RoofSurf !== "function") return;
    let surfs = [];
    try { surfs = p3RoofSurf(roof) || []; } catch (e) { surfs = []; }
    let minY = 1e9;
    const hull = [];
    surfs.forEach((s) => {
      const a = s.pts[0];
      let cx = 0, cy = 0, cz = 0, rad = 0;
      s.pts.forEach((q) => { cx += q.x; cy += q.y; cz += q.z; if (q.y < minY) minY = q.y; hull.push([q.x, q.z]); });
      cx /= s.pts.length; cy /= s.pts.length; cz /= s.pts.length;
      s.pts.forEach((q) => { rad = Math.max(rad, Math.hypot(q.x - cx, q.y - cy, q.z - cz)); });
      const tris = [];
      for (let i = 1; i < s.pts.length - 1; i++) {
        const b = s.pts[i], c = s.pts[i + 1];
        tris.push({ a, e1: { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, e2: { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z } });
      }
      if (tris.length) blockers.push({ t: "t", tris, rid: roof.id, sd: s.side,
        bc: { x: cx, y: cy, z: cz }, br: rad, name: "ผิวหลังคา " + (roof.name || "") });
    });
    /* ก้อนตึกใต้ชายคา — หน้าตัดใช้กรอบนอกของผิวหลังคาทั้งผืน */
    const top = Math.min(minY, +roof.h || 0) - 0.03;
    if (hull.length >= 3 && top > 0.2) {
      const poly = ivHull2D(hull);
      let cx = 0, cz = 0, rad = 0;
      poly.forEach((q) => { cx += q[0]; cz += q[1]; });
      cx /= poly.length; cz /= poly.length;
      poly.forEach((q) => { rad = Math.max(rad, Math.hypot(q[0] - cx, q[1] - cz)); });
      blockers.push({ t: "w", poly, top, rid: roof.id,
        bc: { x: cx, y: top / 2, z: cz }, br: Math.hypot(rad, top / 2), name: "ตัวอาคาร " + (roof.name || "") });
    }
  });
  (st.obstacles || []).forEach((o) => {
    const x = scNum(o.x), z = scNum(o.z), h = Math.max(0.2, scNum(o.h, 1));
    if (o.kind === "tree") {
      const r = Math.max(scNum(o.w, 1), 1) / 2;
      const c = { x, y: h * 0.45 + r * 0.8, z };
      blockers.push({ t: "s", c, r, bc: c, br: r, name: o.name || "ต้นไม้", id: o.id });
    } else {
      const w = Math.max(0.2, scNum(o.w, 1)) / 2, d = Math.max(0.2, scNum(o.d, 1)) / 2;
      const c = { x, y: h / 2, z };
      blockers.push({ t: "b", lo: { x: x - w, y: 0, z: z - d }, hi: { x: x + w, y: h, z: z + d },
        bc: c, br: Math.hypot(w, h / 2, d), name: o.name || "สิ่งบดบัง", id: o.id });
    }
  });
  panels.forEach((p) => {
    const c = { x: p.cx, y: p.cy, z: p.cz };
    blockers.push({ t: "q", uid: p.uid, c, u: p.u, v: p.v, n: p.n,
      uu: ivDot(p.u, p.u), vv: ivDot(p.v, p.v), bc: c,
      br: Math.hypot(p.u.x + p.v.x, p.u.y + p.v.y, p.u.z + p.v.z), name: "แผง" });
  });
  /* จุดตัวอย่างบนหน้าแผง 5 จุด (กลาง + 4 มุมร่นเข้ามา) — ได้ "เงาบังกี่ส่วนของแผง" ไม่ใช่แค่บัง/ไม่บัง */
  const S = 0.62;
  const samples = panels.map((p) => {
    const arr = [{ x: p.cx, y: p.cy, z: p.cz }];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => arr.push({
      x: p.cx + a * S * p.u.x + b * S * p.v.x,
      y: p.cy + a * S * p.u.y + b * S * p.v.y,
      z: p.cz + a * S * p.u.z + b * S * p.v.z,
    }));
    return arr;
  });
  return { panels, blockers, samples, foot,
    obstacles: blockers.filter((b) => b.t === "s" || b.t === "b").length,
    buildings: blockers.filter((b) => b.t === "t" || b.t === "w").length };
}

/* เงาบัง ณ ทิศทางแสงหนึ่ง → { byUid: {uid: 0..1}, mean } */
function ivShadeAt(geo, dir) {
  const out = {};
  let sum = 0, n = 0;
  const B = geo.blockers;
  for (let i = 0; i < geo.panels.length; i++) {
    const p = geo.panels[i];
    /* แผงที่หันหนีดวงอาทิตย์ไม่ต้องคิดเป็น "โดนบัง" — ลำแสงตรงของมันเป็นศูนย์อยู่แล้วจากมุมตกกระทบ
       ถ้านับเป็น 100% จะไปหักแสงฟุ้งซ้ำอีกรอบ กลายเป็นหักสองเด้ง */
    if (ivDot(p.n, dir) <= 0.01) { out[p.uid] = 0; n++; continue; }
    const S = geo.samples[i];
    let blocked = 0;
    for (let s = 0; s < S.length; s++) {
      const o = S[s];
      for (let k = 0; k < B.length; k++) {
        const b = B[k];
        if (b.uid === p.uid) continue;
        /* ผิวหลังคาที่แผงใบนี้ตั้งอยู่ ไม่นับเป็นตัวบัง (ไม่งั้นแผงจะบังตัวเอง) */
        if (b.t === "t" && b.rid === p.roofId && b.sd === (p.side || null)) continue;
        /* คัดทิ้งเร็ว ๆ: ตัวบดบังที่อยู่ "หลัง" แผงเมื่อเทียบกับทิศแสง ยังไงก็บังไม่ได้ */
        const dx = b.bc.x - o.x, dy = b.bc.y - o.y, dz = b.bc.z - o.z;
        if (dx * dir.x + dy * dir.y + dz * dir.z < -b.br) continue;
        let hit = false;
        if (b.t === "s") hit = ivHitSphere(o, dir, b.c, b.r);
        else if (b.t === "b") hit = ivHitBox(o, dir, b.lo, b.hi);
        else if (b.t === "q") hit = ivHitQuad(o, dir, b);
        else if (b.t === "w") hit = ivHitWall(o, dir, b.poly, b.top);
        else if (b.t === "t") { for (let j = 0; j < b.tris.length; j++) { if (ivHitTri(o, dir, b.tris[j].a, b.tris[j].e1, b.tris[j].e2)) { hit = true; break; } } }
        if (hit) { blocked++; break; }
      }
    }
    const f = blocked / S.length;
    out[p.uid] = f; sum += f; n++;
  }
  return { byUid: out, mean: n ? scR(sum / n, 4) : 0 };
}

/* ทิศทางที่ดวงอาทิตย์อยู่ (แกนเดียวกับฉาก 3 มิติ: +X ตะวันออก · +Z ใต้ · +Y ขึ้นฟ้า) */
function ivSunDir(alt, az) {
  const a = alt * SC_DEG, z = az * SC_DEG;
  return { x: Math.sin(z) * Math.cos(a), y: Math.sin(a), z: -Math.cos(z) * Math.cos(a) };
}

/* ── เงาเฉลี่ยทั้งปี ──
   เดินทีละชั่วโมงในวันตัวแทนของแต่ละเดือน ถ่วงน้ำหนักด้วย "พลังงานลำแสงตรง" ที่ตกบนแผงจริง
   คืนค่าเป็น % ของพลังงานทั้งปีที่หายไปเพราะเงา แยกรายแผง/รายกลุ่ม/ทั้งระบบ */
function ivShadeAnnual(st, byPanel, groups, o) {
  o = o || {};
  const geo = ivGeom(st);
  if (!geo.panels.length) return null;
  const lat = scNum(o.lat, 13.75), lng = scNum(o.lng, 100.5);
  const gInfo = {}; (groups || []).forEach((g) => { gInfo[g.key] = g; });
  const lossW = {}, totW = {}, geoW = {};  // พลังงานที่หายทางไฟฟ้า / ทั้งหมด / ที่หายถ้าคิดแบบเชิงเส้น
  geo.panels.forEach((p) => { lossW[p.uid] = 0; totW[p.uid] = 0; geoW[p.uid] = 0; });
  /* จัดแผงเข้ากลุ่มไว้ก่อน — ผลทางไฟฟ้าต้องคิดทั้งกลุ่มพร้อมกัน ไม่ใช่ทีละแผง */
  const gPan = {};
  geo.panels.forEach((p) => { const k = byPanel[p.uid]; if (k && gInfo[k]) (gPan[k] = gPan[k] || []).push(p.uid); });
  const alb = scNum(o.albedo, SC_ENV.albedo);
  let steps = 0, sunSteps = 0;
  for (let m = 0; m < 12; m++) {
    const doy = Math.round(m * 30.44 + 15);
    const days = SC_MDAYS[m];
    for (let h = 5.5; h <= 18.5; h += 1) {
      steps++;
      const sun = scSunPos(lat, lng, doy, h);
      if (sun.alt <= 2) continue;
      const sa = Math.sin(sun.alt * SC_DEG);
      const ghi = 1098 * sa * ivExp(-0.057 / sa) * SC_KC[m];
      const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * doy / 365)) * sa;
      const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
      const dhi = ghi * scDiffuseFrac(kt);
      const dni = Math.max(0, (ghi - dhi) / sa);
      const dir = ivSunDir(sun.alt, sun.az);
      const sh = ivShadeAt(geo, dir);
      sunSteps++;
      /* ต่อกลุ่มทิศทาง: ลำแสงตรงกับแสงรวมบนระนาบนั้น ๆ */
      Object.keys(gPan).forEach((gk) => {
        const g = gInfo[gk], list = gPan[gk];
        const bT = g.tilt * SC_DEG, cosB = Math.cos(bT), sinB = Math.sin(bT);
        const cosAoi = Math.max(0, cosB * sa + sinB * Math.cos(sun.alt * SC_DEG) * Math.cos((sun.az - g.az) * SC_DEG));
        const beam = dni * cosAoi * ivIam(cosAoi, o.b0);
        const diff = dhi * (1 + cosB) / 2;
        const poa = beam + diff + ghi * alb * (1 - cosB) / 2;
        if (poa <= 0) return;
        /* ของที่บังแดดก็บังท้องฟ้าไปด้วยส่วนหนึ่ง — ใช้สูตรเดียวกับ ivIrradiance/ivDaySim */
        const cut = beam + diff * 0.35;
        /* ผลทางไฟฟ้าคิดทั้งกลุ่มพร้อมกัน (ไดโอดบายพาสตัดทิ้งทั้งท่อน) แล้วเฉลี่ยกลับลงรายแผง */
        const EL = ivElecLoss(list.map((uid) => sh.byUid[uid] || 0), o.elec);
        list.forEach((uid) => {
          totW[uid] += poa * days;
          lossW[uid] += cut * EL.elec * days;
          geoW[uid] += cut * EL.geo * days;
        });
      });
    }
  }
  const byPanelPct = {}, gAcc = {};
  let lTot = 0, tTot = 0, lGeoTot = 0;
  geo.panels.forEach((p) => {
    const t = totW[p.uid] || 0, l = lossW[p.uid] || 0;
    byPanelPct[p.uid] = t > 0 ? scR(l / t * 100, 1) : 0;
    lTot += l; tTot += t; lGeoTot += (geoW[p.uid] || 0);
    const gk = byPanel[p.uid];
    if (gk) { const a = gAcc[gk] = gAcc[gk] || { l: 0, t: 0, n: 0 }; a.l += l; a.t += t; a.n++; }
  });
  const byGroup = {};
  Object.keys(gAcc).forEach((k) => { byGroup[k] = gAcc[k].t > 0 ? scR(gAcc[k].l / gAcc[k].t * 100, 1) : 0; });
  /* แผงที่โดนหนักสุด — ช่างจะได้รู้ว่าควรย้ายใบไหน */
  const worst = geo.panels.map((p) => ({ uid: p.uid, roofName: p.roofName, key: p.key, pct: byPanelPct[p.uid] }))
    .filter((x) => x.pct >= 3).sort((a, b) => b.pct - a.pct).slice(0, 8);
  return { byPanel: byPanelPct, byGroup, worst,
    overall: tTot > 0 ? scR(lTot / tTot * 100, 1) : 0,
    /* เทียบให้เห็นว่า "ผลทางไฟฟ้า" ทำให้เสียมากกว่าคิดตามพื้นที่เงาเท่าไหร่ */
    geoOnly: tTot > 0 ? scR(lGeoTot / tTot * 100, 1) : 0,
    elecExtra: tTot > 0 ? scR((lTot - lGeoTot) / tTot * 100, 1) : 0,
    panels: geo.panels.length, obstacles: geo.obstacles, buildings: geo.buildings,
    steps, sunSteps, at: Date.now() };
}

/* เงาบัง ณ วัน/เวลาที่ออกไปตรวจวัด (ใช้กับขั้นตอน I-V) */
function ivShadeMoment(st, byPanel, groups, o) {
  const geo = ivGeom(st);
  if (!geo.panels.length) return null;
  const doy = ivDayOfYear(o.date);
  const sun = scSunPos(o.lat, o.lng, doy, scNum(o.hour, 12));
  if (sun.alt <= 2) return { byGroup: {}, overall: 0, night: true, panels: geo.panels.length, obstacles: geo.obstacles };
  const sh = ivShadeAt(geo, ivSunDir(sun.alt, sun.az));
  const acc = {};
  geo.panels.forEach((p) => {
    const gk = byPanel[p.uid]; if (!gk) return;
    const a = acc[gk] = acc[gk] || { s: 0, n: 0 };
    a.s += sh.byUid[p.uid] || 0; a.n++;
  });
  const byGroup = {};
  Object.keys(acc).forEach((k) => { byGroup[k] = scR(acc[k].s / acc[k].n * 100, 1); });
  return { byUid: sh.byUid, byGroup, overall: scR(sh.mean * 100, 1), sun,
    panels: geo.panels.length, obstacles: geo.obstacles, night: false };
}

/* ============================================================
   เส้นทางเดินดวงอาทิตย์ + แผนที่เงาบัง (sun path & iso-shading)
   ------------------------------------------------------------
   แกนนอน = ทิศที่ดวงอาทิตย์อยู่ (0° เหนือ · 90° ตะวันออก · 180° ใต้ · 270° ตะวันตก)
   แกนตั้ง = มุมสูงเหนือขอบฟ้า
   บนแกนคู่นี้ ตำแหน่งดวงอาทิตย์ทุกวันทั้งปีจะตกอยู่ในแถบเดียว และที่สำคัญกว่านั้น
   "เงาบัง" ขึ้นกับทิศทางแสงเท่านั้น ไม่ขึ้นกับว่าเป็นวันไหน — จึงวาดเป็นแผนที่พื้นหลังตายตัวได้
   แล้วเอาเส้นทางเดินของแต่ละเดือนทาบลงไป เห็นทันทีว่าโดนบังเดือนไหน เวลาไหน
   ============================================================ */
/* วันตัวแทน 7 เส้นแบบเดียวกับที่ใช้กันในวงการ — เดือนที่เส้นทางทับกันรวมเป็นเส้นเดียว */
const IV_SUNDAYS = [
  { doy: 172, label: "21 มิ.ย." },
  { doy: 141, label: "21 พ.ค. · 23 ก.ค." },
  { doy: 110, label: "20 เม.ย. · 23 ส.ค." },
  { doy: 79,  label: "20 มี.ค. · 23 ก.ย." },
  { doy: 52,  label: "21 ก.พ. · 23 ต.ค." },
  { doy: 19,  label: "19 ม.ค. · 22 พ.ย." },
  { doy: 356, label: "22 ธ.ค." },
];
/* แถบเมืองไทยอยู่ใต้เส้นทรอปิกออฟแคนเซอร์ — ฤดูร้อนดวงอาทิตย์อ้อมเหนือ ทิศจึงวิ่งข้าม 0°/360°
   ถ้าลากเส้นตรง ๆ จะได้เส้นพาดขวางทั้งกราฟ ต้องตัดเส้นตรงจุดที่ข้ามก่อน */
function ivAzSplit(pts) {
  const segs = []; let cur = [];
  for (let i = 0; i < pts.length; i++) {
    if (i && Math.abs(pts[i].az - pts[i - 1].az) > 180) { if (cur.length > 1) segs.push(cur); cur = []; }
    cur.push(pts[i]);
  }
  if (cur.length > 1) segs.push(cur);
  return segs;
}
function ivSunPath(o) {
  o = o || {};
  const lat = scNum(o.lat, 13.75), lng = scNum(o.lng, 100.5);
  const paths = IV_SUNDAYS.map((d) => {
    const pts = [];
    for (let h = 4; h <= 20.001; h += 0.1) {
      const s = scSunPos(lat, lng, d.doy, h);
      if (s.alt > 0) pts.push({ az: s.az, alt: s.alt, h });
    }
    return { doy: d.doy, label: d.label, pts, segs: ivAzSplit(pts),
      rise: pts.length ? pts[0].h : null, set: pts.length ? pts[pts.length - 1].h : null,
      peak: pts.reduce((a, q) => (!a || q.alt > a.alt ? q : a), null) };
  }).filter((p) => p.pts.length);
  /* เส้นชั่วโมง — จุดที่ดวงอาทิตย์อยู่ ณ เวลาเดียวกันของทั้ง 7 วัน ต่อกันเป็นเส้น */
  const hours = [];
  for (let hh = 5; hh <= 19; hh++) {
    const pts = IV_SUNDAYS.map((d) => { const s = scSunPos(lat, lng, d.doy, hh); return s.alt > 1 ? { az: s.az, alt: s.alt } : null; }).filter(Boolean);
    if (pts.length > 1) hours.push({ h: hh, pts, segs: ivAzSplit(pts) });
  }
  let maxAlt = 0, north = false;
  paths.forEach((p) => {
    if (p.segs.length > 1) north = true;
    p.pts.forEach((q) => { if (q.alt > maxAlt) maxAlt = q.alt; });
  });
  return { paths, hours, lat, lng, maxAlt: scR(maxAlt, 1), north };
}

/* แผนที่เงาบังบนแกน ทิศ × มุมสูง — คิดครั้งเดียวแล้วใช้ได้ทั้งปี
   คืนค่าเป็นตาราง cells[] แต่ละช่องคือ "แผงทั้งระบบโดนบังเฉลี่ยกี่ %" ถ้าดวงอาทิตย์อยู่ตรงนั้น */
function ivIsoShade(st, o) {
  o = o || {};
  const geo = ivGeom(st);
  if (!geo.panels.length) return null;
  const az0 = scNum(o.azMin, 0), az1 = scNum(o.azMax, 354);
  const azStep = scNum(o.azStep, 6), altStep = scNum(o.altStep, 5);
  /* งานใหญ่ยิงลำแสงครบทุกใบ × ทุกทิศทางแล้วช้าเกินไป (140 แผง ≈ 2 วินาที)
     แผนที่นี้ต้องการแค่ "เฉลี่ยทั้งระบบ" จึงสุ่มแผงตัวแทนกระจายทั่วผังแทน
     ตัวบดบังยังคิดครบทุกชิ้นเสมอ — ความละเอียดของท้องฟ้าจึงไม่ลดลงเลย */
  /* ต้นทุนโตตาม แผง × ตัวบดบัง — คุมงบให้อยู่ราวครึ่งวินาทีไม่ว่าผังจะใหญ่แค่ไหน */
  const maxP = o.maxPanels != null ? Math.max(6, Math.round(scNum(o.maxPanels, 48)))
    : scClamp(Math.round(3000 / Math.max(1, geo.blockers.length)), 12, 48);
  let G = geo, sampled = 0;
  if (geo.panels.length > maxP) {
    const stride = geo.panels.length / maxP, pick = [];
    for (let i = 0; i < maxP; i++) pick.push(Math.min(geo.panels.length - 1, Math.round(i * stride)));
    G = { panels: pick.map((i) => geo.panels[i]), samples: pick.map((i) => geo.samples[i]), blockers: geo.blockers };
    sampled = G.panels.length;
  }
  const cells = [];
  let worst = null;
  for (let az = az0; az <= az1 + 0.001; az += azStep) {
    for (let alt = altStep / 2; alt < 90; alt += altStep) {
      const sh = ivShadeAt(G, ivSunDir(alt, az));
      const c = { az: scR(az, 1), alt: scR(alt, 1), f: sh.mean };
      cells.push(c);
      if (sh.mean > 0.001 && (!worst || sh.mean > worst.f)) worst = c;
    }
  }
  return { cells, az0, az1, azStep, altStep, worst, sampled,
    panels: geo.panels.length, obstacles: geo.obstacles, buildings: geo.buildings,
    any: cells.some((c) => c.f > 0.005) };
}

/* ============================================================
   เงาบัง "ทางไฟฟ้า" — เงาบังนิดเดียวแต่ฉุดทั้งสตริง
   ------------------------------------------------------------
   เงาบังพื้นที่ 5% ของแผง ไม่ได้แปลว่าเสียกำลัง 5%
   เพราะแผงต่ออนุกรมกัน กระแสไหลได้เท่ากับตัวที่แย่ที่สุด
   แผงจึงมีไดโอดบายพาส (ปกติ 3 ตัว = แบ่งแผงเป็น 3 ท่อน) คอยลัดท่อนที่โดนบังทิ้ง
   → เงาโดนท่อนไหน ท่อนนั้นหลุดออกทั้งท่อน ไม่ใช่หลุดตามสัดส่วนพื้นที่

   โมเดลนี้เดินตามแนว PVsyst "according to module strings/partitions"
   ซึ่งเป็นค่าขอบบน แล้วปรับลงด้วย "สัดส่วนผลทางไฟฟ้า" (PVsyst แนะนำ 60–80%
   สำหรับเงาไม่สม่ำเสมออย่างต้นไม้/ปล่องไฟ · 100% สำหรับแถวบังแถวที่เป็นระเบียบ)
   ============================================================ */
const IV_ELEC = {
  diodes: 3,       // ไดโอดบายพาสต่อแผง = จำนวนท่อนที่ตัดออกได้ทีละท่อน
  /* halfCut = เผื่อกรณีแผงครึ่งเซลล์วางตั้ง + เงาเป็น "แถบแนวนอนเต็มความกว้าง" เท่านั้น
     (ครึ่งบนกับครึ่งล่างขนานกัน ครึ่งที่ไม่โดนบังยังจ่ายไฟต่อได้)
     ถ้าเงาเป็นหย่อม/มุม เช่น เงาต้นไม้หรือปล่อง จะไม่ได้ประโยชน์นี้ → ปิดไว้เป็นค่าตั้งต้น */
  halfCut: false,
  kElec: 80,       // สัดส่วนผลทางไฟฟ้า (%) — PVsyst แนะนำ 60–80% สำหรับเงาไม่สม่ำเสมอ · 100% สำหรับแถวบังแถว
  minFrac: 2,      // เงาน้อยกว่านี้ (% ของแผง) ถือว่าไม่ทำให้ไดโอดทำงาน
};

/* เงาเชิงพื้นที่ของแต่ละแผงในสตริง → กำลังที่เสียจริงของสตริงนั้น
   fracs = [0..1] ต่อแผง · คืน { geo, elec, subLost, subTotal } เป็นสัดส่วน 0..1 */
function ivElecLoss(fracs, o) {
  const E = Object.assign({}, IV_ELEC, o || {});
  const nD = Math.max(1, Math.round(E.diodes));
  const tol = E.halfCut ? 0.6 : 1;               // ครึ่งเซลล์: ครึ่งที่ไม่โดนบังยังจ่ายไฟต่อได้
  const kE = scClamp(scNum(E.kElec, 80), 0, 100) / 100;
  const n = Math.max(1, fracs.length);
  let geoSum = 0, lost = 0, subLost = 0;
  fracs.forEach((f) => {
    geoSum += f;
    if (f * 100 < E.minFrac) return;
    const sub = Math.min(nD, Math.ceil(f * nD));  // เงาแตะท่อนไหน ท่อนนั้นถูกลัดทิ้งทั้งท่อน
    subLost += sub;
    lost += (sub / nD) * tol;
  });
  const geo = geoSum / n, raw = lost / n;
  /* ส่วนที่เกินจากการคิดแบบเชิงเส้น คือ "ผลทางไฟฟ้า" ปรับด้วย kElec ตามแนว PVsyst */
  const elec = scClamp(geo + Math.max(0, raw - geo) * kE, 0, 1);
  return { geo: scR(geo, 4), elec: scR(elec, 4), raw: scR(raw, 4),
    subLost, subTotal: n * nD, extra: scR(elec - geo, 4) };
}

/* ── หาแรงดันของเส้นโค้งที่กระแสค่าหนึ่ง (pts เรียงตามแรงดันขึ้น กระแสลง) ── */
function ivVatI(pts, I) {
  if (!pts.length) return 0;
  if (I >= pts[0].i) return 0;
  for (let k = 1; k < pts.length; k++) {
    if (pts[k].i <= I) {
      const a = pts[k - 1], b = pts[k];
      const t = (a.i - I) / Math.max(1e-9, a.i - b.i);
      return a.v + (b.v - a.v) * t;
    }
  }
  return pts[pts.length - 1].v;
}

/* ── เส้น I-V ของสตริงที่โดนเงาบังบางส่วน (มี "ขั้นบันได") ──
   สร้างจากการบวกแรงดันของทุกท่อนที่กระแสเดียวกัน
   ท่อนที่โดนบังจนจ่ายกระแสไม่ทัน จะถูกไดโอดบายพาสลัดทิ้ง เหลือแรงดันติดลบ ~0.7 V
   ผลคือเส้นหักเป็นขั้น และเส้นกำลังมี "ยอดสองยอด" ซึ่ง MPPT อาจไปเกาะยอดที่ผิด */
function ivStringShaded(par, panel, nSeries, o) {
  o = o || {};
  const E = Object.assign({}, IV_ELEC, o.elec || {});
  const nD = Math.max(1, Math.round(E.diodes));
  const ns = Math.max(1, Math.round(nSeries || 1));
  const gFull = Math.max(1, scNum(o.g, 1000));
  const tc = scNum(o.tc, 45);
  const derate = o.derate == null ? 1 : o.derate;
  const total = ns * nD;
  /* ── จำนวนท่อนที่ถูกไดโอดลัดทิ้ง ต้องปัดขึ้น "รายแผง" ──
     นี่คือหัวใจของเรื่อง: เงา 5% ของแผงเดียวในสตริง 10 แผง คิดแบบเฉลี่ยได้ 0.5%
     แต่ของจริงมันตัดท่อนทิ้ง 1 ใน 30 ท่อน = 3.3% คือแรงกว่าเกือบ 7 เท่า */
  const fracs = Array.isArray(o.fracs) && o.fracs.length
    ? o.fracs
    : new Array(ns).fill(scClamp(scNum(o.shade, 0), 0, 1));
  let hit = 0;
  fracs.forEach((f) => { if (f * 100 >= E.minFrac) hit += Math.min(nD, Math.ceil(f * nD)); });
  hit = Math.min(total, hit);
  const frac = fracs.reduce((a, b) => a + b, 0) / Math.max(1, fracs.length);
  /* ท่อนที่โดนบังเหลือแสงเท่าไหร่: แผงเต็มเซลล์เหลือแค่แสงฟุ้ง ~15%
     แผงครึ่งเซลล์ครึ่งที่ไม่โดนบังยังจ่ายต่อได้ จึงเหลือราวครึ่งหนึ่ง */
  const gShade = Math.max(1, gFull * scNum(o.shadeG, E.halfCut ? 0.5 : 0.15));
  const full = ivModule(par, panel, gFull, tc);
  if (!full) return null;
  const sub = (m) => m.pts.map((p) => ({ v: p.v / nD, i: p.i * derate }));
  const cFull = { n: total - hit, isc: full.isc * derate, pts: sub(full) };
  const shaded = hit > 0 ? ivModule(par, panel, gShade, tc) : null;
  const cShade = shaded ? { n: hit, isc: shaded.isc * derate, pts: sub(shaded) } : null;
  const list = [cFull].concat(cShade ? [cShade] : []).filter((c) => c.n > 0);
  const iMax = Math.max.apply(null, list.map((c) => c.isc));
  const pts = [];
  const N = 160;
  for (let k = N; k >= 0; k--) {
    const I = iMax * (k / N);
    let V = 0;
    list.forEach((c) => { V += c.n * (I > c.isc ? -0.7 : ivVatI(c.pts, I)); });
    if (V < 0) continue;
    pts.push({ v: scR(V, 2), i: scR(I, 3), p: scR(V * I, 1) });
  }
  if (!pts.length) return null;
  let best = pts[0];
  pts.forEach((q) => { if (q.p > best.p) best = q; });
  /* ยอดรองของเส้นกำลัง — ถ้ามีสองยอด MPPT อาจไปเกาะยอดที่ผิดตอนเงามา */
  let second = null;
  for (let k = 1; k < pts.length - 1; k++) {
    if (pts[k].p > pts[k - 1].p && pts[k].p >= pts[k + 1].p && Math.abs(pts[k].v - best.v) > best.v * 0.12) {
      if (!second || pts[k].p > second.p) second = pts[k];
    }
  }
  const voc = pts[pts.length - 1].v;
  return { pts, nSeries: ns, nPar: 1, g: gFull, tc,
    isc: scR(pts[0].i, 2), voc: scR(voc, 1), vmp: scR(best.v, 1), imp: scR(best.i, 2), pmax: scR(best.p, 1),
    ff: voc * pts[0].i > 0 ? scR(best.p / (voc * pts[0].i) * 100, 1) : 0,
    subLost: hit, subTotal: total, shadeFrac: scR(frac * 100, 1),
    twoPeaks: !!second, second: second ? { v: second.v, p: second.p } : null,
    lossVsClear: null };
}

/* ============================================================
   จำลองทั้งวัน — เดินเวลาทีละ 15 นาที คิดแสง เงา อุณหภูมิ กำลังไฟ ให้ครบทุกกลุ่ม
   ใช้ขับกราฟในหน้าตรวจวัด: เห็นว่า "วันนั้นจะเกิดอะไรขึ้นจริง ๆ" ตั้งแต่เช้าถึงเย็น
   ============================================================ */
function ivDaySim(st, panel, groups, byPanel, o) {
  o = o || {};
  if (!groups || !groups.length) return null;
  const geo = o.geo || ivGeom(st);            // ส่งรูปทรงที่เตรียมไว้แล้วเข้ามาได้ (ตอนไล่ 12 เดือนจะได้ไม่สร้างซ้ำ)
  const lat = scNum(o.lat, 13.75), lng = scNum(o.lng, 100.5);
  const doy = ivDayOfYear(o.date);
  const mIdx = Math.max(0, Math.min(11, new Date((o.date || "2026-01-01") + "T12:00:00").getMonth() || 0));
  const tAmb0 = o.tAmb != null && o.tAmb !== "" ? scNum(o.tAmb) : SC_TAMB[mIdx];
  const wp = scNum(panel.wp, 650), alb = scNum(o.albedo, SC_ENV.albedo);
  const noct = scNum(panel.noct, SC_PANEL_EXTRA.noct), tcP = scNum(panel.tcPmax, SC_PANEL_EXTRA.tcPmax);
  const kGhi = scNum(o.ghi) > 0 ? null : SC_KC[mIdx];       // ถ้าวัดความเข้มแสงมาจริง ใช้ปรับสเกลทั้งวัน
  const dt = scNum(o.dt, 0) || 0.25;
  const gKw = {}; groups.forEach((g) => { gKw[g.key] = g.count * wp / 1000; });
  /* แผงในกลุ่มไหนบ้าง — ใช้เฉลี่ยเงารายกลุ่ม */
  const gPan = {};
  geo.panels.forEach((p) => { const k = byPanel[p.uid]; if (k) (gPan[k] = gPan[k] || []).push(p.uid); });
  const rows = [];
  let sunrise = null, sunset = null, peak = null, dayKwh = 0, dayKwhNoShade = 0;
  const acKw = scNum(o.acKw, 0), dcLoss = scNum(o.dcLoss, 1), invEff = scNum(o.invEff, 97.5) / 100;
  for (let h = 4; h <= 20.001; h += dt) {
    const sun = scSunPos(lat, lng, doy, h);
    if (sun.alt <= 0) { if (sunrise != null && sunset == null) sunset = h; continue; }
    if (sunrise == null) sunrise = h;
    const sa = Math.sin(sun.alt * SC_DEG);
    let ghi = 1098 * sa * ivExp(-0.057 / sa) * (kGhi == null ? 1 : kGhi);
    if (kGhi == null) {
      /* ปรับให้ผ่านค่าที่วัดได้จริง ณ เวลาที่วัด (ทั้งวันเลื่อนตามสัดส่วนเดียวกัน) */
      const sRef = scSunPos(lat, lng, doy, scNum(o.refHour, 12));
      const saR = Math.max(0.05, Math.sin(sRef.alt * SC_DEG));
      const clearRef = 1098 * saR * ivExp(-0.057 / saR);
      ghi *= scNum(o.ghi) / (clearRef || 1);
    }
    const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * doy / 365)) * sa;
    const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
    const dhi = ghi * scDiffuseFrac(kt);
    const dni = Math.max(0, (ghi - dhi) / sa);
    const sh = ivShadeAt(geo, ivSunDir(sun.alt, sun.az));
    const per = {};
    let dcAll = 0, dcAllNo = 0, poaSumW = 0, kwpSum = 0;
    groups.forEach((g) => {
      const bT = g.tilt * SC_DEG, cosB = Math.cos(bT), sinB = Math.sin(bT);
      const cosAoi = Math.max(0, cosB * sa + sinB * Math.cos(sun.alt * SC_DEG) * Math.cos((sun.az - g.az) * SC_DEG));
      const iam = ivIam(cosAoi, o.b0);
      const beam = dni * cosAoi * iam;
      const diff = dhi * (1 + cosB) / 2, refl = ghi * alb * (1 - cosB) / 2;
      const poa = beam + diff + refl;
      const list = gPan[g.key] || [];
      /* เงาเชิงพื้นที่ → เงาที่เสียจริงทางไฟฟ้า (ไดโอดบายพาสตัดทิ้งทั้งท่อน) */
      const EL = ivElecLoss(list.map((uid) => sh.byUid[uid] || 0), o.elec);
      const sf = EL.elec, sfGeo = EL.geo;
      const poaNet = Math.max(0, poa - sf * (beam + diff * 0.35));
      const tCell = tAmb0 + (noct - 20) / 800 * poaNet;
      const kwp = gKw[g.key] || 0;
      const dc = Math.max(0, poaNet / 1000 * (1 + tcP / 100 * (tCell - 25))) * kwp;
      const dcNo = Math.max(0, poa / 1000 * (1 + tcP / 100 * (tAmb0 + (noct - 20) / 800 * poa - 25))) * kwp;
      per[g.key] = { poa: scR(poa, 0), poaNet: scR(poaNet, 0), shade: scR(sf * 100, 1),
        shadeGeo: scR(sfGeo * 100, 1), subLost: EL.subLost, subTotal: EL.subTotal, beam: scR(beam, 0),
        diff: scR(diff, 0), refl: scR(refl, 0), tCell: scR(tCell, 1), aoi: scR(Math.acos(scClamp(cosAoi, 0, 1)) / SC_DEG, 1),
        iam: scR(iam, 3), dc: scR(dc, 3) };
      dcAll += dc; dcAllNo += dcNo; poaSumW += poa * kwp; kwpSum += kwp;
    });
    let ac = dcAll * dcLoss * invEff;
    const acRaw = ac;
    if (acKw > 0 && ac > acKw) ac = acKw;
    dayKwh += ac * dt;
    dayKwhNoShade += Math.min(acKw > 0 ? acKw : 1e9, dcAllNo * dcLoss * invEff) * dt;
    const row = { h: scR(h, 2), alt: scR(sun.alt, 1), az: scR(sun.az, 1), ghi: scR(ghi, 0),
      dni: scR(dni, 0), dhi: scR(dhi, 0), per, dc: scR(dcAll, 3), ac: scR(ac, 3), clip: acRaw > ac,
      poaAvg: kwpSum ? scR(poaSumW / kwpSum, 0) : 0,
      /* อุณหภูมิเซลล์ของทั้งระบบ = ถ่วงน้ำหนักด้วย kWp ของแต่ละกลุ่ม (กลุ่มใหญ่มีน้ำหนักมากกว่า) */
      tCell: kwpSum ? scR(groups.reduce((a, g) => a + per[g.key].tCell * (gKw[g.key] || 0), 0) / kwpSum, 1) : 0,
      shade: kwpSum ? scR(groups.reduce((a, g) => a + per[g.key].shade * (gKw[g.key] || 0), 0) / kwpSum, 1) : 0 };
    rows.push(row);
    if (!peak || row.ac > peak.ac) peak = row;
  }
  if (sunset == null && rows.length) sunset = rows[rows.length - 1].h;
  /* เวลาที่เหมาะจะออกไปวัดที่สุด: แดดแรงและไม่มีเงาบัง */
  let best = null;
  rows.forEach((r) => {
    if (r.h < 9 || r.h > 15.5) return;
    const score = r.poaAvg * (1 - scClamp(r.shade / 100, 0, 1)) - (r.clip ? 20 : 0);
    if (!best || score > best.score) best = { score, row: r };
  });
  const shadedRows = rows.filter((r) => r.shade > 0.5);
  return {
    rows, doy, month: mIdx, tAmb: tAmb0,
    sunrise: sunrise == null ? null : scR(sunrise, 2), sunset: sunset == null ? null : scR(sunset, 2),
    peak, bestHour: best ? best.row.h : 12, dayKwh: scR(dayKwh, 1),
    shadeLossKwh: scR(Math.max(0, dayKwhNoShade - dayKwh), 1),
    shadeLossPct: dayKwhNoShade > 0 ? scR(Math.max(0, 1 - dayKwh / dayKwhNoShade) * 100, 1) : 0,
    shadeFrom: shadedRows.length ? shadedRows[0].h : null,
    shadeTo: shadedRows.length ? shadedRows[shadedRows.length - 1].h : null,
    clipHours: scR(rows.filter((r) => r.clip).length * dt, 2),
    panels: geo.panels.length, obstacles: geo.obstacles, buildings: geo.buildings,
    maxGhi: rows.reduce((a, r) => Math.max(a, r.ghi), 0),
    maxPoa: rows.reduce((a, r) => Math.max(a, r.poaAvg), 0),
    dt,
  };
}
/* ── จำลองทั้งปี: เดินวันตัวแทนของทั้ง 12 เดือน ──
   ใช้รูปทรงชุดเดียวกันทุกเดือน (สร้างครั้งเดียว) ก้าวเวลาหยาบกว่ารายวันเพื่อให้ไหลลื่น
   คืนตารางแสง/เงา แบบ "เดือน × ชั่วโมง" ไว้วาดเป็นแผนที่ความร้อน */
function ivYearSim(st, panel, groups, byPanel, o) {
  o = o || {};
  if (!groups || !groups.length) return null;
  const geo = ivGeom(st);
  const year = scNum(o.year, 0) || new Date().getFullYear();
  const hours = [];
  for (let h = 5; h <= 19.001; h += 0.5) hours.push(scR(h, 1));
  const months = [];
  let totalKwh = 0, maxPoa = 0, maxAc = 0, lossKwh = 0, fullKwh = 0;
  for (let m = 0; m < 12; m++) {
    const date = year + "-" + String(m + 1).padStart(2, "0") + "-15";
    const sim = ivDaySim(st, panel, groups, byPanel, Object.assign({}, o, { date, dt: 0.5, geo }));
    if (!sim) continue;
    const cells = hours.map((h) => {
      const r = sim.rows.find((q) => Math.abs(q.h - h) < 0.26);
      return r ? { h, poa: r.poaAvg, shade: r.shade, ac: r.ac, ghi: r.ghi, dc: r.dc, tCell: r.tCell }
               : { h, poa: 0, shade: 0, ac: 0, ghi: 0, dc: 0, tCell: 0 };
    });
    const days = SC_MDAYS[m];
    totalKwh += sim.dayKwh * days;
    lossKwh += sim.shadeLossKwh * days;
    fullKwh += (sim.dayKwh + sim.shadeLossKwh) * days;
    maxPoa = Math.max(maxPoa, sim.maxPoa);
    maxAc = Math.max(maxAc, sim.peak ? sim.peak.ac : 0);
    months.push({ m, label: SC_MON[m], date, cells, days,
      dayKwh: sim.dayKwh, monthKwh: scR(sim.dayKwh * days, 0),
      shadeLossPct: sim.shadeLossPct, shadeLossKwh: scR(sim.shadeLossKwh * days, 1),
      maxPoa: sim.maxPoa, peakAc: sim.peak ? sim.peak.ac : 0, peakAt: sim.peak ? sim.peak.h : null,
      sunrise: sim.sunrise, sunset: sim.sunset, bestHour: sim.bestHour,
      shadeFrom: sim.shadeFrom, shadeTo: sim.shadeTo, clipHours: sim.clipHours });
  }
  const worst = months.slice().sort((a, b) => b.shadeLossPct - a.shadeLossPct)[0] || null;
  /* เดือนที่ผลิตได้เยอะที่สุด — ใช้เป็นวันตัวแทน "วันที่ดีที่สุดของปี" ในรายงาน */
  const best = months.slice().sort((a, b) => b.monthKwh - a.monthKwh)[0] || null;
  return { months, hours, maxPoa, maxAc, bestMonth: best,
    totalKwh: Math.round(totalKwh), shadeLossKwh: Math.round(lossKwh),
    shadeLossPct: fullKwh > 0 ? scR(lossKwh / fullKwh * 100, 1) : 0,
    clipHours: scR(months.reduce((a, x) => a + x.clipHours * x.days, 0), 0),
    worstMonth: worst, panels: geo.panels.length, obstacles: geo.obstacles, buildings: geo.buildings };
}

const ivHM = (h) => {
  if (h == null) return "—";
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return (mm === 60 ? hh + 1 : hh) + ":" + String(mm === 60 ? 0 : mm).padStart(2, "0");
};

/* ============================================================
   ROI / จุดคุ้มทุน
   ============================================================ */
const IV_ROI = {
  costMode: "perWp", perWp: 22, lump: 0,       // ราคาทั้งระบบ (บาท/วัตต์ หรือกรอกยอดรวม)
  tariff: 4.4, escal: 3,                        // ค่าไฟที่ประหยัดได้ (บาท/หน่วย) + ค่าไฟขึ้นปีละ %
  selfUse: 70, exportRate: 2.2,                 // ใช้เองกี่ % · ส่วนที่เหลือขายคืนได้หน่วยละเท่าไหร่
  om: 0.5, omEscal: 3,                          // ค่าดูแลรักษาต่อปี (% ของค่าติดตั้ง) + เงินเฟ้อ
  invRepYear: 12, invRepCost: 0,                // เปลี่ยนอินเวอร์เตอร์ปีที่เท่าไหร่ ราคาเท่าไหร่
  discount: 5, years: 25,                       // อัตราคิดลด + จำนวนปีที่มอง
};

function ivNpv(rate, flows) {
  let v = 0;
  for (let i = 0; i < flows.length; i++) v += flows[i] / Math.pow(1 + rate, i + 1);
  return v;
}
/* IRR ด้วยการแบ่งครึ่งช่วง — เสถียรกว่านิวตันเวลากระแสเงินสดสลับเครื่องหมาย */
function ivIrr(capex, flows) {
  const f = (r) => -capex + ivNpv(r, flows);
  if (f(0) <= 0) return null;
  let lo = 0, hi = 1;
  while (f(hi) > 0 && hi < 5) hi *= 2;
  if (f(hi) > 0) return null;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/* ── กระแสเงินสดรายปี ──
   annual = ผลผลิตปีแรก (kWh) · panel ใช้ค่าเสื่อมของแผงชุดเดียวกับหน้าผลผลิต
   x = ของเพิ่มเติมที่คำนวณมาแล้วจากที่อื่น (ไม่ได้เก็บใน state):
     · split   { direct, dis, exp } สัดส่วนของไฟที่ผลิตได้ — มาจาก scDispatch แทนสไลเดอร์ "ใช้เองกี่ %"
     · battCapex / battRepYear / battRepCost / battDegY  ค่าใช้จ่ายและการเสื่อมของแบต
     · kYield  ตัวคูณผลผลิต (1 = P50 · น้อยกว่า 1 = คิดแบบระมัดระวังที่ P90) */
function ivRoi(annual, panel, dcKw, r, x) {
  const R = Object.assign({}, IV_ROI, r || {});
  x = x || {};
  const yrs = Math.max(1, Math.round(R.years));
  const pvCapex = R.costMode === "lump" ? scNum(R.lump) : scNum(R.perWp) * scNum(dcKw) * 1000;
  const battCapex = Math.max(0, scNum(x.battCapex, 0));
  const capex = pvCapex + battCapex;
  const d1 = scNum(panel.deg1, SC_PANEL_EXTRA.deg1) / 100, dy = scNum(panel.degY, SC_PANEL_EXTRA.degY) / 100;
  const kY = scNum(x.kYield, 1) || 1;
  const sp = x.split || null;
  const fDirect = sp ? scClamp(scNum(sp.direct, 0), 0, 1) : 0;
  const fDis = sp ? scClamp(scNum(sp.dis, 0), 0, 1) : 0;
  const fExp = sp ? scClamp(scNum(sp.exp, 0), 0, 1) : 0;
  const self = scClamp(scNum(R.selfUse, 70), 0, 100) / 100;
  const bDegY = scNum(x.battDegY, 0) / 100;
  const bRepY = Math.max(0, Math.round(scNum(x.battRepYear, 0)));
  const bRepCost = Math.max(0, scNum(x.battRepCost, 0));
  /* ค่าดูแลคิดจากค่าติดตั้งฝั่งโซลาร์เท่านั้น — แบตมีรอบเปลี่ยนของตัวเองอยู่แล้ว จะได้ไม่นับซ้ำ */
  const omBase = pvCapex * scNum(R.om) / 100;
  const rows = []; const flows = [];
  let cum = -capex, payback = null, totalSave = 0, totalKwh = 0, totalDel = 0, bAge = 0;
  for (let y = 1; y <= yrs; y++) {
    bAge++;
    const keep = (1 - d1) * Math.pow(1 - dy, y - 1);
    const kwh = annual * keep * kY;
    const esc = Math.pow(1 + scNum(R.escal) / 100, y - 1);
    /* แบตเก็บได้น้อยลงทุกปี ส่วนที่ใช้ตรง ๆ ตอนกลางวันไม่กระทบ — แยกคิดกันคนละก้อน */
    const bKeep = Math.max(0, 1 - bDegY * (bAge - 1));
    const fSelf = sp ? fDirect + fDis * bKeep : self;
    const fSell = sp ? fExp : 1 - self;
    const save = kwh * fSelf * scNum(R.tariff) * esc;
    const sell = kwh * fSell * scNum(R.exportRate) * esc;
    const om = omBase * Math.pow(1 + scNum(R.omEscal) / 100, y - 1);
    let rep = (scNum(R.invRepYear) === y ? scNum(R.invRepCost) : 0);
    if (bRepY > 0 && bRepCost > 0 && y < yrs && y % bRepY === 0) { rep += bRepCost; bAge = 0; }
    const net = save + sell - om - rep;
    const prev = cum;
    cum += net;
    if (payback == null && cum >= 0 && net > 0) payback = scR(y - 1 + (-prev) / net, 2);
    totalSave += save + sell; totalKwh += kwh; totalDel += kwh * (fSelf + fSell);
    flows.push(net);
    rows.push({ year: y, kwh: Math.round(kwh), keep: scR(keep * 100, 1), save: Math.round(save), sell: Math.round(sell),
      om: Math.round(om), rep: Math.round(rep), net: Math.round(net), cum: Math.round(cum),
      selfPct: scR(fSelf * 100, 1), bKeep: scR(bKeep * 100, 0) });
  }
  const disc = scNum(R.discount) / 100;
  const npv = -capex + ivNpv(disc, flows);
  const irr = ivIrr(capex, flows);
  /* LCOE = (เงินลงทุน + ค่าดูแลคิดลด) ÷ ผลผลิตคิดลด — ใช้เทียบกับค่าไฟต่อหน่วยตรง ๆ
     ถ้ามีการห้ามไหลย้อนจนต้องตัดไฟทิ้ง จะนับเฉพาะหน่วยที่ได้ใช้จริง ต้นทุนต่อหน่วยจึงสูงขึ้นตามจริง */
  const fDel = sp ? Math.min(1, fDirect + fDis + fExp) : 1;
  let dCost = capex, dKwh = 0;
  rows.forEach((q, i) => { dCost += (q.om + q.rep) / Math.pow(1 + disc, i + 1); dKwh += q.kwh * fDel / Math.pow(1 + disc, i + 1); });
  return {
    capex: Math.round(capex), pvCapex: Math.round(pvCapex), battCapex: Math.round(battCapex),
    kYield: scR(kY, 4), split: sp, deliveredKwh: Math.round(totalDel),
    rows, years: yrs, payback,
    npv: Math.round(npv), irr: irr == null ? null : scR(irr * 100, 2),
    lcoe: dKwh ? scR(dCost / dKwh, 2) : 0,
    totalSave: Math.round(totalSave), totalKwh: Math.round(totalKwh),
    netTotal: Math.round(rows.length ? rows[rows.length - 1].cum : -capex),
    roiPct: capex ? scR((rows[rows.length - 1].cum + capex) / capex * 100, 1) : 0,
    perWp: scNum(dcKw) ? scR(pvCapex / (scNum(dcKw) * 1000), 2) : 0,
    year1: rows[0] || null, cfg: R,
  };
}

Object.assign(window, {
  IV_MOUNT, IV_PANEL_EXTRA, IV_ROI,
  ivCells, ivExtract, ivAt, ivModule, ivString, ivSolveI, ivVocOf, ivMppOf,
  ivIrradiance, ivCellTemp, ivIam, ivDayOfYear, ivExpect, ivToStc, ivDiagnose, ivAssess,
  ivRoi, ivNpv, ivIrr,
  ivGeom, ivShadeAt, ivShadeAnnual, ivShadeMoment, ivSunDir, ivHitBox, ivHitSphere, ivHitQuad,
  ivHitTri, ivHitWall, ivInPoly, ivHull2D, ivDaySim, ivYearSim, ivHM,
  IV_ELEC, ivElecLoss, ivStringShaded, ivVatI,
});
