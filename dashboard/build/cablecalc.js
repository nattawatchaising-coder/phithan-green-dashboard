(function () {
  const SIZES = [1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500];
  const AMP = {
    a1c2: [null, null, null, null, null, null, null, 121, 149, 180, 230, 278, 322, 358, 409, 480, 549, 622, 713],
    amc2: [15, 20, 27, 36, 46, 63, 83, 108, 133, 159, 201, 241, 278, 304, 349, 418, 484, null, null],
    a1c3: [null, null, null, null, null, null, null, 106, 131, 159, 202, 245, 284, 311, 349, 410, 468, 531, 606],
    amc3: [14, 18, 24, 32, 40, 55, 73, 96, 116, 140, 177, 212, 244, 273, 309, 362, 414, null, null]
  };
  const MV = {
    v3_125: [40, 27, 16, 10, 6.8, 4, 2.5, 1.6, 1.17, 0.91, 0.65, 0.5, 0.42, 0.37, 0.32, 0.27, 0.24, 0.22, 0.2],
    v3_tre: [40, 27, 16, 10, 6.8, 4, 2.5, 1.57, 1.14, 0.87, 0.61, 0.45, 0.37, 0.31, 0.26, 0.22, 0.19, 0.17, 0.15],
    v3_flt: [40, 27, 16, 10, 6.8, 4, 2.5, 1.58, 1.15, 0.87, 0.62, 0.46, 0.38, 0.33, 0.27, 0.23, 0.2, 0.18, 0.16],
    v3_spc: [40, 27, 16, 10, 6.8, 4, 2.5, 1.6, 1.17, 0.9, 0.64, 0.5, 0.42, 0.37, 0.31, 0.27, 0.24, 0.22, 0.2],
    v3_mc: [40, 27, 16, 10, 6.8, 4, 2.5, 1.6, 1.15, 0.86, 0.6, 0.44, 0.36, 0.31, 0.25, 0.22, 0.18, 0.16, null],
    v1_125: [46, 31, 19, 12, 7.9, 4.7, 2.9, 1.85, 1.37, 1.04, 0.75, 0.58, 0.49, 0.42, 0.37, 0.32, 0.28, 0.25, 0.23],
    v1_tch: [46, 31, 19, 12, 7.9, 4.7, 2.9, 1.85, 1.35, 1, 0.7, 0.52, 0.42, 0.36, 0.31, 0.25, 0.22, 0.19, 0.17],
    v1_spc: [46, 31, 19, 12, 7.9, 4.7, 2.9, 1.85, 1.37, 1.02, 0.73, 0.56, 0.47, 0.4, 0.35, 0.3, 0.26, 0.23, 0.21],
    v1_mc: [46, 31, 19, 12, 7.9, 4.7, 2.9, 1.85, 1.35, 0.99, 0.68, 0.52, 0.42, 0.35, 0.3, 0.24, 0.21, 0.19, null]
  };
  const CA = [[11, 15, 1.23], [16, 20, 1.19], [21, 25, 1.14], [26, 30, 1.1], [31, 35, 1.05], [36, 40, 1], [41, 45, 0.96], [46, 50, 0.9], [51, 55, 0.84], [56, 60, 0.78], [61, 65, 0.71], [66, 70, 0.64], [71, 75, 0.55], [76, 80, 0.45]];
  const CG = {
    "V-H": {
      th: "รางระบายอากาศ วางชิดกันแนวนอน",
      t: {
        1: [1, 0.91, 0.87, 0.82, 0.78, 0.77],
        2: [0.96, 0.87, 0.81, 0.78, 0.74, 0.69],
        3: [0.95, 0.85, 0.78, 0.75, 0.7, 0.65]
      }
    },
    "VV-T": {
      th: "รางระบายอากาศแนวตั้ง วางชิดกันแนวตั้ง",
      t: {
        1: [1, 0.86, 0.8, 0.75, 0.71, 0.7],
        2: [0.95, 0.84, 0.77, 0.72, 0.67, 0.66]
      }
    },
    "L-H": {
      th: "รางบันได วางชิดกันแนวนอน",
      t: {
        1: [1, 0.97, 0.96, 0.94, 0.93, 0.92],
        2: [0.98, 0.93, 0.89, 0.88, 0.86, 0.83],
        3: [0.97, 0.9, 0.86, 0.83, 0.8, 0.77]
      }
    },
    "V-2D": {
      th: "รางระบายอากาศ สามเหลี่ยม ห่าง ≥2D",
      t: {
        1: [1, 0.98, 0.96, 0.93, 0.89, null],
        2: [0.97, 0.93, 0.89, 0.85, 0.8, null],
        3: [0.96, 0.92, 0.86, 0.82, 0.76, null]
      }
    },
    "VV-2D": {
      th: "รางระบายอากาศแนวตั้ง สามเหลี่ยม ห่าง ≥2D",
      t: {
        1: [1, 0.91, 0.89, 0.88, 0.87, null],
        2: [1, 0.9, 0.86, 0.85, 0.83, null]
      }
    },
    "L-2D": {
      th: "รางบันได สามเหลี่ยม ห่าง ≥2D",
      t: {
        1: [1, 1, 1, 1, 1, null],
        2: [0.97, 0.95, 0.93, 0.92, 0.91, null],
        3: [0.96, 0.94, 0.9, 0.89, 0.86, null]
      }
    }
  };
  const CG_LB = [1, 2, 3, 4, 5, 7];
  const CB_AT = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 225, 250, 300, 320, 350, 400, 500, 630, 700, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
  const CB_AF = [100, 160, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
  const PE = [[20, 2.5], [40, 4], [70, 6], [100, 10], [200, 16], [400, 25], [500, 35], [800, 50], [1000, 70], [1250, 95], [2000, 120], [2500, 185], [4000, 240], [6000, 400]];
  const PV_K90 = 1 + 0.00393 * 70;
  const PV = [[1.5, 13.7, 30], [2.5, 8.21, 41], [4, 5.09, 55], [6, 3.39, 70], [10, 1.95, 98], [16, 1.24, 132], [25, 0.795, 176], [35, 0.565, 218]].map(([s, r20, a]) => ({
    s,
    r20,
    r90: r20 * PV_K90,
    a
  }));
  const num = v => v === "" || v == null ? NaN : +v;
  const has = v => v !== "" && v != null && !(typeof v === "number" && isNaN(v));
  const r2 = x => Math.round(x * 100) / 100;
  function ca(t) {
    t = num(t);
    if (!isFinite(t)) return NaN;
    let f = NaN;
    CA.forEach(([lo,, k]) => {
      if (t >= lo) f = k;
    });
    return f;
  }
  function cg(code, trays, circ, manual) {
    if (code === "manual") return num(manual);
    const c = CG[code];
    if (!c) return 1;
    const row = c.t[Math.max(1, Math.round(num(trays) || 1))];
    if (!row) return NaN;
    let i = -1;
    CG_LB.forEach((lb, k) => {
      if ((num(circ) || 1) >= lb) i = k;
    });
    const v = i >= 0 ? row[i] : NaN;
    return v == null ? NaN : v;
  }
  const cb = i => CB_AT.find(a => a >= i) || NaN;
  const af = at => CB_AF.find(f => at <= f) || NaN;
  const pe = at => {
    const r = PE.find(([a]) => a >= at);
    return r ? r[1] : NaN;
  };
  const pvOf = s => PV.find(p => p.s === +s) || null;
  const pvR90 = s => {
    const p = pvOf(s);
    return p ? p.r90 : null;
  };
  function vocMax(n, voc, betaPct, tMin) {
    return n * voc * (1 + num(betaPct) / 100 * (num(tMin) - 25));
  }
  function dcVd(imp, lenM, size, vStr) {
    const r = pvR90(size);
    if (!r || !(lenM > 0) || !(imp > 0)) return null;
    const vd = 2 * imp * r * lenM / 1000;
    return {
      vd,
      pct: vStr > 0 ? vd / vStr * 100 : NaN,
      r90: r
    };
  }
  function dcString(s, m, o) {
    o = o || {};
    const kDC = num(o.kDC) || 1.25,
      Ca = num(o.ca) || 1,
      Cg = num(o.cg) || 1,
      lim = (num(o.vdLim) || 3) / 100,
      min = num(o.minSize) || 4;
    const tk = num(o.tempK) || 1;
    const n = num(s.n),
      L = num(s.len),
      id = kDC * num(m.isc),
      vStr = n * num(m.vmp);
    const out = {
      n,
      len: L,
      id: r2(id),
      vStr: r2(vStr),
      valid: isFinite(n) && n > 0 && isFinite(L) && L > 0
    };
    const rmax = out.valid ? lim * vStr * 1000 / (2 * num(m.imp) * L) : Infinity;
    const pick = PV.find(p => p.s >= min && p.a * tk * Ca * Cg >= id && p.r90 <= rmax);
    out.auto = pick ? pick.s : NaN;
    out.use = has(s.ovr) ? num(s.ovr) : out.auto;
    const p = pvOf(out.use);
    out.iz = p ? r2(p.a * tk * Ca * Cg) : NaN;
    out.ampOk = isFinite(out.iz) && out.iz >= id;
    const v = out.valid && p ? dcVd(num(m.imp), L, out.use, vStr) : null;
    out.vd = v ? r2(v.vd) : NaN;
    out.pct = v ? r2(v.pct) : NaN;
    out.r90 = p ? Math.round(p.r90 * 1000) / 1000 : NaN;
    out.vdOk = isFinite(out.pct) && out.pct <= lim * 100 + 1e-9;
    out.minOk = isFinite(out.use) && out.use >= min;
    out.ok = out.ampOk && out.vdOk && out.minOk;
    return out;
  }
  function ac(r) {
    const o = {};
    o.sys = r.sys === "1P" ? "1P" : "3P";
    o.v = num(r.v) || (o.sys === "3P" ? 400 : 230);
    o.imax = num(r.imax);
    o.k = has(r.k) ? num(r.k) : 1.25;
    o.ireq = o.imax * o.k;
    o.at = cb(o.ireq);
    o.af = af(o.at);
    o.ca = ca(has(r.ta) ? r.ta : 40);
    o.cg = cg(r.cgm, r.trays, r.circ, r.cgman);
    o.n = Math.max(1, Math.round(num(r.n) || 1));
    o.it = o.at / (o.ca * o.cg * o.n);
    o.len = num(r.len);
    const lim = (num(r.vdLim) || 2) / 100;
    o.mvMax = lim * o.v * 1000 / (o.imax / o.n * o.len);
    const single = r.ct !== "MC";
    const ampKey = (single ? "a1c" : "amc") + (o.sys === "3P" ? "3" : "2");
    const mvKey = o.sys === "3P" ? !single ? "v3_mc" : {
      Trefoil: "v3_tre",
      Flat: "v3_flt",
      Spaced: "v3_spc"
    }[r.arr] || "v3_125" : !single ? "v1_mc" : r.arr === "Spaced" ? "v1_spc" : r.arr === "Group" ? "v1_125" : "v1_tch";
    o.ampKey = ampKey;
    o.mvKey = mvKey;
    let auto = NaN;
    for (let i = 0; i < SIZES.length; i++) {
      const a = AMP[ampKey][i],
        mv = MV[mvKey][i];
      if (a != null && mv != null && a >= o.it && mv <= o.mvMax) {
        auto = SIZES[i];
        break;
      }
    }
    o.auto = auto;
    o.use = has(r.ovr) ? num(r.ovr) : auto;
    const si = SIZES.indexOf(o.use);
    o.amp = si >= 0 ? AMP[ampKey][si] : null;
    o.mv = si >= 0 ? MV[mvKey][si] : null;
    o.iz = o.amp != null ? r2(o.amp * o.ca * o.cg * o.n) : NaN;
    o.ampOk = isFinite(o.iz) && o.iz >= o.at;
    o.vd = o.mv != null ? o.mv * (o.imax / o.n) * o.len / 1000 : NaN;
    o.pct = r2(o.vd / o.v * 100);
    o.vd = r2(o.vd);
    o.vdOk = isFinite(o.pct) && o.pct <= lim * 100 + 1e-9;
    o.peMin = pe(o.at);
    o.pe = has(r.peovr) ? num(r.peovr) : o.peMin;
    o.peOk = isFinite(o.pe) && o.pe >= o.peMin;
    o.valid = isFinite(o.imax) && o.imax > 0 && isFinite(o.len) && o.len > 0;
    o.ok = o.ampOk && o.vdOk && o.peOk;
    o.cable = isFinite(o.use) ? (o.n > 1 ? o.n + "×" : "") + (single ? o.sys === "3P" ? "4-1C" : "2-1C" : o.sys === "3P" ? "4C" : "2C") + "×" + o.use + " mm²" : "";
    return o;
  }
  function xfmr(kva, hv, lv, z) {
    const s3 = Math.sqrt(3),
      inHv = kva * 1000 / (s3 * hv),
      inLv = kva * 1000 / (s3 * lv);
    return {
      inHv: r2(inHv),
      inLv: r2(inLv),
      ibHv: r2(inHv * 1.25),
      iscLv: r2(inLv * 100 / z / 1000)
    };
  }
  function dcRoutes(paths, stations, o) {
    o = o || {};
    const jump = num(o.jump) || 3,
      spare = num(o.spare) || 1;
    const sts = (stations || []).filter(s => isFinite(+s.x) && isFinite(+s.z));
    const man = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
    const out = {};
    (paths || []).forEach(p => {
      const P = p.pts || [];
      if (!P.length || !sts.length) return;
      const c = [P.reduce((t, q) => t + q[0], 0) / P.length, P.reduce((t, q) => t + q[1], 0) / P.length];
      let S = sts[0],
        best = Infinity;
      sts.forEach(s => {
        const d = man(c, [+s.x, +s.z]);
        if (d < best) {
          best = d;
          S = s;
        }
      });
      const sp = [+S.x, +S.z],
        sy = +S.y || 0,
        ys = p.ys || [];
      const leg = i => man(P[i], sp) + Math.max(0, (+ys[i] || 0) - sy);
      let jmp = 0;
      for (let i = 1; i < P.length; i++) {
        if (Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) > jump) jmp += man(P[i], P[i - 1]);
      }
      const pos = leg(0),
        neg = leg(P.length - 1);
      out[p.id] = {
        pos: r2(pos),
        neg: r2(neg),
        jump: r2(jmp),
        len: Math.ceil((pos + neg + jmp) / 2 * spare),
        station: S.id || null
      };
    });
    return out;
  }
  const CC = {
    SIZES,
    AMP,
    MV,
    CA,
    CG,
    CG_LB,
    CB_AT,
    CB_AF,
    PE,
    PV,
    PV_K90,
    ca,
    cg,
    cb,
    af,
    pe,
    pvOf,
    pvR90,
    vocMax,
    dcVd,
    dcString,
    ac,
    xfmr,
    dcRoutes
  };
  (typeof window !== "undefined" ? window : globalThis).CC = CC;
})();