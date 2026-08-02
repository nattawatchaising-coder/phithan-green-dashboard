/* ============================================================
   PHITHAN GREEN — เครื่องคำนวณระบบ PV (สตริง / ไมโคร / ผลผลิต 15 ปี)
   ------------------------------------------------------------
   ต่อยอดจาก boq.js: สเปคแผง (voc/isc/vmp/imp) และอินเวอร์เตอร์
   (mpptVmin/mpptVmax/maxVdc/maxInA/inputs) ดึงจากคลังสินค้าโดยตรง
   ไฟล์นี้เพิ่มเฉพาะส่วนที่คลังไม่มี = สัมประสิทธิ์อุณหภูมิ, NOCT,
   ค่าเสื่อม, ประสิทธิภาพอินเวอร์เตอร์ และโมเดลพลังงานที่คิด
   "มุมเอียง/ทิศ" ของแผงจริงจากโมเดล 3 มิติ

   ทุกฟังก์ชันเป็น pure — ไม่แตะ DOM/state ทดสอบแยกได้
   ============================================================ */
const SC_DEG = Math.PI / 180;
const SC_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const SC_MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/* ── สเปคที่คลังสินค้าไม่ได้เก็บ (ค่ากลางของแผง mono PERC / TOPCon ปัจจุบัน) ──
   tcVoc/tcPmax = %/°C · เป็นลบเพราะร้อนขึ้นแล้วแรงดัน/กำลังตก
   noct  = อุณหภูมิเซลล์ตอนใช้งานปกติ (°C) ใช้ประมาณอุณหภูมิเซลล์จากแดด
   deg1  = เสื่อมปีแรก (%) · degY = เสื่อมปีถัด ๆ ไป (%/ปี) — ตามการรับประกันทั่วไป */
const SC_PANEL_EXTRA = { tcVoc: -0.25, tcIsc: 0.045, tcPmax: -0.29, noct: 44, deg1: 1.0, degY: 0.4 };
/* ── ค่ากลางของอินเวอร์เตอร์ ──
   ดาต้าชีตแยกกระแสไว้ 3 ค่า คนละความหมาย ห้ามเอามาปนกัน (ตัวอย่าง SUN2000-50K-MC0):
     maxInA   = Max. Current per Input  (23 A) → เพดานของ "1 สตริง" ที่เสียบ 1 ขั้ว
     maxMpptA = Max. Current per MPPT   (30 A) → เพดานของ "ทุกสตริงในช่อง MPPT เดียวกันรวมกัน"
     maxIscA  = Max. Short Circuit Current per MPPT (40 A) → เทียบกับ Isc×1.25 รวมทั้งช่อง
   vStart = แรงดันที่อินเวอร์เตอร์เริ่มจ่ายไฟ · vRated = แรงดันที่ออกแบบไว้ให้ทำงานได้ดีที่สุด
   effEuro = ประสิทธิภาพถ่วงน้ำหนักตามการใช้งานจริง (ใช้คิดผลผลิต) ส่วน eff = ค่าสูงสุดบนดาต้าชีต */
const SC_INV_EXTRA = { eff: 97.5, strPerMppt: 2 };

/* อุณหภูมิออกแบบ: ไทยพื้นราบต่ำสุดราว 15 °C (ภาคเหนือ/อีสานหนาวจัดกว่านี้ ปรับได้)
   tCellHot = อุณหภูมิเซลล์ตอนบ่ายแดดจัด ใช้เช็คว่าแรงดันไม่ตกหลุด MPPT */
const SC_ENV = { tMin: 15, tCellHot: 65, albedo: 0.2 };

/* ค่าสูญเสียระบบ (%) — ค่ากลางที่ใช้กันในการออกแบบ ปรับได้ทุกตัว */
const SC_LOSS = { soil: 3, mismatch: 2, wire: 2, shade: 0, avail: 1 };

/* อุณหภูมิอากาศเฉลี่ยกลางวันรายเดือน (°C) — ค่ากลางของไทย */
const SC_TAMB = [27, 29, 31, 32, 31, 30, 30, 30, 29, 29, 28, 27];
/* สัดส่วนแสงที่ได้จริงเทียบท้องฟ้าใส (clear-sky) รายเดือน — สะท้อนเมฆ/ฝน
   ปรับจนค่าเฉลี่ยทั้งปีบนระนาบราบ ≈ 5.0 kWh/m²/วัน ตรงกับข้อมูลกรมพัฒนาพลังงานฯ */
const SC_KC = [0.79, 0.80, 0.78, 0.74, 0.63, 0.60, 0.59, 0.58, 0.61, 0.66, 0.75, 0.79];

const scNum = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : (d || 0); };
const scClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const scR = (v, n) => { const m = Math.pow(10, n == null ? 2 : n); return Math.round(v * m) / m; };

/* ── ตำแหน่งดวงอาทิตย์ (สูตรเดียวกับโหมด 3D เป๊ะ ๆ เพื่อให้เงากับพลังงานตรงกัน) ── */
function scSunPos(lat, lng, doy, hour) {
  const decl = 23.44 * Math.sin(2 * Math.PI * (284 + doy) / 365);
  const solarHour = hour + ((scNum(lng, 100.5)) - 105) / 15;    // เวลาไทย UTC+7 → เส้นแวง 105°E
  const H = 15 * (solarHour - 12);
  const la = scNum(lat, 13.75) * SC_DEG, d = decl * SC_DEG, h = H * SC_DEG;
  const sinAlt = Math.sin(la) * Math.sin(d) + Math.cos(la) * Math.cos(d) * Math.cos(h);
  const alt = Math.asin(scClamp(sinAlt, -1, 1));
  let az = Math.acos(scClamp((Math.sin(d) - sinAlt * Math.sin(la)) / ((Math.cos(alt) * Math.cos(la)) || 1e-9), -1, 1));
  if (H > 0) az = 2 * Math.PI - az;
  return { alt: alt / SC_DEG, az: az / SC_DEG };
}

/* ── ทิศ/มุมเอียงของ "ระนาบ" จากเวกเตอร์ตั้งฉาก ──
   แกนโลกของฉาก 3D: +X = ตะวันออก · +Z = ใต้ · +Y = ขึ้นฟ้า (ตรงกับ p3SunPos) */
function scNormalToTiltAz(n) {
  const L = Math.hypot(n.x, n.y, n.z) || 1;
  const x = n.x / L, y = n.y / L, z = n.z / L;
  const tilt = Math.acos(scClamp(y, -1, 1)) / SC_DEG;
  let az = Math.atan2(x, -z) / SC_DEG;
  if (tilt < 0.05) az = 180;                       // ระนาบราบ ไม่มีทิศ — ให้เป็นใต้ไว้เฉย ๆ
  return { tilt: scR(tilt, 1), az: scR((az + 360) % 360, 1) };
}

/* ── แปลง "ทิศที่ลาดหันไป + องศาชัน + มุมเอียงขาตั้ง" ของบล็อกหนึ่ง → ทิศ/มุมจริงของแผง ──
   face = { tilt (องศาผิวหลังคา), az (ทิศที่ผิวหันไป) } · blk = { tilt (ขาตั้ง), rot (หมุนชุดแผง) }
   คิดแบบเดียวกับที่ renderer หมุนแผงจริง: normal ในกรอบ (u = แนวชายคา, n = ตั้งฉากผิว, v = ขึ้นลาด)
   = ( sinT·sinR , cosT , sinT·cosR ) */
function scPanelNormal(face, blk) {
  const rot = (scNum(face.az, 180) - 180) * SC_DEG;             // หมุนผิวไปตามทิศ
  const p = scNum(face.tilt, 0) * SC_DEG;
  const c = Math.cos(rot), s = Math.sin(rot);
  const L2W = (v) => ({ x: v.x * c - v.z * s, y: v.y, z: v.x * s + v.z * c });   // local → world
  const n = L2W({ x: 0, y: Math.cos(p), z: Math.sin(p) });      // ตั้งฉากผิว (ลาดหันไป +z ของ local)
  const u = L2W({ x: 1, y: 0, z: 0 });                          // แนวชายคา (แกน u)
  const v = { x: n.y * u.z - n.z * u.y, y: n.z * u.x - n.x * u.z, z: n.x * u.y - n.y * u.x };  // v = n × u = ขึ้นลาด
  const T = scNum(blk && blk.tilt, 0) * SC_DEG, R = scNum(blk && blk.rot, 0) * SC_DEG;
  if (!T) {
    if (!R) return n;
    return n;                                                   // หมุนรอบแกนตั้งฉาก ไม่เปลี่ยนทิศของ normal
  }
  const a = Math.sin(T) * Math.sin(R), b = Math.cos(T), d = Math.sin(T) * Math.cos(R);
  return { x: u.x * a + n.x * b + v.x * d, y: u.y * a + n.y * b + v.y * d, z: u.z * a + n.z * b + v.z * d };
}

/* ── รวมแผงในผังเป็น "กลุ่มทิศทาง" (แผงที่ทิศ/มุมเดียวกันถึงจะต่ออนุกรมกันได้ดี) ──
   st = state ของโหมด 3D · ต้องมี p3Panels/p3PolyPlane (โหลดมาก่อนแล้ว)
   คืน [{ key, roofId, roofName, blk, side, tilt, az, count, label }] */
