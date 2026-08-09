const SC_DEG = Math.PI / 180;
const SC_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const SC_MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const SC_PANEL_EXTRA = {
  tcVoc: -0.25,
  tcIsc: 0.045,
  tcPmax: -0.29,
  noct: 44,
  deg1: 1.0,
  degY: 0.4
};
const SC_INV_EXTRA = {
  eff: 97.5,
  strPerMppt: 2
};
const SC_ENV = {
  tMin: 15,
  tCellHot: 65,
  albedo: 0.2
};
const SC_LOSS = {
  soil: 3,
  mismatch: 2,
  wire: 2,
  shade: 0,
  avail: 1
};
const SC_TAMB = [27, 29, 31, 32, 31, 30, 30, 30, 29, 29, 28, 27];
const SC_KC = [0.79, 0.80, 0.78, 0.74, 0.63, 0.60, 0.59, 0.58, 0.61, 0.66, 0.75, 0.79];
const scNum = (v, d) => {
  const n = parseFloat(v);
  return isFinite(n) ? n : d || 0;
};
const scClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const scR = (v, n) => {
  const m = Math.pow(10, n == null ? 2 : n);
  return Math.round(v * m) / m;
};
function scSunPos(lat, lng, doy, hour) {
  const decl = 23.44 * Math.sin(2 * Math.PI * (284 + doy) / 365);
  const solarHour = hour + (scNum(lng, 100.5) - 105) / 15;
  const H = 15 * (solarHour - 12);
  const la = scNum(lat, 13.75) * SC_DEG,
    d = decl * SC_DEG,
    h = H * SC_DEG;
  const sinAlt = Math.sin(la) * Math.sin(d) + Math.cos(la) * Math.cos(d) * Math.cos(h);
  const alt = Math.asin(scClamp(sinAlt, -1, 1));
  let az = Math.acos(scClamp((Math.sin(d) - sinAlt * Math.sin(la)) / (Math.cos(alt) * Math.cos(la) || 1e-9), -1, 1));
  if (H > 0) az = 2 * Math.PI - az;
  return {
    alt: alt / SC_DEG,
    az: az / SC_DEG
  };
}
function scNormalToTiltAz(n) {
  const L = Math.hypot(n.x, n.y, n.z) || 1;
  const x = n.x / L,
    y = n.y / L,
    z = n.z / L;
  const tilt = Math.acos(scClamp(y, -1, 1)) / SC_DEG;
  let az = Math.atan2(x, -z) / SC_DEG;
  if (tilt < 0.05) az = 180;
  return {
    tilt: scR(tilt, 1),
    az: scR((az + 360) % 360, 1)
  };
}
function scPanelNormal(face, blk) {
  const rot = (scNum(face.az, 180) - 180) * SC_DEG;
  const p = scNum(face.tilt, 0) * SC_DEG;
  const c = Math.cos(rot),
    s = Math.sin(rot);
  const L2W = v => ({
    x: v.x * c - v.z * s,
    y: v.y,
    z: v.x * s + v.z * c
  });
  const n = L2W({
    x: 0,
    y: Math.cos(p),
    z: Math.sin(p)
  });
  const u = L2W({
    x: 1,
    y: 0,
    z: 0
  });
  const v = {
    x: n.y * u.z - n.z * u.y,
    y: n.z * u.x - n.x * u.z,
    z: n.x * u.y - n.y * u.x
  };
  const T = scNum(blk && blk.tilt, 0) * SC_DEG,
    R = scNum(blk && blk.rot, 0) * SC_DEG;
  if (!T) {
    if (!R) return n;
    return n;
  }
  const a = Math.sin(T) * Math.sin(R),
    b = Math.cos(T),
    d = Math.sin(T) * Math.cos(R);
  return {
    x: u.x * a + n.x * b + v.x * d,
    y: u.y * a + n.y * b + v.y * d,
    z: u.z * a + n.z * b + v.z * d
  };
}
function scPanelIndex(st) {
  const raw = [],
    byPanel = {};
  if (!st || !Array.isArray(st.roofs)) return {
    groups: [],
    byPanel
  };
  const P = window.p3Panels,
    PLANE = window.p3PolyPlane;
  if (typeof P !== "function") return {
    groups: [],
    byPanel
  };
  st.roofs.forEach(roof => {
    const pan = P(roof);
    const blocks = pan.blocks || [];
    const bag = {};
    const add = (p, blkI, side, tilt, az, key2) => {
      const k = roof.id + "|" + blkI + "|" + (side || "-") + "|" + (key2 == null ? "" : key2);
      if (!bag[k]) {
        bag[k] = {
          key: k,
          roofId: roof.id,
          roofName: roof.name,
          blk: blkI,
          side: side || null,
          tilt,
          az,
          count: 0
        };
        raw.push(bag[k]);
      }
      bag[k].count++;
      byPanel[roof.id + "|" + p.key] = k;
    };
    const blkOf = i => blocks[i] || {
      tilt: 0,
      rot: 0
    };
    const az0 = scNum(roof.az, 180);
    (pan.list || []).forEach(p => {
      if (p.skip || p.slot) return;
      if (roof.kind === "dome") {
        const tDeg = (p.rx || 0) / SC_DEG;
        const g = scNormalToTiltAz(scPanelNormal({
          tilt: Math.abs(tDeg),
          az: tDeg >= 0 ? az0 : az0 + 180
        }, null));
        add(p, p.blk, "row" + Math.round(tDeg), g.tilt, g.az, Math.round(tDeg));
      } else if (roof.kind === "poly") {
        const pl = pan.plane || (typeof PLANE === "function" ? PLANE(roof) : null);
        if (!pl) return;
        const g = scNormalToTiltAz(scPanelNormal(scNormalToTiltAz(pl.n), blkOf(p.blk)));
        add(p, p.blk, null, g.tilt, g.az);
      } else {
        const faceAz = {
          A: az0,
          B: az0 + 180,
          C: az0 + 90,
          D: az0 - 90
        };
        const g = scNormalToTiltAz(scPanelNormal({
          tilt: scNum(roof.pitch, 0),
          az: p.side ? faceAz[p.side] : az0
        }, blkOf(p.blk)));
        add(p, p.blk, p.side, g.tilt, g.az);
      }
    });
  });
  const merged = [],
    remap = {};
  raw.forEach(g => {
    const hit = merged.find(m => m.roofId === g.roofId && Math.abs(m.tilt - g.tilt) < 1 && Math.abs((m.az - g.az + 540) % 360 - 180) < 1);
    if (hit) {
      hit.count += g.count;
      hit.parts = (hit.parts || 1) + 1;
      remap[g.key] = hit.key;
    } else {
      const c = Object.assign({}, g);
      merged.push(c);
      remap[g.key] = c.key;
    }
  });
  Object.keys(byPanel).forEach(k => {
    byPanel[k] = remap[byPanel[k]] || byPanel[k];
  });
  merged.forEach(g => {
    g.label = g.roofName + (g.side && g.side.indexOf("row") !== 0 ? " · ด้าน " + g.side : "") + " · เอียง " + scR(g.tilt, 0) + "° ทิศ " + scR(g.az, 0) + "°";
  });
  return {
    groups: merged.filter(g => g.count > 0).sort((a, b) => b.count - a.count),
    byPanel
  };
}
function scGroupsFromPlan(st) {
  return scPanelIndex(st).groups;
}
function scVocAt(panel, tC) {
  return scNum(panel.voc) * (1 + scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc) / 100 * (tC - 25));
}
function scVmpAt(panel, tC) {
  const tc = panel.tcVmp != null ? scNum(panel.tcVmp) : scNum(panel.tcVoc, SC_PANEL_EXTRA.tcVoc);
  return scNum(panel.vmp) * (1 + tc / 100 * (tC - 25));
}
function scStringCheck(panel, inv, n, env) {
  env = Object.assign({}, SC_ENV, env || {});
  const vocCold = scVocAt(panel, env.tMin) * n;
  const vmpHot = scVmpAt(panel, env.tCellHot) * n;
  const vmpCold = scVmpAt(panel, env.tMin) * n;
  const vmpNom = scNum(panel.vmp) * n;
  const maxVdc = scNum(inv.maxVdc),
    vmin = scNum(inv.mpptVmin),
    vmax = scNum(inv.mpptVmax);
  const checks = [];
  if (maxVdc) checks.push({
    k: "voc",
    ok: vocCold <= maxVdc,
    v: vocCold,
    lim: maxVdc,
    msg: "Voc ตอนอากาศเย็น " + scR(vocCold, 0) + " V ต้องไม่เกินแรงดันสูงสุด " + maxVdc + " V"
  });
  if (vmin) checks.push({
    k: "hot",
    ok: vmpHot >= vmin,
    v: vmpHot,
    lim: vmin,
    msg: "แรงดันทำงานตอนแผงร้อน " + scR(vmpHot, 0) + " V ต้องไม่ต่ำกว่า MPPT ต่ำสุด " + vmin + " V"
  });
  if (vmax) checks.push({
    k: "cold",
    ok: vmpCold <= vmax,
    v: vmpCold,
    lim: vmax,
    msg: "แรงดันทำงานตอนอากาศเย็น " + scR(vmpCold, 0) + " V ต้องไม่เกิน MPPT สูงสุด " + vmax + " V"
  });
  const vStart = scNum(inv.vStart);
  if (vStart) checks.push({
    k: "start",
    ok: vmpHot >= vStart,
    v: vmpHot,
    lim: vStart,
    msg: "แรงดันทำงานตอนแผงร้อน " + scR(vmpHot, 0) + " V ต่ำกว่าแรงดันเริ่มทำงานของอินเวอร์เตอร์ " + vStart + " V — เช้า/เย็นจะจุดไม่ติด"
  });
  const ok = checks.every(c => c.ok);
  const vRated = scNum(inv.vRated);
  let score = 0,
    band = "-";
  if (ok && vmin && vmax) {
    const aim = vRated && vRated > vmin && vRated < vmax ? (vRated - vmin) / (vmax - vmin) : 0.62;
    const pos = (vmpNom - vmin) / Math.max(1, vmax - vmin);
    const headHot = (vmpHot - vmin) / Math.max(1, vmax - vmin);
    const headCold = maxVdc ? (maxVdc - vocCold) / maxVdc : 0.15;
    score = Math.round(100 * scClamp(1 - Math.abs(pos - aim) / Math.max(0.2, aim), 0, 1) * scClamp(headHot / 0.12, 0, 1) * scClamp(headCold / 0.08, 0, 1));
    band = score >= 75 ? "ดีมาก" : score >= 50 ? "ใช้ได้" : "พอไหว";
  }
  return {
    n,
    ok,
    checks,
    score,
    band,
    vocCold: scR(vocCold, 1),
    vmpHot: scR(vmpHot, 1),
    vmpCold: scR(vmpCold, 1),
    vmpNom: scR(vmpNom, 1),
    fails: checks.filter(c => !c.ok).map(c => c.msg)
  };
}
function scSeriesRange(panel, inv, env) {
  const rows = [];
  const cap = Math.max(2, Math.ceil(scNum(inv.maxVdc, 1000) / Math.max(1, scNum(panel.voc, 40))) + 2);
  for (let n = 1; n <= Math.min(40, cap); n++) rows.push(scStringCheck(panel, inv, n, env));
  const okRows = rows.filter(r => r.ok);
  const best = okRows.slice().sort((a, b) => b.score - a.score || b.n - a.n)[0] || null;
  return {
    rows,
    ok: okRows,
    min: okRows.length ? okRows[0].n : 0,
    max: okRows.length ? okRows[okRows.length - 1].n : 0,
    best: best ? best.n : 0,
    bestRow: best
  };
}
function scCurrent(panel, inv, nPar) {
  const n = Math.max(1, Math.round(nPar || 1));
  const imp = scNum(panel.imp),
    isc = scNum(panel.isc);
  const limIn = scNum(inv.maxInA);
  const limOp = scNum(inv.maxMpptA) || limIn * (n > 1 ? 1 : 1);
  const limSc = scNum(inv.maxIscA);
  const opA = scR(imp * n, 2),
    scA = scR(isc * 1.25 * n, 2);
  const warns = [],
    notes = [];
  if (limIn && imp > limIn) warns.push("กระแสทำงานของ 1 สตริง " + scR(imp, 2) + " A เกินกระแสสูงสุดต่อ 1 ขั้ว (" + limIn + " A)");
  if (limOp && opA > limOp) warns.push("กระแสทำงานรวม " + opA + " A" + (n > 1 ? " (" + n + " สตริงขนาน)" : "") + " เกินกระแสเข้าสูงสุดต่อช่อง MPPT (" + limOp + " A)");
  if (limSc && scA > limSc) warns.push("กระแสลัดวงจร Isc×1.25 = " + scA + " A" + (n > 1 ? " (" + n + " สตริงขนาน)" : "") + " เกินพิกัดกระแสลัดวงจรต่อช่อง MPPT (" + limSc + " A)");
  if (!scNum(inv.maxMpptA) && limIn) notes.push("ยังไม่ได้ระบุ “กระแสสูงสุดต่อช่อง MPPT” — ดาต้าชีตแยกจาก “ต่อ 1 อินพุต” (เช่น 30 A ต่อ MPPT แต่ 23 A ต่ออินพุต) ระบบเลยใช้ค่าต่ออินพุตแทนไปก่อน");
  if (!limSc && isc) notes.push("ยังไม่ได้ระบุ “กระแสลัดวงจรสูงสุด/MPPT” ของอินเวอร์เตอร์ — กรอกจากดาต้าชีต ระบบจะได้ตรวจให้ครบ");
  return {
    opA,
    scA,
    limIn,
    limOp,
    limSc,
    impA: scR(imp, 2),
    n,
    warns,
    notes,
    ok: !warns.length
  };
}
function scStringsPerMppt(panel, inv) {
  const imp = scNum(panel.imp),
    isc = scNum(panel.isc);
  const limOp = scNum(inv.maxMpptA) || scNum(inv.maxInA),
    limSc = scNum(inv.maxIscA);
  let n = Math.max(1, Math.round(scNum(inv.strPerMppt, 2) || 2));
  if (imp && limOp) n = Math.min(n, Math.floor(limOp / imp));
  if (isc && limSc) n = Math.min(n, Math.floor(limSc / (isc * 1.25)));
  return Math.max(1, n);
}
const SC_FUSE_SIZES = [10, 12, 15, 16, 20, 25, 30, 32];
function scStringFuse(panel, nPar, nStrings) {
  const n = Math.max(1, Math.round(nPar || 1));
  const isc = scNum(panel && panel.isc);
  const out = {
    need: n >= 3,
    nPar: n,
    count: 0,
    amp: 0,
    isc,
    limit: scNum(panel && panel.fuseA),
    warns: [],
    why: ""
  };
  if (!out.need) {
    out.why = n <= 1 ? "สตริงละช่อง ไม่มีการขนาน จึงไม่ต้องมีฟิวส์" : "ขนาน 2 สตริง ยังไม่ต้องมีฟิวส์ตามมาตรฐาน";
    return out;
  }
  out.count = Math.max(0, Math.round(nStrings || 0));
  out.why = "ขนาน " + n + " สตริงต่อ 1 ช่อง MPPT — สตริงที่ลัดวงจรจะรับกระแสย้อนจากอีก " + (n - 1) + " เส้น ต้องใส่ฟิวส์ทุกเส้น";
  if (isc) {
    const need = isc * 1.5;
    out.amp = SC_FUSE_SIZES.find(a => a >= need) || Math.ceil(need);
    if (out.limit && out.amp > out.limit) out.warns.push("ฟิวส์ที่ต้องใช้ " + out.amp + " A เกินพิกัดฟิวส์สูงสุดของแผง (" + out.limit + " A) — ลดจำนวนสตริงที่ขนานลง");
  } else {
    out.warns.push("ยังไม่ทราบ Isc ของแผง จึงเลือกพิกัดฟิวส์ให้ไม่ได้");
  }
  return out;
}
function scPinLayout(inv, nInv) {
  const mpptPerInv = Math.max(1, Math.round(scNum(inv.inputs, 2)));
  const phys = Math.max(1, Math.round(scNum(inv.strPerMppt, 2) || 2));
  const n = Math.max(1, Math.round(scNum(nInv, 1)));
  return {
    mpptPerInv,
    phys,
    mppt: n * mpptPerInv,
    pins: n * mpptPerInv * phys,
    nInv: n
  };
}
function scPinAddr(pin, inv, nInv) {
  const L = scPinLayout(inv, nInv);
  const mppt = Math.floor(pin / L.phys);
  return {
    pin,
    mppt,
    inv: Math.floor(mppt / L.mpptPerInv),
    mpptNo: mppt % L.mpptPerInv + 1,
    inNo: pin % L.phys + 1
  };
}
function scMpptName(pin, inv, nInv) {
  const a = scPinAddr(pin, inv, nInv);
  return "INV" + (a.inv + 1) + " / MPPT" + a.mpptNo + " / ช่อง" + a.inNo;
}
function scAutoStrings(groups, panel, inv, env, opt) {
  opt = opt || {};
  const R = scSeriesRange(panel, inv, env);
  const nInv = Math.max(1, Math.round(scNum(opt.invCount, 1)));
  const mpptPerInv = Math.max(1, Math.round(scNum(inv.inputs, 2)));
  const perMppt = scStringsPerMppt(panel, inv);
  const out = {
    strings: [],
    leftovers: [],
    warns: [],
    range: R,
    perMppt,
    mppt: nInv * mpptPerInv
  };
  if (!R.ok.length) {
    out.warns.push("แผงรุ่นนี้ต่ออนุกรมให้อยู่ในช่วงทำงานของอินเวอร์เตอร์รุ่นนี้ไม่ได้เลย — เปลี่ยนรุ่นใดรุ่นหนึ่ง");
    return out;
  }
  const sizes = R.ok.map(r => r.n).sort((a, b) => b - a);
  (groups || []).forEach(g => {
    let left = g.count;
    const pick = [];
    while (left > 0) {
      const s = sizes.find(n => n <= left);
      if (!s) break;
      pick.push(s);
      left -= s;
    }
    if (pick.length > 1) {
      const tot = pick.reduce((a, b) => a + b, 0);
      const even = Math.floor(tot / pick.length);
      if (R.ok.some(r => r.n === even)) {
        let rem = tot - even * pick.length;
        for (let i = 0; i < pick.length; i++) {
          pick[i] = even + (rem > 0 && R.ok.some(r => r.n === even + 1) ? (rem--, 1) : 0);
        }
      }
    }
    pick.forEach(n => out.strings.push({
      n,
      groupKey: g.key,
      label: g.label,
      tilt: g.tilt,
      az: g.az,
      chk: scStringCheck(panel, inv, n, env)
    }));
    if (left > 0) out.leftovers.push({
      group: g,
      left
    });
  });
  let mi = 0,
    used = {};
  const byGroup = {};
  out.strings.forEach(s => {
    (byGroup[s.groupKey] = byGroup[s.groupKey] || []).push(s);
  });
  Object.keys(byGroup).forEach(k => {
    byGroup[k].forEach(s => {
      while (mi < out.mppt && (used[mi] || 0) >= perMppt) mi++;
      if (mi >= out.mppt) {
        s.mppt = null;
        s.pin = null;
        return;
      }
      const LAY = scPinLayout(inv, nInv);
      s.mppt = mi;
      s.inv = Math.floor(mi / mpptPerInv);
      s.pin = mi * LAY.phys + Math.min(LAY.phys - 1, used[mi] || 0);
      s.addr = scMpptName(s.pin, inv, nInv);
      used[mi] = (used[mi] || 0) + 1;
    });
    mi++;
  });
  const parMax = Math.max(1, Math.max.apply(null, [1].concat(Object.keys(used).map(k => used[k]))));
  out.mpptPerInv = mpptPerInv;
  out.load = used;
  out.fuse = scStringFuse(panel, parMax, out.strings.length);
  out.current = scCurrent(panel, inv, parMax);
  out.current.warns.forEach(w => out.warns.push(w));
  out.notes = out.current.notes.slice();
  out.overCurrent = !out.current.ok;
  const noSlot = out.strings.filter(s => s.mppt == null).length;
  if (noSlot) out.warns.push("มี " + noSlot + " สตริงที่ไม่มีช่อง MPPT เหลือ — เพิ่มจำนวนอินเวอร์เตอร์");
  out.leftovers.forEach(l => out.warns.push(l.group.label + " เหลือ " + l.left + " แผงที่ต่อเป็นสตริงไม่ลงตัว (ย้ายไปผืนอื่น หรือใช้ออปติไมเซอร์)"));
  out.panels = out.strings.reduce((a, s) => a + s.n, 0);
  out.dcKw = scR(out.panels * scNum(panel.wp) / 1000, 2);
  out.acKw = scR(nInv * scNum(inv.kw), 2);
  out.dcAc = out.acKw ? scR(out.dcKw / out.acKw, 2) : 0;
  if (out.dcAc > 1.4) out.warns.push("DC/AC = " + out.dcAc + " สูงไป อินเวอร์เตอร์จะตัดยอด (clipping) ช่วงเที่ยง — เพิ่มขนาด/จำนวนอินเวอร์เตอร์");else if (out.dcAc && out.dcAc < 0.85) out.warns.push("DC/AC = " + out.dcAc + " ต่ำไป อินเวอร์เตอร์ใหญ่เกินแผง — ลดขนาดลงได้");
  return out;
}
function scStringsFromAssign(assign, byPanel, groups, panel, inv, env, opt) {
  opt = opt || {};
  const gMap = {};
  (groups || []).forEach(g => {
    gMap[g.key] = g;
  });
  const bag = {};
  Object.keys(assign || {}).forEach(uid => {
    const sid = assign[uid];
    if (!sid) return;
    (bag[sid] = bag[sid] || {
      id: sid,
      keys: [],
      gset: {}
    }).keys.push(uid);
    const gk = byPanel[uid];
    if (gk) bag[sid].gset[gk] = (bag[sid].gset[gk] || 0) + 1;
  });
  const nInv0 = Math.max(1, Math.round(scNum(opt.invCount, 1)));
  const LAY = scPinLayout(inv, nInv0);
  const mpptPerInv = LAY.mpptPerInv,
    slots0 = LAY.mppt,
    perMppt0 = scStringsPerMppt(panel, inv);
  const strings = Object.keys(bag).sort((a, b) => a - b).map(sid => {
    const b = bag[sid];
    const gks = Object.keys(b.gset);
    const main = gks.sort((x, y) => b.gset[y] - b.gset[x])[0];
    const g = gMap[main] || {};
    const chk = scStringCheck(panel, inv, b.keys.length, env);
    const mixed = gks.length > 1;
    return {
      id: +sid,
      n: b.keys.length,
      keys: b.keys,
      groupKey: main,
      mixed,
      groupCount: gks.length,
      label: (g.label || "—") + (mixed ? " + อีก " + (gks.length - 1) + " ทิศ" : ""),
      tilt: g.tilt,
      az: g.az,
      chk,
      pin: null,
      mppt: null,
      inv: null,
      addr: "",
      picked: false
    };
  });
  const warns = [];
  const pick = opt.mpptPick || {};
  const load = {},
    owner = {};
  const place = (s, pin) => {
    const a = scPinAddr(pin, inv, nInv0);
    s.pin = pin;
    s.mppt = a.mppt;
    s.inv = a.inv;
    s.addr = scMpptName(pin, inv, nInv0);
    load[a.mppt] = (load[a.mppt] || 0) + 1;
    (owner[pin] = owner[pin] || []).push(s.id);
  };
  strings.forEach(s => {
    const p = pick[s.id];
    if (p == null || p === "") return;
    const pin = Math.round(+p);
    if (!(pin >= 0 && pin < LAY.pins)) return;
    s.picked = true;
    place(s, pin);
  });
  strings.forEach(s => {
    if (s.pin != null) return;
    let pin = 0;
    while (pin < LAY.pins && (owner[pin] || (load[Math.floor(pin / LAY.phys)] || 0) >= perMppt0)) pin++;
    if (pin >= LAY.pins) return;
    place(s, pin);
  });
  Object.keys(owner).forEach(k => {
    if (owner[k].length > 1) warns.push(scMpptName(+k, inv, nInv0) + " ถูกจองซ้ำ " + owner[k].length + " สตริง (#" + owner[k].join(", #") + ") — 1 ขั้วเสียบได้สตริงเดียว");
  });
  Object.keys(load).forEach(k => {
    if (load[k] > perMppt0) warns.push("MPPT ที่ " + (+k % mpptPerInv + 1) + " ของอินเวอร์เตอร์ตัวที่ " + (Math.floor(+k / mpptPerInv) + 1) + " มี " + load[k] + " สตริงขนานกัน เกินที่ช่องนี้รับได้ (" + perMppt0 + " สตริง/MPPT)");
  });
  const noSlot = strings.filter(s => s.pin == null).length;
  if (noSlot) warns.push("มี " + noSlot + " สตริงที่ไม่มีขั้วเหลือให้เสียบ — เพิ่มจำนวนอินเวอร์เตอร์ หรือย้ายขั้วเอง");
  strings.forEach(s => {
    if (s.mixed) warns.push("สตริง #" + s.id + " มีแผงจาก " + s.groupCount + " ทิศ/มุมปนกัน — แผงที่ได้แดดน้อยจะฉุดทั้งสตริง แยกออกจากกันดีกว่า");
    if (!s.chk.ok) warns.push("สตริง #" + s.id + " (" + s.n + " แผง) " + s.chk.fails.join(" · "));
  });
  const total = opt.totalPanels || 0;
  const assigned = strings.reduce((a, s) => a + s.n, 0);
  if (total && assigned < total) warns.push("ยังมีแผงที่ไม่ได้อยู่สตริงไหนเลย " + (total - assigned) + " แผง");
  const nInv = nInv0,
    slots = slots0,
    perMppt = perMppt0;
  const parMax = Math.max(1, Math.max.apply(null, [1].concat(Object.keys(load).map(k => load[k]))));
  const current = scCurrent(panel, inv, parMax);
  current.warns.forEach(w => warns.push(w));
  const fuse = scStringFuse(panel, parMax, strings.length);
  if (fuse.need) warns.push("ต้องมีฟิวส์สตริง " + fuse.count + " ตัว" + (fuse.amp ? " (" + fuse.amp + " A)" : "") + " — " + fuse.why);
  fuse.warns.forEach(w => warns.push(w));
  const dcKw = scR(assigned * scNum(panel.wp) / 1000, 2),
    acKw = scR(nInv * scNum(inv.kw), 2);
  if (acKw && dcKw / acKw > 1.4) warns.push("DC/AC = " + scR(dcKw / acKw, 2) + " สูงไป อินเวอร์เตอร์จะตัดยอด (clipping) ช่วงเที่ยง — เพิ่มขนาด/จำนวนอินเวอร์เตอร์");
  return {
    strings,
    warns,
    notes: current.notes,
    current,
    panels: assigned,
    dcKw,
    acKw,
    dcAc: acKw ? scR(dcKw / acKw, 2) : 0,
    range: scSeriesRange(panel, inv, env),
    perMppt,
    mppt: slots,
    mpptPerInv,
    pins: LAY.pins,
    phys: LAY.phys,
    load,
    owner,
    nInv,
    fuse,
    manual: true
  };
}
function scAutoAssign(footPanels, byPanel, groups, panel, inv, env, opt) {
  const plan = scAutoStrings(groups, panel, inv, env, opt);
  const byGroup = {};
  (footPanels || []).forEach(f => {
    const g = byPanel[f.uid];
    if (g) (byGroup[g] = byGroup[g] || []).push(f.uid);
  });
  const assign = {};
  let sid = 0;
  plan.strings.forEach(s => {
    const pool = byGroup[s.groupKey] || [];
    sid++;
    for (let i = 0; i < s.n && pool.length; i++) assign[pool.shift()] = sid;
  });
  return assign;
}
function scMicroAssign(panels, byPanel, groups, per) {
  const P = Math.max(1, Math.round(per || 1));
  const assign = {},
    units = [];
  (groups || []).forEach(g => {
    const mine = (panels || []).filter(p => byPanel[p.uid] === g.key);
    mine.sort((a, b) => Math.round(a.cz * 2) - Math.round(b.cz * 2) || a.cx - b.cx);
    for (let i = 0; i < mine.length; i += P) {
      const chunk = mine.slice(i, i + P);
      const id = units.length + 1;
      chunk.forEach(p => {
        assign[p.uid] = id;
      });
      units.push({
        id,
        gk: g.key,
        gLabel: g.label,
        uids: chunk.map(p => p.uid),
        n: chunk.length,
        full: chunk.length === P
      });
    }
  });
  return {
    assign,
    units
  };
}
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
  for (let i = 0; i < n; i++) bins.push({
    phase: i + 1,
    label: n > 1 ? L[i] || "L" + (i + 1) : "1 เฟส",
    units: [],
    panels: 0
  });
  const list = (units || []).slice();
  const rest = [];
  list.forEach(u => {
    const p = Math.round(scNum(ov[u.id], 0));
    if (p >= 1 && p <= n) {
      bins[p - 1].units.push(u);
      bins[p - 1].panels += u.n;
    } else rest.push(u);
  });
  rest.sort((a, b) => b.n - a.n || a.id - b.id);
  rest.forEach(u => {
    let best = bins[0];
    for (let i = 1; i < bins.length; i++) if (bins[i].panels < best.panels) best = bins[i];
    best.units.push(u);
    best.panels += u.n;
  });
  return bins.map(b => {
    b.units.sort((x, y) => x.id - y.id);
    const acW = b.units.length * acWEach;
    return {
      phase: b.phase,
      label: b.label,
      units: b.units,
      count: b.units.length,
      panels: b.panels,
      dcW: scR(b.panels * wp, 0),
      acW: scR(acW, 0),
      acKw: scR(acW / 1000, 2),
      amps: acV ? scR(acW / acV, 1) : 0,
      branches: perBranch ? Math.ceil(b.units.length / perBranch) : 0
    };
  });
}
function scPhaseBalance(bins, tolPct) {
  const tol = scNum(tolPct, 10);
  if (!bins || bins.length < 2) return {
    ok: true,
    spread: 0,
    pct: 0,
    maxCount: 0,
    minCount: 0
  };
  const cs = bins.map(b => b.count),
    ws = bins.map(b => b.dcW);
  const maxW = Math.max.apply(null, ws),
    minW = Math.min.apply(null, ws);
  const pct = maxW > 0 ? scR((maxW - minW) / maxW * 100, 1) : 0;
  return {
    ok: pct <= tol,
    spread: Math.max.apply(null, cs) - Math.min.apply(null, cs),
    pct,
    maxCount: Math.max.apply(null, cs),
    minCount: Math.min.apply(null, cs),
    tol
  };
}
const SC_MICRO_EXTRA = {
  perInverter: 1,
  mppt: 1,
  maxVdc: 60,
  mpptVmin: 16,
  mpptVmax: 60,
  maxInA: 14,
  maxIscA: 18,
  wpMin: 0,
  wpMax: 0,
  acW: 0,
  acWPeak: 0,
  acV: 230,
  outA: 0,
  perBranch: 0,
  eff: 96.5
};
function scMicroSpec(sys) {
  const B = window.BOQ || {};
  const ratio = sys && sys.microRatio || "";
  const stock = (B.MICRO || []).find(m => m.ratio === ratio) || (B.MICRO || [])[0] || {};
  return Object.assign({}, SC_MICRO_EXTRA, stock, sys && sys.micro || {});
}
function scMicroPerMppt(mi) {
  const per = Math.max(1, Math.round(scNum(mi.perInverter, 1)));
  const nM = Math.max(1, Math.round(scNum(mi.mppt, per)));
  return Math.max(1, Math.ceil(per / nM));
}
function scMicroPlan(groups, panel, micros, env, sys) {
  const wp = scNum(panel.wp);
  const total = (groups || []).reduce((a, g) => a + g.count, 0);
  return (micros || []).map(raw => {
    const m = Object.assign({}, SC_MICRO_EXTRA, raw, sys && sys.microRatio === raw.ratio && sys.micro ? sys.micro : {});
    const per = Math.max(1, Math.round(scNum(m.perInverter, 1)));
    const nSeries = scMicroPerMppt(m);
    const nMppt = Math.max(1, Math.round(scNum(m.mppt, per)));
    const acW = scNum(m.acW) || scNum((/(\d+(?:\.\d+)?)\s*w/i.exec(m.model || "") || [])[1]) || per * 400;
    let units = 0,
      odd = 0;
    (groups || []).forEach(g => {
      units += Math.ceil(g.count / per);
      if (per > 1 && g.count % per) odd++;
    });
    const dcAc = acW ? scR(wp * per / acW, 2) : 0;
    const warns = [],
      notes = [];
    const chk = scStringCheck(panel, m, nSeries, env);
    chk.checks.forEach(c => {
      if (!c.ok) warns.push(c.msg);
    });
    const cur = scCurrent(panel, m, 1);
    cur.warns.forEach(w => warns.push(w));
    const wpMin = scNum(m.wpMin),
      wpMax = scNum(m.wpMax);
    if (wp && wpMin && wp < wpMin) warns.push("แผง " + wp + " W เล็กกว่าช่วงที่ไมโครรุ่นนี้รองรับ (" + wpMin + "–" + wpMax + " W)");
    if (wp && wpMax && wp > wpMax) warns.push("แผง " + wp + " W ใหญ่กว่าช่วงที่ไมโครรุ่นนี้รองรับ (" + wpMin + "–" + wpMax + " W)");
    if (dcAc > 1.5) warns.push("DC/AC ต่อตัว " + dcAc + " สูงมาก แผงแรงเกินไมโครรุ่นนี้ ช่วงเที่ยงจะตัดยอดทิ้ง");else if (dcAc && dcAc < 0.9) notes.push("DC/AC ต่อตัว " + dcAc + " ต่ำ ไมโครใหญ่เกินแผง จ่ายแพงโดยไม่ได้ผลผลิตเพิ่ม");
    if (odd) notes.push("มี " + odd + " กลุ่มที่จำนวนแผงเป็นเลขคี่ → ไมโคร " + odd + " ตัวจะเสียบแค่ช่องเดียว");
    const perBranch = Math.max(0, Math.round(scNum(m.perBranch)));
    const branches = perBranch ? Math.ceil(units / perBranch) : 0;
    if (!perBranch) notes.push("ยังไม่ได้ระบุ “ต่อพ่วงได้กี่ตัวต่อวงจร” ของไมโครรุ่นนี้ — กรอกจากดาต้าชีตแล้วระบบจะบอกจำนวนวงจร AC ให้");
    if (!scNum(m.maxInA) && !scNum(m.maxIscA)) notes.push("ยังไม่ได้กรอกพิกัดกระแสเข้าของไมโครรุ่นนี้ — กรอก “กระแสทำงาน/ลัดวงจรสูงสุดต่อช่อง” จากดาต้าชีต ระบบจะได้ตรวจให้ครบเหมือนสตริงอินเวอร์เตอร์");
    if (!wpMin && !wpMax) notes.push("ยังไม่ได้กรอกช่วงกำลังแผงที่ไมโครรุ่นนี้รองรับ — สำคัญมากกับแผงกำลังสูง เพราะแผงใหญ่เกินพิกัดจะถูกตัดยอดทิ้งทั้งวัน");
    const outA = scNum(m.outA) || (scNum(m.acV, 230) ? scR(acW / scNum(m.acV, 230), 2) : 0);
    const fewer = total > 0 ? (1 - units / total) * 40 : 0;
    const clipPen = Math.max(0, (dcAc || 0) - 1.25) * 120;
    const failPen = chk.ok && cur.ok ? 0 : 200;
    const why = failPen ? "สเปคไฟฟ้าไม่ผ่าน" : clipPen > 8 ? "แผงแรงเกินไมโคร จะตัดยอดทิ้ง" : per > 1 ? "ใช้ไมโครน้อยกว่าครึ่ง โดยแทบไม่ตัดยอด" : "แผงทุกใบมีตัวแปลงของตัวเอง ยืดหยุ่นที่สุด";
    return {
      ratio: m.ratio,
      model: m.model,
      per,
      nMppt,
      nSeries,
      acW,
      acWPeak: scNum(m.acWPeak) || acW,
      acV: scNum(m.acV, 230),
      outA,
      perBranch,
      branches,
      eff: scNum(m.eff, 96.5),
      units,
      total,
      dcAc,
      odd,
      warns,
      notes,
      why,
      spec: m,
      chk,
      cur,
      ok: chk.ok && cur.ok,
      acKw: scR(units * acW / 1000, 2),
      dcKw: scR(total * wp / 1000, 2),
      acAmpTotal: scR(units * outA, 1),
      score: Math.round(60 + fewer - clipPen - failPen - odd * 4)
    };
  }).sort((a, b) => b.score - a.score);
}
function scDiffuseFrac(kt) {
  if (kt <= 0.22) return 1 - 0.09 * kt;
  if (kt <= 0.80) return 0.9511 - 0.1604 * kt + 4.388 * kt * kt - 16.638 * Math.pow(kt, 3) + 12.336 * Math.pow(kt, 4);
  return 0.165;
}
const SC_MOUNT = {
  close: {
    a: -2.98,
    b: -0.0471,
    dT: 1,
    label: "ยึดชิดหลังคา",
    note: "ระบายอากาศหลังแผงได้น้อย ความร้อนสะสมสูงสุด"
  },
  rack: {
    a: -3.56,
    b: -0.0750,
    dT: 3,
    label: "ยกสูงจากหลังคา",
    note: "มีช่องลมผ่านหลังแผง ระบายความร้อนได้ดีกว่า"
  },
  ground: {
    a: -3.58,
    b: -0.1130,
    dT: 3,
    label: "ขาตั้งบนพื้น/โล่ง",
    note: "ลมผ่านได้รอบตัว เย็นที่สุด"
  }
};
const SC_WIND = 1;
function scTcell(poa, tAmb, wind, mount) {
  const M = SC_MOUNT[mount] || SC_MOUNT.close;
  const G = Math.max(0, scNum(poa, 0)),
    ws = Math.max(0, scNum(wind, SC_WIND));
  return G * Math.exp(M.a + M.b * ws) + scNum(tAmb, 32) + G / 1000 * M.dT;
}
const SC_B0 = 0.05;
function scIam(cosAoi) {
  if (cosAoi <= 0) return 0;
  if (cosAoi >= 1) return 1;
  return Math.max(0, 1 - SC_B0 * (1 / cosAoi - 1));
}
const SC_IAM_DIFF = 0.97;
function scYearOneGroup(tilt, az, o) {
  const lat = scNum(o.lat, 13.75),
    lng = scNum(o.lng, 100.5);
  const tamb = o.tamb || SC_TAMB,
    kc = o.kc || SC_KC;
  const tcP = scNum(o.tcPmax, SC_PANEL_EXTRA.tcPmax);
  const alb = scNum(o.albedo, SC_ENV.albedo);
  const mount = o.mount || "close",
    wind = scNum(o.wind, SC_WIND);
  const bT = tilt * SC_DEG,
    cosB = Math.cos(bT),
    sinB = Math.sin(bT);
  const dt = 0.5;
  const mon = new Array(12).fill(0),
    monPoa = new Array(12).fill(0);
  let doy = 0;
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < SC_MDAYS[m]; d++) {
      doy++;
      for (let h = 4; h < 20; h += dt) {
        const s = scSunPos(lat, lng, doy, h);
        if (s.alt <= 1) continue;
        const sa = Math.sin(s.alt * SC_DEG);
        const ghiClear = 1098 * sa * Math.exp(-0.057 / sa);
        const ghi = ghiClear * kc[m];
        const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * doy / 365)) * sa;
        const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
        const dhi = ghi * scDiffuseFrac(kt);
        const dni = sa > 0.01 ? Math.max(0, (ghi - dhi) / sa) : 0;
        const cosAoi = cosB * sa + sinB * Math.cos(s.alt * SC_DEG) * Math.cos((s.az - az) * SC_DEG);
        const beam = Math.max(0, dni * cosAoi),
          sky = dhi * (1 + cosB) / 2,
          gnd = ghi * alb * (1 - cosB) / 2;
        const poa = beam + sky + gnd;
        if (poa <= 0) continue;
        const poaEff = beam * scIam(cosAoi) + (sky + gnd) * SC_IAM_DIFF;
        const tCell = scTcell(poa, tamb[m], wind, mount);
        const dcW = poaEff / 1000 * 1000 * (1 + tcP / 100 * (tCell - 25));
        mon[m] += Math.max(0, dcW) * dt / 1000;
        monPoa[m] += poa * dt / 1000;
      }
    }
  }
  const kwh = mon.reduce((a, b) => a + b, 0);
  return {
    kwh,
    poa: monPoa.reduce((a, b) => a + b, 0),
    monthly: mon,
    monthlyPoa: monPoa
  };
}
function scDcAt(tilt, az, sun, m, o) {
  const sa = Math.sin(sun.alt * SC_DEG);
  if (sa <= 0.017) return {
    dc: 0,
    poa: 0,
    poaEff: 0
  };
  const kc = (o.kc || SC_KC)[m],
    tamb = (o.tamb || SC_TAMB)[m];
  const ghi = 1098 * sa * Math.exp(-0.057 / sa) * kc;
  const i0 = 1367 * (1 + 0.033 * Math.cos(2 * Math.PI * o.doy / 365)) * sa;
  const kt = i0 > 0 ? scClamp(ghi / i0, 0, 1) : 0;
  const dhi = ghi * scDiffuseFrac(kt);
  const dni = Math.max(0, (ghi - dhi) / sa);
  const bT = tilt * SC_DEG,
    cosB = Math.cos(bT),
    sinB = Math.sin(bT);
  const cosAoi = cosB * sa + sinB * Math.cos(sun.alt * SC_DEG) * Math.cos((sun.az - az) * SC_DEG);
  const beam = Math.max(0, dni * cosAoi),
    sky = dhi * (1 + cosB) / 2,
    gnd = ghi * scNum(o.albedo, SC_ENV.albedo) * (1 - cosB) / 2;
  const poa = beam + sky + gnd;
  if (poa <= 0) return {
    dc: 0,
    poa: 0,
    poaEff: 0,
    ghi: ghi
  };
  const poaEff = beam * scIam(cosAoi) + (sky + gnd) * SC_IAM_DIFF;
  const tCell = scTcell(poa, tamb, o.wind, o.mount);
  const dc = Math.max(0, poaEff * (1 + scNum(o.tcPmax, SC_PANEL_EXTRA.tcPmax) / 100 * (tCell - 25)));
  return {
    dc,
    poa,
    poaEff,
    tCell,
    ghi: ghi
  };
}
function scEnergy(groups, panel, sys) {
  sys = sys || {};
  const loss = Object.assign({}, SC_LOSS, sys.loss || {});
  const wp = scNum(panel.wp, 650);
  const o = {
    lat: sys.lat,
    lng: sys.lng,
    tamb: sys.tamb,
    kc: sys.kc,
    albedo: sys.albedo,
    mount: sys.mount || "close",
    wind: sys.wind,
    noct: scNum(panel.noct, SC_PANEL_EXTRA.noct),
    tcPmax: scNum(panel.tcPmax, SC_PANEL_EXTRA.tcPmax)
  };
  const shg = sys.shadeByGroup || null;
  const dcLoss = (1 - loss.soil / 100) * (1 - loss.mismatch / 100) * (1 - loss.wire / 100) * (1 - loss.avail / 100) * (shg ? 1 : 1 - loss.shade / 100);
  const eff = scNum(sys.invEff, SC_INV_EXTRA.eff) / 100;
  const acKw = scNum(sys.acKw, 0);
  const gs = (groups || []).filter(g => g.count > 0).map(g => ({
    g,
    kwp: g.count * wp / 1000,
    kwh: 0,
    poa: 0,
    sf: shg ? 1 - scClamp(scNum(shg[g.key], 0), 0, 100) / 100 : 1
  }));
  const dcKw = gs.reduce((a, x) => a + x.kwp, 0);
  const lat = scNum(sys.lat, 13.75),
    lng = scNum(sys.lng, 100.5),
    dt = 0.5;
  const monthly = new Array(12).fill(0);
  let gross = 0,
    net = 0,
    poaSum = 0,
    poaEffSum = 0,
    grossNoShade = 0,
    ghiSum = 0,
    doy = 0;
  const hrly = [];
  for (let m = 0; m < 12; m++) hrly.push(new Array(24).fill(0));
  for (let m = 0; m < 12; m++) {
    for (let d = 0; d < SC_MDAYS[m]; d++) {
      doy++;
      o.doy = doy;
      for (let h = 4; h < 20; h += dt) {
        const sun = scSunPos(lat, lng, doy, h);
        if (sun.alt <= 1) continue;
        let dcW = 0,
          ghiNow = 0;
        for (let i = 0; i < gs.length; i++) {
          const r = scDcAt(gs[i].g.tilt, gs[i].g.az, sun, m, o);
          if (r.ghi > ghiNow) ghiNow = r.ghi;
          if (!r.dc) continue;
          const dcG = r.dc * gs[i].sf;
          const kwh = dcG * gs[i].kwp * dt / 1000;
          gs[i].kwh += kwh;
          gs[i].poa += r.poa * dt / 1000;
          dcW += dcG * gs[i].kwp;
          poaSum += r.poa * gs[i].kwp * dt / 1000;
          poaEffSum += r.poaEff * gs[i].kwp * dt / 1000;
          grossNoShade += r.dc * gs[i].kwp * dt / 1000;
          gross += kwh;
        }
        ghiSum += ghiNow * dt / 1000;
        if (dcW <= 0) continue;
        let acKwNow = dcW / 1000 * dcLoss * eff;
        if (acKw > 0 && acKwNow > acKw) acKwNow = acKw;
        net += acKwNow * dt;
        monthly[m] += acKwNow * dt;
        hrly[m][Math.min(23, Math.max(0, Math.floor(h)))] += acKwNow * dt;
      }
    }
  }
  const dcAc = acKw > 0 ? dcKw / acKw : 0;
  const beforeClip = gross * dcLoss * eff;
  const areaOne = scNum(panel.width, 0) * scNum(panel.length, 0);
  const nPanels = gs.reduce((a, x) => a + scNum(x.g.count, 0), 0);
  const areaAll = areaOne * nPanels;
  const etaStc = areaOne > 0 ? wp / (areaOne * 1000) * 100 : 0;
  const eGhi = ghiSum * dcKw;
  const tiltAvg = dcKw > 0 ? gs.reduce((a, x) => a + scNum(x.g.tilt, 0) * x.kwp, 0) / dcKw : 0;
  const chain = [];
  const nominal = poaSum;
  let cur = eGhi;
  chain.push({
    k: "ghi",
    kind: "start",
    label: "แสงอาทิตย์บนพื้นราบทั้งปี",
    kwh: Math.round(eGhi),
    unit: scR(ghiSum, 0).toLocaleString() + " kWh/m²",
    note: "ค่าของหน้างานที่พิกัดนี้ ไม่ขึ้นกับการออกแบบ — เป็นเพดานที่ระบบทำได้"
  });
  const cut = (k, label, next, note, extra) => {
    const nx = Math.max(0, next),
      lost = cur - nx;
    chain.push(Object.assign({
      k,
      kind: "loss",
      label,
      loss: Math.round(lost),
      kwh: Math.round(nx),
      pct: nominal > 0 ? scR(lost / nominal * 100, 2) : 0,
      rel: cur > 0 ? scR(lost / cur * 100, 2) : 0,
      note
    }, extra || {}));
    cur = nx;
  };
  chain.push({
    k: "tilt",
    kind: "gain",
    label: "มุมเอียงและทิศของหลังคา",
    gain: Math.round(poaSum - eGhi),
    kwh: Math.round(poaSum),
    pct: eGhi > 0 ? scR((poaSum - eGhi) / eGhi * 100, 2) : 0,
    unit: scR(poaSum / (dcKw || 1), 0).toLocaleString() + " kWh/m²",
    note: "เอียงเฉลี่ย " + scR(tiltAvg, 0) + "° · แสงที่ตกบนหน้าแผงจริง (ลำแสงตรง + ฟุ้งจากฟ้า + สะท้อนพื้น)"
  });
  cur = poaSum;
  cut("iam", "การสะท้อนที่ผิวกระจกตามมุมตกกระทบ (IAM)", poaEffSum, "แดดเฉียงตอนเช้า/เย็นสะท้อนออกจากหน้าแผงมากกว่าแดดตั้งฉาก", {
    unit: scR(poaEffSum / (dcKw || 1), 0).toLocaleString() + " kWh/m²"
  });
  chain.push({
    k: "nom",
    kind: "mark",
    label: "พลังงานนามของแผงที่ประสิทธิภาพ STC",
    kwh: Math.round(poaEffSum),
    note: areaOne > 0 ? "แผง " + nPanels + " ใบ · พื้นที่รับแสง " + scR(areaAll, 1) + " m² · ประสิทธิภาพ " + scR(etaStc, 1) + "%" : "กำลังติดตั้ง " + scR(dcKw, 2) + " kWp (คลังยังไม่ระบุขนาดแผง จึงยังบอกพื้นที่ไม่ได้)"
  });
  cut("temp", "อุณหภูมิเซลล์สูงกว่า 25 °C", grossNoShade, "แบบจำลอง Sandia · " + (SC_MOUNT[o.mount] || SC_MOUNT.close).label + " · ลม " + scNum(o.wind, SC_WIND) + " m/s");
  cut("shade", shg ? "เงาบัง (คำนวณจากโมเดล 3 มิติ)" : "เงาบัง (กรอกเอง)", shg ? gross : gross * (1 - scNum(loss.shade, 0) / 100), shg ? "ยิงลำแสงจริงจากแผงทุกใบ รวมผลไดโอดบายพาสฉุดทั้งสตริงแล้ว" : null);
  cut("soil", "ฝุ่น/คราบบนหน้าแผง", cur * (1 - scNum(loss.soil, 0) / 100));
  cut("mismatch", "แผงไม่เท่ากัน (mismatch)", cur * (1 - scNum(loss.mismatch, 0) / 100), "แผงต่ออนุกรมกัน กระแสไหลได้เท่าใบที่อ่อนที่สุด");
  cut("wire", "สูญเสียในสาย DC", cur * (1 - scNum(loss.wire, 0) / 100));
  cut("avail", "ระบบหยุด/ซ่อมบำรุง", cur * (1 - scNum(loss.avail, 0) / 100));
  chain.push({
    k: "dc",
    kind: "mark",
    label: "พลังงาน DC ที่เข้าอินเวอร์เตอร์",
    kwh: Math.round(cur)
  });
  cut("inv", "การแปลง DC → AC ในอินเวอร์เตอร์", cur * eff, "ประสิทธิภาพ " + scR(eff * 100, 1) + "%");
  cut("clip", "อินเวอร์เตอร์รับไม่หมด ถูกตัดยอด (clipping)", net, acKw > 0 ? "DC/AC = " + scR(dcAc, 2) + " · ตัดที่ " + acKw + " kW" : "ยังไม่ได้ระบุขนาด AC");
  chain.push({
    k: "ac",
    kind: "end",
    label: "พลังงาน AC ที่ส่งออกจากระบบ",
    kwh: Math.round(net),
    pct: nominal > 0 ? scR(net / nominal * 100, 1) : 0
  });
  const perGroup = gs.map(x => Object.assign({}, x.g, {
    kwp: scR(x.kwp, 2),
    kwhPerKwp: Math.round(x.kwh / (x.kwp || 1)),
    kwh: Math.round(x.kwh),
    poa: scR(x.poa / (x.kwp || 1), 0),
    shade: scR((1 - x.sf) * 100, 1)
  }));
  return {
    perGroup,
    dcKw: scR(dcKw, 2),
    acKw,
    dcAc: scR(dcAc, 2),
    chain,
    nominal: Math.round(nominal),
    ghiPerM2: scR(ghiSum, 0),
    area: scR(areaAll, 1),
    etaStc: scR(etaStc, 1),
    tiltGain: eGhi > 0 ? scR((poaSum - eGhi) / eGhi * 100, 1) : 0,
    annual: Math.round(net),
    monthly: monthly.map(v => Math.round(v)),
    hourly: hrly.map((row, m) => row.map(v => scR(v / SC_MDAYS[m], 4))),
    perKwp: dcKw ? Math.round(net / dcKw) : 0,
    poaPerKwp: dcKw ? scR(poaSum / dcKw, 0) : 0,
    pr: poaSum ? scR(net / poaSum * 100, 1) : 0,
    clipLoss: beforeClip > 0 ? scR((1 - net / beforeClip) * 100, 1) : 0,
    clipKwh: Math.round(Math.max(0, beforeClip - net)),
    dcLoss: scR((1 - dcLoss) * 100, 1),
    eff: scR(eff * 100, 1),
    mount: o.mount,
    mountLabel: (SC_MOUNT[o.mount] || SC_MOUNT.close).label,
    wind: scNum(o.wind, SC_WIND),
    shadeMode: shg ? "model" : "manual",
    shadeLoss: shg ? scR(gs.reduce((a, x) => a + (1 - x.sf) * x.kwp, 0) / (dcKw || 1) * 100, 1) : scR(scNum(loss.shade, 0), 1)
  };
}
function scLife(annual, panel, years) {
  const y = Math.max(1, Math.round(years || 15));
  const d1 = scNum(panel.deg1, SC_PANEL_EXTRA.deg1) / 100,
    dy = scNum(panel.degY, SC_PANEL_EXTRA.degY) / 100;
  const rows = [];
  let total = 0;
  for (let i = 1; i <= y; i++) {
    const factor = (1 - d1) * Math.pow(1 - dy, i - 1);
    const kwh = Math.round(annual * factor);
    total += kwh;
    rows.push({
      year: i,
      factor: scR(factor * 100, 1),
      kwh
    });
  }
  return {
    rows,
    total,
    years: y,
    avg: Math.round(total / y),
    lastPct: rows[rows.length - 1].factor
  };
}
const SC_ENVF = {
  ef: 0.4999,
  tree: 9.5,
  carKm: 0.12,
  petrol: 2.31,
  home: 2400,
  embod: 550
};
function scEnviron(annual, lifeTotal, years, dcKw, o) {
  const F = Object.assign({}, SC_ENVF, o || {});
  const a = Math.max(0, scNum(annual, 0)),
    tot = Math.max(0, scNum(lifeTotal, a));
  const yrs = Math.max(1, Math.round(years || 15));
  const co2Y = a * scNum(F.ef, SC_ENVF.ef);
  const co2L = tot * scNum(F.ef, SC_ENVF.ef);
  const embod = Math.max(0, scNum(dcKw, 0)) * scNum(F.embod, SC_ENVF.embod);
  return {
    ef: scNum(F.ef, SC_ENVF.ef),
    years: yrs,
    co2Year: Math.round(co2Y),
    co2YearT: scR(co2Y / 1000, 2),
    co2Life: Math.round(co2L),
    co2LifeT: scR(co2L / 1000, 1),
    trees: Math.round(co2Y / scNum(F.tree, SC_ENVF.tree)),
    treesLife: Math.round(co2L / scNum(F.tree, SC_ENVF.tree)),
    carKm: Math.round(co2Y / scNum(F.carKm, SC_ENVF.carKm)),
    petrol: Math.round(co2Y / scNum(F.petrol, SC_ENVF.petrol)),
    homes: scR(a / scNum(F.home, SC_ENVF.home), 1),
    embod: Math.round(embod),
    embodT: scR(embod / 1000, 2),
    carbonPayback: co2Y > 0 ? scR(embod / co2Y, 1) : null,
    ratio: embod > 0 ? scR(co2L / embod, 0) : null
  };
}
const SC_LOADS = {
  home: {
    label: "บ้านพักอาศัย (กลางวันไม่ค่อยมีคน)",
    hint: "พีคตอนเย็น — ไฟที่ผลิตกลางวันจะเหลือขายคืนเยอะ ถ้าไม่มีแบต",
    shape: [3, 2.5, 2.5, 2.5, 2.5, 3, 5, 6, 4, 3.5, 3.5, 4, 4.5, 4, 3.5, 3.5, 4, 5, 8, 9, 8.5, 7, 5.5, 4]
  },
  homeDay: {
    label: "บ้าน มีคนอยู่กลางวัน + แอร์",
    hint: "ใช้เองกลางวันได้มาก คืนทุนเร็วกว่าบ้านทั่วไป",
    shape: [4, 3.5, 3, 3, 3, 3.5, 5, 5.5, 5, 5.5, 6.5, 7, 7.5, 7.5, 7.5, 7, 6.5, 6.5, 8, 9, 8.5, 7, 5.5, 4.5]
  },
  office: {
    label: "สำนักงาน / ออฟฟิศ",
    hint: "โหลดตรงกับแดดพอดี เหมาะกับโซลาร์ที่สุด",
    shape: [1, 1, 1, 1, 1, 1.2, 2, 4, 7, 9, 9.5, 9.5, 8, 9, 9.5, 9, 7.5, 4, 2.5, 1.8, 1.5, 1.3, 1.2, 1]
  },
  shop: {
    label: "ร้านค้า / ร้านอาหาร",
    hint: "เปิดสาย ปิดดึก — ครึ่งหลังของวันต้องซื้อไฟอยู่ดี",
    shape: [1.5, 1.3, 1.2, 1.2, 1.2, 1.5, 2, 2.5, 3.5, 5, 7, 8, 8.5, 7.5, 7, 7, 7.5, 8, 8.5, 8, 7, 5.5, 3.5, 2]
  },
  fac1: {
    label: "โรงงาน 1 กะ (8:00–17:00)",
    hint: "พีคกลางวันเต็ม ๆ ระบบขนาดใหญ่ใช้เองได้เกือบหมด",
    shape: [2, 2, 2, 2, 2, 2.5, 4, 7, 9, 9.5, 9.5, 7, 9.5, 9.5, 9, 8, 5, 3, 2.5, 2, 2, 2, 2, 2]
  },
  fac2: {
    label: "โรงงาน 2 กะ (8:00–24:00)",
    hint: "กะดึกต้องซื้อไฟ — แบตช่วยได้ชัดถ้าค่าไฟแพง",
    shape: [2, 2, 2, 2, 2, 2.5, 4, 6.5, 8, 8.5, 8.5, 6.5, 8.5, 8.5, 8, 7.5, 7, 6.5, 6, 6, 5.5, 5, 4, 3]
  },
  fac24: {
    label: "เดินเครื่อง 24 ชั่วโมง",
    hint: "โหลดเกือบราบ ใช้เองได้ 100% ถ้าระบบไม่ใหญ่เกินโหลดกลางวัน",
    shape: [3.5, 3.5, 3.5, 3.5, 3.5, 3.8, 4.2, 4.5, 4.8, 5, 5, 4.5, 5, 5, 4.8, 4.6, 4.4, 4.2, 4, 4, 3.8, 3.8, 3.6, 3.5]
  },
  custom: {
    label: "กรอกเอง 24 ช่อง",
    hint: "ถ้ามีข้อมูลจากมิเตอร์ TOU หรือเครื่องบันทึกโหลด ใส่ตรงนี้ได้เลย",
    shape: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
  }
};
const SC_LOAD = {
  preset: "office",
  mode: "month",
  kwhMonth: 0,
  kwhYear: 0,
  shape: null,
  monScale: null
};
const SC_MONSCALE_AC = [90, 95, 112, 122, 118, 105, 100, 100, 98, 96, 92, 88];
function scLoadProfile(cfg) {
  const C = Object.assign({}, SC_LOAD, cfg || {});
  const P = SC_LOADS[C.preset] || SC_LOADS.office;
  let sh = C.preset === "custom" && C.shape && C.shape.length === 24 ? C.shape : P.shape;
  sh = sh.map(v => Math.max(0, scNum(v, 0)));
  const tot = sh.reduce((a, b) => a + b, 0) || 1;
  const shape = sh.map(v => v / tot);
  const annual0 = C.mode === "year" ? scNum(C.kwhYear, 0) : scNum(C.kwhMonth, 0) * 12;
  const ms = C.monScale && C.monScale.length === 12 ? C.monScale.map(v => Math.max(0, scNum(v, 100)) / 100) : new Array(12).fill(1);
  const wsum = ms.reduce((a, v, m) => a + v * SC_MDAYS[m], 0) || 365;
  const daily = ms.map(v => annual0 > 0 ? annual0 * v / wsum : 0);
  const monthly = daily.map((d, m) => d * SC_MDAYS[m]);
  return {
    shape,
    daily,
    monthly,
    preset: C.preset,
    label: P.label,
    hint: P.hint,
    annual: Math.round(monthly.reduce((a, b) => a + b, 0)),
    perDay: scR(annual0 / 365, 1),
    peakKw: scR(Math.max.apply(null, shape) * (annual0 / 365), 2)
  };
}
const SC_BATT = {
  on: false,
  chem: "lfp",
  kwh: 10,
  dod: 90,
  pKw: 5,
  rte: 90,
  reserve: 20,
  standby: 1,
  cycles: 6000,
  calYears: 15,
  eol: 70,
  degY: 2,
  costMode: "perKwh",
  cost: 12000,
  lump: 0
};
const SC_CHEM = {
  lfp: {
    label: "ลิเทียมฟอสเฟต (LFP)",
    dod: 95,
    rte: 92,
    cycles: 6000,
    calYears: 15,
    eol: 70,
    cost: 12000
  },
  nmc: {
    label: "ลิเทียม NMC",
    dod: 90,
    rte: 94,
    cycles: 4000,
    calYears: 12,
    eol: 70,
    cost: 14000
  },
  lead: {
    label: "ตะกั่วกรด / ดีพไซเคิล",
    dod: 50,
    rte: 80,
    cycles: 800,
    calYears: 6,
    eol: 80,
    cost: 6000
  }
};
function scBattSpec(o) {
  const B = Object.assign({}, SC_BATT, o || {});
  const cap = Math.max(0, scNum(B.kwh, 0));
  const usable = cap * scClamp(scNum(B.dod, 90), 5, 100) / 100;
  const reserve = usable * scClamp(scNum(B.reserve, 0), 0, 90) / 100;
  const capex = B.costMode === "lump" ? scNum(B.lump, 0) : scNum(B.cost, 0) * cap;
  return Object.assign({}, B, {
    cap,
    usable: scR(usable, 2),
    reserve: scR(reserve, 2),
    reservePct: scClamp(scNum(B.reserve, 0), 0, 90),
    work: scR(Math.max(0, usable - reserve), 2),
    capex: Math.round(capex)
  });
}
function scDispatch(hourly, prof, batt, opt) {
  opt = opt || {};
  if (!hourly || !hourly.length || !prof) return null;
  const B = scBattSpec(batt);
  const on = !!B.on && B.usable > 0;
  const usable = on ? B.usable : 0,
    floor = on ? B.reserve : 0;
  const rte = scClamp(scNum(B.rte, 90), 50, 100) / 100;
  const eC = Math.sqrt(rte),
    eD = Math.sqrt(rte);
  const pMax = on ? Math.max(0, scNum(B.pKw, 0)) : 0;
  const stby = on ? usable * scClamp(scNum(B.standby, 0), 0, 10) / 100 / 24 : 0;
  const zero = !!opt.zeroExport;
  const lim = zero ? 0 : scNum(opt.expLimitKw, 0) > 0 ? scNum(opt.expLimitKw) : Infinity;
  const months = [],
    dayRows = [];
  let soc = floor;
  const A = {
    pv: 0,
    load: 0,
    direct: 0,
    chg: 0,
    dis: 0,
    exp: 0,
    curt: 0,
    imp: 0
  };
  for (let m = 0; m < 12; m++) {
    const days = SC_MDAYS[m],
      sum = {
        pv: 0,
        load: 0,
        direct: 0,
        chg: 0,
        dis: 0,
        exp: 0,
        curt: 0,
        imp: 0
      };
    const rows = [];
    for (let pass = 0; pass < 4; pass++) {
      const keep = pass === 3;
      if (keep) rows.length = 0;
      for (let h = 0; h < 24; h++) {
        const pv = Math.max(0, scNum(hourly[m][h], 0));
        const ld = prof.daily[m] * prof.shape[h];
        if (on) soc = Math.max(0, soc - stby);
        const direct = Math.min(pv, ld);
        let sur = pv - direct,
          def = ld - direct,
          chg = 0,
          dis = 0;
        if (on && sur > 0) {
          chg = Math.min(sur, (usable - soc) / eC, pMax);
          if (chg > 0) {
            soc += chg * eC;
            sur -= chg;
          } else chg = 0;
        }
        if (on && def > 0) {
          dis = Math.min(def, Math.max(0, soc - floor) * eD, pMax);
          if (dis > 0) {
            soc -= dis / eD;
            def -= dis;
          } else dis = 0;
        }
        const exp = Math.min(sur, lim),
          curt = sur - exp;
        if (keep) {
          sum.pv += pv;
          sum.load += ld;
          sum.direct += direct;
          sum.chg += chg;
          sum.dis += dis;
          sum.exp += exp;
          sum.curt += curt;
          sum.imp += def;
          rows.push({
            h,
            pv: scR(pv, 3),
            load: scR(ld, 3),
            direct: scR(direct, 3),
            chg: scR(chg, 3),
            dis: scR(dis, 3),
            exp: scR(exp, 3),
            curt: scR(curt, 3),
            imp: scR(def, 3),
            soc: scR(usable > 0 ? soc / usable * 100 : 0, 1)
          });
        }
      }
    }
    const mo = {
      m,
      label: SC_MON[m],
      days,
      rows
    };
    Object.keys(sum).forEach(k => {
      mo[k] = scR(sum[k] * days, 1);
      A[k] += sum[k] * days;
    });
    mo.selfPct = sum.pv > 0 ? scR((sum.direct + sum.dis) / sum.pv * 100, 1) : 0;
    mo.suffPct = sum.load > 0 ? scR((sum.direct + sum.dis) / sum.load * 100, 1) : 0;
    months.push(mo);
    dayRows.push(rows);
  }
  const selfKwh = A.direct + A.dis;
  const pvUse = Math.max(0, A.pv - A.curt);
  const cyc = usable > 0 ? A.dis / usable : 0;
  const byCycle = cyc > 0 ? scNum(B.cycles, 6000) / cyc : Infinity;
  const battLife = on ? Math.min(byCycle, scNum(B.calYears, 15)) : null;
  return {
    on,
    months,
    dayRows,
    batt: B,
    zeroExport: zero,
    expLimitKw: lim === Infinity ? null : lim,
    pv: Math.round(A.pv),
    load: Math.round(A.load),
    direct: Math.round(A.direct),
    chg: Math.round(A.chg),
    dis: Math.round(A.dis),
    exp: Math.round(A.exp),
    curt: Math.round(A.curt),
    imp: Math.round(A.imp),
    selfKwh: Math.round(selfKwh),
    pvUse: Math.round(pvUse),
    selfPct: A.pv > 0 ? scR(selfKwh / A.pv * 100, 1) : 0,
    suffPct: A.load > 0 ? scR(selfKwh / A.load * 100, 1) : 0,
    expPct: A.pv > 0 ? scR(A.exp / A.pv * 100, 1) : 0,
    curtPct: A.pv > 0 ? scR(A.curt / A.pv * 100, 1) : 0,
    battLoss: Math.round(A.chg - A.dis),
    cycles: scR(cyc, 0),
    battLife: battLife == null ? null : scR(battLife, 1),
    byCycle: byCycle === Infinity ? null : scR(byCycle, 1),
    fSelf: A.pv > 0 ? selfKwh / A.pv : 0,
    fDirect: A.pv > 0 ? A.direct / A.pv : 0,
    fDis: A.pv > 0 ? A.dis / A.pv : 0,
    fExp: A.pv > 0 ? A.exp / A.pv : 0,
    fCurt: A.pv > 0 ? A.curt / A.pv : 0
  };
}
const SC_UNC = {
  irr: 4.5,
  model: 3.0,
  soil: 2.0,
  avail: 1.5,
  degr: 1.0
};
const SC_PZ = [{
  p: 50,
  z: 0
}, {
  p: 75,
  z: 0.6745
}, {
  p: 90,
  z: 1.2816
}, {
  p: 95,
  z: 1.6449
}, {
  p: 99,
  z: 2.3263
}];
function scPxx(annual, o, years) {
  const U = Object.assign({}, SC_UNC, o || {});
  const y = Math.max(1, Math.round(years || 1));
  const sq = v => scNum(v, 0) * scNum(v, 0);
  const fixed = sq(U.model) + sq(U.soil) + sq(U.avail) + sq(U.degr);
  const s1 = Math.sqrt(sq(U.irr) + fixed);
  const sN = Math.sqrt(sq(U.irr) / y + fixed);
  const a = Math.max(0, scNum(annual, 0));
  const mk = sig => SC_PZ.map(x => ({
    p: x.p,
    z: x.z,
    kwh: Math.round(a * (1 - x.z * sig / 100)),
    pct: scR(100 - x.z * sig, 1)
  }));
  const one = mk(s1),
    avg = mk(sN);
  const pick = (rows, p) => (rows.find(r => r.p === p) || rows[0]).kwh;
  return {
    parts: [{
      k: "irr",
      label: "แสงแต่ละปีไม่เท่ากัน",
      v: scNum(U.irr, 0)
    }, {
      k: "model",
      label: "ความคลาดของแบบจำลอง",
      v: scNum(U.model, 0)
    }, {
      k: "soil",
      label: "ฝุ่น/คราบและรอบการล้าง",
      v: scNum(U.soil, 0)
    }, {
      k: "avail",
      label: "ระบบหยุดโดยไม่ได้วางแผน",
      v: scNum(U.avail, 0)
    }, {
      k: "degr",
      label: "ค่าเสื่อมจริงของแผง",
      v: scNum(U.degr, 0)
    }],
    years: y,
    sigma1: scR(s1, 2),
    sigmaN: scR(sN, 2),
    p50: Math.round(a),
    one,
    avg,
    p90one: pick(one, 90),
    p90avg: pick(avg, 90),
    p75avg: pick(avg, 75),
    p99avg: pick(avg, 99),
    kP90: a > 0 ? scR(pick(avg, 90) / a, 4) : 1,
    kP75: a > 0 ? scR(pick(avg, 75) / a, 4) : 1
  };
}
function scBlankSys() {
  return {
    mode: "string",
    panelModel: "",
    panel: {},
    invModel: "",
    inv: {},
    invCount: 1,
    microRatio: "",
    series: 0,
    assign: {},
    manual: false,
    mpptPick: {},
    loss: Object.assign({}, SC_LOSS),
    env: Object.assign({}, SC_ENV),
    tamb: SC_TAMB.slice(),
    kc: SC_KC.slice(),
    years: 15,
    site: {
      date: "",
      hour: null,
      wind: 1,
      mount: "close",
      tAmb: null,
      ghi: null,
      shade: 0,
      age: 0
    },
    micro: null,
    microAssign: {},
    phases: null,
    microPhase: {},
    microManual: false,
    meas: {},
    shade3d: null,
    elec: null,
    roi: null,
    load: null,
    batt: null,
    grid: null,
    unc: null
  };
}
function scPanelSpec(sys) {
  const B = window.BOQ || {};
  const stock = (B.PANELS || []).find(p => p.model === (sys && sys.panelModel)) || {};
  return Object.assign({}, SC_PANEL_EXTRA, stock, sys && sys.panel || {});
}
function scHalfCut(panel) {
  if (panel && panel.halfCut != null) return {
    half: !!panel.halfCut,
    why: "ระบุเอง"
  };
  const m = String(panel && panel.model || "");
  if (/half[\s-]?cut|\bhc\b|HVH|HPH|HPBH|HBD/i.test(m)) return {
    half: true,
    why: "จากชื่อรุ่นในคลัง"
  };
  if (/Hi-?MO|TOPCon|Vertex|Tiger|DUOMAX|Twin/i.test(m)) return {
    half: true,
    why: "รุ่นตระกูลนี้เป็นครึ่งเซลล์"
  };
  if (scNum(panel && panel.wp) >= 400) return {
    half: true,
    why: "กำลัง " + scNum(panel.wp) + "W ขึ้นไปเป็นครึ่งเซลล์แทบทั้งหมด"
  };
  if (scNum(panel && panel.wp) > 0) return {
    half: false,
    why: "กำลังต่ำกว่า 400W มักเป็นเซลล์เต็ม"
  };
  return {
    half: false,
    why: "ยังไม่ได้เลือกรุ่นแผง"
  };
}
function scInvSpec(sys) {
  const B = window.BOQ || {};
  const stock = (B.INVERTERS || []).find(p => p.model === (sys && sys.invModel)) || {};
  return Object.assign({}, SC_INV_EXTRA, stock, sys && sys.inv || {});
}
Object.assign(window, {
  SC_DEG,
  SC_MON,
  SC_MDAYS,
  SC_PANEL_EXTRA,
  SC_INV_EXTRA,
  SC_ENV,
  SC_LOSS,
  SC_TAMB,
  SC_KC,
  SC_MOUNT,
  SC_WIND,
  scTcell,
  scIam,
  SC_IAM_DIFF,
  scStringFuse,
  SC_FUSE_SIZES,
  scSunPos,
  scNormalToTiltAz,
  scPanelNormal,
  scGroupsFromPlan,
  scPanelIndex,
  scStringsFromAssign,
  scAutoAssign,
  scVocAt,
  scVmpAt,
  scStringCheck,
  scSeriesRange,
  scCurrent,
  scStringsPerMppt,
  scMpptName,
  scPinLayout,
  scPinAddr,
  scAutoStrings,
  scMicroPlan,
  scMicroSpec,
  scMicroPerMppt,
  scMicroAssign,
  scMicroPhases,
  scPhaseBalance,
  SC_MICRO_EXTRA,
  scYearOneGroup,
  scDcAt,
  scEnergy,
  scLife,
  scBlankSys,
  scPanelSpec,
  scInvSpec,
  scHalfCut,
  scR,
  scNum,
  scClamp,
  scEnviron,
  SC_ENVF,
  SC_LOADS,
  SC_LOAD,
  SC_MONSCALE_AC,
  scLoadProfile,
  SC_BATT,
  SC_CHEM,
  scBattSpec,
  scDispatch,
  SC_UNC,
  SC_PZ,
  scPxx
});
window.SolarCalc = {
  groups: scGroupsFromPlan,
  seriesRange: scSeriesRange,
  check: scStringCheck,
  autoStrings: scAutoStrings,
  micro: scMicroPlan,
  energy: scEnergy,
  life: scLife,
  blankSys: scBlankSys,
  panelSpec: scPanelSpec,
  invSpec: scInvSpec,
  microSpec: scMicroSpec,
  loadProfile: scLoadProfile,
  dispatch: scDispatch,
  battSpec: scBattSpec,
  pxx: scPxx
};