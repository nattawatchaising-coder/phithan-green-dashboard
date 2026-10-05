const ER_DEF = {
  w: 0,
  d: 4.2,
  h: 3.2,
  tray: true,
  inv: 0
};
function erInvDim(kw) {
  if (kw <= 12) return {
    w: 0.42,
    h: 0.50,
    d: 0.17
  };
  if (kw <= 30) return {
    w: 0.52,
    h: 0.48,
    d: 0.22
  };
  if (kw <= 60) return {
    w: 0.62,
    h: 0.58,
    d: 0.26
  };
  if (kw <= 125) return {
    w: 0.98,
    h: 0.66,
    d: 0.30
  };
  return {
    w: 1.05,
    h: 0.75,
    d: 0.36
  };
}
function erInvSpec(spec, kw, ov) {
  const c = spec && spec.dim ? {
    w: spec.dim.w / 1000,
    h: spec.dim.h / 1000,
    d: spec.dim.d / 1000
  } : null;
  const base = c || erInvDim(kw);
  const o = ov || {};
  return {
    dim: {
      w: +o.w || base.w,
      h: +o.h || base.h,
      d: +o.d || base.d
    },
    src: +o.w || +o.h || +o.d ? "ห้อง" : c ? "คลัง" : "ประมาณ",
    floor: (o.mount || spec && spec.mount || "") === "floor"
  };
}
function erModel(st, job, cfg) {
  let M = null;
  try {
    if (st && window.p3SldModel) M = window.p3SldModel(st, job, null);
  } catch (e) {
    M = null;
  }
  const micro = !!M && M.mode === "micro";
  const units = M && M.units ? M.units : [];
  const inv = M && M.inv || {};
  let kws = micro ? [] : units.map(u => (+u.w || +inv.w || 5000) / 1000);
  let froms = micro ? [] : units.map(u => u.from === 2 ? 2 : 1);
  if (!M) {
    const kw = +(job && job.kw) || 10;
    kws = [Math.max(3, Math.round(kw))];
    froms = [1];
  }
  const nWant = Math.round(+(cfg && cfg.inv) || 0);
  if (!micro && nWant > 0 && kws.length !== nWant) {
    const k0 = kws[0] || 10;
    kws = Array.from({
      length: nWant
    }, (_, i) => kws[i] || k0);
    froms = kws.map((_, i) => froms[i] || 1);
  }
  const DM = cfg && cfg.dims || {};
  const acKw = (micro ? units.reduce((a, u) => a + (+u.w || +inv.w || 0), 0) / 1000 : 0) + kws.reduce((a, b) => a + b, 0);
  const nPh = M && M.phase || 3;
  const home = job && job.type ? job.type === "home" : acKw <= 20;
  const totA = acKw * 1000 / ((nPh === 3 ? 400 : 230) * (nPh === 3 ? Math.sqrt(3) : 1));
  const mainTxt = M && M.mccb && M.mccb[0] || "";
  const mainA = +(/(\d+)A/.exec(mainTxt) || [])[1] || Math.ceil(totA * 1.25);
  return {
    M,
    micro,
    home,
    nPh,
    mainA,
    acKw,
    brand: inv.brand || job && job.brand || "",
    model: inv.model || "",
    model2: inv.model2 || "",
    invs: kws.map((kw, i) => {
      const f2 = froms[i] === 2,
        spc = (f2 ? inv.spec2 : inv.spec) || {},
        sp = erInvSpec(spc, kw, DM[f2 ? "inv2" : "inv"]);
      const real = M && Array.isArray(M.strs) ? M.strs.filter(x => x && x.inv === i).length : 0;
      const nStr = Math.max(1, Math.min(12, real || (+spc.inputs || (kw <= 4 ? 1 : 2)) * (+spc.strPerMppt || (kw <= 20 ? 1 : 2))));
      return {
        i,
        kw,
        nStr,
        from: f2 ? 2 : 1,
        model: (f2 ? inv.model2 : inv.model) || "",
        dim: sp.dim,
        src: sp.src,
        floor: sp.floor
      };
    }),
    nMicro: micro ? units.length : 0,
    batt: M && M.batt ? M.batt : null,
    fromPlan: !!M,
    nPlan: micro ? 0 : units.length
  };
}
function erGBox(g, p) {
  let hw = (g.x1 - g.x0) / 2,
    hd = (g.z1 - g.z0) / 2;
  if (p.r % 180) {
    const t = hw;
    hw = hd;
    hd = t;
  }
  return {
    x0: p.x - hw,
    x1: p.x + hw,
    z0: p.z - hd,
    z1: p.z + hd
  };
}
function erSnap(g, x, z, r, mag) {
  r = (Math.round((+r || 0) / 90) * 90 % 360 + 360) % 360;
  const sn = v => Math.round(v / 0.05) * 0.05,
    f3 = v => +v.toFixed(3);
  let hw = (g.x1 - g.x0) / 2,
    hd = (g.z1 - g.z0) / 2;
  if (g.wall) {
    if (x < z) return {
      x: f3(hd),
      z: f3(Math.max(hw, sn(z))),
      r: 90
    };
    return {
      x: f3(Math.max(hw, sn(x))),
      z: f3(hd),
      r: 0
    };
  }
  if (r % 180) {
    const t = hw;
    hw = hd;
    hd = t;
  }
  x = sn(x);
  z = sn(z);
  const lim = mag ? 0.15 : 0;
  if (x - hw < lim) x = hw;
  if (z - hd < lim) z = hd;
  return {
    x: f3(Math.max(hw, x)),
    z: f3(Math.max(hd, z)),
    r
  };
}
function erLayout(md, cfg) {
  const L = {
    items: [],
    groups: []
  };
  const G = (k, th, x0, x1, z1, wall) => L.groups.push({
    k,
    th,
    x0,
    x1,
    z0: 0,
    z1,
    wall: !!wall
  });
  let x = 0.45;
  const DM = cfg && cfg.dims || {};
  const dm = (k, w, h, d) => {
    const o = DM[k] || {};
    return {
      w: +o.w || w,
      h: +o.h || h,
      d: +o.d || d
    };
  };
  const mdbN = md.home ? 0 : md.mainA <= 500 ? 1 : md.mainA <= 800 ? 2 : md.mainA <= 1250 ? 1 : md.mainA <= 2500 ? 3 : 4;
  const mdbTall = !md.home && md.mainA > 800 && md.mainA <= 1250;
  L.def = {
    mdb: md.home ? md.nPh === 3 ? {
      w: 0.6,
      h: 0.26,
      d: 0.11
    } : {
      w: 0.32,
      h: 0.26,
      d: 0.11
    } : mdbTall ? {
      w: 0.9,
      h: 2.0,
      d: 0.7
    } : mdbN === 1 ? {
      w: 0.8,
      h: 1.4,
      d: 0.25
    } : {
      w: mdbN * 0.8,
      h: 2.0,
      d: 0.7
    },
    ac: md.home ? {
      w: 0.45,
      h: 0.6,
      d: 0.18
    } : md.mainA <= 160 ? {
      w: 0.63,
      h: 0.9,
      d: 0.25
    } : {
      w: 0.8,
      h: 1.4,
      d: 0.3
    },
    dc: null
  };
  const nsMax = Math.max(1, ...md.invs.map(v => v.nStr || 1));
  L.def.dc = nsMax > 8 ? {
    w: 0.8,
    h: 0.6,
    d: 0.2
  } : nsMax > 4 ? {
    w: 0.6,
    h: 0.45,
    d: 0.15
  } : nsMax > 2 ? {
    w: 0.45,
    h: 0.35,
    d: 0.15
  } : nsMax > 1 ? {
    w: 0.46,
    h: 0.36,
    d: 0.13
  } : {
    w: 0.3,
    h: 0.33,
    d: 0.13
  };
  const mb = dm("mdb", L.def.mdb.w, L.def.mdb.h, L.def.mdb.d);
  if (md.home) {
    L.items.push({
      t: "cu",
      g: "mdb",
      x,
      w: mb.w,
      h: mb.h,
      d: mb.d,
      y: 1.3
    });
    G("mdb", "ตู้เมน", x, x + mb.w, mb.d + 0.02, true);
    x += mb.w + 0.45;
  } else {
    L.items.push({
      t: "mdb",
      g: "mdb",
      x,
      w: mb.w,
      h: mb.h,
      d: mb.d,
      y: mb.h < 1.7 ? 0.45 : 0,
      n: mb.w < 1.25 ? 1 : Math.max(2, Math.min(4, Math.round(mb.w / 0.8)))
    });
    G("mdb", "ตู้ MDB", x, x + mb.w, mb.d + 0.12);
    x += mb.w + 0.7;
  }
  const ab = dm("ac", L.def.ac.w, L.def.ac.h, L.def.ac.d);
  const acWall = md.home || ab.h < 1.1;
  const ac = acWall ? {
    t: "ac",
    g: "ac",
    x,
    w: ab.w,
    h: ab.h,
    d: ab.d,
    y: md.home ? 1.25 : Math.max(0.6, 1.9 - ab.h)
  } : {
    t: "ac",
    g: "ac",
    x,
    w: ab.w,
    h: ab.h,
    d: ab.d,
    y: 0.45
  };
  L.items.push(ac);
  G("ac", "ตู้ AC", x - (acWall ? 0 : 0.03), x + ac.w + (acWall ? 0 : 0.03), acWall ? ab.d + 0.02 : ab.d + 0.21, acWall);
  x += ac.w + 0.25;
  L.items.push({
    t: "log",
    g: "ac",
    x: ac.x + ac.w / 2 - 0.15,
    w: 0.3,
    h: 0.36,
    d: 0.13,
    y: ac.y + ac.h + 0.25
  });
  if (md.batt) {
    L.items.push({
      t: "bat",
      g: "bat",
      x,
      w: 0.62,
      h: 1.1,
      d: 0.32,
      y: 0
    });
    G("bat", "แบตเตอรี่", x, x + 0.62, 0.4);
    x += 0.62 + 0.4;
  }
  md.invs.filter(iv => iv.floor).forEach(iv => {
    const d = iv.dim,
      k = "inv" + iv.i;
    L.items.push({
      t: "invF",
      g: k,
      x,
      w: d.w,
      h: d.h,
      d: d.d,
      y: 0.1,
      iv
    });
    G(k, "อินเวอร์เตอร์ " + (iv.i + 1), x, x + d.w, d.d + 0.12);
    x += d.w + 0.5;
  });
  const rack = {
    x0: x + 0.18,
    slots: []
  };
  x = rack.x0;
  const dcb = dm("dc", L.def.dc.w, L.def.dc.h, L.def.dc.d);
  md.invs.filter(iv => !iv.floor).forEach(iv => {
    const dc = dcb;
    const slotW = iv.dim.w + dc.w + 0.32;
    rack.slots.push({
      x,
      w: slotW,
      iv,
      dc
    });
    x += slotW;
  });
  rack.x1 = x;
  if (rack.slots.length) {
    L.rack = rack;
    const dz = Math.max.apply(null, rack.slots.map(s => s.iv.dim.d));
    G("rack", "รางอินเวอร์เตอร์", rack.x0 - 0.3, rack.x1 + 0.12, 0.28 + dz + 0.1);
  }
  const P = cfg && cfg.pos || {};
  let mx = 0,
    mz = 0;
  L.groups.forEach(g => {
    g.cx = (g.x0 + g.x1) / 2;
    g.cz = (g.z0 + g.z1) / 2;
    const p = P[g.k];
    g.moved = !!(p && isFinite(+p.x) && isFinite(+p.z));
    g.pos = g.moved ? {
      x: +p.x,
      z: +p.z,
      r: (Math.round((+p.r || 0) / 90) * 90 % 360 + 360) % 360
    } : {
      x: g.cx,
      z: g.cz,
      r: 0
    };
    g.box = erGBox(g, g.pos);
    mx = Math.max(mx, g.box.x1);
    mz = Math.max(mz, g.box.z1);
  });
  L.G = {};
  L.groups.forEach(g => {
    L.G[g.k] = g;
  });
  L.clash = [];
  const fl = L.groups.filter(g => !g.wall);
  fl.forEach((g, i) => fl.slice(i + 1).forEach(h => {
    const A = g.box,
      B = h.box;
    if (A.x0 < B.x1 - 0.02 && B.x0 < A.x1 - 0.02 && A.z0 < B.z1 - 0.02 && B.z0 < A.z1 - 0.02) L.clash.push(g.th + " ทับ " + h.th);
  }));
  const need = Math.max(4, mx + 0.5),
    needD = Math.max(2.6, mz + 1.0);
  L.W = Math.max(need, +cfg.w || 0);
  L.D = Math.max(needD, +cfg.d || ER_DEF.d);
  L.H = Math.max(2.5, +cfg.h || ER_DEF.h);
  L.grew = +cfg.w > 0 && need > +cfg.w || +cfg.d > 0 && needD > +cfg.d;
  L.ac = ac;
  L.mdb = L.items[0];
  return L;
}
const _erTx = {};
function erCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  return c;
}
function erNoiseTex(THREE, key, base, spread, rep) {
  if (_erTx[key]) return _erTx[key];
  const c = erCanvas(512, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const v = (Math.random() - 0.5) * spread;
      g.fillStyle = v > 0 ? "rgba(255,255,255," + v + ")" : "rgba(0,0,0," + -v + ")";
      const s = Math.random() < 0.08 ? 3 + Math.random() * 7 : 1 + Math.random() * 2;
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
const erRR = (g, x, y, w, h, r) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
};
function erInvFace(THREE, brand, wM, hM) {
  const key = "inv|" + brand + "|" + wM + "x" + hM;
  if (_erTx[key]) return _erTx[key];
  const P = 400,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const c = erCanvas(W, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#fbfbfc");
    gr.addColorStop(1, "#eceef1");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(0,0,0,.08)";
    g.lineWidth = 3;
    g.strokeRect(6, 6, W - 12, H - 12);
    const pw = Math.min(W * 0.34, 150),
      ph = pw * 0.3,
      px = W / 2 - pw / 2,
      py = H * 0.36;
    g.fillStyle = "#16181c";
    erRR(g, px, py, pw, ph, ph / 2);
    g.fill();
    g.fillStyle = "#e8eaee";
    g.font = "700 " + Math.round(ph * 0.42) + "px Outfit, Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(brand || "INVERTER").toUpperCase().slice(0, 12), W / 2, py + ph * 0.55);
    ["#22c55e", "#22c55e", "#3b82f6"].forEach((col, i) => {
      g.fillStyle = col;
      g.beginPath();
      g.arc(W / 2 - 14 + i * 14, py - 12, 3.5, 0, 7);
      g.fill();
    });
    g.fillStyle = "#c9ced6";
    [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]].forEach(([a, b]) => {
      g.beginPath();
      g.arc(a, b, 5, 0, 7);
      g.fill();
    });
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erMdbFace(THREE, n, mainA, wM, hM) {
  wM = wM || n * 0.8;
  hM = hM || 2.0;
  const key = "mdb2|" + n + "|" + mainA + "|" + wM + "x" + hM;
  if (_erTx[key]) return _erTx[key];
  const P = 260,
    W = Math.round(wM * P),
    H = Math.round(hM * P),
    sw = W / n;
  const c = erCanvas(W, H, g => {
    const ln = Math.max(3, sw * 0.012);
    g.fillStyle = "#dcd8cc";
    g.fillRect(0, 0, W, H);
    const meter = (x, y, z) => {
      g.fillStyle = "#3a3d42";
      g.fillRect(x - z / 2, y - z / 2, z, z);
      g.fillStyle = "#b9c9bd";
      g.fillRect(x - z * 0.38, y - z * 0.38, z * 0.76, z * 0.45);
    };
    const lamps = (x, y, r) => ["#ef4444", "#facc15", "#3b82f6"].forEach((col, i) => {
      g.fillStyle = "#eee";
      g.beginPath();
      g.arc(x + (i - 1) * r * 3, y, r * 1.4, 0, 7);
      g.fill();
      g.fillStyle = col;
      g.beginPath();
      g.arc(x + (i - 1) * r * 3, y, r, 0, 7);
      g.fill();
    });
    const handle = (x, y) => {
      g.fillStyle = "#a9adb3";
      g.fillRect(x, y, sw * 0.04, H * 0.06);
      g.fillStyle = "#6b7078";
      g.fillRect(x + sw * 0.01, y + H * 0.012, sw * 0.02, H * 0.036);
    };
    const brk = (x, y, w, h) => {
      g.fillStyle = "#e9efe9";
      g.fillRect(x - w / 2, y - h / 2, w, h);
      g.fillStyle = "#16a34a";
      g.fillRect(x - w * 0.35, y - h * 0.15, w * 0.7, h * 0.3);
    };
    const line = pts => {
      g.strokeStyle = "#232529";
      g.lineWidth = ln;
      g.beginPath();
      pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
      g.stroke();
    };
    const plate = (x, y, t) => {
      g.fillStyle = "#f8f7f2";
      g.fillRect(x - sw * 0.16, y - H * 0.012, sw * 0.32, H * 0.024);
      g.fillStyle = "#333";
      g.font = "bold " + Math.round(H * 0.013) + "px sans-serif";
      g.textAlign = "center";
      g.fillText(t, x, y + H * 0.005);
    };
    const sticker = (x, y) => {
      g.fillStyle = "#fff";
      g.fillRect(x, y, sw * 0.04, H * 0.025);
      g.fillStyle = "#dc2626";
      g.fillRect(x, y + H * 0.013, sw * 0.04, H * 0.012);
    };
    for (let k = 0; k < n; k++) {
      const x0 = k * sw,
        cx = x0 + sw / 2,
        top = H * (n === 1 ? 0.27 : 0.22),
        B = H - top;
      g.strokeStyle = "#b8b3a5";
      g.lineWidth = 3;
      g.strokeRect(x0 + 4, 4, sw - 8, top - 8);
      g.strokeRect(x0 + 4, top, sw - 8, B - 4);
      handle(x0 + sw * 0.05, top * 0.35);
      handle(x0 + sw * 0.05, top + B * 0.45);
      sticker(x0 + sw * 0.05, top * 0.7);
      sticker(x0 + sw * 0.05, H * 0.9);
      if (n === 1) {
        plate(cx, top * 0.12, "MDB " + mainA + "A");
        lamps(cx, top * 0.36, sw * 0.022);
        meter(cx, top * 0.68, sw * 0.14);
        const by = top + B * 0.22;
        g.fillStyle = "#26282c";
        g.fillRect(cx - sw * 0.05, by, sw * 0.1, H * 0.08);
        line([[cx, top + B * 0.06], [cx, by]]);
        line([[cx, by + H * 0.08], [cx, H * 0.86]]);
        const nr = hM > 1.7 ? 6 : 3;
        for (let r = 0; r < nr; r++) {
          const y = top + B * (nr > 3 ? 0.45 + r * 0.085 : 0.6 + r * 0.1);
          line([[cx - sw * 0.3, y], [cx + sw * 0.3, y]]);
          brk(cx - sw * 0.3, y, sw * 0.07, H * 0.05);
          brk(cx + sw * 0.3, y, sw * 0.07, H * 0.05);
        }
        continue;
      }
      const role = k === 0 ? "cap" : n >= 3 && k === n - 1 ? "pv" : "main";
      plate(cx, top * 0.1, role === "pv" ? "SOLAR" : role === "cap" ? "CAPACITOR" : "MDB " + mainA + "A");
      if (role === "main") {
        lamps(cx, top * 0.3, sw * 0.02);
        meter(cx, top * 0.62, sw * 0.14);
      } else meter(cx, top * 0.55, sw * 0.14);
      const yb = top + B * 0.62;
      if (role === "cap") {
        for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) {
          g.fillStyle = r % 2 ? "#ef4444" : "#22c55e";
          g.beginPath();
          g.arc(x0 + sw * (0.22 + q * 0.07), top + B * (0.12 + r * 0.06), sw * 0.017, 0, 7);
          g.fill();
        }
        line([[x0 + sw * 0.08, top + B * 0.04], [cx + sw * 0.25, top + B * 0.04], [cx + sw * 0.25, top + B * 0.45], [cx - sw * 0.1, top + B * 0.45], [cx - sw * 0.1, top + B * 0.6]]);
        g.strokeStyle = "#232529";
        g.strokeRect(cx - sw * 0.12, top + B * 0.6, sw * 0.04, B * 0.06);
        line([[cx - sw * 0.1, top + B * 0.66], [cx - sw * 0.1, top + B * 0.74], [cx - sw * 0.04, top + B * 0.8]]);
        line([[cx - sw * 0.1, top + B * 0.82], [cx - sw * 0.1, top + B * 0.9]]);
        line([[cx - sw * 0.16, top + B * 0.9], [cx - sw * 0.04, top + B * 0.9]]);
        line([[cx - sw * 0.16, top + B * 0.92], [cx - sw * 0.04, top + B * 0.92]]);
        continue;
      }
      const big = role === "main" && n >= 3,
        nf = role === "pv" || n === 2 ? 5 : 3;
      g.fillStyle = "#2a2c30";
      g.fillRect(cx - sw * (big ? 0.15 : 0.08), top + B * 0.15, sw * (big ? 0.3 : 0.16), B * (big ? 0.2 : 0.13));
      if (big) {
        g.fillStyle = "#f97316";
        g.fillRect(cx - sw * 0.12, top + B * 0.2, sw * 0.24, B * 0.02);
      } else {
        g.fillStyle = "#facc15";
        g.fillRect(cx - sw * 0.05, top + B * 0.19, sw * 0.1, B * 0.035);
      }
      line([[cx, top + B * 0.02], [cx, top + B * 0.15]]);
      line([[cx, top + B * (big ? 0.35 : 0.28)], [cx, yb]]);
      if (role === "pv") {
        g.fillStyle = "#232529";
        g.beginPath();
        g.moveTo(cx - sw * 0.04, top + B * 0.07);
        g.lineTo(cx, top + B * 0.02);
        g.lineTo(cx + sw * 0.04, top + B * 0.07);
        g.fill();
      }
      if (n === 2) line([[x0 + 4, top + B * 0.42], [cx, top + B * 0.42]]);
      line([[x0 + sw * 0.18, yb], [x0 + sw * 0.82, yb]]);
      for (let q = 0; q < nf; q++) {
        const x = x0 + sw * (0.2 + q * 0.6 / (nf - 1));
        line([[x, yb], [x, yb + B * 0.12]]);
        g.fillStyle = "#e9efe9";
        g.beginPath();
        g.arc(x, yb + B * 0.14, sw * 0.02, 0, 7);
        g.fill();
      }
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erAcFace(THREE, wM, hM) {
  const key = "ac|" + wM + "x" + hM;
  if (_erTx[key]) return _erTx[key];
  const P = 300,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const c = erCanvas(W, H, g => {
    g.fillStyle = "#c3c8cf";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#a6acb5";
    g.lineWidth = 3;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.fillStyle = "#1f2937";
    g.fillRect(W * 0.12, H * 0.08, W * 0.14, H * 0.1);
    g.fillStyle = "#60a5fa";
    g.fillRect(W * 0.135, H * 0.095, W * 0.11, H * 0.06);
    g.fillStyle = "#eef0f3";
    g.fillRect(W * 0.72, H * 0.07, W * 0.16, W * 0.16);
    g.strokeStyle = "#8b929c";
    g.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      g.beginPath();
      g.arc(W * 0.8, H * 0.07 + W * 0.08, i * W * 0.016, 0, 7);
      g.stroke();
    }
    g.strokeStyle = "#262b33";
    g.lineWidth = 3;
    const cx = W * 0.4;
    g.beginPath();
    g.moveTo(cx, H * 0.22);
    g.lineTo(cx, H * 0.75);
    g.stroke();
    [0.42, 0.6].forEach(yy => {
      g.beginPath();
      g.moveTo(cx - W * 0.16, H * yy);
      g.lineTo(cx + W * 0.16, H * yy);
      g.stroke();
      g.beginPath();
      g.arc(cx - W * 0.16, H * yy, 4, 0, 7);
      g.arc(cx + W * 0.16, H * yy, 4, 0, 7);
      g.fill();
    });
    g.beginPath();
    g.moveTo(cx - 10, H * 0.3);
    g.lineTo(cx, H * 0.26);
    g.lineTo(cx + 10, H * 0.3);
    g.stroke();
    g.fillStyle = "#f8fafc";
    g.fillRect(W * 0.66, H * 0.72, W * 0.18, H * 0.1);
    g.fillStyle = "#f59e0b";
    g.beginPath();
    g.moveTo(W * 0.14, H * 0.83);
    g.lineTo(W * 0.2, H * 0.83);
    g.lineTo(W * 0.17, H * 0.78);
    g.fill();
    g.fillStyle = "#8f96a0";
    g.fillRect(W * 0.9, H * 0.45, 7, H * 0.1);
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erDcFace(THREE, wM, hM, nStr) {
  const key = "dc|" + wM + "x" + hM + "|" + nStr;
  if (_erTx[key]) return _erTx[key];
  const P = 400,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const rr = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  const c = erCanvas(W, H, g => {
    g.fillStyle = "#dcd8cc";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#cfcdc6";
    g.lineWidth = 3;
    g.strokeRect(4, 4, W - 8, H - 8);
    const wx = W * 0.1,
      wy = H * 0.1,
      ww = W * 0.72,
      wh = H * 0.78,
      r = Math.min(ww, wh) * 0.1;
    g.fillStyle = "#14171c";
    rr(g, wx - 7, wy - 7, ww + 14, wh + 14, r + 6);
    g.fill();
    g.fillStyle = "#c9c6bb";
    rr(g, wx, wy, ww, wh, r);
    g.fill();
    g.save();
    rr(g, wx, wy, ww, wh, r);
    g.clip();
    g.fillStyle = "#d6d3c8";
    g.fillRect(wx + ww * 0.04, wy + wh * 0.05, ww * 0.92, wh * 0.9);
    const rows = nStr > 10 ? 2 : 1,
      perRow = Math.ceil(nStr / rows);
    for (let ri = 0; ri < rows; ri++) {
      const ry = wy + wh * (rows === 2 ? ri ? 0.56 : 0.14 : 0.3),
        rh = wh * (rows === 2 ? 0.3 : 0.4);
      g.fillStyle = "#b9bec4";
      g.fillRect(wx + ww * 0.06, ry + rh * 0.42, ww * 0.88, rh * 0.12);
      const n = Math.min(perRow, nStr - ri * perRow),
        slots = n * 2 + 2,
        mw = ww * 0.84 / slots;
      for (let k = 0; k < slots; k++) {
        const mx = wx + ww * 0.08 + k * mw,
          spd = k >= slots - 2;
        g.fillStyle = spd ? "#8a8f94" : "#9ea3a8";
        g.fillRect(mx + 1, ry, mw - 2, rh);
        g.fillStyle = "#3aa37a";
        g.fillRect(mx + 1, ry + rh * 0.62, mw - 2, rh * 0.1);
        g.fillStyle = "#7c8186";
        g.fillRect(mx + 1, ry, mw - 2, rh * 0.16);
        g.fillRect(mx + 1, ry + rh * 0.84, mw - 2, rh * 0.16);
        g.fillStyle = "#d8dcd9";
        g.fillRect(mx + mw * 0.3, ry + rh * 0.3, mw * 0.4, rh * 0.1);
      }
      g.strokeStyle = "rgba(200,40,40,.8)";
      g.lineWidth = 2;
      for (let k = 0; k < n * 2; k += 2) {
        const lx = wx + ww * 0.08 + (k + 0.5) * mw;
        g.beginPath();
        g.moveTo(lx, ry + rh);
        g.lineTo(lx, ry + rh + wh * 0.06);
        g.stroke();
      }
    }
    g.restore();
    g.save();
    const tx = wx * 0.5,
      ty = wy + wh * 0.15,
      ts = Math.min(wx * 0.32, wh * 0.06);
    g.fillStyle = "#facc15";
    g.beginPath();
    g.moveTo(tx, ty - ts);
    g.lineTo(tx + ts, ty + ts * 0.75);
    g.lineTo(tx - ts, ty + ts * 0.75);
    g.closePath();
    g.fill();
    g.strokeStyle = "#111";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#111";
    g.beginPath();
    g.moveTo(tx + ts * 0.1, ty - ts * 0.5);
    g.lineTo(tx - ts * 0.25, ty + ts * 0.15);
    g.lineTo(tx + ts * 0.02, ty + ts * 0.12);
    g.lineTo(tx - ts * 0.12, ty + ts * 0.6);
    g.lineTo(tx + ts * 0.25, ty - ts * 0.05);
    g.lineTo(tx - ts * 0.02, ty - ts * 0.02);
    g.closePath();
    g.fill();
    rr(g, wx, wy, ww, wh, r);
    g.clip();
    const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
    gr.addColorStop(0, "rgba(255,255,255,.22)");
    gr.addColorStop(0.35, "rgba(255,255,255,.05)");
    gr.addColorStop(0.6, "rgba(255,255,255,0)");
    gr.addColorStop(1, "rgba(255,255,255,.08)");
    g.fillStyle = gr;
    g.fillRect(wx, wy, ww, wh);
    g.restore();
    const kx = W * 0.905,
      ky = H * 0.5,
      kr = Math.max(6, W * 0.028);
    g.fillStyle = "#9aa1a9";
    g.beginPath();
    g.arc(kx, ky, kr * 1.35, 0, 7);
    g.fill();
    g.fillStyle = "#d9dde1";
    g.beginPath();
    g.arc(kx, ky, kr, 0, 7);
    g.fill();
    g.fillStyle = "#3a3f46";
    g.fillRect(kx - kr * 0.15, ky - kr * 0.55, kr * 0.3, kr * 1.1);
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
const ER_MOD_U = {
  fuse: 1,
  dcmcb: 2,
  dcmcb4: 4,
  dcspd: 1,
  acmcb: 2,
  acspd: 1
};
function erPlasticFace(THREE, wM, hM, mods) {
  const key = "pl|" + wM + "x" + hM + "|" + mods.join(",");
  if (_erTx[key]) return _erTx[key];
  const P = 500,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const c = erCanvas(W, H, g => {
    g.fillStyle = "#eef0f1";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#f6f7f8";
    g.fillRect(0, 0, W, H * 0.24);
    g.fillStyle = "#c9cdd1";
    g.fillRect(0, H * 0.24, W, 3);
    const px = W * 0.06,
      py = H * 0.3,
      pw = W * 0.88,
      ph = H * 0.62;
    g.fillStyle = "#e3e6e8";
    g.fillRect(px, py, pw, ph);
    g.fillStyle = "#2a2e33";
    [[px + 10, py + 10], [px + pw - 10, py + 10], [px + 10, py + ph - 10], [px + pw - 10, py + ph - 10]].forEach(([x, y]) => {
      g.beginPath();
      g.arc(x, y, Math.max(3, W * 0.009), 0, 7);
      g.fill();
    });
    const ry = py + ph * 0.2,
      rh = ph * 0.6,
      rx = px + pw * 0.05,
      rw = pw * 0.9;
    g.fillStyle = "#f4f5f6";
    g.fillRect(rx, ry - rh * 0.25, rw, rh * 1.5);
    const units = (() => {
        const n = mods.reduce((a, m) => a + (ER_MOD_U[m] || 1), 0);
        return n <= 12 ? 12 : Math.max(18, n);
      })(),
      uw = rw / units;
    let x = rx;
    mods.forEach(m => {
      const w = (ER_MOD_U[m] || 1) * uw;
      const body = m === "fuse" ? "#5d6268" : m === "dcspd" ? "#4b5157" : "#fafafa";
      g.fillStyle = body;
      g.fillRect(x + 1.5, ry, w - 3, rh);
      g.fillStyle = "rgba(0,0,0,.18)";
      g.fillRect(x + 1.5, ry, w - 3, rh * 0.12);
      g.fillRect(x + 1.5, ry + rh * 0.88, w - 3, rh * 0.12);
      if (m === "dcmcb" || m === "dcmcb4" || m === "acmcb") {
        g.fillStyle = "#16a34a";
        g.fillRect(x + w * 0.12, ry + rh * 0.42, w * 0.76, rh * 0.2);
        g.fillStyle = "#0f7a37";
        g.fillRect(x + w * 0.12, ry + rh * 0.58, w * 0.76, rh * 0.04);
        if (m !== "acmcb") {
          g.fillStyle = "#16a34a";
          g.fillRect(x + w * 0.12, ry + rh * 0.16, w * 0.76, rh * 0.07);
        }
      } else if (m === "dcspd" || m === "acspd") {
        g.fillStyle = "#22c55e";
        g.fillRect(x + w * 0.25, ry + rh * 0.3, w * 0.5, rh * 0.1);
      } else {
        g.fillStyle = "#dc2626";
        g.fillRect(x + w * 0.3, ry + rh * 0.3, w * 0.4, rh * 0.06);
        g.fillStyle = "#3d4247";
        g.fillRect(x + w * 0.15, ry + rh * 0.5, w * 0.7, rh * 0.26);
      }
      x += w;
    });
    for (; x < rx + rw - 1; x += uw) {
      g.fillStyle = "#e9ebed";
      g.fillRect(x + 1, ry, uw - 2, rh);
    }
    g.fillStyle = "rgba(70,80,92,.16)";
    g.fillRect(px + 4, py + 4, pw - 8, ph - 8);
    const gr = g.createLinearGradient(px, py, px + pw, py + ph);
    gr.addColorStop(0, "rgba(255,255,255,.28)");
    gr.addColorStop(0.4, "rgba(255,255,255,0)");
    gr.addColorStop(1, "rgba(255,255,255,.1)");
    g.fillStyle = gr;
    g.fillRect(px + 4, py + 4, pw - 8, ph - 8);
    g.strokeStyle = "#8d969f";
    g.lineWidth = 3;
    g.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erAcPanelFace(THREE, wM, hM, mainA) {
  const key = "acp|" + wM + "x" + hM + "|" + mainA;
  if (_erTx[key]) return _erTx[key];
  const P = 300,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const c = erCanvas(W, H, g => {
    g.fillStyle = "#dcd8cc";
    g.fillRect(0, 0, W, H);
    const top = H * 0.36,
      m = W * 0.03;
    g.strokeStyle = "#b8b3a5";
    g.lineWidth = 3;
    g.strokeRect(m, m, W - 2 * m, top - 1.5 * m);
    g.strokeRect(m, top + m * 0.5, W - 2 * m, H - top - 1.5 * m);
    g.fillStyle = "#f8f7f2";
    g.fillRect(W * 0.3, top * 0.12, W * 0.4, top * 0.08);
    g.fillStyle = "#333";
    g.font = "bold " + Math.round(top * 0.045) + "px sans-serif";
    g.textAlign = "center";
    g.fillText("AC SOLAR PANEL", W * 0.5, top * 0.18);
    ["#ef4444", "#facc15", "#3b82f6"].forEach((col, i) => {
      const x = W * (0.42 + i * 0.08),
        y = top * 0.34;
      g.fillStyle = "#e6e6e6";
      g.beginPath();
      g.arc(x, y, W * 0.028, 0, 7);
      g.fill();
      g.fillStyle = col;
      g.beginPath();
      g.arc(x, y, W * 0.017, 0, 7);
      g.fill();
    });
    g.fillStyle = "#3a3d42";
    g.fillRect(W * 0.34, top * 0.48, W * 0.13, W * 0.13);
    g.fillStyle = "#9fb4a6";
    g.fillRect(W * 0.355, top * 0.5, W * 0.1, W * 0.07);
    g.fillStyle = "#1c1d20";
    g.fillRect(W * 0.53, top * 0.48, W * 0.13, W * 0.13);
    const hd = y => {
      g.fillStyle = "#a9adb3";
      g.fillRect(W * 0.07, y, W * 0.035, H * 0.07);
      g.fillStyle = "#6b7078";
      g.fillRect(W * 0.078, y + H * 0.015, W * 0.019, H * 0.04);
    };
    hd(top * 0.3);
    hd(top + (H - top) * 0.1);
    const st = (x, y) => {
      g.fillStyle = "#fff";
      g.fillRect(x, y, W * 0.035, H * 0.03);
      g.fillStyle = "#dc2626";
      g.fillRect(x, y + H * 0.018, W * 0.035, H * 0.012);
    };
    st(W * 0.07, top * 0.65);
    st(W * 0.07, top + (H - top) * 0.3);
    st(W * 0.07, H * 0.87);
    const cx = W * 0.5,
      y0 = top + (H - top) * 0.12,
      y1 = H * 0.86;
    g.strokeStyle = "#2b2d31";
    g.lineWidth = Math.max(3, W * 0.008);
    g.beginPath();
    g.moveTo(cx, y0);
    g.lineTo(cx, y1);
    g.moveTo(W * 0.24, y1);
    g.lineTo(W * 0.76, y1);
    g.stroke();
    g.fillStyle = "#2b2d31";
    g.beginPath();
    g.moveTo(cx - W * 0.03, y0 + H * 0.03);
    g.lineTo(cx, y0);
    g.lineTo(cx + W * 0.03, y0 + H * 0.03);
    g.fill();
    g.fillStyle = "#26282c";
    g.fillRect(cx - W * 0.05, top + (H - top) * 0.4, W * 0.1, H * 0.1);
    g.fillStyle = "#55595f";
    g.fillRect(cx - W * 0.018, top + (H - top) * 0.4 + H * 0.02, W * 0.036, H * 0.05);
    g.fillStyle = "#f3f3f3";
    [W * 0.24, W * 0.7].forEach(x => g.fillRect(x, y1 - H * 0.008, W * 0.06, H * 0.016));
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erAcGlassFace(THREE, wM, hM) {
  const key = "acg|" + wM + "x" + hM;
  if (_erTx[key]) return _erTx[key];
  const P = 400,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const rr = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };
  const c = erCanvas(W, H, g => {
    g.fillStyle = "#dcd8cc";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#f8f7f2";
    g.fillRect(W * 0.4, H * 0.03, W * 0.2, H * 0.035);
    g.fillStyle = "#222";
    g.font = "bold " + Math.round(H * 0.025) + "px serif";
    g.textAlign = "center";
    g.fillText("SOLAR MDB", W * 0.5, H * 0.057);
    g.fillStyle = "#facc15";
    g.beginPath();
    g.moveTo(W * 0.06, H * 0.13);
    g.lineTo(W * 0.1, H * 0.07);
    g.lineTo(W * 0.14, H * 0.13);
    g.fill();
    g.fillStyle = "#fff";
    [0.17, 0.8].forEach(y => {
      g.fillRect(W * 0.06, H * y, W * 0.07, H * 0.05);
      g.fillStyle = "#dc2626";
      g.fillRect(W * 0.06, H * (y + 0.035), W * 0.07, H * 0.015);
      g.fillStyle = "#fff";
    });
    g.fillStyle = "#2a2d31";
    [0.3, 0.93].forEach(y => {
      g.beginPath();
      g.arc(W * 0.1, H * y, W * 0.02, 0, 7);
      g.fill();
    });
    const wx = W * 0.2,
      wy = H * 0.1,
      ww = W * 0.62,
      wh = H * 0.82,
      r = ww * 0.12;
    g.fillStyle = "#16181c";
    rr(g, wx - 8, wy - 8, ww + 16, wh + 16, r + 6);
    g.fill();
    g.fillStyle = "#c9c9bf";
    rr(g, wx, wy, ww, wh, r);
    g.fill();
    g.save();
    rr(g, wx, wy, ww, wh, r);
    g.clip();
    ["#ef4444", "#facc15", "#3b82f6"].forEach((col, i) => {
      g.fillStyle = "#eee";
      g.beginPath();
      g.arc(W * (0.42 + i * 0.08), wy + wh * 0.06, W * 0.025, 0, 7);
      g.fill();
    });
    const cx = W * 0.5,
      ln = Math.max(4, W * 0.012);
    g.fillStyle = "#2f3236";
    g.fillRect(cx - W * 0.07, wy + wh * 0.12, W * 0.14, W * 0.14);
    g.fillStyle = "#b9c9bd";
    g.fillRect(cx - W * 0.05, wy + wh * 0.12 + W * 0.02, W * 0.1, W * 0.06);
    g.fillStyle = "#f3f3f3";
    g.fillRect(cx - W * 0.06, wy + wh * 0.29, W * 0.12, wh * 0.025);
    g.strokeStyle = "#202226";
    g.lineWidth = ln;
    g.beginPath();
    g.moveTo(cx, wy + wh * 0.36);
    g.lineTo(cx, wy + wh * 0.8);
    g.moveTo(cx - ww * 0.36, wy + wh * 0.8);
    g.lineTo(cx + ww * 0.36, wy + wh * 0.8);
    g.stroke();
    g.fillStyle = "#202226";
    g.beginPath();
    g.moveTo(cx - W * 0.04, wy + wh * 0.4);
    g.lineTo(cx, wy + wh * 0.34);
    g.lineTo(cx + W * 0.04, wy + wh * 0.4);
    g.fill();
    g.fillStyle = "#26282c";
    g.fillRect(cx - W * 0.03, wy + wh * 0.5, W * 0.06, wh * 0.07);
    [0.8].forEach(y => [-1, 1].forEach(sd => {
      g.fillStyle = "#33363b";
      g.fillRect(cx + sd * ww * 0.36 - W * 0.04, wy + wh * y - wh * 0.02, W * 0.08, wh * 0.04);
      g.fillStyle = "#e5e7eb";
      g.fillRect(cx + sd * ww * 0.36 - W * 0.012, wy + wh * y - wh * 0.01, W * 0.024, wh * 0.02);
    }));
    const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
    gr.addColorStop(0, "rgba(255,255,255,.3)");
    gr.addColorStop(0.4, "rgba(255,255,255,.04)");
    gr.addColorStop(1, "rgba(255,255,255,.12)");
    g.fillStyle = gr;
    g.fillRect(wx, wy, ww, wh);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erCuFace(THREE, wM, hM, ways) {
  const key = "cu|" + wM + "x" + hM + "|" + ways;
  if (_erTx[key]) return _erTx[key];
  const P = 500,
    W = Math.round(wM * P),
    H = Math.round(hM * P);
  const c = erCanvas(W, H, g => {
    g.fillStyle = "#f4f5f6";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#e6e8ea";
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.arc(W * (0.2 + k * 0.2), H * 0.08, W * 0.03, 0, 7);
      g.fill();
    }
    g.fillStyle = "#c4c8cc";
    g.fillRect(W * 0.05, H * 0.17, W * 0.9, 2);
    const px = W * 0.08,
      py = H * 0.22,
      pw = W * 0.84,
      ph = H * 0.52;
    g.fillStyle = "#dde0e3";
    g.fillRect(px, py, pw, ph);
    const units = 2 + 2 + 1 + ways,
      uw = pw * 0.94 / units,
      ry = py + ph * 0.14,
      rh = ph * 0.62;
    let x = px + pw * 0.03;
    const mod = (u, main) => {
      const w = u * uw;
      g.fillStyle = "#1f2226";
      g.fillRect(x + 1.5, ry, w - 3, rh);
      g.fillStyle = "#3a3e44";
      g.fillRect(x + 1.5, ry, w - 3, rh * 0.14);
      g.fillStyle = "#e8ecef";
      g.fillRect(x + w * 0.15, ry + rh * 0.2, w * 0.7, rh * 0.14);
      g.fillStyle = main ? "#2b2f34" : "#16a34a";
      g.fillRect(x + w * 0.2, ry + rh * 0.45, w * 0.6, rh * 0.18);
      g.fillStyle = "#16a34a";
      g.fillRect(x + w * 0.3, ry + rh * 0.78, w * 0.4, rh * 0.06);
      x += w;
    };
    mod(2, true);
    mod(2, true);
    g.fillStyle = "#cfd3d6";
    g.fillRect(x + 2, ry, uw - 4, rh);
    x += uw;
    const x0 = x;
    for (let k = 0; k < ways; k++) mod(1, false);
    g.fillStyle = "#22a05a";
    g.fillRect(x0, ry + rh + ph * 0.06, x - x0, ph * 0.07);
    g.fillStyle = "#fff";
    g.font = "bold " + Math.round(ph * 0.055) + "px sans-serif";
    g.textAlign = "center";
    for (let k = 0; k < ways; k++) g.fillText(String(k + 1), x0 + (k + 0.5) * uw, ry + rh + ph * 0.115);
    const gr = g.createLinearGradient(px, py, px + pw, py + ph);
    gr.addColorStop(0, "rgba(255,255,255,.35)");
    gr.addColorStop(0.45, "rgba(255,255,255,.05)");
    gr.addColorStop(1, "rgba(255,255,255,.18)");
    g.fillStyle = gr;
    g.fillRect(px, py, pw, ph);
    g.strokeStyle = "#b9bec3";
    g.lineWidth = 3;
    g.strokeRect(px, py, pw, ph);
    g.fillStyle = "#e9ebed";
    g.fillRect(0, H * 0.8, W, H * 0.2);
    g.fillStyle = "#cdd1d5";
    g.fillRect(0, H * 0.8, W, 3);
    g.fillStyle = "#d7dadd";
    g.fillRect(W * 0.38, H * 0.8, W * 0.24, H * 0.06);
  });
  const t = new THREE.CanvasTexture(c);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return _erTx[key] = t;
}
function erBuild3D(THREE, grp, md, L, cfg) {
  let cur = grp;
  const add = (m, sh) => {
    m.castShadow = sh !== false;
    m.receiveShadow = true;
    cur.add(m);
    return m;
  };
  const outs = {};
  const useG = k => {
    const g = L.G && L.G[k];
    if (!g) {
      cur = grp;
      return;
    }
    if (!outs[k]) {
      const o = new THREE.Group(),
        inner = new THREE.Group();
      inner.position.set(-g.cx, 0, -g.cz);
      o.add(inner);
      o.position.set(g.pos.x, 0, g.pos.z);
      o.rotation.y = g.pos.r * Math.PI / 180;
      const hl = new THREE.Mesh(new THREE.PlaneGeometry(g.x1 - g.x0 + 0.12, g.z1 - g.z0 + 0.12), new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      }));
      hl.rotation.x = -Math.PI / 2;
      hl.position.set(0, 0.006, 0);
      hl.visible = false;
      o.add(hl);
      o.userData.gk = k;
      o.userData.hl = hl;
      grp.add(o);
      outs[k] = inner;
    }
    cur = outs[k];
  };
  const wpt = (k, lx, lz) => {
    const g = L.G && L.G[k];
    if (!g) return {
      x: lx,
      z: lz,
      r: 0
    };
    const t = g.pos.r * Math.PI / 180,
      dx = lx - g.cx,
      dz = lz - g.cz;
    return {
      x: g.pos.x + dx * Math.cos(t) + dz * Math.sin(t),
      z: g.pos.z - dx * Math.sin(t) + dz * Math.cos(t),
      r: g.pos.r
    };
  };
  const inG = (x, z, r, fn) => {
    const o = new THREE.Group();
    o.position.set(x, 0, z);
    o.rotation.y = r * Math.PI / 180;
    grp.add(o);
    cur = o;
    fn();
    cur = grp;
  };
  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    wall: std({
      color: 0xffffff,
      map: erNoiseTex(THREE, "wall", "#aeb3ba", 0.1, 2),
      roughness: 0.92,
      envMapIntensity: 0.25
    }),
    floor: std({
      color: 0xffffff,
      map: erNoiseTex(THREE, "floor", "#c4c8ce", 0.12, 3),
      roughness: 0.7,
      envMapIntensity: 0.3
    }),
    edge: std({
      color: 0xa9adb5,
      roughness: 0.8
    }),
    steel: std({
      color: 0xaeb5bd,
      metalness: 0.65,
      roughness: 0.38
    }),
    dark: std({
      color: 0x24272c,
      roughness: 0.6
    }),
    white: std({
      color: 0xf4f5f7,
      roughness: 0.45,
      metalness: 0.05
    }),
    gray: std({
      color: 0xbfc4cb,
      roughness: 0.5,
      metalness: 0.1
    }),
    flex: std({
      color: 0xc7ccd3,
      roughness: 0.55,
      metalness: 0.15
    }),
    red: std({
      color: 0xc8202a,
      roughness: 0.5
    }),
    black: std({
      color: 0x1b1d21,
      roughness: 0.55
    }),
    encl: std({
      color: 0xdcd8cc,
      roughness: 0.5,
      metalness: 0.1
    })
  };
  const box = (w, h, d, mat, x, y, z, sh) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    return add(m, sh);
  };
  const faced = (w, h, d, side, face, x, y, z) => {
    const fm = std({
      map: face,
      roughness: 0.45,
      metalness: 0.05
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, fm, side]);
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    return add(m);
  };
  const tube = (pts, r, mat) => {
    const cv = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, "centripetal");
    return add(new THREE.Mesh(new THREE.TubeGeometry(cv, 40, r, 10, false), mat));
  };
  const {
      W,
      D,
      H
    } = L,
    T = 0.2;
  box(W + T, 0.18, D + T, M.floor, -T, -0.18, -T, false);
  box(W + T, H, T, M.wall, -T, 0, -T, false);
  box(T, H, D, M.wall, -T, 0, 0, false);
  box(W + T, 0.02, 0.02, M.edge, -T, H - 0.01, -T, false);
  box(0.02, 0.02, D + T, M.edge, -T, H - 0.01, -T, false);
  L.items.forEach(it => {
    useG(it.g);
    if (it.t === "mdb") {
      if (it.y > 0.3) {
        [[0.03, 0.06], [it.w - 0.07, 0.06], [0.03, it.d + 0.02], [it.w - 0.07, it.d + 0.02]].forEach(([dx, dz]) => box(0.04, it.y, 0.04, M.encl, it.x + dx, 0, dz));
        [0.15, it.y - 0.06].forEach(yy => {
          box(it.w - 0.06, 0.04, 0.04, M.encl, it.x + 0.03, yy, 0.06);
          box(it.w - 0.06, 0.04, 0.04, M.encl, it.x + 0.03, yy, it.d + 0.02);
        });
        faced(it.w, it.h, it.d, M.encl, erMdbFace(THREE, 1, md.mainA, it.w, it.h), it.x, it.y, 0.06);
      } else {
        box(it.w, 0.1, it.d - 0.04, M.dark, it.x, 0, 0.12);
        faced(it.w, it.h - 0.1, it.d, M.encl, erMdbFace(THREE, it.n, md.mainA, it.w, it.h - 0.1), it.x, 0.1, 0.1);
      }
    } else if (it.t === "cu") {
      faced(it.w, it.h, it.d, M.white, erCuFace(THREE, it.w, it.h, it.w <= 0.36 ? 6 : it.w <= 0.48 ? 12 : 18), it.x, it.y, 0);
    } else if (it.t === "ac") {
      if (md.home) faced(it.w, it.h, it.d, M.white, erPlasticFace(THREE, it.w, it.h, ["acmcb", "acmcb", "acspd", "acspd"]), it.x, it.y, 0.08);else if (it.h < 1.1) {
        faced(it.w, it.h, it.d, M.encl, erAcGlassFace(THREE, it.w, it.h), it.x, it.y, 0);
        box(it.w + 0.04, 0.03, it.d + 0.06, M.encl, it.x - 0.02, it.y + it.h, 0);
      } else faced(it.w, it.h, it.d, M.encl, erAcPanelFace(THREE, it.w, it.h, md.mainA), it.x, it.y, 0.08);
      if (!md.home && it.h >= 1.1 && it.y > 0.3) {
        [[0.08, 0.1], [it.w - 0.14, 0.1], [0.08, it.d - 0.02], [it.w - 0.14, it.d - 0.02]].forEach(([dx, dz]) => box(0.06, it.y, 0.06, M.dark, it.x + dx, 0, dz));
        [0, it.w - 0.2].forEach(dx => box(0.26, 0.012, it.d + 0.2, M.dark, it.x + dx - 0.03, 0, 0.0));
      }
    } else if (it.t === "log") {
      faced(it.w, it.h, it.d, M.white, erAcFace(THREE, it.w, it.h), it.x, it.y, 0);
    } else if (it.t === "invF") {
      box(it.w, 0.1, it.d - 0.04, M.dark, it.x, 0, 0.12);
      faced(it.w, it.h, it.d, M.white, erInvFace(THREE, md.brand, it.w, Math.min(it.h, it.w * 1.2)), it.x, it.y, 0.1);
      for (let k = 0; k < 6; k++) box(0.014, it.h * 0.5, 0.012, M.gray, it.x + it.w, it.y + it.h * 0.25, 0.1 + it.d * 0.15 + k * it.d * 0.13);
    } else if (it.t === "bat") {
      faced(it.w, it.h, it.d, M.white, erInvFace(THREE, md.batt && md.batt.brand || "BATTERY", it.w, it.h), it.x, it.y, 0.05);
    }
    cur = grp;
  });
  const tw = 0.3,
    yT = Math.min(H - 0.3, 2.65),
    trayOn = cfg.tray !== false;
  const R = L.rack;
  const zR = 0.28;
  if (R) {
    useG("rack");
    const posts = [R.x0].concat(R.slots.map(s => s.x + s.w));
    posts.forEach(px => {
      box(0.042, 2.05, 0.042, M.steel, px - 0.021, 0, zR - 0.021);
      box(0.2, 0.012, 0.2, M.dark, px - 0.1, 0, zR - 0.1);
      box(0.012, 0.12, 0.16, M.dark, px - 0.006, 0.012, zR - 0.08);
      box(0.16, 0.12, 0.012, M.dark, px - 0.08, 0.012, zR - 0.006);
      box(0.042, 0.042, zR, M.steel, px - 0.021, 1.98, 0);
    });
    const span = R.x1 - R.x0 + 0.2;
    [0.95, 1.72].forEach(y => box(span, 0.042, 0.042, M.steel, R.x0 - 0.1, y, zR - 0.021));
    const wy = 0.32,
      wxL = R.x0 - 0.26;
    box(R.x1 - wxL + 0.1, 0.12, 0.14, M.steel, wxL, wy, zR - 0.07);
    box(0.14, (trayOn ? yT : 2.1) - wy - 0.12, 0.14, M.steel, wxL, wy + 0.12, zR - 0.07);
    R.slots.forEach(s => {
      const d = s.iv.dim,
        ix = s.x + 0.16 + s.dc.w + 0.08,
        iy = Math.max(0.55, Math.min(1.02, 1.98 - d.h)),
        iz = zR + 0.04;
      box(d.w * 0.8, d.h * 0.85, 0.03, M.dark, ix + d.w * 0.1, iy + d.h * 0.07, zR + 0.021);
      const body = faced(d.w, d.h, d.d, M.white, erInvFace(THREE, md.brand, d.w, d.h), ix, iy, iz + 0.02);
      body.userData.inv = s.iv.i;
      for (let k = 0; k < 5; k++) box(0.012, d.h * 0.7, d.d * 0.75, M.gray, ix + d.w + 0.004 + k * 0.016, iy + d.h * 0.15, iz + 0.05);
      const dx = s.x + 0.12,
        dy = iy + d.h - s.dc.h;
      const ns = s.iv.nStr || 2,
        small = ns <= 2;
      if (small) {
        const mods = [];
        if (md.home) {
          for (let k = 0; k < ns; k++) mods.push("fuse", "fuse", "dcmcb", "dcspd", "dcspd");
          mods.push("acmcb", "acspd", "acspd");
        } else {
          for (let k = 0; k < ns * 2; k++) mods.push("fuse");
          for (let k = 0; k < ns; k++) mods.push("dcmcb4", "dcspd", "dcspd", "dcspd");
        }
        faced(s.dc.w, s.dc.h, s.dc.d, M.white, erPlasticFace(THREE, s.dc.w, s.dc.h, mods), dx, dy, zR + 0.04);
        const mc = (k, right) => box(0.022, 0.05, 0.022, M.black, right ? dx + s.dc.w - 0.062 - k * 0.032 : dx + 0.04 + k * 0.032, dy - 0.05, zR + 0.04 + s.dc.d * 0.45);
        for (let k = 0; k < ns; k++) {
          mc(k, false);
          if (md.home) mc(ns + k, false);else mc(k, true);
        }
        const nGl = ns + 1,
          gx0 = dx + s.dc.w * 0.5 - (nGl - 1) * 0.025;
        for (let k = 0; k < nGl; k++) {
          const gm = add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.04, 12), M.white));
          gm.position.set((md.home ? dx + s.dc.w * 0.62 - (nGl - 1) * 0.025 : gx0) + k * 0.05, dy - 0.02, zR + 0.04 + s.dc.d * 0.5);
        }
      } else {
        faced(s.dc.w, s.dc.h, s.dc.d, M.encl, erDcFace(THREE, s.dc.w, s.dc.h, ns), dx, dy, zR + 0.04);
        const nAll = ns * 2 + 1,
          perRow = Math.max(1, Math.floor((s.dc.w - 0.06) / 0.035)),
          gRows = Math.min(Math.ceil(nAll / perRow), Math.max(1, Math.floor(s.dc.d / 0.045)));
        for (let r = 0; r < gRows; r++) {
          const nG = Math.min(perRow, nAll - r * perRow);
          for (let k = 0; k < nG; k++) {
            const gm = add(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.035, 10), M.black));
            gm.position.set(dx + 0.03 + (k + 0.5) * ((s.dc.w - 0.06) / nG), dy - 0.017, zR + 0.04 + s.dc.d * (0.75 - r * 0.45 / Math.max(1, gRows - 1) * (gRows > 1 ? 1 : 0)) - (gRows > 1 ? 0 : s.dc.d * 0.25));
          }
        }
      }
      const by = iy,
        fz = iz + 0.02 + d.d * 0.55;
      box(d.w * 0.22, 0.09, d.d * 0.4, M.black, ix + d.w * 0.62, by - 0.09, fz - d.d * 0.2);
      for (let k = 0; k < 4; k++) {
        const cx = ix + d.w * 0.18 + k * 0.035;
        box(0.022, 0.05, 0.022, M.black, cx - 0.011, by - 0.05, fz - 0.011);
        tube([[dx + s.dc.w * 0.3 + k * 0.03, dy, zR + 0.11], [dx + s.dc.w * 0.35 + k * 0.03, dy - 0.25, zR + 0.13], [cx - 0.02, by - 0.3, fz], [cx, by - 0.05, fz]], 0.007, M.red);
      }
      const ax = ix + d.w * 0.73;
      tube([[ax, by - 0.09, fz], [ax, by - 0.3, fz + 0.02], [ax, 0.75, fz + 0.06], [ax + 0.03, 0.52, zR + 0.1], [ax + 0.05, wy + 0.13, zR]], 0.024, M.flex);
      box(0.07, 0.04, 0.07, M.black, ax + 0.015, wy + 0.1, zR - 0.035);
    });
    cur = grp;
  }
  if (trayOn && L.mdb) {
    const vSeg = (y0, y1) => {
      [-tw / 2, tw / 2 - 0.03].forEach(o => box(0.03, y1 - y0, 0.07, M.steel, o, y0, -0.035));
      for (let y = y0 + 0.1; y < y1 - 0.05; y += 0.25) box(tw, 0.02, 0.025, M.steel, -tw / 2, y, -0.012);
    };
    const hLen = len => {
      [-tw / 2, tw / 2 - 0.03].forEach(o => box(len, 0.07, 0.03, M.steel, 0, yT, o));
      for (let x = 0.1; x < len - 0.05; x += 0.25) box(0.025, 0.02, tw, M.steel, x, yT, -tw / 2);
      for (let x = 0.6; x < len - 0.2; x += 1.2) box(0.012, H - yT, 0.012, M.steel, x, yT + 0.07, -tw / 2 - 0.02);
    };
    const leg = (p, q) => {
      const dx = q.x - p.x,
        dz = q.z - p.z;
      if (Math.abs(dx) > 0.01) inG(Math.min(p.x, q.x) - tw / 2, p.z, 0, () => hLen(Math.abs(dx) + tw));else if (Math.abs(dz) > 0.01) inG(p.x, Math.min(p.z, q.z) - tw / 2, -90, () => hLen(Math.abs(dz) + tw));
    };
    const route = (p, q) => {
      const m = {
        x: q.x,
        z: p.z
      };
      leg(p, m);
      leg(m, q);
    };
    const zl = md.home ? 0.12 : 0.25;
    const A = wpt("ac", L.ac.x + L.ac.w / 2, zl),
      ay = L.ac.y + L.ac.h;
    const Bm = wpt("mdb", L.mdb.x + L.mdb.w / 2, zl),
      my = L.mdb.y + L.mdb.h;
    if (yT > ay + 0.15) inG(A.x, A.z, A.r, () => vSeg(ay, yT + 0.07));
    if (yT > my + 0.15) inG(Bm.x, Bm.z, Bm.r, () => vSeg(my, yT + 0.07));
    route(A, Bm);
    if (R) route(wpt("rack", R.x0 - 0.19, zR), A);
    L.items.filter(it => it.t === "invF").forEach(it => {
      const P = wpt(it.g, it.x + it.w / 2, 0.25),
        top = it.y + it.h;
      if (yT > top + 0.15) inG(P.x, P.z, P.r, () => vSeg(top, yT + 0.07));
      route(P, A);
    });
  }
}
function ErRoomView({
  md,
  L,
  cfg,
  api,
  bg,
  edit,
  sel,
  onPick,
  onMove
}) {
  const mountRef = React.useRef(null);
  const T = React.useRef({});
  const cbRef = React.useRef({});
  cbRef.current = {
    edit,
    onPick,
    onMove
  };
  const [ready, setReady] = React.useState(false);
  const [err, setErr] = React.useState("");
  React.useEffect(() => {
    window.p3LoadThree().then(() => setReady(true)).catch(e => setErr(e.message));
  }, []);
  React.useEffect(() => {
    if (!ready) return;
    const THREE = window.THREE,
      el = mountRef.current;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.78;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 400);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.maxPolarAngle = Math.PI * 0.495;
    scene.add(new THREE.HemisphereLight(0xf4f7ff, 0x8a8478, 0.3));
    const key = new THREE.DirectionalLight(0xfff8ee, 1.55);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    key.shadow.bias = -0.0003;
    key.shadow.radius = 3;
    scene.add(key);
    scene.add(key.target);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.35);
    scene.add(fill);
    try {
      const pm = new THREE.PMREMGenerator(renderer);
      const es = new THREE.Scene();
      es.background = new THREE.Color(0xe9edf2);
      const g = new THREE.SphereGeometry(20, 24, 12),
        col = [],
        pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) / 20,
          c = new THREE.Color(0xc7cdd6).lerp(new THREE.Color(0xffffff), Math.max(0, y));
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide
      })));
      scene.environment = pm.fromScene(es, 0.04).texture;
      scene.environment.encoding = THREE.sRGBEncoding;
    } catch (e) {}
    const grp = new THREE.Group();
    scene.add(grp);
    Object.assign(T.current, {
      THREE,
      renderer,
      scene,
      camera,
      controls,
      key,
      fill,
      grp,
      el
    });
    const onResize = () => {
      const w = el.clientWidth || 1,
        h = el.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    onResize();
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    let raf = 0,
      fly = null;
    const loop = t => {
      raf = requestAnimationFrame(loop);
      if (fly) {
        const k = Math.min(1, (t - fly.t0) / 700),
          e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        camera.position.lerpVectors(fly.p0, fly.p1, e);
        controls.target.lerpVectors(fly.c0, fly.c1, e);
        camera.fov = fly.f0 + (fly.f1 - fly.f0) * e;
        camera.updateProjectionMatrix();
        if (k >= 1) fly = null;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);
    T.current.flyTo = (p, c, f) => {
      fly = {
        t0: performance.now(),
        p0: camera.position.clone(),
        p1: p,
        c0: controls.target.clone(),
        c1: c,
        f0: camera.fov,
        f1: f || camera.fov
      };
    };
    const ray = new THREE.Raycaster(),
      pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      v2 = new THREE.Vector2(),
      hp = new THREE.Vector3();
    const aim = e => {
      const r = renderer.domElement.getBoundingClientRect();
      v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v2, camera);
    };
    const hitG = e => {
      aim(e);
      const h = ray.intersectObjects(grp.children.filter(o => o.userData.gk), true)[0];
      let o = h && h.object;
      while (o && !o.userData.gk) o = o.parent;
      return o || null;
    };
    let drag = null;
    const down = e => {
      if (e.button !== 0 || !cbRef.current.edit) return;
      const o = hitG(e);
      if (!o) {
        drag = {
          none: true,
          sx: e.clientX,
          sy: e.clientY
        };
        return;
      }
      controls.enabled = false;
      ray.ray.intersectPlane(pl, hp);
      drag = {
        o,
        sx: e.clientX,
        sy: e.clientY,
        ox: o.position.x - hp.x,
        oz: o.position.z - hp.z,
        moved: false
      };
    };
    const move = e => {
      if (!drag) {
        if (cbRef.current.edit && !e.buttons) renderer.domElement.style.cursor = hitG(e) ? "grab" : "";
        return;
      }
      if (drag.none) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      drag.moved = true;
      renderer.domElement.style.cursor = "grabbing";
      aim(e);
      if (ray.ray.intersectPlane(pl, hp)) {
        drag.o.position.x = hp.x + drag.ox;
        drag.o.position.z = hp.z + drag.oz;
      }
    };
    const up = e => {
      const d = drag;
      drag = null;
      controls.enabled = true;
      if (!d) return;
      const cb = cbRef.current;
      if (d.none) {
        if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4 && cb.onPick) cb.onPick(null);
        return;
      }
      renderer.domElement.style.cursor = "grab";
      if (cb.onPick) cb.onPick(d.o.userData.gk);
      if (d.moved && cb.onMove) cb.onMove(d.o.userData.gk, d.o.position.x, d.o.position.z);
    };
    el.addEventListener("pointerdown", down, true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      T.current = {};
    };
  }, [ready]);
  const camOf = k => {
    const THREE = T.current.THREE,
      {
        W,
        D,
        H
      } = L,
      V = (x, y, z) => new THREE.Vector3(x, y, z);
    const R = L.rack,
      rx = R ? (R.x0 + R.x1) / 2 : W / 2;
    if (k === "eye") return [V(W * 0.62, 1.55, D + 2.4), V(W * 0.5, 1.15, 0.3), 42];
    if (k === "inv" && R) {
      const span = R.x1 - R.x0;
      return [V(rx + span * 0.35, 1.45, Math.max(2.4, span * 0.75)), V(rx - span * 0.05, 1.05, 0.3), 46];
    }
    if (k === "top") return [V(W / 2, Math.max(W, D) * 2.4, D * 0.56), V(W / 2, 0, D * 0.5), 32];
    const cam = T.current.camera,
      f = 30,
      r = Math.sqrt(W * W + D * D + H * H) / 2;
    const vh = Math.tan(f * Math.PI / 360),
      hh = vh * (cam && cam.aspect || 1.6);
    const dist = r / Math.min(vh, hh) * 1.02,
      dir = new THREE.Vector3(0.55, 0.62, 0.8).normalize();
    const c = V(W * 0.5, H * 0.3, D * 0.45);
    return [c.clone().add(dir.multiplyScalar(dist)), c, f];
  };
  React.useEffect(() => {
    const t = T.current;
    if (!t.THREE) return;
    const {
      THREE,
      grp,
      key,
      fill,
      scene
    } = t;
    grp.children.slice().forEach(c => {
      grp.remove(c);
      c.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach(m => m.dispose());
      });
    });
    erBuild3D(THREE, grp, md, L, cfg);
    const {
        W,
        D,
        H
      } = L,
      S = Math.max(W, D, H);
    key.position.set(W * 0.85, H * 2.4, D + S * 0.9);
    key.target.position.set(W * 0.45, 0.6, D * 0.3);
    Object.assign(key.shadow.camera, {
      left: -S,
      right: S,
      top: S,
      bottom: -S,
      near: 0.5,
      far: S * 5
    });
    key.shadow.camera.updateProjectionMatrix();
    fill.position.set(-S, H * 1.5, D + S);
    scene.background = new THREE.Color(bg === "white" ? 0xffffff : 0xe8ecf0);
    if (!t.fitted) {
      const [p, c, f] = camOf("iso");
      t.camera.position.copy(p);
      t.controls.target.copy(c);
      t.camera.fov = f;
      t.camera.updateProjectionMatrix();
      t.fitted = true;
    }
  }, [ready, md, L, cfg, bg]);
  React.useEffect(() => {
    const t = T.current;
    if (!t.grp) return;
    t.grp.children.forEach(o => {
      if (o.userData.hl) o.userData.hl.visible = !!edit && o.userData.gk === sel;
    });
  }, [ready, md, L, cfg, bg, sel, edit]);
  if (api) api.current = {
    ready: () => !!T.current.THREE,
    three: () => T.current,
    view: k => {
      const t = T.current;
      if (!t.THREE) return;
      const [p, c, f] = camOf(k);
      t.flyTo(p, c, f);
    },
    shot: () => {
      const t = T.current;
      if (!t.THREE) return null;
      const {
        renderer,
        camera,
        scene,
        el
      } = t;
      const w0 = el.clientWidth,
        h0 = el.clientHeight,
        pr = renderer.getPixelRatio(),
        a0 = camera.aspect;
      const gl = renderer.capabilities.maxTextureSize || 4096,
        OW = Math.min(3840, gl),
        OH = Math.round(OW * 9 / 16);
      const hls = [];
      t.grp.children.forEach(o => {
        if (o.userData.hl && o.userData.hl.visible) {
          hls.push(o.userData.hl);
          o.userData.hl.visible = false;
        }
      });
      renderer.setPixelRatio(1);
      renderer.setSize(OW, OH, false);
      camera.aspect = OW / OH;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      hls.forEach(h => {
        h.visible = true;
      });
      const url = renderer.domElement.toDataURL("image/png");
      renderer.setPixelRatio(pr);
      renderer.setSize(w0, h0);
      camera.aspect = a0;
      camera.updateProjectionMatrix();
      return url;
    }
  };
  return React.createElement("div", {
    ref: mountRef,
    style: {
      position: "absolute",
      inset: 0
    }
  }, !ready && !err && React.createElement("div", {
    className: "er-msg"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E15\u0E31\u0E27\u0E41\u0E2A\u0E14\u0E07\u0E1C\u0E25 3 \u0E21\u0E34\u0E15\u0E34\u2026"), err && React.createElement("div", {
    className: "er-msg"
  }, "\u0E42\u0E2B\u0E25\u0E14 3D \u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08: ", err));
}
const ER_CSS = `
.er{position:fixed;inset:0;z-index:130;background:var(--bg);display:flex;flex-direction:column;color:var(--text-1)}
.er-top{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface);box-shadow:var(--shadow-sm);z-index:2}
.er-top b{font-size:14.5px}.er-top small{display:block;font-size:11.5px;color:var(--text-3);font-weight:500}
.er-body{flex:1;min-height:0;display:flex}
.er-stage{position:relative;flex:1;min-width:0}
.er-side{width:310px;flex-shrink:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px}
.er-card{background:var(--surface);box-shadow:var(--shadow-sm);border-radius:var(--r-tile);padding:13px 14px}
.er-h{font-size:12.5px;font-weight:700;margin-bottom:9px;display:flex;align-items:center;gap:6px}
.er-row{display:flex;align-items:center;gap:8px;margin-top:7px;font-size:12.5px;color:var(--text-2)}
.er-row>span{flex:1}
.er-in{width:86px;padding:7px 9px;border:none;border-radius:var(--r-chip);background:var(--surface2);box-shadow:var(--shadow-inset);font-family:inherit;font-size:13px;color:var(--text-1);text-align:right}
.er-in:focus{outline:none;box-shadow:inset 0 0 0 1px var(--primary),0 0 0 3px var(--primary-soft)}
.er-sel{width:100%;padding:8px 10px;border:none;border-radius:var(--r-chip);background:var(--surface2);box-shadow:var(--shadow-inset);font-family:inherit;font-size:13px;color:var(--text-1)}
.er-cams{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:5px;border-radius:var(--r-tile);background:var(--surface2);box-shadow:var(--shadow-inset)}
.er-cams button{border:none;background:transparent;border-radius:var(--r-chip);padding:9px 4px;font-family:inherit;font-size:12px;font-weight:600;color:var(--text-2);cursor:pointer}
.er-cams button[data-on="1"]{background:var(--surface);box-shadow:var(--shadow-sm);color:var(--primary-dark)}
.er-cta{width:100%;border:none;border-radius:var(--r-tile);padding:12px;background:var(--primary);color:#fff;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:var(--shadow-sm);display:flex;align-items:center;justify-content:center;gap:7px}
.er-btn{border:none;border-radius:var(--r-chip);padding:7px 12px;background:var(--surface);box-shadow:var(--shadow-sm);font-family:inherit;font-size:12.5px;font-weight:600;color:var(--text-1);cursor:pointer}
.er-eq{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:6px 0;border-top:1px solid var(--border)}
.er-eq:first-of-type{border-top:none}.er-eq b{font-weight:600}.er-eq span{color:var(--text-3);text-align:right}
.er-note{font-size:11.5px;color:var(--text-3);margin-top:7px;line-height:1.5}
.er-warn{font-size:11.5px;color:var(--tint-amber-tx,#b45309);background:color-mix(in srgb,#f59e0b 12%,transparent);border-radius:var(--r-chip);padding:7px 9px;margin-top:8px;line-height:1.45}
.er-msg{position:absolute;inset:0;display:grid;place-items:center;color:var(--text-3);font-size:13px}
.er-chips{display:flex;flex-wrap:wrap;gap:6px}
.er-chips button{border:none;border-radius:var(--r-pill);padding:6px 11px;background:var(--surface2);box-shadow:var(--shadow-inset);font-family:inherit;font-size:12px;font-weight:600;color:var(--text-2);cursor:pointer}
.er-chips button[data-on="1"]{background:#f59e0b;box-shadow:var(--shadow-sm);color:#fff}
.er-chips button i{font-style:normal;font-weight:500;opacity:.75;margin-left:4px}
.er-dim{display:grid;grid-template-columns:1fr 52px 52px 52px;gap:5px;align-items:center;margin-top:6px;font-size:12px;color:var(--text-2)}
.er-dim .er-in{width:100%;padding:6px 6px;font-size:12.5px}
.er-dimh{margin-top:0}.er-dimh i{font-style:normal;font-size:10.5px;color:var(--text-3);text-align:center}
.er-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.er-tg{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12.5px;color:var(--text-2);cursor:pointer}
@media (max-width:760px){.er-body{flex-direction:column}.er-stage{flex:none;height:52vh}.er-side{width:auto;flex:1}}
`;
function ErRoomStudio({
  job,
  ver: ver0,
  canEdit,
  onClose
}) {
  const jobId = job && job.id;
  const p3 = window.useP3Vers ? window.useP3Vers(jobId) : {
    list: [{
      id: "1",
      name: "ต้นแบบ"
    }]
  };
  const [ver, setVer] = React.useState(String(ver0 || "1"));
  const [st, setSt] = React.useState(undefined);
  const [saved, setSaved] = React.useState(undefined);
  const [cfg, setCfg] = React.useState(ER_DEF);
  const [cam, setCam] = React.useState("iso");
  const [bg, setBg] = React.useState("white");
  const [msg, setMsg] = React.useState("");
  const [sel, setSel] = React.useState(null);
  const api = React.useRef(null);
  const saveT = React.useRef(null);
  React.useEffect(() => {
    if (!jobId || !window.FBDB) {
      setSt(null);
      setSaved(null);
      return;
    }
    setSt(undefined);
    setSaved(undefined);
    const key = window.dvP3Key ? window.dvP3Key(jobId, ver) : jobId;
    window.FBDB.ref("plan3d/" + key).once("value").then(s => setSt(s.val() || null)).catch(() => setSt(null));
    window.FBDB.ref("eroom/" + jobId + "/" + ver).once("value").then(s => {
      const v = s.val();
      setSaved(v);
      setCfg(Object.assign({}, ER_DEF, v || {}));
    }).catch(() => setSaved(null));
  }, [jobId, ver]);
  const md = React.useMemo(() => st === undefined ? null : erModel(st, job, cfg), [st, job, cfg.inv, cfg.dims]);
  const L = React.useMemo(() => md ? erLayout(md, cfg) : null, [md, cfg.w, cfg.d, cfg.h, cfg.pos, cfg.dims]);
  const cfgV = React.useMemo(() => ({
    tray: cfg.tray
  }), [cfg.tray]);
  const put = patch => {
    setCfg(c => {
      const n = Object.assign({}, c, patch);
      if (canEdit && window.FBDB && jobId) {
        clearTimeout(saveT.current);
        saveT.current = setTimeout(() => {
          const o = {
            w: +n.w || 0,
            d: +n.d || ER_DEF.d,
            h: +n.h || ER_DEF.h,
            tray: n.tray !== false,
            inv: Math.round(+n.inv || 0),
            pos: n.pos && Object.keys(n.pos).length ? n.pos : null,
            dims: n.dims && Object.keys(n.dims).length ? n.dims : null,
            at: Date.now()
          };
          window.FBDB.ref("eroom/" + jobId + "/" + ver).set(o).catch(() => setMsg("บันทึกการตั้งค่าห้องไม่สำเร็จ"));
        }, 800);
      }
      return n;
    });
  };
  React.useEffect(() => () => clearTimeout(saveT.current), []);
  React.useEffect(() => {
    const k = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const setPos = (k, p) => {
    const n = Object.assign({}, cfg.pos || {});
    if (p) n[k] = p;else delete n[k];
    put({
      pos: n
    });
  };
  const onMove = (k, x, z) => {
    const g = L && L.G[k];
    if (g) setPos(k, erSnap(g, x, z, g.pos.r, true));
  };
  const gSel = L && sel ? L.G[sel] : null;
  const rot = () => {
    const g = gSel;
    if (!g) return;
    if (g.wall) setPos(g.k, g.pos.r ? erSnap(g, g.pos.z, 0, 0) : erSnap(g, 0, g.pos.x, 90));else setPos(g.k, erSnap(g, g.pos.x, g.pos.z, g.pos.r + 90));
  };
  const edgeIn = axis => {
    const g = gSel,
      v = axis === "x" ? g.box.x0 : g.box.z0;
    return React.createElement("input", {
      className: "er-in",
      type: "number",
      step: "0.05",
      min: "0",
      value: +v.toFixed(2),
      disabled: !canEdit,
      onChange: e => {
        const d = Math.max(0, +e.target.value || 0);
        const x = axis === "x" ? g.pos.x - g.box.x0 + d : g.pos.x,
          z = axis === "z" ? g.pos.z - g.box.z0 + d : g.pos.z;
        setPos(g.k, erSnap(g, x, z, g.pos.r));
      }
    });
  };
  React.useEffect(() => {
    if (sel && L && !L.G[sel]) setSel(null);
  }, [L, sel]);
  const setDim = (k, f, v) => {
    const all = Object.assign({}, cfg.dims || {}),
      o = Object.assign({}, all[k] || {});
    if (v === "" || v == null) delete o[f];else o[f] = v;
    if (Object.keys(o).length) all[k] = o;else delete all[k];
    put({
      dims: all
    });
  };
  const dimRow = (k, th, ph) => {
    const o = (cfg.dims || {})[k] || {};
    return React.createElement("div", {
      className: "er-dim",
      key: k
    }, React.createElement("span", null, th), ["w", "h", "d"].map(f => React.createElement("input", {
      key: f,
      className: "er-in",
      type: "number",
      step: "1",
      min: "0",
      disabled: !canEdit,
      title: {
        w: "กว้าง",
        h: "สูง",
        d: "ลึก"
      }[f] + " (ซม.)",
      value: o[f] ? Math.round(o[f] * 100) : "",
      placeholder: ph ? String(Math.round(ph[f] * 100)) : "",
      onChange: e => setDim(k, f, e.target.value === "" ? "" : Math.max(0.05, +e.target.value / 100))
    })));
  };
  const invOf = from => md && md.invs.find(v => v.from === from);
  const mountSel = (k, iv) => React.createElement("select", {
    className: "er-sel",
    disabled: !canEdit,
    style: {
      marginTop: 6
    },
    value: ((cfg.dims || {})[k] || {}).mount || "",
    onChange: e => setDim(k, "mount", e.target.value || "")
  }, React.createElement("option", {
    value: ""
  }, "\u0E15\u0E34\u0E14\u0E15\u0E31\u0E49\u0E07\u0E15\u0E32\u0E21\u0E04\u0E25\u0E31\u0E07 (", iv && iv.floor && !((cfg.dims || {})[k] || {}).mount ? "ตั้งพื้น" : "ติดราง", ")"), React.createElement("option", {
    value: "wall"
  }, "\u0E15\u0E34\u0E14\u0E23\u0E32\u0E07/\u0E1C\u0E19\u0E31\u0E07"), React.createElement("option", {
    value: "floor"
  }, "\u0E15\u0E31\u0E49\u0E07\u0E1E\u0E37\u0E49\u0E19 (\u0E15\u0E39\u0E49)"));
  const go = k => {
    setCam(k);
    if (api.current) api.current.view(k);
  };
  const shot = () => {
    if (!api.current) return;
    try {
      const url = api.current.shot();
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = "ห้องอุปกรณ์-" + (job && (job.code || job.id) || "") + "-" + cam + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setMsg("ถ่ายภาพไม่ได้: " + e.message);
    }
  };
  const numIn = (k, ph, step) => React.createElement("input", {
    className: "er-in",
    type: "number",
    step: step || 0.1,
    min: "0",
    value: cfg[k] || "",
    placeholder: ph,
    disabled: !canEdit,
    onChange: e => put({
      [k]: e.target.value === "" ? 0 : +e.target.value
    })
  });
  const eq = md ? [!md.home && {
    n: "ตู้ MDB",
    v: (L && L.mdb ? L.mdb.n : 0) + " ช่อง · เมน " + md.mainA + "A"
  }, md.home && {
    n: "ตู้เมน (Consumer Unit)",
    v: "เมน " + md.mainA + "A"
  }, {
    n: "ตู้ AC (Combiner)",
    v: md.home ? "ติดผนัง" : "ตั้งพื้นบนขาเหล็ก"
  }, md.invs.length && {
    n: "อินเวอร์เตอร์",
    v: md.invs.length + " ตัว · " + Array.from(new Set(md.invs.map(x => x.kw + " kW"))).join(" / ") + (md.model ? " · " + md.model : "")
  }, md.invs.length && {
    n: "ตู้ DC",
    v: md.invs.length + " ตู้ (ตัวละ 1)"
  }, md.micro && {
    n: "ไมโครอินเวอร์เตอร์",
    v: md.nMicro + " ตัว (อยู่บนหลังคา ไม่อยู่ในห้อง)"
  }, md.batt && {
    n: "แบตเตอรี่",
    v: md.batt.kwh + " kWh"
  }, {
    n: "Data Logger",
    v: md.brand || "—"
  }].filter(Boolean) : [];
  return ReactDOM.createPortal(React.createElement("div", {
    className: "er"
  }, React.createElement("style", null, ER_CSS), React.createElement("div", {
    className: "er-top"
  }, React.createElement("button", {
    className: "x-close",
    onClick: onClose,
    title: "\u0E1B\u0E34\u0E14 (Esc)",
    style: {
      width: 32,
      height: 32,
      cursor: "pointer"
    }
  }, React.createElement(Icon, {
    name: "x",
    size: 15
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("b", null, "\u0E2B\u0E49\u0E2D\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C 3D"), React.createElement("small", null, job && (job.code || job.id) || "", " \xB7 ", job && job.name || ""))), React.createElement("div", {
    className: "er-body"
  }, React.createElement("div", {
    className: "er-stage"
  }, md && L ? React.createElement(ErRoomView, {
    md: md,
    L: L,
    cfg: cfgV,
    api: api,
    bg: bg,
    edit: canEdit,
    sel: sel,
    onPick: setSel,
    onMove: onMove
  }) : React.createElement("div", {
    className: "er-msg"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E41\u0E1A\u0E1A\u2026")), React.createElement("div", {
    className: "er-side"
  }, React.createElement("div", {
    className: "er-card"
  }, React.createElement("div", {
    className: "er-h"
  }, React.createElement(Icon, {
    name: "panel",
    size: 14,
    color: "#4F46E5"
  }), " \u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E15\u0E32\u0E21\u0E41\u0E1A\u0E1A"), p3.list.length > 1 && React.createElement("select", {
    className: "er-sel",
    value: ver,
    onChange: e => setVer(e.target.value),
    style: {
      marginBottom: 8
    }
  }, p3.list.map(v => React.createElement("option", {
    key: v.id,
    value: v.id
  }, "V", v.id, " \xB7 ", v.name))), eq.map(e => React.createElement("div", {
    key: e.n,
    className: "er-eq"
  }, React.createElement("b", null, e.n), React.createElement("span", null, e.v))), md && !md.fromPlan && React.createElement("div", {
    className: "er-warn"
  }, "\u0E41\u0E1A\u0E1A\u0E19\u0E35\u0E49\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A \u2014 \u0E43\u0E0A\u0E49\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C 1 \u0E15\u0E31\u0E27\u0E15\u0E32\u0E21\u0E02\u0E19\u0E32\u0E14\u0E07\u0E32\u0E19 (", md.acKw, " kW) \u0E44\u0E1B\u0E01\u0E48\u0E2D\u0E19")), React.createElement("div", {
    className: "er-card"
  }, React.createElement("div", {
    className: "er-h"
  }, React.createElement(Icon, {
    name: "ruler",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E02\u0E19\u0E32\u0E14\u0E2B\u0E49\u0E2D\u0E07 (\u0E40\u0E21\u0E15\u0E23)"), React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E01\u0E27\u0E49\u0E32\u0E07"), numIn("w", L ? L.W.toFixed(1) : "อัตโนมัติ")), React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E25\u0E36\u0E01"), numIn("d", String(ER_DEF.d))), React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E2A\u0E39\u0E07"), numIn("h", String(ER_DEF.h))), md && !md.micro && React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), numIn("inv", String(md.nPlan || md.invs.length), 1)), React.createElement("label", {
    className: "er-tg"
  }, React.createElement("input", {
    type: "checkbox",
    checked: cfg.tray !== false,
    disabled: !canEdit,
    onChange: e => put({
      tray: e.target.checked
    })
  }), " \u0E23\u0E32\u0E07\u0E40\u0E04\u0E40\u0E1A\u0E34\u0E25\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E28\u0E35\u0E23\u0E29\u0E30 (\u0E15\u0E39\u0E49 AC \u2192 MDB)"), L && L.grew && React.createElement("div", {
    className: "er-warn"
  }, "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E40\u0E01\u0E34\u0E19\u0E02\u0E19\u0E32\u0E14\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07 \u2014 \u0E02\u0E22\u0E32\u0E22\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19 ", L.W.toFixed(1), " \xD7 ", L.D.toFixed(1), " \u0E21."), React.createElement("div", {
    className: "er-note"
  }, "\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07 = \u0E15\u0E32\u0E21\u0E41\u0E1A\u0E1A/\u0E02\u0E19\u0E32\u0E14\u0E1E\u0E2D\u0E14\u0E35\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C", canEdit ? " · บันทึกเอง" : " · ดูอย่างเดียว")), L && L.groups.length > 0 && React.createElement("div", {
    className: "er-card"
  }, React.createElement("div", {
    className: "er-h"
  }, React.createElement(Icon, {
    name: "hand",
    size: 14,
    color: "#F59E0B"
  }), " \u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C"), React.createElement("div", {
    className: "er-chips"
  }, L.groups.map(g => React.createElement("button", {
    key: g.k,
    "data-on": sel === g.k ? "1" : "0",
    onClick: () => setSel(sel === g.k ? null : g.k)
  }, g.th, g.moved && React.createElement("i", null, "\xB7 \u0E22\u0E49\u0E32\u0E22\u0E41\u0E25\u0E49\u0E27")))), gSel && React.createElement(React.Fragment, null, gSel.wall ? React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E15\u0E34\u0E14\u0E1C\u0E19\u0E31\u0E07", gSel.pos.r ? "ซ้าย · ห่างผนังหลัง" : "หลัง · ห่างผนังซ้าย"), edgeIn(gSel.pos.r ? "z" : "x")) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E2B\u0E48\u0E32\u0E07\u0E1C\u0E19\u0E31\u0E07\u0E0B\u0E49\u0E32\u0E22 (\u0E21.)"), edgeIn("x")), React.createElement("div", {
    className: "er-row"
  }, React.createElement("span", null, "\u0E2B\u0E48\u0E32\u0E07\u0E1C\u0E19\u0E31\u0E07\u0E2B\u0E25\u0E31\u0E07 (\u0E21.)"), edgeIn("z"))), canEdit && React.createElement("div", {
    className: "er-btns"
  }, React.createElement("button", {
    className: "er-btn",
    onClick: rot
  }, gSel.wall ? gSel.pos.r ? "ย้ายไปผนังหลัง" : "ย้ายไปผนังซ้าย" : "หมุน 90°"), gSel.moved && React.createElement("button", {
    className: "er-btn",
    onClick: () => setPos(gSel.k, null)
  }, "\u0E04\u0E37\u0E19\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E40\u0E14\u0E34\u0E21"))), L.clash.length > 0 && React.createElement("div", {
    className: "er-warn"
  }, L.clash.join(" · "), " \u2014 \u0E22\u0E49\u0E32\u0E22\u0E43\u0E2B\u0E49\u0E2B\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19"), canEdit && L.groups.some(g => g.moved) && React.createElement("div", {
    className: "er-btns"
  }, React.createElement("button", {
    className: "er-btn",
    onClick: () => {
      put({
        pos: null
      });
      setSel(null);
    }
  }, "\u0E08\u0E31\u0E14\u0E40\u0E23\u0E35\u0E22\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14")), React.createElement("div", {
    className: "er-note"
  }, canEdit ? "ลากอุปกรณ์ในภาพ 3D เพื่อย้าย (ปัดทีละ 5 ซม. · ใกล้ผนังดูดชิด) · ตู้ติดผนังอยู่บนผนังหลังหรือซ้าย · รางเคเบิลเดินตามเอง" : "ดูอย่างเดียว")), md && L && React.createElement("div", {
    className: "er-card"
  }, React.createElement("div", {
    className: "er-h"
  }, React.createElement(Icon, {
    name: "box",
    size: 14,
    color: "#4F46E5"
  }), " \u0E02\u0E19\u0E32\u0E14\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C (\u0E0B\u0E21.)"), React.createElement("div", {
    className: "er-dim er-dimh"
  }, React.createElement("span", null), React.createElement("i", null, "\u0E01\u0E27\u0E49\u0E32\u0E07"), React.createElement("i", null, "\u0E2A\u0E39\u0E07"), React.createElement("i", null, "\u0E25\u0E36\u0E01")), invOf(1) && dimRow("inv", "อินเวอร์เตอร์" + (md.model2 ? " · " + (md.model || "รุ่น 1") : ""), invOf(1).dim), invOf(1) && mountSel("inv", invOf(1)), invOf(2) && dimRow("inv2", "อินเวอร์เตอร์ · " + md.model2, invOf(2).dim), invOf(2) && mountSel("inv2", invOf(2)), L.rack && dimRow("dc", "ตู้ DC", L.def.dc), dimRow("ac", "ตู้ AC", L.def.ac), dimRow("mdb", md.home ? "ตู้เมน" : "ตู้ MDB", L.def.mdb), invOf(1) && React.createElement("div", {
    className: "er-note"
  }, "\u0E02\u0E19\u0E32\u0E14\u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C: ", invOf(1).src === "คลัง" ? "จากคลัง (รุ่น " + (md.model || "-") + ")" : invOf(1).src === "ห้อง" ? "ตั้งเองในห้องนี้" : "ประมาณจาก kW — กรอกขนาดตัวเครื่องในคลังสินค้าเพื่อให้ตรงทุกงาน"), React.createElement("div", {
    className: "er-note"
  }, "\u0E0A\u0E48\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E07 = \u0E04\u0E48\u0E32\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19 (\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E08\u0E32\u0E07) \xB7 \u0E01\u0E23\u0E2D\u0E01\u0E15\u0E32\u0E21\u0E15\u0E39\u0E49\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E07\u0E32\u0E19")), React.createElement("div", {
    className: "er-card"
  }, React.createElement("div", {
    className: "er-h"
  }, React.createElement(Icon, {
    name: "camera",
    size: 14,
    color: "var(--primary-dark)"
  }), " \u0E21\u0E38\u0E21\u0E01\u0E25\u0E49\u0E2D\u0E07 \xB7 \u0E20\u0E32\u0E1E"), React.createElement("div", {
    className: "er-cams"
  }, [["iso", "มุมไอโซ"], ["eye", "ระดับสายตา"], ["inv", "ใกล้อินเวอร์เตอร์"], ["top", "มุมบน"]].map(([k, th]) => React.createElement("button", {
    key: k,
    "data-on": cam === k ? "1" : "0",
    disabled: k === "inv" && md && !md.invs.length,
    onClick: () => go(k)
  }, th))), React.createElement("label", {
    className: "er-tg"
  }, React.createElement("input", {
    type: "checkbox",
    checked: bg === "white",
    onChange: e => setBg(e.target.checked ? "white" : "gray")
  }), " \u0E1E\u0E37\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07\u0E02\u0E32\u0E27 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E43\u0E2A\u0E48\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23)"), React.createElement("button", {
    className: "er-cta",
    style: {
      marginTop: 10
    },
    onClick: shot
  }, React.createElement(Icon, {
    name: "camera",
    size: 15,
    color: "#fff"
  }), " \u0E16\u0E48\u0E32\u0E22\u0E20\u0E32\u0E1E 4K"), msg && React.createElement("div", {
    className: "er-warn"
  }, msg))))), document.body);
}
function ErRoomCard({
  job,
  p3List,
  canEdit
}) {
  const [open, setOpen] = React.useState(null);
  const list = p3List && p3List.length ? p3List : [{
    id: "1",
    name: "ต้นแบบ"
  }];
  const many = list.length > 1;
  return React.createElement("div", {
    className: "dvc"
  }, React.createElement("div", {
    className: "dvc-hd"
  }, React.createElement("span", {
    className: "dvc-ic",
    style: {
      background: "color-mix(in srgb,#0EA5E9 13%,transparent)"
    }
  }, React.createElement(Icon, {
    name: "power",
    size: 16,
    color: "#0EA5E9"
  })), React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    className: "dvc-t"
  }, "\u0E2B\u0E49\u0E2D\u0E07\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C 3D"), React.createElement("span", {
    className: "dvc-s"
  }, "\u0E15\u0E39\u0E49 MDB \xB7 \u0E15\u0E39\u0E49 AC/DC \xB7 \u0E2D\u0E34\u0E19\u0E40\u0E27\u0E2D\u0E23\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E1A\u0E19\u0E23\u0E32\u0E07 \u2014 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E2D\u0E2D\u0E01\u0E41\u0E1A\u0E1A\u0E23\u0E30\u0E1A\u0E1A\u0E02\u0E2D\u0E07\u0E41\u0E1A\u0E1A 3D"))), React.createElement("div", {
    className: "dvc-list"
  }, list.map(v => React.createElement("div", {
    key: v.id,
    className: "dvc-row",
    role: "button",
    tabIndex: 0,
    onClick: () => setOpen(v.id),
    onKeyDown: e => {
      if (e.key === "Enter") setOpen(v.id);
    }
  }, React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, React.createElement("span", {
    className: "dvc-no"
  }, "V", v.id), React.createElement("span", {
    className: "dvc-nm"
  }, many ? "ห้องอุปกรณ์ · " + v.name : "ห้องอุปกรณ์")), React.createElement("span", {
    className: "dvc-mt"
  }, "\u0E08\u0E32\u0E01\u0E41\u0E1A\u0E1A 3D ", v.name, v.sum && v.sum.kwp ? " · " + v.sum.kwp + " kWp" : "")), React.createElement(Icon, {
    name: "arrowRight",
    size: 15,
    color: "var(--text-3)"
  })))), open && React.createElement(ErRoomStudio, {
    job: job,
    ver: open,
    canEdit: canEdit,
    onClose: () => setOpen(null)
  }));
}
Object.assign(window, {
  ER_DEF,
  erDcFace,
  erPlasticFace,
  erAcPanelFace,
  erAcGlassFace,
  erCuFace,
  erInvDim,
  erInvSpec,
  erModel,
  erGBox,
  erSnap,
  erLayout,
  erBuild3D,
  ErRoomView,
  ErRoomStudio,
  ErRoomCard
});