function scPanelIndex(st) {
  const raw = [], byPanel = {};
  if (!st || !Array.isArray(st.roofs)) return { groups: [], byPanel };
  const P = window.p3Panels, PLANE = window.p3PolyPlane;
  if (typeof P !== "function") return { groups: [], byPanel };
  st.roofs.forEach((roof) => {
    const pan = P(roof);
    const blocks = pan.blocks || [];
    const bag = {};
    const add = (p, blkI, side, tilt, az, key2) => {
      const k = roof.id + "|" + blkI + "|" + (side || "-") + "|" + (key2 == null ? "" : key2);
      if (!bag[k]) { bag[k] = { key: k, roofId: roof.id, roofName: roof.name, blk: blkI, side: side || null, tilt, az, count: 0 }; raw.push(bag[k]); }
      bag[k].count++;
      byPanel[roof.id + "|" + p.key] = k;                        // ไว้ย้อนกลับว่าแผงนี้อยู่กลุ่มไหน
    };
    const blkOf = (i) => blocks[i] || { tilt: 0, rot: 0 };
    const az0 = scNum(roof.az, 180);

    (pan.list || []).forEach((p) => {
      if (p.skip || p.slot) return;
      if (roof.kind === "dome") {
        /* โดม: แต่ละแถวเอียงไม่เท่ากัน → แยกทีละแถว (แถวบนเกือบราบ แถวล่างชัน) */
        const tDeg = (p.rx || 0) / SC_DEG;                       // + = ลาดไปทาง az · − = ลาดกลับหลัง
        const g = scNormalToTiltAz(scPanelNormal({ tilt: Math.abs(tDeg), az: tDeg >= 0 ? az0 : az0 + 180 }, null));
        add(p, p.blk, "row" + Math.round(tDeg), g.tilt, g.az, Math.round(tDeg));
      } else if (roof.kind === "poly") {
        const pl = pan.plane || (typeof PLANE === "function" ? PLANE(roof) : null);
        if (!pl) return;
        const g = scNormalToTiltAz(scPanelNormal(scNormalToTiltAz(pl.n), blkOf(p.blk)));
        add(p, p.blk, null, g.tilt, g.az);
      } else {
        /* สี่เหลี่ยม / จั่ว / ปั้นหยา — ทิศของแต่ละด้านเทียบกับ roof.az */
        const faceAz = { A: az0, B: az0 + 180, C: az0 + 90, D: az0 - 90 };
        const g = scNormalToTiltAz(scPanelNormal({ tilt: scNum(roof.pitch, 0), az: p.side ? faceAz[p.side] : az0 }, blkOf(p.blk)));
        add(p, p.blk, p.side, g.tilt, g.az);
      }
    });
  });
  /* รวมกลุ่มที่ทิศ/มุมใกล้กันมาก (ต่าง < 1°) — ไม่งั้นโดมจะแตกเป็นสิบกลุ่มโดยไม่จำเป็น */
  const merged = [], remap = {};
  raw.forEach((g) => {
    const hit = merged.find((m) => m.roofId === g.roofId && Math.abs(m.tilt - g.tilt) < 1 && Math.abs(((m.az - g.az + 540) % 360) - 180) < 1);
    if (hit) { hit.count += g.count; hit.parts = (hit.parts || 1) + 1; remap[g.key] = hit.key; }
    else { const c = Object.assign({}, g); merged.push(c); remap[g.key] = c.key; }
  });
  Object.keys(byPanel).forEach((k) => { byPanel[k] = remap[byPanel[k]] || byPanel[k]; });
  merged.forEach((g) => { g.label = g.roofName + (g.side && g.side.indexOf("row") !== 0 ? " · ด้าน " + g.side : "") + " · เอียง " + scR(g.tilt, 0) + "° ทิศ " + scR(g.az, 0) + "°"; });
  return { groups: merged.filter((g) => g.count > 0).sort((a, b) => b.count - a.count), byPanel };
}
function scGroupsFromPlan(st) { return scPanelIndex(st).groups; }

/* ============================================================
   สตริงอินเวอร์เตอร์ — ช่วงจำนวนแผงต่ออนุกรมที่ "ทำงานได้ดี"
   ============================================================ */
/* แรงดันแผงเปลี่ยนตามอุณหภูมิ: หนาว = แรงดันขึ้น (กลัวเกิน Vdc max)
                                 ร้อน  = แรงดันตก (กลัวหลุดต่ำกว่า MPPT min) */
function scVocAt(panel, tC) { return scNum(panel.voc) * (1 + scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc) / 100 * (tC - 25)); }
function scVmpAt(panel, tC) {
  const tc = panel.tcVmp != null ? scNum(panel.tcVmp) : scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc);
  return scNum(panel.vmp) * (1 + tc / 100 * (tC - 25));
}

/* ตรวจ 1 สตริง (n แผงอนุกรม) → บอกว่าผ่าน/ไม่ผ่าน เพราะอะไร */
function scStringCheck(panel, inv, n, env) {
  env = Object.assign({}, SC_ENV, env || {});
  const vocCold = scVocAt(panel, env.tMin) * n;
  const vmpHot = scVmpAt(panel, env.tCellHot) * n;
  const vmpCold = scVmpAt(panel, env.tMin) * n;
  const vmpNom = scNum(panel.vmp) * n;
  const maxVdc = scNum(inv.maxVdc), vmin = scNum(inv.mpptVmin), vmax = scNum(inv.mpptVmax);
  const checks = [];
  if (maxVdc) checks.push({ k: "voc", ok: vocCold <= maxVdc, v: vocCold, lim: maxVdc,
    msg: "Voc ตอนอากาศเย็น " + scR(vocCold, 0) + " V ต้องไม่เกินแรงดันสูงสุด " + maxVdc + " V" });
  if (vmin) checks.push({ k: "hot", ok: vmpHot >= vmin, v: vmpHot, lim: vmin,
    msg: "แรงดันทำงานตอนแผงร้อน " + scR(vmpHot, 0) + " V ต้องไม่ต่ำกว่า MPPT ต่ำสุด " + vmin + " V" });
  if (vmax) checks.push({ k: "cold", ok: vmpCold <= vmax, v: vmpCold, lim: vmax,
    msg: "แรงดันทำงานตอนอากาศเย็น " + scR(vmpCold, 0) + " V ต้องไม่เกิน MPPT สูงสุด " + vmax + " V" });
  /* แรงดันเริ่มทำงาน — ต่ำกว่านี้อินเวอร์เตอร์ไม่ยอมออกไฟเลย (เช้า/เย็น/วันฟ้าปิดจะจุดไม่ติด) */
  const vStart = scNum(inv.vStart);
  if (vStart) checks.push({ k: "start", ok: vmpHot >= vStart, v: vmpHot, lim: vStart,
    msg: "แรงดันทำงานตอนแผงร้อน " + scR(vmpHot, 0) + " V ต่ำกว่าแรงดันเริ่มทำงานของอินเวอร์เตอร์ " + vStart + " V — เช้า/เย็นจะจุดไม่ติด" });
  const ok = checks.every((c) => c.ok);
  /* คะแนนคุณภาพ: อยากให้จุดทำงานอยู่ใกล้ "แรงดันที่ผู้ผลิตออกแบบไว้" (Rated input voltage)
     ถ้าดาต้าชีตไม่บอก ก็เล็งไว้ค่อนไปทางบนของช่วง MPPT (แรงดันสูง = กระแสต่ำ = สูญเสียในสายน้อย)
     แต่ต้องเหลือระยะห่างจากเพดานไว้กันวันอากาศเย็น */
  const vRated = scNum(inv.vRated);
  let score = 0, band = "-";
  if (ok && vmin && vmax) {
    const aim = vRated && vRated > vmin && vRated < vmax ? (vRated - vmin) / (vmax - vmin) : 0.62;
    const pos = (vmpNom - vmin) / Math.max(1, vmax - vmin);      // 0 = ติดพื้น, 1 = ติดเพดาน
    const headHot = (vmpHot - vmin) / Math.max(1, vmax - vmin);  // เหลือกันร้อนแค่ไหน
    const headCold = (maxVdc ? (maxVdc - vocCold) / maxVdc : 0.15);
    score = Math.round(100 * scClamp(1 - Math.abs(pos - aim) / Math.max(0.2, aim), 0, 1) * scClamp(headHot / 0.12, 0, 1) * scClamp(headCold / 0.08, 0, 1));
    band = score >= 75 ? "ดีมาก" : score >= 50 ? "ใช้ได้" : "พอไหว";
  }
  return { n, ok, checks, score, band, vocCold: scR(vocCold, 1), vmpHot: scR(vmpHot, 1), vmpCold: scR(vmpCold, 1), vmpNom: scR(vmpNom, 1),
    fails: checks.filter((c) => !c.ok).map((c) => c.msg) };
}

/* ไล่ทุกจำนวนแผงต่ออนุกรมที่เป็นไปได้ → { rows, min, max, best } */
function scSeriesRange(panel, inv, env) {
  const rows = [];
  const cap = Math.max(2, Math.ceil(scNum(inv.maxVdc, 1000) / Math.max(1, scNum(panel.voc, 40))) + 2);
  for (let n = 1; n <= Math.min(40, cap); n++) rows.push(scStringCheck(panel, inv, n, env));
  const okRows = rows.filter((r) => r.ok);
  const best = okRows.slice().sort((a, b) => b.score - a.score || b.n - a.n)[0] || null;
  return { rows, ok: okRows, min: okRows.length ? okRows[0].n : 0, max: okRows.length ? okRows[okRows.length - 1].n : 0,
    best: best ? best.n : 0, bestRow: best };
}

/* ── กระแสเข้าช่อง MPPT ──
   ดาต้าชีตอินเวอร์เตอร์แยกไว้ 2 ค่า ต้องเทียบคนละคู่กัน:
     maxInA  = กระแส "ทำงาน" สูงสุดต่อช่อง  → เทียบกับ Imp ของแผง × จำนวนสตริงขนาน
     maxIscA = กระแส "ลัดวงจร" สูงสุดต่อช่อง → เทียบกับ Isc × 1.25 × จำนวนสตริงขนาน
   (1.25 = ตัวคูณเผื่อแดดสะท้อน/แดดจัดเกิน 1000 W/m² ตามมาตรฐานการติดตั้ง) */
function scCurrent(panel, inv, nPar) {
  const n = Math.max(1, Math.round(nPar || 1));
  const imp = scNum(panel.imp), isc = scNum(panel.isc);
  const limIn = scNum(inv.maxInA);                                  // ต่อ 1 ขั้ว (1 สตริง)
  const limOp = scNum(inv.maxMpptA) || limIn * (n > 1 ? 1 : 1);     // ต่อ 1 ช่อง MPPT (ทุกสตริงรวมกัน)
  const limSc = scNum(inv.maxIscA);
  const opA = scR(imp * n, 2), scA = scR(isc * 1.25 * n, 2);
  const warns = [], notes = [];
  if (limIn && imp > limIn) warns.push("กระแสทำงานของ 1 สตริง " + scR(imp, 2) + " A เกินกระแสสูงสุดต่อ 1 ขั้ว (" + limIn + " A)");
  if (limOp && opA > limOp) warns.push("กระแสทำงานรวม " + opA + " A" + (n > 1 ? " (" + n + " สตริงขนาน)" : "") + " เกินกระแสเข้าสูงสุดต่อช่อง MPPT (" + limOp + " A)");
  if (limSc && scA > limSc) warns.push("กระแสลัดวงจร Isc×1.25 = " + scA + " A" + (n > 1 ? " (" + n + " สตริงขนาน)" : "") + " เกินพิกัดกระแสลัดวงจรต่อช่อง MPPT (" + limSc + " A)");
  if (!scNum(inv.maxMpptA) && limIn) notes.push("ยังไม่ได้ระบุ “กระแสสูงสุดต่อช่อง MPPT” — ดาต้าชีตแยกจาก “ต่อ 1 อินพุต” (เช่น 30 A ต่อ MPPT แต่ 23 A ต่ออินพุต) ระบบเลยใช้ค่าต่ออินพุตแทนไปก่อน");
  if (!limSc && isc) notes.push("ยังไม่ได้ระบุ “กระแสลัดวงจรสูงสุด/MPPT” ของอินเวอร์เตอร์ — กรอกจากดาต้าชีต ระบบจะได้ตรวจให้ครบ");
  return { opA, scA, limIn, limOp, limSc, impA: scR(imp, 2), n, warns, notes, ok: !warns.length };
}

/* จำนวนสตริงที่ขนานเข้า 1 MPPT ได้
   เพดานมี 2 ชั้น ต้องผ่านทั้งคู่:
     1) ชั้นกายภาพ — 1 ช่อง MPPT มีขั้ว DC ให้เสียบกี่สตริง (inv.strPerMppt · ปกติ 2 อินพุตต่อช่อง)
     2) ชั้นกระแส  — ขนานแล้วกระแสต้องไม่เกินพิกัดทำงาน/ลัดวงจรของช่อง */
function scStringsPerMppt(panel, inv) {
  const imp = scNum(panel.imp), isc = scNum(panel.isc);
  /* เพดานกระแสของ "ทั้งช่อง MPPT" — ถ้ายังไม่กรอกค่าต่อ MPPT ก็ใช้ค่าต่ออินพุตแทนไปก่อน (ระมัดระวังไว้ก่อน) */
  const limOp = scNum(inv.maxMpptA) || scNum(inv.maxInA), limSc = scNum(inv.maxIscA);
  let n = Math.max(1, Math.round(scNum(inv.strPerMppt, 2) || 2));
  if (imp && limOp) n = Math.min(n, Math.floor(limOp / imp));
  if (isc && limSc) n = Math.min(n, Math.floor(limSc / (isc * 1.25)));
  return Math.max(1, n);
}
/* ── ฟิวส์สตริง (string fuse) ──
   ขนานกัน 1–2 สตริง ไม่ต้องมีฟิวส์ เพราะถ้าสตริงหนึ่งลัดวงจร อีกเส้นเดียวป้อนกระแสย้อนได้ไม่เกินที่สายทน
   ตั้งแต่ 3 สตริงขึ้นไป สตริงที่เสียต้องรับกระแสย้อนจากเพื่อน (n−1) เส้นรวมกัน → ต้องมีฟิวส์ทุกเส้น
   (แนวเดียวกับ IEC 62548 / NEC 690.9) · พิกัดฟิวส์ที่นิยม = 1.5 × Isc ปัดขึ้นเป็นเบอร์มาตรฐาน
   และต้องไม่เกินพิกัดกระแสย้อนสูงสุดของแผง (module max series fuse rating บนดาต้าชีต) */
const SC_FUSE_SIZES = [10, 12, 15, 16, 20, 25, 30, 32];
function scStringFuse(panel, nPar, nStrings) {
  const n = Math.max(1, Math.round(nPar || 1));
  const isc = scNum(panel && panel.isc);
  const out = { need: n >= 3, nPar: n, count: 0, amp: 0, isc, limit: scNum(panel && panel.fuseA), warns: [], why: "" };
  if (!out.need) {
    out.why = n <= 1 ? "สตริงละช่อง ไม่มีการขนาน จึงไม่ต้องมีฟิวส์" : "ขนาน 2 สตริง ยังไม่ต้องมีฟิวส์ตามมาตรฐาน";
    return out;
  }
  out.count = Math.max(0, Math.round(nStrings || 0));
  out.why = "ขนาน " + n + " สตริงต่อ 1 ช่อง MPPT — สตริงที่ลัดวงจรจะรับกระแสย้อนจากอีก " + (n - 1) + " เส้น ต้องใส่ฟิวส์ทุกเส้น";
  if (isc) {
    const need = isc * 1.5;
    out.amp = SC_FUSE_SIZES.find((a) => a >= need) || Math.ceil(need);
    if (out.limit && out.amp > out.limit) out.warns.push("ฟิวส์ที่ต้องใช้ " + out.amp + " A เกินพิกัดฟิวส์สูงสุดของแผง (" + out.limit + " A) — ลดจำนวนสตริงที่ขนานลง");
  } else {
    out.warns.push("ยังไม่ทราบ Isc ของแผง จึงเลือกพิกัดฟิวส์ให้ไม่ได้");
  }
  return out;
}

/* ── ที่อยู่ของ "ขั้วที่เสียบสตริง" ──
   1 อินเวอร์เตอร์ มีหลายช่อง MPPT · 1 ช่อง MPPT มีขั้วให้เสียบหลายช่อง (input)
   จึงนับเป็น pin = ลำดับขั้วทั้งระบบ (นับ 0) แล้วถอดกลับเป็น INV / MPPT / ช่อง
   ตัวอย่างรุ่นที่มี 1 MPPT แต่เสียบได้ 2 ช่อง → pin 0 = INV1/MPPT1/ช่อง1 · pin 1 = INV1/MPPT1/ช่อง2 */
function scPinLayout(inv, nInv) {
  const mpptPerInv = Math.max(1, Math.round(scNum(inv.inputs, 2)));
  const phys = Math.max(1, Math.round(scNum(inv.strPerMppt, 2) || 2));   // ขั้วต่อ 1 ช่อง MPPT
  const n = Math.max(1, Math.round(scNum(nInv, 1)));
  return { mpptPerInv, phys, mppt: n * mpptPerInv, pins: n * mpptPerInv * phys, nInv: n };
}
function scPinAddr(pin, inv, nInv) {
  const L = scPinLayout(inv, nInv);
  const mppt = Math.floor(pin / L.phys);                                 // ช่อง MPPT ลำดับที่เท่าไหร่ทั้งระบบ
  return { pin, mppt, inv: Math.floor(mppt / L.mpptPerInv),
    mpptNo: mppt % L.mpptPerInv + 1, inNo: pin % L.phys + 1 };
}
/* ชื่อขั้วแบบอ่านออก → "INV1 / MPPT1 / ช่อง2" */
function scMpptName(pin, inv, nInv) {
  const a = scPinAddr(pin, inv, nInv);
  return "INV" + (a.inv + 1) + " / MPPT" + a.mpptNo + " / ช่อง" + a.inNo;
}

/* ── จัดสตริงอัตโนมัติ ──
   กติกา: แผงในสตริงเดียวกันต้องทิศ/มุมเดียวกัน (ไม่งั้นตัวที่ได้แดดน้อยฉุดทั้งสตริง)
          และพยายามไม่เอาคนละกลุ่มมาอยู่ MPPT เดียวกัน */
function scAutoStrings(groups, panel, inv, env, opt) {
  opt = opt || {};
  const R = scSeriesRange(panel, inv, env);
  const nInv = Math.max(1, Math.round(scNum(opt.invCount, 1)));
  const mpptPerInv = Math.max(1, Math.round(scNum(inv.inputs, 2)));
  const perMppt = scStringsPerMppt(panel, inv);
  const out = { strings: [], leftovers: [], warns: [], range: R, perMppt, mppt: nInv * mpptPerInv };
  if (!R.ok.length) {
    out.warns.push("แผงรุ่นนี้ต่ออนุกรมให้อยู่ในช่วงทำงานของอินเวอร์เตอร์รุ่นนี้ไม่ได้เลย — เปลี่ยนรุ่นใดรุ่นหนึ่ง");
    return out;
  }
  const sizes = R.ok.map((r) => r.n).sort((a, b) => b - a);      // ใหญ่ก่อน = สตริงน้อย กระแสรวมต่ำ
  (groups || []).forEach((g) => {
    let left = g.count;
    const pick = [];
    while (left > 0) {
      const s = sizes.find((n) => n <= left);
      if (!s) break;
      pick.push(s); left -= s;
    }
    /* เกลี่ยให้สตริงยาวใกล้เคียงกัน (ต่างกันมากทำให้ MPPT เสียเปรียบ) */
    if (pick.length > 1) {
      const tot = pick.reduce((a, b) => a + b, 0);
      const even = Math.floor(tot / pick.length);
      if (R.ok.some((r) => r.n === even)) {
        let rem = tot - even * pick.length;
        for (let i = 0; i < pick.length; i++) { pick[i] = even + (rem > 0 && R.ok.some((r) => r.n === even + 1) ? (rem--, 1) : 0); }
      }
    }
    pick.forEach((n) => out.strings.push({ n, groupKey: g.key, label: g.label, tilt: g.tilt, az: g.az,
      chk: scStringCheck(panel, inv, n, env) }));
    if (left > 0) out.leftovers.push({ group: g, left });
  });
  /* กระจายลง MPPT: กลุ่มเดียวกันอยู่ MPPT เดียวกันก่อน */
  let mi = 0, used = {};
  const byGroup = {};
  out.strings.forEach((s) => { (byGroup[s.groupKey] = byGroup[s.groupKey] || []).push(s); });
  Object.keys(byGroup).forEach((k) => {
    byGroup[k].forEach((s) => {
      while (mi < out.mppt && (used[mi] || 0) >= perMppt) mi++;
      if (mi >= out.mppt) { s.mppt = null; s.pin = null; return; }
      const LAY = scPinLayout(inv, nInv);
      s.mppt = mi; s.inv = Math.floor(mi / mpptPerInv);
      s.pin = mi * LAY.phys + Math.min(LAY.phys - 1, used[mi] || 0);
      s.addr = scMpptName(s.pin, inv, nInv);
      used[mi] = (used[mi] || 0) + 1;
    });
    mi++;                                                        // ขึ้นกลุ่มใหม่ = ขึ้น MPPT ใหม่
  });
  /* กระแสเข้าช่อง MPPT — คิดจากจำนวนสตริงที่ขนานเข้าช่องเดียวกันจริง */
  const parMax = Math.max(1, Math.max.apply(null, [1].concat(Object.keys(used).map((k) => used[k]))));
  out.mpptPerInv = mpptPerInv; out.load = used;
  out.fuse = scStringFuse(panel, parMax, out.strings.length);
  out.current = scCurrent(panel, inv, parMax);
  out.current.warns.forEach((w) => out.warns.push(w));
  out.notes = out.current.notes.slice();
  out.overCurrent = !out.current.ok;
  const noSlot = out.strings.filter((s) => s.mppt == null).length;
  if (noSlot) out.warns.push("มี " + noSlot + " สตริงที่ไม่มีช่อง MPPT เหลือ — เพิ่มจำนวนอินเวอร์เตอร์");
  out.leftovers.forEach((l) => out.warns.push(l.group.label + " เหลือ " + l.left + " แผงที่ต่อเป็นสตริงไม่ลงตัว (ย้ายไปผืนอื่น หรือใช้ออปติไมเซอร์)"));
  out.panels = out.strings.reduce((a, s) => a + s.n, 0);
  out.dcKw = scR(out.panels * scNum(panel.wp) / 1000, 2);
  out.acKw = scR(nInv * scNum(inv.kw), 2);
  out.dcAc = out.acKw ? scR(out.dcKw / out.acKw, 2) : 0;
  if (out.dcAc > 1.4) out.warns.push("DC/AC = " + out.dcAc + " สูงไป อินเวอร์เตอร์จะตัดยอด (clipping) ช่วงเที่ยง — เพิ่มขนาด/จำนวนอินเวอร์เตอร์");
  else if (out.dcAc && out.dcAc < 0.85) out.warns.push("DC/AC = " + out.dcAc + " ต่ำไป อินเวอร์เตอร์ใหญ่เกินแผง — ลดขนาดลงได้");
  return out;
}

/* ── แบ่งสตริงเองด้วยมือ ──
   assign = { "<roofId>|<panelKey>": <หมายเลขสตริง 1..n> } · แผงที่ยังไม่ได้กำหนดถือว่าลอย
   byPanel = แผงไหนอยู่กลุ่มทิศทางไหน (จาก scPanelIndex) ใช้เตือนเวลาเอาคนละทิศมาต่ออนุกรมกัน */
function scStringsFromAssign(assign, byPanel, groups, panel, inv, env, opt) {
  opt = opt || {};
  const gMap = {}; (groups || []).forEach((g) => { gMap[g.key] = g; });
  const bag = {};
  Object.keys(assign || {}).forEach((uid) => {
    const sid = assign[uid];
    if (!sid) return;
    (bag[sid] = bag[sid] || { id: sid, keys: [], gset: {} }).keys.push(uid);
    const gk = byPanel[uid];
    if (gk) bag[sid].gset[gk] = (bag[sid].gset[gk] || 0) + 1;
  });
  const nInv0 = Math.max(1, Math.round(scNum(opt.invCount, 1)));
  const LAY = scPinLayout(inv, nInv0);
  const mpptPerInv = LAY.mpptPerInv, slots0 = LAY.mppt, perMppt0 = scStringsPerMppt(panel, inv);
  const strings = Object.keys(bag).sort((a, b) => a - b).map((sid) => {
    const b = bag[sid];
    const gks = Object.keys(b.gset);
    const main = gks.sort((x, y) => b.gset[y] - b.gset[x])[0];
    const g = gMap[main] || {};
    const chk = scStringCheck(panel, inv, b.keys.length, env);
    const mixed = gks.length > 1;
    return { id: +sid, n: b.keys.length, keys: b.keys, groupKey: main, mixed, groupCount: gks.length,
      label: (g.label || "—") + (mixed ? " + อีก " + (gks.length - 1) + " ทิศ" : ""),
      tilt: g.tilt, az: g.az, chk, pin: null, mppt: null, inv: null, addr: "", picked: false };
  });
  const warns = [];
  /* ── ลงขั้ว (pin) ──
     ที่ผู้ใช้ปักเองไว้ลงก่อน (opt.mpptPick = { สตริงที่: ขั้วที่ }) ที่เหลือค่อยไล่ลงขั้วที่ยังว่าง
     ขั้วเดียวเสียบได้สตริงเดียว · ส่วนจำนวนสตริงที่ "ขนานเข้า 1 MPPT" ได้ ถูกจำกัดด้วยกระแสอีกชั้น */
  const pick = opt.mpptPick || {};
  const load = {}, owner = {};
  const place = (s, pin) => {
    const a = scPinAddr(pin, inv, nInv0);
    s.pin = pin; s.mppt = a.mppt; s.inv = a.inv; s.addr = scMpptName(pin, inv, nInv0);
    load[a.mppt] = (load[a.mppt] || 0) + 1;
    (owner[pin] = owner[pin] || []).push(s.id);
  };
  strings.forEach((s) => {
    const p = pick[s.id];
    if (p == null || p === "") return;
    const pin = Math.round(+p);
    if (!(pin >= 0 && pin < LAY.pins)) return;
    s.picked = true; place(s, pin);
  });
  strings.forEach((s) => {
    if (s.pin != null) return;
    let pin = 0;
    /* ข้ามขั้วที่มีคนจองแล้ว และข้ามช่อง MPPT ที่รับกระแสขนานเพิ่มไม่ไหวแล้ว */
    while (pin < LAY.pins && (owner[pin] || (load[Math.floor(pin / LAY.phys)] || 0) >= perMppt0)) pin++;
    if (pin >= LAY.pins) return;
    place(s, pin);
  });
  Object.keys(owner).forEach((k) => {
    if (owner[k].length > 1) warns.push(scMpptName(+k, inv, nInv0) + " ถูกจองซ้ำ " + owner[k].length + " สตริง (#" + owner[k].join(", #") + ") — 1 ขั้วเสียบได้สตริงเดียว");
  });
  Object.keys(load).forEach((k) => {
    if (load[k] > perMppt0) warns.push("MPPT ที่ " + (+k % mpptPerInv + 1) + " ของอินเวอร์เตอร์ตัวที่ " + (Math.floor(+k / mpptPerInv) + 1) +
      " มี " + load[k] + " สตริงขนานกัน เกินที่ช่องนี้รับได้ (" + perMppt0 + " สตริง/MPPT)");
  });
  const noSlot = strings.filter((s) => s.pin == null).length;
  if (noSlot) warns.push("มี " + noSlot + " สตริงที่ไม่มีขั้วเหลือให้เสียบ — เพิ่มจำนวนอินเวอร์เตอร์ หรือย้ายขั้วเอง");
  strings.forEach((s) => {
    if (s.mixed) warns.push("สตริง #" + s.id + " มีแผงจาก " + s.groupCount + " ทิศ/มุมปนกัน — แผงที่ได้แดดน้อยจะฉุดทั้งสตริง แยกออกจากกันดีกว่า");
    if (!s.chk.ok) warns.push("สตริง #" + s.id + " (" + s.n + " แผง) " + s.chk.fails.join(" · "));
  });
  const total = (opt.totalPanels || 0);
  const assigned = strings.reduce((a, s) => a + s.n, 0);
  if (total && assigned < total) warns.push("ยังมีแผงที่ไม่ได้อยู่สตริงไหนเลย " + (total - assigned) + " แผง");
  const nInv = nInv0, slots = slots0, perMppt = perMppt0;
  /* กระแสเข้าช่อง MPPT — นับสตริงที่ลงช่องเดียวกันว่าขนานกันกี่เส้น */
  const parMax = Math.max(1, Math.max.apply(null, [1].concat(Object.keys(load).map((k) => load[k]))));
  const current = scCurrent(panel, inv, parMax);
  current.warns.forEach((w) => warns.push(w));
  const fuse = scStringFuse(panel, parMax, strings.length);
  if (fuse.need) warns.push("ต้องมีฟิวส์สตริง " + fuse.count + " ตัว" + (fuse.amp ? " (" + fuse.amp + " A)" : "") + " — " + fuse.why);
  fuse.warns.forEach((w) => warns.push(w));
  const dcKw = scR(assigned * scNum(panel.wp) / 1000, 2), acKw = scR(nInv * scNum(inv.kw), 2);
  if (acKw && dcKw / acKw > 1.4) warns.push("DC/AC = " + scR(dcKw / acKw, 2) + " สูงไป อินเวอร์เตอร์จะตัดยอด (clipping) ช่วงเที่ยง — เพิ่มขนาด/จำนวนอินเวอร์เตอร์");
  return { strings, warns, notes: current.notes, current, panels: assigned, dcKw, acKw, dcAc: acKw ? scR(dcKw / acKw, 2) : 0,
    range: scSeriesRange(panel, inv, env), perMppt, mppt: slots, mpptPerInv, pins: LAY.pins, phys: LAY.phys,
    load, owner, nInv, fuse, manual: true };
}

/* สร้าง assign map ตั้งต้นจากการจัดอัตโนมัติ (ผู้ใช้จะได้แก้ต่อจากของที่ใช้ได้อยู่แล้ว) */
function scAutoAssign(footPanels, byPanel, groups, panel, inv, env, opt) {
  const plan = scAutoStrings(groups, panel, inv, env, opt);
  const byGroup = {};
  (footPanels || []).forEach((f) => { const g = byPanel[f.uid]; if (g) (byGroup[g] = byGroup[g] || []).push(f.uid); });
  const assign = {}; let sid = 0;
  plan.strings.forEach((s) => {
    const pool = byGroup[s.groupKey] || [];
    sid++;
    for (let i = 0; i < s.n && pool.length; i++) assign[pool.shift()] = sid;
  });
  return assign;
}

/* ── จัดแผงเข้า "ตัวไมโคร" อัตโนมัติ ──
   ไมโคร 1 ตัวรับแผง per ใบ และแผงที่อยู่ตัวเดียวกันต้องอยู่กลุ่มทิศ/มุมเดียวกัน
   จับคู่แผงที่อยู่ "ติดกันจริงบนหลังคา" (เรียงตามแถวแล้วตามคอลัมน์) สายจะได้สั้นและเดินตามผังง่าย
   คืน { assign: { uid: หมายเลขตัว }, units: [{ id, gk, uids[], n }] } */
function scMicroAssign(panels, byPanel, groups, per) {
  const P = Math.max(1, Math.round(per || 1));
  const assign = {}, units = [];
  (groups || []).forEach((g) => {
    const mine = (panels || []).filter((p) => byPanel[p.uid] === g.key);
    /* เรียงเป็นแถวก่อน (แกน z = เหนือ→ใต้) แล้วค่อยซ้าย→ขวา ในแถวเดียวกัน
       เผื่อความคลาดเคลื่อนของ z เล็กน้อยด้วยการปัดเป็นช่วงละ 0.5 ม. */
    mine.sort((a, b) => (Math.round(a.cz * 2) - Math.round(b.cz * 2)) || (a.cx - b.cx));
    for (let i = 0; i < mine.length; i += P) {
      const chunk = mine.slice(i, i + P);
      const id = units.length + 1;
      chunk.forEach((p) => { assign[p.uid] = id; });
      units.push({ id, gk: g.key, gLabel: g.label, uids: chunk.map((p) => p.uid), n: chunk.length, full: chunk.length === P });
    }
  });
  return { assign, units };
}

/* ── แบ่งไมโครลงเฟส (ระบบ 3 เฟส) ──
   ไมโครแทบทุกรุ่นเป็นอุปกรณ์ 1 เฟส พอเอาเข้าระบบ 3 เฟสจึงต้องกระจายตัวลง L1/L2/L3 เอง
   ให้กำลังแต่ละเฟสใกล้เคียงกันที่สุด (เช่น 10 ตัว → 4/3/3) ไม่งั้นเฟสที่หนักจะแรงดันตกกว่าเพื่อน
   วิธี: เรียงตัวที่กำลังมากไปน้อย แล้วหย่อนลงเฟสที่เบาที่สุดทีละตัว (greedy — ได้ผลต่างน้อยสุดเสมอ
   เมื่อทุกตัวกำลังเท่ากัน และเข้าใกล้ค่าที่ดีที่สุดเมื่อกำลังไม่เท่ากัน)
   override = { <หมายเลขตัว>: เฟส 1..n } สำหรับกรณีช่างอยากย้ายเฟสเอง
   คืน [{ phase, label, units[], count, panels, dcW, acW, amps, branches }] */
function scMicroPhases(units, opt) {
  opt = opt || {};
  const n = Math.max(1, Math.round(scNum(opt.phases, 1)));
  const wp = scNum(opt.wp);
  const acWEach = scNum(opt.acW);
  const acV = scNum(opt.acV, 230);
  const perBranch = Math.max(0, Math.round(scNum(opt.perBranch)));
  const ov = opt.override || {};
  const L = ["L1", "L2", "L3"];
  const bins = [];
  for (let i = 0; i < n; i++) bins.push({ phase: i + 1, label: n > 1 ? (L[i] || "L" + (i + 1)) : "1 เฟส", units: [], panels: 0 });

  const list = (units || []).slice();
  /* ตัวที่ช่างระบุเฟสไว้เองต้องลงตามนั้นก่อน แล้วค่อยเกลี่ยที่เหลือรอบ ๆ */
  const rest = [];
  list.forEach((u) => {
    const p = Math.round(scNum(ov[u.id], 0));
    if (p >= 1 && p <= n) { bins[p - 1].units.push(u); bins[p - 1].panels += u.n; }
    else rest.push(u);
  });
  rest.sort((a, b) => b.n - a.n || a.id - b.id);
  rest.forEach((u) => {
    /* เฟสที่เบาที่สุด — เท่ากันให้เอาเฟสซ้ายสุด ผลลัพธ์จะได้คงที่ ไม่สลับไปมาทุกครั้งที่คำนวณ */
    let best = bins[0];
    for (let i = 1; i < bins.length; i++) if (bins[i].panels < best.panels) best = bins[i];
    best.units.push(u); best.panels += u.n;
  });

  return bins.map((b) => {
    b.units.sort((x, y) => x.id - y.id);
    const acW = b.units.length * acWEach;
    return { phase: b.phase, label: b.label, units: b.units, count: b.units.length, panels: b.panels,
      dcW: scR(b.panels * wp, 0), acW: scR(acW, 0), acKw: scR(acW / 1000, 2),
      amps: acV ? scR(acW / acV, 1) : 0,
      branches: perBranch ? Math.ceil(b.units.length / perBranch) : 0 };
  });
}

/* สรุปความสมดุลของเฟส — ต่างกันกี่ตัว/กี่ % และผ่านเกณฑ์ที่ตั้งไว้ไหม */
function scPhaseBalance(bins, tolPct) {
  const tol = scNum(tolPct, 10);
  if (!bins || bins.length < 2) return { ok: true, spread: 0, pct: 0, maxCount: 0, minCount: 0 };
  const cs = bins.map((b) => b.count), ws = bins.map((b) => b.dcW);
  const maxW = Math.max.apply(null, ws), minW = Math.min.apply(null, ws);
  const pct = maxW > 0 ? scR((maxW - minW) / maxW * 100, 1) : 0;
  return { ok: pct <= tol, spread: Math.max.apply(null, cs) - Math.min.apply(null, cs), pct,
    maxCount: Math.max.apply(null, cs), minCount: Math.min.apply(null, cs), tol };
}

/* สเปคไมโครที่ใช้จริง = คลัง → ค่าที่แก้ทับเฉพาะงาน (ลำดับเดียวกับ scInvSpec) */
const SC_MICRO_EXTRA = { perInverter: 1, mppt: 1, maxVdc: 60, mpptVmin: 16, mpptVmax: 60,
  maxInA: 14, maxIscA: 18, wpMin: 0, wpMax: 0, acW: 0, acWPeak: 0, acV: 230, outA: 0, perBranch: 0, eff: 96.5 };

function scMicroSpec(sys) {
  const B = window.BOQ || {};
  const ratio = (sys && sys.microRatio) || "";
  const stock = (B.MICRO || []).find((m) => m.ratio === ratio) || (B.MICRO || [])[0] || {};
  return Object.assign({}, SC_MICRO_EXTRA, stock, (sys && sys.micro) || {});
}

/* จำนวนแผงต่อ 1 ช่อง MPPT — ตัวเลขนี้คือหัวใจของไมโคร
   1 = ทุกแผงมี MPPT ของตัวเอง เงาบังใบไหนเสียเฉพาะใบนั้น (รุ่นในตลาดเป็นแบบนี้เกือบทั้งหมด
   แม้เป็นรุ่น 2 แผงต่อตัว เพราะให้ MPPT มา 2 ช่องอิสระ) */
function scMicroPerMppt(mi) {
  const per = Math.max(1, Math.round(scNum(mi.perInverter, 1)));
  const nM = Math.max(1, Math.round(scNum(mi.mppt, per)));
  return Math.max(1, Math.ceil(per / nM));
}

/* ── ไมโครอินเวอร์เตอร์: ตรวจสเปคไฟฟ้าแบบเดียวกับสตริง ──
   มอง 1 ช่อง MPPT = 1 สตริงสั้น ๆ ที่มีแผงกี่ใบก็ตามที่ต่ออนุกรมเข้าช่องนั้น
   (1:1 → สตริงละ 1 แผง · 2:1 ที่มี MPPT 2 ช่อง → ก็ยังสตริงละ 1 แผง)
   กติกา 2:1 คือแผง 2 แผงที่ต่อตัวเดียวกันต้องอยู่ทิศ/มุมเดียวกัน จึงคิดแยกรายกลุ่ม */
function scMicroPlan(groups, panel, micros, env, sys) {
  const wp = scNum(panel.wp);
  const total = (groups || []).reduce((a, g) => a + g.count, 0);
  return (micros || []).map((raw) => {
    /* ถ้ารุ่นนี้คือรุ่นที่ผู้ใช้เลือกอยู่ ให้ค่าที่แก้ทับเองมีผลด้วย */
    const m = Object.assign({}, SC_MICRO_EXTRA, raw,
      (sys && sys.microRatio === raw.ratio && sys.micro) ? sys.micro : {});
    const per = Math.max(1, Math.round(scNum(m.perInverter, 1)));
    const nSeries = scMicroPerMppt(m);                          // แผงอนุกรมต่อ 1 ช่อง MPPT
    const nMppt = Math.max(1, Math.round(scNum(m.mppt, per)));
    const acW = scNum(m.acW) || scNum((/(\d+(?:\.\d+)?)\s*w/i.exec(m.model || "") || [])[1]) || per * 400;
    let units = 0, odd = 0;
    (groups || []).forEach((g) => {
      units += Math.ceil(g.count / per);
      if (per > 1 && g.count % per) odd++;                       // กลุ่มที่เหลือแผงเดี่ยว ต้องใช้ตัวนั้นแค่ครึ่งเดียว
    });
    const dcAc = acW ? scR(wp * per / acW, 2) : 0;
    const warns = [], notes = [];

    /* ── ตรวจแรงดัน/กระแสเข้า 1 ช่อง MPPT ── */
    const chk = scStringCheck(panel, m, nSeries, env);
    chk.checks.forEach((c) => { if (!c.ok) warns.push(c.msg); });
    const cur = scCurrent(panel, m, 1);
    cur.warns.forEach((w) => warns.push(w));
    /* ไม่เอา cur.notes มาใช้ — ข้อความนั้นเขียนไว้สำหรับสตริงอินเวอร์เตอร์ (อ้างพิกัด 20–30 A)
       ไมโครมีคำแนะนำของตัวเองด้านล่าง */

    /* ── ช่วงกำลังแผงที่รุ่นนี้รองรับ ── */
    const wpMin = scNum(m.wpMin), wpMax = scNum(m.wpMax);
    if (wp && wpMin && wp < wpMin) warns.push("แผง " + wp + " W เล็กกว่าช่วงที่ไมโครรุ่นนี้รองรับ (" + wpMin + "–" + wpMax + " W)");
    if (wp && wpMax && wp > wpMax) warns.push("แผง " + wp + " W ใหญ่กว่าช่วงที่ไมโครรุ่นนี้รองรับ (" + wpMin + "–" + wpMax + " W)");

    if (dcAc > 1.5) warns.push("DC/AC ต่อตัว " + dcAc + " สูงมาก แผงแรงเกินไมโครรุ่นนี้ ช่วงเที่ยงจะตัดยอดทิ้ง");
    else if (dcAc && dcAc < 0.9) notes.push("DC/AC ต่อตัว " + dcAc + " ต่ำ ไมโครใหญ่เกินแผง จ่ายแพงโดยไม่ได้ผลผลิตเพิ่ม");
    if (odd) notes.push("มี " + odd + " กลุ่มที่จำนวนแผงเป็นเลขคี่ → ไมโคร " + odd + " ตัวจะเสียบแค่ช่องเดียว");

    /* ── วงจรย่อย AC: ไมโครต่อพ่วงกันบนสายเส้นเดียว จำกัดจำนวนตัวต่อวงจร ── */
    const perBranch = Math.max(0, Math.round(scNum(m.perBranch)));
    const branches = perBranch ? Math.ceil(units / perBranch) : 0;
    if (!perBranch) notes.push("ยังไม่ได้ระบุ “ต่อพ่วงได้กี่ตัวต่อวงจร” ของไมโครรุ่นนี้ — กรอกจากดาต้าชีตแล้วระบบจะบอกจำนวนวงจร AC ให้");
    if (!scNum(m.maxInA) && !scNum(m.maxIscA)) notes.push("ยังไม่ได้กรอกพิกัดกระแสเข้าของไมโครรุ่นนี้ — กรอก “กระแสทำงาน/ลัดวงจรสูงสุดต่อช่อง” จากดาต้าชีต ระบบจะได้ตรวจให้ครบเหมือนสตริงอินเวอร์เตอร์");
    if (!wpMin && !wpMax) notes.push("ยังไม่ได้กรอกช่วงกำลังแผงที่ไมโครรุ่นนี้รองรับ — สำคัญมากกับแผงกำลังสูง เพราะแผงใหญ่เกินพิกัดจะถูกตัดยอดทิ้งทั้งวัน");
    const outA = scNum(m.outA) || (scNum(m.acV, 230) ? scR(acW / scNum(m.acV, 230), 2) : 0);

    /* คะแนนเลือกอัตโนมัติ = ใช้ไมโครน้อยตัวที่สุด "เท่าที่ยังไม่ตัดยอดและสเปคไฟฟ้าผ่าน" */
    const fewer = total > 0 ? (1 - units / total) * 40 : 0;         // 2:1 ได้ 20 · 1:1 ได้ 0
    const clipPen = Math.max(0, (dcAc || 0) - 1.25) * 120;
    const failPen = chk.ok && cur.ok ? 0 : 200;                     // สเปคไฟฟ้าไม่ผ่าน = ห้ามแนะนำ
    const why = failPen ? "สเปคไฟฟ้าไม่ผ่าน"
      : clipPen > 8 ? "แผงแรงเกินไมโคร จะตัดยอดทิ้ง"
      : (per > 1 ? "ใช้ไมโครน้อยกว่าครึ่ง โดยแทบไม่ตัดยอด" : "แผงทุกใบมีตัวแปลงของตัวเอง ยืดหยุ่นที่สุด");
    return { ratio: m.ratio, model: m.model, per, nMppt, nSeries, acW, acWPeak: scNum(m.acWPeak) || acW,
      acV: scNum(m.acV, 230), outA, perBranch, branches, eff: scNum(m.eff, 96.5),
      units, total, dcAc, odd, warns, notes, why, spec: m, chk, cur, ok: chk.ok && cur.ok,
      acKw: scR(units * acW / 1000, 2), dcKw: scR(total * wp / 1000, 2),
      acAmpTotal: scR(units * outA, 1),
      score: Math.round(60 + fewer - clipPen - failPen - odd * 4) };
  }).sort((a, b) => b.score - a.score);
}

/* ============================================================
   โมเดลพลังงาน — คิดแดดที่ตกบน "ระนาบเอียงจริง" ของแต่ละกลุ่มแผง
   ท้องฟ้าใส (Haurwitz) × สัดส่วนเมฆรายเดือน → แยกลำแสงตรง/กระจาย (Erbs)
   → ฉายลงระนาบเอียง (isotropic + แสงสะท้อนพื้น) → หักอุณหภูมิเซลล์ + ค่าสูญเสีย
   ============================================================ */
function scDiffuseFrac(kt) {
  if (kt <= 0.22) return 1 - 0.09 * kt;
  if (kt <= 0.80) return 0.9511 - 0.1604 * kt + 4.388 * kt * kt - 16.638 * Math.pow(kt, 3) + 12.336 * Math.pow(kt, 4);
  return 0.165;
}

/* ── อุณหภูมิเซลล์: โมเดล Sandia ตามวิธียึดแผงจริง ──
   ที่นี่คือ "แหล่งความจริงเดียว" ของทั้งตัวคิดผลผลิตรายปีและตัวคำนวณเส้น I-V
   เดิมสองที่ใช้คนละสูตร (รายปีใช้ NOCT ที่สมมติว่ายกลอยมีลมผ่าน) ทำให้งานที่ยึดชิดหลังคา
   ประเมินผลผลิตสูงเกินจริง เพราะของจริงเซลล์ร้อนกว่าที่ NOCT บอกหลายองศา
   Tหลังแผง = G·exp(a + b·ลม) + Tอากาศ  ·  Tเซลล์ = Tหลังแผง + G/1000·dT */
const SC_MOUNT = {
  close:  { a: -2.98, b: -0.0471, dT: 1, label: "ยึดชิดหลังคา", note: "ระบายอากาศหลังแผงได้น้อย ความร้อนสะสมสูงสุด" },
  rack:   { a: -3.56, b: -0.0750, dT: 3, label: "ยกสูงจากหลังคา", note: "มีช่องลมผ่านหลังแผง ระบายความร้อนได้ดีกว่า" },
  ground: { a: -3.58, b: -0.1130, dT: 3, label: "ขาตั้งบนพื้น/โล่ง", note: "ลมผ่านได้รอบตัว เย็นที่สุด" },
};
const SC_WIND = 1;                                              // ลมเฉลี่ยที่หน้างานบนหลังคา (m/s)
function scTcell(poa, tAmb, wind, mount) {
  const M = SC_MOUNT[mount] || SC_MOUNT.close;
  const G = Math.max(0, scNum(poa, 0)), ws = Math.max(0, scNum(wind, SC_WIND));
  return G * Math.exp(M.a + M.b * ws) + scNum(tAmb, 32) + G / 1000 * M.dT;
}

/* ── การสะท้อนที่ผิวกระจกตามมุมตกกระทบ (IAM – ASHRAE) ──
   แดดเฉียงมากยิ่งสะท้อนทิ้งมาก ตอนเช้า/เย็นจึงได้ไฟน้อยกว่าที่ความเข้มแสงบอก
   ใช้เฉพาะกับแสงตรง (beam) ส่วนแสงกระจายมาจากทั่วท้องฟ้าใช้ค่าคงที่โดยประมาณ */
const SC_B0 = 0.05;                                             // ค่ากลางกระจกโซลาร์เคลือบกันสะท้อน
function scIam(cosAoi) {
  if (cosAoi <= 0) return 0;
  if (cosAoi >= 1) return 1;
  return Math.max(0, 1 - SC_B0 * (1 / cosAoi - 1));
}
const SC_IAM_DIFF = 0.97;                                       // แสงกระจาย/สะท้อนพื้น: เฉลี่ยทุกมุมทั่วโดมท้องฟ้าแล้ว

/* พลังงานรายปีของ "1 กลุ่มทิศทาง" ต่อกำลังติดตั้ง 1 kWp → { kwh, poa, monthly[12] } */
function scYearOneGroup(tilt, az, o) {
  const lat = scNum(o.lat, 13.75), lng = scNum(o.lng, 100.5);
  const tamb = o.tamb || SC_TAMB, kc = o.kc || SC_KC;
  const tcP = scNum(o.tcPmax, SC_PANEL_EXTRA.tcPmax);
  const alb = scNum(o.albedo, SC_ENV.albedo);
  const mount = o.mount || "close", wind = scNum(o.wind, SC_WIND);
  const bT = tilt * SC_DEG, cosB = Math.cos(bT), sinB = Math.sin(bT);
  const dt = 0.5;                                                 // ก้าวเวลา 30 นาที
  const mon = new Array(12).fill(0), monPoa = new Array(12).fill(0);
  let doy = 0;
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < SC_MDAYS[m]; d++) {
      doy++;
      for (let h = 4; h < 20; h += dt) {
        const s = scSunPos(lat, lng, doy, h);
        if (s.alt <= 1) continue;
        const sa = Math.sin(s.alt * SC_DEG);
        const ghiClear = 1098 * sa * Math.exp(-0.057 / sa);        // W/m² ท้องฟ้าใส
        const ghi = ghiClear * kc[m];
        const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * doy / 365)) * sa;
        const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
        const dhi = ghi * scDiffuseFrac(kt);
        const dni = sa > 0.01 ? Math.max(0, (ghi - dhi) / sa) : 0;
        const cosAoi = cosB * sa + sinB * Math.cos(s.alt * SC_DEG) * Math.cos((s.az - az) * SC_DEG);
        const beam = Math.max(0, dni * cosAoi), sky = dhi * (1 + cosB) / 2, gnd = ghi * alb * (1 - cosB) / 2;
        const poa = beam + sky + gnd;                              // แสงที่ตกถึงหน้าแผง (ก่อนหักการสะท้อน)
        if (poa <= 0) continue;
        /* แสงที่ "เข้าไปถึงเซลล์" จริง — หักส่วนที่สะท้อนกลับที่ผิวกระจกตามมุมตกกระทบ */
        const poaEff = beam * scIam(cosAoi) + (sky + gnd) * SC_IAM_DIFF;
        const tCell = scTcell(poa, tamb[m], wind, mount);
        const dcW = poaEff / 1000 * 1000 * (1 + tcP / 100 * (tCell - 25));   // ต่อ 1 kWp
        mon[m] += Math.max(0, dcW) * dt / 1000;                    // kWh
        monPoa[m] += poa * dt / 1000;
      }
    }
  }
  const kwh = mon.reduce((a, b) => a + b, 0);
  return { kwh, poa: monPoa.reduce((a, b) => a + b, 0), monthly: mon, monthlyPoa: monPoa };
}

/* กำลัง DC ต่อ 1 kWp ณ เวลาหนึ่ง (W) — แยกออกมาเพื่อให้รวมทุกกลุ่มในลูปเดียวกันได้ */
function scDcAt(tilt, az, sun, m, o) {
  const sa = Math.sin(sun.alt * SC_DEG);
  if (sa <= 0.017) return { dc: 0, poa: 0 };
  const kc = (o.kc || SC_KC)[m], tamb = (o.tamb || SC_TAMB)[m];
  const ghi = 1098 * sa * Math.exp(-0.057 / sa) * kc;
  const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * o.doy / 365)) * sa;
  const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
  const dhi = ghi * scDiffuseFrac(kt);
  const dni = Math.max(0, (ghi - dhi) / sa);
  const bT = tilt * SC_DEG, cosB = Math.cos(bT), sinB = Math.sin(bT);
  const cosAoi = cosB * sa + sinB * Math.cos(sun.alt * SC_DEG) * Math.cos((sun.az - az) * SC_DEG);
  const beam = Math.max(0, dni * cosAoi), sky = dhi * (1 + cosB) / 2, gnd = ghi * scNum(o.albedo, SC_ENV.albedo) * (1 - cosB) / 2;
  const poa = beam + sky + gnd;
  if (poa <= 0) return { dc: 0, poa: 0 };
  const poaEff = beam * scIam(cosAoi) + (sky + gnd) * SC_IAM_DIFF;
  const tCell = scTcell(poa, tamb, o.wind, o.mount);
  const dc = Math.max(0, poaEff * (1 + scNum(o.tcPmax, SC_PANEL_EXTRA.tcPmax) / 100 * (tCell - 25)));   // W ต่อ 1 kWp
  return { dc, poa, tCell };
}

/* ── พลังงานทั้งระบบ ──
   เดินเวลาทีละครึ่งชั่วโมงตลอดปี รวมกำลังของทุกกลุ่มทิศทางในเวลาเดียวกัน
   แล้วค่อยหักค่าสูญเสีย → คูณประสิทธิภาพอินเวอร์เตอร์ → "ตัดยอด" ที่ขนาด AC จริง
   (ตัดยอดต้องคิดรายชั่วโมง ไม่ใช่คิดเป็น % จาก DC/AC เพราะมันตัดเฉพาะช่วงแดดแรง) */
function scEnergy(groups, panel, sys) {
  sys = sys || {};
  const loss = Object.assign({}, SC_LOSS, sys.loss || {});
  const wp = scNum(panel.wp, 650);
  const o = { lat: sys.lat, lng: sys.lng, tamb: sys.tamb, kc: sys.kc, albedo: sys.albedo,
    mount: sys.mount || "close", wind: sys.wind,
    noct: scNum(panel.noct, SC_PANEL_EXTRA.noct), tcPmax: scNum(panel.tcPmax, SC_PANEL_EXTRA.tcPmax) };
  /* เงาบัง: ถ้ามีผลคำนวณจากโมเดล 3 มิติรายกลุ่ม (shadeByGroup) ใช้ตัวนั้นแทนค่า % ที่กรอกมือ
     เพราะแต่ละกลุ่มโดนบังไม่เท่ากัน — เฉลี่ยรวมทั้งระบบจะทำให้กลุ่มที่โดนหนักดูดีเกินจริง */
  const shg = sys.shadeByGroup || null;
  const dcLoss = (1 - loss.soil / 100) * (1 - loss.mismatch / 100) * (1 - loss.wire / 100) * (1 - loss.avail / 100)
    * (shg ? 1 : (1 - loss.shade / 100));
  const eff = scNum(sys.invEff, SC_INV_EXTRA.eff) / 100;
  const acKw = scNum(sys.acKw, 0);
  const gs = (groups || []).filter((g) => g.count > 0).map((g) => ({ g, kwp: g.count * wp / 1000, kwh: 0, poa: 0,
    sf: shg ? 1 - scClamp(scNum(shg[g.key], 0), 0, 100) / 100 : 1 }));
  const dcKw = gs.reduce((a, x) => a + x.kwp, 0);
  const lat = scNum(sys.lat, 13.75), lng = scNum(sys.lng, 100.5), dt = 0.5;
  const monthly = new Array(12).fill(0);
  let gross = 0, net = 0, poaSum = 0, doy = 0;
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < SC_MDAYS[m]; d++) {
      doy++; o.doy = doy;
      for (let h = 4; h < 20; h += dt) {
        const sun = scSunPos(lat, lng, doy, h);
        if (sun.alt <= 1) continue;
        let dcW = 0;
        for (let i = 0; i < gs.length; i++) {
          const r = scDcAt(gs[i].g.tilt, gs[i].g.az, sun, m, o);
          if (!r.dc) continue;
          const dcG = r.dc * gs[i].sf;                               // หักเงาของกลุ่มนี้
          const kwh = dcG * gs[i].kwp * dt / 1000;
          gs[i].kwh += kwh; gs[i].poa += r.poa * dt / 1000;
          dcW += dcG * gs[i].kwp;                                    // W (รวมทั้งระบบ)
          poaSum += r.poa * gs[i].kwp * dt / 1000;
          gross += kwh;
        }
        if (dcW <= 0) continue;
        let acKwNow = dcW / 1000 * dcLoss * eff;
        if (acKw > 0 && acKwNow > acKw) acKwNow = acKw;              // ← ตัดยอดจริงตรงนี้
        net += acKwNow * dt;
        monthly[m] += acKwNow * dt;
      }
    }
  }
  const dcAc = acKw > 0 ? dcKw / acKw : 0;
  const beforeClip = gross * dcLoss * eff;
  const perGroup = gs.map((x) => Object.assign({}, x.g, { kwp: scR(x.kwp, 2),
    kwhPerKwp: Math.round(x.kwh / (x.kwp || 1)), kwh: Math.round(x.kwh), poa: scR(x.poa / (x.kwp || 1), 0),
    shade: scR((1 - x.sf) * 100, 1) }));
  return {
    perGroup, dcKw: scR(dcKw, 2), acKw, dcAc: scR(dcAc, 2),
    annual: Math.round(net), monthly: monthly.map((v) => Math.round(v)),
    perKwp: dcKw ? Math.round(net / dcKw) : 0,
    poaPerKwp: dcKw ? scR(poaSum / dcKw, 0) : 0,
    pr: poaSum ? scR(net / poaSum * 100, 1) : 0,                    // Performance Ratio (%)
    clipLoss: beforeClip > 0 ? scR((1 - net / beforeClip) * 100, 1) : 0,
    clipKwh: Math.round(Math.max(0, beforeClip - net)),
    dcLoss: scR((1 - dcLoss) * 100, 1), eff: scR(eff * 100, 1),
    mount: o.mount, mountLabel: (SC_MOUNT[o.mount] || SC_MOUNT.close).label, wind: scNum(o.wind, SC_WIND),
    shadeMode: shg ? "model" : "manual",
    shadeLoss: shg ? scR(gs.reduce((a, x) => a + (1 - x.sf) * x.kwp, 0) / (dcKw || 1) * 100, 1) : scR(scNum(loss.shade, 0), 1),
  };
}

/* ── ผลผลิต 15 ปี (หรือ n ปี) ตามค่าเสื่อมของแผง ── */
function scLife(annual, panel, years) {
  const y = Math.max(1, Math.round(years || 15));
  const d1 = scNum(panel.deg1, SC_PANEL_EXTRA.deg1) / 100, dy = scNum(panel.degY, SC_PANEL_EXTRA.degY) / 100;
  const rows = []; let total = 0;
  for (let i = 1; i <= y; i++) {
    const factor = (1 - d1) * Math.pow(1 - dy, i - 1);
    const kwh = Math.round(annual * factor);
    total += kwh;
    rows.push({ year: i, factor: scR(factor * 100, 1), kwh });
  }
  return { rows, total, years: y, avg: Math.round(total / y), lastPct: rows[rows.length - 1].factor };
}

/* ── สเปคเริ่มต้นของระบบ (เก็บลง state ของโหมด 3D) ── */
function scBlankSys() {
  return {
    mode: "string",            // string | micro
    panelModel: "", panel: {}, // panel = ค่าที่แก้ทับคลัง (เฉพาะงานนี้)
    invModel: "", inv: {}, invCount: 1,
    microRatio: "",
    series: 0,                 // 0 = ให้ระบบเลือกให้
    assign: {}, manual: false, // { "<roofId>|<panelKey>": หมายเลขสตริง } · manual=false = ใช้ที่ระบบจัดให้
    mpptPick: {},              // { "<หมายเลขสตริง>": ช่อง MPPT ที่ปักเอง (นับ 0) } · ไม่มี = ให้ระบบไล่ลงช่องว่างให้
    loss: Object.assign({}, SC_LOSS),
    env: Object.assign({}, SC_ENV),
    tamb: SC_TAMB.slice(), kc: SC_KC.slice(),
    years: 15,
    /* สภาพอากาศตอนออกไปตรวจวัดหน้างาน (ใช้ชดเชยค่าที่วัดได้กลับเป็นมาตรฐาน) */
    /* hour = null → ระบบเลือกช่วงเวลาที่เหมาะจะออกไปวัดให้เอง (แดดแรงและไม่มีเงาบัง) */
    site: { date: "", hour: null, wind: 1, mount: "close", tAmb: null, ghi: null, shade: 0, age: 0 },
    micro: null,               // สเปคไมโครที่แก้ทับเฉพาะงานนี้ (null = ใช้ตามคลัง)
    microAssign: {},           // { uid ของแผง: หมายเลขตัวไมโคร } — ว่าง = ให้ระบบจับคู่ให้
    phases: null,              // 1 = 1 เฟส · 3 = 3 เฟส (null = ตามข้อมูลงาน)
    microPhase: {},            // { หมายเลขตัวไมโคร: เฟส } — ว่าง = ให้ระบบเกลี่ยให้
    microManual: false,        // true = ยึดผังที่แก้เอง ไม่ให้ระบบจับคู่ใหม่ทับ
    meas: {},                  // { "<หมายเลขสตริง>": { g, tmod, voc, isc, vmp, imp, pmax, note } }
    shade3d: null,             // ผลคำนวณเงาทั้งปีจากโมเดล 3 มิติ (ดู ivShadeAnnual) — null = ใช้ % ที่กรอกมือ
    elec: null,                // ตั้งค่าโมเดล "เงาฉุดทั้งสตริง" (null = ใช้ค่ากลาง IV_ELEC)
    roi: null,                 // ตั้งค่า ROI (null = ใช้ค่ากลาง IV_ROI)
  };
}

/* รวมสเปคจากคลัง + ค่าที่แก้ทับเฉพาะงาน + ค่ากลาง (ลำดับความสำคัญจากซ้ายไปขวา) */
function scPanelSpec(sys) {
  const B = window.BOQ || {};
  const stock = (B.PANELS || []).find((p) => p.model === (sys && sys.panelModel)) || {};
  return Object.assign({}, SC_PANEL_EXTRA, stock, (sys && sys.panel) || {});
}
/* ── เดาว่าเป็นแผง "ครึ่งเซลล์" (half-cut) จากข้อมูลคลังไหม ──
   แผงยุคใหม่ผ่าเซลล์ครึ่งเพื่อลดกระแสในบัสบาร์ ทำให้ร้อนน้อยลงและทนเงาแนวนอนได้ดีกว่า
   คลังสินค้ายังไม่มีช่องนี้ จึงดูจากชื่อรุ่นและกำลังแทน (แผงตั้งแต่ ~400W ขึ้นไปเป็นครึ่งเซลล์แทบทั้งหมด)
   คืน { half, why } — ถ้าผู้ใช้ระบุเองใน sys.panel.halfCut จะยึดค่านั้นก่อน */
function scHalfCut(panel) {
  if (panel && panel.halfCut != null) return { half: !!panel.halfCut, why: "ระบุเอง" };
  const m = String((panel && panel.model) || "");
  if (/half[\s-]?cut|\bhc\b|HVH|HPH|HPBH|HBD/i.test(m)) return { half: true, why: "จากชื่อรุ่นในคลัง" };
  if (/Hi-?MO|TOPCon|Vertex|Tiger|DUOMAX|Twin/i.test(m)) return { half: true, why: "รุ่นตระกูลนี้เป็นครึ่งเซลล์" };
  if (scNum(panel && panel.wp) >= 400) return { half: true, why: "กำลัง " + scNum(panel.wp) + "W ขึ้นไปเป็นครึ่งเซลล์แทบทั้งหมด" };
  if (scNum(panel && panel.wp) > 0) return { half: false, why: "กำลังต่ำกว่า 400W มักเป็นเซลล์เต็ม" };
  return { half: false, why: "ยังไม่ได้เลือกรุ่นแผง" };
}

function scInvSpec(sys) {
  const B = window.BOQ || {};
  const stock = (B.INVERTERS || []).find((p) => p.model === (sys && sys.invModel)) || {};
  return Object.assign({}, SC_INV_EXTRA, stock, (sys && sys.inv) || {});
}

Object.assign(window, {
  SC_DEG, SC_MON, SC_MDAYS, SC_PANEL_EXTRA, SC_INV_EXTRA, SC_ENV, SC_LOSS, SC_TAMB, SC_KC,
  SC_MOUNT, SC_WIND, scTcell, scIam, SC_IAM_DIFF, scStringFuse, SC_FUSE_SIZES,
  scSunPos, scNormalToTiltAz, scPanelNormal, scGroupsFromPlan, scPanelIndex, scStringsFromAssign, scAutoAssign,
  scVocAt, scVmpAt, scStringCheck, scSeriesRange, scCurrent, scStringsPerMppt, scMpptName, scPinLayout, scPinAddr, scAutoStrings,
  scMicroPlan, scMicroSpec, scMicroPerMppt, scMicroAssign, scMicroPhases, scPhaseBalance, SC_MICRO_EXTRA,
  scYearOneGroup, scDcAt, scEnergy, scLife, scBlankSys, scPanelSpec, scInvSpec, scHalfCut, scR, scNum, scClamp,
});
window.SolarCalc = {
  groups: scGroupsFromPlan, seriesRange: scSeriesRange, check: scStringCheck,
  autoStrings: scAutoStrings, micro: scMicroPlan, energy: scEnergy, life: scLife,
  blankSys: scBlankSys, panelSpec: scPanelSpec, invSpec: scInvSpec, microSpec: scMicroSpec,
};
